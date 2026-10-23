(function(){
'use strict';
const {clamp,rr,txt,pill,polyline,atLeast,PAL,FONT,RM,axes,legend,serColor}=BioLab.h;
const E0=8.854e-12;   // permittivity of free space, F/m
const SUP={'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
const sup=n=>String(n).split('').map(c=>SUP[c]||c).join('');
function sci(v,unit){if(!Number.isFinite(v))return '—';if(v===0)return '0 '+unit;const a=Math.abs(v),e=Math.floor(Math.log10(a)+1e-9);
  if(e>=0&&e<4)return (a<10?v.toFixed(2):a<100?v.toFixed(1):v.toFixed(0))+' '+unit;return (v/Math.pow(10,e)).toFixed(2)+' × 10'+sup(e)+' '+unit;}
function eng(v,u){const a=Math.abs(v);const [m,p]=a<1e-9?[1e12,'p']:a<1e-6?[1e9,'n']:a<1e-3?[1e6,'μ']:[1e3,'m'];const x=v*m;return (Math.abs(x)<10?x.toFixed(2):Math.abs(x)<100?x.toFixed(1):x.toFixed(0))+' '+p+u;}
const DIEL={1:'Air',3.7:'Paper',4.7:'Glass',80:'Water'};
const DCOL={1:null,3.7:'#e9d8a6',4.7:'#a8d5e2',80:'#7fb3e6'};

/* ---------- physics ---------- */
const capF=p=>p.kap*E0*(p.A*1e-4)/(p.d*1e-3);          // parallel-plate capacitance, F
const tau=p=>p.R*1e3*p.C*1e-6;                          // RC time constant, s
const vc=s=>s.st.q/s.p.C;                               // q in μC, C in μF → volts
function current(s){const p=s.p,v=vc(s);return p.sw==='charge'?(p.V-v)/(p.R*1e3):v/(p.R*1e3);} // amps, magnitude
function stepRC(sim,dt){const p=sim.p,st=sim.st,T=tau(p),f=Math.exp(-dt/T);let v=st.q/p.C;v=p.sw==='charge'?p.V+(v-p.V)*f:v*f;st.q=v*p.C;}

/* ---------- circuit geometry (RC mode) ---------- */
const TOP=132,BAT={x:110,top:214,bot:290},SWP=[370,TOP],SWA=[300,TOP],SWB=[300,TOP+66],CAP={x:660,top:246,bot:274},RAIL=396,RX=[410,510],BUL=570;
const PCH=polyline([[BAT.x,BAT.top],[BAT.x,TOP],SWA,SWP,[CAP.x,TOP],[CAP.x,CAP.top],[CAP.x,CAP.bot],[CAP.x,RAIL],[BAT.x,RAIL],[BAT.x,BAT.bot]]);
const PDIS=polyline([[CAP.x,CAP.top],[CAP.x,TOP],SWP,SWB,[SWB[0],RAIL],[CAP.x,RAIL],[CAP.x,CAP.bot]]);

/* ---------- show only what the current mode uses ---------- */
function syncMode(sim){const d=sim.def,mode=sim.p.mode;
  if(!sim.ui||!sim.ui.sec)return;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];d.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!atLeast(a.lvl)||!a.modes.includes(mode);});
  const want=mode==='plates'?'cd':'vt';if(sim.ui.gm&&sim.gMetric!==want&&!(mode==='rc'&&['vt','it','kvl'].includes(sim.gMetric))){sim.gMetric=want;sim.ui.gm.value=want;}}
function onSwitch(sim){sim.st.t0=sim.t;}
// timed RC challenges freeze the circuit at the reveal so the evidence stays on screen
function held(sim){const c=sim.ch;if(!c||c.phase!=='done')return false;const list=(sim.def.challenges||[]).filter(x=>atLeast(x.lvl)),ch=list[c.idx];if(!ch||!ch.hold)return false;if(sim.st.hold===undefined)sim.st.hold=(sim.t-sim.st.t0)/tau(sim.p);return true;}

const CAPD={
  id:'capacitor',hash:'capacitor',apUnit:10,order:3,tab:'Capacitors and RC circuits',kind:'Simulation',
  card:'Build a parallel-plate capacitor, add a dielectric, then charge and discharge it through a bulb and watch the exponential curves.',
  title:'Capacitors and RC circuits',
  lede:{bio:'A capacitor stores electric charge on two metal plates. See what makes it hold more, then watch a bulb glow and fade as it charges and discharges.',
        honors:'Use C = κε₀A/d, Q = CV and U = ½CV², then measure the time constant τ = RC of a charging circuit.',
        ap:'Model charging with Kirchhoff’s loop rule, R·dq/dt + q/C = V₀, and compare its exponential solutions with the graphs.'},
  scale:'Plates are 50 to 400 cm² and 1 to 10 mm apart (the gap is drawn enlarged). In the circuit, R is 1 to 100 kΩ and C is 10 to 1000 μF, so τ runs from 0.01 s to 100 s.',
  unit:'s',window:12,timeScale:1,prewarm:0,dtMax:0.01,chChange:1,chReveal:2.5,
  clock(sim){return sim.p.mode==='rc'?'t = '+sim.t.toFixed(1)+' s':'Parallel plates';},
  controls:[
    {id:'mode',label:'Setup',type:'seg',def:'plates',lvl:'bio',options:[{v:'plates',l:'Parallel plates'},{v:'rc',l:'RC circuit with bulb'}]},
    {id:'A',label:'Plate area',type:'range',min:50,max:400,step:10,def:100,unit:' cm²',lvl:'bio',modes:['plates']},
    {id:'d',label:'Plate separation',type:'range',min:1,max:10,step:0.5,def:2,unit:' mm',lvl:'bio',modes:['plates']},
    {id:'kap',label:'Material between the plates',type:'select',def:1,lvl:'honors',modes:['plates'],options:[{v:1,l:'Air (κ = 1.0)'},{v:3.7,l:'Paper (κ = 3.7)'},{v:4.7,l:'Glass (κ = 4.7)'},{v:80,l:'Water (κ = 80)'}]},
    {id:'V',label:'Battery voltage',type:'range',min:1.5,max:12,step:0.5,def:9,unit:' V',lvl:'bio'},
    {id:'sw',label:'Switch',type:'seg',def:'charge',lvl:'bio',modes:['rc'],options:[{v:'charge',l:'Charge (to battery)'},{v:'discharge',l:'Discharge (bypass battery)'}],onChange:onSwitch},
    {id:'R',label:'Resistance (includes the bulb)',type:'range',min:1,max:100,step:1,def:10,unit:' kΩ',lvl:'bio',modes:['rc']},
    {id:'C',label:'Capacitance',type:'range',min:10,max:1000,step:10,def:100,unit:' μF',lvl:'bio',modes:['rc']}
  ],
  actions:[
    {id:'full',label:'Charge fully (skip ahead)',lvl:'bio',modes:['rc'],run(sim){sim.st.q=sim.p.C*sim.p.V;sim.st.t0=sim.t;}},
    {id:'empty',label:'Empty the capacitor',lvl:'bio',modes:['rc'],run(sim){sim.st.q=0;sim.st.t0=sim.t;}}
  ],
  init(){return {q:0,t0:0};},
  step(sim,dt){if(held(sim))return;if(sim.p.mode==='rc')stepRC(sim,dt);},
  metrics:[
    {id:'Cp',label:'Capacitance',unit:'pF',lvl:'bio',min:0,max:null,d:1,modes:['plates'],get:s=>capF(s.p)*1e12},
    {id:'Qp',label:'Charge on each plate',unit:'pC',lvl:'bio',min:0,max:null,d:0,modes:['plates'],get:s=>capF(s.p)*s.p.V*1e12},
    {id:'Ep',label:'Field between plates',unit:'kV/m',lvl:'honors',min:0,max:null,d:2,modes:['plates'],get:s=>s.p.V/(s.p.d*1e-3)/1000},
    {id:'Up',label:'Energy stored, ½CV²',unit:'nJ',lvl:'honors',min:0,max:null,d:2,modes:['plates'],get:s=>0.5*capF(s.p)*s.p.V*s.p.V*1e9},
    {id:'vc',label:'Capacitor voltage',unit:'V',lvl:'bio',min:0,max:null,d:2,modes:['rc'],get:s=>vc(s)},
    {id:'I',label:'Current',unit:'mA',lvl:'bio',min:0,max:null,d:3,modes:['rc'],get:s=>current(s)*1000},
    {id:'pct',label:'Charged',unit:'% of battery',lvl:'bio',min:0,max:100,d:1,modes:['rc'],get:s=>100*vc(s)/s.p.V},
    {id:'tau',label:'Time constant τ = RC',unit:'s',lvl:'honors',min:0,max:null,d:2,modes:['rc'],get:s=>tau(s.p)},
    {id:'vr',label:'Voltage across R',unit:'V',lvl:'honors',min:0,max:null,d:2,modes:['rc'],get:s=>current(s)*s.p.R*1e3},
    {id:'Ur',label:'Energy stored, ½CV²',unit:'mJ',lvl:'honors',min:0,max:null,d:2,modes:['rc'],get:s=>0.5*s.p.C*1e-6*vc(s)*vc(s)*1e3}
  ],
  graphs:[{id:'cd',label:'Capacitance vs plate separation',lvl:'bio',custom:true},{id:'vt',label:'Capacitor voltage vs time',lvl:'bio',lines:['vc']},{id:'it',label:'Current vs time',lvl:'bio',lines:['I']},{id:'kvl',label:'V across C and R vs time',lvl:'honors',lines:['vc','vr']}],
  defaultGraph:'cd',
  plot(sim,ctx,box,id){const p=sim.p,A=p.A*1e-4;const f=(d,k)=>k*E0*A/(d*1e-3)*1e12;const ymax=f(1,p.kap)*1.08;
    const ax=axes(ctx,box,{xmin:0,xmax:10,ymin:0,ymax,xl:'Plate separation d (mm)',yl:'Capacitance (pF)'});
    ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();
    const curve=(k,c,dash,w)=>{ctx.strokeStyle=c;ctx.lineWidth=w;ctx.setLineDash(dash);ctx.beginPath();for(let d=0.8;d<=10;d+=0.05){const y=f(d,k);d<0.81?ctx.moveTo(ax.X(d),ax.Y(y)):ctx.lineTo(ax.X(d),ax.Y(y));}ctx.stroke();ctx.setLineDash([]);};
    if(p.kap!==1)curve(1,PAL['muted'],[5,4],1.8);curve(p.kap,serColor(0),[],2.8);
    const y=f(p.d,p.kap);ctx.fillStyle=serColor(1);ctx.beginPath();ctx.arc(ax.X(p.d),ax.Y(y),6,0,6.29);ctx.fill();ctx.restore();
    pill(ctx,y.toFixed(1)+' pF',clamp(ax.X(p.d)+48,box.L+40,box.L+box.W-40),ax.Y(y)-14,PAL['card'],PAL['fg'],12);
    legend(ctx,box.L+90,box.T+12,[{label:(DIEL[p.kap]||'')+' (κ = '+p.kap+'), A = '+p.A+' cm²',color:serColor(0)}].concat(p.kap!==1?[{label:'air',color:PAL['muted'],dash:true}]:[]));},
  narrate(sim){const p=sim.p,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode==='plates'){const C=capF(p)*1e12,Q=C*p.V;
      let s='The battery pulls electrons off the top plate and piles them onto the bottom plate until the plates are '+p.V+' V apart. Each plate now holds <b>'+eng(Q*1e-12,'C')+'</b>. The capacitance, <b>'+eng(C*1e-12,'F')+'</b>, is how much charge it holds for each volt.';
      if(p.kap!==1)s+=' The '+DIEL[p.kap].toLowerCase()+' between the plates polarizes, its molecules partly cancel the field, so the battery can push <b>'+p.kap+'× more charge</b> on at the same voltage.';
      else s+=' Bigger plates or a smaller gap let the plates hold more charge.';
      if(ap)s+=' Field between the plates: E = V/d = '+(p.V/(p.d*1e-3)).toFixed(0)+' V/m.';
      return s;}
    const T=tau(p),v=vc(sim),pct=100*v/p.V,I=current(sim)*1000,el=(sim.t-sim.st.t0)/T;
    if(p.sw==='charge'){if(pct>=99.3)return 'The capacitor is <b>fully charged</b> at '+v.toFixed(2)+' V. Its voltage matches the battery, so no current flows and the bulb is dark.'+(hon?' That took about 5τ = '+(5*T).toFixed(1)+' s.':'');
      let s='<b>Charging:</b> current flows from the battery onto the capacitor and lights the bulb. As charge builds up, the capacitor pushes back, so the current shrinks and the bulb dims. Now '+pct.toFixed(0)+'% charged.';
      if(hon)s+=' After one time constant, τ = RC = '+T.toFixed(2)+' s, it is 63% charged.';
      if(ap)s+=' V_C(t) = V₀(1 − e^(−t/RC)), I(t) = (V₀/R)e^(−t/RC).';
      if(el>0&&el<8&&hon)s+=' Time since the switch: '+el.toFixed(1)+' τ.';return s;}
    if(v<0.01)return 'The capacitor is <b>empty</b>, so there is nothing to push current through the bulb. Flip the switch to Charge or press Charge fully.';
    let s='<b>Discharging:</b> the capacitor now acts like a battery, pushing current back through the bulb ('+I.toFixed(3)+' mA). As it empties, its voltage falls and the bulb fades.';
    if(hon)s+=' Every τ = '+T.toFixed(2)+' s, the voltage drops to 37% of what it was.';
    if(ap)s+=' V_C(t) = V₀e^(−t/RC), the solution of R·dq/dt = −q/C.';return s;},
  tour:[
    {title:'Two plates and a battery',text:'A capacitor is two metal plates separated by a gap. The battery pulls electrons off the top plate and pushes them onto the bottom one.',focus:[60,40,640,400],speed:1,setup(sim){BioLab.setValues(sim,{mode:'plates',A:100,d:2,kap:1,V:9});}},
    {title:'Stored charge',text:{bio:'The + signs on the top plate and − signs on the bottom are the stored charge. The arrows between the plates show the electric field.',honors:'Q = CV: each plate holds the same amount of charge, opposite in sign. The field between the plates is uniform, E = V/d.'},focus:[250,120,420,260],speed:1},
    {title:'Closer plates hold more',text:{bio:'Bring the plates closer together. The capacitance goes up, so the same battery stores more charge.',honors:'C = κε₀A/d: halving d doubles C. Doubling the area A also doubles C.'},focus:[250,120,420,260],speed:1,setup(sim){BioLab.setValues(sim,{d:1});}},
    {lvl:'honors',title:'Add a dielectric',text:'Glass between the plates polarizes. Its molecules line up with the field and partly cancel it, so the battery can push 4.7× more charge on at the same voltage.',focus:[250,120,420,260],speed:1,setup(sim){BioLab.setValues(sim,{d:2,kap:4.7});}},
    {title:'Charging through a bulb',text:'Now the capacitor is in a circuit with a battery, a resistor and a bulb. When the switch connects the battery, current flows and the bulb lights up.',focus:[90,70,660,330],speed:1,setup(sim){BioLab.setValues(sim,{mode:'rc',R:10,C:100,V:9,kap:1,sw:'charge'});sim.st.q=0;sim.st.t0=sim.t;}},
    {title:'The bulb fades',text:{bio:'As the capacitor fills up, it pushes back against the battery. The current slows and the bulb dims, even though the battery has not changed.',ap:'Kirchhoff’s loop rule: V₀ − IR − q/C = 0 with I = dq/dt. As q grows, I = (V₀ − q/C)/R shrinks.'},focus:[540,60,240,260],speed:1},
    {title:'The time constant',text:{bio:'The graph curves up quickly at first, then levels off. After one time constant the capacitor is about 63% charged.',honors:'τ = RC. After 1τ the capacitor is 63% charged, after 3τ 95%, after 5τ more than 99%.',ap:'V_C(t) = V₀(1 − e^(−t/RC)) and I(t) = (V₀/R)e^(−t/RC). At t = τ, V_C = (1 − 1/e)V₀ = 0.632V₀.'},focus:[590,180,190,230],speed:1}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'plates',A:100,d:2,kap:1,V:9,sw:'charge'});},
  challenges:[
    {lvl:'bio',q:'The plates are 4 mm apart. If you move them to 2 mm apart, the capacitance…',choices:['halves','stays the same','doubles'],correct:2,
     baseline:{mode:'plates',A:100,d:4,kap:1,V:9},change:{d:2},changeText:'Plates moved from 4 mm to 2 mm apart',watch:'cd',
     explain:{bio:'Capacitance went from 22.1 pF to 44.3 pF. Closer plates hold more charge for the same battery voltage.',honors:'C = κε₀A/d, so halving d doubles C: 22.1 pF → 44.3 pF.'}},
    {lvl:'bio',q:'An empty capacitor starts charging (R = 100 kΩ, C = 100 μF). After one time constant, τ = 10 s, how full is it?',choices:['about 37%','about 50%','about 63%','100%'],correct:2,
     baseline:{mode:'rc',R:100,C:100,V:9,sw:'discharge'},at:1,reveal:11,change:{sw:'charge'},changeText:'Switch flipped to Charge; watch for 10 s (one τ)',hold:true,watch:'vt',
     explain:{bio:'It reached about 63% (≈5.7 V of 9 V). Charging is fast at first and slows down as the capacitor fills, so it is not half, and not full.',honors:'V_C = V₀(1 − e⁻¹) = 0.632 × 9 V = 5.69 V after one τ = RC = (100 kΩ)(100 μF) = 10 s.'}},
    {lvl:'honors',q:'Glass (κ = 4.7) is slid between the plates while the battery stays connected. The capacitance…',choices:['decreases','stays the same','increases about 4.7×'],correct:2,
     baseline:{mode:'plates',A:100,d:2,kap:1,V:9},change:{kap:4.7},changeText:'Glass slid between the plates',watch:'cd',
     explain:{honors:'C = κε₀A/d, so C rose from 44.3 pF to 208 pF. The glass polarizes and partly cancels the field, so the battery can push 4.7× more charge on at the same 9 V.'}},
    {lvl:'honors',q:'With R = 10 kΩ and C = 100 μF, a capacitor is 95% charged after 3 s. With R = 100 kΩ instead, after 3 s it is…',choices:['also about 95% charged','only about a quarter charged','fully charged'],correct:1,
     baseline:{mode:'rc',R:100,C:100,V:9,sw:'discharge'},at:1,reveal:4,change:{sw:'charge'},changeText:'Switch flipped to Charge with R = 100 kΩ; watch for 3 s',hold:true,watch:'vt',
     explain:{honors:'τ = RC grew from 1 s to 10 s, so 3 s is only 0.3τ: 1 − e^(−0.3) ≈ 26%, about a quarter. A bigger resistor lets less current through, so the capacitor charges more slowly.'}},
    {lvl:'ap',q:'The battery voltage doubles from 6 V to 12 V. The energy stored in the capacitor…',choices:['doubles','quadruples','stays the same'],correct:1,
     baseline:{mode:'plates',A:100,d:2,kap:1,V:6},change:{V:12},changeText:'Battery voltage doubled to 12 V',watch:'cd',
     explain:{ap:'U = ½CV² = Q²/2C: C stays 44.3 pF, so doubling V quadruples U (0.80 nJ → 3.19 nJ). Q only doubles, but each coulomb is now pushed through twice the voltage.'}},
    {lvl:'ap',q:'A fully charged capacitor (9 V, τ = 10 s) discharges through the bulb. After one τ its voltage is…',choices:['0 V','about 3.3 V','about 4.5 V'],correct:1,
     baseline:{mode:'rc',R:100,C:100,V:9,sw:'charge'},baselineAction:'full',at:1,reveal:11,change:{sw:'discharge'},changeText:'Switch flipped to Discharge; watch for 10 s (one τ)',hold:true,watch:'vt',
     explain:{ap:'R·dq/dt = −q/C gives V_C = V₀e^(−t/RC): 9 V × e⁻¹ = 3.31 V, 37% of the start. The current I = (V₀/R)e^(−t/RC) fades at the same rate.'}}
  ],
  lab:{bio:'<p><b>Question:</b> How does the gap between the plates change how much charge a capacitor holds?</p><ol><li>Keep the area at 100 cm² and the battery at 9 V.</li><li>Record trials at separations of 1, 2, 4, 6, 8 and 10 mm.</li><li>Graph separation (x) against capacitance (y).</li></ol><p>What happens to the capacitance when the gap doubles?</p>',
       honors:'<p><b>Question:</b> How does resistance affect the time constant?</p><ol><li>Use the RC circuit with C = 100 μF and the battery at 9 V.</li><li>For R = 10, 20, 50 and 100 kΩ, empty the capacitor, flip to Charge and measure the time to reach 63%.</li><li>Compare each time with RC.</li></ol><p>Write a rule linking τ, R and C, and explain why a bigger R charges more slowly.</p>',
       ap:'<p><b>Question:</b> Does the discharge follow V = V₀e^(−t/RC)?</p><ol><li>Charge fully with R = 50 kΩ and C = 200 μF, then flip to Discharge.</li><li>Record V_C every 5 s for 40 s.</li><li>Graph ln(V_C) against t.</li></ol><p><b>Claim–evidence–reasoning:</b> Show the slope equals −1/RC, and derive this from Kirchhoff’s loop rule.</p>'},
  terms:[{t:'Capacitor',d:'Two conductors separated by an insulator that store equal and opposite charges.'},{t:'Capacitance',d:'Charge stored per volt, C = Q/V, in farads (F). 1 pF = 10⁻¹² F, 1 μF = 10⁻⁶ F.'},{t:'Charging',d:'Current flows onto the plates until the capacitor’s voltage matches the battery.'},{t:'Discharging',d:'The capacitor pushes its stored charge back around the circuit.'},
    {lvl:'honors',t:'Dielectric',d:'An insulator between the plates. It polarizes and multiplies the capacitance by its dielectric constant κ.'},{lvl:'honors',t:'Time constant τ',d:'τ = RC, the time to charge to 63% or discharge to 37%.'},{lvl:'honors',t:'Energy stored',d:'U = ½CV² = ½QV = Q²/2C.'},
    {lvl:'ap',t:'Kirchhoff’s loop rule',d:'Around a loop the voltages sum to zero: V₀ − IR − q/C = 0 while charging.'},{lvl:'ap',t:'Exponential decay',d:'A quantity whose rate of change is proportional to itself, dx/dt = −x/τ, so x = x₀e^(−t/τ).'}],
  about:'<p>The plates are ideal: much wider than their gap, so C = κε₀A/d with ε₀ = 8.854×10⁻¹² F/m, and the battery stays connected (V fixed). The gap is drawn about 20× larger than it would be to scale. In the circuit, the battery and wires have no resistance, the bulb’s resistance is included in R and treated as constant, and the switch flips instantly. The capacitor voltage is updated with the exact exponential solution each step, so the curves match V₀(1 − e^(−t/RC)) and V₀e^(−t/RC). Bulb brightness follows the current.</p>',
  initVis(sim){sim.vis.qs=null;sim.vis.off=0;sim.vis.ang=0;},
  draw(sim,ctx,vdt,k,t){const p=sim.p;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    if(p.mode==='plates')drawPlates(sim,ctx,vdt,k,t);else drawRC(sim,ctx,vdt,k,t);},
  thumbSetup(sim){sim.p.mode='rc';sim.st.q=sim.p.C*sim.p.V*0.4;}
};

function battery(ctx,x,top,bot,V,k,label,left){const mid=(top+bot)/2;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,mid-9);ctx.moveTo(x,mid+9);ctx.lineTo(x,bot);ctx.stroke();
  ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-26,mid-9);ctx.lineTo(x+26,mid-9);ctx.stroke();ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(x-13,mid+9);ctx.lineTo(x+13,mid+9);ctx.stroke();
  txt(ctx,'+',x+32,mid-14,{s:16*k,w:800,c:'#c62828'});txt(ctx,'−',x+32,mid+22,{s:16*k,w:800,c:'#1f5bbf'});
  if(left)pill(ctx,(label||'')+V.toFixed(1)+' V',x-50,mid,PAL['card'],PAL['cv-ink'],13*k);else pill(ctx,(label||'')+V.toFixed(1)+' V',x-2,bot+26,PAL['card'],PAL['cv-ink'],13*k);}

function drawPlates(sim,ctx,vdt,k,t){const p=sim.p,hon=atLeast('honors'),C=capF(p),Q=C*p.V*1e12;
  const v=sim.vis;v.qs=v.qs===null?Q:v.qs+(Q-v.qs)*(1-Math.exp(-vdt*4));const frac=v.qs/Math.max(Q,1e-9);
  const cx=444,cy=268,w=210*Math.sqrt(p.A/100),sk=w*0.3,g=20*p.d,yt=cy-g/2,yb=cy+g/2,th=8;
  const par=(y,c1,c2)=>{ctx.fillStyle=c1;ctx.beginPath();ctx.moveTo(cx-w/2,y);ctx.lineTo(cx+w/2,y);ctx.lineTo(cx+w/2+sk,y-sk*0.55);ctx.lineTo(cx-w/2+sk,y-sk*0.55);ctx.closePath();ctx.fill();
    ctx.fillStyle=c2;ctx.fillRect(cx-w/2,y,w,th);ctx.beginPath();ctx.moveTo(cx+w/2,y);ctx.lineTo(cx+w/2+sk,y-sk*0.55);ctx.lineTo(cx+w/2+sk,y-sk*0.55+th);ctx.lineTo(cx+w/2,y+th);ctx.closePath();ctx.fill();};
  // wires from the battery
  const bx=70;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(bx,cy-50);ctx.lineTo(bx,yt-40);ctx.lineTo(cx-w/2+sk*0.5,yt-40);ctx.lineTo(cx-w/2+sk*0.5,yt-sk*0.27);ctx.moveTo(bx,cy+50);ctx.lineTo(bx,yb+50);ctx.lineTo(cx-w/2+sk*0.5,yb+50);ctx.lineTo(cx-w/2+sk*0.5,yb+th);ctx.stroke();
  battery(ctx,bx,cy-50,cy+50,p.V,k);
  // bottom plate first (behind), then dielectric, field, top plate
  par(yb,'#9db7e6','#5c7fc0');
  if(DCOL[p.kap]){ctx.fillStyle=DCOL[p.kap];ctx.globalAlpha=0.55;ctx.beginPath();ctx.moveTo(cx-w/2,yb);ctx.lineTo(cx+w/2,yb);ctx.lineTo(cx+w/2+sk,yb-sk*0.55);ctx.lineTo(cx+w/2+sk,yt-sk*0.55+th);ctx.lineTo(cx-w/2+sk,yt-sk*0.55+th);ctx.lineTo(cx-w/2,yt+th);ctx.closePath();ctx.fill();ctx.globalAlpha=1;
    // polarized molecules: − end toward the + plate (up), + end toward the − plate (down)
    if(hon&&g>=36){const cols=Math.max(3,Math.round(w/40)),rows=Math.max(1,Math.floor((g-th)/34));for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){const x=cx-w/2+(i+1)*w/cols+sk*0.3,y=yt+th+(j+0.5)*(g-th)/rows-sk*0.15;if(x>cx+w/2+sk*0.3-8)continue;
      ctx.fillStyle='rgba(31,91,191,.85)';ctx.beginPath();ctx.ellipse(x,y-5,6,5,0,0,6.29);ctx.fill();ctx.fillStyle='rgba(198,40,40,.85)';ctx.beginPath();ctx.ellipse(x,y+5,6,5,0,0,6.29);ctx.fill();}}
    pill(ctx,DIEL[p.kap]+' between the plates (κ = '+p.kap+')',cx+sk*0.5,yb+th+34,PAL['card'],PAL['cv-ink'],13*k);}
  // uniform field arrows between the plates
  const na=Math.max(3,Math.round(w/40));if(g>=26)for(let i=0;i<na;i++){const x=cx-w/2+(i+0.5)*w/na+sk*0.25,y1=yt+th+4-sk*0.14,y2=yb-4-sk*0.14;if(y2-y1<14)continue;ctx.globalAlpha=0.35+0.55*frac;
    ctx.strokeStyle=PAL['s5'];ctx.fillStyle=PAL['s5'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y1);ctx.lineTo(x,y2-8);ctx.stroke();ctx.beginPath();ctx.moveTo(x,y2);ctx.lineTo(x-5,y2-9);ctx.lineTo(x+5,y2-9);ctx.closePath();ctx.fill();ctx.globalAlpha=1;}
  // charges on the plates: count grows with Q (log scale so a water-filled capacitor still fits); − sit on the inner face of the bottom plate
  const drawQ=which=>{const n=clamp(Math.round(5*Math.log2(1+v.qs/40)),0,48),cols=Math.max(4,Math.round(Math.sqrt(n*w/sk*1.8))),rows=Math.max(1,Math.ceil(n/cols));
  for(let i=0;i<n;i++){const a=(i%cols+0.5)/cols,b=(Math.floor(i/cols)+0.5)/rows;const x=cx-w/2+a*w+b*sk,y=-b*sk*0.55;
    if(which==='−')txt(ctx,'−',x,yb+y+1,{s:17*k,w:800,c:'#174ea6',a:'center',b:'middle'});else txt(ctx,'+',x,yt+y+1,{s:15*k,w:800,c:'#b71c1c',a:'center',b:'middle'});}};
  drawQ('−');
  par(yt,'#f0a5a5','#c0504d');
  drawQ('+');
  // dimension labels
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;const dx=cx-w/2-22;ctx.beginPath();ctx.moveTo(dx,yt+th);ctx.lineTo(dx,yb);ctx.moveTo(dx-6,yt+th);ctx.lineTo(dx+6,yt+th);ctx.moveTo(dx-6,yb);ctx.lineTo(dx+6,yb);ctx.stroke();
  pill(ctx,'d = '+p.d.toFixed(1)+' mm',dx-50,cy,PAL['card'],PAL['cv-ink'],12.5*k);
  pill(ctx,'A = '+p.A+' cm²',cx+w/2-48,yt+th/2,PAL['card'],PAL['cv-ink'],12.5*k);
  // readout panel
  const pw=hon?470:320;rr(ctx,12,12,pw,hon?70:46,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,'C = '+eng(C,'F')+'     Q = '+eng(Q*1e-12,'C')+(hon?'     U = '+eng(0.5*C*p.V*p.V,'J'):''),26,42,{s:16*k,w:700});
  if(hon)txt(ctx,'C = κε₀A/d = ('+p.kap+')(8.85×10⁻¹²)('+(p.A*1e-4).toFixed(4)+')/('+(p.d*1e-3).toFixed(4)+') = '+sci(C,'F'),26,68,{s:12.5*k,c:PAL['cv-soft']});
  txt(ctx,'Gap drawn about 20× enlarged',788,440,{s:12*k,c:PAL['cv-soft'],a:'right'});}

function drawRC(sim,ctx,vdt,k,t){const p=sim.p,hon=atLeast('honors'),ap=atLeast('ap'),v=sim.vis,V=vc(sim),I=current(sim)*1000,frac=clamp(V/p.V,0,1.2);
  // switch blade angle eases toward its position
  const target=p.sw==='charge'?0:1;v.ang+=(target-v.ang)*(RM?1:1-Math.exp(-vdt*12));
  // wires
  ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=3;ctx.lineJoin='round';ctx.beginPath();
  ctx.moveTo(BAT.x,BAT.top);ctx.lineTo(BAT.x,TOP);ctx.lineTo(SWA[0],TOP);
  ctx.moveTo(SWP[0],TOP);ctx.lineTo(RX[0],TOP);ctx.moveTo(RX[1],TOP);ctx.lineTo(BUL-22,TOP);ctx.moveTo(BUL+22,TOP);ctx.lineTo(CAP.x,TOP);ctx.lineTo(CAP.x,CAP.top);
  ctx.moveTo(CAP.x,CAP.bot);ctx.lineTo(CAP.x,RAIL);ctx.lineTo(BAT.x,RAIL);ctx.lineTo(BAT.x,BAT.bot);ctx.moveTo(SWB[0],SWB[1]);ctx.lineTo(SWB[0],RAIL);ctx.stroke();
  ctx.fillStyle=PAL['cv-ink'];[[SWB[0],RAIL]].forEach(q=>{ctx.beginPath();ctx.arc(q[0],q[1],4.5,0,6.29);ctx.fill();});
  battery(ctx,BAT.x,BAT.top,BAT.bot,p.V,k,'',true);
  // switch
  [SWA,SWB,SWP].forEach(q=>{ctx.fillStyle=PAL['card'];ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(q[0],q[1],6,0,6.29);ctx.fill();ctx.stroke();});
  const ex=SWA[0]+(SWB[0]-SWA[0])*v.ang,ey=SWA[1]+(SWB[1]-SWA[1])*v.ang;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(SWP[0],SWP[1]);ctx.lineTo(ex+(SWP[0]-ex)*0.1,ey+(SWP[1]-ey)*0.1);ctx.stroke();
  txt(ctx,'charge',SWA[0]-6,TOP-14,{s:12*k,w:700,a:'right',c:p.sw==='charge'?PAL['s3']:PAL['cv-soft']});txt(ctx,'discharge',SWB[0]-12,SWB[1]+5,{s:12*k,w:700,a:'right',c:p.sw==='discharge'?PAL['s3']:PAL['cv-soft']});
  // resistor
  ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(RX[0],TOP);for(let i=0;i<8;i++)ctx.lineTo(RX[0]+6+i*12.5,TOP+(i%2?12:-12));ctx.lineTo(RX[1],TOP);ctx.stroke();
  txt(ctx,'R = '+p.R+' kΩ',(RX[0]+RX[1])/2,TOP-22,{s:13*k,w:700,a:'center'});
  // bulb with glow ∝ current
  const glow=clamp(I/0.9,0,1.3);if(glow>0.02){const gr=ctx.createRadialGradient(BUL,TOP,4,BUL,TOP,30+40*glow);gr.addColorStop(0,'rgba(255,214,64,'+(0.85*Math.min(1,glow))+')');gr.addColorStop(1,'rgba(255,214,64,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(BUL,TOP,30+40*glow,0,6.29);ctx.fill();}
  ctx.fillStyle=glow>0.05?'rgba(255,236,150,'+(0.45+0.5*Math.min(1,glow))+')':PAL['card'];ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(BUL,TOP,22,0,6.29);ctx.fill();ctx.stroke();
  ctx.strokeStyle=glow>0.05?'#c77700':PAL['cv-soft'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(BUL-16,TOP+8);ctx.lineTo(BUL-10,TOP-10);ctx.lineTo(BUL-4,TOP+8);ctx.lineTo(BUL+2,TOP-10);ctx.lineTo(BUL+8,TOP+8);ctx.lineTo(BUL+14,TOP-10);ctx.stroke();
  txt(ctx,'Bulb',BUL,TOP+40,{s:12.5*k,w:700,a:'center',c:PAL['cv-soft']});
  // capacitor with charge and field
  ctx.fillStyle='#c0504d';ctx.fillRect(CAP.x-40,CAP.top-5,80,7);ctx.fillStyle='#5c7fc0';ctx.fillRect(CAP.x-40,CAP.bot-2,80,7);
  const nq=clamp(Math.round(frac*9),0,10);for(let i=0;i<nq;i++){const x=CAP.x-36+(i+0.5)*72/Math.max(nq,1);txt(ctx,'+',x,CAP.top-14,{s:14*k,w:800,c:'#b71c1c',a:'center',b:'middle'});txt(ctx,'−',x,CAP.bot+16,{s:15*k,w:800,c:'#174ea6',a:'center',b:'middle'});}
  if(frac>0.05){ctx.globalAlpha=Math.min(1,frac);ctx.strokeStyle=PAL['s5'];ctx.lineWidth=1.5;for(let i=0;i<4;i++){const x=CAP.x-27+i*18;ctx.beginPath();ctx.moveTo(x,CAP.top+4);ctx.lineTo(x,CAP.bot-4);ctx.stroke();}ctx.globalAlpha=1;}
  txt(ctx,'C = '+p.C+' μF',CAP.x-58,CAP.bot+26,{s:13*k,w:700,a:'center'});
  // charge gauge with the 63% mark
  const gx=CAP.x+52,gt=CAP.top-40,gh=120;ctx.fillStyle=PAL['card2'];rr(ctx,gx,gt,22,gh,5);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  const fh=gh*clamp(frac,0,1);ctx.fillStyle=PAL['s3'];rr(ctx,gx,gt+gh-fh,22,fh,5);ctx.fill();
  [[0.632,'63%'],[0.368,'37%']].forEach(([f,l])=>{const y=gt+gh*(1-f);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(gx-4,y);ctx.lineTo(gx+26,y);ctx.stroke();txt(ctx,l,gx+30,y,{s:11.5*k,c:PAL['cv-soft'],b:'middle'});});
  txt(ctx,(100*V/p.V).toFixed(0)+'%',gx+11,gt+gh+18,{s:13*k,w:700,a:'center'});
  pill(ctx,'V_C = '+V.toFixed(2)+' V',CAP.x-58,CAP.top-4,PAL['card'],PAL['cv-ink'],12.5*k);
  // moving charge (conventional current) along the active loop
  const path=p.sw==='charge'?PCH:PDIS,spd=RM?0:60*Math.log10(1+I*20);v.off=(v.off+spd*vdt)%26;
  if(I>1e-4){ctx.fillStyle=PAL['s4'];for(let s=v.off;s<path.L;s+=26){const q=path.at(s);if(Math.abs(q[0]-CAP.x)<2&&q[1]>CAP.top-2&&q[1]<CAP.bot+2)continue;if(Math.abs(q[0]-BAT.x)<2&&q[1]>BAT.top&&q[1]<BAT.bot)continue;
    if(Math.abs(q[1]-TOP)<2&&q[0]>SWA[0]&&q[0]<SWP[0])continue;if(q[0]>BUL-22&&q[0]<BUL+22&&Math.abs(q[1]-TOP)<2)continue;ctx.beginPath();ctx.arc(q[0],q[1],4.5,0,6.29);ctx.fill();}}
  if(held(sim))pill(ctx,'Paused for the result: '+sim.st.hold.toFixed(2)+' τ after the switch',400,TOP+60,PAL['s3'],'#fff',13*k);
  txt(ctx,'Dots show conventional current: '+(I>1e-4?I.toFixed(3)+' mA':'none'),400,436,{s:13*k,c:PAL['cv-soft'],a:'center'});
  // equation panel
  if(hon){const T=tau(p);rr(ctx,12,8,400,ap?78:36,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
    txt(ctx,'τ = RC = ('+p.R+' kΩ)('+p.C+' μF) = '+T.toFixed(2)+' s',24,32,{s:14*k,w:700});
    if(ap){txt(ctx,p.sw==='charge'?'Loop rule:  V₀ − R·dq/dt − q/C = 0':'Loop rule:  −R·dq/dt − q/C = 0',24,55,{s:13*k,c:PAL['cv-soft']});
      txt(ctx,p.sw==='charge'?'V_C = V₀(1 − e^(−t/RC)),   I = (V₀/R)e^(−t/RC)':'V_C = V₀e^(−t/RC),   I = (V₀/R)e^(−t/RC)',24,75,{s:13*k,c:PAL['cv-soft']});}}
}
CAPD.controls[0].onChange=syncMode;
CAPD.onLevel=syncMode;
BioLab.register(CAPD);
})();
