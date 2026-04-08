// ============================================================
// De-AI Engine V3 — Idea Reducer
// Takes a list of extracted ideas and reduces them to a working
// set: 1 primary + 2–4 supporting + dropped remainder.
// Rules:
//   - Primary: lowest (best) priority score
//   - Supporting: next 2–4 with highest complementary value
//   - Drop: generic, redundant, or advisory-only ideas
//   - Max total ideas kept: 5 (primary + 4 supporting)
// ============================================================

import type { ExtractedIdea, IdeaType, ReducedIdeaSet } from "./types";

// How many supporting ideas to keep at each intensity
// (caller can pass this in, or we use the default of 3)
const DEFAULT_SUPPORTING_COUNT = 3;
const MAX_SUPPORTING_COUNT = 4;

// ── Type priority ordering ───────────────────────────────────
// Problem ideas are most engaging, advice ideas least
const TYPE_KEEP_ORDER: IdeaType[] = [
  "problem",
  "cause",
  "observation",
  "effect",
  "claim",
  "advice",
];

function typeRank(type: IdeaType): number {
  return TYPE_KEEP_ORDER.indexOf(type);
}

// ── Complementarity check ────────────────────────────────────
// A supporting idea complements the primary if it covers different keywords
function complementsIdea(candidate: ExtractedIdea, primary: ExtractedIdea): boolean {
  const primaryKeys = new Set(primary.keywords);
  const overlap = candidate.keywords.filter((k) => primaryKeys.has(k)).length;
  // Complementary if less than 50% overlap
  return candidate.keywords.length === 0 || overlap / candidate.keywords.length < 0.5;
}

// ── Low-value idea detector ──────────────────────────────────
// Returns true if the idea should be dropped regardless of type
function isLowValue(idea: ExtractedIdea): boolean {
  const lower = idea.text.toLowerCase();

  // Pure definition sentences: "X is a Y" with no predicate beyond the definition
  if (/^[\w\s]+ (?:is|are) (?:a|an|the) [\w\s]+$/.test(lower)) return true;

  // Very short stripped ideas (barely any content)
  if (idea.text.split(/\s+/).length < 4) return true;

  // Ideas that are all advice with no grounding content
  if (idea.type === "advice" && idea.priority > 6) return true;

  return false;
}

// ── Main export ───────────────────────────────────────────────

export function reduceIdeas(
  ideas: ExtractedIdea[],
  supportingCount: number = DEFAULT_SUPPORTING_COUNT
): ReducedIdeaSet {
  if (ideas.length === 0) {
    // Fallback: nothing extracted — return empty structure
    const placeholder: ExtractedIdea = {
      id: "idea_fallback",
      text: "something worth thinking about",
      sourceSentence: "",
      type: "observation",
      priority: 5,
      keywords: [],
    };
    return { primary: placeholder, supporting: [], dropped: [] };
  }

  // Step 1: Pick the primary — lowest priority score (= most valuable)
  // Among ties, prefer problem > cause > observation (type ordering)
  const sorted = [...ideas].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return typeRank(a.type) - typeRank(b.type);
  });

  const primary = sorted[0];
  const remaining = sorted.slice(1);

  // Step 2: Filter candidates for supporting
  // Remove low-value ideas and ideas that are near-duplicates of primary
  const maxSupporting = Math.min(
    Math.max(supportingCount, 2),
    MAX_SUPPORTING_COUNT
  );

  const candidates = remaining.filter((idea) => {
    if (isLowValue(idea)) return false;
    if (!complementsIdea(idea, primary)) return false;
    return true;
  });

  // Step 3: Pick supporting — greedy: take up to maxSupporting
  // Prefer variety of types — don't take two advice ideas in a row
  const supporting: ExtractedIdea[] = [];
  const dropped: ExtractedIdea[] = [];
  const usedTypes = new Set<IdeaType>();

  for (const idea of candidates) {
    if (supporting.length >= maxSupporting) {
      dropped.push(idea);
      continue;
    }

    // Allow at most 1 advice idea in supporting
    if (idea.type === "advice" && usedTypes.has("advice")) {
      dropped.push(idea);
      continue;
    }

    supporting.push(idea);
    usedTypes.add(idea.type);
  }

  // Step 4: Anything from remaining that wasn't selected goes to dropped
  for (const idea of remaining) {
    if (!supporting.includes(idea) && !dropped.includes(idea)) {
      dropped.push(idea);
    }
  }

  return { primary, supporting, dropped };
}
