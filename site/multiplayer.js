/* La Ciudad · Plaza multijugador alpha
 * Supabase Realtime private: Presence para conexión, Broadcast para movimiento.
 * No incluye datos académicos, claves privadas ni acceso a El Jardín.
 */
'use strict';
(()=>{
const URL='https://mqjprleqctafnhokxcyk.supabase.co';
const KEY='sb_publishable_i9HKZXTtwrm709JyZ33rcg_OMe5oMp7';
const TOPIC='ciudad:mapa:v1';
const node=document.getElementById('ciudad-online-status');
const count=document.getElementById('ciudad-online-count');
const button=document.getElementById('ciudad-online-action');
const list=document.getElementById('ciudad-online-players');
const remote=new Map();
let db=null,channel=null,uid='',connected=false,nick='',lastSent='',lastSendTime=0;
const tell=message=>{if(node)node.textContent=message;};
const limit=(n,min,max)=>Math.max(min,Math.min(max,Number(n)||0));
const safeName=x=>String(x||'Visitante').slice(0,24).replace(/[<>\n\r]/g,'');
const currentState=()=>({x:Math.round(player.x),y:Math.round(player.y),dir:player.dir,step:player.step,
 avatar:{skin:character.skin,hair:character.hair,top:character.top,bottom:character.bottom,accent:character.accent,style:character.style},
 name:nick,at:Date.now()});
function refresh(){
 const peers=[...remote.values()].filter(x=>x.online);
 if(count)count.textContent=String(peers.length+(connected?1:0));
 if(!list)return;
 list.replaceChildren();
 if(!connected)return;
 for(const peer of peers.slice(0,15)){const chip=document.createElement('span');chip.textContent=peer.name;list.append(chip);}
 if(peers.length>15){const chip=document.createElement('span');chip.textContent='+'+(peers.length-15);list.append(chip);}
}
function presenceSync(){
 if(!channel)return;
 const state=channel.presenceState();
 const live=new Set();
 for(const [key,items] of Object.entries(state)){
   if(!Array.isArray(items))continue;
   for(const item of items){
     const who=String(item?.user_id||key);
     if(who===uid||!who)continue;
     live.add(who);
     const prev=remote.get(who)||{x:80,y:390,dir:'down',step:0,name:'Jugador',avatar:null};
     prev.online=true;prev.name=safeName(item?.name||prev.name);
     remote.set(who,prev);
   }
 }
 for(const [key,peer] of remote)if(!live.has(key))remote.delete(key);
 refresh();
}
function updatePeer(payload){
 if(!payload||typeof payload!=='object')return;
 const who=String(payload.user_id||'');
 if(!who||who===uid||!remote.has(who))return;
 const peer=remote.get(who);
 const next=payload.position||{};
 peer.x=limit(next.x,16,606);peer.y=limit(next.y,16,439);
 peer.dir=['up','down','left','right'].includes(next.dir)?next.dir:'down';
 peer.step=next.step===1?1:0;
 if(next.avatar&&typeof next.avatar==='object'){
  const a=next.avatar;
  peer.avatar=sanitizeChar({skin:a.skin,hair:a.hair,top:a.top,bottom:a.bottom,accent:a.accent,style:a.style});
 }
 peer.seen=Date.now();
}
function draw(){
 if(!connected)return;
 for(const peer of remote.values()){
  if(!peer.online||!peer.avatar||!Number.isFinite(peer.x)||!Number.isFinite(peer.y))continue;
  ctx.save();
  drawCharacter(ctx,{x:peer.x,y:peer.y,w:18,h:25,dir:peer.dir,step:peer.step},peer.avatar);
  const label=peer.name||'Jugador';
  ctx.font='7px monospace';ctx.textAlign='center';
  const w=Math.min(135,ctx.measureText(label).width+9);
  const x=peer.x+9,y=peer.y-12;
  ctx.fillStyle='rgba(18,21,33,.88)';ctx.fillRect(x-w/2,y-9,w,12);
  ctx.fillStyle='#f4eafb';ctx.fillText(label,x,y,130);
  ctx.restore();
 }
}
function sendPosition(force=false){
 if(!connected||!channel)return;
 const now=Date.now();
 if(!force&&now-lastSendTime<125)return;
 const position=currentState();
 const serialized=JSON.stringify(position);
 if(!force&&lastSent===serialized)return;
 lastSent=serialized;lastSendTime=now;
 channel.send({type:'broadcast',event:'move',payload:{user_id:uid,position}}).catch(()=>{});
}
async function connect(){
 if(connected||channel)return;
 if(!window.supabase?.createClient){tell('No se pudo cargar la conexión online');return;}
 button.disabled=true;tell('Comprobando tu cuenta…');
 try{
  db=window.supabase.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true}});
  const {data,error}=await db.auth.getUser();
  if(error||!data?.user){tell('Para jugar online necesitas iniciar sesión');button.textContent='Iniciar sesión';button.onclick=()=>location.href='scenes/cuenta/index.html?return=plaza';button.disabled=false;return;}
  uid=data.user.id;
  const profile=await db.from('ciudad_profiles').select('display_name').eq('user_id',uid).maybeSingle();
  if(profile.error)throw profile.error;
  nick=safeName(profile.data?.display_name||character.nombre||'Jugador');
  await db.realtime.setAuth();
  const instance=crypto.randomUUID();
  channel=db.channel(TOPIC,{config:{private:true,presence:{key:instance},broadcast:{self:false,ack:false}}});
  channel.on('presence',{event:'sync'},presenceSync);
  channel.on('broadcast',{event:'move'},({payload})=>updatePeer(payload));
  channel.subscribe(async status=>{
    if(status==='SUBSCRIBED'){
      connected=true;button.disabled=false;button.textContent='Salir del online';
      tell('Conectada a la plaza · movimiento en tiempo real');
      await channel.track({user_id:uid,name:nick});
      presenceSync();sendPosition(true);refresh();
    }else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){
      connected=false;tell('No se pudo conectar al canal. Revisa tu sesión o permisos.');
      button.disabled=false;button.textContent='Reintentar conexión';refresh();
    }else if(status==='CLOSED'){connected=false;refresh();}
  });
  button.onclick=disconnect;
 }catch(error){
  console.error('La Ciudad online',error);
  tell('Error de conexión: '+(error?.message||'desconocido'));button.disabled=false;button.textContent='Reintentar conexión';
 }
}
async function disconnect(){
 if(channel){try{await channel.untrack();await db.removeChannel(channel);}catch(e){console.warn(e)}}
 channel=null;connected=false;remote.clear();refresh();button.textContent='Entrar al online';button.disabled=false;button.onclick=connect;tell('Modo individual · tu progreso permanece intacto');
}
if(!node||!button)return;
button.addEventListener('click',()=>{if(!connected)void connect();});
button.textContent='Entrar al online';
window.CityMultiplayer={draw,sendPosition,disconnect};
window.addEventListener('pagehide',()=>{if(channel)void channel.untrack();});
setInterval(()=>{if(connected)sendPosition();},120);
tell('Modo individual · inicia sesión para encontrarte con tus amigos');
if(window.supabase?.createClient){
 const tmp=window.supabase.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true}});
 tmp.auth.getUser().then(({data})=>{if(data?.user)void connect();}).catch(()=>{});
}
})();
