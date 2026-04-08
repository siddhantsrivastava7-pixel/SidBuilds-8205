// ============================================================
// De-AI Engine — Utility Functions
// Pure functions, no project-level imports.
// ============================================================

// Escape special regex characters in a string
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Lowercase + trim
export function normalize(text: string): string {
  return text.toLowerCase().trim();
}

// Uppercase the first character
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Count words (split on whitespace)
export function wordCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

// Split text into paragraphs (double newline delimited)
export function splitParagraphs(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

// Split text into sentences.
// Protects common abbreviations from being split on.
export function splitSentences(text: string): string[] {
  // Step 1: protect known abbreviations with placeholders
  const ABBREV_RE = /\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|e\.g|i\.e|U\.S|U\.K|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec|No|Vol|Fig|Dept|St|Ave|Blvd)\./g;
  const placeholder = "\x00";
  const protected_ = text.replace(ABBREV_RE, (m) => m.replace(".", placeholder));

  // Step 2: split on sentence-ending punctuation followed by whitespace + capital letter
  // Also handles: end of string after punctuation
  const parts = protected_.split(/(?<=[.!?])\s+(?=[A-Z"'])/);

  // Step 3: restore placeholders
  return parts
    .map((s) => s.replace(new RegExp(placeholder, "g"), ".").trim())
    .filter(Boolean);
}

// Average word count of an array of strings
export function averageWordCount(strings: string[]): number {
  if (strings.length === 0) return 0;
  const total = strings.reduce((sum, s) => sum + wordCount(s), 0);
  return total / strings.length;
}

// Population variance of an array of numbers
export function variance(nums: number[]): number {
  if (nums.length === 0) return 0;
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  const squaredDiffs = nums.map((n) => Math.pow(n - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / nums.length;
}

// Count total occurrences of all patterns (case-insensitive, word-boundary aware)
export function countMatches(text: string, patterns: string[]): number {
  const lower = normalize(text);
  let total = 0;
  for (const pattern of patterns) {
    const escaped = escapeRegex(pattern);
    // Use \b before; after: either \b or end of word-like boundary
    // Patterns ending in punctuation (e.g. "overall,") can't use trailing \b
    const endsWithPunct = /[^a-z0-9]$/.test(pattern);
    const regexStr = endsWithPunct
      ? `\\b${escaped}`
      : `\\b${escaped}\\b`;
    const re = new RegExp(regexStr, "gi");
    const found = lower.match(re);
    if (found) total += found.length;
  }
  return total;
}

// Return deduplicated array of matched substrings from text
export function findMatches(text: string, patterns: string[]): string[] {
  const lower = normalize(text);
  const found = new Set<string>();
  for (const pattern of patterns) {
    const escaped = escapeRegex(pattern);
    const endsWithPunct = /[^a-z0-9]$/.test(pattern);
    const regexStr = endsWithPunct
      ? `\\b${escaped}`
      : `\\b${escaped}\\b`;
    const re = new RegExp(regexStr, "gi");
    let match: RegExpExecArray | null;
    while ((match = re.exec(lower)) !== null) {
      found.add(match[0].toLowerCase());
    }
  }
  return Array.from(found);
}

// Clamp a number between min and max
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Fix double spaces left after word removal
export function fixSpaces(text: string): string {
  return text.replace(/ {2,}/g, " ").trim();
}

// Capitalize the first letter of each sentence in text
// (used after transition/phrase removal may lower-case sentence starts)
export function fixCapitalization(text: string): string {
  // Capitalize first character of the whole string
  let result = capitalize(text.trim());
  // Capitalize after sentence-ending punctuation + space
  result = result.replace(/([.!?]\s+)([a-z])/g, (_, punct, letter) => punct + letter.toUpperCase());
  return result;
}

// Truncate a string for display in change logs
export function truncate(str: string, maxLen = 40): string {
  const cleaned = str.replace(/\n/g, " ").trim();
  return cleaned.length > maxLen ? cleaned.slice(0, maxLen) + "..." : cleaned;
}
