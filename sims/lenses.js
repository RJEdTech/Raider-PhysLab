(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,FONT,axes,legend}=BioLab.h;

/* ======================================================================
   Mirrors and lenses. Thin-lens / mirror equation 1/f = 1/dₒ + 1/dᵢ,
   m = −dᵢ/dₒ, with paraxial principal rays. Real-is-positive signs.
   ====================================================================== */
const PPC=6, VPC=12, AY=228;                         // 6 px/cm along the axis; heights drawn 2× (12 px/cm)                                   // 6 px per cm; optical axis
const LX=430, MX=570;                                  // lens and mirror positions
const MYST_F=18;
const ELS={conv:'Converging lens',div:'Diverging lens',concave:'Concave mirror',convex:'Convex mirror',plane:'Plane mirror',myst:'Mystery lens'};
const isMirror=p=>p.el==='concave'||p.el==='convex'||p.el==='plane';
const EX=p=>isMirror(p)?MX:LX;
function fEff(p){if(p.el==='plane')return Infinity;if(p.el==='myst')return MYST_F;return (p.el==='div'||p.el==='convex')?-p.f:p.f;}
function image(p){const f=fEff(p),dO=p.dobj;let di;
  if(!Number.isFinite(f))di=-dO;else{const q=1/f-1/dO;di=Math.abs(q)<1e-6?NaN:1/q;}
  const m=Number.isFinite(di)?-di/dO:NaN;return {f,di,m,real:di>0,h:m*p.h};}
function imgX(p,di){return isMirror(p)?EX(p)-di*PPC:EX(p)+di*PPC;}
function typeText(im){if(!Number.isFinite(im.di))return 'No image (rays leave parallel)';
  const a=Math.abs(im.m);return (im.real?'Real':'Virtual')+', '+(im.m<0?'inverted':'upright')+', '+(Math.abs(a-1)<0.02?'same size':a>1?'larger':'smaller');}
const SCENES={magnifier:{label:'Magnifying glass',v:{el:'conv',f:12,dobj:7}},camera:{label:'Camera or eye',v:{el:'conv',f:6,dobj:55}},projector:{label:'Projector',v:{el:'conv',f:10,dobj:12}},makeup:{label:'Makeup mirror',v:{el:'concave',f:20,dobj:10}},car:{label:'Car side mirror',v:{el:'convex',f:20,dobj:45}}};
function scene(sim,k){const sc=SCENES[k];const v=Object.assign({},sc.v);if(k==='camera'||k==='projector'){const q=1/v.f-1/v.dobj;v.screen=true;v.scr=Math.round(clamp(1/q,3,60)*2)/2;}BioLab.setValues(sim,v);sim.st.scene=k;}
function sceneOn(sim){const k=sim.st.scene;if(!k)return null;const v=SCENES[k].v;for(const id in v)if(sim.p[id]!==v[id])return null;return SCENES[k].label;}

const LENSES={
  id:'lenses',hash:'lenses',apUnit:9,order:2,kind:'Virtual lab',tab:'Mirrors and lenses',
  card:'Trace the principal rays through lenses and off mirrors. Find real images on a screen and test 1/f = 1/dₒ + 1/dᵢ.',
  title:'Mirrors and lenses',
  lede:{bio:'Move a candle in front of a lens or mirror. Follow three special rays to find where the image forms and what it looks like.',
        honors:'Use ray diagrams and the thin-lens equation 1/f = 1/dₒ + 1/dᵢ to predict image distance and magnification, then check with the screen.',
        ap:'Find an unknown focal length from object and image distances, use sign conventions for virtual images and diverging elements, and connect focal length to lens power.'},
  scale:'Distances along the bench are to scale (6 pixels per cm, ruler in cm). Heights are drawn twice as tall so the rays are easy to see; this stretch does not move where the rays cross.',
  timeless:true,animated:true,chChange:1.2,chReveal:3,
  controls:[
    {id:'el',label:'Lens or mirror',type:'select',def:'conv',lvl:'bio',options:[{v:'conv',l:'Converging lens'},{v:'div',l:'Diverging lens'},{v:'concave',l:'Concave mirror'},{v:'convex',l:'Convex mirror',lvl:'honors'},{v:'plane',l:'Plane mirror'},{v:'myst',l:'Mystery lens',lvl:'ap'}]},
    {id:'f',label:'Focal length',type:'range',min:5,max:30,step:0.5,def:15,unit:' cm',d:1,lvl:'bio',help:'Distance from the lens or mirror to its focal point F.'},
    {id:'dobj',label:'Object distance',type:'range',min:3,max:60,step:0.5,def:40,unit:' cm',d:1,lvl:'bio',help:'Click on the bench to move the candle.'},
    {id:'h',label:'Candle height',type:'range',min:2,max:10,step:0.5,def:6,unit:' cm',d:1,lvl:'honors'},
    {id:'rays',label:'Principal rays',type:'seg',def:'3',lvl:'bio',options:[{v:'0',l:'None'},{v:'1',l:'Ray 1'},{v:'2',l:'Rays 1–2'},{v:'3',l:'All 3'}]},
    {id:'screen',label:'Screen',type:'toggle',def:false,lvl:'bio',help:'A card to catch real images'},
    {id:'scr',label:'Screen distance',type:'range',min:3,max:60,step:0.5,def:24,unit:' cm',d:1,lvl:'bio'},
    {id:'ruler',label:'Ruler',type:'toggle',def:true,lvl:'bio',noTrial:true},
    {id:'virt',label:'Show traced-back (virtual) rays',type:'toggle',def:true,lvl:'bio',noTrial:true}
  ],
  actions:[
    {id:'magnifier',label:'Magnifying glass',lvl:'bio',run(sim){scene(sim,'magnifier');}},
    {id:'camera',label:'Camera or eye',lvl:'bio',run(sim){scene(sim,'camera');}},
    {id:'projector',label:'Projector',lvl:'bio',run(sim){scene(sim,'projector');}},
    {id:'makeup',label:'Makeup mirror',lvl:'bio',run(sim){scene(sim,'makeup');}},
    {id:'car',label:'Car side mirror',lvl:'honors',run(sim){scene(sim,'car');}},
    {id:'snap',label:'Move screen to the image',lvl:'bio',run(sim){const im=image(sim.p);if(im.real&&im.di<=60)BioLab.setValues(sim,{screen:true,scr:Math.round(im.di*2)/2});else BioLab.setValues(sim,{screen:true});}}
  ],
  init(){return {ph:0,scene:null};},
  step(sim,dt){sim.st.ph+=dt;},
  metrics:[
    {id:'dobj',label:'Object distance dₒ',unit:'cm',lvl:'bio',min:0,max:60,d:1,get:s=>s.p.dobj},
    {id:'fl',label:'Focal length f',unit:'cm',lvl:'bio',min:-30,max:30,d:1,get:s=>{const f=fEff(s.p);if(!Number.isFinite(f)||s.p.el==='myst')return NaN;return atLeast('honors')?f:Math.abs(f);}},
    {id:'di',label:'Image distance dᵢ',unit:'cm',lvl:'bio',min:-60,max:60,d:1,get:s=>{const im=image(s.p);return atLeast('honors')?im.di:Math.abs(im.di);}},
    {id:'hi',label:'Image height',unit:'cm',lvl:'bio',min:-30,max:30,d:1,get:s=>{const im=image(s.p);return atLeast('honors')?im.h:Math.abs(im.h);}},
    {id:'type',label:'Image',text:true,lvl:'bio',get:s=>typeText(image(s.p))},
    {id:'m',label:'Magnification m',unit:'',lvl:'honors',min:-5,max:5,d:2,get:s=>image(s.p).m},
    {id:'sum',label:'1/dₒ + 1/dᵢ',unit:'1/cm',lvl:'honors',min:-0.4,max:0.4,d:4,get:s=>{const im=image(s.p);return Number.isFinite(im.di)?1/s.p.dobj+1/im.di:NaN;}},
    {id:'invf',label:'1/f',unit:'1/cm',lvl:'honors',min:-0.4,max:0.4,d:4,get:s=>s.p.el==='myst'?NaN:(s.p.el==='plane'?0:1/fEff(s.p))},
    {id:'power',label:'Power',unit:'diopters',lvl:'ap',min:-20,max:20,d:1,get:s=>s.p.el==='myst'?NaN:(s.p.el==='plane'?0:100/fEff(s.p))}
  ],
  graphs:[
    {id:'thin',label:'Image distance vs object distance',lvl:'bio',custom:true},
    {id:'mag',label:'Image size vs object distance',lvl:'bio',custom:true},
    {id:'recip',label:'1/dᵢ vs 1/dₒ',lvl:'honors',custom:true}
  ],
  defaultGraph:'thin',
  plot(sim,ctx,box,id){const p=sim.p,f=fEff(p),im=image(p),hon=atLeast('honors');
    const di=d=>{if(!Number.isFinite(f))return -d;const q=1/f-1/d;return Math.abs(q)<1e-6?NaN:1/q;};
    const line=(ax,fn,x0,x1,col,lim)=>{ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.beginPath();let st=false,prev=null;for(let i=0;i<=300;i++){const x=x0+(x1-x0)*i/300,y=fn(x);if(!Number.isFinite(y)||Math.abs(y)>lim){st=false;prev=null;continue;}if(prev!==null&&Math.sign(prev)!==Math.sign(y)&&Math.abs(prev-y)>lim/2)st=false;const X=ax.X(x),Y=ax.Y(y);st?ctx.lineTo(X,Y):ctx.moveTo(X,Y);st=true;prev=y;}ctx.stroke();};
    const dot=(ax,x,y,lim)=>{if(!Number.isFinite(y)||Math.abs(y)>lim)return;ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.arc(ax.X(x),ax.Y(y),6,0,6.29);ctx.fill();};
    ctx.save();const clip=()=>{ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();};
    if(id==='thin'){const ax=axes(ctx,box,{xmin:0,xmax:60,ymin:-60,ymax:100,xl:'Object distance dₒ (cm)',yl:hon?'Image distance dᵢ (cm, + real)':'Image distance dᵢ (cm)'});clip();
      ctx.strokeStyle=PAL['muted'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(box.L,ax.Y(0));ctx.lineTo(box.L+box.W,ax.Y(0));ctx.stroke();
      if(Number.isFinite(f)&&f>0){ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(ax.X(f),box.T);ctx.lineTo(ax.X(f),box.T+box.H);ctx.stroke();ctx.setLineDash([]);txt(ctx,'dₒ = f',ax.X(f)+5,box.T+14,{s:12,c:PAL['muted']});}
      line(ax,di,0.5,60,PAL['g-line'],100);dot(ax,p.dobj,im.di,100);
      txt(ctx,'real images',box.L+box.W-8,ax.Y(60),{s:12,a:'right',c:PAL['cv-soft']});txt(ctx,'virtual images',box.L+box.W-8,ax.Y(-45),{s:12,a:'right',c:PAL['cv-soft']});}
    else if(id==='mag'){const ax=axes(ctx,box,{xmin:0,xmax:60,ymin:-6,ymax:6,xl:'Object distance dₒ (cm)',yl:'Magnification m (− = inverted)'});clip();
      ctx.strokeStyle=PAL['muted'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(box.L,ax.Y(0));ctx.lineTo(box.L+box.W,ax.Y(0));ctx.stroke();
      ctx.setLineDash([3,4]);[1,-1].forEach(v=>{ctx.beginPath();ctx.moveTo(box.L,ax.Y(v));ctx.lineTo(box.L+box.W,ax.Y(v));ctx.stroke();});ctx.setLineDash([]);
      line(ax,d=>-di(d)/d,0.5,60,PAL['g-line'],6);dot(ax,p.dobj,im.m,6);txt(ctx,'same size',box.L+6,ax.Y(1)-5,{s:12,c:PAL['muted']});}
    else{const ax=axes(ctx,box,{xmin:0,xmax:0.35,ymin:-0.35,ymax:0.35,xl:'1/dₒ (1/cm)',yl:'1/dᵢ (1/cm)',yd:2});clip();
      ctx.strokeStyle=PAL['muted'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(box.L,ax.Y(0));ctx.lineTo(box.L+box.W,ax.Y(0));ctx.stroke();
      const inv=Number.isFinite(f)?1/f:0;line(ax,x=>inv-x,0,0.35,PAL['g-line'],1);dot(ax,1/p.dobj,Number.isFinite(im.di)?1/im.di:(Math.abs(inv-1/p.dobj)<1e-6?0:NaN),1);
      legend(ctx,box.L+10,box.T+8,[{label:p.el==='myst'?'slope −1, y-intercept = 1/f':'slope −1, y-intercept 1/f = '+inv.toFixed(4),color:PAL['g-line']}]);}
    ctx.restore();},
  narrate(sim){const p=sim.p,im=image(p),hon=atLeast('honors'),mir=isMirror(p),sc=sceneOn(sim);
    const pre=sc?'<b>'+sc+':</b> ':'';
    if(p.el==='plane')return pre+'A plane mirror makes a <b>virtual, upright, same-size</b> image exactly as far behind the mirror ('+p.dobj.toFixed(1)+' cm) as the candle is in front. The reflected rays only seem to come from there.';
    if(!Number.isFinite(im.di))return pre+'The candle is exactly at the focal point. The rays leave parallel and never meet, so <b>no image forms</b>.';
    const a=Math.abs(im.m),size=Math.abs(a-1)<0.02?'the same size':a>1?a.toFixed(1)+' times as tall':a.toFixed(2)+' times as tall';
    const eq=hon?' Check: 1/dₒ + 1/dᵢ = 1/'+p.dobj.toFixed(1)+' + 1/'+im.di.toFixed(1)+' = '+(1/p.dobj+1/im.di).toFixed(4)+(p.el==='myst'?' = 1/f.':' = 1/f = '+(1/im.f).toFixed(4)+'.'):'';
    if(im.real)return pre+'The rays really cross '+im.di.toFixed(1)+' cm '+(mir?'in front of the mirror':'behind the lens')+': a <b>real, inverted</b> image, '+size+'. A screen there shows it sharply.'+eq;
    return pre+'The rays spread apart after the '+(mir?'mirror':'lens')+'. Traced back, they seem to come from '+Math.abs(im.di).toFixed(1)+' cm '+(mir?'behind the mirror':'on the candle’s side')+': a <b>virtual, upright</b> image, '+size+'. You can see it by looking '+(mir?'into the mirror':'through the lens')+', but no screen can catch it.'+eq;},
  tour:[
    {title:'The bench',text:'A candle stands in front of a converging lens. The dots marked F are the <b>focal points</b>, 15 cm from the lens. The ruler measures in centimetres.',focus:[150,90,420,230],setup(sim){BioLab.setValues(sim,{el:'conv',f:15,dobj:40,rays:'0',screen:false,virt:true,ruler:true});}},
    {title:'Ray 1: parallel, then through F',text:'A ray leaving the flame tip parallel to the axis bends at the lens and passes through the far focal point F.',focus:[150,60,560,260],setup(sim){BioLab.setValues(sim,{rays:'1'});}},
    {title:'Ray 2: through the center',text:'A ray through the very center of the lens goes straight through without bending.',focus:[150,60,560,260],setup(sim){BioLab.setValues(sim,{rays:'2'});}},
    {title:'Ray 3: through F, then parallel',text:'A ray through the near focal point bends at the lens and leaves parallel to the axis.',focus:[150,60,560,260],setup(sim){BioLab.setValues(sim,{rays:'3'});}},
    {title:'Where the rays cross',text:'All three rays meet at one point: the tip of the <b>image</b>. Here it is real and upside down. A screen placed there shows a sharp picture.',focus:[440,170,240,180],setup(sim){const im=image(sim.p);BioLab.setValues(sim,{screen:true,scr:Math.round(im.di*2)/2});}},
    {title:'Closer than F: a magnifying glass',text:'Move the candle inside the focal point. The rays now spread apart after the lens. Traced backward (dashed) they meet behind the candle: a <b>virtual</b>, upright, larger image.',focus:[100,20,520,330],setup(sim){BioLab.setValues(sim,{dobj:9,screen:false});}},
    {title:'Mirrors follow the same rules',text:'A concave mirror focuses light like a converging lens, but the light bounces back, so real images form in front of the mirror.',focus:[200,40,520,330],setup(sim){BioLab.setValues(sim,{el:'concave',f:15,dobj:40});}},
    {lvl:'honors',title:'The thin-lens equation',text:'Every ray diagram obeys 1/f = 1/dₒ + 1/dᵢ and m = −dᵢ/dₒ. Compare the readouts: the two sides always match.',focus:[150,40,560,320],setup(sim){BioLab.setValues(sim,{el:'conv',f:10,dobj:15});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{el:'conv',f:15,dobj:40,rays:'3',screen:false});},
  challenges:[
    {lvl:'bio',q:'The candle moves from 40 cm to 10 cm from a converging lens (f = 15 cm), inside the focal point. What image forms?',choices:['Real, upside down, smaller','Virtual, upright, larger','No image at all'],correct:1,
     baseline:{el:'conv',f:15,dobj:40,rays:'3',screen:false},change:{dobj:10},changeText:'Candle moved to 10 cm',watch:'thin',
     explain:{bio:'Inside the focal point the lens cannot bend the rays enough to meet. They spread out, and your eye traces them back to a larger, upright image: a magnifying glass.',honors:'1/dᵢ = 1/15 − 1/10 = −1/30, so dᵢ = −30 cm (virtual) and m = −dᵢ/dₒ = +3.'}},
    {lvl:'bio',q:'A candle in front of a plane mirror moves from 20 cm to 30 cm away. Where is its image now?',choices:['30 cm behind the mirror','15 cm behind the mirror','60 cm behind the mirror','On the mirror surface'],correct:0,
     baseline:{el:'plane',dobj:20,rays:'3'},change:{dobj:30},changeText:'Candle moved to 30 cm',watch:'thin',
     explain:{bio:'A flat mirror makes the image exactly as far behind the mirror as the object is in front: 30 cm. That is why your reflection steps back when you do.',honors:'For a plane mirror f → ∞, so 1/dᵢ = −1/dₒ: dᵢ = −30 cm, m = +1.'}},
    {lvl:'bio',q:'The converging lens is swapped for a diverging lens. What does the image look like now?',choices:['Real and upside down','Virtual, upright and smaller','Virtual, upright and larger'],correct:1,
     baseline:{el:'conv',f:15,dobj:40,rays:'3'},change:{el:'div'},changeText:'Diverging lens in place',watch:'mag',
     explain:{bio:'A diverging lens always spreads light out, so the rays never meet. Traced back, they come from a small, upright image between the lens and the candle, wherever the candle is.',honors:'With f < 0, 1/dᵢ = 1/f − 1/dₒ is always negative, so dᵢ < 0 and 0 < m < 1 for every real object.'}},
    {lvl:'honors',q:'The candle moves to 30 cm, twice the focal length (f = 15 cm). What image forms?',choices:['Same size, inverted, 30 cm behind the lens','Larger, upright, 15 cm behind the lens','Smaller, inverted, 60 cm behind the lens','No image'],correct:0,
     baseline:{el:'conv',f:15,dobj:50,rays:'3',screen:false},change:{dobj:30},changeText:'Candle moved to 30 cm (2f)',watch:'thin',
     explain:{honors:'1/dᵢ = 1/15 − 1/30 = 1/30, so dᵢ = 30 cm = 2f and m = −30/30 = −1: the same size, upside down.'}},
    {lvl:'honors',q:'A converging lens has f = 10 cm and the candle is 15 cm away. Where is the image, and how big?',choices:['dᵢ = 30 cm, m = −2 (twice as tall, inverted)','dᵢ = 6 cm, m = −0.4','dᵢ = 25 cm, m = −1.7','dᵢ = −30 cm, virtual'],correct:0,
     baseline:{el:'conv',f:10,dobj:40,rays:'3'},change:{dobj:15},changeText:'Candle moved to 15 cm',watch:'recip',
     explain:{honors:'1/dᵢ = 1/10 − 1/15 = 1/30, so dᵢ = 30 cm. m = −dᵢ/dₒ = −30/15 = −2: a real image twice as tall and upside down. This is how a projector works.'}},
    {lvl:'ap',q:'Mystery lens: with the candle at 30 cm, a sharp image forms on a screen 45 cm behind the lens. What is the focal length?',choices:['15 cm','18 cm','30 cm','75 cm'],correct:1,
     baseline:{el:'myst',dobj:60,rays:'3',screen:true,scr:45},change:{dobj:30},changeText:'Candle moved to 30 cm',watch:'recip',
     explain:{ap:'1/f = 1/dₒ + 1/dᵢ = 1/30 + 1/45 = 5/90, so f = 18 cm (power +5.6 diopters). On the 1/dᵢ vs 1/dₒ graph, the y-intercept is 1/f.'}},
    {lvl:'ap',q:'A convex car mirror (f = −20 cm). A car behind moves from 45 cm to 15 cm away. What happens to its image?',choices:['It becomes real and inverted','It grows but stays virtual, upright and smaller than the car','It grows larger than the car','It disappears'],correct:1,
     baseline:{el:'convex',f:20,dobj:45,rays:'3'},change:{dobj:15},changeText:'Car moved to 15 cm',watch:'mag',
     explain:{ap:'For f < 0, m = f/(f − dₒ) = 20/(20 + dₒ), always between 0 and 1. At 45 cm m = 0.31; at 15 cm m = 0.57. Objects in the mirror are closer than they appear because the image is shrunk.'}}
  ],
  lab:{bio:'<p><b>Question:</b> How does moving the candle change the image from a converging lens?</p><ol><li>Set f = 15 cm and turn the screen on.</li><li>Put the candle at 60, 45, 30, 20 and 10 cm. Each time, move the screen until the image is sharp (if you can) and record the image distance, height and type.</li><li>Note the distance where the image changes from real to virtual.</li></ol><p>Write a claim: when does a lens make a real image, and when a virtual one?</p>',
       honors:'<p><b>Question:</b> Does the thin-lens equation predict where real images form?</p><ol><li>Converging lens, f = 10 cm.</li><li>For dₒ = 15, 20, 25, 30, 40 and 50 cm, find the sharp image with the screen. Record dₒ, dᵢ and the image height.</li><li>Calculate 1/dₒ + 1/dᵢ and compare with 1/f; calculate m two ways (height ratio and −dᵢ/dₒ).</li></ol><p>Explain any differences, then predict and test one virtual case.</p>',
       ap:'<p><b>Question:</b> What is the focal length of the mystery lens?</p><ol><li>Select the Mystery lens. For at least six object distances, find the sharp image with the screen and record dₒ and dᵢ.</li><li>Graph 1/dᵢ against 1/dₒ and fit a straight line.</li><li>Use the slope and intercept to find f and its uncertainty, and the lens power in diopters.</li></ol><p><b>Claim–evidence–reasoning:</b> Is the slope what the thin-lens equation predicts? Explain why linearizing helps.</p>'},
  terms:[{t:'Converging lens',d:'Thicker in the middle. Bends parallel light together to a focal point.'},{t:'Diverging lens',d:'Thinner in the middle. Spreads parallel light out as if it came from a focal point.'},{t:'Focal point (F)',d:'Where parallel rays meet (or seem to come from) after the lens or mirror.'},{t:'Focal length (f)',d:'Distance from the lens or mirror to the focal point.'},{t:'Real image',d:'Formed where light rays actually meet. Can be caught on a screen; upside down.'},{t:'Virtual image',d:'Where rays only seem to come from. Cannot be put on a screen; upright.'},{t:'Principal rays',d:'Three easy-to-draw rays from the object tip: parallel, through the center, and through F.'},
    {lvl:'honors',t:'Thin-lens equation',d:'1/f = 1/dₒ + 1/dᵢ (also works for mirrors).'},{lvl:'honors',t:'Magnification',d:'m = hᵢ/hₒ = −dᵢ/dₒ. Negative m means inverted.'},{lvl:'honors',t:'Sign convention',d:'Real images and converging elements are positive; virtual images and diverging elements are negative.'},
    {lvl:'ap',t:'Lens power',d:'P = 1/f with f in metres, in diopters. Eyeglass prescriptions use it.'}],
  about:'<p>Image positions use 1/f = 1/dₒ + 1/dᵢ and m = −dᵢ/dₒ with the real-is-positive sign convention. Rays are drawn with the paraxial (thin-lens, small-angle) approximation: every ray bends at a single plane through the lens or mirror, so all three principal rays meet exactly at the image.</p><p>Real lenses and mirrors blur slightly (spherical aberration) and have thickness; this model ignores both. The mirror curve is drawn exaggerated so you can tell concave from convex. The screen view blurs the image by how far the screen is from the true image plane.</p>',
  onClick(sim,x,y){const ex=EX(sim.p);if(x<ex-10){const d=(ex-x)/PPC;BioLab.setValues(sim,{dobj:Math.round(clamp(d,3,60)*2)/2});}},
  draw(sim,ctx,vdt,k){const p=sim.p,s=sim.st,hon=atLeast('honors'),mir=isMirror(p),ex=EX(p),im=image(p),f=im.f;
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,392,800,58);
    // axis + ruler
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,AY);ctx.lineTo(800,AY);ctx.stroke();
    if(p.ruler){ctx.strokeStyle=PAL['cv-soft'];ctx.beginPath();for(let c=-80;c<=80;c+=1){const X=ex+c*PPC;if(X<0||X>800)continue;const h=c%10===0?9:c%5===0?6:2.5;ctx.moveTo(X,AY);ctx.lineTo(X,AY+h);}ctx.stroke();
      for(let c=-70;c<=70;c+=10){const X=ex+c*PPC;if(X<12||X>788||c===0)continue;txt(ctx,Math.abs(c)+'',X,AY+21,{s:10.5*k,a:'center',c:PAL['cv-soft']});}
      txt(ctx,'cm',794,AY+34,{s:10.5*k,a:'right',c:PAL['cv-soft']});}
    // element
    const H=120;
    if(!mir){const conv=(p.el==='conv'||p.el==='myst');ctx.fillStyle=PAL['cv-glass'];ctx.globalAlpha=.45;ctx.beginPath();
      if(conv){ctx.moveTo(ex,AY-H);ctx.quadraticCurveTo(ex+26,AY,ex,AY+H);ctx.quadraticCurveTo(ex-26,AY,ex,AY-H);}
      else{ctx.moveTo(ex-13,AY-H);ctx.lineTo(ex+13,AY-H);ctx.quadraticCurveTo(ex+2,AY,ex+13,AY+H);ctx.lineTo(ex-13,AY+H);ctx.quadraticCurveTo(ex-2,AY,ex-13,AY-H);}
      ctx.closePath();ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.stroke();
      if(p.el==='myst')pill(ctx,'?',ex,AY-H-14,'#7b3fe4','#fff',13*k);}
    else{const sag=p.el==='plane'?0:(p.el==='concave'?-1:1)*clamp(260/p.f,6,22);
      ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(ex+sag,AY-H);ctx.quadraticCurveTo(ex-sag,AY,ex+sag,AY+H);ctx.stroke();
      ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;for(let y=-H+6;y<=H;y+=12){const t=(y+H)/(2*H),xb=ex+sag*(1-4*t*(1-t))+ (1-2*0)*0;ctx.beginPath();ctx.moveTo(xb+3,AY+y);ctx.lineTo(xb+11,AY+y-8);ctx.stroke();}}
    txt(ctx,ELS[p.el],ex,AY+H+26,{s:13*k,a:'center',w:700});
    // focal points
    if(Number.isFinite(f)&&p.el!=='myst'){const sgn=mir?-1:1;const pts=mir?[[ex-f*PPC,'F']]:[[ex+f*PPC,'F'],[ex-f*PPC,'F']];if(hon)(mir?[[ex-2*f*PPC,'C']]:[[ex+2*f*PPC,'2F'],[ex-2*f*PPC,'2F']]).forEach(q=>pts.push(q));
      pts.forEach(([X,l])=>{if(X<4||X>796)return;ctx.fillStyle=l==='F'?PAL['s1']:PAL['cv-soft'];ctx.beginPath();ctx.arc(X,AY,4.5,0,6.29);ctx.fill();txt(ctx,l,X,AY-9,{s:12*k,a:'center',w:700,c:l==='F'?PAL['s1']:PAL['cv-soft']});});void sgn;}
    // candle
    const xo=ex-p.dobj*PPC,ho=p.h*VPC;
    function candle(x,hgt,ghost,flick){const up=hgt>=0,a=Math.abs(hgt),dir=up?-1:1,w=Math.max(4,a*0.22);ctx.save();if(ghost)ctx.globalAlpha=.55;
      ctx.fillStyle='#e9e1cf';ctx.strokeStyle='#8a7d63';ctx.lineWidth=1;ctx.beginPath();ctx.rect(x-w/2,up?AY-a*0.78:AY,w,a*0.78);ctx.fill();ctx.stroke();
      const fy=AY+dir*a*0.78,fh=a*0.22*(1+0.08*Math.sin(flick*9));ctx.fillStyle='#f6a21a';ctx.beginPath();ctx.moveTo(x-w*0.45,fy);ctx.quadraticCurveTo(x-w*0.5,fy+dir*fh*0.6,x,fy+dir*fh);ctx.quadraticCurveTo(x+w*0.5,fy+dir*fh*0.6,x+w*0.45,fy);ctx.closePath();ctx.fill();
      ctx.fillStyle='#fff3b0';ctx.beginPath();ctx.arc(x,fy+dir*fh*0.35,Math.max(1.2,w*0.16),0,6.29);ctx.fill();
      if(ghost){ctx.globalAlpha=.9;ctx.strokeStyle=PAL['cv-ink'];ctx.setLineDash([3,3]);ctx.strokeRect(x-w/2-3,up?AY-a-3:AY,w+6,a+3);ctx.setLineDash([]);}ctx.restore();}
    candle(xo,ho,false,s.ph);
    txt(ctx,'object',xo,AY+(p.ruler?40:20),{s:12*k,a:'center',c:PAL['cv-soft']});
    // principal rays
    const tip=[xo,AY-ho],nR=+p.rays;
    const imX=Number.isFinite(im.di)?imgX(p,im.di):NaN,imY=AY-im.m*ho;
    const hits=[];
    if(nR>=1)hits.push({y:AY-ho,c:PAL['s4'],l:mir?'1: parallel → reflects through F':'1: parallel → through F'});
    if(nR>=2)hits.push({y:AY,c:PAL['s2'],l:mir?'2: to the center → bounces at equal angle':'2: through the center → straight'});
    if(nR>=3){let yh;if(!Number.isFinite(f))yh=AY+ho*0.7;else{const Fx=mir?ex-f*PPC:ex-f*PPC;const den=Fx-xo;yh=Math.abs(den)<1e-6?NaN:tip[1]+(AY-tip[1])*(ex-xo)/den;}
      if(Number.isFinite(yh)&&Math.abs(yh-AY)<H*1.6)hits.push({y:yh,c:PAL['s3'],l:!Number.isFinite(f)?'3: any ray → equal angles':mir?'3: through F → reflects parallel':'3: through F → leaves parallel'});}
    const L=900;
    hits.forEach(hh=>{const P=[ex,hh.y];ctx.save();ctx.strokeStyle=hh.c;ctx.lineWidth=2.2;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(tip[0],tip[1]);ctx.lineTo(P[0],P[1]);ctx.stroke();
      let d;if(Number.isFinite(imX)){d=im.real?[imX-P[0],imY-P[1]]:[P[0]-imX,P[1]-imY];}
      else{d=[ex-tip[0],AY-tip[1]];if(mir)d[0]=-d[0];}                    // image at infinity: parallel to the central ray
      const n=Math.hypot(d[0],d[1])||1;d=[d[0]/n,d[1]/n];
      ctx.beginPath();ctx.moveTo(P[0],P[1]);ctx.lineTo(P[0]+d[0]*L,P[1]+d[1]*L);ctx.stroke();
      // travelling light dots
      ctx.fillStyle=hh.c;const seg1=Math.hypot(P[0]-tip[0],P[1]-tip[1]);for(let j=0;j<10;j++){const u=((s.ph*80+j*70)%700);let X,Y;if(u<seg1){X=tip[0]+(P[0]-tip[0])*u/seg1;Y=tip[1]+(P[1]-tip[1])*u/seg1;}else{X=P[0]+d[0]*(u-seg1);Y=P[1]+d[1]*(u-seg1);}if(X<0||X>800||Y<0||Y>392)continue;ctx.beginPath();ctx.arc(X,Y,2.6,0,6.29);ctx.fill();}
      if(!im.real&&Number.isFinite(imX)&&p.virt){ctx.globalAlpha=.75;ctx.setLineDash([5,5]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(P[0],P[1]);ctx.lineTo(imX,imY);ctx.stroke();ctx.setLineDash([]);}
      if(Number.isFinite(f)&&hh.c===PAL['s3']&&p.dobj<Math.abs(f)&&f>0&&p.virt){ctx.globalAlpha=.55;ctx.setLineDash([2,4]);ctx.beginPath();ctx.moveTo(tip[0],tip[1]);ctx.lineTo(ex-f*PPC,AY);ctx.stroke();ctx.setLineDash([]);}
      ctx.restore();});
    // ray legend
    if(hits.length){const rh=17*k;ctx.font='400 '+(12*k)+'px '+FONT;const bw=Math.max(...hits.map(hh=>ctx.measureText('Ray '+hh.l).width))+44;ctx.fillStyle=PAL['card'];ctx.globalAlpha=.92;rr(ctx,10,8,bw,10+hits.length*rh,7);ctx.fill();ctx.globalAlpha=1;hits.forEach((hh,i)=>{const y=8+5+rh*(i+.5);ctx.fillStyle=hh.c;ctx.fillRect(18,y-2,18,4);txt(ctx,'Ray '+hh.l,42,y,{s:12*k,b:'middle'});});}
    // image
    if(Number.isFinite(imX)){const onStage=imX>-20&&imX<820&&Math.abs(imY-AY)<AY+150;
      if(onStage){candle(imX,im.m*ho,!im.real,s.ph);pill(ctx,(im.real?'real image':'virtual image'),clamp(imX,60,740),clamp(im.m>0?imY-18:imY+18,20,385),im.real?'#2d6bd2':'#7b3fe4','#fff',11.5*k);}
      else{const X=clamp(imX,30,770);pill(ctx,(imX<0?'← ':'')+'image '+Math.abs(im.di).toFixed(0)+' cm away'+(imX>800?' →':''),X,AY-60,'#7b3fe4','#fff',11.5*k);}}
    else txt(ctx,'Rays leave parallel: no image',ex+(mir?-150:150),AY-120,{s:13*k,a:'center',w:700,c:PAL['s1']});
    // screen
    if(p.screen){const sx=mir?ex-p.scr*PPC:ex+p.scr*PPC,sh=110;ctx.fillStyle=PAL['cv-lamp'];ctx.fillRect(sx-3,AY-sh,6,2*sh);ctx.fillRect(sx-14,AY+sh,28,6);
      txt(ctx,'screen '+p.scr.toFixed(1)+' cm',sx,AY-sh-8,{s:11.5*k,a:'center',c:PAL['cv-soft']});
      // what the screen shows
      const bx=640,by=8,bw=148,bh=92;ctx.fillStyle=PAL['card'];rr(ctx,bx,by,bw,bh,8);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
      txt(ctx,'On the screen',bx+8,by+15,{s:11.5*k,w:700});
      ctx.save();rr(ctx,bx+8,by+22,bw-16,bh-30,5);ctx.clip();ctx.fillStyle='#f4f1e8';ctx.fillRect(bx+8,by+22,bw-16,bh-30);
      const cx=bx+bw/2,cy=by+22+(bh-30)/2;
      if(im.real&&Number.isFinite(im.di)){const blur=clamp(Math.abs(p.scr-im.di)/Math.max(im.di,1)*30,0,16),sc=clamp(Math.abs(im.m)*0.5,0.12,1.4);
        ctx.filter='blur('+blur.toFixed(1)+'px)';ctx.globalAlpha=clamp(1-blur/20,0.25,1);ctx.translate(cx,cy);ctx.scale(sc,im.m<0?-sc:sc);
        ctx.fillStyle='#e9d9a8';ctx.fillRect(-6,-10,12,40);ctx.fillStyle='#f6a21a';ctx.beginPath();ctx.ellipse(0,-20,7,12,0,0,6.29);ctx.fill();ctx.restore();
        if(blur<1.2)pill(ctx,'Sharp!',bx+bw-30,by+bh-14,'#1b7a45','#fff',11*k);else txt(ctx,'blurry',bx+bw-12,by+bh-8,{s:11*k,a:'right',c:'#6b6b6b'});}
      else{const g=ctx.createRadialGradient(cx,cy,2,cx,cy,70);g.addColorStop(0,'rgba(246,162,26,.35)');g.addColorStop(1,'rgba(246,162,26,0)');ctx.fillStyle=g;ctx.fillRect(bx,by,bw,bh);ctx.restore();txt(ctx,'only a dim glow',cx,cy+4,{s:11*k,a:'center',c:'#6b6b6b'});}}
    // equation strip (Honors+)
    if(hon&&Number.isFinite(im.di))txt(ctx,'1/'+p.dobj.toFixed(1)+' + 1/'+im.di.toFixed(1)+' = '+(1/p.dobj+1/im.di).toFixed(4)+(p.el==='myst'?'  = 1/f':(Number.isFinite(f)?'   1/f = '+(1/f).toFixed(4):'   1/f = 0'))+'   m = '+im.m.toFixed(2),790,438,{s:12.5*k,a:'right',w:700});
    const sc=sceneOn(sim);if(sc)pill(ctx,sc,ex,AY-H-36,'#3a3e45','#fff',12*k);
    txt(ctx,typeText(im),12,412,{s:13*k,w:700});
  }
};
BioLab.register(LENSES);
})();
