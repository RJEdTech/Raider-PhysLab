(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,FONT,axes,legend,serColor,fmtNum}=BioLab.h;
const G=9.8, D2R=Math.PI/180, TAU=2*Math.PI;

/* ---------- rolling race ---------- */
const SHAPES=[{id:'hoop',name:'Hoop',beta:1,I:'MR²',m:1,r:0.1},{id:'disk',name:'Solid disk',beta:0.5,I:'½MR²',m:1,r:0.1},
  {id:'sphere',name:'Solid ball',beta:0.4,I:'⅖MR²',m:1,r:0.1},{id:'block',name:'Sliding block (no friction)',beta:0,I:'none',m:1,r:0.1}];
const SIZES=[{id:'hoop',name:'Hoop, 1 kg, 10 cm',beta:1,I:'MR²',m:1,r:0.1},{id:'hoop',name:'Hoop, 4 kg, 30 cm',beta:1,I:'MR²',m:4,r:0.3},
  {id:'disk',name:'Disk, 1 kg, 10 cm',beta:0.5,I:'½MR²',m:1,r:0.1},{id:'disk',name:'Disk, 4 kg, 30 cm',beta:0.5,I:'½MR²',m:4,r:0.3}];
function lanes(p){if(atLeast('honors')&&p.lineup==='sizes')return SIZES;return p.block?SHAPES:SHAPES.slice(0,3);}
function rampAng(p){return (atLeast('honors')?p.ang:15)*D2R;}
function rampLen(p){return p.h/Math.sin(rampAng(p));}
function accel(o,p){return G*Math.sin(rampAng(p))/(1+o.beta);}
function finishT(o,p){return Math.sqrt(2*rampLen(p)/accel(o,p));}
function vBottom(o,p){return Math.sqrt(2*G*p.h/(1+o.beta));}
function raceState(sim,o){const p=sim.p,t=sim.st.time,a=accel(o,p),T=finishT(o,p),tt=Math.min(t,T);return {s:0.5*a*tt*tt,v:a*tt,done:t>=T,T,a};}
function leaderText(sim){const p=sim.p,L=lanes(p),Ts=L.map(o=>finishT(o,p)),t=sim.st.time,min=Math.min(...Ts);
  if(t<min)return 'Racing…';const win=L.filter((o,i)=>Math.abs(Ts[i]-min)<1e-9);
  if(win.length>1)return win.every(o=>o.id===win[0].id)?'Tie: both '+win[0].id+'s':'Tie';return win[0].name.split(' (')[0]+' wins';}

/* ---------- skater on a spinning stool ---------- */
const I_CORE=1.0, M_ARM=3;               // body + stool about the axis (kg·m²), each arm (kg)
function skI(r,w){return I_CORE+2*(M_ARM*r*r/3+w*r*r);}
function skW(p){return atLeast('honors')?p.wts:2;}

/* ---------- spool (AP) ---------- */
const SR=0.3, DROP=1.8;
function spoolK(p){return p.shape==='ring'?1:0.5;}
function spoolA(p){return p.mh*G/(p.mh+spoolK(p)*p.M);}

let curMode='race';
const GRAPHS=[
  {id:'grace',label:'Distance down the ramp vs time',mode:'race',custom:true},
  {id:'gracev',label:'Speed vs time',mode:'race',lvl:'honors',custom:true},
  {id:'gsk',label:'Spin rate vs time',mode:'skater',custom:true},
  {id:'gske',label:'Angular momentum and kinetic energy',mode:'skater',lvl:'honors',custom:true},
  {id:'gspool',label:'Falling weight: speed vs time',mode:'spool',lvl:'ap',custom:true}];
const MODECTL={race:['h','ang','lineup','block'],skater:['armR','wts','spin'],spool:['shape','M','mh']};
const MODEACT={race:['race'],skater:['in','out'],spool:['drop']};
function applyMode(sim){curMode=sim.p.mode;if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.mode;
  ROT.metrics.forEach(m=>{const t=sim.ui.tiles&&sim.ui.tiles[m.id];if(!t)return;const tile=t.num.closest('.tile');if(tile)tile.hidden=!(atLeast(m.lvl)&&m.mode===mode);});
  ROT.controls.forEach(c=>{if(c.id==='mode')return;const e=sim.ui.sec.querySelector('#rotation-'+c.id)||sim.ui.sec.querySelector('#rotation-'+c.id+'-l');const w=e&&e.closest('.ctl');
    if(w)w.hidden=!(atLeast(c.lvl)&&MODECTL[mode].includes(c.id)&&!(c.id==='block'&&atLeast('honors')&&sim.p.lineup==='sizes'));});
  const btns=sim.ui.ctrls?sim.ui.ctrls.querySelectorAll('.actions button'):[];ROT.actions.forEach((a,i)=>{if(btns[i])btns[i].hidden=!MODEACT[mode].includes(a.id);});
  const gm=sim.ui.gm;if(gm){const go=ROT.graphs.filter(g=>atLeast(g.lvl||'bio'));gm.innerHTML=go.map(g=>`<option value="${g.id}">${g.label}</option>`).join('');
    if(!go.find(g=>g.id===sim.gMetric))sim.gMetric=go.length?go[0].id:undefined;if(sim.gMetric)gm.value=sim.gMetric;}}

function record(sim){const s=sim.st;if(s.time-s.lastRec<0.05&&s.hist.length)return;s.lastRec=s.time;const p=sim.p;
  if(p.mode==='race')s.hist.push(s.time);
  else if(p.mode==='skater'){const I=skI(s.r,s.w);s.hist.push([s.time,s.om/TAU,I,s.L,0.5*I*s.om*s.om]);}
  else{s.hist.push([s.time,s.v]);}
  if(s.hist.length>2000)s.hist.shift();}

const ROT={
  id:'rotation',hash:'rotation',apUnit:5,order:2,tab:'Rotational motion and angular momentum',kind:'Simulation',
  card:'Race a hoop, a disk and a ball down a ramp, then spin a skater who pulls her arms in. See where the energy goes.',
  title:'Rotational motion and angular momentum',
  lede:{bio:'Why does a ball beat a hoop down a ramp? Why does a spinning skater speed up when she pulls her arms in? It depends on where the mass sits compared with the spin axis.',
        honors:'Moment of inertia I measures how hard something is to spin. Use it to explain the rolling race (energy split between moving and spinning) and the skater (L = Iω stays constant).',
        ap:'Rolling without slipping: a = g sinθ/(1 + I/MR²). Angular momentum L = Iω is conserved with no outside torque. Newton’s second law for rotation: τ = Iα, tested with a falling weight on a spool.'},
  scale:'The ramp is drawn to scale (heights 0.5–3 m). The skater’s arms reach up to 0.85 m from the spin axis. The spool is 0.3 m in radius and the weight falls 1.8 m.',
  timeScale:1,dtMax:0.005,sampleDt:0.05,window:15,unit:'s',chChange:0.6,chReveal:5,
  get graphs(){return GRAPHS.filter(g=>g.mode===curMode);},
  controls:[
    {id:'mode',label:'Experiment',type:'seg',def:'race',lvl:'bio',options:[{v:'race',l:'Rolling race'},{v:'skater',l:'Spinning skater'},{v:'spool',l:'Spool and weight',lvl:'ap'}],
     onChange(sim){BioLab.reset(sim);applyMode(sim);}},
    {id:'lineup',label:'Racers',type:'seg',def:'shapes',lvl:'honors',options:[{v:'shapes',l:'Different shapes'},{v:'sizes',l:'Different sizes'}],
     help:'Sizes races light and heavy, small and large versions of the same shape.',onChange(sim){BioLab.reset(sim);applyMode(sim);}},
    {id:'block',label:'Add a sliding block (no friction)',type:'toggle',def:false,lvl:'bio',onChange(sim){BioLab.reset(sim);}},
    {id:'h',label:'Ramp height',type:'range',min:0.5,max:3,step:0.1,def:1.5,unit:' m',lvl:'bio',onChange(sim){BioLab.reset(sim);}},
    {id:'ang',label:'Ramp angle',type:'range',min:5,max:30,step:1,def:15,unit:'°',lvl:'honors',onChange(sim){BioLab.reset(sim);}},
    {id:'armR',label:'Hands from the spin axis',type:'range',min:0.2,max:0.85,step:0.05,def:0.8,unit:' m',lvl:'bio',help:'Change it while she spins.'},
    {id:'wts',label:'Weight in each hand',type:'range',min:0,max:5,step:0.5,def:2,unit:' kg',lvl:'honors',help:'Handing her weights mid-spin adds mass with no spin of its own.'},
    {id:'spin',label:'Starting spin',type:'range',min:0.2,max:1.5,step:0.1,def:0.5,unit:' rev/s',lvl:'bio',onChange(sim){BioLab.reset(sim);}},
    {id:'shape',label:'Spool shape',type:'seg',def:'disk',lvl:'ap',options:[{v:'disk',l:'Solid disk'},{v:'ring',l:'Ring'}],onChange(sim){BioLab.reset(sim);}},
    {id:'M',label:'Spool mass',type:'range',min:1,max:6,step:0.5,def:2,unit:' kg',lvl:'ap',onChange(sim){BioLab.reset(sim);}},
    {id:'mh',label:'Hanging weight',type:'range',min:0.1,max:2,step:0.1,def:0.5,unit:' kg',lvl:'ap',onChange(sim){BioLab.reset(sim);}}
  ],
  actions:[{id:'race',label:'Race again',primary:true,run(sim){BioLab.reset(sim);sim.running=true;}},
    {id:'in',label:'Pull arms in',primary:true,run(sim){BioLab.setValues(sim,{armR:0.25});}},
    {id:'out',label:'Stretch arms out',run(sim){BioLab.setValues(sim,{armR:0.8});}},
    {id:'drop',label:'Drop again',primary:true,run(sim){BioLab.reset(sim);sim.running=true;}}],
  init(sim){const p=sim.p;curMode=p.mode;const w=skW(p),r=p.armR,om=p.spin*TAU;
    return {time:0,lastRec:-1,hist:[],r,w,om,L:skI(r,w)*om,phi:0,phiS:0,y:0,v:0,landed:false,roll:[0,0,0,0]};},
  step(sim,dt){const s=sim.st,p=sim.p;s.time+=dt;
    if(p.mode==='skater'){const tw=skW(p);if(tw!==s.w){s.w=tw;s.om=s.L/skI(s.r,s.w);}   // weights added: L conserved
      const dr=p.armR-s.r;if(Math.abs(dr)>1e-6){s.r+=Math.sign(dr)*Math.min(Math.abs(dr),1.0*dt);s.om=s.L/skI(s.r,s.w);}
      s.phi=(s.phi+s.om*dt)%TAU;}
    else if(p.mode==='spool'){if(!s.landed){const a=spoolA(p);s.v+=a*dt;s.y+=s.v*dt;if(s.y>=DROP){s.y=DROP;s.landed=true;s.vLand=s.v;s.v=0;}s.phiS+=(s.landed?0:s.v/SR)*dt;}}
    record(sim);},
  metrics:[
    {id:'leader',label:'Result',mode:'race',lvl:'bio',text:true,get:s=>leaderText(s)},
    {id:'tS',label:'Ball time to the bottom',unit:'s',mode:'race',lvl:'honors',min:0,max:15,d:2,get:s=>finishT(SHAPES[2],s.p)},
    {id:'tH',label:'Hoop time to the bottom',unit:'s',mode:'race',lvl:'honors',min:0,max:15,d:2,get:s=>finishT(SHAPES[0],s.p)},
    {id:'vS',label:'Ball speed at the bottom',unit:'m/s',mode:'race',lvl:'ap',min:0,max:8,d:2,get:s=>vBottom(SHAPES[2],s.p)},
    {id:'w',label:'Spin rate',unit:'rev/s',mode:'skater',lvl:'bio',min:0,max:6,d:2,get:s=>s.st.om/TAU},
    {id:'I',label:'Moment of inertia I',unit:'kg·m²',mode:'skater',lvl:'honors',min:0,max:12,d:2,get:s=>skI(s.st.r,s.st.w)},
    {id:'L',label:'Angular momentum L = Iω',unit:'kg·m²/s',mode:'skater',lvl:'honors',min:0,max:60,d:2,get:s=>skI(s.st.r,s.st.w)*s.st.om},
    {id:'KE',label:'Spinning kinetic energy ½Iω²',unit:'J',mode:'skater',lvl:'ap',min:0,max:300,d:1,get:s=>0.5*skI(s.st.r,s.st.w)*s.st.om*s.st.om},
    {id:'acc',label:'Weight’s acceleration a',unit:'m/s²',mode:'spool',lvl:'ap',min:0,max:10,d:2,get:s=>spoolA(s.p)},
    {id:'alpha',label:'Spool angular acceleration α',unit:'rad/s²',mode:'spool',lvl:'ap',min:0,max:35,d:1,get:s=>spoolA(s.p)/SR},
    {id:'T',label:'String tension T',unit:'N',mode:'spool',lvl:'ap',min:0,max:20,d:2,get:s=>s.p.mh*(G-spoolA(s.p))},
    {id:'vy',label:'Weight’s speed',unit:'m/s',mode:'spool',lvl:'ap',min:0,max:6,d:2,get:s=>s.st.landed?s.st.vLand:s.st.v}
  ],
  defaultGraph:'grace',
  plot(sim,ctx,box,id){const s=sim.st,p=sim.p;
    if(id==='grace'||id==='gracev'){const L=lanes(p),Tmax=Math.max(...L.map(o=>finishT(o,p))),tm=Math.max(Tmax*1.1,1),tn=Math.min(s.time,tm);
      const sp=id==='gracev',ymax=sp?Math.max(...L.map(o=>vBottom(o,p)))*1.15:rampLen(p)*1.1;
      const ax=axes(ctx,box,{xmin:0,xmax:tm,ymin:0,ymax:ymax*1.25,xl:'Time (s)',yl:sp?'Speed (m/s)':'Distance down ramp (m)'});
      L.forEach((o,i)=>{const a=accel(o,p),T=finishT(o,p);ctx.strokeStyle=serColor(i);ctx.lineWidth=2.5;ctx.setLineDash(o.m>1?[6,4]:[]);ctx.beginPath();
        for(let k=0;k<=80;k++){const t=tn*k/80,tt=Math.min(t,T),y=sp?a*tt:0.5*a*tt*tt;k?ctx.lineTo(ax.X(t),ax.Y(y)):ctx.moveTo(ax.X(t),ax.Y(y));}ctx.stroke();ctx.setLineDash([]);});
      if(!sp){ctx.strokeStyle=PAL['muted'];ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(box.L,ax.Y(rampLen(p)));ctx.lineTo(box.L+box.W,ax.Y(rampLen(p)));ctx.stroke();ctx.setLineDash([]);
        txt(ctx,'bottom of ramp',box.L+box.W-6,ax.Y(rampLen(p))+15,{s:12,c:PAL['muted'],a:'right'});}
      legend(ctx,box.L+12,box.T+14,L.map((o,i)=>({color:serColor(i),label:o.name.replace(' (no friction)',''),dash:o.m>1})));return;}
    if(id==='gsk'||id==='gske'){const H=s.hist,t1=Math.max(10,s.time);const t0=Math.max(0,t1-15);
      if(id==='gsk'){const ax=axes(ctx,box,{xmin:t0,xmax:t1,ymin:0,ymax:Math.max(2,...H.map(h=>h[1]))*1.15,xl:'Time (s)',yl:'Spin rate (rev/s)'});
        ctx.strokeStyle=serColor(0);ctx.lineWidth=2.5;ctx.beginPath();H.forEach((h,i)=>{if(h[0]<t0)return;i?ctx.lineTo(ax.X(h[0]),ax.Y(h[1])):ctx.moveTo(ax.X(h[0]),ax.Y(h[1]));});ctx.stroke();
        legend(ctx,box.L+12,box.T+14,[{color:serColor(0),label:'ω (rev/s)'}]);return;}
      const ymax=Math.max(10,...H.map(h=>Math.max(h[3],atLeast('ap')?h[4]:0)))*1.15;
      const ax=axes(ctx,box,{xmin:t0,xmax:t1,ymin:0,ymax,xl:'Time (s)',yl:atLeast('ap')?'L (kg·m²/s) and KE (J)':'L (kg·m²/s)'});
      const line=(j,c,dash)=>{ctx.strokeStyle=c;ctx.lineWidth=2.5;ctx.setLineDash(dash?[6,4]:[]);ctx.beginPath();let f=true;H.forEach(h=>{if(h[0]<t0)return;f?ctx.moveTo(ax.X(h[0]),ax.Y(h[j])):ctx.lineTo(ax.X(h[0]),ax.Y(h[j]));f=false;});ctx.stroke();ctx.setLineDash([]);};
      line(3,serColor(1));if(atLeast('ap'))line(4,serColor(3),true);
      legend(ctx,box.L+12,box.T+14,[{color:serColor(1),label:'Angular momentum L'}].concat(atLeast('ap')?[{color:serColor(3),label:'Kinetic energy',dash:true}]:[]));return;}
    if(id==='gspool'){const H=s.hist,a=spoolA(p),tf=Math.sqrt(2*DROP/a),tm=Math.max(tf*1.2,1.5);
      const ax=axes(ctx,box,{xmin:0,xmax:tm,ymin:0,ymax:Math.sqrt(2*DROP*G)*1.05,xl:'Time (s)',yl:'Speed (m/s)'});
      ctx.strokeStyle=PAL['muted'];ctx.setLineDash([4,4]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(0));ctx.lineTo(ax.X(Math.sqrt(2*DROP/G)),ax.Y(Math.sqrt(2*DROP*G)));ctx.stroke();ctx.setLineDash([]);
      ctx.strokeStyle=serColor(0);ctx.lineWidth=2.5;ctx.beginPath();H.forEach((h,i)=>{const x=ax.X(Math.min(h[0],tm));i?ctx.lineTo(x,ax.Y(h[1])):ctx.moveTo(x,ax.Y(h[1]));});ctx.stroke();
      legend(ctx,box.L+12,box.T+14,[{color:serColor(0),label:'Weight on the spool'},{color:PAL['muted'],label:'Free fall (g), for comparison',dash:true}]);}},
  narrate(sim){const s=sim.st,p=sim.p;
    if(p.mode==='race'){const L=lanes(p),st=L.map(o=>raceState(sim,o));if(!st.some(x=>x.done))
        return atLeast('honors')?'Each racer turns falling height into kinetic energy. A rolling object must split it: some goes into moving forward and some into spinning. The more of its mass sits far from the center (bigger I/MR²), the more it spends on spinning.':'All the racers start together. Gravity pulls each one down the ramp, but the rolling ones also have to <b>spin up</b>, and that takes some of the energy.';
      if(atLeast('honors')&&p.lineup==='sizes')return '<b>Mass and size cancel out.</b> A bigger, heavier hoop has more I, but it also has more mass for gravity to pull. Only the shape (how the mass is spread) matters: every hoop ties every other hoop, and every disk ties every disk.';
      return '<b>'+leaderText(sim)+'.</b> The ball keeps most of its mass near the center, so it spends less energy spinning and more moving forward. The hoop has all its mass at the rim, so it is slowest.'+(p.block?' The frictionless block does not spin at all, so all its energy goes into speed.':'');}
    if(p.mode==='skater'){const I=skI(s.r,s.w),rev=s.om/TAU;const moving=Math.abs(p.armR-s.r)>0.01;
      if(moving&&p.armR<s.r)return '<b>Pulling in.</b> As her hands come closer to the axis, her moment of inertia drops, so her spin rate rises to keep L = Iω the same. She is now at '+fmtNum(rev,2)+' rev/s.';
      if(moving)return '<b>Stretching out.</b> Mass moving away from the axis raises I, so the spin slows down. Nothing outside twisted her; angular momentum stays constant.';
      return 'She spins at '+fmtNum(rev,2)+' rev/s with her hands '+fmtNum(s.r*100,0)+' cm from the axis'+(atLeast('honors')?' (I = '+fmtNum(I,2)+' kg·m², L = '+fmtNum(I*s.om,2)+' kg·m²/s).':'.')+' Press <b>Pull arms in</b> and watch her speed up.';}
    const a=spoolA(p);return s.landed?'<b>Landed at '+fmtNum(s.vLand,2)+' m/s.</b> In free fall it would have hit at '+fmtNum(Math.sqrt(2*G*DROP),2)+' m/s. Part of the weight’s lost potential energy went into spinning the spool.':
      'The string tension T pulls on the spool’s rim, making a torque τ = TR = '+fmtNum(p.mh*(G-a)*SR,2)+' N·m. That torque gives the spool angular acceleration α = τ/I = '+fmtNum(a/SR,1)+' rad/s², and the weight speeds up at a = αR = '+fmtNum(a,2)+' m/s², less than g.';},
  tour:[
    {title:'The rolling race',text:'Three objects with the same mass and radius roll down identical lanes. They differ only in where their mass is: all at the rim (hoop), spread evenly (disk) or packed toward the center (ball).',focus:[0,40,560,330],pause:true,setup(sim){BioLab.setValues(sim,{mode:'race',block:false,lineup:'shapes'});BioLab.reset(sim);sim.running=false;}},
    {title:'Watch in slow motion',text:'Each racer gets the same energy from falling the same height. Watch the spokes: rolling objects must also spin, and spinning costs energy.',focus:[0,40,800,410],speed:0.3,setup(sim){sim.running=true;}},
    {title:'Who wins, and why',text:{bio:'The ball wins and the hoop comes last. Mass far from the center is harder to spin up, so the hoop has less energy left for moving forward.',honors:'Rolling KE = ½Mv² + ½Iω². The hoop (I = MR²) splits its energy 50/50; the ball (I = ⅖MR²) puts 71% into forward motion.'},focus:[560,40,240,410],speed:1},
    {lvl:'honors',title:'Mass and radius cancel',text:'Switch the racers to different sizes: a hoop 4× heavier and 3× wider ties the small hoop exactly. Shape, not size, sets the speed.',focus:[0,40,800,410],speed:1,setup(sim){BioLab.setValues(sim,{lineup:'sizes'});BioLab.reset(sim);sim.running=true;}},
    {title:'The spinning skater',text:'Now a skater on a frictionless spinning stool holds weights out at arm’s length. The top-down view on the right shows the path of her hands.',focus:[0,0,800,450],pause:true,setup(sim){BioLab.setValues(sim,{mode:'skater',lineup:'shapes'});BioLab.reset(sim);sim.running=true;}},
    {title:'Pull the arms in',text:'Her hands come in toward the axis and she spins much faster, with no push from outside. Moving mass inward lowers I, so ω must rise to keep L = Iω constant.',focus:[0,0,800,450],speed:1,setup(sim){BioLab.setValues(sim,{armR:0.25});}},
    {lvl:'honors',title:'Energy goes up',text:'Her kinetic energy ½Iω² actually increases. The extra energy comes from the work her arm muscles do pulling the weights inward against their tendency to fly outward.',focus:[10,10,250,128],speed:1},
    {lvl:'ap',title:'τ = Iα on a spool',text:'Last experiment: a weight on a string unwinds a spool. The string tension makes the torque, and the weight falls with a = mg/(m + I/R²), less than g.',focus:[150,30,420,410],speed:1,setup(sim){BioLab.setValues(sim,{mode:'spool'});BioLab.reset(sim);sim.running=true;}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'race',lineup:'shapes',armR:0.8});BioLab.reset(sim);},
  challenges:[
    {lvl:'bio',q:'A hoop, a solid disk and a solid ball all have the same mass and radius. They roll down the same ramp. Which reaches the bottom first?',
     choices:['Hoop','Solid disk','Solid ball','All tie'],correct:2,baseline:{mode:'race',lineup:'shapes',block:false,h:1.5,ang:15},at:0,changeText:'Released',watch:'grace',reveal:4,
     explain:{bio:'The ball wins, then the disk, then the hoop. All three get the same energy from falling, but rolling objects must also spin. Mass far from the center (the hoop) is hardest to spin, so less energy is left for moving forward.',
              honors:'a = g sinθ/(1 + I/MR²). I/MR² is 0.4 for the ball, 0.5 for the disk and 1 for the hoop, so the ball has the largest acceleration.'}},
    {lvl:'bio',q:'Add a block that slides with no friction at all. Who wins now?',
     choices:['The block','The ball','They tie'],correct:0,baseline:{mode:'race',lineup:'shapes',block:true,h:1.5,ang:15},at:0,changeText:'Released',watch:'grace',reveal:4,
     explain:'The block does not spin, so every joule from falling goes into forward motion. Any rolling object has to spend some energy on spinning, so it is always slower than a frictionless slider.'},
    {lvl:'bio',q:'The skater is spinning with her arms stretched out. She pulls her hands in close to her body. What happens?',
     choices:['She spins faster','She spins slower','Her spin stays the same'],correct:0,baseline:{mode:'skater',armR:0.8,wts:2,spin:0.5},change:{armR:0.25},changeText:'Arms pulled in',watch:'gsk',reveal:3,
     explain:{bio:'Pulling mass closer to the spin axis makes her easier to spin (smaller moment of inertia). With nothing outside twisting her, her spin rate goes up to make up for it. That is how skaters and divers control their spins.',
              honors:'L = Iω is conserved. Here I drops from 4.8 to 1.4 kg·m², so ω rises about 3.5×.'}},
    {lvl:'honors',q:'Two hoops race: one 1 kg and 10 cm across, the other 4 kg and 30 cm across. Which wins?',
     choices:['The heavy, wide hoop','The light, small hoop','They tie'],correct:2,baseline:{mode:'race',lineup:'sizes',h:1.5,ang:15},at:0,changeText:'Released',watch:'grace',reveal:4,
     explain:'For any hoop, I/MR² = 1, so a = g sinθ/2 no matter the mass or radius. More mass means more gravity but also more inertia, and the two cancel. The same is true for the two disks.'},
    {lvl:'honors',q:'The skater spins with empty hands held out. Someone hands her a 4 kg weight for each hand (the weights are not spinning). What happens to her spin?',
     choices:['It slows down','It speeds up','It stays the same'],correct:0,baseline:{mode:'skater',armR:0.8,wts:0,spin:1},change:{wts:4},changeText:'Weights added',watch:'gsk',reveal:3,
     explain:'Adding mass far from the axis raises I from 2.3 to 7.4 kg·m². The weights start with no spin, so her angular momentum is shared with them and ω drops to about a third. Same L, bigger I, slower spin.'},
    {lvl:'honors',q:'When the skater pulls her arms in and speeds up, what happens to her spinning kinetic energy ½Iω²?',
     choices:['It increases','It stays the same','It decreases'],correct:0,baseline:{mode:'skater',armR:0.8,wts:2,spin:0.5},change:{armR:0.25},changeText:'Arms pulled in',watch:'gske',reveal:3,
     explain:'L stays constant but KE = L²/2I, so a smaller I means more energy, here about 3.5× more. The extra energy comes from the work her muscles do pulling the weights inward.'},
    {lvl:'ap',q:'A 0.5 kg weight unwinds a 2 kg solid-disk spool and accelerates at 3.3 m/s². The disk is swapped for a 2 kg ring of the same radius. The weight’s acceleration will be:',
     choices:['Smaller','The same','Larger'],correct:0,baseline:{mode:'spool',shape:'ring',M:2,mh:0.5},at:0,changeText:'Dropped',watch:'gspool',reveal:2,
     explain:'a = mg/(m + I/R²). For the disk I/R² = ½M = 1 kg; for the ring I/R² = M = 2 kg. So a falls from 4.9/1.5 = 3.3 to 4.9/2.5 = 2.0 m/s². The ring’s mass is all at the rim, so the same torque gives less angular acceleration.'},
    {lvl:'ap',q:'A solid ball rolls without slipping down a ramp from a height of 1.0 m. How fast is it moving at the bottom?',
     choices:['4.4 m/s','3.7 m/s','3.1 m/s'],correct:1,instant:true,
     explain:'Mgh = ½Mv² + ½(⅖MR²)(v/R)² = 0.7Mv², so v = √(gh/0.7) = √(9.8/0.7) = 3.7 m/s. 4.4 m/s is a frictionless slide (√2gh); 3.1 m/s is a hoop (√gh).'}
  ],
  lab:{bio:'<p><b>Question:</b> Does the height of the ramp change who wins?</p><ol><li>Run the race at heights of 0.5, 1.5 and 3 m. Record a trial each time.</li><li>Switch to the skater. Record her spin rate with hands at 0.8, 0.5 and 0.25 m.</li></ol><p>Use your data to explain both experiments with the idea of mass near or far from the axis.</p>',
       honors:'<p><b>Question:</b> How does the hoop’s finish time depend on the ramp?</p><ol><li>At 15°, record the ball and hoop times for heights 0.5–3 m.</li><li>Calculate t<sub>hoop</sub>/t<sub>ball</sub> for each. Predict it from a = g sinθ/(1 + I/MR²).</li><li>Skater: record I and ω for five hand positions. Calculate L = Iω each time.</li></ol><p>Is the ratio constant? Is L constant? Explain.</p>',
       ap:'<p><b>Question:</b> Verify τ = Iα with the spool.</p><ol><li>For hanging weights 0.2–2 kg, record a and T.</li><li>Calculate τ = TR and α = a/R. Graph τ against α.</li><li>The slope is I. Compare with ½MR² (disk) and MR² (ring).</li></ol><p>Explain why a approaches g as the hanging weight grows.</p>'},
  terms:[{t:'Moment of inertia (I)',d:'How hard an object is to spin up or slow down. More mass, or mass farther from the axis, means bigger I.'},{t:'Angular speed (ω)',d:'How fast something spins, in revolutions per second or radians per second.'},{t:'Rolling',d:'Moving forward and spinning at the same time without slipping.'},
    {lvl:'honors',t:'Angular momentum (L = Iω)',d:'Spin “quantity of motion”. It stays constant when no outside torque acts.'},{lvl:'honors',t:'Rotational kinetic energy',d:'½Iω², the energy of spinning.'},{lvl:'honors',t:'I for common shapes',d:'Hoop MR², solid disk ½MR², solid ball ⅖MR², rod about its end ⅓ML².'},
    {lvl:'ap',t:'Newton’s second law for rotation',d:'τ<sub>net</sub> = Iα.'},{lvl:'ap',t:'Rolling without slipping',d:'v = ωR and a = αR at the contact point, so a = g sinθ/(1 + I/MR²) on a ramp.'}],
  about:'<p><b>Race:</b> rigid objects roll without slipping and without rolling resistance or air drag, so a = g sinθ/(1 + β) with β = I/MR² (hoop 1, disk 0.5, ball 0.4, frictionless block 0). Each racer stops at the bottom of the ramp. The ramp is drawn to scale; the racers are drawn larger than their real size so you can see them spin.</p><p><b>Skater:</b> body plus stool I = 1.0 kg·m², each arm a 3 kg rod (⅓mr²), and point-mass hand weights. The stool is frictionless, so L = Iω is conserved while the arms move in or out at up to 1 m/s and when weights are added. <b>Spool:</b> a 0.3 m radius disk or ring on a frictionless axle, with a massless string; the weight falls 1.8 m.</p>',
  onLevel(sim){applyMode(sim);},
  initVis(sim){applyMode(sim);},
  draw(sim,ctx,vdt,k,t){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);const kk=Math.min(k,1.3);
    if(sim.p.mode==='race')drawRace(sim,ctx,kk);else if(sim.p.mode==='skater')drawSkater(sim,ctx,kk);else drawSpool(sim,ctx,kk);}
};

function drawRolling(ctx,o,x,y,rad,phi,col){ctx.save();ctx.translate(x,y);
  if(o.id==='block'){ctx.fillStyle=col;rr(ctx,-rad,-rad*0.9,rad*2,rad*1.8,4);ctx.fill();ctx.restore();return;}
  ctx.rotate(phi);
  if(o.id==='hoop'){ctx.strokeStyle=col;ctx.lineWidth=Math.max(3,rad*0.22);ctx.beginPath();ctx.arc(0,0,rad-ctx.lineWidth/2,0,TAU);ctx.stroke();
    ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-rad*0.85,0);ctx.lineTo(rad*0.85,0);ctx.moveTo(0,-rad*0.85);ctx.lineTo(0,rad*0.85);ctx.stroke();}
  else if(o.id==='disk'){ctx.fillStyle=col;ctx.beginPath();ctx.arc(0,0,rad,0,TAU);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(rad*0.9,0);ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,2.5,0,TAU);ctx.fill();}
  else{const g=ctx.createRadialGradient(-rad*0.35,-rad*0.35,rad*0.1,0,0,rad);g.addColorStop(0,'#fff');g.addColorStop(0.35,col);g.addColorStop(1,col);ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,rad,0,TAU);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,rad*0.35,rad*0.95,0,0,TAU);ctx.stroke();}
  ctx.restore();}

function drawRace(sim,ctx,k){const p=sim.p,L=lanes(p),th=rampAng(p),len=rampLen(p),x0=50,y0=100,gap=L.length>3?62:80,riseMax=414-y0-(L.length-1)*gap;
  const W=Math.min(560,riseMax/Math.tan(th)),rise=W*Math.tan(th),pxm=W/(len*Math.cos(th)),x1=x0+W;
  const ex=x1+8,showSplit=atLeast('honors');
  L.forEach((o,i)=>{const yb=y0+i*gap,col=serColor(i),st=raceState(sim,o);
    // ramp lane
    ctx.fillStyle=PAL['cv-bench'];ctx.beginPath();ctx.moveTo(x0,yb);ctx.lineTo(x1,yb+rise);ctx.lineTo(x1,yb+rise+7);ctx.lineTo(x0,yb+7);ctx.closePath();ctx.fill();
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x0,yb);ctx.lineTo(x1,yb+rise);ctx.stroke();
    ctx.save();ctx.translate(x0+8,yb+9);ctx.rotate(th);txt(ctx,o.name,0,0,{s:12*k,c:PAL['cv-soft'],w:600,b:'top'});ctx.restore();
    // racer
    const rad=o.id==='block'?12:(o.r>0.2?27:14),d=st.s*pxm,cx=x0+d*Math.cos(th),cy=yb+d*Math.sin(th);
    const nx=Math.sin(th),ny=-Math.cos(th),phi=o.id==='block'?0:d/rad;   // rolls without slipping on screen
    ctx.save();ctx.translate(cx+nx*rad,cy+ny*rad);if(o.id==='block')ctx.rotate(th);drawRolling(ctx,o,0,0,rad,phi,col);ctx.restore();
    // result at the bottom
    if(st.done){const place=1+L.filter(q=>finishT(q,p)<st.T-1e-9).length;
      pill(ctx,(place===1?'1st ':place===2?'2nd ':place===3?'3rd ':'4th ')+fmtNum(st.T,2)+' s',ex+76,yb+rise-22,place===1?PAL['s3']:PAL['card2'],place===1?'#fff':PAL['cv-ink'],11.5*k);}
    // energy split bar
    if(showSplit){const bx=ex+30,by=yb+rise-4,bw=92,f=1/(1+o.beta);rr(ctx,bx,by,bw,12,3);ctx.fillStyle=PAL['card2'];ctx.fill();
      ctx.fillStyle=PAL['s2'];ctx.fillRect(bx,by,bw*f,12);ctx.fillStyle=PAL['s4'];ctx.fillRect(bx+bw*f,by,bw*(1-f),12);
      txt(ctx,Math.round(f*100)+'% moving',bx,by+24,{s:10.5*k,c:PAL['cv-soft']});}});
  // finish line
  ctx.strokeStyle=PAL['cv-ink'];ctx.setLineDash([5,4]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x1,y0+rise-30);ctx.lineTo(x1,y0+(L.length-1)*gap+rise+12);ctx.stroke();ctx.setLineDash([]);
  // height ruler on the first lane
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;const hx=x1+2;ctx.beginPath();ctx.moveTo(x0-14,y0);ctx.lineTo(x0-14,y0+rise);ctx.moveTo(x0-19,y0);ctx.lineTo(x0-9,y0);ctx.moveTo(x0-19,y0+rise);ctx.lineTo(x0-9,y0+rise);ctx.stroke();
  ctx.save();ctx.translate(x0-22,y0+rise/2);ctx.rotate(-Math.PI/2);txt(ctx,'h = '+fmtNum(p.h,1)+' m',0,0,{s:11*k,c:PAL['cv-soft'],a:'center'});ctx.restore();
  // header card
  rr(ctx,520,10,270,showSplit?72:52,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,'t = '+fmtNum(sim.st.time,2)+' s',534,36,{s:15*k,w:700});txt(ctx,'Ramp '+fmtNum(len,1)+' m long at '+fmtNum(th/D2R,0)+'°',534,56,{s:12*k,c:PAL['cv-soft']});
  if(showSplit){ctx.fillStyle=PAL['s2'];ctx.fillRect(534,66,10,10);txt(ctx,'moving KE',548,75,{s:11*k,c:PAL['cv-soft']});ctx.fillStyle=PAL['s4'];ctx.fillRect(626,66,10,10);txt(ctx,'spinning KE',640,75,{s:11*k,c:PAL['cv-soft']});}}

function drawSkater(sim,ctx,k){const s=sim.st,p=sim.p,cx=270,shY=225,px=190;
  // stool and floor
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,420,800,30);ctx.fillStyle=PAL['cv-lamp'];ctx.fillRect(cx-5,330,10,90);ctx.beginPath();ctx.ellipse(cx,418,50,8,0,0,TAU);ctx.fill();
  ctx.beginPath();ctx.ellipse(cx,330,48,10,0,0,TAU);ctx.fill();
  // spin axis
  ctx.strokeStyle=PAL['s1'];ctx.setLineDash([6,5]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(cx,95);ctx.lineTo(cx,440);ctx.stroke();ctx.setLineDash([]);
  txt(ctx,'spin axis',cx+8,104,{s:11*k,c:PAL['s1']});
  const arm=(sgn)=>{const a=s.phi+(sgn>0?0:Math.PI),c=Math.cos(a),z=Math.sin(a),hx=cx+c*s.r*px,hy=shY+4;return {hx,hy,z,sx:cx+c*18};};
  const arms=[arm(1),arm(-1)].sort((a,b)=>a.z-b.z);
  const skin=PAL['cv-head'],body=PAL['s5'];
  const drawArm=a=>{const sc=1+0.18*a.z;ctx.strokeStyle=skin;ctx.lineWidth=9*sc;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a.sx,shY);ctx.lineTo(a.hx,a.hy);ctx.stroke();
    if(s.w>0){const r=(6+2.2*Math.sqrt(s.w))*sc;ctx.fillStyle=PAL['cv-lamp'];ctx.beginPath();ctx.arc(a.hx,a.hy,r,0,TAU);ctx.fill();}else{ctx.fillStyle=skin;ctx.beginPath();ctx.arc(a.hx,a.hy,6*sc,0,TAU);ctx.fill();}};
  drawArm(arms[0]);
  // body
  ctx.fillStyle=body;rr(ctx,cx-24,shY-12,48,98,16);ctx.fill();ctx.fillStyle=PAL['s2'];rr(ctx,cx-22,300,44,30,8);ctx.fill();
  ctx.strokeStyle=PAL['s2'];ctx.lineWidth=11;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(cx-12,325);ctx.lineTo(cx-32,372);ctx.lineTo(cx-28,400);ctx.moveTo(cx+12,325);ctx.lineTo(cx+32,372);ctx.lineTo(cx+28,400);ctx.stroke();
  ctx.fillStyle=skin;ctx.beginPath();ctx.arc(cx,shY-34,20,0,TAU);ctx.fill();
  // face direction marker shows rotation
  const fx=-Math.sin(s.phi)*10;ctx.fillStyle=PAL['cv-ink'];if(Math.cos(s.phi)>0){ctx.beginPath();ctx.arc(cx+fx-4,shY-37,2.2,0,TAU);ctx.arc(cx+fx+4,shY-37,2.2,0,TAU);ctx.fill();}
  drawArm(arms[1]);
  // radius ruler
  const ry=shY+40;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(cx,ry);ctx.lineTo(cx+s.r*px,ry);ctx.moveTo(cx+s.r*px,ry-5);ctx.lineTo(cx+s.r*px,ry+5);ctx.stroke();
  for(let m=0.1;m<=s.r+1e-6;m+=0.1){ctx.beginPath();ctx.moveTo(cx+m*px,ry-3);ctx.lineTo(cx+m*px,ry+3);ctx.stroke();}
  txt(ctx,'r = '+fmtNum(s.r,2)+' m',cx+s.r*px+8,ry+4,{s:12*k,c:PAL['cv-soft']});
  // top-down view
  const tx=640,ty=250,tp=120;rr(ctx,tx-150,ty-150,300,300,14);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,'View from above',tx,ty-128,{s:12*k,c:PAL['cv-soft'],a:'center',w:600});
  ctx.strokeStyle=PAL['line'];ctx.setLineDash([3,4]);ctx.beginPath();ctx.arc(tx,ty,0.8*tp,0,TAU);ctx.stroke();ctx.beginPath();ctx.arc(tx,ty,0.25*tp,0,TAU);ctx.stroke();ctx.setLineDash([]);
  // hand trail
  const n=24,dphi=Math.min(s.om*0.25,TAU*0.9);for(let i=0;i<n;i++){const a=s.phi-dphi*i/n;ctx.fillStyle=PAL['s4'];ctx.globalAlpha=0.5*(1-i/n);
    [0,Math.PI].forEach(o=>{ctx.beginPath();ctx.arc(tx+Math.cos(a+o)*s.r*tp,ty+Math.sin(a+o)*s.r*tp,3,0,TAU);ctx.fill();});}ctx.globalAlpha=1;
  ctx.strokeStyle=skin;ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(tx-Math.cos(s.phi)*s.r*tp,ty-Math.sin(s.phi)*s.r*tp);ctx.lineTo(tx+Math.cos(s.phi)*s.r*tp,ty+Math.sin(s.phi)*s.r*tp);ctx.stroke();
  ctx.fillStyle=body;ctx.beginPath();ctx.ellipse(tx,ty,26,18,s.phi,0,TAU);ctx.fill();ctx.fillStyle=skin;ctx.beginPath();ctx.arc(tx,ty,11,0,TAU);ctx.fill();
  [0,Math.PI].forEach(o=>{ctx.fillStyle=s.w>0?PAL['cv-lamp']:skin;ctx.beginPath();ctx.arc(tx+Math.cos(s.phi+o)*s.r*tp,ty+Math.sin(s.phi+o)*s.r*tp,s.w>0?5+2*Math.sqrt(s.w):5,0,TAU);ctx.fill();});
  txt(ctx,'0.8 m',tx+0.8*tp*0.71+4,ty+0.8*tp*0.71+10,{s:10.5*k,c:PAL['cv-soft']});
  // readouts
  const I=skI(s.r,s.w),hon=atLeast('honors');rr(ctx,10,10,250,hon?128:58,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,'Spin: '+fmtNum(s.om/TAU,2)+' rev/s',22,38,{s:16*k,w:700});
  if(hon){txt(ctx,'I = '+fmtNum(I,2)+' kg·m²',22,64,{s:12.5*k,c:PAL['cv-soft']});txt(ctx,'L = Iω = '+fmtNum(I*s.om,2)+' kg·m²/s',22,86,{s:12.5*k,c:PAL['cv-soft']});
    txt(ctx,'KE = ½Iω² = '+fmtNum(0.5*I*s.om*s.om,1)+' J',22,108,{s:12.5*k,c:PAL['cv-soft']});}
  else txt(ctx,'Hands '+fmtNum(s.r*100,0)+' cm from the axis',22,54,{s:12*k,c:PAL['cv-soft']});}

function drawSpool(sim,ctx,k){const s=sim.st,p=sim.p,ax=300,ay=95,R=45,pxm=R/SR,y0=ay+40,yy=y0+s.y*pxm,a=spoolA(p);
  // support
  ctx.fillStyle=PAL['cv-lamp'];ctx.fillRect(ax-90,30,180,10);ctx.fillRect(ax-4,40,8,ay-40);
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,y0+DROP*pxm+20,800,450-(y0+DROP*pxm+20));
  // spool
  ctx.save();ctx.translate(ax,ay);ctx.rotate(s.phiS);
  if(p.shape==='ring'){ctx.strokeStyle=PAL['s5'];ctx.lineWidth=12;ctx.beginPath();ctx.arc(0,0,R-6,0,TAU);ctx.stroke();ctx.lineWidth=2.5;ctx.beginPath();for(let i=0;i<4;i++){ctx.moveTo(0,0);ctx.lineTo(Math.cos(i*Math.PI/2)*(R-10),Math.sin(i*Math.PI/2)*(R-10));}ctx.stroke();}
  else{ctx.fillStyle=PAL['s5'];ctx.beginPath();ctx.arc(0,0,R,0,TAU);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(R-6,0);ctx.stroke();}
  ctx.restore();ctx.fillStyle=PAL['cv-ink'];ctx.beginPath();ctx.arc(ax,ay,5,0,TAU);ctx.fill();
  // string and weight
  const sx=ax+R,bw=26+16*Math.sqrt(p.mh);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(sx,ay);ctx.lineTo(sx,yy);ctx.stroke();
  ctx.fillStyle=PAL['s1'];rr(ctx,sx-bw/2,yy,bw,bw*0.8,5);ctx.fill();txt(ctx,fmtNum(p.mh,1)+' kg',sx,yy+bw*0.4+4,{s:11*k,w:700,c:'#fff',a:'center'});
  // force and torque arrows
  const arrow=(x,y,dx,dy,col,lbl)=>{ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+dx,y+dy);ctx.stroke();const an=Math.atan2(dy,dx);ctx.beginPath();ctx.moveTo(x+dx,y+dy);ctx.lineTo(x+dx-9*Math.cos(an-0.4),y+dy-9*Math.sin(an-0.4));ctx.lineTo(x+dx-9*Math.cos(an+0.4),y+dy-9*Math.sin(an+0.4));ctx.closePath();ctx.fill();if(lbl)txt(ctx,lbl,x+dx+8,y+dy/2,{s:12*k,c:col,w:600});};
  const T=p.mh*(G-a);arrow(sx,yy,0,-Math.min(70,T*6),PAL['s3'],'T = '+fmtNum(T,1)+' N');arrow(sx,yy+bw*0.8,0,Math.min(80,p.mh*G*6),PAL['s1'],'mg = '+fmtNum(p.mh*G,1)+' N');
  ctx.strokeStyle=PAL['s4'];ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(ax,ay,R+16,-1.2,0.3);ctx.stroke();ctx.fillStyle=PAL['s4'];const ea=0.3,ex=ax+(R+16)*Math.cos(ea),ey=ay+(R+16)*Math.sin(ea);
  ctx.beginPath();ctx.moveTo(ex+6,ey-4);ctx.lineTo(ex-6,ey-2);ctx.lineTo(ex+1,ey+9);ctx.closePath();ctx.fill();txt(ctx,'τ = TR',ax+R+30,ay-14,{s:12*k,c:PAL['s4'],w:600});
  // ruler
  const rx=sx+90;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(rx,y0);ctx.lineTo(rx,y0+DROP*pxm);ctx.stroke();
  for(let m=0;m<=DROP+1e-6;m+=0.2){const y=y0+m*pxm,big=Math.abs(m-Math.round(m*2)/2)<1e-6;ctx.beginPath();ctx.moveTo(rx,y);ctx.lineTo(rx+(big?10:5),y);ctx.stroke();if(big)txt(ctx,fmtNum(m,1)+' m',rx+14,y+4,{s:11*k,c:PAL['cv-soft']});}
  // readouts
  rr(ctx,540,20,250,128,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  const I=spoolK(p)*p.M*SR*SR;txt(ctx,'a = '+fmtNum(a,2)+' m/s²  (g = 9.8)',552,46,{s:14*k,w:700});
  txt(ctx,'I = '+(p.shape==='ring'?'MR²':'½MR²')+' = '+fmtNum(I,3)+' kg·m²',552,70,{s:12.5*k,c:PAL['cv-soft']});
  txt(ctx,'τ = TR = '+fmtNum(T*SR,2)+' N·m',552,92,{s:12.5*k,c:PAL['cv-soft']});
  txt(ctx,'Iα = '+fmtNum(I*a/SR,2)+' N·m',552,114,{s:12.5*k,c:PAL['cv-soft']});
  txt(ctx,'v = '+fmtNum(s.landed?s.vLand:s.v,2)+' m/s'+(s.landed?' (landed)':''),552,136,{s:12.5*k,c:PAL['cv-soft']});}

BioLab.register(ROT);
})();
