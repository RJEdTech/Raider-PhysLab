(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,RM}=BioLab.h;

/* Inclined plane. A block on a 3.7 m ramp at angle θ, g = 9.8 m/s². Positions s are measured down the ramp from the top stop.
   Gravity splits into mg·sinθ along the ramp and mg·cosθ into it. An optional pull F acts up the ramp at angle φ above the surface,
   so N = mg·cosθ − F·sinφ and the down-slope driving force is D = mg·sinθ − F·cosφ.
   At rest the block stays put while |D| ≤ μs·N (static friction = −D); otherwise it slides with kinetic friction μk·N opposing v.
   The block is released 0.4 m below the top stop, timed to the bottom (3.0 m of travel), then reset after a short pause. */
const G=9.8,RAMP=3.7,S0=0.4,RUN=3.0;
const SURF={none:{l:'Frictionless',mus:0,muk:0,c:'#9fc3e6'},ice:{l:'Ice',mus:0.10,muk:0.05,c:'#cfe8f3'},wood:{l:'Wood',mus:0.45,muk:0.30,c:'#c99a63'},rubber:{l:'Rubber',mus:1.00,muk:0.80,c:'#3b3b40'}};
const rad=d=>d*Math.PI/180;
function forces(p){const th=rad(p.angle),ph=rad(atLeast('ap')?p.phi:0),F=atLeast('honors')?p.push:0,m=p.mass,sf=SURF[p.surface];
  const par=m*G*Math.sin(th),perp=m*G*Math.cos(th),N=Math.max(0,perp-F*Math.sin(ph)),D=par-F*Math.cos(ph);
  return {th,ph,F,m,par,perp,N,D,mus:sf.mus,muk:sf.muk,Fa:F*Math.cos(ph)};}
function arrow(ctx,x,y,dx,dy,col,w,dash){const L=Math.hypot(dx,dy);if(L<2)return;const head=Math.min(10,4+L*0.25),ux=dx/L,uy=dy/L;
  ctx.save();ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=w||3;ctx.lineCap='round';if(dash)ctx.setLineDash(dash);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+dx-ux*head*0.8,y+dy-uy*head*0.8);ctx.stroke();ctx.setLineDash([]);
  ctx.beginPath();ctx.moveTo(x+dx,y+dy);ctx.lineTo(x+dx-ux*head-uy*head*0.55,y+dy-uy*head+ux*head*0.55);ctx.lineTo(x+dx-ux*head+uy*head*0.55,y+dy-uy*head-ux*head*0.55);ctx.closePath();ctx.fill();ctx.restore();}
function relaunch(sim){const s=sim.st;s.s=S0;s.v=0;s.rt=0;s.pause=0;s.strobe=[];s.lastStrobe=-1;s.moved=false;}

const SIM={
  id:'incline',hash:'incline',apUnit:2,order:3,tab:'Inclined plane',kind:'Simulation',
  card:'Tilt a ramp, change the surface and the mass, and see gravity split into parts along and into the slope.',
  title:'Inclined plane: forces on a slope',
  lede:{bio:'Tilt the ramp and watch when the block starts to slide, how fast it goes, and why the surface matters.',
        honors:'Split gravity into components along and into the ramp, find the angle where the block just slips, and push it back up the slope.',
        ap:'Apply Newton’s second law along tilted axes, including a rope pulling at an angle that changes the normal force.'},
  scale:'Real sizes: a 3.7 m ramp, about the length of a small car; a 5 kg block is about a bag of flour.',
  timeScale:1,dtMax:0.004,prewarm:0,sampleDt:0.04,window:10,unit:'s',chChange:2,chReveal:6,
  controls:[
    {id:'angle',label:'Ramp angle θ',type:'range',min:0,max:60,step:1,def:20,unit:'°',lvl:'bio'},
    {id:'mass',label:'Mass of the block',type:'range',min:1,max:20,step:1,def:5,unit:' kg',lvl:'bio'},
    {id:'surface',label:'Ramp surface',type:'seg',def:'wood',lvl:'bio',options:[{v:'none',l:'No friction'},{v:'ice',l:'Ice'},{v:'wood',l:'Wood'},{v:'rubber',l:'Rubber'}]},
    {id:'strobe',label:'Strobe photo',type:'toggle',def:true,lvl:'bio',help:'An image of the block every 0.2 s',noTrial:true},
    {id:'push',label:'Pull up the ramp',type:'range',min:0,max:200,step:1,def:0,unit:' N',lvl:'honors'},
    {id:'phi',label:'Rope angle above the ramp φ',type:'range',min:0,max:60,step:5,def:0,unit:'°',lvl:'ap'}
  ],
  actions:[{id:'again',label:'Release again',primary:true,lvl:'bio',run(sim){relaunch(sim);}}],
  init(){return {s:S0,v:0,a:0,f:0,rt:0,pause:0,tb:NaN,strobe:[],lastStrobe:-1,moved:false,stuckTop:false};},
  step(sim,dt){const s=sim.st,F=forces(sim.p),m=F.m;
    // forces and acceleration (computed even during the pause so the readouts stay meaningful)
    let a,f;
    if(Math.abs(s.v)<1e-9){if(Math.abs(F.D)<=F.mus*F.N+1e-9){f=-F.D;a=0;}else{f=-Math.sign(F.D)*F.muk*F.N;a=(F.D+f)/m;}}
    else{f=-Math.sign(s.v)*F.muk*F.N;a=(F.D+f)/m;}
    s.stuckTop=s.s<=1e-6&&a<0&&s.v<=0;if(s.stuckTop){a=0;f=0;}
    s.a=a;s.f=f;
    if(s.pause>0){s.pause-=dt;if(s.pause<=0)relaunch(sim);return;}
    s.rt+=dt;let v1=s.v+a*dt;
    if(s.v!==0&&Math.sign(v1)!==Math.sign(s.v)&&Math.abs(F.D)<=F.mus*F.N){v1=0;}
    s.v=v1;s.s+=s.v*dt;if(Math.abs(s.v)>1e-6)s.moved=true;
    if(s.s<=0){s.s=0;if(s.v<0)s.v=0;}
    if(sim.p.strobe&&s.moved&&s.rt-s.lastStrobe>=0.2-1e-9){s.strobe.push(s.s);s.lastStrobe=s.rt;if(s.strobe.length>40)s.strobe.shift();}
    if(s.s>=S0+RUN){s.s=S0+RUN;s.tb=s.rt;s.v=0;s.pause=0.9;}},
  metrics:[
    {id:'acc',label:'Acceleration down the ramp',unit:'m/s²',lvl:'bio',d:2,max:null,get:s=>s.st.a},
    {id:'vel',label:'Speed along the ramp',unit:'m/s',lvl:'bio',d:2,max:null,get:s=>s.st.v},
    {id:'tb',label:'Time to the bottom (last run)',unit:'s',lvl:'bio',d:2,get:s=>s.st.tb},
    {id:'weight',label:'Weight (mg)',unit:'N',lvl:'bio',d:1,get:s=>s.p.mass*G},
    {id:'par',label:'Gravity along the ramp',unit:'N',lvl:'bio',d:1,max:null,get:s=>forces(s.p).par},
    {id:'normal',label:'Normal force',unit:'N',lvl:'bio',d:1,max:null,get:s=>forces(s.p).N},
    {id:'fric',label:'Friction',unit:'N',lvl:'bio',d:1,get:s=>Math.abs(s.st.f)},
    {id:'perp',label:'mg cos θ',unit:'N',lvl:'honors',d:1,get:s=>forces(s.p).perp},
    {id:'repose',label:'Angle of repose (tan⁻¹ μs)',unit:'°',lvl:'honors',d:1,get:s=>Math.atan(SURF[s.p.surface].mus)*180/Math.PI},
    {id:'pos',label:'Distance down the ramp',unit:'m',lvl:'ap',d:2,max:null,get:s=>s.st.s-S0}
  ],
  graphs:[{id:'vel',label:'Speed',lines:['vel']},{id:'acc',label:'Acceleration',lines:['acc']},{id:'comp',label:'Gravity along the ramp and normal force',lines:['par','normal']},{id:'pos',label:'Distance down the ramp',lvl:'ap',lines:['pos']}],
  defaultGraph:'vel',
  challenges:[
    {lvl:'bio',q:'A block rests on a wooden ramp at 20°. You tilt the ramp up to 35°. What happens?',choices:['It stays put','It starts sliding down','It slides only if you push it'],correct:1,
     baseline:{angle:20,mass:5,surface:'wood',push:0,phi:0},change:{angle:35},changeText:'Ramp tilted to 35°',watch:'vel',
     explain:{bio:'Tilting the ramp makes more of the block’s weight pull it down the slope, and less of it press into the ramp. At 35° the pull down the slope wins against friction and the block slides.',
              honors:'It slides when tanθ > μs. tan 20° = 0.36 < 0.45, so it holds; tan 35° = 0.70 > 0.45, so it slides with a = g(sin35° − 0.30 cos35°) = 3.2 m/s².'}},
    {lvl:'bio',q:'A block slides down a frictionless ramp at 15°. You tilt it up to 40°. What happens to its acceleration?',choices:['It gets bigger','It stays the same','It gets smaller'],correct:0,
     baseline:{angle:15,mass:5,surface:'none',push:0,phi:0},change:{angle:40},changeText:'Ramp tilted to 40°',watch:'acc',
     explain:{bio:'A steeper ramp means more of gravity points down the slope. The acceleration rose from 2.5 to 6.3 m/s². A vertical ramp would be free fall, 9.8 m/s².',
              honors:'With no friction a = g·sinθ: 9.8 × sin15° = 2.54 m/s², 9.8 × sin40° = 6.30 m/s².'}},
    {lvl:'honors',q:'A 2 kg block slides down a wooden ramp at 40°. You swap it for a 10 kg block. What happens to the acceleration?',choices:['5 times bigger','The same','5 times smaller'],correct:1,
     baseline:{angle:40,mass:2,surface:'wood',push:0,phi:0},change:{mass:10},changeText:'Mass changed to 10 kg',watch:'acc',
     explain:{honors:'Every force here is proportional to m: mg·sinθ, and friction μk·mg·cosθ. Dividing by m cancels it: a = g(sinθ − μk cosθ) = 9.8(0.643 − 0.30 × 0.766) = 4.05 m/s² for any mass.'}},
    {lvl:'honors',q:'A block sits on a rubber ramp at 10°. You raise the ramp to 44° and the block still holds. What happens to the normal force?',choices:['It stays equal to the weight','It gets smaller','It gets bigger'],correct:1,
     baseline:{angle:10,mass:10,surface:'rubber',push:0,phi:0},change:{angle:44},changeText:'Ramp raised to 44°',watch:'comp',
     explain:{honors:'Only the part of gravity into the ramp, mg·cosθ, presses the block onto it: 98 × cos10° = 96.5 N, but 98 × cos44° = 70.5 N. Meanwhile mg·sinθ rose from 17 N to 68 N, still less than μs·N = 70.5 N.'}},
    {lvl:'honors',instant:true,q:'You slowly tilt a ramp; the block first starts to slide at 31°. What is μs between them?',choices:['0.31','0.52','0.60','0.86'],correct:2,
     explain:{honors:'Right at slipping, mg·sinθ = μs·mg·cosθ, so μs = tanθ = tan 31° = 0.60. The mass cancels, so this angle of repose is a quick way to measure μs.'}},
    {lvl:'ap',instant:true,q:'A 10 kg block sits on a 30° ramp. What is the normal force on it?',choices:['98 N','84.9 N','49 N','113 N'],correct:1,
     explain:{ap:'Perpendicular to the ramp nothing accelerates, so N = mg·cosθ = 10 × 9.8 × cos30° = 84.9 N. It is less than the weight because part of gravity points along the slope instead.'}},
    {lvl:'ap',instant:true,q:'What force, pulling straight up a frictionless 30° ramp, holds a 10 kg block still?',choices:['98 N','84.9 N','49 N','0 N'],correct:2,
     explain:{ap:'Along the ramp, F − mg·sinθ = 0, so F = 98 × sin30° = 49 N. Try it with “Pull up the ramp” at 49 N on the frictionless surface.'}},
    {lvl:'ap',q:'A 50 N rope holds a 10 kg block on a rubber 30° ramp, pulling parallel to the slope. You tilt the rope up to 30° above the ramp, still 50 N. What happens to the normal force?',choices:['It stays 84.9 N','It drops by 25 N','It drops by 43 N','It rises by 25 N'],correct:1,
     baseline:{angle:30,mass:10,surface:'rubber',push:50,phi:0},change:{phi:30},changeText:'Rope tilted to 30°',watch:'comp',
     explain:{ap:'The rope now has a component away from the ramp, F·sinφ = 50 × sin30° = 25 N, which lifts some of the load: N = mg·cosθ − F·sinφ = 84.9 − 25 = 59.9 N. Its pull along the ramp falls to 50 cos30° = 43.3 N, and static friction makes up the rest.'}}
  ],
  narrate(sim){const p=sim.p,s=sim.st,F=forces(p),hon=atLeast('honors'),deg=p.angle;
    if(s.pause>0)return 'Reached the bottom in <b>'+s.tb.toFixed(2)+' s</b>. Releasing again…';
    if(deg===0&&F.F===0)return 'The ramp is flat, so gravity pulls straight into the surface and nothing pulls the block along it.';
    if(s.stuckTop)return 'The pull up the ramp is stronger than gravity along it, so the block is pressed against the top stop.';
    if(Math.abs(s.v)<1e-9&&s.a===0){const rep=Math.atan(F.mus)*180/Math.PI;
      return '<b>The block holds.</b> Gravity pulls it down the slope with '+F.par.toFixed(1)+' N'+(F.F?' and the rope pulls up with '+F.Fa.toFixed(1)+' N':'')+'; static friction supplies the difference, '+Math.abs(s.f).toFixed(1)+' N'+(hon&&F.F===0?'. It will slip above tan⁻¹μs = '+rep.toFixed(1)+'°.':'.');}
    const dir=s.v<0?'up':'down';
    if(Math.abs(s.a)<0.02)return 'The forces along the ramp balance, so the block moves '+dir+' at a steady '+Math.abs(s.v).toFixed(2)+' m/s.';
    return 'Sliding '+dir+' the ramp, '+(Math.sign(s.a)===Math.sign(s.v||s.a)?'speeding up':'slowing down')+' at <b>'+Math.abs(s.a).toFixed(2)+' m/s²</b>'+(hon?' = (mg sinθ − '+(F.F?'F cosφ − ':'')+'f)/m':'')+'. Speed '+Math.abs(s.v).toFixed(2)+' m/s.';},
  tour:[
    {title:'The ramp',text:'A block sits on a wooden ramp tilted 20°. A ruler runs along the ramp and a stopwatch times each slide.',focus:[40,40,460,380],pause:true,
     setup(sim){BioLab.setValues(sim,{angle:20,mass:5,surface:'wood',push:0,phi:0,strobe:true});relaunch(sim);}},
    {title:'Splitting gravity',text:{bio:'Gravity pulls the block straight down. On a slope, part of that pull points <i>down the ramp</i> and part presses <i>into the ramp</i>. The dashed arrows show the two parts.',honors:'Gravity mg splits into mg·sinθ along the ramp and mg·cosθ into it. The normal force balances mg·cosθ; friction responds to mg·sinθ.'},
     focus:[552,18,238,222],pause:true},
    {title:'Held by friction',text:'At 20°, friction can hold the block: the pull down the ramp is smaller than the most friction can give.',focus:[[40,40,460,380],[552,18,238,222]],speed:0.6},
    {title:'Steeper: it slides',text:'At 32° the pull down the slope wins. The block slides, and kinetic friction slows it a little.',focus:[[40,40,460,380]],speed:0.5,
     setup(sim){BioLab.setValues(sim,{angle:32});relaunch(sim);}},
    {title:'Remove friction',text:'With no friction the block accelerates faster. The strobe images spread out more and more: it is speeding up.',focus:[40,40,460,380],speed:0.5,
     setup(sim){BioLab.setValues(sim,{surface:'none'});relaunch(sim);}},
    {title:'Mass doesn’t matter',text:'A heavier block feels more gravity, but it is also harder to speed up. The two effects cancel, so its acceleration is the same. Compare the stopwatch times.',focus:[[552,250,238,64],[40,40,460,380]],speed:0.6,
     setup(sim){BioLab.setValues(sim,{mass:18});relaunch(sim);}},
    {lvl:'honors',title:'Angle of repose',text:'Back on wood at 24°: just under tan⁻¹(0.45) = 24.2°. The block barely holds. One more degree and it slips.',focus:[[40,40,460,380],[552,18,238,222]],speed:0.6,
     setup(sim){BioLab.setValues(sim,{surface:'wood',angle:24,mass:5});relaunch(sim);}},
    {lvl:'honors',title:'Pull it up the ramp',text:'A 50 N pull up the slope beats gravity along the ramp (17 N) plus kinetic friction (13 N), so the block accelerates up the ramp.',focus:[[40,40,460,380],[552,18,238,222]],speed:0.6,
     setup(sim){BioLab.setValues(sim,{push:50,angle:20});relaunch(sim);sim.st.s=2.4;}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{angle:20,mass:5,surface:'wood',push:0,phi:0});relaunch(sim);},
  lab:{bio:'<p><b>Question:</b> How does the angle of a ramp affect how fast a block reaches the bottom?</p><ol><li>Frictionless surface, 5 kg. Record the time to the bottom at 10°, 20°, 30°, 40° and 50°.</li><li>Repeat two angles with 15 kg.</li><li>Graph angle (x) against time to the bottom (y).</li></ol><p>Write a claim about angle and speed, and one about mass, using your data.</p>',
       honors:'<p><b>Question:</b> Can the angle of repose measure μs?</p><ol><li>For each surface, raise the angle 1° at a time until the block slips. Record the angle.</li><li>Calculate μs = tanθ and compare with the angle-of-repose readout.</li><li>On wood at 35°, record the acceleration for three masses and compare with g(sinθ − μk cosθ).</li></ol>',
       ap:'<p><b>Question:</b> How does the direction of a pull change the force needed to drag a block up a ramp?</p><ol><li>Wood, 25°, 10 kg. For rope angles 0°, 15°, 30°, 45° and 60°, find the smallest pull that makes the block slide up.</li><li>Derive F = mg(sinθ + μs cosθ)/(cosφ + μs sinφ) and compare.</li><li>Find the rope angle that needs the least force, and show it satisfies tanφ = μs.</li></ol>'},
  terms:[{t:'Inclined plane',d:'A flat surface tilted at an angle: a ramp.'},{t:'Weight',d:'The pull of gravity, mg. It always points straight down.'},{t:'Normal force',d:'The ramp pushing back on the block, straight out from its surface.'},{t:'Friction',d:'A force along the surface that resists sliding.'},
    {lvl:'honors',t:'Components',d:'Splitting one force into two perpendicular parts. On a ramp: mg sinθ along it, mg cosθ into it.'},{lvl:'honors',t:'Angle of repose',d:'The steepest angle at which an object stays put: tanθ = μs.'},
    {lvl:'ap',t:'Tilted axes',d:'Choosing x along the ramp and y perpendicular to it, so acceleration has only one component.'}],
  about:'<p>Block on a straight 3.7 m ramp, g = 9.8 m/s², integrated in 4 ms steps. Forces resolved along the ramp: driving force mg·sinθ − F·cosφ, normal force mg·cosθ − F·sinφ. Static friction holds while the driving force is at most μs·N; sliding uses μk·N against the motion. Coefficients are typical values (ice 0.10/0.05, wood 0.45/0.30, rubber 1.0/0.80).</p><p>Simplified: the block slides without tipping or rolling, there is no air resistance, the pull is applied along a massless rope, and the block stops at a buffer at the bottom.</p>',
  draw(sim,ctx,vdt,k,t){const p=sim.p,s=sim.st,F=forces(p),hon=atLeast('honors'),ap=atLeast('ap'),sf=SURF[p.surface];
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    const th=F.th,R=430,ppm=R/RAMP,HX=60,HY=405;// hinge at bottom-left; ramp rises to the right
    const ux=Math.cos(th),uy=-Math.sin(th);// unit vector up the ramp (screen)
    const TX=HX+R*ux,TY=HY+R*uy;
    ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,HY,800,45);
    // support
    ctx.fillStyle='rgba(150,115,70,.22)';ctx.beginPath();ctx.moveTo(HX,HY);ctx.lineTo(TX,TY);ctx.lineTo(TX,HY);ctx.closePath();ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.stroke();
    // surface strip
    ctx.save();ctx.translate(HX,HY);ctx.rotate(-th);
    ctx.fillStyle=sf.c;ctx.fillRect(0,-6,R,6);
    // ruler ticks along ramp (from the top stop)
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.beginPath();for(let m=0;m<=RAMP+1e-6;m+=0.1){const x=R-m*ppm,maj=Math.abs(m*2-Math.round(m*2))<1e-6;ctx.moveTo(x,0);ctx.lineTo(x,maj?10:5);}ctx.stroke();
    for(let m=0.5;m<RAMP-0.3;m+=0.5){ctx.save();ctx.translate(R-m*ppm,20);ctx.rotate(th);txt(ctx,m.toFixed(1),0,0,{s:9.5*k,a:'center',c:PAL['cv-soft']});ctx.restore();}
    // stops
    ctx.fillStyle='#555';ctx.fillRect(R-6,-22,6,22);ctx.fillRect(0,-16,5,16);
    // strobe ghosts
    const bw=46+p.mass*1.2,bh=26+p.mass*0.9;
    if(p.strobe){ctx.globalAlpha=0.5;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;for(const q of s.strobe){const x=R-q*ppm;ctx.strokeRect(x-bw/2,-6-bh,bw,bh);}ctx.globalAlpha=1;}
    // block
    const bx=R-s.s*ppm;ctx.fillStyle='#2d6bd2';rr(ctx,bx-bw/2,-6-bh,bw,bh,4);ctx.fill();ctx.strokeStyle='#173f80';ctx.lineWidth=2;ctx.stroke();
    ctx.save();ctx.translate(bx,-6-bh/2);ctx.rotate(th);txt(ctx,p.mass+' kg',0,4,{s:11*k,w:700,a:'center',c:'#fff'});ctx.restore();
    // rope / pull
    if(F.F>0){const rx=bx+bw/2,ry=-6-bh/2,L=90;const ex=rx+L*Math.cos(F.ph),ey=ry-L*Math.sin(F.ph);ctx.strokeStyle='#9c7a46';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(rx,ry);ctx.lineTo(ex,ey);ctx.stroke();
      ctx.fillStyle='#e0b48c';ctx.beginPath();ctx.arc(ex,ey,9,0,6.29);ctx.fill();
      ctx.save();ctx.translate(ex+6,ey-12);ctx.rotate(th);txt(ctx,F.F+' N',0,0,{s:11.5*k,w:700,c:PAL['s1']});ctx.restore();
      if(ap&&F.ph>0){ctx.strokeStyle=PAL['s6'];ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(rx,ry,30,-F.ph,0);ctx.stroke();ctx.save();ctx.translate(rx+36,ry-8);ctx.rotate(th);txt(ctx,'φ',0,0,{s:12*k,c:PAL['s6'],w:700});ctx.restore();}}
    ctx.restore();
    // angle arc at hinge
    if(p.angle>0){ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(HX,HY,62,-th,0);ctx.stroke();pill(ctx,'θ = '+p.angle+'°',HX+64,HY+22,PAL['card'],PAL['rj'],13*k);}
    // world-frame arrows at block centre
    const bc={x:HX+(R-s.s*ppm)*ux+Math.sin(th)*(6+bh/2),y:HY+(R-s.s*ppm)*uy-Math.cos(th)*(6+bh/2)};
    const sc=Math.min(50/(F.m*G),1.2);
    arrow(ctx,bc.x,bc.y,0,F.m*G*sc,PAL['s2'],3);
    if(Math.abs(s.v)>0.05&&!RM){ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.globalAlpha=0.6;const d=Math.sign(s.v);for(let i=-1;i<=1;i++){const ox=bc.x+d*ux*(bw/2+10)-uy*i*8,oy=bc.y+d*uy*(bw/2+10)+ux*i*8;ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(ox+d*ux*18,oy+d*uy*18);ctx.stroke();}ctx.globalAlpha=1;}
    if(s.pause>0)pill(ctx,'Bottom in '+s.tb.toFixed(2)+' s',HX+200,HY+22,PAL['rj'],'#fff',13*k);
    drawFBD(sim,ctx,k,F,hon,ap);
    // readout under the FBD
    rr(ctx,552,250,238,64,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
    const kb=Math.min(k,1.3);txt(ctx,'⏱ '+s.rt.toFixed(2)+' s'+(isFinite(s.tb)?'   last '+s.tb.toFixed(2)+' s':''),564,274,{s:13.5*kb,w:700});
    txt(ctx,'v = '+s.v.toFixed(2)+' m/s  a = '+s.a.toFixed(2)+' m/s²',564,298,{s:12*kb,c:PAL['cv-soft']});
    txt(ctx,sf.l+(hon&&sf.mus?': μs '+sf.mus.toFixed(2)+', μk '+sf.muk.toFixed(2):''),564,342,{s:12.5*kb,w:600,c:PAL['cv-ink']});}
};

function drawFBD(sim,ctx,k,F,hon,ap){k=Math.min(k,1.3);const s=sim.st,X=552,Y=18,W=238,H=222;
  rr(ctx,X,Y,W,H,12);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,hon?'Free-body diagram':'Forces on the block',X+12,Y+22,{s:12.5*k,w:700});
  const cx=X+W/2-6,cy=Y+100,th=F.th,mg=F.m*G,sc=56/Math.max(mg,F.F,1);
  const up={x:Math.cos(th),y:-Math.sin(th)},out={x:-Math.sin(th),y:-Math.cos(th)};// screen: up-ramp and out-of-ramp
  // faint tilted axes
  ctx.save();ctx.strokeStyle=PAL['line'];ctx.setLineDash([2,4]);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx-up.x*90,cy-up.y*90);ctx.lineTo(cx+up.x*90,cy+up.y*90);ctx.moveTo(cx-out.x*80,cy-out.y*80);ctx.lineTo(cx+out.x*80,cy+out.y*80);ctx.stroke();ctx.restore();
  // weight and its components
  arrow(ctx,cx,cy,0,mg*sc,PAL['s2'],3);
  txt(ctx,(hon?'mg ':'Weight ')+mg.toFixed(0)+' N',cx+6,cy+mg*sc+12,{s:11*k,c:PAL['cv-ink']});
  if(F.th>0.01){arrow(ctx,cx,cy,-up.x*F.par*sc,-up.y*F.par*sc,PAL['s2'],2,[5,4]);arrow(ctx,cx,cy,-out.x*F.perp*sc,-out.y*F.perp*sc,PAL['s2'],2,[5,4]);
    txt(ctx,(hon?'mg sinθ ':'down slope ')+F.par.toFixed(0),cx-up.x*F.par*sc-4,cy-up.y*F.par*sc+14,{s:10.5*k,a:'right',c:PAL['cv-soft']});}
  // normal
  if(F.N>0.01){arrow(ctx,cx,cy,out.x*F.N*sc,out.y*F.N*sc,PAL['s3'],3);txt(ctx,'N '+F.N.toFixed(0)+' N',cx+out.x*F.N*sc-4,cy+out.y*F.N*sc-6,{s:11*k,a:'right',c:PAL['cv-ink']});}
  // friction (along the ramp; positive f points down-slope)
  if(Math.abs(s.f)>0.01){const L=-s.f*sc;arrow(ctx,cx+out.x*4,cy+out.y*4,up.x*L,up.y*L,PAL['s4'],3);txt(ctx,(hon?(Math.abs(s.v)<1e-9&&s.a===0?'f_s ':'f_k '):'friction ')+Math.abs(s.f).toFixed(0)+' N',cx+up.x*L+(L>0?6:-6),cy+up.y*L-6,{s:11*k,a:L>0?'left':'right',c:PAL['cv-ink']});}
  // pull
  if(F.F>0){const dx=(up.x*Math.cos(F.ph)+out.x*Math.sin(F.ph))*F.F*sc,dy=(up.y*Math.cos(F.ph)+out.y*Math.sin(F.ph))*F.F*sc;
    arrow(ctx,cx,cy,dx,dy,PAL['s1'],3);txt(ctx,(hon?'T ':'Pull ')+F.F.toFixed(0)+' N',cx+dx+4,cy+dy-4,{s:11*k,c:PAL['cv-ink']});}
  ctx.fillStyle=PAL['cv-ink'];ctx.beginPath();ctx.arc(cx,cy,5,0,6.29);ctx.fill();
  const net=s.a*F.m;txt(ctx,(hon?'F_net = ma = ':'Net force: ')+Math.abs(net).toFixed(1)+' N'+(Math.abs(net)<0.05?', balanced':(net>0?' down':' up')),X+12,Y+H-10,{s:11.5*k,w:700,c:PAL['s5']});}

SIM.thumbSetup=function(sim){BioLab.setValues(sim,{angle:32});};
BioLab.register(SIM);
})();
