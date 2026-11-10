# Raider PhysLab

Interactive physics simulations and virtual labs for Regis Jesuit Physics, Honors Physics, AP Physics 1 and AP Physics C. It is the physics companion to [Raider BioLab](https://rjedtech.github.io/Raider-BioLab/) and runs on the same engine.

**Live site:** https://rjedtech.github.io/Raider-PhysLab/

## Browse by course
The home page has a **Browse** switch. **By topic** groups the 35 tools into 12 physics topics, plus Science skills and Go further. Each course option lists tools in the order that course teaches them; the order comes from the courses' Canvas modules:

- **Physics:** 1D motion → 2D motion and projectiles → Forces → Circular motion and gravity → Work, power and energy → Momentum → Waves and sound → Light and optics
- **Honors Physics:** the same path, plus graphing and linearizing, pulleys, springs, pendulums, and a circuits and electricity unit
- **AP Physics 1:** Kinematics → Force and translational dynamics → Work, energy and power → Linear momentum → Torque and rotation → Rotating systems → Oscillations → Fluids
- **AP Physics C:**
  - Fall: Mechanics
  - Spring: Electrostatics → Potential and capacitance → Circuits → Magnetism and induction

Each course list ends with **Go further** tools: rocket science, chaos and the double pendulum, special relativity, and the photoelectric effect.

## What every tool has
- **Detail switch (Big picture / Closer look / Deep dive):** the same model underneath, with more parts named and more math as you go deeper. Big picture fits Physics, Closer look fits Honors, Deep dive fits AP Physics 1 and C.
- **Measurement tools on the animation:**
  - rulers, stopwatches, photogates and protractors
  - strobe or motion-diagram dots
  - click-to-mark points
  - frame stepping
  - students collect their own data and fit it
- **Walk me through it:** a guided, slowed-down tour.
- **Slow motion (down to 0.1×) and Step.**
- **Live caption:** says what is happening and why.
- **Predict, then test:** challenges where students commit to a prediction before the model runs.
- **Investigation prompt and data table:** a data table with CSV export for lab write-ups.

Link straight to any tool with `#<name>`, e.g. `#projectile`, `#circuit` or `#skatepark`.

## Virtual labs
A **Virtual lab** view runs an RJ teacher's own handout on a virtual bench: students read the instruments, record their own data, graph it, answer the handout's questions and turn in a PDF or Word report. Physics (Mr. Colella, first semester):
- **Motion Match Lab, Parts 1 and 2** (`#motion1d`): steer a walker in front of a motion detector to match position and velocity graphs.
- **Motion Lab: Carts on Ramps** (`#motion1d`): three ramp angles, down only and up-then-down, read from the detector's data.
- **Free Fall Labs #1 and #2 with GUESS** (`#freefall`): your own reaction time with a meter stick, then a hand-timed balcony drop.
- **Tennis Ball Launch Lab** (`#projectile`): calibrate the launcher, then hit a target at an assigned angle and speed.
- **F = ma Cart and Pulley Lab** (`#atwood`): acceleration against force and against mass, from linear fits of the velocity graph.

## Pages
- `news.html`: In the News, good-news stories with the physics and a math question.
- `faith.html`: Faith and Physics, true stories where physics meets the Catholic, Jesuit tradition (Riccioli and Grimaldi, the Moon's names, Lemaître, Secchi, this year's Nobel Prizes, the Vatican's solar farm), each with sourced facts, a math question, honest history and an open question for reflection. Also linked from the Physics and Honors Physics course units.

## Files
- `index.html`: page shell
- `biolab.css`: styles (shared with BioLab)
- `engine.js`: the shared lab bench
- `courses.js`: topic sections, course pathways and teaching order
- `bench.js`: shared helpers for the virtual-lab benches (stopwatch, instrument readouts, hooks)
- `sims/*.js`: one file per tool
- `faith-data.js`, `news-data.js`: data for the two story pages

See `ENGINE.md` to add a tool.

## Privacy
Static files only. Everything runs in the browser, with no logins and no data collection. Trial data stays in the student's own browser.

The models are simplified for instruction; each tool's "About this model" section lists its assumptions.

## License

© 2026 Jason Beyer, RJ Ed Tech. Licensed under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/): free to share and adapt for non-commercial use with credit. See [LICENSE](LICENSE).
