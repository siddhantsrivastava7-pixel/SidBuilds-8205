// ============================================================
// De-AI Engine — Core Types
// ============================================================

export type Severity = "low" | "medium" | "high";

// A single detected AI fingerprint issue
export interface AnalysisIssue {
  id: string;           // e.g. "generic-opener", "transition-density"
  title: string;        // short human-readable label
  severity: Severity;
  explanation: string;  // why this is flagged
  matches?: string[];   // actual substrings found in the text
}

// Structural metrics extracted from the text
export interface AnalysisStats {
  paragraphCount: number;
  averageSentenceLength: number;       // in words
  sentenceLengthVariance: number;      // population variance of per-sentence word counts
  transitionCount: number;             // raw count of transition words found
  genericOpenerFound: boolean;
  conclusionFound: boolean;
  listicleToneFound: boolean;
  emotionalIntensity: number;          // 0.0–1.0 ratio of emotional words
  symmetryScore: number;               // 0.0 (varied) – 1.0 (perfectly uniform paragraphs)
  passiveVoiceCount: number;           // count of passive voice constructions
  buzzwordCount: number;               // count of corporate buzzwords
  adverbDensity: number;               // 0.0–1.0 ratio of overused adverbs to total words
  hedgePhraseCount: number;            // count of hedge phrases
  sentenceStarterRepetition: number;   // 0.0–1.0 ratio of sentences sharing the most common starter word
}

// Full analysis output
export interface AnalysisResult {
  score: number;          // 0–100 AI fingerprint score (higher = more AI-like)
  issues: AnalysisIssue[];
  stats: AnalysisStats;
}

// Rewrite personality modes
export type RewriteMode =
  | "rawHuman"
  | "frustratedRant"
  | "founderVoice"
  | "casualInternet"
  | "sharpOpinion";

// Emotional lane to bias the rewrite toward
export type EmotionMode =
  | "frustration"
  | "disbelief"
  | "curiosity"
  | "confidence"
  | "annoyance";

// How aggressively to apply rewrite rules
export type RewriteIntensity = "light" | "medium" | "aggressive";

// Options passed to rewriteHuman()
export interface RewriteOptions {
  mode: RewriteMode;
  emotion: EmotionMode;
  intensity: RewriteIntensity;
}

// ── V2: Thought Engine types ──────────────────────────────────

// The extracted "human anchor" — what a person would actually think/feel about this text
export interface ThoughtAnchor {
  anchor: string;       // grounded "I saw this" moment that opens the rewrite
  stance: string;       // opinionated reframe of the original claim
  emotion: EmotionMode;
  coreThought: string;  // the stripped-down human version of what the text is really about
}

// Controls how the rhythm engine shapes sentence flow
export interface RhythmProfile {
  targetShortCount: number;  // aim for this many short (≤6 word) sentences
  targetLongCount: number;   // aim for this many long (≥15 word) sentences
  allowFragments: boolean;   // permit 2–5 word punch sentences
  allowRunOns: boolean;      // permit em-dash sentence joins
}

// V2 config — superset of RewriteOptions, all V2 fields optional
export interface HumanRewriteConfig {
  mode: RewriteMode;
  emotion: EmotionMode;
  intensity: RewriteIntensity;
  useThoughtAnchor?: boolean;   // default true — enables V3 rebuild pipeline
  useRhythmEngine?: boolean;    // default true — applies rhythm variation
  useStanceAmplifier?: boolean; // default true — injects opinionated reframe
}

// Output of the rewrite engine
export interface RewriteResult {
  rewrittenText: string;
  beforeScore: number;
  afterScore: number;
  changes: string[];          // human-readable log of each transformation applied
  thoughtAnchor?: ThoughtAnchor; // present when useThoughtAnchor is true
}

// ── V3: Idea Extraction + Rebuild types ──────────────────────

// The semantic type of an extracted idea unit
export type IdeaType =
  | "claim"       // an assertion: "X is Y"
  | "problem"     // something is wrong or broken
  | "cause"       // explains why something happens
  | "effect"      // what happens as a result
  | "advice"      // a recommendation or instruction
  | "observation"; // a noticed pattern or fact

// A single idea extracted from one source sentence
export interface ExtractedIdea {
  id: string;             // e.g. "idea_0", "idea_1"
  text: string;           // the stripped-down idea (short phrase, no filler)
  sourceSentence: string; // the full original sentence it came from
  type: IdeaType;
  priority: number;       // 1 = highest, higher numbers = lower priority
  keywords: string[];     // 2–4 content words extracted from the idea
}

// The result of reducing many ideas down to a working set
export interface ReducedIdeaSet {
  primary: ExtractedIdea;           // the single most important idea
  supporting: ExtractedIdea[];      // 2–4 ideas that back up the primary
  dropped: ExtractedIdea[];         // ideas that were cut
}

// The full plan passed to the rebuild function
export interface RebuildPlan {
  anchor: string;                   // grounded opener ("Saw this pattern again.")
  stance: string;                   // opinionated reframe of the primary idea
  primaryIdea: ExtractedIdea;
  supportingIdeas: ExtractedIdea[];
  emotion: EmotionMode;
  mode: RewriteMode;
  intensity: RewriteIntensity;
}

// A single entry in the score breakdown
export interface WeightEntry {
  raw: number;          // raw metric value (count, ratio, or 0/1 for booleans)
  weighted: number;     // penalty points this metric contributed
  label: string;        // short explanation string
}

// Full scoring breakdown
export interface ScoreBreakdown {
  total: number;
  weights: Record<string, WeightEntry>;
}
