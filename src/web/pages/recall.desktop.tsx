import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MemoryLoop from '../components/recall/MemoryLoop';

/* ═══════════════════════════════════════════════════════════════════════
   RECALL — CINEMATIC HOMEPAGE  (v5 — strict single-focus state machine)

   RULE: Every act has ONE primary focus. Non-relevant elements are
   faded to near-zero or hidden. No overlapping UI between acts.

   ACT 1 — AMBIENT    fragments barely visible, slow drift. Pure atmosphere.
   ACT 2 — LOSS       fragments scatter/fade. Text bottom-left only.
   ACT 3 — CAPTURE    SourceCard only sharp. All frags ghost. Text top-right.
   ACT 4 — ORGANIZE   Cluster forms. Gentle convergence. Text bottom-left.
   ACT 5 — SEARCH     Hard field clear. Search bar only. Empty, intentional.
   ACT 6 — RETRIEVAL  1–3 result frags only. Text top only.
   ACT 7 — CTA        Clear field. Single button center stage.
   ═══════════════════════════════════════════════════════════════════════ */

type Act = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface ActDef {
  id: Act;
  duration: number;
  headline: string[];
  sub?: string;
  textPos: 'top-right' | 'top-center' | 'bottom-left' | 'center';
  textSize: 'xl' | 'lg';
  dimOverlay?: number;
  accentColor?: string;
  textDelay?: number; // ms after act entry before copy begins to appear — lets the visual beat register first
}

const ACTS: ActDef[] = [
  {
    id: 1,
    duration: 4000,
    headline: ["Everything you see", "doesn't have to disappear."],
    textPos: 'center',
    textSize: 'xl',
    dimOverlay: 0.0,
    textDelay: 1300,   // let the ambient field establish first
  },
  {
    id: 2,
    duration: Infinity,
    headline: ["You saw it. You saved it.", "And then you couldn't find it."],
    textPos: 'bottom-left',
    textSize: 'lg',
    dimOverlay: 0.08,
    textDelay: 700,    // after scatter has begun
  },
  {
    id: 3,
    duration: Infinity,
    headline: ["Captured automatically.", "Articles. Code. Ideas. Everything you see."],
    textPos: 'top-right',
    textSize: 'lg',
    dimOverlay: 0.22,
    textDelay: 1100,   // wait for source card to become visually clear
  },
  {
    id: 4,
    duration: Infinity,
    headline: ["Not just saved.", "Understood and organized for you."],
    textPos: 'bottom-left',
    textSize: 'lg',
    dimOverlay: 0.10,
    textDelay: 500,    // sub-beat: read quickly once clustering registers
  },
  {
    id: 5,
    duration: Infinity,
    headline: ["Don't search harder.", "Just remember."],
    textPos: 'top-center',
    textSize: 'lg',
    dimOverlay: 0.35,
    textDelay: 600,    // sub-beat: search bar is already up, land copy fast
  },
  {
    id: 6,
    duration: Infinity,
    headline: ["Exactly what you saw.", "Instantly, from your memory."],
    textPos: 'top-center',
    textSize: 'lg',
    dimOverlay: 0.0,
    textDelay: 1400,   // after the primary result has clearly emerged
  },
  {
    id: 7,
    duration: Infinity,
    headline: ["Start remembering."],
    sub: "Everything you see. Instantly retrievable.",
    textPos: 'center',
    textSize: 'xl',
    dimOverlay: 0.62,
    // Act 7 text timing handled by FinalCTA + black-pulse
  },
];

/* ─── Phase → act rules ──────────────────────────────────────────────── */
const PHASE_ACT_RULES: Array<{ phase: string; fromAct: Act; toAct: Act }> = [
  { phase: 'pre_capture', fromAct: 2, toAct: 3 },
  // Removed fromAct:1 → act 3 bypass — let Act 1's own timer hand off to Act 2 (scatter) naturally
  { phase: 'store',       fromAct: 3, toAct: 4 },
  { phase: 'retrieve',    fromAct: 4, toAct: 5 },
  { phase: 'reveal',      fromAct: 5, toAct: 6 },
  { phase: 'return',      fromAct: 6, toAct: 7 },
  { phase: 'field',       fromAct: 6, toAct: 7 },
];

/* ─── Entry veil ─────────────────────────────────────────────────────── */
function EntryVeil({ done }: { done: boolean }) {
  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.6, ease: 'easeInOut' }}
          style={{ position:'fixed', inset:0, zIndex:200, background:'#06050F', pointerEvents:'none' }}
        >
          <motion.div
            initial={{ scale: 0.04, opacity: 1 }}
            animate={{ scale: 90, opacity: 0 }}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.15, 0, 0.85, 1] }}
            style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)', width:10, height:10, borderRadius:'50%', background:'rgba(155,120,240,0.6)' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Background ─────────────────────────────────────────────────────── */
function RecallBackground({ actId }: { actId: Act }) {
  const cfg: Record<Act, string> = {
    1: 'radial-gradient(ellipse at 22% 22%, rgba(110,75,210,0.10) 0%, transparent 58%), radial-gradient(ellipse at 78% 78%, rgba(55,90,190,0.07) 0%, transparent 55%), #06050F',
    2: 'radial-gradient(ellipse at 50% 55%, rgba(35,15,70,0.14) 0%, transparent 62%), #06050F',
    3: 'radial-gradient(ellipse at 72% 22%, rgba(120,80,220,0.12) 0%, transparent 52%), #06050F',
    4: 'radial-gradient(ellipse at 48% 48%, rgba(95,75,195,0.11) 0%, transparent 56%), #06050F',
    5: '#06050F',
    6: 'radial-gradient(ellipse at 52% 38%, rgba(100,80,220,0.09) 0%, transparent 55%), #06050F',
    7: '#06050F',
  };
  return (
    <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', background:cfg[actId], transition:'background 2.8s ease' }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, opacity:0.016 }}/>
      {Array.from({length:40}).map((_,i) => (
        <div key={i} style={{ position:'absolute', left:`${(i*137.5)%100}%`, top:`${(i*97.3)%100}%`, width:1, height:1, borderRadius:'50%', background:`hsla(${i%4===0?'250,60%,78%':'220,50%,72%'},${0.03+(i*0.17)%0.12})` }}/>
      ))}
    </div>
  );
}

/* ─── Nav ────────────────────────────────────────────────────────────── */
function RecallNav({ actId }: { actId: Act }) {
  return (
    <motion.nav
      initial={{ opacity:0, y:-14 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.7, delay:1.0 }}
      style={{ position:'fixed', top:0, left:0, right:0, zIndex:90, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 2.5rem', height:56, backdropFilter:'blur(20px)', background:'rgba(6,5,15,0.5)', borderBottom:'1px solid rgba(255,255,255,0.02)' }}
    >
      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
        <div style={{ width:24, height:24, borderRadius:7, background:'linear-gradient(135deg,rgba(140,100,240,0.9),rgba(80,120,240,0.8))', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 10px rgba(140,100,240,0.25)' }}>
          <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="3.5" fill="white" opacity="0.9"/>
            <circle cx="7" cy="7" r="5.5" stroke="white" strokeWidth="1" opacity="0.2"/>
          </svg>
        </div>
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13.5, fontWeight:600, color:'#E8E4FF', letterSpacing:'-0.02em' }}>Recall</span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:5 }}>
        {ACTS.map(a => (
          <motion.div key={a.id}
            animate={{ width:a.id===actId?14:3.5, background:a.id===actId?'rgba(140,100,240,0.75)':a.id<actId?'rgba(140,100,240,0.22)':'rgba(255,255,255,0.07)' }}
            transition={{ duration:0.4, ease:[0.16,1,0.3,1] }}
            style={{ height:2.5, borderRadius:3 }}
          />
        ))}
      </div>
    </motion.nav>
  );
}

/* ─── Dim scrim ──────────────────────────────────────────────────────── */
function DimScrim({ opacity }: { opacity: number }) {
  return (
    <motion.div
      animate={{ opacity }}
      transition={{ duration:2.0, ease:'easeInOut' }}
      style={{ position:'fixed', inset:0, zIndex:4, background:'#06050F', pointerEvents:'none' }}
    />
  );
}

/* ─── Act text ───────────────────────────────────────────────────────── */
function ActText({ act, visible }: { act: ActDef; visible: boolean }) {
  // skip render if no headline
  if (!act.headline.length) return null;

  // Per-act textDelay: text waits until the visual beat has registered
  const [delayedVisible, setDelayedVisible] = useState(false);
  useEffect(() => {
    if (!visible) { setDelayedVisible(false); return; }
    const delay = act.textDelay ?? 0;
    if (delay <= 0) { setDelayedVisible(true); return; }
    const t = setTimeout(() => setDelayedVisible(true), delay);
    return () => clearTimeout(t);
  }, [visible, act.id, act.textDelay]);

  const pos: Record<ActDef['textPos'], React.CSSProperties> = {
    center:       { position:'fixed', left:'50%', top:'50%', transform:'translate(-50%,-50%)', textAlign:'center', width:'82vw', maxWidth:640 },
    'top-center': { position:'fixed', left:'50%', top:'calc(56px + 7vh)', transform:'translateX(-50%)', textAlign:'center', width:'80vw', maxWidth:640 },
    'top-right':  { position:'fixed', right:'7%', top:'calc(56px + 8vh)', textAlign:'right', width:'42vw', maxWidth:480 },
    'bottom-left':{ position:'fixed', left:'7%', bottom:'18%', textAlign:'left', width:'44vw', maxWidth:480 },
  };
  const sz = { xl:{ h1:112, sub:20 }, lg:{ h1:88, sub:18 } }[act.textSize];
  const accent = act.accentColor ?? 'rgba(160,130,255,1)';

  return (
    <AnimatePresence mode="wait">
      {delayedVisible && (
        <motion.div
          key={act.id}
          initial={{ opacity:0 }}
          animate={{ opacity:1 }}
          exit={{ opacity:0, transition:{ duration:0.3, ease:'easeIn' } }}
          transition={{ duration:0.45 }}
          style={{ ...pos[act.textPos], zIndex:20, pointerEvents:'none' }}
        >
          <div style={{ marginBottom: act.sub ? '0.9rem' : 0 }}>
            {act.headline.map((line, i) => {
              const isLast = i === act.headline.length - 1;
              return (
                <motion.div key={i}
                  initial={{ opacity:0, y:14, filter:'blur(5px)' }}
                  animate={{ opacity:1, y:0, filter:'blur(0px)' }}
                  transition={{ duration:0.65, delay:0.1 + i*0.32, ease:[0.16,1,0.3,1] }}
                >
                  <h1 style={{
                    fontFamily:"'Playfair Display',serif",
                    fontSize:`clamp(${sz.h1*0.5}px,${sz.h1*0.038}vw+1.4rem,${sz.h1}px)`,
                    fontWeight:760, letterSpacing:'-0.03em', lineHeight: isLast ? 0.98 : 1.02, margin:0,
                    color: isLast ? 'transparent' : '#F2EEFF',
                    background: isLast ? `linear-gradient(130deg,${accent},rgba(100,160,255,1))` : undefined,
                    WebkitBackgroundClip: isLast ? 'text' : undefined,
                    WebkitTextFillColor: isLast ? 'transparent' : undefined,
                    fontStyle: isLast ? 'italic' : 'normal',
                    textShadow: isLast ? 'none' : '0 2px 40px rgba(6,5,15,0.9), 0 0 80px rgba(6,5,15,0.7)',
                  }}>{line}</h1>
                </motion.div>
              );
            })}
          </div>
          {act.sub && (
            <motion.p
              initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.5, delay:0.1 + act.headline.length*0.32 + 0.1 }}
              style={{ fontFamily:"'DM Sans',sans-serif", fontSize:sz.sub, lineHeight:1.7, color:'rgba(195,190,230,0.72)', margin:0, letterSpacing:'-0.01em', textShadow:'0 2px 30px rgba(6,5,15,0.95)' }}
            >
              {act.sub}
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Act 2 edge vignette — reinforce "loss" ─────────────────────────── */
function ScatterVignette({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          transition={{ duration:2.2 }}
          style={{ position:'fixed', inset:0, zIndex:5, pointerEvents:'none',
            background:'radial-gradient(ellipse at 50% 50%, transparent 12%, rgba(6,5,15,0.78) 100%)' }}
        />
      )}
    </AnimatePresence>
  );
}

/* ─── Final CTA ──────────────────────────────────────────────────────── */
// Act 7: field is clear. Text is center. Button appears below text.
// No ambient frags, no clutter. Single focus.
function FinalCTA({ visible, onActivate }: { visible: boolean; onActivate: () => void }) {
  const [hov, setHov] = useState(false);
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    if (clicked) return;
    setClicked(true);
    setTimeout(onActivate, 380);
  };

  return (
    <AnimatePresence>
      {visible && !clicked && (
        <motion.div
          key="cta-stage"
          initial={{ opacity:0, y:22 }}
          animate={{ opacity:1, y:0 }}
          exit={{ opacity:0, scale:0.9, filter:'blur(10px)', transition:{ duration:0.5, ease:[0.4,0,1,1] } }}
          transition={{ duration:0.85, delay:0.8, ease:[0.16,1,0.3,1] }}
          style={{
            position:'fixed', left:'50%', top:'50%',
            transform:'translate(-50%,-50%)',
            zIndex:25, display:'flex', flexDirection:'column',
            alignItems:'center', gap:32, pointerEvents:'all',
          }}
        >
          {/* primary text */}
          <div style={{ textAlign:'center' }}>
            <motion.h1
              initial={{ opacity:0, y:16, filter:'blur(6px)' }}
              animate={{ opacity:1, y:0, filter:'blur(0px)' }}
              transition={{ duration:0.7, delay:0.9, ease:[0.16,1,0.3,1] }}
              style={{
                fontFamily:"'Playfair Display',serif",
                fontSize:'clamp(56px,7.2vw,108px)',
                fontWeight:760, letterSpacing:'-0.03em', lineHeight:0.98,
                color:'transparent',
                background:'linear-gradient(130deg,rgba(210,195,255,1),rgba(110,155,255,1))',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                margin:0, fontStyle:'italic',
              }}
            >
              Start remembering.
            </motion.h1>
            <motion.p
              initial={{ opacity:0 }} animate={{ opacity:1 }}
              transition={{ delay:1.2, duration:0.6 }}
              style={{ fontFamily:"'DM Sans',sans-serif", fontSize:18, lineHeight:1.4, color:'rgba(195,188,230,0.55)', margin:'0.9rem 0 0', letterSpacing:'-0.01em' }}
            >
              Everything you see. Instantly retrievable.
            </motion.p>
          </div>

          {/* button */}
          <motion.button
            initial={{ opacity:0, y:8, scale:1 }}
            animate={{ opacity:1, y:0, scale:[1, 1, 1.014, 1] }}
            transition={{
              opacity:{ delay:1.9, duration:0.55, ease:[0.16,1,0.3,1] },
              y:     { delay:1.9, duration:0.55, ease:[0.16,1,0.3,1] },
              // After the button lands, exhale a micro-confirmation pulse
              scale: { delay:1.9, duration:1.35, times:[0, 0.45, 0.68, 1], ease:'easeOut' },
            }}
            onHoverStart={()=>setHov(true)} onHoverEnd={()=>setHov(false)}
            whileTap={{ scale:0.97 }}
            onClick={handleClick}
            style={{
              display:'inline-flex', alignItems:'center', gap:10,
              background: hov
                ? 'linear-gradient(135deg,rgba(155,115,255,1),rgba(88,140,255,1))'
                : 'linear-gradient(135deg,rgba(135,98,242,0.94),rgba(76,126,242,0.90))',
              border:'none', borderRadius:11, padding:'13px 30px',
              cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
              fontSize:14.5, fontWeight:600, color:'white', letterSpacing:'-0.01em',
              boxShadow: hov ? '0 8px 40px rgba(135,98,242,0.52)' : '0 4px 24px rgba(100,78,200,0.34)',
              transition:'all 0.18s ease', outline:'none',
            }}
          >
            Get started
            <motion.svg animate={{ x:hov?3:0 }} transition={{ duration:0.16 }} width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M8 3l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </motion.svg>
          </motion.button>

          <motion.span
            initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:3.2, duration:0.6 }}
            style={{ fontFamily:"'Space Mono',monospace", fontSize:7, letterSpacing:'.15em', color:'rgba(135,130,175,0.22)', textTransform:'uppercase' }}
          >
            Free forever · Runs locally · No account required
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Download Flow ──────────────────────────────────────────────────── */
// Phase sequence: realization → convergence → orb → panel
/* ─── Platform card ──────────────────────────────────────────────────── */
// Binding phases after selection:
// idle → hover → compress → isolate → bind → transform → transit
type BindPhase = 'idle' | 'isolate' | 'bind' | 'transform' | 'transit';

interface PlatformCardProps {
  id: 'mac' | 'win';
  label: string;
  sub: string;
  icon: React.ReactNode;
  accentColor: string;
  glowColor: string;
  bindPhase: BindPhase;
  isSelected: boolean;
  panelVisible: boolean;
  onSelect: (id: 'mac' | 'win') => void;
}

function PlatformCard({ id, label, sub, icon, accentColor, glowColor, bindPhase, isSelected, panelVisible, onSelect }: PlatformCardProps) {
  const [hov, setHov] = useState(false);
  const isOther = !isSelected && bindPhase !== 'idle';

  // derive visual state
  const inTransit   = isSelected && (bindPhase === 'transit' || bindPhase === 'transform');
  const inBind      = isSelected && bindPhase === 'bind';
  const inTransform = isSelected && bindPhase === 'transform';

  return (
    <motion.div style={{ position: 'relative' }}>
      {/* ── Field ring (bind phase) ── */}
      <AnimatePresence>
        {inBind && (
          <>
            <motion.div
              key="ring1"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: [0.85, 1.35, 0.85], opacity: [0, 0.35, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ position:'absolute', inset:-28, borderRadius:'50%', border:`1px solid ${accentColor.replace('1)', '0.45)')}`, pointerEvents:'none', zIndex:2 }}
            />
            <motion.div
              key="ring2"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: [0.7, 1.6, 0.7], opacity: [0, 0.18, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              style={{ position:'absolute', inset:-48, borderRadius:'50%', border:`1px solid ${accentColor.replace('1)', '0.2)')}`, pointerEvents:'none', zIndex:1 }}
            />
          </>
        )}
      </AnimatePresence>

      {/* ── Binding line traces (bind phase) ── */}
      <AnimatePresence>
        {inBind && (
          <motion.svg
            key="traces"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{ position:'absolute', inset:-80, pointerEvents:'none', zIndex:1, overflow:'visible' }}
            viewBox="-80 -80 296 296"
          >
            {[0,1,2,3,4].map(i => {
              const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
              const r = 90 + i * 8;
              const x2 = 68 + Math.cos(angle) * r;
              const y2 = 68 + Math.sin(angle) * r;
              return (
                <motion.line key={i}
                  x1="68" y1="68" x2={x2} y2={y2}
                  stroke={accentColor.replace('1)', '0.22)')}
                  strokeWidth="0.5"
                  strokeDasharray="3 6"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: [0, 0.6, 0.3] }}
                  transition={{ duration: 0.9, delay: i * 0.08, ease: 'easeOut' }}
                />
              );
            })}
          </motion.svg>
        )}
      </AnimatePresence>

      {/* ── Card body ── */}
      <motion.button
        onHoverStart={() => !bindPhase || bindPhase === 'idle' ? setHov(true) : null}
        onHoverEnd={() => setHov(false)}
        onClick={() => bindPhase === 'idle' && onSelect(id)}
        animate={{
          // isolate: other fades hard
          opacity: isOther ? 0.08 : 1,
          scale: isOther ? 0.93
               : inTransform ? 0
               : inBind ? 1.04
               : hov ? 1.03 : 1,
          y: hov && bindPhase === 'idle' ? -4 : 0,
          filter: isOther ? 'blur(2px) saturate(0)'
                : inTransform ? 'blur(18px)'
                : hov ? 'brightness(1.08)' : 'brightness(1)',
        }}
        transition={{
          opacity:   { duration: isOther ? 0.55 : 0.3 },
          scale:     { duration: inTransform ? 0.5 : 0.32, ease: [0.16,1,0.3,1] },
          filter:    { duration: inTransform ? 0.45 : 0.25 },
          y:         { duration: 0.22, ease: [0.16,1,0.3,1] },
        }}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          padding: '22px 34px', borderRadius: 16, cursor: bindPhase === 'idle' ? 'pointer' : 'default',
          background: (hov || isSelected)
            ? `linear-gradient(135deg,${accentColor.replace('1)', '0.14)')},${glowColor.replace('1)', '0.09)')})`
            : 'rgba(255,255,255,0.035)',
          border: `1px solid ${(hov || inBind) ? accentColor.replace('1)', '0.5)') : 'rgba(255,255,255,0.07)'}`,
          boxShadow: inBind
            ? `0 0 0 1px ${accentColor.replace('1)', '0.2)')}, 0 8px 55px ${accentColor.replace('1)', '0.35)')}, 0 0 100px ${glowColor.replace('1)', '0.15)')}`
            : hov
              ? `0 8px 40px ${accentColor.replace('1)', '0.28)')}, 0 0 0 1px ${accentColor.replace('1)', '0.18)')}`
              : 'none',
          minWidth: 158, position: 'relative', zIndex: 3,
          outline: 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* icon wrapper — becomes focal on bind */}
        <motion.div
          animate={{
            scale: inBind ? 1.22 : 1,
            filter: inBind ? `drop-shadow(0 0 12px ${accentColor.replace('1)','0.8)')})` : 'none',
          }}
          transition={{ duration: 0.5, ease: [0.16,1,0.3,1] }}
        >
          {icon}
        </motion.div>

        <motion.div animate={{ opacity: inTransform ? 0 : 1 }} transition={{ duration: 0.25 }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize: 14, fontWeight: 600, color: '#E8E4FF', letterSpacing: '-0.01em', marginBottom: 3, textAlign:'center' }}>{label}</div>
          <div style={{ fontFamily:"'Space Mono',monospace", fontSize: 7, letterSpacing: '.1em', color: 'rgba(160,155,200,0.38)', textTransform: 'uppercase', textAlign:'center' }}>{sub}</div>
        </motion.div>

        {/* ripple on click */}
        <AnimatePresence>
          {isSelected && bindPhase === 'isolate' && (
            <motion.div
              key="ripple"
              initial={{ scale: 0.5, opacity: 0.7 }}
              animate={{ scale: 2.8, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: [0.16,1,0.3,1] }}
              style={{ position:'absolute', inset:0, borderRadius:16, background: accentColor.replace('1)','0.18)'), pointerEvents:'none' }}
            />
          )}
        </AnimatePresence>
      </motion.button>

      {/* ── Transform → glowing node ── */}
      <AnimatePresence>
        {inTransit && (
          <motion.div
            key="node"
            initial={{ scale: 0, opacity: 0 }}
            animate={bindPhase === 'transit'
              ? { scale: [0, 1, 0.6], opacity: [0, 1, 0], y: [0, 0, -180], filter: ['blur(0px)','blur(0px)','blur(8px)'] }
              : { scale: 1, opacity: 1 }
            }
            transition={{ duration: 1.6, ease: [0.16,1,0.3,1] }}
            style={{
              position:'absolute', left:'50%', top:'50%',
              transform:'translate(-50%,-50%)',
              width: 48, height: 48, borderRadius:'50%',
              background: `radial-gradient(circle at 38% 38%, ${accentColor.replace('1)','0.95)')}, ${glowColor.replace('1)','0.7)')})`,
              boxShadow: `0 0 32px ${accentColor.replace('1)','0.7)')}, 0 0 80px ${glowColor.replace('1)','0.3)')}`,
              pointerEvents:'none', zIndex:10,
            }}
          >
            {/* pulse rings */}
            {[0,1].map(ri => (
              <motion.div key={ri}
                animate={{ scale: [1, 1.9+ri*0.5, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ repeat: Infinity, duration: 1.2 + ri*0.4, ease:'easeInOut', delay: ri*0.3 }}
                style={{ position:'absolute', inset: -(12+ri*8), borderRadius:'50%', border:`1px solid ${accentColor.replace('1)','0.35)')}` }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Download Flow ──────────────────────────────────────────────────── */
type DLPhase = 'realization' | 'convergence' | 'orb' | 'panel';

function DownloadFlow({ active }: { active: boolean }) {
  const [dlPhase, setDlPhase] = useState<DLPhase>('realization');
  const [selected, setSelected]   = useState<'mac' | 'win' | null>(null);
  const [bindPhase, setBindPhase] = useState<BindPhase>('idle');

  // realization → convergence → orb → panel
  useEffect(() => {
    if (!active) return;
    const t1 = setTimeout(() => setDlPhase('convergence'), 1400);
    const t2 = setTimeout(() => setDlPhase('orb'),         2400);
    const t3 = setTimeout(() => setDlPhase('panel'),       3400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [active]);

  // selection → 6-phase binding sequence
  const handleSelect = (id: 'mac' | 'win') => {
    if (selected) return;
    setSelected(id);
    setBindPhase('isolate');
    setTimeout(() => setBindPhase('bind'),      420);
    setTimeout(() => setBindPhase('transform'), 2000);
    setTimeout(() => setBindPhase('transit'),   2600);
  };

  if (!active) return null;

  const inOrb   = dlPhase === 'orb' || dlPhase === 'panel';
  const inPanel = dlPhase === 'panel';
  const inBinding = bindPhase !== 'idle';

  return (
    <div style={{ position:'fixed', inset:0, zIndex:60, pointerEvents:'none', display:'flex', alignItems:'center', justifyContent:'center' }}>

      {/* ── Realization text ── */}
      <AnimatePresence>
        {dlPhase === 'realization' && (
          <motion.div
            key="realization"
            initial={{ opacity:0, y:20, filter:'blur(6px)' }}
            animate={{ opacity:1, y:0, filter:'blur(0px)' }}
            exit={{ opacity:0, y:-16, filter:'blur(8px)', transition:{ duration:0.45 } }}
            transition={{ duration:0.75, delay:0.2, ease:[0.16,1,0.3,1] }}
            style={{ position:'absolute', textAlign:'center', pointerEvents:'none' }}
          >
            <p style={{
              fontFamily:"'Playfair Display',serif",
              fontSize:'clamp(34px,4.2vw,58px)', fontWeight:700, letterSpacing:'-0.03em', lineHeight:1.02,
              color:'transparent', background:'linear-gradient(130deg,rgba(200,185,255,1),rgba(120,160,255,1))',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              margin:0, fontStyle:'italic',
            }}>
              Your memory system runs<br/>on your machine.
            </p>
            <motion.p
              initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.9, duration:0.5 }}
              style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:'rgba(180,175,215,0.35)', marginTop:'0.85rem', letterSpacing:'-0.01em' }}
            >
              Private. Local. Yours.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Convergence particles ── */}
      <AnimatePresence>
        {dlPhase === 'convergence' && (
          <motion.div
            key="convergence"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            transition={{ duration:0.35 }}
            style={{ position:'absolute', width:0, height:0 }}
          >
            {Array.from({ length: 14 }).map((_, i) => {
              const angle = (i / 14) * Math.PI * 2;
              const r = 160 + (i % 3) * 60;
              return (
                <motion.div key={i}
                  initial={{ x: Math.cos(angle)*r, y: Math.sin(angle)*r, opacity:0.7, scale:1 }}
                  animate={{ x:0, y:0, opacity:0, scale:0.2 }}
                  transition={{ duration:1.1, delay:i*0.04, ease:[0.4,0,0.6,1] }}
                  style={{
                    position:'absolute', width:i%4===0?6:3, height:i%4===0?6:3, borderRadius:'50%',
                    background:`hsla(${250+i*8},70%,72%,0.9)`,
                    boxShadow:`0 0 8px hsla(${250+i*8},70%,72%,0.4)`,
                    marginLeft:'-1.5px', marginTop:'-1.5px',
                  }}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Orb ── */}
      <AnimatePresence>
        {inOrb && (
          <motion.div
            key="orb"
            initial={{ scale:0, opacity:0 }}
            animate={inPanel
              ? { scale:28, opacity:0, transition:{ duration:0.75, ease:[0.4,0,0.85,1] } }
              : { scale:1, opacity:1, transition:{ duration:0.65, ease:[0.16,1,0.3,1] } }
            }
            exit={{ scale:0, opacity:0 }}
            style={{
              position:'absolute', width:52, height:52, borderRadius:'50%',
              background:'radial-gradient(circle at 35% 35%, rgba(200,170,255,0.9), rgba(100,120,255,0.7))',
              boxShadow:'0 0 40px rgba(155,120,255,0.7), 0 0 80px rgba(100,100,255,0.3)',
            }}
          >
            <motion.div
              animate={{ scale:[1,1.55,1], opacity:[0.5,0,0.5] }}
              transition={{ repeat:Infinity, duration:1.4, ease:'easeInOut' }}
              style={{ position:'absolute', inset:-10, borderRadius:'50%', border:'1px solid rgba(160,130,255,0.4)' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Platform panel ── */}
      <AnimatePresence>
        {inPanel && (
          <motion.div
            key="panel"
            initial={{ opacity:0, scale:0.84, y:18, filter:'blur(10px)' }}
            animate={{ opacity:1, scale:1, y:0, filter:'blur(0px)' }}
            transition={{ duration:0.75, delay:0.25, ease:[0.16,1,0.3,1] }}
            style={{ position:'absolute', pointerEvents:'all', display:'flex', flexDirection:'column', alignItems:'center', gap:30 }}
          >
            {/* heading */}
            <AnimatePresence>
              {!inBinding && (
                <motion.div
                  key="heading"
                  exit={{ opacity:0, y:-12, filter:'blur(6px)', transition:{ duration:0.35 } }}
                  style={{ textAlign:'center' }}
                >
                  <motion.div
                    initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                    transition={{ delay:0.5, duration:0.5 }}
                    style={{ fontFamily:"'Space Mono',monospace", fontSize:7.5, letterSpacing:'.22em', color:'rgba(140,100,240,0.5)', textTransform:'uppercase', marginBottom:'0.75rem' }}
                  >
                    ◈ Connect your machine
                  </motion.div>
                  <motion.h2
                    initial={{ opacity:0, y:10, filter:'blur(4px)' }}
                    animate={{ opacity:1, y:0, filter:'blur(0px)' }}
                    transition={{ delay:0.6, duration:0.6, ease:[0.16,1,0.3,1] }}
                    style={{
                      fontFamily:"'Playfair Display',serif", fontSize:'clamp(24px,3vw,38px)',
                      fontWeight:700, letterSpacing:'-0.03em', lineHeight:1.1,
                      color:'transparent', background:'linear-gradient(130deg,rgba(200,185,255,1),rgba(120,160,255,1))',
                      WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                      margin:0, fontStyle:'italic',
                    }}
                  >
                    Choose your platform.
                  </motion.h2>
                </motion.div>
              )}
            </AnimatePresence>

            {/* cards */}
            <motion.div
              initial={{ opacity:0, y:14 }}
              animate={{ opacity:1, y:0 }}
              transition={{ delay:0.85, duration:0.6, ease:[0.16,1,0.3,1] }}
              style={{ display:'flex', gap:16 }}
            >
              <PlatformCard
                id="mac" label="macOS" sub="Apple Silicon + Intel"
                accentColor="rgba(170,130,255,1)" glowColor="rgba(110,90,255,1)"
                icon={
                  <svg width="30" height="30" viewBox="0 0 28 28" fill="none">
                    <path d="M18.8 7.2c1.1-1.4 1.8-3.2 1.6-5-.1-.1-2.1.1-3.3 1.2-1.1 1-1.9 2.6-1.7 4.2 1.6.1 3.4-.4 3.4-1.4zm1.7 2.7c-1.9 0-3.5 1.1-4.4 1.1-.9 0-2.3-1-3.8-1-2 0-3.9 1.1-4.9 2.9-2.1 3.7-.5 9.2 1.5 12.2.9 1.5 2.1 3.1 3.6 3 1.4-.1 1.9-.9 3.6-.9 1.7 0 2.2.9 3.6.9 1.5-.1 2.7-1.5 3.6-3 .5-.7.9-1.5 1.2-2.3-3.2-1.2-3.7-5.6-.6-7.2-.9-1.1-2.1-2.7-3.4-2.7z" fill="rgba(210,195,255,0.88)"/>
                  </svg>
                }
                bindPhase={selected === 'mac' ? bindPhase : (selected === 'win' && bindPhase !== 'idle') ? 'isolate' : 'idle'}
                isSelected={selected === 'mac'}
                panelVisible={inPanel}
                onSelect={handleSelect}
              />
              <PlatformCard
                id="win" label="Windows" sub="Windows 10 / 11"
                accentColor="rgba(100,165,255,1)" glowColor="rgba(70,120,255,1)"
                icon={
                  <svg width="28" height="28" viewBox="0 0 26 26" fill="none">
                    <rect x="3" y="3" width="9" height="9" rx="1.5" fill="rgba(165,210,255,0.82)"/>
                    <rect x="14" y="3" width="9" height="9" rx="1.5" fill="rgba(165,210,255,0.82)"/>
                    <rect x="3" y="14" width="9" height="9" rx="1.5" fill="rgba(165,210,255,0.82)"/>
                    <rect x="14" y="14" width="9" height="9" rx="1.5" fill="rgba(165,210,255,0.82)"/>
                  </svg>
                }
                bindPhase={selected === 'win' ? bindPhase : (selected === 'mac' && bindPhase !== 'idle') ? 'isolate' : 'idle'}
                isSelected={selected === 'win'}
                panelVisible={inPanel}
                onSelect={handleSelect}
              />
            </motion.div>

            {/* footnote — hide on binding */}
            <AnimatePresence>
              {!inBinding && (
                <motion.span
                  key="footnote"
                  initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0, transition:{ duration:0.2 } }}
                  transition={{ delay:1.4, duration:0.6 }}
                  style={{ fontFamily:"'Space Mono',monospace", fontSize:7, letterSpacing:'.14em', color:'rgba(140,135,180,0.22)', textTransform:'uppercase' }}
                >
                  Free forever · Runs locally · No account required
                </motion.span>
              )}
            </AnimatePresence>

            {/* "Preparing your environment…" text — appears on binding */}
            <AnimatePresence>
              {inBinding && bindPhase !== 'transit' && (
                <motion.div
                  key="preparing"
                  initial={{ opacity:0, y:10, filter:'blur(4px)' }}
                  animate={{ opacity:1, y:0, filter:'blur(0px)' }}
                  exit={{ opacity:0, y:-8, filter:'blur(6px)', transition:{ duration:0.4 } }}
                  transition={{ duration:0.55, delay:0.15, ease:[0.16,1,0.3,1] }}
                  style={{ position:'absolute', bottom:-60, textAlign:'center', pointerEvents:'none' }}
                >
                  <div style={{ display:'flex', alignItems:'center', gap:10, justifyContent:'center' }}>
                    {/* spinning arc */}
                    <motion.svg
                      animate={{ rotate: 360 }} transition={{ repeat:Infinity, duration:1.8, ease:'linear' }}
                      width="13" height="13" viewBox="0 0 13 13" fill="none"
                    >
                      <circle cx="6.5" cy="6.5" r="5" stroke="rgba(160,130,255,0.18)" strokeWidth="1.2"/>
                      <path d="M6.5 1.5 A5 5 0 0 1 11.5 6.5" stroke="rgba(160,130,255,0.75)" strokeWidth="1.2" strokeLinecap="round"/>
                    </motion.svg>
                    <span style={{ fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:'.18em', color:'rgba(180,165,230,0.6)', textTransform:'uppercase' }}>
                      Preparing your environment…
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Global dim on transit ── */}
      <AnimatePresence>
        {bindPhase === 'transit' && (
          <motion.div
            key="transitdim"
            initial={{ opacity:0 }} animate={{ opacity:0.38 }} exit={{ opacity:0 }}
            transition={{ duration:0.6 }}
            style={{ position:'fixed', inset:0, background:'#06050F', pointerEvents:'none', zIndex:-1 }}
          />
        )}
      </AnimatePresence>

      {/* ── Init experience — picks up from transit node ── */}
      <InitExperience active={bindPhase === 'transit'} accentColor={selected === 'mac' ? 'rgba(170,130,255,1)' : 'rgba(100,165,255,1)'} />
    </div>
  );
}

/* ─── Init Experience ────────────────────────────────────────────────── */
// Five cinematic phases after platform selection:
// dormant → continuation → initialization → confirmation → userprep → anticipation
type InitPhase = 'dormant' | 'continuation' | 'initialization' | 'confirmation' | 'userprep' | 'anticipation' | 'license';

// Structured fragment node — used in init phase 2
function StructNode({ x, y, r, delay, accent }: { x:number; y:number; r:number; delay:number; accent:string }) {
  return (
    <motion.div
      initial={{ opacity:0, scale:0 }}
      animate={{ opacity:1, scale:1 }}
      transition={{ delay, duration:0.6, ease:[0.16,1,0.3,1] }}
      style={{ position:'absolute', left:x, top:y, width:r*2, height:r*2, borderRadius:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none' }}
    >
      <motion.div
        animate={{ scale:[1,1.18,1], opacity:[0.55,1,0.55] }}
        transition={{ repeat:Infinity, duration:2.2+delay*0.3, ease:'easeInOut', delay:delay*0.5 }}
        style={{ position:'absolute', inset:0, borderRadius:'50%', background: accent.replace('1)','0.45)'), boxShadow:`0 0 ${r*3}px ${accent.replace('1)','0.25)')}` }}
      />
    </motion.div>
  );
}

// Connection line between two nodes
function ConnLine({ x1,y1,x2,y2,delay,accent }: { x1:number;y1:number;x2:number;y2:number;delay:number;accent:string }) {
  return (
    <motion.svg
      style={{ position:'absolute', inset:0, overflow:'visible', pointerEvents:'none' }}
      initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay, duration:0.4 }}
    >
      <motion.line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={accent.replace('1)','0.18)')} strokeWidth="0.6" strokeDasharray="4 8"
        initial={{ pathLength:0 }} animate={{ pathLength:1 }}
        transition={{ delay, duration:1.0, ease:'easeOut' }}
      />
    </motion.svg>
  );
}

function InitExperience({ active, accentColor }: { active: boolean; accentColor: string }) {
  const [phase, setPhase] = useState<InitPhase>('dormant');

  useEffect(() => {
    if (!active) { setPhase('dormant'); return; }
    // node arrives from transit at ~1.6s, then sequence:
    const t0 = setTimeout(() => setPhase('continuation'),    800);
    const t1 = setTimeout(() => setPhase('initialization'), 3200);
    const t2 = setTimeout(() => setPhase('confirmation'),   5800);
    const t3 = setTimeout(() => setPhase('userprep'),       8000);
    const t4 = setTimeout(() => setPhase('anticipation'),  11500);
    const t5 = setTimeout(() => setPhase('license'),       14500);
    return () => { [t0,t1,t2,t3,t4,t5].forEach(clearTimeout); };
  }, [active]);

  if (!active || phase === 'dormant') return null;

  const ac  = accentColor;
  const ac2 = ac.replace('1)', '0.6)');
  const ac3 = ac.replace('1)', '0.28)');

  const inInit   = phase === 'initialization' || phase === 'confirmation' || phase === 'userprep' || phase === 'anticipation' || phase === 'license';
  const inConf   = phase === 'confirmation'   || phase === 'userprep'     || phase === 'anticipation' || phase === 'license';
  const inPrep   = phase === 'userprep'       || phase === 'anticipation' || phase === 'license';
  const inAntic  = phase === 'anticipation'   || phase === 'license';
  const inLicense = phase === 'license';

  // structured fragment positions — 7 nodes arranged as a loose constellation
  const nodes = [
    { x: 0,    y: 0,    r: 5,   delay: 0    },
    { x: 110,  y: -55,  r: 3.5, delay: 0.1  },
    { x: -100, y: -40,  r: 3,   delay: 0.18 },
    { x: 145,  y: 30,   r: 2.5, delay: 0.28 },
    { x: -130, y: 55,   r: 3,   delay: 0.22 },
    { x: 30,   y: 95,   r: 2.5, delay: 0.35 },
    { x: -45,  y: -95,  r: 2,   delay: 0.14 },
  ];
  const lines = [
    [0,1],[0,2],[0,3],[0,4],[0,5],[1,3],[2,4],[1,6],[2,6]
  ];

  return (
    <div style={{ position:'fixed', inset:0, zIndex:61, pointerEvents:'none', display:'flex', alignItems:'center', justifyContent:'center' }}>

      {/* ── Phase 1: Continuation — node arrives center, slows, text fades ── */}
      <AnimatePresence>
        {phase === 'continuation' && (
          <motion.div key="cont-node"
            initial={{ scale:0.3, opacity:0, y: -120, filter:'blur(8px)' }}
            animate={{ scale:1, opacity:1, y:0, filter:'blur(0px)' }}
            exit={{ scale:1.6, opacity:0, filter:'blur(12px)', transition:{ duration:0.55 } }}
            transition={{ duration:1.1, ease:[0.16,1,0.3,1] }}
            style={{ position:'absolute', width:56, height:56, borderRadius:'50%',
              background:`radial-gradient(circle at 38% 38%, ${ac}, ${ac.replace('170,130','90,110')})`,
              boxShadow:`0 0 40px ${ac2}, 0 0 90px ${ac3}` }}
          >
            {[0,1,2].map(ri => (
              <motion.div key={ri}
                animate={{ scale:[1, 2.0+ri*0.4, 1], opacity:[0.5,0,0.5] }}
                transition={{ repeat:Infinity, duration:1.6+ri*0.5, ease:'easeInOut', delay:ri*0.28 }}
                style={{ position:'absolute', inset:-(14+ri*10), borderRadius:'50%', border:`1px solid ${ac3}` }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* continuation text — beneath node */}
      <AnimatePresence>
        {phase === 'continuation' && (
          <motion.div key="cont-text"
            initial={{ opacity:0, y: 60 }}
            animate={{ opacity:1, y: 58 }}
            exit={{ opacity:0, y: 40, transition:{ duration:0.4 } }}
            transition={{ duration:0.7, delay:0.5, ease:[0.16,1,0.3,1] }}
            style={{ position:'absolute', textAlign:'center' }}
          >
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:'rgba(200,190,240,0.55)', letterSpacing:'-0.01em' }}>
              Preparing your memory system…
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Phase 2: Initialization — node expands, constellation emerges ── */}
      <AnimatePresence>
        {inInit && (
          <motion.div key="init-field"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            transition={{ duration:0.6 }}
            style={{ position:'absolute', width:0, height:0 }}
          >
            {/* connection lines */}
            {lines.map(([a,b], li) => (
              <ConnLine key={li}
                x1={nodes[a].x} y1={nodes[a].y}
                x2={nodes[b].x} y2={nodes[b].y}
                delay={0.1 + li * 0.06} accent={ac}
              />
            ))}
            {/* nodes */}
            {nodes.map((n,i) => (
              <StructNode key={i} x={n.x} y={n.y} r={n.r} delay={n.delay} accent={ac} />
            ))}
            {/* central core */}
            <motion.div
              initial={{ scale:0, opacity:0 }}
              animate={{ scale:1, opacity:1 }}
              transition={{ duration:0.7, ease:[0.16,1,0.3,1] }}
              style={{ position:'absolute', width:18, height:18, borderRadius:'50%', transform:'translate(-50%,-50%)', marginLeft:-9, marginTop:-9,
                background:`radial-gradient(circle at 38% 38%, ${ac}, ${ac.replace('1)','0.6)')})`,
                boxShadow:`0 0 24px ${ac2}, 0 0 48px ${ac3}` }}
            >
              <motion.div
                animate={{ scale:[1,1.8,1], opacity:[0.6,0,0.6] }}
                transition={{ repeat:Infinity, duration:2.0, ease:'easeInOut' }}
                style={{ position:'absolute', inset:-8, borderRadius:'50%', border:`1px solid ${ac3}` }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* init secondary text */}
      <AnimatePresence>
        {phase === 'initialization' && (
          <motion.div key="init-text"
            initial={{ opacity:0, y:10, filter:'blur(4px)' }}
            animate={{ opacity:1, y:0, filter:'blur(0px)' }}
            exit={{ opacity:0, y:-8, filter:'blur(4px)', transition:{ duration:0.35 } }}
            transition={{ duration:0.6, delay:0.4, ease:[0.16,1,0.3,1] }}
            style={{ position:'absolute', top:'calc(50% + 130px)', textAlign:'center' }}
          >
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:'rgba(200,190,240,0.5)', letterSpacing:'-0.01em' }}>
              Preparing your memory system…
            </div>
            <motion.div
              initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.0, duration:0.5 }}
              style={{ fontFamily:"'Space Mono',monospace", fontSize:8, letterSpacing:'.15em', color:'rgba(160,150,210,0.28)', marginTop:8, textTransform:'uppercase' }}
            >
              Setting up local memory engine…
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Phase 3: Confirmation — subtle download notice ── */}
      <AnimatePresence>
        {inConf && (
          <motion.div key="confirmation"
            initial={{ opacity:0, y:6 }}
            animate={{ opacity:1, y:0 }}
            transition={{ duration:0.55, ease:[0.16,1,0.3,1] }}
            style={{ position:'absolute', top:'calc(50% + 138px)', textAlign:'center', pointerEvents:'all' }}
          >
            <motion.div
              animate={{ opacity: inPrep ? 0.18 : 1 }}
              transition={{ duration:1.0 }}
            >
              <span style={{ fontFamily:"'Space Mono',monospace", fontSize:8, letterSpacing:'.14em', color:'rgba(180,170,230,0.38)', textTransform:'uppercase' }}>
                Download started
              </span>
              <span style={{ fontFamily:"'Space Mono',monospace", fontSize:8, letterSpacing:'.1em', color:'rgba(160,150,210,0.22)', margin:'0 8px' }}>·</span>
              <motion.a
                href="#"
                onClick={e => e.preventDefault()}
                whileHover={{ color:'rgba(180,165,255,0.7)' }}
                style={{ fontFamily:"'Space Mono',monospace", fontSize:8, letterSpacing:'.1em', color:'rgba(155,145,210,0.28)', textTransform:'uppercase', textDecoration:'none', cursor:'pointer' }}
              >
                If not, click here
              </motion.a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Phase 4: User prep — holographic app window ── */}
      <AnimatePresence>
        {inPrep && (
          <motion.div key="userprep"
            initial={{ opacity:0, scale:0.92, y:14, filter:'blur(8px)' }}
            animate={{ opacity:1, scale:1, y:0, filter:'blur(0px)' }}
            exit={{ opacity:0, transition:{ duration:0.35 } }}
            transition={{ duration:0.85, ease:[0.16,1,0.3,1] }}
            style={{ position:'absolute', bottom:'12%', textAlign:'center' }}
          >
            {/* holographic window */}
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat:Infinity, duration:4.5, ease:'easeInOut' }}
              style={{
                position:'relative', width:280,
                background:'rgba(255,255,255,0.02)',
                border:`1px solid ${ac3}`,
                borderRadius:12,
                backdropFilter:'blur(12px)',
                overflow:'hidden',
                boxShadow:`0 0 0 1px ${ac.replace('1)','0.06)')}, 0 12px 40px rgba(0,0,0,0.45)`,
              }}
            >
              {/* window chrome */}
              <div style={{ padding:'8px 12px', borderBottom:`1px solid ${ac.replace('1)','0.08)')}`, display:'flex', alignItems:'center', gap:6 }}>
                {[ac.replace('1)','0.5)'), ac.replace('1)','0.3)'), ac.replace('1)','0.2)')].map((c,i) => (
                  <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:c }} />
                ))}
                <span style={{ fontFamily:"'Space Mono',monospace", fontSize:7, letterSpacing:'.14em', color: ac3, textTransform:'uppercase', marginLeft:4 }}>
                  Recall.app
                </span>
              </div>
              {/* window body */}
              <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:10 }}>
                {/* access key field */}
                <div style={{ background:ac.replace('1)','0.05)'), border:`1px solid ${ac.replace('1)','0.12)')}`, borderRadius:7, padding:'8px 10px', display:'flex', alignItems:'center', gap:8 }}>
                  <motion.div
                    animate={{ opacity:[0.4,1,0.4] }} transition={{ repeat:Infinity, duration:1.6, ease:'easeInOut' }}
                    style={{ width:1, height:12, background:ac2, borderRadius:1 }}
                  />
                  <span style={{ fontFamily:"'Space Mono',monospace", fontSize:8, letterSpacing:'.08em', color:ac.replace('1)','0.22)') }}>
                    Paste access key…
                  </span>
                </div>
                {/* decorative memory grid lines */}
                {[0,1,2].map(i => (
                  <motion.div key={i}
                    initial={{ width:'0%', opacity:0 }}
                    animate={{ width:`${55+i*15}%`, opacity:1 }}
                    transition={{ delay:0.3+i*0.14, duration:0.7, ease:'easeOut' }}
                    style={{ height:1.5, background:`linear-gradient(90deg,${ac3},transparent)`, borderRadius:1 }}
                  />
                ))}
              </div>
              {/* holographic shimmer overlay */}
              <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{ repeat:Infinity, duration:3.5, ease:'easeInOut', repeatDelay:2.5 }}
                style={{ position:'absolute', inset:0, background:`linear-gradient(105deg,transparent 40%,${ac.replace('1)','0.07)')} 50%,transparent 60%)`, pointerEvents:'none' }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:0.6, duration:0.5 }}
              style={{ marginTop:14, display:'flex', flexDirection:'column', gap:5 }}
            >
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12.5, color:'rgba(200,192,240,0.55)', letterSpacing:'-0.01em' }}>
                Open the app once it downloads.
              </span>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5, color:'rgba(175,168,220,0.32)', letterSpacing:'-0.01em' }}>
                Paste your access key to begin.
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Phase 5: Anticipation — system enriches, final statement ── */}
      <AnimatePresence>
        {inAntic && (
          <>
            {/* depth ring expansion */}
            {[0,1,2,3].map(ri => (
              <motion.div key={ri}
                initial={{ scale:0.4, opacity:0 }}
                animate={{ scale: 1 + ri*0.35, opacity: 0.06 - ri*0.012 }}
                transition={{ delay: ri*0.12, duration:1.4, ease:[0.16,1,0.3,1] }}
                style={{ position:'absolute', width:320, height:320, borderRadius:'50%',
                  border:`1px solid ${ac}`, pointerEvents:'none' }}
              />
            ))}
            {/* extra ambient nodes */}
            {[...Array(8)].map((_,i) => {
              const ang = (i/8)*Math.PI*2;
              const dist = 195 + (i%3)*25;
              return (
                <motion.div key={`amb-${i}`}
                  initial={{ scale:0, opacity:0 }}
                  animate={{ scale:1, opacity:1 }}
                  transition={{ delay:0.08+i*0.07, duration:0.5, ease:[0.16,1,0.3,1] }}
                  style={{ position:'absolute',
                    left: Math.cos(ang)*dist, top: Math.sin(ang)*dist,
                    width:4, height:4, borderRadius:'50%', transform:'translate(-50%,-50%)',
                    background:ac2, boxShadow:`0 0 8px ${ac3}` }}
                >
                  <motion.div
                    animate={{ scale:[1,1.5,1], opacity:[0.7,0,0.7] }}
                    transition={{ repeat:Infinity, duration:2+i*0.25, ease:'easeInOut', delay:i*0.15 }}
                    style={{ position:'absolute', inset:-4, borderRadius:'50%', border:`1px solid ${ac3}` }}
                  />
                </motion.div>
              );
            })}

            {/* final text */}
            <motion.div
              key="antic-text"
              initial={{ opacity:0, y:12, filter:'blur(6px)' }}
              animate={{ opacity:1, y:0, filter:'blur(0px)' }}
              transition={{ duration:0.85, delay:0.3, ease:[0.16,1,0.3,1] }}
              style={{ position:'absolute', top:'calc(50% + 145px)', textAlign:'center' }}
            >
              <motion.p style={{
                fontFamily:"'Playfair Display',serif",
                fontSize:'clamp(18px,2.2vw,28px)', fontWeight:700, letterSpacing:'-0.03em', lineHeight:1.15,
                color:'transparent',
                background:`linear-gradient(130deg,${ac},rgba(160,200,255,1))`,
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                margin:0, fontStyle:'italic',
              }}>
                Your memory system is ready.
              </motion.p>
              <motion.p
                initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.0, duration:0.6 }}
                style={{ fontFamily:"'Space Mono',monospace", fontSize:7.5, letterSpacing:'.18em', color:'rgba(160,150,210,0.28)', marginTop:10, textTransform:'uppercase' }}
              >
                Running locally · Always private
              </motion.p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Phase 6: License — system grants access ── */}
      <AnimatePresence>
        {inLicense && (
          <LicenseGrant key="license" accentColor={ac} />
        )}
      </AnimatePresence>

    </div>
  );
}

/* ─── License Grant ──────────────────────────────────────────────────── */
// Generates a deterministic-looking trial key, assembles from fragments,
// no typing feel — characters arrive as if crystallising out of the field.
function generateKey(): string {
  const seg = () => Math.random().toString(36).slice(2,6).toUpperCase();
  return `RC-TRIAL-${seg()}-${seg()}`;
}

function LicenseGrant({ accentColor }: { accentColor: string }) {
  const ac  = accentColor;
  const ac2 = ac.replace('1)', '0.55)');
  const ac3 = ac.replace('1)', '0.22)');

  const [licenseKey]    = useState(() => generateKey());
  const [assembled, setAssembled]   = useState(false);
  const [copied,    setCopied]      = useState(false);
  const [dissolved, setDissolved]   = useState(false);

  // fragments assemble ~800ms after mount
  useEffect(() => {
    const t = setTimeout(() => setAssembled(true), 820);
    return () => clearTimeout(t);
  }, []);

  const handleCopy = () => {
    if (dissolved) return;
    navigator.clipboard.writeText(licenseKey).catch(() => {});
    setCopied(true);
    setTimeout(() => setDissolved(true), 600);
  };

  // key characters split into segments for stagger
  const segments = licenseKey.split('-'); // ['RC','TRIAL','XXXX','XXXX']

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: dissolved ? 0 : 1 }}
      transition={{ duration: dissolved ? 0.9 : 0.6, ease: dissolved ? [0.4,0,1,1] : [0.16,1,0.3,1] }}
      style={{
        position: 'fixed', inset: 0, zIndex: 70,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: dissolved ? 'none' : 'all',
      }}
    >
      {/* deep dim */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: dissolved ? 0 : 0.72 }}
        transition={{ duration: 0.8 }}
        style={{ position: 'fixed', inset: 0, background: '#06050F', pointerEvents: 'none', zIndex: -1 }}
      />

      {/* ambient depth rings — slow, breathing */}
      {[0,1,2].map(ri => (
        <motion.div key={ri}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1 + ri*0.28, opacity: dissolved ? 0 : 0.045 - ri*0.01 }}
          transition={{ delay: ri*0.18, duration: 1.4, ease: [0.16,1,0.3,1] }}
          style={{
            position: 'absolute', width: 420, height: 420, borderRadius: '50%',
            border: `1px solid ${ac}`, pointerEvents: 'none',
          }}
        />
      ))}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, position: 'relative' }}>

        {/* primary text */}
        <motion.div
          initial={{ opacity: 0, y: 12, filter: 'blur(5px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16,1,0.3,1] }}
          style={{ textAlign: 'center' }}
        >
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}
            style={{ fontFamily:"'Space Mono',monospace", fontSize: 7.5, letterSpacing: '.24em',
              color: ac2, textTransform: 'uppercase', marginBottom: '0.8rem' }}
          >
            ◈ Access granted
          </motion.div>
          <motion.h2 style={{
            fontFamily:"'Playfair Display',serif",
            fontSize: 'clamp(26px,3.2vw,42px)', fontWeight: 700,
            letterSpacing: '-0.03em', lineHeight: 1.08,
            color: 'transparent',
            background: `linear-gradient(130deg,${ac},rgba(160,200,255,1))`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            margin: 0, fontStyle: 'italic',
          }}>
            Your access is ready.
          </motion.h2>
        </motion.div>

        {/* key assembly */}
        <motion.div
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
        >
          {/* fragment convergence lines — visible before assembly */}
          <AnimatePresence>
            {!assembled && (
              <motion.div
                key="frags"
                initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.3 } }}
                style={{ position: 'absolute', width: 0, height: 0 }}
              >
                {Array.from({ length: 18 }).map((_, i) => {
                  const angle = (i / 18) * Math.PI * 2;
                  const r = 80 + (i % 4) * 22;
                  return (
                    <motion.div key={i}
                      animate={{ x: [Math.cos(angle)*r, 0], y: [Math.sin(angle)*r, 0], opacity: [0.6, 0] }}
                      transition={{ duration: 0.75, delay: i * 0.025, ease: [0.4,0,0.6,1] }}
                      style={{
                        position: 'absolute', width: 3, height: 3, borderRadius: '50%',
                        background: ac2, marginLeft: -1.5, marginTop: -1.5,
                        boxShadow: `0 0 6px ${ac3}`,
                      }}
                    />
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* the key itself */}
          <motion.div
            animate={{ scale: assembled ? 1 : 0.88, filter: assembled ? 'blur(0px)' : 'blur(4px)' }}
            transition={{ duration: 0.55, ease: [0.16,1,0.3,1] }}
            style={{
              display: 'flex', alignItems: 'center', gap: 0,
              background: `linear-gradient(135deg,${ac.replace('1)','0.07)')},${ac.replace('1)','0.04)')})`,
              border: `1px solid ${ac.replace('1)','0.28)')}`,
              borderRadius: 10, padding: '14px 22px',
              boxShadow: assembled
                ? `0 0 0 1px ${ac3}, 0 6px 40px ${ac.replace('1)','0.18)')}, inset 0 1px 0 ${ac.replace('1)','0.12)')}`
                : 'none',
            }}
          >
            {segments.map((seg, si) => (
              <span key={si} style={{ display: 'flex', alignItems: 'center' }}>
                {si > 0 && (
                  <motion.span
                    initial={{ opacity: 0 }} animate={{ opacity: assembled ? 0.35 : 0 }}
                    transition={{ delay: 0.6 + si * 0.06 }}
                    style={{ fontFamily:"'Space Mono',monospace", fontSize: 15, color: ac2, margin: '0 4px' }}
                  >–</motion.span>
                )}
                {seg.split('').map((ch, ci) => (
                  <motion.span key={ci}
                    initial={{ opacity: 0, y: -8, filter: 'blur(3px)' }}
                    animate={{ opacity: assembled ? 1 : 0, y: assembled ? 0 : -8, filter: assembled ? 'blur(0px)' : 'blur(3px)' }}
                    transition={{
                      duration: 0.38,
                      delay: assembled ? 0.05 + si * 0.12 + ci * 0.04 : 0,
                      ease: [0.16,1,0.3,1],
                    }}
                    style={{
                      fontFamily:"'Space Mono',monospace",
                      fontSize: 17, fontWeight: 600,
                      letterSpacing: '0.06em',
                      color: si < 2 ? ac2 : '#E8E4FF',
                    }}
                  >
                    {ch}
                  </motion.span>
                ))}
              </span>
            ))}
          </motion.div>

          {/* secondary text */}
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: assembled ? 1 : 0 }}
            transition={{ delay: 1.0, duration: 0.55 }}
            style={{ fontFamily:"'DM Sans',sans-serif", fontSize: 12.5,
              color: 'rgba(180,172,228,0.38)', letterSpacing: '-0.01em', margin: 0, textAlign: 'center' }}
          >
            This unlocks your memory system.
          </motion.p>
        </motion.div>

        {/* CTA */}
        <AnimatePresence>
          {assembled && !dissolved && (
            <motion.div
              key="cta"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, filter: 'blur(6px)', transition: { duration: 0.4 } }}
              transition={{ delay: 1.3, duration: 0.55, ease: [0.16,1,0.3,1] }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
            >
              <CopyButton
                copied={copied}
                accentColor={ac}
                onClick={handleCopy}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* dissolve forward motion hint */}
        <AnimatePresence>
          {dissolved && (
            <motion.div
              key="dissolve-text"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{ position: 'absolute', textAlign: 'center' }}
            >
              <motion.p
                animate={{ scale: [1, 1.08], opacity: [0.6, 0], filter: ['blur(0px)', 'blur(8px)'] }}
                transition={{ duration: 1.1, ease: [0.4,0,1,1] }}
                style={{ fontFamily:"'DM Sans',sans-serif", fontSize: 13,
                  color: 'rgba(200,190,240,0.6)', letterSpacing: '-0.01em', margin: 0 }}
              >
                Key bound to your system.
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
}

/* ─── Copy Button ────────────────────────────────────────────────────── */
function CopyButton({ copied, accentColor, onClick }: { copied: boolean; accentColor: string; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  const ac = accentColor;

  return (
    <motion.button
      onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      animate={{
        background: copied
          ? `linear-gradient(135deg,${ac.replace('1)','0.55)')},${ac.replace('1)','0.38)')})`
          : hov
            ? `linear-gradient(135deg,${ac},${ac.replace('170,130','90,120')})`
            : `linear-gradient(135deg,${ac.replace('1)','0.85)')},${ac.replace('170,130','90,110').replace('1)','0.75)')})`,
        boxShadow: hov && !copied
          ? `0 8px 44px ${ac.replace('1)','0.5)')}`
          : `0 4px 24px ${ac.replace('1)','0.28)')}`,
      }}
      transition={{ duration: 0.22 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        border: 'none', borderRadius: 11, padding: '13px 28px',
        cursor: copied ? 'default' : 'pointer',
        fontFamily:"'DM Sans',sans-serif", fontSize: 14, fontWeight: 600,
        color: 'white', letterSpacing: '-0.01em', outline: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.span key="done"
            initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7L5.5 10.5L12 3.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Copied
          </motion.span>
        ) : (
          <motion.span key="copy"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            Copy &amp; Continue
            <motion.svg animate={{ x: hov ? 3 : 0 }} transition={{ duration: 0.16 }} width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M8 3l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </motion.svg>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/* ─── Progress thread ────────────────────────────────────────────────── */
function ProgressThread({ actId, total }: { actId: Act; total: number }) {
  const pct = ((actId-1)/(total-1))*100;
  return (
    <div style={{ position:'fixed', left:'2.2rem', top:'50%', transform:'translateY(-50%)', zIndex:30, display:'flex', flexDirection:'column', alignItems:'center', gap:5, pointerEvents:'none' }}>
      <div style={{ position:'relative', width:1, height:100, background:'rgba(255,255,255,0.05)', borderRadius:1 }}>
        <motion.div animate={{ height:`${pct}%` }} transition={{ duration:0.8, ease:[0.16,1,0.3,1] }} style={{ position:'absolute', top:0, left:0, width:1, background:'rgba(140,100,240,0.5)', borderRadius:1 }}/>
        <motion.div animate={{ top:`${pct}%` }} transition={{ duration:0.8, ease:[0.16,1,0.3,1] }} style={{ position:'absolute', left:'50%', transform:'translate(-50%,-50%)', width:5, height:5, borderRadius:'50%', background:'rgba(160,130,255,0.85)', boxShadow:'0 0 7px rgba(160,130,255,0.55)' }}/>
      </div>
      <span style={{ fontFamily:"'Space Mono',monospace", fontSize:6.5, letterSpacing:'.16em', color:'rgba(140,135,180,0.25)', writingMode:'vertical-rl' }}>
        {String(actId).padStart(2,'0')} / {String(total).padStart(2,'0')}
      </span>
    </div>
  );
}

/* ─── Skip / replay ──────────────────────────────────────────────────── */
function ActControl({ actId, onSkip, onReplay }: { actId: Act; onSkip:()=>void; onReplay:()=>void }) {
  return (
    <div style={{ position:'fixed', right:'2rem', bottom:'2rem', zIndex:50, display:'flex', alignItems:'center', gap:8 }}>
      {actId < 7 && (
        <motion.button
          initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:2, duration:0.4 }}
          onClick={onSkip}
          style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:7, padding:'5px 12px', cursor:'pointer', fontFamily:"'Space Mono',monospace", fontSize:7.5, letterSpacing:'.15em', color:'rgba(160,155,195,0.35)', display:'flex', alignItems:'center', gap:5 }}
        >
          SKIP
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4h6M5 1.5L7.5 4 5 6.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </motion.button>
      )}
      {actId === 7 && (
        <motion.button
          initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:3, duration:0.5 }}
          onClick={onReplay}
          style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:7, padding:'5px 12px', cursor:'pointer', fontFamily:"'Space Mono',monospace", fontSize:7.5, letterSpacing:'.15em', color:'rgba(140,135,180,0.28)', display:'flex', alignItems:'center', gap:5 }}
        >
          REPLAY
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M7 4A3 3 0 1 1 5.2 1.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/><path d="M5 1l.2 2L7 1.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </motion.button>
      )}
    </div>
  );
}

/* ─── Director ───────────────────────────────────────────────────────── */
function useDirector() {
  const [actId, setActId] = useState<Act>(1);
  const timerRef  = useRef<ReturnType<typeof setTimeout>|null>(null);
  const dwellRef  = useRef<ReturnType<typeof setTimeout>|null>(null);
  const actRef    = useRef<Act>(1);
  const actEntryRef = useRef<number>(Date.now()); // timestamp when current act started
  const [key, setKey] = useState(0);

  const clearTimers = useCallback(()=>{
    if(timerRef.current){ clearTimeout(timerRef.current); timerRef.current=null; }
    if(dwellRef.current){ clearTimeout(dwellRef.current); dwellRef.current=null; }
  },[]);

  const goToAct = useCallback((id: Act)=>{
    clearTimers();
    actRef.current = id;
    actEntryRef.current = Date.now();
    setActId(id);
  },[clearTimers]);

  const skip   = useCallback(()=>{ goToAct(Math.min(actRef.current+1,7) as Act); },[goToAct]);
  const replay = useCallback(()=>{ clearTimers(); setKey(k=>k+1); actRef.current=1; actEntryRef.current=Date.now(); setActId(1); },[clearTimers]);

  // Act 1 → 2: timer
  useEffect(()=>{
    if(actId===1){
      timerRef.current = setTimeout(()=>goToAct(2), ACTS[0].duration);
      return clearTimers;
    }
  },[actId,goToAct,clearTimers]);

  // Minimum dwell per act — prevents phase bleedthrough
  const MIN_DWELL: Partial<Record<Act, number>> = {
    2: 2500,   // act 2 (loss): at least 2.5s so user reads scatter
    3: 2400,   // act 3 (capture): hold source card clearly
    4: 1500,   // act 4 (organize — sub-beat of capture): brief context, not its own moment
    5: 1500,   // act 5 (search — sub-beat of retrieval): brief context before results
    6: 2600,   // act 6 (retrieval): hold primary result so it lands
  };
  // Maximum hold — acts auto-advance if no phase event fires within this time
  const MAX_HOLD: Partial<Record<Act, number>> = {
    2: 7000,   // act 2 never waits more than 7s
    3: 6000,   // act 3 never waits more than 6s
    4: 3200,   // organize — sub-beat, quick handoff into retrieval
    5: 3600,   // search — sub-beat, quick handoff into results
    6: 4600,   // retrieval — hold long enough to read the primary result
  };
  const MAX_NEXT: Partial<Record<Act, Act>> = { 2:3, 3:4, 4:5, 5:6, 6:7 };

  const scheduleAct = useCallback((toAct: Act)=>{
    // ±70ms jitter — kills uniform cadence, makes cycles feel like system thinking not replay
    const baseDwell = MIN_DWELL[actRef.current] ?? 0;
    const dwell = baseDwell > 0 ? baseDwell + (Math.random()*140 - 70) : 0;
    const elapsed = Date.now() - actEntryRef.current;
    const remaining = Math.max(0, dwell - elapsed);
    dwellRef.current = setTimeout(()=>goToAct(toAct), remaining);
  },[goToAct]);

  // Auto-advance watchdog: fires if no phase event advances the act within MAX_HOLD
  useEffect(()=>{
    const act = actId as Act;
    const maxMs = MAX_HOLD[act];
    const nextAct = MAX_NEXT[act];
    if(!maxMs || !nextAct) return;
    const t = setTimeout(()=>{
      if(actRef.current === act) goToAct(nextAct);
    }, maxMs);
    return ()=>clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[actId, goToAct]);

  const onPhase = useCallback((phase: string)=>{
    // Second+ loops: phase-driven re-entry with dwell guards
    // Loop re-entry: act 7 → 'pre_capture' restarts narrative from act 2 (scatter)
    if(actRef.current===7){
      if(phase==='pre_capture') scheduleAct(2);   // CTA dissolves into particles that already match Act 2 scatter state
      else if(phase==='store')  scheduleAct(4);
      else if(phase==='retrieve') scheduleAct(5);
      else if(phase==='reveal') scheduleAct(6);
      else if(phase==='return'||phase==='field') scheduleAct(7);
      return;
    }
    const rule = PHASE_ACT_RULES.find(r=>r.phase===phase && r.fromAct===actRef.current);
    if(rule) scheduleAct(rule.toAct);
  },[scheduleAct]);

  return { actId, skip, replay, onPhase, key };
}

/* ─── Page ───────────────────────────────────────────────────────────── */
export default function RecallPage() {
  const [entryDone, setEntryDone] = useState(false);
  const { actId, skip, replay, onPhase, key } = useDirector();

  useEffect(()=>{ const t=setTimeout(()=>setEntryDone(true),900); return ()=>clearTimeout(t); },[]);

  const [ctaShown, setCtaShown]       = useState(false);
  const [ctaActivated, setCtaActivated] = useState(false);
  const [blackPulse, setBlackPulse]   = useState(false);
  useEffect(()=>{
    if(actId===7){
      // Micro pause: fade to black (~400ms), hold (~200ms), then reveal CTA
      setBlackPulse(true);
      const tHold = setTimeout(()=>setBlackPulse(false), 820);
      const tShow = setTimeout(()=>setCtaShown(true), 820);
      return ()=>{ clearTimeout(tHold); clearTimeout(tShow); };
    }
    else if(actId !== 7){
      setCtaShown(false);   // leaving act 7 — hide CTA immediately to clean up the dissolve
      setBlackPulse(false);
    }
  },[actId]);

  const currentAct = ACTS.find(a=>a.id===actId)!;

  // Per-act dim values — strict single-focus enforcement
  // Act 5 & 7 kill the field almost completely; act 6 keeps only focal results
  const fieldDimByAct: Record<Act, number> = {
    1: 0.0,
    2: 0.08,
    3: 0.22,  // MemoryLoop handles fragment ghosting in act 3; deeper field dim reinforces SourceCard focus
    4: 0.08,
    5: 0.74,  // hard clear — only search bar visible
    6: 0.12,
    7: 0.82,  // full clear — only CTA center stage
  };

  const dimOpacity = ctaActivated ? 0.6 : fieldDimByAct[actId];

  return (
    <div key={key} style={{ position:'fixed', inset:0, overflow:'hidden', background:'#06050F' }}>

      {/* Layer 0 — Background */}
      <RecallBackground actId={ctaActivated ? 7 : actId}/>

      {/* Layer 1 — Memory field */}
      <motion.div
        initial={{ opacity:0 }}
        animate={{
          opacity: 1,
          scale: ctaActivated ? 1.05 : 1,
          filter: ctaActivated ? 'blur(2px)' : 'blur(0px)',
        }}
        transition={ctaActivated
          ? { scale:{ duration:2.2, ease:[0.16,1,0.3,1] }, filter:{ duration:1.0, ease:'easeOut' }, opacity:{ delay:0.5, duration:1.8 } }
          : { opacity:{ delay:0.6, duration:2.0, ease:[0.16,1,0.3,1] } }
        }
        style={{ position:'fixed', inset:0, zIndex:2 }}
      >
        <MemoryLoop onPhaseChange={onPhase} cinematic actId={actId}/>
      </motion.div>

      {/* Layer 2 — Dim scrim (enforces single-focus per act) */}
      <DimScrim opacity={dimOpacity}/>

      {/* Layer 2b — Black pulse: micro pause before CTA reveal */}
      <motion.div
        initial={{ opacity:0 }}
        animate={{ opacity: blackPulse ? 1 : 0 }}
        transition={{ duration: blackPulse ? 0.4 : 0.55, ease:'easeOut' }}
        style={{ position:'fixed', inset:0, zIndex:23, background:'#06050F', pointerEvents:'none' }}
      />

      {/* Layer 3 — Act 2: edge vignette */}
      <ScatterVignette active={actId===2 && !ctaActivated}/>

      {/* Layer 4 — Nav */}
      <AnimatePresence>
        {!ctaActivated && actId !== 7 && (
          <motion.div key="nav" exit={{ opacity:0, transition:{ duration:0.35 } }}>
            <RecallNav actId={actId}/>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Layer 5 — Progress thread */}
      <AnimatePresence>
        {!ctaActivated && actId !== 7 && (
          <motion.div key="prog" exit={{ opacity:0, transition:{ duration:0.35 } }}>
            <ProgressThread actId={actId} total={ACTS.length}/>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Layer 6 — Act text (hidden in act 5 — search bar owns; hidden in act 7 — FinalCTA owns) */}
      <AnimatePresence>
        {!ctaActivated && actId !== 7 && (
          <ActText act={currentAct} visible={entryDone}/>
        )}
      </AnimatePresence>

      {/* Layer 7 — CTA (act 7 only, center stage, after field clears) */}
      <FinalCTA visible={ctaShown && !ctaActivated} onActivate={()=>setCtaActivated(true)}/>

      {/* Layer 8 — Download flow (gated: only after CTA click) */}
      <DownloadFlow active={ctaActivated}/>

      {/* Layer 9 — Skip / Replay controls */}
      <AnimatePresence>
        {!ctaActivated && (
          <motion.div key="ctrl" exit={{ opacity:0, transition:{ duration:0.25 } }}>
            <ActControl actId={actId} onSkip={skip} onReplay={replay}/>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Entry veil */}
      <EntryVeil done={entryDone}/>
    </div>
  );
}
