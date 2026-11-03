(function(){
'use strict';
const {clamp,lerp,rr,txt,pill,atLeast,PAL,axes,legend}=BioLab.h;

/* ======================================================================
   Light, color and perception.
   Part 1: the electromagnetic spectrum. c = fλ and E = hf for any band.
   Part 2: an RGB lamp lights a car; glasses (filters) sit in front of the eye.
     Light at the eye(λ) = lamp(λ) × car reflectance(λ) × glasses transmission(λ)  (+ fluorescence).
     Cone signals = Σ light(λ) × cone sensitivity(λ). The perceived color is the mix of the
     lamp's own three bulbs that gives the same three cone signals, so the screen can show it.
   ====================================================================== */
const C=2.998e8,H_EV=4.135667696e-15,H_J=6.62607015e-34,ION_EV=10;
/* band boundaries are conventions; bands overlap in real use */
const BANDS=[
  {id:'radio',n:'Radio',w:'radio wave',lo:1e4,hi:3e8,col:'#4f5f73'},
  {id:'micro',n:'Microwave',w:'microwave',lo:3e8,hi:3e11,col:'#3f6a7a'},
  {id:'ir',n:'Infrared',w:'infrared wave',lo:3e11,hi:4e14,col:'#8a3a2e'},
  {id:'vis',n:'Visible',w:'visible light wave',lo:4e14,hi:7.9e14,col:'#777777'},
  {id:'uv',n:'Ultraviolet',w:'ultraviolet wave',lo:7.9e14,hi:3e16,col:'#5b3f99'},
  {id:'xray',n:'X-ray',w:'X-ray',lo:3e16,hi:3e19,col:'#36527a'},
  {id:'gamma',n:'Gamma ray',w:'gamma ray',lo:3e19,hi:3e22,col:'#2a3550'}];
const BI=id=>{const i=BANDS.findIndex(b=>b.id===id);return i<0?3:i;};
const SIZES=[{n:'Building',s:30,t:'30 m'},{n:'Person',s:1.7,t:'1.7 m'},{n:'Bee',s:0.012,t:'1.2 cm'},{n:'Cell',s:1e-5,t:'10 µm'},
  {n:'Virus',s:1e-7,t:'100 nm'},{n:'Atom',s:1e-10,t:'0.1 nm'},{n:'Nucleus',s:1e-14,t:'10 fm'}];
const SUP={'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
const UNSUP={'⁻':'-','⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9'};
const sig3=x=>Number(x.toPrecision(3));
function sciParts(x){let e=Math.floor(Math.log10(Math.abs(x))),m=x/Math.pow(10,e);if(+m.toFixed(2)>=10){e++;m=x/Math.pow(10,e);}return {m:m.toFixed(2),e};}
function sci(x){if(!x)return '0';const q=sciParts(x);return q.m+' × 10'+String(q.e).split('').map(c=>SUP[c]).join('');}
function sciPlain(x){const q=sciParts(x);return q.m+'e'+q.e;}
const f3=v=>v>=100?v.toFixed(0):v>=10?v.toFixed(1):v.toFixed(2);
function lenText(m){const U=[[1e3,'km'],[1,'m'],[1e-3,'mm'],[1e-6,'µm'],[1e-9,'nm'],[1e-12,'pm'],[1e-15,'fm']];
  for(const [s,u] of U)if(m>=s*0.9995)return f3(m/s)+' '+u;return f3(m/1e-15)+' fm';}
const eText=E=>(E>=0.01&&E<1000?f3(E):sci(E))+' eV';
/* seeded noise for the virtual-lab instruments (a reload never changes data already recorded) */
function hr(seed,a,b){let h=(seed^Math.imul(a+1,0x9E3779B1)^Math.imul(b+7,0x85EBCA77))|0;h=Math.imul(h^h>>>16,0x7feb352d);h=Math.imul(h^h>>>15,0x846ca68b);h^=h>>>16;return (h>>>0)/4294967296;}
function hn(seed,a,b){const u=Math.max(1e-9,hr(seed,a,b)),w=hr(seed,a,b+100003);return Math.sqrt(-2*Math.log(u))*Math.cos(6.2831853*w);}
const labId=sim=>sim.vlab?sim.vlab.lab.id:'';
function emAt(band,pos){const b=BANDS[BI(band)],f=b.lo*Math.pow(b.hi/b.lo,clamp(pos,0,100)/100);return {b,f,lam:C/f,E:H_EV*f};}
/* what the detector shows: 3 significant figures; in the virtual lab each student's detector has its own small calibration error */
function emRead(sim,band,pos){const M=emAt(band,pos);let f=M.f,lam=M.lam;
  if(labId(sim)==='em-spectrum'){const j=BI(band),s=sim.vlab.seed;f*=1+0.0025*hn(s,11,j);lam*=1+0.003*hn(s,12,j);}
  const fD=sig3(f),lamD=sig3(lam);return Object.assign(M,{fD,lamD,ED:sig3(H_EV*fD)});}
const emNow=sim=>emRead(sim,sim.p.band,sim.p.pos);
const ionizing=E=>E>=ION_EV;
const F_ION=ION_EV/H_EV;
function sizeMatch(lam){let best=0,bd=1e9;SIZES.forEach((o,i)=>{const d=Math.abs(Math.log10(lam/o.s));if(d<bd){bd=d;best=i;}});
  const o=SIZES[best];if(bd<=0.7)return 'about the size of '+(o.n==='Atom'?'an atom':'a '+o.n.toLowerCase())+' ('+o.t+')';
  if(lam>SIZES[0].s)return 'longer than a building';if(lam<SIZES[6].s)return 'smaller than a nucleus';
  let i=0;while(i<SIZES.length-1&&!(lam<=SIZES[i].s&&lam>=SIZES[i+1].s))i++;const a=SIZES[i],b=SIZES[i+1];
  const an=x=>(x.n==='Atom'?'an atom':'a '+x.n.toLowerCase());return 'between '+an(b)+' and '+an(a);}
/* visible color of a wavelength (UV drawn as violet, IR as deep red) */
function lamRGB(l){let r=0,g=0,b=0;if(l<380)return [118,82,200];
  if(l<440){r=(440-l)/60;b=1;}else if(l<490){g=(l-440)/50;b=1;}else if(l<510){g=1;b=(510-l)/20;}else if(l<580){r=(l-510)/70;g=1;}else if(l<645){r=1;g=(645-l)/65;}else r=1;
  const f=l<420?0.45+0.55*(l-380)/40:l>700?Math.max(0.4,1-0.6*(l-700)/50):1;return [Math.round(255*r*f),Math.round(255*g*f),Math.round(255*b*f)];}
const lamCol=(l,a)=>{const c=lamRGB(l);return a===undefined?`rgb(${c[0]},${c[1]},${c[2]})`:`rgba(${c[0]},${c[1]},${c[2]},${a})`;};

/* ---------------- Part 2: spectral model on 340–750 nm ---------------- */
const WL=[];for(let l=340;l<=750;l+=5)WL.push(l);const NW=WL.length;
const sg=(x,w)=>1/(1+Math.exp(-x/w));
const gau=(l,m,s)=>Math.exp(-0.5*Math.pow((l-m)/s,2));
function norm1(a){const s=a.reduce((x,y)=>x+y,0);return a.map(v=>v/s);}
const LED={R:norm1(WL.map(l=>gau(l,630,9))),G:norm1(WL.map(l=>gau(l,525,14))),B:norm1(WL.map(l=>gau(l,460,10))),U:norm1(WL.map(l=>gau(l,365,6)))};
const LEDS=[LED.R,LED.G,LED.B];
const BAND3=[l=>sg(l-585,7),l=>sg(l-495,7)*sg(585-l,7),l=>sg(495-l,7)];   // red, green, blue parts of the spectrum
const KEYC=['red','green','blue','cyan','magenta','yellow','white','black'];
const COL3={red:[1,0,0],green:[0,1,0],blue:[0,0,1],cyan:[0,1,1],magenta:[1,0,1],yellow:[1,1,0],white:[1,1,1],black:[0,0,0]};
const CAP=s=>s.charAt(0).toUpperCase()+s.slice(1);
function paintCurve(bits,lo,hi){return WL.map(l=>lo+(hi-lo)*(bits[0]*BAND3[0](l)+bits[1]*BAND3[1](l)+bits[2]*BAND3[2](l)));}
const REFL={};KEYC.forEach(k=>{REFL[k]=paintCurve(COL3[k],0.04,0.9);});
REFL.fluor=WL.map(l=>0.05+0.75*BAND3[1](l)+0.45*BAND3[0](l));
const EXC=WL.map(l=>0.85*sg(485-l,6));                     // the fluorescent dye absorbs UV and blue …
const EMI=norm1(WL.map(l=>gau(l,525,15)));                 // … and re-emits green
const FILT=['none','red','green','blue','cyan','magenta','yellow'];
const FILTN={none:'No glasses',red:'Red',green:'Green',blue:'Blue',cyan:'Cyan',magenta:'Rose (magenta)',yellow:'Yellow'};
function filtCurve(sim,f){if(f==='none')return WL.map(()=>1);let hi=0.88;
  if(labId(sim)==='color-filters')hi*=1+0.025*hn(sim.vlab.seed,30,FILT.indexOf(f));return paintCurve(COL3[f],0.02,hi);}
/* paints for the mixing panel: real pigments absorb broadly and never perfectly */
const PAINT={cyan:WL.map(l=>0.10+0.70*sg(560-l,18)),magenta:WL.map(l=>0.10+0.75*(sg(470-l,15)+sg(l-590,15))),yellow:WL.map(l=>0.06+0.82*sg(l-500,15))};
/* cones: λmax 420, 534, 564 nm (S, M, L). Simple = Gaussian sketch. Realistic = Govardovskii et al. (2000) A1 pigment template.
   The lens absorbs UV, so very little light below about 390 nm reaches the cones. */
const LENS=WL.map(l=>sg(l-393,6));
function gov(l,lm){const x=lm/l,a=0.8795+0.0459*Math.exp(-Math.pow(lm-300,2)/11940);
  const al=1/(Math.exp(69.7*(a-x))+Math.exp(28*(0.922-x))+Math.exp(-14.9*(1.104-x))+0.674);
  const lb=189+0.315*lm,bb=-40.5+0.195*lm;return al+0.26*Math.exp(-Math.pow((l-lb)/bb,2));}
const PEAK=[564,534,420];  // L, M, S
function inv3(m){const [a,b,c]=m[0],[d,e,f]=m[1],[g,h,i]=m[2],A=e*i-f*h,B=-(d*i-f*g),Cc=d*h-e*g,det=a*A+b*B+c*Cc;
  return [[A/det,-(b*i-c*h)/det,(b*f-c*e)/det],[B/det,(a*i-c*g)/det,-(a*f-c*d)/det],[Cc/det,-(a*h-b*g)/det,(a*e-b*d)/det]];}
const mul3=(m,v)=>[0,1,2].map(r=>m[r][0]*v[0]+m[r][1]*v[1]+m[r][2]*v[2]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function coneSet(kind){const raw=PEAK.map((lm,k)=>WL.map((l,i)=>(kind==='real'?gov(l,lm):gau(l,lm,[40,38,28][k]))*LENS[i]));
  const pk=raw.map(c=>Math.max(...c)),curves=raw.map((c,k)=>c.map(v=>v/pk[k]));
  const dot=(c,s)=>c.reduce((t,v,i)=>t+v*s[i],0);
  const W=curves.map(c=>LEDS.reduce((t,L)=>t+dot(c,L),0));          // equal power from the three bulbs = white
  const lms=s=>curves.map((c,k)=>dot(c,s)/W[k]);
  const M=[0,1,2].map(r=>LEDS.map(L=>lms(L)[r]));const Mi=inv3(M);
  const Yd=lms(LEDS[0].map((v,i)=>v+LEDS[1][i])),Bd=lms(LEDS[2]),Wn=[1,1,1];
  return {kind,curves,lms,Mi,nB:cross(Wn,Bd),nY:cross(Wn,Yd)};}
const CONES={simple:coneSet('simple'),real:coneSet('real')};
/* dichromat views (after Brettel, Viénot & Mollon 1997 and Viénot, Brettel & Mollon 1999; our implementation): keep the two
   working cone signals and replace the missing one so the color lands on the half-plane through white and the lamp's
   own yellow (red + green) or blue, colors that protan and deutan viewers see much as everyone does */
function dichro(cs,q,type){const [L,M,S]=q;
  if(type==='protan'){const n=(S/Math.max(M,1e-9))<1?cs.nY:cs.nB;return [-(n[1]*M+n[2]*S)/n[0],M,S];}
  const n=(S/Math.max(L,1e-9))<1?cs.nY:cs.nB;return [L,-(n[0]*L+n[2]*S)/n[1],S];}
const toRGB=(cs,q)=>mul3(cs.Mi,q);
const enc=v=>{v=clamp(v,0,1);return Math.round(255*(v<=0.0031308?12.92*v:1.055*Math.pow(v,1/2.4)-0.055));};
const css=(c,a)=>{const v=c.map(enc);return a===undefined?`rgb(${v[0]},${v[1]},${v[2]})`:`rgba(${v[0]},${v[1]},${v[2]},${a})`;};
/* color names: the eight a student chooses from; ext adds orange, yellow-green and "dark" for the Full lab readout */
function cname(c,ext){const [r,g,b]=c.map(v=>Math.max(0,v)),mx=Math.max(r,g,b);if(mx<0.08)return 'black';
  const n=[r/mx,g/mx,b/mx],on=n.map(v=>v>0.45),k=on.filter(Boolean).length;let nm;
  if(k===3)nm=mx>0.3?'white':'gray';else if(k===2)nm=on[0]&&on[1]?'yellow':on[1]&&on[2]?'cyan':'magenta';else nm=on[0]?'red':on[1]?'green':'blue';
  if(ext){if(k===1&&on[0]&&n[1]>0.22)nm='orange';else if(k===1&&on[1]&&n[0]>0.22)nm='yellow-green';if(mx<0.2&&nm!=='gray')nm='dark '+(nm==='white'?'gray':nm);}
  return nm;}
const coneKind=sim=>sim.p.cones==='real'&&atLeast('ap')?'real':'simple';
const dot=(a,b)=>a.reduce((t,v,i)=>t+v*b[i],0);
function scene(sim){const p=sim.p,uv=atLeast('ap')?(p.uv||0):0,obj=(p.obj==='fluor'&&!atLeast('ap'))?'white':p.obj,ck=coneKind(sim);
  const key=[p.R,p.G,p.B,uv,obj,p.filt,ck,labId(sim),sim.vlab?sim.vlab.seed:0,BioLab.level].join('|');if(sim._sc&&sim._sc.key===key)return sim._sc;
  const cs=CONES[ck],lv=[p.R/100,p.G/100,p.B/100,uv/100];
  const lamp=WL.map((l,i)=>lv[0]*LED.R[i]+lv[1]*LED.G[i]+lv[2]*LED.B[i]+lv[3]*LED.U[i]);
  const rho=REFL[obj]||REFL.white;let fl=WL.map(()=>0),flP=0;
  if(obj==='fluor'){flP=WL.reduce((t,l,i)=>t+lamp[i]*(1-rho[i])*EXC[i]*(l/525),0);fl=EMI.map(v=>v*flP);}
  const room=WL.map((l,i)=>lamp[i]*rho[i]+fl[i]),T=filtCurve(sim,p.filt),eye=room.map((v,i)=>v*T[i]);
  const qRoom=cs.lms(room),qEye=cs.lms(eye),rgbRoom=toRGB(cs,qRoom),rgbEye=toRGB(cs,qEye),rgbLamp=toRGB(cs,cs.lms(lamp));
  const vis=WL.map(l=>l>=380?1:0),meter=100*dot(eye,vis)/3;
  const carB=LEDS.map(L=>dot(L,rho)),filtB=LEDS.map(L=>dot(L,T)),lampB=lv.slice(0,3),eyeB=[0,1,2].map(i=>lampB[i]*carB[i]*filtB[i]);
  const prot=toRGB(cs,dichro(cs,qEye,'protan')),deut=toRGB(cs,dichro(cs,qEye,'deutan'));
  sim._sc={key,cs,lamp,rho,fl,flP,room,T,eye,qRoom,qEye,rgbRoom,rgbEye,rgbLamp,meter,carB,filtB,lampB,eyeB,prot,deut,obj,uv,
    see:cname(rgbEye),seeX:cname(rgbEye,true),roomX:cname(rgbRoom,true),bright:Math.max(...rgbEye)>1.02};
  return sim._sc;}
/* the light meter at the eye, as its display shows it */
function meterShown(sim){const S=scene(sim);let v=S.meter;if(sim.vlab)v+=0.12*hn(sim.vlab.seed,40,Math.floor((sim.vt||0)*2));return Math.max(0,Math.round(v*10)/10);}

/* ---------------- shared helpers ---------------- */
const EM_CTL=['band','pos'],COL_CTL=['R','G','B','obj','filt','uv','cones','deep'],COL_ACT=['pw','pr','pg','pb','poff'];
const EM_M=['fq','wl','pe','ej','ion','logf','logE'],COL_M=['see','room','meter','Ls','Ms','Ss','rg','by'];
function syncCtl(sim){const u=sim.ui;if(!u||!u.ctlW)return;if(sim.mode==='vlab'&&sim.vlab)return;const em=sim.p.part!=='color',d=SIM;
  d.controls.forEach(c=>{const w=u.ctlW[c.id];if(!w)return;if(EM_CTL.includes(c.id))w.hidden=!em||!atLeast(c.lvl)||!!c.vlab;else if(COL_CTL.includes(c.id))w.hidden=em||!atLeast(c.lvl);});
  d.actions.forEach(a=>{const b=u.actB&&u.actB[a.id];if(!b)return;if(COL_ACT.includes(a.id))b.hidden=em||!atLeast(a.lvl)||(!!a.vlab&&sim.mode!=='vlab');});
  d.metrics.forEach(m=>{const t=u.tiles&&u.tiles[m.id];if(!t)return;const el=t.num.closest('.tile');if(!el)return;el.hidden=!atLeast(m.lvl)||(em?COL_M.includes(m.id):EM_M.includes(m.id));});
  if(u.gm){const want=em?'em':'eye';if([...u.gm.options].some(o=>o.value===want)&&sim.gMetric!==want&&(sim.gMetric==='em'||sim.gMetric==='eye'||!sim.gMetric)){sim.gMetric=want;u.gm.value=want;}}}
const bulbsText=lv=>{const on=['red','green','blue'].filter((c,i)=>lv[i]>0.05);return on.length===3?'red, green and blue (white)':on.length?on.join(' and '):'no';};
function chain(S){const nm=['red','green','blue'],lit=S.lampB.map(v=>v>0.05),ref=S.carB.map(v=>v>0.3),pas=S.filtB.map(v=>v>0.3);
  return {lit,ref,pas,out:nm.filter((c,i)=>lit[i]&&ref[i]),thru:nm.filter((c,i)=>lit[i]&&ref[i]&&pas[i])};}
const list=a=>a.length<=1?(a[0]||''):a.length===2?a.join(' and '):a.slice(0,-1).join(', ')+' and '+a[a.length-1];
const objName=o=>o==='fluor'?'fluorescent yellow-green':o;

/* ---------------- drawing: Part 1 ---------------- */
function lcd(ctx,x,y,w,h,k,head,rows){ctx.fillStyle='#262a31';rr(ctx,x,y,w,h,12);ctx.fill();
  const hy=y+10+12*k;txt(ctx,head,x+14,hy,{s:12*k,w:700,c:'#c9d1d9'});let yy=hy+10+12*k;
  rows.forEach(([l,v])=>{txt(ctx,l,x+14,yy,{s:12*k,c:'#9fb0bf'});yy+=4+14*k;txt(ctx,v,x+14,yy,{s:14*k,w:700,c:'#d7f5cf'});yy+=10+12*k;});}
function icon(ctx,i,x,y,col){ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=2;
  if(i===0){ctx.strokeRect(x-11,y-20,22,40);for(let r=0;r<4;r++)for(let c=0;c<2;c++)ctx.fillRect(x-7+c*9,y-15+r*9,5,5);}
  else if(i===1){ctx.beginPath();ctx.arc(x,y-14,5,0,6.29);ctx.fill();ctx.beginPath();ctx.moveTo(x,y-8);ctx.lineTo(x,y+8);ctx.moveTo(x-9,y-3);ctx.lineTo(x+9,y-3);ctx.moveTo(x,y+8);ctx.lineTo(x-7,y+20);ctx.moveTo(x,y+8);ctx.lineTo(x+7,y+20);ctx.stroke();}
  else if(i===2){ctx.beginPath();ctx.ellipse(x,y+2,13,8,0,0,6.29);ctx.stroke();for(let s=-1;s<=1;s++){ctx.beginPath();ctx.moveTo(x+s*5,y-5);ctx.lineTo(x+s*5,y+9);ctx.stroke();}
    ctx.beginPath();ctx.ellipse(x-4,y-11,6,4,-0.5,0,6.29);ctx.ellipse(x+5,y-11,6,4,0.5,0,6.29);ctx.stroke();}
  else if(i===3){ctx.beginPath();ctx.arc(x,y,17,0,6.29);ctx.stroke();ctx.beginPath();ctx.arc(x+3,y-2,6,0,6.29);ctx.fill();}
  else if(i===4){ctx.beginPath();ctx.arc(x,y,11,0,6.29);ctx.stroke();for(let a=0;a<8;a++){const t=a*Math.PI/4;ctx.beginPath();ctx.moveTo(x+11*Math.cos(t),y+11*Math.sin(t));ctx.lineTo(x+18*Math.cos(t),y+18*Math.sin(t));ctx.stroke();ctx.beginPath();ctx.arc(x+19*Math.cos(t),y+19*Math.sin(t),2.2,0,6.29);ctx.fill();}}
  else if(i===5){ctx.beginPath();ctx.arc(x,y,3.5,0,6.29);ctx.fill();ctx.lineWidth=1.5;[0,1.05,2.1].forEach(t=>{ctx.beginPath();ctx.ellipse(x,y,19,7,t,0,6.29);ctx.stroke();});}
  else{[[0,0],[-6,-3],[6,-3],[-3,5],[4,5],[0,-8],[-7,4],[7,3]].forEach(([dx,dy],j)=>{ctx.beginPath();ctx.arc(x+dx,y+dy,4.2,0,6.29);ctx.fillStyle=j%2?col:PAL['cv-bg'];ctx.fill();ctx.stroke();});}}
const EMW={x0:66,x1:536,y:120},SPLIT={Microwave:['Micro','wave'],Ultraviolet:['Ultra','violet'],Infrared:['Infra','red']};
function drawEM(sim,ctx,vdt,k){const v=sim.vis,M=emNow(sim),ink=PAL['cv-ink'],soft=PAL['cv-soft'],lf=Math.log10(M.f),u=clamp((lf-4)/(22.48-4),0,1);
  const wpx=Math.exp(lerp(Math.log(300),Math.log(18),u));v.ph=((v.ph||0)+vdt*140/wpx*6.2832)%6.2832;
  const visW=M.b.id==='vis',wc=visW?lamCol(M.lam*1e9):PAL['s1'];
  /* source charge and the traveling wave */
  ctx.fillStyle=PAL['cv-bg2'];rr(ctx,8,6,540,232,12);ctx.fill();
  const A=48,cy=EMW.y,ex=EMW.x0;
  ctx.strokeStyle=soft;ctx.lineWidth=1;ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(ex,cy);ctx.lineTo(EMW.x1,cy);ctx.stroke();ctx.setLineDash([]);
  if(atLeast('honors')){const ob=Math.min(6,wpx*0.06);ctx.strokeStyle=PAL['s2'];ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.beginPath();
    for(let x=ex;x<=EMW.x1;x+=1.5){const s=Math.sin(v.ph-6.2832*(x-ex)/wpx),X=x+s*ob,Y=cy+s*18;x===ex?ctx.moveTo(X,Y):ctx.lineTo(X,Y);}ctx.stroke();ctx.setLineDash([]);}
  ctx.strokeStyle=wc;ctx.lineWidth=3;ctx.beginPath();for(let x=ex;x<=EMW.x1;x+=1.5){const y=cy-A*Math.sin(v.ph-6.2832*(x-ex)/wpx);x===ex?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();
  const qy=cy-A*0.55*Math.sin(v.ph);ctx.strokeStyle=soft;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(52,cy-A*0.6);ctx.lineTo(52,cy+A*0.6);ctx.stroke();
  ctx.fillStyle=PAL['cv-e'];ctx.strokeStyle=PAL['cv-estroke'];ctx.beginPath();ctx.arc(52,qy,10,0,6.29);ctx.fill();ctx.stroke();txt(ctx,'−',52,qy+1,{s:16,w:700,c:'#1c1c1f',a:'center',b:'middle'});
  txt(ctx,'Shaking charge',20,14+12*k,{s:12*k,c:soft});
  txt(ctx,atLeast('honors')?'E field (solid)':'Electric field',EMW.x1,14+12*k,{s:12*k,w:600,c:ink,a:'right'});
  if(atLeast('honors'))txt(ctx,'B field (dashed)',EMW.x1,cy+A+8+12*k,{s:12*k,c:PAL['s2'],a:'right'});
  txt(ctx,atLeast('honors')?'Every band travels at c = 3.00 × 10⁸ m/s':'Drawn wavelength not to scale',EMW.x1,228,{s:12*k,c:soft,a:'right'});
  /* the detector */
  const rows=[['Frequency',sci(M.fD)+' Hz'],['Wavelength',sci(M.lamD)+' m'],['Photon energy',eText(M.ED)]];
  lcd(ctx,556,6,236,232,k,k<1.3?'DETECTOR · '+M.b.n.toUpperCase():M.b.n.toUpperCase(),rows);
  /* the spectrum strip (equal-width bands) */
  const SY=270,SH=46,X0=20,CW=760/7,sx=clamp((BI(sim.p.band)+sim.p.pos/100)*CW+X0,X0+8,772);
  BANDS.forEach((b,i)=>{const x=X0+i*CW;if(b.id==='vis'){for(let j=0;j<CW;j+=2){ctx.fillStyle=lamCol(750-370*j/CW);ctx.fillRect(x+j,SY,2.3,SH);}}else{ctx.fillStyle=b.col;ctx.fillRect(x,SY,CW+0.5,SH);}
    ctx.font='700 '+(12*k)+'px '+BioLab.h.FONT;const nm=b.id==='gamma'?'Gamma':b.n,fit=ctx.measureText(nm).width<CW-8,sp=SPLIT[nm];
    const tc=b.id==='vis'?'#1c1c1f':'#ffffff';if(fit||!sp)txt(ctx,nm,x+CW/2,SY+SH/2+1,{s:12*k,w:700,c:tc,a:'center',b:'middle'});
    else{txt(ctx,sp[0]+'-',x+CW/2,SY+SH/2-6.5*k,{s:12*k,w:700,c:tc,a:'center',b:'middle'});txt(ctx,sp[1],x+CW/2,SY+SH/2+6.5*k,{s:12*k,w:700,c:tc,a:'center',b:'middle'});}});
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.strokeRect(X0+.5,SY+.5,759,SH);
  const ui=BI('uv'),xi=X0+(ui+Math.log(F_ION/BANDS[ui].lo)/Math.log(BANDS[ui].hi/BANDS[ui].lo))*CW;
  ctx.strokeStyle=PAL['s1'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(xi,SY-6);ctx.lineTo(780,SY-6);ctx.stroke();ctx.beginPath();ctx.moveTo(xi,SY-12);ctx.lineTo(xi,SY);ctx.stroke();
  txt(ctx,'Ionizing: 10 eV or more',780,SY-12,{s:12*k,w:700,c:PAL['s1'],a:'right'});
  ctx.strokeStyle=PAL['s3'];ctx.beginPath();ctx.moveTo(X0,SY-6);ctx.lineTo(xi-6,SY-6);ctx.stroke();txt(ctx,'Non-ionizing',X0,SY-12,{s:12*k,w:700,c:PAL['s3']});
  ctx.fillStyle=ink;ctx.beginPath();ctx.moveTo(sx,SY+SH+2);ctx.lineTo(sx-8,SY+SH+13);ctx.lineTo(sx+8,SY+SH+13);ctx.closePath();ctx.fill();ctx.fillRect(sx-1.5,SY,3,SH);
  const AY=SY+SH+8+12*k,TY=AY+8+12*k,IY=TY+18,IX=i=>X0+CW*(i+0.5);
  txt(ctx,'← Longer wavelength',X0,AY,{s:12*k,c:soft});txt(ctx,'Higher frequency and energy →',780,AY,{s:12*k,c:soft,a:'right'});
  let mi=-1,mx=null;const L=M.lam;
  if(L>=SIZES[0].s)mx=IX(0)-Math.min(40,10*Math.log10(L/SIZES[0].s));else if(L<=SIZES[6].s)mx=IX(6);
  else{for(let i=0;i<6;i++)if(L<=SIZES[i].s&&L>=SIZES[i+1].s){const t=Math.log(SIZES[i].s/L)/Math.log(SIZES[i].s/SIZES[i+1].s);mx=lerp(IX(i),IX(i+1),t);}}
  let bd=1e9;SIZES.forEach((o,i)=>{const d=Math.abs(Math.log10(L/o.s));if(d<bd){bd=d;mi=i;}});if(bd>0.7)mi=-1;
  SIZES.forEach((o,i)=>{const on=i===mi;icon(ctx,i,IX(i),IY+20,on?PAL['rj']:soft);
    txt(ctx,o.n,IX(i),IY+44+12*k,{s:12*k,w:on?700:600,c:on?PAL['rj']:ink,a:'center'});txt(ctx,o.t,IX(i),IY+44+26*k,{s:12*k,c:soft,a:'center'});});
  if(mx!==null){ctx.fillStyle=PAL['rj'];ctx.beginPath();ctx.moveTo(mx,IY-4);ctx.lineTo(mx-7,IY-14);ctx.lineTo(mx+7,IY-14);ctx.closePath();ctx.fill();}
  txt(ctx,'Wavelength '+lenText(M.lamD)+': '+sizeMatch(M.lamD),400,TY,{s:12*k,w:700,c:ink,a:'center'});}

/* ---------------- drawing: Part 2 ---------------- */
function drawCar(ctx,cx,cy,w,col){const h=w*0.36;ctx.fillStyle=col;ctx.beginPath();
  ctx.moveTo(cx-w/2,cy+h*0.15);ctx.lineTo(cx-w/2+w*0.04,cy-h*0.12);ctx.lineTo(cx-w*0.24,cy-h*0.2);ctx.lineTo(cx-w*0.14,cy-h*0.62);ctx.lineTo(cx+w*0.16,cy-h*0.62);
  ctx.lineTo(cx+w*0.3,cy-h*0.2);ctx.lineTo(cx+w/2-w*0.02,cy-h*0.1);ctx.lineTo(cx+w/2,cy+h*0.15);ctx.closePath();ctx.fill();
  ctx.fillStyle='rgba(10,12,16,.55)';ctx.beginPath();ctx.moveTo(cx-w*0.19,cy-h*0.22);ctx.lineTo(cx-w*0.115,cy-h*0.54);ctx.lineTo(cx-w*0.01,cy-h*0.54);ctx.lineTo(cx-w*0.01,cy-h*0.22);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(cx+w*0.02,cy-h*0.22);ctx.lineTo(cx+w*0.02,cy-h*0.54);ctx.lineTo(cx+w*0.145,cy-h*0.54);ctx.lineTo(cx+w*0.24,cy-h*0.22);ctx.closePath();ctx.fill();
  [-0.28,0.3].forEach(t=>{ctx.fillStyle='#0b0c0f';ctx.beginPath();ctx.arc(cx+w*t,cy+h*0.15,h*0.3,0,6.29);ctx.fill();ctx.fillStyle='#4a4f57';ctx.beginPath();ctx.arc(cx+w*t,cy+h*0.15,h*0.13,0,6.29);ctx.fill();});}
const ROOM='#14161b',BULB=[[226,54,62],[47,168,79],[59,111,216],[150,90,230]];
function specPanel(ctx,x,y,w,h,k,title,arr,o){o=o||{};ctx.fillStyle=PAL['card'];rr(ctx,x,y,w,h,8);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,title,x+8,y+6+11*k,{s:12*k,w:700,c:PAL['cv-ink']});const pL=x+6,pR=x+w-6,pT=y+14+14*k,pB=y+h-8-13*k,l0=o.l0||380,l1=750;
  const X=l=>pL+(l-l0)/(l1-l0)*(pR-pL),mx=o.max||1;
  if(l0<380){ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(X(l0),pT,X(380)-X(l0),pB-pT);}
  for(let i=0;i<NW;i++){const l=WL[i];if(l<l0)continue;const v=clamp(arr[i]/mx,0,1.05),x0=X(l-2.5),x1=X(Math.min(l1,l+2.5));ctx.fillStyle=lamCol(l,0.9);ctx.fillRect(x0,pB-v*(pB-pT),x1-x0+0.4,v*(pB-pT));}
  ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;ctx.beginPath();let st=false;for(let i=0;i<NW;i++){const l=WL[i];if(l<l0)continue;const Y=pB-clamp(arr[i]/mx,0,1.05)*(pB-pT);st?ctx.lineTo(X(l),Y):ctx.moveTo(X(l),Y);st=true;}ctx.stroke();
  if(o.cones){const cc=['#d9363e','#2fa84f','#5b5bd6'];o.cones.forEach((c,k2)=>{ctx.strokeStyle=cc[k2];ctx.lineWidth=2;ctx.setLineDash([5,3]);ctx.beginPath();let s2=false;for(let i=0;i<NW;i++){const l=WL[i];if(l<l0)continue;const Y=pB-c[i]*(pB-pT);s2?ctx.lineTo(X(l),Y):ctx.moveTo(X(l),Y);s2=true;}ctx.stroke();ctx.setLineDash([]);});}
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(pL,pB+.5);ctx.lineTo(pR,pB+.5);ctx.stroke();
  txt(ctx,'400',X(400),pB+3+11*k,{s:12*k,c:PAL['cv-soft'],a:l0<380?'center':'left'});txt(ctx,'700 nm',pR,pB+3+11*k,{s:12*k,c:PAL['cv-soft'],a:'right'});
  if(l0<380&&k<1.3)txt(ctx,'UV',X((l0+380)/2),pT+12,{s:12,c:PAL['cv-soft'],a:'center'});}
function barPanel(ctx,x,y,w,h,k,title,vals,cols,labs){ctx.fillStyle=PAL['card'];rr(ctx,x,y,w,h,8);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,title,x+8,y+6+11*k,{s:12*k,w:700,c:PAL['cv-ink']});const pT=y+16+14*k,pB=y+h-8-13*k,n=vals.length,bw=(w-24)/n;
  vals.forEach((v,i)=>{const bx=x+12+i*bw+bw*0.18,ww=bw*0.64,hh=clamp(v,0,1.1)*(pB-pT);ctx.fillStyle=cols[i];ctx.fillRect(bx,pB-hh,ww,hh);ctx.strokeStyle=PAL['line'];ctx.strokeRect(bx+.5,pT+.5,ww-1,pB-pT);
    txt(ctx,labs[i],bx+ww/2,pB+3+11*k,{s:12*k,w:700,c:PAL['cv-soft'],a:'center'});});}
const RGBC=['#d9363e','#2fa84f','#3b6fd8'];
function drawColor(sim,ctx,vdt,k){const S=scene(sim),p=sim.p,V=sim.vlab,inLab=labId(sim)==='color-filters',hon=atLeast('honors'),ap=atLeast('ap');
  /* the room */
  ctx.fillStyle=ROOM;rr(ctx,8,6,388,296,12);ctx.fill();txt(ctx,'In the room',22,14+12*k,{s:12*k,w:700,c:'#e6e8ec'});
  const lv=[p.R,p.G,p.B,ap?(p.uv||0):0].map(v=>v/100),bx=[44,80,116,152];
  ctx.fillStyle='#3a3e45';rr(ctx,26,46+8*k,ap?156:120,40,8);ctx.fill();
  const lampCol=css(S.rgbLamp.map(v=>v/Math.max(0.35,...S.rgbLamp)),0.2);ctx.fillStyle=lampCol;ctx.beginPath();ctx.moveTo(40,80+8*k);ctx.lineTo(ap?170:136,80+8*k);ctx.lineTo(372,286);ctx.lineTo(60,286);ctx.closePath();ctx.fill();
  (ap?[0,1,2,3]:[0,1,2]).forEach(i=>{const c=BULB[i],a=0.18+0.82*lv[i];ctx.fillStyle=`rgba(${c[0]},${c[1]},${c[2]},${a})`;ctx.beginPath();ctx.arc(bx[i],66+8*k,11,0,6.29);ctx.fill();
    if(lv[i]>0.02){ctx.fillStyle=`rgba(${c[0]},${c[1]},${c[2]},${0.25*lv[i]})`;ctx.beginPath();ctx.arc(bx[i],66+8*k,19,0,6.29);ctx.fill();}
  });
  txt(ctx,ap?'Lamp: R, G, B, UV':'Lamp: R, G, B',ap?192:156,66+8*k+4*k,{s:12*k,c:'#c9cdd3'});
  drawCar(ctx,214,220,270,css(S.rgbRoom));
  txt(ctx,(S.obj==='fluor'?'Fluorescent':CAP(S.obj))+' car',214,292,{s:12*k,c:'#c9cdd3',a:'center'});
  /* through the glasses */
  ctx.fillStyle=ROOM;rr(ctx,404,6,388,296,12);ctx.fill();
  txt(ctx,p.filt==='none'?'No glasses: what you see':'Through '+FILTN[p.filt].toLowerCase()+' glasses',418,14+12*k,{s:12*k,w:700,c:'#e6e8ec'});
  const LT=26+16*k,LB=inLab||hon?250:290;
  if(p.filt!=='none'){const fc=css(COL3[p.filt].map(v=>v?0.85:0.05));ctx.strokeStyle=fc;ctx.lineWidth=5;rr(ctx,420,LT,356,LB-LT,40);ctx.stroke();}
  ctx.save();rr(ctx,422,LT+2,352,LB-LT-4,38);ctx.clip();drawCar(ctx,598,(LT+LB)/2+16,240,css(S.rgbEye));ctx.restore();
  if(!inLab)pill(ctx,'You see: '+S.seeX+(S.bright&&k<1.3?' (brighter than white)':''),598,LT+10+9*k,'#f3f3f1','#1c1c1f',12*k);
  if(inLab||hon){ctx.fillStyle='#262a31';rr(ctx,420,256,356,40,8);ctx.fill();txt(ctx,'LIGHT METER',432,276,{s:12*k,w:700,c:'#9fb0bf',b:'middle'});
    txt(ctx,meterShown(sim).toFixed(1)+' %',764,276,{s:15*k,w:700,c:'#d7f5cf',a:'right',b:'middle'});}
  /* bottom: the chain light × car × glasses = eye */
  const Y0=312,HH=184;
  if(ap&&p.deep==='mix'){drawMix(sim,ctx,k,Y0,HH);}
  else if(ap&&p.deep==='cb'){drawCB(sim,ctx,k,Y0,HH);}
  else if(!hon){const W=190,G=8;
    barPanel(ctx,8,Y0,W,HH,k,'Lamp sends',S.lampB,RGBC,['R','G','B']);
    barPanel(ctx,8+(W+G),Y0,W,HH,k,'× Car reflects',S.carB,RGBC,['R','G','B']);
    barPanel(ctx,8+2*(W+G),Y0,W,HH,k,'× Glasses pass',S.filtB,RGBC,['R','G','B']);
    barPanel(ctx,8+3*(W+G),Y0,W,HH,k,'= Reaches eye',S.eyeB,RGBC,['R','G','B']);}
  else{const W=148,G=10,l0=ap?340:380,lmax=Math.max(...LED.R)*1.02;
    specPanel(ctx,8,Y0,W,HH,k,'Lamp',S.lamp,{max:lmax,l0});
    specPanel(ctx,8+(W+G),Y0,W,HH,k,'× Car',S.rho,{max:1,l0});
    specPanel(ctx,8+2*(W+G),Y0,W,HH,k,'× Glasses',S.T,{max:1,l0});
    specPanel(ctx,8+3*(W+G),Y0,W,HH,k,'= Eye',S.eye,{max:lmax,l0,cones:S.cs.curves});
    const q=S.qEye;barPanel(ctx,8+4*(W+G),Y0,W,HH,k,'Cones',[q[2],q[1],q[0]].map(v=>v/1.0),['#5b5bd6','#2fa84f','#d9363e'],['S','M','L']);}
  if(V&&inLab&&V.bench.cover){ctx.fillStyle=PAL['card'];ctx.globalAlpha=0.97;ctx.fillRect(0,0,800,500);ctx.globalAlpha=1;ctx.strokeStyle=PAL['rj'];ctx.lineWidth=3;rr(ctx,40,150,720,200,16);ctx.stroke();
    txt(ctx,'Predict first',400,200+6*k,{s:20*k,w:700,c:PAL['cv-ink'],a:'center'});
    txt(ctx,'Fill in the Prediction column of Table '+V.bench.cover+',',400,250+8*k,{s:13*k,c:PAL['cv-ink'],a:'center'});
    txt(ctx,'then press Next to test your predictions.',400,250+26*k,{s:13*k,c:PAL['cv-ink'],a:'center'});}}
function circ(ctx,x,y,r){ctx.beginPath();ctx.arc(x,y,r,0,6.29);}
function drawMix(sim,ctx,k,Y0,HH){const cs=scene(sim).cs;ctx.fillStyle=PAL['card'];rr(ctx,8,Y0,784,HH,8);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,'Light adds (screens)',24,Y0+8+11*k,{s:12*k,w:700,c:PAL['cv-ink']});txt(ctx,'Paint subtracts (print)',400,Y0+8+11*k,{s:12*k,w:700,c:PAL['cv-ink']});
  const r=40,cyc=Y0+HH/2+14,P=(cx)=>[[cx-23,cyc-12],[cx+23,cyc-12],[cx,cyc+22]];
  /* light circles on black */
  ctx.fillStyle='#0c0d10';rr(ctx,24,Y0+20+14*k,220,HH-30-14*k,8);ctx.fill();const pl=P(134),bits=[[1,0,0],[0,1,0],[0,0,1]];
  const regions=[[0],[1],[2],[0,1],[0,2],[1,2],[0,1,2]];
  regions.forEach(rg=>{ctx.save();rg.forEach(i=>{circ(ctx,pl[i][0],pl[i][1],r);ctx.clip();});
    const c=[0,0,0];rg.forEach(i=>bits[i].forEach((b,j)=>c[j]+=0.9*b));
    ctx.fillStyle=css(c);ctx.fillRect(0,Y0,800,HH);ctx.restore();});
  /* paint circles on white paper */
  const pp=P(510),pc=['cyan','magenta','yellow'];ctx.fillStyle='#f6f4ee';rr(ctx,400,Y0+20+14*k,220,HH-30-14*k,8);ctx.fill();
  const paintRGB=rg=>{const prod=WL.map((l,i)=>rg.reduce((t,j)=>t*PAINT[pc[j]][i],1)*(LED.R[i]+LED.G[i]+LED.B[i]));return toRGB(cs,cs.lms(prod));};
  regions.forEach(rg=>{ctx.save();rg.forEach(i=>{circ(ctx,pp[i][0],pp[i][1],r);ctx.clip();});ctx.fillStyle=css(paintRGB(rg));ctx.fillRect(0,Y0,800,HH);ctx.restore();});
  const mid=paintRGB([0,1,2]),mm=Math.max(...mid);const mname=mm<0.2?(mid[0]>mid[2]*1.25?'dark brown':'dark gray'):cname(mid,true);
  txt(ctx,'R + G + B',256,cyc-6,{s:12*k,w:700,c:PAL['cv-ink']});txt(ctx,'= white',256,cyc+8+8*k,{s:12*k,c:PAL['cv-ink']});
  txt(ctx,'C × M × Y',632,cyc-6,{s:12*k,w:700,c:PAL['cv-ink']});txt(ctx,'= '+mname,632,cyc+8+8*k,{s:12*k,c:PAL['cv-ink']});
  sim.vis.mixName=mname;}
function drawCB(sim,ctx,k,Y0,HH){const S=scene(sim);ctx.fillStyle=PAL['card'];rr(ctx,8,Y0,784,HH,8);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  const views=[['Typical',S.rgbEye],[k<1.3?'Protan (no L cones)':'Protan: no L',S.prot],[k<1.3?'Deutan (no M cones)':'Deutan: no M',S.deut]];
  views.forEach(([t,c],i)=>{const x=20+i*178;txt(ctx,t,x,Y0+8+11*k,{s:12*k,w:700,c:PAL['cv-ink']});ctx.fillStyle=ROOM;rr(ctx,x,Y0+18+14*k,166,HH-28-14*k,8);ctx.fill();
    drawCar(ctx,x+83,Y0+HH/2+24,140,css(c));});
  /* opponent channels for a typical viewer */
  const q=S.qEye,lum=(q[0]+q[1])/2,rg=q[0]-q[1],by=q[2]-(q[0]+q[1])/2,bx=560,bw=220;
  txt(ctx,'Opponent signals',bx,Y0+8+11*k,{s:12*k,w:700,c:PAL['cv-ink']});
  [['Dark → light',lum,0,1],['Green ↔ red',rg,-1,1],['Yellow ↔ blue',by,-1,1]].forEach(([t,v,lo,hi],i)=>{const y=Y0+30+14*k+i*(16+24*k*0.9);
    txt(ctx,t,bx,y+8*k,{s:12*k,c:PAL['cv-soft']});const yy=y+12+8*k,X=val=>bx+(clamp(val,lo,hi)-lo)/(hi-lo)*bw;
    ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(bx,yy,bw,12);ctx.fillStyle=i===0?PAL['cv-ink']:i===1?(v>0?'#d9363e':'#2fa84f'):(v>0?'#3b6fd8':'#c9a400');
    const z=X(lo<0?0:lo);ctx.fillRect(Math.min(z,X(v)),yy,Math.abs(X(v)-z),12);if(lo<0){ctx.fillStyle=PAL['cv-ink'];ctx.fillRect(z-1,yy-3,2,18);}});}

/* ---------------- the virtual labs ---------------- */
const EMROWS=['hiE','loF','shortL'],EMROWL=['Highest photon energy','Lowest frequency','Shortest wavelength'];
const VROWS=[0,20,40,60,80,100],VROWL=['0% (left end)','20%','40%','60%','80%','100% (right end)'];
/* read a number the way students type powers of ten: 3.00e22, 3.00 x 10^22, 3.00 × 10²², with an optional unit */
const LUNIT={km:1e3,m:1,mm:1e-3,'µm':1e-6,um:1e-6,nm:1e-9,pm:1e-12,fm:1e-15};
function parseSci(s,kind){if(s===undefined||s===null)return NaN;s=String(s).trim().replace(/−/g,'-').replace(/,/g,'');
  s=s.replace(/10\s*([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g,(m,e)=>'10^'+e.split('').map(c=>UNSUP[c]).join(''));let scale=1;
  const um=s.match(/\s*(hz|ev|km|mm|µm|um|nm|pm|fm|m)$/i);if(um){const u=um[1].toLowerCase();if(kind==='lam'&&LUNIT[u]!==undefined)scale=LUNIT[u];else if(kind==='lam'&&u!=='m')return NaN;
    else if(kind==='f'&&u!=='hz')return NaN;else if(kind==='E'&&u!=='ev')return NaN;s=s.slice(0,s.length-um[0].length).trim();}
  const m=s.match(/^([-+]?(?:\d+\.?\d*|\.\d+))\s*(?:(?:[x×*·]|\*)\s*10\s*(?:\^|\*\*)?\s*\(?([-+]?\d+)\)?|[eE]\s*([-+]?\d+))?$/);if(!m)return NaN;
  const e=m[2]!==undefined?+m[2]:m[3]!==undefined?+m[3]:0;return parseFloat(m[1])*Math.pow(10,e)*scale;}
const near=(a,b,tol)=>Number.isFinite(a)&&Math.abs(a-b)<=tol*Math.abs(b);
const FMT='Type the number as the detector shows it, for example 3.00 x 10^22 or 3.00e22.';
function emRowState(sim,r){const V=sim.vlab,band=V.raw('c:t1:band:'+r),pos=V.val('t1','pos',r);if(!band||!Number.isFinite(pos)||pos<0||pos>100)return null;return emRead(sim,band,pos);}
function emCheck(kind){return (sim,rv,v)=>{const r=EMROWS.indexOf(String(rv));if(r<0)return null;const x=parseSci(v,kind);if(!Number.isFinite(x)||x<=0)return FMT;
  const R=emRowState(sim,r);if(!R)return 'Choose the band and type the slider setting for this row first, so the reading has a setting to go with it.';
  const want=kind==='f'?R.fD:kind==='lam'?R.lamD:R.ED;if(near(x,want,0.006))return null;
  const shown=kind==='f'?sci(R.fD)+' Hz':kind==='lam'?sci(R.lamD)+' m':eText(R.ED);
  return 'At '+R.b.n+', '+sim.vlab.val('t1','pos',r)+'%, the detector shows '+shown+'. Check your reading'+(kind==='lam'?' and that it is in meters.':'.');};}
function posCheck(sim,rv,v){return v<0||v>100?'The slider runs from 0% to 100%.':null;}
function visCheck(kind){return (sim,rv,v)=>{const pos=+rv,R=emRead(sim,'vis',pos);
  const want=kind==='f'?R.fD/1e14:kind==='lam'?R.lamD*1e9:R.ED,tol=kind==='lam'?1.01:0.0101;
  if(Math.abs(v-want)<=tol)return null;
  if(kind==='f'&&Math.abs(v*1e14-R.fD)/R.fD<0.01)return null;
  return 'With visible light at '+pos+'%, the detector shows '+(kind==='f'?sci(R.fD)+' Hz':kind==='lam'?sci(R.lamD)+' m':eText(R.ED))+'. Check your reading'+(kind==='f'?' and write it in units of 10¹⁴ Hz.':kind==='lam'?' and write it in nanometers.':'.');};}
function cCalc(sim,v,V){const f=V.val('t2','f',2),l=V.val('t2','lam',2);if(!Number.isFinite(f)||!Number.isFinite(l))return 'Fill in the 40% row of Table 2 first.';
  if(near(v,f*l*1e-3,0.02))return null;return 'Check this against your 40% row: change the frequency to Hz and the wavelength to meters, multiply them, then write the result in units of 10⁸ m/s.';}
function hCalc(sim,v,V){const f=V.val('t2','f',2),E=V.val('t2','E',2);if(!Number.isFinite(f)||!Number.isFinite(E)||!f)return 'Fill in the 40% row of Table 2 first.';
  if(near(v,E/f*10,0.02))return null;return 'Check this against your 40% row: divide the photon energy in eV by the frequency in Hz, then write the result in units of 10⁻¹⁵ eV·s.';}
const emb=sim=>sim.vlab.bench;
const t1Done=r=>sim=>['band','pos','f','lam','E'].every(c=>sim.vlab.raw('c:t1:'+c+':'+r).trim()!=='');
const BANDOPT=BANDS.map(b=>({v:b.id,l:b.n}));
const LAB_EM={id:'em-spectrum',title:'Virtual Lab 1: Waves You Cannot See',course:'Physics',teachers:'Colella',
  source:{label:'Virtual Lab #1 assignment (Canvas)',href:'https://rjhs.instructure.com/courses/14574/assignments/580948'},level:'honors',
  purpose:'<p>Explore the whole electromagnetic spectrum, from radio waves to gamma rays. Find out how frequency, wavelength and photon energy change from band to band, and why only part of the spectrum is dangerous to living cells.</p>',
  background:'<p>Light is an electromagnetic (EM) wave: an electric field and a magnetic field that oscillate together and carry energy through space. Any charge that accelerates, like an electron shaking back and forth in an antenna, sends out EM waves. Visible light is only a thin slice of a much wider spectrum. In order of rising frequency the bands are radio, microwave, infrared, visible, ultraviolet, X-ray and gamma ray. The boundaries between bands are human choices, not sharp physical edges.</p>'+
    '<p>Every EM wave travels through empty space at c = 3.00 × 10⁸ m/s, so frequency and wavelength are tied together: <b>c = fλ</b>. Light also arrives in packets called photons, and each photon carries energy <b>E = hf</b>, where h = 4.14 × 10⁻¹⁵ eV·s is Planck’s constant. A photon with about 10 eV or more can knock an electron off an atom. That is ionizing radiation.</p>'+
    '<p><b>Your teacher’s assignment.</b> Step One: play with the explorer on the bench and follow the procedure. Step Two: answer the Challenge questions. Step Three: summarize each Interesting question in 1 to 2 sentences.</p>'+
    '<p><b>About the virtual bench.</b> The detector shows frequency, wavelength and photon energy to 3 significant figures. Like a real meter, your detector has a small calibration error (under 0.5%), so your numbers will differ slightly from a classmate’s. The bands are drawn the same width so you can see them all; on a true scale the visible band would be a sliver. The drawn wave is not to scale: its wavelength shrinks on screen as the frequency rises.</p>',
  materials:['EM spectrum explorer: a band picker and a frequency slider for each band','Wave detector display: band, frequency, wavelength and photon energy','Size row: objects from a building to an atomic nucleus, for comparison'],
  hypothesis:{prompt:'<p>Before you start: predict how the wavelength and the energy of each photon change as the frequency goes up. Give your reasoning.</p>'},
  setup(sim){BioLab.setValues(sim,{part:'em',band:'vis',pos:50});const b=emb(sim);if(!b.bands||typeof b.bands!=='object')b.bands={};},
  controls:['band','pos'],
  steps:[
    {title:'Play first',text:'<p>Step One: play with the explorer. Choose each of the seven bands and move the frequency slider from end to end. Watch the wave, the detector, the ionizing line above the spectrum and the size row.</p>',
     done:sim=>Object.keys(emb(sim).bands||{}).length>=7,doneHint:sim=>'Visit every band. You have tried '+Object.keys(emb(sim).bands||{}).length+' of 7.'},
    {title:'Highest energy',text:'<p>Make the wave with the <b>highest photon energy</b> you can. Record it in row 1 of Table 1: the band, the slider setting, and the frequency, wavelength and photon energy from the detector.</p><p>Type powers of ten as <b>3.00 x 10^22</b> or <b>3.00e22</b>. Write the wavelength in meters.</p>',
     done:t1Done(0),doneHint:'Fill in every box in row 1 of Table 1.'},
    {title:'Lowest frequency',text:'<p>Make the wave with the <b>lowest frequency</b> you can. Record it in row 2 of Table 1.</p>',done:t1Done(1),doneHint:'Fill in every box in row 2 of Table 1.'},
    {title:'Shortest wavelength',text:'<p>Make the wave with the <b>shortest wavelength</b> you can. Record it in row 3 of Table 1.</p>',done:t1Done(2),doneHint:'Fill in every box in row 3 of Table 1.'},
    {title:'Visible light readings',text:'<p>Choose <b>Visible</b>. Set the slider to each setting in Table 2 (0%, 20%, 40%, 60%, 80% and 100%). At each one, read the detector and record the frequency in units of 10¹⁴ Hz, the wavelength in nanometers and the photon energy in eV.</p><p>Your graph of photon energy against frequency draws below as you type.</p>',
     done:sim=>VROWS.every((r,i)=>['f','lam','E'].every(c=>sim.vlab.raw('c:t2:'+c+':'+i).trim()!=='')),doneHint:'Fill in every box in Table 2.'},
    {title:'Analyze and answer',text:'<p>Do the two calculations, check your graph, then answer the Challenge questions (Step Two) and summarize the Interesting questions (Step Three). Finish with your conclusion and turn in your lab.</p>'}],
  tables:[
    {id:'t1',title:'Table 1: The extremes of the spectrum',cols:[{id:'task',label:'Task',rows:EMROWS,rowLabels:EMROWL},
      {id:'band',label:'Band',input:'select',options:BANDOPT},{id:'pos',label:'Slider (%)',input:'number',dp:0,check:posCheck},
      {id:'f',label:'Frequency (Hz)',input:'text',check:emCheck('f')},{id:'lam',label:'Wavelength (m)',input:'text',check:emCheck('lam')},{id:'E',label:'Photon energy (eV)',input:'text',check:emCheck('E')}]},
    {id:'t2',title:'Table 2: Across the visible band',cols:[{id:'pos',label:'Slider setting',rows:VROWS,rowLabels:VROWL},
      {id:'f',label:'Frequency (× 10¹⁴ Hz)',input:'number',dp:2,check:visCheck('f')},{id:'lam',label:'Wavelength (nm)',input:'number',dp:0,check:visCheck('lam')},{id:'E',label:'Photon energy (eV)',input:'number',dp:2,check:visCheck('E')}]}],
  graph:{type:'line',title:'Photon energy vs frequency for visible light',xl:'Frequency (× 10¹⁴ Hz)',yl:'Photon energy (eV)',xmin:0,xmax:8,ymin:0,ymax:3.5,series:[{table:'t2',x:'f',y:'E',label:'Visible light'}]},
  calcs:[{id:'c',label:'Speed of the wave from your 40% row: c = f × λ (f in Hz, λ in m)',unit:'× 10⁸ m/s',input:'number',check:cCalc},
    {id:'h',label:'Planck’s constant from the same row: h = E ÷ f (E in eV, f in Hz)',unit:'× 10⁻¹⁵ eV·s',input:'number',check:hCalc}],
  questions:[
    {id:'c1',n:'C1',q:'<p><b>Challenge.</b> Which band has the shortest wavelength? Use a value from Table 1 in your answer.</p>'},
    {id:'c2',n:'C2',q:'<p><b>Challenge.</b> Which band has the lowest frequency? How does its wavelength compare with the size of a building?</p>'},
    {id:'c3',n:'C3',q:'<p><b>Challenge.</b> Which two bands sit just outside the visible band, one on each side? Which of the two has more energy in each photon, and how do you know?</p>'},
    {id:'c4',n:'C4',q:'<p><b>Challenge.</b> Set the explorer to a wavelength of about 0.1 nm. Which object in the size row is about that size? Why does that make X-rays useful for working out how atoms are arranged in a crystal?</p>'},
    {id:'i1',n:'I1',q:'<p><b>Interesting question: why is radio safer than X-rays?</b> An FM radio photon at 100 MHz carries about 4 × 10⁻⁷ eV. A dental X-ray photon carries about 60,000 eV. Pulling an electron off an atom takes roughly 10 eV, so one X-ray photon can ionize atoms and break molecules like DNA, while no single radio photon comes close. A stronger radio signal sends more photons, but each one is still far too weak. Very strong radio or microwave beams can still heat tissue, which is why antenna workers have exposure limits.</p><p>Summarize this in 1 to 2 sentences.</p>'},
    {id:'i2',n:'I2',q:'<p><b>Interesting question: how can shortwave radio travel around the world?</b> Shortwave signals (3 to 30 MHz) bounce off the ionosphere, a layer of the upper atmosphere about 80 to 400 km up where the Sun’s ultraviolet light and X-rays have knocked electrons off gas atoms. The free electrons turn these waves back toward the ground, and the ground or the ocean bounces them up again, so a signal can hop between continents. This is the ionosphere, not the ozone layer. FM radio and TV signals have higher frequencies, pass straight through the ionosphere into space and only reach as far as the horizon.</p><p>Summarize this in 1 to 2 sentences.</p>'},
    {id:'i3',n:'I3',q:'<p><b>Interesting question: what are gamma-ray bursts?</b> They are flashes of gamma rays lasting from a fraction of a second to a few minutes, coming from galaxies billions of light-years away. For a few seconds a burst can outshine everything else in the gamma-ray sky. Long bursts come from the collapse of very massive stars, and short bursts from the merger of two neutron stars, confirmed in 2017 when gravitational waves and a burst arrived from the same event. Earth’s atmosphere absorbs gamma rays, so satellites detect them.</p><p>Summarize this in 1 to 2 sentences.</p>'},
    {id:'i4',n:'I4',q:'<p><b>Interesting question: how does a microwave oven cook food?</b> The oven fills with 2.45 GHz microwaves (wavelength 12.2 cm). Each photon carries only about 1 × 10⁻⁵ eV, far too little to ionize anything. Instead, the wave’s electric field flips back and forth 2.45 billion times a second, and polar water molecules keep twisting to line up with it. They jostle their neighbors, and that motion is heat. The metal mesh in the door has holes a few millimeters wide, much smaller than 12 cm, so it blocks the microwaves but lets visible light through.</p><p>Summarize this in 1 to 2 sentences.</p>'}],
  conclusion:{prompt:'<p>In 2 to 3 sentences, state how frequency, wavelength and photon energy are related across the electromagnetic spectrum. Use numbers from both of your tables as evidence.</p>',cer:false}};

/* --- lab 2: color filters --- */
const LIGHTS={R:[100,0,0],RG:[100,100,0],GB:[0,100,100],B:[0,0,100],G:[0,100,0],RB:[100,0,100],RGB:[100,100,100]};
const LIGHTN={R:'Red light',RG:'Red + green light',GB:'Green + blue light',B:'Blue light',G:'Green light',RB:'Red + blue light',RGB:'White light'};
const T1=[['R','white','none'],['RG','white','none'],['GB','white','none'],['B','red','none'],['G','yellow','none'],['RB','blue','none']];
const T2=[['RGB','magenta','blue'],['RGB','magenta','red'],['RGB','yellow','red'],['RGB','cyan','yellow'],['RGB','white','magenta'],['RGB','blue','yellow']];
const comboKey=(L,o,f)=>L+'|'+o+'|'+f;
const rowKeys=T=>T.map(r=>comboKey(r[0],r[1],r[2]));
const rowLabel=r=>LIGHTN[r[0]]+', '+r[1]+' car, '+(r[2]==='none'?'no glasses':FILTN[r[2]].toLowerCase()+' glasses');
const PUZ=[{id:'pA',q:'White light, rose (magenta) glasses: which car color looks black?',ask:'obj',obj:null,filt:'magenta'},
  {id:'pB',q:'White light, magenta car: which glasses make it look black?',ask:'filt',obj:'magenta',filt:null},
  {id:'pC',q:'White light, yellow car: which glasses make it look black?',ask:'filt',obj:'yellow',filt:null}];
const SEEOPT=KEYC.map(c=>({v:c,l:CAP(c)})),ANSOPT=['red','green','blue','cyan','magenta','yellow'].map(c=>({v:c,l:CAP(c)}));
const FILT6=['green','cyan','red','magenta','blue','yellow'],PRI=[0,2,4],SEC=[1,3,5];   // primaries and secondaries alternate; short labels sit beside Magenta on a phone
/* which bench setting the lamp is in, if it is a clean one (each bulb at 90% or more, or 10% or less) */
function lightKey(p){const b=[p.R,p.G,p.B];if(b.some(v=>v>10&&v<90))return null;const on=b.map(v=>v>=90);if(!on.some(Boolean))return 'off';
  return (on[0]?'R':'')+(on[1]?'G':'')+(on[2]?'B':'');}
function cfStep(sim){const b=sim.vlab.bench,p=sim.p;if(b.cover)return;const L=lightKey(p);if(!L||L==='off'||(p.uv||0)>0)return;
  if(!b.seen)b.seen={};const S=scene(sim),k=comboKey(L,p.obj,p.filt);if(b.seen[k]!==S.see)b.seen[k]=S.see;
  if(L==='RGB'&&p.obj==='white'){if(!b.mr)b.mr={};const a=b.mr[p.filt]||(b.mr[p.filt]=[]),m=meterShown(sim);if(!a.includes(m)){a.push(m);if(a.length>12)a.shift();}}}
function seeCheck(keys){return (sim,rv,v)=>{const b=sim.vlab.bench,k=String(rv),i=keys.indexOf(k);if(i<0)return null;const s=(b.seen||{})[k];
  if(!s)return 'Set up this combination on the bench and look at what you see before you record it.';
  return s===v?null:'Look again: set up this combination and compare what you see with your entry.';};}
function puzKey(sim,r){const P=PUZ[r],a=sim.vlab.raw('c:t3:ans:'+r);if(!a)return null;return comboKey('RGB',P.ask==='obj'?a:P.obj,P.ask==='filt'?a:P.filt);}
function puzCheck(sim,rv,v){const r=PUZ.findIndex(P=>P.id===String(rv));if(r<0)return null;const k=puzKey(sim,r);if(!k)return 'Choose your answer first, then test it on the bench.';
  const s=(sim.vlab.bench.seen||{})[k];if(!s)return 'Test your answer on the bench: set up white light, '+(PUZ[r].ask==='obj'?'your car color and rose glasses':'the '+PUZ[r].obj+' car and your glasses')+', then record what you see.';
  return s===v?null:'Look again: set up your answer on the bench and compare what you see with your entry.';}
function meterCheck(sim,rv,v){const f=String(rv),a=((sim.vlab.bench.mr||{})[f])||[];
  if(!a.length)return 'Set up white light and the white car'+(f==='none'?' with no glasses':' with '+FILTN[f].toLowerCase()+' glasses')+', then read the light meter.';
  if(a.some(x=>Math.abs(x-v)<=0.25))return null;const S=a[a.length-1];return 'The light meter read about '+S.toFixed(1)+' % for this setup. Check your reading.';}
const avg=a=>a.reduce((x,y)=>x+y,0)/a.length;
function priCalc(sim,v,V){const c=PRI.map(i=>V.col('t5','m')[i]);if(c.some(x=>!Number.isFinite(x)))return 'Fill in the red, green and blue rows of Table 5 first.';return Math.abs(v-avg(c))<=0.15?null:'Check this against Table 5: add the red, green and blue readings and divide by 3.';}
function secCalc(sim,v,V){const c=SEC.map(i=>V.col('t5','m')[i]);if(c.some(x=>!Number.isFinite(x)))return 'Fill in the cyan, magenta and yellow rows of Table 5 first.';return Math.abs(v-avg(c))<=0.15?null:'Check this against Table 5: add the cyan, magenta and yellow readings and divide by 3.';}
function ratCalc(sim,v,V){const p=vlNum(V.raw('k:pri')),s=vlNum(V.raw('k:sec'));if(!Number.isFinite(p)||!Number.isFinite(s)||!p)return 'Work out both averages first.';return Math.abs(v-s/p)<=0.03?null:'Check this: divide your secondary-color average by your primary-color average.';}
function vlNum(s){s=String(s||'').trim();return /^[-+]?(\d+\.?\d*|\.\d+)$/.test(s)?parseFloat(s):NaN;}
const allFilled=(t,c,n)=>sim=>{for(let i=0;i<n;i++)if(sim.vlab.raw('c:'+t+':'+c+':'+i).trim()==='')return false;return true;};
const cover=n=>sim=>{sim.vlab.bench.cover=n;};
const CFC=['R','G','B','obj','filt','pw','pr','pg','pb','poff'];
const LAB_CF={id:'color-filters',title:'Virtual Lab 2: Light, Objects and Filters',course:'Physics',teachers:'Colella',
  source:{label:'Virtual Lab #2 assignment (Canvas)',href:'https://rjhs.instructure.com/courses/14574/assignments/580949'},level:'honors',
  purpose:'<p>Find out how the color you see depends on three things: the light that shines on an object, the light the object reflects, and the light that gets through any filter in front of your eye.</p>',
  background:'<p>A lamp with red, green and blue bulbs can make many colors of light. Red and green light together look yellow, green and blue look cyan, red and blue look magenta, and all three look white. This is additive mixing.</p>'+
    '<p>An object’s color is the light it reflects. Under white light a red car reflects red light and absorbs green and blue. A yellow car reflects red and green and absorbs blue. A colored filter, like the lens in a pair of glasses, lets some colors through and absorbs the rest. So the light that reaches your eye is what the lamp sends, <b>and</b> the car reflects, <b>and</b> the glasses pass. If nothing survives all three, you see black.</p>'+
    '<p>Your eye senses color with three kinds of cone cells. S cones respond most to violet-blue light (peak near 420 nm), M cones to green (534 nm) and L cones to yellow-green (564 nm). Your brain compares their signals.</p>'+
    '<p><b>Your teacher’s assignment.</b> Step One: play with the bench and follow the procedure. Step Two: answer the Challenge questions. Step Three: summarize each Interesting question in 1 to 2 sentences.</p>'+
    '<p><b>About the virtual bench.</b> The screen shows each color by working out how strongly your three kinds of cones would respond, then mixing the lamp’s own red, green and blue to match. The light meter reads the share of the lamp’s full output that reaches your eye, to 0.1 %. Each student’s glasses are a little different, as real filters are, so your meter readings are your own. Under the bench, the four graphs show the spectrum at each stage: lamp, car, glasses and eye.</p>',
  materials:['Lamp with red, green and blue LED bulbs, each from 0% to 100%','Cars painted red, green, blue, cyan, magenta, yellow, white and black','Glasses (filters): red, green, blue, cyan, rose (magenta) and yellow','Light meter at the eye'],
  hypothesis:{prompt:'<p>Predict: what color will a red car look if only blue light shines on it? Explain your reasoning.</p>'},
  setup(sim){BioLab.setValues(sim,{part:'color',R:100,G:100,B:100,obj:'white',filt:'none',uv:0,deep:'spectra',cones:'simple'});const b=sim.vlab.bench;if(!b.seen)b.seen={};if(!b.mr)b.mr={};},
  controls:CFC,
  steps:[
    {title:'Play first',text:'<p>Step One: play with the bench. Change the bulbs, the car and the glasses, and watch the view through the glasses and the spectrum graphs under the bench. Try at least four different setups.</p><p>The bench counts a setup when each bulb is fully on (90% or more) or off (10% or less). The preset buttons set the bulbs for you.</p>',
     setup:cover(0),done:sim=>Object.keys(sim.vlab.bench.seen||{}).length>=4,doneHint:sim=>'Try at least four setups. You have tried '+Object.keys(sim.vlab.bench.seen||{}).length+'.'},
    {title:'Predict: colored light',text:'<p>Look at the six setups in <b>Table 1</b>. Each one has colored light on a car and no glasses. Before you test anything, choose your <b>Prediction</b> for every row.</p>',setup:cover(1),
     done:allFilled('t1','pred',6),doneHint:'Choose a prediction in every row of Table 1.'},
    {title:'Test: colored light',text:'<p>Now set up each row of Table 1 on the bench. Look at what you see and choose it in the <b>Observation</b> column. Set the glasses to <b>No glasses</b>.</p>',setup:cover(0),
     done:allFilled('t1','obs',6),doneHint:'Record an observation in every row of Table 1.'},
    {title:'Predict: glasses',text:'<p><b>Table 2</b> uses white light (all three bulbs at 100%) and adds glasses. Before you test, choose your <b>Prediction</b> for every row.</p>',setup:cover(2),
     done:allFilled('t2','pred',6),doneHint:'Choose a prediction in every row of Table 2.'},
    {title:'Test: glasses',text:'<p>Set up each row of Table 2 on the bench and record what you see in the <b>Observation</b> column.</p>',setup:cover(0),
     done:allFilled('t2','obs',6),doneHint:'Record an observation in every row of Table 2.'},
    {title:'Black-car puzzles',text:'<p>Each puzzle in <b>Table 3</b> describes a car that looks black. Choose your answer first. Then test your answer on the bench with white light and record what you see. If it is not black, think again, change your answer and test again.</p>',setup:cover(0),
     done:sim=>allFilled('t3','ans',3)(sim)&&allFilled('t3','seen',3)(sim),doneHint:'Answer and test all three puzzles in Table 3.'},
    {title:'Light meter',text:'<p>Use white light and the <b>white car</b>. Read the light meter with no glasses and record it in <b>Table 4</b>. Then read it through each pair of glasses and record the readings in <b>Table 5</b>. Your bar graph draws from Table 5.</p>',setup:cover(0),
     done:sim=>allFilled('t4','m',1)(sim)&&allFilled('t5','m',6)(sim),doneHint:'Fill in Table 4 and every row of Table 5.'},
    {title:'Analyze and answer',text:'<p>Work out the averages, check your bar graph, then answer the Challenge questions (Step Two) and summarize the Interesting questions (Step Three). Finish with your conclusion and turn in your lab.</p>',setup:cover(0)}],
  tables:[
    {id:'t1',title:'Table 1: Colored light on a car (no glasses)',cols:[{id:'combo',label:'Light and car',rows:rowKeys(T1),rowLabels:T1.map(rowLabel)},
      {id:'pred',label:'Prediction',input:'select',options:SEEOPT},{id:'obs',label:'Observation',input:'select',options:SEEOPT,check:seeCheck(rowKeys(T1))}]},
    {id:'t2',title:'Table 2: White light through glasses',cols:[{id:'combo',label:'Light, car and glasses',rows:rowKeys(T2),rowLabels:T2.map(rowLabel)},
      {id:'pred',label:'Prediction',input:'select',options:SEEOPT},{id:'obs',label:'Observation',input:'select',options:SEEOPT,check:seeCheck(rowKeys(T2))}]},
    {id:'t3',title:'Table 3: Black-car puzzles',cols:[{id:'puz',label:'Puzzle',rows:PUZ.map(P=>P.id),rowLabels:PUZ.map(P=>P.q)},
      {id:'ans',label:'Your answer',input:'select',options:ANSOPT},{id:'seen',label:'What you see when you test it',input:'select',options:SEEOPT,check:puzCheck}]},
    {id:'t4',title:'Table 4: Light meter, white light on the white car',cols:[{id:'f',label:'Glasses',rows:['none'],rowLabels:['No glasses']},{id:'m',label:'Light meter (%)',input:'number',dp:1,check:meterCheck}]},
    {id:'t5',title:'Table 5: Light meter through each pair of glasses',cols:[{id:'f',label:'Glasses',rows:FILT6,rowLabels:FILT6.map(CAP)},{id:'m',label:'Light meter (%)',input:'number',dp:1,check:meterCheck}]}],
  graph:{type:'bar',title:'Light meter reading for each lens',xl:'Glasses',yl:'Light meter (%)',ymin:0,ymax:60,series:[{table:'t5',x:'f',y:'m',label:'Light meter'}]},
  calcs:[{id:'pri',label:'Average reading through the red, green and blue glasses',unit:'%',input:'number',check:priCalc},
    {id:'sec',label:'Average reading through the cyan, magenta and yellow glasses',unit:'%',input:'number',check:secCalc},
    {id:'ratio',label:'Secondary-color average ÷ primary-color average',unit:'',input:'number',check:ratCalc}],
  questions:[
    {id:'c1',n:'C1',q:'<p><b>Challenge.</b> A magenta car looks blue through blue glasses and red through red glasses. Explain both results by following red, green and blue light from the lamp, off the car and through the glasses.</p>'},
    {id:'c2',n:'C2',q:'<p><b>Challenge.</b> Under blue light, a red car looks black. Explain why, and say what this tells you about whether color belongs to the object or to the light.</p>'},
    {id:'c3',n:'C3',q:'<p><b>Challenge.</b> Use Tables 4 and 5. About what fraction of the light gets through each red, green or blue lens, and each cyan, magenta or yellow lens? Explain the difference in terms of which bulbs’ light each lens passes.</p>'},
    {id:'i1',n:'I1',q:'<p><b>Interesting question: what is color blindness?</b> Your brain does not read the three cone signals one at a time. It compares them in three opponent channels: dark against light, red against green, and blue against yellow. The M and L cone curves overlap a lot, with peaks only 30 nm apart. If one of them is missing or shifted, the red–green channel has little to work with, so reds, oranges, yellows and greens look alike. This red–green type affects about 8% of men and 0.5% of women of Northern European descent. In the Full lab at Deep dive, choose <b>Color-blind views</b> to see it.</p><p>Summarize this in 1 to 2 sentences.</p>'},
    {id:'i2',n:'I2',q:'<p><b>Interesting question: are red, green and blue special?</b> Not in the light itself: the spectrum is a smooth range of wavelengths. They are special for us because we have three kinds of cones, and red, green and blue light each excite a different mix of them. Mixing just three lights can match most colors we can see, so screens use red, green and blue pixels. Printers do the opposite. Cyan, magenta and yellow inks each absorb one of those three, so they subtract light from white paper.</p><p>Summarize this in 1 to 2 sentences.</p>'},
    {id:'i3',n:'I3',q:'<p><b>Interesting question: why do fluorescent shirts look so bright?</b> A fluorescent dye absorbs ultraviolet and blue light, which you see little or none of, and gives the energy back as longer-wavelength light, often green or yellow. So the shirt sends more green light to your eye than the green light falling on it. That is why it can look brighter than a white shirt, and why it glows under a UV black light. In the Full lab at Deep dive, try the fluorescent car and the UV bulb.</p><p>Summarize this in 1 to 2 sentences.</p>'},
    {id:'i4',n:'I4',q:'<p><b>Interesting question: why does mixing paint make brown or gray?</b> Paint gets its color by absorbing light, so mixing paints combines their absorbing, not their reflecting. Each pigment absorbs a broad band and is never perfect, so when you mix several, almost every wavelength gets absorbed by something. Only a little light of mixed colors comes back, which you see as a dark brown or gray. Mixing light does the opposite: each light adds more. In the Full lab at Deep dive, choose <b>Light vs paint</b> to compare.</p><p>Summarize this in 1 to 2 sentences.</p>'}],
  conclusion:{prompt:'<p>Answer the lab question: how do the light, the object and the glasses together decide the color you see? Use at least two rows from your tables and your light meter readings as evidence.</p>',cer:false}};

/* ---------------- the tool ---------------- */
const SIM={
  id:'color',hash:'color',apUnit:9,order:0,prereq:['waves'],next:['photoelectric'],
  tab:'Light, color and perception',kind:'Simulation',
  card:'Tune waves from radio to gamma rays, then light a car with red, green and blue bulbs and look through colored glasses.',
  title:'Light, color and perception',
  lede:{bio:'Light is one small band of a huge spectrum. Explore waves you cannot see, then mix colored light on a car and look through colored glasses to find out where color comes from.',
    honors:'Every EM wave obeys c = fλ, and each photon carries E = hf. In Part 2, the light at your eye is the lamp × the car’s reflectance × the glasses’ transmission, and three kinds of cones turn it into color.',
    ap:'Go further: compare additive and subtractive mixing, simulate protan and deutan vision from the cone signals, make a dye fluoresce under UV, and switch to realistic cone curves.'},
  scale:'Part 1 runs from radio waves 30 km long to gamma rays 10 fm long, the size of an atom’s nucleus. Part 2 is a car about 4.5 m long under a three-bulb LED lamp.',
  aspect:16/10,timeless:true,animated:true,chChange:0.6,chReveal:2.6,
  controls:[
    {id:'part',label:'Explore',type:'seg',def:'em',options:[{v:'em',l:'1. EM spectrum'},{v:'color',l:'2. Color'}],onChange(sim){syncCtl(sim);sim._sc=null;}},
    {id:'band',label:'Band',type:'select',def:'vis',options:BANDOPT,help:'The seven bands of the electromagnetic spectrum, in order of rising frequency.'},
    {id:'pos',label:'Frequency within the band',type:'range',min:0,max:100,step:1,def:50,unit:'%',d:0,help:'Slide right for a higher frequency. The detector shows the actual value.'},
    {id:'R',label:'Red bulb',type:'range',min:0,max:100,step:1,def:100,unit:'%',d:0},
    {id:'G',label:'Green bulb',type:'range',min:0,max:100,step:1,def:100,unit:'%',d:0},
    {id:'B',label:'Blue bulb',type:'range',min:0,max:100,step:1,def:100,unit:'%',d:0},
    {id:'obj',label:'Car paint',type:'select',def:'red',options:KEYC.map(c=>({v:c,l:CAP(c)})).concat([{v:'fluor',l:'Fluorescent yellow-green',lvl:'ap'}]),help:'The color the car looks under white light.'},
    {id:'filt',label:'Glasses',type:'select',def:'none',options:FILT.map(f=>({v:f,l:FILTN[f]})),help:'Each lens lets some colors through and absorbs the rest.'},
    {id:'uv',label:'UV bulb (365 nm)',type:'range',min:0,max:100,step:1,def:0,unit:'%',d:0,lvl:'ap',help:'Ultraviolet light. Your lens blocks almost all of it before it reaches your cones.'},
    {id:'cones',label:'Cone curves',type:'seg',def:'simple',lvl:'ap',options:[{v:'simple',l:'Simple'},{v:'real',l:'Realistic'}],help:'Realistic curves are broad and lopsided, and M and L overlap heavily.'},
    {id:'deep',label:'Under the bench',type:'seg',def:'spectra',lvl:'ap',options:[{v:'spectra',l:'Spectra'},{v:'mix',l:'Light vs paint'},{v:'cb',l:'Color-blind views'}]}
  ],
  actions:[
    {id:'pw',label:'White light',run(sim){BioLab.setValues(sim,{R:100,G:100,B:100});}},
    {id:'pr',label:'Red only',run(sim){BioLab.setValues(sim,{R:100,G:0,B:0});}},
    {id:'pg',label:'Green only',run(sim){BioLab.setValues(sim,{R:0,G:100,B:0});}},
    {id:'pb',label:'Blue only',run(sim){BioLab.setValues(sim,{R:0,G:0,B:100});}},
    {id:'poff',label:'All bulbs off',run(sim){BioLab.setValues(sim,{R:0,G:0,B:0});}}
  ],
  labs:[LAB_EM,LAB_CF],
  benchRead(sim){if(labId(sim)==='em-spectrum'){const R=emNow(sim);return {band:sim.p.band,pos:sim.p.pos,f:R.fD,lam:R.lamD,E:R.ED,fs:sciPlain(R.fD),lams:sci(R.lamD).replace(' × 10','x10^').replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]/g,c=>UNSUP[c]),Es:sciPlain(R.ED)};}
    if(labId(sim)==='color-filters'){const S=scene(sim);return {color:S.see,meter:meterShown(sim),cover:sim.vlab.bench.cover,light:lightKey(sim.p),obj:sim.p.obj,filt:sim.p.filt};}return null;},
  init(sim){if(sim&&sim.vlab){const b=sim.vlab.bench;if(sim.vlab.lab.id==='em-spectrum'){if(!b.bands||typeof b.bands!=='object')b.bands={};}else{if(!b.seen)b.seen={};if(!b.mr)b.mr={};if(b.cover===undefined)b.cover=0;}}sim._sc=null;return {};},
  step(sim,dt){if(sim.t<0||!sim.vlab)return;const id=labId(sim);if(id==='em-spectrum'){const b=sim.vlab.bench;if(!b.bands)b.bands={};b.bands[sim.p.band]=1;}else if(id==='color-filters')cfStep(sim);},
  onLevel(sim){sim._sc=null;if(sim.mode==='vlab'&&sim.vlab)return;syncCtl(sim);},
  metrics:[
    {id:'fq',label:'Frequency',text:true,get:s=>sci(emNow(s).fD)+' Hz'},
    {id:'wl',label:'Wavelength',text:true,get:s=>{const R=emNow(s);return lenText(R.lamD)+' ('+sci(R.lamD)+' m)';}},
    {id:'pe',label:'Photon energy (E = hf)',text:true,get:s=>eText(emNow(s).ED)},
    {id:'ej',label:'Photon energy in joules',text:true,lvl:'honors',get:s=>sci(emNow(s).f*H_J)+' J'},
    {id:'ion',label:'Can one photon ionize an atom?',text:true,get:s=>{const E=emNow(s).ED;return ionizing(E)?'Yes: '+eText(E)+' is above about 10 eV':'No: '+eText(E)+' is below about 10 eV';}},
    {id:'logf',label:'Frequency as a power of ten (log₁₀ f)',unit:'',d:2,lvl:'honors',min:4,max:23,get:s=>Math.log10(emNow(s).f)},
    {id:'logE',label:'Photon energy as a power of ten (log₁₀ E/eV)',unit:'',d:2,lvl:'honors',min:-11,max:9,get:s=>Math.log10(emNow(s).E)},
    {id:'see',label:'Color you see through the glasses',text:true,get:s=>{const S=scene(s);return CAP(S.seeX)+(S.bright?' (brighter than white)':'');}},
    {id:'room',label:'Car color in the room',text:true,get:s=>CAP(scene(s).roomX)},
    {id:'meter',label:'Light reaching the eye',unit:'%',d:1,lvl:'honors',min:0,max:100,get:s=>scene(s).meter},
    {id:'Ls',label:'L cone signal',unit:'',d:2,lvl:'honors',min:0,max:1.2,get:s=>scene(s).qEye[0]},
    {id:'Ms',label:'M cone signal',unit:'',d:2,lvl:'honors',min:0,max:1.2,get:s=>scene(s).qEye[1]},
    {id:'Ss',label:'S cone signal',unit:'',d:2,lvl:'honors',min:0,max:1.2,get:s=>scene(s).qEye[2]},
    {id:'rg',label:'Red–green signal (L − M)',unit:'',d:2,lvl:'ap',min:-1,max:1,get:s=>{const q=scene(s).qEye;return q[0]-q[1];}},
    {id:'by',label:'Blue–yellow signal (S − (L + M)/2)',unit:'',d:2,lvl:'ap',min:-1,max:1,get:s=>{const q=scene(s).qEye;return q[2]-(q[0]+q[1])/2;}}
  ],
  graphs:[{id:'em',label:'Part 1: photon energy vs frequency (powers of ten)',custom:true},{id:'eye',label:'Part 2: light reaching the eye',custom:true}],
  defaultGraph:'em',
  plot(sim,ctx,box,id){
    if(id==='em'){const ax=axes(ctx,box,{xmin:4,xmax:23,ymin:-11,ymax:9,xl:'Frequency, as a power of ten (log₁₀ f in Hz)',yl:'log₁₀ E (eV)'});
      BANDS.forEach((b,i)=>{const x0=ax.X(Math.log10(b.lo)),x1=ax.X(Math.log10(b.hi));ctx.fillStyle=i%2?'rgba(128,128,128,.10)':'rgba(128,128,128,.03)';ctx.fillRect(x0,box.T,x1-x0,box.H);});
      ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['s1'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(box.L,ax.Y(1));ctx.lineTo(box.L+box.W,ax.Y(1));ctx.stroke();ctx.setLineDash([]);
      txt(ctx,'10 eV: ionizing above this line',box.L+6,ax.Y(1)-6,{s:13,c:PAL['s1']});
      ctx.strokeStyle=PAL['g-line'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(ax.X(4),ax.Y(4+Math.log10(H_EV)));ctx.lineTo(ax.X(23),ax.Y(23+Math.log10(H_EV)));ctx.stroke();
      const R=emNow(sim);ctx.fillStyle=PAL['g-dot'];ctx.beginPath();ctx.arc(ax.X(Math.log10(R.f)),ax.Y(Math.log10(R.E)),6,0,6.29);ctx.fill();
      txt(ctx,R.b.n+': '+eText(R.ED),box.L+8,box.T+14,{s:13,w:600,c:PAL['muted']});return;}
    const S=scene(sim),hon=atLeast('honors'),l0=atLeast('ap')?340:380;if(sim.p.part!=='color')txt(ctx,'Choose 2. Color to change this graph.',box.L+box.W/2,box.T+10,{s:13,c:PAL['muted'],a:'center'});
    const mx=Math.max(Math.max(...LED.R)*1.05,...S.eye);box.T=34;box.H-=22;const ax=axes(ctx,box,{xmin:l0,xmax:750,ymin:0,ymax:1,xl:'Wavelength (nm)',yl:'Light at the eye (share of peak)'});
    for(let i=0;i<NW;i++){const l=WL[i];if(l<l0)continue;const v=S.eye[i]/mx;ctx.fillStyle=lamCol(l,0.85);ctx.fillRect(ax.X(l-2.5),ax.Y(v),ax.X(l+2.5)-ax.X(l-2.5)+0.5,ax.Y(0)-ax.Y(v));}
    const items=[{label:'Light at the eye',color:PAL['cv-ink']}];
    if(hon){const cc=['#d9363e','#2fa84f','#5b5bd6'],nm=['L cones','M cones','S cones'];S.cs.curves.forEach((c,k)=>{ctx.strokeStyle=cc[k];ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.beginPath();WL.forEach((l,i)=>{if(l<l0)return;i&&WL[i-1]>=l0?ctx.lineTo(ax.X(l),ax.Y(c[i])):ctx.moveTo(ax.X(l),ax.Y(c[i]));});ctx.stroke();ctx.setLineDash([]);items.push({label:nm[k],color:cc[k],dash:true});});}
    legend(ctx,box.L,14,items);},
  infoPanel(sim){if(sim.p.part!=='color'){const R=emNow(sim),E=R.ED;
      return '<div class="p-head"><h3>Can this light damage cells?</h3></div><p>Each photon of this '+R.b.w+' carries <b>'+eText(E)+'</b>. Knocking an electron off an atom takes about 10 eV.</p><p>'+
        (ionizing(E)?'<b>This photon is ionizing.</b> One photon has enough energy to ionize an atom, and the electron it frees can ionize many more. That can break molecules like DNA, which is why X-ray technicians limit exposure.':
         (E>3.1?'<b>Not ionizing, but energetic.</b> Ultraviolet photons this strong can break some chemical bonds in skin and DNA, which is why sunburn happens.':'<b>Not ionizing.</b> A brighter source sends more photons, but each one is still far too weak to ionize. Very strong beams can still heat things up.'))+'</p>'+
        (atLeast('honors')?'<p>E = hf = (4.14 × 10⁻¹⁵ eV·s)('+sci(R.fD)+' Hz) = '+eText(E)+'.</p>':'');}
    const S=scene(sim),ch=chain(S),nm=['red','green','blue'];
    const lit=nm.filter((c,i)=>ch.lit[i]),lostCar=nm.filter((c,i)=>ch.lit[i]&&!ch.ref[i]),lostF=nm.filter((c,i)=>ch.lit[i]&&ch.ref[i]&&!ch.pas[i]);
    return '<div class="p-head"><h3>Why this color?</h3></div><ol><li><b>Lamp:</b> '+(lit.length?list(lit)+' light.':'no light at all.')+'</li><li><b>Car:</b> the '+objName(S.obj)+' paint '+(lostCar.length?'absorbs '+list(lostCar)+(ch.out.length?' and reflects '+list(ch.out):'')+'.':(ch.out.length?'reflects all of it.':'has nothing to reflect.'))+'</li><li><b>Glasses:</b> '+(sim.p.filt==='none'?'none, so everything the car reflects reaches you.':(lostF.length?'absorb '+list(lostF)+(ch.thru.length?' and pass '+list(ch.thru):'')+'.':(ch.thru.length?'pass all of it.':'have nothing to pass.')))+'</li></ol><p><b>You see '+S.seeX+'.</b>'+(S.flP>0.02?' The fluorescent dye also turns UV and blue light into green.':'')+'</p>';},
  narrate(sim){const p=sim.p;
    if(labId(sim)==='color-filters'){const b=sim.vlab.bench;if(b.cover)return 'The bench is covered while you predict. <b>Write your predictions first</b>, then test them.';
      return 'The lamp is sending '+bulbsText([p.R/100,p.G/100,p.B/100])+' light onto the '+p.obj+' car'+(p.filt==='none'?', with no glasses.':', and you look through '+FILTN[p.filt].toLowerCase()+' glasses.')+' <b>Look at the view through the glasses</b> and decide what color you see.';}
    if(p.part!=='color'){const R=emNow(sim),E=R.ED,hon=atLeast('honors');
      let s='This '+R.b.w+' has a wavelength of '+lenText(R.lamD)+', '+sizeMatch(R.lamD)+'. ';
      s+=(hon?'Each photon carries E = hf = '+eText(E)+', ':'Each photon carries '+eText(E)+', ')+(ionizing(E)?'<b>enough to ionize an atom</b>.':'<b>too little to ionize an atom</b>, which takes about 10 eV.');
      return s+(R.b.id==='vis'?' Higher frequency means shorter waves and more energy per photon.':'');}
    const S=scene(sim),ch=chain(S);
    if(atLeast('ap')&&p.deep==='mix')return 'Light adds: red, green and blue light together make white. Paint subtracts: each pigment absorbs part of the spectrum, so <b>cyan, magenta and yellow paint together reflect very little</b> and look '+(sim.vis.mixName||'dark brown')+'.';
    if(atLeast('ap')&&p.deep==='cb')return 'A protan viewer has no working L cones and a deutan viewer no working M cones. With only two cone types, <b>reds, yellows and greens fall on one line</b> and differ mostly in brightness.';
    if(S.flP>0.02&&S.uv>0)return 'UV light is invisible to you, but the fluorescent dye absorbs it and gives the energy back as green light. <b>The car glows '+S.seeX+'</b>'+(S.bright?', brighter than a white car could be.':'.');
    if(!ch.lit.some(Boolean))return 'All the bulbs are off, so <b>no light reaches the car</b> and everything looks black.';
    let s='The lamp sends '+list(['red','green','blue'].filter((c,i)=>ch.lit[i]))+' light. ';
    s+=ch.out.length?'The '+objName(S.obj)+' car reflects '+list(ch.out)+'. ':'The '+objName(S.obj)+' car reflects none of it. ';
    if(p.filt!=='none')s+=ch.thru.length?'The '+FILTN[p.filt].toLowerCase()+' glasses pass '+list(ch.thru)+'. ':'The '+FILTN[p.filt].toLowerCase()+' glasses block '+(ch.out.length?list(ch.out):'it')+'. ';
    return s+'<b>You see '+S.seeX+'</b>'+(S.see==='black'?' because no light survives the trip to your eye.':'.');},
  challenges:[
    {lvl:'bio',q:'A red car sits under white light. You switch the lamp to blue light only. What color does the car look?',choices:['Red, because the car is red','Purple, a mix of red and blue','Black'],correct:2,
      baseline:{part:'color',obj:'red',filt:'none',R:100,G:100,B:100},change:{R:0,G:0},changeText:'Lamp switched to blue only',watch:'eye',
      explain:{bio:'Red paint reflects red light and absorbs green and blue. Blue light is all that arrives, the paint absorbs it, and nothing comes back. Color is the light that reaches you, not a fixed property of the car.',
        honors:'The red car’s reflectance is about 4% at 460 nm. With only the blue bulb on, the light at the eye drops to about 1% of white, and all three cone signals fall near zero.'}},
    {lvl:'bio',q:'Red and green light both shine on a white car. What color does the car look?',choices:['Brown, like mixing red and green paint','Yellow','White'],correct:1,
      baseline:{part:'color',obj:'white',filt:'none',R:100,G:0,B:0},change:{G:100},changeText:'Green bulb turned on',watch:'eye',
      explain:{bio:'Light adds. Red and green light reaching your eye together look yellow. Paint works differently because pigments absorb light; mixing red and green paint does make brown.',
        honors:'Red light drives mostly your L cones and green light drives M and L. Together they give strong L and M signals with almost no S signal, which your brain reads as yellow.'}},
    {lvl:'bio',q:'You raise a radio wave’s frequency (slide toward microwaves). What happens to its wavelength?',choices:['It gets longer','It gets shorter','It stays the same, since all light travels at the same speed'],correct:1,
      baseline:{part:'em',band:'radio',pos:20},change:{pos:90},changeText:'Frequency raised within the radio band',watch:'em',
      explain:{bio:'All EM waves travel at the same speed, so if more waves pass each second, each one must be shorter. Here the frequency rises about 1400 times, so the wavelength shrinks 1400 times, from about 3.8 km to about 2.8 m.',
        honors:'c = fλ with c fixed at 3.00 × 10⁸ m/s, so λ = c/f. The same speed is exactly why frequency and wavelength trade off.'}},
    {lvl:'bio',q:'A powerful radio tower and a single ultraviolet photon. Which carries more energy in each photon?',choices:['The radio tower’s photons, since the tower is so powerful','The ultraviolet photon','Equal, since both travel at the speed of light'],correct:1,
      baseline:{part:'em',band:'radio',pos:100},change:{band:'uv',pos:50},changeText:'Switched from radio to ultraviolet',watch:'em',
      explain:{bio:'A powerful tower sends huge numbers of photons, but each radio photon here carries about a millionth of an eV. One ultraviolet photon here carries about 20 eV, over ten million times more. Photon energy depends only on frequency.',
        honors:'E = hf: 3 × 10⁸ Hz gives 1.2 × 10⁻⁶ eV, while 4.9 × 10¹⁵ Hz gives about 20 eV. Power sets the number of photons per second, not the energy of each.'}},
    {lvl:'honors',q:'A magenta car under white light. You look through blue glasses. What color do you see?',choices:['Black','Blue','Magenta'],correct:1,
      baseline:{part:'color',obj:'magenta',filt:'none',R:100,G:100,B:100},change:{filt:'blue'},changeText:'Blue glasses put on',watch:'eye',
      explain:{honors:'Magenta paint reflects red and blue and absorbs green. The blue lens absorbs the red, so only the reflected blue reaches you. The car looks blue.'}},
    {lvl:'honors',q:'Green light from the green bulb (525 nm) reaches your eye. Which cones respond?',choices:['Only the M cones','M cones strongly and L cones almost as strongly','All three kinds about equally'],correct:1,
      baseline:{part:'color',obj:'white',filt:'none',R:100,G:100,B:100},change:{R:0,B:0},changeText:'Only the green bulb on',watch:'eye',
      explain:{honors:'The M and L cone curves overlap heavily, with peaks only 30 nm apart. At 525 nm the M cones are near their peak and the L cones respond at roughly 70% of theirs. S cones barely respond. Your brain reads “much M, a bit less L, no S” as green.'}},
    {lvl:'honors',q:'Visible light and X-rays in empty space. Which travels faster?',choices:['X-rays, since they carry more energy','Visible light','Neither: both travel at 3.00 × 10⁸ m/s'],correct:2,
      baseline:{part:'em',band:'vis',pos:50},change:{band:'xray',pos:50},changeText:'Switched from visible light to X-rays',watch:'em',
      explain:{honors:'Every EM wave travels at c in a vacuum. X-rays have about 1000 times the frequency of visible light and 1/1000 of the wavelength; f × λ is still 3.00 × 10⁸ m/s. Photon energy rises with f, not speed.'}},
    {lvl:'ap',q:'A red car under white light. You switch to the Color-blind views and change the car to green. For a protan viewer, how do the red and green cars compare?',choices:['Clearly different hues, as for a typical viewer','Nearly the same hue, differing mainly in brightness','The green car now looks red'],correct:1,
      baseline:{part:'color',obj:'red',filt:'none',deep:'cb',R:100,G:100,B:100},change:{obj:'green'},changeText:'Car changed from red to green',watch:'eye',
      explain:{ap:'Without L cones, the red–green comparison L − M is gone. Red and green light both land on the same yellowish line of possible colors and differ mainly in how strongly they drive the M cones, so the cars look like dim and bright versions of one olive-yellow.'}},
    {lvl:'ap',q:'You mix cyan, magenta and yellow paint. The mixture looks…',choices:['White, the same as mixing the three lights','Dark brown or nearly black','Bright green'],correct:1,
      baseline:{part:'color',deep:'spectra'},change:{deep:'mix'},changeText:'Showing light vs paint',watch:'eye',
      explain:{ap:'Each paint’s reflectance multiplies: cyan absorbs most red, magenta most green, yellow most blue. Real pigments reflect 6% to 10% even where they absorb, so a little light of every color survives, about 5% to 8% of white, which looks dark brown.'}},
    {lvl:'ap',q:'A fluorescent yellow-green car sits in the dark. You turn on only the UV bulb. What does it look like?',choices:['Black, since you cannot see UV','It glows green','It glows violet'],correct:1,
      baseline:{part:'color',obj:'fluor',filt:'none',R:0,G:0,B:0,uv:0},change:{uv:100},changeText:'UV bulb turned on',watch:'eye',
      explain:{ap:'The lens in your eye blocks almost all 365 nm light, so the UV itself is invisible. The dye absorbs each UV photon (3.4 eV) and emits a green photon (2.4 eV) after losing some energy as heat. That emitted green light is what you see.'}}
  ],
  tour:[
    {lvl:'bio',title:'Shaking charges make light',text:'An electron shaking up and down makes the electric field around it wiggle, and the wiggle travels outward as a wave. This is visible light: about 530 nm from crest to crest.',
      focus:[6,4,792,236],speed:0.5,setup(sim){BioLab.setValues(sim,{part:'em',band:'vis',pos:50});}},
    {lvl:'bio',title:'Radio: long waves, tiny photons',text:'Switch to radio. The waves get much longer, from meters to kilometers, and each photon carries only a millionth of an eV or less. The detector shows all three numbers.',
      focus:[[6,4,792,236],[16,258,768,70]],speed:0.5,setup(sim){BioLab.setValues(sim,{part:'em',band:'radio',pos:40});}},
    {lvl:'bio',title:'Gamma rays: tiny waves, huge photons',text:'At the other end, a gamma ray’s wavelength is smaller than an atom. Each photon carries millions of eV, far past the 10 eV needed to <b>ionize</b> an atom. Everything right of the red line is ionizing.',
      focus:[[548,4,250,236],[16,240,768,258]],speed:0.5,setup(sim){BioLab.setValues(sim,{part:'em',band:'gamma',pos:30});}},
    {lvl:'bio',title:'Color is reflected light',text:'Part 2. A lamp with red, green and blue bulbs, all on, makes white light. The red car reflects the red light and absorbs the green and blue. The bars show what survives each stage.',
      focus:[[6,4,392,300],[6,310,788,188]],speed:0.5,setup(sim){BioLab.setValues(sim,{part:'color',obj:'red',filt:'none',R:100,G:100,B:100});}},
    {lvl:'bio',title:'Glasses take light away',text:'Now a green car through rose (magenta) glasses. The car reflects only green light, the rose lenses absorb green, and <b>nothing reaches your eye</b>. The car looks black.',
      focus:[[402,4,392,300],[6,310,788,188]],speed:0.5,setup(sim){BioLab.setValues(sim,{part:'color',obj:'green',filt:'magenta',R:100,G:100,B:100});}},
    {lvl:'honors',title:'Three kinds of cones',text:'Your eye has S, M and L cones, with peaks near 420, 534 and 564 nm. The dashed curves on the “= Eye” graph show them. A yellow car sends red and green light, which drives L and M strongly and S hardly at all: your brain calls that yellow.',
      focus:[6,310,788,188],speed:0.5,setup(sim){BioLab.setValues(sim,{part:'color',obj:'yellow',filt:'none',R:100,G:100,B:100});}},
    {lvl:'ap',title:'Seeing with two cone types',text:'Color-blind views compute what a viewer missing L cones (protan) or M cones (deutan) sees. Their red car loses its redness and looks olive-yellow, close to how a green car looks to them.',
      focus:[6,310,788,188],speed:0.5,setup(sim){BioLab.setValues(sim,{part:'color',obj:'red',filt:'none',deep:'cb',R:100,G:100,B:100});}}
  ],
  onTourExit(sim){const base={};SIM.controls.forEach(c=>base[c.id]=c.def);BioLab.setValues(sim,base);BioLab.reset(sim);},
  lab:{bio:'<p><b>Question:</b> How do waves change across the spectrum, and where does the color you see come from?</p><ol><li><b>Part 1.</b> Pick each band in turn. Record a trial at the left end and the right end of the slider. Note the wavelength and the photon energy.</li><li>Find where the waves become ionizing.</li><li><b>Part 2.</b> Under white light, record the color of each car. Then switch to blue light only and record each car again.</li><li>Put on each pair of glasses with the white car and record what you see.</li></ol><p><b>Write:</b> Explain why a red car looks black under blue light, using the idea of reflected light.</p>',
    honors:'<p><b>Question:</b> Does E = hf hold across the spectrum, and how do your cones turn light into color?</p><ol><li><b>Part 1.</b> Record trials across the visible band. Plot photon energy (log₁₀ E) against frequency (log₁₀ f) in the Trials graph and find the slope.</li><li>Check c = fλ for one trial in each band.</li><li><b>Part 2.</b> For each car under white light, record the L, M and S cone signals.</li><li>Find a car and glasses that give two very different setups the same color.</li></ol><p><b>Write:</b> Explain, with cone signals, why red plus green light looks yellow.</p>',
    ap:'<p><b>Question:</b> How much of color is in the light, and how much is in the viewer?</p><ol><li>With white light, record the red–green and blue–yellow signals for each car.</li><li>Open <b>Color-blind views</b> and compare the red, green and yellow cars for protan and deutan viewers.</li><li>Open <b>Light vs paint</b>. Explain why the center of each mix differs.</li><li>Light the fluorescent car with the UV bulb alone, then with white light, and compare it with the white car.</li><li>Switch to <b>Realistic</b> cone curves and repeat step 1. What changes?</li></ol><p><b>Write a CER:</b> Claim whether red, green and blue are special in the light or in us. Use your opponent-signal data as evidence, and reason from the cone curves.</p>'},
  terms:[
    {t:'Electromagnetic wave',d:'An electric field and a magnetic field that oscillate together and travel through space. Made by accelerating charges.'},
    {t:'Frequency (f)',d:'How many wave crests pass a point each second, in hertz (Hz).'},
    {t:'Wavelength (λ)',d:'The distance from one crest to the next. For every EM wave in a vacuum, c = fλ.'},
    {t:'Photon',d:'A packet of light energy. Its energy depends only on its frequency: E = hf.'},
    {t:'Ionizing radiation',d:'Photons with enough energy (about 10 eV or more) to knock an electron off an atom: far ultraviolet, X-rays and gamma rays.'},
    {t:'Reflectance',d:'The share of the light of each wavelength that an object sends back. It sets the object’s color under white light.'},
    {t:'Filter (transmission)',d:'A material that lets some wavelengths through and absorbs the rest. Transmission is the share that gets through.'},
    {t:'Additive mixing',d:'Combining lights. Red + green = yellow, green + blue = cyan, red + blue = magenta, all three = white.'},
    {t:'Cones (S, M, L)',lvl:'honors',d:'The three kinds of color-sensing cells in the retina. Their sensitivity peaks near 420, 534 and 564 nm.'},
    {t:'Electron-volt (eV)',lvl:'honors',d:'A unit of energy: 1 eV = 1.602 × 10⁻¹⁹ J. Planck’s constant h = 4.14 × 10⁻¹⁵ eV·s.'},
    {t:'Subtractive mixing',lvl:'ap',d:'Combining paints, inks or filters. Each absorbs part of the spectrum, so the mix reflects or passes less.'},
    {t:'Opponent channels',lvl:'ap',d:'The brain compares cone signals: light against dark (L + M), red against green (L − M) and blue against yellow (S − (L + M)/2).'},
    {t:'Protan and deutan',lvl:'ap',d:'Red–green color vision deficiencies: L cones missing or shifted (protan), or M cones missing or shifted (deutan).'},
    {t:'Fluorescence',lvl:'ap',d:'Absorbing a short-wavelength photon (often UV) and emitting a longer-wavelength, lower-energy one.'}
  ],
  about:'<p><b>Part 1.</b> c = 2.998 × 10⁸ m/s and h = 4.136 × 10⁻¹⁵ eV·s (6.626 × 10⁻³⁴ J·s). The band boundaries used here are radio below 3 × 10⁸ Hz (λ above 1 m), microwave to 3 × 10¹¹ Hz (1 mm), infrared to 4.0 × 10¹⁴ Hz (750 nm), visible to 7.9 × 10¹⁴ Hz (380 nm), ultraviolet to 3 × 10¹⁶ Hz (10 nm), X-ray to 3 × 10¹⁹ Hz (10 pm) and gamma rays above. These are conventions; real bands overlap, and X-rays and gamma rays are often told apart by their source rather than their energy. The slider moves through each band on a logarithmic scale. The ionizing line is set at 10 eV: it takes 13.6 eV to ionize hydrogen and about 12.6 eV for water, and ultraviolet just below this can still break chemical bonds. The size row uses typical sizes (a 10-story building 30 m, a person 1.7 m, a honeybee 1.2 cm, a cell 10 µm, a virus 100 nm, an atom 0.1 nm, a nucleus 10 fm).</p>'+
    '<p><b>Part 2.</b> The lamp’s bulbs are modeled as LEDs with Gaussian spectra peaking at 630 nm (red), 525 nm (green) and 460 nm (blue), with widths typical of real LEDs, and an optional 365 nm UV LED. Each bulb at 100% emits the same power. Car paints and filters have smooth reflectance or transmission curves with edges near 495 nm and 585 nm: paints reflect 90% where they reflect and 4% where they absorb; filters pass 88% and 2%. The light at the eye is lamp × reflectance × transmission at each wavelength, every 5 nm from 340 to 750 nm.</p>'+
    '<p><b>Cones and the color you see.</b> Cone sensitivities peak at 420 nm (S), 534 nm (M) and 564 nm (L), the photopigment peaks measured in human cones by Bowmaker and Dartnall (1980). “Simple” curves are Gaussians; “Realistic” curves use the visual-pigment template of Govardovskii and others (2000). Both are multiplied by a model of the eye’s lens, which absorbs below about 390 nm. The screen color is the mix of the lamp’s own three bulbs that gives the same three cone signals, so equal power from all three looks white. Color names come from those three amounts. Colors outside what the bulbs can mix are clipped.</p>'+
    '<p><b>Deep dive.</b> Opponent signals are L + M, L − M and S − (L + M)/2, with each cone signal scaled so white light gives 1. Protan and deutan views replace the missing cone signal so the color lies on the half-plane through white and the lamp’s own yellow (red + green) or blue, after the methods of Brettel, Viénot and Mollon (1997, 1999); real color vision deficiencies vary, and many people have shifted rather than missing cones. The paints in Light vs paint have broader, less perfect curves (6% to 10% reflected where they absorb), so their product is dark brown. The fluorescent dye absorbs light below about 485 nm with 85% efficiency and re-emits it near 525 nm, losing the energy difference as heat.</p>'+
    '<p><b>Simplifications.</b> Real paints, filters and eyes vary, and your screen cannot show every color an eye can see. Brightness adaptation, the surroundings and glossy reflections all change real color perception and are ignored. In the virtual labs, each student’s detector has a calibration error of up to about 0.5%, each pair of glasses differs by about 2.5% in how much it passes, and the light meter flickers by about ±0.1 %.</p>',
  draw(sim,ctx,vdt,k){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,500);if(sim.p.part==='color')drawColor(sim,ctx,vdt,k);else drawEM(sim,ctx,vdt,k);},
  thumbSetup(sim){sim.p.part='color';sim.p.obj='magenta';sim.p.filt='none';}
};
BioLab.register(SIM);
BioLab.addPractical({color:{
  hook:'A dental X-ray photon carries about 60,000 eV. A Wi-Fi photon at 2.4 GHz carries about 0.00001 eV. Knocking an electron off an atom takes about 10 eV. Which one can damage your cells, and would turning up the Wi-Fi power change that?',
  hookSet:{part:'em',band:'xray',pos:50},
  answer:'Only the X-ray. Photon energy is E = hf, so a 2.4 GHz Wi-Fi photon carries about a millionth of the 10 eV needed, and more photons cannot add up inside one atom. A 60,000 eV X-ray photon has 6000 times what it needs. In the explorer, the ionizing line sits partway through the ultraviolet, and everything to its right can ionize.',
  uses:['Sunburn: a 300 nm UVB photon carries 4.1 eV, enough to break bonds in DNA, while visible photons (1.7 to 3.3 eV) rarely do. That is why sunscreen blocks UV, not visible light.',
    'Stage lighting: a red costume under a blue spotlight looks black, so designers check costumes under the show’s real lights before opening night.',
    'Screens and printers: your phone mixes red, green and blue pixels because your eye has three kinds of cones. A printer uses cyan, magenta and yellow ink, which each subtract one of those colors from white paper.'],
  takeaway:'What light does to atoms depends on the energy of each photon, E = hf, and the color you see is only the light that survives from the lamp, off the object and through any filter to your eye.',
  lede:'Explore waves you cannot see, from radio to gamma rays. Then shine red, green and blue light on a car and look through colored glasses to find out where color comes from.',
  tour:[
    'An electron shaking up and down makes a wave that travels outward, like ripples from a finger tapping water. This one is visible light, about 530 nm from crest to crest, less than a hundredth the width of a hair.',
    'Radio waves are the long ones, from about a meter up to many kilometers, longer than a football field. Each radio photon carries a tiny bit of energy, so radio waves pass through you all day without harm.',
    'Gamma rays are the short ones, smaller than an atom. Each one carries millions of times the energy needed to knock an electron off an atom. That is what “ionizing” means, and it starts partway into the ultraviolet.',
    'Turn on all three bulbs and you get white light, like a phone screen showing white. The red car sends back only the red part and soaks up the rest, which is why it looks red.',
    'Rose-colored glasses block green light. A green car sends back only green light, so through those glasses nothing reaches your eye and the car looks black, like a shadow.']
}});
})();
