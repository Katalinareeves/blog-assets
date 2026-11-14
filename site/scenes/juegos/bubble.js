/* Bubble Lab · juego original. Progreso local provisional; no concede semillas ni bienes online. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const canvas=$('bubble-canvas'),ctx=canvas.getContext('2d'),W=560,H=680;
const R=18,STEPX=38,STEPY=33,LEFT=43,TOP=67,COLS=13,ROWS=18;
const COLORS=['#dcb0f3','#8bd9d1','#f6b2bc','#e7cf88','#9ebef2'];
const names=['violeta','menta','coral','ámbar','cielo'];
const recordsKey='ciudadBubbleLabV1';
let best=0,tickets=0,unlocked=false;
try{const v=JSON.parse(localStorage.getItem(recordsKey)||'{}');best=Math.max(0,Number(v.best)||0);tickets=Math.max(0,Number(v.tickets)||0);unlocked=Boolean(v.unlocked);}catch{}
const grid=Array.from({length:ROWS},()=>Array(COLS).fill(-1));
const stars=Array.from({length:55},(_,i)=>({x:(i*97+31)%W,y:(i*137+29)%H,z:i%3+1}));
let mode='solo',running=false,finished=false,ball=null,next=0,aim=-Math.PI/2,score=0,combo=0,shots=0,misses=0;
let botScore=0,botClock=0,particles=[],lastTime=0,endReason='',elapsed=0;
const randomColor=()=>Math.floor(Math.random()*COLORS.length);
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const cell=(r,c)=>({x:LEFT+c*STEPX+(r%2)*STEPX/2,y:TOP+r*STEPY});
const inside=(r,c)=>r>=0&&r<ROWS&&c>=0&&c<COLS;
const setText=(id,v)=>{$(id).textContent=String(v)};
const persist=()=>{try{localStorage.setItem(recordsKey,JSON.stringify({best,tickets,unlocked}));}catch{}};
function updateHud(){
 if(score>=450&&!unlocked){unlocked=true;persist();}
 if(score>best){best=score;persist();}
 setText('score',score.toLocaleString('es-CL'));
 setText('best',best.toLocaleString('es-CL'));
 setText('shots',shots);setText('combo','×'+Math.max(1,combo));setText('tickets',tickets);
 $('next-orb').style.color=COLORS[next];$('next-orb').textContent='●';
 setText('bot-score',botScore.toLocaleString('es-CL'));
 const cosmetic=$('cosmetic');if(cosmetic){cosmetic.textContent=unlocked?'✳ Aura nebular desbloqueada':'Bloqueado · 450 puntos';cosmetic.classList.toggle('unlocked',unlocked);}
}
function reset(m){
 mode=m||mode;running=true;finished=false;ball=null;score=0;combo=0;shots=0;misses=0;botScore=0;botClock=0;elapsed=0;
 for(let r=0;r<ROWS;r++)grid[r].fill(-1);
 // Start with patterned clusters: satisfying early matches instead of pure random noise.
 for(let r=0;r<5;r++)for(let c=0;c<COLS;c++)if(Math.random()>.10)grid[r][c]=Math.floor((c/3+r/2+Math.random()*.85)%COLORS.length);
 next=randomColor();particles=[];aim=-Math.PI/2;endReason='';
 $('mode-label').textContent=mode==='bot'?'Duelo contra bot':'Modo solitario';
 $('bot-panel').hidden=mode!=='bot';
 $('intro-overlay').hidden=true;$('end-overlay').hidden=true;
 updateHud();canvas.focus();
}
function neighbors(r,c){
 const p=[[r,c-1],[r,c+1]];
 if(r%2===0)p.push([r-1,c-1],[r-1,c],[r+1,c-1],[r+1,c]);
 else p.push([r-1,c],[r-1,c+1],[r+1,c],[r+1,c+1]);
 return p.filter(([a,b])=>inside(a,b));
}
function cluster(r,c,color,visited=new Set()){
 const todo=[[r,c]],out=[];
 while(todo.length){
  const [rr,cc]=todo.pop(),key=rr*COLS+cc;
  if(visited.has(key)||grid[rr][cc]!==color)continue;
  visited.add(key);out.push([rr,cc]);
  for(const item of neighbors(rr,cc))todo.push(item);
 }
 return out;
}
function dropOrphans(){
 const reached=new Set(),queue=[];
 for(let c=0;c<COLS;c++)if(grid[0][c]>=0){queue.push([0,c]);reached.add(c);}
 while(queue.length){
  const [r,c]=queue.shift();
  for(const [rr,cc] of neighbors(r,c)){
   const id=rr*COLS+cc;
   if(grid[rr][cc]<0||reached.has(id))continue;
   reached.add(id);queue.push([rr,cc]);
  }
 }
 const dropped=[];
 for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
  if(grid[r][c]>=0&&!reached.has(r*COLS+c)){dropped.push([r,c,grid[r][c]]);grid[r][c]=-1;}
 }
 return dropped;
}
function emit(x,y,color,count=9){
 for(let i=0;i<count;i++){
  const a=(Math.PI*2*i/count)+(Math.random()-.5)*.25;
  const speed=1.1+Math.random()*4;
  particles.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:32+Math.random()*20,color,r:2+Math.random()*4});
 }
}
function addCeiling(){
 for(let r=ROWS-1;r>=1;r--)grid[r]=grid[r-1].slice();
 grid[0]=Array.from({length:COLS},(_,c)=>Math.floor((c/3+shots/8+Math.random()*.9)%COLORS.length));
 misses=0;
}
function finish(message,win){
 if(finished)return;
 finished=true;running=false;endReason=message;
 const earned=Math.min(30,Math.floor(score/180));
 tickets+=earned;persist();updateHud();
 $('end-kicker').textContent=win?'¡NIVEL COMPLETADO!':'FIN DE PARTIDA';
 $('end-title').textContent=win?'¡Laboratorio despejado!':'¡Otra ronda!';
 const rival=mode==='bot'?' · Rival virtual: '+botScore+' puntos'+(score>=botScore?' · ¡Ganaste!':' · ¡El bot ganó!'):'';
 $('end-copy').textContent=message+' · '+score+' puntos'+rival+'. Ganaste '+earned+' tickets locales de prueba.';
 $('end-overlay').hidden=false;
}
function checkFinish(){
 if(grid.every(row=>row.every(v=>v<0))){finish('Eliminaste todos los orbes',true);return;}
 for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(grid[r][c]>=0&&cell(r,c).y>H-132){finish('Los orbes llegaron hasta el laboratorio',false);return;}
}
function attach(x,y,color){
 let bestSpot=null,dist=Infinity;
 // Snap to nearest unoccupied cell, preferring cells touching existing or ceiling.
 for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
  if(grid[r][c]>=0)continue;
  const p=cell(r,c),distance=(p.x-x)**2+(p.y-y)**2;
  const anchored=r===0||neighbors(r,c).some(([rr,cc])=>grid[rr][cc]>=0);
  if(anchored&&distance<dist){dist=distance;bestSpot=[r,c];}
 }
 if(!bestSpot){finish('El tablero se llenó',false);return;}
 const [r,c]=bestSpot;
 grid[r][c]=color;
 const group=cluster(r,c,color);
 if(group.length>=3){
  for(const [rr,cc] of group){const p=cell(rr,cc);emit(p.x,p.y,COLORS[color]);grid[rr][cc]=-1;}
  const loose=dropOrphans();
  for(const [rr,cc,v] of loose){const p=cell(rr,cc);emit(p.x,p.y,COLORS[v],5);}
  combo++;score+=(group.length*22+loose.length*36)*Math.min(5,combo);
  misses=0;
 }else{combo=0;misses++;if(misses>=6)addCeiling();}
 ball=null;next=randomColor();updateHud();checkFinish();
}
function shoot(){
 if(!running||ball)return;
 const ox=W/2,oy=H-53;
 ball={x:ox,y:oy,vx:Math.cos(aim)*10,vy:Math.sin(aim)*10,color:next};
 shots++;updateHud();
}
function pointerAim(clientX,clientY){
 const rect=canvas.getBoundingClientRect();
 const x=(clientX-rect.left)*W/rect.width,y=(clientY-rect.top)*H/rect.height;
 const raw=Math.atan2(y-(H-53),x-W/2);
 aim=clamp(raw,-Math.PI+.22,-.22);
}
canvas.addEventListener('pointermove',e=>{if(running)pointerAim(e.clientX,e.clientY);});
canvas.addEventListener('pointerdown',e=>{if(!running)return;e.preventDefault();pointerAim(e.clientX,e.clientY);shoot();});
window.addEventListener('keydown',e=>{
 if(!running)return;
 if(['ArrowLeft','ArrowRight',' ','r','R'].includes(e.key))e.preventDefault();
 if(e.key==='ArrowLeft')aim=clamp(aim-.085,-Math.PI+.22,-.22);
 if(e.key==='ArrowRight')aim=clamp(aim+.085,-Math.PI+.22,-.22);
 if(e.key===' ')shoot();
 if(e.key.toLowerCase()==='r')reset(mode);
});
$('solo-start').onclick=()=>reset('solo');
$('bot-start').onclick=()=>reset('bot');
$('again').onclick=()=>reset(mode);
$('restart').onclick=()=>{if(!running&&finished){reset(mode);return;}if(running&&confirm('¿Reiniciar la partida actual?'))reset(mode);};
function circle(x,y,r,color){
 ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
}
function orb(x,y,color,r=R){
 const glow=ctx.createRadialGradient(x-r*.35,y-r*.4,2,x,y,r*1.3);
 glow.addColorStop(0,'#ffffff');glow.addColorStop(.13,COLORS[color]);glow.addColorStop(.72,COLORS[color]);glow.addColorStop(1,'#24233f');
 ctx.save();ctx.shadowBlur=13;ctx.shadowColor=COLORS[color]+'80';circle(x,y,r,glow);ctx.shadowBlur=0;
 circle(x-r*.32,y-r*.38,r*.17,'#ffffffa8');ctx.strokeStyle='#ffffff48';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,r-2,0,Math.PI*2);ctx.stroke();ctx.restore();
}
function render(t){
 const dt=Math.min(36,t-lastTime||16);lastTime=t;
 ctx.fillStyle='#14182e';ctx.fillRect(0,0,W,H);
 // Soft celestial grid and stars
 for(let y=25;y<H;y+=33){ctx.strokeStyle='#6578a50b';ctx.beginPath();ctx.moveTo(10,y);ctx.lineTo(W-10,y);ctx.stroke();}
 for(const s of stars){ctx.globalAlpha=.2+.21*Math.sin(t/1500+s.x);circle(s.x,s.y,s.z*.7,'#e2cbfa');}
 ctx.globalAlpha=1;
 const ambient=ctx.createRadialGradient(W/2,230,20,W/2,280,430);
 ambient.addColorStop(0,'#6f4e9a13');ambient.addColorStop(1,'transparent');
 ctx.fillStyle=ambient;ctx.fillRect(0,0,W,H);
 if(unlocked){const aura=ctx.createRadialGradient(W/2,180,15,W/2,230,355);aura.addColorStop(0,'#bca2ff33');aura.addColorStop(1,'#ab86ef00');ctx.fillStyle=aura;ctx.fillRect(0,0,W,H);}
 for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(grid[r][c]>=0){const p=cell(r,c);orb(p.x,p.y,grid[r][c]);}
 if(running){
  elapsed+=dt;
  if(mode==='bot'){
   botClock+=dt;
   if(botClock>=2500){botClock-=2500;botScore+=Math.random()<.72?Math.floor(45+Math.random()*115):0;updateHud();}
  }
  if(ball){
   // One substep per frame is enough at speed 10 and radius 18.
   ball.x+=ball.vx;ball.y+=ball.vy;
   if(ball.x<R+14){ball.x=R+14;ball.vx=Math.abs(ball.vx);}
   if(ball.x>W-R-14){ball.x=W-R-14;ball.vx=-Math.abs(ball.vx);}
   let impact=ball.y<=TOP;
   if(!impact){
    outer:for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
     if(grid[r][c]<0)continue;
     const p=cell(r,c);
     if((p.x-ball.x)**2+(p.y-ball.y)**2<=(R*2-2)**2){impact=true;break outer;}
    }
   }
   if(impact)attach(ball.x,ball.y,ball.color);
  }
  const ox=W/2,oy=H-53;
  // Aim ray uses three translucent dots, like a classic arcade guide.
  ctx.save();ctx.setLineDash([6,15]);ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(ox+Math.cos(aim)*155,oy+Math.sin(aim)*155);
  ctx.strokeStyle='#e9d3f686';ctx.lineWidth=3;ctx.stroke();ctx.restore();
  circle(ox,oy,30,'#3d355c');circle(ox,oy,24,'#6f5c8c');
  if(!ball)orb(ox,oy,next,19);else orb(ball.x,ball.y,ball.color,18);
 }
 particles=particles.filter(p=>p.life>0);
 for(const p of particles){p.x+=p.vx;p.y+=p.vy;p.vy+=.09;p.life--;ctx.globalAlpha=clamp(p.life/45,0,1);circle(p.x,p.y,p.r,p.color);}
 ctx.globalAlpha=1;
 requestAnimationFrame(render);
}
updateHud();requestAnimationFrame(render);
})();