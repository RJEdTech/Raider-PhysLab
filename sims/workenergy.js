(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,RM,axes}=BioLab.h;

/* Work → energy lab (g = 9.8 m/s²). Three set-ups, each ending in a measurement you can record as a trial.
   Push a cart: force F at angle θ below level for a push distance d, then the cart rolls through a photogate 0.40 m later.
     During the push N = Mg + F sinθ, rolling resistance f = μN; work by you W = F cosθ · d; work by friction W_f = −∫f dx.
     The integrator uses the average speed each step, so W + W_f = ½Mv² exactly (work–energy theorem).
   Lift a suitcase: "steady" speeds up at 2 m/s² to 0.6 m/s, cruises, then slows to a stop at the shelf, so your force is
     m(g + a) and the total work is exactly mgh. "Pull harder" applies a constant F from rest: W = Fh, PE = mgh, KE = (F − mg)h.
   Spring launcher: a ball sits on a spring compressed by x. Spring force kc pushes it up until the spring is relaxed, then it
     flies. Heights are measured from the ball's starting point, so ½kx² = mg·h_max exactly. */
const G=9.8,GATE=0.4,END=5.8,PX0=34,PPM=70,FLOOR=372,HOLD=2.2,READY=0.6;
const MODE_CTL={F:['push'],d:['push'],M:['push'],th:['push'],mu:['push'],m:['lift'],h:['lift'],how:['lift'],FL:['lift'],k:['spring'],x:['spring'],mb:['spring']};
const MODE_TILE={W:['push','lift'],Wf:['push'],vg:['push'],PE:['lift','spring'],Us:['spring'],hm:['spring'],vl:['spring'],y:['lift']};

function arrow(ctx,x,y,dx,dy,col,w){const L=Math.hypot(dx,dy);if(L<2)return;const head=Math.min(12,4+L*0.25),ux=dx/L,uy=dy/L;
  ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=w||3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+dx-ux*head*0.8,y+dy-uy*head*0.8);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+dx,y+dy);ctx.lineTo(x+dx-ux*head-uy*head*0.55,y+dy-uy*head+ux*head*0.55);ctx.lineTo(x+dx-ux*head+uy*head*0.55,y+dy-uy*head-ux*head*0.55);ctx.closePath();ctx.fill();ctx.lineCap='butt';}
function sync(sim){const id=sim.def.id,m=sim.p.mode;if(!sim.ui||!sim.ui.sec)return;
  for(const c of SIM.controls){const el=document.getElementById(id+'-'+c.id)||document.getElementById(id+'-'+c.id+'-l');if(!el)continue;const w=el.closest('.ctl');if(!w)continue;
    w.hidden=!atLeast(c.lvl)||(MODE_CTL[c.id]&&!MODE_CTL[c.id].includes(m))||(c.id==='FL'&&sim.p.how!=='hard');}
  for(const mt of SIM.metrics){const t=sim.ui.tiles&&sim.ui.tiles[mt.id];if(!t)continue;t.num.closest('.tile').hidden=!atLeast(mt.lvl)||(MODE_TILE[mt.id]&&!MODE_TILE[mt.id].includes(m));}}
/* push forces */
function pushF(p,v,pushing){const th=p.th*Math.PI/180,F=pushing?p.F:0,Fa=F*Math.cos(th),N=p.M*G+F*Math.sin(th),f=p.mu*N;return {Fa,N,f,stuck:pushing&&v<=1e-9&&Fa<=f+1e-9};}
/* steady lift profile: a = ±2 m/s² to 0.6 m/s */
const LA=2,LV=0.6;
function liftForce(p,s){if(p.how==='hard')return p.FL;const ramp=LV*LV/(2*LA);if(p.h<2*ramp)return p.m*G;if(s.y<ramp)return p.m*(G+LA);if(s.y>p.h-ramp)return p.m*(G-LA);return p.m*G;}
const predH=p=>0.5*p.k*p.x*p.x/(p.mb*G);
function fresh(){return {ph:'ready',tw:0,x:0,v:0,W:0,Wf:0,y:0,c:0,vg:null,vl:null,hm:null,stuck:false,last:null,launched:false};}

const SIM={
  id:'workenergy',hash:'workenergy',apUnit:3,order:3,tab:'Work into energy',kind:'Virtual lab',prereq:['power'],next:['skatepark','springs'],
  card:'Push a shopping cart through a speed gate, lift a suitcase onto a shelf, and fire a spring launcher. Watch the work you do turn into speed, height and stored energy, joule for joule.',
  title:'Work into energy',
  lede:{bio:'Doing work on something gives it energy: push a cart and it speeds up, lift a suitcase and it sits higher, squeeze a spring and it stores energy. Every joule of work shows up somewhere.',
        honors:'Kinetic energy grows with speed squared, so twice the work gives only √2 times the speed. Rolling resistance does negative work, and a spring stores ½kx²: twice the squeeze, four times the energy.',
        ap:'Record trials and linearize: plot work against v² to find the mass from the slope, and find work as the area under each force–position graph.'},
  scale:{bio:'The cart track is 5.8 m long and the speed gate sits 0.40 m past the end of your push. The overhead shelf is up to 2.0 m high. The launcher’s ball starts on the squeezed spring, and heights are measured from there.'},
  timeScale:1,dtMax:0.004,prewarm:0,sampleDt:0.04,window:8,unit:'s',chChange:1,chReveal:6,
  controls:[
    {id:'mode',label:'Set-up',type:'seg',def:'push',lvl:'bio',options:[{v:'push',l:'Push a cart'},{v:'lift',l:'Lift a suitcase'},{v:'spring',l:'Spring launcher'}],onChange(sim){BioLab.reset(sim);sync(sim);}},
    {id:'F',label:'Your push',type:'range',min:0,max:150,step:5,def:60,unit:' N',lvl:'bio'},
    {id:'d',label:'Push distance',type:'range',min:0.5,max:3,step:0.25,def:2,unit:' m',d:2,lvl:'bio',help:'How far you push before you let go.'},
    {id:'M',label:'Cart + groceries',type:'range',min:10,max:60,step:5,def:20,unit:' kg',lvl:'bio'},
    {id:'th',label:'Push angle (down on the handle)',type:'range',min:0,max:45,step:5,def:0,unit:'°',lvl:'honors',help:'0° pushes level. Most people push a cart handle a little downward.'},
    {id:'mu',label:'Rolling resistance μ',type:'range',min:0,max:0.1,step:0.01,def:0,d:2,unit:'',lvl:'honors',help:'0 is a perfect track. Shopping-cart wheels on tile are about 0.02.'},
    {id:'m',label:'Suitcase mass',type:'range',min:2,max:25,step:1,def:10,unit:' kg',lvl:'bio',help:'A full carry-on is about 10 kg.'},
    {id:'h',label:'Shelf height',type:'range',min:0.5,max:2,step:0.1,def:1.9,unit:' m',d:1,lvl:'bio',help:'An airplane overhead bin is about 1.9 m up.'},
    {id:'how',label:'How you lift',type:'seg',def:'steady',lvl:'bio',options:[{v:'steady',l:'Steady'},{v:'hard',l:'Pull harder'}],onChange(sim){BioLab.reset(sim);sync(sim);}},
    {id:'FL',label:'Your lifting force',type:'range',min:0,max:300,step:5,def:150,unit:' N',lvl:'bio'},
    {id:'k',label:'Spring stiffness k',type:'range',min:100,max:1000,step:50,def:400,unit:' N/m',lvl:'bio'},
    {id:'x',label:'Squeeze the spring',type:'range',min:0.02,max:0.15,step:0.01,def:0.08,unit:' m',d:2,lvl:'bio'},
    {id:'mb',label:'Ball mass',type:'range',min:0.05,max:0.5,step:0.05,def:0.1,unit:' kg',d:2,lvl:'bio'}
  ],
  init(){return fresh();},
  step(sim,dt){const p=sim.p,s=sim.st;s.tw+=dt;
    if(s.ph==='ready'){if(s.tw>=READY){s.ph='go';s.tw=0;if(p.mode==='spring')s.c=p.x;}return;}
    if(s.ph==='done'){if(s.tw>=HOLD){Object.assign(s,fresh());}return;}
    if(p.mode==='push'){const pushing=s.x<p.d,fr=pushF(p,s.v,pushing);s.stuck=fr.stuck;if(fr.stuck){s.ph='done';s.tw=-1;return;}
      let a=(fr.Fa-fr.f)/p.M;if(!pushing&&s.v<=0){s.ph='done';s.tw=0;return;}
      let v1=s.v+a*dt;if(v1<0)v1=0;let va=(s.v+v1)/2,dx=va*dt;
      if(pushing&&s.x+dx>p.d&&va>0){const fdt=(p.d-s.x)/va;v1=s.v+a*fdt;va=(s.v+v1)/2;dx=p.d-s.x;}
      if(pushing)s.W+=fr.Fa*dx;s.Wf-=fr.f*dx;
      if(s.vg===null&&s.x<p.d+GATE&&s.x+dx>=p.d+GATE)s.vg=v1;
      s.x+=dx;s.v=v1;if(s.x>=END){s.x=END;s.ph='done';s.tw=0;}if(!pushing&&s.v<=0){s.v=0;s.ph='done';s.tw=0;}return;}
    if(p.mode==='lift'){const F=liftForce(p,s);if(p.how==='hard'&&F<=p.m*G){s.stuck=true;s.ph='done';s.tw=-1;return;}
      const a=F/p.m-G;let v1=s.v+a*dt;if(v1<0)v1=0;let va=(s.v+v1)/2,dy=va*dt;if(p.how==='steady'&&s.v<=0&&s.y>0.05){s.v=0;}
      if(s.y+dy>=p.h){const fdt=va>0?(p.h-s.y)/va:dt;v1=s.v+a*fdt;va=(s.v+v1)/2;dy=p.h-s.y;}
      s.W+=F*dy;s.y+=dy;s.v=v1;if(s.y>=p.h-1e-9){s.y=p.h;s.last={v:s.v};s.ph='done';s.tw=0;}
      if(p.how==='steady'&&s.v<=1e-6&&s.y>0.05&&s.y<p.h){s.y=p.h;s.v=0;s.ph='done';s.tw=0;}return;}
    // spring launcher
    if(s.c>0){const a=p.k*s.c/p.mb-G;let v1=s.v+a*dt,va=(s.v+v1)/2,dy=va*dt;if(dy>=s.c){const fdt=s.c/Math.max(va,1e-6);v1=s.v+a*fdt;dy=s.c;}
      s.y+=dy;s.c-=dy;s.v=v1;if(s.c<=1e-9){s.c=0;s.launched=true;s.vl=Math.sqrt(Math.max(0,p.k*p.x*p.x/p.mb-2*G*p.x));s.v=s.vl;}return;}
    const v1=s.v-G*dt;if(v1<=0){s.y+=s.v*s.v/(2*G);s.v=0;s.hm=s.y;s.ph='done';s.tw=0;return;}s.y+=(s.v+v1)/2*dt;s.v=v1;},
  metrics:[
    {id:'W',label:'Work done by you',unit:'J',lvl:'bio',d:0,max:null,get:s=>s.st.W},
    {id:'KE',label:'Kinetic energy',unit:'J',lvl:'bio',d:1,max:null,get:s=>{const m=s.p.mode==='push'?s.p.M:s.p.mode==='lift'?s.p.m:s.p.mb;return 0.5*m*s.st.v*s.st.v;}},
    {id:'PE',label:'Gravitational PE gained',unit:'J',lvl:'bio',d:1,max:null,get:s=>(s.p.mode==='lift'?s.p.m:s.p.mb)*G*s.st.y},
    {id:'Us',label:'Spring energy stored',unit:'J',lvl:'bio',d:2,max:null,get:s=>{const c=s.st.ph==='ready'?s.p.x:s.st.c;return 0.5*s.p.k*c*c;}},
    {id:'vg',label:'Speed at the gate',unit:'m/s',lvl:'bio',d:2,max:null,get:s=>s.st.vg===null?0:s.st.vg},
    {id:'v',label:'Speed now',unit:'m/s',lvl:'bio',d:2,max:null,get:s=>s.st.v},
    {id:'y',label:'Height',unit:'m',lvl:'bio',d:2,max:null,get:s=>s.st.y},
    {id:'hm',label:'Highest point',unit:'m',lvl:'bio',d:2,max:null,get:s=>s.st.hm===null?s.st.y:s.st.hm},
    {id:'vl',label:'Launch speed',unit:'m/s',lvl:'honors',d:2,max:null,get:s=>s.st.vl===null?0:s.st.vl},
    {id:'Wf',label:'Work done by rolling resistance',unit:'J',lvl:'honors',d:1,max:null,get:s=>s.st.Wf},
    {id:'v2',label:'Speed squared at the gate',unit:'m²/s²',lvl:'ap',d:2,max:null,get:s=>s.st.vg===null?0:s.st.vg*s.st.vg}
  ],
  graphs:[{id:'en',label:'Energy over time',lines:['W','KE','PE','Us']},{id:'v',label:'Speed',lines:['v']},{id:'fx',label:'Force vs. position',lvl:'honors',custom:true}],
  defaultGraph:'en',
  plot(sim,ctx,box,id){const p=sim.p,s=sim.st,N=120,pts=[];let xmax,xl,yl,f,done,area;
    if(p.mode==='push'){xmax=Math.max(p.d*1.2,1);xl='Position (m)';yl='Your push along the motion (N)';const Fa=p.F*Math.cos(p.th*Math.PI/180);f=x=>x<=p.d?Fa:0;done=Math.min(s.x,p.d);area=s.W;}
    else if(p.mode==='lift'){xmax=p.h*1.1;xl='Height (m)';yl='Your lifting force (N)';f=y=>y>p.h?0:liftForce(p,{y});done=s.y;area=s.W;}
    else{xmax=p.x*1.2;xl='Spring squeeze (m)';yl='Spring force kx (N)';f=c=>c<=p.x?p.k*c:0;done=null;area=0.5*p.k*(p.x*p.x-s.c*s.c);}
    let ymax=1;for(let i=0;i<=N;i++){const x=i/N*xmax;pts.push([x,f(x)]);ymax=Math.max(ymax,f(x));}
    const ax=axes(ctx,box,{xmin:0,xmax,ymin:0,ymax:ymax*1.2,xl,yl});ctx.fillStyle=PAL['s1'];ctx.globalAlpha=0.25;ctx.beginPath();
    if(p.mode==='spring'){const c0=s.ph==='ready'?p.x:s.c;ctx.moveTo(ax.X(c0),ax.Y(0));pts.filter(q=>q[0]>=c0&&q[0]<=p.x).forEach(q=>ctx.lineTo(ax.X(q[0]),ax.Y(q[1])));ctx.lineTo(ax.X(p.x),ax.Y(0));}
    else{ctx.moveTo(ax.X(0),ax.Y(0));pts.filter(q=>q[0]<=done).forEach(q=>ctx.lineTo(ax.X(q[0]),ax.Y(q[1])));ctx.lineTo(ax.X(done),ax.Y(f(Math.max(0,done-1e-6))));ctx.lineTo(ax.X(done),ax.Y(0));}
    ctx.closePath();ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2.5;ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(ax.X(q[0]),ax.Y(q[1])):ctx.moveTo(ax.X(q[0]),ax.Y(q[1])));ctx.stroke();
    txt(ctx,(p.mode==='spring'?'Shaded area = spring energy released = ':'Shaded area = work = ')+area.toFixed(p.mode==='spring'?2:0)+' J',ax.X(xmax*0.04),box.T+16,{s:13,w:700,c:PAL['cv-ink']});},
  onLevel(sim){sync(sim);},initVis(sim){sync(sim);},onChallenge(sim){sync(sim);},
  onTourExit(sim){BioLab.setValues(sim,{mode:'push',F:60,d:2,M:20,th:0,mu:0});BioLab.reset(sim);sync(sim);},
  challenges:[
    {lvl:'bio',q:'You push the 20 kg cart with 60 N for 2 m, then for 4 m. What happens to its speed at the gate?',choices:['It doubles','It goes up about 1.4 times','It stays the same','It goes up 4 times'],correct:1,
     baseline:{mode:'push',F:60,d:2,M:20,th:0,mu:0},change:{d:4},changeText:'Push distance doubled to 4 m',watch:'vg',
     explain:{bio:'Twice the distance is twice the work, 240 J instead of 120 J, so twice the kinetic energy. But KE = ½mv², so the speed only grows by √2 ≈ 1.41: from 3.46 to 4.90 m/s.'}},
    {lvl:'bio',q:'Same 60 N push for 2 m, but the cart is loaded to 40 kg. How does its kinetic energy at the gate compare?',choices:['It is the same, 120 J','It is half as much','It is twice as much','It is zero'],correct:0,
     baseline:{mode:'push',F:60,d:2,M:20,th:0,mu:0},change:{M:40},changeText:'Cart loaded to 40 kg',watch:'KE',
     explain:{bio:'The work is still 60 N × 2 m = 120 J, so the cart still gets 120 J of kinetic energy. The heavier cart just moves slower with it: 2.45 m/s instead of 3.46 m/s.'}},
    {lvl:'bio',q:'You lift the 10 kg suitcase to the 1.9 m shelf, first steadily, then by pulling 150 N the whole way. Which takes more work?',choices:['Pulling harder: 285 J against 186 J','Both take 186 J; the height is the same','Lifting steadily, because it takes longer','Neither, since the bag ends up at rest'],correct:0,
     baseline:{mode:'lift',m:10,h:1.9,how:'steady'},change:{how:'hard',FL:150},changeText:'Now pulling 150 N the whole way',watch:'W',
     explain:{bio:'Steady, your work equals the gain in height energy, mgh = 10 × 9.8 × 1.9 ≈ 186 J. Pulling 150 N for 1.9 m does 285 J: 186 J of height energy plus 99 J of speed that slams the bag into the shelf.'}},
    {lvl:'bio',q:'You squeeze the launcher spring twice as far, from 5 cm to 10 cm. How much higher does the ball go?',choices:['4 times as high','Twice as high','The same height','1.4 times as high'],correct:0,
     baseline:{mode:'spring',k:400,x:0.05,mb:0.1},change:{x:0.1},changeText:'Spring squeezed to 10 cm',watch:'hm',
     explain:{bio:'A spring stores ½kx², so twice the squeeze stores four times the energy: 0.5 J becomes 2.0 J. All of it becomes height energy mgh, so the ball goes 4 times as high, about 0.51 m to 2.04 m.'}},
    {lvl:'honors',q:'You push down on the handle at 40° instead of level, same 60 N. What happens to the work you do on the cart?',choices:['It drops to about 46 J per meter of push','It stays 60 J per meter of push','It rises, since pushing down adds force','It drops to zero, since you push down'],correct:0,
     baseline:{mode:'push',F:60,d:2,M:20,th:0,mu:0},change:{th:40},changeText:'Pushing down at 40°',watch:'W',
     explain:{honors:'Only the part of your push along the motion does work: 60 cos 40° ≈ 46 N. Over 2 m that is 92 J instead of 120 J. The downward part pushes the cart into the floor and does no work.'}},
    {lvl:'honors',q:'The track gets rolling resistance μ = 0.05. With the same 60 N push for 2 m, what reaches the gate?',choices:['Less kinetic energy than the 120 J of work','Exactly 120 J, since your work is unchanged','More than 120 J, since friction adds grip','No kinetic energy; friction takes it all'],correct:0,
     baseline:{mode:'push',F:60,d:2,M:20,th:0,mu:0},change:{mu:0.05},changeText:'Rolling resistance μ = 0.05',watch:'KE',
     explain:{honors:'Rolling resistance (μMg ≈ 9.8 N) does negative work, about −24 J by the gate. The net work, 120 − 24 ≈ 96 J, is what becomes kinetic energy. Net work equals the change in KE.'}},
    {lvl:'ap',q:'Trials at different push distances give a straight line of work against v² at the gate. What does the slope tell you?',choices:['Half the cart’s mass, m/2','The cart’s mass, m','The push force','The acceleration'],correct:0,instant:true,
     explain:{ap:'W = ½mv², so W plotted against v² is a line through the origin with slope m/2. For the 20 kg cart the slope is 10 kg, which is how you can weigh a cart with a ruler, a force gauge and a speed gate.'}}
  ],
  draw(sim,ctx,vdt,k,t){const p=sim.p,s=sim.st;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    if(p.mode==='push')drawPush(sim,ctx,k);else if(p.mode==='lift')drawLift(sim,ctx,k);else drawSpring(sim,ctx,k);
    drawBars(sim,ctx,k);
    if(s.stuck)pill(ctx,p.mode==='push'?'Too weak: your push can’t beat the rolling resistance':'Too weak: your force must be more than the weight, '+Math.round(p.m*G)+' N',280,40,PAL['s1'],'#fff',13*k);},
  narrate(sim){const p=sim.p,s=sim.st,f0=v=>v.toFixed(0),f2=v=>v.toFixed(2);
    if(p.mode==='push'){const W=p.F*Math.cos(p.th*Math.PI/180)*p.d;
      if(s.vg!==null)return 'Your work: <b>'+f0(s.W)+' J</b>'+(p.mu>0?', minus '+f0(-s.Wf)+' J taken by rolling resistance':'')+'. At the gate the cart has <b>'+(0.5*p.M*s.vg*s.vg).toFixed(0)+' J</b> of kinetic energy, so it moves at '+f2(s.vg)+' m/s.';
      return 'You push '+p.F+' N for '+p.d+' m: work W = F × d'+(p.th?' × cos '+p.th+'°':'')+' = <b>'+f0(W)+' J</b>. Watch where that energy goes.';}
    if(p.mode==='lift'){if(p.how==='steady')return 'Lifting steadily, your force is about the weight, mg = '+f0(p.m*G)+' N, so your work becomes height energy: mgh = '+f0(p.m*G*p.h)+' J.';
      return 'Pulling '+p.FL+' N for '+p.h+' m does '+f0(p.FL*p.h)+' J of work: '+f0(p.m*G*p.h)+' J of height energy, and the rest, '+f0(Math.max(0,(p.FL-p.m*G)*p.h))+' J, is speed when it hits the shelf.';}
    return 'The squeezed spring stores ½kx² = <b>'+(0.5*p.k*p.x*p.x).toFixed(2)+' J</b>. It all becomes motion, then height: the ball should reach mgh = ½kx², about <b>'+predH(p).toFixed(2)+' m</b>.';},
  tour:[
    {title:'Work is force × distance',text:'You push the cart with 60 N for 2 m: 60 × 2 = 120 joules of work. Watch the red bar on the right fill as you push.',pause:false,setup(sim){BioLab.setValues(sim,{mode:'push',F:60,d:2,M:20,th:0,mu:0});BioLab.reset(sim);}},
    {title:'Work becomes kinetic energy',text:'Once you let go, the cart keeps the 120 J as kinetic energy (the green bar). The speed gate measures how fast that is: 3.46 m/s.',pause:false,setup(sim){BioLab.reset(sim);}},
    {title:'Lifting stores height energy',text:'Lift a 10 kg suitcase 1.9 m onto the shelf. Your work, about 186 J, is now stored as gravitational potential energy, the blue bar.',pause:false,setup(sim){BioLab.setValues(sim,{mode:'lift',m:10,h:1.9,how:'steady'});BioLab.reset(sim);}},
    {title:'A spring stores energy too',text:'Squeeze the spring and it stores energy (purple). Let go and that energy becomes speed, then height, joule for joule.',pause:false,setup(sim){BioLab.setValues(sim,{mode:'spring',k:400,x:0.08,mb:0.1});BioLab.reset(sim);}}
  ],
  lab:{bio:'<p><b>Question:</b> How does the work you do on a cart decide its speed?</p><ol><li>Push the 20 kg cart with 60 N. Record trials at push distances of 0.5, 1, 1.5, 2, 2.5 and 3 m.</li><li>For each, calculate W = F × d and KE = ½mv² from the speed at the gate.</li><li>Graph KE against W.</li></ol><p><b>Claim–evidence:</b> What does your graph show about work and kinetic energy?</p>',
       honors:'<p><b>Question:</b> Where does the work go when there is rolling resistance?</p><ol><li>Set μ = 0.03. Record trials at six push distances.</li><li>Compare your work, the work by rolling resistance, and the KE at the gate.</li><li>Then use the spring launcher: record the highest point for squeezes of 2 to 12 cm and graph height against x².</li></ol>',
       ap:'<p><b>Question:</b> Can you find the cart’s mass using only work and speed?</p><ol><li>Choose a mass you don’t look at (have a partner set it). Push 60 N and record trials at six push distances.</li><li>Graph work (y) against v² at the gate (x) in the trials graph.</li><li>The slope is m/2. Report the mass with percent error.</li></ol>'},
  terms:[{t:'Work',d:'Energy transferred by a force acting through a distance: W = Fd when the force points along the motion. Unit: joule (J).'},{t:'Kinetic energy',d:'Energy of motion: KE = ½mv².'},{t:'Gravitational potential energy',d:'Energy stored by height: PE = mgh.'},
    {t:'Spring potential energy',d:'Energy stored in a squeezed or stretched spring: ½kx².'},{t:'Joule',d:'The unit of work and energy. Lifting a 1 kg bag about 10 cm takes about 1 J.'},
    {lvl:'honors',t:'Work–energy theorem',d:'The net work done on an object equals its change in kinetic energy.'},{lvl:'honors',t:'Negative work',d:'Work by a force that points against the motion, like friction. It takes energy out.'},
    {lvl:'ap',t:'Work as area',d:'For a force that changes, W = ∫F dx, the area under the force–position graph.'}],
  about:'<p>Everything is computed from Newton’s second law with g = 9.8 m/s², stepped every 4 ms. Work is added up as force × distance moved each step, and kinetic energy comes from the speed, so the energy bars are two independent calculations; they agree because of the work–energy theorem.</p><p>Simplifications: the cart rolls without air drag; rolling resistance is μ times the normal force (pushing down on the handle raises it). “Steady” lifting speeds up at 2 m/s² to 0.6 m/s and slows the same way before the shelf, so your force is a little more than the weight at the start and a little less at the end. The launcher spring is massless and ideal, and heights are measured from the ball’s starting point on the squeezed spring.</p>'
};

/* ---------- drawing ---------- */
const PX=x=>PX0+x*PPM;
function drawPush(sim,ctx,k){const p=sim.p,s=sim.st;
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,FLOOR,548,450-FLOOR);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;for(let m=0;m<=6;m++){ctx.beginPath();ctx.moveTo(PX(m),FLOOR);ctx.lineTo(PX(m),FLOOR+8);ctx.stroke();txt(ctx,m+' m',PX(m),FLOOR+22,{s:11*k,a:'center',c:PAL['cv-soft']});}
  // push zone
  ctx.fillStyle=PAL['s1'];ctx.globalAlpha=0.12;ctx.fillRect(PX(0),FLOOR-232,p.d*PPM,232);ctx.globalAlpha=1;txt(ctx,'push zone: '+p.d+' m',PX(0)+6,FLOOR-240,{s:12.5*k,w:700,c:PAL['s1']});
  // gate
  const gx=PX(p.d+GATE+0.55*1.35);ctx.fillStyle='#555';ctx.fillRect(gx-3,FLOOR-180,6,180);ctx.fillRect(gx-3,FLOOR-180,26,8);ctx.strokeStyle='rgba(200,16,46,.55)';ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(gx,FLOOR-172);ctx.lineTo(gx,FLOOR);ctx.stroke();ctx.setLineDash([]);
  txt(ctx,'speed gate',gx,FLOOR-190,{s:11.5*k,a:'center',c:PAL['cv-soft'],w:700});
  if(s.vg!==null)pill(ctx,s.vg.toFixed(2)+' m/s',gx,FLOOR-216,PAL['s3'],'#fff',15*k);
  // cart: front of the basket sits at x (+0.55 m), handle at the back
  const cx=PX(s.x),Z=1.35,big=(x,fn)=>{ctx.save();ctx.translate(x,FLOOR);ctx.scale(Z,Z);ctx.translate(-x,-FLOOR);fn();ctx.restore();};big(cx,()=>drawCart(ctx,cx,k));
  const pushing=s.ph!=='done'&&s.x<p.d,hx=cx-10*Z,hy=FLOOR-104*Z;
  if(pushing&&!s.stuck||s.ph==='ready'){big(cx,()=>drawPerson(ctx,cx-6,k,true));const L=Math.min(120,14+p.F*0.75),th=p.th*Math.PI/180;arrow(ctx,hx+4,hy-16,L*Math.cos(th),L*Math.sin(th),PAL['s1'],4);txt(ctx,'F = '+p.F+' N'+(p.th?' at '+p.th+'°':''),hx+4,hy-26,{s:13*k,w:700,c:PAL['s1']});}
  else if(s.stuck)big(cx,()=>drawPerson(ctx,cx-6,k,true));else big(PX(p.d),()=>drawPerson(ctx,PX(p.d)-6,k,false));
  if(s.v>0.01&&p.mu>0)arrow(ctx,cx+40,FLOOR-10,-Math.min(60,10+p.mu*p.M*G*1.5),0,PAL['s4'],3);
  txt(ctx,'v = '+s.v.toFixed(2)+' m/s',16,24,{s:14*k,w:700});}
function drawCart(ctx,x,k){ctx.save();ctx.strokeStyle='#5f6b78';ctx.lineWidth=3;ctx.fillStyle='rgba(120,140,160,.18)';
  ctx.beginPath();ctx.moveTo(x,FLOOR-96);ctx.lineTo(x+70,FLOOR-96);ctx.lineTo(x+62,FLOOR-40);ctx.lineTo(x+8,FLOOR-40);ctx.closePath();ctx.fill();ctx.stroke();
  for(let i=1;i<5;i++){ctx.beginPath();ctx.moveTo(x+i*14,FLOOR-96);ctx.lineTo(x+4+i*12,FLOOR-40);ctx.stroke();}
  ctx.beginPath();ctx.moveTo(x,FLOOR-96);ctx.lineTo(x-10,FLOOR-104);ctx.stroke();ctx.beginPath();ctx.moveTo(x+8,FLOOR-40);ctx.lineTo(x+10,FLOOR-16);ctx.lineTo(x+60,FLOOR-16);ctx.lineTo(x+62,FLOOR-40);ctx.stroke();
  // groceries
  [['#e07a2f',18,-112,14],['#3aa36b',36,-118,12],['#c8102e',52,-110,10]].forEach(([c,dx,dy,r])=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(x+dx,FLOOR+dy+18,r,0,Math.PI*2);ctx.fill();});
  ctx.fillStyle='#333';[x+14,x+56].forEach(wx=>{ctx.beginPath();ctx.arc(wx,FLOOR-7,7,0,Math.PI*2);ctx.fill();});ctx.restore();}
function drawPerson(ctx,x,k,arms){ctx.save();ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=4;ctx.lineCap='round';const hx=x-34;
  ctx.beginPath();ctx.arc(hx,FLOOR-146,11,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(hx,FLOOR-135);ctx.lineTo(hx-6,FLOOR-70);ctx.lineTo(hx-24,FLOOR-2);ctx.moveTo(hx-6,FLOOR-70);ctx.lineTo(hx+12,FLOOR-2);ctx.stroke();
  ctx.beginPath();ctx.moveTo(hx-2,FLOOR-122);if(arms)ctx.lineTo(x-4,FLOOR-104);else ctx.lineTo(hx+4,FLOOR-86);ctx.stroke();ctx.restore();}
function drawLift(sim,ctx,k){const p=sim.p,s=sim.st,Y0=410,S=150,Y=h=>Y0-h*S,bx=390;
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,Y0,548,450-Y0);
  // ruler
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;for(let h=0;h<=2;h+=0.5){ctx.beginPath();ctx.moveTo(40,Y(h));ctx.lineTo(52,Y(h));ctx.stroke();txt(ctx,h.toFixed(1)+' m',36,Y(h)+4,{s:11*k,a:'right',c:PAL['cv-soft']});}
  ctx.beginPath();ctx.moveTo(46,Y0);ctx.lineTo(46,Y(2.05));ctx.stroke();
  // shelf (overhead bin)
  ctx.fillStyle='#8a8f98';ctx.fillRect(bx-60,Y(p.h)-6,190,8);ctx.strokeStyle='#8a8f98';ctx.lineWidth=2;ctx.strokeRect(bx-60,Y(p.h)-70,190,64);txt(ctx,'shelf',bx+124,Y(p.h)-12,{s:11.5*k,a:'right',c:PAL['cv-soft'],w:700});
  // suitcase
  const sh=34+p.m*1.2,sw=60+p.m*1.2,by=Y(s.y);ctx.fillStyle='#2d6bd2';rr(ctx,bx-sw/2,by-sh-6,sw,sh,7);ctx.fill();ctx.fillStyle='#1f4f9e';ctx.fillRect(bx-sw/2+8,by-sh-6+6,4,sh-12);ctx.fillRect(bx+sw/2-12,by-sh-6+6,4,sh-12);
  ctx.strokeStyle='#333';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(bx-12,by-sh-6);ctx.lineTo(bx-12,by-sh-16);ctx.lineTo(bx+12,by-sh-16);ctx.lineTo(bx+12,by-sh-6);ctx.stroke();
  txt(ctx,p.m+' kg',bx,by-sh/2,{s:13*k,a:'center',w:700,c:'#fff'});
  // forces
  const F=s.ph==='done'?0:liftForce(p,s),fs=0.32;if(F>0&&!s.stuck)arrow(ctx,bx+sw/2+26,by-sh/2,0,-Math.min(170,F*fs),PAL['s1'],4);
  arrow(ctx,bx+sw/2+48,by-sh/2,0,Math.min(170,p.m*G*fs),'#666',3);
  if(F>0&&!s.stuck)txt(ctx,'you: '+Math.round(F)+' N',bx+sw/2+20,by-sh/2-Math.min(170,F*fs)-8,{s:12*k,w:700,c:PAL['s1'],a:'center'});
  txt(ctx,'weight: '+Math.round(p.m*G)+' N',bx+sw/2+56,by-sh/2+Math.min(170,p.m*G*fs)+16,{s:12*k,w:700,c:'#666',a:'center'});
  if(s.ph==='done'&&!s.stuck&&p.how==='hard'&&s.last&&s.last.v>0.3)pill(ctx,'Bang! It hits the shelf at '+s.last.v.toFixed(1)+' m/s',bx+30,Y(p.h)-90,PAL['s1'],'#fff',13*k);
  txt(ctx,'height '+s.y.toFixed(2)+' m',16,24,{s:14*k,w:700});}
function drawSpring(sim,ctx,k){const p=sim.p,s=sim.st,bx=250,base=428,REL=130,SQ=80/0.15,r=8+p.mb*16;
  const hTop=Math.max(0.6,predH(p)*1.12),Yrel=base-REL-5-r,S=Math.min(170,(Yrel-40)/Math.max(0.1,hTop-p.x)),Y=h=>Yrel-(h-p.x)*S;
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,base,548,450-base);
  // ruler: height above the ball's starting point
  const step=hTop>8?2:hTop>4?1:hTop>1.6?0.5:0.25;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;
  for(let h=step;h<=hTop+1e-9;h+=step){ctx.beginPath();ctx.moveTo(60,Y(h));ctx.lineTo(72,Y(h));ctx.stroke();txt(ctx,(step<0.5?h.toFixed(2):h.toFixed(1))+' m',56,Y(h)+4,{s:11*k,a:'right',c:PAL['cv-soft']});}
  ctx.beginPath();ctx.moveTo(66,Y(step));ctx.lineTo(66,Y(hTop));ctx.stroke();txt(ctx,'height above the start',30,Y(hTop)-10,{s:11*k,c:PAL['cv-soft']});
  const hp=predH(p);ctx.strokeStyle=PAL['s5'];ctx.setLineDash([6,5]);ctx.beginPath();ctx.moveTo(80,Y(hp));ctx.lineTo(410,Y(hp));ctx.stroke();ctx.setLineDash([]);
  txt(ctx,'½kx² = mgh',414,Y(hp)-3,{s:11.5*k,c:PAL['s5'],w:700});txt(ctx,'→ '+hp.toFixed(2)+' m',414,Y(hp)+13,{s:11.5*k,c:PAL['s5'],w:700});
  if(s.hm!==null)pill(ctx,'Top: '+s.hm.toFixed(2)+' m',bx+70,Y(s.hm)-6,PAL['s2'],'#fff',13*k);
  const c=s.ph==='ready'?p.x:s.c,top=base-REL+c*SQ;
  ctx.strokeStyle='#777';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(bx-28,base-REL-30);ctx.lineTo(bx-28,base);ctx.lineTo(bx+28,base);ctx.lineTo(bx+28,base-REL-30);ctx.stroke();
  ctx.strokeStyle=PAL['s5'];ctx.lineWidth=2.5;ctx.beginPath();const n=11;for(let i=0;i<=n*2;i++){const yy=base-(base-top)*i/(n*2),xx=bx+(i%2?19:-19);i?ctx.lineTo(xx,yy):ctx.moveTo(bx,base);}ctx.stroke();
  ctx.fillStyle='#555';ctx.fillRect(bx-24,top-5,48,5);txt(ctx,'squeezed '+(c*100).toFixed(0)+' cm',bx+36,base-20,{s:12*k,w:700,c:PAL['s5']});
  const ballY=(s.ph==='ready'||s.c>0)?top-5-r:Y(s.y);
  ctx.fillStyle='#e07a2f';ctx.beginPath();ctx.arc(bx,ballY,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#9a4f17';ctx.lineWidth=1.5;ctx.stroke();
  txt(ctx,'height '+s.y.toFixed(2)+' m',16,24,{s:14*k,w:700});}
/* energy bars: where the joules are */
function drawBars(sim,ctx,k){const p=sim.p,s=sim.st,X0=566,W=224;ctx.fillStyle=PAL['cv-bg2']||PAL['cv-bg'];rr(ctx,X0-8,8,W+12,434,10);ctx.fill();
  txt(ctx,'Energy (joules)',X0,32,{s:13.5*k,w:700});const mt=id=>sim.def.metrics.find(m=>m.id===id).get(sim);
  const rows=[];if(p.mode!=='spring')rows.push(['Work by you',mt('W'),PAL['s1']]);if(p.mode==='spring')rows.push(['Spring',mt('Us'),PAL['s5']]);
  rows.push(['Kinetic',mt('KE'),PAL['s3']]);if(p.mode!=='push')rows.push(['Height (gravity)',mt('PE'),PAL['s2']]);if(p.mode==='push'&&atLeast('honors')&&p.mu>0)rows.push(['Heat (rolling)',-mt('Wf'),PAL['s4']]);
  const tot=p.mode==='push'?Math.max(1,p.F*Math.cos(p.th*Math.PI/180)*p.d):p.mode==='lift'?Math.max(1,(p.how==='hard'?Math.max(p.FL,p.m*G):p.m*G*1.05)*p.h):Math.max(0.01,0.5*p.k*p.x*p.x);
  const bw=Math.min(52,(W-10)/rows.length-12),H=300,base=400;
  rows.forEach(([l,v,c],i)=>{const x=X0+6+i*(bw+14),h=clamp(v/tot,0,1.15)*H;ctx.fillStyle=c;ctx.fillRect(x,base-h,bw,h);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.strokeRect(x,base-H,bw,H);
    txt(ctx,v>=10?v.toFixed(0):v.toFixed(v>=1?1:2),x+bw/2,base-h-6,{s:12*k,w:700,a:'center',c});
    l.split(' ').forEach((w,j)=>txt(ctx,w,x+bw/2,base+16+j*14,{s:11*k,a:'center',c:PAL['cv-ink']}));});
  // total line for push/lift: the joules you put in
  if(p.mode==='push'&&atLeast('honors')&&p.mu>0){const ke=mt('KE'),hf=-mt('Wf');txt(ctx,'KE + heat = '+(ke+hf).toFixed(0)+' J',X0,62,{s:12*k,c:PAL['cv-soft'],w:600});}
  if(p.mode==='lift'){txt(ctx,'KE + height = '+(mt('KE')+mt('PE')).toFixed(0)+' J',X0,62,{s:12*k,c:PAL['cv-soft'],w:600});}
  if(p.mode==='spring'){txt(ctx,'Total: '+(mt('Us')+mt('KE')+mt('PE')).toFixed(2)+' J',X0,62,{s:12*k,c:PAL['cv-soft'],w:600});}}

BioLab.register(SIM);
})();
