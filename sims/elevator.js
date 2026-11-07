(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,RM,fmtNum}=BioLab.h;

/* Apparent weight in an accelerating elevator (g = 9.8 m/s², up is +).
   Elevator ride: 1.0 s at rest, speed up at A for ta = V/A, cruise at V for 4.0 s, slow down at A for ta, then stopped.
     Going up starts at the lobby (0 m); going down ends there. Trip length D = V·ta + V·4.0.
   Drop tower: 1.0 s held at the top, 2.0 s of free fall (a = −9.8 m/s², reaching 19.6 m/s down after 19.6 m),
     then brakes at +19.6 m/s² (2g) stop the seat in 1.0 s over 9.8 m. The tower drop is 29.4 m.
   The scale reads the normal force N = m(g + a). Cable tension on car + rider: T = (M + m)(g + a), no counterweight.
   Motion is computed exactly from the piecewise-constant acceleration, so readings have no integration drift. */
const G=9.8,T0=1.0,TC=4.0,FREE=2.0,BRAKE=2*G,FLOOR=3.0;
const MODE_CTL={accel:['up','down'],vmax:['up','down'],fbd:['up','down'],carM:['up','down']};
const MODE_TILE={T:['up','down']};
const C_N='s3',C_W='s2',C_V='s4',C_A='s5';

function arrow(ctx,x,y,dx,dy,col,w){const L=Math.hypot(dx,dy);if(L<2)return;const head=Math.min(12,5+L*0.25),ux=dx/L,uy=dy/L;
  ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=w||3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+dx-ux*head*0.8,y+dy-uy*head*0.8);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+dx,y+dy);ctx.lineTo(x+dx-ux*head-uy*head*0.55,y+dy-uy*head+ux*head*0.55);ctx.lineTo(x+dx-ux*head+uy*head*0.55,y+dy-uy*head-ux*head*0.55);ctx.closePath();ctx.fill();}
const z=v=>Math.abs(v)<1e-9?0:v;
const f1=v=>{const r=z(Math.round(v*10)/10);return (r<0?'−':'')+Math.abs(r).toFixed(1);};
const f0=v=>Math.round(z(v)).toFixed(0);
const sgn=v=>v>1e-9?'+':v<-1e-9?'−':'';

/* The ride plan: segments of constant acceleration. */
function plan(p){
  if(p.ride==='drop'){const vb=G*FREE,tb=vb/BRAKE;
    const segs=[{t0:0,t1:T0,a:0,ph:'top'},{t0:T0,t1:T0+FREE,a:-G,ph:'fall'},{t0:T0+FREE,t1:T0+FREE+tb,a:BRAKE,ph:'brake'}];
    return {segs,y0:G*FREE*FREE/2+vb*vb/(2*BRAKE),end:T0+FREE+tb,dir:-1,drop:true,vpk:vb};}
  const dir=p.ride==='down'?-1:1,A=p.accel,V=p.vmax,ta=V/A,D=V*ta+V*TC;
  const segs=[{t0:0,t1:T0,a:0,ph:'rest'},{t0:T0,t1:T0+ta,a:dir*A,ph:'speed'},{t0:T0+ta,t1:T0+ta+TC,a:0,ph:'cruise'},{t0:T0+ta+TC,t1:T0+2*ta+TC,a:-dir*A,ph:'slow'}];
  return {segs,y0:dir>0?0:D,end:T0+2*ta+TC,dir,drop:false,vpk:V,D,ta};}
function at(P,t){let v=0,y=P.y0,a=0,ph='done';
  if(t<=0)return {v:0,y:P.y0,a:0,ph:P.segs[0].ph};
  if(t>=P.end)return {v:0,y:P.drop?0:(P.dir>0?P.D:0),a:0,ph:'done'};
  for(const s of P.segs){if(t<s.t0)break;const dt=Math.min(t,s.t1)-s.t0;y+=v*dt+0.5*s.a*dt*dt;v+=s.a*dt;if(t<s.t1){a=s.a;ph=s.ph;}}
  return {v:z(v),y:z(y),a,ph};}
function sync(sim){const st=sim.st;const q=at(st.P,st.rt);st.v=q.v;st.y=q.y;st.a=q.a;st.ph=q.ph;}
const Nof=(sim,a)=>sim.p.mass*(G+(a===undefined?sim.st.a:a));
const sysView=sim=>sim.p.fbd==='sys'&&sim.p.ride!=='drop'&&atLeast('ap');

function syncMode(sim){const id=sim.def.id,m=sim.p.ride;
  for(const c of SIM.controls){const el=document.getElementById(id+'-'+c.id)||document.getElementById(id+'-'+c.id+'-l');if(!el)continue;const w=el.closest('.ctl');if(!w)continue;
    w.hidden=!atLeast(c.lvl)||(MODE_CTL[c.id]&&!MODE_CTL[c.id].includes(m));}
  for(const mt of SIM.metrics){const t=sim.ui.tiles&&sim.ui.tiles[mt.id];if(!t)continue;t.num.closest('.tile').hidden=!atLeast(mt.lvl)||(MODE_TILE[mt.id]&&!MODE_TILE[mt.id].includes(m));}}
function restart(sim){BioLab.reset(sim);syncMode(sim);}
/* Tour helper: set values, start the ride at time t0, and (optionally) replay one stretch of it on a loop. */
function go(sim,vals,t0,loop){BioLab.setValues(sim,Object.assign({mass:60,accel:1.0,vmax:2.0,fbd:'rider',carM:1000},vals||{}));BioLab.reset(sim);sim.st.rt=t0||0;sim.st.loop=loop||null;sync(sim);}

function motionText(sim){const s=sim.st,up=sim.p.ride!=='down';
  switch(s.ph){
    case 'rest':return 'At rest, about to go '+(sim.p.ride==='down'?'down':'up')+': a = 0';
    case 'top':return 'Held at the top: a = 0';
    case 'speed':return 'Going '+(up?'up':'down')+' and speeding up: a points '+(up?'up':'down');
    case 'cruise':return 'Going '+(up?'up':'down')+' at a steady speed: a = 0';
    case 'slow':return 'Going '+(up?'up':'down')+' and slowing down: a points '+(up?'down':'up');
    case 'fall':return 'Falling freely: a = 9.8 m/s² down';
    case 'brake':return 'Going down and slowing down: a points up';
    default:return 'Stopped: a = 0';}}

const SIM={
  id:'elevator',hash:'elevator',apUnit:2,order:3.5,prereq:['forces'],next:['atwood'],tab:'Elevators and apparent weight',kind:'Simulation',
  card:'Ride an elevator or a drop tower standing on a scale. Watch the scale, the free-body diagram and the graphs as you speed up, cruise and stop.',
  title:'Apparent weight: a scale in an elevator',
  lede:{bio:'Stand on a scale in an elevator, ride up, ride down, then try a drop tower. Find out when the scale reads more than your weight, when it reads less, and why.',
        honors:'Read the acceleration off the velocity–time graph, then predict the scale reading with N = m(g + a). The sign of a comes from whether v is increasing or decreasing (the slope of the v–t graph), not from which way you move.',
        ap:'Apply Newton’s second law to the rider and to the car-plus-rider system, find the cable tension, and translate between the v–t graph, the free-body diagram and the equation.'},
  scale:'Real sizes: one rider on a scale in an elevator car about 2.5 m tall, floors 3 m apart, typical elevators speed up at about 1 m/s²; the slider goes past real elevators, up to 2.0 m/s². The drop tower drops you 29.4 m, about the height of a 10-story building.',
  timeScale:1,dtMax:0.01,prewarm:0,sampleDt:0.05,window:14,unit:'s',chChange:0.5,chReveal:2,
  controls:[
    {id:'ride',label:'Ride',type:'seg',def:'up',lvl:'bio',options:[{v:'up',l:'Elevator going up'},{v:'down',l:'Elevator going down'},{v:'drop',l:'Drop tower'}],onChange(sim){restart(sim);}},
    {id:'mass',label:'Your mass',type:'range',min:40,max:100,step:1,def:60,unit:' kg',lvl:'bio',help:'Changing it does not restart the ride.'},
    {id:'accel',label:'Elevator acceleration (size)',type:'range',min:0.5,max:2.0,step:0.1,def:1.0,unit:' m/s²',d:1,lvl:'bio',help:'How quickly it speeds up and slows down. Changing it restarts the ride.',onChange(sim){restart(sim);}},
    {id:'vmax',label:'Cruising speed',type:'range',min:1.0,max:4.0,step:0.5,def:2.0,unit:' m/s',d:1,lvl:'honors',help:'Changing it restarts the ride.',onChange(sim){restart(sim);}},
    {id:'fbd',label:'Free-body diagram of',type:'seg',def:'rider',lvl:'ap',options:[{v:'rider',l:'You (the rider)'},{v:'sys',l:'Car + rider'}]},
    {id:'carM',label:'Elevator car mass M',type:'range',min:500,max:1500,step:50,def:1000,unit:' kg',lvl:'ap',help:'For the cable tension. No counterweight in this model.'}
  ],
  actions:[{id:'again',label:'Ride again',primary:true,run(sim){restart(sim);}}],
  init(sim){const P=plan(sim.p);const s={P,rt:0,loop:null,v:0,y:P.y0,a:0,ph:P.segs[0].ph};return s;},
  step(sim,dt){const s=sim.st;s.rt+=dt;if(s.loop&&s.rt>=s.loop[1])s.rt=s.loop[0];sync(sim);},
  metrics:[
    {id:'N',label:'Scale reading',unit:'N',lvl:'bio',d:0,max:null,get:s=>z(Nof(s))},
    {id:'kg',label:'Bathroom scale shows',unit:'kg',lvl:'bio',d:1,max:null,get:s=>z(Nof(s)/G)},
    {id:'W',label:'Your weight (mg)',unit:'N',lvl:'bio',d:0,max:null,get:s=>s.p.mass*G},
    {id:'vel',label:'Velocity (up is +)',unit:'m/s',lvl:'bio',d:2,max:null,get:s=>z(s.st.v)},
    {id:'acc',label:'Acceleration (up is +)',unit:'m/s²',lvl:'bio',d:2,max:null,get:s=>z(s.st.a)},
    {id:'motion',label:'Right now',unit:'',text:true,lvl:'bio',noTrial:true,get:s=>motionText(s)},
    {id:'ratio',label:'Scale ÷ weight (g-force)',unit:'g',lvl:'honors',d:2,max:null,get:s=>z((G+s.st.a)/G)},
    {id:'T',label:'Cable tension on the car',unit:'N',lvl:'ap',d:0,max:null,get:s=>s.p.ride==='drop'?NaN:z((s.p.carM+s.p.mass)*(G+s.st.a))},
    {id:'y',label:'Height above the bottom',unit:'m',lvl:'ap',d:1,max:null,get:s=>z(s.st.y)}
  ],
  graphs:[{id:'N',label:'Scale reading and weight',lines:['N','W']},{id:'vel',label:'Velocity',lines:['vel']},{id:'acc',label:'Acceleration',lines:['acc']},
          {id:'ratio',label:'Scale ÷ weight',lvl:'honors',lines:['ratio']},{id:'T',label:'Cable tension',lvl:'ap',lines:['T']},{id:'y',label:'Height',lvl:'ap',lines:['y']}],
  defaultGraph:'N',
  onLevel(sim){syncMode(sim);},
  challenges:[
    {lvl:'bio',q:'You (60 kg) stand on a scale in an elevator at the lobby. It starts up and speeds up. What does the scale read while it speeds up?',
     choices:['More than your 588 N weight','Exactly your weight, 588 N','Less than your weight'],correct:0,
     baseline:{ride:'up'},watch:'N',reveal:2.0,
     explain:{bio:'The acceleration points up, so the floor has to push up harder than gravity pulls down. The scale reads 648 N, about 10% more than your weight. You feel heavier.',
              honors:'N − mg = ma with a = +1.0 m/s², so N = m(g + a) = 60 × 10.8 = 648 N.'}},
    {lvl:'bio',q:'Now the elevator is cruising up at a steady 2.0 m/s. What does the scale read?',
     choices:['More than 588 N, because you are moving up','588 N, the same as standing still','Less than 588 N'],correct:1,
     baseline:{ride:'up'},watch:'N',reveal:5.0,
     explain:{bio:'Steady speed means zero acceleration, so the forces balance: the floor pushes up exactly as hard as gravity pulls down. Moving at a constant velocity feels the same as standing still.'}},
    {lvl:'bio',q:'The elevator is going down and slowing to a stop at the lobby. Is the scale reading more or less than your 588 N weight?',
     choices:['Less, because you are going down','More, because the acceleration points up','Exactly 588 N'],correct:1,
     baseline:{ride:'down'},watch:'N',reveal:8.0,
     explain:{bio:'You are moving down, but slowing down means the acceleration points up. The floor pushes harder than gravity to slow you, so the scale reads 648 N. “Going down means lighter” is the trap. “Accelerating down means lighter” is the rule.'}},
    {lvl:'bio',q:'On the drop tower your seat is a scale. What does it read during the free fall?',
     choices:['0 N: the seat stops pushing on you','A little less than 588 N','588 N: your weight hasn’t changed'],correct:0,
     baseline:{ride:'drop'},watch:'N',reveal:2.0,
     explain:{bio:'You and the seat both fall at 9.8 m/s², so the seat doesn’t need to push on you at all. The scale reads 0 N. Gravity still pulls on you with 588 N. That is why free fall feels weightless.'}},
    {lvl:'honors',q:'The v–t graph shows the elevator going from 0 to +2.0 m/s in 2.0 s. What does the scale read for a 60 kg rider during that time?',
     choices:['648 N','588 N','528 N','60 N'],correct:0,
     baseline:{ride:'up'},watch:'N',reveal:2.0,
     explain:{honors:'Slope of v–t = a = 2.0 ÷ 2.0 = +1.0 m/s². N = m(g + a) = 60 × (9.8 + 1.0) = 648 N.'}},
    {lvl:'honors',q:'Going down, the elevator speeds up from 0 to −3.0 m/s in 2.0 s. What does the scale read for a 70 kg rider?',
     choices:['581 N','686 N','791 N','105 N'],correct:0,
     baseline:{ride:'down',mass:70,accel:1.5,vmax:3.0},watch:'N',reveal:2.0,
     explain:{honors:'Slope = −3.0 ÷ 2.0 = −1.5 m/s², so a points down. N = m(g + a) = 70 × (9.8 − 1.5) = 70 × 8.3 = 581 N, less than the 686 N weight.'}},
    {lvl:'honors',q:'The elevator now cruises at 4.0 m/s instead of 2.0 m/s, with the same 1.0 m/s² acceleration. While it speeds up, what does the scale read for a 60 kg rider?',
     choices:['648 N, the same as with the slower cruise','More than 648 N, because it will end up going faster','Less than 648 N'],correct:0,
     baseline:{ride:'up',vmax:4.0},watch:'N',reveal:3.0,
     explain:{honors:'The scale depends on the acceleration, not the speed. a is still +1.0 m/s², so N = 60 × 10.8 = 648 N. Speeding up to 4.0 m/s just takes 4.0 s instead of 2.0 s.'}},
    {lvl:'honors',instant:true,q:'A 60 kg rider’s scale reads 480 N. Is the elevator moving down?',
     choices:['Yes, it must be moving down','Not necessarily: it could be going up and slowing down, or going down and speeding up','No, it must be moving up'],correct:1,
     explain:{honors:'a = N/m − g = 480 ÷ 60 − 9.8 = 8.0 − 9.8 = −1.8 m/s². The acceleration points down. That happens going down while speeding up, or going up while slowing down. The scale tells you the direction of a, not of v.'}},
    {lvl:'ap',q:'An elevator car (M = 1000 kg) carries a 60 kg rider and speeds up going up at 1.0 m/s². What is the cable tension? No counterweight.',
     choices:['11,448 N','10,388 N','9,328 N','648 N'],correct:0,
     baseline:{ride:'up',fbd:'sys'},watch:'T',reveal:2.0,
     explain:{ap:'Take car + rider as the system: T − (M + m)g = (M + m)a, so T = (M + m)(g + a) = 1060 × 10.8 = 11,448 N. The normal force between rider and floor is internal to this system, so it doesn’t appear.'}},
    {lvl:'ap',q:'Same car and rider, now going up and slowing down at 1.0 m/s². How does the cable tension compare with the total weight (M + m)g = 10,388 N?',
     choices:['Less: 9,328 N','Equal: 10,388 N, because the car is still moving up','More, because the cable has to hold the car up'],correct:0,
     baseline:{ride:'up',fbd:'sys'},watch:'T',reveal:8.0,
     explain:{ap:'a = −1.0 m/s², so T = (M + m)(g + a) = 1060 × 8.8 = 9,328 N. The net force on the system points down, the same direction as its acceleration, even though it is still moving up.'}},
    {lvl:'ap',q:'A downward ride’s v–t graph: v rises from −2.0 m/s back to 0 over the last 2 s. Which free-body diagram of the rider matches that stretch?',
     choices:['N arrow longer than mg','N arrow equal to mg','N arrow shorter than mg','Only mg, no N'],correct:0,
     baseline:{ride:'down'},watch:'N',reveal:8.0,
     explain:{ap:'Slope = (0 − (−2.0)) ÷ 2 = +1.0 m/s². A positive slope means a points up, so the net force points up: N > mg. For 60 kg, N = 648 N and mg = 588 N.'}},
    {lvl:'ap',q:'The drop-tower brakes stop the seat from 19.6 m/s to 0 in 1.0 s. How hard does the seat push on a 60 kg rider?',
     choices:['1764 N, 3 times your weight','1176 N, 2 times your weight','588 N, your weight','0 N, because you are still moving down'],correct:0,
     baseline:{ride:'drop'},watch:'N',reveal:3.5,
     explain:{ap:'a = +19.6 m/s² (2g up) while still moving down. N = m(g + a) = 60 × 29.4 = 1764 N = 3mg. Riders feel “3 g” even though the brakes only supply 2g of deceleration: the seat must also hold up their weight.'}}
  ],
  narrate(sim){const p=sim.p,s=sim.st,hon=atLeast('honors'),ap=atLeast('ap'),m=p.mass,W=m*G,N=Nof(sim),sys=sysView(sim);
    const eq=hon?' N = m(g + a) = '+m+' × (9.8 '+(s.a>=0?'+ ':'− ')+Math.abs(s.a).toFixed(1)+') = '+f0(N)+' N.':'';
    const ten=sys?' Car + rider: T = (M + m)(g + a) = '+(p.carM+m)+' × '+(G+s.a).toFixed(1)+' = '+f0((p.carM+m)*(G+s.a))+' N.':'';
    switch(s.ph){
      case 'rest':return '<b>Start here:</b> watch the scale reading (top left) and the arrows in the free-body diagram. At rest the floor pushes up exactly as hard as gravity pulls down, so the scale reads your weight, '+f0(W)+' N. Press <b>Ride again</b> any time to replay.'+ten;
      case 'top':return '<b>Start here:</b> you are held 29.4 m up on a drop tower. Your seat is a scale, and right now it reads your weight, '+f0(W)+' N. Watch what it reads once you drop.';
      case 'speed':return p.ride!=='down'?'<b>Speeding up while going up:</b> the acceleration points up, so the floor must push harder than gravity pulls. The scale reads '+f0(N)+' N, more than your '+f0(W)+' N weight.'+eq+ten
                               :'<b>Starting down:</b> the acceleration points down, so the floor pushes less than gravity pulls. The scale reads '+f0(N)+' N, less than your '+f0(W)+' N weight.'+eq+ten;
      case 'cruise':return '<b>Steady speed:</b> you move '+(p.ride!=='down'?'up':'down')+' at '+Math.abs(s.v).toFixed(1)+' m/s, but a = 0, so the forces balance. The scale reads '+f0(N)+' N, the same as standing still.'+ten;
      case 'slow':return p.ride!=='down'?'<b>Still going up, but slowing down:</b> the acceleration points down, so the scale reads less, '+f0(N)+' N. Moving up does not make you heavier; accelerating up does.'+eq+ten
                              :'<b>Going down, but slowing to a stop:</b> the acceleration points up, so the scale reads more, '+f0(N)+' N. Going down does not make you lighter; accelerating down does.'+eq+ten;
      case 'fall':return '<b>Free fall:</b> you and the seat both fall at 9.8 m/s², so the seat doesn’t push on you at all. The scale reads 0 N, but gravity still pulls on you with '+f0(W)+' N.'+(hon?' N = m(g + a) = '+m+' × (9.8 − 9.8) = 0.':'');
      case 'brake':return '<b>Brakes on:</b> you are still moving down, but the acceleration is 19.6 m/s² up. The seat pushes with '+f0(N)+' N, three times your weight.'+eq;
      default:{const nx=p.ride==='up'?'switch <b>Ride</b> to <b>Elevator going down</b> and predict each reading before it happens.':p.ride==='down'?'try the <b>Drop tower</b>.':(hon?'go back to an elevator and change the acceleration. Predict the scale reading with N = m(g + a) first.':'go back to an elevator and change the acceleration.');
        const trip=s.P.drop?'You dropped 29.4 m.':(p.ride==='up'?'You rose ':'You came down ')+s.P.D.toFixed(1)+' m.';
        return '<b>Ride over.</b> '+trip+' Stopped again, the scale is back to your weight, '+f0(W)+' N. <b>Next:</b> '+nx;}}},
  tour:[
    {title:'You, a scale and an elevator',text:{bio:'You (60 kg) stand on a scale in an elevator at the lobby. The doors are closed. The scale reads 588 N, your weight, because the floor pushes up exactly as hard as gravity pulls down.',
       honors:'The scale reads the normal force N, the push of the floor on you. At rest N = mg = 60 × 9.8 = 588 N. A bathroom scale divides by 9.8 and shows 60.0 kg.'},
     focus:[[16,10,250,430],[266,10,268,430]],pause:true,setup(sim){go(sim,{ride:'up'},0);}},
    {title:'Speeding up, going up',text:{bio:'The elevator speeds up on its way up. The floor has to push you up harder than gravity pulls you down, so the green arrow grows and the scale reads 648 N. You feel heavier.',
       honors:'a = +1.0 m/s². Newton’s second law: N − mg = ma, so N = m(g + a) = 60 × 10.8 = 648 N. The green N arrow is longer than the blue mg arrow.'},
     focus:[[16,10,250,430],[266,10,268,430]],speed:0.4,setup(sim){go(sim,{ride:'up'},0.6,[0.6,3.4]);}},
    {title:'Steady speed feels normal',text:{bio:'Now it cruises up at a steady 2.0 m/s. No speeding up or slowing down, so the forces balance and the scale reads 588 N again, the same as standing still.',
       honors:'Constant velocity means a = 0, so N = mg = 588 N even at 2.0 m/s. The scale cannot tell cruising from standing still.'},
     focus:[[16,10,250,430],[266,10,268,430]],speed:0.5,setup(sim){go(sim,{ride:'up'},2.6,[2.6,7.0]);}},
    {title:'Slowing at the top',text:{bio:'Near the top it slows down. You are still moving up, but the acceleration now points down. The floor pushes less than gravity pulls, so the scale reads 528 N. You feel lighter.',
       honors:'a = −1.0 m/s² while v is still positive. N = 60 × (9.8 − 1.0) = 528 N. v is decreasing, so the slope of the v–t graph is negative, and so is a. Which way you move does not set the sign.'},
     focus:[[16,10,250,430],[266,10,268,430]],speed:0.4,setup(sim){go(sim,{ride:'up'},6.6,[6.6,9.6]);}},
    {title:'Read the two graphs',text:{bio:'The top graph is velocity. Where it climbs, the elevator speeds up going up and the scale (bottom graph) reads high. Where it is flat, the scale reads your weight. Where it falls, the scale reads low.',
       honors:'The slope of the v–t graph is a. Positive slope: N above mg. Zero slope: N = mg. Negative slope: N below mg. The scale graph is the v–t slope, shifted up by g and multiplied by m.'},
     focus:[536,10,258,430],pause:true,setup(sim){go(sim,{ride:'up'},10);}},
    {title:'Going down: the trap',text:{bio:'Going down, the scale reads 528 N as you start down and 648 N as you slow to a stop at the lobby. Going down does not mean lighter. Accelerating down means lighter.',
       honors:'Going down, v is negative the whole trip, but a is −1.0 m/s² at the start (N = 528 N) and +1.0 m/s² at the end (N = 648 N). Read the slope of the v–t graph, not its sign.'},
     focus:[[16,10,250,430],[536,10,258,430]],speed:0.7,setup(sim){go(sim,{ride:'down'},0,[0,10.5]);}},
    {title:'Free fall reads zero',text:{bio:'On a drop tower your seat is the scale. In free fall you and the seat fall together, so the seat stops pushing: 0 N. Then the brakes push up with 1764 N, three times your weight, to stop you.',
       honors:'In free fall a = −9.8 m/s², so N = m(g + a) = 0. Braking at +19.6 m/s² gives N = 60 × 29.4 = 1764 N = 3mg. Gravity pulls with 588 N the whole time.'},
     focus:[[16,10,250,430],[266,10,268,430],[536,222,258,216]],speed:0.4,setup(sim){go(sim,{ride:'drop'},0,[0,5.2]);}},
    {lvl:'honors',title:'From the graph to the scale',text:'Paused while speeding up going up. Read the slope off the v–t graph: 2.0 m/s in 2.0 s is a = +1.0 m/s². Then N = m(g + a) = 60 × (9.8 + 1.0) = 648 N, which is what the scale shows.',
     focus:[[16,10,250,80],[266,330,268,110],[536,10,258,205]],pause:true,setup(sim){go(sim,{ride:'up'},2.0);}},
    {lvl:'ap',title:'Car + rider as one system',text:'Switch the free-body diagram to car + rider. The floor’s push on you is now internal, so only the cable tension and the total weight remain: T − (M + m)g = (M + m)a. With M = 1000 kg, T = 1060 × 10.8 = 11,448 N while speeding up going up.',
     focus:[[266,10,268,430],[16,10,250,80]],speed:0.4,setup(sim){go(sim,{ride:'up',fbd:'sys'},0.6,[0.6,3.4]);}}
  ],
  onTourExit(sim){go(sim,{ride:'up'},0);syncMode(sim);},
  lab:{bio:'<p><b>Question:</b> When does the scale read more than your weight, and when less?</p><ol><li>Ride the elevator up. Press <b>Pause</b> once in each part of the ride (at rest, speeding up, cruising, slowing down) and record a trial each time.</li><li>Repeat with the elevator going down.</li><li>For each trial, write the direction of motion and the direction of the acceleration next to the scale reading.</li></ol><p>Write a claim: which one decides whether the scale reads high or low, the direction of motion or the direction of the acceleration? Back it with your data.</p>',
       honors:'<p><b>Question:</b> How does the scale reading depend on the elevator’s acceleration?</p><ol><li>Elevator going up, mass 60 kg. Set the acceleration to 0.5, 1.0, 1.5 and 2.0 m/s².</li><li>For each, pause while it speeds up and record a trial. Also record one at rest (a = 0).</li><li>Graph acceleration (x) against scale reading (y) and find the slope and intercept.</li></ol><p>What should the slope and the intercept equal? Use N = m(g + a) to explain, then check with a different mass.</p>',
       ap:'<p><b>Question:</b> Can you find the rider’s mass and g from scale readings alone?</p><ol><li>Pick a mass and keep it hidden from your partner. Record trials during every part of an up ride, a down ride and the drop tower.</li><li>Plot acceleration a (x) against scale reading N (y).</li><li>Fit a line. Then switch to <b>Car + rider</b> and record cable tensions for the same accelerations.</li></ol><p><b>Claim–evidence–reasoning:</b> Use Newton’s second law to explain what the slope and intercept of each line tell you, and why the free-fall point lands at N = 0.</p>'},
  terms:[{t:'Weight',d:'The pull of gravity on you, mg. It does not change in an elevator: 588 N for a 60 kg person.'},
    {t:'Normal force',d:'The push of a surface on you, perpendicular to the surface. A scale measures this push.'},
    {t:'Apparent weight',d:'What a scale reads: the normal force. It is more than your weight when your acceleration points up and less when it points down.'},
    {t:'Free fall',d:'Falling with only gravity acting, a = 9.8 m/s² down. A scale falling with you reads 0.'},
    {t:'Direction of acceleration',d:'Up if you are speeding up going up or slowing down going down. Down if you are speeding up going down or slowing down going up.'},
    {lvl:'honors',t:'Newton’s second law (vertical)',d:'N − mg = ma, with up as positive. So N = m(g + a).'},
    {lvl:'honors',t:'Slope of a v–t graph',d:'The acceleration. A positive slope means a points up (with up as positive), whatever the sign of v.'},
    {lvl:'ap',t:'System',d:'The objects you choose to treat as one. For car + rider, the floor’s push on the rider is an internal force and drops out.'},
    {lvl:'ap',t:'Tension',d:'The pull of the cable. For car + rider with no counterweight, T = (M + m)(g + a).'}],
  about:'<p>Vertical Newton’s-second-law model with g = 9.8 m/s² and up as positive. The scale reads the normal force N = m(g + a).</p><ul><li><b>Elevator:</b> 1.0 s at rest, then speeding up at the set acceleration to the cruising speed, 4.0 s at that speed, then slowing at the same rate to a stop. Floors are 3.0 m apart.</li><li><b>Drop tower:</b> 1.0 s held at the top, 2.0 s of free fall (19.6 m, reaching 19.6 m/s), then brakes at 19.6 m/s² (2g) stop the seat in 1.0 s over 9.8 m. These are model numbers, not a specific ride.</li><li><b>Cable tension:</b> T = (M + m)(g + a) for one cable holding car and rider.</li></ul><p>Simplified: the acceleration switches on and off instantly (real elevators ramp it smoothly, so the scale changes gradually), there is no counterweight, the scale responds instantly, and air drag is ignored.</p>',
  initVis(sim){},
  draw(sim,ctx,vdt,k,t){k=Math.min(k,1.4);const p=sim.p,s=sim.st;
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    if(s.P.drop)drawTower(sim,ctx,k);else drawShaft(sim,ctx,k);
    drawCard(sim,ctx,k);drawFBD(sim,ctx,k);drawGraphs(sim,ctx,k);},
  thumbSetup(sim){sim.st=SIM.init(sim);sim.st.rt=2.0;sim.st.loop=[2.0,2.0001];sync(sim);}
};

/* ---------- drawing ---------- */
function vaArrows(ctx,x,y,s,k){const vl=s.v===0?0:Math.sign(s.v)*clamp(10+Math.abs(s.v)*14,14,80),al=s.a===0?0:Math.sign(s.a)*clamp(18+Math.abs(s.a)*5,22,80);
  if(vl)arrow(ctx,x,y,0,-vl,PAL[C_V],4);txt(ctx,'v',x,vl>0?y+16*k:vl<0?y-8:y-6,{s:12.5*k,w:700,a:'center',c:PAL[C_V]});
  if(al)arrow(ctx,x+20,y,0,-al,PAL[C_A],4);txt(ctx,'a',x+20,al>0?y+16*k:al<0?y-8:y-6,{s:12.5*k,w:700,a:'center',c:PAL[C_A]});
  if(!vl)txt(ctx,'0',x,y+10,{s:11*k,a:'center',c:PAL[C_V]});if(!al)txt(ctx,'0',x+20,y+10,{s:11*k,a:'center',c:PAL[C_A]});}
function person(ctx,cx,feet,r,k){const h=0.87*clamp(1-0.08*(r-1),0.85,1.04),float=r<0.2;ctx.strokeStyle=PAL['cv-ink'];ctx.fillStyle=PAL['cv-ink'];ctx.lineWidth=5;ctx.lineCap='round';
  const hip=feet-46*h,sh=feet-92*h;ctx.beginPath();ctx.moveTo(cx-10,feet);ctx.lineTo(cx,hip);ctx.lineTo(cx+10,feet);ctx.moveTo(cx,hip);ctx.lineTo(cx,sh);
  if(float){ctx.moveTo(cx,sh+4);ctx.lineTo(cx-20,sh-24);ctx.moveTo(cx,sh+4);ctx.lineTo(cx+20,sh-24);}else{ctx.moveTo(cx,sh+4);ctx.lineTo(cx-14,sh+36);ctx.moveTo(cx,sh+4);ctx.lineTo(cx+14,sh+36);}
  ctx.stroke();ctx.beginPath();ctx.arc(cx,sh-12*h/0.87,10,0,6.29);ctx.fill();}
function drawShaft(sim,ctx,k){const s=sim.st,PPM=60,CFY=352,top=CFY-150;
  ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(22,0,240,450);
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(22,0);ctx.lineTo(22,450);ctx.moveTo(262,0);ctx.lineTo(262,450);ctx.stroke();
  const nTop=Math.ceil(s.P.D/FLOOR)+3;
  for(let n=1;n<=nTop;n++){const yf=(n-1)*FLOOR,sy=CFY-(yf-s.y)*PPM;if(sy<-20||sy>470)continue;
    ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(22,sy,240,8);
    ctx.fillStyle=PAL['card'];ctx.beginPath();ctx.arc(42,sy-18,11*Math.min(k,1.2),0,6.29);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
    txt(ctx,String(n),42,sy-18,{s:11.5*k,w:700,a:'center',b:'middle',c:PAL['cv-ink']});}
  // cable and car
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(138,0);ctx.lineTo(138,top);ctx.stroke();
  ctx.fillStyle=PAL['card'];rr(ctx,68,top,140,150,6);ctx.fill();ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2.5;ctx.stroke();
  ctx.fillStyle=PAL['cv-soft'];ctx.fillRect(68,CFY-4,140,4);
  // scale under the feet
  ctx.fillStyle='#3a3e45';rr(ctx,108,CFY-14,60,10,3);ctx.fill();ctx.fillStyle='#9fe3a8';ctx.fillRect(130,CFY-12,16,5);
  person(ctx,138,CFY-14,(G+s.a)/G,k);
  vaArrows(ctx,226,CFY-90,s,k);}
function drawTower(sim,ctx,k){const s=sim.st,PPM=9,GY=430,sy=GY-s.y*PPM;
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(22,GY,240,20);
  ctx.fillStyle=PAL['cv-soft'];ctx.fillRect(112,GY-335,24,335);
  ctx.globalAlpha=0.85;ctx.fillStyle=PAL['s4'];for(let y=GY-88;y<GY;y+=9)ctx.fillRect(136,y+2,6,6);ctx.globalAlpha=1;
  txt(ctx,'Brakes',104,GY-40,{s:11.5*k,w:700,a:'right',c:PAL['s4']});
  for(let h=0;h<=30;h+=10){const y=GY-h*PPM;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(98,y);ctx.lineTo(112,y);ctx.stroke();if(h>0)txt(ctx,h+' m',94,y+4,{s:11*k,a:'right',c:PAL['cv-soft']});}
  // seat (a scale) and seated rider
  ctx.fillStyle='#3a3e45';ctx.fillRect(142,sy-58,8,58);rr(ctx,142,sy-8,62,8,2);ctx.fill();ctx.fillStyle='#9fe3a8';ctx.fillRect(176,sy-6,14,4);
  const r=(G+s.a)/G,float=r<0.2;ctx.strokeStyle=PAL['cv-ink'];ctx.fillStyle=PAL['cv-ink'];ctx.lineWidth=4.5;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(158,sy-12);ctx.lineTo(156,sy-46);ctx.moveTo(158,sy-12);ctx.lineTo(190,sy-12);ctx.lineTo(194,sy+10);
  if(float){ctx.moveTo(156,sy-40);ctx.lineTo(140,sy-68);ctx.moveTo(156,sy-40);ctx.lineTo(176,sy-68);}else{ctx.moveTo(156,sy-40);ctx.lineTo(178,sy-28);}
  ctx.stroke();ctx.beginPath();ctx.arc(156,sy-57,9,0,6.29);ctx.fill();
  vaArrows(ctx,226,clamp(sy-40,150,330),s,k);}
function drawCard(sim,ctx,k){const s=sim.st,p=sim.p,N=Nof(sim);
  ctx.fillStyle=PAL['card'];rr(ctx,26,10,232,70,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,'⏱ '+Math.max(0,s.rt).toFixed(1)+' s',38,30,{s:12*k,c:PAL['cv-soft']});
  const loc=s.P.drop?'Height '+s.y.toFixed(1)+' m':'Floor '+(1+Math.floor(s.y/FLOOR+1e-6))+(s.v>0?' ▲':s.v<0?' ▼':'');
  txt(ctx,loc,246,30,{s:12*k,a:'right',c:PAL['cv-soft']});
  txt(ctx,'Scale: '+f0(N)+' N',38,62,{s:20*Math.min(k,1.25),w:700,c:PAL[C_N]});}
function drawFBD(sim,ctx,k){const s=sim.st,p=sim.p,hon=atLeast('honors'),sys=sysView(sim),X=270,Y=10,W=262,H=428,kk=Math.min(k,1.5),ke=Math.min(k,1.25);
  ctx.fillStyle=PAL['card'];rr(ctx,X,Y,W,H,12);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  const m=sys?p.carM+p.mass:p.mass,Wt=m*G,Up=m*(G+s.a),cx=X+60,cy=Y+234,PX=(s.P.drop?52:62)/Wt,lu=Up*PX,lw=Wt*PX;
  txt(ctx,sys?'Forces on car + rider':hon?'Free-body diagram: you':'Forces on you',X+12,Y+24,{s:12.5*kk,w:700});
  txt(ctx,'Mass '+m+' kg',X+12,Y+30+16*kk,{s:11*kk,c:PAL['cv-soft']});
  if(lu>1)arrow(ctx,cx,cy,0,-lu,PAL[C_N],4);arrow(ctx,cx,cy,0,lw,PAL[C_W],4);
  const upName=sys?'Cable T':hon?'N':(p.ride==='drop'?'Seat pushes up':'Floor pushes up'),wName=sys?'Weight (M + m)g':hon?'Weight mg':'Gravity pulls down';
  const uy=lu>1?cy-Math.max(lu*0.5,18):cy-16,wy=cy+Math.max(lw*0.5,18);
  txt(ctx,upName,cx+12,uy-8*kk,{s:12*kk,w:600,c:PAL[C_N]});txt(ctx,f0(Up)+' N',cx+12,uy+8*kk,{s:12*kk,w:700,c:PAL['cv-ink']});
  txt(ctx,wName,cx+12,wy-8*kk,{s:12*kk,w:600,c:PAL[C_W]});txt(ctx,f0(Wt)+' N',cx+12,wy+8*kk,{s:12*kk,w:700,c:PAL['cv-ink']});
  ctx.fillStyle=PAL['cv-ink'];ctx.beginPath();ctx.arc(cx,cy,6,0,6.29);ctx.fill();
  // acceleration: its direction is drawn, its size is in the label
  const ax=X+232,al=s.a===0?0:Math.sign(s.a)*clamp(24+Math.abs(s.a)*6,28,140);
  if(al){arrow(ctx,ax,cy,0,-al,PAL[C_A],4);txt(ctx,'a',ax-8,cy-al*0.5,{s:13*kk,w:700,a:'right',c:PAL[C_A]});txt(ctx,Math.abs(s.a).toFixed(1)+' m/s²',X+W-8,al>0?cy-al-8:cy-al+16*kk,{s:11*kk,a:'right',c:PAL[C_A]});}
  else txt(ctx,'a = 0',X+W-8,cy+4,{s:12.5*kk,w:700,a:'right',c:PAL[C_A]});
  const r=Up/Wt;let msg;
  if(r<0.005)msg=sys?'T = 0':'No push: weightless';
  else if(Math.abs(r-1)<1e-6)msg=sys?'T = (M + m)g':'Push = weight: normal';
  else msg=r>1?(sys?'T > (M + m)g':'Push > weight: heavier'):(sys?'T < (M + m)g':'Push < weight: lighter');
  txt(ctx,msg,X+12,Y+H-62,{s:12.5*kk,w:700,c:r>1+1e-6?PAL[C_N]:r<1-1e-6?PAL[C_W]:PAL['cv-ink']});
  if(hon){const pm=(s.a>=0?'+ ':'− ')+Math.abs(s.a).toFixed(1);
    txt(ctx,sys?'T = (M + m)(g + a)':'N = m(g + a)',X+12,Y+H-38,{s:12*ke,c:PAL['cv-ink']});
    txt(ctx,'= '+m+' × (9.8 '+pm+') = '+f0(Up)+' N',X+12,Y+H-16,{s:12*ke,c:PAL['cv-ink']});}
  else txt(ctx,'Forces drawn to scale. Purple: a.',X+12,Y+H-38,{s:11*ke,c:PAL['cv-soft']});}
function drawGraphs(sim,ctx,k){k=Math.min(k,1.35);const s=sim.st,P=s.P,p=sim.p,hon=atLeast('honors'),W=p.mass*G;
  const xmax=Math.ceil(P.end+1),tick=xmax>14?5:2,tnow=Math.min(s.rt,xmax);
  const Ns=P.segs.map(g=>p.mass*(G+g.a)),Nmax=Math.max(...Ns,W),Nhi=Math.max(W*1.25,Nmax*1.12),Vm=P.vpk;
  const panel=(y,h,title,right)=>{ctx.fillStyle=PAL['card'];rr(ctx,540,y,252,h,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
    txt(ctx,title,552,y+20,{s:12*k,w:700});if(right)txt(ctx,right,782,y+20,{s:11.5*k,a:'right',c:PAL['cv-soft']});};
  const frame=(L,T,Wd,Ht,ymin,ymax,ticks)=>{const X=t=>L+t/xmax*Wd,Yf=v=>T+Ht-(clamp(v,ymin,ymax)-ymin)/(ymax-ymin)*Ht;
    ctx.strokeStyle=PAL['g-grid'];ctx.lineWidth=1;ticks.forEach(([v,l])=>{const y=Yf(v)+.5;ctx.beginPath();ctx.moveTo(L,y);ctx.lineTo(L+Wd,y);ctx.stroke();txt(ctx,l,L-5,y,{s:10*k,a:'right',b:'middle',c:PAL['g-axis']});});
    ctx.strokeStyle=PAL['g-axis'];ctx.beginPath();ctx.moveTo(L+.5,T);ctx.lineTo(L+.5,T+Ht);ctx.stroke();
    for(let tt=0;tt<=xmax;tt+=tick)txt(ctx,String(tt),X(tt),T+Ht+12*k,{s:10*k,a:'center',c:PAL['g-axis']});
    return {X,Y:Yf};};
  const trace=(G2,pts,col)=>{ctx.strokeStyle=col;ctx.lineWidth=2.6;ctx.lineJoin='round';ctx.beginPath();pts.forEach((q,i)=>{const X=G2.X(q[0]),Y=G2.Y(q[1]);i?ctx.lineTo(X,Y):ctx.moveTo(X,Y);});ctx.stroke();
    const q=pts[pts.length-1];ctx.fillStyle=col;ctx.beginPath();ctx.arc(G2.X(q[0]),G2.Y(q[1]),4,0,6.29);ctx.fill();};
  // velocity–time
  panel(10,206,'v (m/s)',hon?'slope a = '+sgn(s.a)+Math.abs(s.a).toFixed(1)+' m/s²':'up is +');
  const vt=frame(588,44,194,132,-Vm*1.15,Vm*1.15,[[Vm,f1(Vm)],[0,'0'],[-Vm,f1(-Vm)]]);
  ctx.strokeStyle=PAL['g-axis'];ctx.beginPath();ctx.moveTo(588,vt.Y(0)+.5);ctx.lineTo(782,vt.Y(0)+.5);ctx.stroke();
  const vp=[[0,0]];P.segs.forEach(g=>{if(g.t0<tnow){const tt=Math.min(g.t1,tnow);vp.push([tt,at(P,tt).v]);}});if(tnow>P.end)vp.push([tnow,0]);
  trace(vt,vp,PAL[C_V]);
  txt(ctx,'t (s)',782,206,{s:10*k,a:'right',c:PAL['muted']});
  // scale reading–time
  panel(224,214,'Scale (N)','now '+f0(Nof(sim))+' N');
  const nt=frame(588,258,194,126,0,Nhi,[[0,'0'],[W,f0(W)]].concat(Nmax>W*1.3?[[Nmax,f0(Nmax)]]:[]));
  ctx.setLineDash([5,4]);ctx.strokeStyle=PAL[C_W];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(588,nt.Y(W));ctx.lineTo(782,nt.Y(W));ctx.stroke();ctx.setLineDash([]);
  ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(552,426);ctx.lineTo(572,426);ctx.stroke();ctx.setLineDash([]);txt(ctx,'weight mg',576,430,{s:10*k,c:PAL[C_W]});
  const np=[];P.segs.forEach((g,i)=>{if(g.t0<tnow){np.push([g.t0,Ns[i]]);np.push([Math.min(g.t1,tnow),Ns[i]]);}});if(tnow>P.end){np.push([P.end,W]);np.push([tnow,W]);}
  if(np.length)trace(nt,np,PAL[C_N]);
  txt(ctx,'t (s)',782,430,{s:10*k,a:'right',c:PAL['muted']});}

BioLab.register(SIM);
})();
