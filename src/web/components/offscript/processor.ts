import type { ToolOptions } from "./ToolControls";
import type { ProcessResult } from "./ToolResults";

/**
 * Mock processor — replace the body of this function with your real engine call.
 * Signature is intentionally simple: takes text + options, returns a ProcessResult.
 *
 * Real integration:
 *   const res = await fetch("/api/deai", { method: "POST", body: JSON.stringify({ input, options }) });
 *   return res.json();
 */

// Heuristic AI score — counts common AI writing patterns
function scoreText(text: string): number {
  const patterns = [
    /\bin today's\b/gi,
    /\bit is (more )?important (to|that)\b/gi,
    /\bleverage\b/gi,
    /\bfurthermore\b/gi,
    /\bin conclusion\b/gi,
    /\bcomprehensive\b/gi,
    /\bsignificantly\b/gi,
    /\bwell-positioned\b/gi,
    /\bproven (techniques|strategies|methods)\b/gi,
    /\bkey (insights|takeaways|strategies|points)\b/gi,
    /\bfast-paced world\b/gi,
    /\bwalk you through\b/gi,
    /\bit is worth noting\b/gi,
    /\bseamlessly\b/gi,
    /\brobust\b/gi,
    /\bdelve\b/gi,
    /\btailored\b/gi,
    /\bensure\b/gi,
    /\butilize\b/gi,
    /\boptimal\b/gi,
  ];
  const words = text.split(/\s+/).length;
  const hits = patterns.reduce((n, p) => n + (text.match(p)?.length ?? 0), 0);
  const sentenceEnds = (text.match(/[.!?]/g) || []).length;
  const avgSentenceLength = words / Math.max(sentenceEnds, 1);
  const lengthPenalty = avgSentenceLength > 22 ? 10 : 0;
  const base = Math.min(Math.round((hits / Math.max(words / 10, 1)) * 55) + lengthPenalty, 97);
  return Math.max(base, 8);
}

function applyMockTransform(text: string, options: ToolOptions): string {
  let out = text;

  // Strip common AI openers
  out = out.replace(/^In today'?s fast-?paced world,?\s*/i, "");
  out = out.replace(/^It is (more )?important (to|that) (note|understand|recognize) that\s*/i, "");

  // Remove filler transitions
  out = out.replace(/\bFurthermore,?\s*/gi, "");
  out = out.replace(/\bIn conclusion,?\s*/gi, "");
  out = out.replace(/\bIt is worth noting that\s*/gi, "");
  out = out.replace(/\bAdditionally,?\s*/gi, "");

  // Replace corporate verbs
  out = out.replace(/\bleverag(e|ing)\b/gi, "us$1");
  out = out.replace(/\butiliz(e|ing)\b/gi, "us$1");
  out = out.replace(/\boptimal\b/gi, "best");
  out = out.replace(/\brobust\b/gi, "solid");
  out = out.replace(/\bseamlessly\b/gi, "cleanly");
  out = out.replace(/\bdelve into\b/gi, "look at");
  out = out.replace(/\bensure\b/gi, "make sure");
  out = out.replace(/\bsignificantly\b/gi, "a lot");
  out = out.replace(/\bcomprehensive\b/gi, "full");
  out = out.replace(/\bwell-positioned\b/gi, "set up");
  out = out.replace(/\bproven techniques\b/gi, "things that work");
  out = out.replace(/\bkey strategies\b/gi, "ways");

  // Mode-specific transforms
  if (options.mode === "Frustrated Rant") {
    out = out.replace(/\.\s+/g, ". ").trim();
    out = out.charAt(0).toLowerCase() + out.slice(1);
    if (options.intensity === "Aggressive") out = out.replace(/\.$/, ". seriously.");
  }

  if (options.mode === "Sharp Opinion") {
    out = out.replace(/you will be/gi, "you're");
    out = out.replace(/you should/gi, "just");
  }

  if (options.mode === "Casual Internet") {
    out = out.replace(/\bprofessionals\b/gi, "people");
    out = out.replace(/\bmessaging\b/gi, "writing");
    out = out.replace(/\bimplemented\b/gi, "used");
  }

  // Intensity
  if (options.intensity === "Aggressive") {
    out = out.replace(/can significantly improve/gi, "will change");
    out = out.replace(/may help/gi, "helps");
  }

  // Trim double spaces
  out = out.replace(/\s{2,}/g, " ").trim();

  return out;
}

function diffChanges(before: string, after: string, options: ToolOptions): string[] {
  const changes: string[] = [];

  if (/in today'?s/i.test(before) && !/in today'?s/i.test(after))
    changes.push("removed generic opener");
  if (/furthermore|in conclusion|additionally/i.test(before))
    changes.push("stripped essay-style transitions");
  if (/leverage|utilize|seamlessly/i.test(before))
    changes.push("replaced corporate vocabulary");
  if (/significant(ly)?|comprehensive/i.test(before))
    changes.push("cut filler amplifiers");
  if (options.mode === "Frustrated Rant")
    changes.push("shifted tone to frustrated voice");
  if (options.intensity === "Aggressive")
    changes.push("increased directness under aggressive intensity");
  if (options.emotion !== "Confidence")
    changes.push(`applied ${options.emotion.toLowerCase()} emotional register`);
  if (changes.length < 2)
    changes.push("reduced transition-heavy phrasing");
  if (changes.length < 3)
    changes.push("broke paragraph symmetry");

  return changes;
}

export async function processText(input: string, options: ToolOptions): Promise<ProcessResult> {
  // Simulate async latency — remove when wiring real engine
  await new Promise(r => setTimeout(r, 900));

  const scoreBefore = scoreText(input);
  const output      = applyMockTransform(input, options);
  const scoreAfter  = Math.max(scoreText(output), scoreBefore - 45);
  const changes     = diffChanges(input, output, options);

  return { output, scoreBefore, scoreAfter, changes };
}
