import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { AnimatePresence, motion } from 'framer-motion';
import EntryWarp from '../components/recflow/EntryWarp';
import RecordingStudio from '../components/recflow/RecordingStudio';
import DemoSimulation from '../components/recflow/DemoSimulation';
import Benefits from '../components/recflow/Benefits';
import RecFlowCTA from '../components/recflow/CTA';

/**
 * Static star background — red-tinted, less purple than CosmicBackground
 */
function RecFlowBackground() {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse at 15% 25%, rgba(255,60,60,0.10) 0%, transparent 50%),
          radial-gradient(ellipse at 85% 75%, rgba(180,20,20,0.06) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 50%, rgba(255,20,20,0.04) 0%, transparent 70%),
          #050508
        `,
      }}
    >
      {Array.from({ length: 70 }).map((_, i) => {
        const x    = (i * 137.5) % 100;
        const y    = (i * 97.3)  % 100;
        const size = (i % 5 === 0 ? 2 : 1) + ((i * 0.13) % 1);
        const op   = 0.1 + ((i * 0.23) % 0.5);
        const col  = i % 5 === 0 ? '#FF8080' : i % 3 === 0 ? '#FF3C3C' : '#F0EFEA';
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`, top: `${y}%`,
              width: size, height: size,
              borderRadius: '50%',
              background: col,
              opacity: op,
              animation: `twinkle ${2 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${(i * 0.17) % 4}s`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes twinkle {
          0%,100% { opacity: var(--op, 0.3); transform: scale(1); }
          50%      { opacity: calc(var(--op, 0.3) * 1.7); transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}

/**
 * Minimal nav — just a back button + RecFlow wordmark
 */
function RecFlowNav() {
  const [, navigate] = useLocation();
  return (
    <motion.nav
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.25rem 2.5rem',
        background: 'rgba(5,5,8,0.8)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,60,60,0.08)',
      }}
    >
      {/* Back */}
      <button
        onClick={() => navigate('/')}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontFamily: "'Space Mono',monospace",
          fontSize: '0.55rem',
          letterSpacing: '0.2em',
          color: '#4A4A6A',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          transition: 'color 0.2s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = '#F0EFEA')}
        onMouseLeave={e => (e.currentTarget.style.color = '#4A4A6A')}
      >
        ← BACK
      </button>

      {/* Wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF3C3C', boxShadow: '0 0 10px rgba(255,60,60,0.6)' }} />
        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.6rem', letterSpacing: '0.2em', color: '#F0EFEA' }}>
          RECFLOW
        </span>
      </div>

      {/* Status badge */}
      <span style={{
        fontFamily: "'Space Mono',monospace",
        fontSize: '0.48rem',
        letterSpacing: '0.1em',
        color: '#C9A84C',
        border: '1px solid rgba(201,168,76,0.22)',
        padding: '0.18rem 0.45rem',
      }}>
        ● BUILDING
      </span>
    </motion.nav>
  );
}

export default function RecFlowPage() {
  const [warped, setWarped] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      {/* Warp animation plays once on mount */}
      <AnimatePresence>
        {!warped && <EntryWarp onComplete={() => setWarped(true)} />}
      </AnimatePresence>

      {/* Page body — fades in after warp */}
      <AnimatePresence>
        {warped && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45 }}
          >
            <RecFlowBackground />
            <RecFlowNav />

            <main style={{ position: 'relative', zIndex: 1 }}>
              {/* SECTION 1 — Hero studio */}
              <RecordingStudio />

              {/* SECTION 2 — Interactive demo simulation */}
              <DemoSimulation />

              {/* SECTION 3 — Benefits cards */}
              <Benefits />

              {/* SECTION 4 — CTA */}
              <RecFlowCTA />
            </main>

            {/* Footer strip */}
            <footer
              style={{
                position: 'relative', zIndex: 1,
                borderTop: '1px solid rgba(255,255,255,0.04)',
                padding: '2rem 2.5rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.48rem', color: '#4A4A6A', letterSpacing: '0.1em' }}>
                © 2024 — SID BUILDS
              </span>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.48rem', color: '#4A4A6A', letterSpacing: '0.1em' }}>
                RECFLOW — 04/04
              </span>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
