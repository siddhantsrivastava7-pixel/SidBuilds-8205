import { motion } from "framer-motion";
import { useInView } from "../components/useInView";
import { DUR, EASE_OUT, Y_ENTER, Y_SMALL, prefersReducedMotion } from "../components/motion";
import { DeAiTool } from "../components/offscript/DeAiTool";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, y = Y_SMALL }: { children: React.ReactNode; delay?: number; y?: number }) {
  const { ref, inView } = useInView({ threshold: 0.1 });
  const nm = prefersReducedMotion();
  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      initial={{ opacity: 0, y: nm ? 0 : y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: DUR.enter, ease: EASE_OUT, delay: nm ? 0 : delay }}
    >
      {children}
    </motion.div>
  );
}

function Section({ id, children, style }: { id?: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <section id={id} className="sb-section" style={{ padding: "0 2.5rem", ...style }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>{children}</div>
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#c9923c", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1.25rem" }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "rgba(255,255,255,0.04)" }} />;
}

// ─── Nav ─────────────────────────────────────────────────────────────────────
function MiniNav() {
  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, height: 60, display: "flex", alignItems: "center", padding: "0 2.5rem" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: "0.9rem", fontWeight: 600, letterSpacing: "-0.03em" }}>
            <span style={{ color: "#ffffff" }}>Sid</span>
            <span style={{ color: "rgba(255,255,255,0.45)" }}>Builds</span>
          </span>
        </a>
        <a href="#tool" style={{
          display: "inline-flex", alignItems: "center", padding: "0.375rem 0.875rem",
          background: "rgba(201,146,60,0.1)", border: "1px solid rgba(201,146,60,0.2)",
          borderRadius: 7, color: "#c9923c", fontSize: "0.8125rem", fontWeight: 500,
          textDecoration: "none", transition: "background 0.2s ease",
        }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(201,146,60,0.18)")}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "rgba(201,146,60,0.1)")}
        >
          Try it now
        </a>
      </div>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  const nm = prefersReducedMotion();
  const r = (delay: number) => ({
    initial: { opacity: 0, y: nm ? 0 : Y_ENTER },
    animate: { opacity: 1, y: 0 },
    transition: { duration: DUR.slow, ease: EASE_OUT, delay: nm ? 0 : delay },
  });

  return (
    <section className="sb-section" style={{ padding: "0 2.5rem", paddingTop: "7rem", paddingBottom: "3rem", position: "relative", overflow: "hidden" }}>
      {/* Ambient */}
      <div style={{ position: "absolute", top: "-5%", right: "10%", width: "50vw", height: "50vh", background: "radial-gradient(ellipse, rgba(201,146,60,0.04) 0%, transparent 65%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Badge */}
        <motion.div {...r(0.04)} style={{ marginBottom: "2rem" }}>
          <span style={{
            fontSize: "0.75rem", fontWeight: 500, color: "#5a4020",
            padding: "0.3rem 0.75rem",
            background: "rgba(201,146,60,0.07)", border: "1px solid rgba(201,146,60,0.15)",
            borderRadius: 100, letterSpacing: "0.01em",
          }}>
            Not a humanizer. A pattern breaker.
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1 {...r(0.1)} style={{ fontSize: "clamp(2.5rem, 5.5vw, 4.75rem)", fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1.06, margin: 0, marginBottom: "1.25rem", maxWidth: 780 }}>
          <span style={{ color: "#e6eaf0" }}>Your writing isn't bad.</span>
          <br />
          <span style={{ color: "#c9923c" }}>It just sounds like AI.</span>
        </motion.h1>

        {/* Subtext */}
        <motion.p {...r(0.18)} style={{ fontSize: "1.0625rem", color: "#4a5562", lineHeight: 1.7, maxWidth: 440, margin: 0, marginBottom: "0.5rem" }}>
          OffScript removes the patterns people subconsciously ignore — generic openers, essay transitions, teaching tone, perfect symmetry.
        </motion.p>
        <motion.p {...r(0.22)} style={{ fontSize: "0.875rem", color: "#2e3c48", margin: 0, marginBottom: "2rem" }}>
          Same idea. Different feel.
        </motion.p>

        {/* CTAs */}
        <motion.div {...r(0.27)} style={{ display: "flex", gap: "0.875rem", flexWrap: "wrap" }}>
          <a href="#tool" style={{
            display: "inline-flex", alignItems: "center", padding: "0.6875rem 1.375rem",
            background: "#c9923c", color: "#05070a",
            borderRadius: 9, fontSize: "0.875rem", fontWeight: 700,
            textDecoration: "none", letterSpacing: "-0.01em",
            boxShadow: "0 2px 12px rgba(201,146,60,0.25)",
            transition: "box-shadow 0.2s ease, transform 0.2s ease",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(201,146,60,0.35)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(201,146,60,0.25)"; }}
          >
            Try it now →
          </a>
          <a href="#how-it-works" style={{
            display: "inline-flex", alignItems: "center", padding: "0.6875rem 1.375rem",
            color: "#3d4d5c", fontSize: "0.875rem", fontWeight: 500,
            textDecoration: "none", transition: "color 0.2s ease",
          }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#6a7a88")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "#3d4d5c")}
          >
            See how it works
          </a>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Tool ─────────────────────────────────────────────────────────────────────
function ToolSection() {
  return (
    <Section id="tool" style={{ paddingTop: "3.5rem", paddingBottom: "5rem" }}>
      <Reveal>
        <div style={{ display: "flex", alignItems: "baseline", gap: "1rem", marginBottom: "1.75rem", flexWrap: "wrap" }}>
          <Label>De-AI Engine</Label>
          <span style={{ fontSize: "0.75rem", color: "#1e2a32" }}>Paste content · choose settings · get the human version</span>
        </div>
      </Reveal>

      <div style={{
        background: "linear-gradient(160deg, rgba(14,19,26,0.95) 0%, rgba(9,13,18,0.98) 100%)",
        border: "1px solid rgba(255,255,255,0.04)",
        borderRadius: 18,
        padding: "2rem 2.25rem",
        boxShadow: "0 40px 80px rgba(0,0,0,0.4)",
      }}>
        <DeAiTool />
      </div>
    </Section>
  );
}

// ─── Before / After ──────────────────────────────────────────────────────────
function BeforeAfter() {
  const cards = [
    {
      label: "AI Output",
      labelColor: "#ef4444",
      border: "rgba(239,68,68,0.1)",
      bg: "rgba(239,68,68,0.03)",
      text: `In today's competitive landscape, it is more important than ever to leverage effective communication strategies. This comprehensive guide will walk you through the proven techniques that successful professionals use to enhance their messaging and achieve their goals.`,
    },
    {
      label: "After OffScript",
      labelColor: "#22c55e",
      border: "rgba(34,197,94,0.15)",
      bg: "rgba(34,197,94,0.03)",
      text: `Communication is competitive. The people who cut through don't use more words — they use different ones. Here's what actually works, from people who've tested it.`,
    },
  ];

  return (
    <Section style={{ paddingBottom: "6rem" }}>
      <Divider />
      <div style={{ paddingTop: "5rem" }}>
        <Reveal><Label>Before · After</Label></Reveal>
        <Reveal delay={0.06}>
          <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 700, color: "#e6eaf0", letterSpacing: "-0.04em", margin: 0, lineHeight: 1.12, maxWidth: 460, marginBottom: "3rem" }}>
            Same meaning.<br />Less AI.
          </h2>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }} className="sb-card-grid">
          {cards.map((c, i) => (
            <Reveal key={c.label} delay={i * 0.1} y={Y_ENTER}>
              <div style={{ padding: "1.75rem 2rem", background: c.bg, border: `1px solid ${c.border}`, borderRadius: 14, height: "100%" }}>
                <div style={{ fontSize: "0.625rem", fontWeight: 700, color: c.labelColor, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1rem" }}>
                  {c.label}
                </div>
                <p style={{ fontSize: "0.9rem", color: "#6a7a88", lineHeight: 1.75, margin: 0 }}>
                  {c.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── Why humanizers fail ──────────────────────────────────────────────────────
function WhyFail() {
  return (
    <Section style={{ paddingBottom: "6rem" }}>
      <Divider />
      <div style={{ paddingTop: "5rem" }}>
        <Reveal><Label>The problem with humanizers</Label></Reveal>
        <Reveal delay={0.06}>
          <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 700, color: "#e6eaf0", letterSpacing: "-0.04em", margin: 0, lineHeight: 1.12, maxWidth: 480, marginBottom: "3rem" }}>
            Most humanizers don't fix<br />the real problem.
          </h2>
        </Reveal>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            ["They swap words.", "Different vocabulary, same AI skeleton. The structure gives it away."],
            ["They keep the same structure.", "AI loves symmetry. Same sentence length, same paragraph shape — untouched."],
            ["They make it cleaner, not more human.", "Clean isn't human. Humans are messy. Humanizers polish the wrong thing."],
            ["They edit the text. They don't change the feel.", "You can tell in 3 seconds. Everyone can."],
          ].map(([title, body], i) => (
            <Reveal key={title as string} delay={i * 0.06}>
              <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "2.5rem", padding: "1.5rem 0", borderBottom: "1px solid rgba(255,255,255,0.035)" }}>
                <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#5a6a78", paddingTop: 1 }}>{title}</div>
                <p style={{ fontSize: "0.875rem", color: "#2e3c48", lineHeight: 1.65, margin: 0 }}>{body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.3}>
          <div style={{ marginTop: "2.5rem", paddingLeft: "1rem", borderLeft: "2px solid rgba(201,146,60,0.3)" }}>
            <p style={{ fontSize: "1rem", fontWeight: 600, color: "#c9923c", margin: 0, letterSpacing: "-0.01em" }}>
              OffScript breaks patterns, rhythm, and tone. Not just words.
            </p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  return (
    <Section id="how-it-works" style={{ paddingBottom: "6rem" }}>
      <Divider />
      <div style={{ paddingTop: "5rem" }}>
        <Reveal><Label>How it works</Label></Reveal>
        <Reveal delay={0.06}>
          <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 700, color: "#e6eaf0", letterSpacing: "-0.04em", margin: 0, lineHeight: 1.12, maxWidth: 400, marginBottom: "1rem" }}>
            Three steps.
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p style={{ fontSize: "0.875rem", color: "#2e3c48", lineHeight: 1.7, maxWidth: 440, margin: 0, marginBottom: "3rem" }}>
            Generic openers, essay transitions, teaching tone, perfect formatting — gone.
          </p>
        </Reveal>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            { n: "01", title: "Paste your content", body: "Drop anything — blog post, LinkedIn draft, email, thread. If AI wrote it or helped write it, it probably has fingerprints." },
            { n: "02", title: "Score + strip AI fingerprints", body: "The engine scans for 20+ AI patterns — openers, transitions, amplifiers, structural symmetry. Scores the text. Removes what gives it away." },
            { n: "03", title: "Get something that sounds human", body: "Output matches your chosen mode and intensity. The idea stays. The AI smell doesn't." },
          ].map((step, i) => (
            <Reveal key={step.n} delay={i * 0.08}>
              <div style={{ display: "grid", gridTemplateColumns: "56px 1fr", gap: "2rem", padding: "1.75rem 0", borderBottom: "1px solid rgba(255,255,255,0.035)" }}>
                <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "#1a2530", letterSpacing: "0.06em", paddingTop: 3, fontVariantNumeric: "tabular-nums" }}>{step.n}</div>
                <div>
                  <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#8b98a5", letterSpacing: "-0.015em", marginBottom: "0.375rem" }}>{step.title}</div>
                  <p style={{ fontSize: "0.875rem", color: "#2e3c48", lineHeight: 1.65, margin: 0 }}>{step.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <Section style={{ paddingBottom: "10rem" }}>
      <Divider />
      <div style={{ paddingTop: "6rem" }}>
        <Reveal>
          <h2 style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 800, color: "#e6eaf0", letterSpacing: "-0.045em", margin: 0, lineHeight: 1.08, maxWidth: 520, marginBottom: "1.25rem" }}>
            Stop sounding<br />like ChatGPT.
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <p style={{ fontSize: "0.9375rem", color: "#3d4d5c", lineHeight: 1.7, maxWidth: 360, margin: 0, marginBottom: "2.25rem" }}>
            Paste it in. See what changes. Takes 10 seconds.
          </p>
        </Reveal>
        <Reveal delay={0.14}>
          <div style={{ display: "flex", gap: "0.875rem", flexWrap: "wrap" }}>
            {[
              { label: "Try De-AI Engine →", href: "#tool", primary: true },
              { label: "Analyze my content", href: "#tool", primary: false },
            ].map(btn => (
              <a key={btn.label} href={btn.href} style={{
                display: "inline-flex", alignItems: "center",
                padding: "0.75rem 1.5rem", borderRadius: 9,
                fontSize: "0.875rem", fontWeight: btn.primary ? 700 : 500,
                textDecoration: "none", letterSpacing: "-0.01em",
                background: btn.primary ? "#c9923c" : "transparent",
                color: btn.primary ? "#05070a" : "#3d4d5c",
                border: btn.primary ? "none" : "1px solid rgba(255,255,255,0.06)",
                boxShadow: btn.primary ? "0 2px 12px rgba(201,146,60,0.22)" : "none",
                transition: "all 0.2s ease",
              }}
                onMouseEnter={e => {
                  if (btn.primary) { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(201,146,60,0.35)"; }
                  else (e.currentTarget as HTMLElement).style.color = "#6a7a88";
                }}
                onMouseLeave={e => {
                  if (btn.primary) { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(201,146,60,0.22)"; }
                  else (e.currentTarget as HTMLElement).style.color = "#3d4d5c";
                }}
              >
                {btn.label}
              </a>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.2}>
          <div style={{ marginTop: "3rem" }}>
            <a href="/" style={{ fontSize: "0.8125rem", color: "#1e2a32", textDecoration: "none", transition: "color 0.2s ease" }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#4a5562")}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "#1e2a32")}
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
export default function OffScript() {
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
        <ToolSection />
        <BeforeAfter />
        <WhyFail />
        <HowItWorks />
        <FinalCTA />
      </div>
    </div>
  );
}
