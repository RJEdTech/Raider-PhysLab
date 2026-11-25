/* Raider PhysLab story: What makes it turn? (Circular motion and gravity) */
(function(){
'use strict';
const {W,FONT,C,ctx,S,$,clamp,lerp,ease,ph,lin,mph,f1,fx1,rr,T,pill,rich,seg,arrow,tile,mul,dot,handle,count}=Story;
const H=600,CX=300,CY=304,K=5.5,R0=40,GR=9.8,MASS=1500,ICE=Math.PI/4;
const COL={v:C.blue,f:C.red,net:C.teal,sk:'#e08a00'};
const MU={dry:.8,wet:.5,ice:.1},SURF={dry:'Dry',wet:'Wet',ice:'Ice'};
/* top-down: angle th is counter-clockwise from east; the car drives counter-clockwise (always turning left) */
const P=(th,r)=>[CX+(r==null?R0:r)*K*Math.cos(th),CY-(r==null?R0:r)*K*Math.sin(th)];
const HEAD=th=>[-Math.sin(th),-Math.cos(th)];           /* screen direction of travel at angle th */
const TOC=th=>[-Math.cos(th),Math.sin(th)];             /* screen direction toward the center */

/* ---------- the scene ---------- */
const RND=mul(21),TREES=[],SPECK=[];
for(let i=0;i<70;i++){const x=RND()*600,y=RND()*600,d=Math.hypot(x-CX,y-CY)/K;if((d>8&&d<51)||(x>488&&x<552&&y>CY))continue;TREES.push([x,y,4+RND()*5]);}
for(let i=0;i<140;i++)SPECK.push([RND()*600,RND()*600,RND()*1.6+.4]);
function ground(o){o=o||{};const r=(o.r||R0)*K,surf=o.surf||'dry';ctx.save();ctx.beginPath();ctx.rect(0,0,600,H);ctx.clip();
  ctx.fillStyle='#eaf0f5';ctx.fillRect(0,0,600,H);ctx.fillStyle='#d9e3ec';for(const s of SPECK)ctx.fillRect(s[0],s[1],s[2],s[2]);
  const road=surf==='ice'?'#b9d3e3':(surf==='wet'?'#33373d':'#4a4e55');
  ctx.strokeStyle=road;ctx.lineWidth=8*K;ctx.lineCap='butt';ctx.beginPath();ctx.arc(CX,CY,r,0,7);ctx.stroke();
  if(!o.noEntry){ctx.beginPath();ctx.moveTo(CX+r,CY);ctx.lineTo(CX+r,H+10);ctx.stroke();}
  if(surf==='wet'){ctx.strokeStyle='rgba(140,180,220,.22)';ctx.lineWidth=6*K;ctx.beginPath();ctx.arc(CX,CY,r,0,7);ctx.stroke();}
  ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=1.5;for(const rr2 of[r-4*K,r+4*K]){ctx.beginPath();ctx.arc(CX,CY,rr2,0,7);ctx.stroke();}
  ctx.strokeStyle='rgba(240,200,80,.8)';ctx.setLineDash([10,12]);ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(CX,CY,r,0,7);ctx.stroke();ctx.setLineDash([]);
  if(o.ice){ctx.strokeStyle='#bfe0f2';ctx.lineWidth=8*K-3;ctx.beginPath();ctx.arc(CX,CY,r,-ICE-.62,-ICE+.06);ctx.stroke();ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=2;for(let i=0;i<5;i++){const a=-ICE-.5+i*.11;ctx.beginPath();ctx.arc(CX,CY,r-10+i*5,a,a+.07);ctx.stroke();}}
  for(const t of TREES){if(Math.abs(Math.hypot(t[0]-CX,t[1]-CY)-r)<5.5*K+t[2])continue;ctx.fillStyle='rgba(60,80,70,.18)';ctx.beginPath();ctx.arc(t[0]+3,t[1]+4,t[2],0,7);ctx.fill();ctx.fillStyle='#3f6b4a';ctx.beginPath();ctx.arc(t[0],t[1],t[2],0,7);ctx.fill();ctx.fillStyle='#5b8a64';ctx.beginPath();ctx.arc(t[0]-1,t[1]-1,t[2]*.45,0,7);ctx.fill();}
  ctx.restore();seg(600,0,600,H,C.line,1.5);
  if(!o.noScale){seg(24,H-22,24+10*K,H-22,C.ink,3);T('10 m',24+5*K,H-30,{s:12,a:'center',w:600});}}
function carTop(x,y,ang,o){o=o||{};const k=o.k||K;ctx.save();ctx.translate(x,y);ctx.rotate(ang);if(o.alpha!=null)ctx.globalAlpha*=o.alpha;ctx.scale(k,k);
  if(!o.flat){ctx.fillStyle='rgba(0,0,0,.22)';rr(-2.2,-.75,4.6,1.8,.5);ctx.fill();}
  ctx.fillStyle=o.flat||'#e9ecf1';rr(-2.3,-.9,4.6,1.8,.5);ctx.fill();if(o.flat){ctx.restore();return;}
  ctx.strokeStyle='#7f8893';ctx.lineWidth=.07;ctx.stroke();
  ctx.fillStyle='#1b2836';ctx.beginPath();ctx.moveTo(.55,-.72);ctx.lineTo(1.25,-.6);ctx.lineTo(1.25,.6);ctx.lineTo(.55,.72);ctx.closePath();ctx.fill();          /* windshield */
  ctx.beginPath();ctx.moveTo(-1.5,-.62);ctx.lineTo(-1.0,-.7);ctx.lineTo(-1.0,.7);ctx.lineTo(-1.5,.62);ctx.closePath();ctx.fill();                                    /* rear window */
  ctx.fillStyle='#d5dae2';ctx.fillRect(-1.0,-.72,1.55,1.44);
  ctx.fillStyle='#fff3c0';ctx.fillRect(2.15,-.8,.15,.35);ctx.fillRect(2.15,.45,.15,.35);ctx.fillStyle='#c62f2f';ctx.fillRect(-2.3,-.8,.12,.35);ctx.fillRect(-2.3,.45,.12,.35);
  if(o.inside){ctx.fillStyle='#8f98a5';ctx.fillRect(-.55,-.62,.7,.52);ctx.fillRect(-.55,.1,.7,.52);ctx.strokeStyle='#27323f';ctx.lineWidth=.05;ctx.beginPath();ctx.arc(.38,-.36,.17,0,7);ctx.stroke();ctx.fillStyle='#3a4552';ctx.fillRect(.55,-.7,.14,1.4);}
  ctx.restore();}
const angOf=th=>Math.atan2(HEAD(th)[1],HEAD(th)[0]);
function carAt(th,o){o=o||{};const p=P(th,o.r);carTop(p[0],p[1],angOf(th),o);return p;}
function vArrow(p,dir,v,o){o=o||{};const L=v*(o.k||4);arrow(p[0],p[1],p[0]+dir[0]*L,p[1]+dir[1]*L,COL.v,o.w||5,{alpha:o.alpha,head:o.head});}
function fArrow(p,dir,a,o){o=o||{};const L=a*(o.k||12);arrow(p[0],p[1],p[0]+dir[0]*L,p[1]+dir[1]*L,COL.f,o.w||5,{alpha:o.alpha,head:o.head});}

/* ---------- the drawn guess ---------- */
function toM(q){return[(q[0]-CX)/K,(CY-q[1])/K];}
function pathLen(){let L=0;for(let i=1;i<S.path.length;i++)L+=Math.hypot(S.path[i][0]-S.path[i-1][0],S.path[i][1]-S.path[i-1][1]);return L/K;}
function classify(){if(S.path.length<2||pathLen()<18)return null;const q=toM(S.path[S.path.length-1]),p0=[R0*Math.cos(ICE),R0*Math.sin(ICE)],Tn=[-Math.sin(ICE),Math.cos(ICE)],Rn=[Math.cos(ICE),Math.sin(ICE)];
  const s=(q[0]-p0[0])*Tn[0]+(q[1]-p0[1])*Tn[1],d=(q[0]-p0[0])*Rn[0]+(q[1]-p0[1])*Rn[1],sc=clamp(s,0,R0),dc=Math.sqrt(R0*R0-sc*sc)-R0;
  if(d>5)return'out';if(s<6)return d<-8?'curve':'out';return d>dc/2?'straight':'curve';}
function drawPath(alpha){if(S.path.length<2)return;ctx.save();ctx.globalAlpha=alpha==null?1:alpha;ctx.strokeStyle=COL.sk;ctx.lineWidth=5;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();S.path.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();ctx.restore();}
function mini(cx,cy,kind,mine){const r=44;ctx.save();ctx.fillStyle=kind==='straight'?'#e9f4ec':'#fbeceb';rr(cx-76,cy-70,152,150,12);ctx.fill();if(mine){ctx.strokeStyle=COL.sk;ctx.lineWidth=3;ctx.stroke();}
  ctx.strokeStyle='#8f98a3';ctx.lineWidth=9;ctx.beginPath();ctx.arc(cx-10,cy+30,r,-Math.PI/2+.1,0);ctx.stroke();ctx.strokeStyle='#8f98a3';ctx.setLineDash([4,5]);ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx-10,cy+30,r,Math.PI,-Math.PI/2+.1);ctx.stroke();ctx.setLineDash([]);
  const p=[cx-10+r*Math.cos(-.75),cy+30+r*Math.sin(-.75)];ctx.strokeStyle=kind==='straight'?C.good:C.red;ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();
  if(kind==='curve')ctx.arc(cx-10,cy+30,r,-.75,-2.1,true);else if(kind==='out'){ctx.moveTo(p[0],p[1]);ctx.quadraticCurveTo(p[0]+8,p[1]-30,p[0]+40,p[1]-44);}else{ctx.moveTo(p[0],p[1]);ctx.lineTo(p[0]-50,p[1]-54);}ctx.stroke();dot(p[0],p[1],5,'#fff','#444');ctx.restore();
  T(kind==='curve'?'follows the curve':(kind==='out'?'flung outward':'straight ahead'),cx,cy+68,{s:14,w:700,a:'center',c:kind==='straight'?C.good:C.red});
  T(kind==='straight'?'✓':'✗',cx+58,cy-46,{s:22,w:700,a:'center',c:kind==='straight'?C.good:C.red});if(mine)pill('you drew this',cx,cy-84,{bg:COL.sk,c:'#fff',s:13});}

/* ---------- the velocity circle ---------- */
function velCircle(cx,cy,v,th,o){o=o||{};const k=o.k||8,r=v*k;ctx.save();ctx.strokeStyle='#c9d6ee';ctx.lineWidth=2;ctx.setLineDash([5,5]);ctx.beginPath();ctx.arc(cx,cy,r,0,7);ctx.stroke();ctx.setLineDash([]);ctx.restore();
  for(let i=0;i<8;i++){const a=th-i*Math.PI/4,d=HEAD(a);if(i)arrow(cx,cy,cx+d[0]*r,cy+d[1]*r,COL.v,2.5,{alpha:.22,head:8});}
  const d=HEAD(th),tip=[cx+d[0]*r,cy+d[1]*r],c=TOC(th);arrow(cx,cy,tip[0],tip[1],COL.v,6);dot(cx,cy,5,C.ink);
  if(o.a){const L=Math.max(22,o.a*9);arrow(tip[0],tip[1],tip[0]+c[0]*L,tip[1]+c[1]*L,COL.f,5);}return tip;}

/* ---------- Newton's cannon and the Space Station ---------- */
const EX=300,EY=330,RE=6371,KE=150/RE,R1=6771,GM=398600.4,VC=Math.sqrt(GM/R1);
const ORB={};
function orbit(v){if(ORB[v])return ORB[v];let x=0,y=R1,vx=v,vy=0,t=0,ang=0,pa=Math.atan2(x,y);const dt=4,pts=[[0,x,y]];let landed=false;
  while(t<16000){const r=Math.hypot(x,y),ax=-GM*x/(r*r*r),ay=-GM*y/(r*r*r);vx+=ax*dt;vy+=ay*dt;x+=vx*dt;y+=vy*dt;t+=dt;const a=Math.atan2(x,y);let da=a-pa;if(da<-Math.PI)da+=2*Math.PI;if(da>Math.PI)da-=2*Math.PI;ang+=da;pa=a;pts.push([t,x,y]);
    if(Math.hypot(x,y)<=RE){landed=true;break;}if(ang>=2*Math.PI)break;}
  return ORB[v]={pts,landed,t,ang,ground:ang*RE};}
const ESTARS=[];for(let i=0;i<110;i++)ESTARS.push([RND()*600,RND()*600,RND()*1.3+.4,RND()*.6+.2]);
/* Earth as it looks from space (redrawn Nov 25, 2026): oceans, continents in the right places (coarse outlines, orthographic view),
   desert and ice tones, clouds, a lit side and a darker side, and a thin blue atmosphere. It turns slowly. Sizes and the station are
   not to scale (the station is drawn far larger than life). */
const LANDS=[
 [[-17,21],[-16,12],[-8,4],[5,4],[9,4],[10,-3],[13,-12],[12,-18],[15,-27],[18,-34],[25,-34],[32,-29],[35,-24],[40,-15],[41,-2],[51,12],[43,12],[39,16],[33,28],[32,31],[25,32],[20,31],[11,33],[10,37],[-2,35],[-6,36],[-10,30],[-13,27]],
 [[-9,37],[-9,43],[-2,44],[-5,48],[2,51],[5,53],[8,55],[10,57],[5,58],[5,62],[14,67],[20,70],[30,70],[40,67],[45,60],[40,50],[30,46],[28,41],[23,38],[20,40],[15,38],[12,44],[8,44],[3,42],[-2,37]],
 [[28,41],[35,36],[36,32],[43,13],[52,16],[57,23],[56,26],[50,30],[57,25],[66,25],[72,21],[77,8],[80,13],[88,22],[92,21],[98,16],[100,13],[103,1],[104,10],[109,12],[108,21],[117,23],[121,30],[122,37],[122,40],[128,35],[129,40],[135,43],[140,48],[141,52],[156,51],[163,60],[178,64],[180,69],[140,72],[113,74],[100,78],[80,73],[68,69],[60,69],[45,67],[40,67],[45,60],[40,50],[30,46]],
 [[-168,66],[-160,59],[-152,57],[-137,58],[-125,49],[-124,42],[-118,34],[-110,23],[-105,20],[-97,16],[-92,15],[-83,9],[-78,8],[-82,15],[-88,16],[-90,21],[-97,22],[-97,27],[-90,29],[-83,29],[-81,25],[-80,32],[-75,36],[-70,42],[-66,45],[-60,47],[-56,52],[-64,60],[-75,62],[-80,56],[-90,57],[-95,62],[-90,68],[-110,68],[-130,70],[-156,71]],
 [[-80,9],[-77,8],[-72,12],[-62,11],[-52,5],[-50,0],[-35,-6],[-39,-15],[-48,-26],[-58,-34],[-65,-41],[-68,-50],[-72,-54],[-75,-48],[-73,-38],[-71,-28],[-70,-18],[-76,-14],[-81,-5],[-80,1]],
 [[114,-22],[114,-34],[118,-35],[124,-33],[131,-31],[138,-35],[141,-38],[147,-38],[150,-36],[153,-28],[153,-25],[146,-19],[142,-11],[136,-12],[130,-12],[126,-14],[122,-17]],
 [[-5,50],[1,51],[0,54],[-3,58],[-6,56]],[[130,31],[135,34],[140,36],[142,40],[141,45],[140,41],[135,35]],[[44,-25],[47,-25],[50,-15],[49,-12],[44,-17]],
 [[95,5],[105,-6],[115,-8],[120,-9],[118,-4],[110,-2],[104,1]],[[131,-1],[141,-3],[150,-10],[143,-9],[136,-4]]];
const DESERT=[[[-15,16],[-8,24],[0,30],[15,31],[30,30],[33,22],[25,17],[10,15],[0,16]],[[37,18],[45,15],[54,18],[56,24],[48,29],[40,29]],[[122,-22],[135,-21],[140,-27],[132,-30],[121,-29]]];
const FOREST=[[[9,4],[18,5],[28,4],[30,-2],[28,-8],[18,-6],[12,-3]],[[-75,2],[-60,4],[-50,0],[-48,-6],[-60,-12],[-72,-10],[-76,-4]],[[96,4],[104,-2],[114,-3],[118,1],[110,4],[100,6]]];
const ICECAP=[[[-73,78],[-60,82],[-30,83],[-20,75],[-22,70],[-42,60],[-50,64],[-54,68],[-60,76]]];
const CLOUDS=[];for(let i=0;i<70;i++){const band=RND();const lat=band<.4?(RND()-.5)*16:(RND()<.5?1:-1)*(35+RND()*25);CLOUDS.push([lat,RND()*360-180,6+RND()*12,RND()*.6+.3]);}
function dens(P){const out=[];for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],n=Math.max(1,Math.ceil(Math.max(Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]))/3));for(let k=0;k<n;k++)out.push([a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n]);}return out;}
const LANDS_D=LANDS.map(dens),DESERT_D=DESERT.map(dens),FOREST_D=FOREST.map(dens),ICE_D=ICECAP.map(dens);
function proj(lon,lat,lon0,lat0,R){const d=Math.PI/180,l=lat*d,L=(lon-lon0)*d,l0=lat0*d;const cosc=Math.sin(l0)*Math.sin(l)+Math.cos(l0)*Math.cos(l)*Math.cos(L);
  let x=R*Math.cos(l)*Math.sin(L),y=R*(Math.cos(l0)*Math.sin(l)-Math.sin(l0)*Math.cos(l)*Math.cos(L));if(cosc<0){const m=Math.hypot(x,y)||1;x=x/m*R;y=y/m*R;}return [EX+x,EY-y,cosc];}
function polyOn(P,lon0,lat0,R,fill){let vis=false;const Q=P.map(p=>{const q=proj(p[0],p[1],lon0,lat0,R);if(q[2]>0)vis=true;return q;});if(!vis)return;ctx.beginPath();Q.forEach((q,i)=>ctx[i?'lineTo':'moveTo'](q[0],q[1]));ctx.closePath();ctx.fillStyle=fill;ctx.fill();}
function earth(){ctx.save();ctx.beginPath();ctx.rect(0,0,600,H);ctx.clip();ctx.fillStyle='#03050b';ctx.fillRect(0,0,600,H);for(const s of ESTARS){ctx.fillStyle='rgba(255,255,255,'+s[3]+')';ctx.fillRect(s[0],s[1],s[2],s[2]);}
  const R=150,lat0=18,lon0=-10+((Story.frozen?0:performance.now()/1000)*1.5)%360;
  // atmosphere glow
  let g=ctx.createRadialGradient(EX,EY,R-2,EX,EY,R+16);g.addColorStop(0,'rgba(110,170,255,.65)');g.addColorStop(1,'rgba(110,170,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(EX,EY,R+16,0,7);ctx.fill();
  ctx.save();ctx.beginPath();ctx.arc(EX,EY,R,0,7);ctx.clip();
  g=ctx.createRadialGradient(EX-40,EY-50,10,EX,EY,R);g.addColorStop(0,'#1d5fa8');g.addColorStop(1,'#0b2f63');ctx.fillStyle=g;ctx.fillRect(EX-R,EY-R,2*R,2*R);
  LANDS_D.forEach(P=>polyOn(P,lon0,lat0,R,'#5f7f45'));FOREST_D.forEach(P=>polyOn(P,lon0,lat0,R,'rgba(40,85,40,.85)'));DESERT_D.forEach(P=>polyOn(P,lon0,lat0,R,'rgba(196,160,104,.9)'));ICE_D.forEach(P=>polyOn(P,lon0,lat0,R,'#eef3f6'));
  // Antarctica: the ice along the bottom edge
  const ant=[];for(let lo=-180;lo<=180;lo+=6)ant.push([lo,-68]);for(let lo=180;lo>=-180;lo-=6)ant.push([lo,-90]);polyOn(ant,lon0,lat0,R,'#eef3f6');
  // clouds
  for(const c of CLOUDS){const q=proj(c[1],c[0],lon0,lat0,R);if(q[2]<=.05)continue;const s=c[2]*(.4+.6*q[2]),cg=ctx.createRadialGradient(q[0],q[1],0,q[0],q[1],s*1.6);cg.addColorStop(0,'rgba(255,255,255,'+(c[3]*.9)+')');cg.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=cg;ctx.save();ctx.translate(q[0],q[1]);ctx.scale(2.6,.55);ctx.beginPath();ctx.arc(0,0,s*1.6,0,7);ctx.fill();ctx.restore();}
  // lit side and darker side (sunlight from the upper left), plus darkening toward the edge
  g=ctx.createLinearGradient(EX-R*.9,EY-R*.9,EX+R,EY+R);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.55,'rgba(0,0,0,.05)');g.addColorStop(.8,'rgba(0,5,20,.55)');g.addColorStop(1,'rgba(0,5,20,.85)');ctx.fillStyle=g;ctx.fillRect(EX-R,EY-R,2*R,2*R);
  g=ctx.createRadialGradient(EX,EY,R*.7,EX,EY,R);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,10,30,.35)');ctx.fillStyle=g;ctx.fillRect(EX-R,EY-R,2*R,2*R);
  ctx.restore();ctx.strokeStyle='rgba(150,200,255,.55)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(EX,EY,R+.5,0,7);ctx.stroke();
  ctx.restore();seg(600,0,600,H,C.line,1.5);}
const EP=(x,y)=>[EX+x*KE,EY-y*KE];
function station(p,ang){ctx.save();ctx.translate(p[0],p[1]);ctx.rotate(ang);
  // the Space Station: a long truss, eight gold solar wings, white modules in the middle (drawn far larger than life)
  ctx.fillStyle='#b9bec5';ctx.fillRect(-20,-1.2,40,2.4);
  for(const sx of[-17,-12,12,17])for(const sy of[-1,1]){ctx.fillStyle='#b88a2e';ctx.fillRect(sx-2,sy>0?2:-11,4,9);ctx.strokeStyle='rgba(60,40,10,.6)';ctx.lineWidth=.5;ctx.strokeRect(sx-2,sy>0?2:-11,4,9);}
  ctx.fillStyle='#f2f4f6';ctx.fillRect(-2,-7,4,14);ctx.fillRect(-6,-2,12,4);ctx.fillStyle='#dfe3e8';ctx.fillRect(4,-5,3,3);ctx.fillRect(-7,2,3,3);ctx.restore();}

/* ---------- beats ---------- */
const CH=['The curve','What turns it','How much','The limit','Falling around'];
function lapStep(dt,speedUp,v,r){S.th=(S.th+dt*speedUp*v/r)%(2*Math.PI);}
function slideP(t,v,surf){const amax=MU[surf]*GR,rp=v*v/amax,c=[R0-rp,0],th=v*t/rp;return{m:[c[0]+rp*Math.cos(th),c[1]+rp*Math.sin(th)],th};}

const BEATS=[
/* 0 */{ch:0,cap:'A snowy evening on a highway ramp. You are going 10 m/s around the curve, and the pale patch ahead is bare ice: no grip at all. <b>Draw the path your car takes from the ice onward.</b>',
  alt:'Just draw what your gut says. Press on the yellow dot and drag.',nextLabel:'Lock in my path',
  need:()=>classify()?null:(S.path.length>1?'Draw a longer path: at least 20 m.':'Press on the yellow dot and draw.'),
  ui:()=>'<button type="button" class="btn sm" data-clear="1">Erase my path</button>',act(d){if(d.clear)S.path=[];},
  draw(){ground({ice:true});const p=carAt(ICE-.5);vArrow(p,HEAD(ICE-.5),10);const s=P(ICE);drawPath();dot(s[0],s[1],7,COL.sk,'#fff');
    if(S.path.length<2){const pu=(Math.sin(performance.now()/260)+1)/2;ctx.beginPath();ctx.arc(s[0],s[1],13+pu*8,0,7);ctx.strokeStyle='rgba(224,138,0,'+(.85-pu*.5)+')';ctx.lineWidth=3;ctx.stroke();}
    pill('ice starts here',s[0]+70,s[1]-4,{bg:'#fff',bd:C.line,s:13});pill('you',p[0]+34,p[1]+20,{bg:'#fff',bd:C.line,s:13});
    tile(630,30,260,112,'Your speed','10 m/s','about 22 mph');tile(910,30,260,112,'The curve','40 m','from the center to the road');
    T('The road turns left.',630,220,{s:30,w:700});T('The ice gives no grip.',630,260,{s:30,w:700});T('Where does the car go?',630,300,{s:30,w:700,c:'#b36b00'});
    T('Seen from above. Draw from the yellow dot.',630,350,{s:18,c:C.mute});T('There is no wrong way to draw it yet.',630,376,{s:18,c:C.mute});},
  down(x,y){if(x<600){S.path=[P(ICE).slice(),[x,y]];return true;}},move(x,y){if(x<598){const l=S.path[S.path.length-1];if(Math.hypot(x-l[0],y-l[1])>4)S.path.push([x,y]);}},cursor:(x)=>x<600?'crosshair':'default'},
/* 1 */{ch:0,dur:10.2,cap:()=>{const k=classify();return(k==='straight'?'You drew it going straight, and that is what happens. ':(k==='curve'?'You drew it following the curve. It cannot: turning needs a push. ':(k==='out'?'You drew it flung outward. Nothing pushes it outward either. ':'')))+'With no sideways push the car keeps the direction it had <b>at that instant</b>, at the same speed. The same rule as the cart on ice.';},
  alt:'Think of the cart on the frozen lot. With nothing pushing sideways, a moving thing keeps going the way it was already going.',
  draw(bt){ground({ice:true});const s=bt*10-4,L1=20,L2=R0*ICE;let p,ang,st;if(s<L1){p=[CX+R0*K,CY+(L1-s)*K];ang=-Math.PI/2;st='straight';}else if(s<L1+L2){const th=(s-L1)/R0;p=P(th);ang=angOf(th);st='curve';}
    else{const u=Math.min(s-L1-L2,30),h=HEAD(ICE),q=P(ICE);p=[q[0]+h[0]*u*K,q[1]+h[1]*u*K];ang=angOf(ICE);st='ice';}
    const q=P(ICE),h=HEAD(ICE);drawPath(.8);if(st==='ice'){seg(q[0],q[1],p[0],p[1],'#fff',3,[7,6]);}
    ctx.save();ctx.setLineDash([3,6]);ctx.strokeStyle='rgba(60,60,70,.5)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(q[0],q[1]);ctx.lineTo(q[0]+h[0]*300,q[1]+h[1]*300);ctx.stroke();ctx.restore();
    carTop(p[0],p[1],ang);vArrow(p,[Math.cos(ang),Math.sin(ang)],10);if(st==='curve'){const th=(s-L1)/R0;fArrow(p,TOC(th),2.5);}
    pill(st==='ice'?'on ice: no push at all':(st==='curve'?'the road pushes the tires toward the center':'straight road: no sideways push needed'),330,578,{bg:st==='ice'?'#555':(st==='curve'?COL.f:'#555'),c:'#fff',s:14});
    if(bt>9)pill('slides into the plowed snow',p[0]+10,p[1]+34,{bg:'#fff',bd:C.line,s:13});
    const k=classify();T('Three ideas people have',630,48,{s:20,w:700});mini(712,170,'curve',k==='curve');mini(900,170,'out',k==='out');mini(1088,170,'straight',k==='straight');
    const a=lin(bt,5.6,.8);T('Speed on the ice',630,340,{s:16,c:C.mute,alpha:a});T('10 m/s, steady',630,378,{s:32,w:700,alpha:a});T('Direction on the ice',630,440,{s:16,c:C.mute,alpha:a});T('the one it had when the grip ended',630,478,{s:28,w:700,alpha:a});
    T('Newton’s first law, seen from above.',630,540,{s:18,c:C.mute,alpha:a});}},
/* 2 */{ch:1,cap:'What makes a car turn? Something must push it <b>toward the center</b> of the curve. Here that is friction from the road on the tires. A center-pointing force is called <b>centripetal</b>: “center-seeking”. <b>Press “Ice, now” at two different spots.</b>',
  alt:'The blue arrow is where the car is heading. The red arrow is the road pushing it sideways, toward the middle of the circle.',
  need:()=>S.iced<2?'Press “Ice, now” twice, at different places on the circle.':null,
  ui:()=>'<button type="button" class="btn" data-ice="1">❄ Ice, now</button><span class="small">shown at twice real speed</span>',
  act(d){if(d.ice&&S.slip<0){S.slip=0;S.slipTh=S.th;S.iced++;}},enter(){S.slip=-1;},
  draw(bt,dt){ground();let p,ang;if(S.slip>=0){S.slip+=dt*2;const u=S.slip*10,h=HEAD(S.slipTh),q=P(S.slipTh);p=[q[0]+h[0]*u*K,q[1]+h[1]*u*K];ang=angOf(S.slipTh);seg(q[0],q[1],p[0],p[1],'#fff',3,[7,6]);dot(q[0],q[1],6,'#bfe0f2','#fff');
      if(u>34||p[0]<12||p[0]>588||p[1]<12||p[1]>588){S.slip=-1;S.th=S.slipTh+.9;}}
    if(S.slip<0){lapStep(dt,2,10,R0);p=P(S.th);ang=angOf(S.th);for(let i=1;i<=7;i++){const a=S.th-i*Math.PI/4,g=P(a);carAt(a,{flat:'rgba(80,90,105,.16)'});vArrow(g,HEAD(a),10,{alpha:.3,w:3,head:8});fArrow(g,TOC(a),2.5,{alpha:.3,w:3,head:8});}}
    carTop(p[0],p[1],ang);vArrow(p,[Math.cos(ang),Math.sin(ang)],10);if(S.slip<0)fArrow(p,TOC(S.th),2.5);dot(CX,CY,5,C.ink);pill('center',CX,CY+18,{bg:'#fff',bd:C.line,s:12});
    pill(S.slip>=0?'ice: the push is gone, so it goes straight':'grip: the road keeps turning it',300,24,{bg:S.slip>=0?'#555':COL.f,c:'#fff',s:14});
    T('Two arrows, always at right angles',630,48,{s:20,w:700});carTop(880,230,-Math.PI/2,{k:22});arrow(880,180,880,60,COL.v,9);pill('velocity: where it is heading',880,96,{bg:COL.v,c:'#fff',s:14,a:'left'});
    if(S.slip<0){arrow(860,230,740,230,COL.f,9);pill('the road’s push: toward the center',640,300,{bg:COL.f,c:'#fff',s:14,a:'left'});}else pill('no push',760,230,{bg:'#555',c:'#fff',s:14});
    T('The push never speeds the car up or slows it down.',630,390,{s:18,c:C.mute});T('It only swings the blue arrow around.',630,416,{s:18,c:C.mute});
    T('Ice presses so far: '+S.iced,630,480,{s:18,w:700});T('Each time, the car leaves along the blue arrow.',630,508,{s:18,c:C.mute,alpha:S.iced?1:0});}},
/* 3 */{ch:1,cap:'Why do you feel thrown outward? Watch a phone on a slick dashboard. From above, it goes straight while the car turns out from under it. <b>Now ride in the car</b>: it looks flung sideways. Nothing flung it.',
  alt:'Your body does what the phone does. It tries to go straight, and the door comes over and meets it.',
  need:()=>S.seenCar?null:'Switch to riding in the car.',
  ui:()=>'<span><b>Watch from</b></span><span class="seg">'+[['above','above'],['car','inside the car']].map(v=>'<button type="button" data-view="'+v[0]+'" aria-pressed="'+(S.view===v[0])+'">'+v[1]+'</button>').join('')+'</span><span class="small">slowed down</span>',
  act(d){if(d.view){S.view=d.view;S.pT=0;if(d.view==='car')S.seenCar=1;}},enter(){S.pT=0;},replay(){S.pT=0;},
  draw(bt,dt){S.pT+=dt*.32;const v=10,th0=.5,tmax=.86;if(S.pT>tmax+.5)S.pT=0;const t=Math.min(S.pT,tmax),th=th0+v*t/R0;
    ground();const cm=[R0*Math.cos(th),R0*Math.sin(th)],c0=[R0*Math.cos(th0),R0*Math.sin(th0)],hd0=[-Math.sin(th0),Math.cos(th0)],hd=[-Math.sin(th),Math.cos(th)];
    const ph0=[c0[0]+hd0[0]*.95,c0[1]+hd0[1]*.95],phm=[ph0[0]+hd0[0]*v*t,ph0[1]+hd0[1]*v*t];
    const pc=P(th);carTop(pc[0],pc[1],angOf(th));ctx.save();ctx.setLineDash([4,5]);const a0=P(th0),h=HEAD(th0);seg(a0[0],a0[1],a0[0]+h[0]*120,a0[1]+h[1]*120,'#b36b00',2,[4,5]);ctx.restore();pill('close-up →',pc[0]+52,pc[1],{bg:'#fff',bd:C.line,s:12});
    /* close-up, 62 px per metre, centred on the car */
    const KC=62,OX=900,OY=300,car=S.view==='car',rot=car?-(Math.atan2(hd[1],hd[0])-Math.PI/2):0;
    const map=m=>{let dx=m[0]-cm[0],dy=m[1]-cm[1];if(car){const cs=Math.cos(rot),sn=Math.sin(rot);[dx,dy]=[dx*cs-dy*sn,dx*sn+dy*cs];}return[OX+dx*KC,OY-dy*KC];};
    ctx.save();ctx.beginPath();ctx.rect(612,40,576,520);ctx.clip();ctx.fillStyle='#eaf0f5';ctx.fillRect(612,40,576,520);const cc=map([0,0]);ctx.strokeStyle='#4a4e55';ctx.lineWidth=8*KC;ctx.beginPath();ctx.arc(cc[0],cc[1],R0*KC,0,7);ctx.stroke();
    ctx.strokeStyle='rgba(240,200,80,.8)';ctx.setLineDash([40,50]);ctx.lineWidth=3;ctx.lineDashOffset=car?0:0;ctx.beginPath();ctx.arc(cc[0],cc[1],R0*KC,0,7);ctx.stroke();ctx.setLineDash([]);
    const scrAng=car?-Math.PI/2:-Math.atan2(hd[1],hd[0]);carTop(OX,OY,scrAng,{k:KC,inside:true});
    const pp=map(phm),p0=map(ph0);ctx.strokeStyle='#e08a00';ctx.lineWidth=3;ctx.setLineDash([6,5]);ctx.beginPath();
    for(let i=0;i<=20;i++){const tt=t*i/20,q=[ph0[0]+hd0[0]*v*tt,ph0[1]+hd0[1]*v*tt];let mm;if(car){const thh=th0+v*tt/R0,cmm=[R0*Math.cos(thh),R0*Math.sin(thh)],hh=[-Math.sin(thh),Math.cos(thh)],r2=-(Math.atan2(hh[1],hh[0])-Math.PI/2);let dx=q[0]-cmm[0],dy=q[1]-cmm[1];const cs=Math.cos(r2),sn=Math.sin(r2);mm=[OX+(dx*cs-dy*sn)*KC,OY-(dx*sn+dy*cs)*KC];}else mm=map(q);if(i)ctx.lineTo(mm[0],mm[1]);else ctx.moveTo(mm[0],mm[1]);}
    ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#ffd23f';ctx.strokeStyle='#1c1c1f';ctx.lineWidth=1.5;ctx.save();ctx.translate(pp[0],pp[1]);ctx.rotate(car?0:scrAng+Math.PI/2);rr(-5,-9,10,18,2.5);ctx.fill();ctx.stroke();ctx.restore();ctx.beginPath();ctx.arc(pp[0],pp[1],17,0,7);ctx.strokeStyle='rgba(224,138,0,.8)';ctx.lineWidth=2;ctx.stroke();
    ctx.restore();ctx.strokeStyle=C.line;ctx.lineWidth=1.5;ctx.strokeRect(612,40,576,520);
    pill(car?'riding in the car: the car looks still':'from above: the road looks still',900,62,{bg:'rgba(255,255,255,.95)',bd:C.line,s:14});
    pill(car?'the phone seems to slide to the outside':'the phone goes straight; the car turns left',900,538,{bg:'#b36b00',c:'#fff',s:14});}},
/* 4 */{ch:2,dur:7.5,cap:'How hard must the road push? Slide every velocity arrow to one starting point: its tip goes round a circle too. How fast that tip moves is the <b>acceleration</b>. Here it is 2.5 m/s every second, always toward the center.',
  alt:'The car’s speed never changes here, but its direction does. Acceleration measures any change in velocity, including a change of direction.',
  draw(bt,dt){lapStep(dt,4,10,R0);ground();for(let i=1;i<=7;i++){const a=S.th-i*Math.PI/4,g=P(a);vArrow(g,HEAD(a),10,{alpha:.25,w:3,head:8});}const p=carAt(S.th);vArrow(p,HEAD(S.th),10);fArrow(p,TOC(S.th),2.5);dot(CX,CY,5,C.ink);
    pill('shown at 4 times real speed',300,24,{bg:'#fff',bd:C.line,s:13});
    T('Every velocity arrow, from one point',630,48,{s:20,w:700});velCircle(900,196,10,S.th,{a:2.5,k:11});pill('this tip moves 2.5 m/s every second',900,332,{bg:COL.f,c:'#fff',s:14});
    const a1=lin(bt,1.5,.6),a2=lin(bt,3,.6),a3=lin(bt,4.5,.6);
    ctx.save();ctx.globalAlpha=a1;rich([['One lap of the road: ',C.ink,500],['2 × 3.14 × 40 m ÷ 10 m/s = 25.1 s',C.ink,700]],630,384,19);ctx.restore();
    ctx.save();ctx.globalAlpha=a2;rich([['The tip’s circle has radius 10 m/s: once round is ',C.ink,500],['62.8 m/s',COL.v,700]],630,424,19);ctx.restore();
    ctx.save();ctx.globalAlpha=a3;rich([['62.8 ÷ 25.1 = ',C.ink,500],['2.5 m/s every second',COL.f,700]],630,464,19);
    rich([['a',COL.f,700],[' = ',C.ink,500],['v²',COL.v,700],[' ÷ ',C.ink,500],['r',C.ink,700],[' = 10² ÷ 40 = ',C.ink,500],['2.5 m/s²',COL.f,700]],630,536,34);ctx.restore();}},
/* 5 */{ch:2,cap:()=>S.cAns==null?'Same curve, twice the speed: 20 m/s. <b>How much harder must the road push to keep the car on the circle?</b>':
    (S.cAns==='4'?'Yes, 4 times. ':'It is 4 times. ')+'The velocity circle is twice as big, <b>and</b> the car gets round in half the time, so the tip moves 4 times as fast: the v² in a = v² ÷ r. <b>Try the tighter curve.</b>',
  alt:'Two things double: how big the velocity arrow is, and how quickly it has to swing around. Two doublings make four.',
  need:()=>S.cAns==null?'Pick an answer.':(S.cSeenR?null:'Try the tighter 20 m curve.'),
  ui:()=>S.cAns==null?[['1','The same'],['2','2 times'],['4','4 times']].map(v=>'<button type="button" class="choice" data-cans="'+v[0]+'">'+v[1]+'</button>').join(''):
    '<span><b>Speed</b></span><span class="seg">'+[10,14,20].map(v=>'<button type="button" data-cv="'+v+'" aria-pressed="'+(S.cv===v)+'">'+v+' m/s</button>').join('')+'</span><span><b>Curve</b></span><span class="seg">'+[40,20].map(r=>'<button type="button" data-cr="'+r+'" aria-pressed="'+(S.cr===r)+'">'+r+' m</button>').join('')+'</span>',
  act(d){if(d.cans&&S.cAns==null){S.cAns=d.cans;S.cv=20;count('story/PhysLab/circular/double-'+(d.cans==='4'?'right':'wrong'));}if(d.cv)S.cv=+d.cv;if(d.cr){S.cr=+d.cr;if(S.cr===20)S.cSeenR=1;}},
  enter(){if(S.cAns==null){S.cv=10;S.cr=40;}},
  draw(bt,dt){const v=S.cv,r=S.cr,a=v*v/r;S.rShow+=(r-S.rShow)*Math.min(1,dt*5);if(Story.frozen)S.rShow=r;lapStep(dt,3,v,r);ground({r:S.rShow,noEntry:true});
    for(let i=1;i<=7;i++){const an=S.th-i*Math.PI/4,g=P(an,S.rShow);vArrow(g,HEAD(an),v,{alpha:.22,w:3,head:8});}
    const p=carAt(S.th,{r:S.rShow});vArrow(p,HEAD(S.th),v);fArrow(p,TOC(S.th),Math.min(a,11),{k:9});dot(CX,CY,5,C.ink);seg(CX,CY,CX+S.rShow*K,CY,'rgba(60,60,70,.5)',1.5,[4,4]);pill(r+' m',CX+S.rShow*K/2,CY-14,{bg:'#fff',bd:C.line,s:12});
    pill('shown at 3 times real speed',300,24,{bg:'#fff',bd:C.line,s:13});
    T('Velocity circle',630,40,{s:18,w:700});velCircle(820,222,v,S.th,{a:Math.min(a,10),k:6.6});
    tile(1010,60,170,96,'Speed',v+' m/s');tile(1010,170,170,96,'One lap',fx1(2*Math.PI*r/v)+' s');tile(1010,280,170,96,'Curve',r+' m');
    rich([['a',COL.f,700],[' = ',C.ink,500],['v²',COL.v,700],[' ÷ ',C.ink,500],['r',C.ink,700],[' = '+v+'² ÷ '+r+' = ',C.ink,500],[f1(a)+' m/s²',COL.f,700]],630,436,30);
    T('How hard the road must push',630,484,{s:16,c:C.mute});const bx=630,by=500,kk=24;ctx.fillStyle='#f1f1ee';rr(bx,by,540,26,6);ctx.fill();ctx.fillStyle=COL.f;rr(bx,by,Math.min(540,a*kk),26,6);ctx.fill();
    seg(bx+2.5*kk,by-4,bx+2.5*kk,by+30,C.ink,1.5,[3,3]);T('10 m/s on the 40 m curve',bx+2.5*kk+4,by+46,{s:13,c:C.mute});T(f1(a/2.5)+' ×',bx+Math.min(540,a*kk)-8,by+19,{s:15,w:700,c:'#fff',a:'right'});
    if(S.cAns==null)T('Twice the speed. Same curve.',630,580,{s:18,c:C.mute});else T('Twice the speed: 4 times the push. Half the radius: twice the push.',630,580,{s:16,c:C.mute});}},
/* 6 */{ch:3,cap:'The road can only push so hard: that is the grip. Ask for more and the car slides wide. <b>Try dry, wet and ice, and find the fastest speed each holds.</b> Same curve, same car: only the road changed.',
  alt:'Red is the push the turn needs. Green is the most the road can give. When red is longer than green, the car cannot stay on the circle.',
  need:()=>Object.keys(S.gSeen).length<3?'Try all three: dry, wet and ice.':null,
  uiStatic:true,uiSync:gSync,
  ui:()=>'<span class="seg" role="group" aria-label="Road">'+['dry','wet','ice'].map(k=>'<button type="button" data-surf="'+k+'" aria-pressed="'+(S.gs===k)+'">'+SURF[k]+'</button>').join('')+'</span><label>Speed <input type="range" id="g-v" min="4" max="24" step="1" value="'+S.gv+'"><output id="g-vo"></output></label>',
  act(d){if(d.surf){S.gs=d.surf;S.gSeen[d.surf]=1;S.gT=-1;S.th=0;gSync();}},input(t){if(t.id==='g-v'){S.gv=+t.value;S.gT=-1;S.th=0;gSync();}},enter(){S.gSeen[S.gs]=1;S.gT=-1;},
  draw(bt,dt){const v=S.gv,need=MASS*v*v/R0,grip=MU[S.gs]*MASS*GR,ok=need<=grip+1,vmax=Math.sqrt(MU[S.gs]*GR*R0);ground({surf:S.gs,noEntry:true});let p,ang;
    if(ok){lapStep(dt,2,v,R0);p=P(S.th);ang=angOf(S.th);fArrow(p,TOC(S.th),v*v/R0,{k:9});}
    else{if(S.gT<0)S.gT=0;S.gT+=dt*2;const sp=slideP(S.gT,v,S.gs),q=[CX+sp.m[0]*K,CY-sp.m[1]*K];ctx.save();ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.setLineDash([7,6]);ctx.beginPath();for(let i=0;i<=30;i++){const s2=slideP(S.gT*i/30,v,S.gs);const X=CX+s2.m[0]*K,Y=CY-s2.m[1]*K;if(i)ctx.lineTo(X,Y);else ctx.moveTo(X,Y);}ctx.stroke();ctx.restore();
      p=q;ang=angOf(sp.th);fArrow(p,TOC(sp.th),MU[S.gs]*GR,{k:9});if(Math.hypot(sp.m[0],sp.m[1])>R0+11||q[0]<8||q[0]>592||q[1]<8)S.gT=0;}
    carTop(p[0],p[1],ang);vArrow(p,[Math.cos(ang),Math.sin(ang)],v);dot(CX,CY,5,C.ink);
    pill(ok?'holds the curve':'needs more push than the road can give: slides wide',300,24,{bg:ok?C.good:C.red,c:'#fff',s:14});
    T('Push needed against grip, for a 1,500 kg car',630,48,{s:18,w:700});const bx=630,kk=22;
    T('needed: mass × v² ÷ r',bx,92,{s:15,c:C.mute});ctx.fillStyle=COL.f;rr(bx,102,Math.min(545,need/1000*kk),30,6);ctx.fill();T(f1(need/1000)+' kN',bx+Math.min(545,need/1000*kk)+8,124,{s:17,w:700,c:COL.f});
    T('grip on '+({dry:'a dry',wet:'a wet',ice:'an icy'}[S.gs])+' road: '+MU[S.gs]+' × the car’s weight',bx,172,{s:15,c:C.mute});ctx.fillStyle=C.good;rr(bx,182,grip/1000*kk,30,6);ctx.fill();T(f1(grip/1000)+' kN',bx+grip/1000*kk+8,204,{s:17,w:700,c:C.good});
    
    {const gx=745,gy=440,gr=96,A=x=>Math.PI+clamp(x/24,0,1)*Math.PI;ctx.save();ctx.lineWidth=20;ctx.lineCap='butt';ctx.strokeStyle=C.good;ctx.beginPath();ctx.arc(gx,gy,gr,A(0),A(vmax));ctx.stroke();ctx.strokeStyle=C.red;ctx.beginPath();ctx.arc(gx,gy,gr,A(vmax),A(24));ctx.stroke();
      for(const tk of[0,10,20]){const an=A(tk);T(String(tk),gx+Math.cos(an)*(gr+26),gy+Math.sin(an)*(gr+26)+5,{s:13,c:C.mute,a:'center'});}
      const an=A(v);ctx.strokeStyle=C.ink;ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(gx,gy);ctx.lineTo(gx+Math.cos(an)*(gr-4),gy+Math.sin(an)*(gr-4));ctx.stroke();ctx.restore();dot(gx,gy,7,C.ink);T('m/s',gx,gy+30,{s:13,c:C.mute,a:'center'});
      T('green: the road holds it',gx,gy+56,{s:13,c:C.good,a:'center',w:700});}
    T('Fastest this road holds',890,330,{s:16,c:C.mute});T(f1(vmax)+' m/s',890,374,{s:36,w:700});T('about '+Math.floor(mph(vmax))+' mph',890,404,{s:18,c:C.mute});
    T('You are at',890,452,{s:16,c:C.mute});T(v+' m/s · '+Math.round(mph(v))+' mph',890,490,{s:30,w:700,c:ok?C.good:C.red});
    T('Grip numbers are typical values for a car tire. Real roads vary.',630,580,{s:14,c:C.mute});}},
/* 7 */{ch:4,cap:'Now the airdrop again, from a tower 400 km high, with no air. Throw sideways and it lands. Throw faster and it lands farther round. <b>Keep going faster.</b> At one speed the ground curves away as fast as it falls.',
  alt:'It is still falling the whole time. It just never gets closer to the ground, because the ground bends away underneath it.',
  need:()=>S.nSeen[7.67]?null:'Try 7.67 km/s.',
  ui:()=>'<span><b>Sideways speed</b></span><span class="seg">'+[3,5,7,7.67,8.5].map(v=>'<button type="button" data-nv="'+v+'" class="'+(S.nSeen[v]?'done':'')+'" aria-pressed="'+(S.nv===v)+'">'+v+' km/s</button>').join('')+'</span>',
  act(d){if(d.nv){S.nv=+d.nv;S.nSeen[S.nv]=1;S.nT=0;}},enter(){S.nT=0;S.nSeen[S.nv]=1;},replay(){S.nT=0;},
  draw(bt,dt){S.nT+=dt;earth();const top=EP(0,R1);seg(EX,EY-150,top[0],top[1],'#cfd4da',2);pill('400 km up',EX-52,top[1]-4,{bg:'rgba(255,255,255,.9)',s:12});
    for(const v of[3,5,7,7.67,8.5]){if(!S.nSeen[v]||v===S.nv)continue;const o=orbit(v);ctx.save();ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=1.5;ctx.beginPath();o.pts.forEach((q,i)=>{if(i%6)return;const s=EP(q[1],q[2]);if(i)ctx.lineTo(s[0],s[1]);else ctx.moveTo(s[0],s[1]);});ctx.stroke();ctx.restore();}
    const o=orbit(S.nv),tt=Math.min(o.t,(Story.frozen?bt:S.nT)*o.t/5.5),n=Math.min(o.pts.length-1,Math.floor(tt/4));ctx.save();ctx.strokeStyle='#ffd23f';ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<=n;i++){const s=EP(o.pts[i][1],o.pts[i][2]);if(i)ctx.lineTo(s[0],s[1]);else ctx.moveTo(s[0],s[1]);}ctx.stroke();ctx.restore();
    const q=EP(o.pts[n][1],o.pts[n][2]);dot(q[0],q[1],5,'#ffd23f','#1c1c1f');const done=n>=o.pts.length-1;
    tile(630,40,270,112,'Sideways speed',S.nv+' km/s',Math.round(S.nv*2236.94).toLocaleString()+' mph');tile(915,40,265,112,done?(o.landed?'Lands':'Result'):'Flying',done?(o.landed?Math.round(o.ground).toLocaleString()+' km':'Never lands'):'…',done?(o.landed?'along the ground, after '+Math.round(o.t/60)+' min':(S.nv>7.7?'a stretched loop':'one lap: '+Math.round(o.t/60)+' min')):'');
    T('Two motions, as before',630,208,{s:20,w:700});T('Sideways: nothing pushes, so it keeps its speed.',630,244,{s:18,c:C.mute});T('Down: gravity pulls it toward the Earth’s center.',630,272,{s:18,c:C.mute});
    const a=S.nSeen[7.67]?1:0;T('At 7.67 km/s the fall just matches the curve of the Earth.',630,340,{s:19,w:700,alpha:a});T('It falls all the way round and comes back. That is an orbit.',630,368,{s:19,w:700,alpha:a});
    T('Gravity is now the center-pointing force.',630,420,{s:19,w:700,c:COL.f,alpha:a});
    T('The Earth and the 400 km height are to scale. The tower is not real:',630,552,{s:14,c:C.mute});T('it stands in for a rocket. Each path takes about 6 seconds here.',630,572,{s:14,c:C.mute});}},
/* 8 */{ch:4,cap:'This is the International Space Station: 400 km up, 7.66 km/s, with people aboard without a break since November 2000. Gravity there is 89% of what you feel now. The crew float because they are <b>falling around the Earth</b> together.',
  alt:'If gravity switched off up there, the station would not float. It would fly off in a straight line, like the car on the ice.',
  draw(bt,dt){S.isT+=dt;earth();const th=(Story.frozen?bt:S.isT)*2*Math.PI/14+1.1,p=[EX+R1*KE*Math.cos(th),EY-R1*KE*Math.sin(th)];ctx.save();ctx.setLineDash([3,6]);ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(EX,EY,R1*KE,0,7);ctx.stroke();ctx.restore();
    const hd=HEAD(th),tc=TOC(th);arrow(p[0],p[1],p[0]+hd[0]*56,p[1]+hd[1]*56,COL.v,5);arrow(p[0],p[1],p[0]+tc[0]*48,p[1]+tc[1]*48,COL.f,5);station(p,Math.atan2(hd[1],hd[0]));
    pill('gravity',p[0]+tc[0]*62,p[1]+tc[1]*62,{bg:COL.f,c:'#fff',s:12});pill('velocity',p[0]+hd[0]*76,p[1]+hd[1]*76,{bg:COL.v,c:'#fff',s:12});
    pill('To scale: the station is this close to the ground. Its picture is drawn larger than life.',300,28,{bg:'rgba(255,255,255,.92)',s:12});
    tile(630,40,270,112,'Speed','7.66 km/s','about 5 miles every second');tile(915,40,265,112,'One lap, about','92 min','about 16 laps a day');
    T('Gravity at 400 km up',630,208,{s:16,c:C.mute});rich([['8.7 m/s²',COL.f,700],['   (on the ground: 9.8)',C.mute,500]],630,246,32);
    T('What the turn needs',630,306,{s:16,c:C.mute});rich([['v²',COL.v,700],[' ÷ ',C.ink,500],['r',C.ink,700],[' = 7,660² ÷ 6,771,000 = ',C.ink,500],['8.7 m/s²',COL.f,700]],630,344,28);
    T('They match. Gravity is exactly the push the circle needs.',630,404,{s:20,w:700});
    T('The station, the crew and their dinner all fall together,',630,452,{s:18,c:C.mute});T('so nothing presses on anything. That is floating.',630,478,{s:18,c:C.mute});
    T('6,771 km is the distance from the Earth’s center: 6,371 km of Earth plus 400 km.',630,572,{s:14,c:C.mute});}}
];
function gSync(){const o=$('g-vo');if(o)o.textContent=S.gv+' m/s · '+Math.round(mph(S.gv))+' mph';$('act').querySelectorAll('[data-surf]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.surf===S.gs)));}

Story.run({id:'circular',lab:'PhysLab',H:H,off:0,chapters:CH,beats:BEATS,
  title:'Raider PhysLab · What makes it turn? (Circular motion and gravity, story version)',
  words:[['center',/cent(er|re|ripetal)/i],['straight',/straight/i],['velocity',/velocit|direction/i],['friction',/friction|grip/i],['gravity',/gravity/i],['falling',/fall/i]],
  order:['The road pushes the tires toward the center of the curve.','That push swings the car’s velocity around without changing its speed.','On ice, the push is gone.','The car goes straight, in the direction it was heading at that instant.'],
  state:{path:[],th:0,slip:-1,slipTh:0,iced:0,view:'above',seenCar:0,pT:0,cAns:null,cv:10,cr:40,cSeenR:0,rShow:40,gs:'dry',gv:10,gSeen:{},gT:-1,nv:3,nSeen:{},nT:0,isT:0},
  frozen(S,qs){if(qs.has('draw')){const kind=qs.get('draw'),s=P(ICE),h=HEAD(ICE);S.path=[];for(let i=0;i<=20;i++){if(kind==='straight')S.path.push([s[0]+h[0]*i*9,s[1]+h[1]*i*9]);else S.path.push(P(ICE+i*.045));}}
    if(qs.has('view')){S.view=qs.get('view');S.seenCar=1;}if(qs.has('cans')){S.cAns=qs.get('cans');S.cSeenR=1;}if(qs.has('gs')){S.gs=qs.get('gs');S.gSeen={dry:1,wet:1,ice:1};}
    if(qs.has('seen')){S.nSeen={3:1,5:1,7:1,7.67:1,8.5:1};}if(qs.has('pt'))S.pT=+qs.get('pt');S.iced=qs.has('iced')?2:0;},
  reset(S){Object.assign(S,{path:[],slip:-1,iced:0,view:'above',seenCar:0,cAns:null,cv:10,cr:40,cSeenR:0,gs:'dry',gv:10,gSeen:{},nv:3,nSeen:{}});},
  copyLines(S){const k=classify();return['My drawing of the car on ice: '+(k==null?'(skipped)':(k==='straight'?'straight ahead':(k==='curve'?'following the curve':'flung outward')))+'. It goes straight ahead.',
    'Twice the speed on the same curve: I picked '+({1:'the same push',2:'2 times the push',4:'4 times the push'}[S.cAns]||'(skipped)')+'. It is 4 times.',
    'Road surfaces I tested: '+(Object.keys(S.gSeen).join(', ')||'(none)')+'.'];}});
})();
