(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,RM,axes}=BioLab.h;
/* Gear ratio and the racing robot (Robotics 1 Unit 3; Engineering Unit 4 drivetrains).
   Two drive motors, each a small 12 V gear motor modeled as a straight torque–speed line:
   τ = τs(1 − ω/ωf), with stall torque τs = 0.6 N·m and free speed ωf = 150 rpm at the motor shaft.
   Gear ratio G = driven teeth ÷ driver (motor) teeth. Wheel torque = G·τ·η (η = 0.9), wheel speed = ω/G.
   Drive force F = 2·G·τ·η ÷ r. Resistance: rolling (Crr = 0.05) and gravity on the ramp. The robot is 3.0 kg.
   Values are illustrative for a classroom robot kit. */
const TS=0.6,WF=150*2*Math.PI/60,ETA=0.9,CRR=0.05,G0=9.8;
const ratio=p=>p.driven/p.driver;
const vmax=p=>WF/ratio(p)*(p.wd/200);                         /* m/s with no load */
const fStall=p=>2*ratio(p)*TS*ETA/(p.wd/200);                /* N at zero speed, both motors */
const course=p=>p.course==='ramp'?{L:2,ang:p.ang}:{L:3,ang:0};
const resist=p=>{const c=course(p),a=c.ang*Math.PI/180;return p.m*G0*(Math.sin(a)+CRR*Math.cos(a));};
const drive=(p,v)=>Math.max(0,fStall(p)*(1-v/vmax(p)));
const topReach=p=>{const F=fStall(p),R=resist(p);return F<=R?0:vmax(p)*(1-R/F);}; /* steady speed on the course */

const SIM={
  id:'gears',hash:'gears',apUnit:5,order:3,tab:'Gears and the racing robot',kind:'Simulation',
  prereq:['torque'],next:['rotation','power'],
  card:'Pick the gears for a racing robot. Gear up for speed or down for power, then race a flat sprint and a steep ramp.',
  title:'Gears: trading speed for torque',
  lede:{bio:'A small motor spins fast but weakly. Gears trade some of that speed for push, or some push for speed. The best gearing depends on the course.',
        honors:'Gear ratio G = driven teeth ÷ driver teeth. Wheel torque goes up by G and wheel speed goes down by G, so (ignoring losses) power stays the same.',
        ap:'A DC motor’s torque falls in a straight line from stall to free speed, so its power peaks at half the free speed. Gearing chooses where on that curve the robot runs.'},
  scale:'A 3.0 kg classroom robot with two drive motors. Motor: 0.6 N·m stall torque and 150 rpm free speed at the shaft (an illustrative small 12 V gear motor). Flat sprint 3 m; ramp 2 m.',
  timeScale:1,dtMax:0.005,prewarm:0,sampleDt:0.05,window:12,unit:'s',chChange:0.6,chReveal:10,
  controls:[
    {id:'driver',label:'Gear on the motor (driver)',type:'seg',def:40,lvl:'bio',options:[{v:20,l:'20 teeth'},{v:40,l:'40 teeth'},{v:80,l:'80 teeth'}]},
    {id:'driven',label:'Gear on the wheel (driven)',type:'seg',def:40,lvl:'bio',options:[{v:20,l:'20 teeth'},{v:40,l:'40 teeth'},{v:80,l:'80 teeth'}]},
    {id:'course',label:'Race',type:'seg',def:'flat',lvl:'bio',options:[{v:'flat',l:'Flat sprint (3 m)'},{v:'ramp',l:'Ramp (2 m)'}]},
    {id:'ang',label:'Ramp angle',type:'range',min:5,max:30,step:1,def:20,unit:'°',lvl:'honors'},
    {id:'wd',label:'Wheel diameter',type:'seg',def:10,lvl:'honors',options:[{v:6,l:'6 cm'},{v:10,l:'10 cm'},{v:15,l:'15 cm'}]},
    {id:'m',label:'Robot mass',type:'range',min:1.5,max:6,step:0.1,def:3,unit:' kg',d:1,lvl:'ap'}
  ],
  actions:[{id:'go',label:'Race again',primary:true,run(sim){BioLab.reset(sim);}}],
  init(){return {x:0,v:0,done:false,time:null,stall:false,ang:0};},
  step(sim,dt){const p=sim.p,s=sim.st;if(s.done)return;const c=course(p);
    const a=(drive(p,s.v)-resist(p))/p.m;s.v=Math.max(0,s.v+a*dt);s.x+=s.v*dt;s.ang+=s.v/(p.wd/200)*dt;
    if(s.v<1e-4&&drive(p,0)<=resist(p)){s.stall=true;}
    if(s.x>=c.L){s.x=c.L;s.done=true;s.time=sim.t;}},
  metrics:[
    {id:'G',label:'Gear ratio (driven ÷ driver)',unit:'',lvl:'bio',d:2,get:s=>ratio(s.p)},
    {id:'v',label:'Speed',unit:'m/s',lvl:'bio',d:2,min:0,max:null,get:s=>s.st.v},
    {id:'x',label:'Distance',unit:'m',lvl:'bio',d:2,min:0,max:3,get:s=>s.st.x},
    {id:'time',label:'Finish time',text:true,lvl:'bio',get:s=>s.st.done?s.st.time.toFixed(2)+' s':s.st.stall?'Stalled: not enough push':'Racing…'},
    {id:'vmax',label:'Top speed (no load)',unit:'m/s',lvl:'honors',d:2,get:s=>vmax(s.p)},
    {id:'F',label:'Push at the start (both wheels)',unit:'N',lvl:'honors',d:1,get:s=>fStall(s.p)},
    {id:'R',label:'Resistance to beat',unit:'N',lvl:'honors',d:1,get:s=>resist(s.p)},
    {id:'P',label:'Power to the wheels',unit:'W',lvl:'ap',d:1,get:s=>drive(s.p,s.st.v)*s.st.v}
  ],
  graphs:[{id:'v',label:'Speed',lines:['v']},{id:'x',label:'Distance',lines:['x']},{id:'P',label:'Power to the wheels',lvl:'ap',lines:['P']}],
  defaultGraph:'v',
  draw(sim,ctx,vdt,k,t){const p=sim.p,s=sim.st,c=course(p);ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    /* gear train inset */
    const gx=150,gy=130,R1=p.driver*0.9,R2=p.driven*0.9,th=s.ang;
    const gear=(x,y,R,n,a,col)=>{ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle=col;ctx.beginPath();for(let i=0;i<n*2;i++){const r=i%2?R:R+5,b=i/(n*2)*Math.PI*2;ctx.lineTo(r*Math.cos(b),r*Math.sin(b));}ctx.closePath();ctx.fill();ctx.fillStyle=PAL['cv-bg'];ctx.beginPath();ctx.arc(0,0,4,0,7);ctx.fill();ctx.strokeStyle='#2a2f36';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(R*0.8,0);ctx.stroke();ctx.restore();};
    const wa=RM?0:th,ma=RM?0:-th*ratio(p);gear(gx,gy,R1,p.driver/2,ma,'#9aa1aa');gear(gx+R1+R2+4,gy,R2,p.driven/2,wa,'#c27840');
    {const L=gy+Math.max(R1,R2);txt(ctx,'motor gear '+p.driver+'T',gx,L+22,{s:12*k,w:700,a:'center',c:PAL['cv-soft']});txt(ctx,'wheel gear '+p.driven+'T',gx+R1+R2+4,L+42,{s:12*k,w:700,a:'center',c:PAL['s1']||PAL['cv-ink']});}
    const G=ratio(p);pill(ctx,G>1?'Geared down '+G.toFixed(0)+' : 1 (more push, less speed)':G<1?'Geared up 1 : '+(1/G).toFixed(0)+' (more speed, less push)':'1 : 1 (no change)',gx+90,30,PAL['card2'],PAL['cv-ink'],13*Math.min(k,1.3));
    /* track */
    const x0=400,x1=730,yb=380,ang=c.ang*Math.PI/180,len=x1-x0,dy=Math.tan(ang)*len*(c.L===2?0.6:0);
    ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x0-20,yb);ctx.lineTo(x0,yb);ctx.lineTo(x1,yb-dy);ctx.lineTo(x1,yb);ctx.closePath();ctx.stroke();
    ctx.fillStyle='#e8dfcf';ctx.fill();
    ctx.strokeStyle=PAL['rj'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x1-2,yb-dy);ctx.lineTo(x1-2,yb-dy-40);ctx.stroke();txt(ctx,'finish',x1-6,yb-dy-46,{s:12*k,w:700,c:PAL['rj'],a:'right'});
    const u=s.x/c.L,rx=x0+u*len,ry=yb-u*dy,a2=-Math.atan2(dy,len),wr=Math.max(5,p.wd*1.1);
    ctx.save();ctx.translate(rx,ry);ctx.rotate(a2);ctx.fillStyle='#3b4f6b';rr(ctx,-28,-wr*2-22,56,22,4);ctx.fill();
    [-16,16].forEach(o=>{ctx.fillStyle='#2a2f36';ctx.beginPath();ctx.arc(o,-wr,wr,0,7);ctx.fill();ctx.strokeStyle='#9aa1aa';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(o,-wr);ctx.lineTo(o+wr*Math.cos(RM?0:s.ang),-wr+wr*Math.sin(RM?0:s.ang));ctx.stroke();});ctx.restore();
    txt(ctx,c.ang?c.L+' m ramp at '+c.ang+'°':c.L+' m flat sprint',x0,yb+28,{s:13*k,w:700});
    pill(ctx,s.done?'Finished in '+s.time.toFixed(2)+' s':s.stall?'Stalled on the ramp':'t = '+sim.t.toFixed(1)+' s · '+s.v.toFixed(2)+' m/s',600,250,PAL['card2'],s.stall?PAL['rj']:PAL['cv-ink'],14*Math.min(k,1.3));},
  narrate(sim){const p=sim.p,s=sim.st,G=ratio(p);
    if(s.stall)return '<b>Stalled.</b> With this gearing the wheels can push only '+fStall(p).toFixed(1)+' N, but the ramp and rolling resistance take '+resist(p).toFixed(1)+' N. Gear down (bigger wheel gear or smaller motor gear) for more push.';
    if(s.done)return 'Finished in <b>'+s.time.toFixed(2)+' s</b>. '+(G<1?'Geared up: a high top speed ('+vmax(p).toFixed(2)+' m/s) but weak push ('+fStall(p).toFixed(1)+' N).':G>1?'Geared down: strong push ('+fStall(p).toFixed(1)+' N) but a low top speed ('+vmax(p).toFixed(2)+' m/s).':'Even gearing: '+vmax(p).toFixed(2)+' m/s top speed and '+fStall(p).toFixed(1)+' N of push.');
    return 'The motors push hardest at the start, then their push fades as the robot speeds up. '+(G!==1?'The gears multiply the wheel '+(G>1?'torque':'speed')+' by '+(G>1?G:1/G).toFixed(0)+'.':'');},
  challenges:[
    {lvl:'bio',q:'You swap a 40-tooth wheel gear for an 80-tooth one (motor gear stays 40). What happens to the robot’s top speed?',
     choices:['It doubles','It halves','It stays the same'],correct:1,
     baseline:{driver:40,driven:40,course:'flat'},change:{driven:80},changeText:'Wheel gear: 80 teeth',watch:'v',at:0.5,reveal:8,
     explain:{bio:'The wheel gear has twice the teeth, so it turns once for every two turns of the motor. Top speed halves, from 0.79 to 0.39 m/s, but the push doubles.'}},
    {lvl:'bio',q:'On the 20° ramp, the 1 : 4 geared-up robot (80-tooth motor gear, 20-tooth wheel gear) stalls. What fixes it?',
     choices:['Gear down: a smaller motor gear or a bigger wheel gear','Gear up even more','Use smaller gears on both'],correct:0,
     baseline:{driver:80,driven:20,course:'ramp',ang:20},change:{driver:20,driven:20},changeText:'Gears: 20 and 20 (1 : 1)',watch:'x',at:0.5,reveal:10,
     explain:{bio:'Geared up 1 : 4, the wheels push only 5.4 N, less than the 11.4 N the ramp takes. At 1 : 1 they push 21.6 N and the robot climbs.'}},
    {lvl:'honors',q:'Which gearing wins the 3 m flat sprint?',choices:['1 : 4 geared up (80 → 20)','1 : 2 geared up (40 → 20)','1 : 1','2 : 1 geared down'],correct:1,
     baseline:{driver:40,driven:20,course:'flat'},watch:'x',reveal:10,
     explain:{honors:'Too much gearing up leaves too little push to accelerate; too little caps the top speed. Here 1 : 2 finishes in 2.65 s, just ahead of 1 : 4 (2.68 s) and far ahead of 1 : 1 (4.21 s). Gearing up past 1 : 2 stops paying off.'}},
    {lvl:'honors',q:'Gear ratio G = driven ÷ driver. A 20-tooth motor gear drives an 80-tooth wheel gear. What is G, and what does it do to wheel torque?',choices:['G = 4: four times the torque','G = 0.25: a quarter of the torque','G = 4: a quarter of the torque'],correct:0,instant:true,
     explain:{honors:'G = 80 ÷ 20 = 4. The wheel turns 4 times slower and (before losses) gets 4 times the torque.'}},
    {lvl:'ap',q:'At what wheel speed does a geared DC motor deliver the most power?',choices:['At stall','At half its free speed','At free speed'],correct:1,instant:true,
     explain:{ap:'P = τω = τs(1 − ω/ωf)·ω, a parabola that peaks at ω = ωf/2, where P = τs·ωf/4. Good gearing keeps the robot near that speed for most of the race.'}},
    {lvl:'ap',q:'A 3.0 kg robot climbs a 20° ramp. How much force does gravity pull back along the ramp? (g = 9.8)',choices:['10.1 N','27.6 N','29.4 N','1.4 N'],correct:0,instant:true,
     explain:{ap:'mg sin θ = 3.0 × 9.8 × sin 20° = 10.06 N. Rolling resistance adds about 1.4 N more.'}}
  ],
  tour:[
    {title:'Two gears, one motor',text:'The small motor gear (gray) drives the wheel gear (copper). Right now both have 40 teeth, so the wheel turns exactly as fast as the motor.',pause:true,setup(sim){BioLab.setValues(sim,{driver:40,driven:40,course:'flat',wd:10,m:3,ang:20});BioLab.reset(sim);}},
    {title:'The sprint at 1 : 1',text:'Race 3 m. The motors push hardest at the start, then their push fades as the robot speeds up. It tops out near 0.79 m/s.',speed:1},
    {title:'Gear up for speed',text:'Swap to a 40-tooth motor gear and a 20-tooth wheel gear. Each motor turn spins the wheel twice: top speed doubles, push halves. It wins the sprint.',speed:1,setup(sim){BioLab.setValues(sim,{driven:20});BioLab.reset(sim);}},
    {title:'Now the ramp',text:'Same gearing on a 20° ramp. Gravity and rolling resistance take about 11.4 N, and this gearing can push only 10.8 N. It stalls at the bottom.',speed:1,setup(sim){BioLab.setValues(sim,{course:'ramp'});BioLab.reset(sim);}},
    {title:'Gear down for push',text:'Flip it: 20-tooth motor gear, 80-tooth wheel gear. 86 N of push, but a top speed of only 0.2 m/s: it climbs in about 12 s. At 1 : 1 it climbs in 5.5 s. The best gearing is just enough push for the job, and no more.',speed:1,setup(sim){BioLab.setValues(sim,{driver:20,driven:80});BioLab.reset(sim);}},
    {lvl:'ap',title:'Power peaks at half speed',text:'Switch the graph to <b>Power to the wheels</b>. Power = force × speed, so it is zero at stall and at top speed and largest in between.',speed:1,setup(sim){BioLab.setValues(sim,{course:'flat',driver:40,driven:20});BioLab.reset(sim);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{driver:40,driven:40,course:'flat'});BioLab.reset(sim);},
  lab:{bio:'<p><b>Question:</b> What gearing wins the sprint, and what gearing climbs the ramp?</p><ol><li>Race the flat sprint with every gear pair. Record the finish time.</li><li>Repeat on the 20° ramp.</li></ol><p>Which pair would you put on a racing bot? On a soda-delivery bot that must climb a ramp?</p>',
       honors:'<p><b>Question:</b> How do wheel size and gearing combine?</p><ol><li>For the 1 : 1 gears, record top speed and starting push with 6, 10 and 15 cm wheels.</li><li>Find a gear pair and wheel size that climb a 25° ramp fastest.</li></ol><p>Explain why a bigger wheel acts like gearing up.</p>',
       ap:'<p><b>Question:</b> Can you predict the best sprint gearing?</p><ol><li>Record finish times for G = 0.25, 0.5, 1, 2 and 4.</li><li>Plot time vs. G.</li></ol><p><b>CER:</b> Use F = 2Gτsη(1 − v/v_max)/r and v_max = ωf r/G to explain the minimum.</p>'},
  terms:[{t:'Gear ratio',d:'Teeth on the driven (wheel) gear ÷ teeth on the driver (motor) gear.'},{t:'Gear down',d:'A bigger gear on the wheel: more torque, less speed.'},{t:'Gear up',d:'A smaller gear on the wheel: more speed, less torque.'},{t:'Stall',d:'When the motor can’t push hard enough to turn at all.'},
    {lvl:'honors',t:'Torque',d:'A twisting force: force × lever arm, in N·m.'},{lvl:'ap',t:'Torque–speed curve',d:'For a DC motor, torque drops in a straight line from stall torque at 0 rpm to zero at free speed.'}],
  about:'<p><b>Model.</b> Each motor follows τ = τs(1 − ω/ωf) with τs = 0.6 N·m and ωf = 150 rpm at its shaft (illustrative for a small 12 V gear motor). Gear efficiency 90%. Drive force F = 2·G·τ·η ÷ r. Resistance: rolling resistance 0.05 × the normal force, plus mg sin θ on the ramp. No wheel slip and no motor heating. Times are for this model, not for a particular kit.</p>'
};
BioLab.register(SIM);
})();
