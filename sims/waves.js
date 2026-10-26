(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,FONT,RM,axes,lvText}=BioLab.h;

/* ======================================================================
   Waves on a string. A 3.0 m rope (μ = 0.25 kg/m) is simulated with the
   wave equation  y_tt = v² y_xx − b·y_t,  v = √(T/μ), on 150 segments.
   ====================================================================== */
const L=3.0, MU=0.25, N=150, DX=L/N;
const X0=70, X1=730, PPM=(X1-X0)/L, VPM=2*PPM, Y0=200;   // vertical drawn 2× (440 px/m)          // drawing: 220 px per metre
const PROBE=Math.round(N*0.5);                          // green bead at 1.5 m
const vOf=p=>Math.sqrt(p.tension/MU);

const H=0.002;                                          // fixed internal step: leapfrog needs a constant dt
function substep(sim,dt){const p=sim.p,s=sim.st,v=vOf(p),r=v*dt/DX,r2=r*r,b=p.damp;s.time+=dt;
    s.phase+=2*Math.PI*p.freq*dt;s.manY+=(p.hand/100-s.manY)*Math.min(1,dt*12);
    if(s.timerOn)s.timer+=dt;
    const y=s.y,yo=s.yo,yn=new Float64Array(N+1);
    for(let i=1;i<N;i++)yn[i]=(2*y[i]-yo[i]*(1-b*dt/2)+r2*(y[i+1]-2*y[i]+y[i-1]))/(1+b*dt/2);
    yn[0]=driveY(sim);
    if(p.end==='fixed')yn[N]=0;
    else if(p.end==='loose')yn[N]=yn[N-1];
    else yn[N]=y[N-1]+(r-1)/(r+1)*(yn[N-1]-y[N]);        // Mur absorbing boundary
    s.yo=y;s.y=yn;
    const decay=Math.exp(-dt/Math.max(1.2,2.2/Math.max(p.freq,0.2)));
    for(let i=0;i<=N;i++)s.env[i]=Math.max(Math.abs(yn[i]),s.env[i]*decay);}
function driveY(sim){const p=sim.p,s=sim.st;
  if(p.mode==='osc')return p.amp/100*Math.sin(s.phase);
  if(p.mode==='pulse'){const tau=0.30,dt=s.time-s.pulseT0;return (dt>=0&&dt<=tau)?p.amp/100*Math.sin(Math.PI*dt/tau):0;}
  return s.manY;}
function sendPulse(sim){sim.st.pulseT0=sim.st.time;sim.st.pulses++;}
function snapHarmonic(sim,n){const f=+(n*vOf(sim.p)/(2*L)).toFixed(2);BioLab.setValues(sim,{mode:'osc',end:'fixed',freq:clamp(f,0.2,3)});}

/* standing-wave analysis from the amplitude envelope */
function standing(sim){const s=sim.st,p=sim.p;
  if(p.mode!=='osc'||p.end==='none')return null;
  const env=s.env;let mx=0;for(let i=0;i<=N;i++)mx=Math.max(mx,env[i]);
  if(mx<1e-4)return null;
  const anti=[],nodes=[];
  for(let i=2;i<N-1;i++){
    if(env[i]>=env[i-1]&&env[i]>env[i+1]&&env[i]>0.45*mx){if(!anti.length||i-anti[anti.length-1]>6)anti.push(i);}
    if(env[i]<=env[i-1]&&env[i]<env[i+1]&&env[i]<0.22*mx){if(!nodes.length||i-nodes[nodes.length-1]>6)nodes.push(i);}}
  if(p.end==='fixed')nodes.push(N);else if(env[N]>=env[N-1]&&env[N]>0.45*mx)anti.push(N);
  // only call it a standing wave when the pattern clearly beats the driver amplitude
  const clear=mx>1.6*p.amp/100;
  return {anti,nodes,mx,clear};}

const WAVES={
  id:'waves',hash:'waves',apUnit:8,order:1,kind:'Simulation',tab:'Waves on a string',
  card:'Shake a rope, send pulses and find the harmonics. Measure wavelength and period with a ruler and timer.',
  title:'Waves on a string',
  lede:{bio:'Shake one end of a rope and watch the wave travel. See how frequency, tension and the far end change what you see.',
        honors:'Measure wavelength and period, test v = fλ and v = √(T/μ), and see how reflections build standing waves.',
        ap:'Standing waves and harmonics: predict fₙ = nv/2L, count nodes and antinodes, and see how damping and the boundary shape the pattern.'},
  scale:'A 3.0 m rope with 0.25 kg per metre of mass: 220 pixels per metre along the rope; up-and-down motion is drawn twice as large (the side ruler shows true cm).',
  timeScale:1,dtMax:0.002,prewarm:0,sampleDt:0.04,window:12,unit:'s',chChange:2,chReveal:9,
  controls:[
    {id:'mode',label:'Wave source',type:'seg',def:'osc',lvl:'bio',options:[{v:'osc',l:'Oscillator'},{v:'pulse',l:'Pulse'},{v:'manual',l:'By hand'}],help:'Oscillator shakes the end steadily. Pulse sends one bump. By hand: drag the slider below.'},
    {id:'end',label:'Far end of the rope',type:'seg',def:'fixed',lvl:'bio',options:[{v:'fixed',l:'Clamped'},{v:'loose',l:'Loose ring'},{v:'none',l:'No end'}],help:'Clamped is tied down. Loose ring slides on a pole. No end lets waves leave forever.'},
    {id:'amp',label:'Amplitude',type:'range',min:1,max:12,step:0.5,def:5,unit:' cm',lvl:'bio'},
    {id:'freq',label:'Frequency',type:'range',min:0.2,max:3,step:0.05,def:1,unit:' Hz',lvl:'bio'},
    {id:'tension',label:'Tension',type:'range',min:0.25,max:4,step:0.05,def:1,unit:' N',lvl:'bio',help:'A tighter rope carries waves faster.'},
    {id:'damp',label:'Damping (friction)',type:'range',min:0,max:1.5,step:0.05,def:0.25,unit:' /s',lvl:'honors',help:'How fast the rope loses energy.'},
    {id:'hand',label:'Hand position (By hand mode)',type:'range',min:-12,max:12,step:0.5,def:0,unit:' cm',lvl:'bio',noTrial:true},
    {id:'slinky',label:'Show as a slinky',type:'toggle',def:false,lvl:'bio',help:'Same wave, drawn as a longitudinal (push–pull) wave',noTrial:true},
    {id:'ruler',label:'Ruler',type:'toggle',def:true,lvl:'bio',help:'Measure wavelength and amplitude',noTrial:true},
    {id:'marks',label:'Mark nodes and antinodes',type:'toggle',def:true,lvl:'honors',noTrial:true}
  ],
  actions:[
    {id:'pulse',label:'Send a pulse',primary:true,lvl:'bio',run(sim){if(sim.p.mode!=='pulse')BioLab.setValues(sim,{mode:'pulse'});sendPulse(sim);}},
    {id:'timer',label:'Start / stop timer',lvl:'bio',run(sim){const s=sim.st;s.timerOn=!s.timerOn;}},
    {id:'treset',label:'Reset timer',lvl:'bio',run(sim){sim.st.timer=0;sim.st.timerOn=false;}},
    {id:'h1',label:'Tune to 1st harmonic',lvl:'honors',run(sim){snapHarmonic(sim,1);}},
    {id:'h2',label:'Tune to 2nd harmonic',lvl:'honors',run(sim){snapHarmonic(sim,2);}},
    {id:'h3',label:'Tune to 3rd harmonic',lvl:'honors',run(sim){snapHarmonic(sim,3);}}
  ],
  init(){const z=()=>new Float64Array(N+1);return {y:z(),yo:z(),env:z(),phase:0,pulseT0:-99,pulses:0,manY:0,timer:0,timerOn:false,time:0,acc:0};},
  step(sim,dt){const s=sim.st;s.acc+=dt;while(s.acc>=H-1e-12){s.acc-=H;substep(sim,H);}},
  metrics:[
    {id:'speed',label:'Wave speed',unit:'m/s',lvl:'bio',min:0,max:4.2,d:2,get:s=>vOf(s.p)},
    {id:'lambda',label:'Wavelength',unit:'m',lvl:'bio',min:0,max:6,d:2,get:s=>s.p.mode==='osc'?vOf(s.p)/s.p.freq:NaN},
    {id:'period',label:'Period',unit:'s',lvl:'bio',min:0,max:5,d:2,get:s=>s.p.mode==='osc'?1/s.p.freq:NaN},
    {id:'timer',label:'Timer',unit:'s',lvl:'bio',min:0,max:null,d:2,get:s=>s.st.timer},
    {id:'probe',label:'Green bead height',unit:'cm',lvl:'honors',min:-20,max:20,d:1,fixed:true,get:s=>s.st.y[PROBE]*100},
    {id:'f1',label:'Fundamental (clamped)',unit:'Hz',lvl:'honors',min:0,max:1.5,d:2,get:s=>vOf(s.p)/(2*L)},
    {id:'anti',label:'Antinodes',unit:'',lvl:'ap',min:0,max:8,d:0,get:s=>{const a=standing(s);return a&&a.clear?a.anti.length:NaN;}}
  ],
  graphs:[
    {id:'probe',label:'Green bead height vs time',lvl:'honors',lines:['probe']},
    {id:'shape',label:'Rope shape right now',lvl:'bio',custom:true},
    {id:'speed',label:'Wave speed',lvl:'bio',lines:['speed']}
  ],
  defaultGraph:'shape',
  plot(sim,ctx,box,id){const s=sim.st,amp=Math.max(0.15,...Array.from(s.env))*100;const lim=Math.ceil(amp/5)*5;
    const ax=axes(ctx,box,{xmin:0,xmax:L,ymin:-lim,ymax:lim,xl:'Position along the rope (m)',yl:'Displacement (cm)'});
    ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();
    if(atLeast('honors')){ctx.strokeStyle=PAL['muted'];ctx.setLineDash([4,4]);ctx.lineWidth=1.2;ctx.beginPath();for(let i=0;i<=N;i++){const X=ax.X(i*DX),Y=ax.Y(s.env[i]*100);i?ctx.lineTo(X,Y):ctx.moveTo(X,Y);}ctx.stroke();
      ctx.beginPath();for(let i=0;i<=N;i++){const X=ax.X(i*DX),Y=ax.Y(-s.env[i]*100);i?ctx.lineTo(X,Y):ctx.moveTo(X,Y);}ctx.stroke();ctx.setLineDash([]);}
    ctx.strokeStyle=PAL['g-line'];ctx.lineWidth=2.5;ctx.beginPath();for(let i=0;i<=N;i++){const X=ax.X(i*DX),Y=ax.Y(s.y[i]*100);i?ctx.lineTo(X,Y):ctx.moveTo(X,Y);}ctx.stroke();ctx.restore();},
  narrate(sim){const p=sim.p,s=sim.st,v=vOf(p),hon=atLeast('honors');
    if(p.mode==='pulse'){
      if(s.pulses===0)return 'Press <b>Send a pulse</b> to flick the rope once and watch a single bump travel.';
      const tr=s.time-s.pulseT0,dist=v*tr;
      if(dist<L)return 'The pulse travels at <b>'+v.toFixed(2)+' m/s</b>. It reaches the far end in '+(L/v).toFixed(2)+' s.';
      if(p.end==='fixed')return '<b>The clamped end flips the pulse upside down.</b> The rope pulls down on the clamp, so the clamp pulls back down on the rope.';
      if(p.end==='loose')return '<b>The loose ring sends the pulse back right-side up.</b> The ring is free to slide, so it overshoots and flings the bump back the same way.';
      return 'With no end, the pulse simply leaves. Nothing reflects.';}
    if(p.mode==='manual')return 'Move the <b>Hand position</b> slider. Every move you make travels down the rope at '+v.toFixed(2)+' m/s.';
    const st=standing(sim),lam=v/p.freq;
    if(st&&st.clear&&p.end==='fixed'){const n=st.anti.length;return '<b>A standing wave.</b> Waves going out and coming back add up to '+n+' antinode'+(n===1?'':'s')+'. This is harmonic '+n+(hon?' (f = '+n+' × '+(v/(2*L)).toFixed(2)+' Hz)':'')+'.';}
    if(p.end==='none')return 'Each wave is <b>'+lam.toFixed(2)+' m</b> long and moves at '+v.toFixed(2)+' m/s'+(hon?' (v = fλ: '+p.freq.toFixed(2)+' Hz × '+lam.toFixed(2)+' m)':'')+'. With no end, nothing comes back.';
    return 'Waves '+lam.toFixed(2)+' m long reflect at the far end and overlap with new ones. Tune the frequency until the pattern stands still and grows: that is a standing wave.';},
  tour:[
    {title:'The rope',text:'This rope is 3 m long. Each bead is a small piece of rope. A wave is a pattern that moves along it: the beads themselves only move up and down.',focus:[50,90,700,230],speed:0.5,setup(sim){BioLab.setValues(sim,{end:'none',mode:'osc',freq:1});}},
    {title:'Watch one bead',text:'Follow the green bead. It goes up and down in place while the wave shape travels to the right. Energy moves along the rope; the rope does not.',focus:[(X0+PROBE*DX*PPM)-40,100,80,210],speed:0.35},
    {title:'Wavelength',text:'The distance from one crest to the next is the <b>wavelength</b>. Use the ruler under the rope to measure it.',focus:[50,90,700,300],speed:0.5},
    {title:'Frequency',text:'Now the oscillator shakes twice as fast. The wavelength gets shorter, because wave speed stays the same: v = f × λ.',focus:[50,90,700,230],speed:0.6,setup(sim){BioLab.setValues(sim,{freq:2});}},
    {title:'Tension sets the speed',text:{bio:'A tighter rope pulls back harder, so waves travel faster and stretch out longer.',honors:'Wave speed depends only on the rope: v = √(T/μ). Quadruple the tension and the speed doubles.'},focus:[50,90,700,230],speed:0.6,setup(sim){BioLab.setValues(sim,{tension:4});}},
    {title:'Reflection',text:'Send one pulse toward the clamped end. It comes back upside down.',focus:[480,60,300,300],speed:0.5,setup(sim){BioLab.setValues(sim,{tension:1,freq:1,end:'fixed',mode:'pulse'});sendPulse(sim);}},
    {lvl:'honors',title:'Standing waves',text:'Steady waves that reflect from the clamp overlap with new ones. At special frequencies they form a <b>standing wave</b>: nodes stay still and antinodes swing hardest.',focus:[50,60,700,290],speed:1,setup(sim){BioLab.reset(sim);snapHarmonic(sim,3);}},
    {title:'Longitudinal waves',text:'The same pattern drawn as a slinky: coils bunch up (compressions) and spread out (rarefactions) along the direction the wave travels. Sound works this way.',focus:[50,90,700,230],speed:0.5,setup(sim){BioLab.setValues(sim,{end:'none',mode:'osc',slinky:true});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{slinky:false,mode:'osc',end:'fixed',freq:1,tension:1});},
  challenges:[
    {lvl:'bio',q:'The oscillator speeds up from 1 Hz to 2 Hz. What happens to the wavelength?',choices:['It gets longer','It gets shorter (half as long)','It stays the same'],correct:1,
     baseline:{end:'none',freq:1},change:{freq:2},changeText:'Frequency doubled to 2 Hz',watch:'shape',
     explain:{bio:'The rope carries waves at the same speed no matter how fast you shake it. Shaking twice as often squeezes twice as many waves into the same distance, so each one is half as long.',honors:'v = fλ and v is fixed by the rope. Doubling f halves λ: 2.00 m becomes 1.00 m.'}},
    {lvl:'bio',q:'A pulse hits the clamped end of the rope. How does it come back?',choices:['Upside down','Right-side up, the same way','It does not come back'],correct:0,
     baseline:{mode:'pulse',end:'fixed',freq:1},changeAction:'pulse',at:0.5,reveal:3.0,changeText:'Pulse sent toward the clamp',watch:'shape',
     explain:{bio:'When the pulse lifts the clamped end, the clamp pulls back down. That downward pull sends the reflected pulse back upside down.',honors:'At a fixed end the displacement must stay zero, so the reflected wave is inverted (a 180° phase change).'}},
    {lvl:'honors',q:'You make the rope four times tighter (1 N to 4 N). What happens to the wave speed?',choices:['It stays the same','It doubles','It quadruples','It halves'],correct:1,
     baseline:{end:'none'},change:{tension:4},changeText:'Tension raised to 4 N',watch:'speed',
     explain:{honors:'v = √(T/μ). Four times the tension gives √4 = 2 times the speed: 2.00 m/s becomes 4.00 m/s.'}},
    {lvl:'honors',q:'Now the pulse hits a loose ring that slides on a pole. How does it come back?',choices:['Upside down','Right-side up','It does not come back'],correct:1,
     baseline:{mode:'pulse',end:'loose'},changeAction:'pulse',at:0.5,reveal:3.0,changeText:'Pulse sent toward the loose ring',watch:'shape',
     explain:{honors:'A free end has no force pulling it back, so it overshoots and the reflection returns on the same side. No phase flip.'}},
    {lvl:'ap',q:'The rope is clamped and the oscillator is tuned to the 3rd harmonic. How many antinodes form?',choices:['2','3','4','6'],correct:1,
     baseline:{end:'fixed',mode:'osc',freq:1,tension:1},at:0.3,reveal:14,change:{freq:1},changeText:'Driving at 1.00 Hz = 3 × v/2L',watch:'shape',
     explain:{ap:'fₙ = nv/2L. With v = 2.00 m/s and L = 3.0 m, f₁ = 0.333 Hz, so 1.00 Hz is the 3rd harmonic: three half-wavelengths fit on the rope, giving 3 antinodes and 4 nodes (counting both ends).'}},
    {lvl:'ap',q:'Tension doubles from 1 N to 2 N. By what factor does the fundamental frequency change?',choices:['× 2','× √2 (about 1.41)','× 4','It does not change'],correct:1,instant:true,
     explain:{ap:'f₁ = v/2L = √(T/μ)/2L. Doubling T multiplies v, and so f₁, by √2: 0.333 Hz becomes 0.471 Hz.'}}
  ],
  lab:{bio:'<p><b>Question:</b> How does frequency affect wavelength?</p><ol><li>Set the far end to <b>No end</b>, amplitude 5 cm, tension 1 N.</li><li>For 0.5, 1.0, 1.5 and 2.0 Hz, use the ruler to measure the wavelength and record a trial.</li><li>Plot frequency (x) against wavelength (y).</li></ol><p>Write a claim: what happens to wavelength as frequency goes up?</p>',
       honors:'<p><b>Question:</b> Does v = fλ hold, and how does tension change v?</p><ol><li>At 1 N, measure λ at three frequencies; calculate f × λ each time.</li><li>Repeat at 2 N and 4 N.</li><li>Use the timer and a pulse to measure speed directly: distance 3.0 m ÷ time to the far end.</li></ol><p>Compare your v values with √(T/μ), μ = 0.25 kg/m.</p>',
       ap:'<p><b>Question:</b> What frequencies make standing waves?</p><ol><li>Clamp the far end. Starting at 0.2 Hz, raise the frequency slowly and find each frequency where a large, still pattern forms.</li><li>Record the number of antinodes n and the frequency each time.</li><li>Plot f against n. Find the slope and use it to calculate v = 2L × slope.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why only certain frequencies resonate on a string fixed at both ends.</p>'},
  terms:[{t:'Wavelength (λ)',d:'The length of one complete wave, crest to crest.'},{t:'Frequency (f)',d:'How many waves pass a point each second, in hertz (Hz).'},{t:'Amplitude',d:'How far the rope moves from its rest position.'},{t:'Period (T)',d:'Time for one complete wave: T = 1/f.'},{t:'Transverse wave',d:'The rope moves perpendicular to the direction the wave travels.'},{t:'Longitudinal wave',d:'The medium moves back and forth along the direction the wave travels, like sound.'},
    {lvl:'honors',t:'Wave speed',d:'v = fλ, and on a string v = √(T/μ) (tension ÷ mass per metre).'},{lvl:'honors',t:'Reflection',d:'A fixed end flips the wave upside down; a free end does not.'},{lvl:'honors',t:'Node / antinode',d:'Points of a standing wave that never move, and points that move the most.'},
    {lvl:'ap',t:'Harmonic',d:'A standing-wave mode. On a string fixed at both ends, fₙ = nv/2L.'},{lvl:'ap',t:'Damping',d:'Loss of wave energy to friction, which keeps standing waves from growing forever.'}],
  about:'<p>The rope is 3.0 m long with μ = 0.25 kg/m, split into 150 segments. The simulation solves the damped wave equation y<sub>tt</sub> = v²y<sub>xx</sub> − b·y<sub>t</sub> step by step, with v = √(T/μ).</p><p>The left end follows the oscillator, pulse or slider exactly. A clamped end holds y = 0; a loose ring keeps the rope level at the end (no vertical force); "No end" uses an absorbing boundary so waves leave without reflecting.</p><p>Simplifications: small-amplitude (linear) waves only, no gravity sag, and the drawing shows up-and-down motion at twice the horizontal scale so small waves are visible. Node and antinode labels come from the amplitude envelope over the last few periods.</p>',
  initVis(sim){sim.vis.ph=0;},
  onClick(sim,x,y){if(sim.p.mode==='manual'){const cm=clamp((Y0-y)/VPM*100,-12,12);BioLab.setValues(sim,{hand:Math.round(cm*2)/2});}},
  draw(sim,ctx,vdt,k,t){const s=sim.st,p=sim.p,hon=atLeast('honors'),ap=atLeast('ap');
    ctx.fillStyle=PAL['cv-bg']||PAL['card'];ctx.fillRect(0,0,800,450);
    ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,392,800,58);
    // rest line
    ctx.strokeStyle=PAL['line'];ctx.setLineDash([5,6]);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(X0,Y0);ctx.lineTo(X1,Y0);ctx.stroke();ctx.setLineDash([]);
    // oscillator wheel / hand at left
    const yd=s.y[0]*VPM;
    ctx.fillStyle=PAL['cv-lamp'];rr(ctx,14,Y0-70,40,140,8);ctx.fill();
    if(p.mode==='osc'){const cx=34,cy=Y0+95;ctx.fillStyle=PAL['cv-lamp'];ctx.beginPath();ctx.arc(cx,cy,22,0,6.29);ctx.fill();
      ctx.strokeStyle=PAL['cv-bg'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+18*Math.cos(s.phase),cy-18*Math.sin(s.phase));ctx.stroke();
      ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx+18*Math.cos(s.phase),cy-18*Math.sin(s.phase));ctx.lineTo(X0-6,Y0-yd);ctx.stroke();}
    ctx.fillStyle='#c4533b';rr(ctx,X0-12,Y0-yd-9,16,18,4);ctx.fill();
    if(p.mode==='manual'){ctx.fillStyle=PAL['cv-ink'];txt(ctx,'✋',X0-30,Y0-yd+6,{s:20,a:'center'});}
    // far end hardware
    if(p.end==='fixed'){ctx.fillStyle=PAL['cv-lamp'];rr(ctx,X1+2,Y0-60,26,120,6);ctx.fill();ctx.fillStyle='#9aa0a8';rr(ctx,X1-6,Y0-7,14,14,3);ctx.fill();}
    else if(p.end==='loose'){ctx.fillStyle=PAL['cv-lamp'];ctx.fillRect(X1+6,Y0-120,6,240);ctx.strokeStyle='#e08a00';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(X1+9,Y0-s.y[N]*VPM,10,6,0,0,6.29);ctx.stroke();}
    else{const g=ctx.createLinearGradient(X1-40,0,800,0);g.addColorStop(0,'rgba(128,128,128,0)');g.addColorStop(1,PAL['cv-bg']||PAL['card']);ctx.fillStyle=g;ctx.fillRect(X1-40,60,110,300);txt(ctx,'→ rope keeps going',X1-30,Y0-60,{s:11.5*k,c:PAL['cv-soft']});}
    // standing wave envelope + marks
    const st=hon&&p.marks?standing(sim):null;
    if(st&&st.clear&&!p.slinky){ctx.strokeStyle=PAL['muted'];ctx.globalAlpha=.55;ctx.setLineDash([3,4]);ctx.lineWidth=1.2;
      for(const sg of [1,-1]){ctx.beginPath();for(let i=0;i<=N;i++){const X=X0+i*DX*PPM,Y=Y0-sg*clamp(s.env[i]*VPM,0,150);i?ctx.lineTo(X,Y):ctx.moveTo(X,Y);}ctx.stroke();}
      ctx.setLineDash([]);ctx.globalAlpha=1;
      st.nodes.forEach(i=>{const X=X0+i*DX*PPM;pill(ctx,'N',X,Y0+28,'#3f6fb0','#fff',11*k);});
      st.anti.forEach(i=>{const X=X0+i*DX*PPM;pill(ctx,'A',X,Y0-clamp(st.mx*VPM,0,150)-16,'#C11430','#fff',11*k);});}
    // the rope
    if(!p.slinky){
      ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<=N;i++){const X=X0+i*DX*PPM,Y=Y0-clamp(s.y[i]*VPM,-150,150);i?ctx.lineTo(X,Y):ctx.moveTo(X,Y);}ctx.stroke();
      for(let i=0;i<=N;i+=3){const X=X0+i*DX*PPM,Y=Y0-clamp(s.y[i]*VPM,-150,150);const g=(i===PROBE);ctx.fillStyle=g?'#1b9a4a':(i%30===0?'#3f6fb0':'#d24a5a');ctx.beginPath();ctx.arc(X,Y,g?7:4.2,0,6.29);ctx.fill();}
    }else{
      // longitudinal: displacement drawn along the rope; coils bunch up where neighbours converge
      ctx.strokeStyle='#7a8fb8';ctx.lineWidth=2.2;
      for(let i=0;i<=N;i+=2){const X=X0+i*DX*PPM+clamp(s.y[i]*PPM*1.6,-40,40);ctx.beginPath();ctx.ellipse(X,Y0,3,26,0,0,6.29);ctx.stroke();}
      const X=X0+PROBE*DX*PPM+clamp(s.y[PROBE]*PPM*1.6,-40,40);ctx.strokeStyle='#1b9a4a';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(X,Y0,3,26,0,0,6.29);ctx.stroke();
      txt(ctx,'compression = coils bunched · rarefaction = coils spread',400,Y0+56,{s:12*k,a:'center',c:PAL['cv-soft']});}
    // ruler under the rope + vertical scale
    if(p.ruler){const ry=345;ctx.fillStyle=PAL['cv-ruler'];ctx.fillRect(X0-4,ry,X1-X0+8,30);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.strokeRect(X0-4,ry,X1-X0+8,30);
      ctx.beginPath();for(let c=0;c<=300;c+=5){const X=X0+c/100*PPM,h=c%50===0?12:c%10===0?8:4;ctx.moveTo(X,ry);ctx.lineTo(X,ry+h);}ctx.stroke();
      for(let c=0;c<=300;c+=50)txt(ctx,(c/100).toFixed(1)+' m',X0+c/100*PPM,ry+26,{s:10.5*k,a:'center',c:PAL['cv-soft']});
      ctx.beginPath();for(let c=-15;c<=15;c+=5){const Y=Y0-c/100*VPM;ctx.moveTo(X0+3,Y);ctx.lineTo(X0+(c%10===0?13:8),Y);}ctx.stroke();
      txt(ctx,'+10 cm',X0+16,Y0-0.10*VPM+4,{s:10*k,c:PAL['cv-soft']});
      // wavelength bracket (Honors): from the first crest after 0.4 m to the next
      if(hon&&p.mode==='osc'&&!p.slinky){const lam=vOf(p)/p.freq;if(lam<L*0.95){let c0=-1;for(let i=Math.round(0.15*N);i<N-2;i++){if(s.y[i]>s.y[i-1]&&s.y[i]>=s.y[i+1]&&s.y[i]>0.4*p.amp/100){c0=i;break;}}
        if(c0>0){const xa=X0+c0*DX*PPM,xb=xa+lam*PPM;if(xb<X1){const by=Y0-Math.min(150,Math.max(...Array.from(s.y))*VPM)-26;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(xa,by+6);ctx.lineTo(xa,by);ctx.lineTo(xb,by);ctx.lineTo(xb,by+6);ctx.stroke();pill(ctx,'λ = '+lam.toFixed(2)+' m',(xa+xb)/2,by-10,PAL['card'],PAL['cv-ink'],11*k);}}}}}
    // readout panel
    txt(ctx,(p.mode==='osc'?'f = '+p.freq.toFixed(2)+' Hz · ':'')+'T = '+p.tension.toFixed(2)+' N · v = '+vOf(p).toFixed(2)+' m/s',16,28,{s:14*k,w:700});
    txt(ctx,'Timer '+s.timer.toFixed(2)+' s'+(s.timerOn?' ●':''),784,28,{s:14*k,w:700,a:'right',c:s.timerOn?'#C11430':PAL['cv-ink']});
    if(ap&&p.end==='fixed')txt(ctx,'Harmonics: f₁ = '+(vOf(p)/(2*L)).toFixed(2)+' Hz, f₂ = '+(2*vOf(p)/(2*L)).toFixed(2)+', f₃ = '+(3*vOf(p)/(2*L)).toFixed(2)+' Hz',16,48,{s:12*k,c:PAL['cv-soft']});
    txt(ctx,'green bead',X0+PROBE*DX*PPM,Y0+(p.slinky?-38:18),{s:11*k,a:'center',c:'#1b9a4a',w:600});
  }
};
BioLab.register(WAVES);
})();
