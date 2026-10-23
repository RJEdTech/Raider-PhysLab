(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,FONT,RM,fmtNum}=BioLab.h;

/* Forces and motion. Three set-ups share one Newton's-second-law integrator (g = 9.8 m/s²).
   Push:  crate on a floor. At rest it stays put while |F| ≤ μs·N (static friction matches the push);
          once moving, kinetic friction μk·N opposes the velocity. a = (F + f)/m.
   Tug:   two teams pull a 100 kg cart on low-friction wheels; a = (F_right − F_left)/m. Win line at ±6 m.
   Fan:   fan cart on a 2.0 m track. Each fan pushes 0.40 N; cart 0.50 kg plus added mass; a = F/m.
          A photogate at 1.00 m times each run; measured a = 2d/t². The cart relaunches after each run. */
const G=9.8;
const SURF={none:{l:'Frictionless',mus:0,muk:0},ice:{l:'Ice',mus:0.10,muk:0.05},wood:{l:'Wood floor',mus:0.40,muk:0.30},carpet:{l:'Carpet',mus:0.70,muk:0.55}};
const FAN=0.40,CART=0.50,TRACK=2.0,GATE=1.0;
const MODE_CTL={applied:['push'],mass:['push'],surface:['push'],left:['tug'],right:['tug'],fans:['fan'],cartmass:['fan'],strobe:['fan']};
const MODE_TILE={fric:['push'],react:['push'],meas:['fan'],pred:['fan'],pos:['push','tug','fan']};

function arrow(ctx,x,y,dx,dy,col,w,head){const L=Math.hypot(dx,dy);if(L<2)return;head=head||Math.min(11,4+L*0.25);const ux=dx/L,uy=dy/L;
  ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=w||3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+dx-ux*head*0.8,y+dy-uy*head*0.8);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+dx,y+dy);ctx.lineTo(x+dx-ux*head-uy*head*0.55,y+dy-uy*head+ux*head*0.55);ctx.lineTo(x+dx-ux*head+uy*head*0.55,y+dy-uy*head-ux*head*0.55);ctx.closePath();ctx.fill();}
const mass=s=>s.p.mode==='push'?s.p.mass:s.p.mode==='tug'?100:CART+s.p.cartmass;
const appliedF=s=>s.p.mode==='push'?s.p.applied:s.p.mode==='tug'?(s.p.right-s.p.left):s.p.fans*FAN;

function syncMode(sim){const id=sim.def.id,m=sim.p.mode;
  for(const c of SIM.controls){const el=document.getElementById(id+'-'+c.id)||document.getElementById(id+'-'+c.id+'-l');if(!el)continue;const w=el.closest('.ctl');if(!w)continue;
    w.hidden=!atLeast(c.lvl)||(MODE_CTL[c.id]&&!MODE_CTL[c.id].includes(m));}
  for(const mt of SIM.metrics){const t=sim.ui.tiles&&sim.ui.tiles[mt.id];if(!t)continue;const tile=t.num.closest('.tile');tile.hidden=!atLeast(mt.lvl)||(MODE_TILE[mt.id]&&!MODE_TILE[mt.id].includes(m));}}

const SIM={
  id:'forces',hash:'forces',apUnit:2,order:1,tab:'Forces and motion',kind:'Simulation',
  card:'Push a crate, run a tug-of-war, or launch a fan cart, with a live free-body diagram for every force.',
  title:'Forces and motion: Newton’s laws',
  lede:{bio:'Push a crate, pull in a tug-of-war, or power a fan cart. Watch how the forces add up, and what the net force does to the motion.',
        honors:'Read every force from a live free-body diagram, see Newton’s third-law pairs, and test a = F_net/m with the fan cart and photogate.',
        ap:'Quantify static vs. kinetic friction, check F_net = ma against photogate data, and track position, velocity and acceleration together.'},
  scale:'Real sizes: a 50 kg crate is about the size of a moving box full of books; a fan cart is about 0.5 kg on a 2 m track.',
  timeScale:1,dtMax:0.004,prewarm:0,sampleDt:0.05,window:10,unit:'s',chChange:1.5,chReveal:5,
  controls:[
    {id:'mode',label:'Set-up',type:'seg',def:'push',lvl:'bio',options:[{v:'push',l:'Push a crate'},{v:'tug',l:'Tug-of-war'},{v:'fan',l:'Fan cart'}],noTrial:false,
     onChange(sim){BioLab.reset(sim);syncMode(sim);}},
    {id:'applied',label:'Your push',type:'range',min:-500,max:500,step:10,def:0,unit:' N',lvl:'bio',help:'Positive pushes right, negative pushes left.'},
    {id:'mass',label:'Mass of the crate',type:'range',min:10,max:200,step:10,def:50,unit:' kg',lvl:'bio'},
    {id:'surface',label:'Floor',type:'seg',def:'wood',lvl:'bio',options:[{v:'none',l:'No friction'},{v:'ice',l:'Ice'},{v:'wood',l:'Wood'},{v:'carpet',l:'Carpet'}]},
    {id:'left',label:'Left team pulls',type:'range',min:0,max:400,step:50,def:200,unit:' N',lvl:'bio'},
    {id:'right',label:'Right team pulls',type:'range',min:0,max:400,step:50,def:200,unit:' N',lvl:'bio'},
    {id:'fans',label:'Fans switched on',type:'range',min:0,max:4,step:1,def:2,unit:'',lvl:'bio',help:'Each fan pushes 0.40 N.'},
    {id:'cartmass',label:'Mass added to the cart',type:'range',min:0,max:1.5,step:0.25,def:0,unit:' kg',d:2,lvl:'bio',help:'The empty cart is 0.50 kg.'},
    {id:'strobe',label:'Strobe photo',type:'toggle',def:true,lvl:'bio',help:'Leaves an image of the cart every 0.2 s',noTrial:true}
  ],
  init(){return {x:0,v:0,a:0,f:0,won:null,pause:0,runT:0,gateT:null,lastA:NaN,strobe:[],lastStrobeT:-1,t:0};},
  step(sim,dt){const p=sim.p,s=sim.st,m=mass(sim);
    if(p.mode==='push'){const N=m*G,sf=SURF[p.surface],F=p.applied;
      if(Math.abs(s.v)<1e-9){s.v=0;if(Math.abs(F)<=sf.mus*N+1e-9){s.f=-F;s.a=0;}else{s.f=-Math.sign(F)*sf.muk*N;s.a=(F+s.f)/m;}}
      else{s.f=-Math.sign(s.v)*sf.muk*N;s.a=(F+s.f)/m;}
      let v1=s.v+s.a*dt;if(s.v!==0&&Math.sign(v1)!==Math.sign(s.v)&&Math.abs(F)<=sf.mus*N){v1=0;s.a=0;s.f=-F;}
      s.v=v1;s.x+=s.v*dt;}
    else if(p.mode==='tug'){const F=p.right-p.left;s.f=0;
      if(s.won){s.a=0;s.v=0;}else{s.a=F/m;s.v+=s.a*dt;s.x+=s.v*dt;if(Math.abs(s.x)>=6){s.x=Math.sign(s.x)*6;s.won=s.x>0?'right':'left';s.v=0;s.a=0;}}}
    else{const F=p.fans*FAN;s.f=0;
      if(s.pause>0){s.a=0;s.pause-=dt;if(s.pause<=0){s.x=0;s.v=0;s.runT=0;s.gateT=null;s.strobe=[];s.lastStrobeT=-1;}}
      else{s.a=F/m;s.v+=s.a*dt;s.x+=s.v*dt;s.runT+=dt;
        if(s.runT-s.lastStrobeT>=0.2-1e-9&&s.v>0){s.strobe.push(s.x);s.lastStrobeT=s.runT;if(s.strobe.length>30)s.strobe.shift();}
        if(s.gateT===null&&s.x>=GATE)s.gateT=s.runT;
        if(s.x>=TRACK){s.x=TRACK;s.v=0;s.a=0;s.pause=0.8;if(s.gateT)s.lastA=2*GATE/(s.gateT*s.gateT);}}}
    s.t+=dt;},
  metrics:[
    {id:'fnet',label:'Net force',unit:'N',lvl:'bio',d:1,get:s=>s.p.mode==='push'?(s.p.applied+s.st.f):s.p.mode==='tug'?(s.st.won?0:s.p.right-s.p.left):(s.st.pause>0?0:s.p.fans*FAN)},
    {id:'acc',label:'Acceleration',unit:'m/s²',lvl:'bio',d:2,max:null,get:s=>s.st.a},
    {id:'vel',label:'Velocity',unit:'m/s',lvl:'bio',d:2,max:null,get:s=>s.st.v},
    {id:'fric',label:'Friction on the crate',unit:'N',lvl:'bio',d:1,get:s=>s.p.mode==='push'?s.st.f:0},
    {id:'meas',label:'Measured a (photogate)',unit:'m/s²',lvl:'bio',d:2,get:s=>s.p.mode==='fan'?s.st.lastA:NaN},
    {id:'pred',label:'F_net ÷ m',unit:'m/s²',lvl:'honors',d:2,get:s=>s.p.mode==='fan'?s.p.fans*FAN/(CART+s.p.cartmass):NaN},
    {id:'react',label:'Crate pushes back on you',unit:'N',lvl:'honors',d:0,get:s=>s.p.mode==='push'?-s.p.applied:NaN},
    {id:'pos',label:'Position',unit:'m',lvl:'ap',d:2,max:null,get:s=>s.st.x}
  ],
  graphs:[{id:'vel',label:'Velocity',lines:['vel']},{id:'acc',label:'Acceleration',lines:['acc']},{id:'fnet',label:'Net force',lines:['fnet']},
          {id:'va',label:'Velocity and acceleration',lvl:'honors',lines:['vel','acc']},{id:'pos',label:'Position',lvl:'ap',lines:['pos']}],
  defaultGraph:'vel',
  onLevel(sim){syncMode(sim);},
  challenges:[
    {lvl:'bio',q:'You push a 50 kg crate on a wood floor with 100 N. What happens?',choices:['It slides slowly','It stays still: friction pushes back just as hard','It speeds up quickly'],correct:1,
     baseline:{mode:'push',surface:'wood',mass:50,applied:0},change:{applied:100},changeText:'Pushing with 100 N',watch:'vel',
     explain:{bio:'The floor can push back with static friction up to 0.40 × 490 N = 196 N. A 100 N push is less than that, so friction matches it exactly. The forces balance and the crate stays put.',
              honors:'Static friction is not a fixed number. It grows to match the push, up to μs·N = 0.40 × 490 N = 196 N. At 100 N it equals 100 N, so F_net = 0 and a = 0.'}},
    {lvl:'bio',q:'A crate is sliding on a frictionless floor while you push. You stop pushing. What does the crate do?',choices:['It stops right away','It keeps moving at a constant speed','It slowly comes to a stop'],correct:1,
     baseline:{mode:'push',surface:'none',mass:50,applied:100},change:{applied:0},changeText:'You let go',watch:'vel',
     explain:{bio:'With no friction and no push, nothing acts sideways on the crate, so its motion doesn’t change. It keeps sliding at the same speed. This is Newton’s first law: objects don’t need a force to keep moving.'}},
    {lvl:'bio',q:'In a tied tug-of-war (200 N each way), one more person joins the right team (now 300 N). What happens to the cart?',choices:['It moves right at a steady speed','It speeds up to the right','Nothing; the teams are still pulling'],correct:1,
     baseline:{mode:'tug',left:200,right:200},change:{right:300},changeText:'Right team now pulls 300 N',watch:'vel',reveal:4.2,
     explain:{bio:'The net force is 300 − 200 = 100 N to the right. A constant net force keeps changing the velocity, so the cart speeds up the whole time. Its speed graph is a rising line, not a flat one.'}},
    {lvl:'honors',q:'A 2-fan cart (0.50 kg) is running. You add 0.50 kg so the cart’s mass doubles. What happens to its acceleration?',choices:['It doubles','It stays the same','It is cut in half'],correct:2,
     baseline:{mode:'fan',fans:2,cartmass:0},change:{cartmass:0.5},changeText:'Cart mass doubled to 1.00 kg',watch:'acc',
     explain:{honors:'Same force, twice the mass: a = F/m = 0.80 N ÷ 1.00 kg = 0.80 m/s², half of the 1.60 m/s² before. Acceleration is inversely proportional to mass.'}},
    {lvl:'honors',q:'Pushing a 50 kg crate on wood, you raise your push from 180 N to 220 N and it breaks free. What happens to the friction force once it starts sliding?',choices:['Friction gets bigger','Friction gets smaller','Friction stays at 180 N'],correct:1,
     baseline:{mode:'push',surface:'wood',mass:50,applied:180},change:{applied:220},changeText:'Push raised to 220 N',watch:'fnet',
     explain:{honors:'Before sliding, static friction was 180 N. Once moving, kinetic friction is μk·N = 0.30 × 490 = 147 N. That’s less than the 196 N it took to break free. So the net force jumps to 220 − 147 = 73 N.'}},
    {lvl:'honors',instant:true,q:'You push a 200 kg fridge with 300 N, but it doesn’t move. How hard does the fridge push back on you?',choices:['0 N, because it isn’t moving','300 N','Less than 300 N, because the fridge is winning','1960 N, its weight'],correct:1,
     explain:{honors:'Newton’s third law: the force the fridge exerts on you is always equal and opposite to the force you exert on it, 300 N. That’s true whether or not anything moves. The fridge stays still because static friction from the floor balances your push on it.'}},
    {lvl:'ap',instant:true,q:'A 40 kg crate on a floor with μk = 0.30 is pushed horizontally with 200 N while sliding. What is its acceleration?',choices:['5.0 m/s²','2.1 m/s²','2.9 m/s²','0 m/s²'],correct:1,
     explain:{ap:'f_k = μk·m·g = 0.30 × 40 × 9.8 = 117.6 N. F_net = 200 − 117.6 = 82.4 N, and a = 82.4 / 40 = 2.06 m/s².'}},
    {lvl:'ap',q:'With 3 fans on an empty cart, predict the photogate acceleration, then run it.',choices:['0.80 m/s²','1.20 m/s²','2.40 m/s²','3.60 m/s²'],correct:2,
     baseline:{mode:'fan',fans:3,cartmass:0},change:{},changeText:'Cart running',watch:'acc',at:0.5,reveal:5,
     explain:{ap:'F = 3 × 0.40 = 1.20 N and m = 0.50 kg, so a = 2.40 m/s². The photogate at d = 1.00 m measures t = √(2d/a) = 0.913 s, which gives 2d/t² = 2.40 m/s².'}}
  ],
  narrate(sim){const p=sim.p,s=sim.st,m=mass(sim),hon=atLeast('honors'),v=Math.abs(s.v).toFixed(2);
    if(p.mode==='push'){const N=m*G,sf=SURF[p.surface],F=p.applied,fnet=F+s.f,smax=(sf.mus*N).toFixed(0);
      if(s.v===0&&F===0)return 'Nothing pushes sideways, so the crate sits still. Gravity pulls it down and the floor pushes up just as hard.';
      if(s.v===0)return '<b>The crate isn’t moving.</b> Static friction pushes back with exactly '+Math.abs(F)+' N, matching your push, so the net force is zero. '+(sf.mus>0?'You would need more than '+smax+' N to break it free.':'');
      if(Math.abs(fnet)<0.5&&s.v!==0)return '<b>Balanced forces:</b> your push equals friction, so the net force is zero and the crate keeps moving at a steady '+v+' m/s. Zero net force means no <i>change</i> in motion, not no motion.';
      if(F===0&&sf.muk===0)return '<b>No push, no friction:</b> nothing changes the crate’s motion, so it coasts at '+v+' m/s. That’s Newton’s first law.';
      const speeding=Math.sign(fnet)===Math.sign(s.v)||s.v===0;
      return 'Net force '+Math.abs(fnet).toFixed(0)+' N on '+m+' kg gives '+(hon?'a = F<sub>net</sub>/m = ':'an acceleration of ')+Math.abs(s.a).toFixed(2)+' m/s². The crate is <b>'+(speeding?'speeding up':'slowing down')+'</b> ('+v+' m/s).';}
    if(p.mode==='tug'){const F=p.right-p.left;
      if(s.won)return '<b>The '+s.won+' team wins!</b> Their side pulled harder, so the net force pointed their way the whole time.';
      if(F===0)return 'Both teams pull '+p.left+' N. The forces cancel, so the net force is zero and the cart’s motion doesn’t change.';
      return 'Net force: '+Math.abs(F)+' N to the <b>'+(F>0?'right':'left')+'</b>. On a 100 kg cart that is '+(Math.abs(F)/100).toFixed(2)+' m/s² of acceleration, so the cart keeps speeding up.';}
    const F=p.fans*FAN;
    if(p.fans===0)return 'All fans are off. No force acts along the track, so the cart stays at rest.';
    return p.fans+' fan'+(p.fans>1?'s':'')+' push with '+F.toFixed(2)+' N on a '+m.toFixed(2)+' kg cart: a = F/m = <b>'+(F/m).toFixed(2)+' m/s²</b>.'+(isFinite(s.lastA)?' The photogate measured '+s.lastA.toFixed(2)+' m/s².':'');},
  tour:[
    {title:'Forces are pushes and pulls',text:{bio:'Every arrow in the box at the right is a force acting on the crate: your push, friction, gravity and the floor pushing up. Longer arrows are bigger forces.',honors:'The free-body diagram shows every force on the crate as an arrow from one dot. Arrow lengths are drawn to scale and update every frame.'},
     focus:[548,14,246,224],pause:true,setup(sim){BioLab.setValues(sim,{mode:'push',surface:'wood',mass:50,applied:0});}},
    {title:'A gentle push: static friction',text:'Push with 100 N. The crate doesn’t budge. Static friction grows to match your push exactly, so the forces balance.',focus:[[150,190,330,150],[548,14,246,224]],speed:0.5,
     setup(sim){BioLab.setValues(sim,{applied:100});}},
    {title:'Push harder: it breaks free',text:'At 250 N the push beats the most static friction can give (196 N). The crate starts sliding, and friction drops to the kinetic value, 147 N.',focus:[[150,190,330,150],[548,14,246,224]],speed:0.5,
     setup(sim){BioLab.setValues(sim,{applied:250});}},
    {title:'Balanced forces, steady motion',text:'Now the push is turned down to exactly 147 N, equal to kinetic friction. Net force zero, so the crate keeps sliding at a constant speed. It doesn’t stop.',focus:[[16,14,250,70],[548,14,246,224]],speed:0.5,
     setup(sim){BioLab.setValues(sim,{applied:147});}},
    {title:'Let go',text:'With no push, friction is the only sideways force, so the crate slows to a stop.',focus:[150,190,330,150],speed:0.5,setup(sim){BioLab.setValues(sim,{applied:0});}},
    {title:'Tug-of-war',text:'Two teams pull in opposite directions. Only the difference matters: 300 N right minus 200 N left is a 100 N net force to the right.',focus:[20,150,760,210],speed:0.7,
     setup(sim){BioLab.setValues(sim,{mode:'tug',left:200,right:300});}},
    {title:'Fan cart: a = F/m',text:'Each fan pushes 0.40 N. The strobe images get farther apart as the cart speeds up, and the photogate measures the acceleration. Compare it with F ÷ m.',focus:[40,150,560,220],speed:0.4,
     setup(sim){BioLab.setValues(sim,{mode:'fan',fans:2,cartmass:0,strobe:true});}},
    {lvl:'honors',title:'Third-law pairs',text:'Back to the crate. Your hands push the crate right with 200 N; the crate pushes your hands left with 200 N. These two forces act on <i>different</i> objects, so they never cancel each other.',
     focus:[150,190,330,150],speed:0.5,setup(sim){BioLab.setValues(sim,{mode:'push',applied:200,surface:'carpet',mass:50});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'push',applied:0,surface:'wood',mass:50});syncMode(sim);},
  lab:{bio:'<p><b>Question:</b> How does the force on a cart affect its acceleration?</p><ol><li>Choose Fan cart. Keep the added mass at 0.</li><li>Record a trial with 1, 2, 3 and 4 fans after each photogate reading appears.</li><li>Plot fans or F_net (x) against measured acceleration (y) on the Trials graph.</li></ol><p>Write a claim about force and acceleration, backed by your data.</p>',
       honors:'<p><b>Question:</b> How does mass affect acceleration when the force stays the same?</p><ol><li>Fan cart, 2 fans. Record the measured a for added mass 0, 0.25, 0.50, 1.00 and 1.50 kg.</li><li>Calculate the total mass and 1/m for each trial.</li><li>Graph a against 1/m and find the slope.</li></ol><p>What should the slope equal? Compare it with the fans’ total force.</p>',
       ap:'<p><b>Question:</b> What is the coefficient of kinetic friction between the crate and each floor?</p><ol><li>Push mode, 50 kg. For each floor, find the push that keeps the crate sliding at constant velocity (net force ≈ 0).</li><li>Repeat with 100 kg and 150 kg.</li><li>Plot that push against the normal force mg.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why the slope of your graph is μk, and why the push needed to <i>start</i> the crate is larger.</p>'},
  terms:[{t:'Force',d:'A push or pull, measured in newtons (N).'},{t:'Net force',d:'All the forces added together, with direction. It decides how the motion changes.'},{t:'Friction',d:'A force from a surface that resists sliding.'},{t:'Newton’s first law',d:'With no net force, an object keeps doing what it was doing: staying still or moving at a constant velocity.'},
    {lvl:'honors',t:'Newton’s second law',d:'a = F_net / m. More net force means more acceleration; more mass means less.'},{lvl:'honors',t:'Newton’s third law',d:'When A pushes on B, B pushes back on A just as hard, in the opposite direction.'},{lvl:'honors',t:'Free-body diagram',d:'A sketch of one object showing every force acting on it as an arrow.'},
    {lvl:'ap',t:'Static vs. kinetic friction',d:'Static friction adjusts up to μs·N to prevent sliding; kinetic friction is μk·N once sliding, and μk < μs.'},{lvl:'ap',t:'Normal force',d:'The push of a surface, perpendicular to it. On a level floor with no other vertical forces, N = mg.'}],
  about:'<p>One-dimensional Newton’s-second-law model, g = 9.8 m/s², integrated in 4 ms steps.</p><ul><li><b>Push:</b> static friction matches the applied force up to μs·mg; above that the crate slides with kinetic friction μk·mg opposing the velocity. Coefficients are typical values (ice 0.10/0.05, wood 0.40/0.30, carpet 0.70/0.55).</li><li><b>Tug-of-war:</b> a 100 kg cart on frictionless wheels; team forces are set directly.</li><li><b>Fan cart:</b> each fan gives a constant 0.40 N; no air drag or rolling friction; the photogate computes a = 2d/t² from the time to cover 1.00 m.</li></ul><p>Simplified: forces switch on instantly, people don’t slip, and there is no air resistance.</p>',
  initVis(sim){sim.vis.fan=0;},
  draw(sim,ctx,vdt,k,t){const p=sim.p,s=sim.st,hon=atLeast('honors'),ap=atLeast('ap');
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    const GY=330;
    if(p.mode==='push')drawPush(sim,ctx,k,t,GY,hon);else if(p.mode==='tug')drawTug(sim,ctx,k,t,GY);else drawFan(sim,ctx,vdt,k,t,hon);
    // readout box
    rr(ctx,16,16,232,62,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
    const kb=Math.min(k,1.3);txt(ctx,'⏱ '+sim.t.toFixed(2)+' s',28,40,{s:14*kb,w:700});
    txt(ctx,'v = '+s.v.toFixed(2)+' m/s   a = '+s.a.toFixed(2)+' m/s²',28,64,{s:12.5*kb,c:PAL['cv-soft']});
    drawFBD(sim,ctx,k,hon,ap);},
  thumbSetup(sim){BioLab.setValues(sim,{applied:250});}
};

function drawFBD(sim,ctx,k,hon,ap){k=Math.min(k,1.3);const p=sim.p,s=sim.st,m=mass(sim);
  const X=552,Y=18,W=238,H=216;rr(ctx,X,Y,W,H,12);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,hon?'Free-body diagram':'Forces on the '+(p.mode==='push'?'crate':'cart'),X+12,Y+22,{s:12.5*k,w:700});
  const cx=X+W/2,cy=Y+104;
  const W_=m*G,N_=W_;let fx=[];
  if(p.mode==='push'){fx=[{v:p.applied,c:PAL['s1'],l:hon?'F_app':'Push'},{v:s.f,c:PAL['s4'],l:hon?(s.v===0?'f_s':'f_k'):'Friction'}];}
  else if(p.mode==='tug'){fx=[{v:p.right,c:PAL['s1'],l:hon?'F_R':'Right team'},{v:-p.left,c:PAL['s2'],l:hon?'F_L':'Left team'}];}
  else{fx=[{v:p.fans*FAN,c:PAL['s1'],l:hon?'F_fan':'Fans'}];}
  const fnet=fx.reduce((a,b)=>a+b.v,0)*(p.mode==='tug'&&s.won?0:1);
  const big=Math.max(W_,...fx.map(f=>Math.abs(f.v)),1),sc=60/big;
  const len=v=>Math.sign(v)*Math.max(Math.abs(v)*sc,Math.abs(v)>0.005?22:0);
  arrow(ctx,cx,cy,0,len(W_),PAL['s2'],3);arrow(ctx,cx,cy,0,-len(N_),PAL['s3'],3);
  txt(ctx,(hon?'F_g ':'Gravity ')+W_.toFixed(p.mode==='fan'?1:0)+' N',cx+8,cy+len(W_)-2,{s:11.5*k,c:PAL['cv-ink']});
  txt(ctx,(hon?'F_N ':'Floor up ')+N_.toFixed(p.mode==='fan'?1:0)+' N',cx+8,cy-len(N_)+12,{s:11.5*k,c:PAL['cv-ink']});
  fx.forEach((f,i)=>{if(Math.abs(f.v)<0.005)return;const L=len(f.v),yy=cy-6+i*12;arrow(ctx,cx,yy,L,0,f.c,3);
    txt(ctx,f.l+' '+Math.abs(f.v).toFixed(p.mode==='fan'?2:0)+' N',cx+L+(L>0?4:-4),yy-6,{s:11.5*k,a:L>0?'left':'right',c:PAL['cv-ink']});});
  ctx.fillStyle=PAL['cv-ink'];ctx.beginPath();ctx.arc(cx,cy,5,0,6.29);ctx.fill();
  const nl=len(fnet);
  txt(ctx,(hon?'F_net = ':'Net force: ')+Math.abs(fnet).toFixed(p.mode==='fan'?2:0)+' N'+(Math.abs(fnet)<0.005?', balanced':''),X+12,Y+H-24,{s:12*k,w:700,c:PAL['s5']});
  if(Math.abs(fnet)>0.005)arrow(ctx,cx,Y+H-10,nl,0,PAL['s5'],3);}

function drawPush(sim,ctx,k,t,GY,hon){const p=sim.p,s=sim.st,sf=SURF[p.surface];const ppm=70,cx=330;
  // floor scrolls with the crate
  const floorCol={none:'#9fc3e6',ice:'#cfe8f3',wood:'#c99a63',carpet:'#8a5a7a'}[p.surface];
  ctx.fillStyle=floorCol;ctx.fillRect(0,GY,800,450-GY);
  ctx.strokeStyle='rgba(0,0,0,.18)';ctx.lineWidth=1;const off=((-s.x*ppm)%ppm+ppm)%ppm;
  ctx.beginPath();for(let x=off-ppm;x<820;x+=ppm){ctx.moveTo(x,GY);ctx.lineTo(x,450);}ctx.stroke();
  for(let i=-6;i<=6;i++){const mx=Math.round(s.x)+i,x=cx+(mx-s.x)*ppm;if(x<10||x>540)continue;txt(ctx,mx+' m',x,GY+22,{s:11*k,a:'center',c:'#2b2b2b'});}
  txt(ctx,sf.l+(sf.mus?'  (μs '+sf.mus.toFixed(2)+', μk '+sf.muk.toFixed(2)+')':''),20,440,{s:12*k,w:600,c:'#1d1d1d'});
  // crate
  const size=62+p.mass*0.32,fridge=p.mass>=150;const bx=cx-size/2,by=GY-size*(fridge?1.35:1);const bw=size,bh=GY-by;
  ctx.fillStyle=fridge?'#e8ecef':'#b07a40';rr(ctx,bx,by,bw,bh,fridge?8:3);ctx.fill();ctx.strokeStyle=fridge?'#8a949b':'#6d4a22';ctx.lineWidth=2;ctx.stroke();
  if(fridge){ctx.beginPath();ctx.moveTo(bx,by+bh*0.38);ctx.lineTo(bx+bw,by+bh*0.38);ctx.stroke();ctx.fillStyle='#8a949b';ctx.fillRect(bx+bw-12,by+12,4,bh*0.2);ctx.fillRect(bx+bw-12,by+bh*0.45,4,bh*0.3);}
  else{ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx+bw,by+bh);ctx.moveTo(bx+bw,by);ctx.lineTo(bx,by+bh);ctx.stroke();}
  txt(ctx,p.mass+' kg',cx,by+(fridge?bh*0.2:bh*0.5)+5,{s:13*k,w:700,a:'center',c:fridge?'#33393f':'#fff'});
  // person pushing from the side the force comes from
  const F=p.applied;if(F!==0){const side=F>0?-1:1,hx=side<0?bx:bx+bw,lean=clamp(Math.abs(F)/400,0.15,0.75);
    const footX=hx+side*(60+lean*30),hipX=footX-side*lean*14,shY=GY-82,shX=hx+side*18;
    ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();
    ctx.moveTo(footX,GY);ctx.lineTo(hipX,GY-44);ctx.lineTo(footX+side*20,GY);ctx.moveTo(hipX,GY-44);ctx.lineTo(shX,shY);ctx.lineTo(hx+side*2,GY-size*0.55);ctx.stroke();
    ctx.fillStyle=PAL['cv-ink'];ctx.beginPath();ctx.arc(shX+side*6,shY-14,10,0,6.29);ctx.fill();
    if(hon){const ay=GY-size*0.55-10;arrow(ctx,hx-side*4,ay,-side*44,0,PAL['s1'],3);arrow(ctx,hx+side*4,ay+16,side*44,0,PAL['s4'],3);
      txt(ctx,'A',hx-side*52,ay+4,{s:12*k,w:700,a:side<0?'left':'right',c:PAL['s1']});txt(ctx,'B',hx+side*52,ay+20,{s:12*k,w:700,a:side<0?'right':'left',c:PAL['s4']});
      txt(ctx,'Newton’s third-law pair',20,104,{s:12*k,w:700});
      txt(ctx,'A  hands push the crate: '+Math.abs(F)+' N '+(F>0?'→':'←'),20,124,{s:11.5*k,w:600,c:PAL['s1']});
      txt(ctx,'B  crate pushes the hands: '+Math.abs(F)+' N '+(F>0?'←':'→'),20,142,{s:11.5*k,w:600,c:PAL['s4']});
      txt(ctx,'Equal and opposite, on different objects',20,160,{s:11*k,c:PAL['cv-soft']});}}
  // friction arrow along floor
  if(Math.abs(s.f)>0.5){arrow(ctx,cx,GY-6,clamp(s.f*0.35,-120,120),0,PAL['s4'],4);}
  // speed lines
  if(Math.abs(s.v)>0.05&&!RM){ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.globalAlpha=clamp(Math.abs(s.v)/3,0.2,0.8);const d=-Math.sign(s.v);
    for(let i=0;i<3;i++){const y=by+bh*(0.3+i*0.2);ctx.beginPath();ctx.moveTo(cx+d*(bw/2+8),y);ctx.lineTo(cx+d*(bw/2+8+18+i*6),y);ctx.stroke();}ctx.globalAlpha=1;}}

function drawTug(sim,ctx,k,t,GY){const p=sim.p,s=sim.st,ppm=30,cx0=330,cx=cx0+s.x*ppm;
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,GY,800,450-GY);
  // field lines
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;for(const m of [-6,0,6]){const x=cx0+m*ppm;ctx.setLineDash(m?[6,5]:[]);ctx.beginPath();ctx.moveTo(x,GY-6);ctx.lineTo(x,GY+40);ctx.stroke();}ctx.setLineDash([]);
  txt(ctx,'Left wins',cx0-6*ppm,GY+58,{s:12*k,a:'center',c:PAL['cv-soft']});txt(ctx,'Right wins',cx0+6*ppm,GY+58,{s:12*k,a:'center',c:PAL['cv-soft']});
  // cart
  ctx.fillStyle='#d9b26b';rr(ctx,cx-34,GY-48,68,34,6);ctx.fill();ctx.strokeStyle='#8a6a2c';ctx.lineWidth=2;ctx.stroke();
  for(const dx of [-20,20]){ctx.fillStyle='#333';ctx.beginPath();ctx.arc(cx+dx,GY-8,8,0,6.29);ctx.fill();}
  ctx.strokeStyle='#555';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx,GY-48);ctx.lineTo(cx,GY-98);ctx.stroke();ctx.fillStyle='#C11430';ctx.beginPath();ctx.moveTo(cx,GY-98);ctx.lineTo(cx+26,GY-90);ctx.lineTo(cx,GY-82);ctx.fill();
  txt(ctx,'100 kg',cx,GY-26,{s:11*k,a:'center',w:700,c:'#3a2a10'});
  // ropes and people
  const team=(n,side,col)=>{ctx.strokeStyle='#9c7a46';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx+side*34,GY-32);ctx.lineTo(cx+side*(60+n*34),GY-40);ctx.stroke();
    for(let i=0;i<n;i++){const x=cx+side*(70+i*34),lean=0.35;ctx.strokeStyle=col;ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();
      ctx.moveTo(x,GY);ctx.lineTo(x+side*lean*20,GY-40);ctx.lineTo(x+side*(lean*20+14),GY-74);ctx.moveTo(x+side*lean*20,GY-40);ctx.lineTo(x+side*20,GY);ctx.moveTo(x+side*(lean*20+10),GY-64);ctx.lineTo(x-side*8,GY-42);ctx.stroke();
      ctx.fillStyle=col;ctx.beginPath();ctx.arc(x+side*(lean*20+18),GY-84,9,0,6.29);ctx.fill();}};
  team(Math.round(p.left/100),-1,PAL['s2']);team(Math.round(p.right/100),1,PAL['s1']);
  const AY=GY-128;if(p.left)arrow(ctx,cx-6,AY,-clamp(p.left*0.3,14,120),0,PAL['s2'],4);if(p.right)arrow(ctx,cx+6,AY,clamp(p.right*0.3,14,120),0,PAL['s1'],4);
  txt(ctx,p.left+' N',cx-10,AY-10,{s:13*k,w:700,a:'right',c:PAL['s2']});txt(ctx,p.right+' N',cx+10,AY-10,{s:13*k,w:700,c:PAL['s1']});
  if(s.won)pill(ctx,(s.won==='right'?'Right':'Left')+' team wins!',cx0,120,PAL['rj'],'#fff',15*k);}

function drawFan(sim,ctx,vdt,k,t,hon){const p=sim.p,s=sim.st;const x0=60,ppm=230,TY=330;
  sim.vis.fan=(sim.vis.fan||0)+vdt*(p.fans?30:0);
  // track and ruler
  ctx.fillStyle=PAL['cv-ruler'];ctx.fillRect(x0-14,TY,TRACK*ppm+40,16);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.strokeRect(x0-14,TY,TRACK*ppm+40,16);
  ctx.beginPath();for(let c=0;c<=200;c+=5){const x=x0+c/100*ppm,h=c%50===0?14:c%10===0?9:5;ctx.moveTo(x,TY+16);ctx.lineTo(x,TY+16+h);}ctx.stroke();
  for(let c=0;c<=200;c+=50)txt(ctx,(c/100).toFixed(1)+' m',x0+c/100*ppm,TY+44,{s:11*k,a:'center',c:PAL['cv-soft']});
  ctx.fillStyle=PAL['cv-glass'];ctx.fillRect(x0+TRACK*ppm+6,TY-40,10,40);
  // photogate
  const gx=x0+GATE*ppm;ctx.fillStyle='#3a3e45';ctx.fillRect(gx-4,TY-92,8,92);ctx.fillRect(gx-4,TY-96,30,8);ctx.strokeStyle='rgba(220,40,40,.6)';ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(gx,TY-60);ctx.lineTo(gx+22,TY-60);ctx.stroke();ctx.setLineDash([]);
  txt(ctx,'Photogate',gx,TY-104,{s:11.5*k,a:'center',w:600});
  if(s.gateT!==null||isFinite(s.lastA))txt(ctx,'t = '+(s.gateT!==null?s.gateT:Math.sqrt(2*GATE/s.lastA)).toFixed(3)+' s',gx+30,TY-84,{s:12*k,w:700,c:PAL['rj']});
  // strobe ghosts
  if(p.strobe){for(const sx of s.strobe){const gx2=x0+sx*ppm;ctx.strokeStyle=PAL['s6'];ctx.lineWidth=1.5;ctx.globalAlpha=0.55;ctx.beginPath();ctx.moveTo(gx2,TY-2);ctx.lineTo(gx2,TY+16);ctx.stroke();ctx.globalAlpha=1;ctx.fillStyle=PAL['s6'];ctx.beginPath();ctx.arc(gx2,TY-2,3.5,0,6.29);ctx.fill();}
    if(s.strobe.length>1&&hon){for(let i=1;i<s.strobe.length;i++){const a=x0+s.strobe[i-1]*ppm,b=x0+s.strobe[i]*ppm;if(b-a<20)continue;txt(ctx,((s.strobe[i]-s.strobe[i-1])*100).toFixed(0),(a+b)/2,TY+64,{s:10*k,a:'center',c:PAL['cv-soft']});}
      txt(ctx,'cm moved in each 0.2 s',x0,TY+80,{s:10.5*k,c:PAL['cv-soft']});}}
  drawCart(ctx,x0+s.x*ppm,TY,sim.vis.fan,p.fans,p,false);
  if(p.fans>0)arrow(ctx,x0+s.x*ppm,TY-84,clamp(p.fans*FAN*45,20,70),0,PAL['s1'],4);
  txt(ctx,'Cart '+(CART+p.cartmass).toFixed(2)+' kg · '+p.fans+' fan'+(p.fans===1?'':'s')+' × 0.40 N',x0,150,{s:13*k,w:700});
  if(isFinite(s.lastA))txt(ctx,'Last run: a = 2d/t² = '+s.lastA.toFixed(2)+' m/s²',x0,172,{s:12.5*k,c:PAL['cv-soft']});}
function drawCart(ctx,x,TY,spin,fans,p,ghost){ctx.save();ctx.translate(x,TY);ctx.scale(1.3,1.3);
  ctx.fillStyle=ghost?PAL['cv-soft']:'#2d6bd2';rr(ctx,-34,-30,68,22,5);ctx.fill();
  for(const dx of [-22,22]){ctx.fillStyle=ghost?PAL['cv-soft']:'#222';ctx.beginPath();ctx.arc(dx,-5,6,0,6.29);ctx.fill();}
  if(ghost){ctx.restore();return;}
  // fan housings along the back half of the cart, blowing to the left
  for(let i=0;i<4;i++){const on=i<fans,fx=-24+i*15,fy=-40;ctx.fillStyle=on?'#3a3e45':'rgba(128,128,128,.25)';rr(ctx,fx-6,fy-9,12,18,3);ctx.fill();
    if(on){ctx.save();ctx.translate(fx,fy);ctx.scale(1,Math.abs(Math.cos(spin+i))*0.9+0.1);ctx.fillStyle='#cfd5dc';ctx.fillRect(-1.5,-8,3,16);ctx.restore();}}
  // added masses stacked at the front
  const nm=Math.round(p.cartmass/0.25);for(let i=0;i<nm;i++){ctx.fillStyle='#8a8f96';rr(ctx,26-12,-36-i*5.5,16,5,1.5);ctx.fill();ctx.strokeStyle='#5c626a';ctx.lineWidth=0.8;ctx.stroke();}
  ctx.restore();
  if(fans>0&&!RM){ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.globalAlpha=0.6;for(let i=0;i<3;i++){const y=TY-62+i*8,o=(spin*6+i*9)%18;ctx.beginPath();ctx.moveTo(x-48-o,y);ctx.lineTo(x-60-o,y);ctx.stroke();}ctx.globalAlpha=1;}}

BioLab.register(SIM);
})();
