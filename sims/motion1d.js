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
const PXM=PXW/L; // pixels per metre
/* A person drawn to scale (about 1.7 m tall). swing: leg swing for walking; lean: forward tilt (radians); skate: standing on a board. */
function person(ctx,X,base,col,swing,lean,skate){const h=1.7*PXM,head=h*0.1,hip=base-h*0.47,sh=base-h*0.8;ctx.save();ctx.translate(X,base);ctx.rotate(lean||0);ctx.translate(-X,-base);
  ctx.strokeStyle=col;ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();
  if(skate){ctx.moveTo(X-8,base);ctx.lineTo(X-3,hip+8);ctx.lineTo(X,hip);ctx.moveTo(X+8,base);ctx.lineTo(X+3,hip+8);ctx.lineTo(X,hip);}
  else{ctx.moveTo(X,hip);ctx.lineTo(X-9*swing,base);ctx.moveTo(X,hip);ctx.lineTo(X+9*swing,base);}
  ctx.moveTo(X,hip);ctx.lineTo(X,sh);
  if(skate){ctx.moveTo(X,sh+4);ctx.lineTo(X-15,sh+12);ctx.moveTo(X,sh+4);ctx.lineTo(X+15,sh+10);}else{ctx.moveTo(X,sh+4);ctx.lineTo(X-8*swing,hip-4);ctx.moveTo(X,sh+4);ctx.lineTo(X+8*swing,hip-4);}
  ctx.stroke();ctx.beginPath();ctx.arc(X,sh-head,head,0,6.29);ctx.stroke();ctx.restore();ctx.lineCap='butt';}
/* A skateboard, 0.8 m long, to scale. */
function board(ctx,X,base){const w=0.8*PXM;ctx.fillStyle='#8a5a2b';rr(ctx,X-w/2,base-6,w,4,2);ctx.fill();ctx.fillStyle='#333';[X-w/2+5,X+w/2-5].forEach(wx=>{ctx.beginPath();ctx.arc(wx,base-1,2.6,0,6.29);ctx.fill();});}

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

function motionText(sim){const s=sim.st,v=s.v,a=s.aEff;if(s.hit!==null)return 'Stopped at the bumper';if(Math.abs(v)<0.05&&Math.abs(a)<1e-9)return 'At rest';if(Math.abs(a)<1e-9)return 'Moving at a steady velocity (a = 0)';
  if(Math.abs(v)<0.05)return 'Turning around: v = 0 for an instant, a ≠ 0';return v*a>0?'Speeding up: v and a have the same sign':'Slowing down: v and a have opposite signs';}
function state(sim){const s=sim.st;if(sim.p.mode==='race')return {x:s.xa,v:sim.p.vA,a:0};return {x:s.x,v:s.v,a:s.aEff};}
function record(sim){const s=sim.st,q=state(sim);s.h.push({t:sim.t,x:q.x,v:q.v,a:q.a,xb:s.xb,vb:sim.p.vB});if(s.h.length>3000)s.h.shift();}
function markNow(sim){const q=state(sim);sim.st.marks.push({t:sim.t,x:q.x});if(sim.st.marks.length>8)sim.st.marks.shift();}

const SIM={
  art:{SX,ty:136,P:PANELS,L,PXM},
  id:'motion1d',hash:'motion1d',apUnit:1,order:1,tab:'Motion in one dimension',kind:'Simulation',next:['freefall','linearize'],
  card:'A skateboarder, two racing billiard balls and a walker you steer, with live position, velocity and acceleration graphs and a motion diagram.',
  title:'Motion in one dimension',
  lede:{bio:'Watch a skateboarder roll along a track while three graphs draw themselves. Learn to read where it is, how fast it goes and whether it is speeding up.',
        honors:'Connect the motion diagram, the x–t graph and the v–t graph: slope of x–t is velocity, area under v–t is displacement.',
        ap:'Model constant-acceleration motion with x = x₀ + v₀t + ½at², solve for meeting times, and treat velocity as the derivative of position.'},
  scale:'Drawn to scale: a 20 m track, marked every metre, with a 1.7 m skateboarder on a 0.8 m board. Speeds up to 4 m/s, about a fast walk. The dots are 0.5 s apart.',
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
    return {x,xStart:x,v:p.mode==='match'?0:p.v0,aEff:p.mode==='explore'?p.a:0,xa:0,xb:p.gap,meet:null,hit:null,h:[],dots:[],marks:[],T,err:0,errN:0,lastRec:-1,lastDot:-1,dist:0};},
  step(sim,dt){const s=sim.st,p=sim.p,t=sim.t;
    if(p.mode==='explore'){if(s.hit===null){s.aEff=p.a;const x1=s.x;s.v+=p.a*dt;s.x+=s.v*dt;s.dist+=Math.abs(clamp(s.x,0,L)-x1);if(s.x<=0||s.x>=L){s.x=clamp(s.x,0,L);s.v=0;s.aEff=0;s.hit=t+dt;}}}
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
    {id:'disp',label:'Displacement since start',unit:'m',min:-20,max:20,d:2,mode:['explore'],get:s=>s.st.x-s.st.xStart},
    {id:'dist',label:'Distance traveled',unit:'m',min:0,max:40,d:2,mode:['explore'],get:s=>s.st.dist},
    {id:'motion',label:'The skateboarder is',unit:'',text:true,mode:['explore'],noTrial:true,get:s=>motionText(s)}
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
    if(s.hit!==null)return 'The skateboarder hit the '+(s.x<=0?'left':'right')+' bumper at t = '+s.hit.toFixed(2)+' s and stopped. Press <b>Reset</b> to run it again.';
    const v=s.v,a=s.aEff;let how;if(Math.abs(a)<1e-9)how=Math.abs(v)<1e-9?'is at rest':'moves at a steady '+Math.abs(v).toFixed(2)+' m/s to the '+(v>0?'right':'left')+': equal spacing between dots, zero acceleration';
    else if(Math.abs(v)<0.05)how='is momentarily at rest and about to move '+(a>0?'right':'left');else how=(v*a>0?'is speeding up':'is slowing down')+' while moving '+(v>0?'right':'left')+(v*a>0?': the dots spread out':': the dots bunch together');
    return 'The skateboarder '+how+'.'+(ap?' x(t) = '+fmtNum(p.x0,1)+' + ('+fmtNum(p.v0,1)+')t + ½('+fmtNum(p.a,1)+')t², so v = dx/dt = '+fmtNum(p.v0,1)+' + ('+fmtNum(p.a,1)+')t.':hon?' Slope of x–t = velocity; slope of v–t = acceleration.':'');},
  tour:[
    {title:'The track',text:'A skateboarder on a 20 m track. The ruler is marked every metre. Position x is measured from the left end.',focus:[20,30,770,150],pause:true,setup(sim){BioLab.setValues(sim,{mode:'explore',x0:2,v0:1.5,a:0});BioLab.reset(sim);}},
    {title:'Motion diagram',text:'Every half second the skateboarder leaves a dot. Equal spacing means steady speed.',focus:[20,150,770,52],speed:1},
    {title:'Position vs time',text:{bio:'This graph plots where the skateboarder is at each moment. A steady speed makes a straight, sloped line.',honors:'Slope of x–t = Δx/Δt = velocity. Steeper means faster; downward means moving left.'},focus:[20,212,256,206],speed:1},
    {title:'Velocity vs time',text:{bio:'Velocity stays the same, so this line is flat.',honors:'Flat line at 1.5 m/s. The area under it, velocity × time, is the displacement.'},focus:[280,212,256,206],pause:true},
    {title:'Acceleration vs time',text:'No speeding up or slowing down: acceleration is zero.',focus:[540,212,256,206],pause:true},
    {title:'Now add acceleration',text:{bio:'With a = 0.5 m/s² the dots spread apart, the x–t line curves upward and the v–t line slopes up.',honors:'v = v₀ + at climbs steadily; x = x₀ + v₀t + ½at² is a parabola.'},focus:[20,30,770,390],speed:1,setup(sim){BioLab.setValues(sim,{a:0.5,v0:0});BioLab.reset(sim);}},
    {title:'Negative acceleration, speeding up',text:{bio:'Now the skateboarder starts at 18 m moving left (v₀ = −1 m/s) with a = −0.5 m/s². Both are negative, so it speeds up to the left. A negative acceleration does not always mean slowing down: compare the signs of v and a.',honors:'v and a are both negative, so |v| grows: speeding up. The x–t curve bends downward and gets steeper; the v–t line slopes down from −1 m/s.'},focus:[20,30,770,390],speed:1,setup(sim){BioLab.setValues(sim,{x0:18,v0:-1,a:-0.5});BioLab.reset(sim);}},
    {title:'Billiard race',text:'Ball A rolls faster but starts behind. Where the x–t lines cross, the balls are side by side.',focus:[20,30,770,390],speed:1.5,setup(sim){BioLab.setValues(sim,{mode:'race',vA:1.5,vB:0.5,gap:4});}},
    {title:'Match the graph',text:'Your turn: steer a walker in front of a motion detector so your graph traces the dashed target.',focus:[20,30,770,390],pause:true,setup(sim){BioLab.setValues(sim,{mode:'match',tgt:'x'});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'explore',x0:2,v0:1.5,a:0});BioLab.reset(sim);},
  onLevel(sim){applyMode(sim);},
  lab:{bio:'<p><b>Question:</b> How does a skateboarder’s speed show up on each graph?</p><ol><li>Run the skateboarder at 1 m/s, then at 3 m/s. Sketch both x–t graphs.</li><li>Set a = 0.5 m/s² and v₀ = 0. Describe the dots and the x–t shape.</li><li>Play Match the graph three times and record your best score.</li></ol>',
       honors:'<p><b>Question:</b> Does the area under v–t equal the displacement?</p><ol><li>Choose v₀ and a, run for 4 s, and record the shaded area.</li><li>Use Mark position at t = 0 and t = 4 s to measure the actual displacement.</li><li>Repeat with a negative acceleration so the skateboarder turns around.</li></ol>',
       ap:'<p><b>Question:</b> When and where do two objects meet?</p><ol><li>In Billiard race, write x_A(t) and x_B(t) and solve x_A = x_B.</li><li>Test three combinations of speeds and head starts; compare prediction with the meeting readout.</li><li>For the skateboarder, derive v(t) from x(t) and check the turnaround time v = 0.</li></ol>'},
  terms:[{t:'Position',d:'Where an object is, measured from a chosen origin (here, the left end).'},{t:'Velocity',d:'How fast and in which direction position changes. Negative means moving left.'},{t:'Acceleration',d:'How fast velocity changes. Zero acceleration means steady velocity.'},{t:'Distance vs. displacement',d:'Distance is the total path length, always positive. Displacement is final position minus starting position, and can be negative or zero.'},{t:'Speeding up or slowing down',d:'Speeding up when v and a have the same sign; slowing down when they have opposite signs.'},{t:'Motion diagram',d:'Dots showing the object’s position at equal time intervals.'},
    {lvl:'honors',t:'Displacement',d:'Change in position, Δx = x_final − x_initial. Equals the area under the v–t graph.'},{lvl:'honors',t:'Slope',d:'On an x–t graph the slope is velocity; on a v–t graph it is acceleration.'},
    {lvl:'ap',t:'Derivative',d:'v = dx/dt and a = dv/dt: the instantaneous slopes.'},{lvl:'ap',t:'Integral',d:'Δx = ∫v dt: the signed area under the v–t curve.'}],
  about:'<p>Constant-acceleration kinematics integrated in 0.01 s steps: v += a·dt, x += v·dt. The bumpers at 0 and 20 m stop the skateboarder. Billiard balls roll at constant velocity with no friction and pass in separate lanes rather than colliding. In Match the graph the walker’s velocity is whatever the slider says, so velocity can change instantly (real walkers need a moment to speed up). Graphs record every 0.05 s.</p>',
  challenges:[
    {lvl:'bio',baseline:{mode:'explore',x0:2,v0:2,a:0},watch:'a',reveal:3,q:'The skateboarder rolls at a steady 2 m/s. What will the acceleration graph show?',choices:['A flat line at zero','A flat line at 2 m/s²','A line that climbs'],correct:0,explain:'Acceleration measures how fast velocity changes. The velocity stays 2 m/s, so the acceleration is zero the whole time.'},
    {lvl:'bio',baseline:{mode:'explore',x0:0,v0:3,a:0},watch:'x',reveal:3,q:'Compared with a skateboarder at 1.5 m/s, what will the position graph look like for a skateboarder at 3 m/s?',choices:['A steeper straight line','A line that curves upward','The same slope, just higher'],correct:0,explain:'Faster means more metres every second, so the x–t line rises more steeply. It stays straight because the speed does not change.'},
    {lvl:'bio',baseline:{mode:'explore',x0:0,v0:0,a:1},watch:'x',reveal:4,q:'The skateboarder starts at rest and speeds up steadily. What happens to the gaps between the motion-diagram dots?',choices:['They get wider','They stay equal','They get narrower'],correct:0,explain:'Each half second the skateboarder is moving faster than the last, so it covers more distance: the dots spread out and the x–t graph curves upward.'},
    {lvl:'bio',baseline:{mode:'explore',x0:19,v0:-2,a:-1},watch:'v',reveal:2,q:'The skateboarder moves left at 2 m/s (v₀ = −2 m/s), and its acceleration is −1 m/s². Is it speeding up or slowing down?',choices:['Slowing down, because the acceleration is negative','Speeding up, because v and a point the same way','Neither: it moves at a steady speed'],correct:1,explain:'Negative only means “toward the left.” Velocity and acceleration both point left, so the skateboarder gets faster: after 2 s its velocity is −4 m/s. An object slows down only when v and a point opposite ways.'},
    {lvl:'bio',baseline:{mode:'explore',x0:4,v0:2,a:-1},watch:'x',reveal:4,q:'The skateboarder starts at 4 m moving right at 2 m/s with a = −1 m/s². After 4 s, what are its displacement and the distance it traveled?',choices:['Displacement 0 m, distance 4 m','Displacement 4 m, distance 4 m','Displacement 0 m, distance 0 m'],correct:0,explain:'It rolls right for 2 s, reaching 6 m, then turns around and rolls back to 4 m. Distance counts every metre of the trip: 2 + 2 = 4 m. Displacement is only final minus start: 4 − 4 = 0 m.'},
    {lvl:'honors',baseline:{mode:'explore',x0:0,v0:0,a:1},watch:'x',reveal:4,q:'Starting from rest with a = 1 m/s², where will the skateboarder be after 4 s?',choices:['4 m','8 m','16 m'],correct:1,explain:'x = ½at² = ½(1)(4²) = 8 m. Distance grows with t², not t.'},
    {lvl:'honors',baseline:{mode:'explore',x0:0,v0:0,a:1},watch:'v',reveal:3,q:'Velocity climbs from 0 to 3 m/s in 3 s. What is the area under the v–t graph, and what does it tell you?',choices:['4.5 m: the displacement','9 m: the displacement','1 m/s²: the acceleration'],correct:0,explain:'The area is a triangle: ½ × 3 s × 3 m/s = 4.5 m. Area under v–t is displacement; check the skateboarder’s position readout.'},
    {lvl:'ap',baseline:{mode:'race',vA:1.5,vB:0.5,gap:4},watch:'x',reveal:6,q:'Ball A (1.5 m/s) starts 4 m behind ball B (0.5 m/s). When does A catch B?',choices:['t = 4 s','t = 2 s','t = 8 s','Never'],correct:0,explain:'x_A = 1.5t and x_B = 4 + 0.5t. Setting them equal: t = 4 / (1.5 − 0.5) = 4 s, at x = 6 m. On the x–t graph that is where the lines cross.'},
    {lvl:'ap',baseline:{mode:'explore',x0:2,v0:3,a:-1},watch:'v',reveal:5,q:'The skateboarder starts at x = 2 m moving right at 3 m/s with a = −1 m/s². When and where does it turn around?',choices:['t = 3 s at x = 6.5 m','t = 3 s at x = 11 m','It never turns around'],correct:0,explain:'v = 3 − t = 0 at t = 3 s. Then x = 2 + 3(3) − ½(1)(3²) = 6.5 m. The x–t graph peaks there: zero slope means zero velocity.'},
    {lvl:'ap',instant:true,q:'x(t) = 2 + 3t − 0.5t² (metres, seconds). What are v(t) and a?',choices:['v = 3 − t, a = −1 m/s²','v = 3 − 0.5t, a = −0.5 m/s²','v = 2 + 3t, a = 3 m/s²'],correct:0,explain:'Differentiate: v = dx/dt = 3 − t, then a = dv/dt = −1 m/s². The ½ in ½at² is why the coefficient −0.5 means a = −1.'}
  ],
  onClick(sim,x,y){if(y<210)markNow(sim);},
  thumbSetup(sim){sim.p.a=0.5;sim.p.v0=0;sim.st=SIM.init(sim);},thumbFrames:80,
  draw(sim,ctx,vdt,k,t){const s=sim.st,p=sim.p,race=p.mode==='race',match=p.mode==='match',hon=atLeast('honors');k=Math.min(k,1.3);
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    // table / floor
    const walk=race&&sim.lnKey==='race';
    if(race&&!walk){ctx.fillStyle='#2f7d55';rr(ctx,24,48,752,100,10);ctx.fill();ctx.strokeStyle='#6b4a2b';ctx.lineWidth=6;rr(ctx,24,48,752,100,10);ctx.stroke();}
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
    if(walk){[[s.xb,CB,'Friend',p.vB],[s.xa,CA,'You',p.vA]].forEach(([x,c,l,v])=>{const X=SX(x),sw=x<L&&!RM?Math.sin(sim.t*v*5):0;person(ctx,X,ty,c,sw,0,false);txt(ctx,l,X,ty-74,{s:12*k,w:700,a:'center',c});});
      if(s.meet){const X=SX(s.meet.x);pill(ctx,'Side by side: '+s.meet.t.toFixed(2)+' s',clamp(X,90,710),62,'#ffd23f','#222',11*k);}}
    else if(race){[[s.xa,CA,'A',100],[s.xb,CB,'B',122]].forEach(([x,c,l,y])=>{const X=SX(x);ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(X+3,y+9,10,4,0,0,6.29);ctx.fill();
        const gr=ctx.createRadialGradient(X-4,y-4,2,X,y,11);gr.addColorStop(0,'#fff');gr.addColorStop(0.35,c);gr.addColorStop(1,c);ctx.fillStyle=gr;ctx.beginPath();ctx.arc(X,y,10,0,6.29);ctx.fill();txt(ctx,l,X,y+1,{s:10,w:700,c:'#fff',a:'center',b:'middle'});});
      if(s.meet){const X=SX(s.meet.x);ctx.strokeStyle='#ffd23f';ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(X,56);ctx.lineTo(X,140);ctx.stroke();ctx.setLineDash([]);pill(ctx,'Meet: '+s.meet.t.toFixed(2)+' s',clamp(X,90,710),62,'#ffd23f','#222',11*k);}}
    else if(match){const X=SX(s.x);ctx.fillStyle=PAL['cv-ink'];rr(ctx,PX0-8,ty-44,22,22,4);ctx.fill();txt(ctx,'detector',PX0-8,ty-50,{s:10*k,c:PAL['cv-soft']});
      ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;const ph=(sim.t*4)%1;for(let i=0;i<3;i++){const r=14+((i+ph)/3)*Math.max(10,X-PX0-20);ctx.globalAlpha=1-(i+ph)/3;ctx.beginPath();ctx.arc(PX0+14,ty-33,r,-0.35,0.35);ctx.stroke();}ctx.globalAlpha=1;
      const sw=Math.sin(sim.t*8)*(Math.abs(s.v)>0.05?1:0);ctx.strokeStyle=CA;ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.arc(X,ty-66,7,0,6.29);ctx.stroke();ctx.beginPath();ctx.moveTo(X,ty-58);ctx.lineTo(X,ty-30);ctx.moveTo(X,ty-30);ctx.lineTo(X-8*sw,ty-4);ctx.moveTo(X,ty-30);ctx.lineTo(X+8*sw,ty-4);ctx.moveTo(X,ty-50);ctx.lineTo(X+10,ty-38);ctx.moveTo(X,ty-50);ctx.lineTo(X-10,ty-38);ctx.stroke();ctx.lineCap='butt';
      if(p.tgt==='x'){const g=tgtAt(s.T,Math.min(sim.t,DUR));ctx.strokeStyle=CT;ctx.setLineDash([3,3]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(SX(g.x),ty-80);ctx.lineTo(SX(g.x),ty);ctx.stroke();ctx.setLineDash([]);txt(ctx,'target',SX(g.x),ty-84,{s:10*k,a:'center',c:CT});}
      const left=Math.max(0,DUR-sim.t);pill(ctx,left>0?left.toFixed(1)+' s left':'Done',700,64,left>0?CA:PAL['s3'],'#fff',12*k);}
    else{const X=SX(s.x);board(ctx,X,ty);person(ctx,X,ty-6,CA,0,clamp(s.aEff*0.12,-0.25,0.25),true);
      const arrow=(v,c,y,lab)=>{if(Math.abs(v)<0.02)return;const len=v*28,x1=X+len;ctx.strokeStyle=c;ctx.fillStyle=c;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(X,y);ctx.lineTo(x1,y);ctx.stroke();const dir=Math.sign(len);ctx.beginPath();ctx.moveTo(x1+dir*7,y);ctx.lineTo(x1-dir*2,y-6);ctx.lineTo(x1-dir*2,y+6);ctx.closePath();ctx.fill();txt(ctx,lab,x1+dir*12,y+4,{s:11*k,w:700,c,a:dir>0?'left':'right'});};
      arrow(s.v,PAL['s2'],ty-80,'v');arrow(s.aEff*2,PAL['s3'],ty-94,'a');}
    // marks
    s.marks.forEach(m=>{const X=SX(m.x);ctx.strokeStyle=PAL['s4'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(X,ty+6);ctx.lineTo(X,ty-6-(race?20:40));ctx.stroke();ctx.fillStyle=PAL['s4'];ctx.beginPath();ctx.moveTo(X,ty-6-(race?20:40));ctx.lineTo(X+14,ty-(race?22:42));ctx.lineTo(X,ty-(race?18:38));ctx.fill();});
    // stopwatch
    ctx.fillStyle=PAL['card'];rr(ctx,30,8,150,32,8);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();txt(ctx,'⏱ '+Math.max(0,sim.t).toFixed(2)+' s',105,25,{s:15*k,w:700,a:'center',b:'middle',c:PAL['fg']});
    txt(ctx,(walk?'CATCH-UP: YOU AND A FRIEND':MODES[p.mode].toUpperCase())+(p.strobe?'   ·   dots below the ruler: one every 0.5 s':''),196,25,{s:12*k,w:700,c:PAL['cv-soft'],b:'middle'});
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
/* ---------- Virtual labs (Mr. Colella, Physics Unit 1): Motion Match Parts 1 and 2, Carts on Ramps ----------
   Motion Match: a walker in front of a motion detector (0.3 to 4.2 m). The student steers the walking velocity live
   for 10 s to trace a target graph. Score = 100 − 50 × (mean position error, m) or 100 − 100 × (mean velocity error, m/s).
   Carts on Ramps: a dynamics cart on a 1.2 m track tilted 1.0°, 2.0° or 3.5° (12 twists, 24 twists, all the way).
   Down the ramp a = g sinθ − 0.03 m/s²; up the ramp the cart slows at g sinθ + 0.03 m/s² (rolling friction opposes motion).
   The detector at the top is zeroed at the cart's release point and samples at 20 Hz with about 1 mm of noise;
   velocity is the detector's central difference, as in Graphical Analysis. */
const RB=window.RJBench;
const MM_X=[t=>0.4+0.2*t,t=>3.6-0.2*t,t=>0.5+2.8*Math.sin(Math.PI*t/10),t=>0.4+0.003*t*t*t,
  t=>t<3?1.5+0.5*t:t<5?3.0:3.0-0.5*(t-5),t=>t<3?3.0-0.8*t:0.6+(1.8/7)*(t-3)];
const MM_V=[()=>0.5,t=>0.08*t,t=>-0.06*t,t=>0.6-0.12*t,t=>0.0008*t*t*t];
const MM_LO=0.3,MM_HI=4.2,HX=m=>70+m/4.4*690;
const mmPart=sim=>sim.vlab&&sim.vlab.lab.id==='motion-match-2'?2:1;
const mmG=sim=>mmPart(sim)===2?sim.p.mmg2:sim.p.mmg1;
const mmTarget=(part,g)=>part===2?MM_V[g-1]:MM_X[g-1];
function mmRec(sim){const R=RB.rec(sim);if(!R.mm)R.mm={};const k='p'+mmPart(sim);if(!R.mm[k])R.mm[k]={};return R.mm[k];}
function mmScore(part,tr){if(!tr.length)return 0;const f=mmTarget(part.p,part.g);let e=0;tr.forEach(q=>{e+=Math.abs((part.p===2?q.v:q.x)-f(q.t));});e/=tr.length;
  return Math.max(0,Math.round(part.p===2?100-100*e:100-50*e));}
const MMB={
  init(sim){return {x:sim.p.mmx,v:0,t:0,run:false,done:false,tr:[],score:null};},
  step(sim,dt){const b=sim.st.B;if(!b.run){b.x=sim.p.mmx;b.v=0;return;}
    b.t+=dt;let v=sim.p.mmv;const x1=clamp(b.x+v*dt,MM_LO,MM_HI);if(x1!==b.x+v*dt)v=(x1-b.x)/dt;b.x=x1;b.v=v;
    if(!b.tr.length||b.t-b.tr[b.tr.length-1].t>=0.05-1e-9)b.tr.push({t:Math.min(10,Math.round(b.t*100)/100),x:b.x,v:b.v});
    if(b.t>=10-1e-6){b.run=false;b.done=true;const part={p:mmPart(sim),g:mmG(sim)};b.score=mmScore(part,b.tr);
      const R=mmRec(sim),k='g'+part.g;if(!R[k])R[k]={best:0,scores:[],tr:null};R[k].scores.push(b.score);if(R[k].scores.length>30)R[k].scores.shift();
      if(b.score>=R[k].best||!R[k].tr){R[k].best=Math.max(R[k].best,b.score);R[k].tr=b.tr.filter((q,i)=>i%5===0).map(q=>[q.t,RB.r3(q.x),RB.r3(q.v)]);}
      if(sim.vlab)BioLab.vlab.save(sim);}},
  draw(sim,ctx,vdt,k,t){const b=sim.st.B,p=mmPart(sim),g=mmG(sim),K=Math.min(k,1.3),R=mmRec(sim)['g'+g];
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);ctx.fillStyle=PAL['cv-bg2'];rr(ctx,24,22,752,132,10);ctx.fill();
    const fy=128;ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(HX(0)-6,fy,HX(4.4)-HX(0)+6,5);
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;for(let m=0;m<=44;m++){const X=HX(m/10)+.5;ctx.beginPath();ctx.moveTo(X,fy+5);ctx.lineTo(X,fy+(m%5===0?14:9));ctx.stroke();if(m%10===0)txt(ctx,(m/10)+' m',X,fy+25,{s:12*K,a:'center',c:PAL['cv-soft']});}
    // detector on its stand, with its ultrasound pulses
    ctx.fillStyle=PAL['cv-ink'];ctx.fillRect(HX(0)-26,fy-50,8,50);rr(ctx,HX(0)-34,fy-74,26,26,4);ctx.fill();txt(ctx,'motion detector',HX(0)-36,fy-80,{s:12*K,c:PAL['cv-soft']});
    const X=HX(b.x);if(b.run){ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;const ph=(t*3)%1;for(let i=0;i<3;i++){const r=12+((i+ph)/3)*Math.max(10,X-HX(0)-6);ctx.globalAlpha=1-(i+ph)/3;ctx.beginPath();ctx.arc(HX(0)-8,fy-61,r,-0.3,0.3);ctx.stroke();}ctx.globalAlpha=1;}
    const sw=b.run&&Math.abs(b.v)>0.03?Math.sin(t*9):0;ctx.strokeStyle='#3f6fb0';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.arc(X,fy-64,7,0,6.29);ctx.stroke();
    ctx.beginPath();ctx.moveTo(X,fy-56);ctx.lineTo(X,fy-28);ctx.moveTo(X,fy-28);ctx.lineTo(X-8*sw,fy-2);ctx.moveTo(X,fy-28);ctx.lineTo(X+8*sw,fy-2);ctx.moveTo(X,fy-48);ctx.lineTo(X+10,fy-36);ctx.moveTo(X,fy-48);ctx.lineTo(X-10,fy-36);ctx.stroke();ctx.lineCap='butt';
    // status
    const n=p===2?5:6;txt(ctx,'Part '+(p===2?'II: velocity':'I: position')+' · Graph '+g+' of '+n,760,42,{s:13*K,w:700,a:'right',c:PAL['fg']});
    const st=b.run?'Recording: '+Math.max(0,10-b.t).toFixed(1)+' s left':b.done?'Score '+b.score+' / 100'+(R?' · best '+R.best:''):R?'Best score so far: '+R.best:'Not tried yet';
    txt(ctx,st,756,200,{s:13*K,w:700,a:'right',c:b.run?'#d9573b':PAL['fg']});
    // the graph (Graphical Analysis style)
    RB.panel(ctx,24,164,752,278);const xmode=p===1,ymin=xmode?0:-1.2,ymax=xmode?4.5:1.2;
    const ax=axes(ctx,{L:90,T:182,W:664,H:212,cw:800,ch:450},{xmin:0,xmax:10,ymin,ymax,xl:'Time (s)',yl:xmode?'Position (m)':'Velocity (m/s)'});
    const f=mmTarget(p,g),tg=[];for(let q=0;q<=10.001;q+=0.05)tg.push({t:q,y:f(q)});RB.trace(ctx,ax,tg,PAL['cv-soft'],{dash:[7,5],w:2.5,ymin,ymax});
    if(R&&R.tr)RB.trace(ctx,ax,R.tr.map(a=>({t:a[0],y:xmode?a[1]:a[2]})),'#3f6fb0',{a:0.28,w:2.2,ymin,ymax});
    if(b.tr.length)RB.trace(ctx,ax,b.tr.map(q=>({t:q.t,y:xmode?q.x:q.v})),'#3f6fb0',{w:2.8,ymin,ymax});
    const lx=100,ly=196;ctx.setLineDash([7,5]);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(lx,ly);ctx.lineTo(lx+26,ly);ctx.stroke();ctx.setLineDash([]);txt(ctx,'target',lx+32,ly+4,{s:12*K,c:PAL['cv-soft']});
    ctx.strokeStyle='#3f6fb0';ctx.lineWidth=2.8;ctx.beginPath();ctx.moveTo(lx+96,ly);ctx.lineTo(lx+122,ly);ctx.stroke();txt(ctx,'this run',lx+128,ly+4,{s:12*K,c:PAL['fg']});
    if(R&&R.tr){ctx.globalAlpha=0.35;ctx.beginPath();ctx.moveTo(lx+204,ly);ctx.lineTo(lx+230,ly);ctx.stroke();ctx.globalAlpha=1;txt(ctx,'your best',lx+236,ly+4,{s:12*K,c:PAL['fg']});}},
  narrate(sim){const b=sim.st.B,p=mmPart(sim);
    if(b.run)return 'Recording. Drag <b>Walking velocity</b> to steer: positive walks away from the detector, negative walks toward it, zero stands still.';
    if(b.done)return 'This run scored <b>'+b.score+'</b>. Try again as often as you like; the bench keeps your best score for each graph.';
    return 'Choose a graph, set <b>Stand at</b> to where you want to start, then press <b>Start recording</b>. '+(p===1?'The detector measures how far you are from it.':'The detector works out your velocity from how fast your distance changes.');},
  onClick(sim,x,y){},
  read(sim){const b=sim.st.B;return {x:b.x,v:b.v,t:b.t,run:b.run,score:b.score};}};
function mmGo(sim){const b=RB.B(sim);if(!b||!b._lab||b._lab.indexOf('motion-match')!==0)return;b.run=true;b.done=false;b.t=0;b.x=sim.p.mmx;b.tr=[{t:0,x:b.x,v:sim.p.mmv}];b.score=null;BioLab.play(sim);}
const mmScoreCheck=(sim,rv,v)=>{const R=mmRec(sim)['g'+rv];if(!R||!R.scores.length)return 'Run graph '+rv+' on the bench first, then record your best score.';
  return R.scores.some(s=>Math.abs(s-v)<=0.5)?(v<R.best-0.5?'You have a better score for this graph: '+R.best+'. Record your best.':null):'Your scores on graph '+rv+' so far: '+R.scores.slice(-5).join(', ')+'. Record your best one.';};
const mmRow=n=>Array.from({length:n},(_,i)=>i+1);
function mmLab(part){const n=part===2?5:6,P=part===2;
  return {id:'motion-match-'+part,title:'Motion Match Lab, Part '+(P?'2: velocity vs time graphs':'1: position vs time graphs'),course:'Physics',teachers:'Colella',level:'bio',
    source:{label:'Motion Match Lab, Part '+part+' (Canvas)',href:'https://rjhs.instructure.com/courses/16601/assignments/'+(P?'612350':'609674')},
    purpose:P?'<p>Use a motion detector to perform one-dimensional motion that matches a given velocity vs. time graph.</p>':'<p>Use a motion detector to perform one-dimensional motion that matches a given position vs. time graph.</p>',
    background:'<p>A motion detector sends out pulses of ultrasound and times how long each echo takes to come back. From the echo time it works out how far away you are, about 20 times every second, and graphs it.</p>'+
      (P?'<p>From those distances it also works out your <b>velocity</b>: how fast your distance changes, and in which direction. In this lab, walking <b>away</b> from the detector is a positive velocity and walking <b>toward</b> it is negative. The velocity measurement is sensitive: if your graph is a little bumpy but has the same general shape as the target, you have met the goal.</p>':'<p>Your <b>position</b> is your distance from the detector.</p>')+
      '<p><b>About the virtual bench.</b> You steer the walker with the <b>Walking velocity</b> slider while the detector records for 10 seconds. Drag the slider or use the arrow keys. The hallway runs from 0.3 m to 4.2 m from the detector. Each run gets a match score out of 100; try each graph as many times as you like, and the bench keeps your best score and draws your best run in light blue. In class you walk, so your velocity can’t change instantly; here the slider can.</p>'+
      '<p><b>Your teacher’s handout</b> asks for a description and a screenshot of each graph. Here you record your best score and your description. If your teacher wants screenshots too, take one of the bench graph after your best run.</p>',
    materials:['Motion detector and its graphing app (on the virtual bench)','A clear hallway, 4 m long','Your walking (the Walking velocity slider)'],
    setup(sim){},
    controls:[P?'mmg2':'mmg1','mmx','mmv','mm-go'],
    steps:[{title:'Try the detector',text:'<p>Set <b>Stand at</b> to about 1 m, press <b>Start recording</b>, then drag <b>Walking velocity</b> to walk away from the detector, stop, and walk back. Watch how your '+(P?'velocity':'position')+' graph responds.</p>',
        done:sim=>{const R=mmRec(sim);return Object.keys(R).some(k=>R[k].scores&&R[k].scores.length);},doneHint:'Make one recording first.'}].concat(mmRow(n).map(g=>({title:'Graph '+g,
        text:'<p>Choose <b>Graph '+g+'</b>. Decide where to stand, press <b>Start recording</b> and steer so your line follows the dashed target. Try it until you are happy with your match.</p><p>Record your best score for Graph '+g+' in the table, and write a short but accurate description of the motion that matches the graph: where you started, which way you walked, and whether you went at a steady speed, sped up, slowed down or stood still.</p>'+(!P&&g===6?'<p>This one is tricky! A sharp turn is hard to do. Do the best that you can.</p>':''),
        setup(sim){BioLab.setValues(sim,P?{mmg2:g}:{mmg1:g});},
        done:sim=>sim.vlab.raw('c:mm:score:'+(g-1)).trim()!==''&&sim.vlab.raw('c:mm:desc:'+(g-1)).trim()!=='',doneHint:'Record your best score and a description for Graph '+g+'.'})),
      [{title:'Post-lab questions',text:'<p>Answer the post-lab questions below the bench, then turn in your lab.</p>'}]),
    tables:[{id:'mm',title:'Your matches',cols:[{id:'g',label:'Graph',rows:mmRow(n),rowLabels:mmRow(n).map(g=>'Graph '+g)},
      {id:'score',label:'Best match score (out of 100)',input:'number',check:mmScoreCheck},{id:'desc',label:'Description of the motion',input:'text'}]}],
    questions:P?[{id:'q1',n:'1',q:'<p>What does a velocity vs. time graph with a positive slope indicate? What does a graph with a negative slope indicate?</p>'},
        {id:'q2',n:'2',q:'<p>Explain what type of motion is required for a velocity vs. time graph that is not linear.</p>'}]
      :[{id:'q1',n:'1',q:'<p>In this lab, no parts of the graphs included negative positions. Explain what such a graph would indicate in this activity.</p>'},
        {id:'q2',n:'2',q:'<p>What does a position vs. time graph with a positive slope indicate? What does a graph with a negative slope indicate?</p>'},
        {id:'q3',n:'3',q:'<p>Explain what type of motion is required for a position vs. time graph that is not linear.</p>'}]};}

/* Carts on Ramps */
const CR_ANG={r1:1.0,r2:2.0,r3:3.5},CR_DRAW={r1:5,r2:8,r3:12},CR_NAME={r1:'Ramp 1 (12 twists)',r2:'Ramp 2 (24 twists)',r3:'Ramp 3 (all the way)'},CR_F=0.03,CR_END=0.95,CR_DT=0.05;
const crKey=sim=>sim.p.crRamp+'|'+sim.p.crType;
function crRec(sim){const R=RB.rec(sim);if(!R.cr)R.cr={};return R.cr;}
function crModel(sim,ramp,type,n){const R=sim.vlab?sim.vlab.rng(1000+n):RB.rng(1000+n),Rs=sim.vlab?sim.vlab.rng(7):RB.rng(7);
  const th=CR_ANG[ramp]*(1+0.03*(2*Rs()-1))*Math.PI/180,gs=9.8*Math.sin(th),ad=gs-CR_F,au=gs+CR_F;
  let x0=0,v0=0;if(type==='up'){x0=0.92;v0=-Math.sqrt(2*au*0.80)*(1+0.04*(2*R()-1));}
  const tp=type==='up'?-v0/au:0,xp=type==='up'?x0+v0*tp+0.5*au*tp*tp:0;
  const X=tt=>type==='up'?(tt<tp?x0+v0*tt+0.5*au*tt*tt:xp+0.5*ad*(tt-tp)*(tt-tp)):0.5*ad*tt*tt;
  const T=type==='up'?tp+Math.sqrt(2*(CR_END-xp)/ad):Math.sqrt(2*CR_END/ad);
  const N=Math.floor(T/CR_DT),xs=[];for(let i=0;i<=N;i++)xs.push(RB.r3(X(i*CR_DT)+0.0008*RB.gauss(R)));
  const vs=xs.map((x,i)=>{const a=xs[Math.max(0,i-1)],c=xs[Math.min(N,i+1)],d=(Math.min(N,i+1)-Math.max(0,i-1))*CR_DT;return RB.r3((c-a)/d);});
  return {ramp,type,x:xs,v:vs,T,X,tp,ad,au};}
const CRB={
  init(sim){return {run:false,t:0,m:null,n:0};},
  step(sim,dt){const b=sim.st.B;if(!b.run)return;b.t+=dt;if(b.t>=b.m.T){b.run=false;b.t=b.m.T;const R=crRec(sim);R[b.m.ramp+'|'+b.m.type]={x:b.m.x,v:b.m.v};if(sim.vlab)BioLab.vlab.save(sim);}},
  draw(sim,ctx,vdt,k,t){const b=sim.st.B,K=Math.min(k,1.3),ramp=sim.p.crRamp,type=sim.p.crType,D=crRec(sim)[ramp+'|'+type];
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    const th=CR_DRAW[ramp]*Math.PI/180,x0=120,y0=70,Lp=560,ppm=Lp/1.2,cs=Math.cos(th),sn=Math.sin(th);const P=m=>[x0+(0.15+m)*ppm*cs,y0+(0.15+m)*ppm*sn];
    // track, legs, ruler
    ctx.save();ctx.translate(x0,y0);ctx.rotate(th);ctx.fillStyle='#9aa3ad';ctx.fillRect(0,0,Lp,8);ctx.fillStyle=PAL['cv-ink'];ctx.fillRect(Lp-8,-18,8,18);
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;for(let c=0;c<=110;c+=5){const xx=(0.15+c/100)*ppm;if(xx>Lp)break;ctx.beginPath();ctx.moveTo(xx,8);ctx.lineTo(xx,c%10===0?18:13);ctx.stroke();if(c%20===0)txt(ctx,(c/100).toFixed(1),xx,30,{s:11*K,a:'center',c:PAL['cv-soft']});}ctx.restore();
    ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=4;const gY=y0+Lp*sn+30,leg=m=>{const q=P(m);ctx.beginPath();ctx.moveTo(q[0],q[1]+8);ctx.lineTo(q[0],gY);ctx.stroke();};leg(-0.1);leg(0.98);
    ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(60,gY,700,5);
    // detector at the top
    ctx.save();ctx.translate(x0,y0);ctx.rotate(th);ctx.fillStyle=PAL['cv-ink'];rr(ctx,-6,-34,30,30,4);ctx.fill();ctx.restore();txt(ctx,'detector (zero at the release point)',x0-10,y0-46,{s:12*K,c:PAL['cv-soft']});
    // the cart
    let xm=0;if(b.run||b.m)xm=b.m.X(Math.min(b.t,b.m.T));else if(type==='up')xm=0.92;
    ctx.save();const q=P(xm);ctx.translate(q[0],q[1]);ctx.rotate(th);ctx.fillStyle='#3f6fb0';rr(ctx,-24,-24,48,18,4);ctx.fill();ctx.fillStyle=PAL['cv-ink'];[-14,14].forEach(w=>{ctx.beginPath();ctx.arc(w,-4,5,0,6.29);ctx.fill();});ctx.restore();
    txt(ctx,'Angle drawn larger than the real ramp',760,74,{s:12*K,a:'right',c:PAL['cv-soft']});
    txt(ctx,CR_NAME[ramp]+' · '+(type==='up'?'push up, then down':'down only'),760,34,{s:13*K,w:700,a:'right',c:PAL['fg']});
    txt(ctx,b.run?'Collecting…':D?'Run collected: examine the data below':'Press Collect',760,54,{s:12*K,a:'right',c:b.run?'#d9573b':PAL['cv-soft']});
    // graphs and the examine readout
    const ty=292,boxL={L:68,T:ty,W:300,H:116,cw:800,ch:450},boxR={L:462,T:ty,W:300,H:116,cw:800,ch:450};RB.panel(ctx,16,228,768,216);txt(ctx,'Position (m)',boxL.L,ty-10,{s:12*K,w:700,c:PAL['fg']});txt(ctx,'Velocity (m/s)',boxR.L,ty-10,{s:12*K,w:700,c:PAL['fg']});
    const tmax=D?Math.max(1,Math.ceil(D.x.length*CR_DT)):5;
    const ax1=axes(ctx,boxL,{xmin:0,xmax:tmax,ymin:0,ymax:1,xl:'Time (s)',yl:''}),ax2=axes(ctx,boxR,{xmin:0,xmax:tmax,ymin:-1.2,ymax:1.2,xl:'Time (s)',yl:''});
    if(D){RB.trace(ctx,ax1,D.x.map((x,i)=>({t:i*CR_DT,y:x})),'#3f6fb0',{w:2,dots:2,ymin:0,ymax:1});RB.trace(ctx,ax2,D.v.map((v,i)=>({t:i*CR_DT,y:v})),'#d9573b',{w:2,dots:2,ymin:-1.2,ymax:1.2});
      const i=clamp(Math.round(sim.p.crT/CR_DT),0,D.x.length-1),tt=i*CR_DT;[[ax1,D.x[i],0,1],[ax2,D.v[i],-1.2,1.2]].forEach(([ax,y,lo,hi])=>{ctx.strokeStyle=PAL['s4'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ax.X(tt),ax.Y(lo));ctx.lineTo(ax.X(tt),ax.Y(hi));ctx.stroke();ctx.fillStyle=PAL['s4'];ctx.beginPath();ctx.arc(ax.X(tt),ax.Y(clamp(y,lo,hi)),5,0,6.29);ctx.fill();});
      RB.lcd(ctx,170,234,460,36,'','t = '+tt.toFixed(2)+' s   x = '+D.x[i].toFixed(3)+' m   v = '+D.v[i].toFixed(3)+' m/s',k,16);if(Math.round(sim.p.crT/CR_DT)>D.x.length-1)txt(ctx,'(end of run)',640,256,{s:12*K,c:PAL['cv-soft']});
    }else RB.lcd(ctx,170,234,460,36,'','no run yet',k,18);},
  narrate(sim){const b=sim.st.B,D=crRec(sim)[crKey(sim)];if(b.run)return 'The detector records the cart’s position 20 times a second while it rolls.';
    if(D)return 'Drag <b>Examine the data at time</b> to read the time (s), position x (m) and velocity v (m/s) of any data point. Record 5 points spread through the run.';
    return 'Choose the ramp and the run, then press <b>Collect</b>. The detector at the top is zeroed where the cart is released, so positions grow as the cart rolls down.';},
  read(sim){const D=crRec(sim)[crKey(sim)];if(!D)return null;const i=clamp(Math.round(sim.p.crT/CR_DT),0,D.x.length-1);return {t:RB.r2(i*CR_DT),x:D.x[i],v:D.v[i],n:D.x.length};}};
function crGo(sim){const b=RB.B(sim,'carts-ramps');if(!b)return;const R=crRec(sim);R._n=(R._n||0)+1;b.m=crModel(sim,sim.p.crRamp,sim.p.crType,R._n);b.t=0;b.run=true;BioLab.play(sim);}
/* checks: each point must be a real data point from your latest run of that ramp and run type */
function crPoint(sim,ramp,type,r,phase){const D=crRec(sim)[ramp+'|'+type];if(!D)return {msg:'Collect a run on '+CR_NAME[ramp]+' ('+(type==='up'?'push up, then down':'down only')+') first.'};
  const T=sim.vlab.val(phase.tb,'t',r);if(!Number.isFinite(T))return {D};const i=Math.round(T/CR_DT);
  if(Math.abs(T-i*CR_DT)>0.001||i<0||i>=D.x.length)return {D,msg:'The detector recorded a point every 0.05 s, from 0 to '+((D.x.length-1)*CR_DT).toFixed(2)+' s. Use a time from your run.'};
  if(phase.dir==='up'&&D.v[i]>=0)return {D,i,msg:'At '+T.toFixed(2)+' s the cart was not moving up the ramp. Choose a point on the way up.'};
  if(phase.dir==='down'&&D.v[i]<=0)return {D,i,msg:'At '+T.toFixed(2)+' s the cart was not moving down the ramp yet. Choose a point on the way down.'};
  return {D,i};}
function crCheck(ramp,type,col,tb,nUp){return (sim,rv,v)=>{const r=+String(rv).slice(1)-1,dir=type==='up'?(r<nUp?'up':'down'):null;
  if(col==='t'){if(r===0&&v===0&&type==='down')return 'Pick a point after the release (t greater than 0), so Δx/Δt has a time to divide by.';const P=crPoint(sim,ramp,type,r,{tb,dir});return P.msg||null;}
  const P=crPoint(sim,ramp,type,r,{tb,dir});if(P.msg&&P.i===undefined)return P.msg;if(P.i===undefined)return 'Enter the time of this point first.';
  if(col==='x')return Math.abs(v-P.D.x[P.i])<=0.0015?null:'Check your reading: at this time the detector shows the position to 3 decimal places.';
  if(col==='v')return Math.abs(v-P.D.v[P.i])<=0.0025?null:'Check your reading: at this time the velocity graph shows the velocity to 3 decimal places.';
  if(col==='dxdt'){const V=sim.vlab,x=V.val(tb,'x',r),t=V.val(tb,'t',r),xp=r?V.val(tb,'x',r-1):0,tp=r?V.val(tb,'t',r-1):0;if(![x,t,xp,tp].every(Number.isFinite)||t===tp)return 'Fill in the position and time for this point'+(r?' and the one before it':'')+' first.';
    const want=(x-xp)/(t-tp);return Math.abs(v-want)<=Math.max(0.002,0.01*Math.abs(want))?null:'Δx/Δt = (this position − the last position) ÷ (this time − the last time)'+(r?'':'. For point 1, the last position and time are both 0')+'. Check your arithmetic.';}
  return null;};}
const PTS=['p1','p2','p3','p4','p5'],PTL=PTS.map((p,i)=>'Point '+(i+1)),UD=['u1','u2','u3','u4','u5','d1','d2','d3','d4','d5'],UDL=['Up 1','Up 2','Up 3','Up 4','Up 5','Down 1','Down 2','Down 3','Down 4','Down 5'];
const crT1=ramp=>({id:'i1'+ramp,title:'Investigation 1, '+CR_NAME[ramp]+': down only',cols:[{id:'pt',label:'Data point',rows:PTS,rowLabels:PTL},
  {id:'x',label:'Position (m)',input:'number',check:crCheck(ramp,'down','x','i1'+ramp)},{id:'t',label:'Time (s)',input:'number',check:crCheck(ramp,'down','t','i1'+ramp)},
  {id:'dxdt',label:'Δx/Δt (m/s)',input:'number',check:crCheck(ramp,'down','dxdt','i1'+ramp)},{id:'v',label:'Velocity from the v–t graph (m/s)',input:'number',check:crCheck(ramp,'down','v','i1'+ramp)}]});
const crRowUD=(ramp,col)=>{const f=crCheck(ramp,'up',col,'i2'+ramp,5);return (sim,rv,v)=>f(sim,'p'+(UD.indexOf(String(rv))+1),v);};
const crT2=ramp=>({id:'i2'+ramp,title:'Investigation 2, '+CR_NAME[ramp]+': up and down',cols:[{id:'pt',label:'Data point',rows:UD,rowLabels:UDL},
  {id:'x',label:'Position (m)',input:'number',check:crRowUD(ramp,'x')},{id:'t',label:'Time (s)',input:'number',check:crRowUD(ramp,'t')},{id:'v',label:'Velocity (m/s)',input:'number',check:crRowUD(ramp,'v')}]});
const crFilled=(tb,cols,n)=>sim=>{for(let r=0;r<n;r++)for(const c of cols)if(sim.vlab.raw('c:'+tb+':'+c+':'+r).trim()==='')return false;return true;};
function crAcc(ramp){return (sim,v,V)=>{const t1=V.val('i1'+ramp,'t',0),t5=V.val('i1'+ramp,'t',4),v1=V.val('i1'+ramp,'v',0),v5=V.val('i1'+ramp,'v',4);
  if(![t1,t5,v1,v5].every(Number.isFinite)||t5===t1)return 'Fill in points 1 and 5 for '+CR_NAME[ramp]+' in Investigation 1 first.';const want=(v5-v1)/(t5-t1);
  return Math.abs(v-want)<=Math.max(0.003,0.02*Math.abs(want))?null:'a = (v₅ − v₁) ÷ (t₅ − t₁), using points 1 and 5 from your Investigation 1 table for this ramp.';};}
const LAB_CR={id:'carts-ramps',title:'Motion Lab: Carts on Ramps at Different Angles',course:'Physics',teachers:'Colella',level:'bio',
  source:{label:'Motion Lab: Carts on Ramps (Canvas)',href:'https://rjhs.instructure.com/courses/16601/assignments/612353'},
  purpose:'<p>Investigate the effect of the slope of a ramp on the motion of a cart: first rolling down only, then pushed up the ramp and rolling back down.</p>',
  background:'<p>A motion detector at the top of the ramp measures the cart’s position 20 times every second. Its zero is set where the cart is released, so position grows as the cart rolls down the ramp. The detector also works out the velocity from how fast the position changes, and graphs both.</p>'+
    '<p>Δx/Δt, the displacement divided by the change in time, is the cart’s <b>average</b> velocity between two data points. The velocity graph shows the velocity at <b>one instant</b>. Comparing the two is part of this lab.</p>'+
    '<p><b>About the virtual bench.</b> The ramp’s legs are raised by turning the leveling screws: 12 twists makes about a 1.0° slope, 24 twists about 2.0°, and all the way about 3.5°. Your ramp’s angles differ a little from a classmate’s. The track has a little rolling friction, as a real one does. The detector reads position to 1 mm with a little noise, so the velocity points scatter slightly. The angle is drawn larger than it really is so you can see it. After each run, drag <b>Examine the data at time</b> to read any data point, the way you tap a point in the graphing app.</p>'+
    '<p>Your teacher’s spreadsheet works out Δx, Δt and Δx/Δt for you. Here you work out Δx/Δt yourself in Investigation 1. <b>Analyze this table in a spreadsheet</b> under each table opens your data in a spreadsheet if you want to graph it there.</p>',
  materials:['Dynamics cart and track with adjustable legs','Motion detector at the top of the track','Graphing app (on the virtual bench)'],
  setup(sim){},
  controls:['crRamp','crType','crT','cr-go'],
  steps:[
    {title:'Get set up',text:'<p>The cart starts at the top of the track, at the detector’s zero. Choose <b>Ramp 1 (12 twists)</b> and <b>Down only</b>, then press <b>Collect</b>. When the run ends, drag <b>Examine the data at time</b> and watch the readout give the time, position and velocity of each data point.</p>',setup(sim){BioLab.setValues(sim,{crRamp:'r1',crType:'down'});}},
    ...['r1','r2','r3'].map(r=>({title:'Investigation 1: '+CR_NAME[r],text:'<p>Choose <b>'+CR_NAME[r]+'</b> and <b>Down only</b>, then press <b>Collect</b>. Record 5 data points spread from just after the release to near the bottom: position, time and the velocity from the velocity graph. Then work out Δx/Δt for each point.</p>',
      setup(sim){BioLab.setValues(sim,{crRamp:r,crType:'down'});},done:crFilled('i1'+r,['x','t','dxdt','v'],5),doneHint:'Fill in all 5 points in the Investigation 1 table for '+CR_NAME[r]+'.'})),
    ...['r1','r2','r3'].map(r=>({title:'Investigation 2: '+CR_NAME[r],text:'<p>Choose <b>'+CR_NAME[r]+'</b> and <b>Push up, then down</b>, then press <b>Collect</b>. The cart is pushed from the bottom, rolls up toward the detector, stops and rolls back down. Record 5 points on the way up and 5 on the way down.</p>',
      setup(sim){BioLab.setValues(sim,{crRamp:r,crType:'up'});},done:crFilled('i2'+r,['x','t','v'],10),doneHint:'Fill in all 10 points in the Investigation 2 table for '+CR_NAME[r]+'.'})),
    {title:'Analyze',text:'<p>Below the bench, check your graphs, work out the acceleration on each ramp, answer the questions and turn in your lab.</p>'}],
  tables:['r1','r2','r3'].map(crT1).concat(['r1','r2','r3'].map(crT2)),
  graphs:[{type:'line',title:'Investigation 1: position vs time',xl:'Time (s)',yl:'Position (m)',xmin:0,ymin:0,series:['r1','r2','r3'].map((r,i)=>({table:'i1'+r,x:'t',y:'x',label:'Ramp '+(i+1)}))},
    {type:'line',title:'Investigation 1: velocity vs time',xl:'Time (s)',yl:'Velocity (m/s)',xmin:0,ymin:0,series:['r1','r2','r3'].map((r,i)=>({table:'i1'+r,x:'t',y:'v',label:'Ramp '+(i+1)}))},
    {type:'line',title:'Investigation 2: velocity vs time',xl:'Time (s)',yl:'Velocity (m/s)',xmin:0,series:['r1','r2','r3'].map((r,i)=>({table:'i2'+r,x:'t',y:'v',label:'Ramp '+(i+1)}))}],
  calcs:['r1','r2','r3'].map((r,i)=>({id:'a'+(i+1),label:'Acceleration on '+CR_NAME[r]+' from your Investigation 1 data: a = (v₅ − v₁) ÷ (t₅ − t₁)',unit:'m/s²',input:'number',check:crAcc(r)})),
  questions:[
    {id:'q1',n:'1',q:'<p>How did the slope of the ramp change the shape of the position vs. time graph? Use your graph as evidence.</p>'},
    {id:'q2',n:'2',q:'<p>The velocity vs. time graphs are close to straight lines. What does the slope of a velocity vs. time graph tell you, and how did it change as the ramp got steeper?</p>'},
    {id:'q3',n:'3',q:'<p>Compare your Δx/Δt values with the velocities you read from the graph. Which is usually smaller, and why? (Hint: one is an average over a time interval; the other is at one instant.)</p>'},
    {id:'q4',n:'4',q:'<p>In Investigation 2, what was the cart’s velocity at the top of its path? Was its acceleration zero there? Use your velocity graph to explain.</p>'},
    {id:'q5',n:'5',q:'<p>Compare the slope of the velocity graph on the way up with the slope on the way down. Were they exactly the same? What could make them differ?</p>'}],
  conclusion:{prompt:'<p>Answer the purpose: how does the slope of a ramp affect the motion of a cart? Use evidence from your graphs and your accelerations.</p>',cer:true}};

SIM.controls.push(
  {id:'mmg1',label:'Target graph',type:'seg',def:1,vlab:true,noTrial:true,options:[1,2,3,4,5,6].map(g=>({v:g,l:'Graph '+g})),onChange(sim){const b=RB.B(sim);if(b){b.run=false;b.done=false;b.tr=[];}}},
  {id:'mmg2',label:'Target graph',type:'seg',def:1,vlab:true,noTrial:true,options:[1,2,3,4,5].map(g=>({v:g,l:'Graph '+g})),onChange(sim){const b=RB.B(sim);if(b){b.run=false;b.done=false;b.tr=[];}}},
  {id:'mmx',label:'Stand at',type:'range',min:0.3,max:4.2,step:0.1,def:1,unit:' m',vlab:true,noTrial:true,help:'Where you stand before you start recording.'},
  {id:'mmv',label:'Walking velocity',type:'range',min:-1.5,max:1.5,step:0.05,def:0,unit:' m/s',vlab:true,noTrial:true,help:'Positive walks away from the detector. Drag while recording, or use the arrow keys.'},
  {id:'crRamp',label:'Ramp',type:'seg',def:'r1',vlab:true,noTrial:true,options:[{v:'r1',l:'1: 12 twists'},{v:'r2',l:'2: 24 twists'},{v:'r3',l:'3: all the way'}],onChange(sim){BioLab.reset(sim);}},
  {id:'crType',label:'Run',type:'seg',def:'down',vlab:true,noTrial:true,options:[{v:'down',l:'Down only'},{v:'up',l:'Push up, then down'}],onChange(sim){BioLab.reset(sim);}},
  {id:'crT',label:'Examine the data at time',type:'range',min:0,max:8,step:0.05,def:0,unit:' s',vlab:true,noTrial:true,help:'Moves the cursor along your last run; arrow keys step one data point (0.05 s).'});
SIM.actions.push({id:'mm-go',label:'Start recording',primary:true,vlab:true,enabled:s=>{const b=RB.B(s);return !!b&&!b.run;},run(sim){mmGo(sim);}},
  {id:'cr-go',label:'Collect',primary:true,vlab:true,enabled:s=>{const b=RB.B(s,'carts-ramps');return !!b&&!b.run;},run(sim){crGo(sim);}});
SIM.labs=[mmLab(1),mmLab(2),LAB_CR];
RB.attach(SIM,{'motion-match-1':MMB,'motion-match-2':MMB,'carts-ramps':CRB});

BioLab.register(SIM);
})();
