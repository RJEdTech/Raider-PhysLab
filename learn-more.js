/* Learn it for the last tools without it (Nov 17, 2026, last-tools session).
   One BioLab.addLearn block for this site's tools, plus Test yourself why questions (addReview) for tools that had none.
   Each step reuses the tool's own walkthrough setups (captured below before Learn it replaces the tour) and adds live number cards. */
(function(){
'use strict';
/* ---- shared helpers for learn-more.js (copied into each site's file) ---- */
const H=BioLab.h,PAL=H.PAL;
const RED='#b3261e',GREEN='#1b7a3a',BLUE='#1f5fbf',HI='#c8102e';
const DEF=id=>BioLab.defs.find(d=>d.id===id);
/* the tool's own walkthrough steps, captured before Learn it replaces them */
const TOUR={};BioLab.defs.forEach(d=>{TOUR[d.id]=(d.tour||[]).slice();});
const TS=(id,title)=>{const s=(TOUR[id]||[]).find(x=>{const t=typeof x.title==='object'?Object.values(x.title).join('|'):String(x.title||'');return t.indexOf(title)>=0;});return s&&s.setup?s.setup:null;};
const tour=(id,title)=>sim=>{const f=TS(id,title);if(f)f(sim);};
const met=(sim,id)=>(sim.def.metrics||[]).find(m=>m.id===id);
const M=(sim,id)=>{const m=met(sim,id);if(!m)return NaN;try{return m.get(sim);}catch(e){return NaN;}};
const pick=(v)=>{if(v&&typeof v==='object'){const L=H.level||'bio';return v[L]||(L==='ap'&&v.honors)||v.bio||Object.values(v)[0];}return v;};
/* formatted metric: "label: value unit" or just value */
const F=(sim,id,d)=>{const m=met(sim,id);if(!m)return '…';let v;try{v=m.get(sim);}catch(e){return '…';}
  if(v==null)return '…';if(typeof v==='string')return v;if(!isFinite(v))return '…';
  const dd=d!=null?d:(m.d!=null?m.d:1);let s=Math.abs(v)>=1e4&&dd===0?Math.round(v).toLocaleString('en-US'):v.toFixed(dd);
  const u=pick(m.unit);return s+(u&&!/^\(|^of |^\(/.test(u)&&u.length<14?' '+u:'');};
const FL=(sim,id,d)=>{const m=met(sim,id);return (m?pick(m.label):id)+': '+F(sim,id,d);};
/* card: word-wrapped rows. pos: [x,y] top-left, or {x,y,w,up} */
function card(ctx,k,x,y,w,L,o){o=o||{};const kk=Math.min(k,1.35),pad=10*kk,rows=[];
  L.filter(r=>r!==''&&r!=null).forEach(r=>{const t=Array.isArray(r)?r:[r,{}],op=t[1]||{},sz=(op.s||13)*kk;ctx.font=(op.w||600)+' '+sz+'px '+H.FONT;
    const words=String(t[0]).split(' ');let cur='';words.forEach(wd=>{const tr=cur?cur+' '+wd:wd;if(cur&&ctx.measureText(tr).width>w-2*pad){rows.push([cur,op,sz]);cur=wd;}else cur=tr;});if(cur)rows.push([cur,op,sz]);});
  let h=pad*1.6;rows.forEach(r=>h+=r[2]*1.35);if(o.up)y-=h;
  ctx.save();H.rr(ctx,x,y,w,h,9);ctx.fillStyle=PAL['cv-sol']||PAL['card'];ctx.globalAlpha=0.96;ctx.fill();ctx.globalAlpha=1;ctx.lineWidth=o.hi===false?1.2:2.5;ctx.strokeStyle=o.hi===false?PAL['cv-soft']:HI;ctx.stroke();
  let yy=y+pad*0.8;rows.forEach(([s,op,sz])=>{yy+=sz*1.1;H.txt(ctx,s,x+pad,yy,{s:sz,w:op.w||600,c:op.c||PAL['cv-ink']});yy+=sz*0.25;});ctx.restore();return h;}
/* red ring around the part of the picture that matters in this step */
function ring(ctx,k,r,tau){if(!r)return;const a=0.55+0.45*Math.sin((tau||0)*4);ctx.save();ctx.globalAlpha=a;ctx.lineWidth=3;ctx.strokeStyle=HI;ctx.setLineDash([7,5]);H.rr(ctx,r[0],r[1],r[2],r[3],10);ctx.stroke();ctx.restore();}
const atT=(sim,tau,t,key,fn)=>{sim._at=sim._at||{};const kk=(sim.lnKey||'')+':'+key;if(tau>=t&&!sim._at[kk]){sim._at[kk]=1;fn(sim);}};
const atReset=sim=>{sim._at={};};
const L={},R={};
/* ---------- photoelectric ---------- */
const peCard=(ctx,k,LH,rows)=>card(ctx,k,236,328,352,rows,{up:true});
L.photoelectric={
  goals:{
    bio:['Why light comes in packets called photons','Why one photon frees at most one electron','Why color decides whether electrons escape, and brightness doesn’t','Why ultraviolet burns skin when bright red light can’t'],
    honors:['How E = hf and the work function set the electrons’ top energy','How a stopping voltage measures that top energy'],
    ap:['How a graph of stopping voltage against frequency gives Planck’s constant']},
  matters:'Sunburn on a Colorado ski slope, the red safelight in a darkroom, solar panels and the camera in your phone all work because light hands over its energy in packets. Einstein’s explanation of this effect won his Nobel Prize.',
  startKey:'start',startRun:true,
  steps:[
    {key:'packets',title:'Light comes in packets',run:tour('photoelectric','Light comes in packets'),speed:0.35,focus:[18,18,200,150],
     see:'Blue light (450 nm) shines on a sodium plate. Each wiggle is one photon.',
     why:'Light travels as photons, packets of energy. A blue photon carries 2.76 eV (an electron-volt is a tiny unit of energy). Red photons carry less; ultraviolet photons carry more.',
     overlay(sim,ctx,LH,k){peCard(ctx,k,LH,[[FL(sim,'E',2),{w:800}]]);}},
    {key:'one',title:'One photon, one electron',speed:0.3,focus:[168,22,424,216],
     see:'Watch a photon hit the plate and an electron fly across the tube.',
     why:'A photon hands all its energy to one electron, all at once. If that is enough to escape the metal, the electron flies to the collector and a current flows.',
     overlay(sim,ctx,LH,k){peCard(ctx,k,LH,[[FL(sim,'rate',1),{w:700}]]);}},
    {key:'ladder',title:'The energy ladder',speed:0.3,focus:[602,8,196,312],
     see:'Read the energy ladder on the right.',
     why:'The electron has to climb out of the metal: that cost is the work function φ, 2.28 eV for sodium. The 2.76 eV photon pays it with 0.48 eV left over, which becomes the electron’s energy of motion.',
     overlay(sim,ctx,LH,k){peCard(ctx,k,LH,[[FL(sim,'E',2)+'  −  '+FL(sim,'phi',2)],[FL(sim,'KE',2),{w:800,c:GREEN}]]);}},
    {key:'red',title:'Too red: nothing happens',set:{metal:'zinc',lam:650,I:50},fresh:true,speed:0.35,focus:[[168,22,424,216],[30,330,740,112]],
     see:'Red light (650 nm) on a zinc plate.',
     why:'Each red photon carries 1.91 eV, far less than zinc’s 4.33 eV escape cost, so no electron gets out. The faded part of the spectrum bar is every color that never works on zinc.',
     overlay(sim,ctx,LH,k){peCard(ctx,k,LH,[[FL(sim,'E',2)],[FL(sim,'rate',1),{w:800,c:RED}]]);}},
    {key:'bright',title:'Brighter doesn’t help',set:{metal:'zinc',lam:650,I:100},speed:0.35,cause:{from:{I:50},delay:1.5,dur:1.5,label:'Brightness'},focus:[[18,18,200,150],[602,8,196,312]],
     see:'Turn the red light up to full brightness.',
     why:'More photons arrive, but each is still too weak. An electron can’t save up energy from several photons, so still none escape. A bright red heat lamp warms skin but can’t sunburn it for the same reason.',
     overlay(sim,ctx,LH,k){peCard(ctx,k,LH,[[FL(sim,'rate',1),{w:800,c:RED}]]);}},
    {key:'hook',title:'Your question: bright red or dim UV?',set:{metal:'zinc',lam:250,I:10},fresh:true,speed:0.3,cause:{from:{lam:700,I:100},delay:2,dur:1.5,label:'Light'},focus:[[168,22,424,216],[602,8,196,312]],
     see:'First full-brightness red light at 700 nm on zinc, then dim UV at 250 nm, only 10% brightness.',
     why:'Each red photon carries 1.77 eV, far less than 4.33 eV, so even full brightness frees nothing. Each 250 nm photon carries 4.96 eV, so even dim UV frees electrons at once, with up to 0.63 eV to spare. Brightness only changes how many photons arrive. That is why you can burn under a cloudy mountain sky.',
     overlay(sim,ctx,LH,k){peCard(ctx,k,LH,[[FL(sim,'E',2),{w:800}],[FL(sim,'KE',2),{w:700,c:GREEN}],[FL(sim,'rate',1)]]);}},
    {key:'stop',lvl:'honors',title:'Stopping voltage',set:{metal:'zinc',lam:240,I:60,V:0.84},speed:0.3,cause:{from:{V:0},delay:1.5,dur:3,label:'Stopping voltage'},focus:[168,22,424,306],
     see:'240 nm UV on zinc. A battery pushes back on the electrons. Watch the current as the voltage rises.',
     why:'As the voltage grows, slower electrons turn around before the collector and the current drops. At 0.84 V even the fastest turn back. The stopping voltage in volts equals the top kinetic energy in eV.',
     overlay(sim,ctx,LH,k){peCard(ctx,k,LH,[[FL(sim,'KE',2)],[FL(sim,'I',2),{w:800,c:RED}]]);}},
    {key:'planck',lvl:'ap',title:'Planck’s constant from a graph',run:tour('photoelectric','Planck'),speed:0.3,focus:[[602,8,196,312],[30,330,740,112]],
     see:'The stopping voltage is measured across the spectrum and graphed against frequency.',
     why:'eV_stop = hf − φ, a straight line. Its slope is h/e ≈ 4.14 × 10⁻¹⁵ V·s, and it crosses zero at the threshold frequency. Every metal gives a parallel line, shifted by its work function.',
     overlay(sim,ctx,LH,k){peCard(ctx,k,LH,[[FL(sim,'fit'),{w:800,c:GREEN}]]);}}
  ],
  useIt:[
    {do:'Wear sunscreen on cloudy days in the mountains, not just sunny ones.',why:'Clouds dim visible light more than UV, and each UV photon can still damage DNA. UV is stronger at altitude.'},
    {do:'Don’t trust “it’s not hot” as a sign you won’t burn.',why:'Heat comes mostly from infrared and red light, whose photons are too weak to damage skin. UV does the damage without much warmth.'},
    {do:'Point a solar charger straight at the sun, not just into bright shade.',why:'Each photon frees at most one electron. More photons, from direct sun, means more current.'}],
  tryIt:[{title:'glow-in-the-dark test (5 minutes, dark room)',steps:['Charge a glow-in-the-dark sticker or toy with a red light (a phone screen showing red, or a red LED) for 30 seconds.','Charge it again with a phone flashlight (white) or a UV light.'],look:'Red light barely charges it, even when bright. White or UV light charges it fast. The glowing material needs photons above a certain energy, just like the zinc plate.'}]};
R.photoelectric={questions:[
  {id:'red',kind:'test',lvl:'bio',q:'Red light frees no electrons from zinc. What happens if you make it four times brighter?',choices:['Still no electrons, since each photon is too weak','Electrons come out, since there is more energy','A few electrons escape after a short delay','The plate warms up and then releases electrons'],correct:0,
   steps:['Each red photon carries less energy than zinc’s work function.','Brighter light means more photons, not stronger ones.','No single photon can free an electron, so none escape.']},
  {id:'uv',kind:'test',lvl:'bio',q:'Why can ultraviolet light burn skin when bright red light can’t?',choices:['Each UV photon carries enough energy to damage molecules','UV light is always brighter than red light','Red light is blocked completely by the very top layer of skin','UV light heats skin far more than red light does'],correct:0,
   steps:['Photon energy depends on color (frequency).','UV photons carry several eV each, enough to break bonds in DNA.','Red photons carry too little, however many arrive.']},
  {id:'one',kind:'test',lvl:'bio',q:'When a photon frees an electron, how many electrons does that one photon free?',choices:['One','As many as its energy can pay for','Two, one for each wavelength','None until several photons add up'],correct:0,
   steps:['A photon gives all its energy to a single electron.','So one photon frees at most one electron.','More photons per second means more electrons per second.']},
  {id:'ke',kind:'test',lvl:'honors',q:'A 4.96 eV photon hits zinc, whose work function is 4.33 eV. What is the fastest electron’s kinetic energy?',num:{ans:0.63,tol:0.01,unit:'eV'},
   steps:['KEmax = photon energy − work function.','4.96 − 4.33.','= 0.63 eV.']},
  {id:'brightke',kind:'test',lvl:'honors',q:'UV light frees electrons from zinc. You make the UV three times brighter. What happens to the fastest electron’s energy?',choices:['It stays the same; only the number of electrons rises','It triples along with the brightness','It rises a little as photons combine','It drops, because the extra electrons must share the energy'],correct:0,
   steps:['Each photon still carries the same energy.','KEmax = hf − φ doesn’t depend on brightness.','Brighter light only frees more electrons per second.']},
  {id:'energy',kind:'test',lvl:'honors',q:'About how much energy does a 250 nm photon carry? (Use E = 1240 eV·nm ÷ λ.)',num:{ans:4.96,tol:0.03,unit:'eV'},
   steps:['E = 1240 ÷ λ in nm.','1240 ÷ 250.','≈ 4.96 eV.']},
  {id:'slope',kind:'test',lvl:'ap',q:'You graph stopping voltage against frequency for sodium and then for platinum. How do the lines compare?',choices:['Parallel, shifted by the work function','Same intercept, different slopes','Identical, since both use the same light','Crossing at the threshold frequency'],correct:0,
   steps:['eV_stop = hf − φ.','The slope h/e is the same for every metal.','A larger φ shifts the line to higher threshold frequency.']}
]};

/* ---------- relativity ---------- */
const rlCard=(ctx,k,LH,rows)=>card(ctx,k,500,LH-10,292,rows,{up:true});
L.relativity={
  goals:{
    bio:['Why a moving clock ticks slower when light’s speed is the same for everyone','How the time-stretch factor γ grows near light speed','Why moving things measure shorter along their motion','Why you never notice any of this in daily life'],
    honors:['How cosmic-ray muons prove that moving clocks run slow','How the twin trip works out in years'],
    ap:['How proper time shows up on a spacetime diagram']},
  matters:'GPS in every phone corrects its satellite clocks for relativity, about 38 millionths of a second a day, or your map would drift about 10 km a day. Muons from cosmic rays pass through you right now only because their clocks run slow.',
  startKey:'start',startRun:true,
  steps:[
    {key:'clock',title:'A light clock',run:tour('relativity','A light clock'),speed:0.5,focus:[[30,40,180,190],[0,236,800,190]],
     see:'Light bounces between two mirrors 1.5 m apart. Each round trip is one tick: 10 billionths of a second. The train isn’t moving.',
     why:'Both clocks tick together because both are at rest relative to you. A light clock is a handy way to think about any clock, because light’s speed is the one thing everyone agrees on.',
     overlay(sim,ctx,LH,k){rlCard(ctx,k,LH,[[FL(sim,'tick',1),{w:700}]]);}},
    {key:'move',title:'Set the train moving',set:{beta:0.6},fresh:true,speed:0.5,focus:[0,236,800,190],
     see:'Now the train moves at 0.6 c, 60% of light speed. Watch the light in the train’s clock.',
     why:'From the ground, the light in the moving clock takes a slanted path, which is longer. Light’s speed can’t change, so each tick takes longer: 12.5 ns instead of 10. The moving clock runs slow.',
     overlay(sim,ctx,LH,k){rlCard(ctx,k,LH,[[FL(sim,'tick',1),{w:800,c:RED}],[FL(sim,'g',3)]]);}},
    {key:'gamma',title:'Counting ticks',set:{beta:0.87},fresh:true,speed:0.6,cause:{from:{beta:0.6},delay:1.5,dur:2,label:'Speed'},focus:[230,40,560,170],
     see:'Speed up to 0.87 c and compare the tick counts.',
     why:'At 0.87 c the train clock ticks about half as often as yours: γ ≈ 2. γ = 1/√(1 − v²/c²) is how many times slower a moving clock runs. This is time dilation.',
     overlay(sim,ctx,LH,k){rlCard(ctx,k,LH,[[FL(sim,'g',2),{w:800,c:RED}]]);}},
    {key:'jet',title:'Everyday speeds',set:{craft:'jet'},speed:0.6,focus:[230,40,560,170],
     see:'Now a jet airliner at 250 m/s (560 mph).',
     why:'γ is 1.0000000000003. The jet’s clock falls behind by about 30 billionths of a second per day: real, measured with atomic clocks in 1971, but far too small for anyone to notice.',
     overlay(sim,ctx,LH,k){rlCard(ctx,k,LH,[[FL(sim,'lag'),{w:800}]]);}},
    {key:'length',title:'Moving things get shorter',set:{scene:'length',craft:'slider',beta:0.8},fresh:true,speed:0.5,focus:[0,48,800,330],
     see:'A 100 m ship flies past at 0.8 c.',
     why:'We measure it as 60 m long: shorter along its motion by 1/γ. Its height doesn’t change. People on the ship measure it as 100 m, and they measure our things as shorter. Both are right in their own frame.',
     overlay(sim,ctx,LH,k){rlCard(ctx,k,LH,[[FL(sim,'len',1),{w:800,c:RED}]]);}},
    {key:'hook',title:'Your question: the twin trip',set:{scene:'twins',craft:'slider',beta:0.9,dist:10},fresh:true,speed:0.6,focus:[0,48,800,402],
     see:'You fly to a star 10 light-years away and back at 0.9 c while your twin stays home.',
     why:'Earth’s clocks count 22.2 years. Your clock runs slow by γ = 2.29, so you age only 9.7 years and come home 12.5 years younger than your twin. On a jet, your clock falls behind by about 30 billionths of a second per day.',
     overlay(sim,ctx,LH,k){rlCard(ctx,k,LH,[[FL(sim,'tE',1),{w:700}],[FL(sim,'tT',1),{w:800,c:GREEN}],[FL(sim,'g',2)]]);}},
    {key:'muon',lvl:'honors',title:'Muons reach the ground',set:{scene:'muon',beta:0.998},fresh:true,speed:0.5,focus:[0,48,800,402],
     see:'Muons are made 15 km up by cosmic rays and live only 2.2 µs. Compare the two columns.',
     why:'Without slow clocks (left), almost all would decay high up. Their real clocks run slow by γ ≈ 16 (right), so about a quarter reach the ground. Detectors on the ground count them every second: proof that moving clocks run slow.',
     overlay(sim,ctx,LH,k){rlCard(ctx,k,LH,[[FL(sim,'surv',0),{w:800,c:GREEN}],[FL(sim,'nodil')]]);}},
    {key:'st',lvl:'ap',title:'Spacetime diagram',run:tour('relativity','Spacetime diagram'),set:{scene:'twins',dist:10,beta:0.8},fresh:true,speed:0.6,focus:[0,48,800,402],
     see:'Open the spacetime diagram of the twin trip. Earth’s worldline goes straight up; the traveler’s bends at the star.',
     why:'The bent path has less proper time: τ = t/γ on each leg. On a spacetime diagram, the path that looks longer is the one with less time on its clock. The traveler, who turned around, is the one who ages less.',
     overlay(sim,ctx,LH,k){rlCard(ctx,k,LH,[[FL(sim,'tE',1)],[FL(sim,'tT',1),{w:800,c:GREEN}]]);}}
  ],
  useIt:[
    {do:'Thank relativity next time GPS gets you to a new place.',why:'GPS satellites correct their clocks by about 38 µs a day for speed and gravity together. Without it, your position would drift about 10 km a day.'},
    {do:'Don’t worry about aging on a long flight.',why:'At jet speed your clock falls behind by about 30 billionths of a second a day: real, but far smaller than anything you could notice.'},
    {do:'Visit a cosmic-ray detector or watch one online.',why:'Muons rain through you all the time, and more reach Denver’s altitude than sea level. They make it at all only because their clocks run slow.'}],
  tryIt:[{title:'the light-clock path (5 minutes)',steps:['Bounce a ball straight down and up while standing still. Then do it while walking fast past a friend.','Ask your friend to describe the ball’s path both times.'],look:'To you it goes straight up and down; to your friend it zigzags along a longer, slanted path. With light, whose speed can’t change, a longer path means a longer tick.'}]};
R.relativity={questions:[
  {id:'why',kind:'test',lvl:'bio',q:'Why does a moving light clock tick slower, as we see it?',choices:['Its light takes a longer slanted path at the same speed','Its mirrors get pushed closer together as the train moves','Light slows down inside a moving train','The clock’s battery runs down faster'],correct:0,
   steps:['From the ground, the light moves sideways and up at once.','That slanted path is longer.','Light’s speed is fixed, so each tick takes longer.']},
  {id:'gamma2',kind:'test',lvl:'bio',q:'At about 0.87 c, how much slower does a moving clock run?',choices:['About half as fast','About 87% as fast','About 13% as fast','No slower, it only looks that way'],correct:0,
   steps:['γ = 1/√(1 − 0.87²).','1 − 0.757 = 0.243; √0.243 ≈ 0.49.','γ ≈ 2: the clock runs at half rate.']},
  {id:'jet',kind:'real',lvl:'bio',q:'Why don’t you notice time dilation on a jet flight?',choices:['At 250 m/s the effect is billionths of a second','Airplanes are shielded from relativity','It only happens to light, not to people','Your watch corrects for it automatically'],correct:0,
   steps:['γ at 250 m/s is 1.0000000000003.','That’s about 30 billionths of a second per day.','Far too small to notice, though atomic clocks measure it.']},
  {id:'length',kind:'test',lvl:'honors',q:'A ship 100 m long in its own frame flies past at 0.6 c (γ = 1.25). What length do we measure?',num:{ans:80,tol:0.5,unit:'m'},
   steps:['Moving length L = L₀ ÷ γ.','100 ÷ 1.25.','= 80 m.']},
  {id:'twins',kind:'test',lvl:'honors',q:'A twin flies to a star 10 light-years away and back at 0.8 c. How many years pass on Earth?',num:{ans:25,tol:0.1,unit:'years'},
   steps:['Round trip distance: 20 light-years.','Time = 20 ÷ 0.8.','= 25 years on Earth (the traveler ages 25 ÷ 1.67 = 15).']},
  {id:'muons',kind:'test',lvl:'honors',q:'Muons live only 2.2 µs, yet many made 15 km up reach the ground. Why?',choices:['Their clocks run slow, so they live longer as we see it','They travel faster than light for the first part of the way','They are made again near the ground','The air slows their decay by cooling them'],correct:0,
   steps:['Without time dilation, 2.2 µs at nearly c covers only about 660 m.','At 0.998 c, γ ≈ 16, so they last about 16 times longer as we measure.','That’s enough for many to reach the ground.']},
  {id:'gps',kind:'real',lvl:'ap',q:'GPS satellites correct their clocks for relativity. What would happen without the correction?',choices:['Positions would drift by kilometers each day','Phones would lose their signal completely','The satellites would fall out of orbit','Maps would be off by a few centimeters a year'],correct:0,
   steps:['Speed and gravity together shift satellite clocks about 38 µs per day.','Light travels about 11 km in 38 µs.','Uncorrected, positions would drift about 10 km a day.']}
]};

/* ---------- rocket ---------- */
const rkCard=(ctx,k,LH,rows)=>card(ctx,k,280,16,262,rows);
L.rocket={
  goals:{
    bio:['How a rocket moves with nothing to push against','Why the rocket’s momentum always matches its exhaust’s','Why a rocket speeds up faster as it burns fuel','How much water to put in a bottle rocket'],
    honors:['The rocket equation, Δv = vₑ ln(m₀/m_f)','Why faster exhaust beats more fuel','Why rockets drop empty stages'],
    ap:['How gravity and drag losses make orbit harder than the rocket equation suggests']},
  matters:'Every rocket launch you see, from a class bottle rocket to a SpaceX booster, runs on one idea: throw mass backward fast, and you move forward. The same momentum rule explains a fire hose’s kick and a skateboarder pushing off.',
  startKey:'start',startRun:false,
  steps:[
    {key:'space',title:'A rocket in empty space',run:tour('rocket','A rocket in empty space'),pause:true,focus:[8,8,540,292],
     see:'A rocket at rest in deep space, with 100 t of fuel in a 113 t rocket.',
     why:'There is no ground or air to push on, and its momentum (mass × velocity) is zero. The question is how it can speed up at all.',
     overlay(sim,ctx,LH,k){rkCard(ctx,k,LH,[[FL(sim,'vr',0)],[FL(sim,'mass',1)]]);}},
    {key:'throw',title:'Throwing mass backward',speed:0.15,focus:[8,8,540,292],
     see:'The engine fires. Watch the exhaust and the rocket.',
     why:'The engine throws exhaust backward at 3,000 m/s. Pushing the exhaust back pushes the rocket forward: equal and opposite forces, like the kick of a fire hose. It doesn’t need anything to push against except its own exhaust.',
     overlay(sim,ctx,LH,k){rkCard(ctx,k,LH,[[FL(sim,'vr',0),{w:800,c:GREEN}]]);}},
    {key:'books',title:'Momentum bookkeeping',speed:0.5,focus:[8,308,784,134],
     see:'Watch the momentum bars at the bottom.',
     why:'The rocket’s forward momentum always equals the exhaust’s backward momentum, so the total stays at zero. Momentum is conserved, even for a rocket.',
     overlay(sim,ctx,LH,k){rkCard(ctx,k,LH,[[FL(sim,'ptot',2),{w:800,c:GREEN}]]);}},
    {key:'lighter',title:'Getting lighter',speed:1,focus:[556,8,236,292],
     see:'Watch the fuel bar shrink and the speed climb.',
     why:'As fuel burns, the rocket gets lighter, so each kilogram of exhaust speeds it up more. The speed climbs faster and faster even though the engine pushes just as hard.',
     overlay(sim,ctx,LH,k){rkCard(ctx,k,LH,[[FL(sim,'fuelpc',0)],[FL(sim,'vr',0),{w:800,c:GREEN}]]);}},
    {key:'coast',title:'Engine off',speed:1,focus:[8,8,540,292],
     see:'The fuel runs out.',
     why:'With nothing pushing and no friction in space, the rocket coasts at a steady 6.5 km/s, about 14,500 mph. In space, keeping your speed takes no fuel; changing it does.',
     overlay(sim,ctx,LH,k){rkCard(ctx,k,LH,[[FL(sim,'vr',0),{w:800}]]);}},
    {key:'exhaust',title:'Faster exhaust',set:{ve:4000},fresh:true,speed:1,focus:[8,8,540,292],
     see:'Same rocket, same fuel, launched again with exhaust leaving at 4,000 m/s instead of 2,000.',
     why:'Each kilogram of exhaust now carries twice the momentum, so the rocket ends up about twice as fast: about 8.6 km/s instead of 4.3. Faster exhaust is worth far more than extra fuel, which also has to be carried.',
     overlay(sim,ctx,LH,k){rkCard(ctx,k,LH,[[FL(sim,'vr',0),{w:800,c:GREEN}]]);}},
    {key:'hook',title:'Your question: how much water?',run:sim=>{atReset(sim);const f=TS('rocket','A water bottle rocket');if(f)f(sim);},speed:0.5,focus:[8,8,462,434],
     see:'A 2 L bottle at 60 psi with 0.6 L of water, at half speed. Watch the water blast out, then read the highest point.',
     why:'With about a third of the bottle full, it reaches about 38 m. With only 0.2 L it reaches about 26 m: too little to throw. Nearly full at 1.6 L it barely reaches 3.5 m, because there is too little air left to push the water out. Aim for about a third.',
     overlay(sim,ctx,LH,k){rkCard(ctx,k,LH,[[FL(sim,'water',2)],[FL(sim,'maxb',1),{w:800,c:GREEN}]]);}},
    {key:'stage',lvl:'honors',title:'Drop the empty tanks',run:tour('rocket','Staging'),speed:1,focus:[8,8,784,434],
     see:'The same fuel in two stages. The first stage’s empty tanks are dropped halfway.',
     why:'After the drop, the second stage only has to speed up a small rocket, not dead weight. Total Δv rises from 6.5 to 8.1 km/s with the same fuel. Δv = vₑ ln(m₀/m_f) rewards a high ratio of full to empty mass, and staging raises it.',
     overlay(sim,ctx,LH,k){rkCard(ctx,k,LH,[[FL(sim,'dvi',0),{w:800,c:GREEN}],[FL(sim,'vr',0)]]);}},
    {key:'orbit',lvl:'ap',title:'Going to orbit',run:tour('rocket','Going to orbit'),speed:1,focus:[8,8,784,434],
     see:'From Earth, with two stages and 4,500 m/s exhaust. Watch the Δv lost to gravity and drag.',
     why:'Orbit needs about 7.8 km/s sideways, but climbing against gravity and pushing through air cost about 1.4 km/s more. That is why a rocket with 8.1 km/s on paper can fail to reach orbit, while this one, with 12.1 km/s, makes it.',
     overlay(sim,ctx,LH,k){rkCard(ctx,k,LH,[[FL(sim,'gloss',0)],[FL(sim,'dloss',0)],[FL(sim,'peri',0),{w:800}]]);}}
  ],
  useIt:[
    {do:'For a bottle rocket, fill about a third with water and pump to the safe limit.',why:'Too little water means little mass to throw; too much leaves too little air to push it. A third is the sweet spot.'},
    {do:'Hold a garden hose with both hands when you open the nozzle.',why:'The water shooting forward pushes the hose back, the same equal-and-opposite kick that drives a rocket.'},
    {do:'Push off a wall, not the floor, to glide farther on a skateboard or ice.',why:'You move by pushing something the other way. The harder and faster you push it, the more speed you get.'}],
  tryIt:[{title:'the balloon rocket (10 minutes)',steps:['Thread a long string through a straw and tie it tight across a room.','Blow up a balloon, hold it shut and tape it to the straw.','Let go. Then try again with the balloon only half blown up.'],look:'The balloon shoots along the string by pushing air backward. Less air to throw means less speed, the same as a rocket with less fuel.'}]};
R.rocket={questions:[
  {id:'space',kind:'test',lvl:'bio',q:'In empty space there is nothing to push against. How does a rocket speed up?',choices:['It throws exhaust backward and is pushed forward','It can’t speed up until it reaches air','The engine’s flame pushes against the vacuum of space itself','Gravity from the Sun pulls it forward'],correct:0,
   steps:['The engine throws exhaust backward.','By Newton’s third law the exhaust pushes the rocket forward.','No outside surface is needed.']},
  {id:'mom',kind:'test',lvl:'bio',q:'A rocket starts at rest in space and fires. What is the total momentum of rocket plus exhaust?',choices:['Zero, the same as before it fired','It grows as the rocket speeds up','Equal to the rocket’s momentum alone','It depends on how much fuel is left'],correct:0,
   steps:['Nothing outside acts on the rocket plus exhaust.','So total momentum stays at its starting value.','That value was zero.']},
  {id:'water',kind:'real',lvl:'bio',q:'Why does a nearly full water bottle rocket barely leave the ground?',choices:['Too little air is left to push the water out','More water makes the bottle too heavy for gravity','Water blocks the nozzle so nothing comes out','Full bottles leak before they can launch'],correct:0,
   steps:['The compressed air does the pushing.','A full bottle has very little air.','It runs out of push before throwing much water.']},
  {id:'eq',kind:'test',lvl:'honors',q:'Exhaust speed 3,000 m/s, mass ratio m₀/m_f = 4. What Δv does the rocket equation give? (ln 4 ≈ 1.39)',num:{ans:4160,tol:60,unit:'m/s'},
   steps:['Δv = vₑ ln(m₀/m_f).','3,000 × 1.386.','≈ 4,160 m/s.']},
  {id:'fuel',kind:'test',lvl:'honors',q:'Doubling the fuel from 100 t to 200 t raises Δv only from 6.5 to about 7 km/s. Why so little?',choices:['The extra fuel must also be carried and sped up','Fuel burns less well in a bigger tank','The exhaust gets slower when the tanks hold more fuel','Doubling fuel always gives exactly double Δv'],correct:0,
   steps:['Δv depends on ln(m₀/m_f), not on fuel directly.','More fuel raises m₀, but the rocket must accelerate that fuel too.','So Δv grows only slowly with fuel.']},
  {id:'stage',kind:'test',lvl:'honors',q:'Why do rockets drop empty stages?',choices:['So the rest isn’t wasting thrust on dead weight','Because empty tanks would explode','To make the rocket look smaller for drag','Because the law requires falling parts'],correct:0,
   steps:['Empty tanks add mass but no fuel.','Dropping them raises the remaining mass ratio.','More Δv from the same fuel.']},
  {id:'orbit',kind:'test',lvl:'ap',q:'A rocket has 8.1 km/s of Δv, more than the 7.8 km/s orbital speed. Why does it still fail to reach orbit from Earth?',choices:['Gravity and drag losses cost about 1.4 km/s','Orbital speed is higher near the ground','The rocket equation doesn’t apply on Earth','Its exhaust slows down in the atmosphere'],correct:0,
   steps:['Climbing against gravity wastes thrust.','Air drag wastes more.','Together about 1.4 km/s, leaving too little for orbit.']}
]};

/* ---------- chaos ---------- */
const chCard=(ctx,k,LH,rows)=>card(ctx,k,10,LH-10,250,rows,{up:true});
L.chaos={
  goals:{
    bio:['How a system can follow exact physics and still be unpredictable','Why a tiny starting difference can grow until it takes over','Why gentle swings stay predictable and wild swings don’t','Why a 3-day forecast is solid and a 3-week forecast is a guess'],
    honors:['Why energy is still conserved in chaotic motion','How the time to diverge depends on the starting difference'],
    ap:['How separation grows exponentially on a log scale','How a Poincaré section shows chaos as a scattered cloud']},
  matters:'Weather, traffic jams, the stock market and three-body orbits all follow rules, yet they can’t be forecast far ahead. Chaos is why a weather app is honest when it shows less confidence for next week.',
  startKey:'start',startRun:false,
  steps:[
    {key:'two',title:'A pendulum on a pendulum',pause:true,focus:[190,5,420,420],
     see:'Two 1 m arms hinged together, each with a heavy bob. Both arms start raised to 120°.',
     why:'There are really two double pendulums drawn on top of each other. Copy B starts 0.01° different from copy A, far less than you could ever see or measure.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[190,5,420,420],tau);}},
    {key:'together',title:'At first they move as one',speed:0.25,focus:[190,5,420,420],
     see:'Release them, in slow motion.',
     why:'For the first few swings you can’t tell them apart: the same physics applied to almost the same start gives almost the same motion. After 5 seconds the lower bobs are still less than 1 cm apart.',
     overlay(sim,ctx,LH,k){chCard(ctx,k,LH,[[FL(sim,'sep',2),{w:800,c:GREEN}]]);}},
    {key:'snowball',title:'The difference snowballs',speed:1,focus:[10,10,250,70],
     see:'Watch the distance between the bobs.',
     why:'Every time the lower arm whips over the top, the small difference gets multiplied. By about 7 s they are 10 cm apart, and soon after they are doing completely different things, meters apart.',
     overlay(sim,ctx,LH,k){chCard(ctx,k,LH,[[FL(sim,'sep',1),{w:800,c:RED}],[FL(sim,'maxSep',0)]]);}},
    {key:'trace',title:'Trace art',speed:2,focus:[190,5,420,420],
     see:'Watch the trails each lower bob leaves.',
     why:'Two paths that began together now look nothing alike, even though the physics is identical for both. Nothing random happened: the motion is fully determined, just impossible to forecast far ahead.',
     overlay(sim,ctx,LH,k){chCard(ctx,k,LH,[[FL(sim,'maxSep',0),{w:800}]]);}},
    {key:'hook',title:'Your question: wild swings vs gentle ones',set:{th1:10,th2:10},fresh:true,speed:2,focus:[190,5,420,420],
     see:'Same 0.01° difference, but both arms start at only 10°. Let it run 20 seconds.',
     why:'Started at 120°, the bobs are 10 cm apart by about 7 s and up to 3.8 m apart by 10 s. Started at 10°, they are still within 0.03 cm after 20 s. Big, wild swings are chaotic; gentle ones stay predictable. Weather is like the wild swings.',
     overlay(sim,ctx,LH,k){chCard(ctx,k,LH,[[FL(sim,'maxSep',2),{w:800,c:GREEN}]]);}},
    {key:'energy',lvl:'honors',title:'Energy is still conserved',set:{th1:120,th2:120},fresh:true,speed:1,focus:[540,10,250,70],
     see:'Back to 120°. Watch the total energy while the motion goes wild.',
     why:'With no friction, total energy stays constant. Chaos doesn’t break the laws of physics; it means tiny uncertainties grow too fast to forecast.',
     overlay(sim,ctx,LH,k){chCard(ctx,k,LH,[[FL(sim,'E',3),{w:800,c:GREEN}]]);}},
    {key:'single',title:'Compare: a single pendulum',set:{mode:'single'},fresh:true,speed:1,focus:[280,95,240,240],
     see:'A single pendulum, started the same way, with the same tiny difference.',
     why:'Its copies stay within a centimeter, because its swing repeats like a clock. Predictable systems keep small errors small. That is why tides and eclipses can be forecast years ahead, but weather can’t.',
     overlay(sim,ctx,LH,k){chCard(ctx,k,LH,[[FL(sim,'maxSep',2),{w:800,c:GREEN}]]);}},
    {key:'smaller',lvl:'ap',title:'Measure 100× better',set:{delta:'0.0001'},fresh:true,speed:1.5,focus:[10,10,250,70],
     see:'Make the starting difference 100 times smaller: 0.0001°.',
     why:'The copies stay together only a few seconds longer. The separation grows roughly exponentially, so each 100× improvement in measurement buys the same small extra time. Forecasters can’t measure their way out of chaos.',
     overlay(sim,ctx,LH,k){chCard(ctx,k,LH,[[FL(sim,'tdiv',1),{w:800,c:RED}],[FL(sim,'lsep',1)]]);}}
  ],
  useIt:[
    {do:'Trust a weather forecast for the next 3 days much more than one for 10 days out.',why:'The atmosphere is chaotic. Small errors in today’s measurements grow until a forecast past about a week is barely better than averages.'},
    {do:'Look at the “chance of rain” number, not just the icon.',why:'Forecasters run many slightly different starts, like copies A and B. The percentage is how many of those runs gave rain.'},
    {do:'Plan a ski trip or outdoor game with a backup date.',why:'Mountain weather is especially hard to forecast; a plan B respects the chaos.'}],
  tryIt:[{title:'the dropped-paper test (5 minutes)',steps:['Drop a flat sheet of paper from the same height and the same hand position five times.','Mark where it lands each time.'],look:'It lands somewhere different each time, even though you tried to drop it the same way. Tiny differences in the start, too small to control, grow as it flutters down.'}]};
R.chaos={questions:[
  {id:'determined',kind:'test',lvl:'bio',q:'The double pendulum follows Newton’s laws exactly. Why can’t you predict it far ahead?',choices:['Tiny starting differences grow until they take over','It has a small hidden random part built into how it moves','Newton’s laws stop working at large angles','Friction makes each swing different'],correct:0,
   steps:['The motion is fully set by the start.','But no start can be known perfectly.','In chaotic motion, small errors grow fast, so forecasts fail.']},
  {id:'gentle',kind:'test',lvl:'bio',q:'Both arms start at only 10°, with copies 0.01° apart. After 20 seconds?',choices:['They stay together','They move completely differently','One stops while the other keeps going','They swap places every few seconds'],correct:0,
   steps:['Small swings behave almost like simple pendulums.','Their motion repeats regularly.','So small differences stay small.']},
  {id:'weather',kind:'real',lvl:'bio',q:'Why do weather forecasts lose accuracy after about a week?',choices:['Small measurement errors grow in the chaotic atmosphere','Satellites only collect a week of weather data at a time','Weather is random and follows no rules','Forecasters only update their models weekly'],correct:0,
   steps:['The atmosphere follows physics but is chaotic.','Measurement errors are unavoidable.','They grow until a long forecast is mostly guesswork.']},
  {id:'energy',kind:'test',lvl:'honors',q:'With no friction, what happens to the double pendulum’s total energy during chaotic motion?',choices:['It stays the same','It grows as the motion gets wild','It slowly drains away','It jumps up and down at random'],correct:0,
   steps:['Without friction, nothing removes energy.','Kinetic and potential energy trade back and forth.','The total stays constant; chaos doesn’t break conservation.']},
  {id:'single',kind:'test',lvl:'honors',q:'A single pendulum starts at 120°, with copy B 0.01° away. After 20 seconds?',choices:['Still together, since its motion repeats','Far apart, since it started high','Apart, then back together every swing','One copy stops, the other speeds up'],correct:0,
   steps:['A single pendulum’s swing repeats like a clock.','Repeating motion keeps errors from growing much.','The copies stay within a centimeter.']},
  {id:'better',kind:'test',lvl:'ap',q:'You make the starting difference 100× smaller. How much longer do the copies stay within 10 cm?',choices:['Only a few seconds longer','100 times longer','Forever, since they now start the same','About twice as long'],correct:0,
   steps:['Separation grows roughly exponentially.','100× smaller start needs only ln(100) more e-foldings.','That’s a few seconds, not 100× the time.']}
]};

/* ---------- shotspotter ---------- */
const ssCard=(ctx,k,LH,rows)=>card(ctx,k,16,LH-14,268,rows,{up:true});
L.shotspotter={
  goals:{
    bio:['How far sound travels in a second','How a time difference turns into a distance difference','Why microphones spread out locate a bang better','Why timing tells where a sound came from, not what made it'],
    honors:['Why each pair of microphones puts the source on a hyperbola','How echoes and temperature move the answer','How base rates decide what share of alerts are real'],
    ap:['How a timing error scales into a location error']},
  matters:'The thunder count you do in a storm, a city’s gunshot-detection microphones and an earthquake’s location all use the same math: sound or waves travel at a steady speed, so a time difference is a distance difference.',
  startKey:'start',startRun:true,
  steps:[
    {key:'bang',title:'A bang in the city',run:tour('shotspotter','A bang in the city'),speed:1,focus:[8,8,526,436],
     see:'A loud bang goes off somewhere in a city. Four microphones, A to D, sit on rooftops. The circle is the sound spreading out.',
     why:'Sound spreads at about 343 m/s in every direction. Whichever microphone it reaches first is closest, and the gaps between arrival times hold the location.',
     overlay(sim,ctx,LH,k){ssCard(ctx,k,LH,[[FL(sim,'first'),{w:700}]]);}},
    {key:'first',title:'Nearest hears it first',speed:1,focus:[540,8,255,150],
     see:'Read the arrival times in the list.',
     why:'The closest microphone hears it first and the farthest last. Each time is counted from the first arrival, so the list shows only differences: no one knows exactly when the bang happened.',
     overlay(sim,ctx,LH,k){ssCard(ctx,k,LH,[[FL(sim,'dtAB',0),{w:700}]]);}},
    {key:'turn',title:'Your turn: how much closer?',run:tour('shotspotter','Your turn'),pause:true,focus:[540,8,255,436],
     see:'Read the arrival times for A and B. How many meters closer is the bang to the one that heard it first?',
     why:'Sound covers 343 m every second, so distance difference = 343 × time difference. Try it, then press Next.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[540,8,255,150],tau);}},
    {key:'curve',title:'One time difference, one curve',run:tour('shotspotter','One time difference'),pause:true,focus:[8,8,526,436],
     see:'The answer, and the blue curve it draws.',
     why:'Mic B heard it 0.537 s sooner, so the bang is 343 × 0.537 = 184 m closer to B than to A. Every point that is 184 m closer to B than to A lies on one curve, a hyperbola. The bang is somewhere on it.',
     overlay(sim,ctx,LH,k){ssCard(ctx,k,LH,[[FL(sim,'dAB',0),{w:800,c:GREEN}]]);}},
    {key:'cross',title:'Curves cross at the bang',run:tour('shotspotter','Curves cross'),pause:true,focus:[8,8,526,436],
     see:'Each pair of microphones adds a curve.',
     why:'Where the curves cross is the answer. With perfect timing, the X lands right on the bang. That’s how three or more listeners locate one sound.',
     overlay(sim,ctx,LH,k){ssCard(ctx,k,LH,[[FL(sim,'err',1),{w:800,c:GREEN}]]);}},
    {key:'hook',title:'Your question: the firework',run:tour('shotspotter','Where is not what'),pause:true,focus:[8,8,526,436],
     see:'Now a firework, located the same way.',
     why:'You see a burst and hear it 1.5 s later: 343 × 1.5 = 514.5 m away, about half a kilometer. A friend hears it 0.40 s before you: they are 343 × 0.40 = 137.2 m closer. A third listener adds a second curve, and the curves cross at the burst. The math finds a firework just as well as a gunshot: timing tells where, not what.',
     overlay(sim,ctx,LH,k){ssCard(ctx,k,LH,[['343 × 1.5 = 514.5 m',{w:800}],['343 × 0.40 = 137.2 m closer',{w:700,c:GREEN}]]);}},
    {key:'jitter',title:'Timing errors',run:tour('shotspotter','Timing errors'),pause:true,focus:[8,8,526,436],
     see:'The microphones are bunched on one block, and each clock is off by about 3 ms.',
     why:'The curves no longer meet at one point. With bunched microphones, small timing errors swing the curves a lot. Spread-out microphones keep the same errors from mattering as much.',
     overlay(sim,ctx,LH,k){ssCard(ctx,k,LH,[[FL(sim,'err',1),{w:800,c:RED}]]);}},
    {key:'echo',title:'Echoes fool the timing',run:tour('shotspotter','Echoes fool the timing'),pause:true,focus:[8,8,526,436],
     see:'A building blocks mic B’s direct path, so it hears an echo that traveled 60 m farther.',
     why:'One late arrival drags the fit tens of meters away. Real systems have to guess which arrivals are echoes, one reason a location can be wrong.',
     overlay(sim,ctx,LH,k){ssCard(ctx,k,LH,[[FL(sim,'err',0),{w:800,c:RED}]]);}},
    {key:'alerts',lvl:'honors',title:'Alerts and base rates',run:tour('shotspotter','Alerts and base rates'),pause:true,focus:[8,8,784,436],
     see:'1,000 loud bangs, 100 of them gunfire. The system flags 90% of gunfire and wrongly flags 5% of the rest.',
     why:'90 true alerts and 45 false ones: 45 of the 135 alerts are not gunfire. The rarer gunfire is among loud bangs, the larger that share. Each false alert sends officers to a block with no gunfire, so the base rate matters.',
     overlay(sim,ctx,LH,k){ssCard(ctx,k,LH,[[FL(sim,'ppv',0),{w:800}],[FL(sim,'falseA',0),{w:700,c:RED}]]);}}
  ],
  useIt:[
    {do:'Count seconds between lightning and thunder, and divide by 3 for kilometers (or 5 for miles).',why:'Sound covers about 1 km every 3 seconds. If the gap is under 30 seconds, get indoors.'},
    {do:'When a story says a sensor “detected” something, ask how often it’s wrong.',why:'Even a good sensor sends many false alerts when the real event is rare, as the base rates showed.'},
    {do:'Use a fireworks bang to estimate how far away a show is.',why:'Time from the flash to the boom × 343 m/s gives the distance in meters.'}],
  tryIt:[{title:'the clap echo (5 minutes, near a big wall)',steps:['Stand about 50 big steps (about 40 m) from a large flat wall.','Clap once and listen for the echo. Try timing several claps to the echo rhythm.'],look:'The echo comes back about a quarter of a second later: 80 m round trip ÷ 343 m/s. Sound’s steady speed turns distance into time.'}]};

/* ---------- oximeter ---------- */
const oxCard=(ctx,k,LH,rows)=>card(ctx,k,24,LH-14,340,rows,{up:true});
L.oximeter={
  goals:{
    bio:['How two colors of light read the oxygen in your blood','Why oxygen-poor blood absorbs more red light','How the ratio R becomes the number on the screen','Why who a device was calibrated on is part of the result'],
    honors:['Why dividing each pulse by the steady light cancels a thick finger or dim LED','What occult hypoxemia is'],
    ap:['How Beer–Lambert explains why AC/DC ignores steady absorbers']},
  matters:'Pulse oximeters are clipped on fingers in every clinic, ambulance and many homes. Knowing how the number is made, and when it can be wrong, can change when someone gets oxygen or care.',
  startKey:'start',startRun:true,
  steps:[
    {key:'two',title:'Two colors of light',run:tour('oximeter','Two colors of light'),speed:1,focus:[[20,14,350,345],[400,18,385,165]],
     see:'The clip shines red (660 nm) and infrared (940 nm) light through a fingertip. Watch the wave on the screen.',
     why:'With every heartbeat the artery swells with a little more blood, which absorbs a little more light. The wave is that tiny dip, about 2% of the light. Infrared is invisible; it is drawn purple here.',
     overlay(sim,ctx,LH,k){oxCard(ctx,k,LH,[[FL(sim,'acR',2)],[FL(sim,'acI',2)]]);}},
    {key:'color',title:'Oxygen changes the light absorbed',run:tour('oximeter','Oxygen changes'),speed:1,focus:[20,14,350,345],
     see:'The blood’s oxygen drops to 85%. Watch the red beam.',
     why:'Oxygen-poor hemoglobin soaks up red light about 10 times as strongly as oxygen-rich hemoglobin. As oxygen falls, each beat dims the red light more, while the infrared changes only a little.',
     overlay(sim,ctx,LH,k){oxCard(ctx,k,LH,[[FL(sim,'acR',2),{w:800,c:RED}],[FL(sim,'acI',2)]]);}},
    {key:'ratio',title:'The ratio of ratios',speed:1,focus:[400,190,385,255],
     see:'Look at the two pulse sizes, red and infrared, in the panel.',
     why:'The device divides each pulse by the steady light (AC/DC), then compares red with infrared: R = red AC/DC ÷ infrared AC/DC. A bigger red pulse means a bigger R and less oxygen. A calibration curve, SpO₂ ≈ 110 − 25R, turns R into a percentage.',
     overlay(sim,ctx,LH,k){oxCard(ctx,k,LH,[['R = red AC/DC ÷ infrared AC/DC',{w:800}],['SpO₂ ≈ 110 − 25R',{w:700}]]);}},
    {key:'turn',title:'Your turn: compute R',run:tour('oximeter','Your turn'),pause:true,focus:[400,190,385,255],
     see:'A new finger: blood really at 90%, light skin. Compute R = red ÷ infrared from the two pulses.',
     why:'Divide, then put R into 110 − 25R. Try it, then press Next.',
     overlay(sim,ctx,LH,k){oxCard(ctx,k,LH,[[FL(sim,'acR',2)],[FL(sim,'acI',2)]]);}},
    {key:'math',title:'The math',set:{sat:90,mel:0,calib:'narrow',perf:2},run:tour('oximeter','The math'),pause:true,focus:[[400,18,385,165],[400,190,385,255]],
     see:'The answer, on the screen.',
     why:'R = 1.60 ÷ 2.00 = 0.80. The curve gives 110 − 25 × 0.80 = 90%, and for this finger the screen matches the truth.',
     overlay(sim,ctx,LH,k){oxCard(ctx,k,LH,[[FL(sim,'R',2)],[FL(sim,'read',0),{w:800,c:GREEN}]]);}},
    {key:'hook',title:'Your question: 93% that is really 85%',run:tour('oximeter','Melanin absorbs light too'),pause:true,focus:[[20,14,350,345],[400,190,385,255]],
     see:'Blood at 85% in a finger with a lot of melanin (10 of 10), on a device calibrated on mostly light-skinned people.',
     why:'In this model R comes out 0.68, and 110 − 25 × 0.68 = 93%: a reading that looks fine for blood that needs attention. A true level below 88% with a reading of 92–96% is occult hypoxemia. A 2020 study found it about 3 times as often in Black patients as in white patients.',
     overlay(sim,ctx,LH,k){oxCard(ctx,k,LH,[[FL(sim,'true',0)],[FL(sim,'read',0),{w:800,c:RED}],[FL(sim,'err',0)]]);}},
    {key:'diverse',title:'Calibrate on everyone',set:{sat:85,mel:10,calib:'diverse'},run:tour('oximeter','Calibrate on everyone'),pause:true,focus:[400,190,385,255],
     see:'The same finger on a device calibrated on a diverse group.',
     why:'The leftover error is smaller: it reads 87% for a true 85%. In 2025 the FDA proposed testing oximeters on 150 or more people with a range of measured skin tones. Who the curve was fit on is part of the result.',
     overlay(sim,ctx,LH,k){oxCard(ctx,k,LH,[[FL(sim,'read',0),{w:800,c:GREEN}],[FL(sim,'err',0)]]);}},
    {key:'bl',lvl:'ap',title:'Why AC/DC cancels steady absorbers',set:{sat:85,mel:10,calib:'narrow'},run:tour('oximeter','Why AC/DC'),pause:true,focus:[400,190,385,255],
     see:'Back to the narrow calibration. Read how much red light reaches the detector.',
     why:'Beer–Lambert gives T = 10^(−A). Steady absorbers like skin, bone and melanin multiply both the pulsing and steady light by the same factor, so AC/DC ignores them. Melanin cuts red light here from 10% to 1%, yet in the pure model R wouldn’t change. The offset stands in for real effects the simple model leaves out.',
     overlay(sim,ctx,LH,k){oxCard(ctx,k,LH,[[FL(sim,'tR',1)],[FL(sim,'tI',1)]]);}}
  ],
  useIt:[
    {do:'Warm cold hands and stay still before trusting a home oximeter reading.',why:'A weak pulse in a cold finger and movement both make the AC signal small or noisy, which makes R unreliable.'},
    {do:'Take symptoms seriously even when the oximeter number looks fine.',why:'Shortness of breath, confusion or bluish lips matter. A reading can be several points high, more often for people with darker skin.'},
    {do:'Remove dark nail polish on the finger being measured.',why:'Polish absorbs light the device didn’t plan for, which can throw off the reading.'}],
  tryIt:[{title:'the flashlight finger (2 minutes, dark room)',steps:['Press a phone flashlight against the back of a fingertip in a dark room.','Look at the glow coming through, and watch closely for a faint pulse.'],look:'Red light makes it through your finger; other colors mostly don’t. With a steady hand you may see a faint flicker with your heartbeat, the same signal the oximeter measures.'}]};
BioLab.addLearn(L);
Object.keys(R).forEach(id=>{const d=DEF(id);if(d&&d.review&&d.review.questions&&d.review.questions.length)delete R[id];});
BioLab.addReview(R);
})();
