(function(){
'use strict';
const {clamp,lerp,rng,randn,rr,txt,pill,atLeast,PAL,axes,legend}=BioLab.h;

/* ======================================================================
   Inside the pulse oximeter.
   Two LEDs (red 660 nm, infrared 940 nm) shine through a fingertip.
   Beer–Lambert: A = ε b c, transmitted fraction T = 10^(−A).
   Steady tissue + skin set the DC light level; arterial blood that swells
   with each heartbeat adds a small pulsing absorbance (the AC part).
   The device computes R = (AC_red/DC_red)/(AC_IR/DC_IR) and turns R into
   SpO₂ with a calibration curve fit on test subjects; we use the common
   textbook approximation SpO₂ ≈ 110 − 25R.
   Skin-tone bias is an ILLUSTRATIVE offset in R (see about).
   ====================================================================== */
// Approximate molar extinction coefficients of hemoglobin (cm⁻¹/M), widely used compiled tables (Prahl).
const EPS={hbo2:{red:319.6,ir:1214},hb:{red:3226.6,ir:693.4}};
const epsArt=(S,w)=>{const s=S/100;return s*EPS.hbo2[w]+(1-s)*EPS.hb[w];};
const HR=75, PER=60/HR;                       // heart rate (beats/min), period (s)
const CAL=R=>110-25*R;                        // calibration curve (approximate)
const RCAL=S=>(110-S)/25;                     // R the calibration subjects give at saturation S
// steady absorbances (illustrative): tissue and melanin. Melanin absorbs more at red than infrared.
const A_TIS={red:1.0,ir:0.8}, A_MEL={red:0.10,ir:0.04};
const DIVERSE=0.2;                            // leftover share of the offset after diverse calibration (assumption)
function biasPts(S,m,calib){const w=clamp((97-S)/12,0,1.25);const raw=(m/10)*(1.5+6.5*w);return calib==='diverse'?raw*DIVERSE:raw;}
function pulse(ph){const f=((ph%PER)+PER)%PER/PER;   // 0..1 arterial volume shape over one beat
  const a=Math.exp(-Math.pow((f-0.18)/0.1,2)),b=0.4*Math.exp(-Math.pow((f-0.47)/0.13,2));return clamp((a+b)/1.0,0,1);}

function model(p){const S=p.sat,m=p.mel,perf=p.perf||2;
  const E=biasPts(S,m,p.calib);
  const R0=RCAL(S), R=R0-E/25;                      // R the calibration group gives, R this finger gives the device
  const acI=perf/100, acR=R*acI;                    // AC/DC for each wavelength (DC = baseline between beats)
  const aI=-Math.log10(1-acI), aR=-Math.log10(1-acR);  // peak pulsing absorbance (Beer–Lambert)
  const dcR=Math.pow(10,-(A_TIS.red+A_MEL.red*m)), dcI=Math.pow(10,-(A_TIS.ir+A_MEL.ir*m));
  const rawRead=CAL(R), read=Math.round(clamp(rawRead,0,100));
  const err=read-S, occult=S<88&&read>=92&&read<=96;
  return {S,m,E,R0,R,acI,acR,aI,aR,dcR,dcI,read,err,occult};}

/* simulated ward: 4,000 patients, true SaO₂ ~ N(92, 4.5), reading scatter σ = 1.5 points (assumptions) */
const WARD={};
function ward(m,calib){const key=m+'|'+calib;if(WARD[key])return WARD[key];const r=rng(20201217);let n=0,hid=0;
  for(let i=0;i<4000;i++){const S=clamp(Math.round(92+4.5*randn(r)),70,100);const rd=Math.round(clamp(S+biasPts(S,m,calib)+1.5*randn(r),0,100));
    if(rd>=92&&rd<=96){n++;if(S<88)hid++;}}
  return (WARD[key]={n,hid,pct:n?100*hid/n:0});}

function skinCol(m){const a=[241,214,192],b=[78,50,34];const t=m/10;return 'rgb('+a.map((v,i)=>Math.round(lerp(v,b[i],t))).join(',')+')';}
function status(o){if(o.occult)return {t:'Hidden low oxygen',bg:'#b3261e'};
  if(o.S<88&&o.read<88)return {t:'Low oxygen, and it shows',bg:'#9a5b00'};
  if(o.S<88)return {t:'Low oxygen, reads too high',bg:'#b3261e'};
  if(Math.abs(o.err)>=3)return {t:'Reads '+o.err+' points high',bg:'#9a5b00'};
  return {t:'Reading close to the truth',bg:'#1d7a46'};}

const SIM={
  id:'oximeter',hash:'oximeter',apUnit:9,order:3,kind:'Simulation',tab:'Inside the pulse oximeter',prereq:['color'],
  card:'Shine red and infrared light through a fingertip, turn the pulse into an oxygen reading, and find when a device reads high on darker skin.',
  title:'Inside the pulse oximeter',
  lede:{bio:'A pulse oximeter clips on a finger and reads the oxygen in your blood with two colors of light. Set the real oxygen level and the skin’s melanin, and see when the screen tells the truth and when it hides low oxygen.',
        honors:'Oxygen-rich and oxygen-poor hemoglobin absorb red and infrared light differently. The device divides each pulse by the steady light (AC/DC) at both wavelengths, takes the ratio of ratios R, and a calibration curve turns R into SpO₂.',
        ap:'Use Beer–Lambert (A = εbc) to see why AC/DC cancels everything that does not pulse, then test how a calibration fit on a narrow group of subjects produces a bias that grows as oxygen falls.'},
  scale:'One fingertip, about 1.5 cm thick. The heart beats 75 times a minute, so each pulse lasts 0.8 s. The pulsing part of the light is only about 1 to 5% of the total.',
  timeless:true,animated:true,chChange:0.5,chReveal:1.5,
  controls:[
    {id:'sat',label:'True oxygen saturation (SaO₂)',type:'range',min:70,max:100,step:1,def:97,unit:'%',lvl:'bio',help:'What a blood sample from an artery would show. Healthy people are usually about 95–100%.'},
    {id:'mel',label:'Melanin in the skin',type:'range',min:0,max:10,step:1,def:2,unit:'',lvl:'bio',help:'0 = very light skin, 10 = very dark skin. An illustrative scale, not a medical one.'},
    {id:'calib',label:'The device was calibrated on',type:'seg',def:'narrow',lvl:'bio',options:[{v:'narrow',l:'Mostly light-skinned people'},{v:'diverse',l:'A diverse group'}]},
    {id:'perf',label:'Pulse strength (perfusion index)',type:'range',min:0.5,max:5,step:0.1,def:2,unit:'%',d:1,lvl:'honors',help:'Infrared AC/DC. Cold fingers give a weaker pulse.'}
  ],
  init(){return {ph:0};},
  step(sim,dt){sim.st.ph+=dt;},
  metrics:[
    {id:'true',label:'True saturation (SaO₂)',unit:'%',lvl:'bio',min:70,max:100,d:0,get:s=>s.p.sat},
    {id:'read',label:'Screen reading (SpO₂)',unit:'%',lvl:'bio',min:70,max:100,d:0,get:s=>model(s.p).read},
    {id:'err',label:'Reading minus truth',unit:'points',lvl:'bio',min:-5,max:15,d:0,get:s=>model(s.p).err},
    {id:'stat',label:'Status',unit:'',lvl:'bio',text:true,get:s=>{const o=model(s.p);return o.occult?'Hidden low oxygen (occult hypoxemia)':status(o).t;}},
    {id:'R',label:'Ratio of ratios R (measured)',unit:'',lvl:'honors',min:0,max:2,d:3,get:s=>model(s.p).R},
    {id:'acR',label:'Red pulse AC/DC',unit:'%',lvl:'honors',min:0,max:8,d:2,get:s=>100*model(s.p).acR},
    {id:'acI',label:'Infrared pulse AC/DC',unit:'%',lvl:'honors',min:0,max:8,d:2,get:s=>100*model(s.p).acI},
    {id:'R0',label:'R the calibration group would give',unit:'',lvl:'ap',min:0,max:2,d:3,get:s=>model(s.p).R0},
    {id:'tR',label:'Red light reaching the detector',unit:'%',lvl:'ap',min:0,max:20,d:2,get:s=>100*model(s.p).dcR},
    {id:'tI',label:'Infrared light reaching the detector',unit:'%',lvl:'ap',min:0,max:20,d:2,get:s=>100*model(s.p).dcI},
    {id:'ward',label:'Simulated ward: hidden low oxygen among 92–96% readings',unit:'%',lvl:'ap',min:0,max:40,d:1,get:s=>ward(s.p.mel,s.p.calib).pct}
  ],
  graphs:[
    {id:'readvs',label:'Screen reading vs true saturation',lvl:'bio',custom:true},
    {id:'cal',label:'Calibration curve: SpO₂ from R',lvl:'bio',custom:true},
    {id:'pulse',label:'Light at the detector over two beats',lvl:'honors',custom:true},
    {id:'abs',label:'How hemoglobin absorbs red and infrared',lvl:'honors',custom:true},
    {id:'errmel',label:'Error vs melanin (this saturation)',lvl:'ap',custom:true}
  ],
  defaultGraph:'readvs',
  plot(sim,ctx,box,id){const p=sim.p,o=model(p);
    const line=(ax,f,x0,x1,col,dash,w)=>{ctx.strokeStyle=col;ctx.lineWidth=w||2.5;ctx.setLineDash(dash?[5,4]:[]);ctx.beginPath();for(let i=0;i<=120;i++){const x=x0+(x1-x0)*i/120,y=f(x);i?ctx.lineTo(ax.X(x),ax.Y(y)):ctx.moveTo(ax.X(x),ax.Y(y));}ctx.stroke();ctx.setLineDash([]);};
    const dot=(ax,x,y,col)=>{ctx.fillStyle=col;ctx.beginPath();ctx.arc(ax.X(x),ax.Y(y),6,0,6.29);ctx.fill();};
    if(id==='readvs'){const ax=axes(ctx,box,{xmin:70,xmax:100,ymin:70,ymax:100,xl:'True saturation SaO₂ (%)',yl:'Screen reading SpO₂ (%)'});
      ctx.fillStyle=PAL['s1'];ctx.globalAlpha=.16;ctx.fillRect(ax.X(70),ax.Y(96),ax.X(88)-ax.X(70),ax.Y(92)-ax.Y(96));ctx.globalAlpha=1;
      ctx.strokeStyle=PAL['s1'];ctx.lineWidth=1.5;ctx.strokeRect(ax.X(70),ax.Y(96),ax.X(88)-ax.X(70),ax.Y(92)-ax.Y(96));
      txt(ctx,'hidden low oxygen',ax.X(71),ax.Y(96)-6,{s:12,c:PAL['s1'],w:700});
      line(ax,x=>x,70,100,PAL['muted'],true,1.5);
      line(ax,x=>Math.min(100,x+biasPts(x,p.mel,'narrow')),70,100,PAL['s4']);
      line(ax,x=>Math.min(100,x+biasPts(x,p.mel,'diverse')),70,100,PAL['s2']);
      dot(ax,p.sat,o.read,PAL['fg']);
      legend(ctx,ax.X(74),box.T+box.H-14,[{label:'perfect',color:PAL['muted'],dash:true},{label:'narrow calibration',color:PAL['s4']},{label:'diverse calibration',color:PAL['s2']}]);}
    else if(id==='cal'){const ax=axes(ctx,box,{xmin:0.4,xmax:1.8,ymin:65,ymax:100,xl:'Ratio of ratios R',yl:'SpO₂ (%)',xd:1});
      line(ax,R=>CAL(R),0.4,1.8,PAL['g-line']);
      ctx.strokeStyle=PAL['muted'];ctx.setLineDash([3,3]);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(ax.X(o.R),ax.Y(65));ctx.lineTo(ax.X(o.R),ax.Y(CAL(o.R)));ctx.lineTo(ax.X(0.4),ax.Y(CAL(o.R)));ctx.stroke();ctx.setLineDash([]);
      if(Math.abs(o.R0-o.R)>0.004)dot(ax,o.R0,clamp(CAL(o.R0),65,100),PAL['s2']);
      dot(ax,o.R,clamp(CAL(o.R),65,100),PAL['s1']);
      legend(ctx,box.L+12,box.T+box.H-14,[{label:'SpO₂ ≈ 110 − 25R (approx.)',color:PAL['g-line']},{label:'measured R',color:PAL['s1']},{label:'R without offset',color:PAL['s2']}]);}
    else if(id==='pulse'){const ax=axes(ctx,box,{xmin:0,xmax:2*PER,ymin:100-1.15*Math.max(100*o.acR,100*o.acI,1),ymax:100.3,xl:'Time (s)',yl:'Light vs. between beats (%)',yd:1});
      line(ax,t=>100*Math.pow(10,-o.aR*pulse(t)),0,2*PER,PAL['s1']);line(ax,t=>100*Math.pow(10,-o.aI*pulse(t)),0,2*PER,PAL['s5']);
      legend(ctx,box.L+12,box.T+box.H-14,[{label:'red: AC/DC '+(100*o.acR).toFixed(2)+'%',color:PAL['s1']},{label:'infrared: AC/DC '+(100*o.acI).toFixed(2)+'%',color:PAL['s5']}]);}
    else if(id==='abs'){const ax=axes(ctx,box,{xmin:0,xmax:4,ymin:0,ymax:3600,xcats:['HbO₂ 660 nm','Hb 660 nm','HbO₂ 940 nm','Hb 940 nm'],yl:'ε (cm⁻¹/M)'});
      BioLab.h.bars(ctx,ax,[EPS.hbo2.red,EPS.hb.red,EPS.hbo2.ir,EPS.hb.ir],{colors:[PAL['s1'],PAL['s5'],PAL['s1'],PAL['s5']],d:0});
      legend(ctx,box.L+box.W-230,box.T+10,[{label:'oxygen-rich (HbO₂)',color:PAL['s1']},{label:'oxygen-poor (Hb)',color:PAL['s5']}]);}
    else{const ax=axes(ctx,box,{xmin:0,xmax:10,ymin:-1,ymax:12,xl:'Melanin level (0–10, illustrative)',yl:'Reading minus truth (points)'});
      line(ax,m=>Math.min(100,p.sat+biasPts(p.sat,m,'narrow'))-p.sat,0,10,PAL['s4']);line(ax,m=>Math.min(100,p.sat+biasPts(p.sat,m,'diverse'))-p.sat,0,10,PAL['s2']);
      dot(ax,p.mel,o.err,PAL['fg']);
      legend(ctx,box.L+12,box.T+10,[{label:'narrow calibration',color:PAL['s4']},{label:'diverse calibration',color:PAL['s2']}]);}},
  narrate(sim){const p=sim.p,o=model(p),hon=atLeast('honors');
    if(o.occult)return '<b>Hidden low oxygen.</b> The blood is really at '+o.S+'%, below the 88% cutoff for low oxygen, but the screen shows '+o.read+'%, which looks fine. Doctors call this <b>occult hypoxemia</b>. '+(p.calib==='narrow'?'Switch the calibration to a diverse group and watch the gap shrink.':'');
    if(o.S<88&&o.read<92)return 'The blood is at '+o.S+'%, and the screen shows '+o.read+'%. '+(o.err>=3?'It still reads '+o.err+' points high, but the number is low enough to raise a flag.':'The low reading warns that this person needs more oxygen.');
    if(o.err>=3)return 'The screen reads <b>'+o.err+' points high</b> ('+o.read+'% vs a true '+o.S+'%). In this model the offset grows with melanin and as oxygen falls, because the calibration curve came from '+(p.calib==='narrow'?'mostly light-skinned subjects':'a group that still left some error')+'.';
    if(o.S>=94)return 'Oxygen-rich blood lets most red light through, so each heartbeat dims the red light less than the infrared. '+(hon?'R = '+o.R.toFixed(2)+', and the curve 110 − 25R gives <b>'+o.read+'%</b>.':'The device turns that difference into <b>'+o.read+'%</b>.');
    return 'As oxygen falls, more hemoglobin is oxygen-poor, and oxygen-poor hemoglobin soaks up red light. The red pulse grows, '+(hon?'R rises to '+o.R.toFixed(2)+', and ':'so ')+'the reading drops to <b>'+o.read+'%</b>.';},
  tour:[
    {title:'Two colors of light',text:'The clip shines <b>red light (660 nm)</b> and <b>infrared light (940 nm)</b> through your fingertip. A detector on the other side measures how much gets through. Infrared is invisible; it is drawn purple here.',focus:[20,14,350,345],setup(sim){BioLab.setValues(sim,{sat:97,mel:2,calib:'narrow',perf:2});}},
    {title:'Each heartbeat dims the light',text:'With every beat, the artery swells with a little more blood, and the extra blood absorbs a little more light. The screen’s wave is that tiny dip, about 2% of the light.',focus:[400,18,385,165]},
    {title:'Oxygen changes the color blood absorbs',text:{bio:'Oxygen-poor blood soaks up red light about 10 times as strongly as oxygen-rich blood. Watch the red pulse grow as the oxygen drops to 85%.',honors:'At 660 nm, ε is about 3,227 for Hb and 320 for HbO₂ (cm⁻¹/M), 10 times more. At 940 nm, HbO₂ absorbs a bit more than Hb. So as oxygen falls, the red pulse grows and the infrared pulse shrinks a little.'},focus:[400,18,385,165],setup(sim){BioLab.setValues(sim,{sat:85,mel:0});}},
    {title:'The ratio of ratios',text:{bio:'The device compares the size of the red pulse with the infrared pulse. A bigger red pulse means less oxygen. A calibration curve turns that comparison into a percentage.',honors:'R = (AC/DC)<sub>red</sub> ÷ (AC/DC)<sub>IR</sub>. Here R = 1.00, and the calibration curve SpO₂ ≈ 110 − 25R gives 85%, which matches the truth for this finger.'},focus:[400,190,385,255]},
    {title:'Melanin absorbs light too',text:'Now the skin has much more melanin (10 of 10). Melanin absorbs more red than infrared. This device’s calibration curve was fit on mostly light-skinned test subjects, so it reads <b>93%</b> when the blood is really at 85%.',focus:[[20,14,350,345],[400,190,385,255]],setup(sim){BioLab.setValues(sim,{mel:10,calib:'narrow'});}},
    {title:'Hidden low oxygen',text:'A true level below 88% with a reading of 92–96% is <b>occult hypoxemia</b>: low oxygen that the screen hides. A 2020 study found it in 11.7% of paired readings in Black patients and 3.6% in white patients, about 3 times as often.',focus:[400,190,385,255]},
    {title:'Calibrate on everyone',text:'Switch to a device calibrated on a diverse group. In this model the leftover error is much smaller: it reads 87% for a true 85%, close enough to raise a flag. In 2025 the FDA proposed testing oximeters on 150 or more people with a range of measured skin tones.',focus:[400,190,385,255],setup(sim){BioLab.setValues(sim,{calib:'diverse'});}},
    {lvl:'ap',title:'Why AC/DC cancels steady absorbers',text:'Beer–Lambert gives T = 10<sup>−A</sup>. Steady absorbers (skin, bone, melanin) multiply both the pulsing and the steady light by the same factor, so AC/DC ignores them. Melanin cuts red light at the detector here from 10% to 1%, yet in the pure model R would not change. The offset stands in for real effects the simple model leaves out.',focus:[400,190,385,255],setup(sim){BioLab.setValues(sim,{calib:'narrow'});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{sat:97,mel:2,calib:'narrow',perf:2});},
  onChallenge(sim,ch){if(ch&&ch.set)BioLab.setValues(sim,ch.set);},
  challenges:[
    {lvl:'bio',instant:true,set:{sat:97,mel:0,calib:'narrow',perf:2},q:'The blood’s oxygen drops from 97% to 85%. What happens to the red light during each heartbeat?',choices:['Each beat dims the red light more: the red pulse gets bigger','More red light gets through','Nothing changes; only infrared is affected'],correct:0,
     explain:{bio:'Oxygen-poor hemoglobin absorbs red light about 10 times as strongly as oxygen-rich hemoglobin. Set the oxygen to 85% and the red pulse grows from 1.04% to 2.00% of the light.',honors:'With a 2% infrared pulse, R goes from 0.52 to 1.00, so (AC/DC)<sub>red</sub> goes from 1.04% to 2.00%.'}},
    {lvl:'bio',instant:true,set:{sat:85,mel:10,calib:'narrow'},q:'The blood is really at 85%, which is dangerously low. The skin has a lot of melanin (10 of 10), and the device was calibrated on mostly light-skinned people. What does the screen show?',choices:['About 85%','About 93%, which looks fine','About 75%'],correct:1,
     explain:{bio:'In this model it reads 93%, 8 points high. A doctor glancing at 93% might not give oxygen. That is occult hypoxemia: low oxygen hidden by the reading.'}},
    {lvl:'bio',instant:true,set:{sat:85,mel:10,calib:'diverse'},q:'Same person, same finger. Now the device was calibrated on a diverse group of people. What does it show?',choices:['About 87%, close to the truth','About 93%, the same as before','Nothing: it cannot read dark skin'],correct:0,
     explain:{bio:'Testing on people with a full range of skin tones lets the maker fix most of the error. Here it reads 87%, low enough to raise a flag. (How much error is left is an assumption in this model.)'}},
    {lvl:'honors',instant:true,set:{sat:95,mel:0,calib:'narrow'},q:'A device measures R = 0.60. Using the calibration curve SpO₂ ≈ 110 − 25R, what does it display?',choices:['85%','95%','60%','110%'],correct:1,
     explain:{honors:'110 − 25 × 0.60 = 110 − 15 = 95%. A larger R means a relatively bigger red pulse, which means less oxygen: R = 1.00 gives 85%.'}},
    {lvl:'honors',instant:true,set:{sat:97,mel:2,calib:'narrow',perf:2},q:'Why does the device divide each pulse (AC) by the steady light (DC) before comparing red with infrared?',choices:['To cancel things that do not pulse, like skin, bone and LED brightness','To make the numbers bigger','Because infrared light is invisible'],correct:0,
     explain:{honors:'A thick finger or a dim LED lowers both AC and DC by the same factor. Dividing cancels that factor, so only the pulsing arterial blood is left.'}},
    {lvl:'honors',instant:true,set:{sat:97,mel:0,calib:'narrow',perf:0.5},q:'A cold finger has a weak pulse (perfusion 0.5% instead of 2%). In this model, what happens to R?',choices:['R stays the same: both pulses shrink by the same factor','R doubles','R drops to zero'],correct:0,
     explain:{honors:'Both AC/DC values shrink 4 times, so their ratio is unchanged: R = 0.52 and the reading stays 97%. Real devices struggle with weak pulses because noise becomes large compared with the signal, which this model does not include.'}},
    {lvl:'ap',instant:true,set:{sat:95,mel:0,calib:'narrow',perf:2},q:'The red pulse is AC/DC = 1.2% and the infrared pulse is AC/DC = 2.0%. What is R, and what does the curve display?',choices:['R = 1.67, SpO₂ ≈ 68%','R = 0.60, SpO₂ ≈ 95%','R = 0.012, SpO₂ ≈ 110%'],correct:1,
     explain:{ap:'R = 1.2% ÷ 2.0% = 0.60. SpO₂ ≈ 110 − 25(0.60) = 95%. The percentages cancel, so R has no units.'}},
    {lvl:'ap',instant:true,set:{sat:97,mel:10,calib:'narrow'},q:'Beer–Lambert: light passes through a layer with absorbance A = 0.30. What fraction gets through?',choices:['70%','50%','30%','3%'],correct:1,
     explain:{ap:'T = 10<sup>−A</sup> = 10<sup>−0.30</sup> = 0.50, so 50%. Double the path length b and A doubles to 0.60: T = 10<sup>−0.60</sup> = 25%.'}},
    {lvl:'ap',instant:true,set:{sat:85,mel:10,calib:'narrow'},q:'In the pure Beer–Lambert model, melanin is a steady absorber in the skin. How does adding it change R?',choices:['It raises R','It lowers R','It does not change R: it dims AC and DC by the same factor'],correct:2,
     explain:{ap:'T = 10<sup>−(A_steady + A_pulse)</sup> = 10<sup>−A_steady</sup> × 10<sup>−A_pulse</sup>. The steady factor cancels in AC/DC. So the real bias must come from effects the simple model leaves out, such as light scattering and how calibration was done. This tool shows that combined effect as an illustrative offset in R.'}}
  ],
  lab:{bio:'<p><b>Question:</b> When does the oximeter hide low oxygen?</p><ol><li>Set the calibration to <b>mostly light-skinned people</b>.</li><li>For melanin 0, 5 and 10, set the true oxygen to 97%, 90% and 85%. Record the screen reading each time.</li><li>Repeat with a <b>diverse group</b>.</li></ol><p>Write a claim: which combination gives a reading of 92–96% when the truth is below 88%? Use your table as evidence.</p>',
       honors:'<p><b>Question:</b> How does R depend on oxygen?</p><ol><li>Set melanin to 0. For true oxygen 100, 95, 90, 85, 80 and 75%, record R, the red AC/DC and the infrared AC/DC.</li><li>Plot SpO₂ (y) against R (x) and find the slope and intercept.</li><li>Change the pulse strength. Does R change?</li></ol><p>Explain in terms of hemoglobin absorption why R goes up as oxygen goes down.</p>',
       ap:'<p><b>Question:</b> How big is the skin-tone bias, and where is it worst?</p><ol><li>At narrow calibration, record the error for melanin 0 to 10 at true oxygen 97%, 90% and 84%.</li><li>Record the simulated-ward rate of hidden low oxygen for melanin 0 and 10, for both calibrations.</li><li>Record the red light reaching the detector for melanin 0 and 10.</li></ol><p><b>Claim–evidence–reasoning:</b> Using T = 10<sup>−A</sup>, explain why a steady absorber cancels in AC/DC, and argue why testing on many people with measured skin tones matters even so.</p>'},
  terms:[{t:'Pulse oximeter',d:'A clip that estimates blood oxygen by shining red and infrared light through a fingertip.'},
    {t:'Hemoglobin',d:'The protein in red blood cells that carries oxygen. Oxygen-rich (HbO₂) and oxygen-poor (Hb) forms absorb light differently.'},
    {t:'SaO₂ and SpO₂',d:'SaO₂ is oxygen saturation measured in a blood sample from an artery. SpO₂ is the oximeter’s estimate.'},
    {t:'Occult hypoxemia',d:'True SaO₂ below 88% while the oximeter reads 92–96%: low oxygen the screen hides.'},
    {t:'Melanin',d:'The pigment that gives skin its color. It absorbs light, more at red than infrared.'},
    {t:'Calibration curve',d:'A formula, fit on test subjects, that turns what a device measures into a reading.'},
    {lvl:'honors',t:'AC and DC',d:'DC is the steady light reaching the detector; AC is the small part that pulses with each heartbeat.'},
    {lvl:'honors',t:'Ratio of ratios (R)',d:'R = (AC/DC) at red ÷ (AC/DC) at infrared. Higher R means less oxygen.'},
    {lvl:'honors',t:'Perfusion index',d:'The infrared AC/DC as a percentage: how strong the pulse signal is.'},
    {lvl:'ap',t:'Beer–Lambert law',d:'A = εbc: absorbance equals the extinction coefficient times path length times concentration. Transmitted fraction T = 10<sup>−A</sup>.'},
    {lvl:'ap',t:'Extinction coefficient (ε)',d:'How strongly a substance absorbs one wavelength, per unit concentration and path length.'}],
  about:'<p><b>The physics.</b> Beer–Lambert: A = εbc and T = 10<sup>−A</sup>. Tissue and skin set the steady (DC) light at the detector; arterial blood that swells with each beat adds a small pulsing absorbance (AC). The device computes R = (AC/DC)<sub>red</sub> ÷ (AC/DC)<sub>IR</sub>, with DC taken as the light between beats, and turns R into SpO₂ with a calibration curve. We use the common textbook approximation <b>SpO₂ ≈ 110 − 25R</b>; real devices use their own curves. Hemoglobin extinction coefficients (cm⁻¹/M) are approximate values from widely used compiled tables (S. Prahl): HbO₂ 320 and Hb 3,227 at 660 nm; HbO₂ 1,214 and Hb 693 at 940 nm.</p>'+
    '<p><b>What is simplified.</b> Real tissue scatters light, so measured R does not follow a pure Beer–Lambert ratio. That is why every oximeter is calibrated on test subjects. Here the reference finger is built to follow the curve exactly. In pure Beer–Lambert a steady absorber like melanin cancels out of AC/DC. Researchers are still working out how skin pigment enters the real signal. This tool <b>does not model those effects</b>. It adds an <b>illustrative offset</b> to R: the error grows with melanin (0–10, an invented scale) and as oxygen falls, up to about 10 points. A diverse calibration leaves 20% of that offset; that share is an assumption. Steady absorbances (tissue 1.0 red, 0.8 IR; melanin up to 1.0 red, 0.4 IR) are also illustrative. The simulated ward uses 4,000 made-up patients (true SaO₂ averaging 92%, spread 4.5 points; reading scatter 1.5 points) and is not fit to any study.</p>'+
    '<p><b>Real-world facts.</b> Sjoding and colleagues, <i>New England Journal of Medicine</i> (2020), studied a University of Michigan cohort with 10,789 paired readings. Occult hypoxemia (SaO₂ below 88% with SpO₂ of 92–96%) occurred in 11.7% of paired readings in Black patients and 3.6% in white patients, about 3 times as often (<a href="https://www.healthcareitnews.com/news/pulse-oximeters-may-be-less-accurate-black-patients" target="_blank" rel="noopener">Healthcare IT News</a>). On January 6, 2025, the FDA released <b>draft guidance</b> proposing that oximeters be tested on 150 or more participants (up from about 10), with skin tone rated on the Monk Skin Tone scale and measured by an objective method, the individual typology angle (<a href="https://www.statnews.com/2025/01/06/pulse-oximeter-fda-draft-guidance-released/" target="_blank" rel="noopener">STAT</a>). It is draft guidance: check its current status.</p>'+
    '<p><b>Not medical advice.</b> This is a simplified teaching model. Never use it to judge anyone’s oxygen level or health.</p>',
  draw(sim,ctx,vdt,k){const p=sim.p,st=sim.st,o=model(p),hon=atLeast('honors');
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    const ph=st.ph,pv=pulse(ph);
    /* ---- the clip and fingertip (left) ---- */
    const CX=195,CY=190;
    // upper jaw with LEDs
    ctx.fillStyle='#3b4250';rr(ctx,40,22,310,52,10);ctx.fill();
    const LR=150,LI=240;
    ctx.fillStyle='#ff3b30';ctx.beginPath();ctx.arc(LR,60,8,0,6.29);ctx.fill();
    ctx.fillStyle='#b05bd6';ctx.beginPath();ctx.arc(LI,60,8,0,6.29);ctx.fill();
    txt(ctx,'red 660 nm',54,44,{s:12*k,c:'#ffffff',a:'left',w:700});
    txt(ctx,k<1.3?'infrared 940 nm':'IR 940 nm',340,44,{s:12*k,c:'#ffffff',a:'right',w:700});
    // fingertip: skin ring, tissue, artery, vein
    ctx.save();ctx.beginPath();ctx.ellipse(CX,CY,152,100,0,0,6.29);ctx.fillStyle=skinCol(p.mel);ctx.fill();
    ctx.beginPath();ctx.ellipse(CX,CY,138,86,0,0,6.29);ctx.fillStyle='#d98f86';ctx.fill();
    ctx.beginPath();ctx.ellipse(CX,CY-22,52,26,0,0,6.29);ctx.fillStyle='#efe4cf';ctx.globalAlpha=.85;ctx.fill();ctx.globalAlpha=1;   // bone
    const ra=15+6*pv;ctx.beginPath();ctx.arc(CX-4,CY+40,ra,0,6.29);ctx.fillStyle='#c62828';ctx.fill();
    ctx.strokeStyle='#ffffff';ctx.lineWidth=1.5;ctx.globalAlpha=.5;ctx.stroke();ctx.globalAlpha=1;
    ctx.beginPath();ctx.arc(CX+78,CY+30,12,0,6.29);ctx.fillStyle='#6d1b3b';ctx.fill();
    ctx.restore();
    // beams: from LEDs down to the detector, fading as light is absorbed
    const beam=(x0,col,dcT,pul)=>{const segs=24;for(let i=0;i<segs;i++){const f0=i/segs,f1=(i+1)/segs;const y0=70+f0*(318-70),y1=70+f1*(318-70);
        const x=a=>lerp(x0,CX,a*0.85);const left=Math.pow(dcT,f0)*(1-pul*f0);ctx.strokeStyle=col;ctx.globalAlpha=clamp(0.25+0.75*Math.pow(left,0.35),0.12,1)*0.8;
        ctx.lineWidth=lerp(10,4,f0);ctx.beginPath();ctx.moveTo(x(f0),y0);ctx.lineTo(x(f1),y1);ctx.stroke();}ctx.globalAlpha=1;};
    beam(LR,'#ff3b30',o.dcR,o.acR*pv);beam(LI,'#b05bd6',o.dcI,o.acI*pv);
    // lower jaw with detector
    ctx.fillStyle='#3b4250';rr(ctx,40,302,310,52,10);ctx.fill();
    ctx.fillStyle='#9fb3c8';rr(ctx,CX-28,306,56,10,3);ctx.fill();
    txt(ctx,'detector',CX,340,{s:12*k,c:'#ffffff',a:'center',w:700});
    // legend under the clip
    const ly=376,lg=23*k,tx=50+18*k;
    ctx.fillStyle='#c62828';ctx.beginPath();ctx.arc(50+6*k,ly-4*k,6*k,0,6.29);ctx.fill();
    txt(ctx,'artery: swells each beat',tx,ly,{s:12*k});
    ctx.fillStyle=skinCol(p.mel);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.fillRect(50,ly+lg-10*k,12*k,12*k);ctx.strokeRect(50,ly+lg-10*k,12*k,12*k);
    txt(ctx,'skin: melanin '+p.mel+' of 10',tx,ly+lg,{s:12*k});
    if(k<1.3)txt(ctx,hon?'red light reaching detector: '+(100*o.dcR).toFixed(1)+'%':'infrared is invisible; drawn purple',50,ly+2*lg,{s:12*k,c:PAL['cv-soft']});
    /* ---- device screen (top right) ---- */
    const SX=405,SY=20,SW=380,SH=160;
    ctx.fillStyle='#10202c';rr(ctx,SX,SY,SW,SH,12);ctx.fill();
    txt(ctx,'SpO₂',SX+18,SY+30,{s:14*k,c:'#9fe3b8',w:700});
    txt(ctx,o.read+'%',SX+18,SY+92,{s:46*Math.min(k,1.3),c:'#7cf5a6',w:800});
    txt(ctx,'pulse '+HR+'/min',SX+18,SY+SH-16,{s:12*k,c:'#9fe3b8'});
    // scrolling pleth wave (infrared): shows the dip as a bump
    const wx0=SX+190,wx1=SX+SW-14,wy=SY+SH/2+10,amp=44;
    ctx.strokeStyle='#7cf5a6';ctx.lineWidth=2.5;ctx.beginPath();
    for(let i=0;i<=100;i++){const x=lerp(wx0,wx1,i/100),tt=ph-(1-i/100)*2.4;const y=wy+amp/2-amp*pulse(tt)*clamp(p.perf/2,0.35,1.6)/1.6;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
    if(hon){txt(ctx,'R = '+o.R.toFixed(2),wx0,SY+30,{s:13*k,c:'#cfe9da'});}
    /* ---- truth vs reading scale (bottom right) ---- */
    const BX0=425,BX1=770,BY=272,X=v=>BX0+(v-70)/30*(BX1-BX0);
    txt(ctx,'Truth vs. reading',SX,206,{s:14*k,w:700});
    ctx.fillStyle=PAL['cv-bg2'];rr(ctx,BX0,BY-8,BX1-BX0,16,8);ctx.fill();
    ctx.fillStyle=PAL['s1'];ctx.globalAlpha=.45;rr(ctx,BX0,BY-8,X(88)-BX0,16,8);ctx.fill();ctx.globalAlpha=1;
    ctx.strokeStyle=PAL['s3'];ctx.lineWidth=2;ctx.strokeRect(X(92),BY-10,X(96)-X(92),20);
    // true marker (above) and reading marker (below)
    const tri=(x,up,col)=>{ctx.fillStyle=col;ctx.beginPath();if(up){ctx.moveTo(x,BY-11);ctx.lineTo(x-8,BY-25);ctx.lineTo(x+8,BY-25);}else{ctx.moveTo(x,BY+11);ctx.lineTo(x-8,BY+25);ctx.lineTo(x+8,BY+25);}ctx.closePath();ctx.fill();};
    const xt=X(o.S),xr=X(o.read);tri(xt,true,PAL['cv-ink']);tri(xr,false,PAL['s2']);
    const lx=x=>clamp(x,BX0+48*k,BX1-48*k);
    txt(ctx,'true '+o.S+'%',lx(xt),BY-31,{s:13*k,a:'center',w:700});
    txt(ctx,'screen '+o.read+'%',lx(xr),BY+30+13*k,{s:13*k,a:'center',w:700,c:PAL['s2']});
    txt(ctx,'red: below 88% true',BX0,BY+60+22*k,{s:12*k,c:PAL['s1']});
    if(k<1.3)txt(ctx,'green box: 92–96%',BX1,BY+60+22*k,{s:12*k,c:PAL['s3'],a:'right'});
    const S=status(o);pill(ctx,S.t,(SX+SW/2),BY+92+34*k,S.bg,'#ffffff',14*Math.min(k,1.4));},
  thumbSetup(sim){BioLab.setValues(sim,{sat:85,mel:10,calib:'narrow'});}
};
BioLab.register(SIM);
})();
