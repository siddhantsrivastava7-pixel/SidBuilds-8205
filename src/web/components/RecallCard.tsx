import { motion } from "framer-motion";
import { useInView } from "./useInView";
import { TiltCard } from "./TiltCard";
import { CardCTA } from "./CardCTA";
import { DUR, EASE_OUT, Y_ENTER, prefersReducedMotion } from "./motion";

const HREF = "/recall";

const bullets = [
  "Search bookmarks, notes, and links in one place",
  "Finds things by how you remember them, not where you saved them",
  "One shortcut to capture anything, anywhere",
];

const savedItems = [
  { label: "stripe api rate limits", time: "2d ago" },
  { label: "indie hacker pricing article", time: "5d ago" },
  { label: "react server components talk", time: "1w ago" },
];

export function RecallCard() {
  const { ref, inView } = useInView();
  const noMotion = prefersReducedMotion();

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      initial={{ opacity: 0, y: noMotion ? 0 : Y_ENTER }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: DUR.enter, ease: EASE_OUT, delay: noMotion ? 0 : 0.06 }}
      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
    >
      <TiltCard accentColor="rgba(59,130,246,0.35)" style={{ padding: "3.5rem" }} className="sb-card-pad" href={HREF}>
        <div className="sb-card-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5rem" }}>

          {/* Left */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{
              fontSize: "0.6875rem", color: "#2a3540", fontWeight: 600,
              letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1.5rem",
            }}>
              Productivity
            </div>

            <h3 style={{
              fontSize: "2rem", fontWeight: 700, color: "#e6eaf0",
              margin: 0, marginBottom: "0.5rem",
              letterSpacing: "-0.035em", lineHeight: 1.12,
            }}>
              Recall
            </h3>

            {/* Tagline */}
            <p style={{
              fontSize: "1rem", color: "#8b98a5", fontWeight: 500,
              margin: 0, marginBottom: "0.625rem",
              letterSpacing: "-0.015em", lineHeight: 1.4,
            }}>
              Saved things. Finally findable.
            </p>

            {/* Hook */}
            <p style={{
              fontSize: "0.875rem", color: "#3d4d5c", fontWeight: 400,
              margin: 0, marginBottom: "1.75rem", lineHeight: 1.65, maxWidth: 360,
            }}>
              You already save everything. Recall makes sure you can actually find it again.
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

            <CardCTA label="See Recall" color="#6a9fd8" hoverColor="#93c5fd" />
          </div>

          {/* Right — search UI viz */}
          <div className="sb-card-right" style={{
            display: "flex", flexDirection: "column",
            gap: "1.5rem", padding: "2rem 0", justifyContent: "center",
          }}>

            {/* Search bar mockup */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: DUR.enter, ease: EASE_OUT, delay: noMotion ? 0 : 0.3 }}
            >
              <div style={{
                display: "flex", alignItems: "center", gap: "0.625rem",
                padding: "0.75rem 1rem",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 9,
              }}>
                <span style={{ color: "#2e3c48", fontSize: "0.875rem", flexShrink: 0 }}>⌕</span>
                <span style={{
                  fontSize: "0.8125rem", color: "#3d4d5c",
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                  letterSpacing: "-0.01em", flex: 1,
                }}>
                  stripe pricing article...
                </span>
                <span style={{
                  width: 2, height: 12, background: "#3b82f6",
                  borderRadius: 1, opacity: 0.7,
                  animation: "sb-pulse 1.1s ease-in-out infinite",
                  flexShrink: 0,
                }} />
              </div>
            </motion.div>

            {/* Results */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {savedItems.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -4 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: DUR.base, ease: EASE_OUT, delay: noMotion ? 0 : 0.42 + i * 0.08 }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "0.625rem 0.875rem",
                    background: i === 0 ? "rgba(59,130,246,0.06)" : "transparent",
                    border: i === 0 ? "1px solid rgba(59,130,246,0.1)" : "1px solid transparent",
                    borderRadius: 7,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                    <span style={{ color: i === 0 ? "#3b82f6" : "#1e2a38", fontSize: "0.7rem" }}>
                      {i === 0 ? "→" : "·"}
                    </span>
                    <span style={{
                      fontSize: "0.8125rem",
                      color: i === 0 ? "#8b98a5" : "#2e3c48",
                      letterSpacing: "-0.01em",
                    }}>
                      {item.label}
                    </span>
                  </div>
                  <span style={{ fontSize: "0.6875rem", color: "#1e2a38", fontFamily: "monospace" }}>
                    {item.time}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Found count */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: DUR.enter, ease: EASE_OUT, delay: noMotion ? 0 : 0.72 }}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#3b82f6", opacity: 0.5, display: "inline-block" }} />
              <span style={{ fontSize: "0.75rem", color: "#1e2a38", fontFamily: "monospace" }}>
                3 results · instant
              </span>
            </motion.div>
          </div>

        </div>
      </TiltCard>
    </motion.div>
  );
}
