// ============================================================
// De-AI Engine — Analysis Engine
// Detects AI fingerprints and returns structured issues + stats.
// ============================================================

import type { AnalysisResult, AnalysisIssue, AnalysisStats } from "./types";
import {
  GENERIC_OPENERS,
  CONCLUSION_PHRASES,
  TRANSITION_WORDS,
  TEACHING_TONE_MARKERS,
  FILLER_PHRASES,
  EMOTIONAL_WORDS,
  EXPLANATORY_PHRASES,
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
import { scoreAiFingerprint } from "./scoreAiFingerprint";

// ── Stats Computation ─────────────────────────────────────────

function computeStats(text: string): AnalysisStats {
  const paragraphs = splitParagraphs(text);
  const paragraphCount = Math.max(paragraphs.length, 1);

  const sentences = splitSentences(text);
  const sentenceWordCounts = sentences.map(wordCount);

  const averageSentenceLength =
    sentenceWordCounts.length > 0
      ? sentenceWordCounts.reduce((a, b) => a + b, 0) / sentenceWordCounts.length
      : 0;

  const sentenceLengthVariance =
    sentenceWordCounts.length >= 2 ? variance(sentenceWordCounts) : 0;

  const transitionCount = countMatches(text, TRANSITION_WORDS);

  // Generic opener: check first 2 sentences only
  const first2 = sentences.slice(0, 2).join(" ");
  const genericOpenerFound = findMatches(first2, GENERIC_OPENERS).length > 0;

  const conclusionFound = findMatches(text, CONCLUSION_PHRASES).length > 0;

  // Listicle: "here are N/few/some...", numbered lists, or bullets
  const listicleRe = /\b(here are (?:\d+|a few|several|many|some|the (?:top|key|main|best)))\b/i;
  const numberedRe = /^\s*\d+[.)]\s+\w/m;
  const bulletRe = /^\s*[-•*]\s+\w/m;
  const listicleToneFound =
    listicleRe.test(text) || numberedRe.test(text) || bulletRe.test(text);

  // Emotional intensity: ratio of emotional words to total words
  const totalWords = wordCount(text);
  const lower = normalize(text);
  let emotionalWordCount = 0;
  for (const word of EMOTIONAL_WORDS) {
    const re = new RegExp(`\\b${word}\\b`, "gi");
    const m = lower.match(re);
    if (m) emotionalWordCount += m.length;
  }
  const emotionalIntensity = totalWords > 0
    ? clamp(emotionalWordCount / totalWords, 0, 1)
    : 0;

  // Symmetry score: how uniform paragraph sizes are (1.0 = perfectly even)
  let symmetryScore = 0;
  if (paragraphs.length >= 2) {
    const pwc = paragraphs.map(wordCount);
    const mean = pwc.reduce((a, b) => a + b, 0) / pwc.length;
    if (mean > 0) {
      const avgDev = pwc.reduce((sum, c) => sum + Math.abs(c - mean) / mean, 0) / pwc.length;
      symmetryScore = clamp(1 - avgDev, 0, 1);
    }
  }

  // Passive voice: "is/are/was/were/be/been/being + past participle (-ed/-en)"
  const passiveRe = /\b(?:is|are|was|were|be|been|being)\s+\w+(?:ed|en)\b/gi;
  const passiveVoiceCount = (text.match(passiveRe) || []).length;

  // Corporate buzzwords
  const buzzwordCount = countMatches(text, CORPORATE_BUZZWORDS);

  // Overused adverbs density
  const adverbCount = countMatches(text, OVERUSED_ADVERBS);
  const adverbDensity = totalWords > 0 ? clamp(adverbCount / totalWords, 0, 1) : 0;

  // Hedge phrase count
  const hedgePhraseCount = countMatches(text, HEDGE_PHRASES);

  // Sentence starter repetition: ratio of sentences beginning with the same word
  let sentenceStarterRepetition = 0;
  if (sentences.length >= 3) {
    const starters: Record<string, number> = {};
    for (const s of sentences) {
      const first = s.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "") ?? "";
      if (first) starters[first] = (starters[first] ?? 0) + 1;
    }
    const maxCount = Math.max(...Object.values(starters));
    sentenceStarterRepetition = clamp(maxCount / sentences.length, 0, 1);
  }

  return {
    paragraphCount,
    averageSentenceLength,
    sentenceLengthVariance,
    transitionCount,
    genericOpenerFound,
    conclusionFound,
    listicleToneFound,
    emotionalIntensity,
    symmetryScore,
    passiveVoiceCount,
    buzzwordCount,
    adverbDensity,
    hedgePhraseCount,
    sentenceStarterRepetition,
  };
}

// ── Issue Checkers ────────────────────────────────────────────

function checkGenericOpener(text: string, stats: AnalysisStats): AnalysisIssue | null {
  if (!stats.genericOpenerFound) return null;
  const sentences = splitSentences(text);
  const first2 = sentences.slice(0, 2).join(" ");
  const matches = findMatches(first2, GENERIC_OPENERS);
  return {
    id: "generic-opener",
    title: "Generic AI-style opening",
    severity: "high",
    explanation:
      "The text opens with a generic template phrase that immediately signals AI-generated writing.",
    matches,
  };
}

function checkConclusionPhrase(text: string, stats: AnalysisStats): AnalysisIssue | null {
  if (!stats.conclusionFound) return null;
  const matches = findMatches(text, CONCLUSION_PHRASES);
  return {
    id: "conclusion-phrase",
    title: "Essay-style conclusion signpost",
    severity: "medium",
    explanation:
      "Conclusion signpost phrases like 'in conclusion' or 'to summarize' make writing feel like a structured AI essay.",
    matches,
  };
}

function checkTransitionDensity(text: string, stats: AnalysisStats): AnalysisIssue | null {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return null;
  const ratio = stats.transitionCount / sentences.length;
  if (ratio <= 0.25) return null;

  const severity = ratio > 0.4 ? "high" : "medium";
  const matches = findMatches(text, TRANSITION_WORDS);
  return {
    id: "transition-density",
    title: "Over-use of transition words",
    severity,
    explanation: `Transition words appear in ${(ratio * 100).toFixed(0)}% of sentences, creating an over-structured academic tone.`,
    matches,
  };
}

function checkTeachingTone(text: string, _stats: AnalysisStats): AnalysisIssue | null {
  const matches = findMatches(text, TEACHING_TONE_MARKERS);
  if (matches.length === 0) return null;
  return {
    id: "teaching-tone",
    title: "Instructional / lecture tone",
    severity: "medium",
    explanation:
      "Phrases like 'here are', 'this shows that', or 'it is important to understand' give writing an AI lecture quality.",
    matches,
  };
}

function checkSentenceUniformity(_text: string, stats: AnalysisStats): AnalysisIssue | null {
  const { sentenceLengthVariance: v } = stats;
  if (v >= 25) return null;

  const severity = v < 5 ? "high" : v < 15 ? "medium" : "low";
  return {
    id: "sentence-uniformity",
    title: "Sentences are too uniform in length",
    severity,
    explanation: `Sentence length variance is ${v.toFixed(1)} words² — sentences are too similar in length, which sounds robotic.`,
    matches: [],
  };
}

function checkParagraphSymmetry(_text: string, stats: AnalysisStats): AnalysisIssue | null {
  if (stats.paragraphCount < 2) return null;
  if (stats.symmetryScore <= 0.75) return null;

  const severity = stats.symmetryScore > 0.9 ? "medium" : "low";
  return {
    id: "paragraph-symmetry",
    title: "Paragraphs are suspiciously uniform",
    severity,
    explanation: `Symmetry score is ${stats.symmetryScore.toFixed(2)} — paragraphs are nearly identical in length, suggesting templated structure.`,
    matches: [],
  };
}

function checkListicleTone(text: string, stats: AnalysisStats): AnalysisIssue | null {
  if (!stats.listicleToneFound) return null;
  const listicleRe = /\b(here are (?:\d+|a few|several|many|some|the (?:top|key|main|best)) \w+)/i;
  const m = text.match(listicleRe);
  return {
    id: "listicle-tone",
    title: "List-format / listicle language",
    severity: "medium",
    explanation:
      "List-format language ('here are N...') or numbered/bulleted lists are strong AI writing markers.",
    matches: m ? [m[0]] : [],
  };
}

function checkEmotionalFlatness(_text: string, stats: AnalysisStats): AnalysisIssue | null {
  if (stats.emotionalIntensity >= 0.02) return null;
  return {
    id: "emotional-flatness",
    title: "Emotionally flat writing",
    severity: "low",
    explanation:
      "Almost no emotional language detected. AI writing tends to avoid genuine emotional expression.",
    matches: [],
  };
}

function checkFillerOveruse(text: string, _stats: AnalysisStats): AnalysisIssue | null {
  const total = wordCount(text);
  if (total === 0) return null;
  const fillerCount = countMatches(text, FILLER_PHRASES);
  if (fillerCount / total <= 0.03) return null;
  const matches = findMatches(text, FILLER_PHRASES);
  return {
    id: "filler-overuse",
    title: "Excessive filler words",
    severity: "low",
    explanation: `Filler words make up over 3% of the text — words like 'essentially', 'quite', and 'simply' dilute voice.`,
    matches,
  };
}

function checkOverExplanation(text: string, _stats: AnalysisStats): AnalysisIssue | null {
  const count = countMatches(text, EXPLANATORY_PHRASES);
  if (count < 2) return null;
  const severity = count >= 4 ? "medium" : "low";
  const matches = findMatches(text, EXPLANATORY_PHRASES);
  return {
    id: "over-explanation",
    title: "Repeatedly re-explains its own points",
    severity,
    explanation: `Found ${count} explanatory meta-phrases — a hallmark of AI padding and over-justification.`,
    matches,
  };
}

function checkPassiveVoice(_text: string, stats: AnalysisStats): AnalysisIssue | null {
  const { passiveVoiceCount } = stats;
  if (passiveVoiceCount < 2) return null;
  const severity = passiveVoiceCount >= 4 ? "high" : "medium";
  return {
    id: "passive-voice",
    title: "Heavy use of passive voice",
    severity,
    explanation: `Found ${passiveVoiceCount} passive voice constructions. AI defaults to passive to sound objective — human writing is more direct.`,
    matches: [],
  };
}

function checkBuzzwords(text: string, stats: AnalysisStats): AnalysisIssue | null {
  if (stats.buzzwordCount < 2) return null;
  const matches = findMatches(text, CORPORATE_BUZZWORDS);
  const severity = stats.buzzwordCount >= 5 ? "high" : "medium";
  return {
    id: "buzzword-density",
    title: "Corporate jargon / buzzword overload",
    severity,
    explanation: `Found ${stats.buzzwordCount} buzzwords like 'leverage', 'utilize', 'synergy' — these are AI's way of sounding professional while saying nothing.`,
    matches: matches.slice(0, 6),
  };
}

function checkAdverbDensity(text: string, stats: AnalysisStats): AnalysisIssue | null {
  if (stats.adverbDensity < 0.03) return null;
  const matches = findMatches(text, OVERUSED_ADVERBS);
  const severity = stats.adverbDensity >= 0.06 ? "medium" : "low";
  return {
    id: "adverb-overuse",
    title: "Excessive adverb use",
    severity,
    explanation: `Overused adverbs make up ${(stats.adverbDensity * 100).toFixed(1)}% of the text. AI piles on 'consistently', 'significantly', 'effectively' to inflate claims without adding specifics.`,
    matches: matches.slice(0, 5),
  };
}

function checkHedgePhrases(text: string, stats: AnalysisStats): AnalysisIssue | null {
  if (stats.hedgePhraseCount < 2) return null;
  const matches = findMatches(text, HEDGE_PHRASES);
  const severity = stats.hedgePhraseCount >= 4 ? "medium" : "low";
  return {
    id: "hedge-phrases",
    title: "Excessive hedging language",
    severity,
    explanation: `Found ${stats.hedgePhraseCount} hedge phrases like 'arguably', 'it could be said', 'potentially'. AI hedges to avoid committing — human writing takes a position.`,
    matches,
  };
}

function checkSentenceStarterRepetition(_text: string, stats: AnalysisStats): AnalysisIssue | null {
  if (stats.sentenceStarterRepetition < 0.35) return null;
  const severity = stats.sentenceStarterRepetition >= 0.5 ? "medium" : "low";
  return {
    id: "sentence-starter-repetition",
    title: "Repetitive sentence starters",
    severity,
    explanation: `${(stats.sentenceStarterRepetition * 100).toFixed(0)}% of sentences start with the same word. AI tends to begin sentences with 'The', 'This', or 'It' repeatedly, creating a monotonous cadence.`,
    matches: [],
  };
}

// ── Main Export ───────────────────────────────────────────────

export function analyzeAiPatterns(text: string): AnalysisResult {
  if (!text.trim()) {
    return {
      score: 0,
      issues: [],
      stats: {
        paragraphCount: 0,
        averageSentenceLength: 0,
        sentenceLengthVariance: 0,
        transitionCount: 0,
        genericOpenerFound: false,
        conclusionFound: false,
        listicleToneFound: false,
        emotionalIntensity: 0,
        symmetryScore: 0,
        passiveVoiceCount: 0,
        buzzwordCount: 0,
        adverbDensity: 0,
        hedgePhraseCount: 0,
        sentenceStarterRepetition: 0,
      },
    };
  }

  const stats = computeStats(text);

  const checkers = [
    checkGenericOpener,
    checkConclusionPhrase,
    checkTransitionDensity,
    checkTeachingTone,
    checkSentenceUniformity,
    checkParagraphSymmetry,
    checkListicleTone,
    checkEmotionalFlatness,
    checkFillerOveruse,
    checkOverExplanation,
    checkPassiveVoice,
    checkBuzzwords,
    checkAdverbDensity,
    checkHedgePhrases,
    checkSentenceStarterRepetition,
  ];

  const issues: AnalysisIssue[] = checkers
    .map((check) => check(text, stats))
    .filter((issue): issue is AnalysisIssue => issue !== null);

  const { score } = scoreAiFingerprint(text);

  return { score, issues, stats };
}
