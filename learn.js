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

})();
