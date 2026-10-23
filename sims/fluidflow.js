(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,axes,legend,serColor}=BioLab.h;

const G=9.8, RHO=1000, P1G=25;             // inlet gauge pressure, kPa
/* Pipe view: 100 px = 1 m along the pipe and in height; widths drawn at 5 px per cm. */
const PX=100, DPX=5, YA=360, XA0=30, XA1=330, XB0=450, XB1=770, SP=[180,610], DOT=0.5;
/* Tank view: 170 px = 1 m. */
const TPX=170, GROUND=420, TX0=60, TX1=200, TANK_AREA=0.04;

const area=dcm=>Math.PI*Math.pow(dcm/200,2);
function pipe(p){const A1=area(p.d1),A2=area(p.d2),Q=p.Q/1000,v1=Q/A1,v2=Q/A2,h=p.h;
  const P2=P1G+0.5*RHO*(v1*v1-v2*v2)/1000-RHO*G*h/1000;return {A1,A2,Q,v1,v2,h,P1:P1G,P2};}
function smooth(u){u=clamp(u,0,1);return u*u*(3-2*u);}
function geomAt(p,x){const u=smooth((x-XA1)/(XB0-XA1));return {y:YA-lerp(0,p.h,u)*PX,d:lerp(p.d1,p.d2,u)};}
function tank(sim){const p=sim.p,L=sim.st?sim.st.level:p.level,hole=p.hole,head=Math.max(0,L-hole),v=Math.sqrt(2*G*head);
  const tf=Math.sqrt(2*hole/G),R=v*tf,a=area(p.hd);return {L,hole,head,v,tf,R,q:a*v*1000};}
const isPipe=sim=>sim.p.mode==='pipe';

function modeUI(sim){const m=sim.p.mode,ui=sim.ui;if(!ui||!ui.sec)return;
  (sim.def.controls||[]).forEach(c=>{if(!c.mode)return;const e=ui.sec.querySelector('#fluidflow-'+c.id)||ui.sec.querySelector('#fluidflow-'+c.id+'-l');const w=e&&e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl||'bio')||c.mode!==m;});
  (sim.def.metrics||[]).forEach(mm=>{const t=ui.tiles&&ui.tiles[mm.id];const w=t&&t.num&&t.num.closest('.tile');if(w)w.hidden=!atLeast(mm.lvl||'bio')||(mm.mode&&mm.mode!==m);});}

function seedDots(sim){const r=rng(7),p=sim.p,dots=[],Amax=Math.max(area(p.d1),area(p.d2));let guard=0;
  while(dots.length<170&&guard++<20000){const x=lerp(XA0,XB1,r());if(r()<area(geomAt(p,x).d)/Amax)dots.push({x,f:(r()-0.5)*0.84});}sim.vis.dots=dots;sim.vis.key=p.d1+'|'+p.d2+'|'+p.h;}
function arrowH(ctx,x0,x1,y,col,w){const hd=Math.min(10,Math.abs(x1-x0));ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=w||3;ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x1-hd*0.8,y);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x1,y);ctx.lineTo(x1-hd,y-hd*0.55);ctx.lineTo(x1-hd,y+hd*0.55);ctx.closePath();ctx.fill();}

const SIM={
  id:'fluidflow',hash:'fluidflow',apUnit:7,order:2,tab:'Fluid flow and Bernoulli',kind:'Simulation',prereq:['buoyancy'],
  card:'Squeeze and raise a water pipe to see the water speed up and its pressure drop, then punch holes in a tank and predict where the stream lands.',
  title:'Fluid flow and Bernoulli’s principle',
  lede:{bio:'Water flows through a pipe that narrows. Watch the dots speed up in the narrow part and the pressure gauges drop. Then switch to the tank and see how fast water squirts out of a hole.',
        honors:'Use continuity, A₁v₁ = A₂v₂, to predict speeds, and Bernoulli’s equation to predict pressures as the pipe narrows and rises. In the tank, Torricelli’s law says water leaves a hole at v = √(2gh).',
        ap:'Treat the water as an ideal incompressible fluid. Track how pressure, kinetic energy per volume (½ρv²) and gravitational energy per volume (ρgy) trade off along a streamline, and combine Torricelli’s law with projectile motion to predict range and flow rate.'},
  scale:'Pipe: the sections are 6–12 cm and 3–12 cm across, carrying up to 3 L of water each second, like a large garden hose. Widths are drawn 5× larger than lengths so you can see them, and the dots move at half speed. Tank: up to 2 m of water.',
  timeScale:1,dtMax:0.01,prewarm:0,sampleDt:0.05,window:15,unit:'s',chChange:1.5,chReveal:5,
  controls:[
    {id:'mode',label:'Setup',type:'seg',def:'pipe',lvl:'bio',options:[{v:'pipe',l:'Pipe'},{v:'tank',l:'Tank with a hole'}],onChange(sim){modeUI(sim);}},
    {id:'Q',mode:'pipe',label:'Flow rate (pump)',type:'range',min:0.5,max:3,step:0.1,def:2,unit:' L/s',lvl:'bio',help:'Liters of water the pump pushes through the pipe each second.'},
    {id:'d2',mode:'pipe',label:'Width of section 2',type:'range',min:3,max:12,step:0.5,def:4,unit:' cm',lvl:'bio'},
    {id:'d1',mode:'pipe',label:'Width of section 1',type:'range',min:6,max:12,step:0.5,def:8,unit:' cm',lvl:'honors'},
    {id:'h',mode:'pipe',label:'Height of section 2',type:'range',min:0,max:1.5,step:0.1,def:0,unit:' m',lvl:'honors',help:'Raises section 2 above section 1.'},
    {id:'level',mode:'tank',label:'Water level',type:'range',min:0.5,max:2,step:0.1,def:2,unit:' m',lvl:'bio',onChange(sim){if(sim.st)sim.st.level=sim.p.level;}},
    {id:'hole',mode:'tank',label:'Hole height above the floor',type:'range',min:0.1,max:1.9,step:0.1,def:1,unit:' m',lvl:'bio'},
    {id:'refill',mode:'tank',label:'Keep the tank topped up',type:'toggle',def:true,lvl:'honors',help:'Turn off to watch the tank drain.',onChange(sim){if(sim.st&&sim.p.refill)sim.st.level=sim.p.level;}},
    {id:'hd',mode:'tank',label:'Hole diameter',type:'range',min:0.5,max:3,step:0.1,def:1.5,unit:' cm',lvl:'ap'}
  ],
  actions:[{id:'refillNow',label:'Refill the tank',run(sim){sim.st.level=sim.p.level;}}],
  onLevel(sim){modeUI(sim);},
  init(sim){return {level:sim.p.level,drain:0};},
  step(sim,dt){const p=sim.p,s=sim.st;if(p.mode!=='tank')return;
    if(p.refill){s.level=p.level;return;}
    const head=Math.max(0,s.level-p.hole),v=Math.sqrt(2*G*head);s.level=Math.max(Math.min(s.level,p.level),s.level-area(p.hd)*v/TANK_AREA*dt);},
  metrics:[
    {id:'v1',mode:'pipe',label:'Speed in section 1',unit:'m/s',min:0,max:null,d:2,get:s=>isPipe(s)?pipe(s.p).v1:0},
    {id:'v2',mode:'pipe',label:'Speed in section 2',unit:'m/s',min:0,max:null,d:2,get:s=>isPipe(s)?pipe(s.p).v2:0},
    {id:'P1',mode:'pipe',label:'Pressure in section 1',unit:'kPa',min:0,max:null,d:1,get:s=>isPipe(s)?pipe(s.p).P1:0},
    {id:'P2',mode:'pipe',label:'Pressure in section 2',unit:'kPa',min:0,max:null,d:1,get:s=>isPipe(s)?pipe(s.p).P2:0},
    {id:'dP',mode:'pipe',label:'Pressure difference P₁ − P₂',unit:'kPa',lvl:'honors',min:null,max:null,d:2,get:s=>isPipe(s)?pipe(s.p).P1-pipe(s.p).P2:0},
    {id:'ratio',mode:'pipe',label:'Area ratio A₁/A₂',unit:'',lvl:'ap',min:0,max:null,d:2,get:s=>Math.pow(s.p.d1/s.p.d2,2)},
    {id:'vout',mode:'tank',label:'Exit speed',unit:'m/s',min:0,max:null,d:2,get:s=>isPipe(s)?0:tank(s).v},
    {id:'range',mode:'tank',label:'Stream lands',unit:'m from the tank',min:0,max:null,d:2,get:s=>isPipe(s)?0:tank(s).R},
    {id:'head',mode:'tank',label:'Water above the hole',unit:'m',min:0,max:null,d:2,get:s=>isPipe(s)?0:tank(s).head},
    {id:'tfall',mode:'tank',label:'Fall time to the floor',unit:'s',lvl:'honors',min:0,max:null,d:3,get:s=>isPipe(s)?0:tank(s).tf},
    {id:'qout',mode:'tank',label:'Flow rate out',unit:'L/s',lvl:'ap',min:0,max:null,d:3,get:s=>isPipe(s)?0:tank(s).q}
  ],
  graphs:[
    {id:'speeds',label:'Pipe: speeds',lines:['v1','v2'],yl:'Speed (m/s)'},
    {id:'press',label:'Pipe: pressures',lines:['P1','P2'],yl:'Pressure above air (kPa)'},
    {id:'bern',label:'Pipe: Bernoulli energy budget',lvl:'honors',custom:true},
    {id:'tankg',label:'Tank: exit speed',lines:['vout']},
    {id:'rangeg',label:'Tank: where the stream lands',lines:['range']},
    {id:'rvh',label:'Tank: range vs hole height',lvl:'honors',custom:true}
  ],
  defaultGraph:'speeds',
  plot(sim,ctx,box,id){const p=sim.p;
    if(id==='bern'){const r=pipe(p),comp=[[r.P1,0.5*RHO*r.v1*r.v1/1000,0],[r.P2,0.5*RHO*r.v2*r.v2/1000,RHO*G*r.h/1000]],tot=comp[0][0]+comp[0][1];
      box.T=34;box.H=box.ch-34-40;const ax=axes(ctx,box,{xmin:0,xmax:2,ymin:0,ymax:Math.ceil(tot/5)*5+5,xcats:['Section 1','Section 2'],yl:'Energy per volume (kPa = kJ/m³)'});
      const cols=[serColor(1),serColor(0),serColor(2)];comp.forEach((c,i)=>{let y=0;c.forEach((v,j)=>{const x0=ax.X(i+0.25),x1=ax.X(i+0.75);ctx.fillStyle=cols[j];ctx.fillRect(x0,ax.Y(y+v),x1-x0,ax.Y(y)-ax.Y(y+v));y+=v;});
        txt(ctx,y.toFixed(1)+' total',ax.X(i+0.5),ax.Y(y)-6,{s:13,w:700,a:'center'});});
      legend(ctx,box.L+8,16,[{label:'Pressure P',color:cols[0]},{label:'½ρv²',color:cols[1]},{label:'ρgy',color:cols[2]}]);return;}
    if(id==='rvh'){const t=tank(sim),L=t.L,f=y=>2*Math.sqrt(Math.max(0,y*(L-y)));
      const ax=axes(ctx,box,{xmin:0,xmax:2,ymin:0,ymax:2.2,xl:'Hole height above the floor (m)',yl:'Range (m)'});
      ctx.strokeStyle=serColor(1);ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<=100;i++){const y=L*i/100;i?ctx.lineTo(ax.X(y),ax.Y(f(y))):ctx.moveTo(ax.X(y),ax.Y(f(y)));}ctx.stroke();
      ctx.fillStyle=serColor(0);ctx.beginPath();ctx.arc(ax.X(Math.min(p.hole,2)),ax.Y(t.R),6,0,7);ctx.fill();
      txt(ctx,'Water level '+L.toFixed(2)+' m',box.L+10,box.T+14,{s:13,c:PAL['muted']});}},
  narrate(sim){const p=sim.p;
    if(p.mode==='pipe'){const r=pipe(p),ratio=r.A1/r.A2,v1=r.v1.toFixed(2),v2=r.v2.toFixed(2);
      let a;if(Math.abs(ratio-1)<0.01)a=`Both sections are the same width, so the water moves at the same speed, ${v1} m/s, in both.`;
      else if(ratio>1)a=`The same ${p.Q.toFixed(1)} L of water passes every point each second. Section 2 has ${ratio.toFixed(1)}× less area, so the water there moves ${ratio.toFixed(1)}× faster: <b>${v2} m/s</b> instead of ${v1} m/s.`;
      else a=`Section 2 is wider, so the same ${p.Q.toFixed(1)} L each second moves slower there: <b>${v2} m/s</b> instead of ${v1} m/s.`;
      let b;const dP=r.P2-r.P1;if(Math.abs(dP)<0.05)b=' The pressure is the same in both sections.';
      else if(p.h>0.05&&ratio>1.01)b=` Speeding up and climbing ${p.h.toFixed(1)} m both cost pressure, so P₂ is ${r.P2.toFixed(1)} kPa.`;
      else if(p.h>0.05)b=` Climbing ${p.h.toFixed(1)} m costs pressure, so P₂ drops to ${r.P2.toFixed(1)} kPa.`;
      else b=dP<0?` <b>Faster water has lower pressure</b>: the gauge drops from ${r.P1.toFixed(1)} to ${r.P2.toFixed(1)} kPa.`:` Slower water has higher pressure: the gauge rises to ${r.P2.toFixed(1)} kPa.`;
      return a+b;}
    const t=tank(sim);if(t.head<=0.001)return 'The hole is above the water line, so nothing comes out.';
    return `There is ${t.head.toFixed(2)} m of water above the hole, so water leaves at <b>√(2gh) = ${t.v.toFixed(2)} m/s</b>, as fast as if it had fallen ${t.head.toFixed(2)} m. It takes ${t.tf.toFixed(2)} s to fall ${t.hole.toFixed(1)} m to the floor and lands ${t.R.toFixed(2)} m from the tank.`;},
  tour:[
    {title:'Water through a pipe',text:'A pump pushes 2 L of water through this pipe every second. Each dot is a bit of water. The same amount must pass every point each second, because water cannot pile up or squeeze smaller.',
     focus:[20,150,770,280],speed:0.5,setup(sim){BioLab.setValues(sim,{mode:'pipe',Q:2,d1:8,d2:8,h:0});}},
    {title:'Squeeze the pipe',text:'Section 2 is now half as wide. To get the same water through each second, the dots must move faster there. Watch them spread out and race through.',
     focus:[430,150,360,280],speed:0.5,setup(sim){BioLab.setValues(sim,{d2:4});}},
    {lvl:'honors',title:'Continuity',text:'Section 2 has 1/4 the area, so the water goes 4× faster: A₁v₁ = A₂v₂. Compare the two speed labels.',
     focus:[[40,370,250,60],[470,370,300,60]],speed:0.5},
    {title:'Pressure gauges',text:'Each glass tube is a pressure gauge: water rises higher where the pressure is higher. The column over the fast, narrow section is shorter. <b>Faster water has lower pressure.</b>',
     focus:[[150,30,100,350],[580,30,100,350]],speed:0.5},
    {lvl:'honors',title:'Climbing costs pressure',text:'Raise section 2 by 1 m. The water has to be lifted, so its pressure drops by ρgh ≈ 9.8 kPa, on top of the drop from speeding up.',
     focus:[430,20,360,330],speed:0.5,setup(sim){BioLab.setValues(sim,{h:1});}},
    {title:'A tank with a hole',text:'Now water leaks from a hole in the side of a tank. The water above the hole pushes it out. Its speed is the same as if it had fallen from the water surface to the hole.',
     focus:[40,20,220,410],speed:0.5,setup(sim){BioLab.setValues(sim,{mode:'tank',level:2,hole:1.5,refill:true});}},
    {title:'Lower the hole',text:'With the hole lower, there is more water above it, so the water squirts out faster.',
     focus:[150,20,640,420],speed:0.5,setup(sim){BioLab.setValues(sim,{hole:0.5});}},
    {lvl:'honors',title:'Where does it land?',text:'A low hole squirts fast but the water hits the floor quickly. A high hole gives a long fall but a slow stream. Halfway up gives the longest range, here 2.0 m.',
     focus:[150,20,640,420],speed:0.5,setup(sim){BioLab.setValues(sim,{hole:1});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'pipe',Q:2,d1:8,d2:4,h:0,level:2,hole:1,refill:true});BioLab.reset(sim);},
  challenges:[
    {lvl:'bio',q:'Water flows through a pipe that is the same width all the way. Section 2 is squeezed to half the width. What happens to the water’s speed in section 2?',choices:['It speeds up','It slows down','It stays the same'],correct:0,
     baseline:{mode:'pipe',Q:3,d1:8,d2:8,h:0},change:{d2:4},changeText:'Section 2 squeezed narrower',watch:'v2',
     explain:'The same amount of water must pass every point each second. A narrower section can only carry it if the water moves faster: half the width means 1/4 the area and 4× the speed.'},
    {lvl:'bio',q:'Squeezing section 2 makes the water there move faster. What does the pressure gauge on section 2 do?',choices:['It rises','It drops','It stays the same'],correct:1,
     baseline:{mode:'pipe',Q:3,d1:8,d2:8,h:0},change:{d2:4},changeText:'Section 2 squeezed narrower',watch:'P2',
     explain:'To speed the water up, something must push it forward: higher pressure behind, lower pressure ahead. So the fast section has lower pressure. This is Bernoulli’s principle, and it surprises most people.'},
    {lvl:'honors',q:'The hole in the tank is moved from 1.5 m up to 0.5 m up, with the water level kept at 2.0 m. How does the stream come out?',choices:['Faster','Slower','The same speed'],correct:0,
     baseline:{mode:'tank',level:2,hole:1.5,refill:true,hd:1.5},change:{hole:0.5},changeText:'Hole moved lower',watch:'vout',
     explain:'The water above the hole goes from 0.5 m to 1.5 m. Torricelli’s law, v = √(2gh), gives 3.1 m/s before and 5.4 m/s after. Deeper water means more pressure pushing it out.'},
    {lvl:'honors',q:'Section 1 is 8 cm wide and the water moves at 0.6 m/s. Section 2 is 4 cm wide. How fast does the water move in section 2?',choices:['0.3 m/s','1.2 m/s','2.4 m/s','4.8 m/s'],correct:2,
     baseline:{mode:'pipe',Q:3,d1:8,d2:4,h:0},watch:'v2',
     explain:'Area goes with width squared, so A₁/A₂ = (8/4)² = 4. Continuity, A₁v₁ = A₂v₂, gives v₂ = 4 × 0.6 = 2.4 m/s. Halving the width does not just double the speed.'},
    {lvl:'ap',q:'Both sections are 8 cm wide and P₁ = 25.0 kPa. Section 2 is raised 1.0 m. What will P₂ read?',choices:['25.0 kPa','15.2 kPa','34.8 kPa','9.8 kPa'],correct:1,
     baseline:{mode:'pipe',Q:2,d1:8,d2:8,h:0},change:{h:1},changeText:'Section 2 raised 1.0 m',watch:'P2',
     explain:'Same width means same speed, so the ½ρv² terms cancel. Bernoulli: P₂ = P₁ − ρgh = 25.0 − 1000 × 9.8 × 1.0 / 1000 = 15.2 kPa.'},
    {lvl:'ap',q:'Water stands 2.0 m deep. The hole moves from 0.2 m up to 1.0 m up, so the water leaves more slowly. Where does the stream land now?',choices:['Closer to the tank','Farther from the tank','In the same place'],correct:1,
     baseline:{mode:'tank',level:2,hole:0.2,refill:true,hd:1.5},change:{hole:1},changeText:'Hole moved up to 1.0 m',watch:'range',
     explain:'R = v·t = √(2g(H − y))·√(2y/g) = 2√(y(H − y)). At y = 0.2 m, R = 1.2 m. At y = 1.0 m, R = 2.0 m, the maximum, because the longer fall time more than makes up for the slower exit speed.'}
  ],
  lab:{bio:'<p><b>Question:</b> How does the width of a pipe change the speed and pressure of the water?</p><ol><li>Keep the flow rate at 2.0 L/s. Set section 2 to 12, 8, 6, 4 and 3 cm.</li><li>Record a trial at each width: speed and pressure in section 2.</li></ol><p>Describe the pattern. Where is the water fastest, and where is its pressure lowest?</p>',
       honors:'<p><b>Question:</b> Does the water speed follow A₁v₁ = A₂v₂?</p><ol><li>Record v₂ for section 2 widths from 3 to 12 cm.</li><li>Calculate A₂ for each and plot v₂ (y) against 1/A₂ (x).</li><li>Switch to the tank. Record the exit speed for hole heights 0.2 to 1.8 m and plot v² against the water above the hole.</li></ol><p>What do the slopes of your two graphs equal?</p>',
       ap:'<p><b>Question:</b> Where should the hole be to send the stream farthest?</p><ol><li>Set the water level to 2.0 m. Record the range for hole heights 0.1 m to 1.9 m.</li><li>Repeat with a 1.2 m water level.</li><li>Derive R(y) from Torricelli’s law and projectile motion, and compare it to your data.</li></ol><p><b>Claim–evidence–reasoning:</b> State where the maximum range occurs, support it with data, and explain using the trade-off between exit speed and fall time.</p>'},
  terms:[
    {t:'Flow rate',d:'The volume of fluid passing a point each second, in L/s or m³/s.'},
    {t:'Continuity',d:'For a liquid in a pipe, the same flow rate passes every section, so narrow sections carry faster flow.'},
    {t:'Bernoulli’s principle',d:'Where a fluid moves faster, its pressure is lower.'},
    {t:'Pressure gauge',d:'A device that reads pressure. The glass standpipes show it as the height of a water column.'},
    {lvl:'honors',t:'Continuity equation',d:'A₁v₁ = A₂v₂ for an incompressible fluid.'},
    {lvl:'honors',t:'Bernoulli’s equation',d:'P + ½ρv² + ρgy is the same at every point along a streamline in ideal flow.'},
    {lvl:'honors',t:'Torricelli’s law',d:'Water leaves a hole at depth h below the surface with speed v = √(2gh).'},
    {lvl:'ap',t:'Volume flow rate',d:'Q = Av, in m³/s. 1 L/s = 0.001 m³/s.'},
    {lvl:'ap',t:'Ideal fluid',d:'Incompressible, with no viscosity and steady, non-turbulent flow.'}],
  about:'<p><b>Pipe.</b> Water (ρ = 1,000 kg/m³) is ideal: incompressible, no viscosity, steady flow. The speed in each section is v = Q/A with A = πd²/4. The inlet gauge pressure is fixed at 25.0 kPa, and section 2 follows Bernoulli’s equation: P₂ = P₁ + ½ρ(v₁² − v₂²) − ρgh. Each standpipe rises to a height P/(ρg) above the pipe’s center. Pipe widths are drawn 5× larger than lengths, and the dots move at half the true speed. Real pipes lose some pressure to friction, which this model ignores.</p><p><b>Tank.</b> The tank is wide compared with the hole, so the surface barely moves and Torricelli’s law applies: v = √(2g(H − y)). The stream leaves horizontally and falls freely, so t = √(2y/g) and R = vt. With topping up off, the level drops at a rate (a/A)·v with a tank area of 0.04 m². Real streams narrow just past the hole (the vena contracta), so real flow rates are about 60% of Av.</p>',
  initVis(sim){seedDots(sim);sim.vis.drops=[];sim.vis.emit=0;},
  draw(sim,ctx,vdt,k){const p=sim.p;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    if(p.mode==='pipe')drawPipe(sim,ctx,vdt,k);else drawTank(sim,ctx,vdt,k);},
  thumbSetup(sim){BioLab.setValues(sim,{mode:'pipe',d2:4,h:0.6});}
};

function drawPipe(sim,ctx,vdt,k){const p=sim.p,r=pipe(p),v=sim.vis;
  if(v.key!==p.d1+'|'+p.d2+'|'+p.h)seedDots(sim);
  const top=[],bot=[];for(let x=XA0;x<=XB1;x+=5){const g=geomAt(p,x);top.push([x,g.y-g.d*DPX/2]);bot.push([x,g.y+g.d*DPX/2]);}
  // supports
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,425,800,25);
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=6;[100,280,520,720].forEach(x=>{const g=geomAt(p,x);ctx.beginPath();ctx.moveTo(x,g.y+g.d*DPX/2);ctx.lineTo(x,425);ctx.stroke();});
  // reference line at section 1 height
  if(p.h>0.05){ctx.strokeStyle=PAL['muted'];ctx.setLineDash([5,5]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(XB0,YA);ctx.lineTo(XB1,YA);ctx.stroke();ctx.setLineDash([]);
    const yb=YA-p.h*PX,x=XB1-22;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,YA);ctx.lineTo(x,yb+p.d2*DPX/2+2);ctx.stroke();
    txt(ctx,p.h.toFixed(1)+' m',x-6,(YA+yb)/2+10,{s:12*k,w:700,c:PAL['cv-soft'],a:'right'});}
  // water
  ctx.fillStyle=PAL['cv-water'];ctx.beginPath();top.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));for(let i=bot.length-1;i>=0;i--)ctx.lineTo(bot[i][0],bot[i][1]);ctx.closePath();ctx.fill();
  // dots
  if(vdt>0){v.dots.forEach(d=>{const g=geomAt(p,d.x),sp=r.Q/area(g.d)*PX*DOT;d.x+=sp*vdt;if(d.x>XB1){d.x=XA0+(d.x-XB1);}});}
  ctx.fillStyle=PAL['cv-sub'];v.dots.forEach(d=>{const g=geomAt(p,d.x);ctx.beginPath();ctx.arc(d.x,g.y+d.f*g.d*DPX/2,2.6,0,7);ctx.fill();});
  // walls
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;[top,bot].forEach(e=>{ctx.beginPath();e.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();});
  ctx.beginPath();ctx.moveTo(XA0,top[0][1]);ctx.lineTo(XA0,bot[0][1]);ctx.stroke();
  // standpipes (pressure gauges)
  const tot=r.P1*1000/(RHO*G)+r.v1*r.v1/(2*G);
  [[SP[0],r.P1,0,p.d1,'P₁'],[SP[1],r.P2,p.h,p.d2,'P₂']].forEach(([x,P,h,d,lab])=>{const yc=YA-h*PX,yp=yc-d*DPX/2,col=P*1000/(RHO*G)*PX,ytop=yc-col;
    ctx.fillStyle=PAL['cv-water'];ctx.fillRect(x-6,ytop,12,yp-ytop+2);ctx.fillStyle=PAL['cv-sub'];ctx.globalAlpha=0.35;ctx.fillRect(x-6,ytop,12,yp-ytop+2);ctx.globalAlpha=1;
    ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-8,yp+1);ctx.lineTo(x-8,40);ctx.moveTo(x+8,yp+1);ctx.lineTo(x+8,40);ctx.stroke();
    ctx.strokeStyle=PAL['cv-sub'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-12,ytop);ctx.lineTo(x+12,ytop);ctx.stroke();
    pill(ctx,lab+' = '+P.toFixed(1)+' kPa',x+(x<400?72:-74)*Math.min(k,1.4),ytop+24,PAL['card'],PAL['cv-ink'],12*k);});
  if(atLeast('ap')){const ye=YA-tot*PX;ctx.strokeStyle=serColor(4);ctx.setLineDash([8,5]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(XA0,ye);ctx.lineTo(XB1,ye);ctx.stroke();ctx.setLineDash([]);
    txt(ctx,'Energy line: P/ρg + v²/2g + y',XB1,ye-8,{s:12*k,w:700,c:serColor(4),a:'right'});}
  // speed labels under each section
  const yl1=YA+p.d1*DPX/2+28,yl2=YA-p.h*PX+p.d2*DPX/2+28;
  pill(ctx,'v₁ = '+r.v1.toFixed(2)+' m/s',SP[0],yl1,serColor(0),'#ffffff',13*k);
  pill(ctx,'v₂ = '+r.v2.toFixed(2)+' m/s',SP[1],yl2,serColor(0),'#ffffff',13*k);
  if(atLeast('honors')){txt(ctx,'A₁ = '+(r.A1*1e4).toFixed(1)+' cm²',SP[0],yl1+24*k,{s:12*k,c:PAL['cv-soft'],a:'center'});txt(ctx,'A₂ = '+(r.A2*1e4).toFixed(1)+' cm²',SP[1],yl2+24*k,{s:12*k,c:PAL['cv-soft'],a:'center'});}
  arrowH(ctx,XA0+6,XA0+70,YA-p.d1*DPX/2-16,PAL['cv-soft'],3);
  txt(ctx,p.Q.toFixed(1)+' L/s',XA0+80,YA-p.d1*DPX/2-11,{s:13*k,w:700});
}

function drawTank(sim,ctx,vdt,k){const p=sim.p,t=tank(sim),v=sim.vis,Y=m=>GROUND-m*TPX,X=m=>TX1+m*TPX;
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,GROUND,800,450-GROUND);
  // floor ruler
  ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(X(0),GROUND+6);ctx.lineTo(X(3.4),GROUND+6);ctx.stroke();
  for(let m=0;m<=3.4+1e-9;m+=0.25){const x=X(m),maj=Math.abs(m*2-Math.round(m*2))<1e-6;ctx.beginPath();ctx.moveTo(x,GROUND+6);ctx.lineTo(x,GROUND+(maj?16:11));ctx.stroke();
    if(maj&&m>0&&Math.abs(m-Math.round(m))<1e-6)txt(ctx,m.toFixed(0)+' m',x,GROUND+28,{s:12*k,a:'center',c:PAL['cv-ink']});}
  // water in tank
  const ys=Y(t.L);ctx.fillStyle=PAL['cv-water'];ctx.fillRect(TX0,ys,TX1-TX0,GROUND-ys);
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(TX0,Y(2.2));ctx.lineTo(TX0,GROUND);ctx.lineTo(TX1,GROUND);ctx.lineTo(TX1,Y(2.2));ctx.stroke();
  // height ruler
  ctx.lineWidth=1.5;ctx.strokeStyle=PAL['cv-soft'];for(let m=0;m<=2;m+=0.5){const y=Y(m);ctx.beginPath();ctx.moveTo(TX0-8,y);ctx.lineTo(TX0,y);ctx.stroke();txt(ctx,m.toFixed(1)+' m',TX0-11,y+4,{s:12*k,c:PAL['cv-soft'],a:'right'});}
  // refill faucet
  if(p.refill){ctx.fillStyle=PAL['cv-lamp'];ctx.fillRect(110,14,60,10);ctx.fillRect(110,14,10,22);ctx.fillStyle=PAL['cv-water'];ctx.fillRect(112,36,6,ys-36);ctx.fillStyle=PAL['cv-sub'];ctx.globalAlpha=0.4;ctx.fillRect(112,36,6,ys-36);ctx.globalAlpha=1;}
  // hole and water depth above it
  const yh=Y(t.hole);ctx.fillStyle=PAL['cv-lamp'];ctx.fillRect(TX1-2,yh-5,12,10);
  if(t.head>0.001){ctx.strokeStyle=serColor(0);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(TX1-22,ys+2);ctx.lineTo(TX1-22,yh-2);ctx.stroke();
    [ys+2,yh-2].forEach((yy,i)=>{ctx.beginPath();ctx.moveTo(TX1-22,yy);ctx.lineTo(TX1-27,yy+(i?-7:7));ctx.lineTo(TX1-17,yy+(i?-7:7));ctx.closePath();ctx.fillStyle=serColor(0);ctx.fill();});
    if(yh-ys>60)txt(ctx,'h = '+t.head.toFixed(2)+' m',TX1-30,(ys+yh)/2+5,{s:12*k,w:700,c:serColor(0),a:'right'});
    // stream
    const pts=[];for(let i=0;i<=40;i++){const tt=t.tf*i/40;pts.push([X(t.v*tt)+10,Y(t.hole-0.5*G*tt*tt)]);}
    ctx.strokeStyle=PAL['cv-sub'];ctx.globalAlpha=0.45;ctx.lineWidth=Math.max(3,p.hd*3);ctx.lineCap='round';ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();ctx.globalAlpha=1;ctx.lineCap='butt';
    if(vdt>0){v.emit+=vdt*28;while(v.emit>=1&&v.drops.length<120){v.emit-=1;v.drops.push({a:0});}v.emit=Math.min(v.emit,1);v.drops.forEach(d=>d.a+=vdt);}
    v.drops=v.drops.filter(d=>d.a<t.tf);ctx.fillStyle=PAL['cv-sub'];v.drops.forEach(d=>{ctx.beginPath();ctx.arc(X(t.v*d.a)+10,Y(t.hole-0.5*G*d.a*d.a),3,0,7);ctx.fill();});
    // splash and landing marker
    const xl=X(t.R)+10;ctx.fillStyle=serColor(0);ctx.beginPath();ctx.moveTo(xl,GROUND+4);ctx.lineTo(xl-7,GROUND+16);ctx.lineTo(xl+7,GROUND+16);ctx.closePath();ctx.fill();
    pill(ctx,'lands '+t.R.toFixed(2)+' m',Math.min(xl,730),GROUND-22,PAL['card'],PAL['cv-ink'],12*k);
    // speed arrow at the hole
    arrowH(ctx,TX1+14,TX1+14+t.v*12,yh-18,serColor(3),3);txt(ctx,'v = '+t.v.toFixed(2)+' m/s',TX1+14,yh-30,{s:13*k,w:700,c:serColor(3)});
    if(atLeast('honors')){ctx.strokeStyle=PAL['muted'];ctx.setLineDash([4,4]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(TX1+12,yh+8);ctx.lineTo(TX1+12,GROUND);ctx.stroke();ctx.setLineDash([]);
      if(GROUND-yh>50)txt(ctx,'falls '+t.hole.toFixed(1)+' m',TX1+18,(yh+GROUND)/2+20,{s:12*k,c:PAL['cv-soft']});}}
  else{txt(ctx,'Hole is above the water',TX1+20,yh+5,{s:13*k,w:700,c:PAL['cv-soft']});v.drops=[];}
  txt(ctx,'level '+t.L.toFixed(2)+' m',TX0+6,ys+18,{s:12*k,w:700});
}

BioLab.register(SIM);
})();
