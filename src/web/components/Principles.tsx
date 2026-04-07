import { motion } from "framer-motion";
import { useInView } from "./useInView";
import { DUR, EASE_OUT, Y_SMALL, prefersReducedMotion } from "./motion";

const principles = [
  {
    num: "01",
    title: "Systems scale. Intuition doesn't.",
    body: "Great products don't rely on gut feel at runtime. They encode decisions into logic — reproducible, auditable, improvable over time.",
  },
  {
    num: "02",
    title: "In fintech, trust is the product.",
    body: "Black-box recommendations destroy trust. Deterministic, explainable logic builds it. Users don't need magic — they need to understand why.",
  },
  {
    num: "03",
    title: "Speed compounds. Perfection doesn't.",
    body: "Shipping a good thing quickly beats shipping a perfect thing late. Momentum creates feedback. Feedback creates better products.",
  },
];

// Row-internal timing
const T_NUM   = 0.05;
const T_TITLE = 0.12;
const T_BODY  = 0.20;

// Inter-row stagger
const ROW_STAGGER = 0.08;

export function Principles() {
  const { ref, inView } = useInView({ threshold: 0.1 });
  const noMotion = prefersReducedMotion();

  return (
    <section id="thinking" style={{ padding: "0 2.5rem", marginTop: 220 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <motion.div
          ref={ref as React.RefObject<HTMLDivElement>}
          initial={{ opacity: 0, y: noMotion ? 0 : Y_SMALL }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: DUR.enter, ease: EASE_OUT }}
          style={{ marginBottom: "5rem" }}
        >
          <div style={{
            fontSize: "0.6875rem", color: "#1e2a32", fontWeight: 600,
            letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1.25rem",
          }}>
            Why this approach works
          </div>
          <h2 style={{
            fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
            fontWeight: 700, color: "#e6eaf0",
            letterSpacing: "-0.035em", margin: 0,
            lineHeight: 1.15, maxWidth: 480,
          }}>
            Three principles behind every product.
          </h2>
        </motion.div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {principles.map((p, i) => (
            <PrincipleRow key={p.num} principle={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PrincipleRow({ principle, index }: { principle: (typeof principles)[0]; index: number }) {
  const { ref, inView } = useInView({ threshold: 0.25 });
  const noMotion = prefersReducedMotion();
  const base = index * ROW_STAGGER;

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: DUR.enter, ease: EASE_OUT, delay: base }}
      style={{
        display: "grid",
        gridTemplateColumns: "72px 1fr",
        gap: "3rem",
        padding: "3rem 0",
        alignItems: "flex-start",
        position: "relative",
        cursor: "default",
      }}
    >
      {/* Divider — simple opacity fade, no theatrical scaleX */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: 1,
        background: "rgba(255,255,255,0.04)",
      }} />

      {/* Number */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: DUR.base, ease: EASE_OUT, delay: base + T_NUM }}
        style={{
          fontSize: "0.75rem", fontWeight: 600, color: "#1a2530",
          letterSpacing: "0.06em", paddingTop: 5,
          fontVariantNumeric: "tabular-nums", userSelect: "none",
        }}
      >
        {principle.num}
      </motion.div>

      {/* Content */}
      <div>
        <motion.h3
          initial={{ opacity: 0, y: noMotion ? 0 : Y_SMALL }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: DUR.enter, ease: EASE_OUT, delay: base + T_TITLE }}
          style={{
            fontSize: "1.1875rem", fontWeight: 600,
            letterSpacing: "-0.02em", margin: 0, marginBottom: "1rem",
            lineHeight: 1.35, color: "#8b98a5",
            transition: "color 0.25s ease",
          }}
          onMouseEnter={e => { if (!noMotion) (e.currentTarget as HTMLElement).style.color = "#b8c2cc"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#8b98a5"; }}
        >
          {principle.title}
        </motion.h3>

        <motion.p
          initial={{ opacity: 0, y: noMotion ? 0 : Y_SMALL }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: DUR.enter, ease: EASE_OUT, delay: base + T_BODY }}
          style={{
            fontSize: "0.9375rem", lineHeight: 1.75, margin: 0, maxWidth: 520,
            color: "#2e3c48",
            transition: "color 0.25s ease",
          }}
          onMouseEnter={e => { if (!noMotion) (e.currentTarget as HTMLElement).style.color = "#3d5262"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#2e3c48"; }}
        >
          {principle.body}
        </motion.p>
      </div>
    </motion.div>
  );
}
