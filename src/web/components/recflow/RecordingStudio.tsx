import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * RecordingStudio — hero section for RecFlow page.
 * Canvas draws: main recording frame + corner brackets + webcam PIP + floating panels
 * Overlaid with copy.
 */
function StudioCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number>(0);
  const t   = useRef(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      canvas.width  = W * dpr;
      canvas.height = H * dpr;
    };
    resize();
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    const draw = () => {
      raf.current = requestAnimationFrame(draw);
      t.current += 0.008;
      const tick = t.current;
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      // ── Main recording frame ──────────────────────────
      const fX = W * 0.06, fY = H * 0.06;
      const fW = W * 0.62, fH = H * 0.72;

      // Outer glow
      const glow = ctx.createLinearGradient(fX, fY, fX + fW, fY + fH);
      glow.addColorStop(0, 'rgba(255,60,60,0.12)');
      glow.addColorStop(1, 'rgba(180,20,20,0.05)');
      ctx.shadowColor = 'rgba(255,60,60,0.25)';
      ctx.shadowBlur  = 28;
      ctx.fillStyle   = glow;
      ctx.fillRect(fX - 3, fY - 3, fW + 6, fH + 6);
      ctx.shadowBlur  = 0;

      // Frame bg
      ctx.fillStyle = 'rgba(8,8,18,0.92)';
      ctx.fillRect(fX, fY, fW, fH);

      // Frame border
      ctx.strokeStyle = 'rgba(255,60,60,0.7)';
      ctx.lineWidth   = 1.2;
      ctx.strokeRect(fX, fY, fW, fH);

      // Corner brackets
      const bLen = 18;
      const corners: [number, number, number, number][] = [
        [fX,      fY,      1,  1],
        [fX + fW, fY,     -1,  1],
        [fX,      fY + fH, 1, -1],
        [fX + fW, fY + fH,-1, -1],
      ];
      ctx.strokeStyle = '#FF3C3C';
      ctx.lineWidth   = 2;
      ctx.globalAlpha = 0.9;
      corners.forEach(([cx2, cy2, sx, sy]) => {
        ctx.beginPath();
        ctx.moveTo(cx2, cy2 + sy * bLen);
        ctx.lineTo(cx2, cy2);
        ctx.lineTo(cx2 + sx * bLen, cy2);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;

      // Topbar (macOS style)
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fillRect(fX, fY, fW, fH * 0.08);
      ['#FF5F57', '#FFBD2E', '#28C840'].forEach((col, i) => {
        ctx.globalAlpha = 0.55;
        ctx.fillStyle   = col;
        ctx.beginPath();
        ctx.arc(fX + fW * (0.032 + i * 0.028), fY + fH * 0.04, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 0.08;
      ctx.fillStyle   = 'rgba(255,255,255,0.08)';
      ctx.fillRect(fX + fW * 0.12, fY + fH * 0.015, fW * 0.55, fH * 0.05);
      ctx.globalAlpha = 1;

      // Body content rows
      const rows = [
        { y: 0.14, w: 0.50, h: 4, isHead: true },
        { y: 0.22, w: 0.82, h: 1.5, isHead: false },
        { y: 0.28, w: 0.68, h: 1.5, isHead: false },
        { y: 0.34, w: 0.75, h: 1.5, isHead: false },
        { y: 0.42, w: 0.42, h: 3.5, isHead: true },
        { y: 0.50, w: 0.78, h: 1.5, isHead: false },
        { y: 0.56, w: 0.62, h: 1.5, isHead: false },
        { y: 0.64, w: 0.55, h: 1.5, isHead: false },
        { y: 0.71, w: 0.35, h: 3, isHead: true },
        { y: 0.78, w: 0.80, h: 1.5, isHead: false },
        { y: 0.84, w: 0.60, h: 1.5, isHead: false },
      ];
      rows.forEach((row, ri) => {
        const rx = fX + fW * 0.07;
        const ry = fY + fH * row.y;
        const rw = fW * row.w * 0.86;
        ctx.globalAlpha = row.isHead ? 0.32 : 0.14;
        ctx.fillStyle   = row.isHead ? '#F0EFEA' : '#4A4A6A';
        ctx.fillRect(rx, ry, rw, row.h);
      });
      // Side nav
      ctx.globalAlpha = 0.07;
      ctx.fillStyle   = 'rgba(255,255,255,0.04)';
      ctx.fillRect(fX, fY + fH * 0.08, fW * 0.08, fH * 0.92);
      for (let ni = 0; ni < 6; ni++) {
        ctx.globalAlpha = ni === 1 ? 0.18 : 0.07;
        ctx.fillStyle   = ni === 1 ? '#FF3C3C' : '#4A4A6A';
        ctx.fillRect(fX + fW * 0.012, fY + fH * (0.14 + ni * 0.11), fW * 0.055, 1.5);
      }

      // ── Timeline bar below frame ─────────────────────
      const tlX = fX, tlY = fY + fH + 12;
      const tlW = fW, tlH  = 3;
      const prog = (tick * 0.06) % 1;

      ctx.globalAlpha = 0.12;
      ctx.fillStyle   = 'rgba(255,255,255,0.06)';
      ctx.fillRect(tlX, tlY, tlW, tlH);

      const tlGrd = ctx.createLinearGradient(tlX, 0, tlX + tlW, 0);
      tlGrd.addColorStop(0, '#FF3C3C');
      tlGrd.addColorStop(1, '#CC2020');
      ctx.globalAlpha = 0.75;
      ctx.fillStyle   = tlGrd;
      ctx.fillRect(tlX, tlY, tlW * prog, tlH);

      // Playhead
      const phX = tlX + tlW * prog;
      ctx.globalAlpha = 1;
      ctx.fillStyle   = '#FF3C3C';
      ctx.beginPath(); ctx.arc(phX, tlY + tlH / 2, 5, 0, Math.PI * 2); ctx.fill();

      // Ticks
      for (let tk = 0; tk <= 24; tk++) {
        const tx = tlX + (tk / 24) * tlW;
        ctx.globalAlpha = 0.15;
        ctx.fillStyle   = '#4A4A6A';
        ctx.fillRect(tx, tlY - 3, 0.5, tk % 6 === 0 ? 6 : 3);
      }

      const secs = Math.floor(prog * 180);
      const mm   = String(Math.floor(secs / 60)).padStart(2, '0');
      const ss   = String(secs % 60).padStart(2, '0');
      ctx.globalAlpha = 0.45;
      ctx.fillStyle   = '#8A8A9A';
      ctx.font        = `400 11px 'Space Mono', monospace`;
      ctx.textAlign   = 'right';
      ctx.fillText(`${mm}:${ss}`, tlX + tlW, tlY + 14);
      ctx.textAlign = 'left';

      // ── REC dot (top-right of frame) ─────────────────
      const recX = fX + fW - 22, recY = fY + 14;
      const pulse = 0.5 + Math.sin(tick * 4) * 0.5;
      const rg    = ctx.createRadialGradient(recX, recY, 0, recX, recY, 16);
      rg.addColorStop(0, `rgba(255,60,60,${0.3 * pulse})`);
      rg.addColorStop(1, 'rgba(255,60,60,0)');
      ctx.globalAlpha = 1;
      ctx.fillStyle   = rg;
      ctx.beginPath(); ctx.arc(recX, recY, 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle   = '#FF3C3C';
      ctx.beginPath(); ctx.arc(recX, recY, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.7 + pulse * 0.25;
      ctx.fillStyle   = '#FF3C3C';
      ctx.font        = `700 10px 'Space Mono', monospace`;
      ctx.textAlign   = 'right';
      ctx.fillText('● REC', recX - 8, recY + 3.5);
      ctx.textAlign = 'left';

      // ── Webcam PIP (right panel) ──────────────────────
      const pipX = fX + fW + 16, pipY = fY;
      const pipW = W - pipX - W * 0.04, pipH = fH * 0.46;
      const pipFloat = Math.sin(tick * 0.5) * 3;

      ctx.globalAlpha = 0.85;
      ctx.fillStyle   = 'rgba(13,13,26,0.85)';
      ctx.fillRect(pipX, pipY + pipFloat, pipW, pipH);
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = 'rgba(255,60,60,0.5)';
      ctx.lineWidth   = 0.8;
      ctx.strokeRect(pipX, pipY + pipFloat, pipW, pipH);

      // Webcam label
      ctx.globalAlpha = 0.5;
      ctx.fillStyle   = '#FF3C3C';
      ctx.font        = `700 9px 'Space Mono', monospace`;
      ctx.fillText('CAM', pipX + 7, pipY + pipFloat + 14);

      // Fake silhouette
      ctx.globalAlpha = 0.1;
      ctx.fillStyle   = '#FF3C3C';
      // head
      ctx.beginPath();
      ctx.arc(pipX + pipW / 2, pipY + pipFloat + pipH * 0.38, pipW * 0.22, 0, Math.PI * 2);
      ctx.fill();
      // shoulders
      ctx.globalAlpha = 0.06;
      ctx.beginPath();
      ctx.arc(pipX + pipW / 2, pipY + pipFloat + pipH * 0.82, pipW * 0.38, 0, Math.PI * 2);
      ctx.fill();

      // PIP border brackets
      const pbLen = 10;
      const pipCorners: [number, number, number, number][] = [
        [pipX,        pipY + pipFloat,         1,  1],
        [pipX + pipW, pipY + pipFloat,        -1,  1],
        [pipX,        pipY + pipFloat + pipH,  1, -1],
        [pipX + pipW, pipY + pipFloat + pipH, -1, -1],
      ];
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = '#FF3C3C';
      ctx.lineWidth   = 1.5;
      pipCorners.forEach(([cx2, cy2, sx, sy]) => {
        ctx.beginPath();
        ctx.moveTo(cx2, cy2 + sy * pbLen);
        ctx.lineTo(cx2, cy2);
        ctx.lineTo(cx2 + sx * pbLen, cy2);
        ctx.stroke();
      });

      // ── Info panel (bottom right) ─────────────────────
      const infoX = pipX, infoY = pipY + pipH + 14;
      const infoW = pipW, infoH = W * 0.12;
      const infoFloat = Math.cos(tick * 0.4) * 2;

      ctx.globalAlpha = 0.8;
      ctx.fillStyle   = 'rgba(13,13,26,0.8)';
      ctx.fillRect(infoX, infoY + infoFloat, infoW, infoH);
      ctx.globalAlpha = 0.14;
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth   = 0.5;
      ctx.strokeRect(infoX, infoY + infoFloat, infoW, infoH);

      const infoRows = [
        { label: 'FPS',  val: '60' },
        { label: 'RES',  val: '1920×1080' },
        { label: 'CODEC',val: 'H.264' },
      ];
      infoRows.forEach((row, ri) => {
        const ry2 = infoY + infoFloat + 14 + ri * 16;
        ctx.globalAlpha = 0.3;
        ctx.fillStyle   = '#8A8A9A';
        ctx.font        = `400 9px 'Space Mono', monospace`;
        ctx.fillText(row.label, infoX + 8, ry2);
        ctx.globalAlpha = 0.7;
        ctx.fillStyle   = '#FF3C3C';
        ctx.fillText(row.val, infoX + 48, ry2);
      });

      ctx.globalAlpha = 1;
    };

    draw();
    return () => cancelAnimationFrame(raf.current);
  }, []);

  return (
    <canvas
      ref={ref}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  );
}

export default function RecordingStudio() {
  const fadeUp = {
    initial:   { opacity: 0, y: 24 },
    animate:   { opacity: 1, y: 0  },
    transition:{ duration: 0.65, ease: [0.16, 1, 0.3, 1] },
  };

  return (
    <section
      style={{
        position: 'relative',
        zIndex: 1,
        minHeight: '100vh',
        padding: '8rem 2rem 6rem',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Red ambient vignette */}
      <div
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 55% at 50% 45%, rgba(255,60,60,0.07) 0%, transparent 70%)',
        }}
      />
      <div
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 110% 110% at 50% 50%, transparent 40%, rgba(255,40,40,0.04) 100%)',
        }}
      />

      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'center' }}>

        {/* LEFT — copy */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <motion.div {...fadeUp} style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.58rem', letterSpacing: '0.3em', color: '#FF3C3C', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
            RECORDING SYSTEM / 04
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 'clamp(2.8rem,5vw,4.8rem)',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: 1.0,
              margin: '0 0 1.5rem 0',
              color: '#F0EFEA',
            }}
          >
            Record.<br />
            <span style={{ fontStyle: 'italic', color: '#8A8A9A' }}>Ship.</span><br />
            <span style={{ color: '#FF3C3C' }}>Done.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: "'DM Sans',sans-serif",
              fontSize: '1.05rem',
              color: '#8A8A9A',
              lineHeight: 1.7,
              margin: '0 0 2.5rem 0',
              maxWidth: '420px',
            }}
          >
            Screen + webcam recording built for fast, high-quality demos.
            No setup. No friction. Just record — and ship content that converts.
          </motion.p>

          {/* Feature badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '3rem' }}
          >
            {['SCREEN + WEBCAM', 'INSTANT EXPORT', 'ZERO SETUP'].map(tag => (
              <span
                key={tag}
                style={{
                  fontFamily: "'Space Mono',monospace",
                  fontSize: '0.5rem',
                  letterSpacing: '0.12em',
                  color: '#FF3C3C',
                  border: '1px solid rgba(255,60,60,0.25)',
                  padding: '0.22rem 0.55rem',
                }}
              >
                {tag}
              </span>
            ))}
          </motion.div>

          {/* Status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
          >
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#C9A84C', boxShadow: '0 0 8px rgba(201,168,76,0.5)' }} />
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.52rem', color: '#C9A84C', letterSpacing: '0.15em' }}>
              BUILDING — EARLY ACCESS SOON
            </span>
          </motion.div>
        </div>

        {/* RIGHT — canvas studio visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: 'relative', height: '520px' }}
        >
          <StudioCanvas />
        </motion.div>
      </div>
    </section>
  );
}
