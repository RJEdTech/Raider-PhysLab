(function(){
'use strict';
const {clamp,lerp,rr,txt,pill,atLeast,PAL,FONT,RM,axes,bars,legend,serColor,lvText}=BioLab.h;

/* Circuit builder. Each template is a netlist of branches between nodes; each branch is a series string of parts
   (bulbs, switches, wire, meters). The circuit is solved exactly with modified nodal analysis (MNA):
   node voltages + the battery current from G·v = i. The battery has a small internal resistance (0.1 Ω),
   wires 0.001 Ω, an ammeter 0.01 Ω and a voltmeter 10 MΩ, so meter mistakes behave like real ones. */
const RWIRE=0.001,RINT=0.1,RAMM=0.01,RVM=1e7,ROPEN=1e9;
const BAT_X=120,TOP=118,BOT=342;
// Template geometry: nodes, branches (from, to, polyline, parts).
const T={
  single:{name:'One bulb',nodes:{n0:[BAT_X,BOT],n1:[BAT_X,TOP]},
    br:[{id:'b1',from:'n1',to:'n0',pts:[[BAT_X,TOP],[560,TOP],[560,BOT],[BAT_X,BOT]],parts:[{t:'bulb',n:'B1',at:[560,230],o:'v'}]}]},
  series2:{name:'Two bulbs in series',nodes:{n0:[BAT_X,BOT],n1:[BAT_X,TOP],n2:[560,230]},
    br:[{id:'b1',from:'n1',to:'n2',pts:[[BAT_X,TOP],[560,TOP],[560,230]],parts:[{t:'bulb',n:'B1',at:[340,TOP],o:'h'}]},
        {id:'b2',from:'n2',to:'n0',pts:[[560,230],[560,BOT],[BAT_X,BOT]],parts:[{t:'bulb',n:'B2',at:[340,BOT],o:'h'}]}]},
  parallel2:{name:'Two bulbs in parallel',nodes:{n0:[BAT_X,BOT],n1:[BAT_X,TOP],j1:[400,TOP],j2:[400,BOT]},
    br:[{id:'wt',from:'n1',to:'j1',pts:[[BAT_X,TOP],[400,TOP]],parts:[]},
        {id:'b1',from:'j1',to:'j2',pts:[[400,TOP],[400,BOT]],parts:[{t:'bulb',n:'B1',at:[400,230],o:'v'}]},
        {id:'b2',from:'j1',to:'j2',pts:[[400,TOP],[640,TOP],[640,BOT],[400,BOT]],parts:[{t:'bulb',n:'B2',at:[640,230],o:'v'}]},
        {id:'wb',from:'j2',to:'n0',pts:[[400,BOT],[BAT_X,BOT]],parts:[]}]},
  combo:{name:'Series + parallel',nodes:{n0:[BAT_X,BOT],n1:[BAT_X,TOP],j1:[430,TOP],j2:[430,BOT]},
    br:[{id:'b1',from:'n1',to:'j1',pts:[[BAT_X,TOP],[430,TOP]],parts:[{t:'bulb',n:'B1',at:[280,TOP],o:'h'}]},
        {id:'b2',from:'j1',to:'j2',pts:[[430,TOP],[430,BOT]],parts:[{t:'bulb',n:'B2',at:[430,230],o:'v'}]},
        {id:'b3',from:'j1',to:'j2',pts:[[430,TOP],[660,TOP],[660,BOT],[430,BOT]],parts:[{t:'bulb',n:'B3',at:[660,230],o:'v'}]},
        {id:'wb',from:'j2',to:'n0',pts:[[430,BOT],[BAT_X,BOT]],parts:[]}]},
  switches:{name:'Switches',nodes:{n0:[BAT_X,BOT],n1:[BAT_X,TOP],j1:[400,TOP],j2:[400,BOT]},
    br:[{id:'s1',from:'n1',to:'j1',pts:[[BAT_X,TOP],[400,TOP]],parts:[{t:'switch',n:'S1',at:[260,TOP],o:'h'}]},
        {id:'b1',from:'j1',to:'j2',pts:[[400,TOP],[400,BOT]],parts:[{t:'bulb',n:'B1',at:[400,230],o:'v'}]},
        {id:'b2',from:'j1',to:'j2',pts:[[400,TOP],[640,TOP],[640,BOT],[400,BOT]],parts:[{t:'switch',n:'S2',at:[520,TOP],o:'h'},{t:'bulb',n:'B2',at:[640,230],o:'v'}]},
        {id:'wb',from:'j2',to:'n0',pts:[[400,BOT],[BAT_X,BOT]],parts:[]}]},
  short:{name:'Short circuit',nodes:{n0:[BAT_X,BOT],n1:[BAT_X,TOP],j1:[400,TOP],j2:[400,BOT]},
    br:[{id:'wt',from:'n1',to:'j1',pts:[[BAT_X,TOP],[400,TOP]],parts:[]},
        {id:'b1',from:'j1',to:'j2',pts:[[400,TOP],[400,BOT]],parts:[{t:'bulb',n:'B1',at:[400,230],o:'v'}]},
        {id:'sw',from:'j1',to:'j2',pts:[[400,TOP],[640,TOP],[640,BOT],[400,BOT]],parts:[{t:'switch',n:'S1',at:[640,230],o:'v'}]},
        {id:'wb',from:'j2',to:'n0',pts:[[400,BOT],[BAT_X,BOT]],parts:[]}]}
};
const BULBS=['B1','B2','B3'];
function bulbBranch(tp,n){return tp.br.find(b=>b.parts.some(p=>p.t==='bulb'&&p.n===n));}

/* Build the netlist for the current settings (template + switches + meters), then solve it. */
function solve(p){
  const tp=T[p.circuit]||T.single;
  const nodes=Object.keys(tp.nodes),idx={};nodes.forEach((n,i)=>idx[n]=i);
  const extra={},branches=[];const NB=nodes.length;let nodeCount=NB;const bNode=nodeCount++; // internal battery node (after the EMF, before r)
  const Rof={B1:p.r1,B2:p.r2,B3:p.r3};
  for(const b of tp.br){let R=0;const parts=b.parts.map(x=>x);
    for(const x of parts){if(x.t==='bulb')R+=Rof[x.n];else if(x.t==='switch'){const on=x.n==='S1'?p.s1:p.s2;R+=on?RWIRE:ROPEN;}}
    R+=RWIRE*Math.max(1,b.pts.length-1);
    if(p.am==='A_'+b.id)R+=RAMM;
    branches.push({id:b.id,a:idx[b.from],b:idx[b.to],R,src:b});}
  // battery: EMF between n0 and bNode, internal r from bNode to n1; a voltmeter wired in series sits in this line.
  const batR=RINT+(p.vm==='series'?RVM:0)+(p.am==='A_main'?RAMM:0);
  branches.push({id:'bat',a:bNode,b:idx.n1,R:batR,src:null});
  // meters wired across things
  let vm=null,am=null;
  if(p.vm&&p.vm!=='none'&&p.vm!=='series'){let a,b;
    if(p.vm==='V_bat'){a=idx.n1;b=idx.n0;}else{const br=bulbBranch(tp,p.vm.slice(2));if(br){a=idx[br.from];b=idx[br.to];}}
    if(a!==undefined){branches.push({id:'vm',a,b,R:RVM,src:null});vm={a,b};}}
  if(p.am==='A_acrossB1'){const br=bulbBranch(tp,'B1');branches.push({id:'amx',a:idx[br.from],b:idx[br.to],R:RAMM,src:null});}
  // MNA: unknowns v1..v(N-1) (node 0 is ground) and battery current Is
  const N=nodeCount,M=N-1+1,G=[];for(let i=0;i<M;i++)G.push(new Float64Array(M+1));
  const at=(i,j,v)=>{if(i>0&&j>0)G[i-1][j-1]+=v;};
  for(const br of branches){const g=1/br.R;at(br.a,br.a,g);at(br.b,br.b,g);at(br.a,br.b,-g);at(br.b,br.a,-g);}
  // source: v(bNode) − v(0) = V; current Is flows out of bNode into the circuit
  const k=M-1;G[bNode-1][k]+=1;G[k][bNode-1]+=1;G[k][M]=p.volts;
  // Gaussian elimination
  for(let c=0;c<M;c++){let piv=c;for(let r=c+1;r<M;r++)if(Math.abs(G[r][c])>Math.abs(G[piv][c]))piv=r;
    if(Math.abs(G[piv][c])<1e-18)continue;[G[c],G[piv]]=[G[piv],G[c]];
    for(let r=0;r<M;r++){if(r===c)continue;const f=G[r][c]/G[c][c];if(f===0)continue;for(let q=c;q<=M;q++)G[r][q]-=f*G[c][q];}}
  const v=new Float64Array(N);for(let i=1;i<N;i++){const d=G[i-1][i-1];v[i]=Math.abs(d)<1e-18?0:G[i-1][M]/d;}
  const cur={};for(const br of branches)cur[br.id]=(v[br.a]-v[br.b])/br.R;
  const Ibat=cur.bat;const term=v[idx.n1]-v[idx.n0];
  const el={};
  for(const n of BULBS){const br=bulbBranch(tp,n);if(!br)continue;const I=cur[br.id];el[n]={R:Rof[n],I:Math.abs(I),V:Math.abs(I)*Rof[n],P:I*I*Rof[n],branch:br.id};}
  const Itot=Math.abs(Ibat);const Req=Itot>1e-9?Math.max(0,term)/Itot:Infinity;
  let vmRead=NaN,amRead=NaN;
  if(p.vm==='series')vmRead=Math.abs(Ibat)*RVM;else if(vm)vmRead=Math.abs(v[vm.a]-v[vm.b]);
  if(p.am==='A_main')amRead=Itot;else if(p.am==='A_acrossB1')amRead=Math.abs(cur.amx);else if(p.am&&p.am.startsWith('A_')&&cur[p.am.slice(2)]!==undefined)amRead=Math.abs(cur[p.am.slice(2)]);
  return {tp,idx,v,cur,Ibat,Itot,term,Req,el,vmRead,amRead,maxWireI:Math.max(...Object.values(cur).map(Math.abs))};
}
const PREF=10*Math.pow(9/(10+RINT+0.003),2); // power of one 10 Ω bulb on a 9 V battery = "100% brightness"
const fmtA=a=>!Number.isFinite(a)?'—':a>=10?a.toFixed(0)+' A':a>=1?a.toFixed(2)+' A':a>=0.001?(a*1000).toFixed(0)+' mA':'0 A';
const fmtV=x=>!Number.isFinite(x)?'—':x.toFixed(2)+' V';

const AMOPT=[{v:'none',l:'No ammeter'},{v:'A_main',l:'In the main line (by the battery)'},{v:'A_b1',l:'In series with B1'},{v:'A_b2',l:'In series with B2'},{v:'A_b3',l:'In series with B3'},{v:'A_acrossB1',l:'Across B1 (wrong way!)',lvl:'honors'}];
const VMOPT=[{v:'none',l:'No voltmeter'},{v:'V_bat',l:'Across the battery'},{v:'V_B1',l:'Across B1'},{v:'V_B2',l:'Across B2'},{v:'V_B3',l:'Across B3'},{v:'series',l:'In series (wrong way!)',lvl:'honors'}];

const CIRCUIT={
  id:'circuit',hash:'circuit',apUnit:11,order:1,tab:'Circuit builder',kind:'Virtual lab',next:['capacitor'],
  card:'Light bulbs in series and parallel, place real meters, and watch the electrons. Then short it out.',
  title:'Circuit builder: series, parallel and Ohm’s law',
  lede:{bio:'A battery pushes electrons around a closed loop, and bulbs turn that energy into light. Compare bulbs in series and in parallel and see which glow brighter.',
        honors:'Measure voltage, current and resistance with real meters, and use Ohm’s law (V = IR) and power (P = IV) to explain every brightness you see.',
        ap:'Solve any circuit exactly. Check Kirchhoff’s junction and loop rules, find equivalent resistance, and see how meter resistance and internal resistance change the readings.'},
  scale:'A tabletop circuit: a 9 V battery, flashlight bulbs of about 10 Ω, and wires. Electrons really drift at well under 1 mm/s; here they move fast enough to see.',
  timeScale:1,dtMax:0.05,prewarm:0,sampleDt:0.1,window:20,unit:'s',chChange:3,chReveal:7,
  controls:[
    {id:'circuit',label:'Circuit',type:'select',def:'single',lvl:'bio',options:Object.keys(T).map(k=>({v:k,l:T[k].name})),onChange(sim){sim.infoDirty=true;}},
    {id:'volts',label:'Battery voltage',type:'range',min:0,max:24,step:0.5,def:9,unit:' V',lvl:'bio'},
    {id:'s1',label:'Switch S1 closed',type:'toggle',def:true,lvl:'bio',help:'Used by the Switches and Short circuit layouts'},
    {id:'s2',label:'Switch S2 closed',type:'toggle',def:true,lvl:'bio',help:'Used by the Switches layout'},
    {id:'r1',label:'Bulb B1 resistance',type:'range',min:1,max:100,step:1,def:10,unit:' Ω',lvl:'honors'},
    {id:'r2',label:'Bulb B2 resistance',type:'range',min:1,max:100,step:1,def:10,unit:' Ω',lvl:'honors'},
    {id:'r3',label:'Bulb B3 resistance',type:'range',min:1,max:100,step:1,def:10,unit:' Ω',lvl:'honors'},
    {id:'am',label:'Ammeter',type:'select',def:'none',lvl:'bio',options:AMOPT,help:'An ammeter measures current. It belongs in series, in the path of the current.'},
    {id:'vm',label:'Voltmeter',type:'select',def:'none',lvl:'bio',options:VMOPT,help:'A voltmeter measures the voltage difference across a part. It belongs in parallel, across that part.'}
  ],
  init(sim){return {sol:solve(sim.p),it:0};},
  step(sim,dt){const s=sim.st;s.sol=solve(sim.p);s.it+=dt;if(s.it>0.25){s.it=0;sim.infoDirty=true;}},
  metrics:[
    {id:'itot',label:'Current from the battery',unit:'A',lvl:'bio',min:0,max:2,d:3,get:s=>s.st.sol.Itot},
    {id:'b1',label:'B1 brightness',unit:'%',lvl:'bio',min:0,max:100,d:0,get:s=>{const e=s.st.sol.el.B1;return e?100*e.P/PREF:NaN;}},
    {id:'b2',label:'B2 brightness',unit:'%',lvl:'bio',min:0,max:100,d:0,get:s=>{const e=s.st.sol.el.B2;return e?100*e.P/PREF:NaN;}},
    {id:'amr',label:'Ammeter reads',unit:'A',lvl:'bio',min:0,max:2,d:3,get:s=>s.st.sol.amRead},
    {id:'vmr',label:'Voltmeter reads',unit:'V',lvl:'bio',min:0,max:24,d:2,get:s=>s.st.sol.vmRead},
    {id:'req',label:'Equivalent resistance',unit:'Ω',lvl:'honors',min:0,max:40,d:2,get:s=>{const r=s.st.sol.Req;return Number.isFinite(r)&&r<1e6?r:NaN;}},
    {id:'ptot',label:'Total power used',unit:'W',lvl:'ap',min:0,max:30,d:2,get:s=>s.st.sol.Itot*Math.max(0,s.st.sol.term)},
    {id:'vterm',label:'Battery terminal voltage',unit:'V',lvl:'ap',min:0,max:24,d:2,get:s=>s.st.sol.term}
  ],
  graphs:[{id:'bars',label:'Voltage and current for each bulb',custom:true},{id:'itot',label:'Current from the battery',lines:['itot']}],
  defaultGraph:'bars',
  plot(sim,ctx,box,id){const s=sim.st.sol,names=BULBS.filter(n=>s.el[n]);
    if(!names.length){txt(ctx,'No bulbs in this circuit.',box.cw/2,box.ch/2,{s:15,c:PAL.muted,a:'center',b:'middle'});return;}
    const vmax=Math.max(sim.p.volts,0.5),imax=Math.max(0.1,...names.map(n=>s.el[n].I));
    const ax=axes(ctx,box,{xmin:0,xmax:names.length,ymin:0,ymax:125,xcats:names,yl:'percent of maximum',yd:0});
    const w=0.32;names.forEach((n,i)=>{const e=s.el[n],vp=100*e.V/vmax,ip=100*e.I/imax;
      ctx.fillStyle=serColor(1);ctx.fillRect(ax.X(i+0.5-w),ax.Y(Math.min(100,vp)),ax.X(i+0.5)-ax.X(i+0.5-w)-2,ax.Y(0)-ax.Y(Math.min(100,vp)));
      ctx.fillStyle=serColor(2);ctx.fillRect(ax.X(i+0.5)+2,ax.Y(Math.min(100,ip)),ax.X(i+0.5+w)-ax.X(i+0.5)-2,ax.Y(0)-ax.Y(Math.min(100,ip)));
      txt(ctx,e.V.toFixed(2)+' V',ax.X(i+0.5-w/2),ax.Y(Math.min(100,vp))-5,{s:12,c:PAL['cv-ink'],a:'center',w:600});
      txt(ctx,fmtA(e.I),ax.X(i+0.5+w/2),ax.Y(Math.min(100,ip))-5,{s:12,c:PAL['cv-ink'],a:'center',w:600});});
    legend(ctx,box.L+10,box.T+8,[{label:'Voltage across it',color:serColor(1)},{label:'Current through it',color:serColor(2)}]);},
  infoPanel(sim){const s=sim.st.sol,hon=atLeast('honors'),ap=atLeast('ap');
    const rows=BULBS.filter(n=>s.el[n]).map(n=>{const e=s.el[n];return hon?`<tr><td>${n}</td><td>${e.R.toFixed(0)}</td><td>${e.V.toFixed(2)}</td><td>${e.I.toFixed(3)}</td><td>${e.P.toFixed(2)}</td><td>${Math.round(100*e.P/PREF)}%</td></tr>`:`<tr><td>${n}</td><td>${e.V.toFixed(1)} V</td><td>${fmtA(e.I)}</td><td>${Math.round(100*e.P/PREF)}%</td></tr>`;}).join('');
    let h=`<h3>Every part, measured</h3><div class="tbl-wrap"><table><thead><tr>${hon?'<th>Bulb</th><th>R (Ω)</th><th>V (V)</th><th>I (A)</th><th>P (W)</th><th>Brightness</th>':'<th>Bulb</th><th>Voltage</th><th>Current</th><th>Brightness</th>'}</tr></thead><tbody>${rows}</tbody></table></div>`;
    if(hon){const k=kirchhoff(sim);if(k)h+=`<p style="margin-top:8px"><b>Junction rule:</b> ${k.j}</p><p><b>Loop rule:</b> ${k.l}</p>`;}
    if(ap)h+=`<p class="help">Battery: EMF ${sim.p.volts.toFixed(1)} V, internal resistance ${RINT} Ω, terminal voltage ${s.term.toFixed(2)} V. Equivalent resistance of the bulbs: ${Number.isFinite(s.Req)&&s.Req<1e6?s.Req.toFixed(2)+' Ω':'open circuit'}.</p>`;
    return h;},
  narrate(sim){const s=sim.st.sol,p=sim.p,hon=atLeast('honors'),c=p.circuit;
    if(p.vm==='series')return '<b>The voltmeter is wired in series.</b> Its huge resistance (10 MΩ) blocks the current, so the bulbs go dark, yet it reads almost the full battery voltage: '+s.vmRead.toFixed(2)+' V.';
    if(p.am==='A_acrossB1')return '<b>The ammeter is wired across B1.</b> Its tiny resistance gives the current an easy detour, so B1 goes out and the ammeter takes '+fmtA(s.amRead)+'. That can blow a real meter’s fuse.';
    if(s.Itot>5)return '<b>Short circuit!</b> The current takes the wire path with almost no resistance: '+fmtA(s.Itot)+' flows, the wires heat up, the bulb goes dark and the battery drains fast.';
    if(p.volts<=0)return 'The battery is set to 0 V, so nothing pushes the electrons. No current flows.';
    if(s.Itot<1e-4)return '<b>The circuit is open.</b> There is a gap in the loop, so no current flows anywhere and every bulb is dark.';
    const n=Object.keys(s.el).filter(k=>s.el[k].P>0.01).length;
    if(c==='series2')return 'In series there is only one path. The same '+fmtA(s.Itot)+' flows through both bulbs, and they share the battery’s '+p.volts+' V'+(hon?' ('+s.el.B1.V.toFixed(1)+' V + '+s.el.B2.V.toFixed(1)+' V)':'')+', so each is dimmer than a bulb on its own.';
    if(c==='parallel2'||c==='switches'&&p.s2)return 'In parallel each bulb has its own path straight across the battery, so each gets the full voltage and glows brightly. The battery supplies the total: '+fmtA(s.Itot)+'.';
    if(c==='combo')return 'B1 carries all the current, then it splits between B2 and B3. That is why B1 is the brightest'+(hon?': '+fmtA(s.el.B1.I)+' through B1, '+fmtA(s.el.B2.I)+' through each of the others.':'.');
    return 'Electrons flow from the battery’s negative end, through '+(n===1?'the bulb':'the bulbs')+' and back to the positive end. Current: '+fmtA(s.Itot)+'.';},
  tour:[
    {title:'The battery',text:'The battery pushes charge around the circuit. Its voltage is how hard it pushes: here, 9 volts. The long plate is the positive (+) end.',focus:[70,170,100,130],pause:true},
    {title:'A closed loop',text:'Current only flows if there is a complete loop from one end of the battery, through the bulb, and back to the other end.',focus:[95,95,490,270],speed:0.5},
    {title:'Watch the electrons',text:'The blue dots are electrons. They leave the negative end, travel through the bulb and return to the positive end. Engineers draw “conventional current” the opposite way, from + to −.',focus:[95,95,490,270],speed:0.25},
    {title:'The bulb uses the energy',text:'As electrons pass through the thin filament they lose energy, which comes out as light and heat. More power means a brighter bulb.',focus:[515,175,90,110],speed:0.5},
    {title:'Measuring current',text:'An <b>ammeter</b> goes <b>in series</b>, in the path of the current, so all the current passes through it.',focus:[95,95,490,270],pause:true,setup(sim){BioLab.setValues(sim,{am:'A_main'});}},
    {title:'Measuring voltage',text:'A <b>voltmeter</b> goes <b>across</b> a part, in parallel, to compare the push on either side of it.',focus:[95,95,600,270],pause:true,setup(sim){BioLab.setValues(sim,{vm:'V_B1'});}},
    {title:'Series vs. parallel',text:'Now two bulbs in parallel. Each has its own path across the battery, so both glow as brightly as one bulb alone, and the battery works twice as hard.',focus:[95,95,600,270],speed:0.5,setup(sim){BioLab.setValues(sim,{circuit:'parallel2',am:'A_main',vm:'none'});}},
    {lvl:'honors',title:'Kirchhoff’s junction rule',text:'At the junction J1 the current splits. Whatever flows in must flow out: I(in) = I(B1) + I(B2). Check it in the table below the graph.',focus:[350,80,100,80],pause:true}
  ],
  onTourExit(sim){BioLab.setValues(sim,{circuit:'single',am:'none',vm:'none'});},
  challenges:[
    {lvl:'bio',q:'One bulb is glowing. You add a second, identical bulb in series. What happens?',choices:['Both bulbs glow as brightly as the single bulb did','Both bulbs are dimmer than the single bulb was','One bulb is bright and the other is dark'],correct:1,
     baseline:{circuit:'single'},change:{circuit:'series2'},changeText:'Second bulb added in series',watch:'b1',
     explain:{bio:'In series the two bulbs share the battery’s push and the same, smaller current flows through both. Each gets half the voltage and half the current, so each makes only a quarter of the light.',honors:'R doubles to 20 Ω, so I halves (0.45 A) and each bulb has 4.5 V. P = IV = 2.0 W per bulb, a quarter of the 8.1 W one bulb used.'}},
    {lvl:'bio',q:'One bulb is glowing. You add a second, identical bulb in parallel. What happens?',choices:['Both bulbs stay as bright, and the battery supplies twice the current','Both bulbs get dimmer','The current from the battery stays the same'],correct:0,
     baseline:{circuit:'single'},change:{circuit:'parallel2'},changeText:'Second bulb added in parallel',watch:'itot',
     explain:{bio:'Each bulb in parallel gets its own path straight across the battery, so each gets the full 9 V and glows fully. The battery has to supply current for both, so the total current doubles and the battery runs down faster.'}},
    {lvl:'bio',q:'In the Switches circuit, S1 sits in the main line next to the battery. What happens when you open S1?',choices:['Only B1 goes out','Only B2 goes out','Both bulbs go out'],correct:2,
     baseline:{circuit:'switches'},change:{s1:false},changeText:'Switch S1 opened',watch:'itot',
     explain:{bio:'Every path back to the battery runs through S1. Opening it breaks the whole loop, so no current flows anywhere and both bulbs go dark.'}},
    {lvl:'honors',q:'A student wires the voltmeter in series with one bulb. What will they see?',choices:['The bulb glows normally and the meter reads 0 V','The bulb goes dark and the meter reads almost the full battery voltage','The meter reads the bulb’s normal voltage'],correct:1,
     baseline:{circuit:'single',vm:'none'},change:{vm:'series'},changeText:'Voltmeter placed in series',watch:'itot',
     explain:{honors:'A voltmeter has an enormous resistance (10 MΩ here). In series it blocks the current, so the bulb goes out. Almost all of the battery’s voltage now appears across the meter itself, so it reads about 9 V.'}},
    {lvl:'honors',q:'Two bulbs are in series. A student puts the ammeter across B1 instead of in series. What happens?',choices:['B1 goes out, B2 gets brighter, and the ammeter carries a large current','Nothing changes; the ammeter just reads B1’s current','Both bulbs go out'],correct:0,
     baseline:{circuit:'series2',am:'none'},change:{am:'A_acrossB1'},changeText:'Ammeter placed across B1',watch:'b2',
     explain:{honors:'An ammeter has almost no resistance (0.01 Ω). Across B1 it creates a shortcut, so current bypasses B1 (which goes dark) and B2 now gets the whole 9 V. The meter carries the full current, which can blow its fuse.'}},
    {lvl:'honors',q:'A 10 Ω and a 40 Ω resistor are connected in parallel. What is their equivalent resistance?',choices:['50 Ω','25 Ω','8 Ω','40 Ω'],correct:2,instant:true,
     explain:{honors:'1/R = 1/10 + 1/40 = 5/40, so R = 8 Ω. Parallel paths always give an equivalent resistance smaller than the smallest single resistor, because each path adds another way through.'}},
    {lvl:'ap',q:'In the Series + parallel circuit (9 V, all bulbs 10 Ω), what current flows through B2?',choices:['0.90 A','0.60 A','0.30 A','0.45 A'],correct:2,instant:true,
     explain:{ap:'B2 ∥ B3 = 5 Ω, plus B1 gives 15 Ω, so I = 9/15 = 0.60 A from the battery (a little less with the 0.1 Ω internal resistance). That current splits equally at the junction: 0.30 A through B2. Junction rule: 0.60 = 0.30 + 0.30.'}},
    {lvl:'ap',q:'You close S1 in the Short circuit layout. What happens to the battery’s terminal voltage?',choices:['It stays at 9 V','It drops close to 0 V because of the internal resistance','It rises above 9 V'],correct:1,
     baseline:{circuit:'short',s1:false},change:{s1:true},changeText:'S1 closed: short circuit',watch:'itot',
     explain:{ap:'With almost no external resistance, I ≈ EMF/(r + R_wire) ≈ 9/0.1 ≈ 90 A. Almost all 9 V is lost inside the battery (Ir), so the terminal voltage falls to nearly 0 V, the bulb goes out and the wires and battery heat up.'}}
  ],
  lab:{bio:'<p><b>Question:</b> Which arrangement makes bulbs brighter: series or parallel?</p><ol><li>Record a trial with One bulb.</li><li>Record Two bulbs in series, then Two bulbs in parallel.</li><li>Compare B1 brightness and the current from the battery.</li></ol><p>Explain which arrangement your house lights use, and why.</p>',
       honors:'<p><b>Question:</b> Does Ohm’s law hold for every bulb?</p><ol><li>Use One bulb. Record V and I for battery voltages of 3, 6, 9, 12 and 15 V.</li><li>Plot V (x) against current (y) on the Trials graph.</li><li>Repeat with B1 = 20 Ω.</li></ol><p>Find the resistance from the slope and compare with the setting.</p>',
       ap:'<p><b>Question:</b> How do internal resistance and meters change what you measure?</p><ol><li>Measure the terminal voltage for One bulb with B1 = 1, 5, 10, 50 and 100 Ω.</li><li>Plot terminal voltage against current.</li></ol><p><b>Claim–evidence–reasoning:</b> Use the y-intercept and slope to find the EMF and internal resistance, and explain why ideal meters have zero or infinite resistance.</p>'},
  terms:[{t:'Current (I)',d:'The flow of charge, measured in amperes (A).'},{t:'Voltage (V)',d:'The push that moves charge, measured in volts (V).'},{t:'Resistance (R)',d:'How much a part opposes current, measured in ohms (Ω).'},{t:'Series',d:'One path: the same current goes through every part.'},{t:'Parallel',d:'Several paths: each branch gets the same voltage.'},{t:'Short circuit',d:'A path with almost no resistance, which lets a dangerous current flow.'},
    {lvl:'honors',t:'Ohm’s law',d:'V = IR.'},{lvl:'honors',t:'Power',d:'P = IV = I²R: the energy used per second, in watts.'},{lvl:'honors',t:'Ammeter / voltmeter',d:'An ammeter is wired in series; a voltmeter is wired in parallel.'},
    {lvl:'ap',t:'Kirchhoff’s junction rule',d:'The current into a junction equals the current out (charge is conserved).'},{lvl:'ap',t:'Kirchhoff’s loop rule',d:'The voltage gains and drops around any closed loop add to zero (energy is conserved).'},{lvl:'ap',t:'Internal resistance',d:'The battery’s own resistance, r. Terminal voltage = EMF − Ir.'}],
  about:'<p>The circuit is solved exactly with modified nodal analysis every frame, so any combination of settings gives the correct voltages and currents.</p><p>Simplifications: bulbs are treated as ohmic resistors (real filaments increase resistance as they heat up). Brightness is shown as power compared with one 10 Ω bulb on 9 V. The battery has a fixed EMF and a 0.1 Ω internal resistance. Wires are 0.001 Ω per segment, the ammeter 0.01 Ω and the voltmeter 10 MΩ. Electron drift is drawn about a million times faster than real.</p>',
  initVis(sim){sim.vis.ph={};},
  draw(sim,ctx,vdt,k,t){const s=sim.st.sol,p=sim.p,tp=s.tp,vis=sim.vis,hon=atLeast('honors');
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    // table top grid
    ctx.strokeStyle=PAL['cv-bg2'];ctx.lineWidth=1;for(let x=0;x<800;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,450);ctx.stroke();}for(let y=0;y<450;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(800,y);ctx.stroke();}
    const hot=clamp((s.Itot-3)/40,0,1);
    const wireCol=hot>0.05?`rgba(${Math.round(lerp(200,255,hot))},${Math.round(lerp(120,60,hot))},40,1)`:PAL['cv-soft'];
    const allBr=tp.br.concat([{id:'bat',pts:[[BAT_X,BOT],[BAT_X,TOP]],parts:[]}]);
    // wires
    ctx.lineCap='round';ctx.lineJoin='round';
    for(const b of tp.br){ctx.strokeStyle=wireCol;ctx.lineWidth=hot>0.05?6:5;ctx.beginPath();b.pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();}
    ctx.strokeStyle=wireCol;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(BAT_X,BOT);ctx.lineTo(BAT_X,TOP);ctx.stroke();
    if(hot>0.05&&!RM){ctx.strokeStyle=`rgba(255,120,40,${0.25*hot})`;ctx.lineWidth=14;for(const b of tp.br){ctx.beginPath();b.pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();}}
    // electrons (flow opposite conventional current)
    for(const b of allBr){const I=b.id==='bat'?s.Ibat:(s.cur[b.id]||0);const L=pathLen(b.pts);if(L<1)continue;
      const sp=Math.min(320,Math.abs(I)*130);vis.ph[b.id]=((vis.ph[b.id]||0)+sp*vdt)%30;if(Math.abs(I)<1e-4)continue;
      const dir=I>0?-1:1;ctx.fillStyle=PAL['s2'];
      for(let d=vis.ph[b.id];d<L;d+=30){const pos=dir>0?d:L-d;const q=pointAt(b.pts,pos);
        if(nearPart(b,q))continue;ctx.beginPath();ctx.arc(q[0],q[1],4.2,0,6.29);ctx.fill();}}
    // battery
    drawBattery(ctx,k,p.volts);
    // parts
    for(const b of tp.br)for(const part of b.parts){if(part.t==='bulb'){const e=s.el[part.n];drawBulb(ctx,part,e?e.P/PREF:0,k,e,hon,p);}else drawSwitch(ctx,part,part.n==='S1'?p.s1:p.s2,k);}
    // junction dots
    for(const n of Object.keys(tp.nodes)){if(n.startsWith('j')){const q=tp.nodes[n];ctx.fillStyle=PAL['cv-ink'];ctx.beginPath();ctx.arc(q[0],q[1],5,0,6.29);ctx.fill();if(hon)txt(ctx,n==='j1'?'J1':'J2',q[0]+8,q[1]+(n==='j1'?-8:18),{s:12*k,w:700,c:PAL['cv-soft']});}}
    // meters
    drawMeters(ctx,sim,s,k);
    // header
    txt(ctx,tp.name,16,26,{s:15*k,w:700});
    txt(ctx,'Current from battery: '+fmtA(s.Itot),16,46,{s:12.5*k,c:PAL['cv-soft']});
    if(s.Itot>5)pill(ctx,'SHORT CIRCUIT: wires heating',600,30,'#c62828','#fff',12*k);
    ctx.fillStyle=PAL['s2'];ctx.beginPath();ctx.arc(26,432,4,0,6.29);ctx.fill();txt(ctx,'electron (moves − → +)',36,436,{s:12*k,c:PAL['cv-soft']});
  }
};
function pathLen(pts){let L=0;for(let i=1;i<pts.length;i++)L+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);return L;}
function pointAt(pts,d){for(let i=1;i<pts.length;i++){const l=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);if(d<=l){const f=l?d/l:0;return [lerp(pts[i-1][0],pts[i][0],f),lerp(pts[i-1][1],pts[i][1],f)];}d-=l;}const e=pts[pts.length-1];return [e[0],e[1]];}
function nearPart(b,q){if(b.id==='bat')return Math.abs(q[1]-230)<34;return b.parts.some(p=>Math.abs(q[0]-p.at[0])<(p.o==='h'?30:12)&&Math.abs(q[1]-p.at[1])<(p.o==='v'?30:12));}
function drawBattery(ctx,k,V){const x=BAT_X,y=230;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(x-30,y-30,60,60);
  ctx.fillStyle=PAL['cv-ink'];ctx.fillRect(x-26,y-12,52,5);ctx.fillRect(x-14,y+6,28,8);
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x,TOP+12);ctx.lineTo(x,y-12);ctx.moveTo(x,y+14);ctx.lineTo(x,BOT-12);ctx.stroke();
  txt(ctx,'+',x+34,y-6,{s:18*k,w:800,c:PAL['s1']});txt(ctx,'−',x+34,y+18,{s:18*k,w:800,c:PAL['s2']});
  txt(ctx,V.toFixed(1)+' V',x-38,y+5,{s:13*k,w:700,a:'right'});}
function drawBulb(ctx,part,b,k,e,hon,p){const [x,y]=part.at,gl=clamp(b,0,1.6);
  if(gl>0.01){const g=ctx.createRadialGradient(x,y,4,x,y,26+40*Math.min(1,gl));g.addColorStop(0,`rgba(255,226,120,${0.75*Math.min(1,gl)})`);g.addColorStop(1,'rgba(255,226,120,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,26+40*Math.min(1,gl),0,6.29);ctx.fill();}
  ctx.fillStyle=gl>0.01?`rgba(255,240,180,${0.35+0.5*Math.min(1,gl)})`:PAL['card'];ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,18,0,6.29);ctx.fill();ctx.stroke();
  ctx.strokeStyle=gl>0.01?'#c77700':PAL['cv-soft'];ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(x-9,y+6);for(let i=0;i<6;i++)ctx.lineTo(x-7+i*3,y+(i%2?-6:2));ctx.lineTo(x+9,y+6);ctx.stroke();
  const lx=part.o==='v'?x+26:x,ly=part.o==='v'?y+4:y-28;
  txt(ctx,part.n,lx,ly,{s:13*k,w:700,a:part.o==='v'?'left':'center'});
  if(e)txt(ctx,hon?e.R.toFixed(0)+' Ω':Math.round(100*e.P/PREF)+'%',lx,ly+15*k,{s:11.5*k,c:PAL['cv-soft'],a:part.o==='v'?'left':'center'});}
function drawSwitch(ctx,part,on,k){const [x,y]=part.at;ctx.fillStyle=PAL['cv-bg'];if(part.o==='h')ctx.fillRect(x-24,y-14,48,28);else ctx.fillRect(x-14,y-24,28,48);
  ctx.fillStyle=PAL['cv-ink'];const a=part.o==='h'?[[x-20,y],[x+20,y]]:[[x,y-20],[x,y+20]];a.forEach(q=>{ctx.beginPath();ctx.arc(q[0],q[1],4,0,6.29);ctx.fill();});
  ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a[0][0],a[0][1]);
  if(on)ctx.lineTo(a[1][0],a[1][1]);else if(part.o==='h')ctx.lineTo(x+16,y-16);else ctx.lineTo(x+16,y+14);ctx.stroke();
  txt(ctx,part.n+(on?' closed':' open'),part.o==='h'?x:x+22,part.o==='h'?y+30:y+4,{s:12*k,w:700,a:part.o==='h'?'center':'left',c:on?PAL['cv-ink']:PAL['s1']});}
function meterIcon(ctx,x,y,L,read,k){ctx.fillStyle=PAL['card'];ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,16,0,6.29);ctx.fill();ctx.stroke();
  txt(ctx,L,x,y+1,{s:15*k,w:800,a:'center',b:'middle',c:L==='A'?PAL['s4']:PAL['s5']});pill(ctx,read,x,y+30,PAL['cv-ink'],PAL['card'],12*k);}
function drawMeters(ctx,sim,s,k){const p=sim.p,tp=s.tp;
  if(p.am&&p.am!=='none'&&Number.isFinite(s.amRead)){let at;
    if(p.am==='A_main')at=[BAT_X,TOP+40];else if(p.am==='A_acrossB1'){const br=bulbBranch(tp,'B1'),pt=br.parts.find(x=>x.n==='B1');at=pt.o==='v'?[pt.at[0]-60,pt.at[1]]:[pt.at[0],pt.at[1]+55];
      ctx.strokeStyle=PAL['s4'];ctx.setLineDash([5,4]);ctx.lineWidth=2;ctx.beginPath();if(pt.o==='v'){ctx.moveTo(pt.at[0],pt.at[1]-40);ctx.lineTo(at[0],at[1]-16);ctx.moveTo(pt.at[0],pt.at[1]+40);ctx.lineTo(at[0],at[1]+16);}else{ctx.moveTo(pt.at[0]-40,pt.at[1]);ctx.lineTo(at[0]-16,at[1]);ctx.moveTo(pt.at[0]+40,pt.at[1]);ctx.lineTo(at[0]+16,at[1]);}ctx.stroke();ctx.setLineDash([]);}
    else{const br=tp.br.find(b=>'A_'+b.id===p.am);if(br){const L=pathLen(br.pts);at=pointAt(br.pts,L*0.2);}}
    if(at)meterIcon(ctx,at[0],at[1],'A',fmtA(s.amRead),k);}
  if(p.vm&&p.vm!=='none'&&Number.isFinite(s.vmRead)){
    if(p.vm==='series'){meterIcon(ctx,BAT_X,BOT-46,'V',s.vmRead.toFixed(2)+' V',k);return;}
    let a,b,at;if(p.vm==='V_bat'){a=[BAT_X,TOP+6];b=[BAT_X,BOT-6];at=[BAT_X-62,300];}
    else{const br=bulbBranch(tp,p.vm.slice(2));if(!br)return;const pt=br.parts.find(x=>x.n===p.vm.slice(2));
      if(pt.o==='v'){a=[pt.at[0],pt.at[1]-40];b=[pt.at[0],pt.at[1]+40];at=[pt.at[0]+80,pt.at[1]];}else{a=[pt.at[0]-40,pt.at[1]];b=[pt.at[0]+40,pt.at[1]];at=[pt.at[0],pt.at[1]+(pt.at[1]<230?62:-62)];}}
    ctx.strokeStyle=PAL['s5'];ctx.setLineDash([5,4]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(at[0],at[1]-14);ctx.moveTo(b[0],b[1]);ctx.lineTo(at[0],at[1]+14);ctx.stroke();ctx.setLineDash([]);
    meterIcon(ctx,at[0],at[1],'V',s.vmRead.toFixed(2)+' V',k);}}
function kirchhoff(sim){const s=sim.st.sol,p=sim.p,c=p.circuit;
  if(c==='parallel2'||c==='switches'){const a=s.el.B1,b=s.el.B2;if(!a||!b)return null;return {j:`at J1, ${s.Itot.toFixed(3)} A in = ${a.I.toFixed(3)} A (B1) + ${b.I.toFixed(3)} A (B2) out ✓`,l:`around the battery–B1 loop: +${s.term.toFixed(2)} V − ${a.V.toFixed(2)} V ≈ 0 ✓`};}
  if(c==='combo'){const a=s.el.B1,b=s.el.B2,d=s.el.B3;return {j:`at J1, ${a.I.toFixed(3)} A in (through B1) = ${b.I.toFixed(3)} A (B2) + ${d.I.toFixed(3)} A (B3) out ✓`,l:`+${s.term.toFixed(2)} V − ${a.V.toFixed(2)} V (B1) − ${b.V.toFixed(2)} V (B2) ≈ 0 ✓`};}
  if(c==='series2'){const a=s.el.B1,b=s.el.B2;return {j:'there are no junctions in series, so the same current flows everywhere: '+s.Itot.toFixed(3)+' A.',l:`+${s.term.toFixed(2)} V − ${a.V.toFixed(2)} V − ${b.V.toFixed(2)} V ≈ 0 ✓`};}
  const a=s.el.B1;if(!a)return null;return {j:'one loop, no junctions: '+s.Itot.toFixed(3)+' A everywhere.',l:`+${s.term.toFixed(2)} V − ${a.V.toFixed(2)} V ≈ 0 ✓`};}
BioLab.register(CIRCUIT);
})();
