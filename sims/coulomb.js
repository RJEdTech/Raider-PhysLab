(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor}=BioLab.h;
const K=8.99e9;            // Coulomb constant, N·m²/C²
const S=28;                // pixels per cm on the track
const X0=110;              // pixel x of q1 (0 cm)
const TY=196;              // track y
const SUP={'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
const sup=n=>String(n).split('').map(c=>SUP[c]||c).join('');
function sci(v,unit){if(!Number.isFinite(v))return '—';if(v===0)return '0 '+unit;const a=Math.abs(v),e=Math.floor(Math.log10(a));
  if(e>=0&&e<4)return (a<10?v.toFixed(2):a<100?v.toFixed(1):v.toFixed(0))+' '+unit;const m=v/Math.pow(10,e);return m.toFixed(2)+' × 10'+sup(e)+' '+unit;}
const px=cm=>X0+cm*S;
const fmtQ=q=>(q>0?'+':q<0?'−':'')+Math.abs(q).toFixed(1)+' μC';

/* ---------- physics ---------- */
function pairForce(p){const q1=p.q1*1e-6,q2=p.q2*1e-6,r=p.r/100;return K*q1*q2/(r*r);}   // >0 repel, <0 attract
function fieldX(p,xcm){ // x-component of E (N/C) on the track from q1 at 0 and q2 at r, NaN at a charge
  const d1=(xcm)/100,d2=(xcm-p.r)/100;if(Math.abs(d1)<0.004||Math.abs(d2)<0.004)return NaN;
  return K*p.q1*1e-6*Math.sign(d1)/(d1*d1)+K*p.q2*1e-6*Math.sign(d2)/(d2*d2);}
function equilibrium(p){ // zero of the field on the line, scanning from -30 cm to r+30 cm
  if(p.q1===0&&p.q2===0)return NaN;let prev=null,px0=null;
  for(let x=-30;x<=p.r+30;x+=0.05){const E=fieldX(p,x);if(!Number.isFinite(E)){prev=null;continue;}
    if(prev!==null&&Math.sign(E)!==Math.sign(prev)&&Math.abs(E)<1e12&&Math.abs(prev)<1e12){let a=px0,b=x;for(let i=0;i<40;i++){const m=(a+b)/2,Em=fieldX(p,m);if(Math.sign(Em)===Math.sign(fieldX(p,a)))a=m;else b=m;}return (a+b)/2;}
    prev=E;px0=x;}
  return NaN;}
function netOnQ3(p){const E=fieldX(p,p.x3);return Number.isFinite(E)?E*p.q3*1e-6:NaN;}
function leafAngle(st,p){const rm=Math.max(p.r,1.5)/100,ind=Math.abs(st.Qb)*Math.pow(0.03/rm,2);return clamp(1.6*Math.abs(st.Qs)+2.2*ind,0,72);}

/* ---------- show only what the current mode uses ---------- */
function syncMode(sim){if(!atLeast('ap')&&sim.p.mode==='three')BioLab.setValues(sim,{mode:'two'});if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.mode,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];
  d.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!atLeast(a.lvl)||!a.modes.includes(mode);});}

const COUL={
  id:'coulomb',hash:'coulomb',apUnit:10,order:1,tab:'Coulomb’s law',kind:'Simulation',
  card:'Slide two charges together and apart, watch the force arrows, and discover the inverse-square law for yourself.',
  title:'Coulomb’s law: the force between charges',
  lede:{bio:'Charged objects push or pull on each other without touching. Change the charges and the distance between them, and watch how strong the force gets.',
        honors:'Measure the electric force F = kq₁q₂/r², check Newton’s third law, and linearize your data to find Coulomb’s constant.',
        ap:'Add a third charge, find the net force by superposition, and locate the point where the net force is zero.'},
  scale:'Tabletop scale: small charged spheres a few centimeters apart. 1 μC is about 6 trillion extra or missing electrons.',
  timeless:true,animated:true,chChange:1.2,chReveal:3.2,
  controls:[
    {id:'mode',label:'Setup',type:'seg',def:'two',lvl:'bio',options:[{v:'two',l:'Two charges'},{v:'static',l:'Balloon and electroscope'},{v:'three',l:'Three charges',lvl:'ap'}],onChange:syncMode},
    {id:'q1',label:'Charge q₁',type:'range',min:-10,max:10,step:0.5,def:3,unit:' μC',lvl:'bio',modes:['two','three']},
    {id:'q2',label:'Charge q₂',type:'range',min:-10,max:10,step:0.5,def:-2,unit:' μC',lvl:'bio',modes:['two','three']},
    {id:'r',label:'Distance apart',type:'range',min:2,max:20,step:0.5,def:10,unit:' cm',lvl:'bio',help:'In the balloon setup, this is how far the balloon is from the electroscope.'},
    {id:'q3',label:'Charge q₃',type:'range',min:-5,max:5,step:0.5,def:1,unit:' μC',lvl:'ap',modes:['three']},
    {id:'x3',label:'Position of q₃',type:'range',min:-3,max:22,step:0.5,def:15,unit:' cm',lvl:'ap',modes:['three'],help:'Measured from q₁ along the same line.'}
  ],
  actions:[
    {id:'rub',label:'Rub balloon on hair',lvl:'bio',primary:true,modes:['static'],run(sim){const st=sim.st;if(st.Qb>-40){st.Qb=Math.max(-40,st.Qb-8);st.Qh=Math.min(40,st.Qh+8);}sim.vis.rubT=1.2;}},
    {id:'touch',label:'Touch the electroscope',lvl:'bio',modes:['static'],run(sim){const st=sim.st;if(sim.p.r<=3&&st.Qb!==0){const share=st.Qb*0.5;st.Qs+=share;st.Qb-=share;sim.vis.spark=0.6;}else sim.vis.tooFar=1.5;}},
    {id:'ground',label:'Ground the electroscope',lvl:'bio',modes:['static'],run(sim){sim.st.Qs=0;}},
    {id:'neutral',label:'Discharge the balloon',lvl:'bio',modes:['static'],run(sim){sim.st.Qb=0;sim.st.Qh=0;}}
  ],
  init(){return {Qb:0,Qs:0,Qh:0,pts:[],key:''};},
  step(sim,dt){const p=sim.p,st=sim.st;if(p.mode!=='two')return;const key=p.q1+'|'+p.q2;if(key!==st.key){st.key=key;st.pts=[];}
    if(!st.pts.some(q=>Math.abs(q.r-p.r)<0.25)){st.pts.push({r:p.r,F:Math.abs(pairForce(p))});st.pts.sort((a,b)=>a.r-b.r);}},
  metrics:[
    {id:'F',label:'Force on each charge',unit:'N',lvl:'bio',min:0,max:null,d:2,modes:['two','three'],get:s=>Math.abs(pairForce(s.p))},
    {id:'kind',label:'The charges',unit:'',lvl:'bio',text:true,modes:['two','three'],get:s=>{const f=pairForce(s.p);return f>0?'Repel':f<0?'Attract':'No force';}},
    {id:'F1',label:'Force on q₁ (+ = right)',unit:'N',lvl:'honors',min:0,max:null,d:2,modes:['two','three'],get:s=>-pairForce(s.p)},
    {id:'F2',label:'Force on q₂ (+ = right)',unit:'N',lvl:'honors',min:0,max:null,d:2,modes:['two','three'],get:s=>pairForce(s.p)},
    {id:'F3',label:'Net force on q₃ (+ = right)',unit:'N',lvl:'ap',min:0,max:null,d:2,modes:['three'],get:s=>netOnQ3(s.p)},
    {id:'eq',label:'Zero-force point',unit:'from q₁',lvl:'ap',text:true,modes:['three'],get:s=>{const x=equilibrium(s.p);return Number.isFinite(x)?x.toFixed(1)+' cm':'none on this line';}},
    {id:'Qb',label:'Balloon charge',unit:'nC',lvl:'bio',min:-40,max:0,d:0,modes:['static'],get:s=>s.st.Qb},
    {id:'leaf',label:'Leaf spread',unit:'°',lvl:'bio',min:0,max:72,d:0,modes:['static'],get:s=>leafAngle(s.st,s.p)}
  ],
  graphs:[{id:'fr',label:'Force vs distance',lvl:'bio',custom:true},{id:'finv',label:'Force vs 1/r² (linearized)',lvl:'honors',custom:true}],
  defaultGraph:'fr',
  plot(sim,ctx,box,id){const p=sim.p,st=sim.st;
    if(p.mode!=='two'){txt(ctx,'Switch the setup to “Two charges” to collect force data.',box.cw/2,box.ch/2,{s:15,c:PAL['muted'],a:'center',b:'middle'});return;}
    const kq=K*Math.abs(p.q1*p.q2)*1e-12;
    if(kq===0){txt(ctx,'One charge is zero, so there is no force to graph.',box.cw/2,box.ch/2,{s:15,c:PAL['muted'],a:'center',b:'middle'});return;}
    if(id==='fr'){const ymax=Math.max(kq/Math.pow(0.04,2),...st.pts.map(q=>q.F))*1.05;
      const ax=axes(ctx,box,{xmin:0,xmax:22,ymin:0,ymax,xl:'Distance r (cm)',yl:'Force (N)'});
      ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['muted'];ctx.lineWidth=1.5;ctx.beginPath();
      for(let r=1.5;r<=22;r+=0.1){const y=kq/Math.pow(r/100,2);r<=1.5?ctx.moveTo(ax.X(r),ax.Y(y)):ctx.lineTo(ax.X(r),ax.Y(y));}ctx.stroke();ctx.setLineDash([]);
      st.pts.forEach(q=>{ctx.fillStyle=serColor(0);ctx.beginPath();ctx.arc(ax.X(q.r),ax.Y(q.F),4.5,0,6.29);ctx.fill();});
      const F=Math.abs(pairForce(p));ctx.strokeStyle=serColor(1);ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(ax.X(p.r),ax.Y(F),8,0,6.29);ctx.stroke();ctx.restore();
      legend(ctx,box.L+12,box.T+10,[{label:'your measurements',color:serColor(0)},{label:'F = kq₁q₂/r²',color:PAL['muted'],dash:true}]);}
    else{const xs=st.pts.map(q=>1/Math.pow(q.r/100,2));const xmax=Math.max(1/Math.pow(0.05,2),...xs)*1.08,ymax=kq*xmax;
      const ax=axes(ctx,box,{xmin:0,xmax,ymin:0,ymax,xl:'1/r² (1/m²)',yl:'Force (N)'});
      ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['muted'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(0));ctx.lineTo(ax.X(xmax),ax.Y(kq*xmax));ctx.stroke();ctx.setLineDash([]);
      st.pts.forEach((q,i)=>{ctx.fillStyle=serColor(0);ctx.beginPath();ctx.arc(ax.X(xs[i]),ax.Y(q.F),4.5,0,6.29);ctx.fill();});ctx.restore();
      legend(ctx,box.L+12,box.T+10,[{label:'slope = k·q₁q₂ = '+kq.toExponential(2)+' N·m²',color:PAL['muted'],dash:true}]);}},
  narrate(sim){const p=sim.p,st=sim.st,hon=atLeast('honors');
    if(p.mode==='static'){const a=leafAngle(st,p);
      if(st.Qb===0&&st.Qs===0)return 'The balloon and electroscope are both neutral, so the gold leaves hang straight down. <b>Rub the balloon on hair</b> to move electrons onto it.';
      if(st.Qs!==0&&a>3&&(p.r>8||st.Qb===0))return 'The electroscope now holds <b>'+Math.abs(st.Qs).toFixed(0)+' nC of extra electrons</b> it got by touching (conduction). Both leaves carry the same charge, so they keep repelling each other even with the balloon gone.';
      if(p.r<=3)return 'The balloon is close enough to touch. Its extra electrons push the electroscope’s electrons down into the leaves (<b>induction</b>), so the leaves spread to '+a.toFixed(0)+'°. Touch it to transfer charge for good.';
      return 'The balloon carries <b>'+Math.abs(st.Qb).toFixed(0)+' nC of extra electrons</b> from your hair. '+(a>4?'Even from '+p.r+' cm away it pushes electrons down into the leaves, which repel and spread apart.':'Bring it closer: the force grows fast as the distance shrinks.');}
    const f=pairForce(p),F=Math.abs(f);
    if(F===0)return 'One of the charges is zero, so there is <b>no electric force</b>. Both charges must be nonzero to push or pull.';
    let s=(f>0?'<b>Like charges repel</b>':'<b>Opposite charges attract</b>')+' with '+F.toFixed(2)+' N each. The arrows are the same length on both charges: Newton’s third law.';
    if(p.mode==='three'){const x=equilibrium(p),n=netOnQ3(p);s=Number.isFinite(n)?'q₃ feels a pull or push from both charges at once. The forces add as vectors: net '+(Math.abs(n)<0.005?'≈ 0 N here, a balance point.':Math.abs(n).toFixed(2)+' N to the '+(n>0?'right':'left')+'.'):'q₃ is sitting on another charge. Move it to a new spot.';if(Number.isFinite(x))s+=' The net force on q₃ is zero at '+x.toFixed(1)+' cm.';return s;}
    if(hon)s+=' Halve the distance and the force grows 4×, because F depends on 1/r².';
    return s;},
  tour:[
    {title:'Two charged spheres',text:{bio:'Each sphere carries electric charge. Red is positive (missing electrons) and blue is negative (extra electrons). The size of the sphere shows how much charge it has.',honors:'q₁ and q₂ are measured in microcoulombs (μC). 1 μC = 1×10⁻⁶ C, about 6 trillion electrons.'},focus:[[px(0)-50,TY-60,100,120],[px(10)-50,TY-60,100,120]],speed:1,setup(sim){BioLab.setValues(sim,{mode:'two',q1:3,q2:-2,r:10});}},
    {title:'Forces come in pairs',text:'The arrows show the electric force on each charge. They point toward each other (attraction), and they are exactly the same size. Each charge pulls on the other equally.',focus:[px(0)-30,TY-80,px(10)-px(0)+60,70],speed:1},
    {title:'Like charges repel',text:'Make q₂ positive too. Now both arrows point away from each other: like charges push apart.',focus:[px(0)-60,TY-90,px(10)-px(0)+120,170],speed:1,setup(sim){BioLab.setValues(sim,{q2:2});}},
    {title:'Distance matters a lot',text:{bio:'Pull the charges twice as far apart. The force does not drop to half; it drops to a quarter.',honors:'Doubling r divides the force by 2² = 4. That is the inverse-square law: F ∝ 1/r².'},focus:[40,TY-90,720,200],speed:1,setup(sim){BioLab.setValues(sim,{r:20});}},
    {lvl:'honors',title:'The equation',text:'F = k·q₁·q₂ / r², with k = 8.99×10⁹ N·m²/C². Use meters for r and coulombs for charge. The panel shows the arithmetic for your current setup.',focus:[8,8,420,70],speed:1,pause:true,setup(sim){BioLab.setValues(sim,{r:10,q2:-2});}},
    {lvl:'ap',title:'Superposition with a third charge',text:'q₃ feels a force from q₁ and from q₂. Add them as vectors. Between a large and a small charge of the same sign, there is a point where the two forces cancel.',focus:[20,TY-90,760,200],speed:1,setup(sim){BioLab.setValues(sim,{mode:'three',q1:4,q2:1,r:12,q3:1,x3:8});}},
    {title:'Charging by friction',text:'Rubbing a balloon on hair moves electrons onto the balloon. Bring it near an electroscope and the leaves spread apart even before it touches: the balloon pushes electrons down into the leaves.',focus:[110,50,520,380],speed:1,setup(sim){BioLab.setValues(sim,{mode:'static',r:4});sim.st.Qb=-24;sim.st.Qh=24;sim.st.Qs=0;}}
  ],
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='done')BioLab.setValues(sim,ch.set);},
  onTourExit(sim){BioLab.setValues(sim,{mode:'two',q1:3,q2:-2,r:10});},
  challenges:[
    {lvl:'bio',q:'q₁ is positive and q₂ is negative, so they attract. If you change q₂ to positive, what happens?',choices:['They attract more strongly','They push each other apart','Nothing changes'],correct:1,
     baseline:{mode:'two',q1:3,q2:-2,r:10},change:{q2:2},changeText:'q₂ changed from −2 μC to +2 μC',watch:'fr',
     explain:{bio:'Opposite charges attract and like charges repel. The force is just as strong (5.39 N) but now points the other way.'}},
    {lvl:'bio',q:'The charges are 10 cm apart. If you pull them to 20 cm apart, the force becomes…',choices:['half as strong','one quarter as strong','twice as strong','the same'],correct:1,
     baseline:{mode:'two',q1:3,q2:-2,r:10},change:{r:20},changeText:'Distance doubled from 10 cm to 20 cm',watch:'fr',
     explain:{bio:'The force dropped from 5.39 N to 1.35 N, one quarter. Electric force fades with the square of distance, so doubling the distance gives 1/4 of the force.',honors:'F ∝ 1/r²: (10/20)² = 1/4. The force went from 5.39 N to 1.35 N.'}},
    {lvl:'bio',q:'In the balloon setup, a rubbed balloon is moved close to the electroscope but does not touch it. What do the leaves do?',choices:['They spread apart','Nothing until the balloon touches','They pull together'],correct:0,
     baseline:{mode:'static',r:18},baselineAction:'rub',change:{r:3},changeText:'Balloon moved to 3 cm from the electroscope',
     explain:{bio:'The balloon’s extra electrons push the electroscope’s own electrons down into the leaves. Both leaves become negative and repel each other. Charging without touching is called induction.'}},
    {lvl:'honors',q:'If you double q₁ from 3 μC to 6 μC, what happens to the force?',choices:['It doubles','It quadruples','It stays the same','It halves'],correct:0,
     baseline:{mode:'two',q1:3,q2:-2,r:10},change:{q1:6},changeText:'q₁ doubled to 6 μC',watch:'fr',
     explain:{honors:'F is proportional to q₁·q₂, so doubling one charge doubles the force: 5.39 N → 10.8 N. Only the distance appears squared.'}},
    {lvl:'honors',instant:true,set:{mode:'two',q1:6,q2:-1,r:10},q:'q₁ = +6 μC and q₂ = −1 μC. Which charge feels the larger force?',choices:['q₁, because it has more charge','q₂, because it has less charge','Neither: the forces are equal and opposite'],correct:2,
     explain:{honors:'The model is now set to these charges. Check the readouts: Force on q₁ and Force on q₂ have the same size and opposite signs. The force is one interaction between the pair, so Newton’s third law applies.'}},
    {lvl:'ap',instant:true,set:{mode:'three',q1:4,q2:1,r:12,q3:1,x3:5},q:'q₁ = +4 μC and q₂ = +1 μC are 12 cm apart. Where between them can q₃ sit with zero net force?',choices:['6 cm from q₁ (the midpoint)','8 cm from q₁ (closer to the smaller charge)','4 cm from q₁ (closer to the larger charge)'],correct:1,
     explain:{ap:'Set kq₁/x² = kq₂/(12−x)², so 4/x² = 1/(12−x)² → 2(12−x) = x → x = 8 cm. The model is now set up this way: the Zero-force point readout confirms 8.0 cm. Slide q₃ there and its net force reads 0. The balance point sits closer to the smaller charge.'}},
    {lvl:'ap',q:'The charges are 6 cm apart. If you triple the distance to 18 cm, the force becomes…',choices:['1/3 as strong','1/9 as strong','1/6 as strong'],correct:1,
     baseline:{mode:'two',q1:3,q2:-2,r:6},change:{r:18},changeText:'Distance tripled from 6 cm to 18 cm',watch:'fr',
     explain:{ap:'(6/18)² = 1/9. The force fell from 15.0 N to 1.66 N. Superposition and the 1/r² law together explain every electrostatics problem you will meet.'}}
  ],
  lab:{bio:'<p><b>Question:</b> How does the distance between two charges affect the force between them?</p><ol><li>Keep q₁ = +3 μC and q₂ = −2 μC.</li><li>Record trials at distances of 4, 6, 8, 10, 15 and 20 cm.</li><li>Plot distance (x) against force (y) on the Trials graph.</li></ol><p>Describe the shape of the graph. What happens to the force when the distance doubles?</p>',
       honors:'<p><b>Question:</b> Can you measure Coulomb’s constant k?</p><ol><li>Collect force at six distances (the Force vs distance graph fills in as you move the slider).</li><li>Switch to the linearized graph: Force vs 1/r².</li><li>Find the slope, then divide by q₁q₂ (in coulombs²) to get k.</li></ol><p>Compare your k with 8.99×10⁹ N·m²/C² and calculate percent error.</p>',
       ap:'<p><b>Question:</b> Where is the net force on a third charge zero?</p><ol><li>Use Three charges with q₁ = +4 μC, q₂ = +1 μC, 12 cm apart.</li><li>Slide q₃ until the net force reads closest to zero, and record it.</li><li>Repeat with q₂ = −1 μC.</li></ol><p><b>Claim–evidence–reasoning:</b> Predict both balance points algebraically and explain why the second one lies outside the pair.</p>'},
  terms:[{t:'Electric charge',d:'A property of matter. Protons are positive, electrons negative. Measured in coulombs (C).'},{t:'Attract / repel',d:'Opposite charges pull together; like charges push apart.'},{t:'Induction',d:'Charging or polarizing an object by bringing a charge near it, without touching.'},{t:'Conduction',d:'Charging by touching, so charge flows from one object to the other.'},
    {lvl:'honors',t:'Coulomb’s law',d:'F = k·q₁·q₂ / r², with k = 8.99×10⁹ N·m²/C².'},{lvl:'honors',t:'Inverse-square law',d:'A quantity that depends on 1/r². Doubling the distance gives 1/4 the value.'},{lvl:'honors',t:'Newton’s third law',d:'The force each charge exerts on the other is equal in size and opposite in direction.'},
    {lvl:'ap',t:'Superposition',d:'The net force on a charge is the vector sum of the forces from every other charge.'},{lvl:'ap',t:'Equilibrium point',d:'A location where the net electric force on a test charge is zero.'}],
  about:'<p>Charges are treated as point charges in a vacuum, so F = kq₁q₂/r² holds exactly at every distance shown. Real spheres a couple of centimeters wide would redistribute charge when very close. Forces of several newtons need microcoulomb charges, much more than you can really put on a small sphere in air, which sparks at roughly 0.1 μC per square centimeter. The balloon and electroscope use scaled charges in nanocoulombs: the leaf angle grows with the electroscope’s own charge and with the balloon’s induced effect, which falls as 1/r².</p>',
  initVis(sim){sim.vis.rubT=0;sim.vis.spark=0;sim.vis.tooFar=0;},
  draw(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st,v=sim.vis,hon=atLeast('honors'),ap=atLeast('ap');
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    if(p.mode==='static'){drawStatic(sim,ctx,vdt,k,t);return;}
    const three=p.mode==='three';
    // bench and ruler
    const r0=three?-3:0,r1=22,RY=338;ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,RY+40,800,72);
    ctx.fillStyle=PAL['cv-ruler'];ctx.fillRect(px(r0)-10,RY,px(r1)-px(r0)+20,38);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.strokeRect(px(r0)-10,RY,px(r1)-px(r0)+20,38);
    ctx.beginPath();for(let c=r0;c<=r1+1e-9;c+=0.5){const x=px(c),h=Number.isInteger(c)?(c%5===0?14:9):5;ctx.moveTo(x,RY);ctx.lineTo(x,RY+h);}ctx.stroke();
    for(let c=Math.ceil(r0/5)*5;c<=r1;c+=5)txt(ctx,String(c),px(c),RY+31,{s:13*k,w:600,a:'center',c:PAL['cv-soft']});
    txt(ctx,'cm',px(r1)+2,RY+31,{s:12*k,c:PAL['cv-soft'],a:'right'});
    // insulating stands
    const stand=(x,R)=>{ctx.fillStyle=PAL['cv-glass'];ctx.globalAlpha=0.55;ctx.fillRect(x-3,TY+R-2,6,RY-TY-R+2);ctx.globalAlpha=1;ctx.fillStyle=PAL['cv-soft'];rr(ctx,x-16,RY-8,32,8,3);ctx.fill();};
    const Rq=q=>24+4.2*Math.sqrt(Math.abs(q));
    stand(px(0),Rq(p.q1));stand(px(p.r),Rq(p.q2));if(three)stand(px(p.x3),Rq(p.q3)*0.8);
    // distance bracket
    const by=TY-Math.max(Rq(p.q1),Rq(p.q2))-16;
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(px(0),TY);ctx.lineTo(px(0),RY);ctx.moveTo(px(p.r),TY);ctx.lineTo(px(p.r),RY);ctx.stroke();ctx.setLineDash([]);
    pill(ctx,'r = '+p.r.toFixed(1)+' cm',(px(0)+px(p.r))/2,RY-22,PAL['card'],PAL['cv-ink'],14*k);
    if(three&&ap){const x=equilibrium(p);if(Number.isFinite(x)&&x>-3.5&&x<22.5){ctx.strokeStyle=PAL['s3'];ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(px(x),TY-80);ctx.lineTo(px(x),RY);ctx.stroke();ctx.setLineDash([]);
      ctx.beginPath();ctx.moveTo(px(x),RY-2);ctx.lineTo(px(x)-7,RY-12);ctx.lineTo(px(x)+7,RY-12);ctx.closePath();ctx.fillStyle=PAL['s3'];ctx.fill();
      txt(ctx,'zero net force at '+x.toFixed(1)+' cm',px(x),TY-86,{s:13*k,w:700,c:PAL['s3'],a:'center'});}}
    const f=pairForce(p),F=Math.abs(f),L=F>0?clamp(22+48*Math.log10(1+F*2),22,190):0;
    // faint interaction glow between the charges
    if(F>0&&!three){const g=ctx.createLinearGradient(px(0),0,px(p.r),0);const a=clamp(0.08+0.05*Math.log10(1+F),0.08,0.3);g.addColorStop(0,'rgba(198,40,40,'+a+')');g.addColorStop(1,p.q2>0?'rgba(198,40,40,'+a+')':'rgba(31,91,191,'+a+')');ctx.fillStyle=g;ctx.fillRect(px(0),TY-10,px(p.r)-px(0),20);}
    drawCharge(ctx,px(0),TY,p.q1,'q₁',k,t);drawCharge(ctx,px(p.r),TY,p.q2,'q₂',k,t);
    if(L>0){const dir=f>0?-1:1,c=PAL['s4'],ay=TY-Math.max(Rq(p.q1),Rq(p.q2))-26;
      arrow(ctx,px(0),ay,px(0)+dir*L,ay,c,7);arrow(ctx,px(p.r),ay,px(p.r)-dir*L,ay,c,7);
      txt(ctx,'F on q₁ = '+F.toFixed(2)+' N',px(0)+dir*L/2,ay-14,{s:14*k,w:700,a:'center'});txt(ctx,'F on q₂ = '+F.toFixed(2)+' N',px(p.r)-dir*L/2,ay-14,{s:14*k,w:700,a:'center'});}
    if(three){const x3=p.x3,cx=px(x3);drawCharge(ctx,cx,TY,p.q3,'q₃',k,t,0.8);
      const n=netOnQ3(p);if(Number.isFinite(n)){const parts=[0,p.r].map((xi,i)=>{const d=(x3-xi)/100;return K*p.q3*1e-6*(i?p.q2:p.q1)*1e-6*Math.sign(d)/(d*d);});
        const yb=TY+Rq(p.q3)*0.8+40;
        parts.forEach((fx,i)=>{const l=fx===0?0:Math.sign(fx)*clamp(16+34*Math.log10(1+Math.abs(fx)*2),16,130);if(l){arrow(ctx,cx,yb+i*16,cx+l,yb+i*16,i?PAL['s2']:PAL['s1'],3);txt(ctx,i?'from q₂':'from q₁',cx+l+(l>0?8:-8),yb+i*16,{s:12*k,c:i?PAL['s2']:PAL['s1'],a:l>0?'left':'right',b:'middle',w:700});}});
        const ln=Math.abs(n)<1e-3?0:Math.sign(n)*clamp(16+34*Math.log10(1+Math.abs(n)*2),16,150);if(ln)arrow(ctx,cx,yb+36,cx+ln,yb+36,PAL['s3'],6);
        pill(ctx,'net on q₃ = '+Math.abs(n).toFixed(2)+' N',cx,yb+60,PAL['s3'],'#fff',13*k);}
      else pill(ctx,'q₃ overlaps another charge',cx,TY+70,PAL['s4'],'#fff',13*k);}
    // equation panel
    const w=hon?500:330;rr(ctx,12,12,w,hon?70:44,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
    txt(ctx,'q₁ = '+fmtQ(p.q1)+'     q₂ = '+fmtQ(p.q2)+(three?'     q₃ = '+fmtQ(p.q3):''),26,40,{s:15*k,w:700});
    if(hon)txt(ctx,'F = (8.99×10⁹)('+Math.abs(p.q1).toFixed(1)+'×10⁻⁶)('+Math.abs(p.q2).toFixed(1)+'×10⁻⁶) / ('+(p.r/100).toFixed(3)+' m)² = '+F.toFixed(2)+' N',26,66,{s:13*k,c:PAL['cv-soft']});
    txt(ctx,'Arrow lengths use a log scale so small and large forces both fit.',788,442,{s:12*k,c:PAL['cv-soft'],a:'right'});
  },
  thumbSetup(sim){sim.p.r=8;}
};
function arrow(ctx,x1,y1,x2,y2,c,w){const a=Math.atan2(y2-y1,x2-x1),h=Math.max(10,w*2.6);ctx.strokeStyle=c;ctx.fillStyle=c;ctx.lineWidth=w;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2-Math.cos(a)*h*0.8,y2-Math.sin(a)*h*0.8);ctx.stroke();ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-Math.cos(a-0.45)*h,y2-Math.sin(a-0.45)*h);ctx.lineTo(x2-Math.cos(a+0.45)*h,y2-Math.sin(a+0.45)*h);ctx.closePath();ctx.fill();}
function drawCharge(ctx,x,y,q,name,k,t,scale){scale=scale||1;const R=(24+4.2*Math.sqrt(Math.abs(q)))*scale;
  const g=ctx.createRadialGradient(x-R*0.35,y-R*0.35,R*0.15,x,y,R);const base=q>0?['#f6a3a3','#b71c1c']:q<0?['#a9c8fb','#174ea6']:['#d6d6d6','#6f6f6f'];
  g.addColorStop(0,base[0]);g.addColorStop(1,base[1]);ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,R,0,6.29);ctx.fill();
  // surface charges: count grows with |q|
  const n=Math.round(Math.abs(q)*1.2);for(let i=0;i<n;i++){const a=i/n*6.283+0.3;txt(ctx,q>0?'+':'−',x+Math.cos(a)*R*0.68,y+Math.sin(a)*R*0.68+1,{s:Math.max(9,R*0.3),w:800,c:'rgba(255,255,255,.85)',a:'center',b:'middle'});}
  txt(ctx,q>0?'+':q<0?'−':'0',x,y+1,{s:R*0.62,w:800,c:'#fff',a:'center',b:'middle'});
  pill(ctx,name+' '+fmtQ(q),x,y+R+18,PAL['card'],PAL['cv-ink'],13*k);}
function drawStatic(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st,v=sim.vis;const ang=leafAngle(st,p)*Math.PI/180;
  v.rubT=Math.max(0,(v.rubT||0)-vdt);v.spark=Math.max(0,(v.spark||0)-vdt);v.tooFar=Math.max(0,(v.tooFar||0)-vdt);
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,402,800,48);
  // electroscope: metal knob and rod in a glass jar, two gold leaves at the bottom
  const kx=210,ky=118,hy=290;
  ctx.fillStyle=PAL['cv-water'];ctx.globalAlpha=0.22;rr(ctx,120,190,180,212,26);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;rr(ctx,120,190,180,212,26);ctx.stroke();
  ctx.fillStyle=PAL['cv-soft'];rr(ctx,180,180,60,16,4);ctx.fill();
  const mg=ctx.createLinearGradient(kx-6,0,kx+6,0);mg.addColorStop(0,'#7d7f88');mg.addColorStop(.5,'#d5d7de');mg.addColorStop(1,'#7d7f88');ctx.fillStyle=mg;ctx.fillRect(kx-5,ky+14,10,hy-ky-14);
  const kg=ctx.createRadialGradient(kx-7,ky-7,3,kx,ky,22);kg.addColorStop(0,'#eceef3');kg.addColorStop(1,'#82848d');ctx.fillStyle=kg;ctx.beginPath();ctx.arc(kx,ky,22,0,6.29);ctx.fill();
  ctx.fillStyle='#d9a521';[-1,1].forEach(s=>{ctx.save();ctx.translate(kx,hy);ctx.rotate(s*ang/2);ctx.beginPath();ctx.moveTo(-4,0);ctx.lineTo(4,0);ctx.lineTo(3,88);ctx.lineTo(-3,88);ctx.closePath();ctx.fill();ctx.restore();});
  // charges on the electroscope: induced + on the knob (facing the balloon), − pushed into the leaves, plus any charge it kept
  const rm=Math.max(p.r,1.5)/100,ind=Math.abs(st.Qb)*Math.pow(0.03/rm,2),nTop=Math.min(7,Math.round(ind/3)),nLeaf=Math.min(12,Math.round(ind/3+Math.abs(st.Qs)/2));
  for(let i=0;i<nTop;i++){const a=-1.0+i*(2/Math.max(6,nTop));txt(ctx,'+',kx+Math.cos(a)*15,ky+Math.sin(a)*15+1,{s:15*k,w:800,c:'#b71c1c',a:'center',b:'middle'});}
  for(let i=0;i<nLeaf;i++){const s=i%2?1:-1,d=20+Math.floor(i/2)*12;const lx=kx+s*Math.sin(ang/2)*d,ly=hy+Math.cos(ang/2)*d;txt(ctx,'−',lx+s*11,ly,{s:17*k,w:800,c:'#174ea6',a:'center',b:'middle'});}
  txt(ctx,'Electroscope: leaves spread '+leafAngle(st,p).toFixed(0)+'°',kx,430,{s:14*k,w:700,a:'center'});
  // person with hair (hair keeps a + charge each time the balloon is rubbed)
  const hx=712,hyH=250;ctx.fillStyle='#e3b58e';ctx.beginPath();ctx.ellipse(hx,hyH,50,60,0,0,6.29);ctx.fill();
  ctx.fillStyle='#3b2a1a';ctx.beginPath();ctx.arc(hx-18,hyH-4,4,0,6.29);ctx.arc(hx+18,hyH-4,4,0,6.29);ctx.fill();ctx.strokeStyle='#3b2a1a';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(hx,hyH+16,16,0.3,2.84);ctx.stroke();
  ctx.fillStyle='#e3b58e';ctx.fillRect(hx-18,hyH+52,36,40);ctx.fillStyle=PAL['s5'];rr(ctx,hx-70,hyH+86,140,70,26);ctx.fill();
  const lift=clamp(st.Qh/40,0,1);ctx.strokeStyle='#5b3a1a';ctx.lineWidth=3.2;ctx.lineCap='round';
  for(let i=0;i<19;i++){const a=-2.75+i*0.1;const sx=hx+Math.cos(a)*48,sy=hyH+Math.sin(a)*58;const wig=v.rubT>0&&!RM?Math.sin(t*40+i)*5:0;const L=18+lift*22;
    const ex=sx+Math.cos(a)*L+wig,ey=sy+Math.sin(a)*L-(1-lift)*10;ctx.beginPath();ctx.moveTo(sx,sy);ctx.quadraticCurveTo(sx+Math.cos(a)*L*0.6,sy+Math.sin(a)*L*0.6-(1-lift)*12,ex,ey);ctx.stroke();}
  const nh=Math.min(10,Math.round(st.Qh/4));for(let i=0;i<nh;i++){const a=-2.65+i*0.23;txt(ctx,'+',hx+Math.cos(a)*(54+18+lift*30),hyH+Math.sin(a)*(64+18+lift*30),{s:18*k,w:800,c:'#b71c1c',a:'center',b:'middle'});}
  if(st.Qh>0)txt(ctx,'Hair lost electrons (+)',hx,hyH-120,{s:13*k,w:700,a:'center',c:'#b71c1c'});
  // balloon (position follows the distance slider; it swings over to the hair while being rubbed)
  let bx=kx+22+44+p.r*15,by=118;if(v.rubT>0){const f=Math.sin(Math.min(1,v.rubT/1.2)*Math.PI);bx+=(hx-100-bx)*f;by+=(hyH-50-by)*f;if(!RM)by+=Math.sin(t*30)*5*f;}
  ctx.fillStyle='#d9534f';ctx.beginPath();ctx.ellipse(bx,by,44,54,0,0,6.29);ctx.fill();ctx.fillStyle='#c0392b';ctx.beginPath();ctx.moveTo(bx-6,by+60);ctx.lineTo(bx+6,by+60);ctx.lineTo(bx,by+52);ctx.closePath();ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.35)';ctx.beginPath();ctx.ellipse(bx-16,by-20,9,15,-0.4,0,6.29);ctx.fill();
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(bx,by+60);ctx.quadraticCurveTo(bx+14,by+110,bx-4,by+170);ctx.stroke();
  const nb=Math.min(24,Math.round(Math.abs(st.Qb)/1.6));for(let i=0;i<nb;i++){const a=i*2.4,rx=Math.sqrt((i+0.5)/24)*32;txt(ctx,'−',bx+Math.cos(a)*rx,by+Math.sin(a)*rx*1.2+2,{s:15*k,w:800,c:'#fff',a:'center',b:'middle'});}
  txt(ctx,st.Qb===0?'Balloon (neutral)':'Balloon: '+Math.abs(st.Qb).toFixed(0)+' nC extra electrons',bx,by-66,{s:13*k,w:700,a:'center'});
  // distance bracket from knob edge to balloon edge
  if(v.rubT<=0){const x1=kx+22,x2=bx-44,yb=ky+70;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(x1,ky);ctx.lineTo(x1,yb+6);ctx.moveTo(x2,ky);ctx.lineTo(x2,yb+6);ctx.stroke();ctx.setLineDash([]);
    ctx.beginPath();ctx.moveTo(x1,yb);ctx.lineTo(x2,yb);ctx.stroke();pill(ctx,p.r.toFixed(1)+' cm',Math.max((x1+x2)/2,x1+40),yb,PAL['card'],PAL['cv-ink'],13*k);}
  if(v.spark>0){ctx.strokeStyle=PAL['s4'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(kx+20,ky-4);ctx.lineTo(kx+30,ky-14);ctx.lineTo(kx+36,ky+2);ctx.lineTo(bx-44,by);ctx.stroke();}
  if(v.tooFar>0)pill(ctx,'Move the balloon within 3 cm to touch',400,30,PAL['s4'],'#fff',14*k);
}
COUL.controls[0].onChange=syncMode;
COUL.onLevel=syncMode;
BioLab.register(COUL);
})();
