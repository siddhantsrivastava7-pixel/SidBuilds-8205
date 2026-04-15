import { useEffect, useRef } from 'react';
import { getScrollState, initScrollCamera } from '../hooks/useScrollCamera';

// ── SystemBackground ────────────────────────────────────────────────────
// Fixed canvas. Owns the infinite depth environment.
// Reads scroll momentum to react (stars shimmer on fast scroll).
// Layers: base fill → star field (3 bands) → depth fog → vignette.

interface Star {
  x: number; y: number;
  z: number;            // 0 = far, 1 = near
  r: number;
  alpha: number;
  twinkle: number;
  twinkleSpeed: number;
  // For infinite field: normalised, wraps with scroll
  vy: number;           // drift velocity
}

const BAND_CONFIGS = [
  { count: 190, z: 0.06, rRange: [0.25, 0.55], aRange: [0.04, 0.14] }, // far
  { count: 95,  z: 0.25, rRange: [0.35, 0.75], aRange: [0.08, 0.22] }, // mid
  { count: 40,  z: 0.52, rRange: [0.55, 1.10], aRange: [0.14, 0.34] }, // near
];

function makeStars(): Star[] {
  const stars: Star[] = [];
  BAND_CONFIGS.forEach(({ count, z, rRange, aRange }) => {
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        z,
        r:     rRange[0] + Math.random() * (rRange[1] - rRange[0]),
        alpha: aRange[0] + Math.random() * (aRange[1] - aRange[0]),
        twinkle:      Math.random() * Math.PI * 2,
        twinkleSpeed: 0.0003 + Math.random() * 0.0005,
        vy:           0.000008 + Math.random() * 0.000006,
      });
    }
  });
  return stars;
}

export default function SystemBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    initScrollCamera();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = window.innerWidth, H = window.innerHeight;
    const ctx = canvas.getContext('2d', { alpha: false })!;

    const resize = () => {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width  = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width  = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const stars = makeStars();

    let driftT  = 0;
    let twinkleT = 0;
    const mouse  = { x: 0.5, y: 0.5 };
    const tMouse = { x: 0.5, y: 0.5 };

    const onMouse = (e: MouseEvent) => {
      tMouse.x = e.clientX / window.innerWidth;
      tMouse.y = e.clientY / window.innerHeight;
    };
    window.addEventListener('mousemove', onMouse);

    const lerp  = (a: number, b: number, t: number) => a + (b - a) * t;
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

    let raf: number;
    let lastNow = performance.now();

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const dt = Math.min(now - lastNow, 50);
      lastNow  = now;

      const scroll    = getScrollState();
      const momentum  = scroll.momentum;   // 0–1
      const velocity  = scroll.velocity;   // signed px/frame

      driftT   += dt * 0.000045;
      twinkleT += dt * 0.001;

      mouse.x = lerp(mouse.x, tMouse.x, 0.016);
      mouse.y = lerp(mouse.y, tMouse.y, 0.016);

      // Slow camera drift
      const driftX = Math.sin(driftT * 0.65) * 5.5 + Math.sin(driftT * 0.27) * 3.2;
      const driftY = Math.cos(driftT * 0.48) * 4.5 + Math.cos(driftT * 0.15) * 2.2;

      // ── Fill ──────────────────────────────────────────────────
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, W, H);

      // ── Star field ────────────────────────────────────────────
      stars.forEach(s => {
        // Scroll drives stars upward at different speeds per depth band
        // Near stars scroll faster → parallax depth
        const scrollParallax = velocity * s.z * 0.28;

        // Continuous drift per star (independent of scroll)
        s.y -= s.vy * dt * (1 + s.z * 0.4);
        if (s.y < -0.02) s.y = 1.02; // wrap

        const parallaxMult = s.z * s.z;
        const px = (mouse.x - 0.5) * 16 * parallaxMult + driftX * parallaxMult * 0.7;
        const py = (mouse.y - 0.5) * 11 * parallaxMult + driftY * parallaxMult * 0.7 + scrollParallax;

        const sx = s.x * W + px;
        const sy = (s.y * H + py + H * 2) % (H * 1.08) - H * 0.04;

        // Twinkle — momentum boosts twinkle frequency and amplitude
        const twinkleAmp = 0.25 + momentum * 0.45;
        const tw = Math.sin(twinkleT * s.twinkleSpeed * 1000 + s.twinkle) * twinkleAmp + (1 - twinkleAmp * 0.5);
        const a  = s.alpha * tw * (1 + momentum * 0.3);

        // Depth color: far=blue-grey, near=warm neutral
        const r = Math.round(lerp(155, 222, s.z));
        const g = Math.round(lerp(165, 218, s.z));
        const b = Math.round(lerp(200, 214, s.z));

        ctx.globalAlpha = clamp(a, 0, 1);
        ctx.fillStyle   = `rgb(${r},${g},${b})`;
        ctx.beginPath();
        ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // ── Ambient core glow — cursor bends it very slightly ──────
      // Glow center drifts ~2% toward cursor (ambient field response)
      const cx = W * 0.44 + driftX * 0.10 + (mouse.x - 0.5) * W * 0.025;
      const cy = H * 0.50 + driftY * 0.10 + (mouse.y - 0.5) * H * 0.018;
      const amb = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.58);
      amb.addColorStop(0,    'rgba(185,183,175,0.020)');
      amb.addColorStop(0.32, 'rgba(70,80,120,0.007)');
      amb.addColorStop(1,    'rgba(0,0,0,0)');
      ctx.fillStyle = amb;
      ctx.fillRect(0, 0, W, H);

      // ── Depth fog — top darker (deep space), bottom slightly lighter ──
      const fog = ctx.createLinearGradient(0, 0, 0, H);
      fog.addColorStop(0,    'rgba(8,8,18,0.22)');
      fog.addColorStop(0.38, 'rgba(0,0,0,0)');
      fog.addColorStop(1,    'rgba(0,0,10,0.28)');
      ctx.fillStyle = fog;
      ctx.fillRect(0, 0, W, H);

      // ── Scroll velocity streak — brief bright wash on fast scroll ─
      if (momentum > 0.08) {
        const streakA = momentum * 0.035;
        const sg = ctx.createLinearGradient(0, 0, 0, H);
        sg.addColorStop(0,   `rgba(0,180,220,${streakA * 0.4})`);
        sg.addColorStop(0.5, `rgba(0,140,200,${streakA})`);
        sg.addColorStop(1,   `rgba(0,180,220,${streakA * 0.4})`);
        ctx.fillStyle = sg;
        ctx.fillRect(0, 0, W, H);
      }

      // ── Vignette ──────────────────────────────────────────────
      const vig = ctx.createRadialGradient(
        W * 0.5, H * 0.5, Math.min(W, H) * 0.04,
        W * 0.5, H * 0.5, Math.min(W, H) * 0.96,
      );
      vig.addColorStop(0,    'rgba(0,0,0,0)');
      vig.addColorStop(0.30, 'rgba(0,0,0,0.08)');
      vig.addColorStop(0.62, 'rgba(0,0,0,0.50)');
      vig.addColorStop(1,    'rgba(0,0,0,0.94)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);
    };

    raf = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        display: 'block',
        width: '100%',
        height: '100%',
      }}
    />
  );
}
