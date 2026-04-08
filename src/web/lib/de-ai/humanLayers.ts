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
import {
  GENERIC_OPENERS,
  CONCLUSION_PHRASES,
  TEACHING_TONE_MARKERS,
  HARD_BANNED_PHRASES,
  CONVERSATIONAL_INJECTORS,
} from "./presets";

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

// ── Hard-Ban Stripper (Rule 6) ────────────────────────────────
// Removes phrases that must NEVER appear in output, regardless of source.

export function stripHardBanned(
  text: string,
  changes: string[]
): string {
  let result = text;

  // Sort longest first to avoid partial-match conflicts
  const sorted = [...HARD_BANNED_PHRASES].sort((a, b) => b.length - a.length);

  for (const phrase of sorted) {
    const escaped = escapeRegex(phrase);
    // Match phrase optionally followed by comma, colon, or trailing space
    const re = new RegExp(`\\b${escaped}\\b[,:]?\\s*`, "gi");
    const matches = result.match(re);
    if (!matches || matches.length === 0) continue;
    result = result.replace(re, "");
    changes.push(`Stripped hard-banned phrase: "${phrase}"`);
  }

  result = fixSpaces(result);
  result = fixCapitalization(result);
  return result;
}

// ── Conversational Injector (Rule 8) ─────────────────────────
// Weaves 1–2 conversational phrases into the text so it sounds spoken.
// Picks injection points deterministically (no randomness).

export function injectConversationalPhrases(
  text: string,
  emotion: EmotionMode,
  changes: string[]
): string {
  const sentences = splitSentences(text);
  if (sentences.length < 2) return text;

  const injectors = CONVERSATIONAL_INJECTORS[emotion];
  const seed = text.length;

  // Never inject at position 0 (the anchor is already grounded)
  // Inject at position 1 (after the opener) and near the middle

  // Injection 1: after sentence 1 — prepend injector to sentence 2
  const injector1 = injectors[seed % injectors.length];

  // Lowercase start of sentence 2 to blend naturally
  const s2 = sentences[1];
  const s2Lower = s2.charAt(0).toLowerCase() + s2.slice(1);
  sentences[1] = `${capitalize(injector1)} ${s2Lower}`;

  // Injection 2: at mid-point — only if text is long enough and injector is different
  if (sentences.length >= 5) {
    const injector2 = injectors[(seed + 2) % injectors.length];
    if (injector2 !== injector1) {
      const mid = Math.floor(sentences.length / 2);
      const sm = sentences[mid];
      const smLower = sm.charAt(0).toLowerCase() + sm.slice(1);
      sentences[mid] = `${capitalize(injector2)} ${smLower}`;
      changes.push(`Injected conversational phrases: "${injector1.trim()}" + "${injector2.trim()}"`);
    } else {
      changes.push(`Injected conversational phrase: "${injector1.trim()}"`);
    }
  } else {
    changes.push(`Injected conversational phrase: "${injector1.trim()}"`);
  }

  return fixSpaces(fixCapitalization(sentences.join(" ")));
}

// ── Sentence Structure Breaker (Rules 1 + 7) ─────────────────
// Aggressively destroys preserved original sentence structure.
// After reconstruction, content sentences still tend to be too similar to source.
// This pass: splits overly long sentences, drops redundant restatements.

export function breakSentenceStructure(
  text: string,
  changes: string[]
): string {
  let sentences = splitSentences(text);
  if (sentences.length < 2) return text;

  const result: string[] = [];
  let structureChanged = false;

  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    const wc = wordCount(s);

    // Long sentence (>22 words): try to split at natural break points
    if (wc > 22) {
      // Priority break points: " — ", " which ", " and this ", " but this "
      const breakPatterns = [
        /\s+—\s+/,
        /,\s+and\s+this\s+/i,
        /,\s+but\s+this\s+/i,
        /,\s+which\s+means\s+/i,
        /\s+and\s+(?=\w)/,
      ];

      let split = false;
      for (const pat of breakPatterns) {
        const match = s.match(pat);
        if (match && match.index !== undefined) {
          const breakPos = match.index;
          const part1 = s.slice(0, breakPos).trim().replace(/,\s*$/, "") + ".";
          const part2 = capitalize(s.slice(breakPos + match[0].length).trim());
          if (wordCount(part1) >= 5 && wordCount(part2) >= 4) {
            result.push(part1, part2);
            split = true;
            structureChanged = true;
            break;
          }
        }
      }
      if (!split) result.push(s);
    }
    // Two consecutive short sentences (<= 6 words each): merge them conversationally
    else if (
      wc <= 6 &&
      i + 1 < sentences.length &&
      wordCount(sentences[i + 1]) <= 6
    ) {
      const combined =
        s.replace(/[.!?]+$/, "") +
        " — " +
        sentences[i + 1].charAt(0).toLowerCase() +
        sentences[i + 1].slice(1);
      result.push(combined);
      i++; // Skip next sentence — we consumed it
      structureChanged = true;
    } else {
      result.push(s);
    }
  }

  if (structureChanged) {
    changes.push("Broke up sentence structure for natural variation");
  }

  return fixSpaces(fixCapitalization(result.join(" ")));
}
