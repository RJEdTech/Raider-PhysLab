(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,RM}=BioLab.h;

/* Pulleys and connected objects (g = 9.8 m/s²).
   Hanging (Atwood): a = (m2 − m1)g / (m1 + m2 + M/2), positive when m2 goes down.
     T1 = m1(g + a), T2 = m2(g − a). M is the pulley mass (solid disk, I = ½MR²); M = 0 is an ideal pulley.
   Table (modified Atwood): m1 slides on a table with coefficient μ, m2 hangs.
     It stays at rest while m2·g ≤ μ·m1·g (one μ for starting and sliding). Moving: a = (m2 g − μ m1 g)/(m1 + m2 + M/2).
     T1 = m1 a + μ m1 g (table side), T2 = m2(g − a) (hanging side).
   Push: a hand pushes m1 with F; m1 pushes m2. Frictionless floor. a = F/(m1 + m2), contact force P = m2·a.
   Each run starts from rest, goes 0.80 m (2.0 m when pushing), stops on a padded stop, waits 1.2 s and restarts.
   A timer records the time to cover the first 0.50 m from rest; measured a = 2d/t². */
const G=9.8,GATE=0.5,PAUSE=1.2;
const travel=s=>s.p.mode==='push'?2.0:0.8;
const MODE_CTL={mu:['table'],F:['push'],Mp:['atwood','table']};
const MODE_TILE={T1:['atwood','table'],T2:['atwood','table'],contact:['push'],fric:['table']};
const LBL={atwood:['m₁ (left)','m₂ (right)'],table:['m₁ (on the table)','m₂ (hanging)'],push:['m₁ (you push this)','m₂ (in front)']};

function arrow(ctx,x,y,dx,dy,col,w){const L=Math.hypot(dx,dy);if(L<2)return;const head=Math.min(10,4+L*0.25),ux=dx/L,uy=dy/L;
  ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=w||3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+dx-ux*head*0.8,y+dy-uy*head*0.8);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+dx,y+dy);ctx.lineTo(x+dx-ux*head-uy*head*0.55,y+dy-uy*head+ux*head*0.55);ctx.lineTo(x+dx-ux*head+uy*head*0.55,y+dy-uy*head-ux*head*0.55);ctx.closePath();ctx.fill();}

/* Model acceleration for the current settings, ignoring the run phase. */
function model(p){const m1=p.m1,m2=p.m2,Mp=p.mode==='push'?0:p.Mp,I=Mp/2;
  if(p.mode==='push'){const a=p.F/(m1+m2);return {a,T1:NaN,T2:NaN,P:m2*a,f:0,stuck:false};}
  if(p.mode==='atwood'){const a=(m2-m1)*G/(m1+m2+I);return {a,T1:m1*(G+a),T2:m2*(G-a),P:NaN,f:0,stuck:false};}
  const fmax=p.mu*m1*G;if(m2*G<=fmax+1e-9)return {a:0,T1:m2*G,T2:m2*G,P:NaN,f:m2*G,stuck:true};
  const a=(m2*G-fmax)/(m1+m2+I);return {a,T1:m1*a+fmax,T2:m2*(G-a),P:NaN,f:fmax,stuck:false};}

function syncMode(sim){const id=sim.def.id,m=sim.p.mode;
  for(const c of SIM.controls){if(c.vlab)continue;const el=document.getElementById(id+'-'+c.id)||document.getElementById(id+'-'+c.id+'-l');if(!el)continue;const w=el.closest('.ctl');if(!w)continue;
    w.hidden=!atLeast(c.lvl)||(MODE_CTL[c.id]&&!MODE_CTL[c.id].includes(m));}
  for(const mt of SIM.metrics){const t=sim.ui.tiles&&sim.ui.tiles[mt.id];if(!t)continue;t.num.closest('.tile').hidden=!atLeast(mt.lvl)||(MODE_TILE[mt.id]&&!MODE_TILE[mt.id].includes(m));}}

/* Forces right now (what the FBDs and tiles show). In the pause the heavier side rests on its stop. */
function live(sim){const s=sim.st,p=sim.p;if(s.phase==='run')return model(p);
  if(p.mode==='push')return {a:0,T1:NaN,T2:NaN,P:0,f:0,stuck:false};
  if(p.mode==='atwood'){const T=Math.min(p.m1,p.m2)*G;return {a:0,T1:T,T2:T,P:NaN,f:0,stuck:false};}
  return {a:0,T1:0,T2:0,P:NaN,f:0,stuck:false};}

const SIM={
  id:'atwood',hash:'atwood',apUnit:2,order:4,tab:'Pulleys and connected objects',kind:'Simulation',
  card:'Hang two masses over a pulley, drag a block across a table, or push two blocks together, and find the force each object feels.',
  title:'Pulleys and connected objects',
  lede:{bio:'Two masses tied by a string move together. Change the masses and watch how fast the pair speeds up.',
        honors:'Treat the connected objects as one system to find the acceleration, then use one object’s free-body diagram to find the string tension or contact force.',
        ap:'Add friction and a massive pulley. Test a = (m₂ − m₁)g/(m₁ + m₂ + M/2) against timer data, and explain why the two tensions differ.'},
  scale:'Lab-bench size: hanging masses of 0.2–3 kg over a 10 cm pulley, falling about 0.8 m to a padded stop.',
  timeScale:1,dtMax:0.004,prewarm:0,sampleDt:0.04,window:8,unit:'s',chChange:1.5,chReveal:5.5,
  controls:[
    {id:'mode',label:'Set-up',type:'seg',def:'atwood',lvl:'bio',options:[{v:'atwood',l:'Hanging masses'},{v:'table',l:'Block on a table'},{v:'push',l:'Blocks pushed together'}],
     onChange(sim){BioLab.reset(sim);syncMode(sim);}},
    {id:'m1',label:'Mass m₁',type:'range',min:0.2,max:3,step:0.1,def:1.0,unit:' kg',d:1,lvl:'bio',help:'Left mass, the block on the table, or the block you push.'},
    {id:'m2',label:'Mass m₂',type:'range',min:0.2,max:3,step:0.1,def:1.2,unit:' kg',d:1,lvl:'bio',help:'Right hanging mass, or the block in front.'},
    {id:'mu',label:'Table friction μ',type:'range',min:0,max:0.8,step:0.05,def:0.2,d:2,unit:'',lvl:'bio',help:'0 is a frictionless air table.'},
    {id:'F',label:'Your push',type:'range',min:0,max:20,step:1,def:6,unit:' N',lvl:'bio'},
    {id:'Mp',label:'Pulley mass M',type:'range',min:0,max:2,step:0.1,def:0,unit:' kg',d:1,lvl:'ap',help:'A solid disk. 0 means an ideal, massless pulley.'}
  ],
  init(){return {x:0,v:0,phase:'run',pause:0,runT:0,gateT:null,lastA:NaN};},
  step(sim,dt){const s=sim.st,p=sim.p,L=travel(sim);
    if(s.phase==='pause'){s.pause-=dt;if(s.pause<=0){s.phase='run';s.x=0;s.v=0;s.runT=0;s.gateT=null;}return;}
    const m=model(p);if(s.x===0&&s.v===0)s.runT=0;s.v+=m.a*dt;s.x+=s.v*dt;s.runT+=dt;
    if(p.mode!=='atwood'&&s.x<0){s.x=0;s.v=0;}
    if(s.gateT===null&&Math.abs(s.x)>=GATE){s.gateT=s.runT;s.lastA=Math.sign(s.x)*2*GATE/(s.runT*s.runT);}
    if(Math.abs(s.x)>=L){s.x=Math.sign(s.x)*L;s.v=0;s.phase='pause';s.pause=PAUSE;}},
  metrics:[
    {id:'acc',label:'Acceleration',unit:'m/s²',lvl:'bio',d:2,max:null,get:s=>s.st.phase==='run'?Math.abs(model(s.p).a):0},
    {id:'vel',label:'Speed',unit:'m/s',lvl:'bio',d:2,max:null,get:s=>Math.abs(s.st.v)},
    {id:'meas',label:'Timer: a = 2d/t²',unit:'m/s²',lvl:'bio',d:2,get:s=>Math.abs(s.st.lastA)},
    {id:'T1',label:'Tension pulling m₁',unit:'N',lvl:'honors',d:2,max:null,get:s=>live(s).T1},
    {id:'contact',label:'m₁ pushes m₂ with',unit:'N',lvl:'honors',d:2,max:null,get:s=>live(s).P},
    {id:'pred',label:'Predicted a (system)',unit:'m/s²',lvl:'honors',d:2,get:s=>Math.abs(model(s.p).a)},
    {id:'fric',label:'Friction on m₁',unit:'N',lvl:'honors',d:2,get:s=>s.p.mode==='table'?(s.st.phase==='run'?model(s.p).f:0):NaN},
    {id:'T2',label:'Tension pulling m₂',unit:'N',lvl:'ap',d:2,max:null,get:s=>live(s).T2}
  ],
  graphs:[{id:'vel',label:'Speed',lines:['vel']},{id:'acc',label:'Acceleration',lines:['acc']},
          {id:'T',label:'Tensions',lvl:'honors',lines:['T1','T2']},{id:'contact',label:'Contact force',lvl:'honors',lines:['contact']}],
  defaultGraph:'vel',
  onLevel(sim){syncMode(sim);},
  challenges:[
    {lvl:'bio',q:'Both masses are 1.0 kg and the pair sits still. You add 0.5 kg to m₂. What does m₂ do?',
     choices:['Falls as fast as a dropped ball','Falls, but speeds up much more slowly than a dropped ball','Nothing; the string holds it up'],correct:1,
     baseline:{mode:'atwood',m1:1.0,m2:1.0,Mp:0},change:{m2:1.5},changeText:'m₂ is now 1.5 kg',watch:'acc',reveal:2.3,
     explain:{bio:'Only the extra 0.5 kg of weight (4.9 N) pulls the pair, but it has to speed up all 2.5 kg. So a = 4.9 ÷ 2.5 = 1.96 m/s², one-fifth of free fall.',
              honors:'Treat both masses as one system: F_net = (m₂ − m₁)g = 4.9 N and total mass 2.5 kg, so a = 1.96 m/s² = g/5.'}},
    {lvl:'bio',q:'m₁ = 1.0 kg and m₂ = 1.2 kg. You double both (2.0 kg and 2.4 kg). What happens to the acceleration?',
     choices:['It doubles','It stays the same','It is cut in half'],correct:1,
     baseline:{mode:'atwood',m1:1.0,m2:1.2,Mp:0},change:{m1:2.0,m2:2.4},changeText:'Both masses doubled',watch:'acc',at:1.0,reveal:3.5,
     explain:{bio:'The pull doubles (the weight difference goes from 0.2 kg to 0.4 kg), but so does the mass being moved. Twice the force on twice the mass gives the same acceleration, 0.89 m/s².'}},
    {lvl:'bio',q:'A 1.0 kg block on a frictionless table is pulled by a 1.0 kg hanging mass. You swap in a 3.0 kg block on the table. What happens?',
     choices:['It speeds up faster','It speeds up more slowly','It stops moving'],correct:1,
     baseline:{mode:'table',m1:1.0,m2:1.0,mu:0,Mp:0},change:{m1:3.0},changeText:'Block on the table is now 3.0 kg',watch:'acc',at:1.0,reveal:4.3,
     explain:{bio:'The same 9.8 N hanging weight now has to move 4.0 kg instead of 2.0 kg, so a drops from 4.9 to 2.45 m/s². With no friction it still moves, just more slowly.'}},
    {lvl:'honors',q:'m₁ = 1.0 kg and m₂ = 2.0 kg are released. Is the string tension more or less than m₂’s weight (19.6 N)?',
     choices:['Equal to 19.6 N','Less than 19.6 N','More than 19.6 N'],correct:1,
     baseline:{mode:'atwood',m1:1.0,m2:1.0,Mp:0},change:{m2:2.0},changeText:'m₂ is now 2.0 kg',watch:'T1',reveal:2.1,
     explain:{honors:'m₂ accelerates downward, so the net force on it points down: its weight must beat the tension. a = 9.8/3 = 3.27 m/s², and T = m₂(g − a) = 2.0 × 6.53 = 13.1 N. Check with m₁: T = m₁(g + a) = 13.1 N.'}},
    {lvl:'honors',q:'A 2.0 kg block rests on a table with μ = 0.30. The hanging mass is raised from 0.2 kg to 0.5 kg. Does the block start to slide?',
     choices:['Yes, slowly','No: friction can still hold it','Yes, and the hanging mass falls at g'],correct:1,
     baseline:{mode:'table',m1:2.0,m2:0.2,mu:0.3,Mp:0},change:{m2:0.5},changeText:'Hanging mass is now 0.5 kg',watch:'vel',
     explain:{honors:'The hanging weight is 0.5 × 9.8 = 4.9 N. Friction can supply up to μm₁g = 0.30 × 2.0 × 9.8 = 5.9 N. Since 4.9 N < 5.9 N, friction matches the pull and nothing moves.'}},
    {lvl:'honors',q:'You push a 1.0 kg block with 6 N, and it pushes a 2.0 kg block in front of it. How hard does the first block push the second?',
     choices:['6 N','4 N','2 N','3 N'],correct:1,
     baseline:{mode:'push',m1:1.0,m2:2.0,F:0},change:{F:6},changeText:'Pushing with 6 N',watch:'contact',reveal:2.7,
     explain:{honors:'The whole 3.0 kg system accelerates at 6 ÷ 3 = 2 m/s². The front block only needs m₂a = 2.0 × 2 = 4 N to keep up. The other 2 N of your push accelerates the 1.0 kg block itself.'}},
    {lvl:'ap',q:'m₁ = 1.0 kg, m₂ = 1.5 kg. You replace the ideal pulley with a 2.0 kg solid disk. What happens to the acceleration?',
     choices:['Same: the pulley just turns','Smaller','Larger'],correct:1,
     baseline:{mode:'atwood',m1:1.0,m2:1.5,Mp:0},change:{Mp:2.0},changeText:'Pulley is now a 2.0 kg disk',watch:'acc',at:1.0,reveal:3.0,
     explain:{ap:'The pulley needs a net torque to spin up, which adds rotational inertia: a = (m₂ − m₁)g/(m₁ + m₂ + M/2) = 4.9/3.5 = 1.40 m/s², down from 1.96 m/s².'}},
    {lvl:'ap',instant:true,q:'With the 2.0 kg disk pulley (m₁ = 1.0 kg, m₂ = 1.5 kg, a = 1.40 m/s²), how do the two string tensions compare?',
     choices:['They are equal','The m₂ side is larger','The m₁ side is larger'],correct:1,
     explain:{ap:'T₂ = m₂(g − a) = 1.5 × 8.4 = 12.6 N; T₁ = m₁(g + a) = 1.0 × 11.2 = 11.2 N. The difference times R is the net torque that angularly accelerates the pulley: (T₂ − T₁)R = ½MR²·(a/R) gives T₂ − T₁ = Ma/2 = 1.4 N.'}},
    {lvl:'ap',instant:true,q:'A 3.0 kg block slides on a table (μk = 0.20), pulled by a 2.0 kg hanging mass over an ideal pulley. What is the acceleration?',
     choices:['3.92 m/s²','2.74 m/s²','1.96 m/s²','5.88 m/s²'],correct:1,
     explain:{ap:'F_net on the system = m₂g − μm₁g = 19.6 − 5.88 = 13.7 N. Total mass 5.0 kg, so a = 2.74 m/s².'}}
  ],
  narrate(sim){const p=sim.p,s=sim.st,hon=atLeast('honors'),m=model(p),a=Math.abs(m.a).toFixed(2);
    if(s.phase==='pause')return 'The run is over: a mass hit its padded stop. '+(isFinite(s.lastA)?'The timer measured <b>a = '+Math.abs(s.lastA).toFixed(2)+' m/s²</b> over the first 0.50 m. ':'')+'The next run starts in a moment.';
    if(p.mode==='atwood'){
      if(p.m1===p.m2)return '<b>Balanced.</b> Each side weighs '+(p.m1*G).toFixed(1)+' N, so the string pulls each mass up exactly as hard as gravity pulls it down. Net force zero: '+(Math.abs(s.v)>0.001?'the pair keeps its speed.':'nothing moves.');
      const heavy=p.m2>p.m1?'m₂':'m₁',dW=Math.abs(p.m2-p.m1)*G;
      return 'The heavier side ('+heavy+') wins by '+dW.toFixed(1)+' N, but that pull must speed up all '+(p.m1+p.m2+(p.Mp/2)).toFixed(1)+' kg'+(p.Mp>0?' (including the pulley’s M/2)':'')+', so a = <b>'+a+' m/s²</b>, much less than g.'+(hon?' The tension ('+m.T1.toFixed(1)+' N) sits between the two weights.':'');}
    if(p.mode==='table'){
      if(m.stuck)return '<b>Stuck.</b> The hanging weight ('+(p.m2*G).toFixed(1)+' N) is no more than friction can hold (up to '+(p.mu*p.m1*G).toFixed(1)+' N), so friction matches it and nothing moves.';
      return 'The hanging weight ('+(p.m2*G).toFixed(1)+' N) beats friction ('+m.f.toFixed(1)+' N). The '+(p.m2*G-m.f).toFixed(1)+' N difference speeds up both blocks: a = <b>'+a+' m/s²</b>.'+(hon?' The string pulls the table block with '+m.T1.toFixed(1)+' N.':'');}
    if(p.F===0)return 'No push, no friction: the blocks keep whatever motion they have.';
    return 'Your '+p.F+' N push speeds up both blocks: a = F ÷ (m₁ + m₂) = <b>'+a+' m/s²</b>. '+(hon?'The front block only gets m₂a = '+m.P.toFixed(1)+' N from the back block, less than your push.':'The back block passes part of your push on to the front block.');},
  tour:[
    {title:'An Atwood machine',text:{bio:'Two masses hang from one string over a pulley. When one goes down, the other goes up by the same amount, so they always share the same speed.',honors:'Two masses joined by a light string over an ideal pulley. They share one acceleration, so you can treat them as one system.'},
     focus:[195,24,300,390],pause:true,setup(sim){BioLab.setValues(sim,{mode:'atwood',m1:1.0,m2:1.0,Mp:0});BioLab.reset(sim);}},
    {title:'Make one side heavier',text:'m₂ is now 1.2 kg. Only the 0.2 kg difference pulls, but all 2.2 kg must speed up. Watch m₂ fall slowly, far slower than a dropped ball.',
     focus:[195,24,300,390],speed:0.4,setup(sim){BioLab.setValues(sim,{m2:1.2});BioLab.reset(sim);}},
    {title:'Read the free-body diagrams',text:{bio:'Each mass has two forces: the string pulling up and gravity pulling down. On m₂ gravity wins, so it speeds up downward. On m₁ the string wins.',honors:'T is the same on both sides of an ideal pulley. On m₂, m₂g > T; on m₁, T > m₁g. The tension is always between the two weights.'},
     focus:[548,14,246,300],speed:0.4,setup(sim){BioLab.setValues(sim,{m2:1.6});BioLab.reset(sim);}},
    {title:'Measure it',text:'The timer starts at release and stops after 0.50 m. Since the pair starts from rest, a = 2d/t². Compare the timer with the predicted value.',
     focus:[[400,100,140,260],[16,14,250,70]],speed:0.4},
    {title:'Block on a table',text:'Now the string runs over the edge of a table. The hanging weight pulls; friction on the table block pulls back. Only the difference speeds things up.',
     focus:[20,150,520,290],speed:0.4,setup(sim){BioLab.setValues(sim,{mode:'table',m1:1.0,m2:1.0,mu:0.2});BioLab.reset(sim);}},
    {title:'Too much friction',text:'With a heavy 3.0 kg block and μ = 0.40, friction can hold up to 11.8 N. The 9.8 N hanging weight can’t beat it, so nothing moves.',
     focus:[20,150,520,290],speed:0.4,setup(sim){BioLab.setValues(sim,{m1:3.0,m2:1.0,mu:0.4});BioLab.reset(sim);}},
    {title:'Blocks pushed together',text:'Push the back block with 6 N. Both blocks share one acceleration, so the front block only gets the part of your push it needs for its own mass.',
     focus:[[40,180,500,200],[548,14,246,300]],speed:0.4,setup(sim){BioLab.setValues(sim,{mode:'push',m1:1.0,m2:2.0,F:6});BioLab.reset(sim);}},
    {lvl:'ap',title:'A pulley with mass',text:'A 2.0 kg disk pulley needs torque to spin up. That takes a difference in tension: T₂ > T₁. The pulley acts like an extra M/2 = 1.0 kg in the system.',
     focus:[[195,24,300,390],[548,14,246,300]],speed:0.4,setup(sim){BioLab.setValues(sim,{mode:'atwood',m1:1.0,m2:1.5,Mp:2.0});BioLab.reset(sim);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'atwood',m1:1.0,m2:1.2,mu:0.2,F:6,Mp:0});BioLab.reset(sim);syncMode(sim);},
  lab:{bio:'<p><b>Question:</b> How does the difference between the two hanging masses affect the acceleration?</p><ol><li>Hanging masses. Keep m₁ + m₂ = 3.0 kg the whole time.</li><li>Try m₂ − m₁ = 0.2, 0.4, 0.6, 0.8 and 1.0 kg (for example 1.4 and 1.6 kg). Record a trial after each timer reading.</li><li>Graph the mass difference (x) against the timer acceleration (y).</li></ol><p>Write a claim about how the difference in weight affects the acceleration, backed by your data.</p>',
       honors:'<p><b>Question:</b> What is the coefficient of friction on the table?</p><ol><li>Block on a table. Set m₁ = 2.0 kg and leave μ where it is.</li><li>Raise the hanging mass in 0.1 kg steps. Find the smallest m₂ that makes the block slide. Then record the timer a for four values of m₂ above that.</li><li>For each trial, use a = (m₂g − μm₁g)/(m₁ + m₂) to solve for μ.</li></ol><p>Do your μ values agree? Explain why the smallest m₂ that slides tells you μ directly.</p>',
       ap:'<p><b>Question:</b> How much does the pulley’s mass slow the system, and can you measure it?</p><ol><li>Hanging masses, m₁ = 1.0 kg, m₂ = 1.5 kg.</li><li>Record the timer a for pulley masses 0, 0.5, 1.0, 1.5 and 2.0 kg.</li><li>Linearize: plot (m₂ − m₁)g/a against M. Find the slope and intercept.</li></ol><p><b>Claim–evidence–reasoning:</b> What should the slope and intercept equal for a solid-disk pulley? Use T₂ − T₁ = Ma/2 to explain.</p>'},
  terms:[{t:'System',d:'The group of objects you choose to study together. Objects joined by a string share one acceleration.'},{t:'Tension',d:'The pull of a string or rope, in newtons. It pulls along the string, away from the object.'},
    {t:'Atwood machine',d:'Two masses on one string over a pulley, used to study acceleration slower than free fall.'},
    {lvl:'honors',t:'Internal force',d:'A force between objects inside the system, like the string tension or the contact force. Internal forces cancel when you treat the system as a whole.'},
    {lvl:'honors',t:'Contact (normal) force',d:'The push one surface gives another, perpendicular to the surface.'},
    {lvl:'ap',t:'Rotational inertia of a disk',d:'I = ½MR². A disk pulley adds M/2 to the effective mass of the system.'},
    {lvl:'ap',t:'Ideal pulley',d:'Massless and frictionless, so the tension is the same on both sides.'}],
  about:'<p>Newton’s second law for connected objects, g = 9.8 m/s², integrated in 4 ms steps.</p><ul><li><b>Hanging:</b> a = (m₂ − m₁)g/(m₁ + m₂ + M/2), T₁ = m₁(g + a), T₂ = m₂(g − a). The pulley is a uniform disk (I = ½MR²) and the string does not slip.</li><li><b>Table:</b> one coefficient μ for starting and sliding. The block stays at rest while m₂g ≤ μm₁g.</li><li><b>Pushed blocks:</b> frictionless floor; contact force P = m₂F/(m₁ + m₂).</li><li>The timer measures the time to cover 0.50 m from rest, and a = 2d/t².</li></ul><p>Simplified: the string has no mass and doesn’t stretch, there is no air drag or axle friction, and each run stops on a padded stop before restarting.</p>',
  draw(sim,ctx,vdt,k,t){const p=sim.p,s=sim.st,hon=atLeast('honors');
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    if(p.mode==='atwood')drawHang(sim,ctx,k,hon);else if(p.mode==='table')drawTable(sim,ctx,k,hon);else drawPush(sim,ctx,k,hon);
    rr(ctx,16,16,96+40*k,22+18*k,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
    txt(ctx,'⏱ '+s.runT.toFixed(2)+' s',28,30+12*k,{s:14*k,w:700});
    drawFBD(sim,ctx,k,hon);},
  thumbSetup(sim){BioLab.setValues(sim,{m2:1.6});}
};

function block(ctx,cx,cy,m,col,label,k){const sz=34+m*13;ctx.fillStyle=col;rr(ctx,cx-sz/2,cy-sz/2,sz,sz,5);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=1.5;ctx.stroke();
  txt(ctx,label,cx,cy-2,{s:11.5*k,w:700,a:'center',c:'#fff'});txt(ctx,m.toFixed(1)+' kg',cx,cy+12*k,{s:10.5*k,a:'center',c:'#fff'});return sz;}
function pulley(ctx,x,y,R,ang,Mp){ctx.fillStyle=Mp>0?'#7c8794':'#b9c1ca';ctx.beginPath();ctx.arc(x,y,R,0,6.29);ctx.fill();ctx.strokeStyle='#4b535c';ctx.lineWidth=2;ctx.stroke();
  ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.strokeStyle='#4b535c';ctx.lineWidth=2.5;for(let i=0;i<3;i++){ctx.rotate(Math.PI*2/3);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(R-4,0);ctx.stroke();}ctx.restore();
  ctx.fillStyle='#2f353b';ctx.beginPath();ctx.arc(x,y,4,0,6.29);ctx.fill();}

function drawHang(sim,ctx,k,hon){const p=sim.p,s=sim.st,PX=330,PY=72,R=40,Y0=226,ppm=120,L=0.8;
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(PX-130,14,260,12);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(PX,26);ctx.lineTo(PX,PY);ctx.stroke();
  const y1=Y0-s.x*ppm,y2=Y0+s.x*ppm,h1=(34+p.m1*13)/2,h2=(34+p.m2*13)/2;
  ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(PX-R,PY);ctx.lineTo(PX-R,y1-h1);ctx.moveTo(PX+R,PY);ctx.lineTo(PX+R,y2-h2);ctx.stroke();
  ctx.beginPath();ctx.arc(PX,PY,R,Math.PI,0);ctx.stroke();
  pulley(ctx,PX,PY,R-3,s.x*ppm/R,p.Mp);
  if(p.Mp>0)txt(ctx,'Pulley M = '+p.Mp.toFixed(1)+' kg',PX+R+12,PY+4,{s:11*k,c:PAL['cv-soft']});
  // padded stops where each mass lands
  ctx.fillStyle=PAL['cv-soft'];const stop1=Y0+L*ppm+h1,stop2=Y0+L*ppm+h2;ctx.fillRect(PX-R-30,stop1,60,8);ctx.fillRect(PX+R-30,stop2,60,8);
  // ruler and timer line beside m2
  const RX=PX+R+44;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(RX,Y0-L*ppm);ctx.lineTo(RX,Y0+L*ppm);
  for(let c=-80;c<=80;c+=10){const y=Y0+c/100*ppm;ctx.moveTo(RX,y);ctx.lineTo(RX+(c%50===0?12:6),y);}ctx.stroke();
  txt(ctx,'0',RX+16,Y0+4,{s:10.5*k,c:PAL['cv-soft']});
  ctx.save();ctx.setLineDash([4,3]);ctx.strokeStyle=PAL['rj'];ctx.beginPath();for(const sg of [-1,1]){const y=Y0+sg*GATE*ppm;ctx.moveTo(RX-8,y);ctx.lineTo(RX+40,y);}ctx.stroke();ctx.restore();
  txt(ctx,'timer 0.50 m',RX+16,Y0+GATE*ppm-4,{s:10.5*k,c:PAL['rj'],w:600});
  block(ctx,PX-R,y1,p.m1,'#3f6fb0','m₁',k);block(ctx,PX+R,y2,p.m2,'#b0503f','m₂',k);
  if(Math.abs(s.v)>0.05&&!RM){ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.globalAlpha=clamp(Math.abs(s.v)/2,0.2,0.8);const d=Math.sign(s.v);
    for(const [x,y,h,dir] of [[PX+R,y2,h2,d],[PX-R,y1,h1,-d]]){for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(x+i*10,y-dir*(h+6));ctx.lineTo(x+i*10,y-dir*(h+20));ctx.stroke();}}ctx.globalAlpha=1;}
  if(isFinite(s.lastA))txt(ctx,'Timer: a = 2d/t² = '+Math.abs(s.lastA).toFixed(2)+' m/s²',28,430,{s:12.5*k,w:700,c:PAL['rj']});}

function drawTable(sim,ctx,k,hon){const p=sim.p,s=sim.st,TY=210,ppm=160,PX=440,PY=216,R=20,sY=196;
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(30,TY,PX-30,14);ctx.fillRect(50,TY+14,10,220);ctx.fillRect(PX-30,TY+14,10,220);
  ctx.fillStyle=PAL['cv-soft'];ctx.fillRect(PX-6,TY,12,PY-TY);
  const s1=34+p.m1*13,bx=110+s.x*ppm,by=TY-s1/2,h2=(34+p.m2*13)/2,y2=268+s.x*ppm;
  ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(bx+s1/2,sY);ctx.lineTo(PX,sY);ctx.arc(PX,PY,R,-Math.PI/2,0);ctx.lineTo(PX+R,y2-h2);ctx.stroke();
  pulley(ctx,PX,PY,R-3,s.x*ppm/R,p.Mp);
  block(ctx,bx,by,p.m1,'#3f6fb0','m₁',k);block(ctx,PX+R,y2,p.m2,'#b0503f','m₂',k);
  ctx.fillStyle=PAL['cv-soft'];ctx.fillRect(PX+R-30,268+0.8*ppm+h2,60,8);
  txt(ctx,p.mu>0?'Table μ = '+p.mu.toFixed(2):'Frictionless air table',40,TY+34,{s:12*k,w:600,c:PAL['cv-ink']});
  const m=model(p);if(s.phase==='run'&&m.f>0.01)arrow(ctx,bx-s1/2+2,TY-5,-clamp(m.f*6,12,90),0,PAL['s4'],4);
  if(m.stuck)pill(ctx,'Friction holds it',bx,TY-s1-22,PAL['s4'],'#fff',12*k);
  if(isFinite(s.lastA))txt(ctx,'Timer: a = 2d/t² = '+Math.abs(s.lastA).toFixed(2)+' m/s²',28,108,{s:12.5*k,w:700,c:PAL['rj']});}

function drawPush(sim,ctx,k,hon){const p=sim.p,s=sim.st,GY=330,ppm=170,x0=110;
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,GY,800,450-GY);
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.beginPath();for(let m=0;m<=2;m+=0.5){const x=x0+m*ppm;ctx.moveTo(x,GY);ctx.lineTo(x,GY+12);}ctx.stroke();
  for(let m=0;m<=2;m+=0.5)txt(ctx,m.toFixed(1)+' m',x0+m*ppm,GY+28,{s:11*k,a:'center',c:PAL['cv-soft']});
  const s1=34+p.m1*13,s2=34+p.m2*13,b1=x0+s.x*ppm,b2=b1+s1/2+s2/2;
  block(ctx,b1,GY-s1/2,p.m1,'#3f6fb0','m₁',k);block(ctx,b2,GY-s2/2,p.m2,'#b0503f','m₂',k);
  if(p.F>0){const hx=b1-s1/2,shY=GY-78,lean=clamp(p.F/40,0.2,0.6),footX=hx-70-lean*20,hipX=footX+lean*14;
    ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(footX,GY);ctx.lineTo(hipX,GY-42);ctx.lineTo(footX-18,GY);ctx.moveTo(hipX,GY-42);ctx.lineTo(hx-18,shY);ctx.lineTo(hx-2,GY-s1*0.55);ctx.stroke();
    ctx.fillStyle=PAL['cv-ink'];ctx.beginPath();ctx.arc(hx-24,shY-13,10,0,6.29);ctx.fill();
    arrow(ctx,b1-26,GY-s1-12,clamp(p.F*4,14,52),0,PAL['s1'],4);txt(ctx,'F = '+p.F+' N',b1,GY-s1-24,{s:12*k,w:700,a:'center',c:PAL['s1']});}
  const P=live(sim).P;if(hon&&P>0.01){const cx=b1+s1/2;arrow(ctx,cx,GY-10,clamp(P*5,10,70),0,PAL['s5'],3);txt(ctx,'P = '+P.toFixed(1)+' N',cx+4,GY+46,{s:11.5*k,w:700,c:PAL['s5']});}}

function drawFBD(sim,ctx,k,hon){const p=sim.p,X=552,Y=18,W=238,H=296,m=live(sim);
  rr(ctx,X,Y,W,H,12);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,hon?'Free-body diagrams':'Forces on each mass',X+12,Y+22,{s:12.5*k,w:700});
  if(sim.st.phase==='pause'&&p.mode!=='push'){txt(ctx,'Run over: a mass is',X+W/2,Y+130,{s:12*k,a:'center',c:PAL['cv-soft']});txt(ctx,'resting on its stop.',X+W/2,Y+130+16*k,{s:12*k,a:'center',c:PAL['cv-soft']});txt(ctx,'Next run in a moment.',X+W/2,Y+130+32*k,{s:12*k,a:'center',c:PAL['cv-soft']});return;}
  const W1=p.m1*G,W2=p.m2*G,ap=atLeast('ap');let f1=[],f2=[];
  const lab=(b,h)=>hon?h:b;
  if(p.mode==='atwood'){f1=[[0,-m.T1,PAL['s3'],lab('String',ap?'T₁':'T')],[0,W1,PAL['s2'],lab('Gravity','m₁g')]];f2=[[0,-m.T2,PAL['s3'],lab('String',ap?'T₂':'T')],[0,W2,PAL['s2'],lab('Gravity','m₂g')]];}
  else if(p.mode==='table'){f1=[[0,W1,PAL['s2'],lab('Gravity','m₁g')],[0,-W1,PAL['s6'],lab('Table','N')],[m.T1,0,PAL['s3'],lab('String',ap?'T₁':'T')],[-(s_f(sim,m)),0,PAL['s4'],lab('Friction','f')]];
    f2=[[0,-m.T2,PAL['s3'],lab('String',ap?'T₂':'T')],[0,W2,PAL['s2'],lab('Gravity','m₂g')]];}
  else{f1=[[p.F,0,PAL['s1'],lab('Push','F')],[-m.P,0,PAL['s5'],lab('From m₂','P')]];f2=[[m.P,0,PAL['s5'],lab('From m₁','P')]];}
  const big=Math.max(1e-6,...f1.concat(f2).map(f=>Math.hypot(f[0],f[1]))),sc=(p.mode==='atwood'?72:58)/big;
  const one=(cx,cy,list,name)=>{txt(ctx,name,cx,Y+28+18*k,{s:12*k,w:700,a:'center'});
    list.forEach(([fx,fy,c,l])=>{const L=Math.hypot(fx,fy);if(L<0.005)return;const dx=fx*sc,dy=fy*sc,mn=Math.max(L*sc,10)/(L*sc),ex=dx*mn,ey=dy*mn;arrow(ctx,cx,cy,ex,ey,c,3);
      const val=L.toFixed(1)+' N',horiz=Math.abs(ey)<1,tx=horiz?cx+ex*0.6:cx,ty=horiz?cy+(ex>0?-9:20):cy+ey+(ey>0?15:-5);
      txt(ctx,l+' '+val,tx,ty,{s:10.5*k,a:'center',c:PAL['cv-ink']});});
    ctx.fillStyle=PAL['cv-ink'];ctx.beginPath();ctx.arc(cx,cy,5,0,6.29);ctx.fill();};
  one(X+74,Y+162,f1,'m₁');one(X+182,Y+162,f2,'m₂');
  const a=m.a,dir=p.mode==='push'||p.mode==='table'?'→':(a>0?'m₂ ↓':'m₁ ↓');
  txt(ctx,(Math.abs(a)<1e-6?'a = 0 (balanced)':'a = '+Math.abs(a).toFixed(2)+' m/s²  '+dir),X+12,Y+H-12,{s:12*k,w:700,c:PAL['s5']});}
function s_f(sim,m){return sim.p.mode==='table'&&sim.st.phase==='run'?m.f:0;}

/* ---------- Virtual lab (Mr. Colella, Physics Unit 3): F = ma Cart and Pulley Lab ----------
   A dynamics cart (0.300 kg, plus 0.125 kg bars in Part 2) on a level track is pulled by a hanging mass over a light pulley.
   a = (m g − μ M g) / (M + m), with rolling friction μ = 0.002 to 0.005 (each student's track differs a little).
   The detector samples velocity at 20 Hz with about 6 mm/s of noise; the hanging mass is caught after falling 0.60 m.
   Linear fit = least-squares slope of v against t over the run, as the graphing app reports it. Force (handout) = weight of the hanging mass, m g. */
const RB=window.RJBench,GA=9.8,FA_DT=0.05,FA_DROP=0.60;
function faRec(sim){const R=RB.rec(sim);if(!R.fa)R.fa={fits:{},n:0};return R.fa;}
const faMu=sim=>{const R=sim.vlab?sim.vlab.rng(61):RB.rng(61);return 0.002+0.003*R();};
const faCfg=sim=>sim.p.faPart==='p2'?{M:+sim.p.faC,m:0.020}:{M:0.300,m:+sim.p.faH/1000};
const faKey=c=>c.M.toFixed(3)+'|'+c.m.toFixed(3);
function faRun(sim,n){const c=faCfg(sim),mu=faMu(sim),R=sim.vlab?sim.vlab.rng(6100+n):RB.rng(6100+n),a=(c.m*GA-mu*c.M*GA)/(c.M+c.m)*(1+0.012*RB.gauss(R)),T=Math.sqrt(2*FA_DROP/a);
  const N=Math.floor(T/FA_DT),v=[];for(let i=0;i<=N;i++)v.push(RB.r3(a*i*FA_DT+0.006*RB.gauss(R)));return {c,a,T,v};}
const FAB={
  init(sim){return {run:false,t:0,r:null,fit:null};},
  step(sim,dt){const b=sim.st.B;if(!b.run)return;b.t+=dt;if(b.t>=b.r.T){b.t=b.r.T;b.run=false;}},
  draw(sim,ctx,vdt,k,t){const b=sim.st.B,K=Math.min(k,1.3),c=faCfg(sim),ppm=380,TX=80,TY=150,PX=TX+1.25*ppm;
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    const x=b.r?0.5*b.r.a*Math.pow(Math.min(b.t,b.r.T),2):0;
    ctx.fillStyle='#9aa3ad';ctx.fillRect(TX-20,TY,1.25*ppm+20,8);ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(TX-40,TY+8,1.25*ppm+60,6);
    ctx.fillStyle=PAL['cv-ink'];rr(ctx,TX-34,TY-34,22,26,4);ctx.fill();txt(ctx,'motion detector',TX-40,TY-42,{s:12*K,c:PAL['cv-soft']});
    // pulley clamped to the end of the track, string, hanging mass, floor
    const R=14,py=TY-8,cx=TX+30+x*ppm,hy=py+20+x*ppm;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(cx+40,TY-16);ctx.lineTo(PX,TY-16-0);ctx.arc(PX,py,R-6,-Math.PI/2,0);ctx.lineTo(PX+R-6,hy);ctx.stroke();
    ctx.fillStyle='#b9c1ca';ctx.beginPath();ctx.arc(PX,py,R-4,0,6.29);ctx.fill();ctx.strokeStyle='#4b535c';ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle='#3f6fb0';rr(ctx,cx-40,TY-30,80,24,5);ctx.fill();if(c.M>0.3){const nb=Math.round((c.M-0.3)/0.125);for(let i=0;i<nb;i++){ctx.fillStyle='#6d7682';ctx.fillRect(cx-36+i*24,TY-40,20,10);}}
    ctx.fillStyle=PAL['cv-ink'];[-24,24].forEach(w=>{ctx.beginPath();ctx.arc(cx+w,TY-4,5,0,6.29);ctx.fill();});txt(ctx,'cart '+c.M.toFixed(3)+' kg',cx,TY-46-(c.M>0.3?6:0),{s:12*K,a:'center',c:PAL['fg']});
    const hs=10+Math.sqrt(c.m*1000)*1.2;ctx.fillStyle='#b0503f';rr(ctx,PX+R-6-hs/2,hy,hs,hs*1.2,3);ctx.fill();txt(ctx,(c.m*1000).toFixed(0)+' g',PX+R-6-hs/2-6,hy+hs*0.7,{s:12*K,a:'right',c:PAL['fg']});
    const fl=py+20+FA_DROP*ppm+hs*1.2+6;ctx.fillStyle=PAL['cv-soft'];ctx.fillRect(PX-30,fl,80,5);txt(ctx,'catcher',PX+56,fl+5,{s:12*K,c:PAL['cv-soft']});
    // velocity graph and linear fit
    const L=40,Tp=250;RB.panel(ctx,20,Tp-22,470,212);const tmax=b.r?Math.max(1,Math.ceil(b.r.T)):3,vmax=b.r?Math.max(0.5,Math.ceil(b.r.a*b.r.T*5)/5):1;
    const ax=RB.axes(ctx,{L:L+38,T:Tp,W:390,H:140,cw:800,ch:450},{xmin:0,xmax:tmax,ymin:0,ymax:vmax,xl:'Time (s)',yl:'Velocity (m/s)'});
    if(b.r){const n=Math.min(b.r.v.length-1,Math.floor(b.t/FA_DT));RB.trace(ctx,ax,b.r.v.slice(0,n+1).map((v,i)=>({t:i*FA_DT,y:v})),'#3f6fb0',{w:1.5,dots:2.5,ymin:0,ymax:vmax});
      if(b.fit){ctx.strokeStyle='#d9573b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(clamp(b.fit.b,0,vmax)));ctx.lineTo(ax.X(b.r.T),ax.Y(clamp(b.fit.b+b.fit.m*b.r.T,0,vmax)));ctx.stroke();}}
    RB.lcd(ctx,600,236,184,62,'LINEAR FIT: SLOPE',b.fit?b.fit.m.toFixed(3)+' m/s²':'—',k,24);
    if(b.fit)RB.lcd(ctx,600,306,184,52,'INTERCEPT',b.fit.b.toFixed(3)+' m/s',k,20);
    txt(ctx,sim.p.faPart==='p2'?'Part 2: 20 g hanging, cart mass changes':'Part 1: cart 0.300 kg, hanging mass changes',24,34,{s:13*K,w:700,c:PAL['fg']});},
  narrate(sim){const b=sim.st.B;if(b.run)return 'The hanging mass pulls the cart along the track. The detector records the cart’s velocity 20 times a second.';
    if(b.r&&!b.fit)return 'Press <b>Linear fit</b> to fit a straight line to the velocity graph. Its slope is the acceleration.';
    if(b.fit)return 'The slope of the velocity graph is the acceleration: <b>'+b.fit.m.toFixed(3)+' m/s²</b>. Record it as one trial, then collect again for the next trial.';
    return 'Choose the masses, then press <b>Collect and release</b>. A teammate catches the hanging mass before it hits the floor.';},
  read(sim){const b=sim.st.B;return {fit:b.fit?RB.r3(b.fit.m):null,run:b.run,key:faKey(faCfg(sim))};}};
function faGo(sim){const b=RB.B(sim,'fma-cart');if(!b)return;const R=faRec(sim);R.n++;b.r=faRun(sim,R.n);b.t=0;b.run=true;b.fit=null;BioLab.play(sim);}
function faFit(sim){const b=RB.B(sim,'fma-cart');if(!b||!b.r||b.run)return;const F=RB.fit(b.r.v.map((v,i)=>({x:i*FA_DT,y:v})));b.fit={m:RB.r3(F.m),b:RB.r3(F.b)};
  const R=faRec(sim),k=faKey(b.r.c);(R.fits[k]=R.fits[k]||[]).push(b.fit.m);if(R.fits[k].length>12)R.fits[k].shift();if(sim.vlab)BioLab.vlab.save(sim);}
const P1R=[0.02,0.05,0.1,0.2],P2R=[0.3,0.425,0.55,0.675];
const faTrial=part=>(sim,rv,v)=>{const c=part===1?{M:0.3,m:+rv}:{M:+rv,m:0.02},F=faRec(sim).fits[faKey(c)]||[];
  if(!F.length)return 'Collect a run with '+(part===1?(c.m*1000).toFixed(0)+' g hanging':'a '+c.M.toFixed(3)+' kg cart')+' and fit its velocity graph first.';
  return F.some(f=>Math.abs(f-v)<=0.0015)?null:'That isn’t one of your fits for this setup. Your slopes: '+F.slice(-4).map(f=>f.toFixed(3)).join(', ')+' m/s².';};
const faAvg=tb=>(sim,rv,v)=>{const rows=tb==='p1'?P1R:P2R,r=rows.indexOf(+rv),a=['a1','a2','a3'].map(c=>sim.vlab.val(tb,c,r));if(!a.every(Number.isFinite))return 'Fill in all three trials first.';return Math.abs(v-(a[0]+a[1]+a[2])/3)<=0.002?null:'Add the three accelerations and divide by 3.';};
const faF=(sim,rv,v)=>Math.abs(v-(+rv)*GA)<=0.002?null:'Force = weight of the hanging mass = m g, with m in kg and g = 9.8 m/s².';
const faInv=(sim,rv,v)=>Math.abs(v-1/(+rv))<=0.01?null:'1/mass = 1 ÷ the cart’s mass in kg.';
function faLine(V){const P=P1R.map((x,r)=>({x:V.val('p1','F',r),y:V.val('p1','aavg',r)})).filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));return P.length>=2?RB.fit(P):null;}
const kN=(V,id)=>{const s=String(V.raw('k:'+id)||'').trim().replace(/,/,'.');return /^[-+]?(\d+\.?\d*|\.\d+)$/.test(s)?parseFloat(s):NaN;};
const trialCols=(part,tb)=>[{id:'a1',label:'Trial 1 accel (m/s²)',input:'number',check:faTrial(part)},{id:'a2',label:'Trial 2 accel (m/s²)',input:'number',check:faTrial(part)},{id:'a3',label:'Trial 3 accel (m/s²)',input:'number',check:faTrial(part)},{id:'aavg',label:'Average accel (m/s²)',input:'number',check:faAvg(tb)}];
const LAB_FA={id:'fma-cart',title:'F = ma Cart and Pulley Lab',course:'Physics',teachers:'Colella',level:'bio',
  source:{label:'F = ma Cart and Pulley Lab (Canvas)',href:'https://rjhs.instructure.com/courses/16601/assignments/619753'},
  purpose:'<p>Determine the relationship between force and acceleration for a given mass, and use this relationship to determine the mass of the object that is being accelerated. Then find how acceleration depends on mass.</p>',
  background:'<p>Newton’s second law determines the relationship between mass, force and acceleration. It tells us how much acceleration to expect from a given force applied to a given mass.</p>'+
    '<p>A hanging mass pulls the cart through a string over a pulley. In this lab we call the weight of the hanging mass, <b>F = mg</b>, the force. The motion detector records the cart’s velocity, and the slope of the velocity vs. time graph is the acceleration.</p>'+
    '<p><b>About the virtual bench.</b> The track is level, with a little rolling friction like a real one; each student’s track is slightly different. The detector’s velocity readings scatter a little, so three trials of the same setup give slightly different slopes. Press <b>Linear fit</b> after each run to fit the velocity graph, as in the graphing app.</p>',
  materials:['Dynamics cart (0.300 kg) and track','Pulley and track mount','String','Mass set with hanger','0.125 kg mass bars for the cart','Motion detector and graphing app (on the virtual bench)'],
  setup(sim){},
  controls:['faPart','faH','faC','fa-go','fa-fit'],
  steps:[
    {title:'Part 1: set up',text:'<p>Choose <b>Part 1</b>. The track is level and the cart sits at the far end from the pulley. Start with the <b>20 g</b> mass. Press <b>Collect and release</b>; your teammate catches the mass before it hits the floor. Then press <b>Linear fit</b> and read the slope: that is the acceleration.</p>',setup(sim){BioLab.setValues(sim,{faPart:'p1',faH:20});}},
    {title:'Part 1: collect',text:'<p>Do three trials with each hanging mass: 20 g, 50 g, 100 g and 200 g. Record each acceleration in the Part 1 table. Work out the force (the weight of the hanging mass, F = mg) and the average acceleration for each mass. Your graph of acceleration against force draws below.</p>',
      setup(sim){BioLab.setValues(sim,{faPart:'p1'});},done:sim=>P1R.every((x,r)=>['a1','a2','a3','aavg','F'].every(c=>sim.vlab.raw('c:p1:'+c+':'+r).trim()!=='')),doneHint:'Fill in every box in the Part 1 table.'},
    {title:'Part 2: collect',text:'<p>Choose <b>Part 2</b>. Use the <b>20 g</b> hanging mass every time and add mass bars to the cart one at a time: 0.300, 0.425, 0.550 and 0.675 kg. Do three trials at each cart mass and record them in the Part 2 table, with the average and 1/mass.</p>',
      setup(sim){BioLab.setValues(sim,{faPart:'p2',faC:'0.300'});},done:sim=>P2R.every((x,r)=>['a1','a2','a3','aavg','inv'].every(c=>sim.vlab.raw('c:p2:'+c+':'+r).trim()!=='')),doneHint:'Fill in every box in the Part 2 table.'},
    {title:'Analyze',text:'<p>Look at your three graphs. Find the slope of your acceleration vs. force graph with <b>Analyze this table in a spreadsheet</b> (add a linear trendline), use it to find the mass being accelerated, then answer the conclusion questions.</p>'}],
  tables:[{id:'p1',title:'Part 1: cart 0.300 kg, hanging mass changes',cols:[{id:'m',label:'Hanging mass (kg)',rows:P1R,rowLabels:['0.020','0.050','0.100','0.200']}].concat(trialCols(1,'p1'),[{id:'F',label:'Force F = mg (N)',input:'number',check:faF}])},
    {id:'p2',title:'Part 2: 20 g hanging, cart mass changes',cols:[{id:'M',label:'Mass of cart (kg)',rows:P2R,rowLabels:['0.300','0.425','0.550','0.675']}].concat(trialCols(2,'p2'),[{id:'inv',label:'1/mass of cart (1/kg)',input:'number',check:faInv}])}],
  graphs:[{type:'line',title:'Part 1: acceleration vs force',xl:'Force (N)',yl:'Acceleration (m/s²)',xmin:0,ymin:0,series:[{table:'p1',x:'F',y:'aavg',label:'Average acceleration'}]},
    {type:'line',title:'Part 2: acceleration vs mass of cart',xl:'Mass of cart (kg)',yl:'Acceleration (m/s²)',xmin:0,ymin:0,series:[{table:'p2',x:'M',y:'aavg',label:'Average acceleration'}]},
    {type:'line',title:'Part 2: acceleration vs 1/mass of cart',xl:'1/mass (1/kg)',yl:'Acceleration (m/s²)',xmin:0,ymin:0,series:[{table:'p2',x:'inv',y:'aavg',label:'Average acceleration'}]}],
  calcs:[{id:'k',label:'Slope of your acceleration vs. force best-fit line',unit:'1/kg',input:'number',check:(sim,v,V)=>{const F=faLine(V);return !F?'Fill in the Part 1 table first.':RB.rel(v,F.m,0.03)?null:'Your Part 1 data’s best-fit slope is close to '+F.m.toFixed(2)+'. Check your trendline.';}},
    {id:'mass',label:'Mass being accelerated = 1 ÷ slope',unit:'kg',input:'number',check:(sim,v,V)=>{const s=kN(V,'k');return !Number.isFinite(s)||!s?'Record the slope first.':RB.rel(v,1/s,0.012)?null:'a = F/m, so the slope of a against F is 1/m. Divide 1 by your slope.';}}],
  questions:[
    {id:'c1',n:'1',q:'<p>What does the graph tell you about the relationship between force and acceleration? For example, if I double the force, what would you expect to happen to the acceleration for a given mass?</p>'},
    {id:'c2',n:'2',q:'<p>When increasing the mass of the cart, which graph produced a linear graph? What does this tell you about the relationship between acceleration and mass? For example, if I double the mass of an object, what should happen to its acceleration?</p>'},
    {id:'c3',n:'3',q:'<p>Based on the two answers above, write an equation that says a = ______ to show the relationship between force, mass and acceleration. Justify your reasoning for writing the equation the way you did.</p>'},
    {id:'c4',n:'4',q:'<p>Compare the mass you found from your slope with the cart’s mass, 0.300 kg. The hanging mass speeds up too. What does that tell you about the mass the force is really accelerating?</p>'}]};
SIM.controls.push({id:'faPart',label:'Part',type:'seg',def:'p1',vlab:true,noTrial:true,options:[{v:'p1',l:'Part 1: change the force'},{v:'p2',l:'Part 2: change the cart mass'}],onChange(sim){BioLab.reset(sim);}},
  {id:'faH',label:'Hanging mass (Part 1)',type:'seg',def:20,vlab:true,noTrial:true,options:[20,50,100,200].map(g=>({v:g,l:g+' g'})),onChange(sim){BioLab.reset(sim);}},
  {id:'faC',label:'Mass of cart (Part 2)',type:'seg',def:'0.300',vlab:true,noTrial:true,options:['0.300','0.425','0.550','0.675'].map(m=>({v:m,l:m+' kg'})),onChange(sim){BioLab.reset(sim);}});
(SIM.actions=SIM.actions||[]).push({id:'fa-go',label:'Collect and release',primary:true,vlab:true,enabled:s=>{const b=RB.B(s,'fma-cart');return !!b&&!b.run;},run(sim){faGo(sim);}},
  {id:'fa-fit',label:'Linear fit',vlab:true,enabled:s=>{const b=RB.B(s,'fma-cart');return !!b&&!!b.r&&!b.run&&!b.fit;},run(sim){faFit(sim);}});
SIM.labs=(SIM.labs||[]).concat([LAB_FA]);
RB.attach(SIM,{'fma-cart':FAB});

BioLab.register(SIM);
})();
