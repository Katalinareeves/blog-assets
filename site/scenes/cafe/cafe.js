/* Café República · La Ciudad. Interior original pixel art + mini juego local. */
(()=>{'use strict';
const $=id=>document.getElementById(id),canvas=$('cafe-scene'),ctx=canvas.getContext('2d');
const W=960,H=530,saveKey='ciudadCafeRecordV1';
const player={x:460,y:402,w:19,h:29,dir:'down',step:0,seat:false};
const keys=new Set(),tables=[{x:190,y:335},{x:375,y:335},{x:690,y:335},{x:825,y:335}];
let raf=0,last=0,gameTime=0,orderIndex=0,served=0,best=0,toastAt=0,sittingAt=-1,ambientOn=false,audio=null,lastRestAt=0;
try{best=Math.max(0,Number(localStorage.getItem(saveKey))||0)}catch{}
const wellbeing=window.CiudadBienestar;
const menuItems=[
 {id:'sopaipilla',icon:'🥟',name:'Sopaipilla con pebre',detail:'Un clásico después de clases',effect:'+25 hambre · +5 ánimo',delta:{hunger:25,mood:5},focus:0},
 {id:'sandwich',icon:'🥪',name:'Sándwich vegetariano',detail:'Palta, tomate y queso',effect:'+34 hambre · +6 energía',delta:{hunger:34,energy:6},focus:0},
 {id:'tecito',icon:'🍵',name:'Tecito calentito',detail:'Para sentarse a conversar',effect:'+9 energía · +15 ánimo',delta:{energy:9,mood:15},focus:0},
 {id:'cafe',icon:'☕',name:'Café con leche',detail:'Una pausa antes de estudiar',effect:'+18 energía · +6 ánimo · concentración 20 min',delta:{energy:18,mood:6},focus:20}
];
function needsUI(v){
 for(const k of ['hunger','energy','mood']){
  const el=$(k+'-bar'),label=$(k+'-value');
  if(el)el.style.width=v[k]+'%';
  if(label)label.textContent=v[k]+'%';
 }
 const label=$('focus-status');
 if(label)label.textContent=v.focusActive?'✧ Concentración activa · '+Math.ceil((v.focusUntil-Date.now())/60000)+' min':'✧ Sin efecto de concentración';
}
if(wellbeing)wellbeing.onChange(needsUI);
function takeFood(item){
 if(!wellbeing)return;
 wellbeing.change(item.delta,item.focus);
 const feedback=$('food-feedback');
 feedback.textContent=item.icon+' Disfrutaste '+item.name.toLowerCase()+'. '+item.effect+'. Puedes seguir explorando ♡';
 setStatus('¡Qué rico! '+item.name+' en Café República ☕');
 toastAt=performance.now();
}
function drawMenu(){
 const container=$('food-grid');if(!container)return;
 for(const item of menuItems){
  const card=document.createElement('article');card.className='food-item';
  const emoji=document.createElement('div');emoji.className='food-emoji';emoji.textContent=item.icon;
  const title=document.createElement('strong');title.textContent=item.name;
  const desc=document.createElement('small');desc.textContent=item.detail;
  const effect=document.createElement('small');effect.className='effect';effect.textContent=item.effect;
  const buy=document.createElement('button');buy.type='button';buy.textContent='Pedir · gratis';buy.addEventListener('click',()=>takeFood(item));
  card.append(emoji,title,desc,effect,buy);container.append(card);
 }
}
drawMenu();
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
  if(wellbeing)wellbeing.change({mood:3,energy:1});
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
/* El interior usa la misma gramática gráfica de República:
 * rectángulos enteros, fachadas patrimoniales, marcos de piedra y ventanas azul oscuro.
 */
function drawWindow(x,night){
 rect(x-5,39,123,147,'#ae9b74');rect(x,44,113,137,'#d8c898');
 rect(x+9,55,94,114,night?'#14253b':'#294b63');
 rect(x+12,58,88,108,night?'#21334d':'#8ec8dc');
 rect(x+51,55,6,114,'#c6b68a');rect(x+9,108,94,5,'#c6b68a');
 rect(x+4,169,106,9,'#ad9a74');
 for(let i=0;i<5;i++){
   const xx=x+18+i*16;
   rect(xx,147+(i%2)*5,7,8,night?'#b9a78c':'#466a70');
 }
 // Avenida República, de noche o de día, vista desde el local.
 rect(x+21,161,52,4,night?'#9d89ab':'#d7c299');
}
function plant(x,y){
 rect(x-8,y-7,16,20,'#926959');rect(x-11,y-8,22,5,'#bf9274');
 rect(x-3,y-45,6,38,'#3e593c');
 for(const [dx,dy] of [[-14,-30],[7,-38],[-9,-48],[2,-54],[9,-22]])rect(x+dx,y+dy,15,14,'#315332');
 for(const [dx,dy] of [[-11,-29],[4,-40],[4,-24]])rect(x+dx,y+dy,8,5,'#52794b');
}
function seat(x,y){
 // Mesas más pequeñas que antes; personajes conservan el tamaño de la plaza.
 rect(x-36,y+22,15,21,'#38313a');rect(x+21,y+22,15,21,'#38313a');
 rect(x-43,y-6,86,13,'#806653');rect(x-39,y-10,78,8,'#b29672');
 rect(x-30,y+6,8,27,'#6d4d43');rect(x+22,y+6,8,27,'#6d4d43');
 rect(x-15,y-15,13,6,'#efe0c4');rect(x-16,y-18,14,4,'#faf0d9');
 rect(x+15,y-13,8,8,'#7e624d');rect(x+17,y-16,3,5,'#a78b6a');
}
function drawCharacter(x,y,cfg,step=0,dir='down'){
 const p=cfg||{},ok=v=>/^#[0-9a-f]{6}$/i.test(v||'');
 const skin=ok(p.skin)?p.skin:'#e9c6a9',hair=ok(p.hair)?p.hair:'#794a43';
 const top=ok(p.top)?p.top:'#a68cbd',bottom=ok(p.bottom)?p.bottom:'#393143';
 rect(x+1,y+26,18,4,'#211a2855');
 rect(x+3,y+17+step,6,11,bottom);rect(x+11,y+17-step,6,11,bottom);
 rect(x+2,y+7,16,14,top);rect(x+3,y-3,15,14,skin);
 rect(x+1,y-7,18,8,hair);rect(x+1,y-4,4,15,hair);rect(x+16,y-4,4,15,hair);
 if(dir!=='up'){rect(x+6,y+4,2,2,'#30232b');rect(x+14,y+4,2,2,'#30232b');}
}
let avatar={};
try{avatar=JSON.parse(localStorage.getItem('ciudadPersonaje')||'{}')||{}}catch{}
const night=()=>{try{return localStorage.getItem('ciudadModoNoche')==='1'}catch{return false}};
function scene(now){
 gameTime=now;
 const isNight=night();
 const wall=isNight?'#81746f':'#c8b888';
 // Interior patrimonial inspirado en el propio motor de República.
 rect(0,0,W,H,isNight?'#282037':'#c8b888');
 rect(0,0,W,205,wall);
 for(let x=0;x<W;x+=68){rect(x,0,2,206,isNight?'#756674':'#b8a77f');}
 for(let y=0;y<206;y+=47){rect(0,y,W,2,isNight?'#756674':'#b4a375');}
 rect(0,204,W,12,isNight?'#554657':'#a28c69');
 rect(0,216,W,H-216,isNight?'#2f2b34':'#6b6960');
 for(let y=216;y<H;y+=28){
   rect(0,y,W,2,isNight?'#292431':'#54564f');
   for(let x=(Math.floor(y/28)%2)*25;x<W;x+=50)rect(x,y,1,28,isNight?'#38323d':'#5a5b51');
 }
 drawWindow(49,isNight);drawWindow(411,isNight);drawWindow(780,isNight);
 // Molduras, vigas, azulejos y estantería: sin elementos modernos ni brillos.
 rect(0,10,W,10,isNight?'#a68c79':'#dcc898');
 rect(0,198,W,6,isNight?'#ab8e76':'#dfc797');
 rect(227,49,135,130,isNight?'#51414a':'#a58d65');
 rect(234,57,121,115,'#342d36');
 for(let i=0;i<3;i++){
   rect(236,83+i*31,117,5,'#9c8169');
   for(let j=0;j<6;j++){const xx=242+j*18;rect(xx,62+i*31,12,20,['#d0ac81','#a47563','#c8b58f'][j%3]);}
 }
 rect(368,26,223,28,'#302633');
 rect(373,30,213,19,'#b59d7b');
 txt('C A F É   R E P Ú B L I C A',478,44,13,'#29212c');
 // Faroles cálidos al nivel de la escala del juego.
 for(const x of [176,476,790]){
   rect(x-2,0,4,22,'#554b44');rect(x-16,20,32,13,'#bca16c');
   rect(x-10,32,20,4,isNight?'#f1c471':'#d3bf92');
 }
 plant(26,213);plant(930,217);
 // Caja y barra, con equipamiento mínimo.
 rect(275,216,409,86,'#4c4141');rect(283,228,393,67,'#766452');
 for(let i=0;i<9;i++)rect(296+i*43,235,30,54,'#685547');
 rect(267,202,426,20,'#cfb38b');rect(270,220,419,7,'#a58b6e');
 rect(327,163,62,35,'#383641');rect(333,169,50,24,'#87868a');
 rect(343,173,31,4,'#2c2831');rect(347,187,13,5,'#3b2e35');
 for(let i=0;i<4;i++){const xx=443+i*42;rect(xx,185,15,14,'#e1d5bb');rect(xx+2,179,11,7,'#c7ae95');}
 txt('PEDIDOS  →',475,251,12,'#f5e2c1');
 // Mila, siempre con la escala del personaje original.
 drawCharacter(575,168,{skin:'#c58f78',hair:'#342b37',top:'#e6bba3',bottom:'#47313e'});
 txt('MILA',586,152,9,'#684857');
 // Piso, sillas y clientela, ubicados en la zona caminable.
 for(const t of tables){seat(t.x,t.y);}
 drawCharacter(115,300,{skin:'#e8bb9e',hair:'#754944',top:'#5e786e',bottom:'#4c3d4c'});
 rect(143,319,20,12,'#dad1bd');rect(145,320,17,9,'#f2e8d0');
 if(sittingAt>=0){
  const t=tables[sittingAt];drawCharacter(t.x-9,t.y+23,avatar,0,'down');
 }else drawCharacter(player.x,player.y,avatar,player.step,player.dir);
 if(window.CiudadCafeOnline?.draw)window.CiudadCafeOnline.draw(ctx,drawCharacter);
 if(now-toastAt<1500){txt('✧',480,188,16,'#fff0ae');}
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
function restAt(index){
 sittingAt=index;
 // 3 puntos de ánimo por descanso, máximo una vez cada 3 minutos.
 if(wellbeing&&(Date.now()-lastRestAt>3*60*1000)){
  wellbeing.change({mood:3});lastRestAt=Date.now();
 }
 setStatus('Te sentaste a descansar. Pulsa E o toca el suelo para levantarte ♡');
}
function interact(){
 if(sittingAt>=0){sittingAt=-1;setStatus('Te levantaste. Qué rico estuvo el descanso ♡');return;}
 if(player.y<350&&player.x>250&&player.x<720){document.getElementById('orders').scrollIntoView({behavior:'smooth',block:'center'});setStatus('¡Mila te espera en la barra! Prepara un pedido ☕');return;}
 let chosen=-1,bestDist=1e9;
 tables.forEach((t,i)=>{const d=Math.hypot(player.x-t.x,player.y-t.y);if(d<bestDist){chosen=i;bestDist=d;}});
 if(bestDist<110){restAt(chosen);}
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
 if(closest>=0){restAt(closest);return;}
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
window.CiudadCafeBridge={
 getState:()=>{const t=tables[sittingAt];return {x:Math.round(t?t.x-9:player.x),y:Math.round(t?t.y+23:player.y),dir:player.dir,step:player.step,avatar}},
 getUserName:()=>String(avatar.nombre||'Visitante').slice(0,20)
};
nextOrder();update();requestAnimationFrame(scene);requestAnimationFrame(updateLoop);
})();