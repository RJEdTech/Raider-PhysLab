(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL}=BioLab.h;

/* Rocket science: momentum conservation as propulsion.
   ROCKET: each step burns mass b; the exhaust leaves at speed vₑ backward relative to the rocket, so the rocket's
   speed rises by vₑ·ln(m/(m − b)) (exact over the step). Summed over a burn, that is the Tsiolkovsky rocket
   equation Δv = vₑ·ln(m₀/m_f). Thrust = ṁ·vₑ. Payload 2 t; a stage with fuel F carries 0.08F of tanks plus an
   engine (3 t, or 2 t for an upper stage). Two stages split the fuel 75/25 and the upper stage burns at ṁ/4.
   Deep space: no gravity, no air, so rocket + exhaust keep a total momentum of zero.
   Launch from Earth: inverse-square gravity, drag ½ρv²C_dA (ρ = 1.225·e^(−h/8500) kg/m³, C_d = 0.3, A = 10 m²),
   a programmed pitch-over from vertical (90°·(h/150 km)^0.4), and a flat-Earth frame with the centrifugal term
   v_x²/(R+h). Orbit = perigee above 120 km, from the state's energy and angular momentum.
   WATER ROCKET: 2 L bottle, 22 mm nozzle, 100 g dry. The air expands adiabatically (PV^1.4 constant); water leaves
   at u = √(2(P − Pₐ)/ρ), so ṁ = ρA_n·u and thrust = ṁu = 2A_n(P − Pₐ). Drag C_d = 0.5 on a 10 cm diameter.
   The brief burst of air after the water runs out is ignored. */
const G0=9.80665,RE=6.371e6,GM=3.986e14,PAY=2000,ORBIT_PERI=120e3,LAUNCH_R=2,LAUNCH_B=0.5;
const PA=101325,RHO=1000,VB=0.002,AN=Math.PI*0.011*0.011,DRYB=0.1,CDB=0.5,AB=0.00785,GAM=1.4,PSI=6894.76;
const DV_ORBIT=9400;
const kms=v=>(v/1000).toFixed(2)+' km/s';

function stages(p){const F=p.fuel*1000,md=p.mdot;if(+p.stages===2&&atLeast('honors'))return [{fuel:0.75*F,dry:0.08*0.75*F+3000,mdot:md,n:1},{fuel:0.25*F,dry:0.08*0.25*F+2000,mdot:md/4,n:2}];
  return [{fuel:F,dry:0.08*F+3000,mdot:md,n:1}];}
function idealDv(p,list){list=list||stages(p);let dv=0;const per=[];for(let i=0;i<list.length;i++){let m0=PAY;for(let j=i;j<list.length;j++)m0+=list[j].dry+list[j].fuel;const mf=m0-list[i].fuel,d=p.ve*Math.log(m0/mf);per.push({m0,mf,d});dv+=d;}return {dv,per};}
function earth(sim){return sim.p.mode==='rocket'&&sim.p.env==='earth'&&atLeast('honors');}
function rMass(s){let m=PAY;for(let j=s.si;j<s.st.length;j++)m+=s.st[j].dry+s.st[j].fuel;return m;}
function perigee(s){const r=RE+s.h,E=0.5*(s.vx*s.vx+s.vy*s.vy)-GM/r;if(E>=0)return Infinity;const L=r*s.vx,a=-GM/(2*E),e=Math.sqrt(Math.max(0,1+2*E*L*L/(GM*GM)));return a*(1-e)-RE;}
function applyMode(sim){const d=sim.def;if(sim.p.mode==='bottle'){d.timeScale=1;d.dtMax=0.0005;d.window=6;d.sampleDt=0.02;d.graphs=GR.bottle;}
  else{d.timeScale=20;d.dtMax=0.05;d.window=earth(sim)?600:400;d.sampleDt=1;d.graphs=GR.rocket;}}
function ctlBox(sim,id){const sec=sim.ui&&sim.ui.sec;if(!sec)return null;const el=sec.querySelector('#'+sim.def.id+'-'+id)||sec.querySelector('#'+sim.def.id+'-'+id+'-l');return el?el.closest('.ctl'):null;}
function syncUI(sim){const ui=sim.ui;if(!ui||!ui.sec)return;const p=sim.p,d=sim.def,mode=p.mode,env=earth(sim)?'earth':'space';
  d.controls.forEach(c=>{if(!c.show)return;const b=ctlBox(sim,c.id);if(b)b.hidden=!atLeast(c.lvl)||!c.show(p);});
  if(ui.tiles)d.metrics.forEach(m=>{const t=ui.tiles[m.id];if(!t)return;t.num.closest('.tile').hidden=!atLeast(m.lvl)||(m.mode&&m.mode!==mode)||(m.env&&(mode!=='rocket'||m.env!==env));});
  if(ui.gm){const go=d.graphs.filter(g=>atLeast(g.lvl)&&g.lines.every(id=>{const m=d.metrics.find(m=>m.id===id);return m&&atLeast(m.lvl);})&&(!g.env||g.env===env));
    ui.gm.innerHTML=go.map(g=>`<option value="${g.id}">${g.label}</option>`).join('');if(!go.find(g=>g.id===sim.gMetric))sim.gMetric=(go[0]||{}).id;if(sim.gMetric)ui.gm.value=sim.gMetric;}}
function restart(sim){BioLab.reset(sim);syncUI(sim);}

/* ---------- model ---------- */
function stepRocket(sim,dt){const s=sim.st,p=sim.p;if(s.done)return;s.t+=dt;if(s.t<LAUNCH_R)return;const ft=s.t-LAUNCH_R;
  // staging
  if(s.si<s.st.length&&s.st[s.si].fuel<=0&&s.si<s.st.length-1){const sp=s.st[s.si];s.pDrop+=sp.dry*(s.earth?Math.hypot(s.vx,s.vy):s.vx);s.si++;s.sepT=ft;s.sepDv=s.dv;s.msg='sep';}
  const stg=s.st[s.si],burning=stg&&stg.fuel>0;let m=rMass(s);
  if(!s.earth){if(burning){const b=Math.min(stg.fuel,stg.mdot*dt),dv=p.ve*Math.log(m/(m-b));s.pEx+=b*(s.vx+dv/2-p.ve);stg.fuel-=b;s.vx+=dv;s.dv+=dv;s.thrust=stg.mdot*p.ve;}
    else{s.thrust=0;if(s.tOut<0)s.tOut=ft;if(ft-s.tOut>20){s.done=true;s.why='coast';}}
    s.x+=s.vx*dt;s.acc=s.thrust/rMass(s);return;}
  // launch from Earth
  const r=RE+s.h,g=GM/(r*r),rho=1.225*Math.exp(-s.h/8500),v=Math.hypot(s.vx,s.vy),D=0.5*rho*v*v*0.3*10;
  const th=Math.PI/2*Math.pow(clamp(s.h/150e3,0,1),0.4);
  let dvT=0;if(burning){const b=Math.min(stg.fuel,stg.mdot*dt);dvT=p.ve*Math.log(m/(m-b));stg.fuel-=b;s.thrust=stg.mdot*p.ve;}else s.thrust=0;
  if(!s.air){if(s.thrust/m<=g){s.status='pad';if(!burning||s.st[s.si].fuel<=0){s.done=true;s.why='pad';}return;}s.air=true;}
  const ax=-(v>0?D*s.vx/v:0)/m,ay=-(v>0?D*s.vy/v:0)/m-g+s.vx*s.vx/r;
  s.vx+=dvT*Math.sin(th)+ax*dt;s.vy+=dvT*Math.cos(th)+ay*dt;s.x+=s.vx*dt;s.h+=s.vy*dt;s.dv+=dvT;
  if(burning){s.gl+=g*(v>1?s.vy/v:1)*dt;s.dl+=D/m*dt;}
  s.acc=Math.hypot(dvT/dt*(burning?1:0)+ax*0,0);s.acc=burning?s.thrust/rMass(s):0;s.maxh=Math.max(s.maxh,s.h);
  if(!(s.vis_t>=0)||ft-s.vis_t>=2){s.path.push([s.x,s.h]);s.vis_t=ft;if(s.path.length>400)s.path.splice(1,1);}
  if(perigee(s)>ORBIT_PERI){s.done=true;s.why='orbit';s.path.push([s.x,s.h]);return;}
  const out=s.si>=s.st.length-1&&s.st[s.st.length-1].fuel<=0;
  if(out&&s.vy<0){s.done=true;s.why='sub';s.path.push([s.x,s.h]);return;}
  if(s.h<0){s.h=0;s.done=true;s.why='crash';}}
function stepBottle(sim,dt){const s=sim.st;if(s.done)return;s.t+=dt;if(s.t<LAUNCH_B)return;
  const Va=VB-s.Vw,P=s.Vw>0?s.P0*Math.pow(s.Va0/Va,GAM):PA;s.P=P;let T=0;
  if(s.Vw>0&&P>PA){const u=Math.sqrt(2*(P-PA)/RHO);s.u=u;s.mdot=RHO*AN*u;T=s.mdot*u;const dV=Math.min(s.Vw,AN*u*dt);s.Vw-=dV;s.pW+=RHO*dV*(s.v-u);if(s.Vw<=1e-9){s.Vw=0;}}
  else{s.u=0;s.mdot=0;if(s.tOut<0)s.tOut=s.t-LAUNCH_B;}
  s.thrust=T;const m=DRYB+s.Vw*RHO,D=0.5*1.2*s.v*Math.abs(s.v)*CDB*AB,a=(T-D)/m-G0;s.acc=a;
  s.v+=a*dt;s.h+=s.v*dt;if(s.h<=0){if(s.v<0&&s.t-LAUNCH_B>0.2){s.h=0;s.done=true;s.why='land';s.vLand=s.v;s.v=0;}else{s.h=0;s.v=Math.max(0,s.v);}}
  if(s.h>s.maxh){s.maxh=s.h;s.tApo=s.t-LAUNCH_B;}s.vmax=Math.max(s.vmax,s.v);}

/* ---------- drawing ---------- */
function arrow(ctx,x1,y1,x2,y2,col,w){const a=Math.atan2(y2-y1,x2-x1),l=Math.hypot(x2-x1,y2-y1);if(l<2)return;const h=Math.min(11,l*0.6);
  ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=w||3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2-h*0.7*Math.cos(a),y2-h*0.7*Math.sin(a));ctx.stroke();
  ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-h*Math.cos(a-0.45),y2-h*Math.sin(a-0.45));ctx.lineTo(x2-h*Math.cos(a+0.45),y2-h*Math.sin(a+0.45));ctx.closePath();ctx.fill();}
const fr=x=>x-Math.floor(x),STARS=Array.from({length:70},(_,i)=>[fr(Math.sin(i*12.9898)*43758.5453)*540,12+fr(Math.sin(i*78.233)*23421.631)*280,0.6+fr(Math.sin(i*3.7)*9631.1)*1.2]);
/* rocket drawn pointing right, nose at (x,y); returns tail x */
function drawRocket(ctx,s,x,y,sc,burning){const two=s.st.length>1;let cx=x;ctx.save();ctx.translate(x,y);ctx.scale(sc,sc);
  // nose and payload
  ctx.fillStyle='#e8e8ec';ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(-14,-15,-34,-15);ctx.lineTo(-34,15);ctx.quadraticCurveTo(-14,15,0,0);ctx.fill();
  ctx.fillStyle='#7c5cc4';ctx.fillRect(-34,-15,8,30);let xx=-34;
  const tank=(len,fuelFr,col)=>{ctx.fillStyle='#d5d8de';ctx.fillRect(xx-len,-15,len,30);ctx.fillStyle=col;ctx.fillRect(xx-len+3,-11,(len-6)*fuelFr,22);ctx.strokeStyle='#666a72';ctx.lineWidth=1.5;ctx.strokeRect(xx-len,-15,len,30);xx-=len;};
  for(let i=s.st.length-1;i>=s.si;i--){const st=s.st[i],len=i===0?(two?110:150):46;tank(len,st.fuel0>0?st.fuel/st.fuel0:0,'#e0a526');
    // engine bell
    if(i===s.si){ctx.fillStyle='#55585f';ctx.beginPath();ctx.moveTo(xx,-9);ctx.lineTo(xx-12,-14);ctx.lineTo(xx-12,14);ctx.lineTo(xx,9);ctx.fill();xx-=12;}
    if(i===0){ctx.fillStyle='#b3323d';ctx.beginPath();ctx.moveTo(xx+14,-15);ctx.lineTo(xx-2,-28);ctx.lineTo(xx+30,-15);ctx.fill();ctx.beginPath();ctx.moveTo(xx+14,15);ctx.lineTo(xx-2,28);ctx.lineTo(xx+30,15);ctx.fill();}}
  if(burning){ctx.fillStyle='rgba(255,170,40,0.9)';ctx.beginPath();ctx.moveTo(xx,-10);ctx.lineTo(xx-34-8*Math.random(),0);ctx.lineTo(xx,10);ctx.fill();ctx.fillStyle='rgba(255,240,180,0.9)';ctx.beginPath();ctx.moveTo(xx,-5);ctx.lineTo(xx-16,0);ctx.lineTo(xx,5);ctx.fill();}
  ctx.restore();return x+xx*sc;}
function spaceScene(sim,ctx,k,vdt){const s=sim.st,p=sim.p,v=sim.vis,X0=8,Y0=8,W=540,H=292;
  ctx.save();ctx.beginPath();rr(ctx,X0,Y0,W,H,10);ctx.clip();ctx.fillStyle='#0d1424';ctx.fillRect(X0,Y0,W,H);
  v.off=(v.off||0)+vdt*Math.min(900,8*Math.sqrt(Math.max(0,s.vx)));
  STARS.forEach(q=>{const x=X0+((q[0]-v.off*q[2]*0.4)%W+W)%W;ctx.fillStyle='rgba(255,255,255,'+(0.35+q[2]*0.3)+')';const len=Math.min(30,s.vx/400*q[2]);ctx.fillRect(x,Y0+q[1],Math.max(1.5,len),1.5);});
  const burning=s.t>=LAUNCH_R&&s.thrust>0&&!s.done,nose=430,y=150;
  // exhaust particles in the rocket's frame
  v.parts=v.parts||[];
  const tx=nose+(s.st.length>1?(s.si===0?-(34+110+12+46):-(34+46+12)):-(34+150+12));
  if(burning&&vdt>0){const n=Math.min(6,1+Math.round(s.st[s.si].mdot/400));for(let i=0;i<n;i++)if(v.parts.length<140)v.parts.push({x:tx-4,y:y+(Math.random()-0.5)*14,vy:(Math.random()-0.5)*30,age:0});}
  const pv=p.ve/12;v.parts.forEach(q=>{q.x-=pv*vdt;q.y+=q.vy*vdt;q.age+=vdt;});v.parts=v.parts.filter(q=>q.x>X0-10&&q.age<3);
  v.parts.forEach(q=>{ctx.fillStyle='rgba(255,190,90,'+clamp(0.85-q.age*0.35,0.1,0.85)+')';ctx.beginPath();ctx.arc(q.x,q.y,2.6,0,6.29);ctx.fill();});
  // spent stage drifting back
  if(s.si>0&&s.sepT>=0){const back=(s.dv-s.sepDv)*0.03+(s.t-LAUNCH_R-s.sepT)*6;const sx=tx-back+46;ctx.globalAlpha=clamp(1-back/500,0.2,1);ctx.fillStyle='#d5d8de';ctx.fillRect(sx-110,y-15,110,30);ctx.strokeStyle='#666a72';ctx.strokeRect(sx-110,y-15,110,30);
    txt(ctx,'spent first stage',sx-55,y+36,{s:11*k,c:'#cfd6e4',a:'center'});ctx.globalAlpha=1;}
  drawRocket(ctx,s,nose,y,1,burning);
  // labels
  txt(ctx,'Deep space: no gravity, no air',X0+12,Y0+20,{s:12*k,c:'#cfd6e4'});
  if(burning&&atLeast('bio')){arrow(ctx,tx-20,y+52,tx-20-clamp(p.ve/40,30,120),y+52,'#ffb347',3);txt(ctx,'exhaust '+Math.round(p.ve)+' m/s backward',X0+14,y+72,{s:12*k,w:700,c:'#ffb347'});}
  arrow(ctx,nose-100,y-48,nose-100+clamp(s.vx/80,0,130),y-48,'#7fb2ff',3);txt(ctx,'rocket '+Math.round(s.vx)+' m/s',nose-100,y-60,{s:12.5*k,w:700,c:'#7fb2ff'});
  if(s.t<LAUNCH_R)pill(ctx,'Engines start in '+Math.ceil(LAUNCH_R-s.t)+' s',X0+W/2,Y0+H-24,'#7c5cc4','#fff',12*k);
  else if(s.msg==='sep'&&s.t-LAUNCH_R-s.sepT<15)pill(ctx,'Stage separation: dropping the empty tank',X0+W/2,Y0+H-24,'#7c5cc4','#fff',12*k);
  else if(!burning&&s.t>=LAUNCH_R)pill(ctx,'Engine off: coasting at constant speed',X0+W/2,Y0+H-24,'#2f7d4f','#fff',12*k);
  ctx.restore();}
function earthScene(sim,ctx,k){const s=sim.st,X0=8,Y0=8,W=540,H=292,S=470/2.0e6,E=2.5,ys=230,x0=40;
  ctx.save();ctx.beginPath();rr(ctx,X0,Y0,W,H,10);ctx.clip();ctx.fillStyle='#0d1424';ctx.fillRect(X0,Y0,W,H);
  STARS.forEach(q=>{ctx.fillStyle='rgba(255,255,255,'+(0.25+q[2]*0.25)+')';ctx.fillRect(X0+q[0],Y0+q[1],1.5,1.5);});
  const P=(x,h)=>{const ph=x/RE,r=RE+h*E;return [x0+r*Math.sin(ph)*S,ys-(r*Math.cos(ph)-RE)*S];};
  // Earth and atmosphere
  ctx.beginPath();for(let i=-5;i<=60;i++){const q=P(i*50e3,0);i===-5?ctx.moveTo(q[0],q[1]):ctx.lineTo(q[0],q[1]);}ctx.lineTo(X0+W,Y0+H);ctx.lineTo(X0,Y0+H);ctx.closePath();ctx.fillStyle='#2c5d8f';ctx.fill();
  ctx.strokeStyle='rgba(120,180,255,0.45)';ctx.lineWidth=10;ctx.beginPath();for(let i=-5;i<=60;i++){const q=P(i*50e3,6e3);i===-5?ctx.moveTo(q[0],q[1]):ctx.lineTo(q[0],q[1]);}ctx.stroke();
  // target orbit
  ctx.setLineDash([6,5]);ctx.strokeStyle='rgba(180,220,255,0.7)';ctx.lineWidth=1.5;ctx.beginPath();for(let i=-5;i<=60;i++){const q=P(i*50e3,200e3);i===-5?ctx.moveTo(q[0],q[1]):ctx.lineTo(q[0],q[1]);}ctx.stroke();ctx.setLineDash([]);
  const lo=P(1.55e6,200e3);txt(ctx,'low orbit: 200 km up, 7.8 km/s sideways',lo[0],lo[1]-14,{s:11.5*k,c:'#cfe3ff',a:'center'});
  const ls=P(0,0);ctx.fillStyle='#fff';ctx.fillRect(ls[0]-2,ls[1]-8,4,8);txt(ctx,'launch site',ls[0]+6,ls[1]+16,{s:11*k,c:'#e6eefc'});
  // path
  ctx.strokeStyle='#ffcf6b';ctx.lineWidth=2.5;ctx.beginPath();s.path.forEach((q,i)=>{const a=P(q[0],q[1]);i?ctx.lineTo(a[0],a[1]):ctx.moveTo(a[0],a[1]);});const cur=P(s.x,s.h);ctx.lineTo(cur[0],cur[1]);ctx.stroke();
  // rocket icon along velocity
  const ang=Math.atan2(-(s.vy*E),s.vx||1e-6)+(s.vx===0&&s.vy===0?-Math.PI/2:0);ctx.save();ctx.translate(cur[0],cur[1]);ctx.rotate(s.vx===0&&s.vy===0?-Math.PI/2:Math.atan2(-s.vy*E,s.vx)-s.x/RE);
  ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(-7,-5);ctx.lineTo(-7,5);ctx.closePath();ctx.fill();if(s.thrust>0&&!s.done){ctx.fillStyle='#ffb347';ctx.beginPath();ctx.moveTo(-7,-3);ctx.lineTo(-17,0);ctx.lineTo(-7,3);ctx.fill();}ctx.restore();void ang;
  txt(ctx,'Launch from Earth (heights stretched 2.5×)',X0+12,Y0+20,{s:12*k,c:'#cfd6e4'});
  const lab=s.done?(s.why==='orbit'?'Orbit reached!':s.why==='pad'?'Too heavy: thrust is less than weight':s.why==='crash'?'Crashed':'Not enough Δv: it will fall back'):s.t<LAUNCH_R?'Engines start in '+Math.ceil(LAUNCH_R-s.t)+' s':s.status==='pad'&&!s.air?'Too heavy to lift off':s.thrust>0?'Burning: stage '+(s.si+1):'Coasting';
  pill(ctx,lab,X0+W/2,Y0+H-22,s.done?(s.why==='orbit'?'#2f7d4f':'#b3323d'):'#7c5cc4','#fff',12.5*k);
  ctx.restore();}
function massPanel(sim,ctx,k,X,Y,W,H){const s=sim.st,p=sim.p,hon=atLeast('honors');
  ctx.fillStyle=PAL.card;rr(ctx,X,Y,W,H,10);ctx.fill();ctx.strokeStyle=PAL.line;ctx.lineWidth=1;ctx.stroke();
  txt(ctx,'What the rocket is made of',X+12,Y+22,{s:13*k,w:700,c:PAL['cv-ink']});
  const m0=s.m0,top=Y+40,bot=Y+H-(hon?96:56),bh=bot-top,bx=X+18,bw=44;const sc=bh/m0;let y=bot;
  const seg=(m,col,lab,hatch)=>{const h=m*sc;if(h<0.5)return;ctx.fillStyle=col;ctx.fillRect(bx,y-h,bw,h);y-=h;};
  seg(PAY,PAL.s5);for(let i=s.si;i<s.st.length;i++){seg(s.st[i].dry,PAL['cv-soft']);seg(s.st[i].fuel,PAL.s4);}
  ctx.strokeStyle=PAL['cv-soft'];ctx.setLineDash([3,3]);ctx.strokeRect(bx,top,bw,bh);ctx.setLineDash([]);
  const fuel=s.st.slice(s.si).reduce((a,q)=>a+q.fuel,0),dry=s.st.slice(s.si).reduce((a,q)=>a+q.dry,0);
  const rows=[['fuel '+(fuel/1000).toFixed(1)+' t',PAL.s4],['tanks, engines '+(dry/1000).toFixed(1)+' t',PAL['cv-soft']],['payload 2.0 t',PAL.s5]];
  rows.forEach((r,i)=>{ctx.fillStyle=r[1];ctx.fillRect(bx+bw+12,top+6+i*22,10,10);txt(ctx,r[0],bx+bw+26,top+15+i*22,{s:11.5*k,c:PAL['cv-ink']});});
  txt(ctx,'Now '+(rMass(s)/1000).toFixed(1)+' t of '+(m0/1000).toFixed(0)+' t',bx+bw+12,top+86,{s:11.5*k,w:700,c:PAL['cv-ink']});
  if(s.si>0)txt(ctx,'first stage dropped',bx+bw+12,top+106,{s:11*k,c:PAL['cv-soft']});
  const id=idealDv(p,s.st0);
  if(hon){const yy=bot+22;txt(ctx,'Δv = vₑ ln(m₀ / m_f)',X+12,yy,{s:11.5*k,w:700,c:PAL['cv-ink']});
    id.per.forEach((q,i)=>txt(ctx,(id.per.length>1?'Stage '+(i+1)+': ':'')+Math.round(p.ve)+' × ln('+(q.m0/1000).toFixed(0)+'/'+(q.mf/1000).toFixed(0)+') = '+kms(q.d),X+12,yy+19+i*17,{s:11*k,c:PAL['cv-soft']}));
    txt(ctx,'Total Δv = '+kms(id.dv),X+12,yy+19+id.per.length*17+2,{s:12*k,w:700,c:PAL.s2});}
  else txt(ctx,'Start mass ÷ empty mass = '+(id.per[0].m0/id.per[0].mf).toFixed(1),X+12,bot+24,{s:11.5*k,c:PAL['cv-soft']});}
function momentumPanel(sim,ctx,k,X,Y,W,H){const s=sim.st,pr=rMass(s)*s.vx/1e6,pe=(s.pEx+s.pDrop)/1e6,tot=pr+pe;
  ctx.fillStyle=PAL.card;rr(ctx,X,Y,W,H,10);ctx.fill();ctx.strokeStyle=PAL.line;ctx.lineWidth=1;ctx.stroke();
  txt(ctx,'Momentum (millions of kg·m/s): rocket forward, exhaust backward',X+12,Y+20,{s:12.5*k,w:700,c:PAL['cv-ink']});
  const cx=X+W/2+40,half=W/2-190,mx=Math.max(1,Math.abs(pr),Math.abs(pe))*1.05,sc=half/mx;
  ctx.strokeStyle=PAL['cv-soft'];ctx.beginPath();ctx.moveTo(cx,Y+30);ctx.lineTo(cx,Y+H-8);ctx.stroke();
  [['Rocket',pr,PAL.s2],[s.st.length>1?'Exhaust + old stage':'Exhaust',pe,'#e07b1f'],['Total',tot,PAL['cv-ink']]].forEach((r,i)=>{const y=Y+36+i*30,w=r[1]*sc;
    txt(ctx,r[0],X+12,y+13,{s:12*k,w:700,c:r[2]});ctx.fillStyle=r[2];ctx.fillRect(w>=0?cx:cx+w,y,Math.max(2,Math.abs(w)),18);
    txt(ctx,(Math.abs(r[1])<0.005?0:r[1]).toFixed(2).replace('-','−'),w>=0?cx+w+6:cx+6,y+14,{s:11.5*k,c:PAL['cv-ink']});});}
function budgetPanel(sim,ctx,k,X,Y,W,H){const s=sim.st,p=sim.p,ap=atLeast('ap'),id=idealDv(p,s.st0).dv,v=Math.hypot(s.vx,s.vy);
  ctx.fillStyle=PAL.card;rr(ctx,X,Y,W,H,10);ctx.fill();ctx.strokeStyle=PAL.line;ctx.lineWidth=1;ctx.stroke();
  txt(ctx,'Δv budget: where the rocket’s '+kms(id)+' goes',X+12,Y+20,{s:12.5*k,w:700,c:PAL['cv-ink']});
  const L=X+14,R=X+W-14,mx=Math.max(id,DV_ORBIT)*1.08,sc=(R-L)/mx,y=Y+44,h=26;let x=L;
  const seg=(val,col,hatch)=>{const w=Math.max(0,val)*sc;ctx.fillStyle=col;ctx.fillRect(x,y,w,h);x+=w;};
  const remain=Math.max(0,id-s.dv);
  seg(Math.min(v,s.dv),PAL.s3);seg(s.gl,PAL.s1);seg(s.dl,PAL.s4);const xr=x;ctx.strokeStyle=PAL['cv-soft'];ctx.setLineDash([4,3]);ctx.strokeRect(xr,y,remain*sc,h);ctx.setLineDash([]);
  const xo=L+DV_ORBIT*sc;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(xo,y-8);ctx.lineTo(xo,y+h+8);ctx.stroke();
  txt(ctx,'orbit needs ≈ 9.4 km/s',xo,y-10,{s:11*k,c:PAL['cv-ink'],a:xo>R-90?'right':'center',w:600});
  const leg=[['speed now',PAL.s3],['lost to gravity',PAL.s1],['lost to drag',PAL.s4],['fuel left (dashed)',PAL['cv-soft']]];let lx=L;
  leg.forEach(l=>{ctx.fillStyle=l[1];ctx.fillRect(lx,y+h+16,10,10);const t=l[0]+(ap&&l[0]==='lost to gravity'?' '+Math.round(s.gl)+' m/s':ap&&l[0]==='lost to drag'?' '+Math.round(s.dl)+' m/s':'');txt(ctx,t,lx+14,y+h+25,{s:11*k,c:PAL['cv-soft']});lx+=24+ctx.measureText(t).width;});}

function bottleScene(sim,ctx,k,vdt){const s=sim.st,v=sim.vis,X0=8,Y0=8,W=462,H=434,gy=410;
  ctx.save();ctx.beginPath();rr(ctx,X0,Y0,W,H,10);ctx.clip();ctx.fillStyle=PAL['cv-bg2']||PAL['cv-bg'];ctx.fillRect(X0,Y0,W,H);
  const hmax=Math.max(50,Math.ceil(Math.max(s.maxh,s.pred||0)*1.15/10)*10),sc=(gy-50)/hmax,Y=h=>gy-h*sc;
  ctx.strokeStyle=PAL.line;ctx.lineWidth=1;const step=hmax>80?20:10;for(let h=step;h<=hmax;h+=step){ctx.beginPath();ctx.moveTo(60,Y(h));ctx.lineTo(X0+W-10,Y(h));ctx.stroke();txt(ctx,h+' m',52,Y(h)+4,{s:11*k,c:PAL['cv-soft'],a:'right'});}
  ctx.fillStyle='#4b7a3a';ctx.fillRect(X0,gy,W,H);
  if(s.maxh>0.5){ctx.setLineDash([6,4]);ctx.strokeStyle=PAL.s3;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(150,Y(s.maxh));ctx.lineTo(X0+W-14,Y(s.maxh));ctx.stroke();ctx.setLineDash([]);
    txt(ctx,(s.done||s.v<0?'highest: ':'highest so far: ')+s.maxh.toFixed(1)+' m',X0+W-16,Y(s.maxh)-6,{s:12*k,w:700,c:PAL.s3,a:'right'});}
  const cx=240,yb=Y(s.h)-4;
  // launch pad
  ctx.fillStyle='#666a72';ctx.fillRect(cx-26,gy-6,52,6);
  // spray
  v.drops=v.drops||[];if(s.thrust>0&&vdt>0){for(let i=0;i<6;i++)if(v.drops.length<160)v.drops.push({x:cx+(Math.random()-0.5)*6,y:yb,vx:(Math.random()-0.5)*60,vy:120+s.u*6,age:0});}
  v.drops.forEach(q=>{q.x+=q.vx*vdt;q.y+=q.vy*vdt;q.age+=vdt;});v.drops=v.drops.filter(q=>q.age<0.8&&q.y<gy+4);
  ctx.fillStyle='#4a90d9';v.drops.forEach(q=>{ctx.globalAlpha=clamp(1-q.age*1.3,0.1,1);ctx.beginPath();ctx.arc(q.x,q.y,2.4,0,6.29);ctx.fill();});ctx.globalAlpha=1;
  // bottle: nozzle down at yb, 76 px tall
  const bw=26,bh=76,top=yb-bh;ctx.fillStyle='rgba(200,225,245,0.85)';rr(ctx,cx-bw/2,top+14,bw,bh-24,6);ctx.fill();
  const wf=s.Vw/VB,wh=(bh-24)*wf;ctx.fillStyle='#3d7fc4';ctx.fillRect(cx-bw/2+2,top+14+(bh-24)-wh,bw-4,wh);
  ctx.strokeStyle='#5a7a94';ctx.lineWidth=1.5;rr(ctx,cx-bw/2,top+14,bw,bh-24,6);ctx.stroke();
  ctx.fillStyle='#b3323d';ctx.beginPath();ctx.moveTo(cx-bw/2,top+15);ctx.quadraticCurveTo(cx,top-10,cx+bw/2,top+15);ctx.fill();
  ctx.fillStyle='#5a7a94';ctx.fillRect(cx-5,yb-10,10,10);
  ctx.fillStyle='#b3323d';[[-1],[1]].forEach(([d])=>{ctx.beginPath();ctx.moveTo(cx+d*bw/2,yb-30);ctx.lineTo(cx+d*(bw/2+12),yb-4);ctx.lineTo(cx+d*bw/2,yb-14);ctx.fill();});
  // velocity arrow
  if(Math.abs(s.v)>0.3){const len=clamp(Math.abs(s.v)*2.2,10,90),up=s.v>0;arrow(ctx,cx+46,up?yb-30:top,cx+46,up?yb-30-len:top+len,PAL.s2,3);txt(ctx,Math.abs(s.v).toFixed(1)+' m/s',cx+56,yb-36,{s:12*k,w:700,c:PAL.s2});}
  txt(ctx,'2 L bottle rocket (drawn larger than life)',X0+12,Y0+20,{s:11.5*k,c:PAL['cv-soft']});
  const lab=s.t<LAUNCH_B?'Pressurized: ready to launch':s.thrust>0?'Thrust: water blasting out':s.done?'Landed':s.v>0?'Coasting up: gravity and drag slow it':'Falling back';
  pill(ctx,lab,X0+W/2,Y0+44,s.thrust>0?'#e07b1f':s.done?'#2f7d4f':'#7c5cc4','#fff',12*k);
  ctx.restore();}
function bottlePanel(sim,ctx,k,X,Y,W,H){const s=sim.st,p=sim.p,hon=atLeast('honors');
  ctx.fillStyle=PAL.card;rr(ctx,X,Y,W,H,10);ctx.fill();ctx.strokeStyle=PAL.line;ctx.lineWidth=1;ctx.stroke();
  txt(ctx,'Inside the bottle',X+12,Y+22,{s:13*k,w:700,c:PAL['cv-ink']});
  const bx=X+30,bw=74,bt=Y+50,bh=200;ctx.fillStyle='rgba(205,215,230,0.55)';rr(ctx,bx,bt,bw,bh,12);ctx.fill();
  const wh=bh*(s.Vw/VB);ctx.fillStyle='#3d7fc4';ctx.fillRect(bx+3,bt+bh-wh,bw-6,wh);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;rr(ctx,bx,bt,bw,bh,12);ctx.stroke();
  ctx.fillStyle=PAL['cv-soft'];ctx.fillRect(bx+bw/2-8,bt+bh,16,10);
  const psi=Math.max(0,(s.P-PA)/PSI);
  txt(ctx,'air',bx+bw/2,bt+22,{s:12*k,w:700,c:PAL['cv-ink'],a:'center'});txt(ctx,psi.toFixed(0)+' psi',bx+bw/2,bt+40,{s:12*k,c:PAL['cv-ink'],a:'center'});
  if(wh>24)txt(ctx,(s.Vw*1000).toFixed(2)+' L',bx+bw/2,bt+bh-8,{s:12*k,w:700,c:'#fff',a:'center'});
  if(s.thrust>0){arrow(ctx,bx+bw/2,bt+bh+14,bx+bw/2,bt+bh+48,'#3d7fc4',4);arrow(ctx,bx-12,bt+bh-20,bx-12,bt+bh-80,PAL.s1,4);}
  const tx=bx+bw+20,lines=[];
  ['Air pushes the water','out the bottom.','Water goes down,','so the bottle goes up.'].forEach(t=>lines.push([t,PAL['cv-ink'],600]));
  if(hon){lines.push(['',0]);lines.push(['u = '+(s.u||0).toFixed(1)+' m/s',PAL['cv-soft']]);lines.push(['ṁ = '+(s.mdot||0).toFixed(1)+' kg/s',PAL['cv-soft']]);lines.push(['thrust = ṁu = '+(s.thrust||0).toFixed(0)+' N',PAL.s1,600]);}
  lines.forEach((l,i)=>{if(l[0])txt(ctx,l[0],tx,Y+66+i*19,{s:11.5*k,c:l[1],w:l[2]||400});});
  const yb=Y+H-70;  txt(ctx,s.done?'Flight over: highest point '+s.maxh.toFixed(1)+' m':'Highest so far: '+s.maxh.toFixed(1)+' m',X+12,yb+22,{s:13*k,w:700,c:PAL.s3});
  if(hon&&s.tOut>=0)txt(ctx,'Water ran out after '+(s.tOut*1000).toFixed(0)+' ms',X+12,yb+42,{s:11.5*k,c:PAL['cv-soft']});}

const GR={rocket:[{id:'gv',label:'Rocket speed vs time',lvl:'bio',lines:['vr']},{id:'gm',label:'Rocket mass vs time',lvl:'bio',lines:['mass']},{id:'ga',label:'Acceleration vs time',lvl:'honors',lines:['acc']},{id:'gh',label:'Altitude vs time',lvl:'honors',lines:['alt'],env:'earth'}],
  bottle:[{id:'bh',label:'Altitude vs time',lvl:'bio',lines:['altb']},{id:'bv',label:'Velocity vs time',lvl:'bio',lines:['vb']},{id:'bt',label:'Thrust vs time',lvl:'honors',lines:['thrustb']},{id:'bw',label:'Water left vs time',lvl:'bio',lines:['water']}]};

const SIM={
  id:'rocket',hash:'rocket',apUnit:13,order:1,tab:'Rocket science',kind:'Go further',prereq:['collisions','impulse'],
  card:'Launch a water bottle rocket and a two-stage orbital rocket, and use conservation of momentum to see why rockets need so much fuel.',
  title:'Rocket science: momentum, fuel and the road to orbit',
  lede:{bio:'A rocket moves forward by throwing mass backward, just like a skater throwing a heavy ball. No ground or air is needed, which is why rockets work in space.',
        honors:'Use the rocket equation, Δv = vₑ ln(m₀/m_f), to see why faster exhaust beats more fuel and why rockets drop empty stages.',
        ap:'Treat the rocket as a variable-mass system, account for gravity and drag losses, and try to reach orbit with a two-stage launcher.'},
  scale:{bio:'Real scale: a 2 L bottle rocket rises 30–50 m in a few seconds; an orbital rocket here weighs about 100 t and burns for several minutes. Rocket flights run 20× faster than real time.',
         honors:'Real scale: rocket exhaust leaves at 2–4.5 km/s (4.5 km/s is the best hydrogen–oxygen engines). Orbit takes about 7.8 km/s sideways, plus about 1.5 km/s lost to gravity and drag. Rocket flights run 20× faster than real time.'},
  timeScale:20,dtMax:0.05,prewarm:0,sampleDt:1,window:400,unit:'s',chChange:0,chReveal:180,
  controls:[
    {id:'mode',label:'Rocket',type:'seg',def:'rocket',lvl:'bio',options:[{v:'rocket',l:'Big rocket'},{v:'bottle',l:'Water bottle rocket'}],onChange:restart},
    {id:'env',label:'Where',type:'seg',def:'space',lvl:'honors',options:[{v:'space',l:'Deep space'},{v:'earth',l:'Launch from Earth'}],show:p=>p.mode==='rocket',onChange:restart},
    {id:'ve',label:'Exhaust speed',type:'range',min:1000,max:4500,step:250,def:3000,d:0,unit:' m/s',lvl:'bio',help:'How fast the engine throws gas backward. Better engines and fuels give faster exhaust.',show:p=>p.mode==='rocket',onChange:restart},
    {id:'fuel',label:'Fuel loaded',type:'range',min:20,max:300,step:10,def:100,d:0,unit:' t',lvl:'bio',help:'Bigger tanks add 0.08 t of tank for every tonne of fuel.',show:p=>p.mode==='rocket',onChange:restart},
    {id:'stages',label:'Stages',type:'seg',def:1,lvl:'honors',options:[{v:1,l:'One stage'},{v:2,l:'Two stages'}],show:p=>p.mode==='rocket',onChange:restart},
    {id:'mdot',label:'Fuel burn rate (first stage)',type:'range',min:200,max:2000,step:100,def:600,d:0,unit:' kg/s',lvl:'honors',help:'Thrust = burn rate × exhaust speed.',show:p=>p.mode==='rocket',onChange:restart},
    {id:'psi',label:'Launch pressure',type:'range',min:20,max:90,step:5,def:60,d:0,unit:' psi',lvl:'bio',show:p=>p.mode==='bottle',onChange:restart},
    {id:'water',label:'Water in the bottle',type:'range',min:0.1,max:1.9,step:0.1,def:0.6,d:1,unit:' L',lvl:'bio',show:p=>p.mode==='bottle',onChange:restart}
  ],
  actions:[{id:'go',label:'Launch again',primary:true,run(sim){restart(sim);}}],
  init(sim){applyMode(sim);const p=sim.p;
    if(p.mode==='bottle'){const P0=PA+p.psi*PSI,Vw=Math.min(p.water,1.9)/1000;return {mode:'bottle',t:0,P0,P:P0,Vw,Va0:VB-Vw,h:0,v:0,u:0,mdot:0,thrust:0,acc:0,maxh:0,vmax:0,tOut:-1,done:false,why:'',pW:0};}
    const st=stages(p).map(q=>Object.assign({},q,{fuel0:q.fuel}));const st0=st.map(q=>Object.assign({},q));
    const s={mode:'rocket',earth:earth(sim),t:0,st,st0,si:0,x:0,h:0,vx:0,vy:0,dv:0,gl:0,dl:0,maxh:0,thrust:0,acc:0,pEx:0,pDrop:0,done:false,why:'',sepT:-1,sepDv:0,tOut:-1,air:false,status:'',path:[[0,0]],vis_t:-1,msg:''};
    s.m0=rMass(s);return s;},
  step(sim,dt){if(sim.st.mode==='bottle')stepBottle(sim,dt);else stepRocket(sim,dt);},
  metrics:[
    {id:'vr',label:'Rocket speed',unit:'m/s',lvl:'bio',min:0,max:null,d:0,mode:'rocket',get:sim=>sim.st.mode==='rocket'?Math.hypot(sim.st.vx,sim.st.vy):0},
    {id:'mass',label:'Rocket mass',unit:'t',lvl:'bio',min:0,max:null,d:1,mode:'rocket',get:sim=>sim.st.mode==='rocket'?rMass(sim.st)/1000:0},
    {id:'fuelpc',label:'Fuel left',unit:'%',lvl:'bio',min:0,max:100,d:0,mode:'rocket',get:sim=>{const s=sim.st;if(s.mode!=='rocket')return 0;const f0=s.st.reduce((a,q)=>a+q.fuel0,0);return 100*s.st.reduce((a,q)=>a+q.fuel,0)/f0;}},
    {id:'ptot',label:'Total momentum, rocket + exhaust',unit:'million kg·m/s',lvl:'bio',min:-1,max:null,d:2,mode:'rocket',env:'space',get:sim=>{const s=sim.st;if(s.mode!=='rocket')return 0;const t=(rMass(s)*s.vx+s.pEx+s.pDrop)/1e6;return Math.abs(t)<0.005?0:t;}},
    {id:'dvi',label:'Rocket-equation Δv (all fuel)',unit:'m/s',lvl:'honors',min:0,max:null,d:0,mode:'rocket',get:sim=>sim.st.mode==='rocket'?idealDv(sim.p,sim.st.st0).dv:0},
    {id:'thrust',label:'Thrust',unit:'kN',lvl:'honors',min:0,max:null,d:0,mode:'rocket',get:sim=>sim.st.mode==='rocket'?sim.st.thrust/1000:0},
    {id:'acc',label:'Acceleration from the engine',unit:'g',lvl:'honors',min:0,max:null,d:2,mode:'rocket',get:sim=>sim.st.mode==='rocket'?sim.st.acc/G0:0},
    {id:'alt',label:'Altitude',unit:'km',lvl:'honors',min:0,max:null,d:0,mode:'rocket',env:'earth',get:sim=>sim.st.mode==='rocket'?sim.st.h/1000:0},
    {id:'peri',label:'Lowest point of the orbit (perigee)',unit:'km',lvl:'ap',min:0,max:null,d:0,mode:'rocket',env:'earth',get:sim=>{const s=sim.st;if(s.mode!=='rocket'||!s.air)return NaN;const q=perigee(s);return Number.isFinite(q)?Math.max(-RE,q)/1000:NaN;}},
    {id:'gloss',label:'Δv lost to gravity',unit:'m/s',lvl:'ap',min:0,max:null,d:0,mode:'rocket',env:'earth',get:sim=>sim.st.mode==='rocket'?sim.st.gl:0},
    {id:'dloss',label:'Δv lost to drag',unit:'m/s',lvl:'ap',min:0,max:null,d:0,mode:'rocket',env:'earth',get:sim=>sim.st.mode==='rocket'?sim.st.dl:0},
    {id:'altb',label:'Altitude',unit:'m',lvl:'bio',min:0,max:null,d:1,mode:'bottle',get:sim=>sim.st.mode==='bottle'?sim.st.h:0},
    {id:'vb',label:'Velocity (up is +)',unit:'m/s',lvl:'bio',min:-30,max:null,d:1,mode:'bottle',get:sim=>sim.st.mode==='bottle'?(Math.abs(sim.st.v)<0.05?0:sim.st.v):0},
    {id:'maxb',label:'Highest point',unit:'m',lvl:'bio',min:0,max:null,d:1,mode:'bottle',get:sim=>sim.st.mode==='bottle'?sim.st.maxh:0},
    {id:'water',label:'Water left',unit:'L',lvl:'bio',min:0,max:2,d:2,mode:'bottle',get:sim=>sim.st.mode==='bottle'?sim.st.Vw*1000:0},
    {id:'thrustb',label:'Thrust',unit:'N',lvl:'honors',min:0,max:null,d:0,mode:'bottle',get:sim=>sim.st.mode==='bottle'?sim.st.thrust:0},
    {id:'pressb',label:'Air pressure (gauge)',unit:'psi',lvl:'honors',min:0,max:null,d:0,mode:'bottle',get:sim=>sim.st.mode==='bottle'?Math.max(0,(sim.st.P-PA)/PSI):0},
    {id:'vmaxb',label:'Top speed',unit:'m/s',lvl:'ap',min:0,max:null,d:1,mode:'bottle',get:sim=>sim.st.mode==='bottle'?sim.st.vmax:0},
    {id:'status',label:'Mission',lvl:'bio',text:true,get:sim=>{const s=sim.st;if(s.mode==='bottle')return s.t<LAUNCH_B?'On the pad':s.done?'Landed after reaching '+s.maxh.toFixed(1)+' m':s.thrust>0?'Thrusting':'Coasting';
      if(s.t<LAUNCH_R)return 'Countdown';if(s.done)return s.why==='orbit'?'In orbit':s.why==='pad'?'Too heavy to lift off':s.why==='crash'?'Crashed':s.why==='sub'?'Suborbital: it will fall back':'Engine off, coasting at '+Math.round(s.vx)+' m/s';
      return s.thrust>0?'Burning stage '+(s.si+1):'Coasting';}}
  ],
  graphs:null,
  defaultGraph:'gv',
  narrate(sim){const s=sim.st,p=sim.p,hon=atLeast('honors');
    if(s.mode==='bottle'){if(s.t<LAUNCH_B)return '<b>Pressurized.</b> The pump squeezed the air to '+p.psi+' psi above the outside air. That squeezed air will push the water out of the nozzle.';
      if(s.thrust>0)return '<b>Thrust.</b> The air shoves water out the bottom at '+s.u.toFixed(0)+' m/s. Pushing the water down pushes the bottle up, so the bottle gains upward momentum.'+(hon?' Thrust = ṁu = '+s.thrust.toFixed(0)+' N.':'');
      if(!s.done){const msg=s.v>0?'<b>Coasting up.</b> The water is gone, so there is no more thrust. Gravity and air drag slow the bottle down.':'<b>Falling.</b> At the top the bottle stopped for an instant; now gravity pulls it back down.';
        return msg+(p.water>1.2?' A full bottle has little room for air, so the push ends quickly while the rocket is still heavy.':p.water<0.3?' With so little water there was little mass to throw, so the push was short.':'');}
      return '<b>Landed.</b> Highest point: '+s.maxh.toFixed(1)+' m. '+(p.water>1.2?'Too much water: the small pocket of air lost its pressure before the water was out, so the bottle carried dead weight.':p.water<0.3?'Too little water: the air was strong but there was little mass to throw backward.':'About a third of a bottle of water balances mass to throw against air to push it.');}
    if(s.t<LAUNCH_R)return '<b>Countdown.</b> The rocket is at rest, so its momentum is zero. To move, it must throw mass (exhaust) the other way.';
    if(s.done&&s.why==='pad')return '<b>Too heavy to lift off.</b> The engine’s thrust ('+Math.round(s.st[0].mdot*p.ve/1000)+' kN) is less than the rocket’s weight ('+Math.round(s.m0*G0/1000)+' kN). Use less fuel or a higher burn rate.';
    if(!s.earth){if(s.thrust>0){let m='<b>Burning.</b> The engine throws exhaust backward at '+Math.round(p.ve)+' m/s. The exhaust gets backward momentum, so the rocket gets equal forward momentum: the total stays zero.';
        if(s.msg==='sep'&&s.t-LAUNCH_R-s.sepT<15)m='<b>Staging.</b> The empty first-stage tank is dropped, so the small second stage only has to speed up the mass that is left.';
        else if(hon)m+=' The rocket is now '+(rMass(s)/1000).toFixed(0)+' t, so each tonne burned gives more speed than at liftoff.';return m;}
      const id=idealDv(p,s.st0).dv;return '<b>Engine off.</b> With nothing pushing, the rocket coasts at '+Math.round(s.vx)+' m/s forever. '+(hon?'That matches the rocket equation: '+kms(id)+'.':'Faster exhaust, not just more fuel, is the best way to go faster.');}
    if(s.done)return s.why==='orbit'?'<b>Orbit reached!</b> The rocket is moving sideways fast enough ('+kms(Math.hypot(s.vx,s.vy))+') that it falls around the Earth instead of back to it. It lost '+Math.round(s.gl+s.dl)+' m/s to gravity and drag on the way.':
      '<b>Not enough Δv.</b> The rocket climbed to '+Math.round(s.maxh/1000)+' km but is only moving '+kms(Math.hypot(s.vx,s.vy))+' sideways, short of the 7.8 km/s orbit needs, so it will fall back. Gravity and drag took '+Math.round(s.gl+s.dl)+' m/s.';
    if(s.thrust>0)return '<b>Climbing.</b> The rocket rises straight up, then tips over to build sideways speed. While it climbs, gravity steals Δv every second ('+Math.round(s.gl)+' m/s so far).';
    return '<b>Coasting.</b> The engines are off; gravity is slowing the climb.';},
  tour:[
    {title:'A rocket in empty space',text:'This rocket sits in deep space with no ground or air to push on. Its momentum is zero. The orange part of each tank is fuel.',focus:[8,8,540,292],pause:true,
      setup(sim){BioLab.setValues(sim,{mode:'rocket',env:'space',stages:1,ve:3000,fuel:100,mdot:600});restart(sim);}},
    {title:'Throwing mass backward',text:'The engine throws exhaust backward at 3,000 m/s. Pushing the exhaust back pushes the rocket forward: equal and opposite forces, just like the spring explosion in the Collisions lab.',focus:[8,8,540,292],speed:0.15},
    {title:'Momentum bookkeeping',text:'The rocket’s forward momentum always equals the exhaust’s backward momentum, so the total stays at zero. Momentum is conserved, even for a rocket.',focus:[8,308,784,134],speed:0.5},
    {title:'Getting lighter',text:'As fuel burns, the rocket gets lighter, so each kilogram of exhaust speeds it up more. Watch the orange fuel bar shrink.',focus:[556,8,236,292],speed:1},
    {title:'Engine off',text:'When the fuel is gone, nothing pushes. In space there is no friction, so the rocket coasts at constant speed.',focus:[8,8,540,292],speed:1},
    {title:'A water bottle rocket',text:'Same physics on a field: compressed air shoves water out of the nozzle, and the bottle goes up. The whole push lasts less than a tenth of a second, so it is slowed down here.',focus:[8,8,462,434],speed:0.06,
      setup(sim){BioLab.setValues(sim,{mode:'bottle',psi:60,water:0.6});restart(sim);}},
    {lvl:'honors',title:'Staging',text:'Two stages carry the same fuel, but the first stage’s empty tanks are dropped halfway. The second stage then only speeds up a small rocket, so the total Δv rises from 6.5 to 8.1 km/s.',focus:[8,8,784,434],speed:1,
      setup(sim){BioLab.setValues(sim,{mode:'rocket',env:'space',stages:2,ve:3000,fuel:100,mdot:600});restart(sim);}},
    {lvl:'ap',title:'Going to orbit',text:'From Earth the rocket also fights gravity and drag. It needs about 9.4 km/s of Δv in all. With 4,500 m/s exhaust and two stages, it has enough: watch the Δv budget.',focus:[8,8,784,434],speed:1,
      setup(sim){BioLab.setValues(sim,{mode:'rocket',env:'earth',stages:2,ve:4500,fuel:100,mdot:600});restart(sim);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'rocket',env:'space',stages:1,ve:3000,fuel:100,mdot:600,psi:60,water:0.6});restart(sim);},
  challenges:[
    {lvl:'bio',q:'In empty space there is nothing for the rocket to push against. When the engine fires, does the rocket speed up?',choices:['No, it needs air or ground to push on','Yes, by pushing its exhaust backward'],correct:1,
     baseline:{mode:'rocket',env:'space',stages:1,ve:3000,fuel:100,mdot:600},changeText:'Engine ignition',watch:'gv',at:0,reveal:60,
     explain:'The rocket pushes the exhaust backward and the exhaust pushes the rocket forward. Rocket and exhaust together still have zero total momentum, so no air or ground is needed.'},
    {lvl:'bio',q:'With 2,000 m/s exhaust, this rocket reaches 4.3 km/s. Now the exhaust leaves at 4,000 m/s with the same fuel. Its final speed?',choices:['About the same','About double, 8.6 km/s','About four times, 17 km/s'],correct:1,
     baseline:{mode:'rocket',env:'space',stages:1,ve:4000,fuel:100,mdot:600},changeText:'Engine ignition',watch:'gv',at:0,reveal:180,
     explain:'Final speed is proportional to exhaust speed: Δv = vₑ ln(m₀/m_f). Doubling vₑ doubles Δv. That is why engineers chase faster exhaust.'},
    {lvl:'bio',q:'A water rocket at 60 psi with 0.6 L of water rises about 38 m. Fill it almost full, 1.6 L. How high now?',choices:['Higher, because there is more water to throw','About the same','Much lower'],correct:2,
     baseline:{mode:'bottle',psi:60,water:1.6},changeText:'Launched',watch:'bh',at:0,reveal:4,
     explain:'With 1.6 L of water there is only 0.4 L of compressed air. It loses its pressure long before the water is gone, so the push is weak and the bottle hauls dead water. About a third of a bottle works best.'},
    {lvl:'honors',q:'One stage, 3,000 m/s exhaust: 100 t of fuel gives 6.5 km/s. Double the fuel to 200 t. What happens to Δv?',choices:['It doubles to about 13 km/s','It rises a little, to about 7 km/s','It drops'],correct:1,
     baseline:{mode:'rocket',env:'space',stages:1,ve:3000,fuel:200,mdot:1200},changeText:'Engine ignition',watch:'gv',at:0,reveal:180,
     explain:'Extra fuel has to be carried, and so do the bigger tanks. Δv depends on the logarithm of m₀/m_f: going from 113/13 to 221/21 only raises Δv from 6.5 to 7.1 km/s. Diminishing returns.'},
    {lvl:'honors',q:'Split the same 100 t of fuel into two stages (75 t, then 25 t) and drop the empty first stage. Compared with one stage (6.5 km/s)?',choices:['Less Δv, because of the extra engine','About the same','More Δv'],correct:2,
     baseline:{mode:'rocket',env:'space',stages:2,ve:3000,fuel:100,mdot:600},changeText:'Engine ignition',watch:'gv',at:0,reveal:300,
     explain:'Dropping 9 t of empty tank means the second stage only accelerates 31 t, not 40 t. The total climbs to about 8.1 km/s. Staging is why real orbital rockets have two or three stages.'},
    {lvl:'honors',q:'Bottle rocket, 0.6 L of water. Raise the launch pressure from 60 psi to 90 psi. What happens?',choices:['It goes higher','It goes the same height','It goes lower'],correct:0,
     baseline:{mode:'bottle',psi:90,water:0.6},changeText:'Launched',watch:'bh',at:0,reveal:4.4,
     explain:'Higher pressure pushes the water out faster. Thrust = 2A(P − Pₐ), so the bottle gets more impulse from the same water and climbs to about 46 m instead of 38 m.'},
    {lvl:'ap',q:'In deep space, double the burn rate (1,200 kg/s instead of 600 kg/s) with the same fuel and exhaust speed. The final speed?',choices:['Doubles','Stays the same, it just gets there sooner','Halves'],correct:1,
     baseline:{mode:'rocket',env:'space',stages:1,ve:3000,fuel:100,mdot:1200},changeText:'Engine ignition',watch:'ga',at:0,reveal:110,
     explain:'Thrust doubles, but the fuel lasts half as long. Δv = vₑ ln(m₀/m_f) has no burn rate in it: 6.5 km/s either way. With gravity, though, burning fast does matter, because less time climbing means less gravity loss.'},
    {lvl:'ap',q:'Two stages, 100 t of fuel, 4,500 m/s exhaust: the rocket equation gives 12.1 km/s. Launched from Earth, does it reach orbit?',choices:['Yes','No, gravity and drag take too much'],correct:0,
     baseline:{mode:'rocket',env:'earth',stages:2,ve:4500,fuel:100,mdot:600},changeText:'Liftoff',watch:'gh',at:0,reveal:300,
     explain:'Orbit needs about 7.8 km/s sideways, plus roughly 1.3 km/s lost to gravity and 0.1 km/s to drag on the way up. 12.1 km/s covers that with room to spare.'},
    {lvl:'ap',q:'The same two-stage rocket with 3,000 m/s exhaust has 8.1 km/s of Δv, more than the 7.8 km/s orbital speed. Does it reach orbit?',choices:['Yes, 8.1 is more than 7.8','No'],correct:1,
     baseline:{mode:'rocket',env:'earth',stages:2,ve:3000,fuel:100,mdot:600},changeText:'Liftoff',watch:'gh',at:0,reveal:420,
     explain:'About 1.4 km/s goes to fighting gravity and drag during the climb, so it arrives at about 6.7 km/s sideways and falls back. A real launch budget is about 9.4 km/s.'},
    {lvl:'ap',instant:true,q:'A rocket with 3 km/s exhaust has a mass ratio m₀/m_f = 4. What Δv can it reach in deep space?',choices:['About 4.2 km/s','About 9 km/s','About 12 km/s'],correct:0,
     explain:'Δv = vₑ ln(m₀/m_f) = 3 × ln 4 = 3 × 1.39 ≈ 4.2 km/s. Not 12: the speed grows with the logarithm of the mass ratio, not the ratio itself.'}
  ],
  lab:{bio:'<p><b>Question:</b> What is the best amount of water for a bottle rocket?</p><ol><li>Choose the water bottle rocket at 60 psi.</li><li>Launch with 0.2, 0.4, 0.6, 0.8, 1.0, 1.2 and 1.6 L of water. After each flight lands, press <b>Record trial</b>.</li><li>Graph water (x) against highest point (y).</li></ol><p>Where is the peak? Explain why both too little and too much water give a low flight.</p>',
       honors:'<p><b>Question:</b> Which raises a rocket’s Δv more: more fuel or faster exhaust?</p><ol><li>Deep space, one stage. Record the rocket-equation Δv for fuel = 50, 100, 200 and 300 t at 3,000 m/s.</li><li>Then fix fuel at 100 t and record Δv for exhaust speeds 1,500, 3,000 and 4,500 m/s.</li><li>Repeat a few with two stages.</li></ol><p>Use Δv = vₑ ln(m₀/m_f) to explain both patterns.</p>',
       ap:'<p><b>Question:</b> How much Δv does a launch from Earth really need?</p><ol><li>Launch from Earth, two stages, 100 t fuel. Find the lowest exhaust speed that reaches orbit.</li><li>For each run, record Δv lost to gravity and drag.</li><li>Change the burn rate (400, 600, 1,000 kg/s) and record how gravity loss changes.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why a rocket with more Δv than orbital speed can still fail, and why higher thrust reduces gravity loss.</p>'},
  terms:[{t:'Momentum',d:'Mass times velocity. A rocket and its exhaust always have equal and opposite momentum changes.'},{t:'Thrust',d:'The forward push on a rocket from throwing exhaust backward.'},
    {t:'Exhaust speed (vₑ)',d:'How fast the gas leaves the engine, relative to the rocket.'},{t:'Payload',d:'The useful cargo, such as a satellite.'},
    {lvl:'honors',t:'Rocket equation',d:'Δv = vₑ ln(m₀/m_f): the speed a rocket can gain from its exhaust speed and its full and empty masses.'},
    {lvl:'honors',t:'Mass ratio',d:'Full mass ÷ empty mass, m₀/m_f.'},{lvl:'honors',t:'Staging',d:'Dropping empty tanks and engines during the flight so the rest of the rocket is lighter.'},
    {lvl:'ap',t:'Gravity loss',d:'The Δv spent holding the rocket up against gravity while it climbs: ∫g sinγ dt.'},{lvl:'ap',t:'Perigee',d:'The lowest point of an orbit. Above about 120 km, the orbit clears the atmosphere.'},
    {lvl:'ap',t:'Variable-mass system',d:'A system that loses mass as it moves; Newton’s second law must include the momentum carried off by the exhaust.'}],
  about:'<p><b>Big rocket.</b> Each time step burns a small mass b, which leaves at speed vₑ relative to the rocket. Momentum conservation gives a speed gain of vₑ·ln(m/(m − b)); summing these is the rocket equation Δv = vₑ ln(m₀/m_f). The payload is 2 t, each stage adds 0.08 t of tank per tonne of fuel plus an engine (3 t, or 2 t for the upper stage), and two-stage rockets split the fuel 75/25. Thrust = burn rate × vₑ.</p><p><b>Launch from Earth.</b> Gravity follows the inverse-square law, drag is ½ρv²C<sub>d</sub>A with an exponential atmosphere (scale height 8.5 km), and the rocket follows a fixed pitch program from vertical to horizontal by 150 km. The model uses a flat downrange frame with the centrifugal term v<sub>x</sub>²/(R + h), and calls it an orbit when the perigee (from energy and angular momentum) is above 120 km. Real launches steer more cleverly and lose a little less.</p><p><b>Water rocket.</b> A 2 L bottle with a 22 mm nozzle and 100 g of plastic. The air expands adiabatically; water leaves at u = √(2(P − Pₐ)/ρ), so thrust = 2A<sub>n</sub>(P − Pₐ). Drag uses C<sub>d</sub> = 0.5. The short puff of air after the water is gone is ignored, so real rockets fly a little higher.</p>',
  initVis(sim){sim.vis.parts=[];sim.vis.drops=[];sim.vis.off=0;},
  draw(sim,ctx,vdt,k){const kk=Math.min(k,1.45),s=sim.st;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    if(s.mode==='bottle'){bottleScene(sim,ctx,kk,vdt);bottlePanel(sim,ctx,kk,478,8,314,434);return;}
    if(s.earth)earthScene(sim,ctx,kk);else spaceScene(sim,ctx,kk,vdt);
    massPanel(sim,ctx,Math.min(kk,1.2),556,8,236,292);
    if(s.earth)budgetPanel(sim,ctx,kk,8,308,784,134);else momentumPanel(sim,ctx,kk,8,308,784,134);},
  onLevel(sim){const e=sim.st&&sim.st.mode==='rocket'?sim.st.earth:null;applyMode(sim);syncUI(sim);if(e!==null&&e!==earth(sim))restart(sim);
    else if(sim.st&&sim.st.mode==='rocket'&&sim.st.st.length!==stages(sim.p).length)restart(sim);}
};
SIM.graphs=GR.rocket;
BioLab.register(SIM);
})();
