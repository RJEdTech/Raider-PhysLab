(function(){
'use strict';
const {clamp,lerp,rr,txt,pill,atLeast,PAL,RM,axes,legend,serColor}=BioLab.h;

/* Magnets and electromagnets.
   Scale for the bar magnet, wire and coil: 1 stage px = 0.5 mm, so 1 cm = 20 px.
   Bar magnet: two magnetic "poles" (each spread over 3 points), B = k Σ ±(r − rᵢ)/|r − rᵢ|³.
   Straight wire: B = μ₀I/(2πr), circling the wire (right-hand rule).
   Solenoid: B inside = μ₀ μᵣ N I / L (L = 15 cm), iron core μᵣ = 200 with saturation 1.5 tanh(B/1.5) T.
   Earth: a dipole tilted 11°, B = B₀(R/r)³√(1 + 3 sin²λ), B₀ = 31 µT.
   Moving charge: F = qv × B, r = mv⊥/(qB), helix pitch from v∥. Wire in a field: F = BIL. */
const MU0=4e-7*Math.PI,PXM=5e-4,CX=400,CY=235;
const QP=1.602e-19,MP=1.673e-27,SLOW=1e-7,HS=1500; // helix: 1 display second = 100 ns; 1500 px per m
const KBAR=5e-6,COILHL=150,COILR=46,LCOIL=0.15,ER=100,TILT=11*Math.PI/180,B0E=31e-6;
const SCN=[{v:'bar',l:'Bar magnet'},{v:'wire',l:'Current in a straight wire'},{v:'solenoid',l:'Coil (electromagnet)'},{v:'earth',l:'Earth as a magnet'},{v:'charge',l:'Moving charge in a field',lvl:'ap'},{v:'wireforce',l:'Force on a wire in a field',lvl:'ap'}];

function coilB(p){const raw=MU0*p.turns*p.cur/LCOIL;if(!p.core)return raw;const b=raw*200;return 1.5*Math.tanh(b/1.5);}
function poleField(x,y,poles){let bx=0,by=0;for(const q of poles){const dx=(x-q[0])*PXM,dy=(y-q[1])*PXM;const r2=Math.max(dx*dx+dy*dy,9e-6),r3=r2*Math.sqrt(r2);bx+=q[2]*dx/r3;by+=q[2]*dy/r3;}return [bx,by];}
function barPoles(p){const s=p.flip?-1:1,out=[];for(const o of [-12,0,12]){out.push([CX+70*s,CY+o,KBAR/3],[CX-70*s,CY+o,-KBAR/3]);}return out;}
let COILUNIT=null;
function coilPoles(){const out=[];for(let o=-36;o<=36;o+=12){out.push([CX+COILHL,CY+o,1],[CX-COILHL,CY+o,-1]);}return out;}
function coilUnit(){if(COILUNIT)return COILUNIT;const f=poleField(CX+COILHL+6,CY,coilPoles());COILUNIT=Math.hypot(f[0],f[1]);return COILUNIT;}
function inBar(x,y){return Math.abs(x-CX)<90&&Math.abs(y-CY)<20;}
function inCoil(x,y){return Math.abs(x-CX)<COILHL&&Math.abs(y-CY)<COILR;}
/* B (tesla) at a stage point, in screen axes (y down) */
function fieldAt(p,x,y){
  switch(p.scene){
    case 'bar':{if(inBar(x,y)){const s=p.flip?-1:1;return [0.1*s,0];}return poleField(x,y,barPoles(p));}
    case 'wire':{const dx=x-CX,dy=y-CY,r=Math.max(Math.hypot(dx,dy),2),B=2e-7*p.cur/(r*PXM);return [B*dy/r,-B*dx/r];}
    case 'solenoid':{const Bin=coilB(p);if(inCoil(x,y))return [Bin,0];const f=poleField(x,y,coilPoles()),s=(Bin/2)/coilUnit();return [f[0]*s,f[1]*s];}
    case 'earth':{const dx=x-CX,dy=y-CY,r=Math.max(Math.hypot(dx,dy),ER*0.5);const rx=dx/r,ry=dy/r;const mx=Math.sin(TILT),my=Math.cos(TILT);const md=mx*rx+my*ry;const f=B0E*Math.pow(ER/r,3);return [f*(3*md*rx-mx),f*(3*md*ry-my)];}
    default:{return [p.bmag,0];}
  }}
function probeXY(p){return [CX+p.px*20,CY-p.py*20];}
function trace(p,x,y,stop){const pts=[[x,y]];for(let i=0;i<260;i++){let f=fieldAt(p,x,y),m=Math.hypot(f[0],f[1]);if(!(m>0))break;const hx=x+2.5*f[0]/m,hy=y+2.5*f[1]/m;f=fieldAt(p,hx,hy);m=Math.hypot(f[0],f[1]);if(!(m>0))break;x+=5*f[0]/m;y+=5*f[1]/m;if(x<-20||x>820||y<-20||y>470)break;pts.push([x,y]);if(stop(x,y))break;}return pts;}
function fieldLines(p){const key=p.scene+'|'+p.flip+'|'+Math.sign(p.cur);if(fieldLines.k===key)return fieldLines.v;let L=[];
  if(p.scene==='bar'){const s=p.flip?-1:1;const st=[];for(const o of [-15,-5,5,15])st.push([CX+s*94,CY+o]);for(const d of [12,32,52,72])st.push([CX+s*d,CY-24],[CX+s*d,CY+24]);
    for(const q of st)L.push(trace(p,q[0],q[1],(X,Y)=>inBar(X,Y)));}
  else if(p.scene==='solenoid'&&p.cur!==0){const s=Math.sign(p.cur),nx=CX+COILHL*s;const st=[];for(const o of [-36,-24,-12,0,12,24,36])st.push([nx+5*s,CY+o]);for(const d of [20,50,80])st.push([nx-d*s,CY-COILR-5],[nx-d*s,CY+COILR+5]);
    for(const q of st)L.push(trace(p,q[0],q[1],(X,Y)=>inCoil(X,Y)));}
  else if(p.scene==='earth'){const mx=Math.sin(TILT),my=Math.cos(TILT);for(let a=-5;a<=5;a++){if(a===0)continue;const th=Math.atan2(my,mx)+a*0.22,x=CX+Math.cos(th)*(ER+3),y=CY+Math.sin(th)*(ER+3);L.push(trace(p,x,y,(X,Y)=>Math.hypot(X-CX,Y-CY)<ER));}}
  fieldLines.k=key;fieldLines.v=L;return L;}
function heading(f){let a=Math.atan2(-f[1],f[0])*180/Math.PI;if(a<0)a+=360;return a;}
const fmtB=b=>b>=1000?(b/1000).toFixed(2)+' mT':b>=1?b.toFixed(1)+' µT':(b*1000).toFixed(0)+' nT';
function helix(p){const th=p.angle*Math.PI/180,v=p.speed*1e5,vpar=v*Math.cos(th),vperp=v*Math.sin(th),w=QP*p.bmag/MP,r=vperp/w;return {th,v,vpar,vperp,w,r,F:QP*vperp*p.bmag,T:2*Math.PI/w,pitch:vpar*2*Math.PI/w};}
function clipsOf(p){return Math.min(60,Math.floor(Math.abs(coilB(p))/0.02));}
function rel(sc,...ok){return ok.includes(sc);}

const SIM={
  id:'magnetism',hash:'magnetism',apUnit:12,order:1,tab:'Magnets and electromagnets',kind:'Simulation',next:['induction'],
  card:'Map magnetic fields with compasses, build an electromagnet that lifts paperclips, and steer a moving charge.',
  title:'Magnets and electromagnets',
  lede:{bio:'Magnets push and pull without touching through a magnetic field. Use compasses to map the field around a magnet, a wire and a coil, and find out what makes an electromagnet stronger.',
        honors:'Use the right-hand rule to predict the field around a current, and calculate field strengths with B = μ₀I/(2πr) and B = μ₀NI/L.',
        ap:'Add the magnetic force: F = qv × B bends moving charges into circles and helices, and F = IL × B pushes on current-carrying wires.'},
  scale:'Tabletop scale: 1 cm on the grid is 20 screen pixels. Field strengths are in microtesla (µT); Earth’s field is about 50 µT and a fridge magnet about 5 000 µT.',
  timeScale:1,dtMax:0.05,sampleDt:0.1,window:20,unit:'s',chChange:3,chReveal:6,
  controls:[
    {id:'scene',label:'What to explore',type:'select',def:'bar',lvl:'bio',options:SCN,onChange(sim){sim.infoDirty=true;sim.st.trail=[];}},
    {id:'flip',label:'Flip the magnet around',type:'toggle',def:false,lvl:'bio',help:'Bar magnet'},
    {id:'cur',label:'Current',type:'range',min:-10,max:10,step:0.5,def:5,unit:' A',lvl:'bio',help:'Wire, coil and wire-in-a-field. A negative current flows the other way.'},
    {id:'turns',label:'Turns of wire on the coil',type:'range',min:10,max:200,step:10,def:50,lvl:'bio',help:'Coil'},
    {id:'core',label:'Iron core in the coil',type:'toggle',def:true,lvl:'bio',help:'Coil'},
    {id:'lines',label:'Show field lines',type:'toggle',def:true,lvl:'bio'},
    {id:'grid',label:'Show a grid of compasses',type:'toggle',def:true,lvl:'bio'},
    {id:'px',label:'Compass position: across',type:'range',min:-18,max:18,step:0.5,def:6,unit:' cm',lvl:'bio',help:'Or click the stage to move the compass.'},
    {id:'py',label:'Compass position: up',type:'range',min:-10,max:10,step:0.5,def:3,unit:' cm',lvl:'bio'},
    {id:'bmag',label:'Field strength B',type:'range',min:0.05,max:1,step:0.05,def:0.1,unit:' T',d:2,lvl:'ap',help:'Moving charge and wire-in-a-field'},
    {id:'speed',label:'Proton speed',type:'range',min:1,max:10,step:0.5,def:5,unit:' ×10⁵ m/s',lvl:'ap'},
    {id:'angle',label:'Angle between v and B',type:'range',min:0,max:90,step:5,def:60,unit:'°',lvl:'ap'}
  ],
  init(sim){return {trail:[],ph:0,xh:0,swing:0};},
  step(sim,dt){const s=sim.st,p=sim.p;
    if(p.scene==='charge'){const h=helix(p);s.ph+=h.w*SLOW*dt;s.xh+=h.vpar*SLOW*dt;if(s.xh*HS>560||s.ph>60){s.xh=0;s.ph=0;s.trail=[];}}
    if(p.scene==='wireforce'){const F=p.bmag*p.cur*0.1;s.swing=lerp(s.swing,Math.atan(F/0.3)*0.9,Math.min(1,dt*3));}},
  metrics:[
    {id:'bprobe',label:'Field at the compass',unit:'µT',lvl:'bio',min:0,max:null,d:1,get:s=>{const p=s.p;if(rel(p.scene,'charge','wireforce'))return p.bmag*1e6;const q=probeXY(p),f=fieldAt(p,q[0],q[1]);return Math.hypot(f[0],f[1])*1e6;}},
    {id:'heading',label:'Compass needle points',unit:'°',lvl:'bio',min:0,max:360,d:0,get:s=>{const p=s.p;if(rel(p.scene,'charge','wireforce'))return NaN;const q=probeXY(p);return heading(fieldAt(p,q[0],q[1]));}},
    {id:'clips',label:'Paperclips lifted',unit:'',lvl:'bio',min:0,max:60,d:0,get:s=>s.p.scene==='solenoid'?clipsOf(s.p):NaN},
    {id:'bcoil',label:'Field inside the coil',unit:'mT',lvl:'honors',min:0,max:1500,d:2,get:s=>s.p.scene==='solenoid'?Math.abs(coilB(s.p))*1000:NaN},
    {id:'force',label:'Force on the proton',unit:'×10⁻¹⁴ N',lvl:'ap',min:0,max:20,d:2,get:s=>s.p.scene==='charge'?helix(s.p).F*1e14:NaN},
    {id:'radius',label:'Radius of the circle',unit:'cm',lvl:'ap',min:0,max:25,d:2,get:s=>s.p.scene==='charge'?helix(s.p).r*100:NaN},
    {id:'fwire',label:'Force on the 10 cm wire',unit:'N',lvl:'ap',min:0,max:1,d:3,get:s=>s.p.scene==='wireforce'?Math.abs(s.p.bmag*s.p.cur*0.1):NaN}
  ],
  graphs:[{id:'shape',label:'Field strength vs. distance',custom:true},{id:'bprobe',label:'Field at the compass over time',lines:['bprobe']}],
  defaultGraph:'shape',
  plot(sim,ctx,box){const p=sim.p;
    if(p.scene==='charge'){const xs=[],B=[];for(let b=0.05;b<=1.0001;b+=0.01){const q=helix(Object.assign({},p,{bmag:b}));xs.push([b,q.r*100]);}
      const ymax=Math.max(1,...xs.map(a=>a[1]))*1.1;const ax=axes(ctx,box,{xmin:0,xmax:1,ymin:0,ymax,xl:'Field strength B (T)',yl:'Radius (cm)'});curve(ctx,ax,xs,serColor(1));dot(ctx,ax.X(p.bmag),ax.Y(helix(p).r*100));return;}
    if(p.scene==='wireforce'){const ax=axes(ctx,box,{xmin:-10,xmax:10,ymin:-1,ymax:1,xl:'Current (A)',yl:'Force on wire (N, + = right)'});const xs=[];for(let I=-10;I<=10;I+=0.5)xs.push([I,p.bmag*I*0.1]);curve(ctx,ax,xs,serColor(1));dot(ctx,ax.X(p.cur),ax.Y(p.bmag*p.cur*0.1));return;}
    if(p.scene==='earth'){const xs=[];for(let l=-90;l<=90;l+=3){const s=Math.sin(l*Math.PI/180);xs.push([l,B0E*1e6*Math.sqrt(1+3*s*s)]);}const ax=axes(ctx,box,{xmin:-90,xmax:90,ymin:0,ymax:70,xl:'Magnetic latitude (°)',yl:'Field at the surface (µT)'});curve(ctx,ax,xs,serColor(1));return;}
    if(p.scene==='solenoid'){const xs=[],ys=[];for(let N=0;N<=200;N+=5){xs.push([N,Math.abs(coilB(Object.assign({},p,{turns:N})))*1000]);ys.push([N,Math.abs(coilB(Object.assign({},p,{turns:N,core:!p.core})))*1000]);}
      const ymax=Math.max(5,...xs.map(a=>a[1]),...ys.map(a=>a[1]))*1.1;const ax=axes(ctx,box,{xmin:0,xmax:200,ymin:0,ymax,xl:'Turns of wire',yl:'Field inside (mT)'});
      curve(ctx,ax,p.core?xs:ys,serColor(1));curve(ctx,ax,p.core?ys:xs,serColor(3));dot(ctx,ax.X(p.turns),ax.Y(Math.abs(coilB(p))*1000));
      legend(ctx,box.L+12,box.T+8,[{label:'Iron core',color:serColor(1)},{label:'Air core',color:serColor(3)}]);return;}
    // bar or wire: B along the line from the source through the compass
    const q=probeXY(p);let dx=q[0]-CX,dy=q[1]-CY,d=Math.hypot(dx,dy);if(d<1){dx=1;dy=0;d=1;}const ux=dx/d,uy=dy/d,r0=p.scene==='bar'?(Math.abs(ux)*90+Math.abs(uy)*20)/20+0.5:0.5;
    const xs=[];for(let r=r0;r<=20;r+=0.25){const f=fieldAt(p,CX+ux*r*20,CY+uy*r*20);xs.push([r,Math.hypot(f[0],f[1])*1e6]);}
    const cap=Math.max(...xs.slice(Math.min(4,xs.length-1)).map(a=>a[1]))*1.1||1;const ax=axes(ctx,box,{xmin:0,xmax:20,ymin:0,ymax:cap,xl:'Distance from the '+(p.scene==='bar'?'magnet’s centre':'wire')+' toward the compass (cm)',yl:'Field (µT)'});
    curve(ctx,ax,xs.filter(a=>a[1]<=cap*1.5).map(a=>[a[0],Math.min(a[1],cap)]),serColor(1));const fb=fieldAt(p,q[0],q[1]);dot(ctx,ax.X(Math.min(20,d/20)),ax.Y(Math.min(cap,Math.hypot(fb[0],fb[1])*1e6)));},
  infoPanel(sim){const p=sim.p,hon=atLeast('honors'),ap=atLeast('ap');const q=probeXY(p);
    if(p.scene==='charge'){const h=helix(p);return `<h3>Proton in a magnetic field</h3><div class="tbl-wrap"><table><tbody><tr><td>v∥ (along B)</td><td>${(h.vpar/1e5).toFixed(2)} ×10⁵ m/s</td></tr><tr><td>v⊥ (across B)</td><td>${(h.vperp/1e5).toFixed(2)} ×10⁵ m/s</td></tr><tr><td>F = qv⊥B</td><td>${(h.F*1e14).toFixed(2)} ×10⁻¹⁴ N</td></tr><tr><td>r = mv⊥/(qB)</td><td>${(h.r*100).toFixed(2)} cm</td></tr><tr><td>Period T = 2πm/(qB)</td><td>${(h.T*1e9).toFixed(0)} ns</td></tr><tr><td>Pitch of the helix</td><td>${(h.pitch*100).toFixed(1)} cm</td></tr></tbody></table></div><p class="help">The magnetic force is always perpendicular to the velocity, so it changes the direction of motion but never the speed. Motion is slowed 10 million times.</p>`;}
    if(p.scene==='wireforce'){const F=p.bmag*p.cur*0.1;return `<h3>Wire in a magnetic field</h3><p>F = BIL = ${p.bmag.toFixed(2)} T × ${Math.abs(p.cur).toFixed(1)} A × 0.10 m = <b>${Math.abs(F).toFixed(3)} N</b>, pushing ${F===0?'nowhere':F>0?'right':'left'}.</p><p class="help">Right-hand rule: point your fingers along the current, curl them toward the field (into the screen); your thumb points along the force. Current down + field into the screen gives a push to the right.</p>`;}
    const f=fieldAt(p,q[0],q[1]),B=Math.hypot(f[0],f[1])*1e6;let h=`<h3>The compass reads</h3><p>Field ${fmtB(B)}, needle pointing ${heading(f).toFixed(0)}° (0° = right, 90° = up).</p>`;
    if(p.scene==='wire'&&hon){const r=Math.max(0.1,Math.hypot(p.px,p.py))/100;h+=`<p>B = μ₀I/(2πr) = (4π×10⁻⁷)(${Math.abs(p.cur).toFixed(1)})/(2π × ${r.toFixed(3)} m) = <b>${fmtB(2e-7*Math.abs(p.cur)/r*1e6)}</b>.</p>`;}
    if(p.scene==='solenoid'){h+=`<p>${hon?'B inside = μ₀'+(p.core?'μᵣ':'')+'NI/L = ':'Field inside the coil: '}<b>${(Math.abs(coilB(p))*1000).toFixed(2)} mT</b>${p.core&&hon?' (iron multiplies it about 200×, until the iron saturates near 1.5 T)':''}. Paperclips lifted: <b>${clipsOf(p)}</b>.</p>`;}
    if(p.scene==='earth')h+=`<p class="help">Earth’s field is about 30 µT at the equator and 60 µT near the poles. The pole near geographic north is a magnetic <b>south</b> pole, which is why a compass’s north end points there.</p>`;
    if(ap&&p.scene==='bar')h+=`<p class="help">Far from the magnet the field falls off like a dipole, B ∝ 1/r³.</p>`;
    return h;},
  narrate(sim){const p=sim.p,q=probeXY(p);const f=fieldAt(p,q[0],q[1]);const hd=heading(f);const dir=hd<45||hd>=315?'right':hd<135?'up':hd<225?'left':'down';
    switch(p.scene){
      case 'bar':return 'Field lines leave the <b>north</b> pole and loop around into the <b>south</b> pole. Each compass needle lines up along the field, so at the big compass its north end points '+dir+'.';
      case 'wire':return p.cur===0?'No current, so there is no magnetic field around the wire. The compasses would just point north.':'Current '+(p.cur>0?'flows out of the screen (•)':'flows into the screen (×)')+', so the field circles the wire '+(p.cur>0?'counterclockwise':'clockwise')+' (right-hand rule: thumb along the current, fingers curl with the field). The field gets weaker farther from the wire.';
      case 'solenoid':return p.cur===0?'With no current the coil is just wire: no field, no paperclips.':'Each turn of wire adds its little field, so the coil acts like a bar magnet with its north pole on the '+(p.cur>0?'right':'left')+'. '+(p.core?'The iron core multiplies the field, so it lifts '+clipsOf(p)+' paperclips.':'Without iron the field is weak: '+clipsOf(p)+' paperclips.');
      case 'earth':return 'Earth behaves like a giant bar magnet tilted about 11°. Its <b>magnetic south pole</b> sits near the geographic North Pole, so compass needles (north ends) point north.';
      case 'charge':{const h=helix(p);return p.angle===0?'The proton moves <b>parallel to B</b>, so the magnetic force is zero and it travels in a straight line.':p.angle===90?'The proton moves straight across B. The force (orange) is always sideways, so it moves in a circle of radius '+(h.r*100).toFixed(1)+' cm.':'Only the part of the velocity across B feels a force. That part goes in a circle while the part along B carries on, so the proton spirals in a <b>helix</b>.';}
      case 'wireforce':return p.cur===0?'No current, no force: the wire hangs straight.':'The current-carrying wire sits in a field that points into the screen. F = BIL = '+Math.abs(p.bmag*p.cur*0.1).toFixed(3)+' N pushes it '+(p.cur>0?'right':'left')+'. Reverse the current and the push reverses.';
    }return '';},
  tour:[
    {title:'A bar magnet',text:'Every magnet has a north (red) and a south (blue) pole. The lines show the magnetic field: they come out of the north pole and loop around into the south pole.',focus:[150,90,500,290],pause:true,setup(sim){BioLab.setValues(sim,{scene:'bar',lines:true,grid:true,px:6,py:3});}},
    {title:'Compasses map the field',text:'A compass is a tiny magnet. Its red north end lines up along the field. Look at the grid: the needles follow the field lines.',focus:[0,40,800,410],speed:0.5},
    {title:'Move the compass',text:'The big compass shows the field at one spot. Click anywhere, or use the position sliders, to explore. Here it sits above the middle of the magnet and points toward the south pole.',focus:(sim)=>{const q=probeXY(sim.p);return [q[0]-60,q[1]-60,120,120];},pause:true,setup(sim){BioLab.setValues(sim,{px:0,py:3});}},
    {title:'Current makes a field',text:'A wire carrying current has a magnetic field that circles around it. Here the current comes out of the screen. Thumb along the current, fingers curl the way the field goes.',focus:[200,40,400,400],pause:true,setup(sim){BioLab.setValues(sim,{scene:'wire',cur:5,px:4,py:3});}},
    {title:'Reverse the current',text:'Send the current the other way (into the screen) and every compass needle flips around.',focus:[200,40,400,400],pause:true,setup(sim){BioLab.setValues(sim,{cur:-5});}},
    {title:'Coil it up',text:'Wind the wire into a coil and the fields of all the turns add up. The coil acts just like a bar magnet: an electromagnet. More turns or more current make it stronger.',focus:[220,150,360,240],pause:true,setup(sim){BioLab.setValues(sim,{scene:'solenoid',cur:5,core:false,turns:50});}},
    {title:'Add an iron core',text:'An iron core multiplies the field hundreds of times. Now the electromagnet lifts a chain of paperclips.',focus:[220,150,450,300],pause:true,setup(sim){BioLab.setValues(sim,{core:true});}},
    {title:'Earth is a magnet',text:'Earth’s field comes from currents in its molten iron core. The magnetic pole near the geographic North Pole is actually a south pole, which attracts the north end of every compass.',focus:[220,40,360,400],pause:true,setup(sim){BioLab.setValues(sim,{scene:'earth',px:4,py:6});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{scene:'bar',cur:5,core:true,turns:50,px:6,py:3,lines:true,grid:true});},
  challenges:[
    {lvl:'bio',q:'A compass sits just above the middle of a bar magnet whose north pole is on the right. Which way does the needle’s north end point?',choices:['Right, toward the magnet’s north pole','Left, toward the magnet’s south pole','Straight up, away from the magnet'],correct:1,
     baseline:{scene:'bar',flip:false,px:7,py:0},change:{px:0,py:3},changeText:'Compass moved above the middle',watch:'heading',
     explain:{bio:'Field lines run from the north pole around to the south pole. Above the middle of the magnet they run from right to left, so the needle’s north end points left, toward the south pole. Opposite poles attract.'}},
    {lvl:'bio',q:'Current flows up out of the screen through a wire, and the compasses circle it. What happens when you reverse the current?',choices:['Nothing: the field stays the same','Every needle flips to point the opposite way','The needles all point at the wire'],correct:1,
     baseline:{scene:'wire',cur:8,px:4,py:3},change:{cur:-8},changeText:'Current reversed',watch:'heading',
     explain:{bio:'The direction of the field depends on the direction of the current. Reverse the current and the field circles the other way, so every compass turns around (180°).'}},
    {lvl:'bio',q:'An electromagnet has 50 turns of wire. What happens if you wind it with 100 turns instead (same current)?',choices:['It lifts more paperclips','It lifts fewer paperclips','No change'],correct:0,
     baseline:{scene:'solenoid',turns:50,cur:5,core:true},change:{turns:100},changeText:'Turns increased to 100',watch:'clips',
     explain:{bio:'Every turn of wire adds its own field. Twice the turns makes about twice the field, so the electromagnet lifts more paperclips.',honors:'B = μ₀μᵣNI/L: doubling N doubles B (until the iron starts to saturate).'}},
    {lvl:'bio',q:'The north end of a compass points toward Earth’s geographic North Pole. What kind of magnetic pole is there?',choices:['A magnetic north pole','A magnetic south pole','No pole: compasses follow Earth’s spin'],correct:1,instant:true,
     explain:{bio:'Opposite poles attract. The north end of the compass is pulled toward a magnetic south pole, so the magnetic pole under the Arctic is a south pole, even though we call it the “North Magnetic Pole.”'}},
    {lvl:'honors',q:'You pull the iron core out of a 50-turn coil with 5 A. What happens to the paperclips?',choices:['They stay up: the coil makes the field, not the iron','Almost all of them drop','More of them stick'],correct:1,
     baseline:{scene:'solenoid',turns:50,cur:5,core:true},change:{core:false},changeText:'Iron core removed',watch:'clips',
     explain:{honors:'The iron’s own tiny magnets (domains) line up with the coil’s field and add to it, about 200× here. Without the core B = μ₀NI/L ≈ 2 mT, too weak to hold a paperclip.'}},
    {lvl:'honors',q:'The field 2 cm from a long straight wire is 50 µT. What is it 4 cm from the wire?',choices:['100 µT','50 µT','25 µT','12.5 µT'],correct:2,instant:true,
     explain:{honors:'B = μ₀I/(2πr) falls off as 1/r. Twice the distance gives half the field: 25 µT. (A bar magnet’s field falls off much faster, about 1/r³ far away.)'}},
    {lvl:'honors',q:'You double the current in a straight wire from 5 A to 10 A. What happens to the field at the compass?',choices:['It doubles','It stays the same','It quadruples'],correct:0,
     baseline:{scene:'wire',cur:5,px:4,py:3},change:{cur:10},changeText:'Current doubled',watch:'bprobe',
     explain:{honors:'B = μ₀I/(2πr) is proportional to I, so doubling I doubles B at every point.'}},
    {lvl:'ap',q:'A proton spirals around B with v at 60° to the field. You turn the velocity so it points exactly along B (0°). What happens?',choices:['It circles in a tighter loop','The magnetic force drops to zero and it moves in a straight line','It circles in a wider loop'],correct:1,
     baseline:{scene:'charge',angle:60,bmag:0.1,speed:5},change:{angle:0},changeText:'Velocity turned parallel to B',watch:'force',
     explain:{ap:'F = qvB sin θ. With v parallel to B, sin 0° = 0, so there is no magnetic force at all and the proton coasts straight along the field line.'}},
    {lvl:'ap',q:'A proton moves straight across a 0.10 T field. You double the field to 0.20 T. What happens to the radius of its circle?',choices:['It doubles','It halves','It stays the same'],correct:1,
     baseline:{scene:'charge',angle:90,bmag:0.1,speed:5},change:{bmag:0.2},changeText:'Field doubled',watch:'radius',
     explain:{ap:'qvB = mv²/r, so r = mv/(qB). Doubling B doubles the force at the same speed, which bends the path twice as tightly: half the radius. The period 2πm/(qB) also halves.'}},
    {lvl:'ap',q:'A 0.10 m wire carries 4.0 A at right angles to a 0.50 T field. What force acts on it?',choices:['0.20 N','2.0 N','0.80 N','20 N'],correct:0,instant:true,
     explain:{ap:'F = BIL sin θ = (0.50 T)(4.0 A)(0.10 m)(1) = 0.20 N, perpendicular to both the wire and the field.'}}
  ],
  lab:{bio:'<p><b>Question:</b> What makes an electromagnet stronger?</p><ol><li>Choose Coil (electromagnet). Record the paperclips lifted for 20, 50, 100 and 200 turns.</li><li>Repeat with the current at 2 A, 5 A and 10 A.</li><li>Try it with and without the iron core.</li></ol><p>Which change made the biggest difference? Explain using the word <i>field</i>.</p>',
       honors:'<p><b>Question:</b> How does the field of a wire depend on distance?</p><ol><li>Choose the straight wire, 10 A. Put the compass 1, 2, 4, 8 and 16 cm to the right of the wire (up = 0).</li><li>Record the field each time.</li><li>Plot B against 1/r.</li></ol><p>Use the slope to find μ₀ and compare with 4π × 10⁻⁷ T·m/A.</p>',
       ap:'<p><b>Question:</b> How does a magnetic field steer a charge?</p><ol><li>Choose Moving charge, 90°. Record the radius for B = 0.1 to 1.0 T.</li><li>Then fix B and vary the speed.</li></ol><p><b>Claim–evidence–reasoning:</b> Show from your data that r = mv/(qB), and use the slope to find the proton’s charge-to-mass ratio.</p>'},
  terms:[{t:'Magnetic field',d:'The region around a magnet or current where magnetic forces act. Measured in tesla (T).'},{t:'Field lines',d:'Lines showing the field direction, from north pole to south pole outside a magnet. Closer lines mean a stronger field.'},{t:'Electromagnet',d:'A coil of wire, often around iron, that is magnetic only while current flows.'},{t:'Compass',d:'A small magnet free to turn; its north end points along the field.'},
    {lvl:'honors',t:'Right-hand rule',d:'Thumb along the current; your fingers curl in the direction of the magnetic field.'},{lvl:'honors',t:'Solenoid',d:'A long coil. Inside, B = μ₀NI/L, nearly uniform.'},{lvl:'honors',t:'μ₀',d:'Permeability of free space, 4π × 10⁻⁷ T·m/A.'},
    {lvl:'ap',t:'Lorentz force',d:'F = qv × B: perpendicular to both v and B, so it changes direction, not speed.'},{lvl:'ap',t:'Cyclotron radius',d:'r = mv⊥/(qB).'},{lvl:'ap',t:'Force on a wire',d:'F = IL × B.'}],
  about:'<p>Bar magnet: modeled as two magnetic poles, each spread over three points, with a field of about 50 mT one centimetre from a pole. Inside the magnet the field is simply drawn pointing from S to N. Wire: B = μ₀I/(2πr) exactly. Coil: B = μ₀μᵣNI/L inside (L = 15 cm), with μᵣ = 200 for iron and a smooth saturation at 1.5 T; outside it is drawn with the same two-pole model. Paperclips lifted = B/(20 mT), capped at 60: a rough rule of thumb, not a force calculation.</p><p>Earth: a tilted dipole with 31 µT at the equator. Compasses ignore Earth’s field in the other scenes. Moving charge: exact helix for a proton in a uniform field, drawn in a 3-D view and slowed 10 million times. Wire in a field: F = BIL with L = 0.10 m; the swing is drawn, not calculated.</p>',
  onClick(sim,x,y){if(rel(sim.p.scene,'charge','wireforce'))return;BioLab.setValues(sim,{px:clamp(Math.round((x-CX)/10)/2,-18,18),py:clamp(Math.round((CY-y)/10)/2,-10,10)});},
  initVis(sim){},
  draw(sim,ctx,vdt,k,t){const p=sim.p,s=sim.st;k=Math.min(k,1.35);
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    if(p.scene==='charge')return drawCharge(ctx,sim,k);
    if(p.scene==='wireforce')return drawWireForce(ctx,sim,k);
    // field lines
    if(p.lines){ctx.strokeStyle=PAL['cv-soft'];ctx.globalAlpha=0.55;ctx.lineWidth=1.6;
      if(p.scene==='wire'&&p.cur!==0){for(const r of [30,55,90,135,190,260]){ctx.lineWidth=clamp(3*30/r*Math.abs(p.cur)/5,0.6,3);ctx.beginPath();ctx.arc(CX,CY,r,0,6.29);ctx.stroke();arrowOn(ctx,CX+r*Math.cos(0.6),CY-r*Math.sin(0.6),p.cur>0?[-Math.sin(0.6),-Math.cos(0.6)]:[Math.sin(0.6),Math.cos(0.6)]);arrowOn(ctx,CX-r*Math.cos(0.6),CY+r*Math.sin(0.6),p.cur>0?[Math.sin(0.6),Math.cos(0.6)]:[-Math.sin(0.6),-Math.cos(0.6)]);}}
      else{for(const L of fieldLines(p)){if(L.length<3)continue;ctx.beginPath();L.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();const m=L[Math.floor(L.length/2)],n=L[Math.min(L.length-1,Math.floor(L.length/2)+1)];const d=Math.hypot(n[0]-m[0],n[1]-m[1])||1;arrowOn(ctx,m[0],m[1],[(n[0]-m[0])/d,(n[1]-m[1])/d]);}
        if(p.scene==='solenoid'&&p.cur!==0){for(let o=-30;o<=30;o+=15){ctx.beginPath();ctx.moveTo(CX-COILHL,CY+o);ctx.lineTo(CX+COILHL,CY+o);ctx.stroke();arrowOn(ctx,CX+(o%30?40:-40),CY+o,[Math.sign(p.cur),0]);}}}
      ctx.globalAlpha=1;}
    // the source
    if(p.scene==='bar')drawBar(ctx,p,k);else if(p.scene==='wire')drawWire(ctx,p,k);else if(p.scene==='solenoid')drawCoil(ctx,p,k,t);else drawEarth(ctx,k);
    // compass grid
    if(p.grid){for(let gx=40;gx<800;gx+=55)for(let gy=40;gy<450;gy+=50){if(blocked(p,gx,gy))continue;const f=fieldAt(p,gx,gy),m=Math.hypot(f[0],f[1]);if(!(m>0))continue;const a=clamp(0.3+0.17*Math.log10(m*1e7),0.4,1);needle(ctx,gx,gy,f[0]/m,f[1]/m,12,a);}}
    // probe compass
    const q=probeXY(p),f=fieldAt(p,q[0],q[1]),m=Math.hypot(f[0],f[1]);
    ctx.fillStyle=PAL['card'];ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(q[0],q[1],24,0,6.29);ctx.fill();ctx.stroke();
    if(m>0)needle(ctx,q[0],q[1],f[0]/m,f[1]/m,19,1,true);
    const lab=fmtB(m*1e6);const ly=q[1]>380?q[1]-36:q[1]+40;pill(ctx,lab,q[0],ly,PAL['cv-ink'],PAL['card'],12*k);
    // header
    txt(ctx,SCN.find(o=>o.v===p.scene).l,16,26,{s:15*k,w:700});
    if(p.scene!=='earth'){ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(16,436);ctx.lineTo(116,436);ctx.moveTo(16,431);ctx.lineTo(16,441);ctx.moveTo(116,431);ctx.lineTo(116,441);ctx.stroke();txt(ctx,'5 cm',126,440,{s:12*k,c:PAL['cv-soft']});}
  }
};
function curve(ctx,ax,pts,c){ctx.strokeStyle=c;ctx.lineWidth=2.5;ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(ax.X(q[0]),ax.Y(q[1])):ctx.moveTo(ax.X(q[0]),ax.Y(q[1])));ctx.stroke();}
function dot(ctx,x,y){ctx.fillStyle=PAL['s1'];ctx.strokeStyle=PAL['card'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,6,0,6.29);ctx.fill();ctx.stroke();}
function arrowOn(ctx,x,y,d){const s=7;ctx.save();ctx.fillStyle=ctx.strokeStyle;ctx.beginPath();ctx.moveTo(x+d[0]*s,y+d[1]*s);ctx.lineTo(x-d[0]*s-d[1]*s*0.7,y-d[1]*s+d[0]*s*0.7);ctx.lineTo(x-d[0]*s+d[1]*s*0.7,y-d[1]*s-d[0]*s*0.7);ctx.closePath();ctx.fill();ctx.restore();}
function needle(ctx,x,y,ux,uy,L,a,big){ctx.globalAlpha=a;const w=big?5:3;
  ctx.fillStyle='#d33a3a';ctx.beginPath();ctx.moveTo(x+ux*L,y+uy*L);ctx.lineTo(x-uy*w,y+ux*w);ctx.lineTo(x+uy*w,y-ux*w);ctx.closePath();ctx.fill();
  ctx.fillStyle=PAL['cv-soft'];ctx.beginPath();ctx.moveTo(x-ux*L,y-uy*L);ctx.lineTo(x-uy*w,y+ux*w);ctx.lineTo(x+uy*w,y-ux*w);ctx.closePath();ctx.fill();ctx.globalAlpha=1;
  if(big){ctx.fillStyle=PAL['cv-ink'];ctx.beginPath();ctx.arc(x,y,2.5,0,6.29);ctx.fill();}}
function blocked(p,x,y){const q=probeXY(p);if(Math.hypot(x-q[0],y-q[1])<34)return true;if(y<44&&x<330)return true;
  if(p.scene==='bar')return Math.abs(x-CX)<104&&Math.abs(y-CY)<32;if(p.scene==='wire')return Math.hypot(x-CX,y-CY)<22;
  if(p.scene==='solenoid')return Math.abs(x-CX)<COILHL+14&&Math.abs(y-CY)<COILR+18||p.core&&x>CX+COILHL-20&&x<CX+COILHL+60&&y>CY+COILR&&y<CY+COILR+150;
  return Math.hypot(x-CX,y-CY)<ER+14;}
function drawBar(ctx,p,k){const s=p.flip?-1:1;const nX=s>0?CX:CX-90;
  ctx.fillStyle='#c62828';ctx.fillRect(nX,CY-20,90,40);ctx.fillStyle='#1f5fbf';ctx.fillRect(s>0?CX-90:CX,CY-20,90,40);
  ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.strokeRect(CX-90,CY-20,180,40);
  txt(ctx,'N',CX+45*s,CY+1,{s:20*k,w:800,c:'#fff',a:'center',b:'middle'});txt(ctx,'S',CX-45*s,CY+1,{s:20*k,w:800,c:'#fff',a:'center',b:'middle'});}
function drawWire(ctx,p,k){ctx.fillStyle='#b8733a';ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(CX,CY,14,0,6.29);ctx.fill();ctx.stroke();
  ctx.fillStyle='#fff';ctx.strokeStyle='#fff';ctx.lineWidth=3;if(p.cur>0){ctx.beginPath();ctx.arc(CX,CY,4,0,6.29);ctx.fill();}else if(p.cur<0){ctx.beginPath();ctx.moveTo(CX-6,CY-6);ctx.lineTo(CX+6,CY+6);ctx.moveTo(CX+6,CY-6);ctx.lineTo(CX-6,CY+6);ctx.stroke();}
  txt(ctx,p.cur===0?'I = 0':'I = '+Math.abs(p.cur).toFixed(1)+' A '+(p.cur>0?'out of the screen':'into the screen'),CX,CY+42,{s:12.5*k,w:700,a:'center'});}
function drawCoil(ctx,p,k,t){const n=Math.min(40,Math.max(4,Math.round(p.turns/5))),x0=CX-COILHL,x1=CX+COILHL;
  if(p.core){ctx.fillStyle='#7d8590';ctx.fillRect(x0-20,CY-COILR+12,COILHL*2+40,(COILR-12)*2);txt(ctx,'iron core',x0-18,CY+COILR+4,{s:12*k,c:PAL['cv-soft']});}
  ctx.strokeStyle='#b8733a';ctx.lineWidth=Math.max(1.5,5-n/12);
  for(let i=0;i<n;i++){const x=lerp(x0+4,x1-4,n>1?i/(n-1):0.5);ctx.beginPath();ctx.ellipse(x,CY,6,COILR,0,0,6.29);ctx.stroke();}
  // leads and current arrows
  ctx.strokeStyle='#b8733a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x0+4,CY+COILR);ctx.lineTo(x0+4,CY+COILR+30);ctx.lineTo(x0-60,CY+COILR+30);ctx.moveTo(x1-4,CY+COILR);ctx.lineTo(x1-4,CY+COILR+16);ctx.stroke();
  ctx.fillStyle=PAL['cv-ink'];ctx.fillRect(x0-80,CY+COILR+16,20,30);txt(ctx,Math.abs(p.cur).toFixed(1)+' A',x0-70,CY+COILR+64,{s:12*k,w:700,a:'center'});
  if(p.cur!==0){const B=coilB(p),s=Math.sign(B);txt(ctx,'N',CX+(COILHL+26)*s,CY-COILR-6,{s:18*k,w:800,c:PAL['s1'],a:'center'});txt(ctx,'S',CX-(COILHL+26)*s,CY-COILR-6,{s:18*k,w:800,c:PAL['s2'],a:'center'});
    ctx.fillStyle=PAL['s4'];for(let i=0;i<3;i++){const x=lerp(x0+30,x1-30,i/2);const dy=p.cur>0?-1:1;ctx.beginPath();ctx.moveTo(x,CY+dy*COILR*0.2-dy*10+COILR*0.0);ctx.save();ctx.restore();arrowFill(ctx,x+10,CY+COILR-2,[0,-dy]);}}
  // paperclips hanging from the right end of the core (or coil)
  const c=clipsOf(p);const ex=CX+COILHL+(p.core?14:2),ey=CY+COILR-(p.core?12:0);let drawn=0;
  for(let ch=0;ch<6&&drawn<c;ch++){let x=ex-30+ch*14,y=ey+2;for(let j=0;j<10&&drawn<c;j++){clip(ctx,x,y+j*13,j%2);drawn++;}}
  if(c>drawn)txt(ctx,'+'+(c-drawn)+' more',ex+60,ey+40,{s:12*k,c:PAL['cv-soft']});
  txt(ctx,c+' paperclip'+(c===1?'':'s'),ex+60,ey+20,{s:13*k,w:700});}
function arrowFill(ctx,x,y,d){ctx.beginPath();ctx.moveTo(x+d[0]*8,y+d[1]*8);ctx.lineTo(x-d[1]*6-d[0]*4,y+d[0]*6-d[1]*4);ctx.lineTo(x+d[1]*6-d[0]*4,y-d[0]*6-d[1]*4);ctx.closePath();ctx.fill();}
function clip(ctx,x,y,o){ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.6;rr(ctx,x-3+(o?1:0),y,7,14,3.5);ctx.stroke();}
function drawEarth(ctx,k){const g=ctx.createRadialGradient(CX-30,CY-30,10,CX,CY,ER);g.addColorStop(0,'#4f8fd6');g.addColorStop(1,'#1f4f8f');ctx.fillStyle=g;ctx.beginPath();ctx.arc(CX,CY,ER,0,6.29);ctx.fill();
  ctx.fillStyle='#3f8f4f';[[-30,-40,36,22],[20,10,30,40],[-50,30,20,26],[40,-50,24,16]].forEach(a=>{ctx.beginPath();ctx.ellipse(CX+a[0],CY+a[1],a[2],a[3],0.4,0,6.29);ctx.fill();});
  ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(CX,CY-ER-30);ctx.lineTo(CX,CY+ER+30);ctx.stroke();ctx.setLineDash([]);
  txt(ctx,'Geographic North Pole',CX,CY-ER-36,{s:12.5*k,w:700,a:'center'});txt(ctx,'Geographic South Pole',CX,CY+ER+48,{s:12.5*k,w:700,a:'center'});
  // inner magnet, tilted: S end near geographic north
  ctx.save();ctx.translate(CX,CY);ctx.rotate(-TILT);ctx.globalAlpha=0.9;ctx.fillStyle='#1f5fbf';ctx.fillRect(-12,-60,24,60);ctx.fillStyle='#c62828';ctx.fillRect(-12,0,24,60);
  txt(ctx,'S',0,-36,{s:15*k,w:800,c:'#fff',a:'center',b:'middle'});txt(ctx,'N',0,38,{s:15*k,w:800,c:'#fff',a:'center',b:'middle'});ctx.restore();ctx.globalAlpha=1;
  txt(ctx,'magnetic S pole',CX+ER+14,CY-ER+10,{s:12*k,c:PAL['cv-soft']});txt(ctx,'magnetic N pole',CX+ER+14,CY+ER-4,{s:12*k,c:PAL['cv-soft']});}
function proj(x,y,z){return [130+HS*(x-0.75*z),250-HS*(y-0.25*z)];}
function drawCharge(ctx,sim,k){const p=sim.p,s=sim.st,h=helix(p);
  // field arrows
  ctx.strokeStyle=PAL['s5'];ctx.globalAlpha=0.3;ctx.lineWidth=1.5;for(let y=90;y<=420;y+=110){ctx.beginPath();ctx.moveTo(40,y);ctx.lineTo(770,y);ctx.stroke();for(let x=200;x<770;x+=200)arrowOn(ctx,x,y,[1,0]);}ctx.globalAlpha=1;
  {const a=proj(0,0,-h.r),b=proj(0.45,0,-h.r);ctx.strokeStyle=PAL['cv-soft'];ctx.setLineDash([8,6]);ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();ctx.setLineDash([]);if(h.r>0.004)txt(ctx,'axis of the spiral, along B',Math.min(b[0],600),b[1]-8,{s:12*k,c:PAL['cv-soft'],a:'center'});}
  pill(ctx,'B = '+p.bmag.toFixed(2)+' T →',700,40,PAL['s5'],'#fff',12.5*k);
  // particle position
  const x=s.xh,y=h.r*Math.sin(s.ph),z=-h.r*(1-Math.cos(s.ph));const q=proj(x,y,z);
  if(sim.running!==false){const last=s.trail[s.trail.length-1];if(!last||Math.hypot(last[0]-q[0],last[1]-q[1])>2)s.trail.push([q[0],q[1],h.r>0?-z/(2*h.r):0]);if(s.trail.length>400)s.trail.shift();}
  // projected helix guide (dashed full future path)
  ctx.strokeStyle=PAL['s4'];ctx.setLineDash([3,5]);ctx.lineWidth=1.2;ctx.beginPath();for(let i=0;i<=200;i++){const ph=s.ph+i*0.08,xx=x+h.vpar/h.w*(i*0.08),pt=proj(xx,h.r*Math.sin(ph),-h.r*(1-Math.cos(ph)));if(pt[0]>790)break;i?ctx.lineTo(pt[0],pt[1]):ctx.moveTo(pt[0],pt[1]);}ctx.stroke();ctx.setLineDash([]);
  ctx.strokeStyle=PAL['s1'];for(let i=1;i<s.trail.length;i++){const a=s.trail[i-1],b=s.trail[i];ctx.globalAlpha=1-0.6*b[2];ctx.lineWidth=3.2-1.8*b[2];ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();}ctx.globalAlpha=1;
  // velocity and force arrows
  const vx=h.vpar,vy=h.vperp*Math.cos(s.ph),vz=-h.vperp*Math.sin(s.ph);const vs=60/(h.v||1);
  const vt=proj(x+vx*vs/HS,y+vy*vs/HS,z+vz*vs/HS);arrowLine(ctx,q,vt,PAL['s3'],'v',k);
  if(h.F>0){const fy=vz,fz=-vy,fm=Math.hypot(fy,fz)||1,fl=clamp(h.F*1e14*40,26,80)/HS;const ft=proj(x,y+fy/fm*fl,z+fz/fm*fl);arrowLine(ctx,q,ft,PAL['s4'],'F',k);}
  ctx.fillStyle='#c62828';ctx.beginPath();ctx.arc(q[0],q[1],8,0,6.29);ctx.fill();txt(ctx,'+',q[0],q[1]+1,{s:13,w:800,c:'#fff',a:'center',b:'middle'});
  txt(ctx,'Moving charge in a field (3-D view)',16,26,{s:15*k,w:700});txt(ctx,'proton, v = '+p.speed.toFixed(1)+' ×10⁵ m/s at '+p.angle+'° to B · slowed 10 million times',16,46,{s:12*k,c:PAL['cv-soft']});
  txt(ctx,p.angle===0?'F = 0: straight line':'r = '+(h.r*100).toFixed(1)+' cm',16,436,{s:13*k,w:700});}
function arrowLine(ctx,a,b,c,l,k){ctx.strokeStyle=c;ctx.fillStyle=c;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();const d=Math.hypot(b[0]-a[0],b[1]-a[1])||1;arrowFill(ctx,b[0],b[1],[(b[0]-a[0])/d,(b[1]-a[1])/d]);txt(ctx,l,b[0]+(b[0]-a[0])/d*14,b[1]+(b[1]-a[1])/d*14+4,{s:14*k,w:800,c,a:'center'});}
function drawWireForce(ctx,sim,k){const p=sim.p,ang=sim.st.swing,F=p.bmag*p.cur*0.1;
  ctx.strokeStyle=PAL['s5'];ctx.globalAlpha=0.6;ctx.lineWidth=1.8;for(let x=60;x<800;x+=60)for(let y=90;y<440;y+=55){ctx.beginPath();ctx.moveTo(x-5,y-5);ctx.lineTo(x+5,y+5);ctx.moveTo(x+5,y-5);ctx.lineTo(x-5,y+5);ctx.stroke();}ctx.globalAlpha=1;
  pill(ctx,'B = '+p.bmag.toFixed(2)+' T into the screen (×)',640,40,PAL['s5'],'#fff',12.5*k);
  const px=400,py=74,L=300,ex=px+L*Math.sin(ang),ey=py+L*Math.cos(ang);
  ctx.fillStyle=PAL['cv-ink'];ctx.fillRect(330,py-10,140,10);ctx.beginPath();ctx.arc(px,py,6,0,6.29);ctx.fill();
  ctx.strokeStyle='#b8733a';ctx.lineWidth=8;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(ex,ey);ctx.stroke();ctx.lineCap='butt';
  ctx.setLineDash([4,5]);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px,py+L);ctx.stroke();ctx.setLineDash([]);
  const mx=lerp(px,ex,0.62),my=lerp(py,ey,0.62);
  if(p.cur!==0){ctx.fillStyle=PAL['s4'];const d=p.cur>0?1:-1;arrowFill(ctx,mx-16*Math.cos(ang),my+16*Math.sin(ang)-0,[Math.sin(ang)*d,Math.cos(ang)*d]);
    txt(ctx,'I = '+Math.abs(p.cur).toFixed(1)+' A '+(p.cur>0?'(down)':'(up)'),mx-34,my-30,{s:13*k,w:700,a:'right'});}
  if(F!==0){const Lf=clamp(Math.abs(F)*260,22,150);arrowLine(ctx,[ex,ey],[ex+Math.sign(F)*Lf,ey],PAL['s1'],'F',k);}
  txt(ctx,'Force on a wire in a field',16,26,{s:15*k,w:700});txt(ctx,'10 cm of wire carries the current · F = BIL = '+Math.abs(F).toFixed(3)+' N',16,46,{s:12.5*k,c:PAL['cv-soft']});}
BioLab.register(SIM);
})();
