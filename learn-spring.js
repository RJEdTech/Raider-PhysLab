/* Learn it for the spring 2027 PhysLab tools (added Nov 14, 2026). Same format as learn.js
   (see BioLab learn.js for the field reference). */
(function(){
'use strict';
const H=BioLab.h,PAL=H.PAL;
const RED='#c8102e',BLU='#1f5fbf',GRN='#1e7d3a';
function card(ctx,k,lines,x,y,w){
  const L=lines.map(l=>{const o=typeof l==='string'?[l]:l;const base=o[2]||12.5,wt=o[1]||500;let sz=base*Math.min(k,1.4);ctx.font=wt+' '+sz+'px '+H.FONT;const tw=ctx.measureText(o[0]).width;if(tw>w-18)sz=Math.max(base*Math.min(k,1.0)*0.8,sz*(w-18)/tw);return {t:o[0],sz,wt,c:o[3]||PAL['cv-ink']};});
  const lh=Math.max(...L.map(o=>o.sz))*1.38,h=8+L.length*lh;
  ctx.save();ctx.globalAlpha=0.97;H.rr(ctx,x,y,w,h,8);ctx.fillStyle=PAL['cv-sol'];ctx.fill();ctx.globalAlpha=1;ctx.lineWidth=1.3;ctx.strokeStyle=PAL['cv-soft'];ctx.stroke();ctx.restore();
  L.forEach((o,j)=>H.txt(ctx,o.t,x+9,y+4+lh*0.78+j*lh,{s:o.sz,w:o.wt,c:o.c}));return h;}
const met=(sim,id)=>{const m=sim.def.metrics.find(x=>x.id===id);return m?m.get(sim):NaN;};
const f1=v=>Number.isFinite(v)?v.toFixed(1):'—',f2=v=>Number.isFinite(v)?v.toFixed(2):'—',f0=v=>Number.isFinite(v)?Math.round(v).toLocaleString('en-US'):'—';
function actAt(sim,tau,id,at){const key='_ls_'+id;if(sim[key]===sim.lnT0)return;if(tau<(at||0))return;sim[key]=sim.lnT0;const a=(sim.def.actions||[]).find(z=>z.id===id);if(a)a.run(sim);}
const CO=(ctx,k,L)=>card(ctx,k,L,470,62,316);
const ST=(ctx,k,L)=>card(ctx,k,L,300,300,230);
const EF=(ctx,k,L)=>card(ctx,k,L,12,12,262);

BioLab.addLearn({
coulomb: {
  goals: {
    bio: ['Like charges repel and opposite charges attract', 'The force gets much weaker with distance', 'How a rubbed balloon can charge things without touching'],
    honors: ['Coulomb’s law, F = k|q₁q₂|/r²', 'Why the forces on the two charges are always equal and opposite', 'The inverse-square law in numbers'],
    ap: ['Superposition: adding forces from several charges', 'Finding the point where the net force is zero', 'Scaling arguments with q and r']
  },
  matters: 'Static cling, a phone’s touchscreen, laser printers and the bonds that hold every molecule together are all the same force: the push and pull between electric charges.',
  question: 'Two small charged spheres are 10 cm apart. If you pull them to 20 cm apart, does the force between them drop to half, or to something else?',
  startKey: 'attract', startRun: false,
  steps: [
    { key: 'attract', title: 'Opposites attract', set: { mode: 'two', q1: 3, q2: -2, r: 10 }, fresh: true, pause: true,
      see: 'A +3.0 μC charge and a −2.0 μC charge sit 10 cm apart. Orange arrows show the pull on each: 5.39 N toward each other.',
      why: 'Opposite charges attract. 5.39 N is about the weight of a 550 g textbook, from charges you could build up by rubbing a balloon. Notice both arrows are the same length.',
      overlay(sim,ctx,LH,k){CO(ctx,k,[['+3.0 μC and −2.0 μC',700,14],String(met(sim,'kind')||''),['Force on each: '+f2(met(sim,'F'))+' N',700,13.5,RED]]);} },
    { key: 'repel', title: 'Likes repel', set: { mode: 'two', q1: 3, q2: 2, r: 10 }, fresh: true, pause: true,
      cause: { from: { q2: -2 }, delay: 1, dur: 2, label: 'Charge q₂', ring: [380, 110, 46] },
      see: 'q₂ slides from −2 μC through zero to +2 μC. The arrows shrink to nothing, flip, and grow back pointing apart.',
      why: 'The force’s direction depends on the signs. At q₂ = 0 there is no force at all. Same size charges, same distance, same 5.39 N, but now they push apart.',
      overlay(sim,ctx,LH,k){CO(ctx,k,[['q₂ = '+(sim.p.q2>0?'+':'')+sim.p.q2.toFixed(1)+' μC',700,14],String(met(sim,'kind')||''),'Force on each: '+f2(met(sim,'F'))+' N']);} },
    { key: 'far', title: 'Twice as far: a quarter of the force', set: { mode: 'two', q1: 3, q2: -2, r: 20 }, fresh: true, pause: true,
      cause: { from: { r: 10 }, delay: 1, dur: 2.5, label: 'Distance apart', ring: [400, 330, 50] },
      see: 'The charges move from 10 cm to 20 cm apart. The force falls from 5.39 N to 1.35 N.',
      why: { bio: 'Doubling the distance cuts the force to one quarter, not one half. Electric force fades very quickly with distance, which is why a balloon has to be close to pick up hair.', honors: 'F ∝ 1/r². Twice the distance: (1/2)² = 1/4 of the force. 5.39 ÷ 4 = 1.35 N.' },
      overlay(sim,ctx,LH,k){CO(ctx,k,[['r = '+sim.p.r.toFixed(1)+' cm',700,14],['Force: '+f2(met(sim,'F'))+' N',700,13.5,RED],'(at 10 cm: 5.39 N)']);} },
    { key: 'close', title: 'Half as far: four times the force', set: { mode: 'two', q1: 3, q2: -2, r: 5 }, fresh: true, pause: true,
      cause: { from: { r: 10 }, delay: 1, dur: 2.5, label: 'Distance apart', ring: [400, 330, 50] },
      see: 'Now they move in to 5 cm. The force jumps to 21.6 N.',
      why: 'Half the distance means (2)² = 4 times the force. Up close, electric forces get very strong, strong enough to hold atoms together in molecules.',
      overlay(sim,ctx,LH,k){CO(ctx,k,[['r = '+sim.p.r.toFixed(1)+' cm',700,14],['Force: '+f2(met(sim,'F'))+' N',700,13.5,RED],'(at 10 cm: 5.39 N)']);} },
    { key: 'charge', lvl: 'honors', title: 'Double one charge', set: { mode: 'two', q1: 6, q2: -2, r: 10 }, fresh: true, pause: true,
      cause: { from: { q1: 3 }, delay: 1, dur: 2, label: 'Charge q₁', ring: [120, 110, 46] },
      see: 'q₁ doubles from 3 μC to 6 μC. The force doubles to 10.8 N.',
      why: 'F = k|q₁q₂|/r². The force is proportional to each charge, so doubling one charge doubles the force. Doubling the distance is what cuts it by four.',
      overlay(sim,ctx,LH,k){CO(ctx,k,[['q₁ = +'+sim.p.q1.toFixed(1)+' μC',700,14],['Force: '+f2(met(sim,'F'))+' N',700,13.5,RED],'F = k|q₁q₂| / r²']);} },
    { key: 'third', lvl: 'honors', title: 'Big charge, small charge, same force', set: { mode: 'two', q1: 6, q2: -1, r: 10 }, fresh: true, pause: true,
      cause: { from: { q2: -2 }, delay: 1, dur: 1.5, label: 'Charge q₂' },
      see: 'q₁ = +6 μC and q₂ = −1 μC. The arrows on the two charges are still exactly the same length.',
      why: 'Both forces come from the same product q₁q₂, and Newton’s third law says forces come in equal and opposite pairs. The bigger charge doesn’t push harder.',
      overlay(sim,ctx,LH,k){CO(ctx,k,[['Force on q₁: '+f2(met(sim,'F1'))+' N',600,13],'Force on q₂: '+f2(met(sim,'F2'))+' N',['Equal and opposite',700,13,GRN]]);} },
    { key: 'balloon', title: 'Charging without touching', set: { mode: 'static', r: 3 }, fresh: true, pause: true, run(sim){actAt(sim,99,'rub',0);},
      cause: { from: { r: 18 }, delay: 1.2, dur: 3, label: 'Balloon distance' },
      see: 'The balloon is rubbed on hair, picking up extra electrons. As it moves toward the electroscope, the two thin leaves spread apart, though nothing touches.',
      why: 'The balloon’s electrons push the electroscope’s own electrons away, down into the leaves. Both leaves now carry extra negative charge, so they repel each other.',
      overlay(sim,ctx,LH,k){ST(ctx,k,[['Balloon: '+f0(met(sim,'Qb'))+' nC',700,13.5],'Leaves spread: '+f1(met(sim,'leaf'))+'°']);} },
    { key: 'zero', lvl: 'ap', title: 'Where the forces cancel', set: { mode: 'three', q1: 4, q2: 1, r: 12, q3: 1, x3: 8 }, fresh: true, pause: true,
      cause: { from: { x3: 3 }, delay: 1.2, dur: 3, label: 'Position of q₃' },
      see: 'A third charge slides between +4 μC and +1 μC, 12 cm apart. The net force on it shrinks to zero at 8 cm from q₁.',
      why: 'Superposition: add each force as a vector. Zero net force needs kq₁/x² = kq₂/(12 − x)², so 4/x² = 1/(12 − x)², 2(12 − x) = x, x = 8 cm: closer to the smaller charge.',
      overlay(sim,ctx,LH,k){CO(ctx,k,[['q₃ at '+sim.p.x3.toFixed(1)+' cm',700,14],['Net force on q₃: '+f2(met(sim,'F3'))+' N',700,13.5,RED],'Zero point: '+String(met(sim,'eq'))]);} }
  ],
  useIt: [
    { do: 'Touch a metal door frame before you touch a laptop in winter.',
      why: 'Dry Colorado air lets charge build up on you as you walk on carpet. Touching metal first lets it flow away safely, so it doesn’t jump to the electronics.' },
    { do: 'Use a dryer sheet or let clothes hang dry to fight static cling.',
      why: 'Tumbling clothes rub electrons from one fabric to another, and the charged pieces attract. Dryer sheets coat fibers so charge leaks away.' },
    { do: 'Keep a phone screen clean and dry.', lvl: 'honors',
      why: 'Touchscreens sense how your finger changes the electric field near the glass. Water and grime change the field too, which causes ghost taps.' }
  ],
  tryIt: [
    { title: 'the bending water stream (5 minutes)',
      steps: ['Turn on a faucet to a thin, steady stream.', 'Rub a plastic comb or balloon through dry hair about ten times.', 'Bring it close to the stream without touching. Then try it from farther away.'],
      look: 'The stream bends toward the comb, and much less from farther away. The charged comb pulls on charges in the water molecules, and the force drops quickly with distance.' }
  ]
},
efield: {
  goals: {
    bio: ['An electric field shows the push a charge would feel at each point', 'Field lines start on + and end on −', 'Closer lines mean a stronger field'],
    honors: ['E = F/q and the 1/r² field of a point charge', 'Voltage, equipotentials and why moving along one takes no work', 'The uniform field between parallel plates'],
    ap: ['E = V/d for parallel plates', 'W = qΔV and the sign of the work', 'Field adds as vectors, voltage adds as numbers']
  },
  matters: 'Touchscreens, the airbag sensor in a car, the electric field that guides electrons in old TVs and the nerve signals in your body all work by shaping electric fields.',
  question: 'A tiny positive test charge sits 8 cm from a +2 μC charge. Move it to 4 cm away. How much stronger does its push get?',
  startKey: 'one', startRun: false,
  steps: [
    { key: 'one', title: 'A field around one charge', set: { preset: 'single', q: 2, tx: 24, ty: 9, vec: true, lines: true }, fresh: true, pause: true,
      see: 'A +2.0 μC charge sits in the middle. Purple arrows show which way a small positive charge would be pushed at each spot: straight away from it.',
      why: 'The field is a map of the push per unit of charge, at every point. You don’t need a second charge there for the field to exist; it tells you what would happen if one arrived.',
      overlay(sim,ctx,LH,k){EF(ctx,k,[['+2.0 μC source',700,14],'Test charge 8 cm away','Field: '+f0(met(sim,'E'))+' kN/C']);} },
    { key: 'closer', title: 'Closer means stronger', set: { preset: 'single', q: 2, tx: 20, ty: 9 }, fresh: true, pause: true,
      cause: { from: { tx: 24 }, delay: 1, dur: 2.5, label: 'Test charge position' },
      see: 'The test charge slides from 8 cm to 4 cm away. The field it feels jumps from about 2,810 to 11,200 kN/C, four times as strong.',
      why: 'Field lines spread out as they leave the charge, so they are packed closest near it. For a point charge E ∝ 1/r²: half the distance, four times the field.',
      overlay(sim,ctx,LH,k){EF(ctx,k,[['r = '+f1(met(sim,'r'))+' cm',700,14],['Field: '+f0(met(sim,'E'))+' kN/C',700,13.5,RED],'(at 8 cm: 2,810)']);} },
    { key: 'neg', title: 'A negative source', set: { preset: 'single', q: -2, tx: 24, ty: 9 }, fresh: true, pause: true,
      cause: { from: { q: 2 }, delay: 1, dur: 2, label: 'Source charge', ring: [400, 225, 40] },
      see: 'The source changes from +2 to −2 μC. Every arrow flips to point inward, and the test charge is now pulled left, toward the source.',
      why: 'A positive test charge is pushed away from + charges and pulled toward − charges. Same size charge, same distance, same strength: only the direction changes.',
      overlay(sim,ctx,LH,k){EF(ctx,k,[['Source: '+(sim.p.q>0?'+':'')+sim.p.q.toFixed(1)+' μC',700,14],'Push: '+String(met(sim,'dir')||'')]);} },
    { key: 'dipole', title: 'Lines run from + to −', set: { preset: 'dipole', q: 2, tx: 16, ty: 9, lines: true }, fresh: true, pause: true,
      see: 'A + and a − charge side by side. The field lines leave the + charge and curve around into the − charge.',
      why: 'Field lines always start on positive charge and end on negative charge. Between the two charges the arrows from both point the same way, so the field there is strong.',
      overlay(sim,ctx,LH,k){EF(ctx,k,[['+ and − pair',700,14],'Midpoint field: '+f0(met(sim,'E'))+' kN/C','Push: '+String(met(sim,'dir')||'')]);} },
    { key: 'equip', lvl: 'honors', title: 'Voltage and equipotentials', set: { preset: 'single', q: 2, tx: 24, ty: 9, vx: 16, vy: 17, eq: true }, fresh: true, pause: true,
      cause: { from: { vx: 28, vy: 9 }, delay: 1, dur: 2.5, label: 'Voltage probe' },
      see: 'Colored rings show equal voltage. The probe slides around to a spot also 8 cm from the charge, on the same ring: 225 kV, the same as the test charge.',
      why: 'Every point on an equipotential has the same voltage, so ΔV = 0 and moving a charge along it takes no work (W = qΔV = 0). Field lines always cross equipotentials at right angles.',
      overlay(sim,ctx,LH,k){EF(ctx,k,[['Test charge: '+String(met(sim,'Vt')),600,13],'Probe: '+String(met(sim,'Vp')),['ΔV = '+String(met(sim,'dV'))+', W = '+String(met(sim,'W')),700,13,GRN]]);} },
    { key: 'plates', lvl: 'honors', title: 'A uniform field', set: { preset: 'plates', pv: 100, d: 10, tx: 20, ty: 9, lines: true }, fresh: true, pause: true,
      cause: { from: { tx: 12 }, delay: 1, dur: 2.5, label: 'Test charge position' },
      see: 'Between two charged plates the field lines are straight, parallel and evenly spaced. As the test charge moves across, the field stays 1.0 kN/C.',
      why: 'Between large parallel plates the field is the same everywhere. That steady push is how inkjet printers steer charged ink drops and how a capacitor stores energy.',
      overlay(sim,ctx,LH,k){EF(ctx,k,[['100 V across 10 cm',700,14],'Field: '+f1(met(sim,'E'))+' kN/C everywhere','Voltage here: '+String(met(sim,'Vt'))]);} },
    { key: 'vd', lvl: 'ap', title: 'E = V/d', set: { preset: 'plates', pv: 100, d: 5, tx: 16, ty: 9, eq: true }, fresh: true, pause: true,
      cause: { from: { d: 10 }, delay: 1, dur: 2.5, label: 'Plate separation' },
      see: 'The plates move from 10 cm to 5 cm apart, still at 100 V. The equipotential lines crowd together and the field doubles to 2.0 kN/C.',
      why: 'E = V/d: the same 100 V drops over half the distance, so each centimeter carries twice the voltage change. 100 V ÷ 0.050 m = 2000 V/m = 2.0 kN/C.',
      overlay(sim,ctx,LH,k){EF(ctx,k,[['d = '+sim.p.d+' cm',700,14],['E = '+f1(met(sim,'E'))+' kN/C',700,13.5,RED],'= 100 V ÷ '+(sim.p.d/100).toFixed(2)+' m']);} },
    { key: 'work', lvl: 'ap', title: 'Work = qΔV', set: { preset: 'single', q: 2, tx: 24, ty: 9, vx: 28, vy: 9, eq: true }, fresh: true, pause: true,
      cause: { from: { vx: 24 }, delay: 1, dur: 2, label: 'Voltage probe' },
      see: 'The probe moves outward from 8 cm to 12 cm, dropping from 225 kV to 150 kV.',
      why: 'Moving a +1 nC charge from the test point to the probe: ΔV = −74.9 kV, so the work you do is qΔV = −7.5 × 10⁻⁵ J. Negative: the field does the work, pushing the charge outward.',
      overlay(sim,ctx,LH,k){EF(ctx,k,[['ΔV = '+String(met(sim,'dV')),700,14],['W = '+String(met(sim,'W')),700,13.5,RED]]);} },
    { key: 'hook', title: 'Your question: when does it spark?', set: { preset: 'single', q: 2, tx: 23.5, ty: 9 }, fresh: true,
      cause: { from: { tx: 31 }, delay: 0.6, dur: 3, label: 'Test charge across' },
      see: 'Slide toward the +2 μC charge. At 8 cm the field is about 2,800 kN/C; at 7.5 cm it passes 3,000 kN/C, enough to make air spark.',
      why: 'E = kq/r², so r = √(kq/E) = √(8.99 × 10⁹ × 2 × 10⁻⁶ ÷ 3 × 10⁶) ≈ 7.7 cm. Your finger concentrates the field near a doorknob in the same way, so the shock jumps the last few millimeters.',
      overlay(sim,ctx,LH,k){EF(ctx,k,[['Distance: '+f1(met(sim,'r'))+' cm',700,14],['Field: '+f0(met(sim,'E'))+' kN/C',700,13,met(sim,'E')>3000?RED:PAL['cv-ink']],'Air sparks above 3,000 kN/C']);} }
  ],
  useIt: [
    { do: 'Stay low and away from tall, lone objects if you are caught outside in a thunderstorm, and get inside when you can.',
      why: 'A storm cloud builds a huge electric field over the ground. Tall, pointed objects concentrate it, which is where lightning tends to strike.' },
    { do: 'Notice that a touchscreen needs your bare finger or a special stylus.',
      why: 'The screen keeps a weak electric field over the glass. Your conductive finger changes that field at one spot; a plastic pen or thick glove doesn’t.' },
    { do: 'Respect the warning stickers inside electronics like microwave ovens and old TVs.', lvl: 'honors',
      why: 'Their capacitors can hold thousands of volts long after unplugging. A large ΔV can push a dangerous current through your body.' }
  ],
  tryIt: [
    { title: 'the hair and balloon field map (5 minutes)',
      steps: ['Rub a balloon on your hair or a wool sweater about 15 times.', 'Hold it a few centimeters above someone’s hair (or a pile of tiny paper bits) and move it slowly closer.', 'Try holding it at different angles and distances.'],
      look: 'Hair strands and paper bits line up and point toward the balloon, stronger the closer it gets. They trace out the electric field around it, like the arrows in the lab.' }
  ]
}
});
/* ---- Feb–Mar units: waves, sound, pendulum, capacitor, circuit (added Nov 14, 2026) ---- */
const WV=(ctx,k,L)=>card(ctx,k,L,430,44,300);
const WV2=(ctx,k,L)=>card(ctx,k,L,636,40,158);
const PD=(ctx,k,L)=>card(ctx,k,L,400,140,182);
const SW=(ctx,k,L)=>card(ctx,k,L,500,42,290);
const DP=(ctx,k,L)=>card(ctx,k,L,470,80,300);
const BT=(ctx,k,L)=>card(ctx,k,L,120,4,330);
const TB=(ctx,k,L)=>card(ctx,k,L,12,8,300);
const CP=(ctx,k,L)=>card(ctx,k,L,562,8,228);
const CI=(ctx,k,L)=>card(ctx,k,L,430,354,300);
const per=sim=>{const v=met(sim,'period');return v>0?'Period: '+f2(v)+' s':'Period: timing…';};
const pulseAt=(sim,tau,at)=>actAt(sim,tau,'pulse',at);

BioLab.addLearn({
waves: {
  goals: {
    bio: ['A wave carries energy along the rope, not the rope itself', 'Higher frequency means shorter waves', 'What happens when a wave hits the end'],
    honors: ['v = fλ, and what sets the speed: v = √(T/μ)', 'Fixed ends flip a reflection; loose ends don’t', 'Standing waves from two waves passing through each other'],
    ap: ['Harmonics on a clamped rope: fₙ = nv/2L', 'Counting nodes and antinodes', 'Why only certain frequencies make standing waves']
  },
  matters: 'Guitar strings, microwaves, earthquakes and the Wi-Fi in this room are all waves. They follow the same rules you can see on a rope.',
  question: 'If you shake a rope faster, do the waves travel faster, or do they just get shorter?',
  startKey: 'pulse', startRun: true,
  steps: [
    { key: 'pulse', title: 'One pulse', set: { mode: 'pulse', end: 'none', freq: 1, tension: 1 }, fresh: true, speed: 0.5,
      run(sim){pulseAt(sim,99,0);},
      see: 'A single bump travels down the 3 m rope and leaves at the far end. Each bead only goes up and back down.',
      why: 'The wave moves along the rope; the rope itself doesn’t. What travels is energy. At this tension the bump moves 2 m every second.',
      overlay(sim,ctx,LH,k){WV(ctx,k,[['One pulse, no end',700,14],'Wave speed: '+f2(met(sim,'speed'))+' m/s','3 m takes 1.5 s']);} },
    { key: 'fixed', title: 'Bounce off a clamped end', set: { mode: 'pulse', end: 'fixed', freq: 1, tension: 1 }, fresh: true, speed: 0.5,
      run(sim){pulseAt(sim,99,0);},
      see: 'Now the far end is clamped. The bump hits it and comes back upside down.',
      why: 'The clamp can’t move, so it pulls the rope down as hard as the wave pulls it up. That downward pull sends back an upside-down pulse.',
      overlay(sim,ctx,LH,k){WV(ctx,k,[['Clamped end',700,14],'Reflection comes back',['upside down',700,13,RED]]);} },
    { key: 'loose', lvl: 'honors', title: 'Bounce off a loose end', set: { mode: 'pulse', end: 'loose', freq: 1, tension: 1 }, fresh: true, speed: 0.5,
      run(sim){pulseAt(sim,99,0);},
      see: 'With a loose ring on a pole, the pulse comes back right side up.',
      why: 'The ring is free to slide, so the end overshoots upward and the reflection keeps its shape. Sound in a tube does the same at an open end.',
      overlay(sim,ctx,LH,k){WV(ctx,k,[['Loose ring',700,14],'Reflection comes back',['right side up',700,13,GRN]]);} },
    { key: 'train', title: 'A steady wave', set: { mode: 'osc', end: 'none', freq: 1, tension: 1 }, fresh: true, speed: 1,
      see: 'The oscillator shakes the end once a second. Crests are 2.0 m apart.',
      why: { bio: 'Each shake makes one wave. In one second the first crest moves 2 m, so the waves are 2 m long.', honors: 'v = fλ: 2.0 m/s = 1.0 Hz × 2.0 m.' },
      overlay(sim,ctx,LH,k){WV(ctx,k,[['f = '+sim.p.freq.toFixed(2)+' Hz',700,14],'Wavelength: '+f2(met(sim,'lambda'))+' m','Speed: '+f2(met(sim,'speed'))+' m/s']);} },
    { key: 'faster', title: 'Shake faster', set: { mode: 'osc', end: 'none', freq: 2, tension: 1 }, fresh: true, speed: 1,
      cause: { from: { freq: 1 }, delay: 0.8, dur: 2, label: 'Frequency' },
      see: 'The frequency doubles to 2 Hz. The waves get half as long, 1.0 m, but the speed stays 2.0 m/s.',
      why: 'Speed depends on the rope, not on your hand. Shake faster and you just pack more, shorter waves into the same distance.',
      overlay(sim,ctx,LH,k){WV(ctx,k,[['f = '+sim.p.freq.toFixed(2)+' Hz',700,14],'Wavelength: '+f2(met(sim,'lambda'))+' m',['Speed: '+f2(met(sim,'speed'))+' m/s (same)',700,13,GRN]]);} },
    { key: 'tight', lvl: 'honors', title: 'Pull the rope tighter', set: { mode: 'osc', end: 'none', freq: 1, tension: 4 }, fresh: true, speed: 1,
      cause: { from: { tension: 1 }, delay: 0.8, dur: 2, label: 'Tension' },
      see: 'Four times the tension. The speed doubles to 4.0 m/s and, at the same 1 Hz, the waves are 4.0 m long.',
      why: 'v = √(T/μ). Four times the tension gives √4 = 2 times the speed. That’s why tightening a guitar string raises its pitch.',
      overlay(sim,ctx,LH,k){WV(ctx,k,[['Tension '+sim.p.tension.toFixed(2)+' N',700,14],'Speed: '+f2(met(sim,'speed'))+' m/s','Wavelength: '+f2(met(sim,'lambda'))+' m']);} },
    { key: 'stand', lvl: 'honors', title: 'A standing wave', set: { mode: 'osc', end: 'fixed', freq: 0.67, tension: 1 }, fresh: true, speed: 1,
      see: 'Clamp the end and shake at 0.67 Hz. The reflection and the new waves overlap into a wave that stands still: a still point in the middle and two big loops.',
      why: 'The still points are nodes, where the two waves always cancel. The loops are antinodes. This only happens at special frequencies: here the rope holds exactly one wavelength, 3 m.',
      overlay(sim,ctx,LH,k){WV2(ctx,k,[['2nd harmonic',700,14],'f = 0.67 Hz','λ = '+f1(met(sim,'lambda'))+' m = L','Loops: 2']);} },
    { key: 'third', lvl: 'ap', title: 'The third harmonic', set: { mode: 'osc', end: 'fixed', freq: 1, tension: 1 }, fresh: true, speed: 1,
      see: 'At 1.0 Hz the clamped rope settles into three loops.',
      why: 'fₙ = nv/2L. With v = 2 m/s and L = 3 m, f₁ = 0.33 Hz, so f₃ = 1.0 Hz. Between harmonics the reflections don’t line up and no clean pattern forms.',
      overlay(sim,ctx,LH,k){WV2(ctx,k,[['3rd harmonic',700,14],'f = 1.00 Hz','f₁ = '+f2(met(sim,'f1'))+' Hz','fₙ = n × f₁']);} }
  ],
  useIt: [
    { do: 'Tighten a guitar or ukulele string to raise its pitch, or press it shorter.',
      why: 'Tighter means faster waves; shorter means a shorter wavelength fits. Both raise the frequency.' },
    { do: 'When you feel a stadium wave go by, notice that nobody runs around the stadium.',
      why: 'Each person just stands up and sits down. The pattern travels. That is every wave.' }
  ],
  tryIt: [
    { title: 'a jump-rope standing wave (5 minutes, with a partner)',
      steps: ['Tie one end of a long rope or slinky to a doorknob, or have a partner hold it still.', 'Shake your end slowly until one big loop forms.', 'Shake about twice as fast to make two loops, then three.'],
      look: 'Only certain shaking rates make a clean pattern. Two loops needs twice the frequency of one: those are the harmonics.' }
  ]
},
sound: {
  goals: {
    bio: ['Sound is air being squeezed and stretched', 'Pitch is frequency; loudness is how hard the air is squeezed', 'Why a passing siren changes pitch'],
    honors: ['v = fλ for sound, and why speed depends on the material', 'Predicting the Doppler shift', 'Beats: |f₁ − f₂|'],
    ap: ['Standing waves in tubes: closed L = λ/4, open L = λ/2', 'Resonant frequencies from tube length', 'Speed of sound from a resonance tube']
  },
  matters: 'Your voice, music, ultrasound scans and police radar all depend on how sound travels. A passing ambulance’s pitch drop is the same Doppler effect astronomers use to measure how fast galaxies move.',
  question: 'An ambulance passes you. Its siren drops in pitch. Does the siren really change, or is something happening to the sound on its way to you?',
  startKey: 'wave', startRun: true,
  steps: [
    { key: 'wave', title: 'Squeezed air', set: { mode: 'waves', freq: 440, db: 70, medium: 'air' }, fresh: true,
      see: 'The speaker pushes and pulls the air. Molecules bunch up (high pressure) and spread out (low pressure), and that pattern moves to the listener.',
      why: 'Each molecule only jiggles back and forth. The squeeze travels. At 440 Hz in air the squeezes are 0.78 m apart.',
      overlay(sim,ctx,LH,k){SW(ctx,k,[['440 Hz in air',700,14],'Wavelength: '+f2(met(sim,'lambda'))+' m','Speed: '+f0(met(sim,'vsnd'))+' m/s']);} },
    { key: 'pitch', title: 'Higher pitch', set: { mode: 'waves', freq: 880, db: 70, medium: 'air' }, fresh: true,
      cause: { from: { freq: 440 }, delay: 0.6, dur: 2, label: 'Frequency' },
      see: 'Double the frequency to 880 Hz, one octave up. The squeezes are half as far apart, 0.39 m. The speed doesn’t change.',
      why: 'Pitch is frequency. The air sets the speed (343 m/s at 20 °C), so a higher frequency means a shorter wavelength.',
      overlay(sim,ctx,LH,k){SW(ctx,k,[[f0(sim.p.freq)+' Hz',700,14],'Wavelength: '+f2(met(sim,'lambda'))+' m',['Speed: '+f0(met(sim,'vsnd'))+' m/s (same)',700,13,GRN]]);} },
    { key: 'vac', title: 'No air, no sound', set: { mode: 'waves', freq: 440, db: 70, medium: 'vacuum' }, fresh: true,
      see: 'Take the air away. The speaker still moves, but nothing reaches the listener.',
      why: 'Sound needs something to squeeze. In space there is nothing to carry it, which is why real space battles would be silent.',
      overlay(sim,ctx,LH,k){SW(ctx,k,[['Vacuum',700,14],['No sound travels',700,13,RED]]);} },
    { key: 'helium', lvl: 'honors', title: 'Faster in helium and water', set: { mode: 'waves', freq: 440, db: 70, medium: 'helium' }, fresh: true,
      see: 'In helium the same 440 Hz sound travels about 1,000 m/s, and the wavelength stretches to 2.29 m. Water: 1,480 m/s.',
      why: 'Light helium molecules pass the squeeze along faster. The frequency stays 440 Hz (the speaker sets it), so λ = v/f gets longer.',
      overlay(sim,ctx,LH,k){SW(ctx,k,[['440 Hz in helium',700,14],'Speed: '+f0(met(sim,'vsnd'))+' m/s','Wavelength: '+f2(met(sim,'lambda'))+' m']);} },
    { key: 'dopp', title: 'A moving siren', set: { mode: 'doppler', freq: 440, vs: 60, vo: 0, medium: 'air' }, fresh: true,
      see: 'The 440 Hz source moves right at 60 m/s. Wave fronts bunch up ahead and spread out behind.',
      why: { bio: 'The source chases its own waves forward, so they arrive closer together ahead: higher pitch (533 Hz). Behind, they are stretched: lower pitch (375 Hz). The siren itself never changes.', honors: 'f ahead = f·v/(v − vs) = 440 × 343/283 = 533 Hz. Behind: 440 × 343/403 = 375 Hz.' },
      overlay(sim,ctx,LH,k){DP(ctx,k,[['Source at '+f0(sim.p.vs)+' m/s',700,14],['Ahead hears '+f0(met(sim,'fahead'))+' Hz',700,13,BLU],'Behind hears '+f0(met(sim,'fbehind'))+' Hz']);} },
    { key: 'still', title: 'Stand still', set: { mode: 'doppler', freq: 440, vs: 0, vo: 0, medium: 'air' }, fresh: true,
      cause: { from: { vs: 60 }, delay: 0.6, dur: 1.5, label: 'Source speed' },
      see: 'Stop the source. The circles are evenly spaced and both listeners hear 440 Hz.',
      why: 'The shift comes only from motion along the line between source and listener.',
      overlay(sim,ctx,LH,k){DP(ctx,k,[['Source at '+f0(sim.p.vs)+' m/s',700,14],'Ahead hears '+f0(met(sim,'fahead'))+' Hz','Behind hears '+f0(met(sim,'fbehind'))+' Hz']);} },
    { key: 'beats', lvl: 'honors', title: 'Beats', set: { mode: 'beats', freq: 440, f2: 444 }, fresh: true,
      see: 'Two speakers play 440 Hz and 444 Hz. Together the sound swells and fades 4 times a second.',
      why: 'The waves drift in and out of step. In step they add (loud); out of step they cancel (quiet). Beat frequency = |444 − 440| = 4 Hz. Musicians tune by turning a peg until the beats stop.',
      overlay(sim,ctx,LH,k){BT(ctx,k,[['440 Hz + '+f0(sim.p.f2)+' Hz',700,14],'Beats per second: '+f0(met(sim,'fbeat'))]);} },
    { key: 'tube', lvl: 'ap', title: 'A resonance tube', set: { mode: 'tube', tubeEnd: 'closed', tubeL: 0.85, harm: 1 }, fresh: true,
      see: 'A 0.85 m tube closed at one end resonates at 101 Hz: a node at the closed end and an antinode at the open end.',
      why: 'The tube holds a quarter wavelength: λ = 4L = 3.40 m, f = v/λ = 343/3.40 = 101 Hz. Open at both ends it holds half a wavelength, so f doubles to 202 Hz.',
      overlay(sim,ctx,LH,k){TB(ctx,k,[['Closed tube, L = 0.85 m',700,14],'λ = 4L = '+f2(met(sim,'lamT'))+' m','f = '+f0(met(sim,'fres'))+' Hz']);} },
    { key: 'hook', title: 'Your question: the ambulance', set: { mode: 'doppler', freq: 500, vs: 30, vo: 0, medium: 'air' }, fresh: true,
      see: 'A 500 Hz siren passing at 30 m/s (about 67 mph). Coming toward you it sounds like 548 Hz; driving away, 460 Hz.',
      why: 'That drop of almost 90 Hz is about a musical step and a half, which is why the “neee-yowww” is so easy to hear. The siren itself never changes pitch.',
      overlay(sim,ctx,LH,k){DP(ctx,k,[['500 Hz at 30 m/s',700,14],['Coming toward you: '+f0(met(sim,'fahead'))+' Hz',700,13,BLU],'Driving away: '+f0(met(sim,'fbehind'))+' Hz']);} }
  ],
  useIt: [
    { do: 'Count seconds between lightning and thunder, then divide by 3 for kilometers (by 5 for miles).',
      why: 'Light arrives almost instantly. Sound covers about 343 m, roughly a third of a kilometer, each second.' },
    { do: 'Listen to a passing car or train: the pitch drops right as it passes you.',
      why: 'Ahead of you the waves were bunched; after it passes they are stretched. The faster it goes, the bigger the drop.' },
    { do: 'Tune an instrument by listening for beats against a reference note.', lvl: 'honors',
      why: 'When the beats slow down and stop, the two frequencies match.' }
  ],
  tryIt: [
    { title: 'a bottle organ (5 minutes)',
      steps: ['Blow across the top of an empty bottle until it hums.', 'Add some water and blow again.', 'Add more water and repeat.'],
      look: 'More water means a shorter air column and a higher note. The bottle is a tube closed at one end: shorter tube, shorter wavelength, higher frequency.' }
  ]
},
pendulum: {
  goals: {
    bio: ['What changes how long a swing takes, and what doesn’t', 'Timing many swings to get an accurate period', 'Energy trading between motion and height'],
    honors: ['T = 2π√(L/g)', 'Why mass doesn’t matter', 'Finding g from a T² vs. L graph'],
    ap: ['The small-angle approximation and when it fails', 'How far the true period drifts at large angles', 'Damping and energy loss']
  },
  matters: 'Grandfather clocks kept time with pendulums for 300 years. Pendulum timing measured gravity around the world, and the same physics sets the rhythm of your legs when you walk.',
  question: 'A heavy bob and a light bob hang on the same string. Which one swings back and forth faster?',
  startKey: 'base', startRun: true,
  steps: [
    { key: 'base', title: 'One swing', set: { L: 1, mass: 200, theta: 15, planet: 'earth', damp: 0 }, fresh: true, speed: 1,
      see: 'A 1.0 m pendulum swings from 15°. The photogate times each full swing: about 2.0 s.',
      why: 'The period is one full trip, out and back. Timing 10 swings and dividing by 10 cuts your stopwatch error by 10.',
      overlay(sim,ctx,LH,k){PD(ctx,k,[['L = 1.00 m',700,14],per(sim)]);} },
    { key: 'mass', title: 'Five times the mass', set: { L: 1, mass: 1000, theta: 15, planet: 'earth', damp: 0 }, fresh: true, speed: 1,
      see: 'Change the bob from 200 g to 1,000 g. The period stays 2.0 s.',
      why: 'A heavier bob is pulled harder by gravity, but it is also harder to speed up, by exactly the same factor. The two cancel, like a bowling ball and a tennis ball falling together.',
      overlay(sim,ctx,LH,k){PD(ctx,k,[['Mass '+f0(sim.p.mass)+' g',700,14],per(sim),['Same as 200 g',700,13,GRN]]);} },
    { key: 'short', title: 'A quarter of the length', set: { L: 0.25, mass: 200, theta: 15, planet: 'earth', damp: 0 }, fresh: true, speed: 1,
      see: 'Shorten the string to 0.25 m. The period drops to 1.0 s: half, not a quarter.',
      why: { bio: 'Length is what matters. A shorter pendulum swings faster, but you need four times shorter to get twice as fast.', honors: 'T = 2π√(L/g). A quarter of the length gives √¼ = ½ the period.' },
      overlay(sim,ctx,LH,k){PD(ctx,k,[['L = '+f2(sim.p.L)+' m',700,14],per(sim),'(1.00 m: 2.0 s)']);} },
    { key: 'moon', title: 'On the Moon', set: { L: 1, mass: 200, theta: 15, planet: 'moon', damp: 0 }, fresh: true, speed: 1,
      see: 'The same 1.0 m pendulum on the Moon takes about 4.9 s per swing.',
      why: 'Weaker gravity pulls it back more gently, so it swings slowly. g on the Moon is about 1/6 of Earth’s, and √6 ≈ 2.5, so the period is 2.5 times longer.',
      overlay(sim,ctx,LH,k){PD(ctx,k,[['Moon, L = 1.00 m',700,14],per(sim)]);} },
    { key: 'energy', lvl: 'honors', title: 'Trading energy', set: { L: 1, mass: 200, theta: 15, planet: 'earth', damp: 0 }, fresh: true, speed: 0.5,
      see: 'Watch the energy bars. At the ends it is all potential energy; at the bottom it is all kinetic. The total stays the same.',
      why: 'With no air resistance, energy only changes form. That is why the bob rises back to the same height on each side.',
      overlay(sim,ctx,LH,k){PD(ctx,k,[['KE '+f2(met(sim,'ke')*1000)+' mJ',600,13],'PE '+f2(met(sim,'pe')*1000)+' mJ',['Total '+f2(met(sim,'tot')*1000)+' mJ',700,13,GRN]]);} },
    { key: 'damp', lvl: 'honors', title: 'Air resistance', set: { L: 1, mass: 200, theta: 15, planet: 'earth', damp: 0.02 }, fresh: true, speed: 1,
      see: 'Turn on air resistance. Each swing is smaller, but the period stays about 2.0 s.',
      why: 'Friction moves energy into heat, so the swings shrink. The timing barely changes, which is why a pendulum clock keeps good time even as it runs down.',
      overlay(sim,ctx,LH,k){PD(ctx,k,[['Air resistance on',700,14],per(sim),'Heat: '+f1(met(sim,'heat')*1000)+' mJ']);} },
    { key: 'wide', lvl: 'ap', title: 'Big swings', set: { L: 1, mass: 200, theta: 60, planet: 'earth', damp: 0 }, fresh: true, speed: 1,
      see: 'Release from 60°. The period grows to 2.15 s, about 7% longer than T = 2π√(L/g).',
      why: 'The formula assumes sin θ ≈ θ, which holds only for small angles. At 60° the restoring force is weaker than the formula assumes, so the swing takes longer. Keep angles under about 15° for lab data.',
      overlay(sim,ctx,LH,k){PD(ctx,k,[['From 60°',700,14],'Measured: '+per(sim).replace('Period: ',''),'Formula: '+f2(met(sim,'t0'))+' s',['Off by '+f1(met(sim,'dev'))+'%',700,13,RED]]);} }
  ],
  useIt: [
    { do: 'Push a child on a swing once per swing, at the top of the back swing.',
      why: 'Pushing in rhythm with the natural period adds energy every time. That rhythm is set by the chain length, not by the child’s weight.' },
    { do: 'Time 10 swings, not 1, whenever you measure a period.',
      why: 'Your reaction time error is about the same either way, so it gets divided by 10.' }
  ],
  tryIt: [
    { title: 'a phone-charger pendulum (5 minutes)',
      steps: ['Hang keys from a phone charger cable or string, about 25 cm long.', 'Time 10 swings with your phone stopwatch.', 'Make it four times as long (1 m) and time 10 swings again.'],
      look: 'The long pendulum takes about twice as long per swing, not four times. Swap the keys for something heavier: no change.' }
  ]
},
capacitor: {
  goals: {
    bio: ['A capacitor stores charge on two plates', 'Bigger plates or a smaller gap store more', 'It charges fast at first, then slowly'],
    honors: ['C = κε₀A/d and Q = CV', 'The time constant τ = RC', 'Energy stored, U = ½CV²'],
    ap: ['V_C = V₀(1 − e^(−t/RC)) and I = (V₀/R)e^(−t/RC)', '63% after one τ, 99% after five', 'Discharge as exponential decay']
  },
  matters: 'Camera flashes, defibrillators, the touchscreen on your phone and the memory in a computer all use capacitors: a quick place to store charge and release it.',
  question: 'You connect an empty capacitor to a 9 V battery. Does it fill up instantly, or does it take time?',
  startKey: 'plates', startRun: true,
  steps: [
    { key: 'plates', title: 'Two plates and a gap', set: { mode: 'plates', A: 100, d: 2, V: 9, kap: 1 }, fresh: true,
      see: 'A 9 V battery moves charge onto two metal plates 2 mm apart: + on one, − on the other. Nothing crosses the gap.',
      why: 'The battery pulls electrons off one plate and pushes them onto the other until the plates are at 9 V. This one holds 398 pC on each plate.',
      overlay(sim,ctx,LH,k){CP(ctx,k,[['A = 100 cm², d = 2.0 mm',700,14],'Charge: '+f0(met(sim,'Qp'))+' pC','C = '+f1(met(sim,'Cp'))+' pF']);} },
    { key: 'area', title: 'Bigger plates', set: { mode: 'plates', A: 200, d: 2, V: 9, kap: 1 }, fresh: true,
      cause: { from: { A: 100 }, delay: 0.6, dur: 2, label: 'Plate area' },
      see: 'Double the plate area. Capacitance and charge both double.',
      why: 'More area means more room for charge at the same voltage.',
      overlay(sim,ctx,LH,k){CP(ctx,k,[['A = '+f0(sim.p.A)+' cm²',700,14],'C = '+f1(met(sim,'Cp'))+' pF','Charge: '+f0(met(sim,'Qp'))+' pC']);} },
    { key: 'gap', title: 'A wider gap', set: { mode: 'plates', A: 100, d: 4, V: 9, kap: 1 }, fresh: true,
      cause: { from: { d: 2 }, delay: 0.6, dur: 2, label: 'Plate separation' },
      see: 'Double the gap to 4 mm. Capacitance halves to 22 pF.',
      why: { bio: 'Farther apart, the + and − charges pull on each other less, so the plates hold less.', honors: 'C = κε₀A/d: double d, half C. Q = CV, so the charge halves too.' },
      overlay(sim,ctx,LH,k){CP(ctx,k,[['d = '+f1(sim.p.d)+' mm',700,14],'C = '+f1(met(sim,'Cp'))+' pF','Charge: '+f0(met(sim,'Qp'))+' pC']);} },
    { key: 'glass', lvl: 'honors', title: 'Glass in the gap', set: { mode: 'plates', A: 100, d: 2, V: 9, kap: 4.7 }, fresh: true,
      see: 'Slide glass (κ = 4.7) between the plates. Capacitance jumps 4.7 times, to 208 pF.',
      why: 'The glass’s molecules line up against the field and partly cancel it, so the battery can push more charge on at the same 9 V.',
      overlay(sim,ctx,LH,k){CP(ctx,k,[['Glass, κ = 4.7',700,14],'C = '+f0(met(sim,'Cp'))+' pF','Charge: '+f0(met(sim,'Qp'))+' pC']);} },
    { key: 'rc', title: 'Charging takes time', set: { mode: 'rc', sw: 'charge', R: 10, C: 100, V: 9 }, fresh: true, speed: 0.5,
      see: 'An empty 100 μF capacitor charges through a 10 kΩ bulb. The bulb flashes bright, then fades as the capacitor fills.',
      why: 'At first the empty capacitor pushes back with 0 V, so current is high. As it fills, its voltage rises toward 9 V and the current slows to nothing.',
      overlay(sim,ctx,LH,k){CP(ctx,k,[['Charging',700,14],'Capacitor: '+f2(met(sim,'vc'))+' V ('+f0(met(sim,'pct'))+'%)','Current: '+f2(met(sim,'I'))+' mA']);} },
    { key: 'tau', lvl: 'honors', title: 'The time constant', set: { mode: 'rc', sw: 'charge', R: 20, C: 100, V: 9 }, fresh: true, speed: 0.5,
      see: 'Double R to 20 kΩ. Now τ = RC = 2.0 s, and charging takes twice as long.',
      why: 'After one τ the capacitor is 63% full; after 5τ, over 99%. Bigger R slows the current; bigger C needs more charge. Either one stretches τ.',
      overlay(sim,ctx,LH,k){CP(ctx,k,[['τ = RC = '+f1(met(sim,'tau'))+' s',700,14],'t = '+f1(sim.t)+' s','Charged: '+f0(met(sim,'pct'))+'%']);} },
    { key: 'dis', lvl: 'ap', title: 'Discharge', set: { mode: 'rc', sw: 'discharge', R: 10, C: 100, V: 9 }, fresh: true, speed: 0.5,
      run(sim){actAt(sim,99,'full',0);},
      see: 'Start full and flip the switch to bypass the battery. The capacitor drives the bulb by itself and drains to 37% after 1 s.',
      why: 'V_C = V₀e^(−t/RC). Each τ the voltage drops to 1/e ≈ 37% of what it was: exponential decay, like a camera flash recharging in reverse.',
      overlay(sim,ctx,LH,k){CP(ctx,k,[['Discharging, τ = 1.0 s',700,14],'t = '+f1(sim.t)+' s','Capacitor: '+f2(met(sim,'vc'))+' V ('+f0(met(sim,'pct'))+'%)']);} },
    { key: 'hook', title: 'Your question: the camera flash', set: { mode: 'rc', sw: 'charge', R: 100, C: 100, V: 9 }, fresh: true, speed: 4,
      see: '9 V charging 100 μF through 100 kΩ: τ = RC = 10 s. After 10 s it is 63% full, after 30 s about 95%, and only after about 50 s (5τ) is it essentially full.',
      why: 'An exponential never quite finishes, so engineers call 5τ “full.” That wait is why a camera flash makes you pause between shots; flash circuits use small resistances to charge in a second or two.',
      overlay(sim,ctx,LH,k){CP(ctx,k,[['τ = '+f0(met(sim,'tau'))+' s',700,14],'t = '+f0(sim.t)+' s','Charged: '+f0(met(sim,'pct'))+'%']);} }
  ],
  useIt: [
    { do: 'Unplug a device and wait before opening it, even when it’s off.',
      why: 'Capacitors inside power supplies can hold a charge for minutes. TVs and microwave ovens carry warnings for this.' },
    { do: 'Notice the light on a charger fade slowly after you unplug it.',
      why: 'Its capacitor is discharging through the LED: bright at first, then dimmer, just like the bulb here.' }
  ],
  tryIt: [
    { title: 'a phone touchscreen test (2 minutes)',
      steps: ['Tap your screen with a finger, then with a pencil eraser.', 'Try a finger with a thin glove, then a thick one.'],
      look: 'The screen senses the change in capacitance your finger makes. Rubber and thick gloves don’t conduct, so they don’t change it, and nothing happens.' }
  ]
},
circuit: {
  goals: {
    bio: ['A circuit needs a complete loop', 'Series bulbs share the voltage; parallel bulbs each get all of it', 'How to place an ammeter and a voltmeter'],
    honors: ['Ohm’s law, V = IR', 'Equivalent resistance in series and in parallel', 'Why parallel draws more current from the battery'],
    ap: ['Power, P = IV = I²R', 'Combination circuits step by step', 'Short circuits and internal resistance']
  },
  matters: 'Every outlet in your house is wired in parallel, so turning off one lamp doesn’t shut off the fridge. Old holiday lights were wired in series, so one dead bulb killed the whole string.',
  question: 'You add a second bulb to a circuit. Will both bulbs be as bright as one bulb alone was?',
  startKey: 'one', startRun: true,
  steps: [
    { key: 'one', title: 'One bulb', set: { circuit: 'single', volts: 9, am: 'none', vm: 'none', s1: true, s2: true }, fresh: true,
      see: 'A 9 V battery and one 10 Ω bulb. Electrons flow around the loop and the bulb glows. The battery sends out about 0.89 A.',
      why: { bio: 'Current only flows in a complete loop. The battery pushes; the bulb resists and turns the energy into light and heat.', honors: 'I = V/R = 9 V ÷ 10 Ω = 0.9 A (a little less because the battery has a small resistance of its own).' },
      overlay(sim,ctx,LH,k){CI(ctx,k,[['One bulb',700,14],'Current: '+f2(met(sim,'itot'))+' A']);} },
    { key: 'series', title: 'Two bulbs in series', set: { circuit: 'series2', volts: 9, am: 'none', vm: 'none' }, fresh: true,
      see: 'Two bulbs one after the other. Both glow, but dimly: each is about a quarter as bright.',
      why: { bio: 'The current has to get through both bulbs, so it is cut in half, and each bulb gets only half of the 9 V.', honors: 'R = 10 + 10 = 20 Ω, so I = 9/20 = 0.45 A. Power in each bulb = I²R, so half the current gives a quarter of the brightness.' },
      overlay(sim,ctx,LH,k){CI(ctx,k,[['Series',700,14],'Current: '+f2(met(sim,'itot'))+' A','Each bulb: '+f0(met(sim,'b1'))+'% of one bulb alone']);} },
    { key: 'parallel', title: 'Two bulbs in parallel', set: { circuit: 'parallel2', volts: 9, am: 'none', vm: 'none' }, fresh: true,
      see: 'Now each bulb has its own path across the battery. Both are full brightness, and the battery sends out twice the current, 1.76 A.',
      why: { bio: 'Each bulb gets the full 9 V. More paths means more total current: the battery works harder and runs down faster.', honors: '1/R = 1/10 + 1/10, so R = 5 Ω. Adding a branch lowers the total resistance.' },
      overlay(sim,ctx,LH,k){CI(ctx,k,[['Parallel',700,14],'Battery current: '+f2(met(sim,'itot'))+' A','Each bulb: '+f0(met(sim,'b1'))+'%']);} },
    { key: 'meters', title: 'Measuring series', set: { circuit: 'series2', volts: 9, am: 'A_b1', vm: 'V_B1' }, fresh: true,
      see: 'An ammeter in line with B1 reads 0.45 A. A voltmeter across B1 reads 4.5 V, half the battery.',
      why: 'An ammeter goes in the loop so the current runs through it. A voltmeter goes across a part to compare the two sides. In series the bulbs split the voltage.',
      overlay(sim,ctx,LH,k){CI(ctx,k,[['Series, meters on B1',700,14],'Ammeter: '+f2(met(sim,'amr'))+' A','Voltmeter: '+f2(met(sim,'vmr'))+' V']);} },
    { key: 'pmeters', title: 'Measuring parallel', set: { circuit: 'parallel2', volts: 9, am: 'A_b1', vm: 'V_B1' }, fresh: true,
      see: 'In parallel the voltmeter across B1 reads the full 8.8 V, and B1 carries 0.88 A, half of what the battery sends.',
      why: 'Every parallel branch gets the same voltage. The currents in the branches add up to the battery’s current.',
      overlay(sim,ctx,LH,k){CI(ctx,k,[['Parallel, meters on B1',700,14],'Ammeter: '+f2(met(sim,'amr'))+' A','Voltmeter: '+f2(met(sim,'vmr'))+' V']);} },
    { key: 'uneven', lvl: 'honors', title: 'Unequal bulbs in series', set: { circuit: 'series2', volts: 9, r1: 10, r2: 30, am: 'none', vm: 'none' }, fresh: true,
      cause: { from: { r2: 10 }, delay: 0.6, dur: 2, label: 'B2 resistance' },
      see: 'Make B2 30 Ω. The current drops to 0.22 A, and B2, the bigger resistor, is the brighter bulb.',
      why: 'Same current through both, so P = I²R is bigger where R is bigger. B2 takes 3/4 of the voltage.',
      overlay(sim,ctx,LH,k){CI(ctx,k,[['B1 10 Ω, B2 '+f0(sim.p.r2)+' Ω',700,14],'Current: '+f2(met(sim,'itot'))+' A','B1 '+f0(met(sim,'b1'))+'%, B2 '+f0(met(sim,'b2'))+'%']);} },
    { key: 'combo', lvl: 'ap', title: 'Series plus parallel', set: { circuit: 'combo', volts: 9, r1: 10, r2: 10, r3: 10, am: 'none', vm: 'none' }, fresh: true,
      see: 'B1 is in series with two parallel bulbs. B1 is bright; the other two are dim.',
      why: 'The parallel pair is 5 Ω, so the total is 15 Ω and I = 0.6 A. All 0.6 A goes through B1, but it splits to 0.3 A in each of the others.',
      overlay(sim,ctx,LH,k){CI(ctx,k,[['Combination: '+f0(met(sim,'req'))+' Ω total',700,14],'Current: '+f2(met(sim,'itot'))+' A','B1 '+f0(met(sim,'b1'))+'%, B2 '+f0(met(sim,'b2'))+'%']);} },
    { key: 'short', lvl: 'ap', title: 'A short circuit', set: { circuit: 'short', volts: 9, am: 'none', vm: 'none' }, fresh: true,
      see: 'A bare wire connects across the bulb. The bulb goes dark and the battery current shoots up to about 85 A.',
      why: 'The wire has almost no resistance, so nearly all the current takes it. Only the battery’s own small resistance limits the current, and the battery heats up. Fuses and breakers are there to stop this.',
      overlay(sim,ctx,LH,k){CI(ctx,k,[['Short circuit',700,14],['Battery current: '+f0(met(sim,'itot'))+' A',700,13,RED],'Terminal voltage: '+f2(met(sim,'vterm'))+' V']);} }
  ],
  useIt: [
    { do: 'Don’t plug too many things into one power strip.',
      why: 'Outlets are in parallel. Every device you add draws more current through the same wire, which heats up. The breaker trips to protect it.' },
    { do: 'If a string of lights goes dark, look for the one bad bulb.',
      why: 'Many light strings are wired in series. One broken bulb opens the loop and stops the current for every bulb.' }
  ],
  tryIt: [
    { title: 'find the circuits at home (5 minutes)',
      steps: ['Turn on two lamps in one room, then switch one off.', 'Look at your house’s breaker panel and read the labels.'],
      look: 'The other lamp stays on, so they are in parallel. Each breaker protects one group of parallel outlets and lights.' }
  ]
}
});
/* ---- Apr–May units: light and optics (added Nov 14, 2026) ---- */
const CO1=(ctx,k,L)=>card(ctx,k,L,12,186,270);
const CO2=(ctx,k,L)=>card(ctx,k,L,420,210,360);
const RF=(ctx,k,L)=>card(ctx,k,L,12,320,212);
const RP=(ctx,k,L)=>card(ctx,k,L,12,70,250);
const RFB=(ctx,k,L)=>card(ctx,k,L,470,70,300);
const LN=(ctx,k,L)=>card(ctx,k,L,470,46,320);
const LM=(ctx,k,L)=>card(ctx,k,L,330,14,290);
const tx=(sim,id)=>{const v=met(sim,id);return v==null||v!==v?'—':String(v);};
const ang=v=>Number.isFinite(v)?v.toFixed(1)+'°':'none';

BioLab.addLearn({
color: {
  goals: {
    bio: ['Light is one small band of the electromagnetic spectrum', 'Shorter wavelength means more energy per photon', 'An object’s color depends on the light hitting it'],
    honors: ['c = fλ and E = hf', 'Why UV and X-rays can damage cells but radio can’t', 'Additive color mixing and colored filters'],
    ap: ['Photon energy on a log scale', 'Cone signals and color vision', 'Fluorescence and color blindness']
  },
  matters: 'Sunscreen, microwave ovens, Wi-Fi, X-rays at the dentist and the screen you’re reading all use the same kind of wave. What changes is the wavelength, and with it the energy each photon carries.',
  question: 'A red car looks red in sunlight. What color is it under a pure green light?',
  startKey: 'vis', startRun: false,
  steps: [
    { key: 'vis', title: 'Visible light', set: { part: 'em', band: 'vis', pos: 50 }, fresh: true, pause: true,
      see: 'Green light: wavelength 533 nm, frequency 5.6 × 10¹⁴ Hz. Each photon carries 2.32 eV.',
      why: 'Light is an electromagnetic wave: electric and magnetic fields wiggling together, traveling at 3.00 × 10⁸ m/s. Visible light is only a thin slice of the whole spectrum.',
      overlay(sim,ctx,LH,k){CO1(ctx,k,[['λ = '+tx(sim,'wl').split(' (')[0],700,13.5],'Photon energy: '+tx(sim,'pe')]);} },
    { key: 'rainbow', title: 'Red to violet', set: { part: 'em', band: 'vis', pos: 100 }, fresh: true,
      cause: { from: { pos: 0 }, delay: 0.6, dur: 3, label: 'Frequency' },
      see: 'Slide from red to violet. The wavelength shrinks from about 750 nm to 380 nm, and the photon energy doubles from 1.65 to 3.27 eV.',
      why: { bio: 'Shorter waves pack more energy into each photon. Violet photons carry about twice the energy of red ones.', honors: 'E = hf = hc/λ. Halve the wavelength and you double the frequency and the energy.' },
      overlay(sim,ctx,LH,k){CO1(ctx,k,[['λ = '+tx(sim,'wl').split(' (')[0],700,13.5],'Photon energy: '+tx(sim,'pe')]);} },
    { key: 'radio', title: 'Radio waves', set: { part: 'em', band: 'radio', pos: 50 }, fresh: true, pause: true,
      see: 'An AM radio wave is 173 m long, longer than a football field. Each photon carries only about 10⁻⁸ eV.',
      why: 'Radio photons are far too weak to break chemical bonds. That’s why radio, Wi-Fi and phone signals don’t damage DNA the way UV can.',
      overlay(sim,ctx,LH,k){CO1(ctx,k,[['Radio: λ = '+tx(sim,'wl').split(' (')[0],700,13.5],'Photon energy: '+tx(sim,'pe')]);} },
    { key: 'uv', title: 'Ultraviolet', set: { part: 'em', band: 'uv', pos: 50 }, fresh: true, pause: true,
      see: 'Far-UV photons carry about 20 eV, enough to knock an electron off an atom. The scale turns red: ionizing.',
      why: 'Ionizing radiation can break bonds in DNA. That is why UV causes sunburn and skin cancer, and why sunscreen and UV-blocking sunglasses matter, especially at Colorado’s altitude.',
      overlay(sim,ctx,LH,k){CO1(ctx,k,[['UV: '+tx(sim,'pe'),700,13.5],tx(sim,'ion').split(':')[0]==='Yes'?'Ionizing':'Not ionizing']);} },
    { key: 'room', title: 'A red car in white light', set: { part: 'color', R: 100, G: 100, B: 100, obj: 'red', filt: 'none' }, fresh: true, pause: true,
      see: 'Red, green and blue bulbs together make white light. The red car looks red.',
      why: 'The paint absorbs green and blue and reflects red. The color you see is the light that bounces back to your eye.',
      overlay(sim,ctx,LH,k){CO2(ctx,k,[['Lamp: white · Car paint: red',700,13.5],'You see: '+tx(sim,'see')]);} },
    { key: 'green', title: 'Only green light', set: { part: 'color', R: 0, G: 100, B: 0, obj: 'red', filt: 'none' }, fresh: true,
      cause: { from: { R: 100, B: 100 }, delay: 0.6, dur: 2, label: 'Red and blue bulbs' },
      see: 'Turn off the red and blue bulbs. Under green light the red car looks black.',
      why: 'Red paint absorbs green. With no red light to reflect, almost nothing comes back to your eye.',
      overlay(sim,ctx,LH,k){CO2(ctx,k,[['Lamp: green only',700,13.5],'You see: '+tx(sim,'see')]);} },
    { key: 'glasses', lvl: 'honors', title: 'Cyan glasses', set: { part: 'color', R: 100, G: 100, B: 100, obj: 'red', filt: 'cyan' }, fresh: true,
      see: 'White light, red car, but now you wear cyan glasses. The car looks black again.',
      why: 'A cyan filter lets green and blue through and blocks red. The car only reflects red, so the glasses block all of it. A filter subtracts colors; it never adds them.',
      overlay(sim,ctx,LH,k){CO2(ctx,k,[['Cyan glasses',700,13.5],'You see: '+tx(sim,'see')]);} },
    { key: 'magenta', lvl: 'honors', title: 'Mixing light', set: { part: 'color', R: 100, G: 0, B: 100, obj: 'white', filt: 'none' }, fresh: true,
      cause: { from: { G: 100 }, delay: 0.6, dur: 2, label: 'Green bulb' },
      see: 'A white car under red + blue light looks magenta.',
      why: 'Light mixes by adding: red + blue = magenta, red + green = yellow, green + blue = cyan, all three = white. Your phone screen makes every color from tiny red, green and blue dots.',
      overlay(sim,ctx,LH,k){CO2(ctx,k,[['Red + blue light, white car',700,13.5],'You see: '+tx(sim,'see')]);} }
  ],
  useIt: [
    { do: 'Wear sunscreen and UV-blocking sunglasses, especially skiing or hiking.',
      why: 'At high altitude and on snow, more UV reaches you. UV photons carry enough energy to damage skin and eye cells; visible light doesn’t.' },
    { do: 'Check a shirt’s color near a window before buying it.', lvl: 'honors',
      why: 'Store lights don’t have the same mix of colors as sunlight, so a color can look different outside.' }
  ],
  tryIt: [
    { title: 'see the pixels (2 minutes)',
      steps: ['Put a drop of water on your phone screen over a white area, or use a magnifying glass.', 'Look closely at white, yellow and magenta parts of the screen.'],
      look: 'Every color is made of tiny red, green and blue dots. Yellow is red + green with no blue; white is all three.' }
  ]
},
refraction: {
  goals: {
    bio: ['Light bends when it goes from one material into another', 'Into water or glass it bends toward the normal', 'Total internal reflection traps light in fiber-optic cables'],
    honors: ['Snell’s law: n₁ sin θ₁ = n₂ sin θ₂', 'The critical angle', 'Dispersion: why a prism makes a rainbow'],
    ap: ['n = c/v', 'Wavelength changes in a medium; frequency doesn’t', 'Partial reflection at every surface']
  },
  matters: 'Eyeglasses, camera lenses, rainbows, diamonds that sparkle and the fiber-optic cables carrying the internet all depend on light bending at a surface.',
  question: 'A laser hits water at an angle. Does it keep going straight, bend toward the surface, or bend toward straight down?',
  startKey: 'water', startRun: false,
  steps: [
    { key: 'water', title: 'Air into water', set: { mode: 'intro', top: 'air', bot: 'water', angle: 45, white: false }, fresh: true, pause: true,
      see: 'The laser hits water at 45° from the normal (the dashed line). Inside the water it travels at 32.1°, bent toward the normal.',
      why: 'Light slows down in water, to about 2.25 × 10⁸ m/s. The side of the beam that enters first slows first, so the beam pivots, like a cart whose wheel hits mud.',
      overlay(sim,ctx,LH,k){RF(ctx,k,[['Air → water',700,14],'In: '+ang(met(sim,'t1'))+'  Out: '+ang(met(sim,'t2')),'Reflected: '+f0(met(sim,'refl'))+'%']);} },
    { key: 'straight', title: 'Straight in', set: { mode: 'intro', top: 'air', bot: 'water', angle: 0, white: false }, fresh: true,
      cause: { from: { angle: 45 }, delay: 0.6, dur: 2, label: 'Laser angle' },
      see: 'Aim straight down along the normal. The beam goes straight through without bending.',
      why: 'Both sides of the beam enter at the same moment, so there is nothing to pivot it. Bending only happens at an angle.',
      overlay(sim,ctx,LH,k){RF(ctx,k,[['Straight in',700,14],'In: '+ang(met(sim,'t1'))+'  Out: '+ang(met(sim,'t2'))]);} },
    { key: 'diamond', lvl: 'honors', title: 'Into diamond', set: { mode: 'intro', top: 'air', bot: 'diamond', angle: 45, white: false }, fresh: true,
      cause: { from: { bot: 'water' }, delay: 0.6, dur: 1, label: 'Bottom material' },
      see: 'Diamond bends the same beam to just 17.1°.',
      why: 'Snell’s law: sin θ₂ = (1.00 × sin 45°)/2.41 = 0.293, θ₂ = 17.1°. A higher index of refraction means slower light (1.24 × 10⁸ m/s) and more bending.',
      overlay(sim,ctx,LH,k){RF(ctx,k,[['Air → diamond',700,14],'Out: '+ang(met(sim,'t2')),'n₂ = '+f2(met(sim,'n2'))]);} },
    { key: 'out', title: 'Water into air', set: { mode: 'intro', top: 'water', bot: 'air', angle: 40, white: false }, fresh: true, pause: true,
      see: 'Now the light starts in water and comes out into air. At 40° in the water it leaves at 58.8°, bent away from the normal.',
      why: 'Speeding up bends light away from the normal. This is why a straw looks broken in a glass, and why a pool looks shallower than it is.',
      overlay(sim,ctx,LH,k){RF(ctx,k,[['Water → air',700,14],'In: '+ang(met(sim,'t1'))+'  Out: '+ang(met(sim,'t2'))]);} },
    { key: 'tir', title: 'Trapped inside', set: { mode: 'intro', top: 'water', bot: 'air', angle: 50, white: false }, fresh: true,
      cause: { from: { angle: 40 }, delay: 0.6, dur: 2.5, label: 'Laser angle' },
      see: 'Tilt to 50°. No light escapes: 100% reflects back into the water.',
      why: { bio: 'Past a certain angle, the light would have to bend more than 90° to get out, so it can’t. It all reflects. This is total internal reflection.', honors: 'Critical angle: sin θc = 1.00/1.33, θc = 48.7°. Any angle beyond it reflects completely.' },
      overlay(sim,ctx,LH,k){RF(ctx,k,[['Water → air at '+ang(met(sim,'t1')),700,14],['Reflected: '+f0(met(sim,'refl'))+'%',700,13,RED],'Critical angle: '+ang(met(sim,'crit'))]);} },
    { key: 'fiber', title: 'Fiber optics', set: { mode: 'fiber', angle: 45, clad: 'air' }, fresh: true, pause: true,
      see: 'Laser light enters a glass fiber and bounces off the walls all the way to the far end. 100% arrives.',
      why: 'Every bounce hits the wall beyond the critical angle, so total internal reflection keeps the light inside. Internet cables carry data this way under oceans.',
      overlay(sim,ctx,LH,k){RFB(ctx,k,[['Glass fiber',700,14],'Light kept: '+f0(met(sim,'kept'))+'%']);} },
    { key: 'prism', title: 'A prism makes a rainbow', set: { mode: 'prism', bot: 'water', angle: 45, white: true }, fresh: true, pause: true,
      see: 'White light enters a prism and comes out as a spread of colors, violet bent most and red least.',
      why: 'Each color bends a slightly different amount, because the index of refraction depends on wavelength. Raindrops do the same thing to make a rainbow.',
      overlay(sim,ctx,LH,k){RP(ctx,k,[['White light in',700,14],'Spectrum out: violet bends most']);} },
    { key: 'lam', lvl: 'ap', title: 'Wavelength in water', set: { mode: 'intro', top: 'air', bot: 'water', angle: 45, lam: 500, white: false }, fresh: true, pause: true,
      see: 'A 500 nm laser in water has a wavelength of only 374 nm, and travels at 2.24 × 10⁸ m/s.',
      why: 'n = c/v and λ_water = λ_air/n. The frequency can’t change at the surface (the waves arrive and leave at the same rate), so the slower speed shortens the wavelength.',
      overlay(sim,ctx,LH,k){RF(ctx,k,[['500 nm in air',700,14],'In water: '+f0(met(sim,'lam2'))+' nm','v = '+f2(met(sim,'v2'))+' × 10⁸ m/s']);} }
  ],
  useIt: [
    { do: 'Aim below where a fish appears if you’re spearfishing or reaching into a pond.',
      why: 'Light from the fish bends as it leaves the water, so the fish looks higher (and closer to the surface) than it is.' },
    { do: 'Notice the glitter of a diamond or crystal.', lvl: 'honors',
      why: 'Diamond’s small critical angle (24°) traps light inside through several internal reflections before it escapes, split into colors.' }
  ],
  tryIt: [
    { title: 'the broken pencil (2 minutes)',
      steps: ['Put a pencil in a glass of water so it leans against the side.', 'Look at it from the side, then from above.'],
      look: 'The pencil looks bent or broken at the water line. Light from the underwater part bends as it leaves the water, so it seems to come from a different place.' }
  ]
},
lenses: {
  goals: {
    bio: ['A converging lens can make a real image on a screen', 'Move the object closer and the image gets bigger and farther away', 'A magnifying glass makes a virtual image'],
    honors: ['Principal rays', 'The thin-lens equation 1/dₒ + 1/dᵢ = 1/f', 'Magnification m = −dᵢ/dₒ; mirrors follow the same rules'],
    ap: ['Sign conventions for real and virtual images', 'Lens power in diopters', 'Mirror vs. lens comparisons']
  },
  matters: 'Your eye, your phone camera, glasses, projectors, car mirrors and telescopes are all lenses or mirrors forming images by the same three rules.',
  question: 'You slide a candle toward a magnifying glass. Does its image get bigger or smaller, and does it stay on the screen?',
  startKey: 'cam', startRun: false,
  steps: [
    { key: 'cam', title: 'Like a camera', set: { el: 'conv', f: 15, dobj: 40, rays: '3' }, fresh: true, pause: true,
      see: 'A candle 40 cm from a converging lens (f = 15 cm) forms a real, upside-down, smaller image 24 cm on the other side.',
      why: 'Three rays from the flame tip meet at one point: that is the image. Real means the light really meets there, so a screen placed there would show it. Your eye and phone camera work this way.',
      overlay(sim,ctx,LH,k){LN(ctx,k,[[tx(sim,'type'),700,14],'Image distance: '+f1(met(sim,'di'))+' cm','Image height: '+f1(met(sim,'hi'))+' cm']);} },
    { key: 'twoF', title: 'At 2F', set: { el: 'conv', f: 15, dobj: 30, rays: '3' }, fresh: true,
      cause: { from: { dobj: 40 }, delay: 0.6, dur: 2, label: 'Object distance' },
      see: 'Move the candle to 30 cm, twice the focal length. The image is the same size, 30 cm away.',
      why: 'At 2F the setup is symmetric: object and image are the same distance from the lens and the same size.',
      overlay(sim,ctx,LH,k){LN(ctx,k,[[tx(sim,'type'),700,14],'Image distance: '+f1(met(sim,'di'))+' cm','Image height: '+f1(met(sim,'hi'))+' cm']);} },
    { key: 'proj', title: 'Like a projector', set: { el: 'conv', f: 15, dobj: 20, rays: '3' }, fresh: true,
      cause: { from: { dobj: 30 }, delay: 0.6, dur: 2, label: 'Object distance' },
      see: 'At 20 cm the image is 3 times larger, inverted, and 60 cm away.',
      why: 'Between F and 2F the image is bigger and farther. A projector puts a small bright slide just outside F to throw a big image on a far wall (upside down, so the slide goes in upside down).',
      overlay(sim,ctx,LH,k){LN(ctx,k,[[tx(sim,'type'),700,14],'Image distance: '+f1(met(sim,'di'))+' cm','Image height: '+f1(met(sim,'hi'))+' cm']);} },
    { key: 'atF', title: 'At the focal point', set: { el: 'conv', f: 15, dobj: 15, rays: '3' }, fresh: true,
      cause: { from: { dobj: 20 }, delay: 0.6, dur: 2, label: 'Object distance' },
      see: 'At exactly 15 cm the rays leave parallel. They never meet: no image.',
      why: 'This is how a flashlight or lighthouse works: a bulb at the focal point sends out a straight, parallel beam.',
      overlay(sim,ctx,LH,k){LN(ctx,k,[[tx(sim,'type'),700,14]]);} },
    { key: 'mag', title: 'A magnifying glass', set: { el: 'conv', f: 15, dobj: 10, rays: '3' }, fresh: true,
      cause: { from: { dobj: 15 }, delay: 0.6, dur: 2, label: 'Object distance' },
      see: 'Inside the focal point the rays spread apart. Traced backward, they seem to come from a bigger, upright image behind the candle: virtual, 3 times larger.',
      why: 'No light actually reaches a virtual image, so it can’t go on a screen. Your eye sees it by looking through the lens, which is how a magnifying glass works.',
      overlay(sim,ctx,LH,k){LN(ctx,k,[[tx(sim,'type'),700,14],'Image distance: '+f1(met(sim,'di'))+' cm','Magnification: '+f1(met(sim,'m'))+'×']);} },
    { key: 'div', lvl: 'honors', title: 'A diverging lens', set: { el: 'div', f: 15, dobj: 40, rays: '3' }, fresh: true,
      see: 'A diverging lens spreads light out. The image is always virtual, upright and smaller: here 0.27 times as tall.',
      why: 'Glasses for nearsighted people use diverging lenses to spread light slightly before it enters the eye, so it focuses on the retina instead of in front of it.',
      overlay(sim,ctx,LH,k){LN(ctx,k,[[tx(sim,'type'),700,14],'Image distance: '+f1(met(sim,'di'))+' cm','Magnification: '+f2(met(sim,'m'))+'×']);} },
    { key: 'makeup', lvl: 'honors', title: 'A makeup mirror', set: { el: 'concave', f: 15, dobj: 10, rays: '3' }, fresh: true,
      see: 'A concave mirror with your face inside its focal point gives a virtual, upright image 3 times larger.',
      why: 'Curved mirrors follow the same equation as lenses. Inside F a concave mirror magnifies, which is why makeup and shaving mirrors are concave.',
      overlay(sim,ctx,LH,k){LM(ctx,k,[[tx(sim,'type'),700,14],'Magnification: '+f1(met(sim,'m'))+'×']);} },
    { key: 'side', lvl: 'honors', title: 'A car side mirror', set: { el: 'convex', f: 15, dobj: 40, rays: '3' }, fresh: true,
      see: 'A convex mirror makes a small, upright, virtual image.',
      why: 'It shows a wide view in a small mirror, but things look smaller and so farther away. Hence “Objects in mirror are closer than they appear.”',
      overlay(sim,ctx,LH,k){LM(ctx,k,[[tx(sim,'type'),700,14],'Magnification: '+f2(met(sim,'m'))+'×']);} },
    { key: 'eq', lvl: 'ap', title: 'The thin-lens equation', set: { el: 'conv', f: 15, dobj: 40, rays: '3' }, fresh: true, pause: true,
      see: 'Check 1/dₒ + 1/dᵢ = 1/f: 1/40 + 1/24 = 0.0667 = 1/15.',
      why: 'Real images have positive dᵢ, virtual ones negative. m = −dᵢ/dₒ = −24/40 = −0.6: the minus sign means inverted. Power = 1/f in meters: 1/0.15 m = 6.7 diopters, the unit on a glasses prescription.',
      overlay(sim,ctx,LH,k){LN(ctx,k,[['1/dₒ + 1/dᵢ = '+(Number.isFinite(met(sim,'sum'))?met(sim,'sum').toFixed(4):'—'),700,13.5],'1/f = '+(Number.isFinite(met(sim,'invf'))?met(sim,'invf').toFixed(4):'—'),'Power: '+f1(met(sim,'power'))+' D']);} }
  ],
  useIt: [
    { do: 'Read your glasses or contacts prescription: the number is the lens power in diopters.',
      why: 'Negative numbers are diverging lenses (nearsighted); positive are converging (farsighted or reading glasses).' },
    { do: 'Trust your car mirror’s warning: objects are closer than they appear.', lvl: 'honors',
      why: 'The convex mirror shrinks the image so you see a wider area, which makes cars look farther away.' }
  ],
  tryIt: [
    { title: 'a magnifying glass camera (5 minutes)',
      steps: ['In a dim room, hold a magnifying glass between a bright window and a white wall or paper.', 'Move the paper until the window comes into focus.'],
      look: 'You’ll see a sharp, small, upside-down picture of the window: a real image, exactly like the first step.' }
  ]
}
});
/* ---- Apr–May units: magnetism, induction, buoyancy, fluid flow (added Nov 14, 2026) ---- */
const MG=(ctx,k,L)=>card(ctx,k,L,12,40,262);
const IN=(ctx,k,L)=>card(ctx,k,L,14,80,300);
const TR=(ctx,k,L)=>card(ctx,k,L,380,10,300);
const BU=(ctx,k,L)=>card(ctx,k,L,546,300,250);
const FP=(ctx,k,L)=>card(ctx,k,L,622,116,172);
const FT=(ctx,k,L)=>card(ctx,k,L,330,48,320);
const uT=v=>!Number.isFinite(v)?'—':v>=1000?(v/1000).toFixed(2)+' mT':v.toFixed(1)+' µT';

BioLab.addLearn({
magnetism: {
  goals: {
    bio: ['Magnets have north and south poles; field lines run from N to S', 'An electric current makes a magnetic field', 'A coil with an iron core makes a strong electromagnet'],
    honors: ['The field around a wire: right-hand rule, B = μ₀I/2πr', 'What makes an electromagnet stronger', 'Earth as a magnet'],
    ap: ['Force on a moving charge, F = qvB sin θ', 'Circular motion of charges in a field', 'Force on a current-carrying wire']
  },
  matters: 'Motors in every car and fan, MRI scanners, speakers, the hard drives in data centers and the junkyard crane all use magnetic fields made by electric currents.',
  question: 'A wire with current flowing through it sits next to a compass. Will the compass move?',
  startKey: 'bar', startRun: true,
  steps: [
    { key: 'bar', title: 'A bar magnet', set: { scene: 'bar', flip: false }, fresh: true, speed: 1,
      see: 'Little compasses all around the magnet line up with its field. The lines loop out of the north end and into the south end.',
      why: 'A compass needle is itself a tiny magnet. Its north end points along the field, away from N and toward S. The field is strongest near the poles, where the lines crowd together.',
      overlay(sim,ctx,LH,k){MG(ctx,k,[['Bar magnet',700,14],'Field at the compass: '+uT(met(sim,'bprobe'))]);} },
    { key: 'far', title: 'Farther away', set: { scene: 'bar', flip: false, px: 12 }, fresh: true, speed: 1,
      cause: { from: { px: 6 }, delay: 0.6, dur: 2, label: 'Compass position' },
      see: 'Slide the compass twice as far out. The field drops from 2.92 mT to about 0.42 mT, seven times weaker.',
      why: 'Magnetic fields fade fast with distance. That is why a fridge magnet holds a sheet of paper but not a thick magazine.',
      overlay(sim,ctx,LH,k){MG(ctx,k,[['Compass at '+f1(sim.p.px)+' cm',700,14],'Field: '+uT(met(sim,'bprobe'))]);} },
    { key: 'wire', title: 'Current makes a field', set: { scene: 'wire', cur: 5 }, fresh: true, speed: 1,
      see: 'A wire carrying 5 A straight out of the screen. The compasses line up in circles around it.',
      why: { bio: 'Any moving charge makes a magnetic field. Around a straight wire the field forms rings. Hans Christian Ørsted found this in 1820 when a current made a compass needle jump.', honors: 'Right-hand rule: thumb along the current, fingers curl the way the field goes. B = μ₀I/2πr = 14.9 µT at 6.7 cm.' },
      overlay(sim,ctx,LH,k){MG(ctx,k,[['Wire, '+f1(sim.p.cur)+' A',700,14],'Field at the compass: '+uT(met(sim,'bprobe'))]);} },
    { key: 'rev', title: 'Reverse the current', set: { scene: 'wire', cur: -5 }, fresh: true, speed: 1,
      cause: { from: { cur: 5 }, delay: 0.6, dur: 2, label: 'Current' },
      see: 'Run the current the other way. Every compass flips around.',
      why: 'The field’s direction follows the current. Same strength, opposite direction.',
      overlay(sim,ctx,LH,k){MG(ctx,k,[['Wire, '+f1(sim.p.cur)+' A',700,14],'Needle points '+f0(met(sim,'heading'))+'°']);} },
    { key: 'coil', title: 'An electromagnet', set: { scene: 'solenoid', cur: 5, turns: 50, core: true }, fresh: true, speed: 1,
      see: 'Wrap the wire into a 50-turn coil around an iron core. It lifts 20 paperclips.',
      why: 'Each loop’s field adds to the next, so a coil acts like a bar magnet. The iron core lines up its own atoms with the field and multiplies it hundreds of times.',
      overlay(sim,ctx,LH,k){MG(ctx,k,[['50 turns, 5 A, iron core',700,13.5],'Paperclips lifted: '+tx(sim,'clips')]);} },
    { key: 'nocore', title: 'Take out the iron', set: { scene: 'solenoid', cur: 5, turns: 50, core: false }, fresh: true, speed: 1,
      cause: { from: { core: true }, delay: 0.6, dur: 1, label: 'Iron core' },
      see: 'Without the iron core the same coil lifts nothing.',
      why: 'An air-core coil is a weak magnet. The iron is what makes junkyard electromagnets strong enough to lift cars.',
      overlay(sim,ctx,LH,k){MG(ctx,k,[['No core',700,13.5],'Paperclips lifted: '+tx(sim,'clips')]);} },
    { key: 'turns', lvl: 'honors', title: 'More turns', set: { scene: 'solenoid', cur: 5, turns: 100, core: true }, fresh: true, speed: 1,
      cause: { from: { turns: 50 }, delay: 0.6, dur: 2, label: 'Turns' },
      see: 'Double the turns to 100 and the coil lifts 38 clips. Doubling the current instead does the same.',
      why: 'The field inside a coil is B = μ₀nI, times the core’s boost. More turns per length or more current both strengthen it, and the electromagnet switches off when the current stops.',
      overlay(sim,ctx,LH,k){MG(ctx,k,[[f0(sim.p.turns)+' turns, iron core',700,13.5],'Paperclips lifted: '+tx(sim,'clips')]);} },
    { key: 'earth', lvl: 'honors', title: 'Earth is a magnet', set: { scene: 'earth' }, fresh: true, speed: 1,
      see: 'Earth’s field is about 14 µT at this compass, weak but everywhere.',
      why: 'Molten iron moving in Earth’s outer core makes the field. A compass’s north end points toward Earth’s geographic north, which means a magnetic south pole sits up there.',
      overlay(sim,ctx,LH,k){MG(ctx,k,[['Earth',700,14],'Field at the compass: '+uT(met(sim,'bprobe'))]);} }
  ],
  useIt: [
    { do: 'Keep magnets away from credit card stripes and old hard drives.',
      why: 'They store information as tiny magnetized regions that a strong magnet can scramble.' },
    { do: 'Hold a compass away from your phone, laptop or a car door when you navigate.', lvl: 'honors',
      why: 'Speakers, motors and steel make their own fields that can be much stronger than Earth’s 25–65 µT.' }
  ],
  tryIt: [
    { title: 'a nail electromagnet (10 minutes)',
      steps: ['Wrap insulated wire 20 times around a steel nail.', 'Tape the ends briefly to the ends of a D battery.', 'Pick up paperclips, then try 40 turns. Disconnect quickly so the wire doesn’t get hot.'],
      look: 'More turns lift more clips, and the clips drop when you disconnect. The nail is the iron core.' }
  ]
},
induction: {
  goals: {
    bio: ['A moving magnet makes a current in a coil', 'No motion, no current', 'Faster motion and more turns make more voltage'],
    honors: ['Faraday’s law: EMF depends on how fast flux changes', 'How a generator makes AC', 'Transformers: Vs/Vp = Ns/Np'],
    ap: ['Lenz’s law: induced current opposes the change', 'Eddy currents and magnetic braking', 'Power in a transformer: VpIp = VsIs']
  },
  matters: 'Almost every watt of electricity you use was made by spinning a magnet near a coil. Wireless phone chargers, electric guitar pickups and the transformers on power poles use the same idea.',
  question: 'A magnet sits perfectly still inside a coil of wire. Does any current flow?',
  startKey: 'push', startRun: true,
  steps: [
    { key: 'push', title: 'Push the magnet in', set: { scene: 'magnet', motion: 'in', speed: 0.3, turns: 100, flip: false, meter: 'galv' }, fresh: true, speed: 1,
      see: 'Push the magnet into the coil. The meter needle swings one way while it moves.',
      why: 'As the magnet moves in, the magnetic field through the coil grows. A changing field pushes electrons around the wire: an induced current.',
      overlay(sim,ctx,LH,k){IN(ctx,k,[['Push in at '+f2(sim.p.speed)+' m/s',700,14],'Biggest swing: '+f1(met(sim,'swing'))+' mA']);} },
    { key: 'still', title: 'Hold it still', set: { scene: 'magnet', motion: 'still', speed: 0.3, turns: 100, flip: false, meter: 'galv' }, fresh: true, speed: 1,
      see: 'Hold the magnet still inside the coil. Nothing.',
      why: 'A magnetic field alone does nothing. Only a changing field induces current. That is the key idea of induction.',
      overlay(sim,ctx,LH,k){IN(ctx,k,[['Magnet still',700,14],'Meter: '+f1(met(sim,'swing'))+' mA']);} },
    { key: 'out', title: 'Pull it out', set: { scene: 'magnet', motion: 'out', speed: 0.3, turns: 100, flip: false, meter: 'galv' }, fresh: true, speed: 1,
      see: 'Pull the magnet out. The needle swings the other way.',
      why: 'Now the field through the coil shrinks instead of growing, so the current reverses. Moving it back and forth makes alternating current.',
      overlay(sim,ctx,LH,k){IN(ctx,k,[['Pull out',700,14],'Biggest swing: '+f1(met(sim,'swing'))+' mA']);} },
    { key: 'fast', title: 'Faster', set: { scene: 'magnet', motion: 'in', speed: 0.6, turns: 100, flip: false, meter: 'galv' }, fresh: true, speed: 1,
      cause: { from: { speed: 0.3 }, delay: 0.4, dur: 1, label: 'Magnet speed' },
      see: 'Push in twice as fast. The swing doubles, to about 7 mA.',
      why: { bio: 'A faster change makes more voltage.', honors: 'Faraday’s law: EMF = −N ΔΦ/Δt. Same change in flux in half the time means twice the EMF.' },
      overlay(sim,ctx,LH,k){IN(ctx,k,[['Push in at '+f2(sim.p.speed)+' m/s',700,14],'Biggest swing: '+f1(met(sim,'swing'))+' mA']);} },
    { key: 'turns', title: 'More turns', set: { scene: 'magnet', motion: 'in', speed: 0.3, turns: 200, flip: false, meter: 'galv' }, fresh: true, speed: 1,
      cause: { from: { turns: 100 }, delay: 0.4, dur: 1, label: 'Turns' },
      see: 'Double the turns to 200. The swing doubles too.',
      why: 'Each turn of wire gets its own push, and they add up in series. Generators use thousands of turns.',
      overlay(sim,ctx,LH,k){IN(ctx,k,[[f0(sim.p.turns)+' turns',700,14],'Biggest swing: '+f1(met(sim,'swing'))+' mA']);} },
    { key: 'gen', lvl: 'honors', title: 'A generator', set: { scene: 'generator', rpm: 300, bgen: 0.1 }, fresh: true, speed: 1,
      see: 'Spin a coil in a magnetic field at 300 rpm. The voltage rises, falls and reverses every half turn: AC, peaking at 3.1 V.',
      why: 'Peak EMF = NBAω. Spin twice as fast and the peak doubles (and the frequency doubles). Power plants spin turbines at 3,600 rpm to make 60 Hz AC.',
      overlay(sim,ctx,LH,k){IN(ctx,k,[['Generator, '+f0(sim.p.rpm)+' rpm',700,14],'Peak EMF: '+f2(met(sim,'peak'))+' V','Now: '+f2(met(sim,'emf'))+' V']);} },
    { key: 'xf', lvl: 'honors', title: 'A transformer', set: { scene: 'transformer', vp: 120, np: 200, ns: 100, ac: true }, fresh: true, speed: 1,
      see: '120 V AC on a 200-turn primary coil. The 100-turn secondary puts out 60 V.',
      why: 'The changing current in the primary makes a changing field in the iron core, which induces voltage in the secondary. Vs/Vp = Ns/Np = 100/200.',
      overlay(sim,ctx,LH,k){TR(ctx,k,[['Np = 200, Ns = '+f0(sim.p.ns),700,14],'Secondary: '+f0(met(sim,'vsec'))+' V']);} },
    { key: 'dc', lvl: 'honors', title: 'Try DC', set: { scene: 'transformer', vp: 120, np: 200, ns: 100, ac: false }, fresh: true, speed: 1,
      cause: { from: { ac: true }, delay: 0.6, dur: 1, label: 'Alternating current' },
      see: 'Switch the primary to steady DC. The secondary drops to 0 V.',
      why: 'A steady current makes a steady field, and a steady field induces nothing. Transformers only work on AC, which is why the grid uses AC.',
      overlay(sim,ctx,LH,k){TR(ctx,k,[['DC on the primary',700,14],'Secondary: '+f0(met(sim,'vsec'))+' V']);} },
    { key: 'tube', lvl: 'ap', title: 'Magnetic braking', set: { scene: 'tube', tmat: 'copper', wall: 1.5 }, fresh: true, speed: 1,
      see: 'A magnet dropped down a copper tube drifts down at 0.2 m/s and takes about 5 s to fall 1 m. In a plastic tube it falls freely.',
      why: 'Lenz’s law: the falling magnet induces swirling eddy currents in the copper, and their field pushes back on the magnet. Roller coasters and some trains use this for brakes with no friction.',
      overlay(sim,ctx,LH,k){IN(ctx,k,[['Copper tube',700,14],'Speed: '+f2(met(sim,'vel'))+' m/s','1 m takes '+f1(met(sim,'tfall'))+' s']);} }
  ],
  useIt: [
    { do: 'Look at the gray cylinders on power poles near your house.',
      why: 'They are transformers stepping thousands of volts down to the 120 and 240 V your outlets use.' },
    { do: 'Set your phone on a wireless charger and notice it must be centered.', lvl: 'honors',
      why: 'A coil in the charger makes a changing field that induces current in a coil in your phone, like a transformer with an air gap.' }
  ],
  tryIt: [
    { title: 'magnet down a pipe (5 minutes)',
      steps: ['Drop a strong neodymium magnet down a copper pipe or a thick aluminum pipe (hardware stores sell short pieces).', 'Drop a nonmagnetic piece of metal the same size and compare.'],
      look: 'The magnet falls slowly, as if through honey. Nothing touches it: induced currents in the pipe push back.' }
  ]
},
buoyancy: {
  goals: {
    bio: ['Liquid pushes up on anything in it (buoyant force)', 'The scale reading drops when a block goes underwater', 'Things float when they are less dense than the liquid'],
    honors: ['Archimedes: buoyant force = weight of the liquid pushed aside', 'Pressure grows with depth: P = P₀ + ρgh', 'Fraction submerged = ρ_object/ρ_liquid'],
    ap: ['Why pressure differences cause the buoyant force', 'Finding density from weight and apparent weight', 'Independence from depth once fully submerged']
  },
  matters: 'Ships made of steel float, submarines dive and rise, hot-air balloons lift, and ice floats in your drink, all because of buoyancy. Your ears pop at the bottom of the pool because of pressure.',
  question: 'A 2.7 kg block of aluminum hangs from a spring scale. If you lower it into water, what happens to the reading?',
  startKey: 'air', startRun: true,
  steps: [
    { key: 'air', title: 'In air', set: { block: 'alum', fluid: 'water', lower: 0 }, fresh: true, speed: 1,
      see: 'The aluminum block hangs in air. The scale reads its full weight, 26.5 N.',
      why: 'In air the only upward force is the spring scale, so it reads the block’s weight.',
      overlay(sim,ctx,LH,k){BU(ctx,k,[['In air',700,14],'Scale: '+f1(met(sim,'scale'))+' N']);} },
    { key: 'lower', title: 'Lower it into water', set: { block: 'alum', fluid: 'water', lower: 100 }, fresh: true, speed: 1,
      cause: { from: { lower: 0 }, delay: 0.6, dur: 3, label: 'Lower the block' },
      see: 'As the block sinks in, the scale reading falls. Fully under, it reads 16.7 N: the water is holding up 9.8 N.',
      why: { bio: 'Water pushes up on the block. That push, the buoyant force, takes some of the weight off the scale.', honors: 'Archimedes: the buoyant force equals the weight of water pushed aside. The 10 cm cube pushes aside 1 L of water, which weighs 9.8 N. Watch the overflow cup.' },
      overlay(sim,ctx,LH,k){BU(ctx,k,[['Below the surface: '+f0(met(sim,'sub'))+'%',700,13.5],'Scale: '+f1(met(sim,'scale'))+' N','Buoyant force: '+f1(met(sim,'buoy'))+' N']);} },
    { key: 'wood', title: 'Wood floats', set: { block: 'wood', fluid: 'water', lower: 100 }, fresh: true, speed: 1,
      cause: { from: { lower: 0 }, delay: 0.6, dur: 3, label: 'Lower the block' },
      see: 'A wood block settles with 60% under water and the scale goes slack: it floats.',
      why: 'Wood (600 kg/m³) is less dense than water. It sinks only until it has pushed aside its own weight of water, which happens when 60% is under.',
      overlay(sim,ctx,LH,k){BU(ctx,k,[['Wood',700,14],'Below the surface: '+f0(met(sim,'sub'))+'%','Scale: '+f1(met(sim,'scale'))+' N']);} },
    { key: 'ice', title: 'Ice', set: { block: 'ice', fluid: 'water', lower: 100 }, fresh: true, speed: 1,
      cause: { from: { lower: 0 }, delay: 0.6, dur: 3, label: 'Lower the block' },
      see: 'Ice floats with about 92% below the surface.',
      why: 'Ice is 917 kg/m³, just a little less dense than water, so almost all of it sits underwater. That is where “tip of the iceberg” comes from.',
      overlay(sim,ctx,LH,k){BU(ctx,k,[['Ice',700,14],'Below the surface: '+f0(met(sim,'sub'))+'%']);} },
    { key: 'salt', lvl: 'honors', title: 'Salty water', set: { block: 'ice', fluid: 'salt', lower: 100 }, fresh: true, speed: 1,
      cause: { from: { fluid: 'water' }, delay: 0.6, dur: 1, label: 'Liquid' },
      see: 'The same ice in very salty water floats higher: only 76% under.',
      why: 'Denser liquid means each liter pushed aside weighs more, so less has to be submerged. Fraction under = 917 ÷ 1,200 = 0.76. This is why you float more easily in the ocean.',
      overlay(sim,ctx,LH,k){BU(ctx,k,[['Ice in salty water',700,14],'Below the surface: '+f0(met(sim,'sub'))+'%']);} },
    { key: 'mercury', lvl: 'honors', title: 'Aluminum on mercury', set: { block: 'alum', fluid: 'mercury', lower: 100 }, fresh: true, speed: 1,
      see: 'Even aluminum floats on mercury, with only 20% under.',
      why: 'Floating depends only on comparing densities: 2,700 vs. 13,600 kg/m³. Steel ships float because their hollow shape makes the ship’s average density less than water’s.',
      overlay(sim,ctx,LH,k){BU(ctx,k,[['Aluminum on mercury',700,14],'Below the surface: '+f0(met(sim,'sub'))+'%']);} },
    { key: 'press', lvl: 'honors', title: 'Pressure with depth', set: { block: 'alum', fluid: 'water', lower: 0, gdepth: 40 }, fresh: true, speed: 1,
      cause: { from: { gdepth: 0 }, delay: 0.6, dur: 3, label: 'Probe depth' },
      see: 'Lower the pressure probe from the surface to 40 cm. The pressure rises from 101.3 to 105.2 kPa.',
      why: 'P = P₀ + ρgh. Each 10 cm of water adds about 1 kPa. The bottom of a block feels more pressure than its top, and that difference is the buoyant force.',
      overlay(sim,ctx,LH,k){BU(ctx,k,[['Probe at '+f0(sim.p.gdepth)+' cm',700,14],'Pressure: '+f1(met(sim,'press'))+' kPa','ρgh = '+f2(met(sim,'gauge'))+' kPa']);} },
    { key: 'myst', lvl: 'ap', title: 'Find a density', set: { block: 'mystery', fluid: 'water', lower: 100 }, fresh: true, speed: 1,
      cause: { from: { lower: 0 }, delay: 0.6, dur: 3, label: 'Lower the block' },
      see: 'The mystery block weighs 11.8 N in air and 2.0 N underwater.',
      why: 'Buoyant force = 11.8 − 2.0 = 9.8 N, so its volume is 1.0 L. Density = mass ÷ volume = 1.2 kg ÷ 0.001 m³ = 1,200 kg/m³. Archimedes is said to have used this trick to test a gold crown.',
      overlay(sim,ctx,LH,k){BU(ctx,k,[['Mystery block',700,14],'Weight: '+f1(met(sim,'weight'))+' N, scale: '+f1(met(sim,'scale'))+' N','Weight lost: '+f1(met(sim,'loss'))+' N']);} },
    { key: 'hook', title: 'Your question: deeper isn’t lighter', set: { block: 'alum', fluid: 'water', lower: 100 }, fresh: true, speed: 1,
      cause: { from: { lower: 60 }, delay: 0.6, dur: 3, label: 'Lower the block' },
      see: 'Once the block is fully under water, lowering it deeper leaves the scale at 16.7 N: 9.8 N lighter than in air, at any depth.',
      why: 'Deeper water presses harder on both the top and the bottom of the block. The difference between them, the buoyant force, depends only on the volume of water pushed aside. A rock at the lake feels lighter under water, but not lighter still at the bottom.',
      overlay(sim,ctx,LH,k){BU(ctx,k,[['Fully under',700,14],'Scale: '+f1(met(sim,'scale'))+' N','Buoyant force: '+f1(met(sim,'buoy'))+' N']);} }
  ],
  useIt: [
    { do: 'Take a deep breath to float more easily in a pool.',
      why: 'Air in your lungs lowers your average density, so you push aside your weight in water with less of you under.' },
    { do: 'Equalize your ears when you swim to the bottom of a deep pool.', lvl: 'honors',
      why: 'At 3 m the water adds about 30 kPa, almost a third more than the air pressure on your eardrum from inside.' }
  ],
  tryIt: [
    { title: 'the floating egg (10 minutes)',
      steps: ['Put a raw egg in a tall glass of tap water. It sinks.', 'Stir in salt a spoonful at a time.'],
      look: 'After enough salt the egg rises and floats. The salty water became denser than the egg.' }
  ]
},
fluidflow: {
  goals: {
    bio: ['Water speeds up where a pipe gets narrower', 'Faster-moving fluid has lower pressure', 'Water shoots out faster from deeper in a tank'],
    honors: ['Continuity: A₁v₁ = A₂v₂', 'Bernoulli’s equation', 'Torricelli: v = √(2gh)'],
    ap: ['Energy per volume: P + ½ρv² + ρgh', 'Projectile range of the stream', 'Flow rate from hole size']
  },
  matters: 'Putting your thumb over a garden hose, airplane wings, a shower curtain that blows inward and the plumbing in your house all follow these rules.',
  question: 'Water flows from a wide pipe into a narrow one. Does it speed up or slow down, and what happens to its pressure?',
  startKey: 'pipe', startRun: true,
  steps: [
    { key: 'pipe', title: 'A narrowing pipe', set: { mode: 'pipe', Q: 2, d2: 4, d1: 8, h: 0 }, fresh: true, speed: 1,
      see: '2 L of water per second flows from an 8 cm pipe into a 4 cm pipe. It speeds up from 0.40 to 1.59 m/s.',
      why: { bio: 'The same amount of water must get through each second. In a narrower pipe it has to move faster, like cars merging into one lane.', honors: 'Continuity: A₁v₁ = A₂v₂. Half the width is a quarter of the area, so four times the speed.' },
      overlay(sim,ctx,LH,k){FP(ctx,k,[['8 cm → '+f1(sim.p.d2)+' cm',700,14],'v₁ = '+f2(met(sim,'v1'))+' m/s','v₂ = '+f2(met(sim,'v2'))+' m/s']);} },
    { key: 'press', title: 'Faster means lower pressure', set: { mode: 'pipe', Q: 2, d2: 4, d1: 8, h: 0 }, fresh: true, speed: 1,
      see: 'The water columns show the pressure. In the fast, narrow section the pressure is lower: 23.8 kPa vs. 25.0 kPa.',
      why: 'To speed the water up, something has to push it forward, so the pressure behind must be higher than the pressure ahead. That is Bernoulli’s principle.',
      overlay(sim,ctx,LH,k){FP(ctx,k,[['Pressure',700,14],'P₁ = '+f1(met(sim,'P1'))+' kPa','P₂ = '+f1(met(sim,'P2'))+' kPa']);} },
    { key: 'narrow', title: 'Narrower still', set: { mode: 'pipe', Q: 2, d2: 3, d1: 8, h: 0 }, fresh: true, speed: 1,
      cause: { from: { d2: 4 }, delay: 0.6, dur: 2, label: 'Width of section 2' },
      see: 'Squeeze section 2 to 3 cm. The water races at 2.83 m/s and the pressure drops to 21.1 kPa.',
      why: 'This is what your thumb does on a garden hose: a smaller opening, a faster jet.',
      overlay(sim,ctx,LH,k){FP(ctx,k,[['8 cm → '+f1(sim.p.d2)+' cm',700,14],'v₂ = '+f2(met(sim,'v2'))+' m/s','P₂ = '+f1(met(sim,'P2'))+' kPa']);} },
    { key: 'up', lvl: 'honors', title: 'Uphill', set: { mode: 'pipe', Q: 2, d2: 4, d1: 8, h: 1 }, fresh: true, speed: 1,
      cause: { from: { h: 0 }, delay: 0.6, dur: 2, label: 'Height of section 2' },
      see: 'Raise section 2 by 1 m. Its pressure falls to 14.0 kPa.',
      why: 'Bernoulli: P + ½ρv² + ρgh stays the same along the pipe. Lifting water 1 m costs ρgh = 9.8 kPa of pressure. That is why upstairs showers have weaker pressure.',
      overlay(sim,ctx,LH,k){FP(ctx,k,[['Section 2 up '+f1(sim.p.h)+' m',700,14],'P₂ = '+f1(met(sim,'P2'))+' kPa']);} },
    { key: 'tank', title: 'A hole in a tank', set: { mode: 'tank', level: 2, hole: 1, refill: true }, fresh: true, speed: 1,
      see: 'A hole 1 m below the water surface. Water shoots out at 4.43 m/s and lands 2.0 m away.',
      why: { bio: 'The deeper the hole, the more water presses down above it, and the faster the water comes out.', honors: 'Torricelli: v = √(2gh) = √(2 × 9.8 × 1.0) = 4.43 m/s, the same speed as something dropped 1 m.' },
      overlay(sim,ctx,LH,k){FT(ctx,k,[['Hole 1 m below the surface',700,14],'Exit speed: '+f2(met(sim,'vout'))+' m/s','Lands '+f2(met(sim,'range'))+' m away']);} },
    { key: 'deep', title: 'A lower hole', set: { mode: 'tank', level: 2, hole: 0.5, refill: true }, fresh: true, speed: 1,
      cause: { from: { hole: 1 }, delay: 0.6, dur: 2, label: 'Hole height' },
      see: 'Move the hole down to 0.5 m off the floor. It shoots out faster, 5.42 m/s, but lands closer: 1.73 m.',
      why: 'The water is faster, but it starts lower, so it has less time in the air before it hits the floor.',
      overlay(sim,ctx,LH,k){FT(ctx,k,[['Hole 1.5 m below the surface',700,14],'Exit speed: '+f2(met(sim,'vout'))+' m/s','Lands '+f2(met(sim,'range'))+' m away']);} },
    { key: 'best', lvl: 'ap', title: 'The farthest stream', set: { mode: 'tank', level: 2, hole: 1.5, refill: true }, fresh: true, speed: 1,
      cause: { from: { hole: 0.5 }, delay: 0.6, dur: 3, label: 'Hole height' },
      see: 'A hole at 1.5 m also lands 1.73 m away. The hole halfway up (1.0 m) shot farthest.',
      why: 'Range = v·t = √(2g(H − y)) · √(2y/g) = 2√(y(H − y)), largest when y = H/2. Holes equally far above and below the middle land at the same spot.',
      overlay(sim,ctx,LH,k){FT(ctx,k,[['Hole at '+f1(sim.p.hole)+' m',700,14],'Exit speed: '+f2(met(sim,'vout'))+' m/s','Lands '+f2(met(sim,'range'))+' m away']);} }
  ],
  useIt: [
    { do: 'Cover part of a hose end with your thumb to spray farther.',
      why: 'A smaller opening makes the water move faster (continuity), so it shoots farther.' },
    { do: 'Notice your shower curtain bulge inward when the water is on.', lvl: 'honors',
      why: 'Moving air and water inside the shower have lower pressure than the still air outside, which pushes the curtain in.' }
  ],
  tryIt: [
    { title: 'the bottle with three holes (10 minutes, outside)',
      steps: ['Poke three holes down the side of a plastic bottle: near the top, the middle and the bottom.', 'Cover them, fill the bottle, set it on a step and uncover them.'],
      look: 'The bottom stream shoots fastest, but the middle one may land farthest, just like the tank in the sim.' }
  ]
}
});
})();
