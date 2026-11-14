/* Raider PhysLab: topic sections and course pathways (from the courses' Canvas modules, Fall 2026 + Spring 2026).
   Tool ids that are not built yet are skipped automatically. */
BioLab.setSections({
  units: { 1: 'Motion (kinematics)', 2: 'Forces and Newton’s laws', 3: 'Work, energy and power', 4: 'Momentum and collisions',
           5: 'Torque and rotation', 6: 'Oscillations', 7: 'Fluids', 8: 'Waves and sound', 9: 'Light and optics',
           10: 'Electrostatics', 11: 'Circuits', 12: 'Magnetism and induction' },
  extra: { 0: 'Science skills and data', 13: 'Go further' },
  order: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  further: 13,
  unitPrefix: ''
});

BioLab.COURSES = [
  { id: 'phys',finals:[{"t": "Physics fall final review", "units": [0, 1, 2, 3], "note": "Covers Units 1 to 4: motion, projectiles, forces, circular motion and gravity. Your teacher decides what is on the final, so check the study guide."}], name: 'Physics',
    blurb: 'Tools in the order Physics covers them, unit by unit.',
    units: [
      { n: 'Unit 1', t: 'One-dimensional motion', ids: ['motion1d', 'freefall'], links: [{ lesson: true, href: 'https://jackson-classroom.github.io/physics/1d-kinematics/position-time-graphs/', title: 'Position–time graphs', label: 'Mr. Jackson’s lesson', text: 'Read the graph, then walk the graph: slope, distance and displacement.', kind: 'Lesson' }] },
      { n: 'Unit 2', t: 'Two-dimensional motion and projectiles', ids: ['vectors2d', 'projectile'] },
      { n: 'Unit 3', t: 'Forces and Newton’s laws', ids: ['forces', 'friction', 'atwood', 'incline', 'elevator', 'twobody'], links: [{ lesson: true, href: 'https://jackson-classroom.github.io/physics/forces/newtons-first-law/', title: 'Newton’s first law', label: 'Mr. Jackson’s lesson', text: 'Free-body diagrams: balanced or unbalanced?', kind: 'Lesson' }, { lesson: true, href: 'https://jackson-classroom.github.io/physics/forces/net-force/', title: 'Net force and F = ma', label: 'Mr. Jackson’s lesson', text: 'Find the net force, then the acceleration.', kind: 'Lesson' }] },
      { n: 'Unit 4', t: 'Circular motion and gravity', ids: ['circular', 'gravity'] },
      { n: 'Unit 5', t: 'Work, power and energy', ids: ['skatepark', 'power'] },
      { n: 'Unit 6', t: 'Momentum', ids: ['collisions', 'impulse'] },
      { n: 'Unit 7', t: 'Waves and sound', ids: ['waves', 'sound'] },
      { n: 'Unit 8', t: 'Light and optics', ids: ['color', 'refraction', 'lenses'] }
    ],
    further: ['rocket', 'chaos', 'relativity'] },
  { id: 'honors',finals:[{"t": "Honors Physics fall final review", "units": [0, 1, 2, 3, 4], "note": "Covers Units 1 to 5, through work, energy and power. Your teacher decides what is on the final, so check the study guide."}], name: 'Honors Physics',
    blurb: 'Tools in the order Honors Physics covers them: first semester, then second.',
    units: [
      { n: 'Unit 1', t: 'One-dimensional motion', ids: ['motion1d', 'freefall', 'linearize'] },
      { n: 'Unit 2', t: 'Two-dimensional motion', ids: ['vectors2d', 'projectile'] },
      { n: 'Unit 3', t: 'Forces and Newton’s laws', ids: ['forces', 'friction', 'incline', 'elevator', 'twobody', 'atwood'] },
      { n: 'Unit 4', t: 'Circular motion and gravity', ids: ['circular', 'gravity'] },
      { n: 'Unit 5', t: 'Work, power and energy', ids: ['skatepark', 'power', 'springs'] },
      { n: 'Unit 6', t: 'Momentum and collisions', ids: ['collisions', 'impulse'] },
      { n: 'Unit 7', t: 'Waves and sound', ids: ['pendulum', 'waves', 'sound'] },
      { n: 'Unit 8', t: 'Optics', ids: ['color', 'refraction', 'lenses'] },
      { n: 'Unit 9', t: 'Circuits and electricity', ids: ['coulomb', 'circuit', 'magnetism'] }
    ],
    further: ['rocket', 'chaos', 'relativity', 'photoelectric'] },
  { id: 'ap1',finals:[{"t": "AP Physics 1 fall final review", "units": [0, 1, 2, 3], "note": "Covers AP Units 1 to 4: kinematics, dynamics, energy and momentum. Your teacher decides what is on the final, so check the study guide."}], name: 'AP Physics 1',
    blurb: 'Tools in the order AP Physics 1 covers them, matching the AP units.',
    units: [
      { n: 'Unit 1', t: 'Kinematics', ids: ['motion1d', 'freefall', 'vectors2d', 'projectile', 'linearize'] },
      { n: 'Unit 2', t: 'Force and translational dynamics', ids: ['forces', 'friction', 'incline', 'elevator', 'atwood', 'twobody', 'circular', 'gravity'] },
      { n: 'Unit 3', t: 'Work, energy and power', ids: ['skatepark', 'power', 'springs'] },
      { n: 'Unit 4', t: 'Linear momentum', ids: ['collisions', 'impulse'] },
      { n: 'Unit 5', t: 'Torque and rotational dynamics', ids: ['torque', 'rotation'] },
      { n: 'Unit 6', t: 'Energy and momentum of rotating systems', ids: ['rotation'] },
      { n: 'Unit 7', t: 'Oscillations', ids: ['pendulum', 'springs'] },
      { n: 'Unit 8', t: 'Fluids', ids: ['buoyancy', 'fluidflow'] }
    ],
    further: ['rocket', 'chaos', 'relativity', 'photoelectric'] },
  { id: 'apc',finals:[{"t": "AP Physics C fall final review", "units": [0, 1, 2], "note": "Covers kinematics, Newton’s laws, work, energy and momentum. Add rotation if your class has reached it. Your teacher decides what is on the final, so check the study guide."}], name: 'AP Physics C',
    blurb: 'Tools in the order AP Physics C covers them: Mechanics in the fall, Electricity and Magnetism in the spring.',
    units: [
      { n: 'Fall', t: 'Kinematics', ids: ['motion1d', 'projectile', 'linearize'] },
      { n: 'Fall', t: 'Newton’s laws', ids: ['forces', 'atwood', 'circular', 'gravity'] },
      { n: 'Fall', t: 'Work, energy and momentum', ids: ['skatepark', 'collisions', 'impulse'] },
      { n: 'Fall', t: 'Rotation and oscillations', ids: ['rotation', 'torque', 'pendulum', 'springs'] },
      { n: 'Spring', t: 'Electrostatics', ids: ['coulomb', 'efield'] },
      { n: 'Spring', t: 'Electric potential and capacitance', ids: ['efield', 'capacitor'] },
      { n: 'Spring', t: 'Circuits', ids: ['circuit', 'capacitor'] },
      { n: 'Spring', t: 'Magnetism and induction', ids: ['magnetism', 'induction'] }
    ],
    further: ['chaos', 'rocket', 'relativity', 'photoelectric'] },
  { id: 'eng', name: 'Engineering Principles & Design',
    blurb: 'Tools for each spring build in Engineering Principles & Design: the physics behind the truss, the earthquake tower, the mousetrap car and the egg drop.',
    units: [
      { n: 'Unit 1', t: 'Forces and the design process', ids: ['forces', 'torque'] },
      { n: 'Unit 2', t: 'Structures: the roof truss', ids: ['forces', 'twobody', 'incline'], links: [{ href: 'https://rjedtech.github.io/Raider-MathLab/truss', title: 'Truss forces', label: 'Raider MathLab', text: 'Find the force in each member of a roof truss.', kind: 'MathLab' }, { href: 'https://rjedtech.github.io/Raider-MathLab/ramp', title: 'Ramp slope', label: 'Raider MathLab', text: 'Rise, run and the angle of a ramp.', kind: 'MathLab' }] },
      { n: 'Unit 3', t: 'Earthquake tower and vibrations', ids: ['quaketower', 'springs', 'pendulum'] },
      { n: 'Unit 4', t: 'Mousetrap car: energy, gears and friction', ids: ['gears', 'skatepark', 'power', 'friction', 'rotation', 'torque'] },
      { n: 'Unit 5', t: 'Aerospace, fluids and the egg drop', ids: ['projectile', 'fluidflow', 'rocket', 'impulse'] },
      { n: 'Unit 6', t: 'Final design project', ids: ['quaketower', 'gears', 'impulse'] }
    ],
    further: ['collisions', 'buoyancy'] },
  { id: 'robo', name: 'Robotics 1',
    blurb: 'Tools for each Robotics 1 challenge: timing a program, motors and gears, sensors and collisions.',
    units: [
      { n: 'Unit 1', t: 'Obstacle course: program by time', ids: ['botdrive', 'motion1d', 'circular'] },
      { n: 'Unit 2', t: 'Delivery bot: motors and circuits', ids: ['botdrive', 'circuit', 'magnetism'] },
      { n: 'Unit 3', t: 'Racing bot: gears and torque', ids: ['gears', 'rotation', 'torque', 'power', 'friction'] },
      { n: 'Unit 4', t: 'Soccer bot: collisions and kicks', ids: ['collisions', 'impulse', 'projectile'] },
      { n: 'Unit 5', t: 'Lifting bot: ramps and power', ids: ['power', 'incline', 'gears'] }
    ],
    further: ['sound', 'induction'] }
];

/* Faith and Physics stories (faith.html), placed in the Physics and Honors Physics units they go with. */
(function(){
  const F=(id,t,x)=>({href:'faith.html#'+id,title:t,label:'Faith and Physics',text:x,kind:'Faith and Physics'});
  const RIC=F('riccioli-g','Two Jesuits measure g','Riccioli and Grimaldi’s 1640s tower drops. Find their g.'),
    ICE=F('stopping-distance','Friction, ice and your car','Braking on ice and the force a seat belt spreads out.'),
    MOON=F('moon-names','A Jesuit map of the Moon','Riccioli’s Moon names, then repeat Newton’s Moon test.'),
    LEM=F('lemaitre-vatt','Lemaître and the Pope’s telescope','The expanding universe and the Vatican telescope in Arizona.'),
    SUN=F('fratello-sole','Brother Sun','The Vatican’s solar farm: power and energy.'),
    LIGHT=F('grimaldi-secchi','Grimaldi and Secchi','Diffraction, star colors and E = hf.'),
    NOB26=F('nobel-2026-icecube','2026 Nobel: IceCube','A telescope made of Antarctic ice.'),
    NOB25=F('nobel-2025-quantum','2025 Nobel: quantum circuits','Energy comes in packets: E = hf.');
  const ADD={phys:{0:[RIC],2:[ICE],3:[MOON,LEM],4:[SUN],7:[LIGHT,NOB26]},honors:{0:[RIC],2:[ICE],3:[MOON,LEM],4:[SUN],7:[LIGHT,NOB26],8:[NOB25]}};
  BioLab.COURSES.forEach(c=>{const a=ADD[c.id];if(!a)return;Object.keys(a).forEach(i=>{const u=c.units[+i];if(u)u.links=(u.links||[]).concat(a[i]);});});
  const phys=BioLab.COURSES.find(c=>c.id==='phys');if(phys)phys.furtherLinks=(phys.furtherLinks||[]).concat([NOB25]);
})();

BioLab.TOPIC_ORDER = {
  0: ['linearize'],
  1: ['motion1d', 'freefall', 'vectors2d', 'projectile', 'botdrive'],
  2: ['forces', 'friction', 'incline', 'elevator', 'atwood', 'twobody', 'circular', 'gravity'],
  3: ['skatepark', 'power'],
  4: ['collisions', 'impulse'],
  5: ['torque', 'rotation', 'gears'],
  6: ['pendulum', 'springs', 'quaketower'],
  7: ['buoyancy', 'fluidflow'],
  8: ['waves', 'sound', 'shotspotter'],
  9: ['color', 'refraction', 'lenses', 'oximeter'],
  10: ['coulomb', 'efield', 'capacitor'],
  11: ['circuit'],
  12: ['magnetism', 'induction'],
  13: ['rocket', 'chaos', 'relativity', 'photoelectric']
};
