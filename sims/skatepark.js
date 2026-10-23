(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor,fmtNum}=BioLab.h;

/* Energy skate park. The skater moves along a track parametrized by arc length s.
   Tangential motion uses gravity's component along the track; speed is then corrected
   from energy bookkeeping (E_total = KE + PE + thermal) so frictionless runs conserve
   energy exactly. Normal force N = m(v²κ + g·n_y) (κ = signed curvature toward the
   rider's side). If N < 0 and the skater is not locked to the track, she leaves it and
   flies as a projectile until she lands; the impact's normal kinetic energy becomes thermal. */
const PLANETS={earth:{g:9.8,l:'Earth'},moon:{g:1.62,l:'Moon'},mars:{g:3.71,l:'Mars'},jupiter:{g:24.8,l:'Jupiter'}};
const NPTS=900;
const sst=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
function fnTrack(f,a,b){const pts=[];const n=2400;for(let i=0;i<=n;i++){const x=a+(b-a)*i/n;pts.push([x,f(x)]);}return pts;}
function rawTrack(name){
  if(name==='halfpipe')return fnTrack(x=>0.2*x*x,-6,6);
  if(name==='ramp')return fnTrack(x=>7.5*(1-sst(-6.5,-2.2,x))+7.5*sst(3.8,6.6,x),-6.6,6.6);
  if(name==='well')return fnTrack(x=>{const u=(x*x-9)/9;return 4*u*u;},-4.65,4.65);
  if(name==='coaster')return fnTrack(x=>7.6*(1-sst(-9,-5.2,x))+7.6*sst(5.6,9,x)+4.2*Math.exp(-Math.pow((x+1.6)/1.5,2))+2.3*Math.exp(-Math.pow((x-2.6)/1.2,2)),-9,9);
  // loop: ramp in, a circle of radius R, ramp out
  const R=2,pts=[];
  for(let i=0;i<=900;i++){const x=-9+9*i/900;pts.push([x,8*(1-sst(-9,-1.2,x))]);}
  for(let i=1;i<=900;i++){const t=-Math.PI/2+2*Math.PI*i/900;pts.push([R*Math.cos(t),R+R*Math.sin(t)]);}
  for(let i=1;i<=900;i++){const x=9*i/900;pts.push([x,8*sst(1.2,9,x)]);}
  return pts;}
const TRACKS={};
function track(name){if(TRACKS[name])return TRACKS[name];const raw=rawTrack(name);const cum=[0];
  for(let i=1;i<raw.length;i++)cum.push(cum[i-1]+Math.hypot(raw[i][0]-raw[i-1][0],raw[i][1]-raw[i-1][1]));
  const L=cum[cum.length-1],ds=L/(NPTS-1),xs=[],ys=[];let j=0;
  for(let i=0;i<NPTS;i++){const s=i*ds;while(j<raw.length-2&&cum[j+1]<s)j++;const f=(s-cum[j])/Math.max(1e-9,cum[j+1]-cum[j]);xs.push(raw[j][0]+(raw[j+1][0]-raw[j][0])*f);ys.push(raw[j][1]+(raw[j+1][1]-raw[j][1])*f);}
  const tx=[],ty=[],th=[];for(let i=0;i<NPTS;i++){const a=Math.max(0,i-1),b=Math.min(NPTS-1,i+1);const dx=xs[b]-xs[a],dy=ys[b]-ys[a],l=Math.hypot(dx,dy)||1;tx.push(dx/l);ty.push(dy/l);th.push(Math.atan2(dy,dx));}
  for(let i=1;i<NPTS;i++){while(th[i]-th[i-1]>Math.PI)th[i]-=2*Math.PI;while(th[i]-th[i-1]<-Math.PI)th[i]+=2*Math.PI;}
  const kap=[];for(let i=0;i<NPTS;i++){const a=Math.max(0,i-2),b=Math.min(NPTS-1,i+2);kap.push((th[b]-th[a])/((b-a)*ds));}
  let xmin=1e9,xmax=-1e9,ymax=0,ymin=0,imin=0;for(let i=0;i<NPTS;i++){xmin=Math.min(xmin,xs[i]);xmax=Math.max(xmax,xs[i]);ymax=Math.max(ymax,ys[i]);if(ys[i]<ys[imin])imin=i;}
  const t={name,xs,ys,tx,ty,kap,ds,L,xmin,xmax,ymax,ymin,imin,loop:name==='loop'};TRACKS[name]=t;return t;}
function at(t,s){const f=clamp(s/t.ds,0,NPTS-1.0001),i=Math.floor(f),u=f-i,j=Math.min(NPTS-1,i+1);
  const tx=t.tx[i]+(t.tx[j]-t.tx[i])*u,ty=t.ty[i]+(t.ty[j]-t.ty[i])*u,l=Math.hypot(tx,ty)||1;
  return {x:t.xs[i]+(t.xs[j]-t.xs[i])*u,y:t.ys[i]+(t.ys[j]-t.ys[i])*u,tx:tx/l,ty:ty/l,nx:-ty/l,ny:tx/l,k:t.kap[i]+(t.kap[j]-t.kap[i])*u};}
function gOf(sim){return PLANETS[sim.p.planet].g;}
function yref(sim){return atLeast('honors')?sim.p.yref:0;}
function locked(sim){return sim.p.track==='coaster'||(atLeast('ap')&&sim.p.lock);}
function startS(t,h0){for(let i=0;i<t.imin;i++){if(t.ys[i]<=h0)return i*t.ds;}return 0;}
function place(sim){const s=sim.st,p=sim.p,t=track(p.track);s.trk=t.name;s.s=startS(t,p.h0);const q=at(t,s.s);s.v=0;s.on=true;s.th=0;s.px=q.x;s.py=q.y;s.vx=0;s.vy=0;s.prevD=0;
  s.E=p.mass*gOf(sim)*(q.y-yref(sim));s.vtop=0;s.N=p.mass*gOf(sim);s.status='On the track';s.crash=0;s.trail=[];s.needPlace=false;s.mass=p.mass;s.g=gOf(sim);s.yref=yref(sim);s.started=sim.t;}
function KE(sim){const s=sim.st;return s.on?0.5*sim.p.mass*s.v*s.v:0.5*sim.p.mass*(s.vx*s.vx+s.vy*s.vy);}
function PE(sim){const s=sim.st;return sim.p.mass*gOf(sim)*(posY(sim)-yref(sim));}
function posY(sim){const s=sim.st;return s.on?at(track(s.trk),s.s).y:s.py;}
function posX(sim){const s=sim.st;return s.on?at(track(s.trk),s.s).x:s.px;}
function speed(sim){const s=sim.st;return s.on?Math.abs(s.v):Math.hypot(s.vx,s.vy);}

const SKATE={
  id:'skatepark',hash:'skatepark',apUnit:3,order:1,tab:'Energy skate park',kind:'Simulation',
  card:'Drop a skater into a half-pipe, a loop or a roller coaster and watch kinetic, potential and thermal energy trade places.',
  title:'Energy skate park',
  lede:{bio:'Release the skater and watch her energy change form: potential energy at the top, kinetic energy at the bottom, and thermal energy when there is friction.',
        honors:'Track kinetic, potential and thermal energy with live bar and pie charts. Move the zero of potential energy and test conservation of energy on any track.',
        ap:'Apply conservation of energy and the work–energy theorem. Predict speed anywhere on the track, find the minimum height for a loop, and watch the normal force decide whether the skater stays on.'},
  scale:'Real scale: the grid squares are 1 m, the skater’s mass is in kilograms and energy is in joules. A 60 kg skater dropping 5 m on Earth turns about 2,900 J of potential energy into kinetic energy.',
  timeScale:1,dtMax:0.002,prewarm:0,sampleDt:0.05,window:20,unit:'s',chChange:1,chReveal:8,
  controls:[
    {id:'track',label:'Track',type:'select',def:'halfpipe',lvl:'bio',options:[{v:'halfpipe',l:'Half-pipe'},{v:'ramp',l:'Ramp to flat ground'},{v:'well',l:'Double well'},{v:'coaster',l:'Roller coaster (locked to the rails)'},{v:'loop',l:'Loop-the-loop (R = 2 m)',lvl:'honors'}],onChange(sim){sim.st.needPlace=true;}},
    {id:'h0',label:'Start height',type:'range',min:1,max:7,step:0.5,def:5,unit:' m',lvl:'bio',onChange(sim){sim.st.needPlace=true;}},
    {id:'mass',label:'Skater mass',type:'range',min:20,max:120,step:5,def:60,unit:' kg',lvl:'bio',onChange(sim){const s=sim.st;if(!s.mass)return;const f=sim.p.mass/s.mass;s.E*=f;s.th*=f;s.mass=sim.p.mass;}},
    {id:'mu',label:'Friction',type:'range',min:0,max:0.3,step:0.01,def:0,unit:'',d:2,lvl:'bio',help:'0 is a perfectly smooth track. Friction turns kinetic energy into thermal energy.'},
    {id:'planet',label:'Location',type:'seg',def:'earth',lvl:'bio',options:[{v:'earth',l:'Earth'},{v:'moon',l:'Moon'},{v:'mars',l:'Mars',lvl:'honors'},{v:'jupiter',l:'Jupiter',lvl:'honors'}],
      onChange(sim){const s=sim.st;if(!s.trk)return;const g=gOf(sim);s.E=KE(sim)+sim.p.mass*g*(posY(sim)-yref(sim))+s.th;s.g=g;}},
    {id:'yref',label:'Height where PE = 0',type:'range',min:0,max:6,step:0.5,def:0,unit:' m',lvl:'honors',help:'Potential energy is measured from this level. Moving it changes the numbers, not the motion.',
      onChange(sim){const s=sim.st;if(s.yref===undefined)return;s.E+=sim.p.mass*gOf(sim)*(s.yref-sim.p.yref);s.yref=sim.p.yref;}},
    {id:'lock',label:'Lock wheels to the track',type:'toggle',def:false,lvl:'ap',help:'Like a roller coaster car. Unlocked, the skater can fly off if the track can’t pull her around a curve.'}
  ],
  actions:[
    {id:'restart',label:'Start over from the top',primary:true,run(sim){place(sim);}},
    {id:'stop',label:'Stop the skater',lvl:'honors',run(sim){const s=sim.st;if(!s.on)return;const q=at(track(s.trk),s.s);s.v=0;s.E=sim.p.mass*gOf(sim)*(q.y-yref(sim))+s.th;}}
  ],
  init(sim){const s={};sim.st=s;place(sim);return s;},
  step(sim,dt){const s=sim.st,p=sim.p;if(s.needPlace||s.trk!==p.track)place(sim);
    const t=track(s.trk),m=p.mass,g=gOf(sim),yr=yref(sim);
    if(s.on){const q=at(t,s.s);const N=m*(s.v*s.v*q.k+g*q.ny);s.N=N;
      if(N<0&&!locked(sim)&&Math.abs(s.v)>0.3){s.on=false;s.px=q.x;s.py=q.y;s.vx=s.v*q.tx;s.vy=s.v*q.ty;s.prevD=0.001;s.status='Off the track';s.N=0;}
      else{if(p.mu>0)s.th+=p.mu*Math.abs(N)*Math.abs(s.v)*dt;
        const at_=-g*q.ty;let v=s.v+at_*dt;let sn=s.s+v*dt;
        if(sn<0){sn=0;v=0;}if(sn>t.L){sn=t.L;v=0;}
        const ke=s.E-s.th-m*g*(at(t,sn).y-yr);
        if(ke<=0){s.v=0;if(p.mu>0&&s.th>s.E-m*g*(q.y-yr)){s.th=Math.max(0,s.E-m*g*(q.y-yr));}}
        else{s.s=sn;const sg=v!==0?Math.sign(v):Math.sign(at_||1);s.v=sg*Math.sqrt(2*ke/m);}
        if(s.status!=='On the track'&&sim.t-(s.landT||0)>1.5)s.status='On the track';}}
    else{s.vy-=g*dt;s.px+=s.vx*dt;s.py+=s.vy*dt;
      // look for the nearest track point and land when crossing to the track's back side
      let best=-1,bd=1e9;for(let i=0;i<NPTS;i+=3){const d=(t.xs[i]-s.px)**2+(t.ys[i]-s.py)**2;if(d<bd){bd=d;best=i;}}
      for(let i=Math.max(0,best-3);i<=Math.min(NPTS-1,best+3);i++){const d=(t.xs[i]-s.px)**2+(t.ys[i]-s.py)**2;if(d<bd){bd=d;best=i;}}
      const q=at(t,best*t.ds),d=(s.px-q.x)*q.nx+(s.py-q.y)*q.ny;
      if((s.prevD>0&&d<=0&&Math.sqrt(bd)<0.8)||s.py<t.ymin-1){const vt=s.vx*q.tx+s.vy*q.ty,vn=s.vx*q.nx+s.vy*q.ny;s.th+=0.5*m*vn*vn;s.crash+=0.5*m*vn*vn;s.on=true;s.s=best*t.ds;s.v=vt;s.status='Landed hard';s.landT=sim.t;
        const ke=s.E-s.th-m*g*(q.y-yr);s.v=ke>0?Math.sign(vt||1)*Math.sqrt(2*ke/m):0;}
      s.prevD=d;}
    s.vtop=Math.max(s.vtop,speed(sim));},
  metrics:[
    {id:'speed',label:'Speed',unit:'m/s',lvl:'bio',min:0,max:15,d:1,get:s=>speed(s)},
    {id:'height',label:'Height',unit:'m',lvl:'bio',min:0,max:8,d:2,get:s=>posY(s)},
    {id:'ke',label:'Kinetic energy',unit:'J',lvl:'bio',min:0,max:null,d:0,get:s=>KE(s)},
    {id:'pe',label:'Potential energy',unit:'J',lvl:'bio',min:0,max:null,d:0,get:s=>PE(s)},
    {id:'th',label:'Thermal energy',unit:'J',lvl:'bio',min:0,max:null,d:0,get:s=>s.st.th},
    {id:'tot',label:'Total energy',unit:'J',lvl:'bio',min:0,max:null,d:0,get:s=>KE(s)+PE(s)+s.st.th},
    {id:'vtop',label:'Top speed so far',unit:'m/s',lvl:'bio',min:0,max:15,d:1,get:s=>s.st.vtop},
    {id:'status',label:'Skater',unit:'',lvl:'honors',text:true,noTrial:true,get:s=>s.st.on?(s.st.status==='Landed hard'?'Landed hard':'On the track'):'Off the track!'},
    {id:'N',label:'Normal force',unit:'N',lvl:'ap',min:0,max:null,d:0,get:s=>s.st.on?Math.abs(s.st.N):0},
    {id:'wf',label:'Work done by friction',unit:'J',lvl:'ap',min:null,max:null,d:0,get:s=>-(s.st.th-s.st.crash)}
  ],
  graphs:[{id:'energy',label:'Energy vs. time',lines:['th','pe','ke','tot'],yl:'Energy (J)'},{id:'speedg',label:'Speed vs. time',lines:['speed']},{id:'heightg',label:'Height vs. time',lines:['height']},{id:'epos',label:'Energy vs. position on the track',custom:true,lvl:'honors'}],
  defaultGraph:'energy',
  plot(sim,ctx,box,id){const s=sim.st,t=track(s.trk),m=sim.p.mass,g=gOf(sim),yr=yref(sim);
    box.T=34;box.H=box.ch-34-40;const pe=t.ys.map(y=>m*g*(y-yr));const Emech=s.E-s.th;const ymax=Math.max(...pe,Emech,10)*1.08,ymin=Math.min(0,...pe);
    const ax=axes(ctx,box,{xmin:0,xmax:t.L,ymin,ymax,xl:'Distance along the track (m)',yl:'Energy (J)'});
    ctx.beginPath();pe.forEach((v,i)=>{const X=ax.X(i*t.ds),Y=ax.Y(v);i?ctx.lineTo(X,Y):ctx.moveTo(X,Y);});ctx.strokeStyle=PAL.s2;ctx.lineWidth=2.5;ctx.stroke();
    ctx.setLineDash([6,4]);ctx.strokeStyle=PAL.fg;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(Emech));ctx.lineTo(ax.X(t.L),ax.Y(Emech));ctx.stroke();ctx.setLineDash([]);
    if(s.on){const x=ax.X(s.s),yp=ax.Y(m*g*(at(t,s.s).y-yr)),ye=ax.Y(Emech);ctx.strokeStyle=PAL.s3;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x,yp);ctx.lineTo(x,ye);ctx.stroke();
      ctx.fillStyle=PAL.s1;ctx.beginPath();ctx.arc(x,yp,6,0,6.29);ctx.fill();}
    legend(ctx,box.L,14,[{label:'Potential energy',color:PAL.s2},{label:'KE + PE',color:PAL.fg,dash:true},{label:'Kinetic (gap)',color:PAL.s3}]);},
  narrate(sim){const s=sim.st,v=speed(sim),y=posY(sim),ke=KE(sim),pe=PE(sim),tot=ke+pe+s.th,hon=atLeast('honors');
    if(!s.on)return '<b>Off the track!</b> The track can’t push hard enough to curve her path at this speed, so only gravity acts and she flies like a projectile.';
    if(s.status==='Landed hard')return '<b>Hard landing.</b> The part of her motion straight into the track is stopped, and that kinetic energy turns into thermal energy and sound.';
    let msg;const t=track(s.trk),yb=t.ys[t.imin];
    if(v<0.25)msg='<b>Turning point.</b> Her speed is zero for an instant, so all her mechanical energy is potential energy ('+Math.round(pe)+' J).';
    else if(y-yb<0.25)msg='<b>At the bottom</b>, nearly all the potential energy has become kinetic energy, so she is fastest here: '+v.toFixed(1)+' m/s.';
    else{const q=at(t,s.s),down=s.v*q.ty<0;msg=down?'<b>Going down:</b> potential energy is turning into kinetic energy, so she speeds up ('+v.toFixed(1)+' m/s).':'<b>Going up:</b> kinetic energy is turning back into potential energy, so she slows down ('+v.toFixed(1)+' m/s).';}
    if(sim.p.mu>0&&s.th>1)msg+=' Friction has turned '+Math.round(s.th)+' J into thermal energy, but the total stays '+Math.round(tot)+' J.';
    else if(hon)msg+=' Total energy: '+Math.round(tot)+' J.';
    return msg;},
  tour:[
    {title:'The track and the skater',text:'The skater starts at rest on the track. Each grid square is 1 meter, so you can read her height directly.',focus:[8,28,576,400],pause:true,setup(sim){place(sim);}},
    {title:'Energy stored by height',text:'At the top she isn’t moving, so all her energy is <b>potential energy</b> (blue bar), stored because of her height.',focus:[592,130,200,300],pause:true},
    {title:'Falling turns PE into KE',text:'Watch the bars in slow motion: as she drops, the blue potential bar shrinks and the green <b>kinetic energy</b> bar grows by the same amount.',focus:[592,130,200,300],speed:0.2},
    {title:'Fastest at the bottom',text:'At the lowest point almost all the energy is kinetic, so the speedometer peaks here.',focus:[592,8,200,130],speed:0.25},
    {title:'Back up the other side',text:'Climbing up, kinetic energy turns back into potential energy. With no friction she reaches the same height she started from.',focus:[8,28,576,400],speed:0.5},
    {title:'Add friction',text:'Now the track has friction. The red <b>thermal energy</b> bar grows, so she rises a little less each time. The total bar never changes: energy isn’t lost, it changes form.',focus:[592,130,200,300],speed:1,setup(sim){BioLab.setValues(sim,{mu:0.08});place(sim);}},
    {lvl:'honors',title:'Choose where PE = 0',text:'Potential energy is measured from a reference height you choose. Raising it makes some PE values negative, but the skater’s motion doesn’t change at all.',focus:[8,28,576,400],speed:1,setup(sim){BioLab.setValues(sim,{mu:0,yref:2});place(sim);}},
    {lvl:'ap',title:'The loop',text:'For a loop of radius R, the skater needs v² ≥ gR at the top, which takes a start height of at least 2.5R = 5 m without friction. From 5.5 m she makes it.',focus:[8,28,576,400],speed:0.5,setup(sim){BioLab.setValues(sim,{yref:0,track:'loop',h0:5.5,lock:false});place(sim);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mu:0,yref:0,track:'halfpipe',h0:5,lock:false});place(sim);},
  challenges:[
    {lvl:'bio',q:'No friction. The skater starts 5 m up one side of the half-pipe. How high does she get on the other side?',choices:['Higher than 5 m','Exactly 5 m','Lower than 5 m'],correct:1,
     baseline:{track:'halfpipe',h0:5,mu:0},changeText:'Watch her height',watch:'heightg',at:0.5,reveal:7,
     explain:'Without friction, no energy leaves as thermal energy. All the kinetic energy turns back into potential energy, so she rises to exactly the height she started from.'},
    {lvl:'bio',q:'Double the skater’s mass from 60 kg to 120 kg. What happens to her top speed at the bottom?',choices:['It doubles','It stays the same','It is cut in half'],correct:1,
     baseline:{track:'halfpipe',h0:5,mu:0,mass:60},change:{mass:120},changeText:'Mass doubled',watch:'speedg',at:0.3,reveal:7,
     explain:'A heavier skater has more potential energy, but she also needs more kinetic energy to move at the same speed. Mass cancels out: v = √(2gh) at the bottom, for any mass.'},
    {lvl:'bio',q:'Add friction to the track. What happens to the total energy?',choices:['Energy is destroyed','It stays the same, but more and more of it becomes thermal energy','The skater gains energy'],correct:1,
     baseline:{track:'halfpipe',h0:5,mu:0},change:{mu:0.1},changeText:'Friction on',watch:'energy',at:1,reveal:9,
     explain:'Friction doesn’t destroy energy. It converts kinetic energy into thermal energy in the wheels and track, so the total bar stays level while the skater’s swings get smaller.'},
    {lvl:'honors',q:'From 5 m on a frictionless track, how fast is the skater going at the bottom?',choices:['About 5 m/s','About 9.9 m/s','About 49 m/s'],correct:1,
     baseline:{track:'halfpipe',h0:5,mu:0},changeText:'Watch the speed',watch:'speedg',at:0.3,reveal:5,
     explain:'mgh = ½mv², so v = √(2gh) = √(2 × 9.8 × 5) ≈ 9.9 m/s. The top-speed readout should agree.'},
    {lvl:'honors',q:'Move the zero of potential energy from the ground up to 3 m. What happens to the skater’s motion?',choices:['She goes higher','Nothing changes; only the PE and total numbers shift','She stops'],correct:1,
     baseline:{track:'halfpipe',h0:5,mu:0,yref:0},change:{yref:3},changeText:'PE = 0 moved to 3 m',watch:'energy',at:1,reveal:7,
     explain:'Only changes in potential energy matter. Moving the reference level subtracts the same amount from PE and the total everywhere, so the motion is identical.'},
    {lvl:'ap',q:'Loop of radius 2 m, no friction, wheels not locked. Starting from 4 m, does the skater make it over the top?',choices:['Yes, 4 m is higher than the 4 m loop','No, she falls off before the top'],correct:1,
     baseline:{track:'loop',h0:4,mu:0,lock:false},changeText:'Watch the loop',watch:'speedg',at:0.3,reveal:6,
     explain:'At the top she needs v² ≥ gR so the track can still push on her. From 4 m she would arrive with zero speed, so the normal force reaches zero earlier and she leaves the track.'},
    {lvl:'ap',instant:true,q:'What is the minimum start height (no friction) for the skater to make it around a loop of radius R?',choices:['2R','2.5R','3R'],correct:1,
     explain:'At the top, mg = mv²/R, so v² = gR. Energy: mgh = mg(2R) + ½m(gR), which gives h = 2.5R = 5 m for this 2 m loop. Try 4.5 m and 5.5 m to check.'},
    {lvl:'ap',instant:true,q:'At the bottom of the half-pipe, how does the normal force compare with her weight mg?',choices:['Less than mg','Equal to mg','Greater than mg'],correct:2,
     explain:'At the bottom she is moving in a circle curving upward, so the net force must point up: N − mg = mv²/r, which makes N greater than mg. Check the normal-force readout.'}
  ],
  lab:{bio:'<p><b>Question:</b> Does start height change the skater’s top speed?</p><ol><li>Use the half-pipe with no friction.</li><li>For start heights 1, 2, 3, 4, 5, 6 and 7 m, press Start over, let her pass the bottom, then Record trial.</li><li>Plot start height (x) against top speed (y).</li></ol><p>Describe the pattern. Does doubling the height double the speed?</p>',
       honors:'<p><b>Question:</b> Does mass affect speed, and where does energy go with friction?</p><ol><li>Record top speed at 5 m for masses 30, 60, 90 and 120 kg.</li><li>Set friction to 0.05 and record the thermal energy after 5, 10 and 15 s.</li></ol><p>Explain both results using conservation of energy.</p>',
       ap:'<p><b>Question:</b> Can you linearize speed vs. height to find g?</p><ol><li>Record top speed for start heights 1–7 m with no friction.</li><li>Calculate v² for each trial and plot v² against h.</li><li>The slope should equal 2g. Repeat on the Moon or Mars.</li></ol><p><b>Claim–evidence–reasoning:</b> Use your slope to determine g and compare it with the accepted value.</p>'},
  terms:[{t:'Kinetic energy (KE)',d:'Energy of motion: ½mv².'},{t:'Potential energy (PE)',d:'Energy stored by height: mgh.'},{t:'Thermal energy',d:'Energy turned into heat by friction.'},{t:'Conservation of energy',d:'Energy changes form but the total stays the same.'},
    {lvl:'honors',t:'Mechanical energy',d:'KE + PE. It stays constant only when there is no friction.'},{lvl:'honors',t:'Reference level',d:'The height you choose for PE = 0.'},
    {lvl:'ap',t:'Work–energy theorem',d:'The net work done on an object equals its change in kinetic energy.'},{lvl:'ap',t:'Normal force',d:'The push of the track, perpendicular to it. It can’t pull, so the skater leaves the track if the needed N would be negative.'},{lvl:'ap',t:'Centripetal acceleration',d:'v²/r toward the center of a curved path.'}],
  about:'<p>The skater is a point mass moving along the track. Gravity’s component along the track speeds her up or slows her down, and her speed is checked every step against energy bookkeeping (KE + PE + thermal = constant), so a frictionless run conserves energy to within a fraction of a joule.</p><p>Friction does work μN·d, where N = m(v²κ + g·cosθ) includes the extra push needed on curves; that work is added to thermal energy. If N would be negative and the skater isn’t locked to the track, she leaves it and moves as a projectile. On landing, the kinetic energy of her motion into the track becomes thermal energy.</p><p>Simplified: no air resistance, no rolling of the wheels, and the skater’s body is treated as a point.</p>',
  initVis(sim){sim.vis.trail=[];},
  draw(sim,ctx,vdt,k,tv){k=Math.min(k,1.4);const s=sim.st,p=sim.p,t=track(s.trk),hon=atLeast('honors'),ap=atLeast('ap');
    // view transform: track fills the left 580 px
    const W=528,H=360,ox=46,oy=402;const sc=Math.min(W/(t.xmax-t.xmin+0.8),H/(Math.max(t.ymax,p.h0)+0.9));const cx=ox+(W-(t.xmax-t.xmin)*sc)/2-t.xmin*sc;
    const X=x=>cx+x*sc,Y=y=>oy-y*sc;
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,oy,590,48);
    // grid
    ctx.strokeStyle=PAL.line;ctx.lineWidth=1;ctx.globalAlpha=0.7;ctx.beginPath();for(let gx=Math.ceil(t.xmin);gx<=t.xmax;gx++){ctx.moveTo(X(gx),oy);ctx.lineTo(X(gx),Y(t.ymax+0.6));}for(let gy=0;gy<=Math.ceil(t.ymax);gy++){ctx.moveTo(X(t.xmin-0.3),Y(gy));ctx.lineTo(X(t.xmax+0.3),Y(gy));}ctx.stroke();ctx.globalAlpha=1;
    for(let gy=0;gy<=Math.ceil(t.ymax);gy+=1)txt(ctx,gy+' m',X(t.xmin-0.35),Y(gy)+4,{s:11*k,c:PAL['cv-soft'],a:'right'});
    // supports
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.globalAlpha=0.5;ctx.beginPath();const step=Math.max(1,Math.round(1.1/t.ds));
    for(let i=0;i<NPTS;i+=step*2){if(t.loop&&Math.abs(t.xs[i])<2.2&&t.ys[i]>0.2)continue;ctx.moveTo(X(t.xs[i]),Y(t.ys[i]));ctx.lineTo(X(t.xs[i]),oy);}ctx.stroke();ctx.globalAlpha=1;
    // track
    ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();for(let i=0;i<NPTS;i++){i?ctx.lineTo(X(t.xs[i]),Y(t.ys[i])):ctx.moveTo(X(t.xs[i]),Y(t.ys[i]));}
    ctx.strokeStyle='#7a4a22';ctx.lineWidth=8;ctx.stroke();ctx.strokeStyle='#c88a4c';ctx.lineWidth=3;ctx.stroke();
    if(p.mu>0){ctx.setLineDash([2,6]);ctx.strokeStyle='#5a3214';ctx.lineWidth=2;ctx.stroke();ctx.setLineDash([]);}
    // reference lines
    ctx.setLineDash([6,5]);ctx.lineWidth=1.5;ctx.strokeStyle=PAL.s2;ctx.beginPath();ctx.moveTo(X(t.xmin),Y(p.h0));ctx.lineTo(X(t.xmax),Y(p.h0));ctx.stroke();
    txt(ctx,'start height '+p.h0.toFixed(1)+' m',X((t.xmin+t.xmax)/2),Y(p.h0)-6,{s:11.5*k,c:PAL.s2,a:'center',w:600});
    if(hon&&p.yref>0){ctx.strokeStyle=PAL.s4;ctx.beginPath();ctx.moveTo(X(t.xmin),Y(p.yref));ctx.lineTo(X(t.xmax),Y(p.yref));ctx.stroke();txt(ctx,'PE = 0 here',X(t.xmin)+4,Y(p.yref)-6,{s:11.5*k,c:PAL.s4,w:600});}
    ctx.setLineDash([]);
    // trail
    const px=posX(sim),py=posY(sim);if(vdt>0){sim.vis.trail.push([px,py]);if(sim.vis.trail.length>90)sim.vis.trail.shift();}
    if(hon){ctx.fillStyle=PAL.s1;sim.vis.trail.forEach((q,i)=>{if(i%6)return;ctx.globalAlpha=0.15+0.5*i/90;ctx.beginPath();ctx.arc(X(q[0]),Y(q[1]),2.5,0,6.29);ctx.fill();});ctx.globalAlpha=1;}
    // skater or cart
    let ang=0,nx=0,ny=1;if(s.on){const q=at(t,s.s);ang=Math.atan2(q.ty,q.tx);nx=q.nx;ny=q.ny;}else{ang=Math.atan2(s.vy,s.vx)*0.3;}
    ctx.save();ctx.translate(X(px),Y(py));ctx.rotate(-Math.atan2(ny,nx)+Math.PI/2);ctx.scale(1.35,1.35);
    if(p.track==='coaster'){ctx.fillStyle='#C11430';rr(ctx,-16,-20,32,16,4);ctx.fill();ctx.fillStyle='#2b2b30';ctx.beginPath();ctx.arc(-10,-3,4,0,6.29);ctx.arc(10,-3,4,0,6.29);ctx.fill();
      ctx.fillStyle='#f2c49b';ctx.beginPath();ctx.arc(-4,-25,5,0,6.29);ctx.fill();ctx.fillStyle='#3a6fb0';ctx.fillRect(-8,-22,8,4);}
    else{ctx.fillStyle='#C11430';rr(ctx,-14,-6,28,4,2);ctx.fill();ctx.fillStyle='#2b2b30';ctx.beginPath();ctx.arc(-9,-1,2.5,0,6.29);ctx.arc(9,-1,2.5,0,6.29);ctx.fill();
      ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-5,-7);ctx.lineTo(-2,-18);ctx.lineTo(5,-7);ctx.moveTo(-2,-18);ctx.lineTo(0,-30);ctx.moveTo(0,-26);ctx.lineTo(-9,-22);ctx.moveTo(0,-26);ctx.lineTo(9,-24);ctx.stroke();
      ctx.fillStyle='#f2c49b';ctx.beginPath();ctx.arc(1,-35,5,0,6.29);ctx.fill();ctx.fillStyle='#2d6bd2';ctx.beginPath();ctx.arc(1,-37,5,Math.PI,0);ctx.fill();}
    ctx.restore();
    // velocity arrow
    const v=speed(sim);if(hon&&v>0.2){const vx=s.on?s.v*at(t,s.s).tx:s.vx,vy=s.on?s.v*at(t,s.s).ty:s.vy;const L=Math.min(70,v*6);const a0=X(px),b0=Y(py)-18,a1=a0+vx/v*L,b1=b0-vy/v*L;
      ctx.strokeStyle=PAL.s3;ctx.fillStyle=PAL.s3;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(a0,b0);ctx.lineTo(a1,b1);ctx.stroke();const an=Math.atan2(b1-b0,a1-a0);ctx.beginPath();ctx.moveTo(a1,b1);ctx.lineTo(a1-9*Math.cos(an-0.4),b1-9*Math.sin(an-0.4));ctx.lineTo(a1-9*Math.cos(an+0.4),b1-9*Math.sin(an+0.4));ctx.fill();}
    if(!s.on)pill(ctx,'Off the track!',X(px),Y(py)-64,'#C11430','#fff',12*k);
    // speedometer
    ctx.fillStyle=PAL.card;rr(ctx,592,8,200,434,10);ctx.fill();ctx.strokeStyle=PAL.line;ctx.lineWidth=1;ctx.stroke();
    const gx=644,gy=86,gr=40;txt(ctx,'Speed',gx,30,{s:12*k,w:700,a:'center'});
    ctx.lineWidth=7;ctx.strokeStyle=PAL['cv-bg2'];ctx.beginPath();ctx.arc(gx,gy,gr,Math.PI,0);ctx.stroke();ctx.strokeStyle=PAL.s3;ctx.beginPath();ctx.arc(gx,gy,gr,Math.PI,Math.PI+Math.PI*clamp(v/15,0,1));ctx.stroke();
    for(let q=0;q<=15;q+=5){const a=Math.PI+Math.PI*q/15;txt(ctx,String(q),gx+Math.cos(a)*(gr-15),gy+Math.sin(a)*(gr-15)+4,{s:9.5*k,c:PAL['cv-soft'],a:'center'});}
    const na=Math.PI+Math.PI*clamp(v/15,0,1);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(gx,gy);ctx.lineTo(gx+Math.cos(na)*(gr-6),gy+Math.sin(na)*(gr-6));ctx.stroke();
    txt(ctx,v.toFixed(1)+' m/s',gx,gy+18,{s:12.5*k,w:700,a:'center'});
    // energy panel
    
    const ke=KE(sim),pe=PE(sim),th=s.th,tot=ke+pe+th;const cols=[PAL.s3,PAL.s2,PAL.s1,PAL.s4];
    // pie
    const PX_=744,PY_=78;txt(ctx,'Energy',PX_,30,{s:12*k,w:700,a:'center'});
    if(pe>=-1&&tot>1){let a0=-Math.PI/2;[ke,Math.max(0,pe),th].forEach((e,i)=>{const da=2*Math.PI*e/Math.max(1,ke+Math.max(0,pe)+th);ctx.fillStyle=cols[i];ctx.beginPath();ctx.moveTo(PX_,PY_);ctx.arc(PX_,PY_,36,a0,a0+da);ctx.closePath();ctx.fill();a0+=da;});}
    else txt(ctx,'PE < 0',PX_,82,{s:11*k,c:PAL['cv-soft'],a:'center'});
    // bars
    const vals=[ke,pe,th,tot],labs=k>1.2?['KE','PE','Heat','Total']:['Kinetic','Potential','Thermal','Total'];const neg=pe<-1;const emax=Math.max(10,...vals.map(Math.abs))*1.1;
    const top=150,bot=400,base=neg?top+(bot-top)*0.7:bot,hs=(neg?(bot-top)*0.7:(bot-top))/emax;
    ctx.strokeStyle=PAL.line;ctx.beginPath();ctx.moveTo(602,base);ctx.lineTo(784,base);ctx.stroke();
    vals.forEach((e,i)=>{const x=606+i*45;const h=e*hs;ctx.fillStyle=cols[i];if(i===3)ctx.globalAlpha=0.85;ctx.fillRect(x,h>=0?base-h:base,34,Math.abs(h));ctx.globalAlpha=1;
      txt(ctx,Math.round(e)+' J',x+17,h>=0?base-h-5:base-h+14,{s:10.5*k,w:600,a:'center',c:PAL['cv-ink']});
      txt(ctx,labs[i],x+17,bot+18,{s:10.5*k,a:'center',c:PAL['cv-soft']});});
    txt(ctx,'grid squares = 1 m',52,436,{s:11*k,c:PAL['cv-soft']});
  }
};
BioLab.register(SKATE);
})();
