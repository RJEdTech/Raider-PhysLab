(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,RM,axes,legend}=BioLab.h;

/* Two boxes on a floor, pulled with a strap or pushed by hand at an angle θ (g = 9.8 m/s²).
   Pull: a strap on box 1 pulls at θ above level; box 2 follows on a light, level rope.
   Push: your hands push box 1 at θ below level; box 1 pushes box 2, which sits in front of it.
   Your force splits into F cos θ (forward) and F sin θ (up for a pull, down for a push), so
   N₁ = m₁g − F sin θ (pull) or m₁g + F sin θ (push), and N₂ = m₂g. Each box's friction comes from its own normal force.
   At rest the boxes stay put while F cos θ ≤ μs(N₁ + N₂). Then the total static friction equals F cos θ, but with two boxes
   its split between them, and the force between the boxes, is not determined, so those readouts show a dash.
   Sliding: a = [F cos θ − μk(N₁ + N₂)]/(m₁ + m₂). Force between the boxes: m₂(a + μk g) = m₂F(cos θ ± μk sin θ)/(m₁ + m₂).
   If F sin θ > m₁g on a pull, the strap would lift box 1, which this model does not cover: the run stops.
   Each run starts from rest and covers 2.0 m; the readings hold for 0.8 s, then the run restarts. A timer records the time to cover 1.50 m; measured a = 2d/t². */
const G=9.8,RUN=2.0,GATE=1.5,PAUSE=0.8,ROPE=0.5,STRAP=0.9,PPM=140,FY=545,X0=30;
const SURF={none:{l:'Frictionless',mus:0,muk:0,c:'#9fc3e6'},wood:{l:'Wood floor',mus:0.40,muk:0.30,c:'#c99a63'},carpet:{l:'Carpet',mus:0.70,muk:0.55,c:'#8a5a7a'}};
const rad=d=>d*Math.PI/180,deg=r=>r*180/Math.PI;
const bw=m=>0.40+0.006*m,bh=m=>0.28+0.005*m;

/* Everything that depends only on the settings. */
function setup(p){const th=rad(p.angle),two=p.boxes==='two',m1=p.m1,m2=two?p.m2:0,M=m1+m2,sf=SURF[p.surface],pull=p.mode==='pull';
  const Fx=p.F*Math.cos(th),Fv=p.F*Math.sin(th),Fy=pull?Fv:-Fv,W1=m1*G,W2=m2*G,N1raw=W1-Fy;
  return {th,two,pull,m1,m2,M,Fx,Fv,Fy,W1,W2,lift:N1raw<-1e-9,N1:Math.max(0,N1raw),N2:W2,mus:sf.mus,muk:sf.muk};}
/* Forces while the boxes slide (moving=true) or sit still. */
function solve(p,moving){const S=setup(p);const o={S,a:0,f1:0,f2:0,ftot:0,inner:S.two?0:NaN,moving:false,stuck:false};
  if(S.lift)return o;
  const Ntot=S.N1+S.N2;
  if(!moving&&S.Fx<=S.mus*Ntot+1e-9){o.stuck=S.Fx>0;o.ftot=S.Fx;if(S.two&&o.stuck){o.f1=NaN;o.f2=NaN;o.inner=NaN;}else{o.f1=S.Fx;o.f2=0;}return o;}
  o.moving=true;o.f1=S.muk*S.N1;o.f2=S.muk*S.N2;o.ftot=o.f1+o.f2;o.a=(S.Fx-o.f1-o.f2)/S.M;if(S.two)o.inner=S.m2*(o.a+S.muk*G);return o;}
/* Acceleration once it starts (0 if static friction holds it, NaN if the strap would lift box 1). */
function aFor(p,mode,angle){const q=Object.assign({},p,{mode,angle});const S=setup(q);if(S.lift)return NaN;const r=solve(q,false);return r.moving?r.a:0;}
/* Best angle once sliding (tan θ = μk for a pull, 0° for a push). NaN if, at that angle, the boxes would not start from rest or the strap would lift box 1. */
const bestAngle=p=>{const b=p.mode==='pull'?deg(Math.atan(SURF[p.surface].muk)):0,v=aFor(p,p.mode,b);return isFinite(v)&&v>0?b:NaN;};

function restart(sim){const s=sim.st;s.x=0;s.v=0;s.rt=0;s.phase='run';s.pause=0;s.gateT=null;s.L=solve(sim.p,false);}
const MODE_CTL={m2:'two'};
const MODE_TILE={inner:'two',N2:'two',f2:'two'};
function syncMode(sim){const two=sim.p.boxes==='two';
  for(const c of SIM.controls){const w=sim.ui.ctlW&&sim.ui.ctlW[c.id];if(!w)continue;w.hidden=!atLeast(c.lvl)||(MODE_CTL[c.id]==='two'&&!two);}
  for(const mt of SIM.metrics){const t=sim.ui.tiles&&sim.ui.tiles[mt.id];if(!t)continue;t.num.closest('.tile').hidden=!atLeast(mt.lvl)||(MODE_TILE[mt.id]==='two'&&!two);}}

function arrow(ctx,x,y,dx,dy,col,w,dash){const L=Math.hypot(dx,dy);if(L<2)return;const head=Math.min(10,4+L*0.25),ux=dx/L,uy=dy/L;
  ctx.save();ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=w||3;ctx.lineCap='round';if(dash)ctx.setLineDash(dash);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+dx-ux*head*0.8,y+dy-uy*head*0.8);ctx.stroke();ctx.setLineDash([]);
  ctx.beginPath();ctx.moveTo(x+dx,y+dy);ctx.lineTo(x+dx-ux*head-uy*head*0.55,y+dy-uy*head+ux*head*0.55);ctx.lineTo(x+dx-ux*head+uy*head*0.55,y+dy-uy*head-ux*head*0.55);ctx.closePath();ctx.fill();ctx.restore();}

/* What the diagrams and tiles show right now. In the short pause after a run they hold the run's last readings. */
function live(sim){const s=sim.st;if(s.phase==='pause')return solve(sim.p,!!(s.L&&s.L.moving));return s.L||solve(sim.p,false);}

const SIM={
  id:'twobody',hash:'twobody',apUnit:2,order:4.5,tab:'Pushing and pulling at an angle',kind:'Simulation',prereq:['forces','friction'],next:['incline'],
  card:'Pull two boxes with a strap or push them by hand at an angle. Watch the normal force, friction and the force between the boxes change.',
  title:'Pushing and pulling at an angle: two connected boxes',
  lede:{bio:'Move boxes of books across a floor. Tilt your pull or push and see why pulling up at an angle is easier than pushing down.',
        honors:'Split an angled force into parts, find each box’s normal force and friction, then get the acceleration from the whole system and the force between the boxes from one box.',
        ap:'Compare system and single-box reasoning, derive the rope tension and contact force, and find the angle that gives the most acceleration.'},
  scale:'Real sizes: boxes of books from 5 to 40 kg, about 40–65 cm wide, dragged 2.0 m across a floor. Forces up to 250 N, about the weight of a 25 kg bag of dog food.',
  aspect:4/3,timeScale:1,dtMax:0.004,prewarm:0,sampleDt:0.04,window:8,unit:'s',chChange:1.5,chReveal:5,
  controls:[
    {id:'mode',label:'How you move them',type:'seg',def:'pull',lvl:'bio',options:[{v:'pull',l:'Pull with a strap'},{v:'push',l:'Push with your hands'}],onChange(sim){restart(sim);}},
    {id:'boxes',label:'Boxes',type:'seg',def:'two',lvl:'bio',options:[{v:'one',l:'One box'},{v:'two',l:'Two boxes'}],onChange(sim){restart(sim);syncMode(sim);}},
    {id:'F',label:'Your force F',type:'range',min:0,max:250,step:5,def:150,unit:' N',lvl:'bio'},
    {id:'angle',label:'Angle from level θ',type:'range',min:0,max:60,step:1,def:30,unit:'°',lvl:'bio',help:'Pulls point up at this angle; pushes point down at it.'},
    {id:'m1',label:'Box 1 mass m₁',type:'range',min:5,max:40,step:1,def:20,unit:' kg',lvl:'bio',help:'Box 1 is the one you hold.'},
    {id:'m2',label:'Box 2 mass m₂',type:'range',min:5,max:40,step:1,def:15,unit:' kg',lvl:'bio',help:'Pull: box 2 trails on a rope. Push: box 2 sits in front.'},
    {id:'surface',label:'Floor',type:'seg',def:'wood',lvl:'bio',options:[{v:'wood',l:'Wood'},{v:'carpet',l:'Carpet'},{v:'none',l:'Frictionless',lvl:'honors'}]}
  ],
  actions:[{id:'again',label:'Start again',primary:true,lvl:'bio',run(sim){restart(sim);}}],
  init(sim){const s={x:0,v:0,rt:0,phase:'run',pause:0,gateT:null,lastA:NaN};sim.st=s;s.L=solve(sim.p,false);return s;},
  step(sim,dt){const s=sim.st,p=sim.p;
    if(s.phase==='pause'){s.pause-=dt;if(s.pause<=0)restart(sim);return;}
    const L=solve(p,s.v>1e-9);s.L=L;
    if(L.S.lift){s.phase='lift';s.v=0;return;}
    if(s.phase==='lift')s.phase='run';
    s.rt+=dt;
    if(!L.moving){s.v=0;return;}
    let v1=s.v+L.a*dt;if(v1<=0){v1=0;s.L=solve(p,false);}
    s.x+=(s.v+v1)/2*dt;s.v=v1;
    if(s.gateT===null&&s.x>=GATE){s.gateT=s.rt;s.lastA=2*GATE/(s.rt*s.rt);}
    if(s.x>=RUN){s.x=RUN;s.v=0;s.phase='pause';s.pause=PAUSE;}},
  metrics:[
    {id:'acc',label:'Acceleration',unit:'m/s²',lvl:'bio',d:2,max:null,get:s=>live(s).a},
    {id:'vel',label:'Speed',unit:'m/s',lvl:'bio',d:2,max:null,get:s=>s.st.v},
    {id:'N1',label:'Normal force on box 1',unit:'N',lvl:'bio',d:1,max:null,get:s=>live(s).S.N1},
    {id:'f1',label:'Friction on box 1',unit:'N',lvl:'bio',d:1,max:null,get:s=>live(s).f1},
    {id:'inner',label:'Force between the boxes',unit:'N',lvl:'bio',d:1,max:null,get:s=>live(s).inner},
    {id:'Fx',label:'Forward part F cos θ',unit:'N',lvl:'honors',d:1,get:s=>setup(s.p).Fx},
    {id:'Fy',label:'Up or down part F sin θ',unit:'N',lvl:'honors',d:1,get:s=>setup(s.p).Fv},
    {id:'N2',label:'Normal force on box 2',unit:'N',lvl:'honors',d:1,get:s=>live(s).S.N2},
    {id:'f2',label:'Friction on box 2',unit:'N',lvl:'honors',d:1,max:null,get:s=>live(s).f2},
    {id:'pred',label:'Predicted a from rest (system)',unit:'m/s²',lvl:'honors',d:2,get:s=>aFor(s.p,s.p.mode,s.p.angle)},
    {id:'meas',label:'Timer: a = 2d/t²',unit:'m/s²',lvl:'honors',d:2,get:s=>s.st.lastA},
    {id:'fnet',label:'Net external force',unit:'N',lvl:'ap',d:1,max:null,get:s=>{const L=live(s);return L.a*L.S.M;}},
    {id:'best',label:'Best angle once sliding',unit:'°',lvl:'ap',d:1,get:s=>bestAngle(s.p)}
  ],
  graphs:[{id:'vel',label:'Speed vs. time',lines:['vel']},{id:'acc',label:'Acceleration vs. time',lines:['acc']},
          {id:'forces',label:'Normal force and friction on box 1',lvl:'honors',lines:['N1','f1']},
          {id:'angle',label:'Acceleration vs. angle (pull and push)',lvl:'honors',custom:true}],
  defaultGraph:'vel',
  plot(sim,ctx,box){const p=sim.p,pts={pull:[],push:[]};let ymax=0.5;
    for(const md of ['pull','push'])for(let a=0;a<=60;a+=1){const v=aFor(p,md,a);pts[md].push([a,v]);if(isFinite(v))ymax=Math.max(ymax,v);}
    ymax=Math.ceil(ymax*1.15*2)/2;
    const ax=axes(ctx,box,{xmin:0,xmax:60,ymin:0,ymax,xl:'Angle θ (degrees)',yl:'Acceleration (m/s²)'});
    const line=(arr,col,dash)=>{ctx.save();ctx.strokeStyle=col;ctx.lineWidth=2.5;if(dash)ctx.setLineDash(dash);ctx.beginPath();let on=false;for(const [a,v] of arr){if(!isFinite(v)){on=false;continue;}const X=ax.X(a),Y=ax.Y(v);if(on)ctx.lineTo(X,Y);else{ctx.moveTo(X,Y);on=true;}}ctx.stroke();ctx.restore();};
    line(pts.pull,PAL['s1']);line(pts.push,PAL['s2'],[7,5]);
    const cur=aFor(p,p.mode,p.angle);if(isFinite(cur)){ctx.fillStyle=p.mode==='pull'?PAL['s1']:PAL['s2'];ctx.beginPath();ctx.arc(ax.X(p.angle),ax.Y(cur),6,0,6.29);ctx.fill();}
    const bp=bestAngle(Object.assign({},p,{mode:'pull'}));if(atLeast('ap')&&SURF[p.surface].muk>0&&isFinite(bp)){const b=bp;ctx.save();ctx.strokeStyle=PAL['cv-soft'];ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(ax.X(b),box.T);ctx.lineTo(ax.X(b),box.T+box.H);ctx.stroke();ctx.restore();
      txt(ctx,'tan θ = μk: '+b.toFixed(1)+'°',ax.X(b)+6,box.T+box.H-10,{s:12,c:PAL['cv-soft']});}
    txt(ctx,'0 means static friction keeps them from starting.',box.L+12,box.T+50,{s:12,c:PAL['cv-soft']});
    legend(ctx,box.L+12,box.T+8,[{label:'Pull (strap up)',color:PAL['s1']},{label:'Push (hands down)',color:PAL['s2'],dash:true}]);},
  onLevel(sim){syncMode(sim);},
  challenges:[
    {lvl:'bio',q:'You drag one 20 kg box across a wood floor with a 100 N strap held level. You raise the strap to 30°. What happens to how hard the floor pushes up on the box?',
     choices:['It gets smaller','It stays the same: the box weighs the same','It gets bigger'],correct:0,
     baseline:{mode:'pull',boxes:'one',F:100,angle:0,m1:20,surface:'wood'},change:{angle:30},changeText:'Strap raised to 30°',watch:'N1',
     explain:{bio:'Part of a slanted pull lifts up on the box. At 30°, 50 N of your 100 N pulls up, so the floor only has to push up with 196 − 50 = 146 N. The box presses down less, so friction drops from 58.8 N to 43.8 N.',
              honors:'F sin θ = 100 × sin 30° = 50 N acts upward, so N = mg − F sin θ = 196 − 50 = 146 N. Kinetic friction μk·N falls from 58.8 N to 43.8 N.'}},
    {lvl:'bio',q:'On the wood floor, you pull two boxes (20 kg and 15 kg) with 150 N at 30° above level, and they slide. Now you push box 1 instead, with the same 150 N at 30° below level. What happens?',
     choices:['They speed up just as fast','They speed up, but more slowly','They do not move at all'],correct:2,
     baseline:{mode:'pull',boxes:'two',F:150,angle:30,m1:20,m2:15,surface:'wood'},change:{mode:'push'},changeText:'Pushing down at 30° instead',watch:'vel',
     explain:{bio:'Pulling up takes weight off the floor; pushing down adds it. Pulled, the floor pushes up on the boxes with 268 N in all, and friction can hold only 107 N, less than your 130 N forward part. Pushed, the floor pushes up with 418 N, and friction can hold up to 167 N, so the boxes stay put.',
              honors:'Pull: N₁ + N₂ = 121 + 147 = 268 N, and μs(N₁ + N₂) = 0.40 × 268 = 107 N < F cos θ = 129.9 N, so they slide. Push: N₁ = 196 + 75 = 271 N, the total is 418 N, and μs × 418 = 167 N > 129.9 N, so static friction holds them.'}},
    {lvl:'bio',q:'A 20 kg box slides with a 150 N strap at 30°. A friend ties a 15 kg box behind it, and you keep the same pull. What happens to the acceleration?',
     choices:['It stays the same','It gets smaller','It gets bigger'],correct:1,
     baseline:{mode:'pull',boxes:'one',F:150,angle:30,m1:20,m2:15,surface:'wood'},change:{boxes:'two'},changeText:'A 15 kg box tied on behind',watch:'acc',
     explain:{bio:'Your pull now has to speed up 35 kg instead of 20 kg, and the second box adds its own friction. The acceleration drops from 4.68 m/s² to 1.41 m/s².'}},
    {lvl:'bio',instant:true,q:'Two boxes slide along, joined by a rope. The rope pulls box 2 forward. What does the same rope do to box 1?',
     choices:['It pulls box 1 backward just as hard','It pulls box 1 forward too','Nothing: the rope only pulls box 2','It pulls box 1 backward, but harder'],correct:0,
     explain:{bio:'A light rope pulls on both ends equally hard. It drags box 2 forward and holds box 1 back with the same force. That is why box 1 needs more forward pull than its own friction: it is also towing box 2.',
              honors:'The rope tension T acts on both boxes: forward on box 2, backward on box 1. The two pulls are equal because the rope is light: a rope with almost no mass needs almost no net force (Newton’s second law), so it pulls equally hard at both ends. The third-law pairs are at each end: rope on box and box on rope. Both pulls are internal to the two-box system, so they cancel when you treat both boxes as one.'}},
    {lvl:'honors',instant:true,q:'You pull box 1 (20 kg) with 150 N at 30° above level. What is the normal force on box 1?',choices:['196 N','121 N','271 N','75 N'],correct:1,
     explain:{honors:'The strap’s upward part is F sin θ = 150 × sin 30° = 75 N. Vertically nothing accelerates, so N₁ + F sin θ = m₁g, and N₁ = 196 − 75 = 121 N.'}},
    {lvl:'honors',q:'Two boxes (20 kg and 15 kg) slide on wood (μk = 0.30). You pull with 150 N at 30°. What is the tension in the rope between the boxes?',
     choices:['150 N, your whole pull','130 N, the forward part of your pull','65 N','44 N, box 2’s friction'],correct:2,
     baseline:{mode:'pull',boxes:'two',F:150,angle:30,m1:20,m2:15,surface:'wood'},change:{},changeText:'Pulling at 150 N, 30°',watch:'inner',at:0.2,reveal:2.2,
     explain:{honors:'System: a = [F cos θ − μk(N₁ + N₂)]/(m₁ + m₂) = (129.9 − 0.30 × 268)/35 = 1.41 m/s². Box 2 alone: T − μk m₂g = m₂a, so T = 15 × 1.414 + 44.1 = 65.3 N. The rope only has to speed up box 2 and beat its friction.'}},
    {lvl:'honors',q:'You pull with 200 N at 30° on wood. Box 2 goes from 15 kg to 30 kg. What happens to the rope tension?',
     choices:['It goes up','It goes down','It stays the same'],correct:0,
     baseline:{mode:'pull',boxes:'two',F:200,angle:30,m1:20,m2:15,surface:'wood'},change:{m2:30},changeText:'Box 2 is now 30 kg',watch:'inner',at:0.5,reveal:2,
     explain:{honors:'The acceleration drops from 2.87 to 1.12 m/s², but the rope now drags twice the mass and twice the friction. T = m₂(a + μk g) goes from 15 × 5.81 = 87.1 N to 30 × 4.06 = 121.9 N.'}},
    {lvl:'honors',q:'You push box 1 (20 kg) with 200 N at 20° below level, and it pushes box 2 (15 kg) ahead on wood. How hard does box 1 push box 2?',
     choices:['200 N','188 N, the forward part of your push','72 N','0 N, box 2 just slides along'],correct:2,
     baseline:{mode:'push',boxes:'two',F:200,angle:20,m1:20,m2:15,surface:'wood'},change:{},changeText:'Pushing at 200 N, 20°',watch:'inner',at:0.2,reveal:2,
     explain:{honors:'N₁ = 196 + 200 sin 20° = 264.4 N. System: a = (187.9 − 0.30 × (264.4 + 147))/35 = 1.84 m/s². Box 2 alone: P − μk m₂g = m₂a, so P = 15 × 1.84 + 44.1 = 71.8 N. Box 2 pushes back on box 1 with the same 71.8 N.'}},
    {lvl:'ap',q:'Two boxes (20 kg and 15 kg) slide on wood (μk = 0.30), pulled with 150 N held level. You raise the strap to 17°. What happens to the acceleration?',
     choices:['It goes up a little','It goes down a little','It stays the same'],correct:0,
     baseline:{mode:'pull',boxes:'two',F:150,angle:0,m1:20,m2:15,surface:'wood'},change:{angle:17},changeText:'Strap raised to 17°',watch:'acc',at:0.5,reveal:2,
     explain:{ap:'a = [F(cos θ + μk sin θ) − μk(m₁ + m₂)g]/(m₁ + m₂). Raising the strap loses a little forward pull (150 → 143.4 N) but removes 43.9 N of normal force, which cuts friction by 13.2 N. The net gain lifts a from 1.35 to 1.53 m/s².'}},
    {lvl:'ap',instant:true,q:'Going further (beyond AP Physics 1): on carpet (μk = 0.55), once the two boxes are sliding, at what strap angle does a fixed pull give them the most acceleration?',choices:['0°, all forward','About 17°','About 29°','45°'],correct:2,
     explain:{ap:'Going further (beyond AP Physics 1): a depends on θ only through cos θ + μk sin θ. A trig identity rewrites it as √(1 + μk²)·cos(θ − φ), with tan φ = μk. Cosine is largest when θ − φ = 0, so the best angle is θ = φ = arctan μk. On carpet that is arctan 0.55 = 28.8°; on wood, arctan 0.30 = 16.7°. This holds once the boxes are sliding and as long as the strap does not lift box 1.'}},
    {lvl:'ap',instant:true,q:'Which expression gives the rope tension T when the boxes slide (strap at θ above level, same μk under both boxes)?',
     choices:['T = m₂F(cos θ + μk sin θ)/(m₁ + m₂)','T = m₂F cos θ/(m₁ + m₂)','T = F cos θ − μk m₁g','T = μk m₂g'],correct:0,
     explain:{ap:'System: (m₁ + m₂)a = F cos θ − μk(m₁g − F sin θ) − μk m₂g. Box 2: T = m₂a + μk m₂g. Substitute a: T = m₂[F cos θ + μk F sin θ − μk(m₁ + m₂)g]/(m₁ + m₂) + μk m₂g = m₂F(cos θ + μk sin θ)/(m₁ + m₂). The g terms cancel. For a push at θ below level, P = m₂F(cos θ − μk sin θ)/(m₁ + m₂).'}},
    {lvl:'ap',q:'Two 10 kg boxes slide on wood, pulled with 150 N at 30°. You swap in two 20 kg boxes. What happens to the acceleration?',
     choices:['It drops to half','It drops to much less than half','It stays the same'],correct:1,
     baseline:{mode:'pull',boxes:'two',F:150,angle:30,m1:10,m2:10,surface:'wood'},change:{m1:20,m2:20},changeText:'Both boxes are now 20 kg',watch:'acc',at:0.3,reveal:1.8,
     explain:{ap:'a = F(cos θ + μk sin θ)/(m₁ + m₂) − μk g. Doubling the mass halves the first term (from 7.62 to 3.81 m/s²), but μk g = 2.94 m/s² does not shrink. So a falls from 4.68 to 0.87 m/s². The tension stays 76.2 N, because m₂/(m₁ + m₂) is still one-half.'}}
  ],
  narrate(sim){const p=sim.p,s=sim.st,hon=atLeast('honors'),L=live(sim),S=L.S,verb=S.pull?'pull':'push',two=S.two;
    if(s.phase==='lift')return '<b>The strap would lift box 1 off the floor.</b> The upward part of your pull ('+S.Fv.toFixed(0)+' N) is more than box 1 weighs ('+S.W1.toFixed(0)+' N). Lower the angle or the force, or use a heavier box.';
    if(s.phase==='pause')return 'End of the 2.0 m run. The readings show the forces just before the end. '+(isFinite(s.lastA)?'The timer measured <b>a = '+s.lastA.toFixed(2)+' m/s²</b> over the first 1.50 m. ':'')+'The next run starts in a moment.';
    if(p.F===0)return 'You are not '+(S.pull?'pulling':'pushing')+'. Gravity pulls each box down and the floor pushes up just as hard, so nothing moves.';
    const tilt=p.angle===0?'Your '+verb+' is all forward, so the floor holds up the whole weight of box 1 ('+S.W1.toFixed(0)+' N). ':
      (S.pull?'Your strap pulls up as well as forward, so the floor pushes up on box 1 with only <b>'+S.N1.toFixed(0)+' N</b> instead of '+S.W1.toFixed(0)+' N. ':'Your push presses box 1 into the floor, so the floor pushes up with <b>'+S.N1.toFixed(0)+' N</b> instead of '+S.W1.toFixed(0)+' N. ');
    if(L.stuck)return tilt+'<b>The boxes don’t move.</b> The forward part of your '+verb+' ('+S.Fx.toFixed(0)+' N) is no more than static friction can hold'+(hon?' (up to μs(N₁'+(two?' + N₂':'')+') = '+(S.mus*(S.N1+S.N2)).toFixed(0)+' N)':'')+'.';
    const tail=two?(hon?' Box 2’s own diagram gives the force between the boxes: '+(S.pull?'T':'P')+' = m₂(a + μk g) = '+L.inner.toFixed(1)+' N.':' '+(S.pull?'The rope pulls box 2 forward and box 1 back with the same '+L.inner.toFixed(0)+' N.':'Box 1 pushes box 2 with '+L.inner.toFixed(0)+' N, and box 2 pushes back just as hard.')):'';
    const fr=!S.muk?'With no friction, the floor’s push changes nothing. Friction':p.angle===0?'Friction':S.pull?'Less pressing means less friction':'More pressing means more friction';
    return tilt+fr+': '+(L.f1+L.f2).toFixed(0)+' N in all. a = <b>'+L.a.toFixed(2)+' m/s²</b>.'+tail;},
  tour:[
    {title:'One box, a level pull',text:{bio:'Start with one 20 kg box of books on a wood floor. You pull a strap held level with 100 N. Gravity pulls the box down with 196 N and the floor pushes up just as hard.',honors:'One 20 kg box on wood, a level 100 N pull. N = mg = 196 N, so kinetic friction is μk·N = 0.30 × 196 = 58.8 N and a = (100 − 58.8)/20 = 2.06 m/s².'},
     focus:[[0,296,800,304],[10,10,384,282]],pause:true,setup(sim){BioLab.setValues(sim,{mode:'pull',boxes:'one',F:100,angle:0,m1:20,m2:15,surface:'wood'});BioLab.reset(sim);}},
    {title:'Raise the strap',text:{bio:'The strap now pulls at 30°. Your 100 N splits into 86.6 N forward and 50 N up. The floor only pushes up with 146 N, so friction drops to 43.8 N, and the box speeds up a little faster.',honors:'F cos 30° = 86.6 N forward, F sin 30° = 50 N up. N = 196 − 50 = 146 N, f = 0.30 × 146 = 43.8 N, a = (86.6 − 43.8)/20 = 2.14 m/s².'},
     focus:[[10,10,384,282],[0,296,800,304]],speed:0.4,setup(sim){BioLab.setValues(sim,{angle:30});BioLab.reset(sim);}},
    {title:'Push instead',text:{bio:'Now push the box with the same 100 N, angled 30° down. The 50 N part presses the box into the floor: the floor pushes up with 246 N, and static friction can hold up to 98.4 N. Your 86.6 N forward part can’t beat it. The box stays put.',honors:'Pushing down: N = 196 + 50 = 246 N, and μs·N = 0.40 × 246 = 98.4 N > 86.6 N, so static friction holds. Same force, same angle, opposite result.'},
     focus:[[10,10,384,282],[0,296,800,304]],speed:0.4,setup(sim){BioLab.setValues(sim,{mode:'push'});BioLab.reset(sim);}},
    {title:'Two boxes, two diagrams',text:{bio:'Tie a 15 kg box behind and pull with 150 N at 30°. Draw each box on its own. The rope pulls box 2 forward and box 1 backward, equally hard (the purple arrows).',honors:'Each box gets its own free-body diagram. The tension T acts forward on box 2 and backward on box 1, with the same size. Each box’s friction comes from its own normal force: N₁ = 121 N, N₂ = 147 N.'},
     focus:[10,10,516,282],speed:0.4,setup(sim){BioLab.setValues(sim,{mode:'pull',boxes:'two',F:150,angle:30,m1:20,m2:15});BioLab.reset(sim);}},
    {title:'The system diagram',text:{bio:'Now draw both boxes as one object. Only outside forces count: your pull, gravity, the floor and friction. The rope’s two pulls cancel inside the system, so they disappear.',honors:'System: F cos θ − μk(N₁ + N₂) = (m₁ + m₂)a gives (129.9 − 80.4)/35 = 1.41 m/s². The internal tension never appears.'},
     focus:[538,10,252,282],speed:0.4},
    {lvl:'honors',title:'Tension from one box',text:'Use box 2’s diagram, which has only one sideways force besides friction. T − μk m₂g = m₂a, so T = 15 × 1.414 + 44.1 = 65.3 N. Check with box 1: F cos θ − T − f₁ = 129.9 − 65.3 − 36.3 = 28.3 N = 20 × 1.414.',
     focus:[[274,10,252,282],[10,10,252,282]],speed:0.4},
    {title:'Push two boxes',text:{bio:'Push box 1 with 200 N at 20° down. Box 1 pushes box 2 ahead with 71.8 N, and box 2 pushes back on box 1 just as hard. That pair is Newton’s third law.',honors:'N₁ = 196 + 68.4 = 264.4 N. a = (187.9 − 0.30 × 411.4)/35 = 1.84 m/s², and the contact force is P = m₂(a + μk g) = 71.8 N on each box, in opposite directions.'},
     focus:[[10,10,516,282],[0,296,800,304]],speed:0.4,setup(sim){BioLab.setValues(sim,{mode:'push',boxes:'two',F:200,angle:20,m1:20,m2:15});BioLab.reset(sim);}},
    {lvl:'ap',title:'The best angle',text:'Raising a pull trades forward force for less friction. Going further (beyond AP Physics 1): once the boxes are sliding, and without lifting box 1, a fixed pull gives the most acceleration at tan θ = μk: 16.7° on wood, 28.8° on carpet. From rest, the angle that breaks them free most easily is tan θ = μs: 21.8° on wood. Choose the graph “Acceleration vs. angle” below to see the whole curve. A push never gains from tilting.',
     focus:[[10,10,780,282]],speed:0.4,setup(sim){BioLab.setValues(sim,{mode:'pull',boxes:'two',F:150,angle:17,m1:20,m2:15,surface:'wood'});BioLab.reset(sim);sim.gMetric='angle';if(sim.ui&&sim.ui.gm)sim.ui.gm.value='angle';}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'pull',boxes:'two',F:150,angle:30,m1:20,m2:15,surface:'wood'});BioLab.reset(sim);syncMode(sim);},
  lab:{bio:'<p><b>Question:</b> Is it easier to pull a box with a strap angled up, or push it with your hands angled down?</p><ol><li>One box, 20 kg, wood floor, Pull. Set your force to 100 N.</li><li>Try angles 0°, 15°, 30°, 45° and 60°. Record a trial for each, with the normal force, friction and acceleration.</li><li>Switch to Push and repeat the same angles.</li></ol><p>Write a claim about pulling and pushing at an angle, with evidence from the normal force and friction.</p>',
       honors:'<p><b>Question:</b> How does the force between the boxes depend on the mass of box 2?</p><ol><li>Two boxes, wood, Pull, 200 N at 30°. Keep box 1 at 20 kg.</li><li>Set box 2 to 5, 10, 15, 20, 25 and 30 kg. For each, record the acceleration and the force between the boxes.</li><li>For each trial, calculate m₂(a + μk g) and compare it with the tension reading.</li></ol><p>Explain why a heavier box 2 needs more tension even though the acceleration goes down.</p>',
       ap:'<p><b>Question:</b> At what strap angle does a fixed pull give the most acceleration?</p><ol><li>Two boxes, Pull, 150 N, 20 kg and 15 kg. Start on wood.</li><li>Record the timer acceleration for angles from 0° to 45° in 5° steps, then in 1° steps near the peak.</li><li>Repeat on carpet with your force at 250 N. (At 150 N the boxes never start on carpet; at 250 N they slide at every angle from 0° to 51°, and above 51.6° the strap would lift box 1.) Check each peak against the graph “Acceleration vs. angle”.</li></ol><p><b>Claim–evidence–reasoning:</b> Using the forward part of the pull and the friction that raising the strap removes, explain why the acceleration first rises and then falls as the angle grows, and where it peaks on each floor.</p><p><b>Going further (beyond AP Physics 1):</b> cos θ + μk sin θ = √(1 + μk²)·cos(θ − φ) with tan φ = μk, so the peak is at θ = φ. Compare with your data.</p>'},
  terms:[{t:'Normal force',d:'The push of a surface straight out from it. It equals the weight only when nothing else pushes or pulls up or down.'},{t:'Friction',d:'A force from the floor that resists sliding. It grows with the normal force.'},
    {t:'Components',d:'The forward part and the up-or-down part of a slanted force. Together they do the same job as the slanted force.'},
    {t:'Free-body diagram',d:'A sketch of one object showing every force on it as an arrow from a dot.'},
    {t:'Tension',d:'The pull of a rope or strap, in newtons. A light rope pulls equally hard on both ends.'},
    {lvl:'honors',t:'System',d:'The group of objects you choose to treat as one. Objects tied or pushed together share one acceleration.'},
    {lvl:'honors',t:'Internal force',d:'A force between parts of the system, like the rope tension or the contact force. Internal forces cancel in the system diagram.'},
    {lvl:'honors',t:'Newton’s third law',d:'When box 1 pushes box 2, box 2 pushes box 1 just as hard in the opposite direction.'},
    {lvl:'ap',t:'Optimal pulling angle',d:'Once the object is sliding, and without lifting it, a fixed pull gives the most acceleration at tan θ = μk. From rest, the angle that breaks it free most easily is tan θ = μs.'}],
  about:'<p>Newton’s second law for two boxes on a level floor, g = 9.8 m/s², integrated in 4 ms steps.</p><ul><li><b>Your force:</b> F at θ splits into F cos θ forward and F sin θ up (pull) or down (push). Only box 1 feels it, so N₁ = m₁g ∓ F sin θ and N₂ = m₂g.</li><li><b>Friction:</b> each box’s friction is μ times its own normal force, with typical values for a box on wood (μs 0.40, μk 0.30) and carpet (0.70, 0.55), the same as in Forces and motion.</li><li><b>Starting:</b> the boxes start to slide when F cos θ > μs(N₁ + N₂). At rest, the total static friction equals F cos θ and appears in the system diagram. With two boxes, how it splits between them, and the force between the boxes, is not determined at rest, so those readouts show a dash.</li><li><b>Sliding:</b> a = [F cos θ − μk(N₁ + N₂)]/(m₁ + m₂). The force between the boxes is m₂(a + μk g) = m₂F(cos θ ± μk sin θ)/(m₁ + m₂), + for a pull, − for a push.</li><li>The timer measures the time to cover 1.50 m from rest, and a = 2d/t².</li></ul><p>Simplified: the boxes are treated as points that slide without tipping, the rope between them is light and level, and there is no air drag. Strictly, the rope pulls each box and each box pulls the rope; a light rope makes the two pulls on the boxes equal and opposite. If the strap’s upward part is more than box 1 weighs, the box would lift, which the model does not cover, so the run stops.</p>',
  draw(sim,ctx,vdt,k,t){const p=sim.p,s=sim.st,hon=atLeast('honors'),L=live(sim),S=L.S,H=600;
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,H);
    drawScene(sim,ctx,k,hon,L,S);
    drawPanels(sim,ctx,k,hon,L,S);},
  thumbSetup(sim){for(let i=0;i<250;i++)SIM.step(sim,0.004);}
};

function box(ctx,x,m,label,k){const w=bw(m)*PPM,h=bh(m)*PPM,y=FY-h;ctx.fillStyle='#b98a55';rr(ctx,x,y,w,h,3);ctx.fill();ctx.strokeStyle='#7a5a32';ctx.lineWidth=2;ctx.stroke();
  ctx.strokeStyle='rgba(90,62,30,.55)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x+3,y+h*0.12);ctx.lineTo(x+w-3,y+h*0.12);ctx.stroke();
  const kb=Math.min(k,1.4);txt(ctx,label,x+w/2,y+4+10*kb,{s:11.5*kb,w:700,a:'center',c:'#fff'});txt(ctx,m+' kg',x+w/2,y+4+22*kb,{s:11*kb,a:'center',c:'#fff'});
  return {x,y,w,h};}
function person(ctx,hx,hy,pull,phase){const ink=PAL['cv-ink'];ctx.strokeStyle=ink;ctx.fillStyle=ink;ctx.lineWidth=5;ctx.lineCap='round';ctx.lineJoin='round';
  let sh,hip;
  if(pull){hip={x:hx+0.30*PPM,y:FY-0.92*PPM};sh={x:hip.x+0.12*PPM,y:FY-1.42*PPM};}
  else{sh={x:hx-0.55*PPM,y:Math.min(FY-0.75*PPM,hy-0.22*PPM)};hip={x:sh.x-0.38*PPM,y:Math.min(FY-0.55*PPM,sh.y+0.42*PPM)};}
  const sw=RM?0:Math.sin(phase)*0.14*PPM;
  ctx.beginPath();ctx.moveTo(hip.x-0.12*PPM+sw,FY);ctx.lineTo(hip.x,hip.y);ctx.lineTo(hip.x+0.14*PPM-sw,FY);ctx.moveTo(hip.x,hip.y);ctx.lineTo(sh.x,sh.y);ctx.lineTo(hx,hy);ctx.stroke();
  const ux=(sh.x-hip.x),uy=(sh.y-hip.y),ul=Math.hypot(ux,uy);ctx.beginPath();ctx.arc(sh.x+ux/ul*0.16*PPM,sh.y+uy/ul*0.16*PPM,0.11*PPM,0,6.29);ctx.fill();}

function drawScene(sim,ctx,k,hon,L,S){const p=sim.p,s=sim.st,sf=SURF[p.surface],kb=Math.min(k,1.4);
  // floor and ruler
  ctx.fillStyle=sf.c;ctx.fillRect(0,FY,800,10);ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,FY+10,800,45);
  if(p.surface==='carpet'){ctx.strokeStyle='rgba(255,255,255,.2)';ctx.lineWidth=1;ctx.beginPath();for(let x=2;x<800;x+=5){ctx.moveTo(x,FY);ctx.lineTo(x+3,FY+9);}ctx.stroke();}
  const w1=bw(p.m1),w2=S.two?bw(p.m2):0;
  const x0=S.pull&&!S.two?X0+110:X0;
  const front0=S.pull?x0+((S.two?w2+ROPE:0)+w1)*PPM:x0+(0.9+w1+w2)*PPM;
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.beginPath();for(let m=0;m<=RUN+1e-9;m+=0.5){const x=front0+m*PPM;ctx.moveTo(x,FY+10);ctx.lineTo(x,FY+22);}ctx.stroke();
  for(let m=0;m<=RUN+1e-9;m+=1)txt(ctx,m.toFixed(0)+' m',front0+m*PPM,FY+38,{s:11*kb,a:'center',c:PAL['cv-ink']});
  ctx.save();ctx.setLineDash([4,3]);ctx.strokeStyle=PAL['rj'];ctx.lineWidth=1.5;const gx=front0+GATE*PPM;ctx.beginPath();ctx.moveTo(gx,FY-70);ctx.lineTo(gx,FY+24);ctx.stroke();ctx.restore();
  txt(ctx,'timer',gx,FY+38,{s:11*kb,a:'center',c:PAL['cv-ink'],w:700});
  txt(ctx,sf.l+(hon&&sf.muk?'  μs '+sf.mus.toFixed(2)+', μk '+sf.muk.toFixed(2):''),788,FY+48,{s:11.5*kb,w:600,a:'right',c:PAL['cv-ink']});
  const dx=s.x*PPM,walk=s.x*7;
  let b1,b2=null;
  if(S.pull){if(S.two)b2=box(ctx,x0+dx,p.m2,'Box 2',k);b1=box(ctx,x0+dx+(S.two?(w2+ROPE)*PPM:0),p.m1,'Box 1',k);
    if(S.two){const ry=FY-0.16*PPM;ctx.strokeStyle='#8a6a3a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(b2.x+b2.w,ry);ctx.lineTo(b1.x,ry);ctx.stroke();}
    const ax=b1.x+b1.w,ay=b1.y+b1.h*0.35,hx=ax+STRAP*PPM*Math.cos(S.th),hy=ay-STRAP*PPM*Math.sin(S.th);
    ctx.strokeStyle='#2f5f9e';ctx.lineWidth=3.5;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(hx,hy);ctx.stroke();
    person(ctx,hx,hy,true,walk);
    if(p.F>0)forceArrow(ctx,ax,ay,S,hon,kb,1);}
  else{b1=box(ctx,x0+0.9*PPM+dx,p.m1,'Box 1',k);if(S.two)b2=box(ctx,b1.x+b1.w,p.m2,'Box 2',k);
    const hx=b1.x+4,hy=b1.y+4;person(ctx,hx,hy,false,walk);
    if(p.F>0)forceArrow(ctx,hx,hy,S,hon,kb,-1);}
  // friction arrows at the floor under each box
  const fa=(b,f)=>{if(f>0.05)arrow(ctx,b.x+b.w*0.5,FY-5,-clamp(f*0.55,12,70),0,PAL['s4'],3.5);};
  fa(b1,L.f1);if(b2)fa(b2,L.f2);
  if(S.lift)pill(ctx,'The strap would lift box 1',640,330,PAL['s1'],'#fff',13*kb);
  else if(L.stuck)pill(ctx,'Static friction holds the boxes',640,330,PAL['s4'],'#fff',13*kb);
  // readout
  rr(ctx,10,302,172*kb,30+22*kb,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,'⏱ '+s.rt.toFixed(2)+' s   '+s.x.toFixed(2)+' m',22,322+4*kb,{s:13*kb,w:700});
  txt(ctx,(S.pull?'Pull ':'Push ')+p.F+' N, '+p.angle+'° '+(p.angle===0?'(level)':S.pull?'up':'down'),22,338+12*kb,{s:12*kb,w:600,c:PAL['s1']});}

function forceArrow(ctx,x,y,S,hon,kb,sgn){const len=clamp(S.Fx*0+Math.hypot(S.Fx,S.Fv)*0.32,24,80),ux=Math.cos(S.th),uy=-Math.sin(S.th)*sgn;
  if(sgn>0){arrow(ctx,x,y,ux*len,uy*len,PAL['s1'],3.5);if(hon&&S.th>0.02){arrow(ctx,x,y,ux*len,0,PAL['s1'],2,[5,4]);arrow(ctx,x+ux*len,y,0,uy*len,PAL['s1'],2,[5,4]);}}
  else{const sx=x-ux*len,sy=y-uy*len;arrow(ctx,sx,sy,ux*len,uy*len,PAL['s1'],3.5);}}

/* Free-body diagram panels: box 1, box 2, and the system. On phones (k ≥ 1.5) the force lists move to the readout tiles. */
function drawPanels(sim,ctx,k,hon,L,S){const p=sim.p,compact=k>=1.5,kb=Math.min(k,1.3),pause=sim.st.phase==='pause';
  const lab=(b,h)=>hon?h:b,P=S.pull,two=S.two,inn=L.inner||0,iS=P?'T':'P';
  const Fv=S.Fv,Fx=S.Fx,Fsy=P?Fv:-Fv,N1=S.lift?0:S.N1;
  const tg=(word,sym)=>hon?sym:(compact?word:'');
  const F1=[],F2=[],FS=[];
  const Fl=lab(P?'Your pull':'Your push','F');
  if(Fx>0||Fv>0)F1.push({x:Fx,y:Fsy,c:PAL['s1'],l:Fl,comp:hon,tag:tg(P?'pull':'push','F')});
  F1.push({x:0,y:-S.W1,c:PAL['s2'],l:lab('Gravity','m₁g'),tag:tg('gravity','m₁g')});
  F1.push({x:0,y:N1,c:PAL['s3'],l:lab('Floor pushes up','N₁'),tag:tg('floor','N₁')});
  if(L.f1>0.01)F1.push({x:-L.f1,y:0,c:PAL['s4'],l:lab('Friction','f₁'),off:9,tag:tg('friction','f₁')});
  if(two&&inn>0.01){F1.push({x:-inn,y:0,c:PAL['s5'],l:lab(P?'Rope pulls back':'Box 2 pushes back',iS+' (from box 2'+(P?'’s rope)':')')),off:-9,tag:tg(P?'rope':'box 2',iS)});
    F2.push({x:inn,y:0,c:PAL['s5'],l:lab(P?'Rope pulls forward':'Box 1 pushes',iS+' (from box 1'+(P?'’s rope)':')')),off:-9,tag:tg(P?'rope':'box 1',iS)});}
  if(two){F2.push({x:0,y:-S.W2,c:PAL['s2'],l:lab('Gravity','m₂g'),tag:tg('gravity','m₂g')});F2.push({x:0,y:S.N2,c:PAL['s3'],l:lab('Floor pushes up','N₂'),tag:tg('floor','N₂')});
    if(L.f2>0.01)F2.push({x:-L.f2,y:0,c:PAL['s4'],l:lab('Friction','f₂'),off:9,tag:tg('friction','f₂')});}
  if(Fx>0||Fv>0)FS.push({x:Fx,y:Fsy,c:PAL['s1'],l:Fl,tag:tg(P?'pull':'push','F')});
  FS.push({x:0,y:-(S.W1+S.W2),c:PAL['s2'],l:lab('Gravity, both boxes','(m₁ + m₂)g'),tag:tg('gravity','Mg')});
  FS.push({x:0,y:N1+S.N2,c:PAL['s3'],l:lab('Floor, both boxes','N₁ + N₂'),tag:tg('floor','N')});
  if(L.ftot>0.01)FS.push({x:-L.ftot,y:0,c:PAL['s4'],l:lab('Friction, both boxes','f₁ + f₂'),off:9,tag:tg('friction','f')});
  const big=Math.max(1,...F1.concat(F2).map(f=>Math.hypot(f.x,f.y))),sc=(compact?100:72)/big,o={compact,k,kb,hon,pause};
  const sn=L.stuck?(compact?'At rest: split not set':'At rest, friction’s split is not set.'):null;
  if(two){panel(ctx,10,'Box 1 ('+p.m1+' kg)',F1,sc,o,sn);panel(ctx,274,'Box 2 ('+p.m2+' kg)',F2,sc,o,sn);
    panel(ctx,538,'System: both boxes',FS,sc/2,o,compact?'Half scale':(hon?'Half scale. T or P cancels inside.':'Half scale. Inside forces cancel.'));}
  else{panel(ctx,10,(hon&&!compact?'Free-body diagram: ':'Forces on ')+'box 1 ('+p.m1+' kg)',F1,sc,o,null,384);splitPanel(ctx,406,S,kb,hon,N1);}}

function panel(ctx,X,title,list,sc,o,note,W){W=W||252;const Y=10,H=282,{compact,kb,hon,pause}=o,fs=compact?12*Math.min(o.k,1.8):11.5*kb;
  rr(ctx,X,Y,W,H,12);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,title,X+12,Y+14+8*(compact?o.k:kb),{s:(compact?11*o.k:12.5*kb),w:700});
  const cx=X+W/2,cy=compact?Y+150:Y+108;
  list.forEach(f=>{const L=Math.hypot(f.x,f.y);if(L<0.01)return;const m=Math.max(L*sc,12)/(L*sc),dx=f.x*sc*m,dy=-f.y*sc*m,oy=f.off||0;
    if(f.comp&&f.y!==0){arrow(ctx,cx,cy,dx,0,f.c,1.8,[5,4]);arrow(ctx,cx+dx,cy,0,dy,f.c,1.8,[5,4]);}
    arrow(ctx,cx,cy+oy,dx,dy,f.c,3);
    if(!f.tag)return;let tx,ty,al;
    if(Math.abs(dx)<1){if(dy<0){tx=cx-8;ty=cy+dy+fs*0.8;al='right';}else{tx=cx+8;ty=cy+dy-2;al='left';}}
    else if(Math.abs(dy)<1){if(dx<0){tx=cx-10;ty=oy<0?cy+oy-9:cy+oy+fs+4;al='right';}else{tx=cx+10;ty=cy+oy-9;al='left';}}
    else{tx=clamp(cx+dx,X+30,X+W-30);ty=dy<0?cy+dy-7:cy+dy+fs+3;al='center';}
    txt(ctx,f.tag,tx,ty,{s:fs,w:700,a:al,c:f.c});});
  ctx.fillStyle=PAL['cv-ink'];ctx.beginPath();ctx.arc(cx,cy,5,0,6.29);ctx.fill();
  if(!compact){let y=Y+200,lh=14*kb;
    list.forEach(f=>{const L=Math.hypot(f.x,f.y);ctx.fillStyle=f.c;ctx.fillRect(X+12,y-8*kb,9,9);txt(ctx,f.l+'  '+L.toFixed(hon?1:0)+' N',X+26,y,{s:11*kb,c:PAL['cv-ink']});y+=lh;});}
  if(note)txt(ctx,note,X+12,Y+H-8,{s:(compact?10*o.k:10.5*kb),c:PAL['cv-soft']});
  if(pause&&!compact)txt(ctx,'Run over',X+W-12,Y+21,{s:10.5*kb,a:'right',c:PAL['cv-soft']});}

function splitPanel(ctx,X,S,kb,hon,N1){const Y=10,W=384,H=282,P=S.pull;
  rr(ctx,X,Y,W,H,12);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,'Your force, split in two',X+12,Y+21,{s:12.5*kb,w:700});
  const F=Math.hypot(S.Fx,S.Fv);
  if(F<0.01){txt(ctx,'Set your force above 0 N.',X+W/2,Y+130,{s:12*kb,a:'center',c:PAL['cv-soft']});return;}
  const sc=110/Math.max(F,1),cx=X+60,cy=P?Y+170:Y+60,dx=S.Fx*sc,dy=(P?-1:1)*S.Fv*sc;
  arrow(ctx,cx,cy,dx,0,PAL['s1'],2,[5,4]);arrow(ctx,cx+dx,cy,0,dy,PAL['s1'],2,[5,4]);arrow(ctx,cx,cy,dx,dy,PAL['s1'],3.5);
  ctx.fillStyle=PAL['cv-ink'];ctx.beginPath();ctx.arc(cx,cy,4,0,6.29);ctx.fill();
  const tx=X+178;let y=Y+60;const lh=19*kb;
  const line=(s,c,w)=>{txt(ctx,s,tx,y,{s:12*kb,c:c||PAL['cv-ink'],w:w||400});y+=lh;};
  line((P?'Pull ':'Push ')+F.toFixed(0)+' N at '+(S.th*180/Math.PI).toFixed(0)+'°',PAL['s1'],700);
  line((hon?'F cos θ: ':'Forward: ')+S.Fx.toFixed(1)+' N');
  line((hon?'F sin θ: ':(P?'Up: ':'Down: '))+S.Fv.toFixed(1)+' N'+(hon?(P?' up':' down'):''));
  y+=6;line('Weight: '+S.W1.toFixed(0)+' N',PAL['s2']);
  line((hon?'N = mg '+(P?'−':'+')+' F sin θ':'Floor pushes up')+': '+N1.toFixed(1)+' N',PAL['s3'],700);
  if(S.Fv<0.05){line('A level force leaves',PAL['cv-soft']);line('N equal to the weight.',PAL['cv-soft']);}
  else{line(P?'Pulling up lightens the load,':'Pushing down presses it in,',PAL['cv-soft']);line(P?'so friction drops.':'so friction grows.',PAL['cv-soft']);}
  txt(ctx,'Choose Two boxes for the two-body diagrams.',X+12,Y+H-10,{s:10.5*kb,c:PAL['cv-soft']});}

SIM._m={setup,solve,aFor,bestAngle,G,SURF};
BioLab.register(SIM);
})();
