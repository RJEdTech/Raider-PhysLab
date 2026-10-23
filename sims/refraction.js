(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,axes,legend}=BioLab.h;

/* ======================================================================
   Bending light. Snell's law n1 sin θ1 = n2 sin θ2, Fresnel reflectance
   (unpolarized), and Cauchy dispersion n(λ) = A + B/λ² (λ in nm).
   ====================================================================== */
const MED={
  air:    {name:'Air',A:1.0003,B:0},
  water:  {name:'Water',A:1.324,B:3046},
  glass:  {name:'Glass',A:1.5046,B:4200},
  diamond:{name:'Diamond',A:2.38,B:12800},
  mysA:   {name:'Mystery A',A:1.40,B:0},
  mysB:   {name:'Mystery B',A:1.65,B:0}
};
const nOf=(m,lam)=>MED[m].A+MED[m].B/(lam*lam);
const C=2.998e8, D2R=Math.PI/180, R2D=180/Math.PI;
const HX=400, HY=225;                                  // hit point on the boundary
const WHITE=[410,450,490,530,570,610,660];
const PRISM=[[400,111.4],[520,319.3],[280,319.3]];      // equilateral, 240 px sides
const FIB={x0:120,x1:780,y0:200,y1:250};

function lamRGB(l){let r=0,g=0,b=0;
  if(l<440){r=-(l-440)/60;b=1;}else if(l<490){g=(l-440)/50;b=1;}else if(l<510){g=1;b=-(l-510)/20;}else if(l<580){r=(l-510)/70;g=1;}else if(l<645){r=1;g=-(l-645)/65;}else r=1;
  const f=l<420?0.45+0.55*(l-380)/40:l>680?0.5+0.5*(700-l)/20:1;
  const c=v=>Math.round(255*Math.pow(clamp(v*f,0,1),0.8));return 'rgb('+c(r)+','+c(g)+','+c(b)+')';}
function colorName(l){return l<450?'violet':l<490?'blue':l<570?'green':l<590?'yellow':l<620?'orange':'red';}

/* Snell + Fresnel at one boundary. Returns θ2 (rad, NaN on TIR) and R (0–1). */
function snell(n1,n2,t1){const s=n1/n2*Math.sin(t1);if(s>1)return {t2:NaN,R:1,tir:true};
  const t2=Math.asin(s),ci=Math.cos(t1),ct=Math.cos(t2);
  const rs=(n1*ci-n2*ct)/(n1*ci+n2*ct),rp=(n1*ct-n2*ci)/(n1*ct+n2*ci);return {t2,R:(rs*rs+rp*rp)/2,tir:false};}

/* general 2-D ray tracer through one convex polygon. edgeOut(i) gives the outside medium per edge. */
function trace(p0,d0,poly,nIn,edgeOut,maxHits){const segs=[],esc=[];let p=p0,d=d0,inside=false,I=1,bounces=0,last=-1,out=null;
  for(let k=0;k<(maxHits||12);k++){let best=null;
    for(let i=0;i<poly.length;i++){if(i===last)continue;const a=poly[i],b=poly[(i+1)%poly.length];const ex=b[0]-a[0],ey=b[1]-a[1];
      const den=d[0]*ey-d[1]*ex;if(Math.abs(den)<1e-9)continue;const t=((a[0]-p[0])*ey-(a[1]-p[1])*ex)/den,u=((a[0]-p[0])*d[1]-(a[1]-p[1])*d[0])/den;
      if(t>1e-6&&u>=0&&u<=1&&(!best||t<best.t))best={t,i,ex,ey};}
    if(!best){segs.push({a:p,b:[p[0]+d[0]*1400,p[1]+d[1]*1400],I,inside});out=d;break;}
    const q=[p[0]+d[0]*best.t,p[1]+d[1]*best.t];segs.push({a:p,b:q,I,inside});
    const L=Math.hypot(best.ex,best.ey);let N=[best.ey/L,-best.ex/L];if(N[0]*d[0]+N[1]*d[1]>0)N=[-N[0],-N[1]];   // N faces the incoming ray
    const n1=inside?nIn:edgeOut(best.i),n2=inside?edgeOut(best.i):nIn,ci=-(N[0]*d[0]+N[1]*d[1]);
    const sn=snell(n1,n2,Math.acos(clamp(ci,-1,1)));const refl=[d[0]+2*ci*N[0],d[1]+2*ci*N[1]];
    if(sn.tir){d=refl;bounces++;}
    else{const r=n1/n2,ct=Math.cos(sn.t2);const tr=[r*d[0]+(r*ci-ct)*N[0],r*d[1]+(r*ci-ct)*N[1]];
      if(inside&&I*sn.R>0.04&&edgeOut.side&&edgeOut.side(best.i)){    // leaky wall: light escapes, weak reflection continues
        esc.push({a:q,d:tr,I:I*(1-sn.R)});I*=sn.R;d=refl;bounces++;}
      else{I*=(1-sn.R);d=tr;inside=!inside;if(!inside){segs.push({a:q,b:[q[0]+d[0]*1400,q[1]+d[1]*1400],I,inside});out=d;p=q;break;}}}
    p=q;last=best.i;}
  return {segs,esc,out,I,bounces,end:p};}

function prismTrace(sim,lam){const n=nOf(sim.p.bot,lam),th=sim.p.angle*D2R;
  const a=(30*D2R)-th,d=[Math.cos(a),Math.sin(a)],M=[340,215.35];
  const p0=[M[0]-d[0]*300,M[1]-d[1]*300];const r=trace(p0,d,PRISM,n,()=>1.0003,8);
  r.dev=r.out?(Math.atan2(r.out[1],r.out[0])-a)*R2D:NaN;r.src=p0;r.dir=d;return r;}
function fiberTrace(sim,lam){const p=sim.p,n=nOf('glass',lam),nc=p.clad==='clad'?1.46:1.0003,th=p.angle*D2R;
  const d=[Math.cos(th),Math.sin(th)],H=[FIB.x0,(FIB.y0+FIB.y1)/2],p0=[H[0]-d[0]*110,H[1]-d[1]*110];
  const poly=[[FIB.x0,FIB.y0],[FIB.x1,FIB.y0],[FIB.x1,FIB.y1],[FIB.x0,FIB.y1]];
  const eo=i=>(i===0||i===2)?nc:1.0003;eo.side=i=>i===0||i===2;
  const r=trace(p0,d,poly,n,eo,60);r.src=p0;r.dir=d;
  const ins=r.segs.filter(g=>g.inside),last=ins[ins.length-1];r.kept=(last&&last.b[0]>=FIB.x1-0.5&&ins[0])?last.I/ins[0].I:0;return r;}

function lamNow(sim){return sim.p.white?589:sim.p.lam;}
function intro(sim,lam){const p=sim.p,n1=nOf(p.top,lam),n2=nOf(p.bot,lam),t1=p.angle*D2R;const s=snell(n1,n2,t1);s.n1=n1;s.n2=n2;s.t1=t1;return s;}
function pairFor(sim){const p=sim.p;return p.mode==='intro'?[p.top,p.bot]:p.mode==='prism'?['air',p.bot]:['air','glass'];}

const REFR={
  id:'refraction',hash:'refraction',apUnit:9,order:1,kind:'Simulation',tab:'Bending light',
  card:'Shine a laser into water, glass and diamond. Measure angles, find the critical angle, split white light with a prism.',
  title:'Bending light',
  lede:{bio:'Shine a laser from one material into another. Watch it bend, bounce and split into colors.',
        honors:'Measure angles with the protractor, test Snell’s law n₁ sin θ₁ = n₂ sin θ₂, and find the critical angle for total internal reflection.',
        ap:'Use Snell’s law to find an unknown index from data, compute the speed and wavelength of light inside a material, and see how reflection grows with angle.'},
  scale:'Angles are true to life. Light travels 3.00 × 10⁸ m/s in vacuum; a real laser beam is about 1 mm wide. In the wave view, wavelengths (hundreds of nanometres) are drawn hugely enlarged.',
  timeless:true,animated:true,chChange:1.2,chReveal:3.2,
  controls:[
    {id:'mode',label:'Setup',type:'seg',def:'intro',lvl:'bio',options:[{v:'intro',l:'Two materials'},{v:'prism',l:'Prism'},{v:'fiber',l:'Optical fiber'}]},
    {id:'top',label:'Top material (Two materials)',type:'select',def:'air',lvl:'bio',options:[{v:'air',l:'Air'},{v:'water',l:'Water'},{v:'glass',l:'Glass'}]},
    {id:'bot',label:'Bottom material (also the prism)',type:'select',def:'water',lvl:'bio',options:[{v:'air',l:'Air'},{v:'water',l:'Water'},{v:'glass',l:'Glass'},{v:'diamond',l:'Diamond'},{v:'mysA',l:'Mystery A',lvl:'honors'},{v:'mysB',l:'Mystery B',lvl:'ap'}]},
    {id:'angle',label:'Laser angle from the normal',type:'range',min:0,max:85,step:0.5,def:45,unit:'°',d:1,lvl:'bio',help:'Click above the boundary to aim the laser.'},
    {id:'lam',label:'Laser wavelength',type:'range',min:380,max:700,step:5,def:650,unit:' nm',lvl:'honors'},
    {id:'white',label:'White light (all colors)',type:'toggle',def:false,lvl:'bio'},
    {id:'clad',label:'Around the fiber',type:'seg',def:'air',lvl:'honors',options:[{v:'air',l:'Air'},{v:'clad',l:'Cladding (n = 1.46)'}]},
    {id:'prot',label:'Protractor',type:'toggle',def:true,lvl:'bio',noTrial:true},
    {id:'wave',label:'Show wave fronts',type:'toggle',def:false,lvl:'ap',noTrial:true,help:'Draws crests so you can compare wavelength in each material'}
  ],
  init(){return {ph:0};},
  step(sim,dt){sim.st.ph+=dt;},
  metrics:[
    {id:'t1',label:'Angle of incidence θ₁',unit:'°',lvl:'bio',min:0,max:90,d:1,get:s=>s.p.angle},
    {id:'t2',label:'Angle of refraction θ₂',unit:'°',lvl:'bio',min:0,max:90,d:1,get:s=>{const p=s.p;if(p.mode==='intro')return intro(s,lamNow(s)).t2*R2D;if(p.mode==='prism')return snell(1.0003,nOf(p.bot,lamNow(s)),p.angle*D2R).t2*R2D;return snell(1.0003,nOf('glass',lamNow(s)),p.angle*D2R).t2*R2D;}},
    {id:'refl',label:'Light reflected',unit:'%',lvl:'bio',min:0,max:100,d:1,get:s=>{const pr=pairFor(s);return 100*snell(nOf(pr[0],lamNow(s)),nOf(pr[1],lamNow(s)),s.p.angle*D2R).R;}},
    {id:'trans',label:'Light passing through',unit:'%',lvl:'bio',min:0,max:100,d:1,get:s=>{const pr=pairFor(s);return 100-100*snell(nOf(pr[0],lamNow(s)),nOf(pr[1],lamNow(s)),s.p.angle*D2R).R;}},
    {id:'kept',label:'Light kept in the fiber',unit:'%',lvl:'bio',min:0,max:100,d:0,get:s=>s.p.mode==='fiber'?100*fiberTrace(s,lamNow(s)).kept:NaN},
    {id:'n1',label:'Index n₁ (top)',unit:'',lvl:'honors',min:1,max:2.5,d:3,get:s=>nOf(pairFor(s)[0],lamNow(s))},
    {id:'n2',label:'Index n₂ (bottom)',unit:'',lvl:'honors',min:1,max:2.5,d:3,get:s=>nOf(pairFor(s)[1],lamNow(s))},
    {id:'crit',label:'Critical angle',unit:'°',lvl:'honors',min:0,max:90,d:1,get:s=>{const pr=pairFor(s),a=nOf(pr[0],lamNow(s)),b=nOf(pr[1],lamNow(s));return a>b?Math.asin(b/a)*R2D:NaN;}},
    {id:'dev',label:'Prism bends light by',unit:'°',lvl:'honors',min:0,max:90,d:1,get:s=>s.p.mode==='prism'?prismTrace(s,lamNow(s)).dev:NaN},
    {id:'v2',label:'Speed in bottom material',unit:'×10⁸ m/s',lvl:'ap',min:0,max:3,d:3,get:s=>C/nOf(pairFor(s)[1],lamNow(s))/1e8},
    {id:'lam2',label:'Wavelength in bottom material',unit:'nm',lvl:'ap',min:0,max:700,d:0,get:s=>lamNow(s)/nOf(pairFor(s)[1],lamNow(s))}
  ],
  graphs:[
    {id:'angles',label:'Angle out vs angle in',lvl:'bio',custom:true},
    {id:'spectrum',label:'Bending vs color',lvl:'bio',custom:true},
    {id:'snell',label:'sin θ₂ vs sin θ₁ (Snell’s law)',lvl:'honors',custom:true},
    {id:'fresnel',label:'Reflected light vs angle',lvl:'ap',custom:true}
  ],
  defaultGraph:'angles',
  plot(sim,ctx,box,id){const p=sim.p,lam=lamNow(sim),pr=pairFor(sim),n1=nOf(pr[0],lam),n2=nOf(pr[1],lam);
    const curve=(ax,f,col,x0,x1)=>{ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.beginPath();let st=false;for(let i=0;i<=180;i++){const x=x0+(x1-x0)*i/180,y=f(x);if(!Number.isFinite(y)){st=false;continue;}const X=ax.X(x),Y=ax.Y(y);st?ctx.lineTo(X,Y):ctx.moveTo(X,Y);st=true;}ctx.stroke();};
    const dot=(ax,x,y)=>{if(!Number.isFinite(y))return;ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.arc(ax.X(x),ax.Y(y),6,0,6.29);ctx.fill();};
    if(id==='angles'){const ax=axes(ctx,box,{xmin:0,xmax:90,ymin:0,ymax:90,xl:'Angle in θ₁ (°) — '+MED[pr[0]].name,yl:'Angle out θ₂ (°) — '+MED[pr[1]].name});
      ctx.setLineDash([4,4]);curve(ax,x=>x,PAL['muted'],0,90);ctx.setLineDash([]);
      curve(ax,x=>snell(n1,n2,x*D2R).t2*R2D,PAL['g-line'],0,90);dot(ax,p.angle,snell(n1,n2,p.angle*D2R).t2*R2D);
      legend(ctx,box.L+10,box.T+8,[{label:'no bending',color:PAL['muted'],dash:true},{label:MED[pr[0]].name+' → '+MED[pr[1]].name,color:PAL['g-line']}]);}
    else if(id==='snell'){const ax=axes(ctx,box,{xmin:0,xmax:1,ymin:0,ymax:1,xl:'sin θ₁',yl:'sin θ₂'});
      curve(ax,x=>{const y=n1/n2*x;return y<=1?y:NaN;},PAL['g-line'],0,1);dot(ax,Math.sin(p.angle*D2R),n1/n2*Math.sin(p.angle*D2R)<=1?n1/n2*Math.sin(p.angle*D2R):NaN);
      legend(ctx,box.L+10,box.T+8,[{label:'slope = n₁/n₂ = '+(n1/n2).toFixed(3),color:PAL['g-line']}]);}
    else if(id==='fresnel'){const ax=axes(ctx,box,{xmin:0,xmax:90,ymin:0,ymax:100,xl:'Angle of incidence θ₁ (°)',yl:'Reflected (%)'});
      curve(ax,x=>100*snell(n1,n2,x*D2R).R,PAL['g-line'],0,89.9);dot(ax,p.angle,100*snell(n1,n2,p.angle*D2R).R);
      if(n1>n2){const c=Math.asin(n2/n1)*R2D;ctx.strokeStyle=PAL['s1'];ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(ax.X(c),box.T);ctx.lineTo(ax.X(c),box.T+box.H);ctx.stroke();ctx.setLineDash([]);txt(ctx,'critical '+c.toFixed(1)+'°',ax.X(c)-6,box.T+30,{s:12,c:PAL['s1'],a:'right'});}}
    else{ // spectrum: bending vs wavelength
      if(p.mode==='prism'){const ys=[];for(let l=380;l<=700;l+=5)ys.push(prismTrace(sim,l).dev);const ok=ys.filter(Number.isFinite);
        const lo=ok.length?Math.min(...ok):0,hi=ok.length?Math.max(...ok):1,pad=Math.max(0.3,(hi-lo)*0.25);
        const ax=axes(ctx,box,{xmin:380,xmax:700,ymin:Math.floor((lo-pad)*2)/2,ymax:Math.ceil((hi+pad)*2)/2,xl:'Wavelength (nm)',yl:'Prism bends light by (°)',yd:1});
        for(let l=380;l<700;l+=5){const a=ys[(l-380)/5],b=ys[(l-375)/5];if(!Number.isFinite(a)||!Number.isFinite(b))continue;ctx.strokeStyle=lamRGB(l);ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(ax.X(l),ax.Y(a));ctx.lineTo(ax.X(l+5),ax.Y(b));ctx.stroke();}
        if(!ok.length)txt(ctx,'All light is trapped inside the prism (total internal reflection)',box.L+box.W/2,box.T+box.H/2,{s:13,a:'center',c:PAL['cv-soft']});}
      else{const m=pr[1],ys=[];for(let l=380;l<=700;l+=5)ys.push(nOf(m,l));const lo=Math.min(...ys),hi=Math.max(...ys),pad=Math.max(0.005,(hi-lo)*0.3);
        const ax=axes(ctx,box,{xmin:380,xmax:700,ymin:lo-pad,ymax:hi+pad,xl:'Wavelength (nm)',yl:'Index n of '+MED[m].name.toLowerCase(),yd:3});
        for(let l=380;l<700;l+=5){ctx.strokeStyle=lamRGB(l);ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(ax.X(l),ax.Y(nOf(m,l)));ctx.lineTo(ax.X(l+5),ax.Y(nOf(m,l+5)));ctx.stroke();}}}},
  narrate(sim){const p=sim.p,lam=lamNow(sim),hon=atLeast('honors');
    if(p.mode==='prism'){const r=prismTrace(sim,lam);
      if(!r.out||r.bounces>0&&p.bot==='diamond')return '<b>The light is trapped.</b> Inside diamond it hits the far face beyond the critical angle and reflects, again and again. That is why diamonds sparkle.';
      if(p.bot==='air')return 'An air “prism” in air does nothing: the light speeds are the same, so the beam goes straight.';
      if(p.white)return '<b>White light splits into colors.</b> Violet slows down the most in '+MED[p.bot].name.toLowerCase()+', so it bends the most; red bends the least. This is <b>dispersion</b>.';
      if(r.bounces>0)return 'The light hits the second face beyond the critical angle, reflects inside the prism, and leaves through the bottom face instead. Try a larger angle.';
      return 'The prism bends '+colorName(lam)+' light by <b>'+r.dev.toFixed(1)+'°</b> in two steps: once going in, once coming out.'+(hon?' Change the wavelength: shorter waves bend more.':'');}
    if(p.mode==='fiber'){const r=fiberTrace(sim,lam);
      if(r.kept>0.95&&r.bounces===0)return 'Aimed straight down the fiber, the light never touches the walls. Tilt the laser to see it bounce.';
      if(r.kept>0.95)return '<b>The light is trapped in the fiber.</b> Every time it hits the wall it is past the critical angle, so it reflects completely ('+r.bounces+' bounces). Internet signals travel this way.';
      return 'Some light leaks into the '+(p.clad==='clad'?'cladding':'air')+' at each bounce, because it hits the wall at less than the critical angle. Only '+Math.round(r.kept*100)+'% reaches the far end.';}
    const s=intro(sim,lam),t2=s.t2*R2D;
    if(s.tir)return '<b>Total internal reflection.</b> Going from '+MED[p.top].name.toLowerCase()+' into '+MED[p.bot].name.toLowerCase()+' beyond '+(Math.asin(s.n2/s.n1)*R2D).toFixed(1)+'° (the critical angle), no light gets out: 100% reflects.';
    if(Math.abs(s.n1-s.n2)<1e-4)return 'Both sides are the same material, so the light goes straight through without bending.';
    if(p.angle<0.5)return 'Straight in along the normal, light does not bend, even though it '+(s.n2>s.n1?'slows down':'speeds up')+'.';
    const tow=s.n2>s.n1;
    return 'Light '+(tow?'slows down':'speeds up')+' entering '+MED[p.bot].name.toLowerCase()+', so it bends <b>'+(tow?'toward':'away from')+' the normal</b>: '+p.angle.toFixed(1)+'° in, '+t2.toFixed(1)+'° out.'+(hon?' Check: '+s.n1.toFixed(2)+' sin '+p.angle.toFixed(1)+'° = '+(s.n1*Math.sin(s.t1)).toFixed(3)+' = '+s.n2.toFixed(2)+' sin '+t2.toFixed(1)+'°.':' About '+Math.round(100*s.R)+'% of the light reflects.');},
  tour:[
    {title:'A laser and a boundary',text:'A red laser shines from air down into water. The flat line where they meet is the boundary.',focus:[60,40,440,370],setup(sim){BioLab.setValues(sim,{mode:'intro',top:'air',bot:'water',angle:45,white:false,prot:true,lam:650});}},
    {title:'The normal and the protractor',text:'Angles are measured from the <b>normal</b>, the dashed line at 90° to the boundary. The protractor shows the angle in (θ₁) and the angle out (θ₂).',focus:[250,60,300,330]},
    {title:'Bending toward the normal',text:{bio:'Light slows down in water and even more in glass. Slowing down makes it bend toward the normal.',honors:'Glass has a higher index of refraction n, so by n₁ sin θ₁ = n₂ sin θ₂ the angle out must be smaller.'},focus:[300,200,240,220],setup(sim){BioLab.setValues(sim,{bot:'glass'});}},
    {title:'Some light reflects',text:'A little light always bounces off, at the same angle it came in. The readouts show how much reflects and how much passes through.',focus:[380,40,380,200]},
    {title:'Total internal reflection',text:'Now the laser is inside glass, shining up into air. Past the <b>critical angle</b> (about 41°), no light escapes. It all reflects.',focus:[180,40,460,370],setup(sim){BioLab.setValues(sim,{top:'glass',bot:'air',angle:55});}},
    {title:'A prism splits white light',text:'Each color slows down a different amount in glass. Violet bends most and red least, so white light fans out into a rainbow.',focus:[60,80,730,300],setup(sim){BioLab.setValues(sim,{mode:'prism',bot:'glass',angle:48,white:true});}},
    {title:'Optical fiber',text:'A glass fiber traps light by total internal reflection, bounce after bounce. This is how internet signals cross oceans.',focus:[0,150,800,150],setup(sim){BioLab.setValues(sim,{mode:'fiber',white:false,angle:35,clad:'air'});}},
    {lvl:'ap',title:'Wavelength shrinks inside',text:'With wave fronts on, compare crest spacing: frequency stays the same, but light slows to v = c/n, so λ inside = λ/n.',focus:[200,40,420,380],setup(sim){BioLab.setValues(sim,{mode:'intro',top:'air',bot:'glass',angle:30,wave:true});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'intro',top:'air',bot:'water',angle:45,white:false,wave:false,clad:'air'});},
  challenges:[
    {lvl:'bio',q:'The laser goes from air into glass at 45°. Which way does it bend?',choices:['Toward the normal (θ₂ smaller than 45°)','Away from the normal (θ₂ bigger than 45°)','It goes straight'],correct:0,
     baseline:{mode:'intro',top:'air',bot:'air',angle:45,white:false},change:{bot:'glass'},changeText:'Bottom changed to glass',watch:'angles',
     explain:{bio:'Light slows down in glass. The side of the beam that enters first slows first, so the beam swings toward the normal: about 28° out.',honors:'n₂ > n₁, so sin θ₂ = (n₁/n₂) sin θ₁ is smaller: θ₂ ≈ 27.8° for n = 1.51.'}},
    {lvl:'bio',q:'White light goes through a glass prism. Which color bends the most?',choices:['Red','Green','Violet','All colors bend the same'],correct:2,
     baseline:{mode:'prism',bot:'glass',angle:48,white:false,lam:650},change:{white:true},changeText:'White light switched on',watch:'spectrum',
     explain:{bio:'Glass slows violet light a little more than red light, so violet bends the most. That spreads white light into a rainbow.',honors:'Glass has a slightly higher n for short wavelengths (dispersion): n ≈ 1.53 for violet versus 1.51 for red.'}},
    {lvl:'bio',q:'A laser enters a glass fiber at a slant. What happens when it reaches the side walls?',choices:['It leaks out the sides','It reflects off the walls and stays inside','It stops'],correct:1,
     baseline:{mode:'fiber',clad:'air',angle:0,white:false},change:{angle:40},changeText:'Laser tilted to 40°',watch:'angles',
     explain:{bio:'Inside the fiber the light hits each wall at a steep, glancing angle, past the critical angle, so it all reflects back in. It zigzags to the far end.',honors:'Entering at 40° gives θ₂ ≈ 25° inside, so it hits the walls at 65°, beyond glass–air’s 41° critical angle.'}},
    {lvl:'honors',q:'Light inside glass hits the glass–air boundary. The angle grows from 30° to 50°. What happens?',choices:['It bends out even more','All of it reflects back into the glass','It goes straight out'],correct:1,
     baseline:{mode:'intro',top:'glass',bot:'air',angle:30,white:false,lam:650},change:{angle:50},changeText:'Angle raised to 50°',watch:'angles',
     explain:{honors:'The critical angle for glass to air is sin⁻¹(1.00/1.51) ≈ 41°. Beyond it, sin θ₂ would have to exceed 1, so no light refracts: total internal reflection.'}},
    {lvl:'honors',q:'Light in air hits Mystery A at 40°. If it bends to about 27°, what is Mystery A’s index?',choices:['1.00','1.40','1.65','2.42'],correct:1,
     baseline:{mode:'intro',top:'air',bot:'mysA',angle:0,white:false},change:{angle:40},changeText:'Angle set to 40°',watch:'snell',
     explain:{honors:'n₂ = n₁ sin θ₁ / sin θ₂ = 1.00 × sin 40° / sin 27.3° = 0.643 / 0.459 ≈ 1.40.'}},
    {lvl:'ap',q:'A 650 nm laser goes from air into glass (n ≈ 1.51). What is its wavelength inside the glass?',choices:['650 nm','About 430 nm','About 980 nm'],correct:1,
     baseline:{mode:'intro',top:'air',bot:'air',angle:30,white:false,lam:650,wave:true},change:{bot:'glass'},changeText:'Bottom changed to glass',watch:'snell',
     explain:{ap:'Frequency is set by the source and cannot change at the boundary. Speed drops to c/n, so λ = v/f drops by the same factor: 650 / 1.514 ≈ 429 nm.'}},
    {lvl:'ap',q:'Light in air enters Mystery B. At 20° it bends to 12.0°; at 50° to 27.7°. What is the index of Mystery B?',choices:['1.40','1.65','2.42','It changes with angle'],correct:1,
     baseline:{mode:'intro',top:'air',bot:'mysB',angle:20,white:false},change:{angle:50},changeText:'Angle raised to 50°',watch:'snell',
     explain:{ap:'Plot sin θ₂ against sin θ₁: a straight line through the origin with slope n₁/n₂ = 0.606. So n₂ = 1/0.606 = 1.65, the same at every angle.'}},
    {lvl:'ap',q:'What is the critical angle for light leaving diamond (n = 2.42) into air?',choices:['About 24°','About 41°','About 49°','There is none'],correct:0,instant:true,
     explain:{ap:'θc = sin⁻¹(n₂/n₁) = sin⁻¹(1.00/2.42) ≈ 24.4°. Such a small critical angle traps light inside a cut diamond, which is why it sparkles.'}}
  ],
  lab:{bio:'<p><b>Question:</b> How does the material change how much light bends?</p><ol><li>Keep the top as air and the laser at 45°.</li><li>Choose water, then glass, then diamond for the bottom. Record the angle of refraction each time.</li><li>Order the materials from least to most bending.</li></ol><p>Write a claim: which material slows light the most? Use your angles as evidence.</p>',
       honors:'<p><b>Question:</b> What is the index of refraction of Mystery A?</p><ol><li>Top: air. Bottom: Mystery A.</li><li>Record θ₁ and θ₂ for 10°, 20°, 30°, 40°, 50°, 60°.</li><li>Calculate sin θ₁ and sin θ₂, and plot sin θ₂ (y) vs sin θ₁ (x).</li></ol><p>Use the slope (n₁/n₂) to find n for Mystery A. Then set top = glass, bottom = air and find the critical angle by experiment; compare with sin⁻¹(1/n).</p>',
       ap:'<p><b>Question:</b> How do the index, speed and wavelength of light relate?</p><ol><li>For Mystery B, collect θ₁, θ₂ pairs and fit sin θ₂ = (1/n) sin θ₁ to find n with an uncertainty.</li><li>Set the wavelength to 450, 550 and 650 nm in glass; record n, v and λ in the glass.</li><li>Show that v = c/n and λ<sub>glass</sub> = λ/n hold for each.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why the frequency of light cannot change at a boundary, and use that to justify λ<sub>glass</sub> = λ/n.</p>'},
  terms:[{t:'Refraction',d:'Bending of light as it crosses into a material where it travels at a different speed.'},{t:'Normal',d:'An imaginary line at 90° to the boundary. Angles are measured from it.'},{t:'Angle of incidence',d:'Angle between the incoming beam and the normal.'},{t:'Angle of refraction',d:'Angle between the bent beam and the normal.'},{t:'Reflection',d:'Light bouncing off a surface at the same angle it came in.'},{t:'Dispersion',d:'Different colors bend by different amounts, so white light spreads into a spectrum.'},
    {lvl:'honors',t:'Index of refraction (n)',d:'n = c/v: how many times slower light travels in the material than in vacuum.'},{lvl:'honors',t:'Snell’s law',d:'n₁ sin θ₁ = n₂ sin θ₂.'},{lvl:'honors',t:'Critical angle',d:'The angle of incidence where the refracted ray skims the boundary (θ₂ = 90°): sin θc = n₂/n₁.'},{lvl:'honors',t:'Total internal reflection',d:'Beyond the critical angle, going into a lower-index material, all light reflects.'},
    {lvl:'ap',t:'Wavelength in a medium',d:'λₙ = λ/n. Frequency stays fixed; speed and wavelength drop by the factor n.'},{lvl:'ap',t:'Fresnel reflection',d:'The fraction of light reflected rises with angle and reaches 100% at grazing incidence or beyond the critical angle.'}],
  about:'<p>The angles follow Snell’s law n₁ sin θ₁ = n₂ sin θ₂ exactly. Reflection and transmission percentages use the Fresnel equations for unpolarized light. Each material’s index depends on wavelength through the Cauchy formula n = A + B/λ² (water 1.333, glass 1.517, diamond 2.417 at 589 nm). Mystery materials have no dispersion.</p><p>Prism and fiber rays are traced through every surface they hit. In the prism only the main beam is shown (weak extra reflections are left out). The fiber is drawn shorter and thicker than a real one so you can see the bounces; with cladding, the light that leaks at each bounce is shown.</p><p>Simplifications: no absorption, no polarization effects shown, and the beam is treated as a single ray.</p>',
  onClick(sim,x,y){if(sim.p.mode==='intro'&&y<HY-10){const a=Math.atan2(Math.abs(x-HX),HY-y)*R2D;BioLab.setValues(sim,{angle:Math.round(clamp(a,0,85)*2)/2});}
    else if(sim.p.mode!=='intro'){const a=sim.p.mode==='fiber'?Math.atan2(Math.abs(y-225),Math.max(1,FIB.x0-x))*R2D:null;if(a!==null&&x<FIB.x0)BioLab.setValues(sim,{angle:Math.round(clamp(a,0,85)*2)/2});}},
  draw(sim,ctx,vdt,k){const p=sim.p,s=sim.st,hon=atLeast('honors'),ap=atLeast('ap');
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    const lams=p.white?WHITE:[p.lam];
    const fillFor=m=>m==='water'?[PAL['cv-water'],1]:m==='glass'?[PAL['cv-glass'],.38]:m==='diamond'?['#9fb8e8',.42]:m==='mysA'?['#b58ad8',.32]:m==='mysB'?['#d8a05a',.35]:null;
    function beam(a,b,col,I,w){if(I<0.004)return;ctx.save();ctx.lineCap='round';ctx.globalAlpha=clamp(0.25*Math.sqrt(I),0.04,0.3);ctx.strokeStyle=col;ctx.lineWidth=(w||3)*3;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();
      ctx.globalAlpha=clamp(Math.sqrt(I),0.1,1);ctx.lineWidth=w||3;ctx.stroke();
      // moving light pulses show direction of travel
      ctx.globalAlpha=clamp(Math.sqrt(I),0.1,1)*.9;ctx.strokeStyle=PAL['cv-bg'];ctx.lineWidth=1.2;ctx.setLineDash([3,27]);ctx.lineDashOffset=-(s.ph*60%30);ctx.stroke();ctx.restore();}
    function whiteBeam(a,b,I){if(I<0.004)return;ctx.save();ctx.lineCap='round';ctx.globalAlpha=.35*I;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();ctx.globalAlpha=I;ctx.strokeStyle='#ffffff';ctx.lineWidth=3;ctx.stroke();ctx.restore();}
    function laser(src,dir,label){const ang=Math.atan2(dir[1],dir[0]);ctx.save();ctx.translate(src[0],src[1]);ctx.rotate(ang);ctx.fillStyle='#3a3e45';rr(ctx,-74,-11,78,22,5);ctx.fill();ctx.fillStyle='#62666e';ctx.fillRect(2,-6,8,12);ctx.fillStyle=p.white?'#f1f1f1':lamRGB(p.lam);ctx.beginPath();ctx.arc(-58,0,4.5,0,6.29);ctx.fill();ctx.restore();
      if(label)txt(ctx,label,src[0]-dir[0]*40,src[1]-dir[1]*40-18,{s:12*k,a:'center',c:PAL['cv-soft']});}
    if(p.mode==='intro'){
      const ft=fillFor(p.top),fb=fillFor(p.bot);
      if(ft){ctx.globalAlpha=ft[1];ctx.fillStyle=ft[0];ctx.fillRect(0,0,800,HY);ctx.globalAlpha=1;}
      if(fb){ctx.globalAlpha=fb[1];ctx.fillStyle=fb[0];ctx.fillRect(0,HY,800,450-HY);ctx.globalAlpha=1;}
      ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,HY);ctx.lineTo(800,HY);ctx.stroke();
      const lab=(m,y)=>{const n=nOf(m,lamNow(sim));txt(ctx,MED[m].name+(hon?'  n = '+n.toFixed(3):''),16,y,{s:15*k,w:700});txt(ctx,'light: '+(C/n/1e8).toFixed(2)+' × 10⁸ m/s',16,y+20*k,{s:12*k,c:PAL['cv-soft']});};
      lab(p.top,30);lab(p.bot,HY+30);
      // normal
      ctx.strokeStyle=PAL['cv-ink'];ctx.globalAlpha=.6;ctx.setLineDash([6,5]);ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(HX,HY-185);ctx.lineTo(HX,HY+185);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
      txt(ctx,'normal',HX-6,HY-160,{s:12*k,a:'right',c:PAL['cv-soft']});
      // protractor
      if(p.prot){const R=150;ctx.save();ctx.globalAlpha=.9;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.beginPath();ctx.arc(HX,HY,R,0,6.29);ctx.stroke();ctx.beginPath();ctx.arc(HX,HY,R-18,0,6.29);ctx.globalAlpha=.4;ctx.stroke();ctx.globalAlpha=.9;
        for(let a=0;a<360;a+=5){const r1=a%10===0?R-12:R-6,c=Math.cos(a*D2R),sn=Math.sin(a*D2R);ctx.beginPath();ctx.moveTo(HX+c*R,HY+sn*R);ctx.lineTo(HX+c*r1,HY+sn*r1);ctx.stroke();}
        for(let q=0;q<4;q++)for(const a of [30,60,90]){if(a===90&&q%2)continue;const sgx=q<2?1:-1,sgy=q%2?1:-1,ang=a*D2R;const X=HX+sgx*Math.sin(ang)*(R-26),Y=HY+sgy*Math.cos(ang)*(R-26);txt(ctx,a+'°',X,Y,{s:10.5*k,a:'center',b:'middle',c:PAL['cv-soft']});}
        ctx.restore();}
      const lam0=lamNow(sim),src=[HX-Math.sin(p.angle*D2R)*215,HY-Math.cos(p.angle*D2R)*215],dIn=[Math.sin(p.angle*D2R),Math.cos(p.angle*D2R)];
      // incident
      if(p.white)whiteBeam(src,[HX,HY],1);else beam(src,[HX,HY],lamRGB(p.lam),1);
      // reflected and refracted for each wavelength
      let first=null;
      lams.forEach(l=>{const sn=intro(sim,l),col=lamRGB(l),Iw=p.white?0.55:1;if(!first||l===589)first=sn;
        const rEnd=[HX+Math.sin(sn.t1)*260,HY-Math.cos(sn.t1)*260];
        if(!p.white)beam([HX,HY],rEnd,col,sn.R*Iw);
        if(!sn.tir){const tEnd=[HX+Math.sin(sn.t2)*320,HY+Math.cos(sn.t2)*320];beam([HX,HY],tEnd,col,(1-sn.R)*Iw,p.white?2:3);}});
      if(p.white){const sn=intro(sim,589);whiteBeam([HX,HY],[HX+Math.sin(sn.t1)*260,HY-Math.cos(sn.t1)*260],sn.R);}
      const sn=intro(sim,lam0);
      laser(src,dIn);
      // wave fronts (AP): crests perpendicular to the beam, spacing ∝ λ/n
      if(p.wave&&!p.white){const sp0=34;ctx.save();ctx.strokeStyle=lamRGB(p.lam);ctx.lineWidth=2;ctx.globalAlpha=.9;const off=(s.ph*1.2)%1;
        for(let j=0;j<7;j++){const dd=(j+off)*sp0;if(dd>205)break;const c=[HX-dIn[0]*dd,HY-dIn[1]*dd],nx=dIn[1],ny=-dIn[0];ctx.beginPath();ctx.moveTo(c[0]-nx*12,c[1]-ny*12);ctx.lineTo(c[0]+nx*12,c[1]+ny*12);ctx.stroke();}
        if(!sn.tir){const sp=sp0*sn.n1/sn.n2,dT=[Math.sin(sn.t2),Math.cos(sn.t2)];for(let j=0;j<14;j++){const dd=(j+1-off)*sp;if(dd>215)break;const c=[HX+dT[0]*dd,HY+dT[1]*dd],nx=dT[1],ny=-dT[0];ctx.beginPath();ctx.moveTo(c[0]-nx*12,c[1]-ny*12);ctx.lineTo(c[0]+nx*12,c[1]+ny*12);ctx.stroke();}}
        ctx.restore();txt(ctx,'crest spacing: λ = '+p.lam+' nm above, '+(sn.tir?'—':(p.lam/sn.n2*sn.n1).toFixed(0)+' nm below'),784,HY+30,{s:12*k,a:'right',c:PAL['cv-ink']});}
      // angle arcs and labels
      const t1=p.angle,t2=sn.t2*R2D;
      ctx.lineWidth=2;ctx.strokeStyle=PAL['s4'];ctx.beginPath();ctx.arc(HX,HY,62,-Math.PI/2-t1*D2R,-Math.PI/2);ctx.stroke();
      if(t1>2)pill(ctx,'θ₁ = '+t1.toFixed(1)+'°',HX-Math.sin(t1/2*D2R)*95-10,HY-Math.cos(t1/2*D2R)*95,PAL['card'],PAL['cv-ink'],12*k);
      if(!sn.tir){ctx.strokeStyle=PAL['s2'];ctx.beginPath();ctx.arc(HX,HY,62,Math.PI/2-t2*D2R,Math.PI/2);ctx.stroke();
        if(t2>2)pill(ctx,'θ₂ = '+t2.toFixed(1)+'°',HX+Math.sin(t2/2*D2R)*95+12,HY+Math.cos(t2/2*D2R)*95,PAL['card'],PAL['cv-ink'],12*k);}
      else pill(ctx,'Total internal reflection',HX+140,HY+60,'#C11430','#fff',13*k);
      // intensity meter
      const mw=150*k,mh=62*k,mx=792-mw,my=440-mh;ctx.fillStyle=PAL['card'];rr(ctx,mx,my,mw,mh,8);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
      [['Reflected',sn.R,PAL['s4']],['Through',1-sn.R,PAL['s2']]].forEach(([l,v,c],i)=>{const y=my+mh*(i?0.72:0.32);txt(ctx,l,mx+8,y,{s:11.5*k,c:PAL['cv-soft'],b:'middle'});const bx=mx+64*k,bw=mw-64*k-40*k;ctx.fillStyle=PAL['line'];ctx.fillRect(bx,y-4*k,bw,8*k);ctx.fillStyle=c;ctx.fillRect(bx,y-4*k,bw*v,8*k);txt(ctx,(100*v).toFixed(0)+'%',mx+mw-6,y,{s:11*k,a:'right',w:700,b:'middle'});});
      if(hon&&!sn.tir)txt(ctx,'n₁ sin θ₁ = '+(sn.n1*Math.sin(sn.t1)).toFixed(3)+'   n₂ sin θ₂ = '+(sn.n2*Math.sin(sn.t2)).toFixed(3),784,30,{s:13*k,a:'right',w:700});
      if(hon&&sn.n1>sn.n2)txt(ctx,'critical angle θc = '+(Math.asin(sn.n2/sn.n1)*R2D).toFixed(1)+'°',784,50,{s:12*k,a:'right',c:PAL['cv-soft']});
    }
    else if(p.mode==='prism'){
      const f=fillFor(p.bot);ctx.beginPath();PRISM.forEach((v,i)=>i?ctx.lineTo(v[0],v[1]):ctx.moveTo(v[0],v[1]));ctx.closePath();
      if(f){ctx.globalAlpha=f[1];ctx.fillStyle=f[0];ctx.fill();ctx.globalAlpha=1;}ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.stroke();
      txt(ctx,MED[p.bot].name+' prism'+(hon?'  n = '+nOf(p.bot,lamNow(sim)).toFixed(3):''),400,350,{s:13*k,a:'center',w:700});
      // normal at entry face
      const M=[340,215.35],nrm=[-0.866,-0.5];ctx.strokeStyle=PAL['cv-ink'];ctx.globalAlpha=.55;ctx.setLineDash([5,5]);ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(M[0]+nrm[0]*80,M[1]+nrm[1]*80);ctx.lineTo(M[0]-nrm[0]*60,M[1]-nrm[1]*60);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
      const screenX=770;ctx.fillStyle=PAL['cv-lamp'];ctx.fillRect(screenX,60,10,330);txt(ctx,'screen',screenX+5,52,{s:11*k,a:'center',c:PAL['cv-soft']});
      let r0=null;const spots=[];
      lams.forEach(l=>{const r=prismTrace(sim,l);if(!r0)r0=r;const col=lamRGB(l),Iw=p.white?0.6:1;
        r.segs.forEach((g,i)=>{if(i===0)return;let b=g.b;if(!g.inside&&b[0]>screenX){const t=(screenX-g.a[0])/(b[0]-g.a[0]);if(t>0&&t<1){b=[screenX,g.a[1]+(b[1]-g.a[1])*t];spots.push([b[1],col,g.I]);}}beam(g.a,b,col,g.I*Iw,p.white?2.2:3);});});
      const r=r0;if(p.white)whiteBeam(r.segs[0].a,r.segs[0].b,1);else beam(r.segs[0].a,r.segs[0].b,lamRGB(p.lam),1);
      laser(r.src,r.dir);
      spots.forEach(([y,col,I])=>{ctx.fillStyle=col;ctx.globalAlpha=clamp(I*1.2,.2,1);ctx.fillRect(screenX,y-3,10,6);ctx.globalAlpha=1;});
      if(p.white&&spots.length>1){const ys=spots.map(q=>q[0]);txt(ctx,'spread on screen: '+((Math.max(...ys)-Math.min(...ys))/10).toFixed(1)+' cm',screenX-6,400,{s:12*k,a:'right',c:PAL['cv-soft']});}
      if(Number.isFinite(r.dev)&&!p.white)txt(ctx,'bent by '+r.dev.toFixed(1)+'°',16,30,{s:14*k,w:700});
      if(p.white)txt(ctx,'White light in → spectrum out',16,30,{s:14*k,w:700});
      if(!r.out||(r.bounces>0&&r.segs.length>4))pill(ctx,'Light trapped by total internal reflection',400,395,'#C11430','#fff',12*k);
      txt(ctx,'θ₁ = '+p.angle.toFixed(1)+'° at the first face',16,52,{s:12*k,c:PAL['cv-soft']});
    }
    else{
      // optical fiber: cladding band, core, zig-zag beam
      const f=fillFor('glass');
      if(p.clad==='clad'){ctx.globalAlpha=.22;ctx.fillStyle=PAL['cv-glass'];ctx.fillRect(FIB.x0,FIB.y0-34,FIB.x1-FIB.x0,34);ctx.fillRect(FIB.x0,FIB.y1,FIB.x1-FIB.x0,34);ctx.globalAlpha=1;
        txt(ctx,'cladding n = 1.46',FIB.x0+8,FIB.y0-12,{s:12*k,c:PAL['cv-soft']});}
      ctx.globalAlpha=f[1];ctx.fillStyle=f[0];ctx.fillRect(FIB.x0,FIB.y0,FIB.x1-FIB.x0,FIB.y1-FIB.y0);ctx.globalAlpha=1;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.strokeRect(FIB.x0,FIB.y0,FIB.x1-FIB.x0,FIB.y1-FIB.y0);
      txt(ctx,'glass core n = '+nOf('glass',lamNow(sim)).toFixed(3),FIB.x0+8,FIB.y1+(p.clad==='clad'?52:20),{s:12*k,c:PAL['cv-soft']});
      let r0=null;lams.forEach(l=>{const r=fiberTrace(sim,l);if(!r0)r0=r;const col=lamRGB(l),Iw=p.white?0.6:1;
        r.segs.forEach((g,i)=>{if(i===0)return;beam(g.a,g.b,col,g.I*Iw,p.white?2:3);});r.esc.forEach(e=>beam(e.a,[e.a[0]+e.d[0]*160,e.a[1]+e.d[1]*160],col,e.I*Iw,2));});
      const r=r0;if(p.white)whiteBeam(r.segs[0].a,r.segs[0].b,1);else beam(r.segs[0].a,r.segs[0].b,lamRGB(p.lam),1);laser(r.src,r.dir);
      txt(ctx,'Light reaching the far end: '+Math.round(r.kept*100)+'%   ·   '+r.bounces+' bounces',16,30,{s:14*k,w:700});
      if(hon){const nc=p.clad==='clad'?1.46:1.0003,c=Math.asin(nc/nOf('glass',lamNow(sim)))*R2D,inside=snell(1.0003,nOf('glass',lamNow(sim)),p.angle*D2R).t2*R2D;
        txt(ctx,'Wall angle inside = 90° − '+inside.toFixed(1)+'° = '+(90-inside).toFixed(1)+'°   critical angle at the wall = '+c.toFixed(1)+'°',16,52,{s:12*k,c:PAL['cv-soft']});}
      if(r.kept>0.95)pill(ctx,'Trapped by total internal reflection',400,330,'#1b7a45','#fff',12*k);else pill(ctx,'Leaking: wall angle below critical',400,330,'#C11430','#fff',12*k);
    }
  }
};
BioLab.register(REFR);
})();
