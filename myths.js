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
