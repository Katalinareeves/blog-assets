(()=>{'use strict';
const URL='https://mqjprleqctafnhokxcyk.supabase.co',KEY='sb_publishable_i9HKZXTtwrm709JyZ33rcg_OMe5oMp7';
const $=id=>document.getElementById(id),db=window.supabase?.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true}});
let uid='',users=[],links=[],homes=new Set(),busy=false;
function notice(s){$('notice').textContent=s}
function btn(s,fn){const b=document.createElement('button');b.textContent=s;b.onclick=fn;return b}
function anchor(s,href){const a=document.createElement('a');a.textContent=s;a.href=href;return a}
function empty(el,s){el.replaceChildren();const d=document.createElement('div');d.className='empty';d.textContent=s;el.append(d)}
function person(id){return users.find(u=>u.user_id===id)||{user_id:id,username:'jugador',display_name:'Jugador'}}
function rel(id){return links.find(r=>r.requester_id===id||r.recipient_id===id)}
function line(p,actions,tag=''){
 const div=document.createElement('article');div.className='friend';
 const face=document.createElement('div');face.className='friend-avatar';face.textContent='✳';
 const info=document.createElement('div');info.className='friend-info';
 const title=document.createElement('strong');title.textContent=String(p.display_name).slice(0,35);
 const sub=document.createElement('span');sub.textContent='@'+p.username+(tag?' · '+tag:'');
 info.append(title,sub);const area=document.createElement('div');area.className='friend-actions';area.append(...actions);
 div.append(face,info,area);return div;
}
function draw(){
 const accepted=links.filter(r=>r.status==='accepted'),pending=links.filter(r=>r.status==='pending');
 $('friend-count').textContent=accepted.length;
 $('request-count').textContent=pending.filter(r=>r.recipient_id===uid).length;
 const friends=$('friends'),requests=$('requests');friends.replaceChildren();requests.replaceChildren();
 for(const r of accepted){
  const id=r.requester_id===uid?r.recipient_id:r.requester_id,acts=[];
  if(homes.has(id))acts.push(anchor('Visitar hogar ↗','../habitacion/index.html?visitar='+encodeURIComponent(id)));
  acts.push(btn('Eliminar',()=>action('remove',r)));
  friends.append(line(person(id),acts,'amigo'));
 }
 for(const r of pending){
  const incoming=r.recipient_id===uid,id=incoming?r.requester_id:r.recipient_id;
  const acts=incoming?[btn('Aceptar',()=>action('accepted',r)),btn('Rechazar',()=>action('declined',r))]:[btn('Cancelar',()=>action('remove',r))];
  requests.append(line(person(id),acts,incoming?'te envió una solicitud':'solicitud enviada'));
 }
 if(!accepted.length)empty(friends,'Aún no tienes amigos. Busca a alguien por su usuario ♡');
 if(!pending.length)empty(requests,'No hay solicitudes pendientes.');
}
async function action(kind,r){
 if(busy)return;busy=true;
 try{
  let q;
  if(kind==='remove')q=await db.from('ciudad_friendships').delete().eq('id',r.id);
  else q=await db.from('ciudad_friendships').update({status:kind}).eq('id',r.id).eq('recipient_id',uid).eq('status','pending');
  if(q.error)throw q.error;
  await load();notice(kind==='accepted'?'¡Ya son amigos! ♡':'Solicitud actualizada.');
 }catch(e){notice(e.message)}finally{busy=false}
}
async function invite(p){
 if(busy||!uid)return;busy=true;
 try{
  const {error}=await db.from('ciudad_friendships').insert({requester_id:uid,recipient_id:p.user_id,status:'pending'});
  if(error)throw error;await load();search();notice('Solicitud enviada a @'+p.username+' ♡');
 }catch(e){notice(e.message)}finally{busy=false}
}
function search(){
 const value=$('search').value.trim().toLowerCase(),el=$('results');el.replaceChildren();
 if(value.length<2){empty(el,'Escribe al menos dos letras.');return;}
 const found=users.filter(p=>p.user_id!==uid&&(p.username.toLowerCase().includes(value)||p.display_name.toLowerCase().includes(value))).slice(0,12);
 for(const p of found){
  const r=rel(p.user_id),acts=[];
  if(!r)acts.push(btn('Agregar ♡',()=>invite(p)));
  else if(r.status==='pending'&&r.recipient_id===uid)acts.push(btn('Aceptar',()=>action('accepted',r)));
  else acts.push(btn(r.status==='accepted'?'Son amigos':'Solicitud '+(r.status==='pending'?'pendiente':'cerrada'),()=>{}));
  el.append(line(p,acts));
 }
 if(!found.length)empty(el,'No encontramos jugadores con ese nombre.');
}
async function load(){
 if(!db){notice('No se pudo cargar Supabase.');return;}
 try{
  const auth=await db.auth.getUser();if(auth.error||!auth.data.user){notice('Inicia sesión para buscar a tus amigos.');$('friends').replaceChildren(anchor('Abrir Mi cuenta ↗','../cuenta/index.html'));return;}
  uid=auth.data.user.id;
  const [a,b,c]=await Promise.all([
   db.from('ciudad_friendships').select('id,requester_id,recipient_id,status').limit(300),
   db.from('ciudad_profiles').select('user_id,username,display_name').limit(500),
   db.from('ciudad_rooms').select('user_id').eq('visibility','registered').limit(500)
  ]);
  for(const x of [a,b,c])if(x.error)throw x.error;
  links=a.data||[];users=b.data||[];homes=new Set((c.data||[]).map(x=>x.user_id));
  draw();notice('Listo para encontrarte con tus amigos ✳');
 }catch(e){console.error(e);notice('Error cargando amistades: '+e.message);}
}
$('demo').onclick=()=>{
 const list=$('friends');list.replaceChildren();
 const sample=[{display_name:'Amiga de ejemplo',username:'demo_fisica'},{display_name:'Compañero de ejemplo',username:'demo_particulas'}];
 for(const p of sample){
  const fake=btn('Ejemplo · no interactivo',()=>{notice('Esto es solo una demostración visual. No se envió ninguna solicitud.')});
  fake.disabled=true;
  list.append(line(p,[fake],'SIMULADO'));
 }
 $('friend-count').textContent='2 (demo)';
 const requests=$('requests');requests.replaceChildren();
 const fake=btn('Aceptar (demo)',()=>{notice('Demostración: para agregar un amigo real, busca su @usuario.')});fake.disabled=true;
 requests.append(line({display_name:'Solicitud de ejemplo',username:'demo_visitante'},[fake],'SIMULADO'));
 $('request-count').textContent='1 (demo)';
 notice('Vista de ejemplo: son perfiles ficticios. No se modificó tu cuenta ni la base de datos.');
};
$('find').onclick=search;$('search').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();search()}};
$('refresh').onclick=load;
void load().then(()=>{const q=new URLSearchParams(location.search).get('usuario');if(q){$('search').value=q;search()}});
})();