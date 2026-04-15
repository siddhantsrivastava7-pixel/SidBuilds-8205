import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

/* ═══════════════════════════════════════════════════════════════════════
   RecFlow — Cinematic Product Demo
   960×540 canvas. 8.4s loop. Every frame is directed.

   SCENE STRUCTURE:
   0.0–0.8s   IDLE      — system alive, calm, powered on
   0.8–1.5s   TENSION   — cursor approaches, UI slightly dims/contracts
   1.5s       IMPACT    — record click, shutter moment
   1.5–6.1s   RECORDING — live, active, real
   6.1–8.4s   OUTPUT    — resolution, video ready
   ═══════════════════════════════════════════════════════════════════════ */

const W = 960, H = 540;
const DURATION = 8400;

/* ─── Palette ─────────────────────────────────────────────────────────── */
const C = {
  bg:         '#0C0C10',
  surface:    '#131317',
  surfaceAlt: '#191920',
  border:     'rgba(255,255,255,0.065)',
  borderMed:  'rgba(255,255,255,0.12)',
  red:        '#FF3C3C',
  redSoft:    'rgba(255,60,60,0.14)',
  redGlow:    'rgba(255,60,60,0.30)',
  green:      '#3DD68C',
  greenSoft:  'rgba(61,214,140,0.14)',
  amber:      '#F5A623',
  blue:       '#4A9EFF',
  blueSoft:   'rgba(74,158,255,0.12)',
  txt:        '#E6E6E0',
  txtMid:     '#7A7A90',
  txtDim:     '#3C3C52',
  white:      '#FFFFFF',
};

/* ─── Layout (derived from W=960, H=540) ─────────────────────────────── */
// Bottom bar: 66px tall → timeline at top (y+14), controls at center (y+44)
// This gives: tlY=478, ctrlY=508. Buttons (22px tall) from 497 to 519 — clear.
const L = {
  wx: 14, wy: 12,                    // window origin
  ww: 932, wh: 516,                  // window size
  th: 38,                            // title bar height
  lx: 24, lw: 140,                   // left panel
  bbh: 66,                           // bottom bar height
  get px() { return this.lx + this.lw + 14; }, // preview x = 178
  get py() { return this.wy + this.th + 12; },  // preview y = 62
  get pw() { return this.wx + this.ww - this.px - 12; }, // preview w = 758
  get ph() { return this.wh - this.th - this.bbh - 14; }, // preview h = 396
  get bty(){ return this.wy + this.wh - this.bbh; },       // bottom bar y = 462
  get tlY(){ return this.bty + 14; },            // timeline y = 476
  get ctrlY(){ return this.bty + 44; },          // controls y = 506
  // Webcam PIP
  camW: 104, camH: 68,
  get camX(){ return this.px + this.pw - 108; },
  get camY(){ return this.py + 10; },
};

/* ─── Easing ──────────────────────────────────────────────────────────── */
const E = {
  out3:  (t: number) => 1 - Math.pow(1-t, 3),
  out5:  (t: number) => 1 - Math.pow(1-t, 5),
  inOut: (t: number) => t<0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2,
  sharp: (t: number) => t < 0.15 ? t/0.15 : 1, // instant in, holds
};

function cl(v: number, lo=0, hi=1){ return Math.max(lo, Math.min(hi, v)); }
function lerp(a: number, b: number, t: number){ return a+(b-a)*t; }
function p01(t: number, a: number, b: number){ return cl((t-a)/(b-a)); }
function bz(t: number, p0:[number,number], p1:[number,number], p2:[number,number]):[number,number]{
  const u=1-t;
  return [u*u*p0[0]+2*u*t*p1[0]+t*t*p2[0], u*u*p0[1]+2*u*t*p1[1]+t*t*p2[1]];
}

/* ─── Canvas primitives ───────────────────────────────────────────────── */
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number){
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
  ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
  ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
  ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r);
  ctx.closePath();
}
function fillRR(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rad: number, col: string){
  ctx.fillStyle=col; rr(ctx,x,y,w,h,rad); ctx.fill();
}
function strokeRR(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rad: number, col: string, lw=1){
  ctx.strokeStyle=col; ctx.lineWidth=lw; rr(ctx,x,y,w,h,rad); ctx.stroke();
}
function txt(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, font: string, col: string, align: CanvasTextAlign='left'){
  ctx.fillStyle=col; ctx.font=font; ctx.textAlign=align; ctx.fillText(s,x,y); ctx.textAlign='left';
}
function circ(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, col: string){
  ctx.fillStyle=col; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
}
function line(ctx: CanvasRenderingContext2D, x1:number,y1:number,x2:number,y2:number,col:string,lw=1){
  ctx.strokeStyle=col; ctx.lineWidth=lw;
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
}

/* ─── Cursor ──────────────────────────────────────────────────────────── */
function drawCursor(ctx: CanvasRenderingContext2D, x: number, y: number, alpha: number, clickRipple: number){
  if (alpha<=0) return;
  ctx.save(); ctx.globalAlpha=alpha;
  if(clickRipple>0){
    ctx.globalAlpha=alpha*clickRipple*0.5;
    ctx.strokeStyle='rgba(255,255,255,0.6)'; ctx.lineWidth=1.2;
    ctx.beginPath(); ctx.arc(x,y,(1-clickRipple)*16+3,0,Math.PI*2); ctx.stroke();
    ctx.globalAlpha=alpha;
  }
  ctx.shadowColor='rgba(0,0,0,0.65)'; ctx.shadowBlur=5; ctx.shadowOffsetX=1; ctx.shadowOffsetY=1;
  ctx.fillStyle='#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(x,y); ctx.lineTo(x+10,y+13.5); ctx.lineTo(x+5.5,y+12.5);
  ctx.lineTo(x+7.5,y+18.5); ctx.lineTo(x+5.5,y+18.5); ctx.lineTo(x+3.5,y+12.5);
  ctx.lineTo(x+0.5,y+15.5); ctx.closePath(); ctx.fill();
  ctx.shadowBlur=0; ctx.shadowOffsetX=0; ctx.shadowOffsetY=0;
  ctx.strokeStyle='rgba(0,0,0,0.35)'; ctx.lineWidth=0.5;
  ctx.beginPath();
  ctx.moveTo(x,y); ctx.lineTo(x+10,y+13.5); ctx.lineTo(x+5.5,y+12.5);
  ctx.lineTo(x+7.5,y+18.5); ctx.lineTo(x+5.5,y+18.5); ctx.lineTo(x+3.5,y+12.5);
  ctx.lineTo(x+0.5,y+15.5); ctx.closePath(); ctx.stroke();
  ctx.restore();
}

/* ═══════════════════════════════════════════════════════════════════════
   SCENE RENDERER — called every frame
   ═══════════════════════════════════════════════════════════════════════ */
function renderFrame(ctx: CanvasRenderingContext2D, t: number, seed: number){
  ctx.clearRect(0,0,W,H);

  /* ── DERIVED STATE ─────────────────────────────────────── */
  const idle       = t < 1500;
  const tension    = t >= 800 && t < 1500;
  const isRec      = t >= 1500 && t < 6100;
  const isStopping = t >= 6000 && t < 6200;
  const isOut      = t >= 6200;
  const showModal  = t >= 2900 && t < 6100;

  // smooth phase values
  const tensionP  = tension ? E.inOut(p01(t,800,1400)) : 0;
  const recP      = isRec   ? p01(t,1500,1700) : 0; // first 200ms of record
  const impactP   = t>=1500&&t<1650 ? 1-p01(t,1500,1650) : 0; // sharp decay
  const stopP     = isStopping ? E.out3(p01(t,6050,6200)) : isOut ? 1 : 0;
  const outP      = isOut ? E.out3(p01(t,6300,6700)) : 0;

  // timer
  const recSecs   = isRec ? cl((t-1500)/1000,0,4.6) : isOut ? 4.6 : 0;

  // timeline progress (fills over 30s equivalent, visual only)
  const tlPct     = isRec ? cl((t-1500)/30000,0,0.9) : isOut ? 0.12 : 0;

  // parallax from cursor
  const cur = getCursor(t);
  const pxOff = (cur[0]-W/2)/W * 6;   // ±3px horizontal tilt
  const pyOff = (cur[1]-H/2)/H * 4;   // ±2px vertical tilt

  /* ── WINDOW SHADOW + OUTER GLOW ─────────────────────────── */
  ctx.save();
  const glowCol = isRec
    ? `rgba(255,60,60,${0.12 + Math.sin(t/800)*0.03})`
    : 'rgba(0,0,0,0)';
  ctx.shadowColor = isRec ? 'rgba(255,60,60,0.22)' : 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = isRec ? 48 : 40;
  ctx.shadowOffsetY = 10;
  fillRR(ctx, L.wx+pxOff*0.3, L.wy+pyOff*0.3, L.ww, L.wh, 10, C.bg);
  ctx.restore();

  // Subtle window border
  strokeRR(ctx, L.wx, L.wy, L.ww, L.wh, 10,
    isRec ? 'rgba(255,60,60,0.22)' : 'rgba(255,255,255,0.07)', 1);

  /* ── TITLE BAR ───────────────────────────────────────────── */
  ctx.save();
  rr(ctx,L.wx,L.wy,L.ww,L.th,10); ctx.clip();
  fillRR(ctx,L.wx,L.wy,L.ww,L.th,0,C.surface);
  ctx.restore();
  ctx.fillStyle='rgba(255,255,255,0.04)';
  ctx.fillRect(L.wx,L.wy+L.th-1,L.ww,1);

  // Traffic lights
  [[C.red,0.9],[C.amber,0.9],[C.green,0.9]].forEach(([col,op],i)=>{
    ctx.globalAlpha=op as number;
    circ(ctx,L.wx+15+i*18,L.wy+L.th/2,5.5,col as string);
    ctx.globalAlpha=1;
  });

  // Title: app name or REC indicator
  if(isRec){
    const p = 0.55+Math.sin(t/550)*0.45;
    ctx.save(); ctx.globalAlpha=p;
    circ(ctx,W/2-20,L.wy+L.th/2,4,C.red);
    ctx.restore();
    txt(ctx,'REC',W/2-12,L.wy+L.th/2+4,"700 10px 'Space Mono',monospace",C.red);
  } else {
    txt(ctx,'RecFlow',W/2,L.wy+L.th/2+4,"500 12px 'DM Sans',sans-serif",C.txtMid,'center');
  }

  // Timer
  if(isRec||isOut){
    const mm=String(Math.floor(recSecs/60)).padStart(2,'0');
    const ss=String(Math.floor(recSecs%60)).padStart(2,'0');
    const cs=String(Math.floor((recSecs%1)*10));
    txt(ctx,`${mm}:${ss}.${cs}`,L.wx+L.ww-14,L.wy+L.th/2+4,
      "400 9px 'Space Mono',monospace",C.txtDim,'right');
  }

  /* ── LEFT PANEL ──────────────────────────────────────────── */
  const lx=L.lx, ly=L.wy+L.th+12, lw=L.lw, lh=L.ph+10;

  fillRR(ctx,lx,ly,lw,lh,5,'rgba(255,255,255,0.012)');
  strokeRR(ctx,lx,ly,lw,lh,5,C.border);

  ctx.save(); rr(ctx,lx,ly,lw,lh,5); ctx.clip();

  const lpad = lx+10;
  let   lpy  = ly+14;
  const secFont = "600 7.5px 'Space Mono',monospace";
  const rowFont = "400 11px 'DM Sans',sans-serif";

  // MODE
  txt(ctx,'MODE',lpad,lpy,secFont,C.txtDim); lpy+=15;

  // Screen only
  ctx.save(); ctx.globalAlpha=0.4;
  ctx.strokeStyle=C.txtDim; ctx.lineWidth=1;
  ctx.beginPath(); ctx.arc(lpad+6,lpy+5,4.5,0,Math.PI*2); ctx.stroke();
  txt(ctx,'Screen only',lpad+16,lpy+9,rowFont,C.txtMid);
  ctx.restore(); lpy+=20;

  // Screen + Webcam (selected)
  circ(ctx,lpad+6,lpy+5,4.5,C.red);
  circ(ctx,lpad+6,lpy+5,2.2,C.red);
  txt(ctx,'Screen + Webcam',lpad+16,lpy+9,rowFont,C.txt); lpy+=26;

  // AUDIO
  ctx.fillStyle='rgba(255,255,255,0.04)';
  ctx.fillRect(lpad-2,lpy,lw-16,1); lpy+=10;
  txt(ctx,'AUDIO',lpad,lpy,secFont,C.txtDim); lpy+=14;

  const drawToggle=(label:string, on:boolean)=>{
    txt(ctx,label,lpad,lpy+7,rowFont,on?C.txt:C.txtMid);
    const tx=lx+lw-36, ty=lpy+1;
    fillRR(ctx,tx,ty,28,15,7.5,on?C.red:C.surfaceAlt);
    strokeRR(ctx,tx,ty,28,15,7.5,on?C.red:C.border,0.7);
    circ(ctx,on?tx+20:tx+8,ty+7.5,5,on?'#fff':C.txtDim);
    if(on){
      ctx.save(); ctx.globalAlpha=0.25;
      const g=ctx.createRadialGradient(tx+20,ty+7.5,0,tx+20,ty+7.5,9);
      g.addColorStop(0,'rgba(255,60,60,0.7)'); g.addColorStop(1,'transparent');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(tx+20,ty+7.5,9,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }
    lpy+=22;
  };
  drawToggle('Microphone',true);

  // Waveform flicker near mic (idle aliveness)
  {
    const wfY=lpy-8;
    const bars=7;
    for(let i=0;i<bars;i++){
      const ph=seed*0.003+i*0.7;
      const barH=isRec
        ? (3+Math.sin(ph+t*0.008)*4+Math.sin(seed*1.7+i*3.1+t*0.013)*2.5)
        : (1+Math.sin(ph+t*0.004)*1.5);
      const bx=lpad+i*8;
      ctx.globalAlpha=isRec?0.55:0.22;
      fillRR(ctx,bx,wfY-barH/2,5,barH,1.5,isRec?C.red:'rgba(255,255,255,0.4)');
    }
    ctx.globalAlpha=1;
    lpy+=4;
  }

  drawToggle('System Audio',true);

  // QUALITY
  ctx.fillStyle='rgba(255,255,255,0.04)';
  ctx.fillRect(lpad-2,lpy,lw-16,1); lpy+=10;
  txt(ctx,'QUALITY',lpad,lpy,secFont,C.txtDim); lpy+=13;

  ['720p','1080p','4K'].forEach((chip,i)=>{
    const sel=chip==='1080p';
    const cx=lpad+i*38, cy=lpy;
    fillRR(ctx,cx,cy,33,15,3,sel?C.redSoft:'transparent');
    strokeRR(ctx,cx,cy,33,15,3,sel?'rgba(255,60,60,0.35)':C.border,0.7);
    txt(ctx,chip,cx+16.5,cy+10.5,"500 8px 'Space Mono',monospace",sel?C.red:C.txtMid,'center');
  }); lpy+=24;

  txt(ctx,'1920×1080 · H.264 · 60fps',lpad,lpy,"400 7px 'Space Mono',monospace",C.txtDim);

  ctx.restore(); // end panel clip

  // Panel-to-preview divider
  ctx.fillStyle='rgba(255,255,255,0.07)';
  ctx.fillRect(lx+lw+7,L.wy+L.th+12,1,L.ph+10);

  /* ── PREVIEW AREA ────────────────────────────────────────── */
  const {px:PX,py:PY,pw:PW,ph:PH} = L;

  // Tension: very slightly dim surroundings and push in
  const tensionScale = 1 + tensionP*0.018;
  const tensionDX = (W/2-PX-PW/2)*(tensionScale-1);
  const tensionDY = (H/2-PY-PH/2)*(tensionScale-1);

  ctx.save();
  if(tension && tensionP>0){
    ctx.translate(PX+PW/2+tensionDX, PY+PH/2+tensionDY);
    ctx.scale(tensionScale,tensionScale);
    ctx.translate(-(PX+PW/2),-(PY+PH/2));
  }

  // Preview bg
  fillRR(ctx,PX,PY,PW,PH,6,'#090910');

  // Border — tightens on record
  strokeRR(ctx,PX,PY,PW,PH,6,
    isRec?'rgba(255,60,60,0.35)':tension?`rgba(255,255,255,${0.07+tensionP*0.06})`:'rgba(255,255,255,0.07)',
    isRec?1.2:0.8);

  // Impact flash (1500–1650ms)
  if(impactP>0){
    ctx.globalAlpha=impactP*0.18;
    ctx.fillStyle='#FFFFFF';
    rr(ctx,PX,PY,PW,PH,6); ctx.fill();
    ctx.globalAlpha=1;
  }

  // Confirmation sweep glow (1500–1900ms)
  const sweepP = p01(t,1500,1900);
  if(sweepP>0&&sweepP<1){
    const sx=PX+PW*sweepP;
    const sg=ctx.createLinearGradient(sx-80,0,sx+80,0);
    sg.addColorStop(0,'rgba(255,60,60,0)');
    sg.addColorStop(0.5,`rgba(255,60,60,${0.1*(1-Math.abs(sweepP-0.5)*1.8)})`);
    sg.addColorStop(1,'rgba(255,60,60,0)');
    ctx.fillStyle=sg; rr(ctx,PX,PY,PW,PH,6); ctx.fill();
  }

  // ── PREVIEW CONTENT ──────────────────────────────────────
  ctx.save(); rr(ctx,PX,PY,PW,PH,6); ctx.clip();
  drawPreviewContent(ctx,t,PX,PY,PW,PH,isRec,isOut,showModal,seed);
  ctx.restore();

  // Recording frame corners
  if(isRec){
    const bLen=14;
    ctx.strokeStyle=C.red; ctx.lineWidth=1.8;
    [[PX+5,PY+5,1,1],[PX+PW-5,PY+5,-1,1],[PX+5,PY+PH-5,1,-1],[PX+PW-5,PY+PH-5,-1,-1]].forEach(
      ([bx,by,sx,sy])=>{
        ctx.beginPath();
        ctx.moveTo(bx as number,(by as number)+(sy as number)*bLen);
        ctx.lineTo(bx as number,by as number);
        ctx.lineTo((bx as number)+(sx as number)*bLen,by as number);
        ctx.stroke();
      }
    );
  }

  // Rec dot (top-left of preview)
  if(isRec){
    const dp=0.55+Math.sin(t/550)*0.45;
    // Outer glow
    ctx.save();
    ctx.globalAlpha=dp*0.4;
    const dg=ctx.createRadialGradient(PX+18,PY+18,0,PX+18,PY+18,18);
    dg.addColorStop(0,C.red); dg.addColorStop(1,'transparent');
    ctx.fillStyle=dg; ctx.beginPath(); ctx.arc(PX+18,PY+18,18,0,Math.PI*2); ctx.fill();
    ctx.restore();
    // Sharp entry pulse (first 200ms)
    if(recP<1){
      ctx.save();
      ctx.globalAlpha=(1-recP)*0.7;
      ctx.strokeStyle=C.red; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.arc(PX+18,PY+18,6+(1-recP)*20,0,Math.PI*2); ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha=dp; circ(ctx,PX+18,PY+18,5.5,C.red); ctx.globalAlpha=1;
  }

  ctx.restore(); // tension transform

  /* ── WEBCAM PIP ──────────────────────────────────────────── */
  const {camX:CX,camY:CY,camW:CW,camH:CH}=L;
  const camHoverA = t>=3800&&t<4600 ? E.inOut(p01(t,3800,4100)) : 0;

  // Depth: webcam floats slightly in front (parallax opposite direction)
  const camPX = CX - pxOff*0.5;
  const camPY = CY - pyOff*0.5;

  ctx.save();
  ctx.shadowColor=isRec?`rgba(255,60,60,${0.18+camHoverA*0.25})`:'rgba(0,0,0,0.5)';
  ctx.shadowBlur=isRec?20:12; ctx.shadowOffsetY=4;
  fillRR(ctx,camPX,camPY,CW,CH,6,'#090910');
  ctx.restore();
  strokeRR(ctx,camPX,camPY,CW,CH,6,
    camHoverA>0?`rgba(255,60,60,${0.3+camHoverA*0.4})`:
    isRec?'rgba(255,60,60,0.4)':'rgba(255,255,255,0.12)',
    camHoverA>0?1.5:1);

  ctx.save(); rr(ctx,camPX,camPY,CW,CH,6); ctx.clip();
  drawWebcam(ctx,camPX,camPY,CW,CH,t,isRec,camHoverA);
  ctx.restore();

  // CAM label
  txt(ctx,'CAM',camPX+7,camPY+11,"700 6.5px 'Space Mono',monospace",C.txtDim);
  // Live dot
  if(isRec){
    const lp=0.55+Math.sin(t/550)*0.45;
    ctx.globalAlpha=lp; circ(ctx,camPX+CW-9,camPY+9,3.5,C.red); ctx.globalAlpha=1;
  }

  /* ── BOTTOM BAR ──────────────────────────────────────────── */
  const {bty:BTY,ctrlY:CY2,tlY:TLY}=L;
  ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.fillRect(L.wx,BTY,L.ww,1);
  fillRR(ctx,L.wx,BTY+1,L.ww,L.wh-(BTY-L.wy)-1,0,C.surface);

  // Timeline
  const tlX=L.wx+14, tlY=TLY, tlW=L.ww-28, tlH=3;
  fillRR(ctx,tlX,tlY,tlW,tlH,1.5,C.surfaceAlt);
  if(tlPct>0){
    const tg=ctx.createLinearGradient(tlX,0,tlX+tlW,0);
    tg.addColorStop(0,C.red); tg.addColorStop(1,'#FF6868');
    ctx.fillStyle=tg; rr(ctx,tlX,tlY,tlW*tlPct,tlH,1.5); ctx.fill();
    // Playhead
    const phX=tlX+tlW*tlPct;
    ctx.save(); ctx.shadowColor=C.redGlow; ctx.shadowBlur=8;
    circ(ctx,phX,tlY+tlH/2,5,C.red); ctx.restore();
  }
  // Ticks
  for(let i=0;i<=24;i++){
    const tx=tlX+(i/24)*tlW;
    ctx.fillStyle=C.txtDim; ctx.globalAlpha=0.5;
    ctx.fillRect(tx,tlY-(i%6===0?2:0),0.5,i%6===0?tlH+4:tlH+2);
  }
  ctx.globalAlpha=1;

  // Timer left of timeline
  if(isRec||isOut){
    const mm=String(Math.floor(recSecs/60)).padStart(2,'0');
    const ss=String(Math.floor(recSecs%60)).padStart(2,'0');
    txt(ctx,`${mm}:${ss}`,tlX,TLY+20,"400 8px 'Space Mono',monospace",C.txtDim);
  }

  // Controls — keep record button centered, stop button slides in to the right
  const showStop = isRec;
  const wCenterX = L.wx + L.ww/2;
  // When alone: record at center. When with stop: pair is centered as unit.
  // Pair width: 44 (rec) + 8 (gap) + 44 (stop) = 96. Each center offset = 48/2 = 24 from pair center.
  const pairOffset = showStop ? 24 : 0; // how far each button shifts from center
  const recBtnX  = wCenterX - pairOffset;
  const recBtnHoverA = t>=800&&t<1500 ? E.inOut(p01(t,800,1300)) : 0;

  // Record button — breathing glow in idle
  {
    const breathe = idle ? 0.7+Math.sin(t/1200)*0.3 : 1;
    ctx.save();
    if(!isRec){
      // Breathing halo
      ctx.globalAlpha=(idle?0.18:0.08)*breathe + recBtnHoverA*0.2;
      const bg=ctx.createRadialGradient(recBtnX,CY2,0,recBtnX,CY2,28);
      bg.addColorStop(0,C.red); bg.addColorStop(1,'transparent');
      ctx.fillStyle=bg; ctx.beginPath(); ctx.arc(recBtnX,CY2,28,0,Math.PI*2); ctx.fill();
    } else {
      ctx.shadowColor=C.redGlow; ctx.shadowBlur=18;
    }
    const btnR = idle ? 13*(0.95+breathe*0.05) : isRec ? 11 : 12;
    fillRR(ctx,recBtnX-22,CY2-11,44,22,11,
      isRec?C.redSoft:`rgba(255,255,255,${0.03+recBtnHoverA*0.06})`);
    strokeRR(ctx,recBtnX-22,CY2-11,44,22,11,
      isRec?'rgba(255,60,60,0.5)':`rgba(255,255,255,${0.1+recBtnHoverA*0.18})`,1);
    if(isRec){
      fillRR(ctx,recBtnX-6,CY2-6,12,12,2,C.red);
    } else if(isOut){
      circ(ctx,recBtnX,CY2,6,C.txtDim);
    } else {
      ctx.shadowColor=`rgba(255,60,60,${0.4+recBtnHoverA*0.4+breathe*0.15})`; ctx.shadowBlur=recBtnHoverA>0?12:8;
      circ(ctx,recBtnX,CY2,7*breathe,C.red);
    }
    ctx.restore();
  }

  // Stop button
  if(showStop){
    const stopX=wCenterX+pairOffset+4; // +4 for the gap between buttons
    const stopHoverA=t>=5400&&t<6100?E.inOut(p01(t,5400,5800)):0;
    ctx.save();
    if(stopHoverA>0){ ctx.shadowColor=`rgba(255,60,60,${stopHoverA*0.4})`; ctx.shadowBlur=10; }
    fillRR(ctx,stopX-20,CY2-11,44,22,4,`rgba(255,60,60,${0.08+stopHoverA*0.1})`);
    strokeRR(ctx,stopX-20,CY2-11,44,22,4,`rgba(255,60,60,${0.22+stopHoverA*0.35})`,0.9);
    txt(ctx,'STOP',stopX,CY2+4,"600 8.5px 'Space Mono',monospace",
      `rgba(255,60,60,${0.65+stopHoverA*0.35})`,'center');
    ctx.restore();
  }

  /* ── OUTPUT CARD ─────────────────────────────────────────── */
  if(isOut&&outP>0){
    ctx.save(); ctx.globalAlpha=outP;
    rr(ctx,PX,PY,PW,PH,6); ctx.clip();
    drawOutputCard(ctx,PX,PY,PW,PH,t,outP);
    ctx.restore();
  }

  /* ── GRAIN TEXTURE (idle aliveness) ─────────────────────── */
  if(idle&&t<1400){
    const ga=0.012*(1-tensionP);
    ctx.save(); ctx.globalAlpha=ga;
    for(let i=0;i<200;i++){
      const gx=(seed*i*137.5+t*0.3)%W;
      const gy=(seed*i*97.3+t*0.2)%H;
      ctx.fillStyle=Math.random()>0.5?'#fff':'#000';
      ctx.fillRect(gx,gy,1,1);
    }
    ctx.restore();
  }

  /* ── CURSOR ──────────────────────────────────────────────── */
  const alpha=cl(p01(t,150,600),0,1);
  const clickR=getClickRipple(t);
  drawCursor(ctx,cur[0],cur[1],alpha,clickR);
}

/* ═══════════════════════════════════════════════════════════════════════
   PREVIEW CONTENT — real UI inside the preview area
   ═══════════════════════════════════════════════════════════════════════ */
function drawPreviewContent(
  ctx: CanvasRenderingContext2D,
  t: number, PX: number, PY: number, PW: number, PH: number,
  isRec: boolean, isOut: boolean, showModal: boolean, seed: number,
){
  if(isOut) return; // output card handles this

  const cx=PX+12, cw=PW-24;
  const activeA = isRec ? 1 : 0.38;

  // Top nav bar — simulated web app
  ctx.globalAlpha=activeA;
  fillRR(ctx,cx,PY+10,cw,20,3,'rgba(255,255,255,0.04)');
  strokeRR(ctx,cx,PY+10,cw,20,3,'rgba(255,255,255,0.06)',0.5);
  // Logo placeholder
  fillRR(ctx,cx+8,PY+16,32,8,2,isRec?'rgba(255,60,60,0.25)':'rgba(255,255,255,0.1)');
  // Nav items
  [0.22,0.32,0.42,0.52].forEach(xr=>{
    fillRR(ctx,cx+cw*xr,PY+16,cw*0.07,8,2,'rgba(255,255,255,0.07)');
  });
  // CTA button in nav
  fillRR(ctx,cx+cw*0.82,PY+14,cw*0.14,12,3,isRec?C.redSoft:'rgba(255,255,255,0.05)');
  strokeRR(ctx,cx+cw*0.82,PY+14,cw*0.14,12,3,isRec?'rgba(255,60,60,0.3)':'rgba(255,255,255,0.08)',0.5);
  ctx.globalAlpha=1;

  // Hero section
  const heroY=PY+38;
  ctx.globalAlpha=activeA*0.9;
  fillRR(ctx,cx,heroY,cw*0.55,12,2,isRec?'rgba(255,60,60,0.2)':'rgba(255,255,255,0.12)');
  ctx.globalAlpha=activeA*0.5;
  fillRR(ctx,cx,heroY+16,cw*0.42,7,1.5,'rgba(255,255,255,0.07)');
  fillRR(ctx,cx,heroY+27,cw*0.35,7,1.5,'rgba(255,255,255,0.05)');
  ctx.globalAlpha=activeA*0.6;
  fillRR(ctx,cx,heroY+40,cw*0.18,18,4,isRec?C.redSoft:'rgba(255,255,255,0.06)');
  strokeRR(ctx,cx,heroY+40,cw*0.18,18,4,isRec?'rgba(255,60,60,0.3)':'rgba(255,255,255,0.08)',0.6);
  fillRR(ctx,cx+cw*0.21,heroY+40,cw*0.14,18,4,'rgba(255,255,255,0.03)');
  strokeRR(ctx,cx+cw*0.21,heroY+40,cw*0.14,18,4,'rgba(255,255,255,0.06)',0.5);
  ctx.globalAlpha=1;

  // Content card grid (the hoverable area)
  const cardY=heroY+70;
  const cardH=PH-heroY-72-PY+PY;
  const hoverCard=t>=2000&&t<2900;
  const hA=hoverCard?E.inOut(p01(t,2000,2400))*0.06:0;
  ctx.globalAlpha=activeA;
  fillRR(ctx,cx,cardY,cw,cardH,4,`rgba(74,158,255,${hA+0.025})`);
  strokeRR(ctx,cx,cardY,cw,cardH,4,
    hoverCard?`rgba(74,158,255,${0.12+hA*2})`:
    isRec?'rgba(255,255,255,0.07)':'rgba(255,255,255,0.05)',0.7);

  // Card content
  ctx.globalAlpha=activeA*0.8;
  fillRR(ctx,cx+12,cardY+12,cw*0.48,9,2,'rgba(255,255,255,0.14)');
  [0.80,0.65,0.72,0.55].forEach((w,i)=>{
    fillRR(ctx,cx+12,cardY+26+i*12,cw*w*0.9,5,1.5,'rgba(255,255,255,0.05)');
  });
  // Two cards in a row lower
  fillRR(ctx,cx+12,cardY+82,cw*0.42,28,3,'rgba(255,255,255,0.03)');
  strokeRR(ctx,cx+12,cardY+82,cw*0.42,28,3,'rgba(255,255,255,0.05)',0.5);
  fillRR(ctx,cx+cw*0.47,cardY+82,cw*0.42,28,3,'rgba(255,255,255,0.03)');
  strokeRR(ctx,cx+cw*0.47,cardY+82,cw*0.42,28,3,'rgba(255,255,255,0.05)',0.5);

  // Blinking cursor inside preview (idle aliveness)
  if(!isRec&&!isOut){
    const blinkOn=Math.floor(t/530)%2===0;
    if(blinkOn){
      ctx.globalAlpha=0.35;
      ctx.fillStyle='rgba(255,255,255,0.6)';
      ctx.fillRect(cx+12+cw*0.48+2,cardY+8,1.5,11);
    }
  }
  ctx.globalAlpha=1;

  // Modal
  if(showModal){
    const mfIn=E.out3(p01(t,2900,3150));
    const mfOut=t>=6000?E.out3(p01(t,6000,6100)):0;
    const mf=mfIn*(1-mfOut);
    ctx.globalAlpha=mf;
    drawModal(ctx,PX,PY,PW,PH,t);
    ctx.globalAlpha=1;
  }
}

/* ── Modal panel ────────────────────────────────────────────────────── */
function drawModal(ctx: CanvasRenderingContext2D, PX: number, PY: number, PW: number, PH: number, t: number){
  const mW=PW*0.56, mH=PH*0.72;
  const mX=PX+(PW-mW)/2, mY=PY+(PH-mH)/2-4;

  // Scrim
  ctx.fillStyle='rgba(0,0,0,0.52)'; rr(ctx,PX,PY,PW,PH,6); ctx.fill();

  // Card
  ctx.save();
  ctx.shadowColor='rgba(0,0,0,0.7)'; ctx.shadowBlur=28; ctx.shadowOffsetY=8;
  fillRR(ctx,mX,mY,mW,mH,8,'#15151D');
  ctx.restore();
  strokeRR(ctx,mX,mY,mW,mH,8,'rgba(255,255,255,0.1)',1);

  // Header
  fillRR(ctx,mX,mY,mW,32,8,'rgba(255,255,255,0.025)');
  ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.fillRect(mX,mY+31,mW,1);
  txt(ctx,'✕',mX+12,mY+20,"400 10px 'DM Sans',sans-serif",'rgba(255,255,255,0.3)');
  txt(ctx,'Canvas Settings',mX+mW/2,mY+21,"500 11px 'DM Sans',sans-serif",C.txt,'center');

  const fx=mX+14, fw=mW-28;
  let fy=mY+40;

  const field=(label:string,val:string)=>{
    txt(ctx,label,fx,fy+7,`600 7px 'Space Mono',monospace`,C.txtDim);
    fy+=10;
    fillRR(ctx,fx,fy,fw,22,4,C.surfaceAlt);
    strokeRR(ctx,fx,fy,fw,22,4,'rgba(255,255,255,0.07)',0.7);
    txt(ctx,val,fx+10,fy+15,"400 10px 'DM Sans',sans-serif",C.txtMid);
    fy+=32;
  };
  field('WIDTH','1920 px');
  field('HEIGHT','1080 px');
  field('FRAME RATE','60 fps');

  // Toggle row
  txt(ctx,'CURSOR HIGHLIGHT',fx,fy+7,"600 7px 'Space Mono',monospace",C.txtDim); fy+=10;
  fillRR(ctx,fx,fy,fw,22,4,C.surfaceAlt);
  strokeRR(ctx,fx,fy,fw,22,4,'rgba(255,255,255,0.07)',0.7);
  const tox=fx+fw-52, toy=fy+5;
  fillRR(ctx,tox,toy,30,14,7,C.red); circ(ctx,tox+22,toy+7,5,'#fff');
  txt(ctx,'Enabled',fx+10,fy+15,"400 10px 'DM Sans',sans-serif",C.txtMid);
  fy+=32;

  // Apply btn
  fillRR(ctx,fx,fy,fw,26,5,C.red);
  txt(ctx,'Apply Changes',fx+fw/2,fy+17,"600 10px 'DM Sans',sans-serif",'#fff','center');
}

/* ── Webcam feed ────────────────────────────────────────────────────── */
function drawWebcam(ctx: CanvasRenderingContext2D, cx: number, cy: number, cw: number, ch: number, t: number, isRec: boolean, hoverA: number){
  // Background gradient — very subtle warm tint
  const bg=ctx.createRadialGradient(cx+cw/2,cy+ch*0.38,0,cx+cw/2,cy+ch*0.38,cw*0.55);
  bg.addColorStop(0,isRec?'rgba(255,50,50,0.07)':'rgba(40,40,60,0.8)');
  bg.addColorStop(1,'rgba(5,5,10,0.95)');
  ctx.fillStyle=bg; ctx.fillRect(cx,cy,cw,ch);

  // Subtle movement — head/shoulder silhouette bobs slightly
  const bob=Math.sin(t/1800)*1.2;

  // Face
  ctx.globalAlpha=0.14;
  circ(ctx,cx+cw/2,cy+ch*0.34+bob,cw*0.19,'rgba(220,180,160,0.5)');
  // Shoulders
  ctx.globalAlpha=0.08;
  ctx.beginPath();
  ctx.ellipse(cx+cw/2,cy+ch*0.78+bob,cw*0.32,ch*0.22,0,0,Math.PI*2);
  ctx.fillStyle='rgba(180,160,140,0.4)'; ctx.fill();
  ctx.globalAlpha=1;

  // Live glow edge when recording
  if(isRec||hoverA>0){
    const edgeA=isRec?0.2+Math.sin(t/700)*0.08:hoverA*0.25;
    const eg=ctx.createLinearGradient(cx,cy,cx,cy+ch);
    eg.addColorStop(0,`rgba(255,60,60,${edgeA})`);
    eg.addColorStop(1,`rgba(255,60,60,${edgeA*0.5})`);
    ctx.fillStyle=eg; ctx.fillRect(cx,cy,2,ch);
    ctx.fillRect(cx+cw-2,cy,2,ch);
  }
}

/* ── Output card ────────────────────────────────────────────────────── */
function drawOutputCard(ctx: CanvasRenderingContext2D, PX: number, PY: number, PW: number, PH: number, t: number, outP: number){
  // Darken preview bg
  ctx.globalAlpha=outP*0.97;
  ctx.fillStyle='#090910'; ctx.fillRect(PX,PY,PW,PH);

  const oW=PW*0.76, oH=PH*0.74;
  const oX=PX+(PW-oW)/2, oY=PY+(PH-oH)/2;

  // Card
  ctx.globalAlpha=outP;
  ctx.save();
  ctx.shadowColor='rgba(0,0,0,0.65)'; ctx.shadowBlur=24; ctx.shadowOffsetY=6;
  fillRR(ctx,oX,oY,oW,oH,8,'#141420');
  ctx.restore();
  strokeRR(ctx,oX,oY,oW,oH,8,'rgba(255,255,255,0.09)',1);

  // Thumbnail
  const thW=oW*0.38, thH=oH-28;
  fillRR(ctx,oX+10,oY+10,thW,thH,5,'#0A0A14');
  ctx.save(); rr(ctx,oX+10,oY+10,thW,thH,5); ctx.clip();
  // Mini preview content
  ctx.globalAlpha=0.35;
  fillRR(ctx,oX+14,oY+18,thW*0.6,8,2,C.redSoft);
  [0.9,0.7,0.8,0.5].forEach((w,i)=>{
    fillRR(ctx,oX+14,oY+30+i*10,thW*w*0.9,4,1,`rgba(255,255,255,${0.04+i*0.01})`);
  });
  fillRR(ctx,oX+14,oY+72,thW*0.44,22,3,'rgba(255,255,255,0.04)');
  fillRR(ctx,oX+14+thW*0.49,oY+72,thW*0.44,22,3,'rgba(255,255,255,0.04)');
  ctx.globalAlpha=1;
  // Play icon
  ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(oX+10,oY+10,thW,thH);
  const pCX=oX+10+thW/2, pCY=oY+10+thH/2;
  circ(ctx,pCX,pCY,14,'rgba(255,255,255,0.12)');
  ctx.fillStyle='rgba(255,255,255,0.8)';
  ctx.beginPath(); ctx.moveTo(pCX-5,pCY-7); ctx.lineTo(pCX+9,pCY); ctx.lineTo(pCX-5,pCY+7); ctx.closePath(); ctx.fill();
  ctx.restore();

  // Info
  const rx=oX+thW+18, rw=oW-thW-26;
  let  ry=oY+16;

  // Check badge
  fillRR(ctx,rx,ry,20,20,10,C.greenSoft);
  strokeRR(ctx,rx,ry,20,20,10,'rgba(61,214,140,0.3)',0.8);
  ctx.strokeStyle=C.green; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(rx+5,ry+10); ctx.lineTo(rx+9,ry+14); ctx.lineTo(rx+16,ry+6); ctx.stroke();
  ry+=28;

  txt(ctx,'Video ready',rx,ry,"600 13px 'DM Sans',sans-serif",C.txt); ry+=18;
  txt(ctx,'demo-recording.mp4',rx,ry,"400 9px 'Space Mono',monospace",C.txtMid); ry+=13;
  txt(ctx,'00:04  ·  1080p  ·  60fps  ·  H.264',rx,ry,"400 7.5px 'Space Mono',monospace",C.txtDim); ry+=24;

  // Buttons
  const btnHoverA=t>=6800&&t<7600?E.inOut(p01(t,6800,7100)):0;
  const btnW2=(rw-8)/2;

  // Preview
  fillRR(ctx,rx,ry,btnW2,24,4,`rgba(74,158,255,${0.1+btnHoverA*0.1})`);
  strokeRR(ctx,rx,ry,btnW2,24,4,`rgba(74,158,255,${0.22+btnHoverA*0.3})`,0.9);
  if(btnHoverA>0){
    ctx.save(); ctx.shadowColor=`rgba(74,158,255,${btnHoverA*0.4})`; ctx.shadowBlur=10;
    strokeRR(ctx,rx,ry,btnW2,24,4,'transparent',0);
    ctx.restore();
  }
  txt(ctx,'▶  Preview',rx+btnW2/2,ry+16,"600 8.5px 'Space Mono',monospace",
    `rgba(74,158,255,${0.7+btnHoverA*0.3})`,'center');

  // Export
  fillRR(ctx,rx+btnW2+8,ry,btnW2,24,4,C.redSoft);
  strokeRR(ctx,rx+btnW2+8,ry,btnW2,24,4,'rgba(255,60,60,0.28)',0.9);
  txt(ctx,'↑  Export',rx+btnW2+8+btnW2/2,ry+16,"600 8.5px 'Space Mono',monospace",
    'rgba(255,60,60,0.8)','center');
}

/* ═══════════════════════════════════════════════════════════════════════
   CURSOR CHOREOGRAPHY
   ═══════════════════════════════════════════════════════════════════════ */
function getCursor(t: number): [number,number]{
  const {px:PX,py:PY,pw:PW,ph:PH,bty:BTY} = L;
  const ctrlY = L.ctrlY;
  const wCX   = L.wx+L.ww/2;

  const pts = {
    rest:     [PX+PW*0.72, PY+PH*0.70] as [number,number],
    recBtn:   [wCX, ctrlY]              as [number,number], // centered before recording starts
    card:     [PX+20+(PW-24)*0.38, PY+PH*0.60] as [number,number],
    modal1:   [PX+(PW-PW*0.56)/2+PW*0.56*0.45, PY+(PH-PH*0.72)/2+PH*0.72*0.50] as [number,number],
    modal2:   [PX+(PW-PW*0.56)/2+PW*0.56*0.28, PY+(PH-PH*0.72)/2+PH*0.72*0.74] as [number,number],
    cam:      [L.camX+L.camW/2, L.camY+L.camH/2] as [number,number],
    timeline: [PX+PW*0.42, L.tlY+2] as [number,number],
    stopBtn:  [wCX+28, ctrlY]          as [number,number], // pairOffset+4 = 28
    preview:  [PX+(PW-PW*0.76)/2+PW*0.76*0.38+18+(PW*0.76-PW*0.76*0.38-26)*0.23,
               PY+(PH-PH*0.74)/2+PH*0.74*0.68] as [number,number],
  };

  const mv=(f:number,to2:number,from:[number,number],to:[number,number],cp?:[number,number],ef=E.out3):[number,number]=>{
    const p=ef(cl((t-f)/(to2-f)));
    if(cp) return bz(p,from,cp,to);
    return [lerp(from[0],to[0],p),lerp(from[1],to[1],p)];
  };

  if(t<800)  return pts.rest;
  if(t<1500) return mv(800,1480,pts.rest,pts.recBtn,[lerp(pts.rest[0],pts.recBtn[0],0.3)+18,lerp(pts.rest[1],pts.recBtn[1],0.45)-28]);
  if(t<2000){const d=E.out3(p01(t,1500,2000)); return [pts.recBtn[0]+d*3,pts.recBtn[1]+d*2];}
  if(t<2900) return mv(2000,2860,pts.recBtn,pts.card,[lerp(pts.recBtn[0],pts.card[0],0.6)-12,lerp(pts.recBtn[1],pts.card[1],0.3)]);
  if(t<3550) return mv(2900,3500,pts.card,pts.modal1,[lerp(pts.card[0],pts.modal1[0],0.4),lerp(pts.card[1],pts.modal1[1],0.2)-18]);
  if(t<3850) return mv(3550,3830,pts.modal1,pts.modal2,undefined,E.inOut);
  if(t<4650) return mv(3850,4620,pts.modal2,pts.cam,[lerp(pts.modal2[0],pts.cam[0],0.5)+25,lerp(pts.modal2[1],pts.cam[1],0.3)-18]);
  if(t<5450) return mv(4650,5420,pts.cam,pts.timeline,[lerp(pts.cam[0],pts.timeline[0],0.4)-8,lerp(pts.cam[1],pts.timeline[1],0.55)]);
  if(t<6150) return mv(5450,6100,pts.timeline,pts.stopBtn,[lerp(pts.timeline[0],pts.stopBtn[0],0.5)+12,lerp(pts.timeline[1],pts.stopBtn[1],0.4)]);
  if(t<6800){const d=E.out3(p01(t,6100,6800)); return [pts.stopBtn[0]+d*4,pts.stopBtn[1]-d*6];}
  if(t<7600) return mv(6800,7560,pts.stopBtn,pts.preview,[lerp(pts.stopBtn[0],pts.preview[0],0.5)-18,lerp(pts.stopBtn[1],pts.preview[1],0.4)+14]);
  return pts.preview;
}

function getClickRipple(t: number): number{
  for(const ct of [1500,2900,6100]){
    if(t>=ct&&t<ct+260) return E.out3(1-p01(t,ct,ct+260));
  }
  return 0;
}

/* ═══════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */
export default function DemoSimulation(){
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const startRef  = useRef<number>(0);
  const seedRef   = useRef(Math.random()*1000);

  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    canvas.width=W; canvas.height=H;
    const ctx=canvas.getContext('2d')!;

    const loop=(ts:number)=>{
      if(!startRef.current) startRef.current=ts;
      const elapsed=(ts-startRef.current)%DURATION;
      renderFrame(ctx,elapsed,seedRef.current);
      rafRef.current=requestAnimationFrame(loop);
    };
    rafRef.current=requestAnimationFrame(loop);
    return ()=>cancelAnimationFrame(rafRef.current);
  },[]);

  return(
    <section style={{position:'relative',zIndex:1,padding:'6rem 2rem 8rem'}}>
      <div style={{height:1,background:'linear-gradient(90deg,transparent,rgba(255,60,60,0.18),transparent)',marginBottom:'6rem'}}/>
      <div style={{maxWidth:'1200px',margin:'0 auto'}}>

        <motion.div
          initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
          style={{marginBottom:'4rem'}}
        >
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:'0.58rem',letterSpacing:'0.3em',color:'#FF3C3C',textTransform:'uppercase',marginBottom:'1rem'}}>
            INTERACTIVE DEMO
          </div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:'clamp(2rem,4vw,3.5rem)',fontWeight:700,letterSpacing:'-0.03em',lineHeight:1.1,margin:0,color:'#F0EFEA'}}>
            Watch it work.{' '}
            <span style={{fontStyle:'italic',color:'#8A8A9A'}}>End to end.</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
          transition={{duration:0.7}}
        >
          <div style={{
            borderRadius:12, overflow:'hidden',
            boxShadow:'0 40px 100px rgba(0,0,0,0.75), 0 2px 0 rgba(255,255,255,0.055) inset',
          }}>
            <canvas ref={canvasRef} style={{display:'block',width:'100%',height:'auto'}}/>
          </div>

          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:'1.1rem',flexWrap:'wrap',gap:'0.75rem'}}>
            {/* Platform */}
            <div style={{display:'inline-flex',alignItems:'center',gap:'0.9rem',padding:'0.38rem 0.85rem',background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:4}}>
              {[
                {icon:<svg width="11" height="13" viewBox="0 0 13 15" fill="none"><path d="M10.37 7.92c-.02-2.01 1.65-2.97 1.72-3.02-.94-1.37-2.4-1.56-2.91-1.58-1.24-.13-2.43.74-3.06.74-.63 0-1.6-.72-2.63-.7C1.89 3.38.77 4.1.13 5.22c-1.31 2.27-.34 5.63.93 7.47.63.9 1.37 1.92 2.35 1.88.94-.04 1.3-.6 2.44-.6 1.14 0 1.46.6 2.46.58 1.02-.02 1.66-.93 2.28-1.84.73-1.05 1.02-2.08 1.04-2.13-.02-.01-1.99-.77-2.01-3.04v-.62z" fill="#6A6A82"/><path d="M8.57 1.64C9.07.99 9.41.1 9.31-.8 8.55-.75 7.63-.27 7.11.39 6.64.98 6.23 1.9 6.35 2.8c.87.07 1.77-.42 2.22-1.16z" fill="#6A6A82"/></svg>,label:'macOS'},
                {icon:<svg width="11" height="11" viewBox="0 0 13 13" fill="none"><path d="M0 1.76L5.3 1.02v5.1H0V1.76zM5.3 6.88H0v3.36L5.3 11.98V6.88zM5.96 0.93L13 0v6.12H5.96V0.93zM13 6.88v6.12L5.96 12.07V6.88H13z" fill="#6A6A82"/></svg>,label:'Windows'},
              ].map((p,i)=>(
                <span key={i} style={{display:'inline-flex',alignItems:'center',gap:'0.35rem',opacity:0.55}}>
                  {p.icon}
                  <span style={{fontFamily:"'Space Mono',monospace",fontSize:'0.45rem',letterSpacing:'0.12em',color:'#6A6A82'}}>{p.label}</span>
                  {i===0&&<span style={{width:1,height:12,background:'rgba(255,255,255,0.07)',marginLeft:'0.5rem'}}/>}
                </span>
              ))}
            </div>
            <span style={{fontFamily:"'Space Mono',monospace",fontSize:'0.47rem',letterSpacing:'0.1em',color:'#3A3A52'}}>
              OPEN → RECORD → EXPORT — 8s
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
