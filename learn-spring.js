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
})();
