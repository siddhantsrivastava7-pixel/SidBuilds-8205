// ============================================================
// De-AI Engine V2 — Rhythm Engine
// Destroys predictable sentence cadence.
// Forces variation: short punches, long runs, fragments.
// No LLM. Pure structural manipulation.
// ============================================================

import type { EmotionMode, RhythmProfile } from "./types";
import {
  splitSentences,
  wordCount,
  variance,
  capitalize,
  fixSpaces,
  fixCapitalization,
} from "./utils";

// ── Emotion-keyed fragment bank ───────────────────────────────
// Short punch sentences injected after strong assertions

const RHYTHM_FRAGMENTS: Record<EmotionMode, string[]> = {
  frustration: [
    "Every time.",
    "It's exhausting.",
    "This keeps happening.",
    "Again.",
    "And it never stops.",
    "Same pattern.",
  ],
  disbelief: [
    "Still.",
    "In this year.",
    "Every time.",
    "I can't believe it.",
    "Somehow.",
    "How is this still a thing?",
  ],
  curiosity: [
    "Think about that.",
    "Worth sitting with.",
    "Strange, right?",
    "Interesting.",
    "Worth questioning.",
    "The pattern is there.",
  ],
  confidence: [
    "Full stop.",
    "That's it.",
    "No exceptions.",
    "Simple.",
    "That's the answer.",
    "Always.",
  ],
  annoyance: [
    "Again.",
    "Come on.",
    "Really.",
    "This again.",
    "Every single time.",
    "Of course.",
  ],
};

// ── Sentence Classification ───────────────────────────────────

function classifySentence(s: string): "short" | "medium" | "long" {
  const wc = wordCount(s);
  if (wc <= 6) return "short";
  if (wc >= 15) return "long";
  return "medium";
}

// ── Main Export ───────────────────────────────────────────────

export function applyHumanRhythm(
  text: string,
  profile: RhythmProfile,
  emotion: EmotionMode,
  changes: string[]
): string {
  let sentences = splitSentences(text);
  if (sentences.length < 2) return text;

  let wcs = sentences.map(wordCount);
  const currentVariance = variance(wcs);

  const seed = text.length;
  const fragments = RHYTHM_FRAGMENTS[emotion];
  const fragment = fragments[seed % fragments.length];

  // ── Step 1: Ensure at least one short sentence (fragment injection) ──

  const hasShort = wcs.some((wc) => wc <= 6);
  if (!hasShort && profile.allowFragments) {
    // Inject after the sentence with the highest word count (the strongest assertion)
    const longestIdx = wcs.indexOf(Math.max(...wcs));
    const insertAt = Math.min(longestIdx + 1, sentences.length);
    sentences.splice(insertAt, 0, fragment);
    wcs.splice(insertAt, 0, wordCount(fragment));
    changes.push(`Injected rhythm fragment: "${fragment}"`);
  }

  // ── Step 2: Ensure at least one long sentence ─────────────────────

  const hasLong = wcs.some((wc) => wc >= 15);
  if (!hasLong && profile.allowRunOns && sentences.length >= 2) {
    // Find two adjacent medium-ish sentences to join into a run-on
    let joined = false;
    for (let i = 0; i < sentences.length - 1; i++) {
      if (
        wcs[i] >= 6 &&
        wcs[i + 1] >= 6 &&
        wcs[i] + wcs[i + 1] >= 15 &&
        classifySentence(sentences[i]) !== "short" &&
        classifySentence(sentences[i + 1]) !== "short"
      ) {
        const s1 = sentences[i].replace(/[.!?]+$/, "");
        const s2 = sentences[i + 1].charAt(0).toLowerCase() + sentences[i + 1].slice(1);
        sentences[i] = `${s1}, and ${s2}`;
        wcs[i] = wordCount(sentences[i]);
        sentences.splice(i + 1, 1);
        wcs.splice(i + 1, 1);
        changes.push(`Joined sentences to create long-form rhythm`);
        joined = true;
        break;
      }
    }
    if (!joined) {
      // Fallback: merge first two sentences
      if (sentences.length >= 2) {
        const s1 = sentences[0].replace(/[.!?]+$/, "");
        const s2 = sentences[1].charAt(0).toLowerCase() + sentences[1].slice(1);
        sentences[0] = `${s1} — ${s2}`;
        wcs[0] = wordCount(sentences[0]);
        sentences.splice(1, 1);
        wcs.splice(1, 1);
        changes.push(`Created em-dash run-on for rhythm`);
      }
    }
  }

  // ── Step 3: Em-dash interruption for conversational feel ──────────

  if (profile.allowRunOns && currentVariance < 20 && sentences.length >= 4) {
    // Find a pair where the second starts with "This", "They", "It", "That"
    for (let i = 0; i < sentences.length - 1; i++) {
      const nextStart = sentences[i + 1].trim().split(/\s+/)[0]?.toLowerCase() ?? "";
      const isLinkable = ["this", "they", "it", "that", "which", "and"].includes(nextStart);
      const bothMedium =
        wcs[i] >= 5 && wcs[i] <= 14 && wcs[i + 1] >= 5 && wcs[i + 1] <= 14;

      if (isLinkable && bothMedium) {
        const s1 = sentences[i].replace(/[.!?]+$/, "");
        const s2 = sentences[i + 1].charAt(0).toLowerCase() + sentences[i + 1].slice(1).replace(/[.!?]+$/, "");
        sentences[i] = `${s1} — ${s2}.`;
        wcs[i] = wordCount(sentences[i]);
        sentences.splice(i + 1, 1);
        wcs.splice(i + 1, 1);
        changes.push(`Applied em-dash interruption for conversational feel`);
        break;
      }
    }
  }

  // ── Step 4: Additional fragment if variance still low ─────────────

  const finalVariance = variance(wcs);
  if (finalVariance < 15 && profile.allowFragments && sentences.length >= 3) {
    // Pick a different fragment and inject near the end
    const alt = fragments[(seed + 1) % fragments.length];
    const insertAt = Math.max(sentences.length - 2, 1);
    if (sentences[insertAt] !== fragment && sentences[insertAt] !== alt) {
      sentences.splice(insertAt, 0, alt);
      changes.push(`Added trailing rhythm fragment: "${alt}"`);
    }
  }

  const result = fixSpaces(fixCapitalization(sentences.join(" ")));
  return result;
}
