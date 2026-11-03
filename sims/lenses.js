(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,FONT,axes,legend,rng}=BioLab.h;

/* ======================================================================
   Mirrors and lenses. Thin-lens / mirror equation 1/f = 1/dₒ + 1/dᵢ,
   m = −dᵢ/dₒ, with paraxial principal rays. Real-is-positive signs.
   ====================================================================== */
const PPC=6, VPC=12, AY=228;                         // 6 px/cm along the axis; heights drawn 2× (12 px/cm)                                   // 6 px per cm; optical axis
const LX=430, MX=570;                                  // lens and mirror positions
const MYST_F=18;
const ELS={conv:'Converging lens',div:'Diverging lens',concave:'Concave mirror',convex:'Convex mirror',plane:'Plane mirror',myst:'Mystery lens'};
const isMirror=p=>p.el==='concave'||p.el==='convex'||p.el==='plane';
const EX=p=>isMirror(p)?MX:LX;
function fEff(p){if(p.el==='plane')return Infinity;if(p.el==='myst')return MYST_F;return (p.el==='div'||p.el==='convex')?-p.f:p.f;}
function image(p){const f=fEff(p),dO=p.dobj;let di;
  if(!Number.isFinite(f))di=-dO;else{const q=1/f-1/dO;di=Math.abs(q)<1e-6?NaN:1/q;}
  const m=Number.isFinite(di)?-di/dO:NaN;return {f,di,m,real:di>0,h:m*p.h};}
function imgX(p,di){return isMirror(p)?EX(p)-di*PPC:EX(p)+di*PPC;}
function typeText(im){if(!Number.isFinite(im.di))return 'No image (rays leave parallel)';
  const a=Math.abs(im.m);return (im.real?'Real':'Virtual')+', '+(im.m<0?'inverted':'upright')+', '+(Math.abs(a-1)<0.02?'same size':a>1?'larger':'smaller');}
const SCENES={magnifier:{label:'Magnifying glass',v:{el:'conv',f:12,dobj:7}},camera:{label:'Camera or eye',v:{el:'conv',f:6,dobj:55}},projector:{label:'Projector',v:{el:'conv',f:10,dobj:12}},makeup:{label:'Makeup mirror',v:{el:'concave',f:20,dobj:10}},car:{label:'Car side mirror',v:{el:'convex',f:20,dobj:45}}};
function scene(sim,k){const sc=SCENES[k];const v=Object.assign({},sc.v);if(k==='camera'||k==='projector'){const q=1/v.f-1/v.dobj;v.screen=true;v.scr=Math.round(clamp(1/q,3,60)*2)/2;}BioLab.setValues(sim,v);sim.st.scene=k;}
function sceneOn(sim){const k=sim.st.scene;if(!k)return null;const v=SCENES[k].v;for(const id in v)if(sim.p[id]!==v[id])return null;return SCENES[k].label;}

/* ---------- Virtual lab bench: Physics Lab 8B, Plane Mirrors (Virtual lab mode; see VLAB.md) ----------
   A top-down corkboard with a sheet of paper. Paper coordinates are in cm: u runs across the paper (0 at the
   middle of the mirror), v runs out from the mirror line (+ in front of the mirror, − behind it).
   The student sticks pins, chooses an eye position on the edge of the paper, and lines pins up with the image of A
   in a magnified view along the sight line. Each pin lands within about 1 mm of where it is aimed (seeded by the
   lab's saved seed and the placement count, so a reload never moves a pin). Checks compare entries with the
   geometry of the student's own pins and drawn rays. */
const PM={S:18,X0:12,T0:50,W:27.9,BACK:8,FRONT:13.6,ML:7.5,R:5,RL:20,RW:2.4,PINW:0.1,HEAD:0.125,SIG:0.03,EU:13.4,EV:13.2,Z:1500,ZV:480,EXT:20,NT:5};
const PMX=PM.X0+PM.W/2*PM.S,PMY=PM.T0+PM.BACK*PM.S;
const PMT={X:u=>PMX+u*PM.S,Y:v=>PMY+v*PM.S,s:PM.S};
const PM_PINS=['A','B','C','D','E'],PM_COL={A:'#d8432f',B:'#2f6fd6',C:'#2f6fd6',D:'#16915a',E:'#16915a'};
const PM_TRAY={A:[352,30],B:[386,30],C:[420,30],D:[454,30],E:[488,30]};
const PM_TH1=[15,25,35,45,55],PM_TH2=[35,40,30,35,30];
const PM_PANEL={x:526,y:8,w:266,h:434};
let PM_SEED=1;
function pmHr(seed,a,b){let h=(seed^Math.imul(a+1,0x9E3779B1)^Math.imul(b+7,0x85EBCA77))|0;h=Math.imul(h^h>>>16,0x7feb352d);h=Math.imul(h^h>>>15,0x846ca68b);h^=h>>>16;return (h>>>0)/4294967296;}
function pmHn(seed,a,b){const u=Math.max(1e-9,pmHr(seed,a,b)),w=pmHr(seed,a,b+100003);return Math.sqrt(-2*Math.log(u))*Math.cos(6.2831853*w);}
const r4=x=>Math.round(x*1e4)/1e4,pmD=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]),DEG=180/Math.PI;
const pmB=sim=>sim&&sim.vlab&&sim.vlab.lab.id==='planemirrors'&&sim.st&&sim.st.B&&sim.st.B.kind==='pm'?sim.st.B:null;
function pmRec(sim,k){const b=sim.vlab.bench;if(!Array.isArray(b.trials))b.trials=[];
  if(!b.trials[k])b.trials[k]={pins:{},n:{},mirror:true,ray1:false,inc:false,normal:false,ray2:false,ext:false,eye1:null,eye2:null,prot:null,ruler:null};return b.trials[k];}
const pmCur=sim=>{const b=sim.vlab&&sim.vlab.bench;return b&&b.tr>=0?pmRec(sim,b.tr):null;};
const pmGet=(sim,k)=>((sim.vlab&&sim.vlab.bench.trials)||[])[k]||null;
/* ---- geometry, all from the student's own pins ---- */
function pmLine(p,q){if(!p||!q||pmD(p,q)<0.3)return null;const near=p[1]<=q[1]?p:q,far=near===p?q:p,dv=far[1]-near[1];if(dv<1e-3)return null;
  const t=near[1]/dv,P=[near[0]-(far[0]-near[0])*t,0];return {near,far,P,th:Math.atan2(Math.abs(far[0]-near[0]),dv)*DEG};}
function pmCross(l1,l2){const p=l1.near,r=[l1.far[0]-p[0],l1.far[1]-p[1]],q=l2.near,s=[l2.far[0]-q[0],l2.far[1]-q[1]],den=r[0]*s[1]-r[1]*s[0];
  if(Math.abs(den)<1e-6)return null;const t=((q[0]-p[0])*s[1]-(q[1]-p[1])*s[0])/den;return [p[0]+t*r[0],p[1]+t*r[1]];}
function pmGeom(rec){const A=rec.pins.A,l1=pmLine(rec.pins.B,rec.pins.C),l2=pmLine(rec.pins.D,rec.pins.E),g={A,l1,l2};
  if(l1){g.P1=l1.P;g.tr=l1.th;if(A)g.ti=Math.atan2(Math.abs(A[0]-l1.P[0]),A[1])*DEG;}
  if(l2)g.P2=l2.P;if(A)g.d=A[1];
  if(l1&&l2){const u=(l)=>{const L=pmD(l.near,l.far);return [(l.far[0]-l.near[0])/L,(l.far[1]-l.near[1])/L];},a=u(l1),b=u(l2);g.cross=Math.acos(Math.min(1,Math.abs(a[0]*b[0]+a[1]*b[1])))*DEG;
    g.Ai=pmCross(l1,l2);if(g.Ai)g.dp=-g.Ai[1];}
  return g;}
/* what the eye sees along a sight line: angles measured from the direction to the image of A */
function pmView(rec,w){const e0=rec['eye'+w],A=rec.pins.A;if(!e0||!A)return null;const Ai=[A[0],-A[1]],L0=pmD(e0,Ai);if(L0<1)return null;
  // the eye icon marks the direction you look from; your eye itself is about 20 cm farther back along the same line
  const eye=[e0[0]+(e0[0]-Ai[0])/L0*PM.EXT,e0[1]+(e0[1]-Ai[1])/L0*PM.EXT],L=L0+PM.EXT;
  const D=[(Ai[0]-eye[0])/L,(Ai[1]-eye[1])/L],R=[-D[1],D[0]];
  const ang=p=>{const x=p[0]-eye[0],y=p[1]-eye[1],f=x*D[0]+y*D[1];return {a:Math.atan2(x*R[0]+y*R[1],f),r:Math.hypot(x,y),f};};
  const t=eye[1]/(eye[1]-Ai[1]),X=[eye[0]+(Ai[0]-eye[0])*t,0],rm=pmD(eye,X),inM=Math.abs(X[0])<=PM.ML-0.15;
  const keys=w===1?['B','C']:['D','E'],wi=PM.PINW/L;
  const pins=keys.map(k=>{const p=rec.pins[k];if(!p)return {k,p:null};const o=ang(p);o.k=k;o.p=p;o.w=PM.PINW/o.r;o.front=o.f>0.5&&o.r<rm-0.2;o.on=o.front&&Math.abs(o.a)<(o.w+wi)/2;return o;});
  const both=!!(pins[0].p&&pins[1].p),sep=both?pmD(pins[0].p,pins[1].p):0;
  const ok=inM&&both&&pins[0].on&&pins[1].on&&Math.abs(pins[0].a-pins[1].a)<(pins[0].w+pins[1].w)/2;
  return {eye,e0,Ai,D,R,ang,X,rm,L,inM,pins,wi,ok,both,sep,keys};}
/* the eye sits on the edge of the paper: left side, front edge or right side */
function pmBorder(p){const c=[[-PM.EU,clamp(p[1],1.5,PM.EV)],[clamp(p[0],-PM.EU,PM.EU),PM.EV],[PM.EU,clamp(p[1],1.5,PM.EV)]];let best=c[0],bd=1e9;c.forEach(q=>{const d=pmD(p,q);if(d<bd){bd=d;best=q;}});return best.map(r4);}
function pmEyeDefault(A,side,th){const s=side==='R'?1:-1,Ai=[A[0],-A[1]];th=Math.min(th,Math.atan(Math.max(0.3,(6-s*A[0]))/A[1])*DEG);const t=th/DEG,dir=[s*Math.sin(t),Math.cos(t)];
  let p=[s*PM.EU,Ai[1]+(s*PM.EU-Ai[0])/dir[0]*dir[1]];if(p[1]>PM.EV)p=[Ai[0]+(PM.EV-Ai[1])/dir[1]*dir[0],PM.EV];return pmBorder(p);}
const pmSideOf=(rec,w)=>{const e=rec['eye'+w],A=rec.pins.A;return e&&A?(e[0]<A[0]?'L':'R'):null;};
/* sticking pins: about 1 mm of scatter around the aim point */
const pmClampPin=p=>[clamp(p[0],-13.6,13.6),clamp(p[1],0.35,13.4)];
function pmStick(sim,key,p,sig){const b=sim.vlab.bench,k=b.tr,rec=pmRec(sim,k),n=(rec.n[key]||0)+1,i=PM_PINS.indexOf(key),s=sim.vlab.seed;rec.n[key]=n;
  sig=sig===undefined?PM.SIG:sig;rec.pins[key]=pmClampPin([p[0]+sig*pmHn(s,k*10+i,n),p[1]+sig*pmHn(s,k*10+i+5,n)]).map(r4);}
const pmProtClamp=q=>[clamp(q[0],-13.9,13.9),clamp(q[1],-2,12)].map(r4),pmRulerClamp=q=>[clamp(q[0],-13.9,13.9-PM.RW),clamp(q[1],-8.5,1)].map(r4);
function pmSnap(rec){const g=pmGeom(rec);[g.P1,g.P2].forEach(P=>{if(P&&rec.prot&&pmD(P,rec.prot)<0.25)rec.prot=[r4(P[0]),0];});}
function pmEyeW(sim){return sim.vlab.bench.ph==='S2'?2:1;}
function pmCan(sim,item){const b=sim.vlab&&sim.vlab.bench,rec=pmCur(sim);if(!rec)return false;
  switch(b.ph){case 'A':return item==='A';case 'S1':return rec.mirror&&(item==='B'||item==='C'||item==='eye');case 'S2':return rec.mirror&&(item==='D'||item==='E'||item==='eye');
    case 'meas':return (item==='prot'&&!!rec.prot)||(item==='ruler'&&!!rec.ruler);}return false;}
/* first keyboard press on a pin still in the box: put it on the paper near (not on) the sight line */
function pmKeyStart(rec,key){if(key==='A')return [0,5];const w=key==='B'||key==='C'?1:2,V=pmView(rec,w);
  if(!V)return w===1?(key==='B'?[-4,4]:[-8,8]):(key==='D'?[4,4]:[8,8]);const f=key==='B'||key==='D'?0.6:0.25,o=key==='B'||key==='D'?0.8:-0.9;
  return [V.e0[0]+(V.X[0]-V.e0[0])*f+V.R[0]*o,V.e0[1]+(V.X[1]-V.e0[1])*f+V.R[1]*o];}
function pmMove(sim,du,dv){if(!pmB(sim))return;const it=sim.p.pmPin,st=+sim.p.pmStep||0.05;if(!pmCan(sim,it))return;const rec=pmCur(sim);du*=st;dv*=st;
  if(PM_PINS.includes(it)){if(!rec.pins[it]){pmStick(sim,it,pmKeyStart(rec,it),0);return;}const p=rec.pins[it];pmStick(sim,it,[p[0]+du,p[1]+dv],PM.SIG/2);}
  else if(it==='eye'){const w=pmEyeW(sim),e=rec['eye'+w];if(!e)return;
    // along the edge the eye is on: up/down on the sides, left/right on the front edge
    const side=Math.abs(Math.abs(e[0])-PM.EU)<1e-3&&e[1]<PM.EV-1e-3;rec['eye'+w]=pmBorder(side?[e[0],e[1]+dv+(e[0]<0?-du:du)]:[e[0]+du,e[1]+dv]);}
  else if(it==='prot'){rec.prot=pmProtClamp([rec.prot[0]+du,rec.prot[1]+dv]);pmSnap(rec);}
  else if(it==='ruler')rec.ruler=pmRulerClamp([rec.ruler[0]+du,rec.ruler[1]+dv]);}
/* ---- instrument readings (what the protractor and ruler show) ---- */
function pmCircle(Q,p0,p1,S){const d=[p1[0]-p0[0],p1[1]-p0[1]],f=[p0[0]-Q[0],p0[1]-Q[1]],a=d[0]*d[0]+d[1]*d[1],b=2*(f[0]*d[0]+f[1]*d[1]),c=f[0]*f[0]+f[1]*f[1]-PM.R*PM.R,disc=b*b-4*a*c;
  if(a<1e-9||disc<0)return null;let best=null;[-1,1].forEach(sg=>{const t=(-b+sg*Math.sqrt(disc))/(2*a),X=[p0[0]+d[0]*t,p0[1]+d[1]*t];if(X[1]<Q[1]-1e-6)return;if(!best||pmD(X,S)<pmD(best,S))best=X;});
  if(!best)return null;return {X:best,a:Math.atan2(Math.abs(best[0]-Q[0]),best[1]-Q[1])*DEG};}
function pmProtRead(rec,which){const g=pmGeom(rec),Q=rec.prot;if(!Q||!g.l1)return null;
  if(which==='ti'){if(!rec.inc||!g.A)return null;return pmCircle(Q,g.A,g.P1,g.A);}if(!rec.ray1)return null;return pmCircle(Q,g.l1.near,g.l1.far,g.l1.far);}
function pmRulerRead(rec,v){return rec.ruler?v-rec.ruler[1]:NaN;}
/* ---- Juan and Melissa (the room is seeded, so the answer differs between students) ---- */
function pmJuan(seed){const want=pmHr(seed,701,0)<0.5;let last=null;
  for(let i=0;i<600;i++){const u=j=>pmHr(seed,710+j,i),L=[1.5,2,2.5][Math.floor(u(0)*3)],m0=1.5+0.5*Math.floor(u(1)*((5-L)/0.5+1));
    const J=[0.5+0.5*Math.floor(u(2)*15),1+0.5*Math.floor(u(3)*8)],M=[0.5+0.5*Math.floor(u(4)*15),1+0.5*Math.floor(u(5)*8)];if(pmD(J,M)<2.5||Math.abs(J[0]-M[0])<1)continue;
    const xs=J[0]+(M[0]-J[0])*J[1]/(J[1]+M[1]),mg=Math.min(xs-m0,m0+L-xs);last={L,m0,J,M,yes:mg>0};if(want?mg>=0.3:mg<=-0.4)return last;}
  return last;}
const pmM=v=>(Math.round(v*10)/10).toString().replace(/\.0$/,'');
function pmJuanSvg(R){const s=40,ox=20,oy=24,X=x=>ox+x*s,Y=y=>oy+y*s;let g='';
  for(let x=0;x<=8;x++)g+=`<line x1="${X(x)}" y1="${Y(0)}" x2="${X(x)}" y2="${Y(5)}" stroke="currentColor" stroke-opacity=".22" stroke-width="1"/>`;
  for(let y=0;y<=5;y++)g+=`<line x1="${X(0)}" y1="${Y(y)}" x2="${X(8)}" y2="${Y(y)}" stroke="currentColor" stroke-opacity=".22" stroke-width="1"/>`;
  g+=`<rect x="${X(0)}" y="${Y(0)}" width="${8*s}" height="${5*s}" fill="none" stroke="currentColor" stroke-width="2"/>`;
  for(let x=R.m0;x<R.m0+R.L-0.01;x+=0.25)g+=`<line x1="${X(x)}" y1="${Y(0)}" x2="${X(x+0.2)}" y2="${Y(0)-8}" stroke="currentColor" stroke-width="1"/>`;
  g+=`<line x1="${X(R.m0)}" y1="${Y(0)}" x2="${X(R.m0+R.L)}" y2="${Y(0)}" stroke="#4f8fc4" stroke-width="5"/><text x="${X(R.m0+R.L/2)}" y="${Y(0)-11}" text-anchor="middle" font-size="12" fill="currentColor">mirror</text>`;
  [[R.J,'Juan','#2f6fd6'],[R.M,'Melissa','#d8432f']].forEach(([p,n,c])=>{g+=`<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="7" fill="${c}"/><text x="${X(p[0])}" y="${Y(p[1])+21}" text-anchor="middle" font-size="12" font-weight="700" fill="currentColor">${n}</text>`;});
  for(let x=0;x<=8;x+=2)g+=`<text x="${X(x)}" y="${Y(5)+15}" text-anchor="middle" font-size="11" fill="currentColor">${x}</text>`;
  return `<svg viewBox="0 0 360 266" width="360" height="266" role="img" aria-label="Top view of the room: mirror on the top wall, Juan and Melissa" style="max-width:100%;height:auto;display:block;margin:6px 0">${g}<text x="${X(8)}" y="${Y(5)+32}" text-anchor="end" font-size="11" fill="currentColor">x (m) along the wall · 1 square = 1 m</text></svg>`;}
const PM_RAY_SVG=(()=>{const P=[160,44],A=[62,170],B=[258,170],ar=(x0,y0,x1,y1)=>{const a=Math.atan2(y1-y0,x1-x0),m=[(x0+x1)/2,(y0+y1)/2],h=9;return `<polygon points="${m[0]+Math.cos(a)*h},${m[1]+Math.sin(a)*h} ${m[0]+Math.cos(a+2.5)*h},${m[1]+Math.sin(a+2.5)*h} ${m[0]+Math.cos(a-2.5)*h},${m[1]+Math.sin(a-2.5)*h}" fill="currentColor"/>`;};
  const tag=(n,x,y)=>`<circle cx="${x}" cy="${y}" r="10" fill="none" stroke="currentColor" stroke-width="1.5"/><text x="${x}" y="${y+4.5}" text-anchor="middle" font-size="13" font-weight="700" fill="currentColor">${n}</text>`;
  let h='';for(let x=24;x<=292;x+=12)h+=`<line x1="${x}" y1="${P[1]}" x2="${x+8}" y2="${P[1]-9}" stroke="currentColor" stroke-width="1"/>`;
  return `<svg viewBox="0 0 320 196" width="320" height="196" role="img" aria-label="Ray diagram with five numbered parts" style="max-width:100%;height:auto;display:block;margin:6px 0">${h}<line x1="20" y1="${P[1]}" x2="300" y2="${P[1]}" stroke="currentColor" stroke-width="3"/><text x="300" y="${P[1]-14}" text-anchor="end" font-size="12" fill="currentColor">mirror</text>
<line x1="${P[0]}" y1="${P[1]}" x2="${P[0]}" y2="186" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4"/>
<line x1="${A[0]}" y1="${A[1]}" x2="${P[0]}" y2="${P[1]}" stroke="currentColor" stroke-width="2"/>${ar(A[0],A[1],P[0],P[1])}
<line x1="${P[0]}" y1="${P[1]}" x2="${B[0]}" y2="${B[1]}" stroke="currentColor" stroke-width="2"/>${ar(P[0],P[1],B[0],B[1])}
<path d="M160 82 A38 38 0 0 1 136.8 74.1" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M160 82 A38 38 0 0 0 183.2 74.1" fill="none" stroke="currentColor" stroke-width="1.5"/>
${tag(1,86,118)}${tag(2,236,118)}${tag(3,176,176)}${tag(4,132,100)}${tag(5,188,100)}</svg>`;})();
/* ---- drawing ---- */
function pmLn(ctx,x0,y0,x1,y1){ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();}
function pmArrow(ctx,T,p,q,lw){const x0=T.X(p[0]),y0=T.Y(p[1]),x1=T.X(q[0]),y1=T.Y(q[1]),a=Math.atan2(y1-y0,x1-x0),m=[(x0+x1)/2,(y0+y1)/2],h=Math.max(6,lw*4);
  ctx.beginPath();ctx.moveTo(m[0]+Math.cos(a)*h,m[1]+Math.sin(a)*h);ctx.lineTo(m[0]+Math.cos(a+2.55)*h,m[1]+Math.sin(a+2.55)*h);ctx.lineTo(m[0]+Math.cos(a-2.55)*h,m[1]+Math.sin(a-2.55)*h);ctx.closePath();ctx.fill();}
function pmPin(ctx,x,y,r,col,lifted){ctx.save();if(lifted){ctx.fillStyle='rgba(0,0,0,.22)';ctx.beginPath();ctx.arc(x+4,y+5,r,0,6.2832);ctx.fill();}
  ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y,r,0,6.2832);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.45)';ctx.lineWidth=1;ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.arc(x-r*0.32,y-r*0.32,r*0.3,0,6.2832);ctx.fill();ctx.restore();}
function pmProt(ctx,T,Q,k,main){const R=PM.R*T.s,cx=T.X(Q[0]),cy=T.Y(Q[1]);ctx.save();
  ctx.fillStyle='rgba(160,205,245,.32)';ctx.strokeStyle='#2c5f93';ctx.lineWidth=main?1.2:2;ctx.beginPath();ctx.moveTo(cx+R,cy);ctx.arc(cx,cy,R,0,Math.PI,false);ctx.closePath();ctx.fill();ctx.stroke();
  const pxd=R*Math.PI/180,st=pxd>=3.5?1:5;ctx.strokeStyle='#1d3f66';
  for(let a=-90;a<=90;a+=st){const t=Math.PI/2-a/DEG,big=a%10===0,mid=a%5===0,len=(big?0.45:mid?0.3:0.17)*T.s;ctx.lineWidth=main?1:(big?2:1.3);
    pmLn(ctx,cx+Math.cos(t)*R,cy+Math.sin(t)*R,cx+Math.cos(t)*(R-len),cy+Math.sin(t)*(R-len));
    if(big&&(main?a%30===0:true)){const rr2=R-(main?0.95:0.85)*T.s;txt(ctx,String(Math.abs(a)),cx+Math.cos(t)*rr2,cy+Math.sin(t)*rr2,{s:main?Math.min(9.5*k,13):15,w:700,c:'#1d3f66',a:'center',b:'middle'});}}
  ctx.strokeStyle='rgba(29,63,102,.5)';ctx.lineWidth=main?0.8:1.2;ctx.setLineDash([4,4]);pmLn(ctx,cx,cy,cx,cy+R*0.55);ctx.setLineDash([]);
  ctx.strokeStyle='#1d3f66';ctx.lineWidth=main?1:1.6;const c=0.3*T.s;pmLn(ctx,cx-c,cy,cx+c,cy);pmLn(ctx,cx,cy-c*0.3,cx,cy+c);
  if(main)txt(ctx,'protractor',cx,cy+R*0.78,{s:Math.min(11*k,14),c:'#1d3f66',a:'center'});ctx.restore();}
function pmRuler(ctx,T,Rp,k,main){const x0=T.X(Rp[0]),y0=T.Y(Rp[1]),w=PM.RW*T.s,h=PM.RL*T.s;ctx.save();
  ctx.fillStyle='rgba(246,236,186,.86)';ctx.fillRect(x0,y0,w,h);ctx.strokeStyle='#8a7a40';ctx.lineWidth=1.2;ctx.strokeRect(x0,y0,w,h);ctx.strokeStyle='#222';
  const mm=T.s>=30;for(let i=0;i<=PM.RL*10;i++){if(!mm&&i%5)continue;const y=y0+i/10*T.s,len=(i%10===0?0.6:i%5===0?0.42:0.25)*T.s;ctx.lineWidth=main?0.9:(i%10===0?1.8:1.2);pmLn(ctx,x0,y,x0+len,y);
    if(i%10===0&&(main?(i/10)%2===0:true))txt(ctx,String(i/10),x0+(main?0.85:0.68)*T.s,y,{s:main?Math.min(9*k,12):16,w:700,c:'#222',b:'middle'});}
  if(main)txt(ctx,'cm',x0+w-3,y0+11,{s:Math.min(9*k,12),c:'#222',a:'right'});ctx.restore();}
function pmPaper(ctx,T,rec,o){const W=PM.W/2,s=T.s,lw=clamp(0.022*s,1.1,3.4),k=o.k||1,main=!!o.main;
  ctx.fillStyle='#fbfaf4';ctx.fillRect(T.X(-W),T.Y(-PM.BACK),PM.W*s,(PM.BACK+PM.FRONT)*s);
  ctx.strokeStyle='#454545';ctx.lineWidth=lw;pmLn(ctx,T.X(-W+0.6),T.Y(0),T.X(W-0.6),T.Y(0));
  if(main)txt(ctx,'mirror line',T.X(-W+0.8),T.Y(0)-5,{s:Math.min(12*k,15),c:'#555'});
  if(!rec)return;const g=pmGeom(rec),A=g.A,ink='#262626';ctx.strokeStyle=ink;ctx.fillStyle=ink;ctx.lineWidth=lw;
  const ext=(l,P)=>{const L=pmD(P,l.far)||1,u=[(l.far[0]-P[0])/L,(l.far[1]-P[1])/L];return [P,[P[0]+u[0]*(L+2),P[1]+u[1]*(L+2)],u];};
  if(rec.normal&&g.P1){ctx.strokeStyle='#6b6b6b';ctx.setLineDash([5,4]);pmLn(ctx,T.X(g.P1[0]),T.Y(-3),T.X(g.P1[0]),T.Y(6.5));ctx.setLineDash([]);if(main)txt(ctx,'normal',T.X(g.P1[0])+4,T.Y(6.5),{s:Math.min(12*k,15),c:'#555'});ctx.strokeStyle=ink;}
  [[rec.ray1,g.l1,g.P1],[rec.ray2,g.l2,g.P2]].forEach(([on,l,P])=>{if(!on||!l)return;const [p0,p1]=ext(l,P);pmLn(ctx,T.X(p0[0]),T.Y(p0[1]),T.X(p1[0]),T.Y(p1[1]));pmArrow(ctx,T,P,l.near,lw);
    if(rec.ext){const dd=g.Ai?Math.max(2,pmD(P,g.Ai)+1.5):7,L=pmD(P,l.far),u=[(P[0]-l.far[0])/L,(P[1]-l.far[1])/L];ctx.setLineDash([6,5]);pmLn(ctx,T.X(P[0]),T.Y(P[1]),T.X(P[0]+u[0]*dd),T.Y(P[1]+u[1]*dd));ctx.setLineDash([]);}});
  if(rec.inc&&A&&g.P1){const L=pmD(A,g.P1)||1,e=Math.max(L+1,PM.R+1.2),q=[g.P1[0]+(A[0]-g.P1[0])/L*e,g.P1[1]+(A[1]-g.P1[1])/L*e];pmLn(ctx,T.X(q[0]),T.Y(q[1]),T.X(g.P1[0]),T.Y(g.P1[1]));pmArrow(ctx,T,A,g.P1,lw);}
  if(rec.ext&&g.Ai&&rec.ray1&&rec.ray2){const x=T.X(g.Ai[0]),y=T.Y(g.Ai[1]),c=Math.max(5,0.2*s);ctx.lineWidth=lw*1.2;pmLn(ctx,x-c,y-c,x+c,y+c);pmLn(ctx,x-c,y+c,x+c,y-c);txt(ctx,'A′',x+c+3,y-c,{s:main?Math.min(12*k,17):18,w:700,c:ink});}
  if(rec.mirror){const y0=T.Y(-0.55),y1=T.Y(0);ctx.fillStyle='#5b6b78';ctx.fillRect(T.X(-PM.ML),y0,PM.ML*2*s,(y1-y0)*0.45);ctx.fillStyle='#a9cde6';ctx.fillRect(T.X(-PM.ML),y0+(y1-y0)*0.45,PM.ML*2*s,(y1-y0)*0.55);
    ctx.strokeStyle='#33424d';ctx.lineWidth=1;ctx.strokeRect(T.X(-PM.ML),y0,PM.ML*2*s,y1-y0);if(main)txt(ctx,'plane mirror (standing on the line)',T.X(0),y0-6,{s:Math.min(12*k,15),c:'#33424d',a:'center'});}
  if(o.tools&&!rec.mirror){if(rec.prot)pmProt(ctx,T,rec.prot,k,main);if(rec.ruler)pmRuler(ctx,T,rec.ruler,k,main);}
  const drag=o.drag;PM_PINS.forEach(key=>{const p=rec.pins[key];if(!p)return;const x=T.X(p[0]),y=T.Y(p[1]),r=Math.max(main?5:4.5,PM.HEAD*s),lift=drag&&drag.kind==='pin'&&drag.key===key;
    if(o.ring&&o.ring.includes(key)){ctx.strokeStyle='#18a058';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(x,y,r+4,0,6.2832);ctx.stroke();}
    pmPin(ctx,x,y,lift?r*1.3:r,PM_COL[key],lift);if(!main&&s>80){ctx.fillStyle='#111';ctx.beginPath();ctx.arc(x,y,Math.max(1.5,PM.PINW/2*s*0.5),0,6.2832);ctx.fill();}
    txt(ctx,key,x+r+2,y-r-1,{s:main?Math.min(12*k,18):17,w:700,c:'#1a1a1a'});});}
function pmEye(ctx,e,toward,on,k,label){const x=PMT.X(e[0]),y=PMT.Y(e[1]),a=Math.atan2(PMT.Y(toward[1])-y,PMT.X(toward[0])-x);ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.globalAlpha=on?1:0.45;
  ctx.fillStyle='#fff';ctx.strokeStyle='#1a1a1a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-12,0);ctx.quadraticCurveTo(0,-11,12,0);ctx.quadraticCurveTo(0,11,-12,0);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#2b4a6a';ctx.beginPath();ctx.arc(3,0,4.6,0,6.2832);ctx.fill();ctx.fillStyle='#000';ctx.beginPath();ctx.arc(4,0,2,0,6.2832);ctx.fill();ctx.restore();
  if(on)pill(ctx,label,clamp(x,40,PM_PANEL.x-40),y+(e[1]>PM.EV-0.5?-22:20),'#1a1a1a','#fff',Math.min(11*k,16));}
function pmPanelBox(ctx,x,y,w,h,title,k,ok){ctx.fillStyle=PAL['card'];rr(ctx,x,y,w,h,10);ctx.fill();ctx.strokeStyle=ok?PAL['s3']:PAL['line'];ctx.lineWidth=ok?3:1;rr(ctx,x,y,w,h,10);ctx.stroke();
  if(title)txt(ctx,title,x+12,y+20,{s:Math.min(12.5*k,17),w:700,c:PAL['cv-ink']});}
function pmWrap(ctx,s,x,y,maxW,size,c,lh){ctx.font='400 '+size+'px '+FONT;const words=s.split(' ');let line='',yy=y;words.forEach(w=>{const t=line?line+' '+w:w;if(ctx.measureText(t).width>maxW&&line){txt(ctx,line,x,yy,{s:size,c});line=w;yy+=lh;}else line=t;});if(line)txt(ctx,line,x,yy,{s:size,c});return yy+lh;}
function pmDrawView(ctx,rec,w,box,k){const V=pmView(rec,w),ok=!!(V&&V.ok&&rec.mirror);pmPanelBox(ctx,box.x,box.y,box.w,box.h,'Your view along sight line '+w,k,ok);
  const ix=box.x+8,iy=box.y+30,iw=box.w-16,ih=box.h-40,cx=ix+iw/2,hz=iy+ih*0.5,fs=Math.min(12.5*k,17),soft=PAL['cv-soft'];
  if(!rec.mirror){pmWrap(ctx,'The mirror is off the paper. Use your pins and the rays you draw.',ix+6,iy+24,iw-12,fs,soft,fs*1.35);return;}
  if(!V){pmWrap(ctx,rec.pins.A?'Choose where you look from.':'Stick pin A into the paper first.',ix+6,iy+24,iw-12,fs,soft,fs*1.35);return;}
  ctx.save();rr(ctx,ix,iy,iw,ih,6);ctx.clip();ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(ix,iy,iw,ih);
  // the paper surface below the horizon
  ctx.fillStyle='#efece2';ctx.fillRect(ix,hz,iw,ih-(hz-iy));const he=1,hp=3.6,X=a=>cx+a*PM.Z;
  // the mirror, seen from the eye
  const m1=V.ang([-PM.ML,0]),m2=V.ang([PM.ML,0]);if(m1.f>0||m2.f>0){const xa=X(Math.min(m1.a,m2.a)),xb=X(Math.max(m1.a,m2.a)),base=hz+he/V.rm*PM.ZV;
    ctx.fillStyle='rgba(150,195,225,.55)';ctx.fillRect(xa,iy,xb-xa,base-iy);ctx.fillStyle='#5b6b78';ctx.fillRect(xa,base-2,xb-xa,3);}
  const stick=(a,r,col,alpha,lab)=>{const x=X(a),wd=Math.max(1.6,PM.PINW/r*PM.Z),top=hz-(hp-he)/r*PM.ZV,bot=hz+he/r*PM.ZV,rh=Math.max(3.5,wd*1.25);
    if(x<ix-20||x>ix+iw+20)return false;ctx.globalAlpha=alpha;ctx.fillStyle='#9aa1a8';ctx.fillRect(x-wd/2,top,wd,bot-top);ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(x,top,rh,rh,0,0,6.2832);ctx.fill();ctx.globalAlpha=1;
    if(lab){const fl=Math.min(11*k,15);ctx.font='700 '+fl+'px '+FONT;const wl=ctx.measureText(lab).width+6;let ly=bot+fl+2;while(used.some(q=>Math.abs(q[0]-x)<(q[2]+wl)/2&&Math.abs(q[1]-ly)<fl+2))ly+=fl+3;used.push([x,ly,wl]);txt(ctx,lab,x,ly,{s:fl,w:700,c:'#333',a:'center'});}return true;};
  const used=[];const items=[];if(V.inM)items.push({a:0,r:V.L,col:PM_COL.A,al:0.75,lab:'image of A'});V.pins.forEach(o=>{if(o.p&&o.f>0.5)items.push({a:o.a,r:o.r,col:PM_COL[o.k],al:1,lab:o.k,o});});
  items.sort((p,q)=>q.r-p.r);const off=[];items.forEach(it=>{if(!stick(it.a,it.r,it.col,it.al,it.lab))off.push(it);});ctx.restore();
  off.forEach(it=>{const left=it.a<0;txt(ctx,(left?'← ':'')+it.lab+(left?'':' →'),left?ix+6:ix+iw-6,iy+ih-8,{s:Math.min(11*k,15),w:700,c:PAL['cv-ink'],a:left?'left':'right'});});
  if(!V.inM)pmWrap(ctx,'The image of A is not in the mirror from here. Drag the eye along the edge of the paper.',ix+8,iy+18,iw-16,fs,PAL['cv-ink'],fs*1.3);
  else if(ok)pill(ctx,'Lined up within a pin’s width',cx,iy+14,PAL['s3'],'#fff',Math.min(11*k,15));
  txt(ctx,'Magnified sideways. Drag a pin here to fine-tune it.',box.x+12,box.y+box.h-4,{s:Math.min(9.5*k,12),c:soft});}
function pmLoupeSpec(rec,z){const g=pmGeom(rec);
  if(z==='ti'||z==='tr'){if(!rec.prot)return {msg:'Place the protractor first.'};if(z==='tr'&&!rec.ray1)return {c:rec.prot,msg:'Draw the reflected ray first.'};const r=pmProtRead(rec,z);if(!r)return {c:rec.prot,msg:z==='ti'?(rec.inc?'The incident ray does not cross the protractor scale. Move the protractor onto the point of reflection.':'Draw the incident ray first.'):'The reflected ray does not cross the protractor scale. Move the protractor onto the point of reflection.'};
    return {c:r.X,title:'protractor, '+(z==='ti'?'incident ray':'reflected ray')};}
  if(!rec.ruler)return {msg:'Place the ruler first.'};const Ru=rec.ruler[0];
  if(z==='rM')return {c:[Ru+0.2,0],s:110,title:'ruler at the mirror line'};
  if(z==='rA'){if(!g.A)return {msg:'Pin A is not on the paper.'};return {c:[Math.max(Ru+0.2,g.A[0]+0.9),g.A[1]],s:110,title:'ruler at pin A',far:Math.abs(g.A[0]-Ru)>1.2?'Slide the ruler next to pin A to read it.':''};}
  if(!rec.ext||!g.Ai)return {msg:'Extend both rays behind the mirror to find A′ first.'};return {c:[Math.max(Ru+0.2,g.Ai[0]+0.9),g.Ai[1]],s:110,title:'ruler at the image A′',far:Math.abs(g.Ai[0]-Ru)>1.2?'Slide the ruler next to A′ to read it.':''};}
function pmDrawLoupe(ctx,rec,z,box,k){const L=pmLoupeSpec(rec,z);pmPanelBox(ctx,box.x,box.y,box.w,box.h,'Magnified: '+(L.title||'tools'),k,false);
  const ix=box.x+8,iy=box.y+30,iw=box.w-16,ih=box.h-38,fs=Math.min(12.5*k,17);
  if(!L.c){pmWrap(ctx,L.msg,ix+6,iy+24,iw-12,fs,PAL['cv-soft'],fs*1.35);return;}
  const s=L.s||150,T={X:u=>ix+iw/2+(u-L.c[0])*s,Y:v=>iy+ih/2+(v-L.c[1])*s,s};ctx.save();rr(ctx,ix,iy,iw,ih,6);ctx.clip();ctx.fillStyle='#a77b4f';ctx.fillRect(ix,iy,iw,ih);
  pmPaper(ctx,T,rec,{tools:true,k});ctx.restore();ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2;rr(ctx,ix,iy,iw,ih,6);ctx.stroke();
  if(L.msg||L.far){const m=L.msg||L.far;ctx.fillStyle=PAL['card'];ctx.globalAlpha=.92;ctx.fillRect(ix,iy+ih-fs*3.1,iw,fs*3.1);ctx.globalAlpha=1;pmWrap(ctx,m,ix+8,iy+ih-fs*1.9,iw-16,fs,PAL['cv-ink'],fs*1.3);}}
function pmDrawLegend(ctx,sim,rec,box,k){pmPanelBox(ctx,box.x,box.y,box.w,box.h,'On the bench',k,false);const fs=Math.min(12.5*k,17),lh=Math.max(20,fs*1.55);let y=box.y+44;
  const row=(cols,label)=>{cols.forEach((c,i)=>pmPin(ctx,box.x+20+i*13,y-4,5,c,false));pmWrap(ctx,label,box.x+30+cols.length*13,y,box.w-50-cols.length*13,fs,PAL['cv-ink'],fs*1.25);y+=lh;};
  row([PM_COL.A],'A: the object pin');row([PM_COL.B,PM_COL.C],'B, C: sight line 1');row([PM_COL.D,PM_COL.E],'D, E: sight line 2');
  y+=4;pmWrap(ctx,'Drag pins from the pin box, or use Item to move and the Move buttons. Each pin lands within about 1 mm of where you aim.',box.x+12,y,box.w-24,Math.min(10.5*k,14),PAL['cv-soft'],Math.min(10.5*k,14)*1.35);}
function pmDrawJuan(ctx,sim,k){const R=pmJuan(sim.vlab.seed),s=56,ox=40,oy=92,X=x=>ox+x*s,Y=y=>oy+y*s;
  ctx.fillStyle='#fbfaf4';ctx.fillRect(14,14,498,422);txt(ctx,'Top view of a room (1 square = 1 m)',24,40,{s:Math.min(14*k,22),w:700,c:'#1a1a1a'});
  ctx.strokeStyle='#d6d2c4';ctx.lineWidth=1;for(let x=0;x<=8;x++)pmLn(ctx,X(x),Y(0),X(x),Y(5));for(let y=0;y<=5;y++)pmLn(ctx,X(0),Y(y),X(8),Y(y));
  ctx.strokeStyle='#333';ctx.lineWidth=2.5;ctx.strokeRect(X(0),Y(0),8*s,5*s);
  ctx.strokeStyle='#333';ctx.lineWidth=1;for(let x=R.m0;x<R.m0+R.L-0.01;x+=0.25)pmLn(ctx,X(x),Y(0),X(x+0.2),Y(0)-9);ctx.strokeStyle='#4f8fc4';ctx.lineWidth=6;pmLn(ctx,X(R.m0),Y(0),X(R.m0+R.L),Y(0));
  txt(ctx,'mirror',X(R.m0+R.L/2),Y(0)-14,{s:Math.min(12*k,18),w:700,c:'#2b5f8a',a:'center'});
  [[R.J,'Juan','#2f6fd6'],[R.M,'Melissa','#d8432f']].forEach(([p,n,c])=>{pmPin(ctx,X(p[0]),Y(p[1]),9,c,false);txt(ctx,n,X(p[0]),Y(p[1])+26,{s:Math.min(13*k,19),w:700,c:'#1a1a1a',a:'center'});});
  for(let x=0;x<=8;x++)txt(ctx,String(x),X(x),Y(5)+18,{s:Math.min(11*k,15),c:'#555',a:'center'});for(let y=0;y<=5;y++)txt(ctx,String(y),X(0)-8,Y(y)+4,{s:Math.min(11*k,15),c:'#555',a:'right'});
  txt(ctx,'x (m) along the mirror wall',X(4),Y(5)+40,{s:Math.min(11*k,15),c:'#555',a:'center'});
  const b=PM_PANEL;pmPanelBox(ctx,b.x,b.y,b.w,b.h,'Can Juan see Melissa?',k,false);const fs=Math.min(12.5*k,17);
  let y=pmWrap(ctx,'The mirror hangs on the top wall from x = '+pmM(R.m0)+' m to x = '+pmM(R.m0+R.L)+' m.',b.x+12,b.y+46,b.w-24,fs,PAL['cv-ink'],fs*1.35);
  y=pmWrap(ctx,'Juan stands at x = '+pmM(R.J[0])+' m, '+pmM(R.J[1])+' m from the wall. Melissa stands at x = '+pmM(R.M[0])+' m, '+pmM(R.M[1])+' m from the wall.',b.x+12,y+6,b.w-24,fs,PAL['cv-ink'],fs*1.35);
  pmWrap(ctx,'Locate Melissa’s image, then answer question 4 below the bench.',b.x+12,y+6,b.w-24,fs,PAL['cv-soft'],fs*1.35);}
function pmDraw(sim,ctx,vdt,k){const b=sim.vlab.bench,B=sim.st.B,v=sim.vis;
  ctx.fillStyle='#a77b4f';ctx.fillRect(0,0,800,450);if(!v.cork){const g=rng(41);v.cork=[];for(let i=0;i<420;i++)v.cork.push([g()*800,g()*450,0.6+g()*1.6,g()]);}
  v.cork.forEach(c=>{ctx.fillStyle=c[3]<0.5?'rgba(90,58,30,.35)':'rgba(220,180,130,.3)';ctx.fillRect(c[0],c[1],c[2],c[2]);});
  if(b.ph==='juan'){pmDrawJuan(ctx,sim,k);return;}
  const rec=pmCur(sim),n=(b.tr|0)+1,PH={intro:'Plane mirror bench',A:'pin A',S1:'sight line 1',S2:'sight line 2',draw:'draw the rays',meas:'measure',end:'All five trials done'};
  txt(ctx,b.ph==='intro'||b.ph==='end'?PH[b.ph]:'Trial '+n+' of 5 · '+PH[b.ph],16,31,{s:Math.min(15*k,19),w:700,c:'#fff'});
  const V1=rec&&b.ph==='S1'?pmView(rec,1):null,V2=rec&&b.ph==='S2'?pmView(rec,2):null,ring=V1&&V1.ok?['B','C']:V2&&V2.ok?['D','E']:null;
  pmPaper(ctx,PMT,rec,{main:true,k,tools:true,drag:B.drag,ring});
  // pin box
  if(rec&&rec.mirror&&(b.ph==='A'||b.ph==='S1'||b.ph==='S2')){const left=PM_TRAY.A[0]-22;ctx.fillStyle='rgba(40,25,12,.45)';rr(ctx,left,12,PM_TRAY.E[0]+22-left,36,8);ctx.fill();if(k<1.25)txt(ctx,'pin box',left-6,35,{s:Math.min(11*k,15),w:700,c:'#fff',a:'right'});
    PM_PINS.forEach(key=>{if(rec.pins[key])return;const [x,y]=PM_TRAY[key];pmPin(ctx,x,y,7,PM_COL[key],false);txt(ctx,key,x+9,y-6,{s:Math.min(11*k,15),w:700,c:'#fff'});});}
  if(rec&&rec.mirror&&(b.ph==='S1'||b.ph==='S2')&&rec.pins.A){const A=rec.pins.A,Ai=[A[0],-A[1]];[1,2].forEach(w=>{const e=rec['eye'+w];if(e&&(w===1||b.ph==='S2'))pmEye(ctx,e,Ai,(b.ph==='S1')===(w===1),k,'eye '+w);});}
  const P=PM_PANEL,z=sim.p.pmZoom;
  if(rec&&!rec.mirror&&z&&z!=='off')pmDrawLoupe(ctx,rec,z,P,k);
  else if(rec&&(b.ph==='S1'||b.ph==='S2')){pmDrawView(ctx,rec,b.ph==='S1'?1:2,{x:P.x,y:P.y,w:P.w,h:232},k);pmDrawLegend(ctx,sim,rec,{x:P.x,y:P.y+240,w:P.w,h:P.h-240},k);}
  else if(rec&&rec.mirror){pmDrawLegend(ctx,sim,rec,P,k);}
  else{pmPanelBox(ctx,P.x,P.y,P.w,P.h,b.ph==='meas'?'Magnify':b.ph==='end'?'Trial 5 sheet':'The mirror is off',k,false);const fs=Math.min(12.5*k,17);
    pmWrap(ctx,b.ph==='meas'?'Choose what to magnify under Magnify to read the protractor or the ruler up close.':b.ph==='end'?'All five trials are done. Your readings are in the tables below the bench.':'Draw the rays from your pins. The pin holes stay where the pins were.',P.x+12,P.y+48,P.w-24,fs,PAL['cv-ink'],fs*1.35);}}
/* ---- pointer input on the bench (the engine only knows clicks) ---- */
function pmPos(cv,e){const r=cv.getBoundingClientRect();return [(e.clientX-r.left)/r.width*800,(e.clientY-r.top)/r.height*450];}
function pmViewBox(){return {x:PM_PANEL.x+8,y:PM_PANEL.y+30,w:PM_PANEL.w-16,h:232-40};}
function pmHit(sim,x,y){const b=sim.vlab.bench,rec=pmCur(sim);if(!rec)return null;const [u,v]=[(x-PMX)/PM.S,(y-PMY)/PM.S];
  if(rec.mirror&&(b.ph==='S1'||b.ph==='S2')){const vb=pmViewBox();if(x>=vb.x&&x<=vb.x+vb.w&&y>=vb.y&&y<=vb.y+vb.h){const V=pmView(rec,pmEyeW(sim));if(!V)return null;let best=null,bd=16;
      V.pins.forEach(o=>{if(!o.p||o.f<=0.5)return;const dx=Math.abs(vb.x+vb.w/2+o.a*PM.Z-x);if(dx<bd){bd=dx;best=o;}});return best?{kind:'view',key:best.k,x0:x,a0:best.a,r:best.r,eye:V.eye.slice(),th0:Math.atan2(best.p[1]-V.eye[1],best.p[0]-V.eye[0])}:null;}}
  const pins=PM_PINS.filter(key=>pmCan(sim,key));let best=null,bd=20;
  pins.forEach(key=>{const p=rec.pins[key];const q=p?[PMT.X(p[0]),PMT.Y(p[1])]:PM_TRAY[key];const d=Math.hypot(q[0]-x,q[1]-y);if(d<bd){bd=d;best=key;}});
  if(best){const p=rec.pins[best];return {kind:'pin',key:best,off:p?[p[0]-u,p[1]-v]:[0,0]};}
  if(pmCan(sim,'eye')){const e=rec['eye'+pmEyeW(sim)];if(e&&Math.hypot(PMT.X(e[0])-x,PMT.Y(e[1])-y)<22)return {kind:'eye'};}
  if(pmCan(sim,'prot')&&Math.hypot(u-rec.prot[0],v-rec.prot[1])<0.8)return {kind:'prot',off:[rec.prot[0]-u,rec.prot[1]-v]};
  if(pmCan(sim,'ruler')){const R=rec.ruler;if(u>=R[0]-0.2&&u<=R[0]+PM.RW+0.2&&v>=R[1]&&v<=R[1]+PM.RL)return {kind:'ruler',off:[R[0]-u,R[1]-v]};}
  if(pmCan(sim,'prot')){const Q=rec.prot;if(Math.hypot(u-Q[0],v-Q[1])<=PM.R+0.2&&v>=Q[1]-0.4)return {kind:'prot',off:[Q[0]-u,Q[1]-v]};}
  return null;}
function pmDragTo(sim,x,y,end){const B=pmB(sim),h=B&&B.drag;if(!h)return;const rec=pmCur(sim),u=(x-PMX)/PM.S,v=(y-PMY)/PM.S;
  if(h.kind==='pin'){const p=[u+h.off[0],v+h.off[1]];if(end)pmStick(sim,h.key,p);else rec.pins[h.key]=pmClampPin(p).map(r4);}
  else if(h.kind==='view'){const th=h.th0+(x-h.x0)/PM.Z,p=[h.eye[0]+h.r*Math.cos(th),h.eye[1]+h.r*Math.sin(th)];if(end)pmStick(sim,h.key,p);else rec.pins[h.key]=pmClampPin(p).map(r4);}
  else if(h.kind==='eye')rec['eye'+pmEyeW(sim)]=pmBorder([u,v]);
  else if(h.kind==='ruler')rec.ruler=pmRulerClamp([u+h.off[0],v+h.off[1]]);
  else if(h.kind==='prot'){rec.prot=pmProtClamp([u+h.off[0],v+h.off[1]]);if(end)pmSnap(rec);}}
function pmAttach(sim){const cv=sim.ui&&sim.ui.stage;if(!cv)return;cv.style.touchAction='none';if(!cv.hasAttribute('tabindex')){cv.tabIndex=0;cv._pmTab=true;}if(cv._pm)return;cv._pm=true;
  cv.addEventListener('pointerdown',e=>{const B=pmB(sim);if(!B||sim.mode!=='vlab')return;const [x,y]=pmPos(cv,e),h=pmHit(sim,x,y);if(!h)return;e.preventDefault();B.drag=h;try{cv.setPointerCapture(e.pointerId);}catch(_){}
    if(h.kind==='pin'&&!pmCur(sim).pins[h.key])pmDragTo(sim,x,y,false);sim.infoDirty=true;});
  cv.addEventListener('pointermove',e=>{const B=pmB(sim);if(!B||sim.mode!=='vlab')return;const [x,y]=pmPos(cv,e);if(B.drag){e.preventDefault();pmDragTo(sim,x,y,false);sim.infoDirty=true;}else cv.style.cursor=pmHit(sim,x,y)?'grab':'default';});
  const up=e=>{const B=pmB(sim);if(!B||!B.drag)return;const [x,y]=pmPos(cv,e);pmDragTo(sim,x,y,true);B.drag=null;sim.infoDirty=true;if(BioLab.vlab&&BioLab.vlab.save)BioLab.vlab.save(sim);};
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  cv.addEventListener('keydown',e=>{const B=pmB(sim);if(!B||sim.mode!=='vlab')return;const m={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(!m)return;e.preventDefault();pmMove(sim,m[0],m[1]);sim.infoDirty=true;});}
function pmDetach(sim){const cv=sim.ui&&sim.ui.stage;if(!cv)return;cv.style.touchAction='';cv.style.cursor=sim.def.onClick?'pointer':'';if(cv._pmTab){cv.removeAttribute('tabindex');cv._pmTab=false;}}
function pmNarrate(sim){const b=sim.vlab.bench,ph=b.ph,rec=pmCur(sim);
  if(ph==='juan')return 'A top view of a room. <b>A plane mirror’s image sits as far behind the mirror as the object is in front.</b> Juan sees Melissa in the mirror only if the straight line from her image to his eyes passes through the mirror.';
  if(ph==='end')return 'All five sheets are done. If light obeys the law of reflection, your θ<sub>r</sub> matches θ<sub>i</sub> and d′ matches d, apart from small errors in placing the pins.';
  if(!rec||ph==='intro')return 'A sheet of paper is pinned to the corkboard. The line across it marks the mirror’s silvered surface, and the plane mirror stands on that line.';
  const A=rec.pins.A;
  if(ph==='A')return A?'Pin A stands in front of the mirror. Light from it reflects off the mirror; you will find where its image is by sighting along the reflected light.':'Drag pin A from the pin box onto the paper in front of the mirror.';
  if(ph==='S1'||ph==='S2'){const w=ph==='S1'?1:2,V=pmView(rec,w),ks=w===1?['B','C']:['D','E'];if(!V)return 'Stick pin A into the paper first.';
    if(!V.inM)return 'From where your eye is, the image of A is not in the mirror. Drag the eye along the edge of the paper.';
    if(!V.both)return 'Look into the mirror: you see the image of pin A behind it. Drag pins '+ks[0]+' and '+ks[1]+' from the pin box onto the paper between your eye and the mirror.';
    if(V.ok)return V.sep<4?'The pins line up, but they are close together. Move '+ks[1]+' at least 4 cm from '+ks[0]+' so your ray is accurate.':'<b>'+ks[0]+', '+ks[1]+' and the image of A line up.</b> Light from pin A reflects off the mirror and travels along this line to your eye.';
    return 'From your eye, '+V.pins.map(o=>!o.front?'pin '+o.k+' is not between your eye and the mirror':o.on?'pin '+o.k+' covers the image of A':'pin '+o.k+' is to the '+(o.a<0?'left':'right')+' of the image of A').join(', and ')+'. Move the pins until they hide the image.';}
  if(ph==='draw'){if(rec.mirror)return 'The pins mark the light’s path. Remove the mirror so you can draw on the paper underneath it.';
    if(!rec.ray1)return 'Draw the reflected ray: a straight line through B and C to the mirror line.';if(!rec.inc)return 'The reflected ray meets the mirror line at the <b>point of reflection</b>. Draw the incident ray from A to that point.';
    if(!rec.normal)return 'Draw the normal: the line at 90° to the mirror at the point of reflection. Both angles are measured from it.';if(!rec.ray2)return 'Draw the second reflected ray, through D and E.';
    if(!rec.ext)return 'Both reflected rays seem to come from behind the mirror. Extend them backward as dashed lines.';return 'The dashed lines cross at <b>A′, the image of A</b>. Light never reaches it, so it is a virtual image.';}
  if(ph==='meas')return 'The protractor’s 0° line runs along the normal, so it reads θ<sub>i</sub> and θ<sub>r</sub> straight from the normal. The ruler reads distances along the normal: d from A to the mirror line, d′ from the mirror line to A′.';
  return '';}
/* ---- notebook checks ---- */
function pmAngCheck(key){return (sim,row,v)=>{const rec=pmGet(sim,row-1),nm=key==='ti'?'incident':'reflected';
  if(!rec||!rec.ray1||(key==='ti'&&!rec.inc))return 'Draw the rays for Trial '+row+' on the bench first, then measure with the protractor.';
  const g=pmGeom(rec),t=key==='ti'?g.ti:g.tr;if(!Number.isFinite(t))return null;if(v<0||v>90)return 'An angle measured from the normal is between 0° and 90°.';
  if(Math.abs(v-t)<=1.0)return null;if(Math.abs(v-(90-t))<=1.0)return 'Measure the angle from the normal (the dashed line), not from the mirror line.';
  return 'This does not match the '+nm+' ray on your Trial '+row+' paper. Center the protractor on the point of reflection and read where the '+nm+' ray crosses the scale.';};}
function pmDistCheck(key){return (sim,row,v)=>{const rec=pmGet(sim,row-1);if(!rec||!rec.pins.A)return 'Do Trial '+row+' on the bench first.';
  if(key==='dp'&&(!rec.ext||!rec.ray1||!rec.ray2))return 'Extend both reflected rays behind the mirror in Trial '+row+' to find A′, then measure.';
  const g=pmGeom(rec),t=key==='d'?g.d:g.dp;if(!Number.isFinite(t))return null;if(v<0)return 'Distances are positive: measure how far the point is from the mirror line.';
  if(Math.abs(v-t)<=0.15)return null;return key==='d'?'This does not match your Trial '+row+' paper. Measure from pin A straight to the mirror line, along the ruler.':'This does not match your Trial '+row+' paper. Measure from the mirror line straight back to A′, where the dashed lines cross.';};}
function pmPctCheck(tb,a,bk,nm){return (sim,row,v)=>{const V=sim.vlab,x=V.val(tb,a,row-1),y=V.val(tb,bk,row-1);if(!Number.isFinite(x)||!Number.isFinite(y))return 'Fill in '+nm+' for Trial '+row+' first.';
  if(v<0)return 'A percent difference is never negative.';const pd=x+y>0?Math.abs(x-y)/((x+y)/2)*100:0,pe=x>0?Math.abs(x-y)/x*100:0,tol=p=>0.15+0.02*p;
  if(Math.abs(v-pd)<=tol(pd)||Math.abs(v-pe)<=tol(pe))return null;return 'Check this against your Trial '+row+' values: % difference = |difference| ÷ average × 100.';};}
/* ---- the lab, from the teacher's handout ---- */
const pmSet=(ph,k,extra)=>sim=>{const b=sim.vlab.bench;b.ph=ph;b.tr=k;if(k>=0){const rec=pmRec(sim,k);if(ph==='A'||ph==='S1'||ph==='S2')rec.mirror=true;if(extra)extra(sim,rec);}};
function pmTrialSteps(k){const n=k+1,ctl=['pmPin','pmStep','pm-left','pm-right','pm-up','pm-down'];
  const sightDone=w=>sim=>{const rec=pmGet(sim,k);if(!rec)return false;const V=pmView(rec,w);if(!V||!V.ok||V.sep<4)return false;if(w===2){const g=pmGeom(rec);if(!(g.cross>=20)||pmSideOf(rec,1)===pmSideOf(rec,2))return false;}return true;};
  const sightHint=w=>sim=>{const rec=pmGet(sim,k),ks=w===1?['B','C']:['D','E'];if(!rec)return '';const V=pmView(rec,w);if(!V)return 'Stick pin A into the paper first.';if(!V.inM)return 'Move the eye until you can see the image of A in the mirror.';
    if(!V.both)return 'Stick pins '+ks[0]+' and '+ks[1]+' into the paper.';if(!V.ok)return 'Line up '+ks[0]+', '+ks[1]+' and the image of A in the view.';if(V.sep<4)return 'Spread '+ks[0]+' and '+ks[1]+' at least 4 cm apart.';
    if(w===2&&pmSideOf(rec,1)===pmSideOf(rec,2))return 'Look from the other side of pin A for sight line 2: drag the eye to the other side.';if(w===2)return 'Sight line 2 needs to cross sight line 1 at a wider angle. Move the eye farther around.';return '';};
  return [
  {title:'Trial '+n+': place pin A',text:'<p>Stick pin A, the object, into the paper in front of the mirror, between 2 cm and 7 cm from the mirror line and in front of the middle part of the mirror. Use a different distance in each trial.</p>',
   setup:pmSet('A',k,(sim)=>BioLab.setValues(sim,{pmPin:'A',pmZoom:'off'})),controls:ctl,
   done:sim=>{const r=pmGet(sim,k),A=r&&r.pins.A;return !!A&&A[1]>=1.5&&A[1]<=7.2&&Math.abs(A[0])<=5;},
   doneHint:sim=>{const r=pmGet(sim,k),A=r&&r.pins.A;return !A?'Drag pin A from the pin box onto the paper.':'Put pin A 2 cm to 7 cm in front of the mirror line, in front of the middle of the mirror.';}},
  {title:'Trial '+n+': sight line 1',text:'<p>Choose a viewing side, left or right, under <b>Viewing side</b>. Put your eye near the paper and look into the mirror at the image of pin A. The eye starts at a different angle in each trial; you can drag it along the edge of the paper.</p><p>Stick pin B into the paper so it hides the image of A. Then stick pin C farther from the mirror so it hides both B and the image of A. Keep B and C at least 4 cm apart. The view on the right turns green when B, C and the image of A line up within a pin’s width.</p>',
   setup:pmSet('S1',k,(sim,rec)=>{if(rec.pins.A&&!rec.eye1)rec.eye1=pmEyeDefault(rec.pins.A,sim.p.pmSide,PM_TH1[k]);else if(rec.eye1)BioLab.setValues(sim,{pmSide:pmSideOf(rec,1)||'L'});BioLab.setValues(sim,{pmPin:'B',pmZoom:'off'});}),
   controls:['pmSide'].concat(ctl),done:sightDone(1),doneHint:sightHint(1)},
  {title:'Trial '+n+': sight line 2',text:'<p>Now look into the mirror from the other side of pin A. Stick pins D and E into the paper so they line up with the image of A in the same way, at least 4 cm apart.</p>',
   setup:pmSet('S2',k,(sim,rec)=>{if(rec.pins.A&&!rec.eye2)rec.eye2=pmEyeDefault(rec.pins.A,pmSideOf(rec,1)==='R'?'L':'R',PM_TH2[k]);BioLab.setValues(sim,{pmPin:'D',pmZoom:'off'});}),
   controls:ctl,done:sightDone(2),doneHint:sightHint(2)},
  {title:'Trial '+n+': draw the rays',text:'<p>Remove the mirror. Draw the reflected ray through B and C to the mirror line. The point where it meets the line is the <b>point of reflection</b>. Draw the incident ray from A to that point, and draw the normal there.</p><p>Draw the ray through D and E too. Extend both reflected rays behind the mirror as dashed lines. The point where they cross is the image, A′.</p>',
   setup:pmSet('draw',k),controls:['pm-mirror','pm-ray1','pm-inc','pm-normal','pm-ray2','pm-ext'],
   done:sim=>{const r=pmGet(sim,k);return !!r&&!r.mirror&&r.ray1&&r.inc&&r.normal&&r.ray2&&r.ext;},
   doneHint:sim=>{const r=pmGet(sim,k);if(!r)return '';if(r.mirror)return 'Press <b>Remove the mirror</b>.';const a=[[r.ray1,'Draw ray through B and C'],[r.inc,'Draw the incident ray'],[r.normal,'Draw the normal'],[r.ray2,'Draw ray through D and E'],[r.ext,'Extend the rays behind the mirror']].find(x=>!x[0]);return a?'Press <b>'+a[1]+'</b>.':'';}},
  {title:'Trial '+n+': measure',text:'<p>Put the center of the protractor on the point of reflection of ray B–C, with its 0° line along the normal. Read the angle of incidence θ<sub>i</sub> and the angle of reflection θ<sub>r</sub> from the normal, to 0.5°. Use <b>Magnify</b> to read the scale up close.</p><p>Then use the ruler, which lies along the normal. Measure d, the distance from pin A to the mirror line, and d′, the distance from the mirror line to A′, to 0.1 cm: each is the difference between two ruler readings. Record all four in the Trial '+n+' rows of the tables below the bench.</p>',
   setup:pmSet('meas',k,(sim,rec)=>{const g=pmGeom(rec);if(!rec.prot){const P=g.P1||[0,0],Ru=(g.A||[0])[0]+0.7,c=[P[0]-6.5,P[0]+6.5].filter(x=>x>-13&&x<13);c.sort((x,y)=>Math.abs(y-Ru-1.2)-Math.abs(x-Ru-1.2));rec.prot=pmProtClamp([c.length?c[0]:0,0]);}if(!rec.ruler){const A=g.A||[0,4];rec.ruler=pmRulerClamp([A[0]+(A[0]>9?-3:0.7),-7.5]);}BioLab.setValues(sim,{pmPin:'prot',pmZoom:'ti'});}),
   controls:['pmZoom','pmPin','pmStep','pm-left','pm-right','pm-up','pm-down'],
   done:sim=>['c:ang:ti:','c:ang:tr:','c:dist:d:','c:dist:dp:'].every(p=>sim.vlab.raw(p+k).trim()!==''),doneHint:'Record θ<sub>i</sub>, θ<sub>r</sub>, d and d′ for this trial in the tables below the bench.'}];}
const LAB_PM={id:'planemirrors',title:'Physics Lab 8B: Plane Mirrors',course:'Physics',teachers:'Baldasare',
  source:{label:'Physics Lab 8B: Plane Mirrors',href:'https://rjhs.instructure.com/courses/15502/assignments/554948'},level:'bio',
  purpose:'<p>Use pins and sight lines to trace light that reflects from a plane mirror. Compare the angle of reflection with the angle of incidence, and compare the image distance behind the mirror with the object distance in front of it.</p>',
  background:'<p>When light reflects from a mirror, the <b>angle of incidence</b> θ<sub>i</sub> and the <b>angle of reflection</b> θ<sub>r</sub> are both measured from the <b>normal</b>, the line at 90° to the mirror at the point where the light hits it. The <b>law of reflection</b> says θ<sub>r</sub> = θ<sub>i</sub>.</p>'+
    '<p>You cannot see a ray of light, but you can mark one. Light from pin A reflects off the mirror and travels to your eye. When pins B and C line up with the image of A as you look into the mirror, they sit on that reflected ray. With the mirror removed, a line through B and C shows the reflected ray, and a line from A to the point of reflection shows the incident ray.</p>'+
    '<p>Reflected rays from A spread out, so they never meet in front of the mirror. Extended backward, they seem to come from one point behind the mirror: the image A′. Two sight lines from different sides locate it where their extensions cross. The <b>object distance</b> d runs from A to the mirror line and the <b>image distance</b> d′ from the mirror line to A′.</p>'+
    '<p>Percent difference compares two measurements that should agree: % difference = |θ<sub>i</sub> − θ<sub>r</sub>| ÷ ((θ<sub>i</sub> + θ<sub>r</sub>) ÷ 2) × 100, and the same for d and d′.</p>'+
    '<p><b>About the virtual bench.</b> The paper is drawn to scale. Each pin is about 1 mm thick, and a pin lands within about 1 mm of where you aim, as in a real lab, so your angles and distances will differ a little from trial to trial. The view panel shows what your eye sees along the sight line, stretched sideways so a misalignment of a fraction of a millimeter shows; pins count as lined up when they overlap within a pin’s width. The bench treats the mirror as silvered on its front surface. A real mirror is silvered on the back of the glass, which shifts the sight lines by about a millimeter; that is why you draw the line along the silvered surface.</p>',
  materials:['Plane mirror on a stand','Corkboard','Sheets of paper (one per trial)','Five pins (A, B, C, D, E)','Ruler (cm, with mm marks)','Protractor','Pencil'],
  hypothesis:{prompt:'<p>Predict how the angle of reflection will compare with the angle of incidence, and how far behind the mirror the image of pin A will be.</p>'},
  setup(sim){PM_SEED=sim.vlab.seed;const b=sim.vlab.bench;if(!Array.isArray(b.trials))b.trials=[];if(b.tr===undefined)b.tr=0;if(!b.ph)b.ph='intro';pmAttach(sim);BioLab.refresh(sim);},
  teardown(sim){pmDetach(sim);},
  controls:[],
  steps:[{title:'Get set up',text:'<p>You will do five trials. Each trial uses a fresh sheet of paper on the corkboard. A line across the paper marks where the mirror’s silvered surface goes, and the plane mirror stands on that line.</p><p>On the bench, drag pins from the pin box onto the paper. Drag the eye along the edge of the paper to choose where you look from. For small moves, choose the <b>Item to move</b> and use the <b>Move</b> buttons, or click the bench and use the arrow keys.</p>',setup:pmSet('intro',0),controls:[]}]
    .concat(...[0,1,2,3,4].map(pmTrialSteps),[
    {title:'Can Juan see Melissa?',text:'<p>The bench shows a top view of a room with a plane mirror on one wall. Use it to answer question 4 below the bench.</p>',setup:pmSet('juan',-1,null),controls:[]},
    {title:'Analyze your data',text:'<p>All five trials are done. Below the bench, work out each percent difference, check your graph of θ<sub>r</sub> against θ<sub>i</sub>, answer the questions and write your conclusion. Then turn in your lab.</p>',setup:pmSet('end',4,sim=>BioLab.setValues(sim,{pmZoom:'off'})),controls:[]}]),
  tables:[{id:'ang',title:'Table 1: Angle of incidence and angle of reflection',cols:[{id:'n',label:'Trial',rows:[1,2,3,4,5]},
      {id:'ti',label:'θ<sub>i</sub> (°)',input:'number',dp:1,check:pmAngCheck('ti')},{id:'tr',label:'θ<sub>r</sub> (°)',input:'number',dp:1,check:pmAngCheck('tr')},
      {id:'pd',label:'% difference',input:'number',dp:1,check:pmPctCheck('ang','ti','tr','θi and θr')}]},
    {id:'dist',title:'Table 2: Object distance and image distance',cols:[{id:'n',label:'Trial',rows:[1,2,3,4,5]},
      {id:'d',label:'d (cm)',input:'number',dp:1,check:pmDistCheck('d')},{id:'dp',label:'d′ (cm)',input:'number',dp:1,check:pmDistCheck('dp')},
      {id:'pd',label:'% difference',input:'number',dp:1,check:pmPctCheck('dist','d','dp','d and d′')}]}],
  graph:{type:'line',title:'Angle of reflection vs angle of incidence',xl:'Angle of incidence θi (°)',yl:'Angle of reflection θr (°)',xmin:0,xmax:90,ymin:0,ymax:90,
    series:[{table:'ang',x:'ti',y:'tr',label:'Your data'},{table:'ang',x:'ti',y:'ti',label:'y = x (θr = θi)'}]},
  questions:[
    {id:'q1',n:'1',q:'<p>Real or virtual: what is the difference between a real image and a virtual image? Which kind does a plane mirror form, and how do your sight lines show it?</p>'},
    {id:'q2',n:'2',q:'<p>Describe the image formed by a plane mirror.</p>',fields:[{id:'or',label:'Upright or inverted?'},{id:'sz',label:'Size compared with the object'},{id:'loc',label:'Where it is, compared with the object'},{id:'rev',label:'What is reversed?'}]},
    {id:'q3',n:'3',q:'<p>Label the ray diagram: name each numbered part.</p>'+PM_RAY_SVG,fields:[{id:'p1',label:'1'},{id:'p2',label:'2'},{id:'p3',label:'3'},{id:'p4',label:'4'},{id:'p5',label:'5'}]},
    {id:'q4',n:'4',get q(){const R=pmJuan(PM_SEED);return '<p>Can Juan see Melissa in the mirror? The diagram is a top view of the room (it is also on the bench in the procedure step “Can Juan see Melissa?”). The mirror hangs on the top wall from x = '+pmM(R.m0)+' m to x = '+pmM(R.m0+R.L)+' m. Juan stands at x = '+pmM(R.J[0])+' m, '+pmM(R.J[1])+' m out from the wall, and Melissa at x = '+pmM(R.M[0])+' m, '+pmM(R.M[1])+' m out from the wall.</p>'+pmJuanSvg(R)+'<p>Locate Melissa’s image, draw the line from her image to Juan’s eyes, and use it to explain your answer.</p>';}}],
  conclusion:{prompt:'<p>Write a claim–evidence–reasoning conclusion: does light reflecting from a plane mirror obey the law of reflection, and how does the image distance compare with the object distance? Use your percent differences as evidence.</p>',cer:true}};

const LENSES={
  id:'lenses',hash:'lenses',apUnit:9,order:2,kind:'Virtual lab',tab:'Mirrors and lenses',
  card:'Trace the principal rays through lenses and off mirrors. Find real images on a screen and test 1/f = 1/dₒ + 1/dᵢ.',
  title:'Mirrors and lenses',
  lede:{bio:'Move a candle in front of a lens or mirror. Follow three special rays to find where the image forms and what it looks like.',
        honors:'Use ray diagrams and the thin-lens equation 1/f = 1/dₒ + 1/dᵢ to predict image distance and magnification, then check with the screen.',
        ap:'Find an unknown focal length from object and image distances, use sign conventions for virtual images and diverging elements, and connect focal length to lens power.'},
  scale:'Distances along the bench are to scale (6 pixels per cm, ruler in cm). Heights are drawn twice as tall so the rays are easy to see; this stretch does not move where the rays cross.',
  timeless:true,animated:true,chChange:1.2,chReveal:3,
  controls:[
    {id:'el',label:'Lens or mirror',type:'select',def:'conv',lvl:'bio',options:[{v:'conv',l:'Converging lens'},{v:'div',l:'Diverging lens'},{v:'concave',l:'Concave mirror'},{v:'convex',l:'Convex mirror',lvl:'honors'},{v:'plane',l:'Plane mirror'},{v:'myst',l:'Mystery lens',lvl:'ap'}]},
    {id:'f',label:'Focal length',type:'range',min:5,max:30,step:0.5,def:15,unit:' cm',d:1,lvl:'bio',help:'Distance from the lens or mirror to its focal point F.'},
    {id:'dobj',label:'Object distance',type:'range',min:3,max:60,step:0.5,def:40,unit:' cm',d:1,lvl:'bio',help:'Click on the bench to move the candle.'},
    {id:'h',label:'Candle height',type:'range',min:2,max:10,step:0.5,def:6,unit:' cm',d:1,lvl:'honors'},
    {id:'rays',label:'Principal rays',type:'seg',def:'3',lvl:'bio',options:[{v:'0',l:'None'},{v:'1',l:'Ray 1'},{v:'2',l:'Rays 1–2'},{v:'3',l:'All 3'}]},
    {id:'screen',label:'Screen',type:'toggle',def:false,lvl:'bio',help:'A card to catch real images'},
    {id:'scr',label:'Screen distance',type:'range',min:3,max:60,step:0.5,def:24,unit:' cm',d:1,lvl:'bio'},
    {id:'ruler',label:'Ruler',type:'toggle',def:true,lvl:'bio',noTrial:true},
    {id:'virt',label:'Show traced-back (virtual) rays',type:'toggle',def:true,lvl:'bio',noTrial:true},
    // virtual lab bench only (hidden in the other views)
    {id:'pmSide',label:'Viewing side',type:'seg',def:'L',vlab:true,noTrial:true,options:[{v:'L',l:'Left'},{v:'R',l:'Right'}],help:'Where you look into the mirror from, for sight line 1.',
     onChange(sim){if(!pmB(sim)||sim.vlab.bench.ph!=='S1')return;const rec=pmCur(sim);if(rec&&rec.pins.A&&pmSideOf(rec,1)!==sim.p.pmSide)rec.eye1=pmEyeDefault(rec.pins.A,sim.p.pmSide,PM_TH1[sim.vlab.bench.tr]||30);}},
    {id:'pmPin',label:'Item to move',type:'select',def:'A',vlab:true,noTrial:true,options:[{v:'A',l:'Pin A'},{v:'B',l:'Pin B'},{v:'C',l:'Pin C'},{v:'D',l:'Pin D'},{v:'E',l:'Pin E'},{v:'eye',l:'Your eye'},{v:'prot',l:'Protractor'},{v:'ruler',l:'Ruler'}],help:'Moves with the Move buttons, or the arrow keys after you click the bench.'},
    {id:'pmStep',label:'Move step',type:'seg',def:0.05,vlab:true,noTrial:true,options:[{v:0.05,l:'0.5 mm'},{v:0.5,l:'5 mm'}]},
    {id:'pmZoom',label:'Magnify',type:'select',def:'off',vlab:true,noTrial:true,options:[{v:'off',l:'Off'},{v:'ti',l:'Protractor: incident ray'},{v:'tr',l:'Protractor: reflected ray'},{v:'rM',l:'Ruler: mirror line'},{v:'rA',l:'Ruler: pin A'},{v:'rI',l:'Ruler: image A′'}]}
  ],
  actions:[
    {id:'magnifier',label:'Magnifying glass',lvl:'bio',run(sim){scene(sim,'magnifier');}},
    {id:'camera',label:'Camera or eye',lvl:'bio',run(sim){scene(sim,'camera');}},
    {id:'projector',label:'Projector',lvl:'bio',run(sim){scene(sim,'projector');}},
    {id:'makeup',label:'Makeup mirror',lvl:'bio',run(sim){scene(sim,'makeup');}},
    {id:'car',label:'Car side mirror',lvl:'honors',run(sim){scene(sim,'car');}},
    {id:'snap',label:'Move screen to the image',lvl:'bio',run(sim){const im=image(sim.p);if(im.real&&im.di<=60)BioLab.setValues(sim,{screen:true,scr:Math.round(im.di*2)/2});else BioLab.setValues(sim,{screen:true});}},
    // virtual lab bench only
    {id:'pm-left',label:'Move left',vlab:true,enabled:s=>!!pmB(s)&&pmCan(s,s.p.pmPin),run(s){pmMove(s,-1,0);}},
    {id:'pm-right',label:'Move right',vlab:true,enabled:s=>!!pmB(s)&&pmCan(s,s.p.pmPin),run(s){pmMove(s,1,0);}},
    {id:'pm-up',label:'Move up',vlab:true,enabled:s=>!!pmB(s)&&pmCan(s,s.p.pmPin),run(s){pmMove(s,0,-1);}},
    {id:'pm-down',label:'Move down',vlab:true,enabled:s=>!!pmB(s)&&pmCan(s,s.p.pmPin),run(s){pmMove(s,0,1);}},
    {id:'pm-mirror',label:'Remove the mirror',vlab:true,enabled:s=>{const r=pmB(s)&&pmCur(s);return !!r&&r.mirror;},run(s){const r=pmB(s)&&pmCur(s);if(r)r.mirror=false;}},
    {id:'pm-ray1',label:'Draw ray through B and C',vlab:true,enabled:s=>{const r=pmB(s)&&pmCur(s);return !!r&&!r.mirror&&!r.ray1&&!!pmLine(r.pins.B,r.pins.C);},run(s){const r=pmB(s)&&pmCur(s);if(r&&!r.mirror&&pmLine(r.pins.B,r.pins.C))r.ray1=true;}},
    {id:'pm-inc',label:'Draw the incident ray',vlab:true,enabled:s=>{const r=pmB(s)&&pmCur(s);return !!r&&r.ray1&&!r.inc&&!!r.pins.A;},run(s){const r=pmB(s)&&pmCur(s);if(r&&r.ray1&&r.pins.A)r.inc=true;}},
    {id:'pm-normal',label:'Draw the normal',vlab:true,enabled:s=>{const r=pmB(s)&&pmCur(s);return !!r&&r.ray1&&!r.normal;},run(s){const r=pmB(s)&&pmCur(s);if(r&&r.ray1)r.normal=true;}},
    {id:'pm-ray2',label:'Draw ray through D and E',vlab:true,enabled:s=>{const r=pmB(s)&&pmCur(s);return !!r&&!r.mirror&&!r.ray2&&!!pmLine(r.pins.D,r.pins.E);},run(s){const r=pmB(s)&&pmCur(s);if(r&&!r.mirror&&pmLine(r.pins.D,r.pins.E))r.ray2=true;}},
    {id:'pm-ext',label:'Extend the rays behind the mirror',primary:true,vlab:true,enabled:s=>{const r=pmB(s)&&pmCur(s);return !!r&&r.ray1&&r.ray2&&!r.ext;},run(s){const r=pmB(s)&&pmCur(s);if(r&&r.ray1&&r.ray2)r.ext=true;}}
  ],
  labs:[LAB_PM],
  /* what the bench instruments show right now (used by the virtual-lab tests) */
  benchRead(sim){if(!pmB(sim))return null;const b=sim.vlab.bench,rec=pmCur(sim);if(!rec)return {ph:b.ph,tr:b.tr,juan:pmJuan(sim.vlab.seed)};const g=pmGeom(rec);
    const vw=w=>{const V=pmView(rec,w);return V?{ok:V.ok,inM:V.inM,sep:V.sep,eye:V.eye,eye0:V.e0,X:V.X,pins:V.pins.map(o=>({k:o.k,placed:!!o.p,a:o.p?o.a:null,on:!!o.on}))}:null;},pr=w=>{const r=pmProtRead(rec,w);return r?r.a:null;};
    return {ph:b.ph,tr:b.tr,mirror:rec.mirror,pins:rec.pins,views:{1:vw(1),2:vw(2)},P1:g.P1||null,prot:rec.prot,ruler:rec.ruler,protRead:{ti:pr('ti'),tr:pr('tr')},
      rulerRead:rec.ruler?{M:pmRulerRead(rec,0),A:g.A?pmRulerRead(rec,g.A[1]):null,I:g.Ai&&rec.ext?pmRulerRead(rec,g.Ai[1]):null}:null,
      map:{x0:PMX,y0:PMY,s:PM.S,Z:PM.Z},tray:PM_TRAY,viewBox:pmViewBox(),juan:pmJuan(sim.vlab.seed)};},
  init(sim){const s={ph:0,scene:null};if(sim&&sim.vlab&&sim.vlab.lab.id==='planemirrors')s.B={kind:'pm',drag:null};return s;},
  step(sim,dt){sim.st.ph+=dt;},
  metrics:[
    {id:'dobj',label:'Object distance dₒ',unit:'cm',lvl:'bio',min:0,max:60,d:1,get:s=>s.p.dobj},
    {id:'fl',label:'Focal length f',unit:'cm',lvl:'bio',min:-30,max:30,d:1,get:s=>{const f=fEff(s.p);if(!Number.isFinite(f)||s.p.el==='myst')return NaN;return atLeast('honors')?f:Math.abs(f);}},
    {id:'di',label:'Image distance dᵢ',unit:'cm',lvl:'bio',min:-60,max:60,d:1,get:s=>{const im=image(s.p);return atLeast('honors')?im.di:Math.abs(im.di);}},
    {id:'hi',label:'Image height',unit:'cm',lvl:'bio',min:-30,max:30,d:1,get:s=>{const im=image(s.p);return atLeast('honors')?im.h:Math.abs(im.h);}},
    {id:'type',label:'Image',text:true,lvl:'bio',get:s=>typeText(image(s.p))},
    {id:'m',label:'Magnification m',unit:'',lvl:'honors',min:-5,max:5,d:2,get:s=>image(s.p).m},
    {id:'sum',label:'1/dₒ + 1/dᵢ',unit:'1/cm',lvl:'honors',min:-0.4,max:0.4,d:4,get:s=>{const im=image(s.p);return Number.isFinite(im.di)?1/s.p.dobj+1/im.di:NaN;}},
    {id:'invf',label:'1/f',unit:'1/cm',lvl:'honors',min:-0.4,max:0.4,d:4,get:s=>s.p.el==='myst'?NaN:(s.p.el==='plane'?0:1/fEff(s.p))},
    {id:'power',label:'Power',unit:'diopters',lvl:'ap',min:-20,max:20,d:1,get:s=>s.p.el==='myst'?NaN:(s.p.el==='plane'?0:100/fEff(s.p))}
  ],
  graphs:[
    {id:'thin',label:'Image distance vs object distance',lvl:'bio',custom:true},
    {id:'mag',label:'Image size vs object distance',lvl:'bio',custom:true},
    {id:'recip',label:'1/dᵢ vs 1/dₒ',lvl:'honors',custom:true}
  ],
  defaultGraph:'thin',
  plot(sim,ctx,box,id){const p=sim.p,f=fEff(p),im=image(p),hon=atLeast('honors');
    const di=d=>{if(!Number.isFinite(f))return -d;const q=1/f-1/d;return Math.abs(q)<1e-6?NaN:1/q;};
    const line=(ax,fn,x0,x1,col,lim)=>{ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.beginPath();let st=false,prev=null;for(let i=0;i<=300;i++){const x=x0+(x1-x0)*i/300,y=fn(x);if(!Number.isFinite(y)||Math.abs(y)>lim){st=false;prev=null;continue;}if(prev!==null&&Math.sign(prev)!==Math.sign(y)&&Math.abs(prev-y)>lim/2)st=false;const X=ax.X(x),Y=ax.Y(y);st?ctx.lineTo(X,Y):ctx.moveTo(X,Y);st=true;prev=y;}ctx.stroke();};
    const dot=(ax,x,y,lim)=>{if(!Number.isFinite(y)||Math.abs(y)>lim)return;ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.arc(ax.X(x),ax.Y(y),6,0,6.29);ctx.fill();};
    ctx.save();const clip=()=>{ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();};
    if(id==='thin'){const ax=axes(ctx,box,{xmin:0,xmax:60,ymin:-60,ymax:100,xl:'Object distance dₒ (cm)',yl:hon?'Image distance dᵢ (cm, + real)':'Image distance dᵢ (cm)'});clip();
      ctx.strokeStyle=PAL['muted'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(box.L,ax.Y(0));ctx.lineTo(box.L+box.W,ax.Y(0));ctx.stroke();
      if(Number.isFinite(f)&&f>0){ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(ax.X(f),box.T);ctx.lineTo(ax.X(f),box.T+box.H);ctx.stroke();ctx.setLineDash([]);txt(ctx,'dₒ = f',ax.X(f)+5,box.T+14,{s:12,c:PAL['muted']});}
      line(ax,di,0.5,60,PAL['g-line'],100);dot(ax,p.dobj,im.di,100);
      txt(ctx,'real images',box.L+box.W-8,ax.Y(60),{s:12,a:'right',c:PAL['cv-soft']});txt(ctx,'virtual images',box.L+box.W-8,ax.Y(-45),{s:12,a:'right',c:PAL['cv-soft']});}
    else if(id==='mag'){const ax=axes(ctx,box,{xmin:0,xmax:60,ymin:-6,ymax:6,xl:'Object distance dₒ (cm)',yl:'Magnification m (− = inverted)'});clip();
      ctx.strokeStyle=PAL['muted'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(box.L,ax.Y(0));ctx.lineTo(box.L+box.W,ax.Y(0));ctx.stroke();
      ctx.setLineDash([3,4]);[1,-1].forEach(v=>{ctx.beginPath();ctx.moveTo(box.L,ax.Y(v));ctx.lineTo(box.L+box.W,ax.Y(v));ctx.stroke();});ctx.setLineDash([]);
      line(ax,d=>-di(d)/d,0.5,60,PAL['g-line'],6);dot(ax,p.dobj,im.m,6);txt(ctx,'same size',box.L+6,ax.Y(1)-5,{s:12,c:PAL['muted']});}
    else{const ax=axes(ctx,box,{xmin:0,xmax:0.35,ymin:-0.35,ymax:0.35,xl:'1/dₒ (1/cm)',yl:'1/dᵢ (1/cm)',yd:2});clip();
      ctx.strokeStyle=PAL['muted'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(box.L,ax.Y(0));ctx.lineTo(box.L+box.W,ax.Y(0));ctx.stroke();
      const inv=Number.isFinite(f)?1/f:0;line(ax,x=>inv-x,0,0.35,PAL['g-line'],1);dot(ax,1/p.dobj,Number.isFinite(im.di)?1/im.di:(Math.abs(inv-1/p.dobj)<1e-6?0:NaN),1);
      legend(ctx,box.L+10,box.T+8,[{label:p.el==='myst'?'slope −1, y-intercept = 1/f':'slope −1, y-intercept 1/f = '+inv.toFixed(4),color:PAL['g-line']}]);}
    ctx.restore();},
  narrate(sim){if(pmB(sim))return pmNarrate(sim);const p=sim.p,im=image(p),hon=atLeast('honors'),mir=isMirror(p),sc=sceneOn(sim);
    const pre=sc?'<b>'+sc+':</b> ':'';
    if(p.el==='plane')return pre+'A plane mirror makes a <b>virtual, upright, same-size</b> image exactly as far behind the mirror ('+p.dobj.toFixed(1)+' cm) as the candle is in front. The reflected rays only seem to come from there.';
    if(!Number.isFinite(im.di))return pre+'The candle is exactly at the focal point. The rays leave parallel and never meet, so <b>no image forms</b>.';
    const a=Math.abs(im.m),size=Math.abs(a-1)<0.02?'the same size':a>1?a.toFixed(1)+' times as tall':a.toFixed(2)+' times as tall';
    const eq=hon?' Check: 1/dₒ + 1/dᵢ = 1/'+p.dobj.toFixed(1)+' + 1/'+im.di.toFixed(1)+' = '+(1/p.dobj+1/im.di).toFixed(4)+(p.el==='myst'?' = 1/f.':' = 1/f = '+(1/im.f).toFixed(4)+'.'):'';
    if(im.real)return pre+'The rays really cross '+im.di.toFixed(1)+' cm '+(mir?'in front of the mirror':'behind the lens')+': a <b>real, inverted</b> image, '+size+'. A screen there shows it sharply.'+eq;
    return pre+'The rays spread apart after the '+(mir?'mirror':'lens')+'. Traced back, they seem to come from '+Math.abs(im.di).toFixed(1)+' cm '+(mir?'behind the mirror':'on the candle’s side')+': a <b>virtual, upright</b> image, '+size+'. You can see it by looking '+(mir?'into the mirror':'through the lens')+', but no screen can catch it.'+eq;},
  tour:[
    {title:'The bench',text:'A candle stands in front of a converging lens. The dots marked F are the <b>focal points</b>, 15 cm from the lens. The ruler measures in centimetres.',focus:[150,90,420,230],setup(sim){BioLab.setValues(sim,{el:'conv',f:15,dobj:40,rays:'0',screen:false,virt:true,ruler:true});}},
    {title:'Ray 1: parallel, then through F',text:'A ray leaving the flame tip parallel to the axis bends at the lens and passes through the far focal point F.',focus:[150,60,560,260],setup(sim){BioLab.setValues(sim,{rays:'1'});}},
    {title:'Ray 2: through the center',text:'A ray through the very center of the lens goes straight through without bending.',focus:[150,60,560,260],setup(sim){BioLab.setValues(sim,{rays:'2'});}},
    {title:'Ray 3: through F, then parallel',text:'A ray through the near focal point bends at the lens and leaves parallel to the axis.',focus:[150,60,560,260],setup(sim){BioLab.setValues(sim,{rays:'3'});}},
    {title:'Where the rays cross',text:'All three rays meet at one point: the tip of the <b>image</b>. Here it is real and upside down. A screen placed there shows a sharp picture.',focus:[440,170,240,180],setup(sim){const im=image(sim.p);BioLab.setValues(sim,{screen:true,scr:Math.round(im.di*2)/2});}},
    {title:'Closer than F: a magnifying glass',text:'Move the candle inside the focal point. The rays now spread apart after the lens. Traced backward (dashed) they meet behind the candle: a <b>virtual</b>, upright, larger image.',focus:[100,20,520,330],setup(sim){BioLab.setValues(sim,{dobj:9,screen:false});}},
    {title:'Mirrors follow the same rules',text:'A concave mirror focuses light like a converging lens, but the light bounces back, so real images form in front of the mirror.',focus:[200,40,520,330],setup(sim){BioLab.setValues(sim,{el:'concave',f:15,dobj:40});}},
    {lvl:'honors',title:'The thin-lens equation',text:'Every ray diagram obeys 1/f = 1/dₒ + 1/dᵢ and m = −dᵢ/dₒ. Compare the readouts: the two sides always match.',focus:[150,40,560,320],setup(sim){BioLab.setValues(sim,{el:'conv',f:10,dobj:15});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{el:'conv',f:15,dobj:40,rays:'3',screen:false});},
  challenges:[
    {lvl:'bio',q:'The candle moves from 40 cm to 10 cm from a converging lens (f = 15 cm), inside the focal point. What image forms?',choices:['Real, upside down, smaller','Virtual, upright, larger','No image at all'],correct:1,
     baseline:{el:'conv',f:15,dobj:40,rays:'3',screen:false},change:{dobj:10},changeText:'Candle moved to 10 cm',watch:'thin',
     explain:{bio:'Inside the focal point the lens cannot bend the rays enough to meet. They spread out, and your eye traces them back to a larger, upright image: a magnifying glass.',honors:'1/dᵢ = 1/15 − 1/10 = −1/30, so dᵢ = −30 cm (virtual) and m = −dᵢ/dₒ = +3.'}},
    {lvl:'bio',q:'A candle in front of a plane mirror moves from 20 cm to 30 cm away. Where is its image now?',choices:['30 cm behind the mirror','15 cm behind the mirror','60 cm behind the mirror','On the mirror surface'],correct:0,
     baseline:{el:'plane',dobj:20,rays:'3'},change:{dobj:30},changeText:'Candle moved to 30 cm',watch:'thin',
     explain:{bio:'A flat mirror makes the image exactly as far behind the mirror as the object is in front: 30 cm. That is why your reflection steps back when you do.',honors:'For a plane mirror f → ∞, so 1/dᵢ = −1/dₒ: dᵢ = −30 cm, m = +1.'}},
    {lvl:'bio',q:'The converging lens is swapped for a diverging lens. What does the image look like now?',choices:['Real and upside down','Virtual, upright and smaller','Virtual, upright and larger'],correct:1,
     baseline:{el:'conv',f:15,dobj:40,rays:'3'},change:{el:'div'},changeText:'Diverging lens in place',watch:'mag',
     explain:{bio:'A diverging lens always spreads light out, so the rays never meet. Traced back, they come from a small, upright image between the lens and the candle, wherever the candle is.',honors:'With f < 0, 1/dᵢ = 1/f − 1/dₒ is always negative, so dᵢ < 0 and 0 < m < 1 for every real object.'}},
    {lvl:'honors',q:'The candle moves to 30 cm, twice the focal length (f = 15 cm). What image forms?',choices:['Same size, inverted, 30 cm behind the lens','Larger, upright, 15 cm behind the lens','Smaller, inverted, 60 cm behind the lens','No image'],correct:0,
     baseline:{el:'conv',f:15,dobj:50,rays:'3',screen:false},change:{dobj:30},changeText:'Candle moved to 30 cm (2f)',watch:'thin',
     explain:{honors:'1/dᵢ = 1/15 − 1/30 = 1/30, so dᵢ = 30 cm = 2f and m = −30/30 = −1: the same size, upside down.'}},
    {lvl:'honors',q:'A converging lens has f = 10 cm and the candle is 15 cm away. Where is the image, and how big?',choices:['dᵢ = 30 cm, m = −2 (twice as tall, inverted)','dᵢ = 6 cm, m = −0.4','dᵢ = 25 cm, m = −1.7','dᵢ = −30 cm, virtual'],correct:0,
     baseline:{el:'conv',f:10,dobj:40,rays:'3'},change:{dobj:15},changeText:'Candle moved to 15 cm',watch:'recip',
     explain:{honors:'1/dᵢ = 1/10 − 1/15 = 1/30, so dᵢ = 30 cm. m = −dᵢ/dₒ = −30/15 = −2: a real image twice as tall and upside down. This is how a projector works.'}},
    {lvl:'ap',q:'Mystery lens: with the candle at 30 cm, a sharp image forms on a screen 45 cm behind the lens. What is the focal length?',choices:['15 cm','18 cm','30 cm','75 cm'],correct:1,
     baseline:{el:'myst',dobj:60,rays:'3',screen:true,scr:45},change:{dobj:30},changeText:'Candle moved to 30 cm',watch:'recip',
     explain:{ap:'1/f = 1/dₒ + 1/dᵢ = 1/30 + 1/45 = 5/90, so f = 18 cm (power +5.6 diopters). On the 1/dᵢ vs 1/dₒ graph, the y-intercept is 1/f.'}},
    {lvl:'ap',q:'A convex car mirror (f = −20 cm). A car behind moves from 45 cm to 15 cm away. What happens to its image?',choices:['It becomes real and inverted','It grows but stays virtual, upright and smaller than the car','It grows larger than the car','It disappears'],correct:1,
     baseline:{el:'convex',f:20,dobj:45,rays:'3'},change:{dobj:15},changeText:'Car moved to 15 cm',watch:'mag',
     explain:{ap:'For f < 0, m = f/(f − dₒ) = 20/(20 + dₒ), always between 0 and 1. At 45 cm m = 0.31; at 15 cm m = 0.57. Objects in the mirror are closer than they appear because the image is shrunk.'}}
  ],
  lab:{bio:'<p><b>Question:</b> How does moving the candle change the image from a converging lens?</p><ol><li>Set f = 15 cm and turn the screen on.</li><li>Put the candle at 60, 45, 30, 20 and 10 cm. Each time, move the screen until the image is sharp (if you can) and record the image distance, height and type.</li><li>Note the distance where the image changes from real to virtual.</li></ol><p>Write a claim: when does a lens make a real image, and when a virtual one?</p>',
       honors:'<p><b>Question:</b> Does the thin-lens equation predict where real images form?</p><ol><li>Converging lens, f = 10 cm.</li><li>For dₒ = 15, 20, 25, 30, 40 and 50 cm, find the sharp image with the screen. Record dₒ, dᵢ and the image height.</li><li>Calculate 1/dₒ + 1/dᵢ and compare with 1/f; calculate m two ways (height ratio and −dᵢ/dₒ).</li></ol><p>Explain any differences, then predict and test one virtual case.</p>',
       ap:'<p><b>Question:</b> What is the focal length of the mystery lens?</p><ol><li>Select the Mystery lens. For at least six object distances, find the sharp image with the screen and record dₒ and dᵢ.</li><li>Graph 1/dᵢ against 1/dₒ and fit a straight line.</li><li>Use the slope and intercept to find f and its uncertainty, and the lens power in diopters.</li></ol><p><b>Claim–evidence–reasoning:</b> Is the slope what the thin-lens equation predicts? Explain why linearizing helps.</p>'},
  terms:[{t:'Converging lens',d:'Thicker in the middle. Bends parallel light together to a focal point.'},{t:'Diverging lens',d:'Thinner in the middle. Spreads parallel light out as if it came from a focal point.'},{t:'Focal point (F)',d:'Where parallel rays meet (or seem to come from) after the lens or mirror.'},{t:'Focal length (f)',d:'Distance from the lens or mirror to the focal point.'},{t:'Real image',d:'Formed where light rays actually meet. Can be caught on a screen; upside down.'},{t:'Virtual image',d:'Where rays only seem to come from. Cannot be put on a screen; upright.'},{t:'Principal rays',d:'Three easy-to-draw rays from the object tip: parallel, through the center, and through F.'},
    {lvl:'honors',t:'Thin-lens equation',d:'1/f = 1/dₒ + 1/dᵢ (also works for mirrors).'},{lvl:'honors',t:'Magnification',d:'m = hᵢ/hₒ = −dᵢ/dₒ. Negative m means inverted.'},{lvl:'honors',t:'Sign convention',d:'Real images and converging elements are positive; virtual images and diverging elements are negative.'},
    {lvl:'ap',t:'Lens power',d:'P = 1/f with f in metres, in diopters. Eyeglass prescriptions use it.'}],
  about:'<p>Image positions use 1/f = 1/dₒ + 1/dᵢ and m = −dᵢ/dₒ with the real-is-positive sign convention. Rays are drawn with the paraxial (thin-lens, small-angle) approximation: every ray bends at a single plane through the lens or mirror, so all three principal rays meet exactly at the image.</p><p>Real lenses and mirrors blur slightly (spherical aberration) and have thickness; this model ignores both. The mirror curve is drawn exaggerated so you can tell concave from convex. The screen view blurs the image by how far the screen is from the true image plane.</p><p><b>The virtual lab bench (Plane Mirrors).</b> A top view of a corkboard and a sheet of paper, drawn to scale. Pins are 1 mm thick and land within about 1 mm of where you aim (a seeded random scatter, so a reload keeps them where they were). The sight-line view computes the direction from your eye to each pin and to the image of A, which sits as far behind the mirror line as A is in front; pins count as lined up when they overlap within a pin’s width. The mirror is treated as silvered on its front surface, so the glass thickness is ignored. The protractor and ruler read the rays drawn from your own pins, so your angles and distances carry your own small errors.</p>',
  onClick(sim,x,y){if(sim.vlab)return;const ex=EX(sim.p);if(x<ex-10){const d=(ex-x)/PPC;BioLab.setValues(sim,{dobj:Math.round(clamp(d,3,60)*2)/2});}},
  draw(sim,ctx,vdt,k){if(pmB(sim)){pmDraw(sim,ctx,vdt,k);return;}const p=sim.p,s=sim.st,hon=atLeast('honors'),mir=isMirror(p),ex=EX(p),im=image(p),f=im.f;
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,392,800,58);
    // axis + ruler
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,AY);ctx.lineTo(800,AY);ctx.stroke();
    if(p.ruler){ctx.strokeStyle=PAL['cv-soft'];ctx.beginPath();for(let c=-80;c<=80;c+=1){const X=ex+c*PPC;if(X<0||X>800)continue;const h=c%10===0?9:c%5===0?6:2.5;ctx.moveTo(X,AY);ctx.lineTo(X,AY+h);}ctx.stroke();
      for(let c=-70;c<=70;c+=10){const X=ex+c*PPC;if(X<12||X>788||c===0)continue;txt(ctx,Math.abs(c)+'',X,AY+21,{s:10.5*k,a:'center',c:PAL['cv-soft']});}
      txt(ctx,'cm',794,AY+34,{s:10.5*k,a:'right',c:PAL['cv-soft']});}
    // element
    const H=120;
    if(!mir){const conv=(p.el==='conv'||p.el==='myst');ctx.fillStyle=PAL['cv-glass'];ctx.globalAlpha=.45;ctx.beginPath();
      if(conv){ctx.moveTo(ex,AY-H);ctx.quadraticCurveTo(ex+26,AY,ex,AY+H);ctx.quadraticCurveTo(ex-26,AY,ex,AY-H);}
      else{ctx.moveTo(ex-13,AY-H);ctx.lineTo(ex+13,AY-H);ctx.quadraticCurveTo(ex+2,AY,ex+13,AY+H);ctx.lineTo(ex-13,AY+H);ctx.quadraticCurveTo(ex-2,AY,ex-13,AY-H);}
      ctx.closePath();ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.stroke();
      if(p.el==='myst')pill(ctx,'?',ex,AY-H-14,'#7b3fe4','#fff',13*k);}
    else{const sag=p.el==='plane'?0:(p.el==='concave'?-1:1)*clamp(260/p.f,6,22);
      ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(ex+sag,AY-H);ctx.quadraticCurveTo(ex-sag,AY,ex+sag,AY+H);ctx.stroke();
      ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;for(let y=-H+6;y<=H;y+=12){const t=(y+H)/(2*H),xb=ex+sag*(1-4*t*(1-t))+ (1-2*0)*0;ctx.beginPath();ctx.moveTo(xb+3,AY+y);ctx.lineTo(xb+11,AY+y-8);ctx.stroke();}}
    txt(ctx,ELS[p.el],ex,AY+H+26,{s:13*k,a:'center',w:700});
    // focal points
    if(Number.isFinite(f)&&p.el!=='myst'){const sgn=mir?-1:1;const pts=mir?[[ex-f*PPC,'F']]:[[ex+f*PPC,'F'],[ex-f*PPC,'F']];if(hon)(mir?[[ex-2*f*PPC,'C']]:[[ex+2*f*PPC,'2F'],[ex-2*f*PPC,'2F']]).forEach(q=>pts.push(q));
      pts.forEach(([X,l])=>{if(X<4||X>796)return;ctx.fillStyle=l==='F'?PAL['s1']:PAL['cv-soft'];ctx.beginPath();ctx.arc(X,AY,4.5,0,6.29);ctx.fill();txt(ctx,l,X,AY-9,{s:12*k,a:'center',w:700,c:l==='F'?PAL['s1']:PAL['cv-soft']});});void sgn;}
    // candle
    const xo=ex-p.dobj*PPC,ho=p.h*VPC;
    function candle(x,hgt,ghost,flick){const up=hgt>=0,a=Math.abs(hgt),dir=up?-1:1,w=Math.max(4,a*0.22);ctx.save();if(ghost)ctx.globalAlpha=.55;
      ctx.fillStyle='#e9e1cf';ctx.strokeStyle='#8a7d63';ctx.lineWidth=1;ctx.beginPath();ctx.rect(x-w/2,up?AY-a*0.78:AY,w,a*0.78);ctx.fill();ctx.stroke();
      const fy=AY+dir*a*0.78,fh=a*0.22*(1+0.08*Math.sin(flick*9));ctx.fillStyle='#f6a21a';ctx.beginPath();ctx.moveTo(x-w*0.45,fy);ctx.quadraticCurveTo(x-w*0.5,fy+dir*fh*0.6,x,fy+dir*fh);ctx.quadraticCurveTo(x+w*0.5,fy+dir*fh*0.6,x+w*0.45,fy);ctx.closePath();ctx.fill();
      ctx.fillStyle='#fff3b0';ctx.beginPath();ctx.arc(x,fy+dir*fh*0.35,Math.max(1.2,w*0.16),0,6.29);ctx.fill();
      if(ghost){ctx.globalAlpha=.9;ctx.strokeStyle=PAL['cv-ink'];ctx.setLineDash([3,3]);ctx.strokeRect(x-w/2-3,up?AY-a-3:AY,w+6,a+3);ctx.setLineDash([]);}ctx.restore();}
    candle(xo,ho,false,s.ph);
    txt(ctx,'object',xo,AY+(p.ruler?40:20),{s:12*k,a:'center',c:PAL['cv-soft']});
    // principal rays
    const tip=[xo,AY-ho],nR=+p.rays;
    const imX=Number.isFinite(im.di)?imgX(p,im.di):NaN,imY=AY-im.m*ho;
    const hits=[];
    if(nR>=1)hits.push({y:AY-ho,c:PAL['s4'],l:mir?'1: parallel → reflects through F':'1: parallel → through F'});
    if(nR>=2)hits.push({y:AY,c:PAL['s2'],l:mir?'2: to the center → bounces at equal angle':'2: through the center → straight'});
    if(nR>=3){let yh;if(!Number.isFinite(f))yh=AY+ho*0.7;else{const Fx=mir?ex-f*PPC:ex-f*PPC;const den=Fx-xo;yh=Math.abs(den)<1e-6?NaN:tip[1]+(AY-tip[1])*(ex-xo)/den;}
      if(Number.isFinite(yh)&&Math.abs(yh-AY)<H*1.6)hits.push({y:yh,c:PAL['s3'],l:!Number.isFinite(f)?'3: any ray → equal angles':mir?'3: through F → reflects parallel':'3: through F → leaves parallel'});}
    const L=900;
    hits.forEach(hh=>{const P=[ex,hh.y];ctx.save();ctx.strokeStyle=hh.c;ctx.lineWidth=2.2;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(tip[0],tip[1]);ctx.lineTo(P[0],P[1]);ctx.stroke();
      let d;if(Number.isFinite(imX)){d=im.real?[imX-P[0],imY-P[1]]:[P[0]-imX,P[1]-imY];}
      else{d=[ex-tip[0],AY-tip[1]];if(mir)d[0]=-d[0];}                    // image at infinity: parallel to the central ray
      const n=Math.hypot(d[0],d[1])||1;d=[d[0]/n,d[1]/n];
      ctx.beginPath();ctx.moveTo(P[0],P[1]);ctx.lineTo(P[0]+d[0]*L,P[1]+d[1]*L);ctx.stroke();
      // travelling light dots
      ctx.fillStyle=hh.c;const seg1=Math.hypot(P[0]-tip[0],P[1]-tip[1]);for(let j=0;j<10;j++){const u=((s.ph*80+j*70)%700);let X,Y;if(u<seg1){X=tip[0]+(P[0]-tip[0])*u/seg1;Y=tip[1]+(P[1]-tip[1])*u/seg1;}else{X=P[0]+d[0]*(u-seg1);Y=P[1]+d[1]*(u-seg1);}if(X<0||X>800||Y<0||Y>392)continue;ctx.beginPath();ctx.arc(X,Y,2.6,0,6.29);ctx.fill();}
      if(!im.real&&Number.isFinite(imX)&&p.virt){ctx.globalAlpha=.75;ctx.setLineDash([5,5]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(P[0],P[1]);ctx.lineTo(imX,imY);ctx.stroke();ctx.setLineDash([]);}
      if(Number.isFinite(f)&&hh.c===PAL['s3']&&p.dobj<Math.abs(f)&&f>0&&p.virt){ctx.globalAlpha=.55;ctx.setLineDash([2,4]);ctx.beginPath();ctx.moveTo(tip[0],tip[1]);ctx.lineTo(ex-f*PPC,AY);ctx.stroke();ctx.setLineDash([]);}
      ctx.restore();});
    // ray legend
    if(hits.length){const rh=17*k;ctx.font='400 '+(12*k)+'px '+FONT;const bw=Math.max(...hits.map(hh=>ctx.measureText('Ray '+hh.l).width))+44;ctx.fillStyle=PAL['card'];ctx.globalAlpha=.92;rr(ctx,10,8,bw,10+hits.length*rh,7);ctx.fill();ctx.globalAlpha=1;hits.forEach((hh,i)=>{const y=8+5+rh*(i+.5);ctx.fillStyle=hh.c;ctx.fillRect(18,y-2,18,4);txt(ctx,'Ray '+hh.l,42,y,{s:12*k,b:'middle'});});}
    // image
    if(Number.isFinite(imX)){const onStage=imX>-20&&imX<820&&Math.abs(imY-AY)<AY+150;
      if(onStage){candle(imX,im.m*ho,!im.real,s.ph);pill(ctx,(im.real?'real image':'virtual image'),clamp(imX,60,740),clamp(im.m>0?imY-18:imY+18,20,385),im.real?'#2d6bd2':'#7b3fe4','#fff',11.5*k);}
      else{const X=clamp(imX,30,770);pill(ctx,(imX<0?'← ':'')+'image '+Math.abs(im.di).toFixed(0)+' cm away'+(imX>800?' →':''),X,AY-60,'#7b3fe4','#fff',11.5*k);}}
    else txt(ctx,'Rays leave parallel: no image',ex+(mir?-150:150),AY-120,{s:13*k,a:'center',w:700,c:PAL['s1']});
    // screen
    if(p.screen){const sx=mir?ex-p.scr*PPC:ex+p.scr*PPC,sh=110;ctx.fillStyle=PAL['cv-lamp'];ctx.fillRect(sx-3,AY-sh,6,2*sh);ctx.fillRect(sx-14,AY+sh,28,6);
      txt(ctx,'screen '+p.scr.toFixed(1)+' cm',sx,AY-sh-8,{s:11.5*k,a:'center',c:PAL['cv-soft']});
      // what the screen shows
      const bx=640,by=8,bw=148,bh=92;ctx.fillStyle=PAL['card'];rr(ctx,bx,by,bw,bh,8);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
      txt(ctx,'On the screen',bx+8,by+15,{s:11.5*k,w:700});
      ctx.save();rr(ctx,bx+8,by+22,bw-16,bh-30,5);ctx.clip();ctx.fillStyle='#f4f1e8';ctx.fillRect(bx+8,by+22,bw-16,bh-30);
      const cx=bx+bw/2,cy=by+22+(bh-30)/2;
      if(im.real&&Number.isFinite(im.di)){const blur=clamp(Math.abs(p.scr-im.di)/Math.max(im.di,1)*30,0,16),sc=clamp(Math.abs(im.m)*0.5,0.12,1.4);
        ctx.filter='blur('+blur.toFixed(1)+'px)';ctx.globalAlpha=clamp(1-blur/20,0.25,1);ctx.translate(cx,cy);ctx.scale(sc,im.m<0?-sc:sc);
        ctx.fillStyle='#e9d9a8';ctx.fillRect(-6,-10,12,40);ctx.fillStyle='#f6a21a';ctx.beginPath();ctx.ellipse(0,-20,7,12,0,0,6.29);ctx.fill();ctx.restore();
        if(blur<1.2)pill(ctx,'Sharp!',bx+bw-30,by+bh-14,'#1b7a45','#fff',11*k);else txt(ctx,'blurry',bx+bw-12,by+bh-8,{s:11*k,a:'right',c:'#6b6b6b'});}
      else{const g=ctx.createRadialGradient(cx,cy,2,cx,cy,70);g.addColorStop(0,'rgba(246,162,26,.35)');g.addColorStop(1,'rgba(246,162,26,0)');ctx.fillStyle=g;ctx.fillRect(bx,by,bw,bh);ctx.restore();txt(ctx,'only a dim glow',cx,cy+4,{s:11*k,a:'center',c:'#6b6b6b'});}}
    // equation strip (Honors+)
    if(hon&&Number.isFinite(im.di))txt(ctx,'1/'+p.dobj.toFixed(1)+' + 1/'+im.di.toFixed(1)+' = '+(1/p.dobj+1/im.di).toFixed(4)+(p.el==='myst'?'  = 1/f':(Number.isFinite(f)?'   1/f = '+(1/f).toFixed(4):'   1/f = 0'))+'   m = '+im.m.toFixed(2),790,438,{s:12.5*k,a:'right',w:700});
    const sc=sceneOn(sim);if(sc)pill(ctx,sc,ex,AY-H-36,'#3a3e45','#fff',12*k);
    txt(ctx,typeText(im),12,412,{s:13*k,w:700});
  }
};
BioLab.register(LENSES);
})();
