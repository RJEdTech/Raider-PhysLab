/* Test yourself questions for "What keeps it moving?" (forces story). Steps are 1-based story steps. */
TestYourself.mount({lab:'PhysLab',id:'forces',title:'Raider PhysLab · What keeps it moving?',el:'#ty',scrollTo:'#stagebox',go:i=>window.__story.go(i),
 questions:[
 {q:'A hockey puck slides across the ice after the stick leaves it. What sideways forces act on it now?',choices:['Only a small friction force, pointing backward','A forward push left over from the stick','A forward “force of motion” that keeps it going','No forces at all, so its speed stays the same'],answer:0,
  hint:'The stick’s push ends the instant it leaves the puck. Is anything still pushing forward?',step:2,stepName:'watch the hands',
  why:'Once the stick is gone, nothing pushes forward. Only a little friction acts, backward, so the puck slowly slows down.'},
 {q:'Two people push a box: 80 N to the right and 30 N to the left. The box slides right, and friction pushes 10 N against it. What is the net force?',answer:40,tol:.01,unit:'N',
  hint:v=>Math.abs(v-50)<.01?'Don’t forget friction. It pushes left too.':Math.abs(v-120)<.01?'Forces in opposite directions cancel. Subtract the ones pointing left.':'Line the arrows up tip to tail: 80 right, then 30 left and 10 left. What is left over?',step:3,stepName:'net force',
  why:'80 − 30 − 10 = 40 N to the right.'},
 {q:'A car drives at a steady 25 m/s on a straight, level highway. What is the net force on it?',choices:['Zero: the engine’s push matches friction and air','Forward: otherwise the car would slow down','Backward: air resistance is always winning','Downward: the car’s weight is the biggest force'],answer:0,
  hint:'Its speed is not changing. What was the net force when you held the cart’s speed line flat?',step:6,stepName:'hold it steady',
  why:'Steady speed means zero net force. The forward push only has to cancel friction and air, not keep the car moving.'},
 {q:'A net force of 30 N acts on a 10 kg cart. By how many m/s does its speed climb each second?',answer:3,tol:.01,unit:'m/s each second',
  hint:v=>Math.abs(v-300)<.01?'A bigger mass means less speed-up, so divide the force by the mass. Don’t multiply.':'Share the push across the mass: net force ÷ mass.',step:10,stepName:'more carts, same push',
  why:'a = F ÷ m = 30 ÷ 10 = 3 m/s every second.'},
 {q:'Far out in space, an astronaut lets go of a thrown wrench. What does the wrench do?',choices:['It keeps going at the same speed in a straight line','It slowly loses speed and comes to a stop','It keeps speeding up for as long as it moves','It curves around and drifts back to the astronaut'],answer:0,
  hint:'No friction, no air, almost no gravity. With zero net force, what does the speed line do?',step:9,stepName:'Voyager 1',
  why:'With no net force, its speed and direction never change. That is Newton’s first law, the same reason Voyager 1 keeps going.'}]});
