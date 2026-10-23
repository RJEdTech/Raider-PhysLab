(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,FONT,axes,legend,serColor,fmtNum}=BioLab.h;
const G=9.8, D2R=Math.PI/180, TAU=2*Math.PI;

/* ---------- seesaw ---------- */
const BEAM_M=20, BEAM_L=4, PIV_H=0.5, SPX=160, PV=[400,320];
const LIM=Math.asin(PIV_H/(BEAM_L/2));
function ssTau(p){return {L:p.mL*G*p.dL,R:p.mR*G*p.dR};}
function ssNet(p){const t=ssTau(p),n=t.R-t.L;return Math.abs(n)<0.5?0:n;}   // + = right side goes down
function ssI(p){return BEAM_M*BEAM_L*BEAM_L/12+p.mL*p.dL*p.dL+p.mR*p.dR*p.dR;}
function ssState(sim){const n=ssNet(sim.p);if(sim.p.hold)return n===0?'Balanced (held)':'Held level';return n===0?'Balanced':n>0?'Tips right':'Tips left';}

/* ---------- wrench ---------- */
const WPX=900, BOLT=[190,250];
function wNeed(p){return atLeast('honors')?p.need:40;}
function wTau(p){return p.r*p.F*Math.sin(p.ang*D2R);}
function wTurns(p){return wTau(p)>=wNeed(p)-1e-9&&wTau(p)>0;}

/* ---------- ladder (AP) ---------- */
const LAD_L=5, LAD_M=15, PER_M=70, LPX=68, WALLX=600, FLOORY=405;
function ladF(p,x){const th=p.lang*D2R;return G*Math.cos(th)*(LAD_M/2+PER_M*x)/Math.sin(th);}   // wall push = friction needed
function ladN(){return (LAD_M+PER_M)*G;}
function ladMax(p){return p.mu*ladN();}

let curMode='seesaw';
const GRAPHS=[{id:'gss',label:'Torques on each side',mode:'seesaw',custom:true},
  {id:'gwr',label:'Torque vs angle of push',mode:'wrench',custom:true},
  {id:'glad',label:'Friction needed as the climber goes up',mode:'ladder',lvl:'ap',custom:true}];
const MODECTL={seesaw:['mL','dL','mR','dR','hold'],wrench:['F','r','ang','need'],ladder:['lang','mu','x']};
const MODEACT={seesaw:['puzzle'],wrench:[],ladder:['climb']};
function applyMode(sim){curMode=sim.p.mode;if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.mode;
  TQ.metrics.forEach(m=>{const t=sim.ui.tiles&&sim.ui.tiles[m.id];if(!t)return;const tile=t.num.closest('.tile');if(tile)tile.hidden=!(atLeast(m.lvl)&&m.mode===mode);});
  TQ.controls.forEach(c=>{if(c.id==='mode')return;const e=sim.ui.sec.querySelector('#torque-'+c.id)||sim.ui.sec.querySelector('#torque-'+c.id+'-l');const w=e&&e.closest('.ctl');if(w)w.hidden=!(atLeast(c.lvl)&&MODECTL[mode].includes(c.id));});
  const btns=sim.ui.ctrls?sim.ui.ctrls.querySelectorAll('.actions button'):[];TQ.actions.forEach((a,i)=>{if(btns[i])btns[i].hidden=!(MODEACT[mode].includes(a.id)&&atLeast(a.lvl||'bio'));});
  const gm=sim.ui.gm;if(gm){const go=TQ.graphs.filter(g=>atLeast(g.lvl||'bio'));gm.innerHTML=go.map(g=>`<option value="${g.id}">${g.label}</option>`).join('');
    if(!go.find(g=>g.id===sim.gMetric))sim.gMetric=go.length?go[0].id:undefined;if(sim.gMetric)gm.value=sim.gMetric;}}
const relevel=sim=>{if(sim.st){sim.st.phi=0;sim.st.om=0;}};
const rewrench=sim=>{if(sim.st)sim.st.turn=0;};
const reladder=sim=>{if(sim.st){sim.st.fall=0;sim.st.x=sim.p.x;sim.st.climbing=false;}};

const TQ={
  id:'torque',hash:'torque',apUnit:5,order:1,tab:'Torque and balance',kind:'Simulation',
  card:'Balance a seesaw, loosen a stubborn bolt and find out when a ladder slips. Torque is force times lever arm.',
  title:'Torque and balance',
  lede:{bio:'A small push far from the pivot can beat a big push close to it. Balance a seesaw and loosen a bolt to see how where and which way you push matters as much as how hard.',
        honors:'Torque τ = rF sinθ measures how strongly a force turns something. An object is balanced when the torques in each direction cancel (Στ = 0).',
        ap:'Static equilibrium needs both ΣF = 0 and Στ = 0. Apply both to a ladder leaning on a frictionless wall to find how much floor friction keeps it from slipping.'},
  scale:'The seesaw is a 4 m, 20 kg plank on a 0.5 m pivot, with masses of 5–60 kg (children to adults). The wrench is up to 40 cm long. The ladder is 5 m long and 15 kg; the climber is 70 kg.',
  timeScale:1,dtMax:0.01,sampleDt:0.05,window:10,unit:'s',chChange:1.5,chReveal:4,
  get graphs(){return GRAPHS.filter(g=>g.mode===curMode);},
  controls:[
    {id:'mode',label:'Experiment',type:'seg',def:'seesaw',lvl:'bio',options:[{v:'seesaw',l:'Seesaw'},{v:'wrench',l:'Wrench'},{v:'ladder',l:'Ladder',lvl:'ap'}],
     onChange(sim){BioLab.reset(sim);applyMode(sim);}},
    {id:'mL',label:'Left mass',type:'range',min:5,max:60,step:5,def:30,unit:' kg',lvl:'bio',onChange:relevel},
    {id:'dL',label:'Left mass distance from pivot',type:'range',min:0.25,max:2,step:0.25,def:1.5,unit:' m',lvl:'bio',onChange:relevel},
    {id:'mR',label:'Right mass',type:'range',min:5,max:60,step:5,def:30,unit:' kg',lvl:'bio',onChange:relevel},
    {id:'dR',label:'Right mass distance from pivot',type:'range',min:0.25,max:2,step:0.25,def:1.5,unit:' m',lvl:'bio',onChange:relevel},
    {id:'hold',label:'Hold the plank level with supports',type:'toggle',def:false,lvl:'bio',help:'Set up the masses, predict, then remove the supports.',onChange:relevel},
    {id:'F',label:'Push',type:'range',min:0,max:200,step:10,def:100,unit:' N',lvl:'bio',onChange:rewrench},
    {id:'r',label:'Where you push (distance from bolt)',type:'range',min:0,max:0.4,step:0.05,def:0.3,unit:' m',lvl:'bio',onChange:rewrench},
    {id:'ang',label:'Angle between push and handle',type:'range',min:0,max:180,step:5,def:90,unit:'°',lvl:'bio',onChange:rewrench},
    {id:'need',label:'Torque needed to loosen the bolt',type:'range',min:10,max:80,step:5,def:40,unit:' N·m',lvl:'honors',onChange:rewrench},
    {id:'lang',label:'Ladder angle with the floor',type:'range',min:40,max:80,step:1,def:65,unit:'°',lvl:'ap',onChange:reladder},
    {id:'mu',label:'Floor friction coefficient μs',type:'range',min:0,max:1,step:0.05,def:0.4,lvl:'ap',onChange:reladder},
    {id:'x',label:'Climber position up the ladder',type:'range',min:0,max:1,step:0.05,def:0.2,unit:'',lvl:'ap',help:'0 = bottom, 1 = top.',onChange:reladder}
  ],
  actions:[{id:'puzzle',label:'New balance puzzle',primary:true,run(sim){const opts=[];
      for(let mL=10;mL<=60;mL+=5)for(let dL=0.5;dL<=2;dL+=0.25)for(let mR=10;mR<=60;mR+=5){const dR=mL*dL/mR;if(mR!==mL&&dR>=0.25&&dR<=2&&Math.abs(dR*4-Math.round(dR*4))<1e-9)opts.push([mL,dL,mR,dR]);}
      const o=opts[Math.floor(Math.random()*opts.length)];let wrong=o[3]+(Math.random()<0.5?-0.5:0.5);if(wrong<0.25||wrong>2)wrong=o[3]>1?o[3]-0.75:o[3]+0.75;
      sim.st.answer=o[3];BioLab.setValues(sim,{mL:o[0],dL:o[1],mR:o[2],dR:wrong,hold:true});}},
    {id:'climb',label:'Climb',primary:true,lvl:'ap',run(sim){const s=sim.st;s.fall=0;s.x=0;s.climbing=true;sim.running=true;}}],
  init(sim){curMode=sim.p.mode;return {phi:0,om:0,turn:0,fall:0,x:sim.p.x,climbing:false,answer:null};},
  step(sim,dt){const s=sim.st,p=sim.p;
    if(p.mode==='seesaw'){if(p.hold){s.phi=0;s.om=0;return;}const n=ssNet(p);
      if(n===0&&Math.abs(s.om)<1e-9)return;
      s.om+=n*Math.cos(s.phi)/ssI(p)*dt;s.phi+=s.om*dt;if(Math.abs(s.phi)>=LIM){s.phi=Math.sign(s.phi)*LIM;s.om=0;}}
    else if(p.mode==='wrench'){if(wTurns(p)){s.turn+=Math.min(1.2,0.25+(wTau(p)-wNeed(p))/60)*dt;if(s.turn>0.6)s.turn=0;}}
    else{if(s.climbing&&s.fall===0){s.x=Math.min(0.95,s.x+0.12*dt);if(s.x>=0.95)s.climbing=false;}
      if(ladF(p,s.x)>ladMax(p)+1e-9)s.fall=Math.min(1,s.fall+dt/1.3);}},
  metrics:[
    {id:'ss',label:'Seesaw',mode:'seesaw',lvl:'bio',text:true,get:s=>ssState(s)},
    {id:'tL',label:'Left torque (mass × g × distance)',unit:'N·m',mode:'seesaw',lvl:'bio',min:0,max:1200,d:0,get:s=>ssTau(s.p).L},
    {id:'tR',label:'Right torque',unit:'N·m',mode:'seesaw',lvl:'bio',min:0,max:1200,d:0,get:s=>ssTau(s.p).R},
    {id:'tN',label:'Net torque (clockwise +)',unit:'N·m',mode:'seesaw',lvl:'honors',min:-1200,max:1200,d:0,get:s=>ssNet(s.p)},
    {id:'wt',label:'Bolt',mode:'wrench',lvl:'bio',text:true,get:s=>wTau(s.p)<=0?'No turning effect':wTurns(s.p)?'Turning':'Stuck'},
    {id:'tau',label:'Torque on the bolt',unit:'N·m',mode:'wrench',lvl:'bio',min:0,max:80,d:1,get:s=>wTau(s.p)},
    {id:'rp',label:'Lever arm r⊥ = r sinθ',unit:'m',mode:'wrench',lvl:'honors',min:0,max:0.4,d:3,get:s=>s.p.r*Math.sin(s.p.ang*D2R)},
    {id:'lst',label:'Ladder',mode:'ladder',lvl:'ap',text:true,get:s=>ladF(s.p,s.st.x)>ladMax(s.p)+1e-9?'Slips':'Holds'},
    {id:'fn',label:'Friction needed (= wall push)',unit:'N',mode:'ladder',lvl:'ap',min:0,max:1000,d:0,get:s=>ladF(s.p,s.st.x)},
    {id:'fm',label:'Friction available μs·N',unit:'N',mode:'ladder',lvl:'ap',min:0,max:1000,d:0,get:s=>ladMax(s.p)},
    {id:'nf',label:'Floor normal force N',unit:'N',mode:'ladder',lvl:'ap',min:0,max:1000,d:0,get:s=>ladN()}
  ],
  defaultGraph:'gss',
  plot(sim,ctx,box,id){const p=sim.p,s=sim.st;
    if(id==='gss'){const t=ssTau(p),mx=Math.max(400,t.L,t.R)*1.15;const ax=axes(ctx,box,{xmin:0,xmax:2,ymin:0,ymax:mx,yl:'Torque (N·m)',xcats:['Left (counterclockwise)','Right (clockwise)']});
      [[t.L,0],[t.R,1]].forEach(([v,i])=>{const x=ax.X(i+0.5),w=box.W*0.22;ctx.fillStyle=serColor(i===0?1:0);ctx.fillRect(x-w/2,ax.Y(v),w,ax.Y(0)-ax.Y(v));
        txt(ctx,fmtNum(v,0)+' N·m',x,ax.Y(v)-6,{s:13,w:700,a:'center'});});
      txt(ctx,ssNet(p)===0?'Equal: balanced':'Unequal: it turns toward the bigger torque',box.L+box.W/2,box.T+14,{s:13,c:PAL['muted'],a:'center'});return;}
    if(id==='gwr'){const nd=wNeed(p),ymax=Math.max(nd,p.F*Math.max(p.r,0.05))*1.2;const ax=axes(ctx,box,{xmin:0,xmax:180,ymin:0,ymax,xl:'Angle between push and handle (°)',yl:'Torque (N·m)'});
      ctx.strokeStyle=serColor(0);ctx.lineWidth=2.5;ctx.beginPath();for(let a=0;a<=180;a+=2){const y=p.r*p.F*Math.sin(a*D2R);a?ctx.lineTo(ax.X(a),ax.Y(y)):ctx.moveTo(ax.X(a),ax.Y(y));}ctx.stroke();
      ctx.strokeStyle=PAL['muted'];ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(box.L,ax.Y(nd));ctx.lineTo(box.L+box.W,ax.Y(nd));ctx.stroke();ctx.setLineDash([]);
      txt(ctx,'needed to loosen: '+nd+' N·m',box.L+box.W-8,ax.Y(nd)+16,{s:12,c:PAL['muted'],a:'right'});
      ctx.fillStyle=PAL['g-dot'];ctx.beginPath();ctx.arc(ax.X(p.ang),ax.Y(wTau(p)),6,0,TAU);ctx.fill();
      legend(ctx,box.L+12,box.T+14,[{color:serColor(0),label:'τ = rF sinθ at '+fmtNum(p.F,0)+' N, '+fmtNum(p.r,2)+' m'}]);return;}
    if(id==='glad'){const ymax=Math.max(ladF(p,1),ladMax(p))*1.15;const ax=axes(ctx,box,{xmin:0,xmax:1,ymin:0,ymax,xl:'Climber position (0 = bottom, 1 = top)',yl:'Force (N)'});
      ctx.strokeStyle=serColor(0);ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(ladF(p,0)));ctx.lineTo(ax.X(1),ax.Y(ladF(p,1)));ctx.stroke();
      ctx.strokeStyle=serColor(2);ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(ladMax(p)));ctx.lineTo(ax.X(1),ax.Y(ladMax(p)));ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle=PAL['g-dot'];ctx.beginPath();ctx.arc(ax.X(s.x),ax.Y(ladF(p,s.x)),6,0,TAU);ctx.fill();
      const xs=(ladMax(p)/G*Math.sin(p.lang*D2R)/Math.cos(p.lang*D2R)-LAD_M/2)/PER_M;if(xs>0&&xs<1){ctx.strokeStyle=PAL['s1'];ctx.beginPath();ctx.moveTo(ax.X(xs),box.T);ctx.lineTo(ax.X(xs),box.T+box.H);ctx.stroke();txt(ctx,'slips past here',ax.X(xs)+6,box.T+box.H-8,{s:12,c:PAL['s1']});}
      legend(ctx,box.L+12,box.T+14,[{color:serColor(0),label:'Friction needed'},{color:serColor(2),label:'Most friction the floor can give',dash:true}]);}},
  narrate(sim){const p=sim.p,s=sim.st;
    if(p.mode==='seesaw'){const t=ssTau(p),n=ssNet(p);
      if(p.hold)return '<b>Predict:</b> the supports hold the plank level. Left torque '+(atLeast('honors')?'= '+p.mL+' kg × 9.8 × '+p.dL+' m = '+fmtNum(t.L,0)+' N·m':'is '+fmtNum(t.L,0)+' N·m')+'. Move the right mass to where you think it balances, then turn the supports off to test.';
      if(n===0)return '<b>Balanced.</b> '+p.mL+' kg at '+p.dL+' m turns it as strongly as '+p.mR+' kg at '+p.dR+' m. Each side’s torque is '+fmtNum(t.L,0)+' N·m, so they cancel'+(p.mL!==p.mR?': the heavier mass sits closer to the pivot.':'.');
      return '<b>'+(n>0?'Right':'Left')+' side goes down.</b> Its torque ('+fmtNum(Math.max(t.L,t.R),0)+' N·m) beats the other side’s ('+fmtNum(Math.min(t.L,t.R),0)+' N·m). Torque depends on both the weight and its distance from the pivot.';}
    if(p.mode==='wrench'){const tau=wTau(p),nd=wNeed(p);
      if(p.F===0)return 'No push, no torque.';
      if(p.r===0)return '<b>Pushing right at the bolt does nothing.</b> With no distance from the pivot there is no lever arm, so the torque is zero however hard you push.';
      if(Math.sin(p.ang*D2R)<0.01)return '<b>Pushing along the handle does nothing.</b> The force points straight through the bolt, so its lever arm is zero.';
      return (tau>=nd?'<b>The bolt turns.</b> ':'<b>Stuck.</b> ')+'Torque = '+(atLeast('honors')?fmtNum(p.r,2)+' m × '+p.F+' N × sin '+p.ang+'° = ':'')+fmtNum(tau,1)+' N·m; the bolt needs '+nd+' N·m.'+(p.ang!==90?' Pushing at 90° to the handle would give the most torque.':' A 90° push gives the most torque for a given force.');}
    const f=ladF(p,s.x),fm=ladMax(p);
    if(s.fall>0)return '<b>The ladder slips.</b> With the climber at '+fmtNum(s.x*100,0)+'% of the way up, the wall pushes out with '+fmtNum(f,0)+' N, but the floor can only grip with '+fmtNum(fm,0)+' N of friction.';
    return '<b>In equilibrium.</b> ΣF = 0: floor normal force '+fmtNum(ladN(),0)+' N balances both weights, and friction ('+fmtNum(f,0)+' N needed, up to '+fmtNum(fm,0)+' N available) balances the wall’s push. Στ = 0 about the foot sets the size of the wall’s push.';},
  tour:[
    {title:'A pivot and a plank',text:'The plank balances on a pivot in the middle. A mass on either side tries to turn the plank: left side counterclockwise, right side clockwise.',focus:[60,180,680,200],pause:true,setup(sim){BioLab.setValues(sim,{mode:'seesaw',mL:30,dL:1.5,mR:30,dR:1.5,hold:false});}},
    {title:'Distance matters',text:'Use the ruler on the plank. Equal masses at equal distances balance. Slide one mass outward and that side wins, even though neither mass changed.',focus:[60,180,680,200],speed:0.5,setup(sim){BioLab.setValues(sim,{dR:2});}},
    {title:'Heavier and closer can balance lighter and farther',text:{bio:'A 60 kg adult 1 m from the pivot balances a 30 kg child 2 m away. Twice the mass at half the distance gives the same turning effect.',honors:'τ = mgd: 60 × 9.8 × 1 = 30 × 9.8 × 2 = 588 N·m on each side. Στ = 0, so the plank is balanced.'},focus:[60,180,680,200],speed:1,setup(sim){BioLab.setValues(sim,{mL:30,dL:2,mR:60,dR:1});}},
    {title:'The wrench',text:'Torque also explains wrenches. The bolt only turns when your push makes at least the needed torque. Push farther from the bolt to get more torque from the same force.',focus:[60,60,560,380],speed:1,setup(sim){BioLab.setValues(sim,{mode:'wrench',F:100,r:0.3,ang:90});}},
    {title:'Which way you push matters',text:{bio:'Push at a slant and less of your push goes into turning. Push straight along the handle and nothing happens at all.',honors:'Only the part of the force perpendicular to the handle turns the bolt: τ = rF sinθ. The dashed line shows the lever arm r⊥ = r sinθ.'},focus:[60,60,560,380],speed:1,setup(sim){BioLab.setValues(sim,{ang:35});}},
    {title:'Pushing at the bolt',text:'Push right at the bolt (distance 0) and no amount of force will turn it. Doors have handles far from the hinges for the same reason.',focus:[120,140,220,220],speed:1,setup(sim){BioLab.setValues(sim,{ang:90,r:0});}},
    {lvl:'ap',title:'The leaning ladder',text:'A ladder rests on a frictionless wall. Torques about its foot set how hard the wall pushes out; floor friction must match that push. Press Climb and watch the needed friction grow.',focus:[180,40,560,400],speed:1,setup(sim){BioLab.setValues(sim,{mode:'ladder',lang:65,mu:0.4,x:0.2});sim.st.climbing=true;}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'seesaw',mL:30,dL:1.5,mR:30,dR:1.5,hold:false,r:0.3,ang:90,F:100});BioLab.reset(sim);},
  challenges:[
    {lvl:'bio',q:'A 20 kg child sits 2 m left of the pivot and a 40 kg child sits 2 m right, so the plank tips right. The 40 kg child moves in to 1 m. What happens?',
     choices:['It balances','It still tips right','It tips left'],correct:0,baseline:{mode:'seesaw',mL:20,dL:2,mR:40,dR:2,hold:false},change:{dR:1},changeText:'Moved to 1 m',watch:'gss',
     explain:{bio:'Twice the mass at half the distance gives the same turning effect: 20 kg × 2 m = 40 kg × 1 m. The torques cancel and the plank stays level.',honors:'τ = mgd: 20 × 9.8 × 2 = 392 N·m on the left and 40 × 9.8 × 1 = 392 N·m on the right. Στ = 0.'}},
    {lvl:'bio',q:'You push the wrench with 150 N, 30 cm from the bolt, and it turns. Now you push just as hard, right at the bolt. What happens?',
     choices:['It turns the same','It turns faster','It does not turn'],correct:2,baseline:{mode:'wrench',F:150,r:0.3,ang:90,need:40},change:{r:0},changeText:'Pushing at the bolt',watch:'gwr',
     explain:'Torque is force times distance from the pivot. At the bolt the distance is zero, so the torque is zero no matter how hard you push. That is why door handles are far from the hinges.'},
    {lvl:'bio',q:'A 120 N push 20 cm from the bolt is not enough to loosen it. You move your hand out to 40 cm and push just as hard. Does it turn?',
     choices:['Yes','No'],correct:0,baseline:{mode:'wrench',F:120,r:0.2,ang:90,need:40},change:{r:0.4},changeText:'Hand moved to 40 cm',watch:'gwr',
     explain:'Doubling the distance doubles the torque, from 24 to 48 N·m, which beats the 40 N·m the bolt needs. A longer wrench (or a pipe over the handle) gives you more torque from the same force.'},
    {lvl:'honors',q:'Two 30 kg children balance 1.5 m from the pivot. The right child slides out to 2 m. What happens?',
     choices:['The right side goes down','The left side goes down','It stays balanced'],correct:0,baseline:{mode:'seesaw',mL:30,dL:1.5,mR:30,dR:1.5,hold:false},change:{dR:2},changeText:'Right child at 2 m',watch:'gss',
     explain:'The right torque grows from 441 to 588 N·m while the left stays at 441 N·m. The net torque is clockwise, so the right side goes down even though the masses are equal.'},
    {lvl:'honors',q:'You push with 150 N at 90°, 30 cm from the bolt, and it turns (45 N·m; it needs 40). You push just as hard at 30° to the handle instead. Does it still turn?',
     choices:['Yes, the same','Yes, but slower','No, it gets stuck'],correct:2,baseline:{mode:'wrench',F:150,r:0.3,ang:90,need:40},change:{ang:30},changeText:'Push at 30°',watch:'gwr',
     explain:'τ = rF sinθ = 0.3 × 150 × sin 30° = 22.5 N·m, half as much, and less than the 40 N·m needed. Only the part of the force perpendicular to the handle turns it.'},
    {lvl:'ap',q:'A ladder at 65° on a floor with μs = 0.3 holds with the 70 kg climber 20% of the way up. The climber goes to 90% of the way up. What happens?',
     choices:['It slips','It still holds'],correct:0,baseline:{mode:'ladder',lang:65,mu:0.3,x:0.2},change:{x:0.9},changeText:'Climber at 90%',watch:'glad',
     explain:'Torques about the foot: N<sub>wall</sub>L sinθ = (m/2 + Mx)gL cosθ. As x grows, the wall pushes harder (98 N → 322 N), and friction must match it. The floor can give at most μsN = 0.3 × 833 = 250 N, so the ladder slips.'},
    {lvl:'ap',q:'A ladder at 50° with μs = 0.3 slips when the climber is 70% of the way up. It is stood up more steeply, at 75°. Does it hold now?',
     choices:['Yes, it holds','No, it still slips'],correct:0,baseline:{mode:'ladder',lang:50,mu:0.3,x:0.7},change:{lang:75},changeText:'Ladder at 75°',watch:'glad',
     explain:'Friction needed = g cot θ (m/2 + Mx). Going from 50° to 75° drops cot θ from 0.84 to 0.27, so the friction needed falls from 465 N to 148 N, below the 250 N available. That is why ladder labels say to use a steep angle (about 75°).'}
  ],
  lab:{bio:'<p><b>Question:</b> What combinations of mass and distance balance?</p><ol><li>Put 30 kg at 2 m on the left.</li><li>For right masses of 30, 40, 60 kg, find the distance that balances. Record a trial each time.</li><li>Use New balance puzzle three times. Predict before you remove the supports.</li></ol><p>Find the rule: what do mass and distance multiply to?</p>',
       honors:'<p><b>Question:</b> How does the angle of a push change its torque?</p><ol><li>With the wrench at F = 100 N and r = 0.3 m, record the torque at angles 0–180° every 30°.</li><li>Graph torque against sinθ.</li></ol><p>Explain the shape with τ = rF sinθ. At what angles does the bolt turn?</p>',
       ap:'<p><b>Question:</b> What is the smallest safe ladder angle?</p><ol><li>Set μs = 0.4 and the climber at the top (x = 1).</li><li>Lower the angle until the ladder slips. Record the angle. Repeat for μs = 0.2, 0.6, 0.8.</li><li>Derive tan θ<sub>min</sub> = (m/2 + M)/(μs(m + M)) and compare.</li></ol>'},
  terms:[{t:'Torque',d:'The turning effect of a force. Bigger force, farther from the pivot, or pushing more squarely all give more torque. Units: N·m.'},{t:'Pivot (fulcrum)',d:'The point something turns around.'},{t:'Lever arm',d:'The distance from the pivot to the line the force acts along.'},{t:'Balanced',d:'The turning effects in each direction cancel, so nothing starts to rotate.'},
    {lvl:'honors',t:'τ = rF sinθ',d:'Torque from a force F applied a distance r from the pivot at angle θ to the lever.'},{lvl:'honors',t:'Rotational equilibrium',d:'Στ = 0: clockwise torques equal counterclockwise torques.'},
    {lvl:'ap',t:'Static equilibrium',d:'ΣF = 0 and Στ = 0 together, so the object neither moves nor starts to turn.'},{lvl:'ap',t:'Static friction limit',d:'f ≤ μsN. If equilibrium needs more friction than this, the object slips.'}],
  about:'<p><b>Seesaw:</b> a uniform 20 kg, 4 m plank pivots at its center 0.5 m above the floor, so its own weight makes no torque. The masses are points sitting on the plank. With the supports removed, the plank turns with α = τ<sub>net</sub>/I until an end reaches the floor. Torques within 0.5 N·m are treated as balanced.</p><p><b>Wrench:</b> the bolt turns at a steady rate whenever τ = rF sinθ reaches the torque it needs. <b>Ladder:</b> a uniform 5 m, 15 kg ladder on a frictionless wall, with a 70 kg climber. Equilibrium gives N = (m + M)g and N<sub>wall</sub> = g cotθ (m/2 + Mx), which friction must supply.</p>',
  onLevel(sim){applyMode(sim);},
  initVis(sim){applyMode(sim);},
  draw(sim,ctx,vdt,k,t){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);const kk=Math.min(k,1.3);
    if(sim.p.mode==='seesaw')drawSeesaw(sim,ctx,kk,t);else if(sim.p.mode==='wrench')drawWrench(sim,ctx,kk,t);else drawLadder(sim,ctx,kk,t);}
};

function tag(ctx,s,x,y,o){o=Object.assign({s:12,w:600},o);ctx.font=o.w+' '+o.s+'px '+FONT;const w=ctx.measureText(s).width,a=o.a||'left',x0=a==='right'?x-w:a==='center'?x-w/2:x;
  ctx.globalAlpha=0.85;rr(ctx,x0-4,y-o.s,w+8,o.s+6,4);ctx.fillStyle=PAL['card'];ctx.fill();ctx.globalAlpha=1;txt(ctx,s,x,y,o);}
function arrow(ctx,x,y,dx,dy,col,w){const L=Math.hypot(dx,dy);if(L<2)return;ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=w||3;const an=Math.atan2(dy,dx),hl=Math.min(11,L*0.5);
  ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+dx-hl*0.7*Math.cos(an),y+dy-hl*0.7*Math.sin(an));ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+dx,y+dy);ctx.lineTo(x+dx-hl*Math.cos(an-0.45),y+dy-hl*Math.sin(an-0.45));ctx.lineTo(x+dx-hl*Math.cos(an+0.45),y+dy-hl*Math.sin(an+0.45));ctx.closePath();ctx.fill();}
function curved(ctx,cx,cy,R,a0,a1,col,lbl,k){ctx.strokeStyle=col;ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,R,a0,a1,a1<a0);ctx.stroke();
  const ex=cx+R*Math.cos(a1),ey=cy+R*Math.sin(a1),tan=a1+(a1>a0?Math.PI/2:-Math.PI/2);ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(ex+9*Math.cos(tan),ey+9*Math.sin(tan));
  ctx.lineTo(ex+6*Math.cos(tan+2.3),ey+6*Math.sin(tan+2.3));ctx.lineTo(ex+6*Math.cos(tan-2.3),ey+6*Math.sin(tan-2.3));ctx.closePath();ctx.fill();}

function drawSeesaw(sim,ctx,k,t){const s=sim.st,p=sim.p,[px,py]=PV,half=BEAM_L/2*SPX,floorY=py+PIV_H*SPX;
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,floorY,800,450-floorY);
  // supports
  if(p.hold){ctx.fillStyle=PAL['cv-lamp'];[px-half+20,px+half-60].forEach(x=>{rr(ctx,x,py+6,40,floorY-py-6,4);ctx.fill();});}
  // pivot
  ctx.fillStyle=PAL['cv-lamp'];ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px-40,floorY);ctx.lineTo(px+40,floorY);ctx.closePath();ctx.fill();
  ctx.save();ctx.translate(px,py);ctx.rotate(s.phi);
  // plank with ruler
  ctx.fillStyle=PAL['cv-ruler'];rr(ctx,-half,-6,2*half,18,3);ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.stroke();
  for(let d=-2;d<=2+1e-9;d+=0.25){const x=d*SPX,big=Math.abs(d*2-Math.round(d*2))<1e-9;ctx.beginPath();ctx.moveTo(x,-6);ctx.lineTo(x,big?-1:-3);ctx.stroke();
    if(big&&d!==0&&Math.abs(d)<2)txt(ctx,fmtNum(Math.abs(d),1),x,9,{s:11*k,c:PAL['cv-soft'],a:'center'});}
  txt(ctx,'2 m',2*SPX-14,9,{s:11*k,c:PAL['cv-soft'],a:'center'});txt(ctx,'2 m',-2*SPX+14,9,{s:11*k,c:PAL['cv-soft'],a:'center'});
  const box=(d,m,col)=>{const w=34+26*Math.cbrt(m/10),h=w*0.9,x=d*SPX;ctx.fillStyle=col;rr(ctx,x-w/2,-6-h,w,h,5);ctx.fill();txt(ctx,m+' kg',x,-6-h/2+4,{s:12*k,w:700,c:'#fff',a:'center'});return h;};
  const hL=box(-p.dL,p.mL,PAL['s2']),hR=box(p.dR,p.mR,PAL['s1']);
  ctx.restore();
  // weight arrows from each mass (drawn in world frame, straight down)
  const wpos=(d,h)=>{const o=-12;return [px+d*SPX*Math.cos(s.phi)+o*Math.sin(s.phi),py+d*SPX*Math.sin(s.phi)-o*Math.cos(s.phi)];};
  [[-p.dL,p.mL,hL,PAL['s2']],[p.dR,p.mR,hR,PAL['s1']]].forEach(([d,m,h,c])=>{const [x,y]=wpos(d,h),len=Math.min(m*G*0.2,440-y);arrow(ctx,x,y,0,len,c,3.5);
    ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,4,0,TAU);ctx.fill();tag(ctx,'weight '+fmtNum(m*G,0)+' N',x+(d<0?8:-8),y+len-4,{s:12*k,c,a:d<0?'left':'right'});});
  // distance labels
  const dy=140;
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(px,py-6);ctx.lineTo(px,dy-6);ctx.stroke();ctx.setLineDash([]);
  [[-p.dL,PAL['s2']],[p.dR,PAL['s1']]].forEach(([d,c])=>{const x=px+d*SPX;ctx.strokeStyle=c;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(px,dy);ctx.lineTo(x,dy);ctx.moveTo(x,dy-5);ctx.lineTo(x,dy+5);ctx.stroke();
    txt(ctx,fmtNum(Math.abs(d),2)+' m',(px+x)/2,dy-7,{s:12*k,c,a:'center',w:600});});
  // torque arrows around the pivot
  const tq=ssTau(p),sc=v=>clamp(0.25+v/900,0.25,1.4);
  curved(ctx,px,py,46,-Math.PI/2,-Math.PI/2-sc(tq.L),PAL['s2']);curved(ctx,px,py,46,-Math.PI/2,-Math.PI/2+sc(tq.R),PAL['s1']);
  // readout card
  const hon=atLeast('honors');rr(ctx,12,12,290,hon?92:70,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,'Left: '+fmtNum(tq.L,0)+' N·m   Right: '+fmtNum(tq.R,0)+' N·m',24,38,{s:13.5*k,w:700});
  const st=ssState(sim);txt(ctx,st,24,62,{s:14*k,w:700,c:ssNet(p)===0?PAL['s3']:PAL['s4']});
  if(hon)txt(ctx,'τ = m·g·d   Net = '+fmtNum(ssNet(p),0)+' N·m',24,86,{s:12*k,c:PAL['cv-soft']});
  if(p.hold&&s.answer!==null){pill(ctx,'Predict, then turn the supports off',600,32,PAL['s5'],'#fff',12*k);}}

function drawWrench(sim,ctx,k,t){const s=sim.st,p=sim.p,[bx,by]=BOLT,nd=wNeed(p),tau=wTau(p),turns=wTurns(p);
  const rot=-s.turn;                       // loosening = counterclockwise
  // plate
  rr(ctx,40,60,560,380,16);ctx.fillStyle=PAL['cv-bg2'];ctx.fill();ctx.save();rr(ctx,40,60,560,380,16);ctx.clip();
  // bolt head (rotates)
  ctx.save();ctx.translate(bx,by);ctx.rotate(rot);ctx.fillStyle=PAL['cv-lamp'];ctx.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3+Math.PI/6;ctx.lineTo(Math.cos(a)*30,Math.sin(a)*30);}ctx.closePath();ctx.fill();
  ctx.fillStyle=PAL['cv-glass'];ctx.beginPath();ctx.arc(0,0,10,0,TAU);ctx.fill();
  // wrench handle
  const len=0.42*WPX;ctx.fillStyle=PAL['cv-soft'];rr(ctx,26,-13,len-26,26,10);ctx.fill();
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=14;ctx.beginPath();ctx.arc(0,0,40,0.5,TAU-0.5);ctx.stroke();
  // ruler along handle
  ctx.strokeStyle=PAL['cv-bg'];ctx.lineWidth=1.2;for(let d=0.05;d<=0.4+1e-9;d+=0.05){const x=d*WPX;ctx.beginPath();ctx.moveTo(x,-13);ctx.lineTo(x,-4);ctx.stroke();txt(ctx,Math.round(d*100)+(d>0.39?' cm':''),x-(d>0.39?6:0),9,{s:10*k,c:PAL['cv-bg'],a:'center',w:600});}
  // force
  const fx=p.r*WPX,a=-p.ang*D2R,FL=Math.min(170,p.F*0.85);   // angle measured from the handle direction, pushing "up" the page
  if(p.F>0){const ux=Math.cos(a),uy=Math.sin(a);
    // line of action and lever arm
    if(atLeast('honors')&&p.r>0){ctx.strokeStyle=PAL['s4'];ctx.setLineDash([4,4]);ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(fx-ux*400,-uy*400);ctx.lineTo(fx+ux*400,uy*400);ctx.stroke();
      const proj=-(fx*ux),qx=fx+ux*proj,qy=uy*proj;ctx.strokeStyle=PAL['s5'];ctx.setLineDash([]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(qx,qy);ctx.stroke();
      const mx=qx/2,my=qy/2;txt(ctx,'r⊥ = '+fmtNum(p.r*Math.sin(p.ang*D2R)*100,1)+' cm',mx-14,my+(qy>0?22:-14),{s:12*k,c:PAL['s5'],w:700});}
    ctx.setLineDash([]);
    // hand
    ctx.fillStyle=PAL['cv-head'];ctx.beginPath();ctx.arc(fx,0,11,0,TAU);ctx.fill();
    const sx=fx-ux*FL,sy=-uy*FL;arrow(ctx,sx,sy,ux*FL-ux*12,uy*FL-uy*12,PAL['s1'],4);
    // angle arc
    if(p.ang>0&&p.ang<180){ctx.strokeStyle=PAL['s1'];ctx.lineWidth=1.5;ctx.beginPath();const a0=Math.PI,a1=Math.PI+a;ctx.arc(fx,0,34,Math.min(a0,a1),Math.max(a0,a1));ctx.stroke();}}
  ctx.restore();ctx.restore();
  // labels in world frame
  if(p.F>0){const wx=bx+Math.cos(rot)*p.r*WPX,wy=by+Math.sin(rot)*p.r*WPX;txt(ctx,'F = '+p.F+' N',wx+16,wy+48,{s:13*k,c:PAL['s1'],w:700});
    if(p.ang>0&&p.ang<180)txt(ctx,'θ = '+p.ang+'°',wx-92,wy+34,{s:12*k,c:PAL['s1']});}
  // turning indicator
  if(turns){ctx.strokeStyle=PAL['s3'];curved(ctx,bx,by,62,-0.3,-2.2,PAL['s3']);txt(ctx,'loosening',bx-40,by-74,{s:12*k,c:PAL['s3'],w:700});}
  // torque meter
  const mx0=630,my0=90,mh=300,top=80;rr(ctx,mx0-10,my0-40,170,mh+80,12);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,'Torque',mx0+75,my0-16,{s:13*k,w:700,a:'center'});
  rr(ctx,mx0+50,my0,50,mh,6);ctx.fillStyle=PAL['cv-bg2'];ctx.fill();const fh=clamp(tau/top,0,1)*mh;ctx.fillStyle=turns?PAL['s3']:PAL['s4'];ctx.fillRect(mx0+50,my0+mh-fh,50,fh);
  const ny=my0+mh-nd/top*mh;ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2;ctx.setLineDash([5,3]);ctx.beginPath();ctx.moveTo(mx0+40,ny);ctx.lineTo(mx0+110,ny);ctx.stroke();ctx.setLineDash([]);
  txt(ctx,'needs',mx0+114,ny-3,{s:11*k,c:PAL['s1']});txt(ctx,nd+'',mx0+114,ny+11,{s:11*k,c:PAL['s1'],w:700});
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;for(let v=0;v<=top;v+=20){const y=my0+mh-v/top*mh;ctx.beginPath();ctx.moveTo(mx0+44,y);ctx.lineTo(mx0+50,y);ctx.stroke();txt(ctx,v+'',mx0+40,y+4,{s:10.5*k,c:PAL['cv-soft'],a:'right'});}
  txt(ctx,fmtNum(tau,1)+' N·m',mx0+75,my0+mh+26,{s:15*k,w:700,a:'center',c:turns?PAL['s3']:PAL['cv-ink']});
  rr(ctx,52,72,300,atLeast('honors')?52:34,8);ctx.fillStyle=PAL['card'];ctx.fill();
  txt(ctx,turns?'The bolt turns':(tau<=0?'No turning effect':'Stuck: not enough torque'),64,94,{s:14*k,w:700,c:turns?PAL['s3']:PAL['s4']});
  if(atLeast('honors'))txt(ctx,'τ = rF sinθ = '+fmtNum(p.r,2)+' × '+p.F+' × sin '+p.ang+'°',64,115,{s:12*k,c:PAL['cv-soft']});}

function drawLadder(sim,ctx,k,t){const s=sim.st,p=sim.p,th0=p.lang*D2R,e=s.fall*s.fall,th=th0+(6*D2R-th0)*e;
  const L=LAD_L*LPX,fx=WALLX-L*Math.cos(th),tx=WALLX,ty=FLOORY-L*Math.sin(th);
  // wall and floor
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,FLOORY,800,450-FLOORY);ctx.fillStyle=PAL['cv-lamp'];ctx.fillRect(WALLX,20,24,FLOORY-20);
  // ladder
  const dx=Math.cos(th),dy=-Math.sin(th),nx=-dy*7,ny=dx*7;ctx.strokeStyle=PAL['s4'];ctx.lineWidth=4;
  ctx.beginPath();ctx.moveTo(fx-nx,FLOORY-ny);ctx.lineTo(tx-nx,ty-ny);ctx.moveTo(fx+nx,FLOORY+ny);ctx.lineTo(tx+nx,ty+ny);ctx.stroke();
  ctx.lineWidth=2.5;for(let i=1;i<LAD_L/0.3;i++){const q=i*0.3*LPX;ctx.beginPath();ctx.moveTo(fx+dx*q-nx,FLOORY+dy*q-ny);ctx.lineTo(fx+dx*q+nx,FLOORY+dy*q+ny);ctx.stroke();}
  // climber
  const cx=fx+dx*s.x*L,cy=FLOORY+dy*s.x*L;ctx.fillStyle=PAL['s5'];rr(ctx,cx-12,cy-62,24,44,8);ctx.fill();ctx.fillStyle=PAL['cv-head'];ctx.beginPath();ctx.arc(cx,cy-74,11,0,TAU);ctx.fill();
  ctx.strokeStyle=PAL['s5'];ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(cx-6,cy-20);ctx.lineTo(cx-4,cy);ctx.moveTo(cx+6,cy-20);ctx.lineTo(cx+8,cy-4);ctx.stroke();
  txt(ctx,PER_M+' kg',cx,cy-92,{s:12*k,c:PAL['s5'],w:700,a:'center'});
  // forces (scale 0.11 px per N)
  const S=0.15,f=ladF(p,s.x),fm=ladMax(p),slip=f>fm+1e-9;
  if(s.fall>0){pill(ctx,'Slipping: the floor cannot supply '+fmtNum(f,0)+' N of friction',330,150,PAL['s1'],'#fff',13*k);}
  else{
  const mx=fx+dx*L/2,my=FLOORY+dy*L/2;arrow(ctx,mx,my,0,LAD_M*G*S+8,PAL['cv-ink'],2.5);tag(ctx,'ladder '+fmtNum(LAD_M*G,0)+' N',mx+24,my+LAD_M*G*S+14,{s:12*k,c:PAL['cv-soft']});
  const wl=Math.min(PER_M*G*S,440-(cy-40));arrow(ctx,cx,cy-40,0,wl,PAL['s5'],2.5);tag(ctx,fmtNum(PER_M*G,0)+' N',cx+8,cy-40+wl-4,{s:12*k,c:PAL['s5'],w:600});
  arrow(ctx,fx,FLOORY,0,-ladN()*S,PAL['s2'],3);tag(ctx,'N = '+fmtNum(ladN(),0)+' N',fx-104,FLOORY-ladN()*S+12,{s:12*k,c:PAL['s2'],w:600});
  arrow(ctx,WALLX,ty,-f*S,0,PAL['s6'],3);tag(ctx,'wall push '+fmtNum(f,0)+' N',WALLX-f*S-4,ty-10,{s:12*k,c:PAL['s6'],w:600,a:'right'});
  const fr=Math.min(f,fm);arrow(ctx,fx,FLOORY+14,fr*S,0,slip?PAL['s1']:PAL['s3'],3);
  ctx.strokeStyle=PAL['s3'];ctx.setLineDash([4,3]);ctx.lineWidth=1.2;ctx.strokeRect(fx,FLOORY+8,fm*S,12);ctx.setLineDash([]);
  txt(ctx,'friction '+fmtNum(fr,0)+' N (max '+fmtNum(fm,0)+')',fx,FLOORY+36,{s:12*k,c:slip?PAL['s1']:PAL['s3'],w:600});}
  // angle
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(fx,FLOORY,40,-th,0);ctx.stroke();txt(ctx,fmtNum(th/D2R,0)+'°',fx+48*Math.cos(th/2)+4,FLOORY-48*Math.sin(th/2)+4,{s:12*k,c:PAL['cv-soft']});
  // card
  rr(ctx,12,12,300,92,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,slip?'Slips!':'Holds (static equilibrium)',24,38,{s:15*k,w:700,c:slip?PAL['s1']:PAL['s3']});
  txt(ctx,'Friction needed: '+fmtNum(f,0)+' N',24,62,{s:12.5*k,c:PAL['cv-soft']});txt(ctx,'Friction available μsN: '+fmtNum(fm,0)+' N',24,84,{s:12.5*k,c:PAL['cv-soft']});
  if(s.climbing)pill(ctx,'Climbing… '+Math.round(s.x*100)+'%',400,32,PAL['s5'],'#fff',12*k);}

BioLab.register(TQ);
})();
