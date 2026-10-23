(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor}=BioLab.h;
const K=8.99e9,QT=1e-9;              // Coulomb constant; the test charge is +1 nC
const S=25;                          // pixels per cm (scene is 32 cm × 18 cm)
const SUP={'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
const sup=n=>String(n).split('').map(c=>SUP[c]||c).join('');
function sci(v,unit){if(!Number.isFinite(v))return '—';if(v===0)return '0 '+unit;const a=Math.abs(v),e=Math.floor(Math.log10(a)+1e-9);
  if(e>=0&&e<4)return (a<10?v.toFixed(2):a<100?v.toFixed(1):v.toFixed(0))+' '+unit;const m=v/Math.pow(10,e);return m.toFixed(2)+' × 10'+sup(e)+' '+unit;}
function fmtV(v){if(!Number.isFinite(v))return '—';const a=Math.abs(v),s=v<0?'−':'';if(a>=1e6)return s+(a/1e6).toFixed(a>=1e7?1:2)+' MV';if(a>=1e3)return s+(a/1e3).toFixed(a>=1e5?0:a>=1e4?1:2)+' kV';return s+a.toFixed(a>=100?0:1)+' V';}
const X=cm=>cm*S,Y=cm=>cm*S;
const POINT=['single','dipole','like'];

/* ---------- sources ---------- */
function charges(p){const q=p.q;if(p.preset==='single')return [{x:16,y:9,q}];if(p.preset==='dipole')return [{x:11,y:9,q:Math.abs(q)},{x:21,y:9,q:-Math.abs(q)}];
  if(p.preset==='like')return [{x:11,y:9,q},{x:21,y:9,q}];return [];}
function plates(p){return {xl:16-p.d/2,xr:16+p.d/2,E:p.pv/(p.d/100)};}
function field(p,x,y){ // N/C, x,y in cm
  if(p.preset==='plates'){const P=plates(p);return (x>P.xl&&x<P.xr)?[P.E,0]:[0,0];}
  let ex=0,ey=0;for(const c of charges(p)){const dx=(x-c.x)/100,dy=(y-c.y)/100,r2=Math.max(dx*dx+dy*dy,1e-6),r=Math.sqrt(r2),f=K*c.q*1e-6/(r2*r);ex+=f*dx;ey+=f*dy;}return [ex,ey];}
function pot(p,x,y){ // volts
  if(p.preset==='plates'){const P=plates(p);return x<=P.xl?p.pv:x>=P.xr?0:p.pv*(P.xr-x)/p.d;}
  let v=0;for(const c of charges(p)){const r=Math.max(Math.hypot(x-c.x,y-c.y),0.3)/100;v+=K*c.q*1e-6/r;}return v;}
function nearest(p,x,y){let d=Infinity;for(const c of charges(p))d=Math.min(d,Math.hypot(x-c.x,y-c.y));return d;}
function onCharge(p,x,y){return POINT.includes(p.preset)&&nearest(p,x,y)<0.6;}
function testE(p){if(onCharge(p,p.tx,p.ty))return [NaN,NaN];return field(p,p.tx,p.ty);}
const mag=v=>Math.hypot(v[0],v[1]);
function dirWord(v){const m=mag(v);if(!Number.isFinite(m))return '—';if(m<1e-9)return 'none';const a=Math.atan2(-v[1],v[0])*180/Math.PI;const w=['→ right','↗ up-right','↑ up','↖ up-left','← left','↙ down-left','↓ down','↘ down-right'];return w[((Math.round(a/45)%8)+8)%8];}

/* ---------- cached geometry: field lines, equipotentials, color map ---------- */
function keyOf(p){return [p.preset,p.q,p.pv,p.d].join('|');}
function build(sim){const p=sim.p,key=keyOf(p);if(sim.vis.key===key)return sim.vis.geo;
  const geo={lines:[],cont:[],img:null,Vref:1};const cs=charges(p);
  if(p.preset==='plates'){geo.Vref=p.pv;}
  else{const qm=Math.max(...cs.map(c=>Math.abs(c.q)),1e-9);geo.Vref=K*qm*1e-6/0.02;
    // field lines
    let src=cs.filter(c=>c.q>0),sgn=1;if(!src.length){src=cs.filter(c=>c.q<0);sgn=-1;}
    src.forEach(c=>{const n=Math.round(6+3*Math.abs(c.q));for(let i=0;i<n;i++){const a=(i+0.5)/n*Math.PI*2;let x=c.x+Math.cos(a)*0.55,y=c.y+Math.sin(a)*0.55;const pts=[[x,y]];
      for(let s=0;s<700;s++){const e1=field(p,x,y),m1=mag(e1);if(!(m1>0))break;const h=0.11;const mx=x+sgn*e1[0]/m1*h/2,my=y+sgn*e1[1]/m1*h/2;const e2=field(p,mx,my),m2=mag(e2);if(!(m2>0))break;
        x+=sgn*e2[0]/m2*h;y+=sgn*e2[1]/m2*h;pts.push([x,y]);if(x<-1||x>33||y<-1||y>19)break;if(cs.some(o=>o!==c&&Math.sign(o.q)!==Math.sign(c.q)&&Math.hypot(x-o.x,y-o.y)<0.5))break;}
      geo.lines.push({pts:sgn>0?pts:pts.slice().reverse()});}});
    // equipotentials by marching squares on an 8 px grid
    const h=0.32,nx=Math.ceil(32/h)+1,ny=Math.ceil(18/h)+1,G=new Float64Array(nx*ny);
    for(let j=0;j<ny;j++)for(let i=0;i<nx;i++)G[j*nx+i]=pot(p,i*h,j*h);
    const rs=[1.5,2.2,3.2,4.6,6.5,9.5,14],lv=[];rs.forEach((r,ri)=>{const v=K*qm*1e-6/(r/100);lv.push({v,lab:ri>=2&&ri<=4},{v:-v,lab:ri>=2&&ri<=4});});if(p.preset==='dipole')lv.push({v:0,lab:true});
    lv.forEach(({v:L,lab:wantLab})=>{const segs=[];for(let j=0;j<ny-1;j++)for(let i=0;i<nx-1;i++){const a=G[j*nx+i],b=G[j*nx+i+1],c=G[(j+1)*nx+i+1],d=G[(j+1)*nx+i];
      const pts=[];const ed=(v1,v2,x1,y1,x2,y2)=>{if((v1-L)*(v2-L)<0){const f=(L-v1)/(v2-v1);pts.push([x1+(x2-x1)*f,y1+(y2-y1)*f]);}};
      const x0=i*h,y0=j*h;ed(a,b,x0,y0,x0+h,y0);ed(b,c,x0+h,y0,x0+h,y0+h);ed(d,c,x0,y0+h,x0+h,y0+h);ed(a,d,x0,y0,x0,y0+h);
      if(pts.length>=2)segs.push(pts[0],pts[1]);if(pts.length===4)segs.push(pts[2],pts[3]);}
      if(segs.length){let lab=null;if(wantLab)for(let s=0;s<segs.length;s++){const q=segs[s];if(q[0]>1.5&&q[0]<30.5&&q[1]>0.8&&q[1]<17&&(!lab||q[1]<lab[1]))lab=q;}geo.cont.push({V:L,segs,lab});}});}
  // color map of the potential
  if(typeof document!=='undefined'){const cv=document.createElement('canvas');cv.width=96;cv.height=54;const c2=cv.getContext('2d'),im=c2.createImageData(96,54);
    for(let j=0;j<54;j++)for(let i=0;i<96;i++){const v=pot(p,(i+0.5)/3,(j+0.5)/3),f=clamp(Math.sqrt(Math.abs(v)/geo.Vref),0,1),o=(j*96+i)*4;
      if(v>=0){im.data[o]=205;im.data[o+1]=45;im.data[o+2]=45;}else{im.data[o]=30;im.data[o+1]=95;im.data[o+2]=200;}im.data[o+3]=Math.round(f*80);}
    c2.putImageData(im,0,0);geo.img=cv;}
  sim.vis.key=key;sim.vis.geo=geo;return geo;}

/* ---------- show only what the current preset uses ---------- */
function syncMode(sim){const d=sim.def;
  if(!atLeast('honors')&&(sim.p.preset==='like'||sim.p.preset==='plates'))BioLab.setValues(sim,{preset:'single'});
  if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.preset;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});}

function arrowHead(ctx,x,y,a,h,c){ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*h*0.6,y+Math.sin(a)*h*0.6);ctx.lineTo(x+Math.cos(a+2.5)*h,y+Math.sin(a+2.5)*h);ctx.lineTo(x+Math.cos(a-2.5)*h,y+Math.sin(a-2.5)*h);ctx.closePath();ctx.fill();}
function arrow(ctx,x1,y1,x2,y2,c,w){const a=Math.atan2(y2-y1,x2-x1),h=Math.max(9,w*2.6);ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2-Math.cos(a)*h*0.7,y2-Math.sin(a)*h*0.7);ctx.stroke();
  ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-Math.cos(a-0.45)*h,y2-Math.sin(a-0.45)*h);ctx.lineTo(x2-Math.cos(a+0.45)*h,y2-Math.sin(a+0.45)*h);ctx.closePath();ctx.fill();}
function contColor(V,Vref){const f=clamp(0.35+0.65*Math.sqrt(Math.abs(V)/Vref),0.35,1);return V>0?'rgba(190,30,30,'+f+')':V<0?'rgba(25,85,190,'+f+')':'rgba(120,120,120,.9)';}

const EF={
  id:'efield',hash:'efield',apUnit:10,order:2,tab:'Electric fields and potential',kind:'Simulation',
  card:'Map the electric field and voltage around charges and between plates with field lines, equipotentials, a test charge and a voltage probe.',
  title:'Electric fields and potential',
  lede:{bio:'Every charge fills the space around it with an electric field. Drag a test charge around to feel the push, and see the field as arrows and lines.',
        honors:'Measure field strength and voltage with a test charge and a probe, compare point charges with parallel plates, and see why equipotentials take no work.',
        ap:'Connect the field to the potential: E = −dV/dx, W = qΔV, and E = V/d for a uniform field between plates.'},
  scale:'Scene is 32 cm × 18 cm. The test charge is +1 nC, small enough not to disturb the field it measures.',
  timeless:true,animated:true,chChange:1.2,chReveal:3.2,
  controls:[
    {id:'preset',label:'Charges',type:'seg',def:'single',lvl:'bio',options:[{v:'single',l:'One charge'},{v:'dipole',l:'+ and −'},{v:'like',l:'Two +',lvl:'honors'},{v:'plates',l:'Parallel plates',lvl:'honors'}]},
    {id:'q',label:'Source charge',type:'range',min:-5,max:5,step:0.5,def:2,unit:' μC',lvl:'bio',modes:POINT,help:'For + and −, this sets the size of both charges.'},
    {id:'pv',label:'Plate voltage',type:'range',min:10,max:500,step:10,def:100,unit:' V',lvl:'honors',modes:['plates']},
    {id:'d',label:'Plate separation',type:'range',min:4,max:16,step:1,def:10,unit:' cm',lvl:'ap',modes:['plates']},
    {id:'tx',label:'Test charge across',type:'range',min:1,max:31,step:0.5,def:24,unit:' cm',lvl:'bio'},
    {id:'ty',label:'Test charge up/down',type:'range',min:1,max:17,step:0.5,def:9,unit:' cm',lvl:'bio',help:'Measured from the top of the scene.'},
    {id:'vx',label:'Voltage probe across',type:'range',min:1,max:31,step:0.5,def:24,unit:' cm',lvl:'honors'},
    {id:'vy',label:'Voltage probe up/down',type:'range',min:1,max:17,step:0.5,def:3,unit:' cm',lvl:'honors'},
    {id:'vec',label:'Field arrows',type:'toggle',def:true,lvl:'bio'},
    {id:'lines',label:'Field lines',type:'toggle',def:true,lvl:'bio'},
    {id:'eq',label:'Equipotentials and voltage colors',type:'toggle',def:false,lvl:'bio'}
  ],
  init(){return {};},
  step(){},
  metrics:[
    {id:'E',label:'Field at test charge',unit:'kN/C',lvl:'bio',min:0,max:null,d:1,get:s=>mag(testE(s.p))/1000},
    {id:'F',label:'Force on test charge (+1 nC)',unit:'',lvl:'bio',text:true,get:s=>sci(mag(testE(s.p))*QT,'N')},
    {id:'dir',label:'Direction of push',unit:'',lvl:'bio',text:true,get:s=>dirWord(testE(s.p))},
    {id:'r',label:'Distance to nearest charge',unit:'cm',lvl:'bio',min:0,max:null,d:1,modes:POINT,get:s=>POINT.includes(s.p.preset)?nearest(s.p,s.p.tx,s.p.ty):NaN},
    {id:'Vt',label:'Voltage at test charge',unit:'',lvl:'honors',text:true,get:s=>onCharge(s.p,s.p.tx,s.p.ty)?'—':fmtV(pot(s.p,s.p.tx,s.p.ty))},
    {id:'Vp',label:'Voltage at probe',unit:'',lvl:'honors',text:true,get:s=>onCharge(s.p,s.p.vx,s.p.vy)?'—':fmtV(pot(s.p,s.p.vx,s.p.vy))},
    {id:'dV',label:'ΔV, test charge → probe',unit:'',lvl:'honors',text:true,get:s=>{const p=s.p;if(onCharge(p,p.tx,p.ty)||onCharge(p,p.vx,p.vy))return '—';const d=pot(p,p.vx,p.vy)-pot(p,p.tx,p.ty);return Math.abs(d)<1e-6*Math.max(1,Math.abs(pot(p,p.tx,p.ty)))?'0 V':fmtV(d);}},
    {id:'W',label:'Work to move it there, W = qΔV',unit:'',lvl:'ap',text:true,get:s=>{const p=s.p;if(onCharge(p,p.tx,p.ty)||onCharge(p,p.vx,p.vy))return '—';const d=pot(p,p.vx,p.vy)-pot(p,p.tx,p.ty);return Math.abs(d)<1e-6*Math.max(1,Math.abs(pot(p,p.tx,p.ty)))?'0 J':sci(QT*d,'J');}}
  ],
  graphs:[{id:'eline',label:'Field strength along the dashed line',lvl:'bio',custom:true},{id:'vline',label:'Voltage along the dashed line',lvl:'honors',custom:true},{id:'grad',label:'Eₓ compared with −dV/dx',lvl:'ap',custom:true}],
  defaultGraph:'eline',
  plot(sim,ctx,box,id){const p=sim.p,pl=p.preset==='plates',y=p.ty,N=321,xs=[];for(let i=0;i<N;i++)xs.push(i*0.1);
    const eu=pl?1:1000,eun=pl?'N/C':'kN/C',vu=pl?1:1000,vun=pl?'V':'kV';const cs=charges(p);
    const cap=pl?Infinity:K*Math.max(...cs.map(c=>Math.abs(c.q)),0.01)*1e-6/Math.pow(0.012,2)/eu;
    const ok=x=>!onCharge(p,x,y);
    const clip=()=>{ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();};
    const line=(ax,ys,c,w,dash)=>{ctx.strokeStyle=c;ctx.lineWidth=w;ctx.setLineDash(dash||[]);ctx.beginPath();let on=false;xs.forEach((x,i)=>{const v=ys[i];if(!Number.isFinite(v)){on=false;return;}on?ctx.lineTo(ax.X(x),ax.Y(v)):ctx.moveTo(ax.X(x),ax.Y(v));on=true;});ctx.stroke();ctx.setLineDash([]);};
    const mark=(ax)=>{ctx.strokeStyle=serColor(1);ctx.lineWidth=1.5;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(ax.X(p.tx),box.T);ctx.lineTo(ax.X(p.tx),box.T+box.H);ctx.stroke();ctx.setLineDash([]);txt(ctx,'test charge',ax.X(p.tx)+5,box.T+12,{s:12,c:serColor(1)});};
    if(id==='eline'){const ys=xs.map(x=>ok(x)?Math.min(mag(field(p,x,y))/eu,cap):NaN);const ymax=Math.max(...ys.filter(Number.isFinite),pl?1:0.001)*1.15;
      const ax=axes(ctx,box,{xmin:0,xmax:32,ymin:0,ymax,xl:'Position across the scene (cm)',yl:'Field strength ('+eun+')'});clip();line(ax,ys,serColor(0),2.5);mark(ax);ctx.restore();}
    else if(id==='vline'){const vcap=pl?Infinity:K*Math.max(...cs.map(c=>Math.abs(c.q)),0.01)*1e-6/0.012/vu;const ys=xs.map(x=>ok(x)?clamp(pot(p,x,y)/vu,-vcap,vcap):NaN);
      const fin=ys.filter(Number.isFinite);let lo=Math.min(0,...fin),hi=Math.max(0,...fin);if(hi-lo<1e-9)hi=lo+1;const pad=(hi-lo)*0.1;
      const ax=axes(ctx,box,{xmin:0,xmax:32,ymin:lo<0?lo-pad:0,ymax:hi+pad,xl:'Position across the scene (cm)',yl:'Voltage ('+vun+')'});clip();line(ax,ys,serColor(2),2.5);mark(ax);ctx.restore();}
    else{const ex=xs.map(x=>ok(x)?clamp(field(p,x,y)[0]/eu,-cap,cap):NaN);const gx=xs.map(x=>{if(!ok(x-0.1)||!ok(x+0.1)||!ok(x))return NaN;return clamp(-(pot(p,x+0.1,y)-pot(p,x-0.1,y))/0.002/eu,-cap,cap);});
      const fin=ex.filter(Number.isFinite);let lo=Math.min(0,...fin),hi=Math.max(0,...fin);if(hi-lo<1e-9)hi=lo+1;const pad=(hi-lo)*0.1;
      const ax=axes(ctx,box,{xmin:0,xmax:32,ymin:lo<0?lo-pad:0,ymax:hi+pad,xl:'Position across the scene (cm)',yl:'Eₓ ('+eun+')'});clip();line(ax,ex,serColor(0),3);
      ctx.fillStyle=serColor(2);xs.forEach((x,i)=>{if(i%8===4&&Number.isFinite(gx[i])){ctx.beginPath();ctx.arc(ax.X(x),ax.Y(gx[i]),3.5,0,6.29);ctx.fill();}});ctx.restore();
      legend(ctx,box.L+12,box.T+10,[{label:'Eₓ from the field',color:serColor(0)},{label:'−ΔV/Δx from the voltages (dots)',color:serColor(2)}]);}},
  narrate(sim){const p=sim.p,e=testE(p),E=mag(e),hon=atLeast('honors'),ap=atLeast('ap');
    if(!Number.isFinite(E))return 'The test charge is sitting on top of a source charge, where the field has no single value. Slide it away.';
    let s='';
    if(p.preset==='plates'){const P=plates(p),inside=p.tx>P.xl&&p.tx<P.xr;
      s=inside?'Between the plates the field is <b>uniform</b>: '+P.E.toFixed(0)+' N/C everywhere, pointing from the + plate to the − plate. The field lines are evenly spaced, so the field is the same strength at every point.':'Outside ideal plates the field is <b>zero</b>: the + and − plates’ fields cancel. Move the test charge between the plates.';
      if(ap)s+=' E = V/d = '+p.pv+' V ÷ '+(p.d/100).toFixed(2)+' m = '+P.E.toFixed(0)+' V/m.';}
    else{const cs=charges(p);if(cs.every(c=>c.q===0))return 'The source charge is zero, so there is no field anywhere. Give it some charge.';
      const r=nearest(p,p.tx,p.ty);
      s='The test charge is '+r.toFixed(1)+' cm from the nearest source and feels '+sci(E*QT,'N')+' pushing it <b>'+dirWord(e).slice(2)+'</b>.';
      if(p.preset==='dipole')s='Field lines <b>leave the + charge and end on the − charge</b>. '+s;
      else if(p.preset==='like')s='Lines from the two + charges never meet; between them there is a spot where the field is zero. '+s;
      else s+=(cs[0].q>0?' Arrows point away from a + charge':' Arrows point toward a − charge')+', and lines are packed tighter where the field is stronger.';}
    if(p.eq)s+=' The colored curves are <b>equipotentials</b>: every point on one has the same voltage, so moving along it takes no work.';
    else if(hon&&p.preset!=='plates')s+=' Turn on equipotentials to see the voltage map.';
    if(ap&&p.preset!=='plates')s+=' The field always points “downhill” in voltage: E = −dV/dx.';
    return s;},
  tour:[
    {title:'A charge makes a field',text:'The red ball is a +2 μC charge. It fills the space around it with an electric field, even where there is nothing to push on.',focus:[X(16)-50,Y(9)-50,100,100],speed:1,setup(sim){BioLab.setValues(sim,{preset:'single',q:2,tx:24,ty:9,vec:true,lines:true,eq:false});}},
    {title:'Field arrows',text:'Each arrow shows which way a small + charge would be pushed at that spot. Bigger, darker arrows mean a stronger field. They point away from a + charge.',focus:[X(8),Y(3),X(16),Y(12)],speed:1},
    {title:'Field lines go from + to −',text:'With a + and a − charge, the field lines leave the + charge and end on the − charge. Where lines bunch together the field is strong.',focus:[X(6),Y(2),X(20),Y(14)],speed:1,setup(sim){BioLab.setValues(sim,{preset:'dipole',q:2});}},
    {title:'The test charge',text:{bio:'The gold dot is a tiny +1 nC test charge. The arrow on it is the force it feels. Move it closer to a charge and the force grows quickly.',honors:'The force on the test charge is F = qE. Dividing the force by the test charge gives the field, so E does not depend on the test charge.'},focus:[X(24)-50,Y(9)-60,100,120],speed:1,setup(sim){BioLab.setValues(sim,{preset:'single',tx:24,ty:9});}},
    {title:'Equipotentials',text:'The colored rings connect points with the same voltage: red is high, blue is low. They always cross field lines at right angles.',focus:[X(4),Y(0.5),X(24),Y(17)],speed:1,setup(sim){BioLab.setValues(sim,{eq:true});}},
    {lvl:'honors',title:'The voltage probe',text:'The probe reads the voltage at its tip. ΔV between the test charge and the probe tells you the work per coulomb needed to move a charge between them, W = qΔV.',focus:[X(24)-60,Y(3)-40,120,90],speed:1,setup(sim){BioLab.setValues(sim,{vx:24,vy:3});}},
    {lvl:'honors',title:'Parallel plates',text:{honors:'Between oppositely charged plates the field lines are straight, parallel and evenly spaced: a uniform field. The equipotentials are evenly spaced too.',ap:'Between the plates E = V/d, and the voltage drops linearly from the + plate to the − plate. Slope of V(x) = −E.'},focus:[X(10),Y(0.3),X(12),Y(17.4)],speed:1,setup(sim){BioLab.setValues(sim,{preset:'plates',pv:100,d:10,tx:16,ty:9,eq:true});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{preset:'single',q:2,tx:24,ty:9,vx:24,vy:3,eq:false});},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='done')BioLab.setValues(sim,ch.set);},
  challenges:[
    {lvl:'bio',instant:true,set:{preset:'dipole',q:2,lines:true,vec:false},q:'In a + and − pair, where do electric field lines begin and end?',choices:['They begin on − and end on +','They begin on + and end on −','They form closed loops around each charge'],correct:1,
     explain:{bio:'Field lines show the direction a + test charge is pushed: away from + and toward −. So they start on the + charge and end on the − charge. The scene now shows the pair with field lines on.'}},
    {lvl:'bio',q:'Field lines are packed closer together near the charge. If the test charge moves from 8 cm away to 4 cm away, the field it feels becomes…',choices:['twice as strong','four times as strong','half as strong'],correct:1,
     baseline:{preset:'single',q:2,tx:24,ty:9,lines:true},change:{tx:20},changeText:'Test charge moved from 8 cm to 4 cm from the charge',watch:'eline',
     explain:{bio:'The field jumped from about 2,810 to 11,200 kN/C, four times stronger. Where the lines are closer together, the field is stronger.',honors:'E = kq/r²: halving r multiplies E by 4 (2.81×10⁶ → 1.12×10⁷ N/C). Closer field lines mean a stronger field.'}},
    {lvl:'honors',q:'The probe moves to a point the same distance from the charge as the test charge, on the same equipotential. How much work does it take to move the test charge to the probe?',choices:['Zero','A positive amount','It depends on the path'],correct:0,
     baseline:{preset:'single',q:2,tx:24,ty:9,vx:28,vy:9,eq:true},change:{vx:16,vy:17},changeText:'Probe moved to a point 8 cm from the charge',watch:'vline',
     explain:{honors:'Both points are 8 cm from the charge, so both are at 225 kV and ΔV = 0. W = qΔV = 0: moving along an equipotential takes no work, because the force is always perpendicular to the motion.'}},
    {lvl:'honors',q:'Between parallel plates, the test charge moves from near the + plate to the middle. The field it feels…',choices:['gets weaker','stays the same','gets stronger'],correct:1,
     baseline:{preset:'plates',pv:100,d:10,tx:12,ty:9,lines:true},change:{tx:16},changeText:'Test charge moved from 12 cm to 16 cm (the middle)',watch:'eline',
     explain:{honors:'The field reads 1.0 kN/C at both spots. Between large parallel plates the field is uniform: evenly spaced, parallel field lines mean the same strength everywhere.'}},
    {lvl:'ap',instant:true,set:{preset:'plates',pv:100,d:10,tx:16,ty:9,eq:true},q:'Plates 10 cm apart have 100 V across them. What is the field between them?',choices:['10 V/m','1,000 V/m','10,000 V/m'],correct:1,
     explain:{ap:'E = V/d = 100 V ÷ 0.10 m = 1,000 V/m (the same as 1,000 N/C, the 1.0 kN/C on the readout). The equipotentials are 1/6 of 100 V apart and evenly spaced: E = −dV/dx is constant.'}},
    {lvl:'ap',q:'The plates stay at 100 V. If the gap shrinks from 10 cm to 5 cm, the field between them…',choices:['halves','stays the same','doubles','quadruples'],correct:2,
     baseline:{preset:'plates',pv:100,d:10,tx:16,ty:9},change:{d:5},changeText:'Plate separation halved to 5 cm',watch:'eline',
     explain:{ap:'E = V/d: the same 100 V now drops over half the distance, so E doubles from 1,000 to 2,000 V/m. The voltage graph gets twice as steep.'}}
  ],
  lab:{bio:'<p><b>Question:</b> How does the field strength change with distance from a charge?</p><ol><li>Use One charge at +2 μC.</li><li>Move the test charge to 3, 4, 6, 8, 10 and 12 cm from it (keep it on the middle line), recording a trial each time.</li><li>Graph distance (x) against field (y).</li></ol><p>Describe the pattern. How does it compare with how close together the field lines are?</p>',
       honors:'<p><b>Question:</b> How are equipotentials related to field lines?</p><ol><li>Turn on equipotentials and field lines with the + and − pair.</li><li>Put the test charge and probe on the same colored curve and record ΔV.</li><li>Move the probe across three curves and record ΔV each time.</li></ol><p>What angle do equipotentials make with field lines? Explain why moving along an equipotential takes no work.</p>',
       ap:'<p><b>Question:</b> Does E = V/d hold between parallel plates?</p><ol><li>Choose Parallel plates. Keep the voltage at 200 V.</li><li>Record the field for separations of 4, 6, 8, 10, 12 and 16 cm.</li><li>Plot E against 1/d and find the slope.</li></ol><p><b>Claim–evidence–reasoning:</b> Show that the slope equals V. Then use the Eₓ vs −dV/dx graph to explain why E is the negative slope of V(x).</p>'},
  terms:[{t:'Electric field',d:'The push or pull per unit charge at a point, in newtons per coulomb (N/C). It points the way a + charge would be pushed.'},{t:'Test charge',d:'A tiny + charge used to measure a field without changing it.'},{t:'Field line',d:'A line that follows the field’s direction. Lines start on + charges and end on − charges; closer lines mean a stronger field.'},{t:'Equipotential',d:'A line or surface where every point has the same voltage.'},
    {lvl:'honors',t:'Electric potential (voltage)',d:'Electric potential energy per coulomb, V = kq/r for a point charge, in volts (J/C).'},{lvl:'honors',t:'Uniform field',d:'A field with the same strength and direction everywhere, like between parallel plates.'},
    {lvl:'ap',t:'Potential gradient',d:'E = −dV/dx: the field is the negative slope of the potential, pointing toward lower voltage.'},{lvl:'ap',t:'W = qΔV',d:'Work done by an outside agent to move charge q through a potential difference ΔV at constant speed.'}],
  about:'<p>Point charges sit in a vacuum, so E = kq/r² and V = kq/r with k = 8.99×10⁹ N·m²/C², and fields from several charges add as vectors (superposition). Voltages are measured relative to zero far away. The parallel plates are ideal: much wider than their gap, so the field is exactly V/d between them and zero outside, with no fringing at the edges. The left plate is at the set voltage and the right plate at 0 V. Field lines are traced from the + charges; arrows and lines use a log scale for strength so weak and strong regions both show.</p>',
  initVis(sim){sim.vis.key='';},
  draw(sim,ctx,vdt,k,t){const p=sim.p,hon=atLeast('honors'),geo=build(sim),pl=p.preset==='plates',cs=charges(p);
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    // grid
    ctx.strokeStyle=PAL['line'];ctx.globalAlpha=0.45;ctx.lineWidth=1;ctx.beginPath();for(let x=2;x<32;x+=2){ctx.moveTo(X(x)+.5,0);ctx.lineTo(X(x)+.5,450);}for(let y=2;y<18;y+=2){ctx.moveTo(0,Y(y)+.5);ctx.lineTo(800,Y(y)+.5);}ctx.stroke();ctx.globalAlpha=1;
    if(p.eq&&geo.img){ctx.save();ctx.imageSmoothingEnabled=true;ctx.drawImage(geo.img,0,0,800,450);ctx.restore();}
    // equipotentials
    if(p.eq){if(pl){const P=plates(p);for(let i=1;i<6;i++){const x=X(P.xl+(P.xr-P.xl)*i/6),V=p.pv*(6-i)/6;ctx.strokeStyle=contColor(V-p.pv/2,p.pv/2);ctx.lineWidth=2;ctx.setLineDash([7,5]);ctx.beginPath();ctx.moveTo(x,Y(0.6));ctx.lineTo(x,Y(17.4));ctx.stroke();ctx.setLineDash([]);const sp=(P.xr-P.xl)*S/6;if(sp>=30||i===3)pill(ctx,fmtV(V),x,Y(i%2?1.6:2.6),PAL['card'],contColor(V-p.pv/2,p.pv/2),11.5*k);}}
      else geo.cont.forEach(c=>{ctx.strokeStyle=contColor(c.V,geo.Vref);ctx.lineWidth=2;ctx.setLineDash([7,5]);ctx.beginPath();for(let i=0;i<c.segs.length;i+=2){ctx.moveTo(X(c.segs[i][0]),Y(c.segs[i][1]));ctx.lineTo(X(c.segs[i+1][0]),Y(c.segs[i+1][1]));}ctx.stroke();ctx.setLineDash([]);
        if(c.lab)pill(ctx,fmtV(c.V),X(c.lab[0]),Y(c.lab[1]),PAL['card'],contColor(c.V,geo.Vref),11*k);});}
    // field lines with flowing arrowheads
    const lc=PAL['cv-ink'];
    if(p.lines){ctx.strokeStyle=lc;ctx.globalAlpha=0.55;ctx.lineWidth=1.6;
      if(pl){const P=plates(p),n=clamp(Math.round(2+P.E/150),3,16);for(let i=0;i<n;i++){const y=Y(1+16*(i+0.5)/n);ctx.beginPath();ctx.moveTo(X(P.xl)+6,y);ctx.lineTo(X(P.xr)-6,y);ctx.stroke();
          const span=X(P.xr)-X(P.xl)-24,off=RM?span/2:((t*30)%span);ctx.globalAlpha=0.85;arrowHead(ctx,X(P.xl)+12+off,y,0,9,lc);ctx.globalAlpha=0.55;}}
      else geo.lines.forEach(L=>{const pts=L.pts;ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(X(q[0]),Y(q[1])):ctx.moveTo(X(q[0]),Y(q[1])));ctx.stroke();
        const sp=32,off=RM?sp*0.6:((t*1.4)%1)*sp;ctx.globalAlpha=0.85;for(let s=8+off;s<pts.length-4;s+=sp){const i=Math.floor(s),a=Math.atan2(pts[i+1][1]-pts[i][1],pts[i+1][0]-pts[i][0]);if(pts[i][0]>0&&pts[i][0]<32&&pts[i][1]>0&&pts[i][1]<18)arrowHead(ctx,X(pts[i][0]),Y(pts[i][1]),a,9,lc);}ctx.globalAlpha=0.55;});
      ctx.globalAlpha=1;}
    // field arrows on a grid
    if(p.vec){for(let gx=1;gx<32;gx+=2)for(let gy=1;gy<18;gy+=2){if(!pl&&nearest(p,gx,gy)<1.3)continue;const e=field(p,gx,gy),m=mag(e);if(!(m>1))continue;
      const L=clamp(4+4.2*Math.log10(m),8,26),al=clamp((Math.log10(m)-2)/5,0.25,1),ux=e[0]/m,uy=e[1]/m,cx=X(gx),cy=Y(gy);
      ctx.globalAlpha=pl?0.85:al;arrow(ctx,cx-ux*L/2,cy-uy*L/2,cx+ux*L/2,cy+uy*L/2,PAL['s5'],2.4);ctx.globalAlpha=1;}}
    // sources
    if(pl){const P=plates(p),n=clamp(Math.round(4+P.E/120),5,20);[[P.xl,'#c62828','+'],[P.xr,'#1f5bbf','−']].forEach(([x,c,s])=>{ctx.fillStyle=c;rr(ctx,X(x)-6,Y(0.6),12,Y(16.8),4);ctx.fill();
        for(let i=0;i<n;i++)txt(ctx,s,X(x)+(s==='+'?-15:15),Y(0.6)+(i+0.5)*Y(16.8)/n,{s:15*k,w:800,c,a:'center',b:'middle'});});
      pill(ctx,'+'+p.pv+' V',X(P.xl),Y(0.5)+2,'#c62828','#fff',12*k);pill(ctx,'0 V',X(P.xr),Y(0.5)+2,'#1f5bbf','#fff',12*k);
      if(hon){ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;const yb=Y(16.2);ctx.beginPath();ctx.moveTo(X(P.xl)+8,yb);ctx.lineTo(X(P.xr)-8,yb);ctx.stroke();pill(ctx,'d = '+p.d+' cm',X(16),yb,PAL['card'],PAL['cv-ink'],12*k);}}
    else cs.forEach(c=>{const R=14+4*Math.sqrt(Math.abs(c.q)),x=X(c.x),y=Y(c.y);const g=ctx.createRadialGradient(x-R*.35,y-R*.35,R*.15,x,y,R);const b=c.q>0?['#f6a3a3','#b71c1c']:c.q<0?['#a9c8fb','#174ea6']:['#d6d6d6','#6f6f6f'];
      g.addColorStop(0,b[0]);g.addColorStop(1,b[1]);ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,R,0,6.29);ctx.fill();txt(ctx,c.q>0?'+':c.q<0?'−':'0',x,y+1,{s:R*1.05,w:800,c:'#fff',a:'center',b:'middle'});
      txt(ctx,(c.q>0?'+':c.q<0?'−':'')+Math.abs(c.q).toFixed(1)+' μC',x,y+R+16,{s:13*k,w:700,a:'center'});});
    // graph line through the test charge
    ctx.strokeStyle=PAL['cv-soft'];ctx.globalAlpha=0.6;ctx.lineWidth=1;ctx.setLineDash([3,6]);ctx.beginPath();ctx.moveTo(0,Y(p.ty));ctx.lineTo(800,Y(p.ty));ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
    // voltage probe
    if(hon){const x=X(p.vx),y=Y(p.vy);ctx.save();ctx.translate(x,y);ctx.rotate(0.65);ctx.fillStyle='#9aa0a6';ctx.fillRect(-1.5,-26,3,20);ctx.fillStyle='#263238';rr(ctx,-6,-62,12,38,5);ctx.fill();ctx.fillStyle='#c62828';ctx.fillRect(-6,-34,12,5);ctx.restore();ctx.strokeStyle=PAL['cv-ink'];
      ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,6,0,6.29);ctx.moveTo(x-10,y);ctx.lineTo(x+10,y);ctx.moveTo(x,y-10);ctx.lineTo(x,y+10);ctx.stroke();
      const V=onCharge(p,p.vx,p.vy)?NaN:pot(p,p.vx,p.vy);const lx=x+(p.vx>26?-66:66);pill(ctx,'probe: '+fmtV(V),lx,p.vy<2?y+22:y-22,PAL['card'],PAL['cv-ink'],12.5*k);}
    // test charge and the force on it
    const tx=X(p.tx),ty=Y(p.ty),e=testE(p),E=mag(e);
    if(Number.isFinite(E)&&E>0){const F=E*QT,L=clamp(18+16*Math.log10(1+F/1e-6),20,120);arrow(ctx,tx,ty,tx+e[0]/E*L,ty+e[1]/E*L,PAL['s4'],5);
      pill(ctx,'F = '+sci(F,'N'),clamp(tx,70,730),p.ty<2.5?ty+28:ty-26,PAL['s4'],'#fff',12.5*k);}
    ctx.fillStyle='#e0a800';ctx.beginPath();ctx.arc(tx,ty,9,0,6.29);ctx.fill();ctx.strokeStyle='#7a5c00';ctx.lineWidth=1.5;ctx.stroke();txt(ctx,'+',tx,ty+1,{s:14,w:800,c:'#fff',a:'center',b:'middle'});
    if(!Number.isFinite(E))pill(ctx,'On top of a charge',tx,ty-24,PAL['s4'],'#fff',12*k);
    // scale bar
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(X(28.5),Y(17.4));ctx.lineTo(X(30.5),Y(17.4));ctx.moveTo(X(28.5),Y(17.4)-4);ctx.lineTo(X(28.5),Y(17.4)+4);ctx.moveTo(X(30.5),Y(17.4)-4);ctx.lineTo(X(30.5),Y(17.4)+4);ctx.stroke();txt(ctx,'2 cm',X(29.5),Y(17.4)-8,{s:12*k,a:'center',c:PAL['cv-soft']});
  },
  thumbSetup(sim){sim.p.preset='dipole';}
};
EF.controls[0].onChange=syncMode;
EF.onLevel=syncMode;
BioLab.register(EF);
})();
