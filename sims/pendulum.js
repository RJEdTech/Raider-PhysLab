(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,FONT,axes,legend,fmtNum}=BioLab.h;

/* Pendulum lab. A point bob on a massless string of length L.
   θ'' = −(g/L)·sin θ − (b/m)·θ'   (full nonlinear equation, RK4, 2 ms steps).
   Small-angle period T₀ = 2π√(L/g); at larger amplitudes the true period is longer:
   T ≈ T₀(1 + θ₀²/16 + 11θ₀⁴/3072). The photogate and stopwatch measure the model's period. */
const PLANETS={earth:{g:9.8,l:'Earth'},moon:{g:1.62,l:'Moon'},mars:{g:3.71,l:'Mars'},jupiter:{g:24.8,l:'Jupiter'},x:{g:6.37,l:'Planet X'}};
const PX=300,PY=40,RAD=Math.PI/180;
function g(sim){return PLANETS[sim.p.planet].g;}
function mkg(sim){return sim.p.mass/1000;}
function T0(sim){return 2*Math.PI*Math.sqrt(sim.p.L/g(sim));}
function Tlarge(sim){const a=sim.p.theta*RAD;return T0(sim)*(1+a*a/16+11*Math.pow(a,4)/3072);}
function release(sim){const s=sim.st;s.th=sim.p.theta*RAD;s.w=0;s.heat=0;s.last=null;s.needRelease=false;s.ghost=[];s.gt=0;s.sw={state:'idle',t0:0,n:0,total:0};}
function acc(sim,th,w){return -g(sim)/sim.p.L*Math.sin(th)-sim.p.damp/mkg(sim)*w;}
function KE(sim){const v=sim.p.L*sim.st.w;return 0.5*mkg(sim)*v*v;}
function PE(sim){return mkg(sim)*g(sim)*sim.p.L*(1-Math.cos(sim.st.th));}
function scale(sim){const amp=Math.max(sim.p.theta,20)*RAD;return Math.min(310,350/sim.p.L,245/(sim.p.L*Math.sin(Math.min(amp,Math.PI/2))));}
function swText(sim){const w=sim.st.sw;if(w.state==='idle')return 'Press “Time 10 swings”';if(w.state==='armed')return 'Waiting for the bob to pass the gate…';
  if(w.state==='running')return 'Swing '+(w.n+1)+' of 10 · '+(sim.t-w.t0).toFixed(2)+' s';return '10 swings in '+w.total.toFixed(2)+' s';}

const PEND={
  id:'pendulum',hash:'pendulum',apUnit:6,order:1,tab:'Pendulum lab',kind:'Virtual lab',
  card:'Time a pendulum with a stopwatch and a photogate, and discover what does (and doesn’t) change its period.',
  title:'Pendulum lab',
  lede:{bio:'Swing a pendulum and time it. Change the length, the mass, the starting angle and even the planet. Which ones change how long a swing takes?',
        honors:'Measure the period with a photogate, compare it with T = 2π√(L/g), and collect T vs. L data to find g from a straight-line graph.',
        ap:'Test the small-angle approximation: the full equation of motion gives a period that grows with amplitude. Linearize T² vs. L to measure g on Planet X.'},
  scale:'Real scale: string lengths are in meters (a 1 m pendulum on Earth takes about 2 s per swing), masses in grams, and angles in degrees from straight down.',
  timeScale:1,dtMax:0.002,prewarm:0,sampleDt:0.02,window:12,unit:'s',chChange:4,chReveal:14,
  controls:[
    {id:'L',label:'String length',type:'range',min:0.1,max:2,step:0.05,def:1,unit:' m',d:2,lvl:'bio',onChange(sim){if(sim.st)sim.st.needRelease=true;}},
    {id:'mass',label:'Bob mass',type:'range',min:50,max:1000,step:50,def:200,unit:' g',lvl:'bio'},
    {id:'theta',label:'Starting angle',type:'range',min:5,max:80,step:5,def:15,unit:'°',lvl:'bio',onChange(sim){if(sim.st)sim.st.needRelease=true;}},
    {id:'planet',label:'Location',type:'select',def:'earth',lvl:'bio',options:[{v:'earth',l:'Earth (g = 9.8 m/s²)'},{v:'moon',l:'Moon (g = 1.62 m/s²)'},{v:'mars',l:'Mars (g = 3.71 m/s²)',lvl:'honors'},{v:'jupiter',l:'Jupiter (g = 24.8 m/s²)',lvl:'honors'},{v:'x',l:'Planet X (g = ?)',lvl:'ap'}],
      onChange(sim){if(sim.st)sim.st.last=null;}},
    {id:'damp',label:'Air resistance',type:'range',min:0,max:0.2,step:0.01,def:0,unit:' kg/s',d:2,lvl:'bio',help:'0 means no air resistance, so the pendulum swings forever.'}
  ],
  actions:[
    {id:'release',label:'Release from the starting angle',primary:true,run(sim){release(sim);}},
    {id:'time10',label:'Time 10 swings',run(sim){sim.st.sw={state:'armed',t0:0,n:0,total:0};}}
  ],
  init(sim){const s={};sim.st=s;release(sim);s.period=0;s.gate=0;return s;},
  step(sim,dt){const s=sim.st;if(s.needRelease)release(sim);
    const th=s.th,w=s.w;
    const a1=acc(sim,th,w),b1=w,a2=acc(sim,th+b1*dt/2,w+a1*dt/2),b2=w+a1*dt/2,a3=acc(sim,th+b2*dt/2,w+a2*dt/2),b3=w+a2*dt/2,a4=acc(sim,th+b3*dt,w+a3*dt),b4=w+a3*dt;
    s.th=th+dt*(b1+2*b2+2*b3+b4)/6;s.w=w+dt*(a1+2*a2+2*a3+a4)/6;
    const v0=sim.p.L*w,v1=sim.p.L*s.w;s.heat+=sim.p.damp*0.5*(v0*v0+v1*v1)*dt;
    if(Math.abs(s.th)<0.02)s.gate=sim.t;
    if(th<0&&s.th>=0&&s.w>0){const tc=sim.t+dt*(-th)/(s.th-th);
      if(s.last!==null)s.period=tc-s.last;s.last=tc;
      const sw=s.sw;if(sw.state==='armed'){sw.state='running';sw.t0=tc;sw.n=0;}else if(sw.state==='running'){sw.n++;if(sw.n>=10){sw.state='done';sw.total=tc-sw.t0;}}}
    s.gt+=dt;if(s.gt>=0.1){s.gt=0;s.ghost.push(s.th);if(s.ghost.length>14)s.ghost.shift();}},
  metrics:[
    {id:'angle',label:'Angle',unit:'°',lvl:'bio',min:null,max:null,d:1,get:s=>s.st.th/RAD},
    {id:'speed',label:'Speed',unit:'m/s',lvl:'bio',min:0,max:null,d:2,get:s=>Math.abs(s.p.L*s.st.w)},
    {id:'period',label:'Period (photogate)',unit:'s',lvl:'bio',min:0,max:null,d:3,get:s=>s.st.period},
    {id:'swt',label:'Stopwatch: 10 swings ÷ 10',unit:'s',lvl:'bio',min:0,max:null,d:3,get:s=>s.st.sw.state==='done'?s.st.sw.total/10:0},
    {id:'sw',label:'Stopwatch',unit:'',lvl:'bio',text:true,noTrial:true,get:s=>swText(s)},
    {id:'t2',label:'Period squared (T²)',unit:'s²',lvl:'honors',min:0,max:null,d:3,get:s=>s.st.period*s.st.period},
    {id:'t0',label:'Predicted T = 2π√(L/g)',unit:'s',lvl:'honors',min:0,max:null,d:3,get:s=>s.p.planet==='x'?NaN:T0(s)},
    {id:'ke',label:'Kinetic energy',unit:'J',lvl:'honors',min:0,max:null,d:3,get:s=>KE(s)},
    {id:'pe',label:'Potential energy',unit:'J',lvl:'honors',min:0,max:null,d:3,get:s=>PE(s)},
    {id:'heat',label:'Thermal energy',unit:'J',lvl:'honors',min:0,max:null,d:3,get:s=>s.st.heat},
    {id:'tot',label:'Total energy (incl. thermal)',unit:'J',lvl:'honors',min:0,max:null,d:3,get:s=>KE(s)+PE(s)+s.st.heat},
    {id:'tl',label:'Large-angle prediction',unit:'s',lvl:'ap',min:0,max:null,d:3,get:s=>s.p.planet==='x'?NaN:Tlarge(s)},
    {id:'dev',label:'Measured vs. small-angle T',unit:'%',lvl:'ap',min:null,max:null,d:1,get:s=>s.p.planet==='x'?NaN:s.st.period>0?(s.st.period/T0(s)-1)*100:0},
    {id:'gm',label:'g from your period (4π²L/T²)',unit:'m/s²',lvl:'ap',min:0,max:null,d:2,get:s=>s.st.period>0?4*Math.PI*Math.PI*s.p.L/(s.st.period*s.st.period):0}
  ],
  graphs:[{id:'angleg',label:'Angle vs. time',lines:['angle']},{id:'energyg',label:'Energy vs. time',lvl:'honors',lines:['heat','pe','ke','tot'],yl:'Energy (J)'},{id:'fit',label:'T² vs. L from your trials (best-fit line)',lvl:'honors',custom:true}],
  defaultGraph:'angleg',
  plot(sim,ctx,box,id){const pts=(sim.trials||[]).map(r=>[+r.L,+r.t2,r.planet]).filter(p=>Number.isFinite(p[0])&&Number.isFinite(p[1])&&p[1]>0&&p[2]===sim.p.planet);
    box.T=34;box.H=box.ch-34-40;
    const xmax=Math.max(2,...pts.map(p=>p[0]))*1.05,ymax=Math.max(4*Math.PI*Math.PI*2/g(sim)*0.3,...pts.map(p=>p[1]))*1.1;
    const ax=axes(ctx,box,{xmin:0,xmax,ymin:0,ymax,xl:'String length L (m)',yl:'T² (s²)'});
    if(pts.length<2){txt(ctx,'Record trials at several lengths ('+PLANETS[sim.p.planet].l+'), then come back here.',box.L+box.W/2,box.T+box.H/2,{s:13,c:PAL.muted,a:'center'});
      pts.forEach(p=>{ctx.fillStyle=PAL.s2;ctx.beginPath();ctx.arc(ax.X(p[0]),ax.Y(p[1]),6,0,6.29);ctx.fill();});
      legend(ctx,box.L,14,[{label:'Your trials (photogate T²)',color:PAL.s2}]);return;}
    const n=pts.length,sx=pts.reduce((a,p)=>a+p[0],0),sy=pts.reduce((a,p)=>a+p[1],0),sxx=pts.reduce((a,p)=>a+p[0]*p[0],0),sxy=pts.reduce((a,p)=>a+p[0]*p[1],0);
    const den=n*sxx-sx*sx;const slope=den>1e-9?(n*sxy-sx*sy)/den:sy/sx,b=(sy-slope*sx)/n;
    ctx.strokeStyle=PAL.s1;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(b));ctx.lineTo(ax.X(xmax),ax.Y(b+slope*xmax));ctx.stroke();
    pts.forEach(p=>{ctx.fillStyle=PAL.s2;ctx.beginPath();ctx.arc(ax.X(p[0]),ax.Y(p[1]),6,0,6.29);ctx.fill();});
    const gfit=4*Math.PI*Math.PI/slope;
    legend(ctx,box.L,14,[{label:'Your trials',color:PAL.s2},{label:'Best fit: slope '+slope.toFixed(2)+' s²/m → g = 4π²/slope = '+(Number.isFinite(gfit)?gfit.toFixed(2):'?')+' m/s²',color:PAL.s1}]);},
  narrate(sim){const s=sim.st,deg=s.th/RAD,amax=Math.max(1,Math.abs(sim.p.theta)),v=Math.abs(sim.p.L*s.w),hon=atLeast('honors'),ap=atLeast('ap');
    let msg;
    if(v<0.02&&Math.abs(deg)<0.5)msg='<b>Hanging straight down at rest.</b> With no push, nothing happens. Press Release to start it swinging.';
    else if(Math.abs(s.w)<0.05)msg='<b>End of the swing.</b> The bob stops for an instant. Gravity’s pull along the arc is strongest here, so it starts back toward the bottom.';
    else if(Math.abs(deg)<amax*0.12)msg='<b>Through the bottom</b> at top speed ('+v.toFixed(2)+' m/s). Gravity has no sideways pull here, so the bob coasts through and climbs the other side.';
    else msg=(s.th*s.w<0?'<b>Swinging down:</b> potential energy is turning into kinetic energy, so the bob speeds up.':'<b>Swinging up:</b> kinetic energy is turning back into potential energy, so the bob slows down.');
    if(s.period>0)msg+=' Each full swing takes '+s.period.toFixed(2)+' s'+(hon?' (prediction: '+T0(sim).toFixed(2)+' s).':'.');
    if(ap&&sim.p.theta>=40)msg+=' At '+sim.p.theta+'°, the small-angle formula is too short by about '+((Tlarge(sim)/T0(sim)-1)*100).toFixed(0)+'%.';
    if(sim.p.damp>0)msg+=' Air resistance is slowly shrinking each swing.';
    return msg;},
  tour:[
    {title:'The pendulum',text:'A bob hangs on a string from the pivot. The protractor measures its angle from straight down; the meter stick on the left shows the string’s length.',focus:[20,20,560,410],pause:true},
    {title:'Gravity pulls it back',text:'Released from the side, gravity pulls the bob back toward the bottom. In slow motion, see it speed up on the way down.',focus:[20,20,560,410],speed:0.2,setup(sim){release(sim);}},
    {title:'The photogate',text:'The bob is fastest at the bottom, where it breaks the photogate’s light beam. The gate times one full swing: out and back to the same place.',focus:(sim)=>{const sc=scale(sim);return [PX-60,PY+sim.p.L*sc-40,120,90];},speed:0.35},
    {title:'Time 10 swings',text:'Real lab trick: time 10 swings with a stopwatch and divide by 10. Reaction-time errors shrink tenfold. The stopwatch starts when the bob crosses the gate.',focus:[592,8,200,150],speed:2,setup(sim){sim.st.sw={state:'armed',t0:0,n:0,total:0};}},
    {title:'Energy back and forth',text:'Potential energy (blue) at the ends, kinetic energy (green) at the bottom. With no air resistance the total stays the same.',focus:[592,170,200,272],speed:0.5},
    {title:'Length is what matters',text:'Now the string is 4 times shorter. The period is cut in half: T = 2π√(L/g) depends on length and gravity, not on mass.',focus:[20,20,560,410],speed:0.6,setup(sim){BioLab.setValues(sim,{L:0.25});release(sim);}},
    {lvl:'honors',title:'Other planets',text:'On the Moon, gravity is about 1/6 as strong, so the same pendulum swings about 2.5 times slower.',focus:[20,20,560,410],speed:1,setup(sim){BioLab.setValues(sim,{L:1,planet:'moon'});release(sim);}},
    {lvl:'ap',title:'Beyond small angles',text:'Released from 70°, the real period is about 10% longer than 2π√(L/g). The formula assumes sin θ ≈ θ, which only works for small angles.',focus:[20,20,560,410],speed:1,setup(sim){BioLab.setValues(sim,{planet:'earth',theta:70});release(sim);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{L:1,planet:'earth',theta:15});release(sim);},
  challenges:[
    {lvl:'bio',q:'The pendulum is swinging. Swap the 100 g bob for a 1,000 g bob (10 times heavier). What happens to the time for one swing?',choices:['Much shorter','Much longer','No change'],correct:2,
     baseline:{L:1,theta:15,mass:100,damp:0,planet:'earth'},change:{mass:1000},changeText:'Bob is 10× heavier',watch:'angleg',at:4.5,reveal:13,
     explain:'A heavier bob is pulled harder by gravity, but it is also harder to speed up. The two effects cancel, so the period depends only on length and gravity.'},
    {lvl:'bio',q:'Take the swinging pendulum to the Moon, where gravity is weaker. The swing becomes…',choices:['Faster','Slower','The same'],correct:1,
     baseline:{L:1,theta:15,mass:200,damp:0,planet:'earth'},change:{planet:'moon'},changeText:'Now on the Moon',watch:'angleg',at:4.5,reveal:14,
     explain:'Weaker gravity pulls the bob back more gently, so each swing takes longer: about 5 s on the Moon instead of 2 s on Earth.'},
    {lvl:'honors',q:'Make the string 4 times longer (0.25 m → 1.0 m). The period…',choices:['Stays the same','Doubles','Becomes 4 times longer'],correct:1,
     baseline:{L:0.25,theta:15,mass:200,damp:0,planet:'earth'},change:{L:1},changeText:'String 4× longer',watch:'angleg',at:4,reveal:12,
     explain:'T = 2π√(L/g), so T grows with the square root of L. Four times the length gives √4 = 2 times the period (1.0 s → 2.0 s).'},
    {lvl:'honors',q:'Release from 20° instead of 10°. What happens to the period?',choices:['It doubles','It barely changes','It is cut in half'],correct:1,
     baseline:{L:1,theta:10,mass:200,damp:0,planet:'earth'},change:{theta:20},changeText:'Released from 20°',watch:'angleg',at:4,reveal:12,
     explain:'For small angles the period is almost independent of amplitude: a wider swing is also a faster swing. Here it grows by less than 1%.'},
    {lvl:'ap',q:'Release from 70°. Compared with the small-angle prediction 2π√(L/g), the measured period is…',choices:['The same','About 10% longer','About 10% shorter'],correct:1,
     baseline:{L:1,theta:70,mass:200,damp:0,planet:'earth'},changeText:'Watch the % difference',watch:'angleg',at:0.5,reveal:8,
     explain:'The restoring torque depends on sin θ, which is less than θ at large angles, so the bob is pulled back less strongly than the formula assumes. At 70° the period is about 10% longer.'},
    {lvl:'ap',instant:true,q:'You plot T² against L and the best-fit slope is 4.0 s²/m. What is g?',choices:['4.0 m/s²','9.9 m/s²','2.5 m/s²'],correct:1,
     explain:'T² = (4π²/g)·L, so the slope is 4π²/g. g = 4π²/4.0 ≈ 9.9 m/s². Use the T² vs. L graph to do this with your own trials on Planet X.'},
    {lvl:'ap',instant:true,q:'At the bottom of the swing, how does the string tension compare with the bob’s weight?',choices:['Less than mg','Equal to mg','Greater than mg'],correct:2,
     explain:'The bob moves in a circle, so at the bottom the net force points up toward the pivot: T − mg = mv²/L. Tension exceeds the weight.'}
  ],
  lab:{bio:'<p><b>Question:</b> Which variable changes the period of a pendulum: length, mass or starting angle?</p><ol><li>Change one variable at a time. Keep the others at their default values.</li><li>After each change, press Time 10 swings. When it finishes, Record trial.</li><li>Test at least three values of each variable.</li></ol><p>Which variable mattered? Explain how you know your test was fair.</p>',
       honors:'<p><b>Question:</b> How does period depend on length, and can you use it to find g?</p><ol><li>Record the photogate period for L = 0.25, 0.5, 0.75, 1.0, 1.5 and 2.0 m.</li><li>Graph T vs. L (a curve), then open the T² vs. L graph (a straight line).</li><li>The slope equals 4π²/g. Calculate g and your percent error.</li></ol>',
       ap:'<p><b>Question:</b> What is g on Planet X?</p><ol><li>Choose Planet X. Keep the starting angle at 10° or less.</li><li>Record photogate periods for at least six lengths.</li><li>Use the T² vs. L graph to find the slope and g.</li><li>Repeat at 60°. How does the large-angle error affect your value of g?</li></ol><p><b>Claim–evidence–reasoning:</b> State g for Planet X with uncertainty, and explain the systematic error at large angles.</p>'},
  terms:[{t:'Period (T)',d:'Time for one complete swing: out and back to the starting point.'},{t:'Amplitude',d:'The largest angle the pendulum swings away from straight down.'},{t:'Photogate',d:'A light beam and sensor that records the exact moment something passes through it.'},{t:'Frequency',d:'Swings per second, 1/T.'},
    {lvl:'honors',t:'Linearizing',d:'Graphing T² instead of T so the data fall on a straight line whose slope means something (4π²/g).'},{lvl:'honors',t:'Restoring force',d:'The part of gravity along the arc, mg sin θ, which always points back toward the bottom.'},
    {lvl:'ap',t:'Small-angle approximation',d:'sin θ ≈ θ (in radians), which makes the pendulum simple harmonic with T = 2π√(L/g).'},{lvl:'ap',t:'Systematic error',d:'An error that pushes every measurement in the same direction, like using large amplitudes.'}],
  about:'<p>The model solves the full pendulum equation θ″ = −(g/L) sin θ − (b/m) θ′ with a fourth-order Runge–Kutta method in 2 ms steps, so the period it produces includes the large-angle effect. The formula T = 2π√(L/g) is only the small-angle limit; the AP readout uses the series T₀(1 + θ₀²/16 + 11θ₀⁴/3072).</p><p>The photogate measures the time between successive passes through the bottom in the same direction. The stopwatch starts on one pass and stops on the tenth after it, with no reaction-time error (a real hand-timed stopwatch adds about ±0.2 s).</p><p>Simplified: the bob is a point mass, the string is massless and never stretches or goes slack, and air resistance is proportional to speed.</p>',
  draw(sim,ctx,vdt,k,tv){const s=sim.st,p=sim.p,hon=atLeast('honors'),ap=atLeast('ap');k=Math.min(k,1.3);
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    const sc=scale(sim),Lp=p.L*sc,bx=PX+Lp*Math.sin(s.th),by=PY+Lp*Math.cos(s.th),r=7+11*Math.cbrt(p.mass/1000);
    // support
    ctx.fillStyle=PAL['cv-lamp'];ctx.fillRect(PX-90,PY-18,180,10);ctx.fillRect(PX-5,PY-10,10,10);
    // meter stick
    const MX=36;ctx.fillStyle=PAL['cv-ruler'];rr(ctx,MX-12,PY,24,Math.min(400,2.05*sc),3);ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.stroke();
    for(let c=0;c<=200;c+=5){const yy=PY+c/100*sc;if(yy>PY+400)break;const L=c%50===0?12:c%10===0?7:3;if(c%10&&sc<120)continue;ctx.beginPath();ctx.moveTo(MX-12,yy);ctx.lineTo(MX-12+L,yy);ctx.stroke();if(c%50===0)txt(ctx,(c/100).toFixed(1),MX+14,yy+4,{s:10.5*k,c:PAL['cv-ink']});}
    txt(ctx,'m',MX,PY-4,{s:10.5*k,a:'center',c:PAL['cv-soft']});
    ctx.setLineDash([3,4]);ctx.strokeStyle=PAL['cv-soft'];ctx.beginPath();ctx.moveTo(MX+12,PY+Lp);ctx.lineTo(PX-Lp*0.25,PY+Lp);ctx.stroke();ctx.setLineDash([]);
    // protractor
    const pr=Math.min(95,Lp*0.55);ctx.fillStyle=PAL['cv-glass'];ctx.globalAlpha=0.16;ctx.beginPath();ctx.moveTo(PX,PY);ctx.arc(PX,PY,pr,0,Math.PI);ctx.fill();ctx.globalAlpha=1;
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.beginPath();ctx.arc(PX,PY,pr,0,Math.PI);ctx.stroke();
    for(let a=-90;a<=90;a+=10){const t=a*RAD,L=a%30===0?10:5;ctx.beginPath();ctx.moveTo(PX+Math.sin(t)*pr,PY+Math.cos(t)*pr);ctx.lineTo(PX+Math.sin(t)*(pr-L),PY+Math.cos(t)*(pr-L));ctx.stroke();
      if(a%30===0&&pr>55&&a!==0)txt(ctx,Math.abs(a)+'°',PX+Math.sin(t)*(pr-20),PY+Math.cos(t)*(pr-20)+4,{s:9.5*k,a:'center',c:PAL['cv-soft']});}
    // rest line and amplitude arc
    ctx.setLineDash([5,5]);ctx.strokeStyle=PAL['cv-soft'];ctx.beginPath();ctx.moveTo(PX,PY);ctx.lineTo(PX,PY+Lp+r+8);ctx.stroke();
    const A=p.theta*RAD;ctx.strokeStyle=PAL.s4;ctx.globalAlpha=0.6;ctx.beginPath();ctx.arc(PX,PY,Lp,Math.PI/2-A,Math.PI/2+A);ctx.stroke();ctx.globalAlpha=1;ctx.setLineDash([]);
    // angle arc
    if(Math.abs(s.th)>0.03){ctx.strokeStyle=PAL.s4;ctx.lineWidth=2.5;ctx.beginPath();const a0=Math.PI/2,a1=Math.PI/2-s.th;ctx.arc(PX,PY,Math.min(42,pr*0.5),Math.min(a0,a1),Math.max(a0,a1));ctx.stroke();
      txt(ctx,Math.abs(s.th/RAD).toFixed(0)+'°',PX+(s.th>0?-8:8),PY+Math.min(42,pr*0.5)+16,{s:12*k,w:700,c:PAL.s4,a:s.th>0?'right':'left'});}
    // photogate at the bottom
    const gy=PY+Lp,gOn=sim.t-s.gate<0.05;ctx.fillStyle=PAL['cv-lamp'];rr(ctx,PX-8,gy+r+4,16,22,3);ctx.fill();
    ctx.fillStyle=PAL['cv-lamp'];rr(ctx,PX-36,gy-26,10,52,3);ctx.fill();rr(ctx,PX+26,gy-26,10,52,3);ctx.fill();ctx.fillRect(PX-36,gy+22,72,6);
    ctx.strokeStyle=gOn?PAL.s1:'rgba(193,20,48,.45)';ctx.lineWidth=gOn?3:1.5;ctx.beginPath();ctx.moveTo(PX-26,gy);ctx.lineTo(PX+26,gy);ctx.stroke();
    ctx.fillStyle=gOn?'#ff3b3b':'#5a1b22';ctx.beginPath();ctx.arc(PX-31,gy-18,3,0,6.29);ctx.fill();
    txt(ctx,'photogate',PX-42,gy+24,{s:10.5*k,c:PAL['cv-soft'],a:'right'});
    // strobe ghosts
    if(hon){s.ghost.forEach((t,i)=>{ctx.globalAlpha=0.08+0.25*i/s.ghost.length;ctx.fillStyle=PAL.s2;ctx.beginPath();ctx.arc(PX+Lp*Math.sin(t),PY+Lp*Math.cos(t),r,0,6.29);ctx.fill();});ctx.globalAlpha=1;}
    // string and bob
    ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(PX,PY);ctx.lineTo(bx,by);ctx.stroke();ctx.fillStyle=PAL['cv-ink'];ctx.beginPath();ctx.arc(PX,PY,4,0,6.29);ctx.fill();
    const gr=ctx.createRadialGradient(bx-r*0.35,by-r*0.35,1,bx,by,r);gr.addColorStop(0,'#f1d9a0');gr.addColorStop(1,'#a8781e');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(bx,by,r,0,6.29);ctx.fill();ctx.strokeStyle='#6b4b10';ctx.lineWidth=1;ctx.stroke();
    if(Lp>70)pill(ctx,'L = '+p.L.toFixed(2)+' m',PX+(bx-PX)*0.5+(s.th>0?-46:46),PY+(by-PY)*0.5,PAL.card2,PAL['cv-ink'],11*k);
    // velocity vector / forces
    const v=p.L*s.w;if(hon&&Math.abs(v)>0.03){const L=clamp(Math.abs(v)*40,8,90)*Math.sign(v),ux=Math.cos(s.th),uy=-Math.sin(s.th);const x1=bx+ux*L,y1=by+uy*L;
      ctx.strokeStyle=PAL.s3;ctx.fillStyle=PAL.s3;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(x1,y1);ctx.stroke();const an=Math.atan2(y1-by,x1-bx);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x1-9*Math.cos(an-0.4),y1-9*Math.sin(an-0.4));ctx.lineTo(x1-9*Math.cos(an+0.4),y1-9*Math.sin(an+0.4));ctx.fill();
      txt(ctx,'v',x1+(ux*Math.sign(v))*8,y1+(uy*Math.sign(v))*8+4,{s:12*k,w:700,c:PAL.s3,a:'center'});}
    if(ap){const m=mkg(sim),W=m*g(sim),T=m*(g(sim)*Math.cos(s.th)+p.L*s.w*s.w),fs=28/Math.max(0.5,W);
      const arr=(x0,y0,dx,dy,col,lab)=>{const x1=x0+dx,y1=y0+dy;ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();const an=Math.atan2(dy,dx);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x1-8*Math.cos(an-0.4),y1-8*Math.sin(an-0.4));ctx.lineTo(x1-8*Math.cos(an+0.4),y1-8*Math.sin(an+0.4));ctx.fill();txt(ctx,lab,x1+6,y1,{s:11*k,w:700,c:col});};
      arr(bx,by,0,W*fs,PAL.s4,'mg');const tl=Math.min(Lp*0.8,T*fs);arr(bx,by,(PX-bx)/Lp*tl,(PY-by)/Lp*tl,PAL.s5,'T '+T.toFixed(2)+' N');}
    if(p.planet!=='earth')pill(ctx,PLANETS[p.planet].l+(p.planet==='x'?'':' · g = '+g(sim)+' m/s²'),PX+170,PY+10,PAL.s5,'#fff',11.5*k);
    // right panel: stopwatch + photogate
    ctx.fillStyle=PAL.card;rr(ctx,592,8,200,150,10);ctx.fill();ctx.strokeStyle=PAL.line;ctx.lineWidth=1;ctx.stroke();
    const w=s.sw,el=w.state==='running'?sim.t-w.t0:w.state==='done'?w.total:0;
    txt(ctx,'Stopwatch',604,28,{s:12*k,w:700});
    ctx.fillStyle='#1d2420';rr(ctx,604,36,176,40,6);ctx.fill();
    const mm=Math.floor(el/60),ss=el-mm*60;txt(ctx,String(mm).padStart(2,'0')+':'+(ss<10?'0':'')+ss.toFixed(2),692,64,{s:24*k>30?30:24*k,w:700,a:'center',c:'#7dffb0'});
    txt(ctx,w.state==='idle'?'Press “Time 10 swings”':w.state==='armed'?'Waiting for the gate…':w.state==='running'?'Swing '+(w.n+1)+' of 10':'T = '+(w.total/10).toFixed(3)+' s per swing',692,94,{s:11.5*k,a:'center',w:600,c:w.state==='done'?PAL.s3:PAL['cv-ink']});
    for(let i=0;i<10;i++){ctx.fillStyle=(w.state==='done'||(w.state==='running'&&i<w.n))?PAL.s3:PAL['cv-bg2'];ctx.beginPath();ctx.arc(611+i*18.5,108,5.5,0,6.29);ctx.fill();}
    txt(ctx,'Photogate period',604,136,{s:11.5*k,c:PAL['cv-soft']});txt(ctx,s.period>0?s.period.toFixed(3)+' s':'—',780,136,{s:13*k,w:700,a:'right'});
    if(hon&&p.planet!=='x')txt(ctx,'2π√(L/g) = '+T0(sim).toFixed(3)+' s',780,152,{s:10.5*k,a:'right',c:PAL['cv-soft']});
    // energy panel
    ctx.fillStyle=PAL.card;rr(ctx,592,166,200,276,10);ctx.fill();ctx.strokeStyle=PAL.line;ctx.stroke();
    txt(ctx,'Energy (J)',692,186,{s:12*k,w:700,a:'center'});
    const vals=[KE(sim),PE(sim),s.heat,KE(sim)+PE(sim)+s.heat],labs=k>1.2?['KE','PE','Heat','Total']:['Kinetic','Potential','Thermal','Total'],cols=[PAL.s3,PAL.s2,PAL.s1,PAL.s4];
    const emax=Math.max(1e-4,mkg(sim)*g(sim)*p.L*(1-Math.cos(A)))*1.15,top=206,bot=410,hs=(bot-top)/emax;
    ctx.strokeStyle=PAL.line;ctx.beginPath();ctx.moveTo(600,bot);ctx.lineTo(786,bot);ctx.stroke();
    vals.forEach((e,i)=>{const x=606+i*45,h=Math.min(bot-top,Math.max(0,e)*hs);ctx.fillStyle=cols[i];ctx.fillRect(x,bot-h,34,h);txt(ctx,e<0.1?e.toFixed(3):e.toFixed(2),x+17,bot-h-5,{s:10*k,w:600,a:'center'});txt(ctx,labs[i],x+17,bot+16,{s:10*k,a:'center',c:PAL['cv-soft']});});
    txt(ctx,'PE = 0 at the bottom of the swing',692,437,{s:9.5*k,a:'center',c:PAL['cv-soft']});
  }
};
BioLab.register(PEND);
})();
