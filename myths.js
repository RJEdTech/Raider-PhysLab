/* Myth or fact (idea from Dr. Sandy Robertson's ENSO Explorer, Nov 17, 2026). See ENGINE.md.
   BioLab.addMyths({toolId:[{k,s,fact,why,lvl}]}): one graded try, then why. Mix in real facts. */
BioLab.addMyths({
freefall:[
 {k:'heavy',s:'With no air resistance, a heavy ball falls faster than a light one.',fact:false,why:'Every object falls with the same acceleration, about 9.8 m/s² near Earth, if air is not a factor. Apollo 15 dropped a hammer and a feather on the Moon and they landed together.'},
 {k:'air',s:'A feather falls slowly on Earth because of the air, not because it is light.',fact:true,why:'Air pushes back on its large surface compared with its tiny weight. In a vacuum tube, a feather drops like a coin.'},
 {k:'top',s:'At the top of its path, a ball thrown straight up has zero acceleration.',fact:false,why:'Its velocity is zero for an instant, but gravity still pulls at 9.8 m/s² downward the whole time. That is why it starts back down.'},
 {k:'grow',s:'A falling object covers more distance in each second than in the second before.',fact:true,why:'Its speed keeps growing, so it travels about 4.9 m in the first second, 14.7 m in the next and 24.5 m in the third.'}
],
projectile:[
 {k:'drop',s:'A bullet fired level and a bullet dropped from the same height hit the ground at the same time.',fact:true,why:'Sideways speed does not change the downward fall. Both start with zero downward speed and fall the same way (ignoring air and the curve of the Earth).'},
 {k:'45',s:'On level ground with no air, 45° gives the longest throw.',fact:true,why:'Range depends on sin(2θ), which is biggest at 2θ = 90°. Real throws with air resistance do best a bit lower.'},
 {k:'force',s:'A ball keeps moving forward after it leaves your hand because a forward force stays with it.',fact:false,why:'No forward force is needed to keep moving. Once released, the only force (without air) is gravity, straight down. Its sideways speed simply stays the same.'},
 {k:'straight',s:'A cannonball flies in a straight line, then drops straight down.',fact:false,why:'Gravity acts from the start, so the path curves into a parabola the whole way.'}
]
});

/* Batch 2 (Nov 17, 2026): the rest of PhysLab. */
BioLab.addMyths({
linearize:[
 {k:'line',s:'If a graph of your data curves, you can sometimes straighten it by graphing something else, like 1/x or x².',fact:true,why:'That is linearizing. A straight line makes the relationship and its constant easy to read from the slope.'},
 {k:'dots',s:'A best-fit line should pass through every data point.',fact:false,why:'Real data has scatter. The best-fit line balances the points above and below it.'},
 {k:'slope',s:'The slope of a graph has units.',fact:true,why:'Slope is (y units)/(x units). A position–time slope is in m/s, a velocity.'}
],
motion1d:[
 {k:'zero',s:'An object with zero velocity must have zero acceleration.',fact:false,why:'A ball at the top of a toss has zero velocity for an instant but still accelerates at 9.8 m/s² downward.'},
 {k:'neg',s:'A negative acceleration always means slowing down.',fact:false,why:'Negative only means the direction. An object moving in the negative direction and speeding up has negative acceleration.'},
 {k:'area',s:'The area under a velocity–time graph is the displacement.',fact:true,why:'Velocity × time = displacement, so the area adds up how far the object moved.'}
],
vectors2d:[
 {k:'add',s:'Walking 3 m east and then 4 m north puts you 7 m from where you started.',fact:false,why:'Displacements add as vectors. You are 5 m away (3-4-5 right triangle).'},
 {k:'indep',s:'Horizontal and vertical motion can be handled separately.',fact:true,why:'Perpendicular components don’t affect each other, which is how projectile problems are solved.'},
 {k:'river',s:'Swimming straight across a river, the current carries you downstream even though you aim straight across.',fact:true,why:'Your velocity relative to the ground is your swimming velocity plus the water’s velocity.'}
],
botdrive:[
 {k:'exact',s:'If you tell a robot to drive 2 seconds at full speed, it always goes exactly the same distance.',fact:false,why:'Battery level, wheel slip and the floor change the result. That is why robots use sensors and feedback.'},
 {k:'dist',s:'Distance = speed × time works for a robot moving at a steady speed.',fact:true,why:'If speed is constant, multiply it by time to predict how far it goes.'},
 {k:'turn',s:'A robot turns by spinning its two wheels at different speeds.',fact:true,why:'If the left wheel goes faster than the right, the robot curves to the right.'}
],
forces:[
 {k:'moving',s:'An object needs a force to keep moving at a steady speed.',fact:false,why:'With no net force, it keeps its velocity (Newton’s first law). On Earth you push only to cancel friction.'},
 {k:'third',s:'When you push on a wall, the wall pushes back on you just as hard.',fact:true,why:'Newton’s third law: forces come in equal and opposite pairs on different objects.'},
 {k:'fma',s:'Doubling the net force on a cart doubles its acceleration.',fact:true,why:'a = F/m, so acceleration is proportional to the net force.'}
],
friction:[
 {k:'area',s:'A wider block has more sliding friction than a narrow block of the same mass.',fact:false,why:'For most surfaces, friction depends on the normal force and the materials, not the contact area.'},
 {k:'static',s:'It usually takes more force to start something sliding than to keep it sliding.',fact:true,why:'Static friction is usually larger than kinetic friction.'},
 {k:'walk',s:'You need friction to walk.',fact:true,why:'Your foot pushes back on the ground, and friction pushes you forward. On ice, there isn’t enough.'}
],
incline:[
 {k:'normal',s:'On a ramp, the normal force equals the object’s weight.',fact:false,why:'On a slope, the normal force is mg cos θ, which is less than the weight.'},
 {k:'steep',s:'A steeper ramp gives a block a bigger acceleration down it, ignoring friction.',fact:true,why:'The part of gravity along the ramp is mg sin θ, which grows with the angle.'},
 {k:'mass',s:'A heavier block slides down a frictionless ramp faster than a lighter one.',fact:false,why:'a = g sin θ, so mass cancels. Both speed up the same way.'}
],
elevator:[
 {k:'scale',s:'A bathroom scale measures the force it pushes up on you, not your mass.',fact:true,why:'That is why it reads more when an elevator starts up and less when it starts down.'},
 {k:'const',s:'In an elevator moving up at constant speed, you feel heavier.',fact:false,why:'At constant speed there’s no acceleration, so the scale reads your normal weight.'},
 {k:'fall',s:'If the cable broke, a scale under your feet would read zero.',fact:true,why:'You and the scale would fall together, so it wouldn’t push on you. That is apparent weightlessness.'}
],
atwood:[
 {k:'equal',s:'With two equal masses on a pulley, they can still be moving.',fact:true,why:'Equal masses mean zero net force, so they move at constant velocity or stay still.'},
 {k:'tension',s:'The rope tension always equals the weight of the heavier mass.',fact:false,why:'If the heavy side is accelerating down, the tension is less than its weight, or it wouldn’t speed up.'},
 {k:'slow',s:'An Atwood machine slows down free fall so it is easier to measure.',fact:true,why:'a = (m₁ − m₂)g / (m₁ + m₂), which can be much less than g.'}
],
twobody:[
 {k:'pull',s:'Pulling at an upward angle can reduce friction on a box.',fact:true,why:'The upward part of your pull lowers the normal force, so friction drops.'},
 {k:'same',s:'Two boxes tied together and pulled have the same acceleration.',fact:true,why:'The rope keeps them moving together, so you can treat them as one system to find a.'},
 {k:'rope',s:'The rope between the boxes pulls as hard as you do.',fact:false,why:'It only accelerates the back box, so its tension is less than your pull.'}
],
circular:[
 {k:'cf',s:'In a turning car, a real outward force throws you toward the door.',fact:false,why:'Your body tends to keep going straight. The door pushes you inward to make you turn with the car.'},
 {k:'speed',s:'An object moving in a circle at constant speed is accelerating.',fact:true,why:'Its direction keeps changing, so its velocity changes. The acceleration points toward the center.'},
 {k:'string',s:'If the string breaks, a whirled ball flies straight outward from the center.',fact:false,why:'It flies off along a tangent, in the direction it was moving at that instant.'}
],
gravity:[
 {k:'space',s:'Astronauts on the space station float because there is no gravity there.',fact:false,why:'Gravity there is about 90% as strong as on the ground. They float because they and the station are falling together around Earth.'},
 {k:'inverse',s:'Doubling the distance between two objects cuts their gravity to one quarter.',fact:true,why:'Gravity follows an inverse-square law: F ∝ 1/r².'},
 {k:'moon',s:'The Moon pulls on Earth as hard as Earth pulls on the Moon.',fact:true,why:'Newton’s third law. Earth’s larger mass means it accelerates much less.'}
],
power:[
 {k:'work',s:'Holding a heavy box still for a minute does work on the box.',fact:false,why:'In physics, work needs a force through a distance. Your muscles use energy, but the box gains none.'},
 {k:'stairs',s:'Running up stairs takes more power than walking up them, but the same work.',fact:true,why:'Same height, same work (mgh). Doing it faster means more power.'},
 {k:'watt',s:'A watt is one joule per second.',fact:true,why:'A 60 W bulb uses 60 J of energy every second.'}
],
skatepark:[
 {k:'height',s:'With no friction, a skater can rise higher than where she started.',fact:false,why:'Her total energy is fixed, so she can only get back to her starting height.'},
 {k:'mass',s:'With no friction, a heavier skater and a lighter one have the same speed at the bottom.',fact:true,why:'mgh = ½mv², so mass cancels: v = √(2gh).'},
 {k:'heat',s:'With friction, the missing energy turns into thermal energy.',fact:true,why:'Energy is not lost; it warms the wheels and track.'}
],
workenergy:[
 {k:'double',s:'Doubling a car’s speed doubles its kinetic energy.',fact:false,why:'KE = ½mv², so doubling speed quadruples kinetic energy, and the braking distance too.'},
 {k:'area',s:'The area under a force–distance graph equals the work done.',fact:true,why:'Work = force × distance, so the area adds up the work even when the force changes.'},
 {k:'spring',s:'Stretching a spring twice as far stores four times the energy.',fact:true,why:'Spring energy is ½kx², so it grows with the square of the stretch.'}
],
collisions:[
 {k:'ke',s:'In every collision, kinetic energy is conserved.',fact:false,why:'Momentum is conserved in every collision, but in inelastic ones some kinetic energy turns into heat, sound and dents.'},
 {k:'mom',s:'Total momentum is the same before and after a collision, if no outside force acts.',fact:true,why:'The forces between the objects are equal and opposite, so their momentum changes cancel.'},
 {k:'stick',s:'When two carts stick together, kinetic energy is lost.',fact:true,why:'That is a perfectly inelastic collision, the most kinetic energy that can be lost while momentum is conserved.'}
],
impulse:[
 {k:'airbag',s:'An air bag reduces the change in your momentum during a crash.',fact:false,why:'You still go from moving to stopped. The air bag stretches out the time, so the force on you is smaller.'},
 {k:'catch',s:'Pulling your hands back when you catch an egg makes it less likely to break.',fact:true,why:'The same impulse over a longer time means a smaller force (FΔt = Δp).'},
 {k:'bounce',s:'A ball that bounces back gets a bigger impulse than one that stops dead.',fact:true,why:'Its momentum changes from forward to backward, a bigger change than going to zero.'}
],
rotation:[
 {k:'skater',s:'A spinning skater speeds up when she pulls her arms in.',fact:true,why:'Angular momentum stays the same, so a smaller rotational inertia means a faster spin.'},
 {k:'roll',s:'A solid ball and a hollow ball of the same size reach the bottom of a ramp together.',fact:false,why:'The hollow ball has more of its mass far from the center, so more energy goes into spinning and it arrives later.'},
 {k:'same',s:'Every point on a spinning wheel turns through the same angle in the same time.',fact:true,why:'They share the same angular speed, but points farther out move faster.'}
],
torque:[
 {k:'handle',s:'A door is easier to open when you push near the hinges.',fact:false,why:'Torque = force × lever arm. Pushing far from the hinges gives more torque for the same force.'},
 {k:'seesaw',s:'A lighter kid can balance a heavier kid by sitting farther from the pivot.',fact:true,why:'Balance needs equal torques: weight × distance must match on both sides.'},
 {k:'wrench',s:'A longer wrench makes it easier to loosen a stuck bolt.',fact:true,why:'A longer lever arm means more torque for the same push.'}
],
gears:[
 {k:'free',s:'Gears let you get more work out than you put in.',fact:false,why:'Gears trade speed for force (torque). Work out can’t be more than work in.'},
 {k:'bike',s:'A low gear on a bike makes hills easier because you trade speed for torque.',fact:true,why:'You pedal more turns for each wheel turn, so each push needs less force.'},
 {k:'dir',s:'Two meshed gears turn in opposite directions.',fact:true,why:'Their teeth push each other’s edges the opposite way.'}
],
springs:[
 {k:'hooke',s:'Doubling the weight on a spring doubles the stretch, within its limit.',fact:true,why:'Hooke’s law: F = kx. Past the elastic limit, the spring is permanently bent.'},
 {k:'period',s:'Pulling a mass on a spring farther makes it bounce up and down faster.',fact:false,why:'A bigger stretch means a bigger, faster swing, but the period stays the same. It depends only on mass and k.'},
 {k:'mass',s:'A heavier mass on the same spring bounces more slowly.',fact:true,why:'T = 2π√(m/k), so more mass means a longer period.'}
],
pendulum:[
 {k:'mass',s:'A heavier bob makes a pendulum swing faster.',fact:false,why:'For a simple pendulum, the period depends on length and g, not mass.'},
 {k:'length',s:'A longer pendulum takes longer for each swing.',fact:true,why:'T = 2π√(L/g). Four times the length doubles the period.'},
 {k:'small',s:'For small swings, the period barely changes with how far you pull it back.',fact:true,why:'That is why pendulums kept time in clocks for centuries.'}
],
quaketower:[
 {k:'res',s:'A building shakes most when the ground shakes at the building’s natural frequency.',fact:true,why:'That is resonance: each push adds to the motion at the right moment.'},
 {k:'tall',s:'Tall buildings are always the most dangerous in an earthquake.',fact:false,why:'It depends on whether the ground’s shaking matches a building’s natural frequency. In Mexico City in 1985, mid-rise buildings were hit hardest.'},
 {k:'damper',s:'Some skyscrapers use a huge weight that sways against the motion to reduce shaking.',fact:true,why:'Taipei 101 has a tuned mass damper of about 660 metric tons.'}
],
buoyancy:[
 {k:'deep',s:'A submarine floating in the middle of the sea feels more buoyant force the deeper it goes.',fact:false,why:'Buoyant force equals the weight of water displaced, which barely changes with depth because water hardly compresses.'},
 {k:'arch',s:'The buoyant force equals the weight of the fluid the object pushes aside.',fact:true,why:'That is Archimedes’ principle.'},
 {k:'pressure',s:'Water pressure increases with depth.',fact:true,why:'About one more atmosphere every 10 m, because of the weight of the water above.'}
],
fluidflow:[
 {k:'narrow',s:'Water speeds up where a pipe narrows.',fact:true,why:'The same volume per second has to pass through a smaller opening.'},
 {k:'fast',s:'Faster-moving air has higher pressure.',fact:false,why:'Bernoulli’s principle: where a fluid moves faster, its pressure is lower.'},
 {k:'hose',s:'Putting your thumb over a garden hose makes the water shoot farther.',fact:true,why:'A smaller opening means faster water, so it travels farther.'}
],
waves:[
 {k:'carry',s:'A wave carries the water or rope along with it.',fact:false,why:'A wave carries energy. Each bit of rope or water moves back and forth or up and down, then returns.'},
 {k:'vfl',s:'Wave speed equals frequency × wavelength.',fact:true,why:'v = fλ. On the same string, a higher frequency means a shorter wavelength.'},
 {k:'tension',s:'Waves travel faster on a tighter string.',fact:true,why:'More tension pulls each bit back faster, so the wave moves faster.'}
],
sound:[
 {k:'space',s:'You could hear an explosion in outer space.',fact:false,why:'Sound needs a medium. In the vacuum of space there is nothing to carry it.'},
 {k:'pitch',s:'Higher-frequency sound has a higher pitch.',fact:true,why:'Pitch is how we hear frequency. Humans hear about 20 Hz to 20,000 Hz.'},
 {k:'loud',s:'Louder sounds travel faster.',fact:false,why:'Loudness is amplitude. Sound speed depends on the medium and its temperature, about 343 m/s in room-temperature air.'}
],
shotspotter:[
 {k:'time',s:'Microphones can locate a bang from the differences in when the sound reaches each one.',fact:true,why:'Sound travels at a known speed, so arrival-time differences narrow the source to one spot.'},
 {k:'one',s:'One microphone is enough to locate where a sound came from.',fact:false,why:'One mic gives only a time. You need at least three to find a position on a map.'},
 {k:'echo',s:'Buildings can throw off the location by echoing the sound.',fact:true,why:'Reflections arrive late and can be mistaken for the first sound.'}
],
refraction:[
 {k:'bend',s:'Light bends when it enters water because it slows down.',fact:true,why:'Light travels about 25% slower in water, so its path bends at the surface.'},
 {k:'straw',s:'A straw in water looks bent because the straw actually bends.',fact:false,why:'Light from the straw bends as it leaves the water, so your eye sees it in the wrong place.'},
 {k:'fiber',s:'Fiber optic cables trap light by total internal reflection.',fact:true,why:'Light hitting the glass edge at a steep angle reflects back in instead of escaping.'}
],
lenses:[
 {k:'half',s:'Covering half of a lens cuts off half the image.',fact:false,why:'Every part of the lens forms the whole image. The image just gets dimmer.'},
 {k:'conv',s:'A magnifying glass is a converging lens.',fact:true,why:'It bends light toward a focal point. Close up, it makes a larger, upright image.'},
 {k:'eye',s:'Nearsighted people need diverging lenses.',fact:true,why:'Their eyes focus light in front of the retina, so a diverging lens spreads it out a bit first.'}
],
color:[
 {k:'mix',s:'Mixing red and green light makes yellow.',fact:true,why:'Light colors add. Red + green light looks yellow; that is how screens make yellow.'},
 {k:'paint',s:'Mixing paints works the same way as mixing light.',fact:false,why:'Paints subtract: each absorbs some colors. Mixing many paints heads toward dark brown, not white.'},
 {k:'leaf',s:'A green leaf looks green because it reflects green light.',fact:true,why:'It absorbs most red and blue light for photosynthesis and reflects green.'}
],
oximeter:[
 {k:'light',s:'A pulse oximeter shines red and infrared light through your finger.',fact:true,why:'Oxygen-rich and oxygen-poor blood absorb these two colors differently, so the ratio gives your oxygen level.'},
 {k:'needle',s:'A pulse oximeter has to take a blood sample.',fact:false,why:'It works from outside, using light. No needle.'},
 {k:'skin',s:'Pulse oximeters can read too high in people with darker skin.',fact:true,why:'Melanin also absorbs light. Studies since 2020 have shown this bias, and the FDA has called for better testing.'}
],
coulomb:[
 {k:'like',s:'Two positive charges attract each other.',fact:false,why:'Like charges repel; opposite charges attract.'},
 {k:'inv',s:'Doubling the distance between two charges cuts the force to one quarter.',fact:true,why:'Coulomb’s law is an inverse-square law: F = kq₁q₂/r².'},
 {k:'balloon',s:'A rubbed balloon sticks to a wall even though the wall has no net charge.',fact:true,why:'The balloon’s charge shifts charges in the wall slightly, so the closer opposite charges attract more than the farther like charges repel.'}
],
efield:[
 {k:'lines',s:'Electric field lines point away from positive charges and toward negative charges.',fact:true,why:'They show the direction a small positive test charge would be pushed.'},
 {k:'cross',s:'Electric field lines can cross each other.',fact:false,why:'At any point the field has one direction, so lines never cross.'},
 {k:'volt',s:'Voltage is the energy per unit charge.',fact:true,why:'One volt is one joule per coulomb.'}
],
circuit:[
 {k:'used',s:'A bulb uses up current, so less current comes out than goes in.',fact:false,why:'Current is the same in and out. The bulb turns electrical energy into light and heat.'},
 {k:'parallel',s:'Houses are wired in parallel so each device gets the full voltage.',fact:true,why:'It also means one device can be off while others stay on.'},
 {k:'ohm',s:'In a simple circuit, doubling the voltage doubles the current through a resistor.',fact:true,why:'Ohm’s law: I = V/R.'}
],
capacitor:[
 {k:'battery',s:'A capacitor stores energy in the same way a battery does.',fact:false,why:'A battery stores chemical energy. A capacitor stores energy in the electric field between its plates, and can release it very fast, as in a camera flash.'},
 {k:'rc',s:'A larger resistor makes a capacitor charge more slowly.',fact:true,why:'The time constant is τ = RC.'},
 {k:'full',s:'A charging capacitor reaches about 63% of its full charge after one time constant.',fact:true,why:'Charge grows as 1 − e^(−t/RC), so at t = RC it is 1 − 1/e ≈ 63%.'}
],
magnetism:[
 {k:'pole',s:'If you cut a bar magnet in half, you get a north piece and a south piece.',fact:false,why:'Each piece becomes a full magnet with its own north and south poles.'},
 {k:'current',s:'An electric current makes a magnetic field.',fact:true,why:'That is how electromagnets, motors and speakers work.'},
 {k:'compass',s:'A compass needle’s north end points to Earth’s geographic north because Earth’s magnetic south pole is there.',fact:true,why:'Opposite poles attract, so the magnetic pole near the geographic North Pole is magnetically a south pole.'}
],
induction:[
 {k:'still',s:'A magnet sitting still inside a coil makes a steady current.',fact:false,why:'Only a changing magnetic field induces a current. Move the magnet or change the field.'},
 {k:'faster',s:'Moving a magnet faster through a coil makes a bigger voltage.',fact:true,why:'Faraday’s law: the voltage depends on how fast the magnetic flux changes.'},
 {k:'grid',s:'Most of the world’s electricity comes from spinning magnets and coils.',fact:true,why:'Generators in coal, gas, nuclear, hydro and wind plants all use induction. Solar panels are the main exception.'}
],
photoelectric:[
 {k:'bright',s:'Brighter red light can knock electrons off a metal that blue light can.',fact:false,why:'If each red photon has too little energy, brightness does not help. The photon energy, set by frequency, must pass a threshold.'},
 {k:'einstein',s:'Einstein’s Nobel Prize was for explaining the photoelectric effect.',fact:true,why:'The 1921 prize cited his explanation of the photoelectric effect, not relativity.'},
 {k:'solar',s:'Solar panels use light’s energy to free electrons.',fact:true,why:'They rely on the photovoltaic effect, a close cousin of the photoelectric effect.'}
],
relativity:[
 {k:'muon',s:'Muons made high in the atmosphere reach the ground because their clocks run slow from our point of view.',fact:true,why:'Moving close to light speed, their lifetimes stretch (time dilation), so many survive the trip.'},
 {k:'gps',s:'GPS would drift by kilometers a day without corrections from relativity.',fact:true,why:'Satellite clocks run about 38 microseconds a day fast overall. Uncorrected, positions would drift about 10 km per day.'},
 {k:'faster',s:'If you ran forward on a fast train shining a flashlight, the light would go faster than light speed.',fact:false,why:'Light’s speed is the same for every observer. Speeds don’t simply add near light speed.'}
],
rocket:[
 {k:'push',s:'A rocket needs air to push against.',fact:false,why:'It pushes exhaust backward, and the exhaust pushes the rocket forward (Newton’s third law). It works best in a vacuum.'},
 {k:'fuel',s:'Most of a rocket’s launch mass is fuel.',fact:true,why:'Often around 85 to 90%. Every kilogram lifted needs more fuel to lift it.'},
 {k:'sideways',s:'Getting to orbit is mostly about going sideways very fast, not just going up.',fact:true,why:'Low orbit needs about 7.8 km/s sideways, so the craft keeps falling around Earth instead of back to it.'}
],
chaos:[
 {k:'random',s:'A chaotic system is random.',fact:false,why:'A double pendulum follows exact laws. Tiny differences in the start grow so fast that long-term prediction becomes impossible.'},
 {k:'tiny',s:'Two double pendulums started almost the same way soon move completely differently.',fact:true,why:'That sensitivity to starting conditions is the mark of chaos.'},
 {k:'weather',s:'Chaos is a big reason weather can’t be forecast well more than about two weeks ahead.',fact:true,why:'Small measurement errors grow until the forecast no longer matches reality.'}
]
});
