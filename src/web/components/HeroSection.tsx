import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const mouse      = useRef({ x: -999, y: -999, vx: 0, vy: 0 });
  const prevMouse  = useRef({ x: -999, y: -999 });
  const [phase, setPhase] = useState<'pre' | 'gathering' | 'formed'>('pre');

  /* ── canvas ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let W = canvas.offsetWidth || window.innerWidth;
    let H = canvas.offsetHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d', { alpha: true })!;
    ctx.scale(dpr, dpr);
    // Immediately clear to transparent — prevents macOS/GPU cyan backing buffer flash
    ctx.clearRect(0, 0, W, H);

    /* ─ fonts + text bitmap ─ */
    const buildParticles = async () => {
      try { await document.fonts.load(`700 80px 'Playfair Display'`); } catch {}

      const off = document.createElement('canvas');
      // Must match CSS pixel space exactly — no DPR here since we map
      // sampled pixel coords (x,y) back to CSS space directly
      off.width = W; off.height = H;
      const oc = off.getContext('2d', { willReadFrequently: true })!;
      oc.clearRect(0, 0, W, H);
      const fs = Math.min(W / 8.5, 96);
      oc.fillStyle = '#ffffff';
      oc.font = `700 ${fs}px 'Playfair Display', Georgia, serif`;
      oc.textAlign = 'center';
      oc.textBaseline = 'middle';
      const LINE1 = 'I build systems';
      const LINE2 = 'people remember.';
      const lh = fs * 1.08;
      oc.fillText(LINE1, W / 2, H / 2 - lh * 0.52);
      oc.fillText(LINE2, W / 2, H / 2 + lh * 0.52);

      const px = oc.getImageData(0, 0, W, H).data;
      // Destroy offscreen canvas immediately — macOS GPU compositor can
      // promote detached canvases to a visible layer (cyan artifact)
      off.width = 0; off.height = 0;

      const hits: { x: number; y: number }[] = [];
      const STEP = 3;
      for (let y = 0; y < H; y += STEP)
        for (let x = 0; x < W; x += STEP)
          if (px[(y * W + x) * 4 + 3] > 100) hits.push({ x, y });

      const TARGET = Math.min(hits.length, 3200);
      const sampled = hits.sort(() => Math.random() - 0.5).slice(0, TARGET);

      const COLS = ['#F0EFEA','#00D4FF','#7B4FE8','#C9A84C','#F0EFEA','#F0EFEA'];

      type P = {
        x: number; y: number;           // current
        tx: number; ty: number;          // text target
        ox: number; oy: number;          // orbit origin (scattered start)
        vx: number; vy: number;          // velocity
        phase: number;                   // individual time offset
        sz: number;                      // base size
        col: string;
        trail: { x: number; y: number }[];
      };

      const particles: P[] = sampled.map(t => ({
        x: Math.random() * W,
        y: Math.random() * H,
        tx: t.x, ty: t.y,
        ox: Math.random() * W, oy: Math.random() * H,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        phase: Math.random() * Math.PI * 2,
        sz: Math.random() * 1.6 + 0.5,
        col: COLS[Math.floor(Math.random() * COLS.length)],
        trail: [],
      }));

      /* ambient stars that never form text */
      type Star = { x:number;y:number;vx:number;vy:number;r:number;op:number };
      const STAR_N = 800;
      const stars: Star[] = Array.from({ length: STAR_N }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random()-0.5)*0.18, vy: (Math.random()-0.5)*0.18,
        r: Math.random() * 1.1 + 0.2,
        op: Math.random() * 0.28 + 0.04,
      }));

      let t = 0;
      let gatherT = 0;        // 0→1 gathering progress
      let gatherStarted = false;
      let formed = false;
      let raf: number;

      const gatherTimer = setTimeout(() => {
        gatherStarted = true;
        setPhase('gathering');
      }, 500);

      /* easing */
      const easeInOutCubic = (x: number) =>
        x < 0.5 ? 4*x*x*x : 1 - Math.pow(-2*x+2,3)/2;

      const draw = () => {
        raf = requestAnimationFrame(draw);
        t += 0.007;

        /* mouse velocity */
        const mx = mouse.current.x, my = mouse.current.y;
        mouse.current.vx = mx - prevMouse.current.x;
        mouse.current.vy = my - prevMouse.current.y;
        prevMouse.current = { x: mx, y: my };

        ctx.clearRect(0, 0, W, H);

        /* cursor light field */
        if (mx > 0) {
          const r1 = ctx.createRadialGradient(mx, my, 0, mx, my, 320);
          r1.addColorStop(0, 'rgba(0,212,255,0.055)');
          r1.addColorStop(0.4, 'rgba(123,79,232,0.02)');
          r1.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = r1;
          ctx.fillRect(0, 0, W, H);

          /* second tighter glow */
          const r2 = ctx.createRadialGradient(mx, my, 0, mx, my, 100);
          r2.addColorStop(0, 'rgba(0,212,255,0.08)');
          r2.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = r2;
          ctx.fillRect(0, 0, W, H);
        }

        /* ambient stars */
        stars.forEach(s => {
          s.x = (s.x + s.vx + W) % W;
          s.y = (s.y + s.vy + H) % H;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
          ctx.fillStyle = `rgba(240,239,234,${s.op})`;
          ctx.fill();
        });

        /* gather progress */
        if (gatherStarted && gatherT < 1) {
          gatherT = Math.min(1, gatherT + 0.009);
          if (gatherT >= 1 && !formed) {
            formed = true;
            setPhase('formed');
          }
        }
        const eg = easeInOutCubic(gatherT);

        /* particles */
        particles.forEach(p => {
          /* save trail point */
          p.trail.push({ x: p.x, y: p.y });
          if (p.trail.length > 6) p.trail.shift();

          const spd = Math.sqrt(p.vx*p.vx + p.vy*p.vy);

          /* draw velocity trail */
          if (spd > 1.2 && p.trail.length > 2) {
            ctx.beginPath();
            ctx.moveTo(p.trail[0].x, p.trail[0].y);
            for (let i = 1; i < p.trail.length; i++)
              ctx.lineTo(p.trail[i].x, p.trail[i].y);
            const alpha = Math.min(spd / 8, 0.35) * eg;
            ctx.strokeStyle = p.col === '#F0EFEA'
              ? `rgba(240,239,234,${alpha})`
              : p.col === '#00D4FF' ? `rgba(0,212,255,${alpha})`
              : p.col === '#7B4FE8' ? `rgba(123,79,232,${alpha})`
              : `rgba(201,168,76,${alpha})`;
            ctx.lineWidth = p.sz * 0.6;
            ctx.stroke();
          }

          if (gatherStarted) {
            /* breathing micro-motion when formed */
            const breathe = formed
              ? Math.sin(t * 1.2 + p.phase) * 1.4
              : Math.sin(t * 0.8 + p.phase) * (1 - eg) * 12;

            const destX = p.tx + breathe;
            const destY = p.ty + Math.cos(t + p.phase) * (formed ? 1.0 : (1-eg)*8);

            /* spring force */
            const fx = (destX - p.x) * (0.05 + eg * 0.07);
            const fy = (destY - p.y) * (0.05 + eg * 0.07);
            p.vx = p.vx * 0.78 + fx;
            p.vy = p.vy * 0.78 + fy;
          } else {
            /* free drift */
            p.vx += Math.sin(t * 0.5 + p.phase) * 0.04;
            p.vy += Math.cos(t * 0.4 + p.phase) * 0.04;
            p.vx *= 0.96; p.vy *= 0.96;
          }

          /* cursor interaction — push + magnetic on gather */
          if (mx > 0) {
            const dx = p.x - mx, dy = p.y - my;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const radius = formed ? 90 : 70;
            if (dist < radius && dist > 0.1) {
              const force = (radius - dist) / radius;
              /* push away */
              p.vx += (dx/dist) * force * (formed ? 2.8 : 1.6);
              p.vy += (dy/dist) * force * (formed ? 2.8 : 1.6);
              /* add cursor velocity drag */
              p.vx += mouse.current.vx * force * 0.3;
              p.vy += mouse.current.vy * force * 0.3;
            }
          }

          p.x += p.vx;
          p.y += p.vy;

          /* draw dot */
          const alpha = gatherStarted ? (0.35 + eg * 0.55) : 0.3;
          const sz = p.sz * (formed ? 1.0 : 0.8 + eg * 0.5);
          ctx.beginPath();
          ctx.arc(p.x, p.y, sz, 0, Math.PI*2);
          if (p.col === '#F0EFEA')      ctx.fillStyle = `rgba(240,239,234,${alpha})`;
          else if (p.col === '#00D4FF') ctx.fillStyle = `rgba(0,212,255,${alpha * 0.85})`;
          else if (p.col === '#7B4FE8') ctx.fillStyle = `rgba(123,79,232,${alpha * 0.75})`;
          else                          ctx.fillStyle = `rgba(201,168,76,${alpha * 0.75})`;
          ctx.fill();
        });
      };

      draw();
      return () => { cancelAnimationFrame(raf); clearTimeout(gatherTimer); };
    };

    let cleanup: (() => void) | undefined;
    buildParticles().then(fn => { cleanup = fn; });

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.current.x = (e.clientX - r.left);
      mouse.current.y = (e.clientY - r.top);
    };
    const onLeave = () => { mouse.current.x = -999; mouse.current.y = -999; };
    const onResize = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight;
      canvas.width  = W * dpr; canvas.height = H * dpr;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, W, H);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);
    window.addEventListener('resize', onResize);

    return () => {
      cleanup?.();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  /* scroll fade */
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to('.hero-out', {
        opacity: 0, y: -50, scale: 0.97,
        ease: 'power2.in',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top', end: '35% top', scrub: 1.2,
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const floatNodes = [
    { label: 'MeraPolicyAdvisor', x: '7%',  y: '19%', color: '#C9A84C' },
    { label: 'Super Saver',       x: '82%', y: '15%', color: '#00D4FF' },
    { label: 'Recall',            x: '5%',  y: '77%', color: '#7B4FE8' },
    { label: 'RecFlow',           x: '80%', y: '79%', color: '#FF3C3C' },
  ];

  return (
    <section
      ref={sectionRef}
      style={{ position:'relative', zIndex:1, height:'100vh', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}
    >
      {/* particle canvas — full hero */}
      <canvas ref={canvasRef}
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', zIndex:1, pointerEvents:'none' }}
      />

      {/* atmosphere */}
      <div style={{
        position:'absolute', inset:0, zIndex:0, pointerEvents:'none',
        background:'radial-gradient(ellipse 85% 60% at 50% 45%, rgba(123,79,232,0.1) 0%, rgba(0,212,255,0.04) 45%, transparent 72%)',
      }} />

      {/* slow rotating orbit rings — plain divs, CSS keyframes (Safari-safe, no compositor layer) */}
      {([260,320,395] as const).map((r,i) => (
        <div key={i} style={{
          position:'absolute', top:'50%', left:'50%',
          width:`${r*2}px`, height:`${r*2}px`,
          marginLeft:`-${r}px`, marginTop:`-${r}px`,
          borderRadius:'50%',
          border:`1px solid rgba(0,212,255,${0.028 - i*0.007})`,
          zIndex:0,
          animation:`${i%2===0?'orbit-cw':'orbit-ccw'} ${90+i*28}s linear infinite`,
          willChange:'auto',
        }} />
      ))}

      {/* floating project nodes — CSS animations (Safari-safe) */}
      {floatNodes.map((n,i) => (
        <motion.div key={i}
          initial={{ opacity:0, scale:0.7 }}
          animate={{ opacity:1, scale:1 }}
          transition={{ delay:2.4+i*0.18, duration:0.9, ease:[0.16,1,0.3,1] }}
          style={{ position:'absolute', left:n.x, top:n.y, zIndex:2 }}
        >
          {/* float bob: CSS keyframe, no Framer loop */}
          <div style={{ animation:`floatBob${i} ${5+i*1.4}s ease-in-out infinite`, willChange:'auto' }}>
            <div style={{
              display:'flex', alignItems:'center', gap:'0.42rem',
              padding:'0.3rem 0.65rem',
              background:'rgba(8,7,18,0.92)', border:`1px solid ${n.color}28`,
            }}>
              {/* pulse dot: CSS keyframe, --dc custom prop carries color */}
              <div style={{
                width:'4px', height:'4px', borderRadius:'50%', background:n.color, flexShrink:0,
                ['--dc' as string]: n.color,
                animation:`pulseDot${i} ${1.9+i*0.35}s ease-in-out infinite`,
                willChange:'auto',
              }} />
              <span style={{ fontFamily:"'Space Mono',monospace", fontSize:'0.5rem', color:n.color, letterSpacing:'0.06em', whiteSpace:'nowrap' }}>{n.label}</span>
            </div>
          </div>
        </motion.div>
      ))}

      {/* overlay: OS label + CTAs */}
      <div className="hero-out" style={{ position:'absolute', zIndex:3, width:'100%', display:'flex', flexDirection:'column', alignItems:'center', pointerEvents:'none' }}>
        <motion.div
          initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.6, duration:0.9 }}
          style={{
            fontFamily:"'Space Mono',monospace", fontSize:'0.57rem', letterSpacing:'0.3em',
            color:'#4A4A6A', textTransform:'uppercase',
            display:'flex', alignItems:'center', gap:'0.7rem',
            position:'absolute', top:'9%',
          }}
        >
          <span style={{ width:'22px', height:'1px', background:'#4A4A6A', display:'inline-block' }} />
          SIDDHANT SRIVASTAVA · FOUNDER
          <span style={{ width:'22px', height:'1px', background:'#4A4A6A', display:'inline-block' }} />
        </motion.div>

        <div style={{ height:'56vh' }} />

        <AnimatePresence>
          {phase === 'formed' && (
            <motion.div
              initial={{ opacity:0, y:20, filter:'blur(6px)' }}
              animate={{ opacity:1, y:0, filter:'blur(0px)' }}
              transition={{ duration:0.9, ease:[0.16,1,0.3,1] }}
              style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'1.6rem', pointerEvents:'all' }}
            >
              <p style={{
                fontFamily:"'DM Sans',sans-serif", fontSize:'clamp(0.82rem,1.25vw,0.98rem)',
                color:'#8A8A9A', lineHeight:1.78, textAlign:'center', maxWidth:'420px', margin:0,
              }}>
                AI is flooding the internet with sameness.
                <br /><span style={{ color:'rgba(240,239,234,0.58)' }}>I build deterministic systems that actually work.</span>
              </p>

              <div style={{ display:'flex', gap:'0.9rem', flexWrap:'wrap', justifyContent:'center' }}>
                {[
                  { label:'Enter System →', href:'#work', primary:true },
                  { label:'Explore Projects', href:'#work', primary:false },
                ].map(btn => (
                  <motion.a key={btn.label} href={btn.href}
                    whileHover={{ scale:1.04, boxShadow: btn.primary ? '0 0 36px rgba(0,212,255,0.2)' : 'none' }}
                    whileTap={{ scale:0.97 }}
                    style={{
                      textDecoration:'none', padding:'0.85rem 2.1rem',
                      fontFamily:"'Space Mono',monospace", fontSize:'0.67rem',
                      letterSpacing:'0.12em', textTransform:'uppercase',
                      border: btn.primary ? '1px solid rgba(0,212,255,0.4)' : '1px solid rgba(255,255,255,0.1)',
                      color: btn.primary ? '#00D4FF' : 'rgba(240,239,234,0.5)',
                      background: btn.primary ? 'rgba(0,212,255,0.07)' : 'transparent',
                      transition:'all 0.35s ease',
                    }}
                  >{btn.label}</motion.a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* scroll cue */}
      <motion.div
        animate={{ y:[0,10,0], opacity: phase==='formed' ? 1 : 0 }}
        initial={{ opacity:0 }}
        transition={{ y:{ duration:2.2, repeat:Infinity }, opacity:{ duration:0.8 } }}
        style={{
          position:'absolute', bottom:'2.5rem', left:'50%', transform:'translateX(-50%)',
          display:'flex', flexDirection:'column', alignItems:'center', gap:'0.4rem', zIndex:4,
        }}
      >
        <span style={{ fontFamily:"'Space Mono',monospace", fontSize:'0.47rem', color:'#4A4A6A', letterSpacing:'0.25em' }}>SCROLL</span>
        <div style={{ width:'1px', height:'40px', background:'linear-gradient(to bottom, rgba(0,212,255,0.4), transparent)' }} />
      </motion.div>
    </section>
  );
}
