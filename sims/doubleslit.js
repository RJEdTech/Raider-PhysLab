(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,fmtNum}=BioLab.h;

/* The double-slit experiment, one particle at a time (Nov 19, 2026).
   Each particle lands as one dot. Where it lands is drawn at random from the wave prediction:
     two slits, path unknown:  P(y) ∝ env(y) · (1 + V cos(2πy/s)) / 2
     one slit, or path known:  P(y) ∝ env(y)            (V = 0: no bands)
   env(y) = sinc²(πy/Y0) is the single-slit envelope; s = λL/d is the band spacing.
   V (fringe visibility) is 1 with nothing marking the path, 0 with a which-path detector,
   and (1 − gas fraction) when some particles are bumped by gas molecules (collisional decoherence).
   Tennis balls are drawn classically: two bands, one straight behind each slit, because their de Broglie
   wavelength (about 4 × 10⁻³⁴ m) makes the band spacing impossibly small and air bumps record their path.
   Real setups behind each source (λ = h/p):
     light: red laser 650 nm, slits 0.25 mm apart, screen 2 m away -> bands 5.2 mm apart
     electrons: 50 kV (λ = 5.36 pm, as in Tonomura and colleagues, 1989), slits 2 µm apart, 1 m -> 2.7 µm
     buckyballs C60: 720 u at 220 m/s (λ = 2.5 pm), grating 100 nm, 1.25 m -> 31 µm (Arndt and colleagues, 1999)
     tennis balls: 58 g at 30 m/s (λ = 3.8 × 10⁻³⁴ m), doors 1 m apart, 5 m -> 1.9 × 10⁻³³ m */
const H=6.626e-34,U=1.6605e-27;
const SRC={
  light:{n:'Light (red laser)',one:'photon',many:'photons',lam:650e-9,d:0.25e-3,L:2,col:'#d6332b',m:null},
  electron:{n:'Electrons',one:'electron',many:'electrons',lam:5.36e-12,d:2e-6,L:1,col:'#e6b800',m:'9.11 × 10⁻³¹ kg'},
  c60:{n:'Buckyballs (C₆₀)',one:'buckyball',many:'buckyballs',lam:H/(720*U*220),d:100e-9,L:1.25,col:'#5b6b7d',m:'720 atomic mass units'},
  ball:{n:'Tennis balls',one:'tennis ball',many:'tennis balls',lam:H/(0.058*30),d:1,L:5,col:'#c8d600',m:'58 g'}};
const SUP={'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
function sci(x,d){if(!x)return '0';let e=Math.floor(Math.log10(Math.abs(x))),m=x/Math.pow(10,e);if(Math.abs(+m.toFixed(d))>=10){e++;m=x/Math.pow(10,e);}
  return m.toFixed(d)+' × 10'+String(e).split('').map(c=>SUP[c]).join('');}
function len(x){const a=Math.abs(x);if(a>=1e-3)return fmtNum(x*1000,1)+' mm';if(a>=1e-6)return fmtNum(x*1e6,1)+' µm';if(a>=1e-9)return fmtNum(x*1e9,1)+' nm';if(a>=1e-12)return fmtNum(x*1e12,2)+' pm';return sci(x,1)+' m';}

/* stage geometry (logical px) */
const GX=36,GY=225,BX=300,SX=560,TOP=40,BOT=410,MID=225,SLW=9;
const FX=652,FW=136; /* front view of the screen */
const HX=568,HW=74;   /* histogram strip */
const NB=74;
const sepPx=sim=>34*(sim.p.sep||1);
const slitYs=sim=>{const h=sepPx(sim)/2;return sim.p.slits==='one'?[MID-h]:[MID-h,MID+h];};

function model(sim){const p=sim.p,S=SRC[p.src]||SRC.electron,ball=p.src==='ball',two=p.slits!=='one',gas=atLeast('ap')?(p.gas||0)/100:0;
  const known=two&&!ball&&(p.watch||gas>0);
  const V=ball||!two||p.watch?0:1-gas;
  const sp=S.lam*S.L/(S.d*(p.sep||1));
  return {S,ball,two,gas,V,known,sp,watch:!!p.watch};}
/* probability of landing at offset y (px from the middle), max 1 */
const S0=46,Y0=5*S0;
function pdf(sim,y){const M=model(sim);
  if(M.ball){const c=slitYs(sim).map(sy=>sy-MID).map(o=>o*1.9),sg=11;let v=0;c.forEach(cy=>{v+=Math.exp(-Math.pow((y-cy)/sg,2)/2);});return Math.min(1,v);}
  const a=Math.PI*y/Y0,env=Math.abs(a)<1e-6?1:Math.pow(Math.sin(a)/a,2);
  if(!M.two)return env;
  const s=S0/(sim.p.sep||1);
  return env*(1+M.V*Math.cos(2*Math.PI*y/s))/2;}
function sample(sim,r){for(let i=0;i<400;i++){const y=(r()*2-1)*(MID-TOP-4),q=pdf(sim,y);if(r()<q)return y;}return 0;}
function bump(sim,r){const M=model(sim);return M.gas>0&&!M.watch&&r()<M.gas;}
function clear(sim){const s=sim.st;s.hits=[];s.bins=new Array(NB).fill(0);s.fly=[];s.n=0;s.acc=0;}
function land(sim,y,mark){const s=sim.st;if(s.hits.length<6000)s.hits.push([s.r(),y]);
  const b=Math.floor((y+(MID-TOP))/(2*(MID-TOP))*NB);if(b>=0&&b<NB)s.bins[b]++;s.n++;s.last={y,life:0.9,mark};}
function launch(sim){const s=sim.st,M=model(sim),ys=slitYs(sim),slit=ys[Math.floor(s.r()*ys.length)],hit=sample(sim,s.r);
  let path=null;if(M.ball||(M.two&&M.watch))path=M.ball?(hit<0?ys[0]:ys[ys.length-1]):slit;
  const bumped=!M.ball&&M.two&&bump(sim,s.r);
  if(bumped)path=slit;
  /* a known path gives a dot from the matching one-slit pattern, drawn the same way */
  const y=(path!==null&&!M.ball)?sampleOne(sim,s.r):hit;
  s.fly.push({t:0,y,path,bumped});}
function sampleOne(sim,r){for(let i=0;i<400;i++){const y=(r()*2-1)*(MID-TOP-4),a=Math.PI*y/Y0,q=Math.abs(a)<1e-6?1:Math.pow(Math.sin(a)/a,2);if(r()<q)return y;}return 0;}
const RATE={one:0.8,many:10,flood:300};
const FLY=1.25;

const SIM={
  id:'doubleslit',hash:'doubleslit',apUnit:13,order:5,prereq:['waves','photoelectric'],next:['color'],
  tab:'The double slit, one at a time',kind:'Go further',
  card:'Fire electrons, light, buckyballs and tennis balls at two slits one at a time, then find out what makes the wave bands vanish.',
  title:'The double-slit experiment: one particle at a time',
  lede:{bio:'Send electrons through two slits one at a time. Each lands as a single dot, yet thousands build bands that only waves make. Then watch which slit each one uses, and see what happens.',
    honors:'Bands appear where waves from the two slits add and vanish where they cancel. Their spacing is s = λL/d. Any record of which slit a particle used erases them.',
    ap:'Every particle has a de Broglie wavelength λ = h/p. Add gas to the beam path and watch fringe contrast fall: collisions carry away which-path information (decoherence).'},
  scale:{bio:'The real setups differ by source: red laser light through slits 0.25 mm apart, or electrons through slits 2 µm apart, about a fiftieth of a hair’s width. The picture is not to scale.',
    ap:'Real setups: laser 650 nm, d = 0.25 mm, L = 2 m; electrons at 50 kV (λ = 5.36 pm), d = 2 µm, L = 1 m; C₆₀ at 220 m/s (λ = 2.5 pm), grating 100 nm, L = 1.25 m. The picture is not to scale.'},
  aspect:16/9,timeless:true,animated:true,chChange:0.6,chReveal:3.2,graph:false,trials:false,
  controls:[
    {id:'src',label:'Send',type:'seg',def:'electron',options:[{v:'electron',l:'Electrons'},{v:'light',l:'Light'},{v:'c60',l:'Buckyballs',lvl:'honors'},{v:'ball',l:'Tennis balls'}],onChange(sim){clear(sim);}},
    {id:'slits',label:'Slits open',type:'seg',def:'two',options:[{v:'two',l:'Both'},{v:'one',l:'Top only'}],onChange(sim){clear(sim);}},
    {id:'watch',label:'Watch which slit (detector)',type:'toggle',def:false,help:'A detector at the slits records which one each particle goes through.',onChange(sim){clear(sim);}},
    {id:'rate',label:'How fast',type:'seg',def:'one',noTrial:true,options:[{v:'one',l:'One at a time'},{v:'many',l:'10 per second'},{v:'flood',l:'300 per second'}]},
    {id:'pred',label:'Show the wave prediction',type:'toggle',def:false,lvl:'honors',noTrial:true},
    {id:'sep',label:'Slit separation',type:'range',min:0.5,max:2,step:0.1,def:1,unit:'×',d:1,lvl:'honors',help:'Farther apart slits give bands closer together.',onChange(sim){clear(sim);}},
    {id:'gas',label:'Particles bumped by gas on the way',type:'range',min:0,max:100,step:5,def:0,unit:'%',d:0,lvl:'ap',help:'Each gas molecule that hits a particle carries away a record of where it was.',onChange(sim){clear(sim);}}
  ],
  actions:[
    {id:'burst',label:'Send 1,000 now',primary:true,run(sim){for(let i=0;i<1000;i++){const s=sim.st,M=model(sim),known=M.ball?false:(M.two&&(M.watch||bump(sim,s.r)));land(sim,(known||!M.two)&&!M.ball?sampleOne(sim,s.r):sample(sim,s.r),false);}}},
    {id:'clear',label:'Clear the screen',run(sim){clear(sim);}}
  ],
  init(sim){const s={r:rng(11),last:null};sim.st=s;clear(sim);return s;},
  step(sim,dt){const s=sim.st;dt=Math.min(dt,0.25);const rate=RATE[sim.p.rate]||RATE.one;
    if(sim.p.rate==='flood'){s.acc+=rate*dt;while(s.acc>=1){s.acc-=1;const M=model(sim),known=!M.ball&&M.two&&(M.watch||bump(sim,s.r));land(sim,known||(!M.two&&!M.ball)?sampleOne(sim,s.r):sample(sim,s.r),false);}s.fly.length=0;}
    else{s.acc+=rate*dt;while(s.acc>=1){s.acc-=1;if(s.fly.length<14)launch(sim);}
      for(let i=s.fly.length-1;i>=0;i--){const f=s.fly[i];f.t+=dt/(sim.p.rate==='one'?FLY:0.55);if(f.t>=1){s.fly.splice(i,1);land(sim,f.y,f.path!==null);}}}
    if(s.last){s.last.life-=dt;if(s.last.life<=0)s.last=null;}},
  metrics:[
    {id:'n',label:'Particles on the screen',unit:'',d:0,min:0,max:null,get:sim=>sim.st.n},
    {id:'vis',label:'Band contrast (visibility)',unit:'%',d:0,min:0,max:100,get:sim=>Math.round(model(sim).V*100)},
    {id:'lam',label:'Wavelength (λ = h/p)',text:true,noTrial:true,get(sim){const M=model(sim);return len(M.S.lam)+(sim.p.src==='light'?' (red laser)':'');}},
    {id:'sp',label:'Spacing between bright bands (this setup)',text:true,noTrial:true,get(sim){const M=model(sim);
      if(M.ball)return len(M.sp)+': far too small to ever see';return len(M.sp);}},
    {id:'path',label:'Is the path known?',text:true,noTrial:true,get(sim){const M=model(sim);
      if(M.ball)return 'Yes: air and light bump every ball';if(!M.two)return 'Yes: only one slit is open';if(M.watch)return 'Yes: the detector records it';
      if(M.gas>0)return 'For '+Math.round(M.gas*100)+'%: the ones hit by gas';return 'No: nothing records it';}}
  ],
  narrate(sim){const M=model(sim),S=M.S,n=sim.st.n;
    if(M.ball)return 'Tennis balls fly straight through one slit or the other, so they pile up in <b>two bands, one behind each slit</b>. Their wavelength, '+len(S.lam)+', is so small that any wave bands would be packed far too close to ever see.';
    if(n<20)return 'Each '+S.one+' leaves the source alone and lands as <b>one dot in one place</b>, like a particle. Watch where the dots pile up as more arrive.';
    if(!M.two)return 'With one slit open, the '+S.many+' spread into <b>one wide patch with no dark bands</b>. Bands need two paths that overlap.';
    if(M.watch)return 'The detector records which slit each '+S.one+' uses. With the path known, <b>the bands disappear</b>: you get one wide patch, the sum of two one-slit patterns.';
    if(M.gas>0)return Math.round(M.gas*100)+'% of the '+S.many+' are hit by gas molecules, which carry off a record of their path. Those land with no bands, so <b>the band contrast falls to '+Math.round(M.V*100)+'%</b>.';
    return 'The dots pile up in <b>bright and dark bands</b>. Waves from the two slits add where crests meet and cancel where a crest meets a trough. Each '+S.one+' was sent alone, so each one interfered with itself.';},
  challenges:[
    {lvl:'bio',q:'Electrons stream through both slits and make bands. You turn on a detector that records which slit each electron uses. What happens?',choices:['The bands fade into one wide patch','The bands grow sharper and brighter','Nothing changes on the screen'],correct:0,
      baseline:{src:'electron',slits:'two',watch:false,rate:'flood',gas:0,sep:1},change:{watch:true},changeText:'Detector turned on',
      explain:{bio:'With the path recorded, each electron acts as if it went through one slit only. Two one-slit patterns overlap into one wide patch, and the bands vanish.',
        ap:'Which-path information makes the two paths distinguishable, so their amplitudes no longer add: P = |ψ₁|² + |ψ₂|², with no interference term.'}},
    {lvl:'bio',q:'Electrons make bands. You switch to throwing tennis balls at two openings. What pattern do they make?',choices:['Two bands, one behind each slit','Many bright and dark bands','One band right in the middle'],correct:0,
      baseline:{src:'electron',slits:'two',watch:false,rate:'flood',gas:0,sep:1},change:{src:'ball'},changeText:'Switched to tennis balls',
      explain:{bio:'A tennis ball goes through one opening or the other and keeps going straight, so you get two piles. Its wavelength is about 4 × 10⁻³⁴ m, far too small for bands you could ever see.'}},
    {lvl:'bio',q:'Electrons go through two slits and make bands. You close the bottom slit. What happens?',choices:['One wide patch, with no dark bands','Half as many bands as before','The same bands, only dimmer'],correct:0,
      baseline:{src:'electron',slits:'two',watch:false,rate:'flood',gas:0,sep:1},change:{slits:'one'},changeText:'Bottom slit closed',
      explain:{bio:'Bands come from waves through two slits overlapping. With one slit, there is nothing to overlap with, so the dark bands fill in. Opening a second slit had made some spots get fewer electrons.'}},
    {lvl:'honors',q:'Red laser light makes bands through two slits. You move the slits twice as far apart. What happens to the bands?',choices:['They get closer together','They spread farther apart','They stay exactly where they were'],correct:0,
      baseline:{src:'light',slits:'two',watch:false,rate:'flood',gas:0,sep:1},change:{sep:2},changeText:'Slits moved twice as far apart',
      explain:{honors:'Band spacing is s = λL/d. Doubling d halves the spacing, from 5.2 mm to 2.6 mm on a screen 2 m away.'}},
    {lvl:'honors',q:'The detector is on and there are no bands. You turn the detector off. What happens to the new dots?',choices:['The bands come back right away','The electrons stay changed: no bands','The bands return slowly over minutes'],correct:0,
      baseline:{src:'electron',slits:'two',watch:true,rate:'flood',gas:0,sep:1},change:{watch:false},changeText:'Detector turned off',
      explain:{honors:'Nothing about the electrons is damaged. Once nothing records the path, each new electron again passes as a wave through both slits, and the bands build up again.'}},
    {lvl:'ap',q:'Buckyballs make bands at 100% contrast. You add gas so that 60% of them are hit on the way. What is the band contrast now?',choices:['About 40%','Still about 100%','About 0%, as with a detector'],correct:0,
      baseline:{src:'c60',slits:'two',watch:false,rate:'flood',gas:0,sep:1},change:{gas:60},changeText:'Gas added: 60% of buckyballs hit',
      explain:{ap:'Each hit buckyball has its path recorded by the gas molecule and lands with no interference. The other 40% still interfere, so the visibility is about 1 − 0.6 = 0.4. Hornberger and colleagues saw this kind of drop with fullerenes in 2003.'}},
    {lvl:'ap',q:'A tennis ball’s de Broglie wavelength is about 4 × 10⁻³⁴ m. Why will you never see its bands?',choices:['The bands would be impossibly close together','A tennis ball has no wavelength at all','The openings are far too wide for waves'],correct:0,instant:true,
      baseline:{src:'ball',slits:'two',watch:false,rate:'flood',gas:0,sep:1},
      explain:{ap:'s = λL/d = (3.8 × 10⁻³⁴ m)(5 m)/(1 m) ≈ 2 × 10⁻³³ m, far smaller than a proton. On top of that, air molecules and light hit the ball constantly, recording its path.'}}
  ],
  tour:[
    {lvl:'bio',title:'One at a time',text:'The source sends <b>one electron at a time</b>, with time between them. Watch one leave, pass the slits and hit the screen.',
      focus:[[0,150,330,150],[540,30,250,390]],speed:0.6,setup(sim){BioLab.setValues(sim,{src:'electron',slits:'two',watch:false,rate:'one',gas:0,sep:1});BioLab.reset(sim);}},
    {lvl:'bio',title:'A dot, not a smear',text:'Each electron lands as <b>one dot in one place</b>, like a tiny bullet. It never arrives spread out.',
      focus:[540,30,250,390],speed:0.6},
    {lvl:'bio',title:'Thousands of dots',text:'Now 300 per second. The dots pile up in <b>bright and dark bands</b>, the pattern waves make when they overlap.',
      focus:[540,30,250,390],speed:1,setup(sim){BioLab.setValues(sim,{rate:'flood'});}},
    {lvl:'bio',title:'Close one slit',text:'With only the top slit open, the dark bands fill in: <b>one wide patch</b>. The bands need both slits.',
      focus:[[280,30,60,390],[540,30,250,390]],speed:1,setup(sim){BioLab.setValues(sim,{slits:'one'});BioLab.reset(sim);}},
    {lvl:'bio',title:'Watch which slit',text:'Both slits open, and a detector records which slit each electron uses. <b>The bands vanish.</b> Knowing the path removes the interference.',
      focus:[[280,30,60,390],[540,30,250,390]],speed:1,setup(sim){BioLab.setValues(sim,{slits:'two',watch:true});BioLab.reset(sim);}},
    {lvl:'bio',title:'Tennis balls',text:'Tennis balls make <b>two bands, one behind each opening</b>, the way we expect particles to behave.',
      focus:[[0,30,800,390]],speed:1,setup(sim){BioLab.setValues(sim,{src:'ball',watch:false});BioLab.reset(sim);}},
    {lvl:'ap',title:'Gas in the beam',text:'Buckyballs, with 60% of them hit by gas molecules. Each hit records the path, so <b>contrast falls to 40%</b>. This is decoherence.',
      focus:[[0,30,800,390]],speed:1,setup(sim){BioLab.setValues(sim,{src:'c60',watch:false,gas:60});BioLab.reset(sim);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{src:'electron',slits:'two',watch:false,rate:'one',gas:0,sep:1});BioLab.reset(sim);},
  lab:{bio:'<p><b>Question:</b> What makes the bands on the screen appear and disappear?</p><ol><li>With electrons and both slits open, press <b>Send 1,000 now</b> twice. Sketch the pattern.</li><li>Clear the screen, close the bottom slit, and send 2,000 again. Sketch it.</li><li>Open both slits, turn on <b>Watch which slit</b>, and send 2,000. Sketch it.</li><li>Repeat step 1 with tennis balls.</li></ol><p><b>Write:</b> Which setups made bands, and what did they have in common?</p>',
    honors:'<p><b>Question:</b> How does the band spacing depend on the slit separation?</p><ol><li>Choose Light. Turn on <b>Show the wave prediction</b>.</li><li>For separations 0.5×, 1× and 2×, send 2,000 and count the bright bands across the screen.</li><li>Use s = λL/d (λ = 650 nm, L = 2 m, d = 0.25 mm × the setting) to predict each spacing in mm.</li></ol><p><b>Write:</b> Does doubling d double or halve the spacing? Explain with the equation.</p>',
    ap:'<p><b>Question:</b> How does which-path information change the fringe visibility?</p><ol><li>Choose Buckyballs. For gas = 0, 20, 40, 60, 80 and 100%, send 2,000 and record the band contrast.</li><li>Graph visibility against the fraction of particles hit.</li><li>Compare with V = 1 − f.</li></ol><p><b>Claim, evidence, reasoning:</b> Is it the particle’s size, or the record of its path, that removes the bands?</p>'},
  terms:[
    {t:'Interference',d:'What happens when two waves overlap: they add where crests meet (bright) and cancel where a crest meets a trough (dark).'},
    {t:'Diffraction',d:'A wave spreading out as it passes through a narrow opening or around an edge. Named by the Jesuit Francesco Grimaldi in 1665.'},
    {t:'Wave–particle duality',d:'Light and matter travel like waves, spreading and interfering, but arrive like particles, one dot at a time.'},
    {t:'Which-path information',d:'Any record, by a detector, a gas molecule or anything else, of which slit a particle went through.'},
    {t:'Band spacing',lvl:'honors',d:'The distance between bright bands on the screen: s = λL/d, with λ the wavelength, L the distance to the screen and d the slit separation.'},
    {t:'De Broglie wavelength',lvl:'honors',d:'Every moving particle has a wavelength λ = h/p, where p is its momentum (mass × speed) and h is Planck’s constant. Heavier or faster means shorter.'},
    {t:'Superposition',lvl:'ap',d:'A particle whose path is not recorded is described by a wave that goes through both slits at once.'},
    {t:'Decoherence',lvl:'ap',d:'The loss of interference when a particle interacts with its surroundings and leaves a record of its path. It is the record, not the size, that matters.'},
    {t:'Fringe visibility',lvl:'ap',d:'How strong the bands are: (brightest − darkest) ÷ (brightest + darkest). 100% means fully dark gaps; 0% means no bands.'}
  ],
  about:'<p><b>Where each dot lands</b> is drawn at random from the wave prediction. With two slits and nothing recording the path, P(y) ∝ sinc²(πy/Y₀) · (1 + V cos 2πy/s), where s = λL/d is the band spacing and the sinc² envelope comes from each slit’s width. With one slit or a known path, V = 0.</p><p><b>Wavelengths</b> come from λ = h/p: electrons accelerated through 50 kV have λ = 5.36 pm (Tonomura and colleagues sent them one at a time in 1989); C₆₀ at 220 m/s has λ = 2.5 pm (Arndt and colleagues, 1999); a 58 g tennis ball at 30 m/s has λ ≈ 3.8 × 10⁻³⁴ m. The record for interference is molecules of about 2,000 atoms, heavier than 25,000 atomic mass units (Fein and colleagues, 2019).</p><p><b>Simplifications:</b> the picture is not to scale; the band pattern is drawn the same size for every source, and the readouts give each real setup’s spacing. Real electron experiments use an electron biprism, and buckyball experiments use gratings with many slits. The detector is perfect, and gas is modeled as a fraction of particles hit, so V = 1 − f. Tennis balls are drawn classically.</p>',
  draw(sim,ctx,vdt,k){const s=sim.st,M=model(sim),ink=PAL['cv-ink'],soft=PAL['cv-soft'],col=M.S.col,ys=slitYs(sim);
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    /* source */
    ctx.fillStyle=PAL['card2']||PAL['card'];rr(ctx,GX-14,GY-26,64,52,9);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;rr(ctx,GX-14,GY-26,64,52,9);ctx.stroke();
    ctx.fillStyle=col;ctx.beginPath();ctx.arc(GX+40,GY,6,0,6.29);ctx.fill();
    txt(ctx,'Source',GX+18,GY+44*Math.min(k,1.3),{s:13*k,w:600,c:ink,a:'center'});
    /* barrier with slits */
    ctx.fillStyle=PAL['cv-soft'];const gaps=[...ys].sort((a,b)=>a-b);let y0=TOP;
    gaps.forEach(g=>{ctx.fillRect(BX-5,y0,10,g-SLW/2-y0);y0=g+SLW/2;});ctx.fillRect(BX-5,y0,10,BOT-y0);
    if(M.two===false&&!M.ball){/* closed bottom slit: show the cover */const g=MID+sepPx(sim)/2;ctx.fillStyle=PAL['s1'];ctx.fillRect(BX-6,g-SLW/2-1,12,SLW+2);}
    txt(ctx,M.two?'Two slits':'Top slit only',BX,TOP-8,{s:13*k,w:600,c:ink,a:'center'});
    /* detector */
    if(M.watch&&M.two&&!M.ball){ctx.strokeStyle=PAL['s5'];ctx.lineWidth=2;ys.forEach(g=>{ctx.beginPath();ctx.arc(BX+22,g,8,0,6.29);ctx.stroke();ctx.beginPath();ctx.arc(BX+22,g,3,0,6.29);ctx.fillStyle=PAL['s5'];ctx.fill();});
      txt(ctx,'Detector',BX+22,BOT+4+14*Math.min(k,1.3),{s:13*k,w:600,c:PAL['s5'],a:'center'});}
    /* screen (side view) */
    ctx.fillStyle=PAL['cv-ink'];ctx.globalAlpha=0.75;ctx.fillRect(SX-3,TOP,6,BOT-TOP);ctx.globalAlpha=1;
    txt(ctx,'Screen',SX,TOP-8,{s:13*k,w:600,c:ink,a:'center'});
    /* particles in flight */
    s.fly.forEach(f=>{const t=f.t,half=0.5;
      if(t<half){const u=t/half,tx=BX,ty=f.path!==null&&(M.ball||M.watch)?f.path:MID,x=GX+40+(tx-GX-40)*u,y=GY+(ty-GY)*u;
        if(M.ball||f.path!==null&&M.watch){ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y,M.ball?6:4,0,6.29);ctx.fill();}
        else{const g=ctx.createRadialGradient(x,y,0,x,y,16);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.globalAlpha=0.7;ctx.beginPath();ctx.arc(x,y,16,0,6.29);ctx.fill();ctx.globalAlpha=1;}}
      else{const u=(t-half)/half;
        if(M.ball){const x=BX+(SX-BX)*u,y=f.path+(MID+f.y-f.path)*u;ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y,6,0,6.29);ctx.fill();}
        else{const R=u*(SX-BX)*1.05,src=f.path!==null?[f.path]:ys;ctx.save();ctx.beginPath();ctx.rect(BX+6,TOP,SX-BX-9,BOT-TOP);ctx.clip();ctx.strokeStyle=col;ctx.lineWidth=2;
          src.forEach(g=>{for(let j=0;j<3;j++){const r=R-j*16;if(r<=2)continue;ctx.globalAlpha=0.55*(1-j/3);ctx.beginPath();ctx.arc(BX,g,r,-Math.PI/2,Math.PI/2);ctx.stroke();}});ctx.restore();ctx.globalAlpha=1;
          if(M.watch&&f.path!==null&&u<0.25){ctx.fillStyle=PAL['s5'];ctx.globalAlpha=1-u/0.25;ctx.beginPath();ctx.arc(BX+22,f.path,11,0,6.29);ctx.fill();ctx.globalAlpha=1;}
          if(f.bumped&&u<0.6){const gx=BX+60+u*80;ctx.fillStyle=PAL['s4'];ctx.beginPath();ctx.arc(gx,f.path-10,4,0,6.29);ctx.fill();}}}});
    /* latest hit flash on the side-view screen */
    if(s.last){ctx.fillStyle=col;ctx.globalAlpha=clamp(s.last.life/0.9,0,1);ctx.beginPath();ctx.arc(SX,MID+s.last.y,7,0,6.29);ctx.fill();ctx.globalAlpha=1;}
    /* histogram strip */
    const mx=Math.max(8,...s.bins),bh=(BOT-TOP)/NB;ctx.fillStyle=col;ctx.globalAlpha=0.85;
    s.bins.forEach((c,i)=>{if(!c)return;const w=(HW-6)*c/mx;ctx.fillRect(HX,TOP+i*bh,w,Math.max(1,bh-0.6));});ctx.globalAlpha=1;
    if(sim.p.pred&&atLeast('honors')){let pm=0;for(let i=0;i<NB;i++){const y=-(MID-TOP)+(i+0.5)*2*(MID-TOP)/NB;pm=Math.max(pm,pdf(sim,y));}
      ctx.strokeStyle=ink;ctx.lineWidth=1.6;ctx.setLineDash([4,3]);ctx.beginPath();for(let j=0;j<=200;j++){const y=-(MID-TOP)+j*2*(MID-TOP)/200,x=HX+(HW-6)*pdf(sim,y)/Math.max(pm,1e-9);j?ctx.lineTo(x,MID+y):ctx.moveTo(x,MID+y);}ctx.stroke();ctx.setLineDash([]);}
    txt(ctx,'Count',HX+(HW-6)/2,BOT+16*Math.min(k,1.3),{s:12*k,c:soft,a:'center'});
    /* front view of the screen */
    ctx.fillStyle='#101216';rr(ctx,FX,TOP,FW,BOT-TOP,6);ctx.fill();
    ctx.fillStyle=col==='#5b6b7d'?'#b9c6d6':col;const hs=s.hits,step=hs.length>4000?2:1,dz=hs.length<150?4:hs.length<800?3:2;
    for(let i=0;i<hs.length;i+=step){const h=hs[i];ctx.fillRect(FX+4+h[0]*(FW-10),MID+h[1]-dz/2,dz,dz);}
    txt(ctx,'Front view',FX+FW/2,TOP-8,{s:13*k,w:600,c:ink,a:'center'});
    txt(ctx,fmtNum(s.n,0)+' '+(s.n===1?M.S.one:M.S.many),FX+FW/2,BOT+16*Math.min(k,1.3),{s:13*k,w:700,c:ink,a:'center'});
    /* source label */
    pill(ctx,M.S.n,GX+18,BOT-6,PAL['card'],ink,12*Math.min(k,1.3));
  },
  thumbSetup(sim){BioLab.setValues(sim,{src:'electron',rate:'flood'});for(let i=0;i<1500;i++)land(sim,sample(sim,sim.st.r),false);},
  thumbFrames:1
};
BioLab.register(SIM);
BioLab.dsModel=model;
})();
