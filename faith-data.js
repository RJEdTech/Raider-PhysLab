/* Raider PhysLab: Faith and Physics (data for faith.html).
   True stories where physics meets the Catholic, Jesuit tradition, in the order Physics teaches the units.
   Each story: id, unit {label, href}, title, story (HTML), numbers[] (each with its source link), concept {title, html},
   hook {prompt, parts[{label, answer, tol, unit}], worked}, hides {title, html}, reflect (an open question, never scored), related[{href, label}].
   Rules (teach, don't preach): the student does the math; every number has a source; Catholic and Jesuit sources are named as sources,
   and the reflection is a question, not a verdict; honest history stays in; no em dashes. */
window.RAIDER_FAITH = [
 {
  "id": "riccioli-g",
  "unit": {"label": "Unit 1: Motion and free fall", "href": "index.html#freefall"},
  "title": "Two Jesuits, a 97-meter tower and one of the first measurements of g",
  "story": "In the 1640s two Jesuits in Bologna, Giovanni Battista Riccioli and Francesco Maria Grimaldi, dropped clay balls from the Torre degli Asinelli, the city's tallest tower. They timed each fall with pendulums they had calibrated against the stars, and Riccioli reported the results in his <i>Almagestum Novum</i> (1651). Their data matched Galileo's rule for falling bodies.",
  "numbers": [
   "In equal times a falling ball covered 10, 30, 50, 70 and 90 Roman feet: the odd numbers 1, 3, 5, 7, 9 (<a href=\"https://arxiv.org/abs/1204.3267\" target=\"_blank\" rel=\"noopener\">Graney, translation of Riccioli's 1651 report, arXiv 2012</a>).",
   "The same ball fell the full 280 Roman feet of the tower in 26 pendulum strokes, 4 1/3 seconds (<a href=\"https://arxiv.org/abs/1204.3267\" target=\"_blank\" rel=\"noopener\">Graney 2012</a>).",
   "One Roman foot is commonly given as 0.296 m. Graney's fit to four independent measurements gives g = 29.8 Roman feet/s², about 9% below the accepted value (<a href=\"https://arxiv.org/abs/1204.3267\" target=\"_blank\" rel=\"noopener\">Graney 2012</a>)."
  ],
  "concept": {"title": "Free fall: d = ½gt²", "html": "Dropped from rest, an object falls d = ½gt². Distance grows with the square of the time, so in equal time intervals the distances go 1, 3, 5, 7, 9: add them up and you get 1, 4, 9, 16, 25, the perfect squares. Solve for g: <b>g = 2d/t²</b>."},
  "hook": {
   "prompt": "Use Riccioli's full-tower drop. (a) Change 280 Roman feet to meters. (b) Find g from d = ½gt² with t = 4 1/3 s. (c) By what percent is his g below 9.8 m/s²?",
   "parts": [
    {"label": "(a) Height of the drop", "answer": 82.88, "tol": 0.15, "unit": "m"},
    {"label": "(b) Riccioli's g", "answer": 8.83, "tol": 0.06, "unit": "m/s²"},
    {"label": "(c) Percent below 9.8 m/s²", "answer": 9.9, "tol": 0.4, "unit": "%"}
   ],
   "worked": "(a) 280 × 0.296 = 82.88 m. (b) g = 2d/t² = 2(82.88) ÷ (4.333)² = 165.76 ÷ 18.78 = 8.83 m/s². (c) (9.8 − 8.83) ÷ 9.8 × 100 = 9.9%. Graney's fit to all four independent drops gives about the same answer."
  },
  "hides": {"title": "Honest history", "html": "Riccioli measured carefully but argued against a moving Earth: his book also lists dozens of arguments for a stationary Earth (<a href=\"https://arxiv.org/abs/1107.3483\" target=\"_blank\" rel=\"noopener\">Graney, arXiv 2011</a>). He worked in a Church that had condemned Galileo in 1633. In 1992 Pope John Paul II told the Pontifical Academy of Sciences that Galileo's judges had erred (<a href=\"https://www.vaticanobservatory.org/wp-content/uploads/2017/01/Galileo_ed._McMullin.pdf\" target=\"_blank\" rel=\"noopener\">Coyne, Vatican Observatory</a>). Part of the 9% gap may come from the unit: nobody knows exactly how long Riccioli's foot was (<a href=\"https://physicstoday.aip.org/letters/revisiting-ricciolis-free-fall-calculations-1760033755509\" target=\"_blank\" rel=\"noopener\">Physics Today letters, 2013</a>)."},
  "reflect": "Riccioli's careful data supported Galileo's rule for falling bodies, even though Riccioli disagreed with Galileo about whether Earth moves. What does it take to report data that support someone you disagree with?",
  "related": [{"href": "index.html#freefall", "label": "Free fall and bouncing"}, {"href": "index.html#motion1d", "label": "Motion in one dimension"}]
 },
 {
  "id": "stopping-distance",
  "unit": {"label": "Unit 3: Forces and friction", "href": "index.html#friction"},
  "title": "Friction, Colorado ice and the people in your car",
  "story": "Every RJ driver will brake on ice. How far a car slides depends on friction, and how hard a crash is on a passenger depends on Newton's laws. Seat belts are one of the great safety successes of the last 50 years.",
  "numbers": [
   "Tires on a dry road: coefficient of friction about 0.7; on a wet road about 0.4 (<a href=\"https://hyperphysics.gsu.edu/hbase/mechanics/frictire.html\" target=\"_blank\" rel=\"noopener\">HyperPhysics, Georgia State University</a>). Rubber sliding on ice: about 0.15 (The Physics Factbook, as cited in <a href=\"https://digitaleditions.walsworth.com/article/Worldwide/374173/36347/article.html\" target=\"_blank\" rel=\"noopener\">Tribology &amp; Lubrication Technology, May 2010</a>).",
   "Lap and shoulder belts reduce the risk of fatal injury to front-seat car occupants by 45% (<a href=\"https://www.transportation.gov/briefing-room/nhtsa3116\" target=\"_blank\" rel=\"noopener\">NHTSA, 2016</a>).",
   "Seat belts saved an estimated 13,941 lives in 2015 and about 345,000 lives from 1975 to 2015 (<a href=\"https://www.transportation.gov/briefing-room/seat-belt-use-us-reaches-historic-90-percent\" target=\"_blank\" rel=\"noopener\">NHTSA, 2016</a>)."
  ],
  "concept": {"title": "Friction stops the car; the belt stops you", "html": "Braking on a level road, friction is the net force: μmg = ma, so a = μg and the braking distance is <b>d = v²/(2μg)</b>. Mass cancels. In a crash, the belt and the car's crumple zone stretch your stop over more distance, so the average force on you, <b>F = mv²/(2d)</b>, is much smaller than if you hit the dashboard."},
  "hook": {
   "prompt": "A car moves at 25 m/s (about 56 mph). (a) Find its braking distance on a dry road (μ = 0.7). (b) Find it on ice (μ = 0.15). (c) A 60 kg passenger in a crash at 25 m/s stops over 0.50 m thanks to the belt and crumple zone. Find the average force on the passenger.",
   "parts": [
    {"label": "(a) Braking distance, dry", "answer": 45.6, "tol": 0.4, "unit": "m"},
    {"label": "(b) Braking distance, ice", "answer": 212.6, "tol": 2, "unit": "m"},
    {"label": "(c) Average force on the passenger", "answer": 37500, "tol": 300, "unit": "N"}
   ],
   "worked": "(a) d = v²/(2μg) = 625 ÷ (2 × 0.7 × 9.8) = 45.6 m. (b) 625 ÷ (2 × 0.15 × 9.8) = 212.6 m, almost five times as far. (c) F = mv²/(2d) = 60 × 625 ÷ 1.0 = 37,500 N. Stopping in 5 cm against a dashboard would mean 10 times that force."
  },
  "hides": {"title": "What these numbers leave out", "html": "Braking distance is only part of stopping distance. Before your foot hits the brake, your reaction time (measure yours in the Free Fall lab) adds distance at full speed: 1.5 s at 25 m/s is another 37.5 m. Real μ changes with tires, temperature and anti-lock brakes. The 45% figure is for front-seat car occupants; NHTSA gives different numbers for light trucks."},
  "reflect": "RJ's Graduate at Graduation profile describes a graduate who is “Loving” and “Committed to Doing Justice.” Does physics like this have anything to say about how you drive when other people are in your car or on the road? Explain your view.",
  "related": [{"href": "index.html#friction", "label": "Friction"}, {"href": "index.html#forces", "label": "Forces and Newton's laws"}, {"href": "index.html#impulse", "label": "Impulse"}]
 },
 {
  "id": "moon-names",
  "unit": {"label": "Unit 4: Universal gravitation", "href": "index.html#gravity"},
  "title": "A Jesuit map of the Moon, and Newton's test of gravity",
  "story": "The names on today's Moon maps come from a 1651 map drawn by Grimaldi and named by Riccioli. Apollo 11 landed in the Sea of Tranquility, a name first printed on their map. Newton later used the Moon to test his law of universal gravitation, and you can repeat his test.",
  "numbers": [
   "Riccioli's naming system, published with Grimaldi's map in 1651, is the one still in use; Mare Tranquillitatis first appeared there (<a href=\"https://www.lindahall.org/about/news/scientist-of-the-day/francesco-maria-grimaldi/\" target=\"_blank\" rel=\"noopener\">Linda Hall Library</a>).",
   "35 Jesuit scientists are listed in the National Air and Space Museum catalog of about 1,600 named points on the Moon (<a href=\"https://mathshistory.st-andrews.ac.uk/BEA/grimaldi_bea.pdf\" target=\"_blank\" rel=\"noopener\">Biographical Encyclopedia of Astronomers, Grimaldi</a>).",
   "The Moon orbits at a mean distance of 384,400 km once every 27.32 days (<a href=\"https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html\" target=\"_blank\" rel=\"noopener\">NASA Moon fact sheet</a>); Earth's mean radius is 6,371 km (<a href=\"https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html\" target=\"_blank\" rel=\"noopener\">NASA Earth fact sheet</a>)."
  ],
  "concept": {"title": "Newton's Moon test", "html": "If the same gravity that drops an apple holds the Moon, it must weaken as 1/r². The Moon is about 60 Earth radii away, so gravity there should be about 9.8 ÷ 60² m/s². The Moon's circular motion tells you its actual acceleration: <b>v = 2πr/T</b> and <b>a = v²/r</b>. If the two agree, one law explains both."},
  "hook": {
   "prompt": "(a) Find the Moon's orbital speed in m/s. (b) Find its centripetal acceleration a = v²/r, in units of 10⁻³ m/s². (c) Find g at the Moon's distance, 9.8 × (6,371 ÷ 384,400)², in units of 10⁻³ m/s².",
   "parts": [
    {"label": "(a) Orbital speed", "answer": 1023, "tol": 4, "unit": "m/s"},
    {"label": "(b) Centripetal acceleration", "answer": 2.72, "tol": 0.03, "unit": "× 10⁻³ m/s²"},
    {"label": "(c) Earth's gravity at the Moon's distance", "answer": 2.69, "tol": 0.03, "unit": "× 10⁻³ m/s²"}
   ],
   "worked": "(a) T = 27.32 × 86,400 = 2,360,448 s; v = 2π(3.844 × 10⁸) ÷ 2,360,448 = 1,023 m/s. (b) a = 1,023² ÷ 3.844 × 10⁸ = 0.00272 m/s². (c) 9.8 × (6,371 ÷ 384,400)² = 0.00269 m/s². They agree to about 1%: the force that drops an apple also bends the Moon's path."
  },
  "hides": {"title": "Honest history", "html": "So many Jesuits are on the Moon partly because a Jesuit wrote the naming system (<a href=\"https://the-moon.us/wiki/Nomenclature-Jesuits\" target=\"_blank\" rel=\"noopener\">The Moon wiki</a>). Riccioli rejected a moving Earth, yet he gave some of the most striking craters to Copernicus and Kepler, whose ideas he argued against (<a href=\"https://www.lindahall.org/about/news/scientist-of-the-day/francesco-maria-grimaldi/\" target=\"_blank\" rel=\"noopener\">Linda Hall Library</a>)."},
  "reflect": "Riccioli named major craters after scientists he disagreed with. Why might honoring good work by people you disagree with matter, in science or anywhere else?",
  "related": [{"href": "index.html#gravity", "label": "Gravity and orbits (try Moon and tides)"}, {"href": "index.html#circular", "label": "Circular motion"}]
 },
 {
  "id": "lemaitre-vatt",
  "unit": {"label": "Unit 4: Gravitation and the cosmos", "href": "index.html#gravity"},
  "title": "A priest's expanding universe, and the Vatican's telescope in Arizona",
  "story": "In 1927 Fr. Georges Lemaître, a Belgian Catholic priest and physicist, published the idea that the universe is expanding, two years before Edwin Hubble's famous paper. In 2018 the world's astronomers voted to rename Hubble's law the Hubble–Lemaître law. Today Jesuit astronomers of the Vatican Observatory do research with a telescope on Mount Graham, Arizona.",
  "numbers": [
   "IAU members voted to recommend renaming the Hubble law the Hubble–Lemaître law; the vote closed October 26, 2018 (<a href=\"https://iau.org/news/pressreleases/detail/iau1812\" target=\"_blank\" rel=\"noopener\">IAU press release</a>).",
   "4,060 members voted: 78% in favor, 20% against (<a href=\"https://www.heraldmalaysia.com/news/astronomers-recommend-renaming-hubbles-law-to-honour-belgian-priest/45013/2\" target=\"_blank\" rel=\"noopener\">CNA via Herald Malaysia, 2018</a>).",
   "The Vatican Advanced Technology Telescope (VATT) on Mount Graham was dedicated in 1993 (<a href=\"https://www.vaticanobservatory.org/?p=69\" target=\"_blank\" rel=\"noopener\">Vatican Observatory</a>); its main mirror is 1.83 m across (<a href=\"https://www.arizonahighways.com/archive/issues/chapter/Doc.1477.Chapter.7\" target=\"_blank\" rel=\"noopener\">Arizona Highways</a>)."
  ],
  "concept": {"title": "Why telescopes are big", "html": "A telescope collects light over the area of its mirror, πr². Area grows with the <b>square</b> of the diameter, so a mirror 10 times wider collects 100 times the light. Your dark-adapted pupil is about 7 mm across."},
  "hook": {
   "prompt": "(a) How many times more light does the VATT's 1.83 m mirror collect than a 7 mm pupil? (b) How many of the 4,060 IAU voters voted in favor (78%)?",
   "parts": [
    {"label": "(a) Light-gathering ratio", "answer": 68345, "tol": 700, "unit": "times"},
    {"label": "(b) Votes in favor", "answer": 3167, "tol": 3, "unit": "votes"}
   ],
   "worked": "(a) Ratio of areas = (1.83 ÷ 0.007)² = 261.4² ≈ 68,300. (b) 0.78 × 4,060 = 3,167 votes."
  },
  "hides": {"title": "What this story leaves out", "html": "Not every historian liked the rename: one argued that the observed relationship is Hubble's and the cosmic expansion is Lemaître's (<a href=\"https://aleteia.org/2018/10/30/big-bang-theory-renamed-to-give-credit-to-catholic-astronomer\" target=\"_blank\" rel=\"noopener\">Aleteia, 2018</a>). The vote is a recommendation, not a rule. Pupil size varies from person to person; 7 mm is a typical dark-adapted value."},
  "reflect": "A Vatican Observatory astronomer described science and faith in his life this way: “for us there is no conflict, no tension” (<a href=\"https://www.americamagazine.org/?p=158827\" target=\"_blank\" rel=\"noopener\">America, CNS</a>). Other people see science and faith as separate, or in tension. What do you think, and why?",
  "related": [{"href": "index.html#gravity", "label": "Gravity and orbits"}, {"href": "index.html#lenses", "label": "Lenses and mirrors"}]
 },
 {
  "id": "grimaldi-secchi",
  "unit": {"label": "Unit 8: Light", "href": "index.html#color"},
  "title": "Grimaldi names diffraction; Secchi sorts the stars by their light",
  "story": "Grimaldi was arguably the first to study carefully how light spreads around the edges of objects, and he gave the effect its name: diffraction. Two centuries later Fr. Angelo Secchi, SJ, director of the Roman College Observatory, was the first to classify stars by their spectra, the colors in their light.",
  "numbers": [
   "Grimaldi coined the word “diffraction”; his book on light was published in 1665, after his death (<a href=\"https://www.vaticanobservatory.org/?p=179829\" target=\"_blank\" rel=\"noopener\">Vatican Observatory, 2019</a>).",
   "Secchi directed the Roman College Observatory from 1850 until his death in 1878 (<a href=\"https://www.vaticanobservatory.org/?p=69\" target=\"_blank\" rel=\"noopener\">Vatican Observatory</a>) and was the first to classify stars by their spectra (<a href=\"https://catholicreview.org/science-and-the-stars-a-call-to-the-spiritual-says-vatican-astrophysicist/\" target=\"_blank\" rel=\"noopener\">Catholic Review, 2025</a>).",
   "The Sun's effective surface temperature is 5,772 K (<a href=\"https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html\" target=\"_blank\" rel=\"noopener\">NASA Sun fact sheet</a>)."
  ],
  "concept": {"title": "A star's color tells its temperature", "html": "A hot object glows brightest at a wavelength that shrinks as it gets hotter (Wien's law): <b>λ<sub>max</sub> = (2.898 × 10⁻³ m·K) ÷ T</b>. Then use c = fλ and E = hf, as in your EM spectrum lab (c = 3.00 × 10⁸ m/s, h = 4.14 × 10⁻¹⁵ eV·s)."},
  "hook": {
   "prompt": "For the Sun (T = 5,772 K): (a) find λ<sub>max</sub> in nm, (b) its frequency in units of 10¹⁴ Hz, (c) the energy of one photon in eV.",
   "parts": [
    {"label": "(a) Peak wavelength", "answer": 502, "tol": 2, "unit": "nm"},
    {"label": "(b) Frequency", "answer": 5.97, "tol": 0.05, "unit": "× 10¹⁴ Hz"},
    {"label": "(c) Photon energy", "answer": 2.47, "tol": 0.03, "unit": "eV"}
   ],
   "worked": "(a) 2.898 × 10⁻³ ÷ 5,772 = 5.02 × 10⁻⁷ m = 502 nm, blue-green light near the middle of the visible band. (b) f = c/λ = 3.00 × 10⁸ ÷ 5.02 × 10⁻⁷ = 5.97 × 10¹⁴ Hz. (c) E = hf = 4.14 × 10⁻¹⁵ × 5.97 × 10¹⁴ = 2.47 eV."
  },
  "hides": {"title": "Honest history", "html": "Grimaldi published no work under his own name in his lifetime; his experiments appeared in Riccioli's books, with credit (<a href=\"https://mathshistory.st-andrews.ac.uk/Biographies/Grimaldi/\" target=\"_blank\" rel=\"noopener\">MacTutor, St Andrews</a>). Secchi's classes were later replaced by the O, B, A, F, G, K, M system astronomers use today. The Sun looks white, not green: it gives off a broad mix of colors, and the peak is only where it is brightest."},
  "reflect": "Grimaldi did much of the hardest work in his partnership with Riccioli, and his own book appeared only after he died. How should a team share credit for discoveries?",
  "related": [{"href": "index.html#color", "label": "Color and the EM spectrum"}, {"href": "index.html#waves", "label": "Waves"}, {"href": "index.html#photoelectric", "label": "Photoelectric effect"}]
 },
 {
  "id": "nobel-2026-icecube",
  "unit": {"label": "Nobel Prize in Physics 2026", "href": "index.html#refraction"},
  "title": "2026 Nobel Prize: a telescope made of Antarctic ice",
  "story": "The 2026 Nobel Prize in Physics went to Francis Halzen of the University of Wisconsin–Madison for IceCube, which uses the ice under the South Pole to catch neutrinos, nearly massless particles that pass through almost everything. When one does hit an atom in the ice, the particles it makes give off a faint flash of blue light.",
  "numbers": [
   "Halzen won “for decisive contributions to the IceCube Neutrino Observatory and the discovery of high-energy neutrinos of astrophysical origin” (<a href=\"https://nobelprize.org/prizes/physics/2026/summary\" target=\"_blank\" rel=\"noopener\">NobelPrize.org</a>).",
   "5,160 optical sensors on 86 strings watch about a cubic kilometer of ice (<a href=\"https://www.rsi.ch/s/4139435\" target=\"_blank\" rel=\"noopener\">RSI, Oct 2026</a>), installed about 1,450 to 2,450 m deep (<a href=\"https://www.berliner-zeitung.de/article/10464762\" target=\"_blank\" rel=\"noopener\">Berliner Zeitung, Oct 2026</a>).",
   "Deep in the clear ice, light travels with a refractive index of about 1.31 (<a href=\"https://www.laserfocusworld.com/detectors-imaging/news/55409835/2026-nobel-prize-in-physics-goes-to-francis-halzen-for-icecube-neutrino-observatory\" target=\"_blank\" rel=\"noopener\">Laser Focus World, Oct 2026</a>)."
  ],
  "concept": {"title": "Faster than light, in ice", "html": "Nothing beats light in a vacuum, but light slows down in a material: <b>v = c/n</b>. A charged particle moving faster than light does <i>in the ice</i> makes a shock wave of blue light, called Cherenkov radiation, a little like a sonic boom. Density ρ = m/V lets you find how much ice that is."},
  "hook": {
   "prompt": "(a) Ice has a density of about 917 kg/m³. Find the mass of 1 km³ of ice, in units of 10¹¹ kg. (b) Find the speed of light in the deep ice, in units of 10⁸ m/s. (c) How many sensors are on each string?",
   "parts": [
    {"label": "(a) Mass of the ice", "answer": 9.17, "tol": 0.05, "unit": "× 10¹¹ kg"},
    {"label": "(b) Speed of light in the ice", "answer": 2.29, "tol": 0.02, "unit": "× 10⁸ m/s"},
    {"label": "(c) Sensors per string", "answer": 60, "tol": 0.5, "unit": "sensors"}
   ],
   "worked": "(a) 1 km³ = 10⁹ m³; m = ρV = 917 × 10⁹ = 9.17 × 10¹¹ kg, close to a trillion kilograms. (b) v = c/n = 3.00 × 10⁸ ÷ 1.31 = 2.29 × 10⁸ m/s. (c) 5,160 ÷ 86 = 60."
  },
  "hides": {"title": "What this story leaves out", "html": "For every neutrino from space, IceCube records about a trillion particles made in Earth's own atmosphere, which have to be sorted out (<a href=\"https://www.wunc.org/2026-10-06/the-2026-nobel-prize-in-physics-has-gone-to-a-neutrino-detector-in-antarctica\" target=\"_blank\" rel=\"noopener\">NPR, Oct 2026</a>). The prize names one person, but hundreds of researchers built and run IceCube."},
  "reflect": "Halzen told the Nobel committee that at first people called IceCube “a cute idea that won't work” (<a href=\"https://www.wunc.org/2026-10-06/the-2026-nobel-prize-in-physics-has-gone-to-a-neutrino-detector-in-antarctica\" target=\"_blank\" rel=\"noopener\">NPR</a>). What helps a person keep working on an idea that others doubt? When should they stop?",
  "related": [{"href": "index.html#refraction", "label": "Refraction"}, {"href": "index.html#relativity", "label": "Relativity"}]
 },
 {
  "id": "nobel-2025-quantum",
  "unit": {"label": "Nobel Prize in Physics 2025", "href": "index.html#photoelectric"},
  "title": "2025 Nobel Prize: quantum physics in a circuit you can hold",
  "story": "The 2025 Nobel Prize in Physics went to John Clarke, Michel Devoret and John Martinis. In 1984 and 1985 they showed that a whole electric circuit made of superconductors can behave like a single quantum particle: it tunnels through barriers and absorbs or gives off energy only in fixed amounts. The Nobel committee says their work opened the way to new quantum technology, including quantum computers.",
  "numbers": [
   "The prize was “for the discovery of macroscopic quantum mechanical tunnelling and energy quantisation in an electric circuit” (<a href=\"https://www.nobelprize.org/prizes/physics/2025/press-release/\" target=\"_blank\" rel=\"noopener\">Nobel press release, Oct 7, 2025</a>).",
   "The experiments were done in 1984 and 1985, with superconductors separated by a thin insulating layer, a Josephson junction (<a href=\"https://www.nobelprize.org/prizes/physics/2025/press-release/\" target=\"_blank\" rel=\"noopener\">Nobel press release</a>)."
  ],
  "concept": {"title": "Energy comes in packets", "html": "A system that is quantized can only absorb or emit energy in steps. For light, one step is one photon: <b>E = hf</b>, with h = 4.14 × 10⁻¹⁵ eV·s. Microwave photons carry far less energy than visible ones, which is why these circuits must be kept extremely cold."},
  "hook": {
   "prompt": "(a) Find the energy of one microwave photon at 5.0 GHz, in units of 10⁻⁵ eV. (b) A visible photon carries about 2.5 eV. How many times more energy is that than the microwave photon?",
   "parts": [
    {"label": "(a) Microwave photon energy", "answer": 2.07, "tol": 0.02, "unit": "× 10⁻⁵ eV"},
    {"label": "(b) Visible ÷ microwave", "answer": 120800, "tol": 2500, "unit": "times"}
   ],
   "worked": "(a) E = hf = 4.14 × 10⁻¹⁵ × 5.0 × 10⁹ = 2.07 × 10⁻⁵ eV. (b) 2.5 ÷ 2.07 × 10⁻⁵ ≈ 121,000 times."
  },
  "hides": {"title": "What this story leaves out", "html": "The 5.0 GHz frequency here is an example for practice, not a number from the laureates' experiment. The prize came about 40 years after the experiments, which is common for Nobel Prizes."},
  "reflect": "The laureates' work was basic research: they wanted to know how big a quantum system can be. Forty years later it helps build quantum computers. How should a society decide what research to pay for when nobody knows what it will lead to?",
  "related": [{"href": "index.html#photoelectric", "label": "Photoelectric effect"}, {"href": "index.html#circuit", "label": "Circuits"}]
 },
 {
  "id": "fratello-sole",
  "unit": {"label": "Work, energy and power", "href": "index.html#power"},
  "title": "Brother Sun: a solar farm for the Vatican",
  "story": "In 2024 Pope Francis ordered the construction of an agrivoltaic plant, solar panels over land that is still farmed, at the Vatican's site at Santa Maria di Galeria near Rome. The letter is named <i>Fratello Sole</i> (“Brother Sun”) after a line in St. Francis of Assisi's Canticle of the Creatures.",
  "numbers": [
   "The plant is meant to power Vatican Radio's transmitters there and the “complete energy sustenance” of Vatican City State (<a href=\"https://www.vaticannews.va/en/pope/news/2024-06/pope-orders-construction-of-agrivoltaic-plant-for-the-vatican.html\" target=\"_blank\" rel=\"noopener\">Vatican News, June 2024</a>).",
   "The Santa Maria di Galeria property covers 424 hectares (<a href=\"https://ansa.it/english/news/2024/06/26/vatican-is-to-be-solar-powered_4dc9dfb5-37cf-4013-9418-c9badab9087c.html\" target=\"_blank\" rel=\"noopener\">ANSA, June 2024</a>); the letter did not give the size of the plant (<a href=\"https://reneweconomy.com.au/vatican-to-install-solar-farm-on-farmland-in-defiance-of-italy-ban/\" target=\"_blank\" rel=\"noopener\">RenewEconomy, 2024</a>).",
   "<i>Fratello Sole</i> roots the decision in the call of Pope Francis's 2015 encyclical <i>Laudato si'</i> to change lifestyles and reduce the use of fossil fuels (<a href=\"https://www.vaticannews.va/en/pope/news/2024-06/pope-orders-construction-of-agrivoltaic-plant-for-the-vatican.html\" target=\"_blank\" rel=\"noopener\">Vatican News</a>)."
  ],
  "concept": {"title": "Power and energy", "html": "Power is energy per time: <b>P = E/t</b>, in watts. A solar panel's output is the sunlight striking it times its area times its efficiency: <b>P = (irradiance)(area)(efficiency)</b>. Energy in kilowatt-hours = power in kilowatts × hours."},
  "hook": {
   "prompt": "Assume full sunlight of 1,000 W/m² and panels that are 20% efficient. (a) Find the peak power from 1 hectare (10,000 m²) of panels, in MW. (b) If it averages the equivalent of 5 hours of full sun a day, how much energy is that per day, in MWh? (c) How many square meters is the whole 424-hectare site?",
   "parts": [
    {"label": "(a) Peak power from 1 hectare", "answer": 2.0, "tol": 0.02, "unit": "MW"},
    {"label": "(b) Energy per day", "answer": 10, "tol": 0.1, "unit": "MWh"},
    {"label": "(c) Area of the site", "answer": 4240000, "tol": 1000, "unit": "m²"}
   ],
   "worked": "(a) 1,000 W/m² × 10,000 m² × 0.20 = 2,000,000 W = 2.0 MW. (b) 2.0 MW × 5 h = 10 MWh. (c) 424 × 10,000 = 4,240,000 m². The whole site is not covered in panels; the size of the plant was not announced."
  },
  "hides": {"title": "What this story leaves out", "html": "1,000 W/m² and 20% are round assumptions for practice. Clouds, night, dust and panel angle all cut real output. Italy restricted new ground-mounted solar on farmland in 2024; agrivoltaics tries to keep the land farmed under the panels (<a href=\"https://reneweconomy.com.au/vatican-to-install-solar-farm-on-farmland-in-defiance-of-italy-ban/\" target=\"_blank\" rel=\"noopener\">RenewEconomy, 2024</a>)."},
  "reflect": "Farmland can grow food, hold solar panels, or try to do both. <i>Laudato si'</i> is subtitled “On Care for Our Common Home” (<a href=\"https://www.vatican.va/content/francesco/en/encyclicals/documents/papa-francesco_20150524_enciclica-laudato-si.html\" target=\"_blank\" rel=\"noopener\">vatican.va</a>). What would you weigh in deciding how a piece of land should be used?",
  "related": [{"href": "index.html#power", "label": "Power"}, {"href": "index.html#skatepark", "label": "Energy skate park"}]
 }
];
