// ============================================================
// De-AI Engine V3 — Rebuild From Ideas
// Takes a RebuildPlan (anchor + stance + primary + supporting)
// and produces a completely fresh text.
// NEVER reuses original sentences — reconstructs from idea text only.
// ============================================================

import type { RebuildPlan, ExtractedIdea, EmotionMode, IdeaType } from "./types";
import {
  REBUILD_ANCHORS,
  PRIMARY_IDEA_TEMPLATES,
  BLUNT_TRANSITIONS,
  REBUILD_ENDINGS,
} from "./presets";
import { capitalize, fixSpaces, fixCapitalization } from "./utils";

// ── Template fill ─────────────────────────────────────────────

function fillTemplate(template: string, idea: string): string {
  return template.replace("{idea}", idea.replace(/\.$/, "").trim());
}

// ── Deterministic pick ────────────────────────────────────────

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

// ── Idea → sentence builder ───────────────────────────────────
// Converts an ExtractedIdea into a voiced sentence
// based on its type and the emotion of the output

function ideaToSentence(idea: ExtractedIdea, emotion: EmotionMode, seed: number): string {
  const text = idea.text.replace(/\.$/, "").trim();

  // Type-specific framing
  const TYPE_FRAMES: Record<IdeaType, string[]> = {
    problem: [
      `The problem: ${text}.`,
      `${capitalize(text)} — and nobody fixes it.`,
      `Here's the breakdown: ${text}.`,
    ],
    cause: [
      `It happens because ${text}.`,
      `${capitalize(text)} — that's what drives it.`,
      `The cause is straightforward: ${text}.`,
    ],
    effect: [
      `The result? ${capitalize(text)}.`,
      `${capitalize(text)} — every time.`,
      `What actually happens: ${text}.`,
    ],
    advice: [
      `${capitalize(text)}.`,
      `The fix is simple: ${text}.`,
      `Do this: ${text}.`,
    ],
    observation: [
      `${capitalize(text)}.`,
      `Noticed: ${text}.`,
      `The pattern: ${capitalize(text)}.`,
    ],
    claim: [
      `${capitalize(text)}.`,
      `Here's the thing — ${text}.`,
      `${capitalize(text)} — that's the reality.`,
    ],
  };

  // Emotion-based frame preference
  const EMOTION_SEED_OFFSET: Record<EmotionMode, number> = {
    frustration: 0,
    disbelief:   1,
    curiosity:   2,
    confidence:  0,
    annoyance:   1,
  };

  const frames = TYPE_FRAMES[idea.type];
  const offset = EMOTION_SEED_OFFSET[emotion];
  return frames[(seed + offset) % frames.length];
}

// ── Main export ───────────────────────────────────────────────

export function rebuildFromIdeas(plan: RebuildPlan): string {
  const { anchor, stance, primaryIdea, supportingIdeas, emotion, intensity } = plan;
  const seed = primaryIdea.text.length + supportingIdeas.length;

  const parts: string[] = [];

  // ── 1. Anchor line ────────────────────────────────────────
  // Use plan.anchor if it's non-empty, otherwise pick from bank
  const anchorLine = anchor.trim()
    ? capitalize(anchor.trim().replace(/\.$/, "")) + "."
    : pick(REBUILD_ANCHORS, seed);
  parts.push(anchorLine);

  // ── 2. Primary idea — framed as opinionated stance ───────
  // Use plan.stance if substantive, otherwise use a template
  let stanceLine: string;
  if (stance.trim().length > 10) {
    stanceLine = capitalize(stance.trim().replace(/\.$/, "")) + ".";
  } else {
    const template = pick(PRIMARY_IDEA_TEMPLATES, seed);
    stanceLine = fillTemplate(template, primaryIdea.text);
  }
  parts.push(stanceLine);

  // ── 3. Supporting ideas ────────────────────────────────────
  // Aggressive: use all supporting + blunt transition
  // Medium: use first 2–3 supporting
  // Light: use first supporting idea only

  const maxSupporting: Record<typeof intensity, number> = {
    light:      1,
    medium:     2,
    aggressive: 4,
  };

  const limit = Math.min(supportingIdeas.length, maxSupporting[intensity]);
  const activeSupporting = supportingIdeas.slice(0, limit);

  for (let i = 0; i < activeSupporting.length; i++) {
    const idea = activeSupporting[i];
    const sentence = ideaToSentence(idea, emotion, seed + i);

    // Inject blunt transition before the last supporting idea (medium/aggressive)
    if (i === activeSupporting.length - 1 && intensity !== "light" && activeSupporting.length > 1) {
      const transition = pick(BLUNT_TRANSITIONS, seed + i);
      parts.push(transition);
    }

    parts.push(sentence);
  }

  // ── 4. Ending line (medium/aggressive only) ───────────────
  if (intensity !== "light") {
    const ending = pick(REBUILD_ENDINGS, seed);
    parts.push(ending);
  }

  // ── Join and clean ─────────────────────────────────────────
  const result = fixSpaces(fixCapitalization(parts.join(" ")));
  return result;
}
