/* Raider PhysLab story kit.
   One shell for every "story version" page: the canvas, the step runner, the caption,
   Read aloud, "I don't get this step", Turn it in and Copy for Canvas.
   A lesson file draws its own scene and calls Story.run({...}). See the notes at the bottom. */
window.Story=(function(){
'use strict';
const W=1200;
const FONT='"Segoe UI",system-ui,-apple-system,Roboto,"Helvetica Neue",Arial,sans-serif';
const C={ink:'#1c1c1f',mute:'#5d5d63',line:'#d8d8d3',grid:'#ecece7',blue:'#2563c9',red:'#C11430',amber:'#c27a00',violet:'#6b3fd4',teal:'#0f7a72',flag:'#ffd23f',good:'#1b7339',gray:'#8a8a90'};
const cv=document.getElementById('stage'),ctx=cv.getContext('2d');
const $=id=>document.getElementById(id);
const qs=new URLSearchParams(location.search);
const FROZEN=qs.has('bt');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>{t=clamp(t,0,1);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;};
const ph=(bt,s,d)=>ease((bt-s)/d),lin=(bt,s,d)=>clamp((bt-s)/d,0,1);
const mph=v=>v*2.23694;
const f1=v=>(Math.round(v*10)/10).toFixed(1).replace(/\.0$/,'');
const fx1=v=>(Math.round(v*10)/10).toFixed(1);
const S={beat:0,bt:0,reached:{},aloud:false,capKey:'',capTxt:'',t0:0};
let CFG=null,BE=[],KK=1,H=600,OFF=0;

/* ---------- drawing helpers (logical 1200-wide canvas) ---------- */
function rr(x,y,w,h,r){ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,w,h,r);else ctx.rect(x,y,w,h);}
function T(s,x,y,o){o=o||{};ctx.save();ctx.font=(o.w||500)+' '+(o.s||16)+'px '+FONT;ctx.fillStyle=o.c||C.ink;ctx.textAlign=o.a||'left';ctx.textBaseline=o.b||'alphabetic';
  if(o.alpha!=null)ctx.globalAlpha*=o.alpha;ctx.fillText(s,x,y);const w=ctx.measureText(s).width;ctx.restore();return w;}
function pill(s,x,y,o){o=o||{};const sz=o.s||15;ctx.save();if(o.alpha!=null)ctx.globalAlpha*=o.alpha;ctx.font='600 '+sz+'px '+FONT;const w=ctx.measureText(s).width+20,h=sz+12;
  let px=o.a==='left'?x:x-w/2;px=clamp(px,6,W-w-6);ctx.fillStyle=o.bg||'#fff';rr(px,y-h/2,w,h,h/2);ctx.fill();if(o.bd){ctx.strokeStyle=o.bd;ctx.lineWidth=1.5;ctx.stroke();}
  ctx.fillStyle=o.c||C.ink;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(s,px+w/2,y+1);ctx.restore();}
function rich(parts,x,y,s){let cx=x;ctx.save();ctx.textAlign='left';ctx.textBaseline='alphabetic';for(const p of parts){ctx.font=(p[2]||500)+' '+s+'px '+FONT;ctx.fillStyle=p[1]||C.ink;ctx.fillText(p[0],cx,y);cx+=ctx.measureText(p[0]).width;}ctx.restore();return cx;}
function seg(x1,y1,x2,y2,c,w,dash){ctx.save();ctx.strokeStyle=c;ctx.lineWidth=w||2;if(dash)ctx.setLineDash(dash);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.restore();}
function tile(x,y,w,h,label,val,sub){ctx.save();ctx.fillStyle='#f5f5f2';rr(x,y,w,h,12);ctx.fill();T(label,x+18,y+30,{s:16,c:C.mute,w:600});T(val,x+18,y+h-22-(sub?22:0),{s:40,w:700});if(sub)T(sub,x+18,y+h-16,{s:17,c:C.mute});ctx.restore();}
function mul(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function axes(g,o){ctx.save();ctx.globalAlpha*=o.alpha==null?1:o.alpha;
  for(const v of o.yt){const y=g.y-v*o.ys;seg(g.x,y,g.x+g.w,y,C.grid,1);T(String(v),g.x-9,y+5,{s:14,c:C.mute,a:'right'});}
  if(!o.noT)for(let t=0;t<=Math.floor(o.tmax+1e-9);t+=(o.tstep||1)){const x=g.x+t*g.w/o.tmax;seg(x,g.y,x,g.y+5,C.gray,1.5);T(o.tl?o.tl(t):String(t),x,g.y+21,{s:14,c:C.mute,a:'center'});}
  seg(g.x,g.y,g.x+g.w,g.y,C.ink,1.5);seg(g.x,g.y,g.x,g.y-g.h-4,C.ink,1.5);
  T(o.xl||'time (s)',g.x+g.w,g.y+40,{s:14,c:C.mute,a:'right'});T(o.title,g.x-4,g.y-g.h-30,{s:17,w:700});if(o.sub)T(o.sub,g.x-4+o.subx,g.y-g.h-30,{s:15,c:C.mute});
  ctx.restore();}
function dot(x,y,r,fill,stroke){ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2.5;ctx.stroke();}}
function handle(x,y,pulse){if(pulse){const pu=(Math.sin(performance.now()/260)+1)/2;ctx.beginPath();ctx.arc(x,y,15+pu*8,0,7);ctx.strokeStyle='rgba(193,20,48,'+(.6-pu*.45)+')';ctx.lineWidth=3;ctx.stroke();}dot(x,y,10,'#fff',C.ink);dot(x,y,4,C.ink);}
function gauge(cx,cy,r,v){const mp=mph(v),a0=Math.PI*.85,a1=Math.PI*2.15,A=q=>a0+(a1-a0)*clamp(q/80,0,1);ctx.save();
  ctx.beginPath();ctx.arc(cx,cy,r,0,7);ctx.fillStyle='#15171c';ctx.fill();ctx.strokeStyle='#4a505b';ctx.lineWidth=Math.max(2,r*.05);ctx.stroke();
  for(let s=0;s<=80;s+=10){const a=A(s),big=s%20===0,c=Math.cos(a),sn=Math.sin(a);seg(cx+c*r*.88,cy+sn*r*.88,cx+c*r*(big?.72:.8),cy+sn*r*(big?.72:.8),'#cfd4da',Math.max(1.5,big?r*.035:r*.02));
    if(big&&r>60)T(String(s),cx+c*r*.56,cy+sn*r*.56+r*.06,{s:r*.16,c:'#cfd4da',a:'center',w:600});}
  const a=A(mp);seg(cx,cy,cx+Math.cos(a)*r*.8,cy+Math.sin(a)*r*.8,'#ff3b30',Math.max(2.5,r*.05));dot(cx,cy,Math.max(3,r*.08),'#e9ecf1');
  if(r>60){T(Math.round(mp)+' mph',cx,cy+r*.52,{s:r*.2,c:'#fff',a:'center',w:700});}ctx.restore();}
function arrow(x1,y1,x2,y2,c,w,o){o=o||{};const dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy);if(L<1.5)return;const ux=dx/L,uy=dy/L,hw=o.head||Math.min(15,Math.max(6,L*.5)),hl=Math.min(L,hw*1.25);
  ctx.save();if(o.alpha!=null)ctx.globalAlpha*=o.alpha;ctx.strokeStyle=c;ctx.fillStyle=c;ctx.lineWidth=w||6;ctx.lineCap='butt';if(o.dash)ctx.setLineDash(o.dash);
  if(L>hl){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2-ux*hl*.85,y2-uy*hl*.85);ctx.stroke();}ctx.setLineDash([]);
  ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-ux*hl-uy*hw*.62,y2-uy*hl+ux*hw*.62);ctx.lineTo(x2-ux*hl+uy*hw*.62,y2-uy*hl-ux*hw*.62);ctx.closePath();if(o.dash){ctx.lineWidth=2;ctx.stroke();}else ctx.fill();ctx.restore();}

/* ---------- canvas sizing ---------- */
function fit(){const box=$('stagebox'),wrapW=box.parentNode.clientWidth,HV=H-OFF;const top=box.getBoundingClientRect().top+window.scrollY;
  const availH=window.innerHeight-top-146;let w=Math.min(wrapW,Math.max(availH,330)*W/HV);w=Math.max(Math.min(wrapW,640),w);w=Math.min(w,wrapW);
  box.style.width=w+'px';const dpr=Math.min(window.devicePixelRatio||1,2.5);cv.width=Math.round(w*dpr);cv.height=Math.round(w*HV/W*dpr);KK=cv.width/W;}
window.addEventListener('resize',fit);

/* ---------- loop ---------- */
const B=()=>BE[S.beat];
let last=0;
function frame(ts){const now=ts/1000,dt=FROZEN?0:Math.min(.05,now-last||0);last=now;S.bt+=dt;
  if(CFG.frame)CFG.frame(dt,FROZEN);
  ctx.setTransform(KK,0,0,KK,0,-OFF*KK);ctx.clearRect(0,0,W,H);if(CFG.preDraw)CFG.preDraw();B().draw.call(B(),S.bt,dt);
  nav();requestAnimationFrame(frame);}

/* ---------- page chrome ---------- */
const capEl=$('cap'),actEl=$('act'),hintEl=$('hint'),nextB=$('next'),altEl=$('alt');
function count(path){(function go(n){const g=window.goatcounter;if(g&&typeof g.count==='function'){try{g.count({path,title:CFG?CFG.id+' story':'story',event:true});}catch(e){}}else if(n<20)setTimeout(()=>go(n+1),300);})(0);}
function speakable(html){const d=document.createElement('div');d.innerHTML=html;return d.textContent.replace(/m\/s²/g,' meters per second squared').replace(/m\/s/g,' meters per second').replace(/v₀/g,'v zero').replace(/½at²/g,'one half a t squared').replace(/−/g,'minus ').replace(/×/g,' times ').replace(/÷/g,' divided by ').replace(/mph/g,'miles per hour').replace(/\bN\b/g,'newtons').replace(/\bkg\b/g,'kilograms');}
function say(){if(!S.aloud||!('speechSynthesis'in window))return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(speakable(capEl.innerHTML));const vs=speechSynthesis.getVoices();const v=vs.find(x=>/Natural/.test(x.name)&&/en-US/.test(x.lang))||vs.find(x=>/en-US/.test(x.lang));if(v)u.voice=v;u.rate=.95;speechSynthesis.speak(u);}catch(e){}}
function canSkip(need,anim){return !!need&&!anim&&!FROZEN&&performance.now()-S.t0>45000;}
function nav(){const b=B(),cap=typeof b.cap==='function'?b.cap():b.cap,ui=b.ui?b.ui():'',key=S.beat+'|'+cap+'|'+(b.uiStatic?'':ui);
  if(key!==S.capKey){S.capKey=key;const changed=cap!==S.capTxt;S.capTxt=cap;if(changed)capEl.innerHTML=cap;actEl.innerHTML=ui;if(b.uiSync)b.uiSync();if(changed)say();}
  const anim=S.bt<(b.dur||0),need=b.need&&b.need(),skip=canSkip(need,anim),lastBeat=S.beat===BE.length-1;
  const lab=lastBeat?'Start over':(skip?'Skip this step':(b.nextLabel||'Next'));if(nextB.textContent!==lab)nextB.textContent=lab;nextB.classList.toggle('wait',!!need&&!anim&&!skip);
  const h=need&&!anim?need:'';if(hintEl.textContent!==h)hintEl.textContent=h;$('back').disabled=S.beat===0;$('replay').hidden=!b.dur&&!b.replay;}
function chs(){$('chs').innerHTML=CFG.chapters.map((c,i)=>'<li><button type="button" data-ch="'+i+'" class="'+(S.reached[i]?'seen':'')+'"'+(B().ch===i?' aria-current="step"':'')+'><b>'+(i+1)+'</b>'+c+'</button></li>').join('');
  $('count').textContent='Step '+(S.beat+1)+' of '+BE.length;}
function pad(n){return String(n).padStart(2,'0');}
function go(i){i=clamp(i,0,BE.length-1);S.beat=i;S.bt=0;S.capKey='';S.t0=performance.now();altEl.hidden=true;const b=B();S.reached[b.ch]=1;if(b.enter)b.enter();
  if(!S.reached['b'+i]){S.reached['b'+i]=1;count('story/'+CFG.lab+'/'+CFG.id+'/step-'+pad(i+1));}
  $('turnin').hidden=i!==BE.length-1;chs();try{history.replaceState(null,'','#s'+(i+1));}catch(e){}}
function next(){const b=B();if(S.bt<(b.dur||0)){S.bt=b.dur;return;}const n=b.need&&b.need();
  if(n&&!canSkip(n,false)){hintEl.textContent=n;if(hintEl.animate)hintEl.animate([{color:'#C11430'},{color:'#5d5d63'}],{duration:900});return;}
  if(n)count('story/'+CFG.lab+'/'+CFG.id+'/skip-'+pad(S.beat+1));
  if(S.beat===BE.length-1){if(CFG.reset)CFG.reset(S);S.reached={};go(0);return;}go(S.beat+1);}
function wire(){nextB.onclick=next;$('back').onclick=()=>go(S.beat-1);$('replay').onclick=()=>{const b=B();if(b.replay)b.replay();else S.bt=0;};
  $('aloud').onclick=()=>{S.aloud=!S.aloud;$('aloud').setAttribute('aria-pressed',S.aloud);if(S.aloud)say();else try{speechSynthesis.cancel();}catch(e){}};
  $('confused').onclick=()=>{altEl.textContent='Another way to say it: '+B().alt;altEl.hidden=false;count('confused/'+CFG.lab+'/'+(CFG.confusedId||CFG.id+'-story')+'/step-'+pad(S.beat+1));};
  $('chs').addEventListener('click',e=>{const b=e.target.closest('[data-ch]');if(b)go(BE.findIndex(x=>x.ch===+b.dataset.ch));});
  document.addEventListener('keydown',e=>{if(/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))return;if(e.key==='ArrowRight'){e.preventDefault();next();}else if(e.key==='ArrowLeft'){e.preventDefault();go(S.beat-1);}});
  actEl.addEventListener('input',e=>{const b=B();if(b.input)b.input(e.target);});
  actEl.addEventListener('click',e=>{const t=e.target.closest('button');const b=B();if(t&&b.act)b.act(t.dataset,t);});
  /* pointer */
  let dragging=false;
  const pos=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)*W/r.width,(e.clientY-r.top)*(H-OFF)/r.height+OFF];};
  cv.addEventListener('pointerdown',e=>{const b=B();if(!b.down)return;const p=pos(e);if(b.down(p[0],p[1])){dragging=true;try{cv.setPointerCapture(e.pointerId);}catch(_){}e.preventDefault();}});
  cv.addEventListener('pointermove',e=>{const b=B();const p=pos(e);cv.style.cursor=b.down?(b.cursor?b.cursor(p[0],p[1],dragging):(dragging?'grabbing':'grab')):'default';if(dragging&&b.move)b.move(p[0],p[1]);});
  const end=()=>{if(dragging&&B().up)B().up();dragging=false;};cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);}

/* ---------- turn it in ---------- */
function tiQs(){return[...document.querySelectorAll('#turnin textarea')];}
function tiWords(){const el=$('ti-words');if(!el||!CFG.words)return;const txt=tiQs().map(t=>t.value).join(' ');
  el.innerHTML='<span class="small">Words to use: </span>'+CFG.words.map(w=>'<span class="chip'+(w[1].test(txt)?' on':'')+'">'+w[0]+'</span>').join('');}
function tiInit(){const KEY='rjphyslab-story-'+CFG.id;
  try{const d=JSON.parse(localStorage.getItem(KEY)||'{}');tiQs().forEach((t,i)=>{t.value=(d.a&&d.a[i])||'';});$('ti-name').value=localStorage.getItem('raider-labs-name')||d.n||'';}catch(e){}
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify({a:tiQs().map(t=>t.value),n:$('ti-name').value}));if($('ti-name').value)localStorage.setItem('raider-labs-name',$('ti-name').value);}catch(e){}tiWords();};
  tiQs().forEach(t=>t.addEventListener('input',save));$('ti-name').addEventListener('input',save);tiWords();
  $('ti-vote').addEventListener('change',e=>{count('story/'+CFG.lab+'/'+CFG.id+'/vote-'+e.target.value);});
  $('ti-copy').onclick=()=>{const v=document.querySelector('input[name=vote]:checked'),vt={story:'This story version',current:'The current version',only:'I have only used this one'};
    const lines=[CFG.title,'Name: '+$('ti-name').value,'Date: '+new Date().toLocaleDateString(),''].concat(CFG.copyLines?CFG.copyLines(S):[],['']);
    tiQs().forEach(t=>{lines.push(t.dataset.label+': '+t.value,'');});lines.push('Which helped me see it better: '+(v?vt[v.value]:'(no answer)'));const txt=lines.join('\n');
    const done=()=>{$('ti-msg').textContent='Copied. Paste it into the Canvas text box.';};
    const fallback=()=>{const ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');done();}catch(e){$('ti-msg').textContent='Could not copy. Select the text and copy it by hand.';}ta.remove();};
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(done,fallback);else fallback();};}

/* ---------- start ---------- */
function run(cfg){CFG=cfg;BE=cfg.beats;H=cfg.H;OFF=cfg.off||0;Object.assign(S,cfg.state||{});
  if(FROZEN){for(const[k,v]of qs){if(k==='beat'||k==='bt')continue;const n=parseFloat(v);if(!isNaN(n)&&k in S)S[k]=n;}if(cfg.frozen)cfg.frozen(S,qs);}
  wire();tiInit();fit();
  const h=/^#s(\d+)$/.exec(location.hash),start=qs.has('beat')?+qs.get('beat'):(h?+h[1]-1:0);
  go(start);if(FROZEN)S.bt=parseFloat(qs.get('bt'));
  window.__story={S,BEATS:BE};requestAnimationFrame(frame);}

/* A lesson is a list of beats: {ch, cap, alt, dur?, need?, nextLabel?, ui?, uiStatic?, uiSync?, act?, input?,
   enter?, draw(bt,dt), down?/move?/up?, replay?, view...}.
   cap: the caption (40 words or fewer; string or function).  alt: a second way to say it.
   dur: seconds of animation; Next finishes it first.  need(): a hint string while the student still has to do something.
   Freeze any step for a screenshot with ?beat=N&bt=seconds (plus any numeric state key, e.g. &g1=42). */
return{W,FONT,C,cv,ctx,S,$,qs,clamp,lerp,ease,ph,lin,mph,f1,fx1,rr,T,pill,rich,seg,arrow,tile,mul,axes,dot,handle,gauge,count,run,go,get frozen(){return FROZEN;}};
})();
