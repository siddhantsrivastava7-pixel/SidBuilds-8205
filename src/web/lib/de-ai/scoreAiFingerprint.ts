// ============================================================
// De-AI Engine — Scoring Engine
// Returns a 0–100 AI fingerprint score. Higher = more AI-like.
// Fully deterministic, no LLM calls.
// ============================================================

import type { ScoreBreakdown, WeightEntry } from "./types";
import {
  GENERIC_OPENERS,
  CONCLUSION_PHRASES,
  TRANSITION_WORDS,
  TEACHING_TONE_MARKERS,
  EMOTIONAL_WORDS,
  CORPORATE_BUZZWORDS,
  HEDGE_PHRASES,
  OVERUSED_ADVERBS,
} from "./presets";
import {
  splitSentences,
  splitParagraphs,
  findMatches,
  countMatches,
  wordCount,
  variance,
  clamp,
  normalize,
} from "./utils";

// ── Internal helpers ─────────────────────────────────────────

function hasGenericOpener(text: string): boolean {
  const sentences = splitSentences(text);
  const first2 = sentences.slice(0, 2).join(" ");
  return findMatches(first2, GENERIC_OPENERS).length > 0;
}

function hasConclusion(text: string): boolean {
  return findMatches(text, CONCLUSION_PHRASES).length > 0;
}

function transitionRatio(text: string): number {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return 0;
  const count = countMatches(text, TRANSITION_WORDS);
  return count / sentences.length;
}

function teachingToneCount(text: string): number {
  return countMatches(text, TEACHING_TONE_MARKERS);
}

function sentenceLengthVariance(text: string): number {
  const sentences = splitSentences(text);
  if (sentences.length < 2) return 0;
  return variance(sentences.map(wordCount));
}

function paragraphSymmetryScore(text: string): number {
  const paragraphs = splitParagraphs(text);
  if (paragraphs.length < 2) return 0;
  const counts = paragraphs.map(wordCount);
  const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
  if (mean === 0) return 0;
  const avgDev = counts.reduce((sum, c) => sum + Math.abs(c - mean) / mean, 0) / counts.length;
  return clamp(1 - avgDev, 0, 1);
}

function hasListicleTone(text: string): boolean {
  const listicleRe = /\b(here are (?:\d+|a few|several|many|some|the (?:top|key|main|best)))\b/i;
  const numberedRe = /^\s*\d+[.)]\s+\w/m;
  const bulletRe = /^\s*[-•*]\s+\w/m;
  return listicleRe.test(text) || numberedRe.test(text) || bulletRe.test(text);
}

function emotionalIntensity(text: string): number {
  const total = wordCount(text);
  if (total === 0) return 0;
  const lower = normalize(text);
  let count = 0;
  for (const word of EMOTIONAL_WORDS) {
    const re = new RegExp(`\\b${word}\\b`, "gi");
    const matches = lower.match(re);
    if (matches) count += matches.length;
  }
  return clamp(count / total, 0, 1);
}

function passiveVoiceCount(text: string): number {
  const re = /\b(?:is|are|was|were|be|been|being)\s+\w+(?:ed|en)\b/gi;
  return (text.match(re) || []).length;
}

function buzzwordCount(text: string): number {
  return countMatches(text, CORPORATE_BUZZWORDS);
}

function adverbDensity(text: string): number {
  const total = wordCount(text);
  if (total === 0) return 0;
  return clamp(countMatches(text, OVERUSED_ADVERBS) / total, 0, 1);
}

function hedgePhraseCount(text: string): number {
  return countMatches(text, HEDGE_PHRASES);
}

function sentenceStarterRepetition(text: string): number {
  const sentences = splitSentences(text);
  if (sentences.length < 3) return 0;
  const starters: Record<string, number> = {};
  for (const s of sentences) {
    const first = s.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "") ?? "";
    if (first) starters[first] = (starters[first] ?? 0) + 1;
  }
  const maxCount = Math.max(...Object.values(starters));
  return clamp(maxCount / sentences.length, 0, 1);
}

// ── Main Scoring Function ─────────────────────────────────────

export function scoreAiFingerprint(text: string): { score: number; breakdown: ScoreBreakdown } {
  if (!text.trim()) {
    const emptyBreakdown: ScoreBreakdown = {
      total: 0,
      weights: {},
    };
    return { score: 0, breakdown: emptyBreakdown };
  }

  // Compute raw metrics
  const genericOpener = hasGenericOpener(text);
  const conclusionPhrase = hasConclusion(text);
  const tRatio = transitionRatio(text);
  const toneCount = teachingToneCount(text);
  const sentVariance = sentenceLengthVariance(text);
  const symScore = paragraphSymmetryScore(text);
  const listicle = hasListicleTone(text);
  const emotIntensity = emotionalIntensity(text);
  const pvCount = passiveVoiceCount(text);
  const bwCount = buzzwordCount(text);
  const advDensity = adverbDensity(text);
  const hedgeCount = hedgePhraseCount(text);
  const starterRep = sentenceStarterRepetition(text);

  // ── Weighted penalties ────────────────────────────────────
  // Weights are rebalanced across 13 signals.
  // Total theoretical max slightly exceeds 100 — clamped at end.

  // Generic opener: binary, 18 pts
  const w_genericOpener: WeightEntry = {
    raw: genericOpener ? 1 : 0,
    weighted: genericOpener ? 18 : 0,
    label: genericOpener
      ? "Generic opener detected (+18)"
      : "No generic opener (0)",
  };

  // Conclusion phrase: binary, 9 pts
  const w_conclusionPhrase: WeightEntry = {
    raw: conclusionPhrase ? 1 : 0,
    weighted: conclusionPhrase ? 9 : 0,
    label: conclusionPhrase
      ? "Conclusion signpost detected (+9)"
      : "No conclusion phrase (0)",
  };

  // Transition density: scaled 0–12 based on ratio (0.5 ratio = max)
  const w_transitionDensity: WeightEntry = (() => {
    const pts = clamp((tRatio / 0.5) * 12, 0, 12);
    return {
      raw: Math.round(tRatio * 100) / 100,
      weighted: Math.round(pts * 10) / 10,
      label: `Transition density ${(tRatio * 100).toFixed(0)}% of sentences (+${pts.toFixed(1)})`,
    };
  })();

  // Teaching tone: 2 pts per marker, max 9
  const w_teachingTone: WeightEntry = (() => {
    const pts = clamp(toneCount * 2, 0, 9);
    return {
      raw: toneCount,
      weighted: pts,
      label: `Teaching tone markers: ${toneCount} found (+${pts})`,
    };
  })();

  // Sentence uniformity: inverse-scaled on variance (variance ≥ 25 → 0 pts), max 10
  const w_sentenceUniformity: WeightEntry = (() => {
    const pts = clamp(((25 - sentVariance) / 25) * 10, 0, 10);
    return {
      raw: Math.round(sentVariance * 10) / 10,
      weighted: Math.round(pts * 10) / 10,
      label: `Sentence length variance ${sentVariance.toFixed(1)} (+${pts.toFixed(1)})`,
    };
  })();

  // Paragraph symmetry: 0–7 based on symmetry score
  const w_paragraphSymmetry: WeightEntry = (() => {
    const pts = clamp(symScore * 7, 0, 7);
    return {
      raw: Math.round(symScore * 100) / 100,
      weighted: Math.round(pts * 10) / 10,
      label: `Paragraph symmetry score ${symScore.toFixed(2)} (+${pts.toFixed(1)})`,
    };
  })();

  // Listicle tone: binary, 8 pts
  const w_listicleTone: WeightEntry = {
    raw: listicle ? 1 : 0,
    weighted: listicle ? 8 : 0,
    label: listicle
      ? "Listicle/list format detected (+8)"
      : "No listicle tone (0)",
  };

  // Emotional flatness: inverse-scaled (intensity ≥ 0.05 → 0 pts), max 7
  const w_emotionalFlatness: WeightEntry = (() => {
    const pts = clamp(((0.05 - emotIntensity) / 0.05) * 7, 0, 7);
    return {
      raw: Math.round(emotIntensity * 1000) / 1000,
      weighted: Math.round(pts * 10) / 10,
      label: `Emotional intensity ${(emotIntensity * 100).toFixed(1)}% (+${pts.toFixed(1)})`,
    };
  })();

  // Passive voice: 2 pts per instance, max 10
  const w_passiveVoice: WeightEntry = (() => {
    const pts = clamp(pvCount * 2, 0, 10);
    return {
      raw: pvCount,
      weighted: pts,
      label: `Passive voice constructions: ${pvCount} found (+${pts})`,
    };
  })();

  // Buzzword density: 2 pts per buzzword, max 10
  const w_buzzwordDensity: WeightEntry = (() => {
    const pts = clamp(bwCount * 2, 0, 10);
    return {
      raw: bwCount,
      weighted: pts,
      label: `Corporate buzzwords: ${bwCount} found (+${pts})`,
    };
  })();

  // Adverb overuse: inverse-scaled, max 6 (density ≥ 0.08 → max)
  const w_adverbDensity: WeightEntry = (() => {
    const pts = clamp((advDensity / 0.08) * 6, 0, 6);
    return {
      raw: Math.round(advDensity * 1000) / 1000,
      weighted: Math.round(pts * 10) / 10,
      label: `Adverb density ${(advDensity * 100).toFixed(1)}% (+${pts.toFixed(1)})`,
    };
  })();

  // Hedge phrases: 1.5 pts each, max 6
  const w_hedgePhrases: WeightEntry = (() => {
    const pts = clamp(hedgeCount * 1.5, 0, 6);
    return {
      raw: hedgeCount,
      weighted: Math.round(pts * 10) / 10,
      label: `Hedge phrases: ${hedgeCount} found (+${pts.toFixed(1)})`,
    };
  })();

  // Sentence starter repetition: scaled 0–5 (ratio ≥ 0.5 = max)
  const w_sentenceStarterRepetition: WeightEntry = (() => {
    const pts = clamp((starterRep / 0.5) * 5, 0, 5);
    return {
      raw: Math.round(starterRep * 100) / 100,
      weighted: Math.round(pts * 10) / 10,
      label: `Sentence starter repetition ${(starterRep * 100).toFixed(0)}% (+${pts.toFixed(1)})`,
    };
  })();

  const weights: Record<string, WeightEntry> = {
    genericOpener: w_genericOpener,
    conclusionPhrase: w_conclusionPhrase,
    transitionDensity: w_transitionDensity,
    teachingTone: w_teachingTone,
    sentenceUniformity: w_sentenceUniformity,
    paragraphSymmetry: w_paragraphSymmetry,
    listicleTone: w_listicleTone,
    emotionalFlatness: w_emotionalFlatness,
    passiveVoice: w_passiveVoice,
    buzzwordDensity: w_buzzwordDensity,
    adverbDensity: w_adverbDensity,
    hedgePhrases: w_hedgePhrases,
    sentenceStarterRepetition: w_sentenceStarterRepetition,
  };

  const rawTotal = Object.values(weights).reduce((sum, w) => sum + w.weighted, 0);
  const score = Math.round(clamp(rawTotal, 0, 100));

  return {
    score,
    breakdown: { total: score, weights },
  };
}
