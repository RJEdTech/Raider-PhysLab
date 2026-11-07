(function(){
'use strict';
const {clamp,lerp,rng,randn,rr,txt,pill,atLeast,PAL,FONT,axes,legend}=BioLab.h;

/* ======================================================================
   Locating a sound by timing (time difference of arrival, TDOA).
   Microphones on rooftops record when a loud impulse arrives. Each pair's
   arrival-time difference fixes the difference in distance, d_i − d_j = vΔt,
   which puts the source on one branch of a hyperbola. A least-squares fit
   over all pairs finds where the hyperbolas cross.
   Speed of sound v ≈ 331 + 0.6 T (T in °C): 343 m/s at 20 °C.
   Then: a located sound is not a confirmed gunshot (base rates).
   ====================================================================== */
const MW=1040,MH=860;                       // map size in meters (1 px = 2 m)
const PX=x=>10+x/2, PY=y=>440-y/2;          // map meters (x east, y north) to canvas px
const MX=px=>(px-10)*2, MY=py=>(440-py)*2;
const NAMES=['A','B','C','D'];
const LAYOUT={
  spread:[[120,120],[920,140],[900,740],[140,720]],
  bunched:[[420,360],[580,360],[580,500],[420,500]],
  line:[[120,430],[390,430],[660,430],[920,430]]};
const vOf=T=>331+0.6*T;
const ANIM=0.5;                             // animation runs at half speed
const PAIRC=['s2','s3','s5'];

function mics(sim){const p=sim.p,n=p.nmic==='3'?3:4;const L=(p.layout==='custom'&&sim.cust)?sim.cust:LAYOUT[p.layout==='custom'?'spread':p.layout];return L.slice(0,n).map(a=>a.slice());}
function noiseOf(seed,i){return randn(rng(seed*977+i*131+7));}
/* arrival times (s) as the system records them */
function arrivals(sim){const p=sim.p,M=mics(sim),v=vOf(p.temp),seed=sim.seed||1;
  return M.map((m,i)=>{const d=Math.hypot(m[0]-p.sx,m[1]-p.sy);let t=d/v;if(p.echo&&i===1)t+=p.echoX/v;t+=p.jit/1000*noiseOf(seed,i);return t;});}
function vUsed(p){return p.useT?vOf(p.temp):343;}
function cost(M,t,v,x,y){let J=0;const d=M.map(m=>Math.hypot(m[0]-x,m[1]-y));for(let i=0;i<M.length;i++)for(let j=i+1;j<M.length;j++){const r=(t[i]-t[j])-(d[i]-d[j])/v;J+=r*r;}return J;}
let SOLVE={key:null,val:null};
function solve(sim){const p=sim.p,M=mics(sim),t=arrivals(sim),v=vUsed(p);const key=JSON.stringify([M,t,v]);if(SOLVE.key===key)return SOLVE.val;
  let best={J:Infinity,x:0,y:0};
  for(let x=5;x<=MW;x+=10)for(let y=5;y<=MH;y+=10){const J=cost(M,t,v,x,y);if(J<best.J)best={J,x,y};}
  for(const [step,span] of [[1,12],[0.1,1.2],[0.01,0.12]]){const b0=Object.assign({},best);
    for(let x=b0.x-span;x<=b0.x+span+1e-9;x+=step)for(let y=b0.y-span;y<=b0.y+span+1e-9;y+=step){const J=cost(M,t,v,x,y);if(J<best.J)best={J,x,y};}}
  const err=Math.hypot(best.x-p.sx,best.y-p.sy);
  SOLVE={key,val:{x:best.x,y:best.y,err,t,M,v}};return SOLVE.val;}
/* hyperbola segments for pair (0,j): |P−M0| − |P−Mj| = v (t0 − tj), traced by marching squares */
let HYP={key:null,val:null};
function hyperbolas(sim){const s=solve(sim),key=JSON.stringify([s.M,s.t,s.v]);if(HYP.key===key)return HYP.val;
  const out=[],C=6,nx=Math.ceil(520/C),ny=Math.ceil(430/C);
  for(let j=1;j<s.M.length;j++){const D=s.v*(s.t[0]-s.t[j]),A=s.M[0],B=s.M[j];const f=(px,py)=>{const x=MX(px),y=MY(py);return Math.hypot(x-A[0],y-A[1])-Math.hypot(x-B[0],y-B[1])-D;};
    const vals=[];for(let i=0;i<=nx;i++){vals[i]=[];for(let k=0;k<=ny;k++)vals[i][k]=f(10+i*C,10+k*C);}
    const segs=[];
    for(let i=0;i<nx;i++)for(let k=0;k<ny;k++){const x0=10+i*C,y0=10+k*C;const c=[[x0,y0,vals[i][k]],[x0+C,y0,vals[i+1][k]],[x0+C,y0+C,vals[i+1][k+1]],[x0,y0+C,vals[i][k+1]]];
      const pts=[];for(let e=0;e<4;e++){const a=c[e],b=c[(e+1)%4];if((a[2]<0)!==(b[2]<0)){const u=a[2]/(a[2]-b[2]);pts.push([lerp(a[0],b[0],u),lerp(a[1],b[1],u)]);}}
      if(pts.length>=2)segs.push([pts[0],pts[1]]);if(pts.length===4)segs.push([pts[2],pts[3]]);}
    out.push(segs);}
  HYP={key,val:out};return out;}
/* base rates */
function alerts(p){const gun=p.nImp*p.gShare/100,other=p.nImp-gun,tA=gun*p.sens/100,fA=other*p.fpr/100,all=tA+fA;return {gun,other,tA,fA,all,ppv:all>0?100*tA/all:0};}
const KIND={gun:'gunshot',firework:'firework',backfire:'car backfire'};
const fmtI=n=>Math.round(n).toLocaleString('en-US');

/* ---------- Your turn: distance difference = speed × time difference, for mics A and B ----------
   Uses the arrival times as printed (3 decimals), so the key matches what students read. */
const r3=v=>Math.round(v*1000)/1000;
function pairAB(sim){const t=arrivals(sim),t0=Math.min(...t),a=r3(t[0]-t0),b=r3(t[1]-t0),v=vUsed(sim.p);return {a,b,dt:r3(Math.abs(a-b)),v,first:a<=b?'A':'B',later:a<=b?'B':'A'};}
const YT={
  key:sim=>{const p=sim.p;return [p.sx,p.sy,p.layout,p.nmic,p.jit,p.echo,p.echoX,p.temp,p.useT,sim.seed,JSON.stringify(sim.cust||0)].join('|');},
  ans:sim=>{const q=pairAB(sim);return q.v*q.dt;},
  tol:()=>1,
  fmt:v=>v.toFixed(1),
  wrong:sim=>{const q=pairAB(sim),hi=Math.max(q.a,q.b),lo=Math.min(q.a,q.b);return [q.v*hi,q.dt>0.01?q.v/q.dt:NaN,q.v*(q.a+q.b),q.dt*1000,q.v*lo];},
  hint:'Subtract the two arrival times first, then multiply by the speed of sound.'
};
const hashS=s=>{let h=7;for(const c of String(s))h=(h*31+c.charCodeAt(0))%2147483647;return h||1;};
const ytNow=sim=>{const y=sim.st&&sim.st.yt;return y&&y.key===YT.key(sim)?y:null;};
function ytChoices(sim){const a=YT.ans(sim),t=YT.tol(sim),f=YT.fmt,seen=new Set([f(a)]),out=[a];
  const add=v=>{if(out.length<4&&Number.isFinite(v)&&v>0&&!seen.has(f(v))&&Math.abs(v-a)>t*1.5){seen.add(f(v));out.push(v);}};
  YT.wrong(sim).forEach(add);[1.25,0.8,1.5,0.6,2,0.5].forEach(m=>add(a*m));[50,100,150].forEach(d=>add(a+d));
  const r=rng(hashS(YT.key(sim)));for(let i=out.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
function ytSubmit(sim,v){let y=ytNow(sim);if(!y){y={key:YT.key(sim),tries:[],done:false,ok:false};sim.st.yt=y;}if(y.done)return;
  y.tries.push(v);if(Math.abs(v-YT.ans(sim))<=YT.tol(sim)+1e-9){y.ok=true;y.done=true;}else if(y.tries.length>=2)y.done=true;
  if(y.done)sim.st.revealed=true;}
function ytClick(sim,x,y){const R=sim.vis&&sim.vis.ytR;if(!R)return false;for(const r of R){if(x>=r[0]&&x<=r[0]+r[2]&&y>=r[1]-4&&y<=r[1]+r[3]+4){BioLab.setValues(sim,{ans:r[4]});ytSubmit(sim,r[4]);sim.vis.ytR=null;return true;}}return false;}
const shown=sim=>!!(sim.st&&sim.st.revealed)||sim.p.mode==='alerts';
const fresh=sim=>{sim.st.revealed=false;sim.st.yt=null;};
function wrap(ctx,s,x,y,w,o){o=o||{};const size=o.s||13,lh=o.lh||size*1.3;ctx.font=(o.w||400)+' '+size+'px '+FONT;let line='',yy=y;
  String(s).split(' ').forEach(word=>{const t=line?line+' '+word:word;if(ctx.measureText(t).width>w&&line){txt(ctx,line,x,yy,{s:size,w:o.w,c:o.c,a:o.a});yy+=lh;line=word;}else line=t;});
  if(line){txt(ctx,line,x,yy,{s:size,w:o.w,c:o.c,a:o.a});yy+=lh;}return yy;}
function ytVerdict(sim){const y=ytNow(sim);if(!y||!y.tries.length)return '';const last=y.tries[y.tries.length-1];
  return y.ok?'Your answer: '+YT.fmt(last)+' m. Correct.':'Your answer: '+YT.fmt(last)+' m. The math gives '+YT.fmt(YT.ans(sim))+' m.';}

function syncMode(sim){const ui=sim.ui;if(!ui||!ui.sec)return;const m=sim.p.mode;
  (sim.def.controls||[]).forEach(c=>{if(!c.modes)return;const e=ui.sec.querySelector('#'+sim.def.id+'-'+c.id)||ui.sec.querySelector('#'+sim.def.id+'-'+c.id+'-l');const w=e&&e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl||'bio')||!c.modes.includes(m);});
  (sim.def.metrics||[]).forEach(mm=>{const t=ui.tiles&&ui.tiles[mm.id];const w=t&&t.num&&t.num.closest('.tile');if(w)w.hidden=!atLeast(mm.lvl||'bio')||(mm.modes&&!mm.modes.includes(m));});
  const btns=[...ui.sec.querySelectorAll('.actions button')];(sim.def.actions||[]).forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!atLeast(a.lvl||'bio')||(a.modes&&!a.modes.includes(m));});}
const L=['locate'],AL=['alerts'];

function impulse(ctx,x,y,r,col){ctx.save();ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(x,y,r*0.45,0,6.29);ctx.fill();
  for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*r*0.7,y+Math.sin(a)*r*0.7);ctx.lineTo(x+Math.cos(a)*r*1.1,y+Math.sin(a)*r*1.1);ctx.stroke();}ctx.restore();}

const SIM={
  id:'shotspotter',hash:'shotspotter',yt:YT,apUnit:8,order:3,kind:'Simulation',tab:'Locating a sound by timing',prereq:['sound'],
  card:'Place microphones on a city grid, time a loud bang at each one, and find it where the hyperbolas cross. Then ask what an alert really tells you.',
  title:'Where did that bang come from? Locating sound by timing',
  lede:{bio:'The science: sound travels at a steady speed, so distance difference = speed × time difference (Physics: waves and sound). Some cities put microphones on rooftops to locate loud bangs. Compute how much closer a bang is to one microphone than another, then see where the curves cross and what timing errors and echoes do.',
        honors:'Each pair of microphones gives an arrival-time difference Δt, which fixes the difference in distance vΔt. That puts the source on a hyperbola. Test how temperature, echoes and sensor layout move the crossing point.',
        ap:'Solve for the source by least squares over every pair of arrival-time differences, find how timing error scales into location error, and compute what share of alerts are real gunfire from the base rate.'},
  scale:'A city area 1,040 m by 860 m, with blocks about 100 m on a side. Sound crosses it in about 3 s at 343 m/s; the animation runs at half speed.',
  timeless:true,animated:true,graph:false,chChange:0.5,chReveal:1.5,
  controls:[
    {id:'mode',label:'Show',type:'seg',def:'locate',lvl:'honors',noTrial:true,options:[{v:'locate',l:'Locate the bang'},{v:'alerts',l:'Alerts and base rates'}],onChange:syncMode},
    {id:'sx',modes:L,label:'Bang position, east',type:'range',min:40,max:1000,step:10,def:640,unit:' m',lvl:'bio',help:'Or click the map.'},
    {id:'sy',modes:L,label:'Bang position, north',type:'range',min:40,max:820,step:10,def:520,unit:' m',lvl:'bio'},
    {id:'layout',modes:L,label:'Microphone layout',type:'seg',def:'spread',lvl:'bio',options:[{v:'spread',l:'Spread out'},{v:'bunched',l:'Bunched together'},{v:'line',l:'In a line'},{v:'custom',l:'My own (click to place)',lvl:'honors'}]},
    {id:'nmic',modes:L,label:'Microphones',type:'seg',def:'4',lvl:'honors',options:[{v:'3',l:'3'},{v:'4',l:'4'}]},
    {id:'click',modes:L,label:'Clicking the map moves',type:'seg',def:'src',lvl:'honors',noTrial:true,options:[{v:'src',l:'The bang'},{v:'A',l:'Mic A'},{v:'B',l:'Mic B'},{v:'C',l:'Mic C'},{v:'D',l:'Mic D'}]},
    {id:'jit',modes:L,label:'Timing error at each mic',type:'range',min:0,max:10,step:0.5,def:0,unit:' ms',d:1,lvl:'bio',help:'How far off each microphone’s clock can be (one standard deviation).'},
    {id:'echo',modes:L,label:'Echo: a building blocks mic B’s direct path',type:'toggle',def:false,lvl:'bio',help:'Mic B hears the bang only after it bounces off a wall.'},
    {id:'echoX',modes:L,label:'Extra distance the echo travels',type:'range',min:10,max:200,step:5,def:60,unit:' m',lvl:'honors'},
    {id:'kind',modes:L,label:'What made the bang',type:'seg',def:'gun',lvl:'honors',options:[{v:'gun',l:'Gunshot'},{v:'firework',l:'Firework'},{v:'backfire',l:'Car backfire'}]},
    {id:'temp',modes:L,label:'Air temperature',type:'range',min:-20,max:40,step:1,def:20,unit:' °C',lvl:'honors',help:'v ≈ 331 + 0.6T m/s.'},
    {id:'useT',modes:L,label:'System corrects for temperature',type:'toggle',def:false,lvl:'ap',help:'Off: the system always assumes 343 m/s (20 °C).'},
    {id:'hyp',modes:L,label:'Show hyperbolas (after you lock in)',type:'toggle',def:true,lvl:'honors',noTrial:true},
    {id:'ans',modes:L,label:'Your answer: how much closer the bang is to the mic (A or B) that heard it first',type:'range',min:0,max:1100,step:0.5,def:100,unit:' m',d:1,lvl:'bio',noTrial:true,help:'Use the arrival times on the map panel and the speed of sound. Set your answer, then press Lock in my answer.'},
    {id:'nImp',modes:AL,label:'Loud bangs in a month',type:'range',min:200,max:3000,step:100,def:1000,unit:'',lvl:'honors'},
    {id:'gShare',modes:AL,label:'Share of bangs that are gunfire',type:'range',min:1,max:50,step:1,def:10,unit:'%',lvl:'honors',help:'The base rate. Fireworks, backfires and construction make the rest.'},
    {id:'sens',modes:AL,label:'Gunfire the system flags',type:'range',min:50,max:100,step:1,def:90,unit:'%',lvl:'honors'},
    {id:'fpr',modes:AL,label:'Other bangs wrongly flagged as gunfire',type:'range',min:0,max:20,step:0.5,def:5,unit:'%',d:1,lvl:'honors'}
  ],
  actions:[
    {id:'lock',label:'Lock in my answer',primary:true,lvl:'bio',modes:L,run(sim){ytSubmit(sim,sim.p.ans);}},
    {id:'show',label:'Show the math',lvl:'bio',modes:L,run(sim){sim.st.revealed=true;}},
    {id:'again',label:'New bang (new timing errors)',lvl:'bio',modes:L,run(sim){sim.seed=(sim.seed||1)+1;sim.st.t=0;}},
    {id:'hide',label:'New answer: hide the results',lvl:'bio',modes:L,run(sim){fresh(sim);}},
    {id:'replay',label:'Replay the sound',lvl:'bio',modes:L,run(sim){sim.st.t=0;}}
  ],
  init(sim){if(sim&&!sim.seed)sim.seed=1;return {t:0,revealed:false,yt:null};},
  step(sim,dt){sim.st.t+=dt*ANIM;if(sim.p.mode==='locate'){const s=solve(sim);const tmax=Math.max(...s.t)+1.2;if(sim.st.t>tmax)sim.st.t=0;}},
  onLevel(sim){if(!atLeast('honors')&&sim.p.mode==='alerts')BioLab.setValues(sim,{mode:'locate'});syncMode(sim);},
  metrics:[
    {id:'err',modes:L,label:'Location error',unit:'m',lvl:'bio',min:0,max:null,d:1,get:s=>shown(s)?solve(s).err:null},
    {id:'first',modes:L,label:'Heard first',unit:'',lvl:'bio',text:true,get:s=>{const t=arrivals(s);return 'Mic '+NAMES[t.indexOf(Math.min(...t))];}},
    {id:'dtAB',modes:L,label:'Mic B minus mic A arrival',unit:'ms',lvl:'bio',min:null,max:null,d:1,get:s=>{const t=arrivals(s);return 1000*(t[1]-t[0]);}},
    {id:'vtrue',modes:L,label:'Real speed of sound',unit:'m/s',lvl:'honors',min:300,max:360,d:1,get:s=>vOf(s.p.temp)},
    {id:'vused',modes:L,label:'Speed the system assumes',unit:'m/s',lvl:'ap',min:300,max:360,d:1,get:s=>vUsed(s.p)},
    {id:'dAB',modes:L,label:'Distance difference vΔt (B − A)',unit:'m',lvl:'bio',min:null,max:null,d:1,get:s=>{if(!shown(s))return null;const t=arrivals(s);return vUsed(s.p)*(t[1]-t[0]);}},
    {id:'alerts',modes:AL,label:'Gunfire alerts sent',unit:'',lvl:'honors',min:0,max:null,d:0,get:s=>alerts(s.p).all},
    {id:'trueA',modes:AL,label:'Alerts from real gunfire',unit:'',lvl:'honors',min:0,max:null,d:0,get:s=>alerts(s.p).tA},
    {id:'falseA',modes:AL,label:'Alerts that send officers to a block with no gunfire',unit:'',lvl:'honors',min:0,max:null,d:0,get:s=>alerts(s.p).fA},
    {id:'ppv',modes:AL,label:'Share of alerts that are gunfire',unit:'%',lvl:'honors',min:0,max:100,d:0,get:s=>alerts(s.p).ppv}
  ],
  narrate(sim){const p=sim.p;
    if(p.mode==='alerts'){const a=alerts(p);
      return 'Of '+fmtI(p.nImp)+' loud bangs, '+fmtI(a.gun)+' are gunfire. The system flags '+fmtI(a.tA)+' of those, plus '+fmtI(a.fA)+' other bangs it mistakes for gunfire. So <b>'+Math.round(a.ppv)+'% of alerts are real gunfire</b>. '+(a.ppv<50?'When the real thing is rare, false alerts outnumber true ones even with a small error rate.':'Lower the gunfire share and watch the false alerts take over.');}
    if(!shown(sim)){const q=pairAB(sim),y=ytNow(sim);return (y&&y.tries.length?'<b>Not quite.</b> '+YT.hint+' ':'<b>Your turn:</b> ')+'mic '+q.first+' heard the bang '+q.dt.toFixed(3)+' s before mic '+q.later+' (read the arrival times). Sound travels '+q.v.toFixed(0)+' m/s. <b>How many meters closer is the bang to mic '+q.first+'?</b> Click your answer in the panel.';}
    const s=solve(sim),e=s.err,M=s.M.length,vd=ytVerdict(sim),lead=vd?'<b>'+vd+'</b> ':'';
    if(p.echo&&e>3)return lead+'Mic B heard an <b>echo</b>: the sound bounced off a wall and traveled '+p.echoX+' m farther, so it arrived '+(1000*p.echoX/vOf(p.temp)).toFixed(0)+' ms late. The hyperbolas through mic B shift, and the fit lands <b>'+e.toFixed(0)+' m</b> away.';
    if(!p.useT&&Math.abs(p.temp-20)>=3&&e>3&&p.jit===0)return lead+'The air is '+p.temp+' °C, so sound really travels '+vOf(p.temp).toFixed(0)+' m/s, but the system assumes 343 m/s. Every distance difference comes out '+(p.temp<20?'too large':'too small')+', and the fit misses by <b>'+e.toFixed(1)+' m</b>.';
    if(p.layout==='line'&&e>20)return lead+'All the microphones sit on one line, so a point and its mirror image across that line give the same times. The fit picked the <b>mirror image</b>, '+e.toFixed(0)+' m off. Move one microphone off the line.';
    if(p.jit>0)return lead+'Each microphone’s clock is off by a few milliseconds, and 1 ms is '+(vUsed(p)/1000).toFixed(2)+' m of sound travel. The hyperbolas shift and no longer cross at one point; the best fit lands <b>'+e.toFixed(1)+' m</b> away.'+(p.layout==='bunched'?' Bunched microphones make it worse: their hyperbolas cross at shallow angles.':'');
    const what=p.kind==='gun'?'':' The math found this '+KIND[p.kind]+' just as well as it would a gunshot: timing tells you <b>where</b>, not <b>what</b>.';
    return lead+'Sound reached mic '+NAMES[s.t.indexOf(Math.min(...s.t))]+' first. Each pair of arrival times puts the bang on one curve, a <b>hyperbola</b>; '+(M-1)+' curves cross at the bang, found within '+e.toFixed(1)+' m.'+what;},
  onClick(sim,x,y){const p=sim.p;if(p.mode==='locate'&&!shown(sim)&&ytClick(sim,x,y))return;if(p.mode!=='locate'||x<10||x>530||y<10||y>440)return;const mx=clamp(Math.round(MX(x)/10)*10,40,1000),my=clamp(Math.round(MY(y)/10)*10,40,820);
    if(p.click==='src'){BioLab.setValues(sim,{sx:mx,sy:my});sim.st.t=0;fresh(sim);return;}
    const i=NAMES.indexOf(p.click);if(i<0)return;if(p.layout!=='custom'||!sim.cust)sim.cust=LAYOUT[p.layout==='custom'?'spread':p.layout].map(a=>a.slice());
    sim.cust[i]=[clamp(MX(x),5,MW-5),clamp(MY(y),5,MH-5)];if(i===3&&p.nmic==='3')BioLab.setValues(sim,{nmic:'4'});BioLab.setValues(sim,{layout:'custom'});sim.st.t=0;BioLab.refresh(sim);},
  tour:[
    {title:'A bang in the city',text:'A loud bang (the starburst) goes off somewhere in a city. Four microphones (A to D) sit on rooftops. The circle is the sound spreading out at 343 m/s.',focus:[8,8,526,436],setup(sim){sim.seed=1;BioLab.setValues(sim,{mode:'locate',layout:'spread',nmic:'4',sx:640,sy:520,jit:0,echo:false,temp:20,useT:false,hyp:true,kind:'gun'});sim.st.t=0;fresh(sim);}},
    {title:'Nearest hears it first',text:'The sound reaches the closest microphone first and the farthest one last. The list shows each arrival time, counted from the first one.',focus:[540,8,255,150]},
    {title:'Your turn',text:'Read the arrival times for mics A and B. Sound covers 343 m every second, so <b>distance difference = 343 × time difference</b>. How many meters closer is the bang to mic B than to mic A? Click your answer in the panel, or press Next to see the math.',focus:[540,8,255,436]},
    {title:'One time difference, one curve',text:{bio:'Mic B heard it 0.920 − 0.383 = 0.537 s sooner, so the bang is 343 × 0.537 = 184 m closer to B than to A. Every spot that is 184 m closer to B than to A lies on one curve, a hyperbola (blue). The bang is somewhere on it.',honors:'Δt between two mics fixes d<sub>A</sub> − d<sub>B</sub> = vΔt = 343 × 0.537 = 184 m. The set of points with a constant difference in distance from two fixed points is a hyperbola.'},focus:[8,8,526,436],setup(sim){sim.st.revealed=true;}},
    {title:'Curves cross at the bang',text:'Each pair of microphones adds a curve. Where the curves cross is the answer. With perfect timing, the X lands right on the bang.',focus:[8,8,526,436],setup(sim){sim.st.revealed=true;}},
    {title:'Timing errors',text:'Real clocks and real sounds are messy. Here the microphones are bunched on one block and each clock is off by about 3 ms. The curves no longer meet at one point, and the best fit misses by about 3 m. Press New bang later: some bangs miss by more than 15 m.',focus:[8,8,526,436],setup(sim){sim.seed=1;BioLab.setValues(sim,{layout:'bunched',jit:3});sim.st.t=0;sim.st.revealed=true;}},
    {title:'Echoes fool the timing',text:'Here a building blocks mic B, so it hears an echo that traveled 60 m farther. One late arrival drags the fit about 34 m away.',focus:[8,8,526,436],setup(sim){BioLab.setValues(sim,{layout:'spread',jit:0,echo:true,echoX:60});sim.st.t=0;sim.st.revealed=true;}},
    {lvl:'honors',title:'Where is not what',text:'A firework or a car backfire makes the same kind of sharp bang, and the timing math finds it just as well. Locating a sound does not tell you what made it.',focus:[8,8,526,436],setup(sim){BioLab.setValues(sim,{echo:false,kind:'firework'});sim.st.t=0;sim.st.revealed=true;}},
    {lvl:'honors',title:'Alerts and base rates',text:'Out of 1,000 loud bangs, suppose 100 are gunfire. Flag 90% of gunfire and wrongly flag 5% of the rest: 90 true alerts and 45 false ones, so 45 of the 135 alerts are not gunfire. The rarer gunfire is, the larger that share.',focus:[8,8,784,436],setup(sim){BioLab.setValues(sim,{mode:'alerts',nImp:1000,gShare:10,sens:90,fpr:5,kind:'gun'});}}
  ],
  onTourExit(sim){sim.seed=1;BioLab.setValues(sim,{mode:'locate',layout:'spread',nmic:'4',sx:640,sy:520,jit:0,echo:false,echoX:60,temp:20,useT:false,hyp:true,kind:'gun',nImp:1000,gShare:10,sens:90,fpr:5});sim.st.t=0;fresh(sim);},
  onChallenge(sim,ch){if(ch&&ch.set){sim.seed=1;BioLab.setValues(sim,ch.set);sim.st.t=0;sim.st.revealed=true;}},
  challenges:[
    {lvl:'bio',instant:true,set:{mode:'locate',layout:'spread',nmic:'4',sx:640,sy:520,jit:0,echo:false,temp:20,useT:false},q:'Mic C hears a bang 0.25 s before mic D. Sound travels 343 m/s. How much closer is the bang to mic C?',choices:['About 86 m','About 343 m','About 1,372 m'],correct:0,
     explain:'Distance difference = speed × time difference = 343 × 0.25 = 85.75 m, about 86 m. Dividing 343 by 0.25 gives 1,372, which has the wrong units: m/s ÷ s is not meters.'},
    {lvl:'bio',instant:true,set:{mode:'locate',layout:'bunched',nmic:'4',sx:640,sy:520,jit:3,echo:false,temp:20,useT:false},q:'Every microphone’s clock is off by about 3 ms. Which layout locates the bang better?',choices:['Spread out around the area','Bunched together on one block','It makes no difference'],correct:0,
     explain:'With the same timing errors, the bunched layout misses by about 3 m and the spread-out layout by 0.4 m. Press New bang a few times: bunched misses reach about 16 m, spread-out ones stay under 2 m. Close-together microphones give hyperbolas that cross at shallow angles, so a small timing error slides the crossing a long way.'},
    {lvl:'honors',instant:true,set:{mode:'alerts',nImp:1000,gShare:2,sens:90,fpr:5},q:'Only 2 in every 100 loud bangs in a neighborhood are gunfire. The system flags 90% of gunfire and wrongly flags 5% of other bangs. About what share of its alerts are real gunfire?',choices:['About 90%','About half','About a quarter'],correct:2,
     explain:'1,000 bangs: 20 gunshots, 18 flagged. 980 other bangs, 5% flagged = 49. So 18 of 67 alerts, about 27%, are real gunfire. When the real thing is rare, a small false-alarm rate produces most of the alerts.'},
    {lvl:'honors',instant:true,set:{mode:'locate',layout:'spread',temp:35,jit:0,echo:false},q:'On a 35 °C summer night, how fast does sound travel?',choices:['331 m/s','343 m/s','352 m/s','370 m/s'],correct:2,
     explain:'v ≈ 331 + 0.6 × 35 = 331 + 21 = 352 m/s. Warmer air carries sound faster.'},
    {lvl:'honors',instant:true,set:{mode:'locate',layout:'spread',nmic:'4',sx:640,sy:520,jit:0,echo:true,echoX:60,temp:20,useT:false},q:'Mic B hears an echo that traveled 60 m farther than the direct path. Every other mic times the bang perfectly. How far off is the located point?',choices:['Less than 1 m','Tens of meters','Exactly 60 m'],correct:1,
     explain:'The echo arrives 60 m ÷ 343 m/s ≈ 175 ms late. In this layout the fit lands about 34 m from the bang. One bad arrival bends every curve that uses mic B.'},
    {lvl:'honors',instant:true,set:{mode:'locate',layout:'spread',nmic:'4',sx:640,sy:520,jit:0,echo:false,temp:-10,useT:false},q:'It is −10 °C, but the system assumes 20 °C (343 m/s). With perfect clocks, what happens to the location?',choices:['It is still exact','It misses by a few meters','The system cannot find the bang'],correct:1,
     explain:'At −10 °C, v = 331 − 6 = 325 m/s. The system multiplies each Δt by 343 instead of 325, overstating every distance difference by about 5.5%. Here the fit misses by about 8 m.'},
    {lvl:'ap',instant:true,set:{mode:'locate',layout:'spread',jit:0,echo:false,temp:20,useT:false},q:'The arrival-time difference between two microphones is 0.200 s at 343 m/s. What is the difference in their distances from the source?',choices:['1.7 m','68.6 m','343 m','1,715 m'],correct:1,
     explain:'d<sub>A</sub> − d<sub>B</sub> = vΔt = 343 × 0.200 = 68.6 m. The source lies on the hyperbola branch with that constant difference.'},
    {lvl:'ap',instant:true,set:{mode:'locate',layout:'spread',jit:1,echo:false,temp:20,useT:false},q:'A microphone’s clock is off by 1 ms. How much does that shift its distance difference?',choices:['About 34 cm','About 3.4 m','About 34 m'],correct:0,
     explain:'343 m/s × 0.001 s = 0.343 m. Geometry can magnify that: where hyperbolas cross at shallow angles, the location error is many times larger than 34 cm.'},
    {lvl:'ap',instant:true,set:{mode:'locate',layout:'line',nmic:'4',sx:640,sy:700,jit:0,echo:false,temp:20,useT:false},q:'All four microphones stand in a straight east–west line. Why can perfect timing still give the wrong location?',choices:['Sound bends around the line','A point and its mirror image across the line give the same arrival times','Four microphones are too few'],correct:1,
     explain:'Reflecting a point across the line keeps its distance to every microphone on the line, so both points give identical arrival times. The fit cannot tell them apart. Here it picks the mirror image, about 540 m away. One microphone off the line breaks the tie.'},
    {lvl:'ap',instant:true,set:{mode:'alerts',nImp:1000,gShare:10,sens:90,fpr:5},q:'1,000 bangs, 10% gunfire, 90% of gunfire flagged, 5% of other bangs flagged. What is the probability that an alert is real gunfire (the positive predictive value)?',choices:['90%','67%','50%','10%'],correct:1,
     explain:'True alerts = 1,000 × 0.10 × 0.90 = 90. False alerts = 900 × 0.05 = 45. PPV = 90 ÷ 135 ≈ 67%.'}
  ],
  lab:{bio:'<p><b>Question:</b> What makes the location wrong?</p><ol><li>Press <b>Show the math</b>. With spread-out microphones and no errors, compute 343 × (mic A time − mic B time) by hand and check it against <b>Distance difference vΔt</b> (the tile shows B − A, so it is negative when B is closer). Record the location error.</li><li>Set the timing error to 1, 3 and 5 ms. Record the error each time. Press <b>New bang</b> twice at each setting and record those too.</li><li>Repeat with the microphones bunched together.</li><li>Turn on the echo and record the error.</li></ol><p>Write a claim: which problem causes the biggest error? Use two numbers from your table.</p>',
       honors:'<p><b>Question:</b> How do temperature and echoes move the answer?</p><ol><li>With no timing error, set the air to −20, 0, 20 and 40 °C. Record the speed of sound and the location error.</li><li>At 20 °C, turn on the echo. Record the error for extra distances of 20, 60, 100 and 200 m.</li><li>Graph location error against echo distance.</li><li>Switch Show to <b>Alerts and base rates</b>. Set the share of gunfire to 2, 10 and 30%. Record the share of alerts that are gunfire.</li></ol><p>Explain, using d<sub>A</sub> − d<sub>B</sub> = vΔt, why using the wrong speed shifts every hyperbola.</p>',
       ap:'<p><b>Question:</b> How does sensor geometry turn timing error into location error?</p><ol><li>Set 2 ms of timing error. For each layout, press <b>New bang</b> five times and record the location error.</li><li>Find the mean error for each layout.</li><li>In Alerts and base rates, set gunfire to 1%, 5%, 10% and 30%. Record the share of alerts that are gunfire.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why bunched sensors magnify error, and why a low base rate lowers the positive predictive value even when the system rarely makes mistakes.</p>'},
  terms:[{t:'Speed of sound',d:'About 343 m/s in air at 20 °C; v ≈ 331 + 0.6T, with T in °C.'},
    {t:'Arrival time',d:'When the sound reaches a microphone. Closer microphones hear it first.'},
    {t:'Time difference of arrival (TDOA)',d:'How much later one microphone hears a sound than another. It fixes the difference in their distances to the source.'},
    {t:'Hyperbola',d:'All the points whose distances to two fixed points differ by the same amount.'},
    {t:'Echo',d:'Sound that reflects off a surface and arrives later than the direct path.'},
    {t:'Base rate',d:'How common the real thing is among all the cases checked, here the share of loud bangs that are gunfire.'},
    {lvl:'honors',t:'False alert',d:'An alert for something that was not gunfire.'},
    {lvl:'honors',t:'Multilateration',d:'Locating a source from the differences in arrival time at several receivers.'},
    {lvl:'ap',t:'Least squares',d:'Choosing the point that makes the sum of squared mismatches between measured and predicted time differences as small as possible.'},
    {lvl:'ap',t:'Positive predictive value (PPV)',d:'The share of alerts that are true: true alerts ÷ all alerts.'},
    {lvl:'ap',t:'Geometric dilution of precision',d:'How much the sensor layout magnifies timing error into location error.'}],
  about:'<p><b>The physics.</b> Sound travels at v ≈ 331 + 0.6T m/s (T in °C), 343 m/s at 20 °C. Each microphone records an arrival time t<sub>i</sub> = d<sub>i</sub>/v (plus any echo delay and clock error). For each pair, d<sub>i</sub> − d<sub>j</sub> = v(t<sub>i</sub> − t<sub>j</sub>), a hyperbola. The tool finds the point that minimizes the sum of squared mismatches over every pair, using the speed the system assumes (343 m/s unless it corrects for temperature). The hyperbolas drawn are for each mic paired with mic A.</p>'+
    '<p><b>What is simplified.</b> The ground is flat and the air is still (no wind). Timing errors are random and normally distributed with the spread you set; each “New bang” draws new ones. The echo is one reflection reaching mic B with an extra path you set. Real systems also have to decide which sounds are impulses worth locating, which this tool skips.</p>'+
    '<p><b>Base rates.</b> The numbers in Alerts and base rates (bangs per month, the share that are gunfire, how often each kind is flagged) are assumptions for illustration, not data from any city or company.</p>'+
    '<p><b>Real-world facts.</b> The best-known system of this kind was sold under the name ShotSpotter; the company is now called SoundThinking. In Chicago, a 2021 analysis by the MacArthur Justice Center found that 89% of police deployments sent by alerts turned up no gun-related crime and 86% turned up no crime at all. Chicago spent about $49 million on the system starting in 2018 and let the contract lapse in September 2024 (<a href="https://npr.org/2024/02/15/1231394334/shotspotter-gunfire-detection-chicago-mayor-dropping" target="_blank" rel="noopener">NPR</a>).</p>'+
    '<p><b>Both sides.</b> Supporters argue that an alert can send help quickly to shootings that nobody calls in. Critics argue that most alert-driven deployments find no crime and send officers into neighborhoods expecting gunfire. Finding no evidence does not prove there was no gunshot, and an alert alone does not prove there was one. How a city should weigh these is a question of values; this tool only does the math.</p>',
  draw(sim,ctx,vdt,k){const p=sim.p,st=sim.st;
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    if(p.mode==='alerts'){drawAlerts(sim,ctx,k);return;}
    const s=solve(sim),v=vOf(p.temp);
    // map: streets (background) and blocks
    ctx.save();ctx.beginPath();ctx.rect(10,10,520,430);ctx.clip();
    ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(10,10,520,430);
    ctx.fillStyle=PAL['card'];ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;
    for(let bx=0;bx<MW;bx+=100)for(let by=0;by<MH;by+=100){const x0=PX(bx)+4,y0=PY(by+100)+4;rr(ctx,x0,y0,42,42,3);ctx.fill();ctx.stroke();}
    // expanding wavefront
    const r=v*st.t/2;if(r>0){ctx.strokeStyle=PAL['s4'];ctx.lineWidth=3;ctx.globalAlpha=clamp(1-st.t/3.5,0.25,1);ctx.beginPath();ctx.arc(PX(p.sx),PY(p.sy),r,0,6.29);ctx.stroke();ctx.globalAlpha=1;
      if(p.echo){const re=Math.max(0,r-p.echoX/2);if(re>0){ctx.setLineDash([6,5]);ctx.globalAlpha=.6;ctx.lineWidth=2;ctx.beginPath();ctx.arc(PX(p.sx),PY(p.sy),re,0,6.29);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;}}}
    // hyperbolas
    const sh=shown(sim);sim.vis.ytR=null;
    if(p.hyp&&sh){const H=hyperbolas(sim);H.forEach((segs,j)=>{ctx.strokeStyle=PAL[PAIRC[j%3]];ctx.lineWidth=2.2;ctx.globalAlpha=.9;ctx.beginPath();segs.forEach(g=>{ctx.moveTo(g[0][0],g[0][1]);ctx.lineTo(g[1][0],g[1][1]);});ctx.stroke();});ctx.globalAlpha=1;}
    // echo wall next to mic B
    if(p.echo&&s.M[1]){const b=s.M[1];ctx.fillStyle=PAL['cv-soft'];ctx.fillRect(PX(b[0])-18,PY(b[1])-24,36,6);}
    // the bang and the estimate
    impulse(ctx,PX(p.sx),PY(p.sy),13,PAL['s4']);
    const ex=PX(s.x),ey=PY(s.y);
    if(sh){if(s.err>4){ctx.strokeStyle=PAL['s1'];ctx.setLineDash([4,4]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(PX(p.sx),PY(p.sy));ctx.lineTo(ex,ey);ctx.stroke();ctx.setLineDash([]);}
    ctx.strokeStyle=PAL['s1'];ctx.lineWidth=3.5;ctx.beginPath();ctx.moveTo(ex-9,ey-9);ctx.lineTo(ex+9,ey+9);ctx.moveTo(ex+9,ey-9);ctx.lineTo(ex-9,ey+9);ctx.stroke();}
    // microphones
    s.M.forEach((m,i)=>{const x=PX(m[0]),y=PY(m[1]),hit=st.t>=s.t[i];
      if(hit&&st.t-s.t[i]<0.35){ctx.strokeStyle=PAL['s4'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,13+30*(st.t-s.t[i]),0,6.29);ctx.stroke();}
      ctx.fillStyle=hit?'#1f4fa8':'#5f6b7a';ctx.beginPath();ctx.arc(x,y,11*Math.min(k,1.4),0,6.29);ctx.fill();
      txt(ctx,NAMES[i],x,y+1,{s:12*Math.min(k,1.4),w:800,c:'#ffffff',a:'center',b:'middle'});});
    ctx.restore();
    ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.strokeRect(10.5,10.5,520,430);
    // scale bar
    ctx.fillStyle=PAL['cv-ink'];ctx.fillRect(20,428,50,3);txt(ctx,'100 m',75,432,{s:12*k,c:PAL['cv-ink'],w:600});
    /* side panel */
    const X0=548;let y=34;
    txt(ctx,'Arrival times',X0,y,{s:15*k,w:700});y+=8;
    const t0=Math.min(...s.t);
    const big=k>1.35;s.t.forEach((t,i)=>{y+=(big?20:24)*k;const late=p.echo&&i===1;txt(ctx,'Mic '+NAMES[i],X0,y,{s:13*k,w:700,c:PAL[i===s.t.indexOf(t0)?'s4':'cv-ink']});
      txt(ctx,'+'+(t-t0).toFixed(3)+' s'+(late?' (echo)':''),X0+64*k,y,{s:13*k,c:late?PAL['s1']:PAL['cv-ink']});});
    const q=pairAB(sim),PW=790-X0;
    if(!sh){/* Your turn: bare-number choices in a 2 × 2 grid */
      const y0=ytNow(sim);y+=14;ctx.fillStyle=PAL['card'];rr(ctx,X0-8,y-4,PW+4,440-y,10);ctx.fill();ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2;ctx.stroke();
      y+=10+13*k;txt(ctx,'Your turn',X0+4,y,{s:14*k,w:800});
      const ask=big?'At '+q.v.toFixed(0)+' m/s, how many m closer to mic '+q.first+' than '+q.later+'?':'How many meters closer is the bang to mic '+q.first+' than to mic '+q.later+'? Sound: '+q.v.toFixed(0)+' m/s.',retry=y0&&y0.tries.length;
      y=wrap(ctx,retry?(big?'Not quite. Subtract, then × '+q.v.toFixed(0)+'.':'Not quite. Subtract the times, then × '+q.v.toFixed(0)+'. '+ask):ask,X0+4,y+8+12*k,PW-14,{s:12*k,w:600,c:retry?PAL['s1']:PAL['cv-ink']});
      const ch=ytChoices(sim),gp=8,bw=(PW-12-gp)/2,bh=Math.min(40,22*k+10),by0=Math.min(y+2,440-10-2*bh-gp);sim.vis.ytR=[];
      ch.forEach((v,i)=>{const bx=X0+i%2*(bw+gp),by=by0+Math.floor(i/2)*(bh+gp),tried=y0&&y0.tries.some(t=>Math.abs(t-v)<1e-9);ctx.fillStyle=PAL[tried?'card2':'cv-bg'];rr(ctx,bx,by,bw,bh,8);ctx.fill();ctx.strokeStyle=tried?PAL['line']:PAL['rj'];ctx.lineWidth=2;ctx.stroke();
        txt(ctx,YT.fmt(v)+' m',bx+bw/2,by+bh/2+1,{s:13*k,w:800,a:'center',b:'middle',c:tried?PAL['cv-soft']:PAL['cv-ink']});if(!tried)sim.vis.ytR.push([bx,by,bw,bh,v]);});
      return;}
    /* the math with this bang's numbers, in the color of the A–B curve */
    y+=(big?20:26)*k;txt(ctx,q.v.toFixed(0)+' × '+q.dt.toFixed(3)+(big?'':' s')+' = '+YT.fmt(YT.ans(sim))+' m',X0,y,{s:(big?12:14)*k,w:800,c:PAL[PAIRC[0]]});
    y+=16*k;txt(ctx,'closer to mic '+q.first+(big?'':' (blue curve)'),X0,y,{s:12*k,c:PAL['cv-soft']});
    const vd=ytVerdict(sim);if(vd){const yv=ytNow(sim);y=wrap(ctx,vd,X0,y+8+12*k,PW-6,{s:12*k,w:700,c:yv&&yv.ok?PAL['s3']:PAL['s1']})-12*k;}
    if(big){y+=24*k;txt(ctx,'Located within '+(s.err<0.05?'0.0':(s.err<10?s.err.toFixed(1):Math.round(s.err)))+' m',X0,y,{s:12*k,w:700,c:s.err>10?PAL['s1']:PAL['cv-ink']});return;}
    y+=30*k;txt(ctx,'Located within',X0,y,{s:13*k,c:PAL['cv-soft']});
    y+=26*k;txt(ctx,s.err<0.05?'0.0 m':(s.err<10?s.err.toFixed(1):Math.round(s.err))+' m',X0,y,{s:22*Math.min(k,1.3),w:800,c:s.err>10?PAL['s1']:PAL['cv-ink']});
    if(k<1.35&&y<380){y+=26;txt(ctx,'starburst = bang',X0,y,{s:12*k,c:PAL['cv-soft']});y+=18*k;txt(ctx,'X = system’s answer',X0,y,{s:12*k,c:PAL['s1']});
      if(p.kind!=='gun'&&y<410){y+=18*k;txt(ctx,'This bang: '+KIND[p.kind],X0,y,{s:12*k,c:PAL['cv-soft']});}}},
  thumbSetup(sim){BioLab.setValues(sim,{hyp:true,jit:2});}
};
function drawAlerts(sim,ctx,k){const p=sim.p,a=alerts(p);
  // 100 squares = all alerts; true ones first
  const nT=a.all>0?Math.round(100*a.tA/a.all):0;
  txt(ctx,'Every 100 alerts',30,34,{s:15*k,w:700});
  const S=34,G=6,x0=30,y0=52;
  for(let i=0;i<100;i++){const c=i%10,r=Math.floor(i/10),x=x0+c*(S+G),y=y0+r*(S+G)*0.95;
    if(i<nT){ctx.fillStyle=PAL['s4'];rr(ctx,x,y,S,S*0.9,5);ctx.fill();impulse(ctx,x+S/2,y+S*0.45,9,'#ffffff');}
    else{ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;rr(ctx,x+1,y+1,S-2,S*0.9-2,5);ctx.stroke();}}
  const X0=440;let y=40;
  const line=(s,o)=>{y+=(o&&o.gap||26)*k;txt(ctx,s,X0,y,Object.assign({s:14*k},o||{}));};
  y-=20*k;line(fmtI(p.nImp)+' loud bangs',{w:700,s:15*k});
  line(fmtI(a.gun)+' gunfire, '+fmtI(a.other)+' other',{c:PAL['cv-soft']});
  line(fmtI(a.tA)+' true alerts',{c:PAL['s4'],w:700,gap:34});
  line('+ '+fmtI(a.fA)+' false alerts',{w:700});
  line('= '+fmtI(a.all)+' alerts',{w:700});
  line(Math.round(a.ppv)+'% are gunfire',{s:22*Math.min(k,1.3),w:800,gap:42,c:a.ppv<50?PAL['s1']:PAL['cv-ink']});
  if(k<1.35){line('filled = real gunfire',{s:12*k,c:PAL['cv-soft'],gap:34});line('outline = something else',{s:12*k,c:PAL['cv-soft'],gap:20});}}
BioLab.register(SIM);

BioLab.addPractical({shotspotter:{
 hook:'On the Fourth of July you see a firework burst and hear the bang 1.5 s later. How far away is it? Your friend down the street hears the same bang 0.40 s before you do. How much closer to the burst is your friend?',
 answer:'Sound travels about 343 m/s, so the burst is 343 × 1.5 = 514.5 m away, about half a kilometer. Your friend is 343 × 0.40 = 137.2 m closer. That one time difference puts the burst somewhere on a hyperbola; a third listener adds a second curve, and the curves cross at the burst.',
 uses:['Thunder: count the seconds from a lightning flash to the thunder. Sound covers about 343 m a second, so every 3 s is about 1 km (343 × 3 = 1,029 m).','Earthquakes: seismologists locate an earthquake from the different times its waves reach several stations, the same arrival-time idea with much faster waves.','GPS: your phone finds its position from the arrival times of radio signals from several satellites. Radio travels at the speed of light, so a timing error of one millionth of a second is about 300 m.'],
 takeaway:'Speed × time difference turns a fraction of a second into meters. Timing says where a sound came from, not what made it.'}});

BioLab.addReview({shotspotter:{questions:[
 {id:'vdt',kind:'test',lvl:'bio',q:'Two microphones hear a bang 0.200 s apart. Sound travels 343 m/s. How many meters closer is the bang to the microphone that heard it first?',num:{ans:68.6,tol:0.1,unit:'m'},
  steps:['Distance difference = speed × time difference.','343 × 0.200 = 68.6 m.']},
 {id:'ab',kind:'real',lvl:'bio',q:'In the opening case, mic A hears the bang 0.920 s after the first microphone and mic B 0.383 s after it. To the nearest meter, how much closer is the bang to mic B than to mic A?',num:{ans:184,tol:1,unit:'m'},
  steps:['Time difference: 0.920 − 0.383 = 0.537 s.','343 × 0.537 = 184.2 m.','The tile shows B − A, so it reads about −184 m: negative because B is closer.'],
  lab:{set:{mode:'locate',layout:'spread',nmic:'4',sx:640,sy:520,jit:0,echo:false,temp:20,useT:false},act:'show',look:'Read <b>Distance difference vΔt (B − A)</b>.'},verify:[['dAB',-184.03,0.05]]},
 {id:'fire',kind:'real',lvl:'bio',q:'You see a firework burst and hear it 1.5 s later. How far away is it?',num:{ans:514.5,tol:0.5,unit:'m'},
  steps:['Light reaches you almost instantly, so the 1.5 s is the sound’s travel time.','343 × 1.5 = 514.5 m, about half a kilometer.']},
 {id:'hot',kind:'test',lvl:'honors',q:'On a 35 °C night, how fast does sound travel? Use v ≈ 331 + 0.6T.',num:{ans:352,tol:0.5,unit:'m/s'},
  steps:['0.6 × 35 = 21.','331 + 21 = 352 m/s. Warmer air carries sound faster.'],
  lab:{set:{mode:'locate',temp:35},look:'Read <b>Real speed of sound</b>.'},verify:[['vtrue',352,0.01]]},
 {id:'cold',kind:'real',lvl:'honors',q:'At −10 °C sound travels 331 + 0.6 × (−10) = 325 m/s, but the system assumes 343 m/s. By what percent does it overstate every distance difference? Round to 0.1%.',num:{ans:5.5,tol:0.1,unit:'%'},
  steps:['The system computes 343 × Δt when the truth is 325 × Δt.','343 ÷ 325 = 1.0554.','So every distance difference comes out about 5.5% too large, and the hyperbolas shift.'],
  lab:{set:{mode:'locate',temp:-10,useT:false},look:'Read <b>Real speed of sound</b> and <b>Location error</b> (press Show the math).'},verify:[['vtrue',325,0.01]]},
 {id:'ppv',kind:'real',lvl:'ap',q:'1,000 loud bangs, 10% gunfire. The system flags 90% of gunfire and 5% of other bangs. What percent of alerts are real gunfire? Round to the nearest percent.',num:{ans:67,tol:0.6,unit:'%'},
  steps:['True alerts: 1,000 × 0.10 × 0.90 = 90.','False alerts: 900 × 0.05 = 45.','90 ÷ (90 + 45) = 90 ÷ 135 ≈ 66.7%, about 67%.'],
  lab:{set:{mode:'alerts',nImp:1000,gShare:10,sens:90,fpr:5},look:'Read <b>Share of alerts that are gunfire</b>.'},verify:[['ppv',66.667,0.01]]},
 {id:'rare',kind:'real',lvl:'ap',q:'Same system, but only 2% of bangs are gunfire. What percent of alerts are real gunfire? Round to the nearest percent.',num:{ans:27,tol:0.6,unit:'%'},
  steps:['True alerts: 1,000 × 0.02 × 0.90 = 18.','False alerts: 980 × 0.05 = 49.','18 ÷ 67 ≈ 26.9%, about 27%. Lower the base rate and false alerts take over.'],
  lab:{set:{mode:'alerts',nImp:1000,gShare:2,sens:90,fpr:5},look:'Read <b>Share of alerts that are gunfire</b>.'},verify:[['ppv',26.866,0.01]]}
]}});
})();
