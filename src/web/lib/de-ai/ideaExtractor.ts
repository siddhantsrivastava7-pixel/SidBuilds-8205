// ============================================================
// De-AI Engine V3 — Idea Extractor
// Splits text into discrete idea units, classifies them by type,
// extracts keywords, and assigns priority scores.
// Zero randomness — all logic is purely deterministic.
// ============================================================

import type { ExtractedIdea, IdeaType } from "./types";
import { IDEA_TYPE_SIGNALS, GENERIC_IDEA_SIGNALS, TEACHING_TONE_MARKERS, HARD_BANNED_PHRASES } from "./presets";
import { splitSentences, normalize, wordCount } from "./utils";

// ── Stopwords (filtered from keyword extraction) ──────────────

const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "up", "about", "into", "through", "during",
  "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
  "do", "does", "did", "will", "would", "could", "should", "may", "might",
  "shall", "can", "need", "dare", "ought", "used", "it", "its", "this",
  "that", "these", "those", "i", "you", "he", "she", "we", "they", "me",
  "him", "her", "us", "them", "my", "your", "his", "our", "their", "what",
  "which", "who", "whom", "when", "where", "why", "how", "all", "both",
  "each", "few", "more", "most", "other", "some", "such", "no", "not",
  "only", "same", "so", "than", "too", "very", "just", "also", "as",
  "if", "while", "because", "though", "although", "however", "therefore",
  "thus", "hence", "since", "once", "before", "after", "then", "now",
  "here", "there", "often", "well", "even", "still",
]);

// ── Sentence stripping ────────────────────────────────────────
// Remove wrappers that don't carry meaning (teaching phrases, hard-banned, etc.)

function stripWrappers(sentence: string): string {
  let result = sentence.trim();

  // Remove teaching tone markers (longest first)
  const markers = [...TEACHING_TONE_MARKERS].sort((a, b) => b.length - a.length);
  for (const marker of markers) {
    const re = new RegExp(`^${marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*(?:that\\s*)?`, "i");
    result = result.replace(re, "");
  }

  // Remove hard-banned phrases at start
  const banned = [...HARD_BANNED_PHRASES].sort((a, b) => b.length - a.length);
  for (const phrase of banned) {
    const re = new RegExp(`^${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[,:]?\\s*`, "i");
    result = result.replace(re, "");
  }

  // Remove trailing punctuation, normalize spaces
  result = result.replace(/[.!?;:,]+$/, "").trim();

  return result;
}

// ── Idea type classifier ──────────────────────────────────────

function classifyIdea(sentence: string): IdeaType {
  const lower = normalize(sentence);

  // Score each type by signal hits
  const scores: Record<IdeaType, number> = {
    problem: 0,
    cause: 0,
    effect: 0,
    advice: 0,
    observation: 0,
    claim: 0,
  };

  for (const [type, signals] of Object.entries(IDEA_TYPE_SIGNALS)) {
    for (const signal of signals) {
      if (lower.includes(signal)) {
        scores[type as IdeaType] += 1;
      }
    }
  }

  // Default: if it contains a copula and a noun — it's a claim
  // e.g. "diversification is important", "the market is volatile"
  const isClaim = /\b(?:is|are|was|were)\b/.test(lower) &&
    scores.problem === 0 && scores.cause === 0 &&
    scores.effect === 0 && scores.advice === 0;
  if (isClaim) scores.claim += 1;

  // Pick the highest scoring type
  let best: IdeaType = "observation";
  let bestScore = -1;
  for (const [type, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      best = type as IdeaType;
    }
  }

  return best;
}

// ── Keyword extractor ─────────────────────────────────────────
// Returns 2–4 content words from the sentence

function extractKeywords(sentence: string): string[] {
  const words = normalize(sentence)
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));

  // Frequency map
  const freq: Record<string, number> = {};
  for (const w of words) freq[w] = (freq[w] ?? 0) + 1;

  // Sort by frequency desc, then alpha for determinism
  const sorted = Object.keys(freq).sort((a, b) => {
    const diff = freq[b] - freq[a];
    return diff !== 0 ? diff : a.localeCompare(b);
  });

  return sorted.slice(0, 4);
}

// ── Priority scorer ───────────────────────────────────────────
// Lower number = higher priority (1 is best)

const TYPE_BASE_PRIORITY: Record<IdeaType, number> = {
  problem:     1,
  cause:       2,
  observation: 3,
  effect:      4,
  claim:       5,
  advice:      6,
};

function scorePriority(idea: string, type: IdeaType): number {
  let priority = TYPE_BASE_PRIORITY[type];
  const lower = normalize(idea);

  // Penalize generic ideas
  for (const signal of GENERIC_IDEA_SIGNALS) {
    if (lower.includes(signal)) {
      priority += 2;
      break;
    }
  }

  // Penalize very short ideas (< 5 words = probably stripped to nothing)
  if (wordCount(idea) < 5) priority += 1;

  // Penalize ideas that are just definitions ("X is a Y that Z")
  if (/\b(?:is|are)\s+a(?:n)?\s+\w+\s+that\b/.test(lower)) priority += 2;

  // Reward specificity — presence of numbers or proper nouns
  if (/\d/.test(idea)) priority -= 1;
  if (/[A-Z][a-z]/.test(idea.replace(/^./, ""))) priority -= 1; // mid-sentence capital = proper noun

  return Math.max(1, priority);
}

// ── Duplicate / near-duplicate filter ────────────────────────
// Two ideas are near-duplicate if they share > 60% of keywords

function isNearDuplicate(a: ExtractedIdea, b: ExtractedIdea): boolean {
  if (a.keywords.length === 0 || b.keywords.length === 0) return false;
  const setA = new Set(a.keywords);
  const overlap = b.keywords.filter((k) => setA.has(k)).length;
  const unionSize = new Set([...a.keywords, ...b.keywords]).size;
  return overlap / unionSize > 0.6;
}

// ── Main export ───────────────────────────────────────────────

export function extractIdeas(text: string): ExtractedIdea[] {
  const sentences = splitSentences(text);
  const raw: ExtractedIdea[] = [];

  for (let i = 0; i < sentences.length; i++) {
    const source = sentences[i].trim();
    if (!source) continue;

    // Skip very short sentences — likely fragments after splitting
    if (wordCount(source) < 4) continue;

    const stripped = stripWrappers(source);
    if (!stripped || wordCount(stripped) < 3) continue;

    const type = classifyIdea(source);
    const keywords = extractKeywords(stripped);
    const priority = scorePriority(stripped, type);

    raw.push({
      id: `idea_${i}`,
      text: stripped,
      sourceSentence: source,
      type,
      priority,
      keywords,
    });
  }

  // Remove near-duplicates: keep the one with lower (better) priority
  const deduped: ExtractedIdea[] = [];
  for (const idea of raw) {
    const isDupe = deduped.some((existing) => isNearDuplicate(existing, idea));
    if (!isDupe) deduped.push(idea);
  }

  // Sort by priority ascending (1 = best first)
  return deduped.sort((a, b) => a.priority - b.priority);
}
