/* Test yourself questions for "What makes it turn?" (circular motion and gravity story). Steps are 1-based story steps. */
TestYourself.mount({lab:'PhysLab',id:'circular',title:'Raider PhysLab · What makes it turn?',el:'#ty',scrollTo:'#stagebox',go:i=>window.__story.go(i),
 questions:[
 {q:'A hammer thrower spins and lets go of the hammer. Which way does it fly?',choices:['Straight off in the direction it was moving at that instant','Straight outward, away from the center','Along the circle for a while, then straight','Back toward the thrower'],answer:0,
  hint:'Once nothing pulls it toward the center, it keeps the speed and direction it had at that moment.',step:2,stepName:'the car on the ice',
  why:'With the pull gone, it goes straight along the direction it was already moving, along the edge of the circle.'},
 {q:'On a spinning merry-go-round, what keeps you moving in a circle?',choices:['Your hands pulling you toward the center','A force pushing you outward','Your own speed','Nothing: circles need no force'],answer:0,
  hint:'To turn, something has to push or pull toward the center. On the road it was friction. What does it here?',step:3,stepName:'what makes it turn',
  why:'Your hands pull you toward the center, the centripetal force. Let go, and you head off straight.'},
 {q:'A car takes a curve of radius 50 m at 10 m/s. What is its acceleration toward the center? (a = v² ÷ r)',answer:2,tol:.01,unit:'m/s each second',
  hint:v=>Math.abs(v-.2)<.01?'Square the speed first: 10 × 10 = 100. Then divide by the radius.':'a = v² ÷ r = 10 × 10 ÷ 50.',step:5,stepName:'the velocity circle',
  why:'100 ÷ 50 = 2 m/s every second, always toward the center.'},
 {q:'A driver takes the same curve 3 times as fast. How much harder must the road push?',choices:['3 times as hard','6 times as hard','9 times as hard','Just as hard'],answer:2,
  hint:'In the story, twice the speed needed 4 times the push. The push grows with the square of the speed.',step:6,stepName:'twice the speed',
  why:'3 × 3 = 9 times the push. That is why ice and speed together send cars wide.'},
 {q:'Why do astronauts float inside the Space Station?',choices:['They and the station are falling around the Earth together','There is no gravity 400 km up','The station’s engines hold them up','Space has no air, so nothing pulls on them'],answer:0,
  hint:'Gravity up there is 89% of what you feel now. So why don’t they press against the floor?',step:9,stepName:'the Space Station',
  why:'Everything in the station falls together, so nothing presses on the floor. They are in orbit: falling around the Earth, not away from gravity.'}]});
