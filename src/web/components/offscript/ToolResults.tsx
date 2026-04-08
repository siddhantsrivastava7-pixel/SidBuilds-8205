import { useState } from "react";
import { motion } from "framer-motion";
import { DUR, EASE_OUT } from "../motion";

export interface ProcessResult {
  output:     string;
  scoreBefore: number;
  scoreAfter:  number;
  changes:    string[];
}

interface Props {
  result: ProcessResult;
}

function ScoreDot({ score }: { score: number }) {
  const color = score > 60 ? "#ef4444" : score > 35 ? "#c9923c" : "#22c55e";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}60` }} />
      <span style={{ color, fontSize: "1.375rem", fontWeight: 700, letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums" }}>
        {score}
      </span>
    </div>
  );
}

export function ToolResults({ result }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard?.writeText(result.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const delta = result.scoreBefore - result.scoreAfter;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.enter, ease: EASE_OUT }}
      style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
    >
      {/* Score strip */}
      <div style={{
        display: "flex", alignItems: "center", gap: "1.5rem",
        padding: "1rem 1.25rem",
        background: "rgba(14,19,26,0.9)",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: 10,
        flexWrap: "wrap",
      }}>
        <div>
          <div style={{ fontSize: "0.6rem", color: "#1e2a32", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Feels like AI</div>
          <ScoreDot score={result.scoreBefore} />
        </div>
        <div style={{ fontSize: "1.125rem", color: "#1a2530", fontWeight: 300 }}>→</div>
        <div>
          <div style={{ fontSize: "0.6rem", color: "#1e2a32", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Feels human</div>
          <ScoreDot score={result.scoreAfter} />
        </div>
        <div style={{ marginLeft: "auto" }}>
          <div style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#22c55e", letterSpacing: "-0.01em" }}>
            ↓ {delta} pts less AI
          </div>
          <div style={{ fontSize: "0.625rem", color: "#1e2a32", marginTop: 2 }}>
            {Math.round((delta / result.scoreBefore) * 100)}% reduction
          </div>
        </div>
      </div>

      {/* What changed */}
      <div style={{
        padding: "1rem 1.25rem",
        background: "rgba(255,255,255,0.015)",
        border: "1px solid rgba(255,255,255,0.04)",
        borderRadius: 10,
      }}>
        <div style={{ fontSize: "0.6rem", color: "#2a3540", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
          What changed
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          {result.changes.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: DUR.std, ease: EASE_OUT, delay: i * 0.05 }}
              style={{ display: "flex", gap: "0.5rem", fontSize: "0.8rem", color: "#2e3c48" }}
            >
              <span style={{ color: "#22c55e", flexShrink: 0 }}>–</span>
              {c}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Output */}
      <div style={{
        position: "relative",
        padding: "1.125rem 1.25rem",
        background: "rgba(6,10,15,0.8)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 10,
      }}>
        <div style={{ fontSize: "0.7rem", color: "#2e3c48", marginBottom: "0.875rem", letterSpacing: "-0.01em" }}>
          same idea. less AI.
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem" }}>
          <div style={{ fontSize: "0.6rem", color: "#2a3540", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Output</div>
          <button onClick={copy} style={{
            padding: "0.25rem 0.625rem",
            background: copied ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${copied ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.06)"}`,
            borderRadius: 5, color: copied ? "#22c55e" : "#3d4d5c",
            fontSize: "0.7rem", fontWeight: 600, cursor: "pointer",
            transition: `all ${DUR.fast}s ease`,
            letterSpacing: "0.04em", textTransform: "uppercase" as const,
          }}>
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>
        <p style={{ fontSize: "0.875rem", color: "#8b98a5", lineHeight: 1.75, margin: 0, whiteSpace: "pre-wrap" }}>
          {result.output}
        </p>
      </div>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: DUR.enter, delay: 0.3 }}
        style={{ fontSize: "0.75rem", color: "#2e3c48", margin: 0, textAlign: "center", letterSpacing: "-0.01em" }}
      >
        same idea, different feel
      </motion.p>
    </motion.div>
  );
}
