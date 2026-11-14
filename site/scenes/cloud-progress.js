(()=>{'use strict';
const SB_URL='https://mqjprleqctafnhokxcyk.supabase.co';
const SB_KEY='sb_publishable_i9HKZXTtwrm709JyZ33rcg_OMe5oMp7';
const FLAG='ciudadCloudAutoEnabled';
const FIXED=new Set(['mallaFisica','ramosEnCurso','calificacionesUniversidad','agendaUniversidad','ciudadHorarioPersonal','ciudadV2Profiles','ciudadV2Current','ciudadPersonaje','ciudadModoNoche','ciudadAtelierV3','ciudadRoomV5','ciudadGachaMissions','libraryCustomBooks','pphyCapitulosLeidos']);
const PREFIXES=['ciudadV2Snapshot:','libraryProgress_','libraryStatus_','libraryTotal_','pphyCapituloLeido_'];
// Moneda, inventario y recompensas se migrarán a transacciones de servidor, no a un snapshot manipulable.
const allowed=k=>FIXED.has(k)||PREFIXES.some(p=>k.startsWith(p));
let client=null, current=null, dirty=false, busy=false, timer=null;
const state={signedIn:false,enabled:false,status:'Esperando sesión',lastSaved:null};
const emit=()=>window.dispatchEvent(new CustomEvent('ciudad-cloud-status',{detail:{...state}}));
function collect(){const data={}; for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(allowed(k)){const v=localStorage.getItem(k);if(v!==null)data[k]=v;}}return data;}
function hasLocal(){const s=collect();return Object.keys(s).some(k=>!['ciudadPersonaje','ciudadModoNoche','ciudadV2Profiles','ciudadV2Current'].includes(k));}
function validate(snapshot){if(!snapshot||typeof snapshot!=='object'||Array.isArray(snapshot))throw Error('La copia en nube no es válida.');
 const entries=Object.entries(snapshot);if(entries.length>450)throw Error('Demasiados registros en la copia.');let size=0;for(const [k,v] of entries){if(!allowed(k)||typeof v!=='string'||v.length>140000)throw Error('Registro inválido: '+k);size+=k.length+v.length;}if(size>300000)throw Error('La copia excede el tamaño permitido.');return snapshot;}
async function requireUser(){if(!client)throw Error('No cargó Supabase.');const {data,error}=await client.auth.getUser();if(error||!data?.user)throw Error('Inicia sesión desde Mi cuenta para sincronizar.');current=data.user;state.signedIn=true;emit();return current;}
async function remote(){const user=await requireUser();const {data,error}=await client.from('ciudad_progress').select('snapshot,revision,updated_at').eq('user_id',user.id).maybeSingle();if(error)throw error;return data;}
async function upload(){if(busy)throw Error('Hay otra sincronización en curso.');busy=true;try{const user=await requireUser();const snapshot=validate(collect());if(!Object.keys(snapshot).length)throw Error('No hay progreso personal para subir.');
 const {error}=await client.from('ciudad_progress').upsert({user_id:user.id,snapshot,updated_at:new Date().toISOString()},{onConflict:'user_id'});if(error)throw error;dirty=false;state.lastSaved=new Date().toISOString();state.status='Progreso guardado en nube';emit();return {count:Object.keys(snapshot).length};}
 finally{busy=false;}}
async function download(){if(busy)throw Error('Hay otra sincronización en curso.');busy=true;try{const r=await remote();if(!r?.snapshot||!Object.keys(r.snapshot).length)throw Error('Tu cuenta aún no tiene un respaldo del progreso.');const snap=validate(r.snapshot);
 const backup=JSON.stringify(collect());localStorage.setItem('ciudadCloudBackupBeforeRestore',backup);
 // Restore only allowed keys; older browser-only values remain in other systems.
 Object.keys(localStorage).filter(allowed).forEach(k=>localStorage.removeItem(k));
 for(const [k,v] of Object.entries(snap))localStorage.setItem(k,v);
 state.status='Progreso recuperado';state.lastSaved=r.updated_at;emit();return {count:Object.keys(snap).length};}
 finally{busy=false;}}
async function enable(){await requireUser();const r=await remote();if(r?.snapshot && Object.keys(r.snapshot).length && hasLocal()){
 const choice=confirm('Ya existe un respaldo en la nube y también tienes progreso en este navegador.\n\nAceptar: recuperar el respaldo de la nube (guardaremos copia local antes).\nCancelar: conservar este navegador y subirlo a la nube.');
 if(choice){await download();localStorage.setItem(FLAG,'1');location.reload();return;}
 await upload();
 }else if(r?.snapshot && Object.keys(r.snapshot).length){await download();localStorage.setItem(FLAG,'1');location.reload();return;}
 else if(hasLocal()){await upload();}
 localStorage.setItem(FLAG,'1');state.enabled=true;state.status='Respaldo automático activado';emit();}
function disable(){localStorage.removeItem(FLAG);state.enabled=false;state.status='Respaldo automático pausado';emit();}
function changes(){if(!state.enabled||!state.signedIn)return;const newData=JSON.stringify(collect());if(newData!==changes.last){dirty=true;changes.last=newData;}}
async function flush(){if(!state.enabled||!state.signedIn||!dirty||busy)return;try{await upload()}catch(e){state.status='Sin sincronizar: '+e.message;emit();}}
async function bootstrap(){
 const {data,error}=await client.auth.getUser();
 if(error||!data?.user){state.signedIn=false;state.status='Inicia sesión para sincronizar';emit();return;}
 current=data.user;state.signedIn=true;
 const r=await remote();const cloud=r?.snapshot&&Object.keys(r.snapshot).length?validate(r.snapshot):null;
 const local=collect();
 const meaningful=Object.entries(local).some(([k,v])=>{
  if(k==='mallaFisica'||k==='ramosEnCurso'){try{return JSON.parse(v).length>0;}catch{return false;}}
  if(k==='ciudadV2Profiles'){try{return JSON.parse(v).some(p=>p.curriculum||p.name!=='Mi universidad');}catch{return false;}}
  if(k==='ciudadV2Current'||k==='ciudadPersonaje'||k==='ciudadModoNoche')return false;
  if(k.startsWith('ciudadV2Snapshot:')){try{return Object.keys(JSON.parse(v)).some(x=>!['ciudadPersonaje','ciudadModoNoche'].includes(x));}catch{return false;}}
  return v!==''&&v!=='[]'&&v!=='{}';
 });
 if(cloud&&!meaningful){await download();state.status='Recuperado desde nube';emit();location.reload();return;}
 if(!cloud&&meaningful){await upload();state.status='Primer respaldo guardado';emit();}
 else if(cloud&&Object.entries(cloud).some(([k,v])=>local[k]!==v)){
  state.status='Hay datos locales y en nube: elige Guardar o Recuperar.';
  emit();return;
 }
 state.enabled=true;localStorage.setItem(FLAG,'1');
 state.status='Progreso sincronizado · automático';
 state.lastSaved=r?.updated_at||state.lastSaved;emit();
 changes.last=JSON.stringify(collect());
 if(timer)clearInterval(timer);
 timer=setInterval(async()=>{changes();await flush()},12000);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){changes();void flush();}});
}
const api={state,collect,remote,upload,download,enable,disable,bootstrap};window.CiudadCloud=api;
if(!window.supabase?.createClient){state.status='La conexión con Supabase no está disponible';emit();return;}
client=window.supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
(async()=>{try{await bootstrap();}catch(e){state.status='Sincronización pendiente: '+e.message;emit();console.error('Universidad nube:',e);}})();
})();
