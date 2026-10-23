(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,axes,bars,legend,serColor}=BioLab.h;

/* Time runs in milliseconds, slowed so a 440 Hz wave shows about 1.8 cycles per second.
   Distances: 150 px = 1 m. */
const PXM=150, TAU=Math.PI*2;
const AIR={x0:92,x1:752,y0:112,y1:292}, EAR_X=770, SPK_X=72;
const DOP={start:0.6,end:3.9,y:225,ahead:4.55,behind:0.05};
const BEAT={x0:120,x1:740,win:1000};

function soundSpeed(p){if(p.medium==='vacuum')return 0;if(p.medium==='helium')return 1007;if(p.medium==='water')return 1480;return 331.3*Math.sqrt(1+p.temp/273.15);}
const vAir=p=>331.3*Math.sqrt(1+p.temp/273.15);
const pAmp=dB=>20e-6*Math.pow(10,dB/20);
const earDist=()=>(EAR_X-12-AIR.x0)/PXM;
function waveInfo(p){const v=soundSpeed(p),f=p.freq;return {v,f,lam:v>0?v/f:0,T:1000/f,p0:pAmp(p.db)};}
function doppler(p){const v=soundSpeed(p),f=p.freq;if(v<=0)return {v,ahead:0,behind:0,lamA:0,lamB:0};
  return {v,ahead:f*(v+p.vo)/(v-p.vs),behind:f*v/(v+p.vs),lamA:(v-p.vs)/f,lamB:(v+p.vs)/f};}
function tube(p){const v=vAir(p),closed=p.tubeEnd==='closed',n=closed?2*p.harm-1:p.harm,lam=closed?4*p.tubeL/n:2*p.tubeL/n;return {v,n,lam,f:v/lam,closed};}
const ord=n=>n+(n%10===1&&n!==11?'st':n%10===2&&n!==12?'nd':n%10===3&&n!==13?'rd':'th');
const M=sim=>sim.p.mode;

/* Optional tone through Web Audio. Starts only from the button, stops itself after 20 s, never throws. */
let AUD=null;
function audioFreqs(sim){const p=sim.p;
  if(p.mode==='beats')return [p.freq,p.f2];
  if(p.mode==='tube')return [tube(p).f];
  if(p.medium==='vacuum')return [];
  if(p.mode==='doppler')return [doppler(p).ahead];
  return [p.freq];}
function audioStart(sim){audioStop();try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC){sim.st.audioMsg='This browser cannot play sound.';return;}
    const ac=new AC(),g=ac.createGain();g.gain.value=0;g.connect(ac.destination);
    const os=[0,1].map(()=>{const o=ac.createOscillator();o.type='sine';o.frequency.value=440;const og=ac.createGain();og.gain.value=0;o.connect(og);og.connect(g);o.start();return {o,og};});
    AUD={ac,g,os,until:Date.now()+20000};if(ac.resume)ac.resume().catch(()=>{});sim.st.audioMsg='';audioUpdate(sim);}
  catch(e){AUD=null;sim.st.audioMsg='Sound could not start in this browser.';}}
function audioStop(){if(!AUD)return;try{AUD.os.forEach(x=>x.o.stop());AUD.ac.close();}catch(e){}AUD=null;}
function audioUpdate(sim){if(!AUD)return;if(Date.now()>AUD.until){audioStop();return;}
  try{const fs=audioFreqs(sim),now=AUD.ac.currentTime,lv=sim.p.mode==='beats'||sim.p.mode==='tube'?0.18:0.04+0.22*clamp((sim.p.db-40)/60,0,1);
    AUD.g.gain.setTargetAtTime(fs.length?lv:0,now,0.05);
    AUD.os.forEach((x,i)=>{const f=fs[i];x.og.gain.setTargetAtTime(f?1/fs.length:0,now,0.03);if(f)x.o.frequency.setTargetAtTime(clamp(f,20,5000),now,0.02);});}catch(e){}}

function modeUI(sim){const m=M(sim),ui=sim.ui;if(!ui||!ui.sec)return;
  (sim.def.controls||[]).forEach(c=>{if(!c.modes)return;const e=ui.sec.querySelector('#sound-'+c.id)||ui.sec.querySelector('#sound-'+c.id+'-l');const w=e&&e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl||'bio')||!c.modes.includes(m);});
  (sim.def.metrics||[]).forEach(mm=>{const t=ui.tiles&&ui.tiles[mm.id];const w=t&&t.num&&t.num.closest('.tile');if(w)w.hidden=!atLeast(mm.lvl||'bio')||(mm.modes&&!mm.modes.includes(m));});}

function earP(sim){const p=sim.p,w=waveInfo(p);if(p.mode!=='waves'||w.v<=0)return 0;const d=earDist(),ta=d/(w.v/1000);if(sim.t<ta)return 0;
  return -w.p0*Math.cos(TAU*(d/w.lam-p.freq*sim.t/1000));}
function earDb(sim){const p=sim.p,w=waveInfo(p);if(w.v<=0)return 0;return sim.t>=earDist()/(w.v/1000)?p.db:0;}

const SIM={
  id:'sound',hash:'sound',apUnit:8,order:2,tab:'Sound waves and Doppler',kind:'Simulation',prereq:['waves'],
  card:'Watch a speaker squeeze air molecules into a sound wave, then change the pitch, pump out the air, race the source past a listener and tune two speakers to make beats.',
  title:'Sound waves and the Doppler effect',
  lede:{bio:'Sound is air being squeezed and stretched. Watch the molecules bunch up and spread out as the wave passes, and see what changes when you raise the pitch, make it louder, take the air away or move the source.',
        honors:'Sound is a longitudinal pressure wave with v = fλ. Measure wavelength and speed in different media, predict the Doppler shift for a moving source or listener, and find the beat frequency |f₁ − f₂|.',
        ap:'Connect displacement and pressure in a longitudinal wave, apply f′ = f(v + v_o)/(v − v_s), and find the resonant frequencies of open and closed tubes from their boundary conditions.'},
  scale:'The air strip is 4.4 m long, about the width of a classroom. Time is slowed about 250×, so a 440 Hz tone shows under two vibrations each second, and molecule motion is exaggerated: real air molecules move less than a millimeter.',
  timeScale:4,dtMax:0.05,prewarm:0,sampleDt:0.1,window:20,unit:'ms',unitD:1,chChange:16,chReveal:30,
  controls:[
    {id:'mode',label:'Show',type:'seg',def:'waves',lvl:'bio',options:[{v:'waves',l:'Sound wave'},{v:'doppler',l:'Moving source'},{v:'beats',l:'Beats'},{v:'tube',l:'Tubes',lvl:'ap'}],onChange(sim){modeUI(sim);}},
    {id:'freq',modes:['waves','doppler','beats'],label:'Frequency (pitch)',type:'range',min:100,max:1000,step:10,def:440,unit:' Hz',lvl:'bio'},
    {id:'db',modes:['waves'],label:'Loudness',type:'range',min:40,max:100,step:5,def:70,unit:' dB',lvl:'bio',help:'40 dB is a quiet room, 70 dB a vacuum cleaner, 100 dB a motorcycle.'},
    {id:'medium',modes:['waves','doppler'],label:'What the sound travels through',type:'select',def:'air',lvl:'bio',options:[{v:'air',l:'Air'},{v:'vacuum',l:'Nothing (vacuum)'},{v:'helium',l:'Helium',lvl:'honors'},{v:'water',l:'Water',lvl:'honors'}]},
    {id:'temp',modes:['waves','doppler','tube'],label:'Air temperature',type:'range',min:-20,max:40,step:1,def:20,unit:' °C',lvl:'honors',help:'Sound is faster in warm air: v ≈ 331 m/s at 0 °C.'},
    {id:'vs',modes:['doppler'],label:'Source speed',type:'range',min:0,max:200,step:5,def:60,unit:' m/s',lvl:'bio',help:'The source moves to the right. 30 m/s is highway speed.'},
    {id:'vo',modes:['doppler'],label:'Listener ahead runs toward the source at',type:'range',min:0,max:100,step:5,def:0,unit:' m/s',lvl:'honors'},
    {id:'f2',modes:['beats'],label:'Second speaker frequency',type:'range',min:100,max:1000,step:1,def:444,unit:' Hz',lvl:'bio'},
    {id:'tubeEnd',modes:['tube'],label:'Tube',type:'seg',def:'closed',lvl:'ap',options:[{v:'closed',l:'Closed at one end'},{v:'open',l:'Open at both ends'}]},
    {id:'tubeL',modes:['tube'],label:'Tube length',type:'range',min:0.2,max:2,step:0.05,def:0.85,unit:' m',lvl:'ap'},
    {id:'harm',modes:['tube'],label:'Resonance number',type:'range',min:1,max:4,step:1,def:1,unit:'',lvl:'ap',help:'1 is the lowest note the tube plays. A closed tube only has odd harmonics.'}
  ],
  actions:[
    {id:'play',label:'Play the sound',primary:true,run(sim){audioStart(sim);}},
    {id:'stop',label:'Stop the sound',run(sim){audioStop();}},
    {id:'restart',label:'Restart the wave',run(sim){BioLab.reset(sim);}}
  ],
  onLevel(sim){modeUI(sim);},
  init(sim){return {xs:DOP.start,fronts:[],next:0,audioMsg:''};},
  step(sim,dt){const p=sim.p,s=sim.st;if(p.mode!=='doppler')return;const v=soundSpeed(p);
    s.xs+=p.vs/1000*dt;
    if(s.xs>DOP.end){s.xs=DOP.start;s.fronts=[];s.next=sim.t+dt;}
    if(v>0){const T=1000/p.freq;if(s.next<sim.t-T*2)s.next=sim.t;while(s.next<=sim.t+dt){s.fronts.push({x:s.xs-(p.vs/1000)*(sim.t+dt-s.next),t:s.next});s.next+=T;}}
    else s.fronts=[];
    const tmax=7/(Math.max(v,1)/1000);s.fronts=s.fronts.filter(f=>sim.t-f.t<tmax);if(s.fronts.length>60)s.fronts.splice(0,s.fronts.length-60);},
  metrics:[
    {id:'lambda',modes:['waves'],label:'Wavelength',unit:'m',min:0,max:null,d:2,get:s=>waveInfo(s.p).lam},
    {id:'period',modes:['waves'],label:'Period',unit:'ms',min:0,max:null,d:2,get:s=>1000/s.p.freq},
    {id:'vsnd',modes:['waves','doppler','tube'],label:'Speed of sound',unit:'m/s',min:0,max:null,d:0,get:s=>M(s)==='tube'?vAir(s.p):soundSpeed(s.p)},
    {id:'dBear',modes:['waves'],label:'Loudness at the listener',unit:'dB',min:0,max:100,fixed:true,d:0,get:s=>M(s)==='waves'?earDb(s):0},
    {id:'pEar',modes:['waves'],label:'Pressure change at the listener',unit:'Pa',lvl:'honors',min:null,max:null,d:3,get:s=>earP(s)},
    {id:'pamp',modes:['waves'],label:'Pressure amplitude',unit:'Pa',lvl:'honors',min:0,max:null,d:3,get:s=>s.p.medium==='vacuum'?0:pAmp(s.p.db)},
    {id:'fahead',modes:['doppler'],label:'Pitch heard ahead',unit:'Hz',min:0,max:null,d:0,get:s=>M(s)==='doppler'?doppler(s.p).ahead:0},
    {id:'fbehind',modes:['doppler'],label:'Pitch heard behind',unit:'Hz',min:0,max:null,d:0,get:s=>M(s)==='doppler'?doppler(s.p).behind:0},
    {id:'lamA',modes:['doppler'],label:'Wavelength ahead',unit:'m',lvl:'honors',min:0,max:null,d:2,get:s=>M(s)==='doppler'?doppler(s.p).lamA:0},
    {id:'mach',modes:['doppler'],label:'Source speed ÷ sound speed',unit:'',lvl:'ap',min:0,max:null,d:2,get:s=>{const v=soundSpeed(s.p);return v>0?s.p.vs/v:0;}},
    {id:'fbeat',modes:['beats'],label:'Beats per second',unit:'Hz',min:0,max:null,d:0,get:s=>Math.abs(s.p.freq-s.p.f2)},
    {id:'favg',modes:['beats'],label:'Pitch you hear',unit:'Hz',lvl:'honors',min:0,max:null,d:1,get:s=>(s.p.freq+s.p.f2)/2},
    {id:'fres',modes:['tube'],label:'Resonant frequency',unit:'Hz',lvl:'ap',min:0,max:null,d:1,get:s=>tube(s.p).f},
    {id:'lamT',modes:['tube'],label:'Wavelength in the tube',unit:'m',lvl:'ap',min:0,max:null,d:3,get:s=>tube(s.p).lam},
    {id:'nh',modes:['tube'],label:'Harmonic number n',unit:'',lvl:'ap',min:0,max:null,d:0,get:s=>tube(s.p).n}
  ],
  graphs:[
    {id:'ear',label:'Sound wave: pressure at the listener',lvl:'honors',lines:['pEar']},
    {id:'lam',label:'Sound wave: wavelength',lines:['lambda']},
    {id:'loud',label:'Sound wave: loudness at the listener',lines:['dBear']},
    {id:'dop',label:'Moving source: pitch heard',lines:['fahead','fbehind'],yl:'Frequency (Hz)'},
    {id:'beatg',label:'Beats: the two tones and their sum',custom:true},
    {id:'harmg',label:'Tubes: resonant frequencies',lvl:'ap',custom:true}
  ],
  defaultGraph:'lam',
  plot(sim,ctx,box,id){const p=sim.p;
    if(id==='beatg'){const f1=p.freq,f2=p.f2,df=Math.abs(f1-f2),win=df>0?Math.min(1000,3000/Math.max(df,1)):1000;
      const ax=axes(ctx,box,{xmin:0,xmax:win,ymin:-2.2,ymax:2.2,xl:'Time (ms)',yl:'Pressure (relative)'});
      ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();
      const N=Math.min(4000,Math.max(800,Math.round(win*f1/1000*12)));ctx.strokeStyle=serColor(1);ctx.lineWidth=1;ctx.beginPath();
      for(let i=0;i<=N;i++){const t=win*i/N,y=Math.sin(TAU*f1*t/1000)+Math.sin(TAU*f2*t/1000);i?ctx.lineTo(ax.X(t),ax.Y(y)):ctx.moveTo(ax.X(t),ax.Y(y));}ctx.stroke();
      ctx.strokeStyle=serColor(0);ctx.lineWidth=2.5;[1,-1].forEach(sg=>{ctx.beginPath();for(let i=0;i<=300;i++){const t=win*i/300,e=2*Math.abs(Math.cos(Math.PI*df*t/1000));i?ctx.lineTo(ax.X(t),ax.Y(sg*e)):ctx.moveTo(ax.X(t),ax.Y(sg*e));}ctx.stroke();});ctx.restore();
      legend(ctx,box.L+10,box.T+12,[{label:'Sum of both tones',color:serColor(1)},{label:'Loudness envelope',color:serColor(0)}]);return;}
    if(id==='harmg'){const T0=tube(p),vals=[],labs=[];for(let m=1;m<=5;m++){const q=Object.assign({},p,{harm:m}),t=tube(q);vals.push(t.f);labs.push('n = '+t.n);}
      const ax=axes(ctx,box,{xmin:0,xmax:5,ymin:0,ymax:Math.max(...vals)*1.15,xcats:labs,yl:'Frequency (Hz)'});
      bars(ctx,ax,vals,{colors:vals.map((v,i)=>i===p.harm-1?serColor(0):serColor(1)),d:0});
      txt(ctx,(T0.closed?'Closed at one end: odd harmonics only':'Open at both ends: every harmonic'),box.L+10,box.T+14,{s:13,c:PAL['muted']});}},
  narrate(sim){const p=sim.p,m=p.mode;
    if(m==='waves'){const w=waveInfo(p);if(w.v<=0)return 'The speaker still vibrates, but there are no molecules to push. <b>Sound needs a medium</b>, so the listener hears nothing.';
      const med=p.medium==='air'?'air':p.medium;
      return `The speaker cone pushes and pulls on the ${med} ${p.freq} times a second. Each push squeezes molecules together (a <b>compression</b>) and each pull spreads them apart (a rarefaction). The compressions travel at ${w.v.toFixed(0)} m/s and are ${w.lam.toFixed(2)} m apart. The red molecule only jiggles back and forth: the wave moves, the ${med} stays put.`;}
    if(m==='doppler'){const d=doppler(p);if(d.v<=0)return 'With nothing to carry it, the moving source makes no sound at all.';
      if(p.vs===0&&p.vo===0)return `The source is still, so the wavefronts are evenly spaced and both listeners hear ${p.freq} Hz.`;
      return `The source moves right at ${p.vs} m/s. Each wavefront starts where the source was when it was made, so fronts bunch up ahead (${d.lamA.toFixed(2)} m apart) and spread out behind (${d.lamB.toFixed(2)} m). The listener ahead hears <b>${d.ahead.toFixed(0)} Hz</b>, higher than the ${p.freq} Hz source. The listener behind hears ${d.behind.toFixed(0)} Hz.`;}
    if(m==='beats'){const df=Math.abs(p.freq-p.f2);if(df===0)return `Both speakers play ${p.freq} Hz, so they stay in step and the sound is steady. No beats.`;
      if(df>20)return `The tones are ${df} Hz apart. That is too fast to hear as separate beats, so the sound just seems rough or like two notes.`;
      return `The speakers play ${p.freq} Hz and ${p.f2} Hz. They drift in and out of step, adding up and then canceling, <b>${df} times each second</b>: the beat frequency is |f₁ − f₂| = ${df} Hz.`;}
    const t=tube(p);return t.closed?`A ${p.tubeL.toFixed(2)} m tube closed at one end needs a node at the closed end and an antinode at the open end. The ${ord(t.n)} harmonic fits ${t.n}/4 of a wavelength: λ = 4L/${t.n} = ${t.lam.toFixed(2)} m, so <b>f = v/λ = ${t.f.toFixed(0)} Hz</b>.`
      :`A ${p.tubeL.toFixed(2)} m tube open at both ends needs antinodes at both ends. The ${ord(t.n)} harmonic fits ${t.n}/2 of a wavelength: λ = 2L/${t.n} = ${t.lam.toFixed(2)} m, so <b>f = v/λ = ${t.f.toFixed(0)} Hz</b>.`;},
  tour:[
    {title:'A speaker pushes the air',text:'The speaker cone moves back and forth. Each time it moves out, it shoves the air molecules next to it closer together.',
     focus:[16,100,250,205],speed:0.4,setup(sim){BioLab.setValues(sim,{mode:'waves',freq:300,db:80,medium:'air'});BioLab.reset(sim);}},
    {title:'Compressions and rarefactions',text:'The squeezed regions (<b>compressions</b>) and stretched regions (rarefactions) travel away from the speaker. The graph below shows the pressure: peaks are compressions.',
     focus:[80,100,690,330],speed:0.4},
    {title:'The air does not travel',text:'Follow the red molecule. It just moves back and forth around one spot. The wave carries energy across the room, but the air itself stays put.',
     focus:[340,100,150,200],speed:0.3},
    {title:'Higher pitch, shorter wavelength',text:'At a higher frequency the speaker pushes more often, so the compressions are closer together. Sound speed stays the same, so λ = v/f gets shorter.',
     focus:[80,60,690,250],speed:0.4,setup(sim){BioLab.setValues(sim,{freq:800});}},
    {title:'No air, no sound',text:'Pump out all the air. The speaker still vibrates, but there is nothing to squeeze, so no wave reaches the listener.',
     focus:[16,60,780,260],speed:0.4,setup(sim){BioLab.setValues(sim,{medium:'vacuum'});}},
    {title:'A moving source',text:'Now the source moves right. Each wavefront spreads out from where the source was when it made it, so the fronts bunch up ahead and spread out behind. Bunched fronts mean a higher pitch.',
     focus:[0,40,800,380],speed:0.5,setup(sim){BioLab.setValues(sim,{mode:'doppler',medium:'air',freq:440,vs:100});BioLab.reset(sim);}},
    {lvl:'honors',title:'Beats',text:'Two speakers play 440 Hz and 444 Hz. They slowly drift in and out of step, so the combined sound gets loud and soft 4 times per second.',
     focus:[0,40,800,400],speed:0.5,setup(sim){BioLab.setValues(sim,{mode:'beats',freq:440,f2:444});}},
    {lvl:'ap',title:'Resonance in a tube',text:'A tube closed at one end holds a standing wave with a node at the closed end and an antinode at the open end. The lowest note fits a quarter wavelength: λ = 4L.',
     focus:[100,120,620,250],speed:0.5,setup(sim){BioLab.setValues(sim,{mode:'tube',tubeEnd:'closed',tubeL:0.85,harm:1});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'waves',freq:440,db:70,medium:'air',vs:60,f2:444});BioLab.reset(sim);},
  challenges:[
    {lvl:'bio',q:'The speaker plays a low 200 Hz note. The pitch is raised to 800 Hz. What happens to the distance between compressions (the wavelength)?',choices:['It gets longer','It gets shorter','It stays the same'],correct:1,
     baseline:{mode:'waves',freq:200,db:70,medium:'air',temp:20},change:{freq:800},changeText:'Pitch raised to 800 Hz',watch:'lambda',at:6,reveal:14,
     explain:'Sound speed in air does not depend on pitch, and v = fλ. Pushing 4× as often packs the compressions 4× closer: λ goes from 1.72 m to 0.43 m.'},
    {lvl:'bio',q:'All the air is pumped out around the speaker, which keeps vibrating. What will the listener hear?',choices:['The same sound','A quieter sound','Nothing'],correct:2,
     baseline:{mode:'waves',freq:440,db:70,medium:'air',temp:20},change:{medium:'vacuum'},changeText:'Air pumped out',watch:'dBear',
     explain:'Sound is molecules bumping into molecules. With no molecules there is nothing to squeeze, so no compressions travel. That is why space is silent.'},
    {lvl:'bio',q:'A 440 Hz source starts moving toward the listener on the right. What pitch does that listener hear?',choices:['Higher than 440 Hz','Lower than 440 Hz','Exactly 440 Hz'],correct:0,
     baseline:{mode:'doppler',freq:440,medium:'air',temp:20,vs:0,vo:0},change:{vs:100},changeText:'Source moving toward the listener',watch:'fahead',at:4,reveal:12,
     explain:'Each new wavefront starts a little closer to the listener, so the fronts arrive bunched together: more of them arrive each second, which is a higher pitch. Behind the source the pitch is lower.'},
    {lvl:'honors',q:'Two speakers both play 440 Hz. One is retuned to 444 Hz. How many times per second will the loudness throb?',choices:['0 times','4 times','444 times','884 times'],correct:1,
     baseline:{mode:'beats',freq:440,f2:440},change:{f2:444},changeText:'Second speaker retuned to 444 Hz',watch:'fbeat',at:4,reveal:10,
     explain:'The waves line up (loud) and cancel (soft) once for every cycle one gains on the other. That happens |f₁ − f₂| = 4 times per second. Musicians tune by turning the peg until the beats slow to zero.'},
    {lvl:'honors',q:'The 440 Hz speaker is switched from air to helium, where sound travels about 3× faster. What happens to the wavelength?',choices:['About 3× longer','About 3× shorter','It stays the same'],correct:0,
     baseline:{mode:'waves',freq:440,db:70,medium:'air',temp:20},change:{medium:'helium'},changeText:'Switched to helium',watch:'lambda',at:6,reveal:14,
     explain:'The speaker sets the frequency. In helium each compression travels farther before the next one is made: λ = v/f goes from 0.78 m to 2.29 m.'},
    {lvl:'ap',q:'A tube 0.85 m long is closed at one end, in 20 °C air (v = 343 m/s). What is its lowest resonant frequency?',choices:['101 Hz','202 Hz','404 Hz'],correct:0,
     baseline:{mode:'tube',tubeEnd:'closed',tubeL:0.85,harm:1,temp:20},watch:'fres',at:2,reveal:6,
     explain:'The fundamental has a node at the closed end and an antinode at the open end, a quarter wavelength: λ = 4L = 3.4 m, so f = v/λ = 343/3.4 ≈ 101 Hz.'},
    {lvl:'ap',q:'The same 0.85 m tube is opened at both ends. What happens to its lowest resonant frequency?',choices:['It halves','It doubles','It stays the same'],correct:1,
     baseline:{mode:'tube',tubeEnd:'closed',tubeL:0.85,harm:1,temp:20},change:{tubeEnd:'open'},changeText:'Closed end opened',watch:'fres',at:3,reveal:8,
     explain:'Open at both ends, the fundamental has antinodes at both ends, half a wavelength: λ = 2L = 1.7 m, so f = 202 Hz, twice the closed-tube value.'},
    {lvl:'ap',q:'A 500 Hz siren moves toward you at 35 m/s through 20 °C air (v = 343 m/s). What frequency do you hear?',choices:['449 Hz','500 Hz','551 Hz','557 Hz'],correct:3,
     baseline:{mode:'doppler',freq:500,medium:'air',temp:20,vs:35,vo:0},watch:'fahead',at:2,reveal:8,
     explain:'f′ = f·v/(v − v_s) = 500 × 343/(343 − 35) ≈ 557 Hz. The shortcut f(1 + v_s/v) = 551 Hz only works when v_s is much smaller than v.'}
  ],
  lab:{bio:'<p><b>Question:</b> How does the pitch of a sound change its wavelength?</p><ol><li>In Sound wave view, set the frequency to 200, 400, 600, 800 and 1,000 Hz.</li><li>Record a trial at each: frequency and wavelength.</li><li>Try one frequency with the air pumped out.</li></ol><p>Describe the pattern between pitch and wavelength. What happened with no air, and why?</p>',
       honors:'<p><b>Question:</b> Does v = fλ hold, and what sets v?</p><ol><li>Record the wavelength at five frequencies in air at 20 °C. Calculate f × λ for each.</li><li>Repeat at one frequency in helium and in water, and in air at −20 °C and 40 °C.</li><li>In Moving source view, record the pitch heard ahead for source speeds 0 to 150 m/s.</li></ol><p>What does f × λ equal? Which variables changed it, and which did not?</p>',
       ap:'<p><b>Question:</b> How do tube length and end type set the resonant frequencies?</p><ol><li>In Tubes view, record the fundamental for closed tubes from 0.4 m to 2.0 m.</li><li>Plot f (y) against 1/L (x) and find the slope.</li><li>Repeat for open tubes, and record the first four resonances for one tube of each type.</li></ol><p><b>Claim–evidence–reasoning:</b> Use your slopes to find the speed of sound, and explain from the boundary conditions why closed tubes have only odd harmonics.</p>'},
  terms:[
    {t:'Longitudinal wave',d:'A wave where the particles move back and forth along the direction the wave travels. Sound is longitudinal.'},
    {t:'Compression',d:'A region where molecules are squeezed together and pressure is higher.'},
    {t:'Rarefaction',d:'A region where molecules are spread apart and pressure is lower.'},
    {t:'Frequency',d:'How many vibrations happen each second, in hertz (Hz). We hear it as pitch.'},
    {t:'Wavelength',d:'The distance from one compression to the next, λ.'},
    {t:'Decibel (dB)',d:'The scale for loudness. Every 10 dB more is 10× the sound intensity.'},
    {t:'Medium',d:'The material a wave travels through. Sound cannot travel through a vacuum.'},
    {t:'Doppler effect',d:'A change in the pitch you hear when the source or listener moves.'},
    {lvl:'honors',t:'Wave speed',d:'v = fλ. For sound it depends on the medium and its temperature, not on frequency or loudness.'},
    {lvl:'honors',t:'Beats',d:'A throbbing loudness when two close frequencies combine. f_beat = |f₁ − f₂|.'},
    {lvl:'ap',t:'Doppler equation',d:'f′ = f(v + v_o)/(v − v_s) for a source and listener moving toward each other.'},
    {lvl:'ap',t:'Standing wave',d:'A wave pattern that stays in place, with nodes (no motion) and antinodes (most motion).'},
    {lvl:'ap',t:'Harmonics',d:'Open tube: fₙ = nv/2L for n = 1, 2, 3… Closed tube: fₙ = nv/4L for n = 1, 3, 5…'}],
  about:'<p><b>Sound wave.</b> The displacement of the air is ξ = s₀ sin(kx − ωt) and the pressure change is Δp = −B ∂ξ/∂x, so pressure peaks where molecules are most bunched. Pressure amplitude comes from the loudness: p₀ = 20 µPa × 10^(dB/20). The wave is treated as a plane wave in a long tube, so it does not get quieter with distance. Molecule motion is exaggerated by about 10,000× and time is slowed about 250×. Speeds: air 331.3√(1 + T/273) m/s, helium 1,007 m/s, water 1,480 m/s.</p><p><b>Moving source.</b> A wavefront leaves the source once per period and spreads as a circle at the speed of sound from where it was made. Pitch heard ahead: f′ = f(v + v_o)/(v − v_s); behind: f·v/(v + v_s). Sources stay below the speed of sound. <b>Beats</b> use the sum of two equal-amplitude sine waves, whose envelope is 2|cos(πΔf·t)|. On the stage the playback is slowed 10×. <b>Tubes</b> use ideal ends (no end correction), so real tubes resonate slightly lower.</p><p>The <b>Play the sound</b> button plays a pure sine tone through your speakers for up to 20 seconds. It never starts on its own.</p>',
  initVis(sim){const r=rng(11),d=[],cols=82,rows=4;for(let c=0;c<cols;c++)for(let q=0;q<rows;q++)d.push({x:AIR.x0+6+(c+0.5)*(AIR.x1-AIR.x0-12)/cols+(r()-0.5)*2,y:lerp(AIR.y0+6,AIR.y1-6,(q+r())/rows)});d[0]={x:420,y:(AIR.y0+AIR.y1)/2,tag:true};sim.vis.dots=d;
    const t=[];for(let i=0;i<120;i++)t.push({x:r(),y:r()});sim.vis.tdots=t;},
  draw(sim,ctx,vdt,k,vt){const p=sim.p;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    if(p.mode==='waves')drawWaves(sim,ctx,k);else if(p.mode==='doppler')drawDoppler(sim,ctx,k);else if(p.mode==='beats')drawBeats(sim,ctx,k,vt);else drawTube(sim,ctx,k);
    audioUpdate(sim);
    if(AUD)pill(ctx,'♪ Sound on',730,22,serColor(0),'#ffffff',12*k);
    else if(sim.st.audioMsg)txt(ctx,sim.st.audioMsg,790,24,{s:12*k,c:PAL['cv-soft'],a:'right'});},
  thumbSetup(sim){BioLab.setValues(sim,{db:90});}
};

function speaker(ctx,x,y,disp,h){ctx.fillStyle=PAL['cv-lamp'];rr(ctx,x-44,y-h/2,30,h,5);ctx.fill();
  ctx.fillStyle=PAL['cv-soft'];ctx.beginPath();ctx.moveTo(x-14,y-h*0.22);ctx.lineTo(x+disp,y-h*0.42);ctx.lineTo(x+disp,y+h*0.42);ctx.lineTo(x-14,y+h*0.22);ctx.closePath();ctx.fill();
  ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+disp,y-h*0.42);ctx.lineTo(x+disp,y+h*0.42);ctx.stroke();}
function listener(ctx,x,y,col){ctx.fillStyle=col||PAL['cv-ink'];ctx.beginPath();ctx.arc(x,y-14,9,0,7);ctx.fill();rr(ctx,x-8,y-3,16,26,6);ctx.fill();}

function drawWaves(sim,ctx,k){const p=sim.p,w=waveInfo(p),cy=(AIR.y0+AIR.y1)/2,t=sim.t;
  const vac=w.v<=0,lpx=w.lam*PXM,kk=vac?0:TAU/lpx,om=TAU*p.freq/1000,xf=AIR.x0+(vac?0:w.v/1000*t*PXM);
  const af=clamp((p.db-30)/60,0.15,1),A=vac?0:Math.min(af*lpx/TAU*0.95,26);
  const xi=x=>{if(vac||x>xf)return 0;const ramp=clamp((xf-x)/(lpx*0.5),0,1);return A*ramp*Math.sin(kk*(x-AIR.x0)-om*t);};
  // air box
  rr(ctx,AIR.x0-6,AIR.y0-6,AIR.x1-AIR.x0+12,AIR.y1-AIR.y0+12,10);ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;ctx.setLineDash(vac?[6,5]:[]);ctx.stroke();ctx.setLineDash([]);
  const cone=vac?Math.min(af*12,12)*Math.sin(-om*t):xi(AIR.x0);speaker(ctx,SPK_X,cy,cone*0.8,120);
  if(vac){txt(ctx,'Vacuum: no molecules to push',(AIR.x0+AIR.x1)/2,cy+5,{s:15*k,w:700,c:PAL['cv-soft'],a:'center'});}
  else{ctx.fillStyle=PAL['cv-sub'];sim.vis.dots.forEach(d=>{if(d.tag)return;ctx.beginPath();ctx.arc(d.x+xi(d.x),d.y,2.8,0,7);ctx.fill();});
    const tg=sim.vis.dots[0],tx=tg.x+xi(tg.x);ctx.strokeStyle=serColor(0);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(tg.x-A,tg.y+12);ctx.lineTo(tg.x+A,tg.y+12);ctx.stroke();
    ctx.fillStyle=serColor(0);ctx.beginPath();ctx.arc(tx,tg.y,5,0,7);ctx.fill();
    // wavelength bracket between two compressions
    if(xf>AIR.x0+lpx*1.6&&lpx<AIR.x1-AIR.x0-40){/* compressions sit where k(x − x0) − ωt = π + 2πm */
      const c0=AIR.x0+(Math.PI+om*t)/kk;let x1=c0;while(x1-lpx>AIR.x0+10)x1-=lpx;while(x1<AIR.x0+10)x1+=lpx;
      if(x1+lpx<Math.min(xf,AIR.x1)-lpx*0.4){const yb=AIR.y0-22;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x1,yb-6);ctx.lineTo(x1,yb+6);ctx.moveTo(x1,yb);ctx.lineTo(x1+lpx,yb);ctx.moveTo(x1+lpx,yb-6);ctx.lineTo(x1+lpx,yb+6);ctx.stroke();
        txt(ctx,'λ = '+w.lam.toFixed(2)+' m',x1+lpx/2,yb-8,{s:13*k,w:700,a:'center'});}}}
  // listener
  listener(ctx,EAR_X,cy+10,PAL['cv-ink']);
  const db=earDb(sim);pill(ctx,vac?'hears nothing':(db>0?'hears '+p.db+' dB':'waiting…'),EAR_X-28,AIR.y1+30,PAL['card'],PAL['cv-ink'],12*k);
  // pressure strip
  const py=372,ph=36;ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(AIR.x0,py);ctx.lineTo(AIR.x1,py);ctx.stroke();
  txt(ctx,'Pressure',AIR.x0-8,py-ph+4,{s:12*k,w:700,c:PAL['cv-soft'],a:'right'});
  txt(ctx,'high',AIR.x0-8,py-ph/2+4,{s:12*k,c:PAL['cv-soft'],a:'right'});txt(ctx,'low',AIR.x0-8,py+ph/2+4,{s:12*k,c:PAL['cv-soft'],a:'right'});
  if(!vac){ctx.strokeStyle=serColor(1);ctx.lineWidth=2.5;ctx.beginPath();for(let x=AIR.x0;x<=AIR.x1;x+=2){let pr=0;if(x<=xf){const ramp=clamp((xf-x)/(lpx*0.5),0,1);pr=-ramp*Math.cos(kk*(x-AIR.x0)-om*t)*af;}
      const y=py-pr*ph;x===AIR.x0?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();}
  txt(ctx,p.freq+' Hz',SPK_X-30,AIR.y0-14,{s:13*k,w:700});
}

function drawDoppler(sim,ctx,k){const p=sim.p,s=sim.st,d=doppler(p),X=m=>m*PXM+40,y=DOP.y;
  ctx.save();ctx.beginPath();ctx.rect(0,40,800,370);ctx.clip();
  ctx.strokeStyle=serColor(1);s.fronts.forEach(f=>{const r=d.v/1000*(sim.t-f.t)*PXM;if(r<=0)return;const age=r/(7*PXM);ctx.globalAlpha=clamp(1-age,0.15,0.9);ctx.lineWidth=2;ctx.beginPath();ctx.arc(X(f.x),y,r,0,TAU);ctx.stroke();});ctx.globalAlpha=1;ctx.restore();
  // ground line
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,412,800,38);
  // source
  const sx=X(s.xs);ctx.fillStyle=serColor(0);ctx.beginPath();ctx.arc(sx,y,13,0,TAU);ctx.fill();txt(ctx,'♪',sx,y+1,{s:15,w:800,c:'#ffffff',a:'center',b:'middle'});
  if(p.vs>0){ctx.strokeStyle=serColor(0);ctx.fillStyle=serColor(0);ctx.lineWidth=3;const L=10+p.vs*0.35;ctx.beginPath();ctx.moveTo(sx+16,y);ctx.lineTo(sx+16+L,y);ctx.stroke();ctx.beginPath();ctx.moveTo(sx+22+L,y);ctx.lineTo(sx+14+L,y-6);ctx.lineTo(sx+14+L,y+6);ctx.closePath();ctx.fill();}
  pill(ctx,'source '+p.freq+' Hz · '+p.vs+' m/s',clamp(sx,110,690),y-46,PAL['card'],PAL['cv-ink'],12*k);
  // listeners
  const xa=X(DOP.ahead),xb=X(DOP.behind)+10;listener(ctx,xa,y+60,PAL['cv-ink']);listener(ctx,xb,y+60,PAL['cv-ink']);
  const hear=f=>d.v>0?f.toFixed(0)+' Hz':'nothing';
  pill(ctx,'hears '+hear(d.ahead),xa-40,y+112,serColor(1),'#ffffff',12*k);pill(ctx,'hears '+hear(d.behind),xb+42,y+112,PAL['card'],PAL['cv-ink'],12*k);
  txt(ctx,'Ahead',xa,y+30,{s:12*k,w:700,a:'center',c:PAL['cv-soft']});txt(ctx,'Behind',xb,y+30,{s:12*k,w:700,a:'center',c:PAL['cv-soft']});
  if(p.vo>0&&atLeast('honors')){ctx.strokeStyle=PAL['cv-ink'];ctx.fillStyle=PAL['cv-ink'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(xa-14,y+44);ctx.lineTo(xa-36,y+44);ctx.stroke();ctx.beginPath();ctx.moveTo(xa-42,y+44);ctx.lineTo(xa-34,y+39);ctx.lineTo(xa-34,y+49);ctx.closePath();ctx.fill();}
  if(d.v<=0)txt(ctx,'Vacuum: no wavefronts can form',400,90,{s:15*k,w:700,c:PAL['cv-soft'],a:'center'});
  else if(atLeast('honors')&&p.vs>0){txt(ctx,'λ ahead '+d.lamA.toFixed(2)+' m',790,60,{s:12*k,w:700,a:'right',c:PAL['cv-soft']});txt(ctx,'λ behind '+d.lamB.toFixed(2)+' m',10,60,{s:12*k,w:700,c:PAL['cv-soft']});}
}

function drawBeats(sim,ctx,k,vt){const p=sim.p,f1=p.freq,f2=p.f2,df=Math.abs(f1-f2),X0=BEAT.x0,X1=BEAT.x1,W=X1-X0,win=BEAT.win;
  const tp=((vt||0)*100)%win;           // playback slowed 10x: 100 ms of sound per real second
  const X=t=>X0+t/win*W;
  speaker(ctx,58,96,0,64);speaker(ctx,58,176,0,64);
  pill(ctx,f1+' Hz',58-22,138,serColor(1),'#ffffff',12*k);pill(ctx,f2+' Hz',58-22,218,serColor(4),'#ffffff',12*k);
  const band=(yc,amp,col,env)=>{ctx.fillStyle=col;ctx.globalAlpha=0.35;ctx.beginPath();for(let i=0;i<=W;i+=2){const t=i/W*win,a=amp*(env?env(t):1);i?ctx.lineTo(X0+i,yc-a):ctx.moveTo(X0+i,yc-a);}for(let i=W;i>=0;i-=2){const t=i/W*win,a=amp*(env?env(t):1);ctx.lineTo(X0+i,yc+a);}ctx.closePath();ctx.fill();ctx.globalAlpha=1;
    if(env){ctx.strokeStyle=col;ctx.lineWidth=2;[1,-1].forEach(sg=>{ctx.beginPath();for(let i=0;i<=W;i+=2){const t=i/W*win,a=amp*env(t);i?ctx.lineTo(X0+i,yc-sg*a):ctx.moveTo(X0+i,yc-sg*a);}ctx.stroke();});}};
  band(96,18,serColor(1));band(176,18,serColor(4));
  const env=t=>Math.abs(Math.cos(Math.PI*df*t/1000));band(272,40,serColor(0),env);
  txt(ctx,'Both together',X0,224,{s:12*k,w:700,c:PAL['cv-soft']});
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(X0,322);ctx.lineTo(X1,322);ctx.stroke();
  for(let ms=0;ms<=win;ms+=250){ctx.beginPath();ctx.moveTo(X(ms),322);ctx.lineTo(X(ms),328);ctx.stroke();txt(ctx,(ms/1000).toFixed(2)+' s',X(ms),342,{s:12*k,c:PAL['cv-soft'],a:'center'});}
  if(df>0&&df<=20){const Tb=1000/df;if(Tb<win){const x1=X(Tb/2),x2=X(Tb*1.5<=win?Tb*1.5:Tb/2);if(x2>x1){ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x1,232);ctx.lineTo(x2,232);ctx.moveTo(x1,226);ctx.lineTo(x1,238);ctx.moveTo(x2,226);ctx.lineTo(x2,238);ctx.stroke();
      txt(ctx,'1 beat = '+(Tb/1000).toFixed(2)+' s',(x1+x2)/2,226,{s:12*k,w:700,a:'center'});}}}
  // playhead
  ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(X(tp),70);ctx.lineTo(X(tp),318);ctx.stroke();
  // loudness meter
  const lv=env(tp),mx=772,my0=230,mh=84;rr(ctx,mx-10,my0,20,mh,5);ctx.fillStyle=PAL['card2'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.stroke();
  ctx.fillStyle=serColor(0);const hh=mh*lv*lv;ctx.fillRect(mx-8,my0+mh-hh,16,hh);txt(ctx,'loud',mx,my0-8,{s:12*k,w:700,a:'center',c:PAL['cv-soft']});
  // zoomed view around the playhead: 10 ms
  const zy=395,zh=26,zx0=X0,zx1=X1,zw=zx1-zx0,zwin=10;txt(ctx,'Zoom: 10 ms at the playhead',zx0,zy-zh-10,{s:12*k,w:700,c:PAL['cv-soft']});
  const tr=(fn,col,lw)=>{ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.beginPath();for(let i=0;i<=zw;i+=2){const t=tp-zwin/2+i/zw*zwin,y=zy-fn(t)*zh;i?ctx.lineTo(zx0+i,y):ctx.moveTo(zx0+i,y);}ctx.stroke();};
  const w1=t=>0.5*Math.sin(TAU*f1*t/1000),w2=t=>0.5*Math.sin(TAU*f2*t/1000);
  ctx.globalAlpha=0.7;tr(w1,serColor(1),1.5);tr(w2,serColor(4),1.5);ctx.globalAlpha=1;tr(t=>w1(t)+w2(t),serColor(0),2.5);
  txt(ctx,lv>0.7?'in step: they add':(lv<0.3?'out of step: they cancel':''),zx1,zy-zh-10,{s:12*k,w:700,a:'right',c:serColor(0)});
  txt(ctx,'Playback slowed 10×',X1,58,{s:12*k,c:PAL['cv-soft'],a:'right'});
}

function drawTube(sim,ctx,k){const p=sim.p,T=tube(p),x0=150,x1=650,yc=210,hh=40,L=x1-x0,om=TAU*T.f/1000,t=sim.t;
  const shape=x=>{const u=(x-x0)/L;return T.closed?Math.sin(T.n*Math.PI*u/2):Math.cos(T.n*Math.PI*u);};
  const amp=Math.min(14,L/(T.n*4));
  ctx.fillStyle=PAL['cv-water'];ctx.globalAlpha=0.5;ctx.fillRect(x0,yc-hh,L,2*hh);ctx.globalAlpha=1;
  ctx.fillStyle=PAL['cv-sub'];sim.vis.tdots.forEach(d=>{const x=x0+6+d.x*(L-12),y=yc-hh+5+d.y*(2*hh-10);ctx.beginPath();ctx.arc(x+amp*shape(x)*Math.sin(om*t),y,2.6,0,TAU);ctx.fill();});
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x0,yc-hh);ctx.lineTo(x1,yc-hh);ctx.moveTo(x0,yc+hh);ctx.lineTo(x1,yc+hh);ctx.stroke();
  if(T.closed){ctx.lineWidth=8;ctx.strokeStyle=PAL['cv-lamp'];ctx.beginPath();ctx.moveTo(x0-2,yc-hh-4);ctx.lineTo(x0-2,yc+hh+4);ctx.stroke();}
  // displacement envelope above the tube
  const ey=yc-hh-48,ea=26,curve=(f,col,lw,dash)=>{ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.setLineDash(dash?[5,4]:[]);ctx.beginPath();for(let x=x0;x<=x1;x+=2){const y=ey-ea*shape(x)*f;x===x0?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();ctx.setLineDash([]);};
  curve(1,PAL['muted'],1.5,true);curve(-1,PAL['muted'],1.5,true);curve(Math.sin(om*t),serColor(0),2.5,false);
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x0,ey);ctx.lineTo(x1,ey);ctx.stroke();
  txt(ctx,'Air displacement',x0-8,ey+4,{s:12*k,w:700,c:PAL['cv-soft'],a:'right'});
  // node and antinode labels
  const marks=[];const steps=T.closed?T.n:2*T.n;for(let i=0;i<=steps;i++){const u=T.closed?i/T.n:i/(2*T.n);if(u>1+1e-9)break;const x=x0+u*L,sv=Math.abs(shape(x));marks.push([x,sv>0.5?'A':'N']);}
  if(T.closed)for(let i=0;i<T.n;i++){const u=(2*i+1)/T.n;if(u<=1+1e-9)marks.push([x0+u*L,'A']);}
  const seen={};marks.forEach(([x,l])=>{const key=Math.round(x);if(seen[key])return;seen[key]=1;txt(ctx,l,x,yc+hh+22,{s:13*k,w:800,a:'center',c:l==='N'?serColor(1):serColor(0)});});
  txt(ctx,'N = node (no motion), A = antinode (most motion)',x0,yc+hh+46,{s:12*k,c:PAL['cv-soft']});
  // length bracket
  const by=yc+hh+70;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x0,by-6);ctx.lineTo(x0,by+6);ctx.moveTo(x0,by);ctx.lineTo(x1,by);ctx.moveTo(x1,by-6);ctx.lineTo(x1,by+6);ctx.stroke();
  txt(ctx,'L = '+p.tubeL.toFixed(2)+' m',(x0+x1)/2,by+20,{s:13*k,w:700,a:'center'});
  // tuning source at the open end
  ctx.save();ctx.translate(x1+22,0);ctx.scale(-1,1);speaker(ctx,0,yc,4*Math.sin(om*t),56);ctx.restore();
  const formula=T.closed?'λ = 4L/'+T.n+' = '+T.lam.toFixed(2)+' m':'λ = 2L/'+T.n+' = '+T.lam.toFixed(2)+' m';
  pill(ctx,ord(T.n)+' harmonic · '+T.f.toFixed(0)+' Hz',400,40,serColor(0),'#ffffff',13*k);
  txt(ctx,formula+'   f = v/λ = '+T.v.toFixed(0)+'/'+T.lam.toFixed(2)+' = '+T.f.toFixed(0)+' Hz',400,400,{s:13*k,w:700,a:'center'});
}

BioLab.register(SIM);
})();
