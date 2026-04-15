import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { getScrollState } from '../hooks/useScrollCamera';

// Node id → page route
const NODE_ROUTES: Record<string, string> = {
  mera:    '/merapolicy',
  saver:   '/supersaver',
  recall:  '/recall',
  recflow: '/recflow',
};

// ── Node definitions ────────────────────────────────────────────────────
// z: true depth in 3D space. 0 = foreground (core), 1 = far background.
// Perspective projection: scale = FOCAL / (FOCAL + z * DEPTH_SCALE)
const FOCAL        = 900;   // focal length — controls perspective strength
const DEPTH_SCALE  = 420;   // how many units deep the z=1 nodes are

const NODES = [
  { id: 'core',    label: 'SIDDHANT',          sub: '— core system',        x: 0.44, y: 0.51, color: '#ECEAE2', r: 4.0, z: 0.00, bootAt: 1.8 },
  { id: 'mera',    label: 'MeraPolicyAdvisor',  sub: '— financial engine',   x: 0.13, y: 0.19, color: '#C9A84C', r: 2.8, z: 0.72, bootAt: 5.2 },
  { id: 'saver',   label: 'Super Saver',         sub: '— optimization layer', x: 0.79, y: 0.27, color: '#00D4FF', r: 2.6, z: 0.28, bootAt: 6.8 },
  { id: 'recall',  label: 'Recall',              sub: '— memory layer',       x: 0.21, y: 0.78, color: '#7B4FE8', r: 2.4, z: 0.60, bootAt: 8.4 },
  { id: 'recflow', label: 'RecFlow',              sub: '— recording layer',    x: 0.83, y: 0.74, color: '#E8503A', r: 2.0, z: 0.85, bootAt: 9.6 },
] as const;

const EDGES = [
  { a: 0, b: 1, bootAt: 4.0 },
  { a: 0, b: 2, bootAt: 6.0 },
  { a: 0, b: 3, bootAt: 7.6 },
  { a: 0, b: 4, bootAt: 9.0 },
];

type SignalKind = 'out' | 'fail' | 'reverse' | 'event';

interface Signal {
  edge: number;
  t: number;
  speed: number;
  alpha: number;
  kind: SignalKind;
  dieAt: number;
  delay: number;
  born: number;
}

interface EdgeState {
  alpha: number;
  target: number;
  nextToggle: number;
  booted: boolean;
}

interface SystemEvent {
  edge: number;
  phase: 'ramp' | 'hold' | 'fade';
  alpha: number;
  timer: number;
}

// ── Perspective projection ───────────────────────────────────────────────
// Projects a normalised (nx, ny) in screen-space + a z-depth into
// screen pixel coords, accounting for the canvas centre as vanishing point.
function project(
  nx: number, ny: number, z: number,
  W: number, H: number,
  camX: number, camY: number,
  jox = 0, joy = 0,
) {
  const scale  = FOCAL / (FOCAL + z * DEPTH_SCALE);
  // Offset from vanishing point (screen centre), scaled by perspective
  const vpX = W * 0.5, vpY = H * 0.5;
  const wx  = nx * W + jox + camX * (1 - z * 0.6);
  const wy  = ny * H + joy + camY * (1 - z * 0.6);
  const sx  = vpX + (wx - vpX) * scale;
  const sy  = vpY + (wy - vpY) * scale;
  return { sx, sy, scale };
}

export default function UniverseToSystem() {
  const wrapRef   = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Slow camera parallax mouse (existing)
  const mouseRef       = useRef({ x: 0.5, y: 0.5 });
  const targetMouseRef = useRef({ x: 0.5, y: 0.5 });

  // Cursor field — separate inertia from camera parallax (faster, more local)
  const cursorRef  = useRef({ x: 0.5, y: 0.5 });   // smoothed cursor (px normalised)
  const cursorRawRef = useRef({ x: 0.5, y: 0.5 }); // raw cursor

  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const hoveredRef  = useRef<string | null>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap   = wrapRef.current;
    if (!canvas || !wrap) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = wrap.offsetWidth;
    let H = window.innerHeight;
    const ctx = canvas.getContext('2d', { alpha: true })!;

    const resize = () => {
      W = wrap.offsetWidth; H = window.innerHeight;
      canvas.width  = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // ── Mouse ──────────────────────────────────────────────────────
    const onMouse = (e: MouseEvent) => {
      const r = wrap.getBoundingClientRect();
      targetMouseRef.current.x = (e.clientX - r.left) / r.width;
      targetMouseRef.current.y = (e.clientY - r.top)  / r.height;
      cursorRawRef.current.x   = (e.clientX - r.left) / r.width;
      cursorRawRef.current.y   = (e.clientY - r.top)  / r.height;
    };
    const onHover = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      let found: string | null = null;
      for (let i = 0; i < NODES.length; i++) {
        const n = NODES[i];
        const scale = FOCAL / (FOCAL + n.z * DEPTH_SCALE);
        const vpX = W * 0.5, vpY = H * 0.5;
        const wx = n.x * W;
        const wy = n.y * H;
        const sx = vpX + (wx - vpX) * scale;
        const sy = vpY + (wy - vpY) * scale;
        const hitR = n.r * scale * 8 + 12;
        if (Math.hypot(mx - sx, my - sy) < hitR) { found = n.id; break; }
      }
      if (found !== hoveredRef.current) { hoveredRef.current = found; setHoveredNode(found); }
    };
    const onClick = () => {
      const h = hoveredRef.current;
      if (h && NODE_ROUTES[h]) navigate(NODE_ROUTES[h]);
    };
    wrap.addEventListener('mousemove', onMouse);
    wrap.addEventListener('mousemove', onHover);
    wrap.addEventListener('click', onClick);

    // ── Boot clock ─────────────────────────────────────────────────
    const bootStart = performance.now();
    const bt = () => (performance.now() - bootStart) / 1000;

    const nodeAlpha = NODES.map(() => 0);
    const edges: EdgeState[] = EDGES.map(() => ({ alpha: 0, target: 0, nextToggle: 0, booted: false }));
    const signals: Signal[] = [];

    let lastBeatAt  = -999;
    let corePhase   = 0;
    let coreBeat    = 0;
    let driftT      = 0;
    let activeEvent: SystemEvent | null = null;
    let lastEventAt = 0;

    // ── Cursor field state ─────────────────────────────────────────
    // Per-edge: proximity influence [0–1], inertia-smoothed
    const edgeProximity  = EDGES.map(() => 0);
    // Per-node: cursor proximity [0–1]
    const nodeProximity  = NODES.map(() => 0);
    // Core proximity — drives glow tightening + pulse sharpening
    let coreProximity    = 0;
    // Last time a path-wake signal was spawned per edge
    const lastPathWake   = EDGES.map(() => -9999);

    const jitter = NODES.map(() => ({
      ox: 0, oy: 0,
      tx: (Math.random() - 0.5) * 0.6,
      ty: (Math.random() - 0.5) * 0.6,
      spd: 0.003 + Math.random() * 0.003,
    }));

    const lerp     = (a: number, b: number, t: number) => a + (b - a) * t;
    const clamp    = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
    const easeOut3 = (t: number) => 1 - Math.pow(1 - t, 3);

    const spawnSignal = (edgeIdx: number, kind: SignalKind, now: number, delayMs = 0) => {
      const isRev = kind === 'reverse';
      signals.push({
        edge: edgeIdx,
        t: isRev ? 1 : 0,
        speed: kind === 'event'
          ? 0.0042 + Math.random() * 0.002
          : 0.0009 + Math.random() * 0.0008,
        alpha: kind === 'event'  ? 0.80 + Math.random() * 0.15
             : kind === 'fail'   ? 0.18 + Math.random() * 0.12
             : kind === 'reverse'? 0.16 + Math.random() * 0.10
             : 0.32 + Math.random() * 0.22,
        kind,
        dieAt: kind === 'fail' ? 0.15 + Math.random() * 0.50 : 1.1,
        delay: delayMs / 1000,
        born: now,
      });
    };

    const triggerEvent = (now: number) => {
      const available = edges.map((e, i) => ({ i, e })).filter(({ e }) => e.booted && e.alpha > 0.3);
      if (!available.length) return;
      const pick = available[Math.floor(Math.random() * available.length)];
      activeEvent = { edge: pick.i, phase: 'ramp', alpha: 0, timer: 400 };
      spawnSignal(pick.i, 'event', now, 150);
      lastEventAt = now;
    };

    let raf: number;
    let tick = 0, lastNow = performance.now();

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const dt = Math.min(now - lastNow, 50);
      lastNow = now;
      tick++;

      // Skip draw entirely when hero is scrolled out of view
      // (canvas is position:absolute so it scrolls with page)
      if (wrap) {
        const wr = wrap.getBoundingClientRect();
        if (wr.bottom < -50 || wr.top > window.innerHeight + 50) {
          ctx.clearRect(0, 0, W, H);
          return;
        }
      }

      const t = bt();

      // ── Camera ──────────────────────────────────────────────────
      driftT += dt * 0.000055;
      const driftX = Math.sin(driftT * 0.7) * 6 + Math.sin(driftT * 0.29) * 3.5;
      const driftY = Math.cos(driftT * 0.5) * 5 + Math.cos(driftT * 0.17) * 2.5;

      mouseRef.current.x = lerp(mouseRef.current.x, targetMouseRef.current.x, 0.028);
      mouseRef.current.y = lerp(mouseRef.current.y, targetMouseRef.current.y, 0.028);
      const parallaxX = (mouseRef.current.x - 0.5) * 12;
      const parallaxY = (mouseRef.current.y - 0.5) * 9;

      const camX = driftX + parallaxX;
      const camY = driftY + parallaxY;

      // ── Cursor field — inertia-smoothed, faster than camera ────
      // Cursor tracks at ~60ms lag (0.055 lerp factor)
      cursorRef.current.x = lerp(cursorRef.current.x, cursorRawRef.current.x, 0.055);
      cursorRef.current.y = lerp(cursorRef.current.y, cursorRawRef.current.y, 0.055);
      const curPx = cursorRef.current.x * W; // cursor in screen pixels
      const curPy = cursorRef.current.y * H;

      // ── Jitter ─────────────────────────────────────────────────
      jitter.forEach(j => {
        j.ox = lerp(j.ox, j.tx, j.spd);
        j.oy = lerp(j.oy, j.ty, j.spd);
        if (Math.abs(j.ox - j.tx) < 0.02) j.tx = (Math.random() - 0.5) * 0.6;
        if (Math.abs(j.oy - j.ty) < 0.02) j.ty = (Math.random() - 0.5) * 0.6;
      });

      // ── Node boot ──────────────────────────────────────────────
      NODES.forEach((n, i) => {
        const elapsed = t - n.bootAt;
        nodeAlpha[i] = elapsed < 0 ? 0 : clamp(easeOut3(Math.min(elapsed / 1.6, 1)), 0, 1);
      });

      // ── Cursor field — proximity update ────────────────────────
      // Project all nodes at current camera to get screen positions
      // (lightweight — same math as draw, no allocation)
      NODES.forEach((n, i) => {
        const { sx, sy, scale } = project(n.x, n.y, n.z, W, H, camX, camY, jitter[i].ox, jitter[i].oy);
        const dist  = Math.hypot(curPx - sx, curPy - sy);
        const range = 160 + (1 - n.z) * 80; // foreground nodes have wider influence field
        const raw   = clamp(1 - dist / range, 0, 1);
        // Inertia: approach fast, settle back slowly
        const speed = raw > nodeProximity[i] ? 0.08 : 0.018;
        nodeProximity[i] = lerp(nodeProximity[i], raw, speed);
      });
      // Core proximity specifically
      coreProximity = nodeProximity[0];

      // Edge proximity — cursor near the midpoint of an edge
      EDGES.forEach((edge, ei) => {
        if (!edges[ei].booted) { edgeProximity[ei] = 0; return; }
        const pA = { ...project(NODES[edge.a].x, NODES[edge.a].y, NODES[edge.a].z, W, H, camX, camY, jitter[edge.a].ox, jitter[edge.a].oy) };
        const pB = { ...project(NODES[edge.b].x, NODES[edge.b].y, NODES[edge.b].z, W, H, camX, camY, jitter[edge.b].ox, jitter[edge.b].oy) };
        // Distance from cursor to line segment (midpoint approximation — cheap)
        const mx = (pA.sx + pB.sx) * 0.5, my = (pA.sy + pB.sy) * 0.5;
        const dist = Math.hypot(curPx - mx, curPy - my);
        const raw  = clamp(1 - dist / 180, 0, 1);
        const speed = raw > edgeProximity[ei] ? 0.10 : 0.015;
        edgeProximity[ei] = lerp(edgeProximity[ei], raw, speed);

        // Path wake-up — cursor approaches edge → spawn faint signal
        if (raw > 0.55 && edgeProximity[ei] > 0.40 && now - lastPathWake[ei] > 2200) {
          spawnSignal(ei, 'out', now, 0);
          lastPathWake[ei] = now;
        }
      });

      // ── Scroll reactivity ──────────────────────────────────────
      const scroll    = getScrollState();
      const scrollMom = scroll.momentum;    // 0–1
      // Beat interval shrinks when scrolling fast (system becomes more active)
      const beatInterval = 3200 - scrollMom * 1400;  // 3200ms idle → 1800ms fast

      // ── Core beat ──────────────────────────────────────────────
      corePhase += dt * (0.0004 + scrollMom * 0.0002);
      if (t > 2 && now - lastBeatAt > beatInterval) {
        coreBeat = Math.min(1, 0.85 + scrollMom * 0.15);
        lastBeatAt = now;
        EDGES.forEach((_, ei) => {
          if (!edges[ei].booted) return;
          const delay = ei * 200 + Math.random() * 140;
          // On fast scroll: more event signals, fewer fails
          const kind: SignalKind = scrollMom > 0.5
            ? (Math.random() < 0.40 ? 'event' : 'out')
            : Math.random() < 0.28 ? 'fail'
            : Math.random() < 0.14 ? 'reverse' : 'out';
          spawnSignal(ei, kind, now, delay);
        });
      }
      // Decay faster when idle, slower when scrolling
      coreBeat = Math.max(0, coreBeat - dt * (0.0022 - scrollMom * 0.0008));

      // ── Edge cycling ───────────────────────────────────────────
      EDGES.forEach((e, ei) => {
        if (t < e.bootAt) return;
        if (!edges[ei].booted) {
          edges[ei].booted = true; edges[ei].target = 1;
          edges[ei].nextToggle = now + 5000 + Math.random() * 4000;
        }
        if (now > edges[ei].nextToggle) {
          const vis = edges.filter(e => e.target > 0.5).length;
          if (edges[ei].target > 0.5) {
            if (vis > 1 && Math.random() < 0.45) {
              edges[ei].target = 0; edges[ei].nextToggle = now + 4000 + Math.random() * 6000;
            } else { edges[ei].nextToggle = now + 3000 + Math.random() * 4000; }
          } else {
            if (vis < 2) { edges[ei].target = 1; edges[ei].nextToggle = now + 4000 + Math.random() * 5000; }
            else { edges[ei].nextToggle = now + 2000 + Math.random() * 3000; }
          }
        }
        edges[ei].alpha += (edges[ei].target - edges[ei].alpha) * 0.006;
      });

      // ── System event lifecycle ─────────────────────────────────
      if (!activeEvent && t > 8 && now - lastEventAt > lerp(7000, 4000, clamp((t - 8) / 12, 0, 1))) {
        triggerEvent(now);
      }
      if (activeEvent) {
        activeEvent.timer -= dt;
        switch (activeEvent.phase) {
          case 'ramp':
            activeEvent.alpha = lerp(activeEvent.alpha, 1, 0.08);
            if (activeEvent.timer <= 0) { activeEvent.phase = 'hold'; activeEvent.timer = 600; }
            break;
          case 'hold':
            if (activeEvent.timer <= 0) { activeEvent.phase = 'fade'; activeEvent.timer = 900; }
            break;
          case 'fade':
            activeEvent.alpha = lerp(activeEvent.alpha, 0, 0.012);
            if (activeEvent.timer <= 0 || activeEvent.alpha < 0.01) activeEvent = null;
            break;
        }
      }

      // ── Advance signals ────────────────────────────────────────
      for (let i = signals.length - 1; i >= 0; i--) {
        const s = signals[i];
        if ((now - s.born) / 1000 < s.delay) continue;
        const dir = s.kind === 'reverse' ? -1 : 1;
        s.t += s.speed * dir;
        const done     = s.kind === 'reverse' ? s.t <= -0.05 : s.t >= 1.08;
        const fadeDead = s.kind === 'fail' && s.t > s.dieAt + 0.22;
        if (done || fadeDead) signals.splice(i, 1);
      }

      // ── DRAW ───────────────────────────────────────────────────
      ctx.save();
      ctx.clearRect(0, 0, W, H);

      // Project all nodes
      const projected = NODES.map((n, i) => {
        const { sx, sy, scale } = project(n.x, n.y, n.z, W, H, camX, camY, jitter[i].ox, jitter[i].oy);
        return { n, i, sx, sy, scale };
      });

      // Core projected position (for light pool)
      const core = projected[0];
      const coreNA = nodeAlpha[0];

      // ── Core light pool ────────────────────────────────────────
      if (coreNA > 0.01) {
        const breathe   = 0.5 + Math.sin(corePhase * Math.PI * 2) * 0.5;
        const beatBoost = coreBeat * 0.06;
        const gA = coreNA * (0.055 + breathe * 0.022 + beatBoost);
        const poolR = Math.min(W, H) * 0.42;
        const cg = ctx.createRadialGradient(core.sx, core.sy, 0, core.sx, core.sy, poolR);
        cg.addColorStop(0,    `rgba(235,233,225,${gA * 1.6})`);
        cg.addColorStop(0.22, `rgba(180,178,172,${gA * 0.60})`);
        cg.addColorStop(0.55, `rgba(0,140,180,${gA * 0.10})`);
        cg.addColorStop(1,    'rgba(0,0,0,0)');
        ctx.fillStyle = cg;
        ctx.fillRect(0, 0, W, H);
      }

      // ── EDGES — drawn back to front by satellite z-depth ────────
      [...EDGES].map((edge, ei) => ({ edge, ei }))
        .sort((a, b) => NODES[a.edge.b].z - NODES[b.edge.b].z)
        .reverse()
        .forEach(({ edge, ei }) => {
          const ea = edges[ei].alpha;
          if (ea < 0.005) return;

          const pA = projected[edge.a];
          const pB = projected[edge.b];

          // Depth-based opacity: edges to deep nodes are dimmer
          const depthDim = lerp(1.0, 0.28, NODES[edge.b].z);
          const flicker  = 1 - Math.sin(tick * (0.06 + ei * 0.025) + ei * 1.9) * 0.055;
          const ep       = edgeProximity[ei]; // cursor proximity [0–1]
          // Cursor lifts edge brightness subtly (path wake response)
          const finalA   = ea * flicker * depthDim * (0.80 + ep * 0.22);

          // Line width scales with depth, cursor proximity adds slight width
          const avgScale  = (pA.scale + pB.scale) * 0.5;
          const lineW     = (0.5 + ep * 0.25) * avgScale + 0.1;

          ctx.setLineDash([3 + ei * 0.9, 2 + ei * 0.5]);
          ctx.lineDashOffset = -(tick * (0.10 + ei * 0.028) + ei * 50);

          const g = ctx.createLinearGradient(pA.sx, pA.sy, pB.sx, pB.sy);
          // Core end bright → satellite fades; cursor proximity shifts all stops up
          g.addColorStop(0,   `rgba(210,208,200,${finalA * (0.45 + ep * 0.15)})`);
          g.addColorStop(0.4, `rgba(120,130,160,${finalA * (0.22 + ep * 0.08)})`);
          g.addColorStop(1,   `rgba(40,50,80,${finalA   * (0.07 + ep * 0.04)})`);
          ctx.strokeStyle = g;
          ctx.lineWidth   = lineW;
          ctx.beginPath(); ctx.moveTo(pA.sx, pA.sy); ctx.lineTo(pB.sx, pB.sy); ctx.stroke();
          ctx.setLineDash([]);

          // System event overlay
          if (activeEvent?.edge === ei && activeEvent) {
            const evG = ctx.createLinearGradient(pA.sx, pA.sy, pB.sx, pB.sy);
            evG.addColorStop(0,    `rgba(225,223,215,${activeEvent.alpha * 0.60})`);
            evG.addColorStop(0.45, `rgba(0,212,255,${activeEvent.alpha * 0.42})`);
            evG.addColorStop(1,    `rgba(60,70,110,${activeEvent.alpha * 0.14})`);
            ctx.strokeStyle = evG;
            ctx.lineWidth   = lineW * 1.8;
            ctx.beginPath(); ctx.moveTo(pA.sx, pA.sy); ctx.lineTo(pB.sx, pB.sy); ctx.stroke();
          }

          // Hover highlight
          const isHoverEdge = hoveredRef.current === NODES[edge.a].id
            || hoveredRef.current === NODES[edge.b].id;
          if (isHoverEdge) {
            const hg = ctx.createLinearGradient(pA.sx, pA.sy, pB.sx, pB.sy);
            hg.addColorStop(0,   'rgba(215,213,205,0.22)');
            hg.addColorStop(0.5, 'rgba(0,212,255,0.14)');
            hg.addColorStop(1,   'rgba(50,60,90,0.05)');
            ctx.strokeStyle = hg;
            ctx.lineWidth   = lineW * 1.6;
            ctx.beginPath(); ctx.moveTo(pA.sx, pA.sy); ctx.lineTo(pB.sx, pB.sy); ctx.stroke();
          }
        });

      // ── SIGNALS ─────────────────────────────────────────────────
      signals.forEach(s => {
        if ((now - s.born) / 1000 < s.delay) return;

        const edge = EDGES[s.edge];
        const pA   = projected[edge.a];
        const pB   = projected[edge.b];

        // Signal position in screen space — lerp between projected endpoints
        const hx = lerp(pA.sx, pB.sx, s.t);
        const hy = lerp(pA.sy, pB.sy, s.t);

        // Scale and alpha at current t — signals shrink+fade as they go deeper
        // For 'out' signals: t=0 at core (scale=1), t=1 at satellite (smaller/dimmer)
        const tScale = lerp(pA.scale, pB.scale, s.t);
        const depthZ = lerp(NODES[edge.a].z, NODES[edge.b].z, s.t);
        const depthDim = lerp(1.0, 0.35, depthZ);

        let alpha = s.alpha * depthDim;
        if (s.kind === 'fail' && s.t > s.dieAt) {
          alpha *= clamp(1 - (s.t - s.dieAt) / 0.22, 0, 1);
        }
        if (alpha < 0.005) return;

        const tailLen = s.kind === 'event' ? 0.11 : 0.07;
        const isRev   = s.kind === 'reverse';
        const trailT  = isRev ? Math.min(1, s.t + tailLen) : Math.max(0, s.t - tailLen);
        const tx = lerp(pA.sx, pB.sx, trailT);
        const ty = lerp(pA.sy, pB.sy, trailT);

        const col = s.kind === 'event'   ? '0,212,255'
                  : s.kind === 'reverse' ? '155,135,255'
                  : '0,200,240';

        const tg = ctx.createLinearGradient(tx, ty, hx, hy);
        tg.addColorStop(0, `rgba(${col},0)`);
        tg.addColorStop(1, `rgba(${col},${alpha * (s.kind === 'event' ? 0.80 : 0.55)})`);
        ctx.strokeStyle = tg;
        ctx.lineWidth   = (s.kind === 'event' ? 1.1 : 0.7) * tScale;
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke();

        // Head dot — shrinks with depth
        const dotR = (s.kind === 'event' ? 1.7 : 1.1) * tScale;
        ctx.globalAlpha = alpha * (s.kind === 'event' ? 0.90 : 0.72);
        ctx.fillStyle   = `rgb(${col})`;
        ctx.beginPath(); ctx.arc(hx, hy, dotR, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      });

      // ── NODES — back to front (largest z first) ──────────────────
      [...projected]
        .sort((a, b) => b.n.z - a.n.z)
        .forEach(({ n, i, sx, sy, scale }) => {
          const nA = nodeAlpha[i];
          if (nA < 0.003) return;

          const isCore    = n.id === 'core';
          const isHovered = hoveredRef.current === n.id;
          const np        = nodeProximity[i]; // 0–1 cursor proximity, smoothed

          // Depth hierarchy: deep nodes are dimmer, core is full brightness
          // Cursor proximity lifts brightness slightly (node focus response)
          const depthFade = isCore ? 1.0 : lerp(0.62, 0.22, n.z);
          const finalNA   = nA * (depthFade + np * 0.18 * (1 - n.z));
          if (finalNA < 0.003) return;

          // Perspective-scaled radius
          const scaledR   = n.r * scale;

          if (!isCore) {
            // Depth blur halo — sharpens as cursor approaches (blur reduces)
            const blurMult = (1.8 + n.z * 3.5) * (1 - np * 0.35);
            const blurR    = scaledR * blurMult;
            const bg = ctx.createRadialGradient(sx, sy, 0, sx, sy, blurR);
            bg.addColorStop(0,   hexToRgba(n.color, finalNA * (0.22 + np * 0.08)));
            bg.addColorStop(0.5, hexToRgba(n.color, finalNA * 0.05));
            bg.addColorStop(1,   'rgba(0,0,0,0)');
            ctx.fillStyle = bg;
            ctx.beginPath(); ctx.arc(sx, sy, blurR, 0, Math.PI * 2); ctx.fill();

            // Tight glow — cursor boosts glow radius and intensity subtly
            const glowR = scaledR * (isHovered ? 4.5 : 2.6 + np * 0.8);
            const gg = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowR);
            gg.addColorStop(0,   hexToRgba(n.color, finalNA * (isHovered ? 0.35 : 0.20 + np * 0.08)));
            gg.addColorStop(0.4, hexToRgba(n.color, finalNA * (isHovered ? 0.09 : 0.04 + np * 0.02)));
            gg.addColorStop(1,   'rgba(0,0,0,0)');
            ctx.fillStyle = gg;
            ctx.beginPath(); ctx.arc(sx, sy, glowR, 0, Math.PI * 2); ctx.fill();
          } else {
            // Core — breathing outer field
            // Cursor proximity: glow tightens, pulse sharpens, brightness lifts slightly
            const breathe    = 0.5 + Math.sin(corePhase * Math.PI * 2) * 0.5;
            const beatGlow   = coreBeat;
            const cp         = coreProximity; // 0–1, smooth
            // Proximity tightens outer radius (-15% max) and boosts inner brightness
            const outerR     = scaledR * (6 + breathe * 3 + beatGlow * 4) * (1 - cp * 0.15);
            const glowBoost  = cp * 0.06;
            const og = ctx.createRadialGradient(sx, sy, 0, sx, sy, outerR);
            og.addColorStop(0,    `rgba(242,240,232,${finalNA * (0.20 + beatGlow * 0.14 + glowBoost)})`);
            og.addColorStop(0.30, `rgba(222,220,212,${finalNA * (0.08 + beatGlow * 0.04 + glowBoost * 0.4)})`);
            og.addColorStop(1,    'rgba(0,0,0,0)');
            ctx.fillStyle = og;
            ctx.beginPath(); ctx.arc(sx, sy, outerR, 0, Math.PI * 2); ctx.fill();

            // Beat ring — sharper when cursor is near
            if (coreBeat > 0.02) {
              const beatR = scaledR * (2.5 + (1 - coreBeat) * 5);
              ctx.beginPath(); ctx.arc(sx, sy, beatR, 0, Math.PI * 2);
              ctx.strokeStyle = `rgba(235,233,225,${finalNA * coreBeat * (0.30 + cp * 0.14)})`;
              ctx.lineWidth   = (0.6 + coreBeat * 0.4 + cp * 0.25) * scale;
              ctx.stroke();
            }

            // Breathing ring — tighter + brighter near cursor
            ctx.beginPath();
            ctx.arc(sx, sy, scaledR * (1.9 + breathe * 0.85) * (1 - cp * 0.08), 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(232,230,222,${finalNA * (0.15 + cp * 0.08) * breathe})`;
            ctx.lineWidth   = 0.5 * scale;
            ctx.stroke();

            // Crosshair
            if (finalNA > 0.16) {
              ctx.strokeStyle = `rgba(232,230,222,${finalNA * 0.22})`;
              ctx.lineWidth   = 0.38 * scale;
              const arm  = 11 * scale;
              const armE = scaledR * 2.8;
              ctx.beginPath();
              ctx.moveTo(sx - arm, sy); ctx.lineTo(sx - armE, sy);
              ctx.moveTo(sx + arm, sy); ctx.lineTo(sx + armE, sy);
              ctx.moveTo(sx, sy - arm); ctx.lineTo(sx, sy - armE);
              ctx.moveTo(sx, sy + arm); ctx.lineTo(sx, sy + armE);
              ctx.stroke();
            }
          }

          // Dot — cursor proximity sharpens dot (tiny size boost + alpha lift)
          const dotR = isCore ? scaledR : scaledR * (1.1 + np * 0.15);
          ctx.globalAlpha = finalNA * (isCore ? 1.0 : 0.85 + np * 0.12) * (isHovered ? 1.4 : 1);
          ctx.fillStyle   = n.color;
          ctx.beginPath(); ctx.arc(sx, sy, dotR, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
        });

      // ── NODE FOCUS LABELS — shown when cursor is near, before full hover ──
      // Proximity > 0.30 shows a faint annotation; full hover shows full label
      NODES.forEach((n, i) => {
        if (n.id === 'core') return; // core has no label
        const np  = nodeProximity[i];
        const nA  = nodeAlpha[i];
        if (nA < 0.08) return;
        const isFullHover = hoveredRef.current === n.id;
        // Show label at reduced opacity from np=0.30, full at hover
        const labelA = isFullHover ? 0.84 : clamp((np - 0.30) / 0.40, 0, 0.65);
        if (labelA < 0.02) return;

        const p     = projected[i];
        const right = p.sx > W * 0.54;
        const lx    = p.sx + (right ? -20 : 20);
        const ly    = p.sy - 14;

        ctx.strokeStyle = `rgba(160,158,154,${labelA * 0.25})`;
        ctx.lineWidth   = 0.35;
        ctx.beginPath();
        ctx.moveTo(p.sx + (right ? -n.r * p.scale * 1.6 : n.r * p.scale * 1.6), p.sy);
        ctx.lineTo(lx + (right ? 5 : -5), ly + 7);
        ctx.stroke();

        ctx.globalAlpha = labelA;
        ctx.textAlign   = right ? 'right' : 'left';
        ctx.fillStyle   = n.color;
        ctx.font        = `400 9px 'Space Mono', monospace`;
        ctx.fillText(n.label, lx, ly);
        ctx.fillStyle   = 'rgba(140,138,134,0.65)';
        ctx.font        = `400 7px 'Space Mono', monospace`;
        ctx.fillText(n.sub, lx, ly + 13);
        ctx.textAlign   = 'left';
        ctx.globalAlpha = 1;
      });

      ctx.restore();
    };

    raf = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(raf);
      wrap.removeEventListener('mousemove', onMouse);
      wrap.removeEventListener('mousemove', onHover);
      wrap.removeEventListener('click', onClick);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div ref={wrapRef} style={{ position: 'relative', zIndex: 1 }}>
      <div style={{
        position: 'relative',
        height: '100vh',
        overflow: 'hidden',
        background: 'transparent',
        cursor: hoveredNode ? 'crosshair' : 'default',
      }}>
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', inset: 0, zIndex: 1, display: 'block' }}
        />
      </div>
    </div>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
