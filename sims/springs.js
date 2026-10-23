(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,FONT,axes,legend,fmtNum}=BioLab.h;

/* Masses and springs. A mass m hangs from a spring (or two springs in series or parallel).
   y is the spring's stretch in meters, measured downward from its natural length.
   m·y'' = m·g − k_eff·y − b·y'   (integrated with RK4, so undamped motion conserves energy).
   Equilibrium stretch y_eq = mg/k_eff; period T = 2π√(m/k_eff), independent of amplitude and g. */
const PLANETS={earth:{g:9.8},moon:{g:1.62},mars:{g:3.71}};
const PXM=700,TOP=24,NAT=0.15,RULE=0.42; // px per meter, ceiling y, natural length drawn (m)
const SX=190; // spring x on stage
function g(sim){return PLANETS[sim.p.planet].g;}
function m(sim){return sim.p.mass/1000;}
function keff(sim){const k=sim.p.k,c=atLeast('honors')?sim.p.config:'single';return c==='series'?k/2:c==='parallel'?2*k:k;}
function yeq(sim){return m(sim)*g(sim)/keff(sim);}
function amp(sim){return (atLeast('honors')?sim.p.amp:8)/100;}
function release(sim){const s=sim.st;s.y=yeq(sim)+amp(sim);s.yref=s.y;s.v=0;s.th=0;s.lastCross=null;s.needRelease=false;s.held=0;s.E0=null;}
function stop(sim){const s=sim.st;s.y=yeq(sim);s.yref=s.y;s.v=0;s.th=0;s.lastCross=null;}
function acc(sim,y,v){return g(sim)-keff(sim)/m(sim)*y-sim.p.damp/m(sim)*v;}
function KE(sim){return 0.5*m(sim)*sim.st.v*sim.st.v;}
function UE(sim){return 0.5*keff(sim)*sim.st.y*sim.st.y;}
// gravitational PE = 0 at the release point (the lowest point of the motion), so all three energies are comparable
function UG(sim){return m(sim)*g(sim)*(sim.st.yref-sim.st.y);}
function paramChange(sim){const s=sim.st;if(!s)return;s.lastCross=null;s.pts=s.pts||[];}

const SPRINGS={
  id:'springs',hash:'springs',apUnit:6,order:2,tab:'Masses and springs',kind:'Simulation',
  card:'Hang masses on springs, measure how far they stretch, and time how fast they bounce.',
  title:'Masses and springs',
  lede:{bio:'Hang a mass on a spring and watch it stretch and bounce. Change the mass and the spring’s stiffness and see what changes the bounce.',
        honors:'Test Hooke’s law (F = kx), measure the period of oscillation, and connect springs in series and in parallel.',
        ap:'Analyze simple harmonic motion: x, v and a versus time, phase, energy in a vertical spring system, and T = 2π√(m/k).'},
  scale:'Real scale: the ruler is in centimeters, masses are in grams (100 g weighs about 1 N on Earth), and spring constants are in newtons per meter. A 50 N/m spring stretches about 2 cm for every 100 g.',
  timeScale:1,dtMax:0.002,prewarm:0,sampleDt:0.02,window:8,unit:'s',chChange:2,chReveal:9,
  controls:[
    {id:'mass',label:'Mass',type:'range',min:50,max:400,step:10,def:300,unit:' g',lvl:'bio',onChange:paramChange},
    {id:'k',label:'Spring stiffness k',type:'range',min:30,max:120,step:5,def:30,unit:' N/m',lvl:'bio',help:'The spring constant: how many newtons it takes to stretch the spring 1 m.',onChange:paramChange},
    {id:'damp',label:'Damping (air and friction)',type:'range',min:0,max:1,step:0.05,def:0,unit:' kg/s',d:2,lvl:'bio',help:'0 means no energy is lost, so the mass bounces forever.'},
    {id:'planet',label:'Location',type:'seg',def:'earth',lvl:'bio',options:[{v:'earth',l:'Earth'},{v:'moon',l:'Moon'},{v:'mars',l:'Mars',lvl:'honors'}],onChange:paramChange},
    {id:'amp',label:'Pull-down distance',type:'range',min:2,max:10,step:1,def:8,unit:' cm',lvl:'honors',help:'How far below the resting position you pull the mass before releasing it.',onChange(sim){if(sim.st)sim.st.needRelease=true;}},
    {id:'config',label:'Springs',type:'seg',def:'single',lvl:'honors',options:[{v:'single',l:'One spring'},{v:'series',l:'Two in series'},{v:'parallel',l:'Two in parallel'}],onChange:paramChange}
  ],
  actions:[
    {id:'release',label:'Pull down and release',primary:true,run(sim){release(sim);}},
    {id:'stop',label:'Stop at rest',run(sim){stop(sim);}}
  ],
  init(sim){const s={y:0,v:0,th:0,lastCross:null,period:0,pts:[],trace:[],held:0};sim.st=s;release(sim);s.period=0;return s;},
  step(sim,dt){const s=sim.st;if(s.needRelease)release(sim);
    const ye=yeq(sim),d0=s.y-ye,y=s.y,v=s.v;
    const k1v=acc(sim,y,v),k1y=v,k2v=acc(sim,y+k1y*dt/2,v+k1v*dt/2),k2y=v+k1v*dt/2,k3v=acc(sim,y+k2y*dt/2,v+k2v*dt/2),k3y=v+k2v*dt/2,k4v=acc(sim,y+k3y*dt,v+k3v*dt),k4y=v+k3v*dt;
    s.y=y+dt*(k1y+2*k2y+2*k3y+k4y)/6;s.v=v+dt*(k1v+2*k2v+2*k3v+k4v)/6;
    s.th+=sim.p.damp*0.5*(v*v+s.v*s.v)*dt;
    const d1=s.y-ye;
    if(d0<0&&d1>=0&&s.v>0.002){const tc=sim.t+dt*(-d0)/(d1-d0);if(s.lastCross!==null)s.period=tc-s.lastCross;s.lastCross=tc;}
    // record a Hooke's-law point once the mass hangs at rest
    if(Math.abs(s.v)<0.002&&Math.abs(d1)<0.0004){s.held+=dt;if(s.held>0.3){const F=m(sim)*g(sim),ke=keff(sim);if(!s.pts.some(p=>Math.abs(p.F-F)<1e-6&&Math.abs(p.k-ke)<1e-6)){s.pts.push({x:s.y*100,F,k:ke});if(s.pts.length>24)s.pts.shift();}}}else s.held=0;
    s.tr=(s.tr||0)+dt;if(s.tr>=0.02){s.tr=0;s.trace.push([sim.t,s.y]);if(s.trace.length>260)s.trace.shift();}},
  metrics:[
    {id:'stretch',label:'Spring stretch',unit:'cm',lvl:'bio',min:0,max:null,d:1,get:s=>s.st.y*100},
    {id:'speed',label:'Speed',unit:'m/s',lvl:'bio',min:0,max:null,d:2,get:s=>Math.abs(s.st.v)},
    {id:'period',label:'Measured period (one bounce)',unit:'s',lvl:'bio',min:0,max:null,d:2,get:s=>s.st.period},
    {id:'eq',label:'Stretch at rest (mg/k)',unit:'cm',lvl:'honors',min:0,max:null,d:1,get:s=>yeq(s)*100},
    {id:'disp',label:'Displacement x from rest position (down +)',unit:'cm',lvl:'honors',min:null,max:null,d:1,get:s=>(s.st.y-yeq(s))*100},
    {id:'fs',label:'Spring force (kx)',unit:'N',lvl:'honors',min:0,max:null,d:2,get:s=>keff(s)*s.st.y},
    {id:'keff',label:'Effective k',unit:'N/m',lvl:'honors',min:0,max:null,d:0,get:s=>keff(s)},
    {id:'ke',label:'Kinetic energy',unit:'J',lvl:'honors',min:0,max:null,d:3,get:s=>KE(s)},
    {id:'ue',label:'Elastic (spring) energy',unit:'J',lvl:'honors',min:0,max:null,d:3,get:s=>UE(s)},
    {id:'ug',label:'Gravitational energy',unit:'J',lvl:'honors',min:0,max:null,d:3,get:s=>UG(s)},
    {id:'th',label:'Thermal energy',unit:'J',lvl:'honors',min:0,max:null,d:3,get:s=>s.st.th},
    {id:'tot',label:'Total energy',unit:'J',lvl:'honors',min:0,max:null,d:3,get:s=>KE(s)+UE(s)+UG(s)+s.st.th},
    {id:'tpred',label:'Predicted period 2π√(m/k)',unit:'s',lvl:'ap',min:0,max:null,d:3,get:s=>2*Math.PI*Math.sqrt(m(s)/keff(s))},
    {id:'vel',label:'Velocity (down +)',unit:'m/s',lvl:'ap',min:null,max:null,d:3,get:s=>s.st.v},
    {id:'acc',label:'Acceleration (down +)',unit:'m/s²',lvl:'ap',min:null,max:null,d:2,get:s=>acc(s,s.st.y,s.st.v)}
  ],
  graphs:[{id:'stretchg',label:'Stretch vs. time',lines:['stretch']},{id:'hooke',label:'Hooke’s law: spring force vs. stretch',custom:true},
    {id:'energyg',label:'Energy vs. time',lvl:'honors',lines:['th','ug','ke','tot','ue'],yl:'Energy (J)'},{id:'shm',label:'x, v and a vs. time',lvl:'ap',custom:true}],
  defaultGraph:'stretchg',
  plot(sim,ctx,box,id){const s=sim.st;
    if(id==='hooke'){const ke=keff(sim),maxX=Math.max(30,...s.pts.map(p=>p.x),s.y*100)*1.1,maxF=Math.max(ke*maxX/100,...s.pts.map(p=>p.F))*1.05;
      box.T=34;box.H=box.ch-34-40;
      const ax=axes(ctx,box,{xmin:0,xmax:maxX,ymin:0,ymax:maxF,xl:'Stretch (cm)',yl:'Force (N)'});
      ctx.strokeStyle=PAL.s2;ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(0));ctx.lineTo(ax.X(maxX),ax.Y(ke*maxX/100));ctx.stroke();ctx.setLineDash([]);
      s.pts.forEach(p=>{const cur=Math.abs(p.k-ke)<1e-6;ctx.fillStyle=cur?PAL.s3:PAL.muted;ctx.globalAlpha=cur?1:0.5;ctx.beginPath();ctx.arc(ax.X(p.x),ax.Y(p.F),6,0,6.29);ctx.fill();});ctx.globalAlpha=1;
      if(s.y>0){ctx.fillStyle=PAL.s1;ctx.beginPath();ctx.arc(ax.X(s.y*100),ax.Y(ke*s.y),5,0,6.29);ctx.fill();}
      legend(ctx,box.L,14,[{label:'F = kx, slope k = '+fmtNum(ke,0)+' N/m',color:PAL.s2,dash:true},{label:'Weight mg at rest (one dot per mass)',color:PAL.s3},{label:'Right now',color:PAL.s1}]);
      if(!s.pts.length)txt(ctx,'Turn up damping or press Stop at rest: each mass at rest adds a data point.',box.L+box.W/2,box.T+box.H/2,{s:13,c:PAL.muted,a:'center'});
      return;}
    // shm: three stacked panels
    const tr=s.trace;if(tr.length<2){txt(ctx,'Collecting data…',box.L+box.W/2,box.T+box.H/2,{s:14,c:PAL.muted,a:'center'});return;}
    const t1=tr[tr.length-1][0],t0=Math.max(tr[0][0],t1-4),ye=yeq(sim),ke=keff(sim),mm=m(sim),b=sim.p.damp;
    const rows=tr.filter(r=>r[0]>=t0);const xs=rows.map(r=>(r[1]-ye)*100);
    const vs=rows.map((r,i)=>{const a=rows[Math.max(0,i-1)],c=rows[Math.min(rows.length-1,i+1)];return c[0]>a[0]?(c[1]-a[1])/(c[0]-a[0]):0;});
    const as=rows.map((r,i)=>g(sim)-ke/mm*r[1]-b/mm*vs[i]);
    const sets=[{n:'x (cm)',d:xs,c:PAL.s1},{n:'v (m/s)',d:vs,c:PAL.s2},{n:'a (m/s²)',d:as,c:PAL.s3}];
    const H3=(box.ch-12-40)/3;
    sets.forEach((st,j)=>{const lim=Math.max(1e-3,...st.d.map(Math.abs))*1.15;const b2={L:box.L,T:12+j*H3,W:box.W,H:H3-14,cw:box.cw,ch:j===2?box.ch:12+(j+1)*H3+4};
      const ax=axes(ctx,b2,{xmin:t0,xmax:Math.max(t1,t0+4),ymin:-lim,ymax:lim,xl:j===2?'Time (s)':'',xticks:j===2,yl:st.n});
      ctx.beginPath();rows.forEach((r,i)=>{const X=ax.X(r[0]),Y=ax.Y(st.d[i]);i?ctx.lineTo(X,Y):ctx.moveTo(X,Y);});ctx.strokeStyle=st.c;ctx.lineWidth=2.2;ctx.stroke();
      
      ctx.fillStyle=st.c;ctx.beginPath();ctx.arc(ax.X(t1),ax.Y(st.d[st.d.length-1]),4,0,6.29);ctx.fill();});
    txt(ctx,'x, v, a',14,12+H3*1.5,{s:1,c:'transparent'});},
  narrate(sim){const s=sim.st,ye=yeq(sim),d=s.y-ye,v=s.v,A=Math.abs(d),hon=atLeast('honors');const ke=keff(sim);
    if(Math.abs(v)<0.003&&A<0.0008)return '<b>Hanging at rest.</b> The spring stretches '+(ye*100).toFixed(1)+' cm, just enough that its upward pull ('+(ke*ye).toFixed(2)+' N) balances the weight ('+(m(sim)*g(sim)).toFixed(2)+' N).'+(hon?' Press “Pull down and release” to start it bouncing.':'');
    let msg;
    if(Math.abs(v)<0.04&&d>0)msg='<b>Lowest point.</b> The spring is stretched the most, so it pulls up harder than gravity pulls down. The mass stops and gets pulled back up.';
    else if(Math.abs(v)<0.04&&d<0)msg='<b>Highest point.</b> The spring pulls up less than the weight, so gravity wins and the mass stops and falls back down.';
    else if(A<0.006)msg='<b>Passing the rest position</b> at top speed ('+Math.abs(v).toFixed(2)+' m/s). The forces balance here, but the mass is moving, so it keeps going.';
    else msg=(d*v<0?'<b>Speeding up</b> toward the rest position: the net force points back toward it.':'<b>Slowing down</b> as it moves away from the rest position: the net force points back toward it.');
    if(hon&&s.period>0)msg+=' One full bounce takes '+s.period.toFixed(2)+' s.';
    if(sim.p.damp>0)msg+=' Damping is turning motion into thermal energy, so each bounce is smaller.';
    return msg;},
  tour:[
    {title:'The spring at rest',text:'The mass hangs at rest. The spring has stretched until its upward pull exactly balances the mass’s weight. Read the stretch on the ruler.',focus:[110,20,200,420],pause:true,setup(sim){stop(sim);}},
    {title:'Pull down and let go',text:'Pull the mass below its rest position and release it. Now the spring pulls up harder than gravity pulls down.',focus:[110,20,200,420],speed:0.2,setup(sim){release(sim);}},
    {title:'Over and back',text:'The mass speeds up toward the rest position, overshoots it, slows, stops and comes back. This repeating motion is an <b>oscillation</b>.',focus:[110,20,200,420],speed:0.35},
    {title:'The chart recorder',text:'A pen on the mass traces its position on moving paper. The smooth wave it draws is a <b>sine curve</b>: the signature of simple harmonic motion.',focus:[310,20,270,420],speed:0.6},
    {title:'Energy changes form',text:'Watch the bars: kinetic energy peaks at the rest position, spring energy peaks at the bottom. With no damping the total never changes.',focus:[592,8,200,434],speed:0.4},
    {title:'Heavier mass, slower bounce',text:'Double the mass. It stretches the spring twice as far and bounces more slowly: the period grows by √2 ≈ 1.4.',focus:[110,20,470,420],speed:0.6,setup(sim){BioLab.setValues(sim,{mass:400});release(sim);}},
    {lvl:'honors',title:'Springs in series and parallel',text:'Two springs in a row (series) act like a softer spring, k/2. Side by side (parallel) they act like a stiffer one, 2k.',focus:[110,20,200,420],speed:0.6,setup(sim){BioLab.setValues(sim,{mass:200,config:'parallel'});release(sim);}},
    {lvl:'ap',title:'Phase in SHM',text:'In the x, v, a graph, velocity leads position by a quarter cycle, and acceleration is always opposite to displacement: a = −(k/m)x.',focus:[110,20,470,420],speed:0.6,setup(sim){BioLab.setValues(sim,{config:'single'});release(sim);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mass:300,config:'single',damp:0});release(sim);},
  challenges:[
    {lvl:'bio',q:'A 100 g mass hangs at rest on the spring. What happens to the stretch when you switch to a 200 g mass?',choices:['It stays the same','It doubles','It is four times as big'],correct:1,
     baseline:{mass:100,k:50,damp:1,planet:'earth'},baselineAction:'stop',change:{mass:200},changeText:'Mass doubled to 200 g',watch:'stretchg',at:1.5,reveal:7,
     explain:'Hooke’s law: the stretch is proportional to the force. Twice the weight stretches the spring twice as far (about 2 cm to about 4 cm here).'},
    {lvl:'bio',q:'The mass is bouncing. What happens when you swap in a stiffer spring (30 → 120 N/m)?',choices:['It bounces faster','It bounces slower','No change'],correct:0,
     baseline:{mass:200,k:30,damp:0},baselineAction:'release',change:{k:120},changeText:'Stiffer spring',watch:'stretchg',at:2.5,reveal:8,
     explain:'A stiffer spring pulls back harder for the same stretch, so it accelerates the mass more and each bounce takes less time.'},
    {lvl:'bio',q:'Hang a heavier mass (100 g → 400 g) on the same bouncing spring. What happens to the bounce?',choices:['Faster','Slower','No change'],correct:1,
     baseline:{mass:100,k:50,damp:0},baselineAction:'release',change:{mass:400},changeText:'Heavier mass',watch:'stretchg',at:2.5,reveal:8,
     explain:'More mass has more inertia, so the same spring force accelerates it less. Four times the mass doubles the period.'},
    {lvl:'honors',q:'Release the mass from 3 cm, then from 10 cm. How does the period change?',choices:['Longer for the bigger pull','Shorter for the bigger pull','About the same'],correct:2,
     baseline:{mass:200,k:50,damp:0,amp:3},change:{amp:10},changeText:'Released from 10 cm',watch:'stretchg',at:2.5,reveal:8,
     explain:'A bigger pull means a bigger force and higher speeds, but also farther to travel. They cancel exactly: T = 2π√(m/k) has no amplitude in it. Compare the measured period before and after.'},
    {lvl:'honors',q:'Double the mass on a bouncing spring (200 g → 400 g). The new period is about…',choices:['2 times as long','1.4 times as long','The same'],correct:1,
     baseline:{mass:200,k:50,damp:0,amp:6},change:{mass:400},changeText:'Mass doubled',watch:'stretchg',at:2.5,reveal:8,
     explain:'T = 2π√(m/k), so doubling m multiplies T by √2 ≈ 1.41 (0.40 s → 0.56 s here).'},
    {lvl:'honors',q:'Replace one spring with two identical springs hung one below the other (series). The bounce becomes…',choices:['Faster','Slower','The same'],correct:1,
     baseline:{mass:200,k:50,damp:0,amp:6,config:'single'},change:{config:'series'},changeText:'Two springs in series',watch:'stretchg',at:2.5,reveal:8,
     explain:'Each spring carries the full weight, so each stretches as much as the single spring did. The total stretch doubles, so the pair acts like k/2 and the period grows by √2.'},
    {lvl:'ap',q:'No damping. As the mass oscillates, what does the total energy (kinetic + elastic + gravitational) do?',choices:['It rises and falls with the motion','It stays constant','It slowly decreases'],correct:1,
     baseline:{mass:200,k:50,damp:0,amp:8},changeText:'Watch the energies',watch:'energyg',at:0.5,reveal:5,
     explain:'Only conservative forces act, so energy just moves between kinetic, elastic and gravitational forms. The total line is flat.'},
    {lvl:'ap',q:'Take the same bouncing spring to the Moon. What happens to the period?',choices:['Longer, because gravity is weaker','Shorter','It does not change'],correct:2,
     baseline:{mass:200,k:50,damp:0,amp:6,planet:'earth'},change:{planet:'moon'},changeText:'Now on the Moon',watch:'stretchg',at:2.5,reveal:8,
     explain:'Gravity only sets where the rest position is (mg/k). The restoring force about that point is −kx no matter what g is, so T = 2π√(m/k) is unchanged. A pendulum is different.'},
    {lvl:'ap',instant:true,q:'At the lowest point of the oscillation, which statement is true?',choices:['Velocity and acceleration are both zero','Velocity is zero and acceleration is maximum, pointing up','Velocity is maximum and acceleration is zero'],correct:1,
     explain:'At the turning point the mass is momentarily at rest, but the displacement is greatest, so a = −(k/m)x is greatest and points back toward equilibrium (up).'}
  ],
  lab:{bio:'<p><b>Question:</b> How does mass affect how far a spring stretches?</p><ol><li>Set damping to 1 so the mass settles quickly.</li><li>For 100, 200, 300, 400 and 500 g, wait until the mass is still, then Record trial.</li><li>Plot mass (x) against spring stretch (y).</li></ol><p>Describe the pattern. What happens to the stretch when the mass doubles?</p>',
       honors:'<p><b>Question:</b> What is this spring’s constant k, and what sets the period?</p><ol><li>With damping at 1, record the stretch at rest for five masses. Open the Hooke’s law graph: the slope is k.</li><li>Set damping to 0. For each mass, release and record the measured period.</li><li>Plot period against mass, then period² against mass.</li></ol><p>Which plot is a straight line? Use its slope to find k and compare with the setting.</p>',
       ap:'<p><b>Question:</b> Does T = 2π√(m/k) hold for vertical springs in series and parallel?</p><ol><li>Measure T for one spring, two in series and two in parallel at the same mass.</li><li>Compute k_eff = 4π²m/T² for each.</li><li>Repeat on the Moon.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain the effective spring constants and why g does not change the period.</p>'},
  terms:[{t:'Spring constant k',d:'How stiff a spring is, in N/m.'},{t:'Hooke’s law',d:'Spring force is proportional to stretch: F = kx.'},{t:'Equilibrium (rest position)',d:'Where the spring’s pull balances the weight.'},{t:'Period',d:'Time for one complete bounce, down and back.'},{t:'Oscillation',d:'Motion that repeats back and forth around a rest position.'},
    {lvl:'honors',t:'Amplitude',d:'The farthest the mass moves from its rest position.'},{lvl:'honors',t:'Elastic potential energy',d:'Energy stored in a stretched spring: ½kx².'},{lvl:'honors',t:'Series and parallel',d:'Series: k_eff = k/2 for two identical springs. Parallel: k_eff = 2k.'},
    {lvl:'ap',t:'Simple harmonic motion',d:'Motion where a = −ω²x, giving x = A cos(ωt + φ) with ω = √(k/m).'},{lvl:'ap',t:'Phase',d:'Where in its cycle the motion is. Velocity leads position by a quarter cycle.'},{lvl:'ap',t:'Damping',d:'A force opposite the velocity (−bv) that removes mechanical energy.'}],
  about:'<p>The mass obeys Newton’s second law: m·a = mg − k·y − b·v, where y is the stretch from the spring’s natural length and b is the damping coefficient. The equation is solved with a fourth-order Runge–Kutta method in 2 ms steps, so undamped energy stays constant to better than 0.01%.</p><p>Two identical springs in series act as k/2; in parallel, as 2k. The springs themselves are massless and perfectly elastic. Gravitational potential energy is measured from the release point (the lowest point of the motion); elastic energy is ½ky² from the natural length.</p><p>The period is measured, not calculated: the time between successive downward passes through the rest position.</p>',
  initVis(sim){},
  draw(sim,ctx,vdt,k,tv){const s=sim.st,hon=atLeast('honors'),ap=atLeast('ap');k=Math.min(k,1.3);
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    const Y=y=>TOP+(NAT+y)*PXM,ye=yeq(sim),cfg=hon?sim.p.config:'single';
    // ceiling
    ctx.fillStyle=PAL['cv-lamp'];ctx.fillRect(60,TOP-14,520,14);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();for(let x=64;x<580;x+=12){ctx.moveTo(x,TOP-14);ctx.lineTo(x+8,TOP-22);}ctx.stroke();
    // ruler (zero at the natural-length point)
    const RX=262;ctx.fillStyle=PAL['cv-ruler'];rr(ctx,RX,Y(0)-10,40,RULE*PXM+14,4);ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.stroke();
    for(let c=0;c<=Math.round(RULE*100);c++){const yy=Y(c/100);const L=c%10===0?14:c%5===0?9:5;ctx.beginPath();ctx.moveTo(RX,yy);ctx.lineTo(RX+L,yy);ctx.stroke();if(c%10===0)txt(ctx,String(c),RX+38,yy+4,{s:10.5*k,a:'right',c:PAL['cv-ink']});}
    txt(ctx,'cm',RX+20,Y(0)-14,{s:10.5*k,a:'center',c:PAL['cv-soft']});
    // natural length and equilibrium lines
    ctx.setLineDash([5,4]);ctx.lineWidth=1.5;ctx.strokeStyle=PAL['cv-soft'];ctx.beginPath();ctx.moveTo(60,Y(0));ctx.lineTo(RX,Y(0));ctx.stroke();
    ctx.strokeStyle=PAL.s3;ctx.beginPath();ctx.moveTo(120,Y(ye));ctx.lineTo(575,Y(ye));ctx.stroke();ctx.setLineDash([]);
    {const yb0=Y(s.y),fs0=keff(sim)*s.y,ly=yb0+10+(12+sim.p.mass/400*30)/2-Math.min(150,fs0*26)-4;if(!hon||Math.abs(ly-(Y(0)-5))>18*k)txt(ctx,'unstretched',64,Y(0)-5,{s:10.5*k,c:PAL['cv-soft']});}
    txt(ctx,'rest position',575,Y(ye)-5,{s:11*k,c:PAL.s3,a:'right',w:600});
    // springs
    const yb=Y(s.y);const coil=(x,y0,y1,n,w,col)=>{ctx.strokeStyle=col;ctx.lineWidth=2.4;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(x,y0);const L=y1-y0,lead=Math.min(8,L*0.12);ctx.lineTo(x,y0+lead);
      for(let i=0;i<=n*2;i++){const yy=y0+lead+(L-2*lead)*i/(n*2);ctx.lineTo(x+(i===0||i===n*2?0:(i%2?w:-w)),yy);}ctx.lineTo(x,y1);ctx.stroke();};
    const sc=PAL.s2;
    if(cfg==='parallel'){ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(SX-24,yb-10);ctx.lineTo(SX+24,yb-10);ctx.stroke();
      coil(SX-24,TOP,yb-10,8,9,sc);coil(SX+24,TOP,yb-10,8,9,sc);ctx.beginPath();ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.moveTo(SX,yb-10);ctx.lineTo(SX,yb);ctx.stroke();}
    else if(cfg==='series'){const mid=(TOP+yb)/2;coil(SX,TOP,mid-4,6,13,sc);ctx.fillStyle=PAL['cv-ink'];ctx.beginPath();ctx.arc(SX,mid,4,0,6.29);ctx.fill();coil(SX,mid+4,yb,6,13,PAL.s5);}
    else coil(SX,TOP,yb,10,15,sc);
    // hanger + slotted mass (size grows with mass)
    const mm=sim.p.mass,hh=12+mm/400*30,ww=34+mm/400*20;
    ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(SX,yb+5,5,-Math.PI/2,Math.PI*1.2);ctx.stroke();
    ctx.fillStyle='#6d737c';rr(ctx,SX-ww/2,yb+10,ww,hh,4);ctx.fill();ctx.strokeStyle='#3d4148';ctx.lineWidth=1;for(let i=1;i<Math.round(mm/50);i++){const yy=yb+10+hh*i/Math.round(mm/50);ctx.beginPath();ctx.moveTo(SX-ww/2,yy);ctx.lineTo(SX+ww/2,yy);ctx.stroke();}
    txt(ctx,mm+' g',SX,yb+10+hh/2+4,{s:12*k,w:700,a:'center',c:'#fff'});
    // pointer to ruler
    ctx.strokeStyle=PAL.s1;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(SX+ww/2,yb);ctx.lineTo(RX,yb);ctx.stroke();ctx.fillStyle=PAL.s1;ctx.beginPath();ctx.moveTo(RX,yb);ctx.lineTo(RX-7,yb-4);ctx.lineTo(RX-7,yb+4);ctx.fill();
    // force arrows (Honors)
    if(hon){const fs=keff(sim)*s.y,W=m(sim)*g(sim),fsc=26;const ax=SX-ww/2-22;
      const arrow=(x,y0,len,col,lab)=>{if(Math.abs(len)<2)return;ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=3.5;ctx.beginPath();ctx.moveTo(x,y0);ctx.lineTo(x,y0+len);ctx.stroke();const d=Math.sign(len);ctx.beginPath();ctx.moveTo(x,y0+len+d*2);ctx.lineTo(x-6,y0+len-d*8);ctx.lineTo(x+6,y0+len-d*8);ctx.fill();txt(ctx,lab,x+(d<0?-6:6),y0+len+(d<0?-4:14),{s:11*k,w:700,c:col,a:d<0?'right':'left'});};
      arrow(ax,yb+10+hh/2,-Math.min(150,fs*fsc),PAL.s2,'kx '+fs.toFixed(1)+' N');arrow(ax+10,yb+10+hh/2,Math.min(150,W*fsc),PAL.s4,'mg '+W.toFixed(1)+' N');}
    // chart recorder: paper scrolls right from the pen
    const PX0=318,PX1=578;ctx.fillStyle=PAL.card;ctx.fillRect(PX0,Y(-0.11),PX1-PX0,Y(RULE)-Y(-0.11));ctx.strokeStyle=PAL.line;ctx.lineWidth=1;ctx.strokeRect(PX0,Y(-0.11),PX1-PX0,Y(RULE)-Y(-0.11));
    const pps=110,now=sim.t;ctx.strokeStyle=PAL.line;ctx.beginPath();for(let sec=Math.ceil(now-4);sec<=now;sec++){const x=PX0+(now-sec)*pps;if(x>PX0&&x<PX1){ctx.moveTo(x,Y(-0.11));ctx.lineTo(x,Y(RULE));}}ctx.stroke();
    ctx.save();ctx.beginPath();ctx.rect(PX0,Y(-0.11),PX1-PX0,Y(RULE)-Y(-0.11));ctx.clip();ctx.strokeStyle=PAL.s1;ctx.lineWidth=2.2;ctx.beginPath();let first=true;
    for(let i=s.trace.length-1;i>=0;i--){const x=PX0+(now-s.trace[i][0])*pps;if(x>PX1+5)break;const yy=Y(s.trace[i][1]);first?ctx.moveTo(x,yy):ctx.lineTo(x,yy);first=false;}ctx.stroke();ctx.restore();
    ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(RX+40,yb);ctx.lineTo(PX0,yb);ctx.stroke();ctx.fillStyle=PAL.s1;ctx.beginPath();ctx.arc(PX0,yb,4,0,6.29);ctx.fill();
    txt(ctx,'← now    paper moves right    1 s per line →',PX0+4,Y(RULE)+16,{s:10.5*k,c:PAL['cv-soft']});
    if(s.period>0)pill(ctx,'Period '+s.period.toFixed(2)+' s',448,40,PAL.s5,'#fff',11.5*k);
    // energy panel
    ctx.fillStyle=PAL.card;rr(ctx,592,8,200,434,10);ctx.fill();ctx.strokeStyle=PAL.line;ctx.lineWidth=1;ctx.stroke();
    txt(ctx,'Energy (J)',692,30,{s:13*k,w:700,a:'center'});
    const vals=[KE(sim),UE(sim),UG(sim),s.th,KE(sim)+UE(sim)+UG(sim)+s.th],labs=k>1.15?['KE','Spring','Grav.','Heat','Total']:['Kinetic','Spring','Gravity','Thermal','Total'],cols=[PAL.s3,PAL.s5,PAL.s2,PAL.s1,PAL.s4];
    s.emax=Math.max(s.emax&&s.emaxM===sim.p.mass+'/'+keff(sim)+sim.p.planet?s.emax:0,vals[4]*1.12,0.05);s.emaxM=sim.p.mass+'/'+keff(sim)+sim.p.planet;
    const top=60,bot=400,hs=(bot-top)/s.emax;ctx.strokeStyle=PAL.line;ctx.beginPath();ctx.moveTo(600,bot);ctx.lineTo(786,bot);ctx.stroke();
    vals.forEach((e,i)=>{const x=602+i*37,h=Math.max(0,e)*hs;ctx.fillStyle=cols[i];ctx.fillRect(x,bot-h,28,h);txt(ctx,e.toFixed(2),x+14,bot-h-5,{s:10*k,w:600,a:'center'});txt(ctx,labs[i],x+14,bot+16,{s:9.5*k,a:'center',c:PAL['cv-soft']});});
    txt(ctx,'gravity PE = 0 at the release point',692,436,{s:9.5*k,a:'center',c:PAL['cv-soft']});
    txt(ctx,(cfg==='series'?'two springs in series, k_eff = k/2':cfg==='parallel'?'two springs in parallel, k_eff = 2k':'k = '+sim.p.k+' N/m'),20,440,{s:11*k,c:PAL['cv-soft']});
  }
};
BioLab.register(SPRINGS);
})();
