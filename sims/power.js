(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,RM,axes}=BioLab.h;

/* Work and power (g = 9.8 m/s²).
   Stair climb: a student of mass m climbs a staircase of height h at a steady pace in time T.
     Work against gravity W = mgh, power P = W/T = mg·(h/T), 1 hp = 746 W.
   Sled pull: a rope pulls a sled (mass M) with force F at angle θ above horizontal for 5.0 m.
     N = Mg − F sinθ (never below 0), kinetic friction f = μN opposes the motion; the sled stays put while F cosθ ≤ μN.
     Work by the pull W_F = ∫F cosθ dx, by friction W_f = −∫f dx; gravity and the normal force do no work on level ground.
     Net work = ΔKE (work–energy theorem; the integrator uses the average speed each step, so the two agree exactly).
     Instantaneous power of the pull P = F cosθ · v. AP force profiles: constant, rising (0 → 2F) or falling (2F → 0) over the 5 m. */
const G=9.8,TRACK=5,PAUSE=1.4,HP=746,RISE=0.18,TREAD=0.28;
const MODE_CTL={m:['stairs'],h:['stairs'],T:['stairs'],F:['pull'],th:['pull'],mu:['pull'],M:['pull'],prof:['pull']};
const MODE_TILE={Wst:['stairs'],Pst:['stairs'],hp:['stairs'],WF:['pull'],Wf:['pull'],Wn:['pull'],KE:['pull'],P:['pull']};
const mult=(p,x)=>p.prof==='rise'?2*x/TRACK:p.prof==='fall'?2*(1-x/TRACK):1;

function arrow(ctx,x,y,dx,dy,col,w){const L=Math.hypot(dx,dy);if(L<2)return;const head=Math.min(11,4+L*0.25),ux=dx/L,uy=dy/L;
  ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=w||3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+dx-ux*head*0.8,y+dy-uy*head*0.8);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+dx,y+dy);ctx.lineTo(x+dx-ux*head-uy*head*0.55,y+dy-uy*head+ux*head*0.55);ctx.lineTo(x+dx-ux*head+uy*head*0.55,y+dy-uy*head-ux*head*0.55);ctx.closePath();ctx.fill();}
function syncMode(sim){const id=sim.def.id,m=sim.p.mode;
  for(const c of SIM.controls){const el=document.getElementById(id+'-'+c.id)||document.getElementById(id+'-'+c.id+'-l');if(!el)continue;const w=el.closest('.ctl');if(!w)continue;
    w.hidden=!atLeast(c.lvl)||(MODE_CTL[c.id]&&!MODE_CTL[c.id].includes(m));}
  for(const mt of SIM.metrics){const t=sim.ui.tiles&&sim.ui.tiles[mt.id];if(!t)continue;t.num.closest('.tile').hidden=!atLeast(mt.lvl)||(MODE_TILE[mt.id]&&!MODE_TILE[mt.id].includes(m));}}
function forces(p,x,v){const th=p.th*Math.PI/180,Fe=p.F*mult(p,x),Fx=Fe*Math.cos(th),Fy=Fe*Math.sin(th),N=Math.max(0,p.M*G-Fy),fmax=p.mu*N;
  const stuck=v<=1e-9&&Fx<=fmax+1e-9;return {Fe,Fx,Fy,N,f:stuck?Fx:fmax,stuck,lift:Fy>p.M*G};}
const climbing=s=>s.st.phase==='run';
const stairP=s=>s.p.m*G*s.p.h/s.p.T;

const SIM={
  id:'power',hash:'power',apUnit:3,order:2,tab:'Work and power',kind:'Virtual lab',
  card:'Time a stair climb to measure your power in watts and horsepower, then pull a sled and keep a tally of the work every force does.',
  title:'Work and power',
  lede:{bio:'Work is a force times the distance moved along it. Power is how fast you do that work. Measure both, the way you would in the stairwell.',
        honors:'Only the part of a force along the motion does work. Friction does negative work, and the net work equals the change in kinetic energy.',
        ap:'Find work as the area under a force–position graph and track the instantaneous power P = F·v as the sled speeds up.'},
  scale:'Real stairs: each step rises 18 cm, so 20 steps make one 3.6 m floor. The sled run is 5.0 m of level ground. 1 W = 1 J/s; 1 hp = 746 W; a 100 W bulb uses 100 J every second.',
  timeScale:1,dtMax:0.01,prewarm:0,sampleDt:0.05,window:12,unit:'s',chChange:1,chReveal:6,
  controls:[
    {id:'mode',label:'Set-up',type:'seg',def:'stairs',lvl:'bio',options:[{v:'stairs',l:'Stair-climb lab'},{v:'pull',l:'Pull a sled'}],onChange(sim){BioLab.reset(sim);syncMode(sim);}},
    {id:'m',label:'Your mass',type:'range',min:40,max:110,step:1,def:60,unit:' kg',lvl:'bio'},
    {id:'h',label:'Height of the stairs',type:'range',min:1.8,max:7.2,step:0.18,def:3.6,unit:' m',d:2,lvl:'bio',help:'Each step rises 0.18 m. 3.6 m is one floor.'},
    {id:'T',label:'Time to climb',type:'range',min:2,max:20,step:0.5,def:8,unit:' s',d:1,lvl:'bio',help:'About 8 s is walking; 3 s is a sprint.'},
    {id:'F',label:'Pull on the rope',type:'range',min:0,max:250,step:5,def:80,unit:' N',lvl:'bio'},
    {id:'th',label:'Rope angle',type:'range',min:0,max:90,step:5,def:20,unit:'°',lvl:'bio',help:'0° pulls straight along the floor.'},
    {id:'mu',label:'Friction μ',type:'range',min:0,max:0.6,step:0.05,def:0.2,d:2,unit:'',lvl:'bio',help:'0 is ice; 0.2 is a sled on packed snow.'},
    {id:'M',label:'Sled mass',type:'range',min:10,max:50,step:1,def:20,unit:' kg',lvl:'honors'},
    {id:'prof',label:'How the pull changes',type:'seg',def:'const',lvl:'ap',options:[{v:'const',l:'Constant'},{v:'rise',l:'Rises 0 → 2F'},{v:'fall',l:'Falls 2F → 0'}]}
  ],
  init(){return {phase:'run',u:0,pause:0,x:0,v:0,WF:0,Wf:0,last:null};},
  step(sim,dt){const p=sim.p,s=sim.st;
    if(s.phase==='pause'){s.pause-=dt;if(s.pause<=0){s.phase='run';s.u=0;s.x=0;s.v=0;s.WF=0;s.Wf=0;}return;}
    if(p.mode==='stairs'){s.u+=dt/p.T;if(s.u>=1){s.u=1;s.phase='pause';s.pause=PAUSE;s.last={W:p.m*G*p.h,T:p.T,P:stairP(sim)};}return;}
    const f=forces(p,s.x,s.v);if(f.stuck){s.v=0;return;}
    const a=(f.Fx-f.f)/p.M;let v1=s.v+a*dt;if(v1<0)v1=0;const va=(s.v+v1)/2;
    s.WF+=f.Fx*va*dt;s.Wf-=f.f*va*dt;s.x+=va*dt;s.v=v1;
    if(s.x>=TRACK){s.x=TRACK;s.last={WF:s.WF,Wf:s.Wf,KE:0.5*p.M*s.v*s.v};s.phase='pause';s.pause=PAUSE;}},
  metrics:[
    {id:'Wst',label:'Work done lifting yourself',unit:'J',lvl:'bio',d:0,max:null,get:s=>s.p.m*G*s.p.h*s.st.u},
    {id:'Pst',label:'Power',unit:'W',lvl:'bio',d:0,max:null,get:s=>climbing(s)?stairP(s):0},
    {id:'hp',label:'Power in horsepower',unit:'hp',lvl:'bio',d:2,get:s=>(climbing(s)?stairP(s):0)/HP},
    {id:'WF',label:'Work done by your pull',unit:'J',lvl:'bio',d:0,max:null,get:s=>s.st.WF},
    {id:'Wf',label:'Work done by friction',unit:'J',lvl:'bio',d:0,max:null,get:s=>s.st.Wf},
    {id:'Wn',label:'Net work',unit:'J',lvl:'honors',d:0,max:null,get:s=>s.st.WF+s.st.Wf},
    {id:'KE',label:'Sled’s kinetic energy',unit:'J',lvl:'honors',d:0,max:null,get:s=>0.5*s.p.M*s.st.v*s.st.v},
    {id:'P',label:'Power of your pull (F·v)',unit:'W',lvl:'ap',d:0,max:null,get:s=>s.st.phase==='run'?forces(s.p,s.st.x,s.st.v).Fx*s.st.v:0}
  ],
  graphs:[{id:'Wst',label:'Work (stairs)',lines:['Wst']},{id:'Pst',label:'Power (stairs)',lines:['Pst']},{id:'work',label:'Work (sled)',lines:['WF','Wf']},
          {id:'wke',label:'Net work and KE',lvl:'honors',lines:['Wn','KE']},{id:'P',label:'Power of the pull',lvl:'ap',lines:['P']},{id:'fx',label:'Force vs. position',lvl:'ap',custom:true}],
  defaultGraph:'Wst',
  plot(sim,ctx,box,id){const p=sim.p,s=sim.st,N=100;let ymax=1;const pts=[];
    for(let i=0;i<=N;i++){const x=i/N*TRACK,Fx=p.F*mult(p,x)*Math.cos(p.th*Math.PI/180);pts.push([x,Fx]);ymax=Math.max(ymax,Fx);}
    const ax=axes(ctx,box,{xmin:0,xmax:TRACK,ymin:0,ymax:ymax*1.15,xl:'Position (m)',yl:'Pull along the motion (N)'});
    if(p.mode==='pull'&&s.x>0){ctx.fillStyle=PAL['s3'];ctx.globalAlpha=0.3;ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(0));pts.filter(q=>q[0]<=s.x).forEach(q=>ctx.lineTo(ax.X(q[0]),ax.Y(q[1])));
      const Fx=p.F*mult(p,s.x)*Math.cos(p.th*Math.PI/180);ctx.lineTo(ax.X(s.x),ax.Y(Fx));ctx.lineTo(ax.X(s.x),ax.Y(0));ctx.closePath();ctx.fill();ctx.globalAlpha=1;}
    ctx.strokeStyle=PAL['s3'];ctx.lineWidth=2.5;ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(ax.X(q[0]),ax.Y(q[1])):ctx.moveTo(ax.X(q[0]),ax.Y(q[1])));ctx.stroke();
    txt(ctx,'Shaded area = work = '+s.WF.toFixed(0)+' J',ax.X(0.15),box.T+16,{s:13,w:700,c:PAL['cv-ink']});},
  onLevel(sim){syncMode(sim);},
  onChallenge(sim){syncMode(sim);},
  challenges:[
    {lvl:'bio',q:'You walk up one floor of stairs in 8 s. Next time you run up in 4 s. What happens to your power?',
     choices:['It stays the same','It doubles','It is cut in half'],correct:1,
     baseline:{mode:'stairs',m:60,h:3.6,T:8},change:{T:4},changeText:'Climbing in 4 s',watch:'Pst',at:1,reveal:12,
     explain:{bio:'The work is the same both times: 60 kg × 9.8 × 3.6 m = 2117 J. Doing it in half the time means twice the power: 265 W becomes 529 W.'}},
    {lvl:'bio',q:'A friend with twice your mass (120 kg vs. 60 kg) climbs the same stairs in the same 6 s. How does their power compare with yours?',
     choices:['The same','Twice as much','Half as much'],correct:1,
     baseline:{mode:'stairs',m:55,h:3.6,T:6},change:{m:110},changeText:'Mass doubled to 110 kg',watch:'Pst',at:1,reveal:9,
     explain:{bio:'Twice the weight lifted the same height is twice the work, done in the same time, so twice the power.'}},
    {lvl:'bio',q:'You pull a sled with the rope at 90°, straight up, but not hard enough to lift it. How much work does your pull do?',
     choices:['Lots: you are pulling hard','Zero: the sled doesn’t move along your pull','It depends on the friction'],correct:1,
     baseline:{mode:'pull',F:0,th:90,mu:0.2,M:20,prof:'const'},change:{F:80},changeText:'Pulling 80 N straight up',watch:'WF',at:0.5,reveal:5,
     explain:{bio:'Work needs motion along the force. Pulling straight up only lightens the sled; it doesn’t move it forward. With no horizontal pull, friction holds it still, and W = F × 0 m = 0 J.'}},
    {lvl:'honors',q:'The sled slides on ice (μ = 0). You add friction, μ = 0.20. During a run, what sign is the work done by friction?',
     choices:['Positive','Negative','Zero'],correct:1,
     baseline:{mode:'pull',F:80,th:0,mu:0,M:20,prof:'const'},change:{mu:0.2},changeText:'Friction μ = 0.20',watch:'Wf',at:0.3,reveal:5,
     explain:{honors:'Friction points backward while the sled moves forward: W = f·d·cos 180° = −f·d. Negative work takes kinetic energy away (it ends up as heat).'}},
    {lvl:'honors',instant:true,q:'You pull a 20 kg sled with 100 N, rope level (θ = 0), on snow with μ = 0.20, for 5.0 m from rest. What is its kinetic energy at the end?',
     choices:['500 J','304 J','196 J','0 J'],correct:1,
     explain:{honors:'W by the pull = 100 × 5 = 500 J. Friction = 0.20 × 196 = 39.2 N, so W_f = −196 J. Net work = 304 J, and the work–energy theorem says ΔKE = W_net = 304 J.'}},
    {lvl:'honors',instant:true,q:'You pull with 120 N at 60° above the floor and the sled moves 5.0 m. How much work does your pull do?',
     choices:['600 J','300 J','520 J','0 J'],correct:1,
     explain:{honors:'W = F·d·cos θ = 120 × 5.0 × cos 60° = 120 × 5.0 × 0.5 = 300 J. Only the 60 N component along the motion does work.'}},
    {lvl:'ap',q:'On ice (μ = 0) you start pulling the sled with a constant 60 N, rope level. What does the power of your pull do during the run?',
     choices:['Stays constant','Increases steadily','Decreases'],correct:1,
     baseline:{mode:'pull',F:0,th:0,mu:0,M:20,prof:'const'},change:{F:60},changeText:'Pulling with 60 N',watch:'P',at:0.5,reveal:2.2,
     explain:{ap:'P = F·v. The force is constant but v grows linearly (a = 3 m/s²), so P = 60 × 3t = 180t W rises steadily. Constant force does not mean constant power.'}},
    {lvl:'ap',instant:true,q:'The pull rises steadily from 0 N to 120 N over the 5.0 m run, rope level. How much work does it do?',
     choices:['600 J','300 J','120 J','0 J'],correct:1,
     explain:{ap:'Work is the area under the F–x graph. A triangle from 0 to 120 N over 5 m has area ½ × 5 × 120 = 300 J, the same as a constant 60 N average.'}},
    {lvl:'ap',instant:true,q:'A 70 kg student climbs 3.6 m of stairs in 5.0 s. What is the average power, in horsepower?',
     choices:['0.18 hp','0.66 hp','4.9 hp','494 hp'],correct:1,
     explain:{ap:'P = mgh/t = 70 × 9.8 × 3.6 / 5.0 = 494 W. Divide by 746 W/hp: 0.66 hp.'}}
  ],
  narrate(sim){const p=sim.p,s=sim.st,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode==='stairs'){const W=p.m*G*p.h,P=W/p.T;
      if(s.phase==='pause')return '<b>Top!</b> You lifted '+(p.m*G).toFixed(0)+' N of body weight '+p.h.toFixed(2)+' m: W = mgh = '+W.toFixed(0)+' J. In '+p.T.toFixed(1)+' s that is P = W/t = <b>'+P.toFixed(0)+' W</b> ('+(P/HP).toFixed(2)+' hp), as much as '+Math.round(P/100)+' bright 100 W bulbs.';
      return 'Each step lifts your weight ('+(p.m*G).toFixed(0)+' N) another 0.18 m. So far: '+(W*s.u).toFixed(0)+' J of work. '+(p.T<=4?'Sprinting means the same work in less time, so <b>more power</b>.':'Climbing faster would not change the work, only the power.');}
    const f=forces(p,s.x,s.v);
    if(s.phase==='pause'&&s.last)return 'Run over. Your pull did '+s.last.WF.toFixed(0)+' J, friction did '+s.last.Wf.toFixed(0)+' J'+(hon?', so the net work is '+(s.last.WF+s.last.Wf).toFixed(0)+' J, which matches the sled’s KE of '+s.last.KE.toFixed(0)+' J.':'.');
    if(f.lift)return 'The upward part of your pull is more than the sled’s weight, so the sled would lift off the ground. Lower the angle or the force.';
    if(f.stuck)return p.th>=89?'<b>Pulling straight up</b> only lightens the sled. Nothing moves along your pull, so it does <b>no work</b>.':'<b>The sled doesn’t move.</b> Your pull along the floor ('+f.Fx.toFixed(0)+' N) can’t beat friction (up to '+(p.mu*f.N).toFixed(0)+' N), so no work is done: the distance is zero.';
    let t='Only the part of your pull along the floor, '+f.Fe.toFixed(0)+' N × cos '+p.th+'° = <b>'+f.Fx.toFixed(0)+' N</b>, does work. ';
    if(p.mu>0)t+='Friction ('+f.f.toFixed(0)+' N) pushes backward, so it does <b>negative</b> work. ';
    if(hon)t+='Net work '+(s.WF+s.Wf).toFixed(0)+' J = kinetic energy '+(0.5*p.M*s.v*s.v).toFixed(0)+' J.';
    if(ap)t+=' Power now: F·v = '+(f.Fx*s.v).toFixed(0)+' W.';
    return t;},
  tour:[
    {title:'The stair-climb lab',text:'You climb one floor: 20 steps of 18 cm, 3.6 m in all. To climb you have to lift your whole weight that height. That takes work.',
     focus:[[20,60,500,380],[552,12,238,170]],pause:true,setup(sim){BioLab.setValues(sim,{mode:'stairs',m:60,h:3.6,T:8});BioLab.reset(sim);syncMode(sim);}},
    {title:'Walk up: work = weight × height',text:'Walking up in 8 s. Your weight is 588 N. Lifted 3.6 m, that is W = 588 × 3.6 = 2117 J, whatever your speed.',
     focus:[20,60,500,380],speed:1},
    {title:'Run up: more power',text:'Now sprint up in 3 s. Same work, 2117 J, but done 2.7 times faster: power = work ÷ time = 706 W, almost one horsepower.',
     focus:[[20,60,500,380],[552,12,238,170]],speed:0.6,setup(sim){BioLab.setValues(sim,{T:3});BioLab.reset(sim);}},
    {title:'Pull a sled',text:'Work = force × distance along the force. Pull 80 N along the floor for 5 m and you do 400 J of work on the sled.',
     focus:[[12,12,308,170],[0,270,560,180]],speed:0.5,setup(sim){BioLab.setValues(sim,{mode:'pull',F:80,th:0,mu:0,M:20,prof:'const'});BioLab.reset(sim);syncMode(sim);}},
    {title:'Tilt the rope',text:'At 50° only the part of the pull along the floor, F cos θ, does work. The upward part just lightens the sled.',
     focus:[0,270,560,180],speed:0.5,setup(sim){BioLab.setValues(sim,{th:50});BioLab.reset(sim);}},
    {title:'Friction does negative work',text:'On snow (μ = 0.20) friction pushes backward. Watch its bar in the work tally go below zero: it takes energy away as heat.',
     focus:[[0,270,560,180],[552,12,238,300]],speed:0.5,setup(sim){BioLab.setValues(sim,{th:20,mu:0.2,F:100});BioLab.reset(sim);}},
    {lvl:'honors',title:'The work–energy theorem',text:'Add up all the work: pull (positive) plus friction (negative). That net work is exactly the sled’s kinetic energy at every moment.',
     focus:[552,12,238,300],speed:0.5},
    {lvl:'ap',title:'Work as an area',text:'With a rising pull, open the “Force vs. position” graph. Work is the area under the curve, and P = F·v grows as the sled speeds up.',
     focus:[[0,270,560,180],[552,12,238,300]],speed:0.5,setup(sim){BioLab.setValues(sim,{prof:'rise',F:100,th:0,mu:0.1});BioLab.reset(sim);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'stairs',m:60,h:3.6,T:8,F:80,th:20,mu:0.2,M:20,prof:'const'});BioLab.reset(sim);syncMode(sim);},
  lab:{bio:'<p><b>Question:</b> How much power does a student produce climbing stairs?</p><ol><li>Stair-climb lab. Set the mass to your own (or a classmate’s) and the height to one floor, 3.6 m.</li><li>Record a trial for climb times of 12, 8, 6, 4 and 3 s, after each climb reaches the top.</li><li>For each, calculate P = mgh/t and compare it with the Power tile.</li></ol><p>Write a claim about how climb time affects power. How many 100 W light bulbs could your sprint power?</p>',
       honors:'<p><b>Question:</b> How does the rope angle change the work your pull does?</p><ol><li>Pull a sled: F = 100 N, μ = 0 (ice).</li><li>At the end of each run, record the work done by your pull for θ = 0°, 15°, 30°, 45°, 60° and 75°.</li><li>Plot W against cos θ.</li></ol><p>What should the slope be? Then repeat with μ = 0.20 and explain why some angle above 0° now gives the sled the most kinetic energy.</p>',
       ap:'<p><b>Question:</b> Does net work equal the change in kinetic energy, even when the force changes?</p><ol><li>Pull a sled, θ = 0°, μ = 0.15, F = 100 N.</li><li>For each force profile (constant, rising, falling) record W by the pull, W by friction and the final KE.</li><li>Open “Force vs. position” and estimate the area under the curve by counting grid squares.</li></ol><p><b>Claim–evidence–reasoning:</b> Show that W_net = ΔKE in all three cases, and explain why the falling profile delivers its highest power early in the run.</p>'},
  terms:[{t:'Work',d:'Force times distance moved along the force: W = F·d, in joules (J). 1 J = 1 N·m.'},{t:'Power',d:'How fast work is done: P = W/t, in watts (W). 1 W = 1 J/s.'},{t:'Horsepower',d:'An older unit of power: 1 hp = 746 W.'},
    {t:'Negative work',d:'Work done by a force that points against the motion, like friction. It takes energy away.'},
    {lvl:'honors',t:'Work at an angle',d:'W = F·d·cos θ, where θ is the angle between the force and the motion.'},{lvl:'honors',t:'Work–energy theorem',d:'The net work on an object equals its change in kinetic energy: W_net = ΔKE.'},
    {lvl:'ap',t:'Instantaneous power',d:'P = F·v = F v cos θ: the rate at which a force does work right now.'},{lvl:'ap',t:'Work as area',d:'For a changing force, W = ∫F dx, the area under the force–position graph.'}],
  about:'<p><b>Stair climb:</b> a steady climb, so the work is just the gain in gravitational potential energy, W = mgh (g = 9.8 m/s²). Real climbers also spend energy moving their legs and are only about 20–25% efficient, so their muscles use 4–5 times more food energy than this.</p><p><b>Sled:</b> N = Mg − F sin θ (never below zero), kinetic friction μN, one μ for starting and sliding. Work is summed each 10 ms step using the average speed, so W_net and KE agree exactly. Each run covers 5.0 m, pauses and restarts. There is no air resistance.</p>',
  draw(sim,ctx,vdt,k,t){const p=sim.p;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);if(p.mode==='stairs')drawStairs(sim,ctx,k,t);else drawPull(sim,ctx,k,t);},
  thumbSetup(sim){BioLab.setValues(sim,{T:4});}
};

function climber(ctx,cx,footY,tp,rp,ppm,phase,moving,lean,col){
  // feet: one on the current step, one reaching for the next; they trade places each step
  const sw=moving?(Math.sin(phase)+1)/2:0.5;
  const back=[cx-tp*0.35,footY],front=[cx+tp*0.55,footY-(moving?rp*sw:0)];
  const hipY=footY-0.9*ppm-(moving?rp*0.5*sw:0),hip=[cx+lean*0.1*ppm,hipY],sh=[hip[0]+lean*0.25*ppm,hipY-0.55*ppm];
  const knee=(f)=>[(hip[0]+f[0])/2+0.12*ppm,(hip[1]+f[1])/2];
  ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=Math.max(3,ppm*0.1);ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
  for(const f of [back,front]){const kn=knee(f);ctx.moveTo(hip[0],hip[1]);ctx.lineTo(kn[0],kn[1]);ctx.lineTo(f[0],f[1]);}
  ctx.moveTo(hip[0],hip[1]);ctx.lineTo(sh[0],sh[1]);
  const as=moving?Math.sin(phase)*0.25*ppm:0;ctx.moveTo(sh[0],sh[1]);ctx.lineTo(sh[0]+as,sh[1]+0.5*ppm);ctx.moveTo(sh[0],sh[1]);ctx.lineTo(sh[0]-as,sh[1]+0.5*ppm);ctx.stroke();
  ctx.beginPath();ctx.arc(sh[0]+lean*0.05*ppm,sh[1]-0.17*ppm,0.13*ppm,0,6.29);ctx.fill();return sh[1]-0.3*ppm;}

function panel(ctx,X,Y,W,H){rr(ctx,X,Y,W,H,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();}

function drawStairs(sim,ctx,k,t){const p=sim.p,s=sim.st,n=Math.round(p.h/RISE),ppm=Math.min(48,290/p.h),X0=70,Y0=420,rp=RISE*ppm,tp=Math.min(TREAD*ppm,400/n);
  ctx.fillStyle=PAL['cv-bench'];ctx.beginPath();ctx.moveTo(X0-30,Y0);ctx.lineTo(X0,Y0);for(let i=0;i<n;i++){ctx.lineTo(X0+i*tp,Y0-(i+1)*rp);ctx.lineTo(X0+(i+1)*tp,Y0-(i+1)*rp);}ctx.lineTo(X0+n*tp+50,Y0-n*rp);ctx.lineTo(X0+n*tp+50,Y0);ctx.closePath();ctx.fill();
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.stroke();
  const RX=X0+n*tp+66;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(RX,Y0);ctx.lineTo(RX,Y0-n*rp);ctx.moveTo(RX-6,Y0);ctx.lineTo(RX+6,Y0);ctx.moveTo(RX-6,Y0-n*rp);ctx.lineTo(RX+6,Y0-n*rp);ctx.stroke();
  txt(ctx,'h = '+p.h.toFixed(2)+' m',RX+10,Y0-n*rp/2,{s:13*k,w:700});txt(ctx,n+' steps',RX+10,Y0-n*rp/2+18*k,{s:11.5*k,c:PAL['cv-soft']});
  const pos=Math.min(n,s.u*n),step=Math.min(n,Math.floor(pos+1e-9)),run=s.phase==='run'&&s.u>0&&s.u<1;
  const cx=X0+(Math.min(pos,n-0.01)+0.4)*tp+(s.u>=1?tp*0.8:0),footY=Y0-step*rp;
  const headTop=climber(ctx,cx,footY,tp,rp,ppm,(pos%1)*Math.PI*2-Math.PI/2,run&&!RM,p.T<=4?0.9:0.3,'#C11430');
  txt(ctx,p.m+' kg',cx,headTop-8,{s:12*k,a:'center',w:700});
  if(run)arrow(ctx,cx-0.55*ppm,footY-0.6*ppm,0,-30,PAL['s3'],3);
  panel(ctx,16,16,150+20*k,30+16*k);txt(ctx,'⏱ '+(s.u*p.T).toFixed(1)+' of '+p.T.toFixed(1)+' s',28,30+12*k,{s:14*k,w:700});
  const done=s.phase==='pause',Wk=p.m*G*p.h,P=Wk/p.T,ls=21*k,X=556,Y=16,W=230,H=24+ls*(done?5.6:3.4);panel(ctx,X,Y,W,H);
  txt(ctx,done?'Your result':'Climbing…',X+12,Y+8+ls,{s:13*k,w:700});
  txt(ctx,'W = mgh = '+(done?Wk:Wk*s.u).toFixed(0)+' J',X+12,Y+8+ls*2,{s:12.5*k,w:700,c:PAL['s3']});
  txt(ctx,'P = W ÷ t = '+(done?P.toFixed(0)+' W':'…'),X+12,Y+8+ls*3,{s:12.5*k,w:700,c:PAL['rj']});
  if(done){txt(ctx,'= '+(P/HP).toFixed(2)+' hp',X+12,Y+8+ls*4,{s:12.5*k,c:PAL['cv-ink']});
    const nb=Math.round(P/100);txt(ctx,'≈ '+nb+' bulbs of 100 W',X+12,Y+8+ls*5,{s:11.5*k,c:PAL['cv-soft']});
    if(k<1.3)for(let b=0;b<Math.min(nb,6);b++){const bx=X+W-20-b*14,by=Y+4+ls*5;ctx.fillStyle='#f5c84c';ctx.strokeStyle='#b58a12';ctx.lineWidth=1;ctx.beginPath();ctx.arc(bx,by,5,0,6.29);ctx.fill();ctx.stroke();}}}

function drawPull(sim,ctx,k,t){const p=sim.p,s=sim.st,GY=360,ppm=84,x0=50,hon=atLeast('honors');
  const snow=p.mu===0?PAL['cv-water']:p.mu<0.3?'#e9eef3':'#b9a07a';ctx.fillStyle=snow;ctx.fillRect(0,GY,800,450-GY);
  ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=1;ctx.beginPath();for(let m=0;m<=TRACK;m++){const x=x0+m*ppm;ctx.moveTo(x,GY);ctx.lineTo(x,GY+10);}ctx.stroke();
  for(let m=0;m<=TRACK;m++)txt(ctx,m+' m',x0+m*ppm,GY+26,{s:11*k,a:'center',c:'#333'});
  txt(ctx,p.mu===0?'Ice (μ = 0)':'Snow, μ = '+p.mu.toFixed(2),16,440,{s:12*k,w:600,c:'#222'});
  const fx=x0+TRACK*ppm;for(let i=0;i<6;i++){ctx.fillStyle=i%2?'#222':'#fff';ctx.fillRect(fx-3,GY-60+i*10,6,10);}
  const f=forces(p,s.x,s.v),th=p.th*Math.PI/180,bw=70,bh=30,bx=x0+s.x*ppm,by=GY-bh;
  ctx.fillStyle='#8a4b2a';rr(ctx,bx-bw/2,by,bw,bh-6,5);ctx.fill();ctx.strokeStyle='#5a2e18';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(bx-bw/2-4,GY-3);ctx.lineTo(bx+bw/2+2,GY-3);ctx.quadraticCurveTo(bx+bw/2+14,GY-3,bx+bw/2+12,GY-16);ctx.stroke();
  txt(ctx,p.M+' kg',bx,by+16,{s:11.5*k,a:'center',w:700,c:'#fff'});
  const ax0=bx+bw/2-4,ay0=by+6;ctx.strokeStyle='#9c7a46';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(ax0,ay0);ctx.lineTo(ax0+Math.cos(th)*90,ay0-Math.sin(th)*90);ctx.stroke();
  if(f.Fe>0.5)arrow(ctx,ax0,ay0,Math.cos(th)*clamp(f.Fe*0.45,12,90),-Math.sin(th)*clamp(f.Fe*0.45,12,90),PAL['s1'],4);
  if(f.f>0.5&&p.mu>0)arrow(ctx,bx-bw/2+4,GY-3,-clamp(f.f*0.55,10,90),0,PAL['s4'],4);
  if(f.lift)pill(ctx,'The sled would lift off',bx,by-30,PAL['s4'],'#fff',12*k);
  // force inset
  const IX=16,IY=16,IW=300,IH=40+120;panel(ctx,IX,IY,IW,IH);txt(ctx,'Your pull',IX+12,IY+22,{s:13*k,w:700});
  txt(ctx,'v = '+s.v.toFixed(2)+' m/s',IX+IW-12,IY+22,{s:12.5*k,a:'right',w:700,c:PAL['cv-soft']});
  const ox=IX+30,oy=IY+IH-24,Lmax=150,sc=Lmax/Math.max(1,p.F*(p.prof==='const'?1:2)),Fl=f.Fe*sc,ex=Math.cos(th)*Fl,ey=-Math.sin(th)*Fl;
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(ox-10,oy);ctx.lineTo(ox+Lmax+20,oy);ctx.stroke();
  if(Fl>2){arrow(ctx,ox,oy,ex,ey,PAL['s1'],4);
    txt(ctx,'F '+f.Fe.toFixed(0)+' N',ox+ex+(p.th>60?10:4),oy+ey-6,{s:12*k,w:700,c:PAL['s1']});
    if(p.th>0&&p.th<90){ctx.save();ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['cv-soft'];ctx.beginPath();ctx.moveTo(ox+ex,oy+ey);ctx.lineTo(ox+ex,oy);ctx.stroke();ctx.restore();
      ctx.strokeStyle=PAL['cv-soft'];ctx.beginPath();ctx.arc(ox,oy,24,-th,0);ctx.stroke();txt(ctx,p.th+'°',ox+28,oy-4,{s:11*k,c:PAL['cv-soft']});}
    if(Math.abs(ex)>2){arrow(ctx,ox,oy+8,ex,0,PAL['s3'],3);}
    txt(ctx,(hon?'F cos θ = ':'Along the floor: ')+f.Fx.toFixed(0)+' N (does work)',ox,oy+22*k*0.9,{s:11.5*k,w:700,c:PAL['s3']});}
  else txt(ctx,'No pull',ox,oy-20,{s:12*k,c:PAL['cv-soft']});
  // work tally: one row per force
  const rows=[['Pull',s.WF,PAL['s1']],['Friction',s.Wf,PAL['s4']],['Gravity',0,PAL['s2']],['Normal force',0,PAL['s6']]];
  if(hon)rows.push(['Net work',s.WF+s.Wf,PAL['s5']],['Kinetic energy',0.5*p.M*s.v*s.v,PAL['s3']]);
  const rh=14*k+16,X=556,Y=16,W=230,H=34+rows.length*rh;panel(ctx,X,Y,W,H);txt(ctx,'Work tally',X+12,Y+22,{s:13*k,w:700});
  const b0=X+12,b1=X+W-12,zero=b0+(b1-b0)*0.3,big=Math.max(100,p.F*TRACK,Math.abs(s.WF),Math.abs(s.Wf));
  rows.forEach(([l,v,c],i)=>{const ry=Y+34+i*rh;txt(ctx,l+': '+v.toFixed(0)+' J',b0,ry+12*k,{s:11.5*k,c:PAL['cv-ink'],w:600});
    const by2=ry+12*k+4,w=v>=0?v/big*(b1-zero):v/big*(zero-b0)*3.3;ctx.fillStyle=PAL['line'];ctx.fillRect(zero,by2-1,1,10);
    ctx.fillStyle=c;ctx.fillRect(Math.min(zero,zero+w),by2,Math.max(1,Math.abs(clamp(w,b0-zero,b1-zero))),8);});}


BioLab.register(SIM);
})();
