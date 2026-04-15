import { useEffect, useRef, useState, useCallback } from 'react';

// ── Constants ────────────────────────────────────────────────────────────
const GOLD   = '#C9A84C';
const TEAL   = '#00D4FF';
const DEEP   = '#0A1628';
const PLANET_R = 0.22; // fraction of min(W,H)

const MODULES = [
  { id: 'policy',    label: 'Policy Analyzer',   sub: '— insurance intelligence', color: '#C9A84C', angle: 0,    orbitR: 1.88, orbitTilt: 0.18  },
  { id: 'sip',       label: 'SIP Planner',        sub: '— systematic investment',  color: '#00D4FF', angle: 1.57, orbitR: 2.20, orbitTilt: -0.12 },
  { id: 'lumpsum',   label: 'Lumpsum Planner',    sub: '— capital deployment',     color: '#7B8FFF', angle: 3.14, orbitR: 1.95, orbitTilt: 0.22  },
  { id: 'portfolio', label: 'Portfolio Analyzer', sub: '— allocation intelligence',color: '#4ECDC4', angle: 4.71, orbitR: 2.35, orbitTilt: -0.08 },
] as const;

type ModuleId = typeof MODULES[number]['id'];

interface ModuleState {
  angle:    number;
  orbitR:   number;
  focus:    number; // 0–1 focus envelope
  hover:    number; // 0–1 hover envelope
}

// ── Props ─────────────────────────────────────────────────────────────────
interface Props {
  onModuleClick?: (id: ModuleId) => void;
  focusedModule?: ModuleId | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────
const lerp  = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
function hexRgb(hex: string) {
  return { r: parseInt(hex.slice(1,3),16), g: parseInt(hex.slice(3,5),16), b: parseInt(hex.slice(5,7),16) };
}
function rgba(hex: string, a: number) {
  const c = hexRgb(hex); return `rgba(${c.r},${c.g},${c.b},${a})`;
}

export default function PlanetCanvas({ onModuleClick, focusedModule }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const stateRef   = useRef({ focusedModule });

  // Keep stateRef in sync
  useEffect(() => { stateRef.current.focusedModule = focusedModule; }, [focusedModule]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = window.innerWidth, H = window.innerHeight;
    const ctx = canvas.getContext('2d', { alpha: true })!;

    const resize = () => {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width  = W * dpr; canvas.height = H * dpr;
      canvas.style.width  = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // ── Camera ────────────────────────────────────────────────────
    let orbitAngle  = 0;     // slow horizontal orbit
    let tiltAngle   = 0.18;  // vertical tilt
    let orbitDrift  = 0;     // sinusoidal drift
    let cameraT     = 0;

    // Mouse
    const mouse  = { x: 0.5, y: 0.5 };
    const tmouse = { x: 0.5, y: 0.5 };
    const onMouse = (e: MouseEvent) => {
      tmouse.x = e.clientX / W;
      tmouse.y = e.clientY / H;
    };
    window.addEventListener('mousemove', onMouse);

    // ── Module states ──────────────────────────────────────────────
    const modState: ModuleState[] = MODULES.map(m => ({
      angle:  m.angle,
      orbitR: m.orbitR,
      focus:  0,
      hover:  0,
    }));

    // Hover detection (mouse in screen → module projection hit test)
    let hoveredMod: ModuleId | null = null;
    const onHover = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const cx = W * 0.5, cy = H * 0.5;
      const R  = Math.min(W, H) * PLANET_R;
      let found: ModuleId | null = null;
      MODULES.forEach((m, i) => {
        const ms = modState[i];
        const { sx, sy } = projectModule(m, ms, cx, cy, R, orbitAngle, tiltAngle);
        if (Math.hypot(mx - sx, my - sy) < 30) found = m.id;
      });
      if (found !== hoveredMod) {
        hoveredMod = found;
        canvas.style.cursor = found ? 'crosshair' : 'default';
      }
    };
    canvas.addEventListener('mousemove', onHover);

    const onClick = (e: MouseEvent) => {
      if (hoveredMod) onModuleClick?.(hoveredMod);
    };
    canvas.addEventListener('click', onClick);

    // ── Surface signals ───────────────────────────────────────────
    interface SurfaceSignal {
      lat: number; lon: number; // start
      dLat: number; dLon: number; // direction
      t: number; life: number; alpha: number; speed: number;
    }
    const surfaceSignals: SurfaceSignal[] = [];
    let lastSigSpawn = 0;

    function spawnSig(now: number) {
      const lat = (Math.random() - 0.5) * Math.PI * 0.75;
      const lon = Math.random() * Math.PI * 2;
      surfaceSignals.push({
        lat, lon,
        dLat: (Math.random() - 0.5) * 0.012,
        dLon: 0.006 + Math.random() * 0.008,
        t: 0, life: 0.6 + Math.random() * 0.8,
        alpha: 0.18 + Math.random() * 0.22,
        speed: 0.006 + Math.random() * 0.006,
      });
      lastSigSpawn = now;
    }

    // ── Planet grid lines ─────────────────────────────────────────
    // Pre-compute lat/lon grid points as arcs on sphere surface
    // rendered via ellipse projection

    let raf: number;
    let lastNow = performance.now();
    let tick = 0;

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const dt = Math.min(now - lastNow, 50);
      lastNow = now; tick++;

      cameraT += dt * 0.00012;

      // ── Camera drift ─────────────────────────────────────────
      orbitDrift  += dt * 0.000055;
      orbitAngle  += dt * 0.000045;  // slow horizontal orbit
      tiltAngle    = 0.18 + Math.sin(orbitDrift * 0.38) * 0.055;

      mouse.x = lerp(mouse.x, tmouse.x, 0.028);
      mouse.y = lerp(mouse.y, tmouse.y, 0.028);
      const camTiltX = (mouse.x - 0.5) * 0.07;
      const camTiltY = (mouse.y - 0.5) * 0.05;

      const cx = W * 0.5, cy = H * 0.5;
      const R  = Math.min(W, H) * PLANET_R;

      // ── Module orbit ─────────────────────────────────────────
      const focused = stateRef.current.focusedModule;
      MODULES.forEach((m, i) => {
        const ms = modState[i];
        const isFocused = focused === m.id;
        const isHovered = hoveredMod === m.id;

        // Orbit continues rotating
        ms.angle += dt * 0.000055 * (1 + i * 0.15);

        // orbitR pulses in on focus/hover
        const targetR = isFocused ? m.orbitR * 0.72 : isHovered ? m.orbitR * 0.88 : m.orbitR;
        ms.orbitR = lerp(ms.orbitR, targetR, 0.04);

        ms.focus = lerp(ms.focus, isFocused ? 1 : 0, 0.06);
        ms.hover = lerp(ms.hover, (isHovered || isFocused) ? 1 : 0, 0.08);
      });

      // ── Surface signals ───────────────────────────────────────
      if (now - lastSigSpawn > 280) spawnSig(now);
      for (let i = surfaceSignals.length - 1; i >= 0; i--) {
        const s = surfaceSignals[i];
        s.t     += s.speed;
        s.lat   += s.dLat;
        s.lon   += s.dLon;
        if (s.t >= s.life) surfaceSignals.splice(i, 1);
      }

      // ── DRAW ─────────────────────────────────────────────────
      ctx.save();
      ctx.clearRect(0, 0, W, H);

      // ── Planet sphere ─────────────────────────────────────────
      drawPlanet(ctx, cx, cy, R, cameraT, orbitAngle + camTiltX, tiltAngle + camTiltY, tick);

      // ── Surface signals ───────────────────────────────────────
      drawSurfaceSignals(ctx, surfaceSignals, cx, cy, R, orbitAngle + camTiltX, tiltAngle + camTiltY);

      // ── Orbital tether lines ──────────────────────────────────
      MODULES.forEach((m, i) => {
        const ms = modState[i];
        const { sx, sy, visible } = projectModule(m, ms, cx, cy, R, orbitAngle + camTiltX, tiltAngle + camTiltY);
        if (!visible) return;
        const ea = 0.12 + ms.hover * 0.18;
        ctx.strokeStyle = rgba(m.color, ea);
        ctx.lineWidth   = 0.6;
        ctx.setLineDash([3, 5]);
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(sx, sy); ctx.stroke();
        ctx.setLineDash([]);
      });

      // ── Module nodes ──────────────────────────────────────────
      // Draw back-to-front
      const sortedMods = MODULES.map((m, i) => ({ m, i, ms: modState[i], ...projectModule(m, modState[i], cx, cy, R, orbitAngle + camTiltX, tiltAngle + camTiltY) }))
        .sort((a, b) => a.depth - b.depth);

      sortedMods.forEach(({ m, ms, sx, sy, visible, depth }) => {
        if (!visible && depth > 0.2) return;
        const depthFade = clamp(0.3 + depth * 0.7, 0, 1);
        const baseA     = depthFade * (0.65 + ms.hover * 0.30);

        // Glow halo
        const glowR = 22 + ms.hover * 14 + ms.focus * 20;
        const gw = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowR);
        gw.addColorStop(0,   rgba(m.color, baseA * 0.32));
        gw.addColorStop(0.4, rgba(m.color, baseA * 0.08));
        gw.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.fillStyle = gw;
        ctx.beginPath(); ctx.arc(sx, sy, glowR, 0, Math.PI * 2); ctx.fill();

        // Dot
        ctx.globalAlpha = baseA;
        ctx.fillStyle   = m.color;
        ctx.beginPath(); ctx.arc(sx, sy, 3.5 + ms.hover * 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;

        // Ring on hover/focus
        if (ms.hover > 0.05) {
          ctx.beginPath(); ctx.arc(sx, sy, 8 + ms.focus * 4, 0, Math.PI * 2);
          ctx.strokeStyle = rgba(m.color, ms.hover * 0.45);
          ctx.lineWidth   = 0.8;
          ctx.stroke();
        }

        // Label
        const labelA = clamp(depthFade * (0.30 + ms.hover * 0.65), 0, 1);
        if (labelA > 0.05) {
          const right = sx < cx;
          const lx = sx + (right ? -16 : 16);
          const ly = sy - 10;
          ctx.globalAlpha = labelA;
          ctx.textAlign   = right ? 'right' : 'left';
          ctx.fillStyle   = m.color;
          ctx.font        = `400 9px 'Space Mono', monospace`;
          ctx.fillText(m.label, lx, ly);
          ctx.fillStyle   = 'rgba(160,158,154,0.70)';
          ctx.font        = `400 7px 'Space Mono', monospace`;
          ctx.fillText(m.sub, lx, ly + 12);
          ctx.textAlign   = 'left';
          ctx.globalAlpha = 1;
        }
      });

      ctx.restore();
    };

    raf = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onHover);
      canvas.removeEventListener('click', onClick);
    };
  }, [onModuleClick]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'block', width: '100%', height: '100%' }}
    />
  );
}

// ── Planet draw ────────────────────────────────────────────────────────────
function drawPlanet(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, R: number,
  cameraT: number, orbitAngle: number, tiltAngle: number,
  tick: number,
) {
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  // Base sphere gradient
  const bg = ctx.createRadialGradient(cx - R * 0.25, cy - R * 0.3, R * 0.1, cx, cy, R * 1.1);
  bg.addColorStop(0,    'rgba(18,40,85,0.95)');
  bg.addColorStop(0.35, 'rgba(8,22,55,0.98)');
  bg.addColorStop(0.70, 'rgba(3,10,30,0.99)');
  bg.addColorStop(1,    'rgba(0,5,18,1)');
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

  // ── Lat/lon grid ───────────────────────────────────────────────
  const LATS = 8, LONS = 12;
  const gridA = 0.12 + Math.sin(cameraT * 0.8) * 0.015;

  // Latitude rings (horizontal ellipses)
  for (let li = 1; li < LATS; li++) {
    const lat = -Math.PI * 0.5 + (Math.PI / LATS) * li;
    const cosLat = Math.cos(lat);
    const sinLat = Math.sin(lat);
    // Ellipse radius & vertical offset under perspective tilt
    const ellipseRx = R * cosLat;
    const ellipseRy = R * cosLat * Math.sin(tiltAngle) * 0.9;
    const ellipseY  = cy + R * sinLat * Math.cos(tiltAngle);
    if (Math.abs(ellipseRx) < 1) continue;

    // Fade back-face rings
    const frontFace = sinLat * Math.cos(tiltAngle) > -0.1;
    const fa = gridA * (frontFace ? 1 : 0.22);

    ctx.beginPath();
    ctx.ellipse(cx, ellipseY, Math.abs(ellipseRx), Math.max(0.5, Math.abs(ellipseRy) + 1), 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0,160,200,${fa})`;
    ctx.lineWidth   = 0.5;
    ctx.stroke();
  }

  // Longitude meridians (great circle arcs, projected)
  for (let lo = 0; lo < LONS; lo++) {
    const lon = (Math.PI * 2 / LONS) * lo + orbitAngle;
    const cosLon = Math.cos(lon), sinLon = Math.sin(lon);

    // Sample points along the meridian
    ctx.beginPath();
    let first = true;
    for (let step = 0; step <= 32; step++) {
      const lat    = -Math.PI * 0.5 + (Math.PI / 32) * step;
      const cosLat = Math.cos(lat), sinLat = Math.sin(lat);
      // 3D point on sphere
      const px3 = R * cosLat * cosLon;
      const py3 = R * cosLat * sinLon;
      const pz3 = R * sinLat;
      // Apply tilt rotation (around x-axis)
      const py3t = py3 * Math.cos(tiltAngle) - pz3 * Math.sin(tiltAngle);
      const pz3t = py3 * Math.sin(tiltAngle) + pz3 * Math.cos(tiltAngle);
      const sx = cx + px3;
      const sy = cy + py3t;
      const front = pz3t > -R * 0.02;
      if (!front) { first = true; continue; }
      if (first) { ctx.moveTo(sx, sy); first = false; }
      else ctx.lineTo(sx, sy);
    }
    // Modulate alpha by longitude rotation for shimmer
    const shimmer = 0.5 + Math.cos(lon - orbitAngle * 2) * 0.3;
    ctx.strokeStyle = `rgba(0,140,190,${gridA * shimmer})`;
    ctx.lineWidth   = 0.45;
    ctx.stroke();
  }

  // ── Atmosphere rim glow ────────────────────────────────────────
  const atmR = R * 1.06;
  const atm = ctx.createRadialGradient(cx, cy, R * 0.90, cx, cy, atmR);
  atm.addColorStop(0,   'rgba(0,160,220,0.0)');
  atm.addColorStop(0.5, 'rgba(0,180,230,0.055)');
  atm.addColorStop(0.8, 'rgba(20,160,210,0.12)');
  atm.addColorStop(1,   'rgba(0,120,180,0.0)');
  ctx.fillStyle = atm;
  ctx.beginPath(); ctx.arc(cx, cy, atmR, 0, Math.PI * 2); ctx.fill();

  // ── Gold specular highlight ────────────────────────────────────
  const spec = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.32, 0, cx - R * 0.3, cy - R * 0.32, R * 0.45);
  spec.addColorStop(0,   'rgba(201,168,76,0.10)');
  spec.addColorStop(0.5, 'rgba(201,168,76,0.02)');
  spec.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = spec;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

  // ── Clip future draws to sphere ────────────────────────────────
  // (surface signals will use save/clip)
}

// ── Surface signal draw ────────────────────────────────────────────────────
function drawSurfaceSignals(
  ctx: CanvasRenderingContext2D,
  signals: { lat: number; lon: number; dLat: number; dLon: number; t: number; life: number; alpha: number }[],
  cx: number, cy: number, R: number,
  orbitAngle: number, tiltAngle: number,
) {
  signals.forEach(s => {
    const progress = s.t / s.life;
    const fade     = Math.min(progress * 4, 1) * Math.max(0, 1 - (progress - 0.6) * 2.5);
    if (fade < 0.01) return;

    const lon    = s.lon + orbitAngle;
    const cosLon = Math.cos(lon), sinLon = Math.sin(lon);
    const cosLat = Math.cos(s.lat), sinLat = Math.sin(s.lat);

    const px3 = R * cosLat * cosLon;
    const py3 = R * cosLat * sinLon;
    const pz3 = R * sinLat;

    const py3t = py3 * Math.cos(tiltAngle) - pz3 * Math.sin(tiltAngle);
    const pz3t = py3 * Math.sin(tiltAngle) + pz3 * Math.cos(tiltAngle);

    if (pz3t < -R * 0.05) return; // back-face cull

    const sx = cx + px3;
    const sy = cy + py3t;

    ctx.globalAlpha = s.alpha * fade;
    ctx.fillStyle   = '#C9A84C';
    ctx.beginPath(); ctx.arc(sx, sy, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  });
}

// ── Project module to screen ───────────────────────────────────────────────
function projectModule(
  m: typeof MODULES[number],
  ms: ModuleState,
  cx: number, cy: number, R: number,
  orbitAngle: number, tiltAngle: number,
): { sx: number; sy: number; depth: number; visible: boolean } {
  const angle = ms.angle + orbitAngle * 0.4;
  const orbitRadius = R * ms.orbitR;
  const tilt        = m.orbitTilt + tiltAngle * 0.6;

  // 3D orbit position
  const px3 = orbitRadius * Math.cos(angle);
  const py3 = orbitRadius * Math.sin(angle) * Math.cos(tilt);
  const pz3 = orbitRadius * Math.sin(angle) * Math.sin(tilt);

  // Apply camera tilt
  const py3t = py3 * Math.cos(tiltAngle) - pz3 * Math.sin(tiltAngle);
  const pz3t = py3 * Math.sin(tiltAngle) + pz3 * Math.cos(tiltAngle);

  const sx      = cx + px3;
  const sy      = cy + py3t;
  const depth   = clamp((pz3t + orbitRadius) / (orbitRadius * 2), 0, 1);
  const visible = pz3t > -orbitRadius * 0.1;

  return { sx, sy, depth, visible };
}


