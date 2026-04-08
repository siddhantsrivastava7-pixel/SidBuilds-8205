// ============================================================
// De-AI Engine V3 — Stance Enforcer
// Converts neutral advisory or descriptive phrasing into
// opinionated, direct human voice.
// Input: a sentence or short paragraph (post-rebuild)
// Output: the same content, stated as if by someone who has
//         a formed opinion and isn't hedging.
//
// All transforms are regex-based, deterministic.
// ============================================================

import type { EmotionMode } from "./types";
import { capitalize, fixSpaces, fixCapitalization } from "./utils";

// ── Stance transforms ─────────────────────────────────────────
// Ordered from most specific to most general.
// Applied in sequence — each transform runs once per call.

interface StanceTransform {
  pattern: RegExp;
  replacement: string;
  label: string;
}

const STANCE_TRANSFORMS: StanceTransform[] = [
  // "diversification reduces risk" → "diversification helps, sure"
  // i.e. "X reduces Y" → "X helps, sure"
  {
    pattern: /\b([\w][\w\s]{2,20}?)\s+(?:reduces?|minimizes?|mitigates?|lowers?|decreases?)\s+([\w\s]{3,20}?)(?=[.,!?]|$)/gi,
    replacement: "$1 helps, sure",
    label: "softened 'reduces X' → 'helps, sure'",
  },
  // "X can help you Y" → "X works"
  {
    pattern: /\b([\w][\w\s]{2,20}?)\s+can\s+help\s+(?:you\s+)?[\w\s]{2,20}?(?=[.,!?]|$)/gi,
    replacement: "$1 works",
    label: "collapsed 'X can help you Y' → 'X works'",
  },
  // "it is recommended to X" → "X"
  {
    pattern: /\bit\s+is\s+(?:highly\s+)?recommended\s+(?:that\s+(?:you\s+)?|to\s+)/gi,
    replacement: "",
    label: "removed 'it is recommended to'",
  },
  // "may want to consider" → "should"
  {
    pattern: /\bmay\s+want\s+to\s+consider\b/gi,
    replacement: "should",
    label: "replaced 'may want to consider' → 'should'",
  },
  // "it's worth considering" → "think about"
  {
    pattern: /\bit(?:'s| is)\s+worth\s+considering\b/gi,
    replacement: "think about",
    label: "replaced 'it's worth considering' → 'think about'",
  },
  // "tends to be" → "is usually"
  {
    pattern: /\btends?\s+to\s+be\b/gi,
    replacement: "is usually",
    label: "replaced 'tends to be' → 'is usually'",
  },
  // "can often lead to" → "leads to"
  {
    pattern: /\bcan\s+(?:often\s+)?lead\s+to\b/gi,
    replacement: "leads to",
    label: "replaced 'can often lead to' → 'leads to'",
  },
  // "may result in" → "results in"
  {
    pattern: /\bmay\s+result\s+in\b/gi,
    replacement: "results in",
    label: "replaced 'may result in' → 'results in'",
  },
  // "it is generally accepted that" → (delete)
  {
    pattern: /\bit\s+is\s+generally\s+(?:accepted|acknowledged|understood)\s+that\s*/gi,
    replacement: "",
    label: "removed 'it is generally accepted that'",
  },
  // "one of the most important" → "the most overlooked"
  {
    pattern: /\bone\s+of\s+the\s+most\s+important\b/gi,
    replacement: "the most overlooked",
    label: "replaced 'one of the most important' → 'the most overlooked'",
  },
  // "plays a [role/part] in" → "drives"
  {
    pattern: /\bplays?\s+a\s+(?:key\s+|critical\s+|important\s+|major\s+|central\s+)?(?:role|part)\s+in\b/gi,
    replacement: "drives",
    label: "replaced 'plays a role in' → 'drives'",
  },
  // "provides X with the ability to" → "lets X"
  {
    pattern: /\bprovides?\s+([\w\s]{1,15}?)\s+with\s+the\s+ability\s+to\b/gi,
    replacement: "lets $1",
    label: "replaced 'provides X with the ability to' → 'lets X'",
  },
  // "can be seen as" → "is"
  {
    pattern: /\bcan\s+be\s+seen\s+as\b/gi,
    replacement: "is",
    label: "replaced 'can be seen as' → 'is'",
  },
  // "many people believe that" → "most people think"
  {
    pattern: /\bmany\s+people\s+(?:believe|think)\s+that\b/gi,
    replacement: "most people think",
    label: "replaced 'many people believe that' → 'most people think'",
  },
  // "it has been shown that" → "the evidence shows"
  {
    pattern: /\bit\s+has\s+been\s+(?:shown|demonstrated|proven)\s+that\b/gi,
    replacement: "the evidence shows",
    label: "replaced 'it has been shown that' → 'the evidence shows'",
  },
];

// ── Emotion-keyed opinion intensifiers ───────────────────────
// These get appended to rebuilt sentences that are too flat
const OPINION_BOOSTERS: Record<EmotionMode, string[]> = {
  frustration:  ["That's the whole problem.", "And nobody fixes it.", "It keeps happening."],
  disbelief:    ["Still.", "Every time.", "How is this still a thing?"],
  curiosity:    ["Worth paying attention to.", "The pattern holds.", "Dig into this."],
  confidence:   ["Full stop.", "Not debatable.", "The numbers say so."],
  annoyance:    ["And yet.", "Obviously.", "Come on."],
};

// ── Main export ───────────────────────────────────────────────

export function enforceStance(
  text: string,
  emotion: EmotionMode,
  changes: string[]
): string {
  let result = text;

  for (const { pattern, replacement, label } of STANCE_TRANSFORMS) {
    const before = result;
    result = result.replace(pattern, replacement);
    if (result !== before) {
      changes.push(`Stance enforced: ${label}`);
    }
  }

  result = fixSpaces(result);
  result = fixCapitalization(result);
  return result;
}

// Inject one opinion booster at end of text if output is too flat / ends weakly
// Only fires if text doesn't already end with a short punchy sentence.
export function injectOpinionBooster(
  text: string,
  emotion: EmotionMode,
  changes: string[]
): string {
  const trimmed = text.trimEnd();
  // Already ends with a short punchy close (≤ 6 words after last period)
  const lastSentenceMatch = trimmed.match(/[.!?]\s*([^.!?]+)$/);
  if (lastSentenceMatch) {
    const lastWords = lastSentenceMatch[1].trim().split(/\s+/).length;
    if (lastWords <= 5) return text; // already punchy enough
  }

  const boosters = OPINION_BOOSTERS[emotion];
  const seed = text.length;
  const booster = boosters[seed % boosters.length];

  changes.push(`Injected opinion booster: "${booster}"`);
  return fixSpaces(`${trimmed} ${booster}`);
}
