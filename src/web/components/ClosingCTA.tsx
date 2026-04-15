import { useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';

export default function ClosingCTA() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const isInView   = useInView(sectionRef, { once: true, amount: 0.25 });

  /* Calm version of the universe — slow drifting stars that converge */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let W = canvas.offsetWidth, H = canvas.offsetHeight;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d', { alpha: true })!;
    ctx.clearRect(0, 0, W, H);

    type Star = { x:number; y:number; vx:number; vy:number; r:number; op:number; color:string };
    const COLORS = ['#F0EFEA','#00D4FF','#7B4FE8'];
    const stars: Star[] = Array.from({ length: 220 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15,
      r: Math.random() * 1.4 + 0.3,
      op: Math.random() * 0.35 + 0.05,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    // Neural lines between close stars
    let t = 0;
    let raf: number;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      t += 0.003;
      ctx.clearRect(0, 0, W, H);

      // connections
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const dx = stars[i].x - stars[j].x, dy = stars[i].y - stars[j].y;
          const d = Math.sqrt(dx*dx + dy*dy);
          if (d < 90) {
            ctx.beginPath();
            ctx.moveTo(stars[i].x, stars[i].y);
            ctx.lineTo(stars[j].x, stars[j].y);
            ctx.strokeStyle = `rgba(0,212,255,${(1 - d/90) * 0.05})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // stars
      stars.forEach(s => {
        s.x += s.vx + Math.sin(t + s.x * 0.01) * 0.05;
        s.y += s.vy + Math.cos(t + s.y * 0.01) * 0.05;
        if (s.x < 0) s.x = W; if (s.x > W) s.x = 0;
        if (s.y < 0) s.y = H; if (s.y > H) s.y = 0;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
        const c = s.color;
        if (c === '#F0EFEA') ctx.fillStyle = `rgba(240,239,234,${s.op})`;
        else if (c === '#00D4FF') ctx.fillStyle = `rgba(0,212,255,${s.op * 0.8})`;
        else ctx.fillStyle = `rgba(123,79,232,${s.op * 0.7})`;
        ctx.fill();
      });
    };
    draw();

    const onResize = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight;
      canvas.width = W; canvas.height = H;
      ctx.clearRect(0, 0, W, H);
    };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="contact"
      style={{
        position: 'relative', zIndex: 1,
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        background: 'transparent',
      }}
    >
      {/* Canvas universe */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }} />

      {/* Deep glow */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(123,79,232,0.07) 0%, rgba(0,212,255,0.04) 40%, transparent 68%)',
      }} />

      {/* Subtle grid */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 0%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 0%, transparent 75%)',
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: '780px', padding: '0 2rem' }}>

        {/* Label */}
        <motion.div
          initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ duration: 0.7 }}
          style={{
            fontFamily: "'Space Mono',monospace", fontSize: '0.55rem', letterSpacing: '0.35em',
            color: '#2A2A3A', textTransform: 'uppercase', marginBottom: '3rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
          }}
        >
          <span style={{ width: '32px', height: '1px', background: '#2A2A3A', display: 'inline-block' }} />
          FINAL TRANSMISSION
          <span style={{ width: '32px', height: '1px', background: '#2A2A3A', display: 'inline-block' }} />
        </motion.div>

        {/* Main headline — staged reveal */}
        <div style={{ marginBottom: '2.5rem', overflow: 'hidden' }}>
          <motion.div
            initial={{ y: 80, opacity: 0, filter: 'blur(10px)' }}
            animate={isInView ? { y: 0, opacity: 1, filter: 'blur(0px)' } : {}}
            transition={{ duration: 1.1, delay: 0.15, ease: [0.16,1,0.3,1] }}
          >
            <h2 style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 'clamp(3.2rem,8.5vw,7rem)', fontWeight: 700,
              letterSpacing: '-0.04em', lineHeight: 0.9, color: '#F0EFEA', margin: 0,
            }}>
              Building something
            </h2>
          </motion.div>
          <motion.div
            initial={{ y: 80, opacity: 0, filter: 'blur(10px)' }}
            animate={isInView ? { y: 0, opacity: 1, filter: 'blur(0px)' } : {}}
            transition={{ duration: 1.1, delay: 0.35, ease: [0.16,1,0.3,1] }}
          >
            <h2 style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 'clamp(3.2rem,8.5vw,7rem)', fontWeight: 700, fontStyle: 'italic',
              letterSpacing: '-0.04em', lineHeight: 0.9, margin: 0,
              background: 'linear-gradient(130deg, #00D4FF 0%, #7B4FE8 55%, #C9A84C 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              real?
            </h2>
          </motion.div>
        </div>

        {/* Pause — secondary line */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, delay: 0.65 }}
          style={{
            fontFamily: "'DM Sans',sans-serif", fontSize: 'clamp(1rem,1.6vw,1.2rem)',
            color: '#8A8A9A', lineHeight: 1.7, marginBottom: '3.5rem',
          }}
        >
          Let's make it impossible to ignore.
          <br />
          <motion.span
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 1.1 }}
            style={{ color: 'rgba(240,239,234,0.45)', fontSize: '0.9em' }}
          >
            If you're building signal — let's talk.
          </motion.span>
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.85 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '3rem' }}
        >
          <motion.a
            href="mailto:siddhantsrivastava7@gmail.com"
            whileHover={{ scale: 1.04, boxShadow: '0 0 40px rgba(0,212,255,0.2)' }}
            whileTap={{ scale: 0.97 }}
            style={{
              textDecoration: 'none', padding: '1rem 2.5rem',
              fontFamily: "'Space Mono',monospace", fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase',
              border: '1px solid rgba(0,212,255,0.45)', color: '#00D4FF',
              background: 'rgba(0,212,255,0.07)', transition: 'all 0.35s ease',
            }}
          >
            Send a message →
          </motion.a>
          <motion.a
            href="https://x.com/EncrypticTV"
            target="_blank" rel="noopener noreferrer"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            style={{
              textDecoration: 'none', padding: '1rem 2.5rem',
              fontFamily: "'Space Mono',monospace", fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase',
              border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(240,239,234,0.55)',
              background: 'transparent', transition: 'all 0.35s ease',
            }}
          >
            Follow on X
          </motion.a>
        </motion.div>

        {/* Email */}
        <motion.a
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 1.2 }}
          href="mailto:siddhantsrivastava7@gmail.com"
          style={{
            fontFamily: "'Space Mono',monospace", fontSize: '0.65rem',
            color: '#2A2A3A', letterSpacing: '0.12em', textDecoration: 'none',
            transition: 'color 0.3s ease', display: 'block',
          }}
          onMouseEnter={e => ((e.target as HTMLElement).style.color = '#00D4FF')}
          onMouseLeave={e => ((e.target as HTMLElement).style.color = '#2A2A3A')}
        >
          siddhantsrivastava7@gmail.com
        </motion.a>

        {/* Corner brackets — cinematic frame */}
        {[
          { top: '-3rem', left: '-3rem', border: 'top left' },
          { top: '-3rem', right: '-3rem', border: 'top right' },
          { bottom: '-3rem', left: '-3rem', border: 'bottom left' },
          { bottom: '-3rem', right: '-3rem', border: 'bottom right' },
        ].map((pos, i) => {
          const style: React.CSSProperties = {
            position: 'absolute', width: '24px', height: '24px',
            ...((pos as any).top !== undefined ? { top: (pos as any).top } : {}),
            ...((pos as any).bottom !== undefined ? { bottom: (pos as any).bottom } : {}),
            ...((pos as any).left !== undefined ? { left: (pos as any).left } : {}),
            ...((pos as any).right !== undefined ? { right: (pos as any).right } : {}),
            borderTop: pos.border.includes('top') ? '1px solid rgba(0,212,255,0.25)' : 'none',
            borderBottom: pos.border.includes('bottom') ? '1px solid rgba(0,212,255,0.25)' : 'none',
            borderLeft: pos.border.includes('left') ? '1px solid rgba(0,212,255,0.25)' : 'none',
            borderRight: pos.border.includes('right') ? '1px solid rgba(0,212,255,0.25)' : 'none',
          };
          return (
            <motion.div key={i} style={style}
              initial={{ opacity: 0, scale: 1.3 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.9 + i * 0.08 }}
            />
          );
        })}
      </div>
    </section>
  );
}
