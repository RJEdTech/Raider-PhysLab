/* The double slit, one at a time (Nov 19, 2026, borders session).
   Learn it, Test yourself why questions, the practical hook and Myth or fact for the new doubleslit tool.
   This tool's Learn it lives only in this file. Its border card is in borders.js. */
(function(){
'use strict';
const H=BioLab.h,PAL=H.PAL;
const RED='#b3261e',GREEN='#1b7a3a',HI='#c8102e';
const S=sim=>sim.st,M=sim=>BioLab.dsModel(sim);
function card(ctx,k,x,y,w,L){const kk=Math.min(k,1.35),pad=10*kk,rows=[];
  L.filter(Boolean).forEach(r=>{const t=Array.isArray(r)?r:[r,{}],op=t[1]||{},sz=(op.s||13)*kk;ctx.font=(op.w||600)+' '+sz+'px '+H.FONT;
    const words=String(t[0]).split(' ');let cur='';words.forEach(wd=>{const tr=cur?cur+' '+wd:wd;if(cur&&ctx.measureText(tr).width>w-2*pad){rows.push([cur,op,sz]);cur=wd;}else cur=tr;});if(cur)rows.push([cur,op,sz]);});
  let h=pad*1.6;rows.forEach(r=>h+=r[2]*1.35);y-=h;
  ctx.save();H.rr(ctx,x,y,w,h,9);ctx.fillStyle=PAL['cv-sol']||PAL['card'];ctx.globalAlpha=0.96;ctx.fill();ctx.globalAlpha=1;ctx.lineWidth=2.5;ctx.strokeStyle=HI;ctx.stroke();
  let yy=y+pad*0.8;rows.forEach(([s,op,sz])=>{yy+=sz*1.1;H.txt(ctx,s,x+pad,yy,{s:sz,w:op.w||600,c:op.c||PAL['cv-ink']});yy+=sz*0.25;});ctx.restore();}
const C=(ctx,k,rows)=>card(ctx,k,14,392,250,rows);
const n=sim=>H.fmtNum(S(sim).n,0);
const base={slits:'two',watch:false,gas:0,sep:1,pred:false};

BioLab.addLearn({doubleslit:{
  goals:{
    bio:['Why each electron lands as one dot, yet thousands make wave bands','Why closing one slit removes the bands','Why recording which slit removes them too','Why tennis balls never make bands'],
    honors:['How band spacing depends on slit separation: s = λL/d','How every moving thing has a wavelength λ = h/p'],
    ap:['Why it is the record of the path, not the size, that ends interference (decoherence)']},
  matters:'Electron microscopes, which see viruses and the chips in your phone, work because electrons are waves. And when an ad sells “quantum” healing, this experiment shows what quantum effects actually need.',
  startKey:'one',startRun:true,
  steps:[
    {key:'one',title:'One electron at a time',set:Object.assign({src:'electron',rate:'one'},base),fresh:true,speed:1,focus:[[0,150,330,150],[540,30,250,390]],
     see:'Electrons leave the source one at a time, with time between them. Each one hits the screen as a single dot.',
     why:'An electron always arrives whole, in one place, like a tiny bullet. Nothing strange yet.',
     overlay(sim,ctx,LH,k){C(ctx,k,[[n(sim)+' electrons so far',{w:800}]]);}},
    {key:'build',title:'Thousands of dots make bands',set:Object.assign({src:'electron',rate:'flood'},base),cause:{from:{rate:'one'},delay:1.2,dur:0.4,label:'Speed'},speed:1,focus:[540,30,250,390],
     see:'Now 300 electrons a second. Watch where the dots pile up.',
     why:'Bright and dark bands appear. Only overlapping waves make bands: crests that meet add up, and a crest meeting a trough cancels.',
     overlay(sim,ctx,LH,k){C(ctx,k,[['Band contrast: '+Math.round(M(sim).V*100)+'%',{w:800,c:GREEN}],[n(sim)+' electrons']]);}},
    {key:'self',title:'Each one interfered with itself',set:Object.assign({src:'electron',rate:'many'},base),speed:1,focus:[[230,30,340,390],[540,30,250,390]],
     see:'Ten a second now. Watch the ripples spread from both slits.',
     why:'No two electrons were ever in flight together, so none collided. Each one passed like a wave through both slits, then landed as one dot.',
     overlay(sim,ctx,LH,k){C(ctx,k,[['One electron in flight at a time',{w:800}]]);}},
    {key:'oneslit',title:'Close one slit',set:Object.assign({src:'electron',rate:'flood'},base,{slits:'one'}),cause:{from:{slits:'two'},delay:1.5,dur:0.4,label:'Slits open',ring:[278,170,44,110]},speed:1,focus:[[270,30,70,390],[540,30,250,390]],
     see:'The bottom slit closes. The screen clears and fills again.',
     why:'One wide patch, no dark bands. Some places that were dark now get electrons: opening a second slit had made fewer land there.',
     overlay(sim,ctx,LH,k){C(ctx,k,[['Band contrast: '+Math.round(M(sim).V*100)+'%',{w:800,c:RED}]]);}},
    {key:'watch',title:'Watch which slit',set:Object.assign({src:'electron',rate:'flood'},base,{watch:true}),cause:{from:{watch:false},delay:1.8,dur:0.4,label:'Detector',ring:[300,170,50,110]},speed:1,focus:[[270,30,90,400],[540,30,250,390]],
     see:'Both slits open, then a detector starts recording which slit each electron uses.',
     why:'The bands vanish. Any record of the path, even one no person ever reads, removes the interference.',
     overlay(sim,ctx,LH,k){C(ctx,k,[['Path recorded: yes',{w:800,c:RED}],['Band contrast: '+Math.round(M(sim).V*100)+'%']]);}},
    {key:'hook',title:'Your question: why no bands from tennis balls?',set:Object.assign({src:'ball',rate:'flood'},base),fresh:true,speed:1,focus:[[0,30,800,390]],
     see:'Tennis balls thrown at two openings 1 m apart.',
     why:'Two piles, one behind each opening. A ball’s wavelength is about 4 × 10⁻³⁴ m, so its bands would be packed impossibly close, and air bumps record its path anyway.',
     overlay(sim,ctx,LH,k){C(ctx,k,[['λ = h/p ≈ 3.8 × 10⁻³⁴ m',{w:800}],['Band spacing: about 2 × 10⁻³³ m',{w:700,c:RED}]]);}},
    {key:'sep',lvl:'honors',title:'Slits farther apart, bands closer',set:Object.assign({src:'light',rate:'flood'},base,{sep:2,pred:true}),cause:{from:{sep:1},delay:1.5,dur:1.5,label:'Slit separation'},speed:1,focus:[[270,30,70,390],[540,30,250,390]],
     see:'Red laser light, 650 nm. The slits move twice as far apart.',
     why:'Band spacing s = λL/d. With d = 0.25 mm and L = 2 m, s = 5.2 mm; doubling d halves it to 2.6 mm.',
     overlay(sim,ctx,LH,k){const m=M(sim);C(ctx,k,[['s = λL/d = '+(m.sp*1000).toFixed(1)+' mm',{w:800}]]);}},
    {key:'gas',lvl:'ap',title:'Decoherence: the record, not the size',set:Object.assign({src:'c60',rate:'flood'},base,{gas:60}),fresh:true,cause:{from:{gas:0},delay:1.8,dur:0.4,label:'Gas hits'},speed:1,focus:[[230,30,340,390],[540,30,250,390]],
     see:'Buckyballs, 60 carbon atoms each. Then gas is let in: 60% get hit.',
     why:'Each hit leaves a record of the path, so those land with no bands. Contrast falls to about 40%. Hornberger’s team saw this in 2003.',
     overlay(sim,ctx,LH,k){C(ctx,k,[['Hit by gas: '+Math.round(M(sim).gas*100)+'%'],['Band contrast: '+Math.round(M(sim).V*100)+'%',{w:800,c:RED}]]);}}
  ],
  useIt:[
    {do:'Tilt an old CD or DVD under a lamp and look for the rainbow.',why:'Its tracks are about 1.6 µm apart (a CD) and act like thousands of slits. Each color’s bands land at a different angle.'},
    {do:'Be skeptical of products sold as “quantum” healing or energy.',why:'Interference needs a particle kept isolated, with no record of its path. Warm, wet bodies record everything within a tiny fraction of a second.'},
    {do:'Look at a streetlight through a window screen or an umbrella at night.',why:'The fine mesh spreads the light into a grid of spots: diffraction, the same effect Grimaldi named in 1665.'}],
  tryIt:[{title:'a laser pointer and a hair (5 minutes, dark room)',steps:['Tape one hair across the front of a laser pointer. Never look into the beam.','Shine it on a wall at least 2 m away.'],look:'A row of bright and dark spots spreads sideways from the center: light bending around the hair and interfering. A thinner hair spreads the spots farther apart.'}]}});

BioLab.addReview({doubleslit:{questions:[
  {id:'dot',kind:'test',lvl:'bio',q:'Electrons are sent one at a time at two slits. How does each single electron show up on the screen?',choices:['As one dot in one place','As a faint band pattern','As two dots, one per slit','As a smear across the screen'],correct:0,
   steps:['An electron is never split by the slits.','It always arrives whole, at one spot.','Only many dots together show the band pattern.']},
  {id:'bands',kind:'test',lvl:'bio',q:'Thousands of electrons sent one at a time build bright and dark bands. What does that show?',choices:['Each electron travels like a wave through both slits','The electrons bump into each other on the way','The slits push electrons into neat rows','Some electrons are lost at the dark bands'],correct:0,
   steps:['Bands come only from overlapping waves.','The electrons were sent alone, so none could collide.','So each one passed like a wave through both slits, then landed as a particle.']},
  {id:'detector',kind:'test',lvl:'bio',q:'A detector records which slit each electron goes through. What happens to the bands?',choices:['They vanish into one wide patch','They become sharper and brighter','They shift over toward one slit','They stay exactly the same'],correct:0,
   steps:['Interference needs two paths that can’t be told apart.','The detector’s record tells them apart.','With no overlap of the two waves, the dark bands fill in.']},
  {id:'ball',kind:'test',lvl:'bio',q:'Why do tennis balls thrown at two openings make two piles, not bands?',choices:['Their wavelength is far too tiny to see bands','Tennis balls have no wavelength at all','The openings are too far apart for any waves','Only light and electrons can ever make bands'],correct:0,
   steps:['Every moving object has a wavelength λ = h/p.','For a tennis ball, λ is about 4 × 10⁻³⁴ m.','The bands would be packed far closer than any detector could see, and air bumps record its path.']},
  {id:'spacing',kind:'test',lvl:'honors',q:'Red light (650 nm) passes two slits 0.25 mm apart onto a wall 2.0 m away. How far apart are the bright bands, in mm? (s = λL/d)',num:{ans:5.2,tol:0.1,unit:'mm'},
   steps:['s = λL/d.','(650 × 10⁻⁹ m)(2.0 m) ÷ (0.25 × 10⁻³ m).','= 5.2 × 10⁻³ m = 5.2 mm.']},
  {id:'closer',kind:'test',lvl:'honors',q:'You move the two slits closer together. What happens to the bands on the screen?',choices:['They spread farther apart','They move closer together','They stay where they were','They disappear completely'],correct:0,
   steps:['s = λL/d.','A smaller d makes a larger s.','So the bright bands spread farther apart.']},
  {id:'debroglie',kind:'test',lvl:'honors',q:'A buckyball (C₆₀) has a mass of 1.2 × 10⁻²⁴ kg and moves at 220 m/s. What is its wavelength in picometers? (λ = h/mv, h = 6.63 × 10⁻³⁴ J·s)',num:{ans:2.5,tol:0.1,unit:'pm'},
   steps:['λ = h/(mv).','6.63 × 10⁻³⁴ ÷ (1.2 × 10⁻²⁴ × 220).','≈ 2.5 × 10⁻¹² m = 2.5 pm.']},
  {id:'decohere',kind:'test',lvl:'ap',q:'Gas molecules hit 30% of the buckyballs on their way to the slits. About what band contrast remains?',choices:['About 70%','About 30%','About 100%','About 0%'],correct:0,
   steps:['Each hit records that molecule’s path, so it lands with no interference.','The other 70% still interfere.','Visibility ≈ 1 − 0.30 = 0.70.']}
]}});

BioLab.addPractical({doubleslit:{
  hook:'Physicists have sent electrons, atoms and even molecules of 2,000 atoms through slits and watched wave bands build up. Throw tennis balls at two open doors and you just get two piles. Why?',
  hookSet:{src:'ball',rate:'flood'},
  answer:'Every moving object has a wavelength λ = h/p. A 58 g tennis ball at 30 m/s has λ ≈ 3.8 × 10⁻³⁴ m, so with doors 1 m apart and a wall 5 m away its bands would be about 2 × 10⁻³³ m apart, far smaller than a proton. And air molecules and light hit the ball constantly, recording which door it used, which wipes out any bands anyway.',
  uses:['Electron microscopes: electrons at 50,000 volts have a wavelength of about 5 pm, far shorter than light’s, so they can see viruses and the transistors in a phone chip.',
    'CDs and DVDs: their tracks act like thousands of slits, splitting white light into rainbows.',
    '“Quantum” health products: interference needs isolation from every bump, which a warm, wet body never gives, so be skeptical of the label.'],
  takeaway:'Matter travels like a wave and arrives like a particle. Any record of which path it took, by a detector, a gas molecule or anything else, removes the wave bands. That is why big, warm things never show them.'}});

BioLab.addMyths({doubleslit:[
  {k:'conscious',s:'The bands vanish only when a person looks at the detector’s reading.',fact:false,why:'Any record of the path does it, even one stored by a machine nobody reads, or carried off by a gas molecule.'},
  {k:'onedot',s:'An electron sent alone through two slits lands as a single dot.',fact:true,why:'Each electron arrives whole, in one spot. The bands appear only after many dots pile up.'},
  {k:'big',s:'Molecules made of about 2,000 atoms have shown wave interference.',fact:true,why:'Fein and colleagues did it in 2019 with molecules heavier than 25,000 atomic mass units.'},
  {k:'split',s:'In the double-slit experiment, each electron splits into two halves.',fact:false,why:'No one ever detects half an electron. Its wave passes both slits, but it always lands whole.'}
]});
})();
