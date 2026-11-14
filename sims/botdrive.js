(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,RM,axes}=BioLab.h;
/* Program a two-motor robot by time (Robotics 1 Unit 1, the obstacle course).
   Differential drive: wheel speed v = (power/100)·(rpm/60)·πD, robot speed = (vL + vR)/2, turn rate ω = (vR − vL)/W.
   Program: forward for t1, spin left for t2, forward for t3, then stop. Field 3.0 m × 2.0 m, start at (0.3 m, 0.3 m)
   facing east, target square centered at (2.5 m, 1.5 m), 0.30 m on a side. Motor: 150 rpm at full power, wheels
   10 cm across, 30 cm between the wheels (illustrative classroom robot). */
const RPM=150,TRACK=0.30,SX=0.3,SY=0.3,TX=2.5,TY=1.5,HALF=0.15,FW=3,FH=2;
const PX=160,OX=40,OY=390;
const wv=(p,pow,side)=>(pow/100)*(RPM/60)*Math.PI*(p.wd/100)*(p.batt/100)*(side==='R'&&p.mis?0.98:1);
const fwd=p=>wv(p,100,'L');
const spin=p=>2*wv(p,p.tp,'L')/TRACK;                      /* rad/s when spinning in place */
const prog=p=>[{L:100,R:100,t:p.t1},{L:-p.tp,R:p.tp,t:p.t2},{L:100,R:100,t:p.t3}];
const totalT=p=>p.t1+p.t2+p.t3;
const ideal=p=>({t1:(TX-SX)/fwd(p),t2:(Math.PI/2)/spin(p),t3:(TY-SY)/fwd(p)});
const sx=x=>OX+x*PX,sy=y=>OY-y*PX;

const SIM={
  id:'botdrive',hash:'botdrive',apUnit:1,order:5,tab:'Program a robot',kind:'Virtual lab',
  prereq:['motion1d'],next:['circular','gears'],
  card:'Write a three-line timed program to drive a robot to the target square. Work out the times from speed = distance ÷ time.',
  title:'Program a robot: timing, speed and turns',
  lede:{bio:'Your robot only knows “run the motors at this power for this long.” To land in the target you need its speed: time = distance ÷ speed.',
        honors:'Spinning in place, the wheels run opposite ways and the robot turns at ω = 2v/W. Small differences between the two motors make it drift, which is why real robots use sensors.',
        ap:'Dead reckoning: the pose (x, y, heading) is the integral of the wheel speeds. Errors in speed or heading grow with time and distance.'},
  scale:'Field 3.0 m × 2.0 m (one grid square = 0.5 m). Robot: 10 cm wheels, 30 cm apart, 150 rpm motors at full power (an illustrative classroom robot).',
  timeScale:1,dtMax:0.005,prewarm:0,sampleDt:0.05,window:10,unit:'s',chChange:0.4,chReveal:9,
  controls:[
    {id:'t1',label:'Line 1: forward at 100% for',type:'range',min:0,max:5,step:0.05,def:2,unit:' s',d:2,lvl:'bio'},
    {id:'t2',label:'Line 2: spin left for',type:'range',min:0,max:2,step:0.05,def:0.5,unit:' s',d:2,lvl:'bio'},
    {id:'t3',label:'Line 3: forward at 100% for',type:'range',min:0,max:5,step:0.05,def:1,unit:' s',d:2,lvl:'bio'},
    {id:'tp',label:'Spin power',type:'seg',def:50,lvl:'honors',options:[{v:25,l:'25%'},{v:50,l:'50%'},{v:100,l:'100%'}]},
    {id:'mis',label:'Right motor 2% weaker',type:'toggle',def:false,lvl:'honors',help:'No two motors are exactly alike.'},
    {id:'wd',label:'Wheel diameter',type:'seg',def:10,lvl:'ap',options:[{v:8,l:'8 cm'},{v:10,l:'10 cm'},{v:12,l:'12 cm'}]},
    {id:'batt',label:'Battery charge (motor speed)',type:'range',min:70,max:100,step:5,def:100,unit:'%',lvl:'ap'}
  ],
  actions:[{id:'run',label:'Run the program',primary:true,run(sim){BioLab.reset(sim);}},{id:'solve',label:'Show working times',run(sim){const I=ideal(sim.p);BioLab.setValues(sim,{t1:Math.round(I.t1*20)/20,t2:Math.round(I.t2*20)/20,t3:Math.round(I.t3*20)/20});BioLab.reset(sim);}}],
  init(){return {x:SX,y:SY,h:0,done:false,trail:[[SX,SY]],out:false};},
  step(sim,dt){const p=sim.p,s=sim.st;if(s.done)return;let t=sim.t,acc=0,cmd=null;for(const c of prog(p)){if(t<acc+c.t){cmd=c;break;}acc+=c.t;}
    if(!cmd){s.done=true;return;}const vL=wv(p,cmd.L,'L'),vR=wv(p,cmd.R,'R'),v=(vL+vR)/2,w=(vR-vL)/TRACK;
    s.h+=w*dt;s.x+=v*Math.cos(s.h)*dt;s.y+=v*Math.sin(s.h)*dt;
    if(s.x<0.1||s.x>FW-0.1||s.y<0.1||s.y>FH-0.1){s.out=true;s.done=true;s.x=clamp(s.x,0.1,FW-0.1);s.y=clamp(s.y,0.1,FH-0.1);}
    const L=s.trail[s.trail.length-1];if(Math.hypot(L[0]-s.x,L[1]-s.y)>0.01)s.trail.push([s.x,s.y]);},
  metrics:[
    {id:'v',label:'Robot speed at 100%',unit:'m/s',lvl:'bio',d:3,get:s=>fwd(s.p)},
    {id:'turn',label:'Spin rate',unit:'°/s',lvl:'bio',d:0,get:s=>spin(s.p)*180/Math.PI},
    {id:'miss',label:'Distance from the target center',unit:'m',lvl:'bio',d:2,min:0,max:3,get:s=>Math.hypot(s.st.x-TX,s.st.y-TY)},
    {id:'result',label:'Result',text:true,lvl:'bio',get:s=>!s.st.done?'Running…':s.st.out?'Hit the wall':(Math.abs(s.st.x-TX)<=HALF&&Math.abs(s.st.y-TY)<=HALF)?'In the target!':'Missed the target'},
    {id:'head',label:'Heading',unit:'°',lvl:'honors',d:1,get:s=>s.st.h*180/Math.PI},
    {id:'x',label:'x position',unit:'m',lvl:'ap',d:2,get:s=>s.st.x},
    {id:'y',label:'y position',unit:'m',lvl:'ap',d:2,get:s=>s.st.y}
  ],
  graphs:[{id:'miss',label:'Distance to target',lines:['miss']},{id:'head',label:'Heading',lvl:'honors',lines:['head']}],
  defaultGraph:'miss',
  draw(sim,ctx,vdt,k,t){const p=sim.p,s=sim.st;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    /* field and grid */
    ctx.fillStyle='#dfe6df';ctx.fillRect(sx(0),sy(FH),FW*PX,FH*PX);ctx.strokeStyle='rgba(60,80,60,.18)';ctx.lineWidth=1;
    for(let x=0;x<=FW;x+=0.5){ctx.beginPath();ctx.moveTo(sx(x),sy(0));ctx.lineTo(sx(x),sy(FH));ctx.stroke();}
    for(let y=0;y<=FH;y+=0.5){ctx.beginPath();ctx.moveTo(sx(0),sy(y));ctx.lineTo(sx(FW),sy(y));ctx.stroke();}
    ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=3;ctx.strokeRect(sx(0),sy(FH),FW*PX,FH*PX);
    for(let x=0;x<=FW;x+=1)txt(ctx,x+' m',sx(x),sy(0)+16,{s:11*k,c:PAL['cv-soft'],a:'center'});
    /* target */ctx.fillStyle='rgba(200,16,46,.15)';ctx.fillRect(sx(TX-HALF),sy(TY+HALF),2*HALF*PX,2*HALF*PX);ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2.5;ctx.strokeRect(sx(TX-HALF),sy(TY+HALF),2*HALF*PX,2*HALF*PX);
    txt(ctx,'target',sx(TX),sy(TY+HALF)-6,{s:12*k,w:700,c:PAL['rj'],a:'center'});
    /* start */ctx.strokeStyle=PAL['cv-soft'];ctx.setLineDash([4,4]);ctx.strokeRect(sx(SX-0.15),sy(SY+0.15),0.3*PX,0.3*PX);ctx.setLineDash([]);txt(ctx,'start',sx(SX),sy(SY)+36,{s:11*k,c:PAL['cv-soft'],a:'center'});
    /* trail */ctx.strokeStyle='#3b4f6b';ctx.lineWidth=2;ctx.beginPath();s.trail.forEach((q,i)=>i?ctx.lineTo(sx(q[0]),sy(q[1])):ctx.moveTo(sx(q[0]),sy(q[1])));ctx.lineTo(sx(s.x),sy(s.y));ctx.stroke();
    /* robot: 30 cm square body, wheels on the sides */
    ctx.save();ctx.translate(sx(s.x),sy(s.y));ctx.rotate(-s.h);const b=0.3*PX/2;ctx.fillStyle='#3b4f6b';rr(ctx,-b,-b,2*b,2*b,5);ctx.fill();
    ctx.fillStyle='#1f2329';ctx.fillRect(-b*0.6,-b-6,b*1.2,7);ctx.fillRect(-b*0.6,b-1,b*1.2,7);ctx.fillStyle='#ffd34d';ctx.beginPath();ctx.moveTo(b,0);ctx.lineTo(b-10,-7);ctx.lineTo(b-10,7);ctx.closePath();ctx.fill();ctx.restore();
    /* code panel */const X0=548,Y0=70;ctx.fillStyle=PAL['card2']||'#fff';rr(ctx,X0,Y0,240,170,8);ctx.fill();ctx.strokeStyle=PAL['line']||'#ccc';ctx.lineWidth=1;ctx.stroke();
    txt(ctx,'Your program',X0+12,Y0+20,{s:13*k,w:700});
    const ms=v=>Math.round(v*1000);let acc=0,cur=-1;prog(p).forEach((c,i)=>{if(sim.t>=acc&&sim.t<acc+c.t&&!s.done)cur=i;acc+=c.t;});
    const lines=['setMotors(100, 100);  wait('+ms(p.t1)+');','setMotors('+(-p.tp)+', '+p.tp+');  wait('+ms(p.t2)+');','setMotors(100, 100);  wait('+ms(p.t3)+');','setMotors(0, 0);'];
    lines.forEach((l,i)=>{if(i===cur||(i===3&&s.done)){ctx.fillStyle='rgba(255,211,77,.45)';ctx.fillRect(X0+6,Y0+34+i*28,228,24);}txt(ctx,l,X0+12,Y0+51+i*28,{s:12*k,w:600,f:'IBM Plex Mono, monospace'});});
    txt(ctx,'setMotors(left %, right %) · wait(ms)',X0+12,Y0+160,{s:10.5*k,c:PAL['cv-soft']});
    const R=SIM.metrics[3].get(sim);pill(ctx,R,X0+120,Y0+200,PAL['card2'],R==='In the target!'?PAL['g-line']||'#1e7d3a':R==='Running…'?PAL['cv-ink']:PAL['rj'],14*Math.min(k,1.3));},
  narrate(sim){const p=sim.p,s=sim.st,I=ideal(p);
    if(!s.done)return 'The robot follows each line of the program for exactly the time you set, then moves to the next. It doesn’t know where it is: it just runs the motors.';
    if(s.out)return '<b>Hit the wall.</b> One of the times is too long. At full power the robot covers '+fwd(p).toFixed(3)+' m every second.';
    const ok=Math.abs(s.x-TX)<=HALF&&Math.abs(s.y-TY)<=HALF;
    return ok?'<b>In the target.</b> Forward '+(TX-SX).toFixed(1)+' m at '+fwd(p).toFixed(3)+' m/s takes '+I.t1.toFixed(2)+' s; a 90° spin at '+(spin(p)*180/Math.PI).toFixed(0)+'°/s takes '+I.t2.toFixed(2)+' s; then '+(TY-SY).toFixed(1)+' m takes '+I.t3.toFixed(2)+' s.'
      :'Missed by '+Math.hypot(s.x-TX,s.y-TY).toFixed(2)+' m. Work out each time: time = distance ÷ speed for driving, and time = 90° ÷ spin rate for turning.';},
  challenges:[
    {lvl:'bio',q:'At full power the robot moves 0.785 m every second. How long should line 1 run to drive the 2.2 m from the start to below the target?',choices:['2.80 s','1.73 s','2.20 s','3.50 s'],correct:0,instant:true,
     explain:{bio:'time = distance ÷ speed = 2.2 ÷ 0.785 = 2.80 s. In code that is wait(2800).'}},
    {lvl:'bio',q:'The robot spins at 150° per second. How long should line 2 run for a 90° left turn?',choices:['0.60 s','0.90 s','1.50 s','0.15 s'],correct:0,instant:true,
     explain:{bio:'90° ÷ 150°/s = 0.60 s.'}},
    {lvl:'bio',q:'Your robot stopped 0.3 m short of the target on the last straight. What should you change?',choices:['Make line 3 longer by about 0.38 s','Make line 2 longer','Use less power on line 1'],correct:0,instant:true,
     explain:{bio:'0.3 m ÷ 0.785 m/s ≈ 0.38 s more on line 3. Fix one line at a time and test again: that is how real robot code gets tuned.'}},
    {lvl:'honors',q:'The program works, then you switch on “Right motor 2% weaker.” What happens?',choices:['Nothing','The robot curves to the right and misses','It goes faster'],correct:1,
     baseline:{t1:2.8,t2:0.6,t3:1.55,tp:50,mis:false},change:{mis:true},changeText:'Right motor 2% weaker',watch:'miss',at:0.3,reveal:9,
     explain:{honors:'A slower right wheel turns the robot clockwise a little the whole time it drives. Over the first 2.8 s the heading drifts about 8°, the turn comes up short, and the robot ends about 0.28 m from the target center. Sensors (a gyro or line follower) fix what timing alone can’t.'}},
    {lvl:'honors',q:'You raise the spin power from 50% to 100%. How long should the 90° turn take now?',choices:['0.30 s','0.60 s','1.20 s'],correct:0,instant:true,
     explain:{honors:'Twice the wheel speed doubles the spin rate to 300°/s, so 90° takes 0.30 s. Faster turns are harder to stop exactly, though.'}},
    {lvl:'ap',q:'The battery drops so the motors run at 85% speed. A program tuned on a full battery now…',choices:['undershoots every straight and turn by about 15%','still works','overshoots'],correct:0,instant:true,
     explain:{ap:'Every distance and angle scales with speed × time. That is why competition robots measure wheel rotations with encoders instead of trusting time.'}}
  ],
  tour:[
    {title:'The obstacle-course problem',text:'The robot starts in the dashed square facing right. Your program has three lines: drive forward, spin left, drive forward. Each line runs the motors for a set time.',pause:true,setup(sim){BioLab.setValues(sim,{t1:2,t2:0.5,t3:1,tp:50,mis:false,wd:10,batt:100});BioLab.reset(sim);}},
    {title:'Guessing doesn’t work',text:'These times were guessed: 2 s, 0.5 s, 1 s. Watch the robot stop short and turn too little.',speed:1},
    {title:'Measure the speed',text:'At full power the wheels turn 150 times a minute. Each turn rolls π × 10 cm = 31.4 cm, so the robot goes 2.5 × 0.314 = 0.785 m every second.',pause:true,focus:[548,60,240,190]},
    {title:'Compute each time',text:'Straight: 2.2 m ÷ 0.785 m/s = 2.80 s. Turn: 90° ÷ 150°/s = 0.60 s. Straight again: 1.2 m ÷ 0.785 m/s = 1.53 s. Run it.',speed:1,setup(sim){BioLab.setValues(sim,{t1:2.8,t2:0.6,t3:1.55});BioLab.reset(sim);}},
    {lvl:'honors',title:'Real motors aren’t identical',text:'Make the right motor 2% weaker and run the same program. The robot curves and misses. That is why robots use sensors to correct themselves.',speed:1,setup(sim){BioLab.setValues(sim,{mis:true});BioLab.reset(sim);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{t1:2,t2:0.5,t3:1,mis:false});BioLab.reset(sim);},
  lab:{bio:'<p><b>Question:</b> Can you reach the target on your first try?</p><ol><li>Read <b>Robot speed at 100%</b> and <b>Spin rate</b>.</li><li>Measure the distances on the grid (each square is 0.5 m) and compute all three times before you run.</li><li>Run it. If you miss, change one line at a time.</li></ol>',
       honors:'<p><b>Question:</b> How much do small motor differences matter?</p><ol><li>With your working program, turn on the weaker right motor. Record how far you miss.</li><li>Try to correct it by adjusting the times.</li></ol><p>Explain why timing alone can never fully fix drift.</p>',
       ap:'<p><b>Question:</b> How do wheel size and battery change dead reckoning?</p><ol><li>Record the miss distance for each wheel size and for 100%, 85% and 70% battery with the same program.</li></ol><p><b>CER:</b> Explain why measuring wheel rotations (encoders) beats measuring time.</p>'},
  terms:[{t:'Program',d:'A list of instructions the robot follows in order.'},{t:'Dead reckoning',d:'Working out where you are from speed, direction and time, without looking.'},{t:'Spin turn',d:'Wheels turn in opposite directions so the robot turns in place.'},
    {lvl:'honors',t:'Drift',d:'Slow, unwanted turning caused by small differences between the motors.'},{lvl:'ap',t:'Encoder',d:'A sensor that counts wheel rotations, so distance comes from turns instead of time.'}],
  about:'<p><b>Model.</b> Wheel speed = (power ÷ 100) × 150 rpm × πD × battery fraction, with the right wheel 2% slower when that option is on. The robot moves at the average wheel speed and turns at (v_right − v_left) ÷ 0.30 m. Motors start and stop instantly and the wheels never slip, which real robots don’t quite manage. The code panel uses simple made-up commands, not a particular kit’s library.</p>'
};
BioLab.register(SIM);
})();
