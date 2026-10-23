(function(){
'use strict';
const {clamp,lerp,rr,txt,pill,PAL,FONT,atLeast,fmtNum}=BioLab.h;
let KF=1;const ID='circular',G=9.8,D2R=Math.PI/180,TAU=Math.PI*2;
const f1=v=>fmtNum(v,1),f2=v=>fmtNum(v,2),z=v=>Math.abs(v)<1e-9?0:v;
const BY={string:['m','r','v'],curve:['cv','cr','mu','bank','cm'],loop:['lR','lv','lm'],rotor:['rR','rpm','rmu','rm']};
const MBY={string:['Fc','sspd','lap','ac','tcalc','om'],curve:['cspd','grip','fneed','fmax','vmax','vdes'],loop:['lspd','feel','vtop','ntop','vmin'],rotor:['rv','rdrop','rN','rfmax','rW','rmin']};
const ABY={go:['string','curve','loop','rotor'],cut:['string'],floor:['rotor'],design:['curve'],minimum:['loop']};
const MGRAPH={string:'g-Fc',curve:'g-grip',loop:'g-feel',rotor:'g-rdrop'};
const STR={cx:285,cy:225,s:136},LOOP={cx:330,gy:404,s:17},ROT={cx:300,top:110,s:44,h:3.2};

function sync(sim){if(!sim.ui||!sim.ui.ctl||!sim.ui.sec)return;const m=sim.p.mode,sec=sim.ui.sec;
  SIM.controls.forEach(c=>{const e=sec.querySelector('#'+ID+'-'+c.id+',#'+ID+'-'+c.id+'-l');const w=e&&e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl||'bio')||!(c.id==='mode'||c.id==='vecs'||c.id==='fbd'||BY[m].includes(c.id));});
  SIM.metrics.forEach(mt=>{const t=sim.ui.tiles[mt.id];if(!t)return;const tile=t.num.closest('.tile');if(tile)tile.hidden=!atLeast(mt.lvl||'bio')||!MBY[m].includes(mt.id);});
  const btns=[...sec.querySelectorAll('.controls .actions button')];SIM.actions.forEach((a,i)=>{if(btns[i])btns[i].hidden=!atLeast(a.lvl||'bio')||!ABY[a.id].includes(m);});}
function setGraph(sim){if(sim.ui&&sim.ui.gm){const g=MGRAPH[sim.p.mode];if([...sim.ui.gm.options].some(o=>o.value===g)){sim.gMetric=g;sim.ui.gm.value=g;}}}

/* ---------- models ---------- */
function curveForces(p){const th=p.bank*D2R,ac=p.cv*p.cv/p.cr,m=p.cm;const N=m*(G*Math.cos(th)+ac*Math.sin(th)),f=m*(ac*Math.cos(th)-G*Math.sin(th));return {N,f,fmax:p.mu*N,ac,th};}
function vmaxCurve(p){const th=p.bank*D2R,den=Math.cos(th)-p.mu*Math.sin(th);if(den<=1e-9)return null;return Math.sqrt(G*p.cr*(Math.sin(th)+p.mu*Math.cos(th))/den);}
function vminCurve(p){const th=p.bank*D2R,num=Math.sin(th)-p.mu*Math.cos(th);if(num<=0)return 0;return Math.sqrt(G*p.cr*num/(Math.cos(th)+p.mu*Math.sin(th)));}
const omegaRotor=p=>p.rpm*TAU/60;
function rotorN(p){const w=omegaRotor(p);return p.rm*w*w*p.rR;}
function loopV2(p,phi){return p.lv*p.lv-2*G*p.lR*(1-Math.cos(phi));}
function reset(sim,mode){const st=sim.st,p=sim.p;
  if(mode==='string')st.str={th:0,t:0,cut:false,x:0,y:0,vx:0,vy:0,dots:[],next:0,laps:[],lapStart:0,lastLap:null,cutDots:[]};
  if(mode==='curve')st.car={phi:-Math.PI/2,t:0,skid:false,dir:0,x:0,y:0,vx:0,vy:0,sp:p.cv,rin:0,dots:[],next:0,off:false};
  if(mode==='loop')st.cart={ph:'in',s:-15,phi:0,v:p.lv,v0:p.lv,res:null,x:-15,y:0,vx:p.lv,vy:0,t:0,dots:[],next:0,maxPhi:0,N:p.lm*G};
  if(mode==='rotor'){st.rot={ang:0,y:0,vy:0,floor:false,floorY:0,t:0};}}
function stepString(sim,dt){const q=sim.st.str,p=sim.p;if(!q)return;q.t+=dt;
  if(!q.cut){const w=p.v/p.r,old=q.th;q.th+=w*dt;if(Math.floor(q.th/TAU)>Math.floor(old/TAU)){const tc=q.t-dt+(TAU*Math.floor(q.th/TAU)-old)/w;q.lastLap=tc-q.lapStart;q.lapStart=tc;}
    if(q.t>=q.next){q.dots.push([p.r*Math.cos(q.th),p.r*Math.sin(q.th)]);if(q.dots.length>12)q.dots.shift();q.next+=0.1;}}
  else{if(!q.stop){q.x+=q.vx*dt;q.y+=q.vy*dt;const sx=STR.cx+q.x*STR.s,sy=STR.cy-q.y*STR.s;if(sx<10||sx>540||sy<10||sy>440)q.stop=true;}
    if(q.t>=q.next&&!q.stop){q.cutDots.push([q.x,q.y]);q.next+=0.1;}}}
function cutString(sim){const q=sim.st.str,p=sim.p;if(!q||q.cut)return;q.cut=true;q.x=p.r*Math.cos(q.th);q.y=p.r*Math.sin(q.th);q.vx=-p.v*Math.sin(q.th);q.vy=p.v*Math.cos(q.th);q.cutDots=[[q.x,q.y]];q.next=q.t+0.1;q.cutAt=q.th;}
function stepCurve(sim,dt){const c=sim.st.car,p=sim.p;if(!c)return;c.t+=dt;
  if(!c.skid&&!c.slideIn){const F=curveForces(p),tol=1e-6*p.cm*G;
    if(F.f>F.fmax+tol){c.skid=true;c.x=p.cr*Math.cos(c.phi);c.y=p.cr*Math.sin(c.phi);c.vx=-p.cv*Math.sin(c.phi);c.vy=p.cv*Math.cos(c.phi);c.sp=p.cv;c.skidAt=c.t;}
    else if(-F.f>F.fmax+tol){c.slideIn=true;c.rin=0;c.skidAt=c.t;}
    else{c.phi+=p.cv/p.cr*dt;}}
  else if(c.skid){if(!c.off&&c.sp>0){const ux=c.vx/c.sp,uy=c.vy/c.sp;c.sp=Math.max(0,c.sp-0.75*p.mu*G*dt);c.vx=ux*c.sp;c.vy=uy*c.sp;c.x+=c.vx*dt;c.y+=c.vy*dt;
      const s=170/p.cr,sx=300+c.x*s,sy=225-c.y*s;if(sx<20||sx>540||sy<20||sy>430)c.off=true;}}
  else{c.phi+=p.cv/p.cr*dt;c.rin=Math.min(6,c.rin+2*dt);}
  if(c.t>=c.next){c.dots.push(c.skid?[c.x,c.y]:[(p.cr-(c.rin||0))*Math.cos(c.phi),(p.cr-(c.rin||0))*Math.sin(c.phi)]);if(c.dots.length>(c.skid?40:10))c.dots.shift();c.next+=0.25;}}
function stepLoop(sim,dt){const c=sim.st.cart,p=sim.p;if(!c||c.res)return;let left=dt,guard=0;const R=p.lR;
  while(left>1e-12&&guard++<2000){const h=Math.min(left,0.002);left-=h;c.t+=h;
    if(c.ph==='in'){c.s+=c.v0*h;c.x=c.s;c.y=0;c.vx=c.v0;c.vy=0;if(c.s>=0){c.ph='loop';c.phi=0;c.vel=c.v0;}}
    else if(c.ph==='loop'){c.vel+=-G*Math.sin(c.phi)*h;c.phi+=c.vel/R*h;
      const vv=loopV2({lv:c.v0,lR:R},c.phi);c.vel=vv<=0?(c.vel>0?0:-Math.sqrt(Math.max(0,vv))):(c.vel>=0?1:-1)*Math.sqrt(vv);
      c.maxPhi=Math.max(c.maxPhi,c.phi);const Nm=c.vel*c.vel/R+G*Math.cos(c.phi);
      c.x=R*Math.sin(c.phi);c.y=R-R*Math.cos(c.phi);c.vx=c.vel*Math.cos(c.phi);c.vy=c.vel*Math.sin(c.phi);c.N=Math.max(0,Nm)*p.lm;
      if(Nm<-0.002*G&&c.phi>Math.PI/2&&c.phi<1.5*Math.PI){c.ph='air';c.leftAt=c.phi;c.N=0;}
      else if(c.phi>=TAU){c.ph='out';c.s=0;c.v=Math.abs(c.vel);c.N=p.lm*G;}
      else if(c.phi<=0&&c.vel<0){c.ph='back';c.s=0;c.v=-Math.abs(c.vel);c.N=p.lm*G;}}
    else if(c.ph==='air'){c.N=0;c.vy-=G*h;c.x+=c.vx*h;c.y+=c.vy*h;if(c.y<=0){c.y=0;c.res='crash';break;}}
    else{c.s+=c.v*h;c.x=c.s;c.y=0;c.vx=c.v;c.vy=0;if(c.ph==='out'&&c.s>14){c.res='done';break;}if(c.ph==='back'&&c.s<-15){c.res='back';break;}}
    if(c.t>=c.next){c.dots.push([c.x,c.y]);if(c.dots.length>60)c.dots.shift();c.next+=0.1;}}}
function stepRotor(sim,dt){const r=sim.st.rot,p=sim.p;if(!r)return;r.t+=dt;r.ang+=omegaRotor(p)*dt;
  r.floorY=r.floor?Math.min(1.2,r.floorY+0.8*dt):Math.max(0,r.floorY-0.8*dt);
  const N=rotorN(p),W=p.rm*G,fmax=p.rmu*N;
  if(r.y<r.floorY-1e-9||r.vy>0){
    if(r.vy<=1e-12&&fmax>=W){r.vy=0;}
    else{const a=G-0.8*fmax/p.rm;r.vy=Math.max(0,r.vy+a*dt);r.y=Math.min(r.floorY,r.y+r.vy*dt);if(r.y>=r.floorY-1e-9){r.y=r.floorY;r.vy=0;}}}
  else{r.y=r.floorY;r.vy=0;}}

/* ---------- drawing helpers ---------- */
function arrow(ctx,x1,y1,x2,y2,col,w,dash){const L=Math.hypot(x2-x1,y2-y1);if(L<2)return;const a=Math.atan2(y2-y1,x2-x1),hd=Math.min(11,L*0.45);
  ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=w||3;ctx.lineCap='round';if(dash)ctx.setLineDash(dash);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2-Math.cos(a)*hd*0.8,y2-Math.sin(a)*hd*0.8);ctx.stroke();ctx.setLineDash([]);
  ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-hd*Math.cos(a-0.42),y2-hd*Math.sin(a-0.42));ctx.lineTo(x2-hd*Math.cos(a+0.42),y2-hd*Math.sin(a+0.42));ctx.closePath();ctx.fill();}
function card(ctx,x,y,w,h){ctx.fillStyle=PAL['card'];ctx.globalAlpha=0.95;rr(ctx,x,y,w,h,10);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();}
function gauge(ctx,x,y,w,frac,col,k,lab,val){txt(ctx,lab,x,y,{s:12*k,w:700});txt(ctx,val,x+w,y,{s:12*k,w:700,a:'right',c:col});ctx.fillStyle=PAL['cv-bg2'];rr(ctx,x,y+8,w,12,6);ctx.fill();
  ctx.fillStyle=col;rr(ctx,x,y+8,Math.max(4,w*clamp(frac,0,1)),12,6);ctx.fill();}
function legendRows(ctx,x,y,rows,k){rows.forEach((r,i)=>{arrow(ctx,x,y+i*18,x+24,y+i*18,r[0],2.6);txt(ctx,r[1],x+32,y+4+i*18,{s:11.5*k});});}
function carShape(ctx,x,y,ang,col){ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.fillStyle=col;rr(ctx,-14,-7,28,14,4);ctx.fill();ctx.fillStyle='#bfe3f5';ctx.fillRect(2,-5.5,6,11);ctx.fillRect(-10,-5,5,10);
  ctx.fillStyle='#222';[[-9,-8],[7,-8],[-9,6],[7,6]].forEach(q=>ctx.fillRect(q[0],q[1],5,2.5));ctx.restore();}
function person(ctx,x,y,h,col,al){ctx.globalAlpha=al;ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y-h*0.88,h*0.1,0,6.29);ctx.fill();rr(ctx,x-h*0.11,y-h*0.76,h*0.22,h*0.42,h*0.06);ctx.fill();ctx.fillRect(x-h*0.1,y-h*0.36,h*0.08,h*0.36);ctx.fillRect(x+h*0.02,y-h*0.36,h*0.08,h*0.36);ctx.globalAlpha=1;}

/* ---------- scenes ---------- */
function drawString(sim,ctx,k){const p=sim.p,q=sim.st.str,S=STR,hon=atLeast('honors');if(!q)return;
  ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(0,0,800,450);ctx.fillStyle=PAL['cv-bg'];rr(ctx,20,14,520,422,16);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=2;ctx.stroke();
  // grid (10 cm)
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=0.6;for(let x=S.cx%(0.1*S.s);x<540;x+=0.1*S.s)if(x>20){ctx.beginPath();ctx.moveTo(x,14);ctx.lineTo(x,436);ctx.stroke();}
  for(let y=S.cy%(0.1*S.s);y<436;y+=0.1*S.s)if(y>14){ctx.beginPath();ctx.moveTo(20,y);ctx.lineTo(540,y);ctx.stroke();}
  txt(ctx,'Air table seen from above · grid 10 cm',30,30,{s:11.5*k,c:PAL['cv-soft']});
  const X=x=>S.cx+x*S.s,Y=y=>S.cy-y*S.s,R=p.r*S.s;
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.4;ctx.setLineDash([5,5]);ctx.beginPath();ctx.arc(S.cx,S.cy,R,0,TAU);ctx.stroke();ctx.setLineDash([]);
  // strobe dots
  ctx.fillStyle=PAL['s2'];q.dots.forEach((d,i)=>{ctx.globalAlpha=0.25+0.6*i/Math.max(1,q.dots.length);ctx.beginPath();ctx.arc(X(d[0]),Y(d[1]),3.5,0,TAU);ctx.fill();});ctx.globalAlpha=1;
  let bx,by,vx,vy;if(!q.cut){bx=p.r*Math.cos(q.th);by=p.r*Math.sin(q.th);vx=-p.v*Math.sin(q.th);vy=p.v*Math.cos(q.th);}else{bx=q.x;by=q.y;vx=q.stop?0:q.vx;vy=q.stop?0:q.vy;}
  if(q.cut){ctx.strokeStyle=PAL['s1'];ctx.lineWidth=1.6;ctx.setLineDash([3,4]);const cx0=p.r*Math.cos(q.cutAt),cy0=p.r*Math.sin(q.cutAt),tx=-Math.sin(q.cutAt),ty=Math.cos(q.cutAt);ctx.beginPath();ctx.moveTo(X(cx0-tx*0.5),Y(cy0-ty*0.5));ctx.lineTo(X(cx0+tx*3),Y(cy0+ty*3));ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle=PAL['s1'];q.cutDots.forEach(d=>{ctx.beginPath();ctx.arc(X(d[0]),Y(d[1]),3.5,0,TAU);ctx.fill();});
    txt(ctx,'tangent line',X(cx0+tx*0.9)+10,Y(cy0+ty*0.9)-10,{s:11.5*k,w:600,c:PAL['s1']});}
  // string
  ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(S.cx,S.cy);if(!q.cut)ctx.lineTo(X(bx),Y(by));else{const a=q.cutAt+0.3;ctx.lineTo(S.cx+Math.cos(a)*R*0.35,S.cy-Math.sin(a)*R*0.35);}ctx.stroke();
  ctx.fillStyle=PAL['cv-lamp'];ctx.beginPath();ctx.arc(S.cx,S.cy,6,0,TAU);ctx.fill();
  // puck
  const pr=8+p.m*5;const g=ctx.createRadialGradient(X(bx)-3,Y(by)-3,1,X(bx),Y(by),pr);g.addColorStop(0,'#ff7a7a');g.addColorStop(1,'#a1121f');ctx.fillStyle=g;ctx.beginPath();ctx.arc(X(bx),Y(by),pr,0,TAU);ctx.fill();
  if(p.vecs&&!q.stop){const sv=12;arrow(ctx,X(bx),Y(by),X(bx)+vx*sv,Y(by)-vy*sv,PAL['s2'],3);
    if(!q.cut){const ac=p.v*p.v/p.r,L=Math.min(170,ac*1.5),ux=-bx/p.r,uy=-by/p.r;arrow(ctx,X(bx),Y(by),X(bx)+ux*L,Y(by)-uy*L,PAL['s1'],3.4);if(ac*1.5>170)txt(ctx,'(longer than shown)',X(bx)+ux*L*0.5+8,Y(by)-uy*L*0.5,{s:10.5*k,c:PAL['s1']});}}
  if(p.fbd&&!q.cut){const F=p.m*p.v*p.v/p.r,ux=-bx/p.r,uy=-by/p.r,L=Math.min(150,F*4);arrow(ctx,X(bx)+uy*14,Y(by)+ux*14,X(bx)+uy*14+ux*L,Y(by)+ux*14-uy*L,PAL['s3'],3,[6,4]);}
  // panel
  card(ctx,556,14,232,422);const F=p.m*p.v*p.v/p.r;
  gauge(ctx,572,44,200,F/100,PAL['s1'],k,'String tension',f1(F)+' N');
  txt(ctx,hon?'F = mv²/r = '+f1(p.m)+' × '+f1(p.v)+'² ÷ '+f2(p.r):'pulls the puck toward the center',572,90,{s:11.5*k,c:PAL['cv-soft']});
  // stopwatch
  txt(ctx,'Lap stopwatch',572,128,{s:12*k,w:700});const lt=q.cut?null:(q.t-(q.lapStart||0));
  ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(600,166,20,0,TAU);ctx.stroke();if(lt!==null){const a=(lt/(TAU*p.r/p.v))*TAU-Math.PI/2;ctx.beginPath();ctx.moveTo(600,166);ctx.lineTo(600+16*Math.cos(a),166+16*Math.sin(a));ctx.stroke();}
  txt(ctx,'this lap '+(lt===null?'—':lt.toFixed(2)+' s'),632,160,{s:12*k});txt(ctx,'last lap '+(q.lastLap?q.lastLap.toFixed(2)+' s':'—'),632,180,{s:12*k,w:700});
  legendRows(ctx,572,220,[[PAL['s2'],'velocity (along the path)'],[PAL['s1'],'acceleration (toward center)']].concat(p.fbd?[[PAL['s3'],'string force on the puck']]:[]),k);
  txt(ctx,'Dots: every 0.1 s',572,290,{s:11.5*k,c:PAL['cv-soft']});
  if(q.cut)pill(ctx,q.stop?'The puck slid straight off':'String cut! Moving in a straight line',S.cx,412,PAL['s1'],'#fff',13*KF);}

function drawCurve(sim,ctx,k){const p=sim.p,c=sim.st.car,hon=atLeast('honors'),ap=atLeast('ap');if(!c)return;const s=170/p.cr,cx=300,cy=225,X=x=>cx+x*s,Y=y=>cy-y*s;
  ctx.fillStyle=PAL['cv-leaf2'];ctx.globalAlpha=0.45;ctx.fillRect(0,0,560,450);ctx.globalAlpha=1;ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(560,0,240,450);
  const rw=Math.max(16,8*s);ctx.strokeStyle='#6b6e73';ctx.lineWidth=rw;ctx.beginPath();ctx.arc(cx,cy,170,0,TAU);ctx.stroke();
  ctx.strokeStyle='#f2f2ee';ctx.lineWidth=2;ctx.setLineDash([12,12]);ctx.beginPath();ctx.arc(cx,cy,170,0,TAU);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle=PAL['cv-ink'];ctx.beginPath();ctx.arc(cx,cy,4,0,TAU);ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx-170,cy);ctx.stroke();ctx.setLineDash([]);
  txt(ctx,'r = '+p.cr+' m',cx-85,cy-8,{s:12*k,w:700,a:'center'});
  txt(ctx,'Test track from above'+(p.bank>0?' · banked '+p.bank+'°':''),14,24,{s:12*k,c:PAL['cv-ink'],w:600});
  // scale bar
  const sb=[5,10,20,50].find(v=>v*s>=50)||50;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(20,430);ctx.lineTo(20+sb*s,430);ctx.moveTo(20,425);ctx.lineTo(20,435);ctx.moveTo(20+sb*s,425);ctx.lineTo(20+sb*s,435);ctx.stroke();txt(ctx,sb+' m',24+sb*s,434,{s:11*k});
  ctx.fillStyle=PAL['s4'];c.dots.forEach((d,i)=>{ctx.globalAlpha=0.3+0.6*i/Math.max(1,c.dots.length);ctx.beginPath();ctx.arc(X(d[0]),Y(d[1]),3,0,TAU);ctx.fill();});ctx.globalAlpha=1;
  let x,y,hd,vx,vy;const rin=c.rin||0;
  if(c.skid){x=c.x;y=c.y;vx=c.vx;vy=c.vy;hd=Math.atan2(-vy,vx);}else{x=(p.cr-rin)*Math.cos(c.phi);y=(p.cr-rin)*Math.sin(c.phi);vx=-p.cv*Math.sin(c.phi);vy=p.cv*Math.cos(c.phi);hd=Math.atan2(-vy,vx);}
  carShape(ctx,X(x),Y(y),hd,c.skid?'#8a1020':'#c4302b');
  const F=curveForces(p);
  if(p.vecs&&!(c.skid&&c.sp<=0)){arrow(ctx,X(x),Y(y),X(x)+vx*3.2,Y(y)-vy*3.2,PAL['s2'],3);if(!c.skid){const L=Math.min(120,F.ac*9),ux=-Math.cos(c.phi),uy=-Math.sin(c.phi);arrow(ctx,X(x),Y(y),X(x)+ux*L,Y(y)-uy*L,PAL['s1'],3.4);}}
  if(c.skid)pill(ctx,c.sp>0?'Skidding! Sliding off on a straight line':'Off the road',280,410,PAL['s1'],'#fff',13*KF);
  if(c.slideIn)pill(ctx,'Too slow for this bank: sliding down',280,410,PAL['s1'],'#fff',13*KF);
  // grip gauge
  card(ctx,572,12,218,170);const used=F.fmax>1e-9?Math.abs(F.f)/F.fmax:(Math.abs(F.f)<1e-6*p.cm?0:9.99);
  gauge(ctx,586,38,190,used,used>1?PAL['s1']:used>0.85?PAL['s4']:PAL['s3'],k,'Tire grip used',used>9?'over 999%':(used*100).toFixed(0)+'%');
  txt(ctx,hon?'needed friction ÷ μN':'how hard the tires must grip',586,76,{s:11*k,c:PAL['cv-soft']});
  if(hon){txt(ctx,'needed f = '+f1(Math.abs(F.f)/1000)+' kN'+(F.f<-1e-6?' (up the bank)':''),586,100,{s:12*k});txt(ctx,'max μN = '+f1(F.fmax/1000)+' kN',586,118,{s:12*k});}
  const vm=vmaxCurve(p);txt(ctx,'Top safe speed '+(vm===null?'no limit':f1(vm)+' m/s'),586,hon?146:104,{s:12.5*k,w:700});
  if(!hon)txt(ctx,'Car speed '+f1(p.cv)+' m/s',586,124,{s:12.5*k});
  // cross-section
  card(ctx,572,192,218,246);txt(ctx,'Cross-section (facing the car)',584,212,{s:11.5*k,w:700});
  const bx=680,by=372,th=F.th,rl=88;ctx.save();ctx.translate(bx,by);ctx.fillStyle='#6b6e73';ctx.beginPath();ctx.moveTo(-rl*Math.cos(th),rl*Math.sin(th));ctx.lineTo(rl*Math.cos(th),-rl*Math.sin(th));ctx.lineTo(rl*Math.cos(th),24);ctx.lineTo(-rl*Math.cos(th),24);ctx.closePath();ctx.fill();
  ctx.rotate(-th);ctx.fillStyle='#c4302b';rr(ctx,-22,-22,44,20,5);ctx.fill();ctx.fillStyle='#222';ctx.fillRect(-20,-4,9,5);ctx.fillRect(11,-4,9,5);ctx.restore();
  txt(ctx,'← center',586,430,{s:11*k,c:PAL['cv-soft']});
  // forces at the car's center, center of curve to the left
  const ox=bx,oy=by-14,sc=60/(p.cm*G);if(p.fbd||ap){const N=F.N,f=F.f;arrow(ctx,ox,oy,ox,oy+p.cm*G*sc,PAL['s4'],2.6);arrow(ctx,ox,oy,ox-N*Math.sin(th)*sc,oy-N*Math.cos(th)*sc,PAL['s3'],2.6);
    const fc=c.skid?Math.min(Math.abs(f),F.fmax*0.75):c.slideIn?F.fmax*0.75:Math.abs(f),fs=c.slideIn?-1:Math.sign(f);if(fc>1e-6)arrow(ctx,ox,oy+10,ox-fs*fc*Math.cos(th)*sc,oy+10+fs*fc*Math.sin(th)*sc,PAL['s5'],2.6);
    legendRows(ctx,584,234,[[PAL['s4'],'weight mg'],[PAL['s3'],'normal force N'],[PAL['s5'],'friction f']],k);}
  else{arrow(ctx,ox,oy,ox-Math.min(80,Math.abs(F.f)*sc),oy,PAL['s5'],3);txt(ctx,'friction toward the center',584,238,{s:11.5*k,c:PAL['s5'],w:600});}}

function drawLoop(sim,ctx,k){const p=sim.p,c=sim.st.cart,hon=atLeast('honors'),ap=atLeast('ap');if(!c)return;const L=LOOP,X=x=>L.cx+x*L.s,Y=y=>L.gy-y*L.s,R=p.lR;
  const g=ctx.createLinearGradient(0,0,0,L.gy);g.addColorStop(0,PAL['cv-bg2']);g.addColorStop(1,PAL['cv-bg']);ctx.fillStyle=g;ctx.fillRect(0,0,800,450);ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,L.gy+6,800,50);
  // supports + track
    ctx.strokeStyle='#5a5f68';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(X(-16),Y(0)+4);ctx.lineTo(X(16),Y(0)+4);ctx.stroke();ctx.beginPath();ctx.arc(X(0),Y(R),R*L.s+4,0,TAU);ctx.stroke();
  ctx.strokeStyle='#9aa0a8';ctx.lineWidth=2;ctx.beginPath();ctx.arc(X(0),Y(R),R*L.s+4,0,TAU);ctx.stroke();
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(X(0),Y(R));ctx.lineTo(X(-R),Y(R));ctx.stroke();ctx.setLineDash([]);txt(ctx,'R = '+f1(R)+' m',X(-R/2),Y(R)+16,{s:12*k,w:700,a:'center'});
  // height ruler
  ctx.fillStyle=PAL['cv-ruler'];ctx.fillRect(10,Y(20.5),26,L.gy-Y(20.5));for(let h=0;h<=20;h+=1){const yy=Y(h);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=h%5?0.8:1.4;ctx.beginPath();ctx.moveTo(36,yy);ctx.lineTo(h%5?31:26,yy);ctx.stroke();if(h%5===0&&h)txt(ctx,h+'',20,yy,{s:10.5*k,a:'center',b:'middle'});}
  txt(ctx,'height (m)',40,Y(20.5)+4,{s:11*k,c:PAL['cv-soft']});
  ctx.fillStyle=PAL['s2'];c.dots.forEach((d,i)=>{ctx.globalAlpha=0.2+0.6*i/Math.max(1,c.dots.length);ctx.beginPath();ctx.arc(X(d[0]),Y(d[1]),3,0,TAU);ctx.fill();});ctx.globalAlpha=1;
  // cart (on the inside of the track)
  const onLoop=c.ph==='loop',ang=onLoop?c.phi:(c.ph==='air'?Math.atan2(c.vy,c.vx):0);ctx.save();ctx.translate(X(c.x),Y(c.y));ctx.rotate(-ang);ctx.fillStyle='#c4302b';rr(ctx,-13,-15,26,13,4);ctx.fill();ctx.fillStyle='#ffd34d';ctx.beginPath();ctx.arc(0,-19,5,0,TAU);ctx.fill();ctx.fillStyle='#222';ctx.beginPath();ctx.arc(-8,-1,3,0,TAU);ctx.arc(8,-1,3,0,TAU);ctx.fill();ctx.restore();
  const v=Math.hypot(c.vx||0,c.vy||0);if(p.vecs&&c.res!=='crash'&&c.res!=='done'&&c.res!=='back'){const cx=X(c.x),cy=Y(c.y);arrow(ctx,cx,cy,cx+(c.vx||0)*4,cy-(c.vy||0)*4,PAL['s2'],3);
    if(onLoop){const ac=c.vel*c.vel/R,Lr=Math.min(110,ac*3),ux=-Math.sin(c.phi),uy=Math.cos(c.phi);arrow(ctx,cx,cy,cx+ux*Lr,cy-uy*Lr,PAL['s1'],3.2);}}
  if(p.fbd&&onLoop){const cx=X(c.x),cy=Y(c.y),sc=40/(p.lm*G),ux=-Math.sin(c.phi),uy=Math.cos(c.phi);arrow(ctx,cx+6,cy,cx+6,cy+p.lm*G*sc,PAL['s4'],2.6);if(c.N>0)arrow(ctx,cx-6,cy,cx-6+ux*c.N*sc,cy-uy*c.N*sc,PAL['s3'],2.6,[5,3]);}
  if(c.res==='crash'||c.ph==='air')pill(ctx,'Left the track and fell!',X(0),Y(2*R)-30>20?Y(2*R)-30:24,PAL['s1'],'#fff',13*KF);
  if(c.res==='back'||c.ph==='back')pill(ctx,'Not enough speed: rolled back',X(0),Y(2*R)-30>20?Y(2*R)-30:24,PAL['s4'],'#fff',13*KF);
  if(c.res==='done'||c.ph==='out')pill(ctx,'Made it around!',X(0),Y(2*R)-30>20?Y(2*R)-30:24,PAL['s3'],'#fff',13*KF);
  // panel
  card(ctx,592,12,198,hon?220:180);const feel=(c.N||0)/(p.lm*G);
  gauge(ctx,606,40,170,feel/7,feel<0.05?PAL['s1']:PAL['s2'],k,'Rider feels',(Math.max(0,feel)).toFixed(1)+' g');
  txt(ctx,'(track force ÷ weight)',606,76,{s:11*k,c:PAL['cv-soft']});txt(ctx,'speed '+f1(v)+' m/s',606,100,{s:12.5*k,w:700});
  const v2t=loopV2(p,Math.PI);txt(ctx,'speed at top '+(v2t>=0&&c.maxPhi>=Math.PI-1e-6?f1(Math.sqrt(v2t))+' m/s':'—'),606,120,{s:12*k});
  legendRows(ctx,606,144,[[PAL['s2'],'velocity'],[PAL['s1'],'centripetal accel.']].concat(p.fbd?[[PAL['s4'],'weight'],[PAL['s3'],'track pushes (N)']]:[]),k);}

function drawRotor(sim,ctx,k){const p=sim.p,r=sim.st.rot,hon=atLeast('honors');if(!r)return;const O=ROT,s=O.s,Rp=p.rR*s,cx=O.cx,top=O.top,flo=top+O.h*s,fy=flo+r.floorY*s;
  ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(0,0,800,450);
  // back wall
  ctx.fillStyle=PAL['cv-ims'];ctx.fillRect(cx-Rp,top,2*Rp,O.h*s+56);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(cx,top,Rp,Rp*0.22,0,0,TAU);ctx.stroke();
  // wall stripes rotating
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=2;for(let i=0;i<12;i++){const a=r.ang+i*TAU/12,sn=Math.sin(a);if(Math.cos(a)<0){const x=cx+Rp*sn;ctx.beginPath();ctx.moveTo(x,top+Rp*0.22*Math.cos(a)*-1);ctx.lineTo(x,flo+56);ctx.stroke();}}
  // floor
  ctx.fillStyle=PAL['cv-bench'];ctx.beginPath();ctx.ellipse(cx,fy,Rp,Rp*0.22,0,0,TAU);ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.stroke();
  if(r.floorY>0.02){txt(ctx,'floor dropped '+f1(r.floorY)+' m',cx,fy+Rp*0.22+16,{s:11.5*k,a:'center',c:PAL['cv-soft']});}
  // riders: sorted by depth
  const H=1.7*s,riders=[0,1,2,3].map(i=>{const a=r.ang+i*TAU/4;return {a,x:cx+Rp*0.94*Math.sin(a),d:Math.cos(a),main:i===0};}).sort((a,b)=>a.d-b.d);
  riders.forEach(q=>{const yb=flo+r.y*s+Rp*0.2*q.d*0;person(ctx,q.x,yb,H*(0.85+0.15*(q.d+1)/2),q.main?'#c4302b':'#3f6fb0',q.d>0?1:0.55);});
  // front rim
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx-Rp,top);ctx.lineTo(cx-Rp,flo+56);ctx.moveTo(cx+Rp,top);ctx.lineTo(cx+Rp,flo+56);ctx.stroke();
  ctx.beginPath();ctx.ellipse(cx,top,Rp,Rp*0.22,0,0,Math.PI);ctx.stroke();
  // axis
  ctx.strokeStyle=PAL['cv-ink'];ctx.setLineDash([6,5]);ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(cx,top-40);ctx.lineTo(cx,flo+60);ctx.stroke();ctx.setLineDash([]);
  if(p.rpm>0){ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.6;ctx.beginPath();ctx.ellipse(cx,top-30,26,7,0,0.3,Math.PI*1.7);ctx.stroke();arrow(ctx,cx-20,top-34,cx-26,top-30,PAL['cv-ink'],1.6);}
  txt(ctx,p.rpm+' rpm',cx+34,top-26,{s:12.5*k,w:700});
  // ruler: slide distance
  txt(ctx,'Rotor seen from the side (front wall cut away)',14,24,{s:12*k,w:600});
  const sliding=r.vy>0;if(r.y>0.01||sliding)pill(ctx,sliding?'Sliding down the wall!':'Slid '+f1(r.y)+' m down',cx,top+20,PAL['s1'],'#fff',13*KF);
  // top view inset
  const W=rotorN(p)/p.rm,v=omegaRotor(p)*p.rR;card(ctx,560,12,230,180);txt(ctx,'Top view (red rider)',572,30,{s:11.5*k,w:700});
  const tx=630,ty=110,tr=52;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(tx,ty,tr,0,TAU);ctx.stroke();const ra=r.ang,rx=tx+tr*Math.sin(ra),ry=ty+tr*Math.cos(ra);
  ctx.fillStyle='#c4302b';ctx.beginPath();ctx.arc(rx,ry,6,0,TAU);ctx.fill();if(p.vecs&&p.rpm>0){arrow(ctx,rx,ry,rx+Math.cos(ra)*Math.min(60,v*4),ry-Math.sin(ra)*Math.min(60,v*4),PAL['s2'],2.6);arrow(ctx,rx,ry,rx-Math.sin(ra)*Math.min(46,W*1.4),ry-Math.cos(ra)*Math.min(46,W*1.4),PAL['s1'],2.8);}
  legendRows(ctx,694,92,[[PAL['s2'],'velocity'],[PAL['s1'],'accel.']],k);txt(ctx,'v = '+f1(v)+' m/s',694,140,{s:12*k,w:700});
  // force panel
  card(ctx,560,202,230,236);txt(ctx,'Forces on the rider',572,222,{s:11.5*k,w:700});
  const N=rotorN(p),Wt=p.rm*G,fmax=p.rmu*N;const fx=742,fy2=350,scF=60/Math.max(Wt,1);
  ctx.fillStyle=PAL['cv-ims'];ctx.fillRect(fx+18,fy2-70,14,140);ctx.strokeStyle=PAL['cv-soft'];ctx.strokeRect(fx+18,fy2-70,14,140);txt(ctx,'wall',fx+25,fy2+86,{s:10.5*k,a:'center',c:PAL['cv-soft']});
  person(ctx,fx+8,fy2+40,80,'#c4302b',1);
  arrow(ctx,fx,fy2,fx,fy2+Wt*scF,PAL['s4'],2.8);arrow(ctx,fx+10,fy2-10,fx+10-Math.min(150,N*scF),fy2-10,PAL['s3'],2.8);
  const onFloor=r.y>=r.floorY-1e-9,fr=onFloor?0:(sliding?0.8*fmax:Wt);if(onFloor)txt(ctx,'floor holds the rider up',572,404,{s:11.5*k,c:PAL['cv-soft']});if(fr>1e-6)arrow(ctx,fx+14,fy2+4,fx+14,fy2+4-fr*scF,PAL['s5'],2.8);
  legendRows(ctx,572,248,[[PAL['s4'],'weight '+f1(Wt)+' N'],[PAL['s3'],'wall push '+f1(N)+' N'],[PAL['s5'],'friction (max '+f1(fmax)+' N)']],k);
  txt(ctx,fmax>=Wt?'Grip can hold the rider':'Grip is too weak',572,426,{s:12*k,w:700,c:fmax>=Wt?PAL['s3']:PAL['s1']});}

const SIM={
  id:ID,hash:ID,apUnit:2,order:5,tab:'Circular motion',kind:'Simulation',prereq:['vectors2d','forces'],next:['gravity'],
  card:'Whirl a puck on a string and cut it, push a car around a curve until it skids, ride a loop-the-loop and spin a rotor ride.',
  title:'Circular motion',
  lede:{bio:'Moving in a circle takes a push or pull toward the center. Take it away and the object goes straight.',
    honors:'Centripetal force F = mv²/r points to the center. Find out what supplies it (tension, friction, the track, the wall) and what happens when it runs out.',
    ap:'Apply ΣF<sub>r</sub> = mv²/r in each scene: friction-limited and banked curves, the normal force around a vertical loop, and static friction in a rotor.'},
  scale:{bio:'Puck: a string up to 1.5 m long on an air table. Car: a test track tens of meters across. Loop: a ride up to 20 m tall. Rotor: a drum 4 to 10 m across. g = 9.8 m/s².'},
  aspect:16/9,timeScale:1,dtMax:0.005,sampleDt:0.05,window:10,unit:'s',chChange:1,chReveal:5,
  controls:[
    {id:'mode',label:'Scene',type:'seg',def:'string',options:[{v:'string',l:'Puck on a string'},{v:'curve',l:'Car on a curve'},{v:'loop',l:'Loop-the-loop'},{v:'rotor',l:'Rotor ride'}],
      onChange(sim){sync(sim);setGraph(sim);if(sim.st)reset(sim,sim.p.mode);}},
    {id:'m',label:'Puck mass',type:'range',min:0.1,max:2,step:0.1,def:0.5,unit:'kg'},
    {id:'r',label:'String length (radius)',type:'range',min:0.3,max:1.5,step:0.05,def:0.8,unit:'m'},
    {id:'v',label:'Speed',type:'range',min:1,max:10,step:0.5,def:4,unit:'m/s'},
    {id:'cv',label:'Car speed',type:'range',min:5,max:40,step:0.5,def:15,unit:'m/s'},
    {id:'cr',label:'Curve radius',type:'range',min:20,max:200,step:5,def:50,unit:'m'},
    {id:'mu',label:'Tire grip, μ<sub>s</sub>',type:'range',min:0,max:1,step:0.05,def:0.7,help:'Dry road ≈ 0.7, wet ≈ 0.4, snow ≈ 0.2, ice ≈ 0.1.'},
    {id:'bank',label:'Bank angle',lvl:'ap',type:'range',min:0,max:40,step:1,def:0,unit:'°'},
    {id:'cm',label:'Car mass',lvl:'honors',type:'range',min:600,max:2400,step:100,def:1200,unit:'kg'},
    {id:'lR',label:'Loop radius',type:'range',min:2,max:10,step:0.5,def:5,unit:'m',onChange(sim){if(sim.st&&sim.p.mode==='loop')reset(sim,'loop');}},
    {id:'lv',label:'Speed entering the loop',type:'range',min:5,max:30,step:0.1,def:17,unit:'m/s',onChange(sim){if(sim.st&&sim.p.mode==='loop')reset(sim,'loop');}},
    {id:'lm',label:'Cart and rider mass',lvl:'honors',type:'range',min:100,max:600,step:10,def:300,unit:'kg'},
    {id:'rR',label:'Rotor radius',type:'range',min:2,max:5,step:0.1,def:3,unit:'m'},
    {id:'rpm',label:'Spin rate',type:'range',min:0,max:40,step:1,def:30,unit:'rpm'},
    {id:'rmu',label:'Wall grip, μ<sub>s</sub>',type:'range',min:0.2,max:0.8,step:0.05,def:0.4},
    {id:'rm',label:'Rider mass',lvl:'honors',type:'range',min:30,max:120,step:5,def:60,unit:'kg'},
    {id:'vecs',label:'Velocity and acceleration arrows',type:'toggle',def:true},
    {id:'fbd',label:'Force arrows',lvl:'honors',type:'toggle',def:false}
  ],
  actions:[
    {id:'go',label:'Start again',primary:true,run(sim){reset(sim,sim.p.mode);}},
    {id:'cut',label:'Cut the string',run(sim){cutString(sim);}},
    {id:'floor',label:'Drop or raise the floor',run(sim){const r=sim.st.rot;if(r)r.floor=!r.floor;}},
    {id:'design',label:'Drive at the no-friction speed',lvl:'ap',run(sim){const p=sim.p;const v=Math.sqrt(G*p.cr*Math.tan(p.bank*D2R));if(v>=1){sim.p.cv=v;if(sim.ui&&sim.ui.ctl.cv)sim.ui.ctl.cv.set(v);}reset(sim,'curve');}},
    {id:'minimum',label:'Enter at the minimum speed √(5gR)',lvl:'honors',run(sim){const p=sim.p;p.lv=Math.sqrt(5*G*p.lR);if(sim.ui&&sim.ui.ctl.lv)sim.ui.ctl.lv.set(p.lv);reset(sim,'loop');}}
  ],
  init(sim){const st={};sim.st=st;['string','curve','loop','rotor'].forEach(m=>reset(sim,m));return st;},
  step(sim,dt){stepString(sim,dt);stepCurve(sim,dt);stepLoop(sim,dt);stepRotor(sim,dt);},
  metrics:[
    {id:'Fc',label:'String tension, mv²/r',unit:'N',d:1,min:0,max:null,get(sim){const p=sim.p,q=sim.st.str;return q&&q.cut?0:p.m*p.v*p.v/p.r;}},
    {id:'sspd',label:'Puck speed',unit:'m/s',d:1,min:0,max:null,get(sim){const q=sim.st.str;return q&&q.stop?0:sim.p.v;}},
    {id:'lap',label:'Measured lap time',unit:'s',d:2,max:null,get(sim){const q=sim.st.str;return q&&q.lastLap?q.lastLap:null;}},
    {id:'ac',label:'Centripetal acceleration v²/r',lvl:'honors',unit:'m/s²',d:1,min:0,max:null,get(sim){const p=sim.p;return p.v*p.v/p.r;}},
    {id:'tcalc',label:'Period 2πr/v',lvl:'honors',unit:'s',d:2,max:null,get(sim){const p=sim.p;return TAU*p.r/p.v;}},
    {id:'om',label:'Angular speed ω = v/r',lvl:'ap',unit:'rad/s',d:2,max:null,get(sim){const p=sim.p;return p.v/p.r;}},
    {id:'cspd',label:'Car speed',unit:'m/s',d:1,min:0,max:null,get(sim){const c=sim.st.car;return c&&c.skid?c.sp:sim.p.cv;}},
    {id:'grip',label:'Tire grip used',unit:'%',d:0,min:0,max:null,get(sim){const F=curveForces(sim.p);return F.fmax>1e-9?Math.min(999,Math.abs(F.f)/F.fmax*100):(Math.abs(F.f)<1e-6*sim.p.cm?0:999);}},
    {id:'fneed',label:'Friction needed',lvl:'honors',unit:'N',d:0,max:null,get(sim){return z(curveForces(sim.p).f);}},
    {id:'fmax',label:'Max friction μN',lvl:'honors',unit:'N',d:0,max:null,get(sim){return curveForces(sim.p).fmax;}},
    {id:'vmax',label:'Top safe speed',lvl:'honors',unit:'m/s',d:1,max:null,get(sim){return vmaxCurve(sim.p);}},
    {id:'vdes',label:'No-friction speed √(gr tan θ)',lvl:'ap',unit:'m/s',d:2,max:null,get(sim){const p=sim.p;return Math.sqrt(G*p.cr*Math.tan(p.bank*D2R));}},
    {id:'lspd',label:'Cart speed',unit:'m/s',d:1,min:0,max:null,get(sim){const c=sim.st.cart;return c?Math.hypot(c.vx||0,c.vy||0):0;}},
    {id:'feel',label:'Rider feels (N ÷ mg)',unit:'g',d:2,min:0,max:null,get(sim){const c=sim.st.cart;return c&&c.ph!=='air'&&c.res!=='crash'?Math.max(0,(c.N===undefined?sim.p.lm*G:c.N)/(sim.p.lm*G)):0;}},
    {id:'vtop',label:'Speed at the top',unit:'m/s',d:2,max:null,get(sim){const p=sim.p,c=sim.st.cart,v2=loopV2(p,Math.PI);return c&&c.maxPhi>=Math.PI-1e-6&&v2>=0?Math.sqrt(v2):null;}},
    {id:'ntop',label:'Track force at the top',lvl:'honors',unit:'N',d:0,max:null,get(sim){const p=sim.p,v2=loopV2(p,Math.PI);if(v2<0)return null;return z(p.lm*(v2/p.lR-G));}},
    {id:'vmin',label:'Minimum entry speed √(5gR)',lvl:'ap',unit:'m/s',d:2,max:null,get(sim){return Math.sqrt(5*G*sim.p.lR);}},
    {id:'rv',label:'Rider speed',unit:'m/s',d:1,min:0,max:null,get(sim){return omegaRotor(sim.p)*sim.p.rR;}},
    {id:'rdrop',label:'Distance slid down',unit:'m',d:2,min:0,max:null,get(sim){const r=sim.st.rot;return r?Math.max(0,r.y-0):0;}},
    {id:'rN',label:'Wall push (normal force)',lvl:'honors',unit:'N',d:0,max:null,get(sim){return rotorN(sim.p);}},
    {id:'rfmax',label:'Max friction μN',lvl:'honors',unit:'N',d:0,max:null,get(sim){return sim.p.rmu*rotorN(sim.p);}},
    {id:'rW',label:'Weight mg',lvl:'honors',unit:'N',d:0,max:null,get(sim){return sim.p.rm*G;}},
    {id:'rmin',label:'Minimum spin rate',lvl:'ap',unit:'rpm',d:1,max:null,get(sim){const p=sim.p;return Math.sqrt(G/(p.rmu*p.rR))*60/TAU;}}
  ],
  graphs:[{id:'g-Fc',label:'Puck: string tension',lines:['Fc']},{id:'g-grip',label:'Car: tire grip used',lines:['grip']},{id:'g-feel',label:'Loop: what the rider feels',lines:['feel']},{id:'g-rdrop',label:'Rotor: distance slid down',lines:['rdrop']}],
  defaultGraph:'g-Fc',
  onLevel(sim){sync(sim);setGraph(sim);},
  narrate(sim){const p=sim.p,st=sim.st,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode==='string'){const q=st.str;if(!q)return '';const F=p.m*p.v*p.v/p.r;
      if(q.cut)return `With the string cut, nothing pulls the puck toward the center, so it <b>keeps going straight</b> along the tangent at ${f1(p.v)} m/s. It does not fly straight out from the center.`;
      return (hon?`The string pulls inward with F = mv²/r = <b>${f1(F)} N</b>, giving a centripetal acceleration of ${f1(p.v*p.v/p.r)} m/s² toward the pin.`:`The string keeps pulling the puck toward the center (<b>${f1(F)} N</b>). That pull bends its straight-line motion into a circle.`)
        +(ap?` One lap takes T = 2πr/v = ${f2(TAU*p.r/p.v)} s; ω = ${f2(p.v/p.r)} rad/s.`:` The velocity arrow always points along the circle, not toward the center.`);}
    if(p.mode==='curve'){const c=st.car,F=curveForces(p),vm=vmaxCurve(p);if(!c)return '';
      if(c.skid)return `The tires needed ${f1(Math.abs(F.f)/1000)} kN of sideways friction but could only supply ${f1(F.fmax/1000)} kN. Without enough force toward the center, the car <b>slides off along a nearly straight line</b>, toward the outside of the curve.`;
      if(c.slideIn)return `On a ${p.bank}° bank at only ${f1(p.cv)} m/s, gravity pulls the car down the slope harder than friction can hold it, so it slides toward the inside.`;
      let t=hon?`Static friction supplies the centripetal force: m v²/r = ${f1(F.ac*p.cm/1000)} kN${p.bank>0?' together with the tilted normal force':''}. The car is using <b>${(F.fmax>0?Math.abs(F.f)/F.fmax*100:0).toFixed(0)}%</b> of its grip.`
        :`Friction between the tires and road pulls the car toward the center of the curve. It is using <b>${(F.fmax>0?Math.abs(F.f)/F.fmax*100:0).toFixed(0)}%</b> of its grip.`;
      t+=vm===null?' This bank holds the car at any speed.':` Above ${f1(vm)} m/s it would skid.`;
      if(ap&&p.bank>0)t+=` With no friction at all, the bank alone works at √(gr tan θ) = ${f2(Math.sqrt(G*p.cr*Math.tan(F.th)))} m/s.`;return t;}
    if(p.mode==='loop'){const c=st.cart;if(!c)return '';const vmin=Math.sqrt(5*G*p.lR);
      if(c.ph==='air'||c.res==='crash')return `The track force dropped to zero at ${f1((c.leftAt||0)/D2R)}° around the loop: gravity alone was more than the centripetal force needed, so the cart <b>fell away from the track</b>. Entry speed must be at least √(5gR) = ${f1(vmin)} m/s.`;
      if(c.ph==='back'||c.res==='back')return `The cart ran out of speed below the halfway point and rolled back. It needed at least ${f1(vmin)} m/s.`;
      if(c.ph==='loop'){const feel=(c.N||0)/(p.lm*G);return hon?`On the loop, N + (gravity toward center) = mv²/r. Here N = ${f1(Math.max(0,c.N)/1000)} kN, so the rider feels <b>${feel.toFixed(1)} g</b>. ${c.phi>Math.PI*0.75&&c.phi<Math.PI*1.25?'At the top, gravity points to the center and helps.':''}`
        :`The track pushes the cart toward the center of the loop. The rider feels <b>${feel.toFixed(1)}×</b> their normal weight: heaviest at the bottom, lightest at the top.`;}
      if(c.ph==='out'||c.res==='done')return `Made it around. At the top the speed was ${f1(Math.sqrt(Math.max(0,loopV2(p,Math.PI))))} m/s; the minimum is √(gR) = ${f1(Math.sqrt(G*p.lR))} m/s, when gravity alone supplies the centripetal force.`;
      return `The cart rolls toward the loop at ${f1(p.lv)} m/s. ${hon?'Energy: v<sub>top</sub>² = v² − 4gR.':'Will it be fast enough?'}`;}
    const r=st.rot,N=rotorN(p),W=p.rm*G,fmax=p.rmu*N;if(!r)return '';
    let t=hon?`The wall pushes the rider toward the center with N = mω²r = <b>${f1(N)} N</b>: that is the centripetal force. Friction can hold up to μN = ${f1(fmax)} N against the ${f1(W)} N weight.`
      :`The spinning wall pushes the riders toward the center. The harder it pushes, the more friction can hold them up.`;
    t+=r.floorY>0.01?(fmax>=W?' The floor has dropped, but <b>friction holds them on the wall</b>.':' The floor has dropped and <b>friction is too weak: they slide down</b>.'):' Press <b>Drop or raise the floor</b> to test it.';
    if(ap)t+=` Mass cancels: μmω²r ≥ mg needs ω ≥ √(g/μr), ${f1(Math.sqrt(G/(p.rmu*p.rR))*60/TAU)} rpm here.`;return t;},
  tour:[
    {title:'A puck on a string',text:'Seen from above, a puck glides on an air table, tied to a pin. The blue arrow is its velocity: it always points along the circle.',speed:0.4,
      focus:[STR.cx-STR.s*0.8-30,STR.cy-STR.s*0.8-30,STR.s*1.6+60,STR.s*1.6+60],setup(sim){BioLab.setValues(sim,{mode:'string'});BioLab.reset(sim);}},
    {title:'Acceleration toward the center',text:{bio:'The speed never changes, but the direction does, so the puck is accelerating. The red arrow shows the acceleration: always toward the center.',honors:'a<sub>c</sub> = v²/r = 16/0.8 = 20 m/s², toward the center. The string supplies the force: F = ma<sub>c</sub> = 10 N.'},speed:0.4,
      focus:[STR.cx-STR.s*0.8-30,STR.cy-STR.s*0.8-30,STR.s*1.6+60,STR.s*1.6+60],setup(sim){}},
    {title:'Cut the string',text:'Without the string’s pull, the puck goes straight along the tangent line from where it was. It does not spiral or fly outward from the center.',speed:0.4,
      focus:[20,14,520,422],setup(sim){reset(sim,'string');sim.st.str.th=0.4;cutString(sim);}},
    {title:'A car on a curve',text:'On a flat curve, static friction between the tires and road supplies the centripetal force. The gauge shows how much of the tires’ grip is being used.',speed:1,
      focus:[572,12,218,170],setup(sim){BioLab.setValues(sim,{mode:'curve',mu:0.7,cv:15,cr:50,bank:0});reset(sim,'curve');}},
    {title:'A wet road',text:{bio:'Now the road is slick (μ = 0.2). The same speed needs more grip than the tires have, so the car skids off on a nearly straight line.',honors:'Max friction μmg = 0.2 × 1200 × 9.8 = 2.4 kN, but mv²/r = 5.4 kN. Max speed √(μgr) = 9.9 m/s.'},speed:1,
      focus:[0,0,560,450],setup(sim){BioLab.setValues(sim,{mu:0.2});reset(sim,'curve');}},
    {title:'Loop-the-loop',text:{bio:'The track pushes the cart toward the center. At the top the rider feels lightest, because gravity is already pulling toward the center.',honors:'At the top, N + mg = mv²/R. The slowest safe top speed makes N = 0: v = √(gR). From energy, the entry speed must be √(5gR).'},speed:0.5,
      focus:[150,20,400,420],setup(sim){BioLab.setValues(sim,{mode:'loop',lR:5,lv:17});reset(sim,'loop');}},
    {title:'The rotor ride',text:'The wall pushes riders toward the center (the centripetal force). That push lets friction hold them up when the floor drops away.',speed:1,
      focus:[0,40,800,410],setup(sim){BioLab.setValues(sim,{mode:'rotor',rpm:30,rR:3,rmu:0.4});reset(sim,'rotor');sim.st.rot.floor=true;}},
    {lvl:'ap',title:'Banked curves',text:'Bank the road 20°. The tilted normal force has a horizontal part toward the center. At √(gr tan θ) no friction is needed at all, even on ice.',speed:1,
      focus:[572,192,218,246],setup(sim){BioLab.setValues(sim,{mode:'curve',bank:20,mu:0,cr:50,fbd:true});SIM.actions.find(a=>a.id==='design').run(sim);}}
  ],
  onTourExit(sim){const base={};SIM.controls.forEach(c=>base[c.id]=c.def);BioLab.setValues(sim,base);BioLab.reset(sim);},
  challenges:[
    {lvl:'bio',q:'The puck whirls on a string. You cut the string. Which path does the puck take?',choices:['It spirals outward','It flies straight out, away from the center','It goes straight along the tangent, the way it was moving'],correct:2,
      baseline:{mode:'string',m:0.5,r:0.8,v:4},changeAction:'cut',changeText:'String cut',at:1.1,reveal:2.4,
      explain:{bio:'It goes straight along the tangent. The string was the only thing turning it; with no force toward the center, the puck keeps the velocity it had (Newton’s first law).',honors:'Velocity is tangent to the circle. Remove the centripetal force and a = 0, so the puck moves in a straight line at constant speed.',ap:'With ΣF = 0, r(t) = r<sub>0</sub> + v<sub>0</sub>t: a straight line tangent to the circle at the release point.'}},
    {lvl:'bio',q:'Double the puck’s speed from 4 to 8 m/s on the same string. The string tension becomes:',choices:['Twice as big','Four times as big','The same'],correct:1,
      baseline:{mode:'string',m:0.5,r:0.8,v:4},change:{v:8},changeText:'Speed doubled',at:1.5,reveal:3,watch:'Fc',
      explain:{bio:'Four times: 10 N becomes 40 N. Going faster turns the puck’s direction quicker and it has more speed to turn, so the pull grows with speed squared.',honors:'F = mv²/r: (2v)² = 4v². 0.5 × 8² ÷ 0.8 = 40 N.',ap:'F ∝ v² at fixed r. At fixed ω instead, F = mω²r grows linearly with r.'}},
    {lvl:'bio',q:'The loop has a 5 m radius and needs 15.7 m/s at the bottom. The cart enters at only 13.5 m/s. What happens?',choices:['It slows down but makes it around','It leaves the track and falls before the top','It stops at the top and hangs there'],correct:1,
      baseline:{mode:'loop',lR:5,lv:13.5},at:0.2,reveal:3.6,watch:'g-feel',
      explain:{bio:'It falls off before the top. Near the top, gravity alone pulls it toward the center harder than its slow turn needs, so it drops away from the track.',honors:'The track force reaches zero when v² = −gR cos φ, at about 125° around: the cart becomes a projectile.',ap:'cos φ = (2gR − v<sub>0</sub>²)/(3gR) = −0.57, so it leaves at φ ≈ 125°. Between √(2gR) and √(5gR) the cart always leaves the track above the midline.'}},
    {lvl:'bio',q:'The floor of the rotor has dropped and the riders stay on the wall. Now the rotor slows from 30 to 15 rpm. What happens?',choices:['They stay put','They slide down the wall','They float toward the center'],correct:1,
      baseline:{mode:'rotor',rR:3,rpm:30,rmu:0.4,rm:60},baselineAction:'floor',change:{rpm:15},changeText:'Slowed to 15 rpm',at:2,reveal:4.4,watch:'rdrop',
      explain:{bio:'They slide down. Spinning slower, the wall pushes on them less, so friction can no longer hold up their weight.',honors:'N = mω²r drops to a quarter. Max friction μN = 0.4 × 444 = 178 N, less than the 588 N weight.',ap:'Holding needs ω ≥ √(g/μr) = 2.86 rad/s = 27 rpm here. At 15 rpm the riders slide.'}},
    {lvl:'honors',q:'The car rounds a 50 m curve at 15 m/s on a dry road (μ = 0.7). It starts to rain hard: μ drops to 0.2. What happens?',choices:['It holds the curve','It skids toward the outside of the curve','It slides toward the center'],correct:1,
      baseline:{mode:'curve',cv:15,cr:50,mu:0.7,bank:0,cm:1200},change:{mu:0.2},changeText:'Road now slick',at:1.5,reveal:4,watch:'g-grip',
      explain:{honors:'It skids outward. Needed friction mv²/r = 5.4 kN; available μmg = 2.4 kN. Max safe speed = √(μgr) = √(0.2 × 9.8 × 50) = 9.9 m/s.',ap:'With f < mv²/r the net inward force is too small for this radius, so the path straightens toward the tangent: the car moves to a larger radius, the outside.'}},
    {lvl:'honors',q:'Enter the 5 m loop at exactly the minimum speed, √(5gR) = 15.7 m/s. At the top, how hard does the track push on the cart?',choices:['Zero','Equal to the cart’s weight','Twice the cart’s weight'],correct:0,
      baseline:{mode:'loop',lR:5,lv:17},changeAction:'minimum',changeText:'Entering at the minimum speed',at:0.3,reveal:3.6,watch:'g-feel',
      explain:{honors:'Zero. At the top N + mg = mv²/R, and at the minimum speed v<sub>top</sub> = √(gR) = 7.0 m/s, so gravity alone supplies the centripetal force and N = 0. The rider feels weightless for an instant.',ap:'Energy: v<sub>top</sub>² = v<sub>0</sub>² − 4gR = 5gR − 4gR = gR, so N = m(v²/R − g) = 0.'}},
    {lvl:'honors',q:'A car at 18 m/s is using 94% of its grip on a dry curve. A truck twice as heavy takes the same curve at the same speed. Does it skid?',choices:['Yes, the heavier truck skids','No, it holds the curve too'],correct:1,
      baseline:{mode:'curve',cv:18,cr:50,mu:0.7,bank:0,cm:1200},change:{cm:2400},changeText:'Mass doubled',at:1.5,reveal:3.5,watch:'g-grip',
      explain:{honors:'It holds. Doubling m doubles the friction needed (mv²/r) and doubles the friction available (μmg). Grip used stays 94%.',ap:'μmg ≥ mv²/r ⇒ v ≤ √(μgr): mass cancels. (Real trucks are worse on curves because of a high center of gravity, which tips them over.)'}},
    {lvl:'ap',q:'The curve is banked 20° and the road turns to ice (μ = 0). The car drives at exactly √(gr tan θ). What happens?',choices:['It slides down the bank','It holds the curve','It slides off the outside'],correct:1,
      baseline:{mode:'curve',cr:50,bank:20,mu:0.7,cv:15,cm:1200},change:{mu:0},changeAction:'design',changeText:'Ice, at the no-friction speed',at:1.2,reveal:4,watch:'g-grip',
      explain:{ap:'It holds. N sin θ = mv²/r and N cos θ = mg give v² = gr tan θ: 13.4 m/s here, with zero friction needed. Faster, it would slide up and out; slower, it would slide down.'}},
    {lvl:'ap',q:'At 28 rpm the 60 kg rider just stays pinned after the floor drops. A 120 kg rider takes the same spot. What happens?',choices:['The heavier rider slides down','The heavier rider stays pinned too','The heavier rider is pushed harder and rises'],correct:1,
      baseline:{mode:'rotor',rR:3,rpm:28,rmu:0.4,rm:60},baselineAction:'floor',change:{rm:120},changeText:'120 kg rider',at:2.2,reveal:4.4,watch:'rdrop',
      explain:{ap:'Stays pinned. N = mω²r and the weight mg both double, so μmω²r ≥ mg reduces to ω ≥ √(g/μr) = 2.86 rad/s, about 27 rpm, independent of mass.'}}
  ],
  lab:{bio:'<p><b>Question:</b> How does speed affect the pull needed to keep something moving in a circle?</p><ol><li>Choose <b>Puck on a string</b>. Keep the mass at 0.5 kg and the radius at 0.8 m.</li><li>Set the speed to 2, 4, 6 and 8 m/s. Record the string tension each time.</li><li>Graph tension against speed.</li></ol><p>Is the graph a straight line? Describe the pattern when the speed doubles.</p>',
    honors:'<p><b>Question:</b> What is the fastest a car can take a flat curve?</p><ol><li>Choose <b>Car on a curve</b>. Set μ = 0.7 and radius 50 m.</li><li>Raise the speed in 1 m/s steps (press <b>Start again</b> each time) until the car skids. Record the highest safe speed.</li><li>Repeat for μ = 0.4 and 0.2, and for radius 100 m and 150 m.</li><li>Graph v<sub>max</sub>² against μr.</li></ol><p>Use your slope to find g, and explain why the car’s mass does not matter.</p>',
    ap:'<p><b>Question:</b> How does the minimum loop entry speed depend on the loop radius?</p><ol><li>Choose <b>Loop-the-loop</b>. For R = 3, 5, 7 and 9 m, find the lowest entry speed that makes it around (to 0.1 m/s).</li><li>Record the rider’s g-reading at the top and bottom for each.</li><li>Plot v<sub>min</sub>² against R.</li></ol><p>Write a CER deriving v<sub>min</sub> = √(5gR) from Newton’s second law at the top plus energy conservation, and explain why the rider feels 6 g at the bottom at that speed.</p>'},
  terms:[{t:'Uniform circular motion',d:'Moving in a circle at constant speed. The direction changes, so the object accelerates.'},
    {t:'Centripetal',d:'Pointing toward the center of the circle.'},{t:'Tangent',d:'The direction along the circle at one point; the velocity points this way.'},
    {t:'Centripetal force',lvl:'honors',d:'The net force toward the center, F = mv²/r. It is supplied by a real force: tension, friction, normal force or gravity.'},
    {t:'Period',lvl:'honors',d:'The time for one full circle, T = 2πr/v.'},
    {t:'Apparent weight',lvl:'honors',d:'The force a seat or track pushes on you; what you feel as your weight.'},
    {t:'Banked curve',lvl:'ap',d:'A curve tilted so the normal force has a horizontal component toward the center.'},
    {t:'Angular speed',lvl:'ap',d:'ω = v/r, in rad/s; F = mω²r.'}],
  about:'<p>Puck: uniform circular motion with F = mv²/r; cutting the string sets F = 0. Car: needed friction f = m(v²/r cos θ − g sin θ) and normal force N = m(g cos θ + v²/r sin θ); the car skids when |f| > μ<sub>s</sub>N, then slides straight while kinetic friction (0.75 μ<sub>s</sub>) slows it. Loop: frictionless track, speed from energy conservation, N = mv²/R + mg cos φ; the cart becomes a projectile when N reaches zero. Rotor: N = mω²r; riders slide with kinetic friction 0.8 μ<sub>s</sub> when μ<sub>s</sub>N < mg.</p><p>Simplified: the car is a point with no tipping, no tire slip angle and no steering after the skid; the loop is a perfect circle (real coasters use clothoid loops); no air resistance or rolling friction. The car is drawn larger than its real size on the bigger tracks.</p>',
  initVis(sim){sync(sim);},
  draw(sim,ctx,vdt,k){KF=k;k=Math.min(k,1.2);const m=sim.p.mode;if(m==='string')drawString(sim,ctx,k);else if(m==='curve')drawCurve(sim,ctx,k);else if(m==='loop')drawLoop(sim,ctx,k);else drawRotor(sim,ctx,k);}
};
BioLab.register(SIM);
})();
