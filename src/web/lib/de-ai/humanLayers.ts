// ============================================================
// De-AI Engine V2 — Human Layers
// Orchestrates: anchored draft construction + imperfect sentence transforms.
// This is the core V2 innovation — text is RECONSTRUCTED from a thought
// anchor, not just cleaned of AI patterns.
// ============================================================

import type { ThoughtAnchor, EmotionMode, HumanRewriteConfig } from "./types";
import {
  splitSentences,
  wordCount,
  normalize,
  capitalize,
  fixSpaces,
  fixCapitalization,
  escapeRegex,
} from "./utils";
import { GENERIC_OPENERS, CONCLUSION_PHRASES, TEACHING_TONE_MARKERS } from "./presets";

// ── Boundary Stripping ────────────────────────────────────────

// Remove the first sentence if it's a generic opener
// Remove the last sentence if it's a conclusion signpost
function stripBoundaries(sentences: string[]): string[] {
  let result = [...sentences];

  if (result.length > 1) {
    const first = normalize(result[0]);
    const isGeneric = GENERIC_OPENERS.some(
      (p) => first.startsWith(p) || first.includes(p)
    );
    if (isGeneric) result = result.slice(1);
  }

  if (result.length > 1) {
    const last = normalize(result[result.length - 1]);
    const isConclusion = CONCLUSION_PHRASES.some((p) => last.includes(p));
    if (isConclusion) result = result.slice(0, -1);
  }

  return result;
}

// ── Anchored Draft Construction ───────────────────────────────

// V2 core: instead of stripping the first sentence and prepending a filler opener,
// we reconstruct the text starting from the thought anchor and amplified stance.
// Remaining content sentences are kept (they'll be cleaned by subsequent passes).

export function buildAnchoredDraft(
  text: string,
  anchor: ThoughtAnchor,
  options: HumanRewriteConfig,
  changes: string[]
): string {
  const sentences = splitSentences(text);
  const cleaned = stripBoundaries(sentences);

  // Safety: if stripping removed everything, keep at least the middle sentences
  const content = cleaned.length > 0 ? cleaned : sentences.slice(1, -1);

  const parts: string[] = [];

  // Always open with the grounded anchor ("Saw this recently. / Keep seeing this.")
  parts.push(anchor.anchor);

  // Immediately follow with the opinionated stance
  parts.push(capitalize(anchor.stance));

  if (content.length === 0) {
    // Very short input: just use anchor + stance + coreThought
    parts.push(capitalize(anchor.coreThought) + ".");
    changes.push("Built anchored draft (short input — used anchor + stance + coreThought)");
  } else if (content.length <= 2) {
    // Short text: append remaining sentences as-is
    parts.push(...content);
    changes.push("Built anchored draft: anchor + stance + remaining content");
  } else {
    // Longer text: weave content around the coreThought
    const mid = Math.floor(content.length / 2);

    // First half of content
    parts.push(...content.slice(0, mid));

    // Inject coreThought in the middle only if it's substantively new
    const lowerText = normalize(text);
    const coreWords = normalize(anchor.coreThought)
      .split(/\s+/)
      .filter((w) => w.length > 4);
    const overlapRatio =
      coreWords.length > 0
        ? coreWords.filter((w) => lowerText.includes(w)).length / coreWords.length
        : 1;

    if (overlapRatio < 0.5) {
      parts.push(capitalize(anchor.coreThought) + ".");
      changes.push("Injected core thought mid-text (adds new perspective)");
    }

    // Second half of content
    parts.push(...content.slice(mid));
    changes.push("Built anchored draft: anchor + stance + content reconstruction");
  }

  return fixSpaces(parts.join(" "));
}

// ── Imperfect Sentence Engine ─────────────────────────────────

// These transforms make sentences sound like someone SPEAKING, not writing an essay.
// Applied after anchored draft construction, before rhythm engine.

interface SentenceTransform {
  pattern: RegExp;
  replacement: string;
  label: string;
}

const IMPERFECT_TRANSFORMS: SentenceTransform[] = [
  // "X is important / critical / essential" → "X is what people keep overlooking"
  {
    pattern: /\b([\w][\w\s]{3,25}?)\s+(is|are)\s+(important|critical|essential|crucial|key|vital)\b/gi,
    replacement: "$1 $2 what people keep overlooking",
    label: "Converted 'is important' → active human observation",
  },
  // "one must / you should / investors should / professionals should" → "people rarely"
  {
    pattern: /\b(one must|we must|you should|investors should|professionals should|people should|one should)\b/gi,
    replacement: "people rarely",
    label: "Converted prescriptive 'should' → observed behavior",
  },
  // "research consistently shows that" → "the pattern keeps proving"
  {
    pattern: /\bresearch\s+(?:consistently\s+)?shows?\s+that\b/gi,
    replacement: "the pattern keeps proving",
    label: "Replaced 'research shows that' → 'the pattern keeps proving'",
  },
  // "[word(s)] data shows that" → "the numbers say" (handles "historical data shows that")
  {
    pattern: /\b(?:\w+\s+)?data\s+shows?\s+that\b/gi,
    replacement: "the numbers say",
    label: "Replaced '[X] data shows that' → 'the numbers say'",
  },
  // "X shows that Y" → "X keeps proving Y"
  {
    pattern: /\b([\w][\w\s]{2,20}?)\s+shows?\s+that\b/gi,
    replacement: "$1 keeps proving",
    label: "Replaced '[X] shows that' → '[X] keeps proving'",
  },
  // "it is important to" → "you have to"
  {
    pattern: /\bit(?:'s| is)\s+(?:very\s+)?important\s+to\b/gi,
    replacement: "you have to",
    label: "Simplified 'it is important to' → 'you have to'",
  },
  // "in order to achieve" → "to get to"
  {
    pattern: /\bin order to\b/gi,
    replacement: "to",
    label: "Removed 'in order to' → 'to'",
  },
  // "has the ability to" → "can"
  {
    pattern: /\bhas the ability to\b/gi,
    replacement: "can",
    label: "Simplified 'has the ability to' → 'can'",
  },
  // "is able to" → "can"
  {
    pattern: /\bis able to\b/gi,
    replacement: "can",
    label: "Simplified 'is able to' → 'can'",
  },
  // "due to the fact that" → "because"
  {
    pattern: /\bdue to the fact that\b/gi,
    replacement: "because",
    label: "Simplified 'due to the fact that' → 'because'",
  },
  // "in the event that" → "if"
  {
    pattern: /\bin the event that\b/gi,
    replacement: "if",
    label: "Simplified 'in the event that' → 'if'",
  },
  // "at this point in time" → "now"
  {
    pattern: /\bat this point in time\b/gi,
    replacement: "now",
    label: "Simplified 'at this point in time' → 'now'",
  },
  // "a large number of" → "many"
  {
    pattern: /\ba large number of\b/gi,
    replacement: "many",
    label: "Simplified 'a large number of' → 'many'",
  },
  // "on a regular basis" → "regularly"
  {
    pattern: /\bon a regular basis\b/gi,
    replacement: "regularly",
    label: "Simplified 'on a regular basis' → 'regularly'",
  },
];

export function applyImperfectSentences(
  text: string,
  _emotion: EmotionMode,
  changes: string[]
): string {
  let result = text;

  for (const { pattern, replacement, label } of IMPERFECT_TRANSFORMS) {
    const before = result;
    result = result.replace(pattern, replacement);
    if (result !== before) {
      changes.push(label);
    }
  }

  result = fixSpaces(result);
  result = fixCapitalization(result);
  return result;
}
