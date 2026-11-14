(()=>{'use strict';const $=id=>document.getElementById(id),c=()=>window.CiudadCloud;
function status(){const s=c()?.state;if(!s)return;$('cloud-state').textContent=s.status;$('progress-auto').textContent=s.enabled?'Pausar respaldo automático':'Activar respaldo automático';}
window.addEventListener('ciudad-cloud-status',status);setTimeout(status,150);
const wrap=async f=>{try{await f();status()}catch(e){$('cloud-state').textContent=e.message;console.error(e)}};
$('progress-upload').onclick=()=>wrap(async()=>{if(!confirm('¿Guardar el progreso de este dispositivo en tu cuenta? Reemplazará el respaldo anterior de progreso (no la habitación).'))return;const r=await c().upload();$('cloud-state').textContent='Guardados '+r.count+' registros en la nube.'});
$('progress-download').onclick=()=>wrap(async()=>{if(!confirm('¿Recuperar el progreso de la nube? Se respaldará primero el progreso actual de este navegador.'))return;const r=await c().download();alert('Se recuperaron '+r.count+' registros. La página se actualizará.');location.reload()});
$('progress-auto').onclick=()=>wrap(async()=>{if(c().state.enabled)c().disable();else await c().enable();status()});
})();