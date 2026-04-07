import { motion } from "framer-motion";
import { useInView } from "./useInView";
import { TiltCard } from "./TiltCard";
import { CardCTA } from "./CardCTA";
import { DUR, EASE_OUT, Y_ENTER, prefersReducedMotion } from "./motion";

const HREF = "https://github.com/siddhantsrivastava7-pixel/super-saver";

const logs = [
  { text: "$ supersaver analyze ./project",         delay: 0.30, color: "#3d4d5c" },
  { text: "→ Scanning 2,847 token usage patterns",  delay: 0.52, color: "#2e3c48" },
  { text: "→ Identifying redundant context blocks", delay: 0.70, color: "#2e3c48" },
  { text: "→ Found 14 optimization opportunities",  delay: 0.88, color: "#4a6a8a" },
  { text: "✓ Analysis complete",                    delay: 1.06, color: "#3d6644" },
];

const bullets = [
  "Save 50–70% tokens automatically",
  "Works with your existing workflow",
  "Zero change to output quality",
];

export function SuperSaverCard() {
  const { ref, inView } = useInView();
  const noMotion = prefersReducedMotion();

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      initial={{ opacity: 0, y: noMotion ? 0 : Y_ENTER }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: DUR.enter, ease: EASE_OUT, delay: 0.07 }}
    >
      <TiltCard accentColor="rgba(34,197,94,0.35)" style={{ padding: "3.5rem" }} href={HREF} external>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5rem" }}>

          {/* Left */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{
              fontSize: "0.6875rem", color: "#2a3540", fontWeight: 600,
              letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1.5rem",
            }}>
              Developer Tooling
            </div>

            <h3 style={{
              fontSize: "2rem", fontWeight: 700, color: "#e6eaf0",
              margin: 0, marginBottom: "0.5rem",
              letterSpacing: "-0.035em", lineHeight: 1.12,
            }}>
              Super Saver
            </h3>

            {/* Tagline */}
            <p style={{
              fontSize: "1rem", color: "#8b98a5", fontWeight: 500,
              margin: 0, marginBottom: "0.625rem",
              letterSpacing: "-0.015em", lineHeight: 1.4,
            }}>
              Stop wasting tokens on every prompt.
            </p>

            {/* Hook */}
            <p style={{
              fontSize: "0.875rem", color: "#3d4d5c", fontWeight: 400,
              margin: 0, marginBottom: "1.75rem", lineHeight: 1.65, maxWidth: 360,
            }}>
              Super Saver sits inside Claude Code & Codex and optimizes prompts before they hit the model.
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

            <CardCTA label="Save tokens now" color="#4a9e6a" hoverColor="#e6eaf0" />
          </div>

          {/* Right — terminal */}
          <div style={{
            display: "flex", flexDirection: "column",
            gap: "2rem", padding: "2rem 0", justifyContent: "center",
          }}>
            <div>
              <div style={{
                fontSize: "0.6875rem", color: "#2a3540", fontWeight: 500,
                letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "1rem",
              }}>
                Analysis
              </div>
              <div style={{
                display: "flex", flexDirection: "column", gap: "0.375rem",
                fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
              }}>
                {logs.map((log, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : {}}
                    transition={{ duration: DUR.std, ease: "easeOut", delay: noMotion ? 0 : log.delay }}
                    style={{ fontSize: "0.78rem", color: log.color, lineHeight: 1.6 }}
                  >
                    {log.text}
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: DUR.enter, ease: EASE_OUT, delay: noMotion ? 0 : 1.3 }}
            >
              <div style={{
                fontSize: "0.6875rem", color: "#2a3540", fontWeight: 500,
                letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "1.25rem",
              }}>
                Token Usage
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {[
                  { label: "Before", pct: 100, count: "48,200", color: "rgba(239,68,68,0.4)"  },
                  { label: "After",  pct: 34,  count: "16,400", color: "rgba(34,197,94,0.45)" },
                ].map((row, i) => (
                  <div key={row.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: "0.8rem", color: "#3d4d5c" }}>{row.label}</span>
                      <span style={{ fontSize: "0.8rem", color: "#6a7a88", fontWeight: 500, fontFamily: "monospace" }}>{row.count}</span>
                    </div>
                    <div style={{ height: 3, background: "rgba(255,255,255,0.04)", borderRadius: 100, overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={inView ? { width: `${row.pct}%` } : {}}
                        transition={{ duration: 0.9, delay: noMotion ? 0 : 1.4 + i * 0.15, ease: EASE_OUT }}
                        style={{ height: "100%", background: row.color, borderRadius: 100 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "1.25rem", fontSize: "0.8rem", color: "#3d6644", fontWeight: 600, letterSpacing: "-0.01em" }}>
                66% reduction
              </div>
            </motion.div>
          </div>
        </div>
      </TiltCard>
    </motion.div>
  );
}
