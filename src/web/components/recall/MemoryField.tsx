import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';

/* ═══════════════════════════════════════════════════════════════════════
   MEMORY FIELD — Living memory system
   ═══════════════════════════════════════════════════════════════════════ */

type FragmentKind = 'link' | 'note' | 'bookmark' | 'snippet';
type FieldPhase   = 'idle' | 'typing' | 'snap' | 'results';

interface Fragment {
  id:       number;
  kind:     FragmentKind;
  title:    string;
  sub:      string;
  tag?:     string;
  bx:       number;
  by:       number;
  z:        number;  // 0–3 depth layer
  size:     'sm' | 'md' | 'lg';
  angle:    number;
  orbitR:   number;
  period:   number;
  phase:    number;
  axis:     number;
  // instability params
  flickerSeed: number;
  flickerRate: number;
}

const FRAGMENTS: Fragment[] = [
  { id:1,  kind:'link',     title:'Stripe Webhooks Guide',        sub:'stripe.com/docs',           tag:'saved 2w ago',  bx:11,  by:20,  z:3, size:'md', angle:-2,  orbitR:9,  period:7800,  phase:0.0,  axis:0.4,  flickerSeed:0.2,  flickerRate:3100 },
  { id:2,  kind:'note',     title:'webhook retry logic',          sub:'you wrote this',            tag:'3 days ago',    bx:74,  by:17,  z:2, size:'sm', angle: 3,  orbitR:11, period:9200,  phase:1.2,  axis:1.1,  flickerSeed:0.7,  flickerRate:4200 },
  { id:3,  kind:'snippet',  title:'verify_signature()',           sub:'Python · 8 lines',          tag:'from GitHub',   bx:7,   by:55,  z:2, size:'md', angle:-1,  orbitR:8,  period:8600,  phase:2.4,  axis:0.7,  flickerSeed:0.4,  flickerRate:3700 },
  { id:4,  kind:'bookmark', title:'Idempotency Keys',             sub:'Stripe best practices',     tag:'bookmarks',     bx:78,  by:60,  z:3, size:'sm', angle: 2,  orbitR:10, period:7200,  phase:0.8,  axis:1.8,  flickerSeed:0.1,  flickerRate:5100 },
  { id:5,  kind:'link',     title:'Next.js API Routes',           sub:'nextjs.org',                tag:'1 month ago',   bx:34,  by:79,  z:0, size:'sm', angle:-3,  orbitR:16, period:13000, phase:3.6,  axis:0.3,  flickerSeed:0.8,  flickerRate:2900 },
  { id:6,  kind:'note',     title:'checkout.session.completed',  sub:'event type to handle',      tag:'quick note',    bx:61,  by:33,  z:2, size:'md', angle: 1,  orbitR:9,  period:8100,  phase:1.9,  axis:2.2,  flickerSeed:0.3,  flickerRate:4800 },
  { id:7,  kind:'snippet',  title:'handleWebhook(req, res)',      sub:'TypeScript · 22 lines',     tag:'from Notion',   bx:84,  by:42,  z:1, size:'sm', angle:-2,  orbitR:14, period:11400, phase:4.1,  axis:1.5,  flickerSeed:0.6,  flickerRate:3400 },
  { id:8,  kind:'bookmark', title:'Webhook Security Checklist',  sub:'Medium · 5 min read',       tag:'5 days ago',    bx:5,   by:37,  z:1, size:'lg', angle: 2,  orbitR:13, period:10600, phase:2.7,  axis:0.9,  flickerSeed:0.5,  flickerRate:6200 },
  { id:9,  kind:'link',     title:'ngrok – Local tunnels',        sub:'ngrok.com',                 tag:'from browser',  bx:50,  by:83,  z:0, size:'sm', angle: 0,  orbitR:18, period:14200, phase:5.2,  axis:2.9,  flickerSeed:0.9,  flickerRate:2600 },
  { id:10, kind:'note',     title:'test with Stripe CLI first',  sub:'important reminder',        tag:'personal note', bx:22,  by:11,  z:1, size:'sm', angle:-1,  orbitR:15, period:12000, phase:0.5,  axis:1.3,  flickerSeed:0.2,  flickerRate:4100 },
  { id:11, kind:'snippet',  title:'STRIPE_WEBHOOK_SECRET',        sub:'env variable name',         tag:'from .env',     bx:63,  by:9,   z:0, size:'sm', angle: 3,  orbitR:19, period:15500, phase:3.0,  axis:2.1,  flickerSeed:0.7,  flickerRate:3300 },
  { id:12, kind:'link',     title:'Zod request validation',       sub:'dev.to article',            tag:'3 weeks ago',   bx:19,  by:71,  z:3, size:'sm', angle:-2,  orbitR:8,  period:7400,  phase:4.8,  axis:0.6,  flickerSeed:0.4,  flickerRate:5500 },
  { id:13, kind:'bookmark', title:'HTTP 200 response spec',       sub:'RFC 7231 reference',        tag:'2w ago',        bx:41,  by:14,  z:1, size:'sm', angle: 1,  orbitR:12, period:9800,  phase:2.1,  axis:1.7,  flickerSeed:0.6,  flickerRate:4700 },
  { id:14, kind:'note',     title:'async queue worker pattern',  sub:'architecture note',         tag:'from Notion',   bx:88,  by:25,  z:0, size:'md', angle:-1,  orbitR:17, period:12800, phase:1.4,  axis:0.8,  flickerSeed:0.3,  flickerRate:3900 },
  { id:15, kind:'snippet',  title:'wh.on("payment_intent")',      sub:'Node.js · 14 lines',        tag:'from repo',     bx:28,  by:43,  z:2, size:'sm', angle: 2,  orbitR:10, period:8300,  phase:3.8,  axis:2.5,  flickerSeed:0.8,  flickerRate:4400 },
];

const RELEVANT = new Set([1, 2, 3, 4, 6, 7, 8]);

const KIND_STYLE: Record<FragmentKind, { accent: string; dot: string; label: string }> = {
  link:     { accent: 'rgba(100,178,240,0.92)',  dot: '#64B2F0', label: 'LINK'     },
  note:     { accent: 'rgba(175,142,245,0.92)',  dot: '#AF8EF5', label: 'NOTE'     },
  bookmark: { accent: 'rgba(122,224,210,0.92)',  dot: '#7AE0D2', label: 'BOOKMARK' },
  snippet:  { accent: 'rgba(245,168,80,0.92)',   dot: '#F5A850', label: 'SNIPPET'  },
};

/* ─── Shared RAF clock ───────────────────────────────────────────────── */
function useTime() {
  const tRef   = useRef(0);
  const rafRef = useRef(0);
  const [t, setT] = useState(0);
  const t0Ref  = useRef<number | null>(null);

  useEffect(() => {
    const tick = (ts: number) => {
      if (t0Ref.current === null) t0Ref.current = ts;
      tRef.current = ts - t0Ref.current;
      setT(ts - t0Ref.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return t;
}

/* ─── Float XY for a fragment at time t ─────────────────────────────── */
function floatXY(f: Fragment, t: number, gravityDx: number, gravityDy: number) {
  const theta = (t / f.period) * Math.PI * 2 + f.phase;
  const ox = Math.sin(theta) * f.orbitR * Math.cos(f.axis);
  const oy = Math.sin(theta * 1.3) * f.orbitR * Math.sin(f.axis + 0.6);
  // Subtle gravity pull toward cursor — very low intensity
  return {
    dx: ox + gravityDx * 0.045 * (1 + f.z * 0.3),
    dy: oy + gravityDy * 0.03  * (1 + f.z * 0.3),
  };
}

/* ─── Flicker opacity ────────────────────────────────────────────────── */
function flickerOpacity(f: Fragment, t: number, baseOpacity: number): number {
  // Periodic dip, never drops too much
  const dip = Math.sin(t / f.flickerRate + f.flickerSeed * 12.7);
  const flicker = dip > 0.7 ? (1 - (dip - 0.7) / 0.3 * 0.4) : 1.0;
  // Occasional ghost-in effect
  const ghost = Math.sin(t / (f.flickerRate * 2.3) + f.flickerSeed * 7.1) > 0.85 ? 0.7 : 1.0;
  return baseOpacity * flicker * ghost;
}

/* ─── Word highlight util ────────────────────────────────────────────── */
function HighlightText({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length) return <>{text}</>;
  const escaped  = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const splitPat = new RegExp(`(${escaped})`, 'gi');
  const testPat  = new RegExp(`^(${escaped})$`, 'i');
  const parts    = text.split(splitPat);
  return (
    <>
      {parts.map((p, i) =>
        testPat.test(p) ? (
          <mark key={i} style={{
            background: 'rgba(155,120,240,0.22)',
            color: 'rgba(210,200,255,0.95)',
            borderRadius: 2, padding: '0 1px',
          }}>{p}</mark>
        ) : <span key={i}>{p}</span>
      )}
    </>
  );
}

/* ─── Depth canvas: particles + connection lines ─────────────────────── */
function DepthCanvas({
  searching,
  containerRef,
}: {
  searching: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
}) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const rafRef       = useRef(0);
  const stateRef     = useRef(searching);
  const progressRef  = useRef(0);

  useEffect(() => { stateRef.current = searching; }, [searching]);

  useEffect(() => {
    const canvas    = canvasRef.current!;
    const container = containerRef.current!;
    const ctx       = canvas.getContext('2d')!;

    // Multi-layer particles — foreground (fast/bright), midground, background (slow/dim/blurred)
    const layers = [
      // background
      Array.from({ length: 35 }, () => ({
        x: Math.random() * 1000, y: Math.random() * 700,
        vx: (Math.random() - 0.5) * 0.06, vy: (Math.random() - 0.5) * 0.05,
        r: 0.4 + Math.random() * 0.8,
        a: 0.018 + Math.random() * 0.04,
        hue: 230 + Math.random() * 30,
        blur: 2.5,
      })),
      // midground
      Array.from({ length: 28 }, () => ({
        x: Math.random() * 1000, y: Math.random() * 700,
        vx: (Math.random() - 0.5) * 0.10, vy: (Math.random() - 0.5) * 0.09,
        r: 0.5 + Math.random() * 1.0,
        a: 0.04 + Math.random() * 0.09,
        hue: 220 + Math.random() * 45,
        blur: 0.8,
      })),
      // foreground — passes close to camera
      Array.from({ length: 12 }, () => ({
        x: Math.random() * 1000, y: Math.random() * 700,
        vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.18,
        r: 1.4 + Math.random() * 2.2,
        a: 0.07 + Math.random() * 0.12,
        hue: 215 + Math.random() * 60,
        blur: 0,
      })),
    ];

    const relevantFrags = FRAGMENTS.filter(f => RELEVANT.has(f.id));
    let running = true;

    const tick = () => {
      const W = canvas.width  = container.offsetWidth;
      const H = canvas.height = container.offsetHeight;
      ctx.clearRect(0, 0, W, H);
      const spd = stateRef.current ? 2.6 : 1;

      if (!stateRef.current) progressRef.current = Math.max(0, progressRef.current - 0.055);
      else                    progressRef.current = Math.min(1, progressRef.current + 0.05);

      // Draw layers back→front
      layers.forEach((layer) => {
        layer.forEach(p => {
          p.x = ((p.x + p.vx * spd) + W) % W;
          p.y = ((p.y + p.vy * spd) + H) % H;
          const a = stateRef.current ? p.a * 1.9 : p.a;
          ctx.save();
          if (p.blur > 0) ctx.filter = `blur(${p.blur}px)`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue},52%,72%,${a})`;
          ctx.fill();
          ctx.restore();
        });
      });

      // Connection lines to relevant fragments when searching
      const p = progressRef.current;
      if (p > 0.01) {
        const sx = W * 0.5;
        const sy = H * 0.58;

        relevantFrags.forEach((f, i) => {
          const tx = (f.bx / 100) * W;
          const ty = (f.by / 100) * H;
          const alpha = p * 0.2;
          const hex = KIND_STYLE[f.kind].dot.replace('#', '');
          const [rr, gg, bb] = (hex.match(/.{2}/g) ?? ['80','80','ff']).map(x => parseInt(x, 16));
          const grad = ctx.createLinearGradient(sx, sy, tx, ty);
          grad.addColorStop(0, `rgba(140,100,240,${alpha})`);
          grad.addColorStop(1, `rgba(${rr},${gg},${bb},${alpha * 0.4})`);

          ctx.beginPath();
          ctx.moveTo(sx, sy);
          const mx = sx + (tx - sx) * 0.5 + (i % 2 === 0 ? 25 : -25);
          const my = sy + (ty - sy) * 0.3;
          ctx.quadraticCurveTo(mx, my, tx, ty);
          ctx.strokeStyle = grad;
          ctx.lineWidth   = 0.5 + p * 0.5;
          ctx.setLineDash([3, 6]);
          ctx.lineDashOffset = -Date.now() * 0.01;
          ctx.stroke();
          ctx.setLineDash([]);
        });
      }

      if (running) rafRef.current = requestAnimationFrame(tick);
    };

    tick();
    return () => { running = false; cancelAnimationFrame(rafRef.current); };
  }, []);

  return (
    <canvas ref={canvasRef} style={{
      position: 'absolute', inset: 0,
      width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 0,
    }} />
  );
}

/* ─── Fragment card ──────────────────────────────────────────────────── */
function FragCard({
  f, t, state,
  mouseX, mouseY,
  containerW, containerH,
}: {
  f: Fragment;
  t: number;
  state: 'idle' | 'relevant' | 'faded';
  mouseX: number;
  mouseY: number;
  containerW: number;
  containerH: number;
}) {
  const m = KIND_STYLE[f.kind];
  const isRelevant = state === 'relevant';
  const isFaded    = state === 'faded';

  // Depth tiers
  const depthScale   = 0.72 + f.z * 0.09;
  const depthBlur    = Math.max(0, 2.4 - f.z * 0.75);

  // Base opacity varies by depth, stronger foreground/bg separation
  const zOpacity = f.z === 0 ? 0.055 : f.z === 1 ? 0.12 : f.z === 2 ? 0.22 : 0.35;

  const rawOpacity = isFaded ? 0.03 : isRelevant ? 1.0 : zOpacity;
  // Apply flicker to non-active fragments
  const finalOpacity = (isFaded || isRelevant) ? rawOpacity : flickerOpacity(f, t, rawOpacity);

  const targetScale = isFaded ? depthScale * 0.86 : isRelevant ? 1.08 : depthScale;
  const targetBlur  = isFaded ? 5 : isRelevant ? 0 : depthBlur;

  // Gravity: compute offset from frag center to cursor
  const fragCx = (f.bx / 100) * containerW;
  const fragCy = (f.by / 100) * containerH;
  const gravDx = mouseX - fragCx;
  const gravDy = mouseY - fragCy;

  const frozen     = isRelevant || isFaded;
  const { dx, dy } = floatXY(f, frozen ? f.phase * 1000 : t, frozen ? 0 : gravDx, frozen ? 0 : gravDy);
  const cardW      = f.size === 'lg' ? 200 : f.size === 'md' ? 170 : 148;

  // Relevant cards get pulled toward center during search
  const relevantPullX = isRelevant ? (containerW * 0.5 - fragCx) * 0.07 : 0;
  const relevantPullY = isRelevant ? (containerH * 0.58 - fragCy) * 0.05 : 0;

  return (
    <motion.div
      animate={{
        opacity: finalOpacity,
        scale:   targetScale,
        filter:  `blur(${targetBlur}px)`,
      }}
      transition={
        isRelevant ? { duration: 0.28, ease: [0.16, 1, 0.3, 1] }
        : isFaded   ? { duration: 0.2,  ease: [0.4, 0, 1, 1] }
                    : { duration: 1.2,  ease: 'easeInOut' }
      }
      style={{
        position:  'absolute',
        left:      `${f.bx}%`,
        top:       `${f.by}%`,
        transform: `translate(calc(-50% + ${dx + relevantPullX}px), calc(-50% + ${dy + relevantPullY}px)) rotate(${f.angle}deg)`,
        zIndex:    isRelevant ? 7 : f.z + 1,
        width:     cardW,
        userSelect: 'none',
        pointerEvents: 'none',
        willChange: 'transform, opacity, filter',
      }}
    >
      {isRelevant && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0.5 }}
          animate={{ scale: 1.6, opacity: 0 }}
          transition={{ duration: 1.1, ease: 'easeOut', repeat: Infinity, repeatDelay: 1.0 }}
          style={{
            position: 'absolute', inset: -4,
            borderRadius: 13,
            border: `1px solid ${m.dot}44`,
            pointerEvents: 'none',
          }}
        />
      )}

      <div style={{
        background: isRelevant
          ? 'linear-gradient(145deg, rgba(16,12,32,0.99), rgba(22,16,44,0.97))'
          : 'rgba(10,8,20,0.82)',
        border: `1px solid ${isRelevant
          ? m.accent.replace('0.92', '0.38')
          : 'rgba(255,255,255,0.055)'}`,
        borderRadius:   10,
        padding:        f.size === 'sm' ? '8px 11px' : '11px 13px',
        backdropFilter: 'blur(18px)',
        boxShadow: isRelevant
          ? `0 14px 44px rgba(0,0,0,0.65), 0 0 0 1px ${m.dot}18, inset 0 1px 0 rgba(255,255,255,0.06)`
          : '0 2px 14px rgba(0,0,0,0.35)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
          <motion.div
            animate={isRelevant ? {
              boxShadow: [`0 0 4px ${m.dot}`, `0 0 12px ${m.dot}`, `0 0 4px ${m.dot}`],
            } : {}}
            transition={{ duration: 1.4, repeat: Infinity }}
            style={{
              width: 5, height: 5, borderRadius: '50%',
              background: m.dot,
              opacity: isRelevant ? 1 : 0.4,
              flexShrink: 0,
            }}
          />
          <span style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 6.5, letterSpacing: '0.18em',
            color: isRelevant ? m.accent : m.accent.replace('0.92', '0.5'),
          }}>{m.label}</span>

          {isRelevant && (
            <motion.div
              initial={{ opacity: 0, scale: 0.6, x: -4 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ delay: 0.06, duration: 0.18 }}
              style={{
                marginLeft: 'auto',
                background: m.dot + '28',
                border: `1px solid ${m.dot}44`,
                borderRadius: 3,
                padding: '1px 5px',
              }}
            >
              <span style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 5.5, color: m.dot, letterSpacing: '0.12em',
              }}>MATCH</span>
            </motion.div>
          )}
        </div>

        <div style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: f.size === 'sm' ? 10 : 11,
          fontWeight: isRelevant ? 600 : 500,
          color: isRelevant ? '#EDE9FF' : 'rgba(208,204,228,0.7)',
          lineHeight: 1.35, marginBottom: 3, letterSpacing: '-0.01em',
        }}>{f.title}</div>

        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 6.5,
          color: 'rgba(140,135,178,0.45)', letterSpacing: '0.04em',
        }}>{f.sub}</div>

        {f.tag && (
          <div style={{
            marginTop: 4,
            fontFamily: "'Space Mono', monospace",
            fontSize: 6,
            color: isRelevant
              ? m.accent.replace('0.92', '0.55')
              : 'rgba(100,96,140,0.35)',
            letterSpacing: '0.06em',
          }}>· {f.tag}</div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Blinking cursor ────────────────────────────────────────────────── */
function Cursor() {
  return (
    <motion.span
      animate={{ opacity: [1, 0, 1] }}
      transition={{ duration: 0.72, repeat: Infinity, times: [0, 0.5, 1] }}
      style={{
        display: 'inline-block',
        width: 1.5, height: 15,
        background: 'rgba(155,120,240,0.9)',
        marginLeft: 1.5, borderRadius: 1, verticalAlign: 'middle',
      }}
    />
  );
}

/* ─── Search bar — embedded in environment ────────────────────────────  */
const QUERY       = 'that stripe webhook thing';
const MATCH_TERMS = ['stripe', 'webhook'];

function SearchBar({ phase, typed }: { phase: FieldPhase; typed: string }) {
  const isActive  = phase !== 'idle';
  const isSnapped = phase === 'snap' || phase === 'results';

  return (
    <div style={{ width: 430, position: 'relative' }}>
      {/* Radial environment glow — part of space, not UI chrome */}
      <motion.div
        animate={{ opacity: isActive ? 1 : 0, scale: isActive ? 1 : 0.7 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute',
          inset: -60,
          background: 'radial-gradient(ellipse at center, rgba(110,80,220,0.14) 0%, transparent 65%)',
          pointerEvents: 'none', borderRadius: 60,
        }}
      />

      <motion.div
        animate={{
          borderColor: isActive ? 'rgba(150,115,242,0.42)' : 'rgba(255,255,255,0.06)',
          boxShadow: isActive
            ? '0 0 0 1px rgba(140,105,240,0.14), 0 16px 48px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)'
            : '0 4px 20px rgba(0,0,0,0.4)',
          // Glass dissolves slightly as env brightens around it
          background: isActive ? 'rgba(8,6,20,0.88)' : 'rgba(10,8,22,0.92)',
        }}
        style={{
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14, padding: '14px 18px',
          display: 'flex', alignItems: 'center', gap: 12,
          backdropFilter: 'blur(28px)',
        }}
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="7" cy="7" r="4.8"
            stroke={isActive ? 'rgba(148,112,242,0.85)' : 'rgba(140,135,180,0.25)'}
            strokeWidth="1.3"/>
          <path d="M11 11L14.2 14.2"
            stroke={isActive ? 'rgba(148,112,242,0.85)' : 'rgba(140,135,180,0.25)'}
            strokeWidth="1.3" strokeLinecap="round"/>
        </svg>

        <div style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14, letterSpacing: '-0.01em',
          color: typed ? 'rgba(225,220,255,0.94)' : 'rgba(140,135,185,0.28)',
          flex: 1, minHeight: 20,
          display: 'flex', alignItems: 'center', lineHeight: 1,
        }}>
          {typed
            ? (isSnapped
                ? <HighlightText text={typed} terms={MATCH_TERMS} />
                : <>{typed}</>
              )
            : <span style={{ fontStyle: 'italic', fontSize: 13 }}>Search your memory…</span>
          }
          {phase === 'typing' && <Cursor />}
        </div>

        <AnimatePresence>
          {isSnapped && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              style={{
                width: 7, height: 7, borderRadius: '50%',
                background: 'rgba(120,200,105,0.9)',
                boxShadow: '0 0 8px rgba(120,200,105,0.6)',
                flexShrink: 0,
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {phase === 'snap' && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              textAlign: 'center', marginTop: 8,
              fontFamily: "'Space Mono', monospace",
              fontSize: 7, letterSpacing: '0.24em',
              color: 'rgba(145,115,242,0.5)',
              textTransform: 'uppercase',
            }}
          >
            retrieving from memory…
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Result cards ───────────────────────────────────────────────────── */
const RESULTS = [
  {
    id: 1, kind: 'link' as FragmentKind,
    title: 'Stripe Webhooks Guide',
    source: 'stripe.com/docs',
    preview: 'Verify webhook signatures using the Stripe-Signature header. Use constructEvent() to safely validate incoming events.',
    meta: 'saved 2 weeks ago · bookmarks', code: false,
  },
  {
    id: 2, kind: 'snippet' as FragmentKind,
    title: 'verify_signature() helper',
    source: 'your snippets',
    preview: 'stripe.Webhook.construct_event(\n  payload, sig_header, endpoint_secret)',
    meta: '3 days ago · from GitHub', code: true,
  },
  {
    id: 3, kind: 'note' as FragmentKind,
    title: 'Webhook retry + idempotency',
    source: 'your notes',
    preview: 'Always return 200 immediately. Process async. Use idempotency keys — Stripe retries for up to 72h.',
    meta: '5 days ago · quick note', code: false,
  },
];

function ResultCards() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        marginTop: 7, width: 430,
        display: 'flex', flexDirection: 'column', gap: 5,
      }}
    >
      {RESULTS.map((r, i) => {
        const m = KIND_STYLE[r.kind];
        return (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.07, duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            style={{
              background: 'rgba(11,9,24,0.97)',
              border: `1px solid ${m.accent.replace('0.92', '0.22')}`,
              borderRadius: 10, padding: '10px 13px',
              backdropFilter: 'blur(24px)',
              boxShadow: `0 4px 24px rgba(0,0,0,0.52), 0 0 0 1px ${m.dot}10, inset 0 1px 0 rgba(255,255,255,0.03)`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
              <div style={{
                width: 4, height: 4, borderRadius: '50%',
                background: m.dot, opacity: 0.85, flexShrink: 0,
              }} />
              <span style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 6.5, letterSpacing: '0.18em', color: m.accent, opacity: 0.9,
              }}>{m.label}</span>
              <span style={{
                marginLeft: 'auto',
                fontFamily: "'Space Mono', monospace",
                fontSize: 6.5, color: 'rgba(115,110,155,0.45)',
              }}>{r.source}</span>
            </div>

            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12, fontWeight: 600,
              color: '#E6E2FF', marginBottom: 4, letterSpacing: '-0.01em',
            }}>
              <HighlightText text={r.title} terms={MATCH_TERMS} />
            </div>

            {r.code ? (
              <div style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 7.5, lineHeight: 1.65,
                color: 'rgba(190,185,225,0.58)',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 5, padding: '5px 8px', whiteSpace: 'pre',
              }}>
                <HighlightText text={r.preview} terms={MATCH_TERMS} />
              </div>
            ) : (
              <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 10, lineHeight: 1.6,
                color: 'rgba(168,162,205,0.55)',
              }}>
                <HighlightText text={r.preview} terms={MATCH_TERMS} />
              </div>
            )}

            <div style={{
              marginTop: 5,
              fontFamily: "'Space Mono', monospace",
              fontSize: 6.5, color: 'rgba(105,100,148,0.42)', letterSpacing: '0.05em',
            }}>· {r.meta}</div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

/* ─── Search label — fades into environment ──────────────────────────── */
function SearchLabel({ phase }: { phase: FieldPhase }) {
  const hide = phase === 'snap' || phase === 'results';
  const dim  = phase === 'typing';
  return (
    <motion.div
      animate={{
        opacity: hide ? 0 : dim ? 0.35 : 1,
        y:       hide ? -8 : 0,
        filter:  hide ? 'blur(3px)' : dim ? 'blur(0.5px)' : 'blur(0px)',
      }}
      transition={{ duration: 0.4 }}
      style={{ textAlign: 'center', marginBottom: 20, pointerEvents: 'none' }}
    >
      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)',
        fontWeight: 700, letterSpacing: '-0.02em',
        color: '#EDE9FF', lineHeight: 1.1, marginBottom: 5,
      }}>
        Recall
      </div>
      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 13, color: 'rgba(170,165,210,0.38)', lineHeight: 1.6,
      }}>
        Find anything you've saved.{' '}
        <span style={{ color: 'rgba(155,125,245,0.6)', fontStyle: 'italic' }}>Instantly.</span>
      </div>
    </motion.div>
  );
}

/* ─── Typing sequence ────────────────────────────────────────────────── */
const BAKED_DELAYS = [
  62, 94, 55, 88, 71, 105, 58, 78, 66, 49, 103, 72, 59, 84,
  67, 91, 53, 77, 62, 108, 56, 74, 69, 85, 70,
].slice(0, QUERY.length);

function sleep(ms: number) { return new Promise<void>(r => setTimeout(r, ms)); }

/* ─── Main export ────────────────────────────────────────────────────── */
export default function MemoryField({ onPhaseChange }: { onPhaseChange?: (p: FieldPhase) => void } = {}) {
  const [phase,     setPhase]     = useState<FieldPhase>('idle');
  const [typed,     setTyped]     = useState('');
  const [fragState, setFragState] = useState<Record<number, 'idle' | 'relevant' | 'faded'>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 1, h: 1 });

  // Mouse position for gravity
  const rawMouseX = useRef(0);
  const rawMouseY = useRef(0);
  const [smoothMouse, setSmoothMouse] = useState({ x: 0, y: 0 });
  const smoothRef = useRef({ x: 0, y: 0 });
  const lerpRafRef = useRef(0);

  const t = useTime();

  // Smooth lerp mouse
  useEffect(() => {
    const lerp = () => {
      const dx = rawMouseX.current - smoothRef.current.x;
      const dy = rawMouseY.current - smoothRef.current.y;
      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        smoothRef.current.x += dx * 0.06;
        smoothRef.current.y += dy * 0.06;
        setSmoothMouse({ x: smoothRef.current.x, y: smoothRef.current.y });
      }
      lerpRafRef.current = requestAnimationFrame(lerp);
    };
    lerpRafRef.current = requestAnimationFrame(lerp);
    return () => cancelAnimationFrame(lerpRafRef.current);
  }, []);

  // Track mouse over container
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    rawMouseX.current = e.clientX - rect.left;
    rawMouseY.current = e.clientY - rect.top;
  }, []);

  // Container size for gravity calcs
  useEffect(() => {
    const obs = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setContainerSize({ w: width, h: height });
      // Initialize mouse to center
      rawMouseX.current   = width  / 2;
      rawMouseY.current   = height / 2;
      smoothRef.current.x = width  / 2;
      smoothRef.current.y = height / 2;
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => { onPhaseChange?.(phase); }, [phase]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      while (!cancelled) {
        await sleep(600);
        if (cancelled) break;
        setPhase('typing');

        for (let i = 1; i <= QUERY.length; i++) {
          if (cancelled) break;
          await sleep(BAKED_DELAYS[i - 1]);
          setTyped(QUERY.slice(0, i));
        }

        await sleep(280);
        if (cancelled) break;
        setPhase('snap');

        const states: Record<number, 'idle' | 'relevant' | 'faded'> = {};
        FRAGMENTS.forEach(f => {
          states[f.id] = RELEVANT.has(f.id) ? 'relevant' : 'faded';
        });
        setFragState(states);
        await sleep(200);

        if (cancelled) break;
        setPhase('results');
        await sleep(5000);

        if (cancelled) break;
        setPhase('idle');
        setTyped('');
        setFragState({});
        await sleep(1800);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  const isSearching = phase === 'snap' || phase === 'results';

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}
    >
      <DepthCanvas searching={isSearching} containerRef={containerRef as React.RefObject<HTMLDivElement>} />

      {/* Fragments live in the environment — can overlap anything */}
      {FRAGMENTS.map(f => (
        <FragCard
          key={f.id}
          f={f}
          t={t}
          state={fragState[f.id] ?? 'idle'}
          mouseX={smoothMouse.x}
          mouseY={smoothMouse.y}
          containerW={containerSize.w}
          containerH={containerSize.h}
        />
      ))}

      {/* UI center — lower z than deep-z fragments, so they can pass in front */}
      <motion.div
        animate={{ y: phase === 'results' ? -16 : 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute',
          left: '50%', top: '58%',
          transform: 'translate(-50%, -50%)',
          zIndex: 5,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        <SearchLabel phase={phase} />
        <SearchBar phase={phase} typed={typed} />
        <AnimatePresence>
          {phase === 'results' && <ResultCards />}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
