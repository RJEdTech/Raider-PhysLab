/* Learn it for the Engineering and Robotics 1 tools: quaketower, gears, botdrive (added Nov 14, 2026).
   Same format as learn.js. Numbers were checked against the sims with tools/probe.py. */
(function(){
'use strict';
const H=BioLab.h,PAL=H.PAL;
const RED='#c8102e',GRN='#1e7d3a';
function card(ctx,k,lines,x,y,w){
  const L=lines.map(l=>{const o=typeof l==='string'?[l]:l;const base=o[2]||12.5,wt=o[1]||500;let sz=base*Math.min(k,1.4);ctx.font=wt+' '+sz+'px '+H.FONT;const tw=ctx.measureText(o[0]).width;if(tw>w-18)sz=Math.max(base*Math.min(k,1.0)*0.8,sz*(w-18)/tw);return {t:o[0],sz,wt,c:o[3]||PAL['cv-ink']};});
  const lh=Math.max(...L.map(o=>o.sz))*1.38,h=8+L.length*lh;
  ctx.save();ctx.globalAlpha=0.97;H.rr(ctx,x,y,w,h,8);ctx.fillStyle=PAL['cv-sol'];ctx.fill();ctx.globalAlpha=1;ctx.lineWidth=1.3;ctx.strokeStyle=PAL['cv-soft'];ctx.stroke();ctx.restore();
  L.forEach((o,j)=>H.txt(ctx,o.t,x+9,y+4+lh*0.78+j*lh,{s:o.sz,w:o.wt,c:o.c}));return h;}
const met=(sim,id)=>{const m=sim.def.metrics.find(x=>x.id===id);return m?m.get(sim):NaN;};
const f1=v=>Number.isFinite(v)?v.toFixed(1):'—',f2=v=>Number.isFinite(v)?v.toFixed(2):'—';
const QT=(ctx,k,L)=>card(ctx,k,L,12,120,250);
const GR=(ctx,k,L)=>card(ctx,k,L,450,70,330);
const BD=(ctx,k,L)=>card(ctx,k,L,548,292,240);
const stat=sim=>{const s=String(met(sim,'status')||'');return [s,700,13.5,/ollap/.test(s)?RED:/anger/.test(s)?'#b8860b':GRN];};

BioLab.addLearn({
quaketower: {
  goals: {
    bio: ['Every structure has a natural rate it sways at', 'Shaking at that rate (resonance) can bring it down', 'How bracing, load and dampers change what happens'],
    honors: ['f_n = (1/2π)√(k/m) for a mass on a spring', 'Why stiffness raises f_n and mass lowers it', 'How a damper limits sway at resonance'],
    ap: ['Driven, damped oscillators and the resonance curve', 'Amplitude ratio 1/(2ζ) at resonance', 'Scaling: stiffness ∝ 1/h³']
  },
  matters: 'Earthquakes don’t knock down buildings at random. A building falls when the ground shakes near its own natural sway rate. Engineers design so the two never match, and add dampers for when they come close.',
  question: 'Your balsa tower survives the shake table at 1.5 Hz. If you turn the table up a little to 2.2 Hz, will it shake a little more, or fall down?',
  startKey: 'calm', startRun: true,
  steps: [
    { key: 'calm', title: 'Gentle shaking', set: { f: 1.5, brace: 'none', load: 0.5 }, fresh: true, speed: 1,
      see: 'The table shakes 1.5 times a second. The top of the tower sways about half a centimeter and settles into a steady rhythm.',
      why: 'The tower follows the table, but it isn’t being pushed at its favorite rate, so the sway stays small.',
      overlay(sim,ctx,LH,k){QT(ctx,k,[['Shaking at 1.5 Hz',700,14],'Tower’s natural rate: '+f2(met(sim,'fn'))+' Hz','Biggest sway: '+f1(met(sim,'peak'))+' cm',stat(sim)]);} },
    { key: 'res', title: 'Resonance', set: { f: 2.2, brace: 'none', load: 0.5 }, fresh: true, speed: 1,
      see: 'At 2.2 Hz the sway grows with every shake. In under 2 seconds it passes 4 cm and the tower collapses.',
      why: { bio: 'This tower naturally sways about 2.2 times a second. Shaking at that same rate is resonance: each push lands at the right moment and adds to the sway, like pushing a swing.', honors: 'f_n = (1/2π)√(120 ÷ 0.65) = 2.16 Hz. The table at 2.2 Hz is almost exactly at f_n, so energy builds every cycle.' },
      overlay(sim,ctx,LH,k){QT(ctx,k,[['Shaking at 2.2 Hz',700,14],'Tower’s natural rate: '+f2(met(sim,'fn'))+' Hz','Biggest sway: '+f1(met(sim,'peak'))+' cm',stat(sim)]);} },
    { key: 'brace', title: 'Brace it', set: { f: 2.2, brace: 'x', load: 0.5 }, fresh: true, speed: 1,
      see: 'Same 2.2 Hz shaking, but now with X-braces. The tower barely moves.',
      why: 'Braces stop the frame from leaning, so it is about 9 times stiffer. Its natural rate jumps to about 6.5 Hz, far from the 2.2 Hz shaking.',
      overlay(sim,ctx,LH,k){QT(ctx,k,[['X-braced, 2.2 Hz',700,14],'Tower’s natural rate: '+f2(met(sim,'fn'))+' Hz','Biggest sway: '+f2(met(sim,'peak'))+' cm',stat(sim)]);} },
    { key: 'load', lvl: 'honors', title: 'Heavy load on top', set: { f: 3.8, brace: 'x', load: 1.8 }, fresh: true, speed: 1,
      see: 'The braced tower now carries 1.8 kg. Its natural rate drops to 3.78 Hz, and shaking at 3.8 Hz brings it down.',
      why: 'f_n = (1/2π)√(k/m). More mass on top lowers f_n: √(1100 ÷ 1.95) ÷ 2π = 3.78 Hz. Bracing helps only if the load doesn’t drag f_n back toward the shaking.',
      overlay(sim,ctx,LH,k){QT(ctx,k,[['1.8 kg on top, 3.8 Hz',700,14],'Tower’s natural rate: '+f2(met(sim,'fn'))+' Hz','Biggest sway: '+f1(met(sim,'peak'))+' cm',stat(sim)]);} },
    { key: 'damp', lvl: 'honors', title: 'Add a damper', set: { f: 2.2, brace: 'none', load: 0.5, damp: true }, fresh: true, speed: 1,
      see: 'The unbraced tower at 2.2 Hz again, now with a damper. The sway grows to about 1.7 cm and stops growing. It survives.',
      why: 'A damper turns some of the sway’s energy into heat every cycle, so the energy can’t keep piling up. Taipei 101 hangs a 660-tonne steel ball for the same reason.',
      overlay(sim,ctx,LH,k){QT(ctx,k,[['Damper on, 2.2 Hz',700,14],'Biggest sway: '+f1(met(sim,'peak'))+' cm',stat(sim)]);} },
    { key: 'tall', lvl: 'ap', title: 'A taller tower', set: { f: 1.5, brace: 'none', load: 0.5, h: 80 }, fresh: true, speed: 1,
      see: 'An 80 cm tower at 1.5 Hz, the shaking the 60 cm tower shrugged off. It collapses.',
      why: 'Stiffness drops as 1/h³: (60/80)³ = 0.42 of the stiffness, so f_n falls by √0.42 to 1.40 Hz, close to 1.5 Hz. Tall buildings sway slowly, which puts them at risk from slow, long earthquake waves.',
      overlay(sim,ctx,LH,k){QT(ctx,k,[['80 cm tall, 1.5 Hz',700,14],'Tower’s natural rate: '+f2(met(sim,'fn'))+' Hz','Biggest sway: '+f1(met(sim,'peak'))+' cm',stat(sim)]);} }
  ],
  useIt: [
    { do: 'When you build your tower, add diagonal braces before adding more sticks to the columns.',
      why: 'A square frame leans easily. A triangle can’t change shape without stretching a stick, so diagonals add far more stiffness per gram than thicker columns.' },
    { do: 'Keep heavy weight low.',
      why: 'Mass high up lowers the natural frequency and makes the top swing farther. Real buildings put heavy equipment in the basement when they can.' },
    { do: 'Test at several shaking speeds, not just one.', lvl: 'honors',
      why: 'A tower that survives one frequency can fail at another. Sweep the table slowly and note where the sway peaks: that is f_n.' }
  ],
  tryIt: [
    { title: 'find a ruler’s natural frequency (5 minutes)',
      steps: ['Hold a ruler flat on a desk with most of it hanging off the edge.', 'Flick the free end and count swings for 5 seconds.', 'Slide the ruler so less hangs off and repeat.'],
      look: 'The shorter overhang vibrates much faster. Shorter means stiffer, and stiffer means a higher natural frequency, the same reason short towers shake quickly and tall ones slowly.' }
  ]
},
gears: {
  goals: {
    bio: ['Gears trade speed for push, or push for speed', 'Gear up to go fast on the flat; gear down to climb', 'Too much of either loses the race'],
    honors: ['Gear ratio G = driven teeth ÷ driver teeth', 'Wheel torque × G, wheel speed ÷ G', 'Comparing push with the resistance to beat'],
    ap: ['A DC motor’s torque–speed line and its peak power at half free speed', 'Ramp resistance mg sin θ + rolling resistance', 'Choosing a ratio to match the load']
  },
  matters: 'Bikes, cars, drills and every competition robot have gears for the same reason: a motor is fastest when nothing slows it, and strongest when it barely turns. Gears let one motor do both jobs.',
  question: 'Two robots have identical motors. One is geared for speed, one for push. Which one wins a sprint, and which one wins a hill climb?',
  startKey: 'even', startRun: true,
  steps: [
    { key: 'even', title: 'Same-size gears', set: { driver: 40, driven: 40, course: 'flat' }, fresh: true, speed: 1,
      see: 'A 40-tooth motor gear drives a 40-tooth wheel gear. The robot finishes the 3 m sprint in about 4.2 s.',
      why: 'With equal gears the wheel turns exactly as fast as the motor: top speed 0.79 m/s.',
      overlay(sim,ctx,LH,k){GR(ctx,k,[['40 → 40 (1 : 1)',700,14],'Top speed: '+f2(met(sim,'vmax'))+' m/s','Finish: '+String(met(sim,'time'))]);} },
    { key: 'up', title: 'Gear up for speed', set: { driver: 40, driven: 20, course: 'flat' }, fresh: true, speed: 1,
      see: 'Now the wheel gear has half the teeth. Each motor turn spins the wheel twice, and the robot finishes in about 2.6 s.',
      why: 'Gearing up doubles the top speed to 1.57 m/s. The trade: the wheels push with half the force.',
      overlay(sim,ctx,LH,k){GR(ctx,k,[['40 → 20 (geared up 1 : 2)',700,14],'Top speed: '+f2(met(sim,'vmax'))+' m/s','Finish: '+String(met(sim,'time'))]);} },
    { key: 'toomuch', title: 'Too much speed', set: { driver: 80, driven: 20, course: 'flat' }, fresh: true, speed: 1,
      see: 'Geared up 1 : 4, the top speed doubles again, but the robot finishes in about 2.7 s, slightly slower than 1 : 2.',
      why: 'With only a quarter of the push, the robot takes so long to speed up that it never uses its high top speed on a short course.',
      overlay(sim,ctx,LH,k){GR(ctx,k,[['80 → 20 (geared up 1 : 4)',700,14],'Top speed: '+f2(met(sim,'vmax'))+' m/s','Finish: '+String(met(sim,'time'))]);} },
    { key: 'stall', title: 'The ramp', set: { driver: 40, driven: 20, course: 'ramp' }, fresh: true, speed: 1,
      see: 'The sprint winner tries the 20° ramp. It stalls.',
      why: { bio: 'Climbing takes much more push than rolling on the flat. Geared up, this robot doesn’t have enough.', honors: 'The wheels push 10.8 N, but gravity along the ramp plus rolling resistance take 11.4 N. Push less than resistance means no climb.' },
      overlay(sim,ctx,LH,k){GR(ctx,k,[['40 → 20 on the ramp',700,14],'Push: '+f1(met(sim,'F'))+' N',['Resistance: '+f1(met(sim,'R'))+' N',700,13,RED],String(met(sim,'time'))]);} },
    { key: 'down', title: 'Gear down to climb', set: { driver: 20, driven: 40, course: 'ramp' }, fresh: true, speed: 1,
      see: 'Flip the gears: 20-tooth motor gear, 40-tooth wheel gear. The robot climbs the ramp in about 7 s.',
      why: 'Gearing down 2 : 1 doubles the push to 43 N, far more than the 11.4 N the ramp takes. It climbs slowly, but it climbs.',
      overlay(sim,ctx,LH,k){GR(ctx,k,[['20 → 40 (geared down 2 : 1)',700,14],'Push: '+f1(met(sim,'F'))+' N','Resistance: '+f1(met(sim,'R'))+' N','Finish: '+String(met(sim,'time'))]);} },
    { key: 'just', lvl: 'honors', title: 'Just enough push', set: { driver: 40, driven: 40, course: 'ramp' }, fresh: true, speed: 1,
      see: 'At 1 : 1 the robot pushes 21.6 N and climbs in about 5.5 s, faster than the 2 : 1 robot.',
      why: 'The best ratio gives enough push to beat the resistance with room to spare, and no more. Extra push you don’t need costs top speed.',
      overlay(sim,ctx,LH,k){GR(ctx,k,[['40 → 40 on the ramp',700,14],'Push: '+f1(met(sim,'F'))+' N','Resistance: '+f1(met(sim,'R'))+' N','Finish: '+String(met(sim,'time'))]);} }
  ],
  useIt: [
    { do: 'On a bike, shift to an easier (lower) gear before a hill, not halfway up.',
      why: 'The easy gear is “geared down”: more push at the pedals for each push of your legs. Shifting under heavy load can slip the chain.' },
    { do: 'For a racing robot, start geared up and test it on the real course.',
      why: 'If it can’t accelerate or stalls on bumps, gear down one step. The course decides the best ratio, not the motor.' },
    { do: 'Count teeth to find the ratio: driven ÷ driver.', lvl: 'honors',
      why: 'A 12-tooth gear driving a 36-tooth gear is 3 : 1: three times the torque and one third the speed at the wheel.' }
  ],
  tryIt: [
    { title: 'gears on your bike (10 minutes)',
      steps: ['Count the teeth on the front chainring and the rear cog in your easiest gear.', 'Do the same in your hardest gear.', 'Ride up a short slope in each.'],
      look: 'In the easy gear the rear cog is big compared with the front, so each pedal turn moves you a little with a lot of force. In the hard gear one pedal turn spins the wheel several times: fast, but tough to push uphill.' }
  ]
},
botdrive: {
  goals: {
    bio: ['A robot only knows “run the motors this hard for this long”', 'Use time = distance ÷ speed to set each line', 'Fix one line at a time when you miss'],
    honors: ['Wheel speed = rpm × πD', 'Spin turns: wheels run opposite ways, ω = 2v/W', 'Why small motor differences make a robot drift'],
    ap: ['Dead reckoning: position from speed, heading and time', 'How battery and wheel size change every distance', 'Why encoders and sensors beat timing']
  },
  matters: 'Every robot in a Robotics 1 obstacle course starts with timed driving. Getting the times right is just speed, distance and time, the same math as your first physics unit.',
  question: 'Your robot has to drive 2.2 m, turn left and drive 1.2 m. Can you get the times right on the first try?',
  startKey: 'guess', startRun: true,
  steps: [
    { key: 'guess', title: 'Guessing', set: { t1: 2, t2: 0.5, t3: 1 }, fresh: true, speed: 1,
      see: 'A guessed program: forward 2 s, spin 0.5 s, forward 1 s. The robot stops short, turns too little and misses.',
      why: 'Guessing works only by luck. To get it right you need the robot’s speed.',
      overlay(sim,ctx,LH,k){BD(ctx,k,[['Guessed times',700,14],'Missed by '+f2(met(sim,'miss'))+' m']);} },
    { key: 'speed', title: 'Find the speed', set: { t1: 2.8, t2: 0, t3: 0 }, fresh: true, speed: 1,
      see: 'Line 1 now runs 2.80 s. The robot stops right below the target.',
      why: { bio: 'At full power the robot covers 0.785 m every second. 2.2 m ÷ 0.785 m/s = 2.80 s.', honors: 'The 10 cm wheel rolls π × 0.10 = 0.314 m per turn at 2.5 turns per second (150 rpm): 0.785 m/s. 2.2 ÷ 0.785 = 2.80 s.' },
      overlay(sim,ctx,LH,k){BD(ctx,k,[['Line 1: 2.80 s',700,14],'Speed: '+f2(met(sim,'v'))+' m/s','x = '+f2(sim.st.x)+' m (target 2.50)']);} },
    { key: 'turn', title: 'Time the turn', set: { t1: 2.8, t2: 0.6, t3: 0 }, fresh: true, speed: 1,
      see: 'Line 2 spins the robot for 0.60 s. It ends facing straight up at the target.',
      why: 'Spinning at half power, the robot turns 150° every second. 90° ÷ 150°/s = 0.60 s.',
      overlay(sim,ctx,LH,k){BD(ctx,k,[['Line 2: 0.60 s',700,14],'Spin rate: '+Math.round(met(sim,'turn'))+'°/s','Heading: '+Math.round(sim.st.h*180/Math.PI)+'°']);} },
    { key: 'hit', title: 'The whole program', set: { t1: 2.8, t2: 0.6, t3: 1.55 }, fresh: true, speed: 1,
      see: 'Line 3 drives 1.2 m ÷ 0.785 m/s ≈ 1.53 s (1.55 s in the code). The robot lands in the target.',
      why: 'Every line came from the same idea: time = distance ÷ speed, or angle ÷ turn rate. Computing first and testing second beats trial and error.',
      overlay(sim,ctx,LH,k){BD(ctx,k,[['wait(2800) · wait(600) · wait(1550)',700,13],String(met(sim,'result')),'Off center: '+f2(met(sim,'miss'))+' m']);} },
    { key: 'drift', lvl: 'honors', title: 'Real motors drift', set: { t1: 2.8, t2: 0.6, t3: 1.55, mis: true }, fresh: true, speed: 1,
      see: 'Same program, but the right motor runs 2% slower. The robot curves right and misses by about 0.28 m.',
      why: 'The slower right wheel turns the robot clockwise the whole time it drives: about 8° over the first straight. Timing can’t see that. A gyro or a line sensor can.',
      overlay(sim,ctx,LH,k){BD(ctx,k,[['Right motor 2% weaker',700,14],String(met(sim,'result')),'Off center: '+f2(met(sim,'miss'))+' m']);} },
    { key: 'batt', lvl: 'ap', title: 'A tired battery', set: { t1: 2.8, t2: 0.6, t3: 1.55, batt: 85 }, fresh: true, speed: 1,
      see: 'With the motors at 85% speed the same program falls short on every line.',
      why: 'Every distance and angle is speed × time, so all of them shrink by 15%. Encoders count wheel turns, so the robot drives by distance, not by time, and the battery stops mattering.',
      overlay(sim,ctx,LH,k){BD(ctx,k,[['Battery at 85%',700,14],String(met(sim,'result')),'Off center: '+f2(met(sim,'miss'))+' m']);} }
  ],
  useIt: [
    { do: 'Measure your robot’s speed before writing the program: time it over 2 m with a phone stopwatch.',
      why: 'Speed = 2 m ÷ time. With that one number you can compute every straight in the course.' },
    { do: 'Change one line at a time when tuning.',
      why: 'If you change two numbers and it gets better, you don’t know which one helped.' },
    { do: 'Charge the battery before competition runs, or switch to encoder distances.', lvl: 'honors',
      why: 'A timed program tuned on a full battery undershoots on a tired one.' }
  ],
  tryIt: [
    { title: 'be the robot (5 minutes)',
      steps: ['Walk 5 m at a steady pace and time it.', 'Work out your speed, then pick a spot 8 m away.', 'Close your eyes and walk for the time you computed.'],
      look: 'You land close, but not exactly on the spot. That is dead reckoning: good enough to get near, which is why robots use sensors for the last bit.' }
  ]
}
});
})();
