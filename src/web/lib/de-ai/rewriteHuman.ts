// ============================================================
// De-AI Engine V2 — Rewrite Engine
// Updated pipeline: think first, then rewrite.
// V1: strips AI patterns
// V2: reconstructs how a human would actually say this
// ============================================================

import type {
  HumanRewriteConfig,
  RewriteResult,
  RewriteIntensity,
  EmotionMode,
  RhythmProfile,
  ThoughtAnchor,
} from "./types";
import {
  GROUNDED_OPENERS,
  EMOTIONAL_PHRASES,
  TRANSITION_REPLACEMENTS,
  TEACHING_TONE_MARKERS,
  EMOTIONAL_WORDS,
  SYNONYM_MAP,
  HEDGE_PHRASES,
  GENERIC_OPENERS,
} from "./presets";
import {
  splitSentences,
  splitParagraphs,
  findMatches,
  wordCount,
  variance,
  escapeRegex,
  capitalize,
  fixSpaces,
  fixCapitalization,
  truncate,
  clamp,
  normalize,
} from "./utils";
import { scoreAiFingerprint } from "./scoreAiFingerprint";
import { generateThoughtAnchor } from "./thoughtEngine";
import { applyHumanRhythm } from "./rhythmEngine";
import {
  buildAnchoredDraft,
  applyImperfectSentences,
  stripHardBanned,
  injectConversationalPhrases,
  breakSentenceStructure,
} from "./humanLayers";

// ── Helpers ───────────────────────────────────────────────────

function pickIndex(seed: number, arrayLen: number): number {
  return seed % arrayLen;
}

function startsWithGenericOpener(text: string): boolean {
  const sentences = splitSentences(text);
  const first2 = sentences.slice(0, 2).join(" ");
  return findMatches(first2, GENERIC_OPENERS).length > 0;
}

function rejoinText(sentences: string[]): string {
  return sentences.join(" ");
}

function emotionalWordCount(text: string): number {
  const lower = normalize(text);
  let count = 0;
  for (const word of EMOTIONAL_WORDS) {
    const re = new RegExp(`\\b${word}\\b`, "gi");
    const m = lower.match(re);
    if (m) count += m.length;
  }
  return count;
}

// ── V1 Cleaning Passes (preserved, used in both V1 and V2) ───

function stripGenericOpener(
  text: string,
  options: HumanRewriteConfig,
  changes: string[]
): string {
  if (!startsWithGenericOpener(text)) return text;

  const sentences = splitSentences(text);
  const firstSentence = sentences[0] ?? "";
  const openers = GROUNDED_OPENERS[options.mode];
  const seed = text.length;
  const replacement = openers[pickIndex(seed, openers.length)];

  let remaining = text;
  const firstIdx = remaining.indexOf(firstSentence);
  if (firstIdx !== -1) {
    remaining = remaining.slice(firstIdx + firstSentence.length).trimStart();
    remaining = remaining.replace(/^[,;:]\s*/, "");
  }

  const rewritten = `${replacement} ${capitalize(remaining)}`;
  changes.push(
    `Removed generic opener "${truncate(firstSentence)}" → replaced with "${replacement}"`
  );
  return fixSpaces(rewritten);
}

function reduceTransitions(
  text: string,
  options: HumanRewriteConfig,
  changes: string[]
): string {
  let result = text;
  const intensityIndex: Record<RewriteIntensity, 0 | 1 | 2> = {
    light: 0,
    medium: 1,
    aggressive: 2,
  };
  const idx = intensityIndex[options.intensity];

  const entries = Object.entries(TRANSITION_REPLACEMENTS).sort(
    ([a], [b]) => b.length - a.length
  );

  for (const [transition, replacements] of entries) {
    const replacement = replacements[idx];
    const escaped = escapeRegex(transition);
    const re = new RegExp(`\\b${escaped}\\b,?\\s*`, "gi");

    const matches = result.match(re);
    if (!matches || matches.length === 0) continue;
    const count = matches.length;

    if (replacement === null) {
      result = result.replace(re, "");
      changes.push(
        `Removed transition "${transition}" (${count} occurrence${count > 1 ? "s" : ""})`
      );
    } else {
      result = result.replace(re, `${replacement} `);
      changes.push(
        `Replaced "${transition}" → "${replacement}" (${count} occurrence${count > 1 ? "s" : ""})`
      );
    }
  }

  result = fixSpaces(result);
  result = fixCapitalization(result);
  return result;
}

function removeTeachingTone(
  text: string,
  _options: HumanRewriteConfig,
  changes: string[]
): string {
  let result = text;

  const listicleRe = /\bhere are (?:\d+|a few|several|many|some|the (?:top|key|main|best)) \w+[s]?[:\s]/gi;
  const listicleMatches = result.match(listicleRe);
  if (listicleMatches) {
    result = result.replace(listicleRe, "");
    changes.push(`Removed listicle intro phrase "${truncate(listicleMatches[0])}"`);
  }

  const markers = [...TEACHING_TONE_MARKERS].sort((a, b) => b.length - a.length);
  for (const marker of markers) {
    const escaped = escapeRegex(marker);
    const re = new RegExp(`\\b${escaped}\\b(?:\\s+that)?[,:]?\\s*`, "gi");
    const matches = result.match(re);
    if (!matches || matches.length === 0) continue;
    result = result.replace(re, "");
    changes.push(`Removed teaching phrase "${marker}" (${matches.length}x)`);
  }

  result = fixSpaces(result);
  result = fixCapitalization(result);
  return result;
}

function breakSentenceUniformity(
  text: string,
  options: HumanRewriteConfig,
  changes: string[]
): string {
  const sentences = splitSentences(text);
  if (sentences.length < 3) return text;

  const wcs = sentences.map(wordCount);
  const sentVariance = variance(wcs);
  if (sentVariance >= 20) return text;

  const mean = wcs.reduce((a, b) => a + b, 0) / wcs.length;
  let modified = false;
  const result = [...sentences];

  if (options.intensity === "aggressive" || options.intensity === "medium") {
    let longestIdx = -1;
    let longestWc = 0;
    for (let i = 0; i < result.length; i++) {
      if (wcs[i] > mean * 1.3 && wcs[i] > longestWc) {
        longestWc = wcs[i];
        longestIdx = i;
      }
    }
    if (longestIdx !== -1) {
      const sentence = result[longestIdx];
      const commaPositions: number[] = [];
      for (let i = 0; i < sentence.length; i++) {
        if (sentence[i] === ",") commaPositions.push(i);
      }
      if (commaPositions.length > 0) {
        const midComma = commaPositions[Math.floor(commaPositions.length / 2)];
        const part1 = sentence.slice(0, midComma).trim();
        const part2 = capitalize(sentence.slice(midComma + 1).trim());
        if (part1 && part2 && wordCount(part2) >= 3) {
          result[longestIdx] = part1 + ".";
          result.splice(longestIdx + 1, 0, part2);
          wcs.splice(longestIdx + 1, 0, wordCount(part2));
          wcs[longestIdx] = wordCount(part1);
          changes.push(`Split long sentence at comma to vary rhythm`);
          modified = true;
        }
      }
    }
  }

  for (let i = 0; i < result.length - 1; i++) {
    const wc1 = wordCount(result[i]);
    const wc2 = wordCount(result[i + 1]);
    if (wc1 < mean * 0.7 && wc2 < mean * 0.7 && wc1 + wc2 < mean * 1.5) {
      const s1 = result[i].replace(/[.!?]+$/, "");
      const s2 = result[i + 1];
      result[i] = `${s1} and ${s2.charAt(0).toLowerCase()}${s2.slice(1)}`;
      result.splice(i + 1, 1);
      changes.push(`Merged two short adjacent sentences to vary rhythm`);
      modified = true;
      break;
    }
  }

  if (!modified) return text;
  return fixSpaces(rejoinText(result));
}

function compressFillers(
  text: string,
  options: HumanRewriteConfig,
  changes: string[]
): string {
  let result = text;

  const phraseRemovals: Array<{ pattern: RegExp; label: string }> = [
    { pattern: /\bit is worth noting that\b\s*/gi, label: "it is worth noting that" },
    { pattern: /\bit's worth noting that\b\s*/gi, label: "it's worth noting that" },
    { pattern: /\bit is worth mentioning that\b\s*/gi, label: "it is worth mentioning that" },
    { pattern: /\bit's worth mentioning that\b\s*/gi, label: "it's worth mentioning that" },
    { pattern: /\bquite simply\b,?\s*/gi, label: "quite simply" },
    { pattern: /\bvery simply\b,?\s*/gi, label: "very simply" },
    { pattern: /\bneedless to say\b,?\s*/gi, label: "needless to say" },
    { pattern: /\bas you can imagine\b,?\s*/gi, label: "as you can imagine" },
    { pattern: /\bessentially,?\s*/gi, label: "essentially" },
    { pattern: /\bbasically,?\s*/gi, label: "basically" },
    { pattern: /\bactually,?\s*/gi, label: "actually" },
    { pattern: /\bclearly,?\s*/gi, label: "clearly" },
    { pattern: /\bobviously,?\s*/gi, label: "obviously" },
    { pattern: /\bundoubtedly,?\s*/gi, label: "undoubtedly" },
    { pattern: /\bdefinitely,?\s*/gi, label: "definitely" },
    { pattern: /\btruly\s+(?=\w)/gi, label: "truly" },
    { pattern: /\bliterally\s+(?=\w)/gi, label: "literally" },
    { pattern: /\bvery\s+(?=\w)/gi, label: "very" },
  ];

  const emotionsAllowingJust: EmotionMode[] = ["frustration", "annoyance"];
  if (!emotionsAllowingJust.includes(options.emotion)) {
    phraseRemovals.push({ pattern: /\bjust\s+(?=\w)/gi, label: "just" });
    phraseRemovals.push({ pattern: /\breally\s+(?=\w)/gi, label: "really" });
  }

  for (const { pattern, label } of phraseRemovals) {
    const matches = result.match(pattern);
    if (matches && matches.length > 0) {
      result = result.replace(pattern, "");
      changes.push(`Removed filler "${label}" (${matches.length}x)`);
    }
  }

  result = fixSpaces(result);
  result = fixCapitalization(result);
  return result;
}

function substituteSynonyms(
  text: string,
  _options: HumanRewriteConfig,
  changes: string[]
): string {
  let result = text;
  let totalReplaced = 0;

  const entries = Object.entries(SYNONYM_MAP).sort(
    ([a], [b]) => b.length - a.length
  );

  for (const [buzzword, replacement] of entries) {
    const escaped = escapeRegex(buzzword);
    const re = new RegExp(`\\b${escaped}\\b`, "gi");
    const matches = result.match(re);
    if (!matches || matches.length === 0) continue;

    result = result.replace(re, (match) => {
      const isUpperCase =
        match[0] === match[0].toUpperCase() && match[0] !== match[0].toLowerCase();
      return isUpperCase ? capitalize(replacement) : replacement;
    });
    totalReplaced += matches.length;
  }

  if (totalReplaced > 0) {
    changes.push(`Substituted ${totalReplaced} buzzword(s) with plain language`);
  }
  return result;
}

function stripHedgePhrases(
  text: string,
  _options: HumanRewriteConfig,
  changes: string[]
): string {
  let result = text;

  const sorted = [...HEDGE_PHRASES].sort((a, b) => b.length - a.length);
  for (const phrase of sorted) {
    const escaped = escapeRegex(phrase);
    const re = new RegExp(`\\b${escaped}\\b,?\\s*`, "gi");
    const matches = result.match(re);
    if (!matches || matches.length === 0) continue;
    result = result.replace(re, "");
    changes.push(`Removed hedge phrase "${phrase}" (${matches.length}x)`);
  }

  result = fixSpaces(result);
  result = fixCapitalization(result);
  return result;
}

function addEmotionalOpener(
  text: string,
  options: HumanRewriteConfig,
  changes: string[]
): string {
  const total = wordCount(text);
  if (total === 0) return text;
  const intensity = emotionalWordCount(text) / total;
  if (intensity >= 0.03) return text;

  const phrases = EMOTIONAL_PHRASES[options.emotion];
  const phrase = phrases[pickIndex(text.length, phrases.length)];
  const result = `${phrase} ${capitalize(text)}`;
  changes.push(`Added emotional opener for ${options.emotion} tone: "${phrase}"`);
  return result;
}

function breakParagraphSymmetry(
  text: string,
  _options: HumanRewriteConfig,
  changes: string[]
): string {
  const paragraphs = splitParagraphs(text);
  if (paragraphs.length < 3) return text;

  const wcs = paragraphs.map(wordCount);
  const mean = wcs.reduce((a, b) => a + b, 0) / wcs.length;
  const avgDev =
    wcs.reduce((sum, c) => sum + Math.abs(c - mean) / mean, 0) / wcs.length;
  const symmetryScore = clamp(1 - avgDev, 0, 1);
  if (symmetryScore <= 0.8) return text;

  let mergeIdx = -1;
  let smallestSum = Infinity;
  for (let i = 0; i < paragraphs.length - 1; i++) {
    const combined = wcs[i] + wcs[i + 1];
    if (combined < smallestSum && combined <= mean * 3) {
      smallestSum = combined;
      mergeIdx = i;
    }
  }

  if (mergeIdx === -1) return text;

  const merged = paragraphs[mergeIdx] + " " + paragraphs[mergeIdx + 1];
  const newParagraphs = [
    ...paragraphs.slice(0, mergeIdx),
    merged,
    ...paragraphs.slice(mergeIdx + 2),
  ];

  changes.push(
    `Merged paragraphs ${mergeIdx + 1} and ${mergeIdx + 2} to break structural symmetry`
  );
  return newParagraphs.join("\n\n");
}

// ── Main Export — V2 Pipeline ─────────────────────────────────

export function rewriteHuman(
  text: string,
  options: HumanRewriteConfig
): RewriteResult {
  const beforeScore = scoreAiFingerprint(text).score;
  let working = text;
  const changes: string[] = [];
  let anchor: ThoughtAnchor | undefined;

  const useV2 = options.useThoughtAnchor !== false;

  // ── V2 PHASE: Think first, then reconstruct ───────────────

  if (useV2) {
    // Step 1: Generate thought anchor — extract domain, stance, coreThought
    anchor = generateThoughtAnchor(text, options);
    changes.push(
      `[V2] Generated thought anchor — domain stance: "${truncate(anchor.stance, 60)}"`
    );

    // Step 2: Build anchored draft — reconstruct text from anchor + stance
    working = buildAnchoredDraft(text, anchor, options, changes);

    // Step 3: Strip teaching markers + hard-banned phrases BEFORE sentence
    // transforms so patterns don't get half-converted by later passes
    working = stripHardBanned(working, changes);
    if (options.intensity === "medium" || options.intensity === "aggressive") {
      working = removeTeachingTone(working, options, changes);
    }

    // Step 4: Apply imperfect sentence transforms (human speaking patterns)
    working = applyImperfectSentences(working, options.emotion, changes);

    // Step 5: Inject 1–2 conversational phrases so output sounds spoken
    working = injectConversationalPhrases(working, options.emotion, changes);

    // Step 6: Break remaining over-preserved sentence structure
    if (options.intensity === "medium" || options.intensity === "aggressive") {
      working = breakSentenceStructure(working, changes);
    }
  } else {
    // V1 fallback: strip generic opener + hard-banned phrases
    working = stripGenericOpener(working, options, changes);
    working = stripHardBanned(working, changes);
  }

  // ── RHYTHM PHASE ──────────────────────────────────────────

  if (
    options.useRhythmEngine !== false &&
    (options.intensity === "medium" || options.intensity === "aggressive")
  ) {
    const rhythmProfile: RhythmProfile = {
      targetShortCount: 1,
      targetLongCount: 1,
      allowFragments: true,
      allowRunOns: options.intensity === "aggressive",
    };
    working = applyHumanRhythm(working, rhythmProfile, options.emotion, changes);
  }

  // ── CLEANING PHASE (shared with V1) ──────────────────────

  // Always reduce transitions
  working = reduceTransitions(working, options, changes);

  if (options.intensity === "medium" || options.intensity === "aggressive") {
    working = removeTeachingTone(working, options, changes);
    working = breakSentenceUniformity(working, options, changes);
    working = compressFillers(working, options, changes);
    working = substituteSynonyms(working, options, changes);
    working = stripHedgePhrases(working, options, changes);

    // Only add emotional opener if no thought anchor was used (V2 anchor already grounds tone)
    if (!useV2) {
      working = addEmotionalOpener(working, options, changes);
    }
  }

  if (options.intensity === "aggressive") {
    working = breakParagraphSymmetry(working, options, changes);
  }

  const afterScore = scoreAiFingerprint(working).score;

  return {
    rewrittenText: working,
    beforeScore,
    afterScore,
    changes,
    thoughtAnchor: anchor,
  };
}
