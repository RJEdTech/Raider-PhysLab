/* 00-sample.js */
BioLab.addPractical({
projectile: {
  hook: 'You get one throw to clear a creek 15 m wide, and you can throw at 15 m/s (about 34 mph). What angle do you pick, and how much room for error do you have?',
  uses: [
    'Long jump: jumpers take off at about 20°, not 45°, because jumping steeper costs them running speed.',
    'Garden hose: tilt the nozzle up to reach the far end of the yard. Air drag makes the best angle a little under 45°.',
    'Basketball: a higher arc gives the ball a bigger opening at the rim, which is why shooters are coached to put air under the shot.'
  ],
  answer: 'At 15 m/s on flat ground the ball carries 23 m at 45°, and any angle from about 21° to 69° clears 15 m. You have a lot of room for error, as long as you avoid very flat or very steep throws.',
  takeaway: 'On flat ground, aim near 45° for the most distance. Angles the same distance from 45°, like 30° and 60°, land in the same place, so you always have a low option and a high option.',
  lede: 'Launch a ball like a throw or a kick. Change how fast and how steep, measure where it lands, and find the angle that goes farthest.',
  tour: [
    'Like a throw, a launch has two settings: how fast and how steep. This ball leaves the ground at 18 m/s (about 40 mph, a hard soccer kick) at 40° above level.',
    'The dots work like burst photos on a phone, one every 0.25 s. Side to side they are evenly spaced: the ball never slows down going forward. Up and down they bunch near the top, where it hangs.',
    'The arrows show where the ball is headed at each dot. The forward part never changes. Only the up-and-down part shrinks and flips, like a ball tossed straight up.',
    'At the top of a pop fly the ball is still moving toward the outfield. It stops going up, but its speed is not zero, which is why a fielder has to run under it.',
    'Read it like a tape measure. The ruler is in meters, the pill shows where the ball landed, and the stopwatch shows the hang time. Click a dot (or Probe next dot) to read the position and speed there.',
    'Same throw at angles from 20° to 70°. 45° goes farthest. 30° and 60° land in the same spot, the way a line drive and a lob can reach the same receiver.',
    'Throw a ball sideways off a 10 m roof (about three stories) while a twin is dropped. They land together. Throwing harder makes it go farther, not stay up longer.'
  ]
}
});

/* p1.js */
BioLab.addPractical({
linearize: {
  hook: 'A ball dropped from 0.4 m, about knee height, takes 0.29 s to hit the floor. From 1.6 m, about eye height, it falls four times as far. Does it take four times as long, and if not, how long does it take?',
  answer: 'No. From 1.6 m the fall takes about 0.57 s, only twice as long. The raw graph of time against height curves, but time squared against height is a straight line through zero. So four times the height means twice the time, and nine times the height means three times the time.',
  uses: [
    'Dropping a rock into a canyon: a 2 s fall means about 20 m, but a 4 s fall means about 80 m, not 40 m, if you ignore air drag.',
    'Driving: braking distance grows with the square of speed, so at 60 mph a car needs about four times the braking distance it needs at 30 mph.',
    'Pendulum clocks: a pendulum four times longer swings only twice as slowly, which is why a clock that ticks once a second needs a pendulum about 1 m long.'
  ],
  takeaway: 'If doubling one thing does not double the other, the graph will curve. Square or square-root an axis until the points make a straight line. Then you have a rule you can predict from, like four times the height, twice the fall time.',
  lede: 'Drop a ball from ten heights and graph the fall times. The graph curves, so you change an axis until the points make a straight line you can predict from.',
  tour: [
    'A ball is dropped from different heights, from about ankle height to above your head, and a timer records each fall. Height is what you choose to change. Fall time is what you measure.',
    'Ten drops, from 0.2 m to 2.0 m. Each dot on the right is one drop. Even the 2 m drop lands in about 0.64 s, too fast to time well by hand.',
    'The raw graph curves. Going from 0.8 m to 1.6 m doubles the height, but the time only grows from 0.40 s to 0.57 s. A curve makes it hard to predict a drop you have not tried.',
    'Now plot time squared against height. The points line up on a straight line through zero. Time squared grows in step with height, so the slope lets you predict any drop.'
  ]
},
motion1d: {
  hookSet: {mode:'race',vA:1.5,vB:0.5,gap:4},
  hook: 'A friend has a 4 m head start and strolls at 0.5 m/s. You walk faster, at 1.5 m/s. How many seconds until you catch up, and how far will you have walked by then?',
  answer: 'You catch up after 4 s, side by side at 6 m from your start. You gain 1 m on your friend every second, the difference in your speeds, so the 4 m head start takes 4 s to close. Run it as the billiard race: the two position lines cross at t = 4 s, x = 6 m.',
  uses: [
    'Passing a truck on the highway: at 70 mph against its 65 mph you gain only 5 mph, about 2.2 m/s, so gaining 30 m on it takes about 13 s.',
    'Cross-country race: running 0.5 m/s faster than the runner 20 m ahead, you catch them in 40 s. Only the difference in speed closes the gap.',
    'GPS run tracker: a flat line on the pace graph means a steady speed. A line that slopes up or down means you sped up or slowed down.'
  ],
  takeaway: 'To catch someone, only the difference in speed matters: catch-up time = head start ÷ (your speed − their speed). On a position-time graph, the moment you meet is where the two lines cross.',
  tour: [
    'A cart on a 20 m track, most of the length of a basketball court. The ruler is marked every meter, and position x is how far the cart is from the left end. It starts at 2 m, rolling at 1.5 m/s, a normal walking pace.',
    'Every half second the cart leaves a dot, like burst photos on a phone. Equal gaps between the dots mean the cart is moving at a steady speed.',
    'This graph shows where the cart is at each moment. A steady speed makes a straight line that slopes up. A faster cart would make a steeper line.',
    'This graph shows velocity, the speed and direction. The cart holds 1.5 m/s the whole time, like a car on cruise control, so the line is flat.',
    'Acceleration is how fast the velocity changes. The cart is not speeding up or slowing down, so this line sits at zero.',
    'Now the cart starts from rest and gains 0.5 m/s every second, like a car pulling away gently. The dots spread apart, the position line curves upward and the velocity line slopes up.',
    'Two billiard balls roll in separate lanes. Ball A is faster but starts 4 m behind. Where the two position lines cross, the balls are side by side: that is when A catches B.',
    'Your turn. Drag the walking slider to walk toward or away from a motion detector, and try to make your position graph trace the dashed target.'
  ]
},
freefall: {
  hookSet: {air:true},
  hook: 'You drop a 7 kg bowling ball and a 60 g tennis ball together from a 10 m balcony, about three stories up, in ordinary air. Does the heavy ball land first, and by how much?',
  answer: 'Yes, but barely. The bowling ball lands at 1.43 s and the tennis ball at about 1.47 s, roughly half a meter behind. With the air turned off, both land at 1.43 s. Mass is not what slows things down: a feather from the same 10 m takes about 17 s.',
  uses: [
    'Cliff jumping or platform diving: from 10 m you hit the water in about 1.4 s at about 14 m/s (31 mph), whatever you weigh.',
    'Skydiving: belly down, a skydiver stops speeding up at about 55 m/s (120 mph), because the air pushes up as hard as gravity pulls down.',
    'Apollo 15 on the Moon, 1971: astronaut David Scott dropped a hammer and a falcon feather together. With no air, they landed at the same time.'
  ],
  takeaway: 'Without air, everything falls at the same rate, whatever its mass. Air slows light, spread-out things like feathers and paper the most. For a heavy, compact object over a short drop, you can ignore the air.',
  tour: [
    'Two objects wait on a ledge 10 m up, about the top of a three-story building. The ruler on the tower shows height above the ground.',
    'A 7 kg bowling ball and a 60 g tennis ball let go at the same moment, with the air switched off. The bowling ball is over 100 times heavier. Watch which lands first.',
    'The faint circles are like burst photos, one every 0.1 s. The gaps grow as the balls fall, because each one gains 9.8 m/s of speed every second.',
    'The stopwatch stops for each object when it hits the ground. Both landed together, at 1.43 s. Over 100 times the mass made no difference.',
    'Now the air is on and the drop is 3 m: a tennis ball against a feather. The feather drifts down at about 0.6 m/s while the ball barely notices the air. Air resistance, not mass, makes the difference.',
    'On the Moon there is no air to slow the feather, so it falls with the bowling ball and they land together. Apollo 15 astronaut David Scott did this with a hammer and a feather in 1971.'
  ]
},
vectors2d: {
  hook: 'Your boat goes 3 m/s (about 7 mph) in still water. You point it straight across a 40 m river flowing at 1.5 m/s. How far downstream do you land, and which way should you point to land straight across?',
  answer: 'Pointing straight across, you cross in 13.3 s, the same as in still water, and the current carries you 20 m downstream. To land straight across, aim 30° upstream. Half your speed then cancels the current, and the crossing takes longer, about 15.4 s.',
  uses: [
    'Landing at Denver International in a crosswind: pilots point the nose partly into the wind, called crabbing, so the plane tracks straight down the runway.',
    'Rip current at the beach: swim parallel to shore, across the current. The current carries you sideways but cannot stop you from crossing it.',
    'City blocks: walk 3 blocks east and 4 blocks north and you end up 5 blocks from the start in a straight line, not 7. That is why diagonal shortcuts save time.'
  ],
  takeaway: 'If you point straight across, a current changes where you land, not how long the crossing takes. To land straight across, point partly upstream, and expect the trip to take a bit longer.',
  lede: 'Cross a river, fly through a crosswind and add arrows tip to tail. Find out where you really end up when a current or wind pushes you sideways.',
  tour: [
    'The boat points straight across at 3 m/s, about 7 mph, while the river flows at 1.5 m/s. The red dots, one per second, show where it really goes: diagonally downstream.',
    'Blue is the boat’s own push through the water. Teal is the current, drawn starting at the tip of the blue arrow. Red joins the start to the end: that is how the boat actually moves past the shore.',
    'The ruler along the near bank is in meters. When the boat lands, the label shows the crossing time and how far downstream it drifted. Here the current carries it about half the river’s width.',
    'Now the boat is faster (4 m/s), the current is 2 m/s, and the boat points 30° upstream. Part of its push cancels the current, so it lands right at the flag. The cost is a slower crossing.',
    'Same idea in the air. A 30 m/s wind blows east, so the pilot points the nose 30° west of north and the plane tracks straight to the city. Pilots call this crabbing: the nose and the path point different ways.',
    '3 m east plus 4 m north, like walking 3 blocks and then 4. Slide B to A’s tip and the resultant, the straight-line distance from the start, is 5 m, not 7 m.',
    'The puck glides at a steady velocity, so the strobe images, one every 0.1 s, are evenly spaced. Take the first and last images: distance across ÷ time gives v<sub>x</sub>, and distance up ÷ time gives v<sub>y</sub>.'
  ]
},
forces: {
  hook: 'A 50 kg moving box full of books sits on a wood floor. How hard do you have to push to get it moving, and how hard to keep it sliding once it goes?',
  answer: 'You need more than 196 N to break it loose, about the force to hold up a 20 kg weight. Once it slides, 147 N keeps it going at a steady speed. Push harder than 147 N and it speeds up; push less and it slows to a stop.',
  uses: [
    'Moving a couch: the first shove is the hardest. Once it slides you can ease off and it keeps moving, because sliding friction is smaller than starting friction.',
    'Cruise control on the highway: the engine pushes just hard enough to match air drag and friction. Net force zero means the speed stays constant.',
    'Shopping cart: the same push speeds up an empty cart faster than a full one, because acceleration is force ÷ mass. Twice the mass, half the acceleration.'
  ],
  takeaway: 'Things do not need a force to keep moving, only to change speed. If the forces balance, an object stays still or keeps a steady speed. The net force decides whether it speeds up or slows down.',
  tour: [
    'Each arrow in the box at the right is a force on the 50 kg crate, about a moving box full of books: your push, friction, gravity and the floor pushing up. Longer arrows mean bigger forces.',
    'Push with 100 N, about the force to hold up a 10 kg bag. The crate does not budge. Static friction, the grip that holds things still, grows to match your push exactly, so the forces balance.',
    'At 250 N your push beats the most static friction can give, 196 N. The crate breaks loose and slides, and friction drops to the sliding (kinetic) value, 147 N. That is why the first shove is the hardest.',
    'Now the push is turned down to exactly 147 N, equal to sliding friction. Net force zero, so the crate keeps sliding at a steady speed. Balanced forces do not mean stopped.',
    'Let go, and friction is the only sideways force left. It slows the crate to a stop. On a frictionless floor it would keep sliding.',
    'Two teams pull in opposite directions. Only the difference matters: 300 N right minus 200 N left acts like a single 100 N pull to the right.',
    'Each fan pushes 0.40 N, a gentle breeze. The strobe images spread out as the cart speeds up, and the photogate measures its acceleration. Compare it with force ÷ mass: 0.80 N ÷ 0.50 kg = 1.6 m/s².'
  ]
},
friction: {
  hook: 'You pull a 0.50 kg wooden block, about the weight of a water bottle, across a wooden table with a spring scale. Then you stack 1.0 kg on top and pull again. What does the scale read while it slides each time?',
  answer: 'Alone, the block slides with a pull of about 1.5 N. With 1.0 kg on top it presses down three times as hard, so the pull triples to about 4.4 N. Both times, getting it started takes more: a peak near 2.2 N alone and 6.6 N stacked.',
  uses: [
    'Moving a dresser: take the drawers out first. Less weight pressing on the floor means less friction, in proportion.',
    'Anti-lock brakes: they stop the tires from skidding, because tires that still grip the road (static friction) stop a car better than tires that slide.',
    'Icy sidewalks in a Denver winter: ice grips about one-sixth as hard as wood does in this lab, so short, flat-footed steps that need little sideways push keep you upright.'
  ],
  takeaway: 'Friction grows with how hard two surfaces press together: twice the weight, about twice the friction. Getting something started takes more force than keeping it sliding, and the surfaces themselves set how grippy it is.',
  tour: [
    'A 0.50 kg wooden block, about the weight of a water bottle, sits on the table. A string connects it to a spring scale, like a luggage scale, which shows how hard the hand pulls in newtons.',
    'The pull grows, yet the block stays put. Static friction, the grip that holds things still, pushes back exactly as hard as the hand pulls, up to a limit.',
    'At the peak, static friction cannot grow any more and the block lurches forward. Look at the force graph below: a spike, the breakaway pull, about 2.2 N here.',
    'Pulled at a steady speed, the forces balance, so the scale reads the sliding (kinetic) friction, about 1.5 N. It is lower than the peak, which is why the first tug is the hardest.',
    'Even smooth-looking surfaces are bumpy under a microscope. The bumps catch on each other. Pressing harder, with more mass, squeezes them together so they catch harder.',
    '1.0 kg is added on top, like two more water bottles. The block now presses down three times as hard, and the friction triples too, to about 4.4 N.',
    'Sandpaper’s big bumps grip more than twice as hard as wood. Try ice for the opposite.'
  ]
},
incline: {
  hook: 'You set a 5 kg box on a wooden loading ramp. How steep can you tilt the ramp before the box slides on its own, and would a heavier 18 kg box start sliding at a lower angle?',
  answer: 'On wood the box holds up to 24° and starts to slide at 25°. The 18 kg box slips at exactly the same angle. More weight means a bigger pull down the ramp, but it also presses into the ramp harder, so friction grows by the same factor.',
  uses: [
    'Avalanches in the Colorado backcountry: most slab avalanches release on slopes of 30° to 45°, steep enough that the downhill pull beats the snow’s grip.',
    'Wheelchair ramps: the ADA limit is a 1:12 slope, under 5°, so the pull down the ramp is less than a tenth of the rider’s weight.',
    'Mountain highways: a 6% grade is only 3.4°, but it still pulls a loaded 36,000 kg semi downhill with about 21,000 N. That is why runaway truck ramps exist.'
  ],
  takeaway: 'On a slope, part of your weight pulls you downhill, and the steeper the slope, the bigger that part. Whether something slides depends on the angle and the surfaces, not the weight: a heavy box and a light box slip at the same angle.',
  lede: 'Tilt a ramp like a loading ramp or a ski slope. Find the angle where a block starts to slide, and see what speeds it up and what does not.',
  tour: [
    'A 5 kg block, about a bag of flour, sits on a wooden ramp tilted 20°. The ramp is 3.7 m long, about the length of a small car. A ruler runs along it and a stopwatch times each slide.',
    'Gravity pulls the block straight down. On a slope, part of that pull points down the ramp and part presses into the ramp. The dashed arrows show the two parts. A steeper ramp makes the downhill part bigger.',
    'At 20°, friction can hold the block. The pull down the ramp is smaller than the most grip the wood can give, the way a book stays put on a gently tilted desk.',
    'At 32° the pull down the slope wins. The block slides, and sliding friction slows it a little.',
    'With no friction the block speeds up faster. The strobe images, one every 0.2 s, spread out more and more as it gains speed.',
    'The block is now 18 kg instead of 5 kg. It feels more gravity, but it is also harder to speed up. The two effects cancel, so its acceleration is the same. Compare the stopwatch times.'
  ]
},
atwood: {
  hook: 'Elevators hang the car against a counterweight. Try it small: two 1.0 kg masses balance over a pulley, then one side becomes 1.2 kg. How fast does the heavier side speed up compared with a ball you just drop?',
  answer: 'The pair speeds up at 0.89 m/s², about one-eleventh of the 9.8 m/s² of a dropped ball. Only the extra 0.2 kg pulls, but all 2.2 kg has to speed up. The heavy side takes about 1.06 s to fall 0.50 m, where a dropped ball takes 0.32 s.',
  uses: [
    'Elevators: the counterweight weighs about as much as the car plus part of a load, so the motor only has to supply the small difference.',
    'Towing a trailer: the same engine force has to speed up car and trailer together, so pulling a trailer as heavy as the car roughly halves the acceleration.',
    'Pushing a row of shopping carts: they all speed up together, and each coupling carries only the force the carts ahead of it need.'
  ],
  takeaway: 'Objects tied or pushed together share one acceleration: net force ÷ total mass. A small difference in force spread over a big total mass gives a gentle, controllable motion. That is how counterweights work.',
  tour: [
    'Two 1.0 kg masses hang from one string over a pulley, balanced. When one goes down, the other goes up by the same amount, so they always share the same speed. An elevator and its counterweight work this way.',
    'm₂ is now 1.2 kg. Only the extra 0.2 kg pulls, but all 2.2 kg must speed up. So m₂ gains speed only about one-eleventh as fast as a dropped ball.',
    'Each mass has two forces: the string pulling up and gravity pulling down. On the heavier m₂ gravity wins, so it speeds up downward. On m₁ the string wins, so it speeds up upward.',
    'The timer starts at release and stops after 0.50 m. From rest, a = 2d ÷ t², so a slow time means a small acceleration. Compare the timer with the predicted value.',
    'Now the string runs over the edge of a table. The hanging 1.0 kg pulls, friction on the table block pulls back, and only the difference speeds things up.',
    'With a heavy 3.0 kg block and μ = 0.40, friction can hold up to 11.8 N. The hanging weight only pulls with 9.8 N, so nothing moves, the way a heavy box stays put when you tug lightly.',
    'Push the back block with 6 N. Both blocks share one acceleration, 2 m/s², so the 2.0 kg front block gets only the 4 N it needs. The rest of your push speeds up the back block.'
  ]
},
circular: {
  hookSet: {mode:'curve',cv:15,cr:50,mu:0.7},
  hook: 'You drive a curve with a 50 m radius at 15 m/s (about 34 mph). Your tires grip with μ = 0.7 on a dry road but only 0.2 on packed snow. Do you make the curve on snow, and what is the top safe speed on each?',
  answer: 'On dry road you use about two-thirds of your grip, and the top speed is 18.5 m/s (41 mph). On snow the top speed drops to 9.9 m/s (22 mph), so at 34 mph the car skids off in a nearly straight line. Snow cuts grip to under a third and the safe speed to about half.',
  uses: [
    'Snowy off-ramps: with grip falling from about 0.7 to 0.2, the top safe speed on the same curve drops to about half, because safe speed grows with the square root of grip.',
    'Swinging a bucket of water overhead: at arm’s length, about 1 m, it needs at least 3.1 m/s at the top or the water falls out.',
    'Salad spinner or washer spin cycle: the basket pushes the lettuce or clothes inward, but water drops have nothing holding them, so they fly straight out through the holes.'
  ],
  takeaway: 'Turning takes a force toward the center of the curve. Double your speed and you need four times the grip. When the grip runs out you do not fly outward; you go straight, off the curve.',
  tour: [
    'Seen from above, a puck glides on an air table, tied to a pin, like a ball whirled on a string. The blue arrow is its velocity. It always points along the circle, never toward the center.',
    'The speed never changes, but the direction does, so the puck is accelerating. The red arrow shows that acceleration, always toward the center. The string has to keep pulling inward to make it turn.',
    'Cut the string and the puck goes straight, along the line it was already heading. It does not spiral or fly outward from the center, the same way mud flies off a spinning bike tire in straight lines.',
    'A car on a flat curve at 15 m/s, about 34 mph, on a dry road. Grip between the tires and road, static friction, supplies the pull toward the center. The gauge shows how much of that grip is used.',
    'Now the road is slick, like packed snow (μ = 0.2). The same speed needs more grip than the tires have, so the car skids off in a nearly straight line. On this curve, the safe speed on snow is about 22 mph.',
    'Loop-the-loop. The track pushes the cart toward the center. At the top the rider feels lightest, because gravity is already pulling toward the center and the track has to push less.',
    'The rotor ride spins at 30 rpm, half a turn every second. The wall pushes riders toward the center, and that push lets friction hold them up when the floor drops away.'
  ]
},
gravity: {
  hookSet: {mode:'cannon',v0:0,h:400},
  hook: 'The International Space Station flies about 400 km up. If you could fire a ball sideways from a tower that tall, how fast would it have to go to never come down, and how fast to leave Earth for good?',
  answer: 'About 7.7 km/s, roughly 17,000 mph. Slower and the ball curves back to the ground; at 7.7 km/s the ground curves away as fast as the ball falls, so it circles Earth in about an hour and a half. Above 10.85 km/s it escapes and never returns.',
  uses: [
    'The space station: at about 7.7 km/s it goes around Earth about 16 times a day, so the crew sees about 16 sunrises every 24 hours.',
    'Floating astronauts: gravity 400 km up is still almost 90% as strong as on the ground. Astronauts float because they and the station are falling together.',
    'GPS satellites: they orbit about 20,200 km up, where gravity is much weaker, so they move slower, about 3.9 km/s, and take about 12 hours per orbit.'
  ],
  takeaway: 'An orbit is falling sideways fast enough that the ground curves away beneath you, about 7.7 km/s near Earth. Gravity does not switch off in space. It weakens with distance, to a quarter at twice the distance from Earth’s center.',
  tour: [
    'Isaac Newton imagined a cannon on a mountain so tall it sticks out of the air. This tower is 400 km tall, as high as the space station flies. With no launch speed, the ball just falls straight down.',
    'At 3 km/s, about ten times as fast as a fast jet, the ball curves and hits the ground a short distance away. Gravity bends its path toward Earth’s center the whole time.',
    'At 6.5 km/s it lands much farther away. The ball is falling the whole time, but the round Earth curves away beneath it.',
    'At 7.7 km/s, about 17,000 mph, the ground curves away exactly as fast as the ball falls. It keeps falling and never lands. That is an orbit, and it is how the space station stays up.',
    'At 9.5 km/s the ball swings far out, slows down at the top, then speeds back in. The path is a stretched circle, an ellipse, and it still comes back around.',
    'At 11 km/s, above the 10.85 km/s escape speed at this height, gravity slows the ball but can never turn it around. It leaves for good, the way probes sent to Mars leave Earth.',
    'Switch to the inverse-square law: gravity weakens with distance from Earth’s center. At 2 Earth radii the pull is 1/4 as strong; at 3 radii it is 1/9. It gets weaker but never reaches zero.'
  ]
},
skatepark: {
  hook: 'A 60 kg skater drops in from 5 m up a smooth half-pipe. How fast is she going at the bottom, and would a 120 kg skater dropping from the same height go any faster?',
  answer: 'She reaches about 9.9 m/s, roughly 22 mph, at the bottom. The 120 kg skater reaches the same 9.9 m/s. Twice the mass gives twice the potential energy at the top, but twice the mass also needs twice the energy to reach each speed, so height alone sets the speed.',
  uses: [
    'Roller coasters: the first hill is the tallest, because no later hill can be higher than the energy the cars start with, minus what friction takes.',
    'Skiing: your speed after a drop depends on how far you fall, not your weight. A 20 m drop with no friction would give about 20 m/s (44 mph).',
    'Brakes on a mountain pass: stopping turns a car’s kinetic energy into heat, which is why brakes get hot coming down a long grade like Loveland Pass.'
  ],
  takeaway: 'Height buys speed. With no friction, your speed at the bottom depends only on how far you dropped, not on your mass. Friction does not destroy energy; it turns some into heat, so each climb ends a little lower.',
  tour: [
    'The skater starts at rest 5 m up the half-pipe. Each grid square is 1 meter, so you can read her height straight off the grid.',
    'At the top she is not moving, so all her energy is potential energy (blue bar): energy stored by her height, like a ball held over your head, ready to fall.',
    'Watch the bars in slow motion. As she drops, the blue potential bar shrinks and the green kinetic energy bar, the energy of motion, grows by exactly the same amount.',
    'At the lowest point almost all her energy is kinetic, so the speedometer peaks here, near 9.9 m/s, about 22 mph.',
    'Climbing up, kinetic energy turns back into potential energy. With no friction she rises to the same height she started from, and no higher.',
    'Now the track has friction. The red thermal energy bar, heat in the wheels and track, grows, so she rises a little less each time. The total bar never changes: the energy is not lost, it changes form.'
  ]
},
power: {
  hook: 'You weigh 60 kg and climb one floor of stairs, 3.6 m up. Walking takes 8 s and sprinting takes 3 s. Does sprinting take more work, and how much power do you put out each way?',
  answer: 'Both take the same work, 2,117 J, because you lift the same weight the same height. Power is different: about 265 W walking and 706 W sprinting, almost one horsepower (746 W). Your muscles burn 4 to 5 times more food energy than this, because they are only 20 to 25% efficient.',
  uses: [
    'Food Calories: one flight takes about half a food Calorie of work, but at 20 to 25% efficiency your body burns about 2 to 2.5 Calories climbing it.',
    'Light bulbs: a 100 W bulb uses 100 J every second. Sprinting up the stairs at 706 W could run seven of them for those 3 s.',
    'Pulling a sled or wagon: a level rope puts all your pull into moving it forward. With the rope at 50°, only about 64% of the pull does work.'
  ],
  takeaway: 'Work is the energy you transfer, which for stairs is weight × height. Power is how fast you transfer it, in watts, joules per second. The same climb done in half the time takes the same work and twice the power.',
  tour: [
    'You climb one floor: 20 steps of 18 cm, 3.6 m in all, like the stairs between floors at school. To climb, you have to lift your whole weight that height, and that takes work.',
    'Walking up in 8 s. A 60 kg person weighs 588 N. Lifted 3.6 m, that is W = 588 × 3.6 = 2,117 J of work, the same whether you walk or run.',
    'Now sprint up in 3 s. Same work, 2,117 J, but done 2.7 times faster. Power = work ÷ time = 706 W, enough to run seven 100 W bulbs and almost one horsepower.',
    'Work = force × distance moved along the force. Pull a sled with 80 N along the floor for 5 m and you do 400 J of work on it.',
    'Tilt the rope to 50°, like pulling a wagon by a raised handle. Only the part of the pull along the floor, F cos θ, does work. The upward part just lightens the sled.',
    'On packed snow (μ = 0.20) friction pushes backward. Its bar in the work tally goes below zero: friction takes energy away from the sled as heat.'
  ]
},
collisions: {
  hook: 'A cue ball hits a resting pool ball of the same mass head-on. Try it with two 1 kg carts: A rolls at 0.80 m/s into B at rest. What does each cart do if they bounce, and if Velcro makes them stick?',
  answer: 'Bouncy: A stops dead and B rolls off at 0.80 m/s, like a pool stop shot. Sticky: they move off together at 0.40 m/s. Total momentum is 0.80 kg·m/s before and after both times, but the sticky crash turns half the kinetic energy into heat and sound.',
  uses: [
    'Pool: hit an object ball dead center with no spin and the cue ball stops, handing over all its speed. Players call it a stop shot.',
    'Car crashes: if a 2,000 kg SUV rear-ends a stopped 1,000 kg car and they lock together, the pair moves off at two-thirds of the SUV’s speed.',
    'Jumping off a skateboard: you go forward and the board shoots backward. Total momentum starts at zero and stays zero, so the lighter board moves faster than you.'
  ],
  takeaway: 'In any collision or push-apart, the total momentum (mass × velocity) stays the same, because the two objects push on each other equally hard for the same time. Kinetic energy is kept only in bouncy collisions; sticky ones lose some to heat and sound.',
  tour: [
    'Cart A (red) rolls toward cart B (blue), which is at rest. The track has almost no friction, like an air hockey table, so nothing outside the carts speeds them up or slows them down.',
    'Each arrow shows a cart’s velocity: its length is the speed and it points the way the cart moves. A moves at 0.80 m/s, a slow stroll; B is at rest.',
    'Every 0.1 s each cart leaves a dot, like burst photos. Evenly spaced dots mean a steady speed; wider spacing means faster.',
    'Watch the instant they touch. The carts push on each other with equal and opposite forces for the same short time. A stops dead and B moves off at A’s old speed, like a pool stop shot.',
    'Momentum is mass × velocity, a measure of how hard something is to stop. Compare the total bars: before and after are the same height. Momentum moved from A to B, but none was created or lost.',
    'In this bouncy (elastic) collision, the kinetic energy, the energy of motion, is the same after as before. A crash where things crumple or stick loses some of it to heat and sound.'
  ]
},
impulse: {
  hook: 'A 60 g egg falls 1 m, about counter height. On concrete it stops in 2 ms; on a foam pad it takes 30 ms. Both stops remove the same momentum. How big is the force each time, and which egg survives?',
  answer: 'Both stops remove 0.27 kg·m/s of momentum. Concrete does it in 2 ms with a peak force near 210 N, so the egg cracks. Foam takes 15 times longer, so the peak force is about 14 N, under the 30 N a shell can take, and the egg survives.',
  uses: [
    'Landing a jump: bending your knees makes the stop take longer, so the ground pushes on your legs with a smaller force for the same change in momentum.',
    'Airbags and crumple zones: in this lab they stretch a 50 km/h crash stop to about 0.2 s, so the force on the dummy is far smaller than a sudden stop.',
    'Catching a water balloon: let your hands move back with it as you catch. A longer stop means a smaller force, so the balloon is less likely to burst.'
  ],
  takeaway: 'Stopping a moving thing takes the same impulse however you do it. Make the stop last longer and the peak force drops in proportion: ten times longer, one-tenth the force. Bend, give, crumple or cushion.',
  tour: [
    'A 60 g egg, a large egg, falls 1 m, about counter height, toward concrete. Its momentum (mass × velocity) grows to 0.27 kg·m/s just before it lands. The graph on the right will record the force on the egg.',
    'Concrete stops the egg in about 2 ms, two thousandths of a second. To remove all that momentum so fast, the floor pushes with over 200 N, about the weight of a 20 kg bag, and the egg cracks.',
    'The shaded area under the force-time curve is the impulse: force × time, added up. It always equals the egg’s change in momentum, here 0.27 N·s.',
    'Same egg, same height, so the same momentum must be removed. Foam stretches the stop to 30 ms, 15 times longer, like moving your hands back as you catch.',
    null,
    'A car at 50 km/h (31 mph) hits a wall. A crumple zone and an airbag stretch the dummy’s stop to about 0.2 s, a fifth of a second, so its momentum goes to zero with a much smaller force.'
  ]
},
torque: {
  hookSet: {mode:'wrench',F:120,r:0.2,ang:90},
  hook: 'A rusted bolt needs 40 N·m of torque to break loose. You push the wrench with 120 N, about the weight of a 12 kg bag, but at 20 cm from the bolt it will not budge. How far out on the handle must you push?',
  answer: 'At 20 cm, 120 N makes only 24 N·m. Torque is force × distance, so you need at least 40 ÷ 120 = 0.33 m. At 30 cm you get 36 N·m and the bolt still holds; at 35 cm you get 42 N·m and it turns. Pushing at a slant would need even more distance.',
  uses: [
    'Doors: the handle sits on the side far from the hinges. Push near the hinge and it takes several times the force to swing the same door.',
    'Seesaw: a 60 kg parent balances a 30 kg child by sitting half as far from the pivot, 1 m against 2 m.',
    'Changing a tire: if a lug nut will not budge, slide a pipe over the wrench handle. Doubling the handle length doubles the torque from the same push.'
  ],
  takeaway: 'Turning effect, called torque, is force × distance from the pivot, counting only the push at a right angle to the lever. To turn something stubborn, push farther out and push straight across the handle, not along it.',
  tour: [
    'The 4 m plank balances on a pivot in the middle, like a playground seesaw. A mass on either side tries to turn it: the left side counterclockwise, the right side clockwise.',
    'Use the ruler on the plank. Equal masses at equal distances balance. Slide one mass outward and that side wins, even though neither mass changed. Distance from the pivot matters as much as weight.',
    'A 60 kg adult 1 m from the pivot balances a 30 kg child 2 m away. Twice the mass at half the distance gives the same turning effect, which is how a parent and a child can share a seesaw.',
    'Torque also explains wrenches. The bolt only turns when your push makes enough torque. Here 100 N at 30 cm makes 30 N·m, not enough for this 40 N·m bolt. Push farther from the bolt to get more torque from the same force.',
    'Push at a slant, here 35° to the handle, and less of your push goes into turning. Push straight along the handle and nothing happens at all, however hard you push.',
    'Push right at the bolt (distance 0) and no amount of force will turn it. Doors have handles far from the hinges for the same reason: try pushing a door open right next to its hinges.'
  ]
},
rotation: {
  hook: 'A solid ball, a solid disk and a thin hoop, all with the same mass and radius, roll down the same 1.5 m tall ramp. Which reaches the bottom first, and how much faster is the winner moving than the loser?',
  answer: 'The ball wins at 4.6 m/s, the disk comes second at 4.4 m/s, and the hoop comes last at 3.8 m/s. The hoop spends half its energy on spinning; the ball spends only 29%. A block sliding with no friction would beat all three at 5.4 m/s.',
  uses: [
    'Figure skating: pulling your arms in speeds up a spin. In this lab, bringing the hands in from 0.8 m to 0.25 m makes the skater spin about 3.5 times faster.',
    'Diving and gymnastics: tucking into a ball makes you flip faster. Opening out slows the spin before you hit the water or the mat.',
    'Bike wheels: racers pay for light rims, because mass at the rim is the hardest to get spinning, so a lighter rim speeds up faster.'
  ],
  takeaway: 'Mass far from the spin axis is harder to get spinning and harder to stop. That is why hoops roll slower than balls, and why pulling your arms or legs in makes you spin faster while stretching out slows you down.',
  tour: [
    'Three objects with the same mass and radius roll down identical lanes. They differ only in where their mass sits: all at the rim like a bike wheel (hoop), spread evenly like a hockey puck (disk), or packed toward the center (ball).',
    'Each racer gets the same energy from dropping the same height. Watch the spokes: a rolling object also has to spin, and spinning uses up part of that energy.',
    'The ball wins and the hoop comes last. Mass far from the center is harder to spin up, so the hoop has less energy left for moving forward. It spends half on spinning; the ball spends less than a third.',
    'Now a skater on a frictionless spinning stool holds weights out at arm’s length, like a figure skater starting a spin. The top-down view on the right traces the path of her hands.',
    'Her hands come in toward the axis and she spins about 3.5 times faster, with no push from outside. Mass close to the axis is easier to spin, so her spin speeds up to keep her angular momentum, her total amount of spin, the same.'
  ]
},
pendulum: {
  hook: 'A pendulum clock runs slow. Its pendulum is about 1 m long and takes about 2 s per full swing. Which fix speeds it up: a heavier bob, a wider swing, or a shorter pendulum?',
  answer: 'Only a shorter pendulum. A 1,000 g bob still takes 2.0 s. A wider swing makes it slightly slower: about 2.04 s from 30° instead of 2.02 s from 15°. Shortening works, but gently: cutting the length to a quarter, 0.25 m, halves the swing time to about 1.0 s.',
  uses: [
    'Pendulum clocks: the bob has an adjusting nut. Raising the bob shortens the pendulum and speeds the clock up; the bob’s mass has nothing to do with it.',
    'Playground swings: a heavy adult and a small child on the same swing go back and forth at nearly the same rate. Longer chains swing more slowly.',
    'On the Moon, where gravity is about one-sixth of Earth’s, the same pendulum takes about 2.5 times as long per swing, so an Earth pendulum clock would run slow there.'
  ],
  takeaway: 'A pendulum’s swing time depends on its length and on gravity, not on its mass, and only slightly on how wide it swings. Four times the length doubles the time. To adjust a pendulum clock, change the length.',
  tour: [
    'A bob hangs on a 1 m string from the pivot, like a small playground swing. The protractor measures its angle from straight down; the meter stick on the left shows the string’s length.',
    'Pulled to the side and let go, the bob is pulled back toward the bottom by gravity. In slow motion, you can see it speed up on the way down, like a swing.',
    'The bob is fastest at the bottom, where it breaks the photogate’s light beam, like the sensor at a race finish line. The gate times one full swing: out and back to the same place.',
    'A trick from real labs: time 10 swings with a stopwatch and divide by 10. Your reaction-time error, about 0.2 s, gets shared over 10 swings, so it shrinks tenfold. The stopwatch starts when the bob crosses the gate.',
    'Potential energy (blue), stored by height, peaks at the ends. Kinetic energy (green), the energy of motion, peaks at the bottom. With no air resistance the total stays the same, so it keeps swinging.',
    'Now the string is 4 times shorter, 0.25 m. The swing time is cut in half, to about 1 s. T = 2π√(L/g): swing time depends on length and gravity, not on the mass of the bob.'
  ]
}
});

/* p2.js */
BioLab.addPractical({
springs: {
  hook: 'A hanging produce scale at the grocery store is just a spring. If a 100 g lemon stretches a 30 N/m spring 3.3 cm, are the marks for 200 g, 300 g and 400 g evenly spaced, and how far down is the 400 g mark?',
  hookSet: { mass: 100, k: 30, planet: 'earth' },
  answer: 'Yes, evenly spaced. At rest the spring stretches 3.3 cm for 100 g, 6.5 cm for 200 g, 9.8 cm for 300 g and 13.1 cm for 400 g: every extra 100 g adds the same 3.3 cm. On the Moon 100 g stretches it only 0.5 cm, because a spring scale measures weight.',
  uses: [
    'Car suspension: a car full of passengers sits lower and bounces more slowly over bumps, because more mass on the same springs means a longer bounce.',
    'Luggage scale: a handheld scale reads your suitcase by how far its spring stretches, so you can check it against a 50 lb airline limit at home.',
    'Mountain bike fork: heavier riders set the suspension stiffer, so the fork does not sink too far and bottom out on rocky Colorado trails.'
  ],
  takeaway: 'A spring stretches in proportion to the load: twice the weight, twice the stretch. Bounce time depends only on mass and stiffness: a heavier load or a softer spring bounces slower, and four times the mass doubles the bounce time.',
  lede: 'Hang a mass on a spring, like a bag on a produce scale. Change the mass and the stiffness, and find out what sets how far it stretches and how fast it bounces.',
  tour: [
    'The mass hangs still. The spring has stretched until its upward pull exactly matches the mass’s weight, the way a produce scale settles on a reading. Read the stretch on the ruler.',
    'Pull the mass below where it rests and let go. The spring is now stretched extra, so it pulls up harder than gravity pulls down, like pushing down on a car’s bumper and letting go.',
    'The mass speeds up toward the rest spot, shoots past it, slows, stops and comes back. This repeating back-and-forth is an oscillation, the same motion as a car bouncing after a bump.',
    'A pen on the mass draws its height on paper that keeps moving, like a heart monitor trace. The smooth wave it draws is a sine curve, the shape every simple spring bounce makes.',
    'Watch the bars. Motion (kinetic) energy is biggest as the mass zips through the rest spot. Spring energy is biggest at the bottom, where the spring is stretched most. With no damping (no air or friction losses) the total never changes.',
    'Now the mass is 400 g. A heavier load stretches the spring farther and bounces more slowly, the way a loaded car rides lower. Four times the mass would double the bounce time.'
  ]
},
buoyancy: {
  hook: 'A rock you lift under water at the lake feels lighter. Hang a 10 cm aluminum block (2.7 kg) from a spring scale. How much lighter does it read fully under water, and does lowering it deeper make it lighter still?',
  answer: 'In air the scale reads 26.5 N. Fully under fresh water it reads 16.7 N, about 37% lighter, because the water pushes up with 9.8 N, the weight of the 1 L of water the block shoves aside. Lowering it deeper changes nothing: the buoyant force stays 9.8 N at any depth.',
  uses: [
    'Swimming pool: lifting a friend in the pool is easy because a human body is nearly as dense as water, so the water carries almost all of their weight.',
    'Ice in a drink: ice is 917 kg/m³ and water is 1,000 kg/m³, so about 92% of an ice cube, or an iceberg, sits below the surface.',
    'Cargo ships: a steel hull floats by pushing aside lots of water. Add cargo and the ship sinks deeper until the extra water pushed aside weighs as much as the cargo.'
  ],
  takeaway: 'Under water, anything feels lighter by the weight of the water it pushes aside: about 1 kg for every liter of its volume. If it weighs less than that water, it floats.',
  lede: 'Lower a block on a spring scale into a full can of water and watch it seem to get lighter. Find out how much lighter, where the spilled water goes, and why some things float.',
  tour: [
    'An aluminum block, a 10 cm cube about the size of a large juice box, hangs above a can filled right to its spout. The scale reads its full weight, 26.5 N (about 2.7 kg), because nothing else holds it up.',
    'As the block goes in, the water pushes up on it. That upward push is the buoyant force, and it is why the scale reading drops, the way a rock feels lighter when you lift it in a lake.',
    'The block shoves water out of its way, and that water spills from the spout into the cup. The deeper the block goes, the more water it pushes aside and the fuller the cup gets.',
    'Weight pulls down. The buoyant force and the scale pull up. Once the block is fully under, the buoyant force stops growing at 9.8 N, the weight of the 1 L of water the block pushed aside.',
    'Wood is less dense than water: a block the same size weighs less. It sinks only until the water it pushes aside weighs as much as the wood, here with 60% under. Then the string goes slack and the scale reads zero.',
    'Very salty water is denser than fresh water, so less of it weighs as much as the block. The wood floats higher, with only 50% under. Swimmers float higher in the ocean than in a pool for the same reason.',
    'The probe measures pressure. Deeper liquid has more liquid stacked above it, so the pressure is higher: P = P₀ + ρgh (air pressure plus density × g × depth). At 35 cm it reads 104.7 kPa. You feel this growth in your ears at the bottom of a pool.'
  ]
},
fluidflow: {
  hook: 'A pump pushes 2 L of water each second (about half a gallon) through an 8 cm pipe that narrows to 4 cm, like a hose meeting a nozzle. How much faster does the water move in the narrow part, and is its pressure higher or lower there?',
  hookSet: { mode: 'pipe', Q: 2, d2: 4 },
  answer: 'In the 8 cm section the water moves 0.40 m/s. In the 4 cm section it moves 1.59 m/s, 4 times faster, because half the width is a quarter of the area. Its pressure is lower: the gauge drops from 25.0 kPa to 23.8 kPa.',
  uses: [
    'Spray nozzle: twisting a hose nozzle to a smaller opening makes the water leave faster, so the stream reaches farther across the yard.',
    'Narrowed artery: blood speeds up where plaque narrows an artery, and Doppler ultrasound measures that jump in speed to find the narrow spot.',
    'Water towers: every 10 m of water stacked above your faucet adds about 98 kPa (14 psi), so towns store water up high to push it through the pipes.'
  ],
  takeaway: 'Half the width means a quarter of the area, so the same flow has to move 4 times faster. And where a fluid speeds up, its pressure drops.',
  lede: 'Water flows through a pipe that narrows, like a hose meeting a nozzle. See where it speeds up and where its pressure drops, then punch a hole in a tank and see how hard the water squirts.',
  tour: [
    'A pump pushes 2 L of water (about half a gallon) through this pipe every second. Each dot is a bit of water. Water cannot pile up or squeeze smaller, so the same 2 L must pass every point each second.',
    'Section 2 is now half as wide, 4 cm instead of 8 cm. That is a quarter of the area, so to get the same water through, the dots must move 4 times faster, like water leaving a hose nozzle.',
    'Each glass tube is a pressure gauge: water climbs higher where the pressure is higher. The column over the fast, narrow section is shorter. Faster water has lower pressure. This is Bernoulli’s principle.',
    'Now water leaks from a hole in the side of a tank, like a hole in a rain barrel. The 0.5 m of water above the hole pushes it out at 3.1 m/s, as fast as if it had fallen 0.5 m.',
    'With the hole lower, there is more water stacked above it, so the water squirts out faster. With 1.5 m of water above the hole, it leaves at 5.4 m/s, about 12 mph.'
  ]
},
waves: {
  hook: 'You shake the end of a 3 m rope up and down once a second, like a gym battle rope, and each wave is 2 m long. How long are the waves if you shake twice as fast, or if the rope is pulled four times tighter?',
  hookSet: { mode: 'osc', end: 'none', freq: 1, tension: 1 },
  answer: 'Shaking at 2 Hz makes waves 1.0 m long, half as long, because the rope still carries them at 2.0 m/s. Pulling the rope four times tighter (1 N to 4 N) doubles the wave speed to 4.0 m/s, so at 1 Hz each wave is 4.0 m long. The rope sets the speed; your hand sets how often.',
  uses: [
    'Guitar tuning: turning a peg tightens the string, so waves travel along it faster and the note it plays goes up in pitch.',
    'Stadium wave: at a Broncos game each fan just stands and sits, yet the wave races around the stadium. The people stay put; only the pattern travels.',
    'FM radio: a station at 100 MHz sends radio waves 3 m long, because radio waves travel at 3.00 × 10⁸ m/s and wavelength is speed ÷ frequency.'
  ],
  takeaway: 'The material sets how fast a wave travels; the source sets how often. Wavelength is speed ÷ frequency, so shaking faster makes shorter waves, and a tighter rope or string carries them faster.',
  lede: 'Shake one end of a rope, like a battle rope at the gym. Find out what sets how long the waves are, how fast they travel and what happens when they hit the far end.',
  tour: [
    'This rope is 3 m long, about the length of a jump rope. Each bead is a small piece of rope. A wave is a shape that moves along it; the beads themselves only move up and down.',
    'Follow the green bead. It bobs up and down in place while the wave shape runs to the right, like fans doing the wave at a stadium. Energy moves along the rope; the rope stays put.',
    'The distance from one crest (high point) to the next is the wavelength. Use the ruler under the rope to measure it. Shaking once a second, each wave here is 2 m long.',
    'Now the hand shakes twice as fast, 2 times a second. The rope still carries waves at the same 2 m/s, so each wave is half as long, 1 m: speed = frequency × wavelength.',
    'A tighter rope snaps back harder, so waves race along it faster and stretch out longer. At 4 N, four times as tight, the waves travel twice as fast, 4 m/s.',
    'Send one pulse, a single flick, toward the clamped end. It comes back upside down, because the clamp pulls the rope back the other way.',
    'The same pattern drawn as a slinky: coils bunch up (compressions) and spread out (rarefactions) along the direction the wave travels. Sound moves through air this way.'
  ]
},
sound: {
  hook: 'An ambulance siren plays a 500 Hz tone and passes you on the highway at 30 m/s (about 67 mph). What pitch do you hear as it comes toward you, and what pitch as it drives away?',
  hookSet: { mode: 'doppler', freq: 500, vs: 30, medium: 'air' },
  answer: 'Coming toward you it sounds like 548 Hz. Going away it drops to 460 Hz, about three piano keys lower. The siren never changed: its sound waves bunch up ahead of it and spread out behind it. The paramedics inside hear a steady 500 Hz.',
  uses: [
    'Doppler weather radar: the National Weather Service reads how much the echo off raindrops shifts in frequency to see winds blowing toward or away from the radar, which helps spot tornadoes.',
    'Tuning a guitar: play two strings that should match. A throb 4 times a second means they are 4 Hz apart, and the throbs slow to nothing as you tune them together.',
    'Neighbor’s music: a 100 Hz bass note is 3.4 m long in air, taller than a basketball hoop, and low notes like that get through walls much more easily than high ones.'
  ],
  takeaway: 'A sound coming toward you sounds higher than it really is, and lower once it passes. The faster the source moves, the bigger the drop you hear as it goes by.',
  lede: 'Sound is air being squeezed and stretched. Watch it happen, then change the pitch, take the air away, and race the sound source past a listener like a passing siren.',
  tour: [
    'The speaker cone moves back and forth 300 times a second. Each time it moves out, it shoves the air molecules next to it closer together. Touch a speaker playing loud bass and you can feel this.',
    'The squeezed regions (compressions) and stretched regions (rarefactions) travel away from the speaker at 343 m/s, about 770 mph. The graph below shows the pressure: peaks are compressions.',
    'Follow the red molecule. It only jiggles back and forth around one spot. The wave carries energy across the room to your ear, but no air travels from the speaker to you.',
    'At 800 Hz the speaker pushes more often, so compressions are closer together: 0.43 m apart instead of 1.14 m. Sound speed stays the same, so a higher pitch means a shorter wavelength (λ = v/f).',
    'Pump out all the air. The speaker still vibrates, but there is nothing to squeeze, so no wave reaches the listener. This is why space is silent.',
    'Now the source moves right at 100 m/s. Each wavefront spreads from where the source was when it made it, so fronts bunch up ahead and spread out behind. Ahead you hear 621 Hz; behind, 341 Hz. That is the drop you hear as a race car passes.'
  ]
},
refraction: {
  hook: 'You are under water in a pool, looking up at the surface. Shining a laser from the water up into the air, out to what angle from straight up does the light get out, and what happens past it?',
  hookSet: { mode: 'intro', top: 'water', bot: 'air', angle: 45, white: false },
  answer: 'Up to about 48° from straight up, the light gets out but bends away from the normal: 45° under water leaves at 70° in air. Past 48.7°, none gets out and 100% reflects. So from below, the surface is a round window overhead and a mirror everywhere else.',
  uses: [
    'Grabbing a coin in a pool: light bends as it leaves the water, so the coin looks shallower than it really is. Reach deeper than it appears.',
    'Diamonds: diamond’s critical angle is only about 24°, so light that enters a cut stone bounces around inside many times before escaping, which makes it sparkle.',
    'Rainbows: sunlight bends and splits inside raindrops, each color by a different amount. With the sun behind you, the red band sits about 42° from the shadow of your head.'
  ],
  takeaway: 'Light bends toward the normal going into water or glass, and away from it coming out. Coming out at too steep a slant, past about 49° in water or 41° in glass, it cannot get out at all and reflects instead.',
  lede: 'Shine a laser from air into water or glass and back out. See how much it bends, when it gets trapped inside, and how white light splits into colors.',
  tour: [
    'A red laser shines from air down into water at 45°. The flat line where they meet is the boundary, like the surface of a pool.',
    'Angles are measured from the normal, the dashed line at 90° to the boundary. The protractor shows the angle in (θ₁) and the angle out (θ₂). Here 45° in becomes 32° out.',
    'Light slows down in water and even more in glass. Slowing down bends it toward the normal: in glass, 45° in becomes 28° out. This bending is refraction, and it is why a straw looks broken in a glass of water.',
    'A little light always bounces off, at the same angle it came in. That is the faint reflection you see in a shop window. Here about 5% reflects and 95% goes into the glass.',
    'Now the laser is inside glass, shining up into air at 55°. Past the critical angle (about 41° for glass) no light gets out. It all reflects, as if the surface were a perfect mirror. This is total internal reflection.',
    'Each color slows down a different amount in glass. Violet bends most and red least, so white light fans out into a rainbow. Raindrops do the same thing to sunlight.',
    'A glass fiber traps light by total internal reflection, bounce after bounce. Fiber-optic internet, to homes and across oceans, works this way.'
  ]
},
lenses: {
  hook: 'You use a magnifying glass with a 15 cm focal length to read tiny print on a concert ticket. How far from the print should you hold it to see the letters 3 times taller, and what happens if you hold it farther than 15 cm away?',
  hookSet: { el: 'conv', f: 15, dobj: 10 },
  answer: 'Hold it 10 cm away: the lens makes an upright, virtual image 3 times as tall (the 6 cm candle looks 18 cm tall). Between 10 and 15 cm the image gets even bigger. At exactly 15 cm no image forms, and beyond 15 cm the lens makes a real image that is upside down.',
  uses: [
    'Phone camera: the tiny lens makes a real, upside-down image on the sensor a few millimeters behind it, and the phone flips the picture right side up.',
    'Car side mirror: the passenger mirror is convex, so it shows a smaller, upright image of a wide view, which is why it warns that objects are closer than they appear.',
    'Reading glasses: a +2.00 lens has a power of 2 diopters, which means a focal length of 1 ÷ 2 = 0.5 m, or 50 cm.'
  ],
  takeaway: 'Closer than the focal length, a converging lens gives an upright, enlarged image you look through, like a magnifier. Farther than the focal length, it gives an upside-down image you can catch on a screen, like a camera or projector.',
  lede: 'Move a candle in front of a lens or mirror, like holding a magnifying glass over a page. Follow three rays to find where the image forms, how big it is and when it flips upside down.',
  tour: [
    'A candle stands 40 cm in front of a converging lens, the kind that is thicker in the middle, like a magnifying glass. The dots marked F are the focal points, 15 cm from the lens.',
    'A ray leaving the flame tip parallel to the axis (the center line) bends at the lens and passes through the far focal point F. This is how a magnifying glass can focus sunlight to a hot spot.',
    null,
    null,
    'All three rays meet at one point: the tip of the image. Here it is real (light actually gathers there) and upside down, 24 cm behind the lens and 0.6 times as tall. A screen there shows a sharp picture, the way a camera lens lights up its sensor.',
    'Move the candle to 9 cm, inside the focal point. The rays now spread apart after the lens. Traced backward (dashed) they meet behind the candle: a virtual, upright image 2.5 times as tall. That is what you see through a magnifying glass.',
    'A concave mirror, curved in like the bowl of a spoon, focuses light like a converging lens. The light bounces back, so the real image forms in front of the mirror. Makeup and shaving mirrors are concave.'
  ]
},
coulomb: {
  hook: 'A rubbed balloon lifts your hair from a few centimeters away but does nothing from across the room. Put +3 μC and −2 μC charges 10 cm apart: how strong is the pull, and what happens at 20 cm and at 5 cm?',
  answer: 'At 10 cm they pull with 5.39 N. At 20 cm the force falls to 1.35 N, a quarter. At 5 cm it jumps to 21.6 N, four times as much. At 1 m it would be only 1/100 of the 10 cm force. That fast fade is why static only works up close.',
  uses: [
    'Static shocks in a Denver winter: dry air lets charge build up on you instead of leaking away, so doorknobs zap you far more often than in humid places.',
    'Laser printers: the printer uses light to draw your page as a pattern of charge on a drum, and toner powder sticks only where that pattern attracts it.',
    'Car paint shops: spray guns charge the paint droplets so they are pulled onto the grounded car body, which wraps paint around edges and wastes less of it.'
  ],
  takeaway: 'Electric force fades with the square of distance: twice as far gives one quarter the force, and half as far gives four times. Doubling either charge only doubles the force.',
  lede: 'Charged things push or pull without touching, like a rubbed balloon and your hair. Change the charges and the distance, and see how fast the force fades as they move apart.',
  tour: [
    'Each sphere carries electric charge. Red is positive (missing electrons) and blue is negative (extra electrons). Here q₁ is +3 μC and q₂ is −2 μC; 1 μC is about 6 trillion electrons. The sphere’s size shows how much charge it has.',
    'The arrows show the electric force on each charge. They point toward each other (attraction), and they are exactly the same size, 5.39 N, about the weight of a full half-liter water bottle. Each charge pulls on the other equally.',
    'Make q₂ positive too. Now both arrows point away from each other: like charges push apart. It is why your hair can stand up after you pull off a wool hat: the strands carry the same charge.',
    'Pull the charges twice as far apart, from 10 cm to 20 cm. The force does not drop to half; it drops to a quarter, from 5.39 N to 1.35 N.',
    'Rubbing a balloon on hair moves electrons onto the balloon. Bring it near an electroscope and the gold leaves spread apart before it even touches: the balloon pushes the electroscope’s own electrons down into the leaves.'
  ]
},
efield: {
  hook: 'Dry air at sea level sparks when the electric field reaches about 3,000 kN/C, which is how a static shock jumps to a doorknob. Near a +2 μC charge, how close can you get before the field is strong enough to spark?',
  answer: 'At 8 cm the field is 2,810 kN/C, just under the limit. At 7.5 cm it is 3,200 kN/C, over it. So sparking starts about 7.7 cm away. Halve the distance to 4 cm and the field is four times stronger, 11,200 kN/C.',
  uses: [
    'Birds on power lines: both feet touch the same wire, so the bird sits at one voltage (on one equipotential) and no current flows through its body.',
    'ECG at the doctor’s office: each heartbeat sets up an electric field in your body, and electrodes on your chest read the voltage differences it makes on your skin.',
    'Sharks: special pores on a shark’s snout sense the tiny electric fields made by the muscles of fish hiding in the sand.'
  ],
  takeaway: 'An electric field is the push a charge would feel at each spot. Near a single charge it grows fast as you get closer: half the distance, four times the field.',
  lede: 'Every charge fills the space around it with an electric field. Drag a small test charge around to feel the push, and find out how fast it grows as you get close.',
  tour: [
    'The red ball is a +2 μC charge, about 12 trillion missing electrons. It fills the space around it with an electric field: a push waiting at every spot for any charge that shows up.',
    'Each arrow shows which way a small + charge would be pushed at that spot, like the wind arrows on a weather map. Bigger, darker arrows mean a stronger field. They point away from a + charge.',
    null,
    'The gold dot is a tiny +1 nC test charge, 8 cm from the source. The arrow on it is the force it feels. Slide it closer and the push grows fast: half the distance, four times the force.',
    'The colored rings connect points with the same voltage: red is high, blue is low. They work like contour lines on a hiking map, and they always cross field lines at right angles.'
  ]
},
capacitor: {
  hook: 'A camera flash charges a capacitor before it can fire. If a 9 V battery charges a 100 μF capacitor through 100 kΩ, how full is it after 10 s and after 30 s, and how long until it is truly full?',
  hookSet: { mode: 'rc', R: 100, C: 100, V: 9, sw: 'charge' },
  answer: 'The time constant is 100 kΩ × 100 μF = 10 s. After 10 s it is 63% charged (5.7 V). After 30 s it is 95% (8.6 V). It keeps slowing down, so it is never perfectly full, but after about 50 s, five time constants, it is over 99%.',
  uses: [
    'Camera flash: the flash slowly charges a capacitor from the battery, then dumps all that energy into the bulb in a split second. The charging is the wait between shots.',
    'Touchscreens: your finger changes the capacitance between tiny electrodes under the glass, and the phone finds your touch by sensing where that change happened.',
    'Unplugged microwaves and TVs: their large capacitors can stay charged after you pull the plug, which is why repair guides warn you not to open them.'
  ],
  takeaway: 'A capacitor charges fast at first, then slower and slower. After one time constant (resistance × capacitance) it is 63% full, and after about five it is essentially full. Less resistance or a smaller capacitor makes it charge faster.',
  lede: 'A capacitor stores charge on two metal plates, like a small, fast battery. See what makes it hold more, then watch a bulb glow and fade as it charges.',
  tour: [
    'A capacitor is two metal plates with a gap between them, here plates 10 cm × 10 cm (about the size of a coaster) 2 mm apart. The 9 V battery pulls electrons off the top plate and piles them onto the bottom one.',
    'The + signs on the top plate and − signs on the bottom are the stored charge. The arrows between the plates show the electric field. The charge stays put until you give it a path, so the energy is saved for later.',
    'Bring the plates closer, 1 mm apart. The capacitance (charge stored per volt) doubles from 44.3 pF to 88.5 pF, so the same battery stores twice the charge. Phone touchscreens work by sensing tiny capacitance changes like this.',
    'Now the capacitor is in a circuit with a battery, a resistor and a bulb. When the switch connects the battery, current flows and the bulb lights up. A camera flash charges its capacitor the same way.',
    'As the capacitor fills, it pushes back against the battery. The current slows and the bulb dims, even though the battery has not changed. The fuller it gets, the slower it fills.',
    'The graph rises fast, then levels off. After one time constant (resistance × capacitance, 1 s here) the capacitor is 63% charged, after three it is 95%, and after five it is essentially full.'
  ]
},
circuit: {
  hook: 'You have two identical flashlight bulbs and one 9 V battery. Do they glow brighter wired one after the other (series) or side by side (parallel), and which way drains the battery faster?',
  hookSet: { circuit: 'series2', volts: 9 },
  answer: 'In series each bulb glows at about 25% brightness and the battery supplies 0.45 A. In parallel each glows at 98%, almost as bright as one bulb alone, but the battery supplies 1.76 A, about 4 times as much, so it runs down about 4 times faster.',
  uses: [
    'Home wiring: outlets and lights are wired in parallel, so each gets the full 120 V and turning off a lamp does not shut off the fridge.',
    'Old holiday lights: many older strings were wired in series, so one burned-out bulb broke the loop and the whole string went dark.',
    'Hair dryer and space heater: a 1,500 W hair dryer draws 12.5 A at 120 V, so adding a space heater on the same 15 A circuit trips the breaker.'
  ],
  takeaway: 'In parallel, each device gets the full voltage and works on its own, but the battery or breaker has to supply the total current. In series, devices share the voltage, so each gets dimmer and one break shuts them all off.',
  lede: 'A battery pushes electrons around a loop, and bulbs turn that energy into light. Wire two bulbs in a line or side by side, and find out which is brighter and which drains the battery faster.',
  tour: [
    'The battery pushes charge around the circuit. Its voltage is how hard it pushes: here 9 V, the rectangular battery in a smoke detector. The long plate in the symbol is the positive (+) end.',
    'Current flows only through a complete loop, from one end of the battery, through the bulb, and back to the other end. A switch just opens or closes a gap in that loop.',
    'The blue dots are electrons. They leave the negative end, travel through the bulb and return to the positive end. Engineers draw “conventional current” the opposite way, from + to −.',
    'In the thin filament the electrons lose energy, which comes out as light and heat. More power, more light. This one bulb uses about 8 W and sets the 100% brightness mark.',
    'An ammeter (current meter) goes in series, right in the path of the current, so all the current passes through it, like a turnstile counting everyone who walks through.',
    'A voltmeter goes across a part, in parallel, to compare the push on one side with the other. Here it reads about 8.9 V across the bulb.',
    'Now two bulbs in parallel. Each has its own path across the battery, so each glows about as brightly as one bulb alone. The battery has to supply both, 1.76 A, twice as much. The outlets in your home are wired this way.'
  ]
},
magnetism: {
  hook: 'A scrapyard crane lifts cars with an electromagnet and drops them by switching it off. A coil has 50 turns carrying 5 A. How many paperclips does it lift without an iron core, with one, and with 100 turns instead of 50?',
  hookSet: { scene: 'solenoid', cur: 5, turns: 50, core: false },
  answer: 'Without iron the coil lifts no paperclips; its field is only about 2 mT. With the iron core it lifts 20. With the core and 100 turns it lifts 38, almost twice as many. Set the current to 0 and every clip drops, which is how the crane lets go.',
  uses: [
    'MRI scanners: the patient lies inside a huge coil whose current makes a field of 1.5 or 3 tesla, about 30,000 to 60,000 times stronger than Earth’s.',
    'Earbuds and speakers: a tiny coil on the speaker cone becomes an electromagnet. Changing current pushes it against a permanent magnet thousands of times a second, which makes sound.',
    'Hiking with a compass in Colorado: magnetic north is about 7° east of true north in Denver, so you adjust map bearings by that much.'
  ],
  takeaway: 'An electromagnet is a coil of wire carrying current. More turns or more current make it stronger, an iron core makes it hundreds of times stronger, and switching off the current turns it off.',
  lede: 'Magnets push and pull without touching. Map the field around a magnet and a wire with compasses, then build an electromagnet and find out what makes it lift more.',
  tour: [
    null,
    'A compass needle is a tiny magnet. Its red north end lines up along the field, so a grid of compasses draws the field for you, the way iron filings do on paper.',
    'The big compass reads the field at one spot. Click anywhere, or use the sliders, to move it. Here it sits 3 cm above the middle of the magnet, where the field is about 3,600 µT, 70 times Earth’s, and it points toward the south pole.',
    'A wire carrying current has a magnetic field that circles around it. Here the current comes out of the screen. Point your right thumb along the current; your fingers curl the way the field goes.',
    'Send the current the other way (into the screen) and every compass needle flips around. Reverse the current and you reverse the field.',
    'Wind the wire into a coil and the fields of all the turns add up. The coil acts like a bar magnet you can switch on and off: an electromagnet. With 50 turns, 5 A and no iron, it is too weak to lift one paperclip.',
    'An iron core multiplies the field about 200 times. Now the same coil lifts a chain of 20 paperclips. Scrapyard cranes work this way, then switch off the current to drop the load.',
    null
  ]
},
induction: {
  hook: 'A shake flashlight has no battery: shaking slides a magnet through a coil. If one push at 0.3 m/s through 100 turns gives 3.6 mA, what do you get pushing twice as fast, using 300 turns, or holding the magnet still inside?',
  answer: 'Twice as fast, 0.6 m/s, gives about 7.2 mA. Three times the turns, 300, gives about 10.7 mA. Holding the magnet still, even right inside the coil, gives 0 mA, because the field through the coil is not changing. Shake hard and keep it moving.',
  uses: [
    'Wind farms on Colorado’s eastern plains: each turbine spins magnets past coils of wire, the same induction, to put electricity on the grid.',
    'Electric guitar pickups: a vibrating steel string changes the magnetic field through a small coil under it, which makes a tiny voltage the amplifier turns into sound.',
    'Wireless phone charging: current that keeps reversing in a coil in the pad makes a changing field, which induces a current in a coil inside your phone.'
  ],
  takeaway: 'A magnet only makes electricity while the field through a coil is changing. Move it faster or add more turns for a bigger current; stop it and the current stops, even with the magnet inside.',
  lede: 'Move a magnet near a coil of wire and electricity appears, with no battery at all. Find out what makes the current bigger and what makes it flow the other way.',
  tour: [
    'A coil of copper wire is connected to a sensitive current meter (a galvanometer). There is no battery anywhere in this circuit, so any current has to come from the magnet.',
    'A magnet sitting still near the coil makes no current. Its field is there, but it is not changing, and only change makes electricity.',
    'Push the magnet into the coil and the meter swings. The magnetic field through the coil (the flux) is growing, and that change pushes current around the wire. A slow push at 0.3 m/s gives about 3.6 mA.',
    'Pull the magnet out and the meter swings the other way. A shrinking field pushes current in the opposite direction, so a magnet moving in and out makes current that flips back and forth.',
    'Move the magnet faster and the field changes faster, so the voltage is bigger. Shake a shake flashlight harder and it charges faster for the same reason.',
    'Each turn of the coil gets the same push, and the turns add up like batteries in a row. Three times the turns, three times the voltage. That is why generators use coils with many turns.'
  ]
},
rocket: {
  hook: 'For a class bottle-rocket launch you pump a 2 L bottle to 60 psi. How much water should you put in: 0.2 L, about a third of the bottle, or nearly full at 1.6 L, and how high does each go?',
  hookSet: { mode: 'bottle', psi: 60, water: 0.6 },
  answer: 'With 0.2 L it reaches about 26 m. Anything from 0.5 to 0.8 L reaches about 38 to 39 m, with the best near 0.7 L. Nearly full, 1.6 L, it barely reaches 3.5 m, because there is too little air left to push the water out. Aim for about a third.',
  uses: [
    'Fire hoses: the water blasting forward pushes the hose backward hard, which is why firefighters brace their bodies or put two people on a big hose.',
    'Squid: a squid shoots water backward out of a tube in its body and darts forward, rocket-style.',
    'Spacewalks: astronauts wear a small jetpack (SAFER) that squirts nitrogen gas to push them back toward the station, since there is nothing to push against.'
  ],
  takeaway: 'A rocket moves by throwing mass backward, so it needs both something to throw and a strong push to throw it fast. For a bottle rocket, fill about a third with water; for big rockets, faster exhaust beats more fuel.',
  lede: 'A rocket moves forward by throwing mass backward, like a fire hose kicking back. Launch a big rocket in space and a water bottle rocket on a field, and find out what makes each go faster or higher.',
  tour: [
    'This rocket sits in deep space, with no ground or air to push on. It is not moving, so its momentum (mass × velocity) is zero. The orange part of each tank is fuel: 100 t of it in a 113 t rocket.',
    'The engine throws exhaust backward at 3,000 m/s, about 6,700 mph. Pushing the exhaust back pushes the rocket forward, like the kick of a fire hose: equal and opposite forces, just like the spring explosion in the Collisions lab.',
    'The rocket’s forward momentum always equals the exhaust’s backward momentum, so the total stays at zero. Momentum is conserved even for a rocket, which is why it needs nothing to push against.',
    'As fuel burns, the rocket gets lighter, so each kilogram of exhaust speeds it up more. Watch the orange fuel bar shrink while the speed climbs faster and faster.',
    'When the fuel is gone, nothing pushes. In space there is no friction, so the rocket coasts at a steady 6.5 km/s, about 14,500 mph.',
    'Same physics on a field: air pumped to 60 psi shoves water out of the nozzle, and the bottle goes up. With 0.6 L of water the push lasts about 0.07 s, less than a tenth of a second, so it is slowed down here.'
  ]
},
chaos: {
  hook: 'Weather follows exact physics, yet forecasts lose accuracy after about a week. Start two double pendulums with both arms at 120°, one nudged just 0.01°. How long until they move differently, and do gentle 10° swings do the same?',
  answer: 'For about 5 s the lower bobs stay within 1 cm. By about 7 s they are 10 cm apart, and by 10 s they are doing completely different things, up to 3.8 m apart. Started at 10°, they are still within 0.03 cm after 20 s. Big, wild swings are chaotic; small ones stay predictable.',
  uses: [
    'Weather forecasts: forecasters run the same model dozens of times with tiny changes to the starting data. When the runs spread apart, they know the forecast is shaky.',
    'Pool break: a tiny change in where the cue ball hits sends the balls to different pockets, because each collision multiplies the difference.',
    'Rolling dice: physics decides the result, but tiny differences in your throw grow with every bounce, so no one can predict the roll.'
  ],
  takeaway: 'In a chaotic system a tiny difference at the start keeps multiplying until it takes over. Better measurements buy only a little more time, which is why a 3-day forecast is solid and a 3-week forecast is a guess.',
  lede: 'A pendulum hanging from a pendulum. Start two copies almost exactly the same and see how long you can predict them, the same problem weather forecasters face.',
  tour: [
    'The upper arm swings from a fixed pivot, and the lower arm swings from the end of the upper one, like two 1 m sticks hinged together. Each arm is a rigid rod with a heavy bob.',
    'There are really two double pendulums here, drawn on top of each other. Copy B starts 0.01° different from copy A, far less than you could ever see or measure.',
    'Release them and watch in slow motion. For the first few swings you cannot tell them apart. After 5 seconds the lower bobs are still less than 1 cm apart.',
    'Every time the lower arm whips over the top, the small difference gets multiplied. Watch the distance readout: by about 7 s they are 10 cm apart, and soon after they are meters apart.',
    'The trails show where each lower bob has been. Two paths that began together now look nothing alike, even though the physics is exactly the same for both.',
    'Switch to a single pendulum started the same way. Its copies stay within a centimeter, because its swing repeats like a clock. Predictable systems keep small errors small.'
  ]
},
relativity: {
  hook: 'Your twin stays home while you fly to a star 10 light-years away and back at 0.9 c, 90% of light speed. When you land, how many years has each of you aged, and does a jet trip change your age at all?',
  hookSet: { scene: 'twins', craft: 'slider', beta: 0.9, dist: 10 },
  answer: 'Earth’s clocks count 22.2 years for the round trip. Your clock runs slow by γ = 2.29, so you age only 9.7 years and come home 12.5 years younger than your twin. On a jet at 250 m/s your clock falls behind by only about 30 billionths of a second per day.',
  uses: [
    'GPS: satellite clocks are corrected for relativity, from their speed and from gravity together, about 38 μs a day. Without it, your map position would drift about 10 km a day.',
    'Cosmic-ray muons: they pass through your body all the time and reach the ground only because their clocks run slow. More arrive at Denver’s altitude than at sea level.',
    'Particle accelerators: protons in CERN’s Large Hadron Collider move so close to light speed that γ is about 7,000, so their clocks run 7,000 times slow.'
  ],
  takeaway: 'Moving clocks tick slower, but the effect gets big only near light speed: at 0.87 c a clock runs at half rate. At jet speed it is 30 billionths of a second a day, tiny, though GPS satellites must correct for it.',
  lede: 'Light always moves at the same speed for everyone. See what that does to clocks and lengths on fast trains, ships and a twin’s trip to the stars, and find out why you never notice it.',
  tour: [
    'Light bounces between two mirrors 1.5 m apart. Each round trip is one tick: 10 billionths of a second (10 ns). The train is not moving, so both clocks tick together.',
    'At 0.6 c (60% of light speed), we see the light in the train’s clock take a slanted path. That path is longer, and light’s speed never changes, so each tick takes longer: 12.5 ns instead of 10.',
    'Compare the tick counts. At 0.87 c the train clock ticks about half as often as yours: γ ≈ 2 (gamma, how many times slower a moving clock runs). This is time dilation.',
    'A jet at 250 m/s (560 mph) gives γ = 1.0000000000003. Its clock falls behind by about 30 billionths of a second per day: real, measured with atomic clocks, but far too small to notice.',
    'A 100 m ship, about the length of a football field, flies past at 0.8 c. We measure it as 60 m long: shorter along its motion by 1/γ. Its height stays the same.'
  ]
},
photoelectric: {
  hook: 'Sunburn comes from ultraviolet light, not from bright visible light. Shine full-brightness red light (700 nm) and then dim ultraviolet (250 nm, at 10%) on a zinc plate. Which one knocks electrons out, and how much energy does each photon carry?',
  hookSet: { metal: 'zinc', lam: 700, I: 100 },
  answer: 'Each red photon carries 1.77 eV, far less than the 4.33 eV an electron needs to escape zinc, so even full brightness frees none. Each 250 nm photon carries 4.96 eV, so even dim UV frees electrons at once, with up to 0.63 eV to spare. Brightness only changes how many photons arrive.',
  uses: [
    'Sunscreen in the mountains: each UV photon carries enough energy to damage DNA in skin cells, and UV gets stronger with altitude, so you burn faster on a Colorado ski slope.',
    'Darkroom red light: black-and-white photo paper can be handled under a red safelight, because red photons are too weak to trigger the chemistry in the paper.',
    'Solar panels: a silicon cell needs photons with at least 1.1 eV, light shorter than about 1,100 nm. Each photon frees at most one electron, however bright the sun.'
  ],
  takeaway: 'What one photon can do depends on its color, not on how bright the light is. Brighter light means more photons, not stronger ones, which is why UV can burn skin while bright red light only warms it.',
  lede: 'Shine light of different colors and brightness on a metal and see when electrons pop out. Find out why color matters and brightness does not, the same reason UV burns skin and red light does not.',
  tour: [
    'The lamp sends out light as photons, tiny packets of energy. Each wiggle here is a photon. Each photon of this blue light (450 nm) carries 2.76 eV (electron-volts, a tiny energy unit). Red photons carry less, ultraviolet more.',
    'When a photon hits the sodium plate, it hands all its energy to one electron. If that is enough to escape, the electron flies across the empty tube to the collector, and a current flows.',
    'The electron has to climb out of the metal. That climb is the work function φ, 2.28 eV for sodium. Whatever photon energy is left over, here 0.48 eV, becomes the electron’s energy of motion.',
    'Now red light (650 nm) on a zinc plate. Each red photon carries 1.91 eV, far less than zinc’s 4.33 eV escape cost, so no electron gets out. The faded part of the spectrum bar is every color that never works on zinc.',
    'Full brightness sends more red photons, but each one is still too weak. An electron cannot save up energy from several photons, so still nothing comes out. A bright red heat lamp warms skin but cannot sunburn it for the same reason.',
    'Switch to 240 nm ultraviolet. Each photon now carries 5.17 eV, more than zinc’s 4.33 eV, so electrons escape at once with up to 0.84 eV to spare. Even dim UV would do it.'
  ]
}
});
