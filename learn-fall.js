/* Learn it for linearize and twobody (Nov 18, 2026, fall-tools session, helper C).
   Same shape as learn-more.js: one BioLab.addLearn block, plus why questions for linearize, which had none.
   Linearize steps draw the transformed graph on the canvas (the tool's own transformed graph sits below it, off-screen in Learn it). */
(function(){
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
const act=(sim,id)=>{const a=(sim.def.actions||[]).find(x=>x.id===id);if(a)a.run(sim);};

/* ---------- linearize ---------- */
const PANEL=[352,32,436,396];
const fitLine=P=>{const n=P.length;if(n<2)return null;let sx=0,sy=0;P.forEach(p=>{sx+=p.X;sy+=p.Y;});const mx=sx/n,my=sy/n;let sxx=0,sxy=0;P.forEach(p=>{sxx+=(p.X-mx)**2;sxy+=(p.X-mx)*(p.Y-my);});if(sxx<1e-12)return null;const m=sxy/sxx;return {m,b:my-m*mx};};
const collect=sim=>{act(sim,'clear');act(sim,'all');};
const ensure=sim=>{if(!sim.st.pts||sim.st.pts.length<10)collect(sim);};
/* draws a graph over the right-hand panel. o:{title,fx,fy,xr,yr,xt,yt,xl,yl,fit} ; returns mapping */
function lgraph(sim,ctx,k,o){const K=BioLab.lg,kk=Math.min(k,1.25);ctx.save();H.rr(ctx,PANEL[0],PANEL[1],PANEL[2],PANEL[3],12);ctx.fillStyle=PAL['cv-sol']||'#fff';ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle=PAL['cv-soft'];ctx.stroke();ctx.restore();
  const B={x0:436,x1:768,y0:80,y1:330},ny=v=>(v-o.yr[0])/(o.yr[1]-o.yr[0]);
  H.txt(ctx,o.title,368,56,{s:13*kk,w:800});
  K.axes(ctx,B,kk,{xr:o.xr,xt:o.xt,yt:o.yt.map(([v,l])=>[ny(v),l]),xl:o.xl,yl:o.yl,ylOff:50});
  const P=(sim.st.pts||[]).map(p=>({X:o.fx(p.x),Y:o.fy(p.y)})).filter(p=>isFinite(p.X)&&isFinite(p.Y));
  const F=o.fit?fitLine(P):null;
  if(F){ctx.save();ctx.strokeStyle=GREEN;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(K.X(B,o.xr,o.xr[0]),K.Y(B,ny(F.m*o.xr[0]+F.b)));ctx.lineTo(K.X(B,o.xr,o.xr[1]),K.Y(B,ny(F.m*o.xr[1]+F.b)));ctx.stroke();ctx.restore();}
  P.forEach(p=>K.dot(ctx,K.X(B,o.xr,p.X),K.Y(B,ny(p.Y)),BLUE,5.5));
  return {B,F,P,at:(x,y)=>[K.X(B,o.xr,x),K.Y(B,ny(y))]};}
const RAW={title:'Fall time t vs drop height h',fx:x=>x,fy:y=>y,xr:[0,2.1],yr:[0,0.7],xt:[[0,'0'],[0.5,'0.5'],[1,'1.0'],[1.5,'1.5'],[2,'2.0']],yt:[[0,'0'],[0.2,'0.2'],[0.4,'0.4'],[0.6,'0.6']],xl:'Drop height h (m)',yl:'Fall time t (s)'};
const SQ={title:'t² vs h',fx:x=>x,fy:y=>y*y,xr:[0,2.1],yr:[0,0.45],xt:RAW.xt,yt:[[0,'0'],[0.1,'0.1'],[0.2,'0.2'],[0.3,'0.3'],[0.4,'0.4']],xl:'Drop height h (m)',yl:'t² (s²)',fit:true};
/* dashed guide from both axes to a point, with a label */
function mark(ctx,k,G,x,y,label,side,dy){const K=BioLab.lg,[px,py]=G.at(x,y);ctx.save();ctx.strokeStyle=RED;ctx.lineWidth=1.8;ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(G.B.x0,py);ctx.lineTo(px,py);ctx.lineTo(px,G.B.y1);ctx.stroke();ctx.restore();
  K.dot(ctx,px,py,RED,7);if(label)K.tagA(ctx,label,side==='r'?px-10:px+10,py+(dy||-22),Math.min(k,1.3),{s:12.5,hi:true},side||'l');}
const tNear=(sim,h)=>{const p=(sim.st.pts||[]).find(q=>Math.abs(q.x-h)<1e-6);return p?p.y:Math.sqrt(2*h/9.8);};
const DROP={exp:'drop',noise:0};
L.linearize={
  goals:{
    bio:['Which variable you change and which you measure','Why a fall-time graph curves','How squaring one axis turns the curve into a straight line','Why four times the height only doubles the time'],
    honors:['How the slope of a straightened graph gives a constant, like g','How to pick the transform from the physics law'],
    ap:['How residuals show whether a model is right, even when R² is high','How to linearize an inverse-square law']},
  matters:'Scientists straighten curved data all the time because a straight line is the one shape you can read a constant from: g from falling balls, a drug’s half-life from blood tests, or how fast a phone signal fades with distance.',
  steps:[
    {key:'setup',title:'The experiment',set:DROP,pause:true,focus:[10,30,330,400],
     see:'A ball hangs from a release bar beside a meter stick. A timer measures each fall. Heights run from 0.2 m to 2.0 m.',
     why:'Height is what you change, the <b>independent variable</b>. Time is what you measure, the <b>dependent variable</b>.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[10,30,330,400],tau);}},
    {key:'collect',title:'Collect the data',set:DROP,speed:1,focus:PANEL,run:collect,
     see:'Ten drops. Each blue dot is one height and its fall time, from 0.20 s at 0.2 m to 0.64 s at 2.0 m.',
     why:'A graph shows the pattern faster than a table: higher drops take longer, but each extra step adds less time.',
     overlay(sim,ctx,LH,k){lgraph(sim,ctx,k,RAW);}},
    {key:'curve',title:'The raw graph curves',set:DROP,pause:true,focus:PANEL,run:ensure,
     see:'Doubling the height, from 0.8 m to 1.6 m, raises the time only from 0.40 s to 0.57 s.',
     why:'The ball speeds up as it falls, so extra height takes less extra time. It’s hard to read a constant off a curve.',
     overlay(sim,ctx,LH,k){const G=lgraph(sim,ctx,k,RAW);mark(ctx,k,G,0.8,tNear(sim,0.8),'0.8 m: 0.40 s','l',30);mark(ctx,k,G,1.6,tNear(sim,1.6),'1.6 m: 0.57 s','r',-26);}},
    {key:'hook',title:'Your question: knee height vs eye height',set:DROP,pause:true,focus:PANEL,run:ensure,
     see:'From 0.4 m (knee height) the fall takes 0.29 s. From 1.6 m (eye height), four times as high, it takes 0.57 s.',
     why:'Four times the height only doubles the time, because t grows with √h. Nine times the height would triple it.',
     overlay(sim,ctx,LH,k){const G=lgraph(sim,ctx,k,RAW);mark(ctx,k,G,0.4,tNear(sim,0.4),'0.4 m: 0.29 s','l',30);mark(ctx,k,G,1.6,tNear(sim,1.6),'1.6 m: 0.57 s','r',-26);}},
    {key:'square',title:'Square the time',set:DROP,speed:1,focus:PANEL,run(sim){ensure(sim);BioLab.setValues(sim,{ty:'sq'});},
     see:'The same ten drops, now plotted as t² against h. The points fall on a straight line through zero.',
     why:{bio:'Squaring the time undoes the square root in the law. A straight line through zero means t² is proportional to h.',
          honors:'Squaring t = √(2h/g) gives t² = (2/g)h. That is y = mx with slope 2/g, so the points must line up.'},
     overlay(sim,ctx,LH,k){const G=lgraph(sim,ctx,k,SQ);BioLab.lg.tagA(ctx,'A straight line!',G.B.x0+14,G.B.y0+8,Math.min(k,1.3),{s:13,hi:true},'l');}},
    {key:'slope',lvl:'honors',title:'Read g from the slope',set:DROP,pause:true,focus:PANEL,run(sim){ensure(sim);BioLab.setValues(sim,{ty:'sq'});},
     see:'The best-fit line rises 0.204 s² for every meter of height: slope = 0.204 s²/m.',
     why:'The slope is 2/g, so g = 2 ÷ 0.204 = 9.80 m/s². The straight line turned the data into a measurement.',
     overlay(sim,ctx,LH,k){const G=lgraph(sim,ctx,k,SQ);if(!G.F)return;const K=BioLab.lg,[x1,y1]=G.at(0.5,G.F.m*0.5+G.F.b),[x2,y2]=G.at(1.5,G.F.m*1.5+G.F.b);
       ctx.save();ctx.strokeStyle=RED;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.restore();
       K.tagA(ctx,'run 1.0 m',(x1+x2)/2-30,y1+20,Math.min(k,1.3),{s:12},'l');K.tagA(ctx,'rise '+G.F.m.toFixed(3)+' s²',x2+8,(y1+y2)/2,Math.min(k,1.3),{s:12},'l');
       card(ctx,k,440,96,250,[['slope = '+G.F.m.toFixed(3)+' s²/m'],['g = 2 ÷ slope = '+(2/G.F.m).toFixed(2)+' m/s²',{w:800,c:GREEN}]]);}},
    {key:'pend',lvl:'honors',title:'The same trick: a pendulum',set:{exp:'pend',noise:0},speed:1,focus:PANEL,run(sim){if(!sim.st.pts||sim.st.pts.length<10)collect(sim);BioLab.setValues(sim,{ty:'sq'});},
     see:'Pendulum periods for strings 0.1 m to 1.0 m long, plotted as T² against L: another straight line.',
     why:'T = 2π√(L/g), so T² = (4π²/g)L. The slope, 4.03 s²/m, gives g = 4π² ÷ 4.03 = 9.80 m/s².',
     overlay(sim,ctx,LH,k){const G=lgraph(sim,ctx,k,{title:'T² vs string length L',fx:x=>x,fy:y=>y*y,xr:[0,1.05],yr:[0,4.4],xt:[[0,'0'],[0.25,'0.25'],[0.5,'0.50'],[0.75,'0.75'],[1,'1.00']],yt:[[0,'0'],[1,'1'],[2,'2'],[3,'3'],[4,'4']],xl:'String length L (m)',yl:'T² (s²)',fit:true});
       if(G.F)card(ctx,k,440,96,240,[['slope = '+G.F.m.toFixed(2)+' s²/m'],['g = 4π² ÷ slope = '+(4*Math.PI*Math.PI/G.F.m).toFixed(2)+' m/s²',{w:800,c:GREEN}]]);}},
    {key:'resid',lvl:'ap',title:'Check the residuals',set:{exp:'drop',noise:0.5},pause:true,focus:[0,0,800,450],run:collect,
     see:'Drops with a little random error (0.5%). Left: what is left over after fitting a line to t vs h. Right: the same for t² vs h.',
     why:'A wrong model leaves a curved pattern of <b>residuals</b> (data − line); the right one leaves random scatter. Judge by the pattern, not R² alone.',
     overlay(sim,ctx,LH,k){const K=BioLab.lg,kk=Math.min(k,1.25);K.dim(ctx,LH);const P=sim.st.pts||[];
       const panel=(x0,fy,title,col)=>{const Q=P.map(p=>({X:p.x,Y:fy(p.y)})),F=fitLine(Q);H.txt(ctx,title,x0+170,52,{s:13.5*kk,w:800,a:'center'});if(!F)return;
         const R=Q.map(q=>({X:q.X,r:q.Y-(F.m*q.X+F.b)})),mr=Math.max(1e-6,...R.map(q=>Math.abs(q.r)))*1.25,B={x0:x0+30,x1:x0+330,y0:90,y1:370},ym=(B.y0+B.y1)/2;
         ctx.save();ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(B.x0,B.y0);ctx.lineTo(B.x0,B.y1);ctx.moveTo(B.x0,ym);ctx.lineTo(B.x1,ym);ctx.stroke();ctx.restore();
         R.forEach(q=>{const x=B.x0+q.X/2.1*(B.x1-B.x0),y=ym-q.r/mr*(B.y1-B.y0)/2;ctx.save();ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,ym);ctx.lineTo(x,y);ctx.stroke();ctx.restore();K.dot(ctx,x,y,col,5);});
         H.txt(ctx,'residual = data − line',B.x0,B.y1+22*kk,{s:12*kk,c:PAL['cv-soft']});};
       panel(20,y=>y,'Line fit to t vs h: an arch (wrong model)',RED);panel(420,y=>y*y,'Line fit to t² vs h: random (right model)',GREEN);}},
    {key:'light',lvl:'ap',title:'Inverse square: a light meter',set:{exp:'light',noise:0},speed:1,focus:PANEL,run(sim){if(!sim.st.pts||sim.st.pts.length<9)collect(sim);BioLab.setValues(sim,{tx:'inv2'});},
     see:'A light meter at 0.5 m to 2.5 m from a bulb. Plotted as intensity I against 1/d², the points line up.',
     why:'I = P/(4πd²), so I vs 1/d² has slope P/4π = 4.77 W. Then P = 4π × slope = 60 W.',
     overlay(sim,ctx,LH,k){const G=lgraph(sim,ctx,k,{title:'I vs 1/d²',fx:x=>1/(x*x),fy:y=>y,xr:[0,4.2],yr:[0,20],xt:[[0,'0'],[1,'1'],[2,'2'],[3,'3'],[4,'4']],yt:[[0,'0'],[5,'5'],[10,'10'],[15,'15'],[20,'20']],xl:'1/d² (1/m²)',yl:'Intensity I (W/m²)',fit:true});
       if(G.F)card(ctx,k,440,96,230,[['slope = '+G.F.m.toFixed(2)+' W'],['P = 4π × slope = '+(4*Math.PI*G.F.m).toFixed(0)+' W',{w:800,c:GREEN}]]);}}
  ],
  useIt:[
    {do:'When a graph curves, ask what law you expect before you fit a line.',why:'The law tells you which axis to change (square, square root or 1/x²) to make it straight.'},
    {do:'Read a constant from the slope of a straightened graph.',why:'A straight line has one number that describes it, its slope, and that slope usually stands for something physical, like g.'},
    {do:'Don’t trust a high R² by itself.',why:'Curved data can still give R² near 1. A pattern in the leftovers (residuals) shows the model is wrong.'}],
  tryIt:[{title:'the drop timer (15 minutes)',steps:['Use a phone’s slow-motion video to film a ball dropped from 0.5 m and from 2.0 m next to a tape measure.','Count frames to find each fall time (frames ÷ frames per second).','Compare: does four times the height take four times as long?'],look:'The 2.0 m drop takes about 0.64 s and the 0.5 m drop about 0.32 s: twice as long, not four times.'}]};
R.linearize={questions:[
  {id:'curves',kind:'test',lvl:'bio',q:'A graph of fall time against drop height curves. What does that tell you?',choices:['Time is not proportional to height','The timer must have been broken','Height doesn’t affect fall time','Time grows faster than height does'],correct:0,
   steps:['Proportional quantities plot as a straight line through zero.','The curve bends over: time grows more slowly than height.','So time is not proportional to height.']},
  {id:'fourx',kind:'test',lvl:'bio',q:'A ball takes 0.30 s to fall 0.44 m. From four times as high, 1.76 m, how long does the fall take?',num:{ans:0.60,tol:0.01,unit:'s'},
   steps:['Fall time grows with the square root of height.','√4 = 2, so four times the height means twice the time.','2 × 0.30 s = 0.60 s.']},
  {id:'whichline',kind:'test',lvl:'bio',q:'Which graph of ball-drop data is a straight line through zero?',choices:['t² against h','t against h','t against h²','1/t against h'],correct:0,
   steps:['The law is t = √(2h/g).','Squaring both sides: t² = (2/g)h.','So t² against h is a straight line through zero.']},
  {id:'gslope',kind:'test',lvl:'honors',q:'Your t² vs h graph has a slope of 0.210 s²/m. What value of g does it give?',num:{ans:9.52,tol:0.03,unit:'m/s²'},
   steps:['t² = (2/g)h, so the slope is 2/g.','g = 2 ÷ slope.','2 ÷ 0.210 = 9.52 m/s².']},
  {id:'pendaxes',kind:'test',lvl:'honors',q:'For a pendulum, T = 2π√(L/g). Which axes give a straight line through zero?',choices:['T² against L','T against L','T against L²','T² against 1/L'],correct:0,
   steps:['Square both sides: T² = (4π²/g)L.','That is y = mx with y = T² and x = L.','The slope is 4π²/g.']},
  {id:'arch',kind:'test',lvl:'ap',q:'A best-fit line has R² = 0.995, but its residuals form a clear arch. What should you conclude?',choices:['The model is wrong; try another transform','The fit is excellent since R² is near 1','The data have too much random error','The line should be forced through zero'],correct:0,
   steps:['Random error leaves residuals scattered with no pattern.','An arch means the line misses in a systematic way.','So the model is wrong, even though R² is high.']},
  {id:'bulb',kind:'test',lvl:'ap',q:'Light-meter data plotted as I against 1/d² give a slope of 6.4 W. If I = P/(4πd²), what is the bulb’s power P?',num:{ans:80.4,tol:0.5,unit:'W'},
   steps:['I = (P/4π)(1/d²), so the slope is P/4π.','P = 4π × slope.','4π × 6.4 = 80.4 W.']}
  ]};

/* ---------- twobody ---------- */
const tbCard=(ctx,k,LH,txt,c)=>card(ctx,k,440,LH-3,352,[[txt,{w:800,c:c||PAL['cv-ink']}]],{up:true});
const hon=()=>H.level&&H.level!=='bio';
const ONE=(o)=>Object.assign({mode:'pull',boxes:'one',F:100,angle:0,m1:20,m2:15,surface:'wood'},o||{});
const TWO=(o)=>Object.assign({mode:'pull',boxes:'two',F:150,angle:30,m1:20,m2:15,surface:'wood'},o||{});
/* acceleration from rest for one 20 kg box on wood (μs 0.40, μk 0.30), F = 100 N, pulled up or pushed down at θ */
const aBox=(th,push)=>{const r=th*Math.PI/180,Fx=100*Math.cos(r),N=196+(push?1:-1)*100*Math.sin(r);if(Fx<=0.40*N)return 0;return Math.max(0,(Fx-0.30*N)/20);};
L.twobody={
  goals:{
    bio:['How to draw a free-body diagram for a box you pull or push','Why pulling up at an angle makes friction smaller','Why pushing down at an angle can stop the box from moving','How a rope pulls two boxes equally hard in opposite directions'],
    honors:['How to split an angled force into parts with cos θ and sin θ','How the normal force changes friction','How to find acceleration and tension with system and single-box diagrams'],
    ap:['Why internal forces cancel in a system diagram','Why the best pulling angle satisfies tan θ = μk']},
  matters:'Moving furniture, towing a car with a strap, pulling a wagon or a sled: the angle of your force decides how much of it fights friction. Engineers use the same diagrams for trains, trucks with trailers and elevators.',
  steps:[
    {key:'level',title:'One box, a level pull',set:ONE(),fresh:true,speed:0.6,focus:[10,10,384,282],
     see:'A 20 kg box of books on a wood floor, pulled by a level strap with 100 N. The diagram shows four forces on the box.',
     why:{bio:'The floor pushes up 196 N, equal to the weight. Friction, 58.8 N, pulls back, so 41 N is left to speed the box up.',
          honors:'N = mg = 196 N, f = μk·N = 0.30 × 196 = 58.8 N, so a = (100 − 58.8) ÷ 20 = 2.06 m/s².'},
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[10,10,384,282],tau);tbCard(ctx,k,LH,'Friction '+F(sim,'f1',1)+'  ·  a = '+F(sim,'acc',2));}},
    {key:'up',title:'Raise the strap to 30°',set:ONE({angle:30}),fresh:true,speed:0.6,focus:[400,10,390,282],
     see:'Same 100 N, now with the strap angled 30° up. The force splits: 86.6 N forward and 50 N up.',
     why:'The upward part carries some weight, so the floor pushes only 146 N and friction drops to 43.8 N. The box speeds up faster.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[400,10,390,282],tau);tbCard(ctx,k,LH,'Friction '+F(sim,'f1',1)+'  ·  a = '+F(sim,'acc',2),GREEN);}},
    {key:'push',title:'Your question: push at 30° down',set:ONE({mode:'push',angle:30}),fresh:true,speed:0.6,focus:[10,10,384,282],
     see:'Now push with the same 100 N, angled 30° down. The box doesn’t move.',
     why:'The 50 N down part presses the box into the floor (N = 246 N), so static friction can hold 98.4 N, more than your 86.6 N forward. Drag it.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[10,10,384,282],tau);tbCard(ctx,k,LH,'N = '+F(sim,'N1',0)+'  ·  a = '+F(sim,'acc',2),RED);}},
    {key:'graph',lvl:'honors',title:'Your graph: pull vs push at every angle',set:ONE({angle:30}),pause:true,focus:[0,0,800,450],
     see:'Acceleration for every angle, 0° to 60°, with 100 N. Green: pulling up. Red: pushing down.',
     why:'Pulling up lowers friction, so the green curve rises at first, peaking near 17°. Pushing down raises friction, and past about 22° the box won’t budge.',
     overlay(sim,ctx,LH,k,tau){const K=BioLab.lg,kk=Math.min(k,1.25);K.dim(ctx,LH);const B={x0:120,x1:740,y0:70,y1:350},xr=[0,60],f=Math.min(1,tau/3);
       K.axes(ctx,B,kk,{xr,xt:[0,10,20,30,40,50,60].map(v=>[v,v+'°']),yt:[0,0.5,1,1.5,2,2.5].map(v=>[v/2.5,v.toFixed(1)]),xl:'Angle of your 100 N force from level',yl:'Acceleration (m/s²)'});
       K.curve(ctx,B,xr,th=>aBox(th,false)/2.5,60*f,GREEN);K.curve(ctx,B,xr,th=>aBox(th,true)/2.5,60*f,RED);
       if(f>=1){const t=Math.min(k,1.3);K.dot(ctx,K.X(B,xr,30),K.Y(B,aBox(30,false)/2.5),GREEN,7);K.tagA(ctx,'Pull at 30°: '+aBox(30,false).toFixed(2)+' m/s²',K.X(B,xr,30)+10,K.Y(B,aBox(30,false)/2.5)-24,t,{s:12.5},'l');
         K.dot(ctx,K.X(B,xr,30),K.Y(B,0),RED,7);K.tagA(ctx,'Push at 30°: stuck',K.X(B,xr,30)+10,K.Y(B,0)-22,t,{s:12.5,hi:true},'l');}}},
    {key:'two',title:'Two boxes, two diagrams',set:TWO(),fresh:true,speed:0.5,focus:[10,10,516,282],
     see:'A 15 kg box tied behind; pull with 150 N at 30°. Box 1 and box 2 each get their own diagram.',
     why:'The rope pulls box 2 forward and box 1 backward, equally hard (purple arrows). Each box’s friction comes from its own normal force.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[10,10,516,282],tau);tbCard(ctx,k,LH,'Between boxes '+F(sim,'inner',1)+'  ·  a = '+F(sim,'acc',2));}},
    {key:'system',title:'The system diagram',set:TWO(),speed:0.5,focus:[538,10,252,282],
     see:'The right-hand diagram treats both boxes as one 35 kg object.',
     why:{bio:'Only outside forces count: your pull, gravity, the floor and friction. The rope’s two pulls cancel inside, so they disappear.',
          honors:'Only outside forces count; the rope’s pulls cancel inside. (129.9 − 80.4) N ÷ 35 kg = 1.41 m/s².'},
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[538,10,252,282],tau);tbCard(ctx,k,LH,'Both boxes: a = '+F(sim,'acc',2),GREEN);}},
    {key:'tension',lvl:'honors',title:'Tension from one box',set:TWO(),speed:0.5,focus:[220,10,200,282],
     see:'Box 2’s diagram: the rope pulls it forward, and friction, 44.1 N, pulls it back.',
     why:'T − f₂ = m₂a, so T = 44.1 + 15 × 1.41 = 65.3 N. That matches the purple arrow, and box 1’s diagram checks out too.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[220,10,200,282],tau);tbCard(ctx,k,LH,'f₂ = '+F(sim,'f2',1)+'  ·  T = '+F(sim,'inner',1),GREEN);}},
    {key:'push2',title:'Push two boxes',set:TWO({mode:'push',F:200,angle:20}),fresh:true,speed:0.5,focus:[0,296,800,154],
     see:'Push box 1 with 200 N at 20° down. Box 1 pushes box 2 ahead of it, and both speed up together.',
     why:'Box 1 pushes box 2 forward with 71.8 N, and box 2 pushes back on box 1 just as hard: Newton’s third law.',
     overlay(sim,ctx,LH,k,tau){tbCard(ctx,k,LH,'Between boxes '+F(sim,'inner',1)+'  ·  a = '+F(sim,'acc',2));}},
    {key:'best',lvl:'ap',title:'The best angle',set:ONE({angle:17}),fresh:true,speed:0.6,focus:[400,10,390,282],
     see:'The strap at 17°: one box speeds up fastest, at 2.28 m/s².',
     why:'Tilting trades forward pull for less friction. The best tilt is where tan θ = μk = 0.30, so θ ≈ 17°.',
     overlay(sim,ctx,LH,k,tau){tbCard(ctx,k,LH,'a = '+F(sim,'acc',2)+'  ·  best angle '+F(sim,'best',1),GREEN);}}
  ],
  useIt:[
    {do:'Drag a heavy box or suitcase with the strap angled up, not straight across the floor.',why:'The upward part of your pull carries some weight, so the floor presses less and friction drops.'},
    {do:'When pushing a lawn mower or cart up a bump, push more forward than down.',why:'Pushing down presses the wheels into the ground and adds friction that fights you.'},
    {do:'Tow with a short, low strap only as far as safety allows, and pull smoothly.',why:'A towing strap pulls both vehicles equally hard in opposite directions; a jerk makes that tension spike.'}],
  tryIt:[{title:'the angled pull (10 minutes)',steps:['Tie a string to a shoebox filled with books, and hook a rubber band in the string as a rough force meter.','Pull it across the floor with the string level, then angled up about 30°, then push it down at an angle with your hand.','Watch how far the rubber band stretches each time the box starts to slide.'],look:'The angled-up pull starts the box with less stretch than the level pull. Pushing down at an angle takes the most.'}]};

BioLab.addLearn(L);
Object.keys(R).forEach(id=>{const d=DEF(id);if(d&&d.review&&d.review.questions&&d.review.questions.length)delete R[id];});
BioLab.addReview(R);
})();
