import { useEffect, useRef } from 'react';

// Smooth trail with velocity-based glow
// No React re-renders — pure imperative canvas
export default function CursorGlow() {
  const glowRef  = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const glow   = glowRef.current;
    if (!canvas || !glow) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    };

    const ctx = canvas.getContext('2d', { alpha: true })!;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    window.addEventListener('resize', resize);

    type Point = { x: number; y: number; t: number };
    const TRAIL_LEN = 32;
    const trail: Point[] = [];

    let mx = -9999, my = -9999;
    let prevX = -9999, prevY = -9999;
    let speed = 0;
    let raf: number;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      // Update ambient glow position (CSS div)
      glow.style.left = `${mx}px`;
      glow.style.top  = `${my}px`;

      const dx = mx - prevX, dy = my - prevY;
      speed = Math.sqrt(dx*dx + dy*dy);
      prevX = mx; prevY = my;

      trail.push({ x: mx, y: my, t: Date.now() });
      if (trail.length > TRAIL_LEN) trail.shift();
    };

    const draw = () => {
      raf = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const now = Date.now();
      const DECAY = 200; // ms trail lifetime

      if (trail.length < 2) return;

      // Draw trail segments — taper width and alpha by age and position
      for (let i = 1; i < trail.length; i++) {
        const t   = i / trail.length;          // 0=old 1=new
        const age = now - trail[i].t;
        const ageA = Math.max(0, 1 - age / DECAY);
        const alpha = t * t * ageA * 0.32;
        if (alpha < 0.004) continue;

        ctx.beginPath();
        ctx.moveTo(trail[i-1].x, trail[i-1].y);
        ctx.lineTo(trail[i].x,   trail[i].y);
        ctx.strokeStyle = `rgba(0,212,255,${alpha})`;
        ctx.lineWidth   = t * 2.5;
        ctx.lineCap     = 'round';
        ctx.stroke();
      }

      // Tip glow dot — brighter when moving fast
      const last = trail[trail.length - 1];
      if (last && now - last.t < 80) {
        const tipIntensity = Math.min(1, speed / 25);
        const r = 8 + tipIntensity * 10;
        const g = ctx.createRadialGradient(last.x, last.y, 0, last.x, last.y, r);
        g.addColorStop(0, `rgba(0,212,255,${0.22 + tipIntensity * 0.15})`);
        g.addColorStop(1, 'rgba(0,212,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(last.x, last.y, r, 0, Math.PI*2); ctx.fill();
      }
    };

    draw();
    window.addEventListener('mousemove', onMove);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <>
      {/* Light trail canvas — above everything */}
      <canvas
        ref={canvasRef}
        style={{
          position:'fixed', inset:0, zIndex:9,
          pointerEvents:'none',
          width:'100%', height:'100%',
        }}
      />
      {/* Large ambient radial glow — moves with cursor */}
      <div
        ref={glowRef}
        style={{
          position:'fixed',
          width:'480px', height:'480px', borderRadius:'50%',
          background:'radial-gradient(circle, rgba(0,212,255,0.045) 0%, rgba(123,79,232,0.018) 45%, transparent 70%)',
          pointerEvents:'none', zIndex:1,
          transform:'translate(-50%,-50%)',
          transition:'left 0.1s ease, top 0.1s ease',
          willChange:'left,top',
        }}
      />
    </>
  );
}
