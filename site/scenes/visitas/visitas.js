/* La Ciudad · vecindario. La autorización real se aplica con RLS en Supabase. */
(()=>{'use strict';
const URL='https://mqjprleqctafnhokxcyk.supabase.co',KEY='sb_publishable_i9HKZXTtwrm709JyZ33rcg_OMe5oMp7';
const $=id=>document.getElementById(id), db=window.supabase?.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true}});
let records=[];
const message=x=>{$('message').textContent=x};
function render(){
 const root=$('homes');root.replaceChildren();
 const term=$('search-player').value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const filtered=records.filter(p=>(p.display_name+' '+p.username).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(term));
 for(const p of filtered){
  const card=document.createElement('article');card.className='home';
  const mark=document.createElement('span');mark.className='mark';mark.textContent='⌂';
  const name=document.createElement('h2');name.textContent=p.display_name;
  const alias=document.createElement('p');alias.textContent='@'+p.username;
  const link=document.createElement('a');link.href='../habitacion/index.html?visitar='+encodeURIComponent(p.user_id);link.textContent='Visitar habitación ↗';
  card.append(mark,name,alias,link);root.append(card);
 }
 message(records.length?filtered.length+' habitación(es) visibles':'No hay habitaciones abiertas a visitas todavía.');
}
async function load(){
 if(!db){message('No se cargó la conexión.');return;}
 try{
  const {data:{user},error:authError}=await db.auth.getUser();
  if(authError||!user){message('Inicia sesión para ver las habitaciones abiertas.');const a=document.createElement('a');a.href='../cuenta/index.html';a.textContent='Iniciar sesión ↗';$('homes').replaceChildren(a);return;}
  message('Buscando puertas abiertas…');
  const [{data:rooms,error:roomsError},{data:profiles,error:profilesError}]=await Promise.all([
   db.from('ciudad_rooms').select('user_id').eq('visibility','registered').limit(150),
   db.from('ciudad_profiles').select('user_id,username,display_name').limit(250)
  ]);
  if(roomsError)throw roomsError;if(profilesError)throw profilesError;
  const ids=new Set((rooms||[]).map(r=>r.user_id));
  records=(profiles||[]).filter(p=>ids.has(p.user_id)).sort((a,b)=>a.display_name.localeCompare(b.display_name,'es'));
  render();
 }catch(e){console.error(e);message('No se pudo cargar el vecindario: '+e.message);}
}
$('search-player').addEventListener('input',render);
$('refresh').addEventListener('click',load);
void load();
})();