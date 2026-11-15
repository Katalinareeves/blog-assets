/* La Ciudad · República viva: escenografía ambiental a tamaño de pantalla.
 * El motor 640x480, las colisiones, los grafitis y la navegación NO se transforman.
 */
(()=>{
'use strict';
const source=document.getElementById('gameCanvas');
const ambient=document.getElementById('city-ambient');
const button=document.getElementById('city-fullscreen');
if(!source||!ambient)return;
const ctx=ambient.getContext('2d',{alpha:false});
let lastWidth=0,lastHeight=0;
function size(){
 const ratio=Math.min(1.4,window.devicePixelRatio||1);
 const w=Math.max(1,Math.round(window.innerWidth*ratio));
 const h=Math.max(1,Math.round(window.innerHeight*ratio));
 if(w!==lastWidth||h!==lastHeight){ambient.width=w;ambient.height=h;lastWidth=w;lastHeight=h;}
}
function draw(){
 if(document.hidden)return;
 size();
 const w=ambient.width,h=ambient.height;
 const sw=source.width,sh=source.height;
 const scale=Math.max(w/sw,h/sh)*1.07;
 const dw=sw*scale,dh=sh*scale;
 ctx.fillStyle='#181625';ctx.fillRect(0,0,w,h);
 // Imagen viva al fondo: prolonga la paleta del escenario real sin duplicar las interacciones.
 ctx.imageSmoothingEnabled=false;
 ctx.drawImage(source,(w-dw)/2,(h-dh)/2,dw,dh);
 // Velo suave para que el área jugable conserve todo el protagonismo.
 const g=ctx.createLinearGradient(0,0,0,h);
 g.addColorStop(0,'rgba(14,12,25,.36)');
 g.addColorStop(.5,'rgba(12,9,22,.47)');
 g.addColorStop(1,'rgba(11,9,22,.65)');
 ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
}
window.addEventListener('resize',size);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)draw()});
let last=0;
function tick(now){
 if(now-last>160){draw();last=now;}
 requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
if(button){
 button.addEventListener('click',async()=>{
  try{
   if(document.fullscreenElement)await document.exitFullscreen();
   else await document.documentElement.requestFullscreen();
  }catch(e){console.warn('Pantalla completa no disponible',e);}
 });
 document.addEventListener('fullscreenchange',()=>{
  const active=!!document.fullscreenElement;
  button.textContent=active?'⤢':'⛶';
  button.title=active?'Salir de pantalla completa':'Pantalla completa';
  button.setAttribute('aria-label',button.title);
 });
}
})();