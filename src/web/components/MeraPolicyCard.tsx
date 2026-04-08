import { motion } from "framer-motion";
import { useInView } from "./useInView";
import { TiltCard } from "./TiltCard";
import { AllocationBar } from "./AllocationBar";
import { CardCTA } from "./CardCTA";
import { DUR, EASE_OUT, Y_ENTER, prefersReducedMotion } from "./motion";

const HREF = "https://www.merapolicyadvisor.in/";

const allocations = [
  { label: "Equity", pct: 62, color: "#3b82f6" },
  { label: "Debt",   pct: 28, color: "#22c55e" },
  { label: "Gold",   pct: 10, color: "#c9923c" },
];

const bullets = [
  "Covers mutual funds, insurance, and equity",
  "No black-box AI — fully explainable logic",
  "Built on structured, advisor-grade rules",
];

export function MeraPolicyCard() {
  const { ref, inView } = useInView();
  const noMotion = prefersReducedMotion();

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      initial={{ opacity: 0, y: noMotion ? 0 : Y_ENTER }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: DUR.enter, ease: EASE_OUT }}
      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
    >
      <TiltCard accentColor="rgba(59,130,246,0.4)" style={{ padding: "3.5rem" }} className="sb-card-pad" href={HREF} external>
        <div className="sb-card-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5rem" }}>

          {/* Left */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{
              fontSize: "0.6875rem", color: "#2a3540", fontWeight: 600,
              letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1.5rem",
            }}>
              Fintech
            </div>

            <h3 style={{
              fontSize: "2rem", fontWeight: 700, color: "#e6eaf0",
              margin: 0, marginBottom: "0.5rem",
              letterSpacing: "-0.035em", lineHeight: 1.12,
            }}>
              MeraPolicyAdvisor
            </h3>

            {/* Tagline */}
            <p style={{
              fontSize: "1rem", color: "#8b98a5", fontWeight: 500,
              margin: 0, marginBottom: "0.625rem",
              letterSpacing: "-0.015em", lineHeight: 1.4,
            }}>
              Deterministic tools for better money decisions.
            </p>

            {/* Hook */}
            <p style={{
              fontSize: "0.875rem", color: "#3d4d5c", fontWeight: 400,
              margin: 0, marginBottom: "1.75rem", lineHeight: 1.65, maxWidth: 360,
            }}>
              Most portfolio tools show data. This tells you what to fix — and why.
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

            <CardCTA label="Analyze your portfolio" color="#6a9fd8" hoverColor="#e6eaf0" />
          </div>

          {/* Right — data viz */}
          <div className="sb-card-right" style={{
            display: "flex", flexDirection: "column",
            gap: "2rem", padding: "2rem 0", justifyContent: "center",
          }}>
            <div>
              <div style={{
                fontSize: "0.6875rem", color: "#2a3540", fontWeight: 500,
                letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.5rem",
              }}>
                Portfolio Value
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
                <span style={{
                  fontSize: "2rem", fontWeight: 700, color: "#c4ccd4",
                  letterSpacing: "-0.04em", lineHeight: 1,
                }}>
                  ₹12,40,500
                </span>
                <span style={{ fontSize: "0.8125rem", color: "#22c55e", fontWeight: 500 }}>
                  +18.4%
                </span>
              </div>
            </div>

            <div>
              <div style={{
                fontSize: "0.6875rem", color: "#2a3540", fontWeight: 500,
                letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "1.25rem",
              }}>
                Allocation
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {allocations.map((a, i) => (
                  <AllocationBar key={a.label} label={a.label} pct={a.pct} color={a.color} index={i} inView={inView} />
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: DUR.enter, ease: EASE_OUT, delay: noMotion ? 0 : 0.7 }}
            >
              <div style={{
                fontSize: "0.6875rem", color: "#2a3540", fontWeight: 500,
                letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.5rem",
              }}>
                Rebalance Suggestion
              </div>
              <p style={{ fontSize: "0.8125rem", color: "#2e3c48", lineHeight: 1.6, margin: 0 }}>
                Increase debt allocation by 4% to match target risk profile. Reduce mid-cap equity exposure.
              </p>
            </motion.div>
          </div>
        </div>
      </TiltCard>
    </motion.div>
  );
}
