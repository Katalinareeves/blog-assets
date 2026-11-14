(()=>{'use strict';
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d'),$=id=>document.getElementById(id);
const W=640,H=640,record='ciudadStarsBestV1';
let best=Number(localStorage.getItem(record))||0,score=0,lives=3,level=1,play=false,objects=[],x=W/2,keys=new Set(),spawn=0,last=0,invincible=0,elapsed=0,particles=[];
const sky=Array.from({length:95},(_,i)=>({x:(i*107+27)%W,y:(i*173+33)%H,r:i%3+1}));
const ui=()=>{$('score').textContent=score;$('best').textContent=best;$('lives').textContent='♥ '.repeat(Math.max(0,lives));$('level').textContent=level;};
function reset(){score=0;lives=3;level=1;play=true;objects=[];spawn=0;last=0;x=W/2;invincible=0;elapsed=0;particles=[];$('cover').hidden=true;ui();canvas.focus();}
function end(){play=false;const win=score>=best; if(score>best){best=score;try{localStorage.setItem(record,String(best))}catch{}}ui();$('cover-title').textContent=win?'¡Nuevo récord! ✨':'¡Otra partidita!';$('cover-desc').textContent='Conseguiste '+score+' puntos y llegaste al nivel '+level+'. Atrapa aún más estrellas la próxima vez.';$('start').textContent='Volver a jugar ↻';$('cover').hidden=false;}
function sparkle(px,py,color,count=8){for(let n=0;n<count;n++){const a=Math.random()*6.28;particles.push({x:px,y:py,vx:Math.cos(a)*(1+Math.random()*4),vy:Math.sin(a)*(1+Math.random()*4),life:30,color});}}
function collision(o){const dx=o.x-x,dy=o.y-(H-72);return Math.abs(dx)<o.r+25&&Math.abs(dy)<o.r+23;}
function spawnItem(){const hazard=Math.random()<(.22+Math.min(.24,level*.025));objects.push({x:30+Math.random()*(W-60),y:-30,r:hazard?19:14+Math.random()*6,bad:hazard,vy:2.0+level*.35+Math.random()*1.5,rot:Math.random()*6.28});}
const cl=(v,a,b)=>Math.max(a,Math.min(b,v));
canvas.addEventListener('pointermove',e=>{if(!play)return;const r=canvas.getBoundingClientRect();x=cl((e.clientX-r.left)/r.width*W,35,W-35);});
canvas.addEventListener('pointerdown',e=>{if(!play)return;e.preventDefault();const r=canvas.getBoundingClientRect();x=cl((e.clientX-r.left)/r.width*W,35,W-35);});
window.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','a','d','A','D'].includes(e.key)&&play){keys.add(e.key.toLowerCase());e.preventDefault();}});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
$('start').onclick=reset;$('restart').onclick=()=>{if(play){if(confirm('¿Reiniciar esta partida?'))reset();}else reset();};
function star(cx,cy,r,color){ctx.save();ctx.translate(cx,cy);ctx.beginPath();for(let k=0;k<10;k++){const a=k*Math.PI/5-Math.PI/2,rr=k%2?r*.46:r;ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}ctx.closePath();ctx.fillStyle=color;ctx.shadowBlur=12;ctx.shadowColor=color;ctx.fill();ctx.restore();}
function frame(t){
 let dt=Math.min((t-last||16)/16.67,2);last=t;
 ctx.fillStyle='#191a34';ctx.fillRect(0,0,W,H);
 for(const p of sky){ctx.globalAlpha=.25+.25*Math.sin(t/800+p.x);ctx.fillStyle='#e7d6ff';ctx.fillRect(p.x,(p.y+t*.008*(p.r))%H,p.r,p.r);}
 ctx.globalAlpha=1;
 const haze=ctx.createRadialGradient(W/2,H/2,20,W/2,H/2,410);haze.addColorStop(0,'#74509d28');haze.addColorStop(1,'#30244900');ctx.fillStyle=haze;ctx.fillRect(0,0,W,H);
 if(play){
  elapsed+=dt;level=1+Math.floor(score/300);
  if(keys.has('arrowleft')||keys.has('a'))x-=6*dt;
  if(keys.has('arrowright')||keys.has('d'))x+=6*dt;x=cl(x,35,W-35);
  spawn+=dt;if(spawn>Math.max(12,40-level*2.3)){spawn=0;spawnItem();}
  invincible=Math.max(0,invincible-dt);
  objects.forEach(o=>{o.y+=o.vy*dt;o.rot+=dt*.035;});
  for(let i=objects.length-1;i>=0;i--){
   const o=objects[i];if(o.y>H+40){objects.splice(i,1);continue;}
   if(collision(o)){
    objects.splice(i,1);
    if(o.bad){if(!invincible){lives--;invincible=65;sparkle(x,H-72,'#ff928d',16);if(lives<=0)end();}}
    else{score+=10+Math.floor(level/3)*5;sparkle(o.x,o.y,'#f8dd8f');if(score>best){best=score;try{localStorage.setItem(record,String(best))}catch{}}}
    ui();
   }
  }
 }
 for(const o of objects){
  if(o.bad){ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.rot);star(0,0,o.r,'#fa837f');ctx.restore();ctx.strokeStyle='#ffbbbb';ctx.beginPath();ctx.moveTo(o.x-8,o.y-7);ctx.lineTo(o.x+6,o.y+5);ctx.stroke();}
  else star(o.x,o.y,o.r,'#f9de91');
 }
 for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=.06*dt;p.life-=dt;ctx.globalAlpha=Math.max(0,p.life/30);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,4,4);}particles=particles.filter(p=>p.life>0);ctx.globalAlpha=1;
 // Player spaceship / catcher
 if(!invincible||Math.floor(t/100)%2===0){
  ctx.save();ctx.translate(x,H-72);
  ctx.shadowColor='#c7a1f4';ctx.shadowBlur=23;
  ctx.fillStyle='#a8e3d9';ctx.beginPath();ctx.moveTo(0,-26);ctx.lineTo(32,19);ctx.lineTo(0,11);ctx.lineTo(-32,19);ctx.closePath();ctx.fill();
  ctx.shadowBlur=0;ctx.fillStyle='#6a478f';ctx.fillRect(-12,-5,24,20);ctx.fillStyle='#e3d9fb';ctx.fillRect(-5,-17,10,12);ctx.fillStyle='#f3aa9d';ctx.fillRect(-20,20,9,10);ctx.fillRect(11,20,9,10);
  ctx.restore();
 }
 requestAnimationFrame(frame);
}
ui();requestAnimationFrame(frame);
})();