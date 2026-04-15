import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ═══════════════════════════════════════════════════════════════════════
   CAPTURE DEMO — Cinematic system event
   Full-screen overlay. Content leaves interface, absorbed into memory.
   ═══════════════════════════════════════════════════════════════════════ */

type Phase =
  | 'dormant'    // system at rest — just the card visible in section
  | 'intent'     // pre-capture: subtle glow warms up (80–120ms)
  | 'highlight'  // shimmer sweep, border lifts
  | 'lift'       // card elevates, fidelity begins dissolving
  | 'compress'   // card loses form → abstract orb
  | 'void'       // 100–200ms disappearance: orb gone, screen holds
  | 'travel'     // orb arcs toward vanishing point in memory space
  | 'disappear'  // orb fully shrinks into point, vanishes
  | 'wait'       // 120–180ms empty pause before arrival
  | 'arrive'     // fragment materializes in memory space
  | 'settle'     // settles into cluster, micro-shift of neighbors
  | 'ripple'     // minimal ring expansion — 1 ring only, faint
  | 'absorbed'   // hold state — capture complete, system returns to quiet
  | 'reset';     // brief opacity-zero before dormant

/* ─── Timing with jitter ─────────────────────────────────────────────── */
function jitter(base: number, range: number) {
  return base + (Math.random() - 0.5) * range;
}

function buildDurations(): Record<Phase, number> {
  return {
    dormant:    jitter(2600, 600),
    intent:     jitter(100,  40),
    highlight:  jitter(210,  50),
    lift:       jitter(270,  60),
    compress:   jitter(360,  80),
    void:       jitter(150,  60),
    travel:     jitter(820, 120),
    disappear:  jitter(140,  40),
    wait:       jitter(160,  60),
    arrive:     jitter(300,  60),
    settle:     jitter(440,  80),
    ripple:     jitter(620,  80),
    absorbed:   jitter(1400, 400),
    reset:      180,
  };
}

const ORDER: Phase[] = [
  'dormant','intent','highlight','lift','compress',
  'void','travel','disappear','wait','arrive','settle','ripple','absorbed','reset',
];

function usePhaseEngine() {
  const [phase, setPhase] = useState<Phase>('dormant');
  const phaseRef = useRef<Phase>('dormant');

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let idx = 0;
    let durations = buildDurations();

    const advance = () => {
      idx = (idx + 1) % ORDER.length;
      // Rebuild durations each full cycle for loop-break feel
      if (idx === 0) durations = buildDurations();
      phaseRef.current = ORDER[idx];
      setPhase(ORDER[idx]);
      timer = setTimeout(advance, durations[ORDER[idx]]);
    };

    timer = setTimeout(advance, durations['dormant']);
    return () => clearTimeout(timer);
  }, []);

  return { phase, phaseRef };
}

/* ─── Canvas: depth-travel trail + vanishing point + ripple ─────────── */
function CinematicCanvas({
  phase,
  srcX, srcY,    // source orb position (absolute to viewport)
  vpX, vpY,      // vanishing point (in viewport)
  W, H,          // viewport dims
}: {
  phase: Phase;
  srcX: number; srcY: number;
  vpX: number;  vpY: number;
  W: number;    H: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef  = useRef(phase);
  const t0Ref     = useRef<number | null>(null);
  const rafRef    = useRef(0);

  // Random per-cycle path variation
  const cpVariantRef = useRef({ cx: 0, cy: 0 });

  useEffect(() => {
    phaseRef.current = phase;
    if (phase === 'travel') {
      t0Ref.current = null;
      // Slightly randomize the bezier arc control point each cycle
      cpVariantRef.current = {
        cx: (Math.random() - 0.5) * 80,
        cy: -(Math.random() * 60 + 40),
      };
    }
    if (phase === 'ripple' || phase === 'arrive') {
      t0Ref.current = null;
    }
  }, [phase]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext('2d')!;
    let running  = true;

    const draw = (ts: number) => {
      canvas.width  = W;
      canvas.height = H;
      ctx.clearRect(0, 0, W, H);

      const p = phaseRef.current;

      /* ── Travel trail ── */
      if ((p === 'travel' || p === 'disappear') && srcX > 0) {
        if (!t0Ref.current) t0Ref.current = ts;
        const elapsed  = ts - t0Ref.current;
        const travelMs = 820;
        const progress = Math.min(elapsed / travelMs, 1.0);

        const cpx = srcX + (vpX - srcX) * 0.35 + cpVariantRef.current.cx;
        const cpy = srcY + (vpY - srcY) * 0.2  + cpVariantRef.current.cy;

        // Trail — dots along bezier, fading behind head
        const STEPS = 60;
        for (let i = 0; i < STEPS; i++) {
          const bt  = (i / STEPS) * progress;
          const mt  = 1 - bt;
          const bx  = mt * mt * srcX + 2 * mt * bt * cpx + bt * bt * vpX;
          const by  = mt * mt * srcY + 2 * mt * bt * cpy + bt * bt * vpY;

          // Proximity to head: bright; tail: invisible
          const headPct  = i / STEPS;
          const headDist = Math.abs(headPct - progress);
          // Fade behind (tail) and fade at very head (it's the orb itself)
          const trailAlpha = Math.max(0,
            (1 - headDist * 6) * (1 - bt * 0.55) * 0.38
          );
          // Radius shrinks toward vanishing point
          const r = Math.max(0.3, 2.2 - bt * 2.0);

          if (trailAlpha < 0.005) continue;
          ctx.beginPath();
          ctx.arc(bx, by, r, 0, Math.PI * 2);
          // Color shifts from purple → dim blue as it recedes
          const lum = Math.round(65 - bt * 25);
          ctx.fillStyle = `hsla(255, 60%, ${lum}%, ${trailAlpha})`;
          ctx.fill();
        }

        // Head micro-sparks — very subtle
        if (progress < 0.92) {
          const ht  = progress;
          const hmt = 1 - ht;
          const hx  = hmt * hmt * srcX + 2 * hmt * ht * cpx + ht * ht * vpX;
          const hy  = hmt * hmt * srcY + 2 * hmt * ht * cpy + ht * ht * vpY;

          for (let s = 0; s < 4; s++) {
            const angle = (s / 4) * Math.PI * 2 + ts * 0.005;
            const dist  = 2 + Math.sin(ts * 0.009 + s * 1.7) * 1.2;
            ctx.beginPath();
            ctx.arc(hx + Math.cos(angle) * dist, hy + Math.sin(angle) * dist, 0.7, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(185,165,240,${0.22 - ht * 0.15})`;
            ctx.fill();
          }
        }
      }

      /* ── Ripple — single ring, very faint ── */
      if (p === 'ripple') {
        if (!t0Ref.current) t0Ref.current = ts;
        const elapsed = ts - t0Ref.current;
        const dur     = 700;
        const t       = Math.min(elapsed / dur, 1);
        if (t > 0 && t < 1) {
          const radius = t * 90;
          const alpha  = (1 - t) * 0.14;   // deliberately minimal
          ctx.beginPath();
          ctx.arc(vpX, vpY, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(145,115,230,${alpha})`;
          ctx.lineWidth   = 0.8;
          ctx.stroke();
        }
      }

      /* ── Vanishing point dim glow when active ── */
      if (['travel','disappear','wait','arrive','settle','ripple'].includes(p)) {
        const grd = ctx.createRadialGradient(vpX, vpY, 0, vpX, vpY, 80);
        grd.addColorStop(0, 'rgba(120,90,220,0.06)');
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, W, H);
      }

      if (running) rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => { running = false; cancelAnimationFrame(rafRef.current); };
  }, [srcX, srcY, vpX, vpY, W, H]);

  return (
    <canvas ref={canvasRef} style={{
      position: 'fixed', inset: 0,
      width: '100%', height: '100%',
      pointerEvents: 'none',
      zIndex: 9998,
    }} />
  );
}

/* ─── Traveling orb — fixed over viewport, curved bezier path ───────── */
function TravelingOrb({
  phase,
  srcX, srcY,
  vpX, vpY,
}: {
  phase: Phase;
  srcX: number; srcY: number;
  vpX: number; vpY: number;
}) {
  const isActive = phase === 'travel' || phase === 'disappear';
  if (!isActive || srcX === 0) return null;

  // Bezier control point (same jitter as canvas — close enough, subtle)
  const cpx = srcX + (vpX - srcX) * 0.35 + 30;
  const cpy = srcY + (vpY - srcY) * 0.2  - 60;

  // 3 keyframes along bezier (t=0, 0.45, 1)
  const kf = [0, 0.45, 1].map(t => {
    const mt = 1 - t;
    return {
      x: mt * mt * srcX + 2 * mt * t * cpx + t * t * vpX - srcX,
      y: mt * mt * srcY + 2 * mt * t * cpy + t * t * vpY - srcY,
    };
  });

  return (
    <motion.div
      key="travel-orb"
      initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
      animate={{
        x:       [0, kf[1].x, kf[2].x],
        y:       [0, kf[1].y, kf[2].y],
        scale:   [1, 0.38, 0.06],
        opacity: [1, 0.85, 0],
        filter:  ['blur(0px)', 'blur(0.5px)', 'blur(4px)'],
      }}
      transition={{
        duration: 0.82,
        ease: [0.3, 0.05, 0.6, 0.95],
        times: [0, 0.46, 1],
      }}
      style={{
        position: 'fixed',
        left: srcX - 16,
        top:  srcY - 16,
        zIndex: 9999,
        pointerEvents: 'none',
        width: 32, height: 32,
      }}
    >
      <div style={{
        width: '100%', height: '100%',
        borderRadius: '50%',
        background: 'radial-gradient(circle at 36% 32%, rgba(215,200,255,0.96), rgba(128,88,240,0.9))',
        border: '1px solid rgba(200,180,255,0.35)',
        boxShadow: '0 0 12px rgba(150,118,240,0.7)',
      }} />
    </motion.div>
  );
}

/* ─── Full-screen overlay ────────────────────────────────────────────── */
function FullscreenOverlay({ phase }: { phase: Phase }) {
  const active = !['dormant', 'reset'].includes(phase);
  const deep   = ['travel','disappear','wait','arrive','settle','ripple','absorbed'].includes(phase);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: deep ? 0.72 : 0.4 }}
          exit={{ opacity: 0 }}
          transition={{ duration: deep ? 0.45 : 0.2, ease: 'easeInOut' }}
          style={{
            position: 'fixed', inset: 0,
            background: '#06050F',
            zIndex: 9990,
            pointerEvents: 'none',
          }}
        />
      )}
    </AnimatePresence>
  );
}

/* ─── Source card — dissolves during capture ─────────────────────────── */
function SourceCard({
  phase,
  cardRef,
}: {
  phase: Phase;
  cardRef: React.RefObject<HTMLDivElement>;
}) {
  const intent   = phase === 'intent';
  const hl       = phase === 'highlight' || phase === 'lift';
  const lifted   = phase === 'lift';
  const dissolve = phase === 'compress';
  const gone     = ['void','travel','disappear','wait','arrive','settle','ripple','absorbed'].includes(phase);

  // Fidelity dissolve: blur + desaturate during compression
  const cardFilter = dissolve
    ? 'blur(2px) saturate(0.3)'
    : intent ? 'brightness(1.06)'
    : 'none';

  return (
    <AnimatePresence>
      {!gone && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: dissolve ? [1, 0] : 1,
            y:       lifted   ? -12 : 0,
            scale:   dissolve ? [1, 0.62] : lifted ? 1.012 : 1,
            filter:  cardFilter,
          }}
          exit={{ opacity: 0, transition: { duration: 0.08 } }}
          transition={{
            duration: dissolve ? 0.32 : 0.22,
            ease: dissolve ? [0.6, 0, 1, 0.5] : [0.16, 1, 0.3, 1],
            times: dissolve ? [0, 1] : undefined,
          }}
          style={{
            position: 'relative',
            zIndex: 9995,
            width: 296,
            borderRadius: 11,
            overflow: 'hidden',
            background: 'rgba(12,10,25,0.98)',
            border: hl
              ? '1px solid rgba(148,115,240,0.52)'
              : intent
              ? '1px solid rgba(148,115,240,0.2)'
              : '1px solid rgba(255,255,255,0.07)',
            boxShadow: hl
              ? '0 8px 40px rgba(120,82,230,0.36), inset 0 1px 0 rgba(255,255,255,0.05)'
              : intent
              ? '0 4px 20px rgba(100,70,200,0.18)'
              : '0 4px 20px rgba(0,0,0,0.55)',
            transition: 'border-color 0.14s ease, box-shadow 0.14s ease',
          }}
        >
          {/* Shimmer sweep — highlight phase */}
          <AnimatePresence>
            {hl && (
              <motion.div
                initial={{ x: '-110%' }}
                animate={{ x: '230%' }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                style={{
                  position: 'absolute', inset: 0, zIndex: 10,
                  background: 'linear-gradient(90deg, transparent, rgba(175,150,255,0.13), transparent)',
                  pointerEvents: 'none',
                }}
              />
            )}
          </AnimatePresence>

          {/* Browser chrome */}
          <div style={{
            padding: '7px 10px',
            background: 'rgba(255,255,255,0.01)',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            {['#FF5F57','#FEBC2E','#28C840'].map(c => (
              <div key={c} style={{ width: 7, height: 7, borderRadius: '50%', background: c, opacity: 0.4 }} />
            ))}
            <div style={{
              marginLeft: 5, flex: 1,
              background: 'rgba(255,255,255,0.035)',
              borderRadius: 4, padding: '2px 9px',
              fontFamily: "'Space Mono', monospace",
              fontSize: 6.5, color: 'rgba(150,145,185,0.36)', letterSpacing: '0.03em',
            }}>stripe.com/docs/webhooks</div>
          </div>

          {/* Content */}
          <div style={{ padding: '13px 15px' }}>
            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 6.5, letterSpacing: '0.2em',
              color: hl ? 'rgba(100,178,240,0.75)' : 'rgba(100,178,240,0.5)',
              marginBottom: 7, textTransform: 'uppercase',
              transition: 'color 0.14s',
            }}>stripe.com / docs</div>

            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14, fontWeight: 600,
              color: hl ? '#EDE9FF' : '#C8C4E6',
              letterSpacing: '-0.015em', lineHeight: 1.3, marginBottom: 7,
              transition: 'color 0.14s',
            }}>
              Webhook Signature Verification
            </div>

            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11, lineHeight: 1.65,
              color: 'rgba(150,145,192,0.48)',
            }}>
              Use{' '}
              <code style={{
                fontFamily: "'Space Mono', monospace", fontSize: 8.5,
                color: 'rgba(245,168,80,0.8)',
                background: 'rgba(245,168,80,0.055)',
                borderRadius: 3, padding: '1px 4px',
              }}>constructEvent()</code>
              {' '}to safely validate incoming webhook events.
            </div>

            <div style={{ display: 'flex', gap: 5, marginTop: 9 }}>
              {['#docs','#stripe','#webhook'].map(t => (
                <div key={t} style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 4, padding: '2px 6px',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 6, color: 'rgba(130,125,165,0.38)',
                  letterSpacing: '0.05em',
                }}>{t}</div>
              ))}
            </div>
          </div>

          {/* Save badge */}
          <AnimatePresence>
            {phase === 'dormant' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.1 } }}
                transition={{ delay: 0.6, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: 'absolute', top: 32, right: 9,
                  background: 'rgba(122,88,228,0.88)',
                  border: '1px solid rgba(158,130,252,0.28)',
                  borderRadius: 6, padding: '4px 9px',
                  display: 'flex', alignItems: 'center', gap: 4,
                  boxShadow: '0 2px 12px rgba(108,76,210,0.38)',
                }}
              >
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 6.5, color: 'rgba(230,225,255,0.92)', letterSpacing: '0.1em',
                }}>SAVE</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Compress orb — abstract form before travel ─────────────────────── */
function CompressOrb({
  phase,
  orbRef,
}: {
  phase: Phase;
  orbRef: React.RefObject<HTMLDivElement>;
}) {
  const visible = phase === 'compress' || phase === 'void';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={orbRef}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={
            phase === 'void'
              ? { scale: 0.3, opacity: 0 }
              : { scale: [0.7, 1.1, 1.0], opacity: [0, 1, 1] }
          }
          exit={{ opacity: 0, scale: 0.2, transition: { duration: 0.12 } }}
          transition={
            phase === 'void'
              ? { duration: 0.15, ease: [0.6, 0, 1, 0.5] }
              : { duration: 0.3, times: [0, 0.55, 1], ease: [0.16, 1, 0.3, 1] }
          }
          style={{
            position: 'absolute',
            left: '50%', top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9996,
            width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* Outer ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute', inset: 0,
              borderRadius: '50%',
              border: '1px solid rgba(150,120,250,0.18)',
              borderTopColor: 'rgba(160,132,255,0.6)',
            }}
          />
          {/* Core orb — soft, not explosive */}
          <div style={{
            width: 22, height: 22,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 36% 32%, rgba(210,195,255,0.95), rgba(125,85,235,0.88))',
            border: '1px solid rgba(195,175,255,0.4)',
            boxShadow: '0 0 10px rgba(148,115,240,0.55)',
          }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Memory space — right half or fullscreen right zone ─────────────── */
const CLUSTER = [
  { x: 24, y: 28, kind: 'note',     z: 2, label: 'webhook retry logic'  },
  { x: 71, y: 20, kind: 'snippet',  z: 3, label: 'verify_signature()'   },
  { x: 55, y: 65, kind: 'bookmark', z: 1, label: 'Idempotency Keys'      },
  { x: 83, y: 54, kind: 'link',     z: 2, label: 'ngrok tunnels'         },
  { x: 34, y: 72, kind: 'note',     z: 1, label: 'test with Stripe CLI'  },
  { x: 16, y: 57, kind: 'snippet',  z: 2, label: 'STRIPE_WEBHOOK_SECRET' },
];

const KDOT: Record<string, string> = {
  link: '#64B2F0', note: '#AF8EF5', bookmark: '#7AE0D2', snippet: '#F5A850',
};

// Per-fragment shift amounts, randomized once
const SHIFTS = CLUSTER.map(() => ({
  dx: (Math.random() - 0.5) * 10,
  dy: (Math.random() - 0.5) * 7,
}));

function MemorySpace({
  phase,
  fullscreen,
  vpLeft,  // left% inside the memory space container where vp sits
  vpTop,
}: {
  phase: Phase;
  fullscreen: boolean;
  vpLeft: number;
  vpTop: number;
}) {
  const active   = !['dormant','intent','highlight','lift','compress','void'].includes(phase);
  const isRipple = phase === 'ripple';
  const isSettle = ['arrive','settle','ripple','absorbed'].includes(phase);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Fine dot grid */}
      <motion.div
        animate={{ opacity: active ? 0.55 : 0.18 }}
        transition={{ duration: 0.5 }}
        style={{
          position: 'absolute', inset: 0,
          backgroundImage: `radial-gradient(circle, rgba(130,100,230,0.22) 1px, transparent 1px)`,
          backgroundSize: '34px 34px',
          pointerEvents: 'none',
        }}
      />

      {/* Depth gradient toward vp */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at ${vpLeft}% ${vpTop}%, rgba(100,72,200,0.08) 0%, transparent 60%)`,
        pointerEvents: 'none',
      }} />

      {/* Cluster fragments */}
      {CLUSTER.map((f, i) => {
        const dot = KDOT[f.kind];
        const opBase = 0.08 + f.z * 0.09;
        return (
          <motion.div
            key={i}
            animate={isRipple ? {
              x: [SHIFTS[i].dx, 0],
              y: [SHIFTS[i].dy, 0],
            } : { x: 0, y: 0 }}
            transition={{
              duration: 0.5 + i * 0.03,
              ease: [0.16, 1, 0.3, 1],
              delay: i * 0.03,
            }}
            style={{
              position: 'absolute',
              left: `${f.x}%`, top: `${f.y}%`,
              transform: 'translate(-50%, -50%)',
              opacity: active ? opBase * 2.5 : opBase,
              transition: 'opacity 0.55s ease',
            }}
          >
            <div style={{
              background: 'rgba(10,8,22,0.92)',
              border: `1px solid ${dot}18`,
              borderRadius: 7, padding: '5px 9px',
              display: 'flex', alignItems: 'center', gap: 4,
              backdropFilter: 'blur(10px)',
              whiteSpace: 'nowrap',
            }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: dot, opacity: 0.5 }} />
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 8.5, color: 'rgba(190,186,222,0.68)', letterSpacing: '-0.01em',
              }}>{f.label}</span>
            </div>
          </motion.div>
        );
      })}

      {/* Arrived fragment */}
      <AnimatePresence>
        {isSettle && (
          <motion.div
            initial={{ scale: 0.04, opacity: 0 }}
            animate={{ scale: [0.04, 1.18, 1], opacity: [0, 1, 1] }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.28 } }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1], times: [0, 0.52, 1] }}
            style={{
              position: 'absolute',
              left: `${vpLeft}%`, top: `${vpTop}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 5,
            }}
          >
            <motion.div
              animate={{ boxShadow: ['0 0 18px rgba(148,115,240,0.7)', '0 0 6px rgba(148,115,240,0.2)'] }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              style={{
                background: 'linear-gradient(145deg, rgba(15,11,30,0.99), rgba(20,14,38,0.97))',
                border: '1px solid rgba(100,178,240,0.38)',
                borderRadius: 9, padding: '8px 12px',
                backdropFilter: 'blur(22px)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                <motion.div
                  animate={{ boxShadow: ['0 0 4px #64B2F0','0 0 9px #64B2F0','0 0 4px #64B2F0'] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  style={{ width: 5, height: 5, borderRadius: '50%', background: '#64B2F0' }}
                />
                <span style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 6.5, color: 'rgba(100,178,240,0.88)', letterSpacing: '0.18em',
                }}>LINK</span>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.22 }}
                  style={{
                    marginLeft: 'auto',
                    background: '#64B2F01A', border: '1px solid #64B2F038',
                    borderRadius: 3, padding: '1px 5px',
                  }}
                >
                  <span style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 5.5, color: '#64B2F0', letterSpacing: '0.12em',
                  }}>NEW</span>
                </motion.div>
              </div>
              <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 10, fontWeight: 600,
                color: '#EAE6FF', letterSpacing: '-0.01em', marginBottom: 3,
              }}>Webhook Signature Verification</div>
              <div style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 6, color: 'rgba(135,130,172,0.4)',
              }}>stripe.com/docs · just now</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Phase label ────────────────────────────────────────────────────── */
const STATUS: Partial<Record<Phase, string>> = {
  intent:    'detecting save intent',
  highlight: 'extracting content',
  lift:      'preparing fragment',
  compress:  'compressing to memory object',
  void:      '',
  travel:    'routing to memory space',
  disappear: '',
  wait:      '',
  arrive:    'entering recall',
  settle:    'indexing fragment',
  ripple:    'memory updated',
};

function StatusLabel({ phase }: { phase: Phase }) {
  const label = STATUS[phase];
  const show  = label !== undefined && label !== '';
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.16 }}
          style={{
            position: 'fixed', bottom: 32, left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10000, pointerEvents: 'none',
            fontFamily: "'Space Mono', monospace",
            fontSize: 7, letterSpacing: '0.24em',
            color: 'rgba(158,132,240,0.5)',
            textTransform: 'uppercase', whiteSpace: 'nowrap',
          }}
        >
          <span style={{ opacity: 0.4, marginRight: 8 }}>◈</span>
          {label}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Main ───────────────────────────────────────────────────────────── */
export default function CaptureDemo() {
  const { phase } = usePhaseEngine();

  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef      = useRef<HTMLDivElement>(null);
  const orbRef       = useRef<HTMLDivElement>(null);

  const [vp, setVp]     = useState({ x: 0, y: 0 }); // viewport vanishing point (fixed coords)
  const [srcPos, setSrc] = useState({ x: 0, y: 0 }); // orb position in viewport
  const [vwh, setVwh]   = useState({ W: 0, H: 0 });  // viewport size

  // Vanishing point: roughly center of right side of screen
  const updateVp = useCallback(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    setVwh({ W, H });
    setVp({ x: W * 0.68, y: H * 0.44 });
  }, []);

  useEffect(() => {
    updateVp();
    window.addEventListener('resize', updateVp);
    return () => window.removeEventListener('resize', updateVp);
  }, []);

  // Measure orb/card center in viewport for travel start
  useEffect(() => {
    const measure = () => {
      const ref = orbRef.current || cardRef.current;
      if (!ref) return;
      const r = ref.getBoundingClientRect();
      setSrc({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    };
    measure();
    if (['dormant','intent','highlight','lift','compress'].includes(phase)) {
      requestAnimationFrame(measure);
    }
  }, [phase]);

  // Is system active (overlay + canvas drawn)
  const overlayActive = !['dormant', 'reset'].includes(phase);

  // Memory space vp expressed as % within its right-side container
  // container starts at ~48% of viewport width, so:
  const memVpLeft = ((vp.x / vwh.W) - 0.48) / 0.52 * 100;
  const memVpTop  = (vp.y / vwh.H) * 100;

  return (
    <>
      {/* Status label — fixed over everything */}
      <StatusLabel phase={phase} />

      {/* Fullscreen dim overlay */}
      <FullscreenOverlay phase={phase} />

      {/* Canvas layer — trail + ripple + vp glow */}
      {vwh.W > 0 && overlayActive && (
        <CinematicCanvas
          phase={phase}
          srcX={srcPos.x} srcY={srcPos.y}
          vpX={vp.x}      vpY={vp.y}
          W={vwh.W}        H={vwh.H}
        />
      )}

      {/* Traveling orb — fixed, floats above everything */}
      {vwh.W > 0 && (
        <TravelingOrb
          phase={phase}
          srcX={srcPos.x} srcY={srcPos.y}
          vpX={vp.x}      vpY={vp.y}
        />
      )}

      {/* Section container — always in DOM for layout */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%', height: 420,
          background: 'rgba(6,5,15,0.6)',
          border: '1px solid rgba(255,255,255,0.048)',
          borderRadius: 16,
          overflow: 'hidden',
          zIndex: overlayActive ? 9992 : 1,
        }}
      >
        {/* Left panel — source */}
        <div style={{
          position: 'absolute', left: 0, top: 0,
          width: '48%', height: '100%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '0 22px',
          borderRight: '1px solid rgba(255,255,255,0.03)',
        }}>
          <div style={{
            position: 'absolute', top: 15, left: 18,
            fontFamily: "'Space Mono', monospace",
            fontSize: 6.5, letterSpacing: '0.22em',
            color: 'rgba(130,125,162,0.26)',
            textTransform: 'uppercase',
          }}>source</div>

          {/* Anchor */}
          <div ref={cardRef} style={{ position: 'relative' }}>
            <SourceCard phase={phase} cardRef={cardRef} />
            {/* Compress orb appears in same space as card */}
            <CompressOrb phase={phase} orbRef={orbRef} />
          </div>
        </div>

        {/* Right panel — memory space */}
        <div style={{
          position: 'absolute', right: 0, top: 0,
          width: '52%', height: '100%',
        }}>
          <div style={{
            position: 'absolute', top: 15, right: 18, zIndex: 2,
            fontFamily: "'Space Mono', monospace",
            fontSize: 6.5, letterSpacing: '0.22em',
            color: 'rgba(130,125,162,0.26)',
            textTransform: 'uppercase',
          }}>recall</div>

          <MemorySpace
            phase={phase}
            fullscreen={false}
            vpLeft={Math.max(5, Math.min(95, memVpLeft))}
            vpTop={Math.max(5, Math.min(95, memVpTop))}
          />
        </div>
      </div>
    </>
  );
}
