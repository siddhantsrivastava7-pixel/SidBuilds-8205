import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useInView } from "./useInView";
import { useRef, useEffect } from "react";
import { DUR, EASE_OUT, SPRING_SCROLL, Y_SMALL, prefersReducedMotion } from "./motion";

// ─── Data ─────────────────────────────────────────────────────────────────────
type Entry = {
  date: string;
  title: string;
  description?: string;
  points?: string[];
  tag: string;
  tagColor: string;
};

const entries: Entry[] = [
  {
    date: "Dec 2021",
    title: "Raised $2M pre-seed",
    description: "Closed pre-seed round. First institutional capital.",
    tag: "Funding",
    tagColor: "#c9923c",
  },
  {
    date: "Apr – Jun 2022",
    title: "Built & scaled Taroverse",
    points: [
      "$500M peak FDV",
      "80K users",
    ],
    tag: "Milestone",
    tagColor: "#7c5cbf",
  },
  {
    date: "Jan 2024",
    title: "Sunset Taroverse",
    description: "Wound down operations. Shifted focus to portfolio systems & mutual fund research.",
    tag: "Pivot",
    tagColor: "#3b82f6",
  },
  {
    date: "Jan 2026",
    title: "Built PromptBoost",
    description: "Auto-optimizes prompts across major AI platforms.",
    tag: "Launch",
    tagColor: "#22c55e",
  },
  {
    date: "Mar 2026",
    title: "Launched MeraPolicyAdvisor",
    description: "Deterministic engine for portfolio analysis & corrections.",
    tag: "Launch",
    tagColor: "#3b82f6",
  },
  {
    date: "Apr 2026",
    title: "Built Super Saver",
    description: "Cuts 50–70% token usage inside Claude Code & Codex.",
    tag: "Launch",
    tagColor: "#22c55e",
  },
  {
    date: "Apr 2026",
    title: "Building Recall",
    description: "Turns saved bookmarks, notes, and links into a searchable memory layer.",
    tag: "Building",
    tagColor: "#3b82f6",
  },
];

// ─── Tag ─────────────────────────────────────────────────────────────────────
function injectPulseStyle() {
  if (typeof document === "undefined") return;
  const id = "sb-tag-pulse";
  if (document.getElementById(id)) return;
  const s = document.createElement("style");
  s.id = id;
  s.textContent = `
    @keyframes sb-pulse {
      0%, 100% { opacity: 0.35; }
      50%       { opacity: 0.60; }
    }
    .sb-tag-pulse { animation: sb-pulse 6s ease-in-out infinite; }
  `;
  document.head.appendChild(s);
}

function TagPill({ tag, color, delay = "0s" }: { tag: string; color: string; delay?: string }) {
  useEffect(() => { injectPulseStyle(); }, []);
  return (
    <span
      className="sb-tag-pulse"
      style={{
        fontSize: "0.625rem", color,
        fontWeight: 600, textTransform: "uppercase",
        letterSpacing: "0.09em",
        animationDelay: delay,
        flexShrink: 0,
      }}
    >
      {tag}
    </span>
  );
}

// Tag delay offsets so they don't all pulse in sync
const tagDelays: Record<string, string> = {
  Funding: "0s", Milestone: "1.2s", Pivot: "2.4s", Launch: "3.6s", Building: "4.8s",
};

// ─── Row ─────────────────────────────────────────────────────────────────────
function TimelineRow({ entry, index }: { entry: Entry; index: number }) {
  const { ref, inView } = useInView({ threshold: 0.2 });
  const noMotion = prefersReducedMotion();

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      className="sb-timeline-row"
      initial={{ opacity: 0, x: noMotion ? 0 : -8 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: DUR.enter, ease: EASE_OUT, delay: index * 0.04 }}
      style={{
        display: "grid",
        gridTemplateColumns: "160px 1fr",
        gap: "2.5rem",
        padding: "1.875rem 0",
        borderBottom: "1px solid rgba(255,255,255,0.035)",
        cursor: "default",
      }}
    >
      {/* Date */}
      <div style={{
        fontSize: "0.75rem", color: "#2a3540", fontWeight: 500,
        paddingTop: 2, letterSpacing: "0.01em",
        fontVariantNumeric: "tabular-nums", lineHeight: 1.5,
      }}>
        {entry.date}
      </div>

      {/* Content */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>

        {/* Title + tag */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.875rem", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "0.9375rem", fontWeight: 600,
              letterSpacing: "-0.015em", lineHeight: 1.35,
              color: "#8b98a5",
              transition: "color 0.25s ease",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#b8c2cc"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#8b98a5"; }}
          >
            {entry.title}
          </span>
          <TagPill tag={entry.tag} color={entry.tagColor} delay={tagDelays[entry.tag] ?? "0s"} />
        </div>

        {/* Description line */}
        {entry.description && (
          <p style={{
            fontSize: "0.8125rem", color: "#2e3c48",
            margin: 0, lineHeight: 1.65,
          }}>
            {entry.description}
          </p>
        )}

        {/* Sub-points */}
        {entry.points && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginTop: "0.125rem" }}>
            {entry.points.map((pt) => (
              <div key={pt} style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                fontSize: "0.8125rem", color: "#3d4d5c",
              }}>
                <span style={{ color: "#1e3a4a", fontSize: "0.7rem", flexShrink: 0 }}>→</span>
                {pt}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Progress line ────────────────────────────────────────────────────────────
function ProgressLine({ containerRef }: { containerRef: React.RefObject<HTMLDivElement> }) {
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const smoothProgress = useSpring(scrollYProgress, SPRING_SCROLL);
  const scaleY = useTransform(smoothProgress, [0, 1], [0, 1]);

  return (
    <div style={{
      position: "absolute",
      left: 0, top: 0, bottom: 0,
      width: 1,
      background: "rgba(255,255,255,0.04)",
    }}>
      <motion.div
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0, height: "100%",
          background: "linear-gradient(to bottom, rgba(59,130,246,0.35) 0%, rgba(34,197,94,0.18) 100%)",
          transformOrigin: "top",
          scaleY,
        }}
      />
    </div>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────
export function BuildLog() {
  const { ref: headingRef, inView: headingInView } = useInView({ threshold: 0.1 });
  const containerRef = useRef<HTMLDivElement>(null);
  const noMotion = prefersReducedMotion();

  return (
    <section id="builds" className="sb-section" style={{ padding: "0 2.5rem", marginTop: 120 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        <motion.div
          ref={headingRef as React.RefObject<HTMLDivElement>}
          initial={{ opacity: 0, y: noMotion ? 0 : Y_SMALL }}
          animate={headingInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: DUR.enter, ease: EASE_OUT }}
          style={{ marginBottom: "3.5rem" }}
        >
          <h2 style={{
            fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
            fontWeight: 700, color: "#e6eaf0",
            letterSpacing: "-0.035em", margin: 0, lineHeight: 1.15,
          }}>
            The progression.
          </h2>
        </motion.div>

        <div ref={containerRef} style={{ position: "relative", paddingLeft: "1.75rem" }}>
          <ProgressLine containerRef={containerRef} />
          {entries.map((entry, i) => (
            <TimelineRow key={i} entry={entry} index={i} />
          ))}
        </div>

      </div>
    </section>
  );
}
