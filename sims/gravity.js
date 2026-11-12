(function(){
'use strict';
const {clamp,lerp,rr,txt,pill,atLeast,PAL,RM,axes}=BioLab.h;

/* Gravity and orbits.
   Newton's cannon: a ball is fired horizontally from the top of a tower at height h above Earth
   (GM = 3.986×10¹⁴ m³/s², R = 6371 km). Only gravity acts: a = −GM r̂ / r². Velocity-Verlet steps of ≤ 3 s.
   Circular speed v_c = √(GM/r); escape speed v_e = √(2GM/r). Specific energy E = v²/2 − GM/r;
   for E < 0 the orbit is an ellipse with a = −GM/(2E) and period T = 2π√(a³/GM) (Kepler's third law).
   Inverse-square law: F = GMm/r² for an object at r planet radii from the center of the Moon, Mars, Earth or Jupiter. */
const GME=3.986e14,RE=6.371e6;
const PLANETS={moon:{l:'Moon',M:0.0123,R:0.273,c:'#a9a9a9'},mars:{l:'Mars',M:0.107,R:0.532,c:'#c1440e'},earth:{l:'Earth',M:1,R:1,c:'#2f6db5'},jupiter:{l:'Jupiter',M:317.8,R:11.21,c:'#c9a27e'}};
const MODE_CTL={v0:['cannon'],h:['cannon'],planet:['force'],r:['force'],m:['force']};
const MODE_TILE={alt:['cannon'],spd:['cannon'],vc:['cannon'],ve:['cannon'],E:['cannon'],T:['cannon'],F:['force'],gh:['force'],Fp:['force'],wS:['force']};
const SPACE='#0c1320',SINK='#e8eef7',SSOFT='#9fb0c6';

function arrow(ctx,x,y,dx,dy,col,w){const L=Math.hypot(dx,dy);if(L<2)return;const head=Math.min(11,4+L*0.25),ux=dx/L,uy=dy/L;
  ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=w||3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+dx-ux*head*0.8,y+dy-uy*head*0.8);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+dx,y+dy);ctx.lineTo(x+dx-ux*head-uy*head*0.55,y+dy-uy*head+ux*head*0.55);ctx.lineTo(x+dx-ux*head+uy*head*0.55,y+dy-uy*head-ux*head*0.55);ctx.closePath();ctx.fill();}
const vcirc=r=>Math.sqrt(GME/r),vesc=r=>Math.sqrt(2*GME/r);
function elements(s){const r=Math.hypot(s.x,s.y),v2=s.vx*s.vx+s.vy*s.vy,E=v2/2-GME/r,h=s.x*s.vy-s.y*s.vx,e=Math.sqrt(Math.max(0,1+2*E*h*h/(GME*GME)));
  if(E>=0)return {E,e,a:Infinity,apo:Infinity,peri:h*h/GME/(1+e),T:NaN};const a=-GME/(2*E);return {E,e,a,apo:a*(1+e),peri:a*(1-e),T:2*Math.PI*Math.sqrt(a*a*a/GME)};}
function launch(s,p){s.x=0;s.y=RE+p.h*1000;s.vx=p.v0*1000;s.vy=0;s.v0=p.v0;s.h=p.h;s.done=null;s.ang=0;s.prevA=0;s.lastTrail=0;s.orbits=0;s.trail=[[s.x,s.y]];s.tt=0;s.land=0;s.el=elements(s);}
function syncMode(sim){const id=sim.def.id,m=sim.p.mode;
  for(const c of SIM.controls){const el=document.getElementById(id+'-'+c.id)||document.getElementById(id+'-'+c.id+'-l');if(!el)continue;const w=el.closest('.ctl');if(!w)continue;
    w.hidden=!atLeast(c.lvl)||(MODE_CTL[c.id]&&!MODE_CTL[c.id].includes(m));}
  for(const mt of SIM.metrics){const t=sim.ui.tiles&&sim.ui.tiles[mt.id];if(!t)continue;t.num.closest('.tile').hidden=!atLeast(mt.lvl)||(MODE_TILE[mt.id]&&!MODE_TILE[mt.id].includes(m));}
  if(sim.ui.ctrls)sim.ui.ctrls.querySelectorAll('.actions button').forEach(b=>{if(b.textContent==='Fire again')b.style.display=m==='cannon'?'':'none';});}
const pl=p=>PLANETS[p.planet]||PLANETS.earth;
const gAt=(p,r)=>9.82*pl(p).M/(r*r*pl(p).R*pl(p).R);   // N/kg at r planet radii

/* Step "Newton's cannon": a 400 km drop is only about 11 px at the full-Earth scale, so a zoomed circle at the right shows the
   tower and the ball falling, with a dot every 40 s (the gaps grow as it speeds up). It drops again 1.5 s after it lands. */
function zoomDrop(sim,ctx,LH,k){const p=sim.p,s=sim.st,sc=sim.vis.ppm;if(p.mode!=='cannon'||!sc)return;
  if(s.done==='crash'){if(!sim._zdT)sim._zdT=performance.now();else if(performance.now()-sim._zdT>1500){launch(s,p);sim._zdT=0;}}else sim._zdT=0;
  if(!sim._zd||s.tt<sim._zd.t)sim._zd={t:s.tt,pts:[[0,p.h*1000]],next:40};
  const alt=Math.max(0,Math.hypot(s.x,s.y)-RE);while(s.tt>=sim._zd.next&&!s.done){sim._zd.pts.push([sim._zd.next,alt]);sim._zd.next+=40;}sim._zd.t=s.tt;
  const cx=650,cy=300,R=100,gY=cy+72,kpx=140/Math.max(1,p.h*1000);
  // dashed link from the real tower top to the zoom circle
  const tx=300,ty=236-(RE+p.h*1000)*sc;ctx.save();ctx.setLineDash([4,5]);ctx.strokeStyle='rgba(255,255,255,.45)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(tx+8,ty);ctx.lineTo(cx-R*0.9,cy-R*0.45);ctx.stroke();ctx.restore();
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,R,0,6.29);ctx.fillStyle=SPACE;ctx.fill();ctx.clip();
  ctx.fillStyle='rgba(120,180,255,.25)';ctx.fillRect(cx-R,gY-14,2*R,14);
  ctx.fillStyle='#3f8a4a';ctx.fillRect(cx-R,gY,2*R,R);
  const topY=gY-p.h*1000*kpx;ctx.fillStyle='#d8c3a0';ctx.beginPath();ctx.moveTo(cx-20,gY+1);ctx.lineTo(cx-10,topY);ctx.lineTo(cx,gY+1);ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx-36,topY);ctx.lineTo(cx-36,gY);ctx.moveTo(cx-40,topY);ctx.lineTo(cx-32,topY);ctx.moveTo(cx-40,gY);ctx.lineTo(cx-32,gY);ctx.stroke();
  txt(ctx,Math.round(p.h)+' km',cx-42,(topY+gY)/2+4,{s:11*k,w:700,c:SINK,a:'right'});
  const bx=cx+18;sim._zd.pts.forEach(([t,a])=>{ctx.fillStyle='rgba(255,179,71,.45)';ctx.beginPath();ctx.arc(bx,gY-a*kpx,4,0,6.29);ctx.fill();});
  const by=gY-alt*kpx-(s.done?6:0);if(!s.done)arrow(ctx,bx+16,by,0,26,'#ff6b6b',3);
  ctx.fillStyle='#ffb347';ctx.beginPath();ctx.arc(bx,by,7,0,6.29);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke();
  ctx.restore();ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,R,0,6.29);ctx.stroke();
  pill(ctx,'Zoomed in',cx,cy-R-2,'#33415a','#fff',11*k);
  txt(ctx,'dot every 40 s',cx+R*0.05,cy+R+16*k,{s:11*k,w:600,c:SSOFT,a:'center'});}

const SIM={
  id:'gravity',hash:'gravity',apUnit:2,order:6,tab:'Gravity and orbits',kind:'Simulation',
  card:'Fire Newton’s cannon until the ball falls, orbits or escapes, test the inverse-square law, pull two masses together and see how the Moon raises tides.',
  title:'Gravity and orbits',
  lede:{bio:'Fire a cannonball sideways from a very tall tower. Too slow and it falls back. Fast enough and it falls around the Earth forever.',
        honors:'An orbit is free fall. Compare the launch speed with the circular speed √(GM/r), and see how gravity weakens with the square of the distance.',
        ap:'Track the specific orbital energy and Kepler’s third law. A negative total energy means a closed ellipse; zero or positive means escape.'},
  scale:{bio:'Earth is 12,742 km across. The tower is 400 km tall, the height of the International Space Station.',honors:'Earth’s radius is 6371 km. The tower height is drawn to scale; at 400 km you are only 6% farther from Earth’s center than on the ground.'},
  timeScale:10,dtMax:0.05,prewarm:0,sampleDt:0.5,window:150,unit:'min',chChange:10,chReveal:100,
  controls:[
    {id:'mode',label:'Set-up',type:'seg',def:'cannon',lvl:'bio',options:[{v:'cannon',l:'Newton’s cannon'},{v:'force',l:'Inverse-square law'}],
     onChange(sim){syncMode(sim);}},
    {id:'v0',label:'Launch speed',type:'range',min:0,max:12,step:0.1,def:7.7,unit:' km/s',d:1,lvl:'bio',help:'Fired sideways. A fast jet flies about 0.3 km/s.'},
    {id:'h',label:'Tower height',type:'range',min:100,max:3000,step:50,def:400,unit:' km',lvl:'honors'},
    {id:'planet',label:'World',type:'select',def:'earth',lvl:'bio',options:[{v:'moon',l:'Moon'},{v:'mars',l:'Mars'},{v:'earth',l:'Earth'},{v:'jupiter',l:'Jupiter'}]},
    {id:'r',label:'Distance from the center',type:'range',min:1,max:5,step:0.1,def:1,unit:' radii',d:1,lvl:'bio',help:'1 radius = standing on the surface.'},
    {id:'m',label:'Object’s mass',type:'range',min:1,max:100,step:1,def:10,unit:' kg',lvl:'bio'}
  ],
  actions:[{id:'fire',label:'Fire again',lvl:'bio',primary:true,run(sim){launch(sim.st,sim.p);}}],
  init(sim){const s={};launch(s,sim.p);return s;},
  step(sim,dt){const p=sim.p,s=sim.st;
    if(p.v0!==s.v0||p.h!==s.h)launch(s,p);
    if(p.mode!=='cannon'||s.done)return;
    let rem=dt*60;while(rem>1e-9){const h=Math.min(3,rem);rem-=h;
      let r=Math.hypot(s.x,s.y),k=-GME/(r*r*r);const ax=k*s.x,ay=k*s.y;
      s.x+=s.vx*h+0.5*ax*h*h;s.y+=s.vy*h+0.5*ay*h*h;r=Math.hypot(s.x,s.y);k=-GME/(r*r*r);
      s.vx+=0.5*(ax+k*s.x)*h;s.vy+=0.5*(ay+k*s.y)*h;s.tt+=h;
      const a=Math.atan2(s.x,s.y);let da=a-s.prevA;if(s.prevA===undefined)da=0;if(da<-Math.PI)da+=2*Math.PI;if(da>Math.PI)da-=2*Math.PI;s.prevA=a;s.ang+=da;
      if(Math.abs(s.ang)>=2*Math.PI*(s.orbits+1))s.orbits++;
      if(r<=RE){const f=RE/r;s.x*=f;s.y*=f;s.done='crash';s.land=RE*Math.abs(s.ang);s.vx=0;s.vy=0;break;}
      if(r>14*RE&&s.el.E>=0){s.done='escape';break;}}
    if(s.tt-(s.lastTrail||0)>=20||s.done){s.trail.push([s.x,s.y]);s.lastTrail=s.tt;if(s.trail.length>900)s.trail.splice(1,1);}},
  metrics:[
    {id:'alt',label:'Height above ground',unit:'km',lvl:'bio',d:0,max:null,get:s=>Math.max(0,(Math.hypot(s.st.x,s.st.y)-RE)/1000)},
    {id:'spd',label:'Speed',unit:'km/s',lvl:'bio',d:2,max:null,get:s=>Math.hypot(s.st.vx,s.st.vy)/1000},
    {id:'vc',label:'Circular speed at launch height',unit:'km/s',lvl:'honors',d:2,get:s=>vcirc(RE+s.p.h*1000)/1000},
    {id:'ve',label:'Escape speed at launch height',unit:'km/s',lvl:'ap',d:2,get:s=>vesc(RE+s.p.h*1000)/1000},
    {id:'E',label:'Total energy per kg',unit:'MJ/kg',lvl:'ap',d:2,get:s=>s.st.el.E/1e6},
    {id:'T',label:'Orbit period',unit:'min',lvl:'ap',d:1,get:s=>{const e=s.st.el;return (isFinite(e.T)&&e.peri>RE)?e.T/60:NaN;}},
    {id:'F',label:'Pull of gravity on the object',unit:'N',lvl:'bio',d:1,max:null,get:s=>s.p.m*gAt(s.p,s.p.r)},
    {id:'gh',label:'Gravity strength g here',unit:'N/kg',lvl:'bio',d:2,get:s=>gAt(s.p,s.p.r)},
    {id:'Fp',label:'Pull of the object on the planet',unit:'N',lvl:'honors',d:1,get:s=>s.p.m*gAt(s.p,s.p.r)},
    {id:'wS',label:'Weight on the surface',unit:'N',lvl:'honors',d:1,get:s=>s.p.m*gAt(s.p,1)}
  ],
  graphs:[{id:'alt',label:'Height',lines:['alt']},{id:'spd',label:'Speed',lines:['spd']},{id:'gr',label:'Gravity vs. distance',custom:true},{id:'E',label:'Energy',lvl:'ap',lines:['E']}],
  defaultGraph:'alt',
  plot(sim,ctx,box,id){const p=sim.p,cannon=p.mode==='cannon',P=cannon?PLANETS.earth:pl(p),g0=9.82*P.M/(P.R*P.R);
    const ax=axes(ctx,box,{xmin:1,xmax:5,ymin:0,ymax:g0*1.05,xl:'Distance from '+P.l+'’s center (radii)',yl:'g (N/kg)'});
    ctx.strokeStyle=PAL['s2'];ctx.lineWidth=2.5;ctx.beginPath();for(let i=0;i<=80;i++){const r=1+i*0.05;const y=g0/(r*r);i?ctx.lineTo(ax.X(r),ax.Y(y)):ctx.moveTo(ax.X(r),ax.Y(y));}ctx.stroke();
    const rr_=cannon?Math.hypot(sim.st.x,sim.st.y)/RE:p.r;if(rr_<=5){const gx=g0/(rr_*rr_);ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.arc(ax.X(rr_),ax.Y(gx),6,0,6.29);ctx.fill();
      txt(ctx,gx.toFixed(2)+' N/kg',ax.X(rr_)+10,ax.Y(gx)-8,{s:13,c:PAL['cv-ink'],w:700});}
    for(const r of [2,3]){txt(ctx,'1/'+(r*r),ax.X(r),ax.Y(g0/(r*r))-10,{s:12,a:'center',c:PAL['cv-soft']});}},
  onLevel(sim){syncMode(sim);},
  onChallenge(sim){syncMode(sim);},
  challenges:[
    {lvl:'bio',q:'A ball fired at 5 km/s falls back to Earth. You raise the speed to 7.7 km/s. What happens?',
     choices:['It lands farther away','It falls all the way around Earth and comes back to the tower','It flies off into space'],correct:1,
     baseline:{mode:'cannon',v0:5,h:400},change:{v0:7.7},changeText:'Launch speed 7.7 km/s',watch:'alt',at:10,reveal:110,
     explain:{bio:'At 7.7 km/s the ground curves away beneath the ball exactly as fast as the ball falls toward it. It keeps falling but never lands: that is an orbit. One lap takes about 92 minutes.',
              honors:'7.7 km/s matches the circular speed √(GM/r) at 400 km, so gravity supplies exactly the centripetal force for a circle.'}},
    {lvl:'bio',q:'An object on Earth’s surface is moved to twice as far from Earth’s center. How strong is gravity’s pull now?',
     choices:['Half as strong','One-quarter as strong','Just as strong'],correct:1,
     baseline:{mode:'force',planet:'earth',r:1,m:10},change:{r:2},changeText:'Moved to 2 radii from the center',watch:'F',at:10,reveal:40,
     explain:{bio:'Gravity weakens with the square of the distance. Twice as far means 2 × 2 = 4 times weaker: 98 N becomes 24.6 N.'}},
    {lvl:'bio',instant:true,q:'Astronauts on the space station float. Why?',
     choices:['There is no gravity in space','They and the station are falling around Earth together','They are too far from Earth to feel gravity'],correct:1,
     explain:{bio:'At 400 km gravity is still 89% as strong as on the ground. The station and everyone inside are falling together, like the cannonball, so nothing presses them against the floor.'}},
    {lvl:'honors',q:'A ball orbits at 7.7 km/s from a 400 km tower. The tower is raised to 2000 km; the speed stays 7.7 km/s. What happens?',
     choices:['It falls back to Earth','It goes into a wider, egg-shaped orbit','It escapes Earth'],correct:1,
     baseline:{mode:'cannon',v0:7.7,h:400},change:{h:2000},changeText:'Tower raised to 2000 km',watch:'alt',at:10,reveal:160,
     explain:{honors:'Gravity is weaker at 2000 km, so the circular speed there is only 6.90 km/s. 7.7 km/s is faster than that, so the ball swings out into an ellipse. It is still below the 9.76 km/s escape speed, so it comes back around.'}},
    {lvl:'honors',q:'A 10 kg object sits on the surface of Earth. You move it to the surface of Mars (0.107 Earth masses, 0.532 Earth radii). What is its weight now?',
     choices:['10.5 N, about 0.1 of Earth weight','About 37 N','98 N, the same','About 184 N'],correct:1,
     baseline:{mode:'force',planet:'earth',r:1,m:10},change:{planet:'mars'},changeText:'Moved to Mars',watch:'F',at:10,reveal:40,
     explain:{honors:'g = GM/R² scales as M/R²: 0.107 ÷ 0.532² = 0.38 of Earth’s. So the weight is 0.38 × 98 N = 37 N. Mars is light, but it is also small, so you are close to its center.'}},
    {lvl:'honors',q:'An object hangs at 2 Earth radii from Earth’s center. Earth pulls it with 24.6 N. How hard does the object pull on Earth?',
     choices:['Almost nothing; Earth is huge','24.6 N','More than 24.6 N'],correct:1,instant:true,
     explain:{honors:'Newton’s third law: the forces are equal and opposite, 24.6 N each. Earth hardly accelerates because its mass is enormous, not because the force on it is small.'}},
    {lvl:'ap',q:'From a 400 km tower, the launch speed is raised from 7.7 to 10.0 km/s (escape speed there is 10.85 km/s). Predict the total energy per kg.',
     choices:['Positive: the ball escapes','Negative: the ball is still bound and returns','Zero: it just barely escapes'],correct:1,
     baseline:{mode:'cannon',v0:7.7,h:400},change:{v0:10},changeText:'Launch speed 10.0 km/s',watch:'E',at:10,reveal:60,
     explain:{ap:'E = v²/2 − GM/r = 50.0 − 58.9 = −8.9 MJ/kg. Negative energy means a closed ellipse with a = GM/(2|E|) ≈ 22,500 km. It climbs to about 38,000 km and returns after about 9.3 hours.'}},
    {lvl:'ap',instant:true,q:'Satellite B’s circular orbit has 4 times the radius of satellite A’s. How do their periods compare?',
     choices:['T_B = 4 T_A','T_B = 8 T_A','T_B = 16 T_A','T_B = 2 T_A'],correct:1,
     explain:{ap:'Kepler’s third law: T² ∝ r³. So T ∝ r^(3/2) = 4^(1.5) = 8.'}},
    {lvl:'ap',instant:true,q:'A satellite in a circular orbit drops to a lower circular orbit. What happens to its speed and total energy?',
     choices:['Speed down, energy up','Speed up, energy down','Both go up','Both go down'],correct:1,
     explain:{ap:'v = √(GM/r) grows as r shrinks, so it moves faster. Total energy E = −GM m/(2r) becomes more negative. Kinetic energy rises by half as much as potential energy falls; the rest is lost to drag or thrusters.'}}
  ],
  narrate(sim){const p=sim.p,s=sim.st,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode==='force'){const P=pl(p),g=gAt(p,p.r),F=p.m*g;
      const base='On '+P.l+', a '+p.m+' kg object '+(p.r===1?'on the surface':p.r.toFixed(1)+' radii from the center')+' is pulled with <b>'+F.toFixed(1)+' N</b>';
      if(p.r===1)return base+'. Move it farther out: double the distance and the pull drops to one-quarter.';
      return base+', which is 1/'+(p.r*p.r).toFixed(p.r%1?2:0)+' of its surface weight ('+(p.m*gAt(p,1)).toFixed(1)+' N). Gravity spreads out over a sphere whose area grows as r², so it weakens as 1/r². The object pulls '+P.l+' just as hard, '+F.toFixed(1)+' N.';}
    const r0=RE+p.h*1000,vc=vcirc(r0)/1000,ve=vesc(r0)/1000;
    if(s.done==='crash')return p.v0<0.05?'Dropped straight down: gravity pulls the ball toward Earth’s center.':'<b>It landed '+Math.round(s.land/1000).toLocaleString()+' km away.</b> Faster launches land farther, because Earth’s surface curves away beneath the ball. At '+vc.toFixed(1)+' km/s it would never land.';
    if(s.done==='escape')return '<b>It escaped.</b> At or above '+ve.toFixed(1)+' km/s the ball has enough energy to coast away forever, slowing but never coming back.';
    if(p.v0>=ve)return 'Launched at '+p.v0.toFixed(1)+' km/s, above the escape speed ('+ve.toFixed(1)+' km/s). Gravity slows the ball as it climbs but can never turn it around.'+(ap?' Total energy is positive.':'');
    if(Math.abs(p.v0-vc)<0.12)return '<b>Orbit!</b> The ball is always falling toward Earth, but it moves sideways fast enough ('+vc.toFixed(1)+' km/s) that the ground curves away just as fast. '+(s.orbits?'Laps completed: '+s.orbits+'.':'');
    if(p.v0>vc){return 'Faster than circular speed ('+vc.toFixed(1)+' km/s), so the ball swings out into an ellipse, slowing as it climbs and speeding up as it falls back. '+(hon?'Below '+ve.toFixed(1)+' km/s it stays bound.':'')+(ap&&isFinite(s.el.T)?' Period '+(s.el.T/60).toFixed(0)+' min.':'');}
    if(s.el.peri>RE)return 'Slower than circular speed, so the ball falls inward into an ellipse, but it still misses Earth and comes back around.';
    return 'Too slow to orbit ('+p.v0.toFixed(1)+' km/s, but '+vc.toFixed(1)+' km/s is needed). The ball falls toward Earth faster than the surface curves away, so it will hit the ground.';},
  tour:[
    {title:'Newton’s cannon',text:'Isaac Newton imagined a cannon on a mountain so tall it sticks out of the air. With no launch speed, the ball just falls straight down.',
     focus:[[100,20,400,420],[540,180,220,250]],speed:0.25,overlay:zoomDrop,setup(sim){BioLab.setValues(sim,{mode:'cannon',v0:0,h:400});syncMode(sim);}},
    {title:'A slow shot',text:'At 3 km/s the ball curves and hits the ground a short distance away. Gravity bends its path toward Earth’s center the whole time.',
     focus:[100,20,400,420],speed:0.5,setup(sim){BioLab.setValues(sim,{v0:3});}},
    {title:'Faster: it lands farther',text:'At 6.5 km/s it lands much farther away, because the round Earth curves away beneath the falling ball.',
     focus:[100,20,400,420],speed:0.5,setup(sim){BioLab.setValues(sim,{v0:6.5});}},
    {title:'Fast enough to orbit',text:'At 7.7 km/s the ground curves away exactly as fast as the ball falls. It keeps falling and never lands. That is what an orbit is.',
     focus:[100,20,400,420],speed:0.6,setup(sim){BioLab.setValues(sim,{v0:7.7});}},
    {title:'Faster still: an ellipse',text:'At 9.5 km/s the ball swings far out, slows down at the top, then speeds back in. The path is an ellipse, and it still returns.',
     focus:[[100,20,400,420],[560,14,230,140]],speed:0.8,setup(sim){BioLab.setValues(sim,{v0:9.5});}},
    {title:'Escape',text:'At 11 km/s, above the 10.85 km/s escape speed, gravity slows the ball but can never turn it around. It leaves for good.',
     focus:[[100,20,400,420],[560,14,230,140]],speed:0.8,setup(sim){BioLab.setValues(sim,{v0:11});}},
    {title:'Gravity weakens with distance',text:'Switch to the inverse-square law. At 2 Earth radii from the center, the pull is 1/4 as strong; at 3 radii it is 1/9.',
     focus:[20,90,540,330],pause:true,setup(sim){BioLab.setValues(sim,{mode:'force',planet:'earth',r:2,m:10});syncMode(sim);}},
    {lvl:'honors',title:'Same law, other worlds',text:'On Jupiter, g at the cloud tops is about 25 N/kg: 318 times Earth’s mass, but 11 times the radius, so g = GM/R² is only 2.5 times Earth’s.',
     focus:[20,90,540,330],pause:true,setup(sim){BioLab.setValues(sim,{planet:'jupiter',r:1});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'cannon',v0:7.7,h:400,planet:'earth',r:1,m:10});syncMode(sim);},
  lab:{bio:'<p><b>Question:</b> How fast must the cannonball go to orbit instead of landing?</p><ol><li>Newton’s cannon. Fire at 1, 2, 3, 4, 5, 6 and 7 km/s.</li><li>After each shot lands, record a trial and note how far away it landed (in the caption).</li><li>Keep raising the speed by 0.1 km/s until the ball never lands.</li></ol><p>Write a claim about the speed needed to orbit, and explain in your own words why the ball doesn’t fall down.</p>',
       honors:'<p><b>Question:</b> How does gravity’s strength depend on distance from a planet’s center?</p><ol><li>Inverse-square law. Choose a world.</li><li>Record the pull F at r = 1, 1.5, 2, 2.5, 3, 4 and 5 radii.</li><li>Plot F against r, then plot F against 1/r².</li></ol><p>Which graph is a straight line? Use its slope to find GMm and check it against g at the surface.</p>',
       ap:'<p><b>Question:</b> Does the period of an orbit follow Kepler’s third law?</p><ol><li>Newton’s cannon. For tower heights 400, 1000, 1500, 2000 and 3000 km, set the launch speed to the circular speed shown in the tile.</li><li>Record the period T for each and the orbit radius r = R + h.</li><li>Plot T² against r³.</li></ol><p><b>Claim–evidence–reasoning:</b> Use your slope to find Earth’s mass, given G = 6.674×10⁻¹¹ N·m²/kg².</p>'},
  terms:[{t:'Gravity',d:'The attraction between any two masses. It gets weaker as they move apart.'},{t:'Orbit',d:'The path of an object that keeps falling around a planet without hitting it.'},{t:'Weight',d:'The pull of gravity on an object, in newtons: W = mg.'},
    {lvl:'honors',t:'Inverse-square law',d:'F = GMm/r². Doubling the distance between centers makes the force 4 times weaker.'},{lvl:'honors',t:'Circular orbital speed',d:'v = √(GM/r), the speed at which gravity is exactly the centripetal force for a circle.'},
    {lvl:'honors',t:'Gravitational field strength',d:'g = GM/r², in N/kg. It equals the free-fall acceleration in m/s².'},
    {lvl:'ap',t:'Escape speed',d:'v = √(2GM/r): the launch speed that gives zero total energy, so the object never returns.'},{lvl:'ap',t:'Kepler’s third law',d:'T² = (4π²/GM)·a³ for any orbit around the same central body.'},
    {lvl:'ap',t:'Specific orbital energy',d:'E/m = v²/2 − GM/r. Negative means bound (ellipse); zero or positive means escape.'}],
  about:'<p><b>Newton’s cannon:</b> the ball moves under Earth’s gravity alone, a = −GM r̂/r², with GM = 3.986×10¹⁴ m³/s² and R = 6371 km, integrated with velocity-Verlet steps of 3 s. There is no air drag and Earth does not rotate. The tower is imaginary: a real 400 km tower is impossible.</p><p><b>Inverse-square law:</b> g = 9.82 × (M/M_E)/(r·R/R_E)². Planet data: Moon 0.0123 M_E, 0.273 R_E; Mars 0.107, 0.532; Jupiter 317.8, 11.21 (Jupiter’s “surface” is its cloud tops). Planets are treated as uniform spheres.</p>',
  /* The opening question, drawn: three throws from the tower trace out one after another (falls back, goes around,
     leaves Earth), each with its speed hidden as "? km/s". It covers the speed-check panel, which would give the answer away. */
  hookOverlay(sim,ctx,LH,k,tau){const p=sim.p,sc=sim.vis.ppm;if(p.mode!=='cannon'||!sc)return;const CX=300,CY=236,r0=RE+p.h*1000;
    const key=p.h+':'+sc.toPrecision(3);
    if(!sim._hk||sim._hk.key!==key){
      const run=(v,tmax)=>{let x=0,y=r0,vx=v,vy=0;const pts=[[CX,CY-y*sc]],dt=10;
        for(let t=0;t<tmax;t+=dt){let r=Math.hypot(x,y),q=-GME/(r*r*r);const ax=q*x,ay=q*y;x+=vx*dt+0.5*ax*dt*dt;y+=vy*dt+0.5*ay*dt*dt;
          r=Math.hypot(x,y);q=-GME/(r*r*r);vx+=0.5*(ax+q*x)*dt;vy+=0.5*(ay+q*y)*dt;
          if(r<RE){pts.push([CX+x*RE/r*sc,CY-y*RE/r*sc]);pts.land=true;break;}
          const X=CX+x*sc,Y=CY-y*sc;pts.push([X,Y]);if(X<-20||X>820||Y<-20||Y>LH+20)break;}
        return pts;};
      const T=2*Math.PI*Math.sqrt(r0*r0*r0/GME);
      sim._hk={key,paths:[{pts:run(6000,4*3600),c:'#ffb347',l:'Falls back to the ground'},{pts:run(vcirc(r0),T+20),c:'#7cf0a0',l:'Goes all the way around'},{pts:run(11000,6*3600),c:'#ff8fa3',l:'Leaves Earth for good'}]};}
    const P=sim._hk.paths,DUR=2.2,GAP=0.5,CYC=P.length*(DUR+GAP)+2.5,tl=RM?CYC:tau%CYC;
    ctx.lineCap='round';ctx.lineJoin='round';
    P.forEach((pa,i)=>{const f=clamp((tl-i*(DUR+GAP))/DUR,0,1);pa.f=f;if(f<=0)return;const n=Math.max(1,Math.round(f*(pa.pts.length-1)));
      ctx.strokeStyle=pa.c;ctx.lineWidth=3;ctx.globalAlpha=f<1?1:0.85;ctx.beginPath();for(let j=0;j<=n;j++){const [X,Y]=pa.pts[j];j?ctx.lineTo(X,Y):ctx.moveTo(X,Y);}ctx.stroke();ctx.globalAlpha=1;
      const [hx,hy]=pa.pts[n];if(f<1){ctx.fillStyle=pa.c;ctx.beginPath();ctx.arc(hx,hy,7,0,6.29);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke();}
      else if(pa.pts.land){ctx.fillStyle=pa.c;ctx.beginPath();ctx.arc(hx,hy,5,0,6.29);ctx.fill();}});
    const X=560,Y=16,W=226,rowH=30*k,H=Math.max(14+118*k,40*k+P.length*rowH);
    rr(ctx,X,Y,W,H,10);ctx.fillStyle='rgb(16,26,42)';ctx.fill();ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=1;ctx.stroke();
    txt(ctx,'Three throws from the tower',X+12,Y+22*k,{s:12.5*k,w:700,c:SINK});
    P.forEach((pa,i)=>{const y=Y+34*k+i*rowH+rowH/2,on=pa.f>0,cur=pa.f>0&&pa.f<1;ctx.globalAlpha=on?1:0.35;
      ctx.strokeStyle=pa.c;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(X+12,y);ctx.lineTo(X+32,y);ctx.stroke();
      txt(ctx,pa.l,X+40,y-2*k,{s:11.5*k,w:cur?700:600,c:SINK,b:'middle'});txt(ctx,'? km/s',X+40,y+11*k,{s:11*k,w:700,c:pa.c,b:'middle'});ctx.globalAlpha=1;});},
  initVis(sim){sim.vis.ppm=0;},
  draw(sim,ctx,vdt,k,t){const p=sim.p;if(p.mode==='cannon')drawCannon(sim,ctx,vdt,k);else drawForce(sim,ctx,k);},
  thumbSetup(sim){BioLab.setValues(sim,{v0:9.5});}
};

function stars(ctx){for(let i=0;i<70;i++){const x=(i*137.5)%800,y=(i*91.3+i*i*3.1)%450;ctx.fillStyle='rgba(255,255,255,'+(0.25+(i%5)*0.12)+')';ctx.fillRect(x,y,1.6,1.6);}}

function drawCannon(sim,ctx,vdt,k){const p=sim.p,s=sim.st,CX=300,CY=236;
  ctx.fillStyle=SPACE;ctx.fillRect(0,0,800,450);stars(ctx);
  const r=Math.hypot(s.x,s.y),el=s.el;let ext=Math.max(1.16*RE,(RE+p.h*1000)*1.06);
  if(isFinite(el.apo)&&el.peri>0)ext=Math.max(ext,Math.min(el.apo,14*RE)*1.05);else if(!isFinite(el.apo))ext=Math.max(ext,Math.min(r,14*RE)*1.1,3*RE);
  const target=205/ext;sim.vis.ppm=sim.vis.ppm?(RM?target:lerp(sim.vis.ppm,target,Math.min(1,vdt*3+0.02))):target;const sc=sim.vis.ppm,Rp=RE*sc;
  // atmosphere and Earth
  const gr=ctx.createRadialGradient(CX,CY,Rp*0.98,CX,CY,Rp*1.05);gr.addColorStop(0,'rgba(120,180,255,.45)');gr.addColorStop(1,'rgba(120,180,255,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(CX,CY,Rp*1.05,0,6.29);ctx.fill();
  ctx.fillStyle='#2f6db5';ctx.beginPath();ctx.arc(CX,CY,Rp,0,6.29);ctx.fill();
  ctx.save();ctx.beginPath();ctx.arc(CX,CY,Rp,0,6.29);ctx.clip();ctx.fillStyle='#3f8a4a';
  for(const [a,b,w,h] of [[-0.5,-0.55,0.55,0.35],[0.2,-0.1,0.45,0.6],[-0.65,0.3,0.4,0.35],[0.45,0.55,0.3,0.25]]){ctx.beginPath();ctx.ellipse(CX+a*Rp,CY+b*Rp,w*Rp,h*Rp,0.4,0,6.29);ctx.fill();}ctx.restore();
  txt(ctx,'Earth',CX,CY+6,{s:14*k,w:700,a:'center',c:'#fff'});
  // tower
  const top=CY-(RE+p.h*1000)*sc,base=CY-Rp;ctx.fillStyle='#d8c3a0';ctx.beginPath();ctx.moveTo(CX-Math.max(6,(top<base-6?10:6)),base+2);ctx.lineTo(CX,Math.min(top,base-6));ctx.lineTo(CX+10,base+2);ctx.closePath();ctx.fill();
  // trail
  ctx.strokeStyle='#ffb347';ctx.lineWidth=2;ctx.beginPath();s.trail.forEach(([x,y],i)=>{const X=CX+x*sc,Y=CY-y*sc;i?ctx.lineTo(X,Y):ctx.moveTo(X,Y);});ctx.lineTo(CX+s.x*sc,CY-s.y*sc);ctx.stroke();
  // predicted path (honors): faint full ellipse
  if(atLeast('honors')&&isFinite(el.a)&&!s.done){ctx.save();ctx.setLineDash([4,5]);ctx.strokeStyle='rgba(255,255,255,.28)';ctx.lineWidth=1;ctx.beginPath();
    const st={x:s.x,y:s.y,vx:s.vx,vy:s.vy};const N=720,hstep=el.T/N;for(let i=0;i<=N;i++){const rr2=Math.hypot(st.x,st.y),kk=-GME/(rr2*rr2*rr2);const ax=kk*st.x,ay=kk*st.y;
      st.x+=st.vx*hstep+0.5*ax*hstep*hstep;st.y+=st.vy*hstep+0.5*ay*hstep*hstep;const r3=Math.hypot(st.x,st.y),k3=-GME/(r3*r3*r3);st.vx+=0.5*(ax+k3*st.x)*hstep;st.vy+=0.5*(ay+k3*st.y)*hstep;
      if(r3<RE)break;const X=CX+st.x*sc,Y=CY-st.y*sc;i?ctx.lineTo(X,Y):ctx.moveTo(X,Y);}ctx.stroke();ctx.restore();}
  // ball, gravity arrow and velocity arrow
  const bx=CX+s.x*sc,by=CY-s.y*sc;
  if(!s.done||s.done==='crash'){if(r>0&&!s.done){const ux=-s.x/r,uy=s.y/r,gl=clamp(40*(RE*RE)/(r*r),10,40);arrow(ctx,bx,by,ux*gl,uy*gl,'#ff6b6b',3);
      const v=Math.hypot(s.vx,s.vy);if(v>1){const vl=clamp(v/1000*6,8,70);arrow(ctx,bx,by,s.vx/v*vl,-s.vy/v*vl,'#7fd6ff',3);}}
    ctx.fillStyle='#ffb347';ctx.beginPath();ctx.arc(bx,by,6,0,6.29);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke();}
  // legend + speed scale panel
  const X=560,Y=16,W=226,H=14+118*k;rr(ctx,X,Y,W,H,10);ctx.fillStyle='rgba(16,26,42,.92)';ctx.fill();ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=1;ctx.stroke();
  txt(ctx,'Speed check (km/s)',X+12,Y+22,{s:12.5*k,w:700,c:SINK});
  const r0=RE+p.h*1000,vc=vcirc(r0)/1000,ve=vesc(r0)/1000,L=X+14,Wd=W-28,sx=v=>L+Math.min(v,13)/13*Wd,yb=Y+22*k+30*k;
  ctx.fillStyle='rgba(255,255,255,.15)';ctx.fillRect(L,yb-6,Wd,12);ctx.fillStyle='#ffb347';ctx.fillRect(L,yb-6,sx(p.v0)-L,12);
  for(const [v,l,c,dy] of [[vc,'orbit '+vc.toFixed(1),'#7cf0a0',-10-6*k],[ve,'escape '+ve.toFixed(1),'#ff8fa3',14+12*k]]){ctx.strokeStyle=c;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(sx(v),yb-12);ctx.lineTo(sx(v),yb+12);ctx.stroke();
    txt(ctx,l,clamp(sx(v),L+30,X+W-40),yb+dy,{s:11*k,a:'center',c});}
  txt(ctx,'Yours: '+p.v0.toFixed(1)+' km/s',X+12,yb+36*k+6,{s:12*k,w:700,c:'#ffb347'});
  ctx.fillStyle='#ff6b6b';ctx.fillRect(X+12,Y+H-20,14,4);txt(ctx,'gravity',X+30,Y+H-14,{s:11*k,c:SSOFT});
  ctx.fillStyle='#7fd6ff';ctx.fillRect(X+W/2+6,Y+H-20,14,4);txt(ctx,'velocity',X+W/2+24,Y+H-14,{s:11*k,c:SSOFT});
  // status
  txt(ctx,'⏱ '+(s.tt/60).toFixed(0)+' min   altitude '+Math.max(0,Math.round((r-RE)/1000)).toLocaleString()+' km',16,30,{s:13*k,w:700,c:SINK});
  if(s.done==='crash'&&p.v0>0.05)pill(ctx,'Landed '+Math.round(s.land/1000).toLocaleString()+' km away',CX,428,'#c1440e','#fff',13*k);
  else if(s.done==='escape')pill(ctx,'Escaped: it never comes back',CX,428,'#7a3fb0','#fff',13*k);
  else if(s.orbits>0)pill(ctx,'Laps around Earth: '+s.orbits,CX,428,'#2b7a4b','#fff',13*k);
  txt(ctx,'1 px ≈ '+Math.round(1/sc/1000)+' km',790,440,{s:11*k,a:'right',c:SSOFT});}

function drawForce(sim,ctx,k){const p=sim.p,P=pl(p),hon=atLeast('honors');
  ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
  const CX=110,CY=255,Rp=62,ox=CX+p.r*Rp+(p.r===1?14:0),g=gAt(p,p.r),F=p.m*g;
  // field rings 1..5 radii
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.setLineDash([3,5]);for(let i=2;i<=5;i++){ctx.beginPath();ctx.arc(CX,CY,i*Rp,-0.5,0.5);ctx.stroke();txt(ctx,i+' R',CX+i*Rp*Math.cos(0.5),CY-i*Rp*Math.sin(0.5)-6,{s:11*k,a:'center',c:PAL['cv-soft']});}ctx.setLineDash([]);
  const gd=ctx.createRadialGradient(CX-20,CY-20,8,CX,CY,Rp);gd.addColorStop(0,'#ffffff55');gd.addColorStop(1,'#00000000');
  ctx.fillStyle=P.c;ctx.beginPath();ctx.arc(CX,CY,Rp,0,6.29);ctx.fill();ctx.fillStyle=gd;ctx.fill();
  txt(ctx,P.l,CX,CY+5,{s:14*k,w:700,a:'center',c:'#fff'});
  // ruler line from center
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(CX,CY+104);ctx.lineTo(ox,CY+104);ctx.moveTo(CX,CY+98);ctx.lineTo(CX,CY+110);ctx.moveTo(ox,CY+98);ctx.lineTo(ox,CY+110);ctx.stroke();
  txt(ctx,'r = '+p.r.toFixed(1)+' radii = '+Math.round(p.r*P.R*6371).toLocaleString()+' km',Math.max(CX+60,(CX+ox)/2),CY+128,{s:12*k,a:'center',c:PAL['cv-ink'],w:600});
  // object
  const or=8+Math.sqrt(p.m)*1.2;ctx.fillStyle='#e08a2e';ctx.beginPath();ctx.arc(ox,CY,or,0,6.29);ctx.fill();txt(ctx,p.m+' kg',ox,CY-or-8,{s:12*k,a:'center',w:700});
  const g0=gAt(p,1),Lmax=110,len=clamp(F/(p.m*g0)*Lmax*Math.min(1,p.m/40+0.6),8,Lmax);
  arrow(ctx,ox-or-2,CY,-len,0,PAL['s1'],4);txt(ctx,'pull '+F.toFixed(1)+' N',ox+or+6,CY+5,{s:12*k,w:700,c:PAL['s1']});
  {arrow(ctx,CX,CY+22,Math.min(len,Rp-6),0,'#fff',3);txt(ctx,'The object pulls '+P.l+' '+F.toFixed(1)+' N',16,CY+Rp+22*k,{s:11.5*k,c:PAL['s2'],w:700});}
  // info box
  const X=440,Y=16,W=346,ls=19*k,H=18+ls*4.6;rr(ctx,X,Y,W,H,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,P.l+' ('+P.M+' M_E, '+P.R+' R_E)',X+12,Y+10+ls,{s:12.5*k,w:700});
  txt(ctx,'g here: '+g.toFixed(2)+' N/kg',X+12,Y+10+ls*2,{s:12.5*k,c:PAL['cv-ink']});
  txt(ctx,'Surface g: '+g0.toFixed(2)+' N/kg',X+12,Y+10+ls*3,{s:12*k,c:PAL['cv-soft']});
  txt(ctx,(p.r===1?'On the surface: full strength':'Distance ×'+p.r.toFixed(1)+' → pull ÷'+(p.r*p.r).toFixed(2)),X+12,Y+10+ls*4,{s:12*k,w:700,c:PAL['s5']});}

/* ---------- Two masses (replaces PhET Gravity Force Lab) and Moon and tides ----------
   Two masses: F = G m₁m₂/d², G = 6.674×10⁻¹¹ N·m²/kg². Lead spheres (11,340 kg/m³); d is center to center.
   Tides: the Moon (7.342×10²² kg, today 384,400 km away) pulls Earth's near side (d − R) harder than its center and its far side (d + R)
   less. The difference across Earth stretches the oceans into two bulges; its size is about 2GMR/d³ (1.10×10⁻⁶ m/s² today).
   The Sun (1.989×10³⁰ kg, 1.496×10¹¹ m) adds 2GM☉R/d☉³ = 5.05×10⁻⁷ m/s², 0.46 of the Moon's. Here the Sun is lined up with the Moon (spring tides). */
const GG=6.674e-11,MMOON=7.342e22,DMOON=3.844e8,MSUN=1.989e30,DSUN=1.496e11,TSUN=2*GG*MSUN*RE/Math.pow(DSUN,3);
const SUPN={'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
const sci=(v,u)=>{if(!(v>0))return '0 '+u;const e=Math.floor(Math.log10(v)),m=v/Math.pow(10,e);return m.toFixed(2)+' × 10'+String(e).split('').map(c=>SUPN[c]).join('')+' '+u;};
const pairF=p=>GG*p.pm1*p.pm2/(p.pd*p.pd);
const sphR=m=>Math.cbrt(3*m/(4*Math.PI*11340));
const moonPull=(p,dr)=>p.moon?GG*MMOON/Math.pow(p.md*DMOON+dr,2):0;
const tideMoon=p=>p.moon?2*GG*MMOON*RE/Math.pow(p.md*DMOON,3):0;
const tideToday=2*GG*MMOON*RE/Math.pow(DMOON,3)+TSUN;
Object.assign(MODE_CTL,{pm1:['pair'],pm2:['pair'],pd:['pair'],moon:['tides'],md:['tides']});
Object.assign(MODE_TILE,{F12:['pair'],F21:['pair'],gmc:['tides'],tid:['tides'],tsun:['tides'],tsz:['tides']});
SIM.controls[0].options.push({v:'pair',l:'Two masses'},{v:'tides',l:'Moon and tides'});
SIM.controls.push({id:'pm1',label:'Mass m₁',type:'range',min:1,max:1000,step:1,def:100,unit:' kg',lvl:'bio'},
  {id:'pm2',label:'Mass m₂',type:'range',min:1,max:1000,step:1,def:400,unit:' kg',lvl:'bio'},
  {id:'pd',label:'Distance between centers',type:'range',min:1,max:10,step:0.1,def:2,unit:' m',d:1,lvl:'bio'},
  {id:'moon',label:'The Moon',type:'toggle',def:true,lvl:'bio',help:'Turn it off to see what happens if the Moon disappeared.'},
  {id:'md',label:'Moon’s distance (× today’s)',type:'range',min:0.5,max:2,step:0.05,def:1,unit:'×',d:2,lvl:'bio',help:'Today the Moon is about 384,400 km away. It drifts about 3.8 cm farther each year.'});
SIM.metrics.push({id:'F12',label:'Force on m₁ (pulled by m₂)',text:true,lvl:'bio',get:s=>sci(pairF(s.p),'N')},
  {id:'F21',label:'Force on m₂ (pulled by m₁)',text:true,lvl:'bio',get:s=>sci(pairF(s.p),'N')},
  {id:'gmc',label:'Moon’s pull on each kg at Earth’s center',unit:'× 10⁻⁵ N/kg',lvl:'bio',d:2,get:s=>moonPull(s.p,0)*1e5},
  {id:'tid',label:'Moon’s tide-raising stretch',unit:'× 10⁻⁷ m/s²',lvl:'honors',d:2,get:s=>tideMoon(s.p)*1e7},
  {id:'tsun',label:'Sun’s tide-raising stretch',unit:'× 10⁻⁷ m/s²',lvl:'honors',d:2,get:s=>TSUN*1e7},
  {id:'tsz',label:'Spring tides compared with today',unit:'%',lvl:'bio',d:0,max:null,get:s=>(tideMoon(s.p)+TSUN)/tideToday*100});
SIM.metrics.find(m=>m.id==='Fp').lvl='bio';
SIM.terms.push({t:'Newton’s third law',d:'Two objects always pull on each other with equal and opposite forces, even when one is far heavier.'},{t:'Tide',d:'The twice-a-day rise and fall of the sea, caused mainly by the Moon pulling the near side of Earth harder than the far side.'},
  {lvl:'honors',t:'Tidal force',d:'The difference in a body’s pull across another body. It falls off as 1/d³, faster than the pull itself (1/d²).'});
SIM.about+='<p><b>Two masses:</b> F = Gm₁m₂/d², G = 6.674×10⁻¹¹ N·m²/kg², for two lead spheres; the spheres are drawn larger than their real size, and the force arrows use a logarithmic scale so you can see forces that differ by millions of times.</p>'+
  '<p><b>Moon and tides:</b> the Moon’s pull at Earth’s near side, center and far side uses d − R, d and d + R with R = 6371 km. The tide-raising stretch is 2GMR/d³. The Sun is lined up with the Moon (spring tides). The real ocean’s response depends on coastlines and basins, so “compared with today” is the size of the stretch, not a tide height. Distances and the bulges are not to scale.</p>';
SIM.challenges.push(
  {lvl:'bio',instant:true,q:'A 100 kg ball and a 400 kg ball are 2 m apart. Which one feels the bigger gravitational pull?',choices:['The 100 kg ball','The 400 kg ball','They feel the same size pull'],correct:2,
   baseline:{mode:'pair',pm1:100,pm2:400,pd:2},explain:{bio:'Each ball pulls the other: Newton’s third law makes the two forces equal in size and opposite in direction. The 100 kg ball would accelerate 4 times as much, because the same force acts on less mass.'}},
  {lvl:'bio',q:'Two masses are 2 m apart. You move them to 4 m apart. What happens to the pull between them?',choices:['It halves','It drops to one-quarter','It stays the same'],correct:1,
   baseline:{mode:'pair',pm1:100,pm2:400,pd:2},change:{pd:4},changeText:'Moved to 4 m apart',watch:'gmc',at:10,reveal:40,explain:{bio:'Gravity follows the inverse-square law: twice as far apart means 2 × 2 = 4 times weaker. Check the force tiles: 6.67 × 10⁻⁷ N becomes 1.67 × 10⁻⁷ N.'}},
  {lvl:'bio',instant:true,q:'What if the Moon disappeared? Would Earth still have ocean tides?',choices:['No tides at all','Yes, smaller tides from the Sun','Bigger tides'],correct:1,
   baseline:{mode:'tides',moon:false,md:1},explain:{bio:'The Sun also stretches Earth, about 0.46 times as much as the Moon does. With no Moon, spring tides would be about a third of today’s size: check the “compared with today” tile.'}},
  {lvl:'honors',q:'The Moon moves to twice its distance. Its pull on Earth drops to 1/4. What happens to its tide-raising stretch?',choices:['It drops to 1/2','It drops to 1/4','It drops to 1/8'],correct:2,
   baseline:{mode:'tides',moon:true,md:1},change:{md:2},changeText:'The Moon moved to twice its distance',watch:'gmc',at:10,reveal:40,
   explain:{honors:'The stretch is the difference between the pull on Earth’s near and far sides. That difference shrinks as 1/d³, so twice the distance means 1/8 the stretch: from 11.0 to 1.37 × 10⁻⁷ m/s².'}});
{const d0=SIM.draw,n0=SIM.narrate,p0=SIM.plot;
  SIM.draw=function(sim,ctx,vdt,k,t){const m=sim.p.mode;if(m==='pair')return drawPair(sim,ctx,k);if(m==='tides')return drawTides(sim,ctx,k,t);return d0.call(SIM,sim,ctx,vdt,k,t);};
  SIM.narrate=function(sim){const p=sim.p;
    if(p.mode==='pair'){const F=pairF(p),big=p.pm2>=p.pm1?['m₂',p.pm2/p.pm1]:['m₁',p.pm1/p.pm2];
      return 'm₁ and m₂ pull on each other with forces of <b>the same size</b>, '+sci(F,'N')+', in opposite directions'+(big[1]>=1.05?', even though '+big[0]+' is '+big[1].toFixed(1)+' times heavier':'')+'. That is Newton’s third law. '+(atLeast('honors')?'F = Gm₁m₂/d²: double the distance and F drops to one-quarter.':'Move them farther apart and the pull weakens fast.');}
    if(p.mode==='tides'){if(!p.moon)return '<b>No Moon.</b> Only the Sun stretches Earth now, so the tidal bulges shrink: spring tides would be about '+Math.round(TSUN/tideToday*100)+'% of today’s.';
      return 'The Moon pulls Earth’s near side a little harder than its center, and the far side a little less. That difference stretches the oceans into <b>two bulges</b>, so most coasts get two high tides a day.'+(p.md!==1?' At '+p.md.toFixed(2)+'× today’s distance, the pull is '+(1/(p.md*p.md)).toFixed(2)+'× today’s but the stretch is '+(1/Math.pow(p.md,3)).toFixed(2)+'×.':'');}
    return n0.call(SIM,sim);};
  SIM.plot=function(sim,ctx,box,id){const p=sim.p;if(id==='gr'&&p.mode==='pair'){const F0=GG*p.pm1*p.pm2,ax=axes(ctx,box,{xmin:1,xmax:10,ymin:0,ymax:F0*1e9*1.05,xl:'Distance between centers (m)',yl:'Force (× 10⁻⁹ N)'});
      ctx.strokeStyle=PAL['s2'];ctx.lineWidth=2.5;ctx.beginPath();for(let i=0;i<=90;i++){const d=1+i*0.1;i?ctx.lineTo(ax.X(d),ax.Y(F0/(d*d)*1e9)):ctx.moveTo(ax.X(d),ax.Y(F0/(d*d)*1e9));}ctx.stroke();
      const y=pairF(p)*1e9;ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.arc(ax.X(p.pd),ax.Y(y),6,0,6.29);ctx.fill();txt(ctx,y.toFixed(1)+' × 10⁻⁹ N',ax.X(p.pd)+10,ax.Y(y)-8,{s:13,w:700,c:PAL['cv-ink']});return;}
    if(id==='gr'&&p.mode==='tides'){const ax=axes(ctx,box,{xmin:0.5,xmax:2,ymin:0,ymax:4.2,xl:'Moon’s distance (× today’s)',yl:'Compared with today'});
      [[2,PAL['s2'],'pull ∝ 1/d²'],[3,PAL['s1'],'stretch ∝ 1/d³']].forEach(([n,c,l],j)=>{ctx.strokeStyle=c;ctx.lineWidth=2.5;ctx.beginPath();for(let i=0;i<=150;i++){const d=0.5+i*0.01,y=Math.min(4.2,Math.pow(d,-n));i?ctx.lineTo(ax.X(d),ax.Y(y)):ctx.moveTo(ax.X(d),ax.Y(y));}ctx.stroke();txt(ctx,l,ax.X(1.45),ax.Y(Math.pow(1.45,-n))-10-j*4,{s:12,w:700,c});});
      if(p.moon){ctx.fillStyle=PAL['s4'];[2,3].forEach(n=>{ctx.beginPath();ctx.arc(ax.X(p.md),ax.Y(Math.min(4.2,Math.pow(p.md,-n))),5,0,6.29);ctx.fill();});}return;}
    return p0.call(SIM,sim,ctx,box,id);};}
function drawPair(sim,ctx,k){const p=sim.p,F=pairF(p),hon=atLeast('honors');ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
  const ppm=62,x1=110,x2=x1+p.pd*ppm,y=230,r1=10+24*Math.cbrt(p.pm1/1000),r2=10+24*Math.cbrt(p.pm2/1000);
  // ruler between centers
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x1,y+70);ctx.lineTo(x2,y+70);ctx.stroke();for(let m=0;m<=p.pd+1e-9;m+=0.5){const X=x1+m*ppm;ctx.beginPath();ctx.moveTo(X,y+64);ctx.lineTo(X,y+(m%1===0?78:72));ctx.stroke();if(m%1===0)txt(ctx,m+' m',X,y+94,{s:12*k,a:'center',c:PAL['cv-soft']});}
  txt(ctx,'d = '+p.pd.toFixed(1)+' m (center to center)',(x1+x2)/2,y+116,{s:13*k,a:'center',w:700,c:PAL['fg']});
  const sph=(x,r,c,l,m)=>{const gd=ctx.createRadialGradient(x-r/3,y-r/3,2,x,y,r);gd.addColorStop(0,'#ffffff');gd.addColorStop(0.25,c);gd.addColorStop(1,c);ctx.fillStyle=gd;ctx.beginPath();ctx.arc(x,y,r,0,6.29);ctx.fill();txt(ctx,l+' = '+m+' kg',x,y-r-14,{s:13*k,a:'center',w:700,c:PAL['fg']});};
  sph(x1,r1,'#5b7fa8','m₁',p.pm1);sph(x2,r2,'#c9773d','m₂',p.pm2);
  const L=clamp(14+(Math.log10(F)+12.2)/8*150,12,170);arrow(ctx,x1+r1+2,y,Math.min(L,Math.max(12,(x2-x1)/2-r1-4)),0,PAL['s1'],4);arrow(ctx,x2-r2-2,y,-Math.min(L,Math.max(12,(x2-x1)/2-r2-4)),0,PAL['s1'],4);
  // info
  const X=470,Y=16,W=316;rr(ctx,X,Y,W,hon?150:112,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,'Force on m₁: '+sci(F,'N'),X+12,Y+26,{s:13*k,w:700,c:PAL['s1']});txt(ctx,'Force on m₂: '+sci(F,'N'),X+12,Y+50,{s:13*k,w:700,c:PAL['s1']});
  txt(ctx,'Equal size, opposite directions',X+12,Y+76,{s:12*k,c:PAL['fg']});txt(ctx,'Arrows on a log scale; spheres not to scale',X+12,Y+98,{s:12*k,c:PAL['cv-soft']});
  if(hon)txt(ctx,'F = Gm₁m₂/d² = (6.67×10⁻¹¹)('+p.pm1+')('+p.pm2+')/('+p.pd.toFixed(1)+')²',X+12,Y+128,{s:12*k,c:PAL['fg']});}
function drawTides(sim,ctx,k,t){const p=sim.p,hon=atLeast('honors');ctx.fillStyle=SPACE;ctx.fillRect(0,0,800,450);stars(ctx);
  const ex=230,ey=210,R=82,mt=tideMoon(p),st=(mt+TSUN)/tideToday,bulge=8+26*st;
  // ocean bulges (exaggerated), Earth
  ctx.fillStyle='rgba(90,160,235,.55)';ctx.beginPath();ctx.ellipse(ex,ey,R+bulge,R+4-bulge*0.25,0,0,6.29);ctx.fill();
  ctx.fillStyle='#2f6db5';ctx.beginPath();ctx.arc(ex,ey,R,0,6.29);ctx.fill();ctx.save();ctx.beginPath();ctx.arc(ex,ey,R,0,6.29);ctx.clip();ctx.fillStyle='#3f8a4a';
  for(const [a,b,w,h] of [[-0.5,-0.55,0.55,0.35],[0.2,-0.1,0.45,0.6],[-0.65,0.3,0.4,0.35]]){ctx.beginPath();ctx.ellipse(ex+a*R,ey+b*R,w*R,h*R,0.4,0,6.29);ctx.fill();}ctx.restore();
  txt(ctx,'Earth',ex,ey+5,{s:14*k,w:700,a:'center',c:'#fff'});txt(ctx,'ocean bulges (exaggerated)',ex,ey+R+bulge*0.4+30,{s:12*k,a:'center',c:SSOFT});
  // the Moon and the stretch arrows
  if(p.moon){const mx=clamp(520+(p.md-1)*150,450,740);ctx.fillStyle='#c9c9c9';ctx.beginPath();ctx.arc(mx,ey,24,0,6.29);ctx.fill();txt(ctx,'Moon',mx,ey+44,{s:13*k,w:700,a:'center',c:SINK});
    txt(ctx,(p.md*384400).toLocaleString(undefined,{maximumFractionDigits:0})+' km (not to scale)',mx,ey+64,{s:12*k,a:'center',c:SSOFT});
    const s=clamp(50*mt/(2*GG*MMOON*RE/Math.pow(DMOON,3)),6,110);arrow(ctx,ex+R+4,ey,s,0,'#ffb347',4);arrow(ctx,ex-R-4,ey,-s,0,'#ffb347',4);
    ctx.strokeStyle='rgba(255,255,255,.35)';ctx.setLineDash([4,5]);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(ex+R+8,ey-60);ctx.lineTo(mx-30,ey-20);ctx.stroke();ctx.setLineDash([]);
    if(hon){txt(ctx,'near side: '+(moonPull(p,-RE)*1e5).toFixed(3),ex,ey-R-50,{s:12*k,a:'center',c:SINK});txt(ctx,'center: '+(moonPull(p,0)*1e5).toFixed(3),ex,ey-R-32,{s:12*k,a:'center',c:SINK});txt(ctx,'far side: '+(moonPull(p,RE)*1e5).toFixed(3)+'  (× 10⁻⁵ N/kg)',ex,ey-R-14,{s:12*k,a:'center',c:SINK});}}
  else{txt(ctx,'No Moon',620,ey,{s:16*k,w:700,a:'center',c:SSOFT});const s=50*TSUN/(2*GG*MMOON*RE/Math.pow(DMOON,3));arrow(ctx,ex+R+4,ey,s,0,'#ffe27a',4);arrow(ctx,ex-R-4,ey,-s,0,'#ffe27a',4);}
  txt(ctx,'Sun: far off to the right, lined up (spring tides)',790,24,{s:12*k,a:'right',c:'#ffe27a'});
  // tide-raising strength bars
  const bx=470,by=330,bw=300;rr(ctx,bx-10,by-34,bw+20,104,10);ctx.fillStyle='rgba(16,26,42,.92)';ctx.fill();txt(ctx,'Tide-raising stretch (× 10⁻⁷ m/s²)',bx,by-14,{s:12.5*k,w:700,c:SINK});
  const sc=bw/16;[['Moon',mt*1e7,'#ffb347'],['Sun',TSUN*1e7,'#ffe27a']].forEach(([l,v,c],i)=>{const y=by+6+i*28;ctx.fillStyle=c;ctx.fillRect(bx+48,y,Math.min(bw-90,v*sc),16);txt(ctx,l,bx,y+13,{s:12*k,c:SINK});txt(ctx,v.toFixed(2),bx+54+Math.min(bw-90,v*sc),y+13,{s:12*k,c:SINK});});}

BioLab.register(SIM);
})();
