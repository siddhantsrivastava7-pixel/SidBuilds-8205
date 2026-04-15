import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ═══════════════════════════════════════════════════════════════════════
   MEMORY LOOP v4 — intentional choreography
   Each act gets ONE dominant visual. Fragments react to their narrative role.

   ACT 1: all fragments gently ambient — "it exists"
   ACT 2: fragments SCATTER and dim — "lost, buried"
   ACT 3: fragments fade except target; source card captures — "watch it"
   ACT 4: new fragment joins cluster; quiet organization pulse — "organizes"
   ACT 5: ALL frags fade to near-zero; only search bar — "AI vs Recall"
   ACT 6: search results + focal fragment only — "remember"
   ACT 7: everything calm, very ambient — ready for CTA
   ═══════════════════════════════════════════════════════════════════════ */

type Kind = 'link' | 'note' | 'bookmark' | 'snippet';

interface Fragment {
  id: number; kind: Kind; title: string; sub: string; tag: string;
  bx: number; by: number; z: number;
  size: 'sm' | 'md' | 'lg';
  driftR: number; period: number; phase: number; axis: number;
}

const KSTYLE: Record<Kind,{accent:string;dot:string;label:string}> = {
  link:     { accent:'rgba(100,178,240,0.92)', dot:'#64B2F0', label:'LINK'     },
  note:     { accent:'rgba(175,142,245,0.92)', dot:'#AF8EF5', label:'NOTE'     },
  bookmark: { accent:'rgba(122,224,210,0.92)', dot:'#7AE0D2', label:'BOOKMARK' },
  snippet:  { accent:'rgba(245,168,80,0.92)',  dot:'#F5A850', label:'SNIPPET'  },
};

/* ─── Fragment data ──────────────────────────────────────────────────── */
const FRAGS: Fragment[] = [
  // Foreground (z:3) — visible center cluster
  { id:1,  kind:'link',     title:'Stripe Webhooks Guide',       sub:'stripe.com/docs',      tag:'2w ago',     bx:38, by:26, z:3, size:'md', driftR:3,  period:18000, phase:0.0, axis:0.4 },
  { id:6,  kind:'note',     title:'checkout.session.completed',  sub:'event type to handle', tag:'quick note', bx:58, by:32, z:3, size:'md', driftR:2,  period:22000, phase:1.9, axis:2.2 },
  { id:3,  kind:'snippet',  title:'verify_signature()',          sub:'Python · 8 lines',     tag:'GitHub',     bx:22, by:45, z:3, size:'md', driftR:3,  period:20000, phase:2.4, axis:0.7 },
  { id:8,  kind:'bookmark', title:'Webhook Security Checklist',  sub:'Medium · 5 min read',  tag:'5d ago',     bx:68, by:48, z:3, size:'md', driftR:2,  period:16000, phase:2.7, axis:0.9 },
  // Mid (z:2)
  { id:2,  kind:'note',     title:'webhook retry logic',         sub:'you wrote this',       tag:'3d ago',     bx:72, by:18, z:2, size:'sm', driftR:4,  period:24000, phase:1.2, axis:1.1 },
  { id:4,  kind:'bookmark', title:'Idempotency Keys',            sub:'Stripe best practices',tag:'bookmarks',  bx:80, by:58, z:2, size:'sm', driftR:3,  period:19000, phase:0.8, axis:1.8 },
  { id:7,  kind:'snippet',  title:'handleWebhook(req, res)',     sub:'TypeScript · 22 lines',tag:'Notion',     bx:14, by:62, z:2, size:'sm', driftR:4,  period:21000, phase:4.1, axis:1.5 },
  { id:12, kind:'link',     title:'Zod request validation',      sub:'dev.to article',       tag:'3w ago',     bx:46, by:72, z:2, size:'sm', driftR:3,  period:25000, phase:4.8, axis:0.6 },
  // Background (z:1)
  { id:10, kind:'note',     title:'test with Stripe CLI first',  sub:'important reminder',   tag:'personal',   bx:26, by:12, z:1, size:'sm', driftR:5,  period:28000, phase:0.5, axis:1.3 },
  { id:13, kind:'bookmark', title:'HTTP 200 response spec',      sub:'RFC 7231 reference',   tag:'2w ago',     bx:55, by:14, z:1, size:'sm', driftR:4,  period:26000, phase:2.1, axis:1.7 },
  { id:5,  kind:'link',     title:'Next.js API Routes',          sub:'nextjs.org',            tag:'1mo ago',    bx:84, by:35, z:1, size:'sm', driftR:5,  period:30000, phase:3.6, axis:0.3 },
  // Far (z:0)
  { id:9,  kind:'link',     title:'ngrok – Local tunnels',       sub:'ngrok.com',             tag:'browser',    bx:15, by:80, z:0, size:'sm', driftR:2,  period:35000, phase:5.2, axis:2.9 },
  { id:11, kind:'snippet',  title:'STRIPE_WEBHOOK_SECRET',       sub:'env variable name',     tag:'.env',       bx:72, by:82, z:0, size:'sm', driftR:2,  period:38000, phase:3.0, axis:2.1 },
  { id:14, kind:'note',     title:'async queue worker pattern',  sub:'architecture note',     tag:'Notion',     bx:90, by:22, z:0, size:'sm', driftR:2,  period:32000, phase:1.4, axis:0.8 },
];

// Fragment captured in act 3
const NEW_FRAG: Fragment = {
  id:99, kind:'link', title:'Webhook Signature Verification', sub:'stripe.com/docs',
  tag:'just captured', bx:44, by:38, z:3, size:'md', driftR:2, period:19000, phase:0.3, axis:1.2,
};

const RELEVANT_IDS = new Set([1, 3, 6, 7, 8]);
const FOCAL_ID = 1;

/* ─── Depth base values ──────────────────────────────────────────────── */
const DEPTH = {
  opacity: [0.04, 0.10, 0.22, 0.42],
  blur:    [5.0,  2.8,  1.2,  0.0],
  scale:   [0.68, 0.76, 0.86, 1.00],
};

/* ─── Scatter offsets per fragment for act 2 ─────────────────────────── */
// Pre-calculated so each fragment drifts in a unique direction
const SCATTER: Record<number,{dx:number;dy:number}> = {
  1:  {dx:  8, dy: -14}, 6:  {dx:-12, dy: -8},
  3:  {dx:-18, dy:  10}, 8:  {dx: 14, dy:  12},
  2:  {dx: 20, dy: -18}, 4:  {dx: 22, dy:  16},
  7:  {dx:-20, dy:  18}, 12: {dx:  6, dy:  22},
  10: {dx:-14, dy: -20}, 13: {dx: 16, dy: -14},
  5:  {dx: 24, dy:   8}, 9:  {dx:-10, dy:  24},
  11: {dx: 18, dy: -22}, 14: {dx:-22, dy:  12},
  99: {dx:  4, dy: -16},
};

/* ─── Phases ─────────────────────────────────────────────────────────── */
type SystemPhase =
  | 'field' | 'pre_capture' | 'capture' | 'travel' | 'absorb'
  | 'store' | 'retrieve' | 'reveal' | 'resurface' | 'return';

type FragState = 'ambient' | 'scattered' | 'relevant' | 'faded' | 'focal'
               | 'resurfaced' | 'new' | 'capture_target' | 'ghost';

function jitter(base: number, range: number){ return base + (Math.random()-0.5)*range; }

const PHASE_DUR: Record<SystemPhase,()=>number> = {
  field:       ()=>jitter(4200,1200),
  pre_capture: ()=>jitter(1200, 300),
  capture:     ()=>jitter( 800, 150),
  travel:      ()=>jitter( 900, 180),
  absorb:      ()=>jitter( 700, 150),
  store:       ()=>jitter(2800, 600),
  retrieve:    ()=>jitter(3800, 500),
  reveal:      ()=>jitter(2800, 400),
  resurface:   ()=>jitter(3000, 600),
  return:      ()=>jitter(1200, 300),
};

const PHASE_ORDER: SystemPhase[] = [
  'field','pre_capture','capture','travel','absorb',
  'store','retrieve','reveal','resurface','return',
];

function useSystemLoop(cb?: (p: SystemPhase)=>void) {
  const [phase, setPhase] = useState<SystemPhase>('field');
  useEffect(()=>{
    let idx=0, t: ReturnType<typeof setTimeout>;
    const step = ()=>{
      idx = (idx+1) % PHASE_ORDER.length;
      const next = PHASE_ORDER[idx];
      setPhase(next);
      cb?.(next);
      t = setTimeout(step, PHASE_DUR[next]());
    };
    t = setTimeout(step, jitter(3800,800));
    return ()=>clearTimeout(t);
  },[]);
  return phase;
}

/* ─── RAF clock ──────────────────────────────────────────────────────── */
function useTime(){
  const [t,setT]=useState(0);
  const t0=useRef<number|null>(null);
  const raf=useRef(0);
  useEffect(()=>{
    const tick=(ts:number)=>{ if(!t0.current)t0.current=ts; setT(ts-t0.current); raf.current=requestAnimationFrame(tick); };
    raf.current=requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(raf.current);
  },[]);
  return t;
}

function idleDrift(f: Fragment, t: number){
  const theta = (t/f.period)*Math.PI*2+f.phase;
  return { dx:Math.sin(theta)*f.driftR*Math.cos(f.axis), dy:Math.cos(theta*0.7+f.axis)*f.driftR*0.8 };
}

/* ─── Highlight util ─────────────────────────────────────────────────── */
function Hl({ text, terms }: { text:string; terms:string[] }){
  if(!terms.length) return <>{text}</>;
  const esc=terms.map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
  const spl=new RegExp(`(${esc})`,'gi');
  const tst=new RegExp(`^(${esc})$`,'i');
  return <>{text.split(spl).map((p,i)=>
    tst.test(p)
      ? <mark key={i} style={{ background:'rgba(155,120,240,0.22)',color:'rgba(210,200,255,0.95)',borderRadius:2,padding:'0 1px' }}>{p}</mark>
      : <span key={i}>{p}</span>
  )}</>;
}

/* ─── Canvas — particles + travel trail + absorb ripple + retrieve web ─ */
function EnvCanvas({ phase, containerRef, travelSrcX, travelSrcY, clusterCX, clusterCY }:{
  phase:SystemPhase; containerRef:React.RefObject<HTMLDivElement>;
  travelSrcX:number; travelSrcY:number; clusterCX:number; clusterCY:number;
}){
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef  = useRef(phase);
  const t0Ref     = useRef<number|null>(null);
  const rafRef    = useRef(0);
  const cpVar     = useRef({cx:0,cy:-60});

  useEffect(()=>{
    phaseRef.current=phase;
    if(phase==='travel'){ t0Ref.current=null; cpVar.current={cx:(Math.random()-0.5)*40,cy:-(55+Math.random()*35)}; }
    if(phase==='absorb'||phase==='retrieve') t0Ref.current=null;
  },[phase]);

  useEffect(()=>{
    const canvas=canvasRef.current!;
    const cont=containerRef.current!;
    const ctx=canvas.getContext('2d')!;

    // Ambient particles reduced — they're pure atmosphere, not product behavior.
    // Kept at low density so the canvas isn't sterile but doesn't compete with meaningful motion.
    const particles=Array.from({length:10},()=>({
      x:Math.random()*1000, y:Math.random()*700,
      vx:(Math.random()-0.5)*0.025, vy:(Math.random()-0.5)*0.02,
      r:0.3+Math.random()*0.35, a:0.006+Math.random()*0.012, hue:225+Math.random()*30,
    }));

    const easeInOutExpo=(t:number)=>{
      if(t<=0)return 0; if(t>=1)return 1;
      return t<0.5?Math.pow(2,20*t-10)/2:(2-Math.pow(2,-20*t+10))/2;
    };
    const easeOut=(t:number)=>1-Math.pow(1-t,3);

    let running=true;
    const draw=(ts:number)=>{
      const W=canvas.width=cont.offsetWidth;
      const H=canvas.height=cont.offsetHeight;
      ctx.clearRect(0,0,W,H);
      const p=phaseRef.current;

      // Particles
      particles.forEach(pt=>{
        pt.x=((pt.x+pt.vx)+W)%W; pt.y=((pt.y+pt.vy)+H)%H;
        ctx.beginPath(); ctx.arc(pt.x,pt.y,pt.r,0,Math.PI*2);
        ctx.fillStyle=`hsla(${pt.hue},45%,72%,${pt.a})`; ctx.fill();
      });

      // Travel trail
      if(p==='travel'&&travelSrcX>0){
        if(!t0Ref.current)t0Ref.current=ts;
        const rawT=Math.min((ts-t0Ref.current)/920,1);
        const prog=easeInOutExpo(rawT);
        const sx=travelSrcX,sy=travelSrcY,ex=clusterCX,ey=clusterCY;
        const cpx=sx+(ex-sx)*0.35+cpVar.current.cx;
        const cpy=sy+(ey-sy)*0.2+cpVar.current.cy;
        for(let i=0;i<50;i++){
          const bt=(i/50)*prog, mt=1-bt;
          const bx=mt*mt*sx+2*mt*bt*cpx+bt*bt*ex;
          const by=mt*mt*sy+2*mt*bt*cpy+bt*bt*ey;
          const dist=Math.abs(i/50-prog);
          const alpha=Math.max(0,(1-dist*7)*(1-bt*0.4)*0.44);
          if(alpha<0.005)continue;
          ctx.beginPath(); ctx.arc(bx,by,Math.max(0.3,2.8-bt*2.5),0,Math.PI*2);
          ctx.fillStyle=`hsla(260,65%,72%,${alpha})`; ctx.fill();
        }
        if(rawT<0.94){
          const ht=prog,hmt=1-ht;
          const hx=hmt*hmt*sx+2*hmt*ht*cpx+ht*ht*ex;
          const hy=hmt*hmt*sy+2*hmt*ht*cpy+ht*ht*ey;
          const grd=ctx.createRadialGradient(hx,hy,0,hx,hy,14);
          grd.addColorStop(0,`rgba(200,180,255,${0.65-ht*0.3})`); grd.addColorStop(1,'transparent');
          ctx.fillStyle=grd; ctx.fillRect(hx-14,hy-14,28,28);
          ctx.beginPath(); ctx.arc(hx,hy,4-ht*3.5,0,Math.PI*2);
          ctx.fillStyle=`rgba(220,205,255,${0.88-ht*0.5})`; ctx.fill();
        }
      }

      // Store pulse — gentle sustained glow at cluster center (act 4)
      if(p==='store'&&clusterCX>0){
        const pulse = (Math.sin(ts*0.0018)*0.5+0.5); // 0→1 slow breathe
        const grd=ctx.createRadialGradient(clusterCX,clusterCY,0,clusterCX,clusterCY,55);
        grd.addColorStop(0,`rgba(160,130,255,${0.14*pulse+0.04})`);
        grd.addColorStop(0.5,`rgba(130,100,240,${0.07*pulse})`);
        grd.addColorStop(1,'rgba(130,100,240,0)');
        ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(clusterCX,clusterCY,55,0,Math.PI*2); ctx.fill();
        // outer ring
        ctx.beginPath(); ctx.arc(clusterCX,clusterCY,68,0,Math.PI*2);
        ctx.strokeStyle=`rgba(155,120,255,${0.12*pulse+0.03})`; ctx.lineWidth=1; ctx.stroke();
        // Connecting dashed lines removed — they reached out to arbitrary fragments
        // and read as "lines going nowhere" rather than organization.
      }

      // Absorb ripple
      if(p==='absorb'){
        if(!t0Ref.current)t0Ref.current=ts;
        const rt=Math.min((ts-t0Ref.current)/600,1);
        if(rt<1){
          ctx.beginPath(); ctx.arc(clusterCX,clusterCY,rt*80,0,Math.PI*2);
          ctx.strokeStyle=`rgba(160,130,255,${(1-rt)*0.18})`; ctx.lineWidth=1; ctx.stroke();
          if(rt>0.2){
            ctx.beginPath(); ctx.arc(clusterCX,clusterCY,(rt-0.2)*100,0,Math.PI*2);
            ctx.strokeStyle=`rgba(130,100,240,${(1-rt)*0.09})`; ctx.lineWidth=0.5; ctx.stroke();
          }
        }
      }

      // Retrieve-web curves removed. The single primary result card already communicates
      // "here is the memory". The curves fanned out to dim fragments with no clear meaning.

      if(running) rafRef.current=requestAnimationFrame(draw);
    };
    rafRef.current=requestAnimationFrame(draw);
    return ()=>{ running=false; cancelAnimationFrame(rafRef.current); };
  },[travelSrcX,travelSrcY,clusterCX,clusterCY]);

  return <canvas ref={canvasRef} style={{ position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:0 }}/>;
}

/* ─── Fragment card ──────────────────────────────────────────────────── */
function FragCard({ f, t, state, W, H, actId }:{
  f:Fragment; t:number; state:FragState; W:number; H:number; actId:number;
}){
  const m = KSTYLE[f.kind];
  const isFocal    = state==='focal';
  const isRelevant = state==='relevant';
  const isFaded    = state==='faded' || state==='ghost';
  const isNew      = state==='new';
  const isResurfaced = state==='resurfaced';
  const isCapture  = state==='capture_target';
  const isScattered = state==='scattered';
  const isActive   = isFocal||isRelevant||isNew||isResurfaced||isCapture;

  const baseOp    = DEPTH.opacity[f.z];
  const baseBlur  = DEPTH.blur[f.z];
  const baseScale = DEPTH.scale[f.z];

  let opacity: number, blur: number, scale: number;

  if(isFocal)       { opacity=1;          blur=0;          scale=1.12; }
  else if(isCapture){ opacity=1;          blur=0;          scale=1.06; }
  else if(isRelevant){ opacity=0.82;      blur=0;          scale=1.00; }
  else if(isNew)    { opacity=1;          blur=0;          scale=1.06; }
  else if(isResurfaced){ opacity=0.80;   blur=0;          scale=1.02; }
  else if(isFaded)  {
    // Act 3 Capture: soft supporting backdrop behind SourceCard (bokeh, not blackout)
    // Act 5 Search: near-silent vacuum — only search bar breathes
    if(actId===3)      { opacity=0.10;   blur=2.5;  scale=baseScale*0.92; }
    else if(actId===5) { opacity=0.03;   blur=9;    scale=baseScale*0.86; }
    else               { opacity=0.015;  blur=7;    scale=baseScale*0.88; }
  }
  else if(isScattered){
    // Act 2 (loss): keep foreground frags readable so ONE clearly "lost" item lands;
    // push background frags further back so they don't compete.
    if(f.z===3){
      opacity = baseOp * 0.55;
      blur    = baseBlur + 1.5;
      scale   = baseScale * 0.94;
    } else {
      opacity = baseOp * 0.15;
      blur    = baseBlur + 3;
      scale   = baseScale * 0.90;
    }
  }
  else              { opacity=baseOp;     blur=baseBlur;   scale=baseScale; }

  // Scatter offset in act 2
  const scatter = isScattered ? SCATTER[f.id] ?? {dx:0,dy:0} : {dx:0,dy:0};

  // Motion is reserved for behavior moments. Non-focal frags only drift during acts 1–2
  // ("ambient"/"loss"). In capture/organize/search/retrieve/CTA they stay still so each
  // deliberate motion (travel, absorb, retrieve web) reads clearly against a stable field.
  const driftAllowed = actId===0 || actId===1 || actId===2;
  const { dx, dy } = (!driftAllowed && !isActive)
    ? { dx:0, dy:0 }
    : idleDrift(f, isActive ? f.phase*1000 : t);

  const pullX = isFocal ? (W*0.5 - (f.bx/100)*W)*0.22 : isRelevant ? (W*0.5 - (f.bx/100)*W)*0.06 : 0;
  const pullY = isFocal ? (H*0.5 - (f.by/100)*H)*0.18 : isRelevant ? (H*0.5 - (f.by/100)*H)*0.05 : 0;

  const cardW = f.size==='lg'?195 : f.size==='md'?168 : 145;

  const transition = isNew
    ? { duration:1.15, ease:[0.22,0.7,0.25,1] as any }   // gentle glide-then-settle; no pop
    : isActive
    ? { duration:isFocal?0.22:0.28, ease:[0.16,1,0.3,1] as any }
    : isFaded
    ? { duration:0.22, ease:[0.4,0,1,1] as any }
    : isScattered
    ? { duration:1.8, ease:'easeInOut' as any }
    : { duration:2.4, ease:'easeInOut' as any };

  return (
    <motion.div
      animate={{ opacity, scale, filter:`blur(${blur}px)` }}
      transition={transition}
      style={{
        position:'absolute',
        left:`${f.bx}%`, top:`${f.by}%`,
        transform:`translate(calc(-50% + ${dx+pullX+scatter.dx}px), calc(-50% + ${dy+pullY+scatter.dy}px))`,
        zIndex:isFocal?10:isNew?9:isActive?8:f.z+1,
        width:cardW,
        userSelect:'none', pointerEvents:'none', willChange:'transform,opacity,filter',
      }}
    >
      {isActive && (
        // Static active-state outline; infinite decorative pulse removed for clarity
        <div
          style={{ position:'absolute', inset:-3, borderRadius:12, border:`1px solid ${m.dot}44`, pointerEvents:'none' }}
        />
      )}
      {isCapture && (
        <motion.div
          initial={{ opacity:0.9, scale:1 }} animate={{ opacity:0, scale:1.8 }}
          transition={{ duration:0.5, ease:'easeOut' }}
          style={{ position:'absolute', inset:-8, borderRadius:16, background:`radial-gradient(circle,${m.dot}22 0%,transparent 70%)`, pointerEvents:'none' }}
        />
      )}
      <div style={{
        background:isActive
          ? 'linear-gradient(145deg,rgba(16,12,32,0.99),rgba(22,16,44,0.97))'
          : 'rgba(9,7,18,0.75)',
        border:`1px solid ${isActive ? m.accent.replace('.92','.3') : 'rgba(255,255,255,0.04)'}`,
        borderRadius:10,
        padding:f.size==='sm'?'7px 10px':'10px 13px',
        backdropFilter:'blur(16px)',
        boxShadow:isFocal
          ? `0 18px 50px rgba(0,0,0,0.7),0 0 0 1px ${m.dot}22,inset 0 1px 0 rgba(255,255,255,0.06)`
          : isActive
          ? `0 8px 28px rgba(0,0,0,0.55),0 0 0 1px ${m.dot}14`
          : '0 2px 10px rgba(0,0,0,0.3)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:5 }}>
          <div
            style={{ width:4, height:4, borderRadius:'50%', background:m.dot, opacity:isActive?1:0.3, flexShrink:0, boxShadow:isActive?`0 0 6px ${m.dot}`:'none' }}
          />
          <span style={{ fontFamily:"'Space Mono',monospace", fontSize:6.5, letterSpacing:'.18em', color:isActive?m.accent:m.accent.replace('.92','.35') }}>
            {m.label}
          </span>
          {isNew && (
            <motion.div initial={{ opacity:0, x:-4 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.1 }}
              style={{ marginLeft:'auto', background:`${m.dot}22`, border:`1px solid ${m.dot}44`, borderRadius:3, padding:'1px 5px' }}>
              <span style={{ fontFamily:"'Space Mono',monospace", fontSize:5.5, color:m.dot, letterSpacing:'.12em' }}>NEW</span>
            </motion.div>
          )}
          {isFocal && (
            <motion.div initial={{ opacity:0, x:-4 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.08 }}
              style={{ marginLeft:'auto', background:`${m.dot}22`, border:`1px solid ${m.dot}44`, borderRadius:3, padding:'1px 5px' }}>
              <span style={{ fontFamily:"'Space Mono',monospace", fontSize:5.5, color:m.dot, letterSpacing:'.12em' }}>MATCH</span>
            </motion.div>
          )}
          {isResurfaced && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.4 }}
              style={{ marginLeft:'auto', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:3, padding:'1px 5px' }}>
              <span style={{ fontFamily:"'Space Mono',monospace", fontSize:5.5, color:'rgba(180,170,220,0.5)', letterSpacing:'.1em' }}>RECALL</span>
            </motion.div>
          )}
        </div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:f.size==='sm'?10:11, fontWeight:isActive?600:500, color:isActive?'#EDE9FF':'rgba(200,196,222,0.52)', lineHeight:1.35, marginBottom:3, letterSpacing:'-0.01em' }}>
          {f.title}
        </div>
        <div style={{ fontFamily:"'Space Mono',monospace", fontSize:6.5, color:isActive?'rgba(155,150,190,0.5)':'rgba(120,115,158,0.28)', letterSpacing:'.04em' }}>
          {f.sub}
        </div>
        {f.tag && (
          <div style={{ marginTop:4, fontFamily:"'Space Mono',monospace", fontSize:6, color:isActive?m.accent.replace('.92','.48'):'rgba(90,86,128,0.22)', letterSpacing:'.06em' }}>
            · {f.tag}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Source card ────────────────────────────────────────────────────── */
function SourceCard({ phase }: { phase: SystemPhase }){
  const active = ['pre_capture','capture'].includes(phase);
  const hl     = phase==='capture';
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity:0, scale:0.92, x:-14, y:12 }}
          animate={{ opacity:1, scale:1, x:0, y:hl?-8:0 }}
          exit={{ opacity:0, scale:0.5, filter:'blur(4px) saturate(0.1)', transition:{ duration:0.25, ease:[0.6,0,1,0.5] } }}
          transition={{ duration:0.3, ease:[0.16,1,0.3,1] }}
          style={{ position:'absolute', left:'5%', top:'14%', zIndex:20, width:230, borderRadius:11, overflow:'hidden', background:'rgba(11,9,24,0.98)', border:hl?'1px solid rgba(148,115,240,0.55)':'1px solid rgba(255,255,255,0.07)', boxShadow:hl?'0 10px 40px rgba(120,82,230,0.4)':'0 4px 20px rgba(0,0,0,0.55)' }}
        >
          {/* Decorative shimmer sweep removed — SAVE badge + card elevation already communicate capture */}
          <div style={{ padding:'7px 10px', background:'rgba(255,255,255,0.01)', borderBottom:'1px solid rgba(255,255,255,0.04)', display:'flex', alignItems:'center', gap:5 }}>
            {['#FF5F57','#FEBC2E','#28C840'].map(c=>(
              <div key={c} style={{ width:6,height:6,borderRadius:'50%',background:c,opacity:0.35 }}/>
            ))}
            <div style={{ marginLeft:5,flex:1,background:'rgba(255,255,255,0.03)',borderRadius:4,padding:'2px 8px',fontFamily:"'Space Mono',monospace",fontSize:6.5,color:'rgba(150,145,185,0.36)',letterSpacing:'.03em' }}>
              stripe.com/docs
            </div>
          </div>
          <div style={{ padding:'11px 13px' }}>
            <div style={{ fontFamily:"'Space Mono',monospace",fontSize:6.5,letterSpacing:'.2em',color:hl?'rgba(100,178,240,0.72)':'rgba(100,178,240,0.4)',marginBottom:6,textTransform:'uppercase' }}>
              stripe.com / docs
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,color:hl?'#EDE9FF':'#C0BCD8',letterSpacing:'-.015em',lineHeight:1.3,marginBottom:6 }}>
              Webhook Signature Verification
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10.5,lineHeight:1.65,color:'rgba(150,145,192,0.4)' }}>
              Use <code style={{ fontFamily:"'Space Mono',monospace",fontSize:8,color:'rgba(245,168,80,0.75)',background:'rgba(245,168,80,0.05)',borderRadius:3,padding:'1px 3px' }}>constructEvent()</code> to validate incoming events.
            </div>
          </div>
          <AnimatePresence>
            {phase==='pre_capture' && (
              <motion.div
                initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }}
                exit={{ opacity:0, transition:{ duration:0.1 } }}
                transition={{ delay:0.32, duration:0.22 }}
                style={{ position:'absolute',top:29,right:9,background:'rgba(122,88,228,0.9)',border:'1px solid rgba(158,130,252,0.3)',borderRadius:6,padding:'4px 9px',display:'flex',alignItems:'center',gap:4,boxShadow:'0 2px 14px rgba(108,76,210,0.4)' }}
              >
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span style={{ fontFamily:"'Space Mono',monospace",fontSize:6.5,color:'rgba(230,225,255,0.9)',letterSpacing:'.1em' }}>SAVE</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Travel orb ─────────────────────────────────────────────────────── */
function TravelOrb({ phase, srcX, srcY, dstX, dstY }:{
  phase:SystemPhase; srcX:number; srcY:number; dstX:number; dstY:number;
}){
  if(phase!=='travel'||srcX===0) return null;
  const cpx=srcX+(dstX-srcX)*0.35+25;
  const cpy=srcY+(dstY-srcY)*0.2-60;
  const kf=[0,0.44,1].map(tt=>{
    const mt=1-tt;
    return { x:mt*mt*srcX+2*mt*tt*cpx+tt*tt*dstX-srcX, y:mt*mt*srcY+2*mt*tt*cpy+tt*tt*dstY-srcY };
  });
  return (
    <motion.div key="torb"
      initial={{ x:0,y:0,scale:1,opacity:1 }}
      animate={{ x:[0,kf[1].x,kf[2].x],y:[0,kf[1].y,kf[2].y],scale:[1,0.38,0.06],opacity:[1,0.85,0] }}
      transition={{ duration:0.9,ease:[0.3,0.05,0.6,0.95],times:[0,0.44,1] }}
      style={{ position:'absolute',left:srcX-15,top:srcY-15,zIndex:25,pointerEvents:'none',width:30,height:30 }}
    >
      <div style={{ width:'100%',height:'100%',borderRadius:'50%',background:'radial-gradient(circle at 36% 32%,rgba(215,198,255,0.96),rgba(128,88,240,0.9))',border:'1px solid rgba(200,180,255,0.35)',boxShadow:'0 0 14px rgba(148,115,240,0.7)' }}/>
    </motion.div>
  );
}

/* ─── Compress orb ───────────────────────────────────────────────────── */
function CompressOrb({ phase, orbRef }:{ phase:SystemPhase; orbRef:React.RefObject<HTMLDivElement> }){
  const visible=phase==='capture'||phase==='travel';
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={orbRef}
          initial={{ scale:0.6,opacity:0 }}
          animate={phase==='travel' ? { scale:0.15,opacity:0 } : { scale:[0.6,1.15,1],opacity:[0,1,1] }}
          exit={{ opacity:0,scale:0.15,transition:{ duration:0.1 } }}
          transition={phase==='travel' ? { duration:0.16,ease:[0.6,0,1,0.5] } : { duration:0.28,times:[0,0.55,1],ease:[0.16,1,0.3,1] }}
          style={{ position:'absolute',left:'calc(5% + 108px)',top:'calc(14% + 43px)',zIndex:21,width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center' }}
        >
          <motion.div
            animate={{ rotate:360 }} transition={{ duration:1.8,repeat:Infinity,ease:'linear' }}
            style={{ position:'absolute',inset:0,borderRadius:'50%',border:'1px solid rgba(150,120,250,0.18)',borderTopColor:'rgba(165,138,255,0.62)' }}
          />
          <div style={{ width:18,height:18,borderRadius:'50%',background:'radial-gradient(circle at 36% 32%,rgba(210,195,255,0.95),rgba(125,85,235,0.88))',border:'1px solid rgba(195,175,255,0.4)',boxShadow:'0 0 12px rgba(148,115,240,0.58)' }}/>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Search UI ──────────────────────────────────────────────────────── */
const QUERY = 'stripe webhook signature';
const TERMS = ['stripe','webhook'];
const DELAYS = [68,92,54,86,72,105,61,75,66,50,102,70,58,82,66,90,54,75,61,106,58,71].slice(0,QUERY.length);

function sleep(ms:number){ return new Promise<void>(r=>setTimeout(r,ms)); }

function Cursor(){
  return (
    <motion.span
      animate={{ opacity:[1,0,1] }} transition={{ duration:0.7,repeat:Infinity }}
      style={{ display:'inline-block',width:1.5,height:14,background:'rgba(155,120,240,0.9)',marginLeft:1.5,borderRadius:1,verticalAlign:'middle' }}
    />
  );
}

const RESULTS = [
  { id:1, kind:'link'    as Kind, title:'Stripe Webhooks Guide',      src:'stripe.com/docs', preview:'Verify signatures using constructEvent() and the Stripe-Signature header.', meta:'saved 2 weeks ago', code:false },
  { id:3, kind:'snippet' as Kind, title:'verify_signature()',         src:'your snippets',   preview:'stripe.Webhook.construct_event(\n  payload, sig_header, secret)', meta:'3 days ago · GitHub', code:true },
  { id:6, kind:'note'    as Kind, title:'checkout.session.completed', src:'your notes',      preview:'Event type to handle. Return 200 immediately, process async.', meta:'5 days ago', code:false },
];

function SearchUI({ phase, typed, actId }:{ phase:SystemPhase; typed:string; actId?:number }){
  // Gate on director act too — on some loops the phase machine isn't on retrieve/reveal
  // when the director jumps to act 5 via its watchdog. SearchUI must still appear.
  const active  = phase==='retrieve' || phase==='reveal' || actId===5 || actId===6;
  const snapped = phase==='reveal' || actId===6;
  if(!active) return null;
  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:'absolute',left:'50%',top:'46%',transform:'translate(-50%,-50%)',zIndex:12,display:'flex',flexDirection:'column',alignItems:'center',pointerEvents:'none',width:'100%' }}
    >
      <motion.div animate={{ y:snapped?-18:0 }} transition={{ duration:0.3,ease:[0.16,1,0.3,1] }} style={{ width:420 }}>
        <div style={{ background:'rgba(8,6,20,0.94)',border:`1px solid ${active?'rgba(150,115,242,0.42)':'rgba(255,255,255,0.06)'}`,borderRadius:13,padding:'12px 16px',display:'flex',alignItems:'center',gap:10,backdropFilter:'blur(28px)',boxShadow:active?'0 0 0 1px rgba(140,105,240,0.12),0 14px 40px rgba(0,0,0,0.55)':'0 4px 18px rgba(0,0,0,0.4)' }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flexShrink:0 }}>
            <circle cx="7" cy="7" r="4.8" stroke="rgba(148,112,242,0.82)" strokeWidth="1.3"/>
            <path d="M11 11L14.2 14.2" stroke="rgba(148,112,242,0.82)" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:14,letterSpacing:'-.01em',color:typed?'rgba(225,220,255,0.94)':'rgba(140,135,185,0.3)',flex:1,minHeight:20,display:'flex',alignItems:'center' }}>
            {typed ? (snapped ? <Hl text={typed} terms={TERMS}/> : <>{typed}</>) : <span style={{ fontStyle:'italic',fontSize:13 }}>Search your memory…</span>}
            {phase==='retrieve' && <Cursor/>}
          </div>
          <AnimatePresence>
            {snapped && (
              <motion.div initial={{ scale:0,opacity:0 }} animate={{ scale:1,opacity:1 }} exit={{ scale:0,opacity:0 }}
                style={{ width:7,height:7,borderRadius:'50%',background:'rgba(120,200,105,0.9)',boxShadow:'0 0 8px rgba(120,200,105,0.6)',flexShrink:0 }}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      <AnimatePresence>
        {snapped && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} style={{ marginTop:6,width:420,display:'flex',flexDirection:'column',gap:4 }}>
            {/* Retrieval beat shows a single focal result — supporting results removed for clarity */}
            {RESULTS.slice(0,1).map((r,i)=>{
              const km=KSTYLE[r.kind];
              const isPrimary = i === 0;
              return (
                <motion.div key={r.id}
                  initial={{ opacity:0,y:6,scale:0.97,filter:'blur(0px)' }}
                  animate={{ opacity:isPrimary?1:0.28, y:0, scale:isPrimary?1:0.97, filter:isPrimary?'blur(0px)':'blur(1.4px)' }}
                  transition={{ delay:i*0.07,duration:0.2,ease:[0.16,1,0.3,1] }}
                  style={{ background:'rgba(11,9,24,0.97)',border:`1px solid ${km.accent.replace('.92','.18')}`,borderRadius:10,padding:'9px 12px',backdropFilter:'blur(24px)',boxShadow:'0 4px 20px rgba(0,0,0,0.5)' }}
                >
                  <div style={{ display:'flex',alignItems:'center',gap:5,marginBottom:4 }}>
                    <div style={{ width:4,height:4,borderRadius:'50%',background:km.dot,opacity:0.8,flexShrink:0 }}/>
                    <span style={{ fontFamily:"'Space Mono',monospace",fontSize:6.5,letterSpacing:'.18em',color:km.accent,opacity:0.85 }}>{km.label}</span>
                    <span style={{ marginLeft:'auto',fontFamily:"'Space Mono',monospace",fontSize:6.5,color:'rgba(115,110,155,0.4)' }}>{r.src}</span>
                  </div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,color:'#E6E2FF',marginBottom:3,letterSpacing:'-.01em' }}>
                    <Hl text={r.title} terms={TERMS}/>
                  </div>
                  {r.code
                    ? <div style={{ fontFamily:"'Space Mono',monospace",fontSize:7.5,lineHeight:1.65,color:'rgba(188,183,224,0.5)',background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.04)',borderRadius:5,padding:'5px 8px',whiteSpace:'pre' }}><Hl text={r.preview} terms={TERMS}/></div>
                    : <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,lineHeight:1.6,color:'rgba(165,160,202,0.48)' }}><Hl text={r.preview} terms={TERMS}/></div>
                  }
                  <div style={{ marginTop:4,fontFamily:"'Space Mono',monospace",fontSize:6.5,color:'rgba(105,100,148,0.36)',letterSpacing:'.05em' }}>· {r.meta}</div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN EXPORT
   actId controls which visual elements are visible and how fragments behave.
   This is the bridge between the narrative layer (recall.tsx) and visuals.
   ═══════════════════════════════════════════════════════════════════════ */
export default function MemoryLoop({
  onPhaseChange, cinematic, actId,
}: {
  onPhaseChange?: (p: SystemPhase)=>void;
  cinematic?: boolean;
  actId?: number;
} = {}){
  const phase        = useSystemLoop(onPhaseChange);
  const t            = useTime();
  const containerRef = useRef<HTMLDivElement>(null);
  const [fragStates, setFragStates] = useState<Record<number,FragState>>({});
  const [showNewFrag, setShowNewFrag] = useState(false);
  const [resurfaceId, setResurfaceId] = useState<number|null>(null);
  const [typed, setTyped] = useState('');
  const [containerSize, setContainerSize] = useState({ W:1, H:1 });
  const [orbPos, setOrbPos] = useState({ x:0, y:0 });
  const [clusterPos, setClusterPos] = useState({ x:0, y:0 });
  const orbRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    const measure=()=>{
      if(!containerRef.current) return;
      const r=containerRef.current.getBoundingClientRect();
      setContainerSize({ W:r.width, H:r.height });
    };
    measure();
    const obs=new ResizeObserver(measure);
    if(containerRef.current) obs.observe(containerRef.current);
    return ()=>obs.disconnect();
  },[]);

  useEffect(()=>{
    if(containerSize.W>1){
      setClusterPos({ x:(NEW_FRAG.bx/100)*containerSize.W, y:(NEW_FRAG.by/100)*containerSize.H });
    }
  },[containerSize]);

  useEffect(()=>{
    if(phase==='capture'){
      setOrbPos({ x:containerSize.W*0.05+108+16, y:containerSize.H*0.14+43+16 });
    }
  },[phase,containerSize]);

  // Phase → fragment state reactions
  useEffect(()=>{
    setShowNewFrag(false);
    setResurfaceId(null);

    if(phase==='absorb'){
      const t1=setTimeout(()=>setShowNewFrag(true),160);
      return ()=>clearTimeout(t1);
    }
    if(phase==='store'){ setShowNewFrag(true); }

    if(phase==='retrieve'){
      setShowNewFrag(true);
      setFragStates({});
      setTyped('');
      let cancelled=false;
      (async()=>{
        await sleep(350);
        for(let i=1;i<=QUERY.length;i++){
          if(cancelled) return;
          await sleep(DELAYS[i-1]);
          setTyped(QUERY.slice(0,i));
        }
        await sleep(220);
        if(!cancelled){
          const s: Record<number,FragState>={};
          FRAGS.forEach(f=>{ s[f.id]=f.id===FOCAL_ID?'focal':RELEVANT_IDS.has(f.id)?'relevant':'faded'; });
          setFragStates(s);
        }
      })();
      return ()=>{ cancelled=true; };
    }

    if(phase==='reveal'){
      setShowNewFrag(true);
      const s: Record<number,FragState>={};
      FRAGS.forEach(f=>{ s[f.id]=f.id===FOCAL_ID?'focal':RELEVANT_IDS.has(f.id)?'relevant':'faded'; });
      setFragStates(s);
    }

    if(phase==='resurface'){
      setFragStates({});
      setTyped('');
      const pool=FRAGS.filter(f=>f.z<=1);
      const pick=pool[Math.floor(Math.random()*pool.length)];
      const t1=setTimeout(()=>setResurfaceId(pick.id),700);
      return ()=>clearTimeout(t1);
    }

    // pre_capture: no longer highlights an existing fragment.
    // What's being captured is the SourceCard (the incoming item), not any existing memory,
    // so putting a ripple on a random fragment in the field read as a disconnected event.

    if(phase==='return'||phase==='field'){
      setFragStates({});
      setTyped('');
    }
  },[phase]);

  // Act-driven fallback: on first loop the director can enter Act 5 via MAX_HOLD
  // watchdog while the phase machine is still on 'return'/'field'. Drive typing +
  // result focus off actId too so the search bar never misses its beat.
  useEffect(()=>{
    if(actId!==5) return;
    if(phase==='retrieve'||phase==='reveal') return; // phase effect already handling it
    setShowNewFrag(true);
    setFragStates({});
    setTyped('');
    let cancelled=false;
    (async()=>{
      await sleep(350);
      for(let i=1;i<=QUERY.length;i++){
        if(cancelled) return;
        await sleep(DELAYS[i-1]);
        setTyped(QUERY.slice(0,i));
      }
      await sleep(220);
      if(!cancelled){
        const s: Record<number,FragState>={};
        FRAGS.forEach(f=>{ s[f.id]=f.id===FOCAL_ID?'focal':RELEVANT_IDS.has(f.id)?'relevant':'faded'; });
        setFragStates(s);
      }
    })();
    return ()=>{ cancelled=true; };
  },[actId, phase]);

  const getState = useCallback((f: Fragment): FragState =>{
    if(f.id===99) return showNewFrag?'new':'ghost';
    if(f.id===resurfaceId) return 'resurfaced';
    return fragStates[f.id] ?? 'ambient';
  },[fragStates,showNewFrag,resurfaceId]);

  /* ── Per-act fragment visibility overrides ─────────────────────────
     actId controls what the fragment field looks like per narrative beat.
     Phase controls individual fragment states (focal/relevant/faded).
  ─────────────────────────────────────────────────────────────────── */
  const getActOverride = useCallback((f: Fragment): FragState|null =>{
    if(actId === undefined) return null;

    if(actId === 1){
      // Act 1 "Everything you've seen" — pure ambient, NO phase brightening
      // Ignore capture_target / any phase states — just quiet drift
      return 'ambient';
    }
    if(actId === 2){
      // Act 2 "The Problem" — all frags scatter and dim to reinforce "buried/lost"
      return 'scattered';
    }
    if(actId === 3){
      // Act 3 "Capture" — only the capture target glows, everything else ghosted
      if(fragStates[f.id]==='capture_target') return null; // let phase handle
      // NEW fragment: show after absorb/store
      if(f.id===99) return null; // let getState handle (shows 'new' after absorb)
      return 'ghost';
    }
    if(actId === 4){
      // Act 4 "It organizes itself" — cluster forming
      if(f.id===99) return null; // let getState handle (shows 'new')
      // Foreground frags gently relevant (brighter), bg frags ambient
      if(f.z===3) return 'relevant';
      return 'ambient';
    }
    if(actId === 5){
      // Act 5 "AI guesses / Recall remembers" — ONLY search bar + comparison pill
      // Ghost ALL fragment cards — let the search bar own the space
      return 'ghost';
    }
    if(actId === 6){
      // Act 6 "Don't search. Remember." — search results shown, focal frag prominent
      // Ghost non-relevant frags, let focal + relevant show
      const phaseState = fragStates[f.id];
      if(phaseState==='focal') return null;    // focal breaks forward
      if(phaseState==='relevant') return null; // relevant show dimly
      return 'ghost';
    }
    return null; // act 7: let phase handle (ambient)
  },[actId,fragStates]);

  const allFrags: Fragment[] = [...FRAGS, NEW_FRAG];

  // Show capture elements only in acts 3+
  const showCapture = actId===undefined || actId>=3;
  // Show search only in acts 5+
  const showSearch  = actId===undefined || actId>=5;

  return (
    <div ref={containerRef} style={{ position:'relative',width:'100%',height:'100%',overflow:'hidden' }}>
      <EnvCanvas
        phase={phase}
        containerRef={containerRef as React.RefObject<HTMLDivElement>}
        travelSrcX={orbPos.x} travelSrcY={orbPos.y}
        clusterCX={clusterPos.x} clusterCY={clusterPos.y}
      />

      {allFrags.map(f=>{
        const override = getActOverride(f);
        const state    = override ?? getState(f);
        return (
          <FragCard
            key={f.id} f={f} t={t} state={state}
            W={containerSize.W} H={containerSize.H}
            actId={actId??0}
          />
        );
      })}

      {showCapture && <SourceCard phase={phase}/>}
      {showCapture && <CompressOrb phase={phase} orbRef={orbRef}/>}
      {showCapture && <TravelOrb phase={phase} srcX={orbPos.x} srcY={orbPos.y} dstX={clusterPos.x} dstY={clusterPos.y}/>}
      {showSearch  && <SearchUI phase={phase} typed={typed} actId={actId}/>}
    </div>
  );
}
