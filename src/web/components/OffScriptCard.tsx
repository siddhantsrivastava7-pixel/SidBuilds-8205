import { motion } from "framer-motion";
import { useInView } from "./useInView";
import { TiltCard } from "./TiltCard";
import { CardCTA } from "./CardCTA";
import { DUR, EASE_OUT, Y_ENTER, prefersReducedMotion } from "./motion";

const HREF = "/offscript";
const AMBER = "#c9923c";

const diffs = [
  { type: "rem", text: "As an AI language model, I must clarify that…" },
  { type: "rem", text: "I hope this helps! Let me know if you need…"   },
  { type: "add", text: "The answer is simple: start with the data."     },
  { type: "add", text: "Push back. The first draft is always wrong."    },
];

const bullets = [
  "Strip AI hedging & filler phrases",
  "Restore confident, direct voice",
  "One click — works on any text",
];

export function OffScriptCard() {
  const { ref, inView } = useInView();
  const noMotion = prefersReducedMotion();

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      initial={{ opacity: 0, y: noMotion ? 0 : Y_ENTER }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: DUR.enter, ease: EASE_OUT, delay: 0.07 }}
    >
      <TiltCard accentColor="rgba(201,146,60,0.3)" style={{ padding: "3.5rem" }} className="sb-card-pad" href={HREF}>
        <div className="sb-card-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5rem" }}>

          {/* Left */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{
              fontSize: "0.6875rem", color: "#3d2e14", fontWeight: 600,
              letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1.5rem",
            }}>
              Writing Tools
            </div>

            <h3 style={{
              fontSize: "2rem", fontWeight: 700, color: "#e6eaf0",
              margin: 0, marginBottom: "0.5rem",
              letterSpacing: "-0.035em", lineHeight: 1.12,
            }}>
              OffScript
            </h3>

            <p style={{
              fontSize: "1rem", color: "#8b98a5", fontWeight: 500,
              margin: 0, marginBottom: "0.625rem",
              letterSpacing: "-0.015em", lineHeight: 1.4,
            }}>
              De-AI your writing in seconds.
            </p>

            <p style={{
              fontSize: "0.875rem", color: "#3d4d5c", fontWeight: 400,
              margin: 0, marginBottom: "1.75rem", lineHeight: 1.65, maxWidth: 360,
            }}>
              Paste AI-generated text — OffScript strips the hedging, filler, and corporate-speak, giving back a confident human voice.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", marginBottom: "2rem" }}>
              {bullets.map((item) => (
                <div key={item} style={{
                  display: "flex", alignItems: "flex-start",
                  gap: "0.625rem", fontSize: "0.8125rem", color: "#5a4a38",
                }}>
                  <span style={{ color: "#4a3820", marginTop: 1, flexShrink: 0 }}>•</span>
                  {item}
                </div>
              ))}
            </div>

            <CardCTA label="Try it free" color={AMBER} hoverColor="#e6eaf0" />
          </div>

          {/* Right — diff viz */}
          <div className="sb-card-right" style={{
            display: "flex", flexDirection: "column",
            justifyContent: "center", padding: "2rem 0",
          }}>
            <div style={{
              fontSize: "0.6875rem", color: "#3d2e14", fontWeight: 500,
              letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "1rem",
            }}>
              Before / After
            </div>

            <div style={{
              display: "flex", flexDirection: "column", gap: "0.375rem",
              fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
            }}>
              {diffs.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: DUR.std, ease: "easeOut", delay: noMotion ? 0 : 0.3 + i * 0.18 }}
                  style={{
                    display: "flex", gap: "0.625rem", alignItems: "flex-start",
                    fontSize: "0.78rem", lineHeight: 1.6,
                    color: line.type === "rem" ? "rgba(180,80,80,0.6)" : "rgba(80,160,80,0.7)",
                    background: line.type === "rem"
                      ? "rgba(180,60,60,0.06)"
                      : "rgba(60,160,60,0.06)",
                    padding: "0.25rem 0.5rem",
                    borderRadius: 4,
                    borderLeft: `2px solid ${line.type === "rem" ? "rgba(180,60,60,0.25)" : "rgba(60,160,60,0.3)"}`,
                  }}
                >
                  <span style={{ flexShrink: 0, opacity: 0.7 }}>{line.type === "rem" ? "−" : "+"}</span>
                  <span>{line.text}</span>
                </motion.div>
              ))}
            </div>

            {/* Summary line */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: DUR.enter, ease: EASE_OUT, delay: noMotion ? 0 : 1.1 }}
              style={{ marginTop: "1.5rem", fontSize: "0.8rem", color: "#7a5a2a", fontWeight: 600, letterSpacing: "-0.01em" }}
            >
              Human voice restored
            </motion.div>
          </div>
        </div>
      </TiltCard>
    </motion.div>
  );
}
