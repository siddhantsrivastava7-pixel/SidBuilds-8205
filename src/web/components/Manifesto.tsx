import { useRef, useState, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';

const LAWS = [
  { n: 'I',   title: 'Deterministic > hype.',        noise: 'Chase every trend.', signal: 'Build systems that hold up under pressure.' },
  { n: 'II',  title: 'Systems > surface features.',  noise: 'Ship checkboxes.', signal: 'Build machines with compounding parts.' },
  { n: 'III', title: 'Execution > endless ideas.',   noise: 'Collect concepts forever.', signal: 'Shipped is the only thing that counts.' },
  { n: 'IV',  title: 'Products create leverage.',    noise: 'Add features.', signal: 'Multiply your users\' output.' },
  { n: 'V',   title: 'Taste = trust.',               noise: 'Skip aesthetics.', signal: 'The interface earns belief before a word is read.' },
];

/* Writing animation for a single law */
function WrittenLaw({ law, active, index }: { law: typeof LAWS[0]; active: boolean; index: number }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => { if (inView) setTimeout(() => setVisible(true), index * 120); }, [inView]);

  return (
    <div ref={ref} style={{
      display: 'grid', gridTemplateColumns: '1fr 1px 1fr',
      gap: '0',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.5s ease',
    }}>
      {/* LEFT — noise */}
      <div
        onClick={() => {}}
        style={{
          padding: '1.4rem 1.8rem',
          background: active ? 'rgba(74,74,106,0.06)' : 'transparent',
          transition: 'background 0.4s ease',
          position: 'relative',
        }}
      >
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.45rem', color: '#2A2A3A', letterSpacing: '0.18em', marginBottom: '0.4rem' }}>
          LAW {law.n} · GENERIC
        </div>
        <div style={{
          fontFamily: "'DM Sans',sans-serif", fontSize: '0.88rem',
          color: active ? '#4A4A6A' : '#2A2A3A',
          lineHeight: 1.5,
          textDecoration: active ? 'line-through' : 'none',
          textDecorationColor: 'rgba(74,74,106,0.4)',
          transition: 'all 0.4s ease',
        }}>
          {law.noise}
        </div>
        {/* Cross-out strike animation */}
        <AnimatePresence>
          {active && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              exit={{ scaleX: 0 }}
              transition={{ duration: 0.4, ease: [0.16,1,0.3,1] }}
              style={{
                position: 'absolute', left: '1.8rem', right: '1.8rem',
                top: '50%', height: '1px',
                background: 'rgba(74,74,106,0.35)',
                transformOrigin: 'left',
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Divider */}
      <div style={{ background: 'rgba(255,255,255,0.04)' }} />

      {/* RIGHT — signal */}
      <div style={{
        padding: '1.4rem 1.8rem',
        background: active ? 'rgba(0,212,255,0.03)' : 'transparent',
        borderLeft: active ? '2px solid #00D4FF' : '2px solid transparent',
        transition: 'all 0.4s ease',
      }}>
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.45rem', letterSpacing: '0.18em', color: active ? '#00D4FF' : '#2A2A3A', marginBottom: '0.4rem', transition: 'color 0.4s ease' }}>
          LAW {law.n} · SID SYSTEM
        </div>
        <h3 style={{
          fontFamily: "'Playfair Display',serif",
          fontSize: 'clamp(0.95rem,1.4vw,1.15rem)', fontWeight: 700,
          color: active ? '#F0EFEA' : '#4A4A6A',
          letterSpacing: '-0.02em', margin: '0 0 0.3rem 0', lineHeight: 1.25,
          transition: 'color 0.4s ease',
        }}>
          {/* Typewriter effect when active */}
          {active ? (
            <TypewriterText text={law.title} />
          ) : law.title}
        </h3>
        <p style={{
          fontFamily: "'DM Sans',sans-serif", fontSize: '0.82rem',
          color: active ? '#8A8A9A' : '#2A2A3A',
          lineHeight: 1.65, margin: 0, transition: 'color 0.4s ease',
        }}>{law.signal}</p>
      </div>
    </div>
  );
}

function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 28);
    return () => clearInterval(interval);
  }, [text]);
  return <>{displayed}<span style={{ animation: 'blink 0.8s step-end infinite', borderRight: '2px solid #00D4FF' }}>{' '}</span></>;
}

export default function Manifesto() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });
  const [activeLaw, setActiveLaw] = useState(0);

  // Auto-cycle laws
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLaw(i => (i + 1) % LAWS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section ref={sectionRef} id="manifesto" className="depth-transition-top" style={{ position: 'relative', zIndex: 1, padding: '8rem 0', overflow: 'hidden' }}>
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>

      {/* Ambient */}
      <div style={{
        position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)',
        width: '700px', height: '400px',
        background: 'radial-gradient(ellipse, rgba(0,212,255,0.04) 0%, rgba(123,79,232,0.03) 40%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 2rem' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.9 }}
          style={{ marginBottom: '4rem' }}>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.58rem', letterSpacing: '0.3em', color: '#00D4FF', textTransform: 'uppercase', marginBottom: '1.2rem' }}>
            BUILDER PHILOSOPHY
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'end' }}>
            <h2 style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 'clamp(2.8rem,5.5vw,5rem)', fontWeight: 700,
              letterSpacing: '-0.035em', lineHeight: 0.95, margin: 0, color: '#F0EFEA',
            }}>
              I don't build
              <br />
              <span style={{ fontStyle: 'italic', color: '#C9A84C' }}>clones.</span>
              <br />
              I build
              <br />
              <span style={{ fontStyle: 'italic' }}>leverage.</span>
            </h2>
            <div>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.9rem', color: '#8A8A9A', lineHeight: 1.75, marginBottom: '1.5rem' }}>
                Most people ship features.
                <br />I build systems.
                <br />These are the laws that run the OS.
              </p>
              {/* Law dots */}
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {LAWS.map((_, i) => (
                  <div key={i} onClick={() => setActiveLaw(i)} style={{
                    width: i === activeLaw ? '28px' : '4px', height: '2px',
                    background: i === activeLaw ? '#00D4FF' : 'rgba(255,255,255,0.1)',
                    transition: 'all 0.4s ease', cursor: 'pointer', borderRadius: '1px',
                  }} />
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', marginBottom: '0' }}>
          <div style={{ padding: '0.6rem 1.8rem', borderBottom: '1px solid rgba(255,255,255,0.04)', borderRight: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.5rem', color: '#4A4A6A', letterSpacing: '0.25em', textTransform: 'uppercase' }}>
              ✕ NOISE
            </span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)' }} />
          <div style={{ padding: '0.6rem 1.8rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.5rem', color: '#00D4FF', letterSpacing: '0.25em', textTransform: 'uppercase' }}>
              ● SIGNAL
            </span>
          </div>
        </div>

        {/* Laws split table */}
        <div style={{ border: '1px solid rgba(255,255,255,0.04)', borderTop: 'none' }}>
          {LAWS.map((law, i) => (
            <div
              key={i}
              onClick={() => setActiveLaw(i)}
              style={{
                borderBottom: i < LAWS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                cursor: 'pointer',
              }}
            >
              <WrittenLaw law={law} active={activeLaw === i} index={i} />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
