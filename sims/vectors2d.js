(function(){
'use strict';
const {clamp,lerp,rr,txt,pill,PAL,FONT,atLeast,fmtNum}=BioLab.h;
let KF=1;const ID='vectors2d',D2R=Math.PI/180;
const f1=v=>fmtNum(v,1),f2=v=>fmtNum(v,2);
const DEST=6; // km to the destination city (plane mode)
const TBL={x0:60,x1:740,y0:66,y1:406,w:1.2,h:0.6};TBL.s=(TBL.x1-TBL.x0)/TBL.w;
const PR=0.035; // puck radius, m
const MODE_TS={river:1,plane:10,add:1,puck:1},MODE_WIN={river:30,plane:240,add:10,puck:4};
const MODE_GRAPH={river:'river',plane:'plane',add:'river',puck:'puck'};
const BY={mode:['mode'],river:['bs','aim','cur','wid'],plane:['as','hdg','ws','wd'],add:['am','aa','bm','ba','op','comps'],puck:['pvx','pvy','pst']};
const MBY={river:['crossT','drift','gsr','vac','vdn','zeroAim','yAcross','xDown'],plane:['gsp','trk','pft','east','need','pn','pe'],add:['rmag','rang','ax','ay','rx','ry','uvec'],puck:['pspd','px','py','mdt','mdx','mdy','mspd','mvx','mvy']};
const ABY={go:['river','plane','puck'],mark:['puck'],clear:['river','plane','puck']};

function sync(sim){if(!sim.ui||!sim.ui.ctl||!sim.ui.sec)return;const m=sim.p.mode,sec=sim.ui.sec;
  SIM.controls.forEach(c=>{const e=sec.querySelector('#'+ID+'-'+c.id+',#'+ID+'-'+c.id+'-l');const w=e&&e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl||'bio')||!(BY[m].includes(c.id)||c.id==='mode');});
  SIM.metrics.forEach(mt=>{const t=sim.ui.tiles[mt.id];if(!t)return;const tile=t.num.closest('.tile');if(tile)tile.hidden=!atLeast(mt.lvl||'bio')||!MBY[m].includes(mt.id);});
  const btns=[...sec.querySelectorAll('.controls .actions button')];SIM.actions.forEach((a,i)=>{if(btns[i])btns[i].hidden=!atLeast(a.lvl||'bio')||!ABY[a.id].includes(m);});}
function setModeTime(sim){SIM.timeScale=MODE_TS[sim.p.mode];SIM.window=MODE_WIN[sim.p.mode];
  if(sim.ui&&sim.ui.gm){const g=MODE_GRAPH[sim.p.mode];if([...sim.ui.gm.options].some(o=>o.value===g)){sim.gMetric=g;sim.ui.gm.value=g;}}}

/* ---------- models ---------- */
function boatVel(p){const a=p.aim*D2R;return {wx:-p.bs*Math.sin(a),wy:p.bs*Math.cos(a),gx:-p.bs*Math.sin(a)+p.cur,gy:p.bs*Math.cos(a)};}
function planeVel(p){const h=p.hdg*D2R,w=p.wd*D2R;const ax=p.as*Math.sin(h),ay=p.as*Math.cos(h),wx=p.ws*Math.sin(w),wy=p.ws*Math.cos(w);return {ax,ay,wx,wy,gx:ax+wx,gy:ay+wy};}
function addVecs(p){const A={x:p.am*Math.cos(p.aa*D2R),y:p.am*Math.sin(p.aa*D2R)},B0={x:p.bm*Math.cos(p.ba*D2R),y:p.bm*Math.sin(p.ba*D2R)};
  const sub=p.op==='sub',B=sub?{x:-B0.x,y:-B0.y}:B0;return {A,B0,B,R:{x:A.x+B.x,y:A.y+B.y},sub};}
const angOf=(x,y)=>{let a=Math.atan2(y,x)/D2R;if(a<0)a+=360;return Math.abs(x)<1e-9&&Math.abs(y)<1e-9?0:a;};
function launch(sim){const st=sim.st,m=sim.p.mode;
  if(m==='river'){if(st.boat&&st.boat.trail.length>1){st.ghosts.push(st.boat);if(st.ghosts.length>4)st.ghosts.shift();}st.boat={x:0,y:0,t:0,done:false,trail:[[0,0]],dots:[[0,0]],next:1};}
  if(m==='plane'){if(st.plane&&st.plane.trail.length>1){st.pghosts.push(st.plane);if(st.pghosts.length>4)st.pghosts.shift();}st.plane={x:0,y:0,t:0,done:false,arrived:false,trail:[[0,0]],dots:[[0,0]],next:10,lastHdg:sim.p.hdg};}
  if(m==='puck'){const p=sim.p;const y0=p.pvy>=0?0.1:0.5;st.puck={x:0.08,y:y0,t:0,done:false,dots:[{t:0,x:0.08,y:y0}],next:+p.pst,vx:p.pvx,vy:p.pvy,dt:+p.pst};st.marks=[];}
  if(m==='add')st.anim=0;}
function stepRiver(sim,dt){const b=sim.st.boat,p=sim.p;if(!b||b.done)return;const v=boatVel(p);let guard=0;
  while(dt>1e-12&&guard++<1000){let h=Math.min(dt,b.next-b.t);if(h<1e-9)h=dt;const py=b.y,px=b.x;b.x+=v.gx*h;b.y+=v.gy*h;b.t+=h;dt-=h;
    if(b.y>=p.wid){const f=(p.wid-py)/(b.y-py);b.x=px+(b.x-px)*f;b.t=b.t-h+h*f;b.y=p.wid;b.done=true;b.trail.push([b.x,b.y]);b.res={t:b.t,drift:b.x};break;}
    if(b.y<0&&v.gy<=0){b.y=0;}
    if(Math.abs(b.t-b.next)<1e-7){b.dots.push([b.x,b.y]);b.next+=1;b.trail.push([b.x,b.y]);}
    if(b.t>400){b.done=true;b.res={t:b.t,drift:b.x,stuck:true};break;}}}
function stepPlane(sim,dt){const a=sim.st.plane,p=sim.p;if(!a||a.done)return;const v=planeVel(p);let guard=0;a.lastHdg=p.hdg;
  while(dt>1e-12&&guard++<1000){let h=Math.min(dt,a.next-a.t);if(h<1e-9)h=dt;const py=a.y,px=a.x;a.x+=v.gx/1000*h;a.y+=v.gy/1000*h;a.t+=h;dt-=h;
    if(a.y>=DEST){const f=(DEST-py)/(a.y-py);a.x=px+(a.x-px)*f;a.t=a.t-h+h*f;a.y=DEST;a.done=true;a.arrived=true;a.trail.push([a.x,a.y]);break;}
    if(Math.abs(a.t-a.next)<1e-7){a.dots.push([a.x,a.y]);a.next+=10;a.trail.push([a.x,a.y]);}
    if(a.y<-1.2||Math.abs(a.x)>7.4||a.t>600){a.done=true;a.trail.push([a.x,a.y]);break;}}}
function stepPuck(sim,dt){const q=sim.st.puck;if(!q||q.done)return;let guard=0;
  while(dt>1e-12&&guard++<1000){let h=Math.min(dt,q.next-q.t);if(h<1e-9)h=dt;q.x+=q.vx*h;q.y+=q.vy*h;q.t+=h;dt-=h;
    if(q.x>TBL.w-PR||q.x<PR||q.y>TBL.h-PR||q.y<PR){q.x=clamp(q.x,PR,TBL.w-PR);q.y=clamp(q.y,PR,TBL.h-PR);q.done=true;break;}
    if(Math.abs(q.t-q.next)<1e-7){q.dots.push({t:q.next,x:q.x,y:q.y});q.next+=q.dt;}
    if(q.t>60){q.done=true;break;}}}
function markEnds(st){const q=st.puck;if(!q||q.dots.length<2)return;st.marks=[0,q.dots.length-1];}
function measured(st){const q=st.puck;if(!q||st.marks.length<2)return null;const a=q.dots[st.marks[0]],b=q.dots[st.marks[1]];if(!a||!b||b.t===a.t)return null;const lo=a.t<b.t?a:b,hi=a.t<b.t?b:a;
  return {dt:hi.t-lo.t,dx:hi.x-lo.x,dy:hi.y-lo.y};}

/* ---------- drawing helpers ---------- */
function arrow(ctx,x1,y1,x2,y2,col,w,dash){const L=Math.hypot(x2-x1,y2-y1);if(L<2)return;const a=Math.atan2(y2-y1,x2-x1),hd=Math.min(11,L*0.45);
  ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=w||3;ctx.lineCap='round';if(dash)ctx.setLineDash(dash);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2-Math.cos(a)*hd*0.8,y2-Math.sin(a)*hd*0.8);ctx.stroke();ctx.setLineDash([]);
  ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-hd*Math.cos(a-0.42),y2-hd*Math.sin(a-0.42));ctx.lineTo(x2-hd*Math.cos(a+0.42),y2-hd*Math.sin(a+0.42));ctx.closePath();ctx.fill();}
function label(ctx,s,x,y,col,k0,bg){const k=KF;ctx.font='700 '+(12.5*k)+'px '+FONT;const w=ctx.measureText(s).width+10,h=18*k;ctx.fillStyle=bg||PAL['card'];ctx.globalAlpha=0.9;rr(ctx,x-w/2,y-h/2,w,h,5);ctx.fill();ctx.globalAlpha=1;txt(ctx,s,x,y+1,{s:12.5*k,w:700,c:col,a:'center',b:'middle'});}
function niceStep(pxPer,minPx){const c=[0.01,0.02,0.05,0.1,0.2,0.5,1,2,5,10,20,25,50,100];for(const v of c)if(v*pxPer>=minPx)return v;return 200;}
function boatShape(ctx,x,y,ang,sc){ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.fillStyle='#c4302b';ctx.beginPath();ctx.moveTo(18*sc,0);ctx.quadraticCurveTo(6*sc,-9*sc,-14*sc,-8*sc);ctx.lineTo(-14*sc,8*sc);ctx.quadraticCurveTo(6*sc,9*sc,18*sc,0);ctx.fill();
  ctx.fillStyle='#f4efe6';rr(ctx,-8*sc,-4.5*sc,12*sc,9*sc,2);ctx.fill();ctx.restore();}
function planeShape(ctx,x,y,ang,sc){ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.fillStyle='#3a5f9e';ctx.strokeStyle='#fff';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(20*sc,0);ctx.lineTo(10*sc,-2.5*sc);ctx.lineTo(2*sc,-17*sc);ctx.lineTo(-2*sc,-17*sc);ctx.lineTo(-1*sc,-3*sc);ctx.lineTo(-12*sc,-3*sc);ctx.lineTo(-16*sc,-8*sc);ctx.lineTo(-18*sc,-8*sc);ctx.lineTo(-16*sc,0);
  ctx.lineTo(-18*sc,8*sc);ctx.lineTo(-16*sc,8*sc);ctx.lineTo(-12*sc,3*sc);ctx.lineTo(-1*sc,3*sc);ctx.lineTo(-2*sc,17*sc);ctx.lineTo(2*sc,17*sc);ctx.lineTo(10*sc,2.5*sc);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}

/* ---------- views ---------- */
function riverView(sim){const p=sim.p,st=sim.st,v=boatVel(p);const pred=v.gy>0.01?v.gx*p.wid/v.gy:0;let lo=Math.min(0,pred),hi=Math.max(0,pred);
  [st.boat].concat(st.ghosts).forEach(b=>{if(b)b.trail.forEach(q=>{lo=Math.min(lo,q[0]);hi=Math.max(hi,q[0]);});});
  const span=hi-lo+p.wid*0.5,s=Math.min(300/p.wid,640/span),cx=(lo+hi)/2;return {s,ox:400-cx*s,yb:225+p.wid*s/2};}
function drawRiver(sim,ctx,vdt,k){const p=sim.p,st=sim.st,V=sim.vis,hon=atLeast('honors'),ap=atLeast('ap');
  const tv=riverView(sim);if(!V.rv)V.rv=tv;const rv=V.rv;rv.s=lerp(rv.s,tv.s,0.15);rv.ox=lerp(rv.ox,tv.ox,0.15);rv.yb=lerp(rv.yb,tv.yb,0.15);
  const X=x=>rv.ox+x*rv.s,Y=y=>rv.yb-y*rv.s,top=Y(p.wid);
  ctx.fillStyle=PAL['cv-leaf2'];ctx.globalAlpha=0.55;ctx.fillRect(0,0,800,top);ctx.fillRect(0,rv.yb,800,450-rv.yb);ctx.globalAlpha=1;
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,top-6,800,6);ctx.fillRect(0,rv.yb,800,6);
  ctx.fillStyle=PAL['cv-water'];ctx.fillRect(0,top,800,rv.yb-top);
  // flow streaks
  if(!V.fl){V.fl=[];for(let i=0;i<46;i++)V.fl.push({x:Math.random()*800,f:Math.random(),L:10+Math.random()*16});}
  ctx.strokeStyle=PAL['cv-bstroke'];ctx.lineWidth=2;ctx.lineCap='round';V.fl.forEach(q=>{q.x+=p.cur*rv.s*vdt;if(q.x>820)q.x-=840;const y=top+8+q.f*(rv.yb-top-16);if(p.cur>0.05){ctx.globalAlpha=0.7;ctx.beginPath();ctx.moveTo(q.x,y);ctx.lineTo(q.x-q.L*Math.min(1.6,0.4+p.cur/2),y);ctx.stroke();}});ctx.globalAlpha=1;
  // current indicator
  const cxl=X(0)>480?640:70;ctx.fillStyle=PAL['card'];ctx.globalAlpha=0.85;rr(ctx,cxl-8,top+8,140,44,8);ctx.fill();ctx.globalAlpha=1;if(p.cur>0.05)arrow(ctx,cxl,top+22,cxl+Math.min(110,10+p.cur*24),top+22,PAL['s6'],3);
  txt(ctx,'current '+f1(p.cur)+' m/s',cxl,top+44,{s:12*k,w:600,c:PAL['cv-ink']});
  // straight-across flag and dock
  const fx=X(0);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(fx,top-4);ctx.lineTo(fx,top-34);ctx.stroke();ctx.fillStyle=PAL['s4'];ctx.beginPath();ctx.moveTo(fx,top-34);ctx.lineTo(fx+18,top-28);ctx.lineTo(fx,top-22);ctx.fill();
  txt(ctx,'straight across',fx+8,top+18,{s:11.5*k,c:PAL['cv-ink'],w:600});
  ctx.fillStyle='#8a6a45';ctx.fillRect(fx-16,rv.yb-4,32,12);
  // ruler along near bank
  const stp=niceStep(rv.s,52*Math.min(k,1.4));ctx.fillStyle=PAL['cv-ruler'];ctx.fillRect(0,rv.yb+10,800,26);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1;
  const xs=Math.ceil(-rv.ox/rv.s/stp)*stp;for(let x=xs;X(x)<800;x+=stp){const xp=X(x);ctx.beginPath();ctx.moveTo(xp,rv.yb+10);ctx.lineTo(xp,rv.yb+19);ctx.stroke();if(xp>12&&xp<770)txt(ctx,(Math.abs(x)<1e-9?0:x).toFixed(0),xp,rv.yb+32,{s:11*k,a:'center'});}
  txt(ctx,'downstream (m) →',795,rv.yb+50>446?rv.yb+32:rv.yb+50,{s:11*k,a:'right',c:PAL['cv-soft']});
  // width marker
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(fx,rv.yb);ctx.lineTo(fx,top);ctx.stroke();ctx.setLineDash([]);
  const wx=X(0)>480?770:30;arrow(ctx,wx,(top+rv.yb)/2,wx,top+2,PAL['cv-ink'],1.6);arrow(ctx,wx,(top+rv.yb)/2,wx,rv.yb-2,PAL['cv-ink'],1.6);label(ctx,p.wid+' m',wx+(wx<400?26:-26),(top+rv.yb)/2,PAL['cv-ink'],k);
  // ghosts and current path
  const paths=st.ghosts.map(b=>[b,0.4]).concat(st.boat?[[st.boat,1]]:[]);
  paths.forEach(([b,al],i)=>{ctx.globalAlpha=al;ctx.strokeStyle=PAL['s1'];ctx.lineWidth=al<1?1.6:2.4;ctx.setLineDash(al<1?[5,4]:[]);ctx.beginPath();b.trail.forEach((q,j)=>j?ctx.lineTo(X(q[0]),Y(q[1])):ctx.moveTo(X(q[0]),Y(q[1])));if(!b.done)ctx.lineTo(X(b.x),Y(b.y));ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle=PAL['s1'];b.dots.forEach(q=>{ctx.beginPath();ctx.arc(X(q[0]),Y(q[1]),al<1?2.2:3.2,0,6.29);ctx.fill();});ctx.globalAlpha=1;
    if(b.done&&b.res){const lab=f1(b.res.t)+' s, '+(Math.abs(b.res.drift)<0.05?'no drift':f1(Math.abs(b.res.drift))+' m '+(b.res.drift>0?'downstream':'upstream'));label(ctx,lab,clamp(X(b.x),90,710),Math.max(12*k,top-14-(paths.length-1-i)*20*k),al<1?PAL['cv-soft']:PAL['s1'],k);}});
  // boat and vectors
  const b=st.boat;if(b){const v=boatVel(p),bx=X(b.x),by=Y(b.y),hd=Math.atan2(-v.wy,v.wx);boatShape(ctx,bx,by,hd,1.1);
    if(!b.done){const sc=Math.min(26,rv.s*3.2),tx=bx+v.wx*sc,ty=by-v.wy*sc;arrow(ctx,bx,by,tx,ty,PAL['s2'],3.2);arrow(ctx,tx,ty,tx+p.cur*sc,ty,PAL['s6'],3.2);arrow(ctx,bx,by,bx+v.gx*sc,by-v.gy*sc,PAL['s1'],3.6);}}
  // legend
  const lx=X(0)>480?8:520,ly=rv.yb-70;ctx.fillStyle=PAL['card'];ctx.globalAlpha=0.93;rr(ctx,lx,ly,272,62,8);ctx.fill();ctx.globalAlpha=1;
  [[PAL['s2'],hon?'boat relative to water ('+f1(p.bs)+' m/s)':'boat’s own push through the water'],[PAL['s6'],'current'],[PAL['s1'],hon?'boat relative to shore = sum':'where the boat really goes']].forEach((r,i)=>{arrow(ctx,lx+10,ly+14+i*18,lx+36,ly+14+i*18,r[0],2.6);txt(ctx,r[1],lx+44,ly+18+i*18,{s:11.5*k});});
  if(b&&!b.done)pill(ctx,'t = '+b.t.toFixed(1)+' s',X(b.x),Math.min(Y(b.y)+30,rv.yb-12),PAL['card'],PAL['cv-ink'],12*KF);}

function drawPlane(sim,ctx,vdt,k){const p=sim.p,st=sim.st,V=sim.vis,hon=atLeast('honors');const s=340/DEST,ox=400,oy=400,X=x=>ox+x*s,Y=y=>oy-y*s;
  ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(0,0,800,450);
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;for(let x=-7;x<=7;x++){ctx.beginPath();ctx.moveTo(X(x),0);ctx.lineTo(X(x),450);ctx.stroke();}for(let y=-1;y<=7;y++){ctx.beginPath();ctx.moveTo(0,Y(y));ctx.lineTo(800,Y(y));ctx.stroke();}
  for(let x=-6;x<=6;x+=2)if(x)txt(ctx,x+' km',X(x),444,{s:10.5*k,a:'center',c:PAL['cv-soft']});
  // wind streaks
  const pv=planeVel(p);if(!V.wind){V.wind=[];for(let i=0;i<40;i++)V.wind.push({x:Math.random()*800,y:Math.random()*450});}
  const wpx=pv.wx/1000*s*SIM.timeScale,wpy=-pv.wy/1000*s*SIM.timeScale,wl=Math.hypot(pv.wx,pv.wy);
  ctx.strokeStyle=PAL['s6'];ctx.lineWidth=1.6;ctx.globalAlpha=0.45;V.wind.forEach(q=>{q.x+=wpx*vdt;q.y+=wpy*vdt;q.x=(q.x+820)%820;q.y=(q.y+470)%470;
    if(wl>0.5){const L=6+wl*0.5;ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(q.x-pv.wx/wl*L,q.y+pv.wy/wl*L);ctx.stroke();}});ctx.globalAlpha=1;
  // compass
  const cx=40,cy=40;ctx.fillStyle=PAL['card'];ctx.beginPath();ctx.arc(cx,cy,24,0,6.29);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.stroke();arrow(ctx,cx,cy+12,cx,cy-16,PAL['cv-ink'],2);txt(ctx,'N',cx,cy+21,{s:10*k,w:700,a:'center'});
  // cities
  [[0,0,'Start'],[0,DEST,'City']].forEach(c=>{ctx.fillStyle=PAL['s4'];ctx.beginPath();ctx.arc(X(c[0]),Y(c[1]),8,0,6.29);ctx.fill();ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.stroke();txt(ctx,c[2],X(c[0])+14,Y(c[1])+5,{s:13*k,w:700});});
  ctx.strokeStyle=PAL['cv-soft'];ctx.setLineDash([3,5]);ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(X(0),Y(0));ctx.lineTo(X(0),Y(DEST));ctx.stroke();ctx.beginPath();ctx.moveTo(0,Y(DEST));ctx.lineTo(800,Y(DEST));ctx.stroke();ctx.setLineDash([]);
  // tracks
  const tr=st.pghosts.map(a=>[a,0.4]).concat(st.plane?[[st.plane,1]]:[]);
  tr.forEach(([a,al])=>{ctx.globalAlpha=al;ctx.strokeStyle=PAL['s1'];ctx.lineWidth=al<1?1.5:2.4;ctx.setLineDash(al<1?[5,4]:[]);ctx.beginPath();a.trail.forEach((q,j)=>j?ctx.lineTo(X(q[0]),Y(q[1])):ctx.moveTo(X(q[0]),Y(q[1])));if(!a.done)ctx.lineTo(X(a.x),Y(a.y));ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle=PAL['s1'];a.dots.forEach(q=>{ctx.beginPath();ctx.arc(X(q[0]),Y(q[1]),al<1?2:3,0,6.29);ctx.fill();});ctx.globalAlpha=1;
    if(a.done){const lab=a.arrived?(Math.abs(a.x)<0.05?'on target':f1(Math.abs(a.x))+' km '+(a.x>0?'east':'west')):'never arrived';label(ctx,lab,clamp(X(a.x),70,730),Y(a.y)-18,al<1?PAL['cv-soft']:PAL['s1'],k);}});
  const a=st.plane;if(a){const px=X(a.x),py=Y(a.y);planeShape(ctx,px,py,(a.lastHdg-90)*D2R,1.05);if(!a.done){const sc=0.9;arrow(ctx,px,py,px+pv.ax*sc,py-pv.ay*sc,PAL['s2'],2.6);arrow(ctx,px,py,px+pv.gx*sc,py-pv.gy*sc,PAL['s1'],3);}}
  // vector diagram inset
  const right=!a||a.x<1.5,ix=right?592:12,iy=232,iw=196,ih=206;ctx.fillStyle=PAL['card'];ctx.globalAlpha=0.95;rr(ctx,ix,iy,iw,ih,10);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,'Vector diagram',ix+10,iy+18,{s:12*k,w:700});const sc=Math.min(1.1,120/Math.max(1,p.as+p.ws));
  const oy2=iy+40+Math.max(pv.ay,pv.gy,0)*sc;const o2={x:ix+iw/2-(pv.gx*sc)/2,y:Math.min(iy+ih-14,oy2)};
  arrow(ctx,o2.x,o2.y,o2.x+pv.ax*sc,o2.y-pv.ay*sc,PAL['s2'],3);arrow(ctx,o2.x+pv.ax*sc,o2.y-pv.ay*sc,o2.x+pv.gx*sc,o2.y-pv.gy*sc,PAL['s6'],3);arrow(ctx,o2.x,o2.y,o2.x+pv.gx*sc,o2.y-pv.gy*sc,PAL['s1'],3.4);
  txt(ctx,hon?'air velocity + wind = ground velocity':'plane + wind = actual path',ix+iw/2,iy+ih-6,{s:10.5*k,a:'center',c:PAL['cv-soft']});
  // legend
  const lx=600,ly=8;ctx.fillStyle=PAL['card'];ctx.globalAlpha=0.93;rr(ctx,lx,ly,192,62,8);ctx.fill();ctx.globalAlpha=1;
  [[PAL['s2'],'heading × airspeed'],[PAL['s6'],'wind '+f1(p.ws)+' m/s'],[PAL['s1'],'ground velocity']].forEach((r,i)=>{arrow(ctx,lx+10,ly+14+i*18,lx+34,ly+14+i*18,r[0],2.6);txt(ctx,r[1],lx+42,ly+18+i*18,{s:11.5*k});});
  if(a&&!a.done)pill(ctx,'t = '+a.t.toFixed(0)+' s',X(a.x),Math.min(430,Y(a.y)+32),PAL['card'],PAL['cv-ink'],12*KF);}

function drawAdd(sim,ctx,vdt,k){const p=sim.p,st=sim.st,hon=atLeast('honors'),ap=atLeast('ap'),q=addVecs(p);
  const pts=[[0,0],[q.A.x,q.A.y],[q.R.x,q.R.y],[q.B.x,q.B.y]];let x0=Math.min(...pts.map(r=>r[0])),x1=Math.max(...pts.map(r=>r[0])),y0=Math.min(...pts.map(r=>r[1])),y1=Math.max(...pts.map(r=>r[1]));
  const s=Math.min(600/Math.max(x1-x0,4),330/Math.max(y1-y0,3),70),cx=(x0+x1)/2,cy=(y0+y1)/2,ox=400-cx*s-40,oy=235+cy*s,X=x=>ox+x*s,Y=y=>oy-y*s;
  ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);const gs=s<22?2:1;ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;
  for(let x=Math.ceil(-ox/s/gs)*gs;X(x)<800;x+=gs){ctx.beginPath();ctx.moveTo(X(x),0);ctx.lineTo(X(x),450);ctx.stroke();}
  for(let y=Math.ceil((oy-450)/s/gs)*gs;Y(y)>0;y+=gs){ctx.beginPath();ctx.moveTo(0,Y(y));ctx.lineTo(800,Y(y));ctx.stroke();}
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(0,Y(0));ctx.lineTo(800,Y(0));ctx.moveTo(X(0),0);ctx.lineTo(X(0),450);ctx.stroke();
  txt(ctx,'+x (east)',792,Y(0)-6,{s:11*k,a:'right',c:PAL['cv-soft']});txt(ctx,'+y (north)',X(0)+6,14,{s:11*k,c:PAL['cv-soft']});
  txt(ctx,'grid: '+gs+' m squares',12,440,{s:11*k,c:PAL['cv-soft']});
  const an=clamp(st.anim||0,0,1),e=an<0.5?2*an*an:1-Math.pow(-2*an+2,2)/2;
  // components
  const comp=(vx,vy,bx,by,col)=>{if(!p.comps)return;ctx.strokeStyle=col;ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(X(bx),Y(by));ctx.lineTo(X(bx+vx),Y(by));ctx.lineTo(X(bx+vx),Y(by+vy));ctx.stroke();ctx.setLineDash([]);};
  if(ap&&p.comps===false&&an>=1){ctx.strokeStyle=PAL['cv-soft'];ctx.globalAlpha=0.5;ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(X(q.B.x),Y(q.B.y));ctx.lineTo(X(q.R.x),Y(q.R.y));ctx.moveTo(X(0),Y(0));ctx.lineTo(X(q.B.x),Y(q.B.y));ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;}
  comp(q.A.x,q.A.y,0,0,PAL['s2']);
  arrow(ctx,X(0),Y(0),X(q.A.x),Y(q.A.y),PAL['s2'],3.6);
  if(q.sub){ctx.globalAlpha=0.5;arrow(ctx,X(0),Y(0),X(q.B0.x),Y(q.B0.y),PAL['s4'],2.4,[6,5]);ctx.globalAlpha=1;}
  const bx=q.A.x*e,by=q.A.y*e;comp(q.B.x,q.B.y,bx,by,PAL['s4']);arrow(ctx,X(bx),Y(by),X(bx+q.B.x),Y(by+q.B.y),PAL['s4'],3.6);
  if(an>=1){comp(q.R.x,q.R.y,0,0,PAL['s1']);arrow(ctx,X(0),Y(0),X(q.R.x),Y(q.R.y),PAL['s1'],4.2);
    const ra=Math.atan2(q.R.y,q.R.x),rm=Math.hypot(q.R.x,q.R.y);if(rm>0.2&&Math.abs(ra)>0.01){ctx.strokeStyle=PAL['s1'];ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(X(0),Y(0),30,0,-ra,ra>0);ctx.stroke();}}
  const mid=(ax,ay,bx2,by2)=>[X((ax+bx2)/2),Y((ay+by2)/2)];
  const off=(vx,vy,d)=>{const L=Math.hypot(vx,vy)||1;return [-vy/L*d,-vx/L*d];};
  let m=mid(0,0,q.A.x,q.A.y),o=off(q.A.x,q.A.y,16);label(ctx,'A = '+f1(p.am)+' m at '+p.aa+'°',m[0]+o[0]*1.4,m[1]+o[1]*1.4,PAL['s2'],k);
  m=mid(bx,by,bx+q.B.x,by+q.B.y);o=off(q.B.x,q.B.y,16);label(ctx,(q.sub?'−B, where B = ':'B = ')+f1(p.bm)+' m at '+p.ba+'°',m[0]-o[0]*1.4,m[1]-o[1]*1.4,PAL['s4'],k);
  if(an>=1){const rm=Math.hypot(q.R.x,q.R.y);m=mid(0,0,q.R.x,q.R.y);label(ctx,(q.sub?'A − B':'A + B')+' = '+f2(rm)+' m at '+angOf(q.R.x,q.R.y).toFixed(0)+'°',m[0],m[1]+22,PAL['s1'],k);}
  if(p.comps){const card=[['A',q.A,PAL['s2']],[q.sub?'−B':'B',q.B,PAL['s4']],[q.sub?'A−B':'R',q.R,PAL['s1']]];const cx2=592,cy2=10;ctx.fillStyle=PAL['card'];ctx.globalAlpha=0.94;rr(ctx,cx2,cy2,200,82,8);ctx.fill();ctx.globalAlpha=1;
    txt(ctx,'x',cx2+108,cy2+18,{s:12*k,w:700,a:'right'});txt(ctx,'y',cx2+180,cy2+18,{s:12*k,w:700,a:'right'});
    card.forEach((r,i)=>{txt(ctx,r[0],cx2+10,cy2+38+i*18,{s:12*k,w:700,c:r[2]});txt(ctx,f2(r[1].x),cx2+108,cy2+38+i*18,{s:12*k,a:'right'});txt(ctx,f2(r[1].y),cx2+180,cy2+38+i*18,{s:12*k,a:'right'});});}
  if(an<1)pill(ctx,'sliding B so its tail sits on A’s tip…',400,26,PAL['card'],PAL['cv-ink'],12*KF);}

function drawPuck(sim,ctx,vdt,k){const p=sim.p,st=sim.st,q=st.puck,s=TBL.s,X=x=>TBL.x0+x*s,Y=y=>TBL.y1-y*s,hon=atLeast('honors');
  ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(0,0,800,450);ctx.fillStyle=PAL['card'];rr(ctx,TBL.x0-10,TBL.y0-10,TBL.x1-TBL.x0+20,TBL.y1-TBL.y0+20,10);ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=3;ctx.stroke();
  for(let x=0;x<=TBL.w+1e-9;x+=0.05){const major=Math.round(x*100)%10===0;ctx.strokeStyle=PAL['line'];ctx.lineWidth=major?1.4:0.6;ctx.beginPath();ctx.moveTo(X(x),TBL.y0);ctx.lineTo(X(x),TBL.y1);ctx.stroke();if(major)txt(ctx,Math.round(x*100)+'',X(x),TBL.y1+24,{s:10.5*k,a:'center',c:PAL['cv-soft']});}
  for(let y=0;y<=TBL.h+1e-9;y+=0.05){const major=Math.round(y*100)%10===0;ctx.strokeStyle=PAL['line'];ctx.lineWidth=major?1.4:0.6;ctx.beginPath();ctx.moveTo(TBL.x0,Y(y));ctx.lineTo(TBL.x1,Y(y));ctx.stroke();if(major)txt(ctx,Math.round(y*100)+'',TBL.x0-16,Y(y),{s:10.5*k,a:'right',b:'middle',c:PAL['cv-soft']});}
  txt(ctx,'x (cm)',TBL.x1,TBL.y1+40,{s:11*k,a:'right',c:PAL['cv-soft']});txt(ctx,'y (cm)',8,TBL.y0-18,{s:11*k,c:PAL['cv-soft']});
  if(!q)return;
  q.dots.forEach((d,i)=>{const xx=X(d.x),yy=Y(d.y),mk=st.marks.includes(i);ctx.strokeStyle=mk?PAL['rj']:PAL['s2'];ctx.globalAlpha=mk?1:0.45;ctx.lineWidth=mk?2.4:1.4;ctx.beginPath();ctx.arc(xx,yy,PR*s,0,6.29);ctx.stroke();ctx.globalAlpha=1;
    ctx.fillStyle=mk?PAL['rj']:PAL['s2'];ctx.beginPath();ctx.arc(xx,yy,mk?4:3,0,6.29);ctx.fill();});
  // puck
  const px=X(q.x),py=Y(q.y),g=ctx.createRadialGradient(px-6,py-6,2,px,py,PR*s);g.addColorStop(0,'#ff6b6b');g.addColorStop(1,'#a1121f');ctx.fillStyle=g;ctx.beginPath();ctx.arc(px,py,PR*s,0,6.29);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(px,py,3,0,6.29);ctx.fill();
  if(!q.done){const sc=110;arrow(ctx,px,py,px+q.vx*sc,py-q.vy*sc,PAL['s1'],3);if(hon){arrow(ctx,px,py,px+q.vx*sc,py,PAL['s2'],2.2,[4,3]);arrow(ctx,px+q.vx*sc,py,px+q.vx*sc,py-q.vy*sc,PAL['s6'],2.2,[4,3]);}}
  const ms=measured(st);if(ms){const a=q.dots[st.marks[0]],b=q.dots[st.marks[1]];ctx.strokeStyle=PAL['rj'];ctx.lineWidth=1.6;ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(X(a.x),Y(a.y));ctx.lineTo(X(b.x),Y(a.y));ctx.lineTo(X(b.x),Y(b.y));ctx.stroke();ctx.setLineDash([]);
    label(ctx,'Δx = '+(Math.abs(ms.dx)*100).toFixed(1)+' cm',(X(a.x)+X(b.x))/2,Y(a.y)+(b.y>a.y?18:-18),PAL['rj'],k);label(ctx,'Δy = '+(Math.abs(ms.dy)*100).toFixed(1)+' cm',X(b.x)+(b.x>a.x?-62:62),(Y(a.y)+Y(b.y))/2,PAL['rj'],k);}
  pill(ctx,'strobe every '+q.dt+' s  ·  '+q.dots.length+' dots',400,30,PAL['card'],PAL['cv-ink'],12*KF);
  if(st.marks.length<2&&q.done)txt(ctx,'Click two dots (or press Mark first and last dots) to measure.',400,TBL.y1+44,{s:12*k,a:'center',c:PAL['cv-ink'],w:600});}

const SIM={
  id:ID,hash:ID,apUnit:1,order:3,tab:'Vectors and 2D motion',kind:'Simulation',prereq:['motion1d'],next:['projectile'],
  card:'Steer a boat across a river, fly a plane through a crosswind, add vectors tip to tail, and measure a gliding puck’s velocity components.',
  title:'Vectors and two-dimensional motion',
  lede:{bio:'Velocities add like arrows. A boat crossing a river goes where its own push and the current together send it.',
    honors:'Add vectors tip to tail, split them into x and y components with sine and cosine, and see that perpendicular motions do not affect each other.',
    ap:'Use relative velocity, v<sub>boat/shore</sub> = v<sub>boat/water</sub> + v<sub>water/shore</sub>, solve for headings, and measure velocity components from strobe data.'},
  scale:{bio:'River: seen from above, tens of meters across. Plane: a 6 km trip on a map. Puck: a 1.2 m air table with 5 cm grid squares.'},
  aspect:16/9,timeScale:1,dtMax:0.02,sampleDt:0.1,window:30,unit:'s',chChange:1,chReveal:12,
  controls:[
    {id:'mode',label:'Scene',type:'seg',def:'river',options:[{v:'river',l:'River crossing'},{v:'plane',l:'Plane in wind'},{v:'add',l:'Add vectors'},{v:'puck',l:'Air-table puck'}],
      onChange(sim){setModeTime(sim);sync(sim);if(sim.st)launch(sim);}},
    {id:'bs',label:'Boat speed in still water',type:'range',min:1,max:6,step:0.1,def:3,unit:'m/s'},
    {id:'aim',label:'Aim upstream by',type:'range',min:-60,max:60,step:1,def:0,unit:'°',help:'0° points straight across. Negative angles point downstream.'},
    {id:'cur',label:'River current',type:'range',min:0,max:4,step:0.1,def:1.5,unit:'m/s'},
    {id:'wid',label:'River width',lvl:'honors',type:'range',min:20,max:100,step:5,def:40,unit:'m',onChange(sim){if(sim.st&&sim.st.boat&&sim.st.boat.y>sim.p.wid){sim.st.boat.y=sim.p.wid;}}},
    {id:'as',label:'Airspeed',type:'range',min:30,max:120,step:1,def:60,unit:'m/s'},
    {id:'hdg',label:'Heading (east of north)',type:'range',min:-60,max:60,step:1,def:0,unit:'°',help:'The way the nose points. Negative = west of north.'},
    {id:'ws',label:'Wind speed',type:'range',min:0,max:50,step:1,def:30,unit:'m/s'},
    {id:'wd',label:'Wind blows toward',lvl:'honors',type:'range',min:0,max:355,step:5,def:90,unit:'°',help:'Compass direction: 0° north, 90° east, 180° south, 270° west.'},
    {id:'am',label:'Vector A size',type:'range',min:0,max:10,step:0.5,def:3,unit:'m',onChange(sim){if(sim.st)sim.st.anim=0;}},
    {id:'aa',label:'A direction',type:'range',min:0,max:355,step:5,def:0,unit:'°',help:'Counterclockwise from +x (east).',onChange(sim){if(sim.st)sim.st.anim=0;}},
    {id:'bm',label:'Vector B size',type:'range',min:0,max:10,step:0.5,def:4,unit:'m',onChange(sim){if(sim.st)sim.st.anim=0;}},
    {id:'ba',label:'B direction',type:'range',min:0,max:355,step:5,def:90,unit:'°',onChange(sim){if(sim.st)sim.st.anim=0;}},
    {id:'op',label:'Operation',lvl:'honors',type:'seg',def:'add',options:[{v:'add',l:'A + B'},{v:'sub',l:'A − B'}],onChange(sim){if(sim.st)sim.st.anim=0;}},
    {id:'comps',label:'Show x and y components',type:'toggle',def:false},
    {id:'pvx',label:'Puck velocity to the right, v<sub>x</sub>',type:'range',min:0.1,max:1,step:0.05,def:0.6,unit:'m/s',onChange(sim){if(sim.st&&sim.p.mode==='puck')launch(sim);}},
    {id:'pvy',label:'Puck velocity up the table, v<sub>y</sub>',type:'range',min:-0.4,max:0.4,step:0.05,def:0.25,unit:'m/s',onChange(sim){if(sim.st&&sim.p.mode==='puck')launch(sim);}},
    {id:'pst',label:'Strobe every',type:'seg',def:'0.1',options:[{v:'0.05',l:'0.05 s'},{v:'0.1',l:'0.1 s'},{v:'0.2',l:'0.2 s'}],onChange(sim){if(sim.st&&sim.p.mode==='puck')launch(sim);}}
  ],
  actions:[
    {id:'go',label:'Start again',primary:true,run(sim){launch(sim);}},
    {id:'mark',label:'Mark first and last dots',run(sim){markEnds(sim.st);}},
    {id:'clear',label:'Clear old paths',run(sim){sim.st.ghosts=[];sim.st.pghosts=[];sim.st.marks=[];}}
  ],
  init(sim){const st={boat:null,ghosts:[],plane:null,pghosts:[],puck:null,marks:[],anim:0};sim.st=st;setModeTime(sim);
    const m=sim.p.mode;['river','plane','puck'].forEach(md=>{sim.p.mode=md;launch(sim);});sim.p.mode=m;st.anim=0;return st;},
  step(sim,dt){const st=sim.st;stepRiver(sim,dt);stepPlane(sim,dt);stepPuck(sim,dt);st.anim=Math.min(1,(st.anim||0)+dt/1.2);},
  metrics:[
    {id:'crossT',label:'Time on the water',unit:'s',d:1,min:0,max:null,get(sim){const b=sim.st.boat;return b?b.t:0;}},
    {id:'drift',label:'Downstream drift',unit:'m',d:1,max:null,get(sim){const b=sim.st.boat;return b?b.x:0;}},
    {id:'gsr',label:'Speed relative to shore',unit:'m/s',d:2,min:0,max:null,get(sim){const v=boatVel(sim.p);return Math.hypot(v.gx,v.gy);}},
    {id:'vac',label:'Velocity across',lvl:'honors',unit:'m/s',d:2,max:null,get(sim){return boatVel(sim.p).gy;}},
    {id:'vdn',label:'Velocity downstream',lvl:'honors',unit:'m/s',d:2,max:null,get(sim){return boatVel(sim.p).gx;}},
    {id:'zeroAim',label:'Aim for zero drift, sin⁻¹(v<sub>c</sub>/v<sub>b</sub>)',lvl:'ap',unit:'°',d:1,max:null,get(sim){const p=sim.p;return p.cur<=p.bs?Math.asin(p.cur/p.bs)/D2R:null;}},
    {id:'yAcross',label:'Distance across',lvl:'honors',unit:'m',d:1,min:0,max:null,get(sim){const b=sim.st.boat;return b?b.y:0;}},
    {id:'xDown',label:'Distance downstream',lvl:'honors',unit:'m',d:1,max:null,get(sim){const b=sim.st.boat;return b?b.x:0;}},
    {id:'gsp',label:'Ground speed',unit:'m/s',d:1,min:0,max:null,get(sim){const v=planeVel(sim.p);return Math.hypot(v.gx,v.gy);}},
    {id:'trk',label:'Direction of travel (east of north)',unit:'°',d:0,max:null,get(sim){const v=planeVel(sim.p);return Math.atan2(v.gx,v.gy)/D2R;}},
    {id:'pft',label:'Flight time',unit:'s',d:0,min:0,max:null,get(sim){const a=sim.st.plane;return a?a.t:0;}},
    {id:'east',label:'Distance east of the city line',unit:'km',d:2,max:null,get(sim){const a=sim.st.plane;return a?a.x:0;}},
    {id:'need',label:'Heading needed to fly due north',lvl:'ap',unit:'°',d:1,max:null,get(sim){const v=planeVel(sim.p),p=sim.p;if(Math.abs(v.wx)>p.as)return null;const h=Math.asin(-v.wx/p.as);return p.as*Math.cos(h)+v.wy>0?h/D2R:null;}},
    {id:'pn',label:'Distance north',lvl:'honors',unit:'km',d:2,max:null,get(sim){const a=sim.st.plane;return a?a.y:0;}},
    {id:'pe',label:'Distance east',lvl:'honors',unit:'km',d:2,max:null,get(sim){const a=sim.st.plane;return a?a.x:0;}},
    {id:'rmag',label:'Resultant size',unit:'m',d:2,min:0,max:null,get(sim){const q=addVecs(sim.p);return Math.hypot(q.R.x,q.R.y);}},
    {id:'rang',label:'Resultant direction',unit:'°',d:0,max:null,get(sim){const q=addVecs(sim.p);return angOf(q.R.x,q.R.y);}},
    {id:'ax',label:'A<sub>x</sub> = A cos θ',lvl:'honors',unit:'m',d:2,max:null,get(sim){return addVecs(sim.p).A.x;}},
    {id:'ay',label:'A<sub>y</sub> = A sin θ',lvl:'honors',unit:'m',d:2,max:null,get(sim){return addVecs(sim.p).A.y;}},
    {id:'rx',label:'R<sub>x</sub>',lvl:'honors',unit:'m',d:2,max:null,get(sim){return addVecs(sim.p).R.x;}},
    {id:'ry',label:'R<sub>y</sub>',lvl:'honors',unit:'m',d:2,max:null,get(sim){return addVecs(sim.p).R.y;}},
    {id:'uvec',label:'Unit-vector form',lvl:'ap',text:true,get(sim){const q=addVecs(sim.p);const sg=v=>v<0?'− '+Math.abs(v).toFixed(2):'+ '+v.toFixed(2);return 'R = '+q.R.x.toFixed(2)+' î '+sg(q.R.y)+' ĵ m';}},
    {id:'pspd',label:'Puck speed',unit:'m/s',d:2,min:0,max:null,get(sim){const q=sim.st.puck;return q?Math.hypot(q.vx,q.vy):0;}},
    {id:'px',label:'Puck x',lvl:'honors',unit:'m',d:3,min:0,max:null,get(sim){const q=sim.st.puck;return q?q.x:0;}},
    {id:'py',label:'Puck y',lvl:'honors',unit:'m',d:3,min:0,max:null,get(sim){const q=sim.st.puck;return q?q.y:0;}},
    {id:'mdt',label:'Measured Δt',unit:'s',d:2,max:null,get(sim){const m=measured(sim.st);return m?m.dt:null;}},
    {id:'mdx',label:'Measured Δx',unit:'cm',d:1,max:null,get(sim){const m=measured(sim.st);return m?m.dx*100:null;}},
    {id:'mdy',label:'Measured Δy',unit:'cm',d:1,max:null,get(sim){const m=measured(sim.st);return m?m.dy*100:null;}},
    {id:'mspd',label:'Measured speed, distance ÷ Δt',unit:'m/s',d:2,max:null,get(sim){const m=measured(sim.st);return m?Math.hypot(m.dx,m.dy)/m.dt:null;}},
    {id:'mvx',label:'Measured v<sub>x</sub> = Δx/Δt',lvl:'honors',unit:'m/s',d:2,max:null,get(sim){const m=measured(sim.st);return m?m.dx/m.dt:null;}},
    {id:'mvy',label:'Measured v<sub>y</sub> = Δy/Δt',lvl:'honors',unit:'m/s',d:2,max:null,get(sim){const m=measured(sim.st);return m?m.dy/m.dt:null;}}
  ],
  graphs:[{id:'river',label:'River: distance across and downstream',lvl:'honors',lines:['yAcross','xDown']},{id:'plane',label:'Plane: distance north and east',lvl:'honors',lines:['pn','pe']},{id:'puck',label:'Puck: x and y position',lvl:'honors',lines:['px','py']},
    {id:'g-cross',label:'River: time on the water',lines:['crossT']},{id:'g-drift',label:'River: downstream drift',lines:['drift']}],
  defaultGraph:'g-drift',
  onLevel(sim){sync(sim);setModeTime(sim);},
  narrate(sim){const p=sim.p,st=sim.st,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode==='river'){const b=st.boat,v=boatVel(p);if(!b)return '';
      if(v.gy<=0.01)return 'Aimed this far upstream, the boat makes no progress across. Point it more toward the far bank.';
      const tc=p.wid/v.gy;
      if(!b.done){let t=hon?`The boat points ${p.aim>0?p.aim+'° upstream':p.aim<0?(-p.aim)+'° downstream':'straight across'}, but it moves along the red arrow: ${f2(v.gy)} m/s across plus ${f2(v.gx)} m/s downstream.`
        :`The boat points ${p.aim>0?'upstream':p.aim<0?'downstream':'straight across'}, but the current carries it ${v.gx>0.02?'downstream':v.gx<-0.02?'upstream':'nowhere sideways'} while it crosses.`;
        t+=hon?` Only the across part, ${f2(v.gy)} m/s, gets it to the far bank: <b>t = ${p.wid} m ÷ ${f2(v.gy)} m/s = ${f1(tc)} s</b>.`:` Its speed relative to the shore is ${f2(Math.hypot(v.gx,v.gy))} m/s.`;return t;}
      let t=`Crossed in <b>${f1(b.res.t)} s</b>, ${Math.abs(b.res.drift)<0.05?'landing directly across':f1(Math.abs(b.res.drift))+' m '+(b.res.drift>0?'downstream':'upstream')}.`;
      t+=hon?` Crossing time depends only on the velocity across (${f2(v.gy)} m/s); the current changes only the drift, ${f2(v.gx)} m/s × ${f1(tc)} s.`:` A faster current pushes the boat farther downstream, but it does not change how long the crossing takes.`;
      if(ap&&p.cur<=p.bs)t+=` To land straight across, aim ${f1(Math.asin(p.cur/p.bs)/D2R)}° upstream so v<sub>b</sub> sin θ cancels the current.`;return t;}
    if(p.mode==='plane'){const a=st.plane,v=planeVel(p),trk=Math.atan2(v.gx,v.gy)/D2R;if(!a)return '';
      let t=`The nose points ${p.hdg===0?'due north':Math.abs(p.hdg)+'° '+(p.hdg>0?'east':'west')+' of north'}, but the plane tracks ${Math.abs(trk)<0.5?'due north':f1(Math.abs(trk))+'° '+(trk>0?'east':'west')+' of north'} at ${f1(Math.hypot(v.gx,v.gy))} m/s over the ground.`;
      if(a.done)t+=a.arrived?(Math.abs(a.x)<0.05?' <b>It reached the city.</b>':` It reached the city’s latitude ${f2(Math.abs(a.x))} km ${a.x>0?'east':'west'} of the city.`):' It never reached the city.';
      if(hon)t+=` Ground velocity = air velocity + wind: (${f1(v.ax)}, ${f1(v.ay)}) + (${f1(v.wx)}, ${f1(v.wy)}) = (${f1(v.gx)}, ${f1(v.gy)}) m/s east and north.`;
      else t+=' To fly straight to the city, point the nose partly into the wind.';return t;}
    if(p.mode==='add'){const q=addVecs(p),rm=Math.hypot(q.R.x,q.R.y);
      let t=q.sub?`To subtract, add the opposite: A − B = A + (−B). The dashed arrow is B; flip it, then go tip to tail.`:`Tip to tail: put B’s tail on A’s tip. The resultant runs from A’s tail to B’s tip.`;
      t+=` It is <b>${f2(rm)} m at ${angOf(q.R.x,q.R.y).toFixed(0)}°</b>${!hon&&Math.abs(p.am+p.bm-rm)>0.05?', shorter than '+f1(p.am)+' + '+f1(p.bm)+' because the arrows do not point the same way':''}.`;
      if(hon){const pm=v=>v<0?'− '+f2(-v):'+ '+f2(v);t+=` Components add separately: R<sub>x</sub> = ${f2(q.A.x)} ${pm(q.B.x)} = ${f2(q.R.x)} m and R<sub>y</sub> = ${f2(q.A.y)} ${pm(q.B.y)} = ${f2(q.R.y)} m.`;}
      if(ap)t+=` |R| = √(R<sub>x</sub>² + R<sub>y</sub>²), θ = tan⁻¹(R<sub>y</sub>/R<sub>x</sub>), placed in the right quadrant.`;return t;}
    const q=st.puck;if(!q)return '';const ms=measured(st);
    let t=`The puck glides on an air cushion with almost no friction, so its velocity stays constant: every ${q.dt} s it moves the same ${f1(q.vx*q.dt*100)} cm right and ${f1(q.vy*q.dt*100)} cm ${q.vy>=0?'up':'down'}.`;
    if(ms)t+=hon?` From your marks: v<sub>x</sub> = ${f1(ms.dx*100)} cm ÷ ${f2(ms.dt)} s = <b>${f2(ms.dx/ms.dt)} m/s</b>, v<sub>y</sub> = <b>${f2(ms.dy/ms.dt)} m/s</b>.`:` From your marks, speed = distance ÷ time = <b>${f2(Math.hypot(ms.dx,ms.dy)/ms.dt)} m/s</b>.`;
    else t+=' Mark two dots to measure its velocity.';return t;},
  tour:[
    {title:'Crossing a river',text:'The boat points straight across at 3 m/s while the river flows at 1.5 m/s. Watch where it really goes: the red dots, one per second, march diagonally.',speed:1,
      focus:sim=>{const r=sim.vis.rv;return r?[0,r.yb-r.s*sim.p.wid-40,800,r.s*sim.p.wid+80]:[0,40,800,380];},setup(sim){BioLab.setValues(sim,{mode:'river'});BioLab.reset(sim);}},
    {title:'Tip to tail',text:{bio:'Blue is the boat’s own push. Teal is the current, drawn from the tip of the blue arrow. Red joins the start to the end: that is the boat’s real velocity.',honors:'v<sub>boat/shore</sub> = v<sub>boat/water</sub> + v<sub>water/shore</sub>. The red arrow is the vector sum, √(3² + 1.5²) = 3.35 m/s.'},speed:0.5,
      focus:sim=>{const b=sim.st.boat,r=sim.vis.rv;if(!b||!r)return [200,100,400,250];const x=r.ox+b.x*r.s,y=r.yb-b.y*r.s;return [x-60,y-110,200,170];},setup(sim){}},
    {title:'Measure time and drift',text:'The ruler along the near bank is in meters. When the boat lands, the label gives the crossing time and how far downstream it drifted.',speed:2,
      focus:[0,0,800,450],setup(sim){}},
    {title:'Aim upstream',text:{bio:'Now the boat is faster (4 m/s), the current is 2 m/s, and the boat aims 30° upstream. Part of its push cancels the current, so it lands right at the flag.',honors:'4 sin 30° = 2 m/s upstream cancels the 2 m/s current. Only 4 cos 30° = 3.46 m/s is left to cross, so the trip takes longer: 40 ÷ 3.46 = 11.5 s.'},speed:2,
      focus:[0,0,800,450],setup(sim){BioLab.setValues(sim,{bs:4,cur:2,aim:30});launch(sim);}},
    {title:'A plane in a crosswind',text:'Same idea in the air. With a 30 m/s wind toward the east, the plane points 30° west of north so its ground track runs straight to the city. The nose and the path point different ways.',speed:1,
      focus:[0,0,800,450],setup(sim){BioLab.setValues(sim,{mode:'plane',hdg:-30,as:60,ws:30,wd:90});launch(sim);}},
    {title:'Adding any two vectors',text:{bio:'3 m east plus 4 m north: slide B to A’s tip, and the resultant is 5 m long, not 7 m.',honors:'Each vector splits into x and y components (dashed). Add the x’s, add the y’s, then rebuild the resultant with the Pythagorean theorem.'},speed:0.6,
      focus:[0,0,800,450],setup(sim){BioLab.setValues(sim,{mode:'add',am:3,aa:0,bm:4,ba:90,comps:atLeast('honors')});sim.st.anim=0;}},
    {title:'Measure a velocity from a strobe',text:'The puck glides at constant velocity. Strobe images every 0.1 s are evenly spaced. Mark the first and last images: Δx ÷ Δt gives v<sub>x</sub>, and Δy ÷ Δt gives v<sub>y</sub>.',speed:1,
      focus:[TBL.x0-14,TBL.y0-14,TBL.x1-TBL.x0+28,TBL.y1-TBL.y0+60],setup(sim){BioLab.setValues(sim,{mode:'puck',pvx:0.6,pvy:0.25});launch(sim);sim.st.autoMark=true;}}
  ],
  onTourExit(sim){const base={};SIM.controls.forEach(c=>base[c.id]=c.def);BioLab.setValues(sim,base);BioLab.reset(sim);},
  challenges:[
    {lvl:'bio',q:'The boat points straight across. Triple the current from 1 to 3 m/s. What happens to the time it takes to cross?',choices:['It takes longer','It takes the same time','It takes less time'],correct:1,
      baseline:{mode:'river',bs:3,aim:0,cur:1,wid:40},change:{cur:3},changeAction:'go',changeText:'Current tripled; crossing again',at:14,reveal:29,watch:'crossT',
      explain:{bio:'Same time, 13.3 s. The current only pushes the boat sideways, so it lands farther downstream, but the boat crosses at the same rate.',honors:'t = width ÷ v<sub>across</sub> = 40 ÷ 3 = 13.3 s both times. The current adds a perpendicular component that only changes the drift, from 13 m to 40 m.',ap:'Perpendicular components are independent: v<sub>y</sub> = v<sub>b</sub>cos θ sets t, and v<sub>x</sub> = v<sub>c</sub> − v<sub>b</sub>sin θ sets the drift.'}},
    {lvl:'bio',q:'The current is 2 m/s and the boat goes 4 m/s. Where should the boat point to land directly across, at the flag?',choices:['Straight across','Angled downstream','Angled upstream'],correct:2,
      baseline:{mode:'river',bs:4,aim:0,cur:2,wid:40},change:{aim:30},changeAction:'go',changeText:'Aimed 30° upstream',at:11,reveal:24,watch:'g-drift',
      explain:{bio:'Upstream. Part of the boat’s push now fights the current, so the two cancel sideways and the boat lands at the flag.',honors:'At 30° upstream, 4 sin 30° = 2 m/s upstream exactly cancels the 2 m/s current, so the drift is zero.',ap:'Zero drift needs v<sub>b</sub> sin θ = v<sub>c</sub>, θ = sin⁻¹(2/4) = 30°. It is impossible if v<sub>c</sub> > v<sub>b</sub>.'}},
    {lvl:'bio',q:'Walk 3 m east, then 4 m north. How far are you from where you started?',choices:['7 m','5 m','1 m'],correct:1,
      baseline:{mode:'add',am:3,aa:0,bm:4,ba:90,op:'add'},at:0.2,reveal:2.2,
      explain:{bio:'5 m. The two walks are at right angles, so the straight-line distance is the long side of a 3-4-5 triangle, not 3 + 4.',honors:'|R| = √(3² + 4²) = 5 m, at tan⁻¹(4/3) = 53° north of east.',ap:'R = 3î + 4ĵ m; |R| = 5 m. Magnitudes add only when the vectors are parallel.'}},
    {lvl:'honors',q:'With a 2 m/s current, the 4 m/s boat aims 30° upstream to land directly across. Compared with pointing straight across, the crossing takes:',choices:['Less time','The same time','More time'],correct:2,
      baseline:{mode:'river',bs:4,aim:0,cur:2,wid:40},change:{aim:30},changeAction:'go',changeText:'Aimed 30° upstream',at:11,reveal:24,watch:'crossT',
      explain:{honors:'More time: 11.5 s instead of 10.0 s. Aiming upstream spends part of the boat’s speed fighting the current, leaving only 4 cos 30° = 3.46 m/s to cross.',ap:'t = w/(v<sub>b</sub>cos θ). Pointing straight across (θ = 0) always gives the fastest crossing; zero drift costs time.'}},
    {lvl:'honors',q:'Vector A is 10 m at 30° above the +x axis. What is its x component?',choices:['5.0 m','8.7 m','10 m'],correct:1,
      baseline:{mode:'add',am:10,aa:30,bm:0,ba:90,op:'add',comps:false},change:{comps:true},changeText:'Components shown',at:1.4,reveal:3,
      explain:{honors:'A<sub>x</sub> = A cos 30° = 10 × 0.866 = 8.7 m, and A<sub>y</sub> = A sin 30° = 5.0 m. Cosine goes with the side next to the angle.',ap:'A = 8.66î + 5.00ĵ m. Check: √(8.66² + 5²) = 10 m.'}},
    {lvl:'ap',q:'The wind blows toward the east at 30 m/s and the plane’s airspeed is 60 m/s. Which heading flies it straight to the city due north?',choices:['Due north','30° west of north','60° west of north','30° east of north'],correct:1,
      baseline:{mode:'plane',as:60,ws:30,wd:90,hdg:0},change:{hdg:-30},changeAction:'go',changeText:'Heading 30° west of north',at:104,reveal:225,watch:'pe',
      explain:{ap:'sin θ = 30/60, so θ = 30° west of north. The west part of the air velocity, 60 sin 30° = 30 m/s, cancels the wind. Ground speed drops to 60 cos 30° = 52 m/s, so the trip takes 115 s instead of 100 s.'}},
    {lvl:'ap',q:'The puck moves with v<sub>x</sub> = 0.30 m/s and v<sub>y</sub> = 0.40 m/s (speed 0.50 m/s). Double only v<sub>x</sub>. Its new speed is:',choices:['1.00 m/s','0.72 m/s','0.60 m/s'],correct:1,
      baseline:{mode:'puck',pvx:0.3,pvy:0.4,pst:'0.1'},change:{pvx:0.6},changeText:'v<sub>x</sub> doubled',at:1.2,reveal:2.8,watch:'puck',
      explain:{ap:'|v| = √(0.60² + 0.40²) = 0.72 m/s. Doubling one component does not double the magnitude, and v<sub>y</sub> is unchanged: the strobe spacing up the table stays 4 cm.'}}
  ],
  lab:{bio:'<p><b>Question:</b> Does a faster current change how long it takes to cross a river?</p><ol><li>Choose <b>River crossing</b>. Point the boat straight across at 3 m/s.</li><li>Set the current to 0, 1, 2 and 3 m/s. For each, press <b>Start again</b>, wait for the boat to land, and press <b>Record trial</b>.</li><li>Compare the time on the water and the downstream drift.</li></ol><p>Write a claim: what does the current change, and what does it not change?</p>',
    honors:'<p><b>Question:</b> How can you measure a velocity’s components from a strobe photo? (Pivot: 2D constant velocity)</p><ol><li>Choose <b>Air-table puck</b>. Pick any v<sub>x</sub> and v<sub>y</sub>.</li><li>When the puck stops, mark the first and last dots. Read Δx, Δy and Δt.</li><li>Calculate v<sub>x</sub> = Δx/Δt and v<sub>y</sub> = Δy/Δt, then the speed and direction with the Pythagorean theorem and tan⁻¹.</li><li>Compare with the settings. Repeat for three launches.</li></ol><p>Explain why the dots are evenly spaced in both x and y.</p>',
    ap:'<p><b>Question:</b> What heading lands the boat directly across, and what does it cost?</p><ol><li>Set the boat to 4 m/s and the current to 2 m/s.</li><li>For aims of 0°, 10°, 20°, 30° and 40° upstream, record the crossing time and drift.</li><li>Plot drift against sin θ and crossing time against 1/cos θ.</li></ol><p>Write a CER that derives θ = sin⁻¹(v<sub>c</sub>/v<sub>b</sub>) from your linear fit, and explain why no heading works when v<sub>c</sub> > v<sub>b</sub>.</p>'},
  terms:[{t:'Vector',d:'A quantity with a size (magnitude) and a direction, drawn as an arrow.'},{t:'Resultant',d:'The single vector equal to two or more vectors added together.'},
    {t:'Tip to tail',d:'Adding vectors by placing each one’s tail on the previous one’s tip.'},{t:'Relative velocity',d:'Velocity measured from a particular reference frame, such as the water or the shore.'},
    {t:'Components',lvl:'honors',d:'The x and y parts of a vector: A<sub>x</sub> = A cos θ, A<sub>y</sub> = A sin θ.'},{t:'Independence of perpendicular motions',lvl:'honors',d:'Motion along x does not affect motion along y.'},
    {t:'Unit vectors',lvl:'ap',d:'î and ĵ point along +x and +y with length 1, so A = A<sub>x</sub>î + A<sub>y</sub>ĵ.'},{t:'Heading and track',lvl:'ap',d:'Heading is where the nose points; track is the direction of the ground velocity.'}],
  about:'<p>River: the boat’s velocity relative to the shore is its velocity relative to the water plus a uniform current (real rivers flow faster mid-channel). Plane: ground velocity = air velocity + a uniform, steady wind; the clock runs at 10× in this scene. Vector sandbox: exact vector arithmetic, angles counterclockwise from +x. Puck: constant velocity with no friction; it stops at the table edge instead of bouncing.</p><p>All positions are integrated exactly (constant velocity), and strobe dots fall at exact multiples of the strobe interval.</p>',
  onClick(sim,x,y){const st=sim.st;if(sim.p.mode!=='puck'||!st.puck)return;const s=TBL.s;let bi=-1,bd=18;st.puck.dots.forEach((d,i)=>{const dd=Math.hypot(TBL.x0+d.x*s-x,TBL.y1-d.y*s-y);if(dd<bd){bd=dd;bi=i;}});
    if(bi<0)return;if(st.marks.length>=2)st.marks=[];if(!st.marks.includes(bi))st.marks.push(bi);},
  initVis(sim){sync(sim);},
  draw(sim,ctx,vdt,k){KF=k;k=Math.min(k,1.2);const m=sim.p.mode;if(sim.st.autoMark&&sim.st.puck&&sim.st.puck.done){markEnds(sim.st);sim.st.autoMark=false;}
    if(m==='river')drawRiver(sim,ctx,vdt,k);else if(m==='plane')drawPlane(sim,ctx,vdt,k);else if(m==='add')drawAdd(sim,ctx,vdt,k);else drawPuck(sim,ctx,vdt,k);}
};
BioLab.register(SIM);
})();
