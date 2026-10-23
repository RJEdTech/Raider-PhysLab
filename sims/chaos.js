(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor,lvText,fmtNum}=BioLab.h;
const G=9.8, D2R=Math.PI/180;
const PIV=[400,215], PXM=95;              // pivot position and pixels per metre

function wrap(a){a=(a+Math.PI)%(2*Math.PI);if(a<0)a+=2*Math.PI;return a-Math.PI;}

/* Equations of motion. y = [th1, w1, th2, w2] */
function derivDouble(y,P){const [t1,w1,t2,w2]=y,{m1,m2,L1,L2}=P,d=t1-t2,den=2*m1+m2-m2*Math.cos(2*d);
  const a1=(-G*(2*m1+m2)*Math.sin(t1)-m2*G*Math.sin(t1-2*t2)-2*Math.sin(d)*m2*(w2*w2*L2+w1*w1*L1*Math.cos(d)))/(L1*den);
  const a2=(2*Math.sin(d)*(w1*w1*L1*(m1+m2)+G*(m1+m2)*Math.cos(t1)+w2*w2*L2*m2*Math.cos(d)))/(L2*den);
  return [w1,a1,w2,a2];}
function derivSingle(y,P){return [y[1],-(G/P.L1)*Math.sin(y[0]),0,0];}
function rk4(y,h,P,f){const k1=f(y,P),y2=y.map((v,i)=>v+h/2*k1[i]),k2=f(y2,P),y3=y.map((v,i)=>v+h/2*k2[i]),k3=f(y3,P),y4=y.map((v,i)=>v+h*k3[i]),k4=f(y4,P);
  return y.map((v,i)=>v+h/6*(k1[i]+2*k2[i]+2*k3[i]+k4[i]));}
function bobs(y,P,single){const x1=P.L1*Math.sin(y[0]),y1=-P.L1*Math.cos(y[0]);if(single)return [[x1,y1],[x1,y1]];
  return [[x1,y1],[x1+P.L2*Math.sin(y[2]),y1-P.L2*Math.cos(y[2])]];}
/* Energy measured from the lowest possible position, so it is never negative. */
function energy(y,P,single){const [t1,w1,t2,w2]=y,{m1,m2,L1,L2}=P;
  if(single)return 0.5*m1*L1*L1*w1*w1+m1*G*L1*(1-Math.cos(t1));
  const T=0.5*m1*L1*L1*w1*w1+0.5*m2*(L1*L1*w1*w1+L2*L2*w2*w2+2*L1*L2*w1*w2*Math.cos(t1-t2));
  const V=m1*G*L1*(1-Math.cos(t1))+m2*G*(L1*(1-Math.cos(t1))+L2*(1-Math.cos(t2)));return T+V;}
function params(p){return {m1:p.m1,m2:p.m2,L1:p.L1,L2:p.L2};}
function sepOf(s,P,single){const a=bobs(s.A,P,single)[1],b=bobs(s.B,P,single)[1];return Math.hypot(a[0]-b[0],a[1]-b[1]);}

const CH={
  id:'chaos',hash:'chaos',apUnit:13,order:2,tab:'Chaos and the double pendulum',kind:'Go further',prereq:['pendulum'],
  card:'Start two double pendulums a hair apart and watch their paths split completely, even though the physics is exact.',
  title:'Chaos: the double pendulum',
  lede:{bio:'A pendulum hanging from a pendulum. Two copies start almost exactly the same, yet after a few seconds they move in completely different ways.',
        honors:'The double pendulum obeys Newton’s laws exactly, so energy is conserved, yet its motion is unpredictable in practice. Measure how fast a tiny starting difference grows.',
        ap:'Integrate the coupled equations of motion with RK4, track the separation of nearby trajectories on a log scale, and compare a chaotic Poincaré section with a regular one.'},
  scale:'Each arm is up to 1 m long, like a pendulum you could build from two meter sticks. The copies start as little as 0.0001° apart, smaller than any ruler can measure.',
  timeScale:1,dtMax:0.002,prewarm:0,sampleDt:0.05,window:30,unit:'s',chChange:0.5,chReveal:20,
  controls:[
    {id:'mode',label:'Pendulum',type:'seg',def:'double',lvl:'bio',options:[{v:'double',l:'Double'},{v:'single',l:'Single'}],
     help:'A single pendulum is the predictable comparison.',onChange(sim){BioLab.reset(sim);}},
    {id:'th1',label:'Upper arm starts at',type:'range',min:-170,max:170,step:1,def:120,unit:'°',lvl:'bio',onChange(sim){BioLab.reset(sim);}},
    {id:'th2',label:'Lower arm starts at',type:'range',min:-170,max:170,step:1,def:120,unit:'°',lvl:'bio',onChange(sim){BioLab.reset(sim);}},
    {id:'delta',label:'Copy B starts this much different',type:'select',def:0.01,lvl:'honors',onChange(sim){BioLab.reset(sim);},
     options:[{v:1,l:'1°'},{v:0.1,l:'0.1°'},{v:0.01,l:'0.01°'},{v:0.001,l:'0.001°'},{v:0.0001,l:'0.0001°'}]},
    {id:'m1',label:'Upper bob mass',type:'range',min:0.5,max:3,step:0.1,def:1,unit:' kg',lvl:'honors',onChange(sim){BioLab.reset(sim);}},
    {id:'m2',label:'Lower bob mass',type:'range',min:0.5,max:3,step:0.1,def:1,unit:' kg',lvl:'honors',onChange(sim){BioLab.reset(sim);}},
    {id:'L1',label:'Upper arm length',type:'range',min:0.5,max:1,step:0.05,def:1,unit:' m',lvl:'ap',onChange(sim){BioLab.reset(sim);}},
    {id:'L2',label:'Lower arm length',type:'range',min:0.5,max:1,step:0.05,def:1,unit:' m',lvl:'ap',onChange(sim){BioLab.reset(sim);}},
    {id:'trail',label:'Trace art',type:'toggle',def:true,lvl:'bio',help:'Leave a trail behind the lower bobs.',noTrial:true},
    {id:'showB',label:'Show copy B',type:'toggle',def:true,lvl:'bio',noTrial:true}
  ],
  actions:[{id:'release',label:'Release again',primary:true,run(sim){BioLab.reset(sim);}}],
  init(sim){const p=sim.p,d=(atLeast('honors')?p.delta:0.01)*D2R;
    const A=[p.th1*D2R,0,p.th2*D2R,0],B=[p.th1*D2R+d,0,p.th2*D2R,0];
    const P=params(p),single=p.mode==='single';
    return {A,B,E0:energy(A,P,single),tdiv:NaN,maxSep:0,maxAng:0,poinc:[],prevT1:wrap(A[0]),trailA:[],trailB:[],sep:sepOf({A,B},P,single)};},
  step(sim,dt){const s=sim.st,p=sim.p,P=params(p),single=p.mode==='single',f=single?derivSingle:derivDouble;
    s.A=rk4(s.A,dt,P,f);s.B=rk4(s.B,dt,P,f);
    s.sep=sepOf(s,P,single);s.maxSep=Math.max(s.maxSep,s.sep);
    if(!(s.tdiv>=0)&&s.sep>0.10)s.tdiv=sim.t+dt;
    s.maxAng=Math.max(s.maxAng,Math.abs(wrap(s.A[0])),single?0:Math.abs(wrap(s.A[2])));
    const t1=wrap(s.A[0]);                                 // Poincaré section: upper arm passes straight down, moving right
    if(!single&&s.prevT1<0&&t1>=0&&Math.abs(t1-s.prevT1)<1&&s.A[1]>0){s.poinc.push([wrap(s.A[2]),s.A[3]]);if(s.poinc.length>4000)s.poinc.shift();}
    s.prevT1=t1;},
  metrics:[
    {id:'sep',label:'Distance between the lower bobs',unit:'cm',lvl:'bio',min:0,max:400,d:1,get:s=>s.st.sep*100},
    {id:'maxSep',label:'Farthest apart so far',unit:'cm',lvl:'bio',min:0,max:400,d:1,get:s=>s.st.maxSep*100},
    {id:'tdiv',label:'Time until 10 cm apart',unit:'s',lvl:'honors',min:0,max:null,d:1,get:s=>s.st.tdiv},
    {id:'th1',label:'Upper arm angle (A)',unit:'°',lvl:'honors',min:-180,max:180,d:0,fixed:true,get:s=>wrap(s.st.A[0])/D2R},
    {id:'th2',label:'Lower arm angle (A)',unit:'°',lvl:'honors',min:-180,max:180,d:0,fixed:true,get:s=>s.p.mode==='single'?NaN:wrap(s.st.A[2])/D2R},
    {id:'E',label:'Total energy (A)',unit:'J',lvl:'honors',min:0,max:null,d:3,get:s=>energy(s.st.A,params(s.p),s.p.mode==='single')},
    {id:'drift',label:'Energy change since release',unit:'%',lvl:'ap',min:-1,max:1,d:4,get:s=>{const v=s.st.E0>1e-9?100*(energy(s.st.A,params(s.p),s.p.mode==='single')-s.st.E0)/s.st.E0:0;return Math.abs(v)<5e-5?0:v;}},
    {id:'lsep',label:'log₁₀ of separation (m)',unit:'',lvl:'ap',min:-8,max:1,d:2,fixed:true,get:s=>Math.log10(Math.max(s.st.sep,1e-9))}
  ],
  graphs:[{id:'gsep',label:'Distance between the copies',lines:['sep','maxSep']},
          {id:'gang',label:'Angles of copy A',lvl:'honors',lines:['th1','th2']},
          {id:'gen',label:'Total energy',lvl:'honors',lines:['E']},
          {id:'glog',label:'log₁₀ separation (straight line = exponential growth)',lvl:'ap',lines:['lsep']},
          {id:'gpoinc',label:'Poincaré section',lvl:'ap',custom:true}],
  defaultGraph:'gsep',
  plot(sim,ctx,box,id){if(id!=='gpoinc')return;const s=sim.st;
    if(sim.p.mode==='single'){txt(ctx,'A Poincaré section needs the double pendulum.',box.cw/2,box.ch/2,{s:14,c:PAL['muted'],a:'center',b:'middle'});return;}
    const ax=axes(ctx,box,{xmin:-180,xmax:180,ymin:-15,ymax:15,xl:'Lower arm angle (°) when the upper arm swings through the bottom',yl:'Lower arm ω (rad/s)'});
    ctx.fillStyle=PAL['g-dot'];s.poinc.forEach(q=>{const x=ax.X(q[0]/D2R),y=ax.Y(clamp(q[1],-15,15));ctx.fillRect(x-1.5,y-1.5,3,3);});
    txt(ctx,s.poinc.length+' crossings',box.L+box.W-6,box.T+14,{s:12,c:PAL['muted'],a:'right'});},
  narrate(sim){const s=sim.st,p=sim.p,cm=s.sep*100,d=atLeast('honors')?p.delta:0.01;
    if(p.mode==='single')return '<b>A single pendulum is predictable.</b> The two copies started '+d+'° apart and are still only '+fmtNum(cm,2)+' cm apart. Small differences stay small, so you can forecast its motion for a long time.';
    if(s.maxAng<25*D2R)return '<b>Small swings behave almost regularly.</b> With gentle angles the double pendulum barely departs from simple back-and-forth motion, so the copies stay close ('+fmtNum(cm,2)+' cm).';
    if(cm<1)return 'The two copies are still moving together. They started only '+d+'° apart, far less than you could see, and they are '+fmtNum(cm,3)+' cm apart.';
    if(cm<10)return '<b>The tiny difference is growing.</b> Each swing over the top amplifies it. They are now '+fmtNum(cm,1)+' cm apart.';
    return '<b>Chaos.</b> The copies started '+d+'° apart and now follow completely different paths ('+fmtNum(cm,0)+' cm apart). Newton’s laws still hold exactly'+(atLeast('honors')?' and energy is still conserved':'')+'; the motion is simply too sensitive to predict.';},
  tour:[
    {title:'A pendulum on a pendulum',text:'The upper arm swings from a fixed pivot, and the lower arm swings from the end of the upper one. Each arm is a rigid rod with a heavy bob.',focus:[PIV[0]-210,PIV[1]-210,420,420],pause:true},
    {title:'Two copies, almost identical',text:{bio:'There are actually two double pendulums here, drawn on top of each other. Copy B starts 0.01° different from copy A, far smaller than you could ever measure.',honors:'Copy B’s upper arm starts a tiny angle δ different from copy A. Everything else, including mass, length and gravity, is identical.'},focus(sim){const P=params(sim.p),b=bobs(sim.st.A,P,sim.p.mode==='single')[1];return [PIV[0]+b[0]*PXM-50,PIV[1]-b[1]*PXM-50,100,100];},pause:true},
    {title:'At first they move as one',text:'Release them and watch in slow motion. For the first few swings you cannot tell the copies apart.',focus:[PIV[0]-210,PIV[1]-210,420,420],speed:0.25},
    {title:'The difference snowballs',text:'Every time the lower arm whips over the top, the small difference gets multiplied. Watch the distance readout grow from fractions of a centimeter to meters.',focus:[10,10,250,70],speed:1},
    {title:'Trace art',text:'The trails show where each lower bob has been. Two paths that began together now look nothing alike.',focus:[PIV[0]-210,PIV[1]-210,420,420],speed:2},
    {lvl:'honors',title:'Energy is still conserved',text:'With no friction, total energy (kinetic + potential) stays constant. Chaos does not break the laws of physics; it means tiny uncertainties grow too fast to forecast.',focus:[540,10,250,70],speed:1},
    {title:'Compare: a single pendulum',text:'Switch to a single pendulum started the same way. Its copies stay together because its motion repeats regularly.',focus:[PIV[0]-120,PIV[1]-120,240,240],speed:1,setup(sim){BioLab.setValues(sim,{mode:'single'});BioLab.reset(sim);}},
    {lvl:'ap',title:'Poincaré section',text:'Back to the double pendulum. Plotting the lower arm’s state each time the upper arm swings through the bottom turns regular motion into neat curves and chaotic motion into a scattered cloud. Open the Poincaré graph.',focus:[PIV[0]-210,PIV[1]-210,420,420],speed:4,setup(sim){BioLab.setValues(sim,{mode:'double'});BioLab.reset(sim);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'double'});BioLab.reset(sim);},
  challenges:[
    {lvl:'bio',q:'Two double pendulums start 0.01° apart with both arms raised to 120°. What will they look like after 20 seconds?',
     choices:['Still moving together','Slightly out of step, but close','Moving completely differently'],correct:2,
     baseline:{mode:'double',th1:120,th2:120,delta:0.01},changeText:'Released',watch:'gsep',
     explain:{bio:'The double pendulum is chaotic. Each wild swing magnifies the tiny starting difference until the two copies are doing completely different things. Their motion is exact physics, but impossible to forecast far ahead.',
              ap:'The separation grows roughly exponentially (a straight rising line on the log graph) until it saturates at the size of the pendulum itself.'}},
    {lvl:'bio',q:'Now start both arms at only 10°, still 0.01° apart. After 20 seconds?',
     choices:['They stay together','They split completely','They stop moving'],correct:0,
     baseline:{mode:'double',th1:10,th2:10,delta:0.01},changeText:'Released with small swings',watch:'gsep',
     explain:'With small swings the double pendulum behaves almost like two linked simple oscillators, which is regular, predictable motion. Chaos needs big swings where the arms flip over and pull on each other strongly.'},
    {lvl:'honors',q:'While the double pendulum moves chaotically (no friction), what happens to its total energy?',
     choices:['It stays the same','It grows','It drops to zero'],correct:0,
     baseline:{mode:'double',th1:120,th2:120},changeText:'Released',watch:'gen',
     explain:'Energy just trades back and forth between kinetic and potential, and between the two arms. The total stays constant (the simulation conserves it to a tiny fraction of a percent). Chaos is about sensitivity, not about breaking conservation laws.'},
    {lvl:'honors',q:'A single pendulum starts at 120°, with copy B 0.01° away. After 20 seconds are they together or apart?',
     choices:['Still together','Completely different'],correct:0,
     baseline:{mode:'single',th1:120,delta:0.01},changeText:'Released',watch:'gsep',
     explain:'A single pendulum repeats the same swing over and over. The tiny difference makes its period very slightly different, so the copies drift apart only slowly and steadily. That is predictable, not chaotic.'},
    {lvl:'ap',q:'You make the starting difference 100× smaller (0.0001° instead of 0.01°). How much longer before the copies are 10 cm apart?',
     choices:['About 100× longer','Only a few seconds longer','No longer at all'],correct:1,
     baseline:{mode:'double',th1:120,th2:120,delta:0.0001},changeText:'Released with δ = 0.0001°',watch:'glog',reveal:20,
     explain:'In chaotic motion the separation grows exponentially, δ(t) ≈ δ₀e^{λt}. Shrinking δ₀ by 100× only buys extra time ln(100)/λ, a few seconds here. That is why better measurements barely improve long-range weather forecasts.'},
    {lvl:'ap',q:'The simulation uses a fixed time step with the RK4 method. Over 20 s of chaotic motion, how big is the energy error?',
     choices:['Much less than 0.1%','About 10%','It doubles'],correct:0,
     baseline:{mode:'double',th1:120,th2:120},changeText:'Released',watch:'gen',
     explain:'With steps of 0.002 s, fourth-order Runge–Kutta keeps the energy error tiny (check the Energy change readout). The chaos you see is real behavior of the equations, not a numerical error.'}
  ],
  lab:{bio:'<p><b>Question:</b> When does a tiny difference stay tiny, and when does it take over?</p><ol><li>Release with both arms at 120°. Record a trial at 5, 10 and 20 s.</li><li>Press Release again with both arms at 10° and record trials at the same times.</li><li>Switch to Single and repeat at 120°.</li></ol><p>Which setups were predictable? Use your distance data to explain.</p>',
       honors:'<p><b>Question:</b> How does the starting difference affect when the copies split?</p><ol><li>For δ = 1°, 0.1°, 0.01° and 0.001°, release at 120°/120° and record the "Time until 10 cm apart".</li><li>Plot δ (x) against that time (y).</li></ol><p>Describe the pattern. Does a 10× smaller δ give 10× more time?</p>',
       ap:'<p><b>Question:</b> Estimate the Lyapunov exponent λ.</p><ol><li>Use the log₁₀ separation graph. Find the slope of the straight rising section (decades per second).</li><li>λ ≈ slope × ln 10. Repeat for two different δ values.</li></ol><p><b>Claim–evidence–reasoning:</b> Use λ to predict how much extra forecast time a 1,000× more precise measurement buys.</p>'},
  terms:[{t:'Chaos',d:'Motion that follows exact rules but is so sensitive to its starting point that it cannot be predicted for long.'},{t:'Sensitive dependence',d:'Tiny differences in the starting conditions grow until they dominate (the "butterfly effect").'},{t:'Double pendulum',d:'A pendulum hanging from the end of another pendulum.'},
    {lvl:'honors',t:'Conservation of energy',d:'With no friction, kinetic + potential energy stays constant even in chaotic motion.'},{lvl:'honors',t:'Period',d:'The time for one full swing of a regular pendulum.'},
    {lvl:'ap',t:'Lyapunov exponent',d:'The rate λ at which nearby trajectories separate: δ(t) ≈ δ₀e^{λt}.'},{lvl:'ap',t:'Poincaré section',d:'A slice through the motion, recorded once per cycle. Regular motion gives curves; chaotic motion gives a scattered cloud.'},{lvl:'ap',t:'Runge–Kutta (RK4)',d:'A fourth-order numerical method for solving the equations of motion step by step.'}],
  about:'<p>Both bobs are point masses on massless rigid rods, with no friction or air drag. The standard double-pendulum equations of motion (from Lagrangian mechanics) are integrated with fourth-order Runge–Kutta in steps of 0.002 s, so energy is conserved to a tiny fraction of a percent.</p><p>Copy B differs only in its upper-arm starting angle. The separation is the straight-line distance between the two lower bobs. The Poincaré section records (θ₂, ω₂) each time copy A’s upper arm passes straight down moving to the right. Real double pendulums have friction and flexible rods, so they eventually settle down.</p>',
  initVis(sim){},
  draw(sim,ctx,vdt,k,t){const s=sim.st,p=sim.p,P=params(p),single=p.mode==='single';
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    const R=(single?P.L1:P.L1+P.L2)*PXM;
    // reach circle with degree ticks (a measuring tool)
    ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.setLineDash([4,5]);ctx.beginPath();ctx.arc(PIV[0],PIV[1],R,0,6.29);ctx.stroke();ctx.setLineDash([]);
    ctx.strokeStyle=PAL['cv-soft'];for(let a=0;a<360;a+=30){const c=Math.cos(a*D2R),sn=Math.sin(a*D2R);ctx.beginPath();ctx.moveTo(PIV[0]+sn*(R-6),PIV[1]+c*(R-6));ctx.lineTo(PIV[0]+sn*(R+6),PIV[1]+c*(R+6));ctx.stroke();}
    txt(ctx,'0°',PIV[0],PIV[1]+R+20,{s:11*k,c:PAL['cv-soft'],a:'center'});txt(ctx,'180°',PIV[0],PIV[1]-R-10,{s:11*k,c:PAL['cv-soft'],a:'center'});
    // trails
    const toPx=q=>[PIV[0]+q[0]*PXM,PIV[1]-q[1]*PXM];
    if(vdt>0||!s.trailA.length){const a=toPx(bobs(s.A,P,single)[1]),b=toPx(bobs(s.B,P,single)[1]);s.trailA.push(a);s.trailB.push(b);
      const cap=p.trail?900:1;while(s.trailA.length>cap){s.trailA.shift();s.trailB.shift();}}
    const drawTrail=(tr,col)=>{if(tr.length<2)return;ctx.strokeStyle=col;ctx.lineWidth=1.6;for(let i=1;i<tr.length;i++){ctx.globalAlpha=0.08+0.6*(i/tr.length);ctx.beginPath();ctx.moveTo(tr[i-1][0],tr[i-1][1]);ctx.lineTo(tr[i][0],tr[i][1]);ctx.stroke();}ctx.globalAlpha=1;};
    if(p.trail){drawTrail(s.trailA,PAL['s1']);if(p.showB)drawTrail(s.trailB,PAL['s2']);}
    // pendulums
    const drawPend=(y,col,alpha)=>{const b=bobs(y,P,single).map(toPx);ctx.globalAlpha=alpha;ctx.strokeStyle=col;ctx.lineWidth=4;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(PIV[0],PIV[1]);ctx.lineTo(b[0][0],b[0][1]);if(!single)ctx.lineTo(b[1][0],b[1][1]);ctx.stroke();
      const r1=8+4*Math.sqrt(P.m1),r2=8+4*Math.sqrt(P.m2);ctx.fillStyle=col;ctx.beginPath();ctx.arc(b[0][0],b[0][1],r1,0,6.29);ctx.fill();
      if(!single){ctx.beginPath();ctx.arc(b[1][0],b[1][1],r2,0,6.29);ctx.fill();}ctx.globalAlpha=1;};
    if(p.showB)drawPend(s.B,PAL['s2'],0.85);drawPend(s.A,PAL['s1'],1);
    ctx.fillStyle=PAL['cv-ink'];ctx.beginPath();ctx.arc(PIV[0],PIV[1],6,0,6.29);ctx.fill();
    // separation marker
    if(p.showB){const a=toPx(bobs(s.A,P,single)[1]),b=toPx(bobs(s.B,P,single)[1]);if(Math.hypot(a[0]-b[0],a[1]-b[1])>14){ctx.strokeStyle=PAL['cv-ink'];ctx.setLineDash([3,3]);ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();ctx.setLineDash([]);}}
    // readouts on the stage
    rr(ctx,12,12,236,64,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.stroke();
    txt(ctx,'Copies apart: '+fmtNum(s.sep*100,s.sep<0.01?3:1)+' cm',24,38,{s:15*k,w:700});
    txt(ctx,'Started '+(atLeast('honors')?p.delta:0.01)+'° apart',24,62,{s:12.5*k,c:PAL['cv-soft']});
    if(atLeast('honors')){const E=energy(s.A,P,single);rr(ctx,552,12,236,64,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.stroke();
      txt(ctx,'Energy: '+fmtNum(E,3)+' J',564,38,{s:15*k,w:700});txt(ctx,'At release: '+fmtNum(s.E0,3)+' J',564,62,{s:12.5*k,c:PAL['cv-soft']});}
    // legend and scale bar
    const ly=430;ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.arc(20,ly-4,6,0,6.29);ctx.fill();txt(ctx,'Copy A',32,ly,{s:12*k,c:PAL['cv-soft']});
    if(p.showB){ctx.fillStyle=PAL['s2'];ctx.beginPath();ctx.arc(110,ly-4,6,0,6.29);ctx.fill();txt(ctx,'Copy B',122,ly,{s:12*k,c:PAL['cv-soft']});}
    ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(690,ly-6);ctx.lineTo(690+PXM*0.5,ly-6);ctx.stroke();
    txt(ctx,'0.5 m',690+PXM*0.25,ly+10,{s:11*k,c:PAL['cv-soft'],a:'center'});}
};
BioLab.register(CH);
})();
