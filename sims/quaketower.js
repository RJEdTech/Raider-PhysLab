(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,RM,axes}=BioLab.h;
/* Earthquake tower on a shake table (the Engineering Principles & Design Unit 3 build).
   The tower is one mass on a spring: m x'' + c x' + k x = −m·a_ground, x = sway of the top relative to the table.
   k comes from the bracing and the height (k ∝ 1/h³ for a frame of the same members); m is the load on top plus
   a share of the tower. Natural frequency f_n = (1/2π)√(k/m). The table shakes the base as A·sin(2πft).
   Steady sway ratio X/A = r² / √((1 − r²)² + (2ζr)²), with r = f/f_n. Values are scaled for a 60 cm classroom
   tower of balsa or spaghetti; a tower fails when the top sways more than 4 cm. */
const TOWER_M=0.15;                      /* kg of tower counted as moving with the top */
const K60={none:120,diag:480,x:1100};    /* N/m for a 60 cm tower */
const FAIL=0.04;                         /* m of top sway that breaks the joints */
const mass=p=>p.load+TOWER_M;
const stiff=p=>K60[p.brace]*Math.pow(60/p.h,3);
const zeta=p=>p.damp?0.15:0.03;
const fn=p=>Math.sqrt(stiff(p)/mass(p))/(2*Math.PI);
const ratio=p=>{const r=p.f/fn(p),z=zeta(p);return r*r/Math.sqrt(Math.pow(1-r*r,2)+Math.pow(2*z*r,2));};
const steady=p=>p.A/100*ratio(p);        /* m */

const SIM={
  id:'quaketower',hash:'quaketower',apUnit:6,order:3,tab:'Earthquake tower',kind:'Virtual lab',
  prereq:['springs'],next:['pendulum'],
  card:'Build a tower, put it on a shake table and find the shaking that wrecks it. Then brace it, lighten it or add a damper until it survives.',
  title:'Earthquake tower: resonance on a shake table',
  lede:{bio:'Every tower has a natural sway rate. Shake the ground at that same rate and the sway builds up until the tower breaks. Engineers make buildings stiffer, lighter or better damped so earthquakes can’t do that.',
        honors:'The tower acts like a mass on a spring with natural frequency f_n = (1/2π)√(k/m). Bracing raises k, load raises m, and resonance happens when the shaking frequency matches f_n.',
        ap:'Driven, damped oscillator: steady sway X = A·r²/√((1 − r²)² + (2ζr)²), r = f/f_n. Damping only matters near resonance, where it sets the peak height.'},
  scale:'A 60 cm classroom tower of balsa or spaghetti on a shake table. Sway is drawn 3× larger so you can see it. A tower fails when its top sways more than 4 cm from the table.',
  timeScale:1,dtMax:0.002,prewarm:0,sampleDt:0.03,window:8,unit:'s',chChange:1,chReveal:9,
  controls:[
    {id:'f',label:'Shake table frequency',type:'range',min:0.5,max:8,step:0.1,def:1.5,unit:' Hz',d:1,lvl:'bio',help:'Shakes per second. Real earthquakes shake hardest from about 0.5 to 10 Hz.'},
    {id:'brace',label:'Bracing',type:'seg',def:'none',lvl:'bio',options:[{v:'none',l:'No braces'},{v:'diag',l:'One diagonal'},{v:'x',l:'X-braces'}]},
    {id:'load',label:'Load on top',type:'range',min:0.1,max:2,step:0.05,def:0.5,unit:' kg',d:2,lvl:'bio'},
    {id:'h',label:'Tower height',type:'seg',def:60,lvl:'honors',options:[{v:40,l:'40 cm'},{v:60,l:'60 cm'},{v:80,l:'80 cm'}]},
    {id:'damp',label:'Add a damper',type:'toggle',def:false,lvl:'honors',help:'A sloshing water tank or rubber pads that soak up sway energy.'},
    {id:'A',label:'Shaking amplitude',type:'range',min:0.2,max:2,step:0.1,def:0.5,unit:' cm',d:1,lvl:'ap'}
  ],
  actions:[{id:'rebuild',label:'Rebuild the tower',primary:true,run(sim){BioLab.reset(sim);}}],
  init(){return {x:0,v:0,xg:0,broke:false,peak:0,pk:[]};},
  step(sim,dt){const p=sim.p,s=sim.st;if(s.broke){s.xg=0;return;}const w=2*Math.PI*p.f,A=p.A/100,m=mass(p),k=stiff(p),c=2*zeta(p)*Math.sqrt(k*m);
    const ag=-A*w*w*Math.sin(w*sim.t);s.xg=A*Math.sin(w*sim.t);
    const a=(-c*s.v-k*s.x)/m-ag;s.v+=a*dt;s.x+=s.v*dt;
    s.pk.push([sim.t,Math.abs(s.x)]);while(s.pk.length&&s.pk[0][0]<sim.t-2)s.pk.shift();s.peak=Math.max(...s.pk.map(q=>q[1]));
    if(Math.abs(s.x)>FAIL){s.broke=true;s.brokeT=sim.t;}},
  metrics:[
    {id:'fn',label:'Tower’s natural frequency',unit:'Hz',lvl:'bio',d:2,get:s=>fn(s.p)},
    {id:'f',label:'Shaking frequency',unit:'Hz',lvl:'bio',d:1,get:s=>s.p.f},
    {id:'sway',label:'Top sway right now',unit:'cm',lvl:'bio',d:1,min:-5,max:5,get:s=>s.st.broke?NaN:s.st.x*100},
    {id:'peak',label:'Biggest sway (last 2 s)',unit:'cm',lvl:'bio',d:1,min:0,max:5,get:s=>s.st.peak*100},
    {id:'status',label:'Tower',text:true,lvl:'bio',get:s=>s.st.broke?'Collapsed':s.st.peak>FAIL*0.6?'Swaying dangerously':'Standing'},
    {id:'r',label:'Shaking ÷ natural frequency',unit:'',lvl:'honors',d:2,get:s=>s.p.f/fn(s.p)},
    {id:'k',label:'Stiffness k',unit:'N/m',lvl:'honors',d:0,get:s=>stiff(s.p)},
    {id:'X',label:'Predicted steady sway',unit:'cm',lvl:'ap',d:2,get:s=>steady(s.p)*100}
  ],
  graphs:[{id:'sway',label:'Top sway',lines:['sway']},{id:'resp',label:'Sway vs. shaking frequency',lvl:'honors',custom:true}],
  defaultGraph:'sway',
  plot(sim,ctx,box){const p=sim.p;const ax=axes(ctx,box,{xmin:0,xmax:8,ymin:0,ymax:8,xl:'Shaking frequency (Hz)',yl:'Steady sway (cm)'});
    ctx.strokeStyle=PAL['s3'];ctx.lineWidth=2.5;ctx.beginPath();let first=true;
    for(let f=0.1;f<=8;f+=0.02){const X=Math.min(8,steady(Object.assign({},p,{f}))*100);const x=ax.X(f),y=ax.Y(X);first?ctx.moveTo(x,y):ctx.lineTo(x,y);first=false;}ctx.stroke();
    ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['rj'];ctx.beginPath();ctx.moveTo(box.L,ax.Y(FAIL*100));ctx.lineTo(box.L+box.W,ax.Y(FAIL*100));ctx.stroke();ctx.setLineDash([]);
    txt(ctx,'breaks above 4 cm',box.L+box.W-6,ax.Y(FAIL*100)-6,{s:12,w:700,c:PAL['rj'],a:'right'});
    ctx.fillStyle=PAL['rj'];ctx.beginPath();ctx.arc(ax.X(p.f),ax.Y(Math.min(8,steady(p)*100)),6,0,7);ctx.fill();},
  draw(sim,ctx,vdt,k,t){const p=sim.p,s=sim.st;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    const GY=380,SC=3000,xg=s.xg*SC,cx=330+xg,H=p.h/60*250,W=90,top=GY-H,sway=s.broke?0:s.x*SC*3;
    /* floor and shake table */
    ctx.fillStyle=PAL['cv-bench']||'#d9cdb8';ctx.fillRect(0,GY+28,800,450-GY-28);
    ctx.fillStyle='#5b616b';rr(ctx,200,GY+14,260,14,4);ctx.fill();
    ctx.fillStyle='#8a9099';rr(ctx,cx-130,GY,260,16,4);ctx.fill();
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(470,GY+8);ctx.lineTo(520,GY+8);ctx.stroke();txt(ctx,'shake table · '+p.f.toFixed(1)+' Hz',530,GY+12,{s:12*k,c:PAL['cv-soft']});
    if(s.broke){/* toppled frame */ctx.save();ctx.translate(cx-W/2,GY);ctx.rotate(-1.2);ctx.strokeStyle='#b08a52';ctx.lineWidth=5;ctx.strokeRect(0,-H,W,H);ctx.restore();
      ctx.fillStyle='#4d5560';rr(ctx,cx-W/2-H*0.93-30,GY-26,40,26,3);ctx.fill();
      pill(ctx,'Collapsed at t = '+(s.brokeT||0).toFixed(1)+' s: sway passed 4 cm',400,104,PAL['card2'],PAL['rj'],14*Math.min(k,1.3));}
    else{/* bent frame: columns curve from base to the swaying top */
      const n=6,col=(x0)=>{ctx.beginPath();for(let i=0;i<=n;i++){const u=i/n,y=GY-u*H,dx=sway*(3*u*u-2*u*u*u);i?ctx.lineTo(x0+dx,y):ctx.moveTo(x0+dx,y);}ctx.stroke();};
      ctx.strokeStyle='#b08a52';ctx.lineWidth=6;col(cx-W/2);col(cx+W/2);
      const lv=[0,0.5,1];ctx.lineWidth=4;lv.forEach(u=>{const dx=sway*(3*u*u-2*u*u*u),y=GY-u*H;ctx.beginPath();ctx.moveTo(cx-W/2+dx,y);ctx.lineTo(cx+W/2+dx,y);ctx.stroke();});
      if(p.brace!=='none'){ctx.lineWidth=3;ctx.strokeStyle='#8c6a3c';[[0,0.5],[0.5,1]].forEach(([a,b])=>{const da=sway*(3*a*a-2*a*a*a),db=sway*(3*b*b-2*b*b*b);ctx.beginPath();ctx.moveTo(cx-W/2+da,GY-a*H);ctx.lineTo(cx+W/2+db,GY-b*H);ctx.stroke();
        if(p.brace==='x'){ctx.beginPath();ctx.moveTo(cx+W/2+da,GY-a*H);ctx.lineTo(cx-W/2+db,GY-b*H);ctx.stroke();}});}
      /* load */const bw=40+p.load*24;ctx.fillStyle='#4d5560';rr(ctx,cx+sway-bw/2,top-26,bw,26,3);ctx.fill();txt(ctx,p.load.toFixed(2)+' kg',cx+sway,top-8,{s:12*k,w:700,c:'#fff',a:'center'});
      if(p.damp){ctx.fillStyle='rgba(70,130,200,.55)';rr(ctx,cx+sway-22,top+14,44,18,4);ctx.fill();txt(ctx,'damper',cx+sway,top+46,{s:11*k,c:PAL['cv-soft'],a:'center'});}
      /* sway gauge */ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(cx,top-40);ctx.lineTo(cx,GY);ctx.stroke();ctx.setLineDash([]);
      const pc=s.peak*100;pill(ctx,'Biggest sway: '+pc.toFixed(1)+' cm',640,90,PAL['card2'],pc>2.4?PAL['rj']:PAL['cv-ink'],13*Math.min(k,1.3));}
    pill(ctx,'Tower: '+fn(p).toFixed(2)+' Hz   ·   Shaking: '+p.f.toFixed(1)+' Hz',640,50,PAL['card2'],PAL['cv-ink'],13*Math.min(k,1.3));},
  narrate(sim){const p=sim.p,s=sim.st,r=p.f/fn(p);
    if(s.broke)return '<b>The tower collapsed.</b> The shaking at '+p.f.toFixed(1)+' Hz was close to the tower’s natural frequency of '+fn(p).toFixed(2)+' Hz, so every shake added to the sway until the joints failed. Brace it, change the load or add a damper, then press Rebuild.';
    if(r>0.85&&r<1.15)return '<b>Resonance:</b> the table shakes at almost exactly the rate the tower likes to sway, so each push lands at the right moment and the sway keeps growing.';
    if(r<0.85)return 'The shaking is slower than the tower’s natural sway rate ('+fn(p).toFixed(2)+' Hz). The tower mostly rides along with the table and barely bends.';
    return 'The shaking is faster than the tower can follow. The top stays nearly still while the base shakes under it, so the sway stays small.';},
  challenges:[
    {lvl:'bio',q:'The unbraced tower with 0.5 kg on top sways naturally at about 2.2 Hz. The table shakes at 1.5 Hz, then at 2.2 Hz. What happens at 2.2 Hz?',
     choices:['It sways about the same','It sways much more, maybe enough to collapse','It sways less, because faster shaking is gentler'],correct:1,
     baseline:{f:1.5,brace:'none',load:0.5},change:{f:2.2},changeText:'Shaking at 2.2 Hz',watch:'sway',at:1,reveal:9,
     explain:{bio:'Shaking at the tower’s own natural frequency is resonance: each shake adds to the sway, and the tower breaks. At 1.5 Hz the sway stays about half a centimeter.'}},
    {lvl:'bio',q:'The tower is collapsing at 2.2 Hz. You add X-braces and rebuild. What happens?',
     choices:['It still collapses','It survives: the braces make it stiffer, so its natural frequency moves far above 2.2 Hz','It survives only if you also add more load'],correct:1,
     baseline:{f:2.2,brace:'none',load:0.5},change:{brace:'x'},changeText:'X-braces added',watch:'sway',at:1,reveal:9,
     explain:{bio:'X-braces stop the frame from leaning, so it is about 9 times stiffer and its natural frequency jumps to about 6.5 Hz. Shaking at 2.2 Hz is now far from resonance and the sway stays tiny.'}},
    {lvl:'honors',q:'An X-braced tower survives 2.2 Hz. You pile more load on top. What happens to its natural frequency?',
     choices:['It goes up','It goes down','It stays the same'],correct:1,
     baseline:{f:2.2,brace:'x',load:0.3},change:{load:1.8},changeText:'Load raised to 1.8 kg',watch:'sway',at:1,reveal:9,
     explain:{honors:'f_n = (1/2π)√(k/m). More mass lowers f_n: from about 7.9 Hz to about 3.8 Hz here. Heavy floors on top bring a building’s natural frequency down toward the earthquake’s.'}},
    {lvl:'honors',q:'Taller towers built from the same sticks are…',
     choices:['stiffer, with a higher natural frequency','floppier, with a lower natural frequency','the same'],correct:1,instant:true,
     explain:{honors:'A frame’s stiffness drops roughly as 1/h³. The 80 cm tower is about 2.4 times floppier than the 60 cm one, so its natural frequency is about 1.5 times lower. Tall buildings sway slowly; short ones quickly.'}},
    {lvl:'ap',q:'Near resonance, adding a damper (ζ from 0.03 to 0.15) cuts the steady sway by about…',
     choices:['5×','No change','Half'],correct:0,instant:true,
     explain:{ap:'At r = 1 the steady ratio is 1/(2ζ): about 17 with ζ = 0.03 and about 3.3 with ζ = 0.15, about 5 times smaller. Away from resonance damping barely matters. Taipei 101 hangs a 660-tonne steel ball as a tuned mass damper.'}},
    {lvl:'ap',q:'Unbraced tower, 0.5 kg load (k = 120 N/m, moving mass 0.65 kg). What is f_n? Use f_n = (1/2π)√(k/m).',choices:['2.16 Hz','13.6 Hz','0.46 Hz','2.72 Hz'],correct:0,instant:true,
     explain:{ap:'√(120 ÷ 0.65) = 13.59 rad/s; ÷ 2π = 2.16 Hz.'}}
  ],
  tour:[
    {title:'A tower on a shake table',text:'This is the Unit 3 build: a 60 cm tower with a load on top, bolted to a table that shakes back and forth. First the table shakes slowly, 1.5 times a second.',pause:false,speed:1,setup(sim){BioLab.setValues(sim,{f:1.5,brace:'none',load:0.5,h:60,damp:false});BioLab.reset(sim);}},
    {title:'Every tower has its own sway rate',text:'Push the top and let go, and the tower would sway back and forth at its natural frequency, about 2.2 times a second for this one. The readout shows it.',focus:[480,20,310,110],speed:1},
    {title:'Resonance',text:'Now the table shakes at 2.2 Hz, the tower’s own rate. Each shake arrives just in time to add to the sway, like pushing a swing at the right moment. Watch the sway grow until the tower breaks.',speed:1,setup(sim){BioLab.setValues(sim,{f:2.2});BioLab.reset(sim);}},
    {title:'Make it stiffer',text:'X-braces keep the frame from leaning, which makes it much stiffer. Its natural frequency jumps to about 6.5 Hz, far from the 2.2 Hz shaking, so it survives.',speed:1,setup(sim){BioLab.setValues(sim,{brace:'x'});BioLab.reset(sim);}},
    {lvl:'honors',title:'Or add a damper',text:'Back to no braces, at resonance, with a damper added. The damper soaks up energy each sway, so the sway can’t build without limit. Real skyscrapers use tuned mass dampers and rubber base isolators.',speed:1,setup(sim){BioLab.setValues(sim,{brace:'none',damp:true});BioLab.reset(sim);}},
    {lvl:'ap',title:'The response curve',text:'Switch the graph to <b>Sway vs. shaking frequency</b>. The peak sits at r = f/f_n = 1, and its height is about 1/(2ζ) times the shaking amplitude.',pause:true,setup(sim){BioLab.setValues(sim,{damp:false});BioLab.reset(sim);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{f:1.5,brace:'none',load:0.5,h:60,damp:false,A:0.5});BioLab.reset(sim);},
  lab:{bio:'<p><b>Question:</b> At what shaking frequency does your tower fail?</p><ol><li>Keep no braces and 0.5 kg. Start at 1.0 Hz and record the biggest sway.</li><li>Raise the frequency by 0.2 Hz each trial (press Rebuild each time) up to 4 Hz.</li><li>Find the frequency where it collapses. Then add one diagonal and repeat.</li></ol><p>Write one sentence: what did the brace do to the dangerous frequency?</p>',
       honors:'<p><b>Question:</b> How do load and height change the natural frequency?</p><ol><li>With X-braces, record f_n for loads of 0.2, 0.5, 1.0 and 2.0 kg.</li><li>Repeat for the 40, 60 and 80 cm towers.</li></ol><p>Graph f_n vs. 1/√m. Explain the shape using f_n = (1/2π)√(k/m).</p>',
       ap:'<p><b>Question:</b> How much does damping help at resonance and away from it?</p><ol><li>Unbraced, 0.5 kg: record the steady sway at r = 0.5, 1.0 and 2.0 with and without the damper.</li></ol><p><b>CER:</b> Use X/A = r²/√((1 − r²)² + (2ζr)²) to explain why dampers matter only near resonance.</p>'},
  terms:[{t:'Natural frequency',d:'The rate at which a structure sways on its own after a push, in hertz (sways per second).'},{t:'Resonance',d:'Big, growing motion when something is pushed at its own natural frequency.'},{t:'Bracing',d:'Diagonal members that stop a frame from leaning, making it much stiffer.'},
    {lvl:'honors',t:'Stiffness (k)',d:'Force needed per meter of sway, in N/m. f_n = (1/2π)√(k/m).'},{lvl:'honors',t:'Damper',d:'A device that turns sway energy into heat, such as a tuned mass damper or rubber pads.'},{lvl:'ap',t:'Damping ratio (ζ)',d:'How strongly motion dies out. At resonance the sway is about 1/(2ζ) times the ground motion.'}],
  about:'<p><b>Model.</b> The tower is one mass on a spring with light damping: m x″ + c x′ + k x = −m·a_ground. The moving mass is the load plus 0.15 kg of tower; k is 120, 480 or 1100 N/m for a 60 cm tower with no braces, one diagonal or X-braces, scaled by (60/h)³ for other heights. Damping ratio 0.03 (0.15 with the damper). The tower fails when the top sways more than 4 cm. These values are illustrative for a classroom balsa or spaghetti tower, not measurements of a real structure. Real buildings have several sway modes; this model keeps only the first.</p><p><b>Real engineering.</b> Building codes require structures to resist the shaking expected where they stand. Taipei 101 uses a 660-tonne tuned mass damper. In the 1985 Mexico City earthquake, soft lakebed soil shook at about 2 seconds per cycle, and many mid-rise buildings with similar natural periods were damaged while shorter and taller ones fared better.</p>'
};
BioLab.register(SIM);
})();
