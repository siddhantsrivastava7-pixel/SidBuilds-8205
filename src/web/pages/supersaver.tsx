import { motion } from "framer-motion";
import { useInView } from "../components/useInView";
import { DUR, EASE_OUT, Y_ENTER, Y_SMALL, prefersReducedMotion } from "../components/motion";

const GITHUB = "https://github.com/siddhantsrivastava7-pixel/super-saver";
const NPX_CLAUDE = "npx github:siddhantsrivastava7-pixel/super-saver";
const NPX_CODEX  = "npx github:siddhantsrivastava7-pixel/super-saver --codex";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Section({ id, children, style }: { id?: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <section id={id} className="sb-section" style={{ padding: "0 2.5rem", ...style }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>{children}</div>
    </section>
  );
}

function Reveal({ children, delay = 0, y = Y_SMALL }: { children: React.ReactNode; delay?: number; y?: number }) {
  const { ref, inView } = useInView({ threshold: 0.12 });
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

function Label({ children, color = "#22c55e" }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{
      fontSize: "0.6875rem", fontWeight: 600, color,
      letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1.25rem",
    }}>{children}</div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "rgba(255,255,255,0.04)" }} />;
}

function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div>
      {label && (
        <div style={{ fontSize: "0.6875rem", color: "#2a3540", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.625rem" }}>
          {label}
        </div>
      )}
      <div style={{
        background: "rgba(14,19,26,0.9)", border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 10, padding: "0.875rem 1.25rem",
        fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
        fontSize: "0.85rem", color: "#22c55e", letterSpacing: "0.01em",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem",
      }}>
        <span>{code}</span>
        <button
          onClick={() => navigator.clipboard?.writeText(code)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#2a3540", fontSize: "0.7rem", fontWeight: 600,
            letterSpacing: "0.06em", textTransform: "uppercase",
            padding: "0.25rem 0.5rem", borderRadius: 4,
            transition: "color 0.2s ease",
            flexShrink: 0,
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#8b98a5")}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "#2a3540")}
        >
          Copy
        </button>
      </div>
    </div>
  );
}

// ─── Mini nav ─────────────────────────────────────────────────────────────────
function MiniNav() {
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
      height: 60, display: "flex", alignItems: "center", padding: "0 2.5rem",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: "0.9rem", fontWeight: 600, letterSpacing: "-0.03em" }}>
            <span style={{ color: "#ffffff" }}>Sid</span>
            <span style={{ color: "rgba(255,255,255,0.45)" }}>Builds</span>
          </span>
        </a>
        <a href={GITHUB} target="_blank" rel="noopener noreferrer" style={{
          display: "inline-flex", alignItems: "center", padding: "0.375rem 0.875rem",
          background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
          borderRadius: 7, color: "#22c55e", fontSize: "0.8125rem", fontWeight: 500,
          textDecoration: "none", transition: "background 0.2s ease",
        }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(34,197,94,0.18)")}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "rgba(34,197,94,0.1)")}
        >
          GitHub
        </a>
      </div>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  const reduced = prefersReducedMotion();
  const r = (delay: number) => ({
    initial: { opacity: 0, y: reduced ? 0 : Y_ENTER },
    animate: { opacity: 1, y: 0 },
    transition: { duration: DUR.slow, ease: EASE_OUT, delay: reduced ? 0 : delay },
  });

  return (
    <section className="sb-section" style={{ padding: "0 2.5rem", minHeight: "90vh", display: "flex", alignItems: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "-10%", left: "-5%", width: "60vw", height: "60vh", background: "radial-gradient(ellipse at 30% 40%, rgba(34,197,94,0.05) 0%, transparent 65%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%", paddingTop: 130, paddingBottom: 100 }}>
        {/* Badge */}
        <motion.div {...r(0.05)} style={{ marginBottom: "2.25rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 6px rgba(34,197,94,0.5)" }} />
            <span style={{ fontSize: "0.8125rem", color: "#3d6644", fontWeight: 500 }}>Claude Code · Codex · No GitHub needed</span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1 {...r(0.1)} style={{ fontSize: "clamp(2.75rem, 6vw, 5.25rem)", fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1.04, margin: 0, marginBottom: "0.5rem", maxWidth: 820 }}>
          <span style={{ color: "#e6eaf0" }}>Save 30–70% tokens</span>
        </motion.h1>
        <motion.h1 {...r(0.16)} style={{ fontSize: "clamp(2.75rem, 6vw, 5.25rem)", fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1.04, margin: 0, marginBottom: "1.75rem", maxWidth: 820 }}>
          <span style={{ color: "#22c55e" }}>automatically.</span>
        </motion.h1>

        {/* Subtext */}
        <motion.p {...r(0.24)} style={{ fontSize: "1.125rem", color: "#4a5562", lineHeight: 1.7, maxWidth: 460, margin: 0, marginBottom: "0.75rem" }}>
          Install once. Keep working normally.
        </motion.p>
        <motion.p {...r(0.28)} style={{ fontSize: "0.9375rem", color: "#2e3c48", lineHeight: 1.7, maxWidth: 480, margin: 0, marginBottom: "2.75rem" }}>
          Super Saver fixes how your AI session works — compressing context, avoiding repeated work, and routing to the right model. No new commands. No new UI. No workflow change.
        </motion.p>

        {/* Install CTAs */}
        <motion.div {...r(0.34)} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: 500, marginBottom: "3rem" }}>
          <CodeBlock code={NPX_CLAUDE} label="Claude Code" />
          <CodeBlock code={NPX_CODEX}  label="Codex" />
        </motion.div>

        {/* Ghost CTA */}
        <motion.div {...r(0.4)} style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          <a href={GITHUB} target="_blank" rel="noopener noreferrer" style={{
            display: "inline-flex", alignItems: "center",
            padding: "0.6875rem 1.375rem",
            background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
            borderRadius: 9, color: "#22c55e", fontSize: "0.875rem", fontWeight: 600,
            textDecoration: "none", transition: "background 0.2s ease",
          }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(34,197,94,0.18)")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "rgba(34,197,94,0.1)")}
          >
            View on GitHub →
          </a>
          <a href="#results" style={{ fontSize: "0.875rem", color: "#3d4d5c", textDecoration: "none", transition: "color 0.2s ease" }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#6a7a88")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "#3d4d5c")}
          >
            See real results ↓
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div {...r(0.46)} style={{ display: "flex", gap: "3rem", marginTop: "5rem", flexWrap: "wrap" }}>
          {[{ value: "30–70%", label: "token reduction" }, { value: "0", label: "output quality lost" }, { value: "1 line", label: "to install" }].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#c4ccd4", letterSpacing: "-0.04em" }}>{s.value}</div>
              <div style={{ fontSize: "0.75rem", color: "#2e3c48", fontWeight: 500, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Problem ──────────────────────────────────────────────────────────────────
function Problem() {
  return (
    <Section style={{ paddingBottom: "7rem" }}>
      <Divider />
      <div style={{ paddingTop: "7rem" }}>
        <Reveal><Label color="#ef4444">The real problem</Label></Reveal>
        <Reveal delay={0.06}>
          <h2 style={{ fontSize: "clamp(1.875rem, 3.5vw, 2.75rem)", fontWeight: 700, color: "#e6eaf0", letterSpacing: "-0.04em", margin: 0, lineHeight: 1.12, maxWidth: 560, marginBottom: "1rem" }}>
            AI isn't expensive.<br />
            <span style={{ color: "#ef4444" }}>Bad sessions are.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p style={{ fontSize: "0.9375rem", color: "#3d4d5c", lineHeight: 1.7, maxWidth: 460, margin: 0, marginBottom: "3.5rem" }}>
            You're wasting 30–70% of tokens on every session without realizing it.
          </p>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 14, overflow: "hidden" }} className="sb-card-grid">
          {[
            { icon: "↺", title: "Idle → full reload", body: "You pause for 5 minutes. Everything reloads. Same files re-read from scratch." },
            { icon: "⊞", title: "Same files, again", body: "Your codebase gets scanned every call. Nothing is remembered between prompts." },
            { icon: "↕", title: "Bloated conversations", body: "Long chats become expensive. 30 messages in, you're re-sending 10,000 tokens of history you don't need." },
            { icon: "⚡", title: "Wrong model", body: "Simple tasks hit expensive models. No one checks. The bill just grows." },
          ].map((item, i) => (
            <Reveal key={item.title} delay={i * 0.07} y={Y_ENTER}>
              <div style={{ padding: "2rem 2rem", background: "#060a0f" }}>
                <div style={{ fontSize: "1rem", color: "#1e2a32", marginBottom: "0.75rem" }}>{item.icon}</div>
                <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#8b98a5", letterSpacing: "-0.015em", marginBottom: "0.5rem" }}>{item.title}</div>
                <p style={{ fontSize: "0.85rem", color: "#2e3c48", lineHeight: 1.65, margin: 0 }}>{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── Solution ─────────────────────────────────────────────────────────────────
function Solution() {
  return (
    <Section id="how-it-works" style={{ paddingBottom: "7rem" }}>
      <Divider />
      <div style={{ paddingTop: "7rem" }}>
        <Reveal><Label>How it works</Label></Reveal>
        <Reveal delay={0.06}>
          <h2 style={{ fontSize: "clamp(1.875rem, 3.5vw, 2.75rem)", fontWeight: 700, color: "#e6eaf0", letterSpacing: "-0.04em", margin: 0, lineHeight: 1.12, maxWidth: 560, marginBottom: "1rem" }}>
            Fixes the session.<br />Not just the prompt.
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p style={{ fontSize: "0.9375rem", color: "#3d4d5c", lineHeight: 1.7, maxWidth: 460, margin: 0, marginBottom: "4rem" }}>
            Most tools optimize one prompt. Super Saver optimizes the entire session lifecycle — what to send, what to keep, what to drop, when to reset, which model to use.
          </p>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem" }} className="sb-card-grid">
          {[
            {
              title: "Smarter context",
              items: ["Compresses long conversations", "Removes useless history", "Rebuilds context after idle gaps"],
              color: "rgba(34,197,94,0.08)",
              border: "rgba(34,197,94,0.1)",
            },
            {
              title: "No repeated work",
              items: ["Avoids re-reading the same files", "Tracks what's already known", "Skips redundant context"],
              color: "rgba(59,130,246,0.08)",
              border: "rgba(59,130,246,0.1)",
            },
            {
              title: "Right model, every time",
              items: ["Codex → auto-selects best model + reasoning", "Claude → suggests optimal model when needed", "Simple tasks stay cheap"],
              color: "rgba(168,85,247,0.08)",
              border: "rgba(168,85,247,0.1)",
            },
            {
              title: "Cleaner answers",
              items: ["Less fluff in responses", "More direct output", "Fewer retries needed"],
              color: "rgba(201,146,60,0.08)",
              border: "rgba(201,146,60,0.1)",
            },
          ].map((f, i) => (
            <Reveal key={f.title} delay={i * 0.07} y={Y_ENTER}>
              <div style={{ padding: "1.75rem 2rem", background: f.color, border: `1px solid ${f.border}`, borderRadius: 12 }}>
                <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#8b98a5", letterSpacing: "-0.015em", marginBottom: "1rem" }}>{f.title}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {f.items.map(item => (
                    <div key={item} style={{ display: "flex", gap: "0.625rem", fontSize: "0.85rem", color: "#2e3c48" }}>
                      <span style={{ color: "#1e3a4a", flexShrink: 0 }}>→</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── Real Results ─────────────────────────────────────────────────────────────
function Results() {
  const { ref, inView } = useInView({ threshold: 0.2 });
  const noMotion = prefersReducedMotion();

  const stats = [
    { label: "Prompts processed", value: 71 },
    { label: "Tokens without optimizer", value: 15978 },
    { label: "Tokens with optimizer", value: 10107 },
    { label: "Tokens saved", value: 5871, highlight: true },
    { label: "Efficiency", value: "37%", highlight: true },
  ];

  return (
    <Section id="results" style={{ paddingBottom: "7rem" }}>
      <Divider />
      <div style={{ paddingTop: "7rem" }} ref={ref as React.RefObject<HTMLDivElement>}>
        <Reveal><Label>Real session data</Label></Reveal>
        <Reveal delay={0.06}>
          <h2 style={{ fontSize: "clamp(1.875rem, 3.5vw, 2.75rem)", fontWeight: 700, color: "#e6eaf0", letterSpacing: "-0.04em", margin: 0, lineHeight: 1.12, maxWidth: 540, marginBottom: "1rem" }}>
            Same work. ~6,000 tokens saved.
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p style={{ fontSize: "0.9375rem", color: "#3d4d5c", lineHeight: 1.7, maxWidth: 420, margin: 0, marginBottom: "3rem" }}>
            Actual output from a real session — not a benchmark, not a simulation.
          </p>
        </Reveal>

        {/* JSON-style card */}
        <Reveal delay={0.14}>
          <div style={{
            background: "rgba(14,19,26,0.9)", border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: 14, overflow: "hidden", maxWidth: 560,
          }}>
            {/* Header */}
            <div style={{ padding: "0.875rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px rgba(34,197,94,0.5)" }} />
              <span style={{ fontSize: "0.7rem", color: "#2a3540", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Session output</span>
            </div>
            {/* Rows */}
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ duration: DUR.enter, ease: EASE_OUT, delay: noMotion ? 0 : 0.1 + i * 0.08 }}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "0.875rem 1.5rem",
                  borderBottom: i < stats.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
                  background: s.highlight ? "rgba(34,197,94,0.04)" : "transparent",
                }}
              >
                <span style={{ fontSize: "0.8125rem", color: s.highlight ? "#6a7a88" : "#2e3c48", fontFamily: "monospace" }}>
                  {s.label.toLowerCase().replace(/ /g, "_")}
                </span>
                <motion.span
                  initial={{ color: "#2e3c48" }}
                  animate={inView ? { color: s.highlight ? "#22c55e" : "#6a7a88" } : {}}
                  transition={{ duration: 0.5, delay: noMotion ? 0 : 0.4 + i * 0.08 }}
                  style={{ fontSize: "0.8125rem", fontFamily: "monospace", fontWeight: s.highlight ? 700 : 500 }}
                >
                  {typeof s.value === "number" ? s.value.toLocaleString() : s.value}
                </motion.span>
              </motion.div>
            ))}
          </div>
        </Reveal>

        {/* Takeaway pills */}
        <Reveal delay={0.3}>
          <div style={{ display: "flex", gap: "1rem", marginTop: "1.75rem", flexWrap: "wrap" }}>
            {["Same work", "~6,000 tokens saved", "Better answers"].map(t => (
              <div key={t} style={{
                fontSize: "0.8125rem", color: "#22c55e", fontWeight: 500,
                padding: "0.375rem 0.875rem",
                background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.12)",
                borderRadius: 100,
              }}>
                {t}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

// ─── No Risk ──────────────────────────────────────────────────────────────────
function NoRisk() {
  return (
    <Section style={{ paddingBottom: "7rem" }}>
      <Divider />
      <div style={{ paddingTop: "7rem" }}>
        <Reveal>
          <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700, color: "#e6eaf0", letterSpacing: "-0.04em", margin: 0, lineHeight: 1.15, maxWidth: 460, marginBottom: "3rem" }}>
            No risk. No lock-in. Invisible layer.
          </h2>
        </Reveal>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            ["Runs locally", "Nothing leaves your machine. No telemetry, no cloud."],
            ["Prompts stay unchanged", "Your prompts go through exactly as written — Super Saver optimizes the session, not your words."],
            ["No lock-in", "Remove it in 10 seconds. No config files, no residue."],
            ["Invisible", "Once installed, you don't think about it. It just runs."],
          ].map(([title, body], i) => (
            <Reveal key={title} delay={i * 0.06}>
              <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "2rem", padding: "1.5rem 0", borderBottom: "1px solid rgba(255,255,255,0.035)" }}>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#5a6a78", paddingTop: 1 }}>{title}</div>
                <p style={{ fontSize: "0.875rem", color: "#2e3c48", lineHeight: 1.65, margin: 0 }}>{body}</p>
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
      <div style={{ paddingTop: "7rem" }}>
        <Reveal>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 6px rgba(34,197,94,0.5)" }} />
            <span style={{ fontSize: "0.8125rem", color: "#3d6644", fontWeight: 500 }}>No GitHub account needed to install</span>
          </div>
        </Reveal>
        <Reveal delay={0.06}>
          <h2 style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 800, color: "#e6eaf0", letterSpacing: "-0.045em", margin: 0, lineHeight: 1.08, maxWidth: 580, marginBottom: "1.25rem" }}>
            Start saving tokens today.
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p style={{ fontSize: "0.9375rem", color: "#3d4d5c", lineHeight: 1.7, maxWidth: 400, margin: 0, marginBottom: "2.5rem" }}>
            Restart your session — it's active. That's it.
          </p>
        </Reveal>
        <Reveal delay={0.14}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: 500, marginBottom: "2.5rem" }}>
            <CodeBlock code={NPX_CLAUDE} label="Claude Code" />
            <CodeBlock code={NPX_CODEX}  label="Codex" />
          </div>
        </Reveal>
        <Reveal delay={0.2}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
            <a href={GITHUB} target="_blank" rel="noopener noreferrer" style={{
              display: "inline-flex", alignItems: "center",
              padding: "0.75rem 1.5rem",
              background: "#22c55e", color: "#05070a",
              borderRadius: 9, fontSize: "0.9rem", fontWeight: 700,
              textDecoration: "none", boxShadow: "0 2px 16px rgba(34,197,94,0.2)",
              transition: "box-shadow 0.2s ease, transform 0.2s ease",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 24px rgba(34,197,94,0.3)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 16px rgba(34,197,94,0.2)"; }}
            >
              ⭐ Star on GitHub
            </a>
            <a href="/" style={{ fontSize: "0.875rem", color: "#2e3c48", textDecoration: "none", transition: "color 0.2s ease" }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#6a7a88")}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "#2e3c48")}
            >
              ← Back to SidBuilds
            </a>
          </div>
        </Reveal>

        {/* Social proof line */}
        <Reveal delay={0.28}>
          <p style={{ fontSize: "0.8125rem", color: "#1e2a32", marginTop: "2rem", lineHeight: 1.6, maxWidth: 380, fontStyle: "italic" }}>
            "My sessions stopped getting messy. Answers got cleaner. And I stopped burning tokens for no reason."
          </p>
        </Reveal>
      </div>
    </Section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SuperSaver() {
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
        <Problem />
        <Solution />
        <Results />
        <NoRisk />
        <FinalCTA />
      </div>
    </div>
  );
}
