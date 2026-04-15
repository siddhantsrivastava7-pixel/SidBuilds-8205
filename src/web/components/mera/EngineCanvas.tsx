import { useEffect, useRef, useCallback, useState } from 'react';
import { motion } from 'framer-motion';

// -- Types -----------------------------------------------------------------
interface InputState {
  amount: number;       // 100000 - 5000000 (1L-50L)
  duration: number;     // 1-30 years
  risk: 0 | 1 | 2;     // 0=low 1=moderate 2=high
  goal: 0 | 1 | 2 | 3; // 0=wealth 1=retirement 2=education 3=house
}

interface Allocation {
  equity: number;
  debt: number;
  gold: number;
  liquid: number;
}

const GOLD = '#C9A84C';
const CYAN = '#00D4FF';
const PURPLE = '#7B8FFF';
const TEAL = '#4ECDC4';

const RISK_LABELS = ['LOW', 'MODERATE', 'HIGH'];
const GOAL_LABELS = ['WEALTH', 'RETIREMENT', 'EDUCATION', 'HOUSE'];

// -- Deterministic calculation engine -------------------------------------
function calculate(inp: InputState): Allocation {
  const riskBias = [-0.2, 0, 0.22][inp.risk];
  const goalBias = [0.1, 0.05, -0.08, -0.12][inp.goal];
  const durationFactor = Math.min(1, inp.duration / 20);

  let equity  = 0.35 + riskBias * 1.1 + goalBias + durationFactor * 0.18;
  let debt    = 0.30 - riskBias * 0.5 + (1 - durationFactor) * 0.15 - goalBias * 0.4;
  let gold    = 0.12 + (inp.risk === 0 ? 0.06 : 0) + (inp.goal === 2 ? 0.04 : 0);
  let liquid  = 0.10 + (inp.risk === 0 ? 0.04 : 0) + (inp.goal === 3 ? 0.06 : 0);

  // clamp
  equity  = Math.max(0.05, Math.min(0.75, equity));
  debt    = Math.max(0.05, Math.min(0.60, debt));
  gold    = Math.max(0.03, Math.min(0.25, gold));
  liquid  = Math.max(0.03, Math.min(0.25, liquid));

  const sum = equity + debt + gold + liquid;
  return {
    equity:  Math.round((equity  / sum) * 100),
    debt:    Math.round((debt    / sum) * 100),
    gold:    Math.round((gold    / sum) * 100),
    liquid:  100 - Math.round((equity / sum) * 100) - Math.round((debt / sum) * 100) - Math.round((gold / sum) * 100),
  };
}

function sipVsLumpsum(inp: InputState): { sip: number; lumpsum: number } {
  const base = inp.amount;
  let sipFraction = 0.65;
  if (inp.duration < 5)  sipFraction = 0.40;
  if (inp.duration > 15) sipFraction = 0.75;
  if (inp.risk === 2)    sipFraction -= 0.10;
  if (inp.goal === 3)    sipFraction -= 0.10;
  sipFraction = Math.max(0.3, Math.min(0.85, sipFraction));
  return {
    sip:      Math.round(base * sipFraction),
    lumpsum:  Math.round(base * (1 - sipFraction)),
  };
}

// -- Signal particle -------------------------------------------------------
interface Signal {
  id: number;
  progress: number; // 0->1
  pathIndex: number;
  speed: number;
}

let signalIdCounter = 0;

// -- Canvas engine ---------------------------------------------------------
interface EngineCanvasProps {
  onBack: () => void;
}

export default function EngineCanvas({ onBack }: EngineCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef  = useRef<InputState>({ amount: 1500000, duration: 10, risk: 1, goal: 0 });
  const allocRef  = useRef<Allocation>(calculate(stateRef.current));
  const signalsRef = useRef<Signal[]>([]);
  const rafRef    = useRef<number>(0);
  const frameRef  = useRef<number>(0);
  const pulseRef  = useRef<number>(0); // 0-1 pulse after recalc
  const bootRef   = useRef<number>(0); // 0->1 boot animation
  const draggingRef = useRef<{ node: string; startY: number; startVal: number } | null>(null);
  const hoverRef  = useRef<string | null>(null);
  const [displayState, setDisplayState] = useState<InputState>(stateRef.current);
  const [displayAlloc, setDisplayAlloc] = useState<Allocation>(allocRef.current);
  const [booted, setBooted] = useState(false);

  // node positions (normalized 0-1, resolved at draw time)
  const getLayout = useCallback((W: number, H: number) => {
    const cx = W / 2;
    const cy = H / 2;

    const inputX = W * 0.20;
    const outputX = W * 0.80;
    const spread = H * 0.14;

    return {
      center:     { x: cx, y: cy },
      // Input nodes (left)
      amount:     { x: inputX, y: cy - spread * 1.5, label: 'AMOUNT',   color: GOLD },
      duration:   { x: inputX, y: cy - spread * 0.5, label: 'DURATION', color: GOLD },
      risk:       { x: inputX, y: cy + spread * 0.5, label: 'RISK',     color: GOLD },
      goal:       { x: inputX, y: cy + spread * 1.5, label: 'GOAL',     color: GOLD },
      // Output nodes (right)
      equity:     { x: outputX, y: cy - spread * 1.5, label: 'EQUITY',  color: CYAN   },
      debt:       { x: outputX, y: cy - spread * 0.5, label: 'DEBT',    color: PURPLE },
      gold:       { x: outputX, y: cy + spread * 0.5, label: 'GOLD',    color: GOLD   },
      liquid:     { x: outputX, y: cy + spread * 1.5, label: 'LIQUID',  color: TEAL   },
    };
  }, []);

  const recalc = useCallback(() => {
    const alloc = calculate(stateRef.current);
    allocRef.current = alloc;
    pulseRef.current = 1.0;
    setDisplayState({ ...stateRef.current });
    setDisplayAlloc({ ...alloc });

    // Spawn fresh signals
    const splv = sipVsLumpsum(stateRef.current);
    const newSigs: Signal[] = [];
    const paths = ['amount', 'duration', 'risk', 'goal', 'equity', 'debt', 'gold', 'liquid'];
    paths.forEach((p, i) => {
      const count = p === 'equity' ? Math.max(1, Math.round(alloc.equity / 12)) :
                    p === 'debt'   ? Math.max(1, Math.round(alloc.debt   / 15)) :
                    p === 'gold'   ? Math.max(1, Math.round(alloc.gold   / 18)) :
                    p === 'liquid' ? Math.max(1, Math.round(alloc.liquid / 20)) : 2;
      for (let j = 0; j < count; j++) {
        newSigs.push({
          id: signalIdCounter++,
          progress: (j / count),
          pathIndex: i,
          speed: 0.004 + Math.random() * 0.003,
        });
      }
    });
    signalsRef.current = newSigs;
  }, []);

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const t = frameRef.current;
    const boot = bootRef.current;
    const layout = getLayout(W, H);

    ctx.clearRect(0, 0, W, H);

    // -- Grid background ---------------------------------------------
    const gridAlpha = 0.035 + Math.sin(t * 0.04) * 0.008 + (pulseRef.current > 0 ? pulseRef.current * 0.015 : 0);
    ctx.strokeStyle = `rgba(201,168,76,${gridAlpha})`;
    ctx.lineWidth = 0.5;
    const gStep = 38;
    for (let x = 0; x <= W; x += gStep) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y <= H; y += gStep) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    if (boot < 0.01) {
      frameRef.current++;
      rafRef.current = requestAnimationFrame(drawFrame);
      return;
    }

    const alloc = allocRef.current;
    const inp   = stateRef.current;

    // Weight map for path widths
    const weights: Record<string, number> = {
      amount:   1 + (inp.amount / 5000000) * 2,
      duration: 1 + (inp.duration / 30) * 1.5,
      risk:     1 + inp.risk * 0.8,
      goal:     1.2,
      equity:   1 + alloc.equity / 25,
      debt:     1 + alloc.debt   / 30,
      gold:     1 + alloc.gold   / 35,
      liquid:   1 + alloc.liquid / 40,
    };

    const paths = [
      { key: 'amount',   from: layout.amount,   to: layout.center, color: GOLD,   w: weights.amount   },
      { key: 'duration', from: layout.duration,  to: layout.center, color: GOLD,   w: weights.duration },
      { key: 'risk',     from: layout.risk,       to: layout.center, color: GOLD,   w: weights.risk     },
      { key: 'goal',     from: layout.goal,       to: layout.center, color: GOLD,   w: weights.goal     },
      { key: 'equity',   from: layout.center,     to: layout.equity, color: CYAN,   w: weights.equity   },
      { key: 'debt',     from: layout.center,     to: layout.debt,   color: PURPLE, w: weights.debt     },
      { key: 'gold',     from: layout.center,     to: layout.gold,   color: GOLD,   w: weights.gold     },
      { key: 'liquid',   from: layout.center,     to: layout.liquid, color: TEAL,   w: weights.liquid   },
    ];

    // -- Draw signal paths --------------------------------------------
    paths.forEach(p => {
      const alpha = 0.12 + (boot * 0.06);
      ctx.beginPath();
      ctx.moveTo(p.from.x, p.from.y);

      // Slightly curved path via midpoint offset
      const mx = (p.from.x + p.to.x) / 2;
      const my = (p.from.y + p.to.y) / 2;
      const offset = (p.key === 'amount' || p.key === 'equity') ? -12 : 
                     (p.key === 'duration' || p.key === 'debt') ? -4 :
                     (p.key === 'risk' || p.key === 'gold') ? 4 : 12;

      ctx.bezierCurveTo(mx, my + offset, mx, my + offset, p.to.x, p.to.y);
      ctx.strokeStyle = hexAlpha(p.color, alpha);
      ctx.lineWidth = Math.min(4, p.w * 0.7) * boot;
      ctx.stroke();
    });

    // -- Draw signals (moving particles) -----------------------------
    signalsRef.current.forEach(sig => {
      const p = paths[sig.pathIndex];
      if (!p) return;
      const t_pos = sig.progress;

      // Bezier position
      const offset = [-12, -4, 4, 12, -12, -4, 4, 12][sig.pathIndex] ?? 0;
      const fx = p.from.x, fy = p.from.y, tx = p.to.x, ty = p.to.y;
      const mx = (fx + tx) / 2, my = (fy + ty) / 2;
      const cx1 = mx, cy1 = my + offset, cx2 = mx, cy2 = my + offset;

      const bx = cubicBezier(t_pos, fx, cx1, cx2, tx);
      const by = cubicBezier(t_pos, fy, cy1, cy2, ty);

      ctx.beginPath();
      ctx.arc(bx, by, 2.5 * boot, 0, Math.PI * 2);
      ctx.fillStyle = hexAlpha(p.color, 0.85 * boot);
      ctx.fill();

      // Glow
      ctx.beginPath();
      ctx.arc(bx, by, 5 * boot, 0, Math.PI * 2);
      const gr = ctx.createRadialGradient(bx, by, 0, bx, by, 5);
      gr.addColorStop(0, hexAlpha(p.color, 0.35 * boot));
      gr.addColorStop(1, 'transparent');
      ctx.fillStyle = gr;
      ctx.fill();

      sig.progress = (sig.progress + sig.speed) % 1;
    });

    // -- Center computation node --------------------------------------
    const cx = layout.center.x, cy = layout.center.y;
    const pulse = 0.7 + Math.sin(t * 0.08) * 0.3;
    const coreR = 28 * boot;

    // Outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, coreR + 14 + Math.sin(t * 0.05) * 3, 0, Math.PI * 2);
    ctx.strokeStyle = hexAlpha(GOLD, 0.12 * boot);
    ctx.lineWidth = 1;
    ctx.stroke();

    // Mid ring
    ctx.beginPath();
    ctx.arc(cx, cy, coreR + 6, 0, Math.PI * 2);
    ctx.strokeStyle = hexAlpha(GOLD, 0.28 * boot * pulse);
    ctx.lineWidth = 1;
    ctx.stroke();

    // Core fill
    const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
    gr.addColorStop(0, hexAlpha(GOLD, 0.9 * boot));
    gr.addColorStop(0.55, hexAlpha(GOLD, 0.35 * boot));
    gr.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
    ctx.fillStyle = gr;
    ctx.fill();

    // Core label
    ctx.fillStyle = hexAlpha('#050508', 0.9 * boot);
    ctx.font = `${Math.round(8 * boot)}px 'Space Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ENGINE', cx, cy - 5);
    ctx.fillText('CORE', cx, cy + 6);

    // Pulse ring after recalc
    if (pulseRef.current > 0) {
      const pr = (1 - pulseRef.current) * 80 + coreR;
      ctx.beginPath();
      ctx.arc(cx, cy, pr, 0, Math.PI * 2);
      ctx.strokeStyle = hexAlpha(GOLD, pulseRef.current * 0.5);
      ctx.lineWidth = 2;
      ctx.stroke();
      pulseRef.current = Math.max(0, pulseRef.current - 0.025);
    }

    // -- Input nodes --------------------------------------------------
    drawInputNode(ctx, layout.amount, 'AMOUNT',
      `₹${formatAmount(inp.amount)}`,
      GOLD, boot, hoverRef.current === 'amount', t);
    drawInputNode(ctx, layout.duration, 'DURATION',
      `${inp.duration}Y`,
      GOLD, boot, hoverRef.current === 'duration', t);
    drawInputNode(ctx, layout.risk, 'RISK',
      RISK_LABELS[inp.risk],
      GOLD, boot, hoverRef.current === 'risk', t);
    drawInputNode(ctx, layout.goal, 'GOAL',
      GOAL_LABELS[inp.goal],
      GOLD, boot, hoverRef.current === 'goal', t);

    // -- Output nodes -------------------------------------------------
    drawOutputNode(ctx, layout.equity, 'EQUITY', `${alloc.equity}%`, CYAN,   alloc.equity / 100, boot, t);
    drawOutputNode(ctx, layout.debt,   'DEBT',   `${alloc.debt}%`,   PURPLE, alloc.debt   / 100, boot, t);
    drawOutputNode(ctx, layout.gold,   'GOLD',   `${alloc.gold}%`,   GOLD,   alloc.gold   / 100, boot, t);
    drawOutputNode(ctx, layout.liquid, 'LIQUID', `${alloc.liquid}%`, TEAL,   alloc.liquid / 100, boot, t);

    // Tick
    frameRef.current++;
    bootRef.current = Math.min(1, bootRef.current + 0.015);
    rafRef.current = requestAnimationFrame(drawFrame);
  }, [getLayout]);

  // -- Input interaction ----------------------------------------------------
  const getNodeAt = useCallback((x: number, y: number, W: number, H: number) => {
    const layout = getLayout(W, H);
    const nodes = ['amount', 'duration', 'risk', 'goal'] as const;
    for (const n of nodes) {
      const pos = layout[n];
      const dist = Math.hypot(x - pos.x, y - pos.y);
      if (dist < 34) return n;
    }
    return null;
  }, [getLayout]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top)  * (canvas.height / rect.height);

    if (draggingRef.current) {
      const { node, startY, startVal } = draggingRef.current;
      const dy = startY - e.clientY; // drag up = increase
      const inp = stateRef.current;

      if (node === 'amount') {
        const range = 4900000;
        const delta = (dy / 200) * range;
        stateRef.current = { ...inp, amount: Math.round(Math.max(100000, Math.min(5000000, startVal + delta)) / 50000) * 50000 };
      } else if (node === 'duration') {
        const delta = Math.round(dy / 10);
        stateRef.current = { ...inp, duration: Math.max(1, Math.min(30, startVal + delta)) };
      } else if (node === 'risk') {
        const delta = Math.round(dy / 30);
        stateRef.current = { ...inp, risk: Math.max(0, Math.min(2, startVal + delta)) as 0 | 1 | 2 };
      } else if (node === 'goal') {
        const delta = Math.round(dy / 30);
        stateRef.current = { ...inp, goal: Math.max(0, Math.min(3, startVal + delta)) as 0 | 1 | 2 | 3 };
      }
      recalc();
      return;
    }

    const hit = getNodeAt(mx, my, canvas.width, canvas.height);
    hoverRef.current = hit;
    canvas.style.cursor = hit ? 'ns-resize' : 'default';
  }, [getNodeAt, recalc]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top)  * (canvas.height / rect.height);

    const hit = getNodeAt(mx, my, canvas.width, canvas.height);
    if (!hit) return;

    const inp = stateRef.current;
    const startVal = hit === 'amount' ? inp.amount :
                     hit === 'duration' ? inp.duration :
                     hit === 'risk' ? inp.risk : inp.goal;
    draggingRef.current = { node: hit, startY: e.clientY, startVal };
    e.preventDefault();
  }, [getNodeAt]);

  const handleMouseUp = useCallback(() => {
    draggingRef.current = null;
  }, []);

  // -- Touch -----------------------------------------------------------------
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !e.touches[0]) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.touches[0].clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.touches[0].clientY - rect.top)  * (canvas.height / rect.height);
    const hit = getNodeAt(mx, my, canvas.width, canvas.height);
    if (!hit) return;
    const inp = stateRef.current;
    const startVal = hit === 'amount' ? inp.amount :
                     hit === 'duration' ? inp.duration :
                     hit === 'risk' ? inp.risk : inp.goal;
    draggingRef.current = { node: hit, startY: e.touches[0].clientY, startVal };
    e.preventDefault();
  }, [getNodeAt]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!e.touches[0] || !draggingRef.current) return;
    const { node, startY, startVal } = draggingRef.current;
    const dy = startY - e.touches[0].clientY;
    const inp = stateRef.current;

    if (node === 'amount') {
      const range = 4900000;
      stateRef.current = { ...inp, amount: Math.round(Math.max(100000, Math.min(5000000, startVal + (dy / 200) * range)) / 50000) * 50000 };
    } else if (node === 'duration') {
      stateRef.current = { ...inp, duration: Math.max(1, Math.min(30, startVal + Math.round(dy / 10))) };
    } else if (node === 'risk') {
      stateRef.current = { ...inp, risk: Math.max(0, Math.min(2, startVal + Math.round(dy / 30))) as 0 | 1 | 2 };
    } else if (node === 'goal') {
      stateRef.current = { ...inp, goal: Math.max(0, Math.min(3, startVal + Math.round(dy / 30))) as 0 | 1 | 2 | 3 };
    }
    recalc();
    e.preventDefault();
  }, [recalc]);

  // -- Resize ----------------------------------------------------------------
  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width  = canvas.offsetWidth  * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    resize();
    recalc();

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleMouseUp);
    window.addEventListener('resize', resize);

    // Boot animation
    setTimeout(() => { bootRef.current = 0.01; setBooted(true); }, 100);
    rafRef.current = requestAnimationFrame(drawFrame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleMouseUp);
      window.removeEventListener('resize', resize);
    };
  }, [resize, recalc, drawFrame, handleMouseMove, handleMouseDown, handleMouseUp, handleTouchStart, handleTouchMove]);

  const splv = sipVsLumpsum(displayState);

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
      {/* Full canvas */}
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        style={{
          position: 'absolute', top: '1.6rem', left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center', zIndex: 10, pointerEvents: 'none',
        }}
      >
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.45rem', letterSpacing: '0.5em',
          color: `${GOLD}88`,
        }}>
          FINANCIAL ENGINE -- ACTIVE
        </div>
      </motion.div>

      {/* Left label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: booted ? 1 : 0 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        style={{
          position: 'absolute', left: '1.2rem', top: '50%',
          transform: 'translateY(-50%) rotate(-90deg)',
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.42rem', letterSpacing: '0.4em',
          color: `${GOLD}40`,
          pointerEvents: 'none', whiteSpace: 'nowrap',
          transformOrigin: 'center center',
        }}
      >
        INPUT PARAMETERS
      </motion.div>

      {/* Right label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: booted ? 1 : 0 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        style={{
          position: 'absolute', right: '1.2rem', top: '50%',
          transform: 'translateY(-50%) rotate(90deg)',
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.42rem', letterSpacing: '0.4em',
          color: `${GOLD}40`,
          pointerEvents: 'none', whiteSpace: 'nowrap',
          transformOrigin: 'center center',
        }}
      >
        ALLOCATION OUTPUT
      </motion.div>

      {/* Drag hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: booted ? 1 : 0 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 2, duration: 1 }}
        style={{
          position: 'absolute', bottom: '1.4rem', left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.42rem', letterSpacing: '0.35em',
          color: 'rgba(140,138,134,0.28)',
          whiteSpace: 'nowrap', pointerEvents: 'none',
        }}
      >
        DRAG NODES ↑↓ TO ADJUST -- ENGINE RECALCULATES LIVE
      </motion.div>

      {/* SIP / Lumpsum breakdown -- bottom center panel */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: booted ? 1 : 0, y: booted ? 0 : 16 }}
        transition={{ delay: 1.8, duration: 0.9 }}
        style={{
          position: 'absolute', bottom: '3.8rem', left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10, display: 'flex', gap: '2.4rem',
          alignItems: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.42rem', letterSpacing: '0.35em',
            color: `${GOLD}55`,
          }}>SIP MONTHLY</div>
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.85rem', color: GOLD,
            marginTop: '0.2rem',
          }}>
            ₹{formatAmount(Math.round(splv.sip / (displayState.duration * 12)))}
          </div>
        </div>
        <div style={{ width: 1, height: 32, background: `${GOLD}20` }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.42rem', letterSpacing: '0.35em',
            color: `${GOLD}55`,
          }}>LUMPSUM</div>
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.85rem', color: GOLD,
            marginTop: '0.2rem',
          }}>
            ₹{formatAmount(splv.lumpsum)}
          </div>
        </div>
        <div style={{ width: 1, height: 32, background: `${GOLD}20` }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.42rem', letterSpacing: '0.35em',
            color: `${GOLD}55`,
          }}>TOTAL CORPUS</div>
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.85rem', color: '#F0EFEA',
            marginTop: '0.2rem',
          }}>
            ₹{formatAmount(estimateCorpus(displayState))}
          </div>
        </div>
      </motion.div>

      {/* Back button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: booted ? 1 : 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        onClick={onBack}
        style={{
          position: 'absolute', top: '1.6rem', left: '2rem',
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.52rem', letterSpacing: '0.32em',
          color: `${GOLD}66`,
          zIndex: 20, padding: 0,
        }}
        onMouseEnter={e => (e.currentTarget.style.color = `${GOLD}CC`)}
        onMouseLeave={e => (e.currentTarget.style.color = `${GOLD}66`)}
      >
        ← SYSTEM MAP
      </motion.button>
    </div>
  );
}

// -- Draw helpers ---------------------------------------------------------

function drawInputNode(
  ctx: CanvasRenderingContext2D,
  pos: { x: number; y: number },
  label: string,
  value: string,
  color: string,
  boot: number,
  hovered: boolean,
  t: number,
) {
  const r = (hovered ? 26 : 22) * boot;
  const pulse = hovered ? 1 : 0.7 + Math.sin(t * 0.07) * 0.3;

  // Glow
  const gr = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, r * 2.2);
  gr.addColorStop(0, hexAlpha(color, 0.08 * boot * pulse));
  gr.addColorStop(1, 'transparent');
  ctx.beginPath(); ctx.arc(pos.x, pos.y, r * 2.2, 0, Math.PI * 2);
  ctx.fillStyle = gr; ctx.fill();

  // Border
  ctx.beginPath(); ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
  ctx.strokeStyle = hexAlpha(color, (hovered ? 0.65 : 0.30) * boot);
  ctx.lineWidth = hovered ? 1.5 : 1;
  ctx.stroke();

  // Inner dot
  ctx.beginPath(); ctx.arc(pos.x, pos.y, 4 * boot, 0, Math.PI * 2);
  ctx.fillStyle = hexAlpha(color, 0.8 * boot);
  ctx.fill();

  // Label above
  ctx.fillStyle = hexAlpha(color, 0.55 * boot);
  ctx.font = `${Math.round(7.5 * boot)}px 'Space Mono', monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(label, pos.x, pos.y - r - 5);

  // Value below
  ctx.fillStyle = hexAlpha('#F0EFEA', 0.85 * boot);
  ctx.font = `bold ${Math.round(9.5 * boot)}px 'Space Mono', monospace`;
  ctx.textBaseline = 'top';
  ctx.fillText(value, pos.x, pos.y + r + 5);

  // Drag arrows hint
  if (hovered) {
    ctx.fillStyle = hexAlpha(color, 0.45 * boot);
    ctx.font = `${Math.round(9 * boot)}px monospace`;
    ctx.textBaseline = 'middle';
    ctx.fillText('↑↓', pos.x + r + 10, pos.y);
  }
}

function drawOutputNode(
  ctx: CanvasRenderingContext2D,
  pos: { x: number; y: number },
  label: string,
  value: string,
  color: string,
  weight: number,  // 0-1
  boot: number,
  t: number,
) {
  const baseR = 20;
  const r = (baseR + weight * 14) * boot;
  const pulse = 0.7 + Math.sin(t * 0.06 + weight * 3) * 0.3;

  // Glow proportional to weight
  const gr = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, r * 2.5);
  gr.addColorStop(0, hexAlpha(color, weight * 0.18 * boot * pulse));
  gr.addColorStop(1, 'transparent');
  ctx.beginPath(); ctx.arc(pos.x, pos.y, r * 2.5, 0, Math.PI * 2);
  ctx.fillStyle = gr; ctx.fill();

  // Ring  
  ctx.beginPath(); ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
  ctx.strokeStyle = hexAlpha(color, (0.2 + weight * 0.45) * boot);
  ctx.lineWidth = 1 + weight * 2;
  ctx.stroke();

  // Filled arc showing weight
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
  ctx.arc(pos.x, pos.y, r * 0.75, -Math.PI / 2, -Math.PI / 2 + weight * Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = hexAlpha(color, 0.18 * boot);
  ctx.fill();

  // Center dot
  ctx.beginPath(); ctx.arc(pos.x, pos.y, 3.5 * boot, 0, Math.PI * 2);
  ctx.fillStyle = hexAlpha(color, 0.9 * boot);
  ctx.fill();

  // Label
  ctx.fillStyle = hexAlpha(color, 0.55 * boot);
  ctx.font = `${Math.round(7.5 * boot)}px 'Space Mono', monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(label, pos.x, pos.y - r - 5);

  // Value
  ctx.fillStyle = hexAlpha(color, 0.9 * boot);
  ctx.font = `bold ${Math.round(11 * boot)}px 'Space Mono', monospace`;
  ctx.textBaseline = 'top';
  ctx.fillText(value, pos.x, pos.y + r + 5);
}

// -- Math helpers ---------------------------------------------------------

function cubicBezier(t: number, p0: number, p1: number, p2: number, p3: number) {
  const u = 1 - t;
  return u*u*u*p0 + 3*u*u*t*p1 + 3*u*t*t*p2 + t*t*t*p3;
}

function hexAlpha(hex: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha));
  if (hex.startsWith('#')) {
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return `rgba(${r},${g},${b},${a.toFixed(3)})`;
  }
  return hex;
}

function formatAmount(n: number): string {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000)   return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)     return `${(n / 1000).toFixed(0)}K`;
  return `${n}`;
}

function estimateCorpus(inp: InputState): number {
  const returns = [0.09, 0.11, 0.13][inp.risk];
  const months = inp.duration * 12;
  const monthly = inp.amount * 0.65 / (inp.duration * 12);
  const sipCorpus = monthly * ((Math.pow(1 + returns/12, months) - 1) / (returns/12));
  const lumpsumCorpus = (inp.amount * 0.35) * Math.pow(1 + returns, inp.duration);
  return Math.round(sipCorpus + lumpsumCorpus);
}
