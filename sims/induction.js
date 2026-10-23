(function(){
'use strict';
const {clamp,lerp,rr,txt,pill,atLeast,PAL,RM,axes,legend,serColor}=BioLab.h;

/* Electromagnetic induction.
   Magnet and coil: the magnet is a point dipole (m = 1 A·m²) on the axis of a coil of radius a = 3 cm.
   Flux through one turn: Φ(x) = μ₀ m a² / (2 (a² + x²)^{3/2}). EMF = −N dΦ/dt, current I = EMF/R (R = 5 Ω coil + meter).
   Generator: EMF = N B A ω sin ωt (A = 0.01 m²). Transformer: Vs = Vp Ns/Np for AC, 0 for steady DC; Is = Vs/R_load; Ip = Is Ns/Np.
   Magnet in a metal tube: m dv/dt = mg − bv, with eddy-current drag b ∝ wall thickness × conductivity. */
const MU0=4e-7*Math.PI,MDIP=1,AC=0.03,RC=5,PXM=5e-4,CXC=470,AY=190,G=9.8,MMAG=0.02,RLOAD=50,AGEN=0.01,FVIS=0.5;
const fluxAt=x=>MU0*MDIP*AC*AC/(2*Math.pow(AC*AC+x*x,1.5));
const SCN=[{v:'magnet',l:'Magnet and coil'},{v:'generator',l:'AC generator',lvl:'honors'},{v:'transformer',l:'Transformer',lvl:'honors'},{v:'tube',l:'Magnet falling in a metal tube',lvl:'ap'}];
const MOT=[{v:'still',l:'Hold still'},{v:'in',l:'Push in'},{v:'out',l:'Pull out'},{v:'osc',l:'In and out'},{v:'through',l:'Drop through',lvl:'honors'}];
const TRAVEL=0.16;
function bTube(p){const sig={copper:1,aluminum:0.6,plastic:0}[p.tmat]||0;return 0.98*(p.wall/1.5)*sig;}
function tFall(b){if(b<=1e-9)return Math.sqrt(2/G);const tau=MMAG/b,vt=MMAG*G/b;let t=1/vt+tau;for(let i=0;i<30;i++){const y=vt*(t-tau*(1-Math.exp(-t/tau)))-1,dy=vt*(1-Math.exp(-t/tau));t-=y/Math.max(dy,1e-6);if(t<0)t=0.01;}return t;}
function genPeak(p){return p.turns*p.bgen*AGEN*(p.rpm*2*Math.PI/60);}
function trans(p){const vs=p.ac?p.vp*p.ns/p.np:0,is=vs/RLOAD;return {vs,is,ip:is*p.ns/p.np};}

const SIM={
  id:'induction',hash:'induction',apUnit:12,order:2,tab:'Electromagnetic induction',kind:'Simulation',prereq:['magnetism'],
  card:'Push a magnet into a coil and watch the meter swing, then spin a generator, step voltage up with a transformer and slow a falling magnet.',
  title:'Electromagnetic induction',
  lede:{bio:'A magnet moving near a coil of wire makes electricity. Find out what makes the current bigger, and what makes it flow the other way.',
        honors:'Induction is all about change: the voltage depends on how fast the magnetic flux through the coil changes. Use it to explain generators and transformers.',
        ap:'Measure Faraday’s law, EMF = −N dΦ/dt, use Lenz’s law to predict directions, and watch eddy currents brake a magnet falling through a copper tube.'},
  scale:'A hand-sized setup: a 6 cm bar magnet and a coil 6 cm across. Motion is shown at half speed. Voltages are in volts, currents in milliamps.',
  timeScale:0.5,dtMax:0.01,sampleDt:0.04,window:6,unit:'s',chChange:1.5,chReveal:4,
  controls:[
    {id:'scene',label:'Setup',type:'select',def:'magnet',lvl:'bio',options:SCN,onChange(sim){sim.infoDirty=true;}},
    {id:'motion',label:'Move the magnet',type:'seg',def:'in',lvl:'bio',options:MOT,help:'Magnet and coil'},
    {id:'speed',label:'Magnet speed',type:'range',min:0.05,max:1,step:0.05,def:0.3,unit:' m/s',d:2,lvl:'bio'},
    {id:'turns',label:'Turns on the coil',type:'range',min:10,max:400,step:10,def:100,lvl:'bio'},
    {id:'flip',label:'Flip the magnet (S end first)',type:'toggle',def:false,lvl:'bio'},
    {id:'meter',label:'Connect the coil to',type:'seg',def:'galv',lvl:'bio',options:[{v:'galv',l:'Meter'},{v:'bulb',l:'Bulb'}]},
    {id:'rpm',label:'Generator speed',type:'range',min:0,max:1200,step:50,def:300,unit:' rpm',lvl:'honors',help:'AC generator'},
    {id:'bgen',label:'Generator field B',type:'range',min:0.05,max:0.5,step:0.05,def:0.1,unit:' T',d:2,lvl:'honors'},
    {id:'vp',label:'Primary voltage',type:'range',min:0,max:240,step:10,def:120,unit:' V',lvl:'honors',help:'Transformer'},
    {id:'np',label:'Primary turns Np',type:'range',min:10,max:1000,step:10,def:200,lvl:'honors'},
    {id:'ns',label:'Secondary turns Ns',type:'range',min:10,max:1000,step:10,def:100,lvl:'honors'},
    {id:'ac',label:'Alternating current (AC)',type:'toggle',def:true,lvl:'honors',help:'Off = steady DC from a battery'},
    {id:'tmat',label:'Tube material',type:'select',def:'copper',lvl:'ap',options:[{v:'plastic',l:'Plastic'},{v:'aluminum',l:'Aluminum'},{v:'copper',l:'Copper'}]},
    {id:'wall',label:'Tube wall thickness',type:'range',min:0.5,max:3,step:0.5,def:1.5,unit:' mm',d:1,lvl:'ap'}
  ],
  actions:[{id:'drop',label:'Drop the magnets again',lvl:'ap',run(sim){const s=sim.st;s.yt=0;s.vt=0;s.yp=0;s.vp=0;s.tt=0;s.wait=0;s.hist=[];}}],
  init(sim){return {clock:0,lastFlip:null,xm:-TRAVEL,ph:0,hold:0,emf:0,flux:0,hist:[],skip:true,gth:0,tph:0,yt:0,vt:0,yp:0,vp:0,tt:0,wait:0,thist:[]};},
  step(sim,dt){const s=sim.st,p=sim.p;s.clock+=dt;
    if(p.scene==='magnet'){let x=s.xm,jump=false;const v=p.speed;
      if(p.motion==='still'){/* stays where it is */}
      else if(p.motion==='in'){if(s.hold>0){s.hold-=dt;if(s.hold<=0){x=-TRAVEL;jump=true;}}else{x+=v*dt;if(x>=0){x=0;s.hold=0.5;}}if(x<-TRAVEL-1e-9||x>1e-9){x=-TRAVEL;jump=true;}}
      else if(p.motion==='out'){if(s.hold>0){s.hold-=dt;if(s.hold<=0){x=0;jump=true;}}else{x-=v*dt;if(x<=-TRAVEL){x=-TRAVEL;s.hold=0.5;}}if(x>1e-9){x=0;jump=true;}}
      else if(p.motion==='osc'){const A=TRAVEL/2,w=v/A;s.ph+=w*dt;const nx=-A+A*Math.sin(s.ph);if(Math.abs(nx-x)>v*dt*1.5+1e-4)jump=true;x=nx;}
      else if(p.motion==='through'){const L=0.12;if(s.hold>0){s.hold-=dt;if(s.hold<=0){x=-L;jump=true;}}else{x+=v*dt;if(x>=L){x=L;s.hold=0.4;}}if(x<-L-1e-9){x=-L;jump=true;}}
      const sg=p.flip?-1:1,phi=sg*fluxAt(x);
      if(s.lastFlip!==p.flip){s.skip=true;s.lastFlip=p.flip;}
      if(s.skip||jump){s.emf=0;}else{s.emf=-p.turns*(phi-s.flux)/dt;}
      s.skip=false;s.xm=x;s.flux=phi;}
    else{s.skip=true;s.emf=0;}
    if(p.scene==='generator'){s.gth+=p.rpm*2*Math.PI/60*dt*0.25;} // drawn 4× slower than the model so the coil can be followed
    if(p.scene==='transformer'){s.tph+=2*Math.PI*FVIS*dt;}
    if(p.scene==='tube'){const b=bTube(p);s.tt+=dt;
      if(s.yt<1){s.vt+=(G-b*s.vt/MMAG)*dt;s.yt=Math.min(1,s.yt+s.vt*dt);if(s.yt>=1)s.vt=0;}
      if(s.yp<1){s.vp+=G*dt;s.yp=Math.min(1,s.yp+s.vp*dt);if(s.yp>=1)s.vp=0;}
      if(s.yt>=1&&s.yp>=1){s.wait+=dt;if(s.wait>1.2){s.yt=0;s.vt=0;s.yp=0;s.vp=0;s.tt=0;s.wait=0;}}}
    // recent peak (signed) for the meter readout
    s.hist.push([s.clock,curEMF(sim)]);const win=p.scene==='magnet'?Math.max(1.3,(p.motion==='osc'?2*Math.PI*TRAVEL/2/p.speed:TRAVEL/p.speed+0.6)+0.1):1.3;
    const tn=s.clock;while(s.hist.length&&s.hist[0][0]<tn-win)s.hist.shift();if(s.hist.length>4000)s.hist.splice(0,s.hist.length-4000);},
  metrics:[
    {id:'emf',label:'Induced voltage (EMF)',unit:'V',lvl:'bio',min:-0.2,max:0.2,d:3,get:s=>s.p.scene==='tube'?NaN:curEMF(s)},
    {id:'swing',label:'Biggest meter swing (last pass)',unit:'mA',lvl:'bio',min:-40,max:40,d:1,get:s=>{if(s.p.scene==='tube'||s.p.scene==='transformer')return NaN;let best=0;for(const h of s.st.hist)if(Math.abs(h[1])>Math.abs(best))best=h[1];return best/rLoad(s.p)*1000;}},
    {id:'flux',label:'Flux through one turn',unit:'µWb',lvl:'honors',min:-25,max:25,d:2,get:s=>s.p.scene==='magnet'?s.st.flux*1e6:s.p.scene==='generator'?s.p.bgen*AGEN*Math.cos(s.st.gth)*1e6:NaN},
    {id:'peak',label:'Peak EMF (NBAω)',unit:'V',lvl:'honors',min:0,max:200,d:2,get:s=>s.p.scene==='generator'?genPeak(s.p):NaN},
    {id:'vsec',label:'Secondary voltage (rms)',unit:'V',lvl:'honors',min:0,max:1000,d:1,get:s=>s.p.scene==='transformer'?trans(s.p).vs:NaN},
    {id:'isec',label:'Secondary current',unit:'A',lvl:'ap',min:0,max:20,d:2,get:s=>s.p.scene==='transformer'?trans(s.p).is:NaN},
    {id:'iprim',label:'Primary current',unit:'A',lvl:'ap',min:0,max:20,d:2,get:s=>s.p.scene==='transformer'?trans(s.p).ip:NaN},
    {id:'vel',label:'Speed in the metal tube',unit:'m/s',lvl:'ap',min:0,max:4.5,d:2,get:s=>s.p.scene==='tube'?s.st.vt:NaN},
    {id:'vplas',label:'Speed in the plastic tube',unit:'m/s',lvl:'ap',min:0,max:4.5,d:2,get:s=>s.p.scene==='tube'?s.st.vp:NaN},
    {id:'tfall',label:'Time to fall 1 m (metal tube)',unit:'s',lvl:'ap',min:0,max:15,d:2,get:s=>s.p.scene==='tube'?tFall(bTube(s.p)):NaN}
  ],
  graphs:[{id:'emfg',label:'Induced voltage over time',lines:['emf']},{id:'fluxg',label:'Flux through the coil over time',lvl:'honors',lines:['flux']},{id:'model',label:'What sets the size',custom:true},{id:'velg',label:'Falling magnet speeds',lvl:'ap',lines:['vel','vplas']}],
  defaultGraph:'emfg',
  plot(sim,ctx,box){const p=sim.p;
    if(p.scene==='magnet'){const xs=[],es=[];for(let x=-0.16;x<=0.16001;x+=0.002){xs.push([x*100,fluxAt(x)*1e6*(p.flip?-1:1)]);const d=(fluxAt(x+1e-4)-fluxAt(x-1e-4))/2e-4;es.push([x*100,-p.turns*d*p.speed*(p.flip?-1:1)]);}
      const ym=Math.max(...xs.map(a=>Math.abs(a[1])))*1.15;const ax=axes(ctx,box,{xmin:-16,xmax:16,ymin:-ym,ymax:ym,xl:'Magnet position relative to the coil centre (cm)',yl:'Flux per turn (µWb)'});
      line(ctx,ax,xs,serColor(1));const em=Math.max(1e-9,...es.map(a=>Math.abs(a[1])));line(ctx,ax,es.map(a=>[a[0],a[1]/em*ym*0.9]),serColor(4));
      const mx=sim.st.xm*100;ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.arc(ax.X(mx),ax.Y(fluxAt(sim.st.xm)*1e6*(p.flip?-1:1)),6,0,6.29);ctx.fill();
      legend(ctx,box.L+12,box.T+8,[{label:'Flux Φ',color:serColor(1)},{label:'EMF when moving right (scaled)',color:serColor(4)}]);return;}
    if(p.scene==='generator'){const xs=[];for(let r=0;r<=1200;r+=50)xs.push([r,genPeak(Object.assign({},p,{rpm:r}))]);const ax=axes(ctx,box,{xmin:0,xmax:1200,ymin:0,ymax:Math.max(1,xs[xs.length-1][1]*1.1),xl:'Generator speed (rpm)',yl:'Peak EMF (V)'});line(ctx,ax,xs,serColor(1));dot(ctx,ax.X(p.rpm),ax.Y(genPeak(p)));return;}
    if(p.scene==='transformer'){const xs=[];for(let n=10;n<=1000;n+=10)xs.push([n,p.ac?p.vp*n/p.np:0]);const ax=axes(ctx,box,{xmin:0,xmax:1000,ymin:0,ymax:Math.max(10,xs[xs.length-1][1]*1.05),xl:'Secondary turns Ns',yl:'Secondary voltage (V)'});line(ctx,ax,xs,serColor(1));dot(ctx,ax.X(p.ns),ax.Y(trans(p).vs));return;}
    const xs=[];for(let w=0.5;w<=3.001;w+=0.1)xs.push([w,tFall(bTube(Object.assign({},p,{wall:w})))]);const ax=axes(ctx,box,{xmin:0.5,xmax:3,ymin:0,ymax:Math.max(1,...xs.map(a=>a[1]))*1.1,xl:'Wall thickness (mm)',yl:'Time to fall 1 m (s)'});line(ctx,ax,xs,serColor(1));dot(ctx,ax.X(p.wall),ax.Y(tFall(bTube(p))));},
  infoPanel(sim){const p=sim.p,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.scene==='generator'){const w=p.rpm*2*Math.PI/60;return `<h3>Generator</h3><p>ω = ${w.toFixed(1)} rad/s (${(p.rpm/60).toFixed(1)} turns per second). Peak EMF = NBAω = ${p.turns} × ${p.bgen.toFixed(2)} T × 0.010 m² × ${w.toFixed(1)} = <b>${genPeak(p).toFixed(2)} V</b>.</p><p class="help">The EMF is biggest when the coil is edge-on to the field (flux changing fastest) and zero when it faces the field (flux at its maximum, momentarily not changing). The coil is drawn turning 4× slower than the model.</p>`;}
    if(p.scene==='transformer'){const t=trans(p);return `<h3>Transformer</h3><p>Vs/Vp = Ns/Np: ${p.vp} V × ${p.ns}/${p.np} = <b>${t.vs.toFixed(1)} V</b> (${p.ns>p.np?'step-up':p.ns<p.np?'step-down':'1 : 1'}).</p>${ap?`<p>Load ${RLOAD} Ω: Is = ${t.is.toFixed(2)} A, Ip = ${t.ip.toFixed(2)} A. Power in = ${(p.vp*t.ip).toFixed(1)} W = power out ${(t.vs*t.is).toFixed(1)} W (ideal transformer).</p>`:''}${p.ac?'':'<p><b>DC:</b> a steady current makes a steady flux, so nothing is induced in the secondary.</p>'}`;}
    if(p.scene==='tube'){const b=bTube(p);return `<h3>Falling magnet</h3><p>Drag coefficient b = ${b.toFixed(2)} kg/s. ${b>0?`Terminal speed mg/b = <b>${(MMAG*G/b).toFixed(2)} m/s</b>; time to fall 1 m ≈ ${tFall(b).toFixed(2)} s, versus ${tFall(0).toFixed(2)} s in plastic.`:'Plastic does not conduct, so there are no eddy currents: free fall.'}</p><p class="help">The moving magnet changes the flux through each ring of the tube. The induced eddy currents make their own field that opposes the change (Lenz’s law), pushing up on the magnet. Its lost kinetic energy heats the tube.</p>`;}
    const s=sim.st,I=curEMF(sim)/RC*1000;let h=`<h3>Coil readings</h3><div class="tbl-wrap"><table><tbody><tr><td>Turns N</td><td>${p.turns}</td></tr><tr><td>Magnet position</td><td>${(s.xm*100).toFixed(1)} cm from coil centre</td></tr>${hon?`<tr><td>Flux per turn Φ</td><td>${(s.flux*1e6).toFixed(2)} µWb</td></tr>`:''}<tr><td>EMF</td><td>${(curEMF(sim)*1000).toFixed(1)} mV</td></tr><tr><td>Current (R = ${RC} Ω)</td><td>${I.toFixed(2)} mA</td></tr></tbody></table></div>`;
    if(hon)h+=`<p class="help"><b>Lenz’s law:</b> the induced current always makes a field that opposes the change in flux. A magnet approaching the coil is pushed back; one leaving is pulled back.</p>`;return h;},
  narrate(sim){const p=sim.p,s=sim.st,e=curEMF(sim);
    if(p.scene==='generator')return p.rpm===0?'The coil is not turning, so the flux through it never changes: no voltage.':'As the coil turns, the flux through it rises and falls, so the induced voltage swings back and forth: <b>alternating current</b>. Right now the coil is '+(Math.abs(Math.sin(s.gth))>0.8?'edge-on to the field, cutting across it fastest: biggest voltage.':Math.abs(Math.sin(s.gth))<0.3?'facing the field, so the flux is momentarily not changing: almost no voltage.':'turning between the two.');
    if(p.scene==='transformer')return !p.ac?'<b>Steady DC</b> makes a steady flux in the iron. Nothing is changing, so the secondary coil gets no voltage at all.':'The alternating current in the primary makes a changing flux in the iron core, which induces a voltage in the secondary. '+(p.ns>p.np?'More turns on the secondary: the voltage is <b>stepped up</b> to ':p.ns<p.np?'Fewer turns on the secondary: the voltage is <b>stepped down</b> to ':'Equal turns: the same ')+trans(p).vs.toFixed(0)+' V.';
    if(p.scene==='tube'){const b=bTube(p);return b===0?'Both tubes are plastic, which does not conduct: both magnets fall freely.':'In the metal tube the falling magnet induces swirling <b>eddy currents</b>. By Lenz’s law their field opposes the magnet’s motion, so it falls at a slow, steady terminal speed of '+(MMAG*G/b).toFixed(2)+' m/s.';}
    const moving=Math.abs(e)>1e-4;
    if(p.motion==='still'||!moving)return '<b>No change, no current.</b> The magnet is not moving relative to the coil, so the magnetic flux through the coil stays the same and the meter reads zero, even with the magnet inside.';
    const approaching=e*(p.flip?-1:1)<0;
    return 'The magnet is '+(approaching?'moving into':'moving out of')+' the coil, so the flux through the coil is '+(approaching?'increasing':'decreasing')+'. That change pushes a current around the coil'+(atLeast('honors')&&s.xm<0.005?', which makes the coil face the magnet with a <b>'+((approaching?!p.flip:p.flip)?'north':'south')+'</b> pole ('+(approaching?'repelling':'attracting')+' it, Lenz’s law).':'. Faster motion or more turns make a bigger current.');},
  tour:[
    {title:'A coil and a meter',text:'A coil of copper wire is connected to a sensitive current meter (a galvanometer). There is no battery anywhere in this circuit.',focus:[380,100,420,330],pause:true,setup(sim){BioLab.setValues(sim,{scene:'magnet',motion:'still',meter:'galv',flip:false,turns:100,speed:0.3});}},
    {title:'A magnet at rest',text:'A magnet just sitting near the coil makes no current. The field is there, but it is not changing.',focus:[60,100,500,190],pause:true},
    {title:'Push the magnet in',text:'Move the magnet into the coil and the meter swings. The flux through the coil is increasing, and that change induces a voltage.',focus:[60,80,740,360],speed:0.4,setup(sim){BioLab.setValues(sim,{motion:'in'});}},
    {title:'Pull it out',text:'Pull the magnet out and the meter swings the other way. Decreasing flux induces current in the opposite direction.',focus:[60,80,740,360],speed:0.4,setup(sim){BioLab.setValues(sim,{motion:'out'});}},
    {title:'Faster means more',text:'Move the magnet faster and the flux changes faster, so the voltage is bigger.',focus:[60,80,740,360],speed:0.5,setup(sim){BioLab.setValues(sim,{motion:'osc',speed:0.8});}},
    {title:'More turns mean more',text:'Each turn of the coil gets the same push, and the turns add up like batteries in series. Three times the turns, three times the voltage.',focus:[380,100,220,200],speed:0.5,setup(sim){BioLab.setValues(sim,{turns:300});}},
    {lvl:'honors',title:'Lenz’s law',text:'The induced current makes the coil into a magnet that opposes the change: it repels the magnet coming in and pulls back on the magnet going out. Watch the pole letters on the coil.',focus:[330,90,300,220],speed:0.25,setup(sim){BioLab.setValues(sim,{turns:100,speed:0.3,motion:'osc'});}},
    {lvl:'honors',title:'Generators',text:'Spin a coil in a magnetic field and the flux through it keeps changing. That is how power stations make alternating current.',focus:[100,60,600,360],speed:0.5,setup(sim){BioLab.setValues(sim,{scene:'generator',rpm:300});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{scene:'magnet',motion:'in',speed:0.3,turns:100});},
  challenges:[
    {lvl:'bio',q:'The magnet has been moving in and out of the coil. You stop it, right inside the coil. What does the meter read?',choices:['A steady current, because the magnet is inside the coil','Zero','The biggest current yet'],correct:1,
     baseline:{scene:'magnet',motion:'osc',speed:0.3},change:{motion:'still'},changeText:'Magnet stopped',watch:'swing',
     explain:{bio:'Only a changing magnetic field makes a current. A magnet sitting still, even inside the coil, gives a field that does not change, so there is no current.'}},
    {lvl:'bio',q:'You push the magnet into the coil faster. What happens to the meter swing?',choices:['It gets bigger','It stays the same; only the magnet’s strength matters','It gets smaller'],correct:0,
     baseline:{scene:'magnet',motion:'in',speed:0.2},change:{speed:0.6},changeText:'Pushed 3× faster',watch:'swing',
     explain:{bio:'Faster motion changes the field through the coil faster, which makes a bigger voltage and a bigger current.',honors:'EMF = −N ΔΦ/Δt. The same change in flux in a third of the time gives three times the EMF.'}},
    {lvl:'bio',q:'Pushing the magnet in makes the meter swing one way. What happens when you pull it out instead?',choices:['It swings the same way','It swings the opposite way','It does not swing at all'],correct:1,
     baseline:{scene:'magnet',motion:'in',speed:0.3},change:{motion:'out'},changeText:'Now pulling the magnet out',watch:'swing',
     explain:{bio:'Pushing in increases the field through the coil; pulling out decreases it. The opposite change makes current flow the opposite way.'}},
    {lvl:'bio',q:'You wind the coil with 300 turns instead of 100 and push the magnet in at the same speed. What happens?',choices:['About three times the current','The same current','One-third of the current'],correct:0,
     baseline:{scene:'magnet',motion:'in',speed:0.3,turns:100},change:{turns:300},changeText:'Coil rewound with 300 turns',watch:'swing',
     explain:{bio:'Every turn of wire gets the same push. The turns are connected one after another, so their voltages add: three times the turns gives three times the voltage, and three times the current (same resistance in the meter here).'}},
    {lvl:'honors',q:'You turn the magnet around so its south end enters the coil first, at the same speed. What happens to the current?',choices:['Same direction','Opposite direction','No current: only a north pole works'],correct:1,
     baseline:{scene:'magnet',motion:'in',flip:false},change:{flip:true},changeText:'Magnet flipped',watch:'swing',
     explain:{honors:'The flux now points the other way through the coil, so its change has the opposite sign. By Lenz’s law the coil now forms a south pole facing the incoming south end, so the current reverses.'}},
    {lvl:'honors',q:'A transformer has 200 primary turns and 100 secondary turns on 120 V AC. You rewind the secondary with 400 turns. What is the new secondary voltage?',choices:['60 V','120 V','240 V','480 V'],correct:2,
     baseline:{scene:'transformer',vp:120,np:200,ns:100,ac:true},change:{ns:400},changeText:'Secondary rewound with 400 turns',watch:'vsec',
     explain:{honors:'Vs/Vp = Ns/Np, so Vs = 120 × 400/200 = 240 V: a step-up transformer. (With 100 turns it was 60 V, a step-down.)'}},
    {lvl:'honors',q:'You switch the transformer’s primary from 120 V AC to a 120 V battery (DC). What does the secondary give?',choices:['120 V','The same as before','Nothing (0 V)'],correct:2,
     baseline:{scene:'transformer',vp:120,np:200,ns:100,ac:true},change:{ac:false},changeText:'Switched to DC',watch:'vsec',
     explain:{honors:'A steady current makes a steady flux in the core. Induction needs a changing flux, so the secondary gets nothing. That is why the power grid uses AC.'}},
    {lvl:'ap',q:'Two identical magnets are dropped down 1 m tubes: one plastic, one copper. How do the fall times compare?',choices:['Both take about 0.45 s','The copper tube’s magnet falls much more slowly','The copper tube’s magnet falls faster, because copper attracts it'],correct:1,
     baseline:{scene:'tube',tmat:'plastic',wall:1.5},change:{tmat:'copper'},changeText:'Metal tube switched to copper',watch:'tfall',
     explain:{ap:'Copper is not magnetic, but it conducts. The moving magnet changes the flux through each ring of the tube, inducing eddy currents whose field opposes the motion (Lenz). The drag is proportional to speed, F = bv, so the magnet reaches terminal speed mg/b ≈ 0.2 m/s and takes about 5 s.'}},
    {lvl:'ap',q:'The flux through a 50-turn coil falls steadily from 2.0 mWb to zero in 0.10 s. What is the average induced EMF?',choices:['0.02 V','1.0 V','0.04 V','10 V'],correct:1,instant:true,
     explain:{ap:'|EMF| = N ΔΦ/Δt = 50 × (2.0 × 10⁻³ Wb)/(0.10 s) = 1.0 V.'}}
  ],
  lab:{bio:'<p><b>Question:</b> What makes a bigger induced current?</p><ol><li>Choose Push in. Record the biggest meter swing at speeds of 0.1, 0.3, 0.6 and 1.0 m/s.</li><li>Set 0.3 m/s and record it for 50, 100, 200 and 400 turns.</li></ol><p>Write a rule that connects speed and turns to the size of the current.</p>',
       honors:'<p><b>Question:</b> Does the EMF depend on the rate of change of flux?</p><ol><li>Use In and out. Watch the flux and EMF graphs together.</li><li>Record the EMF when the flux graph is at a peak and when it is steepest.</li><li>Then try the generator at 150, 300, 600 and 1200 rpm and record the peak EMF.</li></ol><p>Explain both results with EMF = −N ΔΦ/Δt.</p>',
       ap:'<p><b>Question:</b> How do eddy currents depend on the tube?</p><ol><li>Choose the falling magnet. Record the time to fall 1 m for walls of 0.5 to 3.0 mm, in copper and in aluminum.</li><li>Plot terminal speed against 1/(wall thickness).</li></ol><p><b>Claim–evidence–reasoning:</b> Use Faraday’s and Lenz’s laws to explain why the drag force is proportional to speed and to the tube’s conductance, and where the magnet’s energy goes.</p>'},
  terms:[{t:'Electromagnetic induction',d:'Making a voltage by changing the magnetic field through a coil.'},{t:'Induced current',d:'The current that flows because of induction.'},{t:'Galvanometer',d:'A sensitive meter that shows small currents and their direction.'},{t:'Generator',d:'A coil turning in a magnetic field, which turns motion into electrical energy.'},
    {lvl:'honors',t:'Magnetic flux (Φ)',d:'How much magnetic field passes through a loop: Φ = BA cos θ, in webers (Wb).'},{lvl:'honors',t:'Faraday’s law',d:'EMF = −N ΔΦ/Δt.'},{lvl:'honors',t:'Lenz’s law',d:'The induced current opposes the change in flux that caused it.'},{lvl:'honors',t:'Transformer',d:'Two coils on an iron core: Vs/Vp = Ns/Np, for AC only.'},
    {lvl:'ap',t:'Eddy currents',d:'Swirling currents induced in a solid conductor by a changing flux; they cause magnetic braking and heating.'},{lvl:'ap',t:'Motional EMF',d:'EMF = BLv for a rod of length L moving at v across a field B.'}],
  about:'<p>The magnet is treated as a point magnetic dipole (moment 1 A·m², a strong neodymium magnet) on the axis of a 3 cm-radius coil, so Φ(x) = μ₀ma²/(2(a² + x²)^{3/2}) per turn and EMF = −N dΦ/dt is computed each step. The coil and meter have 5 Ω resistance; the induced current’s own magnetic force on the magnet is ignored, and the magnet moves at the speed you set.</p><p>The generator uses EMF = NBAω sin ωt with a 10 cm × 10 cm coil, drawn turning 4× slower. The transformer is ideal (no losses, all flux shared), with a 50 Ω load; the AC is drawn at 0.5 Hz instead of 60 Hz. The falling magnet (20 g) has a drag force bv with b chosen to give a copper-tube terminal speed of about 0.2 m/s, scaled by wall thickness and conductivity.</p>',
  initVis(sim){},
  draw(sim,ctx,vdt,k,t){const p=sim.p;k=Math.min(k,1.35);ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    if(p.scene==='generator')drawGen(ctx,sim,k);else if(p.scene==='transformer')drawTrans(ctx,sim,k);else if(p.scene==='tube')drawTube(ctx,sim,k);else drawMagnet(ctx,sim,k,t);
    txt(ctx,SCN.find(o=>o.v===p.scene).l,16,26,{s:15*k,w:700});}
};
function rLoad(p){return p.scene==='transformer'?RLOAD:p.scene==='generator'?10:RC;}
function curEMF(sim){const p=sim.p,s=sim.st;if(p.scene==='magnet')return s.emf;if(p.scene==='generator')return genPeak(p)*Math.sin(s.gth);if(p.scene==='transformer')return trans(p).vs*Math.SQRT2*Math.sin(s.tph);return 0;}
function line(ctx,ax,pts,c){ctx.strokeStyle=c;ctx.lineWidth=2.5;ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(ax.X(q[0]),ax.Y(q[1])):ctx.moveTo(ax.X(q[0]),ax.Y(q[1])));ctx.stroke();}
function dot(ctx,x,y){ctx.fillStyle=PAL['s1'];ctx.strokeStyle=PAL['card'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,6,0,6.29);ctx.fill();ctx.stroke();}
function arrowHead(ctx,x,y,dx,dy,s){s=s||7;ctx.beginPath();ctx.moveTo(x+dx*s,y+dy*s);ctx.lineTo(x-dx*s-dy*s*0.7,y-dy*s+dx*s*0.7);ctx.lineTo(x-dx*s+dy*s*0.7,y-dy*s-dx*s*0.7);ctx.closePath();ctx.fill();}
function bulb(ctx,x,y,b,k,label){const gl=clamp(b,0,1);if(gl>0.02){const g=ctx.createRadialGradient(x,y,4,x,y,20+40*gl);g.addColorStop(0,`rgba(255,226,120,${0.8*gl})`);g.addColorStop(1,'rgba(255,226,120,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,20+40*gl,0,6.29);ctx.fill();}
  ctx.fillStyle=gl>0.02?`rgba(255,240,180,${0.35+0.6*gl})`:PAL['card'];ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,18,0,6.29);ctx.fill();ctx.stroke();
  ctx.strokeStyle=gl>0.02?'#c77700':PAL['cv-soft'];ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(x-9,y+6);for(let i=0;i<6;i++)ctx.lineTo(x-7+i*3,y+(i%2?-6:2));ctx.lineTo(x+9,y+6);ctx.stroke();if(label)txt(ctx,label,x,y+36,{s:12*k,c:PAL['cv-soft'],a:'center'});}
function galv(ctx,x,y,I,k,fs){const a=clamp(I/fs,-1,1)*1.05;ctx.fillStyle=PAL['card'];ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;rr(ctx,x-70,y-48,140,78,10);ctx.fill();ctx.stroke();
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y+18,52,Math.PI*1.2,Math.PI*1.8);ctx.stroke();
  for(let i=-4;i<=4;i++){const th=-Math.PI/2+i*0.13;ctx.beginPath();ctx.moveTo(x+Math.cos(th)*48,y+18+Math.sin(th)*48);ctx.lineTo(x+Math.cos(th)*(i%4?44:40),y+18+Math.sin(th)*(i%4?44:40));ctx.stroke();}
  txt(ctx,'0',x,y-40+4,{s:11*k,c:PAL['cv-soft'],a:'center'});
  ctx.strokeStyle=PAL['s1'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y+18);ctx.lineTo(x+Math.sin(a*0.55)*50,y+18-Math.cos(a*0.55)*50);ctx.stroke();ctx.fillStyle=PAL['cv-ink'];ctx.beginPath();ctx.arc(x,y+18,4,0,6.29);ctx.fill();
  txt(ctx,(I*1000).toFixed(1)+' mA',x,y+48,{s:12.5*k,w:700,a:'center'});}
function drawMagnet(ctx,sim,k,t){const p=sim.p,s=sim.st,mx=CXC+s.xm/PXM,R=60,e=s.emf,I=e/RC,hon=atLeast('honors');
  const n=Math.max(4,Math.min(28,Math.round(p.turns/12))),cw=Math.min(110,20+n*3),x0=CXC-cw/2,x1=CXC+cw/2,sg=p.flip?-1:1;
  // dipole field lines around the magnet (r = C sin²θ)
  ctx.strokeStyle=PAL['cv-soft'];ctx.globalAlpha=0.35;ctx.lineWidth=1.2;
  for(const C of [70,120,190,290])for(const side of [1,-1]){ctx.beginPath();let first=true;for(let th=0.05;th<Math.PI-0.05;th+=0.03){const r=C*Math.sin(th)**2,x=mx+r*Math.cos(th),y=AY-side*r*Math.sin(th);if(first){ctx.moveTo(x,y);first=false;}else ctx.lineTo(x,y);}ctx.stroke();}ctx.globalAlpha=1;
  // coil back half
  ctx.strokeStyle='#8a5526';ctx.lineWidth=3;for(let i=0;i<n;i++){const x=lerp(x0,x1,n>1?i/(n-1):0.5);ctx.beginPath();ctx.ellipse(x,AY,10,R,0,Math.PI/2,Math.PI*1.5);ctx.stroke();}
  // magnet
  const L=120,H=40;ctx.fillStyle='#c62828';ctx.fillRect(sg>0?mx:mx-L/2,AY-H/2,L/2,H);ctx.fillStyle='#1f5fbf';ctx.fillRect(sg>0?mx-L/2:mx,AY-H/2,L/2,H);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.strokeRect(mx-L/2,AY-H/2,L,H);
  txt(ctx,'N',mx+30*sg,AY+1,{s:18*k,w:800,c:'#fff',a:'center',b:'middle'});txt(ctx,'S',mx-30*sg,AY+1,{s:18*k,w:800,c:'#fff',a:'center',b:'middle'});
  // coil front half
  ctx.strokeStyle='#b8733a';ctx.lineWidth=3;for(let i=0;i<n;i++){const x=lerp(x0,x1,n>1?i/(n-1):0.5);ctx.beginPath();ctx.ellipse(x,AY,10,R,0,-Math.PI/2,Math.PI/2);ctx.stroke();}
  txt(ctx,p.turns+' turns',CXC,AY-R-12,{s:12.5*k,w:700,a:'center'});
  // induced current arrows on the front of the coil (conventional current) and Lenz poles
  const mag=clamp(Math.abs(I)/0.006,0,1);
  if(mag>0.02){ctx.fillStyle=PAL['s4'];ctx.globalAlpha=0.4+0.6*mag;const d=I>0?1:-1;for(const yy of [AY-30,AY+30])arrowHead(ctx,x1+11,yy,0,d,8);ctx.globalAlpha=1;
    if(hon){// coil acts as a magnet whose left face opposes the change of flux
      const lf=-e>0?'N':'S';// flux points +x (toward the right) for the default magnet; EMF<0 ⇔ flux rising ⇔ coil opposes with a field toward −x ⇔ left face is N
      ctx.globalAlpha=0.35+0.65*mag;pill(ctx,lf,x0-24,AY-R-4,lf==='N'?'#c62828':'#1f5fbf','#fff',13*k);pill(ctx,lf==='N'?'S':'N',x1+28,AY-R-4,lf==='N'?'#1f5fbf':'#c62828','#fff',13*k);ctx.globalAlpha=1;
      txt(ctx,'induced poles',CXC,AY+R+22,{s:12*k,c:PAL['cv-soft'],a:'center'});}}
  // leads to the meter / bulb
  const gx=640,gy=370;ctx.strokeStyle='#b8733a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x0,AY+R);ctx.lineTo(x0,gy-8);ctx.lineTo(gx-70,gy-8);ctx.moveTo(x1,AY+R);ctx.lineTo(x1,AY+R+30);ctx.lineTo(gx,AY+R+30);ctx.lineTo(gx,gy-48);ctx.stroke();
  if(p.meter==='bulb')bulb(ctx,gx,gy-20,Math.abs(I)/0.012,k,(Math.abs(I)*1000).toFixed(1)+' mA');else galv(ctx,gx,gy,I,k,0.012);
  // magnet speed note
  txt(ctx,p.motion==='still'?'magnet held still':'magnet moving at '+p.speed.toFixed(2)+' m/s',16,46,{s:12.5*k,c:PAL['cv-soft']});
  txt(ctx,'EMF '+(e*1000).toFixed(1)+' mV',16,436,{s:13*k,w:700});}
function drawGen(ctx,sim,k){const p=sim.p,s=sim.st,th=s.gth,cx=330,cy=200,e=curEMF(sim),pk=genPeak(p);
  // pole pieces
  ctx.fillStyle='#c62828';rr(ctx,90,110,90,180,8);ctx.fill();ctx.fillStyle='#1f5fbf';rr(ctx,480,110,90,180,8);ctx.fill();
  txt(ctx,'N',135,201,{s:24*k,w:800,c:'#fff',a:'center',b:'middle'});txt(ctx,'S',525,201,{s:24*k,w:800,c:'#fff',a:'center',b:'middle'});
  ctx.strokeStyle=PAL['cv-soft'];ctx.fillStyle=PAL['cv-soft'];ctx.globalAlpha=0.45;ctx.lineWidth=1.2;for(let y=125;y<=275;y+=30){ctx.beginPath();ctx.moveTo(182,y);ctx.lineTo(478,y);ctx.stroke();arrowHead(ctx,250,y,1,0,5);arrowHead(ctx,420,y,1,0,5);}ctx.globalAlpha=1;
  // rotating coil (edge view): width ∝ |cos θ|, face colour shows which side faces us
  const ang=th,c=Math.cos(ang),w=110*Math.abs(Math.sin(ang));ctx.strokeStyle=Math.sin(ang)>=0?'#b8733a':'#8a5526';ctx.lineWidth=5;ctx.strokeRect(cx-w/2,cy-75,Math.max(2,w),150);
  ctx.strokeStyle=PAL['cv-ink'];ctx.setLineDash([5,4]);ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(cx,cy-100);ctx.lineTo(cx,cy+120);ctx.stroke();ctx.setLineDash([]);
  txt(ctx,Math.abs(c)>0.9?'coil faces the poles: most flux, EMF ≈ 0':Math.abs(c)<0.25?'coil side-on to the field: flux changing fastest':'',cx,cy-88,{s:12*k,c:PAL['cv-soft'],a:'center'});
  // slip rings and brushes
  ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(cx,cy+108,16,5,0,0,6.29);ctx.stroke();ctx.beginPath();ctx.ellipse(cx,cy+122,16,5,0,0,6.29);ctx.stroke();
  ctx.strokeStyle='#b8733a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx+18,cy+108);ctx.lineTo(640,cy+108);ctx.lineTo(640,cy+20);ctx.moveTo(cx+18,cy+122);ctx.lineTo(680,cy+122);ctx.lineTo(680,cy+20);ctx.stroke();
  const I=e/10;bulb(ctx,660,cy,pk>0?Math.abs(e)/Math.max(3,pk):0,k,'');txt(ctx,(e).toFixed(2)+' V',660,cy-38,{s:13*k,w:700,a:'center'});
  // mini scope
  const sx=440,sy=350,sw=180,sh=80;ctx.fillStyle=PAL['card'];ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;rr(ctx,sx,sy,sw,sh,8);ctx.fill();ctx.stroke();
  ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<=60;i++){const a=ang-(60-i)*0.1,yv=Math.sin(a);const X=sx+8+i*(sw-16)/60,Y=sy+sh/2-yv*(sh/2-10);i?ctx.lineTo(X,Y):ctx.moveTo(X,Y);}ctx.stroke();
  txt(ctx,'EMF vs time (AC)',sx+sw+10,sy+20,{s:12*k,c:PAL['cv-soft']});
  txt(ctx,p.rpm+' rpm · peak '+pk.toFixed(2)+' V',16,46,{s:12.5*k,c:PAL['cv-soft']});}
function drawTrans(ctx,sim,k){const p=sim.p,s=sim.st,t=trans(p),sn=p.ac?Math.sin(s.tph):1,on=p.vp>0;
  const L=230,R=570,T=110,B=330,th=40;ctx.fillStyle='#7d8590';ctx.fillRect(L,T,R-L,th);ctx.fillRect(L,B-th,R-L,th);ctx.fillRect(L,T,th,B-T);ctx.fillRect(R-th,T,th,B-T);
  txt(ctx,'iron core',400,T+th/2+1,{s:12*k,c:'#fff',a:'center',b:'middle',w:700});
  // flux arrows travelling round the core
  if(on&&(p.ac||sim.st.tph<0.3)){ctx.fillStyle='#fff';const amp=p.ac?sn:0.6;if(Math.abs(amp)>0.15){ctx.globalAlpha=Math.abs(amp);const d=amp>0?1:-1;const off=((s.tph*30)%60);for(let x=L+60+off;x<R-60;x+=60){arrowHead(ctx,x,B-th/2,-d,0,6);}ctx.globalAlpha=1;}}
  // coils
  const coil=(xc,n,col,label)=>{const m=Math.max(3,Math.min(26,Math.round(n/25)));ctx.strokeStyle=col;ctx.lineWidth=3;for(let i=0;i<m;i++){const y=lerp(T+th+8,B-th-8,m>1?i/(m-1):0.5);ctx.beginPath();ctx.ellipse(xc,y,th/2+12,5,0,0,6.29);ctx.stroke();}txt(ctx,label,xc,B+26,{s:12.5*k,w:700,a:'center'});};
  coil(L+th/2,p.np,'#b8733a','Np = '+p.np);coil(R-th/2,p.ns,'#b8733a','Ns = '+p.ns);
  // source
  ctx.strokeStyle='#b8733a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(L-12,T+th+8);ctx.lineTo(120,T+th+8);ctx.lineTo(120,190);ctx.moveTo(120,250);ctx.lineTo(120,B-th-8);ctx.lineTo(L-12,B-th-8);ctx.stroke();
  ctx.fillStyle=PAL['card'];ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(120,220,28,0,6.29);ctx.fill();ctx.stroke();
  if(p.ac){ctx.beginPath();for(let i=0;i<=20;i++){const x=104+i*1.6,y=220-8*Math.sin(i/20*6.28);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}else{txt(ctx,'+ −',120,224,{s:14*k,w:800,a:'center',b:'middle'});}
  txt(ctx,p.vp+' V '+(p.ac?'AC':'DC'),120,272,{s:13*k,w:700,a:'center'});
  // secondary to bulb
  ctx.strokeStyle='#b8733a';ctx.beginPath();ctx.moveTo(R+12,T+th+8);ctx.lineTo(690,T+th+8);ctx.lineTo(690,200);ctx.moveTo(690,240);ctx.lineTo(690,B-th-8);ctx.lineTo(R+12,B-th-8);ctx.stroke();
  bulb(ctx,690,220,p.ac?Math.min(1,t.vs/120)*(0.55+0.45*Math.abs(sn)):0,k,'');txt(ctx,t.vs.toFixed(0)+' V',690,280,{s:13*k,w:700,a:'center'});
  pill(ctx,p.ns>p.np?'STEP-UP':p.ns<p.np?'STEP-DOWN':'1 : 1',400,B+48,PAL['cv-ink'],PAL['card'],12*k);
  // waveforms
  const sx=16,sy=360,sw=200,sh=74;ctx.fillStyle=PAL['card'];ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;rr(ctx,sx,sy,sw,sh,8);ctx.fill();ctx.stroke();
  const vmax=Math.max(p.vp,t.vs,1);const wave=(A,c)=>{ctx.strokeStyle=c;ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<=60;i++){const a=s.tph-(60-i)*0.12,yv=p.ac?A*Math.sin(a):0;const X=sx+8+i*(sw-16)/60,Y=sy+sh/2-yv/vmax*(sh/2-8);i?ctx.lineTo(X,Y):ctx.moveTo(X,Y);}ctx.stroke();};
  wave(p.vp,serColor(2));wave(t.vs,serColor(1));txt(ctx,'primary',sx+sw+8,sy+22,{s:12*k,c:serColor(2),w:700});txt(ctx,'secondary',sx+sw+8,sy+42,{s:12*k,c:serColor(1),w:700});
  txt(ctx,p.ac?'AC drawn slowed down (real: 60 Hz)':'steady DC: no changing flux',16,46,{s:12.5*k,c:PAL['cv-soft']});}
function drawTube(ctx,sim,k){const p=sim.p,s=sim.st,T=70,B=410,H=B-T,b=bTube(p);
  const tube=(x,col,lab,y,v,eddy)=>{ctx.fillStyle=col;ctx.globalAlpha=0.35;ctx.fillRect(x-28,T,56,H);ctx.globalAlpha=1;ctx.strokeStyle=col;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-28,T);ctx.lineTo(x-28,B);ctx.moveTo(x+28,T);ctx.lineTo(x+28,B);ctx.stroke();
    const my=T+y*(H-30)+15;
    if(eddy&&v>0.01&&y<1){const a=clamp(v/0.3,0.2,1);ctx.strokeStyle=PAL['s4'];ctx.fillStyle=PAL['s4'];ctx.globalAlpha=a;ctx.lineWidth=2;for(const [dy,dir] of [[-34,1],[34,-1]]){ctx.beginPath();ctx.ellipse(x,my+dy,34,8,0,0,6.29);ctx.stroke();arrowHead(ctx,x+dir*2,my+dy+8,dir,0,6);}ctx.globalAlpha=1;}
    ctx.fillStyle='#c62828';ctx.fillRect(x-14,my-15,28,15);ctx.fillStyle='#1f5fbf';ctx.fillRect(x-14,my,28,15);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;ctx.strokeRect(x-14,my-15,28,30);
    if(eddy&&v>0.01&&y<1){ctx.fillStyle=PAL['s1'];ctx.strokeStyle=PAL['s1'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+60,my);ctx.lineTo(x+60,my-36);ctx.stroke();arrowHead(ctx,x+60,my-36,0,-1,7);txt(ctx,'drag',x+70,my-14,{s:12*k,c:PAL['s1'],w:700});}
    txt(ctx,lab,x,B+22,{s:13*k,w:700,a:'center'});txt(ctx,v.toFixed(2)+' m/s',x,T-10,{s:12.5*k,a:'center',c:PAL['cv-soft']});};
  tube(250,PAL['cv-soft'],'Plastic',s.yp,s.vp,false);tube(540,p.tmat==='copper'?'#b8733a':p.tmat==='aluminum'?'#9aa3ad':PAL['cv-soft'],p.tmat[0].toUpperCase()+p.tmat.slice(1),s.yt,s.vt,b>0);
  // metre scale
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(110,T);ctx.lineTo(110,B);ctx.stroke();for(let i=0;i<=10;i++){const y=T+i*H/10;ctx.beginPath();ctx.moveTo(104,y);ctx.lineTo(116,y);ctx.stroke();}
  txt(ctx,'0 m',100,T+4,{s:12*k,c:PAL['cv-soft'],a:'right'});txt(ctx,'1 m',100,B+4,{s:12*k,c:PAL['cv-soft'],a:'right'});
  txt(ctx,'t = '+s.tt.toFixed(2)+' s',680,100,{s:14*k,w:700});txt(ctx,'Plastic: '+tFall(0).toFixed(2)+' s',680,124,{s:12.5*k,c:PAL['cv-soft']});txt(ctx,p.tmat[0].toUpperCase()+p.tmat.slice(1)+': '+tFall(b).toFixed(2)+' s',680,144,{s:12.5*k,c:PAL['cv-soft']});
  txt(ctx,'20 g magnets, 1 m tubes, wall '+p.wall.toFixed(1)+' mm',16,46,{s:12.5*k,c:PAL['cv-soft']});}
BioLab.register(SIM);
})();
