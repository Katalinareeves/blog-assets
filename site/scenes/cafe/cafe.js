/* Café República · La Ciudad. Interior original pixel art + mini juego local. */
(()=>{'use strict';
const $=id=>document.getElementById(id),canvas=$('cafe-scene'),ctx=canvas.getContext('2d');
const W=960,H=530,saveKey='ciudadCafeRecordV1';
const player={x:460,y:402,w:19,h:29,dir:'down',step:0,seat:false};
const keys=new Set(),tables=[{x:190,y:335},{x:375,y:335},{x:690,y:335},{x:825,y:335}];
let raf=0,last=0,gameTime=0,orderIndex=0,served=0,best=0,toastAt=0,sittingAt=-1,ambientOn=false,audio=null;
try{best=Math.max(0,Number(localStorage.getItem(saveKey))||0)}catch{}
const recipes=[
 {name:'Latte de vainilla',base:'espresso',finish:'milk',flavor:'vanilla',detail:'Café suave con leche y un toque floral'},
 {name:'Chocolate calentito',base:'cocoa',finish:'milk',flavor:'chocolate',detail:'El favorito de los días de lluvia'},
 {name:'Té con canela',base:'tea',finish:'water',flavor:'cinnamon',detail:'Infusión aromática para después de clases'},
 {name:'Capuchino con canela',base:'espresso',finish:'foam',flavor:'cinnamon',detail:'Espuma suave y canela por encima'},
 {name:'Mocaccino',base:'espresso',finish:'milk',flavor:'chocolate',detail:'Café y chocolate, combinación perfecta'},
 {name:'Té con vainilla',base:'tea',finish:'water',flavor:'vanilla',detail:'Una pausa suave en medio del día'},
 {name:'Chocolate espumoso',base:'cocoa',finish:'foam',flavor:'none',detail:'Una taza suave, sin extras'},
 {name:'Espresso clásico',base:'espresso',finish:'water',flavor:'none',detail:'Para sobrevivir a métodos matemáticos'}
];
function setStatus(s){$('scene-note').textContent=s;$('status').textContent=s;}
function nextOrder(){const r=recipes[orderIndex%recipes.length];$('order-number').textContent=orderIndex+1;$('order-name').textContent=r.name;$('order-detail').textContent=r.detail;return r;}
function update(){ $('orders-done').textContent=served;$('best').textContent=best;}
$('serve').addEventListener('click',()=>{
 const r=recipes[orderIndex%recipes.length];
 const ok=$('base').value===r.base&&$('finish').value===r.finish&&$('flavor').value===r.flavor;
 const msg=$('feedback');
 if(ok){
  served++;orderIndex++;if(served>best){best=served;try{localStorage.setItem(saveKey,String(best))}catch{}}
  msg.textContent='¡Pedido perfecto! ♡ Gracias por el cafecito.';
  msg.style.color='#aed9c0';setStatus('¡Qué rico! El café se llenó de sonrisas ♡');
  update();nextOrder();
 }else{
  msg.textContent='Mmm, esa receta no coincide. ¡Inténtalo de nuevo!';
  msg.style.color='#f8b5be';setStatus('La clientela espera su bebida favorita ☕');
 }
 toastAt=performance.now();
});
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function txt(str,x,y,size=12,color='#f3dfd9',align='center'){
 ctx.font='bold '+size+'px monospace';ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(str,Math.round(x),Math.round(y));
}
function drawWindow(x,now){
 rect(x-8,54,127,149,'#795b65');rect(x,62,111,130,'#252b49');
 const g=ctx.createLinearGradient(0,64,0,188);g.addColorStop(0,'#5e5179');g.addColorStop(1,'#b48c9b');
 ctx.fillStyle=g;ctx.fillRect(x+6,68,99,116);
 rect(x+52,68,5,116,'#d4a89f');rect(x+6,120,99,5,'#d4a89f');
 for(let i=0;i<9;i++){const sx=x+13+(i*19)%83,sy=77+(i*23)%37;rect(sx,sy,2,2,'#f4d2b7');}
 rect(x-11,194,133,8,'#b58b87');
 // Reflections move gently, but preserve the pixel style.
 rect(x+12+Math.sin(now/1700)*2,74,7,34,'#ffffff22');
}
function plant(x,y){
 rect(x-9,y-3,18,19,'#ab7773');rect(x-12,y-5,24,6,'#d69b8c');
 rect(x-3,y-43,6,43,'#405e4c');
 for(const [dx,dy] of [[-16,-31],[7,-46],[-8,-50],[17,-28],[-14,-22],[4,-24]])rect(x+dx,y+dy,19,12,'#59836a');
 for(const [dx,dy] of [[-13,-32],[5,-44],[8,-27]])rect(x+dx,y+dy,10,4,'#80a27c');
}
function seat(x,y,t){
 // tables have no interaction-blocking collision; click to sit.
 rect(x-50,y-9,100,36,'#5e3c48');rect(x-54,y-15,108,14,'#ad7b78');
 rect(x-43,y-21,86,7,'#d5a09a');
 rect(x-43,y+25,12,21,'#46333d');rect(x+30,y+25,12,21,'#46333d');
 rect(x-16,y-28,19,9,'#ead7ca');rect(x-17,y-30,21,3,'#fff0e1');
 rect(x-6,y-33,3,5,'#c99b90');
 rect(x+18,y-23,5,5,'#e8bb8f');
 rect(x+14,y-37,12,13,'#d69dae');
 txt('✿',x+20,y-29,13,'#f9c2d7');
}
function drawCharacter(x,y,cfg,step=0,dir='down'){
 const p=cfg||{};
 const skin=/^#[0-9a-f]{6}$/i.test(p.skin||'')?p.skin:'#e9c6a9';
 const hair=/^#[0-9a-f]{6}$/i.test(p.hair||'')?p.hair:'#794a43';
 const top=/^#[0-9a-f]{6}$/i.test(p.top||'')?p.top:'#a68cbd';
 const bottom=/^#[0-9a-f]{6}$/i.test(p.bottom||'')?p.bottom:'#393143';
 rect(x+1,y+26,18,4,'#271c28aa');
 rect(x+3,y+17+step,6,11,bottom);rect(x+11,y+17-step,6,11,bottom);
 rect(x+2,y+7,16,14,top);
 rect(x+3,y-3,15,14,skin);
 rect(x+1,y-7,18,8,hair);
 rect(x+1,y-4,4,15,hair);rect(x+16,y-4,4,15,hair);
 if(dir!=='up'){rect(x+6,y+4,2,2,'#30232b');rect(x+14,y+4,2,2,'#30232b');}
}
let avatar={};try{avatar=JSON.parse(localStorage.getItem('ciudadPersonaje')||'{}')||{}}catch{}
function scene(now){
 gameTime=now;
 // Walls and warm terracotta floor
 rect(0,0,W,H,'#ead1bb');
 for(let y=0;y<242;y+=40)rect(0,y,W,3,'#dab9a9');
 for(let x=0;x<W;x+=48)rect(x,0,2,242,'#e0bdaa');
 rect(0,236,W,H-236,'#b48b7f');
 for(let y=236;y<H;y+=51){
  rect(0,y,W,2,'#99736f');
  for(let x=(Math.floor(y/51)%2)*52;x<W;x+=104)rect(x,y,2,51,'#9a7971');
 }
 rect(0,224,W,15,'#744f59');rect(0,239,W,5,'#dfb4aa');
 // shelves, coffee counter, lights
 drawWindow(65,now);drawWindow(405,now);drawWindow(747,now);
 rect(244,62,137,125,'#815962');rect(253,72,119,107,'#4d3c4f');
 for(let i=0;i<3;i++){rect(253,93+i*37,119,6,'#c38e85');for(let j=0;j<6;j++){const cx=264+j*17;rect(cx,73+i*36,12,20, ['#efc29d','#b77971','#d7bf96'][j%3]);}}
 txt('C A F É  R E P Ú B L I C A',480,37,17,'#704459');
 rect(0,219,W,4,'#eacbb7');
 for(const x of [164,480,794]){
  rect(x-3,0,6,31,'#6d4c59');
  ctx.save();ctx.globalAlpha=.38+.1*Math.sin(now/600+x);
  ctx.fillStyle='#ffd7a3';ctx.beginPath();ctx.arc(x,42,36,0,Math.PI*2);ctx.fill();ctx.restore();
  rect(x-18,28,36,18,'#f3d3a8');rect(x-13,45,26,4,'#a87877');
 }
 plant(35,208);plant(918,209);
 // counter
 rect(285,212,388,93,'#5b414b');rect(287,220,382,79,'#895a62');
 for(let i=0;i<9;i++)rect(301+i*40,244,28,49,'#80535d');
 rect(271,199,418,20,'#d9a196');rect(271,215,418,9,'#a97474');
 // coffee equipment
 rect(335,159,79,39,'#454052');rect(342,166,65,27,'#a59aa4');
 rect(351,169,44,4,'#4b4051');rect(352,181,18,9,'#443d4b');rect(386,181,16,9,'#443d4b');
 for(let i=0;i<4;i++){const x=471+i*40;rect(x,179,20,19,'#e9d3b9');rect(x+4,174,11,6,'#d2a895');rect(x+20,183,5,8,'#e9d3b9');}
 txt('PIDE AQUÍ',481,240,12,'#ffecd8');
 // resident barista
 drawCharacter(580,160,{skin:'#c58f78',hair:'#342b37',top:'#e6bba3',bottom:'#47313e'},0,'down');
 txt('MILA ☕',591,144,10,'#553b4a');
 // tables and chairs
 for(const t of tables){
   rect(t.x-48,t.y+42,29,31,'#7b5365');rect(t.x+20,t.y+42,29,31,'#7b5365');
   seat(t.x,t.y,now);
 }
 // tiny guest reading near the windows
 drawCharacter(117,251,{skin:'#e8bb9e',hair:'#754944',top:'#5e786e',bottom:'#4c3d4c'},0,'down');
 rect(147,271,22,13,'#d5b6cb');rect(149,272,18,9,'#f4d9db');
 if(sittingAt>=0){
  const t=tables[sittingAt];
  drawCharacter(t.x-10,t.y+27,avatar,0,'down');
 }else{
  drawCharacter(player.x,player.y,avatar,player.step,player.dir);
 }
 // interactive guides
 ctx.save();ctx.globalAlpha=.7+.3*Math.sin(now/450);
 txt('✧',480,190,17,'#ffefbe');
 ctx.restore();
 requestAnimationFrame(scene);
}
function move(dt){
 if(sittingAt>=0||!document.hasFocus())return;
 let dx=0,dy=0;
 if(keys.has('ArrowLeft')||keys.has('a'))dx--;
 if(keys.has('ArrowRight')||keys.has('d'))dx++;
 if(keys.has('ArrowUp')||keys.has('w'))dy--;
 if(keys.has('ArrowDown')||keys.has('s'))dy++;
 if(dx||dy){
  const norm=Math.hypot(dx,dy),nx=player.x+dx/norm*3*dt,ny=player.y+dy/norm*3*dt;
  player.x=Math.max(26,Math.min(W-42,nx));
  player.y=Math.max(284,Math.min(H-51,ny));
  player.step=(Math.floor(gameTime/170)%2);
  if(dx)player.dir=dx<0?'left':'right';else player.dir=dy<0?'up':'down';
 }else player.step=0;
}
let prev=0;function updateLoop(now){const dt=Math.min(2,(now-prev||16)/16.66);prev=now;move(dt);requestAnimationFrame(updateLoop);}
function interact(){
 if(sittingAt>=0){sittingAt=-1;setStatus('Te levantaste. Qué rico estuvo el descanso ♡');return;}
 if(player.y<350&&player.x>250&&player.x<720){document.getElementById('orders').scrollIntoView({behavior:'smooth',block:'center'});setStatus('¡Mila te espera en la barra! Prepara un pedido ☕');return;}
 let chosen=-1,bestDist=1e9;
 tables.forEach((t,i)=>{const d=Math.hypot(player.x-t.x,player.y-t.y);if(d<bestDist){chosen=i;bestDist=d;}});
 if(bestDist<110){sittingAt=chosen;setStatus('Te sentaste a descansar un ratito. Pulsa E para levantarte ♡');}
 else setStatus('Acércate a una mesa o a la barra para interactuar ✧');
}
window.addEventListener('keydown',e=>{
 const tag=e.target&&e.target.tagName;if(['INPUT','SELECT','TEXTAREA','BUTTON'].includes(tag))return;
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','w','a','s','d','e','E'].includes(e.key)){e.preventDefault();}
 keys.add(e.key.length===1?e.key.toLowerCase():e.key);
 if(e.key.toLowerCase()==='e')interact();
});
window.addEventListener('keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));
window.addEventListener('blur',()=>keys.clear());
canvas.addEventListener('pointerdown',e=>{
 const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*W/r.width,y=(e.clientY-r.top)*H/r.height;
 if(y<312&&x>=270&&x<=700){sittingAt=-1;document.getElementById('orders').scrollIntoView({behavior:'smooth'});setStatus('¡Vamos a preparar algo rico! ☕');return;}
 let closest=-1,dist=120;
 tables.forEach((t,i)=>{const d=Math.hypot(x-t.x,y-t.y);if(d<dist){closest=i;dist=d;}});
 if(closest>=0){sittingAt=closest;setStatus('Te sentaste en una mesita. Toca el piso para levantarte ♡');return;}
 sittingAt=-1;player.x=Math.max(26,Math.min(W-42,x));player.y=Math.max(284,Math.min(H-51,y-18));setStatus('Explorando el Café República ✧');
});
$('sound-toggle').addEventListener('click',async()=>{
 ambientOn=!ambientOn;
 $('sound-toggle').textContent=ambientOn?'♫ Ambiente: on':'♫ Ambiente: off';
 $('sound-toggle').setAttribute('aria-pressed',String(ambientOn));
 // A tiny original ambient sound, only while explicitly enabled.
 if(ambientOn){
  try{
   audio=audio||new (window.AudioContext||window.webkitAudioContext)();
   await audio.resume();
   if(!window.__cafeAmbience){
    const o=audio.createOscillator(),gain=audio.createGain();
    o.type='sine';o.frequency.value=146.83;gain.gain.value=.012;
    o.connect(gain);gain.connect(audio.destination);o.start();
    window.__cafeAmbience={osc:o,gain};}
   window.__cafeAmbience.gain.gain.setTargetAtTime(.012,audio.currentTime,.15);
  }catch{ambientOn=false;}
 }else if(window.__cafeAmbience&&audio){window.__cafeAmbience.gain.gain.setTargetAtTime(0,audio.currentTime,.15);}
});
nextOrder();update();requestAnimationFrame(scene);requestAnimationFrame(updateLoop);
})();