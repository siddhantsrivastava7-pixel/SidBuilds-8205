import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import SystemBackground from '../components/SystemBackground';
import PlanetCanvas from '../components/mera/PlanetCanvas';
import EngineCanvas from '../components/mera/EngineCanvas';

// ── Module detail content ────────────────────────────────────────────────
const MODULE_DETAILS = {
  policy: {
    title: 'Policy Analyzer',
    sub: '— insurance intelligence',
    color: '#C9A84C',
    lines: [
      'Scans policy documents in seconds',
      'Identifies hidden exclusions and clauses',
      'Compares across providers in real-time',
      'Returns structured risk assessment',
    ],
    stat: { label: 'policies analyzed', value: '12,400+' },
  },
  sip: {
    title: 'SIP Planner',
    sub: '— systematic investment',
    color: '#00D4FF',
    lines: [
      'Projects corpus across 5–30 year horizons',
      'Adjusts for inflation and tax implications',
      'Optimizes fund selection by goal type',
      'Generates monthly contribution schedules',
    ],
    stat: { label: 'average corpus accuracy', value: '94.2%' },
  },
  lumpsum: {
    title: 'Lumpsum Planner',
    sub: '— capital deployment',
    color: '#7B8FFF',
    lines: [
      'Evaluates lumpsum vs STP strategy',
      'Market timing signal integration',
      'Risk-adjusted allocation modeling',
      'Scenario-based projection engine',
    ],
    stat: { label: 'deployment scenarios', value: '340+' },
  },
  portfolio: {
    title: 'Portfolio Analyzer',
    sub: '— allocation intelligence',
    color: '#4ECDC4',
    lines: [
      'Deep allocation breakdown by sector',
      'Overlap detection across mutual funds',
      'Rebalancing trigger identification',
      'Returns attribution analysis',
    ],
    stat: { label: 'portfolios analyzed', value: '8,200+' },
  },
} as const;

type ModuleId = keyof typeof MODULE_DETAILS;
type View = 'planet' | 'engine';

// ── Engine warp transition ────────────────────────────────────────────────
function EngineWarp({ active, onDone }: { active: boolean; onDone: () => void }) {
  useEffect(() => {
    if (active) {
      const t = setTimeout(onDone, 900);
      return () => clearTimeout(t);
    }
  }, [active, onDone]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ position: 'fixed', inset: 0, zIndex: 50, pointerEvents: 'none', overflow: 'hidden', background: 'transparent' }}
        >
          {/* Grid expansion flash */}
          {[0, 1, 2, 3, 4, 5].map(i => (
            <motion.div
              key={i}
              initial={{ scaleX: 0, opacity: 0.6 }}
              animate={{ scaleX: 1, opacity: 0 }}
              transition={{ duration: 0.7, delay: i * 0.06, ease: [0.2, 0.8, 0.4, 1] }}
              style={{
                position: 'absolute',
                left: 0, right: 0,
                top: `${(i / 6) * 100}%`,
                height: 1,
                background: 'rgba(201,168,76,0.5)',
                transformOrigin: 'left center',
              }}
            />
          ))}
          {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
            <motion.div
              key={`v${i}`}
              initial={{ scaleY: 0, opacity: 0.5 }}
              animate={{ scaleY: 1, opacity: 0 }}
              transition={{ duration: 0.7, delay: i * 0.05, ease: [0.2, 0.8, 0.4, 1] }}
              style={{
                position: 'absolute',
                top: 0, bottom: 0,
                left: `${(i / 8) * 100}%`,
                width: 1,
                background: 'rgba(201,168,76,0.4)',
                transformOrigin: 'center top',
              }}
            />
          ))}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0, 0.8, 0], scale: [0.8, 1.2, 1] }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              position: 'absolute', left: '50%', top: '50%',
              transform: 'translate(-50%,-50%)',
              fontFamily: "'Space Mono', monospace",
              fontSize: '0.5rem', letterSpacing: '0.5em',
              color: 'rgba(201,168,76,0.9)',
              whiteSpace: 'nowrap',
            }}
          >
            INITIALIZING ENGINE
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Entry warp ────────────────────────────────────────────────────────────
function EntryWarp({ done }: { done: boolean }) {
  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 1.4, ease: [0.4, 0, 0.2, 1] } }}
          style={{ position: 'fixed', inset: 0, zIndex: 100, pointerEvents: 'none', overflow: 'hidden', background: '#050508' }}
        >
          {/* Warp rings — stretch outward then collapse */}
          {[0, 1, 2, 3, 4].map(i => (
            <motion.div
              key={i}
              initial={{ scale: 0.05, opacity: 0.0 }}
              animate={{ scale: 3.5 + i * 0.8, opacity: 0 }}
              transition={{ duration: 1.6, delay: i * 0.08, ease: [0.2, 0.8, 0.6, 1] }}
              style={{
                position: 'absolute', left: '50%', top: '50%',
                transform: 'translate(-50%,-50%)',
                width: 180, height: 80,
                border: `1px solid rgba(201,168,76,${0.28 - i * 0.04})`,
                borderRadius: '50%',
              }}
            />
          ))}
          {/* Gold label */}
          <motion.div
            initial={{ opacity: 0.7, scale: 1 }}
            animate={{ opacity: 0, scale: 1.6 }}
            transition={{ duration: 1.2, delay: 0.2, ease: 'easeIn' }}
            style={{
              position: 'absolute', left: '50%', top: '50%',
              transform: 'translate(-50%,-50%)',
              fontFamily: "'Space Mono', monospace",
              fontSize: '0.55rem', letterSpacing: '0.40em',
              color: 'rgba(201,168,76,0.60)',
              whiteSpace: 'nowrap',
            }}
          >
            ENTERING — FINANCIAL ENGINE
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Module panel ──────────────────────────────────────────────────────────
function ModulePanel({ id, onClose }: { id: ModuleId; onClose: () => void }) {
  const d = MODULE_DETAILS[id];
  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'absolute', right: '4rem', top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 10,
        width: 280,
        padding: '2rem',
        background: 'rgba(5,5,8,0.88)',
        border: `1px solid ${d.color}22`,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: '1rem', right: '1rem',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(140,138,134,0.55)', fontSize: '0.7rem',
          fontFamily: "'Space Mono', monospace",
          letterSpacing: '0.2em',
        }}
      >
        ✕
      </button>

      {/* Header */}
      <div style={{ marginBottom: '1.4rem' }}>
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.5rem', letterSpacing: '0.4em',
          color: d.color, opacity: 0.7, marginBottom: '0.4rem',
        }}>
          MODULE
        </div>
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.85rem', color: '#F0EFEA',
          letterSpacing: '0.05em',
        }}>
          {d.title}
        </div>
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.6rem', color: 'rgba(140,138,134,0.65)',
          marginTop: '0.2rem',
        }}>
          {d.sub}
        </div>
      </div>

      {/* Lines */}
      <div style={{ marginBottom: '1.6rem' }}>
        {d.lines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 + i * 0.07, duration: 0.4 }}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
              marginBottom: '0.6rem',
            }}
          >
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: d.color, marginTop: 4, flexShrink: 0 }} />
            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.75rem', color: 'rgba(200,198,192,0.75)',
              lineHeight: 1.5,
            }}>
              {line}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Stat */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        style={{
          borderTop: `1px solid ${d.color}18`,
          paddingTop: '1rem',
          display: 'flex', flexDirection: 'column', gap: '0.2rem',
        }}
      >
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '1.3rem', color: d.color, letterSpacing: '0.02em',
        }}>
          {d.stat.value}
        </div>
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.5rem', letterSpacing: '0.3em',
          color: 'rgba(140,138,134,0.55)',
        }}>
          {d.stat.label.toUpperCase()}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function MeraPolicyAdvisorPage() {
  const [, navigate] = useLocation();
  const [warpDone, setWarpDone]         = useState(false);
  const [planetVisible, setPlanetVisible] = useState(false);
  const [focusedModule, setFocusedModule] = useState<ModuleId | null>(null);
  const [view, setView]                 = useState<View>('planet');
  const [engineWarpActive, setEngineWarpActive] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setWarpDone(true), 1600);
    const t2 = setTimeout(() => setPlanetVisible(true), 900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleModuleClick = (id: string) => {
    setFocusedModule(prev => prev === id ? null : id as ModuleId);
  };

  const handleEnterEngine = () => {
    setFocusedModule(null);
    setEngineWarpActive(true);
  };

  const handleEngineWarpDone = () => {
    setEngineWarpActive(false);
    setView('engine');
  };

  const handleBackToPlanet = () => {
    setView('planet');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#050508' }}>
      {/* Persistent system environment */}
      <SystemBackground />

      {/* Entry warp (planet entry) */}
      <EntryWarp done={warpDone} />

      {/* Engine grid warp transition */}
      <EngineWarp active={engineWarpActive} onDone={handleEngineWarpDone} />

      <AnimatePresence mode="wait">
        {view === 'planet' && (
          <motion.div
            key="planet"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.08 }}
            transition={{ duration: 0.5 }}
            style={{ position: 'absolute', inset: 0, zIndex: 1 }}
          >
            {/* Planet environment */}
            <AnimatePresence>
              {planetVisible && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.8, ease: 'easeOut' }}
                  style={{ position: 'absolute', inset: 0 }}
                >
                  <PlanetCanvas
                    onModuleClick={handleModuleClick}
                    focusedModule={focusedModule}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Back nav */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: warpDone ? 1 : 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              onClick={() => navigate('/')}
              style={{
                position: 'absolute', top: '2rem', left: '2.5rem', zIndex: 20,
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                fontFamily: "'Space Mono', monospace",
                fontSize: '0.55rem', letterSpacing: '0.32em',
                color: 'rgba(201,168,76,0.55)',
                padding: 0,
              }}
            >
              <span style={{ fontSize: '0.75rem' }}>←</span>
              SYSTEM
            </motion.button>

            {/* Planet label */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: warpDone ? 1 : 0, y: warpDone ? 0 : 8 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              style={{
                position: 'absolute', bottom: '3rem', left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10, textAlign: 'center',
              }}
            >
              <div style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '0.5rem', letterSpacing: '0.45em',
                color: 'rgba(201,168,76,0.45)',
                marginBottom: '0.3rem',
              }}>
                FINANCIAL ENGINE
              </div>
              <div style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '1.05rem', letterSpacing: '0.08em',
                color: 'rgba(240,239,234,0.78)',
              }}>
                MeraPolicyAdvisor
              </div>
              <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.75rem',
                color: 'rgba(140,138,134,0.50)',
                marginTop: '0.4rem',
                maxWidth: 320,
              }}>
                Insurance intelligence + investment planning in one system
              </div>
            </motion.div>

            {/* Top-right controls */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: warpDone ? 1 : 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              style={{
                position: 'absolute', top: '2rem', right: '2.5rem',
                zIndex: 20, display: 'flex', gap: '0.8rem',
              }}
            >
              <button
                onClick={handleEnterEngine}
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '0.55rem', letterSpacing: '0.32em',
                  color: '#C9A84C',
                  border: '1px solid rgba(201,168,76,0.28)',
                  padding: '0.5rem 1.1rem',
                  background: 'none',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(201,168,76,0.65)';
                  e.currentTarget.style.background = 'rgba(201,168,76,0.05)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(201,168,76,0.28)';
                  e.currentTarget.style.background = 'none';
                }}
              >
                ENTER ENGINE →
              </button>
            </motion.div>

            {/* Module detail panel */}
            <AnimatePresence mode="wait">
              {focusedModule && (
                <ModulePanel
                  key={focusedModule}
                  id={focusedModule}
                  onClose={() => setFocusedModule(null)}
                />
              )}
            </AnimatePresence>

            {/* Orbit hint */}
            <AnimatePresence>
              {warpDone && !focusedModule && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 1.2, duration: 1 }}
                  style={{
                    position: 'absolute', bottom: '7rem', left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 10,
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '0.48rem', letterSpacing: '0.35em',
                    color: 'rgba(140,138,134,0.30)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  APPROACH MODULES TO EXPLORE — OR ENTER ENGINE
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {view === 'engine' && (
          <motion.div
            key="engine"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{ position: 'absolute', inset: 0, zIndex: 2 }}
          >
            <EngineCanvas onBack={handleBackToPlanet} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
