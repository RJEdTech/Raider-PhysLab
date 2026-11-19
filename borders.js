/* Where science meets philosophy + How exact does it need to be? (pilot, Nov 17, 2026)
   One entry per tool. Rendered by the engine below the stage in Full lab and at the end of Learn it.
   Standard: teach, don't preach. Name each thinker's view fairly, state definitive Church teaching as the Church's teaching,
   and leave open questions open (no answer key). Every number has a source and a year. */
BioLab.addBorder({
gravity: {
  q: 'Why does nature follow a mathematical law at all?',
  saw: 'The same pull that drops a ball also bends a fast throw into an orbit. One equation, F = GMm/r², describes both the apple and the Moon.',
  assumes: [
    'The same law holds everywhere and always: on Earth, at the Moon and at Jupiter, today and a billion years ago.',
    'The future will behave like the past. Every prediction depends on it, and no experiment can prove it without already assuming it.',
    'Mathematics describes the physical world, so an equation on paper can tell us where a planet will be.'
  ],
  stops: 'Physics finds the law, measures G and predicts orbits to astonishing precision. It cannot say why there are laws, or why they can be written in mathematics. Those questions sit underneath every experiment.',
  church: 'The Church teaches that research done in a truly scientific way can never conflict with faith, “because the things of the world and the things of faith derive from the same God” (Catechism no. 159).',
  faith: { items: [
    { who: 'Fr. Giovanni Battista Riccioli and Fr. Francesco Grimaldi', when: 'Jesuits in Bologna, 1640s', says: 'They dropped clay balls from a 97-meter tower, timed the falls with pendulums and confirmed Galileo’s rule for falling bodies: one of the first careful measurements of g.' },
    { who: 'The Jesuit Moon map', when: '1651', says: 'Riccioli and Grimaldi’s map named the Moon’s craters after scientists, including Copernicus and Galileo. Many names are still used, and Newton later tested his law of gravity on the Moon’s orbit.' }
  ], link: { href: 'faith.html#riccioli-g', label: 'Read the full stories on Faith and Physics, and do their math' } },
  views: [
    { who: 'Isaac Newton', when: '1713', says: 'He wrote that the elegant system of the Sun, planets and comets could only come from the design and rule of an intelligent and powerful Being.' },
    { who: 'David Hume', when: '1748', says: 'We never see a cause, only one event following another. We expect the pattern to continue from habit, and reason cannot prove it will.' },
    { who: 'Thomas Aquinas', when: '13th century', says: 'Things without minds act in regular, ordered ways toward an end. An ordered world points to an intelligence that orders it, the fifth of his five ways.' },
    { who: 'Eugene Wigner', when: 'physicist, 1960', says: 'He called the fit between mathematics and physics a wonderful gift “which we neither understand nor deserve.” He offered no explanation for it.' },
    { who: 'Albert Einstein', when: '1936', says: 'He said the most incomprehensible thing about the world is that it is comprehensible at all. He believed in an order in nature, but not in a personal God.' }
  ],
  margin: {
    lead: 'We use math to fly to Mars, not to tabulate the exact size of a grain of salt. Every number below is “good enough” for some jobs and not for others.',
    rows: [
      { what: 'G, the gravitational constant', value: '6.67430 × 10⁻¹¹ N·m²/kg²', range: '± 0.00015 (about 2 parts in 100,000); the least precise of all the basic constants', how: 'Lab experiments that weigh the tiny pull between metal masses; different labs disagree more than they expect (CODATA 2022)', enough: 'Every school problem and most engineering. It is the hardest constant to pin down.' },
      { what: 'G × mass of the Sun', value: '1.32712440018 × 10²⁰ m³/s²', range: 'Known to about 10 digits, far better than G or the Sun’s mass alone', how: 'Tracking planets and spacecraft by radio for decades', enough: 'Flying to Mars. Missions still plan several course corrections on the way, because no launch is perfect.' },
      { what: 'g at Earth’s surface', value: '9.8 m/s²', range: 'About 9.78 at the equator to 9.83 at the poles, a little less at Denver’s altitude', how: 'Pendulums, falling-mass gravimeters and satellites', enough: 'Any free-fall problem in class. Not for a precise map of oil or minerals underground.' }
    ],
    note: 'Objective does not mean exact. It means people measuring independently land inside the same range. When they do not, as labs measuring G still do not, that disagreement is itself a discovery.'
  }
},
photoelectric: {
  q: 'Is the photon a real thing, or just our best way to calculate?',
  saw: 'Below a certain color, no electrons escape however bright the light. Above it, even dim light frees electrons at once. Light delivers energy in packets of hf.',
  assumes: [
    'A meter reading tells us about something real that we cannot see.',
    'The same experiment gives the same result for anyone, anywhere, so a result in one lab speaks for all of nature.',
    'Nature is consistent enough to be captured by a simple equation like KEmax = hf − φ.'
  ],
  stops: 'Physics shows that light gives up energy in packets and predicts every meter reading. Whether the photon is a “thing” out there or our best description of what we measure is the question of scientific realism. That is philosophy, and physicists still disagree.',
  church: 'The Church teaches that faith and reason are “like two wings” lifting the mind toward truth (John Paul II, <i>Fides et Ratio</i>, 1998), and that truth is one: what is really discovered about light cannot contradict what faith holds (Catechism no. 159). The Church does not decide whether the photon is a thing or a tool for calculating. It leaves that to physics and philosophy.',
  faith: { items: [
    { who: 'Fr. Francesco Grimaldi', when: 'Jesuit, Bologna, 1665', says: 'He discovered and named diffraction: light spreading into bands as it passes the edge of an obstacle. It was early evidence that light behaves like a wave, the other half of the puzzle you just saw.' },
    { who: 'Fr. Angelo Secchi', when: 'Jesuit astronomer, 1860s', says: 'He sorted stars into classes by the colors in their light, one of the first steps toward reading what stars are made of from their spectra.' }
  ], link: { href: 'faith.html#grimaldi-secchi', label: 'Read Grimaldi and Secchi’s story on Faith and Physics' } },
  views: [
    { who: 'Albert Einstein', when: '1905', says: 'Light really comes in quanta. He held that physics describes a world that exists whether or not anyone is measuring it.' },
    { who: 'Robert Millikan', when: '1916', says: 'He spent years testing Einstein’s equation, confirmed it and measured h, yet for years still found the idea of light particles hard to accept.' },
    { who: 'Niels Bohr', when: 'as remembered by a colleague', says: 'Physics is not about finding out how nature is. It is about what we can say about nature from our experiments.' },
    { who: 'Ernst Mach', when: 'late 1800s', says: 'Science should describe what we observe and nothing more. He doubted that atoms, which no one could see, were real.' },
    { who: 'Thomas Aquinas', when: '13th century', says: 'All knowledge begins in the senses, and the mind can reach real causes by reasoning from their effects, even causes it never sees.' }
  ],
  margin: {
    rows: [
      { what: 'Planck’s constant h', value: '6.62607015 × 10⁻³⁴ J·s', range: 'Exact, by definition, since 2019', how: 'After a century of measurements, scientists fixed its value and now define the kilogram from it', enough: 'Anything. Making a constant exact is a choice about units, not a claim that nature was measured perfectly.' },
      { what: 'Millikan’s h', value: '6.57 × 10⁻³⁴ J·s (1916)', range: 'He claimed about 0.5%; today’s value is almost 1% higher', how: 'The slope of stopping voltage against frequency, the same graph you can make here', enough: 'Proving Einstein’s equation and winning the 1923 Nobel Prize. A stated range can itself be a little too small.' },
      { what: 'Work function of a metal', value: 'Sodium 2.28 eV (in this tool)', range: 'About ± 0.2 eV, depending on how clean the surface is', how: 'Finding the threshold color where electrons stop escaping', enough: 'Deciding which colors free electrons. Not one fixed value for every sample.' }
    ]
  }
}
});

/* Nov 19, 2026: Catholic-insight pass (what is real → how we know → what the Church teaches → your call). */
BioLab.addBorder({
relativity: {
  q: 'Is time something real, or just what clocks do?',
  saw: 'A moving light clock ticked slower, and moving lengths shrank. Each observer measured the other’s clock running slow, and both were right.',
  assumes: [
    'The laws of physics are the same for everyone moving at a steady speed. Einstein started from this and worked out what follows.',
    'Light moves at the same speed for every observer. That was a bold assumption in 1905, and it has passed every test since.',
    'A good clock measures time itself, not just its own ticking.'
  ],
  stops: 'Physics tells us exactly how clocks compare, well enough to run GPS. It does not settle whether time “flows,” whether the past and future are as real as the present, or why we live time as a “now.” Philosophers still argue about these questions.',
  church: 'The Church teaches that faith and reason are “like two wings” lifting the mind toward truth (John Paul II, <i>Fides et Ratio</i>, 1998), and that honest science and faith cannot truly conflict, because both come from the same God (Vatican II, <i>Gaudium et Spes</i> 36). Fr. Georges Lemaître, a Belgian priest, used Einstein’s equations in 1927 to propose that the universe is expanding: the start of the Big Bang theory. When Pius XII seemed to treat it as proof of creation in 1951, Lemaître urged caution, because physics and faith answer different questions.',
  faith: { items: [
    { who: 'Boethius', when: 'Catholic philosopher, 524', says: 'Eternity is not endless time but the complete possession of life all at once. God sees all of time together, the way someone on a hilltop sees a whole road (an image Aquinas later used).' },
    { who: 'The Fourth Lateran Council', when: '1215', says: 'It taught that God created all things “from the beginning of time,” so time itself is part of creation, not a stage God stands on. The Catechism adds that “to God, all moments of time are present in their immediacy” (no. 600).' }
  ], link: { href: 'faith.html#lemaitre-vatt', label: 'Read Lemaître’s story on Faith and Physics, and do its math' } },
  views: [
    { who: 'Aristotle', when: '4th century BC', says: 'Time is the measure of change. If nothing ever changed, there would be no time to count.' },
    { who: 'Augustine', when: '<i>Confessions</i>, about 400', says: 'If no one asks me what time is, I know; when I try to explain it, I cannot. We live time in the mind, as memory, attention and hope.' },
    { who: 'Isaac Newton', when: '<i>Principia</i>, 1687', says: 'Time is absolute. It flows evenly by itself, the same everywhere, whether or not anything happens.' },
    { who: 'Albert Einstein', when: 'letter, 1955', says: 'Time is woven together with space. He wrote that the difference between past, present and future is a stubborn illusion.' },
    { who: 'Henri Bergson', when: 'debate with Einstein, 1922', says: 'Clock time is not the whole of time. The time we live, which he called “duration,” is real and cannot be cut into equal ticks.' }
  ],
  margin: {
    lead: 'Relativity is tested with some of the most precise clocks people have ever built.',
    rows: [
      { what: 'GPS satellite clocks', value: 'Gain about 38 microseconds a day', range: 'About +45 µs from weaker gravity, −7 µs from speed', how: 'Corrected in every GPS satellite since the first launches in 1978', enough: 'Finding your phone within a few meters. Uncorrected, positions would drift by roughly 10 km a day.' },
      { what: 'Jet clocks, 1971 (Hafele and Keating)', value: 'Eastward lost 59 ± 10 ns; westward gained 273 ± 7 ns', range: 'Predicted: −40 ± 23 ns and +275 ± 21 ns', how: 'Four atomic clocks flown around the world twice on airliners', enough: 'Showing time dilation is real for ordinary clocks, not just a math trick.' },
      { what: 'Muon lifetime at rest', value: '2.197 µs', range: 'Known to about 1 part per million', how: 'Timing millions of muon decays in the lab', enough: 'Explaining why muons made high in the sky reach the ground.' }
    ],
    note: 'Two clocks disagreeing is not an error. Relativity predicts how much they disagree, and the measurements land inside the predicted range.'
  }
}
});

/* Nov 19, 2026: chaos, color and the new double-slit tool (borders session), with the Catholic tradition on each card. */
BioLab.addBorder({
chaos: {
  q: 'If the pendulum follows exact laws, why can’t we predict it, and does that leave room for free will?',
  saw: 'Two double pendulums started a hair apart. For a few seconds they swung together; then they went completely different ways. The law never changed, only a tiny difference at the start.',
  assumes: [
    'The same exact equations govern both pendulums at every instant (in the model, the future is fully set by the start).',
    'We can never measure a starting position perfectly, only within a range.',
    'A computer’s rounded numbers follow the real motion closely enough, at least for a while.'
  ],
  stops: 'Physics shows that exact laws can still make the future impossible to predict, because tiny errors grow fast. It cannot settle whether the universe is fully determined, or whether people make real choices. And unpredictable is not the same as free: a chaotic pendulum is not choosing anything.',
  church: 'The Church teaches that human freedom is real: “God created man a rational being, conferring on him the dignity of a person who can initiate and control his own actions” (Catechism no. 1730). It also teaches that God’s providence works through natural causes and through free human choices without canceling them (Catechism nos. 306–308).',
  faith: { items: [
    { who: 'Pierre Duhem', when: 'Catholic physicist, 1906', says: 'He pointed out that some exact mathematical predictions are useless in physics, because no measurement of the start is ever perfect. It was one of the first descriptions of what we now call chaos.' },
    { who: 'Fr. Luis de Molina (Jesuit) and Fr. Domingo Báñez (Dominican)', when: '1580s–1607', says: 'They argued fiercely over how God’s knowledge of the future fits with human free choice. In 1607 Pope Paul V let both sides keep teaching and forbade either to call the other heretical. The Church left an open question open.' }
  ] },
  views: [
    { who: 'Pierre-Simon Laplace', when: '1814', says: 'A mind that knew every force and the position of every particle at one instant could see the whole future as clearly as the past.' },
    { who: 'Henri Poincaré', when: '1908', says: 'A tiny difference in the starting state can produce a huge difference later, so prediction becomes impossible, even though the laws are exact.' },
    { who: 'Thomas Aquinas', when: '13th century', says: 'People have free choice because reason sees that no limited good is the only good. The will is not forced to pick any one of them, so a person truly decides.' },
    { who: 'Daniel Dennett', when: '2003', says: 'Free will can exist even if the universe is determined. What matters is being able to weigh reasons and act on them, and humans evolved to do that.' },
    { who: 'Sam Harris', when: '2012', says: 'Free will is an illusion. Your choices come from brain events you did not choose, whether they are determined or random.' }
  ],
  margin: {
    lead: 'In chaos the question “how exact?” has a hard answer: no measurement is ever exact enough to predict forever.',
    rows: [
      { what: 'Copy B’s head start', value: '0.01° in this tool (Closer look lets you change it)', range: 'Make it 10 times smaller and the pendulums stay together only a little longer', how: 'Watching when the two drawings split apart', enough: 'Seeing that better measurement buys only a little more time.' },
      { what: 'Edward Lorenz’s rounding', value: 'He typed 0.506 instead of 0.506127 (1961)', range: 'A difference of about 1 part in 4,000', how: 'Rerunning a computer weather model from the middle', enough: 'Nothing: the new forecast matched at first, then drifted into completely different weather.' },
      { what: 'How far ahead weather can be forecast', value: 'Reliable daily forecasts about 9 to 10 days out', range: 'The limit is about two weeks, even with nearly perfect models and data (Zhang and colleagues, 2019)', how: 'Running the best weather models many times from slightly different starts', enough: 'Planning a ski trip next week. Not for a forecast next month.' }
    ],
    note: 'A chaotic system is objective and exact in its laws, and still unpredictable in practice. Predictable and determined are two different ideas.'
  }
},
color: {
  q: 'Is red in the apple, or in me?',
  saw: 'The same car looked red, black or gray depending on the lamp and the glasses. The car reflects some wavelengths and absorbs others; your three kinds of cones turn that light into the color you see.',
  assumes: [
    'An instrument that measures wavelength reports something real about the light.',
    'Other people’s eyes and brains work enough like yours that “red” means the same thing.',
    'Your senses report the world rather than invent it.'
  ],
  stops: 'Physics measures the wavelengths a surface reflects, and biology traces the signal from the cones to the brain. Neither explains why 650 nm light looks like this to you: the experience itself. Philosophers call that the “hard problem” of consciousness.',
  church: 'The Church teaches that the human person is one, body and soul together (Catechism no. 365), so seeing is a real act of the whole person, not a picture shown to a mind trapped inside. It also teaches that the order and beauty of creation, discovered “progressively as the laws of nature,” can lead the mind to God (Catechism nos. 32 and 341).',
  faith: { items: [
    { who: 'Theodoric of Freiberg', when: 'Dominican friar, about 1304–1310', says: 'Using glass globes filled with water as giant raindrops, he worked out how sunlight bends and reflects inside drops to make a rainbow, including the second, fainter bow.' },
    { who: 'Fr. Francesco Grimaldi and Fr. Angelo Secchi', when: 'Jesuits, 1665 and 1860s', says: 'Grimaldi discovered diffraction, light spreading into colored bands at an edge. Secchi sorted the stars by the colors in their light, and a star’s color tells its temperature.' }
  ], link: { href: 'faith.html#grimaldi-secchi', label: 'Read their story on Faith and Physics, and find a star’s temperature from its color' } },
  views: [
    { who: 'Democritus', when: 'about 400 BC', says: 'Sweet, bitter and color exist only by convention. In reality there are only atoms and empty space.' },
    { who: 'Galileo Galilei', when: '1623', says: 'Tastes, smells and colors exist only in the one who senses them. Outside us there are only shapes, sizes and motions.' },
    { who: 'John Locke', when: '1690', says: 'Color is a power in the object to produce an idea of color in us. The power is real; the color we see is in our minds.' },
    { who: 'Aristotle and Aquinas', says: 'Color is really in the apple, as a quality of its surface. When you see it, the apple’s color and your seeing are one act: the red becomes present in you.' },
    { who: 'Thomas Nagel', when: '1974', says: 'No physical description, however complete, can tell you what an experience is like from the inside. Science leaves that part out.' }
  ],
  margin: {
    lead: 'Two people can agree on a wavelength to the nanometer and still not know whether they see the same red. That is the line between what we measure and what we experience.',
    rows: [
      { what: 'The visible band', value: 'About 380 to 750 nm', range: 'The edges differ from person to person and with brightness', how: 'Asking many people when a light stops looking dark', enough: 'Every color problem in class. Not a sharp line: the eye fades out gradually.' },
      { what: 'Peak sensitivity of the three cones', value: 'S about 420 nm, M about 534 nm, L about 564 nm', range: 'Each cone responds over a wide range around its peak, and the M and L curves overlap heavily', how: 'Shining light through single cones taken from human eyes (Bowmaker and Dartnall, 1980)', enough: 'Explaining how three signals make every color you see.' },
      { what: 'Red-green color blindness', value: 'About 8% of men and 0.5% of women of Northern European descent', range: 'Lower in many other populations', how: 'Color-vision tests on large groups', enough: 'Knowing that a classroom of 30 likely has someone who sees red and green differently.' }
    ]
  }
},
doubleslit: {
  q: 'Does the electron go through both slits, and does looking change what is real?',
  saw: 'Electrons sent one at a time each landed as a single dot, yet together they built wave bands. When a detector recorded which slit each one used, the bands disappeared.',
  assumes: [
    'Each dot is a real event caused by a real electron, even though no one sees the electron in flight.',
    'The rule that predicts the pattern holds for every electron, not only the ones we counted.',
    'A probability can describe what one single particle will do, not only what a crowd does.'
  ],
  stops: 'Quantum physics predicts the pattern perfectly, dot by dot. It does not say what the electron is doing between the source and the screen. Physicists hold several interpretations that make exactly the same predictions, and no experiment so far can choose between them.',
  church: 'The Church teaches that research done in a truly scientific way “can never conflict with the faith” (Catechism no. 159), and it does not teach any interpretation of quantum physics. It does teach that God holds every creature in being at every moment (Catechism no. 301), whether or not anyone is watching.',
  faith: { items: [
    { who: 'Fr. Francesco Grimaldi', when: 'Jesuit, Bologna, 1665', says: 'He let sunlight through a tiny hole, put a thin rod in its path and saw colored bands at the edges of the shadow. He named the effect diffraction, the first step toward this experiment.' },
    { who: 'St. John Paul II', when: 'letter to the Vatican Observatory’s director, 1988', says: '“Science can purify religion from error and superstition; religion can purify science from idolatry and false absolutes.” Quantum physics is a place where both warnings matter.' }
  ], link: { href: 'faith.html#grimaldi-secchi', label: 'Read Grimaldi’s story on Faith and Physics' } },
  views: [
    { who: 'Niels Bohr', when: '1927 onward', says: 'Wave and particle are two complementary pictures, and an experiment shows one or the other, never both. Asking which slit the electron “really” used, without measuring, has no meaning.' },
    { who: 'Albert Einstein', when: 'as remembered by Abraham Pais', says: 'Physics should describe a world that is there whether or not we look. He once asked Pais whether he really believed the Moon exists only when he looks at it.' },
    { who: 'Werner Heisenberg', when: '1958', says: 'The quantum wave is like Aristotle’s “potentia”: a real tendency, something between a mere possibility and an actual fact. A measurement turns the tendency into a fact.' },
    { who: 'Hugh Everett', when: '1957', says: 'The wave never collapses. Every possible result happens, each in its own branch of reality, and we find ourselves in one of them.' },
    { who: 'Thomas Aquinas', when: '13th century, read today', says: 'Every change is a real potential becoming actual. Many Thomists today read the electron’s spread-out wave as real potency, and each dot on the screen as act.' }
  ],
  margin: {
    lead: 'Quantum physics is the most precisely tested theory we have. What stays open is not the numbers but what they mean.',
    rows: [
      { what: 'Wavelength of a 50,000-volt electron', value: '5.36 pm (in this tool)', range: 'Set by the voltage; λ = h/p is exact for a given speed', how: 'Tonomura’s team sent electrons one at a time and watched the bands build up dot by dot (1989)', enough: 'Predicting where every band falls. Not which spot the next single electron will hit.' },
      { what: 'Heaviest thing ever shown to interfere', value: 'Molecules of about 2,000 atoms, over 25,000 atomic mass units', range: 'Their wavelength was as small as 53 fm, far smaller than the molecules themselves (Fein and colleagues, 2019)', how: 'A 2-meter interferometer in a vacuum, kept free of gas so no molecule is bumped on the way', enough: 'Showing that size alone does not end quantum behavior. Isolation is what matters.' },
      { what: 'Band contrast with gas in the beam', value: 'Falls as more particles are hit', range: 'Each collision that records the path removes that particle from the bands (Hornberger and colleagues, 2003)', how: 'Letting small amounts of gas into a buckyball interferometer', enough: 'Explaining why a baseball, bumped by air and light all the time, never shows bands.' }
    ],
    note: 'Objective here means every lab gets the same pattern, within the noise of counting dots. Labs agree on the pattern; they disagree only about what it means.'
  }
}
});
