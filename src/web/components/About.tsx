import { motion } from "framer-motion";
import { useInView } from "./useInView";
import { DUR, EASE_OUT, Y_SMALL, prefersReducedMotion } from "./motion";

export function About() {
  const { ref, inView } = useInView({ threshold: 0.2 });
  const noMotion = prefersReducedMotion();

  return (
    <section id="about" className="sb-section" style={{ padding: "0 2.5rem", marginTop: 160 }}>
      <div ref={ref as React.RefObject<HTMLDivElement>} style={{ maxWidth: 1200, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: noMotion ? 0 : Y_SMALL }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: DUR.enter, ease: EASE_OUT }}
          style={{ maxWidth: 680 }}
        >
          <p style={{
            fontSize: "clamp(1.625rem, 2.75vw, 2.125rem)",
            fontWeight: 600, color: "#4a5562",
            lineHeight: 1.45, letterSpacing: "-0.03em",
            margin: 0, marginBottom: "1.75rem",
          }}>
            I build products across fintech and developer tooling, focused on systems, clarity, and speed.
          </p>
          <p style={{ fontSize: "0.9375rem", color: "#2e3c48", lineHeight: 1.75, margin: 0 }}>
            SidBuilds is where everything I'm building now — and next — lives.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
