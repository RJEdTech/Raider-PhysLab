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
function accOf(sim,b){if(b.rest)return 0;const g=PLANETS[sim.p.planet].g;if(!airOn(sim))return -g;const vt=vtOf(sim,b.key);return -g-Math.sign(b.v)*g*(b.v/vt)*(b.v/vt);}
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
    {id:'v0',label:'Throw velocity (up is +)',type:'range',min:-10,max:15,step:1,def:0,unit:' m/s',lvl:'bio',help:'0 drops it. A positive number throws it straight up first; negative throws it down.',onChange(sim){BioLab.reset(sim);}},
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
    {id:'vsA',label:'A velocity (up is +)',unit:'m/s',min:-35,max:15,d:2,get:s=>s.st.A.v},
    {id:'aA',label:'A acceleration (up is +)',unit:'m/s²',min:-12,max:12,d:2,get:s=>accOf(s,s.st.A)},
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
    if(vel){const vm=Math.max(2,...H.map(r=>Math.max(Math.abs(r.va),Math.abs(r.vb))))*1.1;ymin=-vm;ymax=Math.max(2,(sim.p.v0||0)*1.2,sim.p.bounce?vm:2);yl='Velocity v (m/s, up +)';}
    const ax=axes(ctx,b2,{xmin:0,xmax:tmax,ymin,ymax,xl:'Time t (s)',yl});
    if(vel&&!airOn(sim)){ctx.strokeStyle=PAL['line'];ctx.setLineDash([5,4]);ctx.lineWidth=1.5;ctx.beginPath();const v0=sim.p.v0||0;ctx.moveTo(ax.X(0),ax.Y(clamp(v0,ymin,ymax)));ctx.lineTo(ax.X(tmax),ax.Y(clamp(v0-g*tmax,ymin,ymax)));ctx.stroke();ctx.setLineDash([]);
      txt(ctx,'slope = −g = −'+g.toFixed(2)+' m/s²',b2.L+b2.W-8,b2.T+14,{s:12,c:PAL['muted'],a:'right'});}
    if(vel&&airOn(sim)&&atLeast('ap')){const vt=vtOf(sim,sim.p.objA);if(vt<ymax*1.5){ctx.strokeStyle=CA;ctx.globalAlpha=.5;ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(clamp(-vt,ymin,ymax)));ctx.lineTo(ax.X(tmax),ax.Y(clamp(-vt,ymin,ymax)));ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;txt(ctx,'A’s terminal speed',ax.X(tmax)-6,ax.Y(clamp(-vt,ymin,ymax))-6,{s:12,c:CA,a:'right'});}}
    [['a','va',CA],['b','vb',CB]].forEach(([k,kv,c])=>{if(!H.length)return;ctx.strokeStyle=c;ctx.lineWidth=2.5;ctx.beginPath();H.forEach((r,i)=>{const val=vel?r[kv]:r[k];const X=ax.X(r.t),Y=ax.Y(clamp(val,ymin,ymax));i?ctx.lineTo(X,Y):ctx.moveTo(X,Y);});ctx.stroke();});
    legend(ctx,box.L+8,16,[{label:'A: '+OBJ[sim.p.objA].n,color:CA},{label:'B: '+OBJ[sim.p.objB].n,color:CB}]);},
  narrate(sim){const s=sim.st,p=sim.p,A=s.A,B=s.B,nA=OBJ[p.objA].n.toLowerCase(),nB=OBJ[p.objB].n.toLowerCase(),air=airOn(sim),hon=atLeast('honors'),ap=atLeast('ap'),g=PLANETS[p.planet].g;
    if(sim.t<0.02)return 'Press <b>Play</b> to release both objects from '+p.h+' m on '+PLANETS[p.planet].n+(air?', with air.':', with no air.');
    if(A.land!==null&&B.land!==null){const d=Math.abs(A.land-B.land);
      if(d<0.02)return '<b>They landed together</b> at '+A.land.toFixed(2)+' s. '+(air?'Both are heavy and compact enough that air barely slows them over this drop.':'With no air, every object falls with the same acceleration, '+g.toFixed(2)+' m/s², whatever its mass.')+(hon&&!(p.v0)?' Prediction √(2h/g) = '+predicted(sim).toFixed(2)+' s.':'');
      const first=A.land<B.land?nA:nB;return 'The <b>'+first+'</b> landed '+d.toFixed(2)+' s sooner. Air pushes back harder on light, spread-out objects'+(ap?': drag grows with v² until it equals the weight, at terminal speed.':'.');}
    if(p.bounce&&A.bounces>0)return 'Bounce '+A.bounces+'. Each rebound leaves at '+Math.round(p.e*100)+'% of the impact speed, so each peak is only '+(p.e*p.e).toFixed(2)+' as high as the last'+(hon?' (height ∝ v², so the ratio is e²).':'.');
    if((p.v0||0)>0&&A.land===null&&!air){const g2=g.toFixed(1);if(A.v>0.25)return '<b>A is rising at '+A.v.toFixed(1)+' m/s</b> and slowing by '+g2+' m/s every second. Its acceleration is '+g2+' m/s² <b>downward</b>, even on the way up.';
      if(A.v>-0.25)return '<b>Top of the flight.</b> The velocity is zero for an instant, but the acceleration is still '+g2+' m/s² downward. That is what turns it around.';
      return '<b>A is falling at '+(-A.v).toFixed(1)+' m/s</b> and speeding up by '+g2+' m/s every second. Same acceleration as on the way up: '+g2+' m/s² downward.';}
    const fast=Math.abs(A.v);return 'Falling for '+sim.t.toFixed(2)+' s. A is moving at '+fast.toFixed(1)+' m/s'+(air&&ap?' (terminal speed '+vtOf(sim,p.objA).toFixed(1)+' m/s)':'')+'. '+(p.strobe?'The strobe images get farther apart: it gains speed every tenth of a second.':'');},
  tour:[
    {title:'The drop tower',text:'Two objects wait on a ledge 10 m up. The ruler on the tower measures height above the ground.',focus:[20,30,470,400],pause:true,setup(sim){BioLab.setValues(sim,{objA:'bowling',objB:'tennis',h:10,air:false,planet:'earth',bounce:false,v0:0});}},
    {title:'Release both',text:{bio:'A bowling ball and a tennis ball are released together, with no air. Watch which lands first.',honors:'Mass 7 kg vs 0.06 kg. Without air the only force is gravity, and a = F/m = mg/m = g for both.'},focus:[180,30,260,400],speed:0.5},
    {title:'Strobe images',text:'The faint circles show where each ball was every 0.1 s. The gaps grow: the balls speed up as they fall.',focus:[180,30,260,400],pause:true},
    {title:'Stopwatch and landing times',text:'The stopwatch stops for each object when it hits the ground. Both landed together.',focus:[500,30,290,400],pause:true},
    {title:'Now add air',text:{bio:'A feather against a tennis ball, with air. The feather drifts down slowly: air resistance, not mass, makes the difference.',ap:'The feather reaches its terminal speed, about 0.6 m/s, almost at once: drag balances its tiny weight.'},focus:[180,30,260,400],speed:1,setup(sim){BioLab.setValues(sim,{objA:'tennis',objB:'feather',air:true,h:3});}},
    {title:'On the Moon',text:'No air on the Moon. An Apollo 15 astronaut dropped a hammer and a feather here: they landed together.',focus:[20,30,470,400],speed:1,setup(sim){BioLab.setValues(sim,{objA:'bowling',objB:'feather',air:true,planet:'moon',h:3});}},
    {title:'Throw it up',text:{bio:'Now both balls are thrown straight up at 10 m/s. They slow down by 9.8 m/s every second, stop for an instant at the top, then speed up on the way down. The acceleration is 9.8 m/s² downward the whole time, even at the top.',honors:'Thrown up at 10 m/s, no air. The velocity graph is one straight line with slope −9.8 m/s². It crosses zero at the top, at t = 10 ÷ 9.8 = 1.02 s, and the ball passes the ledge again at 2.04 s moving 10 m/s downward.'},focus:[180,30,260,400],speed:0.5,setup(sim){BioLab.setValues(sim,{objA:'bowling',objB:'tennis',planet:'earth',air:false,bounce:false,h:10,v0:10});BioLab.reset(sim);}},
    {lvl:'honors',title:'Bounce',text:'Turn on the bouncy floor. Each rebound loses speed, so each peak is lower. With e = 0.8, each peak is 0.64 of the one before.',focus:[180,30,260,400],speed:1,setup(sim){BioLab.setValues(sim,{objA:'tennis',objB:'bowling',planet:'earth',air:false,bounce:true,e:0.8,h:5,v0:0});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{objA:'bowling',objB:'tennis',h:10,air:false,planet:'earth',bounce:false,v0:0});},
  lab:{bio:'<p><b>Question:</b> Do heavier objects fall faster?</p><ol><li>Predict, then drop the bowling ball and tennis ball with no air. Record both landing times.</li><li>Repeat with air on. Then try the feather.</li><li>Try the same drop on the Moon.</li></ol><p>Write a claim about what really controls how fast things fall.</p>',
       honors:'<p><b>Question:</b> What is g, from your own measurements?</p><ol><li>Drop A from 5, 10, 20, 30 and 40 m (no air) and record the fall times.</li><li>Calculate g = 2h/t² for each, and average.</li><li>Use Mark A’s position at least five times in one drop and read g from the best-fit curve.</li></ol>',
       ap:'<p><b>Question:</b> How does drag change a fall?</p><ol><li>With air on, drop each object from 50 m and record impact speed.</li><li>Compare each impact speed with √(2gh) and with the terminal speed.</li><li>Explain, with a free-body diagram, why the velocity graph levels off.</li></ol><p>Extension: on Mars, why is the feather’s terminal speed about 5× larger?</p>'},
  terms:[{t:'Free fall',d:'Motion under gravity alone, with no air resistance.'},{t:'Air resistance',d:'The push of air against a moving object. It grows as the object goes faster.'},{t:'Acceleration due to gravity (g)',d:'9.8 m/s² on Earth: every second, a falling object gains 9.8 m/s of speed.'},{t:'Velocity vs. speed',d:'Speed is how fast. Velocity is how fast and which way: here up is +, so a falling ball has negative velocity.'},
    {lvl:'honors',t:'Coefficient of restitution (e)',d:'Rebound speed ÷ impact speed. Each bounce peak is e² of the last.'},{lvl:'honors',t:'Strobe image',d:'A picture taken at equal time intervals, showing how far an object moves each interval.'},
    {lvl:'ap',t:'Terminal velocity',d:'The speed at which drag equals weight, so the net force and acceleration are zero.'},{lvl:'ap',t:'Quadratic drag',d:'F = ½ρC_dAv²: drag force grows with the square of speed.'}],
  about:'<p>Up is positive. Each object has a terminal speed on Earth: bowling ball 80 m/s, tennis ball 23 m/s, crumpled paper 5 m/s, feather 0.6 m/s. Drag is quadratic, a = −g − sign(v)·g·(v/v_t)². On Mars the air is about 60× thinner, which multiplies v_t by about 4.8. The Moon has no air. Bounces reverse the velocity and multiply it by e; a ball rebounding slower than 0.35 m/s comes to rest. Paper and feathers do not bounce. The integration step is 2 ms, with landing times interpolated inside the step.</p>',
  challenges:[
    {lvl:'bio',baseline:{objA:'bowling',objB:'tennis',h:10,air:false,planet:'earth',bounce:false,v0:0},watch:'hgt',reveal:2,q:'With no air, a 7 kg bowling ball and a 60 g tennis ball are dropped from 10 m. Which lands first?',choices:['They land together','The bowling ball','The tennis ball'],correct:0,explain:'With no air, gravity gives every object the same acceleration. Mass makes no difference: both land at 1.43 s.'},
    {lvl:'bio',baseline:{objA:'tennis',objB:'feather',h:2,air:true,planet:'earth',bounce:false,v0:0},watch:'hgt',reveal:4,q:'With air, a tennis ball and a feather are dropped from 2 m. What happens?',choices:['The ball lands seconds before the feather','They land together','The feather lands first'],correct:0,explain:'Air pushes on the feather nearly as hard as gravity pulls it, so it drifts down at about 0.6 m/s and takes over 3 s. The ball barely notices the air over 2 m.'},
    {lvl:'bio',baseline:{objA:'bowling',objB:'feather',h:2,air:true,planet:'moon',bounce:false,v0:0},watch:'hgt',reveal:2,q:'Now on the Moon, which has no air: bowling ball and feather from 2 m. Which lands first?',choices:['They land together','The bowling ball','The feather'],correct:0,explain:'Without air nothing slows the feather, so both fall with the Moon’s g = 1.62 m/s² and land together after 1.57 s. Apollo 15 did this with a hammer and a feather.'},
    {lvl:'bio',baseline:{objA:'bowling',objB:'tennis',h:10,air:false,planet:'earth',bounce:false,v0:10},watch:'vel',reveal:1.3,q:'A ball is thrown straight up at 10 m/s. At the very top of its flight, what is its acceleration?',choices:['Zero, because it stopped for an instant','9.8 m/s² downward','9.8 m/s² upward'],correct:1,explain:'At the top the velocity is zero, but gravity is still pulling. The acceleration is 9.8 m/s² downward the whole flight, which is why the velocity graph keeps the same downward slope right through zero.'},
    {lvl:'bio',baseline:{objA:'bowling',objB:'tennis',h:10,air:false,planet:'earth',bounce:false,v0:10},watch:'vel',reveal:2.2,q:'Thrown up at 10 m/s from the ledge, with no air. When the ball falls back past the ledge, how fast is it moving?',choices:['Slower than 10 m/s','10 m/s, downward','Faster than 10 m/s'],correct:1,explain:'It loses 9.8 m/s every second going up and gains 9.8 m/s every second coming down, for the same time each way (1.02 s). So it passes the ledge at 10 m/s, now moving down: v = −10 m/s.'},
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
/* ---------- Virtual lab (Mr. Colella, Physics Unit 1): Free Fall Labs #1 and #2 with GUESS ----------
   #1 Reaction time: a partner drops a meter stick at a random moment 1 to 3 s after "Get ready"; the student presses Catch.
      The real time between the drop and the press is the student's own reaction time t, and the stick falls d = ½gt² (g = 9.8 m/s²).
   #2 Balcony: a partner counts down and drops a ball from a balcony (height 4.6 to 5.6 m, different for each student).
      The student starts and stops a stopwatch by hand, so the recorded times include the student's own reaction errors.
   Air resistance is left out: for a tennis ball falling 5 m it changes the fall time by under 1%. */
const RB=window.RJBench,GG=9.8,PXCM=3.4;
function ffRec(sim){const R=RB.rec(sim);if(!R.ff)R.ff={rd:[],bw:[]};return R.ff;}
const ffH=sim=>{const R=sim.vlab?sim.vlab.rng(41):RB.rng(41);return Math.round((4.6+R())*100)/100;};
const FFB={
  init(sim){return {ph:'idle',wait:0,t0:0,cm:null,msg:'',bp:'idle',bt0:0,tc:0,w:RB.watchNew(),H:ffH(sim),land:null};},
  step(sim,dt){const b=sim.st.B,now=performance.now();
    if(b.ph==='wait'&&now>=b.wait){b.ph='fall';b.t0=now;}
    if(b.ph==='fall'){const tt=(now-b.t0)/1000;if(0.5*GG*tt*tt>1.0){b.ph='missed';b.msg='Missed! The stick fell right through. Press Get ready to try again.';}}
    if(b.bp==='count'&&now>=b.bt0){b.bp='fall';}
    if(b.bp==='fall'){const tt=(now-b.bt0)/1000;if(0.5*GG*tt*tt>=b.H){b.bp='landed';b.land=now;}}},
  draw(sim,ctx,vdt,k,t){const b=sim.st.B,K=Math.min(k,1.3);ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    if(sim.p.ffPart==='balcony')return ffDrawBalcony(sim,ctx,b,K,k);
    const now=performance.now(),fy=360;let d=0;if(b.ph==='fall')d=0.5*GG*Math.pow((now-b.t0)/1000,2)*100;else if(b.ph==='caught')d=b.cm;else if(b.ph==='missed')d=110;
    const top=fy-100*PXCM+d*PXCM,X=230;
    // partner's hand at the top (opens on the drop)
    ctx.fillStyle='#c99a74';rr(ctx,X-34,22,68,26,10);ctx.fill();if(b.ph==='idle'||b.ph==='wait'){ctx.fillRect(X-8,44,16,16);}
    txt(ctx,'partner',X+44,38,{s:12*K,c:PAL['cv-soft']});
    // the meter stick (0 cm at the bottom, between your fingers)
    if(b.ph!=='missed'){ctx.fillStyle='#e9d9a6';ctx.fillRect(X-16,top,32,100*PXCM);ctx.strokeStyle='#8a7a4a';ctx.lineWidth=1;ctx.strokeRect(X-16,top,32,100*PXCM);
      for(let c=0;c<=100;c++){const y=top+(100-c)*PXCM;ctx.beginPath();ctx.moveTo(X-16,y);ctx.lineTo(X-16+(c%10===0?14:c%5===0?9:5),y);ctx.stroke();if(c%10===0&&c<100)txt(ctx,String(c),X+12,y+4,{s:11*K,a:'right',c:'#3a3326'});}}
    // your fingers
    ctx.fillStyle='#d8a77e';rr(ctx,X-62,fy-6,40,14,6);ctx.fill();rr(ctx,X+22,fy-6,40,14,6);ctx.fill();if(b.ph==='caught'){rr(ctx,X-24,fy-6,48,14,4);ctx.fill();}
    txt(ctx,'your fingers',X-70,fy+28,{s:12*K,a:'right',c:PAL['cv-soft']});
    // the magnifier (read the stick at the top edge of your fingers)
    RB.panel(ctx,420,40,340,250);txt(ctx,'Magnified: the stick at your fingers',436,62,{s:13*K,w:700,c:PAL['fg']});
    const mx=520,my=170,S=26;ctx.save();ctx.beginPath();ctx.rect(436,74,308,200);ctx.clip();ctx.fillStyle='#e9d9a6';ctx.fillRect(mx-50,74,100,200);
    if(b.ph==='caught'||b.ph==='idle'||b.ph==='wait'){const c0=b.ph==='caught'?b.cm:0;ctx.strokeStyle='#5a4c2a';
      for(let mm=Math.floor((c0-4)*10);mm<=Math.ceil((c0+4)*10);mm++){if(mm<0||mm>1000)continue;const y=my-(mm/10-c0)*S;ctx.lineWidth=mm%10===0?2:1;ctx.beginPath();ctx.moveTo(mx-50,y);ctx.lineTo(mx-50+(mm%10===0?36:mm%5===0?24:14),y);ctx.stroke();
        if(mm%10===0)txt(ctx,String(mm/10),mx+44,y+6,{s:17,w:700,a:'right',c:'#2a2418'});}}
    else{txt(ctx,'(moving)',mx,my,{s:15,a:'center',c:'#5a4c2a'});}
    ctx.restore();ctx.strokeStyle='#d9573b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(436,my);ctx.lineTo(744,my);ctx.stroke();txt(ctx,'top of your fingers',740,my-6,{s:12*K,a:'right',c:'#d9573b'});
    txt(ctx,'Each small line is 1 mm. Read to 0.1 cm.',436,290-8,{s:12*K,c:PAL['cv-soft']});
    const st=b.ph==='wait'?'Watch the stick…':b.ph==='fall'?'CATCH!':b.ph==='caught'?'Caught! Read the stick in the magnifier.':b.ph==='missed'?'':'Press Get ready.';
    txt(ctx,st,420,330,{s:15*K,w:700,c:b.ph==='fall'?'#d9573b':PAL['fg']});if(b.msg)txt(ctx,b.msg,420,356,{s:13*K,c:PAL['cv-soft']});},
  narrate(sim){const b=sim.st.B;if(sim.p.ffPart==='balcony'){if(b.bp==='count')return 'Your partner is counting down. Be ready to start the stopwatch the moment the ball is let go.';if(b.bp==='fall')return 'The ball is falling: stop the watch the moment it hits the ground.';
      return 'Press <b>Drop the ball</b>. Start the stopwatch when the ball is let go and stop it when the ball hits the ground. The stopwatch is in your hands, so your reaction time is part of every measurement.';}
    if(b.ph==='caught')return 'You caught the stick after it fell <b>'+b.cm.toFixed(1)+' cm</b>, so your reaction time was √(2d/g). Record the reading, then press <b>Get ready</b> for the next trial.';
    return 'Your partner holds the meter stick with 0 cm between your fingers. Press <b>Get ready</b>, then press <b>Catch!</b> (or tap the stage, or press Space on the Catch button) the instant the stick starts to fall.';},
  onClick(sim,x,y){if(sim.p.ffPart==='ruler')ffCatch(sim);},
  read(sim){const b=sim.st.B;return {ph:b.ph,cm:b.cm,H:b.H,watch:RB.watchShown(b.w),bp:b.bp};}};
function ffDrawBalcony(sim,ctx,b,K,k){const now=performance.now(),gy=410,ppm=(gy-80)/b.H,bx=402;
  ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(40,40,200,gy-40);ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;for(let y=60;y<gy;y+=30){ctx.beginPath();ctx.moveTo(40,y);ctx.lineTo(240,y);ctx.stroke();}
  const by=gy-b.H*ppm;ctx.fillStyle=PAL['cv-ink'];ctx.fillRect(240,by,150,8);for(let x=250;x<390;x+=14)ctx.fillRect(x,by-28,3,28);ctx.fillRect(240,by-30,150,4);
  txt(ctx,'balcony',250,by-38,{s:12*K,c:PAL['cv-soft']});
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(20,gy,760,6);
  // the ball
  let y=by-12;if(b.bp==='fall'){const tt=(now-b.bt0)/1000;y=by-12+0.5*GG*tt*tt*ppm;}else if(b.bp==='landed')y=gy-10;
  ctx.fillStyle='#c8d84a';ctx.beginPath();ctx.arc(bx,Math.min(y,gy-10),10,0,6.29);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(bx-4,Math.min(y,gy-10),7,-1,1);ctx.stroke();
  if(b.bp==='landed'&&now-b.land<400){ctx.strokeStyle='#d9573b';ctx.lineWidth=2;for(let i=0;i<5;i++){const a=Math.PI+i*Math.PI/4;ctx.beginPath();ctx.moveTo(bx+16*Math.cos(a),gy-4+12*Math.sin(a));ctx.lineTo(bx+28*Math.cos(a),gy-4+22*Math.sin(a));ctx.stroke();}}
  if(b.bp==='count'){const n=Math.ceil((b.bt0-now)/1000);txt(ctx,n>0?String(n):'',bx+40,by-40,{s:28,w:700,c:'#d9573b'});}else if(b.bp==='fall'&&now-b.bt0<600)txt(ctx,'Drop!',bx+30,by-40,{s:24,w:700,c:'#d9573b'});
  // tape measure (for the extension)
  ctx.strokeStyle='#e0b43c';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(436,by);ctx.lineTo(436,gy);ctx.stroke();txt(ctx,'tape measure',446,(by+gy)/2,{s:12*K,c:PAL['cv-soft']});
  RB.lcd(ctx,550,60,200,62,'TAPE: BALCONY HEIGHT',b.H.toFixed(2)+' m',k,24);
  RB.drawWatch(ctx,550,150,k,b.w,'YOUR STOPWATCH');
  const T=ffRec(sim).bw;txt(ctx,'Your stopwatch times:',550,236,{s:12*K,w:700,c:PAL['fg']});txt(ctx,(T.length?T.slice(-4).map(x=>x.toFixed(2)).join(', ')+' s':'none yet'),550,256,{s:12*K,c:PAL['fg']});}
function ffCatch(sim){const b=RB.B(sim,'free-fall-guess');if(!b)return;const now=performance.now();
  if(b.ph==='wait'){b.ph='idle';b.msg='Too early! You moved before the stick dropped. Press Get ready again.';return;}
  if(b.ph!=='fall')return;const rt=(now-b.t0)/1000,d=0.5*GG*rt*rt;if(d>1.0){b.ph='missed';b.msg='Missed! The stick fell right through. Press Get ready to try again.';return;}
  b.cm=Math.round(d*1000)/10;b.ph='caught';b.msg='';const R=ffRec(sim);R.rd.push(b.cm);if(R.rd.length>30)R.rd.shift();if(sim.vlab)BioLab.vlab.save(sim);}
function ffReady(sim){const b=RB.B(sim,'free-fall-guess');if(!b)return;b.ph='wait';b.msg='';b.cm=null;b.wait=performance.now()+1000+2000*Math.random();BioLab.play(sim);}
function ffDrop(sim){const b=RB.B(sim,'free-fall-guess');if(!b)return;b.bp='count';b.bt0=performance.now()+3000;b.land=null;BioLab.play(sim);}
function ffWatch(sim){const b=RB.B(sim,'free-fall-guess');if(!b)return;const v=RB.watchToggle(b.w);if(v!==null&&v>0){const R=ffRec(sim);R.bw.push(v);if(R.bw.length>30)R.bw.shift();if(sim.vlab)BioLab.vlab.save(sim);}BioLab.play(sim);}
const TR=['t1','t2','t3'],TRL=['Trial 1','Trial 2','Trial 3'];
const ffCm=(sim,rv,v)=>{const R=ffRec(sim).rd;if(!R.length)return 'Catch the stick on the bench first, then read it at the top of your fingers.';return R.some(c=>Math.abs(c-v)<=0.15)?null:'That isn’t one of your catches. Your recent catches: '+R.slice(-4).map(c=>c.toFixed(1)).join(', ')+' cm. Read the magnified stick to 0.1 cm.';};
const ffM=(sim,rv,v)=>{const r=TR.indexOf(String(rv)),c=sim.vlab.val('rt','cm',r);if(!Number.isFinite(c))return 'Record the reading in centimeters first.';return Math.abs(v-c/100)<=0.0006?null:'1 m = 100 cm, so divide the centimeters by 100.';};
const ffSec=(sim,rv,v)=>{const R=ffRec(sim).bw;if(!R.length)return 'Time a drop on the bench first.';return R.some(x=>Math.abs(x-v)<=0.006)?null:'That isn’t one of your stopwatch times. Your recent times: '+R.slice(-4).map(x=>x.toFixed(2)).join(', ')+' s.';};
const avg3=(V,tb,c)=>{const a=[0,1,2].map(r=>V.val(tb,c,r));return a.every(Number.isFinite)?(a[0]+a[1]+a[2])/3:NaN;};
const LAB_FF={id:'free-fall-guess',title:'Free Fall Labs #1 and #2 with GUESS',course:'Physics',teachers:'Colella',level:'bio',
  source:{label:'Free Fall Labs (2) (Canvas)',href:'https://rjhs.instructure.com/courses/16601/assignments/614631'},
  purpose:'<p><b>Lab #1:</b> How long does it take for a meter stick to fall the distance you measure? <b>Lab #2:</b> How far does an object fall in the free-fall time you measure? Collect your own data, then use your average as the GIVEN in a GUESS problem.</p>',
  background:'<p>An object in free fall speeds up at g = 9.8 m/s² (we ignore air resistance). Dropped from rest, it falls a distance <b>d = ½gt²</b> in a time t, so the time to fall a distance d is <b>t = √(2d/g)</b>.</p>'+
    '<p><b>GUESS</b> is how you set up every problem: <b>G</b>ivens, <b>U</b>nknown, <b>E</b>quation, <b>S</b>ubstitute, <b>S</b>olve (with units).</p>'+
    '<p><b>About the virtual bench.</b> In Lab #1 your partner drops the stick at a random moment, and the bench times <b>your real reaction</b> when you press Catch. Keep your eyes on the stick and try not to guess. In Lab #2 you start and stop the stopwatch yourself, so your reactions are part of every time, just as in class. Each student gets a slightly different balcony height. The tape measure is there for the extension question.</p>',
  materials:['Meter stick','A partner','A ball and a balcony','Stopwatch','Tape measure'],
  setup(sim){},
  controls:['ffPart','ff-ready','ff-catch','ff-drop','ff-watch'],
  steps:[
    {title:'Lab #1: practice',text:'<p>Choose <b>Lab #1: meter stick</b>. Your partner holds the stick with the 0 cm mark between your open fingers. Press <b>Get ready</b>, then press <b>Catch!</b> the instant the stick starts to fall. You can also tap the stage, or keep the Catch button selected and press Space. Practice once or twice.</p>',setup(sim){BioLab.setValues(sim,{ffPart:'ruler'});}},
    {title:'Lab #1: three trials',text:'<p>Do three trials. After each catch, read the stick at the top of your fingers in the magnifier, to 0.1 cm. Record each reading in centimeters and in meters in Table 1, then work out the average in meters.</p>',
      setup(sim){BioLab.setValues(sim,{ffPart:'ruler'});},done:sim=>TR.every((x,r)=>sim.vlab.raw('c:rt:m:'+r).trim()!=='')&&sim.vlab.raw('k:avg1').trim()!=='',doneHint:'Fill in Table 1 and the average distance.'},
    {title:'Lab #1: GUESS',text:'<p>Use your average distance as the GIVEN: how long does it take for a meter stick to fall that far? Fill in G, U, E, S, S in question 1 and record your answer in the calculations.</p>'},
    {title:'Lab #2: three trials',text:'<p>Choose <b>Lab #2: balcony</b>. Press <b>Drop the ball</b>. Your partner counts down from 3 and lets go. Press <b>Start / stop stopwatch</b> when the ball is let go and again when it hits the ground. Do three trials and record each time in Table 2, then work out the average time.</p>',
      setup(sim){BioLab.setValues(sim,{ffPart:'balcony'});},done:sim=>TR.every((x,r)=>sim.vlab.raw('c:bt:s:'+r).trim()!=='')&&sim.vlab.raw('k:avg2').trim()!=='',doneHint:'Fill in Table 2 and the average time.'},
    {title:'Lab #2: GUESS',text:'<p>Use your average time as the GIVEN: how far does an object fall in that time? Fill in G, U, E, S, S in question 2 and record your answer in the calculations. Then try the extension.</p>'}],
  tables:[{id:'rt',title:'Table 1 (Lab #1): reaction time data (1 m = 100 cm)',cols:[{id:'tr',label:'Trial',rows:TR,rowLabels:TRL},{id:'cm',label:'Distance the stick fell (cm)',input:'number',check:ffCm},{id:'m',label:'Distance (m)',input:'number',check:ffM}]},
    {id:'bt',title:'Table 2 (Lab #2): fall time from the balcony',cols:[{id:'tr',label:'Trial',rows:TR,rowLabels:TRL},{id:'s',label:'Fall time (s)',input:'number',check:ffSec}]}],
  calcs:[
    {id:'avg1',label:'Lab #1: average distance the stick fell',unit:'m',input:'number',check:(sim,v,V)=>{const a=avg3(V,'rt','m');return !Number.isFinite(a)?'Fill in all three trials in meters first.':Math.abs(v-a)<=0.0006?null:'Add your three distances in meters and divide by 3.';}},
    {id:'tg',label:'Lab #1 GUESS answer: time for the stick to fall your average distance',unit:'s',input:'number',check:(sim,v,V)=>{const d=vN(V.raw('k:avg1'));return !Number.isFinite(d)?'Work out your average distance first.':RB.rel(v,Math.sqrt(2*d/GG),0.012)?null:'From d = ½gt², t = √(2d/g). Use your average distance and g = 9.8 m/s².';}},
    {id:'avg2',label:'Lab #2: average fall time',unit:'s',input:'number',check:(sim,v,V)=>{const a=avg3(V,'bt','s');return !Number.isFinite(a)?'Fill in all three trials first.':Math.abs(v-a)<=0.006?null:'Add your three times and divide by 3.';}},
    {id:'dg',label:'Lab #2 GUESS answer: how far an object falls in your average time',unit:'m',input:'number',check:(sim,v,V)=>{const t=vN(V.raw('k:avg2'));return !Number.isFinite(t)?'Work out your average time first.':RB.rel(v,0.5*GG*t*t,0.012)?null:'d = ½gt². Use your average time and g = 9.8 m/s².';}},
    {id:'pd',label:'Extension: percent difference between your GUESS answer and the tape-measure height, |d − h| ÷ h × 100',unit:'%',input:'number',check:(sim,v,V)=>{const d=vN(V.raw('k:dg')),b=RB.B(sim),h=b?b.H:ffH(sim);return !Number.isFinite(d)?'Work out your Lab #2 GUESS answer first.':Math.abs(v-Math.abs(d-h)/h*100)<=0.6?null:'Read the tape measure on the Lab #2 bench, then use |d − h| ÷ h × 100.';}}],
  questions:[{id:'g1',n:'1',q:'<p><b>Lab #1 GUESS.</b> How long does it take for a meter stick to fall your average distance?</p>',fields:RB.GUESS},
    {id:'g2',n:'2',q:'<p><b>Lab #2 GUESS.</b> How far does an object fall if the amount of time it free falls is your average time?</p>',fields:RB.GUESS},
    {id:'x1',n:'Ext',q:'<p>Compare your Lab #2 GUESS answer with the tape-measure height. Your Lab #1 answer is your reaction time. How could reaction time make a hand-timed fall time too long or too short? Why does averaging three trials help?</p>'}]};
function vN(s){s=String(s||'').trim().replace(/,/,'.');return /^[-+]?(\d+\.?\d*|\.\d+)$/.test(s)?parseFloat(s):NaN;}
SIM.controls.push({id:'ffPart',label:'Which lab',type:'seg',def:'ruler',vlab:true,noTrial:true,options:[{v:'ruler',l:'Lab #1: meter stick'},{v:'balcony',l:'Lab #2: balcony'}]});
SIM.actions.push({id:'ff-ready',label:'Get ready',vlab:true,enabled:s=>{const b=RB.B(s,'free-fall-guess');return !!b&&s.p.ffPart==='ruler'&&b.ph!=='wait'&&b.ph!=='fall';},run(sim){ffReady(sim);}},
  {id:'ff-catch',label:'Catch!',primary:true,vlab:true,enabled:s=>{const b=RB.B(s,'free-fall-guess');return !!b&&s.p.ffPart==='ruler';},run(sim){ffCatch(sim);}},
  {id:'ff-drop',label:'Drop the ball',vlab:true,enabled:s=>{const b=RB.B(s,'free-fall-guess');return !!b&&s.p.ffPart==='balcony'&&b.bp!=='count'&&b.bp!=='fall';},run(sim){ffDrop(sim);}},
  {id:'ff-watch',label:'Start / stop stopwatch',primary:true,vlab:true,enabled:s=>{const b=RB.B(s,'free-fall-guess');return !!b&&s.p.ffPart==='balcony';},run(sim){ffWatch(sim);}});
SIM.labs=(SIM.labs||[]).concat([LAB_FF]);
RB.attach(SIM,{'free-fall-guess':FFB});

BioLab.register(SIM);
})();
