(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,RM,axes,legend,fmtNum}=BioLab.h;

/* Motion in one dimension on a 20 m track.
   Explore: a cart with initial position x0, velocity v0 and constant acceleration a.
            x(t) = x0 + v0 t + ½ a t², v(t) = v0 + a t. The bumpers at 0 m and 20 m stop it.
   Race:    two billiard balls at constant velocity (Pivot Interactives W11). A starts at 0 m,
            B starts gap metres ahead. They meet when x_A = x_B, at t = gap / (vA − vB).
   Match:   the student sets a walker's velocity live, trying to trace a target graph in 10 s.
            Score = 100 − 25 × (mean error), floored at 0. */
const L=20,PX0=40,PXW=720,SX=m=>PX0+m/L*PXW,DUR=10;
const MODES={explore:'Cart',race:'Billiard race',match:'Graph matching'};
const PANELS=[{x:62,y:236,w:200,h:150},{x:322,y:236,w:200,h:150},{x:582,y:236,w:200,h:150}];
const CA='#3f6fb0',CB='#d9573b',CT='#7a7f87';

function makeTarget(seed){const r=rng(seed),segs=[];let x=2+r()*6,t=0;const xs0=x;
  while(t<DUR-1e-9){const d=Math.min(DUR-t,2+Math.floor(r()*3));let v=[-1.5,-1,-0.5,0,0.5,1,1.5][Math.floor(r()*7)];
    if(x+v*d>19)v=-Math.abs(v);if(x+v*d<1)v=Math.abs(v);if(segs.length&&segs[segs.length-1].v===v)v=v===0?1:0;if(x+v*d>19||x+v*d<1)v=0;
    segs.push({t0:t,t1:t+d,x0:x,v});x+=v*d;t+=d;}
  return {x0:xs0,segs};}
function tgtAt(T,t){const s=T.segs.find(s=>t>=s.t0&&t<=s.t1)||T.segs[T.segs.length-1];const tt=clamp(t,s.t0,s.t1);return {x:s.x0+s.v*(tt-s.t0),v:s.v};}

function applyMode(sim){if(!sim.ui||!sim.ui.sec)return;const m=sim.p.mode;
  SIM.metrics.forEach(me=>{const t=sim.ui.tiles&&sim.ui.tiles[me.id];if(!t)return;const tile=t.num.closest('.tile');if(tile)tile.hidden=!(atLeast(me.lvl||'bio')&&me.mode.includes(m));});
  SIM.controls.forEach(c=>{if(!c.mode)return;const e=sim.ui.sec.querySelector('#motion1d-'+c.id)||sim.ui.sec.querySelector('#motion1d-'+c.id+'-l');const w=e&&e.closest('.ctl');if(w)w.hidden=!(atLeast(c.lvl||'bio')&&c.mode.includes(m));});
  sim.ui.sec.querySelectorAll('.actions button').forEach(b=>{const a=SIM.actions.find(a=>a.label===b.textContent);if(a&&a.mode)b.hidden=!(atLeast(a.lvl||'bio')&&a.mode.includes(m));});}

function state(sim){const s=sim.st;if(sim.p.mode==='race')return {x:s.xa,v:sim.p.vA,a:0};return {x:s.x,v:s.v,a:s.aEff};}
function record(sim){const s=sim.st,q=state(sim);s.h.push({t:sim.t,x:q.x,v:q.v,a:q.a,xb:s.xb,vb:sim.p.vB});if(s.h.length>3000)s.h.shift();}
function markNow(sim){const q=state(sim);sim.st.marks.push({t:sim.t,x:q.x});if(sim.st.marks.length>8)sim.st.marks.shift();}

const SIM={
  id:'motion1d',hash:'motion1d',apUnit:1,order:1,tab:'Motion in one dimension',kind:'Simulation',next:['freefall','linearize'],
  card:'A cart, two racing billiard balls and a walker you steer, with live position, velocity and acceleration graphs and a motion diagram.',
  title:'Motion in one dimension',
  lede:{bio:'Watch a cart roll along a track while three graphs draw themselves. Learn to read where it is, how fast it goes and whether it is speeding up.',
        honors:'Connect the motion diagram, the x–t graph and the v–t graph: slope of x–t is velocity, area under v–t is displacement.',
        ap:'Model constant-acceleration motion with x = x₀ + v₀t + ½at², solve for meeting times, and treat velocity as the derivative of position.'},
  scale:'Track 20 m long, marked every metre. Speeds up to 4 m/s, about a fast walk. The dots are 0.5 s apart.',
  timeScale:1,dtMax:0.01,window:12,unit:'s',timeLabel:'Time',sampleDt:0.1,
  controls:[
    {id:'mode',label:'Activity',type:'seg',def:'explore',lvl:'bio',options:[{v:'explore',l:'Cart'},{v:'race',l:'Billiard race'},{v:'match',l:'Match the graph'}],onChange(sim){applyMode(sim);BioLab.reset(sim);}},
    {id:'x0',label:'Start position x₀',type:'range',min:0,max:20,step:0.5,def:2,unit:' m',lvl:'bio',mode:['explore'],onChange(sim){if(sim.t<0.05)BioLab.reset(sim);}},
    {id:'v0',label:'Start velocity v₀',type:'range',min:-4,max:4,step:0.1,def:1.5,unit:' m/s',lvl:'bio',mode:['explore'],help:'Negative means moving left',onChange(sim){if(sim.t<0.05)BioLab.reset(sim);}},
    {id:'a',label:'Acceleration a',type:'range',min:-2,max:2,step:0.1,def:0,unit:' m/s²',lvl:'bio',mode:['explore']},
    {id:'vA',label:'Ball A velocity',type:'range',min:0,max:4,step:0.1,def:1.5,unit:' m/s',lvl:'bio',mode:['race']},
    {id:'vB',label:'Ball B velocity',type:'range',min:0,max:4,step:0.1,def:0.5,unit:' m/s',lvl:'bio',mode:['race']},
    {id:'gap',label:'Ball B head start',type:'range',min:0,max:10,step:0.5,def:4,unit:' m',lvl:'bio',mode:['race'],onChange(sim){if(sim.t<0.05)BioLab.reset(sim);}},
    {id:'tgt',label:'Target graph',type:'seg',def:'x',lvl:'bio',mode:['match'],options:[{v:'x',l:'Position'},{v:'v',l:'Velocity',lvl:'honors'}],onChange(sim){BioLab.reset(sim);}},
    {id:'vctl',label:'Walking velocity (steer live)',type:'range',min:-3,max:3,step:0.1,def:0,unit:' m/s',lvl:'bio',mode:['match'],noTrial:true,help:'Drag while the clock runs'},
    {id:'strobe',label:'Motion diagram dots',type:'toggle',def:true,lvl:'bio'}
  ],
  actions:[
    {id:'mark',label:'Mark position now',mode:['explore','race','match'],run(sim){markNow(sim);}},
    {id:'newtgt',label:'New target graph',mode:['match'],run(sim){sim.mSeed=(sim.mSeed||7)+1;BioLab.reset(sim);}}
  ],
  init(sim){const p=sim.p,T=makeTarget(sim.mSeed||7);const x=p.mode==='match'?T.x0:p.x0;
    return {x,xStart:x,v:p.mode==='match'?0:p.v0,aEff:p.mode==='explore'?p.a:0,xa:0,xb:p.gap,meet:null,hit:null,h:[],dots:[],marks:[],T,err:0,errN:0,lastRec:-1,lastDot:-1};},
  step(sim,dt){const s=sim.st,p=sim.p,t=sim.t;
    if(p.mode==='explore'){if(s.hit===null){s.aEff=p.a;s.v+=p.a*dt;s.x+=s.v*dt;if(s.x<=0||s.x>=L){s.x=clamp(s.x,0,L);s.v=0;s.aEff=0;s.hit=t+dt;}}}
    else if(p.mode==='race'){const before=s.xa<s.xb;s.xa=Math.min(L,s.xa+p.vA*dt);s.xb=Math.min(L,s.xb+p.vB*dt);
      if(s.meet===null&&before&&s.xa>=s.xb&&s.xa<L){s.meet={t:t+dt,x:s.xa};}if(s.meet===null&&p.gap===0)s.meet={t:0,x:0};}
    else{const live=t<DUR;if(live){s.v=p.vctl;s.x=clamp(s.x+s.v*dt,0,L);s.aEff=0;const g=tgtAt(s.T,t+dt);s.err+=(p.tgt==='v'?Math.abs(s.v-g.v):Math.abs(s.x-g.x))*dt;s.errN+=dt;}else{s.v=0;}}
    const tn=t+dt;if(tn-s.lastRec>=0.05-1e-9){s.lastRec=tn;const q=state(sim);s.h.push({t:tn,x:q.x,v:q.v,a:q.a,xb:s.xb});if(s.h.length>3000)s.h.shift();}
    if(Math.floor(tn/0.5+1e-6)>Math.floor(t/0.5+1e-6)||s.lastDot<0){s.lastDot=tn;const q=state(sim);if(s.dots.length<60)s.dots.push({t:Math.round(tn*2)/2,x:q.x,xb:s.xb});}},
  metrics:[
    {id:'x',label:'Position',unit:'m',min:0,max:20,d:2,mode:['explore','match'],get:s=>s.st.x},
    {id:'v',label:'Velocity',unit:'m/s',min:-4,max:4,d:2,mode:['explore','match'],get:s=>s.st.v},
    {id:'a',label:'Acceleration',unit:'m/s²',min:-2,max:2,d:2,mode:['explore'],get:s=>s.st.aEff},
    {id:'xa',label:'Ball A position',unit:'m',min:0,max:20,d:2,mode:['race'],get:s=>s.st.xa},
    {id:'xb',label:'Ball B position',unit:'m',min:0,max:20,d:2,mode:['race'],get:s=>s.st.xb},
    {id:'sep',label:'B is ahead of A by',unit:'m',min:0,max:10,d:2,mode:['race'],get:s=>Math.max(0,s.st.xb-s.st.xa)},
    {id:'meet',label:'Balls meet at',unit:'',text:true,mode:['race'],get:s=>s.st.meet?('t = '+s.st.meet.t.toFixed(2)+' s, x = '+s.st.meet.x.toFixed(2)+' m'):'Not yet'},
    {id:'pmeet',label:'Predicted meeting time',unit:'',text:true,lvl:'honors',mode:['race'],noTrial:true,get:s=>s.p.vA>s.p.vB?('gap ÷ (v_A − v_B) = '+(s.p.gap/(s.p.vA-s.p.vB)).toFixed(2)+' s'):'Never: A is not faster'},
    {id:'score',label:'Match score',unit:'/ 100',min:0,max:100,d:0,mode:['match'],noTrial:true,get:s=>s.st.errN>0.2?Math.max(0,100-25*s.st.err/s.st.errN):NaN},
    {id:'disp',label:'Displacement since start',unit:'m',min:-20,max:20,d:2,lvl:'honors',mode:['explore'],get:s=>s.st.x-s.st.xStart}
  ],
  graphs:[{id:'x',label:'Position vs time (x–t)',custom:true},{id:'v',label:'Velocity vs time (v–t)',custom:true},{id:'a',label:'Acceleration vs time (a–t)',custom:true}],
  defaultGraph:'x',
  plot(sim,ctx,box,id){const s=sim.st,p=sim.p,H=s.h,tmax=Math.max(DUR,Math.ceil(sim.t));const race=p.mode==='race',match=p.mode==='match',hon=atLeast('honors');
    let ymin,ymax,yl;if(id==='x'){ymin=0;ymax=20;yl='Position x (m)';}else if(id==='v'){ymin=-4;ymax=4;yl='Velocity v (m/s)';}else{ymin=-2;ymax=2;yl='Acceleration a (m/s²)';}
    const b2=Object.assign({},box);if(race||match){b2.T=34;b2.H=box.H-(34-box.T);}
    const ax=axes(ctx,b2,{xmin:0,xmax:tmax,ymin,ymax,xl:'Time t (s)',yl});
    const line=(key,col,dash,data)=>{ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.setLineDash(dash?[6,5]:[]);ctx.beginPath();data.forEach((r,i)=>{const X=ax.X(r.t),Y=ax.Y(clamp(r[key],ymin,ymax));i?ctx.lineTo(X,Y):ctx.moveTo(X,Y);});ctx.stroke();ctx.setLineDash([]);};
    // area under v–t (honors): displacement as a shaded region
    if(id==='v'&&hon&&!match&&H.length>1){ctx.fillStyle='rgba(63,111,176,.18)';ctx.beginPath();ctx.moveTo(ax.X(H[0].t),ax.Y(0));H.forEach(r=>ctx.lineTo(ax.X(r.t),ax.Y(r.v)));ctx.lineTo(ax.X(H[H.length-1].t),ax.Y(0));ctx.closePath();ctx.fill();
      let area=0;for(let i=1;i<H.length;i++)area+=(H[i].v+H[i-1].v)/2*(H[i].t-H[i-1].t);txt(ctx,'Shaded area = '+area.toFixed(2)+' m = displacement',b2.L+10,b2.T+16,{s:13,w:600,c:PAL['fg']});}
    if(match){const tg=[];for(let t=0;t<=DUR+1e-9;t+=0.05){const g=tgtAt(s.T,t);tg.push({t,x:g.x,v:g.v,a:0});}if(id===p.tgt||id==='a')line(id==='a'?'a':p.tgt,CT,true,tg);}
    if(H.length){line(id,CA,false,H);if(race){line(id==='x'?'xb':id==='v'?'vb':'a',CB,false,H.map(r=>({t:r.t,xb:r.xb,vb:p.vB,a:0})));}}
    // tangent line on x–t (honors): slope = instantaneous velocity
    if(id==='x'&&hon&&p.mode==='explore'&&H.length>2){const r=H[H.length-1],dt=2;ctx.strokeStyle=PAL['s3'];ctx.lineWidth=1.5;ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(ax.X(Math.max(0,r.t-dt)),ax.Y(clamp(r.x-r.v*Math.min(dt,r.t),ymin,ymax)));ctx.lineTo(ax.X(r.t+dt),ax.Y(clamp(r.x+r.v*dt,ymin,ymax)));ctx.stroke();ctx.setLineDash([]);
      txt(ctx,'Tangent slope = '+r.v.toFixed(2)+' m/s = velocity now',b2.L+10,b2.T+16,{s:13,w:600,c:PAL['fg']});}
    if(id==='x')s.marks.forEach(m=>{ctx.fillStyle=PAL['s4'];ctx.beginPath();ctx.arc(ax.X(m.t),ax.Y(m.x),5,0,6.29);ctx.fill();});
    if(race&&s.meet&&id==='x'){ctx.strokeStyle=PAL['fg'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(ax.X(s.meet.t),ax.Y(s.meet.x),7,0,6.29);ctx.stroke();}
    if(race)legend(ctx,box.L+8,16,[{label:'Ball A',color:CA},{label:'Ball B',color:CB}]);
    if(match)legend(ctx,box.L+8,16,[{label:'You',color:CA},{label:'Target',color:CT,dash:true}]);},
  narrate(sim){const s=sim.st,p=sim.p,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode==='race'){if(p.vA<=p.vB)return 'Ball A is not faster than ball B, so the gap never closes: on the x–t graph the lines never cross.';
      if(s.meet)return '<b>A caught B</b> at t = '+s.meet.t.toFixed(2)+' s. On the x–t graph that is where the two lines cross.'+(hon?' A gains '+(p.vA-p.vB).toFixed(1)+' m every second, so a '+p.gap+' m head start lasts '+(p.gap/(p.vA-p.vB)).toFixed(2)+' s.':'');
      return 'Both balls roll at steady speeds: their x–t lines are straight. A is faster, so its line is steeper and closes the '+Math.max(0,s.xb-s.xa).toFixed(1)+' m gap.';}
    if(p.mode==='match'){if(sim.t<0.05)return 'Press <b>Play</b>, then drag <b>Walking velocity</b> to make the blue trace follow the dashed target. '+(p.tgt==='x'?'A flat target means stand still; a steeper target means walk faster.':'A target above zero means walk right; below zero means walk left.');
      if(sim.t>=DUR)return '<b>Time!</b> Final score '+Math.round(Math.max(0,100-25*s.err/Math.max(s.errN,1e-6)))+' / 100. Press <b>New target graph</b> to try another.';
      const g=tgtAt(s.T,sim.t);return 'Target right now: '+(p.tgt==='x'?'x = '+g.x.toFixed(1)+' m, sloping at '+g.v.toFixed(1)+' m/s':'v = '+g.v.toFixed(1)+' m/s')+'. You: x = '+s.x.toFixed(1)+' m, v = '+s.v.toFixed(1)+' m/s.';}
    if(s.hit!==null)return 'The cart hit the '+(s.x<=0?'left':'right')+' bumper at t = '+s.hit.toFixed(2)+' s and stopped. Press <b>Reset</b> to run it again.';
    const v=s.v,a=s.aEff;let how;if(Math.abs(a)<1e-9)how=Math.abs(v)<1e-9?'is at rest':'moves at a steady '+Math.abs(v).toFixed(2)+' m/s to the '+(v>0?'right':'left')+': equal spacing between dots, zero acceleration';
    else if(Math.abs(v)<0.05)how='is momentarily at rest and about to move '+(a>0?'right':'left');else how=(v*a>0?'is speeding up':'is slowing down')+' while moving '+(v>0?'right':'left')+(v*a>0?': the dots spread out':': the dots bunch together');
    return 'The cart '+how+'.'+(ap?' x(t) = '+fmtNum(p.x0,1)+' + ('+fmtNum(p.v0,1)+')t + ½('+fmtNum(p.a,1)+')t², so v = dx/dt = '+fmtNum(p.v0,1)+' + ('+fmtNum(p.a,1)+')t.':hon?' Slope of x–t = velocity; slope of v–t = acceleration.':'');},
  tour:[
    {title:'The track',text:'A cart on a 20 m track. The ruler is marked every metre. Position x is measured from the left end.',focus:[20,30,770,150],pause:true,setup(sim){BioLab.setValues(sim,{mode:'explore',x0:2,v0:1.5,a:0});BioLab.reset(sim);}},
    {title:'Motion diagram',text:'Every half second the cart leaves a dot. Equal spacing means steady speed.',focus:[20,150,770,52],speed:1},
    {title:'Position vs time',text:{bio:'This graph plots where the cart is at each moment. A steady speed makes a straight, sloped line.',honors:'Slope of x–t = Δx/Δt = velocity. Steeper means faster; downward means moving left.'},focus:[20,212,256,206],speed:1},
    {title:'Velocity vs time',text:{bio:'Velocity stays the same, so this line is flat.',honors:'Flat line at 1.5 m/s. The area under it, velocity × time, is the displacement.'},focus:[280,212,256,206],pause:true},
    {title:'Acceleration vs time',text:'No speeding up or slowing down: acceleration is zero.',focus:[540,212,256,206],pause:true},
    {title:'Now add acceleration',text:{bio:'With a = 0.5 m/s² the dots spread apart, the x–t line curves upward and the v–t line slopes up.',honors:'v = v₀ + at climbs steadily; x = x₀ + v₀t + ½at² is a parabola.'},focus:[20,30,770,390],speed:1,setup(sim){BioLab.setValues(sim,{a:0.5,v0:0});BioLab.reset(sim);}},
    {title:'Billiard race',text:'Ball A rolls faster but starts behind. Where the x–t lines cross, the balls are side by side.',focus:[20,30,770,390],speed:1.5,setup(sim){BioLab.setValues(sim,{mode:'race',vA:1.5,vB:0.5,gap:4});}},
    {title:'Match the graph',text:'Your turn: steer a walker in front of a motion detector so your graph traces the dashed target.',focus:[20,30,770,390],pause:true,setup(sim){BioLab.setValues(sim,{mode:'match',tgt:'x'});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'explore',x0:2,v0:1.5,a:0});BioLab.reset(sim);},
  onLevel(sim){applyMode(sim);},
  lab:{bio:'<p><b>Question:</b> How does a cart’s speed show up on each graph?</p><ol><li>Run the cart at 1 m/s, then at 3 m/s. Sketch both x–t graphs.</li><li>Set a = 0.5 m/s² and v₀ = 0. Describe the dots and the x–t shape.</li><li>Play Match the graph three times and record your best score.</li></ol>',
       honors:'<p><b>Question:</b> Does the area under v–t equal the displacement?</p><ol><li>Choose v₀ and a, run for 4 s, and record the shaded area.</li><li>Use Mark position at t = 0 and t = 4 s to measure the actual displacement.</li><li>Repeat with a negative acceleration so the cart turns around.</li></ol>',
       ap:'<p><b>Question:</b> When and where do two objects meet?</p><ol><li>In Billiard race, write x_A(t) and x_B(t) and solve x_A = x_B.</li><li>Test three combinations of speeds and head starts; compare prediction with the meeting readout.</li><li>For the cart, derive v(t) from x(t) and check the turnaround time v = 0.</li></ol>'},
  terms:[{t:'Position',d:'Where an object is, measured from a chosen origin (here, the left end).'},{t:'Velocity',d:'How fast and in which direction position changes. Negative means moving left.'},{t:'Acceleration',d:'How fast velocity changes. Zero acceleration means steady velocity.'},{t:'Motion diagram',d:'Dots showing the object’s position at equal time intervals.'},
    {lvl:'honors',t:'Displacement',d:'Change in position, Δx = x_final − x_initial. Equals the area under the v–t graph.'},{lvl:'honors',t:'Slope',d:'On an x–t graph the slope is velocity; on a v–t graph it is acceleration.'},
    {lvl:'ap',t:'Derivative',d:'v = dx/dt and a = dv/dt: the instantaneous slopes.'},{lvl:'ap',t:'Integral',d:'Δx = ∫v dt: the signed area under the v–t curve.'}],
  about:'<p>Constant-acceleration kinematics integrated in 0.01 s steps: v += a·dt, x += v·dt. The bumpers at 0 and 20 m stop the cart. Billiard balls roll at constant velocity with no friction and pass in separate lanes rather than colliding. In Match the graph the walker’s velocity is whatever the slider says, so velocity can change instantly (real walkers need a moment to speed up). Graphs record every 0.05 s.</p>',
  challenges:[
    {lvl:'bio',baseline:{mode:'explore',x0:2,v0:2,a:0},watch:'a',reveal:3,q:'The cart rolls at a steady 2 m/s. What will the acceleration graph show?',choices:['A flat line at zero','A flat line at 2 m/s²','A line that climbs'],correct:0,explain:'Acceleration measures how fast velocity changes. The velocity stays 2 m/s, so the acceleration is zero the whole time.'},
    {lvl:'bio',baseline:{mode:'explore',x0:0,v0:3,a:0},watch:'x',reveal:3,q:'Compared with a cart at 1.5 m/s, what will the position graph look like for a cart at 3 m/s?',choices:['A steeper straight line','A line that curves upward','The same slope, just higher'],correct:0,explain:'Faster means more metres every second, so the x–t line rises more steeply. It stays straight because the speed does not change.'},
    {lvl:'bio',baseline:{mode:'explore',x0:0,v0:0,a:1},watch:'x',reveal:4,q:'The cart starts at rest and speeds up steadily. What happens to the gaps between the motion-diagram dots?',choices:['They get wider','They stay equal','They get narrower'],correct:0,explain:'Each half second the cart is moving faster than the last, so it covers more distance: the dots spread out and the x–t graph curves upward.'},
    {lvl:'honors',baseline:{mode:'explore',x0:0,v0:0,a:1},watch:'x',reveal:4,q:'Starting from rest with a = 1 m/s², where will the cart be after 4 s?',choices:['4 m','8 m','16 m'],correct:1,explain:'x = ½at² = ½(1)(4²) = 8 m. Distance grows with t², not t.'},
    {lvl:'honors',baseline:{mode:'explore',x0:0,v0:0,a:1},watch:'v',reveal:3,q:'Velocity climbs from 0 to 3 m/s in 3 s. What is the area under the v–t graph, and what does it tell you?',choices:['4.5 m: the displacement','9 m: the displacement','1 m/s²: the acceleration'],correct:0,explain:'The area is a triangle: ½ × 3 s × 3 m/s = 4.5 m. Area under v–t is displacement; check the cart’s position readout.'},
    {lvl:'ap',baseline:{mode:'race',vA:1.5,vB:0.5,gap:4},watch:'x',reveal:6,q:'Ball A (1.5 m/s) starts 4 m behind ball B (0.5 m/s). When does A catch B?',choices:['t = 4 s','t = 2 s','t = 8 s','Never'],correct:0,explain:'x_A = 1.5t and x_B = 4 + 0.5t. Setting them equal: t = 4 / (1.5 − 0.5) = 4 s, at x = 6 m. On the x–t graph that is where the lines cross.'},
    {lvl:'ap',baseline:{mode:'explore',x0:2,v0:3,a:-1},watch:'v',reveal:5,q:'The cart starts at x = 2 m moving right at 3 m/s with a = −1 m/s². When and where does it turn around?',choices:['t = 3 s at x = 6.5 m','t = 3 s at x = 11 m','It never turns around'],correct:0,explain:'v = 3 − t = 0 at t = 3 s. Then x = 2 + 3(3) − ½(1)(3²) = 6.5 m. The x–t graph peaks there: zero slope means zero velocity.'},
    {lvl:'ap',instant:true,q:'x(t) = 2 + 3t − 0.5t² (metres, seconds). What are v(t) and a?',choices:['v = 3 − t, a = −1 m/s²','v = 3 − 0.5t, a = −0.5 m/s²','v = 2 + 3t, a = 3 m/s²'],correct:0,explain:'Differentiate: v = dx/dt = 3 − t, then a = dv/dt = −1 m/s². The ½ in ½at² is why the coefficient −0.5 means a = −1.'}
  ],
  onClick(sim,x,y){if(y<210)markNow(sim);},
  thumbSetup(sim){sim.p.a=0.5;sim.p.v0=0;sim.st=SIM.init(sim);},thumbFrames:80,
  draw(sim,ctx,vdt,k,t){const s=sim.st,p=sim.p,race=p.mode==='race',match=p.mode==='match',hon=atLeast('honors');k=Math.min(k,1.3);
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    // table / floor
    if(race){ctx.fillStyle='#2f7d55';rr(ctx,24,48,752,100,10);ctx.fill();ctx.strokeStyle='#6b4a2b';ctx.lineWidth=6;rr(ctx,24,48,752,100,10);ctx.stroke();}
    else{ctx.fillStyle=PAL['cv-bg2'];rr(ctx,24,48,752,100,10);ctx.fill();}
    const ty=136;ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(PX0,ty,PXW,6);
    // ruler
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;for(let m=0;m<=L;m++){const X=SX(m)+.5;ctx.beginPath();ctx.moveTo(X,ty+8);ctx.lineTo(X,ty+(m%5===0?20:14));ctx.stroke();if(m%2===0)txt(ctx,m+'',X,ty+33,{s:11*k,a:'center',c:PAL['cv-soft']});}
    txt(ctx,'m',SX(L)+12,ty+33,{s:11*k,c:PAL['cv-soft']});
    // bumpers
    if(!race){ctx.fillStyle=PAL['cv-ink'];ctx.fillRect(PX0-10,ty-26,8,32);ctx.fillRect(SX(L)+2,ty-26,8,32);}
    // motion-diagram dots
    if(p.strobe){const dy=ty+48;
      s.dots.forEach(d=>{ctx.fillStyle=CA;ctx.beginPath();ctx.arc(SX(d.x),dy+(race?0:6),4,0,6.29);ctx.fill();if(race){ctx.fillStyle=CB;ctx.beginPath();ctx.arc(SX(d.xb),dy+14,4,0,6.29);ctx.fill();}
        if(Math.abs(d.t-Math.round(d.t))<1e-6&&d.t>0&&d.t%2===0)txt(ctx,d.t+'s',SX(d.x),dy-6+(race?0:6),{s:9*k,a:'center',c:PAL['muted']});});}
    // objects
    if(race){[[s.xa,CA,'A',100],[s.xb,CB,'B',122]].forEach(([x,c,l,y])=>{const X=SX(x);ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(X+3,y+9,10,4,0,0,6.29);ctx.fill();
        const gr=ctx.createRadialGradient(X-4,y-4,2,X,y,11);gr.addColorStop(0,'#fff');gr.addColorStop(0.35,c);gr.addColorStop(1,c);ctx.fillStyle=gr;ctx.beginPath();ctx.arc(X,y,10,0,6.29);ctx.fill();txt(ctx,l,X,y+1,{s:10,w:700,c:'#fff',a:'center',b:'middle'});});
      if(s.meet){const X=SX(s.meet.x);ctx.strokeStyle='#ffd23f';ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(X,56);ctx.lineTo(X,140);ctx.stroke();ctx.setLineDash([]);pill(ctx,'Meet: '+s.meet.t.toFixed(2)+' s',clamp(X,90,710),62,'#ffd23f','#222',11*k);}}
    else if(match){const X=SX(s.x);ctx.fillStyle=PAL['cv-ink'];rr(ctx,PX0-8,ty-44,22,22,4);ctx.fill();txt(ctx,'detector',PX0-8,ty-50,{s:10*k,c:PAL['cv-soft']});
      ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;const ph=(sim.t*4)%1;for(let i=0;i<3;i++){const r=14+((i+ph)/3)*Math.max(10,X-PX0-20);ctx.globalAlpha=1-(i+ph)/3;ctx.beginPath();ctx.arc(PX0+14,ty-33,r,-0.35,0.35);ctx.stroke();}ctx.globalAlpha=1;
      const sw=Math.sin(sim.t*8)*(Math.abs(s.v)>0.05?1:0);ctx.strokeStyle=CA;ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.arc(X,ty-66,7,0,6.29);ctx.stroke();ctx.beginPath();ctx.moveTo(X,ty-58);ctx.lineTo(X,ty-30);ctx.moveTo(X,ty-30);ctx.lineTo(X-8*sw,ty-4);ctx.moveTo(X,ty-30);ctx.lineTo(X+8*sw,ty-4);ctx.moveTo(X,ty-50);ctx.lineTo(X+10,ty-38);ctx.moveTo(X,ty-50);ctx.lineTo(X-10,ty-38);ctx.stroke();ctx.lineCap='butt';
      if(p.tgt==='x'){const g=tgtAt(s.T,Math.min(sim.t,DUR));ctx.strokeStyle=CT;ctx.setLineDash([3,3]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(SX(g.x),ty-80);ctx.lineTo(SX(g.x),ty);ctx.stroke();ctx.setLineDash([]);txt(ctx,'target',SX(g.x),ty-84,{s:10*k,a:'center',c:CT});}
      const left=Math.max(0,DUR-sim.t);pill(ctx,left>0?left.toFixed(1)+' s left':'Done',700,64,left>0?CA:PAL['s3'],'#fff',12*k);}
    else{const X=SX(s.x);ctx.fillStyle=CA;rr(ctx,X-26,ty-30,52,22,5);ctx.fill();ctx.fillStyle=PAL['cv-ink'];[X-15,X+15].forEach(wx=>{ctx.beginPath();ctx.arc(wx,ty-6,6,0,6.29);ctx.fill();});
      ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(X,ty-30);ctx.lineTo(X,ty-8);ctx.stroke();
      const arrow=(v,c,y,lab)=>{if(Math.abs(v)<0.02)return;const len=v*28,x1=X+len;ctx.strokeStyle=c;ctx.fillStyle=c;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(X,y);ctx.lineTo(x1,y);ctx.stroke();const dir=Math.sign(len);ctx.beginPath();ctx.moveTo(x1+dir*7,y);ctx.lineTo(x1-dir*2,y-6);ctx.lineTo(x1-dir*2,y+6);ctx.closePath();ctx.fill();txt(ctx,lab,x1+dir*12,y+4,{s:11*k,w:700,c,a:dir>0?'left':'right'});};
      arrow(s.v,PAL['s2'],ty-44,'v');arrow(s.aEff*2,PAL['s3'],ty-60,'a');}
    // marks
    s.marks.forEach(m=>{const X=SX(m.x);ctx.strokeStyle=PAL['s4'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(X,ty+6);ctx.lineTo(X,ty-6-(race?20:40));ctx.stroke();ctx.fillStyle=PAL['s4'];ctx.beginPath();ctx.moveTo(X,ty-6-(race?20:40));ctx.lineTo(X+14,ty-(race?22:42));ctx.lineTo(X,ty-(race?18:38));ctx.fill();});
    // stopwatch
    ctx.fillStyle=PAL['card'];rr(ctx,30,8,150,32,8);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();txt(ctx,'⏱ '+Math.max(0,sim.t).toFixed(2)+' s',105,25,{s:15*k,w:700,a:'center',b:'middle',c:PAL['fg']});
    txt(ctx,MODES[p.mode].toUpperCase()+(p.strobe?'   ·   dots below the ruler: one every 0.5 s':''),196,25,{s:12*k,w:700,c:PAL['cv-soft'],b:'middle'});
    if(s.marks.length&&hon){let mx=40;txt(ctx,'Marks:',mx,64,{s:11*k,w:700,c:race?'#fff':PAL['cv-soft'],b:'middle'});mx+=46;s.marks.slice(-3).forEach(m=>{txt(ctx,m.t.toFixed(1)+' s, '+m.x.toFixed(1)+' m',mx,64,{s:11*k,c:race?'#fff':PAL['fg'],b:'middle'});mx+=104;});}
    // three live mini-graphs
    const tmax=Math.max(DUR,Math.ceil(sim.t)),H=s.h;
    const defs=[{key:'x',lab:'x (m)',min:0,max:20,title:'Position'},{key:'v',lab:'v (m/s)',min:-4,max:4,title:'Velocity'},{key:'a',lab:'a (m/s²)',min:-2,max:2,title:'Acceleration'}];
    PANELS.forEach((P,i)=>{const D=defs[i];ctx.fillStyle=PAL['card'];rr(ctx,P.x-46,P.y-26,P.w+60,P.h+56,10);ctx.fill();
      txt(ctx,D.title+' vs time',P.x-36,P.y-10,{s:12*k,w:700,c:PAL['fg']});
      const Xf=tt=>P.x+tt/tmax*P.w,Yf=v=>P.y+P.h-(clamp(v,D.min,D.max)-D.min)/(D.max-D.min)*P.h;
      ctx.strokeStyle=PAL['g-grid'];ctx.lineWidth=1;for(let j=0;j<=4;j++){const yy=P.y+j*P.h/4+.5;ctx.beginPath();ctx.moveTo(P.x,yy);ctx.lineTo(P.x+P.w,yy);ctx.stroke();const val=D.max-j*(D.max-D.min)/4;txt(ctx,(Math.round(val*10)/10)+'',P.x-5,yy,{s:10*k,a:'right',b:'middle',c:PAL['g-axis']});}
      if(D.min<0){ctx.strokeStyle=PAL['g-axis'];ctx.beginPath();ctx.moveTo(P.x,Yf(0));ctx.lineTo(P.x+P.w,Yf(0));ctx.stroke();}
      ctx.strokeStyle=PAL['g-axis'];ctx.beginPath();ctx.moveTo(P.x+.5,P.y);ctx.lineTo(P.x+.5,P.y+P.h);ctx.lineTo(P.x+P.w,P.y+P.h+.5);ctx.stroke();
      for(let tt=0;tt<=tmax;tt+=tmax>12?5:2)txt(ctx,tt+'',Xf(tt),P.y+P.h+12,{s:10*k,a:'center',c:PAL['g-axis']});
      txt(ctx,'t (s)',P.x+P.w,P.y+P.h+24,{s:10*k,a:'right',c:PAL['muted']});
      if(match&&(D.key===p.tgt||D.key==='a')){ctx.strokeStyle=CT;ctx.setLineDash([5,4]);ctx.lineWidth=2;ctx.beginPath();for(let tt=0;tt<=DUR+1e-9;tt+=0.1){const g=tgtAt(s.T,tt),val=D.key==='a'?0:g[D.key];tt?ctx.lineTo(Xf(tt),Yf(val)):ctx.moveTo(Xf(tt),Yf(val));}ctx.stroke();ctx.setLineDash([]);}
      const ser=(key,col)=>{if(H.length<1)return;ctx.strokeStyle=col;ctx.lineWidth=2.2;ctx.beginPath();H.forEach((r,j)=>{const X=Xf(r.t),Y=Yf(r[key]);j?ctx.lineTo(X,Y):ctx.moveTo(X,Y);});ctx.stroke();const r=H[H.length-1];ctx.fillStyle=col;ctx.beginPath();ctx.arc(Xf(r.t),Yf(r[key]),3.5,0,6.29);ctx.fill();};
      if(race){ser(D.key,CA);const kb={x:'xb',v:'vb',a:'a'}[D.key];if(D.key==='v'){ctx.strokeStyle=CB;ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(Xf(0),Yf(p.vB));ctx.lineTo(Xf(Math.max(0,sim.t)),Yf(p.vB));ctx.stroke();}else if(D.key==='x')ser('xb',CB);}
      else ser(D.key,CA);
      if(D.key==='x'&&race&&s.meet){ctx.strokeStyle=PAL['fg'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(Xf(s.meet.t),Yf(s.meet.x),6,0,6.29);ctx.stroke();}});
    if(match&&s.errN>0.2){pill(ctx,'Score '+Math.round(Math.max(0,100-25*s.err/s.errN)),720,25,PAL['s3'],'#fff',12*k);}
  }
};
BioLab.register(SIM);
})();
