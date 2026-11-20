/* Raider PhysLab story: Can you stop in time? (Motion in one dimension) */
(function(){
'use strict';
const {W,FONT,C,ctx,S,$,clamp,lerp,ease,ph,lin,mph,f1,fx1,rr,T,pill,rich,seg,tile,mul,axes,dot,handle,gauge,count}=Story;
const H=612,OFF=28,SH=224,GY=186,VX0=-6,RXL=40,RXW=1120,HAZ=70;

/* ---------- the model: steady speed, then steady braking ---------- */
function model(v0,tr,a){const tb=v0/a,ts=tr+tb,xr=v0*tr,xb=v0*v0/(2*a),xs=xr+xb;
  return{v0,tr,a,tb,ts,xr,xb,xs,
    x(t){if(t<=0)return 0;if(t<=tr)return v0*t;if(t>=ts)return xs;const u=t-tr;return xr+v0*u-.5*a*u*u;},
    v(t){if(t<=tr)return v0;if(t>=ts)return 0;return v0-a*(t-tr);},
    vAt(x){if(x<=xr)return v0;if(x>=xs)return 0;return Math.sqrt(Math.max(0,v0*v0-2*a*(x-xr)));}};}
const M20=model(20,1,5),M30=model(30,1,5);


/* ---------- drawing helpers for this lesson ---------- */
const pxm=()=>RXW/(S.vx1-VX0),RX=x=>RXL+(x-VX0)*pxm(),invRX=px=>VX0+(px-RXL)/pxm();
function span(x1,x2,y,c,label,o){o=o||{};ctx.save();if(o.alpha!=null)ctx.globalAlpha*=o.alpha;const a=RX(x1),b=Math.max(RX(x1)+3,RX(x2)),h=20;ctx.fillStyle=c;rr(a,y-h/2,b-a,h,5);ctx.fill();
  if(label){ctx.font='700 14px '+FONT;const tw=ctx.measureText(label).width;if(tw+14<b-a)T(label,(a+b)/2,y+5,{s:14,w:700,c:o.tc||'#fff',a:'center'});else if(b-a>6)T(label,b+7,y+5,{s:14,w:700,c:o.oc||c});}ctx.restore();}
const RND=mul(11),STARS=[],MTA=[],MTB=[];
for(let i=0;i<46;i++)STARS.push([RND()*W,RND()*86,RND()*.9+.4,RND()*.5+.25]);
for(let i=0;i<=20;i++)MTA.push(92+RND()*30-(i%6===2?22:0));
for(let i=0;i<=40;i++)MTB.push(131+RND()*13);

/* ---------- the scene ---------- */
function carBody(){ctx.beginPath();ctx.moveTo(-4.6,0.32);ctx.lineTo(-4.6,0.78);ctx.quadraticCurveTo(-4.58,0.95,-4.2,0.98);ctx.lineTo(-3.72,1.0);ctx.quadraticCurveTo(-3.3,1.42,-2.9,1.44);ctx.lineTo(-2.0,1.44);
  ctx.quadraticCurveTo(-1.6,1.4,-1.12,1.0);ctx.lineTo(-0.35,0.9);ctx.quadraticCurveTo(-0.02,0.85,0,0.62);ctx.lineTo(0,0.32);ctx.quadraticCurveTo(0,0.22,-0.12,0.22);ctx.lineTo(-4.48,0.22);ctx.quadraticCurveTo(-4.6,0.22,-4.6,0.32);ctx.closePath();}
function car(xf,o){o=o||{};const p=o.p||pxm();ctx.save();ctx.translate(o.px!=null?o.px:RX(xf),o.y||GY);ctx.scale(p,-p);if(o.alpha!=null)ctx.globalAlpha*=o.alpha;
  const wheels=(fill)=>{for(const wx of[-3.65,-0.95]){ctx.beginPath();ctx.arc(wx,0.34,0.34,0,7);ctx.fillStyle=fill;ctx.fill();}};
  if(o.outline){carBody();ctx.strokeStyle=o.outline;ctx.lineWidth=0.11;ctx.setLineDash([0.34,0.22]);ctx.stroke();ctx.setLineDash([]);for(const wx of[-3.65,-0.95]){ctx.beginPath();ctx.arc(wx,0.34,0.3,0,7);ctx.stroke();}ctx.restore();return;}
  if(o.flat){carBody();ctx.fillStyle=o.flat;ctx.fill();wheels(o.flat);ctx.restore();return;}
  carBody();ctx.fillStyle=o.fill||'#e9ecf1';ctx.fill();
  ctx.fillStyle='rgba(20,24,34,.28)';ctx.fillRect(-4.52,0.22,4.44,0.12);
  ctx.beginPath();ctx.moveTo(-3.6,1.03);ctx.quadraticCurveTo(-3.28,1.36,-2.92,1.37);ctx.lineTo(-2.02,1.37);ctx.quadraticCurveTo(-1.7,1.34,-1.3,1.03);ctx.closePath();ctx.fillStyle='#16202c';ctx.fill();
  ctx.fillStyle=o.fill||'#e9ecf1';ctx.fillRect(-2.52,1.0,0.08,0.4);
  wheels('#0b0c0f');for(const wx of[-3.65,-0.95]){ctx.beginPath();ctx.arc(wx,0.34,0.17,0,7);ctx.fillStyle='#a3a9b3';ctx.fill();}
  ctx.beginPath();ctx.ellipse(-0.1,0.68,0.11,0.08,0,0,7);ctx.fillStyle='#fff3c0';ctx.fill();
  ctx.fillStyle=o.brake?'#ff3b30':'#7c1d1d';ctx.fillRect(-4.6,0.68,0.13,0.17);
  ctx.restore();
  if(o.brake){const bx=(o.px!=null?o.px:RX(xf))-4.6*p,by=(o.y||GY)-0.76*p;const g=ctx.createRadialGradient(bx,by,0,bx,by,22);g.addColorStop(0,'rgba(255,60,48,.75)');g.addColorStop(1,'rgba(255,60,48,0)');ctx.fillStyle=g;ctx.fillRect(bx-22,by-22,44,44);}}
function deer(o){o=o||{};const p=o.p||pxm();ctx.save();ctx.translate(o.px,o.py);ctx.scale(p,-p);if(o.alpha!=null)ctx.globalAlpha*=o.alpha;
  const col='#b08a61',dark='#7d5f41';
  ctx.fillStyle=dark;ctx.fillRect(0.2,0,0.075,0.84);ctx.fillRect(1.06,0,0.075,0.86);
  ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(0.66,1.03,0.66,0.27,0,0,7);ctx.fill();
  ctx.fillRect(0.05,0,0.08,0.9);ctx.fillRect(1.19,0,0.085,0.92);
  ctx.beginPath();ctx.moveTo(0.0,1.08);ctx.lineTo(0.36,1.2);ctx.lineTo(0.2,1.64);ctx.lineTo(-0.1,1.7);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.ellipse(-0.15,1.68,0.22,0.11,0.22,0,7);ctx.fill();
  ctx.beginPath();ctx.ellipse(0.02,1.86,0.05,0.15,-0.55,0,7);ctx.fill();ctx.beginPath();ctx.ellipse(0.13,1.83,0.05,0.14,0.5,0,7);ctx.fill();
  ctx.fillStyle='#3a2a1c';ctx.beginPath();ctx.arc(-0.34,1.62,0.035,0,7);ctx.fill();
  ctx.strokeStyle='#e2d5b5';ctx.lineWidth=0.04;ctx.lineCap='round';
  for(const dx of[0,0.1]){ctx.beginPath();ctx.moveTo(0.04+dx,1.84);ctx.lineTo(0.0+dx,2.1);ctx.lineTo(-0.14+dx,2.26);ctx.moveTo(0.0+dx,2.1);ctx.lineTo(0.12+dx,2.28);ctx.moveTo(0.02+dx,1.97);ctx.lineTo(-0.1+dx,2.05);ctx.stroke();}
  ctx.fillStyle='#f1e9da';ctx.beginPath();ctx.ellipse(1.31,1.12,0.07,0.11,0,0,7);ctx.fill();
  ctx.fillStyle='#fffbd0';ctx.beginPath();ctx.arc(-0.2,1.71,0.03,0,7);ctx.fill();
  ctx.restore();}
function flag(x,o){const fx=RX(x);ctx.save();if(o.alpha!=null)ctx.globalAlpha*=o.alpha;seg(fx,208,fx,124,o.col,3);ctx.fillStyle=o.col;ctx.beginPath();ctx.moveTo(fx,122);ctx.lineTo(fx+30,133);ctx.lineTo(fx,144);ctx.closePath();ctx.fill();
  if(o.live){const pu=o.pulse?(Math.sin(performance.now()/260)+1)/2:0;if(o.pulse){ctx.beginPath();ctx.arc(fx,208,15+pu*7,0,7);ctx.strokeStyle='rgba(255,210,63,'+(.7-pu*.5)+')';ctx.lineWidth=3;ctx.stroke();}
    ctx.beginPath();ctx.arc(fx,208,13,0,7);ctx.fillStyle=o.col;ctx.fill();ctx.strokeStyle='#1c1c1f';ctx.lineWidth=2;ctx.stroke();T('◂ ▸',fx,213,{s:13,w:700,a:'center'});}
  ctx.restore();}
function scene(o){const m=o.m,p=pxm(),t=o.t||0;ctx.save();ctx.beginPath();ctx.rect(0,0,W,SH);ctx.clip();
  let g=ctx.createLinearGradient(0,0,0,152);g.addColorStop(0,'#0a1124');g.addColorStop(.5,'#232c57');g.addColorStop(.84,'#7c4a62');g.addColorStop(1,'#e09458');ctx.fillStyle=g;ctx.fillRect(0,0,W,152);
  for(const s of STARS){ctx.fillStyle='rgba(255,255,255,'+s[3]+')';ctx.fillRect(s[0],s[1],s[2],s[2]);}
  ctx.fillStyle='#1c2346';ctx.beginPath();ctx.moveTo(0,152);MTA.forEach((y,i)=>ctx.lineTo(i*W/20,y));ctx.lineTo(W,152);ctx.fill();
  ctx.fillStyle='#10152b';ctx.beginPath();ctx.moveTo(0,152);MTB.forEach((y,i)=>ctx.lineTo(i*W/40,y));ctx.lineTo(W,152);ctx.fill();
  ctx.fillStyle='#0d1120';ctx.fillRect(0,150,W,14);ctx.fillStyle='#262a31';ctx.fillRect(0,162,W,36);ctx.fillStyle='#3a3f48';ctx.fillRect(0,162,W,1.5);
  ctx.fillStyle='#161b19';ctx.fillRect(0,198,W,SH-198);
  ctx.fillStyle='rgba(236,196,84,.55)';for(let d=Math.ceil(VX0/12)*12;d<S.vx1+12;d+=12)ctx.fillRect(RX(d),171,3*p,2);
  const every=p<9.5?20:10;
  for(let d=0;d<=S.vx1;d+=10){const x=RX(d);ctx.fillStyle='#cfd4da';ctx.fillRect(x-1.5,162-1.2*p,3,1.2*p);ctx.fillStyle='#f2a93b';ctx.fillRect(x-1.5,162-1.2*p,3,3);
    ctx.fillStyle='#8f96a3';ctx.fillRect(x-.75,198,1.5,5);if(d%every===0)T(d===0?'0 m':String(d),x,219,{s:13,c:'#aeb4c0',a:'center'});}
  if(o.field){const a=RX(0),b=RX(91.44);ctx.fillStyle='#2f7d4f';ctx.fillRect(a,151,b-a,10);ctx.fillStyle='rgba(255,255,255,.8)';for(let i=0;i<=10;i++)ctx.fillRect(a+(b-a)*i/10-.5,151,1,10);pill('one football field: 91 m',(a+b)/2,140,{s:13,bg:'rgba(255,255,255,.9)'});}
  const xf=m.x(t),fxp=RX(xf);
  if(!o.noCar){g=ctx.createLinearGradient(fxp,0,fxp+46*p,0);g.addColorStop(0,'rgba(255,244,200,.34)');g.addColorStop(1,'rgba(255,244,200,0)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(fxp,GY-.7*p);ctx.lineTo(fxp+46*p,GY-3.2*p);ctx.lineTo(fxp+46*p,GY+.9*p);ctx.closePath();ctx.fill();}
  if(o.spot){ctx.save();ctx.strokeStyle='rgba(255,255,255,.65)';ctx.setLineDash([4,4]);ctx.lineWidth=1.5;ctx.strokeRect(RX(HAZ)-3,GY-2.3*p,1.7*p,2.3*p);ctx.restore();pill('deer’s spot',RX(HAZ)+.8*p,GY-2.3*p-16,{s:13,bg:'rgba(255,255,255,.88)'});}
  if(o.deer&&o.deer.alpha>0){deer({px:RX(HAZ+(o.deer.dx||0)),py:GY-3-(o.deer.hop||0),alpha:o.deer.alpha});}
  if(o.lens){const cx=clamp(RX(HAZ)+8,60,W-60),cy=78,r=40;seg(cx,cy+r,RX(HAZ)+8,GY-2.4*p,'rgba(255,255,255,.55)',1.5);ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,7);ctx.fillStyle='#1d2547';ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();ctx.clip();deer({px:cx-14,py:cy+32,p:27});ctx.restore();
    T('deer, 70 m ahead',cx-r-10,cy+5,{s:15,c:'#fff',w:600,a:'right'});}
  if(o.ghosts){for(let k=0;k<=Math.floor(Math.min(o.marks==null?99:o.marks,m.ts)+1e-6);k++){const xk=m.x(k);if(Math.abs(xk-xf)>.4)car(xk,{flat:'rgba(255,255,255,'+(.2*o.ghosts)+')'});}}
  if(o.marks!=null){const n=o.dense||1,r=n>1?2.6:5;for(let i=0;i<=Math.floor(Math.min(o.marks,m.ts)*n+1e-6);i++){const tk=i/n;ctx.beginPath();ctx.arc(RX(m.x(tk)),203,(i%n===0?5:r),0,7);ctx.fillStyle=tk<m.tr-1e-6?'#8fb6ff':'#ff8c9a';if(tk>=m.ts-1e-6)ctx.fillStyle='#fff';ctx.fill();}}
  if(o.ghostCar!=null){car(o.ghostCar,{flat:'rgba(150,120,255,.5)'});car(o.ghostCar,{outline:'#d6c9ff'});if(o.ghostCar-xf>7)pill('ghost car: no brakes',RX(o.ghostCar)-2.3*p,GY-1.45*p-18,{bg:C.violet,c:'#fff',s:13});}
  if(!o.noCar){car(xf,{brake:o.brake});if(p<7.5){ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(fxp-2.3*p-6,GY-1.45*p-13);ctx.lineTo(fxp-2.3*p+6,GY-1.45*p-13);ctx.lineTo(fxp-2.3*p,GY-1.45*p-3);ctx.fill();}}
  (o.flags||[]).forEach(f=>flag(f.x,f));
  if(o.speed){const v=m.v(t);pill(Math.round(mph(v))+' mph · '+f1(v)+' m/s',fxp-2.3*p,GY-1.45*p-20,{bg:'rgba(255,255,255,.94)',s:14});}
  if(o.clock!=null)pill('⏱ '+o.clock,20,52,{a:'left',bg:'rgba(255,255,255,.94)',s:16});
  if(o.phase)pill(o.phase[0],o.clock!=null?128:20,52,{a:'left',bg:o.phase[1],c:o.phase[2]||'#fff',s:16});
  if(o.note)pill(o.note.text,RX(o.note.x),o.note.y||132,{bg:o.note.bg||'#fff',c:o.note.c||C.ink,s:14});
  ctx.restore();ctx.fillStyle='#fff';ctx.fillRect(0,SH,W,H-SH);}


/* ---------- light-strip layers under the road ---------- */
function timeLabels(m,upTo,alpha){const K=Math.floor(Math.min(upTo,m.ts)+1e-6);for(let k=0;k<=K;k++){if(k<K&&RX(m.x(k+1))-RX(m.x(k))<25&&k===Math.round(m.ts)-1)continue;T(k+' s',RX(m.x(k)),243,{s:14,c:C.mute,a:'center',w:600,alpha});}}
function gapBars(m,prog,o){o=o||{};const n=Math.ceil(m.ts-1e-6);for(let k=0;k<n;k++){const a=lin(prog,k*.3,.5);if(a<=0)continue;const x1=m.x(k),x2=m.x(k+1),col=k<m.tr?C.blue:C.red;
    ctx.save();ctx.globalAlpha=a*(o.alpha==null?1:o.alpha);ctx.fillStyle=col;const A=RX(x1)+2,B=RX(x2)-2;rr(A,255,Math.max(3,B-A),7,3.5);ctx.fill();
    if(!o.noLabel)T(f1(x2-x1)+' m',(A+B)/2,283,{s:15,w:700,c:col,a:'center'});ctx.restore();}}


/* ---------- graphs ---------- */
const PG={x:96,y:566,w:400,h:245,tmax:6,ys:3.5};
const VG={x:716,y:566,w:430,h:245,tmax:6.14,vs:12.24};
const PX=t=>PG.x+t*PG.w/PG.tmax,PY=x=>PG.y-x*PG.ys,VX=t=>VG.x+t*VG.w/VG.tmax,VY=v=>VG.y-v*VG.vs;
function phaseCol(m,t){return t<m.tr?C.blue:(t<m.ts?C.red:C.gray);}
function curve(m,pt,t0,t1,w){const N=120;let prev=null,pc=null;ctx.save();ctx.lineWidth=w||3.5;ctx.lineCap='round';ctx.lineJoin='round';
  for(let i=0;i<=N;i++){const t=t0+(t1-t0)*i/N,P=pt(t),c=phaseCol(m,t-1e-6);if(prev){ctx.strokeStyle=pc;ctx.beginPath();ctx.moveTo(prev[0],prev[1]);ctx.lineTo(P[0],P[1]);ctx.stroke();}prev=P;pc=c;}ctx.restore();}
function posGraph(m,o){o=o||{};const a=o.alpha==null?1:o.alpha;if(a<=0)return;ctx.save();ctx.globalAlpha=a;
  axes(PG,{yt:[0,20,40,60],ys:PG.ys,tmax:PG.tmax,title:'Position (m)',sub:'where the car is',subx:112});
  const te=Math.min(5.8,o.upTo==null?5.8:o.upTo);curve(m,t=>[PX(t),PY(m.x(t))],0,te);
  for(let k=0;k<=Math.min(5,te);k++)dot(PX(k),PY(m.x(k)),4.5,phaseCol(m,k-1e-6));
  if(o.scrub!=null){const t=o.scrub,X=PX(t),Y=PY(m.x(t));seg(PG.x,Y,X,Y,C.gray,1.5,[4,4]);pill(f1(m.x(t))+' m',PG.x-34,Y,{s:13,bg:C.ink,c:'#fff'});
    if(o.tangent){const v=m.v(t),dx=PG.w/PG.tmax,dy=-v*PG.ys;const L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L;seg(X-ux*62,Y-uy*62,X+ux*62,Y+uy*62,C.teal,3);
      seg(X,Y,X+dx,Y,C.teal,1.5,[5,4]);seg(X+dx,Y,X+dx,Y+dy,C.teal,1.5,[5,4]);T('1 s',X+dx/2,Y+17,{s:13,c:C.teal,a:'center',w:600});
      pill(v>0.05?'steepness: '+f1(v)+' m each second':'flat: 0 m each second, stopped',clamp(X+dx+12,PG.x+150,PG.x+PG.w+60),Y+dy/2-(v>0.05?0:22),{s:14,bg:C.teal,c:'#fff',a:'left'});}
    handle(X,Y,o.pulse);}
  ctx.restore();}
function velAxes(alpha,yt){axes(VG,{yt:yt||[0,5,10,15,20],ys:VG.vs,tmax:VG.tmax,title:'Velocity (m/s)',sub:'how fast',subx:128,alpha});}
function velLine(m,alpha,w){ctx.save();ctx.globalAlpha*=alpha==null?1:alpha;ctx.lineCap='round';ctx.lineWidth=w||4;
  ctx.strokeStyle=C.blue;ctx.beginPath();ctx.moveTo(VX(0),VY(m.v0));ctx.lineTo(VX(m.tr),VY(m.v0));ctx.stroke();
  ctx.strokeStyle=C.red;ctx.beginPath();ctx.moveTo(VX(m.tr),VY(m.v0));ctx.lineTo(VX(m.ts),VY(0));ctx.stroke();
  ctx.strokeStyle=C.gray;ctx.beginPath();ctx.moveTo(VX(m.ts),VY(0));ctx.lineTo(VX(Math.min(VG.tmax,m.ts+.9)),VY(0));ctx.stroke();ctx.restore();}
function velBars(m,n,alpha,labels){const dt=1/n,N=Math.ceil(m.ts*n-1e-6);ctx.save();ctx.globalAlpha*=alpha==null?1:alpha;
  for(let i=0;i<N;i++){const t0=i*dt,h=(m.x(t0+dt)-m.x(t0))/dt,col=t0<m.tr-1e-6?C.blue:C.red,x=VX(t0),w=VX(t0+dt)-x,y=VY(h);
    ctx.fillStyle=col;ctx.globalAlpha=(alpha==null?1:alpha)*.38;ctx.fillRect(x,y,w,VG.y-y);ctx.globalAlpha=(alpha==null?1:alpha);ctx.strokeStyle=col;ctx.lineWidth=n>5?.8:1.6;ctx.strokeRect(x+.5,y,w-1,VG.y-y);
    if(labels&&n===1)T(f1(h),x+w/2,y-8,{s:15,w:700,c:col,a:'center'});}
  ctx.restore();}
function areaShapes(m,a1,a2){ctx.save();
  ctx.globalAlpha=a1;ctx.fillStyle='rgba(37,99,201,.26)';ctx.fillRect(VX(0),VY(m.v0),VX(m.tr)-VX(0),VG.y-VY(m.v0));ctx.strokeStyle=C.blue;ctx.lineWidth=2;ctx.strokeRect(VX(0),VY(m.v0),VX(m.tr)-VX(0),VG.y-VY(m.v0));
  ctx.globalAlpha=a2;ctx.fillStyle='rgba(193,20,48,.22)';ctx.beginPath();ctx.moveTo(VX(m.tr),VY(m.v0));ctx.lineTo(VX(m.tr),VG.y);ctx.lineTo(VX(m.ts),VG.y);ctx.closePath();ctx.fill();ctx.strokeStyle=C.red;ctx.stroke();ctx.restore();}

/* ---------- beats ---------- */
const CH=['The stop','Position','Velocity','Acceleration','The formula','Faster','The pattern','Your road'];
const yRow=k=>322+44*k;
function stripRows(m,bt,fade){for(let k=0;k<=5;k++){const r=bt==null?1:ph(bt,.4+.45*k,.6);if(r<=0)continue;const y=lerp(GY,yRow(k),r);ctx.save();ctx.globalAlpha=r*fade;
    ctx.fillStyle='#e6e6e1';ctx.fillRect(RXL,y,RXW,3);car(m.x(k),{y:y,fill:'#c9ced6'});T(k+' s',10,y-3,{s:15,w:700,c:C.mute});ctx.restore();}}
function compareBars(m,g,prevStop){const y0=452;T('Compare',RX(0),y0-18,{s:16,w:700,c:C.mute});
  if(g!=null){ctx.fillStyle=C.flag;rr(RX(0),y0,RX(g)-RX(0),24,6);ctx.fill();T('Your flag: '+Math.round(g)+' m',RX(g)+10,y0+18,{s:17,w:700});}
  const y1=y0+38;ctx.fillStyle=C.blue;rr(RX(0),y1,RX(m.xr)-RX(0),24,6);ctx.fill();ctx.fillStyle=C.red;rr(RX(m.xr),y1,RX(m.xs)-RX(m.xr),24,6);ctx.fill();
  if(RX(m.xs)>W-190)T('Real stop: '+f1(m.xs)+' m',RX(m.xs)-10,y1+18,{s:16,w:700,c:'#fff',a:'right'});else T('Real stop: '+f1(m.xs)+' m',RX(m.xs)+10,y1+18,{s:17,w:700});
  T(f1(m.xr)+' m before braking',RX(0),y1+46,{s:15,w:600,c:C.blue});T(f1(m.xb)+' m of braking',RX(m.xr)+8,y1+46,{s:15,w:600,c:C.red});
  if(prevStop){const y2=y1+66;ctx.fillStyle='#b9b9b4';rr(RX(0),y2,RX(prevStop)-RX(0),14,5);ctx.fill();T('At 45 mph: '+prevStop+' m',RX(prevStop)+10,y2+13,{s:15,c:C.mute,w:600});}}
function runBeat(m,bt,g,o){const t=clamp(bt-.5,0,m.ts+3),stopped=t>=m.ts;
  const sc={m,t:Math.min(t,m.ts),marks:Math.min(t,m.ts),ghosts:1,flags:g!=null?[{x:g,col:C.flag}]:[],speed:true,brake:t>=m.tr&&!stopped,clock:fx1(Math.min(t,m.ts))+' s',
    phase:t<=0?['You see the deer','#444']:(t<m.tr?['Foot still moving to the brake',C.blue]:(stopped?['Stopped','#444']:['Braking',C.red]))};
  Object.assign(sc,o(t,stopped));scene(sc);timeLabels(m,Math.min(t,m.ts),1);
  const tt=Math.min(t,m.ts),v=m.v(tt);tile(40,300,330,104,'Time',fx1(tt)+' s');tile(390,300,400,104,'Speed',Math.round(mph(v))+' mph',null);T(f1(v)+' m/s',390+18+T(Math.round(mph(v))+' mph',0,-99,{s:40,w:700})+14,382,{s:22,c:C.mute,w:600});gauge(738,352,45,v);
  tile(810,300,350,104,'Distance since you saw it',f1(m.x(tt))+' m');return stopped;}
function formulaLines(lines,bt){lines.forEach((L,i)=>{const a=bt==null?1:lin(bt,L.at||0,.5);if(a<=0)return;ctx.save();ctx.globalAlpha=a;if(L.sw){ctx.fillStyle=L.sw;rr(60,L.y-17,18,18,4);ctx.fill();}
    const ex=rich(L.parts,L.sw?90:60,L.y,L.s||24);if(L.note)T(L.note,L.nx||(L.sw?90:60),L.y+25,{s:15,c:C.mute});ctx.restore();});}
function tilesDraw(v,o){o=o||{};const N=v/10,tr=1,cols=['#C11430','#e2677c','#f3b1bc'];ctx.save();
  for(let j=0;j<N;j++)for(let i=0;i<N-j;i++){for(const inv of[0,1]){if(inv&&i>=N-j-1)continue;ctx.beginPath();
      if(!inv){ctx.moveTo(VX(tr+2*i),VY(10*j));ctx.lineTo(VX(tr+2*i+2),VY(10*j));ctx.lineTo(VX(tr+2*i),VY(10*j+10));}
      else{ctx.moveTo(VX(tr+2*i+2),VY(10*j));ctx.lineTo(VX(tr+2*i+2),VY(10*j+10));ctx.lineTo(VX(tr+2*i),VY(10*j+10));}
      ctx.closePath();ctx.fillStyle=o.strips?cols[i]:'rgba(193,20,48,.3)';ctx.globalAlpha=(o.alpha==null?1:o.alpha)*(o.strips?.9:1);ctx.fill();ctx.globalAlpha=o.alpha==null?1:o.alpha;ctx.strokeStyle=o.strips?'#fff':C.red;ctx.lineWidth=o.strips?2:1.6;ctx.stroke();}}
  ctx.restore();}
function sandboxModel(){return model(S.sb.v,S.sb.tr,S.sb.a);}
function verdict(m){if(m.xs<=HAZ)return['Stops '+f1(HAZ-m.xs)+' m short of the deer’s spot',C.good];const v=m.vAt(HAZ);return['Reaches the deer’s spot still doing '+Math.round(mph(v))+' mph',C.red];}

const BEATS=[
/* 0 */{ch:0,cap:'A wet November evening. You are doing <b>45 mph (20 m/s)</b>. A deer steps onto the road 70 m ahead. <b>Drag the yellow flag to where you think your car will stop.</b>',
  alt:'Just guess. There is no wrong answer here. You will see the real stop next.',nextLabel:'Lock in my guess',
  need:()=>S.g1==null?'Drag the yellow flag first.':null,
  draw(){scene({m:M20,t:0,deer:{alpha:1},lens:true,speed:true,flags:[{x:S.g1==null?30:S.g1,col:C.flag,live:true,pulse:S.g1==null}],phase:['Frozen at the moment you see the deer','#444']});
    const g=S.g1==null?30:S.g1;pill(S.g1==null?'drag me':'your guess: '+Math.round(g)+' m',RX(g),246,{bg:C.flag,s:15});
    tile(40,300,350,128,'Your speed','45 mph','20 meters every second');tile(425,300,350,128,'The deer','70 m ahead','about 15 car lengths');tile(810,300,350,128,'The road','Wet','and it is getting dark');
    T('Where will the car be when it finally stops?',W/2,500,{s:30,w:700,a:'center'});T('Put the flag there. Then lock in your guess.',W/2,540,{s:20,c:C.mute,a:'center'});},
  down(x,y){if(y<SH+40){this.move(x);return true;}},move(x){S.g1=clamp(Math.round(invRX(x)),4,84);}},
/* 1 */{ch:0,dur:6.4,cap:()=>'It took <b>60 m</b> to stop: 20 m while your foot was still moving to the brake, then 40 m of braking.'+(S.g1!=null?' Your flag was at <b>'+Math.round(S.g1)+' m</b>.'+(Math.abs(S.g1-60)<=4?' Good eye.':''):''),
  alt:'For the first second the car does not slow at all, because your foot is still on its way to the brake. Then the brakes take hold.',
  draw(bt){const st=runBeat(M20,bt,S.g1,(t,stopped)=>({deer:{alpha:stopped?1-lin(t,5.5,1):1,dx:stopped?lin(t,5.5,1)*8:0,hop:stopped?Math.abs(Math.sin((t-5.5)*9))*4*lin(t,5.5,.2):0},lens:t<.2}));
    if(st&&bt>5.9)compareBars(M20,S.g1);}},
/* 2 */{ch:0,dur:3.4,cap:'A camera flash every second leaves a dot. Each <b>gap</b> is how far you went in that one second. Big gap: fast. Small gap: slow. A gap of 20 m in 1 s is a speed of <b>20 m/s</b>.',
  alt:'Dots far apart mean the car moved a lot in that second. Dots close together mean it barely moved.',
  draw(bt){scene({m:M20,t:9,marks:9,ghosts:1});timeLabels(M20,9,1);gapBars(M20,bt-.4);
    const a=lin(bt,2.2,.6);if(a>0){ctx.save();ctx.globalAlpha=a;T('gap ÷ time = speed',W/2,380,{s:24,c:C.mute,a:'center',w:600});
      rich([['20 m',C.blue,700],[' ÷ 1 s = ',C.ink,500],['20 m/s',C.blue,700]],250,450,40);rich([['7.5 m',C.red,700],[' ÷ 1 s = ',C.ink,500],['7.5 m/s',C.red,700]],660,450,40);
      T('the first second',250,482,{s:17,c:C.mute});T('the fourth second',660,482,{s:17,c:C.mute});ctx.restore();}}},
/* 3 */{ch:1,dur:5.6,cap:'Stack the snapshots, one row for each second. Watch the nose of the car. It slants across the page while you are fast, then drops straight down once you have stopped.',
  alt:'Each row is a photo of the same road, one second later than the row above.',
  draw(bt){scene({m:M20,t:9,marks:9,ghosts:1});timeLabels(M20,9,1);stripRows(M20,bt,1);
    const te=5.6*lin(bt,3.3,1.7);if(te>0){curve(M20,t=>[RX(M20.x(t)),yRow(t)],0,te,4);for(let k=0;k<=Math.min(5,te);k++)dot(RX(M20.x(k)),yRow(k),5,phaseCol(M20,k-1e-6));}
    if(bt>5){const a=lin(bt,5,.5);pill('slants far across: fast',RX(13)+70,yRow(.5)-6,{bg:C.blue,c:'#fff',a:'left',alpha:a});pill('straight down: stopped',RX(60)+16,yRow(5.3),{bg:'#555',c:'#fff',a:'left',alpha:a});}}},
/* 4 */{ch:1,dur:3.6,cap:'Your class draws it with time across and position up. It is the same picture, turned. This is a <b>position graph</b>: where the car is at each moment.',
  alt:'Nothing new happened. The stack was only turned so that time reads left to right, the way graphs in class do.',
  draw(bt){scene({m:M20,t:9,marks:9,ghosts:1});timeLabels(M20,9,1);const q=ph(bt,.5,2.4);stripRows(M20,null,clamp(1-q*1.7,0,1));
    const pt=t=>[lerp(RX(M20.x(t)),PX(t),q),lerp(yRow(t),PY(M20.x(t)),q)];
    if(q<1){curve(M20,pt,0,5.6,4);for(let k=0;k<=5;k++){const P=pt(k);dot(P[0],P[1],5,phaseCol(M20,k-1e-6));}}
    posGraph(M20,{alpha:q<1?ph(bt,2.2,.7)*.999:1});
    if(bt>3){const a=lin(bt,3,.5);pill('steep: fast',PX(.5)+22,PY(10)+18,{bg:C.blue,c:'#fff',a:'left',alpha:a});pill('flat: stopped',PX(5.4),PY(60)-22,{bg:'#555',c:'#fff',alpha:a});}}},
/* 5 */{ch:1,cap:'<b>Drag the dot along the line.</b> Where the line is steep, the car covers road fast. Where it goes flat, the car has stopped. Steepness is speed.',
  alt:'A steep line means position is changing a lot each second. That is what moving fast means.',
  need:()=>(S.sMin>.8||S.sMax<4.7)?'Slide the dot from the start all the way to the flat part.':null,
  draw(){const t=S.scrub;scene({m:M20,t,marks:9,ghosts:.6,brake:t>=1&&t<5,speed:true});timeLabels(M20,9,1);posGraph(M20,{scrub:t,tangent:true,pulse:!S.touched});
    const v=M20.v(t);T('The car’s speedometer',905,304,{s:17,w:700,a:'center'});gauge(905,436,108,v);T(v>.05?f1(v)+' m each second':'0 m each second',905,582,{s:22,w:700,c:C.teal,a:'center'});},
  down(x,y){if(y>SH+30&&x<620){this.move(x);return true;}},move(x){S.touched=true;S.scrub=clamp((x-PG.x)/(PG.w/PG.tmax),0,5.7);S.sMin=Math.min(S.sMin,S.scrub);S.sMax=Math.max(S.sMax,S.scrub);}},
/* 6 */{ch:2,dur:5.2,cap:'Now lift each gap off the road and stand it up. 20 m in one second stands 20 tall. This is a <b>velocity graph</b>: how fast, second by second.',
  alt:'The height of each bar is how many meters the car covered in that second.',
  draw(bt){scene({m:M20,t:9,marks:9,ghosts:1});timeLabels(M20,9,1);gapBars(M20,9,{alpha:.28,noLabel:true});posGraph(M20,{alpha:.5});velAxes(ph(bt,0,.6));
    const bw=VG.w/VG.tmax;for(let k=0;k<5;k++){const s=.7+.6*k,q1=ph(bt,s,.9),q2=ph(bt,s+.9,.4);const x1=M20.x(k),x2=M20.x(k+1),L=(x2-x1)*pxm()-4,col=k<1?C.blue:C.red;
      if(bt<s)continue;const ax=lerp(RX(x1)+2,VX(k),q1),ay=lerp(258.5,VG.y,q1);ctx.save();ctx.translate(ax,ay);ctx.rotate(-Math.PI/2*q1);ctx.fillStyle=col;ctx.globalAlpha=lerp(1,.42,q2);ctx.fillRect(0,q1<1?-3.5:0,L,lerp(7,bw,q2));
      if(q2>=1){ctx.globalAlpha=1;ctx.strokeStyle=col;ctx.lineWidth=1.6;ctx.strokeRect(0,.5,L,bw-1);}ctx.restore();
      if(q2>.5)T(f1(x2-x1),VX(k)+bw/2,VG.y-L-8,{s:15,w:700,c:col,a:'center',alpha:(q2-.5)*2});}}},
/* 7 */{ch:2,cap:'<b>Take more snapshots each second.</b> The steps melt into a line. Flat while your foot is moving. Then a steady slide down to zero.',
  alt:'With more snapshots, each bar covers less time, so the steps get smaller until they look like one line.',
  act(d){if(d.n)S.n=+d.n;},
  need:()=>S.n<20?'Pick 20 snapshots per second.':null,
  ui:()=>'<span><b>Snapshots per second</b></span><span class="seg">'+[1,2,5,20].map(n=>'<button type="button" data-n="'+n+'" aria-pressed="'+(S.n===n)+'">'+n+'</button>').join('')+'</span>',
  draw(){scene({m:M20,t:9,marks:9,dense:S.n,ghosts:S.n>1?0:1});timeLabels(M20,9,1);posGraph(M20,{alpha:.5});velAxes(1);velBars(M20,S.n,1,true);if(S.n>=20)velLine(M20,1,3);}},
/* 8 */{ch:3,cap:()=>S.ans==null?'Look at the red slide. <b>How much speed does the car lose in each second of braking?</b>':
    (S.ans===5?'Yes. ':'Read the dots: 20, 15, 10, 5, 0. ')+'Every second of braking takes off 5 m/s. The speed keeps changing, but the <b>rate</b> it changes stays the same. That rate is <b>acceleration</b>: −5 m/s each second, written −5 m/s².',
  alt:'Read the numbers on the red part of the line: 20, 15, 10, 5, 0. Subtract any two neighbors.',
  act(d){if(d.ans&&S.ans==null){S.ans=+d.ans;S.bt=0;count('story/PhysLab/motion1d/accel-'+(S.ans===5?'right':'wrong'));}},
  need:()=>S.ans==null?'Pick an answer.':null,
  ui:()=>S.ans==null?[2.5,5,20].map(v=>'<button type="button" class="choice" data-ans="'+v+'">'+v+' m/s</button>').join(''):'<span class="small">Drag along the velocity line. Speed changes. Acceleration does not.</span>',
  draw(bt){const t=S.scrub,m=M20;scene({m,t,marks:9,ghosts:.6,brake:t>=1&&t<5,speed:true});timeLabels(m,9,1);posGraph(m,{scrub:t});velAxes(1);velLine(m,1);
    for(let k=0;k<=5;k++){dot(VX(k),VY(m.v(k)),5,phaseCol(m,k-1e-6));if(k<2)T(f1(m.v(k)),VX(k)+(k?-8:9),VY(m.v(k))+22,{s:16,w:700,c:phaseCol(m,k-1e-6),a:k?'right':'left'});else if(k<5)T(f1(m.v(k)),VX(k)-10,VY(m.v(k))+20,{s:16,w:700,c:C.red,a:'right'});}
    if(S.ans!=null){for(let k=1;k<5;k++){const a=lin(bt,.2+.25*(k-1),.4);if(a<=0)continue;ctx.save();ctx.globalAlpha=a;seg(VX(k),VY(m.v(k)),VX(k+1),VY(m.v(k)),C.teal,2,[5,4]);seg(VX(k+1),VY(m.v(k)),VX(k+1),VY(m.v(k+1))-7,C.teal,3);
        ctx.fillStyle=C.teal;ctx.beginPath();ctx.moveTo(VX(k+1)-6,VY(m.v(k+1))-9);ctx.lineTo(VX(k+1)+6,VY(m.v(k+1))-9);ctx.lineTo(VX(k+1),VY(m.v(k+1))-1);ctx.fill();T('−5',VX(k+1)+9,VY(m.v(k)-2.5)+5,{s:17,w:700,c:C.teal});ctx.restore();}
      const braking=t>=1&&t<5;pill('speed now: '+fx1(m.v(t))+' m/s',VG.x+VG.w-4,334,{a:'left',bg:C.ink,c:'#fff',s:16});
      pill(braking?'acceleration: −5 m/s²':'acceleration: 0 (speed not changing)',VG.x+VG.w-4,368,{a:'left',bg:C.teal,c:'#fff',s:16});
      handle(VX(t),VY(m.v(t)),!S.touched8);}},
  down(x,y){if(S.ans!=null&&y>SH+30&&x>640){this.move(x);return true;}},move(x){S.touched8=true;S.scrub=clamp((x-VG.x)/(VG.w/VG.tmax),0,5.7);}},
/* 9 */{ch:4,dur:3.6,cap:'Each bar was a gap from the road, so the space under the line <b>is</b> distance. Blue box: 20 m before your foot lands. Red triangle: 40 m of braking. Together, the 60 m.',
  alt:'Speed times time is distance. On this graph speed is the height and time is the width, so distance is the space inside.',
  draw(bt){const m=M20,a1=lin(bt,.3,.6),a2=lin(bt,1.3,.6);scene({m,t:9,marks:9,ghosts:.5});span(0,20,250,C.blue,'20 m',{alpha:a1});span(20,60,250,C.red,'40 m',{alpha:a2});
    velAxes(1);areaShapes(m,a1,a2);velLine(m,1);
    T('20 m',VX(.5),VY(10),{s:20,w:700,c:C.blue,a:'center',alpha:a1});T('40 m',VX(2.2),VY(5.5),{s:26,w:700,c:C.red,a:'center',alpha:a2});
    T('Distance = the space under the velocity line',60,326,{s:21,w:700});
    formulaLines([{at:.3,y:392,sw:C.blue,parts:[['20 m/s × 1 s',C.blue,700],['  =  20 m',C.ink,700]],note:'a box: before your foot lands'},
      {at:1.3,y:472,sw:C.red,parts:[['½ × 20 m/s × 4 s',C.red,700],['  =  40 m',C.ink,700]],note:'a triangle: half of a 20 by 4 box, because the speed drains away'},
      {at:2.4,y:552,parts:[['20 m',C.blue,700],[' + ',C.ink,500],['40 m',C.red,700],[' = 60 m to stop',C.ink,700]],s:30}],bt);}},
/* 10 */{ch:4,view1:106,cap:'<b>Drag through the stop.</b> The ghost car never brakes: it goes v₀ × t. Braking holds your car back by the amber wedge, ½at². What is left is how far you really went.',
  alt:'Without brakes you would be at the ghost car. The brakes cost you the amber part. Take it away and you get where the car really is.',
  need:()=>S.tauMax<3.8?'Drag the dot all the way to the stop.':null,
  draw(){const m=M20,u=S.tau,t=m.tr+u,xg=m.v0*u,lost=.5*m.a*u*u,xr=xg-lost;
    scene({m,t,ghostCar:m.xr+xg,brake:u<4,note:{x:m.xr,text:'brakes go on here',y:140}});
    seg(RX(m.xr),196,RX(m.xr),276,C.gray,1.5,[4,3]);
    span(m.xr,m.xr+xg,264,C.violet,'ghost car: '+fx1(xg)+' m');span(m.xr,m.xr+xr,241,C.red,'your car: '+fx1(xr)+' m');if(lost>.3)span(m.xr+xr,m.xr+xg,241,C.amber,'held back '+fx1(lost)+' m');
    velAxes(1);ctx.save();ctx.fillStyle='rgba(37,99,201,.10)';ctx.fillRect(VX(0),VY(20),VX(1)-VX(0),VG.y-VY(20));
    ctx.fillStyle='rgba(193,20,48,.25)';ctx.beginPath();ctx.moveTo(VX(1),VG.y);ctx.lineTo(VX(1),VY(20));ctx.lineTo(VX(t),VY(m.v(t)));ctx.lineTo(VX(t),VG.y);ctx.closePath();ctx.fill();
    ctx.fillStyle='rgba(194,122,0,.38)';ctx.beginPath();ctx.moveTo(VX(1),VY(20));ctx.lineTo(VX(t),VY(20));ctx.lineTo(VX(t),VY(m.v(t)));ctx.closePath();ctx.fill();
    ctx.strokeStyle=C.violet;ctx.lineWidth=2.5;ctx.setLineDash([7,5]);ctx.strokeRect(VX(1),VY(20),VX(t)-VX(1),VG.y-VY(20));ctx.restore();velLine(m,1);
    if(u>.5){T('t = '+fx1(u)+' s',(VX(1)+VX(t))/2,VY(20)+19,{s:15,w:700,c:C.violet,a:'center'});T('lost '+fx1(m.a*u)+' m/s',VX(t)+10,VY(20-m.a*u/2)+5,{s:15,w:700,c:C.amber});}
    handle(VX(t),VY(m.v(t)),S.tauMax<1.6);
    T('Time since the brakes went on:  t = '+fx1(u)+' s',60,326,{s:20,w:700});
    rich([['x',C.red,700],[' = ',C.ink,500],['v₀t',C.violet,700],[' + ',C.ink,500],['½at²',C.amber,700]],60,378,34);
    formulaLines([{y:434,sw:C.violet,parts:[['v₀t',C.violet,700],[' = 20 × '+fx1(u)+' = ',C.ink,500],[fx1(xg)+' m',C.violet,700]],note:'the ghost car, with no brakes'},
      {y:494,sw:C.amber,parts:[['½at²',C.amber,700],[' = ½ × (−5) × '+fx1(u)+'² = ',C.ink,500],['−'+fx1(lost)+' m',C.amber,700]],note:'how far braking holds you back'},
      {y:554,sw:C.red,parts:[['x',C.red,700],[' = '+fx1(xg)+' − '+fx1(lost)+' = ',C.ink,500],[fx1(xr)+' m',C.red,700]],note:'how far you really went since braking began'}]);},
  down(x,y){if(y>SH+30&&x>640){this.move(x);return true;}},move(x){S.tau=clamp((x-VG.x)/(VG.w/VG.tmax)-1,0,4);S.tauMax=Math.max(S.tauMax,S.tau);}},
/* 11 */{ch:5,view1:131,cap:'Same road, same driver, now <b>67 mph (30 m/s)</b>. That is one and a half times the speed. <b>Drag the flag to where you will stop now.</b>',
  alt:'Think about the picture: the blue box gets taller, and the red triangle gets taller and wider.',nextLabel:'Lock in my guess',
  need:()=>S.g2==null?'Drag the yellow flag first.':null,
  draw(){const g=S.g2==null?75:S.g2;scene({m:M30,t:0,deer:{alpha:1},lens:true,speed:true,flags:[{x:60,col:'#b9b9b4'},{x:g,col:C.flag,live:true,pulse:S.g2==null}],phase:['Frozen at the moment you see the deer','#444']});
    pill('last stop: 60 m',RX(60),272,{bg:'#e2e2de',s:14});pill(S.g2==null?'drag me':'your guess: '+Math.round(g)+' m',RX(g),246,{bg:C.flag,s:15});
    tile(40,300,350,128,'Your speed now','67 mph','30 meters every second');tile(425,300,350,128,'Last time, at 45 mph','60 m','to stop');tile(810,300,350,128,'The deer','70 m ahead','same spot');
    T('1.5 times the speed. How much more road?',W/2,500,{s:30,w:700,a:'center'});},
  down(x,y){if(y<SH+60){this.move(x);return true;}},move(x){S.g2=clamp(Math.round(invRX(x)),4,128);}},
/* 12 */{ch:5,view1:131,dur:8.6,cap:()=>'<b>120 m.</b> Twice as far, for one and a half times the speed. You pass the deer’s spot still doing <b>50 mph</b>.'+(S.g2!=null?' Your flag was at <b>'+Math.round(S.g2)+' m</b>.':''),
  alt:'Faster means more road used before you brake, and much more road used while braking.',
  draw(bt){const st=runBeat(M30,bt,S.g2,(t)=>({deer:{alpha:1-lin(t,1.05,.9),dx:lin(t,1.05,.9)*9,hop:Math.abs(Math.sin((t-1.05)*10))*4*lin(t,1.05,.2)},spot:t>1.3,lens:t<.2,
      note:t>2.53?{x:HAZ,y:104,text:'50 mph here',bg:C.red,c:'#fff'}:null}));
    if(st&&bt>8)compareBars(M30,S.g2,60);}},
/* 13 */{ch:5,view1:131,cap:'Why so far? <b>Tap each speed.</b> Each small triangle is 10 m of braking. Twice the speed makes the red triangle twice as wide <b>and</b> twice as tall: 4 tiles. Three times: 9.',
  alt:'Count the small triangles inside each big one. They are all the same size.',
  act(d){if(d.tile){S.tile=+d.tile;S.tiles[S.tile]=1;}},
  need:()=>Object.keys(S.tiles).length<3?'Tap all three speeds.':null,
  ui:()=>'<span><b>Speed</b></span><span class="seg">'+[[10,'22 mph'],[20,'45 mph'],[30,'67 mph']].map(a=>'<button type="button" data-tile="'+a[0]+'" class="'+(S.tiles[a[0]]?'done':'')+'" aria-pressed="'+(S.tile===a[0])+'">'+a[0]+' m/s · '+a[1]+'</button>').join('')+'</span>',
  enter(){S.tiles[S.tile]=1;},
  draw(){const v=S.tile,m=model(v,1,5);setVG(7.4,8.18);scene({m,t:99,spot:true});span(0,m.xr,250,C.blue,f1(m.xr)+' m');span(m.xr,m.xs,250,C.red,f1(m.xb)+' m');
    velAxes(1,[0,10,20,30]);ctx.save();ctx.fillStyle='rgba(37,99,201,.26)';ctx.fillRect(VX(0),VY(v),VX(1)-VX(0),VG.y-VY(v));ctx.strokeStyle=C.blue;ctx.lineWidth=2;ctx.strokeRect(VX(0),VY(v),VX(1)-VX(0),VG.y-VY(v));
    ctx.strokeStyle='#c9c9c4';ctx.setLineDash([5,5]);ctx.lineWidth=1.5;for(const vv of[10,20,30]){if(vv===v)continue;ctx.beginPath();ctx.moveTo(VX(1),VY(vv));ctx.lineTo(VX(1+vv/5),VY(0));ctx.stroke();}ctx.restore();
    tilesDraw(v);velLine(m,1,3);const N=v/10;T(N*N+(N===1?' tile':' tiles'),VX(1+v/5*.52)+26,VY(v*.55)-6,{s:22,w:700,c:C.red});
    T('Braking distance, counted in tiles',60,326,{s:21,w:700});
    [[10,1],[20,4],[30,9]].forEach((r,i)=>{const y=384+i*58,on=S.tiles[r[0]];ctx.save();ctx.globalAlpha=on?1:.25;if(r[0]===v){ctx.fillStyle='#f5f5f2';rr(48,y-34,560,50,10);ctx.fill();}
      rich([[r[0]+' m/s',C.ink,700],['   →   ',C.mute,500],[on?(r[1]+(r[1]===1?' tile':' tiles')):'? tiles',C.red,700],['   →   ',C.mute,500],[on?(r[1]*10+' m of braking'):'?',C.ink,700]],60,y,24);ctx.restore();});
    if(Object.keys(S.tiles).length>=3){T('Speed × 2, braking × 4.   Speed × 3, braking × 9.',60,568,{s:20,w:700,c:C.red});T('This is why the braking formula has v squared in it.',60,596,{s:16,c:C.mute});}}},
/* 14 */{ch:6,view1:131,dur:3.2,cap:'Count the tiles in each 2-second strip: <b>5, 3, 1</b>. Odd numbers, and they add up to a square. Galileo saw this pattern in falling balls. In the 1640s two Jesuits tested it from a tower in Bologna. It held.',
  alt:'The car loses the same speed in every strip, so each strip is two tiles shorter than the one before it.',
  ui:()=>'<span class="small">Giovanni Battista Riccioli and Francesco Maria Grimaldi dropped clay balls from the Asinelli tower and reported it in 1651. <a href="faith.html">Read the story in Faith and Physics</a>.</span>',
  draw(bt){const m=M30,cols=['#C11430','#e2677c','#f3b1bc'];setVG(7.4,8.18);scene({m,t:99,spot:true,marks:null});
    [[30,80,'50 m'],[80,110,'30 m'],[110,120,'10 m']].forEach((g,i)=>{const a=lin(bt,.3+i*.5,.5);span(g[0]+.2,g[1]-.2,250,cols[i],g[2],{alpha:a,tc:i===2?C.ink:'#fff'});});span(0,29.8,250,'#b9c7e6','before braking',{tc:'#33415c'});
    velAxes(1,[0,10,20,30]);tilesDraw(30,{strips:true});velLine(m,1,3);
    [[5,1.72,12,'#fff'],[3,3.72,7.5,'#fff'],[1,5.62,3,C.ink]].forEach((q,i)=>{const a=lin(bt,.3+i*.5,.5);ctx.save();ctx.globalAlpha=a;dot(VX(q[1]),VY(q[2]),i===2?15:20,'#fff');ctx.restore();T(String(q[0]),VX(q[1]),VY(q[2])+(i===2?8:10),{s:i===2?22:28,w:700,c:cols[0],a:'center',alpha:a});});
    T('Odd numbers build squares',60,326,{s:21,w:700});
    const gx=70,gy=356,cs=46;for(let r=0;r<3;r++)for(let c=0;c<3;c++){const k=Math.max(r,c),a=lin(bt,.3+(2-k)*.5,.5);ctx.save();ctx.globalAlpha=Math.max(.12,a);ctx.fillStyle=cols[2-k];rr(gx+c*cs+2,gy+(2-r)*cs+2,cs-4,cs-4,6);ctx.fill();ctx.restore();}
    [['5',cols[0],'the first 2 s of braking: 50 m'],['5 + 3 = 8',cols[1],'after 4 s: 80 m'],['5 + 3 + 1 = 9',cols[2],'stopped: 90 m of braking']].forEach((L,i)=>{const a=lin(bt,.3+i*.5,.5);ctx.save();ctx.globalAlpha=a;
      ctx.fillStyle=L[1];rr(240,372+i*50-17,18,18,4);ctx.fill();rich([[L[0],C.ink,700],['   '+L[2],C.mute,500]],268,372+i*50,21);ctx.restore();});
    T('Run the stop backward and the strips go 1, 3, 5:',60,548,{s:18,c:C.ink,w:600,alpha:lin(bt,2,.6)});T('the same pattern as a ball speeding up as it falls.',60,574,{s:18,c:C.ink,w:600,alpha:lin(bt,2,.6)});}},
/* 15 */{ch:7,cap:'Your turn. <b>Change the speed, the road, or how long before you brake.</b> Reading a text takes your eyes off the road for about 5 seconds (NHTSA). Watch what that does to the blue box.',
  alt:'Try one change at a time and watch which shape changes: the blue box or the red triangle.',
  uiStatic:true,uiSync:sbSync,replay(){S.sbRun=0;},
  act(d){if(d.road){S.sb.a=+d.road;S.sbRun=-1;sbSync();}if(d.run)S.sbRun=0;},
  input(t){if(t.id==='sb-v'){S.sb.v=+t.value;S.sbRun=-1;sbSync();}if(t.id==='sb-t'){S.sb.tr=+t.value;S.sbRun=-1;sbSync();}},
  ui:()=>{const b=S.sb;return'<label>Speed <input type="range" id="sb-v" min="10" max="35" step="1" value="'+b.v+'"><output id="sb-vo"></output></label>'+
    '<label>Seconds before you brake <input type="range" id="sb-t" min="0.5" max="5" step="0.5" value="'+b.tr+'"><output id="sb-to"></output></label>'+
    '<span class="seg" role="group" aria-label="Road">'+[[6.5,'Dry'],[5,'Damp'],[3.3,'Wet']].map(a=>'<button type="button" data-road="'+a[0]+'" aria-pressed="'+(b.a===a[0])+'">'+a[1]+'</button>').join('')+'</span>'+
    '<button type="button" class="btn" data-run="1">▶ Run it</button>';},
  enter(){S.sbRun=-1;},
  draw(){const m=sandboxModel(),run=S.sbRun>=0,t=run?Math.min(S.sbRun,m.ts):99,vd=verdict(m);
    setVG(Math.max(6.14,m.ts+.9),Math.min(12.24,245/Math.max(20,m.v0)));
    scene({m,t,spot:true,field:true,brake:run&&t>=m.tr&&t<m.ts,note:(!run||S.sbRun>=m.ts)?{x:Math.min(m.xs,S.vx1-22),y:108,text:vd[0],bg:vd[1],c:'#fff'}:{x:m.x(t),y:108,text:Math.round(mph(m.v(t)))+' mph'}});
    span(0,m.xr,250,C.blue,f1(m.xr)+' m');span(m.xr,m.xs,250,C.red,f1(m.xb)+' m');
    const vt=m.v0>=30?[0,10,20,30]:(m.v0>20?[0,10,20]:[0,5,10,15,20]);velAxes(1,vt);areaShapes(m,1,1);velLine(m,1);
    if(run){const tt=Math.min(S.sbRun,m.ts);dot(VX(tt),VY(m.v(tt)),7,'#fff',C.ink);}
    T('Stopping distance',60,326,{s:21,w:700});
    formulaLines([{y:386,sw:C.blue,parts:[[f1(m.v0)+' m/s × '+f1(m.tr)+' s',C.blue,700],['  =  '+f1(m.xr)+' m',C.ink,700]],note:'before your foot lands ('+Math.round(mph(m.v0))+' mph)'},
      {y:462,sw:C.red,parts:[['½ × '+f1(m.v0)+' m/s × '+f1(m.tb)+' s',C.red,700],['  =  '+f1(m.xb)+' m',C.ink,700]],note:'while braking at −'+m.a+' m/s²'},
      {y:540,parts:[[f1(m.xr)+' m',C.blue,700],[' + ',C.ink,500],[f1(m.xb)+' m',C.red,700],[' = '+f1(m.xs)+' m to stop',C.ink,700]],s:28}]);
    }}
];
function setVG(tmax,vs){VG.tmax=tmax;VG.vs=vs;}


/* ---------- sandbox controls ---------- */
function sbSync(){const b=S.sb,vo=$('sb-vo'),to=$('sb-to');if(vo)vo.textContent=b.v+' m/s · '+Math.round(mph(b.v))+' mph';if(to)to.textContent=b.tr+' s'+(b.tr<=1?' · paying attention':(b.tr>=5?' · reading a text':''));
  $('act').querySelectorAll('[data-road]').forEach(x=>x.setAttribute('aria-pressed',String(+x.dataset.road===b.a)));}

Story.run({id:'motion1d',lab:'PhysLab',confusedId:'motion-story',H:H,off:OFF,chapters:CH,beats:BEATS,
  title:'Raider PhysLab · Can you stop in time? (Motion in one dimension, story version)',
  words:[['position',/position/i],['velocity',/velocit/i],['acceleration',/accelerat/i],['distance',/distance/i],['slope or steepness',/slope|steep/i]],
  state:{vx1:85.5,g1:null,g2:null,scrub:2.2,sMin:9,sMax:0,touched:false,touched8:false,n:1,ans:null,tau:1.5,tauMax:0,tile:10,tiles:{},sb:{v:20,tr:1,a:5},sbRun:-1},
  frozen(S,qs){if(qs.has('sbv'))S.sb.v=+qs.get('sbv');if(qs.has('sbt'))S.sb.tr=+qs.get('sbt');if(qs.has('sba'))S.sb.a=+qs.get('sba');S.sMin=0;S.sMax=6;S.tauMax=4;S.tiles={10:1,20:1,30:1};S.touched=true;},
  reset(S){Object.assign(S,{g1:null,g2:null,ans:null,n:1,tiles:{},tile:10,sMin:9,sMax:0,tauMax:0,tau:1.5,touched:false,touched8:false});},
  frame(dt,frozen){if(S.sbRun>=0)S.sbRun+=dt;const last=S.beat===BEATS.length-1,target=last?Math.max(85.5,Math.min(430,sandboxModel().xs+18)):(BEATS[S.beat].view1||85.5);
    S.vx1=frozen?target:S.vx1+(target-S.vx1)*Math.min(1,dt*5);},
  preDraw(){setVG(6.14,12.24);},
  copyLines(S){return['My flag at 45 mph: '+(S.g1==null?'(skipped)':Math.round(S.g1)+' m')+'. Real stop: 60 m.','My flag at 67 mph: '+(S.g2==null?'(skipped)':Math.round(S.g2)+' m')+'. Real stop: 120 m.',
    'Speed lost each second of braking: I picked '+(S.ans==null?'(skipped)':S.ans+' m/s'+(S.ans===5?' (correct)':' (the answer is 5 m/s)'))];}});
})();
