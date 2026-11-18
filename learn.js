/* Learn it for Raider PhysLab. See BioLab learn.js for the field reference. */
(function(){
'use strict';
const H=BioLab.h,PAL=H.PAL,clamp=H.clamp;
const ease=x=>x<=0?0:x>=1?1:x*x*(3-2*x);
const lerp=(a,b,f)=>a+(b-a)*f;
function dim(ctx,LH,a){ctx.save();ctx.globalAlpha=a||0.93;ctx.fillStyle=PAL['cv-sol'];ctx.fillRect(0,0,800,LH);ctx.restore();}
/* a label box; x,y = centre */
function tag(ctx,s,x,y,k,o){o=o||{};const sz=(o.s||15)*k;ctx.font=(o.w||600)+' '+sz+'px '+H.FONT;const w=ctx.measureText(s).width+sz*1.1,h=sz*1.9;
  ctx.save();ctx.globalAlpha=o.alpha==null?1:o.alpha;H.rr(ctx,x-w/2,y-h/2,w,h,7);ctx.fillStyle=o.bg||PAL['cv-sol'];ctx.fill();ctx.lineWidth=o.hi?2.5:1.2;ctx.strokeStyle=o.hi?'#c8102e':PAL['cv-soft'];ctx.stroke();
  H.txt(ctx,s,x,y+1,{s:sz,w:o.w||600,c:o.c||PAL['cv-ink'],a:'center',b:'middle'});ctx.restore();return {w,h};}
function line(ctx,x1,y1,x2,y2,col){ctx.save();ctx.strokeStyle=col||PAL['cv-soft'];ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.beginPath();ctx.arc(x2,y2,3,0,6.29);ctx.fillStyle=col||PAL['cv-soft'];ctx.fill();ctx.restore();}
function scaleBar(ctx,x,y,px,lab,k){ctx.save();ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y-6);ctx.lineTo(x,y);ctx.lineTo(x+px,y);ctx.lineTo(x+px,y-6);ctx.stroke();H.txt(ctx,lab,x+px/2,y-9,{s:12*k,w:700,a:'center'});ctx.restore();}
/* a fat molecule (triglyceride): glycerol backbone with three long fatty-acid tails, about 2 nm long; to scale with R px = 2.5 nm */
function fat(ctx,x,y,R,ang){const nm=R/2.5,tail=nm*2.1;ctx.save();ctx.translate(x,y);ctx.rotate(ang||0);ctx.strokeStyle='#c99a06';ctx.fillStyle='#c99a06';ctx.lineWidth=nm*0.13;ctx.lineJoin='round';
  for(let i=-1;i<=1;i++){const y0=i*nm*0.45;ctx.beginPath();ctx.moveTo(0,y0);for(let j=1;j<=14;j++)ctx.lineTo(j*tail/14,y0+(j%2?1:-1)*nm*0.09);ctx.stroke();ctx.beginPath();ctx.arc(0,y0,nm*0.17,0,6.29);ctx.fill();}
  ctx.beginPath();ctx.moveTo(0,-nm*0.45);ctx.lineTo(0,nm*0.45);ctx.stroke();ctx.restore();}
function brace(ctx,x1,y1,x2,y2,lab,k,side){ctx.save();ctx.strokeStyle='#c8102e';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  const an=Math.atan2(y2-y1,x2-x1);[[x1,y1,an],[x2,y2,an+Math.PI]].forEach(([x,y,a])=>{ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a+0.45)*9,y+Math.sin(a+0.45)*9);ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a-0.45)*9,y+Math.sin(a-0.45)*9);ctx.stroke();});ctx.restore();
  tag(ctx,lab,(x1+x2)/2+(side||0),(y1+y2)/2-(side?0:20),k,{s:12});}

/* ---------- Motion in one dimension ---------- */
const A=sim=>sim.def.art;
function pXY(sim,i,t,val){const P=A(sim).P[i],tm=Math.max(10,Math.ceil(sim.t)),rng=i===0?[0,20]:i===1?[-4,4]:[-2,2];return [P.x+t/tm*P.w,P.y+P.h-(clamp(val,rng[0],rng[1])-rng[0])/(rng[1]-rng[0])*P.h];}
function slopeTri(sim,ctx,k,t1,t2,lab){const p=sim.p,x=t=>p.x0+p.v0*t+0.5*p.a*t*t;if(sim.t<t2)return;const a=pXY(sim,0,t1,x(t1)),b=pXY(sim,0,t2,x(t1)),c=pXY(sim,0,t2,x(t2));
  ctx.save();ctx.strokeStyle='#c8102e';ctx.lineWidth=2.5;ctx.setLineDash([5,3]);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.lineTo(c[0],c[1]);ctx.stroke();ctx.restore();tag(ctx,lab,(a[0]+c[0])/2+40,a[1]+18,k,{s:11,hi:true});}
function panelTag(sim,ctx,k,i,s,o){const P=A(sim).P[i];tag(ctx,s,P.x+P.w/2-6,P.y+P.h+40,k,Object.assign({s:12},o||{}));}
function riderTag(sim,ctx,k,s,o){const X=A(sim).SX(sim.st.x);tag(ctx,s,clamp(X,110,690),40,k,Object.assign({s:12,hi:true},o||{}));}
BioLab.addLearn({
motion1d: {
  goals: {
    bio: ['What position, velocity and acceleration each mean', 'How to read each one off a graph, and spot speeding up or slowing down', 'How to use this when you drive, run or try to catch someone'],
    honors: ['What position, velocity and acceleration each mean', 'Why the slope of a position graph is velocity, and the area under a velocity graph is displacement', 'How to use this when you drive, run or try to catch someone'],
    ap: ['What position, velocity and acceleration each mean', 'Why the slope of a position graph is velocity, and the area under a velocity graph is displacement', 'How to use this when you drive, run or try to catch someone']
  },
  matters: 'Every time you drive, run, bike or cross a street, your brain is judging position, speed and speeding up. These three graphs are the same ideas your phone uses to track a run and a car uses to brake.',
  startKey: 'cast', startRun: false,
  startOverlay(sim,ctx,LH,k){const X=A(sim).SX(sim.st.x),ty=A(sim).ty;
    tag(ctx,'You on a skateboard, drawn to scale (about 1.7 m tall)',clamp(X+190,240,560),70,k,{s:12});line(ctx,clamp(X+40,40,700),78,X+8,ty-40);
    tag(ctx,'Ruler: meters from the left end',560,ty+20,k,{s:12});
    panelTag(sim,ctx,k,0,'Where you are');panelTag(sim,ctx,k,1,'How fast, and which way');panelTag(sim,ctx,k,2,'Speeding up or slowing down');},
  steps: [
    { key: 'still', title: 'Position', set: { v0: 0 }, fresh: true, speed: 1,
      see: 'You stand still at the 2 m mark. The position graph is flat at 2 m; the velocity graph sits on zero.',
      why: '<b>Position</b> is where you are from a starting point. If it never changes, the line stays level.',
      overlay(sim,ctx,LH,k){const a=A(sim),X=a.SX(sim.st.x);brace(ctx,a.SX(0),56,X,56,'x = '+sim.st.x.toFixed(0)+' m from the left end',k,70);panelTag(sim,ctx,k,0,'Flat line = not moving',{hi:true});} },
    { key: 'steady', title: 'Steady speed', set: { v0: 1.5 }, fresh: true, speed: 1,
      see: 'You roll right at a steady 1.5 m/s. Even dots, a straight rising position line, and velocity flat at 1.5.',
      why: '<b>Velocity</b> is distance per second, with direction. Equal gaps make a straight line; steeper means faster.',
      so: { honors: 'The slope of the position graph is the velocity.' },
      overlay(sim,ctx,LH,k){slopeTri(sim,ctx,k,2,4,'3 m in 2 s = 1.5 m/s');tag(ctx,'Evenly spaced dots = steady speed',600,206,k,{s:12});} },
    { key: 'fast', title: 'Twice as fast', set: { v0: 3 }, fresh: true, speed: 1,
      see: 'Now 3 m/s. The gaps double and the position line is twice as steep. You reach the end in 6 s.',
      why: 'Twice the velocity, twice the distance each second. Speed shows as steepness.',
      overlay(sim,ctx,LH,k){slopeTri(sim,ctx,k,1,2,'3 m in 1 s = 3 m/s');panelTag(sim,ctx,k,0,'Steeper line = faster',{hi:true});} },
    { key: 'speedup', title: 'Speeding up', set: { v0: 0, a: 0.5 }, fresh: true, speed: 1,
      see: 'You start from rest and gain 0.5 m/s every second. The gaps grow, position curves up, and velocity climbs like a ramp.',
      why: '<b>Acceleration</b> is how fast velocity changes. Going a bit faster each second bends the position graph up.',
      overlay(sim,ctx,LH,k){riderTag(sim,ctx,k,'v = '+sim.st.v.toFixed(1)+' m/s');tag(ctx,'Gaps grow = speeding up',600,206,k,{s:12});panelTag(sim,ctx,k,1,'Climbs 0.5 m/s each second',{hi:true});} },
    { key: 'brake', title: 'Slowing down and turning around', set: { v0: 3, a: -0.5 }, fresh: true, speed: 1,
      see: 'You roll right at 3 m/s up a gentle slope (drawn flat) that pulls back at 0.5 m/s². The gaps shrink, you stop at 6 s, then roll back.',
      why: 'Opposite signs slow you down. At the turnaround velocity is zero, but acceleration isn’t.',
      overlay(sim,ctx,LH,k){const v=sim.st.v;riderTag(sim,ctx,k,Math.abs(v)<0.2?'v = 0 for an instant, but a is still −0.5':'v = '+v.toFixed(1)+' m/s,  a = −0.5 m/s²');panelTag(sim,ctx,k,1,'Crosses zero at the turnaround',{hi:true});} },
    { key: 'negfast', title: 'Negative does not mean slowing down', set: { x0: 18, v0: -1, a: -0.5 }, fresh: true, speed: 1,
      see: 'You start at 18 m rolling left (−1 m/s), and a slope speeds you up leftward: a = −0.5 m/s². Both negative, and the gaps grow.',
      why: 'Minus means “toward the left.” Same signs: speeding up. Opposite signs: slowing down.',
      overlay(sim,ctx,LH,k){riderTag(sim,ctx,k,'v and a both negative → speeding up');} },
    { key: 'race', title: 'Catching up', base: { mode: 'race', vA: 1.5, vB: 0.5, gap: 4 }, fresh: true, speed: 1,
      see: 'Your friend has a 4 m head start at 0.5 m/s; you walk at 1.5 m/s. Where the position lines cross, you are side by side.',
      why: 'You gain 1 m every second, so the 4 m lead lasts 4 s.',
      overlay(sim,ctx,LH,k){const s=sim.st;tag(ctx,s.meet?'Caught up: 4 s, at 6 m':'You gain 1 m every second',560,78,k,{s:12,hi:true});panelTag(sim,ctx,k,0,'Lines cross = side by side',{hi:true});} },
    { lvl: 'honors', key: 'area', title: 'Area under velocity = displacement', set: { v0: 1, a: 0.5 }, fresh: true, speed: 1,
      see: 'You start at 1 m/s and speed up at 0.5 m/s². The shaded area under the velocity line grows with your distance.',
      why: 'Each strip is velocity × time, a distance. Add them up: the area under a v–t graph is displacement.',
      overlay(sim,ctx,LH,k){const H=sim.st.h;if(H.length<2)return;ctx.save();ctx.fillStyle='rgba(200,16,46,.22)';ctx.beginPath();let z=pXY(sim,1,H[0].t,0);ctx.moveTo(z[0],z[1]);let area=0;
        H.forEach((r,i)=>{const q=pXY(sim,1,r.t,r.v);ctx.lineTo(q[0],q[1]);if(i)area+=(r.v+H[i-1].v)/2*(r.t-H[i-1].t);});z=pXY(sim,1,H[H.length-1].t,0);ctx.lineTo(z[0],z[1]);ctx.closePath();ctx.fill();ctx.restore();
        panelTag(sim,ctx,k,1,'Area = '+area.toFixed(1)+' m;  moved '+(sim.st.x-sim.st.xStart).toFixed(1)+' m',{hi:true});} }
  ],
  useIt: [
    { do: 'Keep a 3-second gap behind the car ahead.',
      why: 'Following distance is really about time. At 30 m/s (about 67 mph), three seconds is 90 m of road to react and brake. Colorado recommends a three-second following distance, and more on snow or ice.' },
    { do: 'Never read a text while driving.',
      why: 'Reading a text takes your eyes off the road for about 5 seconds. At 55 mph (about 25 m/s) that is roughly 120 m, longer than a football field, driven without looking (NHTSA).' },
    { do: 'Before passing on a two-lane road, count on it taking a while.',
      why: 'Only the difference in speed closes the gap. At 70 mph against a truck at 65 mph, you gain just 2.2 m/s, so getting 30 m past it takes about 13 seconds in the oncoming lane.' },
    { do: 'Read the graphs on your run or bike app.',
      why: 'A flat pace or speed line means a steady speed; a line that climbs means you sped up. It is the same velocity–time graph you just watched.' },
    { do: 'On a downhill (bike, board or skis), slow down early.',
      why: 'Going downhill, your speed grows every second, like the a = +0.5 step. The longer you wait, the faster you are going when you finally brake.' }
  ],
  tryIt: [
    { title: 'measure your walking speed (5 minutes)',
      steps: ['Measure 10 m along a hallway or sidewalk with a tape measure.', 'Have a friend time you with a phone stopwatch as you walk it at your normal pace.', 'Divide: speed = 10 m ÷ your time. Compare it with the 1.5 m/s in this tool.'],
      look: 'You just measured velocity the way the tool does: distance covered each second.' },
    { title: 'the catch-up challenge (10 minutes)',
      steps: ['Have a friend walk slowly (time them over 10 m too) with a 5 m head start.', 'Predict: catch-up time = 5 m ÷ (your speed − their speed).', 'Start together and time when you pull even.'],
      look: 'If your prediction is close, you have used the same idea as the race step: only the difference in speed closes the gap.' }
  ]
}
});
/* ---------- free fall ---------- */
const FF={XA:250,XB:360,GY:410,TOPY:58,R:{bowling:17,tennis:9,paper:11,feather:13}};
function ffY(sim,y,key){const ppm=(FF.GY-FF.TOPY)/sim.st.top;return FF.GY-y*ppm-(key?FF.R[key]:0);}
function ffArrow(ctx,x,y,len,col,w){if(Math.abs(len)<0.5)return;ctx.save();ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=w||3.5;const d=Math.sign(len);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+len-d*8);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x,y+len);ctx.lineTo(x-7,y+len-d*11);ctx.lineTo(x+7,y+len-d*11);ctx.closePath();ctx.fill();ctx.restore();}
function ffCard(ctx,k,lines,y){y=y||352;const h=12+lines.length*20;ctx.save();ctx.globalAlpha=0.97;ctx.fillStyle=PAL['cv-sol'];H.rr(ctx,506,y,284,h,8);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.stroke();ctx.restore();
  lines.forEach((L,i)=>{let sz=(L[2]||12.5)*k;ctx.font=(L[1]||500)+' '+sz+'px '+H.FONT;const tw=ctx.measureText(L[0]).width;if(tw>264)sz*=264/tw;H.txt(ctx,L[0],516,y+20+i*20,{s:sz,w:L[1]||500,c:L[3]||PAL['cv-ink']});});}
const FFDEF={objA:'bowling',objB:'tennis',h:10,air:false,planet:'earth',bounce:false,v0:0};
/* ---------- Think again: shared visual moves (pilot, Nov 17 2026) ----------
   A magenta badge marks a thinking moment; a dashed magenta "ghost" is a prediction
   (an old idea, or a model's rule) drawn beside what really happens. */
/* Magenta, because the series colors (s1–s6) already use purple, blue, red, green, orange and teal. */
function TK(){const c=(PAL['cv-bg']||'#fff').replace('#','');if(c.length>=6){const r=parseInt(c.slice(0,2),16),g=parseInt(c.slice(2,4),16),b=parseInt(c.slice(4,6),16);if((r*0.3+g*0.59+b*0.11)<110)return '#ec74da';}return '#a8178f';}
function TKA(a){return TK()==='#a8178f'?'rgba(168,23,143,'+a+')':'rgba(236,116,218,'+a+')';}
function thinkBadge(ctx,kind,label,k,tau,pos){k=Math.min(k,1.3);const sz=12.5*k;ctx.save();ctx.font='700 '+sz+'px '+H.FONT;const tw=ctx.measureText(label).width,ic=22*k,w=tw+ic+sz*1.6,h=sz*2.2;let x=pos&&pos.x!=null?pos.x:20,y=pos&&pos.y!=null?pos.y:18;if(pos&&pos.right)x=pos.right-w;
  H.rr(ctx,x,y,w,h,h/2);ctx.fillStyle=PAL['cv-sol'];ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=TK();ctx.stroke();
  const cx=x+sz*0.7+ic/2,cy=y+h/2;ctx.strokeStyle=TK();ctx.fillStyle=TK();ctx.lineWidth=1.8;
  if(kind==='old'){ctx.setLineDash([3,2.5]);ctx.beginPath();ctx.arc(cx+3*k,cy,6*k,0,6.29);ctx.stroke();ctx.setLineDash([]);[-3,0,3].forEach(d=>{ctx.beginPath();ctx.moveTo(cx-9*k,cy+d*k);ctx.lineTo(cx-4*k,cy+d*k);ctx.stroke();});}
  else if(kind==='assume'){const f=ease(clamp(((tau||0)-0.4)/0.5,0,1)),sw=20*k,sh=11*k;H.rr(ctx,cx-sw/2,cy-sh/2,sw,sh,sh/2);ctx.globalAlpha=0.25+0.75*f;ctx.fill();ctx.globalAlpha=1;ctx.stroke();
    ctx.beginPath();ctx.arc(cx-sw/2+sh/2+f*(sw-sh),cy,sh/2-1.5,0,6.29);ctx.fillStyle='#fff';ctx.fill();ctx.stroke();}
  else{ctx.beginPath();ctx.arc(cx-2*k,cy-2*k,5.5*k,0,6.29);ctx.stroke();ctx.lineWidth=2.6;ctx.beginPath();ctx.moveTo(cx+2*k,cy+2*k);ctx.lineTo(cx+7*k,cy+7*k);ctx.stroke();}
  H.txt(ctx,label,x+sz*0.7+ic+sz*0.4,cy+1,{s:sz,w:700,c:TK(),b:'middle'});ctx.restore();}
function ghostBall(ctx,x,y,r,a){ctx.save();ctx.globalAlpha=a==null?0.9:a;ctx.setLineDash([5,4]);ctx.lineWidth=2;ctx.strokeStyle=TK();ctx.fillStyle=TKA(.10);ctx.beginPath();ctx.arc(x,y,r,0,6.29);ctx.fill();ctx.stroke();ctx.restore();}
function ghostFeather(ctx,x,y,r,a){ctx.save();ctx.globalAlpha=a==null?0.9:a;ctx.translate(x,y);ctx.rotate(-0.5);ctx.setLineDash([4,3]);ctx.lineWidth=1.8;ctx.strokeStyle=TK();ctx.fillStyle=TKA(.10);
  ctx.beginPath();ctx.moveTo(-r+3,0);ctx.quadraticCurveTo(0,-11,r+3,-1);ctx.quadraticCurveTo(0,10,-r+3,0);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-r-1,0);ctx.lineTo(r+5,0);ctx.stroke();ctx.restore();}
/* where the no-air rule says a dropped object is at time t */
function ffRuleY(sim){const g=sim.p.planet==='moon'?1.62:sim.p.planet==='mars'?3.71:9.8;return Math.max(0,sim.p.h-0.5*g*sim.t*sim.t);}
function ffRuleT(sim){const g=sim.p.planet==='moon'?1.62:sim.p.planet==='mars'?3.71:9.8;return Math.sqrt(2*sim.p.h/g);}
/* Commit first: guess buttons in the step text. Real buttons, so keyboards work. The pick is kept in sim._picks[key]. */
function pickHTML(key,q,choices){return '<span class="think-pick" data-pick="'+key+'" role="group" aria-label="Your guess" style="display:block;margin-top:8px"><b style="color:'+TK()+'">'+q+'</b><br>'+choices.map(([v,l])=>'<button type="button" class="btn" data-pv="'+v+'" aria-pressed="false" style="border:2px solid '+TK()+';color:'+TK()+';background:transparent;margin:6px 8px 0 0">'+l+'</button>').join('')+'</span>';}
function pickSync(sim){const b0=sim.ui&&sim.ui.tourbar;if(!b0)return;b0.querySelectorAll('[data-pick]').forEach(g=>{const v=(sim._picks||{})[g.dataset.pick];g.querySelectorAll('[data-pv]').forEach(b=>{const on=b.dataset.pv===v;b.setAttribute('aria-pressed',String(on));b.style.background=on?TK():'transparent';b.style.color=on?'#fff':TK();});});}
function pickWire(sim){if(!sim._pickWired&&sim.ui&&sim.ui.tourbar){sim._pickWired=true;sim.ui.tourbar.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-pv]');if(!b)return;const g=b.closest('[data-pick]');sim._picks=sim._picks||{};sim._picks[g.dataset.pick]=b.dataset.pv;pickSync(sim);});}setTimeout(()=>pickSync(sim),0);}
const pickOf=(sim,key)=>(sim._picks||{})[key];
const FFGUESS={A:'Bowling first',T:'Together',B:'Tennis first'};
/* the no-air feather ghost, in lane B */
function ffFeatherGhost(sim,ctx,k,lab){const y=ffRuleY(sim),gy=ffY(sim,y,'feather');ghostFeather(ctx,FF.XB,gy,FF.R.feather);
  if(y<=0)tag(ctx,lab||('No-air rule: '+ffRuleT(sim).toFixed(2)+' s'),FF.XB-78,FF.GY-62,k,{s:12,c:TK()});}

BioLab.addLearn({
freefall: {
  goals: {
    bio: ['Whether a heavy object really falls faster than a light one, and why', 'What “g = 9.8 m/s²” means you will see', 'Why air makes a feather drift but barely slows a bowling ball', 'What happens to speed and acceleration when you throw something straight up'],
    honors: ['Whether a heavy object really falls faster than a light one, and why', 'What “g = 9.8 m/s²” means you will see', 'Why air makes a feather drift but barely slows a bowling ball', 'What happens to speed and acceleration when you throw something straight up', 'Why each bounce is lower than the last'],
    ap: ['Why every object falls with the same acceleration without air (a = F ÷ m)', 'What “g = 9.8 m/s²” means you will see', 'Why the velocity is zero at the top while the acceleration is not', 'Why drag grows until it equals the weight: terminal speed']
  },
  matters: 'Things fall around you all day: a phone off a table, a diver off a platform, a helmet hitting the road. Knowing how fast they speed up tells you how much time you have to react and how hard they hit.',
  question: 'You drop a 7 kg bowling ball and a 60 g tennis ball together from 10 m, about three stories up. The bowling ball is more than 100 times heavier. Does it land first, in ordinary air? And what if there were no air at all?',
  startKey: 'setup', startRun: false,
  startOverlay(sim,ctx,LH,k){tag(ctx,'Bowling ball: 7 kg',FF.XA-70,ffY(sim,10,'bowling')-34,k,{s:12,hi:true});tag(ctx,'Tennis ball: 60 g',FF.XB+60,ffY(sim,10,'tennis')-34,k,{s:12,hi:true});
    tag(ctx,'10 m: about the roof of a 3-story building',300,250,k,{s:12});},
  steps: [
    { key: 'setup', title: 'The drop tower', set: FFDEF, fresh: true, pause: true,
      see: 'Two balls sit on a ledge 10 m up. The ruler measures height; the stopwatch stops for each ball when it lands.<span class="think-pick" data-pick="ff" role="group" aria-label="Your guess" style="display:block;margin-top:8px"><b style="color:#a8178f">Your guess first: with no air, which lands first?</b><br><button type="button" class="btn" data-pv="A" aria-pressed="false" style="border:2px solid #a8178f;color:#a8178f;background:transparent;margin:6px 8px 0 0">Bowling ball first</button><button type="button" class="btn" data-pv="T" aria-pressed="false" style="border:2px solid #a8178f;color:#a8178f;background:transparent;margin:6px 8px 0 0">They land together</button><button type="button" class="btn" data-pv="B" aria-pressed="false" style="border:2px solid #a8178f;color:#a8178f;background:transparent;margin:6px 8px 0 0">Tennis ball first</button></span>',
      run(sim){pickWire(sim);},
      why: 'Same height, same moment, no air: the only difference is mass. (The balls are drawn bigger than scale.)',
      overlay(sim,ctx,LH,k){tag(ctx,'7 kg, 22 cm',FF.XA-60,ffY(sim,10,'bowling')-30,k,{s:12});tag(ctx,'60 g, 6.7 cm',FF.XB+56,ffY(sim,10,'tennis')-30,k,{s:12});tag(ctx,'Air: off',300,250,k,{s:13,hi:true});
        const g=pickOf(sim,'ff');if(g)tag(ctx,'Your guess: '+FFGUESS[g],647,345,Math.min(k,1.1),{s:13,c:TK()});} },
    { key: 'drop', title: 'Release both', set: FFDEF, fresh: true, speed: 0.5,
      see: 'Both balls let go at the same instant, in slow motion. They hit the ground together, at 1.43 s.',
      why: 'Without air, mass makes no difference to how a thing falls, even at more than 100 times the mass.',
      overlay(sim,ctx,LH,k){const A=sim.st.A,B=sim.st.B,g=pickOf(sim,'ff'),done=A.land!==null&&B.land!==null;if(done)tag(ctx,'Both landed at '+A.land.toFixed(2)+' s',305,360,k,{s:14,hi:true});else tag(ctx,'Which lands first?',305,250,k,{s:13});
        if(g)tag(ctx,'Your guess: '+FFGUESS[g]+(done?(g==='T'?'  ✓':'  ✗'):''),647,345,Math.min(k,1.1),{s:13,c:TK()});} },
    { key: 'old', title: 'The old idea', set: FFDEF, fresh: true, speed: 0.5,
      see: 'The dashed ball is the old idea: Aristotle said 117 times heavier falls 117 times faster. The real balls land together.',
      why: 'People believed it for 2,000 years. In 1586 Simon Stevin tested it, and his lead balls landed together. A good story is not evidence.',
      overlay(sim,ctx,LH,k,tau){thinkBadge(ctx,'old','What people used to think',k,tau);const gx=200,top=ffY(sim,10,'bowling'),bot=ffY(sim,0,'bowling'),landed=sim.t>0.012;
        if(landed){const f=clamp(1-(tau||0)/2.5,0.25,1);ctx.save();ctx.globalAlpha=f;ctx.strokeStyle=TK();ctx.setLineDash([3,6]);ctx.lineWidth=2;[-8,0,8].forEach(d=>{ctx.beginPath();ctx.moveTo(gx+d,top);ctx.lineTo(gx+d,bot-20);ctx.stroke();});ctx.restore();
          ghostBall(ctx,gx,bot,17);tag(ctx,'0.01 s',gx,bot-40,k,{s:12,c:TK()});}else ghostBall(ctx,gx,top,17);
        tag(ctx,'Old idea',gx-14,FF.GY+16,k,{s:11,c:TK()});
        const A=sim.st.A,B=sim.st.B;if(A.land!==null&&B.land!==null)tag(ctx,'Real: both at '+A.land.toFixed(2)+' s',330,250,k,{s:13,hi:true});} },
    { key: 'gain', title: 'Faster every second', pause: true,
      see: 'Faint circles show the bowling ball every 0.1 s, with its speed: 4.9 m/s at 0.5 s, 9.8 m/s at 1 s, 14 m/s at landing.',
      why: '<b>g = 9.8 m/s²</b>: it gains 9.8 m/s every second, so the circles spread out as it falls.',
      overlay(sim,ctx,LH,k){[[0.5,'0.5 s: 4.9 m/s'],[1,'1 s: 9.8 m/s'],[1.43,'1.43 s: 14 m/s']].forEach(([t,s])=>{const y=ffY(sim,Math.max(0,10-4.9*t*t),'bowling');line(ctx,FF.XA-82,y,FF.XA-20,y,'#c8102e');tag(ctx,s,FF.XA-82,y,k,{s:12,hi:true});});} },
    { key: 'mass', title: 'Why mass doesn’t matter', set: FFDEF, fresh: true, speed: 0.3,
      see: 'Red arrows show gravity’s pull. The bowling ball’s is about 117 times bigger; the tennis ball’s is a speck.',
      why: 'A bigger pull, but also more mass to move. Acceleration = force ÷ mass, so every object gets 9.8 m/s².',
      overlay(sim,ctx,LH,k){const A=sim.st.A,B=sim.st.B,ya=ffY(sim,A.y,'bowling'),yb=ffY(sim,B.y,'tennis');ffArrow(ctx,FF.XA,ya+17,90,'#c8102e');ffArrow(ctx,FF.XB,yb+9,2,'#c8102e',2);
        tag(ctx,'pull: 69 N',FF.XA-60,ya+70,k,{s:12,hi:true});tag(ctx,'pull: 0.59 N',FF.XB+62,yb+12,k,{s:12,hi:true});
        ffCard(ctx,k,[['acceleration = pull ÷ mass',700],['bowling: 69 N ÷ 7 kg = 9.8 m/s²'],['tennis: 0.59 N ÷ 0.06 kg = 9.8 m/s²']]);} },
    { key: 'air', title: 'Now add air', set: { objA: 'tennis', objB: 'feather', air: true, h: 3 }, fresh: true, speed: 1,
      see: 'A tennis ball and a feather from 3 m, with air. The dashed feather, the no-air rule, lands in 0.78 s. The real one takes about 5 s.',
      why: 'Air’s push nearly matches the feather’s tiny weight. The rule had a hidden assumption: no air.',
      overlay(sim,ctx,LH,k,tau){thinkBadge(ctx,'assume','Hidden assumption: no air',k,tau);ffFeatherGhost(sim,ctx,k);const B=sim.st.B;if(!B.rest){const yb=ffY(sim,B.y,'feather');ffArrow(ctx,FF.XB+30,yb,40,'#c8102e');ffArrow(ctx,FF.XB+44,yb,-38,'#1b6fb3');tag(ctx,'air pushes up',FF.XB+110,yb-24,k,{s:12,c:'#1b6fb3'});tag(ctx,'gravity pulls down',FF.XB+118,yb+30,k,{s:12,c:'#c8102e'});}} },
    { key: 'moon', title: 'On the Moon', set: { objA: 'bowling', objB: 'feather', air: true, planet: 'moon', h: 3 }, fresh: true, speed: 1,
      see: 'The same drop on the Moon. The feather falls beside the bowling ball, and they land together, slowly: g is only 1.62 m/s².',
      why: 'The Moon has no air, so the dashed no-air feather stays right on the real one. Where the assumption holds, the rule works.',
      overlay(sim,ctx,LH,k,tau){thinkBadge(ctx,'know','How do we know?',k,tau);ffFeatherGhost(sim,ctx,k,'Rule holds: no air');ffCard(ctx,k,[['Apollo 15, 1971',700],['David Scott dropped a hammer and'],['a falcon feather on the Moon.'],['They landed at the same time.']],340);} },
    { key: 'throw', title: 'Throw it up', set: { v0: 10 }, fresh: true, speed: 0.5,
      see: 'Both balls are thrown up at 10 m/s. The bowling ball’s velocity shrinks to zero at the top, then grows downward. Red arrow: acceleration.',
      why: 'The acceleration is 9.8 m/s² <b>downward</b> the whole time, even at the top, where the velocity is zero for an instant.',
      overlay(sim,ctx,LH,k){const A=sim.st.A;if(A.rest)return;const y=ffY(sim,A.y,'bowling');ffArrow(ctx,FF.XA-34,y-10,46,'#c8102e');tag(ctx,'a = 9.8 m/s² down',FF.XA-108,y+8,k,{s:12,c:'#c8102e'});
        const v=A.v;tag(ctx,(Math.abs(v)<0.6?'v = 0 at the top!':'v = '+(v>0?'+':'−')+Math.abs(v).toFixed(1)+' m/s '+(v>0?'↑ up':'↓ down')),FF.XA+108,y-6,k,{s:13,hi:Math.abs(v)<0.6});} },
    { key: 'vtgraph', title: 'The velocity–time graph', speed: 0.5,
      see: 'The 10 m/s throw as a graph. Velocity falls in a straight line, hits zero at the top (1.02 s), then goes negative.',
      why: 'The slope is the acceleration: −9.8 m/s², the same the whole way, even at the top where v = 0.',
      overlay(sim,ctx,LH,k,tau){const K=BioLab.lg,H=BioLab.h,P=H.PAL,kk=Math.min(k,1.25),p=tau%12,g=9.8,v0=10,T=2*v0/g,B={x0:100,x1:520,y0:70,y1:370},yv=v=>(v+12)/24;
        K.dim(ctx,LH);K.axes(ctx,B,k,{xr:[0,2.2],xt:[[0,'0'],[0.5,'0.5'],[1,'1.0'],[1.5,'1.5'],[2,'2.0']],yt:[[yv(-10),'−10'],[yv(0),'0'],[yv(10),'+10']],xl:'Time (s)',yl:'Velocity (m/s, up = +)'});
        ctx.save();ctx.setLineDash([5,5]);ctx.strokeStyle=P['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(B.x0,K.Y(B,yv(0)));ctx.lineTo(B.x1,K.Y(B,yv(0)));ctx.stroke();ctx.restore();
        const t=p<6?T*p/6:T,v=v0-g*t;K.curve(ctx,B,[0,2.2],x=>yv(v0-g*x),t,'#1f6feb');K.dot(ctx,K.X(B,[0,2.2],t),K.Y(B,yv(v)),'#c8102e',7);
        K.tagA(ctx,'v = '+(v>=0?'+':'−')+Math.abs(v).toFixed(1)+' m/s',790,40,k,{hi:true},'r');
        /* the ball on its own track, 50 px per meter: y = v0·t − ½gt² */
        const gx=690,gy=380,hy=gy-(v0*t-0.5*g*t*t)*50;ctx.save();ctx.strokeStyle=P['cv-soft'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(gx-40,gy+10);ctx.lineTo(gx+40,gy+10);ctx.stroke();ctx.restore();
        K.dot(ctx,gx,hy,'#1c1c1f',11);ctx.save();ctx.strokeStyle='#1f6feb';ctx.fillStyle='#1f6feb';ctx.lineWidth=3;const L=v*7;if(Math.abs(L)>4&&t<T-0.01){ctx.beginPath();ctx.moveTo(gx+24,hy);ctx.lineTo(gx+24,hy-L);ctx.stroke();ctx.beginPath();ctx.moveTo(gx+24,hy-L-(L>0?8:-8));ctx.lineTo(gx+18,hy-L);ctx.lineTo(gx+30,hy-L);ctx.closePath();ctx.fill();}ctx.restore();
        if(t>=T/2-0.02)K.tagA(ctx,'Top: v = 0',K.X(B,[0,2.2],T/2)+10,K.Y(B,yv(0))-26,k,{s:13},'l');
        if(p>6.5)K.tagA(ctx,'Slope = −9.8 m/s²',B.x1,K.Y(B,yv(7)),k,{s:13,hi:true},'r');} },
    { lvl: 'honors', key: 'bounce', title: 'Each bounce is lower', set: { objA: 'tennis', objB: 'bowling', bounce: true, e: 0.8, h: 5 }, fresh: true, speed: 1,
      see: 'A tennis ball dropped from 5 m on a bouncy floor. Dashed lines mark each bounce’s height.',
      why: 'Each rebound leaves at 80% of its landing speed. Height goes with speed squared, so each peak is 0.64 of the last.',
      overlay(sim,ctx,LH,k){const P=sim.st.A.peaks;let prev=5;P.slice(0,4).forEach((h,i)=>{const y=ffY(sim,h);ctx.save();ctx.setLineDash([5,4]);ctx.strokeStyle='#c8102e';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(FF.XA-40,y);ctx.lineTo(FF.XA+40,y);ctx.stroke();ctx.restore();
        tag(ctx,h.toFixed(2)+' m ('+(h/prev).toFixed(2)+'×)',FF.XA-110,y,k,{s:12,hi:i===0});prev=h;});} },
    { lvl: 'ap', key: 'terminal', title: 'Terminal speed', set: { objA: 'paper', objB: 'tennis', air: true, h: 50 }, fresh: true, speed: 1,
      see: 'Paper and a tennis ball from 50 m, with air. On the paper, gravity (red) stays the same while the air’s push (blue) grows until they match.',
      why: 'Drag grows with v². When drag equals weight, a = 0, and the speed stops growing: <b>terminal speed</b>, about 5 m/s here.',
      overlay(sim,ctx,LH,k){const A=sim.st.A;if(A.rest)return;const y=ffY(sim,A.y,'paper'),vt=5,f=Math.min(1,(A.v/vt)*(A.v/vt));ffArrow(ctx,FF.XA-30,y,60,'#c8102e');ffArrow(ctx,FF.XA-18,y,-60*f,'#1b6fb3');
        ffCard(ctx,k,[['paper: v = '+Math.abs(A.v).toFixed(2)+' m/s',700],['drag ÷ weight = '+f.toFixed(2)],[f>0.98?'drag = weight → a = 0':'still speeding up',600,12.5,f>0.98?'#1b6fb3':PAL['cv-ink']]]);} }
  ],
  useIt: [
    { do: 'Wear a bike helmet, even for short rides.',
      why: 'The federal bike-helmet test drops the helmet onto a steel anvil at 6.2 m/s, which is what you reach falling 2 m, about from a bike seat to the road. That takes only 0.64 s, too fast to catch yourself well (CPSC).' },
    { do: 'Never try to catch a falling knife. Step back and let it drop.',
      why: 'Your reaction time is about 0.2 s, the number you measure with the meter stick in class. By then the knife has already fallen 20 cm and is moving 2 m/s, and from counter height it reaches the floor in about 0.4 s. You would grab it blade first.' },
    { do: 'Never drop or throw anything off a balcony, bridge or overpass.',
      why: 'From 30 m up, even a small, compact object falls for about 2.5 s and hits at about 24 m/s (54 mph). Air barely slows heavy, compact things over that distance.' },
    { do: 'Check the water depth before you jump off a rock or a high dive.',
      why: 'From 10 m you hit the water at about 14 m/s (31 mph), whatever you weigh, and you keep moving down fast after you go under.' }
  ],
  tryIt: [
    { title: 'the ruler catch (2 minutes)',
      steps: ['Have a friend hold a ruler or meter stick hanging straight down, with the 0 mark between your open thumb and finger.', 'Without warning, they let go. Catch it as fast as you can and read where your fingers caught it.', 'Your reaction time is t = √(2d ÷ 9.8), with d in meters. Catching it at 20 cm means t = √(0.4 ÷ 9.8) = 0.20 s.'],
      look: 'Most people catch it between 15 and 30 cm, so 0.17 to 0.25 s. This is Lab #1 from class, and it shows how far things fall before you can react.' },
    { title: 'the paper and book drop (1 minute)',
      steps: ['Drop a flat sheet of paper and a book side by side. The paper flutters down slowly.', 'Now lay the paper flat on top of the book and drop them together.'],
      look: 'The paper rides down with the book. The book blocks the air from pushing up on it, so the paper falls as fast as the book. Air, not weight, slowed it the first time.' }
  ]
}
});
/* ---------- projectile motion ---------- */
const PJGY=386;
const pjS=sim=>{const st=sim.st;return st&&st.main>=0&&st.main<st.shots.length?st.shots[st.main]:null;};
const pjX=(sim,x)=>{const v=sim.vis.v;return v?v.ox+x*v.s:100+x*20;};
const pjY=(sim,y)=>{const v=sim.vis.v;return PJGY-y*(v?v.s:20);};
function pjAct(sim,id){const a=sim.def.actions.find(x=>x.id===id);if(a)a.run(sim);}
function pjClear(sim){const st=sim.st;st.shots=[];st.main=-1;st.twin=null;st.probe=-1;}
function pjCard(ctx,k,lines,x,y,w){x=x||520;y=y||48;w=w||268;const h=12+lines.length*20;ctx.save();ctx.globalAlpha=0.97;ctx.fillStyle=PAL['cv-sol'];H.rr(ctx,x,y,w,h,8);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.stroke();ctx.restore();
  lines.forEach((l,j)=>{const o=typeof l==='string'?[l]:l;H.txt(ctx,o[0],x+10,y+22+j*20,{s:(o[2]||13)*Math.min(k,1.3),w:o[1]||500,c:o[3]||PAL['cv-ink']});});}
/* a 1.8 m person drawn to the scene's scale */
function pjPerson(ctx,sim,xm){const s=sim.vis.v?sim.vis.v.s:20,x=pjX(sim,xm),y=PJGY,h=1.8*s;ctx.save();ctx.strokeStyle=PAL['cv-ink'];ctx.fillStyle=PAL['cv-ink'];ctx.lineWidth=Math.max(1.5,h*0.06);ctx.lineCap='round';
  ctx.beginPath();ctx.arc(x,y-h*0.92,h*0.08,0,6.29);ctx.fill();ctx.beginPath();ctx.moveTo(x,y-h*0.83);ctx.lineTo(x,y-h*0.45);ctx.moveTo(x,y-h*0.45);ctx.lineTo(x-h*0.12,y);ctx.moveTo(x,y-h*0.45);ctx.lineTo(x+h*0.12,y);ctx.moveTo(x-h*0.18,y-h*0.62);ctx.lineTo(x,y-h*0.75);ctx.lineTo(x+h*0.18,y-h*0.62);ctx.stroke();ctx.restore();}
const pjDeg=a=>a*Math.PI/180;

BioLab.addLearn({
projectile: {
  goals: {
    bio: ['Why a thrown or launched object follows a curved path', 'Why its sideways motion stays steady while its up-and-down motion changes', 'Why a ball dropped and a ball thrown sideways land at the same time', 'Which launch angle goes farthest, and why athletes often use a different one'],
    honors: ['How to split a launch velocity into horizontal and vertical parts', 'Why v<sub>x</sub> stays constant and v<sub>y</sub> changes by 9.8 m/s every second', 'How to use R = v²sin2θ/g on level ground', 'Which launch angle goes farthest, and why athletes often use a different one'],
    ap: ['How to treat horizontal and vertical motion as two separate problems linked by time', 'How to use R = v²sin2θ/g on level ground', 'How air resistance changes the path and the best angle', 'Why athletes often launch below 45°']
  },
  matters: 'Every ball you throw, kick or shoot, every jump and every stream of water from a hose follows the same rule: steady sideways, falling up and down. Once you can split a motion into those two parts, you can predict where things land, from a free throw to a long jump.',
  question: 'You get one throw to clear a creek 15 m wide, and you can throw at 15 m/s. Why does the ball’s path curve, where is it moving slowest, and what angle should you pick?',
  startKey: 'launch', startRun: true, startSpeed: 0.35,
  startOverlay(sim,ctx,LH,k){pjPerson(ctx,sim,-1.6);tag(ctx,'A 1.8 m person, to scale',pjX(sim,-1.6)+70,pjY(sim,1.8)-14,k,{s:12});tag(ctx,'Ruler in meters',400,PJGY+52,k,{s:12});},
  steps: [
    { key: 'launch', title: 'The launch', base: { mode: 'free', ang: 40, v0: 18, h0: 0, obj: 'cannon', twin: false, strobe: '0.25', vecs: false, air: false }, fresh: true, speed: 0.35,
      see: 'A cannonball leaves at 18 m/s (40 mph), aimed 40° up. The 1.8 m person is to scale with the ruler: the ball flies about 33 m.',
      why: 'After launch only gravity acts, pulling straight down (ignoring air). The ball is drawn bigger than scale.',
      overlay(sim,ctx,LH,k){pjPerson(ctx,sim,-1.6);tag(ctx,'18 m/s at 40°',pjX(sim,0)+40,pjY(sim,0)-60,k,{s:12.5,hi:true});tag(ctx,'1.8 m person, to scale',pjX(sim,-1.6)+18,pjY(sim,1.8)-60,k,{s:12});} },
    { key: 'dots', title: 'Steady sideways', speed: 0.35,
      see: 'A dot marks the ball every 0.25 s. The red ticks under the dots are evenly spaced.',
      why: 'Gravity pulls down, not sideways, so the forward speed never changes: 18 × cos 40° ≈ 13.8 m/s, about 3.4 m every 0.25 s.',
      overlay(sim,ctx,LH,k){const s=pjS(sim);if(!s)return;ctx.save();ctx.strokeStyle='#c8102e';ctx.lineWidth=2.5;s.dots.forEach(d=>{const x=pjX(sim,d.x);ctx.beginPath();ctx.moveTo(x,PJGY-12);ctx.lineTo(x,PJGY+4);ctx.stroke();ctx.setLineDash([3,4]);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,pjY(sim,d.y));ctx.lineTo(x,PJGY-12);ctx.stroke();ctx.setLineDash([]);ctx.lineWidth=2.5;});ctx.restore();
        tag(ctx,'same step sideways every 0.25 s: 13.8 m/s × 0.25 s ≈ 3.4 m',400,PJGY-30,k,{s:12.5,hi:true});} },
    { key: 'vert', title: 'Falling up and down', speed: 0.35,
      see: 'The same dots slid to the left edge, keeping only their height. They bunch up near the top and spread out coming down.',
      why: 'Up and down, it acts like a ball thrown straight up: gravity changes that speed by 9.8 m/s every second.',
      overlay(sim,ctx,LH,k){const s=pjS(sim);if(!s)return;const x=Math.max(24,pjX(sim,0)-60);ctx.save();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,PJGY);ctx.lineTo(x,40);ctx.stroke();
        s.dots.forEach(d=>{const y=pjY(sim,d.y);ctx.fillStyle='#c8102e';ctx.beginPath();ctx.arc(x,y,5,0,6.29);ctx.fill();ctx.strokeStyle='rgba(200,16,46,0.35)';ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(pjX(sim,d.x),y);ctx.stroke();ctx.setLineDash([]);});ctx.restore();
        tag(ctx,'heights only: bunched near the top',x+120,52,k,{s:12.5,hi:true});} },
    { key: 'arrows', title: 'Velocity arrows', set: { vecs: true }, speed: 0.35, run(sim){pjClear(sim);pjAct(sim,'fire');},
      see: 'Velocity arrows: tilted up at first, flat at the top, tilted down at the end, and shortest at the top.',
      why: 'Each arrow adds the steady forward part to the changing up-and-down part, so it tips over while its forward reach stays the same.',
      overlay(sim,ctx,LH,k){tag(ctx,'velocity arrows: forward part constant, up/down part changing',400,30,k,{s:12.5,hi:true});} },
    { key: 'graphs', title: 'The four motion graphs', speed: 0.5,
      see: 'The same 40° shot as four graphs: x–t a straight line, y–t a hill, vx flat at 13.8 m/s, vy falling steadily from +11.6 to −11.6 m/s.',
      why: 'Sideways there is no force: steady velocity. Up and down, gravity changes velocity by 9.8 m/s every second.',
      overlay(sim,ctx,LH,k,tau){const K=BioLab.lg;K.dim(ctx,LH);const kk=Math.min(k,1.25),sm=Math.min(1,1.1/k),p=tau%11,
        /* from sims/projectile.js: v = 18 m/s, 40°, g = 9.8, no air */
        G=9.8,vx=18*Math.cos(40*Math.PI/180),vy0=18*Math.sin(40*Math.PI/180),T=2*vy0/G,tt=Math.min(T,T*p/5),tr=[0,2.5],
        A={x0:84,x1:350,y0:66,y1:176},B={x0:484,x1:750,y0:66,y1:176},C={x0:84,x1:350,y0:274,y1:384},D={x0:484,x1:750,y0:274,y1:384},
        tx=[[0,'0'],[1,'1'],[2,'2']],col='#1f6feb',RD='#c8102e';
        const panel=(Bx,title,yt,yl,fn)=>{K.axes(ctx,Bx,k,{xr:tr,xt:tx,yt,xl:'t (s)',yl,ylOff:38});K.tagA(ctx,title,Bx.x0+6,Bx.y0-22,k,{s:13*sm},'l');K.curve(ctx,Bx,tr,t=>t>T?NaN:fn(t),tt,col);K.dot(ctx,K.X(Bx,tr,tt),K.Y(Bx,fn(tt)),RD,6);};
        panel(A,'x vs t',[[0,'0'],[0.5,'17'],[1,'35']],'x (m)',t=>vx*t/35);
        panel(B,'y vs t',[[0,'0'],[0.5,'4'],[1,'8']],'y (m)',t=>(vy0*t-0.5*G*t*t)/8);
        panel(C,'vx vs t',[[0,'0'],[0.5,'8'],[1,'16']],'vx (m/s)',t=>vx/16);
        ctx.save();ctx.setLineDash([4,4]);ctx.strokeStyle=BioLab.h.PAL['cv-soft'];ctx.beginPath();ctx.moveTo(D.x0,(D.y0+D.y1)/2);ctx.lineTo(D.x1,(D.y0+D.y1)/2);ctx.stroke();ctx.restore();
        panel(D,'vy vs t',[[0,'−12'],[0.5,'0'],[1,'+12']],'vy (m/s)',t=>(vy0-G*t+12)/24);
        if(p>5.5){K.tagA(ctx,'straight: steady speed',A.x0+8,A.y0+14,k,{s:12.5*sm},'l');K.tag(ctx,'top at 1.18 s',K.X(B,tr,1.18),B.y1-24,k,{s:12.5*sm});
          K.tagA(ctx,'flat: no sideways force',C.x1,C.y1-30,k,{s:12.5*sm},'r');K.tagA(ctx,'slope −9.8 m/s²',D.x1,D.y0+14,k,{s:12.5*sm,hi:true},'r');}} },
    { key: 'top', title: 'At the top it is still moving', set: { vecs: true }, speed: 0.35, run(sim){pjClear(sim);pjAct(sim,'fire');},
      see: 'The red ring marks the highest point. The card shows zero up-and-down velocity, but still 13.8 m/s forward.',
      why: 'The ball stops going <b>up</b>, not moving. At the top its speed is 13.8 m/s: the slowest point, but not zero.',
      overlay(sim,ctx,LH,k,tau){const s=pjS(sim);if(!s)return;if(s.tPeak!==null&&s.tPeak>0&&(s.done||s.vy<=0)){const a=0.5+0.5*Math.sin(tau*4);ctx.save();ctx.strokeStyle='#c8102e';ctx.lineWidth=3;ctx.globalAlpha=0.55+0.45*a;ctx.beginPath();ctx.arc(pjX(sim,s.peakX),pjY(sim,s.peakY),16,0,6.29);ctx.stroke();ctx.restore();}
        const vx=18*Math.cos(pjDeg(40));pjCard(ctx,k,[['At the top',700,13],'up-and-down: 0 m/s','forward: '+vx.toFixed(1)+' m/s',['speed: '+vx.toFixed(1)+' m/s, not zero',800,13,'#c8102e']]);} },
    { key: 'twin', title: 'Thrown sideways vs dropped', base: { mode: 'free', ang: 0, v0: 12, h0: 10, obj: 'cannon', twin: true, strobe: '0.25', vecs: false, air: false }, fresh: true, speed: 0.3, run(sim){pickWire(sim);},
      see: 'From 10 m up, one ball is fired sideways at 12 m/s as a twin drops. The dashed lines show them always level; both land after 1.43 s.<span class="think-pick" data-pick="pj" role="group" aria-label="Your guess" style="display:block;margin-top:8px"><b style="color:#a8178f">Your guess before the next step: on level ground, which launch angle throws farthest?</b><br><button type="button" class="btn" data-pv="30" aria-pressed="false" style="border:2px solid #a8178f;color:#a8178f;background:transparent;margin:6px 8px 0 0">30°</button><button type="button" class="btn" data-pv="45" aria-pressed="false" style="border:2px solid #a8178f;color:#a8178f;background:transparent;margin:6px 8px 0 0">45°</button><button type="button" class="btn" data-pv="60" aria-pressed="false" style="border:2px solid #a8178f;color:#a8178f;background:transparent;margin:6px 8px 0 0">60°</button></span>',
      why: 'Firing sideways adds no up-and-down speed, so both fall alike. Sideways speed decides <b>where</b> it lands (about 17 m out), not <b>when</b>.',
      overlay(sim,ctx,LH,k){const s=pjS(sim);if(!s)return;ctx.save();ctx.strokeStyle='#c8102e';ctx.lineWidth=1.5;ctx.setLineDash([5,4]);s.dots.forEach(d=>{const y=pjY(sim,d.y);ctx.beginPath();ctx.moveTo(pjX(sim,0),y);ctx.lineTo(pjX(sim,d.x),y);ctx.stroke();});ctx.restore();
        tag(ctx,'same height at every tick',pjX(sim,8),pjY(sim,10)-20,k,{s:12.5,hi:true});} },
    { key: 'fan', title: 'Which angle goes farthest?', base: { mode: 'free', ang: 40, v0: 18, h0: 0, obj: 'cannon', twin: false, strobe: '0.25', vecs: false, air: false }, fresh: true, speed: 1, run(sim){pjClear(sim);pjAct(sim,'fan');},
      see: 'Eleven balls at 18 m/s, from 20° to 70°. 45° lands farthest, about 33 m; 30° and 60° land together at 28.6 m.',
      why: 'Low shots move forward fast but land soon; high shots stay up but barely move forward. With no air, 45° balances them.',
      overlay(sim,ctx,LH,k){const g=pickOf(sim,'pj');if(g)tag(ctx,'Your guess: '+g+'°'+(g==='45'?'  ✓':'  ✗'),280,30,Math.min(k,1.1),{s:13,c:TK()});const R=a=>18*18*Math.sin(2*pjDeg(a))/9.8;tag(ctx,'45°: '+R(45).toFixed(1)+' m',pjX(sim,R(45)),PJGY-26,k,{s:12.5,hi:true});tag(ctx,'30° and 60°: '+R(30).toFixed(1)+' m',pjX(sim,R(30))-70,PJGY-62,k,{s:12});} },
    { lvl: 'honors', key: 'range', title: 'The range equation', base: { mode: 'free', ang: 40, v0: 18, h0: 0, obj: 'cannon', twin: false, strobe: '0.25', vecs: false, air: false }, fresh: true, speed: 0.6, run(sim){pjClear(sim);pjAct(sim,'fire');},
      see: 'One 40° shot. The card works out R = v²sin2θ/g, and the ruler shows the same landing distance.',
      why: 'Time aloft is t = 2v sinθ/g; distance is v cosθ × t = v² sin 2θ/g. It works only if it lands at launch height, with no air.',
      overlay(sim,ctx,LH,k){const s=pjS(sim),R=18*18*Math.sin(2*pjDeg(40))/9.8;pjCard(ctx,k,[['R = v² sin 2θ ÷ g',700,13],'= 18² × sin 80° ÷ 9.8',['= '+R.toFixed(1)+' m',800,14,'#c8102e'],[s&&s.done?'landed at '+s.x.toFixed(1)+' m':'in flight…',600,12,PAL['cv-soft']]]);} },
    { key: 'air', title: 'The hidden assumption: no air', base: { mode: 'free', ang: 35, v0: 35, h0: 0, obj: 'baseball', twin: false, strobe: '0.25', vecs: false, air: false }, fresh: true, speed: 1,
      run(sim){pjClear(sim);BioLab.setValues(sim,{air:false});pjAct(sim,'fire');BioLab.setValues(sim,{air:true});pjAct(sim,'fire');},
      see: 'Two baseballs at 35 m/s and 35°. Dashed: the no-air path, about 117 m. Solid: the real ball, lower and shorter.',
      why: { bio: 'Air pushes back harder the faster the ball goes. “45° goes farthest” assumed no air; with air, the best angle is lower.', ap: 'Drag grows with speed squared and steals forward speed the whole way. It hurts high, long flights most, so with air the best angle is below 45°.' },
      overlay(sim,ctx,LH,k,tau){thinkBadge(ctx,'assume','Hidden assumption: no air',k,tau);const g0=(sim.st.shots||[]).find(q=>!q.air);
        if(g0&&g0.trail.length>1){ctx.save();ctx.setLineDash([6,5]);ctx.strokeStyle=TK();ctx.lineWidth=3;ctx.beginPath();g0.trail.forEach((q,i)=>{const X=pjX(sim,q[0]),Y=pjY(sim,q[1]);i?ctx.lineTo(X,Y):ctx.moveTo(X,Y);});ctx.stroke();ctx.restore();
          if(g0.done)tag(ctx,'No-air rule',Math.min(pjX(sim,g0.x),740),PJGY-52,Math.min(k,1.1),{s:12,c:TK()});}const s=pjS(sim),R=35*35*Math.sin(2*pjDeg(35))/9.8;pjCard(ctx,k,[['Baseball, 35 m/s at 35°',700,13],'no air: '+R.toFixed(0)+' m',['with air: '+(s&&s.done?s.x.toFixed(0)+' m':'in flight…'),800,13,'#c8102e']]);} }
  ],
  useIt: [
    { do: 'On a free throw, aim for an arc whose top is about level with the top of the backboard, and aim toward the back of the rim.',
      why: 'NC State engineers simulated hundreds of thousands of free throws and found a launch angle of about 52° (for a 7-foot release height) needs the least speed and forgives small mistakes best. A higher arc than a line drive gives the ball a bigger opening to drop through.' },
    { do: 'In the long jump, focus on running fast and taking off at a fairly low angle instead of trying to jump high.',
      why: 'People can’t take off as fast when they jump upward, so the textbook 45° does not apply. Linthorne and colleagues (Journal of Sports Sciences, 2005) found the best takeoff angle for long jumpers is only about 20° to 25°, matching what athletes actually do.' },
    { do: 'For a long soccer throw-in, release the ball lower than 45°, closer to 30°.',
      why: 'Like jumpers, throwers lose speed as they aim higher. Linthorne’s research found long-throw specialists do best at about 30°, and the ball also starts about 2 m up, which lowers the best angle further.' }
  ],
  tryIt: [
    { title: 'the coin drop race (2 minutes)',
      steps: ['Put two coins near the edge of a table, one hanging just over the edge and one behind it.', 'With a ruler held flat on the table, sweep it quickly so it flicks the back coin straight off sideways at the same moment it knocks the front coin to drop almost straight down.', 'Listen as they hit the floor.'],
      look: 'You hear one click, not two. The flicked coin lands farther out, but both fall the same height in the same time, just like the twin balls.' }
  ]
}
});

/* ---------- forces and motion ---------- */
const foM=(sim,id)=>{const m=sim.def.metrics.find(x=>x.id===id);return m?m.get(sim):NaN;};
function foCard(ctx,k,lines,x,y,w){x=x||506;y=y||240;w=w||286;const kk=Math.min(k,1.3),lh=18*kk,h=10+lines.length*lh;ctx.save();ctx.globalAlpha=0.97;ctx.fillStyle=PAL['cv-sol'];H.rr(ctx,x,y,w,h,8);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.stroke();ctx.restore();
  lines.forEach((l,j)=>{const o=typeof l==='string'?[l]:l;H.txt(ctx,o[0],x+10,y+lh*0.95+j*lh,{s:(o[2]||12.5)*kk,w:o[1]||500,c:o[3]||PAL['cv-ink']});});}
const fo1=x=>(Math.round(x*10)/10).toFixed(1).replace('-','−');
const FOPUSH={mode:'push',applied:0,mass:50,surface:'wood'};

BioLab.addLearn({
forces: {
  goals: {
    bio: ['What a force is, and how to show all the forces on an object with arrows', 'Why a gentle push does not move a heavy crate (static friction)', 'Why an object keeps moving at a steady speed when the forces balance', 'Why the same push speeds up a light cart more than a heavy one (a = F ÷ m)'],
    honors: ['How to draw a free-body diagram and find the net force', 'How to calculate static and kinetic friction from μ and the normal force', 'How to use F_net = ma', 'Why third-law pairs never cancel'],
    ap: ['How to draw a free-body diagram and find the net force', 'How to calculate static and kinetic friction from μ and the normal force', 'How to use F_net = ma and test it with a photogate', 'Why third-law pairs never cancel']
  },
  matters: 'Every time you push a door, brake a bike or feel a car stop, forces are deciding what happens. Newton’s laws tell you when something will start moving, how fast it will speed up, and why loose things in a car keep going when the car stops.',
  question: 'You push a 50 kg crate across a wood floor. Why doesn’t a small push move it at all, why does it slide once you push harder, and what happens when you let go?',
  startKey: 'forces', startRun: true, startSpeed: 0.5,
  startOverlay(sim,ctx,LH,k){tag(ctx,'Arrows = forces on the crate',671,250,k,{s:12.5});tag(ctx,'50 kg crate, about 110 lb',330,110,k,{s:12.5});},
  steps: [
    { key: 'forces', title: 'Forces on a crate at rest', base: FOPUSH, fresh: true, speed: 0.5,
      see: 'A 50 kg crate on a wood floor. The free-body diagram shows gravity 490 N down and the floor 490 N up. Net force: 0.',
      why: 'A force is a push or a pull, in newtons (N). Up and down cancel, so the crate stays put.',
      overlay(sim,ctx,LH,k){tag(ctx,'arrows = forces on the crate',671,248,k,{s:12.5,hi:true});tag(ctx,'50 kg, about 110 lb',330,110,k,{s:12.5});} },
    { key: 'static', title: 'A gentle push: nothing moves', set: { applied: 100 }, speed: 0.5,
      see: 'A 100 N push to the right. The crate doesn’t move: a friction arrow points left, also 100 N.',
      why: '<b>Static friction</b> pushes back as hard as needed, up to a limit. Net force 0, so the crate stays at rest.',
      overlay(sim,ctx,LH,k){const f=foM(sim,'fric');foCard(ctx,k,[['Push: 100 N →',700],['Static friction: '+Math.abs(f).toFixed(0)+' N ←',700,12.5,PAL['s4']],'Net force: 0 N','So the crate stays still']);} },
    { key: 'slide', cause: { from: { applied: 100 } }, title: 'Push harder: it breaks free', set: { applied: 250 }, speed: 0.5,
      see: 'The push rises to 250 N. The crate breaks free and speeds up, and friction drops to 147 N.',
      why: 'Static friction maxes out at 196 N. Sliding (<b>kinetic</b>) friction is 147 N, so the net 103 N gives a = 103 ÷ 50 ≈ 2.1 m/s².',
      overlay(sim,ctx,LH,k){foCard(ctx,k,['Max static: 0.40 × 490 = 196 N','Sliding friction: 0.30 × 490 = 147 N','Net: 250 − 147 = 103 N →',['a = 103 ÷ 50 = '+fo1(foM(sim,'acc'))+' m/s²',800,12.5,'#c8102e']]);} },
    { key: 'steady', cause: { from: { applied: 250 } }, title: 'Balanced forces, steady speed', set: { applied: 147 }, speed: 0.5,
      see: 'The push drops to 147 N, equal to sliding friction. The crate keeps sliding at a steady speed.',
      why: 'Net force 0 means no <b>change</b> in motion, not stopped. That is Newton’s first law.',
      overlay(sim,ctx,LH,k){foCard(ctx,k,['Push 147 N →, friction 147 N ←',['Net force: 0 N',700],['Speed: '+foM(sim,'vel').toFixed(2)+' m/s, not changing',800,12.5,'#c8102e']]);} },
    { key: 'letgo', cause: { from: { applied: 147 } }, title: 'Let go', set: { applied: 0 }, speed: 0.5,
      see: 'The push stops. Only friction acts, pointing backward, and the crate slows to a stop.',
      why: 'Friction is now the net force: a = −147 ÷ 50 ≈ −2.9 m/s². Friction, not “running out of force,” stops things.',
      overlay(sim,ctx,LH,k){const v=foM(sim,'vel');foCard(ctx,k,[['Only friction: 147 N ←',700],'a = −147 ÷ 50 ≈ −2.9 m/s²',['Speed: '+v.toFixed(2)+' m/s'+(Math.abs(v)<0.005?', stopped':''),800,12.5,'#c8102e']]);} },
    { key: 'ice', cause: { from: { surface: "wood" } }, title: 'The same push on ice', base: FOPUSH, set: { surface: 'ice', applied: 100 }, fresh: true, speed: 0.5,
      see: 'The same 100 N push, but on ice. This time the crate slides away and speeds up.',
      why: 'Ice’s static friction tops out at 49 N, less than the push. Sliding friction is about 25 N, so a ≈ 1.5 m/s².',
      overlay(sim,ctx,LH,k){foCard(ctx,k,['Max static on ice: 0.10 × 490 = 49 N','Sliding friction: 0.05 × 490 ≈ 25 N','Net: 100 − 25 ≈ 75 N →',['a ≈ 75 ÷ 50 = '+fo1(foM(sim,'acc'))+' m/s²',800,12.5,'#c8102e']]);} },
    { key: 'fan', title: 'A fan cart: a = F ÷ m', base: { mode: 'fan', fans: 2, cartmass: 0, strobe: true }, fresh: true, speed: 0.4,
      see: 'A 0.50 kg cart with 2 fans, 0.40 N each, on a low-friction track. The strobe images spread out, and a photogate times it.',
      why: 'The net force is 0.80 N, so a = F ÷ m = 0.80 ÷ 0.50 = 1.6 m/s².',
      overlay(sim,ctx,LH,k){foCard(ctx,k,['Force: 2 × 0.40 = 0.80 N','Mass: 0.50 kg',['a = 0.80 ÷ 0.50 = 1.6 m/s²',800,12.5,'#c8102e']]);} },
    { key: 'heavier', title: 'Double the mass', base: { mode: 'fan', fans: 2, cartmass: 0.5, strobe: true }, fresh: true, speed: 0.4,
      see: 'Same two fans, but the cart is now 1.00 kg. The strobe images are closer together.',
      why: 'Same force, twice the mass, half the acceleration: 0.80 m/s². Mass resists changes in motion.',
      overlay(sim,ctx,LH,k){foCard(ctx,k,['Force: 0.80 N (same)','Mass: 1.00 kg (doubled)',['a = 0.80 ÷ 1.00 = 0.80 m/s²',800,12.5,'#c8102e'],'Half the acceleration']);} },
    { key: 'fgraph', title: 'The F = ma graph', speed: 0.5,
      see: 'Acceleration vs net force for the 0.50 kg and 1.00 kg carts, 1 to 4 fans each. Each set of dots is a straight line through zero.',
      why: 'a = F ÷ m: double the force, double the acceleration. The heavier cart’s line is half as steep: slope = 1 ÷ mass.',
      overlay(sim,ctx,LH,k,tau){const K=BioLab.lg;K.dim(ctx,LH);const p=tau%11,
        /* from sims/forces.js: each fan pushes 0.40 N; cart 0.50 kg, or 1.00 kg with the added mass; a = F/m */
        B={x0:120,x1:700,y0:70,y1:370},xr=[0,1.8],FAN=0.40,R='#c8102e',BL='#1f6feb';
        K.axes(ctx,B,k,{xr,xt:[[0,'0'],[0.4,'0.4'],[0.8,'0.8'],[1.2,'1.2'],[1.6,'1.6']],yt:[[0,'0'],[0.25,'1'],[0.5,'2'],[0.75,'3'],[1,'4']],xl:'Net force (N)',yl:'Acceleration (m/s²)',ylOff:44});
        K.tag(ctx,'Acceleration vs force',400,34,k);
        [[0.5,R,0],[1.0,BL,5]].forEach(([m,c,t0])=>{const q=p-t0;if(q<0)return;for(let n=1;n<=4;n++){if(q<n*0.7)break;const F=n*FAN;K.dot(ctx,K.X(B,xr,F),K.Y(B,F/m/4),c,7);}
          if(q>3.2)K.curve(ctx,B,xr,F=>F/m/4,1.8*K.ease(Math.min(1,(q-3.2)/1)),c,[7,5],2.5);
          if(q>4.2)K.tagA(ctx,m===0.5?'0.50 kg cart: slope 2':'1.00 kg cart: slope 1',B.x0+14,m===0.5?B.y0+20:B.y0+66,k,{s:13,c},'l');});} },
    { lvl: 'honors', key: 'third', title: 'Equal and opposite, on different objects', base: FOPUSH, set: { applied: 200 }, fresh: true, speed: 0.5,
      see: 'The person pushes the crate with 200 N (arrow A); the crate pushes back on the hands with 200 N (arrow B).',
      why: 'Newton’s third law: equal and opposite, on <b>different</b> objects, so they never cancel. Only A acts on the crate.',
      overlay(sim,ctx,LH,k){tag(ctx,'A acts on the crate; B acts on the person',300,190,k,{s:12.5,hi:true});} },
    { lvl: 'ap', key: 'gate', title: 'Test F = ma with the photogate', base: { mode: 'fan', fans: 4, cartmass: 0.5, strobe: true }, fresh: true, speed: 0.6,
      see: 'Four fans (1.60 N) push a 1.00 kg cart. The photogate 1.00 m down the track times each run, and the card compares the measured acceleration with F ÷ m.',
      why: 'Starting from rest, d = ½at², so a = 2d ÷ t². If the measured a matches F ÷ m = 1.60 m/s², the second law predicted the motion. Small differences come from rounding the timer.',
      overlay(sim,ctx,LH,k){const m=foM(sim,'meas');foCard(ctx,k,['Predicted: 1.60 ÷ 1.00 = 1.60 m/s²','Measured: a = 2d ÷ t²',[Number.isFinite(m)?'= '+m.toFixed(2)+' m/s²':'waiting for the photogate…',800,12.5,'#c8102e']]);} }
  ],
  useIt: [
    { do: 'On icy or snowy roads, leave at least 5 to 6 seconds between your car and the one ahead, and brake gently and early.',
      why: 'Low friction means a much smaller backward force, so the same car takes far longer to stop, just like the crate on ice. AAA recommends stretching the normal 3 to 4 second following gap to at least 5 to 6 seconds on slick roads.' },
    { do: 'Put water bottles, backpacks and other loose things in the trunk, a closed console or the floor before you drive.',
      why: 'When a car stops suddenly, nothing pushes back on a loose object, so it keeps moving at the car’s old speed (the first law) until it hits something. The Canada Safety Council warns that a 1-liter water bottle can strike like a 20 kg weight in a hard stop.' }
  ],
  tryIt: [
    { title: 'the book push (2 minutes)',
      steps: ['Lay a heavy book on a table. Push it with one finger, very gently, then a little harder, until it starts to slide.', 'Once it is sliding, notice how much push it takes to keep it moving.', 'Now stack a second book on top and try again.'],
      look: 'It takes more push to start the book than to keep it sliding: static friction is bigger than kinetic friction. Two books need about twice the push, because the normal force doubled.' }
  ]
}
});

/* ---------- friction lab ---------- */
const frN=v=>Number.isFinite(v)?v.toFixed(2)+' N':'…';
const frG=(sim,id)=>{sim.gMetric=id;if(sim.ui&&sim.ui.gm){const o=[...sim.ui.gm.options].some(x=>x.value===id);if(o)sim.ui.gm.value=id;}};
const FRB={method:'pull',surface:'wood',added:0,face:'large'};
const frCard=(ctx,k,lines)=>{const f=Math.min(1,1.1/Math.min(k,1.3));foCard(ctx,k,lines.map(l=>{const o=typeof l==='string'?[l,500]:l.slice();o[2]=(o[2]||12.5)*f;return o;}),282,18,258);};
const frPull=sim=>{const s=sim.st;return s.phase==='ramp'||s.phase==='wait'?'not moving':s.phase==='slide'?'sliding':'done';};

BioLab.addLearn({
friction: {
  goals: {
    bio: ['Why it takes more force to get something sliding than to keep it sliding', 'Why a heavier object has more friction', 'Why some surfaces grip and others are slippery', 'How to use this on icy sidewalks and when a car brakes hard'],
    honors: ['The difference between static and kinetic friction', 'How to calculate friction with f = μN', 'Why contact area barely matters', 'How to find μ from your own spring-scale data'],
    ap: ['The difference between static and kinetic friction', 'How to calculate friction with f = μN', 'How to find μk from the slope of friction vs. normal force', 'How to check μk with a slide-to-stop measurement']
  },
  matters: 'Friction is what lets your shoes push you forward, your car’s tires stop you, and a heavy couch stay put. Knowing what it depends on tells you how to move heavy things, how to walk on ice, and why anti-lock brakes work.',
  question: 'You pull a 0.50 kg wooden block, about the weight of a water bottle, across a wooden table with a spring scale. Then you stack 1.0 kg on top and pull again. What does the scale read while it slides each time?',
  startKey: 'setup', startRun: false,
  startOverlay(sim,ctx,LH,k){frCard(ctx,k,[['0.50 kg block, about a water bottle',700],'The scale shows the pull in newtons (N)','1 N ≈ the weight of a small apple']);},
  steps: [
    { key: 'ramp', title: 'Pulling, but it doesn’t move', base: FRB, fresh: true, speed: 0.2,
      run(sim){frG(sim,'force');},
      see: 'The hand pulls harder and harder. The scale climbs, but the block stays still as the friction arrow grows to match.',
      why: '<b>Static friction</b> pushes back exactly as hard as you pull, so nothing moves. But it can only grow so far.',
      overlay(sim,ctx,LH,k){const s=sim.st,F=s.phase==='ramp'?s.F:(Number.isFinite(s.peak)?s.peak:0);frCard(ctx,k,[['Pull: '+frN(F)+' →',700],['Static friction: '+frN(F)+' ←',700,12.5,PAL['s4']],s.phase==='ramp'||s.phase==='wait'?'Net force 0, so it stays still':['It broke free!',800,12.5,'#c8102e']]);} },
    { key: 'peak', title: 'It breaks free, then the pull drops', base: FRB, fresh: true, speed: 0.6,
      run(sim){frG(sim,'force');},
      see: 'On the scale and graph, the pull peaks near 2.2 N, the block jumps, and the reading drops to a steady 1.5 N.',
      why: 'Sliding surfaces don’t settle into each other, so <b>kinetic friction</b> is smaller. The first tug is the hardest.',
      overlay(sim,ctx,LH,k){const s=sim.st;frCard(ctx,k,[['To get it started: '+frN(s.peak),700],['To keep it moving: '+frN(s.kin),700,12.5,PAL['s4']],'Block: '+frPull(sim)]);} },
    { key: 'mass', title: 'Stack 1.0 kg on top', base: FRB, set: { added: 1 }, fresh: true, speed: 0.7,
      run(sim){frG(sim,'force');},
      see: 'With 1.0 kg added, the sliding reading triples, from 1.5 N to about 4.4 N. The microscope bumps press harder.',
      why: 'Friction depends on the <b>normal force</b>: 4.9 N alone, 14.7 N stacked. Three times the press, three times the friction.',
      overlay(sim,ctx,LH,k){const s=sim.st;frCard(ctx,k,[['Table pushes up: 4.9 N → 14.7 N',700],'That is 3 times as hard',['Keep it moving: 1.5 N → '+frN(s.kin),700,12.5,PAL['s4']],'Get it started: 2.2 N → '+frN(s.peak)]);} },
    { key: 'sand', title: 'A grippy surface: sandpaper', base: FRB, set: { surface: 'sandpaper' }, fresh: true, speed: 0.7,
      run(sim){frG(sim,'force');},
      see: 'The same block on sandpaper: big, sharp bumps, and it slides at about 3.2 N, twice wood’s 1.5 N.',
      why: 'The surfaces set the grip. Sandpaper’s bumps dig in, so the same press gives more friction.',
      overlay(sim,ctx,LH,k){const s=sim.st;frCard(ctx,k,[['Sandpaper, same 0.50 kg block',700],['Keep it moving: '+frN(s.kin),700,12.5,PAL['s4']],'Wood was 1.5 N']);} },
    { key: 'ice', title: 'A slippery surface: ice', base: FRB, set: { surface: 'ice' }, fresh: true, speed: 0.7,
      run(sim){frG(sim,'force');},
      see: 'Now ice. The bumps are tiny, the pull never passes about 0.5 N, and the block slides at only 0.25 N.',
      why: 'Ice is smooth with a thin wet layer, so it barely grips. A long stride needs more sideways push than that, so it slips.',
      overlay(sim,ctx,LH,k){const s=sim.st;frCard(ctx,k,[['Ice, same 0.50 kg block',700],'Get it started: '+frN(s.peak)+' (wood: 2.2 N)',['Keep it moving: '+frN(s.kin)+' (wood: 1.5 N)',700,12.5,PAL['s4']]]);} },
    { lvl: 'honors', key: 'area', title: 'Does contact area matter?', base: FRB, set: { face: 'narrow' }, fresh: true, speed: 0.7,
      run(sim){frG(sim,'force');},
      see: 'The block flips onto its narrow face. The sliding reading stays about 1.5 N.',
      why: 'Less area touches, but each square centimeter presses harder, and the two cancel. Friction depends on the normal force and the surfaces, not area.',
      overlay(sim,ctx,LH,k){const s=sim.st;frCard(ctx,k,[['Narrow face, same 0.50 kg',700],['Keep it moving: '+frN(s.kin),700,12.5,PAL['s4']],'Wide face was 1.47 N']);} },
    { lvl: 'honors', key: 'mu', title: 'μ = friction ÷ normal force', base: FRB, set: { surface: 'rubber', added: 1 }, fresh: true, speed: 0.7,
      run(sim){frG(sim,'force');},
      see: 'A 1.50 kg stack on rubber. The card divides sliding friction by the normal force to get μk.',
      why: 'f = μN, and <b>μ</b> depends only on the surfaces: rubber 0.80, wood 0.30, ice 0.05. Adding mass doesn’t change it.',
      overlay(sim,ctx,LH,k){const s=sim.st;frCard(ctx,k,['N = 1.50 × 9.8 = 14.7 N',['Sliding friction: '+frN(s.kin),700,12.5,PAL['s4']],['μk = '+(Number.isFinite(s.kin)?(s.kin/14.7).toFixed(2):'…')+' (rubber ≈ 0.80)',800,12.5,'#c8102e']]);} },
    { lvl: 'ap', key: 'slope', title: 'μk from the slope of a graph', base: FRB, set: { added: 2 }, fresh: true, speed: 0.8,
      run(sim){sim.fit=[];const again=sim.def.actions.find(a=>a.id==='again');
        for(const m of [0,0.5,1,1.5]){BioLab.setValues(sim,{added:m});again.run(sim);for(let i=0;i<6000&&sim.st.phase!=='done';i++)sim.def.step(sim,0.005);}
        BioLab.setValues(sim,{added:2});again.run(sim);frG(sim,'fit');},
      see: 'Four pulls (0 to 1.5 kg added) are on the friction vs normal force graph below. The 2.0 kg pull adds a fifth point.',
      why: 'f = μk·N, so the points fall on a line through the origin with slope μk. A best-fit line averages out the scale’s noise.',
      overlay(sim,ctx,LH,k){const m=foM(sim,'slope');frCard(ctx,k,[['f_k = μk · N: a line through 0',700],'Points so far: '+(sim.fit||[]).length,['Slope = μk ≈ '+(Number.isFinite(m)?m.toFixed(3):'…'),800,12.5,'#c8102e']]);} },
    { lvl: 'ap', key: 'stop', title: 'Check it: slide to a stop', base: { method: 'slide', surface: 'wood', added: 0, v0: 2 }, fresh: true, speed: 0.5,
      run(sim){frG(sim,'vel');},
      see: 'The block is launched at 2.0 m/s and coasts to a stop about 0.68 m away. Its speed graph is a straight line down.',
      why: 'a = μk·g for any mass, so d = v₀² ÷ (2μk g) = 4 ÷ 5.88 = 0.68 m: a second check on μk.',
      overlay(sim,ctx,LH,k){const d=foM(sim,'dist'),m=foM(sim,'mukslide');frCard(ctx,k,['a = μk g = 0.30 × 9.8 = 2.94 m/s²',['Stopped after: '+(Number.isFinite(d)?d.toFixed(3)+' m':'sliding…'),700],['μk = v₀² ÷ (2gd) = '+(Number.isFinite(m)?m.toFixed(3):'…'),800,12.5,'#c8102e']]);} }
  ],
  useIt: [
    { do: 'On an icy sidewalk, “walk like a penguin”: take short, slow steps, keep your feet flat, point your toes out a little, and keep your hands out of your pockets.',
      why: 'Every step pushes sideways on the ground, and ice can only push back a tiny bit before it slips, like the block that broke free at half a newton. Short, flat steps keep that sideways push small. The tip comes from SAIF, Oregon’s workplace-safety insurer, and Utah State University Extension.' },
    { do: 'If your car has anti-lock brakes (ABS) and you must stop hard, press the brake firmly and hold it. Don’t pump it, and steer around the danger.',
      why: 'A locked, skidding tire slides with kinetic friction and cannot steer. ABS keeps the tires rolling, so they still grip the road with static friction. NHTSA, the federal highway-safety agency, says ABS lets you keep steering control and tells drivers not to pump the pedal.' }
  ],
  tryIt: [
    { title: 'the rubber-band spring scale (5 minutes)',
      steps: ['Tie a rubber band to a shoe’s lace loop. Lay the shoe on a table or a hard floor, next to a ruler.', 'Pull the rubber band slowly and steadily. Note how long it stretches just before the shoe starts to slide, and how long it stays while the shoe keeps sliding.', 'Put a second shoe inside the first (or a heavy book on top) and pull again.', 'Try the same shoe on a carpet or a rug.'],
      look: 'The band stretches more just before the shoe starts than while it slides: static friction beats kinetic. More weight stretches it more. Carpet and rubber soles stretch it more than a smooth floor.' }
  ]
}
});

/* ---------- inclined plane ---------- */
const inCard=(ctx,k,lines)=>{const f=Math.min(1,1.1/Math.min(k,1.3));foCard(ctx,k,lines.map(l=>{const o=typeof l==='string'?[l,500]:l.slice();o[2]=(o[2]||12.5)*f;return o;}),16,16,290);};
const in1=v=>Number.isFinite(v)?(Math.round(v*10)/10).toFixed(1):'…';
const INB={angle:20,mass:5,surface:'wood',push:0,phi:0,strobe:true};
const inGrip=(sim,mus)=>mus*foM(sim,'normal');
/* ghost block that follows the no-friction rule a = g sinθ from the release point (same geometry as sims/incline.js) */
function inGhost(sim,ctx,k){const p=sim.p,st=sim.st,th=p.angle*Math.PI/180,R=430,ppm=R/3.7,rt=st.rt||0,sg=Math.min(0.4+0.5*9.8*Math.sin(th)*rt*rt,3.4),bw=46+p.mass*1.2,bh=26+p.mass*0.9;
  ctx.save();ctx.translate(60,405);ctx.rotate(-th);const x=R-sg*ppm;ctx.setLineDash([5,4]);ctx.strokeStyle=TK();ctx.lineWidth=2.2;ctx.fillStyle=TKA(.12);H.rr(ctx,x-bw/2,-6-bh,bw,bh,4);ctx.fill();ctx.stroke();ctx.restore();
  if(sg>=3.4){const tg=Math.sqrt(2*3.0/(9.8*Math.sin(th)));tag(ctx,'a = g sinθ rule: '+tg.toFixed(2)+' s',190,262,k,{s:12,c:TK()});}}
const INGUESS={L:'Lower angle',S:'Same angle',H:'Higher angle'};

BioLab.addLearn({
incline: {
  goals: {
    bio: ['Why gravity on a slope splits into a downhill part and a part that presses into the slope', 'Why a steeper slope makes things slide', 'Why a heavy box and a light box start sliding at the same angle', 'How this explains avalanches, wheelchair ramps and steep roads'],
    honors: ['How to split gravity into mg sinθ and mg cosθ', 'How to find the angle of repose and use μs = tanθ', 'How to find the acceleration on a ramp with friction', 'What it takes to pull something up a ramp'],
    ap: ['How to apply Newton’s second law with axes tilted along the ramp', 'How to use μs = tanθ and a = g(sinθ − μk cosθ)', 'Why mass cancels out of the slipping angle', 'How a rope pulling at an angle changes the normal force']
  },
  matters: 'Every ramp, ski slope, steep road and snowy mountainside is an inclined plane. The same split of gravity decides whether a box stays on a loading ramp, how hard a wheelchair user has to push, and which slopes can avalanche.',
  question: 'You set a 5 kg box on a wooden loading ramp. How steep can you tilt the ramp before the box slides on its own, and would a heavier 18 kg box start sliding at a lower angle?',
  startKey: 'ramp', startRun: false,
  startOverlay(sim,ctx,LH,k){inCard(ctx,k,[['5 kg block, about a bag of flour',700],'Ramp: 3.7 m long, about a small car','Wood surface, tilted 20°']);},
  steps: [
    { key: 'split', title: 'Gravity splits in two on a slope', base: INB, fresh: true, speed: 0.6,
      see: 'A 5 kg block on a 20° ramp. In the force box, gravity (49 N) splits into two dashed parts: down the ramp and into it.',
      why: 'Downhill: about 17 N. Into the ramp: about 46 N. Friction pushes up the ramp with exactly 17 N, so it holds.',
      overlay(sim,ctx,LH,k){inCard(ctx,k,['Weight: 49 N, straight down',['Down the ramp: '+in1(foM(sim,'par'))+' N',700],'Into the ramp: '+in1(foM(sim,'normal'))+' N',['Friction holds it: '+in1(foM(sim,'fric'))+' N',700,12.5,PAL['s4']]]);} },
    { key: 'edge', title: 'Tilt to 24°: it barely holds', base: INB, set: { angle: 24 }, fresh: true, speed: 0.6,
      see: 'The ramp tilts to 24°. The downhill arrow grows, the into-ramp arrow shrinks, and the block barely holds.',
      why: 'Downhill pull: 19.9 N. Less press means less grip: the most the wood can hold is 20.1 N. Right at the limit.',
      overlay(sim,ctx,LH,k){inCard(ctx,k,[['Down the ramp: '+in1(foM(sim,'par'))+' N',700],['Most grip the wood can give: '+in1(inGrip(sim,0.45))+' N',700,12.5,PAL['s4']],'Still holding, just barely']);} },
    { key: 'slip', cause: { from: { angle: 20 } }, title: 'Tilt to 25°: it slides', base: INB, set: { angle: 25 }, fresh: true, speed: 0.6,
      see: 'One more degree: 25°. The block slides, and the strobe images spread out as it speeds up.',
      why: 'The downhill pull, 20.7 N, beats the 20.0 N of grip. Sliding friction is smaller still, so it speeds up at about 1.5 m/s².<span class="think-pick" data-pick="inc" role="group" aria-label="Your guess" style="display:block;margin-top:8px"><b style="color:#a8178f">Your guess before the next step: an 18 kg box, 3.6 times as heavy, starts sliding at…</b><br><button type="button" class="btn" data-pv="L" aria-pressed="false" style="border:2px solid #a8178f;color:#a8178f;background:transparent;margin:6px 8px 0 0">a lower angle</button><button type="button" class="btn" data-pv="S" aria-pressed="false" style="border:2px solid #a8178f;color:#a8178f;background:transparent;margin:6px 8px 0 0">the same angle</button><button type="button" class="btn" data-pv="H" aria-pressed="false" style="border:2px solid #a8178f;color:#a8178f;background:transparent;margin:6px 8px 0 0">a higher angle</button></span>',
      run(sim){pickWire(sim);},
      overlay(sim,ctx,LH,k){inCard(ctx,k,[['Down the ramp: '+in1(foM(sim,'par'))+' N',700],['Most grip: '+in1(inGrip(sim,0.45))+' N, not enough',700,12.5,PAL['s4']],['It slides: a = '+foM(sim,'acc').toFixed(2)+' m/s²',800,12.5,'#c8102e']]);} },
    { key: 'heavy', title: 'An 18 kg box at the same angle', base: INB, set: { angle: 25, mass: 18 }, fresh: true, speed: 0.6,
      see: 'Same 25° ramp, but an 18 kg block, 3.6 times as heavy. Every force grows by the same factor; it slides just the same.',
      why: 'More weight pulls harder downhill but also grips harder, by the same factor. Angle and surfaces decide sliding, not weight.',
      overlay(sim,ctx,LH,k){const g=pickOf(sim,'inc');if(g)tag(ctx,'Your guess: '+INGUESS[g]+(g==='S'?'  ✓':'  ✗'),640,428,Math.min(k,1.1),{s:13,c:TK()});inCard(ctx,k,[['Down the ramp: 20.7 → '+in1(foM(sim,'par'))+' N',700],['Most grip: 20.0 → '+in1(inGrip(sim,0.45))+' N',700,12.5,PAL['s4']],'Both grew 3.6 times',['Same a = '+foM(sim,'acc').toFixed(2)+' m/s²',800,12.5,'#c8102e']]);} },
    { key: 'steep', cause: { from: { angle: 25 } }, title: 'Steeper still: 40°', base: INB, set: { angle: 40 }, fresh: true, speed: 0.6,
      see: 'The 5 kg block at 40°. The downhill arrow nearly matches the into-ramp arrow; the block races down in half the time.',
      why: '31.5 N pulls down the ramp and grip is weak, so a ≈ 4.1 m/s².',
      so: 'Most avalanches release on 30° to 45° slopes.',
      overlay(sim,ctx,LH,k){inCard(ctx,k,[['Down the ramp: '+in1(foM(sim,'par'))+' N (17 at 20°)',700],'Into the ramp: '+in1(foM(sim,'normal'))+' N (46 at 20°)',['a = '+foM(sim,'acc').toFixed(2)+' m/s²',800,12.5,'#c8102e']]);} },
    { key: 'nofric', title: 'Take away friction', base: INB, set: { angle: 40, surface: 'none' }, fresh: true, speed: 0.6,
      see: '40° with no friction. The friction arrow is gone, and the block reaches the bottom faster still.',
      why: 'All of the downhill pull speeds it up: a = 9.8 × sin 40° ≈ 6.3 m/s². Steeper ramps get closer to free fall.',
      overlay(sim,ctx,LH,k){inCard(ctx,k,['No friction: only the downhill pull',['a = 9.8 × sin 40° = '+foM(sim,'acc').toFixed(2)+' m/s²',800,12.5,'#c8102e'],'With wood it was 4.05 m/s²']);} },
    { key: 'assume', title: 'What the formula assumes', base: INB, set: { angle: 40 }, fresh: true, speed: 0.6,
      see: 'Wood at 40° again. The dashed block follows a = 9.8 × sin 40° and reaches the bottom in 0.98 s. The real block takes 1.22 s.',
      why: 'a = g sinθ assumes no friction. Before you use a formula, ask what it leaves out.',
      overlay(sim,ctx,LH,k,tau){inGhost(sim,ctx,k);thinkBadge(ctx,'assume','Hidden assumption: no friction',k,tau,{right:780,y:410});
        inCard(ctx,k,['Dashed: a = 9.8 × sin 40° = 6.30 m/s²',['Real wood: a = '+foM(sim,'acc').toFixed(2)+' m/s²',800,12.5,'#c8102e']]);} },
    { lvl: 'honors', key: 'repose', title: 'Angle of repose: μs = tanθ', base: INB, set: { surface: 'ice', angle: 6 }, fresh: true, speed: 0.6,
      see: 'An icy ramp at just 6°. Even this gentle slope is enough: the block slides.',
      why: 'At the slipping angle, <b>μs = tanθ</b>, and mass cancels. Ice (0.10) slips above 5.7°; wood (0.45) holds to 24.2°.',
      overlay(sim,ctx,LH,k){inCard(ctx,k,['Slips when tanθ > μs',['Ice: tan⁻¹(0.10) = 5.7°, so 6° slides',700,12.5,PAL['s4']],'Wood: 24.2°   Rubber: 45°',['a = '+foM(sim,'acc').toFixed(2)+' m/s²',800,12.5,'#c8102e']]);} },
    { lvl: 'honors', key: 'pull', title: 'Pull it up the ramp', base: INB, set: { push: 50 }, fresh: true, speed: 0.35,
      run(sim){sim.st.s=2.4;sim.st.inTop=0;},
      see: 'Wood at 20°, with a rope pulling the block up the ramp at 50 N. It speeds up the slope, and friction now points down the ramp.',
      why: 'Friction opposes sliding. Net force = 50 − 16.8 − 13.8 ≈ 19.4 N up, so a ≈ 3.9 m/s².',
      overlay(sim,ctx,LH,k){const st=sim.st,now=performance.now();if(st.stuckTop){if(!st.inTop)st.inTop=now;else if(now-st.inTop>1500){st.s=2.4;st.v=0;st.strobe=[];st.rt=0;st.moved=false;st.inTop=0;}}else st.inTop=0;
        inCard(ctx,k,['Pull up the ramp: 50 N',['Down the ramp: gravity 16.8 N',700,12.5,PAL['s2']],['+ sliding friction 13.8 N',700,12.5,PAL['s4']],['Net ≈ 19.4 N up, a ≈ 3.9 m/s² up',800,12.5,'#c8102e']]);} },
    { lvl: 'ap', key: 'rope', title: 'A rope at an angle lifts some of the load', base: { angle: 30, mass: 10, surface: 'rubber', push: 50, phi: 0, strobe: true }, set: { phi: 30 }, fresh: true, speed: 0.6,
      see: 'A 10 kg block on a 30° rubber ramp, held by a 50 N rope tilted 30° above the ramp. The normal arrow is shorter than mg cosθ.',
      why: 'N = mg cosθ − F sinφ = 84.9 − 25 = 59.9 N. Along the ramp, 49 N down beats 43.3 N up, so static friction adds 5.7 N up.',
      overlay(sim,ctx,LH,k){inCard(ctx,k,['mg cosθ = 84.9 N',['N = 84.9 − 50 sin30° = '+in1(foM(sim,'normal'))+' N',700],['Static friction: '+in1(foM(sim,'fric'))+' N up the ramp',700,12.5,PAL['s4']],'Max: μs·N = '+in1(inGrip(sim,1.0))+' N, so it holds']);} }
  ],
  useIt: [
    { do: 'Before you ski, snowboard or snowshoe off-trail in Colorado, check the Colorado Avalanche Information Center forecast and stay off slopes steeper than 30° when the danger is up. A phone app or an inclinometer can measure the angle.',
      why: 'Steeper slopes pull harder downhill on the snowpack while pressing it into the slope less, just like the block. The CAIC’s guide reports that about 90% of avalanches release on slopes of 30° to 45°.' },
    { do: 'If you build a ramp for a wheelchair, a stroller or a hand truck, make it no steeper than 1 inch of rise for every 12 inches of length, and gentler if you have the room.',
      why: 'The 2010 ADA Standards (section 405.2) cap ramps at 1:12, about 4.8°. At that angle the downhill pull on a 100 kg rider and chair is about 81 N, less than a tenth of their weight. The U.S. Access Board recommends going gentler where space allows.' }
  ],
  tryIt: [
    { title: 'the book-ramp angle of repose (5 minutes)',
      steps: ['Lay a coin or an eraser near the end of a hardcover book on a table.', 'Slowly lift that end of the book until the object just starts to slide. Hold it there and measure the height of the raised end and the length of the book.', 'Divide height by length. That is tanθ, which equals μs for those two surfaces.', 'Stack two coins and try again. Then try a different object, like a rubber eraser.'],
      look: 'The stacked coins slip at about the same height as one coin: weight doesn’t change the angle. The rubber eraser needs a much steeper book, because its μs is bigger.' }
  ]
}
});

/* ---------- vectors in two dimensions ---------- */
const vcCard=(ctx,k,lines,x,y,w)=>{const f=Math.min(1,1.1/Math.min(k,1.3));foCard(ctx,k,lines.map(l=>{const o=typeof l==='string'?[l,500]:l.slice();o[2]=(o[2]||12.5)*f;return o;}),x,y,w||290);};
const vcR=(sim,ctx,k,lines)=>{const r=sim.vis&&sim.vis.rv,h=10+lines.length*18*Math.min(k,1.3);let y=140;if(r){const top=r.yb-r.s*sim.p.wid;y=Math.max(top+56,Math.min((top+r.yb)/2+18,r.yb-8-h));}vcCard(ctx,k,lines,16,y,270);};
const VRIV={mode:'river',bs:3,aim:0,cur:1.5,wid:40};
const vcTrip=sim=>{const b=sim.st.boat;if(!b)return '…';return b.done?'Landed: '+b.t.toFixed(1)+' s, '+(Math.abs(b.x)<0.05?'no drift':b.x.toFixed(1)+' m downstream'):'t = '+b.t.toFixed(1)+' s, drift '+b.x.toFixed(1)+' m';};

BioLab.addLearn({
vectors2d: {
  goals: {
    bio: ['Why a boat pointed straight across a river still lands downstream', 'How to add two arrows tip to tail to see where you really go', 'Why aiming upstream (or into the wind) gets you straight across', 'How this helps you escape a rip current and paddle across a river'],
    honors: ['How to add velocities as vectors: v(boat, shore) = v(boat, water) + v(water, shore)', 'Why the across part alone sets the crossing time', 'How to split any vector into x and y components and add them', 'How to use the Pythagorean theorem and trig to rebuild the result'],
    ap: ['How to add relative velocities with components', 'How to find the aim angle that cancels a current, sin θ = v_c ÷ v_b', 'Why perpendicular components are independent', 'How to find the heading a plane needs in a crosswind']
  },
  matters: 'Anything that moves through moving water or air, a swimmer, a kayak, a plane, a drone, gets pushed sideways. Adding the arrows tells you where you will really end up, and how to aim so you land where you want.',
  question: 'Your boat goes 3 m/s (about 7 mph) in still water. You point it straight across a 40 m river flowing at 1.5 m/s. How far downstream do you land, and which way should you point to land straight across?',
  startKey: 'river', startRun: false,
  startOverlay(sim,ctx,LH,k){vcR(sim,ctx,k,[['River: 40 m wide, flowing 1.5 m/s →',700],'Boat: 3 m/s in still water (about 7 mph)','Seen from above; dots every 1 s']);},
  steps: [
    { key: 'across', title: 'Point straight across', base: VRIV, fresh: true, speed: 1.2,
      see: 'The boat points straight at the flag, but the red dots march diagonally. It lands about 20 m downstream after 13.3 s.',
      why: 'Add the boat’s 3 m/s across (blue) and the river’s 1.5 m/s (teal) <b>tip to tail</b>. The red arrow is the real path.',
      overlay(sim,ctx,LH,k){vcR(sim,ctx,k,[['Boat’s push: 3 m/s across',700,12.5,PAL['s2']],['Current: 1.5 m/s downstream',700,12.5,PAL['s6']],['Real path: the red arrow',700,12.5,PAL['s1']],vcTrip(sim)]);} },
    { key: 'faster', cause: { from: { cur: 1.5 } }, title: 'Double the current', base: VRIV, set: { cur: 3 }, fresh: true, speed: 2,
      see: 'Same aim, but the river flows at 3 m/s. The path tilts more and lands 40 m downstream. The crossing still takes 13.3 s.',
      why: 'The current pushes only sideways. Only the 3 m/s across part gets you over: 40 ÷ 3 = 13.3 s.',
      overlay(sim,ctx,LH,k){vcR(sim,ctx,k,[['Current: 3 m/s (was 1.5)',700,12.5,PAL['s6']],'Across: still 3 m/s, so still 13.3 s',['Drift doubles: 20 m → 40 m',800,12.5,'#c8102e'],vcTrip(sim)]);} },
    { key: 'upstream', cause: { from: { aim: 0 } }, title: 'Aim 30° upstream', base: VRIV, set: { aim: 30 }, fresh: true, speed: 2,
      see: 'Back to 1.5 m/s, but the boat points 30° upstream. It lands right at the flag, after about 15.4 s.',
      why: 'Half its 3 m/s, 1.5 m/s, pushes upstream and cancels the current. About 2.6 m/s is left to cross: 40 ÷ 2.6 ≈ 15.4 s.',
      overlay(sim,ctx,LH,k){vcR(sim,ctx,k,['Aim: 30° upstream',['Upstream part: 1.5 m/s, cancels the current',700,12.5,PAL['s2']],'Across part: about 2.6 m/s',['→ '+vcTrip(sim),800,12.5,'#c8102e']]);} },
    { key: 'plane', title: 'A plane in a crosswind', base: { mode: 'plane', as: 60, hdg: -30, ws: 30, wd: 90 }, fresh: true, speed: 1,
      see: 'A map view. A 30 m/s wind blows east. The plane points 30° west of north, yet flies straight north to the city.',
      why: 'Pilots call this <b>crabbing</b>: pointing partly into the wind to cancel its push, like the boat aimed upstream.',
      overlay(sim,ctx,LH,k){vcCard(ctx,k,[['Nose: 30° west of north',700,12.5,PAL['s2']],['Wind: 30 m/s toward the east',700,12.5,PAL['s6']],['Path: straight north to the city',800,12.5,'#c8102e']],80,16,280);} },
    { key: 'add', title: 'Adding any two arrows', base: { mode: 'add', am: 3, aa: 0, bm: 4, ba: 90, op: 'add', comps: false }, fresh: true, speed: 0.6,
      see: 'Arrow A is 3 m east; B is 4 m north, with its tail on A’s tip. The red resultant is 5 m, not 7 m.',
      why: 'Arrows pointing different ways partly miss each other. For a right angle: √(3² + 4²) = 5.',
      overlay(sim,ctx,LH,k){vcCard(ctx,k,[['3 m east + 4 m north',700],'Walked: 7 m',['Straight-line distance: √(3² + 4²) = 5 m',800,12.5,'#c8102e']],16,16,280);} },
    { lvl: 'honors', key: 'speed', title: 'Speed relative to the shore', base: VRIV, set: { bs: 4, cur: 3 }, fresh: true, speed: 2,
      see: 'A 4 m/s boat crosses a 3 m/s river pointing straight across: 5 m/s past the shore, 10 s to cross, 30 m of drift.',
      why: 'At right angles, |v| = √(4² + 3²) = 5 m/s. Time uses only the across part: 40 ÷ 4 = 10 s.',
      overlay(sim,ctx,LH,k){vcR(sim,ctx,k,['v = √(4² + 3²) = '+foM(sim,'gsr').toFixed(2)+' m/s','t = 40 m ÷ 4 m/s = 10 s','Drift = 3 m/s × 10 s = 30 m',['→ '+vcTrip(sim),800,12.5,'#c8102e']]);} },
    { lvl: 'honors', key: 'comps', title: 'Add with components', base: { mode: 'add', am: 5, aa: 30, bm: 4, ba: 120, op: 'add', comps: true }, fresh: true, speed: 0.6,
      see: 'A is 5 m at 30°; B is 4 m at 120°. Dashed lines split each into x and y parts, and the table adds them.',
      why: 'A = (4.33, 2.50) and B = (−2.00, 3.46), so R = (2.33, 5.96): 6.40 m at 69°.',
      overlay(sim,ctx,LH,k){vcCard(ctx,k,['R_x = 4.33 + (−2.00) = 2.33 m','R_y = 2.50 + 3.46 = 5.96 m',['|R| = '+foM(sim,'rmag').toFixed(2)+' m at '+foM(sim,'rang').toFixed(0)+'°',800,12.5,'#c8102e']],16,16,280);} },
    { lvl: 'ap', key: 'aim', title: 'The aim that cancels a current', base: VRIV, set: { bs: 4, cur: 2, aim: 30 }, fresh: true, speed: 2,
      see: 'A 4 m/s boat in a 2 m/s current, aimed 30° upstream, lands with no drift after about 11.5 s.',
      why: 'No drift: v_b sin θ = v_c, so θ = sin⁻¹(2 ÷ 4) = 30°. Across: 4 cos 30° = 3.46 m/s, so t = 40 ÷ 3.46 = 11.5 s.',
      overlay(sim,ctx,LH,k){vcR(sim,ctx,k,['θ = sin⁻¹(2 ÷ 4) = 30°','v_across = 4 cos 30° = 3.46 m/s','t = 40 ÷ 3.46 = 11.5 s',['→ '+vcTrip(sim),800,12.5,'#c8102e']]);} },
    { lvl: 'ap', key: 'heading', title: 'Heading in a slanted wind', base: { mode: 'plane', as: 60, hdg: -21, ws: 30, wd: 45 }, fresh: true, speed: 1,
      see: 'The 30 m/s wind now blows northeast. The plane points 21° west of north, tracks north, and its ground speed beats its airspeed.',
      why: 'The wind’s east part is 21.2 m/s, so 60 sin h = 21.2 and h ≈ 21°. Its north part is a partial tailwind: about 77 m/s north.',
      overlay(sim,ctx,LH,k){vcCard(ctx,k,['Wind east: 30 sin 45° = 21.2 m/s','Heading: sin⁻¹(21.2 ÷ 60) ≈ 21° W of N',['Ground speed: '+foM(sim,'gsp').toFixed(1)+' m/s',800,12.5,'#c8102e']],80,16,280);} }
  ],
  useIt: [
    { do: 'If a rip current pulls you away from a beach, don’t swim straight back against it. Swim parallel to the shoreline until you feel the pull weaken, then swim at an angle back to the beach.',
      why: 'A rip current is a narrow stream of water rushing out to sea, often faster than you can swim, so swimming against it is a fight you lose. Swimming along the shore is like the boat pointed across the river: the current carries you out, but it can’t stop you from crossing it. That’s the National Weather Service’s top rip-current tip.' },
    { do: 'When you paddle a kayak, canoe or paddleboard across a river, point the nose partly upstream instead of right at your landing spot. The faster the current, the more upstream you point.',
      why: 'Paddlers call this a ferry. Part of your paddling cancels the current, exactly like the boat aimed 30° upstream. Paddling.com’s guides explain that pointing straight at your target lets the current sweep you downstream.' }
  ],
  tryIt: [
    { title: 'the moving-tray crossing (5 minutes, two people)',
      steps: ['Put a wind-up toy, a toy car you can push gently, or even a crawling pet bug toy on a large baking sheet or a big sheet of cardboard on a table. Mark its starting spot on the table with tape.', 'Let the toy move straight across the sheet while your partner slowly and steadily slides the sheet sideways along the table: that is the “current.”', 'Mark where the toy reaches the far edge, on the table. Then try again with the toy aimed a little “upstream,” against the way the sheet slides.'],
      look: 'Aimed straight across, the toy reaches the far edge downstream of where it started, but it takes about the same time to cross. Aimed upstream, it lands straight across, and the crossing takes a little longer.' }
  ]
}
});


/* ---------- Gravity and orbits (Nov 12, 2026) ----------
   Gravity's sim (sims/gravity.js) has no art export; these helpers re-use its camera:
   CX = 300 − x·zb·sc, CY = (236 − 36·zb) + y·zb·sc, with sc = sim.vis.ppm and zb = sim.vis.zb (0 = whole Earth, 1 = following the ball). */
const GV_GM=3.986e14,GV_RE=6.371e6,GV_R0=GV_RE+400e3;
function gvXY(sim,x,y){const V=sim.vis,s=sim.st,sc=V.ppm||0.03,zb=V.zb||0;return [300-s.x*zb*sc+x*sc,(236-36*zb)+s.y*zb*sc-y*sc];}
function gvBall(sim){return gvXY(sim,sim.st.x,sim.st.y);}
/* cards sit under the speed-check panel (14 + 118k tall) on the right; they grow with k on phones (up to 1.45×) */
function gvCard(ctx,k,lines,x,y,w){const kk=Math.min(k,1.45);w=(w||268)*Math.min(kk,1.12);x=x==null?792-w:Math.min(x,792-w);y=y==null?26+118*k:y;const h=12+lines.length*20*kk;ctx.save();ctx.globalAlpha=0.96;ctx.fillStyle=PAL['cv-sol'];H.rr(ctx,x,y,w,h,8);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.stroke();ctx.restore();
  lines.forEach((l,j)=>{const o=typeof l==='string'?[l]:l;H.txt(ctx,o[0],x+10,y+22*kk+j*20*kk,{s:(o[2]||13)*kk,w:o[1]||500,c:o[3]||PAL['cv-ink']});});}
/* fire again 1.6 s after the ball lands, so a step keeps showing its motion */
function gvLoop(sim,ms){const s=sim.st;if(s.done==='crash'||s.done==='escape'){if(!sim._gvT)sim._gvT=performance.now();else if(performance.now()-sim._gvT>(ms||1600)){const a=sim.def.actions.find(x=>x.id==='fire');if(a)a.run(sim);sim._gvT=0;}}else sim._gvT=0;}
function gvDash(ctx,pts,col,w){ctx.save();ctx.setLineDash([7,6]);ctx.strokeStyle=col;ctx.lineWidth=w||2;ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();ctx.restore();}
/* cycle the force-mode distance through a list while a step is showing */
function gvCycle(sim,key,list){clearInterval(sim._gvC);let i=0;sim._gvC=setInterval(()=>{if(sim.lnKey!==key||!sim.tour||!sim.tour.on){clearInterval(sim._gvC);return;}i=(i+1)%list.length;BioLab.setValues(sim,{r:list[i]});},2400);}
const gvKm=v=>Math.round(v).toLocaleString();

BioLab.addLearn({
gravity: {
  goals: {
    bio: ['Why a ball fired sideways from a tall tower curves down to the ground', 'What an orbit really is: falling all the way around', 'How fast you have to go to orbit, and to leave Earth for good', 'Why astronauts float even though gravity is still strong up there'],
    honors: ['What an orbit really is: falling all the way around', 'Why the circular orbit speed is v = √(GM/r), and why higher orbits are slower', 'How gravity weakens with distance: the inverse-square law', 'Why your weight changes from planet to planet'],
    ap: ['What an orbit really is: falling all the way around', 'How the total energy per kilogram decides between an ellipse and escape', 'Kepler’s third law: T² is proportional to r³', 'How gravity weakens with distance: the inverse-square law']
  },
  matters: 'Every weather picture, every map on your phone and every live sports broadcast from overseas depends on something falling around the Earth without landing. The same gravity that drops your phone keeps the space station up.',
  startKey: 'start', startRun: false,
  startOverlay(sim,ctx,LH,k,tau){if(sim.def.hookOverlay)sim.def.hookOverlay(sim,ctx,LH,k,tau);},
  steps: [
    { key: 'drop', title: 'Drop it from the tower', set: { v0: 0, zoom: '12' }, fresh: true, speed: 0.25,
      see: 'Zoomed in 12 times: a ball on a tower 400 km tall, as high as the space station, drops. The red arrow is gravity.',
      why: 'Up here gravity is still 8.7 m/s², 89% as strong as on the ground. Space is not “zero gravity.”',
      overlay(sim,ctx,LH,k){gvLoop(sim);const [tx,ty]=gvXY(sim,0,GV_R0),[gx,gy]=gvXY(sim,0,GV_RE);tag(ctx,'400 km tower',tx-80,(ty+gy)/2,k,{s:12});
        if(!sim.st.done){const [bx,by]=gvBall(sim);tag(ctx,'gravity: toward Earth’s center',bx,by-34,k,{s:12,c:'#c8102e'});}
        gvCard(ctx,k,[['Gravity 400 km up',700],['8.7 m/s², 89% of the 9.8 m/s²'],['you feel on the ground']]);} },
    { key: 'slow', title: 'Fire it sideways', set: { v0: 3, zoom: '4' }, fresh: true, speed: 0.25,
      see: 'Fired sideways at 3 km/s. The dashed line is the path with no gravity; the red bracket shows how far gravity has pulled it below.',
      why: 'It moves sideways and falls at the same time. Falling bends the path into a curve that hits the ground.',
      overlay(sim,ctx,LH,k){gvLoop(sim);const s=sim.st,a=gvXY(sim,0,GV_R0),b=gvXY(sim,3.5e6,GV_R0);gvDash(ctx,[a,b],'#7fd6ff',2);tag(ctx,'with no gravity',Math.min(760,a[0]+150),a[1]-16,k,{s:12,c:'#1b6fb3'});
        if(s.x>2e4){const [bx,by]=gvBall(sim),[lx,ly]=gvXY(sim,s.x,GV_R0),f=(GV_R0-s.y)/1e3;if(by-ly>8){ctx.save();ctx.strokeStyle='#c8102e';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(bx-14,ly);ctx.lineTo(bx-14,by);ctx.moveTo(bx-20,ly);ctx.lineTo(bx-8,ly);ctx.moveTo(bx-20,by);ctx.lineTo(bx-8,by);ctx.stroke();ctx.restore();
          tag(ctx,'fallen '+gvKm(f)+' km',bx-90,(ly+by)/2,k,{s:12,hi:true});}}} },
    { key: 'curve', title: 'Faster: the ground curves away', set: { v0: 6.5 }, fresh: true, speed: 0.6,
      see: 'The whole Earth, fired at 6.5 km/s. It lands much farther around as the surface drops away below the dashed line.',
      why: 'Earth is round: the farther the ball goes, the more the ground curves away below it, about 5 m for every 8 km.',
      overlay(sim,ctx,LH,k){gvLoop(sim);const a=gvXY(sim,-4e6,GV_R0),b=gvXY(sim,9e6,GV_R0);gvDash(ctx,[a,b],'#7fd6ff',2);tag(ctx,'straight ahead',Math.min(700,b[0]-70),b[1]-16,k,{s:12,c:'#1b6fb3'});
        const g=gvXY(sim,GV_RE*Math.sin(0.9),GV_RE*Math.cos(0.9));tag(ctx,'the ground curves away',g[0]+90,g[1]+30,k,{s:12,hi:true});} },
    { key: 'orbit', title: 'Fast enough: it never lands', set: { v0: 7.7 }, fresh: true, speed: 0.6,
      see: 'At 7.7 km/s it goes all the way around. Its motion (blue) always points sideways; gravity (red) always points at Earth’s center.',
      why: 'It is still falling, but the ground curves away as fast as it falls. That is an orbit.',
      overlay(sim,ctx,LH,k){const s=sim.st,[bx,by]=gvBall(sim),r=Math.hypot(s.x,s.y),ux=s.x/r,uy=-s.y/r;tag(ctx,'falling',bx-ux*70,by-uy*70,k,{s:12,c:'#c8102e'});
        gvCard(ctx,k,[['7.7 km/s = about 17,000 mph',700],['One lap: about 92 minutes'],['Laps so far: '+s.orbits]]);} },
    { key: 'iss', title: 'Ride along: the space station', set: { v0: 7.7, zoom: '12' }, fresh: true, speed: 0.1,
      see: 'Zoomed in and slowed down, riding along. The ground slides past, but the ball stays 400 km up.',
      why: 'This is the space station’s orbit. Astronauts float because they and the station fall together, not because gravity is gone.',
      overlay(sim,ctx,LH,k){const [bx,by]=gvBall(sim),r=Math.hypot(sim.st.x,sim.st.y);tag(ctx,'still '+gvKm((r-GV_RE)/1e3)+' km up',bx,by-40,k,{s:12,hi:true});
        gvCard(ctx,k,[['The space station',700],['About 400 km up, 7.7 km/s'],['About 16 laps a day, so the crew'],['sees about 16 sunrises a day']]);} },
    { key: 'ellipse', title: 'Faster still: a stretched orbit', set: { v0: 9.5 }, fresh: true, speed: 2,
      see: 'At 9.5 km/s it swings out to about 16,000 km and comes back: fast near Earth, slow at the far end.',
      why: 'Going out, gravity slows it; coming back, gravity speeds it up. The path is an ellipse.',
      overlay(sim,ctx,LH,k){const p=gvXY(sim,0,GV_R0),q=gvXY(sim,0,-(GV_RE+15.86e6));tag(ctx,'fastest: 9.5 km/s',p[0],p[1]-22,k,{s:12,hi:true});tag(ctx,'slowest: 2.9 km/s',q[0],Math.min(LH-20,q[1]+22),k,{s:12,hi:true});
        const [bx,by]=gvBall(sim),v=Math.hypot(sim.st.vx,sim.st.vy)/1e3;tag(ctx,v.toFixed(1)+' km/s',bx+56,by,k,{s:12});} },
    { key: 'escape', title: 'Escape', set: { v0: 11 }, fresh: true, speed: 2,
      see: 'At 11 km/s it leaves. Its speed drops as it climbs, but it never comes back.',
      why: 'Gravity weakens with distance. Above 10.85 km/s here, it runs out of strength before it can stop the ball.',
      overlay(sim,ctx,LH,k){gvLoop(sim,1200);const s=sim.st,[bx,by]=gvBall(sim),v=Math.hypot(s.vx,s.vy)/1e3;if(!s.done)tag(ctx,v.toFixed(1)+' km/s',clamp(bx+56,60,740),clamp(by,20,LH-20),k,{s:12,hi:true});
        gvCard(ctx,k,[['Escape speed here: 10.85 km/s',700],['From the ground: 11.2 km/s']]);} },
    { key: 'weaker', title: 'Gravity weakens with distance', set: { mode: 'force', planet: 'earth', r: 1, m: 10 }, fresh: true, pause: true, run(sim){gvCycle(sim,'weaker',[1,2,3]);},
      see: 'A 10 kg object moves from Earth’s surface out to 2, then 3, Earth radii from the center. The pull arrow shrinks.',
      why: 'Twice as far, ¼ the pull; three times, 1/9. Gravity weakens but never reaches zero.',
      overlay(sim,ctx,LH,k){const r=sim.p.r,F=v=>(98.2/(v*v)).toFixed(1);gvCard(ctx,k,[['Pull on a 10 kg object',700],...[1,2,3].map(v=>[v+(v===1?' radius (the ground): ':' radii: ')+F(v)+' N'+(v>1?' (1/'+v*v+')':''),v===r?700:500,13,v===r?'#c8102e':PAL['cv-ink']])],470,60+110*k,300);} },
    { key: 'invsq', title: 'The inverse-square graph', speed: 0.5,
      see: 'The pull on the 10 kg object against distance: 98 N at 1 Earth radius, 24.5 N at 2, 10.9 N at 3.',
      why: 'Double the distance, ¼ the force. The curve drops fast, then flattens, but never reaches zero.',
      overlay(sim,ctx,LH,k,tau){const K=BioLab.lg,p=tau%12,B={x0:110,x1:640,y0:70,y1:370},F=r=>98/(r*r),xr=[1,5];
        K.dim(ctx,LH);K.axes(ctx,B,k,{xr,xt:[[1,'1'],[2,'2'],[3,'3'],[4,'4'],[5,'5']],yt:[[0,'0'],[0.5,'50'],[1,'100']],xl:'Distance from Earth’s center (Earth radii)',yl:'Pull on 10 kg (N)'});
        const to=p<5?1+4*p/5:5;K.curve(ctx,B,xr,r=>F(r)/100,to,'#1f6feb');
        [[1,'98 N'],[2,'24.5 N'],[3,'10.9 N']].forEach(([r,l])=>{if(to<r)return;const x=K.X(B,xr,r),y=K.Y(B,F(r)/100);K.dot(ctx,x,y,'#c8102e',7);K.tagA(ctx,l,x+12,y-22,k,{s:13},'l');});
        if(p>5.5)K.tagA(ctx,'2× as far → ¼ the pull',790,40,k,{hi:true},'r');} },
    { lvl: 'honors', key: 'higher', title: 'Higher orbits are slower', set: { mode: 'cannon', h: 2000, v0: 6.9 }, fresh: true, speed: 1,
      see: 'The tower is now 2000 km tall. At only 6.9 km/s the ball still circles, on a wider circle.',
      why: 'v = √(GM/r): farther out, gravity is weaker, so less speed is enough. GPS satellites need only 3.9 km/s.',
      overlay(sim,ctx,LH,k){gvCard(ctx,k,[['v = √(GM/r)',700],['400 km up: 7.67 km/s'],['2000 km up: 6.90 km/s'],['GPS, 20,200 km up: 3.87 km/s']]);} },
    { lvl: 'honors', key: 'mars', title: 'Your weight on Mars', set: { mode: 'force', planet: 'mars', r: 1, m: 10 }, fresh: true, pause: true,
      see: 'The same 10 kg object on Mars. The pull is 37 N, not 98 N.',
      why: 'g = GM/R². Mars has 0.107 of Earth’s mass and 0.532 of its radius: 0.107 ÷ 0.532² = 0.38. Your mass is still 10 kg.',
      overlay(sim,ctx,LH,k){gvCard(ctx,k,[['g = GM/R²',700],['Earth: 9.8 N/kg → 98 N'],['Mars: 0.107 ÷ 0.532² = 0.38 of Earth'],['3.7 N/kg → 37 N',700,13,'#c8102e']],470,60+110*k,300);} },
    { lvl: 'ap', key: 'energy', title: 'Energy decides: bound or free', set: { mode: 'cannon', v0: 10 }, fresh: true, speed: 4,
      see: 'At 10 km/s, just under escape speed, the ball climbs about 32,000 km and falls back.',
      why: 'E = v²/2 − GM/r = 50.0 − 58.9 = −8.9 MJ/kg. Negative energy means a closed ellipse. At 10.85 km/s, E = 0 and it escapes.',
      overlay(sim,ctx,LH,k){gvCard(ctx,k,[['E = v²/2 − GM/r',700],['= 50.0 − 58.9 = −8.9 MJ/kg'],['E < 0: bound (ellipse)',700,13,'#c8102e'],['E ≥ 0: escape']]);} },
    { lvl: 'ap', key: 'kepler', title: 'Kepler’s third law', set: { mode: 'cannon', h: 3000, v0: 6.5 }, fresh: true, speed: 2,
      see: 'A near-circular orbit 9371 km from Earth’s center takes about 150 min, against 92 min at 400 km.',
      why: 'T² ∝ r³. The radius grew 1.38 times, so the period grows 1.38^1.5 = 1.63 times: 92.4 × 1.63 ≈ 150 min.',
      overlay(sim,ctx,LH,k){gvCard(ctx,k,[['T² ∝ r³',700],['r = 6771 km: T = 92.4 min'],['r = 9371 km: T = 150.5 min'],['(9371 ÷ 6771)^1.5 = 1.63']]);} }
  ],
  useIt: [
    { do: 'Look up the space station’s next pass over Colorado with NASA’s Spot the Station, then go outside and watch it.',
      why: 'It shows as a bright, steady dot crossing the sky in a few minutes, usually an hour or two after sunset or before sunrise, when your sky is dark but sunlight still reaches the station 400 km up. That is the 7.7 km/s orbit from this lab (NASA Spot the Station).' },
    { do: 'When your map app puts you in the wrong place downtown, step into the open, away from tall buildings.',
      why: 'GPS satellites orbit about 20,200 km up and circle Earth twice a day. Your phone needs a clear line to several of them; buildings, bridges and trees block or bounce their signals. Under open sky a phone is usually accurate to about 5 m (GPS.gov).' },
    { do: 'Aim a satellite TV dish or a weather-satellite antenna once, toward the southern sky, and leave it.',
      why: 'Those satellites sit 35,786 km above the equator, where one orbit takes exactly as long as one turn of the Earth. They stay over the same spot, so the dish never has to track them. From Colorado, the equator is to the south (NOAA).' }
  ],
  tryIt: [
    { title: 'Newton’s cannon on a table (5 minutes)',
      steps: ['Roll a marble or ball off the edge of a table, slowly. Mark where it lands.', 'Roll it off again, much faster. Mark where it lands.', 'Have a friend watch from the side and say which one hits the floor first.'],
      look: 'The fast one lands farther away, but both hit the floor at the same moment. Moving sideways doesn’t stop falling. On a round planet, fast enough sideways means the ground curves away before you land.' },
    { title: 'spot the station (one evening)',
      steps: ['Find the next pass at spotthestation.nasa.gov or in NASA’s Spot the Station app.', 'Go outside at that time and look where it says it will appear.', 'Time how long it takes to cross the sky.'],
      look: 'A bright dot that does not blink, moving steadily, gone in a few minutes. You are watching something fall around the Earth at 7.7 km/s.' }
  ]
}
});


/* ---------- Circular motion (Nov 12, 2026) ----------
   Coordinates from sims/circular.js: puck table STR (cx 285, cy 225, 136 px/m; table x 20–540);
   curve track centre (300, 225), radius 170 px, car at angle phi; loop LOOP (cx 330, ground 404, 17 px/m);
   rotor drawn below y ≈ 150, empty sky above it on the left. */
const ciAct=(sim,id)=>{const a=sim.def.actions.find(x=>x.id===id);if(a)a.run(sim);};
const ciMet=(sim,id)=>{const m=sim.def.metrics.find(x=>x.id===id);return m?m.get(sim):null;};
function ciCard(ctx,k,lines,x,y,w,LH){const kk=Math.min(k,1.45);w=Math.min(784,w*Math.max(1,kk));x=Math.max(8,Math.min(x,792-w));const h=12+lines.length*20*kk;if(LH)y=Math.min(y,LH-h-8);
  ctx.save();ctx.globalAlpha=0.96;ctx.fillStyle=PAL['cv-sol'];H.rr(ctx,x,y,w,h,8);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.stroke();ctx.restore();
  lines.forEach((l,j)=>{const o=typeof l==='string'?[l]:l;H.txt(ctx,o[0],x+10,y+22*kk+j*20*kk,{s:(o[2]||13)*kk,w:o[1]||500,c:o[3]||PAL['cv-ink']});});}
function ciPuck(sim){const q=sim.st.str,p=sim.p;return q.cut?[285+q.x*136,225-q.y*136]:[285+p.r*136*Math.cos(q.th),225-p.r*136*Math.sin(q.th)];}
function ciArrow(ctx,x,y,dx,dy,col,w){const L=Math.hypot(dx,dy);if(L<3)return;const ux=dx/L,uy=dy/L,h=Math.min(12,4+L*0.3);ctx.save();ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=w||3;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+dx-ux*h*0.8,y+dy-uy*h*0.8);ctx.stroke();ctx.beginPath();ctx.moveTo(x+dx,y+dy);ctx.lineTo(x+dx-ux*h-uy*h*0.55,y+dy-uy*h+ux*h*0.55);ctx.lineTo(x+dx-ux*h+uy*h*0.55,y+dy-uy*h-ux*h*0.55);ctx.closePath();ctx.fill();ctx.restore();}
/* cut the string 1.4 s into each run and start again 1.5 s after the puck leaves the table */
function ciCutLoop(sim){const q=sim.st.str;if(!q)return;if(!q.cut&&q.t>1.4)ciAct(sim,'cut');if(q.stop){if(!sim._ciT)sim._ciT=performance.now();else if(performance.now()-sim._ciT>1500){ciAct(sim,'go');sim._ciT=0;}}else sim._ciT=0;}
function ciCarLoop(sim){const c=sim.st.car;if(!c)return;if(c.skid||c.slideIn){if(c.t-(c.skidAt||0)>3.2)ciAct(sim,'go');}}
function ciCar(sim){const c=sim.st.car,p=sim.p;if(c.skid)return [300+c.x*170/p.cr,225-c.y*170/p.cr];return [300+170*Math.cos(c.phi),225-170*Math.sin(c.phi)];}

BioLab.addLearn({
circular: {
  goals: {
    bio: ['Why going around a curve at a steady speed still counts as accelerating', 'Which way the push or pull points when something turns', 'What really happens when a string snaps or tires lose their grip', 'Why snow makes the safe speed on a curve so much lower'],
    honors: ['Why going around a curve at a steady speed still counts as accelerating', 'How to find the centripetal acceleration, a = v²/r, and the force that supplies it', 'Why doubling your speed takes four times the grip', 'The slowest speed that makes it over the top of a loop'],
    ap: ['How to find the centripetal acceleration, a = v²/r, and the force that supplies it', 'How to write ΣF = mv²/r for a loop, a curve and a rotor ride', 'How a banked curve turns a car with no friction at all']
  },
  matters: 'Every curve you drive or ride, every turn on a bike, every swing ride and every off-ramp in a Colorado snowstorm is circular motion. Knowing what force turns you, and how fast it runs out, tells you how fast is safe.',
  startKey: 'start', startRun: true, startSpeed: 1,
  startOverlay(sim,ctx,LH,k){if(sim.p.mode!=='curve'){BioLab.setValues(sim,{mode:'curve',cv:15,cr:50,mu:0.7});BioLab.reset(sim);}const [x,y]=ciCar(sim);tag(ctx,'your car: 15 m/s',x-80,y+26,k,{s:12,hi:true});tag(ctx,'curve radius 50 m',300,200,k,{s:12});ciCard(ctx,k,[['Same curve, two roads',700],['Dry road: grip μ = 0.7'],['Packed snow: grip μ = 0.2']],190,235,220);},
  steps: [
    { key: 'puck', title: 'Around and around', set: { mode: 'string' }, fresh: true, speed: 0.4,
      see: 'From above: a puck on an air table, tied to a pin. Dots mark it every 0.1 s; the blue arrow is its velocity.',
      why: 'Even dots mean a steady speed, 4 m/s. But the arrow keeps turning, always along the circle.',
      overlay(sim,ctx,LH,k){const [x,y]=ciPuck(sim);tag(ctx,'velocity: along the circle',clamp(x+40,120,450),clamp(y+46,40,420),k,{s:12,c:'#1b6fb3'});ciCard(ctx,k,[['Speed: 4 m/s, every moment',700],['Direction: always changing']],32,360,250,LH);} },
    { key: 'turn', title: 'Turning is accelerating', set: { mode: 'string' }, fresh: true, speed: 0.4,
      see: 'Bottom left: the velocity a moment ago (light blue) and now (dark blue). The red arrow is the change. Watch where it points.',
      why: 'A change of direction is acceleration. The change always points to the center, so something must pull inward: the string.',
      overlay(sim,ctx,LH,k){const q=sim.st.str,th=q.th,O=[110,330],L=62,a=[-Math.sin(th-0.7)*L,-Math.cos(th-0.7)*L],b=[-Math.sin(th)*L,-Math.cos(th)*L];
        ctx.save();ctx.globalAlpha=0.95;ctx.fillStyle=PAL['cv-sol'];H.rr(ctx,36,256,150,150,10);ctx.fill();ctx.restore();
        ciArrow(ctx,O[0],O[1],a[0],a[1],'#8fc4ef',3);ciArrow(ctx,O[0],O[1],b[0],b[1],'#1b6fb3',3);ciArrow(ctx,O[0]+a[0],O[1]+a[1],b[0]-a[0],b[1]-a[1],'#c8102e',3);
        const [x,y]=ciPuck(sim),dx=285-x,dy=225-y,d=Math.hypot(dx,dy);ciArrow(ctx,x,y,dx/d*48,dy/d*48,'#c8102e',3);tag(ctx,'change in velocity → toward the center',300,428,k,{s:12,c:'#c8102e'});} },
    { key: 'cut', title: 'Cut the string', set: { mode: 'string' }, fresh: true, speed: 0.4,
      see: 'The string is cut. The dashed red line points straight out from the pin. Watch where the puck really goes.',
      why: 'Nothing turns it now, so it keeps its velocity and goes along the tangent, not straight out (Newton’s first law).',
      overlay(sim,ctx,LH,k){ciCutLoop(sim);const q=sim.st.str;if(!q.cut)return;const a=q.cutAt,px=285+sim.p.r*136*Math.cos(a),py=225-sim.p.r*136*Math.sin(a);
        ctx.save();ctx.setLineDash([6,6]);ctx.strokeStyle='#c8102e';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(285,225);ctx.lineTo(285+(sim.p.r+0.8)*136*Math.cos(a),225-(sim.p.r+0.8)*136*Math.sin(a));ctx.stroke();ctx.restore();
        tag(ctx,'✗ not straight out',clamp(285+(sim.p.r+0.9)*136*Math.cos(a),90,470),clamp(225-(sim.p.r+0.9)*136*Math.sin(a),30,420),k,{s:12,c:'#c8102e'});
        const [x,y]=ciPuck(sim);tag(ctx,'✓ straight along the tangent',clamp(x,110,450),clamp(y-28,30,420),k,{s:12,hi:true});} },
    { key: 'faster', cause: { from: { v: 4 } }, title: 'Twice as fast', set: { mode: 'string', v: 8 }, fresh: true, speed: 0.25,
      see: 'Same puck and string at 8 m/s. Watch the string tension on the right.',
      why: 'Twice as fast takes 4 times the pull: 40 N instead of 10 N. That is why fast turns need so much grip.',
      overlay(sim,ctx,LH,k){ciCard(ctx,k,[['String pull',700],['4 m/s: 10 N'],['8 m/s: 40 N, 4× as much',700,13,'#c8102e']],32,340,240,LH);} },
    { key: 'curve', title: 'A car on a dry curve', set: { mode: 'curve', cv: 15, cr: 50, mu: 0.7 }, fresh: true, speed: 1,
      see: 'A car on a 50 m curve at 15 m/s (34 mph), seen from above. The gauge shows how much of the tires’ grip it uses.',
      why: 'On a flat road only friction pulls the car inward. This turn uses 66% of the grip, so it holds.',
      overlay(sim,ctx,LH,k){const [x,y]=ciCar(sim),dx=300-x,dy=225-y,d=Math.hypot(dx,dy);ciArrow(ctx,x,y,dx/d*46,dy/d*46,'#7a3fb0',3);tag(ctx,'tire friction: toward the center',300,160,k,{s:12,c:'#7a3fb0'});
        ciCard(ctx,k,[['Dry road',700],['Grip used: '+Math.round(ciMet(sim,'grip'))+'%'],['Top safe speed: 18.5 m/s']],200,235,200);} },
    { key: 'snow', cause: { from: { mu: 0.7 } }, title: 'The same curve on snow', set: { mode: 'curve', cv: 15, cr: 50, mu: 0.2 }, fresh: true, speed: 1,
      see: 'Same car and speed, but on packed snow (grip 0.2). Watch where the car goes.',
      why: 'Snow supplies only about a third of the inward pull needed. The car goes nearly straight along the tangent, like the cut string.',
      overlay(sim,ctx,LH,k){ciCarLoop(sim);ciCard(ctx,k,[['Packed snow',700],['Grip needed: 230% of what it has',700,13,'#c8102e'],['Top safe speed: 9.9 m/s (22 mph)']],180,235,240);} },
    { key: 'snowslow', title: 'Slow down for the snow', set: { mode: 'curve', cv: 9.5, cr: 50, mu: 0.2 }, fresh: true, speed: 1,
      see: 'Still on snow, now at 9.5 m/s (21 mph). The car holds the curve.',
      why: 'Grip needed grows with speed squared, so two-thirds the speed needs under half the grip.',
      overlay(sim,ctx,LH,k){ciCard(ctx,k,[['Snow, 9.5 m/s',700],['Grip used: '+Math.round(ciMet(sim,'grip'))+'%'],['It makes the curve',700,13,'#1b7a3e']],200,235,200);} },
    { key: 'loop', title: 'Loop-the-loop', set: { mode: 'loop', lR: 5, lv: 17 }, fresh: true, speed: 0.5,
      see: 'A cart rides a 10 m loop. Its label shows how heavy the rider feels, as a multiple of normal weight.',
      why: 'The track pushes toward the center. At the bottom that is up, against gravity: heavy. At the top gravity helps: light.',
      overlay(sim,ctx,LH,k){const c=sim.st.cart,X=330+c.x*17,Y=404-c.y*17,f=ciMet(sim,'feel');if(f!=null&&isFinite(f))tag(ctx,'feels '+f.toFixed(1)+'× weight',clamp(X+86,90,700),clamp(Y-10,30,420),k,{s:12,hi:true});
        tag(ctx,'top: lightest',330,212,k,{s:12});tag(ctx,'bottom: heaviest',330,428,k,{s:12});} },
    { key: 'rotor', title: 'The rotor ride', set: { mode: 'rotor', rpm: 30, rR: 3, rmu: 0.4 }, fresh: true, speed: 1, run(sim){setTimeout(()=>{if(sim.lnKey==='rotor'&&sim.st.rot&&!sim.st.rot.floor)ciAct(sim,'floor');},1800);},
      see: 'Riders stand against a spinning drum’s wall. The floor drops away. Watch the riders.',
      why: 'The wall pushes them inward to keep them circling. That push lets friction hold up to 711 N against 588 N of weight.',
      overlay(sim,ctx,LH,k){ciCard(ctx,k,[['Wall push toward the center: 1,776 N',700],['Friction it allows: up to 711 N'],['Rider’s weight: 588 N → held up',700,13,'#1b7a3e']],20,40,320);} },
    { lvl: 'honors', key: 'ac', title: 'a = v²/r', set: { mode: 'string', v: 4, r: 0.4 }, fresh: true, speed: 0.4,
      see: 'The string is half as long, 0.4 m, at the same 4 m/s.',
      why: 'a = v²/r = 4² ÷ 0.4 = 40 m/s², twice before. The string pulls F = ma = 0.5 × 40 = 20 N.',
      overlay(sim,ctx,LH,k){ciCard(ctx,k,[['a = v²/r',700],['r = 0.8 m: 16 ÷ 0.8 = 20 m/s² → 10 N'],['r = 0.4 m: 16 ÷ 0.4 = 40 m/s² → 20 N',700,13,'#c8102e']],32,340,300,LH);} },
    { lvl: 'honors', key: 'loopmin', title: 'Just enough speed for the loop', set: { mode: 'loop', lR: 5 }, fresh: true, speed: 0.5, run(sim){ciAct(sim,'minimum');},
      see: 'The cart enters at exactly √(5gR) = 15.7 m/s. Watch the label at the top.',
      why: 'Slowest safe top speed: N = 0, so v<sub>top</sub> = √(gR) = 7.0 m/s. Energy adds 4gR: v² = 5gR at the bottom.',
      overlay(sim,ctx,LH,k){const c=sim.st.cart,X=330+c.x*17,Y=404-c.y*17,f=ciMet(sim,'feel');if(f!=null&&isFinite(f))tag(ctx,'feels '+f.toFixed(1)+'× weight',clamp(X+86,90,700),clamp(Y-10,30,420),k,{s:12,hi:true});
        ciCard(ctx,k,[['At the top: N = 0',700],['mg = mv²/R → v = √(gR) = 7.0 m/s'],['Entry: √(5gR) = 15.7 m/s']],60,40,280);} },
    { lvl: 'ap', key: 'bank', title: 'Banked curves', set: { mode: 'curve', bank: 20, mu: 0, cr: 50, fbd: true }, fresh: true, speed: 1, run(sim){ciAct(sim,'design');},
      see: 'The road is banked 20° and has no friction at all (μ = 0). At the design speed the car still holds the curve. Look at the cross-section on the right.',
      why: 'The tilted road pushes perpendicular to its surface, so the normal force has a horizontal part toward the center. N sin θ = mv²/r and N cos θ = mg give v = √(gr tan θ) = √(9.8 × 50 × tan 20°) = 13.4 m/s.',
      overlay(sim,ctx,LH,k){ciCard(ctx,k,[['No friction needed',700],['v = √(gr tan θ) = 13.4 m/s'],['N sin θ supplies mv²/r']],190,235,220);} }
  ],
  useIt: [
    { do: 'On snow or ice, slow down before the curve and drive through it at a steady speed. Don’t brake in the middle of it.',
      why: 'The grip a curve needs grows with speed squared, and snow gives about a third of dry-road grip. Braking mid-curve asks the same tires for even more. Colorado’s transportation department says to avoid braking on curves and to drive through them at a safe, steady speed (CDOT Winter Driving Tips).' },
    { do: 'Check your tire tread before winter, for example with a coin in the tread.',
      why: 'On a flat curve, the tires are the only thing turning the car. Worn tires can’t grip the road well, and CDOT calls them extremely hazardous on snow (CDOT).' },
    { do: 'Secure loose things in the car, and buckle up even for short drives.',
      why: 'In a sharp turn, nothing is pulling a loose phone or backpack toward the center, so it keeps going straight while the car turns under it. The same happens to an unbelted person.' }
  ],
  tryIt: [
    { title: 'the bucket swing (5 minutes, outside)',
      steps: ['Put a cup of water in a small bucket.', 'Swing it in a big vertical circle, quickly and steadily, at arm’s length.', 'Slow down a little each time until the water starts to splash at the top. Then stop.'],
      look: 'At arm’s length (about 1 m) the bucket needs at least √(gR) ≈ 3.1 m/s at the top. Faster than that, the bucket pushes the water around the circle. Slower, gravity pulls the water down more than the circle needs.' },
    { title: 'the coin on the turntable (2 minutes)',
      steps: ['Put a coin near the middle of a lazy Susan or a spinning plate, then one near the edge.', 'Spin it slowly, then a little faster.'],
      look: 'The coin at the edge slides off first, and it leaves along a straight line, not straight out. It is moving faster and needs more grip to turn, just like a car on a tight curve.' }
  ]
}
});

/* ---------- Energy and momentum (Nov 2026): skatepark, power, springs, collisions, impulse ---------- */
const emMet=(sim,id)=>{const m=sim.def.metrics.find(x=>x.id===id);return m?m.get(sim):null;};
const emAct=(sim,id)=>{const a=(sim.def.actions||[]).find(x=>x.id===id);if(a)a.run(sim);};
const n0=v=>v==null||!isFinite(v)?'…':Math.round(v).toLocaleString('en-US');
const n1=v=>v==null||!isFinite(v)?'…':v.toFixed(1);
const n2=v=>v==null||!isFinite(v)?'…':v.toFixed(2).replace('-','−');
const GRN='#1b7a3e',RED='#c8102e';
/* restart a collision run 1.6 s after it ends, and an impact 2.6 s after it lands */
function coLoop(sim){const s=sim.st;if(!s)return;if(s.done){if(!sim._emT)sim._emT=performance.now();else if(performance.now()-sim._emT>1600){sim._emT=0;emAct(sim,'run');}}else sim._emT=0;}
function imLoop(sim){const s=sim.st;if(s&&s.phase==='after'&&s.ta>2.6)emAct(sim,'again');}
const skC=(ctx,k,L,LH)=>ciCard(ctx,k,L,150,24,280,LH);
const pwS=(ctx,k,L,LH)=>ciCard(ctx,k,L,190,78,310,LH);
const pwP=(ctx,k,L,LH)=>ciCard(ctx,k,L,20,184,330,LH);
const spC=(ctx,k,L,LH)=>ciCard(ctx,k,L,322,322,218,LH);
const coC=(ctx,k,L,LH)=>ciCard(ctx,k,L,292,4,236,LH);
const imC=(ctx,k,L,LH)=>ciCard(ctx,k,L,66,34,320,LH);
const imCar=(ctx,k,L,LH)=>ciCard(ctx,k,L,60,70,300,LH);
BioLab.addLearn({
skatepark: {
  goals: {
    bio: ['How height stores energy (potential energy) and motion carries it (kinetic energy)', 'Why the skater is fastest at the bottom and gets back to the same height', 'Where the energy goes when there is friction', 'Why a heavier skater is not faster'],
    honors: ['How to use mgh = ½mv² to find a speed anywhere on the track', 'Why the zero of potential energy is your choice', 'How friction turns mechanical energy into thermal energy while the total stays the same'],
    ap: ['How to use conservation of energy with the work–energy theorem', 'Why a loop needs v² ≥ gR at the top, so a start height of at least 2.5R', 'What the normal force does on a curve and when the skater leaves the track']
  },
  matters: 'Every ski run, bike ride downhill, playground slide and roller coaster at Elitch Gardens is energy changing form. Once you can track it, you can predict speed without timing anything, and see why brakes get hot.',
  startKey: 'top', startRun: false,
  startOverlay(sim,ctx,LH,k){if(sim.p.track!=='halfpipe'||sim.p.h0!==5){BioLab.setValues(sim,{track:'halfpipe',h0:5,mu:0,mass:60,planet:'earth'});emAct(sim,'restart');}
    skC(ctx,k,[['A 60 kg skater, 5 m up a half-pipe',700],['Grid squares are 1 m. The bars on the right'],['track her energy in joules.']],LH);},
  steps: [
    { key: 'top', title: 'Energy stored by height', set: { track: 'halfpipe', h0: 5, mu: 0, mass: 60, planet: 'earth' }, fresh: true, pause: true,
      see: 'The skater waits at the top, 5 m above the bottom of the half-pipe. Look at the bars on the right.',
      why: 'She isn’t moving, so no kinetic energy. All of it is <b>potential energy</b>: PE = mgh = 60 × 9.8 × 5 ≈ 2,940 J.',
      overlay(sim,ctx,LH,k){skC(ctx,k,[['PE = mgh',700],['= 60 × 9.8 × 5 ≈ '+n0(emMet(sim,'pe'))+' J'],['KE = 0 J: she isn’t moving']],LH);} },
    { key: 'down', title: 'Falling trades PE for KE', set: { track: 'halfpipe', h0: 5, mu: 0, mass: 60, planet: 'earth' }, fresh: true, speed: 0.2,
      see: 'Slow motion. Watch the blue potential bar and the green kinetic bar as she drops.',
      why: 'Every joule of potential energy she loses shows up as kinetic energy. The two bars change by the same amount, and the gold total bar doesn’t move at all.',
      overlay(sim,ctx,LH,k){skC(ctx,k,[['KE '+n0(emMet(sim,'ke'))+' J + PE '+n0(emMet(sim,'pe'))+' J',700],['= '+n0(emMet(sim,'tot'))+' J total, the whole way down',600,13,GRN]],LH);} },
    { key: 'bottom', title: 'Fastest at the bottom', set: { track: 'halfpipe', h0: 5, mu: 0, mass: 60, planet: 'earth' }, fresh: true, speed: 0.4,
      see: 'Watch the speedometer, top right, as she passes the lowest point.',
      why: 'At the bottom almost all the energy is kinetic, so that is where she is fastest. ½mv² = mgh gives v = √(2gh) = √(2 × 9.8 × 5) ≈ 9.9 m/s, about 22 mph.',
      overlay(sim,ctx,LH,k){skC(ctx,k,[['Top speed so far: '+n1(emMet(sim,'vtop'))+' m/s',700],['v = √(2gh) = √(2 × 9.8 × 5) ≈ 9.9 m/s']],LH);} },
    { key: 'up', title: 'Back to the same height', set: { track: 'halfpipe', h0: 5, mu: 0, mass: 60, planet: 'earth' }, fresh: true, speed: 0.7,
      see: 'Watch how high she gets on the far side, compared with the dashed start line.',
      why: 'Kinetic energy turns back into potential. With no friction nothing leaves, so she stops at exactly 5 m and swings forever.',
      overlay(sim,ctx,LH,k){skC(ctx,k,[['Height now: '+n1(emMet(sim,'height'))+' m',700],['She turns around at the dashed 5 m line']],LH);} },
    { key: 'mass', cause: { from: { mass: 60 } }, title: 'A heavier skater', set: { track: 'halfpipe', h0: 5, mu: 0, mass: 120, planet: 'earth' }, fresh: true, speed: 0.4,
      see: 'Same track and 5 m, but the skater is 120 kg. Compare the bars and the top speed.',
      why: 'Twice the mass stores twice the energy (about 5,880 J), but there is twice as much to move. Mass cancels: still 9.9 m/s.',
      overlay(sim,ctx,LH,k){skC(ctx,k,[['120 kg: total '+n0(emMet(sim,'tot'))+' J (twice as much)',700],['Top speed: '+n1(emMet(sim,'vtop'))+' m/s, the same as 60 kg',600,13,GRN]],LH);} },
    { key: 'friction', cause: { from: { mu: 0 } }, title: 'Add friction', set: { track: 'halfpipe', h0: 5, mu: 0.08, mass: 60, planet: 'earth' }, fresh: true, speed: 1,
      see: 'Now the track has friction. Watch the red thermal bar and each swing’s height.',
      why: 'Friction turns kinetic energy into thermal energy. The gold total stays the same, but less is left for motion, so each swing is lower.',
      overlay(sim,ctx,LH,k){skC(ctx,k,[['Thermal: '+n0(emMet(sim,'th'))+' J and growing',700,13,RED],['Total: '+n0(emMet(sim,'tot'))+' J, unchanged',600,13,GRN]],LH);} },
    { key: 'moon', title: 'The same drop on the Moon', set: { track: 'halfpipe', h0: 5, mu: 0, mass: 60, planet: 'moon' }, fresh: true, speed: 1,
      see: 'Same skater and track on the Moon, where gravity is 1.62 m/s².',
      why: 'Weaker gravity stores less energy in the same height, so she is slower: about 4.0 m/s at the bottom. She still climbs back to 5 m.',
      overlay(sim,ctx,LH,k){skC(ctx,k,[['On the Moon: g = 1.62 m/s²',700],['Top speed: '+n1(emMet(sim,'vtop'))+' m/s (Earth: 9.9 m/s)']],LH);} },
    { lvl: 'honors', key: 'mid', title: 'Speed anywhere on the track', set: { track: 'halfpipe', h0: 5, mu: 0, mass: 60, planet: 'earth' }, fresh: true, speed: 0.3,
      see: 'Read her speed and height together as she rides.',
      why: 'Only the drop matters. At 2 m high she has dropped 3 m: v = √(2 × 9.8 × 3) ≈ 7.7 m/s, going up or down.',
      overlay(sim,ctx,LH,k){skC(ctx,k,[['Height '+n1(emMet(sim,'height'))+' m → speed '+n1(emMet(sim,'speed'))+' m/s',700],['At 2 m: √(2 × 9.8 × 3) ≈ 7.7 m/s']],LH);} },
    { lvl: 'honors', key: 'ref', title: 'You choose where PE = 0', set: { track: 'halfpipe', h0: 5, mu: 0, mass: 60, planet: 'earth', yref: 2 }, fresh: true, speed: 0.6,
      see: 'PE = 0 is now 2 m up (gold dashed line). Watch the PE bar near the bottom, and the motion.',
      why: 'Below the new zero, PE is negative, and every value drops by 1,176 J. Only <b>changes</b> in PE matter, so the motion is identical.',
      overlay(sim,ctx,LH,k){skC(ctx,k,[['PE now: '+n0(emMet(sim,'pe'))+' J (can be negative)',700],['Same motion, same top speed: '+n1(emMet(sim,'vtop'))+' m/s']],LH);} },
    { lvl: 'ap', key: 'loop', title: 'Enough height for the loop', set: { track: 'loop', h0: 5.5, mu: 0, mass: 60, planet: 'earth', yref: 0, lock: false }, fresh: true, speed: 0.5,
      see: 'A loop of radius R = 2 m, wheels not locked to the track, starting from 5.5 m. Watch her at the very top.',
      why: 'At the top the track and gravity both push toward the center: N + mg = mv²/R. She stays on as long as N ≥ 0, so v² ≥ gR. Energy then says h ≥ 2R + R/2 = 2.5R = 5 m. From 5.5 m she makes it.',
      overlay(sim,ctx,LH,k){skC(ctx,k,[['Top of the loop: v² ≥ gR',700],['mgh = mg(2R) + ½m(gR) → h ≥ 2.5R = 5 m'],['Normal force now: '+n0(emMet(sim,'N'))+' N']],LH);} },
    { lvl: 'ap', key: 'loopfail', title: 'Not quite high enough', set: { track: 'loop', h0: 4, mu: 0, mass: 60, planet: 'earth', yref: 0, lock: false }, fresh: true, speed: 0.5,
      see: 'Same loop, starting from only 4 m, the height of the loop itself.',
      why: 'She would reach the top with no speed at all. Long before that, v² drops below gR, the normal force needed would be negative, and the track can only push. She leaves the track and falls as a projectile.',
      overlay(sim,ctx,LH,k){skC(ctx,k,[['From 4 m: '+(sim.st.on?'still on the track':'off the track!'),700,13,sim.st.on?PAL['cv-ink']:RED],['Needs at least 2.5R = 5 m']],LH);} }
  ],
  useIt: [
    { do: 'Going down a steep hill on a bike or a sled, control your speed early, before you have built it up.',
      why: 'Every meter you drop turns about 10 J per kilogram into motion. From 10 m up, with no friction, that is √(2 × 9.8 × 10) = 14 m/s, over 30 mph. Brakes have to turn all of that into heat.' },
    { do: 'On a long mountain descent in a car, shift to a lower gear instead of riding the brakes.',
      why: 'Coming down a mountain pass, the car’s potential energy has to go somewhere. Brakes turn it into heat and can overheat and fade. A lower gear lets the engine absorb some of it (CDOT says to use lower gears on steep grades).' },
    { do: 'When someone says a heavier person will slide faster, check the friction, not the mass.',
      why: 'Without friction or air, mass cancels: v = √(2gh) for everyone. Real differences come from friction and air drag, not weight by itself.' }
  ],
  tryIt: [
    { title: 'the pendulum that won’t hit you (5 minutes)',
      steps: ['Tie a heavy object (a water bottle) to a string and hang it from a doorframe.', 'Hold it against your nose, then let it go. Don’t push it.', 'Stand still while it swings away and back.'],
      look: 'It comes back almost to your nose, but never past it. With nothing adding energy, it can’t rise higher than where it started. Each swing is a little lower because air friction takes some energy.' },
    { title: 'the ball on a ramp (5 minutes)',
      steps: ['Bend a strip of cardboard into a U.', 'Roll a marble from one side at different heights.', 'Mark how high it gets on the other side.'],
      look: 'It almost reaches the same height. The small difference is energy lost to friction and rolling, the same red thermal bar in the lab.' }
  ]
},
power: {
  goals: {
    bio: ['What work means in physics: a force times the distance moved along it', 'What power is: how fast you do the work, in watts', 'Why sprinting up stairs takes the same work as walking, but more power', 'Why pulling at an angle does less work'],
    honors: ['Why only the part of a force along the motion does work: W = Fd cos θ', 'Why friction does negative work', 'How the net work equals the change in kinetic energy'],
    ap: ['How to find work as the area under a force–position graph', 'How instantaneous power P = F·v changes as the sled speeds up']
  },
  matters: 'Your phone charger, a light bulb, your legs on the stairs and a car engine all have a power rating in watts. Knowing work and power tells you how much energy something really takes and how fast it can deliver it.',
  startKey: 'walk', startRun: false,
  startOverlay(sim,ctx,LH,k){if(sim.p.mode!=='stairs'){BioLab.setValues(sim,{mode:'stairs',m:60,h:3.6,T:8});BioLab.reset(sim);}pwS(ctx,k,[['One floor of stairs: 3.6 m, 20 steps',700],['You: 60 kg. Walk it in 8 s or sprint it in 3 s.']],LH);},
  steps: [
    { key: 'walk', title: 'Work: lifting yourself', set: { mode: 'stairs', m: 60, h: 3.6, T: 8 }, fresh: true, speed: 1,
      see: 'A 60 kg student walks up one floor, 3.6 m, in 8 s. Watch the work add up step by step.',
      why: 'Your legs lift your weight, 588 N, up 3.6 m. Work = mgh = 60 × 9.8 × 3.6 ≈ 2,117 J.',
      overlay(sim,ctx,LH,k){pwS(ctx,k,[['Work = mgh',700],['= 60 × 9.8 × 3.6 ≈ 2,117 J'],['So far: '+n0(emMet(sim,'Wst'))+' J']],LH);} },
    { key: 'walkp', title: 'Power: how fast', set: { mode: 'stairs', m: 60, h: 3.6, T: 8 }, fresh: true, speed: 1,
      see: 'The same walk. This time watch the power reading.',
      why: 'Power = work ÷ time: 2,117 J ÷ 8 s ≈ 265 W. A watt is one joule per second, so that is about two and a half 100 W bulbs.',
      overlay(sim,ctx,LH,k){pwS(ctx,k,[['Power = work ÷ time',700],['= 2,117 J ÷ 8 s ≈ 265 W']],LH);} },
    { key: 'sprint', title: 'Sprint the same stairs', set: { mode: 'stairs', m: 60, h: 3.6, T: 3 }, fresh: true, speed: 1,
      see: 'Now the student sprints up in 3 s.',
      why: 'Same work, 2,117 J, in 3 s instead of 8: 2,117 ÷ 3 ≈ 706 W, almost one horsepower (746 W).',
      overlay(sim,ctx,LH,k){pwS(ctx,k,[['Same work: 2,117 J',700],['Power: 2,117 ÷ 3 ≈ 706 W = '+n2(706/746)+' hp',700,13,RED]],LH);} },
    { key: 'heavy', title: 'A heavier climber', set: { mode: 'stairs', m: 110, h: 3.6, T: 8 }, fresh: true, speed: 1,
      see: 'A 110 kg climber walks the same stairs in the same 8 s.',
      why: 'More weight lifted the same height is more work: about 3,881 J. In the same time, that is more power: about 485 W.',
      overlay(sim,ctx,LH,k){pwS(ctx,k,[['110 kg: W ≈ 3,881 J',700],['P ≈ 3,881 ÷ 8 ≈ 485 W']],LH);} },
    { key: 'pull', title: 'Pull a sled across ice', set: { mode: 'pull', F: 80, th: 0, mu: 0, M: 20 }, fresh: true, speed: 1,
      see: 'A 20 kg sled on ice, pulled with 80 N straight along the ground for 5 m. Watch the work tally on the right.',
      why: 'The pull is along the motion: W = Fd = 80 N × 5 m = 400 J. On ice, all of it becomes kinetic energy.',
      overlay(sim,ctx,LH,k){pwP(ctx,k,[['W = F × d = 80 N × 5 m = 400 J',700],['Work by your pull so far: '+n0(emMet(sim,'WF'))+' J']],LH);} },
    { key: 'angle', title: 'Pull at an angle', set: { mode: 'pull', F: 80, th: 60, mu: 0, M: 20 }, fresh: true, speed: 1,
      see: 'The same 80 N pull, but the rope points 60° up. Watch the green arrow in the top-left box.',
      why: 'Only the part along the ground does work: 80 × cos 60° = 40 N, so 200 J over 5 m. The upward part does no work.',
      overlay(sim,ctx,LH,k){pwP(ctx,k,[['Along the motion: 80 × cos 60° = 40 N',700],['W = 40 N × 5 m = 200 J'],['So far: '+n0(emMet(sim,'WF'))+' J']],LH);} },
    { key: 'up', title: 'Straight up: no work', set: { mode: 'pull', F: 80, th: 90, mu: 0.2, M: 20 }, fresh: true, speed: 1,
      see: 'The rope points straight up, 80 N, not enough to lift the 196 N sled.',
      why: 'The sled doesn’t move in the direction you pull, so the work is zero, however tired your arms get.',
      overlay(sim,ctx,LH,k){pwP(ctx,k,[['Distance moved along the pull: 0 m',700],['Work: '+n0(emMet(sim,'WF'))+' J']],LH);} },
    { key: 'snow', title: 'Friction does negative work', set: { mode: 'pull', F: 100, th: 20, mu: 0.2, M: 20 }, fresh: true, speed: 1,
      see: 'Packed snow (μ = 0.20), pulling 100 N at 20°. Watch the friction line in the tally.',
      why: 'Friction pushes backward as the sled moves forward, so its work is negative: about +470 J from you, −162 J from friction.',
      overlay(sim,ctx,LH,k){pwP(ctx,k,[['Your pull: +'+n0(emMet(sim,'WF'))+' J',700],['Friction: '+n0(emMet(sim,'Wf'))+' J (negative)',700,13,RED]],LH);} },
    { lvl: 'honors', key: 'wke', title: 'Net work = change in KE', set: { mode: 'pull', F: 100, th: 20, mu: 0.2, M: 20 }, fresh: true, speed: 1,
      see: 'The same run. Compare the net work with the sled’s kinetic energy.',
      why: 'Add every force’s work: pull + friction + gravity (0) + normal (0). Net work always equals the change in kinetic energy: the <b>work–energy theorem</b>.',
      overlay(sim,ctx,LH,k){pwP(ctx,k,[['Net work: '+n0(emMet(sim,'Wn'))+' J',700],['Kinetic energy: '+n0(emMet(sim,'KE'))+' J (the same)',700,13,GRN]],LH);} },
    { lvl: 'ap', key: 'area', title: 'Work is the area under F(x)', set: { mode: 'pull', F: 80, th: 0, mu: 0, M: 20, prof: 'fall' }, fresh: true, speed: 1,
      see: 'The pull starts at 160 N and falls steadily to 0 over 5 m. Switch the graph below to Force vs. position.',
      why: 'Work is the area under the force–position graph: ½ × 5 m × 160 N = 400 J, the same as a steady 80 N.',
      overlay(sim,ctx,LH,k){pwP(ctx,k,[['W = area = ½ × 5 × 160 = 400 J',700],['Power now (F·v): '+n0(emMet(sim,'P'))+' W']],LH);} }
  ],
  useIt: [
    { do: 'Compare appliances by watts to compare how fast they use energy, and by watts × hours to compare what they cost to run.',
      why: 'A 1,500 W space heater uses 1.5 kWh every hour. At about 15¢ per kWh that is 22¢ an hour, while a 10 W LED bulb takes 150 hours to use the same energy.' },
    { do: 'When you lift or pull something heavy, push along the direction it needs to move.',
      why: 'Only the part of your force along the motion does useful work. Pulling a wagon with the handle low and nearly level wastes less effort than pulling up steeply, as long as the wheels can roll.' },
    { do: 'Count stairs as exercise.',
      why: 'One floor takes about 2,100 J of work for a 60 kg person, and the body burns 4 to 5 times that in food energy because muscles are only 20 to 25% efficient. Ten floors a day adds up.' }
  ],
  tryIt: [
    { title: 'measure your own horsepower (5 minutes)',
      steps: ['Find a flight of stairs and measure one step’s height. Count the steps.', 'Have a friend time you walking up, then running up (safely, holding the rail).', 'Work = your mass × 9.8 × total height. Power = work ÷ time. Divide by 746 for horsepower.'],
      look: 'Most students land between 300 and 1,000 W running, around 0.5 to 1.3 hp. The work is the same both ways; only the time changes.' }
  ]
},
springs: {
  goals: {
    bio: ['How a spring’s stretch depends on the weight hanging from it (Hooke’s law)', 'What makes a spring bounce faster or slower', 'Why the bounce dies out, and where the energy goes'],
    honors: ['How to use F = kx and find k from a stretch', 'How to predict the period with T = 2π√(m/k)', 'How kinetic, spring and gravitational energy trade places', 'How springs in series and parallel combine'],
    ap: ['How a = −(k/m)x makes simple harmonic motion', 'Why the period doesn’t depend on amplitude or on g']
  },
  matters: 'Car suspensions, mattresses, trampolines, the scale in a grocery store and the crumple zone of a helmet all depend on springs. The same math describes a guitar string, a swaying building and your heart’s rhythm on a monitor.',
  startKey: 'hang', startRun: false,
  startOverlay(sim,ctx,LH,k){spC(ctx,k,[['A spring with k = 30 N/m',700],['The ruler reads its stretch in cm.']],LH);},
  steps: [
    { key: 'hang', title: 'Hang a small mass', set: { mass: 100, k: 30, damp: 0, planet: 'earth' }, fresh: true, speed: 1, run(sim){emAct(sim,'stop');},
      see: 'A 100 g mass hangs at rest. On the ruler, the stretch is the distance from the dashed “unstretched” line: about 3.3 cm.',
      why: 'The spring pulls up as hard as gravity pulls down, 0.98 N. Hooke’s law, F = kx: x = 0.98 ÷ 30 = 0.033 m.',
      overlay(sim,ctx,LH,k){spC(ctx,k,[['F = kx',700],['0.98 N = 30 N/m × x → x ≈ 3.3 cm'],['Stretch now: '+n1(emMet(sim,'stretch'))+' cm']],LH);} },
    { key: 'triple', cause: { from: { mass: 100 } }, title: 'Three times the weight', set: { mass: 300, k: 30, damp: 0, planet: 'earth' }, fresh: true, speed: 1, run(sim){emAct(sim,'stop');},
      see: 'Now 300 g, three times as heavy. The stretch is about 9.8 cm.',
      why: 'Three times the weight, three times the stretch. That proportion is how a spring scale measures weight.',
      overlay(sim,ctx,LH,k){spC(ctx,k,[['3× the weight → 3× the stretch',700],['Stretch: '+n1(emMet(sim,'stretch'))+' cm']],LH);} },
    { key: 'stiff', cause: { from: { k: 30 } }, title: 'A stiffer spring', set: { mass: 300, k: 60, damp: 0, planet: 'earth' }, fresh: true, speed: 1, run(sim){emAct(sim,'stop');},
      see: 'Same 300 g, but the spring is twice as stiff: k = 60 N/m. The stretch is about 4.9 cm.',
      why: 'k is the force per meter of stretch. Double k, and the same weight stretches it half as far.',
      overlay(sim,ctx,LH,k){spC(ctx,k,[['k = 60 N/m: half the stretch',700],['Stretch: '+n1(emMet(sim,'stretch'))+' cm']],LH);} },
    { key: 'hooke', title: 'Hooke’s law on a graph', speed: 0.5,
      see: 'Your stretches as force against stretch: 3.3 and 9.8 cm on the 30 N/m spring, 4.9 cm on the stiffer one. Each makes a straight line.',
      why: 'F = kx, so each line’s slope is k. The stiffer spring’s line is twice as steep.',
      overlay(sim,ctx,LH,k,tau){const K=BioLab.lg,p=tau%12,B={x0:110,x1:620,y0:70,y1:370},xr=[0,12],ys=F=>F/4;
        K.dim(ctx,LH);K.axes(ctx,B,k,{xr,xt:[[0,'0'],[3,'3'],[6,'6'],[9,'9'],[12,'12']],yt:[[0,'0'],[ys(2),'2'],[ys(4),'4']],xl:'Stretch (cm)',yl:'Force on the spring (N)'});
        const f1=Math.min(1,p/3),f2=Math.min(1,Math.max(0,(p-3)/3));
        K.curve(ctx,B,xr,x=>ys(30*x/100),12*f1,'#1f6feb');[[3.27,'100 g'],[9.8,'300 g']].forEach(([x,l])=>{if(12*f1<x)return;const X=K.X(B,xr,x),Y=K.Y(B,ys(30*x/100));K.dot(ctx,X,Y,'#1f6feb',7);K.tagA(ctx,l,X+12,Y+18,k,{s:12.5},'l');});
        if(f1>=1)K.tagA(ctx,'k = 30 N/m',B.x1,K.Y(B,ys(3.6))+20,k,{s:13,c:'#1f6feb'},'r');
        if(f2>0){K.curve(ctx,B,xr,x=>ys(60*x/100),Math.min(6.6,12*f2),'#1b7a43');if(12*f2>=4.9){const X=K.X(B,xr,4.9),Y=K.Y(B,ys(2.94));K.dot(ctx,X,Y,'#1b7a43',7);K.tagA(ctx,'300 g, stiffer',X+14,Y+22,k,{s:12.5},'l');}}
        if(f2>=1)K.tagA(ctx,'k = 60 N/m: steeper',K.X(B,xr,5.4),K.Y(B,ys(3.6)),k,{s:13,c:'#1b7a43'},'r');
        if(p>7)K.tagA(ctx,'Slope = k',790,40,k,{hi:true},'r');} },
    { key: 'bounce', title: 'Pull down and let go', set: { mass: 300, k: 30, damp: 0, planet: 'earth' }, fresh: true, speed: 1, run(sim){emAct(sim,'release');},
      see: 'The 300 g mass is pulled down 8 cm and let go. The red pen traces its motion: a full bounce every 0.63 s.',
      why: 'Below the rest point the spring pulls harder than gravity, so the mass speeds back up, overshoots, and turns around again.',
      overlay(sim,ctx,LH,k){spC(ctx,k,[['One full bounce (period):',700],[n2(emMet(sim,'period'))+' s']],LH);} },
    { key: 'heavier', title: 'More mass, slower bounce', set: { mass: 400, k: 30, damp: 0, planet: 'earth' }, fresh: true, speed: 1, run(sim){emAct(sim,'release');},
      see: '400 g on the same spring. Each bounce now takes about 0.73 s instead of 0.63 s.',
      why: 'More mass is harder to speed up and slow down, like a loaded truck rocking slowly on its springs.',
      overlay(sim,ctx,LH,k){spC(ctx,k,[['400 g: period '+n2(emMet(sim,'period'))+' s',700],['300 g was 0.63 s']],LH);} },
    { key: 'stiffer', title: 'Stiffer spring, faster bounce', set: { mass: 300, k: 120, damp: 0, planet: 'earth' }, fresh: true, speed: 1, run(sim){emAct(sim,'release');},
      see: '300 g on a spring four times as stiff, k = 120 N/m. A bounce takes about 0.31 s.',
      why: 'A stiffer spring pulls back harder, so it turns the mass around faster. Four times the stiffness halves the period.',
      overlay(sim,ctx,LH,k){spC(ctx,k,[['k = 120 N/m: period '+n2(emMet(sim,'period'))+' s',700],['Half of 0.63 s']],LH);} },
    { key: 'moon', title: 'The same spring on the Moon', set: { mass: 300, k: 30, damp: 0, planet: 'moon' }, fresh: true, speed: 1, run(sim){emAct(sim,'release');},
      see: 'The same 300 g and spring, on the Moon. It stretches only about 1.6 cm, but each bounce still takes 0.63 s.',
      why: 'The bounce time depends only on the mass and the spring, not on gravity. That is why springs weigh things in space.',
      overlay(sim,ctx,LH,k){spC(ctx,k,[['Moon: rest stretch '+n1(emMet(sim,'eq')!=null?emMet(sim,'eq'):1.6)+' cm',700],['Period: '+n2(emMet(sim,'period'))+' s, the same as on Earth',600,13,GRN]],LH);} },
    { key: 'damp', title: 'Why the bounce dies out', set: { mass: 300, k: 30, damp: 0.3, planet: 'earth' }, fresh: true, speed: 1, run(sim){emAct(sim,'release');},
      see: 'Now with damping, like air and friction in the spring. Each bounce gets smaller until the mass rests.',
      why: 'Damping turns some motion energy into thermal energy every bounce. A car’s shock absorbers do this on purpose.',
      overlay(sim,ctx,LH,k){spC(ctx,k,[['Each bounce smaller',700],['Energy → heat, like a shock absorber']],LH);} },
    { lvl: 'honors', key: 'energy', title: 'Three energies trade places', set: { mass: 300, k: 30, damp: 0, planet: 'earth', amp: 8 }, fresh: true, speed: 0.3, run(sim){emAct(sim,'release');},
      see: 'Slow motion. Watch the green (kinetic), purple (spring) and blue (gravity) bars trade places.',
      why: 'Most spring energy at the bottom, most speed through the middle, most height at the top. The gold total never changes.',
      overlay(sim,ctx,LH,k){spC(ctx,k,[['KE '+n2(emMet(sim,'ke'))+' + spring '+n2(emMet(sim,'ue'))+' + gravity '+n2(emMet(sim,'ug')),700],['= '+n2(emMet(sim,'tot'))+' J, constant',600,13,GRN]],LH);} },
    { lvl: 'honors', key: 'period', title: 'T = 2π√(m/k)', set: { mass: 300, k: 30, damp: 0, planet: 'earth', config: 'single' }, fresh: true, speed: 1, run(sim){emAct(sim,'release');},
      see: 'Back to 300 g on 30 N/m. Compare the measured period with the formula.',
      why: 'T = 2π√(m/k) = 2π√(0.3 ÷ 30) ≈ 0.63 s. You need 4 times the mass to double the period.',
      overlay(sim,ctx,LH,k){spC(ctx,k,[['T = 2π√(0.3 ÷ 30) ≈ 0.63 s',700],['Measured: '+n2(emMet(sim,'period'))+' s']],LH);} },
    { lvl: 'honors', key: 'series', title: 'Two springs in a row', set: { mass: 300, k: 30, damp: 0, planet: 'earth', config: 'series' }, fresh: true, speed: 1, run(sim){emAct(sim,'release');},
      see: 'Two 30 N/m springs hung end to end (series). The stretch doubles.',
      why: 'Each spring carries the full weight, so together they stretch twice as far: k = 15 N/m. Side by side (parallel), k = 60 N/m.',
      overlay(sim,ctx,LH,k){spC(ctx,k,[['Series: k = 15 N/m',700],['Period: '+n2(emMet(sim,'period'))+' s (√2 × 0.63)']],LH);} },
    { lvl: 'ap', key: 'shm', title: 'Simple harmonic motion', set: { mass: 300, k: 30, damp: 0, planet: 'earth', config: 'single', amp: 3 }, fresh: true, speed: 1, run(sim){emAct(sim,'release');},
      see: 'A smaller 3 cm pull. Switch the graph below to x, v and a vs. time.',
      why: 'a = −(k/m)x: always toward the middle, proportional to the distance. That gives sine-shaped motion with the same 0.63 s period at any size.',
      overlay(sim,ctx,LH,k){spC(ctx,k,[['a = −(k/m)x',700],['3 cm pull: period '+n2(emMet(sim,'period'))+' s']],LH);} }
  ],
  useIt: [
    { do: 'If a car keeps bouncing after a bump, get the shock absorbers checked.',
      why: 'The springs hold the car up; the shocks are the damping that stops the bounce. Worn shocks let the car keep oscillating, so the tires lose grip on the road between bounces.' },
    { do: 'Don’t overload a trampoline, bike rack or hanging shelf past its rating.',
      why: 'Hooke’s law only holds up to a limit. Past it, a spring stretches permanently and never comes back to its shape.' }
  ],
  tryIt: [
    { title: 'the rubber-band scale (10 minutes)',
      steps: ['Hang a rubber band from a hook and tape a ruler beside it.', 'Hang a bag and add coins (or batteries) one at a time, reading the stretch each time.', 'Graph stretch against the number of coins.'],
      look: 'At first the points fall on a straight line: Hooke’s law. With a lot of weight the line bends, because rubber bands are not perfect springs.' }
  ]
},
collisions: {
  goals: {
    bio: ['What momentum is: mass × velocity', 'Why the total momentum is the same before and after any collision', 'What happens when a heavy cart hits a light one, and the other way around', 'Why a sticky collision loses kinetic energy'],
    honors: ['How to use conservation of momentum to find a speed after a collision', 'How to tell elastic from inelastic collisions using kinetic energy', 'Why an explosion from rest ends with zero total momentum'],
    ap: ['How momentum is conserved in two dimensions, one component at a time', 'Why equal-mass elastic collisions at an angle leave at 90°']
  },
  matters: 'Car crashes, a pool break, football tackles, a rifle’s recoil and a rocket launch are all momentum problems. Crash investigators use it to work out how fast cars were going from where they ended up.',
  startKey: 'equal', startRun: false,
  startOverlay(sim,ctx,LH,k){coC(ctx,k,[['Two 1 kg carts on a track',700],['A moves right at 0.8 m/s; B is at rest.']],LH);},
  steps: [
    { key: 'equal', title: 'Equal carts, bouncy collision', set: { mode: 'track', type: 'elastic', mA: 1, mB: 1, vA: 0.8, vB: 0, tape: true }, fresh: true, speed: 0.6,
      see: 'Cart A (red, 1 kg) rolls at 0.8 m/s into cart B (blue, 1 kg) at rest. Springy bumpers make it bouncy.',
      why: 'A stops dead and B leaves at 0.8 m/s. <b>Momentum</b>, p = mv, passes on: 0.8 kg·m/s before and after.',
      overlay(sim,ctx,LH,k){coLoop(sim);coC(ctx,k,[['Total momentum: '+n2(emMet(sim,'ptot'))+' kg·m/s',700],['before and after']],LH);} },
    { key: 'heavy', title: 'Heavy cart hits a light one', set: { mode: 'track', type: 'elastic', mA: 2, mB: 1, vA: 0.8, vB: 0, tape: true }, fresh: true, speed: 0.6,
      see: 'Now A is 2 kg and B is 1 kg. A keeps going slowly (0.27 m/s); B shoots off at 1.07 m/s.',
      why: 'Total momentum before: 2 × 0.8 = 1.6. After: 2 × 0.27 + 1 × 1.07 = 1.6. The same.',
      overlay(sim,ctx,LH,k){coLoop(sim);coC(ctx,k,[['A: '+n2(emMet(sim,'vA'))+' m/s   B: '+n2(emMet(sim,'vB'))+' m/s',700],['Total momentum: '+n2(emMet(sim,'ptot'))+' kg·m/s']],LH);} },
    { key: 'pbars', title: 'Momentum before and after', speed: 0.5,
      see: 'Momentum bars for that crash. Before: all 1.6 kg·m/s is cart A’s. After: A has 0.53 and B has 1.07. The total bar doesn’t change.',
      why: 'With no outside push, total momentum is <b>conserved</b>. It just moves from one cart to the other.',
      overlay(sim,ctx,LH,k,tau){const K=BioLab.lg,H=BioLab.h,P=H.PAL,kk=Math.min(k,1.25),p=tau%12,m1=2,m2=1,v=0.8,a1=(m1-m2)/(m1+m2)*v,b1=2*m1/(m1+m2)*v,B={x0:110,x1:760,y0:90,y1:350},top=2;
        K.dim(ctx,LH);ctx.save();ctx.strokeStyle=P['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(B.x0,B.y0-10);ctx.lineTo(B.x0,B.y1);ctx.lineTo(B.x1,B.y1);ctx.stroke();ctx.restore();
        [[0,'0'],[1,'1.0'],[2,'2.0']].forEach(([v,l])=>{const y=B.y1-v/top*(B.y1-B.y0);H.txt(ctx,l,B.x0-9,y,{s:12*kk,a:'right',b:'middle',c:P['cv-soft']});});
        ctx.save();ctx.translate(B.x0-50*kk,(B.y0+B.y1)/2);ctx.rotate(-Math.PI/2);H.txt(ctx,'Momentum (kg·m/s)',0,0,{s:13*kk,w:700,a:'center',b:'middle'});ctx.restore();
        const grp=[['Before',[['A',m1*v,'#c8102e'],['B',0,'#1f6feb'],['Total',m1*v,'#5d5d63']],0],['After',[['A',m1*a1,'#c8102e'],['B',m2*b1,'#1f6feb'],['Total',m1*a1+m2*b1,'#5d5d63']],3]];
        grp.forEach(([name,bars,t0],gi)=>{const gx=B.x0+30+gi*330,f=K.ease(Math.min(1,Math.max(0,(p-t0)/1.5)));H.txt(ctx,name,gx+130,B.y1+42*kk,{s:15*kk,w:700,a:'center',b:'middle'});
          bars.forEach(([l,val,c],i)=>{const x=gx+i*95,h=(B.y1-B.y0)*val/top*f;ctx.fillStyle=c;H.rr(ctx,x,B.y1-h,70,Math.max(h,1),4);ctx.fill();H.txt(ctx,l,x+35,B.y1+16*kk,{s:12.5*kk,a:'center',b:'middle'});if(f>=1)H.txt(ctx,val.toFixed(2),x+35,B.y1-h-12,{s:13*kk,w:700,a:'center',b:'middle'});});});
        if(p>5)K.tagA(ctx,'Total: 1.60 before = 1.60 after',790,40,k,{hi:true},'r');} },
    { key: 'light', title: 'Light cart hits a heavy one', set: { mode: 'track', type: 'elastic', mA: 1, mB: 2, vA: 0.8, vB: 0, tape: true }, fresh: true, speed: 0.6,
      see: 'Swap them: A is 1 kg, B is 2 kg. A bounces back at −0.27 m/s; B moves off at 0.53 m/s.',
      why: 'Momentum is a vector, so backward counts as negative: 1 × (−0.27) + 2 × 0.53 = 0.8, the same as before.',
      overlay(sim,ctx,LH,k){coLoop(sim);coC(ctx,k,[['A: '+n2(emMet(sim,'vA'))+' (back)   B: '+n2(emMet(sim,'vB'))+' m/s',700],['Total momentum: '+n2(emMet(sim,'ptot'))+' kg·m/s']],LH);} },
    { key: 'sticky', title: 'A sticky collision', set: { mode: 'track', type: 'sticky', mA: 1, mB: 1, vA: 0.8, vB: 0, tape: true }, fresh: true, speed: 0.6,
      see: 'Velcro bumpers: the carts stick and roll on together at 0.4 m/s. Watch the momentum and energy panels.',
      why: 'Twice the mass carries the same 0.8 kg·m/s at half the speed. Momentum is conserved, but half the kinetic energy becomes heat and sound.',
      overlay(sim,ctx,LH,k){coLoop(sim);coC(ctx,k,[['Together: '+n2(emMet(sim,'vA'))+' m/s',700],['Momentum kept; KE '+(sim.st.hit?'halved':'…'),600,13,RED]],LH);} },
    { key: 'explode', title: 'Push apart from rest', set: { mode: 'track', type: 'explode', mA: 1, mB: 1, spring: 0.4, tape: true }, fresh: true, speed: 0.6,
      see: 'The carts start at rest with a squeezed spring between them. Released, they fly apart at 0.63 m/s each.',
      why: 'Momentum before is zero, so after it is too: +0.63 and −0.63 add to zero. The spring’s energy becomes kinetic energy.',
      overlay(sim,ctx,LH,k){coLoop(sim);coC(ctx,k,[['A: '+n2(emMet(sim,'vA'))+'   B: '+n2(emMet(sim,'vB'))+' m/s',700],['Total momentum: '+n2(emMet(sim,'ptot'))+' kg·m/s']],LH);} },
    { key: 'recoil', title: 'Recoil', set: { mode: 'track', type: 'explode', mA: 1, mB: 2, spring: 0.4, tape: true }, fresh: true, speed: 0.6,
      see: 'Same spring, but B is 2 kg. The light cart goes 0.73 m/s left; the heavy one 0.37 m/s right.',
      why: 'The total is still zero, so the light cart moves twice as fast. That is <b>recoil</b>, like a rifle’s kick.',
      overlay(sim,ctx,LH,k){coLoop(sim);coC(ctx,k,[['1 kg: '+n2(emMet(sim,'vA'))+'   2 kg: '+n2(emMet(sim,'vB'))+' m/s',700],['1 × '+n2(emMet(sim,'vA'))+' + 2 × '+n2(emMet(sim,'vB'))+' = 0']],LH);} },
    { lvl: 'honors', key: 'partial', title: 'Partly bouncy', set: { mode: 'track', type: 'partial', e: 0.5, mA: 1, mB: 1, vA: 0.8, vB: 0, tape: true }, fresh: true, speed: 0.6,
      see: 'Bounciness e = 0.5: the carts separate at half the speed they approached. A keeps 0.2 m/s; B gets 0.6 m/s.',
      why: 'Momentum is still 0.8 in total, but kinetic energy drops from 0.32 J to 0.20 J. Real collisions fall between bouncy and sticky.',
      overlay(sim,ctx,LH,k){coLoop(sim);coC(ctx,k,[['A: '+n2(emMet(sim,'vA'))+'   B: '+n2(emMet(sim,'vB'))+' m/s',700],['Kinetic energy lost: '+(isFinite(emMet(sim,'kelost'))?n0(emMet(sim,'kelost'))+'%':'…')]],LH);} },
    { lvl: 'honors', key: 'headon', title: 'Head-on and stuck', set: { mode: 'track', type: 'sticky', mA: 1, mB: 1, vA: 0.8, vB: -0.8, tape: true }, fresh: true, speed: 0.6,
      see: 'Two equal carts drive at each other at 0.8 m/s and stick. They stop dead.',
      why: 'Total momentum: 0.8 + (−0.8) = 0, so they must end at rest. All 0.64 J becomes heat, sound and bent metal: the worst car crash.',
      overlay(sim,ctx,LH,k){coLoop(sim);coC(ctx,k,[['Total momentum: '+n2(emMet(sim,'ptot'))+' kg·m/s',700],['Both stop: 100% of KE lost',600,13,RED]],LH);} },
    { lvl: 'ap', key: 'table', title: 'Two dimensions', set: { mode: 'table', type: 'elastic', mA: 1, mB: 1, vA: 0.8, vB: 0, b: 0.08, tape: true }, fresh: true, speed: 0.6,
      see: 'An air table seen from above. Puck A hits B off-center, and they leave on opposite sides of A’s path.',
      why: 'Momentum is conserved in x and in y separately. For equal masses in an elastic collision, they leave 90° apart.',
      overlay(sim,ctx,LH,k){coLoop(sim);ciCard(ctx,k,[['p_x: '+n2(emMet(sim,'px'))+'   p_y: '+n2(emMet(sim,'py'))+' kg·m/s',700],['Angle between paths: '+(isFinite(emMet(sim,'angle'))?n0(emMet(sim,'angle'))+'°':'…')]],246,0,240,LH);} }
  ],
  useIt: [
    { do: 'In a car, keep a bigger following distance behind heavy trucks, and expect a small car to lose any collision with a large one.',
      why: 'Momentum is shared in a crash. A 1,500 kg car hit by a 15,000 kg truck has its velocity changed about ten times more than the truck’s, so the people inside feel far bigger forces.' },
    { do: 'Throwing or kicking something heavy while standing on a skateboard, ice or a boat, brace for recoil.',
      why: 'Whatever momentum you give the object, you get the same amount in the opposite direction. On a low-friction surface, that pushes you backward.' }
  ],
  tryIt: [
    { title: 'the coin line (3 minutes)',
      steps: ['Line up five identical coins, touching, on a smooth table.', 'Slide a sixth coin straight into one end.', 'Then slide two coins together into the line.'],
      look: 'One coin in, one coin out the far end. Two in, two out. Momentum and kinetic energy can only both be kept if the same mass leaves at the same speed.' }
  ]
},
impulse: {
  goals: {
    bio: ['Why stopping a moving object takes the same impulse however you do it', 'Why a longer stop means a smaller force', 'How seat belts, airbags and crumple zones save lives using that idea'],
    honors: ['How to use impulse J = FΔt = Δp to find an average force', 'Why a bounce takes more impulse than a stick'],
    ap: ['How to find impulse as the area under a force–time graph', 'How stopping distance and stopping time are connected']
  },
  matters: 'Every helmet, airbag, crumple zone, gym mat and bent knee on a landing works the same way: stretch the stop out in time so the force drops. It is the physics behind most of the safety equipment you use.',
  startKey: 'concrete', startRun: false,
  startOverlay(sim,ctx,LH,k){imC(ctx,k,[['A 60 g egg, dropped from 1 m',700],['Its shell cracks above about 30 N.']],LH);},
  steps: [
    { key: 'concrete', title: 'Egg on concrete', set: { obj: 'egg', surface: 'concrete', h: 1 }, fresh: true, speed: 1,
      see: 'An egg falls 1 m onto concrete. The graph shows the force on it during impact, slowed down 40 times.',
      why: 'It must lose 0.27 kg·m/s of momentum, and concrete stops it in 2 ms: a peak of about 209 N, seven times what the shell takes.',
      overlay(sim,ctx,LH,k){imLoop(sim);imC(ctx,k,[['Stopped in '+n0(emMet(sim,'tau'))+' ms',700],['Peak force: '+n0(emMet(sim,'fpk'))+' N (shell cracks above 30 N)',700,13,RED]],LH);} },
    { key: 'foam', title: 'Egg on a foam pad', set: { obj: 'egg', surface: 'foam', h: 1 }, fresh: true, speed: 1,
      see: 'Same egg, same 1 m, onto foam. The dashed curve is the concrete run.',
      why: 'Same momentum to lose, but foam stretches the stop to 30 ms, so the force is 15 times smaller: about 14 N. It survives.',
      overlay(sim,ctx,LH,k){imLoop(sim);imC(ctx,k,[['Stopped in '+n0(emMet(sim,'tau'))+' ms',700],['Peak force: '+n1(emMet(sim,'fpk'))+' N: survives',700,13,GRN]],LH);} },
    { key: 'same', title: 'Same impulse, different shape', set: { obj: 'egg', surface: 'carpet', h: 1 }, fresh: true, speed: 1,
      see: 'Now carpet, which stops the egg in 8 ms. Compare the shaded areas under the curves.',
      why: 'The area under a force–time graph is the <b>impulse</b> = change in momentum: always 0.27 N·s. Only the peak changes: here 52 N, enough to crack it.',
      overlay(sim,ctx,LH,k){imLoop(sim);imC(ctx,k,[['Carpet: '+n0(emMet(sim,'tau'))+' ms → '+n0(emMet(sim,'fpk'))+' N',700],['Area (impulse): 0.27 N·s, every surface']],LH);} },
    { key: 'higher', title: 'A higher drop', set: { obj: 'egg', surface: 'foam', h: 3 }, fresh: true, speed: 1,
      see: 'Foam again, but from 3 m.',
      why: 'It arrives at 7.7 m/s with more momentum, about 0.46 kg·m/s. Over the same 30 ms, the peak rises to about 24 N: under 30 N, barely.',
      overlay(sim,ctx,LH,k){imLoop(sim);imC(ctx,k,[['From 3 m: '+n1(emMet(sim,'vimp'))+' m/s at impact',700],['Peak force: '+n1(emMet(sim,'fpk'))+' N']],LH);} },
    { key: 'car', title: 'A crash with a seat belt', set: { obj: 'car', kmh: 50, rest: 'belt', front: 'rigid' }, fresh: true, speed: 1,
      see: 'A car hits a wall at 50 km/h (31 mph). The 75 kg dummy is belted; the front is rigid.',
      why: 'The dummy must lose about 1,040 kg·m/s. The belt stretches the stop to 0.1 s: a peak of about 16 kN (22 g). Injuries are likely.',
      overlay(sim,ctx,LH,k){imLoop(sim);imCar(ctx,k,[['Seat belt, rigid front',700],['Stop: '+n0(emMet(sim,'tau'))+' ms → '+n1(emMet(sim,'fpkK'))+' kN, '+n0(emMet(sim,'gpk'))+' g']],LH);} },
    { key: 'crumple', title: 'Add a crumple zone', set: { obj: 'car', kmh: 50, rest: 'belt', front: 'crumple' }, fresh: true, speed: 1,
      see: 'Same crash, but the front of the car crushes.',
      why: 'The crumple zone stretches the dummy’s stop to about 0.18 s: almost twice the time, about half the force, 9 kN (12 g). Likely to walk away.',
      overlay(sim,ctx,LH,k){imLoop(sim);imCar(ctx,k,[['Seat belt and crumple zone',700],['Stop: '+n0(emMet(sim,'tau'))+' ms → '+n1(emMet(sim,'fpkK'))+' kN, '+n0(emMet(sim,'gpk'))+' g',700,13,GRN]],LH);} },
    { key: 'nobelt', title: 'No seat belt', set: { obj: 'car', kmh: 50, rest: 'none', front: 'crumple' }, fresh: true, speed: 1,
      see: 'Same crumple zone, but the dummy isn’t belted.',
      why: 'It keeps going at 50 km/h until the dashboard stops it in about 8 ms: a peak of about 200 kN. A crumple zone can’t help someone not attached to the car.',
      overlay(sim,ctx,LH,k){imLoop(sim);imCar(ctx,k,[['No belt: stopped by the dashboard',700,13,RED],['Stop: '+n0(emMet(sim,'tau'))+' ms → '+n0(emMet(sim,'fpkK'))+' kN, '+n0(emMet(sim,'gpk'))+' g',700,13,RED]],LH);} },
    { lvl: 'honors', key: 'favg', title: 'J = F·Δt = Δp', set: { obj: 'egg', surface: 'foam', h: 1 }, fresh: true, speed: 1,
      see: 'The egg on foam again. Compare the impulse with its momentum before impact.',
      why: 'J = average force × time = Δp = 0.266 N·s. Over 30 ms the average force is about 8.9 N; the peak is π/2 times that.',
      overlay(sim,ctx,LH,k){imLoop(sim);imC(ctx,k,[['Δp = '+n2(emMet(sim,'p0'))+' kg·m/s = J',700],['F_avg = J ÷ Δt = '+n1(emMet(sim,'favg'))+' N']],LH);} },
    { lvl: 'honors', key: 'bounce', title: 'Bouncing takes more impulse', set: { obj: 'ball', ball: 'rubber', surface: 'carpet', h: 1 }, fresh: true, speed: 1,
      see: 'A 150 g rubber ball dropped 1 m onto carpet bounces back up. Compare a clay ball that sticks.',
      why: 'To bounce, the floor must stop it and send it back at 80% speed: Δp = 1.8 mv, so 1.8 times the push.',
      overlay(sim,ctx,LH,k){imLoop(sim);imC(ctx,k,[['Rubber: J = '+n2(emMet(sim,'J'))+' N·s',700],['Clay (sticks) would be 0.66 N·s']],LH);} },
    { lvl: 'ap', key: 'area', title: 'Impulse is the area under F(t)', set: { obj: 'egg', surface: 'carpet', h: 1 }, fresh: true, speed: 1,
      see: 'Read the area from 10 thin strips under the force curve.',
      why: 'J = ∫F dt. Ten rectangles under the half-sine pulse already give 0.267 N·s, within a fraction of a percent of mv = 0.266 N·s. For a stick, stopping distance d = average speed × time = (v/2) × Δt.',
      overlay(sim,ctx,LH,k){imLoop(sim);imC(ctx,k,[['10 strips: '+(emMet(sim,'area')!=null?emMet(sim,'area').toFixed(3):'…')+' N·s',700],['Stopping distance: '+n1(emMet(sim,'dist'))+' cm']],LH);} }
  ],
  useIt: [
    { do: 'Wear your seat belt on every trip, including short ones in town.',
      why: 'The crumple zone and airbag only help if you are attached to the car. Unbelted, you keep moving and stop against the dashboard in milliseconds. NHTSA estimates seat belts saved about 15,000 lives in the U.S. in 2017.' },
    { do: 'Land jumps with bent knees and roll when you fall.',
      why: 'Bending your knees stretches your stop over more time and distance, so the force on your joints drops. Landing stiff-legged stops you in a few milliseconds.' },
    { do: 'Replace a bike or ski helmet after any hard crash, even if it looks fine.',
      why: 'The foam works by crushing, which stretches out the stop. Once crushed, it can’t do that again (the Consumer Product Safety Commission and helmet makers say to replace it).' }
  ],
  tryIt: [
    { title: 'the water-balloon catch (outside, 5 minutes)',
      steps: ['Toss a water balloon to a partner.', 'First catch it with stiff arms. Then catch one by moving your hands back with it as it arrives.'],
      look: 'Moving with it stretches the stop over more time, so the force on the balloon drops and it survives. Stiff hands stop it fast and it bursts.' }
  ]
}
});

/* ===== Torque and rotation ===== */
const tqTR=(ctx,k,L)=>ciCard(ctx,k,L,548,8,244);
const tqBL=(ctx,k,L,LH)=>ciCard(ctx,k,L,60,342,400,LH);
const tqLad=(ctx,k,L,LH)=>ciCard(ctx,k,L,14,120,230,LH);
const roBL=(ctx,k,L,LH)=>ciCard(ctx,k,L,262,8,212,LH);
const roTR=(ctx,k,L)=>ciCard(ctx,k,L,496,6,296);
const TQ_R='#c8102e',TQ_G='#1b7a3e',TQ_B='#1b6fb3';
const roRace=sim=>{emAct(sim,'race');};
const roTop=0;
/* cause and effect: slide a setting from a to b while the overlay watches (t0 and dur in seconds since the step began) */
function tqTw(sim,tau,spec,t0,dur){const f=ease(clamp((tau-t0)/dur,0,1)),o={};for(const id in spec){const [a,b]=spec[id],v=Math.round((a+(b-a)*f)*1000)/1000;if(Math.abs(sim.p[id]-v)>1e-6)o[id]=v;}if(Object.keys(o).length)BioLab.setValues(sim,o);return f;}
function tqRing(ctx,x,y,r,tau,col){const a=0.5+0.5*Math.sin(tau*6);ctx.save();ctx.strokeStyle=col||'#c8102e';ctx.lineWidth=3;ctx.globalAlpha=0.45+0.55*a;ctx.beginPath();ctx.arc(x,y,r+3*a,0,6.29);ctx.stroke();ctx.restore();}
const tqMassXY=(sim,d,side)=>{const ph=sim.st.phi||0,dx=side*160*d,dy=-36;return [400+dx*Math.cos(ph)-dy*Math.sin(ph),320+dx*Math.sin(ph)+dy*Math.cos(ph)];};
const tqPush=sim=>[190+900*sim.p.r,250];


BioLab.addLearn({
torque: {
  goals: {
    bio: ['What torque is: how strongly a force turns something', 'Why distance from the pivot matters as much as the force', 'How a heavy and a light mass can balance on a seesaw', 'Why the direction of a push matters'],
    honors: ['Torque τ = rF sinθ and the lever arm', 'Rotational equilibrium: the torques cancel, Στ = 0', 'Balancing unequal masses on a seesaw', 'Why a push along a handle or at the pivot does nothing'],
    ap: ['τ = rF sinθ = r⊥F', 'Static equilibrium: ΣF = 0 and Στ = 0', 'Choosing a pivot to remove unknown forces', 'The ladder: friction needed vs. friction available']
  },
  matters: 'Door handles, wrenches, bike pedals, seesaws and your own elbow all run on torque. It explains how to loosen a stuck bolt, why you carry heavy things close to your body, and how steep a ladder has to be.',
  startKey: 'balance', startRun: false,
  startOverlay(sim,ctx,LH,k){tag(ctx,'Pivot: the plank turns around this point',400,412,k,{s:12,hi:true});tag(ctx,'Each mass tries to turn the plank',665,40,k,{s:12,hi:true});},
  steps: [
    { key: 'balance', title: 'Equal turns cancel', fresh: true, speed: 1,
      see: 'Two 30 kg masses, each 1.5 m from the pivot. The plank stays level.',
      why: 'Each mass tries to turn the plank. That turning effect, <b>torque</b>, is weight × distance. Equal torques cancel.',
      overlay(sim,ctx,LH,k){tqTR(ctx,k,[['Torque = weight × distance',700],'Left: 294 N × 1.5 m = 441 N·m','Right: 294 N × 1.5 m = 441 N·m',['Equal → balanced',700,13,TQ_G]]);} },
    { key: 'far', title: 'Distance matters', fresh: true, speed: 1,
      see: 'The circled mass slides from 1.5 m to 2.0 m. Same weight, but the right side drops.',
      why: 'Farther out turns harder: 294 N × 2.0 m = 588 N·m beats 441 N·m.',
      so: 'That is why you push a door at the handle.',
      overlay(sim,ctx,LH,k,tau){const f=tqTw(sim,tau,{dR:[1.5,2]},0.8,2.4),d=sim.p.dR,tR=294*d;if(Math.abs(sim.st.phi||0)>0.02){ctx.save();ctx.strokeStyle=PAL['cv-ink'];ctx.globalAlpha=0.55;ctx.setLineDash([7,5]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(80,320);ctx.lineTo(720,320);ctx.stroke();ctx.restore();H.txt(ctx,'level before',90,312,{s:11*Math.min(k,1.3),w:700,c:PAL['cv-ink']});}if(f<1){const [x,y]=tqMassXY(sim,d,1);tqRing(ctx,x,y,40,tau);}
        tqTR(ctx,k,[[f<1?'Sliding the right mass out…':'Same mass, farther out',700],'Left: 294 N × 1.5 m = 441 N·m',['Right: 294 N × '+d.toFixed(2)+' m = '+Math.round(tR)+' N·m',700,13,f>0&&f<1?TQ_B:PAL['cv-ink']],[tR>441.5?'Bigger torque → right side drops':'Equal → balanced',700,13,tR>441.5?TQ_R:TQ_G]]);} },
    { key: 'heavy', title: 'Heavier and closer balances lighter and farther', set: { mL: 30, dL: 2, mR: 60, dR: 1 }, fresh: true, speed: 1,
      see: { bio: 'A 30 kg kid 2 m out balances a 60 kg adult 1 m from the pivot.', honors: 'A 30 kg mass at 2 m balances a 60 kg mass at 1 m: Στ = 0.' },
      why: 'Twice the weight at half the distance: 588 N·m each side. That is how a parent and a child share a seesaw.',
      overlay(sim,ctx,LH,k){tqTR(ctx,k,[['Unequal masses, still level',700],'Left: 294 N × 2.0 m = 588 N·m','Right: 588 N × 1.0 m = 588 N·m',['Equal → balanced',700,13,TQ_G]]);} },
    { key: 'wrench', title: 'A stuck bolt', set: { mode: 'wrench', F: 100, r: 0.3, ang: 90 }, fresh: true, speed: 1,
      see: 'A rusted bolt needs 40 N·m. You push 100 N straight across the handle, 30 cm out. It doesn’t budge.',
      why: 'Torque = 0.30 m × 100 N = 30 N·m, less than the 40 N·m needed.',
      overlay(sim,ctx,LH,k){tqBL(ctx,k,[['Torque = distance × force',700],'0.30 m × 100 N = 30 N·m',['Needs 40 N·m → stuck',700,13,TQ_R]],LH);} },
    { key: 'longer', title: 'Push farther out', set: { mode: 'wrench', F: 100, r: 0.3, ang: 90 }, fresh: true, speed: 1,
      see: 'Your hand slides out to 35 cm as the push grows to 120 N. The torque bar passes the 40 N·m line, and the bolt turns.',
      why: '0.35 × 120 = 42 N·m. A longer wrench, or a pipe over the handle, does the same.',
      overlay(sim,ctx,LH,k,tau){const f=tqTw(sim,tau,{r:[0.3,0.35],F:[100,120]},0.8,2.6),tq=sim.p.r*sim.p.F;if(f<1){const [x,y]=tqPush(sim);tqRing(ctx,x,y,18,tau);}
        tqBL(ctx,k,[[f<1?'Moving out and pushing harder…':'Farther out',700],sim.p.r.toFixed(3)+' m × '+Math.round(sim.p.F)+' N = '+tq.toFixed(1)+' N·m',[tq>=40?'At least 40 N·m → it turns':'Less than 40 N·m → still stuck',700,13,tq>=40?TQ_G:TQ_R]],LH);} },
    { key: 'angle', title: 'Push at a slant', set: { mode: 'wrench', F: 100, r: 0.3, ang: 90 }, fresh: true, speed: 1,
      see: 'Same 100 N at 30 cm, but the push tilts from 90° to 35°. The torque bar shrinks from 30 to about 17 N·m.',
      why: { bio: 'Only the part of your push that goes across the handle turns the bolt. The part along the handle just pulls on the bolt.', honors: 'τ = rF sinθ = 0.30 × 100 × sin 35° = 17.2 N·m. Equivalently, the lever arm shrinks to r⊥ = r sinθ = 17.2 cm (purple line).' },
      overlay(sim,ctx,LH,k,tau){const f=tqTw(sim,tau,{ang:[90,35]},0.8,2.6),a=sim.p.ang;if(f<1){const [x,y]=tqPush(sim);tqRing(ctx,x,y,18,tau);}
        tqBL(ctx,k,[[f<1?'Tilting the push…':'Slanted push',700],'τ = 0.30 m × 100 N × sin '+Math.round(a)+'° = '+n1(emMet(sim,'tau'))+' N·m',['Straight across (90°) gives the most',700,13,TQ_B]],LH);} },
    { key: 'bolt', title: 'Push right at the bolt', set: { mode: 'wrench', F: 100, r: 0.3, ang: 90 }, fresh: true, speed: 1,
      see: 'Same 100 N push, but your hand slides in toward the bolt. The torque reaches zero at the bolt.',
      why: 'No distance from the pivot, no lever arm, so no torque. A push straight along the handle does the same.',
      overlay(sim,ctx,LH,k,tau){const f=tqTw(sim,tau,{r:[0.3,0]},0.8,2.6);if(f<1){const [x,y]=tqPush(sim);tqRing(ctx,x,y,18,tau);}
        ciCard(ctx,k,[[f<1?'Sliding in toward the bolt…':'Distance 0',700],sim.p.r.toFixed(2)+' m × 100 N = '+n1(sim.p.r*100)+' N·m',[f<1?'Torque shrinks with the distance':'No turning at all',700,13,TQ_R]],60,342,280,LH);} },
    { key: 'ladder', lvl: 'ap', title: 'The leaning ladder', set: { mode: 'ladder', lang: 65, mu: 0.3, x: 0 }, fresh: true, speed: 1, run(sim){emAct(sim,'climb');},
      see: 'A 70 kg climber goes up a ladder at 65° on a smooth wall (floor μ = 0.30). About two thirds up, the foot slides out.',
      why: 'About the foot, the climber’s lever arm grows as they climb, so the wall pushes out harder. Friction can’t exceed μN = 250 N.',
      overlay(sim,ctx,LH,k){tqLad(ctx,k,[['65°, μ = 0.30',700],'Friction needed: '+n0(emMet(sim,'fn'))+' N','Friction available: '+n0(emMet(sim,'fm'))+' N',[String(emMet(sim,'lst')),700,13,emMet(sim,'lst')==='Slips'?TQ_R:TQ_G]],LH);} },
    { key: 'steep', lvl: 'ap', title: 'Set it steeper', set: { mode: 'ladder', lang: 75, mu: 0.3, x: 0 }, fresh: true, speed: 1, run(sim){emAct(sim,'climb');},
      see: 'Same floor and climber, but the ladder stands at 75°. The climber reaches the top and it holds.',
      why: 'Steeper puts the weight closer above the foot, so the wall pushes less: about 190 N of friction needed.',
      overlay(sim,ctx,LH,k){tqLad(ctx,k,[['75°, μ = 0.30',700],'Friction needed: '+n0(emMet(sim,'fn'))+' N','Friction available: '+n0(emMet(sim,'fm'))+' N',[String(emMet(sim,'lst')),700,13,emMet(sim,'lst')==='Slips'?TQ_R:TQ_G]],LH);} }
  ],
  useIt: [
    { do: 'Use the longest wrench that fits, and pull at the end of the handle, straight across it.',
      why: 'Torque is distance × force × sin θ. Doubling the distance doubles the torque from the same effort, and a 90° pull wastes none of it.' },
    { do: 'Carry heavy things close to your body.',
      why: 'Your lower back is the pivot. A box held at arm’s length has a much bigger lever arm, so your back muscles must make far more torque to hold it.' },
    { do: 'Set an extension ladder with its foot 1 foot out for every 4 feet of height.', lvl: 'ap',
      why: 'OSHA’s 4-to-1 rule gives an angle of about 75°. As you saw, a steeper ladder needs much less floor friction to keep from sliding out.' }
  ],
  tryIt: [
    { title: 'the ruler balance (10 minutes)',
      steps: ['Balance a 30 cm ruler on a pencil at the 15 cm mark.', 'Put 2 coins at the 10 cm mark, 5 cm from the pivot.', 'Slide 1 coin along the other side until the ruler balances.', 'Now try 3 coins at the 10 cm mark against 1 coin.'],
      look: 'One coin balances two at the 25 cm mark: twice as far from the pivot. Against three coins, the single coin has to sit three times as far out, at the very end. Coins × distance must match on both sides.' }
  ]
},
rotation: {
  goals: {
    bio: ['Why objects with the same mass and size can roll at different speeds', 'Why mass far from the center is harder to spin', 'Why a spinning skater speeds up when she pulls her arms in'],
    honors: ['Rolling kinetic energy: ½Mv² + ½Iω²', 'Moment of inertia of a hoop, a disk and a ball', 'Why mass and radius cancel in a rolling race', 'Conservation of angular momentum, L = Iω'],
    ap: ['How the energy split depends on I = kMR²', 'v = √(2gh / (1 + k)) for rolling without slipping', 'L is conserved while rotational KE is not', 'τ = Iα for a spool and a falling weight']
  },
  matters: 'Figure skaters, divers, bike wheels and flywheels all follow the same two rules: where the mass sits decides how hard something is to spin, and spin stays the same unless something twists it.',
  startKey: 'start', startRun: false,
  startOverlay(sim,ctx,LH,k){tag(ctx,'Same mass, same size, same height',200,440,k,{s:12,hi:true});},
  steps: [
    { key: 'race', title: 'The rolling race', fresh: true, speed: 0.5, run: roRace,
      see: 'A hoop, a disk and a ball, same mass and radius, roll down a 1.5 m drop. The ball wins; the hoop is last.',
      why: { bio: 'Rolling takes energy for moving and for spinning. Mass far from the center is harder to spin, so the hoop has the least left for speed.', honors: 'Same mgh each. KE = ½Mv² + ½Iω². The hoop (I = MR²) splits it 50/50; the ball (I = ⅖MR²) keeps 71% for speed.' },
      overlay(sim,ctx,LH,k){roBL(ctx,k,[['Energy into moving',700],['Ball: 71% → 4.6 m/s',600,13,TQ_G],'Disk: 67% → 4.4 m/s','Hoop: 50% → 3.8 m/s'],LH);} },
    { key: 'block', title: 'A block that slides', set: { block: true }, fresh: true, speed: 0.5, run: roRace,
      see: 'Add a block sliding with no friction. It beats all three rollers to the bottom.',
      why: 'The block doesn’t spin, so all of its energy goes into speed: v = √(2gh) = 5.4 m/s. That is the fastest anything can get from this height.',
      overlay(sim,ctx,LH,k){roBL(ctx,k,[['Speed at the bottom',700],['Sliding block: 5.4 m/s',700,13,TQ_G],'Ball 4.6, disk 4.4, hoop 3.8 m/s'],LH);} },
    { key: 'sizes', lvl: 'honors', title: 'Mass and radius cancel', set: { lineup: 'sizes' }, fresh: true, speed: 0.5, run: roRace,
      see: 'Light and heavy, small and large hoops and disks. The two hoops tie, and the two disks tie.',
      why: 'For rolling without slipping, a = g sinθ / (1 + I/MR²). Mass and radius cancel out; only the shape factor I/MR² matters.',
      overlay(sim,ctx,LH,k){roBL(ctx,k,[['Only shape matters',700],'Hoop: I/MR² = 1','Disk: I/MR² = ½','Ball: I/MR² = ⅖'],LH);} },
    { key: 'skater', title: 'The spinning skater', set: { mode: 'skater' }, fresh: true, speed: 1,
      see: 'A skater on a frictionless spinning stool holds weights at arm’s length, turning half a revolution per second.',
      why: 'Nothing outside twists her, so her spin stays steady. The top view shows her hands’ path.',
      overlay(sim,ctx,LH,k){roTR(ctx,k,[['Arms out',700],'Spin: '+n2(emMet(sim,'w'))+' rev/s']);} },
    { key: 'in', title: 'Pull the arms in', set: { mode: 'skater' }, fresh: true, speed: 1,
      see: 'She pulls her hands in from 80 cm to 25 cm and spins about 3.5 times as fast.',
      why: { bio: 'Mass near the center is easier to spin. Her “amount of spin” stays the same, so she turns faster.', honors: 'Her moment of inertia drops from 4.84 to 1.38 kg·m². L = Iω is conserved, so ω rises from 0.50 to 1.76 rev/s.' },
      so: 'Divers tuck to flip faster.',
      overlay(sim,ctx,LH,k,tau){if(tau>1.2&&sim.p.armR>0.3)emAct(sim,'in');const r=sim.st.r;roTR(ctx,k,[[tau<1.2?'Arms out…':r>0.26?'Pulling in…':'Arms in',700],'Hands from the axis: '+n2(r)+' m',['Spin: '+n2(emMet(sim,'w'))+' rev/s (started at 0.50)',700,13,TQ_G],'L = Iω stays 15.2 kg·m²/s']);} },
    { key: 'energy', lvl: 'honors', title: 'Spin is conserved, energy is not', set: { mode: 'skater' }, fresh: true, speed: 1,
      see: 'Compare her kinetic energy: 23.9 J with arms out, 84.1 J with arms in.',
      why: 'KE = ½Iω² = L²/2I. With L fixed and I smaller, KE goes up. The extra energy comes from the work her arms do pulling the weights inward.',
      overlay(sim,ctx,LH,k,tau){if(tau>1.2&&sim.p.armR>0.3)emAct(sim,'in');roTR(ctx,k,[[sim.st.r>0.26?'Arms coming in…':'Arms in',700],'L = '+n1(emMet(sim,'L'))+' kg·m²/s (stays the same)',['KE = '+n1(emMet(sim,'KE'))+' J (started at 23.9 J)',700,13,TQ_R]]);} },
    { key: 'spool', lvl: 'ap', title: 'τ = Iα on a spool', set: { mode: 'spool' }, fresh: true, speed: 1, run(sim){emAct(sim,'drop');},
      see: 'A 0.5 kg weight unwinds a 2 kg solid-disk spool. It falls with 3.27 m/s², a third of g.',
      why: 'String tension T makes the torque: TR = Iα, with α = a/R. Combined with mg − T = ma, a = mg / (m + I/R²). Swap in a ring of the same mass and a drops to 1.96 m/s², because I = MR² is twice as big.',
      overlay(sim,ctx,LH,k){ciCard(ctx,k,[['Solid disk spool',700],'a = '+n2(emMet(sim,'acc'))+' m/s² (g = 9.8)','T = '+n2(emMet(sim,'T'))+' N (weight 4.9 N)',['τ = TR = Iα',700,13,TQ_B]],12,140,214,LH);} }
  ],
  useIt: [
    { do: 'To spin faster on a swivel chair or skates, start with arms out, then pull them in.',
      why: 'Angular momentum is conserved, so lowering your moment of inertia raises your spin rate. Stretch out again to slow down safely.' },
    { do: 'Pick lighter wheels and tires when you upgrade a bike for climbing and sprinting.',
      why: 'Mass at the rim counts extra: it has to be spun up as well as moved forward, like the hoop that came last in the race.' },
    { do: 'Hold the top of a jar lid at its edge, not the middle, when it’s stuck.', lvl: 'honors',
      why: 'Grip force farther from the center makes more torque. A rubber grip adds friction so more of your force reaches the lid.' }
  ],
  tryIt: [
    { title: 'the can race (10 minutes)',
      steps: ['Prop a large book on another book to make a ramp.', 'Hold a full can of soup and an empty can (or a can of thick soup and one of broth) side by side at the top.', 'Let go together and watch which reaches the bottom first. Repeat 3 times.'],
      look: 'The full, solid-ish can usually wins: its mass is spread through the middle like the disk, while an empty can’s mass is all at the rim like the hoop.' }
  ]
}
});

/* ===== Elevator and Atwood machine ===== */
const KR='#c8102e';
function phAt(sim,tau,t,key,fn){const m=sim._phAt||(sim._phAt={});if(tau>=t&&!m[key]){m[key]=1;fn();}}
const phAtReset=sim=>{sim._phAt={};};
const elGo=(sim,ride,t0,loop)=>{sim.st.rt=t0||0;sim.st.loop=loop||null;};
const ELC=(ctx,k,L)=>ciCard(ctx,k,L,276,62,252);
function elTrack(sim){const N=emMet(sim,'N');if(!isFinite(N))return;const r=sim._el||(sim._el={hi:-1,lo:1e9});if(sim.st.rt>0.2){r.hi=Math.max(r.hi,N);r.lo=Math.min(r.lo,N);}}
const elReset=sim=>{sim._el={hi:-1,lo:1e9};phAtReset(sim);};
const elHL=sim=>{const r=sim._el;return r&&r.hi>0?'Highest '+n0(r.hi)+' N, lowest '+n0(r.lo)+' N':'Highest and lowest: watching…';};
const ATC=(sim,ctx,k,L)=>sim.p.mode==='push'?ciCard(ctx,k,L,12,60,212):ciCard(ctx,k,L,sim.p.mode==='table'?70:12,999,212,410);
const atT1=sim=>{const a=Number(emMet(sim,'pred'));return sim.p.m1*(9.8+(sim.p.m2>=sim.p.m1?a:-a));},atT2=sim=>{const a=Number(emMet(sim,'pred'));return sim.p.m2*(9.8-(sim.p.m2>=sim.p.m1?a:-a));};
const atA=sim=>n2(emMet(sim,'pred'));
BioLab.addLearn({
elevator: {
  goals: {
    bio: ['Why a scale reads more or less than your weight in a moving elevator', 'That speeding up or slowing down, not moving, changes the reading', 'Why you feel weightless in free fall'],
    honors: ['Newton’s second law for the rider: N − mg = ma', 'Reading acceleration as the slope of a v–t graph', 'Why the sign of a, not of v, decides heavier or lighter'],
    ap: ['Free-body diagrams for the rider and for the car + rider system', 'Cable tension T = (M + m)(g + a)', 'Apparent weight as a non-inertial-frame effect']
  },
  matters: 'Elevators, roller coasters, airplanes and astronauts all feel heavier or lighter as they speed up and slow down. Engineers size elevator cables and coaster seats for those changing forces, not just for weight.',
  startKey: 'lobby', startRun: false,
  steps: [
    { key: 'rest', title: 'Standing still', set: { ride: 'up' }, fresh: true, pause: true,
      run(sim){elReset(sim);elGo(sim,'up',0);},
      see: 'You (60 kg) stand on a scale in an elevator at the lobby. It reads 588 N, your weight.',
      why: 'A scale measures the floor’s push, the normal force. Standing still, it balances gravity: 60 × 9.8 = 588 N.',
      overlay(sim,ctx,LH,k){ELC(ctx,k,[['Standing still: a = 0',700,13],['Floor pushes up 588 N',700,13,KR],'Gravity pulls down 588 N']);} },
    { key: 'up', title: 'A ride up', set: { ride: 'up' }, fresh: true, speed: 0.6,
      run(sim){elReset(sim);elGo(sim,'up',0);},
      see: 'A whole ride up: speed up, cruise, slow down. Watch the scale and the green arrow.',
      why: 'Speeding up: 648 N, you feel heavier. Cruising: 588 N. Slowing near the top: 528 N, you feel lighter.',
      so: { honors: 'N = m(g + a). It changes only while the velocity changes.' },
      overlay(sim,ctx,LH,k){elTrack(sim);ELC(ctx,k,[[String(emMet(sim,'motion')),700,12],['Scale '+n0(emMet(sim,'N'))+' N (weight 588 N)',700,13,KR],elHL(sim)]);} },
    { key: 'down', title: 'Going down is not lighter', set: { ride: 'down' }, fresh: true, speed: 0.6,
      run(sim){elReset(sim);elGo(sim,'down',0);},
      see: 'Now ride down. Predict first: will the scale read low the whole way down?',
      why: 'No. Low (528 N) while speeding up downward, normal while cruising, high (648 N) while stopping. Accelerating down feels lighter; moving down doesn’t.',
      overlay(sim,ctx,LH,k){elTrack(sim);ELC(ctx,k,[[String(emMet(sim,'motion')),700,12],['Scale '+n0(emMet(sim,'N'))+' N (weight 588 N)',700,13,KR],elHL(sim)]);} },
    { key: 'harder', lvl: 'honors', title: 'Harder starts, bigger swings', set: { ride: 'up', accel: 2 }, fresh: true, speed: 0.6,
      cause: { from: { accel: 1 }, delay: 1, dur: 1.5, at: [400,8], label: 'Elevator acceleration' },
      run(sim){elReset(sim);},
      see: 'The same ride up, but speeding up and slowing twice as hard: 2.0 m/s².',
      why: 'N = m(g + a): 708 N speeding up and 468 N slowing, against 648 and 528 N before. Bigger acceleration, bigger swing.',
      overlay(sim,ctx,LH,k,tau){if(tau>2.6)elTrack(sim);ELC(ctx,k,[['Acceleration '+n1(sim.p.accel)+' m/s² (was 1.0)',700,13,KR],'Scale '+n0(emMet(sim,'N'))+' N',elHL(sim)]);} },
    { key: 'heavier', title: 'A heavier rider', set: { ride: 'up', mass: 90 }, fresh: true, speed: 0.6,
      cause: { from: { mass: 60 }, delay: 1.5, dur: 2.5, at: [400,8], label: 'Your mass' },
      run(sim){elReset(sim);elGo(sim,'up',0.6,[0.6,2.4]);},
      see: 'Speeding up on the way up, again and again, as the rider grows from 60 kg to 90 kg.',
      why: 'Everyone gets the same acceleration, so more mass needs more push: 972 N. The scale ÷ weight stays 1.10.',
      overlay(sim,ctx,LH,k){ELC(ctx,k,[['Mass '+n0(sim.p.mass)+' kg (was 60)',700,13,KR],'Scale '+n0(emMet(sim,'N'))+' N (was 648)','Weight '+n0(emMet(sim,'W'))+' N']);} },
    { key: 'drop', title: 'Free fall reads zero', set: { ride: 'drop' }, fresh: true, speed: 0.4,
      run(sim){elReset(sim);elGo(sim,'drop',0);},
      see: 'A drop tower: your seat is the scale. Watch the reading as the ride falls, then brakes.',
      why: 'Falling freely, you and the seat speed up together, so the seat pushes 0 N, though gravity still pulls 588 N.',
      so: 'That is why astronauts in orbit feel weightless.',
      overlay(sim,ctx,LH,k){elTrack(sim);ELC(ctx,k,[[String(emMet(sim,'motion')),700,12],['Seat pushes '+n0(emMet(sim,'N'))+' N (weight 588 N)',700,13,KR],elHL(sim)]);} },
    { key: 'cable', lvl: 'ap', title: 'The cable feels it too', set: { ride: 'up', fbd: 'sys' }, fresh: true, speed: 0.6,
      run(sim){elReset(sim);elGo(sim,'up',0);},
      see: 'The free-body diagram is now car plus rider, 1,060 kg: the cable pulls up, gravity down.',
      why: 'T = (M + m)(g + a): 11,448 N speeding up, 10,388 N cruising, 9,328 N slowing.',
      overlay(sim,ctx,LH,k){ELC(ctx,k,[['Cable tension '+n0(emMet(sim,'T'))+' N',700,13,KR],'a = '+n2(emMet(sim,'acc'))+' m/s²','(M + m)g = 10,388 N']);} }
  ],
  useIt: [
    { do: 'Expect to feel heavier at the bottom of a roller-coaster dip and lighter over the top of a hill.',
      why: 'At the bottom the track pushes you up to change your direction, so you are accelerating up. Over a hill you accelerate down, and the seat pushes less, sometimes not at all.' },
    { do: 'Weigh yourself standing still on a hard floor.',
      why: 'Bouncing, leaning or a soft rug changes how hard the scale pushes back for a moment, and that is all a scale can measure.' },
    { do: 'Notice where an elevator speeds up and slows down next time you ride one.', lvl: 'honors',
      why: 'Your stomach and knees sense the change in the floor’s push. That feeling marks the parts of the v–t graph with a slope.' }
  ],
  tryIt: [
    { title: 'the elevator scale (5 minutes)',
      steps: ['Take a bathroom scale (or a phone with an accelerometer app) into an elevator.', 'Stand still on it and note the reading at the start, while the elevator cruises, and as it stops.', 'Ride both up and down.'],
      look: 'Going up, the reading jumps above your weight at the start and drops below it at the end. Going down, it is the reverse. While cruising it matches your weight.' }
  ]
},
atwood: {
  goals: {
    bio: ['Why two masses on a string move together', 'Why only the difference in weight speeds them up', 'How friction and a push change the motion'],
    honors: ['Treating connected objects as one system: a = net force ÷ total mass', 'Finding tension from one object’s free-body diagram', 'Static friction that holds a system still'],
    ap: ['Systems with a massive pulley: I = ½MR²', 'Why the tensions differ when the pulley has mass', 'Contact forces between pushed blocks']
  },
  matters: 'Elevators hang the car against a counterweight, cranes and window-washer rigs use pulleys, and trains are blocks pushed and pulled together. The same system thinking tells engineers how fast they speed up and how strong the cables must be.',
  startKey: 'machine', startRun: true, startSpeed: 0.6,
  steps: [
    { key: 'equal', title: 'Equal masses: nothing happens', set: { mode: 'atwood', m1: 1, m2: 1, Mp: 0 }, fresh: true, speed: 0.6,
      see: 'Two 1.0 kg masses hang over a pulley. Watch: they just hang there.',
      why: 'Each side pulls down on the string with the same weight, 9.8 N, so the net force on the pair is zero. No net force means no acceleration.',
      overlay(sim,ctx,LH,k){ATC(sim,ctx,k,[['m₁ = m₂ = 1.0 kg',700,13],'Net force: 0 N',['a = '+atA(sim)+' m/s²',700,13,KR]]);} },
    { key: 'heavier', title: 'Make one side heavier', set: { mode: 'atwood', m1: 1, m2: 1.2, Mp: 0 }, fresh: true, speed: 0.6,
      cause: { from: { m2: 1 }, delay: 1.5, dur: 1.5, ring: [430,260,48], label: 'Mass m₂' },
      see: 'Watch 0.2 kg get added to the right side. The pair starts moving, slowly.',
      why: 'Only the difference pulls, 1.96 N, but it must speed up all 2.2 kg: a = 0.89 m/s².',
      overlay(sim,ctx,LH,k){ATC(sim,ctx,k,[['m₂ = '+n1(sim.p.m2)+' kg (was 1.0)',700,13],'Net force: '+n2((sim.p.m2-sim.p.m1)*9.8)+' N',['a = '+atA(sim)+' m/s² (was 0)',700,13,KR]]);} },
    { key: 'more', title: 'A bigger difference', set: { mode: 'atwood', m1: 1, m2: 2.5, Mp: 0 }, fresh: true, speed: 0.6,
      cause: { from: { m2: 1.2 }, delay: 1.5, dur: 3, ring: [430,260,52], label: 'Mass m₂' },
      see: 'Watch m₂ grow from 1.2 to 2.5 kg. The run gets faster.',
      why: 'a = 14.7 N ÷ 3.5 kg = 4.2 m/s². It can never reach 9.8 m/s², because m₁ is always dragged along.',
      overlay(sim,ctx,LH,k){ATC(sim,ctx,k,[['m₂ = '+n1(sim.p.m2)+' kg (was 1.2)',700,13],'Net '+n1((sim.p.m2-sim.p.m1)*9.8)+' N on '+n1(sim.p.m1+sim.p.m2)+' kg',['a = '+atA(sim)+' m/s² (was 0.89)',700,13,KR]]);} },
    { key: 'counter', title: 'Why elevators use a counterweight', set: { mode: 'atwood', m1: 2.8, m2: 3, Mp: 0 }, fresh: true, speed: 0.6,
      cause: { from: { m1: 1, m2: 1.2 }, delay: 2, dur: 2.5, label: 'Both masses' },
      see: 'Both sides grow, like an elevator car (3.0 kg) against a counterweight (2.8 kg). The difference stays 0.2 kg.',
      why: 'The same 1.96 N now moves 5.8 kg: a = 0.34 m/s², a gentle start. The motor only supplies the small difference.',
      overlay(sim,ctx,LH,k){ATC(sim,ctx,k,[['m₁ '+n1(sim.p.m1)+' kg, m₂ '+n1(sim.p.m2)+' kg',700,13],'Difference: 0.2 kg on '+n1(sim.p.m1+sim.p.m2)+' kg',['a = '+atA(sim)+' m/s² (was 0.89)',700,13,KR]]);} },
    { key: 'tension', lvl: 'honors', title: 'The tension is in between', set: { mode: 'atwood', m1: 1, m2: 1.6, Mp: 0 }, fresh: true, speed: 0.6, focus: [548,14,246,300],
      see: 'The free-body diagrams on the right: on each mass, the string pulls up and gravity pulls down.',
      why: 'T must beat m₁’s 9.8 N but lose to m₂’s 15.7 N. From m₁: T = m₁(g + a) = 12.1 N.',
      overlay(sim,ctx,LH,k){ATC(sim,ctx,k,[['Tension '+n2(atT1(sim))+' N',700,13,KR],'m₁g = 9.80 N   m₂g = 15.68 N','a = '+atA(sim)+' m/s²']);} },
    { key: 'table', title: 'A block on a table', set: { mode: 'table', m1: 1, m2: 1, mu: 0.4 }, fresh: true, speed: 0.6,
      cause: { from: { mu: 0 }, delay: 2, dur: 2.5, label: 'Table friction μ' },
      see: 'The string runs over a table edge. It starts on a frictionless air table; watch friction get turned up.',
      why: 'Friction on the table block pulls back: a = (m₂g − μm₁g) ÷ (m₁ + m₂). At μ = 0.4, a drops from 4.9 to 2.9 m/s².',
      overlay(sim,ctx,LH,k){ATC(sim,ctx,k,[['μ = '+n2(sim.p.mu)+' (was 0)',700,13],'Friction: '+n2(sim.p.mu*sim.p.m1*9.8)+' N',['a = '+atA(sim)+' m/s² (was 4.90)',700,13,KR]]);} },
    { key: 'stuck', lvl: 'honors', title: 'Too much friction', set: { mode: 'table', m1: 3, m2: 1, mu: 0.4 }, fresh: true, speed: 0.6,
      cause: { from: { mu: 0.2 }, delay: 2, dur: 2.5, label: 'Table friction μ' },
      see: '3.0 kg on the table, 1.0 kg hanging. Watch μ rise from 0.20 to 0.40.',
      why: 'At μ = 0.33, static friction can match the 9.8 N hanging weight, so nothing moves. It pushes only as hard as needed: 9.8 N.',
      overlay(sim,ctx,LH,k){ATC(sim,ctx,k,[['μ = '+n2(sim.p.mu)+' (was 0.20)',700,13],'Friction can hold up to '+n2(sim.p.mu*29.4)+' N','Hanging weight: 9.80 N',['a = '+atA(sim)+' m/s²',700,13,KR]]);} },
    { key: 'push', title: 'Push two blocks', set: { mode: 'push', m1: 1, m2: 1, F: 12 }, fresh: true, speed: 0.6,
      cause: { from: { F: 6 }, delay: 2, dur: 2.5, label: 'Your push' },
      see: 'You push the back block, which pushes the front one. Watch your push double from 6 N to 12 N.',
      why: 'Both share one acceleration: a = F ÷ (m₁ + m₂), so doubling F doubles a.',
      overlay(sim,ctx,LH,k){ATC(sim,ctx,k,[['Push '+n0(sim.p.F)+' N (was 6)',700,13],'a = '+atA(sim)+' m/s² (was 3.00)',['Back pushes front: '+n2(sim.p.m2*sim.p.F/(sim.p.m1+sim.p.m2))+' N',700,13,KR]]);} },
    { key: 'pulley', lvl: 'ap', title: 'A pulley with mass', set: { mode: 'atwood', m1: 1, m2: 1.6, Mp: 2 }, fresh: true, speed: 0.6,
      cause: { from: { Mp: 0 }, delay: 2, dur: 2.5, label: 'Pulley mass M' },
      see: 'Watch the pulley become a 2.0 kg solid disk.',
      why: 'The pulley has to be spun up too, and it acts like an extra ½M = 1.0 kg in the system: a = (m₂ − m₁)g ÷ (m₁ + m₂ + ½M). It takes a net torque to spin it, so the two tensions are no longer equal.',
      overlay(sim,ctx,LH,k){ATC(sim,ctx,k,[['Pulley '+n1(sim.p.Mp)+' kg (was 0)',700,13],'a = '+atA(sim)+' m/s² (was 2.26)',['T₁ = '+n2(atT1(sim))+' N, T₂ = '+n2(atT2(sim))+' N',700,13,KR]]);} }
  ],
  useIt: [
    { do: 'Look for the counterweight next time you see an elevator shaft or a window-washer rig.',
      why: 'Hanging the car against a weight close to its own makes it an Atwood machine: the motor only has to supply the difference, not lift the whole car.' },
    { do: 'Add weight to a sled or wagon you are pulling only if you have to.',
      why: 'Every extra kilogram adds to the mass you must accelerate and, on rough ground, to the friction pulling back.' },
    { do: 'Pull a heavy box with a rope instead of shoving it, if the floor is rough.', lvl: 'honors',
      why: 'Pushing down at an angle presses the box into the floor and raises friction. Pulling up at an angle lifts some of its weight off the floor.' }
  ],
  tryIt: [
    { title: 'the paper-cup Atwood machine (10 minutes)',
      steps: ['Hang two paper cups from a string over a smooth rod or a broom handle.', 'Put 10 coins in each cup: nothing happens.', 'Move coins one at a time from one cup to the other and time the drop to the floor.'],
      look: 'With equal coins nothing moves. Each coin you move makes the heavy side fall faster, but even 15 against 5 falls much slower than a dropped coin.' }
  ]
}
});

/* ---------- workenergy (replaces Physics Aviary Work to KE, Work to PE and Energy Transformation, Mr. Willson) ---------- */
BioLab.addLearn((function(){
const weC=(ctx,k,lines,x,y,w)=>{const f=Math.min(1,1.1/Math.min(k,1.3));foCard(ctx,k,lines.map(l=>{const o=typeof l==='string'?[l,500]:l.slice();o[2]=(o[2]||12.5)*f;return o;}),x,y,w);};
const P=(ctx,k,L)=>weC(ctx,k,L,190,40,340),Lf=(ctx,k,L)=>weC(ctx,k,L,66,150,230),Sp=(ctx,k,L)=>weC(ctx,k,L,300,214,240);
const M=(sim,id)=>emMet(sim,id),n0=v=>Math.round(v).toLocaleString(),n2=v=>(+v).toFixed(2);
const RD='#c8102e',GR='#1b7a3a',BL2='#1f5fbf',PU='#6a3fa0';
const gate=sim=>sim.st.vg!==null;
const fx=sim=>{sim.gmode='live';sim.gMetric='fx';if(sim.ui&&sim.ui.gm){sim.ui.gm.value='fx';sim.ui.gm.dispatchEvent(new Event('change'));}};
return {
workenergy: {
  goals: {
    bio: ['How work (force × distance) becomes kinetic energy you can measure as speed', 'Why the same work gives a heavy cart and a light cart the same energy but different speeds', 'How lifting stores energy as height, and a spring stores it as a squeeze'],
    honors: ['Why twice the work gives only √2 times the speed', 'How rolling resistance does negative work', 'Why twice the squeeze stores four times the energy (½kx²)'],
    ap: ['How to find a mass from the slope of work against v²']
  },
  matters: 'Every time you push a cart, lift a bag or wind up a toy, the work you do becomes energy you can count in joules. It is the same bookkeeping engineers use for car brakes, roller coasters and phone batteries.',
  question: 'Your friend’s car stalls in a parking lot, and three of you push it to get it rolling. Is it better to push harder, or to keep pushing for longer?',
  startKey: 'push', startRun: true,
  steps: [
    { key: 'push', title: 'Work = force × distance', set: { mode: 'push', F: 60, d: 2, M: 20, th: 0, mu: 0 }, fresh: true, speed: 1,
      see: 'You push a 20 kg cart with 60 N for 2 m, then let go. The red work bar fills, then the cart passes the speed gate.',
      why: 'Work = force × distance = 120 J. With no friction, all of it becomes kinetic energy (green): 3.46 m/s.',
      overlay(sim,ctx,LH,k){P(ctx,k,[['W = F × d = 60 N × 2 m = 120 J',700,13.5],['Kinetic energy now: '+n0(M(sim,'KE'))+' J',700,13,GR],gate(sim)?['Speed at the gate: '+n2(M(sim,'vg'))+' m/s',700,13,RD]:'Speed at the gate: …']);} },
    { key: 'far', title: 'Push twice as far', set: { mode: 'push', F: 60, d: 4, M: 20, th: 0, mu: 0 }, fresh: true, speed: 1,
      cause: { from: { d: 2 }, delay: 0.05, dur: 0.45, label: 'Push distance', at: [360, 116] },
      see: 'Same 60 N, but the push zone stretches to 4 m.',
      why: 'Twice the work, 240 J. But KE = ½mv², so speed grows only √2 times: 4.90 m/s, not 6.92.',
      overlay(sim,ctx,LH,k){P(ctx,k,[['W = 60 N × 4 m = 240 J (was 120)',700,13.5],gate(sim)?['Speed: '+n2(M(sim,'vg'))+' m/s (was 3.46)',700,13,RD]:'Speed at the gate: …','2 × the energy → 1.41 × the speed']);} },
    { key: 'heavy', title: 'A heavier cart, the same work', set: { mode: 'push', F: 60, d: 2, M: 40, th: 0, mu: 0 }, fresh: true, speed: 1,
      cause: { from: { M: 20 }, delay: 0.05, dur: 0.45, label: 'Cart + groceries', at: [360, 116] },
      see: 'The cart is loaded to 40 kg. Still 60 N for 2 m.',
      why: 'Still 120 J of kinetic energy, but twice the mass means less speed: √(2 × 120 ÷ 40) = 2.45 m/s.',
      overlay(sim,ctx,LH,k){P(ctx,k,[['Same work: 120 J',700,13.5],['Kinetic energy: '+n0(M(sim,'KE'))+' J',700,13,GR],gate(sim)?['Speed: '+n2(M(sim,'vg'))+' m/s (20 kg: 3.46)',700,13,RD]:'Speed at the gate: …']);} },
    { key: 'lift', title: 'Lifting stores energy as height', set: { mode: 'lift', m: 10, h: 1.9, how: 'steady' }, fresh: true, speed: 1,
      see: 'A 10 kg carry-on lifted steadily into a 1.9 m overhead bin. Watch the blue bar.',
      why: 'Your force matches its weight, 98 N, over 1.9 m: about 186 J, stored as gravitational potential energy.',
      overlay(sim,ctx,LH,k){Lf(ctx,k,[['W = mgh',700,13.5],'= 10 × 9.8 × 1.9 ≈ 186 J',['Stored so far: '+n0(M(sim,'PE'))+' J',700,13,BL2]]);} },
    { key: 'yank', title: 'Heave it, and the extra becomes speed', set: { mode: 'lift', m: 10, h: 1.9, how: 'hard', FL: 150 }, fresh: true, speed: 1,
      cause: { from: { FL: 100 }, delay: 0.05, dur: 0.45, label: 'Your lifting force', at: [170, 116] },
      see: 'Now you heave with 150 N the whole way up. Watch both bars.',
      why: '150 N × 1.9 m = 285 J. Height takes 186 J; the other 99 J is speed: 4.4 m/s at the shelf.',
      overlay(sim,ctx,LH,k){Lf(ctx,k,[['W = 150 × 1.9 = 285 J',700,13.5],['Height: '+n0(M(sim,'PE'))+' J',700,13,BL2],['Speed: '+n0(M(sim,'KE'))+' J',700,13,GR]]);} },
    { key: 'spring', title: 'A squeezed spring stores energy', set: { mode: 'spring', k: 400, x: 0.08, mb: 0.1 }, fresh: true, speed: 0.5,
      see: 'A 0.10 kg ball on a launcher spring squeezed 8 cm. The purple, green and blue bars trade places in slow motion.',
      why: 'The spring stores ½kx² = 1.28 J. It becomes kinetic energy, then height: about 1.31 m.',
      overlay(sim,ctx,LH,k){Sp(ctx,k,[['Spring '+n2(M(sim,'Us'))+' J',700,13,PU],['Kinetic '+n2(M(sim,'KE'))+' J',700,13,GR],['Height '+n2(M(sim,'PE'))+' J',700,13,BL2],'Total stays 1.28 J']);} },
    { key: 'squeeze', title: 'Twice the squeeze, four times as high', set: { mode: 'spring', k: 400, x: 0.1, mb: 0.1 }, fresh: true, speed: 1,
      cause: { from: { x: 0.05 }, delay: 0.05, dur: 0.45, label: 'Squeeze', at: [400, 116] },
      see: 'The squeeze grows from 5 cm to 10 cm. Watch where the ball tops out.',
      why: 'Spring energy is ½kx²: double x, four times the energy, so four times as high.',
      so: 'That is why a bow drawn twice as far is far more dangerous.',
      overlay(sim,ctx,LH,k){Sp(ctx,k,[['5 cm: 0.50 J → 0.51 m',600,12.5],['10 cm: 2.00 J → '+(sim.st.hm!==null?n2(sim.st.hm):'…')+' m',700,13,RD],'2 × squeeze = 4 × energy']);} },
    { lvl: 'honors', key: 'handle', title: 'Pushing down on the handle', set: { mode: 'push', F: 60, d: 2, M: 20, th: 40, mu: 0 }, fresh: true, speed: 1,
      cause: { from: { th: 0 }, delay: 0.05, dur: 0.45, label: 'Push angle', at: [360, 116] },
      see: 'The same 60 N, now aimed 40° down into the handle.',
      why: 'Only the part along the motion does work: 60 cos 40° ≈ 46 N, so W ≈ 92 J, not 120 J.',
      overlay(sim,ctx,LH,k){P(ctx,k,[['W = F d cos θ = 60 × 2 × cos 40°',700,13.5],['= '+n0(M(sim,'W'))+' J (level: 120 J)',700,13,RD],gate(sim)?'Speed: '+n2(M(sim,'vg'))+' m/s (level: 3.46)':'Speed at the gate: …']);} },
    { lvl: 'honors', key: 'rolling', title: 'Rolling resistance takes its share', set: { mode: 'push', F: 60, d: 2, M: 20, th: 0, mu: 0.05 }, fresh: true, speed: 1,
      cause: { from: { mu: 0 }, delay: 0.05, dur: 0.45, label: 'Rolling resistance', at: [360, 116] },
      see: 'The same level 60 N push, now with rolling resistance. Watch the orange heat bar.',
      why: 'Rolling resistance does about −24 J, so 120 J splits into 96 J of motion and 24 J of heat. Net work still equals ΔKE.',
      overlay(sim,ctx,LH,k){P(ctx,k,[['You: +'+n0(M(sim,'W'))+' J   Rolling: '+n0(M(sim,'Wf'))+' J',700,13.5],['KE = net work = '+n0(M(sim,'KE'))+' J',700,13,GR]]);} },
    { lvl: 'honors', key: 'area', title: 'Spring energy is a triangle', set: { mode: 'spring', k: 400, x: 0.1, mb: 0.1 }, fresh: true, speed: 0.25,
      run(sim){fx(sim);},
      see: 'Watch the force–position graph below as the spring relaxes.',
      why: 'Spring force falls from 40 N to 0 over 10 cm. Work is the area under the graph: ½ × 0.10 m × 40 N = 2.0 J.',
      overlay(sim,ctx,LH,k){Sp(ctx,k,[['Area = ½ × base × height',700,13.5],'= ½ × 0.10 m × 40 N = 2.0 J',['Released so far: '+n2(2-M(sim,'Us'))+' J',700,13,PU]]);} },
    { lvl: 'ap', key: 'slope', title: 'Weigh a cart with a speed gate', set: { mode: 'push', F: 60, d: 3, M: 20, th: 0, mu: 0 }, fresh: true, speed: 1,
      see: 'Pushes from 0.5 m to 3 m with 60 N. The card lists work against v² for each.',
      why: 'W = ½mv², so W against v² is a line with slope m/2. Every row gives W ÷ v² = 10 kg: the cart is 20 kg.',
      overlay(sim,ctx,LH,k){const rows=[0.5,1,2,3].map(d=>{const W=60*d,v2=2*W/20;return 'd = '+d+' m: W = '+W+' J, v² = '+v2.toFixed(0)+' → '+(W/v2).toFixed(0)+' kg';});P(ctx,k,[['Slope = W ÷ v² = m/2',700,13.5]].concat(rows).concat([['m = 2 × 10 = 20 kg',700,13,RD]]));} }
  ],
  useIt: [
    { do: 'Lift a heavy bag into an overhead bin steadily instead of heaving it.',
      why: 'Steady, your work all becomes height. Heave it, and the extra work becomes speed that your arms, the bin or someone’s head has to absorb.' },
    { do: 'Leave much more stopping distance when you drive faster.',
      why: 'Kinetic energy grows with speed squared. At twice the speed your car carries four times the energy, so the brakes need about four times the distance to take it away.' },
    { do: 'Push a cart, stroller or wheelbarrow along the direction it rolls.', lvl: 'honors',
      why: 'Pushing down on the handle wastes part of your force: it does no work and it presses the wheels into the ground, which adds rolling resistance.' }
  ],
  tryIt: [
    { title: 'the click-pen launcher (5 minutes)',
      steps: ['Take the spring out of a click pen. Stand it upright on a table with a small paper ball on top.', 'Press it halfway down with a ruler and slide the ruler off. Note how high the paper ball flies.', 'Repeat pressing it all the way down. Point it at the ceiling, never at anyone.'],
      look: 'Pressing twice as far sends it far more than twice as high, close to four times: spring energy is ½kx².' }
  ]
}
};
})());

})();
