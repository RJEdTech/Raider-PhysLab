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
