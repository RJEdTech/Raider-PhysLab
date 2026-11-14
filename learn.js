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
      see: 'You stand still on the board at the 2 m mark. On the position graph, standing still draws a flat line at 2 m, and the velocity graph sits on zero.',
      why: '<b>Position</b> is where you are, measured from a starting point: here, the left end. A position graph shows where you are at each moment, so if position never changes, the line stays level.',
      overlay(sim,ctx,LH,k){const a=A(sim),X=a.SX(sim.st.x);brace(ctx,a.SX(0),56,X,56,'x = '+sim.st.x.toFixed(0)+' m from the left end',k,70);panelTag(sim,ctx,k,0,'Flat line = not moving',{hi:true});} },
    { key: 'steady', title: 'Steady speed', set: { v0: 1.5 }, fresh: true, speed: 1,
      see: 'Now you roll right at a steady 1.5 m/s, a walking pace. The dots are evenly spaced, the position line slopes up in a straight line, and the velocity line is flat at 1.5.',
      why: '<b>Velocity</b> is how far you go each second, and which way. At 1.5 m/s you cover the same 1.5 m every second, so the gaps are equal and the position line is straight. A steeper line means faster.',
      so: { honors: 'The slope of the position graph, rise ÷ run, is the velocity.' },
      overlay(sim,ctx,LH,k){slopeTri(sim,ctx,k,2,4,'3 m in 2 s = 1.5 m/s');tag(ctx,'Evenly spaced dots = steady speed',600,206,k,{s:12});} },
    { key: 'fast', title: 'Twice as fast', set: { v0: 3 }, fresh: true, speed: 1,
      see: 'Same start, but 3 m/s. The gaps between dots double, the position line is twice as steep, and you reach the end of the track in 6 s.',
      why: 'Twice the velocity means twice the distance every second. On the position graph, speed shows up as steepness.',
      overlay(sim,ctx,LH,k){slopeTri(sim,ctx,k,1,2,'3 m in 1 s = 3 m/s');panelTag(sim,ctx,k,0,'Steeper line = faster',{hi:true});} },
    { key: 'speedup', title: 'Speeding up', set: { v0: 0, a: 0.5 }, fresh: true, speed: 1,
      see: 'You push off from rest and gain 0.5 m/s every second. The gaps between dots grow, the position line curves upward, and the velocity line climbs like a ramp.',
      why: '<b>Acceleration</b> is how much your velocity changes each second. Because you go a little faster every second, you cover more ground each second, so the position graph bends up. A steady push makes a flat acceleration line.',
      overlay(sim,ctx,LH,k){riderTag(sim,ctx,k,'v = '+sim.st.v.toFixed(1)+' m/s');tag(ctx,'Gaps grow = speeding up',600,206,k,{s:12});panelTag(sim,ctx,k,1,'Climbs 0.5 m/s each second',{hi:true});} },
    { key: 'brake', title: 'Slowing down and turning around', set: { v0: 3, a: -0.5 }, fresh: true, speed: 1,
      see: 'You roll right at 3 m/s up a gentle slope that pulls back at 0.5 m/s² (the track is drawn flat). The gaps shrink, you stop for an instant at 6 s, then roll back to the left.',
      why: 'When velocity and acceleration point opposite ways, you slow down. At the turnaround your velocity is zero for an instant, but your acceleration is not: the slope is still pulling, which is why you start back the other way.',
      overlay(sim,ctx,LH,k){const v=sim.st.v;riderTag(sim,ctx,k,Math.abs(v)<0.2?'v = 0 for an instant, but a is still −0.5':'v = '+v.toFixed(1)+' m/s,  a = −0.5 m/s²');panelTag(sim,ctx,k,1,'Crosses zero at the turnaround',{hi:true});} },
    { key: 'negfast', title: 'Negative does not mean slowing down', set: { x0: 18, v0: -1, a: -0.5 }, fresh: true, speed: 1,
      see: 'You start at 18 m rolling left (v = −1 m/s), and a slope speeds you up to the left: a = −0.5 m/s². Both are negative, and the gaps grow: you are speeding up.',
      why: 'A minus sign only means “toward the left.” You speed up when velocity and acceleration have the <b>same</b> sign, and slow down when their signs are <b>opposite</b>.',
      overlay(sim,ctx,LH,k){riderTag(sim,ctx,k,'v and a both negative → speeding up');} },
    { key: 'race', title: 'Catching up', base: { mode: 'race', vA: 1.5, vB: 0.5, gap: 4 }, fresh: true, speed: 1,
      see: 'Your friend has a 4 m head start and strolls at 0.5 m/s. You walk at 1.5 m/s. Watch the two position lines: where they cross, you are side by side.',
      why: 'You gain 1.5 − 0.5 = 1 m on your friend every second, so the 4 m head start lasts 4 s. Only the difference in speed closes a gap.',
      overlay(sim,ctx,LH,k){const s=sim.st;tag(ctx,s.meet?'Caught up: 4 s, at 6 m':'You gain 1 m every second',560,78,k,{s:12,hi:true});panelTag(sim,ctx,k,0,'Lines cross = side by side',{hi:true});} },
    { lvl: 'honors', key: 'area', title: 'Area under velocity = displacement', set: { v0: 1, a: 0.5 }, fresh: true, speed: 1,
      see: 'You start at 1 m/s and speed up at 0.5 m/s². The shaded area under the velocity line grows, and it always matches how far you have moved.',
      why: 'Each little strip of the area is velocity × time, which is distance. Add the strips and you get the displacement. That is why the area under a v–t graph is displacement.',
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
  lines.forEach((L,i)=>H.txt(ctx,L[0],516,y+20+i*20,{s:(L[2]||12.5)*k,w:L[1]||500,c:L[3]||PAL['cv-ink']}));}
const FFDEF={objA:'bowling',objB:'tennis',h:10,air:false,planet:'earth',bounce:false,v0:0};

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
      see: 'Two balls sit on a ledge 10 m up. The ruler measures height above the ground. The stopwatch on the right will stop for each ball when it lands.',
      why: 'To test one thing, change only one thing. Both balls start at the same height at the same moment, with the air switched off, so the only difference between them is their mass. The balls are drawn several times bigger than the tower’s scale so you can see them: a real bowling ball is 22 cm across and a tennis ball 6.7 cm.',
      overlay(sim,ctx,LH,k){tag(ctx,'7 kg, 22 cm',FF.XA-60,ffY(sim,10,'bowling')-30,k,{s:12});tag(ctx,'60 g, 6.7 cm',FF.XB+56,ffY(sim,10,'tennis')-30,k,{s:12});tag(ctx,'Air: off',300,250,k,{s:13,hi:true});} },
    { key: 'drop', title: 'Release both', set: FFDEF, fresh: true, speed: 0.5,
      see: 'Both balls let go at the same instant, in slow motion. Watch the stopwatch: they hit the ground together, at 1.43 s.',
      why: 'Without air, mass makes no difference to how a thing falls. More than 100 times the mass, and they stay side by side all the way down.',
      overlay(sim,ctx,LH,k){const A=sim.st.A,B=sim.st.B;if(A.land!==null&&B.land!==null)tag(ctx,'Both landed at '+A.land.toFixed(2)+' s',305,360,k,{s:14,hi:true});else tag(ctx,'Which lands first?',305,250,k,{s:13});} },
    { key: 'gain', title: 'Faster every second', pause: true,
      see: 'The faint circles show where the bowling ball was every 0.1 s. The labels show how fast it was going at each point: 4.9 m/s after half a second, 9.8 m/s after one second, 14 m/s when it landed.',
      why: 'That is what <b>g = 9.8 m/s²</b> means: a falling object gains 9.8 m/s of speed every second. Because it keeps getting faster, it covers more ground in each tenth of a second, so the circles spread out as it falls.',
      overlay(sim,ctx,LH,k){[[0.5,'0.5 s: 4.9 m/s'],[1,'1 s: 9.8 m/s'],[1.43,'1.43 s: 14 m/s']].forEach(([t,s])=>{const y=ffY(sim,Math.max(0,10-4.9*t*t),'bowling');line(ctx,FF.XA-82,y,FF.XA-20,y,'#c8102e');tag(ctx,s,FF.XA-82,y,k,{s:12,hi:true});});} },
    { key: 'mass', title: 'Why mass doesn’t matter', set: FFDEF, fresh: true, speed: 0.3,
      see: 'Red arrows show gravity’s pull on each ball. The pull on the bowling ball is about 117 times bigger. The tennis ball’s arrow is barely a speck.',
      why: 'A bigger pull, but also a bigger mass to get moving. Acceleration = force ÷ mass, and the two cancel out exactly: every object gets 9.8 m/s² from gravity. A heavy ball is harder to speed up by exactly as much as it is pulled harder.',
      overlay(sim,ctx,LH,k){const A=sim.st.A,B=sim.st.B,ya=ffY(sim,A.y,'bowling'),yb=ffY(sim,B.y,'tennis');ffArrow(ctx,FF.XA,ya+17,90,'#c8102e');ffArrow(ctx,FF.XB,yb+9,2,'#c8102e',2);
        tag(ctx,'pull: 69 N',FF.XA-60,ya+70,k,{s:12,hi:true});tag(ctx,'pull: 0.59 N',FF.XB+62,yb+12,k,{s:12,hi:true});
        ffCard(ctx,k,[['acceleration = pull ÷ mass',700],['bowling: 69 N ÷ 7 kg = 9.8 m/s²'],['tennis: 0.59 N ÷ 0.06 kg = 9.8 m/s²']]);} },
    { key: 'air', title: 'Now add air', set: { objA: 'tennis', objB: 'feather', air: true, h: 3 }, fresh: true, speed: 1,
      see: 'A tennis ball and a feather from 3 m, with air. The ball drops in under a second. The feather drifts and takes about 5 seconds.',
      why: 'Air pushes up on anything moving down through it, harder the faster it goes. A feather is so light and spread out that the air’s push almost matches its weight right away, so it barely speeds up. The heavy, compact ball hardly notices the air on a short drop.',
      overlay(sim,ctx,LH,k){const B=sim.st.B;if(!B.rest){const yb=ffY(sim,B.y,'feather');ffArrow(ctx,FF.XB+30,yb,40,'#c8102e');ffArrow(ctx,FF.XB+44,yb,-38,'#1b6fb3');tag(ctx,'air pushes up',FF.XB+110,yb-24,k,{s:12,c:'#1b6fb3'});tag(ctx,'gravity pulls down',FF.XB+118,yb+30,k,{s:12,c:'#c8102e'});}} },
    { key: 'moon', title: 'On the Moon', set: { objA: 'bowling', objB: 'feather', air: true, planet: 'moon', h: 3 }, fresh: true, speed: 1,
      see: 'Same drop on the Moon. The feather falls straight down beside the bowling ball, and they land together. Everything falls more slowly here, because the Moon’s gravity is only 1.62 m/s².',
      why: 'The Moon has no air, so nothing pushes back on the feather. Only gravity acts, and it gives every object the same acceleration.',
      overlay(sim,ctx,LH,k){ffCard(ctx,k,[['Apollo 15, 1971',700],['David Scott dropped a hammer and'],['a falcon feather on the Moon.'],['They landed at the same time.']],340);} },
    { key: 'throw', title: 'Throw it up', set: { v0: 10 }, fresh: true, speed: 0.5,
      see: 'Both balls are thrown straight up at 10 m/s. The label shows the bowling ball’s velocity: it slows down, stops for an instant at the top, then speeds up on the way down. The red arrow is its acceleration.',
      why: 'Gravity never switches off, so the acceleration is 9.8 m/s² <b>downward</b> the whole time, on the way up, at the top and on the way down. At the top the velocity is zero for an instant, but the acceleration isn’t: that is what turns it around.',
      overlay(sim,ctx,LH,k){const A=sim.st.A;if(A.rest)return;const y=ffY(sim,A.y,'bowling');ffArrow(ctx,FF.XA-34,y-10,46,'#c8102e');tag(ctx,'a = 9.8 m/s² down',FF.XA-108,y+8,k,{s:12,c:'#c8102e'});
        const v=A.v;tag(ctx,(Math.abs(v)<0.6?'v = 0 at the top!':'v = '+(v>0?'+':'−')+Math.abs(v).toFixed(1)+' m/s '+(v>0?'↑ up':'↓ down')),FF.XA+108,y-6,k,{s:13,hi:Math.abs(v)<0.6});} },
    { lvl: 'honors', key: 'bounce', title: 'Each bounce is lower', set: { objA: 'tennis', objB: 'bowling', bounce: true, e: 0.8, h: 5 }, fresh: true, speed: 1,
      see: 'A tennis ball dropped from 5 m on a bouncy floor. The dashed lines mark how high each bounce gets.',
      why: 'Each rebound leaves at 80% of the speed it hit with (e = 0.8). The height a ball reaches depends on speed squared, so each peak is 0.8 × 0.8 = 0.64 of the one before. The lost energy goes into sound and heat in the ball.',
      overlay(sim,ctx,LH,k){const P=sim.st.A.peaks;let prev=5;P.slice(0,4).forEach((h,i)=>{const y=ffY(sim,h);ctx.save();ctx.setLineDash([5,4]);ctx.strokeStyle='#c8102e';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(FF.XA-40,y);ctx.lineTo(FF.XA+40,y);ctx.stroke();ctx.restore();
        tag(ctx,h.toFixed(2)+' m ('+(h/prev).toFixed(2)+'×)',FF.XA-110,y,k,{s:12,hi:i===0});prev=h;});} },
    { lvl: 'ap', key: 'terminal', title: 'Terminal speed', set: { objA: 'paper', objB: 'tennis', air: true, h: 50 }, fresh: true, speed: 1,
      see: 'Crumpled paper and a tennis ball from 50 m, with air. Watch the arrows on the paper: gravity (red) stays the same, while the air’s push (blue) grows until the two are equal.',
      why: 'Drag grows with speed squared, F = ½ρC<sub>d</sub>Av². When drag equals weight, the net force is zero, so the acceleration is zero and the speed stops growing. That top speed is <b>terminal speed</b>: about 5 m/s for this paper.',
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
      see: 'A cannonball leaves the ground at 18 m/s (about 40 mph), aimed 40° above level. Its path is a smooth curve. The person next to the cannon is 1.8 m tall and drawn to the same scale as the ruler, so the ball flies about 33 m, about a third of a football field.',
      why: 'Once the ball leaves the cannon, the only force on it (ignoring air) is gravity, pulling straight down. Nothing pushes it forward any more, and nothing holds it up. The ball itself is drawn bigger than scale so you can see it; a real cannonball is 18 cm across.',
      overlay(sim,ctx,LH,k){pjPerson(ctx,sim,-1.6);tag(ctx,'18 m/s at 40°',pjX(sim,0)+40,pjY(sim,0)-60,k,{s:12.5,hi:true});tag(ctx,'1.8 m person, to scale',pjX(sim,-1.6)+18,pjY(sim,1.8)-60,k,{s:12});} },
    { key: 'dots', title: 'Steady sideways', speed: 0.35,
      see: 'A dot marks the ball every 0.25 s. The red ticks on the ground under each dot are evenly spaced: the ball moves the same distance sideways in every 0.25 s.',
      why: 'Gravity pulls down, not sideways, so nothing changes the ball’s forward speed. At 18 m/s and 40°, the forward part of the velocity is 18 × cos 40° ≈ 13.8 m/s, so every 0.25 s the ball moves about 3.4 m to the right.',
      overlay(sim,ctx,LH,k){const s=pjS(sim);if(!s)return;ctx.save();ctx.strokeStyle='#c8102e';ctx.lineWidth=2.5;s.dots.forEach(d=>{const x=pjX(sim,d.x);ctx.beginPath();ctx.moveTo(x,PJGY-12);ctx.lineTo(x,PJGY+4);ctx.stroke();ctx.setLineDash([3,4]);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,pjY(sim,d.y));ctx.lineTo(x,PJGY-12);ctx.stroke();ctx.setLineDash([]);ctx.lineWidth=2.5;});ctx.restore();
        tag(ctx,'same step sideways every 0.25 s: 13.8 m/s × 0.25 s ≈ 3.4 m',400,PJGY-30,k,{s:12.5,hi:true});} },
    { key: 'vert', title: 'Falling up and down', speed: 0.35,
      see: 'Now the same dots are slid onto the left edge, keeping only their height. Going up, they get closer together; near the top they bunch up; coming down they spread out again.',
      why: 'Up and down, the ball behaves exactly like a ball thrown straight up: gravity slows it by 9.8 m/s every second on the way up, and speeds it up by the same amount on the way down. The up-and-down part starts at 18 × sin 40° ≈ 11.6 m/s, which runs out after about 1.2 s.',
      overlay(sim,ctx,LH,k){const s=pjS(sim);if(!s)return;const x=Math.max(24,pjX(sim,0)-60);ctx.save();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,PJGY);ctx.lineTo(x,40);ctx.stroke();
        s.dots.forEach(d=>{const y=pjY(sim,d.y);ctx.fillStyle='#c8102e';ctx.beginPath();ctx.arc(x,y,5,0,6.29);ctx.fill();ctx.strokeStyle='rgba(200,16,46,0.35)';ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(pjX(sim,d.x),y);ctx.stroke();ctx.setLineDash([]);});ctx.restore();
        tag(ctx,'heights only: bunched near the top',x+120,52,k,{s:12.5,hi:true});} },
    { key: 'arrows', title: 'Velocity arrows', set: { vecs: true }, speed: 0.35, run(sim){pjClear(sim);pjAct(sim,'fire');},
      see: 'Arrows now show the velocity at each dot. They tilt up at the start, lie flat at the top and tilt down at the end, and they are shortest at the top.',
      why: 'Each arrow combines the steady forward part with the changing up-and-down part. The up-and-down part shrinks to zero at the top and grows again on the way down, so the arrow tips over, while its forward reach never changes.',
      overlay(sim,ctx,LH,k){tag(ctx,'velocity arrows: forward part constant, up/down part changing',400,30,k,{s:12.5,hi:true});} },
    { key: 'top', title: 'At the top it is still moving', set: { vecs: true }, speed: 0.35, run(sim){pjClear(sim);pjAct(sim,'fire');},
      see: 'The red ring marks the highest point. The card shows the ball’s velocity there: zero up-and-down, but still 13.8 m/s forward.',
      why: 'A common mistake is to think the ball stops at the top. It only stops going <b>up</b>. Its forward speed is the same as at launch, so at the top its speed is 13.8 m/s, the slowest point of the whole flight but not zero.',
      overlay(sim,ctx,LH,k,tau){const s=pjS(sim);if(!s)return;if(s.tPeak!==null&&s.tPeak>0&&(s.done||s.vy<=0)){const a=0.5+0.5*Math.sin(tau*4);ctx.save();ctx.strokeStyle='#c8102e';ctx.lineWidth=3;ctx.globalAlpha=0.55+0.45*a;ctx.beginPath();ctx.arc(pjX(sim,s.peakX),pjY(sim,s.peakY),16,0,6.29);ctx.stroke();ctx.restore();}
        const vx=18*Math.cos(pjDeg(40));pjCard(ctx,k,[['At the top',700,13],'up-and-down: 0 m/s','forward: '+vx.toFixed(1)+' m/s',['speed: '+vx.toFixed(1)+' m/s, not zero',800,13,'#c8102e']]);} },
    { key: 'twin', title: 'Thrown sideways vs dropped', base: { mode: 'free', ang: 0, v0: 12, h0: 10, obj: 'cannon', twin: true, strobe: '0.25', vecs: false, air: false }, fresh: true, speed: 0.3,
      see: 'From 10 m up, one ball is fired straight sideways at 12 m/s while a twin is dropped at the same instant. The dashed lines join the two at each tick: they are always at the same height, and they hit the ground together after 1.43 s.',
      why: 'Firing a ball sideways gives it no up-and-down speed at all, so it falls exactly like the dropped one: 10 m takes 1.43 s either way. The sideways speed only decides <b>where</b> it lands (12 × 1.43 ≈ 17 m out), not <b>when</b>.',
      overlay(sim,ctx,LH,k){const s=pjS(sim);if(!s)return;ctx.save();ctx.strokeStyle='#c8102e';ctx.lineWidth=1.5;ctx.setLineDash([5,4]);s.dots.forEach(d=>{const y=pjY(sim,d.y);ctx.beginPath();ctx.moveTo(pjX(sim,0),y);ctx.lineTo(pjX(sim,d.x),y);ctx.stroke();});ctx.restore();
        tag(ctx,'same height at every tick',pjX(sim,8),pjY(sim,10)-20,k,{s:12.5,hi:true});} },
    { key: 'fan', title: 'Which angle goes farthest?', base: { mode: 'free', ang: 40, v0: 18, h0: 0, obj: 'cannon', twin: false, strobe: '0.25', vecs: false, air: false }, fresh: true, speed: 1, run(sim){pjClear(sim);pjAct(sim,'fan');},
      see: 'Eleven balls leave at the same 18 m/s, at angles from 20° to 70°. The 45° shot lands farthest, about 33 m. The 30° and 60° shots land in the same place, about 28.6 m, but the 60° one is in the air much longer.',
      why: 'A low shot moves forward fast but falls back down quickly. A high shot stays up a long time but barely moves forward. On level ground with no air, 45° is the best balance between the two. Pairs that add to 90° (30° and 60°, 20° and 70°) land in the same spot.',
      overlay(sim,ctx,LH,k){const R=a=>18*18*Math.sin(2*pjDeg(a))/9.8;tag(ctx,'45°: '+R(45).toFixed(1)+' m',pjX(sim,R(45)),PJGY-26,k,{s:12.5,hi:true});tag(ctx,'30° and 60°: '+R(30).toFixed(1)+' m',pjX(sim,R(30))-70,PJGY-62,k,{s:12});} },
    { lvl: 'honors', key: 'range', title: 'The range equation', base: { mode: 'free', ang: 40, v0: 18, h0: 0, obj: 'cannon', twin: false, strobe: '0.25', vecs: false, air: false }, fresh: true, speed: 0.6, run(sim){pjClear(sim);pjAct(sim,'fire');},
      see: 'One 40° shot again. The card works out its landing distance with R = v²sin2θ/g, and the ruler and the distance readout show the same answer when it lands.',
      why: 'Time in the air comes from the vertical part: t = 2v sinθ / g. Distance is the horizontal part times that time: R = v cosθ × 2v sinθ / g = v² sin 2θ / g. It only works when the ball lands at the height it left from, with no air.',
      overlay(sim,ctx,LH,k){const s=pjS(sim),R=18*18*Math.sin(2*pjDeg(40))/9.8;pjCard(ctx,k,[['R = v² sin 2θ ÷ g',700,13],'= 18² × sin 80° ÷ 9.8',['= '+R.toFixed(1)+' m',800,14,'#c8102e'],[s&&s.done?'landed at '+s.x.toFixed(1)+' m':'in flight…',600,12,PAL['cv-soft']]]);} },
    { lvl: 'ap', key: 'air', title: 'Add air resistance', base: { mode: 'free', ang: 35, v0: 35, h0: 0, obj: 'baseball', twin: false, strobe: '0.25', vecs: false, air: false }, fresh: true, speed: 1,
      run(sim){pjClear(sim);BioLab.setValues(sim,{air:false});pjAct(sim,'fire');BioLab.setValues(sim,{air:true});pjAct(sim,'fire');},
      see: 'Two baseballs leave at 35 m/s (78 mph) and 35°: one with no air, one through real air. The path through air is lower, shorter and lopsided, falling more steeply at the end.',
      why: 'Drag pushes against the velocity and grows with speed squared, so it robs the ball of forward speed the whole way. The no-air ball would go about 117 m. Because drag hurts high, long flights most, the best angle with air is below 45°.',
      overlay(sim,ctx,LH,k){const s=pjS(sim),R=35*35*Math.sin(2*pjDeg(35))/9.8;pjCard(ctx,k,[['Baseball, 35 m/s at 35°',700,13],'no air: '+R.toFixed(0)+' m',['with air: '+(s&&s.done?s.x.toFixed(0)+' m':'in flight…'),800,13,'#c8102e']]);} }
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
      see: 'A 50 kg crate (about 110 lb) sits on a wood floor. The box on the right is a free-body diagram: gravity pulls down with 490 N and the floor pushes up with 490 N. The net force at the bottom is 0, balanced.',
      why: 'A force is a push or a pull, measured in newtons (N). Gravity on 50 kg is 50 × 9.8 = 490 N. The floor pushes back up just as hard, so the up and down forces cancel and the crate stays put.',
      overlay(sim,ctx,LH,k){tag(ctx,'arrows = forces on the crate',671,248,k,{s:12.5,hi:true});tag(ctx,'50 kg, about 110 lb',330,110,k,{s:12.5});} },
    { key: 'static', title: 'A gentle push: nothing moves', set: { applied: 100 }, speed: 0.5,
      see: 'A person pushes right with 100 N. The crate does not move. A friction arrow appears on the floor pointing left, and the card shows it is exactly 100 N.',
      why: '<b>Static friction</b> pushes back against your push, as hard as needed to stop the crate sliding, up to a limit. Here 100 N right and 100 N left cancel, so the net force is 0 and the crate stays at rest.',
      overlay(sim,ctx,LH,k){const f=foM(sim,'fric');foCard(ctx,k,[['Push: 100 N →',700],['Static friction: '+Math.abs(f).toFixed(0)+' N ←',700,12.5,PAL['s4']],'Net force: 0 N','So the crate stays still']);} },
    { key: 'slide', title: 'Push harder: it breaks free', set: { applied: 250 }, speed: 0.5,
      see: 'The push goes up to 250 N. The crate starts sliding to the right and speeds up. The friction arrow shrinks to 147 N, and the card works out the net force and the acceleration.',
      why: 'Static friction on wood can only reach 0.40 × 490 = 196 N. A 250 N push beats that, so the crate breaks free. Once it slides, friction drops to the smaller <b>kinetic</b> value, 0.30 × 490 = 147 N. The extra 103 N makes it speed up: a = F ÷ m = 103 ÷ 50 ≈ 2.1 m/s².',
      overlay(sim,ctx,LH,k){foCard(ctx,k,['Max static: 0.40 × 490 = 196 N','Sliding friction: 0.30 × 490 = 147 N','Net: 250 − 147 = 103 N →',['a = 103 ÷ 50 = '+fo1(foM(sim,'acc'))+' m/s²',800,12.5,'#c8102e']]);} },
    { key: 'steady', title: 'Balanced forces, steady speed', set: { applied: 147 }, speed: 0.5,
      see: 'The push drops to 147 N, exactly the sliding friction. The crate keeps sliding, and the card shows its speed holding steady.',
      why: 'Net force 0 does <b>not</b> mean stopped. It means no <b>change</b> in motion. A moving object with balanced forces keeps the same speed in the same direction. That is Newton’s first law.',
      overlay(sim,ctx,LH,k){foCard(ctx,k,['Push 147 N →, friction 147 N ←',['Net force: 0 N',700],['Speed: '+foM(sim,'vel').toFixed(2)+' m/s, not changing',800,12.5,'#c8102e']]);} },
    { key: 'letgo', title: 'Let go', set: { applied: 0 }, speed: 0.5,
      see: 'The person lets go. Now only friction acts sideways, pointing backward. The crate slows down and stops, and the friction arrow disappears when it does.',
      why: 'With no push, the 147 N of friction is the net force, backward: a = −147 ÷ 50 ≈ −2.9 m/s². Without friction, on a perfectly slick floor, the crate would slide on forever. Friction, not “running out of force,” is what stops things.',
      overlay(sim,ctx,LH,k){const v=foM(sim,'vel');foCard(ctx,k,[['Only friction: 147 N ←',700],'a = −147 ÷ 50 ≈ −2.9 m/s²',['Speed: '+v.toFixed(2)+' m/s'+(Math.abs(v)<0.005?', stopped':''),800,12.5,'#c8102e']]);} },
    { key: 'ice', title: 'The same push on ice', base: FOPUSH, set: { surface: 'ice', applied: 100 }, fresh: true, speed: 0.5,
      see: 'Same 50 kg crate and the same gentle 100 N push, but the floor is now ice. This time the crate slides away and speeds up.',
      why: 'On ice, static friction can only reach 0.10 × 490 = 49 N, less than the push, and sliding friction is just 0.05 × 490 ≈ 25 N. The net force is about 75 N, so a ≈ 1.5 m/s². Low friction is why cars take so much longer to stop on ice.',
      overlay(sim,ctx,LH,k){foCard(ctx,k,['Max static on ice: 0.10 × 490 = 49 N','Sliding friction: 0.05 × 490 ≈ 25 N','Net: 100 − 25 ≈ 75 N →',['a ≈ 75 ÷ 50 = '+fo1(foM(sim,'acc'))+' m/s²',800,12.5,'#c8102e']]);} },
    { key: 'fan', title: 'A fan cart: a = F ÷ m', base: { mode: 'fan', fans: 2, cartmass: 0, strobe: true }, fresh: true, speed: 0.4,
      see: 'A 0.50 kg cart on a low-friction track with 2 fans pushing it, 0.40 N each. The strobe images get farther apart as the cart speeds up, and a photogate times it.',
      why: 'With almost no friction, the fans’ 0.80 N is the net force. Newton’s second law: a = F ÷ m = 0.80 ÷ 0.50 = 1.6 m/s². The cart gains 1.6 m/s of speed every second.',
      overlay(sim,ctx,LH,k){foCard(ctx,k,['Force: 2 × 0.40 = 0.80 N','Mass: 0.50 kg',['a = 0.80 ÷ 0.50 = 1.6 m/s²',800,12.5,'#c8102e']]);} },
    { key: 'heavier', title: 'Double the mass', base: { mode: 'fan', fans: 2, cartmass: 0.5, strobe: true }, fresh: true, speed: 0.4,
      see: 'Same two fans, but 0.50 kg is added, so the cart is now 1.00 kg. The strobe images are closer together, and the cart takes longer to reach the photogate.',
      why: 'Same force, twice the mass, half the acceleration: a = 0.80 ÷ 1.00 = 0.80 m/s². Mass is how much an object resists changes in its motion.',
      overlay(sim,ctx,LH,k){foCard(ctx,k,['Force: 0.80 N (same)','Mass: 1.00 kg (doubled)',['a = 0.80 ÷ 1.00 = 0.80 m/s²',800,12.5,'#c8102e'],'Half the acceleration']);} },
    { lvl: 'honors', key: 'third', title: 'Equal and opposite, on different objects', base: FOPUSH, set: { applied: 200 }, fresh: true, speed: 0.5,
      see: 'The person pushes the crate with 200 N. Arrow A is the hands pushing the crate; arrow B is the crate pushing back on the hands, also 200 N.',
      why: 'Newton’s third law: forces come in pairs, equal in size and opposite in direction. They never cancel each other, because they act on <b>different</b> objects. Only A is on the crate’s free-body diagram, and the crate breaks free because 200 N beats the 196 N static limit.',
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
      see: 'The hand pulls harder and harder. The scale climbs, but the block sits still. On the force diagram, a friction arrow grows to match the pull exactly.',
      why: '<b>Static friction</b> is the grip between two surfaces that are not sliding. It pushes back exactly as hard as you pull, so the forces balance and nothing moves. But it can only grow so far.',
      overlay(sim,ctx,LH,k){const s=sim.st,F=s.phase==='ramp'?s.F:(Number.isFinite(s.peak)?s.peak:0);frCard(ctx,k,[['Pull: '+frN(F)+' →',700],['Static friction: '+frN(F)+' ←',700,12.5,PAL['s4']],s.phase==='ramp'||s.phase==='wait'?'Net force 0, so it stays still':['It broke free!',800,12.5,'#c8102e']]);} },
    { key: 'peak', title: 'It breaks free, then the pull drops', base: FRB, fresh: true, speed: 0.6,
      run(sim){frG(sim,'force');},
      see: 'Watch the scale and the graph below. The pull rises to a peak near 2.2 N, the block jumps forward, and the reading drops to a steady 1.5 N while it slides.',
      why: 'At the peak, static friction has hit its limit. Once the block slides, the bumps on the two surfaces don’t have time to settle into each other, so <b>kinetic friction</b> (sliding friction) is smaller. That’s why the first tug on anything heavy is the hardest.',
      overlay(sim,ctx,LH,k){const s=sim.st;frCard(ctx,k,[['To get it started: '+frN(s.peak),700],['To keep it moving: '+frN(s.kin),700,12.5,PAL['s4']],'Block: '+frPull(sim)]);} },
    { key: 'mass', title: 'Stack 1.0 kg on top', base: FRB, set: { added: 1 }, fresh: true, speed: 0.7,
      run(sim){frG(sim,'force');},
      see: 'Now 1.0 kg of masses sit on the block, 1.50 kg in all. The table pushes up three times as hard, and the scale reads about 4.4 N while it slides, three times as much. Look in the microscope box: the bumps are pressed together harder.',
      why: 'Friction depends on how hard the surfaces press together, the <b>normal force</b>. On a level table that is the weight: 4.9 N alone, 14.7 N stacked. Three times the press, three times the friction: 1.5 N becomes 4.4 N, and the starting peak goes from 2.2 N to about 6.6 N.',
      overlay(sim,ctx,LH,k){const s=sim.st;frCard(ctx,k,[['Table pushes up: 4.9 N → 14.7 N',700],'That is 3 times as hard',['Keep it moving: 1.5 N → '+frN(s.kin),700,12.5,PAL['s4']],'Get it started: 2.2 N → '+frN(s.peak)]);} },
    { key: 'sand', title: 'A grippy surface: sandpaper', base: FRB, set: { surface: 'sandpaper' }, fresh: true, speed: 0.7,
      run(sim){frG(sim,'force');},
      see: 'The same 0.50 kg block on sandpaper. The microscope shows big, sharp bumps, and the scale reads about 3.2 N while it slides, more than twice the 1.5 N on wood.',
      why: 'The surfaces themselves set how grippy they are. Sandpaper’s bumps catch and dig into the wood, so the same press gives much more friction.',
      overlay(sim,ctx,LH,k){const s=sim.st;frCard(ctx,k,[['Sandpaper, same 0.50 kg block',700],['Keep it moving: '+frN(s.kin),700,12.5,PAL['s4']],'Wood was 1.5 N']);} },
    { key: 'ice', title: 'A slippery surface: ice', base: FRB, set: { surface: 'ice' }, fresh: true, speed: 0.7,
      run(sim){frG(sim,'force');},
      see: 'Now the table is ice. The bumps in the microscope are tiny, the pull never gets past about half a newton, and the block slides with only about 0.25 N.',
      why: 'Ice is smooth and has a thin wet layer on top, so it barely grips. The most static friction it can give here is about 0.5 N, less than a quarter of wood’s 2.2 N. Anything that needs more sideways push than that, like a long stride, slips.',
      overlay(sim,ctx,LH,k){const s=sim.st;frCard(ctx,k,[['Ice, same 0.50 kg block',700],'Get it started: '+frN(s.peak)+' (wood: 2.2 N)',['Keep it moving: '+frN(s.kin)+' (wood: 1.5 N)',700,12.5,PAL['s4']]]);} },
    { lvl: 'honors', key: 'area', title: 'Does contact area matter?', base: FRB, set: { face: 'narrow' }, fresh: true, speed: 0.7,
      run(sim){frG(sim,'force');},
      see: 'The block is flipped onto its narrow face, so much less of it touches the table. The sliding reading stays about 1.5 N, the same as the wide face.',
      why: 'Less area touches, but each square centimeter presses down harder, because the same weight is spread over less area. The two effects nearly cancel, so friction depends on the normal force and the surfaces, not on the area. (Here it changed about 2 %, within the scale’s noise.)',
      overlay(sim,ctx,LH,k){const s=sim.st;frCard(ctx,k,[['Narrow face, same 0.50 kg',700],['Keep it moving: '+frN(s.kin),700,12.5,PAL['s4']],'Wide face was 1.47 N']);} },
    { lvl: 'honors', key: 'mu', title: 'μ = friction ÷ normal force', base: FRB, set: { surface: 'rubber', added: 1 }, fresh: true, speed: 0.7,
      run(sim){frG(sim,'force');},
      see: 'A 1.50 kg stack on a rubber mat. The card divides the sliding friction by the normal force to get the coefficient of kinetic friction.',
      why: 'Friction is proportional to the normal force, f = μN, where <b>μ</b> (mu) depends only on the two surfaces. Rubber’s μk is about 0.80, wood’s 0.30, ice’s 0.05. μ has no units: it is newtons divided by newtons. On wood, 1.47 ÷ 4.9 and 4.41 ÷ 14.7 both give 0.30, so adding mass does not change μ.',
      overlay(sim,ctx,LH,k){const s=sim.st;frCard(ctx,k,['N = 1.50 × 9.8 = 14.7 N',['Sliding friction: '+frN(s.kin),700,12.5,PAL['s4']],['μk = '+(Number.isFinite(s.kin)?(s.kin/14.7).toFixed(2):'…')+' (rubber ≈ 0.80)',800,12.5,'#c8102e']]);} },
    { lvl: 'ap', key: 'slope', title: 'μk from the slope of a graph', base: FRB, set: { added: 2 }, fresh: true, speed: 0.8,
      run(sim){sim.fit=[];const again=sim.def.actions.find(a=>a.id==='again');
        for(const m of [0,0.5,1,1.5]){BioLab.setValues(sim,{added:m});again.run(sim);for(let i=0;i<6000&&sim.st.phase!=='done';i++)sim.def.step(sim,0.005);}
        BioLab.setValues(sim,{added:2});again.run(sim);frG(sim,'fit');},
      see: 'Four pulls on wood, with 0, 0.5, 1.0 and 1.5 kg added, are already on the “Kinetic friction vs. normal force” graph below. The 2.0 kg pull is running now and adds the fifth point when it finishes.',
      why: 'Since f_k = μk·N, the points fall on a straight line through the origin, and the slope is μk. A best-fit line through five trials averages out the scale’s random noise, so it gives a better μk than any single pull.',
      overlay(sim,ctx,LH,k){const m=foM(sim,'slope');frCard(ctx,k,[['f_k = μk · N: a line through 0',700],'Points so far: '+(sim.fit||[]).length,['Slope = μk ≈ '+(Number.isFinite(m)?m.toFixed(3):'…'),800,12.5,'#c8102e']]);} },
    { lvl: 'ap', key: 'stop', title: 'Check it: slide to a stop', base: { method: 'slide', surface: 'wood', added: 0, v0: 2 }, fresh: true, speed: 0.5,
      run(sim){frG(sim,'vel');},
      see: 'Now the block is launched at 2.0 m/s and coasts to a stop. The speed graph is a straight line down, and the block stops about 0.68 m away.',
      why: 'Friction is the only sideways force, so a = μk·g, the same for any mass. From v² = v₀² − 2ad, the stopping distance is d = v₀² ÷ (2μk g) = 4 ÷ 5.88 = 0.68 m. Working backward from a measured d gives μk, a second, independent check on the slope.',
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
      see: 'The 5 kg block sits on the ramp tilted 20°. In the force box, gravity (49 N) points straight down, and two dashed arrows show its parts: one down the ramp and one pressing into it.',
      why: 'On a slope, only part of your weight pulls you downhill; the rest presses you into the surface. At 20° the downhill part is about 17 N and the part into the ramp is about 46 N. Friction pushes up the ramp with exactly 17 N, so the block holds.',
      overlay(sim,ctx,LH,k){inCard(ctx,k,['Weight: 49 N, straight down',['Down the ramp: '+in1(foM(sim,'par'))+' N',700],'Into the ramp: '+in1(foM(sim,'normal'))+' N',['Friction holds it: '+in1(foM(sim,'fric'))+' N',700,12.5,PAL['s4']]]);} },
    { key: 'edge', title: 'Tilt to 24°: it barely holds', base: INB, set: { angle: 24 }, fresh: true, speed: 0.6,
      see: 'The ramp tilts up to 24°. The downhill arrow grows, the into-the-ramp arrow shrinks, and the block still sits still, just barely.',
      why: 'A steeper slope makes the downhill part bigger (now about 19.9 N) and the press into the ramp smaller. Less press means less grip: the most the wood can hold is now about 20.1 N. The downhill pull is right at the limit.',
      overlay(sim,ctx,LH,k){inCard(ctx,k,[['Down the ramp: '+in1(foM(sim,'par'))+' N',700],['Most grip the wood can give: '+in1(inGrip(sim,0.45))+' N',700,12.5,PAL['s4']],'Still holding, just barely']);} },
    { key: 'slip', title: 'Tilt to 25°: it slides', base: INB, set: { angle: 25 }, fresh: true, speed: 0.6,
      see: 'One more degree. Now the block slides down the ramp, and the strobe images spread out as it speeds up.',
      why: 'At 25° the downhill pull, about 20.7 N, is more than the 20.0 N of grip the wood can give. Once it slides, sliding friction is even smaller, so the block speeds up at about 1.5 m/s². This is the answer to the question: the 5 kg box holds up to 24° and slides at 25°.',
      overlay(sim,ctx,LH,k){inCard(ctx,k,[['Down the ramp: '+in1(foM(sim,'par'))+' N',700],['Most grip: '+in1(inGrip(sim,0.45))+' N, not enough',700,12.5,PAL['s4']],['It slides: a = '+foM(sim,'acc').toFixed(2)+' m/s²',800,12.5,'#c8102e']]);} },
    { key: 'heavy', title: 'An 18 kg box at the same angle', base: INB, set: { angle: 25, mass: 18 }, fresh: true, speed: 0.6,
      see: 'Same ramp, same 25°, but the block is 18 kg, 3.6 times as heavy. The force box keeps the same shape, because every force grew by the same factor, and the block slides with the same acceleration and the same time to the bottom.',
      why: 'More weight means a bigger downhill pull, but it also presses into the ramp harder, so the grip grows by the same factor. The downhill pull and the grip go up together, so the heavy box slips at exactly the same angle. Weight doesn’t decide when things slide; the angle and the surfaces do.',
      overlay(sim,ctx,LH,k){inCard(ctx,k,[['Down the ramp: 20.7 → '+in1(foM(sim,'par'))+' N',700],['Most grip: 20.0 → '+in1(inGrip(sim,0.45))+' N',700,12.5,PAL['s4']],'Both grew 3.6 times',['Same a = '+foM(sim,'acc').toFixed(2)+' m/s²',800,12.5,'#c8102e']]);} },
    { key: 'steep', title: 'Steeper still: 40°', base: INB, set: { angle: 40 }, fresh: true, speed: 0.6,
      see: 'The 5 kg block on a 40° ramp. The downhill arrow is now almost as long as the into-the-ramp arrow, and the block races down in about half the time.',
      why: 'At 40°, about 31.5 N pulls downhill and only 37.5 N presses into the ramp, so the grip is weak and the downhill pull wins by a lot: a ≈ 4.1 m/s². Most avalanches release on slopes of 30° to 45° for the same reason: the downhill pull on the snow beats its grip.',
      overlay(sim,ctx,LH,k){inCard(ctx,k,[['Down the ramp: '+in1(foM(sim,'par'))+' N (17 at 20°)',700],'Into the ramp: '+in1(foM(sim,'normal'))+' N (46 at 20°)',['a = '+foM(sim,'acc').toFixed(2)+' m/s²',800,12.5,'#c8102e']]);} },
    { key: 'nofric', title: 'Take away friction', base: INB, set: { angle: 40, surface: 'none' }, fresh: true, speed: 0.6,
      see: 'Same 40° ramp with no friction at all. The friction arrow is gone and the block reaches the bottom faster still; the strobe images spread out more.',
      why: 'With no friction, the whole downhill part of gravity speeds the block up: a = 9.8 × sin 40° ≈ 6.3 m/s². A steeper ramp gets closer to free fall (9.8 m/s² at 90°); a flat one gives 0.',
      overlay(sim,ctx,LH,k){inCard(ctx,k,['No friction: only the downhill pull',['a = 9.8 × sin 40° = '+foM(sim,'acc').toFixed(2)+' m/s²',800,12.5,'#c8102e'],'With wood it was 4.05 m/s²']);} },
    { lvl: 'honors', key: 'repose', title: 'Angle of repose: μs = tanθ', base: INB, set: { surface: 'ice', angle: 6 }, fresh: true, speed: 0.6,
      see: 'An icy ramp at just 6°. Even this gentle slope is enough: the block slides.',
      why: 'Right at the slipping angle, mg sinθ = μs·mg cosθ, so <b>μs = tanθ</b> and the mass cancels. Ice has μs ≈ 0.10, so it slips above tan⁻¹(0.10) = 5.7°. Wood (0.45) holds to 24.2°, rubber (1.0) to 45°. Tilting until something slips is a quick way to measure μs.',
      overlay(sim,ctx,LH,k){inCard(ctx,k,['Slips when tanθ > μs',['Ice: tan⁻¹(0.10) = 5.7°, so 6° slides',700,12.5,PAL['s4']],'Wood: 24.2°   Rubber: 45°',['a = '+foM(sim,'acc').toFixed(2)+' m/s²',800,12.5,'#c8102e']]);} },
    { lvl: 'honors', key: 'pull', title: 'Pull it up the ramp', base: INB, set: { push: 50 }, fresh: true, speed: 0.35,
      run(sim){sim.st.s=2.4;sim.st.inTop=0;},
      see: 'Back to wood at 20°, with a rope pulling the block up the ramp with 50 N. The block speeds up the slope, and now friction points down the ramp.',
      why: 'Friction always opposes the sliding. Going up, both the downhill part of gravity (16.8 N) and sliding friction (0.30 × 46 = 13.8 N) point down the ramp. Net force = 50 − 16.8 − 13.8 ≈ 19.4 N up, so a = 19.4 ÷ 5 ≈ 3.9 m/s² up the slope.',
      overlay(sim,ctx,LH,k){const st=sim.st,now=performance.now();if(st.stuckTop){if(!st.inTop)st.inTop=now;else if(now-st.inTop>1500){st.s=2.4;st.v=0;st.strobe=[];st.rt=0;st.moved=false;st.inTop=0;}}else st.inTop=0;
        inCard(ctx,k,['Pull up the ramp: 50 N',['Down the ramp: gravity 16.8 N',700,12.5,PAL['s2']],['+ sliding friction 13.8 N',700,12.5,PAL['s4']],['Net ≈ 19.4 N up, a ≈ 3.9 m/s² up',800,12.5,'#c8102e']]);} },
    { lvl: 'ap', key: 'rope', title: 'A rope at an angle lifts some of the load', base: { angle: 30, mass: 10, surface: 'rubber', push: 50, phi: 0, strobe: true }, set: { phi: 30 }, fresh: true, speed: 0.6,
      see: 'A 10 kg block on a 30° rubber ramp, held by a 50 N rope. The rope is tilted 30° above the ramp, and the normal-force arrow is shorter than mg cosθ.',
      why: 'With axes along and perpendicular to the ramp, the rope has two parts: F cosφ = 43.3 N up the ramp and F sinφ = 25 N away from it. Perpendicular: N = mg cosθ − F sinφ = 84.9 − 25 = 59.9 N. Along: mg sinθ = 49 N down, 43.3 N up, so static friction supplies 5.7 N up the ramp, well under μs·N = 59.9 N.',
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
      see: 'The boat points straight at the flag on the far bank, but the red dots, one per second, march diagonally. It lands about 20 m downstream after 13.3 s.',
      why: 'Two things move the boat at once: its own push through the water (blue, 3 m/s across) and the river carrying the water (teal, 1.5 m/s downstream). Draw them <b>tip to tail</b>: the red arrow from the start of the blue one to the tip of the teal one is how the boat really moves past the shore.',
      overlay(sim,ctx,LH,k){vcR(sim,ctx,k,[['Boat’s push: 3 m/s across',700,12.5,PAL['s2']],['Current: 1.5 m/s downstream',700,12.5,PAL['s6']],['Real path: the red arrow',700,12.5,PAL['s1']],vcTrip(sim)]);} },
    { key: 'faster', title: 'Double the current', base: VRIV, set: { cur: 3 }, fresh: true, speed: 2,
      see: 'Same boat, same aim, but the river now flows at 3 m/s. The path tilts much more, and the boat lands 40 m downstream. The time on the water is still 13.3 s.',
      why: 'The current only pushes sideways, so it changes where you land, not how fast you cross. Only the boat’s across part, 3 m/s, gets you to the far bank: 40 m ÷ 3 m/s = 13.3 s, whatever the current does.',
      overlay(sim,ctx,LH,k){vcR(sim,ctx,k,[['Current: 3 m/s (was 1.5)',700,12.5,PAL['s6']],'Across: still 3 m/s, so still 13.3 s',['Drift doubles: 20 m → 40 m',800,12.5,'#c8102e'],vcTrip(sim)]);} },
    { key: 'upstream', title: 'Aim 30° upstream', base: VRIV, set: { aim: 30 }, fresh: true, speed: 2,
      see: 'Back to the 1.5 m/s river, but now the boat points 30° upstream. It crabs across at an angle and lands right at the flag. The trip takes longer, about 15.4 s.',
      why: 'Pointing partly upstream splits the boat’s 3 m/s into two parts. Half of it, 1.5 m/s, pushes upstream and exactly cancels the current. The rest, about 2.6 m/s, carries it across, so the crossing is slower: 40 ÷ 2.6 ≈ 15.4 s. This answers the question: 20 m downstream pointing straight, or aim 30° upstream to land straight across.',
      overlay(sim,ctx,LH,k){vcR(sim,ctx,k,['Aim: 30° upstream',['Upstream part: 1.5 m/s, cancels the current',700,12.5,PAL['s2']],'Across part: about 2.6 m/s',['→ '+vcTrip(sim),800,12.5,'#c8102e']]);} },
    { key: 'plane', title: 'A plane in a crosswind', base: { mode: 'plane', as: 60, hdg: -30, ws: 30, wd: 90 }, fresh: true, speed: 1,
      see: 'Same idea in the air, seen on a map. A 30 m/s wind blows toward the east. The plane’s nose points 30° west of north, yet its path runs straight north to the city.',
      why: 'Pilots call this <b>crabbing</b>: pointing partly into the wind so the wind’s sideways push is cancelled. The nose and the path point different ways, just like the boat aimed upstream. Planes landing at Denver International on a gusty day do exactly this.',
      overlay(sim,ctx,LH,k){vcCard(ctx,k,[['Nose: 30° west of north',700,12.5,PAL['s2']],['Wind: 30 m/s toward the east',700,12.5,PAL['s6']],['Path: straight north to the city',800,12.5,'#c8102e']],80,16,280);} },
    { key: 'add', title: 'Adding any two arrows', base: { mode: 'add', am: 3, aa: 0, bm: 4, ba: 90, op: 'add', comps: false }, fresh: true, speed: 0.6,
      see: 'Arrow A is 3 m east; arrow B is 4 m north. B slides over so its tail sits on A’s tip. The red resultant from the start to the end is 5 m long, not 7 m.',
      why: 'Walk 3 blocks east and 4 blocks north and you end up 5 blocks away in a straight line. Arrows that point different ways partly “miss” each other, so they add up to less than their sizes added together. For a right angle, the Pythagorean theorem gives it: √(3² + 4²) = 5.',
      overlay(sim,ctx,LH,k){vcCard(ctx,k,[['3 m east + 4 m north',700],'Walked: 7 m',['Straight-line distance: √(3² + 4²) = 5 m',800,12.5,'#c8102e']],16,16,280);} },
    { lvl: 'honors', key: 'speed', title: 'Speed relative to the shore', base: VRIV, set: { bs: 4, cur: 3 }, fresh: true, speed: 2,
      see: 'A faster boat, 4 m/s, crosses a 3 m/s river pointing straight across. It moves past the shore at 5 m/s, faster than either speed alone, and crosses in 10 s with 30 m of drift.',
      why: 'Velocities add as vectors: <b>v</b>(boat, shore) = <b>v</b>(boat, water) + <b>v</b>(water, shore). They are at right angles, so |v| = √(4² + 3²) = 5 m/s. The time uses only the across part: t = 40 ÷ 4 = 10 s, and the drift is 3 m/s × 10 s = 30 m.',
      overlay(sim,ctx,LH,k){vcR(sim,ctx,k,['v = √(4² + 3²) = '+foM(sim,'gsr').toFixed(2)+' m/s','t = 40 m ÷ 4 m/s = 10 s','Drift = 3 m/s × 10 s = 30 m',['→ '+vcTrip(sim),800,12.5,'#c8102e']]);} },
    { lvl: 'honors', key: 'comps', title: 'Add with components', base: { mode: 'add', am: 5, aa: 30, bm: 4, ba: 120, op: 'add', comps: true }, fresh: true, speed: 0.6,
      see: 'A is 5 m at 30°, B is 4 m at 120°. The dashed lines split each into an x part and a y part, and the table at the top right adds them.',
      why: 'A_x = 5 cos 30° = 4.33, A_y = 5 sin 30° = 2.50. B_x = 4 cos 120° = −2.00, B_y = 4 sin 120° = 3.46. Add the x’s and the y’s: R = (2.33, 5.96). Then |R| = √(2.33² + 5.96²) = 6.40 m, at tan⁻¹(5.96 ÷ 2.33) = 69°.',
      overlay(sim,ctx,LH,k){vcCard(ctx,k,['R_x = 4.33 + (−2.00) = 2.33 m','R_y = 2.50 + 3.46 = 5.96 m',['|R| = '+foM(sim,'rmag').toFixed(2)+' m at '+foM(sim,'rang').toFixed(0)+'°',800,12.5,'#c8102e']],16,16,280);} },
    { lvl: 'ap', key: 'aim', title: 'The aim that cancels a current', base: VRIV, set: { bs: 4, cur: 2, aim: 30 }, fresh: true, speed: 2,
      see: 'A 4 m/s boat in a 2 m/s current, aimed 30° upstream. It lands with no drift after about 11.5 s.',
      why: 'Zero drift means v_b sin θ = v_c, so θ = sin⁻¹(v_c ÷ v_b) = sin⁻¹(2 ÷ 4) = 30°. The across component is v_b cos θ = 3.46 m/s, so t = 40 ÷ 3.46 = 11.5 s. If v_c > v_b, no aim can cancel the current, and the best you can do is limit the drift.',
      overlay(sim,ctx,LH,k){vcR(sim,ctx,k,['θ = sin⁻¹(2 ÷ 4) = 30°','v_across = 4 cos 30° = 3.46 m/s','t = 40 ÷ 3.46 = 11.5 s',['→ '+vcTrip(sim),800,12.5,'#c8102e']]);} },
    { lvl: 'ap', key: 'heading', title: 'Heading in a slanted wind', base: { mode: 'plane', as: 60, hdg: -21, ws: 30, wd: 45 }, fresh: true, speed: 1,
      see: 'Now the 30 m/s wind blows toward the northeast. The plane points 21° west of north and tracks almost due north, and its ground speed is faster than its airspeed.',
      why: 'Split the wind: 30 sin 45° = 21.2 m/s east and 21.2 m/s north. To cancel the east part, 60 sin h = 21.2, so h = sin⁻¹(0.354) ≈ 21° west of north. North speed = 60 cos 21° + 21.2 ≈ 77 m/s: the wind’s north part is a partial tailwind.',
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
      see: 'Zoomed in 12 times. The ball sits on top of a tower 400 km tall, as high as the space station flies, and then drops. The red arrow is gravity.',
      why: 'With no sideways speed, gravity pulls the ball straight toward Earth’s center. Up here gravity is still 8.7 m/s², 89% as strong as on the ground. Space is not “zero gravity”.',
      overlay(sim,ctx,LH,k){gvLoop(sim);const [tx,ty]=gvXY(sim,0,GV_R0),[gx,gy]=gvXY(sim,0,GV_RE);tag(ctx,'400 km tower',tx-80,(ty+gy)/2,k,{s:12});
        if(!sim.st.done){const [bx,by]=gvBall(sim);tag(ctx,'gravity: toward Earth’s center',bx,by-34,k,{s:12,c:'#c8102e'});}
        gvCard(ctx,k,[['Gravity 400 km up',700],['8.7 m/s², 89% of the 9.8 m/s²'],['you feel on the ground']]);} },
    { key: 'slow', title: 'Fire it sideways', set: { v0: 3, zoom: '4' }, fresh: true, speed: 0.25,
      see: 'Fired sideways at 3 km/s, about ten times as fast as a jet. The dashed line is the path it would take with no gravity. The red bracket shows how far gravity has pulled it below that line.',
      why: 'The ball does two things at once. It keeps moving sideways, and it falls, exactly as if it had been dropped. Falling bends the straight path into a curve that hits the ground.',
      overlay(sim,ctx,LH,k){gvLoop(sim);const s=sim.st,a=gvXY(sim,0,GV_R0),b=gvXY(sim,3.5e6,GV_R0);gvDash(ctx,[a,b],'#7fd6ff',2);tag(ctx,'with no gravity',Math.min(760,a[0]+150),a[1]-16,k,{s:12,c:'#1b6fb3'});
        if(s.x>2e4){const [bx,by]=gvBall(sim),[lx,ly]=gvXY(sim,s.x,GV_R0),f=(GV_R0-s.y)/1e3;if(by-ly>8){ctx.save();ctx.strokeStyle='#c8102e';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(bx-14,ly);ctx.lineTo(bx-14,by);ctx.moveTo(bx-20,ly);ctx.lineTo(bx-8,ly);ctx.moveTo(bx-20,by);ctx.lineTo(bx-8,by);ctx.stroke();ctx.restore();
          tag(ctx,'fallen '+gvKm(f)+' km',bx-90,(ly+by)/2,k,{s:12,hi:true});}}} },
    { key: 'curve', title: 'Faster: the ground curves away', set: { v0: 6.5 }, fresh: true, speed: 0.6,
      see: 'Back to the whole Earth, fired at 6.5 km/s. It lands much farther around the planet. The dashed line goes straight ahead from the tower; watch Earth’s surface drop away beneath it.',
      why: 'The ball falls just as before, but Earth is round. The farther sideways the ball gets, the more the ground has curved away below it, so it has farther to fall before it lands. Earth’s surface drops about 5 m below “straight ahead” for every 8 km you travel.',
      overlay(sim,ctx,LH,k){gvLoop(sim);const a=gvXY(sim,-4e6,GV_R0),b=gvXY(sim,9e6,GV_R0);gvDash(ctx,[a,b],'#7fd6ff',2);tag(ctx,'straight ahead',Math.min(700,b[0]-70),b[1]-16,k,{s:12,c:'#1b6fb3'});
        const g=gvXY(sim,GV_RE*Math.sin(0.9),GV_RE*Math.cos(0.9));tag(ctx,'the ground curves away',g[0]+90,g[1]+30,k,{s:12,hi:true});} },
    { key: 'orbit', title: 'Fast enough: it never lands', set: { v0: 7.7 }, fresh: true, speed: 0.6,
      see: 'At 7.7 km/s the ball goes all the way around and passes the tower again. The blue arrow, its motion, always points sideways. The red arrow, gravity, always points at Earth’s center.',
      why: 'The ball is still falling every moment. It is just moving sideways fast enough that the ground curves away exactly as fast as it falls. Falling around a planet forever is what an orbit is.',
      overlay(sim,ctx,LH,k){const s=sim.st,[bx,by]=gvBall(sim),r=Math.hypot(s.x,s.y),ux=s.x/r,uy=-s.y/r;tag(ctx,'falling',bx-ux*70,by-uy*70,k,{s:12,c:'#c8102e'});
        gvCard(ctx,k,[['7.7 km/s = about 17,000 mph',700],['One lap: about 92 minutes'],['Laps so far: '+s.orbits]]);} },
    { key: 'iss', title: 'Ride along: the space station', set: { v0: 7.7, zoom: '12' }, fresh: true, speed: 0.1,
      see: 'Zoomed in 12 times and slowed down, riding along with the ball. The ground slides past below, but the ball stays 400 km up the whole time.',
      why: 'This is the space station’s orbit. Astronauts float, not because gravity is gone (it is 89% as strong as on the ground) but because they and the station are falling together. Nothing presses them against the floor.',
      overlay(sim,ctx,LH,k){const [bx,by]=gvBall(sim),r=Math.hypot(sim.st.x,sim.st.y);tag(ctx,'still '+gvKm((r-GV_RE)/1e3)+' km up',bx,by-40,k,{s:12,hi:true});
        gvCard(ctx,k,[['The space station',700],['About 400 km up, 7.7 km/s'],['About 16 laps a day, so the crew'],['sees about 16 sunrises a day']]);} },
    { key: 'ellipse', title: 'Faster still: a stretched orbit', set: { v0: 9.5 }, fresh: true, speed: 2,
      see: 'At 9.5 km/s the ball swings far out, about 16,000 km up, and comes back. Watch its speed: fast near Earth, slow at the far end.',
      why: 'Going out, gravity pulls back against its motion and slows it. Coming back, gravity speeds it up. Too slow at the top to escape, it falls back around: the path is an ellipse.',
      overlay(sim,ctx,LH,k){const p=gvXY(sim,0,GV_R0),q=gvXY(sim,0,-(GV_RE+15.86e6));tag(ctx,'fastest: 9.5 km/s',p[0],p[1]-22,k,{s:12,hi:true});tag(ctx,'slowest: 2.9 km/s',q[0],Math.min(LH-20,q[1]+22),k,{s:12,hi:true});
        const [bx,by]=gvBall(sim),v=Math.hypot(sim.st.vx,sim.st.vy)/1e3;tag(ctx,v.toFixed(1)+' km/s',bx+56,by,k,{s:12});} },
    { key: 'escape', title: 'Escape', set: { v0: 11 }, fresh: true, speed: 2,
      see: 'At 11 km/s the ball leaves. The label on the ball shows its speed dropping as it climbs, but it never comes back.',
      why: 'Gravity slows the ball the whole way out, but gravity also gets weaker the farther out it goes. Above 10.85 km/s at this height, gravity runs out of strength before it can stop the ball. Space probes leave Earth this way.',
      overlay(sim,ctx,LH,k){gvLoop(sim,1200);const s=sim.st,[bx,by]=gvBall(sim),v=Math.hypot(s.vx,s.vy)/1e3;if(!s.done)tag(ctx,v.toFixed(1)+' km/s',clamp(bx+56,60,740),clamp(by,20,LH-20),k,{s:12,hi:true});
        gvCard(ctx,k,[['Escape speed here: 10.85 km/s',700],['From the ground: 11.2 km/s']]);} },
    { key: 'weaker', title: 'Gravity weakens with distance', set: { mode: 'force', planet: 'earth', r: 1, m: 10 }, fresh: true, pause: true, run(sim){gvCycle(sim,'weaker',[1,2,3]);},
      see: 'A different view. A 10 kg object moves out from Earth’s surface to 2, then 3, Earth radii from the center. Watch the pull arrow shrink.',
      why: 'Gravity spreads out in every direction, so twice as far away it is spread over 4 times the area. Twice the distance means ¼ the pull; three times means 1/9. It gets weaker but never reaches zero.',
      overlay(sim,ctx,LH,k){const r=sim.p.r,F=v=>(98.2/(v*v)).toFixed(1);gvCard(ctx,k,[['Pull on a 10 kg object',700],...[1,2,3].map(v=>[v+(v===1?' radius (the ground): ':' radii: ')+F(v)+' N'+(v>1?' (1/'+v*v+')':''),v===r?700:500,13,v===r?'#c8102e':PAL['cv-ink']])],470,60+110*k,300);} },
    { lvl: 'honors', key: 'higher', title: 'Higher orbits are slower', set: { mode: 'cannon', h: 2000, v0: 6.9 }, fresh: true, speed: 1,
      see: 'The tower is now 2000 km tall. At only 6.9 km/s the ball still circles Earth, on a wider circle.',
      why: 'For a circle, gravity must supply exactly the centripetal force: GMm/r² = mv²/r, so v = √(GM/r). Farther out, gravity is weaker, so a slower speed is enough. GPS satellites, 20,200 km up, need only 3.9 km/s.',
      overlay(sim,ctx,LH,k){gvCard(ctx,k,[['v = √(GM/r)',700],['400 km up: 7.67 km/s'],['2000 km up: 6.90 km/s'],['GPS, 20,200 km up: 3.87 km/s']]);} },
    { lvl: 'honors', key: 'mars', title: 'Your weight on Mars', set: { mode: 'force', planet: 'mars', r: 1, m: 10 }, fresh: true, pause: true,
      see: 'The same 10 kg object on the surface of Mars. The pull is 37 N, not 98 N.',
      why: 'g = GM/R². Mars has 0.107 of Earth’s mass, but it is also small (0.532 of Earth’s radius), so you stand closer to its center. 0.107 ÷ 0.532² = 0.38, so you weigh 38% of your Earth weight. Your mass is still 10 kg.',
      overlay(sim,ctx,LH,k){gvCard(ctx,k,[['g = GM/R²',700],['Earth: 9.8 N/kg → 98 N'],['Mars: 0.107 ÷ 0.532² = 0.38 of Earth'],['3.7 N/kg → 37 N',700,13,'#c8102e']],470,60+110*k,300);} },
    { lvl: 'ap', key: 'energy', title: 'Energy decides: bound or free', set: { mode: 'cannon', v0: 10 }, fresh: true, speed: 4,
      see: 'At 10 km/s, just under escape speed, the ball climbs about 32,000 km before falling back.',
      why: 'Energy per kilogram E = v²/2 − GM/r = 50.0 − 58.9 = −8.9 MJ/kg. Negative total energy means the ball can never reach infinity: the orbit is a closed ellipse. At 10.85 km/s, E = 0, and the ball just escapes.',
      overlay(sim,ctx,LH,k){gvCard(ctx,k,[['E = v²/2 − GM/r',700],['= 50.0 − 58.9 = −8.9 MJ/kg'],['E < 0: bound (ellipse)',700,13,'#c8102e'],['E ≥ 0: escape']]);} },
    { lvl: 'ap', key: 'kepler', title: 'Kepler’s third law', set: { mode: 'cannon', h: 3000, v0: 6.5 }, fresh: true, speed: 2,
      see: 'A near-circular orbit from a 3000 km tower, 9371 km from Earth’s center. One lap now takes about 150 minutes, compared with 92 minutes at 400 km.',
      why: 'For orbits around the same body, T² = (4π²/GM)·r³. The radius grew by 9371 ÷ 6771 = 1.38, so the period grows by 1.38^1.5 = 1.63: 92.4 × 1.63 ≈ 150 min.',
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
      see: 'Seen from above, a puck glides on an air table, tied to a pin by a string. The dots mark where it was every 0.1 s. The blue arrow is its velocity.',
      why: 'The dots are evenly spaced, so the speed stays the same: 4 m/s. But the blue arrow keeps turning. It always points along the circle, the way the puck is moving at that instant.',
      overlay(sim,ctx,LH,k){const [x,y]=ciPuck(sim);tag(ctx,'velocity: along the circle',clamp(x+40,120,450),clamp(y+46,40,420),k,{s:12,c:'#1b6fb3'});ciCard(ctx,k,[['Speed: 4 m/s, every moment',700],['Direction: always changing']],32,360,250,LH);} },
    { key: 'turn', title: 'Turning is accelerating', set: { mode: 'string' }, fresh: true, speed: 0.4,
      see: 'Bottom left: the velocity a moment ago (light blue) and now (dark blue), drawn from the same point. The red arrow is the change between them. Watch which way it points as the puck goes around.',
      why: 'Acceleration means the velocity is changing, and a change of direction counts. The change always points toward the center of the circle, so the puck is always accelerating toward the pin. Something has to pull it that way: here, the string.',
      overlay(sim,ctx,LH,k){const q=sim.st.str,th=q.th,O=[110,330],L=62,a=[-Math.sin(th-0.7)*L,-Math.cos(th-0.7)*L],b=[-Math.sin(th)*L,-Math.cos(th)*L];
        ctx.save();ctx.globalAlpha=0.95;ctx.fillStyle=PAL['cv-sol'];H.rr(ctx,36,256,150,150,10);ctx.fill();ctx.restore();
        ciArrow(ctx,O[0],O[1],a[0],a[1],'#8fc4ef',3);ciArrow(ctx,O[0],O[1],b[0],b[1],'#1b6fb3',3);ciArrow(ctx,O[0]+a[0],O[1]+a[1],b[0]-a[0],b[1]-a[1],'#c8102e',3);
        const [x,y]=ciPuck(sim),dx=285-x,dy=225-y,d=Math.hypot(dx,dy);ciArrow(ctx,x,y,dx/d*48,dy/d*48,'#c8102e',3);tag(ctx,'change in velocity → toward the center',300,428,k,{s:12,c:'#c8102e'});} },
    { key: 'cut', title: 'Cut the string', set: { mode: 'string' }, fresh: true, speed: 0.4,
      see: 'The string is cut while the puck is moving. The dashed red line points straight out from the pin. Watch which way the puck actually goes.',
      why: 'With nothing pulling it toward the center, nothing turns it, so the puck keeps the velocity it had and goes straight along the tangent (Newton’s first law). It does not fly straight out from the center, and it does not spiral.',
      overlay(sim,ctx,LH,k){ciCutLoop(sim);const q=sim.st.str;if(!q.cut)return;const a=q.cutAt,px=285+sim.p.r*136*Math.cos(a),py=225-sim.p.r*136*Math.sin(a);
        ctx.save();ctx.setLineDash([6,6]);ctx.strokeStyle='#c8102e';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(285,225);ctx.lineTo(285+(sim.p.r+0.8)*136*Math.cos(a),225-(sim.p.r+0.8)*136*Math.sin(a));ctx.stroke();ctx.restore();
        tag(ctx,'✗ not straight out',clamp(285+(sim.p.r+0.9)*136*Math.cos(a),90,470),clamp(225-(sim.p.r+0.9)*136*Math.sin(a),30,420),k,{s:12,c:'#c8102e'});
        const [x,y]=ciPuck(sim);tag(ctx,'✓ straight along the tangent',clamp(x,110,450),clamp(y-28,30,420),k,{s:12,hi:true});} },
    { key: 'faster', title: 'Twice as fast', set: { mode: 'string', v: 8 }, fresh: true, speed: 0.25,
      see: 'Same puck, same string, now at 8 m/s. Look at the string tension on the right.',
      why: 'Twice as fast means the direction changes twice as quickly, and each change is twice as big. So the string has to pull 2 × 2 = 4 times as hard: 40 N instead of 10 N. That is why fast turns need so much more grip.',
      overlay(sim,ctx,LH,k){ciCard(ctx,k,[['String pull',700],['4 m/s: 10 N'],['8 m/s: 40 N, 4× as much',700,13,'#c8102e']],32,340,240,LH);} },
    { key: 'curve', title: 'A car on a dry curve', set: { mode: 'curve', cv: 15, cr: 50, mu: 0.7 }, fresh: true, speed: 1,
      see: 'Now a car on a 50 m curve at 15 m/s (34 mph), seen from above. The gauge at the top right shows how much of the tires’ grip it takes.',
      why: 'On a flat road, nothing pulls the car toward the center except friction between the tires and the road. Turning here takes 66% of what dry tires can give, so the car holds the curve.',
      overlay(sim,ctx,LH,k){const [x,y]=ciCar(sim),dx=300-x,dy=225-y,d=Math.hypot(dx,dy);ciArrow(ctx,x,y,dx/d*46,dy/d*46,'#7a3fb0',3);tag(ctx,'tire friction: toward the center',300,160,k,{s:12,c:'#7a3fb0'});
        ciCard(ctx,k,[['Dry road',700],['Grip used: '+Math.round(ciMet(sim,'grip'))+'%'],['Top safe speed: 18.5 m/s']],200,235,200);} },
    { key: 'snow', title: 'The same curve on snow', set: { mode: 'curve', cv: 15, cr: 50, mu: 0.2 }, fresh: true, speed: 1,
      see: 'Same car, same 15 m/s, but on packed snow (grip 0.2). Watch where the car goes when the tires can’t give enough grip.',
      why: 'The curve still needs the same pull toward the center, but snow can only supply about a third of it. The car does not slide outward. It goes nearly straight, along the tangent, off the curve: just like the puck when the string was cut.',
      overlay(sim,ctx,LH,k){ciCarLoop(sim);ciCard(ctx,k,[['Packed snow',700],['Grip needed: 230% of what it has',700,13,'#c8102e'],['Top safe speed: 9.9 m/s (22 mph)']],180,235,240);} },
    { key: 'snowslow', title: 'Slow down for the snow', set: { mode: 'curve', cv: 9.5, cr: 50, mu: 0.2 }, fresh: true, speed: 1,
      see: 'Still on snow, but now at 9.5 m/s (21 mph). The car holds the curve.',
      why: 'Grip needed grows with speed squared. Cutting the speed to about two-thirds cuts the grip needed to under half, and now the snow can supply it, with a little to spare.',
      overlay(sim,ctx,LH,k){ciCard(ctx,k,[['Snow, 9.5 m/s',700],['Grip used: '+Math.round(ciMet(sim,'grip'))+'%'],['It makes the curve',700,13,'#1b7a3e']],200,235,200);} },
    { key: 'loop', title: 'Loop-the-loop', set: { mode: 'loop', lR: 5, lv: 17 }, fresh: true, speed: 0.5,
      see: 'A cart rides a loop 10 m tall. The label on the cart shows how heavy the rider feels, as a multiple of normal weight.',
      why: 'The track has to push the cart toward the center. At the bottom it pushes up, against gravity, so it pushes hard and the rider feels heavy. At the top, gravity is already pulling toward the center, so the track pushes less and the rider feels light.',
      overlay(sim,ctx,LH,k){const c=sim.st.cart,X=330+c.x*17,Y=404-c.y*17,f=ciMet(sim,'feel');if(f!=null&&isFinite(f))tag(ctx,'feels '+f.toFixed(1)+'× weight',clamp(X+86,90,700),clamp(Y-10,30,420),k,{s:12,hi:true});
        tag(ctx,'top: lightest',330,212,k,{s:12});tag(ctx,'bottom: heaviest',330,428,k,{s:12});} },
    { key: 'rotor', title: 'The rotor ride', set: { mode: 'rotor', rpm: 30, rR: 3, rmu: 0.4 }, fresh: true, speed: 1, run(sim){setTimeout(()=>{if(sim.lnKey==='rotor'&&sim.st.rot&&!sim.st.rot.floor)ciAct(sim,'floor');},1800);},
      see: 'Riders stand against the wall of a spinning drum. After a moment the floor drops away. Watch the riders.',
      why: 'The wall pushes each rider toward the center, which is what keeps them going around. That hard push presses them against the wall, so friction can hold them up: up to 711 N of friction against 588 N of weight. They stay stuck to the wall.',
      overlay(sim,ctx,LH,k){ciCard(ctx,k,[['Wall push toward the center: 1,776 N',700],['Friction it allows: up to 711 N'],['Rider’s weight: 588 N → held up',700,13,'#1b7a3e']],20,40,320);} },
    { lvl: 'honors', key: 'ac', title: 'a = v²/r', set: { mode: 'string', v: 4, r: 0.4 }, fresh: true, speed: 0.4,
      see: 'The string is now half as long, 0.4 m, at the same 4 m/s.',
      why: 'Centripetal acceleration a = v²/r = 4² ÷ 0.4 = 40 m/s², twice what it was on the 0.8 m string. The string supplies F = ma = 0.5 kg × 40 m/s² = 20 N. A tighter turn at the same speed takes more force.',
      overlay(sim,ctx,LH,k){ciCard(ctx,k,[['a = v²/r',700],['r = 0.8 m: 16 ÷ 0.8 = 20 m/s² → 10 N'],['r = 0.4 m: 16 ÷ 0.4 = 40 m/s² → 20 N',700,13,'#c8102e']],32,340,300,LH);} },
    { lvl: 'honors', key: 'loopmin', title: 'Just enough speed for the loop', set: { mode: 'loop', lR: 5 }, fresh: true, speed: 0.5, run(sim){ciAct(sim,'minimum');},
      see: 'The cart enters at exactly √(5gR) = 15.7 m/s. Watch the label at the very top.',
      why: 'At the top, N + mg = mv²/R. The slowest safe speed there makes N = 0: gravity alone supplies the turn, so v<sub>top</sub> = √(gR) = 7.0 m/s. Energy from the bottom: v² = v<sub>top</sub>² + 4gR = 5gR.',
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
      why: 'She isn’t moving, so she has no kinetic energy. All her energy is <b>potential energy</b>, stored because gravity can pull her down: PE = mgh = 60 kg × 9.8 m/s² × 5 m ≈ 2,940 J.',
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
      see: 'Watch how high she gets on the far side, compared with the dashed start-height line.',
      why: 'Going up, kinetic energy turns back into potential energy. With no friction none of it leaves, so she stops at exactly 5 m, then comes back. She would swing like this forever.',
      overlay(sim,ctx,LH,k){skC(ctx,k,[['Height now: '+n1(emMet(sim,'height'))+' m',700],['She turns around at the dashed 5 m line']],LH);} },
    { key: 'mass', title: 'A heavier skater', set: { track: 'halfpipe', h0: 5, mu: 0, mass: 120, planet: 'earth' }, fresh: true, speed: 0.4,
      see: 'Same track, same 5 m, but the skater is now 120 kg. Compare the energy bars and the top speed with before.',
      why: 'Twice the mass means twice the potential energy, about 5,880 J. But it also takes twice the energy to move twice the mass at the same speed. Mass cancels: she still reaches 9.9 m/s.',
      overlay(sim,ctx,LH,k){skC(ctx,k,[['120 kg: total '+n0(emMet(sim,'tot'))+' J (twice as much)',700],['Top speed: '+n1(emMet(sim,'vtop'))+' m/s, the same as 60 kg',600,13,GRN]],LH);} },
    { key: 'friction', title: 'Add friction', set: { track: 'halfpipe', h0: 5, mu: 0.08, mass: 60, planet: 'earth' }, fresh: true, speed: 1,
      see: 'Now the track has friction. Watch the red thermal-energy bar and how high she gets each swing.',
      why: 'Friction turns some kinetic energy into thermal energy: warm wheels and track, and sound. That energy is still there, so the gold total stays the same. But less is left for motion, so each swing is lower.',
      overlay(sim,ctx,LH,k){skC(ctx,k,[['Thermal: '+n0(emMet(sim,'th'))+' J and growing',700,13,RED],['Total: '+n0(emMet(sim,'tot'))+' J, unchanged',600,13,GRN]],LH);} },
    { key: 'moon', title: 'The same drop on the Moon', set: { track: 'halfpipe', h0: 5, mu: 0, mass: 60, planet: 'moon' }, fresh: true, speed: 1,
      see: 'Same skater and track, on the Moon, where gravity is 1.62 m/s².',
      why: 'Weaker gravity stores less energy in the same height, so she is slower: √(2 × 1.62 × 5) ≈ 4.0 m/s at the bottom. She still climbs back to exactly 5 m, because energy is still conserved.',
      overlay(sim,ctx,LH,k){skC(ctx,k,[['On the Moon: g = 1.62 m/s²',700],['Top speed: '+n1(emMet(sim,'vtop'))+' m/s (Earth: 9.9 m/s)']],LH);} },
    { lvl: 'honors', key: 'mid', title: 'Speed anywhere on the track', set: { track: 'halfpipe', h0: 5, mu: 0, mass: 60, planet: 'earth' }, fresh: true, speed: 0.3,
      see: 'Read her speed and height together as she rides.',
      why: 'You don’t need the shape of the track, only how far she has dropped. At 2 m high she has dropped 3 m, so ½mv² = mg(3 m) and v = √(2 × 9.8 × 3) ≈ 7.7 m/s on either side, going up or down.',
      overlay(sim,ctx,LH,k){skC(ctx,k,[['Height '+n1(emMet(sim,'height'))+' m → speed '+n1(emMet(sim,'speed'))+' m/s',700],['At 2 m: √(2 × 9.8 × 3) ≈ 7.7 m/s']],LH);} },
    { lvl: 'honors', key: 'ref', title: 'You choose where PE = 0', set: { track: 'halfpipe', h0: 5, mu: 0, mass: 60, planet: 'earth', yref: 2 }, fresh: true, speed: 0.6,
      see: 'The zero of potential energy is now 2 m up (gold dashed line). Watch the PE bar near the bottom, and the motion.',
      why: 'Below the new zero, PE is negative. Every PE value, and the total, drops by the same 1,176 J. Only <b>changes</b> in PE matter, so the speeds and the motion are exactly the same.',
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
      why: 'Climbing, your legs push you up with a force equal to your weight, mg = 588 N, over a height of 3.6 m. Work = force × distance = mgh = 60 × 9.8 × 3.6 ≈ 2,117 J.',
      overlay(sim,ctx,LH,k){pwS(ctx,k,[['Work = mgh',700],['= 60 × 9.8 × 3.6 ≈ 2,117 J'],['So far: '+n0(emMet(sim,'Wst'))+' J']],LH);} },
    { key: 'walkp', title: 'Power: how fast', set: { mode: 'stairs', m: 60, h: 3.6, T: 8 }, fresh: true, speed: 1,
      see: 'Same walk. This time watch the power reading.',
      why: 'Power is work divided by time: 2,117 J ÷ 8 s ≈ 265 W. A watt is one joule every second, so walking up you put out about as much as two and a half 100 W bulbs use.',
      overlay(sim,ctx,LH,k){pwS(ctx,k,[['Power = work ÷ time',700],['= 2,117 J ÷ 8 s ≈ 265 W']],LH);} },
    { key: 'sprint', title: 'Sprint the same stairs', set: { mode: 'stairs', m: 60, h: 3.6, T: 3 }, fresh: true, speed: 1,
      see: 'Now the student sprints up in 3 s.',
      why: 'Same weight, same height, so the same work: 2,117 J. Done in 3 s instead of 8, the power is 2,117 ÷ 3 ≈ 706 W, almost one horsepower (746 W). That is why sprinting stairs leaves you out of breath.',
      overlay(sim,ctx,LH,k){pwS(ctx,k,[['Same work: 2,117 J',700],['Power: 2,117 ÷ 3 ≈ 706 W = '+n2(706/746)+' hp',700,13,RED]],LH);} },
    { key: 'heavy', title: 'A heavier climber', set: { mode: 'stairs', m: 110, h: 3.6, T: 8 }, fresh: true, speed: 1,
      see: 'A 110 kg climber walks the same stairs in the same 8 s.',
      why: 'More weight lifted the same height is more work: 110 × 9.8 × 3.6 ≈ 3,881 J. In the same time, that is more power, about 485 W. Work depends on the force and the distance, not on how hard it feels.',
      overlay(sim,ctx,LH,k){pwS(ctx,k,[['110 kg: W ≈ 3,881 J',700],['P ≈ 3,881 ÷ 8 ≈ 485 W']],LH);} },
    { key: 'pull', title: 'Pull a sled across ice', set: { mode: 'pull', F: 80, th: 0, mu: 0, M: 20 }, fresh: true, speed: 1,
      see: 'A 20 kg sled on ice, pulled with 80 N straight along the ground for 5 m. Watch the work tally on the right.',
      why: 'The pull is along the motion, so all of it does work: W = Fd = 80 N × 5 m = 400 J. On ice nothing takes energy away, so all 400 J ends up as the sled’s kinetic energy.',
      overlay(sim,ctx,LH,k){pwP(ctx,k,[['W = F × d = 80 N × 5 m = 400 J',700],['Work by your pull so far: '+n0(emMet(sim,'WF'))+' J']],LH);} },
    { key: 'angle', title: 'Pull at an angle', set: { mode: 'pull', F: 80, th: 60, mu: 0, M: 20 }, fresh: true, speed: 1,
      see: 'Same 80 N pull, but the rope now points 60° up. Watch the green arrow in the top-left box.',
      why: 'Only the part of the pull along the ground moves the sled forward: 80 × cos 60° = 40 N. So the work over 5 m is 40 × 5 = 200 J, half as much. The upward part of the pull does no work at all.',
      overlay(sim,ctx,LH,k){pwP(ctx,k,[['Along the motion: 80 × cos 60° = 40 N',700],['W = 40 N × 5 m = 200 J'],['So far: '+n0(emMet(sim,'WF'))+' J']],LH);} },
    { key: 'up', title: 'Straight up: no work', set: { mode: 'pull', F: 80, th: 90, mu: 0.2, M: 20 }, fresh: true, speed: 1,
      see: 'The rope points straight up, 80 N, not enough to lift the 196 N sled.',
      why: 'You are pulling hard, but the sled doesn’t move in the direction you pull, and it doesn’t move at all. No motion along the force means zero work, however tired your arms get.',
      overlay(sim,ctx,LH,k){pwP(ctx,k,[['Distance moved along the pull: 0 m',700],['Work: '+n0(emMet(sim,'WF'))+' J']],LH);} },
    { key: 'snow', title: 'Friction does negative work', set: { mode: 'pull', F: 100, th: 20, mu: 0.2, M: 20 }, fresh: true, speed: 1,
      see: 'Now on packed snow (μ = 0.20), pulling 100 N at 20°. Watch the friction line in the tally.',
      why: 'Friction pushes backward while the sled moves forward, so it takes energy out: its work is negative. Your pull does about +470 J, friction about −162 J, and only the difference ends up as motion.',
      overlay(sim,ctx,LH,k){pwP(ctx,k,[['Your pull: +'+n0(emMet(sim,'WF'))+' J',700],['Friction: '+n0(emMet(sim,'Wf'))+' J (negative)',700,13,RED]],LH);} },
    { lvl: 'honors', key: 'wke', title: 'Net work = change in KE', set: { mode: 'pull', F: 100, th: 20, mu: 0.2, M: 20 }, fresh: true, speed: 1,
      see: 'Same run. Compare the net work with the sled’s kinetic energy.',
      why: 'Add every force’s work: pull + friction + gravity (0) + normal force (0). The net work always equals the change in kinetic energy, ½Mv². This is the work–energy theorem.',
      overlay(sim,ctx,LH,k){pwP(ctx,k,[['Net work: '+n0(emMet(sim,'Wn'))+' J',700],['Kinetic energy: '+n0(emMet(sim,'KE'))+' J (the same)',700,13,GRN]],LH);} },
    { lvl: 'ap', key: 'area', title: 'Work is the area under F(x)', set: { mode: 'pull', F: 80, th: 0, mu: 0, M: 20, prof: 'fall' }, fresh: true, speed: 1,
      see: 'The pull now starts at 160 N and falls steadily to 0 over the 5 m. Switch the graph below to Force vs. position.',
      why: 'When the force changes, W = ∫F dx, the area under the force–position graph. Here it is a triangle: ½ × 5 m × 160 N = 400 J, the same as a steady 80 N. The power, F·v, rises at first as the sled speeds up, then falls as the pull fades.',
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
      see: 'A 100 g mass hangs at rest. Read the stretch on the ruler: the distance from the dashed “unstretched” line.',
      why: 'At rest the spring pulls up exactly as hard as gravity pulls down. Weight = 0.1 kg × 9.8 = 0.98 N. Hooke’s law, F = kx, gives the stretch: x = 0.98 ÷ 30 = 0.033 m, about 3.3 cm.',
      overlay(sim,ctx,LH,k){spC(ctx,k,[['F = kx',700],['0.98 N = 30 N/m × x → x ≈ 3.3 cm'],['Stretch now: '+n1(emMet(sim,'stretch'))+' cm']],LH);} },
    { key: 'triple', title: 'Three times the weight', set: { mass: 300, k: 30, damp: 0, planet: 'earth' }, fresh: true, speed: 1, run(sim){emAct(sim,'stop');},
      see: 'Now 300 g, three times as heavy.',
      why: 'Three times the weight, three times the stretch: about 9.8 cm. A spring’s stretch is proportional to the force on it. That is exactly how a spring scale or a bathroom scale measures weight.',
      overlay(sim,ctx,LH,k){spC(ctx,k,[['3× the weight → 3× the stretch',700],['Stretch: '+n1(emMet(sim,'stretch'))+' cm']],LH);} },
    { key: 'stiff', title: 'A stiffer spring', set: { mass: 300, k: 60, damp: 0, planet: 'earth' }, fresh: true, speed: 1, run(sim){emAct(sim,'stop');},
      see: 'Same 300 g, but the spring is twice as stiff: k = 60 N/m.',
      why: 'The stiffness k is the force needed per meter of stretch. Double k and the same weight stretches it only half as far: 2.9 N ÷ 60 N/m ≈ 4.9 cm.',
      overlay(sim,ctx,LH,k){spC(ctx,k,[['k = 60 N/m: half the stretch',700],['Stretch: '+n1(emMet(sim,'stretch'))+' cm']],LH);} },
    { key: 'bounce', title: 'Pull down and let go', set: { mass: 300, k: 30, damp: 0, planet: 'earth' }, fresh: true, speed: 1, run(sim){emAct(sim,'release');},
      see: 'The 300 g mass is pulled down 8 cm and released. The red pen traces its motion on the paper.',
      why: 'Below the rest point, the spring pulls harder than gravity, so the mass speeds up toward it, overshoots, and the spring slows it again. It goes up and down in a steady rhythm, a full bounce every 0.63 s.',
      overlay(sim,ctx,LH,k){spC(ctx,k,[['One full bounce (period):',700],[n2(emMet(sim,'period'))+' s']],LH);} },
    { key: 'heavier', title: 'More mass, slower bounce', set: { mass: 400, k: 30, damp: 0, planet: 'earth' }, fresh: true, speed: 1, run(sim){emAct(sim,'release');},
      see: '400 g on the same spring.',
      why: 'More mass is harder to speed up and slow down, so each bounce takes longer: about 0.73 s instead of 0.63 s. Heavier things on springs bounce slower, like a loaded truck rocking on its suspension.',
      overlay(sim,ctx,LH,k){spC(ctx,k,[['400 g: period '+n2(emMet(sim,'period'))+' s',700],['300 g was 0.63 s']],LH);} },
    { key: 'stiffer', title: 'Stiffer spring, faster bounce', set: { mass: 300, k: 120, damp: 0, planet: 'earth' }, fresh: true, speed: 1, run(sim){emAct(sim,'release');},
      see: '300 g on a spring four times as stiff, k = 120 N/m.',
      why: 'A stiffer spring pulls back harder for the same stretch, so it turns the mass around faster. Four times the stiffness halves the period: about 0.31 s.',
      overlay(sim,ctx,LH,k){spC(ctx,k,[['k = 120 N/m: period '+n2(emMet(sim,'period'))+' s',700],['Half of 0.63 s']],LH);} },
    { key: 'moon', title: 'The same spring on the Moon', set: { mass: 300, k: 30, damp: 0, planet: 'moon' }, fresh: true, speed: 1, run(sim){emAct(sim,'release');},
      see: 'Same 300 g and same spring, on the Moon.',
      why: 'Weaker gravity means a smaller stretch at rest, about 1.6 cm. But the bounce time is still 0.63 s, because it depends only on the mass and the spring, not on gravity. That is why springs, not pendulums, weigh things in space.',
      overlay(sim,ctx,LH,k){spC(ctx,k,[['Moon: rest stretch '+n1(emMet(sim,'eq')!=null?emMet(sim,'eq'):1.6)+' cm',700],['Period: '+n2(emMet(sim,'period'))+' s, the same as on Earth',600,13,GRN]],LH);} },
    { key: 'damp', title: 'Why the bounce dies out', set: { mass: 300, k: 30, damp: 0.3, planet: 'earth' }, fresh: true, speed: 1, run(sim){emAct(sim,'release');},
      see: 'Now there is damping, like air and friction in the spring.',
      why: 'Damping turns some of the motion’s energy into thermal energy each bounce, so the bounces get smaller and smaller until the mass rests. A car’s shock absorbers do this on purpose, so the car doesn’t keep bouncing after a bump.',
      overlay(sim,ctx,LH,k){spC(ctx,k,[['Each bounce smaller',700],['Energy → heat, like a shock absorber']],LH);} },
    { lvl: 'honors', key: 'energy', title: 'Three energies trade places', set: { mass: 300, k: 30, damp: 0, planet: 'earth', amp: 8 }, fresh: true, speed: 0.3, run(sim){emAct(sim,'release');},
      see: 'Slow motion. Watch the green (kinetic), purple (spring) and blue (gravity) bars.',
      why: 'At the bottom the spring is stretched most: lots of spring energy, no kinetic. Through the middle the mass is fastest. At the top, more gravitational energy. The gold total never changes when there is no damping.',
      overlay(sim,ctx,LH,k){spC(ctx,k,[['KE '+n2(emMet(sim,'ke'))+' + spring '+n2(emMet(sim,'ue'))+' + gravity '+n2(emMet(sim,'ug')),700],['= '+n2(emMet(sim,'tot'))+' J, constant',600,13,GRN]],LH);} },
    { lvl: 'honors', key: 'period', title: 'T = 2π√(m/k)', set: { mass: 300, k: 30, damp: 0, planet: 'earth', config: 'single' }, fresh: true, speed: 1, run(sim){emAct(sim,'release');},
      see: 'Back to 300 g on 30 N/m. Compare the measured period with the formula.',
      why: 'T = 2π√(m/k) = 2π√(0.3 ÷ 30) = 2π × 0.1 ≈ 0.63 s. Mass goes on top (more mass, slower), stiffness on the bottom (stiffer, faster), and the square root means you need 4× the mass to double the period.',
      overlay(sim,ctx,LH,k){spC(ctx,k,[['T = 2π√(0.3 ÷ 30) ≈ 0.63 s',700],['Measured: '+n2(emMet(sim,'period'))+' s']],LH);} },
    { lvl: 'honors', key: 'series', title: 'Two springs in a row', set: { mass: 300, k: 30, damp: 0, planet: 'earth', config: 'series' }, fresh: true, speed: 1, run(sim){emAct(sim,'release');},
      see: 'Two 30 N/m springs hung end to end (series).',
      why: 'Each spring carries the full weight, so each stretches as much as one spring would, and together they stretch twice as far: effective k = 15 N/m. Side by side (parallel) they share the weight: k = 60 N/m.',
      overlay(sim,ctx,LH,k){spC(ctx,k,[['Series: k = 15 N/m',700],['Period: '+n2(emMet(sim,'period'))+' s (√2 × 0.63)']],LH);} },
    { lvl: 'ap', key: 'shm', title: 'Simple harmonic motion', set: { mass: 300, k: 30, damp: 0, planet: 'earth', config: 'single', amp: 3 }, fresh: true, speed: 1, run(sim){emAct(sim,'release');},
      see: 'A smaller 3 cm pull. Switch the graph below to x, v and a vs. time.',
      why: 'The net force is −kx from the rest position, so a = −(k/m)x: always toward the middle and proportional to the distance. That gives sine-shaped motion, and its period 2π√(m/k) has no amplitude in it, so the 3 cm bounce takes the same 0.63 s as the 8 cm one.',
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
      see: 'Cart A (red, 1 kg) rolls at 0.8 m/s into cart B (blue, 1 kg), which is at rest. The springy bumpers make it a bouncy collision.',
      why: 'A stops dead and B leaves at 0.8 m/s, like a pool ball hitting another head-on. Momentum, p = mv, is passed on: 1 kg × 0.8 m/s = 0.8 kg·m/s before, and the same after.',
      overlay(sim,ctx,LH,k){coLoop(sim);coC(ctx,k,[['Total momentum: '+n2(emMet(sim,'ptot'))+' kg·m/s',700],['before and after']],LH);} },
    { key: 'heavy', title: 'Heavy cart hits a light one', set: { mode: 'track', type: 'elastic', mA: 2, mB: 1, vA: 0.8, vB: 0, tape: true }, fresh: true, speed: 0.6,
      see: 'Now A is 2 kg and B is 1 kg.',
      why: 'The heavy cart barely slows (0.27 m/s) and keeps going, while the light one shoots off faster than A came in (1.07 m/s). Total momentum before: 2 × 0.8 = 1.6. After: 2 × 0.27 + 1 × 1.07 = 1.6. The same.',
      overlay(sim,ctx,LH,k){coLoop(sim);coC(ctx,k,[['A: '+n2(emMet(sim,'vA'))+' m/s   B: '+n2(emMet(sim,'vB'))+' m/s',700],['Total momentum: '+n2(emMet(sim,'ptot'))+' kg·m/s']],LH);} },
    { key: 'light', title: 'Light cart hits a heavy one', set: { mode: 'track', type: 'elastic', mA: 1, mB: 2, vA: 0.8, vB: 0, tape: true }, fresh: true, speed: 0.6,
      see: 'Swap them: A is 1 kg, B is 2 kg.',
      why: 'The light cart bounces back (−0.27 m/s, negative means left) and the heavy one moves off slowly (0.53 m/s). Momentum is a vector, so the backward momentum counts as negative: 1 × (−0.27) + 2 × 0.53 = 0.8, the same as before.',
      overlay(sim,ctx,LH,k){coLoop(sim);coC(ctx,k,[['A: '+n2(emMet(sim,'vA'))+' (back)   B: '+n2(emMet(sim,'vB'))+' m/s',700],['Total momentum: '+n2(emMet(sim,'ptot'))+' kg·m/s']],LH);} },
    { key: 'sticky', title: 'A sticky collision', set: { mode: 'track', type: 'sticky', mA: 1, mB: 1, vA: 0.8, vB: 0, tape: true }, fresh: true, speed: 0.6,
      see: 'Velcro bumpers: the carts stick together. Watch the momentum and kinetic energy panels below.',
      why: 'Twice the mass must carry the same 0.8 kg·m/s, so they move together at half the speed, 0.4 m/s. Momentum is conserved, but half the kinetic energy turns into heat and sound as the Velcro grabs.',
      overlay(sim,ctx,LH,k){coLoop(sim);coC(ctx,k,[['Together: '+n2(emMet(sim,'vA'))+' m/s',700],['Momentum kept; KE '+(sim.st.hit?'halved':'…'),600,13,RED]],LH);} },
    { key: 'explode', title: 'Push apart from rest', set: { mode: 'track', type: 'explode', mA: 1, mB: 1, spring: 0.4, tape: true }, fresh: true, speed: 0.6,
      see: 'The carts start touching, at rest, with a compressed spring between them. Then it’s released.',
      why: 'Before: nothing moves, so total momentum is zero. After: they fly apart at 0.63 m/s each, in opposite directions. +0.63 and −0.63 add to zero. The spring’s energy becomes kinetic energy, but momentum stays zero.',
      overlay(sim,ctx,LH,k){coLoop(sim);coC(ctx,k,[['A: '+n2(emMet(sim,'vA'))+'   B: '+n2(emMet(sim,'vB'))+' m/s',700],['Total momentum: '+n2(emMet(sim,'ptot'))+' kg·m/s']],LH);} },
    { key: 'recoil', title: 'Recoil', set: { mode: 'track', type: 'explode', mA: 1, mB: 2, spring: 0.4, tape: true }, fresh: true, speed: 0.6,
      see: 'Same spring, but now B is 2 kg.',
      why: 'The total must still be zero, so the light cart moves twice as fast as the heavy one: 0.73 m/s left and 0.37 m/s right. This is recoil: a rifle kicks back, and a skateboarder who throws a heavy ball rolls backward.',
      overlay(sim,ctx,LH,k){coLoop(sim);coC(ctx,k,[['1 kg: '+n2(emMet(sim,'vA'))+'   2 kg: '+n2(emMet(sim,'vB'))+' m/s',700],['1 × '+n2(emMet(sim,'vA'))+' + 2 × '+n2(emMet(sim,'vB'))+' = 0']],LH);} },
    { lvl: 'honors', key: 'partial', title: 'Partly bouncy', set: { mode: 'track', type: 'partial', e: 0.5, mA: 1, mB: 1, vA: 0.8, vB: 0, tape: true }, fresh: true, speed: 0.6,
      see: 'Bounciness e = 0.5: the carts separate at half the speed they approached.',
      why: 'Momentum still gives 0.8 total. A keeps 0.2 m/s and B gets 0.6 m/s. Kinetic energy drops from 0.32 J to 0.20 J, 37.5% lost. Real collisions, like cars and balls, are somewhere between bouncy and sticky.',
      overlay(sim,ctx,LH,k){coLoop(sim);coC(ctx,k,[['A: '+n2(emMet(sim,'vA'))+'   B: '+n2(emMet(sim,'vB'))+' m/s',700],['Kinetic energy lost: '+(isFinite(emMet(sim,'kelost'))?n0(emMet(sim,'kelost'))+'%':'…')]],LH);} },
    { lvl: 'honors', key: 'headon', title: 'Head-on and stuck', set: { mode: 'track', type: 'sticky', mA: 1, mB: 1, vA: 0.8, vB: -0.8, tape: true }, fresh: true, speed: 0.6,
      see: 'Two equal carts drive at each other at 0.8 m/s and stick.',
      why: 'Total momentum: 0.8 + (−0.8) = 0. So after sticking they must be at rest. All the kinetic energy, 0.64 J, becomes heat, sound and bent metal. That is the worst case in a car crash.',
      overlay(sim,ctx,LH,k){coLoop(sim);coC(ctx,k,[['Total momentum: '+n2(emMet(sim,'ptot'))+' kg·m/s',700],['Both stop: 100% of KE lost',600,13,RED]],LH);} },
    { lvl: 'ap', key: 'table', title: 'Two dimensions', set: { mode: 'table', type: 'elastic', mA: 1, mB: 1, vA: 0.8, vB: 0, b: 0.08, tape: true }, fresh: true, speed: 0.6,
      see: 'An air table, seen from above. Puck A hits B off-center.',
      why: 'Momentum is conserved separately in x and in y. The y-momentum starts at zero, so the pucks leave on opposite sides of A’s original path. For equal masses in an elastic collision, they leave 90° apart.',
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
      see: 'The egg falls 1 m onto concrete. The graph on the right shows the force on the egg during the tiny moment of impact, slowed down 40 times.',
      why: 'The egg arrives at 4.4 m/s with momentum 0.06 × 4.4 = 0.27 kg·m/s, and concrete stops it in about 2 ms. Stopping that fast takes a peak force of about 209 N, seven times what the shell can take.',
      overlay(sim,ctx,LH,k){imLoop(sim);imC(ctx,k,[['Stopped in '+n0(emMet(sim,'tau'))+' ms',700],['Peak force: '+n0(emMet(sim,'fpk'))+' N (shell cracks above 30 N)',700,13,RED]],LH);} },
    { key: 'foam', title: 'Egg on a foam pad', set: { obj: 'egg', surface: 'foam', h: 1 }, fresh: true, speed: 1,
      see: 'Same egg, same 1 m, onto a foam pad. The dashed curve on the graph is the last run, on concrete.',
      why: 'The egg still has to lose the same 0.27 kg·m/s of momentum. Foam stretches the stop to 30 ms, 15 times longer, so the force is 15 times smaller: about 14 N. The egg survives.',
      overlay(sim,ctx,LH,k){imLoop(sim);imC(ctx,k,[['Stopped in '+n0(emMet(sim,'tau'))+' ms',700],['Peak force: '+n1(emMet(sim,'fpk'))+' N: survives',700,13,GRN]],LH);} },
    { key: 'same', title: 'Same impulse, different shape', set: { obj: 'egg', surface: 'carpet', h: 1 }, fresh: true, speed: 1,
      see: 'Now carpet, which stops the egg in 8 ms. Compare the shaded areas under the force curves.',
      why: 'The area under a force–time graph is the <b>impulse</b>, and it always equals the change in momentum. Tall and thin (concrete) or short and wide (foam), the area is the same 0.27 N·s. Only the peak force changes: here about 52 N, still enough to crack it.',
      overlay(sim,ctx,LH,k){imLoop(sim);imC(ctx,k,[['Carpet: '+n0(emMet(sim,'tau'))+' ms → '+n0(emMet(sim,'fpk'))+' N',700],['Area (impulse): 0.27 N·s, every surface']],LH);} },
    { key: 'higher', title: 'A higher drop', set: { obj: 'egg', surface: 'foam', h: 3 }, fresh: true, speed: 1,
      see: 'Foam pad again, but from 3 m.',
      why: 'From 3 m the egg arrives at 7.7 m/s, so it has more momentum to lose: about 0.46 kg·m/s. Over the same 30 ms, the peak force rises to about 24 N. Still under 30 N, but with little margin.',
      overlay(sim,ctx,LH,k){imLoop(sim);imC(ctx,k,[['From 3 m: '+n1(emMet(sim,'vimp'))+' m/s at impact',700],['Peak force: '+n1(emMet(sim,'fpk'))+' N']],LH);} },
    { key: 'car', title: 'A crash with a seat belt', set: { obj: 'car', kmh: 50, rest: 'belt', front: 'rigid' }, fresh: true, speed: 1,
      see: 'A car hits a wall at 50 km/h (31 mph). The crash-test dummy, 75 kg, wears a seat belt. The car’s front is rigid.',
      why: 'The dummy has to lose 75 × 13.9 ≈ 1,040 kg·m/s of momentum, whatever happens. The belt stretches and lets the dummy stop over about 0.1 s, so the peak force is about 16 kN, around 22 g. Injuries are likely.',
      overlay(sim,ctx,LH,k){imLoop(sim);imCar(ctx,k,[['Seat belt, rigid front',700],['Stop: '+n0(emMet(sim,'tau'))+' ms → '+n1(emMet(sim,'fpkK'))+' kN, '+n0(emMet(sim,'gpk'))+' g']],LH);} },
    { key: 'crumple', title: 'Add a crumple zone', set: { obj: 'car', kmh: 50, rest: 'belt', front: 'crumple' }, fresh: true, speed: 1,
      see: 'Same crash, but the front of the car is designed to crush.',
      why: 'The crumpling front takes 120 ms to stop the car instead of 40 ms, and the belted dummy stops over about 0.18 s. Same momentum change, almost twice the time, so roughly half the force: about 9 kN, 12 g. Likely to walk away.',
      overlay(sim,ctx,LH,k){imLoop(sim);imCar(ctx,k,[['Seat belt and crumple zone',700],['Stop: '+n0(emMet(sim,'tau'))+' ms → '+n1(emMet(sim,'fpkK'))+' kN, '+n0(emMet(sim,'gpk'))+' g',700,13,GRN]],LH);} },
    { key: 'nobelt', title: 'No seat belt', set: { obj: 'car', kmh: 50, rest: 'none', front: 'crumple' }, fresh: true, speed: 1,
      see: 'Same crumple zone, but the dummy isn’t belted.',
      why: 'The car stops, but the unbelted dummy keeps going at 50 km/h until it hits the dashboard 45 cm ahead, which stops it in about 8 ms. Same momentum, a tiny fraction of the time: a peak force of about 200 kN. The crumple zone can’t help someone who isn’t attached to the car.',
      overlay(sim,ctx,LH,k){imLoop(sim);imCar(ctx,k,[['No belt: stopped by the dashboard',700,13,RED],['Stop: '+n0(emMet(sim,'tau'))+' ms → '+n0(emMet(sim,'fpkK'))+' kN, '+n0(emMet(sim,'gpk'))+' g',700,13,RED]],LH);} },
    { lvl: 'honors', key: 'favg', title: 'J = F·Δt = Δp', set: { obj: 'egg', surface: 'foam', h: 1 }, fresh: true, speed: 1,
      see: 'Back to the egg on foam. Compare the impulse with the egg’s momentum before impact.',
      why: 'Impulse = average force × time = change in momentum. The egg goes from 0.266 kg·m/s to 0, so J = 0.266 N·s. Over 30 ms the average force is 0.266 ÷ 0.030 ≈ 8.9 N. The peak, for this smooth pulse, is π/2 times the average.',
      overlay(sim,ctx,LH,k){imLoop(sim);imC(ctx,k,[['Δp = '+n2(emMet(sim,'p0'))+' kg·m/s = J',700],['F_avg = J ÷ Δt = '+n1(emMet(sim,'favg'))+' N']],LH);} },
    { lvl: 'honors', key: 'bounce', title: 'Bouncing takes more impulse', set: { obj: 'ball', ball: 'rubber', surface: 'carpet', h: 1 }, fresh: true, speed: 1,
      see: 'A 150 g rubber ball dropped 1 m onto carpet bounces back up. Compare with a clay ball that sticks.',
      why: 'To stick, the floor only has to stop the ball. To bounce, it has to stop it and then send it back up at 80% of the speed. Δp = m(v + 0.8v) = 1.8 mv, so the floor pushes 1.8 times as hard. Bouncing hurts more than sticking.',
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
      why: 'The left mass tries to turn the plank counterclockwise and the right one clockwise. Each turning effect, called <b>torque</b>, is weight × distance from the pivot. Equal torques cancel.',
      overlay(sim,ctx,LH,k){tqTR(ctx,k,[['Torque = weight × distance',700],'Left: 294 N × 1.5 m = 441 N·m','Right: 294 N × 1.5 m = 441 N·m',['Equal → balanced',700,13,TQ_G]]);} },
    { key: 'far', title: 'Distance matters', fresh: true, speed: 1,
      see: 'Watch the circled mass slide out from 1.5 m to 2.0 m. Its weight never changes, but as soon as it stops, the right side drops.',
      why: 'The same weight farther from the pivot turns the plank harder: 294 N × 2.0 m = 588 N·m beats 441 N·m.',
      so: 'It’s why a door is easy to push at the handle and hard to push near the hinges.',
      overlay(sim,ctx,LH,k,tau){const f=tqTw(sim,tau,{dR:[1.5,2]},0.8,2.4),d=sim.p.dR,tR=294*d;if(Math.abs(sim.st.phi||0)>0.02){ctx.save();ctx.strokeStyle=PAL['cv-ink'];ctx.globalAlpha=0.55;ctx.setLineDash([7,5]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(80,320);ctx.lineTo(720,320);ctx.stroke();ctx.restore();H.txt(ctx,'level before',90,312,{s:11*Math.min(k,1.3),w:700,c:PAL['cv-ink']});}if(f<1){const [x,y]=tqMassXY(sim,d,1);tqRing(ctx,x,y,40,tau);}
        tqTR(ctx,k,[[f<1?'Sliding the right mass out…':'Same mass, farther out',700],'Left: 294 N × 1.5 m = 441 N·m',['Right: 294 N × '+d.toFixed(2)+' m = '+Math.round(tR)+' N·m',700,13,f>0&&f<1?TQ_B:PAL['cv-ink']],[tR>441.5?'Bigger torque → right side drops':'Equal → balanced',700,13,tR>441.5?TQ_R:TQ_G]]);} },
    { key: 'heavy', title: 'Heavier and closer balances lighter and farther', set: { mL: 30, dL: 2, mR: 60, dR: 1 }, fresh: true, speed: 1,
      see: { bio: 'A 30 kg kid 2 m out balances a 60 kg adult 1 m from the pivot.', honors: 'A 30 kg mass at 2 m balances a 60 kg mass at 1 m: Στ = 0.' },
      why: 'Twice the weight at half the distance gives the same torque: 588 N·m each side. That’s how a parent and a small child can use a seesaw together.',
      overlay(sim,ctx,LH,k){tqTR(ctx,k,[['Unequal masses, still level',700],'Left: 294 N × 2.0 m = 588 N·m','Right: 588 N × 1.0 m = 588 N·m',['Equal → balanced',700,13,TQ_G]]);} },
    { key: 'wrench', title: 'A stuck bolt', set: { mode: 'wrench', F: 100, r: 0.3, ang: 90 }, fresh: true, speed: 1,
      see: 'A rusted bolt needs 40 N·m to break loose. You push 100 N straight across the handle, 30 cm from the bolt. It doesn’t budge.',
      why: 'Torque = distance × force = 0.30 m × 100 N = 30 N·m. That is less than the 40 N·m the bolt needs.',
      overlay(sim,ctx,LH,k){tqBL(ctx,k,[['Torque = distance × force',700],'0.30 m × 100 N = 30 N·m',['Needs 40 N·m → stuck',700,13,TQ_R]],LH);} },
    { key: 'longer', title: 'Push farther out', set: { mode: 'wrench', F: 100, r: 0.3, ang: 90 }, fresh: true, speed: 1,
      see: 'Watch your hand slide out from 30 cm to 35 cm while the push grows from 100 N to 120 N. The torque bar climbs, and the moment it passes the 40 N·m line the bolt turns.',
      why: 'Distance multiplies your force. At 35 cm, 120 N gives 0.35 × 120 = 42 N·m, more than the 40 N·m needed. A longer wrench, or a pipe slipped over the handle, does the same.',
      overlay(sim,ctx,LH,k,tau){const f=tqTw(sim,tau,{r:[0.3,0.35],F:[100,120]},0.8,2.6),tq=sim.p.r*sim.p.F;if(f<1){const [x,y]=tqPush(sim);tqRing(ctx,x,y,18,tau);}
        tqBL(ctx,k,[[f<1?'Moving out and pushing harder…':'Farther out',700],sim.p.r.toFixed(3)+' m × '+Math.round(sim.p.F)+' N = '+tq.toFixed(1)+' N·m',[tq>=40?'At least 40 N·m → it turns':'Less than 40 N·m → still stuck',700,13,tq>=40?TQ_G:TQ_R]],LH);} },
    { key: 'angle', title: 'Push at a slant', set: { mode: 'wrench', F: 100, r: 0.3, ang: 90 }, fresh: true, speed: 1,
      see: 'Same 100 N at 30 cm. Watch the push tilt from straight across (90°) to 35°. The torque bar shrinks from 30 to about 17 N·m, though the push is just as hard.',
      why: { bio: 'Only the part of your push that goes across the handle turns the bolt. The part along the handle just pulls on the bolt.', honors: 'τ = rF sinθ = 0.30 × 100 × sin 35° = 17.2 N·m. Equivalently, the lever arm shrinks to r⊥ = r sinθ = 17.2 cm (purple line).' },
      overlay(sim,ctx,LH,k,tau){const f=tqTw(sim,tau,{ang:[90,35]},0.8,2.6),a=sim.p.ang;if(f<1){const [x,y]=tqPush(sim);tqRing(ctx,x,y,18,tau);}
        tqBL(ctx,k,[[f<1?'Tilting the push…':'Slanted push',700],'τ = 0.30 m × 100 N × sin '+Math.round(a)+'° = '+n1(emMet(sim,'tau'))+' N·m',['Straight across (90°) gives the most',700,13,TQ_B]],LH);} },
    { key: 'bolt', title: 'Push right at the bolt', set: { mode: 'wrench', F: 100, r: 0.3, ang: 90 }, fresh: true, speed: 1,
      see: 'Same 100 N push. Watch your hand slide in toward the bolt. The torque shrinks with the distance and reaches zero at the bolt, no matter how hard you push.',
      why: 'With no distance from the pivot there is no lever arm, so the torque is zero. The same is true for a push straight along the handle.',
      overlay(sim,ctx,LH,k,tau){const f=tqTw(sim,tau,{r:[0.3,0]},0.8,2.6);if(f<1){const [x,y]=tqPush(sim);tqRing(ctx,x,y,18,tau);}
        ciCard(ctx,k,[[f<1?'Sliding in toward the bolt…':'Distance 0',700],sim.p.r.toFixed(2)+' m × 100 N = '+n1(sim.p.r*100)+' N·m',[f<1?'Torque shrinks with the distance':'No turning at all',700,13,TQ_R]],60,342,280,LH);} },
    { key: 'ladder', lvl: 'ap', title: 'The leaning ladder', set: { mode: 'ladder', lang: 65, mu: 0.3, x: 0 }, fresh: true, speed: 1, run(sim){emAct(sim,'climb');},
      see: 'A 70 kg climber goes up a ladder leaning at 65° on a smooth wall. The floor’s friction coefficient is 0.30. About two thirds of the way up, the foot slides out.',
      why: 'Taking torques about the foot: as the climber rises, their weight’s lever arm grows, so the wall must push out harder. Friction must equal that push, but it can never exceed μN = 0.30 × 833 N = 250 N.',
      overlay(sim,ctx,LH,k){tqLad(ctx,k,[['65°, μ = 0.30',700],'Friction needed: '+n0(emMet(sim,'fn'))+' N','Friction available: '+n0(emMet(sim,'fm'))+' N',[String(emMet(sim,'lst')),700,13,emMet(sim,'lst')==='Slips'?TQ_R:TQ_G]],LH);} },
    { key: 'steep', lvl: 'ap', title: 'Set it steeper', set: { mode: 'ladder', lang: 75, mu: 0.3, x: 0 }, fresh: true, speed: 1, run(sim){emAct(sim,'climb');},
      see: 'Same floor, same climber, but the ladder stands at 75°. The climber reaches the top and it holds.',
      why: 'A steeper ladder puts the climber’s weight closer to above the foot, so the lever arm about the foot is shorter and the wall needs to push less. The friction needed at the top drops to about 190 N.',
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
      see: 'A hoop, a solid disk and a solid ball, all with the same mass and radius, roll down the same 1.5 m drop. The ball wins, the disk comes second and the hoop comes last.',
      why: { bio: 'Rolling means moving forward and spinning at once, and both take energy. Mass far from the center is harder to get spinning, so the hoop spends half its energy on spinning and has less left for speed.', honors: 'Each starts with the same mgh. Rolling KE = ½Mv² + ½Iω². The hoop (I = MR²) splits its energy 50/50; the ball (I = ⅖MR²) keeps 71% for moving forward.' },
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
      see: 'A skater sits on a frictionless spinning stool, holding a weight in each hand at arm’s length. She turns half a revolution per second.',
      why: 'With no friction, nothing outside twists her, so her spin will stay steady. The view from above shows the path of her hands.',
      overlay(sim,ctx,LH,k){roTR(ctx,k,[['Arms out',700],'Spin: '+n2(emMet(sim,'w'))+' rev/s']);} },
    { key: 'in', title: 'Pull the arms in', set: { mode: 'skater' }, fresh: true, speed: 1,
      see: 'Watch her hands: after a moment she pulls them in from 80 cm to 25 cm from the axis. As they come in she speeds up, to about 3.5 times as fast, with no push from anyone.',
      why: { bio: 'Pulling mass toward the center makes her easier to spin. Her “amount of spin” has to stay the same, so she turns faster to make up for it.', honors: 'Moving mass inward cuts her moment of inertia from 4.84 to 1.38 kg·m². Angular momentum L = Iω is conserved, so ω rises by the same factor, from 0.50 to 1.76 rev/s.' },
      so: 'Divers tuck to flip faster and open up to slow down before entering the water.',
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

})();
