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
})();
