import { motion } from "framer-motion";
import { useInView } from "./useInView";
import { TiltCard } from "./TiltCard";
import { CardCTA } from "./CardCTA";
import { DUR, EASE_OUT, Y_ENTER, prefersReducedMotion } from "./motion";

const HREF = "#"; // update when live

const bullets = [
  "One-click prompt enhancement",
  "Works across major AI tools",
  "Built-in templates + fallback API",
];

// CTA label
const CTA = "Improve your prompts →";

const platforms = ["ChatGPT", "Claude", "Gemini"];

// Before / after prompt example
const BEFORE = "write a blog post about AI";
const AFTER  = "Write a 600-word blog post for a technical audience about how large language models are changing developer workflows. Use a neutral, editorial tone. Include 3 concrete examples. End with a clear call to action.";

export function PromptBoostCard() {
  const { ref, inView } = useInView();
  const noMotion = prefersReducedMotion();

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      initial={{ opacity: 0, y: noMotion ? 0 : Y_ENTER }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: DUR.enter, ease: EASE_OUT, delay: 0.07 }}
    >
      <TiltCard accentColor="rgba(168,85,247,0.35)" style={{ padding: "3.5rem" }} className="sb-card-pad" href={HREF}>
        <div className="sb-card-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5rem" }}>

          {/* Left */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{
              fontSize: "0.6875rem", color: "#2a3540", fontWeight: 600,
              letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1.5rem",
            }}>
              AI Tooling
            </div>

            <h3 style={{
              fontSize: "2rem", fontWeight: 700, color: "#e6eaf0",
              margin: 0, marginBottom: "0.5rem",
              letterSpacing: "-0.035em", lineHeight: 1.12,
            }}>
              PromptBoost
            </h3>

            {/* Tagline */}
            <p style={{
              fontSize: "1rem", color: "#8b98a5", fontWeight: 500,
              margin: 0, marginBottom: "0.625rem",
              letterSpacing: "-0.015em", lineHeight: 1.4,
            }}>
              Better prompts. Better outputs.
            </p>

            {/* Hook */}
            <p style={{
              fontSize: "0.875rem", color: "#3d4d5c", fontWeight: 400,
              margin: 0, marginBottom: "1.75rem", lineHeight: 1.65, maxWidth: 360,
            }}>
              Automatically upgrades your prompt before sending it to ChatGPT, Claude, Gemini & more.
            </p>

            {/* Bullets */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", marginBottom: "2rem" }}>
              {bullets.map((item) => (
                <div key={item} style={{
                  display: "flex", alignItems: "flex-start",
                  gap: "0.625rem", fontSize: "0.8125rem", color: "#2e3c48",
                }}>
                  <span style={{ color: "#1e3a4a", marginTop: 1, flexShrink: 0 }}>•</span>
                  {item}
                </div>
              ))}
            </div>

            <CardCTA label="Improve your prompts" color="#9a6ed8" hoverColor="#c4a0f5" />
          </div>

          {/* Right — before/after prompt viz */}
          <div className="sb-card-right" style={{
            display: "flex", flexDirection: "column",
            gap: "1.25rem", padding: "2rem 0", justifyContent: "center",
          }}>

            {/* Platforms */}
            <div style={{ display: "flex", gap: "0.625rem", marginBottom: "0.5rem" }}>
              {platforms.map((p, i) => (
                <motion.div
                  key={p}
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ duration: DUR.std, ease: "easeOut", delay: noMotion ? 0 : 0.2 + i * 0.1 }}
                  style={{
                    fontSize: "0.625rem", fontWeight: 600,
                    color: "#2a3540", letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "0.25rem 0.625rem",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 5,
                  }}
                >
                  {p}
                </motion.div>
              ))}
            </div>

            {/* Before */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: DUR.enter, ease: EASE_OUT, delay: noMotion ? 0 : 0.4 }}
            >
              <div style={{
                fontSize: "0.6875rem", color: "#2a3540", fontWeight: 500,
                letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.625rem",
              }}>
                Before
              </div>
              <div style={{
                padding: "0.875rem 1rem",
                background: "rgba(239,68,68,0.04)",
                border: "1px solid rgba(239,68,68,0.08)",
                borderRadius: 8,
                fontSize: "0.8rem",
                color: "#4a5562",
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                lineHeight: 1.5,
              }}>
                {BEFORE}
              </div>
            </motion.div>

            {/* Arrow */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: DUR.std, delay: noMotion ? 0 : 0.65 }}
              style={{ textAlign: "center", color: "#a855f7", fontSize: "0.75rem", opacity: 0.5 }}
            >
              ↓ PromptBoost
            </motion.div>

            {/* After */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: DUR.enter, ease: EASE_OUT, delay: noMotion ? 0 : 0.8 }}
            >
              <div style={{
                fontSize: "0.6875rem", color: "#2a3540", fontWeight: 500,
                letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.625rem",
              }}>
                After
              </div>
              <div style={{
                padding: "0.875rem 1rem",
                background: "rgba(168,85,247,0.04)",
                border: "1px solid rgba(168,85,247,0.1)",
                borderRadius: 8,
                fontSize: "0.78rem",
                color: "#6a7a88",
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                lineHeight: 1.6,
              }}>
                {AFTER}
              </div>
            </motion.div>

          </div>
        </div>
      </TiltCard>
    </motion.div>
  );
}
