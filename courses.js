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
  { id: 'phys', name: 'Physics',
    blurb: 'Tools in the order Physics covers them, unit by unit.',
    units: [
      { n: 'Unit 1', t: 'One-dimensional motion', ids: ['motion1d', 'freefall'] },
      { n: 'Unit 2', t: 'Two-dimensional motion and projectiles', ids: ['vectors2d', 'projectile'] },
      { n: 'Unit 3', t: 'Forces and Newton’s laws', ids: ['forces', 'friction', 'incline'] },
      { n: 'Unit 4', t: 'Circular motion and gravity', ids: ['circular', 'gravity'] },
      { n: 'Unit 5', t: 'Work, power and energy', ids: ['skatepark', 'power'] },
      { n: 'Unit 6', t: 'Momentum', ids: ['collisions', 'impulse'] },
      { n: 'Unit 7', t: 'Waves and sound', ids: ['waves', 'sound'] },
      { n: 'Unit 8', t: 'Light and optics', ids: ['refraction', 'lenses'] }
    ],
    further: ['rocket', 'chaos', 'relativity'] },
  { id: 'honors', name: 'Honors Physics',
    blurb: 'Tools in the order Honors Physics covers them: first semester, then second.',
    units: [
      { n: 'Unit 1', t: 'One-dimensional motion', ids: ['motion1d', 'freefall', 'linearize'] },
      { n: 'Unit 2', t: 'Two-dimensional motion', ids: ['vectors2d', 'projectile'] },
      { n: 'Unit 3', t: 'Forces and Newton’s laws', ids: ['forces', 'friction', 'incline', 'atwood'] },
      { n: 'Unit 4', t: 'Circular motion and gravity', ids: ['circular', 'gravity'] },
      { n: 'Unit 5', t: 'Work, power and energy', ids: ['skatepark', 'power', 'springs'] },
      { n: 'Unit 6', t: 'Momentum and collisions', ids: ['collisions', 'impulse'] },
      { n: 'Unit 7', t: 'Waves and sound', ids: ['pendulum', 'waves', 'sound'] },
      { n: 'Unit 8', t: 'Optics', ids: ['refraction', 'lenses'] },
      { n: 'Unit 9', t: 'Circuits and electricity', ids: ['coulomb', 'circuit', 'magnetism'] }
    ],
    further: ['rocket', 'chaos', 'relativity', 'photoelectric'] },
  { id: 'ap1', name: 'AP Physics 1',
    blurb: 'Tools in the order AP Physics 1 covers them, matching the AP units.',
    units: [
      { n: 'Unit 1', t: 'Kinematics', ids: ['motion1d', 'freefall', 'vectors2d', 'projectile', 'linearize'] },
      { n: 'Unit 2', t: 'Force and translational dynamics', ids: ['forces', 'friction', 'incline', 'atwood', 'circular', 'gravity'] },
      { n: 'Unit 3', t: 'Work, energy and power', ids: ['skatepark', 'power', 'springs'] },
      { n: 'Unit 4', t: 'Linear momentum', ids: ['collisions', 'impulse'] },
      { n: 'Unit 5', t: 'Torque and rotational dynamics', ids: ['torque', 'rotation'] },
      { n: 'Unit 6', t: 'Energy and momentum of rotating systems', ids: ['rotation'] },
      { n: 'Unit 7', t: 'Oscillations', ids: ['pendulum', 'springs'] },
      { n: 'Unit 8', t: 'Fluids', ids: ['buoyancy', 'fluidflow'] }
    ],
    further: ['rocket', 'chaos', 'relativity', 'photoelectric'] },
  { id: 'apc', name: 'AP Physics C',
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
    further: ['chaos', 'rocket', 'relativity', 'photoelectric'] }
];

BioLab.TOPIC_ORDER = {
  0: ['linearize'],
  1: ['motion1d', 'freefall', 'vectors2d', 'projectile'],
  2: ['forces', 'friction', 'incline', 'atwood', 'circular', 'gravity'],
  3: ['skatepark', 'power'],
  4: ['collisions', 'impulse'],
  5: ['torque', 'rotation'],
  6: ['pendulum', 'springs'],
  7: ['buoyancy', 'fluidflow'],
  8: ['waves', 'sound'],
  9: ['refraction', 'lenses'],
  10: ['coulomb', 'efield', 'capacitor'],
  11: ['circuit'],
  12: ['magnetism', 'induction'],
  13: ['rocket', 'chaos', 'relativity', 'photoelectric']
};
