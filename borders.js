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
