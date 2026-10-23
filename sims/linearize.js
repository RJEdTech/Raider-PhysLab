(function(){
'use strict';
const {clamp,rng,randn,rr,txt,pill,atLeast,PAL,FONT,RM,axes,lvText,fmtNum}=BioLab.h;

/* Linearizing data. Each experiment follows a known law; measurements get Gaussian noise.
   Students choose transforms for x and y until the transformed points fall on a straight line,
   then the least-squares slope gives a physical constant.
   Ball drop: t = sqrt(2h/g)          → t² vs h is linear, slope 2/g
   Pendulum:  T = 2π sqrt(L/g)        → T² vs L is linear, slope 4π²/g
   Light:     I = P / (4π d²)         → I vs 1/d² is linear, slope P/4π
   Bounce:    h_n = h0 · e^(2n)       → ln h vs n is linear, slope 2 ln e */
const G=9.8;
const EXPS={
  drop:{name:'Ball drop',xl:'Drop height h',xu:'m',yl:'Fall time t',yu:'s',xs:[0.2,0.4,0.6,0.8,1.0,1.2,1.4,1.6,1.8,2.0],f:x=>Math.sqrt(2*x/G)},
  pend:{name:'Pendulum',xl:'String length L',xu:'m',yl:'Period T',yu:'s',xs:[0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0],f:x=>2*Math.PI*Math.sqrt(x/G)},
  light:{name:'Light meter',xl:'Distance d',xu:'m',yl:'Intensity I',yu:'W/m²',xs:[0.5,0.75,1.0,1.25,1.5,1.75,2.0,2.25,2.5],f:x=>60/(4*Math.PI*x*x)},
  bounce:{name:'Bouncing ball',xl:'Bounce number n',xu:'',yl:'Peak height h',yu:'m',xs:[0,1,2,3,4,5,6,7],f:x=>1.5*Math.pow(0.64,x)}
};
const TX={none:{l:'x',f:v=>v},sq:{l:'x²',f:v=>v*v},sqrt:{l:'√x',f:v=>v>=0?Math.sqrt(v):NaN},inv:{l:'1/x',f:v=>v!==0?1/v:NaN},inv2:{l:'1/x²',f:v=>v!==0?1/(v*v):NaN},log:{l:'ln x',f:v=>v>0?Math.log(v):NaN}};
const TY={none:{l:'y',f:v=>v},sq:{l:'y²',f:v=>v*v},sqrt:{l:'√y',f:v=>v>=0?Math.sqrt(v):NaN},log:{l:'ln y',f:v=>v>0?Math.log(v):NaN}};
function fit(pts){const P=pts.filter(p=>Number.isFinite(p.X)&&Number.isFinite(p.Y));const n=P.length;if(n<2)return null;
  let sx=0,sy=0;P.forEach(p=>{sx+=p.X;sy+=p.Y;});const mx=sx/n,my=sy/n;let sxx=0,sxy=0,syy=0;P.forEach(p=>{sxx+=(p.X-mx)**2;sxy+=(p.X-mx)*(p.Y-my);syy+=(p.Y-my)**2;});
  if(sxx<1e-12)return null;const m=sxy/sxx,b=my-m*mx;const r2=syy>0?(sxy*sxy)/(sxx*syy):1;return {m,b,r2,n,P};}
function names(sim){const e=EXPS[sim.p.exp];const xl=TX[sim.p.tx].l.replace('x',e.xl.split(' ').pop()),yl=TY[sim.p.ty].l.replace('y',e.yl.split(' ').pop());return {xl,yl};}
function transformed(sim){return sim.st.pts.map(p=>({X:TX[sim.p.tx].f(p.x),Y:TY[sim.p.ty].f(p.y)}));}
// Straightness judged on the noise-free law, so a lucky noisy point never decides it.
function trulyLinear(sim){const e=EXPS[sim.p.exp];const pts=e.xs.map(x=>({X:TX[sim.p.tx].f(x),Y:TY[sim.p.ty].f(e.f(x))}));const F=fit(pts);return !!F&&F.r2>0.99995&&F.P.length===e.xs.length;}
function constantText(sim){const F=fit(transformed(sim));if(!F||!trulyLinear(sim)||F.n<3)return '—';const {exp,tx,ty}=sim.p,m=F.m;
  if(exp==='drop'){if(tx==='none'&&ty==='sq')return 'g = 2 ÷ slope = '+(2/m).toFixed(2)+' m/s²';if(tx==='sqrt'&&ty==='none')return 'g = 2 ÷ slope² = '+(2/(m*m)).toFixed(2)+' m/s²';}
  if(exp==='pend'){if(tx==='none'&&ty==='sq')return 'g = 4π² ÷ slope = '+(4*Math.PI*Math.PI/m).toFixed(2)+' m/s²';if(tx==='sqrt'&&ty==='none')return 'g = 4π² ÷ slope² = '+(4*Math.PI*Math.PI/(m*m)).toFixed(2)+' m/s²';}
  if(exp==='light'&&tx==='inv2'&&ty==='none')return 'Bulb power P = 4π × slope = '+(4*Math.PI*m).toFixed(1)+' W';
  if(exp==='bounce'&&tx==='none'&&ty==='log')return 'Bounce factor e = e^(slope/2) = '+Math.exp(m/2).toFixed(2);
  return 'Straight, but this form doesn’t give a constant directly';}
function clearData(sim){sim.st.pts=[];sim.st.next=0;sim.st.anim=null;}
function measure(sim){const s=sim.st,e=EXPS[sim.p.exp];if(s.next>=e.xs.length)return false;const x=e.xs[s.next++];const noise=(sim.p.noise||0)/100;
  const y=e.f(x)*(1+noise*randn(s.r));s.pts.push({x,y});s.anim={x,y,t:0};return true;}

const SIM={
  id:'linearize',hash:'linearize',apUnit:0,order:1,tab:'Graphing and linearizing data',kind:'Lab skills',next:['freefall','pendulum'],
  card:'Collect data from a ball drop or a pendulum, then transform the axes until the curve turns into a straight line.',
  title:'Graphing and linearizing data',
  lede:{bio:'Real data often curves. Collect measurements, graph them, and find the change of axes that turns the curve into a straight line.',
        honors:'Square, square-root or invert an axis until the data fall on a line, then use the slope to calculate g or another constant.',
        ap:'Linearize with the physics, not by guessing: write the law in the form y = mx + b, read the constant from the least-squares slope, and judge the fit by its residuals.'},
  scale:'Classroom-sized experiments: drops up to 2 m, strings up to 1 m. Times are measured to about 0.01 s.',
  timeless:true,animated:true,graph:true,
  controls:[
    {id:'exp',label:'Experiment',type:'seg',def:'drop',lvl:'bio',options:[{v:'drop',l:'Ball drop'},{v:'pend',l:'Pendulum'},{v:'light',l:'Light',lvl:'honors'},{v:'bounce',l:'Bounces',lvl:'ap'}],
     onChange(sim){clearData(sim);BioLab.setValues(sim,{tx:'none',ty:'none'});}},
    {id:'tx',label:'Horizontal axis',type:'select',def:'none',lvl:'bio',options:[{v:'none',l:'x (as measured)'},{v:'sq',l:'x²'},{v:'sqrt',l:'√x'},{v:'inv',l:'1/x',lvl:'honors'},{v:'inv2',l:'1/x²',lvl:'honors'},{v:'log',l:'ln x',lvl:'ap'}],noTrial:true},
    {id:'ty',label:'Vertical axis',type:'select',def:'none',lvl:'bio',options:[{v:'none',l:'y (as measured)'},{v:'sq',l:'y²'},{v:'sqrt',l:'√y'},{v:'log',l:'ln y',lvl:'ap'}],noTrial:true},
    {id:'noise',label:'Measurement error',type:'range',min:0,max:5,step:0.5,def:1,unit:' %',lvl:'honors',help:'Random error in each reading'}
  ],
  actions:[
    {id:'measure',label:'Take one measurement',primary:true,run(sim){measure(sim);}},
    {id:'all',label:'Collect the full data set',run(sim){while(measure(sim));sim.st.anim=null;}},
    {id:'clear',label:'Clear data',run(sim){clearData(sim);}}
  ],
  init(){return {pts:[],next:0,anim:null,r:rng(31)};},
  step(sim,dt){const a=sim.st.anim;if(a){a.t+=dt;if(a.t>2.2)sim.st.anim=null;}},
  metrics:[
    {id:'n',label:'Data points',unit:'',lvl:'bio',min:0,max:10,d:0,get:s=>s.st.pts.length},
    {id:'straight',label:'Is it a straight line?',unit:'',lvl:'bio',text:true,get:s=>s.st.pts.length<3?'Need 3+ points':(trulyLinear(s)?'Yes, linear':'No, it curves')},
    {id:'slope',label:'Slope',unit:'',lvl:'honors',d:3,max:null,get:s=>{const F=fit(transformed(s));return F?F.m:NaN;}},
    {id:'icpt',label:'Intercept',unit:'',lvl:'honors',d:3,max:null,get:s=>{const F=fit(transformed(s));return F?F.b:NaN;}},
    {id:'r2',label:'R² (fit quality)',unit:'',lvl:'ap',min:0,max:1,d:4,get:s=>{const F=fit(transformed(s));return F?F.r2:NaN;}},
    {id:'konst',label:'Constant from the slope',unit:'',lvl:'honors',text:true,get:s=>constantText(s)}
  ],
  graphs:[{id:'lin',label:'Transformed data and best-fit line',custom:true},{id:'res',label:'Residuals',custom:true,lvl:'honors'}],
  defaultGraph:'lin',
  plot(sim,ctx,box,id){const T=transformed(sim).filter(p=>Number.isFinite(p.X)&&Number.isFinite(p.Y)),F=fit(transformed(sim)),nm=names(sim),e=EXPS[sim.p.exp];
    if(!T.length){txt(ctx,'Take measurements to plot them here.',box.cw/2,box.ch/2,{s:15,c:PAL['muted'],a:'center',b:'middle'});return;}
    const xu=e.xu,yu=e.yu;
    if(id==='lin'){const xs=T.map(p=>p.X),ys=T.map(p=>p.Y);let xmin=Math.min(0,...xs),xmax=Math.max(...xs)*1.08,ymin=Math.min(0,...ys),ymax=Math.max(...ys)*1.1;if(xmax<=xmin)xmax=xmin+1;if(ymax<=ymin)ymax=ymin+1;
      const ax=axes(ctx,box,{xmin,xmax,ymin,ymax,xl:nm.xl+(sim.p.tx==='none'&&xu?' ('+xu+')':''),yl:nm.yl+(sim.p.ty==='none'&&yu?' ('+yu+')':'')});
      if(F){ctx.strokeStyle=PAL['g-line'];ctx.lineWidth=2;ctx.setLineDash(trulyLinear(sim)?[]:[6,5]);ctx.beginPath();ctx.moveTo(ax.X(xmin),ax.Y(F.m*xmin+F.b));ctx.lineTo(ax.X(xmax),ax.Y(F.m*xmax+F.b));ctx.stroke();ctx.setLineDash([]);
        txt(ctx,'y = '+F.m.toFixed(3)+'x '+(F.b<0?'− ':'+ ')+Math.abs(F.b).toFixed(3)+(atLeast('ap')?'   R² = '+F.r2.toFixed(4):''),box.L+10,box.T+14,{s:13,w:600,c:PAL['fg']});}
      T.forEach(p=>{ctx.fillStyle=PAL['g-dot'];ctx.beginPath();ctx.arc(ax.X(p.X),ax.Y(p.Y),5,0,6.29);ctx.fill();});}
    else{if(!F){txt(ctx,'Need at least 2 points.',box.cw/2,box.ch/2,{s:15,c:PAL['muted'],a:'center'});return;}const R=T.map(p=>({X:p.X,r:p.Y-(F.m*p.X+F.b)}));const mr=Math.max(...R.map(p=>Math.abs(p.r)),1e-6)*1.3;
      const xs=T.map(p=>p.X);const ax=axes(ctx,box,{xmin:Math.min(0,...xs),xmax:Math.max(...xs)*1.08||1,ymin:-mr,ymax:mr,xl:nm.xl,yl:'Residual (data − line)'});
      R.forEach(p=>{ctx.strokeStyle=PAL['g-dot'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ax.X(p.X),ax.Y(0));ctx.lineTo(ax.X(p.X),ax.Y(p.r));ctx.stroke();ctx.fillStyle=PAL['g-dot'];ctx.beginPath();ctx.arc(ax.X(p.X),ax.Y(p.r),4,0,6.29);ctx.fill();});
      txt(ctx,trulyLinear(sim)?'Random scatter around zero: the model fits.':'A curved pattern: the line is the wrong model.',box.L+10,box.T+14,{s:13,w:600,c:PAL['fg']});}},
  narrate(sim){const s=sim.st,e=EXPS[sim.p.exp],n=s.pts.length,hon=atLeast('honors');
    if(!n)return 'Press <b>Take one measurement</b>. Each press runs the '+e.name.toLowerCase()+' at the next setting and records one data point.';
    if(n<3)return 'You have '+n+' point'+(n>1?'s':'')+'. A trend needs at least 3; a good fit uses 6 or more.';
    if(!trulyLinear(sim)){const hint={drop:'Fall time grows more slowly than height. Try squaring the time (y²).',pend:'The period grows more slowly than the length. Try squaring the period (y²).',light:'Intensity drops off fast as distance grows. Try 1/x² on the horizontal axis.',bounce:'Each bounce keeps the same fraction of the height. That is exponential: try ln y.'}[sim.p.exp];
      return '<b>These points curve</b>, so a straight line is the wrong model. '+hint;}
    const c=constantText(sim);return '<b>Straight line!</b> '+(hon&&c!=='—'?'From the slope: '+c+'.':'Now the relationship is y = mx + b, and the slope has a physical meaning.');},
  tour:[
    {title:'The experiment',text:{bio:'A ball is dropped from different heights and a timer records how long each fall takes. Height is the variable you change; time is what you measure.',honors:'Height h is the independent variable; fall time t is the dependent variable. Physics predicts t = √(2h/g).'},focus:[10,30,330,400],pause:true,setup(sim){BioLab.setValues(sim,{exp:'drop'});}},
    {title:'Collect the data',text:'Ten drops, from 0.2 m to 2.0 m. Each point on the right is one measurement.',focus:[350,30,440,400],speed:1,setup(sim){while(measure(sim));sim.st.anim=null;}},
    {title:'The raw graph curves',text:'Time does not grow in proportion to height: doubling the height does not double the time. A curve is hard to read a constant from.',focus:[350,30,440,400],pause:true},
    {title:'Square the time',text:{bio:'Now plot time squared against height. The points line up!',honors:'Squaring both sides of t = √(2h/g) gives t² = (2/g)h. That has the form y = mx with slope 2/g.'},focus:[350,30,440,400],pause:true,setup(sim){BioLab.setValues(sim,{ty:'sq'});}},
    {lvl:'honors',title:'Read the constant',text:'The slope of t² vs h is 2/g, so g = 2 ÷ slope. Check the readout: it should be close to 9.8 m/s².',focus:[350,30,440,400],pause:true},
    {lvl:'ap',title:'Check the residuals',text:'Switch the graph below to Residuals. A good model leaves random scatter around zero; a wrong model leaves a curved pattern.',focus:[350,30,440,400],pause:true}
  ],
  onTourExit(sim){BioLab.setValues(sim,{tx:'none',ty:'none'});},
  lab:{bio:'<p><b>Question:</b> How does fall time depend on drop height?</p><ol><li>Collect the full ball-drop data set.</li><li>Look at the raw curve, then change one axis at a time until the points form a straight line.</li><li>Record which axis change worked.</li></ol><p>Explain in one sentence why the raw graph curves.</p>',
       honors:'<p><b>Question:</b> What is g, measured from a pendulum?</p><ol><li>Choose Pendulum and collect the full data set.</li><li>Linearize the graph and record the slope.</li><li>Calculate g from the slope and compare with 9.8 m/s² (percent error).</li></ol>',
       ap:'<p><b>Question:</b> Which model fits the bouncing ball?</p><ol><li>Collect the bounce data with 2% error.</li><li>Try ln y and y² and compare R² and the residual patterns.</li><li>Find the bounce factor e from the slope.</li></ol><p><b>CER:</b> Justify the model using the residuals, not R² alone.</p>'},
  terms:[{t:'Independent variable',d:'The quantity you choose or change (on the horizontal axis).'},{t:'Dependent variable',d:'The quantity you measure (on the vertical axis).'},{t:'Linear relationship',d:'y = mx + b: the graph is a straight line.'},
    {lvl:'honors',t:'Linearizing',d:'Changing an axis (squaring, square-rooting or inverting) so a curved relationship plots as a straight line.'},{lvl:'honors',t:'Slope',d:'Rise over run of the best-fit line. After linearizing, it equals a combination of physical constants.'},
    {lvl:'ap',t:'Residual',d:'Data value minus the value the fit line predicts.'},{lvl:'ap',t:'R²',d:'The fraction of the variation in y explained by the line (1 = perfect).'}],
  about:'<p>Each experiment follows an exact law: t = √(2h/g), T = 2π√(L/g), I = P/(4πd²) with P = 60 W, and h = 1.5 m × 0.64ⁿ. Each reading gets random error with the chosen standard deviation (default 1%). The best-fit line is ordinary least squares. "Linear" is judged against the noise-free law so random scatter never fools it.</p>',
  challenges:[
    {lvl:'bio',baseline:{exp:'drop',tx:'none',ty:'sq',noise:1},baselineAction:'all',reveal:1.2,q:'You will collect all ten ball drops and plot fall time squared (t²) against height. What will the graph look like?',choices:['A straight line through the origin','A curve that bends upward','A curve that levels off'],correct:0,explain:'t = √(2h/g), so t² = (2/g)·h. Squaring the time undoes the square root, and the points fall on a straight line through (0, 0).'},
    {lvl:'bio',baseline:{exp:'drop',tx:'none',ty:'none',noise:1},baselineAction:'all',reveal:1.2,q:'Look at the raw data. When the drop height doubles from 0.8 m to 1.6 m, what happens to the fall time?',choices:['It doubles','It grows by only about 1.4×','It stays the same'],correct:1,explain:'The ball speeds up as it falls, so the extra height takes less extra time. Time grows with the square root of height: √2 ≈ 1.4. That is why the raw graph curves.'},
    {lvl:'bio',instant:true,q:'A graph of your data is a straight line through the origin. What does that tell you?',choices:['y is proportional to x: double x and y doubles','y does not depend on x','y grows faster and faster as x grows'],correct:0,explain:'A straight line through (0, 0) means y = mx. Doubling x doubles y: the two are directly proportional.'},
    {lvl:'honors',baseline:{exp:'pend',tx:'none',ty:'sq',noise:1},baselineAction:'all',reveal:1.2,q:'Plot T² against L for the pendulum. What value of g will the slope give?',choices:['About 9.8 m/s²','About 4.9 m/s²','About 39 m/s²'],correct:0,explain:'T² = (4π²/g)·L, so the slope is about 4.03 s²/m and g = 4π² ÷ slope ≈ 9.8 m/s². Random error moves it by a percent or so.'},
    {lvl:'honors',baseline:{exp:'drop',tx:'sqrt',ty:'none',noise:1},baselineAction:'all',reveal:1.2,q:'Instead of squaring the time, plot t against √h. Will that be straight too?',choices:['Yes: it is the same law rearranged','No: only t² vs h works','Only if there is no measurement error'],correct:0,explain:'t = √(2/g)·√h, so t vs √h is a line with slope √(2/g) ≈ 0.45. Either transform works; the slope just means something different (g = 2 ÷ slope²).'},
    {lvl:'honors',instant:true,q:'Your t² vs h graph has a slope of 0.204 s²/m. What is g?',choices:['4.9 m/s²','9.8 m/s²','0.204 m/s²'],correct:1,explain:'The slope equals 2/g, so g = 2 ÷ 0.204 = 9.8 m/s².'},
    {lvl:'ap',baseline:{exp:'light',tx:'inv2',ty:'none',noise:1},baselineAction:'all',reveal:1.2,q:'The light meter data are plotted as I vs 1/d². What bulb power P will the slope give?',choices:['About 60 W','About 4.8 W','About 750 W'],correct:0,explain:'I = (P/4π)·(1/d²). The slope is P/4π ≈ 4.8 W, so P = 4π × slope ≈ 60 W. Choosing 4.8 W forgets the 4π.'},
    {lvl:'ap',baseline:{exp:'bounce',tx:'none',ty:'log',noise:1},baselineAction:'all',reveal:1.2,q:'Each peak keeps the same fraction of the last one. With ln h vs n plotted, what bounce factor e (rebound speed ÷ impact speed) comes out?',choices:['About 0.80','About 0.64','About 0.41'],correct:0,explain:'h_n = h₀(e²)ⁿ, so ln h = ln h₀ + (2 ln e)·n. The slope is about −0.446, so e = e^(slope/2) ≈ 0.80. The height ratio 0.64 is e², not e.'},
    {lvl:'ap',instant:true,q:'Two models give R² = 0.990 and 0.999. The 0.990 model’s residuals curve; the 0.999 model’s are random. Which is the right model?',choices:['The 0.990 model, because it is simpler','The 0.999 model: random residuals show it captures the pattern','Neither: R² must equal 1'],correct:1,explain:'A curved residual pattern means the model is systematically wrong, even with a high R². Random residuals around zero mean the remaining differences are just measurement error.'}
  ],
  initVis(){},
  thumbSetup(sim){BioLab.setValues(sim,{ty:'sq'});while(measure(sim));sim.st.anim=null;},
  draw(sim,ctx,vdt,k,t){const s=sim.st,e=EXPS[sim.p.exp],nm=names(sim);k=Math.min(k,1.25);
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    // apparatus panel
    ctx.fillStyle=PAL['cv-bg2'];rr(ctx,10,30,330,400,12);ctx.fill();
    txt(ctx,e.name.toUpperCase(),24,52,{s:12*k,w:700,c:PAL['cv-soft']});
    const a=s.anim,cur=a?a.x:(s.pts.length?s.pts[s.pts.length-1].x:e.xs[0]);
    if(sim.p.exp==='drop'){const top=90,bot=400,px=(bot-top)/2.0,h=cur;const y0=bot-h*px;ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(20,bot+2,310,14);
      ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(80,top-10);ctx.lineTo(80,bot);ctx.stroke();
      for(let m=0;m<=20;m++){const yy=bot-m*0.1*px;ctx.beginPath();ctx.moveTo(80,yy);ctx.lineTo(m%5===0?92:86,yy);ctx.stroke();if(m%5===0)txt(ctx,(m/10).toFixed(1)+' m',74,yy+4,{s:11*k,a:'right',c:PAL['cv-soft']});}
      ctx.fillStyle=PAL['cv-ink'];ctx.fillRect(150,y0-6,90,6);txt(ctx,'release',145,y0-1,{s:11*k,c:PAL['cv-soft'],a:'right'});
      let by=y0+10;if(a){const tf=e.f(a.x),tt=Math.min(a.t,tf);by=y0+10+0.5*G*tt*tt*px;by=Math.min(by,bot-10);}
      ctx.fillStyle='#d9573b';ctx.beginPath();ctx.arc(195,by,10,0,6.29);ctx.fill();
      const shown=a?Math.min(a.t,e.f(a.x)):(s.pts.length?s.pts[s.pts.length-1].y:0);
      rr(ctx,240,60,90,50,8);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.stroke();txt(ctx,'TIMER',285,77,{s:10*k,w:700,a:'center',c:PAL['cv-soft']});txt(ctx,shown.toFixed(3)+' s',285,100,{s:17*k,w:700,a:'center'});}
    else if(sim.p.exp==='pend'){const piv=[175,80],Lpx=300*cur/1.0,T=e.f(cur),th=0.25*Math.cos(2*Math.PI*(a?a.t:t)/T*(RM?0:1));
      ctx.fillStyle=PAL['cv-ink'];ctx.fillRect(110,70,130,8);const bx=piv[0]+Lpx*Math.sin(th),by=piv[1]+Lpx*Math.cos(th);
      ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(piv[0],piv[1]);ctx.lineTo(bx,by);ctx.stroke();ctx.fillStyle='#3f6fb0';ctx.beginPath();ctx.arc(bx,by,12,0,6.29);ctx.fill();
      txt(ctx,'L = '+cur.toFixed(1)+' m',250,110,{s:13*k,w:600});txt(ctx,'T = '+T.toFixed(2)+' s',250,132,{s:13*k,c:PAL['cv-soft']});}
    else if(sim.p.exp==='light'){const bx=60,dpx=110*cur;ctx.fillStyle='#ffd23f';ctx.beginPath();ctx.arc(bx,230,16,0,6.29);ctx.fill();
      for(let i=0;i<10;i++){const an=i/10*6.28;ctx.strokeStyle='rgba(255,200,60,.5)';ctx.beginPath();ctx.moveTo(bx+20*Math.cos(an),230+20*Math.sin(an));ctx.lineTo(bx+30*Math.cos(an),230+30*Math.sin(an));ctx.stroke();}
      ctx.fillStyle=PAL['cv-ink'];rr(ctx,bx+dpx,210,30,40,5);ctx.fill();txt(ctx,'meter',bx+dpx+15,268,{s:11*k,a:'center',c:PAL['cv-soft']});
      ctx.strokeStyle=PAL['cv-soft'];ctx.beginPath();ctx.moveTo(bx,300);ctx.lineTo(bx+dpx,300);ctx.stroke();txt(ctx,'d = '+cur.toFixed(2)+' m',bx+dpx/2,318,{s:12*k,a:'center'});
      txt(ctx,'I = '+e.f(cur).toFixed(2)+' W/m²',bx+dpx+15,200,{s:12*k,a:'center',w:600});}
    else{const bot=400,px=280/1.5;ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(20,bot,310,16);
      let prev=null;for(let n=0;n<8;n++){const hh=e.f(n),x=50+n*36,y=bot-hh*px;ctx.fillStyle=n===Math.round(cur)?'#d9573b':PAL['cv-soft'];ctx.beginPath();ctx.arc(x,y-6,6,0,6.29);ctx.fill();if(prev){ctx.strokeStyle=PAL['line'];ctx.beginPath();ctx.moveTo(prev[0],prev[1]);ctx.quadraticCurveTo((prev[0]+x)/2,Math.min(prev[1],y)-10,x,y-6);ctx.stroke();}prev=[x,y-6];}
      txt(ctx,'Each peak is 64% of the one before',175,90,{s:12*k,a:'center',c:PAL['cv-soft']});}
    // raw graph panel on stage
    const box={L:410,T:60,W:360,H:270,cw:800,ch:420};ctx.fillStyle=PAL['card'];rr(ctx,350,30,440,400,12);ctx.fill();
    txt(ctx,'RAW DATA: '+e.yl+(e.yu?' ('+e.yu+')':'')+' vs '+e.xl,370,52,{s:12*k,w:700,c:PAL['cv-soft']});
    const xmax=Math.max(...e.xs)*1.08,ymax=Math.max(...e.xs.map(e.f))*1.12;
    const ax=axes(ctx,{L:box.L,T:box.T+10,W:box.W,H:box.H-20,cw:box.L+box.W/2+180,ch:box.T+box.H+30},{xmin:0,xmax,ymin:0,ymax,xl:'',yl:''});
    txt(ctx,e.xl+(e.xu?' ('+e.xu+')':''),box.L+box.W/2,box.T+box.H+42,{s:12*k,a:'center',c:PAL['muted']});
    s.pts.forEach(p=>{ctx.fillStyle=PAL['g-dot'];ctx.beginPath();ctx.arc(ax.X(p.x),ax.Y(p.y),5,0,6.29);ctx.fill();});
    if(s.pts.length>=3&&!trulyLinear(sim)&&sim.p.tx==='none'&&sim.p.ty==='none'){ctx.strokeStyle=PAL['line'];ctx.setLineDash([4,4]);ctx.beginPath();e.xs.forEach((x,i)=>{const X=ax.X(x),Y=ax.Y(e.f(x));i?ctx.lineTo(X,Y):ctx.moveTo(X,Y);});ctx.stroke();ctx.setLineDash([]);}
    pill(ctx,'Graph below plots: '+nm.yl+' vs '+nm.xl,570,410,PAL['cv-bg2'],PAL['cv-ink'],12*k);
  }
};
BioLab.register(SIM);
})();
