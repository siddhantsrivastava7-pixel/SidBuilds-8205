import { motion, useAnimationFrame } from "framer-motion";
import { useRef } from "react";
import {
  DUR, EASE_OUT, HOVER_LIFT, Y_ENTER, Y_SMALL,
  prefersReducedMotion,
} from "./motion";

const headlineLines = [
  { text: "I build systems.",       dim: false             },
  { text: "Some remove guesswork.", dim: true              },
  { text: "Some make money.",       dim: false, glow: true },
];

const stats = ["$2M raised", "80K users", "$500M peak", "2 live products"];

// ─── Ambient glow — no pulse, pure drift ─────────────────────────────────────
function AmbientGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useAnimationFrame((t) => {
    if (!ref.current || prefersReducedMotion()) return;
    const s = t / 1000;
    // Very slow drift — nearly imperceptible, 15–18s effective cycle
    const x = -12 + Math.sin(s / 9)  * 4.5;
    const y = -18 + Math.cos(s / 11) * 3.5;
    // No opacity animation — constant presence, not pulsing
    ref.current.style.transform = `translate(${x}vw, ${y}vh)`;
  });

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "72vw",
        height: "72vh",
        background:
          "radial-gradient(ellipse at 30% 40%, rgba(59,130,246,0.06) 0%, rgba(59,130,246,0.015) 45%, transparent 65%)",
        pointerEvents: "none",
        willChange: "transform",
        opacity: 1, // constant — no pulse
      }}
    />
  );
}

export function Hero() {
  const reduced = prefersReducedMotion();

  // When reduced-motion: no y travel, instant opacity
  const makeReveal = (delay: number, y = Y_SMALL) => ({
    initial: { opacity: 0, y: reduced ? 0 : y },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: reduced ? 0.01 : DUR.slow,
      ease: EASE_OUT,
      delay: reduced ? 0 : delay,
    },
  });

  return (
    <section
      id="hero"
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        padding: "0 2.5rem",
        overflow: "hidden",
      }}
    >
      <AmbientGlow />

      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        width: "100%",
        paddingTop: 140,
        paddingBottom: 100,
        position: "relative",
      }}>

        {/* Badge */}
        <motion.div {...makeReveal(0.05)} style={{ marginBottom: "3rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#22c55e", display: "inline-block", flexShrink: 0,
              boxShadow: "0 0 5px rgba(34,197,94,0.4)",
            }} />
            <span style={{ fontSize: "0.8125rem", color: "#4a6a50", fontWeight: 500 }}>
              Actively building — 2021
            </span>
          </div>
        </motion.div>

        {/* Headline — each line independent */}
        <h1 style={{
          fontSize: "clamp(3.2rem, 6.5vw, 5.5rem)",
          fontWeight: 800,
          lineHeight: 1.04,
          letterSpacing: "-0.045em",
          margin: 0,
          marginBottom: "1.75rem",
          maxWidth: 760,
        }}>
          {headlineLines.map((line, i) => (
            <motion.span
              key={line.text}
              initial={{ opacity: 0, y: reduced ? 0 : Y_ENTER }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: reduced ? 0.01 : DUR.slow,
                ease: EASE_OUT,
                delay: reduced ? 0 : 0.12 + i * 0.10,
              }}
              style={{
                display: "block",
                color: line.dim ? "#2e3640" : "#e6eaf0",
                ...(line.glow ? {
                  // Faint luminous emphasis — not animated, not neon
                  // Slightly brighter than surrounding text, soft diffuse glow behind
                  filter: "brightness(1.06)",
                  textShadow: "0 0 56px rgba(230,234,240,0.08)",
                } : {}),
              }}
            >
              {line.text}
            </motion.span>
          ))}
        </h1>

        {/* Subtext */}
        <motion.p {...makeReveal(0.42)} style={{
          fontSize: "1.0625rem",
          color: "#4a5562",
          lineHeight: 1.75,
          maxWidth: 440,
          margin: 0,
          marginBottom: "3rem",
          fontWeight: 400,
        }}>
          I'm Sid. I build products in fintech and developer tooling — and share
          what I learn along the way.
        </motion.p>

        {/* CTA row */}
        <motion.div {...makeReveal(0.52)} style={{
          display: "flex",
          gap: "0.875rem",
          alignItems: "center",
          marginBottom: "5rem",
          flexWrap: "wrap",
        }}>
          {/* Primary — lift + shadow bloom */}
          <motion.a
            href="#products"
            whileHover={reduced ? {} : {
              y: HOVER_LIFT,
              boxShadow: "0 4px 14px rgba(59,130,246,0.16), 0 1px 4px rgba(59,130,246,0.08)",
            }}
            whileTap={reduced ? {} : { y: 0, scale: 0.985 }}
            transition={{ duration: DUR.fast, ease: "easeOut" }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "0.6875rem 1.375rem",
              background: "#3b82f6",
              color: "#fff",
              borderRadius: 9,
              fontSize: "0.875rem",
              fontWeight: 600,
              textDecoration: "none",
              letterSpacing: "-0.01em",
              boxShadow: "0 1px 3px rgba(59,130,246,0.1)",
            }}
          >
            View Products
          </motion.a>

          {/* Ghost — arrow nudges right 2px, color shifts */}
          <motion.a
            href="#builds"
            whileHover={reduced ? {} : { x: 2, color: "#8b98a5" }}
            whileTap={reduced ? {} : { x: 0 }}
            transition={{ duration: DUR.fast, ease: "easeOut" }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "0.6875rem 1.375rem",
              color: "#4a5562",
              fontSize: "0.875rem",
              fontWeight: 500,
              textDecoration: "none",
              letterSpacing: "-0.01em",
            }}
          >
            Follow Builds →
          </motion.a>
        </motion.div>

        {/* Stats */}
        <motion.div {...makeReveal(0.62)} style={{
          display: "flex",
          gap: "2.5rem",
          alignItems: "center",
          flexWrap: "wrap",
        }}>
          {stats.map((stat) => (
            <span key={stat} style={{
              fontSize: "0.8125rem",
              color: "#2e3640",
              fontWeight: 500,
              letterSpacing: "-0.01em",
            }}>
              {stat}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
