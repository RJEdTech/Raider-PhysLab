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
      overlay(sim,ctx,LH,k){EF(ctx,k,[['ΔV = '+String(met(sim,'dV')),700,14],['W = '+String(met(sim,'W')),700,13.5,RED]]);} }
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
      overlay(sim,ctx,LH,k){TB(ctx,k,[['Closed tube, L = 0.85 m',700,14],'λ = 4L = '+f2(met(sim,'lamT'))+' m','f = '+f0(met(sim,'fres'))+' Hz']);} }
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
      overlay(sim,ctx,LH,k){CP(ctx,k,[['Discharging, τ = 1.0 s',700,14],'t = '+f1(sim.t)+' s','Capacitor: '+f2(met(sim,'vc'))+' V ('+f0(met(sim,'pct'))+'%)']);} }
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
})();
