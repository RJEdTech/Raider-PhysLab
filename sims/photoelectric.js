(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,axes,bars,legend,fmtNum}=BioLab.h;

/* The photoelectric effect.
   Light of wavelength λ arrives as photons of energy E = hf = hc/λ (hc = 1239.84 eV·nm).
   An electron escapes the metal only if E > φ (the work function). The fastest electrons leave with KEmax = hf − φ.
   Brightness sets the photon rate, so it sets how many electrons come out (current), never how fast.
   A retarding (stopping) voltage V turns back electrons with KE < eV; the current reaches zero at V = KEmax/e. */
const HC=1239.84, C=2.998e8, QE=1.602e-19, PHMAX=1e14, ETA=1e-3;
const METALS={
  sodium:{n:'Sodium',s:'Na',phi:2.28,col:'#a7a9a0'},
  zinc:{n:'Zinc',s:'Zn',phi:4.33,col:'#8d99a8'},
  copper:{n:'Copper',s:'Cu',phi:4.65,col:'#b8693a'},
  platinum:{n:'Platinum',s:'Pt',phi:5.65,col:'#b9bcc8'}};
const MCOL={sodium:'s4',zinc:'s2',copper:'s1',platinum:'s5'};
const SUP={'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
function sci(x,d){if(!x)return '0';let e=Math.floor(Math.log10(Math.abs(x))),m=x/Math.pow(10,e);if(Math.abs(+m.toFixed(d))>=10){e++;m=x/Math.pow(10,e);}
  return m.toFixed(d)+' × 10'+String(e).split('').map(c=>SUP[c]).join('');}

function model(sim){const p=sim.p,m=METALS[p.metal]||METALS.sodium,lam=p.lam,E=HC/lam,f=C/(lam*1e-9),phi=m.phi,on=E>phi&&p.I>0,
  KE=E>phi?E-phi:0,rate=on?PHMAX*p.I/100*ETA:0,Isat=rate*QE*1e9,V=p.V||0,frac=KE>0?(V<KE?Math.pow(1-V/KE,2):0):0;
  return {m,lam,E,f,phi,on,above:E>phi,KE,rate,Isat,I:Isat*frac,frac,V,lam0:HC/phi};}

/* visible-light color for a wavelength (UV shown as violet, IR as deep red) */
function lamRGB(l){let r=0,g=0,b=0;
  if(l<380)return [138,92,230];
  if(l<440){r=(440-l)/60;b=1;}else if(l<490){g=(l-440)/50;b=1;}else if(l<510){g=1;b=(510-l)/20;}
  else if(l<580){r=(l-510)/70;g=1;}else if(l<645){r=1;g=(645-l)/65;}else r=1;
  const f=l<420?0.45+0.55*(l-380)/40:l>700?Math.max(0.45,1-0.55*(l-700)/50):1;
  return [Math.round(255*r*f),Math.round(255*g*f),Math.round(255*b*f)];}
const lamCol=(l,a)=>{const c=lamRGB(l);return a===undefined?`rgb(${c[0]},${c[1]},${c[2]})`:`rgba(${c[0]},${c[1]},${c[2]},${a})`;};
const lamInk=l=>{const c=lamRGB(l);return (0.3*c[0]+0.59*c[1]+0.11*c[2])>150?'#1c1c1f':'#ffffff';};

/* stage geometry (logical px) */
const LAMP={x:28,y:30,w:62,h:46},MOUTH=[90,53],PX=210,CX=552,GAP=CX-PX,HITY=133,HITH=30,SV=260;
const WLEN=60+356+60;
const SX=l=>40+(l-150)/600*720;

function measureAt(sim,lam){const s=sim.st,m=METALS[sim.p.metal]||METALS.sodium,E=HC/lam,KE=E-m.phi;if(KE<=0.02)return false;
  const v=Math.max(0,KE+(s.r()-0.5)*0.04),f=C/(lam*1e-9)/1e14;
  s.pts=s.pts.filter(q=>!(q.metal===sim.p.metal&&q.lam===lam));s.pts.push({metal:sim.p.metal,lam,f,v});return true;}
function fitFor(pts,metal){const q=pts.filter(p=>p.metal===metal);if(q.length<2)return null;const n=q.length;let sx=0,sy=0,sxx=0,sxy=0;
  q.forEach(p=>{sx+=p.f;sy+=p.v;sxx+=p.f*p.f;sxy+=p.f*p.v;});const den=n*sxx-sx*sx;if(Math.abs(den)<1e-9)return null;
  const m=(n*sxy-sx*sy)/den;return {m,b:(sy-m*sx)/n,n};}
const SWEEP=[160,180,200,220,240,260,290,320,360,400,450,500];

const SIM={
  id:'photoelectric',hash:'photoelectric',apUnit:13,order:4,prereq:['refraction','circuit'],
  tab:'The photoelectric effect',kind:'Go further',
  card:'Shine light of any color and brightness on four metals and find out why only the color decides whether electrons escape.',
  title:'The photoelectric effect: light as photons',
  lede:{bio:'Light knocks electrons out of a metal, but only if its color is blue enough. Brighter light alone never does it. Find out why light must come in packets.',
    honors:'Each photon carries energy E = hf. One photon frees one electron, if E beats the metal’s work function. Brightness sets how many electrons; frequency sets how fast.',
    ap:'Measure KEmax = hf − φ with a stopping voltage, plot stopping voltage against frequency, and pull Planck’s constant from the slope.'},
  scale:'A vacuum photocell a few centimeters across. One photon of 450 nm blue light carries 2.76 eV (4.4 × 10⁻¹⁹ J).',
  timeless:true,animated:true,chChange:0.6,chReveal:3,
  controls:[
    {id:'lam',label:'Wavelength (color)',type:'range',min:150,max:750,step:5,def:450,unit:' nm',d:0,help:'Shorter wavelength means higher frequency and more energy in each photon.'},
    {id:'I',label:'Brightness',type:'range',min:0,max:100,step:1,def:50,unit:'%',d:0,help:'More photons per second. Each photon still carries the same energy.'},
    {id:'metal',label:'Metal plate',type:'seg',def:'sodium',options:[{v:'sodium',l:'Sodium'},{v:'zinc',l:'Zinc'},{v:'copper',l:'Copper',lvl:'honors'},{v:'platinum',l:'Platinum',lvl:'honors'}]},
    {id:'V',label:'Stopping voltage',type:'range',min:0,max:6,step:0.02,def:0,unit:' V',d:2,lvl:'honors',help:'Pushes electrons back toward the plate. Raise it until the current just reaches zero.'}
  ],
  actions:[
    {id:'measure',label:'Measure stopping voltage',lvl:'ap',primary:true,run(sim){const ok=measureAt(sim,sim.p.lam);
      sim.st.msg={s:ok?'Measured: current hits zero at '+fmtNum(sim.st.pts[sim.st.pts.length-1].v,2)+' V':'No current at this color, so there is nothing to stop',life:2.6};}},
    {id:'sweep',label:'Measure across the spectrum',lvl:'ap',run(sim){let n=0;SWEEP.forEach(l=>{if(measureAt(sim,l))n++;});
      sim.st.msg={s:n?'Measured '+n+' colors on '+(METALS[sim.p.metal]||METALS.sodium).n.toLowerCase():'No color here frees electrons from this metal',life:2.6};}},
    {id:'clear',label:'Clear graph',lvl:'ap',run(sim){sim.st.pts=[];}}
  ],
  init(sim){return {pts:[],ph:[],el:[],fl:[],wire:0,spawn:0,r:rng(7),msg:null};},
  step(sim,dt){const s=sim.st,M=model(sim);dt=Math.min(dt,0.25);
    s.spawn+=dt*26*sim.p.I/100;while(s.spawn>=1){s.spawn-=1;if(s.ph.length<60)s.ph.push({p:0,o:s.r()*2-1});}
    for(let i=s.ph.length-1;i>=0;i--){const q=s.ph[i];q.p+=dt/0.6;if(q.p<1)continue;s.ph.splice(i,1);const y=HITY+q.o*HITH;
      if(M.above&&s.r()<0.75){if(s.el.length<120){const k=M.KE*(1-Math.sqrt(s.r())),kv=Math.max(k,0.03);s.el.push({x:PX+2,y,vx:SV*Math.sqrt(kv),vy:(s.r()-0.5)*14});}}
      else if(s.fl.length<30)s.fl.push({y,life:0.5});}
    const a=SV*SV*(sim.p.V||0)/(2*GAP),n=Math.ceil(dt/0.02),h=dt/n;
    for(let j=0;j<n;j++)for(let i=s.el.length-1;i>=0;i--){const e=s.el[i];e.vx-=a*h;e.x+=e.vx*h;e.y=clamp(e.y+e.vy*h,72,194);if(e.x>=CX||e.x<PX)s.el.splice(i,1);}
    for(let i=s.fl.length-1;i>=0;i--){s.fl[i].life-=dt;if(s.fl[i].life<=0)s.fl.splice(i,1);}
    s.wire=(s.wire+dt*(25+150*Math.min(M.I,16)/16))%WLEN;
    if(s.msg){s.msg.life-=dt;if(s.msg.life<=0)s.msg=null;}},
  metrics:[
    {id:'E',label:'Photon energy (hf)',unit:'eV',d:2,min:0,max:8.5,get:s=>model(s).E},
    {id:'phi',label:'Work function φ (energy to escape)',unit:'eV',d:2,min:0,max:8.5,get:s=>model(s).phi},
    {id:'KE',label:'Fastest electron’s energy (KEmax)',unit:'eV',d:2,min:0,max:6,get:s=>model(s).KE},
    {id:'rate',label:'Electrons freed per second',unit:'billion',d:0,min:0,max:100,get:s=>model(s).rate/1e9},
    {id:'I',label:'Current to collector',unit:'nA',d:2,min:0,max:16,lvl:'honors',get:s=>model(s).I},
    {id:'lam0',label:'Threshold wavelength',unit:'nm',d:0,lvl:'honors',get:s=>model(s).lam0},
    {id:'f',label:'Frequency',unit:'× 10¹⁴ Hz',d:2,lvl:'ap',get:s=>model(s).f/1e14},
    {id:'fit',label:'Slope of your stopping-voltage graph',text:true,lvl:'ap',noTrial:true,get(sim){const F=fitFor(sim.st.pts,sim.p.metal);
      if(!F)return 'Measure 2 or more colors on this metal';return sci(F.m*1e-14,2)+' V·s, so h ≈ '+sci(F.m*1e-14*QE,2)+' J·s';}}
  ],
  graphs:[{id:'budget',label:'Energy budget for one photon',custom:true},{id:'iv',label:'Current vs stopping voltage',lvl:'honors',custom:true},
    {id:'kef',label:'KEmax vs frequency (all metals)',lvl:'honors',custom:true},{id:'vf',label:'Your data: stopping voltage vs frequency',lvl:'ap',custom:true}],
  defaultGraph:'budget',
  plot(sim,ctx,box,id){const M=model(sim);
    if(id==='budget'){const ax=axes(ctx,box,{xmin:0,xmax:3,ymin:0,ymax:9,xcats:['Photon (hf)','Escape (φ)','Left over (KE)'],yl:'Energy (eV)'});
      bars(ctx,ax,[M.E,M.phi,M.KE],{colors:[lamCol(M.lam),PAL['s5'],PAL['s3']],d:2});
      if(!M.above)txt(ctx,'Photon is '+(M.phi-M.E).toFixed(2)+' eV short: no electron escapes',box.L+box.W/2,box.T+16,{s:14,w:600,c:PAL['s1'],a:'center'});
      return;}
    if(id==='iv'){const ax=axes(ctx,box,{xmin:0,xmax:6,ymin:0,ymax:17,xl:'Stopping voltage (V)',yl:'Current (nA)'});
      if(!M.on){txt(ctx,M.above?'Lamp is off: no photons, no current':'No current at any voltage: each photon is too weak',box.L+box.W/2,box.T+20,{s:14,w:600,c:PAL['s1'],a:'center'});return;}
      ctx.strokeStyle=PAL['g-line'];ctx.lineWidth=2.5;ctx.beginPath();for(let i=0;i<=120;i++){const v=6*i/120,c=v<M.KE?M.Isat*Math.pow(1-v/M.KE,2):0;i?ctx.lineTo(ax.X(v),ax.Y(c)):ctx.moveTo(ax.X(v),ax.Y(c));}ctx.stroke();
      const xs=ax.X(Math.min(M.KE,6));ctx.setLineDash([4,4]);ctx.strokeStyle=PAL['muted'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(xs,box.T);ctx.lineTo(xs,box.T+box.H);ctx.stroke();ctx.setLineDash([]);
      txt(ctx,'V stop = '+M.KE.toFixed(2)+' V',Math.min(xs+6,box.L+box.W-110),box.T+14,{s:13,c:PAL['muted']});
      ctx.fillStyle=PAL['g-dot'];ctx.beginPath();ctx.arc(ax.X(Math.min(M.V,6)),ax.Y(M.I),5.5,0,6.29);ctx.fill();return;}
    if(id==='kef'){const ap=atLeast('ap');box.T=34;box.H-=22;const ax=axes(ctx,box,{xmin:0,xmax:20,ymin:ap?-6:0,ymax:6,xl:'Frequency (× 10¹⁴ Hz)',yl:'KEmax (eV)'});
      const items=[];Object.keys(METALS).forEach(k=>{const m=METALS[k],col=PAL[MCOL[k]],f0=m.phi/0.41357;items.push({label:m.s,color:col});
        ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();ctx.strokeStyle=col;ctx.lineWidth=k===sim.p.metal?3.5:2;
        ctx.beginPath();ctx.moveTo(ax.X(f0),ax.Y(0));ctx.lineTo(ax.X(20),ax.Y(20*0.41357-m.phi));ctx.stroke();
        if(ap){ctx.setLineDash([5,4]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(-m.phi));ctx.lineTo(ax.X(f0),ax.Y(0));ctx.stroke();ctx.setLineDash([]);}
        ctx.restore();});
      const fx=M.f/1e14;ctx.fillStyle=PAL[MCOL[sim.p.metal]];ctx.strokeStyle=PAL['card'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(ax.X(fx),ax.Y(M.KE),6,0,6.29);ctx.fill();ctx.stroke();
      legend(ctx,box.L,14,items);if(ap)txt(ctx,'Slope = h for every metal',box.L+box.W,14,{s:13,c:PAL['muted'],a:'right',b:'middle'});return;}
    if(id==='vf'){box.T=34;box.H-=22;const ax=axes(ctx,box,{xmin:0,xmax:20,ymin:0,ymax:6.5,xl:'Frequency (× 10¹⁴ Hz)',yl:'Stopping voltage (V)'});
      const pts=sim.st.pts;if(!pts.length){txt(ctx,'Press Measure across the spectrum to add points.',box.L+box.W/2,box.T+box.H/2,{s:14,c:PAL['muted'],a:'center',b:'middle'});return;}
      const items=[];Object.keys(METALS).forEach(k=>{const q=pts.filter(p=>p.metal===k);if(!q.length)return;const col=PAL[MCOL[k]];items.push({label:METALS[k].s,color:col});
        const F=fitFor(pts,k);if(F){const f0=-F.b/F.m;ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();ctx.strokeStyle=col;ctx.lineWidth=2;
          ctx.beginPath();ctx.moveTo(ax.X(Math.max(0,f0)),ax.Y(Math.max(0,F.m*Math.max(0,f0)+F.b)));ctx.lineTo(ax.X(20),ax.Y(F.m*20+F.b));ctx.stroke();ctx.restore();}
        q.forEach(p=>{ctx.fillStyle=col;ctx.strokeStyle=PAL['card'];ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(ax.X(p.f),ax.Y(p.v),5,0,6.29);ctx.fill();ctx.stroke();});});
      legend(ctx,box.L,14,items);const F=fitFor(pts,sim.p.metal);
      if(F)txt(ctx,METALS[sim.p.metal].s+' slope '+sci(F.m*1e-14,2)+' V·s',box.L+box.W,14,{s:13,c:PAL['muted'],a:'right',b:'middle'});}},
  infoPanel(sim){const M=model(sim),mn=M.m.n.toLowerCase(),E=M.E.toFixed(2),phi=M.phi.toFixed(2);
    const wave=M.above?'Brighter light shakes electrons harder, so <b>brighter light should make faster electrons</b>, and dim light should need time to build up energy.'
      :'Light energy spreads out evenly, so <b>bright enough light of any color should free electrons</b>. Turning this light up should work.';
    const photon='Light arrives in packets of E = hf = '+E+' eV. One photon frees one electron, so brightness sets <b>how many</b> electrons and color sets <b>how fast</b> they can go.';
    const now=M.above?'Each photon brings '+E+' eV and '+mn+' needs '+phi+' eV, so electrons escape with up to '+M.KE.toFixed(2)+' eV, at any brightness above zero.'
      :'Each photon brings '+E+' eV but '+mn+' needs '+phi+' eV, so no electron escapes, even at full brightness.';
    return '<div class="p-head"><h3>Wave model or photon model?</h3></div><p><b>Wave model says:</b> '+wave+'</p><p><b>Photon model says:</b> '+photon+'</p><p><b>Right now:</b> '+now+' Experiments match the photon model.</p>'+
      (atLeast('honors')?'<p>Einstein (1905): KEmax = hf − φ.</p>':'');},
  narrate(sim){const M=model(sim),mn=M.m.n.toLowerCase(),lam=M.lam+' nm',E=M.E.toFixed(2)+' eV',phi=M.phi.toFixed(2)+' eV';
    if(sim.p.I<=0)return 'The lamp is off. With <b>no photons arriving</b>, nothing can knock electrons loose.';
    if(!M.above)return 'Each photon of '+lam+' light carries '+E+', but '+mn+' needs '+phi+' to free an electron. <b>No single photon has enough energy</b>, so no electrons come out'+(sim.p.I>=80?', even at '+sim.p.I+'% brightness.':', however bright the light.');
    if(M.V>0&&M.V>=M.KE)return 'The '+M.V.toFixed(2)+' V stopping voltage is more than the fastest electron’s '+M.KE.toFixed(2)+' eV can climb, so <b>every electron turns back</b> and the current is zero. The voltage that just stops them measures KEmax.';
    let s='Each '+lam+' photon carries '+E+'. It spends '+phi+' freeing an electron from '+mn+', and the electron keeps the rest: <b>up to '+M.KE.toFixed(2)+' eV</b> of kinetic energy.';
    if(M.V>0)s+=' The '+M.V.toFixed(2)+' V stopping voltage turns back the slower ones; '+Math.round(M.frac*100)+'% still reach the collector.';
    return s;},
  challenges:[
    {lvl:'bio',q:'Red light (700 nm) frees no electrons from zinc. What happens if you make the red light four times brighter?',choices:['Electrons start coming out','Still no electrons','A few electrons trickle out after a delay'],correct:1,
      baseline:{metal:'zinc',lam:700,I:25},change:{I:100},changeText:'Brightness raised from 25% to 100%',watch:'budget',
      explain:{bio:'Brighter light means more photons, but each red photon still has only 1.77 eV, far short of zinc’s 4.33 eV. One photon has to do the whole job, so piling on more weak photons never frees an electron.',
        ap:'Each photon is absorbed by one electron, so E = hf must exceed φ. With hf = 1.77 eV < 4.33 eV, the rate of ejection is zero at any intensity. The wave model predicted the opposite.'}},
    {lvl:'bio',q:'Ultraviolet light (250 nm) frees electrons from zinc. If you make the UV brighter, what happens to the fastest electron’s energy?',choices:['It goes up','It stays the same','It goes down'],correct:1,
      baseline:{metal:'zinc',lam:250,I:25},change:{I:100},changeText:'Brightness raised from 25% to 100%',watch:'budget',
      explain:{bio:'The fastest electron gets one photon’s energy minus the escape cost: 4.96 − 4.33 = 0.63 eV, whatever the brightness. Brighter light just frees more electrons per second.',
        ap:'KEmax = hf − φ has no intensity term. Intensity sets the photon flux, so it scales the number of photoelectrons (the current), not their maximum energy.'}},
    {lvl:'bio',q:'Red light (650 nm) frees no electrons from sodium. Keep the same brightness and switch to blue light (450 nm). What happens?',choices:['Still nothing, because blue is no brighter','Electrons come out','Fewer electrons than before'],correct:1,
      baseline:{metal:'sodium',lam:650,I:60},change:{lam:450},changeText:'Switched from 650 nm red to 450 nm blue',watch:'budget',
      explain:{bio:'A blue photon carries 2.76 eV, more than the 2.28 eV sodium needs, while a red photon carries only 1.91 eV. Color, not brightness, decides whether each photon can free an electron.',
        honors:'Sodium’s threshold wavelength is 1240/2.28 ≈ 544 nm. Light shorter than that (higher frequency) has hf > φ and frees electrons; longer wavelengths never do.'}},
    {lvl:'honors',q:'UV light (250 nm) shines on zinc at 30% brightness. You raise it to 90%. What changes?',choices:['More electrons, each with the same top energy','Same number of electrons, but faster ones','More electrons and faster ones'],correct:0,
      baseline:{metal:'zinc',lam:250,I:30},change:{I:90},changeText:'Brightness raised from 30% to 90%',watch:'iv',
      explain:{honors:'Three times the photons means three times the electrons, so the current triples. Each photon still has 4.96 eV, so KEmax stays 0.63 eV and the stopping voltage stays 0.63 V.',
        ap:'The I–V curve scales vertically by 3 but still reaches zero at the same V stop = 0.63 V. Saturation current ∝ intensity; stopping voltage depends only on f and φ.'}},
    {lvl:'honors',q:'The UV lamp on zinc is off. You turn it on very dimly (3%). The wave model says the electrons need time to soak up energy. What do you see?',choices:['Electrons appear right away, just fewer of them','No electrons until enough energy builds up','No electrons at all'],correct:0,
      baseline:{metal:'zinc',lam:250,I:0},change:{I:3},changeText:'Lamp turned on at 3%',watch:'iv',
      explain:{honors:'Each UV photon that is absorbed frees an electron at once. Dim light means fewer photons, so fewer electrons, but there is no waiting. Experiments find no measurable delay, even in very dim light.',
        ap:'A spread-out classical wave on a dim source would take seconds to minutes to deliver 4.33 eV to one electron. The measured delay is under a few nanoseconds: energy arrives in quanta.'}},
    {lvl:'honors',q:'Zinc under 250 nm UV needs a stopping voltage of 0.63 V. You switch to 200 nm UV (higher frequency). What happens to the stopping voltage?',choices:['It goes up','It stays the same','It goes down'],correct:0,
      baseline:{metal:'zinc',lam:250,I:60},change:{lam:200},changeText:'Switched from 250 nm to 200 nm',watch:'kef',
      explain:{honors:'Each 200 nm photon carries 6.20 eV instead of 4.96 eV. After the 4.33 eV escape cost, electrons keep 1.87 eV, so it takes 1.87 V to stop them, up by 1.24 V.',
        ap:'V stop = (h/e)f − φ/e. Raising f by 3.0 × 10¹⁴ Hz raises V stop by (4.14 × 10⁻¹⁵ V·s)(3.0 × 10¹⁴ Hz) = 1.24 V.'}},
    {lvl:'honors',q:'250 nm UV frees electrons from zinc. You swap the zinc plate for platinum. What happens?',choices:['Electrons still come out, just a bit slower','No electrons at all','More electrons, since platinum conducts so well'],correct:1,
      baseline:{metal:'zinc',lam:250,I:80},change:{metal:'platinum'},changeText:'Plate switched from zinc to platinum',watch:'kef',
      explain:{honors:'Platinum holds its electrons more tightly: φ = 5.65 eV. A 4.96 eV photon is now below threshold, so nothing escapes. Platinum needs light shorter than about 219 nm.'}},
    {lvl:'ap',q:'You measure stopping voltage across the spectrum for sodium, then for platinum. How do the two lines compare?',choices:['Parallel lines: same slope h/e, shifted by the different work functions','Platinum’s line is steeper','The two metals give the same line'],correct:0,
      baseline:{metal:'sodium',lam:450},baselineAction:'sweep',change:{metal:'platinum'},changeAction:'sweep',changeText:'Plate switched to platinum and measured',watch:'vf',
      explain:{ap:'V stop = (h/e)f − φ/e. The slope h/e = 4.14 × 10⁻¹⁵ V·s is the same for every metal, because it comes from the photon, not the metal. The x-intercepts are the threshold frequencies f₀ = φ/h: 5.5 × 10¹⁴ Hz for sodium, 13.7 × 10¹⁴ Hz for platinum.'}},
    {lvl:'ap',q:'Sodium under 400 nm light has KEmax = 0.82 eV. You halve the wavelength to 200 nm, doubling the frequency. KEmax becomes…',choices:['Exactly double (1.64 eV)','More than double','Less than double'],correct:1,
      baseline:{metal:'sodium',lam:400,I:60},change:{lam:200},changeText:'Wavelength halved to 200 nm',watch:'kef',
      explain:{ap:'Photon energy doubles from 3.10 to 6.20 eV, but the 2.28 eV work function is paid only once: KEmax = 6.20 − 2.28 = 3.92 eV, nearly 5 times larger. KEmax is linear in f, not proportional to it.'}},
    {lvl:'ap',q:'250 nm UV on zinc, with the stopping voltage held at 0.30 V. You double the brightness from 40% to 80%. The current…',choices:['Doubles','Stays the same, because the voltage sets the current','Rises, but less than double'],correct:0,
      baseline:{metal:'zinc',lam:250,I:40,V:0.3},change:{I:80},changeText:'Brightness doubled',watch:'iv',
      explain:{ap:'At a fixed retarding voltage, the same fraction of electrons (those with KE > 0.30 eV) reaches the collector. Doubling the photon flux doubles the number freed, so the current doubles: I ∝ intensity at every V below V stop.'}}
  ],
  tour:[
    {lvl:'bio',title:'Light comes in packets',text:'The lamp sends out light as <b>photons</b>, tiny packets of energy. Each wiggle here is a photon. Blue photons carry more energy than red ones.',
      focus:[18,18,200,150],speed:0.35,setup(sim){BioLab.setValues(sim,{metal:'sodium',lam:450,I:60,V:0});BioLab.reset(sim);}},
    {lvl:'bio',title:'One photon, one electron',text:'When a photon hits the sodium plate, it hands all its energy to <b>one electron</b>. If that is enough to escape, the electron flies across the vacuum to the collector.',
      focus:[168,22,424,216],speed:0.3},
    {lvl:'bio',title:'The energy ladder',text:'The electron must climb out of the metal. That climb is the <b>work function φ</b>. Whatever photon energy is left over becomes the electron’s kinetic energy.',
      focus:[602,8,196,312],speed:0.3},
    {lvl:'bio',title:'Too red: nothing happens',text:'Now red light on a zinc plate. Each red photon has far less energy than zinc’s 4.33 eV escape cost, so <b>no electron gets out</b>. The faded part of the spectrum bar never works on zinc.',
      focus:[[168,22,424,216],[30,330,740,112]],speed:0.35,setup(sim){BioLab.setValues(sim,{metal:'zinc',lam:650,I:50,V:0});BioLab.reset(sim);}},
    {lvl:'bio',title:'Brighter does not help',text:'Full brightness sends more red photons, but each one is still too weak. Electrons cannot save up energy from several photons, so <b>still nothing comes out</b>.',
      focus:[[18,18,200,150],[602,8,196,312]],speed:0.35,setup(sim){BioLab.setValues(sim,{I:100});}},
    {lvl:'bio',title:'Ultraviolet works',text:'Switch to 240 nm ultraviolet. Each photon now has 5.17 eV, more than zinc’s 4.33 eV, so electrons escape at once with up to <b>0.84 eV</b> to spare.',
      focus:[[168,22,424,216],[30,330,740,112]],speed:0.3,setup(sim){BioLab.setValues(sim,{lam:240,I:60});BioLab.reset(sim);}},
    {lvl:'honors',title:'Stopping voltage',text:'A battery pushes electrons back. At 0.50 V, slower electrons turn around before the collector and the ammeter reading drops. At 0.84 V even the fastest turn back: that <b>stopping voltage equals KEmax in eV</b>.',
      focus:[168,22,424,306],speed:0.3,setup(sim){BioLab.setValues(sim,{V:0.5});}},
    {lvl:'ap',title:'Planck’s constant from a graph',text:'The stopping voltage was just measured at many colors. On the graph <b>Your data: stopping voltage vs frequency</b>, the slope is h/e ≈ 4.14 × 10⁻¹⁵ V·s, and the x-intercept is the threshold frequency.',
      focus:[[602,8,196,312],[30,330,740,112]],speed:0.3,setup(sim){BioLab.setValues(sim,{V:0,lam:240});BioLab.reset(sim);SIM.actions[1].run(sim);if(sim.ui&&sim.ui.gm&&[...sim.ui.gm.options].some(o=>o.value==='vf')){sim.gMetric='vf';sim.ui.gm.value='vf';}}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{metal:'sodium',lam:450,I:50,V:0});BioLab.reset(sim);},
  lab:{bio:'<p><b>Question:</b> Does brighter light or bluer light make electrons escape from zinc?</p><ol><li>Choose <b>Zinc</b>. Set the wavelength to 650 nm and record trials at 20%, 60% and 100% brightness.</li><li>Keep 60% brightness. Lower the wavelength in 50 nm steps until electrons appear, recording each trial.</li><li>Note the longest wavelength that still frees electrons.</li></ol><p><b>Write:</b> Which matters for freeing electrons, brightness or color? Use your data and the idea of photons to explain.</p>',
    honors:'<p><b>Question:</b> What is the threshold wavelength of each metal, and how does current depend on brightness?</p><ol><li>For each metal, find the longest wavelength that frees electrons. Compare it with the threshold wavelength readout.</li><li>Pick a wavelength that works on zinc. Record the current at 20%, 40%, 60%, 80% and 100% brightness.</li><li>Plot current against brightness with the Trials graph.</li><li>At one brightness, raise the stopping voltage until the current reaches zero. Repeat at two other wavelengths.</li></ol><p><b>Write:</b> Explain why the threshold depends on the metal, and why current is proportional to brightness but the stopping voltage is not.</p>',
    ap:'<p><b>Question:</b> Can you measure Planck’s constant and a metal’s work function from stopping voltages?</p><ol><li>Choose a metal. At five or more wavelengths above threshold, raise the stopping voltage until the current is zero, then press <b>Measure stopping voltage</b> (or use <b>Measure across the spectrum</b>).</li><li>Open <b>Your data: stopping voltage vs frequency</b>. Record the slope and find the x-intercept.</li><li>Compute h = e × slope and φ = h f₀. Repeat for a second metal.</li></ol><p><b>Write a CER:</b> Claim a value of h and each φ. Use the slopes and intercepts as evidence. Reason from energy conservation (eV stop = hf − φ) why every metal gives the same slope.</p>'},
  terms:[
    {t:'Photon',d:'A packet (quantum) of light energy. Its energy depends only on its frequency: E = hf.'},
    {t:'Photoelectron',d:'An electron knocked out of a metal by a photon.'},
    {t:'Work function (φ)',d:'The least energy needed to pull an electron out of a particular metal’s surface.'},
    {t:'Threshold frequency',d:'The lowest frequency of light that can free electrons from a metal: f₀ = φ/h. The matching longest wavelength is λ₀ = hc/φ.'},
    {t:'Kinetic energy (KEmax)',d:'Energy of motion. The fastest photoelectrons have KEmax = hf − φ.'},
    {t:'Electron-volt (eV)',lvl:'honors',d:'The energy one electron gains crossing 1 volt: 1 eV = 1.602 × 10⁻¹⁹ J.'},
    {t:'Stopping voltage',lvl:'honors',d:'The retarding voltage that just stops the fastest photoelectrons, so the current falls to zero: eV stop = KEmax.'},
    {t:'Planck’s constant (h)',lvl:'ap',d:'h = 6.626 × 10⁻³⁴ J·s = 4.136 × 10⁻¹⁵ eV·s. The slope of KEmax vs f.'},
    {t:'Wave–particle duality',lvl:'ap',d:'Light spreads and interferes like a wave, but delivers energy in whole photons, like particles.'}
  ],
  about:'<p><b>Photon energy:</b> E = hf = hc/λ, with hc = 1239.84 eV·nm, so 450 nm light gives 2.76 eV. Frequency f = c/λ with c = 2.998 × 10⁸ m/s.</p><p><b>Einstein’s equation:</b> KEmax = hf − φ, and the stopping voltage is V stop = KEmax/e. Work functions used: sodium 2.28 eV, zinc 4.33 eV, copper 4.65 eV, platinum 5.65 eV (measured values vary by about ±0.2 eV with surface condition).</p><p><b>Current:</b> at 100% brightness the lamp delivers 10¹⁴ photons per second, and about 1 in 1000 photons above threshold frees an electron (quantum efficiency 10⁻³), giving 16 nA. Brightness changes the photon rate, not the energy per photon.</p><p><b>Simplifications:</b> freed electrons have energies spread from 0 to KEmax; this model uses a simple spread in which the fraction that beats a retarding voltage V is (1 − V/V stop)². Quantum efficiency is held constant above threshold, and contact potentials, reflection and the plate’s temperature are ignored. Wavelengths below 200 nm need a vacuum path and a quartz or MgF₂ window. The dots on screen are a sample: each one stands for billions of photons or electrons, and the share of photons that free an electron is exaggerated so you can see it. “Measure stopping voltage” adds a reading error of about ±0.02 V.</p>',
  draw(sim,ctx,vdt,k){const M=model(sim),s=sim.st,ink=PAL['cv-ink'],soft=PAL['cv-soft'];
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    /* beam */
    const bA=0.06+0.22*sim.p.I/100;if(sim.p.I>0){ctx.fillStyle=lamCol(M.lam,bA);ctx.beginPath();ctx.moveTo(MOUTH[0],MOUTH[1]-8);ctx.lineTo(PX,HITY-HITH-4);ctx.lineTo(PX,HITY+HITH+4);ctx.lineTo(MOUTH[0],MOUTH[1]+8);ctx.closePath();ctx.fill();}
    /* tube */
    ctx.save();ctx.globalAlpha=0.16;ctx.fillStyle=PAL['cv-glass'];rr(ctx,170,24,420,212,36);ctx.fill();ctx.restore();
    ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.5;rr(ctx,170,24,420,212,36);ctx.stroke();
    txt(ctx,'vacuum',380,226,{s:12*k,c:soft,a:'center'});
    /* lamp */
    ctx.fillStyle=PAL['cv-lamp'];rr(ctx,LAMP.x,LAMP.y,LAMP.w,LAMP.h,9);ctx.fill();
    ctx.fillStyle=sim.p.I>0?lamCol(M.lam):PAL['muted'];rr(ctx,LAMP.x+LAMP.w-10,LAMP.y+8,12,LAMP.h-16,4);ctx.fill();
    txt(ctx,'Lamp',LAMP.x+LAMP.w/2,LAMP.y+LAMP.h+16*k,{s:12*k,c:soft,a:'center'});
    /* plates */
    ctx.fillStyle=M.m.col;ctx.fillRect(196,66,14,134);ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.strokeRect(196.5,66.5,13,133);
    ctx.fillStyle='#7d838d';ctx.fillRect(552,66,12,134);
    txt(ctx,M.m.n+' plate',203,58,{s:12*k,w:600,c:ink,a:'center'});
    txt(ctx,'Collector',586,58,{s:12*k,w:600,c:ink,a:'right'});
    /* photons */
    const dx=PX-MOUTH[0],dy=HITY-MOUTH[1],dl=Math.hypot(dx,dy),ux=dx/dl,uy=dy/dl,wl=Math.max(2.4,M.lam/55);
    ctx.strokeStyle=lamCol(M.lam);ctx.lineWidth=2;
    s.ph.forEach(q=>{const ex=PX,ey=HITY+q.o*HITH,sx0=MOUTH[0],sy0=MOUTH[1]+q.o*6,cx=sx0+(ex-sx0)*q.p,cy=sy0+(ey-sy0)*q.p;
      ctx.beginPath();for(let j=0;j<=18;j++){const a=j-9,off=Math.sin(a/wl*2*Math.PI)*3.5;const X=cx+ux*a-uy*off,Y=cy+uy*a+ux*off;j?ctx.lineTo(X,Y):ctx.moveTo(X,Y);}ctx.stroke();});
    s.fl.forEach(f=>{ctx.strokeStyle=lamCol(M.lam,clamp(f.life/0.5,0,1));ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(PX,f.y,4+(0.5-f.life)*16,-Math.PI/2,Math.PI/2,true);ctx.stroke();});
    /* electrons */
    ctx.fillStyle=PAL['cv-e'];ctx.strokeStyle=PAL['cv-estroke'];ctx.lineWidth=1;
    s.el.forEach(e=>{ctx.beginPath();ctx.arc(e.x,e.y,3.6,0,6.29);ctx.fill();ctx.stroke();});
    /* circuit */
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(203,200);ctx.lineTo(203,260);ctx.lineTo(559,260);ctx.lineTo(559,200);ctx.stroke();
    if(M.I>0.001){ctx.fillStyle=PAL['cv-e'];ctx.strokeStyle=PAL['cv-estroke'];for(let i=0;i<14;i++){let d=(s.wire+i*WLEN/14)%WLEN;let x,y;
      if(d<60){x=559;y=200+d;}else if(d<416){x=559-(d-60);y=260;}else{x=203;y=260-(d-416);}ctx.beginPath();ctx.arc(x,y,3,0,6.29);ctx.fill();ctx.stroke();}}
    const AX=330,AY=260;ctx.fillStyle=PAL['card'];ctx.beginPath();ctx.arc(AX,AY,19,0,6.29);ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=2;ctx.stroke();
    const ang=-Math.PI/2+(-0.9+1.8*clamp(M.I/16,0,1));ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(AX,AY+8);ctx.lineTo(AX+Math.cos(ang)*16,AY+8+Math.sin(ang)*16);ctx.stroke();
    txt(ctx,'A',AX,AY+15,{s:10,w:700,c:ink,a:'center'});
    txt(ctx,(atLeast('honors')?M.I.toFixed(2)+' nA':(M.I>0.001?'current on':'no current')),AX,AY+22+12*k,{s:13*k,w:600,c:ink,a:'center'});
    if(atLeast('honors')){const BX=446;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(BX-8,AY-16,16,32);ctx.strokeStyle=ink;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(BX-6,AY-16);ctx.lineTo(BX-6,AY+16);ctx.stroke();
      ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(BX+6,AY-9);ctx.lineTo(BX+6,AY+9);ctx.stroke();
      txt(ctx,M.V.toFixed(2)+' V',BX,AY+22+12*k,{s:13*k,w:600,c:ink,a:'center'});}
    /* energy ladder */
    const PL=604,PT=8,PW=192,PH=306,base=284,S=29;ctx.fillStyle=PAL['card'];rr(ctx,PL,PT,PW,PH,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
    ctx.fillStyle=M.m.col;rr(ctx,PL+8,base,62,PH+PT-base-8,6);ctx.fill();txt(ctx,M.m.s,PL+39,base+(PH+PT-base-8)/2+1,{s:12*k,w:700,c:'#1c1c1f',a:'center',b:'middle'});
    const yP=base-M.phi*S,yE=base-M.E*S,ax0=PL+40;
    ctx.setLineDash([5,4]);ctx.strokeStyle=ink;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(PL+8,yP);ctx.lineTo(PL+72,yP);ctx.stroke();ctx.setLineDash([]);
    if(M.above){ctx.strokeStyle=PAL['s3'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(ax0+12,yP);ctx.lineTo(ax0+18,yP);ctx.lineTo(ax0+18,yE);ctx.lineTo(ax0+12,yE);ctx.stroke();}
    txt(ctx,'φ',PL+12,yP-5,{s:12*k,w:700,c:ink});
    ctx.strokeStyle=lamCol(M.lam);ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(ax0,base);ctx.lineTo(ax0,Math.max(yE+6,yE));ctx.stroke();
    ctx.fillStyle=lamCol(M.lam);ctx.beginPath();ctx.moveTo(ax0,yE);ctx.lineTo(ax0-7,yE+10);ctx.lineTo(ax0+7,yE+10);ctx.closePath();ctx.fill();
    const tx=PL+80,ls=17*k;let ty=PT+14+10*k;
    txt(ctx,'Photon hf',tx,ty,{s:12*k,c:soft});ty+=ls;txt(ctx,M.E.toFixed(2)+' eV',tx,ty,{s:13*k,w:700,c:ink});ty+=ls*1.3;
    txt(ctx,'Escape φ',tx,ty,{s:12*k,c:soft});ty+=ls;txt(ctx,M.phi.toFixed(2)+' eV',tx,ty,{s:13*k,w:700,c:ink});ty+=ls*1.3;
    txt(ctx,M.above?'Left over':'Short by',tx,ty,{s:12*k,c:soft});ty+=ls;txt(ctx,(M.above?M.KE:M.phi-M.E).toFixed(2)+' eV',tx,ty,{s:13*k,w:700,c:M.above?PAL['s3']:PAL['s1']});ty+=ls*1.4;
    txt(ctx,M.above?'escapes':'stays in',tx,ty,{s:13*k,w:700,c:M.above?PAL['s3']:PAL['s1']});
    /* spectrum strip */
    const BY=368,BH=20;for(let x=40;x<760;x+=2){const l=150+(x-40)/720*600;ctx.fillStyle=l<380?'rgba(118,82,200,0.55)':lamCol(l);ctx.fillRect(x,BY,2.2,BH);}
    const x0=SX(M.lam0);ctx.fillStyle=PAL['cv-bg'];ctx.globalAlpha=0.62;ctx.fillRect(Math.max(40,x0),BY,760-Math.max(40,x0),BH);ctx.globalAlpha=1;
    ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.strokeRect(40.5,BY+.5,719,BH);
    txt(ctx,'UV',SX(265),BY+BH/2+1,{s:12*k,w:700,c:'#ffffff',a:'center',b:'middle'});
    [200,300,400,500,600,700].forEach(l=>{const x=SX(l);ctx.strokeStyle=soft;ctx.beginPath();ctx.moveTo(x,BY+BH);ctx.lineTo(x,BY+BH+5);ctx.stroke();txt(ctx,l+(l===700?' nm':''),x,BY+BH+19*k*0.9+2,{s:12*k,c:soft,a:'center'});});
    if(x0>=40&&x0<=760){ctx.strokeStyle=ink;ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(x0,BY-4);ctx.lineTo(x0,BY+BH+4);ctx.stroke();ctx.setLineDash([]);}
    txt(ctx,M.m.n+' frees electrons only below '+Math.round(M.lam0)+' nm',clamp(x0,40+150*k,760-150*k),444,{s:12*k,w:600,c:ink,a:'center'});
    const lx=SX(M.lam);ctx.fillStyle=ink;ctx.beginPath();ctx.moveTo(lx,BY-1);ctx.lineTo(lx-7,BY-10);ctx.lineTo(lx+7,BY-10);ctx.closePath();ctx.fill();
    pill(ctx,M.lam+' nm · '+M.E.toFixed(2)+' eV',clamp(lx,40+70*k,760-70*k),BY-12-10*k,lamCol(M.lam),lamInk(M.lam),12*k);
    if(s.msg){ctx.globalAlpha=clamp(s.msg.life/0.4,0,1);pill(ctx,s.msg.s,380,130,PAL['cv-ink'],PAL['cv-bg'],12*k);ctx.globalAlpha=1;}},
  thumbSetup(sim){sim.p.lam=400;sim.p.I=80;for(let i=0;i<40;i++)SIM.step(sim,0.05);}
};
BioLab.register(SIM);
})();
