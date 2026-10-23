(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,FONT,axes,legend}=BioLab.h;

/* Special relativity: time dilation, length contraction, muons and the twin trip.
   γ = 1/√(1 − v²/c²). A moving clock ticks slow by γ (as measured by us); a moving object is shorter by 1/γ along its motion.
   Light clock: mirrors L = 1.5 m apart, so one tick at rest is 2L/c ≈ 10.0 ns.
   Muons: made about 15 km up, mean lifetime τ = 2.197 µs in their own frame.
   Twin trip: out to a star D light-years away and back at speed v; Earth time 2D/v, traveler time 2D/(vγ). */
const C=2.998e8,TAU=2.197e-6,HATM=15000,LCLK=1.5,L0=100,DAY=86400;
const CRAFT={jet:{v:250,l:'jet airliner'},iss:{v:7660,l:'space station'},probe:{v:192000,l:'Parker Solar Probe'}};
const SUP={'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
const sup=n=>String(n).split('').map(c=>SUP[c]||c).join('');
function sci(x,d){if(!x)return '0';let e=Math.floor(Math.log10(Math.abs(x))),m=x/Math.pow(10,e);if(Math.abs(+m.toFixed(d))>=10){e++;m=x/Math.pow(10,e);}return m.toFixed(d)+' × 10'+sup(e);}
const B=sim=>sim.p.craft&&CRAFT[sim.p.craft]?CRAFT[sim.p.craft].v/C:sim.p.beta;
const gam=b=>1/Math.sqrt(1-b*b);
/* γ − 1, accurate even for everyday speeds */
const gm1=b=>{const r=Math.sqrt(1-b*b);return b*b/(r*(1+r));};
function fmtTime(s){if(s<1e-6)return (s*1e9).toFixed(s<1e-8?2:1)+' ns';if(s<1e-3)return (s*1e6).toFixed(1)+' µs';if(s<1)return (s*1e3).toFixed(1)+' ms';if(s<60)return s.toFixed(1)+' s';if(s<3600)return (s/60).toFixed(1)+' min';return (s/3600).toFixed(1)+' h';}
function fmtYears(y){if(y<1000)return y.toFixed(1)+' years';if(y<1e6)return Math.round(y).toLocaleString('en-US')+' years';if(y<1e9)return (y/1e6).toFixed(1)+' million years';return (y/1e9).toFixed(1)+' billion years';}
function speedText(b){const v=b*C;if(b>=0.001)return b.toFixed(3)+' c';if(v>=1000)return (v/1000).toFixed(v<1e4?2:0)+' km/s';return Math.round(v)+' m/s';}
function gText(b){const g1=gm1(b);if(g1<1e-3)return g1?'1 + '+sci(g1,1):'1 (exactly)';return gam(b).toFixed(3);}

function model(sim){const b=B(sim),g=gam(b),g1=gm1(b),D=sim.p.dist;
  const lamNo=b*C*TAU,lamDil=lamNo*g;
  return {b,g,g1,D,lag:DAY*g1/g,tick:2*LCLK/C*1e9*g,len:L0/g,
    surv:b>0?100*Math.exp(-HATM/lamDil):0,lnNo:b>0?-HATM/lamNo:-Infinity,lamNo,lamDil,
    tE:b>0?2*D/b:0,tT:b>0?2*D/b/g:0,en:g1*C*C,atm:HATM/1000/g};}
function noDilText(M){if(M.b<=0)return 'none (not moving)';const l10=M.lnNo/Math.LN10;if(l10>-3)return (100*Math.exp(M.lnNo)).toFixed(1)+'%';
  if(l10>-12){const n=Math.exp(-M.lnNo);return '1 in '+(n>=1e9?(n/1e9).toFixed(1)+' billion':n>=1e6?(n/1e6).toFixed(1)+' million':Math.round(n).toLocaleString('en-US'));}if(l10<-1000)return 'essentially none';return '1 in 10'+sup(Math.round(-l10));}

/* stage constants */
const VC=240,T0=1,MTOP=76,MBOT=410,MPX=(MBOT-MTOP)/HATM,COLS=[{x0:100,x1:330},{x0:400,x1:630}];

const SIM={
  id:'relativity',hash:'relativity',apUnit:13,order:3,prereq:['motion1d'],
  tab:'Special relativity',kind:'Go further',
  card:'Speed up a light clock, a spaceship, falling muons and a space-traveling twin toward light speed and watch time and length stretch.',
  title:'Special relativity: clocks, lengths and muons',
  lede:{bio:'Light always moves at the same speed for everyone. That one fact means moving clocks tick slow and moving objects get shorter, but only near light speed.',
    honors:'From a light clock to cosmic-ray muons: the time-stretch factor γ = 1/√(1 − v²/c²) controls time dilation, length contraction and the twin paradox.',
    ap:'Δt = γΔτ and L = L₀/γ. Test them on muons from both frames, compare proper time on a spacetime diagram, and see why no mass reaches c.'},
  scale:'Light speed c = 3.00 × 10⁸ m/s. The light clock’s mirrors are 1.5 m apart, so one tick takes 10 ns; the animation runs about 100 million times slower.',
  timeless:true,animated:true,chChange:0.6,chReveal:3,
  controls:[
    {id:'scene',label:'Scene',type:'seg',def:'clock',options:[{v:'clock',l:'Light clock'},{v:'length',l:'Length'},{v:'muon',l:'Muons'},{v:'twins',l:'Twin trip'}]},
    {id:'beta',label:'Speed (fraction of light speed c)',type:'range',min:0,max:0.999,step:0.001,def:0.6,unit:' c',d:3,help:'0.5 c is half of light speed: 150,000 km every second.'},
    {id:'craft',label:'Or pick a real traveler',type:'select',def:'slider',options:[{v:'slider',l:'Use the speed slider'},{v:'jet',l:'Jet airliner (250 m/s)'},{v:'iss',l:'Space station (7.66 km/s)'},{v:'probe',l:'Parker Solar Probe (192 km/s)'}],help:'Real travelers override the slider. Choose “Use the speed slider” to go back.'},
    {id:'dist',label:'Twin trip: distance to the star',type:'range',min:1,max:30,step:0.5,def:10,unit:' ly',d:1,help:'Used by the Twin trip scene. One light-year is the distance light goes in a year.'}
  ],
  init(sim){return {T:0,tau:0,tx:120,trail:[],sx:100,mu:[],bursts:[],made:[0,0],ground:[0,0],spawn:0,r:rng(11)};},
  step(sim,dt){const s=sim.st,M=model(sim);dt=Math.min(dt,0.25);s.T+=dt;s.tau+=dt/M.g;
    /* light clock on the train */
    s.tx+=M.b*VC*dt;if(s.tx>740){s.tx=60;s.trail=[];}
    const ph=(s.tau%T0)/T0;s.trail.push([s.tx,ph<0.5?386-240*ph:266+240*(ph-0.5)]);if(s.trail.length>600)s.trail.shift();
    /* ship */
    const w=600/M.g;if(M.b<0.002)s.sx=100;else{s.sx+=M.b*VC*dt;if(s.sx>800)s.sx=-w;}
    /* muons */
    if(sim.p.scene==='muon'){s.spawn+=dt*9;while(s.spawn>=1){s.spawn-=1;[0,1].forEach(c=>{if(s.mu.length>=140)return;const lam=c?M.lamDil:M.lamNo,d=lam>0?-lam*Math.log(1-s.r()*0.999999):0;
        s.mu.push({c,x:COLS[c].x0+16+s.r()*(COLS[c].x1-COLS[c].x0-32),m:0,d});s.made[c]++;});}
      for(let i=s.mu.length-1;i>=0;i--){const u=s.mu[i];u.m+=HATM/3*dt;if(u.m>=u.d&&u.d<HATM){s.bursts.push({x:u.x,y:MTOP+u.d*MPX,life:0.6});s.mu.splice(i,1);}else if(u.m>=HATM){s.ground[u.c]++;s.bursts.push({x:u.x,y:MBOT,life:0.6,g:1});s.mu.splice(i,1);}}}
    for(let i=s.bursts.length-1;i>=0;i--){s.bursts[i].life-=dt;if(s.bursts[i].life<=0||s.bursts.length>80)s.bursts.splice(i,1);}},
  metrics:[
    {id:'g',label:'Time-stretch factor γ (gamma)',d:3,min:1,get:s=>model(s).g},
    {id:'lag',label:'Moving clock falls behind by',text:true,noTrial:true,get(s){const M=model(s);return M.b<=0?'nothing (not moving)':fmtTime(M.lag)+' per day';}},
    {id:'tick',label:'One tick of the moving light clock (we measure)',unit:'ns',d:2,get:s=>model(s).tick},
    {id:'len',label:'Length of the 100 m ship (we measure)',unit:'m',d:1,min:0,max:100,get:s=>model(s).len},
    {id:'surv',label:'Muons reaching the ground',unit:'%',d:1,min:0,max:100,lvl:'honors',get:s=>model(s).surv},
    {id:'nodil',label:'Muons reaching the ground if clocks did not slow',text:true,lvl:'honors',noTrial:true,get:s=>noDilText(model(s))},
    {id:'tE',label:'Earth twin ages (round trip)',text:true,noTrial:true,get(s){const M=model(s);return M.b<=0?'no trip (speed is 0)':fmtYears(M.tE);}},
    {id:'tT',label:'Traveling twin ages',text:true,noTrial:true,get(s){const M=model(s);return M.b<=0?'no trip (speed is 0)':fmtYears(M.tT);}},
    {id:'v',label:'Speed',unit:'× 10⁸ m/s',d:4,lvl:'ap',get:s=>model(s).b*C/1e8},
    {id:'atm',label:'Atmosphere depth in the muon’s frame',unit:'km',d:2,lvl:'ap',get:s=>model(s).atm},
    {id:'en',label:'Energy to reach this speed, per kg (γ − 1)mc²',text:true,lvl:'ap',noTrial:true,get:s=>sci(model(s).en,2)+' J'}
  ],
  graphs:[{id:'gamma',label:'γ vs speed',custom:true},{id:'muon',label:'Muons left vs distance fallen',lvl:'honors',custom:true},
    {id:'ages',label:'Twin trip: both clocks over the trip',lvl:'honors',custom:true},{id:'st',label:'Spacetime diagram of the twin trip',lvl:'ap',custom:true}],
  defaultGraph:'gamma',
  plot(sim,ctx,box,id){const M=model(sim);
    if(id==='gamma'){const ax=axes(ctx,box,{xmin:0,xmax:1,ymin:0,ymax:10,xl:'Speed (fraction of c)',yl:'γ'});
      ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();ctx.strokeStyle=PAL['g-line'];ctx.lineWidth=2.5;ctx.beginPath();
      for(let i=0;i<=400;i++){const b=Math.min(0.9995,i/400*0.9995),g=gam(b);i?ctx.lineTo(ax.X(b),ax.Y(g)):ctx.moveTo(ax.X(b),ax.Y(g));}ctx.stroke();ctx.restore();
      ctx.setLineDash([4,4]);ctx.strokeStyle=PAL['muted'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(ax.X(1),box.T);ctx.lineTo(ax.X(1),box.T+box.H);ctx.stroke();ctx.setLineDash([]);
      txt(ctx,'c: γ → ∞',ax.X(1)-6,box.T+14,{s:13,c:PAL['muted'],a:'right'});
      const yy=Math.min(M.g,10);ctx.fillStyle=PAL['g-dot'];ctx.beginPath();ctx.arc(ax.X(M.b),ax.Y(yy),6,0,6.29);ctx.fill();
      const lab='γ = '+gText(M.b)+(M.g>10?' (off the top)':'');txt(ctx,lab,clamp(ax.X(M.b)-10,box.L+150,box.L+box.W-20),Math.max(box.T+34,ax.Y(yy)-12),{s:13,w:600,c:PAL['cv-ink'],a:'right'});
      txt(ctx,'everyday speeds: γ = 1',box.L+8,ax.Y(1)-8,{s:12,c:PAL['muted']});return;}
    if(id==='muon'){box.T=34;box.H-=22;const ax=axes(ctx,box,{xmin:0,xmax:15,ymin:0,ymax:100,xl:'Distance fallen from 15 km up (km)',yl:'Muons left (%)'});
      const line=(lam,col,dash)=>{ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.setLineDash(dash?[6,4]:[]);ctx.beginPath();for(let i=0;i<=150;i++){const d=i/10,v=lam>0?100*Math.exp(-d*1000/lam):0;i?ctx.lineTo(ax.X(d),ax.Y(v)):ctx.moveTo(ax.X(d),ax.Y(v));}ctx.stroke();ctx.setLineDash([]);};
      line(M.lamNo,PAL['s4'],true);line(M.lamDil,PAL['s2'],false);
      legend(ctx,box.L,14,[{label:'with time dilation (real)',color:PAL['s2']},{label:'if clocks did not slow',color:PAL['s4'],dash:true}]);
      txt(ctx,M.surv.toFixed(1)+'% reach the ground',box.L+box.W-4,ax.Y(M.surv)-8,{s:13,w:600,c:PAL['s2'],a:'right'});return;}
    if(id==='ages'){if(M.b<=0){txt(ctx,'Speed is 0, so the trip never happens.',box.L+box.W/2,box.T+box.H/2,{s:14,c:PAL['muted'],a:'center'});return;}
      box.T=34;box.H-=22;const ax=axes(ctx,box,{xmin:0,xmax:M.tE,ymin:0,ymax:M.tE,xl:'Time on Earth’s clocks (years)',yl:'Years each twin has aged'});
      ctx.lineWidth=2.5;ctx.strokeStyle=PAL['s3'];ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(0));ctx.lineTo(ax.X(M.tE),ax.Y(M.tE));ctx.stroke();
      ctx.strokeStyle=PAL['s5'];ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(0));ctx.lineTo(ax.X(M.tE),ax.Y(M.tT));ctx.stroke();
      legend(ctx,box.L,14,[{label:'Earth twin',color:PAL['s3']},{label:'traveling twin',color:PAL['s5']}]);
      txt(ctx,fmtYears(M.tT),ax.X(M.tE)-6,ax.Y(M.tT)-10,{s:13,w:600,c:PAL['s5'],a:'right'});return;}
    if(id==='st'){if(M.b<=0){txt(ctx,'Speed is 0: both twins stay home, a single vertical worldline.',box.L+box.W/2,box.T+box.H/2,{s:14,c:PAL['muted'],a:'center'});return;}
      box.T=34;box.H-=22;const T=M.tE,ax=axes(ctx,box,{xmin:0,xmax:T*1.05*box.W/box.H,ymin:0,ymax:T*1.05,xl:'Distance from Earth (light-years)',yl:'Earth time (years)'});
      ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();
      ctx.setLineDash([3,4]);ctx.strokeStyle=PAL['s4'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(0));ctx.lineTo(ax.X(T),ax.Y(T));ctx.moveTo(ax.X(M.D),ax.Y(M.D));ctx.lineTo(ax.X(0),ax.Y(2*M.D));ctx.stroke();ctx.setLineDash([]);
      ctx.strokeStyle=PAL['s3'];ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(ax.X(0)+2,ax.Y(0));ctx.lineTo(ax.X(0)+2,ax.Y(T));ctx.stroke();
      ctx.strokeStyle=PAL['s5'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(0));ctx.lineTo(ax.X(M.D),ax.Y(T/2));ctx.lineTo(ax.X(0),ax.Y(T));ctx.stroke();
      const step=Math.max(1,Math.pow(10,Math.ceil(Math.log10(M.tT/40))));ctx.fillStyle=PAL['s5'];
      for(let tau=step;tau<M.tT-1e-9;tau+=step){const tE=tau*M.g,x=tE<=T/2?M.D*tE/(T/2):M.D*(T-tE)/(T/2);ctx.beginPath();ctx.arc(ax.X(x),ax.Y(tE),3,0,6.29);ctx.fill();}
      const stepE=Math.max(1,Math.pow(10,Math.ceil(Math.log10(T/40))));ctx.fillStyle=PAL['s3'];for(let t=stepE;t<T;t+=stepE){ctx.beginPath();ctx.arc(ax.X(0)+2,ax.Y(t),3,0,6.29);ctx.fill();}
      ctx.restore();
      legend(ctx,box.L,14,[{label:'Earth twin',color:PAL['s3']},{label:'traveler',color:PAL['s5']},{label:'light',color:PAL['s4'],dash:true}]);
      txt(ctx,'dots: every '+step+(step===1?' year':' years')+' of each twin’s own time',box.L+box.W,box.T+box.H-8,{s:12,c:PAL['muted'],a:'right'});}},
  narrate(sim){const M=model(sim),sc=sim.p.scene,gt=gText(M.b),sp=speedText(M.b);
    const tiny=M.g1<1e-3;
    if(M.b<=0){if(sc==='twins')return 'The rocket is not moving, so the trip never starts. Raise the speed to send the twin to the star.';
      if(sc==='muon')return 'Muons need a speed near c to get anywhere before they decay. Raise the speed toward 0.998 c, the speed of real cosmic-ray muons.';
      return 'At rest, nothing stretches. Both light clocks tick together: light goes 1.5 m up and 1.5 m down, so one tick takes 10 ns.';}
    if(tiny&&sc!=='muon'&&sc!=='twins')return 'At '+sp+', γ = '+gt+'. The moving clock falls behind by only <b>'+fmtTime(M.lag)+' per day</b>: real, and measured with atomic clocks, but far too small to notice.';
    if(sc==='clock')return 'On the train, light must travel the longer slanted path, but light’s speed is the same for everyone, so each tick takes longer. At '+sp+' the train clock runs <b>γ = '+gt+' times slower</b>, as we measure it.';
    if(sc==='length')return 'We measure the 100 m ship as <b>'+M.len.toFixed(1)+' m</b> long, shortened along its motion by 1/γ. Its height does not change, and the crew still measures their ship as 100 m.';
    if(sc==='muon')return 'A muon lives about 2.2 µs in its own frame. At '+sp+' that would carry it only '+(M.lamNo/1000).toFixed(2)+' km on average, but its clock runs slow by γ = '+gt+', so it goes '+(M.lamDil/1000).toFixed(1)+' km on average and <b>'+M.surv.toFixed(1)+'% reach the ground</b>.';
    return 'The round trip of 2 × '+M.D.toFixed(1)+' light-years at '+sp+' takes '+fmtYears(M.tE)+' on Earth’s clocks, but the traveler’s clock runs slow by γ = '+gt+', so the <b>traveler ages only '+fmtYears(M.tT)+'</b>.';},
  challenges:[
    {lvl:'bio',q:'The train speeds up from 0.30 c to 0.87 c. About how many times longer does each tick of the train’s light clock take, as we measure it?',choices:['About 1.1 times','About 2 times','About 8.7 times'],correct:1,
      baseline:{scene:'clock',beta:0.3},change:{beta:0.87},changeText:'Speed raised to 0.87 c',watch:'gamma',
      explain:{bio:'At 0.87 c, γ ≈ 2.0, so each tick takes about twice as long. The train clock looks half as fast to us. At 0.30 c, γ is only 1.05.',
        ap:'γ = 1/√(1 − 0.87²) = 1/√0.243 = 2.03. In the light clock the vertical light speed is c/γ, so Δt = γΔτ = 20.3 ns per tick.'}},
    {lvl:'bio',q:'A jet airliner flies at 250 m/s. How far behind does a clock on the jet fall in one day, because of its speed?',choices:['About an hour','About a second','A few billionths of a second'],correct:2,
      baseline:{scene:'clock',beta:0.5},change:{craft:'jet'},changeText:'Switched to a jet airliner',watch:'gamma',
      explain:{bio:'At everyday speeds γ is 1.0000000000003, so the jet clock loses only about 30 billionths of a second (30 ns) per day. Physicists measured this with atomic clocks flown on jets in 1971.',
        ap:'For v ≪ c, γ − 1 ≈ v²/2c² = 3.5 × 10⁻¹³, so the lag is 86,400 s × 3.5 × 10⁻¹³ ≈ 30 ns per day. (Gravity changes the rate too; this model leaves that out.)'}},
    {lvl:'bio',q:'Push the speed from 0.90 c toward 0.999 c. What happens to γ?',choices:['γ levels off near 10','γ keeps climbing faster and faster','γ drops back toward 1'],correct:1,
      baseline:{scene:'clock',beta:0.9},change:{beta:0.999},changeText:'Speed raised to 0.999 c',watch:'gamma',
      explain:{bio:'γ is 2.3 at 0.90 c but 22.4 at 0.999 c, and it heads to infinity as speed nears c. That is why nothing with mass can ever reach light speed: it would take infinite energy.',
        ap:'γ → ∞ as v → c, and kinetic energy (γ − 1)mc² goes with it. No finite energy brings a massive object to c.'}},
    {lvl:'honors',q:'Muons made 15 km up live only 2.2 µs. At 0.90 c almost none reach the ground. At 0.998 c, what happens?',choices:['Still almost none reach the ground','About a quarter reach the ground, because their clocks run slow','Every muon reaches the ground'],correct:1,
      baseline:{scene:'muon',beta:0.9},change:{beta:0.998},changeText:'Muon speed raised to 0.998 c',watch:'muon',
      explain:{honors:'Without relativity a 0.998 c muon goes only 0.66 km per lifetime, so about 1 in 8 billion would reach the ground. Its clock runs slow by γ = 15.8, so (from our view) it lives 35 µs and about 24% arrive. Real detectors on the ground do catch them.',
        ap:'Survival = e^(−t/γτ) with t = 15 km/(0.998 c) = 50.1 µs and γτ = 34.8 µs, giving e^(−1.44) ≈ 0.24. Without dilation it would be e^(−22.8) ≈ 1.2 × 10⁻¹⁰.'}},
    {lvl:'honors',q:'A ship that is 100 m long in its own frame flies past at 0.6 c. What length do we measure?',choices:['100 m','80 m','125 m'],correct:1,
      baseline:{scene:'length',beta:0.1},change:{beta:0.6},changeText:'Ship speed raised to 0.6 c',watch:'gamma',
      explain:{honors:'At 0.6 c, γ = 1.25, so we measure 100 m / 1.25 = 80 m. Only the length along the motion shrinks; the crew measures 100 m the whole time.',
        ap:'L = L₀/γ = L₀√(1 − v²/c²) = 100 m × 0.8. The proper length L₀ is measured in the ship’s rest frame and is the longest anyone measures.'}},
    {lvl:'honors',q:'A twin flies to a star 10 light-years away and back at 0.8 c. When the traveler returns…',choices:['Both twins have aged 25 years','The Earth twin aged 25 years; the traveler aged 15','The traveler aged 25 years; the Earth twin aged 15'],correct:1,
      baseline:{scene:'twins',dist:10,beta:0.5},change:{beta:0.8},changeText:'Trip speed set to 0.8 c',watch:'ages',
      explain:{honors:'Earth clocks: 20 ly ÷ 0.8 c = 25 years. The traveler’s clock runs slow by γ = 1.67, so the traveler ages 15 years. The trip is not symmetric: only the traveler turns around and changes frames.',
        ap:'Proper time along a worldline is Δτ = Δt/γ for each inertial leg: 2 × 12.5 yr × 0.6 = 15 yr. The traveler’s bent worldline has less proper time than Earth’s straight one.'}},
    {lvl:'ap',q:'Going from 0 to 0.99 c costs a lot of energy per kilogram. How does the energy for the extra step from 0.99 c to 0.999 c compare?',choices:['Much less, because the last step is tiny','About the same','More than twice as much'],correct:2,
      baseline:{scene:'clock',beta:0.99},change:{beta:0.999},changeText:'Speed raised to 0.999 c',watch:'gamma',
      explain:{ap:'KE = (γ − 1)mc². At 0.99 c, γ = 7.09, so KE = 6.09 mc² = 5.5 × 10¹⁷ J/kg. At 0.999 c, γ = 22.4, so KE = 21.4 mc². The last 0.009 c costs 15.3 mc², 2.5 times as much as everything before it.'}},
    {lvl:'ap',q:'A twin travels to a star 10 light-years away and back at 0.99 c. About how much does the traveler age?',choices:['About 20 years','About 2.8 years','About 0.2 years'],correct:1,
      baseline:{scene:'twins',dist:10,beta:0.6},change:{beta:0.99},changeText:'Trip speed set to 0.99 c',watch:'st',
      explain:{ap:'Earth time = 20 ly / 0.99 c = 20.2 yr. With γ = 7.09, the traveler’s proper time is 20.2/7.09 = 2.85 yr. On the spacetime diagram the traveler’s worldline hugs the light lines, and its proper-time dots spread far apart.'}},
    {lvl:'ap',q:'In the muon’s own frame at 0.998 c, its clock runs normally. How thick is the 15 km atmosphere that rushes past it?',choices:['15 km','About 0.95 km','About 237 km'],correct:1,
      baseline:{scene:'muon',beta:0.9},change:{beta:0.998},changeText:'Muon speed raised to 0.998 c',watch:'muon',
      explain:{ap:'In the muon frame the atmosphere is length-contracted: 15 km / 15.8 = 0.95 km, crossed in 3.2 µs of muon time, about 1.4 lifetimes. Both frames predict the same 24% survival: time dilation in ours, length contraction in its.'}}
  ],
  tour:[
    {lvl:'bio',title:'A light clock',text:'Light bounces between two mirrors 1.5 m apart. Each round trip is one tick: 10 billionths of a second. Here the train is not moving, so <b>both clocks tick together</b>.',
      focus:[[30,40,180,190],[0,236,800,190]],speed:0.5,setup(sim){BioLab.setValues(sim,{scene:'clock',craft:'slider',beta:0});BioLab.reset(sim);}},
    {lvl:'bio',title:'Set the train moving',text:'At 0.6 c, we see the light in the train’s clock take a <b>slanted path</b>. That path is longer, and light’s speed never changes, so each tick takes longer.',
      focus:[0,236,800,190],speed:0.5,setup(sim){BioLab.setValues(sim,{beta:0.6});BioLab.reset(sim);}},
    {lvl:'bio',title:'Counting ticks',text:'Compare the tick counts. At 0.87 c the train clock ticks about <b>half as often</b> as yours: γ ≈ 2. This is time dilation.',
      focus:[[230,40,560,170],[0,0,400,40]],speed:0.6,setup(sim){BioLab.setValues(sim,{beta:0.87});BioLab.reset(sim);}},
    {lvl:'bio',title:'Everyday speeds',text:'A jet at 250 m/s gives γ = 1.0000000000003. Its clock falls behind by about <b>30 billionths of a second per day</b>: real, but tiny.',
      focus:[[230,40,560,170],[0,0,400,40]],speed:0.6,setup(sim){BioLab.setValues(sim,{craft:'jet'});}},
    {lvl:'bio',title:'Moving things get shorter',text:'A 100 m ship flies past at 0.8 c. We measure it as <b>60 m long</b>: shortened along its motion by 1/γ. Its height stays the same.',
      focus:[0,48,800,330],speed:0.5,setup(sim){BioLab.setValues(sim,{scene:'length',craft:'slider',beta:0.8});BioLab.reset(sim);}},
    {lvl:'honors',title:'Muons reach the ground',text:'Muons decay in 2.2 µs. Without slow clocks (left) almost all decay high up. Their real clocks run slow by γ ≈ 16 (right), so <b>about a quarter reach the ground</b>.',
      focus:[0,48,800,402],speed:0.5,setup(sim){BioLab.setValues(sim,{scene:'muon',beta:0.998});BioLab.reset(sim);}},
    {lvl:'honors',title:'The twin trip',text:'One twin flies 10 light-years to a star and back at 0.8 c. Earth’s clocks count 25 years; the traveler’s clock counts only <b>15 years</b>.',
      focus:[0,48,800,402],speed:0.6,setup(sim){BioLab.setValues(sim,{scene:'twins',dist:10,beta:0.8});BioLab.reset(sim);}},
    {lvl:'ap',title:'Spacetime diagram',text:'Open <b>Spacetime diagram of the twin trip</b>. Earth’s worldline is straight up; the traveler’s bends at the star. The bent path has <b>less proper time</b>: τ = t/γ on each leg.',
      focus:[0,48,800,402],speed:0.6,setup(sim){if(sim.ui&&sim.ui.gm&&[...sim.ui.gm.options].some(o=>o.value==='st')){sim.gMetric='st';sim.ui.gm.value='st';}}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{scene:'clock',craft:'slider',beta:0.6,dist:10});BioLab.reset(sim);},
  lab:{bio:'<p><b>Question:</b> How does a moving clock’s slowdown (γ) depend on speed?</p><ol><li>Record a trial at 0, 0.1, 0.3, 0.5, 0.7, 0.9, 0.95 and 0.99 c.</li><li>In Trials, plot γ against speed.</li><li>Pick the jet airliner and note how far its clock falls behind per day.</li></ol><p><b>Write:</b> At what speeds does relativity matter? Use your data to explain why we never notice it in daily life.</p>',
    honors:'<p><b>Question:</b> How does speed change muon survival and a twin’s age?</p><ol><li>In Muons, record the percent reaching the ground at 0.90, 0.95, 0.98, 0.99, 0.995 and 0.998 c.</li><li>Compare with “if clocks did not slow” at each speed.</li><li>In Twin trip, keep 10 ly and record both twins’ ages at 0.5, 0.8, 0.9 and 0.99 c. Check that their ratio equals γ.</li></ol><p><b>Write:</b> Explain, using γ, why so many muons reach the ground, and why the traveler comes home younger.</p>',
    ap:'<p><b>Question:</b> Do time dilation and length contraction give the same predictions?</p><ol><li>From the light-clock geometry, derive Δt = γΔτ. Check it against the tick readout at three speeds.</li><li>In Muons, calculate survival from our frame (dilated lifetime) and from the muon frame (contracted atmosphere). Compare with the model.</li><li>Use the spacetime diagram to find the traveler’s proper time for a 10 ly trip at 0.6, 0.8 and 0.99 c.</li><li>Record the energy per kg at 0.9, 0.99 and 0.999 c.</li></ol><p><b>Write a CER:</b> Claim whether the two frames agree on the muon result, and why no massive object reaches c. Use your numbers as evidence and the postulate that c is the same in all frames as your reasoning.</p>'},
  terms:[
    {t:'Speed of light (c)',d:'3.00 × 10⁸ m/s, the same for every observer, however they move.'},
    {t:'Time dilation',d:'A clock moving relative to you ticks slower, as you measure it, by the factor γ.'},
    {t:'Length contraction',d:'A moving object is shorter along its direction of motion, as you measure it, by 1/γ.'},
    {t:'Lorentz factor (γ)',d:'γ = 1/√(1 − v²/c²). It is 1 at rest, 2 at 0.87 c and grows without limit near c.'},
    {t:'Muon',lvl:'honors',d:'A heavy cousin of the electron, made when cosmic rays hit the upper atmosphere. It decays with a mean lifetime of 2.2 µs.'},
    {t:'Proper time',lvl:'honors',d:'Time measured by a clock that travels with the object. It is the shortest time anyone measures between two events on that clock.'},
    {t:'Twin paradox',lvl:'honors',d:'A traveling twin returns younger than the twin who stayed home. Only the traveler turns around, so the situation is not symmetric.'},
    {t:'Worldline',lvl:'ap',d:'An object’s path through spacetime: its position at every time. Light’s worldlines are at 45° when distance is in light-years and time in years.'},
    {t:'Relativistic kinetic energy',lvl:'ap',d:'KE = (γ − 1)mc², which reduces to ½mv² at low speed and grows without limit as v → c.'}
  ],
  about:'<p><b>Postulates:</b> the laws of physics are the same in every inertial frame, and light moves at c = 2.998 × 10⁸ m/s in all of them.</p><p><b>Equations:</b> γ = 1/√(1 − β²) with β = v/c. Moving clock tick Δt = γΔτ (light clock: Δτ = 2L/c = 10.0 ns for L = 1.5 m). Length L = L₀/γ for a 100 m ship. Muon survival = e^(−t/γτ) with τ = 2.197 µs and t = 15 km/v. Twin trip: Earth time 2D/v, traveler time 2D/(vγ). Energy per kg (γ − 1)c². For everyday speeds γ − 1 is computed as β²/(√(1 − β²)(1 + √(1 − β²))) so it is not lost to rounding.</p><p><b>Simplifications:</b> all muons start at 15 km with the same speed and fall straight down (real ones are made over a range of heights and energies). The twin trip treats the turnaround and speed-up as instant and ignores gravity, so the jet clock shows only the speed effect (real flights also have a gravity effect, and GPS satellites need both). The animation shows light about 100 million times slower than it really is; in the twin scene the trip always takes about 6 seconds on screen.</p>',
  draw(sim,ctx,vdt,k){const M=model(sim),s=sim.st,ink=PAL['cv-ink'],soft=PAL['cv-soft'],sc=sim.p.scene;
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    /* header */
    ctx.font='700 '+(12*k)+'px '+FONT;const p1='v = '+speedText(M.b),w1=ctx.measureText(p1).width+12*k*1.1;
    pill(ctx,p1,10+w1/2,22,PAL['card2'],ink,12*k);const p2='γ = '+gText(M.b);ctx.font='700 '+(12*k)+'px '+FONT;const w2=ctx.measureText(p2).width+12*k*1.1;
    pill(ctx,p2,10+w1+8+w2/2,22,PAL['rj'],'#ffffff',12*k);
    if(sc==='clock')drawClock(sim,ctx,k,M,s,ink,soft);
    else if(sc==='length')drawLength(sim,ctx,k,M,s,ink,soft);
    else if(sc==='muon')drawMuon(sim,ctx,k,M,s,ink,soft);
    else drawTwins(sim,ctx,k,M,s,ink,soft);},
  thumbSetup(sim){sim.p.beta=0.8;for(let i=0;i<50;i++)SIM.step(sim,0.05);}
};

function mirrors(ctx,x,y1,y2,col){ctx.fillStyle=col;ctx.fillRect(x-26,y1-6,52,6);ctx.fillRect(x-26,y2,52,6);}
function photon(ctx,x,y){ctx.fillStyle=PAL['cv-e'];ctx.strokeStyle=PAL['cv-estroke'];ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(x,y,6,0,6.29);ctx.fill();ctx.stroke();}
function drawClock(sim,ctx,k,M,s,ink,soft){
  /* rest clock */
  const rx=120,ph=(s.T%T0)/T0,ry=ph<0.5?190-240*ph:70+240*(ph-0.5);
  ctx.fillStyle=PAL['card'];rr(ctx,rx-46,58,92,150,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  mirrors(ctx,rx,70,190,PAL['cv-glass']);ctx.strokeStyle=PAL['cv-e'];ctx.globalAlpha=0.5;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(rx,70);ctx.lineTo(rx,190);ctx.stroke();ctx.globalAlpha=1;photon(ctx,rx,ry);
  txt(ctx,'Your clock',rx,226,{s:12*k,w:600,c:ink,a:'center'});
  /* counters */
  const nR=Math.floor(s.T/T0),nM=Math.floor(s.tau/T0),tx=240,ls=26*k;let ty=70+6*k;
  txt(ctx,'Your clock (at rest): '+nR+' ticks',tx,ty,{s:15*k,w:700,c:ink});ty+=ls;
  txt(ctx,'Train clock (as you see it): '+nM+' ticks',tx,ty,{s:15*k,w:700,c:PAL['s2']});ty+=ls;
  if(M.g1>=1e-3)txt(ctx,'Each train tick takes '+M.g.toFixed(2)+' × as long: '+M.tick.toFixed(1)+' ns',tx,ty,{s:13*k,c:soft});
  else txt(ctx,'Too slow to see: both tick at 10.0 ns',tx,ty,{s:13*k,c:soft});
  /* train lane */
  const x=s.tx;ctx.strokeStyle=soft;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,420);ctx.lineTo(800,420);ctx.stroke();
  for(let i=0;i<40;i++){ctx.fillStyle=PAL['line'];ctx.fillRect(i*22,421,12,4);}
  ctx.fillStyle=PAL['card2'];rr(ctx,x-70,250,140,156,12);ctx.fill();ctx.strokeStyle=PAL['s2'];ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle=PAL['cv-lamp'];[-42,42].forEach(o=>{ctx.beginPath();ctx.arc(x+o,410,9,0,6.29);ctx.fill();});
  mirrors(ctx,x,266,386,PAL['cv-glass']);
  if(s.trail.length>1){ctx.strokeStyle=PAL['cv-e'];ctx.lineWidth=2;ctx.globalAlpha=0.8;ctx.beginPath();s.trail.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();ctx.globalAlpha=1;}
  const p=s.trail[s.trail.length-1]||[x,386];photon(ctx,p[0],p[1]);
  if(M.b>0.001){ctx.strokeStyle=PAL['s2'];ctx.fillStyle=PAL['s2'];ctx.lineWidth=2;const ax=x+78;ctx.beginPath();ctx.moveTo(ax,326);ctx.lineTo(ax+22,326);ctx.stroke();ctx.beginPath();ctx.moveTo(ax+28,326);ctx.lineTo(ax+20,321);ctx.lineTo(ax+20,331);ctx.closePath();ctx.fill();}}
function drawLength(sim,ctx,k,M,s,ink,soft){
  const X0=100,PXM=6,w=L0*PXM/M.g,y0=170,h=56;
  txt(ctx,'Ship: 100 m long in its own frame',400,92,{s:13*k,w:600,c:soft,a:'center'});
  pill(ctx,'We measure '+M.len.toFixed(1)+' m',400,92+24*k,PAL['s2'],'#ffffff',13*k);
  /* ship */
  const sx=s.sx;ctx.save();ctx.beginPath();ctx.rect(0,40,800,260);ctx.clip();
  ctx.fillStyle='#5f7fa8';ctx.beginPath();ctx.moveTo(sx,y0);ctx.lineTo(sx+w*0.86,y0);ctx.lineTo(sx+w,y0+h/2);ctx.lineTo(sx+w*0.86,y0+h);ctx.lineTo(sx,y0+h);ctx.closePath();ctx.fill();
  ctx.fillStyle='#d8e6f5';for(let i=0;i<8;i++){const wx=sx+w*(0.06+i*0.1);ctx.beginPath();ctx.ellipse(wx+w*0.03,y0+h/2,Math.max(1,w*0.025),9,0,0,6.29);ctx.fill();}
  ctx.fillStyle='#f2a33a';if(M.b>0.002){ctx.beginPath();ctx.moveTo(sx,y0+12);ctx.lineTo(sx-18-20*M.b,y0+h/2);ctx.lineTo(sx,y0+h-12);ctx.closePath();ctx.fill();}
  ctx.restore();
  /* ruler: platform at rest */
  const ry=300;ctx.fillStyle=PAL['cv-ruler'];ctx.fillRect(X0,ry,600,30);ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.strokeRect(X0+.5,ry+.5,600,30);
  ctx.fillStyle=PAL['s2'];ctx.globalAlpha=0.5;ctx.fillRect(X0,ry,w,14);ctx.globalAlpha=1;
  for(let m=0;m<=100;m+=10){const x=X0+m*PXM;ctx.strokeStyle=ink;ctx.beginPath();ctx.moveTo(x,ry+30);ctx.lineTo(x,ry+(m%50?20:12));ctx.stroke();}
  [0,50,100].forEach(m=>txt(ctx,m+' m',X0+m*PXM,ry+50+4*k,{s:12*k,c:soft,a:'center'}));
  txt(ctx,'Station ruler at rest: 100 m. Blue bar: the ship’s length as we measure it.',400,ry+80+10*k,{s:12*k,c:soft,a:'center'});
  txt(ctx,'Height stays the same: only the length along the motion shrinks.',400,ry+100+18*k,{s:12*k,c:soft,a:'center'});}
function drawMuon(sim,ctx,k,M,s,ink,soft){
  const grd=ctx.createLinearGradient(0,MTOP,0,MBOT);grd.addColorStop(0,PAL['cv-bg2']);grd.addColorStop(1,PAL['cv-water']);
  COLS.forEach((c,i)=>{ctx.fillStyle=grd;ctx.fillRect(c.x0,MTOP,c.x1-c.x0,MBOT-MTOP);ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.strokeRect(c.x0+.5,MTOP+.5,c.x1-c.x0,MBOT-MTOP);
    txt(ctx,i?'Real: clocks run slow':'If clocks did not slow',(c.x0+c.x1)/2,MTOP-10,{s:12*k,w:700,c:i?PAL['s2']:PAL['s4'],a:'center'});});
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(COLS[0].x0-10,MBOT,COLS[1].x1-COLS[0].x0+20,8);
  [15,10,5,0].forEach(km=>{const y=MTOP+(HATM-km*1000)*MPX;txt(ctx,km+' km',COLS[0].x0-8,y+4,{s:12*k,c:soft,a:'right'});});
  s.mu.forEach(u=>{const y=MTOP+u.m*MPX;ctx.fillStyle=u.c?PAL['s2']:PAL['s4'];ctx.beginPath();ctx.arc(u.x,y,4.5,0,6.29);ctx.fill();});
  s.bursts.forEach(b=>{const a=clamp(b.life/0.6,0,1);ctx.strokeStyle=b.g?PAL['s3']:PAL['muted'];ctx.globalAlpha=a;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(b.x,b.y,4+(0.6-b.life)*14,0,6.29);ctx.stroke();ctx.globalAlpha=1;});
  const pct=[noDilText(M),M.surv.toFixed(1)+'%'];
  COLS.forEach((c,i)=>txt(ctx,pct[i]+' land',(c.x0+c.x1)/2,MBOT+26+4*k,{s:12*k,w:600,c:ink,a:'center'}));
  const rx=652;txt(ctx,'Lifetime',rx,120,{s:12*k,c:soft});txt(ctx,'2.2 µs',rx,120+18*k,{s:13*k,w:700,c:ink});
  txt(ctx,'Average trip',rx,120+48*k,{s:12*k,c:soft});txt(ctx,(M.lamNo/1000).toFixed(2)+' km',rx,120+66*k,{s:13*k,w:700,c:PAL['s4']});
  txt(ctx,(M.lamDil/1000).toFixed(1)+' km',rx,120+84*k,{s:13*k,w:700,c:PAL['s2']});}
function drawTwins(sim,ctx,k,M,s,ink,soft){
  const ey=200,ex=110,sx=690;ctx.setLineDash([5,6]);ctx.strokeStyle=soft;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ex+34,ey);ctx.lineTo(sx-24,ey);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='#2f78c4';ctx.beginPath();ctx.arc(ex,ey,30,0,6.29);ctx.fill();ctx.fillStyle='#4fa35a';ctx.beginPath();ctx.ellipse(ex-8,ey-6,12,9,0.4,0,6.29);ctx.fill();ctx.beginPath();ctx.ellipse(ex+10,ey+12,9,6,0,0,6.29);ctx.fill();
  ctx.fillStyle='#f2b705';ctx.beginPath();for(let i=0;i<10;i++){const r=i%2?9:22,a=-Math.PI/2+i*Math.PI/5;ctx.lineTo(sx+r*Math.cos(a),ey+r*Math.sin(a));}ctx.closePath();ctx.fill();
  txt(ctx,'Earth',ex,ey+52,{s:12*k,w:600,c:ink,a:'center'});txt(ctx,'Star',sx,ey+52,{s:12*k,w:600,c:ink,a:'center'});
  txt(ctx,M.D.toFixed(1)+' light-years',400,ey-34,{s:13*k,w:600,c:soft,a:'center'});
  let phase=0;if(M.b>0){const cyc=s.T%7.5;phase=Math.min(1,cyc/6);}
  const out=phase<0.5,f=out?phase/0.5:(1-phase)/0.5,rx=ex+40+(sx-ex-70)*f;
  if(M.b>0){ctx.save();ctx.translate(rx,ey);if(!out)ctx.scale(-1,1);ctx.fillStyle='#d9dde3';ctx.beginPath();ctx.moveTo(-20,-8);ctx.lineTo(12,-8);ctx.lineTo(24,0);ctx.lineTo(12,8);ctx.lineTo(-20,8);ctx.closePath();ctx.fill();
    ctx.fillStyle='#C11430';ctx.beginPath();ctx.moveTo(-20,-8);ctx.lineTo(-28,-15);ctx.lineTo(-14,-8);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(-20,8);ctx.lineTo(-28,15);ctx.lineTo(-14,8);ctx.closePath();ctx.fill();
    if(phase<1){ctx.fillStyle='#f2a33a';ctx.beginPath();ctx.moveTo(-20,-5);ctx.lineTo(-34,0);ctx.lineTo(-20,5);ctx.closePath();ctx.fill();}ctx.restore();}
  else txt(ctx,'Speed is 0: the trip never starts',400,ey+6,{s:13*k,w:600,c:PAL['s1'],a:'center'});
  const cards=[{l:'Earth twin has aged',v:M.b>0?fmtYears(phase*M.tE):'0.0 years',col:PAL['s3'],fr:phase},{l:'Traveling twin has aged',v:M.b>0?fmtYears(phase*M.tT):'0.0 years',col:PAL['s5'],fr:phase/M.g}];
  cards.forEach((c,i)=>{const x=60+i*350,y=300,w=330,h=112;ctx.fillStyle=PAL['card'];rr(ctx,x,y,w,h,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
    txt(ctx,c.l,x+14,y+18+6*k,{s:12*k,c:soft});txt(ctx,c.v,x+14,y+44+16*k,{s:17*k,w:700,c:c.col});
    ctx.fillStyle=PAL['line'];ctx.fillRect(x+14,y+h-16,w-28,7);ctx.fillStyle=c.col;ctx.fillRect(x+14,y+h-16,(w-28)*clamp(c.fr,0,1),7);});
  if(phase>=1&&M.b>0)txt(ctx,'Home again: the traveler is '+fmtYears(M.tE-M.tT)+' younger',400,ey+90,{s:13*k,w:700,c:ink,a:'center'});}

BioLab.register(SIM);
})();
