import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';

/* ═══════════════════════════════════════════════════════════════════════
   SUPER SAVER — Cinematic system-level experience
   Dark terminal. Invisible runtime. Token compression.
   ═══════════════════════════════════════════════════════════════════════ */

const CYAN  = '#00D4FF';
const CYAN2 = 'rgba(0,212,255,0.7)';
const CYAN3 = 'rgba(0,212,255,0.15)';
const GREEN = '#00FF88';
const DIM   = 'rgba(180,220,255,0.18)';

/* ─── Helpers ────────────────────────────────────────────────────────── */
function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

/* ─── Boot sequence veil ─────────────────────────────────────────────── */
const BOOT_LINES = [
  '> initializing super_saver runtime…',
  '> loading compression engine v2.4.1',
  '> connecting to claude_code context stream',
  '> scanning token allocation map',
  '> optimization layer: ACTIVE',
  '> all systems nominal.',
  '',
];

function BootVeil({ onDone }: { onDone: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [done, setDone]   = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await sleep(120);
      for (const line of BOOT_LINES) {
        if (cancelled) return;
        setLines(prev => [...prev, line]);
        await sleep(line === '' ? 180 : 95 + Math.random() * 80);
      }
      await sleep(260);
      if (!cancelled) {
        setDone(true);
        // Call onDone immediately — don't wait for CSS fade to complete
        onDone();
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  return (
    <motion.div
      animate={done ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.55 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: '#030508',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: done ? 'none' : 'all',
        fontFamily: "'Space Mono', monospace",
      }}
    >
      <div style={{ width: 480 }}>
        {/* Logo line */}
        <div style={{
          fontSize: 10, letterSpacing: '0.3em', color: CYAN,
          marginBottom: '2rem', textTransform: 'uppercase',
          borderLeft: `2px solid ${CYAN}`,
          paddingLeft: '0.75rem',
        }}>
          SUPER_SAVER / RUNTIME_INIT
        </div>

        {/* Boot lines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {lines.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.12 }}
              style={{
                fontSize: 11, lineHeight: 1.5,
                color: line.includes('ACTIVE') ? GREEN
                  : line.includes('nominal') ? 'rgba(180,255,200,0.7)'
                  : 'rgba(160,200,220,0.45)',
              }}
            >
              {line}
            </motion.div>
          ))}
        </div>

        {/* Blinking cursor */}
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.7, repeat: Infinity }}
          style={{
            display: 'inline-block', width: 7, height: 13,
            background: CYAN, marginTop: 8, marginLeft: 2,
            verticalAlign: 'middle',
          }}
        />
      </div>
    </motion.div>
  );
}

/* ─── Scanline grid background ───────────────────────────────────────── */
function SystemGrid() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {/* Deep space bg */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(ellipse at 20% 10%, rgba(0,80,120,0.07) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 80%, rgba(0,50,80,0.06) 0%, transparent 50%),
          #040608
        `,
      }} />

      {/* Subtle grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(0,212,255,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,212,255,0.025) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
      }} />

      {/* Scan line */}
      <motion.div
        initial={{ top: '-2px' }}
        animate={{ top: '102%' }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear', repeatDelay: 4 }}
        style={{
          position: 'absolute', left: 0, right: 0,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${CYAN3}, rgba(0,212,255,0.06), ${CYAN3}, transparent)`,
        }}
      />

      {/* Corner brackets */}
      {[
        { top: 16, left: 16, borderTop: `1px solid ${CYAN}33`, borderLeft: `1px solid ${CYAN}33` },
        { top: 16, right: 16, borderTop: `1px solid ${CYAN}33`, borderRight: `1px solid ${CYAN}33` },
        { bottom: 16, left: 16, borderBottom: `1px solid ${CYAN}33`, borderLeft: `1px solid ${CYAN}33` },
        { bottom: 16, right: 16, borderBottom: `1px solid ${CYAN}33`, borderRight: `1px solid ${CYAN}33` },
      ].map((style, i) => (
        <div key={i} style={{ position: 'absolute', width: 22, height: 22, ...style }} />
      ))}
    </div>
  );
}

/* ─── Nav ────────────────────────────────────────────────────────────── */
function Nav() {
  const [, setLocation] = useLocation();
  return (
    <motion.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 2.5rem', height: 56,
        borderBottom: '1px solid rgba(0,212,255,0.07)',
        background: 'rgba(4,6,8,0.85)',
        backdropFilter: 'blur(16px)',
        fontFamily: "'Space Mono', monospace",
      }}
    >
      {/* Back */}
      <div
        onClick={() => setLocation('/')}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          cursor: 'pointer', color: 'rgba(0,212,255,0.55)', transition: 'color 0.2s cubic-bezier(0.22,1,0.36,1)',
          fontSize: 9, letterSpacing: '0.18em',
          transition: 'color 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = CYAN)}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(0,212,255,0.55)')}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M8 1L3 6L8 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        BACK
      </div>

      {/* Wordmark */}
      <div style={{
        fontSize: 10, letterSpacing: '0.22em',
        color: CYAN, textTransform: 'uppercase',
      }}>
        SUPER_SAVER
      </div>

      {/* Status indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          style={{ width: 5, height: 5, borderRadius: '50%', background: GREEN }}
        />
        <span style={{ fontSize: 8, letterSpacing: '0.2em', color: 'rgba(0,255,136,0.55)' }}>RUNTIME ACTIVE</span>
      </div>
    </motion.nav>
  );
}

/* ─── Token counter util ─────────────────────────────────────────────── */
function TokenCount({ value, color = CYAN, size = 13 }: { value: number; color?: string; size?: number }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const from = prevRef.current;
    const to   = value;
    if (from === to) return;
    const steps = 18;
    const diff  = to - from;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplay(Math.round(from + diff * (i / steps)));
      if (i >= steps) { setDisplay(to); clearInterval(id); }
    }, 18);
    prevRef.current = value;
    return () => clearInterval(id);
  }, [value]);

  return (
    <span style={{
      fontFamily: "'Space Mono', monospace",
      fontSize: size, color,
      fontVariantNumeric: 'tabular-nums',
    }}>
      {display.toLocaleString()}
    </span>
  );
}

/* ─── Prompt block ───────────────────────────────────────────────────── */
function PromptBlock({
  label, lines, accent = CYAN, dim = false, blur = false, strikethrough = false,
  delay = 0, highlight = false,
}: {
  label: string;
  lines: string[];
  accent?: string;
  dim?: boolean;
  blur?: boolean;
  strikethrough?: boolean;
  delay?: number;
  highlight?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{
        opacity: dim ? 0.22 : 1,
        filter: blur ? 'blur(1.5px)' : 'blur(0px)',
        scale: dim ? 0.98 : 1,
      }}
      transition={{ duration: 0.22, delay, ease: 'easeOut' }}
      style={{
        background: highlight
          ? `linear-gradient(135deg, rgba(0,212,255,0.07), rgba(0,212,255,0.03))`
          : 'rgba(8,12,18,0.9)',
        border: `1px solid ${highlight ? `${accent}44` : 'rgba(0,212,255,0.08)'}`,
        borderLeft: `2px solid ${accent}`,
        borderRadius: 4,
        padding: '9px 13px',
        fontFamily: "'Space Mono', monospace",
        position: 'relative',
        overflow: 'hidden',
        boxShadow: highlight ? `0 0 20px ${accent}18` : 'none',
      }}
    >
      {/* Label */}
      <div style={{
        fontSize: 6.5, letterSpacing: '0.2em', color: `${accent}99`,
        marginBottom: 5, textTransform: 'uppercase',
      }}>
        {label}
      </div>

      {/* Lines */}
      {lines.map((line, i) => (
        <div key={i} style={{
          fontSize: 9.5, lineHeight: 1.6,
          color: strikethrough ? 'rgba(255,80,80,0.45)' : 'rgba(180,220,240,0.7)',
          textDecoration: strikethrough ? 'line-through' : 'none',
          whiteSpace: 'pre',
        }}>
          {line}
        </div>
      ))}
    </motion.div>
  );
}

/* ─── SECTION 1: Hero ────────────────────────────────────────────────── */
function HeroSection() {
  const [tick, setTick]   = useState(0);
  const [stream, setStream] = useState('');
  const streamText = '> analyzing prompt structure… compressing context… tokens_saved: 1,847… routing to claude_code… ';

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      setStream(streamText.slice(0, i % streamText.length + 1));
      i++;
    }, 38);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 2200);
    return () => clearInterval(id);
  }, []);

  const tokens = [4800, 3200, 5100, 2900][tick % 4];
  const saved  = [1847, 1240, 2050, 1100][tick % 4];

  return (
    <section style={{
      position: 'relative', zIndex: 1,
      minHeight: '100vh',
      display: 'flex', alignItems: 'center',
      padding: '80px 2rem 4rem',
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto', width: '100%',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem',
        alignItems: 'center',
      }}>

        {/* LEFT: Copy */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* System tag */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: CYAN3,
            border: `1px solid ${CYAN}28`,
            borderRadius: 3, padding: '4px 10px',
            marginBottom: '1.5rem',
          }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: CYAN, boxShadow: `0 0 6px ${CYAN}` }} />
            <span style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 7.5, letterSpacing: '0.22em', color: CYAN2,
            }}>RUNTIME OPTIMIZATION LAYER</span>
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2.8rem, 5vw, 4.4rem)',
            fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.0,
            color: '#EAF4FF', margin: '0 0 0.8rem',
          }}>
            Super Saver
          </h1>

          <h2 style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 'clamp(1.1rem, 2vw, 1.5rem)',
            fontWeight: 400, letterSpacing: '-0.01em', lineHeight: 1.3,
            color: CYAN2, margin: '0 0 1.2rem',
          }}>
            Cut your token usage<br />by up to <span style={{ color: CYAN, fontWeight: 700 }}>70%</span>
          </h2>

          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14, lineHeight: 1.75,
            color: 'rgba(160,200,220,0.5)',
            margin: '0 0 2.5rem', maxWidth: 380,
          }}>
            A runtime optimization layer for Claude Code.
            Works silently, every prompt, automatically.
          </p>

          {/* Live token counter */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 12, maxWidth: 340,
          }}>
            {[
              { label: 'TOKENS / PROMPT', value: tokens, sub: 'before optimization', color: 'rgba(255,100,100,0.7)' },
              { label: 'TOKENS SAVED', value: saved, sub: 'this session', color: GREEN },
            ].map(m => (
              <div key={m.label} style={{
                background: 'rgba(0,212,255,0.03)',
                border: '1px solid rgba(0,212,255,0.09)',
                borderRadius: 4, padding: '10px 12px',
              }}>
                <div style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 7, letterSpacing: '0.18em',
                  color: 'rgba(0,212,255,0.4)',
                  marginBottom: 5, textTransform: 'uppercase',
                }}>{m.label}</div>
                <TokenCount value={m.value} color={m.color} size={18} />
                <div style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 6.5, color: 'rgba(100,160,180,0.4)',
                  marginTop: 3, letterSpacing: '0.08em',
                }}>{m.sub}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* RIGHT: Live system view */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: 'rgba(4,8,14,0.97)',
            border: '1px solid rgba(0,212,255,0.1)',
            borderRadius: 6,
            padding: '1.25rem',
            boxShadow: `0 0 60px rgba(0,0,0,0.6), 0 0 1px ${CYAN}22`,
            fontFamily: "'Space Mono', monospace",
          }}
        >
          {/* Terminal header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            paddingBottom: '0.75rem',
            borderBottom: '1px solid rgba(0,212,255,0.07)',
            marginBottom: '0.75rem',
          }}>
            {['rgba(255,95,87,0.7)', 'rgba(255,189,46,0.7)', 'rgba(39,201,63,0.7)'].map(c => (
              <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
            ))}
            <span style={{ fontSize: 7.5, letterSpacing: '0.15em', color: 'rgba(0,212,255,0.3)', marginLeft: 6 }}>
              super_saver — claude_code_runtime
            </span>
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              style={{
                marginLeft: 'auto', width: 5, height: 5,
                borderRadius: '50%', background: GREEN,
                boxShadow: `0 0 6px ${GREEN}`,
              }}
            />
          </div>

          {/* Live stream text */}
          <div style={{
            fontSize: 8, lineHeight: 1.8, color: 'rgba(0,212,255,0.4)',
            minHeight: 18, marginBottom: '0.75rem',
            overflow: 'hidden', whiteSpace: 'nowrap',
          }}>
            {stream}
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              style={{ display: 'inline-block', width: 5, height: 10, background: CYAN, verticalAlign: 'middle', marginLeft: 1 }}
            />
          </div>

          {/* Prompt blocks preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <PromptBlock label="SYSTEM PROMPT" lines={['Act as a senior engineer…', 'Context: claude_code v2.1']} highlight />
            <PromptBlock label="USER INPUT" lines={['Refactor this component to use…']} accent={CYAN} />
            <PromptBlock label="CONTEXT [COMPRESSED]" lines={['[847 tokens → 312 tokens]', '↓ 63% reduction applied']} accent={GREEN} highlight />
          </div>

          {/* Bottom bar */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: '0.75rem', paddingTop: '0.65rem',
            borderTop: '1px solid rgba(0,212,255,0.06)',
            fontSize: 7, letterSpacing: '0.14em',
          }}>
            <span style={{ color: 'rgba(0,212,255,0.3)' }}>SUPER_SAVER v2.4.1</span>
            <span style={{ color: GREEN }}>● INTERCEPTING</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}


/* ═══════════════════════════════════════════════════════════════════════
   CINEMATIC TRANSFORMATION SECTION
   Phases: idle → buildup → pause → intercept → hookReveal → scan →
           collapse → after → terminal → metrics
   ═══════════════════════════════════════════════════════════════════════ */

type TxPhase =
  | 'idle'
  | 'buildup'
  | 'pause'
  | 'intercept'   // "Hook: UserPromptSubmit intercepted" bar
  | 'hookReveal'  // brief hold on hook message
  | 'scan'        // scan line sweeps
  | 'collapse'    // blocks snap-delete (instant)
  | 'after'       // clean optimized state
  | 'terminal'    // npx super-saver init block
  | 'install'     // Claude Code install moment
  | 'metrics';    // numbers snap in

interface Block {
  id:       number;
  label:    string;
  lines:    string[];
  kind:     'input' | 'history' | 'filedump' | 'duplicate' | 'sysPrompt';
  tokens:   number;
  waste:    boolean;
  delay:    number;
}

const BLOCKS: Block[] = [
  {
    id: 1, kind: 'input', waste: false, tokens: 14, delay: 0,
    label: 'USER INPUT',
    lines: ['> Fix the auth bug in /api/login'],
  },
  {
    id: 2, kind: 'sysPrompt', waste: true, tokens: 84, delay: 180,
    label: 'SYSTEM PROMPT',
    lines: [
      'You are Claude, an expert AI assistant…',
      'Always respond helpfully and safely…',
      '// ⚠ sent every single turn — already in context',
    ],
  },
  {
    id: 3, kind: 'history', waste: true, tokens: 340, delay: 340,
    label: 'CHAT HISTORY [turn 1]  ⚠ IRRELEVANT',
    lines: [
      'U: can you explain JWT tokens?',
      'A: JWT (JSON Web Token) is a compact, URL-safe means…',
      '   …[340 tokens — unrelated to current bug fix]',
    ],
  },
  {
    id: 4, kind: 'history', waste: true, tokens: 510, delay: 490,
    label: 'CHAT HISTORY [turn 2]  ⚠ IRRELEVANT',
    lines: [
      'U: how does refresh token work?',
      'A: A refresh token is a long-lived credential used…',
      '   …[510 tokens — unrelated to current bug fix]',
    ],
  },
  {
    id: 5, kind: 'filedump', waste: true, tokens: 890, delay: 640,
    label: 'FILE READ: auth.ts  ⚠ FULL FILE — UNCHANGED',
    lines: [
      '// 214 lines — last changed 3 days ago',
      '// identical to previous call',
      '// 890 tokens wasted — again',
    ],
  },
  {
    id: 6, kind: 'filedump', waste: true, tokens: 620, delay: 780,
    label: 'FILE READ: middleware.ts  ⚠ FULL FILE — UNCHANGED',
    lines: [
      '// 156 lines — no changes detected',
      '// re-sent unchanged — 620 tokens wasted',
    ],
  },
  {
    id: 7, kind: 'duplicate', waste: true, tokens: 84, delay: 900,
    label: 'SYSTEM PROMPT [DUPLICATE]  ⚠⚠',
    lines: [
      'You are Claude, an expert AI assistant…',
      '// exact copy of block already sent above',
      '// 84 tokens — completely redundant',
    ],
  },
  {
    id: 8, kind: 'history', waste: true, tokens: 280, delay: 1020,
    label: 'CHAT HISTORY [turn 3]  ⚠ IRRELEVANT',
    lines: [
      'U: show me the auth flow diagram',
      '   …[280 tokens — not relevant to bug fix]',
    ],
  },
  {
    id: 9, kind: 'filedump', waste: true, tokens: 620, delay: 1120,
    label: 'FILE READ: middleware.ts  ⚠ SENT AGAIN',
    lines: [
      '// same file — third time this session',
      '// 620 tokens — wasted again',
    ],
  },
];

const AFTER_BLOCKS = [
  {
    id: 'a1', label: 'USER INPUT',
    accent: '#00D4FF', tokens: 14,
    lines: ['> Fix the auth bug in /api/login'],
  },
  {
    id: 'a2', label: 'FILE DIFF  [auth.ts, lines 44–67]',
    accent: '#00FF88', tokens: 290,
    lines: ['// only changed lines — 290 tokens', '// (was 890t full file)'],
  },
  {
    id: 'a3', label: 'HISTORY [COMPRESSED SUMMARY]',
    accent: '#9B8FFF', tokens: 729,
    lines: ['// 3 turns → compressed: 729 tokens', '// (was 2,430t raw history)'],
  },
];

const BEFORE_TOTAL = BLOCKS.reduce((s, b) => s + b.tokens, 0);
const AFTER_TOTAL  = AFTER_BLOCKS.reduce((s, b) => s + b.tokens, 0);
const REDUCTION    = Math.round((1 - AFTER_TOTAL / BEFORE_TOTAL) * 100);

/* ─── Token bar ──────────────────────────────────────────────────────── */
function TokenBar({ before, after, active }: { before: number; after: number; active: boolean }) {
  const pct = active ? Math.round((after / before) * 100) : 100;
  return (
    <div style={{ position: 'relative', height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
      <motion.div
        animate={{ width: `${pct}%` }}
        initial={{ width: '100%' }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: 'absolute', left: 0, top: 0, height: '100%',
          borderRadius: 3,
          background: active
            ? 'linear-gradient(90deg, #00FF88, #00D4FF)'
            : 'linear-gradient(90deg, rgba(255,80,80,0.6), rgba(255,140,60,0.5))',
          transition: 'background 0.3s',
        }}
      />
    </div>
  );
}

/* ─── Snap counter ───────────────────────────────────────────────────── */
function SnapNum({ to, active, color, suffix = '' }: { to: number; active: boolean; color: string; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ran = useRef(false);
  useEffect(() => {
    if (!active || ran.current) return;
    ran.current = true;
    const steps = 16;
    for (let i = 1; i <= steps; i++) {
      setTimeout(() => setVal(Math.round(to * i / steps)), i * 20);
    }
  }, [active, to]);
  return (
    <span style={{ fontFamily: "'Space Mono', monospace", color, fontVariantNumeric: 'tabular-nums' }}>
      {val.toLocaleString()}{suffix}
    </span>
  );
}

/* ─── BEFORE block row ───────────────────────────────────────────────── */
function BeforeBlock({ block, visible, snapping }: { block: Block; visible: boolean; snapping: boolean }) {
  const isWaste = block.waste;
  const isSysOrDup = block.kind === 'sysPrompt' || block.kind === 'duplicate';

  const isFiledump = block.kind === 'filedump';
  const borderColor = !isWaste
    ? 'rgba(0,212,255,0.5)'
    : isSysOrDup ? 'rgba(255,40,40,0.75)' : 'rgba(255,110,30,0.6)';
  const bgColor = !isWaste
    ? 'rgba(0,212,255,0.04)'
    : isSysOrDup ? 'rgba(255,20,20,0.08)' : isFiledump ? 'rgba(255,80,10,0.06)' : 'rgba(255,40,10,0.055)';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={block.id}
          initial={{ opacity: 0, scaleY: 0, height: 0, marginBottom: 0 }}
          animate={
            snapping
              ? { opacity: 0, scaleY: 0, height: 0, marginBottom: 0, x: 16, filter: 'blur(1px)' }
              : { opacity: 1, scaleY: 1, height: 'auto', marginBottom: 4 }
          }
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={
            snapping
              ? { duration: 0.06, ease: [0.9, 0, 1, 1] }
              : { duration: 0.15, ease: [0.16, 1, 0.3, 1] }
          }
          style={{ transformOrigin: 'top', overflow: 'hidden' }}
        >
          <div style={{
            background: bgColor,
            border: `1px solid ${isWaste ? (isSysOrDup ? 'rgba(255,40,40,0.2)' : 'rgba(255,100,30,0.15)') : 'rgba(0,212,255,0.08)'}`,
            borderLeft: `2px solid ${borderColor}`,
            borderRadius: 3,
            padding: '6px 10px',
            fontFamily: "'Space Mono', monospace",
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 3,
            }}>
              <span style={{
                fontSize: 6, letterSpacing: '0.16em', textTransform: 'uppercase',
                color: isWaste ? (isSysOrDup ? 'rgba(255,80,60,0.85)' : 'rgba(255,120,60,0.75)') : 'rgba(0,212,255,0.6)',
                textDecoration: snapping ? 'line-through' : 'none',
                textDecorationColor: 'rgba(255,60,40,0.8)',
              }}>{block.label}</span>
              <span style={{
                fontSize: 6, letterSpacing: '0.08em',
                color: isWaste ? 'rgba(255,80,60,0.55)' : 'rgba(0,212,255,0.35)',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {isWaste ? `${block.tokens}t WASTED` : `${block.tokens}t`}
              </span>
            </div>
            {block.lines.map((l, i) => (
              <div key={i} style={{
                fontSize: 7.5, lineHeight: 1.55,
                color: isWaste ? (isSysOrDup ? 'rgba(255,110,90,0.5)' : 'rgba(255,140,80,0.45)') : 'rgba(180,230,255,0.8)',
                whiteSpace: 'pre-wrap',
                textDecoration: snapping ? 'line-through' : 'none',
                textDecorationColor: 'rgba(255,60,40,0.7)',
              }}>{l}</div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Main TransformSection ──────────────────────────────────────────── */
/* ─── TERM LINES (module-level so useCallback closure is stable) ─────── */
const TERM_LINES = [
  '$ npx super-saver init',
  '',
  '  ✓ hook registered: UserPromptSubmit',
  '  ✓ context diffing: enabled',
  '  ✓ history compression: active',
  '  ✓ duplicate detection: on',
  '',
  '  ready. saving tokens on every prompt.',
];

const INSTALL_LINES = [
  '$ cd your-project',
  '$ npx github:siddhantsrivastava7-pixel/super-saver',
];

/* ─── Unstable number — flickers randomly before optimization ────────── */
function UnstableNum({ base, active, color }: { base: number; active: boolean; color: string }) {
  const [disp, setDisp] = useState(base);
  useEffect(() => {
    if (active) { setDisp(base); return; }
    const id = setInterval(() => {
      setDisp(base + Math.floor((Math.random() - 0.5) * base * 0.08));
    }, 180);
    return () => clearInterval(id);
  }, [active, base]);
  return (
    <span style={{ fontFamily: "'Space Mono', monospace", color, fontVariantNumeric: 'tabular-nums' }}>
      {disp.toLocaleString()}
    </span>
  );
}


/* ─── Story Spine — vertical thread that ties the sequence together ───── */
function StorySpine({ phase }: { phase: string }) {
  const isHot    = ['intercept','hookReveal','scan','collapse'].includes(phase);
  const isClean  = ['after','terminal','install','metrics'].includes(phase);
  const color    = isClean ? 'rgba(0,255,136,' : 'rgba(0,212,255,';
  const base     = isHot ? 0.55 : isClean ? 0.45 : 0.15;
  const glow     = isHot ? 0.35 : isClean ? 0.25 : 0.0;
  return (
    <div style={{
      position: 'absolute', left: -28, top: 0, bottom: 0,
      width: 1,
      background: `linear-gradient(180deg, transparent 0%, ${color}${base}) 20%, ${color}${base}) 80%, transparent 100%)`,
      boxShadow: glow > 0 ? `0 0 8px ${color}${glow})` : 'none',
      transition: 'background 0.6s ease, box-shadow 0.6s ease',
      pointerEvents: 'none',
    }}>
      {/* Travelling pulse dot */}
      <motion.div
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: isHot ? 2.5 : 5, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute', left: -2, width: 5, height: 5,
          borderRadius: '50%',
          background: isClean ? '#00FF88' : '#00D4FF',
          boxShadow: `0 0 8px ${isClean ? '#00FF88' : '#00D4FF'}`,
          opacity: phase === 'idle' ? 0.2 : 0.7,
        }}
      />
    </div>
  );
}

/* ─── Section connector — energy trace between hero and transform ──────── */
function SectionTrace({ from, to, opacity = 0.18 }: { from: string; to: string; opacity?: number }) {
  return (
    <div style={{ position: 'relative', height: 60, overflow: 'hidden', pointerEvents: 'none' }}>
      {/* Centre line */}
      <div style={{
        position: 'absolute', left: '50%', top: 0, bottom: 0,
        width: 1, transform: 'translateX(-50%)',
        background: `linear-gradient(180deg, transparent, rgba(0,212,255,${opacity}), transparent)`,
      }} />
      {/* Travelling bead */}
      <motion.div
        animate={{ top: ['-4px', '64px'] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.2 }}
        style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          width: 4, height: 4, borderRadius: '50%',
          background: `rgba(0,212,255,${opacity * 2.5})`,
          boxShadow: `0 0 6px rgba(0,212,255,${opacity * 2})`,
        }}
      />
    </div>
  );
}
/* ─── Main TransformSection ──────────────────────────────────────────── */
function TransformSection() {
  const [phase, setPhase]         = useState<TxPhase>('idle');
  const [visible, setVisible]     = useState<Set<number>>(new Set());
  const [snapping, setSnapping]   = useState<Set<number>>(new Set());
  const [scanPct, setScanPct]     = useState(0);
  const [termLines, setTermLines]       = useState<string[]>([]);
  const [termDone, setTermDone]         = useState(false);
  const [installLines, setInstallLines] = useState<string[]>([]);
  const [installDone, setInstallDone]   = useState(false);
  const [showGlow, setShowGlow]         = useState(false);
  const [metricsLatch, setMetricsLatch] = useState(false);
  const [showActivate, setShowActivate]   = useState(false);
  const installRef = useRef<HTMLDivElement>(null);

  const sectionRef = useRef<HTMLDivElement>(null);
  const hasRun     = useRef(false);
  const cancelRef  = useRef(false);
  const runRef     = useRef<() => void>(null!);

  /* derived booleans */
  const isAfter    = ['after', 'terminal', 'install', 'metrics'].includes(phase);
  const isMetrics  = metricsLatch || phase === 'metrics' || phase === 'install';
  const isTerminal = phase === 'terminal' || phase === 'install' || phase === 'metrics';
  const isInstall  = phase === 'install' || phase === 'metrics';
  const isHook     = phase === 'intercept' || phase === 'hookReveal';
  const isScan     = phase === 'scan';
  const isBefore   = !isAfter && phase !== 'idle';

  /* token counter for before-state header */
  const runningTokens = BLOCKS
    .filter(b => visible.has(b.id) && !snapping.has(b.id))
    .reduce((s, b) => s + b.tokens, 0);

  /* ── sequence ── */
  const run = useCallback(async () => {
    const go = () => !cancelRef.current;

    // reset state fully (handles replay)
    setVisible(new Set());
    setSnapping(new Set());
    setScanPct(0);
    setTermLines([]);
    setTermDone(false);
    setInstallLines([]);
    setInstallDone(false);
    setMetricsLatch(false);
    setShowActivate(false);
    setShowGlow(false);

    /* 1 ── BUILDUP: blocks appear one by one */
    setPhase('buildup');
    const delays = BLOCKS.map(b => b.delay);
    for (let i = 0; i < BLOCKS.length; i++) {
      if (!go()) return;
      const wait = i === 0 ? 0 : delays[i] - delays[i - 1];
      await sleep(wait);
      if (!go()) return;
      const id = BLOCKS[i].id;
      setVisible(prev => new Set([...prev, id]));
    }

    /* 2 ── PAUSE: hold on the mess */
    await sleep(480);
    if (!go()) return;
    setPhase('pause');
    await sleep(260);

    /* 3 ── INTERCEPT: hook fires */
    if (!go()) return;
    setPhase('intercept');
    await sleep(220);

    /* 4 ── HOOK REVEAL: hold so user reads */
    if (!go()) return;
    setPhase('hookReveal');
    await sleep(680);

    /* 5 ── SCAN LINE: fast sweep ~300ms */
    if (!go()) return;
    setPhase('scan');
    const STEPS = 30;
    for (let i = 0; i <= STEPS; i++) {
      if (!go()) return;
      setScanPct(Math.round((i / STEPS) * 100));
      await sleep(300 / STEPS);
    }
    await sleep(60);

    /* 6 ── COLLAPSE: waste blocks snap-delete */
    if (!go()) return;
    setPhase('collapse');
    setSnapping(new Set(BLOCKS.filter(b => b.waste).map(b => b.id)));
    await sleep(320);

    /* 7 -- AFTER: clean state */
    if (!go()) return;
    setPhase('after');
    await sleep(400);
    /* 7b -- GLOW SWEEP: completion signal */
    if (!go()) return;
    setShowGlow(true);
    await sleep(600);

    /* 8 ── TERMINAL: type in lines */
    if (!go()) return;
    setPhase('terminal');
    for (let i = 0; i < TERM_LINES.length; i++) {
      if (!go()) return;
      const line = TERM_LINES[i];
      setTermLines(prev => [...prev, line]);
      await sleep(line === '' ? 70 : line.startsWith('$') ? 120 : 90);
    }
    await sleep(280);
    if (!go()) return;
    setTermDone(true);
    await sleep(360);

    /* 9 -- METRICS: numbers snap in */
    if (!go()) return;
    setPhase('metrics');
    setMetricsLatch(true);
    setShowActivate(true);
    await sleep(700);
    /* 10 -- INSTALL: Claude Code install moment */
    if (!go()) return;
    setPhase('install');
    for (let i = 0; i < INSTALL_LINES.length; i++) {
      if (!go()) return;
      const iline = INSTALL_LINES[i];
      setInstallLines(prev => [...prev, iline]);
      const iDelay = iline.startsWith('$') ? 160 : 80;
      await sleep(iDelay);
    }
    await sleep(320);
    if (!go()) return;
    setInstallDone(true);
    await sleep(400);
    if (!go()) return;
    setShowActivate(true);
  }, []);

  // keep a stable ref so the observer callback can call it without stale closure
  runRef.current = run;

  useEffect(() => {
    cancelRef.current = false;

    const obs = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !hasRun.current) {
          hasRun.current = true;
          // small delay so page has painted
          setTimeout(() => {
            cancelRef.current = false;
            runRef.current();
          }, 120);
        }
      },
      { threshold: 0.05 }
    );

    if (sectionRef.current) obs.observe(sectionRef.current);

    return () => {
      obs.disconnect();
      cancelRef.current = true;
      // don't reset hasRun here — we only want it to play once per mount
    };
  }, []); // empty dep — intentional, using runRef

  /* ── replay handler ── */
  const replay = useCallback(() => {
    cancelRef.current = false;
    hasRun.current    = true;
    run();
  }, [run]);

  return (
    <section
      ref={sectionRef}
      style={{
        position: 'relative', zIndex: 1,
        padding: '5rem 2rem 6rem',
        maxWidth: 980, margin: '0 auto',
        transition: 'background 1.2s ease',
        background: isAfter ? 'radial-gradient(ellipse at 50% 60%, rgba(0,255,136,0.018) 0%, transparent 70%)' : 'transparent',
      }}
    >
      {/* ── Story spine — vertical narrative thread ── */}
      <StorySpine phase={phase} />

      {/* ── Divider ── */}
      <div style={{
        height: 1,
        background: `linear-gradient(90deg, transparent, ${CYAN}28, transparent)`,
        marginBottom: '4rem',
      }} />

      {/* ── Heading ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}
      >
        <div>
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 7, letterSpacing: '0.28em', color: CYAN2,
            textTransform: 'uppercase', marginBottom: '0.6rem',
          }}>WHAT HAPPENS EVERY PROMPT</div>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2rem, 3.8vw, 3.1rem)',
            fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.05,
            color: '#EAF4FF', margin: 0,
          }}>
            Every prompt leaks tokens.{' '}
            <span style={{ fontStyle: 'italic', color: CYAN2 }}>We stop it.</span>
          </h2>
        </div>
        {/* Replay button — appears once sequence finishes */}
        {isMetrics && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={replay}
            style={{
              background: 'transparent',
              border: '1px solid rgba(0,212,255,0.2)',
              borderRadius: 3,
              padding: '6px 14px',
              fontFamily: "'Space Mono', monospace",
              fontSize: 7, letterSpacing: '0.18em',
              color: 'rgba(0,212,255,0.45)',
              cursor: 'pointer',
              textTransform: 'uppercase',
              flexShrink: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,212,255,0.5)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(0,212,255,0.2)')}
          >
            ↺ replay
          </motion.button>
        )}
      </motion.div>

      {/* ════════════════════════════════════════
          MAIN STAGE
      ════════════════════════════════════════ */}
      <div style={{
        background: 'rgba(2,4,8,0.99)',
        border: `1px solid ${isAfter ? 'rgba(0,255,136,0.18)' : phase === 'idle' ? 'rgba(0,212,255,0.06)' : 'rgba(255,70,50,0.14)'}`,
        borderRadius: 6,
        overflow: 'hidden',
        position: 'relative',
        transition: 'border-color 0.5s, box-shadow 0.5s',
        boxShadow: isAfter
          ? `0 0 70px rgba(0,255,136,0.08), 0 0 1px rgba(0,255,136,0.3)`
          : `0 0 40px rgba(0,0,0,0.8)`,
      }}>

        {/* ── Title bar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 14px',
          borderBottom: `1px solid rgba(255,255,255,0.035)`,
          background: 'rgba(1,2,5,0.98)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {['rgba(255,95,87,0.7)', 'rgba(255,189,46,0.7)', 'rgba(39,201,63,0.7)'].map(c => (
              <div key={c} style={{ width: 7, height: 7, borderRadius: '50%', background: c }} />
            ))}
            <span style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 7, letterSpacing: '0.14em',
              color: 'rgba(0,212,255,0.2)', marginLeft: 8,
            }}>claude_code — context_pipeline</span>
          </div>
          <AnimatePresence mode="wait">
            {isAfter ? (
              <motion.span key="opt"
                initial={{ opacity: 0, x: 4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                style={{ fontFamily: "'Space Mono', monospace", fontSize: 7, letterSpacing: '0.18em', color: GREEN }}
              >● OPTIMIZED</motion.span>
            ) : (
              <motion.span key="raw"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: phase === 'pause'
                    ? [1, 0.05, 1, 0.1, 1, 0.05, 1]
                    : isBefore ? 1 : 0.3,
                }}
                transition={{ duration: phase === 'pause' ? 0.28 : 0.15 }}
                exit={{ opacity: 0, transition: { duration: 0.08 } }}
                style={{ fontFamily: "'Space Mono', monospace", fontSize: 7, letterSpacing: '0.18em', color: 'rgba(255,70,50,0.7)' }}
              >● UNOPTIMIZED</motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* ── Hook intercept banner ── */}
        <AnimatePresence>
          {isHook && (
            <motion.div
              key="hookbar"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0, transition: { duration: 0.1 } }}
              transition={{ duration: 0.1 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{
                padding: '7px 14px',
                background: 'rgba(0,212,255,0.055)',
                borderBottom: '1px solid rgba(0,212,255,0.14)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                {/* Pulse dot */}
                <motion.div
                  animate={phase === 'intercept'
                    ? { opacity: [1, 0.1, 1, 0.1, 1], scale: [1, 1.3, 1, 1.3, 1] }
                    : { opacity: 1 }
                  }
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                  style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: CYAN,
                    boxShadow: `0 0 8px ${CYAN}, 0 0 16px ${CYAN}88`,
                    flexShrink: 0,
                  }}
                />
                <span style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 9, letterSpacing: '0.1em',
                  color: 'rgba(0,212,255,0.6)',
                }}>
                  Hook:{' '}
                  <span style={{ color: 'rgba(220,240,255,0.88)', fontWeight: 600 }}>UserPromptSubmit</span>
                  {' '}
                  <span style={{ color: 'rgba(0,212,255,0.45)' }}>intercepted</span>
                </span>
                {phase === 'hookReveal' && (
                  <motion.div
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.12 }}
                    style={{
                      marginLeft: 'auto',
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 7, letterSpacing: '0.16em',
                      color: 'rgba(0,255,136,0.6)',
                    }}
                  >
                    analyzing context →
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Scan line ── */}
        <AnimatePresence>
          {isScan && (
            <motion.div
              key="scanline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.06 } }}
              style={{
                position: 'absolute',
                top: `${30 + scanPct * 0.68}%`,
                left: 0, right: 0,
                height: 2,
                zIndex: 30,
                pointerEvents: 'none',
                background: `linear-gradient(90deg,
                  transparent 0%,
                  ${CYAN}22 5%,
                  ${CYAN}ee 25%,
                  ${CYAN} 50%,
                  ${CYAN}ee 75%,
                  ${CYAN}22 95%,
                  transparent 100%
                )`,
                boxShadow: `0 0 8px ${CYAN}cc, 0 0 22px ${CYAN}88, 0 0 40px ${CYAN}33`,
              }}
            />
          )}
        </AnimatePresence>

        {/* -- Completion glow sweep -- */}
        {showGlow && (
          <motion.div
            key="glow"
            initial={{ top: '30px', opacity: 0 }}
            animate={{ top: '100%', opacity: [0, 0.9, 0] }}
            transition={{ duration: 0.55, ease: 'easeInOut' }}
            style={{
              position: 'absolute', left: 0, right: 0, height: 80,
              zIndex: 25, pointerEvents: 'none',
              background: 'linear-gradient(180deg, transparent 0%, rgba(0,255,136,0.07) 40%, rgba(0,212,255,0.04) 70%, transparent 100%)',
              filter: 'blur(6px)',
            }}
          />
        )}

        {/* -- Content area -- */}
        <div style={{
          padding: '14px 14px 12px',
          minHeight: 340,
          position: 'relative',
          /* red tint overlay during before state */
          background: isBefore && !isAfter
            ? 'linear-gradient(180deg, rgba(255,40,20,0.018) 0%, transparent 100%)'
            : undefined,
          transition: 'background 0.4s',
        }}>
          <AnimatePresence mode="wait">
            {!isAfter ? (
              /* ════ BEFORE STATE ════ */
              <motion.div
                key="before-panel"
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
              >
                {/* Row label */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  marginBottom: 10,
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 6.5, letterSpacing: '0.2em', textTransform: 'uppercase',
                }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,80,50,0.7)' }} />
                  <span style={{ color: 'rgba(255,80,50,0.5)' }}>Without Super Saver</span>
                  {phase === 'pause' && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0.4, 1] }}
                      transition={{ duration: 0.3 }}
                      style={{ color: 'rgba(255,60,40,0.7)', marginLeft: 6 }}
                    >
                      ⚠ {runningTokens.toLocaleString()}t — {BLOCKS.filter(b => b.waste && visible.has(b.id)).length} wasteful blocks
                    </motion.span>
                  )}
                </div>

                {/* Blocks */}
                {BLOCKS.map(b => (
                  <BeforeBlock
                    key={b.id}
                    block={b}
                    visible={visible.has(b.id)}
                    snapping={snapping.has(b.id)}
                  />
                ))}

                {/* Running total — twitches before optimization */}
                {visible.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      marginTop: 8, paddingTop: 8,
                      borderTop: '1px solid rgba(255,50,30,0.1)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      fontFamily: "'Space Mono', monospace",
                    }}
                  >
                    <span style={{ fontSize: 6.5, letterSpacing: '0.14em', color: 'rgba(255,80,50,0.38)' }}>
                      CONTEXT WINDOW USAGE
                    </span>
                    <UnstableNum
                      base={runningTokens}
                      active={false}
                      color="rgba(255,80,60,0.75)"
                    />
                  </motion.div>
                )}
              </motion.div>
            ) : (
              /* ════ AFTER STATE ════ */
              <motion.div
                key="after-panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.18 }}
              >
                {/* Row label */}
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.14 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    marginBottom: 10,
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 6.5, letterSpacing: '0.2em', textTransform: 'uppercase',
                  }}
                >
                  <motion.div
                    animate={{ boxShadow: [`0 0 3px ${GREEN}`, `0 0 10px ${GREEN}`, `0 0 3px ${GREEN}`] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ width: 4, height: 4, borderRadius: '50%', background: GREEN }}
                  />
                  <span style={{ color: 'rgba(0,255,136,0.6)' }}>With Super Saver</span>
                </motion.div>

                {/* Clean blocks */}
                {AFTER_BLOCKS.map((b, i) => (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                    style={{ marginBottom: 5 }}
                  >
                    <div style={{
                      background: 'rgba(0,255,136,0.02)',
                      border: `1px solid ${b.accent}18`,
                      borderLeft: `2px solid ${b.accent}`,
                      borderRadius: 3,
                      padding: '7px 10px',
                      fontFamily: "'Space Mono', monospace",
                    }}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        fontSize: 6, letterSpacing: '0.16em', textTransform: 'uppercase',
                        color: `${b.accent}88`, marginBottom: 4,
                      }}>
                        <span>{b.label}</span>
                        <span style={{ color: GREEN }}>{b.tokens}t</span>
                      </div>
                      {b.lines.map((l, j) => (
                        <div key={j} style={{
                          fontSize: 7.5, lineHeight: 1.55,
                          color: 'rgba(160,235,210,0.7)',
                          whiteSpace: 'pre',
                        }}>{l}</div>
                      ))}
                    </div>
                  </motion.div>
                ))}

                {/* Token bar */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.28 }}
                  style={{ marginTop: 12 }}
                >
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 6.5, letterSpacing: '0.1em',
                    marginBottom: 6,
                  }}>
                    <span style={{ color: 'rgba(255,80,50,0.4)' }}>
                      before: {BEFORE_TOTAL.toLocaleString()}t
                    </span>
                    <span style={{ color: GREEN, fontWeight: 600 }}>
                      after: {AFTER_TOTAL}t &nbsp;↓ {REDUCTION}%
                    </span>
                  </div>
                  <TokenBar before={BEFORE_TOTAL} after={AFTER_TOTAL} active />
                </motion.div>

                {/* Clarity line */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  style={{
                    marginTop: 14,
                    textAlign: 'center',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13, letterSpacing: '0.01em',
                    color: 'rgba(180,230,220,0.45)',
                    fontStyle: 'italic',
                  }}
                >
                  Same work. 70% fewer tokens.
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Bottom status bar ── */}
        <div style={{
          padding: '6px 14px',
          borderTop: `1px solid rgba(255,255,255,0.03)`,
          background: 'rgba(1,2,5,0.98)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 6.5, letterSpacing: '0.12em',
            color: 'rgba(0,212,255,0.18)',
          }}>SUPER_SAVER v2.4.1</span>
          <AnimatePresence mode="wait">
            {isAfter ? (
              <motion.span key="done"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ fontFamily: "'Space Mono', monospace", fontSize: 6.5, letterSpacing: '0.14em', color: GREEN }}>
                ● OPTIMIZATION COMPLETE
              </motion.span>
            ) : isScan ? (
              <motion.span key="scan"
                animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.25, repeat: Infinity }}
                style={{ fontFamily: "'Space Mono', monospace", fontSize: 6.5, letterSpacing: '0.14em', color: CYAN }}>
                ● SCANNING
              </motion.span>
            ) : phase === 'collapse' ? (
              <motion.span key="collapse"
                animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.14, repeat: Infinity }}
                style={{ fontFamily: "'Space Mono', monospace", fontSize: 6.5, letterSpacing: '0.14em', color: CYAN }}>
                ● COMPRESSING
              </motion.span>
            ) : isBefore ? (
              <motion.span key="intercepting"
                style={{ fontFamily: "'Space Mono', monospace", fontSize: 6.5, letterSpacing: '0.14em', color: 'rgba(0,212,255,0.25)' }}>
                ● INTERCEPTING
              </motion.span>
            ) : (
              <motion.span key="idle"
                style={{ fontFamily: "'Space Mono', monospace", fontSize: 6.5, letterSpacing: '0.14em', color: 'rgba(0,212,255,0.15)' }}>
                ● WAITING
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ════ INVISIBLE LAYER NOTE ════ */}
      <motion.div
        animate={isAfter ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
        initial={{ opacity: 0, y: 6 }}
        transition={{ duration: 0.22, delay: 0.15 }}
        style={{
          marginTop: 10,
          padding: '8px 16px',
          background: 'rgba(0,212,255,0.02)',
          border: '1px solid rgba(0,212,255,0.07)',
          borderRadius: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          fontFamily: "'Space Mono', monospace",
          fontSize: 7, letterSpacing: '0.15em',
          color: 'rgba(0,212,255,0.28)',
          textTransform: 'uppercase',
          pointerEvents: 'none',
        }}
      >
        <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(0,212,255,0.3)' }} />
        Claude interface unchanged — optimization happens underneath
        <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(0,212,255,0.3)' }} />
      </motion.div>

      {/* ════ TERMINAL BLOCK ════ */}
      <AnimatePresence>
        {isTerminal && (
          <motion.div
            key="terminal"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ marginTop: 16 }}
          >
            <div style={{
              background: 'rgba(1,2,5,0.99)',
              border: `1px solid ${termDone ? 'rgba(0,255,136,0.28)' : 'rgba(0,212,255,0.1)'}`,
              borderRadius: 6, overflow: 'hidden',
              transition: 'border-color 0.3s, box-shadow 0.4s',
              boxShadow: termDone
                ? `0 0 50px rgba(0,255,136,0.1), 0 0 100px rgba(0,255,136,0.04), inset 0 0 30px rgba(0,255,136,0.015)`
                : `0 0 20px rgba(0,0,0,0.6)`,
            }}>
              {/* Terminal titlebar */}
              <div style={{
                padding: '7px 12px',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                background: 'rgba(0,1,4,0.98)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {['rgba(255,95,87,0.65)', 'rgba(255,189,46,0.65)', 'rgba(39,201,63,0.65)'].map(c => (
                  <div key={c} style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />
                ))}
                <span style={{
                  marginLeft: 8,
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 7, letterSpacing: '0.14em',
                  color: 'rgba(0,212,255,0.18)',
                }}>terminal — super_saver</span>
                {termDone && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.12 }}
                    style={{
                      marginLeft: 'auto',
                      display: 'flex', alignItems: 'center', gap: 5,
                      background: 'rgba(0,255,136,0.07)',
                      border: '1px solid rgba(0,255,136,0.22)',
                      borderRadius: 3, padding: '2px 9px',
                    }}
                  >
                    <motion.div
                      animate={{ boxShadow: [`0 0 3px ${GREEN}`, `0 0 9px ${GREEN}`, `0 0 3px ${GREEN}`] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                      style={{ width: 4, height: 4, borderRadius: '50%', background: GREEN }}
                    />
                    <span style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 6.5, letterSpacing: '0.2em', color: GREEN,
                    }}>READY</span>
                  </motion.div>
                )}
              </div>

              {/* Terminal body */}
              <div style={{ padding: '14px 18px 16px', fontFamily: "'Space Mono', monospace" }}>
                {termLines.map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -3 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.08 }}
                    style={{
                      fontSize: line.startsWith('$') ? 12 : 9,
                      lineHeight: line === '' ? 0.5 : 1.75,
                      color: line.startsWith('$')
                        ? 'rgba(220,240,255,0.92)'
                        : line.includes('✓')
                        ? 'rgba(0,255,136,0.72)'
                        : line.includes('ready')
                        ? 'rgba(0,255,136,0.88)'
                        : 'rgba(120,170,190,0.45)',
                      fontWeight: line.startsWith('$') ? 600 : 400,
                      letterSpacing: line.startsWith('$') ? '0.01em' : '0.05em',
                      marginBottom: line === '' ? 3 : 0,
                    }}
                  >{line || '\u00A0'}</motion.div>
                ))}
                {!termDone && (
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.55, repeat: Infinity }}
                    style={{
                      display: 'inline-block',
                      width: 6, height: 11,
                      background: CYAN,
                      verticalAlign: 'middle', marginLeft: 1,
                    }}
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* METRICS ROW */}
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8, opacity: metricsLatch ? 1 : 0, transform: metricsLatch ? 'translateY(0)' : 'translateY(12px)', transition: 'opacity 0.18s ease, transform 0.18s ease' }}>

        {/* Hero tile */}
        <div
          style={{
            background: 'rgba(2,4,8,0.99)',
            border: '1px solid rgba(0,255,136,0.2)',
            borderTop: '2px solid #00FF88',
            borderRadius: 4, padding: '18px 22px',
            fontFamily: "'Space Mono', monospace",
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: metricsLatch ? '0 0 40px rgba(0,255,136,0.08)' : 'none',
          }}
        >
          <div>
            <div style={{
              fontSize: 7, letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'rgba(0,255,136,0.4)', marginBottom: 6,
            }}>Token Reduction</div>
            <div style={{
              fontSize: 'clamp(2.8rem, 5vw, 3.6rem)',
              fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1,
              color: '#00FF88',
            }}>
              {'-'}<SnapNum to={REDUCTION} active={metricsLatch} color="#00FF88" suffix="%" />
            </div>
          </div>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13, color: 'rgba(0,255,136,0.3)',
            fontStyle: 'italic', maxWidth: 160, textAlign: 'right', lineHeight: 1.5,
          }}>
            Same work.<br />Fewer tokens.
          </div>
        </div>

        {/* Secondary tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {([
            { label: 'Tokens saved',     value: BEFORE_TOTAL - AFTER_TOTAL, suffix: '',   color: CYAN },
            { label: 'Blocks collapsed', value: BLOCKS.filter(b => b.waste).length, suffix: '', color: CYAN2 },
            { label: 'Latency added',    value: 14, suffix: 'ms', color: 'rgba(160,180,255,0.75)' },
          ] as const).map((m, i) => (
            <div
              key={m.label}
              style={{
                background: 'rgba(2,4,8,0.99)',
                border: `1px solid ${m.color}10`,
                borderTop: `1px solid ${m.color}44`,
                borderRadius: 3, padding: '10px 12px',
                fontFamily: "'Space Mono', monospace",
              }}
            >
              <div style={{
                fontSize: 'clamp(1.2rem, 2.2vw, 1.7rem)',
                fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 5,
              }}>
                <SnapNum to={m.value} active={metricsLatch} color={m.color} suffix={m.suffix} />
              </div>
              <div style={{
                fontSize: 6.5, letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'rgba(110,155,175,0.35)', lineHeight: 1.4,
              }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Relief trace — guides eye from metrics to CTA ── */}
      <AnimatePresence>
        {metricsLatch && (
          <motion.div
            key="relief-trace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              marginTop: 28, pointerEvents: 'none',
            }}
          >
            <motion.div
              animate={{ height: [0, 32, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.8 }}
              style={{
                width: 1,
                background: 'linear-gradient(180deg, rgba(0,255,136,0.25), transparent)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DECISION MOMENT ── */}
      <AnimatePresence>
        {showActivate && (
          <motion.div
            key="decision"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ marginTop: 40, display: 'flex', justifyContent: 'center' }}
          >
            <ActivateCTA onClick={() => installRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Guide trace to install ── */}
      <AnimatePresence>
        {showActivate && (
          <motion.div
            key="guide-trace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 20, pointerEvents: 'none' }}
          >
            <div style={{
              width: 1, height: 28,
              background: 'linear-gradient(180deg, rgba(0,255,136,0.2), rgba(0,212,255,0.1))',
            }} />
            <div style={{
              width: 0, height: 0,
              borderLeft: '3px solid transparent',
              borderRight: '3px solid transparent',
              borderTop: '4px solid rgba(0,212,255,0.18)',
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* INSTALL MOMENT */}
      <div ref={installRef} id="install-section" style={{ scrollMarginTop: 80 }} />
      {isInstall && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginTop: 16 }}
        >
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 7, letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'rgba(0,212,255,0.35)', marginBottom: 8,
          }}>Claude Code</div>

          <InstallTerminal installDone={installDone} installLines={installLines} />

          {/* Reassurance */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isInstall ? 1 : 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            style={{ marginTop: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
          >
            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 7, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'rgba(110,150,170,0.28)',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <span>No new UI</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>No setup</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>No workflow change</span>
            </div>
            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12, letterSpacing: '0.02em',
              color: 'rgba(130,170,190,0.22)',
              fontStyle: 'italic',
            }}>
              It just works.
            </div>
          </motion.div>
        </motion.div>
      )}

    </section>
  );
}


/* ─── Install Terminal ───────────────────────────────────────────────── */
function InstallTerminal({ installDone, installLines }: { installDone: boolean; installLines: string[] }) {
  const [hovered, setHovered] = useState(false);
  const [copied, setCopied]   = useState(false);
  const COPY_TEXT = 'cd your-project\nnpx github:siddhantsrivastava7-pixel/super-saver';

  const handleCopy = () => {
    const succeed = () => { setCopied(true); setTimeout(() => setCopied(false), 3000); };
    try {
      navigator.clipboard.writeText(COPY_TEXT).then(succeed).catch(() => fallback());
    } catch { fallback(); }
    function fallback() {
      const el = document.createElement('textarea');
      el.value = COPY_TEXT;
      el.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(el);
      el.focus(); el.select();
      try { document.execCommand('copy'); succeed(); } catch {}
      document.body.removeChild(el);
    }
  };

  return (
    <div>
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'rgba(1,2,5,0.99)',
        border: `1px solid ${installDone ? 'rgba(0,255,136,0.3)' : hovered ? 'rgba(0,212,255,0.22)' : 'rgba(0,212,255,0.12)'}`,
        borderRadius: 6, overflow: 'hidden',
        transition: 'border-color 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s cubic-bezier(0.22,1,0.36,1)',
        boxShadow: installDone
          ? `0 0 60px rgba(0,255,136,0.12), inset 0 1px 0 rgba(0,255,136,0.05)`
          : hovered
          ? `0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,212,255,0.08), inset 0 1px 0 rgba(0,212,255,0.04)`
          : `0 4px 20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.02)`,
        position: 'relative',
      }}
    >
      {/* Slow gradient drift — scanline feel */}
      <motion.div
        animate={{ backgroundPosition: ['0% 0%', '0% 100%'] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: 'linear-gradient(180deg, transparent 0%, rgba(0,212,255,0.012) 50%, transparent 100%)',
          backgroundSize: '100% 200%',
        }}
      />
      {/* Titlebar */}
      <div style={{
        padding: '7px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)',
        background: 'rgba(0,1,4,0.98)', display: 'flex', alignItems: 'center', gap: 6,
      }}>
        {['rgba(255,95,87,0.65)', 'rgba(255,189,46,0.65)', 'rgba(39,201,63,0.65)'].map(c => (
          <div key={c} style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />
        ))}
        <span style={{
          marginLeft: 8, fontFamily: "'Space Mono', monospace",
          fontSize: 7, letterSpacing: '0.14em', color: 'rgba(0,212,255,0.2)',
        }}>terminal — claude code</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CopyButton hovered={hovered} copied={copied} onCopy={handleCopy} />
          {installDone && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.14 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'rgba(0,255,136,0.07)', border: '1px solid rgba(0,255,136,0.25)',
                borderRadius: 3, padding: '2px 9px',
              }}
            >
              <motion.div
                animate={{ boxShadow: ['0 0 3px #00FF88', '0 0 10px #00FF88', '0 0 3px #00FF88'] }}
                transition={{ duration: 1.1, repeat: Infinity }}
                style={{ width: 4, height: 4, borderRadius: '50%', background: '#00FF88' }}
              />
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 6.5, letterSpacing: '0.18em', color: '#00FF88' }}>
                OPTIMIZATION ACTIVE
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 18px 16px', fontFamily: "'Space Mono', monospace" }}>
        {installLines.map((iline, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -3 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.08 }}
            style={{
              fontSize: iline.startsWith('$') ? 11.5 : 9,
              lineHeight: 1.8,
              color: iline.startsWith('$') ? 'rgba(220,240,255,0.92)' : 'rgba(120,170,190,0.45)',
              fontWeight: iline.startsWith('$') ? 600 : 400,
              letterSpacing: '0.01em',
            }}
          >{iline}</motion.div>
        ))}
        {installDone && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.12, delay: 0.1 }}
            style={{ fontSize: 10, color: '#00FF88', letterSpacing: '0.04em', lineHeight: 1.8, fontWeight: 500 }}
          >
            Hooks installed. Optimization active.
          </motion.div>
        )}
        {!installDone && (
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.55, repeat: Infinity }}
            style={{ display: 'inline-block', width: 6, height: 11, background: CYAN, verticalAlign: 'middle', marginLeft: 1 }}
          />
        )}
      </div>
    </div>

    {/* Copy feedback + next action */}
    <motion.div
      animate={{ opacity: copied ? 1 : 0, y: copied ? 0 : 4 }}
      transition={{ duration: 0.25 }}
      style={{
        marginTop: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        pointerEvents: 'none',
      }}
    >
      <div style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 8, letterSpacing: '0.12em',
        color: 'rgba(0,255,136,0.6)',
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
          <polyline points="1.5,5.5 4,8 8.5,2" stroke="rgba(0,255,136,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Copied
      </div>
      <div style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 7, letterSpacing: '0.08em',
        color: 'rgba(0,212,255,0.3)',
      }}>
        Next: run this inside Claude Code →
      </div>
    </motion.div>
    </div>
  );
}

/* ─── Copy button ────────────────────────────────────────────────────── */
function CopyButton({ hovered, copied, onCopy }: { hovered: boolean; copied: boolean; onCopy: () => void }) {
  const [pressing, setPressing] = useState(false);
  const handleClick = () => {
    setPressing(true);
    setTimeout(() => setPressing(false), 100);
    onCopy();
  };
  return (
    <motion.div
      animate={{
        opacity: hovered || copied ? 1 : 0,
        y: hovered && !copied ? -1 : 0,
        scale: pressing ? 0.96 : 1,
        filter: hovered ? 'drop-shadow(0 0 4px rgba(0,212,255,0.3))' : 'none',
      }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      onClick={handleClick}
      title="Copy commands"
      style={{
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 4,
        fontFamily: "'Space Mono', monospace",
        fontSize: 7, letterSpacing: '0.12em',
        color: copied ? 'rgba(0,255,136,0.7)' : 'rgba(0,212,255,0.55)',
        userSelect: 'none',
        padding: '2px 4px',
      }}
    >
      {copied ? (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <polyline points="1.5,5.5 4,8 8.5,2" stroke="rgba(0,255,136,0.7)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <rect x="3.5" y="1" width="5.5" height="6.5" rx="1" stroke="rgba(0,212,255,0.45)" strokeWidth="1"/>
          <rect x="1" y="3.5" width="5.5" height="6.5" rx="1" stroke="rgba(0,212,255,0.45)" strokeWidth="1" fill="rgba(1,2,5,0.99)"/>
        </svg>
      )}
      <span>{copied ? 'copied' : 'copy'}</span>
    </motion.div>
  );
}

/* ─── Activate CTA ───────────────────────────────────────────────────── */
function ActivateCTA({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const [pressing, setPressing] = useState(false);

  const handleClick = () => {
    setPressing(true);
    setTimeout(() => { setPressing(false); onClick(); }, 120);
  };

  return (
    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* "Turn it on." — blur→sharp on mount */}
      <motion.div
        initial={{ opacity: 0, filter: 'blur(6px)', letterSpacing: '-0.06em' }}
        animate={{ opacity: 1, filter: 'blur(0px)', letterSpacing: '-0.02em' }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(1.4rem, 2.8vw, 2rem)',
          fontWeight: 700, lineHeight: 1.1,
          color: 'rgba(234,244,255,0.55)',
          fontStyle: 'italic',
        }}
      >
        Turn it on.
      </motion.div>

      {/* "Activate Super Saver →" — parallax arrow, click compression */}
      <motion.div
        initial={{ opacity: 0, filter: 'blur(4px)' }}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.45, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ cursor: 'pointer', userSelect: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
      >
        {/* pulse dot */}
        <motion.div
          animate={{ boxShadow: hovered
            ? ['0 0 4px #00FF88', '0 0 18px #00FF88', '0 0 4px #00FF88']
            : ['0 0 2px #00FF8844', '0 0 6px #00FF8844', '0 0 2px #00FF8844']
          }}
          transition={{ duration: 1.4, repeat: Infinity }}
          style={{ width: 5, height: 5, borderRadius: '50%', background: '#00FF88', flexShrink: 0 }}
        />
        {/* label */}
        <motion.span
          animate={{
            x: hovered ? 2 : 0,
            scale: pressing ? 0.97 : 1,
            color: hovered ? 'rgba(0,255,136,0.92)' : 'rgba(0,255,136,0.5)',
            textShadow: hovered ? '0 0 20px rgba(0,255,136,0.3)' : '0 0 0px transparent',
          }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 11, letterSpacing: '0.14em',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}
        >
          Activate Super Saver
          {/* arrow moves slightly more than text */}
          <motion.span
            animate={{ x: hovered ? 4 : 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >→</motion.span>
        </motion.span>
      </motion.div>

      {/* underline — fades in on hover */}
      <motion.div
        animate={{ opacity: hovered ? 1 : 0, scaleX: hovered ? 1 : 0.6 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        style={{
          height: 1, width: 160, marginTop: -8,
          background: 'linear-gradient(90deg, transparent, rgba(0,255,136,0.25), transparent)',
          transformOrigin: 'center',
        }}
      />
    </div>
  );
}

function CTASection() {
  const [, setLocation] = useLocation();

  return (
    <section style={{
      position: 'relative', zIndex: 1,
      padding: '3rem 2rem 8rem',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', textAlign: 'center',
    }}>
      {/* Exhale — end of story, quiet resolution */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '3rem', gap: 0, pointerEvents: 'none' }}>
        <div style={{ width: 1, height: 32, background: 'linear-gradient(180deg, rgba(0,212,255,0.15), transparent)' }} />
        <div style={{ height: 1, width: '100%', maxWidth: 700, background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.1), transparent)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5 }}
        style={{ position: 'relative', maxWidth: 480 }}
      >
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 7, letterSpacing: '0.3em', color: 'rgba(0,212,255,0.25)',
          textTransform: 'uppercase', marginBottom: '1rem',
        }}>SUPER SAVER</div>

        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 15, lineHeight: 1.75,
          color: 'rgba(130,180,200,0.38)',
          margin: '0 0 2rem',
          fontStyle: 'italic',
        }}>
          Drop it into your Claude Code workflow.<br />Token spend drops immediately.
        </p>

        <div
          onClick={() => setLocation('/')}
          style={{
            display: 'inline-block',
            cursor: 'pointer',
            fontFamily: "'Space Mono', monospace",
            fontSize: 8, letterSpacing: '0.16em',
            color: 'rgba(0,212,255,0.25)',
            textTransform: 'uppercase',
          }}
        >
          ← back to projects
        </div>
      </motion.div>

      <div style={{
        position: 'absolute', bottom: '2.5rem',
        fontFamily: "'Space Mono', monospace",
        fontSize: 7, letterSpacing: '0.12em',
        color: 'rgba(0,212,255,0.12)',
      }}>
        SUPER SAVER — A PROJECT BY SID · 2025
      </div>
    </section>
  );
}

/* ─── Floating CTA ───────────────────────────────────────────────────── */
function FloatingCTA({ visible, onClick }: { visible: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      animate={{ opacity: visible ? (hovered ? 0.75 : 0.35) : 0, y: visible ? 0 : 8 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        position: 'fixed', bottom: 28, right: 32, zIndex: 50,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          cursor: 'pointer',
          fontFamily: "'Space Mono', monospace",
          fontSize: 9, letterSpacing: '0.14em',
          color: 'rgba(0,212,255,0.9)',
          userSelect: 'none',
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 14px',
          background: 'rgba(0,8,18,0.88)',
          border: '1px solid rgba(0,212,255,0.1)',
          borderRadius: 3,
          backdropFilter: 'blur(12px)',
          transition: 'border-color 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s cubic-bezier(0.22,1,0.36,1)',
          boxShadow: hovered ? '0 0 20px rgba(0,212,255,0.08), inset 0 1px 0 rgba(0,212,255,0.06)' : 'none',
          borderColor: hovered ? 'rgba(0,212,255,0.2)' : 'rgba(0,212,255,0.1)',
        }}
      >
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(0,212,255,1)', flexShrink: 0 }}
        />
        Run it in Claude Code →
      </div>
    </motion.div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────── */
export default function SuperSaverPage() {
  const [booted, setBooted] = useState(false);
  const [nearInstall, setNearInstall] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => setNearInstall(e.isIntersecting),
      { threshold: 0.1 }
    );
    const interval = setInterval(() => {
      const el = document.getElementById('install-section');
      if (el) { obs.observe(el); clearInterval(interval); }
    }, 200);
    return () => { obs.disconnect(); clearInterval(interval); };
  }, []);

  const scrollToInstall = () => {
    document.getElementById('install-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#040608', overflowX: 'hidden' }}>
      <SystemGrid />
      <BootVeil onDone={() => setBooted(true)} />

      <AnimatePresence>
        {booted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Nav />
            <main>
              <HeroSection />
              <SectionTrace from="hero" to="transform" />
              <TransformSection />
              <CTASection />
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      {booted && <FloatingCTA visible={!nearInstall} onClick={scrollToInstall} />}
    </div>
  );
}
