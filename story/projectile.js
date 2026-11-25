/* Raider PhysLab story: Where do you let go? (Projectiles: sideways and down are separate) */
(function(){
'use strict';
const {W,FONT,C,ctx,S,$,clamp,lerp,ease,ph,lin,mph,f1,fx1,rr,T,pill,rich,seg,arrow,tile,mul,axes,dot,handle,count}=Story;
const H=624,SH=312,GY=276,PXM=1.4,G=9.8,DZ=400,DZW=60,REL=40;
const RX=x=>70+(x-S.cam)*PXM,RY=y=>GY-y*PXM,invRX=px=>S.cam+(px-70)/PXM;
const COL={side:C.blue,down:C.red,both:C.teal};

/* ---------- the model: let go from a moving plane, no air ---------- */
function flight(v,h){const tf=Math.sqrt(2*h/G);return{v,h,tf,range:v*tf,x:t=>v*clamp(t,0,tf),y:t=>Math.max(0,h-.5*G*Math.pow(clamp(t,0,tf),2)),fall:t=>.5*G*Math.pow(clamp(t,0,tf),2),vy:t=>G*clamp(t,0,tf)};}
const F1=flight(60,176.4);     /* 6.0 s of fall, 360 m forward */
const F2=flight(70,122.5);     /* 5.0 s of fall, 350 m forward */
/* with air: a rough estimate for a 50 kg bag (drag grows with speed squared; top falling speed about 53 m/s) */
function airPath(v,h){const k=.0035,dt=.01;let x=0,y=h,vx=v,vy=0,t=0;const p=[[0,0,h]];while(y>0&&t<60){const sp=Math.hypot(vx,vy);vx+=-k*sp*vx*dt;vy+=(-G-k*sp*vy)*dt;x+=vx*dt;y+=vy*dt;t+=dt;p.push([t,x,Math.max(0,y)]);}return p;}
function airAt(p,t){const i=clamp(Math.round(t/.01),0,p.length-1);return p[i];}

/* ---------- the scene: South Sudan grassland, to scale (the bag is drawn larger than life) ---------- */
const RND=mul(9),TREES=[];for(let i=0;i<34;i++){const x=-80+RND()*1500;if(x>DZ-95&&x<DZ+95){RND();RND();continue;}TREES.push([x,6+RND()*4,RND()]);}
const CLOUDS=[[90,34,1],[430,22,.75],[760,44,1.1],[1080,28,.9]],HUTS=[-36,-20,-2,22];
function world(o){o=o||{};const h=o.h||F1.h;ctx.save();ctx.beginPath();ctx.rect(0,0,W,SH);ctx.clip();
  let g=ctx.createLinearGradient(0,0,0,GY);g.addColorStop(0,'#7dbbea');g.addColorStop(1,'#e2f1fb');ctx.fillStyle=g;ctx.fillRect(0,0,W,GY);
  ctx.fillStyle='rgba(255,255,255,.85)';for(const c of CLOUDS){const x=((c[0]-S.cam*.25)%1300+1300)%1300-50;for(const d of[[0,0,34,10],[22,-7,26,11],[-24,3,22,8]]){ctx.beginPath();ctx.ellipse(x+d[0]*c[2],c[1]+d[1]*c[2],d[2]*c[2],d[3]*c[2],0,0,7);ctx.fill();}}
  ctx.fillStyle='#c5cc8f';ctx.fillRect(0,GY-5,W,5);ctx.fillStyle='#b5ad6c';ctx.fillRect(0,GY,W,SH-GY);ctx.fillStyle='#a39a5a';ctx.fillRect(0,GY+26,W,SH-GY-26);
  const a=RX(DZ-DZW),b=RX(DZ+DZW);ctx.fillStyle='#ddd3a6';ctx.fillRect(a,GY,b-a,SH-GY);ctx.fillStyle='#fff';ctx.fillRect(a-2,GY+2,5,12);ctx.fillRect(b-3,GY+2,5,12);
  ctx.strokeStyle='#fff';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(RX(DZ)-17,GY+9);ctx.lineTo(RX(DZ)+17,GY+27);ctx.moveTo(RX(DZ)+17,GY+9);ctx.lineTo(RX(DZ)-17,GY+27);ctx.stroke();
  for(const t of TREES){const x=RX(t[0]);if(x<-20||x>W+20)continue;ctx.strokeStyle='#5d4a2f';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(x,GY);ctx.lineTo(x,GY-t[1]*PXM);ctx.stroke();ctx.fillStyle=t[2]>.5?'#587a36':'#6a8a40';ctx.beginPath();ctx.ellipse(x,GY-t[1]*PXM,5.2*PXM,1.7*PXM,0,0,7);ctx.fill();}
  for(const hx of HUTS){const x=RX(hx);ctx.fillStyle='#b88a58';ctx.fillRect(x-2.2,GY-2.6,4.4,2.6);ctx.fillStyle='#6f5733';ctx.beginPath();ctx.moveTo(x-3.4,GY-2.4);ctx.lineTo(x+3.4,GY-2.4);ctx.lineTo(x,GY-6.2);ctx.fill();}
  if(!o.noLine){ctx.setLineDash([3,7]);ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,RY(h));ctx.lineTo(W,RY(h));ctx.stroke();ctx.setLineDash([]);}
  ctx.restore();ctx.fillStyle='#fff';ctx.fillRect(0,SH,W,H-SH);
  for(let d=Math.ceil((S.cam-50)/100)*100;d<=S.cam+800;d+=100){const x=RX(d);seg(x,SH,x,SH+6,C.gray,1.5);T(d===0?'0 m':String(d),x,SH+20,{s:13,c:C.mute,a:'center'});}
  if(!o.noX)pill('drop zone',RX(DZ-DZW)-44,GY+19,{bg:'rgba(255,255,255,.92)',s:12});}
function plane(xr,h,o){o=o||{};ctx.save();ctx.translate(RX(xr),RY(h));ctx.scale(PXM,-PXM);if(o.alpha!=null)ctx.globalAlpha*=o.alpha;ctx.lineJoin='round';
  ctx.fillStyle='#f4f6f8';ctx.strokeStyle='#8f98a3';ctx.lineWidth=.45;
  ctx.beginPath();ctx.moveTo(-3,5.6);ctx.lineTo(2,5.6);ctx.lineTo(-2.5,11.6);ctx.lineTo(-6.2,11.6);ctx.closePath();ctx.fill();ctx.stroke();                      /* fin */
  ctx.fillStyle='#c4cad2';ctx.beginPath();ctx.moveTo(-9.5,11.4);ctx.lineTo(.8,11.4);ctx.lineTo(-.8,12.3);ctx.lineTo(-8.4,12.3);ctx.closePath();ctx.fill();          /* T-tail */
  ctx.fillStyle='#f4f6f8';ctx.beginPath();ctx.moveTo(2,0);ctx.lineTo(40,0);ctx.quadraticCurveTo(46.2,.2,46.6,2.3);ctx.quadraticCurveTo(45.4,4.9,39,4.9);ctx.lineTo(8,4.9);ctx.lineTo(-3,5.7);ctx.lineTo(-2.2,4.3);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle='#3d7dca';ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(4,2.6);ctx.lineTo(44.6,2.6);ctx.stroke();
  ctx.fillStyle='#27323f';ctx.fillRect(41.2,3.3,3,.9);
  ctx.fillStyle='#c4cad2';ctx.beginPath();ctx.moveTo(15,4.7);ctx.lineTo(28.5,4.7);ctx.lineTo(22.5,5.7);ctx.lineTo(12,5.7);ctx.closePath();ctx.fill();           /* high wing */
  ctx.fillStyle='#7f8893';for(const e of[[20.5,3.3],[25.5,3.5]]){ctx.beginPath();ctx.ellipse(e[0],e[1],2.7,.95,0,0,7);ctx.fill();}
  ctx.fillStyle='#8f98a3';ctx.beginPath();ctx.ellipse(21,-.2,4,.7,0,0,7);ctx.fill();ctx.restore();}
function heli(x,h){ctx.save();ctx.translate(RX(x),RY(h));ctx.scale(PXM,-PXM);ctx.fillStyle='#e9ecef';ctx.strokeStyle='#8f98a3';ctx.lineWidth=.4;
  ctx.beginPath();ctx.ellipse(-4,1.9,5.2,1.9,0,0,7);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-8.6,2.4);ctx.lineTo(-17.5,3.3);ctx.lineTo(-17.5,3.9);ctx.lineTo(-8.2,3.2);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle='#4a525c';ctx.lineWidth=.35;ctx.beginPath();ctx.moveTo(-14,4.4);ctx.lineTo(6.5,4.4);ctx.moveTo(-4,3.6);ctx.lineTo(-4,4.4);ctx.moveTo(-17.5,2.2);ctx.lineTo(-17.5,5.2);ctx.stroke();ctx.fillStyle='#27323f';ctx.fillRect(-1.6,1.9,2.2,1);ctx.restore();}
function bag(x,y,o){o=o||{};const px=RX(x),py=RY(y);ctx.save();if(o.alpha!=null)ctx.globalAlpha*=o.alpha;ctx.fillStyle=o.col||'#fff';ctx.strokeStyle=o.stroke||'#56606c';ctx.lineWidth=1.6;rr(px-4.5,py-9,9,9,2.5);ctx.fill();ctx.stroke();ctx.restore();}
function pathLine(f,x0,t1,o){o=o||{};ctx.save();ctx.strokeStyle=o.col||'rgba(255,255,255,.95)';ctx.lineWidth=o.w||2.5;if(o.dash)ctx.setLineDash(o.dash);ctx.beginPath();for(let i=0;i<=60;i++){const t=t1*i/60,X=RX(x0+f.x(t)),Y=RY(f.y(t))-4;if(i)ctx.lineTo(X,Y);else ctx.moveTo(X,Y);}ctx.stroke();ctx.restore();}
function marker(x,h,o){o=o||{};const px=RX(x),py=RY(h);seg(px,py,px,GY,o.col||C.flag,2.5,[6,5]);if(o.live){const pu=o.pulse?(Math.sin(performance.now()/260)+1)/2:0;if(o.pulse){ctx.beginPath();ctx.arc(px,py,16+pu*8,0,7);ctx.strokeStyle='rgba(255,210,63,'+(.85-pu*.5)+')';ctx.lineWidth=3;ctx.stroke();}
    dot(px,py,13,C.flag,'#1c1c1f');T('◂ ▸',px,py+5,{s:13,w:700,a:'center'});}else dot(px,py,6,o.col||C.flag,'#1c1c1f');
  if(o.label)pill(o.label,px,py+30,{bg:o.col||C.flag,c:o.tc||C.ink,s:14});}
function landMark(x,ok){const px=clamp(RX(x),8,W-8);ctx.save();ctx.strokeStyle=ok?C.good:C.red;ctx.lineWidth=3;ctx.beginPath();ctx.arc(px,GY+2,11,Math.PI,0);ctx.stroke();ctx.restore();}
function missWord(m){return Math.abs(m)<=DZW?'in the drop zone':(Math.round(Math.abs(m))+' m '+(m>0?'past the X':'short of the X'));}

/* ---------- graphs ---------- */
function mk(g){g.X=t=>g.x+t*g.w/g.tmax;g.Y=v=>g.y-v*g.ys;return g;}
const GS=mk({x:96,y:584,w:320,h:160,tmax:6.5,ys:2}),GD=mk({x:520,y:584,w:320,h:160,tmax:6.5,ys:2});

/* ---------- beats ---------- */
const CH=['The drop','Two motions','The race','Box and triangle','Your mission','The real thing'];
function runDrop(f,xRel,t,o){o=o||{};const xp=xRel+f.v*t,rel=t>=0,landed=t>=f.tf;plane(xp,f.h);if(rel){pathLine(f,xRel,Math.min(t,f.tf));bag(xRel+f.x(t),f.y(t));}return{xp,landed,land:xRel+f.range};}
function strobe(f,xRel,upTo,o){o=o||{};for(let k=0;k<=Math.min(upTo,Math.floor(f.tf+1e-6));k++){const x=xRel+f.v*k,y=f.y(k);if(!o.noPlane)plane(x,f.h,{alpha:.22});seg(RX(x),RY(f.h)+2,RX(x),RY(y)-10,'rgba(255,255,255,.8)',1.5,[4,4]);bag(x,y,{alpha:.9});}}

const BEATS=[
/* 0 */{ch:0,cap:'No road reaches this village, so food comes by air. The plane flies at 60 m/s, 176 m up. <b>Drag the yellow marker to where the crew should let the bags go</b> to hit the white X.',
  alt:'Just mark your best guess. You will see where the bags land next.',nextLabel:'Lock in my release point',
  need:()=>S.g==null?'Drag the yellow marker along the flight line first.':null,
  draw(){S.cam=0;world();plane(-40,F1.h);const g=S.g==null?200:S.g;marker(g,F1.h,{live:true,pulse:S.g==null,label:S.g==null?'drag me':'let go here'});
    pill('flying this way →',RX(10),RY(F1.h)+34,{bg:'rgba(255,255,255,.92)',s:13});
    tile(40,344,350,112,'Plane speed','60 m/s','about 134 mph');tile(425,344,350,112,'Height','176 m','about 580 feet');tile(810,344,350,112,'Target','The white X','a cleared drop zone, 120 m long');
    T('Where does the crew let go?',W/2,520,{s:30,w:700,a:'center'});T(S.g==null?'Slide the marker along the dotted flight line.':(S.g===DZ?'Your release point is right above the X.':'Your release point is '+Math.round(Math.abs(DZ-S.g))+' m '+(S.g<DZ?'before':'past')+' the X.'),W/2,560,{s:20,c:C.mute,a:'center'});},
  down(x,y){if(y<SH+10){this.move(x);return true;}},move(x){S.g=clamp(Math.round(invRX(x)/10)*10,0,780);}},
/* 1 */{ch:0,dur:10.2,cap:()=>{const g=S.g==null?DZ:S.g,m=g+F1.range-DZ;return'Let go there, the bags land <b>'+missWord(m)+'</b>. They do not fall straight down. They keep the plane’s forward speed the whole way and land <b>360 m ahead</b> of where they were let go.';},
  alt:'The bags were moving forward at 60 m/s inside the plane. Letting go does not take that speed away.',
  draw(bt){S.cam=0;world();const g=S.g==null?DZ:S.g,t=bt-2,r=runDrop(F1,g,t),m=r.land-DZ;marker(g,F1.h,{label:'let go'});
    if(r.landed){landMark(r.land,Math.abs(m)<=DZW);if(RX(r.land)>W-6)pill('landed off the picture, '+Math.round(m)+' m past the X',W-150,GY-18,{bg:C.red,c:'#fff',s:13});
      else pill(Math.abs(m)<=DZW?'in the drop zone ✓':missWord(m),clamp(RX(r.land),90,W-90),GY-22,{bg:Math.abs(m)<=DZW?C.good:C.red,c:'#fff',s:13});
      seg(RX(g),GY+16,Math.min(RX(r.land),W-4),GY+16,COL.side,4);pill('360 m forward',Math.min((RX(g)+RX(r.land))/2,W-80),GY+16,{bg:COL.side,c:'#fff',s:12});}
    const tt=clamp(t,0,F1.tf);tile(40,344,350,112,'Time since they let go',fx1(tt)+' s');tile(425,344,350,112,'Height of the bags',f1(F1.y(tt))+' m');tile(810,344,350,112,'Forward since let go',f1(F1.x(tt))+' m');
    if(bt>9){const a=lin(bt,9,.6);ctx.save();ctx.globalAlpha=a;marker(REL,F1.h,{col:'#fff',label:'the crew lets go here'});ctx.restore();T('To hit the X, let go 360 m before it.',W/2,540,{s:26,w:700,a:'center',alpha:a});}}},
/* 2 */{ch:1,dur:8.6,cap:'One flash every second. The bags are always <b>directly under the plane</b>. Nothing pushes them sideways, so they keep the plane’s speed. <b>Now switch to the view from the plane</b>: from there, they just fall straight down.',
  alt:'The plane and the bags move forward together, like two cars side by side on a highway. Only the bags also fall.',
  need:()=>S.seenPlane?null:'Switch to the view from the plane.',
  ui:()=>'<span><b>Watch from</b></span><span class="seg">'+[['ground','the ground'],['plane','the plane']].map(v=>'<button type="button" data-view="'+v[0]+'" aria-pressed="'+(S.view===v[0])+'">'+v[1]+'</button>').join('')+'</span>',
  act(d){if(d.view){S.view=d.view;S.bt=0;if(d.view==='plane')S.seenPlane=1;}},
  draw(bt){const t=bt-1.4,tt=clamp(t,0,F1.tf),xp=REL+F1.v*t,pv=S.view==='plane';S.cam=pv?xp-330:0;world();
    if(pv){plane(xp,F1.h);seg(RX(xp),RY(F1.h),RX(xp),GY,'rgba(255,255,255,.8)',1.5,[4,4]);for(let k=0;k<=Math.floor(tt+1e-6);k++)bag(xp,F1.y(k),{alpha:.9});if(t>=0)bag(xp,F1.y(tt));
      pill('you are riding along with the plane',W/2+160,118,{bg:'rgba(255,255,255,.92)',s:14});}
    else{marker(REL,F1.h,{col:'#fff'});if(t>=0)strobe(F1,REL,Math.floor(tt+1e-6));runDrop(F1,REL,t);}
    T(pv?'From the plane':'From the ground',60,372,{s:24,w:700});T(pv?'The bags drop straight down, faster and faster.':'The bags trace a curve and stay under the plane.',60,404,{s:19,c:C.mute});
    T('Same flight. The only difference is where you stand.',60,470,{s:19,c:C.mute,alpha:S.seenPlane?1:0});
    tile(810,344,350,112,'Time since they let go',fx1(tt)+' s');tile(810,470,350,112,'Bags are under the plane?','Yes','at every flash');}},
/* 3 */{ch:1,dur:6.4,cap:'Slide each flash down to the ground: equal gaps, a steady 60 m each second. Slide each flash across to the wall: free-fall gaps that grow 1, 3, 5, 7. One flight is <b>two simple motions</b> at once.',
  alt:'Look at the blue dots only, then the red dots only. Each set is a kind of motion you already know.',
  draw(bt){S.cam=0;world();marker(REL,F1.h,{col:'#fff'});strobe(F1,REL,6);pathLine(F1,REL,F1.tf);const q1=ph(bt,.5,1.6),q2=ph(bt,2.8,1.6),WX=760;
    seg(RX(WX),RY(F1.h)-8,RX(WX),GY,'#fff',3);
    for(let k=0;k<=6;k++){const x=REL+60*k,y=F1.y(k);if(q1>0){dot(RX(x),lerp(RY(y)-4,GY+14,q1),5,COL.side,'#fff');}if(q2>0){dot(lerp(RX(x),RX(WX),q2),RY(y)-4,5,COL.down,'#fff');}}
    if(q1>=1)for(let k=0;k<6;k++)T('60',RX(REL+60*k+30),GY+33,{s:12,w:700,c:'#fff',a:'center',alpha:lin(bt,2.1,.4)});
    if(q2>=1)[1,3,5,7,9,11].forEach((n,k)=>T('×'+n,RX(WX)+12,(RY(F1.y(k))+RY(F1.y(k+1)))/2,{s:k<2?10:13,w:700,c:COL.down,alpha:lin(bt,4.4,.4)}));
    const a1=lin(bt,2.1,.5),a2=lin(bt,4.4,.5);ctx.save();ctx.globalAlpha=a1;ctx.fillStyle='#eef3fc';rr(40,344,540,150,12);ctx.fill();T('Sideways',60,378,{s:17,w:700,c:COL.side});T('60 m every second',60,424,{s:36,w:700,c:COL.side});T('equal gaps: a steady speed, because nothing pushes sideways',60,462,{s:16,c:C.mute});ctx.restore();
    ctx.save();ctx.globalAlpha=a2;ctx.fillStyle='#fdeef0';rr(620,344,540,150,12);ctx.fill();T('Down',640,378,{s:17,w:700,c:COL.down});T('4.9 m, then ×3, ×5, ×7…',640,424,{s:36,w:700,c:COL.down});T('growing gaps: speeding up, because gravity pulls down',640,462,{s:16,c:C.mute});ctx.restore();
    T('The sideways motion and the downward motion do not affect each other.',W/2,560,{s:22,w:700,a:'center',alpha:lin(bt,5.4,.6)});}},
/* 4 */{ch:2,cap:()=>S.rAns==null?'A helicopter hovers at the same height and simply lets a bag go at the same instant. <b>Which bag reaches the ground first?</b>':
    (S.rAns==='t'?'Yes. ':'They land together. ')+'Moving sideways does not change how fast a thing falls. Both bags drop 176 m in 6.0 s. The plane’s speed only decides <b>how far along</b> its bag lands. Try a slower and a faster plane.',
  alt:'Watch the white lines between the two bags. They stay level the whole way down.',
  need:()=>S.rAns==null?'Pick an answer.':(Object.keys(S.rSeen).length<2?'Try another plane speed.':null),
  ui:()=>S.rAns==null?[['d','The dropped bag'],['p','The bag from the plane'],['t','They land together']].map(v=>'<button type="button" class="choice" data-rans="'+v[0]+'">'+v[1]+'</button>').join(''):
    '<span><b>Plane speed</b></span><span class="seg">'+[30,60,90].map(v=>'<button type="button" data-rv="'+v+'" class="'+(S.rSeen[v]?'done':'')+'" aria-pressed="'+(S.rV===v)+'">'+v+' m/s</button>').join('')+'</span>',
  act(d){if(d.rans&&S.rAns==null){S.rAns=d.rans;S.rT=0;S.rSeen[60]=1;count('story/PhysLab/projectile/race-'+(d.rans==='t'?'right':'wrong'));}if(d.rv){S.rV=+d.rv;S.rSeen[S.rV]=1;S.rT=0;}},
  enter(){S.rT=0;},replay(){S.rT=0;},
  draw(bt,dt){S.rT+=dt;S.cam=0;world();const f=flight(S.rV,F1.h),HX=REL-28,run=S.rAns!=null,t=run?(Story.frozen?bt:S.rT)-.8:-1,tt=clamp(t,0,f.tf);
    heli(HX+9,F1.h+1);marker(REL,F1.h,{col:'#fff'});
    for(const v of[30,60,90]){if(!S.rSeen[v]||v===S.rV)continue;const fo=flight(v,F1.h);pathLine(fo,REL,fo.tf,{col:'rgba(255,255,255,.5)',w:2,dash:[5,5]});pill(v+' m/s: '+Math.round(fo.range)+' m, 6.0 s',RX(REL+fo.range),GY+16,{bg:'#555',c:'#fff',s:12});}
    if(run&&t>=0){for(let k=1;k<=Math.floor(tt+1e-6);k++){seg(RX(HX),RY(f.y(k))-4,RX(REL+f.x(k)),RY(f.y(k))-4,'rgba(255,255,255,.85)',1.5,[4,4]);bag(HX,f.y(k),{alpha:.6});bag(REL+f.x(k),f.y(k),{alpha:.6});}
      seg(RX(HX),RY(F1.h),RX(HX),RY(f.y(tt)),'rgba(255,255,255,.9)',2.5);runDrop(f,REL,t);bag(HX,f.y(tt));
      if(t>=f.tf){pill('6.0 s',RX(HX),GY-22,{bg:C.good,c:'#fff',s:13});pill('6.0 s · '+Math.round(f.range)+' m',RX(REL+f.range),GY-22,{bg:C.good,c:'#fff',s:13});}}
    else{plane(REL,F1.h);bag(HX,F1.h);}
    pill('helicopter: just lets go',RX(HX)+8,RY(F1.h)+40,{bg:'rgba(255,255,255,.92)',s:13,a:'left'});pill('plane: '+S.rV+' m/s',RX(REL+70+(run?f.v*Math.max(t,0):0)),RY(F1.h)+22,{bg:'rgba(255,255,255,.92)',s:13,a:'left'});
    tile(40,344,350,112,'Dropped bag: height',f1(f.y(tt))+' m');tile(425,344,350,112,'Plane’s bag: height',f1(f.y(tt))+' m');tile(810,344,350,112,'Time',fx1(tt)+' s');
    T(run?'Level with each other at every flash: the fall is the same.':'Same height. Same instant. One is moving sideways at 60 m/s.',W/2,530,{s:22,w:700,a:'center'});}},
/* 5 */{ch:3,cap:'The braking picture again: space under a velocity line is distance. Sideways the line is flat: a <b>box</b>. Downward it climbs 9.8 m/s every second: a <b>triangle</b>. <b>Drag the bag down its path.</b>',
  alt:'Width times height of the blue box is how far it went sideways. Half the width times the height of the red triangle is how far it fell.',
  need:()=>S.ptMax<5.8?'Drag the bag all the way to the ground.':null,
  draw(){S.cam=0;world();const t=S.pt,x=REL+F1.x(t),y=F1.y(t);marker(REL,F1.h,{col:'#fff'});pathLine(F1,REL,F1.tf,{col:'rgba(255,255,255,.5)',dash:[5,5]});pathLine(F1,REL,t);
    seg(RX(REL),GY+15,RX(x),GY+15,COL.side,6);if(t>.6)pill(f1(F1.x(t))+' m',(RX(REL)+RX(x))/2,GY+15,{bg:COL.side,c:'#fff',s:12});
    seg(RX(x),RY(F1.h),RX(x),RY(y)-9,COL.down,5);if(t>1.2)pill(f1(F1.fall(t))+' m',RX(x)+34,(RY(F1.h)+RY(y))/2,{bg:COL.down,c:'#fff',s:12});
    bag(x,y);ctx.beginPath();ctx.arc(RX(x),RY(y)-4.5,13,0,7);ctx.strokeStyle='#1c1c1f';ctx.lineWidth=2;ctx.stroke();if(S.ptMax<.5){const pu=(Math.sin(performance.now()/260)+1)/2;ctx.beginPath();ctx.arc(RX(x),RY(y)-4.5,17+pu*8,0,7);ctx.strokeStyle='rgba(193,20,48,'+(.7-pu*.5)+')';ctx.lineWidth=3;ctx.stroke();}
    const ax={yt:[0,20,40,60,80],ys:2,tmax:6.5};axes(GS,Object.assign({title:'Sideways speed (m/s)'},ax));axes(GD,Object.assign({title:'Downward speed (m/s)'},ax));
    ctx.fillStyle='rgba(37,99,201,.25)';ctx.fillRect(GS.X(0),GS.Y(60),GS.X(t)-GS.X(0),GS.y-GS.Y(60));seg(GS.X(0),GS.Y(60),GS.X(6),GS.Y(60),'rgba(37,99,201,.35)',3);seg(GS.X(0),GS.Y(60),GS.X(t),GS.Y(60),COL.side,4);
    ctx.fillStyle='rgba(193,20,48,.22)';ctx.beginPath();ctx.moveTo(GD.X(0),GD.y);ctx.lineTo(GD.X(t),GD.Y(G*t));ctx.lineTo(GD.X(t),GD.y);ctx.closePath();ctx.fill();seg(GD.X(0),GD.Y(0),GD.X(6),GD.Y(58.8),'rgba(193,20,48,.35)',3);seg(GD.X(0),GD.Y(0),GD.X(t),GD.Y(G*t),COL.down,4);
    dot(GS.X(t),GS.Y(60),6,'#fff',C.ink);dot(GD.X(t),GD.Y(G*t),6,'#fff',C.ink);
    if(t>1){T(f1(F1.x(t))+' m',GS.X(t/2),GS.Y(30),{s:18,w:700,c:COL.side,a:'center'});}if(t>2.4)T(f1(F1.fall(t))+' m',GD.X(t*.68),GD.Y(G*t*.22),{s:16,w:700,c:COL.down,a:'center'});
    T('At '+fx1(t)+' s',900,392,{s:22,w:700});
    rich([['sideways',COL.side,700]],900,436,17);rich([['60 × '+fx1(t)+' = ',C.ink,500],[f1(F1.x(t))+' m',COL.side,700]],900,464,22);
    rich([['down',COL.down,700]],900,512,17);rich([['½ × 9.8 × '+fx1(t)+'² = ',C.ink,500],[f1(F1.fall(t))+' m',COL.down,700]],900,540,22);T('a box and a triangle',900,588,{s:15,c:C.mute});},
  down(x,y){this.move(x,y);return true;},move(x,y){let t;if(y<SH+10)t=(invRX(x)-REL)/60;else if(x<470)t=(x-GS.x)*GS.tmax/GS.w;else t=(x-GD.x)*GD.tmax/GD.w;S.pt=clamp(t,0,6);S.ptMax=Math.max(S.ptMax,S.pt);}},
/* 6 */{ch:3,dur:8,cap:'Now its speed as arrows. Blue, sideways, never changes: 60 m/s. Red, downward, grows 9.8 m/s every second. Tip to tail, they give the direction the bag is really moving. That is why the path bends.',
  alt:'The path points wherever the two arrows add up to. As the red arrow grows, the path tips further down.',
  draw(bt){S.cam=0;world();const t=clamp((bt-.8)*.95,0,6),k=.42;marker(REL,F1.h,{col:'#fff'});pathLine(F1,REL,F1.tf,{col:'rgba(255,255,255,.5)',dash:[5,5]});pathLine(F1,REL,t);
    for(let s=0;s<=Math.floor(t+1e-6);s++){const X=RX(REL+60*s),Y=RY(F1.y(s))-4,vy=G*s;arrow(X,Y,X+60*k,Y,COL.side,3,{head:8});if(vy>1)arrow(X+60*k,Y,X+60*k,Y+vy*k,COL.down,3,{head:8});if(vy>1)arrow(X,Y,X+60*k,Y+vy*k,COL.both,2,{head:7,alpha:.9});dot(X,Y,3.5,'#fff','#56606c');}
    bag(REL+F1.x(t),F1.y(t));const K=3.1,X0=90,Y0=412,vy=G*t;T('Speed, as two arrows',60,358,{s:20,w:700});
    arrow(X0,Y0,X0+60*K,Y0,COL.side,9);pill('sideways 60 m/s: never changes',X0+116,Y0-24,{bg:COL.side,c:'#fff',s:14});
    if(vy>.5){arrow(X0+60*K,Y0,X0+60*K,Y0+vy*K,COL.down,9);arrow(X0,Y0,X0+60*K,Y0+vy*K,COL.both,7);}
    pill('down '+f1(vy)+' m/s',X0+60*K+70,Y0+Math.max(vy*K/2,16),{bg:COL.down,c:'#fff',s:14});
    tile(520,352,300,112,'Time',fx1(t)+' s');tile(850,352,310,112,'Really moving at',f1(Math.hypot(60,vy))+' m/s',Math.round(mph(Math.hypot(60,vy)))+' mph');
    T('Blue stays. Red grows 9.8 every second.',520,520,{s:22,w:700});T('The green arrow is the two added together: the bag’s real velocity.',520,552,{s:17,c:C.mute});}},
/* 7 */{ch:4,cap:()=>S.mHit?'In the zone. The fall takes 5.0 s whatever the plane does, and in 5.0 s at 70 m/s the bags travel 350 m. <b>Time comes from the height. Distance comes from the speed.</b>':
    'New flight: lower and faster. <b>Work out where to let go, drag the marker there, and drop.</b> First find how long the fall takes. Then find how far the bags travel sideways in that time.',
  alt:'Two small problems, not one big one. The height tells you the time. The time and the plane’s speed tell you the distance.',
  need:()=>S.mHit?null:'Land the bags inside the drop zone.',
  ui:()=>'<button type="button" class="btn" data-drop="1">▼ Drop the bags</button><span class="small">'+(S.mR==null?'Drag the yellow marker first.':'Let go '+Math.round(Math.abs(DZ-S.mR))+' m '+(S.mR<=DZ?'before':'past')+' the X.')+(S.mTries?' Tries: '+S.mTries:'')+'</span>',
  act(d){if(d.drop&&S.mR!=null&&S.mT<0){S.mT=0;S.mTries++;}},enter(){S.mT=-1;},
  draw(bt,dt){S.cam=0;world({h:F2.h});const f=F2,g=S.mR==null?220:S.mR,running=S.mT>=0;if(running)S.mT+=dt;const t=running?S.mT-1.2:-9;
    if(running){const r=runDrop(f,g,t);marker(g,f.h,{label:'let go'});if(r.landed){const m=r.land-DZ,ok=Math.abs(m)<=DZW;landMark(r.land,ok);pill(ok?'in the drop zone ✓':missWord(m),clamp(RX(r.land),90,W-90),GY-22,{bg:ok?C.good:C.red,c:'#fff',s:13});if(ok)S.mHit=true;if(t>f.tf+1.4){S.mT=-1;S.mLast=m;}}}
    else{plane(-40,f.h);marker(g,f.h,{live:true,pulse:S.mR==null,label:S.mR==null?'drag me':'let go here'});if(S.mLast!=null&&!S.mHit){landMark(g+f.range,false);pill('last drop: '+missWord(S.mLast),clamp(RX(g+f.range),100,W-100),GY-22,{bg:C.red,c:'#fff',s:13});}}
    tile(40,344,270,112,'Height','122.5 m');tile(330,344,270,112,'Plane speed','70 m/s','about 157 mph');
    T('1. How long is the fall?',640,372,{s:19,w:700});rich([['½ × 9.8 × t² = 122.5 m',COL.down,700],['   →   t = ',C.ink,500],[(S.mTries>=1||S.mHit)?'5.0 s':'?',COL.down,700]],640,404,22);
    T('2. How far sideways in that time?',640,462,{s:19,w:700});rich([['70 m/s × t',COL.side,700],['  =  ',C.ink,500],[(S.mTries>=2||S.mHit)?'70 × 5.0 = 350 m':'?',COL.side,700]],640,494,22);
    T(S.mHit?'Let go 350 m before the X.':(S.mTries>=2?'So let go 350 m before the X.':(S.mTries===1?'A miss shows the fall time. Use it.':'Each miss fills in one answer.')),640,548,{s:17,c:C.mute});
    T('The drop zone is 120 m long.',40,490,{s:17,c:C.mute});T('Land inside it.',40,514,{s:17,c:C.mute});},
  down(x,y){if(y<SH+10&&S.mT<0){this.move(x);return true;}},move(x){S.mR=clamp(Math.round(invRX(x)/10)*10,0,780);S.mLast=null;}},
/* 8 */{ch:5,cap:'World Food Programme crews really do this, about 200 m up, when no road or river can reach people. Air slows real bags, so they land short of our model. <b>Switch the air on, then try your own drops.</b>',
  alt:'With air, the bags lose some sideways speed and fall a little slower, so they come down sooner along the ground.',
  uiStatic:true,uiSync:rSync,replay(){S.wT=0;},
  ui:()=>'<span class="seg" role="group" aria-label="Air">'+[[0,'No air'],[1,'With air']].map(a=>'<button type="button" data-air="'+a[0]+'" aria-pressed="'+(S.air===a[0])+'">'+a[1]+'</button>').join('')+'</span><label>Height <input type="range" id="w-h" min="60" max="180" step="10" value="'+S.wh+'"><output id="w-ho"></output></label><label>Plane speed <input type="range" id="w-v" min="30" max="70" step="5" value="'+S.wv+'"><output id="w-vo"></output></label><button type="button" class="btn" data-drop="1">▼ Drop</button><span class="small" style="display:block;margin-top:8px;flex-basis:100%"><b>Go deeper:</b> <a href="https://www.wfp.org/stories/airdrops-humanitarian-emergency-un-world-food-programme-sudan-syria" target="_blank" rel="noopener">How airdrops work, and when they are the only way ↗</a> · <a href="https://www.wfp.org/stories/backstory-wfps-airdrops-offer-food-lifeline-hungry-south-sudan" target="_blank" rel="noopener">Inside a South Sudan airdrop ↗</a></span>',
  act(d){if(d.air!=null&&d.air!==''&&d.drop==null){S.air=+d.air;S.wT=0;rSync();}if(d.drop)S.wT=0;},input(t){if(t.id==='w-h'){S.wh=+t.value;S.wT=-1;rSync();}if(t.id==='w-v'){S.wv=+t.value;S.wT=-1;rSync();}},
  enter(){S.wT=-1;},
  draw(bt,dt){if(S.wT>=0)S.wT+=dt;S.cam=0;const f=flight(S.wv,S.wh),rel=DZ-f.range,ap=airPath(S.wv,S.wh),aEnd=ap[ap.length-1],short=f.range-aEnd[1];world({h:f.h});
    marker(rel,f.h,{col:'#fff',label:'let go: '+Math.round(f.range)+' m early'});pathLine(f,rel,f.tf,{col:'rgba(255,255,255,.75)',dash:[6,5],w:2});
    if(S.air){ctx.save();ctx.strokeStyle='#fff';ctx.lineWidth=2.5;ctx.beginPath();ap.forEach((p,i)=>{if(i%8&&i!==ap.length-1)return;const X=RX(rel+p[1]),Y=RY(p[2])-4;if(i)ctx.lineTo(X,Y);else ctx.moveTo(X,Y);});ctx.stroke();ctx.restore();landMark(rel+aEnd[1],short<=DZW);
      pill('with air: '+Math.round(short)+' m short',RX(rel+aEnd[1])-70,GY-22,{bg:short<=DZW?C.good:C.red,c:'#fff',s:13});}
    const run=S.wT>=0,t=run?S.wT-1:-1;if(run){plane(rel+f.v*t,f.h);if(t>=0){if(S.air){const p=airAt(ap,t);bag(rel+p[1],p[2]);}else bag(rel+f.x(t),f.y(t));}}else plane(rel-70,f.h);
    tile(40,344,350,112,'The ramp opens','About 200 m up','World Food Programme crews');tile(425,344,350,112,'Airdropped in South Sudan, 2025','9,400 tons','of food, where nothing else gets in');tile(810,344,350,112,'On the ground','Everyone clear','a coordinator checks the drop zone');
    T('No air (our model)',60,512,{s:17,c:C.mute});rich([['lands in ',C.ink,500],[fx1(f.tf)+' s',COL.down,700],[', ',C.ink,500],[Math.round(f.range)+' m',COL.side,700],[' ahead',C.ink,500]],60,544,24);
    T('With air (rough estimate for a 50 kg bag)',620,512,{s:17,c:C.mute});rich([['lands in ',C.ink,500],[fx1(aEnd[0])+' s',COL.down,700],[', ',C.ink,500],[Math.round(aEnd[1])+' m',COL.side,700],[' ahead: ',C.ink,500],[Math.round(short)+' m short',C.red,700]],620,544,24);
    T('A model with no air would miss. Real crews fly a dry run over the zone first.',60,596,{s:15,c:C.mute});}}
];
function rSync(){const ho=$('w-ho'),vo=$('w-vo');if(ho)ho.textContent=S.wh+' m';if(vo)vo.textContent=S.wv+' m/s · '+Math.round(mph(S.wv))+' mph';$('act').querySelectorAll('[data-air]').forEach(x=>x.setAttribute('aria-pressed',String(+x.dataset.air===S.air)));}

Story.run({id:'projectile',lab:'PhysLab',H:H,off:0,chapters:CH,beats:BEATS,
  title:'Raider PhysLab · Where do you let go? (Projectiles, story version)',
  words:[['sideways',/sideways|horizontal/i],['down',/\bdown|vertical/i],['gravity',/gravity/i],['same time',/same time|together|same amount of time/i],['steady',/steady|constant|same speed/i]],
  order:['The ramp opens. The bags leave with the plane’s sideways speed.','Nothing pushes them sideways, so they keep that speed.','Gravity pulls down, so their downward speed grows every second.','They land under the plane, far ahead of where they were let go.'],
  state:{cam:0,g:null,view:'ground',seenPlane:0,rAns:null,rV:60,rSeen:{},rT:0,pt:0,ptMax:0,mR:null,mT:-1,mTries:0,mHit:false,mLast:null,air:0,wh:180,wv:60,wT:-1},
  frozen(S,qs){if(qs.has('rans')){S.rAns=qs.get('rans');S.rSeen={30:1,60:1,90:1};}if(qs.has('view')){S.view=qs.get('view');S.seenPlane=1;}S.ptMax=6;if(qs.has('hit'))S.mHit=true;},
  reset(S){Object.assign(S,{g:null,view:'ground',seenPlane:0,rAns:null,rV:60,rSeen:{},pt:0,ptMax:0,mR:null,mT:-1,mTries:0,mHit:false,mLast:null,air:0,wT:-1});},
  copyLines(S){const m=S.g==null?null:S.g+F1.range-DZ;return['My first release point: '+(S.g==null?'(skipped)':(S.g===DZ?'right above the X':Math.round(Math.abs(DZ-S.g))+' m '+(S.g<DZ?'before':'past')+' the X')+'. The bags landed '+missWord(m)+'. (The answer is 360 m before the X.)'),
    'Dropped bag vs. the bag from the plane: I picked '+({d:'the dropped bag',p:'the bag from the plane',t:'they land together'}[S.rAns]||'(skipped)')+'. They land together.',
    'My mission (122.5 m up, 70 m/s): '+(S.mHit?'landed in the zone after '+S.mTries+(S.mTries===1?' try':' tries'):'not finished')+'.'];}});
})();
