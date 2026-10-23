(function(){
'use strict';
const {clamp,lerp,rr,txt,pill,atLeast,PAL,axes,legend,serColor,lvText}=BioLab.h;

/* Scene: an overflow can on a bench, a spring scale above it, a catch cup under the spout,
   a pressure probe on a hose, and a free-body diagram. 500 px = 1 m in the tank. */
const G=9.8, P0=101.3, PXM=500, SURF=212, FLOOR=412, RIM=188, CX=240, PROBE_X=168;
const DEPTH=(FLOOR-SURF)/PXM;             // 0.40 m of liquid below the spout
const TANK_A=0.15;                         // tank floor area, m² (0.5 m × 0.3 m)
const KSPR=600;                            // spring-scale stiffness, N/m
const CUP={x:425,w:80,top:302,bot:412,cap:2000};   // catch cup, capacity in mL
const BLOCKS={
  wood:{n:'Wood',rho:600,fill:'#a8743f',lab:'#ffffff'},
  ice:{n:'Ice',rho:917,fill:'#bfe3f0',lab:'#16323d'},
  alum:{n:'Aluminum',rho:2700,fill:'#9aa4ae',lab:'#1b2229'},
  foam:{n:'Styrofoam',rho:50,fill:'#f2f1ea',lab:'#333333'},
  mystery:{n:'Mystery',rho:1200,fill:'#6b3fa0',lab:'#ffffff'}};
const FLUIDS={
  water:{n:'Fresh water',rho:1000,tok:'cv-water',a:1},
  salt:{n:'Very salty water',rho:1200,tok:'cv-water',a:1,salt:true},
  oil:{n:'Oil',rho:900,tok:'cv-e',a:0.32},
  honey:{n:'Honey',rho:1420,tok:'cv-prod',a:0.45},
  mercury:{n:'Mercury',rho:13600,tok:'cv-glass',a:0.85}};

const side=p=>p.size/100;
const hookTarget=p=>lerp(-0.11,0.28,p.lower/100);
function hw(shape,y){const f=clamp((FLOOR-y)/(FLOOR-RIM),0,1);if(shape==='wide')return lerp(95,170,f);if(shape==='narrow')return lerp(170,95,f);return 150;}
function forcesAt(p,z,yh,level){const a=side(p),B=BLOCKS[p.block],F=FLUIDS[p.fluid],m=B.rho*a*a*a;
  const sub=clamp(z+level,0,a),Fb=F.rho*G*a*a*sub,T=z>yh?KSPR*(z-yh):0;return {a,m,W:m*G,sub,Fb,T,Vs:a*a*sub};}
function equilibrium(p,yh){let lo=-0.3,hi=DEPTH;const f=z=>{const r=forcesAt(p,z,yh,0);return r.W-r.Fb-r.T;};
  if(f(hi)>0)return hi;for(let i=0;i<60;i++){const mid=(lo+hi)/2;if(f(mid)>0)lo=mid;else hi=mid;}return (lo+hi)/2;}
function fresh(sim){const s=sim.st;if(!s)return;const r=forcesAt(sim.p,s.z,s.yh,s.level);s.vout=r.Vs;s.level=0;s.cup=0;s.flow=0;}
const fmt=(v,d)=>Number(v).toFixed(d);
const bName=p=>BLOCKS[p.block].n, fName=p=>FLUIDS[p.fluid].n;
const probeH=p=>p.gdepth/100;
const pressure=p=>P0+FLUIDS[p.fluid].rho*G*probeH(p)/1000;

function arrow(ctx,x,y0,y1,col,w){const dir=Math.sign(y1-y0)||1,hd=Math.min(9,Math.abs(y1-y0));ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=w||4;
  ctx.beginPath();ctx.moveTo(x,y0);ctx.lineTo(x,y1-dir*hd*0.8);ctx.stroke();ctx.beginPath();ctx.moveTo(x,y1);ctx.lineTo(x-hd*0.7,y1-dir*hd);ctx.lineTo(x+hd*0.7,y1-dir*hd);ctx.closePath();ctx.fill();}
function harrow(ctx,x0,x1,y,col){const dir=Math.sign(x1-x0)||1,hd=Math.min(6,Math.abs(x1-x0));ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x1-dir*hd*0.8,y);ctx.stroke();ctx.beginPath();ctx.moveTo(x1,y);ctx.lineTo(x1-dir*hd,y-hd*0.6);ctx.lineTo(x1-dir*hd,y+hd*0.6);ctx.closePath();ctx.fill();}

const SIM={
  id:'buoyancy',hash:'buoyancy',apUnit:7,order:1,tab:'Buoyancy and pressure',kind:'Simulation',
  card:'Lower blocks into water, oil, honey and mercury on a spring scale and catch the overflow to see why things float or sink.',
  title:'Buoyancy and pressure',
  lede:{bio:'Hang a block from a spring scale and lower it into a full can. The liquid pushes up on the block, the scale reading drops, and the liquid the block pushes aside spills into a cup.',
        honors:'The buoyant force equals the weight of the displaced fluid, F_B = ρ_fluid·g·V_sub. Pressure grows with depth, P = P₀ + ρgh, and the extra push on the bottom face is where buoyancy comes from.',
        ap:'Apply Archimedes’ principle to hanging, floating and sunken blocks. Use the scale reading in air and in liquid to find an unknown density, and connect pressure on each face to the net upward force.'},
  scale:'The tank holds 40 cm of liquid. The standard block is a 10 cm cube (1,000 cm³, about the size of a large juice box). Air pressure at the surface is 101.3 kPa.',
  timeScale:1,dtMax:0.001,prewarm:0,sampleDt:0.05,window:15,unit:'s',chChange:1.5,chReveal:6,
  controls:[
    {id:'block',label:'Block',type:'select',def:'alum',lvl:'bio',options:[{v:'wood',l:'Wood (600 kg/m³)'},{v:'ice',l:'Ice (917 kg/m³)'},{v:'alum',l:'Aluminum (2,700 kg/m³)'},{v:'foam',l:'Styrofoam (50 kg/m³)'},{v:'mystery',l:'Mystery block (density unknown)'}],
     onChange(sim){sim.infoDirty=true;}},
    {id:'fluid',label:'Liquid in the can',type:'select',def:'water',lvl:'bio',options:[{v:'water',l:'Fresh water (1,000 kg/m³)'},{v:'salt',l:'Very salty water (1,200 kg/m³; ocean water is 1,025)'},{v:'oil',l:'Oil (900 kg/m³)'},{v:'honey',l:'Honey (1,420 kg/m³)'},{v:'mercury',l:'Mercury (13,600 kg/m³)'}],
     help:'Changing the liquid refills the can to the spout and empties the cup.',onChange(sim){fresh(sim);}},
    {id:'lower',label:'Lower the block',type:'range',min:0,max:100,step:1,def:0,unit:'%',lvl:'bio',help:'Lets out string from the spring scale. At 0% the block hangs above the can.'},
    {id:'gdepth',label:'Pressure probe depth',type:'range',min:0,max:40,step:1,def:20,unit:' cm',lvl:'bio'},
    {id:'shape',label:'Can shape',type:'seg',def:'straight',lvl:'honors',options:[{v:'straight',l:'Straight'},{v:'wide',l:'Wide top'},{v:'narrow',l:'Narrow top'}],
     help:'The narrow-top can holds much less liquid. Does the probe notice?'},
    {id:'size',label:'Block size (edge)',type:'range',min:6,max:12,step:1,def:10,unit:' cm',lvl:'honors'},
    {id:'arrows',label:'Pressure arrows on the block',type:'toggle',def:true,lvl:'honors',help:'Each arrow shows the liquid pushing on a face. Longer arrows mean more pressure.',noTrial:true}
  ],
  actions:[
    {id:'empty',label:'Empty the cup',run(sim){sim.st.cup=0;}},
    {id:'restart',label:'Start over',primary:true,run(sim){BioLab.reset(sim);}}
  ],
  init(sim){const p=sim.p,yh=hookTarget(p),z=equilibrium(p,yh),r=forcesAt(p,z,yh,0);
    return {z,vz:0,yh,level:0,vout:r.Vs,cup:0,flow:0,W:r.W,Fb:r.Fb,T:r.T,frac:r.sub/r.a,Vs:r.Vs};},
  step(sim,dt){const p=sim.p,s=sim.st,tgt=hookTarget(p);
    s.yh+=clamp(tgt-s.yh,-0.25*dt,0.25*dt);
    const r=forcesAt(p,s.z,s.yh,s.level);
    const kEff=(r.sub>0&&r.sub<r.a?FLUIDS[p.fluid].rho*G*r.a*r.a:0)+(r.T>0?KSPR:0)+20;
    const c=2*0.7*Math.sqrt(r.m*kEff);
    s.vz+=(r.W-r.Fb-r.T-c*s.vz)/r.m*dt;s.z+=s.vz*dt;
    if(s.z>DEPTH){s.z=DEPTH;if(s.vz>0)s.vz=0;}
    if(s.z<-0.4){s.z=-0.4;if(s.vz<0)s.vz=0;}
    const r2=forcesAt(p,s.z,s.yh,s.level),excess=r2.Vs-s.vout;
    let out=0;if(excess>0){out=Math.min(excess,excess*8*dt+2e-7);s.vout+=out;s.cup+=out;}
    s.flow=out/dt;s.level=(r2.Vs-s.vout)/TANK_A;
    const r3=forcesAt(p,s.z,s.yh,s.level);
    s.W=r3.W;s.Fb=r3.Fb;s.T=r3.T;s.frac=r3.sub/r3.a;s.Vs=r3.Vs;},
  metrics:[
    {id:'scale',label:'Spring scale reads',unit:'N',min:0,max:null,d:1,get:s=>s.st.T},
    {id:'weight',label:'Weight in air',unit:'N',min:0,max:null,d:1,get:s=>s.st.W},
    {id:'buoy',label:'Buoyant force',unit:'N',min:0,max:null,d:1,get:s=>s.st.Fb},
    {id:'sub',label:'Below the surface',unit:'%',min:0,max:100,fixed:true,d:0,get:s=>100*s.st.frac},
    {id:'cup',label:'Overflow in the cup',unit:'mL',min:0,max:null,d:0,get:s=>s.st.cup*1e6},
    {id:'press',label:'Pressure at the probe',unit:'kPa',min:100,max:null,d:1,get:s=>pressure(s.p)},
    {id:'gauge',label:'Gauge pressure ρgh',unit:'kPa',lvl:'honors',min:0,max:null,d:2,get:s=>FLUIDS[s.p.fluid].rho*G*probeH(s.p)/1000},
    {id:'dispW',label:'Weight of the overflow',unit:'N',lvl:'honors',min:0,max:null,d:2,get:s=>FLUIDS[s.p.fluid].rho*G*s.st.cup},
    {id:'loss',label:'Weight − scale reading',unit:'N',lvl:'ap',min:0,max:null,d:2,get:s=>Math.max(0,s.st.W-s.st.T)},
    {id:'dens',label:'Block density',unit:'kg/m³',lvl:'honors',text:true,get:s=>s.p.block==='mystery'?'? (measure it)':BLOCKS[s.p.block].rho.toLocaleString('en-US')}
  ],
  graphs:[
    {id:'forces',label:'Forces on the block',lines:['weight','buoy','scale'],yl:'Force (N)'},
    {id:'subg',label:'Percent below the surface',lines:['sub']},
    {id:'pvd',label:'Pressure vs depth',custom:true},
    {id:'pg',label:'Pressure at the probe',lines:['press']},
    {id:'arch',label:'Buoyant force vs weight of overflow',lvl:'honors',lines:['buoy','dispW'],yl:'Force (N)'}
  ],
  defaultGraph:'forces',
  plot(sim,ctx,box,id){const p=sim.p,F=FLUIDS[p.fluid],top=P0+F.rho*G*DEPTH/1000,ymax=Math.max(106,top*1.02);
    const ax=axes(ctx,box,{xmin:0,xmax:40,ymin:100,ymax,xl:'Depth below the surface (cm)',yl:'Pressure (kPa)'});
    const line=(rho,col,dash)=>{ctx.strokeStyle=col;ctx.lineWidth=3;ctx.setLineDash(dash?[6,5]:[]);ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(P0));ctx.lineTo(ax.X(40),ax.Y(Math.min(ymax,P0+rho*G*0.4/1000)));ctx.stroke();ctx.setLineDash([]);};
    if(p.fluid!=='water')line(1000,PAL['muted'],true);
    line(F.rho,serColor(1),false);
    const P=pressure(p);ctx.fillStyle=PAL['g-dot']||serColor(0);ctx.beginPath();ctx.arc(ax.X(p.gdepth),ax.Y(P),6,0,7);ctx.fill();
    const items=[{label:F.n,color:serColor(1)}];if(p.fluid!=='water')items.push({label:'Fresh water',color:PAL['muted'],dash:true});legend(ctx,box.L+12,box.T+14,items);
    txt(ctx,P.toFixed(1)+' kPa at '+p.gdepth+' cm',ax.X(p.gdepth)+(p.gdepth>25?-10:10),ax.Y(P)-12,{s:13,w:700,a:p.gdepth>25?'right':'left'});},
  narrate(sim){const s=sim.st,p=sim.p,B=bName(p),F=fName(p).toLowerCase(),W=s.W.toFixed(1),Fb=s.Fb.toFixed(1),T=s.T.toFixed(1),pct=Math.round(100*s.frac);
    const rb=BLOCKS[p.block].rho,rf=FLUIDS[p.fluid].rho,ml=Math.round(s.Vs*1e6);
    if(s.frac<0.005)return `The ${B.toLowerCase()} block hangs in the air, so the scale holds its full weight: <b>${W} N</b>. Lower it into the ${F} and watch the reading.`;
    if(s.T<0.005&&s.frac<0.999&&Math.abs(s.vz)<0.02){
      const why=p.block==='mystery'?'the block is less dense than the liquid':`${B.toLowerCase()} (${rb.toLocaleString('en-US')} kg/m³) is less dense than ${F} (${rf.toLocaleString('en-US')} kg/m³)`;
      return `<b>The ${B.toLowerCase()} floats</b> with ${pct}% below the surface. It sank until the ${F} it pushed aside weighed as much as the block, ${W} N. It floats because ${why}.`;}
    if(s.frac>=0.999){
      if(s.T<0.005&&Math.abs(rb-rf)<1)return `The block is exactly as dense as the ${F}, so it hangs in place: the ${Fb} N buoyant force matches its weight.`;
      return `The block is completely under the ${F}. The buoyant force is <b>${Fb} N</b>, the weight of ${ml.toLocaleString('en-US')} mL of ${F}, and lowering it further will not change that. The scale holds the rest: ${T} N.`;}
    return `The block is ${pct}% under the ${F}. The ${F} pushes up with <b>${Fb} N</b>, so the scale only has to hold ${T} N of the block’s ${W} N weight.`;},
  tour:[
    {title:'A block on a spring scale',text:'The aluminum block hangs above a can filled right to its spout. The spring scale reads the block’s full weight, because nothing else is holding it up.',
     focus:[150,4,260,215],speed:0.5,setup(sim){BioLab.setValues(sim,{block:'alum',fluid:'water',lower:0,size:10,shape:'straight'});BioLab.reset(sim);}},
    {title:'Into the water',text:'As the block goes in, the water pushes up on it. That upward push is the <b>buoyant force</b>, so the scale reading drops.',
     focus:[60,4,350,420],speed:0.5,setup(sim){BioLab.setValues(sim,{lower:45});}},
    {title:'Catch what spills',text:'The block pushes water aside, and that water spills out of the spout into the cup. Watch the cup fill as the block goes deeper.',
     focus:[380,180,165,240],speed:0.5,setup(sim){BioLab.setValues(sim,{lower:62});}},
    {title:'Forces on the block',text:'Weight pulls down. The buoyant force and the scale pull up. Once the block is fully under, the buoyant force stops growing: it equals the weight of the water the block pushed aside.',
     focus:[560,10,236,285],speed:0.5,setup(sim){BioLab.setValues(sim,{lower:100});}},
    {title:'Things that float',text:'Wood is less dense than water. It sinks only until the water it pushes aside weighs as much as the wood. Then the string goes slack and the scale reads zero.',
     focus:[60,4,350,420],speed:0.5,setup(sim){BioLab.setValues(sim,{block:'wood',lower:100});BioLab.reset(sim);}},
    {title:'Change the liquid',text:'Salt water is denser than fresh water, so the wood pushes aside less of it to get the same buoyant force. It floats higher.',
     focus:[60,180,350,240],speed:0.5,setup(sim){BioLab.setValues(sim,{fluid:'salt'});}},
    {title:'Pressure grows with depth',text:'The probe measures pressure. Deeper liquid has more liquid stacked above it, so the pressure is higher: P = P₀ + ρgh.',
     focus:[0,20,215,400],speed:0.5,setup(sim){BioLab.setValues(sim,{fluid:'water',gdepth:35});}},
    {lvl:'honors',title:'Where buoyancy comes from',text:'The bottom face is deeper than the top face, so the liquid pushes harder up on the bottom than down on the top. The side pushes cancel. The difference is the buoyant force.',
     focus:sim=>{const a=side(sim.p)*PXM,yb=SURF+sim.st.z*PXM;return [CX-90,yb-a-40,180,a+80];},speed:0.5,setup(sim){BioLab.setValues(sim,{block:'alum',arrows:true,lower:100});BioLab.reset(sim);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{block:'alum',fluid:'water',lower:0,gdepth:20,shape:'straight',size:10});BioLab.reset(sim);},
  challenges:[
    {lvl:'bio',q:'An ice cube floats in fresh water. About how much of it sits below the surface?',choices:['About 10%','About half','About 90%'],correct:2,
     baseline:{block:'ice',fluid:'water',lower:100,size:10,shape:'straight'},watch:'sub',
     explain:'Ice is 917 kg/m³ and water is 1,000 kg/m³. A floating object sinks until the water it pushes aside weighs as much as it does, so about 92% of the ice ends up under water. That is why most of an iceberg is hidden.'},
    {lvl:'bio',q:'A wood block floats in fresh water. The can is switched to salt water. What happens to the block?',choices:['It floats higher','It floats lower','It stays at the same level'],correct:0,
     baseline:{block:'wood',fluid:'water',lower:100,size:10,shape:'straight'},change:{fluid:'salt'},changeText:'Switched to salt water',watch:'sub',
     explain:'Salt water is denser, so a smaller volume of it weighs as much as the block. The wood only has to push aside that smaller volume, so it rises from 60% under to 50% under.'},
    {lvl:'honors',q:'The probe sits 30 cm deep in a straight can. The can changes to a narrow-top shape that holds much less water. What does the pressure at the probe do?',choices:['It rises','It drops','It stays the same'],correct:2,
     baseline:{block:'alum',fluid:'water',lower:0,size:10,shape:'straight',gdepth:30},change:{shape:'narrow'},changeText:'Changed to a narrow-top can',watch:'press',
     explain:'Pressure in a liquid depends only on the depth and the liquid’s density, P = P₀ + ρgh. The total amount of water and the shape of the can do not matter.'},
    {lvl:'honors',q:'An aluminum block hangs just under the water surface. It is lowered much deeper. What happens to the buoyant force?',choices:['It increases with depth','It stays the same','It decreases with depth'],correct:1,
     baseline:{block:'alum',fluid:'water',lower:55,size:10,shape:'straight'},change:{lower:100},changeText:'Lowering the block deeper',watch:'buoy',
     explain:'Deeper down, both the top and bottom faces feel more pressure, but the difference between them stays ρg·(height of the block). The block still pushes aside the same 1,000 mL, so F_B stays 9.8 N.'},
    {lvl:'ap',q:'A 10 cm aluminum cube (2,700 kg/m³) hangs fully under fresh water from the scale. What will the scale read?',choices:['26.5 N','16.7 N','9.8 N','0 N'],correct:1,
     baseline:{block:'alum',fluid:'water',lower:100,size:10,shape:'straight'},watch:'scale',
     explain:'W = ρ_Al·V·g = 2,700 × 0.001 × 9.8 = 26.5 N. F_B = ρ_water·V·g = 9.8 N. The scale supplies the rest: T = W − F_B = 16.7 N.'},
    {lvl:'ap',q:'A wood block (600 kg/m³) is placed in oil (900 kg/m³). What fraction of it ends up below the surface?',choices:['40%','60%','67%','90%'],correct:2,
     baseline:{block:'wood',fluid:'oil',lower:100,size:10,shape:'straight'},watch:'sub',
     explain:'For a floating object, F_B = W, so ρ_oil·V_sub·g = ρ_wood·V·g and V_sub/V = 600/900 = 0.67.'},
    {lvl:'ap',q:'The mystery block reads 11.8 N in air and 2.0 N fully under fresh water. What is its density?',choices:['800 kg/m³','1,200 kg/m³','2,000 kg/m³','6,000 kg/m³'],correct:1,
     baseline:{block:'mystery',fluid:'water',lower:100,size:10,shape:'straight'},watch:'scale',
     explain:'F_B = 11.8 − 2.0 = 9.8 N, so V = F_B/(ρ_water·g) = 0.001 m³. Then ρ = W/(gV) = 11.8/(9.8 × 0.001) ≈ 1,200 kg/m³. Equivalently ρ = ρ_water·W/(W − T).'}
  ],
  lab:{bio:'<p><b>Question:</b> How does the liquid change the way a block floats or sinks?</p><ol><li>Pick the wood block and lower it all the way into fresh water. Record a trial: % below the surface, scale reading and overflow.</li><li>Repeat with salt water, oil and honey.</li><li>Repeat the whole set with ice.</li></ol><p>Which liquid made each block float highest? Write one sentence connecting this to the liquid’s density.</p>',
       honors:'<p><b>Question:</b> Does the buoyant force always equal the weight of the displaced liquid?</p><ol><li>Press Start over with the aluminum block. Lower it to 30%, 50%, 70% and 100%.</li><li>At each step, record the buoyant force and the weight of the overflow.</li><li>Repeat in honey.</li></ol><p>Graph buoyant force (y) against weight of the overflow (x). What is the slope, and why?</p>',
       ap:'<p><b>Question:</b> Find the density of the mystery block using only the spring scale.</p><ol><li>Record the scale reading in air (W).</li><li>Lower it fully into fresh water and record the reading (T₁). Repeat in honey (T₂).</li><li>Calculate ρ = ρ_fluid·W/(W − T) for each liquid.</li></ol><p><b>Claim–evidence–reasoning:</b> Do both liquids give the same density? Explain from Archimedes’ principle why they should, and predict what happens in salt water.</p>'},
  terms:[
    {t:'Buoyant force',d:'The upward push a liquid or gas gives an object in it. It equals the weight of the fluid the object pushes aside.'},
    {t:'Displaced fluid',d:'The fluid an object pushes out of the way. In an overflow can it spills into the cup.'},
    {t:'Density',d:'Mass per unit volume, ρ = m/V, in kg/m³. Water is 1,000 kg/m³.'},
    {t:'Apparent weight',d:'What a scale reads for an object in a fluid: its weight minus the buoyant force.'},
    {t:'Pressure',d:'Force per unit area, in pascals (1 Pa = 1 N/m²). 1 kPa = 1,000 Pa.'},
    {lvl:'honors',t:'Archimedes’ principle',d:'F_B = ρ_fluid·g·V_sub: the buoyant force equals the weight of the displaced fluid.'},
    {lvl:'honors',t:'Hydrostatic pressure',d:'P = P₀ + ρgh. Pressure grows with depth h and does not depend on the container’s shape.'},
    {lvl:'honors',t:'Gauge pressure',d:'Pressure above atmospheric pressure, ρgh.'},
    {lvl:'ap',t:'Floating condition',d:'For a floating object F_B = W, so V_sub/V = ρ_object/ρ_fluid.'},
    {lvl:'ap',t:'Neutral buoyancy',d:'An object with the same density as the fluid. It neither rises nor sinks.'}],
  about:'<p>The block is a cube of edge a. Its weight is W = ρ_block·a³·g with g = 9.8 m/s². The buoyant force is F_B = ρ_fluid·g·a²·d, where d is how far the bottom face is below the surface (capped at a). The spring scale is a spring with k = 600 N/m. The string only pulls when it is stretched, so a floating block makes it go slack. The block’s motion is integrated every 1 ms with a damping term standing in for water drag, so it settles quickly.</p><p>The can starts full to the spout. Any rise in the level drains through the spout into the cup, so the cup collects the displaced volume. The level drop when you lift the block back out is real but small (the can is 0.15 m² across). Pressure is P = P₀ + ρgh with P₀ = 101.3 kPa. Simplifications: liquids are incompressible and at rest, surface tension is ignored, the block never tilts, and the pressure probe reads the liquid at its tip as if the block were not there.</p>',
  initVis(sim){sim.vis.drops=[];sim.vis.salt=[];for(let i=0;i<40;i++)sim.vis.salt.push([Math.random(),Math.random()]);},
  draw(sim,ctx,vdt,k){const p=sim.p,s=sim.st,v=sim.vis,B=BLOCKS[p.block],F=FLUIDS[p.fluid],a=side(p),bs=a*PXM;
    const ys=SURF-s.level*PXM,shape=p.shape;
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,FLOOR+4,800,450-FLOOR-4);
    // tank liquid
    const wl=y=>CX-hw(shape,y),wr=y=>CX+hw(shape,y);
    ctx.save();ctx.globalAlpha=F.a;ctx.fillStyle=PAL[F.tok];ctx.beginPath();ctx.moveTo(wl(ys),ys);ctx.lineTo(wr(ys),ys);ctx.lineTo(wr(FLOOR),FLOOR);ctx.lineTo(wl(FLOOR),FLOOR);ctx.closePath();ctx.fill();ctx.restore();
    if(F.salt){ctx.fillStyle=PAL['cv-ink'];ctx.globalAlpha=0.25;v.salt.forEach(q=>{const y=lerp(ys+6,FLOOR-4,q[1]);const x=lerp(wl(y)+6,wr(y)-6,q[0]);ctx.fillRect(x,y,2,2);});ctx.globalAlpha=1;}
    if(p.fluid==='mercury'){ctx.strokeStyle=PAL['card'];ctx.globalAlpha=0.6;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(wl(ys)+10,ys+5);ctx.lineTo(wr(ys)-10,ys+5);ctx.stroke();ctx.globalAlpha=1;}
    // spout pipe and liquid in it
    const sx=wr(SURF);ctx.save();ctx.globalAlpha=F.a;ctx.fillStyle=PAL[F.tok];if(s.flow>1e-6)ctx.fillRect(sx,SURF-3,445-sx,6);ctx.restore();
    ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(sx,SURF-5);ctx.lineTo(447,SURF-5);ctx.lineTo(447,SURF+10);ctx.moveTo(sx,SURF+5);ctx.lineTo(439,SURF+5);ctx.lineTo(439,SURF+10);ctx.stroke();
    // tank walls
    ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=4;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(wl(RIM),RIM);ctx.lineTo(wl(FLOOR),FLOOR);ctx.lineTo(wr(FLOOR),FLOOR);ctx.lineTo(wr(RIM),RIM);ctx.stroke();
    // drops into the cup
    if(vdt>0){if(s.flow>1e-6&&v.drops.length<40&&Math.random()<Math.min(1,s.flow*4e4*vdt*8))v.drops.push({x:443,y:SURF+10,vy:0});
      v.drops.forEach(d=>{d.vy+=600*vdt;d.y+=d.vy*vdt;});}
    const cupH=(CUP.bot-CUP.top)*clamp(s.cup*1e6/CUP.cap,0,1),cupY=CUP.bot-cupH;
    v.drops=v.drops.filter(d=>d.y<cupY);
    ctx.save();ctx.globalAlpha=F.a;ctx.fillStyle=PAL[F.tok];v.drops.forEach(d=>{ctx.beginPath();ctx.arc(d.x,d.y,3,0,7);ctx.fill();});
    if(cupH>0.3)ctx.fillRect(CUP.x+2,cupY,CUP.w-4,cupH);ctx.restore();
    ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(CUP.x,CUP.top);ctx.lineTo(CUP.x,CUP.bot);ctx.lineTo(CUP.x+CUP.w,CUP.bot);ctx.lineTo(CUP.x+CUP.w,CUP.top);ctx.stroke();
    ctx.lineWidth=1.5;ctx.strokeStyle=PAL['cv-soft'];for(let ml=500;ml<CUP.cap;ml+=500){const y=CUP.bot-(CUP.bot-CUP.top)*ml/CUP.cap;ctx.beginPath();ctx.moveTo(CUP.x+CUP.w-14,y);ctx.lineTo(CUP.x+CUP.w,y);ctx.stroke();
      txt(ctx,String(ml),CUP.x+CUP.w+5,y+4,{s:12*k,c:PAL['cv-soft']});}
    txt(ctx,Math.round(s.cup*1e6)+' mL',CUP.x+CUP.w/2,CUP.top-10,{s:13*k,w:700,a:'center'});
    // depth ruler
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(78,ys);ctx.lineTo(78,FLOOR);ctx.stroke();
    for(let cm=0;cm<=40;cm+=10){const y=ys+cm/100*PXM;ctx.beginPath();ctx.moveTo(70,y);ctx.lineTo(78,y);ctx.stroke();if(cm>0)txt(ctx,cm+' cm',66,y+4,{s:12*k,c:PAL['cv-soft'],a:'right'});}
    // block (pressure arrows first so the block covers their roots)
    const yb=SURF+s.z*PXM,yt=yb-bs,xl=CX-bs/2;
    if(p.arrows&&atLeast('honors')&&s.frac>0.001){const col=serColor(1),L=d=>4+30*clamp(d/DEPTH,0,1.2);ctx.save();ctx.globalAlpha=0.85;
      const dB=(yb-ys)/PXM;if(dB>0){for(let i=1;i<=3;i++){const x=xl+bs*i/4;arrow(ctx,x,yb+L(dB)+4,yb+2,col,2.5);}}
      const dT=(yt-ys)/PXM;if(dT>0){for(let i=1;i<=3;i++){const x=xl+bs*i/4;arrow(ctx,x,yt-L(dT)-4,yt-2,col,2.5);}}
      for(let i=1;i<=3;i++){const y=yt+bs*i/4,d=(y-ys)/PXM;if(d<=0)continue;const l=L(d);harrow(ctx,xl-l-3,xl-2,y,col);harrow(ctx,xl+bs+l+3,xl+bs+2,y,col);}ctx.restore();}
    rr(ctx,xl,yt,bs,bs,4);ctx.fillStyle=B.fill;ctx.fill();ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=1.5;ctx.stroke();
    if(p.block==='wood'){ctx.strokeStyle='rgba(60,30,10,.35)';ctx.lineWidth=1;for(let i=1;i<4;i++){ctx.beginPath();ctx.moveTo(xl+3,yt+bs*i/4);ctx.quadraticCurveTo(CX,yt+bs*i/4+5,xl+bs-3,yt+bs*i/4);ctx.stroke();}}
    if(p.block==='mystery')txt(ctx,'?',CX,yt+bs/2,{s:Math.min(26,bs*0.55),w:800,c:B.lab,a:'center',b:'middle'});
    // liquid tint over the submerged part of the block
    if(s.frac>0.001){const top=Math.max(yt,ys);ctx.save();ctx.globalAlpha=Math.min(0.35,F.a*0.4);ctx.fillStyle=PAL[F.tok];ctx.fillRect(xl,top,bs,yb-top);ctx.restore();
      if(s.frac<0.999){ctx.strokeStyle=PAL['cv-ink'];ctx.setLineDash([4,3]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(xl-6,ys);ctx.lineTo(xl+bs+6,ys);ctx.stroke();ctx.setLineDash([]);}}
    // block label to the right
    ctx.font='700 '+(12*k)+'px sans-serif';const lw=ctx.measureText(B.n).width+13*k,lx=CX+bs/2+10+lw/2;const ly=clamp(yt+bs/2,112,FLOOR-30);pill(ctx,B.n,lx,ly-(s.frac>0.001?11*k:0),PAL['card'],PAL['cv-ink'],12*k);
    if(s.frac>0.001)txt(ctx,Math.round(100*s.frac)+'% under',CX+bs/2+10,ly+16*k,{s:12*k,w:700});
    // string
    const hookY=94;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(CX,hookY);
    const taut=s.z>=s.yh-1e-4;if(taut||yt-hookY<4)ctx.lineTo(CX,yt);else{const len=(s.yh-a)*PXM+SURF-hookY,gap=yt-hookY,sag=Math.min(40,Math.sqrt(Math.max(0,len*len-gap*gap))/2);ctx.quadraticCurveTo(CX+sag,(hookY+yt)/2,CX,yt);}ctx.stroke();
    // support and spring scale
    ctx.fillStyle=PAL['cv-lamp'];ctx.fillRect(150,6,180,7);
    rr(ctx,CX-22,16,44,72,8);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=2;ctx.stroke();
    ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(CX,13);ctx.lineTo(CX,16);ctx.stroke();
    const sMax=50,yT=22,yB=82,py=yT+(yB-yT)*clamp(s.T/sMax,0,1);
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;for(let n=0;n<=sMax;n+=5){const y=yT+(yB-yT)*n/sMax;ctx.beginPath();ctx.moveTo(CX+8,y);ctx.lineTo(CX+(n%10===0?18:14),y);ctx.stroke();}
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();const coils=8;for(let i=0;i<=coils*2;i++){const y=yT+(py-yT)*i/(coils*2);ctx.lineTo(CX+(i%2?-8:0),y);}ctx.stroke();
    ctx.strokeStyle=serColor(0);ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(CX-12,py);ctx.lineTo(CX+19,py);ctx.stroke();
    ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(CX,88);ctx.lineTo(CX,hookY);ctx.stroke();
    pill(ctx,s.T.toFixed(1)+' N',CX+70,44,serColor(0),'#ffffff',13*k);
    if(k<1.3)txt(ctx,'Spring scale',CX+70,70,{s:12*k,c:PAL['cv-soft'],a:'center'});
    // pressure probe, hose and dial
    const pyT=ys+probeH(p)*PXM,P=pressure(p);
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(PROBE_X,pyT-6);ctx.lineTo(PROBE_X,168);ctx.lineTo(52,168);ctx.lineTo(52,118);ctx.stroke();
    ctx.fillStyle=PAL['cv-lamp'];ctx.beginPath();ctx.arc(PROBE_X,pyT,6,0,7);ctx.fill();
    ctx.strokeStyle=PAL['cv-soft'];ctx.setLineDash([3,3]);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(80,pyT);ctx.lineTo(PROBE_X-8,pyT);ctx.stroke();ctx.setLineDash([]);
    const dc=[52,90],R=28;ctx.beginPath();ctx.arc(dc[0],dc[1],R,0,7);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=2;ctx.stroke();
    const ang=v0=>Math.PI*0.75+Math.PI*1.5*clamp((v0-100)/60,0,1);
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;for(let q=100;q<=160;q+=10){const an=ang(q);ctx.beginPath();ctx.moveTo(dc[0]+Math.cos(an)*(R-7),dc[1]+Math.sin(an)*(R-7));ctx.lineTo(dc[0]+Math.cos(an)*(R-2),dc[1]+Math.sin(an)*(R-2));ctx.stroke();}
    const an=ang(P);ctx.strokeStyle=serColor(0);ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(dc[0],dc[1]);ctx.lineTo(dc[0]+Math.cos(an)*(R-6),dc[1]+Math.sin(an)*(R-6));ctx.stroke();
    ctx.fillStyle=PAL['cv-ink'];ctx.beginPath();ctx.arc(dc[0],dc[1],3,0,7);ctx.fill();
    txt(ctx,P.toFixed(1)+' kPa',6,48,{s:13*k,w:700});
    // fluid name
    pill(ctx,F.n,CX+95,FLOOR-18,PAL['card'],PAL['cv-ink'],12*k);
    // free-body diagram
    const fx=680,fy=150,fb=36;txt(ctx,'Forces on the block',fx,26,{s:13*k,w:700,a:'center'});
    const sc=88/Math.max(s.W,4);rr(ctx,fx-fb/2,fy-fb/2,fb,fb,4);ctx.fillStyle=B.fill;ctx.fill();ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=1.5;ctx.stroke();
    const wcol=serColor(0),bcol=serColor(1),tcol=serColor(3);
    arrow(ctx,fx,fy+fb/2,fy+fb/2+s.W*sc,wcol,4);
    const sh=k>1.3;txt(ctx,(sh?'W ':'Weight ')+s.W.toFixed(1)+' N',fx+10,fy+fb/2+Math.max(18,s.W*sc*0.6),{s:12*k,w:700,c:wcol});
    if(s.Fb>0.01){arrow(ctx,fx-10,fy-fb/2,fy-fb/2-s.Fb*sc,bcol,4);}
    txt(ctx,(sh?'F_B ':'Buoyant ')+s.Fb.toFixed(1)+' N',fx-16,fy-fb/2-Math.max(8,Math.min(s.Fb*sc,60)*0.5),{s:12*k,w:700,c:bcol,a:'right'});
    if(s.T>0.01){arrow(ctx,fx+10,fy-fb/2,fy-fb/2-s.T*sc,tcol,4);}
    txt(ctx,(sh?'T ':'Scale ')+s.T.toFixed(1)+' N',fx+16,fy-fb/2-Math.max(8,Math.min(s.T*sc,60)*0.5),{s:12*k,w:700,c:tcol});
    if(atLeast('honors')){const rb=p.block==='mystery'?'?':BLOCKS[p.block].rho.toLocaleString('en-US');
      txt(ctx,'ρ block '+rb+' kg/m³',fx,282,{s:12*k,c:PAL['cv-soft'],a:'center'});txt(ctx,'ρ liquid '+F.rho.toLocaleString('en-US')+' kg/m³',fx,282+16*k,{s:12*k,c:PAL['cv-soft'],a:'center'});}
  },
  thumbSetup(sim){BioLab.setValues(sim,{lower:100});}
};
BioLab.register(SIM);
})();
