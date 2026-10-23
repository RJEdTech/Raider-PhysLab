(function(){
'use strict';
const {clamp,lerp,rr,txt,pill,PAL,FONT,atLeast,fmtNum}=BioLab.h;
const G=9.8,RHO=1.2,GY=386,ID='projectile';
const OBJ={
  cannon:{l:'Cannonball',m:17.6,d:0.18,cd:0.47},
  golf:{l:'Golf ball',m:0.046,d:0.043,cd:0.25},
  baseball:{l:'Baseball',m:0.145,d:0.074,cd:0.35},
  pumpkin:{l:'Pumpkin',m:5.0,d:0.35,cd:0.6},
  pingpong:{l:'Ping-pong ball',m:0.0027,d:0.04,cd:0.5},
  car:{l:'Small car',m:1000,d:1.7,cd:0.35},
  marble:{l:'Marble',m:0.005,d:0.016,cd:0.47}};
const GATE0=-0.5,GATE1=-0.1,GATE_D=0.4;
const f1=v=>fmtNum(v,1),f2=v=>fmtNum(v,2);

/* ---------- show only what the current mode uses ---------- */
function sync(sim){if(!sim.ui||!sim.ui.ctl||!sim.ui.sec)return;const p=sim.p,m=p.mode,sec=sim.ui.sec;
  const C={ang:m!=='table',cup:m==='table',cd:!!p.air,dia:!!p.air};
  SIM.controls.forEach(c=>{const e=sec.querySelector('#'+ID+'-'+c.id+',#'+ID+'-'+c.id+'-l');const w=e&&e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl||'bio')||C[c.id]===false;});
  const M={best:m==='free',twinT:!!p.twin,gate:m==='table',cupOff:m==='table',score:m==='target',tgt:m==='target'};
  SIM.metrics.forEach(mt=>{const t=sim.ui.tiles[mt.id];if(!t)return;const tile=t.num.closest('.tile');if(tile)tile.hidden=!atLeast(mt.lvl||'bio')||M[mt.id]===false;});
  const A={fan:m==='free',newTarget:m==='target'};
  const btns=[...sec.querySelectorAll('.controls .actions button')];SIM.actions.forEach((a,i)=>{if(btns[i])btns[i].hidden=!atLeast(a.lvl||'bio')||A[a.id]===false;});}

/* ---------- physics ---------- */
function objOf(p){return {m:OBJ[p.obj].m,d:p.dia,cd:p.cd};}
function makeShot(sim,ang,opts){const p=sim.p,st=sim.st,o=objOf(p),table=p.mode==='table';opts=opts||{};
  const a=(table?0:ang)*Math.PI/180,v=p.v0;
  const A=p.obj==='car'?2.2:Math.PI*o.d*o.d/4;
  const s={ang:table?0:ang,v,h0:p.h0,obj:p.obj,air:!!p.air,kd:p.air?0.5*RHO*o.cd*A/o.m:0,
    x:table?GATE0-0.1:0,y:p.h0,vx:v*Math.cos(a),vy:v*Math.sin(a),ft:0,age:0,roll:table?(0.1-GATE0)/Math.max(v,0.01):0,
    rolling:table,done:false,peakY:p.h0,peakX:0,tPeak:a>0?null:0,tLand:null,trail:[],dots:[],strobe:+p.strobe,nextDot:0,lastTrail:-1,
    col:st.seq++%6,fan:!!opts.fan,twin:!!opts.twin,gateT:table?GATE_D/Math.max(v,0.01):null};
  if(opts.twin){s.vx=0;s.vy=0;s.ang=0;s.tPeak=0;}
  if(!s.rolling){s.dots.push({t:0,x:s.x,y:s.y,vx:s.vx,vy:s.vy});s.nextDot=s.strobe;s.trail.push([s.x,s.y]);}
  return s;}
function acc(s,vx,vy){if(!s.kd)return [0,-G];const sp=Math.hypot(vx,vy);return [-s.kd*sp*vx,-G-s.kd*sp*vy];}
function rk4(s,h){const x=s.x,y=s.y,vx=s.vx,vy=s.vy;
  const a1=acc(s,vx,vy),k1=[vx,vy,a1[0],a1[1]];
  const a2=acc(s,vx+a1[0]*h/2,vy+a1[1]*h/2),k2=[vx+a1[0]*h/2,vy+a1[1]*h/2,a2[0],a2[1]];
  const a3=acc(s,vx+a2[0]*h/2,vy+a2[1]*h/2),k3=[vx+a2[0]*h/2,vy+a2[1]*h/2,a3[0],a3[1]];
  const a4=acc(s,vx+a3[0]*h,vy+a3[1]*h),k4=[vx+a3[0]*h,vy+a3[1]*h,a4[0],a4[1]];
  s.x=x+h/6*(k1[0]+2*k2[0]+2*k3[0]+k4[0]);s.y=y+h/6*(k1[1]+2*k2[1]+2*k3[1]+k4[1]);
  s.vx=vx+h/6*(k1[2]+2*k2[2]+2*k3[2]+k4[2]);s.vy=vy+h/6*(k1[3]+2*k2[3]+2*k3[3]+k4[3]);}
function adv(s,dt){let guard=0;
  while(dt>1e-12&&!s.done&&guard++<4000){
    if(s.rolling){const h=Math.min(dt,(0-s.x)/s.v);s.x+=s.v*h;s.age+=h;dt-=h;
      if(s.x>=-1e-9){s.x=0;s.rolling=false;s.dots.push({t:0,x:0,y:s.y,vx:s.vx,vy:s.vy});s.nextDot=s.strobe;s.trail.push([0,s.y]);}continue;}
    if(s.y<=0&&s.vy<=0&&s.ft===0){s.done=true;s.tLand=0;s.y=0;break;}
    let h=Math.min(dt,0.004,s.nextDot-s.ft);if(h<1e-9)h=Math.min(dt,0.004);
    const px=s.x,py=s.y,pvx=s.vx,pvy=s.vy;rk4(s,h);s.ft+=h;s.age+=h;dt-=h;
    if(pvy>0&&s.vy<=0&&s.tPeak===null){const f=pvy/(pvy-s.vy);s.tPeak=s.ft-h+h*f;}
    if(s.y>s.peakY){s.peakY=s.y;s.peakX=s.x;}
    if(s.y<=0&&s.vy<0){const f=py/(py-s.y);s.x=px+(s.x-px)*f;s.vx=pvx+(s.vx-pvx)*f;s.vy=pvy+(s.vy-pvy)*f;s.ft=s.ft-h+h*f;s.y=0;s.done=true;s.tLand=s.ft;s.trail.push([s.x,0]);
      if(s.tPeak===null)s.tPeak=0;break;}
    if(Math.abs(s.ft-s.nextDot)<1e-7){s.dots.push({t:s.nextDot,x:s.x,y:s.y,vx:s.vx,vy:s.vy});s.nextDot+=s.strobe;}
    if(s.ft-s.lastTrail>=0.02){s.trail.push([s.x,s.y]);s.lastTrail=s.ft;}}}
const mainShot=st=>st.main>=0&&st.main<st.shots.length?st.shots[st.main]:null;
function pushShot(st,s){st.shots.push(s);while(st.shots.length>16){st.shots.shift();}st.main=st.shots.length-1;}
function fire(sim){const st=sim.st,p=sim.p;const s=makeShot(sim,p.ang);pushShot(st,s);st.probe=-1;st.twin=p.twin?makeShot(sim,0,{twin:true}):null;
  if(st.twin&&p.mode==='table'){st.twin.wait=s.roll;}
  if(p.mode==='target')st.tries++;st.hitShown=false;}
function fan(sim){const st=sim.st,p=sim.p;if(p.mode!=='free')return;const angs=[20,25,30,35,40,50,55,60,65,70,45];
  angs.forEach(a=>pushShot(st,makeShot(sim,a,{fan:true})));st.probe=-1;st.twin=null;st.fanAt=st.shots.length;}
function newTarget(st,seed){st.tseed=(st.tseed*16807+seed)%2147483647;const r=(st.tseed%10000)/10000;st.target={x:Math.round(12+r*48),w:3};}

/* ---------- view ---------- */
function fitView(sim){const p=sim.p,st=sim.st,table=p.mode==='table';let xmax,ymax;
  if(table){const land=p.v0*Math.sqrt(2*Math.max(p.h0,0.01)/G);xmax=Math.max(p.cup+0.4,land*1.25,0.9);ymax=Math.max(p.h0*1.25,0.6);}
  else{const sa=Math.sin(Math.max(p.ang,25)*Math.PI/180);xmax=(p.v0/G)*Math.sqrt(p.v0*p.v0+2*G*p.h0);ymax=p.h0+Math.pow(p.v0*sa,2)/(2*G);if(p.mode==='target'&&st.target)xmax=Math.max(xmax,st.target.x+4);}
  st.shots.forEach(s=>{xmax=Math.max(xmax,s.done?s.x:0);ymax=Math.max(ymax,s.h0+Math.pow(s.v*Math.sin(s.ang*Math.PI/180),2)/(2*G));});
  xmax=Math.max(xmax,1)*1.06;ymax=Math.max(ymax,0.5)*1.12;
  const H=GY-46;let s,ox;
  if(table){s=Math.min(700/(xmax+0.8),H/ymax,170);ox=64+0.8*s;}else{s=Math.min(668/xmax,H/ymax,170);ox=100;}
  return {s,ox};}
function niceStep(pxPerM,minPx){const c=[0.05,0.1,0.2,0.25,0.5,1,2,5,10,20,25,50,100];for(const v of c)if(v*pxPerM>=minPx)return v;return 200;}

/* ---------- drawing helpers ---------- */
function arrow(ctx,x1,y1,x2,y2,col,w){const L=Math.hypot(x2-x1,y2-y1);if(L<2)return;const a=Math.atan2(y2-y1,x2-x1),hd=Math.min(9,L*0.45);
  ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=w||2.5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2-Math.cos(a)*hd*0.8,y2-Math.sin(a)*hd*0.8);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-hd*Math.cos(a-0.42),y2-hd*Math.sin(a-0.42));ctx.lineTo(x2-hd*Math.cos(a+0.42),y2-hd*Math.sin(a+0.42));ctx.closePath();ctx.fill();}
function sprite(ctx,obj,x,y,rad,ang){ctx.save();ctx.translate(x,y);
  if(obj==='car'){ctx.rotate(-ang);const L=Math.max(rad*2.4,26),H=L*0.38;ctx.fillStyle='#c4302b';rr(ctx,-L/2,-H/2,L,H*0.75,4);ctx.fill();ctx.fillStyle='#e05a4f';rr(ctx,-L*0.22,-H*0.95,L*0.48,H*0.55,4);ctx.fill();
    ctx.fillStyle='#bfe3f5';ctx.fillRect(-L*0.15,-H*0.85,L*0.16,H*0.38);ctx.fillRect(L*0.05,-H*0.85,L*0.16,H*0.38);ctx.fillStyle='#222';[-L*0.3,L*0.3].forEach(wx=>{ctx.beginPath();ctx.arc(wx,H*0.25,H*0.28,0,6.29);ctx.fill();});ctx.restore();return;}
  const r=Math.max(rad,obj==='marble'||obj==='pingpong'||obj==='golf'?6:7);
  if(obj==='pumpkin'){ctx.fillStyle='#e07b1f';ctx.beginPath();ctx.ellipse(0,0,r*1.15,r,0,0,6.29);ctx.fill();ctx.strokeStyle='#a9520d';ctx.lineWidth=1.2;
    [-0.5,0,0.5].forEach(o=>{ctx.beginPath();ctx.ellipse(o*r*0.8,0,r*0.35,r*0.95,0,0,6.29);ctx.stroke();});ctx.fillStyle='#2f7a33';ctx.fillRect(-1.5,-r-4,3,5);ctx.restore();return;}
  const fill={cannon:'#2d2f33',golf:'#f4f4f0',baseball:'#f6f2e8',pingpong:'#f5902a',marble:'#3f7fd0'}[obj]||'#555';
  ctx.fillStyle=fill;ctx.beginPath();ctx.arc(0,0,r,0,6.29);ctx.fill();ctx.strokeStyle=obj==='cannon'?PAL['cv-soft']:'rgba(0,0,0,.45)';ctx.lineWidth=obj==='cannon'?1.6:1;ctx.stroke();
  if(obj==='baseball'){ctx.strokeStyle='#c4302b';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(-r*1.1,0,r*0.8,-0.8,0.8);ctx.stroke();ctx.beginPath();ctx.arc(r*1.1,0,r*0.8,Math.PI-0.8,Math.PI+0.8);ctx.stroke();}
  if(obj==='golf'){ctx.fillStyle='rgba(0,0,0,.18)';[[-.3,-.3],[.3,-.2],[0,.3],[-.35,.25],[.35,.3]].forEach(q=>{ctx.beginPath();ctx.arc(q[0]*r,q[1]*r,0.9,0,6.29);ctx.fill();});}
  ctx.fillStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.arc(-r*0.35,-r*0.35,r*0.28,0,6.29);ctx.fill();ctx.restore();}
function placeLabel(placed,x,y,w,h){for(const q of placed)if(x<q[0]+q[2]&&x+w>q[0]&&y<q[1]+q[3]&&y+h>q[1])return false;placed.push([x,y,w,h]);return true;}

const SIM={
  id:ID,hash:ID,apUnit:1,order:4,tab:'Projectile motion',kind:'Simulation',prereq:['freefall','vectors2d'],
  card:'Launch cannonballs, golf balls and pumpkins, measure range and height from strobe dots, and hit targets.',
  title:'Projectile motion',
  lede:{bio:'Fire a projectile, then measure how far and how high it goes. Find out what launch angle goes farthest.',
    honors:'A projectile moves sideways at constant velocity while gravity changes only its vertical velocity. Measure both from the strobe dots.',
    ap:'Treat the launch velocity as components, test the range equation, then turn on air resistance and watch the symmetry break.'},
  scale:'Side view of an open field. Distances on the rulers are in meters; g = 9.8 m/s². Balls are drawn larger than life so you can see them.',
  aspect:16/9,timeScale:1,dtMax:0.01,sampleDt:0.04,window:8,unit:'s',
  chChange:0.5,chReveal:6,
  controls:[
    {id:'mode',label:'Activity',type:'seg',def:'free',options:[{v:'free',l:'Launch'},{v:'target',l:'Hit the target'},{v:'table',l:'Off a table'}],
      help:'Hit the target: land on the bull’s-eye. Off a table: time a marble with photogates, predict where it lands, and place the cup.',
      onChange(sim){const p=sim.p;if(p.mode==='table'){if(p.obj!=='marble'||p.h0>3)BioLab.setValues(sim,{obj:'marble',h0:0.9,v0:2,ang:0,twin:false});}
        else if(p.obj==='marble'){BioLab.setValues(sim,{obj:'cannon',h0:0,v0:18,ang:40});}
        if(p.mode==='target'&&sim.st&&!sim.st.target)newTarget(sim.st,7);sync(sim);}},
    {id:'ang',label:'Launch angle',type:'range',min:0,max:90,step:1,def:40,unit:'°',help:'Measured up from the horizontal.'},
    {id:'v0',label:'Launch speed',type:'range',min:1,max:35,step:0.5,def:18,unit:'m/s'},
    {id:'h0',label:'Launch height',type:'range',min:0,max:15,step:0.1,def:0,unit:'m',help:'Height of the launch point above the ground.'},
    {id:'obj',label:'Projectile',type:'select',def:'cannon',options:Object.keys(OBJ).map(k=>({v:k,l:OBJ[k].l+' ('+(OBJ[k].m>=1?OBJ[k].m+' kg':(OBJ[k].m*1000).toFixed(OBJ[k].m<0.01?1:0)+' g')+')'})),
      onChange(sim){const o=OBJ[sim.p.obj];sim.p.cd=o.cd;sim.p.dia=o.d;if(sim.ui&&sim.ui.ctl.cd){sim.ui.ctl.cd.set(o.cd);sim.ui.ctl.dia.set(o.d);}}},
    {id:'twin',label:'Drop a twin ball at launch',type:'toggle',def:false,help:'A second ball falls straight down from the launch height at the same instant.'},
    {id:'strobe',label:'Strobe dots every',type:'seg',def:'0.25',options:[{v:'0.1',l:'0.1 s'},{v:'0.25',l:'0.25 s'},{v:'0.5',l:'0.5 s'}]},
    {id:'vecs',label:'Velocity arrows at the dots',type:'toggle',def:false,help:'Big picture: one arrow. Closer look: horizontal and vertical components.'},
    {id:'cup',label:'Cup position',type:'range',min:0,max:6,step:0.05,def:1.2,unit:'m',help:'Measured along the floor from the table edge. Place it where you predict the marble lands.'},
    {id:'air',label:'Air resistance',lvl:'honors',type:'toggle',def:false,help:'Drag force ½ρC<sub>d</sub>Av², opposite the velocity.',onChange(sim){sync(sim);}},
    {id:'cd',label:'Drag coefficient C<sub>d</sub>',lvl:'honors',type:'range',min:0.1,max:1.2,step:0.01,def:0.47},
    {id:'dia',label:'Diameter',lvl:'honors',type:'range',min:0.01,max:2,step:0.001,def:0.18,unit:'m'}
  ],
  actions:[
    {id:'fire',label:'Fire',primary:true,run(sim){fire(sim);}},
    {id:'fan',label:'Fire a fan (20° to 70°)',run(sim){fan(sim);}},
    {id:'newTarget',label:'New target',run(sim){newTarget(sim.st,(sim.st.tries+3)*7919);sim.st.hits=0;sim.st.tries=0;}},
    {id:'probe',label:'Probe next dot',lvl:'honors',run(sim){const s=mainShot(sim.st);if(!s||!s.dots.length)return;sim.st.probe=(sim.st.probe+1)%s.dots.length;}},
    {id:'clear',label:'Clear traces',run(sim){const st=sim.st;st.shots=[];st.main=-1;st.probe=-1;st.marks=[];st.twin=null;}}
  ],
  init(sim){const st={shots:[],main:-1,seq:0,probe:-1,marks:[],twin:null,tseed:12345,target:null,hits:0,tries:0,hitShown:false};
    sim.st=st;if(sim.p.mode==='target')newTarget(st,7);fire(sim);return st;},
  step(sim,dt){const st=sim.st;st.shots.forEach(s=>{if(!s.done)adv(s,dt);});
    const tw=st.twin;if(tw&&!tw.done){if(tw.wait>0){const h=Math.min(dt,tw.wait);tw.wait-=h;if(tw.wait<=1e-12)adv(tw,dt-h);}else adv(tw,dt);}
    const m=mainShot(st);if(m&&m.done&&sim.p.mode==='target'&&!st.hitShown&&st.target&&!m.fan){st.hitShown=true;m.hit=Math.abs(m.x-st.target.x)<=st.target.w/2;if(m.hit)st.hits++;}},
  metrics:[
    {id:'dist',label:'Horizontal distance',unit:'m',d:1,min:0,max:null,get(sim){const s=mainShot(sim.st);return s?Math.max(0,s.x):0;}},
    {id:'ht',label:'Height',unit:'m',d:1,min:0,max:null,get(sim){const s=mainShot(sim.st);return s?Math.max(0,s.y):0;}},
    {id:'maxh',label:'Max height',unit:'m',d:1,min:0,max:null,get(sim){const s=mainShot(sim.st);return s?s.peakY:0;}},
    {id:'tof',label:'Time in the air',unit:'s',d:2,min:0,max:null,get(sim){const s=mainShot(sim.st);return s?s.ft:0;}},
    {id:'spd',label:'Speed',unit:'m/s',d:1,min:0,max:null,get(sim){const s=mainShot(sim.st);return s?(s.done?0:Math.hypot(s.vx,s.vy)):0;}},
    {id:'vx',label:'Horizontal velocity v<sub>x</sub>',lvl:'honors',unit:'m/s',d:1,min:0,max:null,get(sim){const s=mainShot(sim.st);return s?(s.done?0:s.vx):0;}},
    {id:'vy',label:'Vertical velocity v<sub>y</sub>',lvl:'honors',unit:'m/s',d:1,min:-40,max:null,get(sim){const s=mainShot(sim.st);return s?(s.done?0:s.vy):0;}},
    {id:'best',label:'Farthest shot so far',text:true,get(sim){let bx=-1;const L=sim.st.shots.filter(s=>s.done);L.forEach(s=>{if(s.x>bx)bx=s.x;});if(!L.length)return '—';
      const a=[...new Set(L.filter(s=>s.x>bx-0.05).map(s=>s.ang))].sort((x,y)=>x-y);return a.map(x=>x+'°').join(' and ')+(a.length>1?' (tie)':'')+', '+bx.toFixed(1)+' m';}},
    {id:'twinT',label:'Dropped twin: time in the air',unit:'s',d:2,max:null,get(sim){const t=sim.st.twin;return t?t.ft:null;}},
    {id:'gate',label:'Photogate time over 40 cm',unit:'s',d:3,max:null,get(sim){const s=mainShot(sim.st);return s&&s.gateT!==null&&(!s.rolling||s.x>=GATE1)?s.gateT:null;}},
    {id:'cupOff',label:'Landing point minus cup',unit:'cm',d:0,max:null,get(sim){const s=mainShot(sim.st);return s&&s.done&&s.gateT!==null?(s.x-sim.p.cup)*100:null;}},
    {id:'score',label:'Target score',text:true,get(sim){const st=sim.st;return st.hits+' hit'+(st.hits===1?'':'s')+' in '+st.tries+' shot'+(st.tries===1?'':'s');}},
    {id:'tgt',label:'Target distance',unit:'m',d:0,max:null,get(sim){return sim.st.target?sim.st.target.x:null;}},
    {id:'tUp',label:'Launch to peak',lvl:'ap',unit:'s',d:2,max:null,get(sim){const s=mainShot(sim.st);return s&&s.tPeak!==null&&!s.rolling?s.tPeak:null;}},
    {id:'tDown',label:'Peak to landing',lvl:'ap',unit:'s',d:2,max:null,get(sim){const s=mainShot(sim.st);return s&&s.done&&s.tPeak!==null?s.tLand-s.tPeak:null;}},
    {id:'rEq',label:'Range equation v²sin2θ/g',lvl:'ap',unit:'m',d:1,max:null,get(sim){const p=sim.p;return p.v0*p.v0*Math.sin(2*p.ang*Math.PI/180)/G;}}
  ],
  graphs:[{id:'pos',label:'Distance and height',lines:['dist','ht']},{id:'vel',label:'Velocity components',lvl:'honors',lines:['vx','vy']}],
  defaultGraph:'pos',
  onLevel(sim){sync(sim);},
  narrate(sim){const st=sim.st,s=mainShot(st),p=sim.p,hon=atLeast('honors'),ap=atLeast('ap');
    if(!s)return 'Press <b>Fire</b> to launch. Change the angle and speed first if you like.';
    const tw=st.twin;
    if(s.rolling)return `The marble rolls across the table at a steady ${f1(s.v)} m/s. The two photogates time it over 40 cm, so you can work out its speed: <b>v = distance ÷ time</b>.`;
    if(!s.done){const up=s.vy>0.05;
      let t=up?(hon?`Rising: gravity removes 9.8 m/s of upward velocity every second (v<sub>y</sub> = ${f1(s.vy)} m/s now).`:`The ball is rising but slowing down, because gravity pulls it down the whole time.`)
             :(hon?`Falling: the downward velocity grows by 9.8 m/s every second (v<sub>y</sub> = ${f1(s.vy)} m/s now).`:`The ball is falling and speeding up as gravity pulls it down.`);
      if(s.air)t+=` Air resistance also slows the horizontal motion (v<sub>x</sub> = ${f1(s.vx)} m/s, down from ${f1(s.v*Math.cos(s.ang*Math.PI/180))}).`;
      else t+=hon?` The horizontal velocity stays <b>${f1(s.vx)} m/s</b> the whole flight: no horizontal force acts.`:` Sideways, it keeps the <b>same speed</b> the whole time: the strobe dots stay evenly spaced left to right.`;
      if(tw&&!tw.done&&s.ang===0)t+=' The dropped twin stays level with it.';
      return t;}
    let t=`Landed <b>${f1(s.x)} m</b> away after ${f2(s.tLand)} s in the air, `+(s.peakY-s.h0<0.01?`starting ${f1(s.h0)} m up.`:`${f1(s.peakY)} m at its highest.`);
    if(p.mode==='table'){const pr=s.v*Math.sqrt(2*s.h0/G),off=(s.x-p.cup)*100;
      t+=Math.abs(off)<=4?` <b>It lands in the cup!</b>`:` It misses the cup by ${Math.abs(off).toFixed(0)} cm (${off>0?'past':'short of'} it).`;
      if(hon)t+=` Prediction: t = √(2h/g) = ${f2(Math.sqrt(2*s.h0/G))} s, so x = v·t = ${f2(pr)} m.`;}
    else if(p.mode==='target'&&st.target){t+=s.hit?` <b>Hit!</b> The bull’s-eye is ${st.target.x} m out.`:` The target is at ${st.target.x} m: you were ${f1(Math.abs(s.x-st.target.x))} m ${s.x<st.target.x?'short':'long'}.`;}
    else if(s.fan){let b=null;st.shots.forEach(q=>{if(q.fan&&q.done&&(!b||q.x>b.x))b=q;});if(b)t=`Of the fan, the <b>${b.ang}° shot went farthest</b> (${f1(b.x)} m).`+(s.air?' Air resistance pulls the best angle below 45°.':(hon?' Angles the same distance from 45° (30° and 60°) land together, because sin 2θ is the same.':' Angles just as far above and below 45° tie.'));}
    if(tw&&tw.done&&s.ang===0&&!s.air&&p.h0>0)t+=` The dropped twin landed at the same moment: horizontal motion does not change how long the fall takes.`;
    else if(tw&&tw.done&&s.ang>0)t+=` The twin landed first because the launched ball started with an upward velocity.`;
    if(ap&&!s.air&&s.h0===0&&s.ang>0&&!s.fan)t+=` Check: R = v²sin2θ/g = ${f1(s.v*s.v*Math.sin(2*s.ang*Math.PI/180)/G)} m.`;
    if(ap&&s.air&&s.tPeak)t+=` Up took ${f2(s.tPeak)} s; down took ${f2(s.tLand-s.tPeak)} s.`;
    return t;},
  tour:[
    {title:'The launcher',text:'The cannon sets the launch velocity: a speed and an angle above the horizontal. The ball leaves from the ground at 18 m/s and 40°.',pause:true,
      focus:sim=>{const v=sim.vis.v;return [v.ox-50,GY-110,140,130];},setup(sim){BioLab.reset(sim);}},
    {title:'Strobe dots',text:'Every 0.25 s a dot marks where the ball was. Left to right the dots are <b>evenly spaced</b>. Up and down they bunch up near the top, where the ball is slow vertically.',speed:0.35,
      focus:[0,30,800,GY-20],setup(sim){BioLab.setValues(sim,{vecs:false});BioLab.reset(sim);}},
    {title:'Velocity arrows',text:{bio:'Arrows show the velocity at each dot. The ball always keeps moving forward; only its up-and-down motion changes.',honors:'Blue arrows are v<sub>x</sub>: all the same length. Red arrows are v<sub>y</sub>: they shrink by 9.8 m/s each second, vanish at the top, then grow downward.'},speed:0.35,
      focus:[0,30,800,GY-20],setup(sim){BioLab.setValues(sim,{vecs:true});BioLab.reset(sim);}},
    {title:'The top of the flight',text:{bio:'At the highest point the ball stops going up, but it is still moving forward. Its speed is not zero.',honors:'At the peak v<sub>y</sub> = 0, but v<sub>x</sub> is unchanged, so the speed there equals v<sub>x</sub> = v cos θ.'},speed:0.2,
      focus:sim=>{const s=mainShot(sim.st),v=sim.vis.v;const px=s?v.ox+s.peakX*v.s:400;return [px-110,40,220,180];},setup(sim){BioLab.setValues(sim,{vecs:true});BioLab.reset(sim);}},
    {title:'Measure the range',text:'The ruler along the ground is in meters. The pill shows the landing distance; the stopwatch shows the time in the air. Click a strobe dot (or press <b>Probe next dot</b>) to read its position and velocity.',pause:false,speed:1,
      focus:[0,GY-30,800,64],setup(sim){BioLab.setValues(sim,{vecs:false});BioLab.reset(sim);}},
    {title:'Compare angles',text:{bio:'The fan fires the same speed at angles from 20° to 70°. The 45° shot goes farthest. 30° and 60° land in the same spot.',honors:'R = v²sin2θ/g. sin 2θ peaks at θ = 45°, and complementary angles (30° and 60°) give the same sin 2θ, so they tie.'},speed:0.6,
      focus:[0,30,800,GY+30],setup(sim){BioLab.reset(sim);sim.st.shots=[];sim.st.main=-1;fan(sim);}},
    {title:'Drop versus launch',text:'Fire sideways from 10 m while a twin drops straight down. Both land at the same moment: the sideways motion has nothing to do with the fall.',speed:0.3,
      focus:sim=>{const v=sim.vis.v;return [v.ox-70,30,360,GY-10];},setup(sim){BioLab.setValues(sim,{h0:10,ang:0,v0:12,twin:true});BioLab.reset(sim);}},
    {lvl:'honors',title:'Add air resistance',text:{honors:'Drag pushes against the velocity. A ping-pong ball slows quickly: it lands far short of the no-air path and comes down steeper than it went up.',ap:'Drag a = −(ρC<sub>d</sub>A/2m)|v|v couples the components. The descent takes longer than the climb, and the best angle drops below 45°.'},speed:0.5,
      focus:[0,30,800,GY+30],setup(sim){BioLab.setValues(sim,{h0:0,ang:45,v0:20,twin:false,air:false,obj:'pingpong'});BioLab.reset(sim);BioLab.setValues(sim,{air:true});fire(sim);}}
  ],
  onTourExit(sim){const base={};SIM.controls.forEach(c=>base[c.id]=c.def);BioLab.setValues(sim,base);BioLab.reset(sim);},
  challenges:[
    {lvl:'bio',q:'Same launch speed, level ground, no air. Which angle sends the ball farthest?',choices:['30°','45°','60°','75°'],correct:1,
      baseline:{mode:'free',v0:18,h0:0,ang:40},baselineAction:'clear',changeAction:'fan',changeText:'Firing a fan of angles from 20° to 70°',at:0.4,reveal:4.6,watch:'dist',
      explain:{bio:'45° went farthest. Lower angles have lots of forward speed but come down quickly; higher angles stay up longer but move forward slowly. 45° balances the two.',
        honors:'R = v²sin2θ/g, and sin 2θ is largest (1) when 2θ = 90°, so θ = 45°. At 18 m/s that is 18²/9.8 = 33.1 m.',ap:'dR/dθ = (2v²/g)cos2θ = 0 at θ = 45°. This only holds on level ground with no drag.'}},
    {lvl:'bio',q:'From 10 m up, one ball is fired straight sideways while its twin is dropped at the same moment. Which lands first?',choices:['The dropped ball','The ball fired sideways','They land at the same time'],correct:2,
      baseline:{mode:'free',h0:10,ang:0,v0:12,twin:true},baselineAction:'clear',changeAction:'fire',changeText:'Fired and dropped together',at:0.4,reveal:3.0,watch:'ht',
      explain:{bio:'They land together. The sideways ball travels farther, but it falls at the same rate, because gravity pulls both down the same way.',
        honors:'Both start with v<sub>y</sub> = 0 and fall 10 m: t = √(2h/g) = 1.43 s. The horizontal velocity does not appear in that equation.',ap:'With no drag the x and y equations are independent. (With quadratic drag they are coupled, and the fired ball lands slightly later.)'}},
    {lvl:'bio',q:'Swap the cannonball (17.6 kg) for a golf ball (46 g). Same angle and speed, no air. Which goes farther?',choices:['The cannonball','The golf ball','They land in the same place'],correct:2,
      baseline:{mode:'free',obj:'cannon',v0:18,ang:40,h0:0},change:{obj:'golf'},changeAction:'fire',changeText:'Golf ball fired',at:3.0,reveal:6.0,watch:'dist',
      explain:{bio:'Same spot. Without air, every object falls with the same acceleration, so mass does not change the path.',honors:'a = F/m = mg/m = g. Mass cancels, so the trajectory depends only on v, θ and the launch height.',ap:'Mass enters only through drag, a<sub>drag</sub> = (ρC<sub>d</sub>A/2m)v². Turn on air resistance and the heavy cannonball wins.'}},
    {lvl:'honors',q:'Fire at 30°, then at 60°, at the same speed on level ground. Which goes farther?',choices:['30°','60°','Same distance'],correct:2,
      baseline:{mode:'free',ang:30,v0:18,h0:0},change:{ang:60},changeAction:'fire',changeText:'Now firing at 60°',at:2.6,reveal:6.6,watch:'dist',
      explain:{honors:'Same distance (28.6 m). sin(60°) = sin(120°), so complementary angles give the same range. The 60° shot goes higher and stays up longer, but moves forward more slowly.',ap:'R(θ) = R(90° − θ) because sin 2θ = sin(180° − 2θ). The 60° flight lasts √3 times longer with a v<sub>x</sub> that is √3 times smaller.'}},
    {lvl:'honors',q:'Watch the velocity graph during the flight. What happens to the horizontal velocity v<sub>x</sub>?',choices:['It drops to zero at the top','It stays the same','It grows as the ball falls'],correct:1,
      baseline:{mode:'free',ang:50,v0:20,h0:0,vecs:true},change:{vecs:true},at:0.2,reveal:3.4,watch:'vx',
      explain:{honors:'v<sub>x</sub> stays 12.9 m/s (20 cos 50°) all the way. Only v<sub>y</sub> changes, by −9.8 m/s every second. At the top v<sub>y</sub> is zero, not v<sub>x</sub>.',ap:'a<sub>x</sub> = 0 so v<sub>x</sub> is constant; a<sub>y</sub> = −g so v<sub>y</sub>(t) = v sin θ − gt, a straight line with slope −9.8 m/s².'}},
    {lvl:'honors',q:'Double the launch speed from 10 to 20 m/s at the same angle. The range becomes:',choices:['Twice as far','Four times as far','About 1.4 times as far'],correct:1,
      baseline:{mode:'free',ang:40,v0:10,h0:0},change:{v0:20},changeAction:'fire',changeText:'Fired at 20 m/s',at:2.4,reveal:5.8,watch:'dist',
      explain:{honors:'About 10 m becomes about 40 m. Doubling v doubles the time in the air <i>and</i> doubles v<sub>x</sub>, so R ∝ v².',ap:'R = v²sin2θ/g: twice v gives four times R. The max height, v²sin²θ/2g, also quadruples.'}},
    {lvl:'ap',q:'Air resistance on, ping-pong ball at 20 m/s. Which angle in the fan goes farthest?',choices:['Exactly 45°','Less than 45°','More than 45°'],correct:1,
      baseline:{mode:'free',air:true,obj:'pingpong',cd:0.5,dia:0.04,v0:20,h0:0},baselineAction:'clear',changeAction:'fan',changeText:'Firing a fan with drag',at:0.4,reveal:4.4,watch:'dist',
      explain:{ap:'The 35° shot wins (about 10.0 m versus 9.6 m at 45°). Drag hurts most where the ball spends the most time and speed, so a flatter shot that reaches the ground sooner keeps more of its horizontal velocity. A heavy cannonball barely shifts from 45°; a light ping-pong ball shifts a lot, because drag per unit mass, ρC<sub>d</sub>A/2m, is far larger.'}},
    {lvl:'ap',q:'With air resistance on, which half of a ping-pong ball’s flight takes longer?',choices:['Launch to peak','Peak to landing','Both halves take the same time'],correct:1,
      baseline:{mode:'free',air:true,obj:'pingpong',cd:0.5,dia:0.04,v0:20,ang:60,h0:0},baselineAction:'clear',changeAction:'fire',changeText:'Fired with drag',at:0.4,reveal:4.4,watch:'ht',
      explain:{ap:'The way down takes longer. Going up, drag and gravity both point down, so v<sub>y</sub> drops faster than g alone. Coming down, drag points up against gravity, so the ball speeds up more slowly than g. The path is no longer a symmetric parabola.'}}
  ],
  lab:{bio:'<p><b>Question:</b> How does launch angle change how far a projectile goes?</p><ol><li>Set speed to 18 m/s and height to 0. Leave air resistance off.</li><li>Fire at 15°, 30°, 45°, 60° and 75°. After each landing, press <b>Record trial</b>.</li><li>Graph horizontal distance against angle.</li></ol><p>Write a claim about the best angle, and explain why 30° and 60° tie.</p>',
    honors:'<p><b>Question:</b> Can you predict where a marble rolling off a table will land?</p><ol><li>Choose <b>Off a table</b>. Press <b>Fire</b> and read the photogate time over 40 cm. Calculate v = 0.40 m ÷ t.</li><li>Measure the table height on the height ruler. Calculate the fall time t = √(2h/g).</li><li>Predict the landing distance x = v·t. Move the cup there, then fire again.</li><li>Repeat for three ramp speeds and record each trial.</li></ol><p>Report your percent error and the biggest source of error in a real lab.</p>',
    ap:'<p><b>Question:</b> How does air resistance change the optimum launch angle?</p><ol><li>Turn on air resistance. Choose the golf ball and 35 m/s.</li><li>Press <b>Fire a fan</b>, find the farthest angle, then fine-tune ±1° with single shots. Record each trial.</li><li>Repeat for the cannonball and the ping-pong ball.</li></ol><p>Write a CER: claim how the best angle depends on the drag-to-weight ratio, using your trials and the AP readouts for time up versus time down.</p>'},
  terms:[{t:'Projectile',d:'An object moving under gravity alone after it is launched.'},{t:'Trajectory',d:'The path a projectile follows; a parabola without air.'},
    {t:'Range',d:'The horizontal distance from launch to landing.'},{t:'Launch angle',d:'The angle of the launch velocity above the horizontal.'},
    {t:'Components',lvl:'honors',d:'v<sub>x</sub> = v cos θ and v<sub>y</sub> = v sin θ: the horizontal and vertical parts of the velocity.'},
    {t:'Independence of motion',lvl:'honors',d:'Horizontal and vertical motions happen at the same time but do not affect each other (without drag).'},
    {t:'Drag',lvl:'honors',d:'Air resistance, F = ½ρC<sub>d</sub>Av², pointing opposite the velocity.'},
    {t:'Range equation',lvl:'ap',d:'R = v²sin2θ/g, for launch and landing at the same height with no drag.'}],
  about:'<p>Each shot is integrated with fourth-order Runge–Kutta in 4 ms steps: a = (0, −g) without air, plus a<sub>drag</sub> = −(ρC<sub>d</sub>A/2m)|v|v with air, using ρ = 1.2 kg/m³ and g = 9.8 m/s². Landing and the peak are found by interpolating inside the step, and strobe dots fall exactly on multiples of the strobe interval.</p><p>Simplified: no spin, lift or wind; drag uses one constant C<sub>d</sub>; the car is treated as a 2.2 m² sliding block in the air. The marble rolls at constant speed on the table, and its rolling is not modeled. Balls are drawn larger than their real size. Objects stop when they touch the ground (no bounce).</p>',
  onClick(sim,x,y){const st=sim.st,s=mainShot(st),v=sim.vis.v;if(!v)return;
    if(s){let bi=-1,bd=16;s.dots.forEach((d,i)=>{const dd=Math.hypot(v.ox+d.x*v.s-x,GY-d.y*v.s-y);if(dd<bd){bd=dd;bi=i;}});if(bi>=0){st.probe=bi;return;}}
    if(y>GY+2)return;if(st.marks.length>=2)st.marks=[];st.marks.push({x:(x-v.ox)/v.s,y:(GY-y)/v.s});},
  initVis(sim){sim.vis.v=fitView(sim);sync(sim);},
  draw(sim,ctx,vdt,k){const p=sim.p,st=sim.st,W=800,H=450;if(!sim.vis.v)sim.vis.v=fitView(sim);
    const tv=fitView(sim),v=sim.vis.v;v.s=lerp(v.s,tv.s,0.18);v.ox=lerp(v.ox,tv.ox,0.18);if(Math.abs(v.s-tv.s)<0.002)v.s=tv.s;
    const X=x=>v.ox+x*v.s,Y=y=>GY-y*v.s,hon=atLeast('honors');
    // sky and ground
    const g=ctx.createLinearGradient(0,0,0,GY);g.addColorStop(0,PAL['cv-bg2']);g.addColorStop(1,PAL['cv-bg']);ctx.fillStyle=g;ctx.fillRect(0,0,W,GY);
    ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,GY,W,H-GY);ctx.fillStyle=PAL['s3'];ctx.globalAlpha=0.55;ctx.fillRect(0,GY,W,3);ctx.globalAlpha=1;
    // ground ruler
    const decOf=q=>Math.abs(q-Math.round(q))<1e-9?0:Math.abs(q*10-Math.round(q*10))<1e-9?1:2;const stp=niceStep(v.s,46*Math.min(k,1.4)),dec=decOf(stp);ctx.fillStyle=PAL['cv-ruler'];ctx.fillRect(0,GY+6,W,30);ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.strokeRect(0.5,GY+6.5,W-1,29);
    ctx.strokeStyle=PAL['cv-ink'];const x0r=Math.ceil(-v.ox/v.s/stp)*stp;
    for(let xm=x0r;X(xm)<W;xm+=stp/5){const xp=X(xm),major=Math.abs(xm/stp-Math.round(xm/stp))<1e-6;ctx.beginPath();ctx.moveTo(xp,GY+6);ctx.lineTo(xp,GY+6+(major?11:5));ctx.lineWidth=major?1.4:0.8;ctx.stroke();
      if(major&&xp>14&&xp<W-14)txt(ctx,(Math.abs(xm)<1e-9?0:xm).toFixed(dec),xp,GY+31,{s:11.5*k,a:'center',c:PAL['cv-ink']});}
    txt(ctx,'m',W-8,GY+31,{s:11*k,a:'right',c:PAL['cv-soft']});
    // height ruler
    const hs=niceStep(v.s,34*Math.min(k,1.4));ctx.fillStyle=PAL['cv-ruler'];ctx.globalAlpha=0.85;ctx.fillRect(4,24,34,GY-24);ctx.globalAlpha=1;ctx.strokeStyle=PAL['line'];ctx.strokeRect(4.5,24.5,33,GY-24.5);
    ctx.strokeStyle=PAL['cv-ink'];for(let ym=0;Y(ym)>28;ym+=hs/5){const yp=Y(ym),major=Math.abs(ym/hs-Math.round(ym/hs))<1e-6;ctx.beginPath();ctx.moveTo(38,yp);ctx.lineTo(38-(major?10:5),yp);ctx.lineWidth=major?1.4:0.8;ctx.stroke();
      if(major&&ym>0&&yp>36)txt(ctx,ym.toFixed(decOf(hs)),24,yp,{s:10.5*k,a:'center',b:'middle'});}
    txt(ctx,'height (m)',44,18,{s:11*k,c:PAL['cv-soft']});
    // target or cup
    if(p.mode==='target'&&st.target){const tx=X(st.target.x),tw=st.target.w*v.s/2;
      [[1,PAL['s1']],[0.66,'#fff'],[0.33,PAL['s1']]].forEach(r=>{ctx.fillStyle=r[1];ctx.beginPath();ctx.ellipse(tx,GY+1,tw*r[0],Math.max(3,tw*r[0]*0.22),0,0,6.29);ctx.fill();});
      ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(tx,GY);ctx.lineTo(tx,GY-46);ctx.stroke();ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.moveTo(tx,GY-46);ctx.lineTo(tx+22,GY-39);ctx.lineTo(tx,GY-32);ctx.fill();
      txt(ctx,st.target.x+' m',tx,GY-52,{s:12*k,w:700,a:'center'});}
    if(p.mode==='table'){const cx=X(p.cup),cw=Math.max(10,0.09*v.s),ch=Math.max(12,0.11*v.s);ctx.fillStyle=PAL['s2'];ctx.beginPath();ctx.moveTo(cx-cw/2,GY-ch);ctx.lineTo(cx+cw/2,GY-ch);ctx.lineTo(cx+cw*0.38,GY);ctx.lineTo(cx-cw*0.38,GY);ctx.closePath();ctx.fill();
      txt(ctx,'cup',cx,GY-ch-8,{s:12*k,w:700,a:'center'});
      // table, ramp and photogates
      const ty=Y(p.h0),tl=X(-0.8);ctx.fillStyle='#8a6a45';ctx.fillRect(tl,ty,X(0)-tl,6);ctx.fillRect(tl+6,ty+6,6,GY-ty-6);ctx.fillRect(X(0)-12,ty+6,6,GY-ty-6);
      [GATE0,GATE1].forEach((gx,i)=>{const xp=X(gx);ctx.fillStyle=PAL['cv-lamp'];ctx.fillRect(xp-3,ty-26,6,26);ctx.fillRect(xp-9,ty-30,18,6);ctx.strokeStyle=PAL['s1'];ctx.globalAlpha=0.6;ctx.setLineDash([2,3]);ctx.beginPath();ctx.moveTo(xp,ty-24);ctx.lineTo(xp,ty-2);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;});
      txt(ctx,'photogates 40 cm apart',(X(GATE0)+X(GATE1))/2,ty-38,{s:11.5*k,a:'center',c:PAL['cv-soft']});}
    else{// launcher
      const cx=X(0),cy=Y(p.h0);if(p.h0>0){ctx.fillStyle='#8c7a66';ctx.fillRect(cx-20,cy+8,40,GY-cy-8);ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=1;for(let yy=cy+16;yy<GY;yy+=10){ctx.beginPath();ctx.moveTo(cx-20,yy);ctx.lineTo(cx+20,yy);ctx.stroke();}}
      ctx.save();ctx.translate(cx,cy);ctx.rotate(-p.ang*Math.PI/180);ctx.fillStyle='#3d4148';rr(ctx,-10,-8,52,16,6);ctx.fill();ctx.fillStyle='#2a2d33';ctx.fillRect(38,-9,8,18);ctx.restore();
      ctx.fillStyle='#6b4a2b';ctx.beginPath();ctx.arc(cx,cy+3,10,0,6.29);ctx.fill();ctx.strokeStyle='#3b2a19';ctx.lineWidth=2;ctx.stroke();
      // angle arc
      ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+70,cy);ctx.stroke();ctx.setLineDash([]);
      ctx.beginPath();ctx.arc(cx,cy,56,-p.ang*Math.PI/180,0);ctx.stroke();txt(ctx,p.ang+'°',cx+62,cy-Math.min(p.ang,60)/60*22-4,{s:12*k,w:700});}
    // traces
    const m=mainShot(st),vsc=m?58/Math.max(m.v,1):3,placed=[];
    st.shots.forEach((s,i)=>{const isM=i===st.main,col=s.air&&!s.fan?PAL['s5']:serColor6(s.col);ctx.globalAlpha=isM?1:(s.fan?0.75:0.4);
      ctx.strokeStyle=col;ctx.lineWidth=isM?2.4:1.6;ctx.beginPath();s.trail.forEach((q,j)=>{const xx=X(q[0]),yy=Y(q[1]);j?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);});if(!s.done&&!s.rolling)ctx.lineTo(X(s.x),Y(s.y));ctx.stroke();
      if(isM||!s.fan){ctx.fillStyle=col;s.dots.forEach(d=>{ctx.beginPath();ctx.arc(X(d.x),Y(d.y),isM?3.6:2.6,0,6.29);ctx.fill();});}
      ctx.globalAlpha=1;
      if(s.done&&!s.rolling){const lab=(s.fan||!isM?s.ang+'°: ':'')+f1(s.x)+' m';ctx.font='700 '+(11.5*k)+'px '+FONT;const w=ctx.measureText(lab).width+12,lx=X(s.x),ly=GY-14-(isM?8:0);
        if(isM||s.fan||st.shots.length<8){if(placeLabel(placed,lx-w/2,ly-10,w,20)){pill(ctx,lab,lx,ly,isM?col:PAL['card'],isM?'#fff':PAL['cv-ink'],11.5*k);}}}});
    // velocity arrows at the dots of the main shot
    if(m&&p.vecs){m.dots.forEach(d=>{const xx=X(d.x),yy=Y(d.y);if(hon){arrow(ctx,xx,yy,xx+d.vx*vsc,yy,PAL['s2'],2.2);arrow(ctx,xx,yy,xx,yy-d.vy*vsc,PAL['s1'],2.2);}else arrow(ctx,xx,yy,xx+d.vx*vsc,yy-d.vy*vsc,PAL['s4'],2.4);});
      const lx=W-210,ly=58;ctx.fillStyle=PAL['card'];ctx.globalAlpha=0.92;rr(ctx,lx,ly-14,196,hon?46:28,8);ctx.fill();ctx.globalAlpha=1;
      if(hon){arrow(ctx,lx+10,ly,lx+38,ly,PAL['s2'],2.2);txt(ctx,'vₓ horizontal',lx+46,ly+4,{s:12*k});arrow(ctx,lx+24,ly+26,lx+24,ly+10,PAL['s1'],2.2);txt(ctx,'vᵧ vertical',lx+46,ly+22,{s:12*k});}
      else{arrow(ctx,lx+10,ly,lx+38,ly,PAL['s4'],2.4);txt(ctx,'velocity',lx+46,ly+4,{s:12*k});}}
    // peak marker
    if(m&&!m.rolling&&m.tPeak!==null&&m.tPeak>0&&(m.done||m.vy<0)){const px=X(m.peakX),py=Y(m.peakY);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px,GY);ctx.stroke();ctx.setLineDash([]);
      const lab='max height '+f1(m.peakY)+' m';ctx.font='600 '+(11.5*k)+'px '+FONT;const w=ctx.measureText(lab).width;const ly=Math.max(16,py-16);if(placeLabel(placed,px-w/2-4,ly-9,w+8,18))txt(ctx,lab,px,ly,{s:11.5*k,w:600,a:'center',c:PAL['cv-ink']});}
    // twin
    const tw=st.twin;if(tw){const off=p.mode==='table'?0:-30;ctx.globalAlpha=0.9;ctx.fillStyle=PAL['cv-soft'];tw.dots.forEach(d=>{ctx.beginPath();ctx.arc(X(d.x)+off,Y(d.y),3,0,6.29);ctx.fill();});ctx.globalAlpha=1;
      if(!(tw.wait>0))sprite(ctx,tw.obj,X(tw.x)+off,Y(tw.y)-(tw.done?Math.max(6,OBJ[tw.obj].d*v.s/2):0),Math.max(6,OBJ[tw.obj].d*v.s/2),0);
      if(!(tw.wait>0)&&off)txt(ctx,'dropped',X(0)+off-8,Math.max(16,Y(tw.y)-14),{s:11*k,a:'right',c:PAL['cv-soft']});}
    // balls
    st.shots.forEach((s,i)=>{if(i!==st.main&&s.done)return;const rad=Math.max(OBJ[s.obj].d*v.s/2,0);const yy=Y(s.y)-(s.done?Math.max(rad,6):0)-(s.rolling?Math.max(rad,6):0);sprite(ctx,s.obj,X(s.x),yy,rad,s.done?0:Math.atan2(s.vy,s.vx));});
    // probe
    if(m&&st.probe>=0&&st.probe<m.dots.length){const d=m.dots[st.probe],xx=X(d.x),yy=Y(d.y);ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(xx,yy,9,0,6.29);ctx.stroke();
      const rows=['t = '+f2(d.t)+' s','x = '+f2(d.x)+' m,  y = '+f2(d.y)+' m'];if(hon)rows.push('vₓ = '+f1(d.vx)+',  vᵧ = '+f1(d.vy)+' m/s');else rows.push('speed = '+f1(Math.hypot(d.vx,d.vy))+' m/s');
      const bw=190*Math.min(k,1.3),bh=(rows.length*17+12)*Math.min(k,1.3),bx=clamp(xx+14,48,W-bw-6),by=clamp(yy-bh-12,30,GY-bh-6);ctx.fillStyle=PAL['card'];ctx.globalAlpha=0.95;rr(ctx,bx,by,bw,bh,8);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=PAL['rj'];ctx.lineWidth=1.5;ctx.stroke();
      rows.forEach((r,i)=>txt(ctx,r,bx+10,by+18*Math.min(k,1.3)+i*17*Math.min(k,1.3),{s:12*Math.min(k,1.3),w:i?400:700}));}
    // click marks
    st.marks.forEach((q,i)=>{const xx=X(q.x),yy=Y(q.y);ctx.strokeStyle=PAL['s5'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(xx-7,yy);ctx.lineTo(xx+7,yy);ctx.moveTo(xx,yy-7);ctx.lineTo(xx,yy+7);ctx.stroke();
      txt(ctx,'('+f1(q.x)+', '+f1(q.y)+') m',xx+9,yy-8,{s:11.5*k,w:600,c:PAL['s5']});});
    if(st.marks.length===2){const a=st.marks[0],b=st.marks[1];ctx.strokeStyle=PAL['s5'];ctx.setLineDash([5,4]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(X(a.x),Y(a.y));ctx.lineTo(X(b.x),Y(b.y));ctx.stroke();ctx.setLineDash([]);
      pill(ctx,'Δx '+f1(b.x-a.x)+' m · Δy '+f1(b.y-a.y)+' m',(X(a.x)+X(b.x))/2,(Y(a.y)+Y(b.y))/2-14,PAL['s5'],'#fff',11.5*k);}
    // stopwatch
    const sw=m?m.ft:0,kk=Math.min(k,1.6);ctx.save();ctx.translate(W-8-142*kk,8);ctx.scale(kk,kk);const bx=0,by=0;ctx.fillStyle=PAL['card'];ctx.globalAlpha=0.94;rr(ctx,bx,by,142,34,9);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
    ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(bx+18,by+18,9,0,6.29);ctx.stroke();ctx.beginPath();ctx.moveTo(bx+18,by+18);const sa=(sw%1)*6.283-1.571;ctx.lineTo(bx+18+7*Math.cos(sa),by+18+7*Math.sin(sa));ctx.stroke();ctx.fillStyle=PAL['cv-ink'];ctx.fillRect(bx+16,by+5,4,3);
    txt(ctx,sw.toFixed(2)+' s',bx+34,by+23,{s:16,w:700});ctx.restore();
    if(p.mode==='table'&&m&&m.gateT!==null&&(!m.rolling||m.x>=GATE1))pill(ctx,'gate time '+m.gateT.toFixed(3)+' s',X((GATE0+GATE1)/2),Y(p.h0)-58,PAL['s4'],'#fff',12*k);
    if(p.mode==='target'&&m&&m.done&&!m.fan&&st.hitShown)pill(ctx,m.hit?'Hit!':'Miss',X(m.x),Math.max(70,Y(m.peakY)+30),m.hit?PAL['s3']:PAL['s1'],'#fff',15*k);
    if(p.mode==='table'&&m&&m.done){const off=Math.abs(m.x-p.cup)*100;pill(ctx,off<=4?'In the cup!':'Missed by '+off.toFixed(0)+' cm',X(m.x),GY-70,off<=4?PAL['s3']:PAL['s1'],'#fff',14*k);}
  }
};
function serColor6(i){return PAL[['s2','s1','s3','s4','s6','s5'][i%6]];}
BioLab.register(SIM);
})();
