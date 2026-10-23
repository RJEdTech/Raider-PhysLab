(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,RM,axes,fmtNum}=BioLab.h;

/* Friction lab (after the Pivot Interactives / force-sensor classic).
   A wooden block (0.50 kg plus added masses) is pulled with a spring scale on a level table, g = 9.8 m/s².
   Pull method: the pull ramps up from 0; the block stays put while the pull ≤ μs·N (static friction matches it).
   At the static peak the block breaks free, then is pulled at a steady speed, so the scale reads kinetic friction
   μk·N (±3 % sensor noise). Each finished pull is logged as a (normal force, kinetic friction) point.
   Slide method (AP): the block is launched at v0 and stops in d = v0²/(2 μk g).
   Contact face: the narrow face changes μ by only ~2 % (real friction barely depends on contact area). */
const G=9.8,BLOCK=0.50,PULL_D=0.40;
const SURF={wood:{l:'Wood',mus:0.45,muk:0.30,c:'#c99a63',bump:5},felt:{l:'Felt',mus:0.35,muk:0.25,c:'#3e7a52',bump:4},sandpaper:{l:'Sandpaper',mus:0.80,muk:0.65,c:'#b9a27a',bump:9},
            rubber:{l:'Rubber mat',mus:1.00,muk:0.80,c:'#3b3b40',bump:7},ice:{l:'Ice',mus:0.10,muk:0.05,c:'#cfe8f3',bump:1.5}};
const muOf=(p)=>{const f=p.face==='narrow'?1.02:1,s=SURF[p.surface];return {s:s.mus*f,k:s.muk*f};};
const massOf=p=>BLOCK+p.added, normalOf=p=>massOf(p)*G;
const noise=t=>0.55*Math.sin(37.1*t)+0.3*Math.sin(91.7*t+1.3)+0.15*Math.sin(173*t+0.4);

function restart(sim){const s=sim.st;s.phase='wait';s.rt=0;s.x=0;s.F=0;s.peak=NaN;s.kinSum=0;s.kinN=0;s.kin=NaN;s.v=0;s.run=(s.run||0)+1;
  s.jit=1+0.04*Math.sin(s.run*2.3+sim.p.added*3.1);s.v0=sim.p.v0;s.dist=NaN;s.stopT=NaN;}
function syncMode(sim){const id=sim.def.id,m=sim.p.method;
  const only={speed:'pull',v0:'slide',face:'pull'};
  for(const c of SIM.controls){const el=document.getElementById(id+'-'+c.id)||document.getElementById(id+'-'+c.id+'-l');if(!el)continue;const w=el.closest('.ctl');if(!w)continue;
    w.hidden=!atLeast(c.lvl)||(only[c.id]&&only[c.id]!==m);}
  const tOnly={force:'pull',peak:'pull',kin:'pull',mus:'pull',muk:'pull',slope:'pull',dist:'slide',mukslide:'slide',vel:'slide'};
  for(const mt of SIM.metrics){const t=sim.ui.tiles&&sim.ui.tiles[mt.id];if(!t)continue;t.num.closest('.tile').hidden=!atLeast(mt.lvl)||(tOnly[mt.id]&&tOnly[mt.id]!==m);}}
function fitSlope(pts){let sxy=0,sxx=0;for(const q of pts){sxy+=q.N*q.f;sxx+=q.N*q.N;}const ns=new Set(pts.map(q=>q.N.toFixed(2)));return ns.size>=2&&sxx>0?sxy/sxx:NaN;}
function arrow(ctx,x,y,dx,dy,col,w){const L=Math.hypot(dx,dy);if(L<2)return;const head=Math.min(10,4+L*0.25),ux=dx/L,uy=dy/L;
  ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=w||3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+dx-ux*head*0.8,y+dy-uy*head*0.8);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+dx,y+dy);ctx.lineTo(x+dx-ux*head-uy*head*0.55,y+dy-uy*head+ux*head*0.55);ctx.lineTo(x+dx-ux*head+uy*head*0.55,y+dy-uy*head-ux*head*0.55);ctx.closePath();ctx.fill();}
const restartCtl=sim=>{restart(sim);};

const SIM={
  id:'friction',hash:'friction',apUnit:2,order:2,tab:'Friction lab',kind:'Virtual lab',
  card:'Pull a block with a spring scale across wood, felt, ice, sandpaper and rubber. Find μs and μk from your own data.',
  title:'Friction lab: what friction depends on',
  lede:{bio:'Pull a block across different surfaces with a spring scale. See how hard you must pull to get it started, and to keep it moving.',
        honors:'Measure static and kinetic friction on five surfaces, add mass, and calculate μs and μk from the force readings.',
        ap:'Graph kinetic friction against normal force and use the slope to find μk, then check it with the slide-to-stop method.'},
  scale:'Real sizes: a 0.50 kg wooden block about 10 cm long, pulled 40 cm across a lab table. Forces of 1–20 N, like lifting a can of soup to a gallon of milk.',
  timeScale:1,dtMax:0.005,prewarm:0,sampleDt:0.04,window:12,unit:'s',chChange:5,chReveal:11,
  controls:[
    {id:'method',label:'Method',type:'seg',def:'pull',lvl:'ap',options:[{v:'pull',l:'Pull with a spring scale'},{v:'slide',l:'Slide to a stop'}],onChange(sim){restart(sim);syncMode(sim);}},
    {id:'surface',label:'Surface',type:'seg',def:'wood',lvl:'bio',options:[{v:'wood',l:'Wood'},{v:'felt',l:'Felt'},{v:'sandpaper',l:'Sandpaper'},{v:'rubber',l:'Rubber'},{v:'ice',l:'Ice'}],onChange:restartCtl},
    {id:'added',label:'Mass added on top',type:'range',min:0,max:2,step:0.25,def:0,unit:' kg',d:2,lvl:'bio',help:'The block alone is 0.50 kg.',onChange:restartCtl},
    {id:'face',label:'Block lies on its',type:'seg',def:'large',lvl:'honors',options:[{v:'large',l:'Wide face'},{v:'narrow',l:'Narrow face'}],onChange:restartCtl},
    {id:'speed',label:'Pulling speed',type:'range',min:0.05,max:0.40,step:0.05,def:0.15,unit:' m/s',d:2,lvl:'honors',onChange:restartCtl},
    {id:'v0',label:'Launch speed',type:'range',min:0.5,max:3,step:0.25,def:2,unit:' m/s',d:2,lvl:'ap',onChange:restartCtl}
  ],
  actions:[{id:'again',label:'Pull again',primary:true,lvl:'bio',run(sim){restart(sim);}},
           {id:'clear',label:'Clear graph points',lvl:'ap',run(sim){sim.fit=[];}}],
  init(sim){const s={};sim.st=s;restart(sim);s.run=1;if(!sim.fit)sim.fit=[];return s;},
  step(sim,dt){const p=sim.p,s=sim.st,N=normalOf(p),mu=muOf(p);s.rt+=dt;
    if(p.method==='slide'){
      if(s.phase==='wait'){s.F=0;if(s.rt>0.3){s.phase='slide';s.v=s.v0;s.x=0;s.t0=s.rt;}}
      else if(s.phase==='slide'){const a=mu.k*G;s.v-=a*dt;if(s.v<=0){s.v=0;s.phase='done';s.dist=s.x;s.stopT=s.rt-s.t0;s.rt=0;}else s.x+=s.v*dt;}
      else if(s.phase==='done'){if(s.rt>1.6){const d=s.dist,st=s.stopT;restart(sim);s.lastDist=d;s.lastStop=st;}}
      return;}
    const peakF=mu.s*N*s.jit,rate=Math.max(2,peakF/1.5);
    if(s.phase==='wait'){s.F=0;if(s.rt>0.3)s.phase='ramp';}
    else if(s.phase==='ramp'){s.F+=rate*dt;if(s.F>=peakF){s.F=peakF;s.peak=peakF;s.phase='slide';s.v=p.speed;s.slideT=0;}}
    else if(s.phase==='slide'){s.slideT+=dt;s.x+=p.speed*dt;const kf=mu.k*N*(1+0.03*noise(sim.t+s.run));
      // the scale snaps down from the static peak to the kinetic plateau over ~0.15 s
      s.F=s.slideT<0.15?lerpF(s.peak,kf,s.slideT/0.15):kf;
      if(s.slideT>0.25){s.kinSum+=s.F;s.kinN++;s.kin=s.kinSum/s.kinN;}
      if(s.x>=PULL_D){s.x=PULL_D;s.phase='done';s.v=0;sim.fit.push({N,f:s.kin,surf:p.surface});if(sim.fit.length>60)sim.fit.shift();}}
    else if(s.phase==='done'){s.F=0;}},
  metrics:[
    {id:'force',label:'Spring scale reads',unit:'N',lvl:'bio',d:2,max:null,get:s=>s.p.method==='pull'?s.st.F:NaN},
    {id:'normal',label:'Normal force (= weight)',unit:'N',lvl:'bio',d:2,get:s=>normalOf(s.p)},
    {id:'peak',label:'Force to get it started',unit:'N',lvl:'bio',d:2,get:s=>s.st.peak},
    {id:'kin',label:'Force to keep it moving',unit:'N',lvl:'bio',d:2,get:s=>s.st.kin},
    {id:'mus',label:'μs = peak ÷ N',unit:'',lvl:'honors',d:2,get:s=>s.st.peak/normalOf(s.p)},
    {id:'muk',label:'μk = kinetic ÷ N',unit:'',lvl:'honors',d:2,get:s=>s.st.kin/normalOf(s.p)},
    {id:'slope',label:'Slope of friction vs. N',unit:'',lvl:'ap',d:3,get:s=>fitSlope(s.fit||[])},
    {id:'dist',label:'Stopping distance',unit:'m',lvl:'ap',d:3,get:s=>s.p.method==='slide'?(isFinite(s.st.dist)?s.st.dist:(isFinite(s.st.lastDist)?s.st.lastDist:NaN)):NaN},
    {id:'vel',label:'Block speed',unit:'m/s',lvl:'ap',d:2,max:null,get:s=>s.st.v},
    {id:'mukslide',label:'μk = v0² ÷ (2gd)',unit:'',lvl:'ap',d:3,get:s=>{const d=isFinite(s.st.dist)?s.st.dist:s.st.lastDist;return s.p.method==='slide'&&isFinite(d)&&d>0?s.p.v0*s.p.v0/(2*G*d):NaN;}}
  ],
  graphs:[{id:'force',label:'Spring scale force vs. time',lines:['force']},{id:'fit',label:'Kinetic friction vs. normal force',lvl:'honors',custom:true},{id:'vel',label:'Block speed vs. time',lvl:'ap',lines:['vel']}],
  defaultGraph:'force',
  plot(sim,ctx,box){const pts=sim.fit||[],ap=atLeast('ap');
    const xmax=Math.max(25,...pts.map(q=>q.N*1.1)),ymax=Math.max(4,...pts.map(q=>q.f*1.15));
    const ax=axes(ctx,box,{xmin:0,xmax,ymin:0,ymax,xl:'Normal force N (N)',yl:'Kinetic friction (N)'});
    if(!pts.length){txt(ctx,'Each finished pull adds a point. Change the mass and pull again.',box.L+box.W/2,box.T+box.H/2,{s:13,a:'center',c:PAL['muted']});return;}
    const surfs=[...new Set(pts.map(q=>q.surf))];
    surfs.forEach((sf,i)=>{const col=PAL['s'+(1+i%6)],my=pts.filter(q=>q.surf===sf);
      my.forEach(q=>{ctx.fillStyle=col;ctx.beginPath();ctx.arc(ax.X(q.N),ax.Y(q.f),5,0,6.29);ctx.fill();});
      const m=fitSlope(my);if(isFinite(m)){ctx.strokeStyle=col;ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(0));const xe=Math.min(xmax,ymax/m);ctx.lineTo(ax.X(xe),ax.Y(m*xe));ctx.stroke();ctx.setLineDash([]);}
      txt(ctx,SURF[sf].l+(isFinite(m)?(ap?'  slope = ':'  μk ≈ ')+m.toFixed(3):''),box.L+12,box.T+16+i*17,{s:13,w:600,c:col});});},
  onLevel(sim){syncMode(sim);},
  challenges:[
    {lvl:'bio',q:'You stack 1.0 kg on top of the block and pull it again across wood. How does the force to keep it moving change?',choices:['It gets bigger','It stays the same','It gets smaller'],correct:0,
     baseline:{method:'pull',surface:'wood',added:0,face:'large'},change:{added:1},changeAction:'again',changeText:'1.0 kg added, pulling again',watch:'force',
     explain:{bio:'A heavier block presses harder into the table, so the bumps on the two surfaces dig into each other more. Three times the weight gave about three times the friction: from 1.5 N to 4.4 N.',
              honors:'Kinetic friction is proportional to the normal force: f = μk·N. N went from 4.9 N to 14.7 N, so friction tripled, from 1.47 N to 4.41 N.'}},
    {lvl:'bio',q:'Watch the spring scale as the block is pulled across wood. Which takes more force?',choices:['Getting the block started','Keeping it moving','They are the same'],correct:0,
     baseline:{method:'pull',surface:'wood',added:0,face:'large'},change:{},changeText:'Watch the scale',watch:'force',at:0.2,reveal:5,
     explain:{bio:'The reading climbs to a peak just before the block moves (about 2.2 N), then drops to a steady 1.5 N while it slides. Surfaces at rest settle into each other, so they grip harder than surfaces that are already sliding.',
              honors:'The peak is maximum static friction, μs·N = 0.45 × 4.9 = 2.2 N. The plateau is kinetic friction, μk·N = 0.30 × 4.9 = 1.5 N. For almost every pair of surfaces μs > μk.'}},
    {lvl:'bio',q:'The block is on sandpaper. You switch the table surface to ice. What happens to the pull needed to keep it moving?',choices:['It goes up','It goes down a lot','It stays the same, because the block didn’t change'],correct:1,
     baseline:{method:'pull',surface:'sandpaper',added:0,face:'large'},change:{surface:'ice'},changeAction:'again',changeText:'Surface switched to ice',watch:'force',
     explain:{bio:'Sandpaper is full of sharp bumps that catch the block; ice is smooth and slippery. The same block needed about 3.2 N on sandpaper but only about 0.25 N on ice.'}},
    {lvl:'honors',q:'You flip the block onto its narrow face, so far less of it touches the table. What happens to kinetic friction?',choices:['It drops to about a third','It stays about the same','It roughly triples'],correct:1,
     baseline:{method:'pull',surface:'wood',added:0,face:'large'},change:{face:'narrow'},changeAction:'again',changeText:'Block flipped to its narrow face',watch:'force',
     explain:{honors:'Friction barely depends on contact area. The narrow face touches less table, but it presses down harder on each square centimetre, so the two effects nearly cancel. Friction changed by about 2 %, within the noise of a spring scale.'}},
    {lvl:'honors',instant:true,q:'A 1.0 kg block is pulled at constant speed. The spring scale reads 2.94 N. What is μk?',choices:['2.94','0.30','0.34','3.0'],correct:1,
     explain:{honors:'At constant speed the pull equals kinetic friction. N = mg = 1.0 × 9.8 = 9.8 N, so μk = f ÷ N = 2.94 ÷ 9.8 = 0.30. μ has no units: it is a ratio of two forces.'}},
    {lvl:'ap',q:'The block slides across wood (μk = 0.30) launched at 2.0 m/s. How far does it slide before stopping?',choices:['0.34 m','0.68 m','1.36 m','2.0 m'],correct:1,
     baseline:{method:'slide',surface:'wood',added:0,v0:2},change:{},changeText:'Launched at 2.0 m/s',watch:'vel',at:0.1,reveal:3,
     explain:{ap:'Friction is the only horizontal force, so a = −μk·g = −2.94 m/s², independent of mass. v² = v0² + 2aΔx gives d = v0²/(2μk g) = 4 ÷ 5.88 = 0.68 m.'}},
    {lvl:'ap',instant:true,q:'You graph kinetic friction (y) against normal force (x) for one surface with several masses. What does the slope of the best-fit line mean?',choices:['The block’s mass','The coefficient of kinetic friction μk','The acceleration due to gravity','The pulling speed'],correct:1,
     explain:{ap:'f_k = μk·N is a line through the origin with slope μk. Fitting a line through many trials averages out sensor noise, which is why the graph gives a better μk than any single pull. A non-zero intercept would hint at a systematic error, such as an un-zeroed scale.'}}
  ],
  narrate(sim){const p=sim.p,s=sim.st,N=normalOf(p),mu=muOf(p),hon=atLeast('honors'),sf=SURF[p.surface].l.toLowerCase();
    if(p.method==='slide'){
      if(s.phase==='wait')return 'Launching the block at '+p.v0.toFixed(2)+' m/s across '+sf+'.';
      if(s.phase==='slide')return 'Friction is the only sideways force, so it slows the block at μk·g = <b>'+(mu.k*G).toFixed(2)+' m/s²</b>, whatever its mass. Speed now '+s.v.toFixed(2)+' m/s.';
      return 'Stopped after <b>'+s.dist.toFixed(3)+' m</b> in '+s.stopT.toFixed(2)+' s. Working back: μk = v0²/(2gd) = '+(p.v0*p.v0/(2*G*s.dist)).toFixed(3)+'.';}
    if(s.phase==='wait')return 'Ready to pull the '+massOf(p).toFixed(2)+' kg block across '+sf+'. The table pushes up with '+N.toFixed(2)+' N.';
    if(s.phase==='ramp')return '<b>The pull is growing, but the block isn’t moving.</b> Static friction matches the pull exactly ('+s.F.toFixed(2)+' N). '+(hon?'It can grow up to μs·N ≈ '+(mu.s*N).toFixed(2)+' N.':'It can only grip so hard…');
    if(s.phase==='slide'&&s.slideT<0.3)return '<b>It breaks free</b> at '+s.peak.toFixed(2)+' N, and the reading drops right away. Once sliding, the surfaces grip less.';
    if(s.phase==='slide')return 'Pulled at a steady '+p.speed.toFixed(2)+' m/s, so the forces balance: the scale reads the kinetic friction, about <b>'+(mu.k*N).toFixed(2)+' N</b>.'+(hon?' μk = f/N = '+mu.k.toFixed(2)+'.':'');
    return 'Pull finished: '+s.peak.toFixed(2)+' N to start it, '+s.kin.toFixed(2)+' N to keep it moving. Change the mass or surface, or press <b>Pull again</b>.';},
  tour:[
    {title:'The set-up',text:'A wooden block sits on the table. A string connects it to a spring scale, which measures how hard the hand pulls, in newtons.',focus:[70,190,500,150],pause:true,
     setup(sim){BioLab.setValues(sim,{method:'pull',surface:'wood',added:0,face:'large'});BioLab.reset(sim);}},
    {title:'Pulling, but not moving',text:'The pull grows, yet the block stays put. Static friction from the table pushes back exactly as hard as the hand pulls.',focus:[[70,190,500,150],[552,18,238,200]],speed:0.35},
    {title:'The peak: it breaks free',text:'At the peak, static friction can’t grow any more and the block lurches forward. Look at the force graph below: a spike.',focus:[[70,190,500,150]],speed:0.35},
    {title:'Steady pulling = kinetic friction',text:'Pulled at a constant speed, the forces balance, so the scale reads the kinetic friction. It is lower than the peak.',focus:[[70,190,500,150],[552,18,238,200]],speed:0.5},
    {title:'Up close',text:'Even smooth-looking surfaces are bumpy under a microscope. The bumps catch on each other. Pressing harder (more mass) squeezes them together more.',focus:[16,90,250,130],pause:true},
    {title:'Add mass',text:'1.0 kg is added on top. The normal force triples, and so does the friction.',focus:[[70,190,500,150],[16,90,250,130]],speed:0.6,
     setup(sim){BioLab.setValues(sim,{added:1});}},
    {title:'Change the surface',text:'Sandpaper’s big bumps grip much harder. Try ice for the opposite.',focus:[[70,190,500,150],[16,90,250,130]],speed:0.6,
     setup(sim){BioLab.setValues(sim,{surface:'sandpaper'});}},
    {lvl:'honors',title:'From data to μ',text:'Every finished pull adds a point to the “Kinetic friction vs. normal force” graph. The points fall on a straight line through zero; its slope is μk.',focus:[552,18,238,200],pause:true}
  ],
  onTourExit(sim){BioLab.setValues(sim,{method:'pull',surface:'wood',added:0});syncMode(sim);},
  lab:{bio:'<p><b>Question:</b> Does a heavier block have more friction?</p><ol><li>Wood surface. Pull with 0, 0.5, 1.0, 1.5 and 2.0 kg added; record a trial after each pull finishes.</li><li>Record both the force to start it and the force to keep it moving.</li><li>Repeat on one other surface.</li></ol><p>Write a claim about mass and friction, with evidence from your data.</p>',
       honors:'<p><b>Question:</b> What are μs and μk for each surface, and does contact area matter?</p><ol><li>For each surface, pull with three different masses and record μs and μk.</li><li>Average your values for each surface.</li><li>On wood, compare the wide face and the narrow face with the same mass.</li></ol><p>Rank the surfaces and explain why μs is larger than μk.</p>',
       ap:'<p><b>Question:</b> Do two independent methods agree on μk?</p><ol><li>Pull method: for one surface, pull with at least five masses. Use the “Kinetic friction vs. normal force” graph; record the slope.</li><li>Slide method: launch at four speeds and record the stopping distance. Graph d against v0² and find μk from the slope 1/(2μk g).</li><li>Compare the two values with a percent difference.</li></ol><p>Identify the main source of uncertainty in each method.</p>'},
  terms:[{t:'Friction',d:'A force from a surface that resists one object sliding over another.'},{t:'Static friction',d:'Friction on an object that isn’t sliding yet. It matches the push, up to a maximum.'},{t:'Kinetic friction',d:'Friction on an object that is sliding. It stays about the same at any speed.'},{t:'Normal force',d:'The push of a surface straight out from it. On a level table, it equals the object’s weight.'},{t:'Spring scale',d:'A force meter: a spring stretches in proportion to the force on it.'},
    {lvl:'honors',t:'Coefficient of friction (μ)',d:'μ = friction ÷ normal force. It has no units and depends on the two surfaces, not on mass or area.'},
    {lvl:'ap',t:'Best-fit slope',d:'Fitting many trials with a line averages random error; the slope of f vs. N is μk.'}],
  about:'<p>Level-surface model with g = 9.8 m/s². Static friction matches the pull up to μs·N (±4 % run-to-run); the block then moves at the chosen steady speed, so the scale reads μk·N with ±3 % sensor noise. Coefficients are typical textbook values (wood on wood 0.45/0.30, felt 0.35/0.25, sandpaper 0.80/0.65, rubber 1.0/0.80, ice 0.10/0.05). Lying on the narrow face raises μ by 2 %, a stand-in for the small real effect of contact area.</p><p>The slide-to-stop method uses constant kinetic friction, a = μk·g. Simplified: no air drag, the string is massless and horizontal, and kinetic friction does not change with speed.</p>',
  initVis(sim){},
  draw(sim,ctx,vdt,k,t){const p=sim.p,s=sim.st,N=normalOf(p),mu=muOf(p),hon=atLeast('honors'),sf=SURF[p.surface],slide=p.method==='slide';
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    const TY=320,X0=slide?70:110;
    // ppm: pull = 500 px/m; slide scales to fit the expected stopping distance
    const dPred=p.v0*p.v0/(2*mu.k*G),ppm=slide?clamp(600/Math.max(dPred*1.1,0.4),40,500):500;
    // table + surface strip
    ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,TY,800,130);
    ctx.fillStyle=sf.c;ctx.fillRect(30,TY-6,740,8);
    if(p.surface==='sandpaper'){ctx.fillStyle='rgba(0,0,0,.25)';for(let i=0;i<220;i++){const x=30+(i*37.3)%740,y=TY-5+(i*7)%6;ctx.fillRect(x,y,1.5,1.5);}}
    if(p.surface==='felt'){ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=1;ctx.beginPath();for(let x=32;x<770;x+=5){ctx.moveTo(x,TY-6);ctx.lineTo(x+3,TY+2);}ctx.stroke();}
    if(p.surface==='ice'){ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=1;ctx.beginPath();for(let x=60;x<760;x+=90){ctx.moveTo(x,TY-5);ctx.lineTo(x+30,TY-1);}ctx.stroke();}
    // ruler
    ctx.fillStyle=PAL['cv-ruler'];ctx.fillRect(30,TY+12,740,30);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.strokeRect(30,TY+12,740,30);
    const step=slide?(ppm<120?0.5:0.1):0.01,lab=slide?(ppm<120?1:0.5):0.1;ctx.beginPath();
    for(let m=0;X0+m*ppm<=768;m+=step){const x=X0+m*ppm,maj=Math.abs(m/lab-Math.round(m/lab))<1e-6;ctx.moveTo(x,TY+12);ctx.lineTo(x,TY+12+(maj?14:(slide?8:6)));}ctx.stroke();
    for(let m=0;X0+m*ppm<=735;m+=lab){txt(ctx,slide?m.toFixed(1)+(m===0?' m':''):Math.round(m*100)+(m===0?' cm':''),X0+m*ppm,TY+38,{s:10.5*k,a:'center',c:PAL['cv-ink']});}
    txt(ctx,sf.l+(hon?'   μs = '+mu.s.toFixed(2)+', μk = '+mu.k.toFixed(2):''),30,TY+68,{s:12.5*k,w:600,c:PAL['cv-ink']});
    // block
    const bw=p.face==='narrow'?60:96,bh=p.face==='narrow'?56:34,bx=X0+s.x*ppm,by=TY-6-bh;
    if(slide&&isFinite(s.lastDist)){ctx.save();ctx.setLineDash([4,4]);ctx.strokeStyle=PAL['cv-soft'];ctx.strokeRect(X0+s.lastDist*ppm,by,bw,bh);ctx.restore();txt(ctx,'last: '+s.lastDist.toFixed(2)+' m',X0+s.lastDist*ppm+bw/2,by-8,{s:10.5*k,a:'center',c:PAL['cv-soft']});}
    ctx.fillStyle='#c4904f';ctx.fillRect(bx,by,bw,bh);ctx.strokeStyle='#7a5226';ctx.lineWidth=2;ctx.strokeRect(bx,by,bw,bh);
    ctx.strokeStyle='rgba(122,82,38,.45)';ctx.lineWidth=1;ctx.beginPath();for(let i=1;i<4;i++){ctx.moveTo(bx+3,by+bh*i/4);ctx.bezierCurveTo(bx+bw*0.35,by+bh*i/4-3,bx+bw*0.65,by+bh*i/4+3,bx+bw-3,by+bh*i/4);}ctx.stroke();
    // stacked masses
    const nm=Math.round(p.added/0.25);for(let i=0;i<nm;i++){const mx=bx+bw/2-14,my=by-9-i*9;ctx.fillStyle='#8a9098';rr(ctx,mx,my,28,8,2);ctx.fill();ctx.strokeStyle='#5c626a';ctx.lineWidth=1;ctx.stroke();}
    txt(ctx,massOf(p).toFixed(2)+' kg',bx+bw/2,by-14-nm*9,{s:12*k,w:700,a:'center'});
    if(!slide){// hook, string, spring scale, hand
      const hy=by+bh/2,sx0=bx+bw+40,stretch=clamp(s.F*6,0,70),sL=150;
      ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(bx+bw,hy);ctx.lineTo(sx0,hy);ctx.stroke();
      // scale barrel
      rr(ctx,sx0,hy-13,sL+stretch,26,6);ctx.fillStyle='#e9e4d2';ctx.fill();ctx.strokeStyle='#8e866b';ctx.lineWidth=1.5;ctx.stroke();
      // spring coils inside
      ctx.strokeStyle='#7a7a7a';ctx.lineWidth=1.3;ctx.beginPath();const cs=sx0+8,ce=sx0+40+stretch;for(let i=0;i<=14;i++){const x=cs+(ce-cs)*i/14;ctx.lineTo(x,hy+(i%2?7:-7));}ctx.stroke();
      // scale markings and pointer
      ctx.fillStyle=PAL['rj'];ctx.fillRect(ce-1.5,hy-12,3,24);
      rr(ctx,sx0+sL*0.42+stretch,hy-24,74,20,5);ctx.fillStyle='#1f2328';ctx.fill();
      txt(ctx,s.F.toFixed(2)+' N',sx0+sL*0.42+stretch+37,hy-9,{s:13*k,w:700,a:'center',c:'#7CFFB2'});
      // hand
      const hx=sx0+sL+stretch;ctx.fillStyle='#e0b48c';rr(ctx,hx,hy-14,30,28,9);ctx.fill();ctx.strokeStyle='#a87b52';ctx.lineWidth=1.5;ctx.stroke();
      ctx.fillStyle='#e0b48c';ctx.fillRect(hx+26,hy-10,40,20);
      // pull arrow
      if(s.F>0.01)arrow(ctx,bx+bw+2,hy,36,0,PAL['s1'],2.5);
      if((s.phase==='ramp'||s.phase==='slide')&&s.F>0.01)arrow(ctx,bx-4,TY-10,-clamp(s.F*14,14,90),0,PAL['s4'],3);
    }else{ctx.fillStyle='#6b7178';rr(ctx,X0-46,by+bh*0.2,40,bh*0.6,4);ctx.fill();ctx.fillStyle='#9aa1a8';ctx.fillRect(X0-8,by+bh*0.38,s.phase==='wait'?8:2,bh*0.24);txt(ctx,'launcher',X0-26,by-6,{s:10*k,a:'center',c:PAL['cv-soft']});
      if(s.phase==='slide'&&s.v>0)arrow(ctx,bx+bw/2,by-30-nm*9,clamp(s.v*40,12,120),0,PAL['s3'],3);
      if(s.phase==='slide')arrow(ctx,bx-4,TY-10,-clamp(mu.k*N*14,14,90),0,PAL['s4'],3);}
    // readout
    rr(ctx,16,16,250,62,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
    const kb=Math.min(k,1.3);txt(ctx,'⏱ '+(slide&&s.phase!=='wait'?(s.phase==='done'?s.stopT:s.rt-s.t0):Math.max(0,s.rt)).toFixed(2)+' s',28,40,{s:14*kb,w:700});
    txt(ctx,slide?'v = '+s.v.toFixed(2)+' m/s   d = '+s.x.toFixed(3)+' m':'Moved '+(s.x*100).toFixed(1)+' cm   '+({wait:'ready',ramp:'not moving',slide:'sliding',done:'done'})[s.phase],28,64,{s:12.5*kb,c:PAL['cv-soft']});
    drawMicro(sim,ctx,k,sf,N,t);
    drawFBD(sim,ctx,k,hon,N,mu);}
};
function lerpF(a,b,u){return a+(b-a)*clamp(u,0,1);}

function drawMicro(sim,ctx,k,sf,N,t){k=Math.min(k,1.3);const s=sim.st,X=16,Y=90,W=250,H=130;
  rr(ctx,X,Y,W,H,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,'Under a microscope',X+12,Y+20,{s:12*k,w:700});
  ctx.save();rr(ctx,X+8,Y+28,W-16,H-36,8);ctx.clip();
  const mid=Y+28+(H-36)/2,press=clamp(N/25,0.05,1)*4,shift=((s.x*2600)%22);
  // block (top) bumps
  ctx.fillStyle='#c4904f';ctx.beginPath();ctx.moveTo(X,Y+28);for(let x=X;x<=X+W;x+=11){const i=Math.round((x-X)/11);ctx.lineTo(x,mid-2+press+((i*7)%3)*2.2+(i%2?0:-3));}ctx.lineTo(X+W,Y+28);ctx.closePath();ctx.fill();
  // surface (bottom) bumps, sliding left relative to the block as it moves
  const A=sf.bump;ctx.fillStyle=sf.c;ctx.beginPath();ctx.moveTo(X,Y+H);for(let x=X-22;x<=X+W+22;x+=6){const xx=x-shift,i=Math.floor((x-X+44)/6);ctx.lineTo(xx,mid+2-A*((i*13)%5)/4-A*0.3*Math.sin(i*1.7));}ctx.lineTo(X+W,Y+H);ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=1;ctx.stroke();
  ctx.restore();
  txt(ctx,'block',X+W-14,Y+44,{s:10.5*k,a:'right',c:'#3a2a10',w:600});txt(ctx,sf.l.toLowerCase(),X+W-14,Y+H-12,{s:10.5*k,a:'right',c:sf.l==='Ice'||sf.l==='Sandpaper'?'#2b2b2b':'#f2f2f2',w:600});}

function drawFBD(sim,ctx,k,hon,N,mu){k=Math.min(k,1.3);const p=sim.p,s=sim.st,X=552,Y=18,W=238,H=200;
  rr(ctx,X,Y,W,H,12);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,hon?'Free-body diagram':'Forces on the block',X+12,Y+22,{s:12.5*k,w:700});
  const cx=X+W/2,cy=Y+108,sc=58/Math.max(N,1);
  const pull=p.method==='pull'?s.F:0,fr=p.method==='pull'?(s.phase==='ramp'||s.phase==='slide'?s.F:0):(s.phase==='slide'?mu.k*N:0);
  arrow(ctx,cx,cy,0,N*sc,PAL['s2'],3);arrow(ctx,cx,cy,0,-N*sc,PAL['s3'],3);
  txt(ctx,(hon?'F_g ':'Weight ')+N.toFixed(2)+' N',cx+8,cy+N*sc-2,{s:11.5*k});txt(ctx,(hon?'F_N ':'Table up ')+N.toFixed(2)+' N',cx+8,cy-N*sc+12,{s:11.5*k});
  const hl=v=>v>0.005?clamp(v*sc,22,96):0;
  if(pull>0.005){arrow(ctx,cx,cy-4,hl(pull),0,PAL['s1'],3);txt(ctx,(hon?'T ':'Pull ')+pull.toFixed(2)+' N',cx+hl(pull)+4,cy-10,{s:11.5*k});}
  if(fr>0.005){arrow(ctx,cx,cy+6,-hl(fr),0,PAL['s4'],3);txt(ctx,(hon?(s.phase==='ramp'?'f_s ':'f_k '):'Friction ')+fr.toFixed(2)+' N',cx-hl(fr)-4,cy+22,{s:11.5*k,a:'right'});}
  ctx.fillStyle=PAL['cv-ink'];ctx.beginPath();ctx.arc(cx,cy,5,0,6.29);ctx.fill();
  const net=p.method==='pull'?0:-fr;
  txt(ctx,(hon?'F_net ≈ ':'Net force ≈ ')+Math.abs(net).toFixed(2)+' N'+(Math.abs(net)<0.01?', balanced':''),X+12,Y+H-10,{s:12*k,w:700,c:PAL['s5']});}

SIM.thumbSetup=function(sim){for(let i=0;i<300;i++)SIM.step(sim,0.005);};
BioLab.register(SIM);
})();
