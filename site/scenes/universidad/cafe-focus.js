/* Universidad · bloque breve de concentración vinculado a Café República. */
(()=>{'use strict';
const $=id=>document.getElementById(id),w=window.CiudadBienestar;if(!w||!$('cafe-study-start'))return;
const DURATION=10*60*1000;let elapsed=0,active=false,last=performance.now();
function show(){
 const left=Math.max(0,DURATION-elapsed),seconds=Math.ceil(left/1000);
 $('cafe-study-time').textContent=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
 const v=w.get(),focus=$('cafe-study-buff');
 focus.textContent=v.focusActive?'✧ Concentración del Café activa: completar el bloque devuelve +10 de ánimo.':'Completar el bloque devuelve +5 de ánimo. El Café República puede duplicar ese bonus.';
}
function stop(){
 active=false;elapsed=0;$('cafe-study-start').hidden=false;$('cafe-study-stop').hidden=true;last=performance.now();show();
}
$('cafe-study-start').onclick=()=>{active=true;last=performance.now();$('cafe-study-start').hidden=true;$('cafe-study-stop').hidden=false;$('cafe-study-message').textContent='Tu bloque está en marcha. No se cuentan minutos mientras la pestaña esté oculta.';};
$('cafe-study-stop').onclick=()=>{stop();$('cafe-study-message').textContent='Bloque detenido. Puedes empezar otro cuando quieras.';};
document.addEventListener('visibilitychange',()=>{last=performance.now();});
setInterval(()=>{
 const now=performance.now(),dt=Math.max(0,Math.min(1500,now-last));last=now;
 if(active&&!document.hidden){
  elapsed+=dt;
  if(elapsed>=DURATION){
   const bonus=w.get().focusActive?10:5;w.change({mood:bonus});
   stop();$('cafe-study-message').textContent='¡Bloque completado! ✨ Recuperaste '+bonus+' puntos de ánimo.';return;
  }
 }
 show();
},1000);
w.onChange(show);show();
})();