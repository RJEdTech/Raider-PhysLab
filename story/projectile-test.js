/* Test yourself questions for "Where do you let go?" (projectile story). Steps are 1-based story steps. */
TestYourself.mount({lab:'PhysLab',id:'projectile',title:'Raider PhysLab · Where do you let go?',el:'#ty',scrollTo:'#stagebox',go:i=>window.__story.go(i),
 questions:[
 {q:'A ball rolls off a table at 2 m/s. At the same instant, another ball is dropped from the same height. Which reaches the floor first?',choices:['Both at the same time','The ball that rolled off','The ball that was dropped','The heavier one'],answer:0,
  hint:'The sideways motion and the falling motion happen separately. Does moving sideways change how fast a ball falls?',step:5,stepName:'the race',
  why:'Both start with no downward speed and fall the same way, so they land together. The rolling ball just lands farther away.'},
 {q:'A plane flying at 50 m/s drops a package that falls for 4 seconds. Ignoring air, how far forward does the package travel before it lands?',answer:200,tol:.01,unit:'m',
  hint:'Sideways, nothing pushes the package, so it keeps the plane’s 50 m/s for the whole fall. Distance = speed × time.',step:4,stepName:'two motions at once',
  why:'50 m/s × 4 s = 200 m. The sideways motion is steady the whole time.'},
 {q:'A stone dropped from a cliff takes 3 seconds to hit the water. How far did it fall? (Its speed grows 9.8 m/s every second.)',answer:44.1,tol:.2,unit:'m',
  hint:v=>Math.abs(v-88.2)<.2?'88.2 m is the box, 29.4 tall and 3 wide. Falling makes a triangle under the line, so take half.':'Its downward speed climbs to 9.8 × 3 = 29.4 m/s. The distance is the triangle under that line: ½ × 3 × 29.4.',step:6,stepName:'box and triangle',
  why:'½ × 3 s × 29.4 m/s = 44.1 m.'},
 {q:'Ignoring air, how does a dropped bag move as seen by the crew looking down from the plane?',choices:['Straight down, right below the plane','Backward, falling behind the plane','Forward, ahead of the plane','In a curve away from the plane'],answer:0,
  hint:'In every flash the bag was right under the plane. Do the plane and the bag have the same sideways speed?',step:3,stepName:'always under the plane',
  why:'The bag keeps the plane’s sideways speed, so from the plane it only falls. From the ground, the same motion looks like a curve.'},
 {q:'Why does a thrown ball’s path bend into a curve?',choices:['Its sideways speed stays the same while its downward speed grows','Air pushes it forward faster than it can fall','Its sideways speed slowly runs out as it falls','Gravity pulls it backward as well as down'],answer:0,
  hint:'Look at the two speed arrows: which one changes, and which one stays the same?',step:7,stepName:'speed as arrows',
  why:'The blue sideways arrow stays the same; the red downward arrow grows. Added tip to tail, they point more and more downward, so the path bends.'}]});
