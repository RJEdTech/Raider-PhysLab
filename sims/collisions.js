(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL}=BioLab.h;

/* Collisions lab. Two carts on a low-friction track (1D) or two pucks on an air table (2D, Deep dive).
   Between collisions every object moves at constant velocity (no friction, no net external force).
   A collision is an instant impulse J along the line of centers n:
     J = (1 + e)(v_A − v_B)·n / (1/m_A + 1/m_B),  v_A −= (J/m_A)n,  v_B += (J/m_B)n
   e = 1 elastic, 0 < e < 1 partly elastic, e = 0 sticky (both then move at the center-of-mass velocity).
   Spring explosion: carts start at rest and touching; the spring's energy E becomes kinetic energy with
   total momentum 0, so v_A = −√(2E·m_B/(m_A(m_A+m_B))) and v_B = +√(2E·m_A/(m_B(m_A+m_B))).
   A run stops the moment an object reaches the end of the track or the edge of the table. */
const TRACK=2.0,L=0.18,PXM=350,X0=50,RAIL=150;          // 1D track: 2 m drawn 700 px wide
const TW=2.1,TH=1.2,R=0.08,S=240,TX=22,TY=42;          // 2D table: 2.1 m × 1.2 m, y measured upward
const RELEASE=0.5,TMAX=6,HITVIS=0.35;
const COLA='#b3323d',COLB='#2d63a8';
const z=v=>Math.abs(v)<5e-4?0:v;
const kgs=m=>String(+m.toFixed(2))+' kg';
const f2=v=>z(v).toFixed(2).replace('-','−');

function two(sim){return sim.p.mode==='table'&&atLeast('ap');}
function eOf(p){return p.type==='elastic'?1:p.type==='sticky'?0:p.e;}
function snap(s){const A=s.A,B=s.B;return {pA:A.m*A.vx,pB:B.m*B.vx,pAy:A.m*A.vy,pBy:B.m*B.vy,
  ke:0.5*A.m*(A.vx*A.vx+A.vy*A.vy)+0.5*B.m*(B.vx*B.vx+B.vy*B.vy),vA:[A.vx,A.vy],vB:[B.vx,B.vy]};}
function restart(sim){BioLab.reset(sim);syncUI(sim);}
function ctlBox(sim,id){const sec=sim.ui&&sim.ui.sec;if(!sec)return null;const el=sec.querySelector('#'+sim.def.id+'-'+id)||sec.querySelector('#'+sim.def.id+'-'+id+'-l');return el?el.closest('.ctl'):null;}
function syncUI(sim){const ui=sim.ui;if(!ui||!ui.sec)return;const p=sim.p,md=two(sim)?'table':'track';
  sim.def.controls.forEach(c=>{if(!c.show)return;const b=ctlBox(sim,c.id);if(b)b.hidden=!atLeast(c.lvl)||!c.show(p,sim);});
  if(ui.tiles)sim.def.metrics.forEach(m=>{const t=ui.tiles[m.id];if(!t)return;t.num.closest('.tile').hidden=!atLeast(m.lvl)||(m.mode&&m.mode!==md)||(m.show&&!m.show(p));});}
function tapePush(s){if(s.tape.length<90)s.tape.push([s.A.x,s.A.y,s.B.x,s.B.y]);}

function collide(sim){const s=sim.st,A=s.A,B=s.B,p=sim.p;let nx=1,ny=0;
  if(s.two){const dx=B.x-A.x,dy=B.y-A.y,d=Math.hypot(dx,dy);if(d>2*R)return;nx=dx/d;ny=dy/d;}
  else if(B.x-A.x>L)return;
  const vrel=(A.vx-B.vx)*nx+(A.vy-B.vy)*ny;if(vrel<=0)return;
  const e=eOf(p),J=(1+e)*vrel/(1/A.m+1/B.m);
  if(p.type==='sticky'){const M=A.m+B.m,vx=(A.m*A.vx+B.m*B.vx)/M,vy=(A.m*A.vy+B.m*B.vy)/M;A.vx=B.vx=vx;A.vy=B.vy=vy;s.stuck=true;}
  else{A.vx-=J/A.m*nx;A.vy-=J/A.m*ny;B.vx+=J/B.m*nx;B.vy+=J/B.m*ny;}
  if(!s.two){const gap=L-(B.x-A.x);if(gap>0){A.x-=gap/2;B.x+=gap/2;}}
  s.hit=true;s.tHit=s.rt;s.J=J;s.hitAt=[(A.x+B.x)/2,(A.y+B.y)/2];s.after=snap(s);}

function totals(sim){const s=sim.st,A=s.A,B=s.B,M=A.m+B.m;return {px:A.m*A.vx+B.m*B.vx,py:A.m*A.vy+B.m*B.vy,M,
  ke:0.5*A.m*(A.vx*A.vx+A.vy*A.vy)+0.5*B.m*(B.vx*B.vx+B.vy*B.vy),xc:(A.m*A.x+B.m*B.x)/M,yc:(A.m*A.y+B.m*B.y)/M};}
function keLost(sim){const s=sim.st;if(!s.after||s.ex||s.before.ke<=1e-9)return NaN;return z((s.before.ke-s.after.ke)/s.before.ke*100);}
function angleAfter(sim){const s=sim.st;if(!s.two||!s.after||s.stuck||s.ex)return NaN;const a=s.after.vA,b=s.after.vB,na=Math.hypot(a[0],a[1]),nb=Math.hypot(b[0],b[1]);
  if(na<1e-3||nb<1e-3)return NaN;return Math.acos(clamp((a[0]*b[0]+a[1]*b[1])/(na*nb),-1,1))*180/Math.PI;}

/* ---------- drawing helpers ---------- */
function arrow(ctx,x1,y1,x2,y2,col,w){const a=Math.atan2(y2-y1,x2-x1),l=Math.hypot(x2-x1,y2-y1);if(l<2)return;const h=Math.min(10,l*0.6);
  ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=w||3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2-h*0.7*Math.cos(a),y2-h*0.7*Math.sin(a));ctx.stroke();
  ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-h*Math.cos(a-0.45),y2-h*Math.sin(a-0.45));ctx.lineTo(x2-h*Math.cos(a+0.45),y2-h*Math.sin(a+0.45));ctx.closePath();ctx.fill();}
function hatch(ctx,x,y,w,h,col){ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.beginPath();for(let i=-h;i<w;i+=7){ctx.moveTo(x+i,y+h);ctx.lineTo(x+i+h,y);}ctx.stroke();ctx.restore();
  ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.strokeRect(x,y,w,h);}
function bump(ctx,x,y,r,t){ctx.save();ctx.translate(x,y);ctx.fillStyle='#f2b233';ctx.globalAlpha=clamp(1-t,0,1);ctx.beginPath();
  for(let i=0;i<16;i++){const a=i*Math.PI/8,rr_=i%2?r*0.45:r;ctx.lineTo(rr_*Math.cos(a),rr_*Math.sin(a));}ctx.closePath();ctx.fill();ctx.restore();}
function statusText(sim){const s=sim.st;if(s.done)return s.why==='time'?'Run over: time up':'Run over: reached the end';
  if(s.ex&&!s.released)return 'Spring compressed';if(!s.hit)return 'Before the collision';return s.ex?'After the explosion':'After the collision';}

/* Momentum bars (1D) and kinetic-energy bars (both modes) */
function momentumPanel(sim,ctx,k,x,y,w,h){const s=sim.st,b=s.before,a=s.after;
  ctx.fillStyle=PAL.card;rr(ctx,x,y,w,h,10);ctx.fill();ctx.strokeStyle=PAL.line;ctx.lineWidth=1;ctx.stroke();
  txt(ctx,'Momentum  p = mv  (kg·m/s)',x+14,y+22,{s:13*k,w:700,c:PAL['cv-ink']});
  const vals=[b.pA,b.pB,b.pA+b.pB].concat(a?[a.pA,a.pB,a.pA+a.pB]:[]),pm=Math.max(0.3,...vals.map(Math.abs))*1.2;
  const top=y+60,bot=y+h-26,y0=(top+bot)/2,sc=(bot-top)/2/pm,cols=[PAL.s1,PAL.s2,PAL['cv-ink']],names=['A','B','total'];
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x+14,y0);ctx.lineTo(x+w-14,y0);ctx.stroke();
  txt(ctx,'0',x+10,y0+4,{s:11*k,c:PAL['cv-soft'],a:'right'});
  const gw=(w-40)/2;
  ['Before','After'].forEach((g,gi)=>{const gx=x+26+gi*gw,src=gi?a:b,bw=Math.min(40,gw/4.4);
    txt(ctx,g,gx+gw/2-8,y+42,{s:12*k,w:700,c:PAL['cv-soft'],a:'center'});
    for(let i=0;i<3;i++){const cx=gx+gw/2-8+(i-1)*bw*1.35,lx=cx-bw/2;
      txt(ctx,names[i],cx,bot+18,{s:11.5*k,c:cols[i],w:700,a:'center'});
      if(!src){ctx.setLineDash([4,4]);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.strokeRect(lx,y0-26,bw,52);ctx.setLineDash([]);txt(ctx,'?',cx,y0+5,{s:14*k,c:PAL['cv-soft'],a:'center',w:700});continue;}
      const v=i===0?src.pA:i===1?src.pB:src.pA+src.pB,hh=v*sc;ctx.fillStyle=cols[i];ctx.globalAlpha=i===2?0.85:1;
      ctx.fillRect(lx,hh>=0?y0-hh:y0,bw,Math.max(1.5,Math.abs(hh)));ctx.globalAlpha=1;
      if(Math.abs(v)>0.004)txt(ctx,f2(v),cx,hh>=0?y0-hh-5:y0-5,{s:11*k,c:PAL['cv-ink'],a:'center'});}});
  ctx.strokeStyle=PAL.line;ctx.beginPath();ctx.moveTo(x+26+gw-4,y+32);ctx.lineTo(x+26+gw-4,bot+4);ctx.stroke();}
function energyPanel(sim,ctx,k,x,y,w,h,horiz){const s=sim.st,b=s.before,a=s.after,hon=atLeast('honors');
  ctx.fillStyle=PAL.card;rr(ctx,x,y,w,h,10);ctx.fill();ctx.strokeStyle=PAL.line;ctx.lineWidth=1;ctx.stroke();
  txt(ctx,'Kinetic energy (J)',x+14,y+22,{s:13*k,w:700,c:PAL['cv-ink']});
  const keB=b.ke,spring=s.ex?s.before.spring:0,keA=a?a.ke:NaN,lost=a&&!s.ex?Math.max(0,keB-keA):0;
  const em=Math.max(keB+spring,a?keA:0,0.05)*1.1;
  const key=PAL.s3;
  if(!horiz){const top=y+62,bot=y+h-28,sc=(bot-top)/em,bw=Math.min(62,w/5),xs=[x+w*0.3,x+w*0.7];
    const leg=s.ex?[['spring energy',PAL.s4,false],['kinetic',key,false]]:[['kinetic',key,false],['lost to heat and sound',PAL['cv-soft'],true]];
    let lx=x+14;leg.forEach(l=>{if(l[2])hatch(ctx,lx,y+33,12,10,l[1]);else{ctx.fillStyle=l[1];ctx.fillRect(lx,y+33,12,10);}txt(ctx,l[0],lx+16,y+42,{s:11*k,c:PAL['cv-soft']});lx+=24+ctx.measureText(l[0]).width;});
    ctx.strokeStyle=PAL['cv-soft'];ctx.beginPath();ctx.moveTo(x+12,bot);ctx.lineTo(x+w-12,bot);ctx.stroke();
    // before
    let hb=keB*sc;ctx.fillStyle=key;ctx.fillRect(xs[0]-bw/2,bot-hb,bw,hb);
    if(spring>0){const hs=spring*sc;ctx.fillStyle=PAL.s4;ctx.fillRect(xs[0]-bw/2,bot-hb-hs,bw,hs);hb+=hs;}
    txt(ctx,(keB+spring).toFixed(3),xs[0],bot-hb-6,{s:11*k,c:PAL['cv-ink'],a:'center'});
    txt(ctx,'Before',xs[0],bot+18,{s:12*k,w:700,c:PAL['cv-soft'],a:'center'});txt(ctx,'After',xs[1],bot+18,{s:12*k,w:700,c:PAL['cv-soft'],a:'center'});
    if(!a){ctx.setLineDash([4,4]);ctx.strokeStyle=PAL['cv-soft'];ctx.strokeRect(xs[1]-bw/2,bot-50,bw,50);ctx.setLineDash([]);txt(ctx,'?',xs[1],bot-20,{s:14*k,w:700,c:PAL['cv-soft'],a:'center'});return;}
    const ha=keA*sc;ctx.fillStyle=key;ctx.fillRect(xs[1]-bw/2,bot-ha,bw,ha);
    if(lost>1e-5){hatch(ctx,xs[1]-bw/2,bot-ha-lost*sc,bw,lost*sc,PAL['cv-soft']);}
    txt(ctx,keA.toFixed(3),xs[1],bot-ha-(lost>1e-5?lost*sc:0)-6,{s:11*k,c:PAL['cv-ink'],a:'center'});
    if(hon&&!s.ex){const pc=keLost(sim);pill(ctx,Math.round(pc)+'% lost',x+w-42,y+18,pc>1?PAL.s1:PAL.s3,'#fff',11*k);}
    return;}
  // horizontal (2D layout)
  const lx0=x+80,lw=w-150,sc=lw/em,rows=[['Before',y+44],['After',y+74]];
  rows.forEach(r=>txt(ctx,r[0],lx0-10,r[1]+12,{s:12*k,w:700,c:PAL['cv-soft'],a:'right'}));
  let wb=keB*sc;ctx.fillStyle=key;ctx.fillRect(lx0,y+44,wb,16);if(spring>0){ctx.fillStyle=PAL.s4;ctx.fillRect(lx0+wb,y+44,spring*sc,16);wb+=spring*sc;}
  txt(ctx,(keB+spring).toFixed(3)+' J',lx0+wb+6,y+57,{s:11*k,c:PAL['cv-ink']});
  if(!a){ctx.setLineDash([4,4]);ctx.strokeStyle=PAL['cv-soft'];ctx.strokeRect(lx0,y+74,60,16);ctx.setLineDash([]);txt(ctx,'?',lx0+70,y+87,{s:13*k,c:PAL['cv-soft'],w:700});return;}
  const wa=keA*sc;ctx.fillStyle=key;ctx.fillRect(lx0,y+74,wa,16);if(lost>1e-5)hatch(ctx,lx0+wa,y+74,lost*sc,16,PAL['cv-soft']);
  const pc=keLost(sim);txt(ctx,keA.toFixed(3)+' J'+(Number.isFinite(pc)&&pc>0.5?'  ('+Math.round(pc)+'% lost)':''),lx0+wa+(lost>1e-5?lost*sc:0)+6,y+87,{s:11*k,c:PAL['cv-ink']});}

function drawTrack(sim,ctx,k){const s=sim.st,p=sim.p,A=s.A,B=s.B,X=x=>X0+x*PXM,ap=atLeast('ap'),hon=atLeast('honors');
  txt(ctx,'Low-friction track, 2.0 m long',X0,26,{s:12*k,c:PAL['cv-soft']});
  const st=statusText(sim);pill(ctx,st,760-ctx.measureText(st).width/2-30,22,s.done?PAL['cv-soft']:s.hit?PAL.s3:PAL.s2,'#fff',12*k);
  // rail, end stops, ruler
  ctx.fillStyle=PAL['cv-soft'];ctx.globalAlpha=0.55;ctx.fillRect(X0-8,RAIL,716,8);ctx.globalAlpha=1;
  ctx.fillStyle=PAL['cv-ink'];ctx.fillRect(X0-12,RAIL-26,6,34);ctx.fillRect(X0+700+6,RAIL-26,6,34);
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.beginPath();for(let i=0;i<=20;i++){const x=X(i/10);ctx.moveTo(x,RAIL+10);ctx.lineTo(x,RAIL+(i%5?14:19));}ctx.stroke();
  for(let i=0;i<=4;i++)txt(ctx,(i/2).toFixed(1)+(i===4?' m':''),X(i/2),RAIL+31,{s:11*k,c:PAL['cv-soft'],a:'center'});
  // ticker tapes
  if(p.tape){const ty=[RAIL+46,RAIL+62];['A','B'].forEach((n,i)=>{ctx.fillStyle=PAL.card2;ctx.fillRect(X0,ty[i]-5,700,10);txt(ctx,n,X0-14,ty[i]+4,{s:11*k,w:700,c:i?PAL.s2:PAL.s1,a:'center'});
      ctx.fillStyle=i?PAL.s2:PAL.s1;s.tape.forEach(q=>{ctx.beginPath();ctx.arc(X(q[i?2:0]),ty[i],2.6,0,6.29);ctx.fill();});});
    txt(ctx,'Ticker tape: one dot every 0.1 s. Dots far apart = moving fast.',X0,RAIL+86,{s:11.5*k,c:PAL['cv-soft']});}
  // center of mass
  const T=totals(sim);if(ap){const xc=X(T.xc);ctx.setLineDash([4,4]);ctx.strokeStyle=PAL.s5;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(xc,52);ctx.lineTo(xc,RAIL+8);ctx.stroke();ctx.setLineDash([]);
    pill(ctx,'CM',xc,46,PAL.s5,'#fff',11*k);}
  // carts
  const H=36,yb=RAIL-6;[[A,COLA,'A'],[B,COLB,'B']].forEach(([c,col,n])=>{const x=X(c.x)-L*PXM/2,w=L*PXM;
    ctx.fillStyle='#2b2b30';ctx.beginPath();ctx.arc(x+12,yb+1,5,0,6.29);ctx.arc(x+w-12,yb+1,5,0,6.29);ctx.fill();
    ctx.fillStyle=col;rr(ctx,x,yb-H,w,H,5);ctx.fill();
    const nb=clamp(Math.round(c.m/0.5),1,6);ctx.fillStyle='#55575e';for(let i=0;i<nb;i++)ctx.fillRect(x+w/2-nb*4.5+i*9+1,yb-H-6,7,6);
    const kk=Math.min(k,1.3);txt(ctx,n,x+w/2,yb-H+15*kk,{s:14*kk,w:800,c:'#fff',a:'center'});txt(ctx,kgs(c.m),x+w/2,yb-5,{s:10.5*kk,c:'#fff',a:'center',w:600});});
  // bumpers / Velcro / spring between the carts
  const ax=X(A.x)+L*PXM/2,bx=X(B.x)-L*PXM/2;
  if(p.type==='sticky'){hatch(ctx,ax-1,yb-28,5,18,PAL['cv-ink']);hatch(ctx,bx-4,yb-28,5,18,PAL['cv-ink']);}
  else if(s.ex){if(!s.released){ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ax,yb-18);for(let i=1;i<=6;i++)ctx.lineTo(ax+(bx-ax)*i/6,yb-18+(i%2?-5:5));ctx.stroke();}
    else{const sx=X(A.x)+L*PXM/2;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(sx,yb-18);for(let i=1;i<=6;i++)ctx.lineTo(sx+3.5*i,yb-18+(i%2?-5:5));ctx.stroke();}}
  else{ctx.fillStyle=p.type==='elastic'?'#6b6e75':'#9a6b3a';rr(ctx,ax-1,yb-26,5,16,2);ctx.fill();rr(ctx,bx-4,yb-26,5,16,2);ctx.fill();}
  // collision flash and equal-and-opposite force arrows
  const since=s.hit?s.rt-s.tHit:99;if(since<HITVIS&&!s.done){const cx=(X(A.x)+X(B.x))/2;bump(ctx,cx,yb-18,16,since/HITVIS);
    if(hon){const fl=clamp(18+(s.J||0)*40,22,60);arrow(ctx,cx-6,yb-50,cx-6-fl,yb-50,PAL.s1,3);arrow(ctx,cx+6,yb-50,cx+6+fl,yb-50,PAL.s2,3);
      txt(ctx,'equal and opposite forces',cx,yb-62,{s:11*k,c:PAL['cv-ink'],a:'center',w:600});}}
  // velocity arrows and labels
  const ay=88,sc=70,close=(B.x-A.x)*PXM<150;
  if(s.stuck){const cx=(X(A.x)+X(B.x))/2,v=A.vx;arrow(ctx,cx,ay,cx+v*sc,ay,PAL['cv-ink'],3);txt(ctx,'together: '+f2(v)+' m/s',cx,ay-14,{s:12*k,w:700,c:PAL['cv-ink'],a:'center'});}
  else [[A,PAL.s1,-1],[B,PAL.s2,1]].forEach(([c,col,side])=>{const cx=X(c.x);if(!(since<HITVIS&&hon))arrow(ctx,cx,ay,cx+c.vx*sc,ay,col,3);
    const lab=Math.abs(c.vx)<0.005?'at rest':f2(c.vx)+' m/s';const al=close?(side<0?'right':'left'):'center';txt(ctx,lab,close?cx+side*-8:cx,ay-14,{s:12*k,w:700,c:col,a:al});});
}

function drawTable(sim,ctx,k){const s=sim.st,p=sim.p,A=s.A,B=s.B,X=x=>TX+x*S,Y=y=>TY+(TH-y)*S;
  txt(ctx,'Air table, 2.1 m × 1.2 m (top view)',TX,28,{s:12*k,c:PAL['cv-soft']});
  txt(ctx,'A: '+kgs(A.m)+'   B: '+kgs(B.m),TX+TW*S,28,{s:12*k,c:PAL['cv-ink'],w:600,a:'right'});
  ctx.fillStyle=PAL.card2;rr(ctx,TX,TY,TW*S,TH*S,6);ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle=PAL.line;for(let i=1;i<21;i++)for(let j=1;j<12;j++){ctx.beginPath();ctx.arc(X(i/10),Y(j/10),1.2,0,6.29);ctx.fill();}
  // strobe dots and center-of-mass path
  if(p.tape){s.tape.forEach((q,i)=>{ctx.fillStyle=PAL.s1;ctx.globalAlpha=0.55;ctx.beginPath();ctx.arc(X(q[0]),Y(q[1]),3,0,6.29);ctx.fill();ctx.fillStyle=PAL.s2;ctx.beginPath();ctx.arc(X(q[2]),Y(q[3]),3,0,6.29);ctx.fill();ctx.globalAlpha=1;});}
  const T=totals(sim);
  if(s.tape.length>1){ctx.setLineDash([4,4]);ctx.strokeStyle=PAL.s5;ctx.lineWidth=1.5;ctx.beginPath();s.tape.forEach((q,i)=>{const xc=(A.m*q[0]+B.m*q[2])/T.M,yc=(A.m*q[1]+B.m*q[3])/T.M;i?ctx.lineTo(X(xc),Y(yc)):ctx.moveTo(X(xc),Y(yc));});ctx.lineTo(X(T.xc),Y(T.yc));ctx.stroke();ctx.setLineDash([]);}
  ctx.strokeStyle=PAL.s5;ctx.lineWidth=2.5;const cx=X(T.xc),cy=Y(T.yc);ctx.beginPath();ctx.moveTo(cx-6,cy-6);ctx.lineTo(cx+6,cy+6);ctx.moveTo(cx+6,cy-6);ctx.lineTo(cx-6,cy+6);ctx.stroke();
  // angle measurement after the hit
  const ang=angleAfter(sim);if(Number.isFinite(ang)&&s.hitAt){const hx=X(s.hitAt[0]),hy=Y(s.hitAt[1]),a1=-Math.atan2(s.after.vA[1],s.after.vA[0]),a2=-Math.atan2(s.after.vB[1],s.after.vB[0]);
    ctx.setLineDash([6,5]);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(hx+150*Math.cos(a1),hy+150*Math.sin(a1));ctx.moveTo(hx,hy);ctx.lineTo(hx+150*Math.cos(a2),hy+150*Math.sin(a2));ctx.stroke();ctx.setLineDash([]);
    let lo=Math.min(a1,a2),hi=Math.max(a1,a2);if(hi-lo>Math.PI){const t=lo;lo=hi;hi=t+2*Math.PI;}ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(hx,hy,42,lo,hi);ctx.stroke();
    const mid=(lo+hi)/2;txt(ctx,Math.round(ang)+'°',hx+64*Math.cos(mid),hy+64*Math.sin(mid)+4,{s:13*k,w:700,c:PAL['cv-ink'],a:'center'});}
  // pucks
  const since=s.hit?s.rt-s.tHit:99;
  [[A,COLA,'A'],[B,COLB,'B']].forEach(([c,col,n])=>{ctx.fillStyle=col;ctx.beginPath();ctx.arc(X(c.x),Y(c.y),R*S,0,6.29);ctx.fill();ctx.strokeStyle='rgba(0,0,0,0.35)';ctx.lineWidth=2;ctx.stroke();
    txt(ctx,n,X(c.x),Y(c.y)+5,{s:14*Math.min(k,1.3),w:800,c:'#fff',a:'center'});});
  if(since<HITVIS){bump(ctx,X(s.hitAt[0]),Y(s.hitAt[1]),14,since/HITVIS);}
  [[A,PAL.s1],[B,PAL.s2]].forEach(([c,col])=>{const v=Math.hypot(c.vx,c.vy);if(v<0.01)return;const ux=c.vx/v,uy=-c.vy/v,x0=X(c.x)+ux*R*S,y0=Y(c.y)+uy*R*S;arrow(ctx,x0,y0,x0+ux*v*75,y0+uy*v*75,col,3);});
  if(p.tape)txt(ctx,'Dots every 0.1 s.  ✕ = center of mass',TX+8,TY+TH*S-8,{s:11*k,c:PAL['cv-soft']});
  // momentum vectors, before and after
  const px0=540,pw=246,boxes=[['Before',s.before,TY],['After',s.after,TY+150]];
  const chains=boxes.filter(b=>b[1]).map(b=>[[b[1].pA,b[1].pAy],[b[1].pA+b[1].pB,b[1].pAy+b[1].pBy]]);
  let ex=0.3,ey=0.15;chains.forEach(c=>c.forEach(q=>{ex=Math.max(ex,Math.abs(q[0]));ey=Math.max(ey,Math.abs(q[1]));}));
  const sc=Math.min((pw-60)/ex,52/ey);
  boxes.forEach(([lab,src,y])=>{ctx.fillStyle=PAL.card;rr(ctx,px0,y,pw,140,10);ctx.fill();ctx.strokeStyle=PAL.line;ctx.lineWidth=1;ctx.stroke();
    txt(ctx,'Momentum, '+lab.toLowerCase(),px0+12,y+20,{s:12.5*k,w:700,c:PAL['cv-ink']});
    const ox=px0+30,oy=y+84;ctx.fillStyle=PAL['cv-ink'];ctx.beginPath();ctx.arc(ox,oy,3,0,6.29);ctx.fill();
    if(!src){txt(ctx,'waiting for the collision',px0+pw/2,oy+4,{s:11.5*k,c:PAL['cv-soft'],a:'center'});return;}
    const ax_=ox+src.pA*sc,ay_=oy-src.pAy*sc,bx_=ax_+src.pB*sc,by_=ay_-src.pBy*sc;
    arrow(ctx,ox,oy,ax_,ay_,PAL.s1,3);arrow(ctx,ax_,ay_,bx_,by_,PAL.s2,3);ctx.setLineDash([5,4]);arrow(ctx,ox,oy,bx_,by_,PAL['cv-ink'],2);ctx.setLineDash([]);
    const tp=Math.hypot(src.pA+src.pB,src.pAy+src.pBy);txt(ctx,'total '+tp.toFixed(2)+' kg·m/s',px0+pw-12,y+132,{s:11*k,c:PAL['cv-ink'],a:'right',w:600});});
  txt(ctx,'red = A, blue = B, dashed = total',px0+pw/2,TY+300,{s:11*k,c:PAL['cv-soft'],a:'center'});
  energyPanel(sim,ctx,k,TX,TY+TH*S+12,TW*S,450-(TY+TH*S+12)-6,true);}

const SIM={
  id:'collisions',hash:'collisions',apUnit:4,order:1,tab:'Collisions lab',kind:'Virtual lab',
  card:'Crash carts together, stick them with Velcro or push them apart with a spring, and check whether momentum and kinetic energy survive.',
  title:'Collisions lab: momentum and kinetic energy',
  lede:{bio:'Send one cart into another and watch the momentum bars. Bouncy, sticky or exploding, the total momentum before equals the total momentum after.',
        honors:'Compare elastic, partly elastic and perfectly inelastic collisions. Momentum is always conserved; kinetic energy is conserved only in elastic collisions.',
        ap:'Test conservation of momentum in one and two dimensions, follow the center of mass through the collision, and measure the angle between paths after a glancing collision.'},
  scale:'Real scale: lab carts about 18 cm long with masses of 0.25–3 kg on a 2 m track, moving under 1.5 m/s. The collision itself lasts a few milliseconds, so the model treats it as instant.',
  timeScale:1,dtMax:0.002,prewarm:0,sampleDt:0.02,window:5,unit:'s',chChange:0,chReveal:2.6,
  controls:[
    {id:'mode',label:'Setup',type:'seg',def:'track',lvl:'ap',options:[{v:'track',l:'Track (1D)'},{v:'table',l:'Air table (2D)'}],onChange:restart},
    {id:'type',label:'Collision type',type:'select',def:'elastic',lvl:'bio',options:[{v:'elastic',l:'Bouncy (elastic)'},{v:'partial',l:'Partly bouncy'},{v:'sticky',l:'Sticky (Velcro)'},{v:'explode',l:'Spring explosion from rest'}],onChange:restart},
    {id:'e',label:'Bounciness (coefficient of restitution e)',type:'range',min:0,max:1,step:0.05,def:0.5,d:2,unit:'',lvl:'honors',help:'e = 1 is perfectly elastic, e = 0 is perfectly inelastic. Used for “Partly bouncy”.',show:p=>p.type==='partial',onChange:restart},
    {id:'mA',label:'Mass of A',type:'range',min:0.25,max:3,step:0.25,def:1,d:2,unit:' kg',lvl:'bio',onChange:restart},
    {id:'mB',label:'Mass of B',type:'range',min:0.25,max:3,step:0.25,def:1,d:2,unit:' kg',lvl:'bio',onChange:restart},
    {id:'vA',label:'Starting velocity of A',type:'range',min:-1,max:1.5,step:0.1,def:0.8,d:1,unit:' m/s',lvl:'bio',help:'Positive is to the right.',show:p=>p.type!=='explode',onChange:restart},
    {id:'vB',label:'Starting velocity of B',type:'range',min:-1.5,max:1,step:0.1,def:0,d:1,unit:' m/s',lvl:'bio',show:p=>p.type!=='explode',onChange:restart},
    {id:'spring',label:'Energy stored in the spring',type:'range',min:0.1,max:1,step:0.05,def:0.4,d:2,unit:' J',lvl:'bio',show:p=>p.type==='explode',onChange:restart},
    {id:'b',label:'Aim offset (how far off-center A hits B)',type:'range',min:-0.14,max:0.14,step:0.01,def:0.08,d:2,unit:' m',lvl:'ap',help:'0 is head-on. The pucks are 16 cm across.',show:(p,sim)=>p.mode==='table'&&p.type!=='explode',onChange:restart},
    {id:'tape',label:'Ticker tape and strobe dots',type:'toggle',def:true,lvl:'bio'}
  ],
  actions:[{id:'run',label:'Run again',primary:true,run(sim){restart(sim);}}],
  init(sim){const p=sim.p,tw=two(sim),ex=p.type==='explode';
    const s={rt:0,two:tw,ex,stuck:false,hit:false,tHit:-1,J:0,done:false,why:'',released:!ex,tape:[],nextTape:0.1,after:null,hitAt:null};
    if(!tw){s.A={m:p.mA,x:ex?TRACK/2-L/2:0.5,y:0,vx:ex?0:p.vA,vy:0};s.B={m:p.mB,x:ex?TRACK/2+L/2:1.2,y:0,vx:ex?0:p.vB,vy:0};}
    else if(ex){s.A={m:p.mA,x:1.05-R,y:0.6,vx:0,vy:0};s.B={m:p.mB,x:1.05+R,y:0.6,vx:0,vy:0};}
    else{s.A={m:p.mA,x:0.35,y:0.6+p.b,vx:p.vA,vy:0};s.B={m:p.mB,x:1.05,y:0.6,vx:p.vB,vy:0};}
    s.before=snap(s);s.before.spring=ex?p.spring:0;tapePush(s);return s;},
  step(sim,dt){const s=sim.st;if(s.done)return;const A=s.A,B=s.B;s.rt+=dt;
    if(s.ex&&!s.released&&s.rt>=RELEASE){const E=s.before.spring,M=A.m+B.m;A.vx=-Math.sqrt(2*E*B.m/(A.m*M));B.vx=Math.sqrt(2*E*A.m/(B.m*M));
      s.released=true;s.hit=true;s.tHit=s.rt;s.J=B.m*B.vx;s.hitAt=[(A.x+B.x)/2,A.y];s.after=snap(s);}
    A.x+=A.vx*dt;A.y+=A.vy*dt;B.x+=B.vx*dt;B.y+=B.vy*dt;
    if(!s.stuck&&!s.ex)collide(sim);
    while(s.rt>=s.nextTape-1e-9){tapePush(s);s.nextTape+=0.1;}
    let out=false;
    if(!s.two){if(A.x-L/2<=0){A.x=L/2;out=true;}if(B.x+L/2>=TRACK){B.x=TRACK-L/2;out=true;}}
    else[A,B].forEach(c=>{if(c.x<R||c.x>TW-R||c.y<R||c.y>TH-R){c.x=clamp(c.x,R,TW-R);c.y=clamp(c.y,R,TH-R);out=true;}});
    if(out){s.done=true;s.why='end';}else if(s.rt>=TMAX){s.done=true;s.why='time';}},
  metrics:[
    {id:'vA',label:'Velocity of A',unit:'m/s',lvl:'bio',min:-2,max:null,d:2,mode:'track',get:sim=>z(sim.st.A.vx)},
    {id:'vB',label:'Velocity of B',unit:'m/s',lvl:'bio',min:-2,max:null,d:2,mode:'track',get:sim=>z(sim.st.B.vx)},
    {id:'sA',label:'Speed of A',unit:'m/s',lvl:'ap',min:0,max:null,d:2,mode:'table',get:sim=>z(Math.hypot(sim.st.A.vx,sim.st.A.vy))},
    {id:'sB',label:'Speed of B',unit:'m/s',lvl:'ap',min:0,max:null,d:2,mode:'table',get:sim=>z(Math.hypot(sim.st.B.vx,sim.st.B.vy))},
    {id:'pA',label:'Momentum of A',unit:'kg·m/s',lvl:'honors',min:-2,max:null,d:2,mode:'track',get:sim=>z(sim.st.A.m*sim.st.A.vx)},
    {id:'pB',label:'Momentum of B',unit:'kg·m/s',lvl:'honors',min:-2,max:null,d:2,mode:'track',get:sim=>z(sim.st.B.m*sim.st.B.vx)},
    {id:'ptot',label:'Total momentum',unit:'kg·m/s',lvl:'bio',min:-2,max:null,d:2,mode:'track',get:sim=>z(totals(sim).px)},
    {id:'px',label:'Total momentum, x',unit:'kg·m/s',lvl:'ap',min:-2,max:null,d:3,mode:'table',get:sim=>z(totals(sim).px)},
    {id:'py',label:'Total momentum, y',unit:'kg·m/s',lvl:'ap',min:-2,max:null,d:3,mode:'table',get:sim=>z(totals(sim).py)},
    {id:'ke',label:'Total kinetic energy',unit:'J',lvl:'bio',min:0,max:null,d:3,get:sim=>totals(sim).ke},
    {id:'kelost',label:'Kinetic energy lost',unit:'%',lvl:'honors',min:0,max:100,d:0,show:p=>p.type!=='explode',get:keLost},
    {id:'vcm',label:'Center-of-mass velocity',unit:'m/s',lvl:'ap',min:-2,max:null,d:3,get:sim=>{const T=totals(sim);return z(sim.st.two?Math.hypot(T.px,T.py)/T.M:T.px/T.M);}},
    {id:'angle',label:'Angle between paths after',unit:'°',lvl:'ap',min:0,max:180,d:0,mode:'table',get:angleAfter}
  ],
  graphs:[
    {id:'vel',label:'Velocity of A and B',lvl:'bio',lines:['vA','vB']},
    {id:'ptotg',label:'Total momentum',lvl:'bio',lines:['ptot']},
    {id:'mom',label:'Momentum of A, B and total',lvl:'honors',lines:['pA','pB','ptot']},
    {id:'keg',label:'Total kinetic energy',lvl:'bio',lines:['ke']},
    {id:'pxy',label:'Total momentum, x and y (air table)',lvl:'ap',lines:['px','py']}
  ],
  defaultGraph:'vel',
  narrate(sim){const s=sim.st,p=sim.p,A=s.A,B=s.B,hon=atLeast('honors'),T=totals(sim),ptxt=s.two?'('+f2(T.px)+', '+f2(T.py)+') kg·m/s':f2(T.px)+' kg·m/s';
    const since=s.hit?s.rt-s.tHit:99;
    if(s.ex&&!s.released)return '<b>Spring compressed.</b> Both carts are at rest, so the total momentum is <b>0</b>. The spring stores '+f2(s.before.spring)+' J, ready to push the carts apart.';
    if(s.ex){const msg='<b>The spring pushed both carts</b> with equal and opposite forces for the same time, so they got equal and opposite momenta: A has '+f2(A.m*A.vx)+' and B has +'+f2(B.m*B.vx)+' kg·m/s. The total is still <b>0</b>.';
      return A.m!==B.m?msg+' The lighter cart moves faster.':msg;}
    if(!s.hit){if(s.done)return 'These carts never touched, so each kept its own momentum. Press <b>Run again</b> after changing the velocities so A catches B.';
      const lead=Math.abs(B.vx)<0.005&&!s.two?'Cart A carries all the momentum; cart B is at rest.':'Each object carries momentum p = mv.';
      return '<b>Before the collision.</b> '+lead+' Total momentum: <b>'+ptxt+'</b>. Nothing outside the carts pushes along the track, so this total can’t change.';}
    if(since<HITVIS)return '<b>Collision!</b> For a few milliseconds the carts push on each other. The forces are equal and opposite and last the same time, so the momentum A loses is exactly the momentum B gains.';
    let msg;const pc=keLost(sim);
    if(s.stuck)msg='<b>Stuck together</b>, the carts move at '+f2(A.vx)+' m/s. Total momentum is still '+ptxt+', but '+Math.round(pc)+'% of the kinetic energy became heat, sound and bending of the Velcro.';
    else if(p.type==='elastic')msg='<b>Elastic collision:</b> total momentum is still '+ptxt+' and kinetic energy is unchanged ('+T.ke.toFixed(3)+' J). Nothing was dented, heated or stuck.';
    else msg='<b>Partly elastic:</b> total momentum is still '+ptxt+', but '+Math.round(pc)+'% of the kinetic energy turned into heat and sound in the bumpers.';
    if(!s.two&&!s.stuck&&p.type==='elastic'&&Math.abs(A.m-B.m)<1e-9&&Math.abs(s.before.vB[0])<1e-9)msg+=' Equal masses: A stopped and B took all its velocity.';
    if(s.two&&hon){const a=angleAfter(sim);if(Number.isFinite(a))msg+=' The pucks leave '+Math.round(a)+'° apart.';}
    if(s.done)msg+=' <b>Run over.</b>';return msg;},
  tour:[
    {title:'Two carts on a track',text:'Cart A (red) rolls toward cart B (blue), which is at rest. The track has almost no friction, so nothing outside the carts speeds them up or slows them down.',focus:[8,90,784,72],pause:true,
      setup(sim){BioLab.setValues(sim,{mode:'track',type:'elastic',mA:1,mB:1,vA:0.8,vB:0,tape:true});restart(sim);}},
    {title:'Velocity arrows',text:'Each arrow shows a cart’s velocity: its length is the speed and it points the way the cart moves. A moves at 0.80 m/s; B is at rest.',focus:[8,52,784,48],speed:0.25},
    {title:'Ticker tape',text:'Every 0.1 s each cart leaves a dot. Evenly spaced dots mean constant velocity; wider spacing means faster.',focus:[8,186,784,52],speed:0.3},
    {title:'The collision, in slow motion',text:'Watch the instant they touch. The carts push on each other with <b>equal and opposite forces</b> for the same short time. A stops and B moves off at A’s old speed.',focus:[8,40,784,124],speed:0.1,setup(sim){restart(sim);}},
    {title:'Momentum before and after',text:'Momentum is mass × velocity. Compare the <b>total</b> bars: before and after are the same height. Momentum moved from A to B, but none was created or lost.',focus:[12,238,458,206],speed:1,pause:true},
    {title:'Kinetic energy',text:'In this bouncy (elastic) collision, the kinetic energy after equals the kinetic energy before. That is not true for every collision.',focus:[480,238,308,206],pause:true},
    {lvl:'honors',title:'A sticky collision',text:'Now the carts have Velcro. They move off together at half the speed. Momentum is still conserved, but half the kinetic energy turns into heat, sound and bent Velcro.',focus:[8,40,784,404],speed:0.35,
      setup(sim){BioLab.setValues(sim,{type:'sticky'});restart(sim);}},
    {lvl:'ap',title:'A glancing collision in 2D',text:'On the air table, A hits B off-center. Momentum is conserved separately in x and in y: the dashed total vectors before and after match. With equal masses and an elastic hit, the pucks leave at 90°. The ✕ (center of mass) moves in a straight line at constant speed throughout.',focus:[8,30,784,416],speed:0.35,
      setup(sim){BioLab.setValues(sim,{mode:'table',type:'elastic',b:0.08,vA:0.8,vB:0});restart(sim);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'track',type:'elastic',e:0.5,mA:1,mB:1,vA:0.8,vB:0,b:0.08,tape:true});restart(sim);},
  challenges:[
    {lvl:'bio',q:'Cart A (1 kg, 0.8 m/s) hits cart B (1 kg, at rest) in a partly bouncy collision. What happens to the total momentum?',choices:['It increases','It stays the same','It decreases'],correct:1,
     baseline:{mode:'track',type:'partial',e:0.5,mA:1,mB:1,vA:0.8,vB:0},changeText:'Carts released',watch:'ptotg',at:0,reveal:2.6,
     explain:'Total momentum stays 0.80 kg·m/s. The carts push on each other with equal and opposite forces, so whatever momentum A loses, B gains. Only an outside force can change the total.'},
    {lvl:'bio',q:'A bouncy (elastic) collision between two identical 1 kg carts. A moves at 0.8 m/s and B is at rest. What happens?',choices:['They both move forward at 0.4 m/s','A stops and B moves off at 0.8 m/s','A bounces back and B barely moves'],correct:1,
     baseline:{mode:'track',type:'elastic',mA:1,mB:1,vA:0.8,vB:0},changeText:'Carts released',watch:'vel',at:0,reveal:2.6,
     explain:'With equal masses in an elastic collision, the carts swap velocities: A stops dead and B leaves at 0.8 m/s. That is the only result that keeps both momentum and kinetic energy the same.'},
    {lvl:'bio',q:'A 1 kg cart and a 0.5 kg cart start at rest and a spring pushes them apart. Which one moves faster?',choices:['The 1 kg cart','They move at the same speed','The 0.5 kg cart'],correct:2,
     baseline:{mode:'track',type:'explode',mA:1,mB:0.5,spring:0.4},changeText:'Spring released',watch:'vel',at:0,reveal:2.4,
     explain:'Before, the total momentum is zero, so afterwards the carts must have equal and opposite momenta. The 0.5 kg cart needs twice the speed to match the 1 kg cart’s momentum.'},
    {lvl:'honors',q:'A 1.0 kg cart at 0.6 m/s sticks to a 0.5 kg cart at rest. How fast do they move together?',choices:['0.3 m/s','0.4 m/s','0.6 m/s'],correct:1,
     baseline:{mode:'track',type:'sticky',mA:1,mB:0.5,vA:0.6,vB:0},changeText:'Carts released',watch:'vel',at:0,reveal:2.6,
     explain:'Momentum before: 1.0 × 0.6 = 0.6 kg·m/s. After, 1.5 kg shares it: v = 0.6 / 1.5 = 0.4 m/s.'},
    {lvl:'honors',q:'A light 0.5 kg cart at 1.0 m/s sticks to a heavy 2.0 kg cart at rest. How much of the kinetic energy is lost?',choices:['None of it','About a quarter','Most of it (about 80%)'],correct:2,
     baseline:{mode:'track',type:'sticky',mA:0.5,mB:2,vA:1,vB:0},changeText:'Carts released',watch:'keg',at:0,reveal:2.6,
     explain:'Momentum is conserved: 0.5 kg·m/s shared by 2.5 kg gives 0.2 m/s. KE drops from 0.25 J to 0.05 J, so 80% becomes heat, sound and deformation. Perfectly inelastic collisions lose the most KE allowed by momentum conservation.'},
    {lvl:'honors',q:'In the spring explosion (1 kg and 0.5 kg, starting at rest), where does the carts’ kinetic energy come from?',choices:['From their momentum','From the energy stored in the compressed spring','It appears from nothing'],correct:1,
     baseline:{mode:'track',type:'explode',mA:1,mB:0.5,spring:0.4},changeText:'Spring released',watch:'keg',at:0,reveal:2.4,
     explain:'Total momentum stays zero, but kinetic energy rises from 0 to 0.40 J: the spring’s elastic potential energy became kinetic energy. Momentum is conserved; kinetic energy alone is not.'},
    {lvl:'ap',q:'On the air table, puck A (1 kg, 0.8 m/s) strikes an identical puck B at rest off-center in an elastic collision. What angle separates their paths afterward?',choices:['About 45°','About 90°','About 180°'],correct:1,
     baseline:{mode:'table',type:'elastic',mA:1,mB:1,vA:0.8,vB:0,b:0.08},changeText:'Puck A launched',watch:'pxy',at:0,reveal:3,
     explain:'Momentum conservation makes the velocity vectors form a triangle: v = v_A′ + v_B′. Kinetic energy conservation with equal masses gives v² = v_A′² + v_B′², the Pythagorean theorem, so the two velocities are perpendicular.'},
    {lvl:'ap',q:'A 2 kg cart at 1.5 m/s hits a 1 kg cart at rest elastically. What is the 1 kg cart’s velocity afterward?',choices:['1.5 m/s','2.0 m/s','3.0 m/s'],correct:1,
     baseline:{mode:'track',type:'elastic',mA:2,mB:1,vA:1.5,vB:0},changeText:'Carts released',watch:'vel',at:0,reveal:2.4,
     explain:'Solving momentum and energy conservation together gives v_B′ = 2m_A v_A/(m_A + m_B) = 2(2)(1.5)/3 = 2.0 m/s, and v_A′ = (m_A − m_B)v_A/(m_A + m_B) = 0.5 m/s.'},
    {lvl:'ap',q:'A 1.5 kg cart at 0.8 m/s hits a 0.5 kg cart at rest (e = 0.5). What happens to the center-of-mass velocity during the collision?',choices:['It drops, because energy is lost','It stays exactly the same','It jumps up during the impact'],correct:1,
     baseline:{mode:'track',type:'partial',e:0.5,mA:1.5,mB:0.5,vA:0.8,vB:0},changeText:'Carts released',watch:'vel',at:0,reveal:2.6,
     explain:'v_cm = (total momentum)/(total mass) = 1.2/2.0 = 0.60 m/s before and after. Internal forces can turn kinetic energy into heat, but they can’t change the system’s total momentum, so the center of mass glides on undisturbed.'}
  ],
  lab:{bio:'<p><b>Question:</b> Is momentum conserved in every kind of collision?</p><ol><li>Set both masses to 1 kg, A to 0.8 m/s and B to rest.</li><li>Run a bouncy, a partly bouncy and a sticky collision. After each run, press <b>Record trial</b>.</li><li>Then try a spring explosion from rest and record it.</li><li>Compare the total momentum before (0.80) with the total after, and compare the kinetic energy.</li></ol><p>Which quantity stayed the same every time? Which one changed?</p>',
       honors:'<p><b>Question:</b> How does the mass of the target change how much kinetic energy a sticky collision loses?</p><ol><li>Choose Sticky. Keep A at 1 kg and 0.8 m/s, B at rest.</li><li>Record trials with B = 0.25, 0.5, 1, 2 and 3 kg.</li><li>For each, calculate m_B/(m_A + m_B) and compare it with the fraction of KE lost.</li></ol><p>Explain your pattern with momentum conservation: what final speed does each trial require?</p>',
       ap:'<p><b>Question:</b> Is momentum conserved separately in x and y in a two-dimensional collision?</p><ol><li>Choose Air table, Elastic, equal 1 kg masses, A at 0.8 m/s.</li><li>Record trials with aim offsets −0.12, −0.06, 0, 0.06 and 0.12 m. Record p<sub>x</sub>, p<sub>y</sub>, the speeds and the angle between paths.</li><li>Repeat with Partly bouncy (e = 0.5) and with unequal masses.</li></ol><p><b>Claim–evidence–reasoning:</b> Make a claim about which quantities are conserved and when the 90° rule holds. Support it with your data and explain it using Newton’s third law and the definition of an elastic collision.</p>'},
  terms:[{t:'Momentum',d:'Mass times velocity, p = mv, in kg·m/s. It has a direction.'},{t:'Conservation of momentum',d:'With no outside force, the total momentum of a system before a collision equals the total after.'},
    {t:'Elastic collision',d:'A bouncy collision in which kinetic energy is also conserved.'},{t:'Inelastic collision',d:'A collision in which some kinetic energy turns into heat, sound or deformation.'},
    {t:'Explosion',d:'Objects pushed apart from rest. Their momenta are equal and opposite, so the total stays zero.'},
    {lvl:'honors',t:'Perfectly inelastic collision',d:'The objects stick together and move as one. This loses the most kinetic energy that momentum conservation allows.'},
    {lvl:'honors',t:'Coefficient of restitution (e)',d:'Relative speed apart ÷ relative speed together. 1 for elastic, 0 for sticky.'},
    {lvl:'honors',t:'Isolated system',d:'A group of objects with no net outside force on it, so its total momentum can’t change.'},
    {lvl:'ap',t:'Center of mass',d:'The mass-weighted average position, x_cm = Σmx/Σm. Its velocity equals total momentum ÷ total mass.'},
    {lvl:'ap',t:'Glancing collision',d:'An off-center collision. Momentum is conserved separately along x and along y.'}],
  about:'<p>Between collisions each cart or puck moves at constant velocity; friction and air resistance are ignored, so the system is isolated along the track (gravity and the normal force cancel).</p><p>A collision is treated as an instant impulse along the line joining the centers: J = (1 + e)(v<sub>A</sub> − v<sub>B</sub>)·n̂ / (1/m<sub>A</sub> + 1/m<sub>B</sub>). The coefficient of restitution e is 1 for elastic, 0.5 by default for partly elastic, and 0 for sticky, where both objects then move at the center-of-mass velocity. Real collisions last a few milliseconds; that detail is in the Impulse tool.</p><p>The explosion gives the spring’s stored energy E to the carts with total momentum zero: v<sub>A</sub> = −√(2E·m<sub>B</sub>/(m<sub>A</sub>(m<sub>A</sub>+m<sub>B</sub>))), v<sub>B</sub> = +√(2E·m<sub>A</sub>/(m<sub>B</sub>(m<sub>A</sub>+m<sub>B</sub>))). Pucks on the air table are frictionless disks 16 cm across; spin is ignored. A run stops when an object reaches the end of the track or the table edge.</p>',
  initVis(sim){},
  draw(sim,ctx,vdt,k){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);const kk=Math.min(k,1.5);
    if(sim.st.two){drawTable(sim,ctx,kk);return;}
    drawTrack(sim,ctx,kk);
    momentumPanel(sim,ctx,kk,12,238,458,206);energyPanel(sim,ctx,kk,480,238,308,206,false);},
  onLevel(sim){syncUI(sim);if(sim.st&&sim.st.two!==two(sim))restart(sim);}
};
BioLab.register(SIM);
})();
