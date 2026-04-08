// ============================================================
// De-AI Engine V2 — Thought Engine
// Extracts human-like thinking from AI text.
// No LLM. Pure deterministic heuristics.
// ============================================================

import type { ThoughtAnchor, EmotionMode, RewriteMode } from "./types";
import { splitSentences, wordCount, normalize, escapeRegex } from "./utils";
import { GENERIC_OPENERS, CONCLUSION_PHRASES, TEACHING_TONE_MARKERS } from "./presets";

// ── Domain Detection ──────────────────────────────────────────

// Partial keyword matching — catches "invest" in "investing", "productiv" in "productivity"
const DOMAIN_KEYWORDS: Record<string, string[]> = {
  finance: [
    "invest", "fund", "portfolio", "stock", "market", "return", "diversif",
    "compound", "wealth", "asset", "mutual", "index", "dividend", "financial",
    "saving", "trading", "equity", "risk", "inflation", "interest rate",
  ],
  productivity: [
    "productiv", "focus", "task", "habit", "output", "distract",
    "perform", "efficien", "deep work", "multitask", "priorit",
    "workflow", "time management", "procrastinat",
  ],
  tech: [
    "platform", "software", "product", "user", "feature", "scale",
    "code", "developer", "startup", "saas", "api", "tech", "digital",
    "system", "deploy", "stack", "algorithm",
  ],
  career: [
    "career", "professional", "skill", "learning", "growth", "develop",
    "leadership", "job", "hire", "workplace", "team", "manager", "industry",
    "networking", "interview",
  ],
  health: [
    "health", "wellness", "mental", "physical", "exercise", "sleep",
    "stress", "mindset", "wellbeing", "diet", "nutrition", "burnout",
  ],
  marketing: [
    "marketing", "brand", "audience", "content", "social", "traffic",
    "conversion", "campaign", "engagement", "seo", "funnel",
  ],
};

function detectDomain(text: string): string {
  const lower = normalize(text);
  let best = "general";
  let bestScore = 0;

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    const score = keywords.filter((kw) => lower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      best = domain;
    }
  }
  return best;
}

// ── Core Topic Extraction ─────────────────────────────────────

const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "it", "in", "on", "at", "to",
  "for", "of", "and", "or", "but", "with", "this", "that", "these", "those",
  "we", "you", "i", "they", "he", "she", "our", "your", "their", "its",
  "has", "have", "had", "be", "been", "being", "do", "does", "did",
  "will", "would", "could", "should", "may", "might", "can", "not",
  "more", "most", "also", "very", "just", "from", "than", "when",
  "who", "what", "how", "which", "about", "into", "through", "during",
]);

// Words excluded from being considered a "topic" — verbs, participles, generic adjectives
const TOPIC_BLOCKLIST = new Set([
  // Past participles and verb forms that aren't nouns
  "argued", "designed", "achieved", "realized", "utilized", "implemented",
  "derived", "focused", "based", "noted", "considered", "related", "called",
  "used", "made", "known", "done", "seen", "said", "found",
  // Vague filler words that sneak past stopwords
  "things", "ways", "aspects", "factors", "areas", "elements", "terms",
  "today", "world", "life", "time", "work", "great", "good", "best",
  "many", "much", "more", "most", "every", "each", "well", "also",
  "often", "always", "never", "long", "high", "real", "true", "full",
]);

// Find the most prominent content noun/phrase in the text
function extractCoreTopic(text: string): string {
  const lower = normalize(text);
  const words = lower
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z]/g, ""))
    .filter(
      (w) =>
        w.length > 3 &&
        !STOPWORDS.has(w) &&
        !TOPIC_BLOCKLIST.has(w) &&
        !w.endsWith("ing") && // exclude gerunds (leveraging, implementing...)
        !w.endsWith("tion") // exclude nominalizations where a verb would be clearer
    );

  const freq: Record<string, number> = {};
  for (const w of words) {
    freq[w] = (freq[w] ?? 0) + 1;
  }

  const sorted = Object.entries(freq).sort(([, a], [, b]) => b - a);

  // Prefer words that appear more than once (repeated = central topic)
  const multipleOccurrence = sorted.find(([, count]) => count > 1);
  if (multipleOccurrence) return multipleOccurrence[0];

  // Otherwise pick the first domain-relevant word
  const allDomainKeywords = Object.values(DOMAIN_KEYWORDS).flat();
  for (const [word] of sorted) {
    if (allDomainKeywords.some((kw) => word.includes(kw) || kw.includes(word))) {
      return word;
    }
  }

  return sorted[0]?.[0] ?? "this";
}

// Find the main substantive claim — first non-generic, non-conclusion sentence
function extractMainIdea(text: string): string {
  const sentences = splitSentences(text);

  for (const s of sentences) {
    const lower = normalize(s);
    const isGeneric = GENERIC_OPENERS.some((p) => lower.includes(p.slice(0, 20)));
    const isConclusion = CONCLUSION_PHRASES.some((p) => lower.includes(p));
    if (!isGeneric && !isConclusion && wordCount(s) > 6) {
      // Strip leading teaching markers to get the actual claim
      let idea = s;
      const sorted = [...TEACHING_TONE_MARKERS].sort((a, b) => b.length - a.length);
      for (const marker of sorted) {
        idea = idea.replace(
          new RegExp(`\\b${escapeRegex(marker)}\\b(?:\\s+that)?[,:]?\\s*`, "gi"),
          ""
        );
      }
      const cleaned = idea.trim();
      return cleaned.length > 5 ? cleaned : s;
    }
  }
  return sentences[0] ?? text.slice(0, 80);
}

// ── Stance Amplification ──────────────────────────────────────

// Domain-keyed: what a real person would be frustrated or curious about
const DOMAIN_FRUSTRATIONS: Record<string, string[]> = {
  finance: [
    "people keep adding funds without tracking what they actually own",
    "everyone talks about returns but nobody tracks risk properly",
    "the real problem is making decisions based on last month's numbers",
    "most portfolios are a mess of small impulsive decisions, not a strategy",
  ],
  productivity: [
    "people optimize their systems instead of doing the actual work",
    "everyone has a framework, nobody ships consistently",
    "the tool is never the issue — the avoidance is",
    "most people know exactly what they should do and still don't do it",
  ],
  tech: [
    "products get built for the demo, not for the person using them",
    "features keep getting added but never removed",
    "the technical problem is usually not the actual problem",
    "teams confidently solve the wrong thing while the real issue waits",
  ],
  career: [
    "people collect credentials but avoid doing the hard visible work",
    "learning feels like progress but it's mostly comfortable avoidance",
    "the market doesn't care how much you know, only what you've done",
    "most people wait for permission that isn't coming",
  ],
  health: [
    "people know exactly what to do and still don't do it",
    "the information is never the problem — consistency is",
    "everyone's looking for the trick that removes the hard part",
  ],
  marketing: [
    "teams optimize metrics that don't move the actual needle",
    "everyone's chasing virality while ignoring product fundamentals",
    "the content strategy is usually a distraction from the real problem",
  ],
  general: [
    "the conversation keeps missing the actual point",
    "everyone talks about this but behavior never changes",
    "the obvious solution is the one nobody wants to admit",
    "this keeps getting complicated for no good reason",
  ],
};

// Domain-keyed: grounded "I saw this" moments that open the rewrite
const DOMAIN_ANCHORS: Record<string, string[]> = {
  finance: [
    "Looked at a friend's portfolio recently.",
    "Saw this pattern again in an investment conversation.",
    "Had this exact discussion with someone last week.",
    "Keep seeing this in how people talk about their money.",
  ],
  productivity: [
    "Watched someone spend an hour color-coding their task manager.",
    "Keep seeing people build elaborate systems they never actually use.",
    "Had this exact conversation three times this month.",
    "Saw someone finish their fourth productivity book this year.",
  ],
  tech: [
    "Sat through another product demo recently.",
    "Keep watching teams make the same call for the wrong reasons.",
    "Worked through a problem like this not long ago.",
    "Saw a team ship something that solved a problem they didn't have.",
  ],
  career: [
    "Talked to someone in the middle of a career switch last week.",
    "Keep running into people stuck in the same loop.",
    "Had this conversation again recently.",
    "Watched someone make the same mistake I've seen a dozen times.",
  ],
  health: [
    "Keep seeing people start and abandon the same habit.",
    "Talked to someone about this pattern just recently.",
    "Saw this come up again in a conversation.",
  ],
  marketing: [
    "Saw a campaign fail for the most predictable reason.",
    "Keep watching teams chase the same metrics.",
    "Had this conversation with a founder recently.",
  ],
  general: [
    "Keep seeing this.",
    "Saw this again just recently.",
    "This keeps coming up.",
    "Had this conversation again just last week.",
  ],
};

// (coreTopic, frustration) → opinionated reframe sentence
const STANCE_TEMPLATES: Array<(topic: string, frustration: string) => string> = [
  (t, f) => `It's not a ${t} problem — it's that ${f}.`,
  (t, f) => `The issue isn't ${t}. It's that ${f}.`,
  (t, f) => `People frame this as a ${t} thing. But really, ${f}.`,
  (t, f) => `Everyone talks about ${t} but misses the actual pattern: ${f}.`,
  (t, f) => `${f.charAt(0).toUpperCase() + f.slice(1)} — that's the ${t} problem nobody names.`,
];

// Exported standalone function — takes a coreThought and returns the amplified stance
export function amplifyStance(
  coreTopic: string,
  domain: string,
  emotion: EmotionMode
): string {
  const frustrations = DOMAIN_FRUSTRATIONS[domain] ?? DOMAIN_FRUSTRATIONS.general;
  // Pick deterministically: use string length as seed
  const seed = coreTopic.length + emotion.length;
  const frustration = frustrations[seed % frustrations.length];
  const template = STANCE_TEMPLATES[(seed + 1) % STANCE_TEMPLATES.length];
  return template(coreTopic, frustration);
}

// ── Main Export ───────────────────────────────────────────────

export function generateThoughtAnchor(
  text: string,
  options: { emotion: EmotionMode; mode: RewriteMode }
): ThoughtAnchor {
  const domain = detectDomain(text);
  const coreTopic = extractCoreTopic(text);

  // All picks are deterministic — no randomness
  const seed = text.length;

  const frustrations = DOMAIN_FRUSTRATIONS[domain] ?? DOMAIN_FRUSTRATIONS.general;
  const coreThought = frustrations[seed % frustrations.length];

  const domainAnchors = DOMAIN_ANCHORS[domain] ?? DOMAIN_ANCHORS.general;
  const anchor = domainAnchors[(seed + domain.length) % domainAnchors.length];

  const template = STANCE_TEMPLATES[(seed + 2) % STANCE_TEMPLATES.length];
  const frustration = frustrations[(seed + 1) % frustrations.length];
  const stance = template(coreTopic, frustration);

  return {
    anchor,
    stance,
    emotion: options.emotion,
    coreThought,
  };
}
