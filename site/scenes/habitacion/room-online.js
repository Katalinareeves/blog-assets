/* Presencia online por habitación. La autorización está en políticas RLS Realtime. */
(()=>{'use strict';
const API='https://mqjprleqctafnhokxcyk.supabase.co';
const KEY='sb_publishable_i9HKZXTtwrm709JyZ33rcg_OMe5oMp7';
const view=window.CiudadRoomBridge;
const badge=document.getElementById('room-online-count');
const label=document.getElementById('room-online-status');
if(!view||!badge||!window.supabase?.createClient)return;
const db=window.supabase.createClient(API,KEY,{auth:{persistSession:true,autoRefreshToken:true}});
const HEX=/^#[0-9a-f]{6}$/i,validDir=x=>['down','left','right','up'].includes(x)?x:'down';
const safeAvatar=a=>{
 const out={skin:'#f6e7db',hair:'#ab653c',top:'#1c1c1c',bottom:'#141414',accent:'#4fd8ff',style:'largo'};
 if(a&&typeof a==='object'){
  for(const key of ['skin','hair','top','bottom','accent'])if(HEX.test(a[key]))out[key]=a[key];
  if(['largo','corto','cola'].includes(a.style))out.style=a.style;
 }
 return out;
};
const remote=new Map();
let channel=null,me='',owner='',name='',lastSent='',lastAt=0,connected=false;
const note=x=>{label.textContent=x;};
function updateCount(){badge.textContent=(remote.size+(connected?1:0))+' en la habitación';}
function snapshot(){
 const p=view.getPosition();
 let avatar={};
 try{avatar=JSON.parse(localStorage.getItem('ciudadPersonaje')||'{}')}catch{}
 return {x:Math.min(2250,Math.max(30,Number(p.x)||300)),dir:validDir(p.dir),step:p.step===1?1:0,avatar:safeAvatar(avatar)};
}
function sync(){
 if(!channel)return;
 const active=new Set();
 for(const members of Object.values(channel.presenceState())){
  for(const item of members){
   const id=String(item?.user_id||'');if(!id||id===me)continue;
   active.add(id);
   const p=item.position||{};
   const prev=remote.get(id)||{};
   remote.set(id,{...prev,name:String(item.name||prev.name||'Visitante').slice(0,25),position:prev.position||{
    x:Math.min(2250,Math.max(30,Number(p.x)||300)),dir:validDir(p.dir),step:p.step===1?1:0,avatar:safeAvatar(p.avatar)
   }});
  }
 }
 for(const id of remote.keys())if(!active.has(id))remote.delete(id);
 updateCount();
}
function onMove(payload){
 if(!payload||!remote.has(payload.user_id))return;
 const peer=remote.get(payload.user_id),p=payload.position;
 if(!p||typeof p!=='object')return;
 peer.position={x:Math.min(2250,Math.max(30,Number(p.x)||300)),dir:validDir(p.dir),step:p.step===1?1:0,avatar:safeAvatar(p.avatar)};
}
function draw(ctx,drawCharacter){
 for(const peer of remote.values()){
  const p=peer.position;if(!p)continue;
  ctx.save();
  ctx.translate(Math.round(p.x-22),308);
  ctx.scale(2.45,2.45);
  drawCharacter(ctx,{x:0,y:7,w:18,h:25,dir:p.dir,step:p.step},p.avatar);
  ctx.restore();
  const x=p.x,txt=peer.name;
  ctx.font='bold 15px system-ui';ctx.textAlign='center';
  const width=Math.min(190,ctx.measureText(txt).width+18);
  ctx.fillStyle='#231b32dd';ctx.fillRect(x-width/2,280,width,24);
  ctx.fillStyle='#f5eaff';ctx.fillText(txt,x,297,180);
 }
}
function send(force=false){
 if(!channel||!connected)return;
 const now=Date.now(),p=snapshot(),value=JSON.stringify(p);
 if(!force&&now-lastAt<180)return;
 if(!force&&value===lastSent&&now-lastAt<1800)return;
 lastAt=now;lastSent=value;
 channel.send({type:'broadcast',event:'walk',payload:{user_id:me,position:p}}).catch(()=>{});
}
async function connect(){
 try{
  const {data:{user},error}=await db.auth.getUser();
  if(error||!user){note('Inicia sesión para ver a otros jugadores');return;}
  me=user.id;owner=view.visiting?view.visitId:me;
  if(!owner){note('No se encontró la habitación');return;}
  const {data:room,error:roomError}=await db.from('ciudad_rooms').select('visibility').eq('user_id',owner).maybeSingle();
  if(roomError||!room){note('Esta habitación no está disponible online');return;}
  if(view.visiting&&room.visibility!=='registered'){note('Esta habitación es privada');return;}
  const {data:profile}=await db.from('ciudad_profiles').select('display_name').eq('user_id',me).maybeSingle();
  name=String(profile?.display_name||'Jugador').slice(0,25);
  await db.realtime.setAuth();
  const c=db.channel('ciudad:habitacion:'+owner,{config:{private:true,presence:{key:crypto.randomUUID()},broadcast:{self:false}}});
  channel=c;
  c.on('presence',{event:'sync'},sync);
  c.on('broadcast',{event:'walk'},({payload})=>onMove(payload));
  c.subscribe(async status=>{
   if(status==='SUBSCRIBED'){
    connected=true;note('Visitas online activas');
    await c.track({user_id:me,name,position:snapshot()});
    sync();send(true);
   }else if(['CHANNEL_ERROR','TIMED_OUT'].includes(status)){connected=false;note('Sin conexión online · la habitación sigue disponible');}
   else if(status==='CLOSED'){connected=false;remote.clear();updateCount();}
  });
 }catch(e){note('Online no disponible');console.warn('Ciudad Room Online',e);}
}
window.CiudadRoomOnline={draw};
setInterval(send,140);
window.addEventListener('pagehide',()=>{if(channel)void channel.untrack();});
void connect();
})();