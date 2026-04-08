import type { ToolOptions } from "./ToolControls";
import type { ProcessResult } from "./ToolResults";
import type { RewriteMode, EmotionMode, RewriteIntensity } from "@/lib/de-ai/types";
import { rewriteHuman } from "@/lib/de-ai/rewriteHuman";

// ── Type maps: UI labels → engine constants ───────────────────

const MODE_MAP: Record<ToolOptions["mode"], RewriteMode> = {
  "Raw Human":    "rawHuman",
  "Rant Mode":    "frustratedRant",
  "Founder Voice":"founderVoice",
  "Casual / Real":"casualInternet",
  "Hot Take":     "sharpOpinion",
};

const EMOTION_MAP: Record<ToolOptions["emotion"], EmotionMode> = {
  "Frustration": "frustration",
  "Disbelief":   "disbelief",
  "Curiosity":   "curiosity",
  "Confidence":  "confidence",
  "Annoyance":   "annoyance",
};

const INTENSITY_MAP: Record<ToolOptions["intensity"], RewriteIntensity> = {
  "Light":      "light",
  "Medium":     "medium",
  "Aggressive": "aggressive",
};

// ── Map engine's internal change log → readable UI labels ─────

function humanizeChanges(engineChanges: string[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  const add = (label: string) => {
    if (!seen.has(label)) { seen.add(label); result.push(label); }
  };

  for (const c of engineChanges) {
    const l = c.toLowerCase();
    if (l.includes("thought anchor") || l.includes("anchored draft"))
      add("reframed from a human perspective");
    else if (l.includes("generic opener"))
      add("killed the AI opener");
    else if (l.includes("transition"))
      add("removed essay transitions");
    else if (l.includes("teaching phrase") || l.includes("listicle"))
      add("cut the lecture tone");
    else if (l.includes("buzzword") || l.includes("plain language"))
      add("replaced corporate jargon");
    else if (l.includes("hedge phrase"))
      add("removed hedging language");
    else if (l.includes("filler"))
      add("cut filler words");
    else if (l.includes("rhythm") || l.includes("fragment") || l.includes("em-dash") || l.includes("run-on"))
      add("varied sentence rhythm");
    else if (l.includes("emotional opener") || l.includes("emotion"))
      add("locked emotional tone");
    else if (l.includes("split long") || l.includes("merged"))
      add("restructured sentence flow");
    else if (l.includes("imperfect") || l.includes("converted") || l.includes("replaced '") || l.includes("simplified"))
      add("replaced stiff phrasing with how people actually talk");
    else if (l.includes("core thought") || l.includes("injected"))
      add("added a grounded perspective");
    else if (l.includes("passive"))
      add("removed passive constructions");
    else if (l.includes("paragraph"))
      add("broke up the structure");
  }

  // Ensure there's always at least something shown
  if (result.length === 0) result.push("broke up the structure");
  return result;
}

// ── Main export ───────────────────────────────────────────────

export async function processText(
  input: string,
  options: ToolOptions,
): Promise<ProcessResult> {
  // Yield to the event loop so React renders the loading state
  // before the synchronous engine work begins
  await new Promise<void>((r) => setTimeout(r, 0));

  const result = rewriteHuman(input, {
    mode:             MODE_MAP[options.mode],
    emotion:          EMOTION_MAP[options.emotion],
    intensity:        INTENSITY_MAP[options.intensity],
    useThoughtAnchor: true,
    useRhythmEngine:  true,
  });

  return {
    output:      result.rewrittenText,
    scoreBefore: result.beforeScore,
    scoreAfter:  result.afterScore,
    changes:     humanizeChanges(result.changes),
  };
}
