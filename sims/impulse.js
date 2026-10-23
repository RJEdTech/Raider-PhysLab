(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,axes}=BioLab.h;

/* Impulse and the egg drop. Each impact is a half-sine force pulse F(t) = F_peak·sin(πt/τ) lasting τ.
   Its area (the impulse) is J = (2/π)·F_peak·τ, and the impulse–momentum theorem fixes J = Δp:
     stick (egg, clay, car occupant): Δp = m·v      bounce (rubber ball, e = 0.8): Δp = m·v·(1 + e)
   so F_peak = π·Δp/(2τ) and the average force is Δp/τ. Stopping distance for a stick is v·τ/2.
   Contact times: concrete 2 ms, carpet 8 ms, foam pad 30 ms, pillow 80 ms.
   Car crash (75 kg dummy): the car's front stops in 40 ms (rigid) or 120 ms (crumple zone). A belted dummy
   stops over the car's time + 60 ms (+90 ms with an airbag). An unbelted dummy keeps moving until it has
   slid 0.45 m forward relative to the car, then stops against the dashboard in 8 ms.
   The impact is played back in slow motion: 40× for drops, 15× for the car. Weight during the brief
   contact (mg·τ) is ignored. */
const G=9.8,EGG=0.06,BALL=0.15,DUMMY=75,CRACK=30,GAP=0.45,EBALL=0.8;
const SURF={concrete:{l:'Concrete',tau:0.002,col:'#8d9096',ink:'#fff'},carpet:{l:'Carpet',tau:0.008,col:'#9b4a4a',ink:'#fff'},foam:{l:'Foam pad',tau:0.03,col:'#e2bd3f',ink:'#3a3000'},pillow:{l:'Pillow',tau:0.08,col:'#d9dee8',ink:'#2c3340'}};
const REST={none:{l:'No seat belt',add:null},belt:{l:'Seat belt',add:0.06},airbag:{l:'Seat belt and airbag',add:0.09}};
const SL={drop:40,car:15},APPROACH=1.0,GPXM=100,CPXM=48;

function relCar(v0,tc,t){return t<tc?(v0/2)*(t-(tc/Math.PI)*Math.sin(Math.PI*t/tc)):v0*t-v0*tc/2;}
function pars(sim){const p=sim.p,o={obj:p.obj};
  if(p.obj==='car'){o.m=DUMMY;o.v0=p.kmh/3.6;o.tc=p.front==='crumple'?0.12:0.04;const r=REST[p.rest]||REST.belt;
    if(r.add===null){o.tau=0.008;let lo=0,hi=2;for(let i=0;i<50;i++){const mid=(lo+hi)/2;if(relCar(o.v0,o.tc,mid)<GAP)lo=mid;else hi=mid;}o.t0=lo;}
    else{o.tau=o.tc+r.add;o.t0=0;}
    o.e=0;o.J=o.m*o.v0;o.unit='kN';o.fs=1000;}
  else{const ball=p.obj==='ball';o.m=ball?BALL:EGG;o.v0=Math.sqrt(2*G*p.h);o.tau=(SURF[p.surface]||SURF.concrete).tau;o.t0=0;o.e=ball&&p.ball==='rubber'?EBALL:0;
    o.J=o.m*o.v0*(1+o.e);o.unit='N';o.fs=1;}
  o.Fpk=Math.PI*o.J/(2*o.tau);o.Favg=o.J/o.tau;o.tEnd=o.t0+o.tau;o.tImp=Math.max(o.tEnd,o.tc||0);o.gpk=o.Fpk/(o.m*G);
  o.dist=p.obj==='car'?(o.t0>0?o.v0*o.t0+o.v0*o.tau/2:o.v0*o.tau/2):o.v0*o.tau*(1-o.e)/2;o.crush=o.tc?o.v0*o.tc/2:0;return o;}
function F(o,t){return t>=o.t0&&t<=o.t0+o.tau?o.Fpk*Math.sin(Math.PI*(t-o.t0)/o.tau):0;}
function riemann(o,n){let s=0;const dt=o.tau/n;for(let i=0;i<n;i++)s+=F(o,o.t0+(i+0.5)*dt)*dt;return s;}
function verdict(o,p){if(o.obj==='car'){const g=o.gpk;return g>50?'severe':g>20?'injury':'ok';}
  if(o.obj==='egg')return o.Fpk>CRACK?'crack':'ok';return o.e>0?'bounce':'stick';}
function resultText(sim){const s=sim.st,o=s.o;if(s.phase!=='after')return s.phase==='impact'?'Impact in progress…':'Waiting for impact…';
  const v=verdict(o);if(o.obj==='egg')return v==='crack'?'Cracked ('+Math.round(o.Fpk)+' N > 30 N)':'Survived ('+o.Fpk.toFixed(1)+' N < 30 N)';
  if(o.obj==='car')return v==='severe'?'Severe injury likely ('+Math.round(o.gpk)+' g)':v==='injury'?'Injury likely ('+Math.round(o.gpk)+' g)':'Likely to walk away ('+Math.round(o.gpk)+' g)';
  return o.e>0?'Bounced back up to '+(o.e*o.e*sim.p.h).toFixed(2)+' m':'Stuck to the floor';}
function restartRun(sim,keepGhost){const old=sim.st;const st=SIM.init(sim);if(keepGhost!==false&&old&&old.o&&old.phase!=='fall'&&old.o.obj===st.o.obj)st.ghost=old.o;else if(old&&old.ghost&&old.ghost.obj===st.o.obj)st.ghost=old.ghost;sim.st=st;syncUI(sim);}
function ctlBox(sim,id){const sec=sim.ui&&sim.ui.sec;if(!sec)return null;const el=sec.querySelector('#'+sim.def.id+'-'+id)||sec.querySelector('#'+sim.def.id+'-'+id+'-l');return el?el.closest('.ctl'):null;}
function syncUI(sim){const ui=sim.ui;if(!ui||!ui.sec)return;const p=sim.p;
  sim.def.controls.forEach(c=>{if(!c.show)return;const b=ctlBox(sim,c.id);if(b)b.hidden=!atLeast(c.lvl)||!c.show(p);});
  if(ui.tiles)sim.def.metrics.forEach(m=>{const t=ui.tiles[m.id];if(!t)return;t.num.closest('.tile').hidden=!atLeast(m.lvl)||(m.show&&!m.show(p));});}
const isCar=p=>p.obj==='car',isDrop=p=>p.obj!=='car';

/* ---------- drawing ---------- */
function arrow(ctx,x1,y1,x2,y2,col,w){const a=Math.atan2(y2-y1,x2-x1),l=Math.hypot(x2-x1,y2-y1);if(l<2)return;const h=Math.min(11,l*0.6);
  ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=w||3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2-h*0.7*Math.cos(a),y2-h*0.7*Math.sin(a));ctx.stroke();
  ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-h*Math.cos(a-0.45),y2-h*Math.sin(a-0.45));ctx.lineTo(x2-h*Math.cos(a+0.45),y2-h*Math.sin(a+0.45));ctx.closePath();ctx.fill();}
function egg(ctx,x,yb,sq,cracked){ctx.save();ctx.translate(x,yb);
  if(cracked){ctx.fillStyle='#f2c23a';ctx.beginPath();ctx.ellipse(0,-3,30,5,0,0,6.29);ctx.fill();ctx.fillStyle='#f6f0e0';ctx.beginPath();ctx.ellipse(0,-3,44,4,0,0,6.29);ctx.globalAlpha=0.5;ctx.fill();ctx.globalAlpha=1;
    ctx.fillStyle='#f3e6cf';ctx.strokeStyle='#b9a27c';ctx.lineWidth=1.5;[[-22,-1],[20,1]].forEach(([dx,r])=>{ctx.beginPath();ctx.moveTo(dx-9,-4);ctx.lineTo(dx-6,-14);ctx.lineTo(dx-2,-9);ctx.lineTo(dx+2,-16);ctx.lineTo(dx+6,-10);ctx.lineTo(dx+9,-4);ctx.closePath();ctx.fill();ctx.stroke();});
    ctx.restore();return;}
  const h=30*(1-sq),w=12*(1+sq*0.6);ctx.fillStyle='#f3e6cf';ctx.strokeStyle='#b9a27c';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(0,-h/2,w,h/2,0,0,6.29);ctx.fill();ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,0.6)';ctx.beginPath();ctx.ellipse(-4,-h*0.65,3,6*(1-sq),0,0,6.29);ctx.fill();ctx.restore();}
function surface(ctx,k,key,x,y,w,h,dip,cx){const S=SURF[key];ctx.save();ctx.beginPath();ctx.moveTo(x,y);
  for(let i=0;i<=40;i++){const xx=x+w*i/40,d=dip*Math.exp(-Math.pow((xx-cx)/26,2));ctx.lineTo(xx,y+d);}ctx.lineTo(x+w,y+h);ctx.lineTo(x,y+h);ctx.closePath();
  ctx.fillStyle=S.col;ctx.fill();ctx.clip();
  if(key==='concrete'){ctx.fillStyle='rgba(0,0,0,0.18)';for(let i=0;i<60;i++){ctx.fillRect(x+((i*97)%w),y+6+((i*53)%(h-8)),2,2);}}
  else if(key==='carpet'){ctx.strokeStyle='rgba(0,0,0,0.2)';ctx.lineWidth=1;ctx.beginPath();for(let xx=x;xx<x+w;xx+=4){ctx.moveTo(xx,y);ctx.lineTo(xx+1,y+10);}ctx.stroke();}
  else if(key==='foam'){ctx.strokeStyle='rgba(0,0,0,0.15)';ctx.lineWidth=1;for(let i=0;i<40;i++){ctx.beginPath();ctx.arc(x+((i*71)%w),y+8+((i*37)%(h-10)),3,0,6.29);ctx.stroke();}}
  else{ctx.strokeStyle='rgba(0,0,0,0.12)';ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(x,y+h/2);ctx.lineTo(x+w,y+h/2);ctx.stroke();ctx.setLineDash([]);}
  ctx.restore();txt(ctx,S.l+': stops things in '+Math.round(S.tau*1000)+' ms',x+10,y+h-10,{s:12*k,w:700,c:S.ink});}

function drawDrop(sim,ctx,k){const s=sim.st,o=s.o,p=sim.p,x0=12,w=388,G0=362,cx=232,ball=p.obj==='ball';
  // height ruler
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(58,G0);ctx.lineTo(58,G0-3*GPXM);for(let i=0;i<=6;i++){const y=G0-i*0.5*GPXM;ctx.moveTo(52,y);ctx.lineTo(58,y);}ctx.stroke();
  for(let i=1;i<=3;i++)txt(ctx,i+' m',48,G0-i*GPXM+4,{s:11*k,c:PAL['cv-soft'],a:'right'});
  const yd=G0-p.h*GPXM;ctx.setLineDash([5,4]);ctx.strokeStyle=PAL.s2;ctx.beginPath();ctx.moveTo(64,yd);ctx.lineTo(x0+w-12,yd);ctx.stroke();ctx.setLineDash([]);
  txt(ctx,'drop from '+p.h.toFixed(2)+' m',x0+w-14,yd-6,{s:11.5*k,c:PAL.s2,a:'right',w:600});
  // object position
  let yb=G0,sq=0,dip=0,v=0,Fn=0;
  if(s.phase==='fall'){const tt=s.tf;yb=G0-Math.max(0,p.h-0.5*G*tt*tt)*GPXM;v=G*tt;}
  else if(s.phase==='impact'){const t=s.ti,fr=F(o,t)/o.Fpk;Fn=F(o,t);const ph=clamp(t/o.tau,0,1);
    const comp=o.e>0?o.v0*o.tau/(2*Math.PI)*Math.sin(Math.PI*ph):(o.v0*t-(o.v0*(1+o.e)/2)*(t-(o.tau/Math.PI)*Math.sin(Math.PI*ph)));
    dip=comp*GPXM;yb=G0+dip;sq=0.18*fr;v=o.v0-(o.J/o.m)*(1-Math.cos(Math.PI*ph))/2;}
  else{if(ball&&o.e>0){const vu=o.e*o.v0,tt=s.ta;const hgt=Math.max(0,vu*tt-0.5*G*tt*tt);yb=G0-hgt*GPXM;v=-(vu-G*tt);if(vu*tt-0.5*G*tt*tt<0&&tt>0.1){yb=G0;v=0;}}}
  surface(ctx,k,p.surface,x0+8,G0,w-16,46,dip,cx);
  const cracked=p.obj==='egg'&&s.phase==='after'&&verdict(o)==='crack';
  if(ball){const r=13;ctx.fillStyle=p.ball==='rubber'?'#c0392b':'#8a6d55';ctx.beginPath();ctx.ellipse(cx,yb-r*(1-sq),r*(1+sq*0.7),r*(1-sq),0,0,6.29);ctx.fill();
    if(p.ball==='rubber'){ctx.strokeStyle='rgba(255,255,255,0.6)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,yb-r*(1-sq),r*0.6,-2.4,-0.8);ctx.stroke();}}
  else egg(ctx,cx,yb,sq,cracked);
  // bounce apex marker
  if(ball&&o.e>0&&s.phase==='after'){const ya=G0-o.e*o.e*p.h*GPXM;ctx.setLineDash([3,4]);ctx.strokeStyle=PAL.s3;ctx.beginPath();ctx.moveTo(cx-60,ya);ctx.lineTo(cx+60,ya);ctx.stroke();ctx.setLineDash([]);txt(ctx,'bounce height '+(o.e*o.e*p.h).toFixed(2)+' m',cx+64,ya+4,{s:11*k,c:PAL.s3,w:600});}
  // velocity and force arrows
  const top=yb-32;
  if(Math.abs(v)>0.05&&s.phase!=='after'||(s.phase==='after'&&Math.abs(v)>0.05)){const len=clamp(Math.abs(v)*9,8,70),dn=v>0;arrow(ctx,cx-34,dn?top-4:yb,cx-34,dn?top-4+len:yb-len,PAL.s2,3);
    txt(ctx,Math.abs(v).toFixed(1)+' m/s',cx-42,dn?top+8:yb-len/2,{s:12*k,w:700,c:PAL.s2,a:'right'});}
  if(Fn>0){const mx=Math.max(o.Fpk,s.ghost?s.ghost.Fpk:0),len=8+80*Fn/mx;arrow(ctx,cx+30,G0+dip+2,cx+30,G0+dip+2-len,PAL.s1,4);
    txt(ctx,'F = '+(Fn>=100?Math.round(Fn):Fn.toFixed(1))+' N',cx+40,G0+dip-len/2,{s:12*k,w:700,c:PAL.s1});}
  if(s.phase==='after'&&p.obj==='egg'){const ok=!cracked;pill(ctx,ok?'Survived':'Cracked',cx,G0-70,ok?PAL.s3:PAL.s1,'#fff',13*k);}
  txt(ctx,(ball?'Ball':'Egg')+' drawn larger than life ('+(ball?'150 g':'60 g, 6 cm')+')',x0+12,24,{s:11*k,c:PAL['cv-soft']});}

function drawCar(sim,ctx,k){const s=sim.st,o=s.o,p=sim.p,road=330,wallX=44,Lc=4.4*CPXM,SC=1.32,TX=x=>20+(x-20)*SC,TY=y=>road+(y-road)*SC;
  ctx.save();ctx.beginPath();ctx.rect(8,8,396,434);ctx.clip();ctx.translate(20-20*SC,road-road*SC);ctx.scale(SC,SC);
  ctx.fillStyle=PAL['cv-soft'];ctx.globalAlpha=0.35;ctx.fillRect(12,road,388,16);ctx.globalAlpha=1;
  ctx.fillStyle='#8d9096';ctx.fillRect(20,170,wallX-20,road-170);ctx.strokeStyle='rgba(0,0,0,0.25)';ctx.lineWidth=1;for(let y=180;y<road;y+=14){ctx.beginPath();ctx.moveTo(20,y);ctx.lineTo(wallX,y);ctx.stroke();}
  txt(ctx,'wall',32,162,{s:10*k,c:PAL['cv-soft'],a:'center'});
  let front=wallX,crush=0,rel=0,t=s.ti;
  if(s.phase==='fall')front=wallX+130*(1-s.tf/APPROACH);
  else{const tt=s.phase==='impact'?t:o.tImp;crush=(tt<o.tc?o.v0*tt-relCar(o.v0,o.tc,tt):o.v0*o.tc/2);
    // dummy displacement relative to the car
    let xd;if(o.t0>0){xd=tt<o.t0?o.v0*tt:o.v0*o.t0+(tt<o.t0+o.tau?(o.v0*(tt-o.t0)-(o.v0/2)*((tt-o.t0)-(o.tau/Math.PI)*Math.sin(Math.PI*(tt-o.t0)/o.tau))):o.v0*o.tau/2);}
    else xd=tt<o.tau?o.v0*tt-(o.v0/2)*(tt-(o.tau/Math.PI)*Math.sin(Math.PI*tt/o.tau)):o.v0*o.tau/2;
    rel=Math.max(0,xd-crush);if(s.phase==='after')rel*=clamp(1-s.ta/0.8,0.25,1);}
  const cp=crush*CPXM,x=front,xr=front+Lc-cp,body='#2d63a8';
  // body
  ctx.fillStyle=body;rr(ctx,x,road-40,xr-x,28,6);ctx.fill();
  ctx.beginPath();ctx.moveTo(x+70-cp*0.15,road-40);ctx.lineTo(x+95-cp*0.1,road-74);ctx.lineTo(xr-40,road-74);ctx.lineTo(xr-14,road-40);ctx.closePath();ctx.fill();
  ctx.fillStyle='rgba(220,235,250,0.85)';ctx.beginPath();ctx.moveTo(x+80-cp*0.15,road-42);ctx.lineTo(x+99-cp*0.1,road-70);ctx.lineTo(xr-44,road-70);ctx.lineTo(xr-22,road-42);ctx.closePath();ctx.fill();
  if(cp>1){ctx.strokeStyle='#123';ctx.lineWidth=1.5;ctx.beginPath();const n=6,zw=Math.max(14,30+cp*0.6);for(let i=0;i<=n;i++){ctx.lineTo(x+zw*i/n,road-38+(i%2?8:0));}ctx.stroke();
    ctx.beginPath();for(let i=0;i<=n;i++){ctx.lineTo(x+zw*i/n,road-22+(i%2?-6:0));}ctx.stroke();}
  if(p.front==='crumple'){ctx.fillStyle='rgba(255,255,255,0.25)';ctx.fillRect(x+2,road-38,Math.max(10,50-cp),8);}
  ctx.fillStyle='#222';[x+36-cp*0.3,xr-36].forEach(wx=>{ctx.beginPath();ctx.arc(wx,road-8,11,0,6.29);ctx.fill();ctx.fillStyle='#777';ctx.beginPath();ctx.arc(wx,road-8,4,0,6.29);ctx.fill();ctx.fillStyle='#222';});
  // dummy: hips fixed to the seat, torso leans forward by rel
  const hipX=xr-70,hipY=road-42,lean=clamp(rel*CPXM,0,40),shX=hipX-6-lean,shY=hipY-24+lean*0.25,hd=[shX-4,shY-9];
  ctx.strokeStyle='#f0b429';ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(hipX,hipY);ctx.lineTo(shX,shY);ctx.stroke();
  ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(hipX,hipY);ctx.lineTo(hipX-22,hipY+4);ctx.stroke();
  ctx.fillStyle='#f0b429';ctx.beginPath();ctx.arc(hd[0],hd[1],7,0,6.29);ctx.fill();ctx.strokeStyle='#222';ctx.lineWidth=1;ctx.beginPath();ctx.arc(hd[0],hd[1],7,0,6.29);ctx.stroke();
  // steering wheel / dashboard
  const dash=hipX-6-GAP*CPXM-8;ctx.strokeStyle='#333';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(dash,road-40);ctx.lineTo(dash+4,road-56);ctx.stroke();
  if(p.rest!=='none'){ctx.strokeStyle='#111';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(shX+5,shY-2);ctx.lineTo(hipX+2,hipY-2);ctx.stroke();}
  if(p.rest==='airbag'&&s.phase!=='fall'){const inf=clamp((s.phase==='impact'?s.ti:1)/0.03,0,1);ctx.fillStyle='rgba(245,245,245,0.92)';ctx.strokeStyle='#999';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(dash+6+8*inf,road-58,4+10*inf,4+12*inf,0,0,6.29);ctx.fill();ctx.stroke();}
  ctx.restore();
  // labels (unscaled)
  if(s.phase==='fall'){arrow(ctx,TX(xr)-10,TY(road-92),TX(xr)-70,TY(road-92),PAL.s2,3);txt(ctx,o.v0.toFixed(1)+' m/s ('+Math.round(p.kmh)+' km/h)',Math.min(TX(xr)-6,396),TY(road-92)-12,{s:12*k,w:700,c:PAL.s2,a:'right'});}
  if(s.phase==='impact'){const f=F(o,s.ti);if(f>0){const len=10+60*f/Math.max(o.Fpk,s.ghost?s.ghost.Fpk:0);arrow(ctx,TX(shX-14),TY(shY+6),TX(shX-14+len),TY(shY+6),PAL.s1,4);txt(ctx,'F on dummy = '+(f/1000).toFixed(1)+' kN',200,road-118,{s:12*k,w:700,c:PAL.s1,a:'center'});}}
  if(s.phase!=='fall'&&atLeast('honors'))txt(ctx,'front crushed '+Math.round(crush*100)+' cm',TX(wallX)+8,road+40,{s:11.5*k,c:PAL['cv-soft']});
  if(s.phase==='after'){const v=verdict(o);pill(ctx,v==='ok'?'Likely to walk away':v==='injury'?'Injury likely':'Severe injury likely',210,140,v==='ok'?PAL.s3:v==='injury'?PAL.s4:PAL.s1,'#fff',13*k);}
  txt(ctx,'Car 4.4 m long, crash-test dummy 75 kg. '+REST[p.rest].l+'.',24,24,{s:11*k,c:PAL['cv-soft']});}

function tickStep(mx){const raw=mx/4,e=Math.pow(10,Math.floor(Math.log10(raw))),m=raw/e;return (m<=1?1:m<=2?2:m<=2.5?2.5:m<=5?5:10)*e;}
function niceMax(v){const e=Math.pow(10,Math.floor(Math.log10(v))),m=v/e;return (m<=1?1:m<=2?2:m<=2.5?2.5:m<=5?5:10)*e;}
function drawGraph(sim,ctx,k,X0,Y0,W,H){const s=sim.st,o=s.o,gh=s.ghost,hon=atLeast('honors'),ap=atLeast('ap'),fs=o.fs,u=o.unit;
  ctx.fillStyle=PAL.card;rr(ctx,X0,Y0,W,H,10);ctx.fill();ctx.strokeStyle=PAL.line;ctx.lineWidth=1;ctx.stroke();
  txt(ctx,'Force on the '+(o.obj==='car'?'dummy':o.obj==='ball'?'ball':'egg')+' vs time',X0+14,Y0+22,{s:13*k,w:700,c:PAL['cv-ink']});
  const L=X0+54,R=X0+W-14,T=Y0+50,B=Y0+H-40;
  const tmax=niceMax(Math.max(o.tImp,gh?gh.tImp:0)*1.15*1000)/1000,fmax=niceMax(Math.max(o.Fpk,gh?gh.Fpk:0,o.obj==='egg'?CRACK*1.2:0)*1.1/fs);
  const XX=t=>L+(R-L)*t/tmax,YY=f=>B-(B-T)*f/fs/fmax;
  // axes
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(L,T-6);ctx.lineTo(L,B);ctx.lineTo(R,B);ctx.stroke();
  const fst=tickStep(fmax);for(let f=0;f<=fmax+1e-9;f+=fst){const y=B-(B-T)*f/fmax;txt(ctx,String(+f.toFixed(2)),L-6,y+4,{s:11*k,c:PAL['cv-soft'],a:'right'});if(f>0){ctx.strokeStyle=PAL.line;ctx.beginPath();ctx.moveTo(L,y);ctx.lineTo(R,y);ctx.stroke();}}
  const tst=tickStep(tmax*1000);for(let tm=0;tm<=tmax*1000+1e-9;tm+=tst){txt(ctx,String(+tm.toFixed(2)),XX(tm/1000),B+16,{s:11*k,c:PAL['cv-soft'],a:'center'});}
  txt(ctx,'time (ms)',(L+R)/2,B+32,{s:11.5*k,c:PAL['cv-soft'],a:'center'});
  ctx.save();ctx.translate(X0+14,(T+B)/2);ctx.rotate(-Math.PI/2);txt(ctx,'force ('+u+')',0,4,{s:11.5*k,c:PAL['cv-soft'],a:'center'});ctx.restore();
  if(o.obj==='egg'){ctx.setLineDash([6,4]);ctx.strokeStyle=PAL.s1;ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(L,YY(CRACK));ctx.lineTo(R,YY(CRACK));ctx.stroke();ctx.setLineDash([]);
    txt(ctx,'shell cracks above 30 N',L+8,YY(CRACK)+14*k,{s:11*k,c:PAL.s1,w:600});}
  const curve=(oo,tEndDraw)=>{const pts=[];const n=120,t1=Math.min(tEndDraw,oo.t0+oo.tau);if(t1<oo.t0)return pts;for(let i=0;i<=n;i++){const t=oo.t0+(t1-oo.t0)*i/n;pts.push([XX(t),YY(F(oo,t))]);}return pts;};
  // ghost (previous run)
  if(gh){const g=curve(gh,1e9);ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.beginPath();g.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();ctx.setLineDash([]);
    const px=XX(gh.t0+gh.tau/2),py=YY(gh.Fpk);txt(ctx,'last run',px+(px>R-80?-8:8),py-6,{s:11*k,c:PAL['cv-soft'],a:px>R-80?'right':'left'});}
  const now=s.phase==='fall'?-1:s.phase==='impact'?s.ti:1e9;
  if(now>=o.t0){const c=curve(o,now);if(c.length>1){
      if(ap&&now>=o.tEnd){const n=10,dt=o.tau/n;ctx.fillStyle=PAL.s4;ctx.globalAlpha=0.28;for(let i=0;i<n;i++){const t=o.t0+(i+0.5)*dt,f=F(o,t);ctx.fillRect(XX(o.t0+i*dt)+0.5,YY(f),XX(o.t0+(i+1)*dt)-XX(o.t0+i*dt)-1,B-YY(f));}ctx.globalAlpha=1;}
      else{ctx.fillStyle=PAL.s2;ctx.globalAlpha=0.22;ctx.beginPath();ctx.moveTo(c[0][0],B);c.forEach(q=>ctx.lineTo(q[0],q[1]));ctx.lineTo(c[c.length-1][0],B);ctx.closePath();ctx.fill();ctx.globalAlpha=1;}
      ctx.strokeStyle=PAL.s2;ctx.lineWidth=2.8;ctx.lineJoin='round';ctx.beginPath();c.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();
      const last=c[c.length-1];ctx.fillStyle=PAL.s2;ctx.beginPath();ctx.arc(last[0],last[1],4,0,6.29);ctx.fill();}
    if(now>=o.tEnd){const px=XX(o.t0+o.tau/2),py=YY(o.Fpk),fmt=v=>v/fs>=100?String(Math.round(v/fs)):(v/fs).toFixed(1);
      ctx.fillStyle=PAL.s2;ctx.beginPath();ctx.arc(px,py,4.5,0,6.29);ctx.fill();
      const right=px<(L+R)/2;txt(ctx,'peak '+fmt(o.Fpk)+' '+u,px+(right?10:-10),Math.max(T+10,py+4),{s:12*k,w:700,c:PAL.s2,a:right?'left':'right'});
      if(hon){const ya=YY(o.Favg);ctx.setLineDash([3,3]);ctx.strokeStyle=PAL.s5;ctx.lineWidth=1.6;ctx.strokeRect(XX(o.t0),ya,XX(o.t0+o.tau)-XX(o.t0),B-ya);ctx.setLineDash([]);
        txt(ctx,'- - average '+fmt(o.Favg)+' '+u,R,Y0+22,{s:11*k,c:PAL.s5,w:600,a:'right'});}
      const area=ap?'Σ FΔt = '+riemann(o,10).toFixed(o.J<5?3:0)+' N·s':'area = impulse = '+o.J.toFixed(o.J<5?3:0)+' N·s';
      pill(ctx,area,(L+R)/2,Y0+38,PAL.s2,'#fff',11.5*k);}}
  else txt(ctx,s.phase==='impact'?'No force on the dummy yet: nothing is holding it.':o.obj==='car'?'The graph starts when the car hits the wall.':'The graph starts when the '+(o.obj==='ball'?'ball':'egg')+' touches down.',(L+R)/2,(T+B)/2,{s:12*k,c:PAL['cv-soft'],a:'center'});}

const SIM={
  id:'impulse',hash:'impulse',apUnit:4,order:2,tab:'Impulse and the egg drop',kind:'Simulation',
  card:'Drop an egg on concrete or foam and crash a car with and without an airbag, then read the force–time graph to see why stopping slowly saves lives.',
  title:'Impulse: the egg drop and car safety',
  lede:{bio:'An egg has to lose all its momentum when it lands. A soft surface makes that take longer, so the force is smaller and the egg survives. Airbags and crumple zones work the same way.',
        honors:'Impulse is the area under a force–time graph and equals the change in momentum. Compare peak and average forces, and see why a bounce takes more impulse than a stick.',
        ap:'Find the area under a non-constant force–time curve, connect it to Δp, and predict how peak force scales with stopping time and drop height.'},
  scale:'Real scale: a 60 g egg dropped about 1 m hits at 4.4 m/s. Concrete stops it in about 2 ms; a foam pad takes 30 ms. A car crash lasts about a tenth of a second. Impacts play back 40× (drops) or 15× (car) slower than real time.',
  timeless:true,animated:true,chChange:0,chReveal:4,
  controls:[
    {id:'obj',label:'Experiment',type:'seg',def:'egg',lvl:'bio',options:[{v:'egg',l:'Egg drop'},{v:'car',l:'Car crash'},{v:'ball',l:'Bounce or stick',lvl:'honors'}],onChange(sim){restartRun(sim,false);}},
    {id:'surface',label:'Landing surface',type:'select',def:'concrete',lvl:'bio',options:Object.keys(SURF).map(v=>({v,l:SURF[v].l+' ('+Math.round(SURF[v].tau*1000)+' ms stop)'})),show:isDrop,onChange(sim){restartRun(sim);}},
    {id:'h',label:'Drop height',type:'range',min:0.25,max:3,step:0.25,def:1,d:2,unit:' m',lvl:'bio',show:isDrop,onChange(sim){restartRun(sim);}},
    {id:'ball',label:'Ball',type:'seg',def:'clay',lvl:'honors',options:[{v:'clay',l:'Clay (sticks)'},{v:'rubber',l:'Rubber (bounces)'}],show:p=>p.obj==='ball',onChange(sim){restartRun(sim);}},
    {id:'kmh',label:'Car speed',type:'range',min:20,max:100,step:5,def:50,d:0,unit:' km/h',lvl:'bio',show:isCar,onChange(sim){restartRun(sim);}},
    {id:'rest',label:'Dummy protection',type:'select',def:'belt',lvl:'bio',options:[{v:'none',l:'No seat belt'},{v:'belt',l:'Seat belt'},{v:'airbag',l:'Seat belt and airbag'}],show:isCar,onChange(sim){restartRun(sim);}},
    {id:'front',label:'Front of the car',type:'seg',def:'rigid',lvl:'bio',options:[{v:'rigid',l:'Rigid frame'},{v:'crumple',l:'Crumple zone'}],show:isCar,onChange(sim){restartRun(sim);}}
  ],
  actions:[{id:'again',label:'Run it again',primary:true,run(sim){restartRun(sim);}},{id:'clear',label:'Clear the last-run ghost',lvl:'honors',run(sim){sim.st.ghost=null;}}],
  init(sim){const o=pars(sim);return {o,phase:'fall',tf:0,ti:0,ta:0,ghost:null,logged:false};},
  step(sim,dt){const s=sim.st,o=s.o,p=sim.p;
    if(s.phase==='fall'){s.tf+=dt;const tFall=p.obj==='car'?APPROACH:Math.sqrt(2*p.h/G);if(s.tf>=tFall){s.phase='impact';s.ti=0;
        if(!s.logged){s.logged=true;sim.log=sim.log||[];if(sim.logObj!==o.obj){sim.log=[];sim.logObj=o.obj;}sim.log.push({tau:o.tau,F:o.Fpk,J:o.J});if(sim.log.length>40)sim.log.shift();}}}
    else if(s.phase==='impact'){s.ti+=dt/(p.obj==='car'?SL.car:SL.drop);if(s.ti>=o.tImp){s.ti=o.tImp;s.phase='after';s.ta=0;}}
    else s.ta+=dt;},
  metrics:[
    {id:'vimp',label:'Speed at impact',unit:'m/s',lvl:'bio',min:0,max:null,d:1,get:sim=>sim.st.o.v0},
    {id:'tau',label:'Stopping (contact) time',unit:'ms',lvl:'bio',min:0,max:null,d:0,get:sim=>sim.st.o.tau*1000},
    {id:'fpk',label:'Peak force',unit:'N',lvl:'bio',min:0,max:null,d:1,show:isDrop,get:sim=>sim.st.o.Fpk},
    {id:'fpkK',label:'Peak force on the dummy',unit:'kN',lvl:'bio',min:0,max:null,d:1,show:isCar,get:sim=>sim.st.o.Fpk/1000},
    {id:'gpk',label:'Peak g-force',unit:'g',lvl:'bio',min:0,max:null,d:0,show:p=>p.obj==='car'||atLeast('ap'),get:sim=>sim.st.o.gpk},
    {id:'p0',label:'Momentum before impact',unit:'kg·m/s',lvl:'honors',min:0,max:null,d:3,show:isDrop,get:sim=>sim.st.o.m*sim.st.o.v0},
    {id:'p0c',label:'Dummy momentum before the crash',unit:'kg·m/s',lvl:'honors',min:0,max:null,d:0,show:isCar,get:sim=>sim.st.o.m*sim.st.o.v0},
    {id:'J',label:'Impulse (change in momentum)',unit:'N·s',lvl:'honors',min:0,max:null,d:3,show:isDrop,get:sim=>sim.st.o.J},
    {id:'Jc',label:'Impulse on the dummy',unit:'N·s',lvl:'honors',min:0,max:null,d:0,show:isCar,get:sim=>sim.st.o.J},
    {id:'favg',label:'Average force',unit:'N',lvl:'honors',min:0,max:null,d:1,show:isDrop,get:sim=>sim.st.o.Favg},
    {id:'favgK',label:'Average force on the dummy',unit:'kN',lvl:'honors',min:0,max:null,d:1,show:isCar,get:sim=>sim.st.o.Favg/1000},
    {id:'crush',label:'Front crush distance',unit:'cm',lvl:'honors',min:0,max:null,d:0,show:isCar,get:sim=>sim.st.o.crush*100},
    {id:'area',label:'Area under F–t (10 strips)',unit:'N·s',lvl:'ap',min:0,max:null,d:3,show:isDrop,get:sim=>riemann(sim.st.o,10)},
    {id:'areac',label:'Area under F–t (10 strips)',unit:'N·s',lvl:'ap',min:0,max:null,d:0,show:isCar,get:sim=>riemann(sim.st.o,10)},
    {id:'dist',label:'Stopping distance',unit:'cm',lvl:'ap',min:0,max:null,d:1,show:p=>!(p.obj==='ball'&&p.ball==='rubber'),get:sim=>sim.st.o.dist*100},
    {id:'out',label:'Result',lvl:'bio',text:true,get:resultText}
  ],
  graphs:[{id:'runs',label:'Peak force vs stopping time (every run)',lvl:'bio',custom:true}],
  defaultGraph:'runs',
  plot(sim,ctx,box){const o=sim.st.o,log=(sim.logObj===o.obj?sim.log:null)||[],fs=o.fs;
    const tmax=niceMax(Math.max(o.tau,...log.map(r=>r.tau))*1.15*1000),fmax=niceMax(Math.max(o.Fpk,...log.map(r=>r.F))*1.1/fs);
    const ax=axes(ctx,box,{xmin:0,xmax:tmax,ymin:0,ymax:fmax,xl:'Stopping time (ms)',yl:'Peak force ('+o.unit+')'});
    ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();
    ctx.strokeStyle=PAL['cv-soft'];ctx.setLineDash([5,4]);ctx.lineWidth=1.5;ctx.beginPath();let first=true;
    for(let i=1;i<=200;i++){const tm=tmax*i/200,f=Math.PI*o.J/(2*tm/1000)/fs;const x=ax.X(tm),y=ax.Y(Math.min(f,fmax*3));first?ctx.moveTo(x,y):ctx.lineTo(x,y);first=false;}ctx.stroke();ctx.setLineDash([]);
    log.forEach(r=>{ctx.fillStyle=PAL['g-dot']||PAL.s2;ctx.beginPath();ctx.arc(ax.X(r.tau*1000),ax.Y(r.F/fs),6,0,6.29);ctx.fill();ctx.strokeStyle=PAL.card;ctx.lineWidth=1.5;ctx.stroke();});
    ctx.restore();
    txt(ctx,'Dots: your runs. Dashed curve: same Δp = '+o.J.toFixed(o.J<5?3:0)+' N·s at any stopping time.',box.L+8,box.T+14,{s:12,c:PAL['cv-soft']});
    if(!log.length)txt(ctx,'Each run adds a dot.',box.L+box.W/2,box.T+box.H/2,{s:14,c:PAL.muted,a:'center'});},
  narrate(sim){const s=sim.st,o=s.o,p=sim.p,hon=atLeast('honors'),fmtF=f=>o.obj==='car'?(f/1000).toFixed(1)+' kN':(f>=100?Math.round(f):f.toFixed(1))+' N';
    const what=o.obj==='car'?'dummy':o.obj==='ball'?'ball':'egg';
    if(s.phase==='fall'){if(o.obj==='car')return '<b>Driving toward the wall</b> at '+Math.round(p.kmh)+' km/h. The 75 kg dummy carries '+Math.round(o.m*o.v0)+' kg·m/s of momentum, and all of it has to go to zero in the crash.';
      const v=G*s.tf;return '<b>Falling.</b> Gravity speeds the '+what+' up, so its momentum grows: p = mv = '+(o.m*v).toFixed(3)+' kg·m/s so far. Landing has to take all of it away.';}
    const surf=SURF[p.surface]?SURF[p.surface].l.toLowerCase():'';
    if(s.phase==='impact'){
      if(o.obj==='car'){if(o.t0>0&&s.ti<o.t0)return '<b>Crash (slowed 15×).</b> The car is stopping, but nothing holds the dummy, so it keeps moving forward at full speed toward the dashboard.';
        return '<b>Crash (slowed 15×).</b> The '+(p.rest==='none'?'dashboard pushes':p.rest==='airbag'?'belt and airbag push':'seat belt pushes')+' back on the dummy to remove its momentum. The longer that takes, the smaller the force.';}
      return '<b>Impact (slowed 40×).</b> The '+surf+' pushes up on the '+what+(o.e>0?' to stop it and then throw it back up.':' to stop it.')+' It has '+Math.round(o.tau*1000)+' ms to remove '+(o.m*o.v0).toFixed(3)+' kg·m/s of momentum, so the force climbs toward '+fmtF(o.Fpk)+'.';}
    const v=verdict(o);let msg;
    if(o.obj==='egg')msg=v==='crack'?'<b>Cracked.</b> Stopping in only '+Math.round(o.tau*1000)+' ms took a peak force of '+fmtF(o.Fpk)+', more than the ~30 N a shell can take.':'<b>Survived.</b> The '+surf+' stretched the stop to '+Math.round(o.tau*1000)+' ms, so the same change in momentum needed a peak force of only '+fmtF(o.Fpk)+'.';
    else if(o.obj==='car')msg=(v==='ok'?'<b>Likely to walk away.</b> ':v==='injury'?'<b>Injury likely.</b> ':'<b>Severe injury likely.</b> ')+'The dummy’s momentum went to zero over '+Math.round(o.tau*1000)+' ms, with a peak force of '+fmtF(o.Fpk)+' ('+Math.round(o.gpk)+' g).';
    else msg=o.e>0?'<b>Bounced.</b> The floor had to stop the ball and then push it back up, so the impulse was '+o.J.toFixed(3)+' N·s, 1.8 times the '+(o.m*o.v0).toFixed(3)+' N·s needed just to stop it.':'<b>Stuck.</b> The floor only had to stop the clay ball: impulse = its momentum, '+o.J.toFixed(3)+' N·s.';
    if(hon)msg+=' Impulse = area under the curve = '+o.J.toFixed(o.J<5?3:0)+' N·s.';
    if(s.ghost&&s.ghost.Fpk>0){const r=o.Fpk/s.ghost.Fpk;if(Math.abs(r-1)>0.05)msg+=' Peak force is '+(r>1?r.toFixed(1)+'× the':'1/'+(1/r).toFixed(1)+' of the')+' last run.';}
    return msg;},
  tour:[
    {title:'An egg drop',text:'A 60 g egg falls 1 m toward concrete. Gravity speeds it up, so its momentum (mass × velocity) grows to 0.27 kg·m/s just before it lands. The graph on the right will record the force on the egg.',focus:[8,24,396,402],speed:0.35,
      setup(sim){BioLab.setValues(sim,{obj:'egg',surface:'concrete',h:1});restartRun(sim,false);}},
    {title:'Impact: a force spike',text:'Concrete stops the egg in about 2 ms, even in slow motion. To remove all that momentum so quickly, the floor pushes with over 200 N, and the egg cracks.',focus:[408,24,384,402],speed:0.25},
    {title:'Area = impulse',text:'The shaded area under the force–time curve is the <b>impulse</b>. It always equals the egg’s change in momentum: 0.27 N·s.',focus:[408,24,384,402],pause:true},
    {title:'Now land on foam',text:'Same egg, same height, so the same momentum must be removed. Foam stretches the stop to 30 ms.',focus:[8,24,784,402],speed:1,setup(sim){BioLab.setValues(sim,{surface:'foam'});}},
    {title:'Same area, smaller peak',text:'The new curve is wide and low; the dashed one is the concrete run. Both have the same area, but the foam’s peak force is about 14 N, under the 30 N a shell can take. The egg survives.',focus:[408,24,384,402],pause:true},
    {title:'Car safety works the same way',text:'A car at 50 km/h hits a wall. A crumple zone and an airbag stretch the dummy’s stop to about 0.2 s, so its momentum goes to zero with a much smaller force.',focus:[8,24,784,402],speed:1,
      setup(sim){BioLab.setValues(sim,{obj:'car',kmh:50,rest:'airbag',front:'crumple'});restartRun(sim,false);}},
    {lvl:'honors',title:'Bounce or stick',text:'A rubber ball bounces back up, so the floor must stop it <b>and</b> throw it back: the impulse is m·v(1 + e), 1.8 times what a clay ball needs. Compare the area with the dashed clay run.',focus:[8,24,784,402],speed:1,
      setup(sim){BioLab.setValues(sim,{obj:'ball',ball:'clay',h:1,surface:'carpet'});restartRun(sim,false);sim.st.phase='after';sim.st.ta=5;const g=sim.st.o;BioLab.setValues(sim,{ball:'rubber'});sim.st.ghost=g;}},
    {lvl:'ap',title:'Area under a curve',text:'The force isn’t constant, so the impulse is ∫F dt. Ten thin strips (F × Δt each) add up to almost exactly the true area, (2/π)·F<sub>peak</sub>·τ.',focus:[408,24,384,402],speed:1,
      setup(sim){BioLab.setValues(sim,{obj:'egg',surface:'foam',h:1});restartRun(sim,false);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{obj:'egg',surface:'concrete',h:1,ball:'clay',kmh:50,rest:'belt',front:'rigid'});restartRun(sim,false);},
  challenges:[
    {lvl:'bio',q:'The same egg falls 1 m, first onto concrete, then onto a foam pad. How does the egg’s change in momentum compare?',choices:['Bigger on concrete','The same on both','Bigger on foam'],correct:1,
     baseline:{obj:'egg',surface:'concrete',h:1},change:{surface:'foam'},changeText:'Now landing on foam',watch:'runs',at:1.4,reveal:4,
     explain:'The egg arrives at the same speed and ends at rest either way, so Δp = mv = 0.27 kg·m/s for both. The surfaces differ only in how long they take, which changes the force, not the impulse.'},
    {lvl:'bio',q:'Switch the egg’s landing from concrete to foam. What happens to the peak force?',choices:['It gets much smaller','It stays the same','It gets bigger'],correct:0,
     baseline:{obj:'egg',surface:'concrete',h:1},change:{surface:'foam'},changeText:'Now landing on foam',watch:'runs',at:1.4,reveal:4,
     explain:'Same impulse, 15 times longer stopping time, so the force is about 15 times smaller: 209 N on concrete, about 14 N on foam. That is why a longer stop is a gentler stop.'},
    {lvl:'bio',q:'Drop the egg 1 m onto the foam pad. Does it survive?',choices:['Yes','No'],correct:0,
     baseline:{obj:'egg',surface:'foam',h:1},changeText:'Egg released',watch:'runs',at:0,reveal:2.4,
     explain:'Foam takes 30 ms to stop the egg, so the peak force is only about 14 N, below the ~30 N that cracks a shell.'},
    {lvl:'bio',q:'A belted dummy crashes at 50 km/h. Now add an airbag. What does the airbag do?',choices:['It reduces the dummy’s change in momentum','It makes the stop take longer, so the force is smaller','Nothing, the seat belt already stops the dummy'],correct:1,
     baseline:{obj:'car',kmh:50,rest:'belt',front:'rigid'},change:{rest:'airbag'},changeText:'Airbag added',watch:'runs',at:2.2,reveal:5.5,
     explain:'The dummy goes from 50 km/h to 0 either way, so the impulse is the same. The airbag lets the stop last longer (130 ms instead of 100 ms), which lowers the peak force.'},
    {lvl:'honors',q:'A clay ball (sticks) and a rubber ball (bounces) hit the same floor at the same speed. Which one gets the larger impulse from the floor?',choices:['The clay ball','The same impulse','The rubber ball'],correct:2,
     baseline:{obj:'ball',ball:'clay',surface:'carpet',h:1},change:{ball:'rubber'},changeText:'Now the rubber ball',watch:'runs',at:1.2,reveal:3.4,
     explain:'The clay ball’s momentum goes from mv to 0. The rubber ball’s goes from mv downward to 0.8mv upward, a change of 1.8mv. The floor has to supply the extra impulse to throw it back.'},
    {lvl:'honors',q:'Seat belt on, 50 km/h. Replace the rigid frame with a crumple zone. What happens to the peak force on the dummy?',choices:['It goes up, because the car is damaged more','It goes down','It stays the same'],correct:1,
     baseline:{obj:'car',kmh:50,rest:'belt',front:'rigid'},change:{front:'crumple'},changeText:'Crumple zone fitted',watch:'runs',at:2.2,reveal:6.6,
     explain:'The crumple zone crushes about 80 cm instead of 30 cm, stretching the car’s stop from 40 ms to 120 ms. The dummy’s stop gets longer too, so the same impulse comes with a smaller force: about 9 kN instead of 16 kN.'},
    {lvl:'honors',instant:true,q:'The 0.06 kg egg hits foam at 4.4 m/s and stops in 30 ms. What is the average force on it?',choices:['About 0.13 N','About 9 N','About 130 N'],correct:1,
     explain:'Δp = 0.06 × 4.4 = 0.27 kg·m/s. Average force = Δp/Δt = 0.27 / 0.030 ≈ 9 N. The peak of the half-sine pulse is π/2 times that, about 14 N.'},
    {lvl:'ap',instant:true,q:'A half-sine force pulse peaks at 13.9 N and lasts 30 ms. What is the area under its F–t curve?',choices:['About 0.21 N·s','About 0.27 N·s','About 0.42 N·s'],correct:1,
     explain:'∫F dt = ∫₀^τ F_peak·sin(πt/τ) dt = (2/π)·F_peak·τ = 0.637 × 13.9 × 0.030 ≈ 0.27 N·s, which is the egg’s Δp. 0.42 N·s would be a rectangle of height F_peak, which overestimates.'},
    {lvl:'ap',q:'An egg drops onto foam from 1 m, then from 2 m. By what factor does the peak force change?',choices:['About 1.4×','2×','4×'],correct:0,
     baseline:{obj:'egg',surface:'foam',h:1},change:{h:2},changeText:'Drop height doubled',watch:'runs',at:1.4,reveal:4.2,
     explain:'Impact speed v = √(2gh), so doubling h multiplies v, Δp and the peak force by √2 ≈ 1.41 (with the same stopping time). The kinetic energy doubles, but the force does not.'},
    {lvl:'ap',q:'An unbelted dummy at 50 km/h slides forward and hits the dashboard. Compared with a belted dummy, what does it get?',choices:['A smaller impulse','The same impulse, but more than 10 times the peak force','A larger impulse and a larger force'],correct:1,
     baseline:{obj:'car',kmh:50,rest:'belt',front:'rigid'},change:{rest:'none'},changeText:'Seat belt removed',watch:'runs',at:2.2,reveal:4.6,
     explain:'Either way the dummy loses 1,040 kg·m/s. The belt spreads that over about 100 ms; the dashboard does it in about 8 ms, so the peak force jumps from about 16 kN to about 200 kN.'}
  ],
  lab:{bio:'<p><b>Question:</b> How does the landing surface change the force on an egg?</p><ol><li>Keep the drop height at 1 m.</li><li>Drop the egg on each surface. After each drop, press <b>Record trial</b>.</li><li>Record the stopping time, the peak force and whether the egg survived.</li></ol><p>Describe the pattern between stopping time and peak force. Use it to design the best egg-drop container.</p>',
       honors:'<p><b>Question:</b> How is the peak force related to stopping time when the change in momentum stays the same?</p><ol><li>Egg, 1 m drop. Record a trial on each surface.</li><li>Plot peak force (y) against stopping time (x), and then against 1/stopping time.</li><li>Repeat the car crash with each protection option and front type.</li></ol><p>Which graph is linear? Write the equation that connects impulse, average force and time.</p>',
       ap:'<p><b>Question:</b> How does peak force depend on drop height and stopping time?</p><ol><li>Foam pad. Record trials for heights 0.25, 0.5, 1, 2 and 3 m.</li><li>Plot peak force against √h. Then fix h = 1 m and vary the surface.</li><li>Use the Σ FΔt readout to check that the area equals m·v each time.</li></ol><p><b>Claim–evidence–reasoning:</b> Derive F_peak = πm√(2gh)/(2τ) from the impulse–momentum theorem and test it with your data. Which factor would an egg-drop designer control?</p>'},
  terms:[{t:'Momentum',d:'Mass times velocity, p = mv.'},{t:'Impulse',d:'Force × time, or the area under a force–time graph. It equals the change in momentum.'},
    {t:'Stopping time',d:'How long a collision takes. A longer stopping time means a smaller force for the same change in momentum.'},
    {t:'Crumple zone',d:'The front of a car designed to crush slowly, which lengthens the crash.'},
    {lvl:'honors',t:'Impulse–momentum theorem',d:'J = F_avg·Δt = Δp.'},{lvl:'honors',t:'Average force',d:'Impulse divided by contact time.'},
    {lvl:'honors',t:'Coefficient of restitution',d:'Rebound speed ÷ impact speed. 0.8 for this rubber ball, 0 for clay.'},
    {lvl:'ap',t:'Impulse integral',d:'J = ∫F dt, the area under a non-constant F–t curve.'},{lvl:'ap',t:'g-force',d:'Acceleration as a multiple of g = 9.8 m/s². Peak g = F_peak/(mg).'}],
  about:'<p>Each impact is a half-sine force pulse, F(t) = F<sub>peak</sub>·sin(πt/τ), which is close to measured force-plate data for drops and crash pulses. Its area is (2/π)F<sub>peak</sub>τ, and the impulse–momentum theorem sets that area equal to Δp: m·v for objects that stop, m·v(1 + e) for the rubber ball (e = 0.8, so it rebounds to e² = 64% of the drop height).</p><p>Contact times are typical values: concrete 2 ms, carpet 8 ms, foam 30 ms, pillow 80 ms. Real values depend on the object and the speed. The 30 N cracking threshold is a typical value for a large egg landing on its side.</p><p>The car’s front stops in 40 ms (rigid) or 120 ms (crumple zone). A belted dummy rides down with the car and stops over the car’s time plus 60 ms, or 90 ms with an airbag. An unbelted dummy keeps going until it has slid 0.45 m relative to the car, then stops on the dashboard in 8 ms. Injury bands (under 20 g, 20–50 g, over 50 g) are rough guides, not medical thresholds. Gravity during the brief impact is ignored, and the impact is replayed in slow motion.</p>',
  initVis(sim){},
  draw(sim,ctx,vdt,k){const kk=Math.min(k,1.45),s=sim.st;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    ctx.fillStyle=PAL['cv-bg2']||PAL['cv-bg'];rr(ctx,8,8,396,434,10);ctx.fill();
    if(sim.p.obj==='car')drawCar(sim,ctx,kk);else drawDrop(sim,ctx,kk);
    if(s.phase==='impact')pill(ctx,'Slow motion: '+(sim.p.obj==='car'?SL.car:SL.drop)+'× slower',300,50,PAL.s5,'#fff',12*kk);
    drawGraph(sim,ctx,kk,412,8,380,434);},
  onLevel(sim){syncUI(sim);},
  onClick(sim){if(sim.st.phase==='after')restartRun(sim);}
};
BioLab.register(SIM);
})();
