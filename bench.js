/* Raider PhysLab: shared helpers for virtual-lab benches (loaded after engine.js, before the sims).
   A host sim keeps its own Simulation, Guided and Full lab views. RJBench.attach(SIM, benches) adds bench
   views for its virtual labs: while a lab whose id is a key of `benches` is open, init/step/draw/narrate/onClick
   go to that bench instead of the host. Each bench is {init(sim), step(sim,dt), draw(sim,ctx,vdt,k,t), narrate(sim), onClick?(sim,x,y), read?(sim)}.
   sim.st.B holds the bench's run state (cleared by Reset bench); records the checks need live in sim.vlab.bench (saved with the notebook). */
window.RJBench=(function(){
'use strict';
const {clamp,rr,txt,PAL,axes,rng}=BioLab.h;
const LCD='700 VSIZEpx "Consolas","Menlo","DejaVu Sans Mono","Courier New",monospace';

function attach(SIM,benches){
  const on=sim=>{const id=sim&&sim.vlab&&sim.vlab.lab&&sim.vlab.lab.id;return id&&benches[id]?benches[id]:null;};
  const cur=sim=>sim&&sim.st&&sim.st.B?on(sim):null;
  const i0=SIM.init,s0=SIM.step,d0=SIM.draw,n0=SIM.narrate,c0=SIM.onClick,r0=SIM.benchRead;
  SIM.init=function(sim){const s=i0.call(SIM,sim);const b=on(sim);if(b){s.B=b.init(sim)||{};s.B._lab=sim.vlab.lab.id;}return s;};
  SIM.step=function(sim,dt){const b=cur(sim);if(b)return b.step(sim,dt);return s0.call(SIM,sim,dt);};
  SIM.draw=function(sim,ctx,vdt,k,t){const b=cur(sim);if(b)return b.draw(sim,ctx,vdt,k,t);return d0.call(SIM,sim,ctx,vdt,k,t);};
  SIM.narrate=function(sim){const b=cur(sim);if(b)return b.narrate(sim);return n0.call(SIM,sim);};
  SIM.onClick=function(sim,x,y){const b=cur(sim);if(b){if(b.onClick)b.onClick(sim,x,y);return;}if(c0)return c0.call(SIM,sim,x,y);};
  SIM.benchRead=function(sim){const b=cur(sim);if(b)return b.read?b.read(sim):null;return r0?r0.call(SIM,sim):null;};
}
/* the bench state for the open lab, or null */
const B=(sim,id)=>sim&&sim.st&&sim.st.B&&(!id||sim.st.B._lab===id)?sim.st.B:null;
const rec=sim=>sim.vlab?sim.vlab.bench:{};
/* a dark instrument with a green LCD readout */
function lcd(ctx,x,y,w,h,label,value,k,size){ctx.fillStyle='#2b2f36';rr(ctx,x,y,w,h,10);ctx.fill();
  if(label)txt(ctx,label,x+12,y+18,{s:12*Math.min(k,1.3),w:700,c:'#d7dbe0'});
  const top=label?y+26:y+6,hh=y+h-6-top;ctx.fillStyle='#cfe3c8';rr(ctx,x+8,top,w-16,hh,5);ctx.fill();
  ctx.fillStyle='#1b2a1b';ctx.font=LCD.replace('VSIZE',String(Math.round(size||Math.min(30,hh*0.72))));ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillText(value,x+w-18,top+hh/2+1);ctx.textAlign='left';ctx.textBaseline='alphabetic';}
function panel(ctx,x,y,w,h){ctx.fillStyle=PAL['card'];rr(ctx,x,y,w,h,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;rr(ctx,x,y,w,h,10);ctx.stroke();}
/* a line on graph axes from an array of {t,y} */
function trace(ctx,ax,pts,col,o){o=o||{};if(!pts||pts.length<1)return;ctx.save();ctx.strokeStyle=col;ctx.lineWidth=o.w||2.4;ctx.globalAlpha=o.a||1;if(o.dash)ctx.setLineDash(o.dash);ctx.beginPath();
  pts.forEach((p,i)=>{const X=ax.X(p.t),Y=ax.Y(clamp(p.y,o.ymin!==undefined?o.ymin:-1e9,o.ymax!==undefined?o.ymax:1e9));i?ctx.lineTo(X,Y):ctx.moveTo(X,Y);});ctx.stroke();ctx.restore();
  if(o.dots){ctx.fillStyle=col;pts.forEach(p=>{ctx.beginPath();ctx.arc(ax.X(p.t),ax.Y(p.y),o.dots,0,6.2832);ctx.fill();});}}
/* a stopwatch the student starts and stops; times are real time (performance.now) */
function watchNew(){return {run:false,t0:0,shown:0,laps:[]};}
function watchToggle(w){const now=performance.now();if(w.run){w.run=false;w.shown=Math.round((now-w.t0)/10)/100;return w.shown;}w.run=true;w.t0=now;w.shown=0;return null;}
function watchShown(w){return w.run?Math.floor((performance.now()-w.t0)/10)/100:w.shown;}
function drawWatch(ctx,x,y,k,w,label){lcd(ctx,x,y,170,62,label||'STOPWATCH',watchShown(w).toFixed(2)+' s',k,26);if(w.run){ctx.fillStyle='#e0533d';ctx.beginPath();ctx.arc(x+156,y+13,5,0,6.2832);ctx.fill();}}
const near=(a,b,tol)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=tol;
const rel=(a,b,f)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=f*Math.max(Math.abs(b),1e-9);
const r3=v=>Math.round(v*1000)/1000,r2=v=>Math.round(v*100)/100;
/* a normal deviate from a seeded generator */
function gauss(R){let u=0,v=0;while(u===0)u=R();while(v===0)v=R();return Math.sqrt(-2*Math.log(u))*Math.cos(6.2831853*v);}
/* least-squares line through [{x,y}] */
function fit(P){const n=P.length;if(n<2)return null;let sx=0,sy=0,sxx=0,sxy=0;P.forEach(p=>{sx+=p.x;sy+=p.y;sxx+=p.x*p.x;sxy+=p.x*p.y;});const d=n*sxx-sx*sx;if(Math.abs(d)<1e-12)return null;const m=(n*sxy-sx*sy)/d;return {m,b:(sy-m*sx)/n};}
/* a G-U-E-S-S worksheet as question fields */
const GUESS=[{id:'g',label:'G (givens)'},{id:'u',label:'U (unknown)'},{id:'e',label:'E (equation)'},{id:'s1',label:'S (substitute)'},{id:'s2',label:'S (solve, with units)'}];
return {attach,B,rec,lcd,panel,trace,axes,watchNew,watchToggle,watchShown,drawWatch,near,rel,r3,r2,gauss,fit,rng,GUESS,LCD};
})();
