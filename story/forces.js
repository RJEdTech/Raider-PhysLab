/* Raider PhysLab story: What keeps it moving? (Forces and Newton's laws) */
(function(){
'use strict';
const {W,FONT,C,ctx,S,$,clamp,lerp,ease,ph,lin,mph,f1,fx1,rr,T,pill,rich,seg,arrow,tile,mul,axes,dot,handle,count}=Story;
const H=600,SH=268,GY=212,PXM=100,M1=25,FR=10,GRAV=9.8,NEST=0.274;
const COL={p:C.blue,f:C.red,net:C.teal,g:C.violet,n:C.amber,m:'#6f7680'};
const RX=x=>300+(x-S.cam)*PXM;

/* ---------- the model: one shove, then only friction ---------- */
function shove(P,m,f,t1){const a1=(P-f)/m,v1=a1*t1,a2=-f/m,t2=f>0?t1+v1/(f/m):1e9,x1=.5*a1*t1*t1,x2=f>0?x1+v1*v1/(2*f/m):1e9;
  return{P,m,f,a1,v1,a2,t1,t2,x1,x2,
    v(t){return t<=0?0:t<=t1?a1*t:t>=t2?0:v1+a2*(t-t1);},
    x(t){return t<=0?0:t<=t1?.5*a1*t*t:t>=t2?x2:x1+v1*(t-t1)+.5*a2*(t-t1)*(t-t1);},
    net(t){return t<0?0:t<t1?P-f:t<t2?-f:0;}};}
const SV=shove(60,M1,FR,1);          /* 60 N for 1 s on a 25 kg cart with 10 N of friction: 2 m/s, then 5 s of coasting, 6 m in all */
const ICE=shove(50,M1,0,1);          /* the same 2 m/s at release, no friction */
function netWord(n){return Math.abs(n)<.5?'0':f1(Math.abs(n))+' N '+(n>0?'forward':'backward');}

/* ---------- the scene: a store parking lot, to scale ---------- */
const RND=mul(5),SCR=[];for(let i=0;i<60;i++)SCR.push([RND()*40-10,RND(),RND()*.6+.2]);
function lot(o){o=o||{};ctx.save();ctx.beginPath();ctx.rect(0,0,W,SH);ctx.clip();
  let g=ctx.createLinearGradient(0,0,0,150);g.addColorStop(0,'#a5d0f0');g.addColorStop(1,'#e8f3fa');ctx.fillStyle=g;ctx.fillRect(0,0,W,152);
  const par=-(S.cam*14)%1500;
  for(const off of[-1500,0,1500]){const bx=par+off;ctx.fillStyle='#ddd2bf';ctx.fillRect(bx+40,70,1040,82);ctx.fillStyle='#b8a98e';ctx.fillRect(bx+40,62,1040,10);
    ctx.fillStyle='#86a3b8';for(let i=0;i<10;i++)ctx.fillRect(bx+72+i*100,102,74,50);ctx.fillStyle='#a8322a';ctx.fillRect(bx+372,86,360,10);ctx.fillStyle='#5f7d92';ctx.fillRect(bx+520,108,64,44);}
  ctx.fillStyle='#c9ccd0';ctx.fillRect(0,150,W,9);
  ctx.fillStyle=o.ice?'#dcebf4':'#3d4147';ctx.fillRect(0,159,W,SH-159);
  if(o.ice){ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=1.5;for(const s of SCR){const x=RX(s[0]),y=164+s[1]*96;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+60*s[2],y+2);ctx.stroke();}
    ctx.fillStyle='rgba(120,165,195,.25)';ctx.fillRect(0,159,W,4);}
  else{ctx.fillStyle='rgba(255,255,255,.78)';for(let k=Math.floor((S.cam-4)/2.74);k*2.74<S.cam+10;k++){const x=RX(k*2.74);ctx.beginPath();ctx.moveTo(x+30,159);ctx.lineTo(x+37,159);ctx.lineTo(x+9,197);ctx.lineTo(x,197);ctx.closePath();ctx.fill();}}
  const tc=o.ice?'#4b5a66':'#c7ccd3';
  for(let d=Math.ceil(S.cam-2.85);d<=S.cam+8.85;d++){const x=RX(d);ctx.fillStyle=tc;ctx.fillRect(x-.75,240,1.5,7);T(d===0?'0 m':String(d),x,262,{s:13,c:tc,a:'center'});}
  ctx.restore();ctx.fillStyle='#fff';ctx.fillRect(0,SH,W,H-SH);}
function cartShape(){const st='#7c8794';ctx.lineCap='round';ctx.lineJoin='round';
  ctx.strokeStyle=st;ctx.lineWidth=.03;ctx.beginPath();ctx.moveTo(-.86,.2);ctx.lineTo(-.16,.17);ctx.moveTo(-.88,.52);ctx.lineTo(-.86,.2);ctx.moveTo(-.2,.45);ctx.lineTo(-.16,.17);ctx.moveTo(-.86,.2);ctx.lineTo(-.84,.09);ctx.moveTo(-.16,.17);ctx.lineTo(-.15,.09);ctx.stroke();
  const basket=()=>{ctx.beginPath();ctx.moveTo(-.96,.99);ctx.lineTo(-.04,.9);ctx.lineTo(-.13,.44);ctx.lineTo(-.88,.52);ctx.closePath();};
  basket();ctx.fillStyle='rgba(222,228,236,.55)';ctx.fill();
  ctx.save();ctx.clip();ctx.lineWidth=.009;ctx.strokeStyle='rgba(96,108,122,.85)';ctx.beginPath();for(let x=-.94;x<0;x+=.066){ctx.moveTo(x,.4);ctx.lineTo(x+.012,1.02);}
  for(const k of[.25,.5,.75]){ctx.moveTo(-.97,lerp(.52,.99,k));ctx.lineTo(-.03,lerp(.44,.9,k));}ctx.stroke();ctx.restore();
  basket();ctx.lineWidth=.027;ctx.strokeStyle=st;ctx.stroke();
  ctx.lineWidth=.03;ctx.beginPath();ctx.moveTo(-.96,.99);ctx.lineTo(-1.0,1.03);ctx.stroke();ctx.fillStyle='#C11430';ctx.beginPath();ctx.arc(-1.0,1.035,.034,0,7);ctx.fill();
  for(const wx of[-.84,-.15]){ctx.fillStyle='#1f2226';ctx.beginPath();ctx.arc(wx,.0625,.0625,0,7);ctx.fill();ctx.fillStyle='#aab2bc';ctx.beginPath();ctx.arc(wx,.0625,.02,0,7);ctx.fill();}}
function cart(x,o){o=o||{};const p=o.p||PXM,px=o.px!=null?o.px:RX(x),py=o.py!=null?o.py:GY;ctx.save();if(o.alpha!=null)ctx.globalAlpha*=o.alpha;
  if(!o.noShadow){ctx.fillStyle='rgba(0,0,0,.2)';ctx.beginPath();ctx.ellipse(px-.5*p,py+3,.56*p,.05*p,0,0,7);ctx.fill();}
  ctx.translate(px,py);ctx.scale(p,-p);cartShape();ctx.restore();}
function train(x,n,o){o=o||{};for(let i=n-1;i>=0;i--)cart(x-i*NEST,o);}
function hands(xh,o){o=o||{};const p=o.p||PXM;ctx.save();ctx.translate(o.px!=null?o.px:RX(xh),o.py!=null?o.py:GY);ctx.scale(p,-p);if(o.alpha!=null)ctx.globalAlpha*=o.alpha;const up=o.up||0;
  ctx.lineCap='round';ctx.strokeStyle='#2a3f6b';ctx.lineWidth=.1;ctx.beginPath();ctx.moveTo(-.5,1.2+up);ctx.lineTo(-.1,1.07+up);ctx.stroke();
  ctx.fillStyle='#d9a441';ctx.beginPath();ctx.arc(-.035,1.05+up,.058,0,7);ctx.fill();ctx.restore();}
function fLabel(s,x,y,c,o){pill(s,x,y,Object.assign({bg:c,c:'#fff',s:14},o||{}));}
/* force arrows on the cart in the scene; sc = pixels per newton */
function pushArrow(x,P,sc,o){if(P<=0)return;const x0=RX(x-1.0),y=GY-1.22*PXM;arrow(x0,y,x0+P*sc,y,COL.p,7);if(!(o&&o.noLabel))fLabel('your push '+f1(P)+' N',x0+P*sc/2,y-18,COL.p);}
function fricArrow(x,f,sc,o){if(f<=0)return;const x0=RX(x-.5),y=GY+17;arrow(x0,y,x0-Math.max(f*sc,9),y,COL.f,7);if(!(o&&o.noLabel))fricLabelLeft(x,f,sc);}
function fricLabelLeft(x,f,sc){const x0=RX(x-.5)-Math.max(f*sc,9)-10;ctx.save();ctx.font='600 14px '+FONT;const w=ctx.measureText('friction '+f1(f)+' N').width+20;ctx.restore();pill('friction '+f1(f)+' N',x0-w/2,GY+17,{bg:COL.f,c:'#fff',s:14});}
function netArrowAbove(x,net,sc){if(Math.abs(net)<.5)return;const xc=RX(x-.5),y=GY-1.55*PXM;arrow(xc,y,xc+net*sc,y,COL.net,9);fLabel('net force '+netWord(net),xc+net*sc/2,y-20,COL.net);}

/* ---------- graphs ---------- */
function mk(g){g.X=t=>g.x+t*g.w/g.tmax;g.Y=v=>g.y-v*g.ys;return g;}
const G4=mk({x:680,y:556,w:460,h:215,tmax:8,ys:86});
const G5=mk({x:680,y:556,w:460,h:215,tmax:12,ys:64});
const G6=mk({x:210,y:556,w:780,h:228,tmax:8.2,ys:76});
const G9=mk({x:716,y:556,w:420,h:220,tmax:2,ys:55});
const G10=mk({x:716,y:556,w:420,h:220,tmax:5,ys:55});
function speedAxes(g,yt,o){axes(g,Object.assign({yt,ys:g.ys,tmax:g.tmax,title:'Speed (m/s)',sub:'',subx:0},o||{}));}
function shoveLine(g,m,tEnd,w){const N=160;ctx.save();ctx.lineWidth=w||4;ctx.lineCap='round';ctx.lineJoin='round';let prev=null;
  for(let i=0;i<=N;i++){const t=tEnd*i/N,P=[g.X(t),g.Y(m.v(t))];if(prev){ctx.strokeStyle=t<=m.t1+1e-6?COL.p:(t<=m.t2?COL.f:C.gray);ctx.beginPath();ctx.moveTo(prev[0],prev[1]);ctx.lineTo(P[0],P[1]);ctx.stroke();}prev=P;}ctx.restore();}

/* ---------- the big cart: build the picture of forces ---------- */
const BIG={p:190,X:700,Y:528};
const SLOT={p:{x1:372,y1:331,x2:500,y2:331,lab:'your push',lx:436,ly:305,short:'your push'},
  m:{x1:712,y1:413,x2:842,y2:413,lab:'a force of motion',lx:790,ly:387,short:'force of motion'},
  f:{x1:612,y1:549,x2:486,y2:549,lab:'friction',lx:549,ly:573,short:'friction'},
  g:{x1:585,y1:379,x2:585,y2:483,lab:'gravity',lx:540,ly:403,short:'gravity'},
  n:{x1:655,y1:524,x2:655,y2:421,lab:'the ground pushing up',lx:752,ly:483,short:'ground pushing up'}};
const TRUE_AFTER={p:0,f:1,m:0,g:1,n:1},KEYS=['p','f','m','g','n'];
function bigCart(states,o){o=o||{};cart(0,{p:BIG.p,px:BIG.X,py:BIG.Y});seg(430,BIG.Y,900,BIG.Y,'#b9bec6',2);
  for(const k of KEYS){const s=SLOT[k],st=states[k];if(st==='on'){arrow(s.x1,s.y1,s.x2,s.y2,COL[k],9);pill(s.lab,s.lx,s.ly,{bg:COL[k],c:'#fff',s:15});}
    else{arrow(s.x1,s.y1,s.x2,s.y2,'#9aa0a8',5,{dash:[7,6],alpha:st==='gone'?.55:.9});pill(s.lab,s.lx,s.ly,{bg:'#fff',bd:'#b9bec6',c:C.mute,s:15,alpha:st==='gone'?.6:1});
      if(st==='gone'){const mx=(s.x1+s.x2)/2,my=(s.y1+s.y2)/2;seg(mx-13,my-13,mx+13,my+13,C.red,4);seg(mx-13,my+13,mx+13,my-13,C.red,4);}}}}
function hitSlot(x,y){for(const k of KEYS){const s=SLOT[k],x0=Math.min(s.x1,s.x2,s.lx-70)-14,x1=Math.max(s.x1,s.x2,s.lx+70)+14,y0=Math.min(s.y1,s.y2,s.ly-14)-12,y1=Math.max(s.y1,s.y2,s.ly+14)+12;if(x>=x0&&x<=x1&&y>=y0&&y<=y1)return k;}return null;}
function score(){let n=0;for(const k of KEYS)if(!!S.pick[k]===!!TRUE_AFTER[k])n++;return n;}

/* ---------- Voyager 1, to scale, and its speed since Saturn ---------- */
const STARS=[];for(let i=0;i<90;i++)STARS.push([RND()*W,RND()*SH,RND()*1.3+.4,RND()*.6+.25]);
const VOY=(function(){/* a coast under the Sun's gravity alone (energy conservation), tuned to today's 17.0 km/s and about 172 AU; computed, not NASA tracking data */
  const GM=1.327e11,AU=1.496e8,YR=3.156e7,vinf2=17.0*17.0-2*GM/(172*AU),h=198*AU;let r=9.5*AU,t=1980.87;const pts=[];
  while(t<=2026.9){const v=Math.sqrt(vinf2+2*GM/r),vr=Math.sqrt(Math.max(0,v*v-h*h/(r*r)));pts.push([t,v,r/AU]);r+=vr*YR*.02;t+=.02;}return pts;})();
function voyager(cx,cy,k){ctx.save();ctx.translate(cx,cy);ctx.scale(k,-k);ctx.lineCap='round';
  ctx.strokeStyle='#aeb6c2';ctx.lineWidth=.09;ctx.beginPath();ctx.moveTo(.4,-.9);ctx.lineTo(11,-6.9);ctx.stroke();                 /* magnetometer boom, 13 m */
  ctx.lineWidth=.12;ctx.beginPath();ctx.moveTo(-.6,-.9);ctx.lineTo(-3.4,-2.6);ctx.stroke();ctx.fillStyle='#4a4f58';                  /* generator boom */
  for(let i=0;i<3;i++){ctx.save();ctx.translate(-3.4-i*.62,-2.6-i*.38);ctx.rotate(.55);ctx.fillRect(-.3,-.21,.6,.42);ctx.restore();}
  ctx.strokeStyle='#aeb6c2';ctx.beginPath();ctx.moveTo(.7,-.7);ctx.lineTo(3.0,.5);ctx.stroke();ctx.fillStyle='#d8dde4';ctx.fillRect(2.7,.25,.75,.6);   /* science boom and cameras */
  ctx.fillStyle='#b98f2a';ctx.beginPath();ctx.moveTo(-.9,-.55);ctx.lineTo(.9,-.55);ctx.lineTo(.75,-1.05);ctx.lineTo(-.75,-1.05);ctx.closePath();ctx.fill();      /* the ten-sided bus */
  ctx.fillStyle='#eef1f5';ctx.strokeStyle='#8f98a5';ctx.lineWidth=.06;ctx.beginPath();ctx.ellipse(0,0,1.83,.62,0,0,7);ctx.fill();ctx.stroke();            /* 3.7 m dish */
  ctx.fillStyle='#cfd5dd';ctx.beginPath();ctx.ellipse(0,.04,1.25,.36,0,0,7);ctx.fill();
  ctx.lineWidth=.05;ctx.beginPath();for(const a of[-1.2,0,1.2]){ctx.moveTo(a,.05);ctx.lineTo(0,1.15);}ctx.stroke();ctx.fillStyle='#8f98a5';ctx.beginPath();ctx.ellipse(0,1.15,.28,.11,0,0,7);ctx.fill();
  ctx.restore();}
function space(bt){ctx.save();ctx.beginPath();ctx.rect(0,0,W,SH);ctx.clip();ctx.fillStyle='#05070f';ctx.fillRect(0,0,W,SH);
  for(const s of STARS){const x=((s[0]-bt*6*s[2])%W+W)%W;ctx.fillStyle='rgba(255,255,255,'+s[3]+')';ctx.fillRect(x,s[1],s[2],s[2]);}
  voyager(430,96,22);ctx.restore();ctx.fillStyle='#fff';ctx.fillRect(0,SH,W,H-SH);
  pill('Voyager 1, drawn to scale: the dish is 3.7 m across',20,28,{a:'left',bg:'rgba(255,255,255,.92)',s:14});pill('engines silent, still moving',1010,28,{bg:C.teal,c:'#fff',s:15});}

/* ---------- beats ---------- */
const CH=['The shove','Net force','Force and speed','No friction','Mass','Your shift'];
function sandbox(){const n=S.sbN,P=S.sbP,f=FR*n,m=M1*n,net=P>f?P-f:0,a=net/m;return{n,P,f,m,net,a};}
function skVerdict(){let s=0,c=0;for(let i=40;i<S.sk.length;i++)if(S.sk[i]!=null){s+=S.sk[i];c++;}if(!c)return null;const v=s/c;return v<1.7?'slow':(v>2.3?'fast':'steady');}
function skPut(x,y){const t=G6.tmax*(x-G6.x)/G6.w,i=Math.round((t-1)*10),v=clamp((G6.y-y)/G6.ys,0,3);if(i<0||i>70)return;
  if(S.skPrev!=null&&S.skPrev!==i){const a=S.skPrev,va=S.sk[a]==null?v:S.sk[a],d=i>a?1:-1;for(let j=a+d;j!==i;j+=d)S.sk[j]=lerp(va,v,(j-a)/(i-a));}S.sk[i]=v;S.skPrev=i;}
function skDraw(alpha){ctx.save();ctx.globalAlpha=alpha==null?1:alpha;ctx.strokeStyle='#e08a00';ctx.lineWidth=5;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();let pen=false;
  for(let i=0;i<=70;i++){const v=S.sk[i];if(v==null){pen=false;continue;}const x=G6.X(1+i/10),y=G6.Y(v);if(pen)ctx.lineTo(x,y);else ctx.moveTo(x,y);pen=true;}ctx.stroke();ctx.restore();}
function skCount(){let c=0;for(const v of S.sk)if(v!=null)c++;return c;}
function holdStep(dt){if(dt<=0)return;const moving=S.hv>0,f=moving?FR:Math.min(FR,S.hP),net=S.hP-f;S.hv=clamp(S.hv+net/M1*dt,0,3.3);S.hx+=S.hv*dt;S.hT+=dt;S.hist.push([S.hT,S.hv]);while(S.hist.length&&S.hist[0][0]<S.hT-12)S.hist.shift();
  if(Math.abs(net)<1.2&&S.hv>.5)S.hold+=dt;else S.hold=0;if(S.hold>=3&&!S.won){S.won=true;count('story/PhysLab/forces/steady');}}
const MLINE={1:C.red,2:C.blue,5:C.violet,10:C.teal};

const BEATS=[
/* 0 */{ch:0,cap:'You shoved a shopping cart and let go. Nobody is touching it, and it is still rolling. <b>Tap every arrow you think is really pushing or pulling on the cart right now.</b>',
  alt:'Think about what is touching the cart at this moment, and what pulls on everything even without touching.',nextLabel:'Lock in my picture',
  need:()=>KEYS.some(k=>S.pick[k])?null:'Tap at least one arrow on the big cart.',
  draw(bt){S.cam=0;lot();const x=SV.x(1.9);hands(SV.x1-1.0,{up:.08});cart(x);for(let i=0;i<3;i++)seg(RX(x-1.25-i*.16),GY-80+i*22,RX(x-1.5-i*.16),GY-80+i*22,'rgba(255,255,255,.75)',3);
    pill('rolling at '+f1(SV.v(1.9))+' m/s',RX(x-.5),GY-1.28*PXM,{bg:'rgba(255,255,255,.95)',s:14});pill('your hands, left behind',RX(SV.x1-1.3),GY-1.5*PXM,{bg:'rgba(255,255,255,.95)',s:14});
    const st={};for(const k of KEYS)st[k]=S.pick[k]?'on':'ghost';bigCart(st);
    T('You shoved it.',50,360,{s:26,w:700});T('You let go.',50,398,{s:26,w:700});T('It is still rolling.',50,436,{s:26,w:700});
    T('Dashed arrows are only ideas.',50,490,{s:17,c:C.mute});T('Tap one to say it is real.',50,514,{s:17,c:C.mute});T('Tap again to take it back.',50,538,{s:17,c:C.mute});
    const n=KEYS.filter(k=>S.pick[k]).length;T(n+' of 5 picked',1150,580,{s:17,c:C.mute,a:'right',w:600});
    if(!n){const pu=(Math.sin(performance.now()/260)+1)/2;ctx.beginPath();ctx.arc(549,549,20+pu*8,0,7);ctx.strokeStyle='rgba(193,20,48,'+(.6-pu*.45)+')';ctx.lineWidth=3;ctx.stroke();}},
  down(x,y){const k=hitSlot(x,y);if(k){S.pick[k]=S.pick[k]?0:1;}return false;},cursor:(x,y)=>hitSlot(x,y)?'pointer':'default'},
/* 1 */{ch:0,dur:8.4,cap:()=>'Watch your hands. The push ends the instant they leave. After that the only sideways force is friction, and it points <b>backward</b>. Nothing pushes the cart forward. It rolls 5 more meters anyway.',
  alt:'A push needs something doing the pushing. Once your hands are gone, there is nothing left to push the cart forward.',
  draw(bt){S.cam=0;lot();const t=clamp(bt-.9,-.9,9),x=SV.x(t),on=t<SV.t1,moving=t>0&&t<SV.t2;
    for(let k=1;k<=Math.min(6,Math.floor(Math.max(0,t)));k++){dot(RX(SV.x(k)),230,4.5,k<=1?'#8fb6ff':'#ff9aa6');}
    hands(on?x-1.0:SV.x1-1.0,{up:on?0:.08});cart(x);if(on&&t>=0)pushArrow(x,60,2);if(moving)fricArrow(x,FR,2);
    pill(t<0?'ready':(on?'pushing':(moving?'hands off':'stopped')),20,26,{a:'left',bg:on&&t>=0?COL.p:'#444',c:'#fff',s:16});pill(f1(SV.v(t))+' m/s',RX(x-.5),GY-1.48*PXM-(on?26:0),{bg:'rgba(255,255,255,.95)',s:14});
    const after=t>=SV.t1;bigCart({p:after?'gone':'on',f:'on',m:'gone',g:'on',n:'on'});
    T(after?'After you let go':'While you push',50,330,{s:22,w:700});T(after?'Real forces: 3':'Real forces: 4',50,362,{s:18,c:C.mute});
    T('There is no “force of motion”.',50,420,{s:17,c:C.mute,alpha:lin(bt,2.4,.6)});T('Moving is not a force.',50,444,{s:17,c:C.mute,alpha:lin(bt,2.4,.6)});
    if(bt>7.4){const a=lin(bt,7.4,.6);ctx.save();ctx.globalAlpha=a;T('After you let go',870,330,{s:17,w:700});T('real?',1062,330,{s:15,c:C.mute,a:'center'});T('you said',1132,330,{s:15,c:C.mute,a:'center'});
      KEYS.forEach((k,i)=>{const y=362+i*30,tr=!!TRUE_AFTER[k],pk=!!S.pick[k],ok=tr===pk;T(SLOT[k].short,870,y,{s:15,c:COL[k],w:700});T(tr?'yes':'no',1062,y,{s:15,a:'center',w:600});T((pk?'yes':'no')+(ok?'  ✓':'  ✗'),1132,y,{s:15,a:'center',w:700,c:ok?C.good:C.red});});
      T('Your picture: '+score()+' of 5',870,532,{s:19,w:700});ctx.restore();}}},
/* 2 */{ch:1,dur:6.6,cap:'Line the arrows up, tip to tail. Whatever is left over is the <b>net force</b>: the single push that all the forces add up to. While you push: 50 N forward. After you let go: 10 N backward.',
  alt:'It is like a tug of war. 60 pulling one way and 10 pulling the other is the same as 50 pulling one way.',
  draw(bt){S.cam=0;lot();const first=bt<3.4,x=first?SV.x(.6):SV.x(2.4);hands(first?x-1.0:SV.x1-1.0,{up:first?0:.08});cart(x);if(first)pushArrow(x,60,2);fricArrow(x,FR,2);
    const k=5,X0=250,rowA=368,rowB=520,q=ph(bt,.8,1.2),qn=lin(bt,2.1,.6);
    T('While you push',60,rowA-50,{s:20,w:700});dot(X0,rowA,5,C.ink);arrow(X0,rowA,X0+60*k,rowA,COL.p,9);pill('push 60 N',X0+150,rowA-22,{bg:COL.p,c:'#fff',s:14});
    const fx=lerp(X0,X0+60*k,q),fy=lerp(rowA,rowA+16,q);arrow(fx,fy,fx-10*k,fy,COL.f,9);pill('friction 10 N',fx-25,fy+(q>.5?22:-22),{bg:COL.f,c:'#fff',s:14});
    if(qn>0){ctx.save();ctx.globalAlpha=qn;arrow(X0,rowA+50,X0+50*k,rowA+50,COL.net,11);pill('net force: 50 N forward',X0+125,rowA+76,{bg:COL.net,c:'#fff',s:15});rich([['60 N',COL.p,700],[' − ',C.ink,500],['10 N',COL.f,700],[' = ',C.ink,500],['50 N forward',COL.net,700]],680,rowA+14,28);ctx.restore();}
    const qb=lin(bt,3.6,.6),qbn=lin(bt,4.6,.6);if(qb>0){ctx.save();ctx.globalAlpha=qb;T('After you let go',60,rowB-50,{s:20,w:700});dot(X0,rowB,5,C.ink);arrow(X0,rowB,X0-10*k,rowB,COL.f,9);pill('friction 10 N',X0-10*k-66,rowB,{bg:COL.f,c:'#fff',s:14});ctx.restore();}
    if(qbn>0){ctx.save();ctx.globalAlpha=qbn;arrow(X0,rowB+40,X0-10*k,rowB+40,COL.net,11);pill('net force: 10 N backward',X0+14,rowB+40,{bg:COL.net,c:'#fff',s:15,a:'left'});rich([['0 N',COL.p,700],[' − ',C.ink,500],['10 N',COL.f,700],[' = ',C.ink,500],['10 N backward',COL.net,700]],680,rowB+14,28);ctx.restore();}}},
/* 3 */{ch:1,dur:7.2,cap:'Shrink the cart to a dot and keep the arrows. Your class calls this a <b>free-body diagram</b>. Gravity and the ground cancel each other. Only the sideways leftover changes the cart’s speed.',
  alt:'A free-body diagram is the same picture with the object drawn as a dot, so the arrows are easy to see.',
  draw(bt){S.cam=0;lot();const x=SV.x(.6);hands(x-1.0);cart(x);const sc=.4,cxp=RX(x-.5),D=[330,440],q=ph(bt,.6,1.6),canc=lin(bt,3,.8),z=ph(bt,4.6,1.2),hs=lerp(sc,2,z),va=1-canc*.58;
    const A={p:[RX(x-1.0),GY-1.22*PXM],f:[cxp,GY+17],g:[cxp,GY-58],n:[cxp+16,GY-2]};
    const at=k=>[lerp(A[k][0],D[0],q),lerp(A[k][1],D[1],q)];
    let P=at('g');arrow(P[0],P[1],P[0],P[1]+245*sc,COL.g,7,{alpha:va});P=at('n');arrow(P[0],P[1],P[0],P[1]-245*sc,COL.n,7,{alpha:va});
    P=at('p');arrow(P[0],P[1],P[0]+60*hs,P[1],COL.p,8);P=at('f');arrow(P[0],P[1],P[0]-Math.max(10*hs,7),P[1],COL.f,8);
    if(q>=1){dot(D[0],D[1],8,C.ink);pill('gravity 245 N',D[0]-70,D[1]+70,{bg:COL.g,c:'#fff',s:14,alpha:va});pill('ground 245 N',D[0]-66,D[1]-70,{bg:COL.n,c:'#fff',s:14,alpha:va});
      pill('push 60 N',D[0]+60*hs/2+22,D[1]-24,{bg:COL.p,c:'#fff',s:14});pill('friction 10 N',D[0]-10*hs-62,D[1]+(z>0?0:-24),{bg:COL.f,c:'#fff',s:14});
      T('Free-body diagram',D[0]-150,318,{s:20,w:700});}
    else{pill('gravity 245 N',cxp-78,GY-30,{bg:COL.g,c:'#fff',s:13,alpha:1-q});pill('ground pushes up 245 N',cxp+108,GY-60,{bg:COL.n,c:'#fff',s:13,alpha:1-q});}
    if(z>0)pill('sideways arrows zoomed in 5×',D[0]+60,D[1]+112,{bg:'#fff',bd:C.line,c:C.mute,s:13,alpha:z});
    const l1=lin(bt,3.2,.6),l2=lin(bt,5.6,.6),l3=lin(bt,6.2,.6);
    T('Up and down',650,372,{s:17,c:C.mute,alpha:l1});ctx.save();ctx.globalAlpha=l1;rich([['245 N',COL.n,700],[' − ',C.ink,500],['245 N',COL.g,700],[' = 0',C.ink,700]],650,406,28);ctx.restore();
    T('Sideways',650,462,{s:17,c:C.mute,alpha:l2});ctx.save();ctx.globalAlpha=l2;rich([['60 N',COL.p,700],[' − ',C.ink,500],['10 N',COL.f,700],[' = ',C.ink,500],['50 N forward',COL.net,700]],650,496,28);ctx.restore();
    if(l3>0){ctx.save();ctx.globalAlpha=l3;arrow(650,540,650+250,540,COL.net,11);pill('net force',650+125,566,{bg:COL.net,c:'#fff',s:15});ctx.restore();}}},
/* 4 */{ch:2,dur:9,cap:'Now watch the net force and the speed together. Net force forward: the cart speeds up. Net force backward: it slows down. A force does not keep it moving. A force <b>changes</b> its speed.',
  alt:'Look at the speed line only when the green bar is at zero. The line is flat then: no net force, no change in speed.',
  draw(bt){S.cam=0;lot();const t=clamp(bt-.9,-.9,8),x=SV.x(t),on=t>=0&&t<SV.t1,moving=t>0&&t<SV.t2,net=SV.net(t);
    hands(on||t<0?x-1.0:SV.x1-1.0,{up:on||t<0?0:.08});cart(x);if(on)pushArrow(x,60,2,{noLabel:true});if(moving)fricArrow(x,FR,2,{noLabel:true});netArrowAbove(x,net,2);
    T('Net force',60,318,{s:20,w:700});const cx=300,cy=420,k=4;seg(cx-220,cy,cx+220,cy,'#c9c9c4',2);seg(cx,cy-34,cx,cy+34,C.ink,2);T('backward',cx-220,cy+52,{s:14,c:C.mute});T('forward',cx+220,cy+52,{s:14,c:C.mute,a:'right'});
    if(Math.abs(net)>.5)arrow(cx,cy,cx+net*k,cy,COL.net,26,{head:34});else dot(cx,cy,9,COL.net);
    T(netWord(net),cx,cy-58,{s:34,w:700,a:'center',c:COL.net});
    pill(net>.5?'speeding up':(net<-.5?'slowing down':(t>=SV.t2?'stopped: speed not changing':'not moving yet')),cx,cy+96,{bg:net>.5?COL.p:(net<-.5?COL.f:'#555'),c:'#fff',s:17});
    speedAxes(G4,[0,.5,1,1.5,2,2.5]);if(t>0)shoveLine(G4,SV,Math.min(t,8));if(t>0)dot(G4.X(Math.min(t,8)),G4.Y(SV.v(t)),6,'#fff',C.ink);
    if(t>1.4)pill('+2 m/s every second',G4.X(.8),G4.Y(.55),{bg:COL.p,c:'#fff',s:13,a:'left',alpha:lin(t,1.4,.4)});
    if(t>4)pill('−0.4 m/s every second',G4.X(2.9),G4.Y(1.24)-30,{bg:COL.f,c:'#fff',s:13,a:'left',alpha:lin(t,4,.4)});
    if(t>6.4)pill('flat: no net force',G4.X(7),G4.Y(0)-20,{bg:'#555',c:'#fff',s:13,alpha:lin(t,6.4,.4)});}},
/* 5 */{ch:2,cap:()=>S.won?'Flat line. Your push and friction are equal and opposite, so the net force is <b>zero</b>, and the cart is still rolling. Zero net force means steady speed. “Stopped” is just a steady speed of zero.':
    'The cart is rolling and slowing down. <b>Drag the tip of your push arrow</b> until the speed line stays flat for 3 seconds.',
  alt:'Friction takes 10 N away. What push would give exactly that much back, no more and no less?',
  need:()=>S.won?null:'Drag the blue arrow until the speed line stays flat.',
  enter(){if(S.frozenHold)return;Object.assign(S,{hv:2,hx:0,hP:0,hT:0,hist:[],hold:0,won:false});},replay(){this.enter();},
  draw(bt,dt){holdStep(dt);S.cam=S.hx-2.6;lot();const x=S.hx,moving=S.hv>0,f=moving?FR:Math.min(FR,S.hP),net=S.hP-f;
    hands(x-1.0,{up:S.hP>0?0:.1});cart(x);pushArrow(x,S.hP,2,{noLabel:true});if(f>0)fricArrow(x,f,2,{noLabel:true});pill(fx1(S.hv)+' m/s',RX(x-.5),GY-1.5*PXM,{bg:'rgba(255,255,255,.95)',s:15});
    T('Your push',60,318,{s:20,w:700});const X0=250,y=392,k=4;dot(X0,y,5,C.ink);arrow(X0,y,X0-Math.max(f*k,8),y,COL.f,10);pill('friction '+f1(f)+' N',X0-f*k-72,y,{bg:COL.f,c:'#fff',s:14});
    if(S.hP>0)arrow(X0,y,X0+S.hP*k,y,COL.p,10);handle(X0+S.hP*k+(S.hP>0?4:0),y,!S.touched5);pill('your push '+f1(S.hP)+' N',X0+Math.max(S.hP*k/2,60),y-34,{bg:COL.p,c:'#fff',s:14});
    seg(X0,y+24,X0,y+92,'#c9c9c4',1.5,[4,4]);if(Math.abs(net)>.5)arrow(X0,y+70,X0+net*k,y+70,COL.net,12);else dot(X0,y+70,8,COL.net);
    pill('net force: '+netWord(net),X0+(net>0?Math.max(net*k/2,70):-20),y+102,{bg:COL.net,c:'#fff',s:15});
    if(!moving&&S.hP<=FR)pill('It stopped. Push harder than 10 N to get it rolling again.',X0+60,y+150,{bg:'#fff',bd:C.line,c:C.mute,s:14});
    speedAxes(G5,[0,1,2,3],{noT:true,xl:'the last 12 seconds'});ctx.save();ctx.strokeStyle=C.ink;ctx.lineWidth=3.5;ctx.lineJoin='round';ctx.beginPath();const t0=Math.max(0,S.hT-12);
    S.hist.forEach((p,i)=>{const X=G5.X(p[0]-t0),Y=G5.Y(p[1]);if(i)ctx.lineTo(X,Y);else ctx.moveTo(X,Y);});ctx.stroke();ctx.restore();
    if(S.hist.length){const p=S.hist[S.hist.length-1];dot(G5.X(p[0]-t0),G5.Y(p[1]),6,'#fff',C.ink);}
    const pr=clamp(S.hold/3,0,1);ctx.fillStyle='#ecece7';rr(G5.x+190,G5.y-G5.h-44,200,14,7);ctx.fill();ctx.fillStyle=S.won?C.good:COL.net;rr(G5.x+190,G5.y-G5.h-44,Math.max(8,200*(S.won?1:pr)),14,7);ctx.fill();
    T(S.won?'flat for 3 s ✓':'flat for 3 s',G5.x+400,G5.y-G5.h-32,{s:14,c:S.won?C.good:C.mute,w:600});},
  down(x,y){if(y>SH+60&&y<SH+200&&x<660){this.move(x);return true;}},move(x){S.touched5=true;S.hP=clamp(Math.round((x-250)/4),0,60);}},
/* 6 */{ch:3,cap:'Same shove, but now the lot is a sheet of ice with no friction at all. You let go at 2 m/s. <b>Draw what you think the speed does next.</b>',
  alt:'There is no right way to draw it yet. Picture the cart on perfect ice and draw what your gut says.',nextLabel:'See what happens',
  need:()=>skCount()<52?'Draw your line all the way across to 8 seconds.':null,
  ui:()=>'<button type="button" class="btn sm" data-clear="1">Erase my line</button>',act(d){if(d.clear){S.sk=new Array(71).fill(null);S.skPrev=null;}},
  draw(bt){S.cam=0;lot({ice:true});hands(-1.0);cart(0);pill('ice: no friction',RX(4),GY-40,{bg:'rgba(255,255,255,.95)',s:15});
    speedAxes(G6,[0,1,2,3]);shoveLine(G6,ICE,1,5);dot(G6.X(1),G6.Y(2),7,'#fff',C.ink);pill('you let go here: 2 m/s',G6.X(1)-6,G6.Y(2)-26,{bg:COL.p,c:'#fff',s:14,a:'left'});
    ctx.save();ctx.fillStyle='rgba(224,138,0,.06)';ctx.fillRect(G6.X(1),G6.y-G6.h,G6.X(8)-G6.X(1),G6.h);ctx.restore();skDraw();
    if(!skCount()){const pu=(Math.sin(performance.now()/260)+1)/2;ctx.beginPath();ctx.arc(G6.X(1),G6.Y(2),16+pu*9,0,7);ctx.strokeStyle='rgba(224,138,0,'+(.8-pu*.5)+')';ctx.lineWidth=3;ctx.stroke();T('Press here and draw to the right →',G6.X(1)+40,G6.Y(2)+44,{s:20,w:700,c:'#b36b00'});}},
  down(x,y){if(y>G6.y-G6.h-20&&y<G6.y+20&&x>G6.X(1)-20&&x<G6.X(8)+20){S.skPrev=null;skPut(x,y);return true;}},move(x,y){skPut(x,y);},cursor:()=>'crosshair'},
/* 7 */{ch:3,dur:9.4,cap:()=>{const v=skVerdict();return(v==='steady'?'You drew it holding steady, and that is what happens. ':(v==='slow'?'You drew it slowing down. Most people do, because every floor you have ever known has friction. ':(v==='fast'?'You drew it speeding up. ':'')))+'With no friction the net force is zero, so the speed never changes. That is <b>Newton’s first law</b>.';},
  alt:'Slowing down needs a backward force. On perfect ice there is none, so nothing can slow the cart.',
  draw(bt){const t=clamp(bt-.9,-.9,8.2),x=ICE.x(t),on=t>=0&&t<1;S.cam=Math.max(0,x-4.5);lot({ice:true});hands(on||t<0?x-1.0:ICE.x1-1.0,{up:on||t<0?0:.08});cart(x);if(on)pushArrow(x,50,2,{noLabel:true});
    pill(f1(ICE.v(t))+' m/s',RX(x-.5),GY-1.5*PXM,{bg:'rgba(255,255,255,.95)',s:15});if(t>=1)pill('net force: 0',RX(x-.5),GY-1.78*PXM,{bg:COL.net,c:'#fff',s:14});
    speedAxes(G6,[0,1,2,3]);ctx.save();ctx.setLineDash([7,6]);ctx.strokeStyle='#a9a9a4';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(G6.X(1),G6.Y(2));ctx.lineTo(G6.X(6),G6.Y(0));ctx.stroke();ctx.restore();
    T('gray dashes: the parking lot, with friction',G6.X(1.25),G6.Y(.22),{s:14,c:C.mute});skDraw(.75);
    const te=Math.max(0,Math.min(t,8.2));shoveLine(G6,ICE,te,5);if(t>0)dot(G6.X(te),G6.Y(ICE.v(te)),7,'#fff',C.ink);
    if(t>2){pill('on ice: steady 2 m/s',G6.X(Math.min(te,5.2)),G6.Y(2)-26,{bg:COL.f,c:'#fff',s:14});}
    T('your line',G6.X(8)+6,G6.Y(S.sk[70]==null?1:S.sk[70])+5,{s:14,c:'#b36b00',w:700});}},
/* 8 */{ch:3,dur:4.2,cap:'No engine has pushed Voyager 1 forward for decades. The Sun’s pull slowed it at first. That pull has faded to almost nothing, so now it holds 38,000 mph. On November 18, 2026 it reached one light-day from Earth.',
  alt:'Look at the line. Where the Sun pulled back hard, the speed dropped. Where almost nothing pulls, the line is flat.',
  ui:()=>'<span class="small">One light-day: a radio signal, moving at the speed of light, takes 24 hours to arrive. <a href="https://science.nasa.gov/mission/voyager/voyager-1/" target="_blank" rel="noopener">NASA: Voyager 1</a></span>',
  draw(bt){space(bt);tile(40,292,350,112,'Left Earth','1977','September 5');tile(425,292,350,112,'Last speed-up','1980','a swing past Saturn, no engine');tile(810,292,350,112,'Speed now','38,000 mph','17 km every second');
    const g={x:110,y:566,w:1000,h:108},X=yr=>g.x+(yr-1980)*g.w/47,Y=v=>g.y-(v-14)*g.h/8;
    for(const v of[16,18,20]){seg(g.x,Y(v),g.x+g.w,Y(v),C.grid,1);T(String(v),g.x-8,Y(v)+5,{s:13,c:C.mute,a:'right'});}T('km/s',g.x-8,Y(22)+8,{s:13,c:C.mute,a:'right'});
    for(let yr=1980;yr<=2025;yr+=5){seg(X(yr),g.y,X(yr),g.y+5,C.gray,1.5);T(String(yr),X(yr),g.y+20,{s:13,c:C.mute,a:'center'});}seg(g.x,g.y,g.x+g.w,g.y,C.ink,1.5);
    const n=Math.floor(VOY.length*lin(bt,.4,3));ctx.save();ctx.strokeStyle=COL.net;ctx.lineWidth=4;ctx.lineJoin='round';ctx.beginPath();for(let i=0;i<n;i++){const p=VOY[i];if(i)ctx.lineTo(X(p[0]),Y(p[1]));else ctx.moveTo(X(p[0]),Y(p[1]));}ctx.stroke();ctx.restore();
    T('Voyager 1’s speed since Saturn',g.x,g.y-g.h-18,{s:17,w:700});
    if(bt>1.2)pill('the Sun pulls back: slowing',X(1984.5),Y(19.4)-22,{bg:COL.f,c:'#fff',s:13,a:'left',alpha:lin(bt,1.2,.4)});
    if(bt>2.6)pill('almost no pull: nearly flat',X(2007),Y(17.2)-22,{bg:'#555',c:'#fff',s:13,alpha:lin(bt,2.6,.4)});
    if(bt>3.4){const a=lin(bt,3.4,.4);ctx.save();ctx.globalAlpha=a;dot(X(2026.88),Y(17),7,'#fff',COL.net);ctx.restore();pill('Nov 18, 2026: one light-day',X(2026.88)-96,Y(17)+26,{bg:COL.net,c:'#fff',s:13,alpha:a});}}},
/* 9 */{ch:4,cap:()=>S.mAns==null?'One cart, net force 50 N: its speed climbs 2 m/s every second. Now nest <b>two</b> carts and give the pair the same net force. <b>Which line will the speed follow?</b>':
    (S.mAns==='C'?'Yes, C. ':'It is C. ')+'Twice the mass, half the speed-up: the same push is shared by more stuff. That is <b>a = F ÷ m</b>, acceleration equals net force divided by mass. Now try 5 and 10 carts.',
  alt:'Think of pushing one cart, then a long row of carts, with the same effort. Which one gets up to speed faster?',
  need:()=>S.mAns==null?'Pick A, B or C.':((S.mSeen[5]&&S.mSeen[10])?null:'Try 5 carts and 10 carts.'),
  ui:()=>S.mAns==null?['A','B','C'].map(v=>'<button type="button" class="choice" data-mans="'+v+'">'+v+'</button>').join(''):
    '<span><b>Carts</b></span><span class="seg">'+[1,2,5,10].map(n=>'<button type="button" data-mn="'+n+'" class="'+(S.mSeen[n]?'done':'')+'" aria-pressed="'+(S.mN===n)+'">'+n+'</button>').join('')+'</span>',
  act(d){if(d.mans&&S.mAns==null){S.mAns=d.mans;S.mN=2;S.mSeen[2]=1;S.mT=0;count('story/PhysLab/forces/mass-'+(d.mans==='C'?'right':'wrong'));}if(d.mn){S.mN=+d.mn;S.mSeen[S.mN]=1;S.mT=0;}},
  enter(){S.mT=0;S.mSeen[1]=1;if(S.mAns==null)S.mN=1;},replay(){S.mT=0;},
  draw(bt,dt){S.mT+=dt;S.cam=0;lot();const n=S.mN,a=50/(M1*n),t=clamp((Story.frozen?bt:S.mT)-.5,0,2),x=.5*a*t*t+.2+(n-1)*NEST;
    hands(x-(n-1)*NEST-1.0);train(x,n);netArrowAbove(x,50,2);pill(f1(a*t)+' m/s',RX(x+.5),GY-70,{bg:'rgba(255,255,255,.95)',s:14});
    T('The same 50 N, shared',60,312,{s:20,w:700});T(n+(n===1?' cart':' carts')+' × 25 kg = '+M1*n+' kg',330,312,{s:17,c:C.mute});
    const rh=n>5?21:30,y0=338;for(let i=0;i<n;i++){const y=y0+i*rh;ctx.fillStyle='#e6e8ec';rr(60,y,84,rh-5,5);ctx.fill();T('25 kg',102,y+rh/2+2,{s:13,c:C.mute,a:'center',w:600});arrow(160,y+(rh-5)/2,160+(50/n)*5,y+(rh-5)/2,COL.net,n>5?7:9);}
    T(f1(50/n)+' N for each cart',160+(50/n)*5+14,y0+(rh-5)/2+5,{s:16,w:700,c:COL.net});
    rich([['a',C.ink,700],[' = ',C.ink,500],['50 N',COL.net,700],[' ÷ ',C.ink,500],[M1*n+' kg',C.ink,700],[' = ',C.ink,500],[f1(a)+' m/s²',MLINE[n],700]],60,588,26);
    speedAxes(G9,[0,1,2,3,4],{tstep:.5,tl:t=>f1(t)});
    for(const k of[1,2,5,10]){if(!S.mSeen[k]||(S.mAns==null&&k!==1))continue;const s=50/(M1*k),te=k===n?t:2;seg(G9.X(0),G9.Y(0),G9.X(te),G9.Y(s*te),MLINE[k],k===n?5:2.5);if(te>=1.9)T(k+(k===1?' cart':' carts'),G9.X(2)+6,G9.Y(s*2)+5,{s:13,w:700,c:MLINE[k]});}
    if(S.mAns==null){[['A',4],['B',2],['C',1]].forEach(q=>{const te=Math.min(2,4/q[1]);ctx.save();ctx.setLineDash([8,6]);seg(G9.X(0),G9.Y(0),G9.X(te),G9.Y(q[1]*te),'#555',2.5,[8,6]);ctx.restore();dot(G9.X(te*.62),G9.Y(q[1]*te*.62),14,'#fff','#555');T(q[0],G9.X(te*.62),G9.Y(q[1]*te*.62)+6,{s:17,w:700,a:'center'});});
      T('B lies on top of the one-cart line',G9.x,G9.y+40,{s:13,c:C.mute});}}},
/* 10 */{ch:5,cap:'Your shift. <b>Set your push and the number of carts, then run it.</b> Two things set how fast the row gets going: the net force on top, and the mass underneath.',
  alt:'Change one slider at a time. More push makes the line steeper. More carts makes it flatter.',
  uiStatic:true,uiSync:sbSync,replay(){S.sbRun=0;},
  ui:()=>'<label>Your push <input type="range" id="sb-p" min="0" max="200" step="10" value="'+S.sbP+'"><output id="sb-po"></output></label><label>Carts <input type="range" id="sb-n" min="1" max="10" step="1" value="'+S.sbN+'"><output id="sb-no"></output></label><button type="button" class="btn" data-run="1">▶ Run it</button>',
  act(d){if(d.run)S.sbRun=0;},input(t){if(t.id==='sb-p'){S.sbP=+t.value;S.sbRun=-1;sbSync();}if(t.id==='sb-n'){S.sbN=+t.value;S.sbRun=-1;sbSync();}},
  enter(){S.sbRun=-1;},
  draw(bt,dt){if(S.sbRun>=0)S.sbRun+=dt;const m=sandbox(),run=S.sbRun>=0,t=run?Math.min(S.sbRun,5):0,x=.5*m.a*t*t+.6+(m.n-1)*NEST;S.cam=Math.max(0,x-4.2);lot();
    hands(x-(m.n-1)*NEST-1.0);train(x,m.n);const sc=1;if(m.P>0){const x0=RX(x-(m.n-1)*NEST-1.0),y=GY-1.22*PXM;arrow(x0,y,x0+m.P*sc,y,COL.p,7);pill('push '+m.P+' N',x0+m.P*sc/2,y-18,{bg:COL.p,c:'#fff',s:14});}
    const fNow=m.P>m.f?m.f:Math.min(m.P,m.f);if(fNow>0){const x0=RX(x-.5),y=GY+17;arrow(x0,y,x0-fNow*sc,y,COL.f,7);pill('friction '+f1(fNow)+' N',x0-fNow*sc/2,y+22,{bg:COL.f,c:'#fff',s:13});}
    if(run)pill(f1(m.a*t)+' m/s · '+Math.round(mph(m.a*t))+' mph',RX(x+.6),GY-64,{bg:'rgba(255,255,255,.95)',s:14,a:'left'});
    T('What sets the speed-up',60,318,{s:20,w:700});
    const L=[[['net force',COL.net,700],[' = ',C.ink,500],[m.P+' N',COL.p,700],[' − ',C.ink,500],[m.f+' N',COL.f,700],[' = ',C.ink,500],[(m.P>m.f?f1(m.net)+' N':'0'),COL.net,700]],
      [['mass',C.ink,700],[' = '+m.n+' × 25 kg = ',C.ink,500],[m.m+' kg',C.ink,700]],
      [['a',C.ink,700],[' = ',C.ink,500],[f1(m.net)+' N',COL.net,700],[' ÷ ',C.ink,500],[m.m+' kg',C.ink,700],[' = ',C.ink,500],[(Math.round(m.a*100)/100)+' m/s²',C.red,700]]];
    L.forEach((p,i)=>rich(p,60,372+i*52,26));
    T(m.P<=m.f?'Not enough to beat friction. The row does not start.':'After 5 s: '+f1(m.a*5)+' m/s, about '+Math.round(mph(m.a*5))+' mph'+(m.a*5>4?'. Faster than you can run.':'.'),60,372+3*52,{s:18,c:C.mute});
    T('Friction here is 10 N for each cart.',60,588,{s:14,c:C.mute});
    const vmax=Math.max(3,Math.ceil(m.a*5)),step=vmax<=4?1:(vmax<=10?2:(vmax<=20?5:10)),yt=[];for(let v=0;v<=vmax;v+=step)yt.push(v);G10.ys=G10.h/vmax;speedAxes(G10,yt);
    if(vmax>=1.4){const y=G10.Y(1.4);seg(G10.x,y,G10.x+G10.w,y,'#b9b9b4',1.5,[6,5]);T('walking pace',G10.x+G10.w-4,y-6,{s:13,c:C.mute,a:'right'});}
    seg(G10.X(0),G10.Y(0),G10.X(5),G10.Y(m.a*5),C.red,run?2:4,run?[6,5]:null);if(run){seg(G10.X(0),G10.Y(0),G10.X(t),G10.Y(m.a*t),C.red,5);dot(G10.X(t),G10.Y(m.a*t),6,'#fff',C.ink);}}}
];
function sbSync(){const po=$('sb-po'),no=$('sb-no');if(po)po.textContent=S.sbP+' N';if(no)no.textContent=S.sbN+(S.sbN===1?' cart':' carts')+' · '+S.sbN*M1+' kg';}

Story.run({id:'forces',lab:'PhysLab',H:H,off:0,chapters:CH,beats:BEATS,
  title:'Raider PhysLab · What keeps it moving? (Forces, story version)',
  words:[['net force',/net force/i],['friction',/friction/i],['zero',/\bzero\b|\b0\b|balanced/i],['speed',/speed|velocity/i],['mass',/\bmass\b/i],['acceleration',/accelerat/i]],
  state:{cam:0,pick:{},hv:2,hx:0,hP:0,hT:0,hist:[],hold:0,won:false,touched5:false,sk:new Array(71).fill(null),skPrev:null,mAns:null,mN:1,mSeen:{},mT:0,sbP:80,sbN:3,sbRun:-1},
  frozen(S,qs){if(qs.has('picks'))for(const k of qs.get('picks'))S.pick[k]=1;if(qs.has('sim')){S.hP=+(qs.get('hp')||10);const n=+qs.get('sim')*50;for(let i=0;i<n;i++)holdStep(.02);S.touched5=true;}
    if(qs.has('sk')){const kind=qs.get('sk');for(let i=0;i<=70;i++)S.sk[i]=kind==='slow'?Math.max(0,2-i*.03):2;}
    if(qs.has('mans')){S.mAns=qs.get('mans');S.mSeen={1:1,2:1,5:1,10:1};S.mN=+(qs.get('mn')||2);}S.frozenHold=qs.has('sim');},
  reset(S){Object.assign(S,{pick:{},won:false,touched5:false,sk:new Array(71).fill(null),skPrev:null,mAns:null,mN:1,mSeen:{},sbRun:-1});},
  copyLines(S){const names={p:'my push',f:'friction',m:'a force of motion',g:'gravity',n:'the ground pushing up'},v=skVerdict();
    return['My first picture of the rolling cart: '+(KEYS.filter(k=>S.pick[k]).map(k=>names[k]).join(', ')||'(skipped)')+'. Right on '+score()+' of 5. (Really there: friction, gravity, the ground pushing up.)',
      'On ice I drew the speed '+(v==null?'(skipped)':(v==='steady'?'holding steady':(v==='slow'?'slowing down':'speeding up')))+'. It holds steady.',
      'Two carts, same net force: I picked '+(S.mAns||'(skipped)')+'. The answer is C, half as steep.',
      'Steady-speed challenge: '+(S.won?'done':'not finished')+'.'];}});
})();
