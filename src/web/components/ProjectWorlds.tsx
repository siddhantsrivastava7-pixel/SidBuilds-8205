import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';

/* ══════════════════════════════════════════════════════════════════════
   CINEMATIC WARP — 6-phase spatial transition from universe → RecFlow
   ══════════════════════════════════════════════════════════════════════ */

/**
 * Phase timing (ms from transition start):
 *   0–300   LOCK      — node focus ring + other nodes dim
 *   300–500 FREEZE    — scene static, contrast bump
 *   500–900 ZOOM      — rapid zoom into node, stars streak outward
 *   900–1350 MORPH    — circle expands, morphs into window frame
 *   1350–1850 REVEAL  — app environment materialises
 *   1850–2200 READY   — red REC dot breathes, glow settles
 *   2200     navigate
 */

type WarpPhase = 'lock' | 'freeze' | 'zoom' | 'morph' | 'reveal' | 'ready' | 'done';

function CinematicWarp({
  nodeRect,   // bounding rect of the RecFlow card in viewport coords
  onComplete,
}: {
  nodeRect: DOMRect;
  onComplete: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const doneRef   = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W   = window.innerWidth;
    const H   = window.innerHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    // Node centre (where RecFlow card is)
    const nx = nodeRect.left + nodeRect.width  / 2;
    const ny = nodeRect.top  + nodeRect.height / 2;

    // Star streak particles — start from edges, fly outward during zoom
    const STREAKS = 200;
    type Streak = { angle: number; speed: number; size: number; offset: number };
    const streaks: Streak[] = Array.from({ length: STREAKS }, (_, i) => ({
      angle:  (i / STREAKS) * Math.PI * 2 + (Math.random() - 0.5) * 0.15,
      speed:  0.6 + Math.random() * 0.8,
      size:   0.5 + Math.random() * 1.2,
      offset: Math.random(),
    }));

    // Timing constants
    const T_LOCK   = 0;
    const T_FREEZE = 300;
    const T_ZOOM   = 500;
    const T_MORPH  = 900;
    const T_REVEAL = 1350;
    const T_READY  = 1850;
    const T_END    = 2250;

    const ease = (t: number, p = 3) => 1 - Math.pow(1 - t, p);
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
    const phase01 = (elapsed: number, from: number, to: number) =>
      clamp01((elapsed - from) / (to - from));

    let startTime = 0;

    // ── Window frame corners (target state after morph) ──
    // We'll interpolate from a circle → rectangle
    const frameW = Math.min(W * 0.72, 640);
    const frameH = frameW * 0.62;
    const frameX = (W - frameW) / 2;
    const frameY = (H - frameH) / 2;

    // Accumulated particles for star-field during zoom
    const bgStars = Array.from({ length: 80 }, (_, i) => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 0.5 + Math.random() * 1,
      op: 0.1 + Math.random() * 0.5,
    }));

    const draw = (ts: number) => {
      if (doneRef.current) return;
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      rafRef.current = requestAnimationFrame(draw);

      ctx.clearRect(0, 0, W, H);

      // ─── Background ───────────────────────────────────
      const zoomProg = ease(phase01(elapsed, T_ZOOM, T_MORPH));
      // Vignette deepens during zoom
      const vignetteAlpha = 0.7 + zoomProg * 0.28;
      ctx.fillStyle = `rgba(5,5,8,${vignetteAlpha})`;
      ctx.fillRect(0, 0, W, H);

      // ─── PHASE: LOCK (0–300ms) ─────────────────────────
      if (elapsed >= T_LOCK && elapsed < T_MORPH) {
        const lockP = ease(phase01(elapsed, T_LOCK, T_FREEZE));

        // Focus ring around node — pulses in
        const ringRadius = 48 + (1 - lockP) * 18;
        ctx.globalAlpha = lockP * 0.85;
        ctx.strokeStyle = '#FF3C3C';
        ctx.lineWidth   = 1.2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.arc(nx, ny, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Second outer ring — slower
        const outerR = 64 + (1 - lockP) * 30;
        ctx.globalAlpha = lockP * 0.35;
        ctx.strokeStyle = 'rgba(255,60,60,0.5)';
        ctx.lineWidth   = 0.6;
        ctx.beginPath();
        ctx.arc(nx, ny, outerR, 0, Math.PI * 2);
        ctx.stroke();

        // Crosshair tick marks at 4 cardinal points
        ctx.globalAlpha = lockP * 0.7;
        ctx.strokeStyle = '#FF3C3C';
        ctx.lineWidth   = 1;
        [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach(ang => {
          const ix = nx + Math.cos(ang) * ringRadius;
          const iy = ny + Math.sin(ang) * ringRadius;
          ctx.beginPath();
          ctx.moveTo(ix, iy);
          ctx.lineTo(ix + Math.cos(ang) * 8, iy + Math.sin(ang) * 8);
          ctx.stroke();
        });

        // Node bright glow
        const glowR = 28 + lockP * 12;
        const grd = ctx.createRadialGradient(nx, ny, 0, nx, ny, glowR);
        grd.addColorStop(0, `rgba(255,60,60,${0.55 * lockP})`);
        grd.addColorStop(0.5, `rgba(255,20,20,${0.2 * lockP})`);
        grd.addColorStop(1, 'rgba(255,0,0,0)');
        ctx.globalAlpha = 1;
        ctx.fillStyle   = grd;
        ctx.beginPath(); ctx.arc(nx, ny, glowR, 0, Math.PI * 2); ctx.fill();

        // Node dot
        ctx.globalAlpha = 0.9 + lockP * 0.1;
        ctx.fillStyle   = '#FF3C3C';
        ctx.beginPath();
        ctx.arc(nx, ny, 6 + lockP * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // ─── PHASE: FREEZE (300–500ms) ────────────────────
      if (elapsed >= T_FREEZE && elapsed < T_ZOOM) {
        const fp = phase01(elapsed, T_FREEZE, T_ZOOM);
        // Subtle contrast flicker — whole screen gets slightly brighter then holds
        const contrastFlash = fp < 0.3 ? fp / 0.3 * 0.06 : 0.06 * (1 - (fp - 0.3) / 0.7);
        ctx.globalAlpha = contrastFlash;
        ctx.fillStyle   = 'rgba(255,255,255,1)';
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;

        // Keep lock ring solid during freeze
        ctx.strokeStyle = '#FF3C3C';
        ctx.lineWidth   = 1.5;
        ctx.globalAlpha = 0.9;
        ctx.beginPath(); ctx.arc(nx, ny, 48, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle   = '#FF3C3C';
        ctx.beginPath(); ctx.arc(nx, ny, 8, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }

      // ─── PHASE: ZOOM / WARP (500–900ms) ───────────────
      if (elapsed >= T_ZOOM && elapsed < T_MORPH) {
        const zp = ease(phase01(elapsed, T_ZOOM, T_MORPH), 4); // very fast ease

        // Background star-field — static dots
        bgStars.forEach(s => {
          ctx.globalAlpha = s.op * (0.3 + zp * 0.7);
          ctx.fillStyle   = '#F0EFEA';
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
        });

        // Streak lines flying outward from nx,ny — warp effect
        streaks.forEach(s => {
          const t = ((s.offset + zp * s.speed * 1.4) % 1);
          // Distance from node: starts near node, flies outward
          const d0 = t * Math.max(W, H) * 0.9;
          const d1 = d0 - (8 + zp * 60); // tail
          const hx = nx + Math.cos(s.angle) * d0;
          const hy = ny + Math.sin(s.angle) * d0;
          const tx = nx + Math.cos(s.angle) * Math.max(0, d1);
          const ty = ny + Math.sin(s.angle) * Math.max(0, d1);
          const alpha = (t < 0.15 ? t / 0.15 : t > 0.8 ? (1 - t) / 0.2 : 1) * zp * 0.65;
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = `rgba(255,${80 + Math.round(t * 50)},${60 + Math.round(t * 20)},1)`;
          ctx.lineWidth   = s.size * (0.5 + zp * 1.2);
          ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke();
        });

        // Node zooms in — scale up rapidly
        const nodeScale = 1 + zp * 8;
        const nodeR     = 8 * nodeScale;
        const glowR2    = nodeR * 3.5;
        const g2 = ctx.createRadialGradient(nx, ny, 0, nx, ny, glowR2);
        g2.addColorStop(0, `rgba(255,60,60,${0.7 * (1 - zp * 0.3)})`);
        g2.addColorStop(0.4, `rgba(255,20,20,${0.25 * (1 - zp * 0.2)})`);
        g2.addColorStop(1, 'rgba(255,0,0,0)');
        ctx.globalAlpha = 1;
        ctx.fillStyle   = g2;
        ctx.beginPath(); ctx.arc(nx, ny, glowR2, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle   = '#FF3C3C';
        ctx.beginPath(); ctx.arc(nx, ny, nodeR, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;

        // ── WIREFRAME GHOST UI ──────────────────────────
        // Appears mid-zoom: ghost outlines of the app window materialise
        // at full scale, then solidify. Feels like system loading into reality.
        // Wireframe appears from zp=0.35, peaks at zp=0.75, then hands off to morph.
        if (zp > 0.30) {
          const wf = clamp01((zp - 0.30) / 0.45); // 0→1 over zoom second half
          // solidify = how filled they are (0=pure wireframe, 1=solid)
          // They stay wireframe during zoom and only start solidifying near the end
          const solidify = clamp01((zp - 0.65) / 0.35);

          const wfColor  = `rgba(255,60,60,${wf * 0.55})`;
          const fillOpacity = solidify * wf * 0.85;
          const wfStroke = wf * (1 - solidify * 0.6);

          ctx.save();

          // ── Outer window frame ─────────────────────────
          ctx.globalAlpha = wfStroke;
          ctx.strokeStyle = wfColor;
          ctx.lineWidth   = 0.8;
          ctx.setLineDash([3, 2]);
          ctx.beginPath();
          ctx.roundRect(frameX, frameY, frameW, frameH, 6);
          ctx.stroke();
          ctx.setLineDash([]);

          // Fill solidifies in
          if (fillOpacity > 0) {
            ctx.globalAlpha = fillOpacity * 0.92;
            ctx.fillStyle   = 'rgba(8,8,16,1)';
            ctx.beginPath();
            ctx.roundRect(frameX, frameY, frameW, frameH, 6);
            ctx.fill();
          }

          // ── Title bar ──────────────────────────────────
          const tbH = frameH * 0.1;
          ctx.globalAlpha = wfStroke * 0.7;
          ctx.strokeStyle = `rgba(255,60,60,${wf * 0.4})`;
          ctx.lineWidth   = 0.6;
          ctx.setLineDash([2, 3]);
          ctx.strokeRect(frameX, frameY, frameW, tbH);
          ctx.setLineDash([]);

          if (fillOpacity > 0) {
            ctx.globalAlpha = fillOpacity * 0.96;
            ctx.fillStyle   = 'rgba(16,16,26,1)';
            ctx.beginPath();
            ctx.roundRect(frameX, frameY, frameW, tbH, [6, 6, 0, 0]);
            ctx.fill();
          }

          // Traffic light dots — wireframe circles → solid
          ['#FF5F57','#FFBD2E','#28C840'].forEach((col, i) => {
            const dotX = frameX + 14 + i * 18;
            const dotY = frameY + tbH / 2;
            ctx.globalAlpha = wfStroke * 0.55;
            ctx.strokeStyle = col;
            ctx.lineWidth   = 0.7;
            ctx.beginPath(); ctx.arc(dotX, dotY, 5, 0, Math.PI * 2); ctx.stroke();
            if (solidify > 0) {
              ctx.globalAlpha = solidify * wf * 0.9;
              ctx.fillStyle   = col;
              ctx.beginPath(); ctx.arc(dotX, dotY, 5, 0, Math.PI * 2); ctx.fill();
            }
          });

          // ── Content rows — ghost lines ─────────────────
          const contentY = frameY + tbH + 10;
          const contentH = frameH - tbH - 20;
          for (let ri = 0; ri < 8; ri++) {
            // Stagger: each row appears slightly after the previous
            const rowDelay = ri * 0.06;
            const rowWf = clamp01((wf - rowDelay) / (1 - rowDelay));
            if (rowWf <= 0) continue;
            const ry = contentY + contentH * (0.08 + ri * 0.105);
            const rw = frameW * (ri % 3 === 0 ? 0.52 : ri % 2 === 0 ? 0.78 : 0.63) * 0.88;
            const rx = frameX + frameW * 0.05;
            const rh = ri % 3 === 0 ? 3.5 : 1.5;

            // Wireframe stroke
            ctx.globalAlpha = rowWf * wfStroke * (ri % 3 === 0 ? 0.55 : 0.3);
            ctx.strokeStyle = ri % 3 === 0 ? `rgba(255,60,60,0.7)` : `rgba(100,100,180,0.5)`;
            ctx.lineWidth   = 0.5;
            ctx.strokeRect(rx, ry - rh / 2, rw, rh);

            // Solidify fill
            if (solidify > 0) {
              ctx.globalAlpha = rowWf * solidify * (ri % 3 === 0 ? 0.3 : 0.1);
              ctx.fillStyle   = ri % 3 === 0 ? '#F0EFEA' : '#6A6A9A';
              ctx.fillRect(rx, ry - rh / 2, rw, rh);
            }
          }

          // ── Sidebar outline ────────────────────────────
          const sideW = frameW * 0.28;
          const sideX = frameX + frameW - sideW;
          ctx.globalAlpha = wfStroke * 0.45;
          ctx.strokeStyle = `rgba(255,60,60,${wf * 0.35})`;
          ctx.lineWidth   = 0.6;
          ctx.setLineDash([2, 4]);
          ctx.strokeRect(sideX, frameY + tbH + 1, sideW, contentH + 9);
          ctx.setLineDash([]);

          if (fillOpacity > 0) {
            ctx.globalAlpha = fillOpacity * 0.65;
            ctx.fillStyle   = 'rgba(14,14,22,1)';
            ctx.fillRect(sideX, frameY + tbH + 1, sideW, contentH + 9);
          }

          // Sidebar source dots (3 stacked)
          for (let di = 0; di < 3; di++) {
            const dotY2 = frameY + tbH + 28 + di * 22;
            ctx.globalAlpha = wfStroke * 0.4;
            ctx.strokeStyle = `rgba(255,60,60,${wf * 0.5})`;
            ctx.lineWidth   = 0.6;
            ctx.beginPath(); ctx.arc(sideX + 14, dotY2, 3.5, 0, Math.PI * 2); ctx.stroke();
            // Line label placeholder
            ctx.globalAlpha = wfStroke * 0.25;
            ctx.strokeStyle = `rgba(200,200,220,0.4)`;
            ctx.lineWidth   = 0.5;
            ctx.beginPath();
            ctx.moveTo(sideX + 22, dotY2);
            ctx.lineTo(sideX + sideW * 0.72, dotY2);
            ctx.stroke();
          }

          // ── Webcam PIP outline ─────────────────────────
          const camW2  = sideW * 0.8;
          const camH2  = camW2 * 0.62;
          const camX2  = sideX + 8;
          const camY3  = frameY + frameH - camH2 - 16;
          ctx.globalAlpha = wfStroke * 0.5;
          ctx.strokeStyle = `rgba(255,60,60,${wf * 0.45})`;
          ctx.lineWidth   = 0.7;
          ctx.setLineDash([2, 2]);
          ctx.strokeRect(camX2, camY3, camW2, camH2);
          ctx.setLineDash([]);
          // Face circle wireframe
          ctx.globalAlpha = wfStroke * 0.2;
          ctx.beginPath();
          ctx.arc(camX2 + camW2 / 2, camY3 + camH2 * 0.38, camW2 * 0.22, 0, Math.PI * 2);
          ctx.stroke();

          if (fillOpacity > 0) {
            ctx.globalAlpha = fillOpacity * 0.8;
            ctx.fillStyle   = 'rgba(5,5,10,1)';
            ctx.fillRect(camX2, camY3, camW2, camH2);
          }

          // ── Bottom toolbar ─────────────────────────────
          const btY2 = frameY + frameH - 36;
          ctx.globalAlpha = wfStroke * 0.35;
          ctx.strokeStyle = `rgba(255,60,60,${wf * 0.3})`;
          ctx.lineWidth   = 0.5;
          ctx.setLineDash([3, 3]);
          ctx.strokeRect(frameX, btY2, frameW, 36);
          ctx.setLineDash([]);

          if (fillOpacity > 0) {
            ctx.globalAlpha = fillOpacity * 0.88;
            ctx.fillStyle   = 'rgba(10,10,18,1)';
            ctx.fillRect(frameX, btY2, frameW, 36);
          }

          // Timeline bar wireframe
          const barX2 = frameX + 70, barY2 = btY2 + 15, barW2 = frameW - 140;
          ctx.globalAlpha = wfStroke * 0.35;
          ctx.strokeStyle = `rgba(255,60,60,${wf * 0.35})`;
          ctx.lineWidth   = 0.5;
          ctx.strokeRect(barX2, barY2 - 1, barW2, 4);

          // Record button circle
          const rbX = barX2 + barW2 + 30, rbY = btY2 + 18;
          ctx.globalAlpha = wfStroke * 0.55;
          ctx.strokeStyle = `rgba(255,60,60,${wf * 0.6})`;
          ctx.lineWidth   = 0.8;
          ctx.beginPath(); ctx.arc(rbX, rbY, 8, 0, Math.PI * 2); ctx.stroke();
          if (solidify > 0) {
            ctx.globalAlpha = solidify * wf * 0.85;
            ctx.fillStyle   = '#FF3C3C';
            ctx.beginPath(); ctx.arc(rbX, rbY, 8, 0, Math.PI * 2); ctx.fill();
          }

          ctx.restore();
        }
      }

      // ─── PHASE: MORPH (900–1350ms) ────────────────────
      if (elapsed >= T_MORPH && elapsed < T_REVEAL) {
        const mp = ease(phase01(elapsed, T_MORPH, T_REVEAL), 2.5);

        // Interpolate from circle (at nx,ny) → rectangle (frameX,Y,W,H)
        const cRadius = lerp(80, 0, mp); // circle radius → 0 as it becomes rect
        const rW = lerp(0, frameW, mp);
        const rH = lerp(0, frameH, mp);
        const rX = lerp(nx - rW / 2, frameX, mp);
        const rY = lerp(ny - rH / 2, frameY, mp);

        // Background: slight fade toward dark
        bgStars.forEach(s => {
          ctx.globalAlpha = s.op * (1 - mp * 0.6);
          ctx.fillStyle   = '#F0EFEA';
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
        });

        // Glow expanding outward
        const bigGlow = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, frameW * 0.8 * mp);
        bigGlow.addColorStop(0, `rgba(255,40,40,${0.12 * mp})`);
        bigGlow.addColorStop(1, 'rgba(255,0,0,0)');
        ctx.globalAlpha = 1;
        ctx.fillStyle   = bigGlow;
        ctx.fillRect(0, 0, W, H);

        // Draw morphing shape: blended circle→rect using clip trick
        ctx.globalAlpha = 1;
        // Frame border
        const borderAlpha = 0.3 + mp * 0.55;
        ctx.strokeStyle   = `rgba(255,60,60,${borderAlpha})`;
        ctx.lineWidth     = 1.5;
        // Draw rounded rect that starts as circle, becomes rect
        const cornerR = lerp(rW / 2, 6, mp); // radius from "circle" → small corner
        ctx.beginPath();
        ctx.roundRect(rX, rY, rW, rH, cornerR);
        ctx.stroke();

        // Fill with very dark glass
        ctx.fillStyle = `rgba(8,8,16,${mp * 0.9})`;
        ctx.beginPath();
        ctx.roundRect(rX, rY, rW, rH, cornerR);
        ctx.fill();

        // Corner bracket markers appear
        if (mp > 0.5) {
          const bmp = (mp - 0.5) / 0.5;
          const bLen = 12 * bmp;
          ctx.globalAlpha = bmp * 0.8;
          ctx.strokeStyle = '#FF3C3C';
          ctx.lineWidth   = 1.5;
          const corners: [number, number, number, number][] = [
            [rX,      rY,      1,  1],
            [rX + rW, rY,     -1,  1],
            [rX,      rY + rH, 1, -1],
            [rX + rW, rY + rH,-1, -1],
          ];
          corners.forEach(([cx2, cy2, sx, sy]) => {
            ctx.beginPath();
            ctx.moveTo(cx2, cy2 + sy * bLen);
            ctx.lineTo(cx2, cy2);
            ctx.lineTo(cx2 + sx * bLen, cy2);
            ctx.stroke();
          });
          ctx.globalAlpha = 1;
        }

        // Central dot dissolving
        const dotAlpha = Math.max(0, 1 - mp * 2.5);
        if (dotAlpha > 0) {
          ctx.globalAlpha = dotAlpha;
          ctx.fillStyle   = '#FF3C3C';
          ctx.beginPath(); ctx.arc(nx, ny, 8 + mp * 20, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      // ─── PHASE: REVEAL (1350–1850ms) ──────────────────
      if (elapsed >= T_REVEAL && elapsed < T_READY) {
        const rp = ease(phase01(elapsed, T_REVEAL, T_READY), 2);

        // Frame solid now
        ctx.fillStyle = `rgba(8,8,16,0.97)`;
        ctx.beginPath(); ctx.roundRect(frameX, frameY, frameW, frameH, 6); ctx.fill();
        ctx.strokeStyle = `rgba(255,60,60,${0.45 + rp * 0.25})`;
        ctx.lineWidth   = 1.5;
        ctx.beginPath(); ctx.roundRect(frameX, frameY, frameW, frameH, 6); ctx.stroke();

        // Title bar slides in from top
        const titleBarH = frameH * 0.1;
        ctx.globalAlpha = rp;
        ctx.fillStyle   = 'rgba(16,16,26,0.98)';
        ctx.beginPath(); ctx.roundRect(frameX, frameY, frameW, titleBarH, [6, 6, 0, 0]); ctx.fill();
        ctx.fillStyle   = 'rgba(255,255,255,0.04)';
        ctx.fillRect(frameX, frameY + titleBarH - 0.5, frameW, 1);

        // Traffic lights
        ['#FF5F57','#FFBD2E','#28C840'].forEach((col, i) => {
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(frameX + 14 + i * 18, frameY + titleBarH / 2, 5, 0, Math.PI * 2);
          ctx.fill();
        });

        // App title
        ctx.fillStyle = 'rgba(240,239,234,0.55)';
        ctx.font      = `500 12px -apple-system, 'DM Sans', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('RecFlow', frameX + frameW / 2, frameY + titleBarH / 2 + 4);
        ctx.textAlign = 'left';

        // Content area — rows materialising
        const contentY = frameY + titleBarH + 10;
        const contentH = frameH - titleBarH - 20;
        const rowCount = 8;
        for (let ri = 0; ri < rowCount; ri++) {
          const rowProg = clamp01((rp * 1.6 - ri * 0.12));
          if (rowProg <= 0) continue;
          const ry = contentY + contentH * (0.08 + ri * 0.105);
          const rw = frameW * (ri % 3 === 0 ? 0.52 : ri % 2 === 0 ? 0.78 : 0.63) * 0.88 * rowProg;
          const rx = frameX + frameW * 0.05;
          ctx.globalAlpha = rowProg * (ri % 3 === 0 ? 0.3 : 0.1);
          ctx.fillStyle   = ri % 3 === 0 ? '#F0EFEA' : '#6A6A9A';
          ctx.fillRect(rx, ry, rw, ri % 3 === 0 ? 3 : 1.5);
        }

        // Sidebar slides in from right
        const sideW = frameW * 0.28;
        const sideX = frameX + frameW - sideW - (1 - rp) * sideW;
        ctx.globalAlpha = rp * 0.7;
        ctx.fillStyle   = 'rgba(14,14,22,0.85)';
        ctx.fillRect(sideX, frameY + titleBarH + 1, sideW - frameX + sideX, contentH + 9);

        // Webcam PIP fades in
        const camAlpha = Math.max(0, rp - 0.5) * 2;
        if (camAlpha > 0) {
          const camW = sideW * 0.8;
          const camH = camW * 0.62;
          const camX = sideX + sideW * 0.1 - (sideW - (sideX - frameX - frameW + sideW));
          const camY2 = frameY + frameH - camH - 16;
          ctx.globalAlpha = camAlpha * 0.7;
          ctx.fillStyle   = 'rgba(5,5,10,0.9)';
          ctx.fillRect(sideX + 8, camY2, camW, camH);
          ctx.strokeStyle = 'rgba(255,60,60,0.4)';
          ctx.lineWidth   = 0.8;
          ctx.strokeRect(sideX + 8, camY2, camW, camH);
        }

        // Corner brackets full-length now
        const bLen = 14;
        ctx.globalAlpha = 0.6 + rp * 0.4;
        ctx.strokeStyle = '#FF3C3C';
        ctx.lineWidth   = 1.5;
        const fc: [number, number, number, number][] = [
          [frameX,          frameY,          1,  1],
          [frameX + frameW, frameY,         -1,  1],
          [frameX,          frameY + frameH, 1, -1],
          [frameX + frameW, frameY + frameH,-1, -1],
        ];
        fc.forEach(([bx, by, sx, sy]) => {
          ctx.beginPath();
          ctx.moveTo(bx, by + sy * bLen);
          ctx.lineTo(bx, by);
          ctx.lineTo(bx + sx * bLen, by);
          ctx.stroke();
        });

        ctx.globalAlpha = 1;
      }

      // ─── PHASE: READY (1850–2250ms) ───────────────────
      if (elapsed >= T_READY) {
        const rdp = ease(phase01(elapsed, T_READY, T_END), 2);
        // Entire frame visible — steady state
        ctx.fillStyle = 'rgba(8,8,16,0.97)';
        ctx.beginPath(); ctx.roundRect(frameX, frameY, frameW, frameH, 6); ctx.fill();
        ctx.strokeStyle = 'rgba(255,60,60,0.55)';
        ctx.lineWidth   = 1.5;
        ctx.beginPath(); ctx.roundRect(frameX, frameY, frameW, frameH, 6); ctx.stroke();

        // Title bar
        const titleBarH = frameH * 0.1;
        ctx.fillStyle   = 'rgba(16,16,26,0.98)';
        ctx.beginPath(); ctx.roundRect(frameX, frameY, frameW, titleBarH, [6, 6, 0, 0]); ctx.fill();
        ctx.fillStyle   = 'rgba(255,255,255,0.04)';
        ctx.fillRect(frameX, frameY + titleBarH - 0.5, frameW, 1);
        ['#FF5F57','#FFBD2E','#28C840'].forEach((col, i) => {
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(frameX + 14 + i * 18, frameY + titleBarH / 2, 5, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.fillStyle = 'rgba(240,239,234,0.6)';
        ctx.font      = `500 12px -apple-system, 'DM Sans', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('RecFlow', frameX + frameW / 2, frameY + titleBarH / 2 + 4);
        ctx.textAlign = 'left';

        // Content rows — fully visible
        const contentY2 = frameY + titleBarH + 10;
        const contentH2 = frameH - titleBarH - 20;
        for (let ri = 0; ri < 8; ri++) {
          const ry = contentY2 + contentH2 * (0.08 + ri * 0.105);
          const rw = frameW * (ri % 3 === 0 ? 0.52 : ri % 2 === 0 ? 0.78 : 0.63) * 0.88;
          const rx = frameX + frameW * 0.05;
          ctx.globalAlpha = ri % 3 === 0 ? 0.28 : 0.1;
          ctx.fillStyle   = ri % 3 === 0 ? '#F0EFEA' : '#6A6A9A';
          ctx.fillRect(rx, ry, rw, ri % 3 === 0 ? 3 : 1.5);
        }

        // REC dot — breathing pulse
        const breathPeriod = 0.8; // seconds
        const breathT = (elapsed - T_READY) / 1000;
        const breath  = 0.65 + Math.sin((breathT / breathPeriod) * Math.PI * 2) * 0.35;
        const rdotX   = frameX + frameW - 22;
        const rdotY   = frameY + titleBarH / 2;

        // Outer glow ring
        const pulse1 = rdp * breath;
        const rg = ctx.createRadialGradient(rdotX, rdotY, 0, rdotX, rdotY, 22);
        rg.addColorStop(0, `rgba(255,60,60,${0.45 * pulse1})`);
        rg.addColorStop(1, 'rgba(255,60,60,0)');
        ctx.globalAlpha = 1;
        ctx.fillStyle   = rg;
        ctx.beginPath(); ctx.arc(rdotX, rdotY, 22, 0, Math.PI * 2); ctx.fill();

        // Dot itself
        ctx.fillStyle   = '#FF3C3C';
        ctx.globalAlpha = 0.5 + rdp * 0.5;
        ctx.beginPath(); ctx.arc(rdotX, rdotY, 5 + rdp * breath * 1.5, 0, Math.PI * 2); ctx.fill();

        // REC label
        ctx.globalAlpha = rdp * 0.8;
        ctx.fillStyle   = '#FF3C3C';
        ctx.font        = `700 9px 'Space Mono', monospace`;
        ctx.textAlign   = 'right';
        ctx.fillText('REC', rdotX - 9, rdotY + 3);
        ctx.textAlign   = 'left';

        // Corner brackets
        const bLen = 14;
        ctx.globalAlpha = 0.75;
        ctx.strokeStyle = '#FF3C3C';
        ctx.lineWidth   = 1.5;
        const fc2: [number, number, number, number][] = [
          [frameX,          frameY,          1,  1],
          [frameX + frameW, frameY,         -1,  1],
          [frameX,          frameY + frameH, 1, -1],
          [frameX + frameW, frameY + frameH,-1, -1],
        ];
        fc2.forEach(([bx, by, sx, sy]) => {
          ctx.beginPath();
          ctx.moveTo(bx, by + sy * bLen);
          ctx.lineTo(bx, by);
          ctx.lineTo(bx + sx * bLen, by);
          ctx.stroke();
        });

        ctx.globalAlpha = 1;
      }

      // ─── DONE ─────────────────────────────────────────
      if (elapsed >= T_END && !doneRef.current) {
        doneRef.current = true;
        cancelAnimationFrame(rafRef.current);
        onComplete();
      }
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, []);  // eslint-disable-line

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        pointerEvents: 'all',
        cursor: 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   RECALL COLLAPSE — inward implosion, entering the memory space
   Phases:
     0–400   FOCUS     — card pulls focus, everything else dims
     400–900 IMPLODE   — concentric rings collapse inward to card centre
     900–1400 DISSOLVE — screen bleeds to deep purple-black, fragments
                         of text/nodes ghost into view then fade
     1400–1900 VOID    — silence, single glowing point, then
     1900     navigate
   ══════════════════════════════════════════════════════════════════════ */
function RecallCollapse({
  nodeRect,
  onComplete,
}: {
  nodeRect: DOMRect;
  onComplete: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const doneRef   = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W   = window.innerWidth;
    const H   = window.innerHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    // Origin = centre of Recall card
    const ox = nodeRect.left + nodeRect.width  / 2;
    const oy = nodeRect.top  + nodeRect.height / 2;

    // Phase timestamps
    const T_FOCUS   = 0;
    const T_IMPLODE = 400;
    const T_DISSOLVE = 900;
    const T_VOID    = 1400;
    const T_NAVIGATE= 1900;

    const cl  = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
    const p01 = (t: number, a: number, b: number) => cl((t - a) / (b - a));
    const ease3 = (t: number) => 1 - Math.pow(1 - t, 3);
    const easeIn3 = (t: number) => t * t * t;

    // Ghost fragment text snippets that briefly appear
    const GHOSTS = [
      { text: 'stripe webhook secret',   x: W*0.18, y: H*0.28 },
      { text: 'idempotency key pattern', x: W*0.68, y: H*0.22 },
      { text: 'ngrok tunnel setup',      x: W*0.12, y: H*0.62 },
      { text: 'checkout.session…',       x: W*0.72, y: H*0.68 },
      { text: 'verify_signature()',      x: W*0.42, y: H*0.78 },
      { text: 'webhook retry logic',     x: W*0.78, y: H*0.45 },
    ];

    // Rings — collapse from large radius down to zero at ox,oy
    const RINGS = 8;

    let startTime = 0;

    const draw = (ts: number) => {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;

      if (doneRef.current) return;

      ctx.clearRect(0, 0, W, H);

      // ─── Phase 1: FOCUS — dim everything except card area ───────────
      const focusP = ease3(p01(elapsed, T_FOCUS, T_IMPLODE));

      // Darken overlay
      const overlayAlpha = focusP * 0.72;
      ctx.fillStyle = `rgba(6,5,15,${overlayAlpha})`;
      ctx.fillRect(0, 0, W, H);

      // Card highlight — keep card area slightly visible during focus
      if (elapsed < T_DISSOLVE) {
        const cardGlowA = focusP * 0.18 * (1 - p01(elapsed, T_IMPLODE, T_DISSOLVE));
        const cGrd = ctx.createRadialGradient(ox, oy, 0, ox, oy, 220);
        cGrd.addColorStop(0, `rgba(130,90,230,${cardGlowA})`);
        cGrd.addColorStop(1, 'transparent');
        ctx.fillStyle = cGrd;
        ctx.fillRect(0, 0, W, H);
      }

      // ─── Phase 2: IMPLODE — rings rush inward ───────────────────────
      if (elapsed >= T_IMPLODE) {
        const implodeP = p01(elapsed, T_IMPLODE, T_DISSOLVE);

        for (let i = 0; i < RINGS; i++) {
          // Each ring starts at a different outer radius and collapses
          const phase = i / RINGS;
          const ringP = ease3(cl((implodeP - phase * 0.18) / 0.82));
          if (ringP <= 0) continue;

          // Radius shrinks from (max screen diagonal * spread) → 0
          const maxR = Math.hypot(
            Math.max(ox, W - ox),
            Math.max(oy, H - oy)
          ) * (0.5 + (1 - phase) * 0.8);
          const r = maxR * (1 - easeIn3(ringP));

          if (r < 1) continue;

          const alpha = (1 - ringP) * (0.12 + phase * 0.08);
          const hue = 250 + phase * 20;
          ctx.beginPath();
          ctx.arc(ox, oy, r, 0, Math.PI * 2);
          ctx.strokeStyle = `hsla(${hue},65%,72%,${alpha})`;
          ctx.lineWidth = 0.8 + phase * 0.5;
          ctx.stroke();
        }

        // Node dot at origin — grows as rings converge
        const dotAlpha = ease3(implodeP) * 0.9;
        const dotR = 2 + ease3(implodeP) * 8;
        const dotGrd = ctx.createRadialGradient(ox, oy, 0, ox, oy, dotR * 3);
        dotGrd.addColorStop(0, `rgba(180,140,255,${dotAlpha})`);
        dotGrd.addColorStop(0.4, `rgba(130,90,230,${dotAlpha * 0.5})`);
        dotGrd.addColorStop(1, 'transparent');
        ctx.fillStyle = dotGrd;
        ctx.beginPath(); ctx.arc(ox, oy, dotR * 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(220,200,255,${dotAlpha})`;
        ctx.beginPath(); ctx.arc(ox, oy, dotR * 0.6, 0, Math.PI * 2); ctx.fill();
      }

      // ─── Phase 3: DISSOLVE — screen fills, ghost fragments appear ───
      if (elapsed >= T_DISSOLVE) {
        const dissolveP = p01(elapsed, T_DISSOLVE, T_VOID);

        // Fill bleeds outward from ox,oy — purple→dark
        const fillR = ease3(dissolveP) * Math.hypot(W, H);
        const fillGrd = ctx.createRadialGradient(ox, oy, 0, ox, oy, fillR);
        fillGrd.addColorStop(0,   `rgba(20,12,45,${ease3(dissolveP)})`);
        fillGrd.addColorStop(0.5, `rgba(10,7,25,${dissolveP * 0.95})`);
        fillGrd.addColorStop(1,   `rgba(6,5,15,${dissolveP * 0.85})`);
        ctx.fillStyle = fillGrd;
        ctx.fillRect(0, 0, W, H);

        // Ghost fragments — appear briefly then fade
        ctx.font = "400 11px 'Space Mono', monospace";
        GHOSTS.forEach((g, i) => {
          const gDelay = i * 0.12;
          const gP = p01(dissolveP, gDelay, gDelay + 0.35);
          if (gP <= 0) return;
          // Bell curve: rise then fade
          const bell = gP < 0.5 ? gP * 2 : 2 - gP * 2;
          const alpha = bell * 0.28;
          ctx.fillStyle = `rgba(160,130,240,${alpha})`;
          ctx.textAlign = 'left';
          ctx.fillText(g.text, g.x, g.y);

          // Small dot beside text
          ctx.beginPath();
          ctx.arc(g.x - 10, g.y - 4, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(160,130,240,${alpha * 1.5})`;
          ctx.fill();
        });
      }

      // ─── Phase 4: VOID — deep darkness, single collapsing point ─────
      if (elapsed >= T_VOID) {
        const voidP = p01(elapsed, T_VOID, T_NAVIGATE);

        // Full dark fill
        ctx.fillStyle = `rgba(6,5,15,${voidP * 0.95})`;
        ctx.fillRect(0, 0, W, H);

        // Central point — breathes then collapses
        const dotScale = 1 - easeIn3(voidP);
        if (dotScale > 0) {
          const r = 6 * dotScale;
          const g = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, r * 6);
          g.addColorStop(0, `rgba(190,160,255,${dotScale * 0.9})`);
          g.addColorStop(0.5, `rgba(130,90,230,${dotScale * 0.4})`);
          g.addColorStop(1, 'transparent');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(W/2, H/2, r * 6, 0, Math.PI * 2); ctx.fill();

          ctx.fillStyle = `rgba(230,215,255,${dotScale})`;
          ctx.beginPath(); ctx.arc(W/2, H/2, r * 0.5, 0, Math.PI * 2); ctx.fill();
        }

        // Navigate at end
        if (!doneRef.current && voidP >= 0.98) {
          doneRef.current = true;
          onComplete();
          return;
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(rafRef.current); };
  }, [nodeRect, onComplete]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      pointerEvents: 'all',
    }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}

/* ── Per-project atmosphere canvas ────────────────── */
// Each project has a distinct particle BEHAVIOR — not just colors
// mera    → sharp grid, fast scan, structured deterministic
// saver   → inward compression — streams converge, compress, burst
// recall  → slow drift, node pulses lit by search ripple
// recflow → floating recording studio interface, REC dot, timeline, pip webcam
function AtmosphereCanvas({ type, accent, active }: { type: string; accent: string; active: boolean }) {
  const ref  = useRef<HTMLCanvasElement>(null);
  const raf  = useRef<number>(0);
  const mouseRef = useRef({ x: -999, y: -999 });

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = canvas.offsetWidth, H = canvas.offsetHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    let t = 0;

    // Mouse tracking (for grid proximity glow)
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = (e.clientX - rect.left);
      mouseRef.current.y = (e.clientY - rect.top);
    };
    const onLeave = () => { mouseRef.current.x = -999; mouseRef.current.y = -999; };
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);

    // ─────────────────────────────────────────────────
    if (type === 'grid') {
      // MeraPolicyAdvisor — signal grid with scan line + mouse-proximity glow on intersections
      const step = 28;
      const draw = () => {
        raf.current = requestAnimationFrame(draw);
        t += 0.012;
        ctx.clearRect(0, 0, W, H);

        // base grid
        ctx.strokeStyle = accent;
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = active ? 0.18 : 0.06;
        for (let x = 0; x <= W; x += step) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
        for (let y = 0; y <= H; y += step) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }

        // scan line
        const sy = (t * 40) % H;
        const scanGrd = ctx.createLinearGradient(0, sy - 18, 0, sy + 18);
        scanGrd.addColorStop(0, 'rgba(0,0,0,0)');
        scanGrd.addColorStop(0.5, accent);
        scanGrd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = active ? 0.32 : 0.06;
        ctx.fillStyle = scanGrd;
        ctx.fillRect(0, sy - 18, W, 36);

        // mouse proximity glow on nearest intersection
        const mx = mouseRef.current.x, my = mouseRef.current.y;
        if (mx > 0 && active) {
          const nearX = Math.round(mx / step) * step;
          const nearY = Math.round(my / step) * step;
          // glow at nearest point
          const dist = Math.hypot(mx - nearX, my - nearY);
          const intensity = Math.max(0, 1 - dist / 40);
          if (intensity > 0) {
            const grd = ctx.createRadialGradient(nearX, nearY, 0, nearX, nearY, 28);
            grd.addColorStop(0, accent + 'CC');
            grd.addColorStop(0.4, accent + '44');
            grd.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.globalAlpha = intensity * 0.9;
            ctx.fillStyle = grd;
            ctx.beginPath(); ctx.arc(nearX, nearY, 28, 0, Math.PI * 2); ctx.fill();

            // dot at intersection
            ctx.globalAlpha = intensity;
            ctx.fillStyle = accent;
            ctx.beginPath(); ctx.arc(nearX, nearY, 3, 0, Math.PI * 2); ctx.fill();
          }

          // also highlight nearby intersections with falloff
          for (let gx = Math.max(0, nearX - step * 2); gx <= Math.min(W, nearX + step * 2); gx += step) {
            for (let gy = Math.max(0, nearY - step * 2); gy <= Math.min(H, nearY + step * 2); gy += step) {
              if (gx === nearX && gy === nearY) continue;
              const d2 = Math.hypot(mx - gx, my - gy);
              const i2 = Math.max(0, 1 - d2 / 80) * 0.4;
              if (i2 > 0.01) {
                ctx.globalAlpha = i2;
                ctx.fillStyle = accent;
                ctx.beginPath(); ctx.arc(gx, gy, 2, 0, Math.PI * 2); ctx.fill();
              }
            }
          }
        }

        // signal pulses
        if (active) {
          [W * 0.2, W * 0.5, W * 0.8].forEach((x, i) => {
            const py = (t * 32 + i * H / 3) % H;
            ctx.globalAlpha = 0.55;
            ctx.beginPath(); ctx.arc(x, py, 3, 0, Math.PI * 2);
            ctx.fillStyle = accent; ctx.fill();
            ctx.globalAlpha = 0.12;
            ctx.beginPath(); ctx.arc(x, py, 9, 0, Math.PI * 2);
            ctx.fillStyle = accent; ctx.fill();
          });
        }
        ctx.globalAlpha = 1;
      };
      draw();
    }

    // ─────────────────────────────────────────────────
    else if (type === 'streams') {
      // Super Saver — particles converge edges→center, compress, burst, loop
      const TOTAL = active ? 80 : 40;

      type StreamPt = {
        x: number; y: number;
        startX: number; startY: number;
        speed: number; life: number; maxLife: number;
        phase: 'travel' | 'compress' | 'burst';
        angle: number; burstV: number;
      };

      const spawnEdge = (): StreamPt => {
        const side = Math.floor(Math.random() * 4);
        let sx: number, sy: number;
        if (side === 0) { sx = Math.random() * W; sy = 0; }
        else if (side === 1) { sx = W; sy = Math.random() * H; }
        else if (side === 2) { sx = Math.random() * W; sy = H; }
        else { sx = 0; sy = Math.random() * H; }
        return {
          x: sx, y: sy,
          startX: sx, startY: sy,
          speed: 0.8 + Math.random() * 1.0,
          life: 0, maxLife: 100 + Math.random() * 60,
          phase: 'travel',
          angle: Math.atan2(H/2 - sy, W/2 - sx),
          burstV: 0,
        };
      };

      const streams: StreamPt[] = Array.from({ length: TOTAL }, () => {
        const s = spawnEdge();
        s.life = Math.random() * s.maxLife;
        return s;
      });

      // burst particles
      type BurstPt = { x: number; y: number; vx: number; vy: number; life: number; };
      const bursts: BurstPt[] = [];
      let burstCooldown = 0;

      const draw = () => {
        raf.current = requestAnimationFrame(draw);
        t += 0.01;
        ctx.clearRect(0, 0, W, H);
        burstCooldown--;

        const cx = W * 0.5, cy = H * 0.5;

        streams.forEach(s => {
          s.life += s.speed;
          const prog = s.life / s.maxLife;

          if (prog >= 1) {
            // reached center — trigger burst
            if (burstCooldown <= 0 && active) {
              for (let b = 0; b < 8; b++) {
                const ba = Math.random() * Math.PI * 2;
                bursts.push({ x: cx, y: cy, vx: Math.cos(ba) * (1 + Math.random() * 2), vy: Math.sin(ba) * (1 + Math.random() * 2), life: 40 + Math.random() * 20 });
              }
              burstCooldown = 18;
            }
            Object.assign(s, spawnEdge());
            return;
          }

          // travel arc toward center
          const ease = prog < 0.5 ? 2 * prog * prog : 1 - Math.pow(-2 * prog + 2, 2) / 2;
          const curX = s.startX + (cx - s.startX) * ease;
          const curY = s.startY + (cy - s.startY) * ease;
          const alpha = prog < 0.15 ? prog / 0.15 : prog > 0.85 ? (1 - prog) / 0.15 : 1;
          const size  = 1.5 + (1 - prog) * 0.8;

          ctx.globalAlpha = (active ? 0.65 : 0.2) * alpha;
          ctx.fillStyle = accent;
          ctx.beginPath(); ctx.arc(curX, curY, size, 0, Math.PI * 2); ctx.fill();

          // trail
          ctx.globalAlpha = (active ? 0.12 : 0.04) * alpha;
          const trailLen = 8;
          const prevProg = Math.max(0, prog - 0.06);
          const prevEase = prevProg < 0.5 ? 2 * prevProg * prevProg : 1 - Math.pow(-2 * prevProg + 2, 2) / 2;
          const prevX = s.startX + (cx - s.startX) * prevEase;
          const prevY = s.startY + (cy - s.startY) * prevEase;
          ctx.strokeStyle = accent;
          ctx.lineWidth = size * 0.7;
          ctx.beginPath(); ctx.moveTo(prevX, prevY); ctx.lineTo(curX, curY); ctx.stroke();
          ctx.globalAlpha = 1;

          s.x = curX; s.y = curY;
        });

        // render burst particles
        for (let i = bursts.length - 1; i >= 0; i--) {
          const b = bursts[i];
          b.x += b.vx; b.y += b.vy;
          b.vx *= 0.94; b.vy *= 0.94;
          b.life--;
          if (b.life <= 0) { bursts.splice(i, 1); continue; }
          ctx.globalAlpha = (b.life / 60) * 0.7;
          ctx.fillStyle = accent;
          ctx.beginPath(); ctx.arc(b.x, b.y, 2, 0, Math.PI * 2); ctx.fill();
        }

        // center compression glow
        if (active) {
          const pulse = 0.5 + Math.sin(t * 3) * 0.3;
          const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22);
          grd.addColorStop(0, `rgba(0,212,255,${0.18 * pulse})`);
          grd.addColorStop(1, 'rgba(0,212,255,0)');
          ctx.globalAlpha = 1;
          ctx.fillStyle = grd;
          ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.fill();
        }

        ctx.globalAlpha = 1;
      };
      draw();
    }

    // ─────────────────────────────────────────────────
    else if (type === 'fragments') {
      // Recall — search-pulse ripple + node connection trails
      type Frag = { x: number; y: number; w: number; vx: number; vy: number; op: number };
      const frags: Frag[] = Array.from({ length: 18 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        w: 20 + Math.random() * 60,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.25,
        op: Math.random() * 0.3 + 0.05,
      }));

      // nodes
      const nodes = Array.from({ length: 8 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: 2 + Math.random() * 3, op: Math.random() * 0.5 + 0.2,
        connected: [] as number[],
      }));
      // random connections between nodes
      nodes.forEach((n, i) => {
        nodes.forEach((_, j) => {
          if (j !== i && Math.random() < 0.35) n.connected.push(j);
        });
      });

      // search pulse (ripple from center)
      type Pulse = { r: number; maxR: number; alpha: number; };
      const pulses: Pulse[] = [];
      let pulseCooldown = 0;
      const cx = W * 0.5, cy = H * 0.5;

      const draw = () => {
        raf.current = requestAnimationFrame(draw);
        t += 0.008;
        ctx.clearRect(0, 0, W, H);
        const base = active ? 1 : 0.2;

        // spawn pulses when active
        pulseCooldown--;
        if (active && pulseCooldown <= 0) {
          pulses.push({ r: 0, maxR: Math.max(W, H) * 0.55, alpha: 0.45 });
          pulseCooldown = 90;
        }

        // render pulses
        for (let i = pulses.length - 1; i >= 0; i--) {
          const pu = pulses[i];
          pu.r += 2.2;
          pu.alpha *= 0.975;
          if (pu.alpha < 0.005 || pu.r > pu.maxR) { pulses.splice(i, 1); continue; }
          ctx.globalAlpha = pu.alpha * base;
          ctx.strokeStyle = accent;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(cx, cy, pu.r, 0, Math.PI * 2); ctx.stroke();
        }

        // node connection trails (lit by pulse proximity)
        nodes.forEach((n, i) => {
          n.connected.forEach(j => {
            const nb = nodes[j];
            // check if any pulse is near this edge midpoint
            const mx2 = (n.x + nb.x) / 2, my2 = (n.y + nb.y) / 2;
            let litAlpha = 0;
            pulses.forEach(pu => {
              const d = Math.hypot(cx - mx2, cy - my2);
              const ringDist = Math.abs(d - pu.r);
              if (ringDist < 40) litAlpha = Math.max(litAlpha, (1 - ringDist / 40) * pu.alpha);
            });
            const connAlpha = (0.08 + litAlpha * 0.6) * base;
            ctx.globalAlpha = connAlpha;
            ctx.strokeStyle = accent;
            ctx.lineWidth = 0.5 + litAlpha * 1.2;
            ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(nb.x, nb.y); ctx.stroke();
          });
        });

        // fragment lines
        frags.forEach(f => {
          f.x += f.vx; f.y += f.vy;
          if (f.x < -80) f.x = W + 40; if (f.x > W + 40) f.x = -80;
          if (f.y < -40) f.y = H + 20; if (f.y > H + 20) f.y = -40;
          ctx.globalAlpha = f.op * base;
          ctx.fillStyle = accent;
          ctx.fillRect(f.x, f.y, f.w, 1);
          ctx.fillRect(f.x, f.y + 4, f.w * 0.6, 1);
          ctx.fillRect(f.x, f.y + 8, f.w * 0.4, 1);
        });

        // nodes
        nodes.forEach((n, i) => {
          const pulse2 = Math.sin(t * 1.5 + i) * 0.5 + 0.5;
          // check if lit by any pulse ring
          let litA = 0;
          pulses.forEach(pu => {
            const ringDist = Math.abs(Math.hypot(cx - n.x, cy - n.y) - pu.r);
            if (ringDist < 30) litA = Math.max(litA, (1 - ringDist / 30) * pu.alpha * 2);
          });
          ctx.globalAlpha = (n.op * (0.4 + pulse2 * 0.6) + litA) * base;
          ctx.beginPath(); ctx.arc(n.x, n.y, n.r + pulse2 * 4 + litA * 6, 0, Math.PI * 2);
          ctx.fillStyle = accent; ctx.fill();
        });

        ctx.globalAlpha = 1;
      };
      draw();
    }

    // ─────────────────────────────────────────────────
    else if (type === 'recflow') {
      // RecFlow — a floating recording studio interface
      // Default: panels drift slowly, soft glow on edges
      // Active:  frame sharpens, red dot pulses, timeline animates, system-ready state

      // Floating background panels (depth layers)
      const panels = [
        { x: W*0.05, y: H*0.08,  w: W*0.38, h: H*0.22, depth: 0.3 },  // bg left
        { x: W*0.58, y: H*0.06,  w: W*0.36, h: H*0.18, depth: 0.35 }, // bg right
        { x: W*0.62, y: H*0.62,  w: W*0.30, h: H*0.26, depth: 0.4 },  // webcam pip
      ];

      // Main recording frame (centered)
      const frameX = W * 0.12, frameY = H * 0.20;
      const frameW = W * 0.76, frameH = H * 0.56;

      // Fake screen content lines (simulates a product UI being recorded)
      const uiRows = [
        { y: 0.18, w: 0.55, label: true },
        { y: 0.32, w: 0.80, label: false },
        { y: 0.42, w: 0.65, label: false },
        { y: 0.52, w: 0.72, label: false },
        { y: 0.64, w: 0.40, label: false },
        { y: 0.75, w: 0.58, label: false },
      ];

      // Timeline tick marks
      const TICK_COUNT = 20;

      let recTime = 0; // recording timer (active only)

      const draw = () => {
        raf.current = requestAnimationFrame(draw);
        t += 0.008;
        if (active) recTime += 0.008;
        ctx.clearRect(0, 0, W, H);

        const base    = active ? 1.0 : 0.22;
        const focusT  = active ? Math.min(1, recTime * 3) : 0; // 0→1 over ~330ms of hover

        // ── Background panels (depth blur feel) ──────────
        panels.forEach((p, pi) => {
          const floatY = Math.sin(t * 0.4 + pi * 1.2) * (active ? 2 : 5);
          const floatX = Math.cos(t * 0.3 + pi * 0.8) * (active ? 1 : 3);
          const px = p.x + floatX, py = p.y + floatY;

          // Panel background
          ctx.globalAlpha = p.depth * base * 0.9;
          ctx.fillStyle = 'rgba(13,13,26,0.7)';
          ctx.fillRect(px, py, p.w, p.h);

          // Panel border
          ctx.globalAlpha = p.depth * base * (0.5 + focusT * 0.3);
          ctx.strokeStyle = pi === 2 ? `rgba(255,60,60,0.45)` : `rgba(255,255,255,0.07)`;
          ctx.lineWidth = pi === 2 ? 1 : 0.5;
          ctx.strokeRect(px, py, p.w, p.h);

          // Webcam pip label
          if (pi === 2) {
            ctx.globalAlpha = base * 0.5;
            ctx.fillStyle = '#FF3C3C';
            ctx.font = `500 ${Math.round(W*0.018)}px 'Space Mono', monospace`;
            ctx.textAlign = 'left';
            ctx.fillText('CAM', px + 6, py + 14);
            // Tiny webcam face placeholder
            ctx.globalAlpha = base * 0.12;
            ctx.fillStyle = '#FF3C3C';
            ctx.beginPath();
            ctx.arc(px + p.w/2, py + p.h/2, Math.min(p.w,p.h)*0.28, 0, Math.PI*2);
            ctx.fill();
          } else {
            // Fake panel content lines
            for (let li = 0; li < 3; li++) {
              const lw = p.w * (0.5 + li * 0.12);
              ctx.globalAlpha = p.depth * base * 0.25;
              ctx.fillStyle = '#8A8A9A';
              ctx.fillRect(px + 8, py + 10 + li * 14, lw * 0.9, 2);
            }
          }
        });

        // ── Main recording frame ──────────────────────────
        const frameBorderAlpha = base * (0.35 + focusT * 0.55);
        const frameGlowAlpha   = base * (0.04 + focusT * 0.08);

        // Outer glow
        if (frameGlowAlpha > 0.005) {
          const fg = ctx.createLinearGradient(frameX, frameY, frameX+frameW, frameY+frameH);
          fg.addColorStop(0, `rgba(255,60,60,${frameGlowAlpha})`);
          fg.addColorStop(1, `rgba(180,20,20,${frameGlowAlpha * 0.6})`);
          ctx.globalAlpha = 1;
          ctx.shadowColor  = `rgba(255,60,60,${frameGlowAlpha * 4})`;
          ctx.shadowBlur   = active ? 18 : 8;
          ctx.fillStyle    = fg;
          ctx.fillRect(frameX-2, frameY-2, frameW+4, frameH+4);
          ctx.shadowBlur = 0;
        }

        // Frame background
        ctx.globalAlpha = base * 0.85;
        ctx.fillStyle   = 'rgba(8,8,18,0.92)';
        ctx.fillRect(frameX, frameY, frameW, frameH);

        // Frame border — sharpens on hover
        ctx.globalAlpha = frameBorderAlpha;
        ctx.strokeStyle = active ? `rgba(255,60,60,0.85)` : `rgba(255,255,255,0.14)`;
        ctx.lineWidth   = active ? 1.2 : 0.8;
        ctx.strokeRect(frameX, frameY, frameW, frameH);

        // Corner brackets (cinematic recording frame)
        const bLen = 14;
        const corners = [
          [frameX,        frameY,        1,  1],
          [frameX+frameW, frameY,       -1,  1],
          [frameX,        frameY+frameH, 1, -1],
          [frameX+frameW, frameY+frameH,-1, -1],
        ];
        ctx.globalAlpha = base * (0.6 + focusT * 0.35);
        ctx.strokeStyle = active ? '#FF3C3C' : 'rgba(255,255,255,0.3)';
        ctx.lineWidth   = active ? 1.5 : 1;
        corners.forEach(([cx, cy, sx, sy]) => {
          ctx.beginPath(); ctx.moveTo(cx, cy + sy*bLen); ctx.lineTo(cx, cy); ctx.lineTo(cx + sx*bLen, cy); ctx.stroke();
        });

        // ── Fake screen content inside frame ─────────────
        const contentX = frameX + frameW*0.06;
        const contentW = frameW * 0.88;

        // Simulated topbar
        ctx.globalAlpha = base * 0.18;
        ctx.fillStyle   = 'rgba(255,255,255,0.06)';
        ctx.fillRect(frameX, frameY, frameW, frameH * 0.09);

        // Topbar dots
        [[0.025,'#FF5F57'],[0.045,'#FFBD2E'],[0.065,'#28C840']].forEach(([xr, col]) => {
          ctx.globalAlpha = base * 0.4;
          ctx.fillStyle   = col as string;
          ctx.beginPath(); ctx.arc(frameX + frameW*(xr as number), frameY + frameH*0.045, 3, 0, Math.PI*2); ctx.fill();
        });

        // URL bar hint
        ctx.globalAlpha = base * 0.1;
        ctx.fillStyle   = 'rgba(255,255,255,0.08)';
        ctx.fillRect(frameX + frameW*0.12, frameY + frameH*0.015, frameW*0.60, frameH*0.06);

        // Body content rows (fake product UI)
        uiRows.forEach((row, ri) => {
          const rowY  = frameY + frameH * (0.10 + row.y * 0.82);
          const rowXs = contentX + (row.label ? 0 : frameW*0.04);
          const rowW  = contentW * row.w * (active ? 1 : 0.92);
          const alpha = base * (row.label ? 0.28 : 0.15);

          ctx.globalAlpha = alpha;
          ctx.fillStyle   = row.label ? '#F0EFEA' : '#4A4A6A';
          ctx.fillRect(rowXs, rowY, rowW, row.label ? 3 : 1.5);

          // animated typing cursor on last row when active
          if (active && ri === uiRows.length - 1) {
            const cursorX = rowXs + rowW + Math.sin(t*4)*0;
            ctx.globalAlpha = 0.5 + Math.sin(t*6)*0.4;
            ctx.fillStyle   = '#FF3C3C';
            ctx.fillRect(cursorX + 4, rowY - 2, 1.5, 6);
          }
        });

        // Side nav hint
        ctx.globalAlpha = base * 0.08;
        ctx.fillStyle   = 'rgba(255,255,255,0.05)';
        ctx.fillRect(frameX, frameY + frameH*0.09, frameW*0.10, frameH*0.91);
        for (let ni = 0; ni < 5; ni++) {
          ctx.globalAlpha = base * (0.10 + (ni===1?0.08:0));
          ctx.fillStyle   = ni===1 ? '#FF3C3C' : '#4A4A6A';
          ctx.fillRect(frameX + frameW*0.015, frameY + frameH*(0.15 + ni*0.13), frameW*0.07, 1.5);
        }

        // ── Timeline bar ─────────────────────────────────
        const tlY  = frameY + frameH + 10;
        const tlX  = frameX;
        const tlW  = frameW;
        const tlH  = 3;

        // Track bg
        ctx.globalAlpha = base * 0.15;
        ctx.fillStyle   = 'rgba(255,255,255,0.06)';
        ctx.fillRect(tlX, tlY, tlW, tlH);

        // Progress fill — animates when active
        const progressPct = active ? ((t * 0.08) % 1) : 0.22;
        ctx.globalAlpha   = base * (0.55 + focusT * 0.3);
        const tlGrd = ctx.createLinearGradient(tlX, 0, tlX+tlW, 0);
        tlGrd.addColorStop(0, '#FF3C3C');
        tlGrd.addColorStop(1, '#CC1A1A');
        ctx.fillStyle = tlGrd;
        ctx.fillRect(tlX, tlY, tlW * progressPct, tlH);

        // Playhead
        const phX = tlX + tlW * progressPct;
        ctx.globalAlpha = base * 0.9;
        ctx.fillStyle   = '#FF3C3C';
        ctx.beginPath(); ctx.arc(phX, tlY + tlH/2, 4, 0, Math.PI*2); ctx.fill();

        // Tick marks
        for (let tk = 0; tk <= TICK_COUNT; tk++) {
          const tx = tlX + (tk / TICK_COUNT) * tlW;
          ctx.globalAlpha = base * 0.12;
          ctx.fillStyle   = '#4A4A6A';
          ctx.fillRect(tx, tlY - 3, 0.5, tk % 5 === 0 ? 5 : 3);
        }

        // Duration label
        const elapsed  = active ? Math.floor(recTime * 7.5) : 0;
        const mins     = String(Math.floor(elapsed / 60)).padStart(2,'0');
        const secs     = String(elapsed % 60).padStart(2,'0');
        ctx.globalAlpha = base * 0.5;
        ctx.fillStyle   = '#4A4A6A';
        ctx.font        = `400 ${Math.round(W*0.016)}px 'Space Mono', monospace`;
        ctx.textAlign   = 'right';
        ctx.fillText(`${mins}:${secs}`, tlX + tlW, tlY + 14);
        ctx.textAlign = 'left';

        // ── REC indicator ─────────────────────────────────
        // Default: dim dot. Active: pulses red
        const recX = frameX + frameW - 20, recY = frameY + 12;
        const recPulse = active ? 0.5 + Math.sin(t * 4) * 0.5 : 0;

        if (active && recPulse > 0.01) {
          const rg = ctx.createRadialGradient(recX, recY, 0, recX, recY, 14);
          rg.addColorStop(0, `rgba(255,60,60,${recPulse * 0.3})`);
          rg.addColorStop(1, 'rgba(255,60,60,0)');
          ctx.globalAlpha = 1;
          ctx.fillStyle   = rg;
          ctx.beginPath(); ctx.arc(recX, recY, 14, 0, Math.PI*2); ctx.fill();
        }
        ctx.globalAlpha = active ? (0.7 + recPulse * 0.3) : 0.25;
        ctx.fillStyle   = active ? '#FF3C3C' : '#4A4A6A';
        ctx.beginPath(); ctx.arc(recX, recY, 4, 0, Math.PI*2); ctx.fill();

        // REC label
        if (active) {
          ctx.globalAlpha = 0.5 + recPulse * 0.4;
          ctx.fillStyle   = '#FF3C3C';
          ctx.font        = `700 ${Math.round(W*0.016)}px 'Space Mono', monospace`;
          ctx.textAlign   = 'left';
          ctx.fillText('● REC', recX - 36, recY + 4);
        }

        ctx.globalAlpha = 1;
      };
      draw();
    }

    return () => {
      cancelAnimationFrame(raf.current);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
    };
  }, [active]);

  return (
    <canvas
      ref={ref}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: active ? 'auto' : 'none' }}
    />
  );
}

/* ─────────────────────────────────────────── */

const PROJECTS = [
  {
    id: 'mera', number: '01',
    name: 'MeraPolicyAdvisor',
    tagline: 'A deterministic financial engine.',
    description: 'Structured intelligence for navigating policy, insurance, and financial complexity. No hallucinations. No estimates. Pure, verifiable signal.',
    feel: 'Deterministic system · Financial precision',
    tags: ['FINTECH','AI','ADVISORY'], status: 'LIVE',
    accent: '#C9A84C', vizType: 'grid',
    bg: 'rgba(201,168,76,0.06)',
  },
  {
    id: 'saver', number: '02',
    name: 'Super Saver',
    tagline: 'Cuts wasted AI token spend.',
    description: 'Compression intelligence that routes, caches, and optimizes AI inference costs at scale. Less spend. Same output. Fewer wasted cycles.',
    feel: 'Compression · Efficiency · Speed',
    tags: ['AI','OPTIMIZATION','DEVTOOLS'], status: 'LIVE',
    accent: '#00D4FF', vizType: 'streams',
    bg: 'rgba(0,212,255,0.055)',
  },
  {
    id: 'recall', number: '03',
    name: 'Recall',
    tagline: 'Memory for everything you see online.',
    description: 'A second brain layer for the internet. Capture, connect, and retrieve knowledge objects the moment you need them.',
    feel: 'Memory layer · Knowledge graph',
    tags: ['MEMORY','AI','PRODUCTIVITY'], status: 'BUILDING',
    accent: '#7B4FE8', vizType: 'fragments',
    bg: 'rgba(123,79,232,0.07)',
  },
  {
    id: 'recflow', number: '04',
    name: 'RecFlow',
    tagline: 'A system for recording clean demo videos in seconds.',
    description: 'Screen + webcam recording built for fast, high-quality demos. No setup. No friction. Just record — and ship content that converts.',
    feel: 'Speed · Clarity · Zero friction',
    tags: ['RECORDING','DEVTOOLS','CREATORS'], status: 'BUILDING',
    accent: '#FF3C3C', vizType: 'recflow',
    bg: 'rgba(255,60,60,0.06)',
  },
];

// Per-project environment — each feels like a different dimension
const ENV_MAP: Record<string, {
  sectionBg: string;    // whole section tint
  vignette: string;     // edge darkening
  scanColor: string;    // sweep line color
  particleTone: string; // hint for atmosphere description
}> = {
  mera:    { sectionBg:'rgba(201,168,76,0.055)',  vignette:'rgba(201,168,76,0.035)',  scanColor:'#C9A84C', particleTone:'structured' },
  saver:   { sectionBg:'rgba(0,212,255,0.055)',   vignette:'rgba(0,212,255,0.03)',    scanColor:'#00D4FF', particleTone:'compression' },
  recall:  { sectionBg:'rgba(123,79,232,0.07)',   vignette:'rgba(123,79,232,0.04)',   scanColor:'#7B4FE8', particleTone:'drifting' },
  recflow: { sectionBg:'rgba(255,60,60,0.06)',     vignette:'rgba(255,60,60,0.03)',    scanColor:'#FF3C3C', particleTone:'recording' },
};

export default function ProjectWorlds() {
  const [hovered, setHovered]       = useState<string | null>(null);
  const [warpRect, setWarpRect]         = useState<DOMRect | null>(null);
  const [recallRect, setRecallRect]     = useState<DOMRect | null>(null);
  const [, navigate]                    = useLocation();
  const env = hovered ? ENV_MAP[hovered] : null;

  const handleRecFlowClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setWarpRect(e.currentTarget.getBoundingClientRect());
  }, []);

  const handleRecallClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setRecallRect(e.currentTarget.getBoundingClientRect());
  }, []);

  const handleSaverClick = useCallback(() => { navigate('/supersaver'); }, [navigate]);

  const handleWarpComplete   = useCallback(() => { setWarpRect(null);   navigate('/recflow'); }, [navigate]);
  const handleCollapseComplete = useCallback(() => { setRecallRect(null); navigate('/recall');  }, [navigate]);

  return (
    <>
    {/* RecFlow — hyperspace warp outward */}
    {warpRect && (
      <CinematicWarp nodeRect={warpRect} onComplete={handleWarpComplete} />
    )}
    {/* Recall — inward collapse into memory space */}
    {recallRect && (
      <RecallCollapse nodeRect={recallRect} onComplete={handleCollapseComplete} />
    )}
    <section id="work" className="depth-transition-top" style={{ position:'relative', zIndex:1, padding:'6rem 2rem 8rem' }}>

      {/* ── SECTION-WIDE ENVIRONMENT GLOW ── */}
      {/* Changes tone depending on which project is hovered — each feels like a different state */}
      <motion.div
        animate={{ opacity: env ? 1 : 0 }}
        transition={{ duration: 0.55, ease:'easeInOut' }}
        style={{
          position:'absolute', inset:0, pointerEvents:'none', zIndex:0,
          background: env
            ? `radial-gradient(ellipse 90% 55% at 50% 50%, ${env.sectionBg} 0%, transparent 72%)`
            : 'transparent',
        }}
      />
      {/* Corner vignette deepens in project's color */}
      <motion.div
        animate={{ opacity: env ? 1 : 0 }}
        transition={{ duration: 0.45 }}
        style={{
          position:'absolute', inset:0, pointerEvents:'none', zIndex:0,
          background: env
            ? `radial-gradient(ellipse 110% 110% at 50% 50%, transparent 35%, ${env.vignette} 100%)`
            : 'transparent',
        }}
      />
      {/* Scan sweep — fires on each new hover */}
      <AnimatePresence>
        {hovered && env && (
          <motion.div
            key={hovered + '-sweep'}
            initial={{ top:'-2px', opacity:0.55 }}
            animate={{ top:'105%', opacity:0 }}
            exit={{ opacity:0 }}
            transition={{ duration:0.75, ease:'easeIn' }}
            style={{
              position:'absolute', left:0, right:0, height:'1px',
              background:`linear-gradient(90deg,transparent,${env.scanColor}60,transparent)`,
              pointerEvents:'none', zIndex:3,
            }}
          />
        )}
      </AnimatePresence>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ marginBottom: '4.5rem' }}
        >
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.58rem', letterSpacing: '0.3em', color: '#00D4FF', textTransform: 'uppercase', marginBottom: '1rem' }}>
            PRODUCT MICRO-WORLDS
          </div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(2.5rem,5vw,4.5rem)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.0, margin: 0, color: '#F0EFEA' }}>
            Systems built to
            <br />
            <span style={{ fontStyle: 'italic', color: '#8A8A9A' }}>do real work.</span>
          </h2>
        </motion.div>

        {/* 2×2 grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5px' }}>
          {PROJECTS.map((p, i) => {
            const active = hovered === p.id;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.1 }}
                onMouseEnter={() => setHovered(p.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={p.id === 'recflow' ? handleRecFlowClick : p.id === 'recall' ? handleRecallClick : p.id === 'saver' ? handleSaverClick : undefined}
                style={{
                  position: 'relative', overflow: 'hidden',
                  minHeight: '340px', padding: '2.5rem',
                  background: active
                    ? `radial-gradient(ellipse at 30% 30%, ${p.bg} 0%, rgba(5,5,8,0.95) 70%)`
                    : 'rgba(7,7,15,0.8)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  cursor: (p.id === 'recflow' || p.id === 'recall' || p.id === 'saver') ? 'pointer' : 'default',
                  transition: 'background 0.5s ease',
                }}
              >
                {/* Atmosphere canvas */}
                <AtmosphereCanvas type={p.vizType} accent={p.accent} active={active} />

                {/* Top accent bar */}
                <motion.div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
                  background: p.accent,
                  scaleX: active ? 1 : 0, transformOrigin: 'left',
                  transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1)',
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                  {/* Number + status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'flex-start' }}>
                    <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.5rem', color: '#4A4A6A', letterSpacing: '0.15em' }}>{p.number}</span>
                    <span style={{
                      fontFamily: "'Space Mono',monospace", fontSize: '0.48rem', letterSpacing: '0.1em',
                      color: p.status === 'LIVE' ? '#00D4FF' : '#C9A84C',
                      border: `1px solid ${p.status === 'LIVE' ? 'rgba(0,212,255,0.22)' : 'rgba(201,168,76,0.22)'}`,
                      padding: '0.18rem 0.45rem',
                    }}>● {p.status}</span>
                  </div>

                  {/* Name */}
                  <h3 style={{
                    fontFamily: "'Playfair Display',serif",
                    fontSize: 'clamp(1.35rem,2.4vw,1.75rem)', fontWeight: 700,
                    letterSpacing: '-0.02em', lineHeight: 1.1, margin: '0 0 0.6rem 0',
                    color: active ? p.accent : '#F0EFEA',
                    transition: 'color 0.4s ease',
                  }}>{p.name}</h3>

                  {/* Tagline */}
                  <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.9rem', color: '#8A8A9A', margin: '0 0 1.2rem 0', lineHeight: 1.55 }}>{p.tagline}</p>

                  {/* Description — revealed on hover */}
                  <AnimatePresence>
                    {active && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.32 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.83rem', color: '#8A8A9A', lineHeight: 1.75, margin: '0 0 0.8rem 0' }}>{p.description}</p>
                        <div style={{
                          fontFamily: "'Space Mono',monospace", fontSize: '0.48rem', color: p.accent,
                          borderLeft: `2px solid ${p.accent}40`, paddingLeft: '0.6rem',
                          marginBottom: '1.2rem', opacity: 0.85, letterSpacing: '0.08em',
                        }}>
                          {p.feel.toUpperCase()}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Tags */}
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {p.tags.map(tag => (
                      <span key={tag} style={{
                        fontFamily: "'Space Mono',monospace", fontSize: '0.47rem',
                        color: active ? p.accent : '#4A4A6A',
                        border: `1px solid ${active ? p.accent + '30' : 'rgba(255,255,255,0.05)'}`,
                        padding: '0.18rem 0.42rem', letterSpacing: '0.1em',
                        transition: 'all 0.3s ease',
                      }}>{tag}</span>
                    ))}
                    {/* Explore hint on RecFlow */}
                    {p.id === 'recflow' && active && (
                      <span style={{
                        fontFamily: "'Space Mono',monospace", fontSize: '0.47rem',
                        color: p.accent, letterSpacing: '0.1em',
                        marginLeft: 'auto', opacity: 0.75,
                        transition: 'opacity 0.3s ease',
                      }}>
                        EXPLORE →
                      </span>
                    )}
                    {/* Activate hint on Super Saver */}
                    {p.id === 'saver' && active && (
                      <span style={{
                        fontFamily: "'Space Mono',monospace", fontSize: '0.47rem',
                        color: p.accent, letterSpacing: '0.1em',
                        marginLeft: 'auto', opacity: 0.8,
                        transition: 'opacity 0.3s ease',
                        textShadow: `0 0 10px ${p.accent}66`,
                      }}>
                        ACTIVATE →
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
    </>
  );
}
