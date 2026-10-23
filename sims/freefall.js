(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,axes,legend,fmtNum}=BioLab.h;

/* Free fall with optional air resistance and bouncing.
   Upward is positive. Without air: a = −g. With air, quadratic drag sized by each object's
   terminal speed v_t:  a = −g − sign(v)·g·(v/v_t)²  (so a → 0 as |v| → v_t on the way down).
   Mars: thin air (ρ ≈ 0.020 kg/m³ vs 1.2 on Earth) raises v_t by √((g/9.8)(1.2/0.020)) ≈ 4.8×.
   Moon: no air at all.
   Bounce (Pivot Interactives W25): rebound speed = e × impact speed, so each peak is e² of the last.
   Landing times are interpolated inside the 2 ms step. */
const PLANETS={earth:{n:'Earth',g:9.8,air:1},moon:{n:'Moon',g:1.62,air:0},mars:{n:'Mars',g:3.71,air:Math.sqrt((3.71/9.8)*(1.2/0.020))}};
const OBJ={bowling:{n:'Bowling ball',vt:80,r:17,bounce:true},tennis:{n:'Tennis ball',vt:23,r:9,bounce:true},paper:{n:'Crumpled paper',vt:5,r:11,bounce:false},feather:{n:'Feather',vt:0.6,r:13,bounce:false}};
const CA='#3f6fb0',CB='#d9573b',GY=410,TOPY=58,XA=250,XB=360;

function airOn(sim){return !!sim.p.air&&PLANETS[sim.p.planet].air>0;}
function vtOf(sim,key){return OBJ[key].vt*PLANETS[sim.p.planet].air;}
function topH(sim){const g=PLANETS[sim.p.planet].g,v0=Math.max(0,sim.p.v0||0);return Math.max(1,(sim.p.h+v0*v0/(2*g)))*1.06;}
function body(sim,key){return {key,y:sim.p.h,v:sim.p.v0||0,land:null,imp:null,rest:false,bounces:0,peaks:[],ghosts:[{y:sim.p.h}],vmax:0};}
function quadFit(P){if(P.length<3)return null;let S=[0,0,0,0,0],T=[0,0,0];P.forEach(p=>{let tp=1;for(let i=0;i<5;i++){S[i]+=tp;if(i<3)T[i]+=p.y*tp;tp*=p.t;}});
  const M=[[S[0],S[1],S[2],T[0]],[S[1],S[2],S[3],T[1]],[S[2],S[3],S[4],T[2]]];
  for(let c=0;c<3;c++){let piv=c;for(let r=c+1;r<3;r++)if(Math.abs(M[r][c])>Math.abs(M[piv][c]))piv=r;[M[c],M[piv]]=[M[piv],M[c]];if(Math.abs(M[c][c])<1e-12)return null;
    for(let r=0;r<3;r++){if(r===c)continue;const f=M[r][c]/M[c][c];for(let k=c;k<4;k++)M[r][k]-=f*M[c][k];}}
  return {c0:M[0][3]/M[0][0],c1:M[1][3]/M[1][1],c2:M[2][3]/M[2][2]};}
function markNow(sim){const A=sim.st.A;if(A.land!==null&&A.rest)return;sim.st.marks.push({t:sim.t,y:A.y});if(sim.st.marks.length>12)sim.st.marks.shift();}
function landText(b){return b.land===null?'Still falling':('t = '+b.land.toFixed(2)+' s');}
function predicted(sim){const g=PLANETS[sim.p.planet].g,h=sim.p.h,v0=sim.p.v0||0;return (v0+Math.sqrt(v0*v0+2*g*h))/g;}

const SIM={
  id:'freefall',hash:'freefall',apUnit:1,order:2,tab:'Free fall and bouncing',kind:'Virtual lab',next:['projectile','linearize'],
  card:'Drop a bowling ball, a tennis ball and a feather side by side, with or without air, on Earth, the Moon or Mars. Bounce them too.',
  title:'Free fall and bouncing',
  lede:{bio:'Do heavy things fall faster? Drop two objects side by side, then turn the air on and off to find out what really slows things down.',
        honors:'Measure g with a stopwatch, strobe images and position marks. Compare t = √(2h/g) with the measured fall time, and watch a bounce lose height.',
        ap:'Model drag as a force that grows with v², find terminal velocity where drag balances weight, and fit position data with y = y₀ + v₀t − ½gt².'},
  scale:'Heights 1–50 m (a 15-storey building). g = 9.8 m/s² on Earth, 1.62 on the Moon, 3.71 on Mars. Strobe images every 0.1 s.',
  timeScale:1,dtMax:0.002,window:10,unit:'s',timeLabel:'Time',sampleDt:0.05,
  controls:[
    {id:'objA',label:'Object A (left)',type:'select',def:'bowling',lvl:'bio',options:Object.keys(OBJ).map(k=>({v:k,l:OBJ[k].n})),onChange(sim){BioLab.reset(sim);}},
    {id:'objB',label:'Object B (right)',type:'select',def:'tennis',lvl:'bio',options:Object.keys(OBJ).map(k=>({v:k,l:OBJ[k].n})),onChange(sim){BioLab.reset(sim);}},
    {id:'h',label:'Drop height',type:'range',min:1,max:50,step:1,def:10,unit:' m',lvl:'bio',onChange(sim){BioLab.reset(sim);}},
    {id:'air',label:'Air resistance',type:'toggle',def:false,lvl:'bio',onChange(sim){BioLab.reset(sim);}},
    {id:'planet',label:'Where',type:'seg',def:'earth',lvl:'bio',options:[{v:'earth',l:'Earth'},{v:'moon',l:'Moon'},{v:'mars',l:'Mars'}],onChange(sim){BioLab.reset(sim);}},
    {id:'bounce',label:'Bouncy floor',type:'toggle',def:false,lvl:'bio',help:'Balls bounce; paper and feathers do not',onChange(sim){BioLab.reset(sim);}},
    {id:'e',label:'Bounciness e (rebound ÷ impact speed)',type:'range',min:0.3,max:0.95,step:0.05,def:0.8,lvl:'honors',onChange(sim){BioLab.reset(sim);}},
    {id:'v0',label:'Launch velocity (up is +)',type:'range',min:-10,max:15,step:1,def:0,unit:' m/s',lvl:'honors',onChange(sim){BioLab.reset(sim);}},
    {id:'strobe',label:'Strobe images',type:'toggle',def:true,lvl:'bio'}
  ],
  actions:[
    {id:'again',label:'Drop again',primary:true,run(sim){BioLab.reset(sim);}},
    {id:'mark',label:'Mark A’s position now',lvl:'honors',run(sim){markNow(sim);}}
  ],
  init(sim){return {A:body(sim,sim.p.objA),B:body(sim,sim.p.objB),H:[],marks:[],top:topH(sim),lastRec:-1,lastGhost:0};},
  step(sim,dt){const s=sim.st,p=sim.p,g=PLANETS[p.planet].g,air=airOn(sim),t=sim.t;
    [s.A,s.B].forEach(b=>{if(b.rest)return;const vt=vtOf(sim,b.key),o=OBJ[b.key];let a=-g;if(air)a-=Math.sign(b.v)*g*(b.v/vt)*(b.v/vt);
      const v1=b.v+a*dt,y1=b.y+v1*dt;if(b.bounces>0&&b.v>0&&v1<=0)b.peaks.push(b.y);
      if(y1<=0&&v1<0){const f=b.y/Math.max(1e-9,b.y-y1),tl=t+dt*clamp(f,0,1),vi=Math.abs(b.v+a*dt*clamp(f,0,1));
        if(b.land===null){b.land=tl;b.imp=vi;}
        if(p.bounce&&o.bounce&&vi*p.e>0.35){b.y=0;b.v=vi*p.e;b.bounces++;}else{b.y=0;b.v=0;b.rest=true;b.restT=tl;}}
      else{b.y=y1;b.v=v1;}b.vmax=Math.max(b.vmax,Math.abs(b.v));});
    const tn=t+dt;if(tn-s.lastRec>=0.02-1e-9){s.lastRec=tn;s.H.push({t:tn,a:s.A.y,b:s.B.y,va:s.A.v,vb:s.B.v});if(s.H.length>4000)s.H.shift();}
    if(Math.floor(tn/0.1+1e-6)>Math.floor(t/0.1+1e-6)){[s.A,s.B].forEach(b=>{if(!b.rest&&b.ghosts.length<240)b.ghosts.push({y:b.y});});}},
  metrics:[
    {id:'yA',label:'A height',unit:'m',min:0,max:50,d:2,get:s=>s.st.A.y},
    {id:'vA',label:'A speed',unit:'m/s',min:0,max:35,d:2,get:s=>Math.abs(s.st.A.v)},
    {id:'landA',label:'A hit the ground at',unit:'',text:true,get:s=>landText(s.st.A)},
    {id:'landB',label:'B hit the ground at',unit:'',text:true,get:s=>landText(s.st.B)},
    {id:'impA',label:'A impact speed',unit:'',text:true,lvl:'honors',get:s=>s.st.A.imp===null?'—':s.st.A.imp.toFixed(1)+' m/s'},
    {id:'pred',label:'Predicted fall time (no air)',unit:'',text:true,lvl:'honors',noTrial:true,get:s=>((s.p.v0||0)===0?'√(2h/g) = ':'quadratic formula: ')+predicted(s).toFixed(2)+' s'},
    {id:'vt',label:'Terminal speed of A',unit:'',text:true,lvl:'ap',noTrial:true,get:s=>airOn(s)?vtOf(s,s.p.objA).toFixed(1)+' m/s':'None: no air'},
    {id:'ratio',label:'Bounce height ratio',unit:'',text:true,lvl:'honors',get:s=>{const A=s.st.A;if(!s.p.bounce||!OBJ[A.key].bounce)return 'Bouncy floor off';if(!A.peaks.length)return 'Waiting for a bounce';const r=A.peaks[0]/s.p.h;return r.toFixed(2)+' of the drop (e² = '+(s.p.e*s.p.e).toFixed(2)+')';}}
  ],
  graphs:[{id:'hgt',label:'Height vs time',custom:true},{id:'vel',label:'Velocity vs time',custom:true},{id:'marks',label:'Your marks and best-fit curve',custom:true,lvl:'honors'}],
  defaultGraph:'hgt',
  plot(sim,ctx,box,id){const s=sim.st,H=s.H,hon=atLeast('honors'),g=PLANETS[sim.p.planet].g;const b2=Object.assign({},box,{T:34,H:box.H-(34-box.T)});
    const tmax=Math.max(3,Math.ceil((H.length?H[H.length-1].t:0)+0.5));
    if(id==='marks'){const M=s.marks;const ax=axes(ctx,b2,{xmin:0,xmax:Math.max(2,...M.map(m=>m.t+0.3)),ymin:0,ymax:s.top,xl:'Time t (s)',yl:'Height of A (m)'});
      if(!M.length){txt(ctx,'Press “Mark A’s position now” (or click the stage) while A falls.',box.cw/2,box.T+box.H/2,{s:14,c:PAL['muted'],a:'center'});return;}
      const F=quadFit(M);if(F){ctx.strokeStyle=PAL['g-line'];ctx.lineWidth=2;ctx.beginPath();const tm=Math.max(...M.map(m=>m.t))+0.3;for(let t=0;t<=tm;t+=0.02){const y=F.c0+F.c1*t+F.c2*t*t;t?ctx.lineTo(ax.X(t),ax.Y(clamp(y,0,s.top))):ctx.moveTo(ax.X(t),ax.Y(clamp(y,0,s.top)));}ctx.stroke();
        txt(ctx,'y = '+F.c0.toFixed(2)+(F.c1<0?' − ':' + ')+Math.abs(F.c1).toFixed(2)+'t − '+Math.abs(F.c2).toFixed(2)+'t²   →   g ≈ 2 × '+Math.abs(F.c2).toFixed(2)+' = '+(-2*F.c2).toFixed(2)+' m/s²',b2.L+8,18,{s:13,w:600,c:PAL['fg']});}
      else txt(ctx,'Mark at least 3 positions to fit a curve.',b2.L+8,18,{s:13,c:PAL['muted']});
      M.forEach(m=>{ctx.fillStyle=PAL['s4'];ctx.beginPath();ctx.arc(ax.X(m.t),ax.Y(m.y),5,0,6.29);ctx.fill();});return;}
    const vel=id==='vel';let ymin=0,ymax=s.top,yl='Height (m)';
    if(vel){const vm=Math.max(2,...H.map(r=>Math.max(Math.abs(r.va),Math.abs(r.vb))))*1.1;ymin=hon?-vm:0;ymax=hon?Math.max(2,(sim.p.v0||0)*1.2,sim.p.bounce?vm:2):vm;yl=hon?'Velocity v (m/s, up +)':'Speed (m/s)';}
    const ax=axes(ctx,b2,{xmin:0,xmax:tmax,ymin,ymax,xl:'Time t (s)',yl});
    if(vel&&!airOn(sim)&&hon){ctx.strokeStyle=PAL['line'];ctx.setLineDash([5,4]);ctx.lineWidth=1.5;ctx.beginPath();const v0=sim.p.v0||0;ctx.moveTo(ax.X(0),ax.Y(clamp(v0,ymin,ymax)));ctx.lineTo(ax.X(tmax),ax.Y(clamp(v0-g*tmax,ymin,ymax)));ctx.stroke();ctx.setLineDash([]);
      txt(ctx,'slope = −g = −'+g.toFixed(2)+' m/s²',b2.L+b2.W-8,b2.T+14,{s:12,c:PAL['muted'],a:'right'});}
    if(vel&&airOn(sim)&&atLeast('ap')){const vt=vtOf(sim,sim.p.objA);if(vt<ymax*1.5){ctx.strokeStyle=CA;ctx.globalAlpha=.5;ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(clamp(hon?-vt:vt,ymin,ymax)));ctx.lineTo(ax.X(tmax),ax.Y(clamp(hon?-vt:vt,ymin,ymax)));ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;txt(ctx,'A’s terminal speed',ax.X(tmax)-6,ax.Y(clamp(hon?-vt:vt,ymin,ymax))-6,{s:12,c:CA,a:'right'});}}
    [['a','va',CA],['b','vb',CB]].forEach(([k,kv,c])=>{if(!H.length)return;ctx.strokeStyle=c;ctx.lineWidth=2.5;ctx.beginPath();H.forEach((r,i)=>{const val=vel?(hon?r[kv]:Math.abs(r[kv])):r[k];const X=ax.X(r.t),Y=ax.Y(clamp(val,ymin,ymax));i?ctx.lineTo(X,Y):ctx.moveTo(X,Y);});ctx.stroke();});
    legend(ctx,box.L+8,16,[{label:'A: '+OBJ[sim.p.objA].n,color:CA},{label:'B: '+OBJ[sim.p.objB].n,color:CB}]);},
  narrate(sim){const s=sim.st,p=sim.p,A=s.A,B=s.B,nA=OBJ[p.objA].n.toLowerCase(),nB=OBJ[p.objB].n.toLowerCase(),air=airOn(sim),hon=atLeast('honors'),ap=atLeast('ap'),g=PLANETS[p.planet].g;
    if(sim.t<0.02)return 'Press <b>Play</b> to release both objects from '+p.h+' m on '+PLANETS[p.planet].n+(air?', with air.':', with no air.');
    if(A.land!==null&&B.land!==null){const d=Math.abs(A.land-B.land);
      if(d<0.02)return '<b>They landed together</b> at '+A.land.toFixed(2)+' s. '+(air?'Both are heavy and compact enough that air barely slows them over this drop.':'With no air, every object falls with the same acceleration, '+g.toFixed(2)+' m/s², whatever its mass.')+(hon&&!(p.v0)?' Prediction √(2h/g) = '+predicted(sim).toFixed(2)+' s.':'');
      const first=A.land<B.land?nA:nB;return 'The <b>'+first+'</b> landed '+d.toFixed(2)+' s sooner. Air pushes back harder on light, spread-out objects'+(ap?': drag grows with v² until it equals the weight, at terminal speed.':'.');}
    if(p.bounce&&A.bounces>0)return 'Bounce '+A.bounces+'. Each rebound leaves at '+Math.round(p.e*100)+'% of the impact speed, so each peak is only '+(p.e*p.e).toFixed(2)+' as high as the last'+(hon?' (height ∝ v², so the ratio is e²).':'.');
    const fast=Math.abs(A.v);return 'Falling for '+sim.t.toFixed(2)+' s. A is moving at '+fast.toFixed(1)+' m/s'+(air&&ap?' (terminal speed '+vtOf(sim,p.objA).toFixed(1)+' m/s)':'')+'. '+(p.strobe?'The strobe images get farther apart: it gains speed every tenth of a second.':'');},
  tour:[
    {title:'The drop tower',text:'Two objects wait on a ledge 10 m up. The ruler on the tower measures height above the ground.',focus:[20,30,470,400],pause:true,setup(sim){BioLab.setValues(sim,{objA:'bowling',objB:'tennis',h:10,air:false,planet:'earth',bounce:false,v0:0});}},
    {title:'Release both',text:{bio:'A bowling ball and a tennis ball are released together, with no air. Watch which lands first.',honors:'Mass 7 kg vs 0.06 kg. Without air the only force is gravity, and a = F/m = mg/m = g for both.'},focus:[180,30,260,400],speed:0.5},
    {title:'Strobe images',text:'The faint circles show where each ball was every 0.1 s. The gaps grow: the balls speed up as they fall.',focus:[180,30,260,400],pause:true},
    {title:'Stopwatch and landing times',text:'The stopwatch stops for each object when it hits the ground. Both landed together.',focus:[500,30,290,400],pause:true},
    {title:'Now add air',text:{bio:'A feather against a tennis ball, with air. The feather drifts down slowly: air resistance, not mass, makes the difference.',ap:'The feather reaches its terminal speed, about 0.6 m/s, almost at once: drag balances its tiny weight.'},focus:[180,30,260,400],speed:1,setup(sim){BioLab.setValues(sim,{objA:'tennis',objB:'feather',air:true,h:3});}},
    {title:'On the Moon',text:'No air on the Moon. An Apollo 15 astronaut dropped a hammer and a feather here: they landed together.',focus:[20,30,470,400],speed:1,setup(sim){BioLab.setValues(sim,{objA:'bowling',objB:'feather',air:true,planet:'moon',h:3});}},
    {lvl:'honors',title:'Bounce',text:'Turn on the bouncy floor. Each rebound loses speed, so each peak is lower. With e = 0.8, each peak is 0.64 of the one before.',focus:[180,30,260,400],speed:1,setup(sim){BioLab.setValues(sim,{objA:'tennis',objB:'bowling',planet:'earth',air:false,bounce:true,e:0.8,h:5});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{objA:'bowling',objB:'tennis',h:10,air:false,planet:'earth',bounce:false,v0:0});},
  lab:{bio:'<p><b>Question:</b> Do heavier objects fall faster?</p><ol><li>Predict, then drop the bowling ball and tennis ball with no air. Record both landing times.</li><li>Repeat with air on. Then try the feather.</li><li>Try the same drop on the Moon.</li></ol><p>Write a claim about what really controls how fast things fall.</p>',
       honors:'<p><b>Question:</b> What is g, from your own measurements?</p><ol><li>Drop A from 5, 10, 20, 30 and 40 m (no air) and record the fall times.</li><li>Calculate g = 2h/t² for each, and average.</li><li>Use Mark A’s position at least five times in one drop and read g from the best-fit curve.</li></ol>',
       ap:'<p><b>Question:</b> How does drag change a fall?</p><ol><li>With air on, drop each object from 50 m and record impact speed.</li><li>Compare each impact speed with √(2gh) and with the terminal speed.</li><li>Explain, with a free-body diagram, why the velocity graph levels off.</li></ol><p>Extension: on Mars, why is the feather’s terminal speed about 5× larger?</p>'},
  terms:[{t:'Free fall',d:'Motion under gravity alone, with no air resistance.'},{t:'Air resistance',d:'The push of air against a moving object. It grows as the object goes faster.'},{t:'Acceleration due to gravity (g)',d:'9.8 m/s² on Earth: every second, a falling object gains 9.8 m/s of speed.'},
    {lvl:'honors',t:'Coefficient of restitution (e)',d:'Rebound speed ÷ impact speed. Each bounce peak is e² of the last.'},{lvl:'honors',t:'Strobe image',d:'A picture taken at equal time intervals, showing how far an object moves each interval.'},
    {lvl:'ap',t:'Terminal velocity',d:'The speed at which drag equals weight, so the net force and acceleration are zero.'},{lvl:'ap',t:'Quadratic drag',d:'F = ½ρC_dAv²: drag force grows with the square of speed.'}],
  about:'<p>Up is positive. Each object has a terminal speed on Earth: bowling ball 80 m/s, tennis ball 23 m/s, crumpled paper 5 m/s, feather 0.6 m/s. Drag is quadratic, a = −g − sign(v)·g·(v/v_t)². On Mars the air is about 60× thinner, which multiplies v_t by about 4.8. The Moon has no air. Bounces reverse the velocity and multiply it by e; a ball rebounding slower than 0.35 m/s comes to rest. Paper and feathers do not bounce. The integration step is 2 ms, with landing times interpolated inside the step.</p>',
  challenges:[
    {lvl:'bio',baseline:{objA:'bowling',objB:'tennis',h:10,air:false,planet:'earth',bounce:false,v0:0},watch:'hgt',reveal:2,q:'With no air, a 7 kg bowling ball and a 60 g tennis ball are dropped from 10 m. Which lands first?',choices:['They land together','The bowling ball','The tennis ball'],correct:0,explain:'With no air, gravity gives every object the same acceleration. Mass makes no difference: both land at 1.43 s.'},
    {lvl:'bio',baseline:{objA:'tennis',objB:'feather',h:2,air:true,planet:'earth',bounce:false,v0:0},watch:'hgt',reveal:4,q:'With air, a tennis ball and a feather are dropped from 2 m. What happens?',choices:['The ball lands seconds before the feather','They land together','The feather lands first'],correct:0,explain:'Air pushes on the feather nearly as hard as gravity pulls it, so it drifts down at about 0.6 m/s and takes over 3 s. The ball barely notices the air over 2 m.'},
    {lvl:'bio',baseline:{objA:'bowling',objB:'feather',h:2,air:true,planet:'moon',bounce:false,v0:0},watch:'hgt',reveal:2,q:'Now on the Moon, which has no air: bowling ball and feather from 2 m. Which lands first?',choices:['They land together','The bowling ball','The feather'],correct:0,explain:'Without air nothing slows the feather, so both fall with the Moon’s g = 1.62 m/s² and land together after 1.57 s. Apollo 15 did this with a hammer and a feather.'},
    {lvl:'honors',baseline:{objA:'bowling',objB:'tennis',h:20,air:false,planet:'earth',bounce:false,v0:0},watch:'hgt',reveal:2.5,q:'A ball is dropped from 20 m with no air. How long does it take to land?',choices:['About 2.0 s','About 4.1 s','About 1.0 s'],correct:0,explain:'t = √(2h/g) = √(40 / 9.8) = 2.02 s. Doubling the height from 10 m only multiplies the time by √2.'},
    {lvl:'honors',baseline:{objA:'bowling',objB:'tennis',h:10,air:false,planet:'moon',bounce:false,v0:0},watch:'hgt',reveal:4,q:'On Earth a 10 m drop takes 1.43 s. How long does the same drop take on the Moon (g = 1.62 m/s²)?',choices:['About 2.5× longer','About 6× longer','The same time'],correct:0,explain:'t ∝ 1/√g. g is 6× smaller, so the time is √6 ≈ 2.5× longer: 3.51 s.'},
    {lvl:'ap',baseline:{objA:'tennis',objB:'bowling',h:5,air:false,planet:'earth',bounce:true,e:0.8,v0:0},watch:'hgt',reveal:3,q:'A ball dropped from 5 m rebounds at 0.8 of its impact speed. How high is the first bounce?',choices:['3.2 m','4.0 m','5.0 m'],correct:0,explain:'Height ∝ v², so the peak is e²h = 0.64 × 5 = 3.2 m, not 0.8 × 5. That is why the height ratio reveals e².'},
    {lvl:'ap',baseline:{objA:'tennis',objB:'bowling',h:50,air:true,planet:'earth',bounce:false,v0:0},watch:'vel',reveal:5,q:'A tennis ball (terminal speed 23 m/s) falls 50 m through air. Without air it would hit at 31 m/s. What is its real impact speed?',choices:['About 21 m/s, just under terminal speed','31 m/s, same as without air','More than 23 m/s'],correct:0,explain:'Drag grows with v², so the ball approaches 23 m/s but never passes it: v = v_t√(1 − e^(−2gh/v_t²)) ≈ 21 m/s. The bowling ball (v_t = 80 m/s) hits at about 30 m/s.'},
    {lvl:'ap',baseline:{objA:'bowling',objB:'tennis',h:10,air:false,planet:'earth',bounce:false,v0:10},watch:'hgt',reveal:3.5,q:'Both balls are thrown straight up at 10 m/s from the 10 m ledge. When do they hit the ground?',choices:['About 2.8 s','About 1.4 s','About 2.0 s'],correct:0,explain:'0 = 10 + 10t − 4.9t² gives t = (10 + √(100 + 196)) / 9.8 = 2.78 s. The throw adds a 2.04 s round trip up and back to the ledge, then a faster fall.'}
  ],
  onClick(sim,x,y){if(x<490)markNow(sim);},
  thumbSetup(sim){sim.p.objB='feather';sim.p.air=true;sim.p.h=8;sim.st=SIM.init(sim);},thumbFrames:20,
  draw(sim,ctx,vdt,k,t){const s=sim.st,p=sim.p,PL=PLANETS[p.planet],air=airOn(sim),hon=atLeast('honors');k=Math.min(k,1.3);
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    const tint={earth:'rgba(110,170,225,.22)',moon:'rgba(20,24,40,.55)',mars:'rgba(215,120,70,.25)'}[p.planet];
    ctx.fillStyle=tint;rr(ctx,10,10,480,430,12);ctx.fill();
    if(p.planet==='moon'){ctx.fillStyle='rgba(255,255,255,.7)';for(let i=0;i<40;i++){const sx=(i*137.5)%470+15,sy=(i*61.3)%300+16;ctx.fillRect(sx,sy,1.5,1.5);}}
    const ground={earth:'#6b8f4e',moon:'#8a8a8a',mars:'#a5532e'}[p.planet];ctx.fillStyle=ground;ctx.fillRect(10,GY,480,30);
    const ppm=(GY-TOPY)/s.top,Y=y=>GY-y*ppm;
    // tower and ruler
    const ledgeY=Y(p.h);ctx.fillStyle=PAL['cv-soft'];ctx.globalAlpha=.35;ctx.fillRect(60,ledgeY,70,GY-ledgeY);ctx.globalAlpha=1;
    ctx.fillStyle=PAL['cv-ink'];ctx.fillRect(56,ledgeY-4,78,5);ctx.fillRect(176,ledgeY-4,244,5);txt(ctx,'release '+p.h+' m',420,ledgeY-9,{s:11*k,c:PAL['cv-ink'],a:'right'});
    const steps=[0.5,1,2,5,10,20];let st=steps.find(v=>v*ppm>=26)||20;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(150.5,Y(0));ctx.lineTo(150.5,Y(s.top*0.98));ctx.stroke();
    for(let m=0;m<=s.top+1e-9;m+=st/2){const yy=Math.round(Y(m))+.5,major=Math.abs(m/st-Math.round(m/st))<1e-6;ctx.beginPath();ctx.moveTo(150,yy);ctx.lineTo(major?162:157,yy);ctx.stroke();if(major)txt(ctx,(st<1?m.toFixed(1):m)+' m',146,yy,{s:10*k,a:'right',b:'middle',c:PAL['cv-ink']});}
    if(air){ctx.strokeStyle='rgba(120,140,170,.35)';ctx.lineWidth=1.2;for(let i=0;i<9;i++){const wy=60+i*40,ph=(t*30+i*53)%420;ctx.beginPath();ctx.moveTo(180+ph*0.6,wy);ctx.quadraticCurveTo(200+ph*0.6,wy-5,220+ph*0.6,wy);ctx.stroke();}}
    // objects with strobe ghosts
    const drawObj=(b,X,col,label)=>{const o=OBJ[b.key];
      if(p.strobe){ctx.globalAlpha=.32;b.ghosts.forEach(gh=>{ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(X,Y(gh.y)-o.r,o.r*0.8,0,6.29);ctx.stroke();});ctx.globalAlpha=1;}
      const cy=Y(b.y)-o.r,sway=b.key==='feather'&&air&&!b.rest?Math.sin(t*3+X)*10:0,cx=X+sway;
      if(b.key==='bowling'){const gr=ctx.createRadialGradient(cx-5,cy-6,2,cx,cy,o.r);gr.addColorStop(0,'#5a5f73');gr.addColorStop(1,'#1d2030');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(cx,cy,o.r,0,6.29);ctx.fill();ctx.fillStyle='#0b0c12';[[4,-6],[9,-2],[3,1]].forEach(([dx,dy])=>{ctx.beginPath();ctx.arc(cx+dx,cy+dy,2.2,0,6.29);ctx.fill();});}
      else if(b.key==='tennis'){ctx.fillStyle='#c9e03a';ctx.beginPath();ctx.arc(cx,cy,o.r,0,6.29);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx-o.r,cy,o.r*0.8,-0.9,0.9);ctx.stroke();ctx.beginPath();ctx.arc(cx+o.r,cy,o.r*0.8,Math.PI-0.9,Math.PI+0.9);ctx.stroke();}
      else if(b.key==='paper'){ctx.fillStyle='#e9e6dc';ctx.beginPath();for(let i=0;i<10;i++){const an=i/10*6.28,rr2=o.r*(0.8+0.25*((i*7)%3)/2);ctx.lineTo(cx+rr2*Math.cos(an),cy+rr2*Math.sin(an));}ctx.closePath();ctx.fill();ctx.strokeStyle='#a9a491';ctx.lineWidth=1;ctx.stroke();}
      else{ctx.save();ctx.translate(cx,cy);ctx.rotate(-0.5+sway*0.03);ctx.strokeStyle='#8a7a5c';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-o.r,0);ctx.lineTo(o.r+4,0);ctx.stroke();ctx.fillStyle='rgba(235,228,210,.95)';ctx.beginPath();ctx.moveTo(-o.r+3,0);ctx.quadraticCurveTo(0,-9,o.r+2,-1);ctx.quadraticCurveTo(0,8,-o.r+3,0);ctx.fill();ctx.strokeStyle='rgba(150,135,105,.6)';ctx.lineWidth=.8;for(let i=-2;i<=3;i++){ctx.beginPath();ctx.moveTo(i*3,0);ctx.lineTo(i*3+4,-5);ctx.moveTo(i*3,0);ctx.lineTo(i*3+4,5);ctx.stroke();}ctx.restore();}
      // velocity arrow
      if(Math.abs(b.v)>0.2&&hon){const len=clamp(b.v*2.2,-70,70);ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=2.5;const ax0=X+o.r+10;ctx.beginPath();ctx.moveTo(ax0,cy);ctx.lineTo(ax0,cy-len);ctx.stroke();const d=Math.sign(len);ctx.beginPath();ctx.moveTo(ax0,cy-len-d*6);ctx.lineTo(ax0-5,cy-len+d*2);ctx.lineTo(ax0+5,cy-len+d*2);ctx.closePath();ctx.fill();}
      pill(ctx,label,X,GY+16,col,'#fff',11*k);};
    drawObj(s.A,XA,CA,'A');drawObj(s.B,XB,CB,'B');
    s.marks.forEach(m=>{const yy=Y(m.y)-OBJ[s.A.key].r;ctx.strokeStyle=PAL['s4'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(XA-34,yy);ctx.lineTo(XA-22,yy);ctx.stroke();});
    // right-hand instrument panel
    ctx.fillStyle=PAL['card'];rr(ctx,505,10,285,430,12);ctx.fill();
    txt(ctx,PL.n.toUpperCase()+' · g = '+PL.g.toFixed(2)+' m/s² · '+(air?'air':'no air'),520,32,{s:12*k,w:700,c:PAL['muted']});
    ctx.fillStyle=PAL['cv-bg2'];rr(ctx,520,46,255,58,10);ctx.fill();const done=s.A.rest&&s.B.rest,clock=done?Math.max(s.A.land,s.B.land,s.A.restT||0,s.B.restT||0):Math.max(0,sim.t);txt(ctx,'⏱ '+clock.toFixed(2)+' s',647,76,{s:26*k,w:700,a:'center',b:'middle',c:PAL['fg']});
    [[s.A,CA,'A',OBJ[p.objA].n],[s.B,CB,'B',OBJ[p.objB].n]].forEach(([b,col,l,n],i)=>{const y0=124+i*118;ctx.fillStyle=col;rr(ctx,520,y0,24,24,6);ctx.fill();txt(ctx,l,532,y0+13,{s:13,w:700,c:'#fff',a:'center',b:'middle'});txt(ctx,n,552,y0+13,{s:14*k,w:700,c:PAL['fg'],b:'middle'});
      txt(ctx,b.land===null?'falling…':'landed at '+b.land.toFixed(2)+' s',552,y0+38,{s:13*k,c:b.land===null?PAL['muted']:PAL['fg'],w:b.land===null?400:600});
      const sp=Math.abs(b.v),vmax=Math.max(10,Math.sqrt(2*PL.g*s.top)*1.05);ctx.fillStyle=PAL['line'];rr(ctx,552,y0+52,200,10,5);ctx.fill();ctx.fillStyle=col;rr(ctx,552,y0+52,Math.max(4,200*clamp(sp/vmax,0,1)),10,5);ctx.fill();
      txt(ctx,'speed '+sp.toFixed(1)+' m/s',552,y0+80,{s:12*k,c:PAL['muted']});
      if(air&&atLeast('ap')){const vt=vtOf(sim,b.key);if(vt<vmax){const xx=552+200*vt/vmax;ctx.strokeStyle=PAL['fg'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(xx,y0+48);ctx.lineTo(xx,y0+66);ctx.stroke();txt(ctx,'v_t '+vt.toFixed(1),Math.min(xx,730),y0+80,{s:11*k,c:PAL['fg'],a:'center'});}}
      if(p.bounce&&OBJ[b.key].bounce&&b.peaks.length&&hon)txt(ctx,'peaks: '+b.peaks.slice(0,3).map(v=>v.toFixed(2)).join(', ')+' m',552,y0+98,{s:12*k,c:PAL['fg']});});
    if(s.A.land!==null&&s.B.land!==null){const d=Math.abs(s.A.land-s.B.land);pill(ctx,d<0.02?'Landed together':(s.A.land<s.B.land?'A':'B')+' first by '+d.toFixed(2)+' s',647,382,d<0.02?PAL['s3']:PAL['rj'],'#fff',13*k);}
    else if(hon&&!air)txt(ctx,'Prediction (no air): '+predicted(sim).toFixed(2)+' s',647,382,{s:12*k,a:'center',c:PAL['muted']});
    if(hon)txt(ctx,'Click the tower to mark A’s position',647,420,{s:11*k,a:'center',c:PAL['muted']});
  }
};
BioLab.register(SIM);
})();
