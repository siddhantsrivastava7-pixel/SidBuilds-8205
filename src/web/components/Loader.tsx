import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoaderProps {
  onComplete: () => void;
}

const BOOT_LINES = [
  'initializing system...',
  'loading modules...',
  'calibrating signal...',
  'sidbuilds.exe',
];

export default function Loader({ onComplete }: LoaderProps) {
  const [phase, setPhase] = useState<'boot' | 'reveal1' | 'reveal2' | 'fadeout'>('boot');
  const [lines, setLines] = useState<string[]>([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let lineIdx = 0;
    // Phase 0 — boot lines appear one by one
    const lineTimer = setInterval(() => {
      if (lineIdx < BOOT_LINES.length) {
        setLines(prev => [...prev, BOOT_LINES[lineIdx]]);
        lineIdx++;
      } else {
        clearInterval(lineTimer);
      }
    }, 320);

    // Phase 1 — "Not a portfolio."
    const t1 = setTimeout(() => setPhase('reveal1'), 1600);
    // Phase 2 — "A system."
    const t2 = setTimeout(() => setPhase('reveal2'), 2600);
    // Phase 3 — fade out
    const t3 = setTimeout(() => setPhase('fadeout'), 3600);
    const t4 = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 500);
    }, 4100);

    return () => {
      clearInterval(lineTimer);
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: '#050508',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Grain overlay */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`,
            opacity: 0.5,
          }} />

          {/* Pulse ring */}
          <motion.div
            animate={{ scale: [1, 1.6, 1], opacity: [0.06, 0, 0.06] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              width: '500px', height: '500px',
              borderRadius: '50%',
              border: '1px solid rgba(0,212,255,0.15)',
            }}
          />
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.04, 0, 0.04] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            style={{
              position: 'absolute',
              width: '300px', height: '300px',
              borderRadius: '50%',
              border: '1px solid rgba(123,79,232,0.12)',
            }}
          />

          <div style={{ width: '420px', padding: '0 2rem', position: 'relative', zIndex: 1 }}>
            {/* Boot lines */}
            <AnimatePresence mode="wait">
              {phase === 'boot' && (
                <motion.div
                  key="boot"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ marginBottom: '3rem' }}
                >
                  {lines.map((line, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: '0.65rem',
                        color: i === lines.length - 1 ? '#00D4FF' : 'rgba(74,74,106,0.8)',
                        marginBottom: '0.35rem',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {'> '}{line}
                    </motion.div>
                  ))}
                  {/* Blinking cursor */}
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: '0.65rem',
                      color: '#00D4FF',
                    }}
                  >_</motion.span>
                </motion.div>
              )}

              {/* "Not a portfolio." */}
              {phase === 'reveal1' && (
                <motion.div
                  key="r1"
                  initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  style={{ textAlign: 'center' }}
                >
                  <div style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 'clamp(2.8rem, 6vw, 4.5rem)',
                    fontWeight: 700,
                    color: '#F0EFEA',
                    letterSpacing: '-0.03em',
                    lineHeight: 1.0,
                  }}>
                    Not a portfolio.
                  </div>
                </motion.div>
              )}

              {/* "A system." */}
              {phase === 'reveal2' && (
                <motion.div
                  key="r2"
                  initial={{ opacity: 0, scale: 0.92, filter: 'blur(12px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 1.06 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  style={{ textAlign: 'center' }}
                >
                  <div style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 'clamp(2.8rem, 6vw, 4.5rem)',
                    fontWeight: 700,
                    fontStyle: 'italic',
                    letterSpacing: '-0.03em',
                    lineHeight: 1.0,
                    background: 'linear-gradient(135deg, #00D4FF, #7B4FE8)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                    A system.
                  </div>
                </motion.div>
              )}

              {phase === 'fadeout' && (
                <motion.div
                  key="out"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  style={{ textAlign: 'center' }}
                >
                  <div style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 'clamp(2.8rem, 6vw, 4.5rem)',
                    fontWeight: 700,
                    fontStyle: 'italic',
                    background: 'linear-gradient(135deg, #00D4FF, #7B4FE8)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: '-0.03em',
                  }}>A system.</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Corner UI */}
          {['tl','tr','bl','br'].map(pos => (
            <div key={pos} style={{
              position: 'absolute',
              top: pos.startsWith('t') ? '1.5rem' : 'auto',
              bottom: pos.startsWith('b') ? '1.5rem' : 'auto',
              left: pos.endsWith('l') ? '1.5rem' : 'auto',
              right: pos.endsWith('r') ? '1.5rem' : 'auto',
              width: '16px', height: '16px',
              borderTop: pos.startsWith('t') ? '1px solid rgba(0,212,255,0.2)' : 'none',
              borderBottom: pos.startsWith('b') ? '1px solid rgba(0,212,255,0.2)' : 'none',
              borderLeft: pos.endsWith('l') ? '1px solid rgba(0,212,255,0.2)' : 'none',
              borderRight: pos.endsWith('r') ? '1px solid rgba(0,212,255,0.2)' : 'none',
            }} />
          ))}

          {/* Version */}
          <div style={{
            position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.5rem', color: '#2A2A3A', letterSpacing: '0.2em',
          }}>
            SID.OS v2.4.1
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
