/* Raider PhysLab story: Why does traffic stop for no reason? (stop-and-go waves; reaction time, following distance,
   position graphs, a wave that moves backward). Nov 26, 2026.

   The model (one rule for every human driver, after the "optimal velocity" car-following models used by traffic physicists):
     each driver speeds up or slows toward a comfortable speed for the gap ahead, V(gap), and matches the speed of the car
     ahead, but reacts to what happened a moment ago (the response time), with a small random wobble.
     acceleration = 1.2 × (V(gap seen) − my speed) + 0.4 × (speed of car ahead seen − my speed) + wobble, kept between −6 and +2 m/s².
     V(gap) = 11.1 m/s × (tanh((gap − hc)/5) + tanh(hc/5)) / (1 + tanh(hc/5)), with hc chosen so 6.45 m of gap gives 30 km/h.
   On the 230 m circle with 22 cars (4 m long) every gap starts at 6.45 m and every car at 30 km/h, as in the 2008 test.
   Tuned so that, with a 0.5 s response time: 20 or fewer cars stay smooth; 22 jam in about a minute and a quarter;
   0.2 s responses stay smooth; 0.8 s responses jam sooner; and one steady driver from the start keeps the circle smooth.
   The steady driver holds 30 km/h and only slows if its gap falls under 2.5 m. These are a simplified model's numbers, not
   measurements; the teacher notes say so. Times on screen are model seconds, run at 3× speed. */
(function(){
'use strict';
const {W,FONT,C,ctx,S,$,clamp,lerp,ease,ph,lin,mph,f1,rr,T,pill,rich,seg,arrow,tile,mul,dot,gauge,count}=Story;
const H=600,DT=0.05,LEN=4,RL=230,V0=8.33,SPEED=3;
const GOLD='#e0a400',JAM='rgba(193,20,48,.22)';

/* ---------- the driver model ---------- */
const VM=11.1,VW=5;const HC=(function(){let lo=-10,hi=6.4;const f=hc=>VM*(Math.tanh((6.4545-hc)/VW)+Math.tanh(hc/VW))/(1+Math.tanh(hc/VW));for(let i=0;i<80;i++){const m=(lo+hi)/2;if(f(m)>V0)lo=m;else hi=m;}return(lo+hi)/2;})();
const VOPT=h=>h<=0?0:Math.max(0,VM*(Math.tanh((h-HC)/VW)+Math.tanh(HC/VW))/(1+Math.tanh(HC/VW)));
function rng(seed){let s=seed|0;return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
/* a circle of cars; car i follows car i+1. Car 0 is the gold car. */
function Ring(o){o=o||{};const N=o.N||22,tau=o.tau==null?.5:o.tau,L=o.L||RL;const r={N,L,tau,steady:!!o.steady,t:0,x:[],v:[],a:[],xu:[],H:[],rnd:rng(o.seed||7),stops:new Array(N).fill(0),wasStopped:new Array(N).fill(false),trail:[],jamAt:-1,hard:0,col:[]};
  const g0=L/N-LEN,ve=VOPT(g0);for(let i=0;i<N;i++){r.x.push(i*L/N);r.v.push(ve);r.a.push(0);r.xu.push(i*L/N);}
  const pal=['#9aa3ad','#2f4f7a','#8a2b2b','#dcdcd6','#3d6b4f','#6a6a72','#b8b0a0','#1d1f24','#7a8a9a','#5b6f8f','#a39079','#c9ccd1'];for(let i=0;i<N;i++)r.col.push(pal[(i*7+3)%pal.length]);
  return r;}
function gapR(r,X,i){let g=X[(i+1)%r.N]-X[i]-LEN;while(g<0)g+=r.L;if(g>r.L-LEN)g-=r.L;return g;}
function stepR(r){const N=r.N,lag=Math.round(r.tau/DT);r.H.push([r.x.slice(),r.v.slice()]);if(r.H.length>lag+1)r.H.shift();const od=r.H[0];
  for(let i=0;i<N;i++){const j=(i+1)%N;let ac;
    if(r.steady&&i===0){const g=gapR(r,r.x,0),vs=g<2.5?Math.max(0,r.v[j]-(2.5-g)*.8):V0;ac=clamp(.5*(vs-r.v[0]),-4,.4);}
    else{ac=1.2*(VOPT(gapR(r,od[0],i))-r.v[i])+.4*(od[1][j]-od[1][i])+(r.rnd()-.5)*.15;ac=clamp(ac,-6,2);}
    r.a[i]=ac;if(ac<-2.5&&i)r.hard+=DT;}
  for(let i=0;i<N;i++){r.v[i]=Math.max(0,r.v[i]+r.a[i]*DT);r.x[i]=(r.x[i]+r.v[i]*DT)%r.L;r.xu[i]+=r.v[i]*DT;}
  for(let i=0;i<N;i++){if(gapR(r,r.x,i)<.5){const j=(i+1)%N;const nx=(r.x[j]-LEN-.5+r.L)%r.L;r.xu[i]-=((r.x[i]-nx+r.L)%r.L);r.x[i]=nx;r.v[i]=Math.min(r.v[i],r.v[j]);}}
  for(let i=0;i<N;i++){const st=r.v[i]<.5;if(st&&!r.wasStopped[i])r.stops[i]++;r.wasStopped[i]=st;}
  if(r.jamAt<0&&Math.min(...r.v)<.5)r.jamAt=r.t;
  r.t+=DT;if(Math.round(r.t/DT)%5===0){r.trail.push({t:r.t,x:r.x.slice(),v:r.v.slice()});if(r.trail.length>300)r.trail.shift();}}
function runR(r,dt){r.acc=(r.acc||0)+dt*SPEED;let n=0;while(r.acc>=DT&&n<40){stepR(r);r.acc-=DT;n++;}}
function presim(r,secs){while(r.t<secs)stepR(r);}

/* a straight line of cars for the brake-tap demo: car 0 leads; stretch 2 = a driver who wants twice the gap at every speed */
function Line(o){const M=12,str=o.stretch||1,l={M,str,t:-1,x:[],v:[],H:[],min:[],tap:o.tap||0};const Vs=h=>VOPT(h/str);
  let lo=0,hi=80;for(let i=0;i<80;i++){const m=(lo+hi)/2;if(Vs(m)>V0)hi=m;else lo=m;}l.g0=(lo+hi)/2;
  for(let i=0;i<=M;i++){l.x.push(-i*(l.g0+LEN));l.v.push(V0);l.min.push(V0);}l.Vs=Vs;return l;}
function stepL(l){const lag=Math.round(.5/DT),t=l.t;l.H.push([l.x.slice(),l.v.slice()]);if(l.H.length>lag+1)l.H.shift();const o=l.H[0],a=[];
  a.push(t>.4&&t<1.6?-1.5:(t>=1.6&&l.v[0]<V0?.8:0));
  for(let i=1;i<=l.M;i++)a.push(clamp(1.2*(l.Vs(o[0][i-1]-o[0][i]-LEN)-l.v[i])+.4*(o[1][i-1]-o[1][i]),-6,2));
  for(let i=0;i<=l.M;i++){l.v[i]=clamp(l.v[i]+a[i]*DT,0,i?99:V0);l.x[i]+=l.v[i]*DT;l.min[i]=Math.min(l.min[i],l.v[i]);}
  l.a=a;l.t+=DT;}

/* ---------- drawing ---------- */
function shade(hex,k){const n=parseInt(hex.slice(1),16),f=v=>Math.round(k>0?v+(255-v)*k:v*(1+k));return 'rgb('+f(n>>16)+','+f(n>>8&255)+','+f(n&255)+')';}
/* a car seen from above, front at (0,0) pointing +x before rotation; k = pixels per meter */
function carTop(x,y,ang,col,k,o){o=o||{};const L=4*k,Wd=1.8*k;ctx.save();ctx.translate(x,y);ctx.rotate(ang);if(o.alpha!=null)ctx.globalAlpha*=o.alpha;
  ctx.fillStyle='rgba(0,0,0,.22)';rr(-L+1,-Wd/2+1.5,L,Wd,Wd*.28);ctx.fill();
  const g=ctx.createLinearGradient(0,-Wd/2,0,Wd/2);g.addColorStop(0,shade(col,.25));g.addColorStop(.5,col);g.addColorStop(1,shade(col,-.3));ctx.fillStyle=g;rr(-L,-Wd/2,L,Wd,Wd*.28);ctx.fill();
  ctx.fillStyle='#2b3540';rr(-L*.36,-Wd/2+Wd*.1,L*.13,Wd*.8,2);ctx.fill();rr(-L*.86,-Wd/2+Wd*.12,L*.1,Wd*.76,2);ctx.fill();ctx.fillStyle=shade(col,.12);rr(-L*.73,-Wd/2+Wd*.14,L*.37,Wd*.72,2);ctx.fill();
  ctx.fillStyle='#f4f0d8';ctx.fillRect(-k*.18,-Wd/2+Wd*.08,k*.14,Wd*.2);ctx.fillRect(-k*.18,Wd/2-Wd*.28,k*.14,Wd*.2);
  ctx.fillStyle=o.brake?'#ff2a1a':'#7c1d1d';ctx.fillRect(-L,-Wd/2+Wd*.08,k*.16,Wd*.22);ctx.fillRect(-L,Wd/2-Wd*.3,k*.16,Wd*.22);
  if(o.gold){ctx.strokeStyle=GOLD;ctx.lineWidth=Math.max(2,k*.35);rr(-L-k*.35,-Wd/2-k*.35,L+k*.7,Wd+k*.7,Wd*.4);ctx.stroke();}
  if(o.ai){ctx.strokeStyle=C.teal;ctx.lineWidth=Math.max(2,k*.4);ctx.setLineDash([k*.8,k*.5]);rr(-L-k*.4,-Wd/2-k*.4,L+k*.8,Wd+k*.8,Wd*.4);ctx.stroke();ctx.setLineDash([]);}
  ctx.restore();
  if(o.brake){ctx.save();ctx.translate(x,y);ctx.rotate(ang);const gg=ctx.createRadialGradient(-L,0,0,-L,0,k*2.4);gg.addColorStop(0,'rgba(255,50,30,.55)');gg.addColorStop(1,'rgba(255,50,30,0)');ctx.fillStyle=gg;ctx.fillRect(-L-k*2.4,-k*2.4,k*4.8,k*4.8);ctx.restore();}
  if(o.puff){ctx.save();ctx.translate(x,y);ctx.rotate(ang);for(let p=0;p<3;p++){ctx.fillStyle='rgba(120,120,125,'+(.28-p*.08)+')';ctx.beginPath();ctx.arc(-L-k*(.8+p*.9),k*.5,k*(.45+p*.25),0,7);ctx.fill();}ctx.restore();}}
const FIELD=mul(5),GRASS=[];for(let i=0;i<160;i++)GRASS.push([FIELD(),FIELD(),FIELD()]);
/* the test circle seen from above. cx,cy center; k px per meter */
function ringScene(r,cx,cy,k,o){o=o||{};const Rm=r.L/(2*Math.PI),R=Rm*k,lw=4.2*k;
  if(!o.noBg){ctx.save();ctx.beginPath();ctx.rect(o.x0||0,o.y0||0,o.w||760,o.h||H);ctx.clip();ctx.fillStyle='#8fae6b';ctx.fillRect(o.x0||0,o.y0||0,o.w||760,o.h||H);
    for(const g of GRASS){ctx.fillStyle='rgba(60,90,40,'+(g[2]*.18)+')';ctx.fillRect((o.x0||0)+g[0]*(o.w||760),(o.y0||0)+g[1]*(o.h||H),3,3);}ctx.restore();}
  ctx.save();ctx.strokeStyle='#5a5d62';ctx.lineWidth=lw+4;ctx.beginPath();ctx.arc(cx,cy,R,0,7);ctx.stroke();ctx.strokeStyle='#4b4e53';ctx.lineWidth=lw;ctx.beginPath();ctx.arc(cx,cy,R,0,7);ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=1.5;for(const d of[-lw/2+2,lw/2-2]){ctx.beginPath();ctx.arc(cx,cy,R+d,0,7);ctx.stroke();}ctx.restore();
  /* cones on the inner edge */
  for(let q=0;q<16;q++){const a=q/16*Math.PI*2,px=cx+(R-lw/2-k*1.2)*Math.cos(a),py=cy+(R-lw/2-k*1.2)*Math.sin(a);ctx.fillStyle='#f07d1a';ctx.beginPath();ctx.arc(px,py,Math.max(2,k*.35),0,7);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(px,py,Math.max(1,k*.15),0,7);ctx.fill();}
  /* the jam, highlighted: road where cars are crawling turns red */
  if(!o.noJam){ctx.save();ctx.strokeStyle=JAM;ctx.lineWidth=lw+8;ctx.lineCap='butt';for(let i=0;i<r.N;i++){if(r.v[i]<2.2){const a0=-(r.x[i]-LEN-1)/Rm,a1=-(r.x[i]+1)/Rm;ctx.beginPath();ctx.arc(cx,cy,R,a1,a0);ctx.stroke();}}ctx.restore();}
  const X=o.snap?o.snap.x:r.x,Vv=o.snap?o.snap.v:r.v;
  for(let i=0;i<r.N;i++){const a=-X[i]/Rm,px=cx+R*Math.cos(a),py=cy+R*Math.sin(a),head=a-Math.PI/2;
    carTop(px,py,head,i===0&&o.gold?'#f2c94c':r.col[i],k,{brake:!o.snap&&r.a[i]<-1.2,gold:i===0&&o.gold,ai:i===0&&o.ai,puff:o.puffs&&!o.snap&&r.a[i]>1.2&&Vv[i]<6});}
  if(o.label)pill(o.label,cx,cy,{bg:'rgba(255,255,255,.92)',s:15});}
function clock(t,x,y){const m=Math.floor(t/60),s=Math.floor(t%60);pill('⏱ '+m+':'+String(s).padStart(2,'0'),x,y,{bg:'#15171c',c:'#fff',s:15});}
function jammed(r){return Math.min(...r.v)<.5;}

/* speed bars, one per car, in order around the circle starting at the gold car */
function speedBars(r,x,y,w,h,title,gold){T(title,x,y-h-40,{s:18,w:700});const n=r.N,bw=w/n;
  for(const m of[0,10,20,30]){const yy=y-m/30*h;seg(x,yy,x+w,yy,C.grid,1);T(m+'',x-8,yy+5,{s:13,c:C.mute,a:'right'});}
  T('mph',x-8,y-h-16,{s:13,c:C.mute,a:'right'});
  const ord=[...Array(n).keys()].map(i=>[i,(r.x[i]-r.x[0]+r.L)%r.L]).sort((a,b)=>a[1]-b[1]);
  ord.forEach(([i],k2)=>{const sp=mph(r.v[i]),hh=clamp(sp/30,0,1.15)*h;ctx.fillStyle=r.v[i]<2.2?C.red:(i===0&&gold?GOLD:'#7d8a99');ctx.fillRect(x+k2*bw+1.5,y-hh,bw-3,hh);});
  seg(x,y,x+w,y,C.ink,1.5);T('one bar per car, in order around the circle →',x,y+20,{s:13,c:C.mute});T('red: crawling or stopped',x,y+38,{s:13,c:C.red,w:600});}

/* ---------- step 1: what stopped you? ---------- */
const PICKS=[['crash','A crash ahead'],['lane','A lane closing'],['truck','A slow truck'],['none','Nothing at all']];
const CARD=(i)=>({x:800+(i%2)*200,y:150+Math.floor(i/2)*200,w:184,h:184});
function cardArt(id,x,y,w,h){ctx.save();ctx.beginPath();rr(x+8,y+8,w-16,h-56,8);ctx.clip();ctx.fillStyle='#4b4e53';ctx.fillRect(x,y,w,h);
  ctx.strokeStyle='rgba(255,255,255,.7)';ctx.setLineDash([10,9]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+w/2,y);ctx.lineTo(x+w/2,y+h);ctx.stroke();ctx.setLineDash([]);
  const cxx=x+w/2,k=6;
  if(id==='crash'){carTop(cxx-14,y+60,Math.PI/2+.5,'#8a2b2b',k);carTop(cxx+18,y+76,Math.PI/2-.3,'#9aa3ad',k);ctx.fillStyle='#ffcc00';ctx.beginPath();ctx.moveTo(cxx,y+92);ctx.lineTo(cxx-12,y+112);ctx.lineTo(cxx+12,y+112);ctx.closePath();ctx.fill();T('!',cxx,y+109,{s:13,w:800,a:'center'});}
  if(id==='lane'){for(let q=0;q<5;q++){const px=cxx+30-q*12,py=y+30+q*20;ctx.fillStyle='#f07d1a';ctx.beginPath();ctx.moveTo(px,py-8);ctx.lineTo(px-6,py+7);ctx.lineTo(px+6,py+7);ctx.closePath();ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(px-3,py-1,6,3);}carTop(cxx-24,y+118,-Math.PI/2,'#2f4f7a',k);}
  if(id==='truck'){ctx.save();ctx.translate(cxx-22,y+20);ctx.fillStyle='#dcdcd6';rr(-11,0,22,74,3);ctx.fill();ctx.fillStyle='#3d6b4f';rr(-11,76,22,18,4);ctx.fill();ctx.restore();carTop(cxx-22,y+120,-Math.PI/2,'#6a6a72',k);}
  if(id==='none'){carTop(cxx-24,y+46,-Math.PI/2,'#9aa3ad',k,{brake:true});carTop(cxx-24,y+82,-Math.PI/2,'#8a2b2b',k,{brake:true});carTop(cxx-24,y+118,-Math.PI/2,'#2f4f7a',k,{brake:true});carTop(cxx+24,y+64,-Math.PI/2,'#3d6b4f',k,{brake:true});carTop(cxx+24,y+100,-Math.PI/2,'#dcdcd6',k,{brake:true});}
  ctx.restore();}
function highway(bt){ctx.fillStyle='#8fae6b';ctx.fillRect(0,0,760,H);const x0=150,w=460;ctx.fillStyle='#4b4e53';ctx.fillRect(x0,0,w,H);ctx.fillStyle='#cfccc4';ctx.fillRect(x0-10,0,10,H);ctx.fillRect(x0+w,0,10,H);
  ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=2;ctx.setLineDash([22,26]);for(let q=1;q<4;q++){ctx.beginPath();ctx.moveTo(x0+q*w/4,0);ctx.lineTo(x0+q*w/4,H);ctx.stroke();}ctx.setLineDash([]);
  const R2=mul(3);for(let ln=0;ln<4;ln++){for(let q=0;q<9;q++){const y=30+q*66+R2()*14,col=['#9aa3ad','#2f4f7a','#8a2b2b','#dcdcd6','#3d6b4f','#6a6a72','#b8b0a0','#1d1f24'][Math.floor(R2()*8)];carTop(x0+w/8+ln*w/4,y,-Math.PI/2,col,9,{brake:true,gold:ln===1&&q===7});}}
  const fade=ctx.createLinearGradient(0,0,0,170);fade.addColorStop(0,'rgba(236,233,226,.95)');fade.addColorStop(1,'rgba(236,233,226,0)');ctx.fillStyle=fade;ctx.fillRect(0,0,760,170);
  pill('you',x0+w/8+w/4+48,30+7*66+8,{bg:GOLD,c:'#1c1c1f',s:14});pill('as far as you can see: brake lights',380,40,{bg:'rgba(255,255,255,.92)',s:14});}

/* ---------- steps 3 and 4: one tap on the brakes ---------- */
function lineScene(l,y0,k,o){o=o||{};const xFront=1140;const lead=l.x[0];
  ctx.fillStyle='#4b4e53';ctx.fillRect(0,y0-22,W,44);ctx.fillStyle='#cfccc4';ctx.fillRect(0,y0-26,W,4);ctx.fillRect(0,y0+22,W,4);
  ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=2;ctx.setLineDash([18,22]);ctx.lineDashOffset=-(lead*k)%40;ctx.beginPath();ctx.moveTo(0,y0-22);ctx.lineTo(W,y0-22);ctx.stroke();ctx.beginPath();ctx.moveTo(0,y0+22);ctx.lineTo(W,y0+22);ctx.stroke();ctx.setLineDash([]);ctx.lineDashOffset=0;
  for(let i=0;i<=l.M;i++){const px=xFront-(lead-l.x[i])*k;if(px<-40)continue;const br=l.a&&l.a[i]<-1;carTop(px,y0,0,i===0?'#2f4f7a':['#9aa3ad','#8a2b2b','#dcdcd6','#3d6b4f','#6a6a72','#b8b0a0','#1d1f24','#7a8a9a','#5b6f8f','#a39079','#c9ccd1','#9aa3ad'][(i-1)%12],k,{brake:br});
    if(o.bars){const drop=mph(V0-l.min[i]),hb=drop/19*o.bars,bx=px-2.2*k;ctx.fillStyle=l.min[i]<.5?C.red:'#d9822b';ctx.fillRect(bx-9,y0+44,18,hb);
      if(drop>.6)T(Math.round(mph(l.min[i]))+'',bx,y0+60+hb,{s:13,w:700,a:'center',c:l.min[i]<.5?C.red:C.ink});}}
  if(o.bars){T('orange bars: how much each driver had to slow · number: lowest speed (mph)',12,y0-36,{s:14,c:'#1c1c1f',w:600});}}

/* the why: during your response time the car ahead is already slower, so the gap shrinks by (its drop in speed) × (your time) */
function whyPanel(l,x,y){const lead=l.x[0],f=l.x[1],gap=lead-f-LEN,g0=l.g0;ctx.fillStyle='#f5f5f2';rr(x,y,560,190,12);ctx.fill();
  T('Close-up: the first driver behind',x+18,y+30,{s:17,w:700});const k=16,x1=x+520;
  ctx.fillStyle='#4b4e53';ctx.fillRect(x+12,y+70,536,40);
  const fx=x1-(gap+LEN)*k*.5;carTop(x1,y+90,0,'#2f4f7a',k*.5,{brake:l.a&&l.a[0]<-1});carTop(fx,y+90,0,'#9aa3ad',k*.5,{brake:l.a&&l.a[1]<-1});
  /* the gap now vs the gap at the start */
  const gl=fx+1,gr=x1-4.4*k*.5;ctx.fillStyle=gap<g0-.3?'rgba(193,20,48,.35)':'rgba(37,99,201,.25)';ctx.fillRect(gl,y+74,Math.max(0,gr-gl),32);
  T('gap '+f1(gap)+' m',(gl+gr)/2,y+132,{s:15,w:700,a:'center',c:gap<g0-.3?C.red:C.blue});
  seg(gr-g0*k*.5,y+118,gr-g0*k*.5,y+66,C.mute,1.5,[4,4]);T('gap at the start',gr-g0*k*.5,y+60,{s:12,c:C.mute,a:'center'});
  const reacting=l.t>.4&&l.t<.9;
  T(reacting?'You have not reacted yet: it is slowing, you are not.':(l.t<.4?'Press “Tap the brakes”.':'Now you have to slow more than it did, to win the gap back.'),x+18,y+170,{s:15,w:600,c:reacting?C.red:C.ink});}

/* ---------- step 6: where the jam goes (each car's position graph) ---------- */
const STG={x:640,y:90,w:520,h:420};
function stGraph(r,cur){const g=STG,tr=r.trail;if(tr.length<2)return;const t1=tr[tr.length-1].t,t0=Math.max(tr[0].t,t1-60);
  ctx.fillStyle='#fff';ctx.fillRect(g.x,g.y,g.w,g.h);
  for(const m of[0,50,100,150,200]){const yy=g.y+g.h-m/RL*g.h;seg(g.x,yy,g.x+g.w,yy,C.grid,1);T(m+' m',g.x-8,yy+5,{s:13,c:C.mute,a:'right'});}
  for(let s=0;s<=60;s+=10){const xx=g.x+s/60*g.w;seg(xx,g.y+g.h,xx,g.y+g.h+5,C.gray,1.5);T((s-60)+' s',xx,g.y+g.h+21,{s:13,c:C.mute,a:'center'});}
  T('time (model seconds; 0 = now)',g.x+g.w,g.y+g.h+42,{s:13,c:C.mute,a:'right'});T('Where each car is around the circle',g.x,g.y-34,{s:18,w:700});T('one line per car · red where it is crawling',g.x,g.y-12,{s:14,c:C.mute});
  const X=t=>g.x+(t-(t1-60))/60*g.w,Y=p=>g.y+g.h-p/RL*g.h;
  for(let i=r.N-1;i>=0;i--){ctx.lineCap='round';for(let q=1;q<tr.length;q++){const A=tr[q-1],B=tr[q];if(B.t<t0)continue;if(B.x[i]<A.x[i])continue;const slow=B.v[i]<2.2;
      ctx.strokeStyle=i===0?GOLD:(slow?C.red:'#9aa6b4');ctx.lineWidth=i===0?3.5:(slow?3:1.6);ctx.beginPath();ctx.moveTo(X(A.t),Y(A.x[i]));ctx.lineTo(X(B.t),Y(B.x[i]));ctx.stroke();}}
  seg(g.x,g.y+g.h,g.x+g.w,g.y+g.h,C.ink,1.5);seg(g.x,g.y+g.h,g.x,g.y,C.ink,1.5);
  if(cur!=null){const xx=X(cur);seg(xx,g.y,xx,g.y+g.h,C.ink,2,[5,4]);Story.handle(xx,g.y+g.h,!S.stDragged);}}
function snapAt(r,t){const tr=r.trail;let best=tr[tr.length-1];for(const s of tr)if(Math.abs(s.t-t)<Math.abs(best.t-t))best=s;return best;}

/* ---------- step 9: I-24, four lanes, each a 230 m loop drawn straight ---------- */
function laneScene(lanes,y0,k){const xl=10,w=RL*k,LS=24;ctx.fillStyle='#8fae6b';ctx.fillRect(0,y0-36,770,lanes.length*LS+72);ctx.fillStyle='#4b4e53';ctx.fillRect(xl-6,y0-12,w+12,lanes.length*LS+6);
  ctx.fillStyle='#e9c46a';ctx.fillRect(xl-6,y0-14,w+12,2);ctx.fillStyle='#f2f2ee';ctx.fillRect(xl-6,y0+lanes.length*LS-8,w+12,2);
  ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=1.5;ctx.setLineDash([14,18]);for(let q=1;q<lanes.length;q++){ctx.beginPath();ctx.moveTo(xl,y0-12+q*LS);ctx.lineTo(xl+w,y0-12+q*LS);ctx.stroke();}ctx.setLineDash([]);
  lanes.forEach((r,li)=>{const y=y0-3+li*LS;for(let i=0;i<r.N;i++){const px=xl+r.x[i]*k;carTop(px,y,0,r.col[i],k,{brake:r.a[i]<-1.2,ai:r.steady&&i===0,puff:r.a[i]>1.2&&r.v[i]<6});}});}
function iPanel(){const x=790;ctx.fillStyle='#fff';ctx.strokeStyle='#d8d8d3';ctx.lineWidth=1;rr(x,12,398,576,12);ctx.fill();ctx.stroke();
  T('I-24, Nashville, Tennessee',x+20,46,{s:20,w:700});T('November 14–18, 2022 · the CIRCLES team',x+20,70,{s:14,c:C.mute});
  [['⭕','2008: 22 cars on a circle, Japan'],['🌵','2016: 1 smart car among 20, Arizona'],['🛣️','2022: 100 cars on a real interstate'],['📹','about 300 cameras watch the road'],['🤖','AI cruise control in Nissan, Toyota and Cadillac SUVs'],['📏','it keeps a slightly bigger gap'],['⛽','about 15–20% less energy nearby (early estimate)'],['⚖️','hard part: hard to measure exactly from cameras']].forEach(([i,t],q)=>{const y=114+q*52;T(i,x+36,y+8,{s:24,a:'center'});
    const words=t.split(' ');let line='',yy=y+2;ctx.font='600 15px '+FONT;for(const wd of words){const tt=line?line+' '+wd:wd;if(ctx.measureText(tt).width>300){T(line,x+66,yy,{s:15,w:600});line=wd;yy+=19;}else line=tt;}T(line,x+66,yy,{s:15,w:600});});
  T('Sources: UC Berkeley News (Nov 2022); Berkeley AI Research',x+20,548,{s:12,c:C.mute});T('(Mar 2025); U. of Illinois (2017); New J. Phys. (2008).',x+20,564,{s:12,c:C.mute});}

/* ---------- the steps ---------- */
const CH=['The mystery','The circle test','One tap','Where the jam goes','Change one thing','Be the fix','Who is doing this','Tell it'];
function setRing(key,o){S[key]=Ring(o);return S[key];}
function ensureJam(key,o){let r=S[key];if(!r){r=setRing(key,o);presim(r,(o&&o.pre)||150);}return r;}
const pickFb={crash:'You picked a crash. There was none: ',lane:'You picked a lane closing. There was none: ',truck:'You picked a slow truck. There was none: ',none:'You picked nothing at all, and that is what the test found: '};

const BEATS=[
/* 1 */{ch:0,cap:'Rush hour. The highway stops dead. Five minutes later you are back up to speed, and you never pass a crash, a merge or a closed lane. <b>What stopped you? Tap a picture.</b>',
  alt:'Just go with your gut. Which of these four would make the whole highway stop?',
  need:()=>S.pick?null:'Tap one of the four pictures.',
  draw(){highway();T('What stopped you?',800,60,{s:28,w:700});T('Tap a picture.',800,92,{s:18,c:C.mute});
    PICKS.forEach(([id,lab],i)=>{const c=CARD(i),on=S.pick===id;ctx.fillStyle='#fff';ctx.strokeStyle=on?C.red:C.line;ctx.lineWidth=on?4:1.5;rr(c.x,c.y,c.w,c.h,12);ctx.fill();ctx.stroke();cardArt(id,c.x,c.y,c.w,c.h);T(lab,c.x+c.w/2,c.y+c.h-18,{s:16,w:700,a:'center'});});
    if(S.pick)T('Locked in. Press Next to test it.',800,580,{s:16,w:600,c:C.mute});},
  down(x,y){for(let i=0;i<4;i++){const c=CARD(i);if(x>c.x&&x<c.x+c.w&&y>c.y&&y<c.y+c.h){S.pick=PICKS[i][0];count('story/PhysLab/traffic/pick-'+S.pick);return true;}}},
  cursor:(x,y)=>{for(let i=0;i<4;i++){const c=CARD(i);if(x>c.x&&x<c.x+c.w&&y>c.y&&y<c.y+c.h)return 'pointer';}return 'default';}},
/* 2 */{ch:1,cap:()=>{const r=S.r1;if(!r||r.t<.01)return 'In 2008, physicists in Japan tested it: 22 drivers on a 230 m circle, all told to hold a steady 30 km/h (19 mph). No crash, no merge, nothing in the road. <b>Press Start.</b>';
    if(!jammed(r)&&r.jamAt<0)return 'Watch the bars on the right. Each one is a car’s speed. Tiny wobbles at first: nobody drives perfectly steady.';
    return (pickFb[S.pick]||'')+'<b>the jam came from the drivers themselves.</b> The same thing happened in the real test. Cars stopped, with nothing in the road.';},
  alt:'Every car starts at the same speed with the same space. Only the drivers are there. Watch whether a jam can still appear.',
  need:()=>!S.r1||S.r1.jamAt<0?(S.r1&&S.r1.t>0?'Keep watching until a car stops.':'Press Start.'):null,
  ui:()=>'<button type="button" class="btn" data-go="1">▶ Start</button><button type="button" class="btn sm" data-re="1">↻ Start over</button><span class="small">shown at 3× speed</span>',uiStatic:true,
  act(d){if(d.go)S.run1=true;if(d.re){setRing('r1',{seed:7});S.run1=true;}},enter(){if(!S.r1)setRing('r1',{seed:7});},
  draw(bt,dt){const r=S.r1;if(S.run1)runR(r,dt);ringScene(r,380,300,6.6,{gold:false});clock(r.t,380,300);if(r.t<.01)pill('22 cars, 30 km/h, 230 m around',380,334,{bg:'#fff',s:14});
    else if(r.jamAt>=0)pill('the jam',380,334,{bg:C.red,c:'#fff',s:14});
    speedBars(r,800,450,370,290,'Speed of every car');T('Asked: a steady 19 mph for everyone.',800,540,{s:15,c:C.mute});}},
/* 3 */{ch:1,cap:()=>{const s=S.r1&&S.r1.stops[0]>S.g0st;return s?'Follow the gold car. Nobody told it to stop. Yet it slows, stops, and speeds back up, again and again, while the road ahead is empty.':'Follow the gold car. Its speed is on the dial, and the line on the right is its speed over time. <b>Watch until it has to stop.</b>';},
  alt:'The gold car is just one of the 22. Its driver is doing what everyone does: keeping a comfortable gap. That alone makes it stop again and again.',
  need:()=>S.r1&&S.r1.stops[0]>S.g0st?null:'Keep watching until the gold car stops.',
  enter(){const r=ensureJam('r1',{seed:7,pre:30});S.run1=true;S.g0st=r.stops[0];},
  draw(bt,dt){const r=S.r1;runR(r,dt);ringScene(r,380,300,6.6,{gold:true});clock(r.t,380,300);
    gauge(880,170,105,r.v[0]);T('The gold car',990,90,{s:18,w:700});T(r.stops[0]+(r.stops[0]===1?' stop':' stops')+' so far',990,118,{s:16,c:C.mute});
    const g={x:800,y:520,w:370,h:180},tr=r.trail;T('its speed over the last minute',g.x,g.y-g.h-14,{s:15,w:700});for(const m of[0,10,20,30]){const yy=g.y-m/30*g.h;seg(g.x,yy,g.x+g.w,yy,C.grid,1);T(m+'',g.x-8,yy+5,{s:13,c:C.mute,a:'right'});}
    seg(g.x,g.y-19/30*g.h,g.x+g.w,g.y-19/30*g.h,C.blue,1.5,[6,5]);T('asked: 19 mph',g.x+g.w,g.y-19/30*g.h-6,{s:12,c:C.blue,a:'right'});
    if(tr.length>1){const t1=tr[tr.length-1].t;ctx.strokeStyle=GOLD;ctx.lineWidth=3;ctx.beginPath();let st=false;for(const s of tr){if(s.t<t1-60)continue;const xx=g.x+(s.t-(t1-60))/60*g.w,yy=g.y-clamp(mph(s.v[0])/30,0,1.1)*g.h;if(st)ctx.lineTo(xx,yy);else{ctx.moveTo(xx,yy);st=true;}}ctx.stroke();}
    seg(g.x,g.y,g.x+g.w,g.y,C.ink,1.5);T('a minute ago',g.x,g.y+18,{s:12,c:C.mute});T('now',g.x+g.w,g.y+18,{s:12,c:C.mute,a:'right'});}},
/* 4 */{ch:2,cap:()=>{const l=S.l1;if(!l||l.t<0)return 'Line 13 cars up on a straight road at 19 mph, with the same gaps as the circle. The front driver taps the brakes, slowing to 15 mph. <b>Tap the brakes.</b>';
    if(l.t<20)return 'Watch the orange bars: how much each driver had to slow.';
    return 'Each driver slowed <b>a little more</b> than the one ahead. The front car lost 4 mph. Twelve cars back, someone stopped. A small tap grew into a jam.';},
  alt:'The front car only slowed a bit. But each driver behind slows down a little more than the car in front of them did, so the slowdown grows as it moves back.',
  need:()=>S.l1&&S.l1.t>20?null:(S.l1&&S.l1.t>=0?'Watch until the last car has reacted.':'Press “Tap the brakes”.'),
  ui:()=>'<button type="button" class="btn" data-tap="1">🦶 Tap the brakes</button>',uiStatic:true,
  act(d){if(d.tap){S.l1=Line({stretch:1});S.l1.t=0;}},enter(){if(!S.l1)S.l1=Line({stretch:1});},
  draw(bt,dt){const l=S.l1;if(l.t>=0){l.acc=(l.acc||0)+dt*1.6;while(l.acc>=DT){stepL(l);l.acc-=DT;}}
    ctx.fillStyle='#8fae6b';ctx.fillRect(0,0,W,H);ctx.fillStyle='rgba(255,255,255,.9)';rr(10,10,W-20,120,12);ctx.fill();
    T('The front car',1100,48,{s:16,w:700,a:'right'});T('slows 19 → 15 mph',1100,72,{s:15,c:C.mute,a:'right'});T('← each driver behind reacts half a second late',30,48,{s:16,w:700});T('shown a little slower than real time',30,72,{s:14,c:C.mute});
    lineScene(l,200,7.2,{bars:300});}},
/* 5 */{ch:2,cap:()=>{const tried=S.tried||{};if(tried[1]&&tried[2])return 'A tight gap leaves no room, so every driver has to brake harder than the one ahead. A bigger gap soaks up the tap: <b>each driver slows less</b>, and it fades out.';
    return 'Why harder? While you are still reacting, the car ahead is already slower, so the gap shrinks. To win it back, you slow more than it did. <b>Tap the brakes with each gap.</b>';},
  alt:'Look at the close-up. For half a second the car ahead is slower and you are not, so you roll closer. Now you must slow down more than it did to get your space back.',
  need:()=>{const t=S.tried||{};return t[1]&&t[2]?null:'Tap the brakes with the tight gap and with the bigger gap.';},
  ui:()=>'<span><b>Gap</b></span><span class="seg" role="group" aria-label="Gap">'+[[1,'Tight (0.8 s)'],[2,'Bigger (1.5 s)']].map(a=>'<button type="button" data-gap="'+a[0]+'" aria-pressed="'+(S.gapK===a[0])+'">'+a[1]+'</button>').join('')+'</span><button type="button" class="btn" data-tap="1">🦶 Tap the brakes</button>',uiStatic:true,
  uiSync(){document.querySelectorAll('[data-gap]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.gap===S.gapK)));},
  act(d){if(d.gap){S.gapK=+d.gap;S.l2=Line({stretch:S.gapK});this.uiSync();}if(d.tap){S.l2=Line({stretch:S.gapK});S.l2.t=0;}},
  enter(){S.gapK=S.gapK||1;if(!S.l2||S.l2.str!==S.gapK)S.l2=Line({stretch:S.gapK});},
  draw(bt,dt){const l=S.l2;if(l.t>=0){l.acc=(l.acc||0)+dt*1.6;while(l.acc>=DT){stepL(l);l.acc-=DT;}if(l.t>20)(S.tried=S.tried||{})[l.str]=1;}
    ctx.fillStyle='#8fae6b';ctx.fillRect(0,0,W,H);whyPanel(l,20,14);
    ctx.fillStyle='rgba(255,255,255,.92)';rr(600,14,580,190,12);ctx.fill();T('The rule behind it',620,46,{s:17,w:700});
    rich([['gap lost',C.red,700],['  =  ',C.ink,500],['(how much it slowed)',C.ink,600],['  ×  ',C.ink,500],['(your reaction time)',C.blue,700]],620,90,17);
    T('Same idea as the blue box in “Can you stop in time?”:',620,128,{s:15,c:C.mute});T('road you cover before your foot moves.',620,150,{s:15,c:C.mute});
    T('Example: slows 4 mph (1.8 m/s) × 0.5 s ≈ 0.9 m lost.',620,184,{s:15,w:600});
    lineScene(l,300,l.str===2?4.6:7.2,{bars:220});}},
/* 6 */{ch:3,cap:()=>S.stDragged?'The cars all move forward: their lines climb. But the red stripe, where cars are stopped, <b>slides backward</b>. The jam is a wave. Cars drive into its back and out of its front.':'Each line is one car’s position graph, like in the stopping story: climbing means moving, flat means stopped. <b>Drag the dot along the bottom</b> to see the circle at that moment.',
  alt:'Think of a stadium wave. People stand up and sit down in their own seats, but the wave travels around. Here cars stop and go, and the stopped spot travels backward.',
  need:()=>S.stDragged?null:'Drag the dot along the bottom of the graph.',
  enter(){const r=ensureJam('r1',{seed:7,pre:150});if(r.t<140)presim(r,140);S.cur=null;},
  draw(bt,dt){const r=S.r1;if(S.cur==null)runR(r,dt);const tr=r.trail,t1=tr[tr.length-1].t,cur=S.cur==null?t1:S.cur;
    ringScene(r,310,300,6.2,{gold:true,snap:S.cur==null?null:snapAt(r,cur),noJam:S.cur!=null,w:620});
    if(S.cur!=null){const sn=snapAt(r,cur),Rm=RL/(2*Math.PI);ctx.save();ctx.strokeStyle='rgba(193,20,48,.35)';ctx.lineWidth=4.2*6.2+8;for(let i=0;i<r.N;i++)if(sn.v[i]<2.2){ctx.beginPath();ctx.arc(310,300,Rm*6.2,-(sn.x[i]+1)/Rm,-(sn.x[i]-LEN-1)/Rm);ctx.stroke();}ctx.restore();
      ringScene(r,310,300,6.2,{gold:true,snap:sn,noBg:true,noJam:true});pill((Math.round(cur-t1))+' s',310,300,{bg:'#15171c',c:'#fff',s:15});}else clock(r.t,310,300);
    pill('cars drive this way ↺',310,560,{bg:'rgba(255,255,255,.92)',s:13});
    stGraph(r,cur);
    if(S.stDragged){const g=STG;arrow(g.x+g.w-60,g.y+60,g.x+g.w-140,g.y+170,C.red,5);pill('the jam slides backward',g.x+g.w-150,g.y+40,{bg:C.red,c:'#fff',s:13});
      T('On real highways, waves like this move back at about 15–20 km/h (10–12 mph).',g.x-6,g.y+g.h+66,{s:14,w:600});}},
  down(x,y){const g=STG;if(x>g.x-20&&x<g.x+g.w+20&&y>g.y&&y<g.y+g.h+30){this.move(x,y);return true;}},
  move(x){const g=STG,tr=S.r1.trail,t1=tr[tr.length-1].t;S.cur=t1-60+clamp((x-g.x)/g.w,0,1)*60;if(Math.abs(S.cur-t1)<55)S.stDragged=true;},
  cursor:(x,y)=>{const g=STG;return x>g.x-20&&x<g.x+g.w+20&&y>g.y&&y<g.y+g.h+30?'ew-resize':'default';},
  ui:()=>'<button type="button" class="btn sm" data-live="1">▶ Back to live</button>',act(d){if(d.live)S.cur=null;}},
/* 7 */{ch:4,cap:()=>{const r=S.r6,res=r&&r.done?(r.jamAt>=0?'jam':'smooth'):null,seen=S.seen6||{};
    if(seen.jam&&seen.smooth)return 'Two things decide it: <b>how crowded</b> the road is and <b>how quickly</b> drivers respond. Crowded and slow to react: the wobbles grow. Room to spare or quick reactions: they fade.';
    if(res)return res==='jam'?'A jam. <b>Now find settings with no jam.</b> Try fewer cars, or quicker reactions.':'Smooth: no one had to stop. <b>Now find settings that jam.</b>';
    return 'Your circle now. <b>Pick the number of cars and how quickly drivers respond, then press Run.</b> Each run lasts two model minutes, unless it jams first.';},
  alt:'More cars means smaller gaps. Slower reactions mean more road is lost before anyone responds. Try changing just one at a time.',
  need:()=>{const s=S.seen6||{};return s.jam&&s.smooth?null:(s.jam?'Find settings with no jam.':(s.smooth?'Find settings that jam.':'Pick settings and press Run.'));},
  ui:()=>'<label>Cars on the circle <input type="range" id="n6" min="14" max="26" step="1" value="'+S.n6+'"><output id="n6o"></output></label><span><b>Drivers respond in</b></span><span class="seg" role="group" aria-label="Response time">'+[[.2,'0.2 s · alert'],[.5,'0.5 s · typical'],[.8,'0.8 s · distracted']].map(a=>'<button type="button" data-tau="'+a[0]+'" aria-pressed="'+(S.tau6===a[0])+'">'+a[1]+'</button>').join('')+'</span><button type="button" class="btn" data-run="1">▶ Run</button>',uiStatic:true,
  uiSync(){const o=$('n6o');if(o)o.textContent=S.n6+' cars · gap '+f1(RL/S.n6-LEN)+' m';document.querySelectorAll('[data-tau]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.tau===S.tau6)));},
  input(t){if(t.id==='n6'){S.n6=+t.value;this.uiSync();}},act(d){if(d.tau){S.tau6=+d.tau;this.uiSync();}if(d.run){S.r6=Ring({N:S.n6,tau:S.tau6,seed:7});S.r6.fast=true;}},
  enter(){S.n6=S.n6||22;S.tau6=S.tau6||.5;},
  draw(bt,dt){const r=S.r6;if(r&&r.done)runR(r,dt);if(r&&!r.done){r.acc=(r.acc||0)+dt*10;let n=0;while(r.acc>=DT&&n<80&&r.t<120&&r.jamAt<0){stepR(r);r.acc-=DT;n++;}
      if(r.t>=120||r.jamAt>=0){r.done=true;const k2=r.N+'|'+r.tau;const res=r.jamAt>=0?'jam':'smooth';(S.seen6=S.seen6||{})[res]=1;S.runs=(S.runs||[]).filter(q=>q.k!==k2);S.runs.unshift({k:k2,N:r.N,tau:r.tau,res});S.runs=S.runs.slice(0,7);count('story/PhysLab/traffic/run-'+r.N+'-'+r.tau+'-'+res);}}
    if(r){ringScene(r,380,300,6.6,{});clock(r.t,380,300);if(r.done)pill(r.jamAt>=0?'jam':'smooth: no stops',380,334,{bg:r.jamAt>=0?C.red:C.good,c:'#fff',s:15});else if(r.jamAt>=0)pill('jam',380,334,{bg:C.red,c:'#fff',s:15});}
    else{ringScene(Ring({N:S.n6,tau:S.tau6}),380,300,6.6,{});pill('press Run',380,300,{bg:'#fff',s:15});}
    T('Your runs',800,60,{s:20,w:700});T('cars',800,92,{s:14,c:C.mute,w:600});T('respond in',880,92,{s:14,c:C.mute,w:600});T('result',1010,92,{s:14,c:C.mute,w:600});
    (S.runs||[]).forEach((q,i)=>{const y=126+i*44;ctx.fillStyle=i%2?'#fff':'#f5f5f2';ctx.fillRect(790,y-26,390,40);T(String(q.N),800,y,{s:18,w:700});T(q.tau+' s',880,y,{s:18,w:700});pill(q.res==='jam'?'jam':'smooth',1010,y-6,{bg:q.res==='jam'?C.red:C.good,c:'#fff',s:14,a:'left'});});
    if(!(S.runs||[]).length)T('Nothing yet.',800,126,{s:16,c:C.mute});}},
/* 8 */{ch:5,cap:()=>{const a=S.rL,b=S.rR;if(!a||a.t<.01)return 'Two circles, the same 22 drivers, the same start. On the right, the gold driver holds a steady 19 mph and lets the gap ahead stretch and shrink, instead of braking for every wobble. <b>Press Start.</b>';
    if(a.t<100)return 'Watch the brake lights on each circle.';
    return S.steadyR?'One car out of 22. On the left the jam came back; on the right <b>no one had to stop</b>, and the brake lights stayed dark. <b>Switch the gold car back</b> to see it jam.':'Without the steady driver, the right circle jams too. <b>Switch the steady driver back on.</b>';},
  alt:'The steady driver is not faster or slower. It just does not copy every little brake tap from the car ahead. Its gap works like a cushion, so the wobble stops there.',
  need:()=>{if(!S.rL||S.rL.t<100)return S.go8?'Keep watching both circles.':'Press Start and watch.';return S.didOff&&S.steadyR?null:(S.steadyR?'Switch the gold car to “drives like everyone”.':'Switch the steady driver back on.');},
  ui:()=>'<button type="button" class="btn" data-go8="1">▶ Start</button><span><b>Gold car on the right</b></span><span class="seg" role="group" aria-label="Gold car">'+[[1,'Steady, leaves room'],[0,'Drives like everyone']].map(a=>'<button type="button" data-st="'+a[0]+'" aria-pressed="'+(+S.steadyR===a[0])+'">'+a[1]+'</button>').join('')+'</span>',uiStatic:true,
  uiSync(){document.querySelectorAll('[data-st]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.st===+S.steadyR)));},
  act(d){if(d.go8){S.rL=Ring({seed:7});S.rR=Ring({seed:7,steady:S.steadyR});S.go8=true;}if(d.st!=null){S.steadyR=d.st==='1';if(!S.steadyR&&S.rL&&S.rL.t>=100)S.didOff=true;S.rL=Ring({seed:7});S.rR=Ring({seed:7,steady:S.steadyR});S.go8=true;this.uiSync();}},
  enter(){if(S.steadyR==null)S.steadyR=true;if(!S.rL){S.rL=Ring({seed:7});S.rR=Ring({seed:7,steady:S.steadyR});}},
  draw(bt,dt){const a=S.rL,b=S.rR;if(S.go8){runR(a,dt);runR(b,dt);}ctx.fillStyle='#8fae6b';ctx.fillRect(0,0,W,H);
    ringScene(a,300,316,4.9,{noBg:true,puffs:true});ringScene(b,900,316,4.9,{noBg:true,gold:true,puffs:true});seg(600,30,600,H-20,'rgba(255,255,255,.6)',2);
    pill('Everyone drives the same',300,40,{bg:'#fff',s:16});pill(S.steadyR?'One steady driver (gold)':'Gold car drives like everyone',900,40,{bg:S.steadyR?GOLD:'#fff',s:16});
    clock(a.t,300,316);clock(b.t,900,316);if(a.jamAt>=0)pill('jam',300,350,{bg:C.red,c:'#fff',s:14});
    if(b.jamAt>=0)pill('jam',900,350,{bg:C.red,c:'#fff',s:14});else if(b.t>60)pill('no stops',900,350,{bg:C.good,c:'#fff',s:14});
    T('red glow = brake lights · gray puffs = hard speeding up (wasted fuel)',600,588,{s:14,c:'#1c1c1f',w:600,a:'center'});}},
/* 9 */{ch:6,cap:()=>{const s=S.seen9||{};if(s.on&&s.off)return 'With the smart cars on, each wave shrinks a little every time it passes one. Fewer brake lights, less gas burned. The team saw about 15–20% less energy used around their cars (an early estimate).';
    return 'Nashville, 2022. Researchers put AI cruise control in 100 cars on a busy interstate during the morning rush. It keeps a steady pace and a slightly bigger gap. <b>Turn the smart cars on and off.</b>';},
  alt:'The smart cars do what the gold car did on the circle: they do not copy every brake tap from the car ahead. Each one takes a bite out of the wave.',
  need:()=>{const s=S.seen9||{};return s.on&&s.off?null:(s.on?'Now turn the smart cars off.':'Turn the smart cars on.');},
  ui:()=>'<span><b>Smart cruise control</b></span><span class="seg" role="group" aria-label="Smart cars">'+[[0,'Off'],[1,'On: one car in each lane']].map(a=>'<button type="button" data-ai="'+a[0]+'" aria-pressed="'+(+!!S.ai9===a[0])+'">'+a[1]+'</button>').join('')+'</span>'+
    '<span class="small" style="display:block;margin-top:8px;flex-basis:100%"><b>Go deeper:</b> <a href="https://news.berkeley.edu/2022/11/22/massive-traffic-experiment-pits-machine-learning-against-phantom-jams/" target="_blank" rel="noopener">The 100-car experiment ↗</a> · <a href="https://bair.berkeley.edu/blog/2025/03/25/rl-av-smoothing/" target="_blank" rel="noopener">How the AI learned to drive smoothly ↗</a> · <a href="https://cee.illinois.edu/news/experiments-show-few-self-driving-cars-can-dramatically-improve-traffic-flow" target="_blank" rel="noopener">The 2016 test in Arizona ↗</a></span>',uiStatic:true,
  uiSync(){document.querySelectorAll('[data-ai]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.ai===+!!S.ai9)));},
  act(d){if(d.ai!=null){S.ai9=d.ai==='1';S.lanes=[0,1,2,3].map(q=>{const r=Ring({seed:11+q*7,steady:S.ai9});return r;});S.t9=0;this.uiSync();}},
  enter(){S.ai9=!!S.ai9;if(!S.lanes)S.lanes=[0,1,2,3].map(q=>Ring({seed:11+q*7,steady:S.ai9}));S.t9=0;},
  draw(bt,dt){const L=S.lanes;L.forEach(r=>runR(r,dt));S.t9+=dt;if(L[0].t>100)(S.seen9=S.seen9||{})[S.ai9?'on':'off']=1;
    ctx.fillStyle='#e9e6df';ctx.fillRect(0,0,780,H);T('One stretch of I-24 at rush hour, seen from above (each lane loops around)',14,30,{s:15,w:700});
    laneScene(L,110,3.3);
    const jamLanes=L.filter(r=>Math.min(...r.v)<1).length,lit=L.reduce((p,r)=>p+r.a.filter(q=>q<-1.2).length,0);
    pill(S.ai9?'smart cars on (dashed teal outline)':'smart cars off',390,262,{bg:S.ai9?C.teal:'#555',c:'#fff',s:14});
    /* close-up: the gap of one car in lane 2, smart or not */
    const r=L[1],g={x:20,y:300,w:740,h:260};ctx.fillStyle='#fff';rr(g.x,g.y,g.w,g.h,12);ctx.fill();T(S.ai9?'Close-up: a smart car and the car ahead':'Close-up: a car and the car ahead',g.x+18,g.y+30,{s:17,w:700});
    const gp=gapR(r,r.x,0),k2=9,fx=g.x+300;ctx.fillStyle='#4b4e53';ctx.fillRect(g.x+14,g.y+60,g.w-28,44);carTop(fx,g.y+82,0,r.col[0],k2,{ai:S.ai9,brake:r.a[0]<-1.2});const lx=fx+(gp+LEN)*k2;carTop(Math.min(g.x+g.w-20,lx),g.y+82,0,r.col[1],k2,{brake:r.a[1]<-1.2});
    ctx.fillStyle='rgba(15,122,114,.22)';ctx.fillRect(fx+2,g.y+64,Math.max(0,Math.min(g.x+g.w-20-4.4*k2,lx-4.4*k2)-fx-2),36);T('the gap',fx+10,g.y+124,{s:14,w:700,c:C.teal});
    /* speed traces of the two cars */
    const sx=g.x+40,sw=g.w-70,sy=g.y+g.h-24,sh=96,tr=r.trail;T('speed over the last 30 s',sx,sy-sh-6,{s:14,w:700});
    if(tr.length>2){const t1=tr[tr.length-1].t;[[1,'#9aa6b4',2.5],[0,S.ai9?C.teal:'#2f4f7a',3.5]].forEach(([ci,cc,lw])=>{ctx.strokeStyle=cc;ctx.lineWidth=lw;ctx.beginPath();let st=false;for(const s of tr){if(s.t<t1-30)continue;const xx=sx+(s.t-(t1-30))/30*sw,yy=sy-clamp(s.v[ci]/11,0,1)*sh;if(st)ctx.lineTo(xx,yy);else{ctx.moveTo(xx,yy);st=true;}}ctx.stroke();});}
    seg(sx,sy,sx+sw,sy,C.ink,1.5);T('gray: the car ahead · '+(S.ai9?'teal: the smart car':'blue: the car behind it'),sx+sw,sy-sh-6,{s:13,c:C.mute,a:'right'});
    iPanel();}},
/* 10 */{ch:7,cap:'Tell the story back. Below: put the cards in order, answer two questions in your own words, then copy it all for Canvas. Then try <b>Test yourself</b>.',
  alt:'Start with one driver slowing a little. Then say what the driver behind does, and why, and what happens many cars back.',
  draw(){ctx.fillStyle='#f4f2ee';ctx.fillRect(0,0,W,H);T('The whole story in four pictures',40,50,{s:22,w:700});
    const P=[['1','The car ahead slows a little.'],['2','You react late. The gap shrinks.'],['3','You brake harder than it did.'],['4','The wave grows and moves back.']];
    P.forEach(([n,t],i)=>{const x=40+i*285,y=90;ctx.fillStyle='#fff';rr(x,y,265,300,12);ctx.fill();T(n,x+20,y+36,{s:26,w:800,c:C.red});T(t,x+20,y+280,{s:15,w:700});
      ctx.fillStyle='#4b4e53';ctx.fillRect(x+10,y+120,245,40);
      if(i===0){carTop(x+230,y+140,0,'#2f4f7a',8,{brake:true});carTop(x+150,y+140,0,'#9aa3ad',8);}
      if(i===1){carTop(x+230,y+140,0,'#2f4f7a',8,{brake:true});carTop(x+180,y+140,0,'#9aa3ad',8);ctx.fillStyle='rgba(193,20,48,.4)';ctx.fillRect(x+181,y+124,14,32);}
      if(i===2){carTop(x+230,y+140,0,'#2f4f7a',8);carTop(x+180,y+140,0,'#9aa3ad',8,{brake:true});carTop(x+110,y+140,0,'#8a2b2b',8,{brake:true});ctx.fillStyle='#d9822b';ctx.fillRect(x+30,y+180,18,20);ctx.fillRect(x+60,y+180,18,40);ctx.fillRect(x+90,y+180,18,64);}
      if(i===3){ctx.save();ctx.beginPath();ctx.rect(x+10,y+60,245,190);ctx.clip();for(let c=0;c<8;c++){ctx.strokeStyle=c>2&&c<6?C.red:'#9aa6b4';ctx.lineWidth=c>2&&c<6?3:2;ctx.beginPath();ctx.moveTo(x+10+c*30,y+250);ctx.lineTo(x+70+c*30,y+60);ctx.stroke();}ctx.restore();arrow(x+230,y+80,x+120,y+230,C.red,5);ctx.fillStyle='rgba(255,255,255,.85)';ctx.fillRect(x+10,y+120,245,40);T('position graph: the jam slides back',x+132,y+146,{s:13,w:700,a:'center',c:C.red});}});
    T('Fixes that work: room to spare, quicker reactions, or one steady driver who does not copy every brake tap.',40,450,{s:18,w:600});
    T('Not a fix: weaving into the gap. It squeezes someone else, and the wave starts again.',40,484,{s:16,c:C.mute});}}
];

Story.run({id:'traffic',lab:'PhysLab',H:H,off:0,chapters:CH,beats:BEATS,
  title:'Raider PhysLab · Why does traffic stop for no reason? (story version)',
  order:['The car ahead slows a little.','You react a moment late, so the gap shrinks.','You brake harder than it did, to get your space back.','Each driver behind brakes harder still, until someone stops, and the jam moves backward.'],
  words:[['reaction time',/react|respon/i],['gap',/gap|space|distance/i],['wave',/wave/i],['backward',/backward|back/i],['speed or velocity',/speed|velocit/i]],
  state:{pick:null,run1:false,r1:null,l1:null,l2:null,gapK:1,tried:{},cur:null,stDragged:false,n6:22,tau6:.5,r6:null,runs:[],seen6:{},rL:null,rR:null,steadyR:null,go8:false,didOff:false,ai9:false,lanes:null,seen9:{}},
  frozen(S,qs){if(qs.has('sim')){const t=+qs.get('sim');S.r1=Ring({seed:7});presim(S.r1,t);S.run1=true;}if(qs.has('pick'))S.pick=qs.get('pick');if(qs.has('tap')){const l=Line({stretch:+qs.get('gap')||1});l.t=0;while(l.t<+qs.get('tap'))stepL(l);S.l1=l;S.l2=l;S.gapK=l.str;}
    if(qs.has('cur')){S.r1=S.r1||Ring({seed:7});presim(S.r1,Math.max(S.r1.t,150));const tr=S.r1.trail;S.cur=tr[tr.length-1].t+ +qs.get('cur');S.stDragged=true;}
    if(qs.has('fix')){const t=+qs.get('fix');S.steadyR=true;S.rL=Ring({seed:7});S.rR=Ring({seed:7,steady:true});presim(S.rL,t);presim(S.rR,t);}
    if(qs.has('ai')){S.ai9=qs.get('ai')==='1';S.lanes=[0,1,2,3].map(q=>{const r=Ring({seed:11+q*7,steady:S.ai9});presim(r,+qs.get('ait')||120);return r;});}},
  reset(S){Object.assign(S,{pick:null,run1:false,r1:null,l1:null,l2:null,gapK:1,tried:{},cur:null,stDragged:false,r6:null,runs:[],seen6:{},rL:null,rR:null,steadyR:null,go8:false,didOff:false,ai9:false,lanes:null,seen9:{}});},
  copyLines(S){const lab={crash:'a crash ahead',lane:'a lane closing',truck:'a slow truck',none:'nothing at all'};
    return['My first guess about what stopped the highway: '+(lab[S.pick]||'(skipped)')+'. The circle test jammed with nothing in the road.',
      'Settings I tried on the circle: '+((S.runs||[]).map(q=>q.N+' cars, '+q.tau+' s → '+q.res).join('; ')||'(none)')+'.'];}});
window.__traffic={Ring,stepR,presim,Line,stepL,VOPT,jammed};
})();
