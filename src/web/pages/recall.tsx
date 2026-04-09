import { motion, useAnimationFrame } from "framer-motion";
import { useRef } from "react";
import { useInView } from "../components/useInView";
import {
  DUR, EASE_OUT, HOVER_LIFT, Y_ENTER, Y_SMALL,
  prefersReducedMotion,
} from "../components/motion";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Section({ id, children, style }: {
  id?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <section id={id} className="sb-section" style={{ padding: "0 2.5rem", ...style }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>{children}</div>
    </section>
  );
}

function Reveal({ children, delay = 0, y = Y_SMALL }: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
}) {
  const { ref, inView } = useInView({ threshold: 0.1 });
  const noMotion = prefersReducedMotion();
  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      initial={{ opacity: 0, y: noMotion ? 0 : y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: DUR.enter, ease: EASE_OUT, delay: noMotion ? 0 : delay }}
    >
      {children}
    </motion.div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "rgba(255,255,255,0.04)" }} />;
}

// ─── Ambient glow ─────────────────────────────────────────────────────────────
function AmbientGlow() {
  const ref = useRef<HTMLDivElement>(null);
  useAnimationFrame((t) => {
    if (!ref.current || prefersReducedMotion()) return;
    const s = t / 1000;
    ref.current.style.transform = `translate(${-12 + Math.sin(s / 9) * 4.5}vw, ${-18 + Math.cos(s / 11) * 3.5}vh)`;
  });
  return (
    <div ref={ref} style={{
      position: "absolute", top: 0, left: 0,
      width: "72vw", height: "72vh",
      background: "radial-gradient(ellipse at 30% 40%, rgba(59,130,246,0.06) 0%, rgba(59,130,246,0.01) 45%, transparent 65%)",
      pointerEvents: "none", willChange: "transform",
    }} />
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function MiniNav() {
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
      height: 60, display: "flex", alignItems: "center", padding: "0 2.5rem",
      background: "rgba(4,6,9,0.82)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: "0.9rem", fontWeight: 600, letterSpacing: "-0.03em" }}>
            <span style={{ color: "#3b82f6" }}>Recall</span>
            <span style={{ color: "rgba(255,255,255,0.25)" }}> by </span>
            <span style={{ color: "rgba(255,255,255,0.4)" }}>SidBuilds</span>
          </span>
        </a>
        <a href="#cta" style={{
          padding: "0.375rem 0.875rem",
          background: "rgba(59,130,246,0.1)",
          border: "1px solid rgba(59,130,246,0.18)",
          borderRadius: 7, color: "#7baef8",
          fontSize: "0.8125rem", fontWeight: 500,
          textDecoration: "none", transition: "background 0.2s ease",
        }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.18)")}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.1)")}
        >
          Download
        </a>
      </div>
    </nav>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
function Hero() {
  const reduced = prefersReducedMotion();
  const r = (delay: number) => ({
    initial: { opacity: 0, y: reduced ? 0 : Y_ENTER },
    animate: { opacity: 1, y: 0 },
    transition: { duration: DUR.slow, ease: EASE_OUT, delay: reduced ? 0 : delay },
  });

  return (
    <section className="sb-section" style={{
      position: "relative", minHeight: "100vh",
      display: "flex", alignItems: "center",
      padding: "0 2.5rem", overflow: "hidden",
    }}>
      <AmbientGlow />
      <div className="sb-hero-inner" style={{
        maxWidth: 1100, margin: "0 auto", width: "100%",
        paddingTop: 160, paddingBottom: 120, position: "relative",
      }}>

        <h1 style={{
          fontSize: "clamp(3.2rem, 6.5vw, 5.5rem)",
          fontWeight: 800, lineHeight: 1.04,
          letterSpacing: "-0.045em",
          margin: 0, marginBottom: "2rem", maxWidth: 780,
        }}>
          <motion.span {...r(0.1)} style={{ display: "block", color: "#e6eaf0" }}>
            You save things.
          </motion.span>
          <motion.span {...r(0.2)} style={{ display: "block", color: "#2e3640" }}>
            You never find them again.
          </motion.span>
        </h1>

        <motion.p {...r(0.32)} style={{
          fontSize: "1.0625rem", color: "#4a5562",
          lineHeight: 1.75, maxWidth: 440,
          margin: 0, marginBottom: "3rem", fontWeight: 400,
        }}>
          Recall turns your scattered bookmarks, notes, and links into a searchable memory layer.
        </motion.p>

        <motion.div {...r(0.42)} style={{ display: "flex", gap: "0.875rem", alignItems: "center", flexWrap: "wrap" }}>
          <motion.a
            href="#cta"
            whileHover={reduced ? {} : { y: HOVER_LIFT, boxShadow: "0 4px 14px rgba(59,130,246,0.22)" }}
            whileTap={reduced ? {} : { y: 0, scale: 0.985 }}
            transition={{ duration: DUR.fast, ease: "easeOut" }}
            style={{
              display: "inline-flex", alignItems: "center",
              padding: "0.6875rem 1.375rem",
              background: "#3b82f6", color: "#fff",
              borderRadius: 9, fontSize: "0.875rem", fontWeight: 600,
              textDecoration: "none", letterSpacing: "-0.01em",
            }}
          >
            Download Recall
          </motion.a>

          <motion.a
            href="#shift"
            whileHover={reduced ? {} : { x: 2 }}
            transition={{ duration: DUR.fast, ease: "easeOut" }}
            style={{
              color: "#3d4d5c", fontSize: "0.875rem", fontWeight: 500,
              textDecoration: "none", letterSpacing: "-0.01em",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#6a7a88")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "#3d4d5c")}
          >
            See how it works →
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}

// ─── PAIN ─────────────────────────────────────────────────────────────────────
function Pain() {
  return (
    <Section style={{ paddingBottom: "10rem" }}>
      <Divider />
      <div style={{ paddingTop: "10rem", maxWidth: 480 }}>
        <Reveal>
          <p style={{
            fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700,
            color: "#e6eaf0", letterSpacing: "-0.04em",
            lineHeight: 1.25, margin: 0, marginBottom: "1.5rem",
          }}>
            You've already saved everything.
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <p style={{
            fontSize: "clamp(1.1rem, 2vw, 1.5rem)", fontWeight: 600,
            color: "#2e3640", letterSpacing: "-0.03em",
            lineHeight: 1.9, margin: 0, marginBottom: "1.75rem",
          }}>
            Bookmarks. Links. Notes. Videos.
          </p>
        </Reveal>

        <Reveal delay={0.18}>
          <p style={{
            fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700,
            color: "#e6eaf0", letterSpacing: "-0.04em",
            lineHeight: 1.25, margin: 0, marginBottom: "0.35rem",
          }}>
            But when you need it?
          </p>
        </Reveal>
        <Reveal delay={0.24}>
          <p style={{
            fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700,
            color: "#2e3640", letterSpacing: "-0.04em",
            lineHeight: 1.25, margin: 0,
          }}>
            You can't find it.
          </p>
        </Reveal>
      </div>
    </Section>
  );
}

// ─── SHIFT + PHILOSOPHY (merged) ──────────────────────────────────────────────
function Shift() {
  return (
    <Section id="shift" style={{ paddingBottom: "10rem" }}>
      <Divider />
      <div style={{ paddingTop: "10rem" }}>
        <Reveal>
          <h2 style={{
            fontSize: "clamp(2rem, 4.5vw, 3.75rem)", fontWeight: 800,
            letterSpacing: "-0.045em", lineHeight: 1.08,
            margin: 0, color: "#e6eaf0", maxWidth: 620,
          }}>
            Recall doesn't store things.
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 style={{
            fontSize: "clamp(2rem, 4.5vw, 3.75rem)", fontWeight: 800,
            letterSpacing: "-0.045em", lineHeight: 1.08,
            margin: 0, marginBottom: "5rem", color: "#3b82f6", maxWidth: 620,
          }}>
            It makes them retrievable.
          </h2>
        </Reveal>

        <Reveal delay={0.18}>
          <div style={{ maxWidth: 520 }}>
            {[
              "No folders to manage.",
              "No tags to maintain.",
              "No system to remember.",
            ].map((line) => (
              <p key={line} style={{
                fontSize: "clamp(1.1rem, 2vw, 1.5rem)", fontWeight: 600,
                color: "#2e3640", letterSpacing: "-0.03em",
                lineHeight: 1.7, margin: 0,
              }}>
                {line}
              </p>
            ))}
            <div style={{ height: "1.5rem" }} />
            <p style={{
              fontSize: "clamp(1.1rem, 2vw, 1.5rem)", fontWeight: 700,
              color: "#e6eaf0", letterSpacing: "-0.03em",
              lineHeight: 1.7, margin: 0,
            }}>
              Just save. <span style={{ color: "#3b82f6" }}>Then search.</span>
            </p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

// ─── FEATURES ─────────────────────────────────────────────────────────────────
function Features() {
  const features = [
    {
      title: "Your bookmarks, but usable",
      body: "Imports your bookmarks and makes them searchable.",
    },
    {
      title: "Search that actually works",
      body: "Search by what you remember — not where you saved it.",
    },
    {
      title: "Instant capture",
      body: "One shortcut. Save anything from anywhere.",
    },
  ];

  return (
    <Section style={{ paddingBottom: "10rem" }}>
      <Divider />
      <div style={{ paddingTop: "10rem" }}>
        {features.map((f, i) => (
          <Reveal key={f.title} delay={i * 0.07}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "240px 1fr",
              gap: "3rem",
              padding: "2.25rem 0",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              alignItems: "start",
            }}
              className="sb-principle-row"
            >
              <div style={{
                fontSize: "0.9375rem", fontWeight: 600,
                color: "#4a5a68", letterSpacing: "-0.02em", paddingTop: 2,
              }}>
                {f.title}
              </div>
              <p style={{
                fontSize: "0.9375rem", color: "#2e3c48",
                lineHeight: 1.65, margin: 0,
              }}>
                {f.body}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

// ─── FINAL CTA ────────────────────────────────────────────────────────────────
function FinalCTA() {
  const reduced = prefersReducedMotion();

  return (
    <Section id="cta" style={{ paddingBottom: "12rem" }}>
      <Divider />
      <div style={{ paddingTop: "10rem" }}>
        <Reveal>
          <h2 style={{
            fontSize: "clamp(2.25rem, 5vw, 4.25rem)", fontWeight: 800,
            color: "#e6eaf0", letterSpacing: "-0.045em",
            margin: 0, lineHeight: 1.06, maxWidth: 640, marginBottom: "0.3rem",
          }}>
            Stop saving things you'll never find.
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 style={{
            fontSize: "clamp(2.25rem, 5vw, 4.25rem)", fontWeight: 800,
            color: "#2e3640", letterSpacing: "-0.045em",
            margin: 0, lineHeight: 1.06, maxWidth: 640, marginBottom: "3.5rem",
          }}>
            Start recalling them.
          </h2>
        </Reveal>

        <Reveal delay={0.16}>
          <div style={{ display: "flex", gap: "1.25rem", alignItems: "center", flexWrap: "wrap" }}>
            <motion.a
              href="#"
              whileHover={reduced ? {} : { y: HOVER_LIFT, boxShadow: "0 6px 24px rgba(59,130,246,0.28)" }}
              whileTap={reduced ? {} : { y: 0, scale: 0.985 }}
              transition={{ duration: DUR.fast, ease: "easeOut" }}
              style={{
                display: "inline-flex", alignItems: "center",
                padding: "0.8125rem 1.75rem",
                background: "#3b82f6", color: "#fff",
                borderRadius: 10, fontSize: "0.9375rem", fontWeight: 700,
                textDecoration: "none", letterSpacing: "-0.01em",
                boxShadow: "0 2px 12px rgba(59,130,246,0.18)",
              }}
            >
              Download Recall
            </motion.a>

            <a href="/" style={{
              fontSize: "0.875rem", color: "#2a3540",
              textDecoration: "none", transition: "color 0.2s ease",
            }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#6a7a88")}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "#2a3540")}
            >
              ← Back to SidBuilds
            </a>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Recall() {
  return (
    <div style={{ background: "#05070a", minHeight: "100vh", position: "relative" }}>
      <div style={{
        position: "fixed", inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        pointerEvents: "none", zIndex: 1, opacity: 0.25,
      }} />
      <div style={{ position: "relative", zIndex: 2 }}>
        <MiniNav />
        <Hero />
        <Pain />
        <Shift />
        <Features />
        <FinalCTA />
      </div>
    </div>
  );
}
