/* La Ciudad · bienestar suave v1
 * Estado local compartido entre República y Café. Sin semillas, servidor ni castigo al desconectar.
 */
(()=>{'use strict';
 const KEY='ciudadBienestarV1';
 const clamp=n=>Math.max(0,Math.min(100,Math.round(Number(n)||0)));
 const defaults=()=>({hunger:78,energy:74,mood:82,focusUntil:0,updatedAt:Date.now()});
 let data=defaults();
 try{
  const parsed=JSON.parse(localStorage.getItem(KEY)||'null');
  if(parsed&&typeof parsed==='object'){
   for(const k of ['hunger','energy','mood'])if(Number.isFinite(Number(parsed[k])))data[k]=clamp(parsed[k]);
   if(Number.isFinite(Number(parsed.focusUntil)))data.focusUntil=Number(parsed.focusUntil);
  }
 }catch{}
 // No restamos nada por el tiempo transcurrido en páginas cerradas o pestañas ocultas.
 let lastActive=performance.now(),remainder={hunger:0,energy:0,mood:0};
 const cadence={hunger:14*60*1000,energy:18*60*1000,mood:24*60*1000};
 const listeners=new Set();
 function emit(){for(const f of listeners){try{f(get())}catch(e){console.warn(e)}}}
 function save(){try{localStorage.setItem(KEY,JSON.stringify({...data,updatedAt:Date.now()}))}catch{}emit()}
 function get(){return {hunger:data.hunger,energy:data.energy,mood:data.mood,focusUntil:data.focusUntil,focusActive:data.focusUntil>Date.now()}}
 function change(deltas,focusMinutes=0){
  for(const k of ['hunger','energy','mood'])if(Number.isFinite(deltas?.[k]))data[k]=clamp(data[k]+deltas[k]);
  if(focusMinutes>0)data.focusUntil=Math.min(Date.now()+30*60*1000,Math.max(data.focusUntil,Date.now())+Math.min(focusMinutes,30)*60*1000);
  save();return get();
 }
 function onChange(fn){listeners.add(fn);fn(get());return ()=>listeners.delete(fn)}
 function tick(){
  const now=performance.now(),elapsed=Math.max(0,Math.min(30000,now-lastActive));lastActive=now;
  if(document.hidden)return;
  let changed=false;
  for(const k of ['hunger','energy','mood']){
   remainder[k]+=elapsed;
   if(remainder[k]>=cadence[k]){const n=Math.floor(remainder[k]/cadence[k]);remainder[k]%=cadence[k];data[k]=clamp(data[k]-n);changed=true;}
  }
  if(changed)save();else emit();
 }
 setInterval(tick,15000);
 document.addEventListener('visibilitychange',()=>{lastActive=performance.now()});
 window.CiudadBienestar={get,change,onChange};
})();