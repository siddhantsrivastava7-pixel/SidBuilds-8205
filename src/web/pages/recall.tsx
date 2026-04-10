import { motion, useAnimationFrame } from "framer-motion";
import { useRef, useState } from "react";
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

// ─── Download Split Button ────────────────────────────────────────────────────
const DOWNLOADS = {
  windows: { label: "Windows", url: "https://github.com/siddhantsrivastava7-pixel/recall/releases/download/v0.1.3/Recall_0.1.3_x64_en-US.msi" },
  mac:     { label: "macOS (beta)", url: "https://github.com/siddhantsrivastava7-pixel/recall/releases/download/v0.1.3/Recall.app.tar.gz" },
} as const;

function DownloadButton({ size = "md" }: { size?: "md" | "lg" }) {
  const [open, setOpen] = useState(false);
  const reduced = prefersReducedMotion();
  const pad  = size === "lg" ? "0.8125rem 1.75rem" : "0.6875rem 1.375rem";
  const font = size === "lg" ? "0.9375rem"         : "0.875rem";
  const chevPad = size === "lg" ? "0.8125rem 1rem" : "0.6875rem 0.875rem";

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <div style={{ display: "flex", borderRadius: 9, overflow: "visible", boxShadow: "0 2px 12px rgba(59,130,246,0.18)" }}>
        {/* Main label — not a link, just opens dropdown */}
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            padding: pad, background: "#3b82f6", color: "#fff",
            border: "none", borderRight: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "9px 0 0 9px",
            fontSize: font, fontWeight: 700, cursor: "pointer",
            letterSpacing: "-0.01em", transition: "background 0.15s ease",
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#2563eb")}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "#3b82f6")}
        >
          Download Recall
        </button>
        {/* Chevron */}
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            padding: chevPad, background: "#3b82f6", color: "#fff",
            border: "none", borderRadius: "0 9px 9px 0",
            fontSize: "0.75rem", cursor: "pointer",
            transition: "background 0.15s ease",
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#2563eb")}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "#3b82f6")}
        >
          {open ? "▲" : "▼"}
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <motion.div
          initial={reduced ? {} : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.12 }}
          style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0,
            background: "rgba(10,14,20,0.98)",
            border: "1px solid rgba(59,130,246,0.18)",
            borderRadius: 9, overflow: "hidden",
            minWidth: 200, zIndex: 50,
            boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
          }}
        >
          {Object.values(DOWNLOADS).map(({ label, url }) => (
            <a
              key={label}
              href={url}
              onClick={() => setOpen(false)}
              style={{
                display: "flex", alignItems: "center", gap: "0.625rem",
                padding: "0.75rem 1.125rem",
                color: "#8b98a5", fontSize: "0.875rem", fontWeight: 500,
                textDecoration: "none", transition: "background 0.12s ease, color 0.12s ease",
                borderBottom: label === "Windows" ? "1px solid rgba(255,255,255,0.04)" : "none",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.08)"; (e.currentTarget as HTMLElement).style.color = "#e6eaf0"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#8b98a5"; }}
            >
              <span style={{ fontSize: "1rem" }}>{label === "Windows" ? "🪟" : "🍎"}</span>
              {label}
            </a>
          ))}
        </motion.div>
      )}
    </div>
  );
}

// ─── Trial Key Modal ──────────────────────────────────────────────────────────
function TrialKeyModal({ onClose }: { onClose: () => void }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [key, setKey] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setState("loading");
    try {
      const res = await fetch("/api/generate-trial", { method: "POST" });
      if (res.status === 429) { setState("error"); return; }
      const data = await res.json<{ key?: string }>();
      if (data.key) { setKey(data.key); setState("done"); }
      else setState("error");
    } catch { setState("error"); }
  };

  const copy = () => {
    navigator.clipboard?.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(4,6,9,0.85)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1rem",
    }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          background: "rgba(10,14,20,0.98)",
          border: "1px solid rgba(59,130,246,0.15)",
          borderRadius: 16, padding: "2rem 2.25rem",
          width: "100%", maxWidth: 420,
          boxShadow: "0 32px 64px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
          <div>
            <div style={{ fontSize: "0.625rem", fontWeight: 600, color: "#3b82f6", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.375rem" }}>
              Recall · 7-Day Trial
            </div>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#e6eaf0", letterSpacing: "-0.03em", margin: 0 }}>
              Get your trial key
            </h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#3d4d5c", cursor: "pointer", fontSize: "1.25rem", lineHeight: 1, padding: 0 }}>×</button>
        </div>

        {state === "idle" && (
          <>
            <p style={{ fontSize: "0.875rem", color: "#4a5562", lineHeight: 1.65, margin: 0, marginBottom: "1.5rem" }}>
              Get a free 7-day trial key. No account required.
            </p>
            <button onClick={generate} style={{
              width: "100%", padding: "0.8125rem",
              background: "#3b82f6", color: "#fff",
              border: "none", borderRadius: 9,
              fontSize: "0.9rem", fontWeight: 700, cursor: "pointer",
              letterSpacing: "-0.01em",
            }}>
              Generate Trial Key →
            </button>
          </>
        )}

        {state === "loading" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.625rem", padding: "1.5rem 0", color: "#4a5562", fontSize: "0.875rem" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#3b82f6", display: "inline-block", animation: "sb-pulse 1.2s ease-in-out infinite" }} />
            Generating…
          </div>
        )}

        {state === "done" && (
          <>
            <p style={{ fontSize: "0.8125rem", color: "#4a5562", margin: 0, marginBottom: "0.875rem" }}>
              Your trial key — valid for 7 days:
            </p>
            <div style={{
              display: "flex", alignItems: "center", gap: "0.625rem",
              padding: "0.875rem 1rem",
              background: "rgba(59,130,246,0.06)",
              border: "1px solid rgba(59,130,246,0.18)",
              borderRadius: 9, marginBottom: "1rem",
            }}>
              <code style={{ flex: 1, fontSize: "1rem", fontWeight: 700, color: "#7baef8", letterSpacing: "0.04em", fontFamily: "monospace" }}>
                {key}
              </code>
              <button onClick={copy} style={{
                padding: "0.3rem 0.75rem",
                background: copied ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${copied ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 6, color: copied ? "#22c55e" : "#6a7a88",
                fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
                transition: "all 0.15s ease", flexShrink: 0,
              }}>
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>
            <p style={{ fontSize: "0.75rem", color: "#2a3540", margin: 0 }}>
              Save this key — you'll need it to activate Recall.
            </p>
          </>
        )}

        {state === "error" && (
          <>
            <p style={{ fontSize: "0.875rem", color: "#ef4444", margin: 0, marginBottom: "1rem" }}>
              Too many requests or something went wrong. Try again later.
            </p>
            <button onClick={() => setState("idle")} style={{
              background: "none", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 7, padding: "0.5rem 1rem",
              color: "#4a5562", fontSize: "0.8125rem", cursor: "pointer",
            }}>
              Try again
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
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
function MiniNav({ onTrialClick }: { onTrialClick: () => void }) {
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
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={onTrialClick} style={{
            padding: "0.375rem 0.875rem",
            background: "transparent",
            border: "1px solid rgba(59,130,246,0.18)",
            borderRadius: 7, color: "#7baef8",
            fontSize: "0.8125rem", fontWeight: 500,
            cursor: "pointer", transition: "background 0.2s ease",
          }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.1)")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}
          >
            Get Trial Key
          </button>
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
            ↓ Download
          </a>
        </div>
      </div>
    </nav>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
function Hero({ onTrialClick }: { onTrialClick: () => void }) {
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
          <DownloadButton size="md" />

          <motion.button
            onClick={onTrialClick}
            whileHover={reduced ? {} : { y: HOVER_LIFT }}
            whileTap={reduced ? {} : { y: 0, scale: 0.985 }}
            transition={{ duration: DUR.fast, ease: "easeOut" }}
            style={{
              display: "inline-flex", alignItems: "center",
              padding: "0.6875rem 1.375rem",
              background: "transparent", color: "#7baef8",
              border: "1px solid rgba(59,130,246,0.22)",
              borderRadius: 9, fontSize: "0.875rem", fontWeight: 500,
              cursor: "pointer", letterSpacing: "-0.01em",
            }}
          >
            Get Trial Key
          </motion.button>

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
function FinalCTA({ onTrialClick }: { onTrialClick: () => void }) {
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
            <DownloadButton size="lg" />

            <motion.button
              onClick={onTrialClick}
              whileHover={reduced ? {} : { y: HOVER_LIFT }}
              whileTap={reduced ? {} : { y: 0, scale: 0.985 }}
              transition={{ duration: DUR.fast, ease: "easeOut" }}
              style={{
                display: "inline-flex", alignItems: "center",
                padding: "0.8125rem 1.75rem",
                background: "transparent", color: "#7baef8",
                border: "1px solid rgba(59,130,246,0.22)",
                borderRadius: 10, fontSize: "0.9375rem", fontWeight: 600,
                cursor: "pointer", letterSpacing: "-0.01em",
              }}
            >
              Get Trial Key
            </motion.button>

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
  const [showTrial, setShowTrial] = useState(false);
  return (
    <div style={{ background: "#05070a", minHeight: "100vh", position: "relative" }}>
      <div style={{
        position: "fixed", inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        pointerEvents: "none", zIndex: 1, opacity: 0.25,
      }} />
      <div style={{ position: "relative", zIndex: 2 }}>
        <MiniNav onTrialClick={() => setShowTrial(true)} />
        <Hero onTrialClick={() => setShowTrial(true)} />
        <Pain />
        <Shift />
        <Features />
        <FinalCTA onTrialClick={() => setShowTrial(true)} />
      </div>
      {showTrial && <TrialKeyModal onClose={() => setShowTrial(false)} />}
    </div>
  );
}
