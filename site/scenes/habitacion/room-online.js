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
const reactions=Object.freeze({wave:'👋',heart:'💗',star:'✨',dance:'🎶',holi:'¡Holiii!',lindo:'¡Qué bonita tu habitación!',arcade:'¿Vamos al Arcade?',jugar:'¿Jugamos junt@s?',foto:'¡Una fotito! ✨',fisica:'La física nos reunió ⚛'});
let mine=null,magicOn=true,lastReaction=0;
try{magicOn=localStorage.getItem('ciudadRoomMagicEffects')!=='off';}catch{}
const magicBtn=document.getElementById('room-magic-toggle');
function reflectMagic(){if(!magicBtn)return;magicBtn.setAttribute('aria-pressed',String(magicOn));magicBtn.textContent=magicOn?'✳ Brillitos: sí':'✳ Brillitos: no';}
reflectMagic();
if(magicBtn)magicBtn.addEventListener('click',()=>{magicOn=!magicOn;reflectMagic();try{localStorage.setItem('ciudadRoomMagicEffects',magicOn?'on':'off')}catch{}});
function paintMagic(ctx){
 if(!magicOn)return;
 const t=performance.now()/1000;
 ctx.save();
 for(let i=0;i<21;i++){
  const x=65+(i*113)%2080+Math.sin(t*.45+i*2.6)*17;
  const y=105+(i*59)%225+Math.sin(t*.9+i*1.8)*11;
  const alpha=.12+Math.max(0,Math.sin(t*1.5+i*2.7))*.4;
  ctx.globalAlpha=alpha;ctx.fillStyle=i%3===0?'#efd7ff':'#fff2c0';
  ctx.beginPath();ctx.arc(x,y,i%4===0?3:1.7,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
}
function drawBubble(ctx,x,item){
 if(!item)return;
 const age=Date.now()-item.time;
 if(age>3300)return;
 const value=reactions[item.id];
 if(!value)return;
 ctx.save();
 ctx.globalAlpha=Math.min(1,(3300-age)/650);
 ctx.font=(value.length>5?'bold 14px system-ui':'22px system-ui');
 ctx.textAlign='center';const width=Math.min(310,ctx.measureText(value).width+26);
 const y=246-Math.sin(Math.PI*Math.min(1,age/3300))*13;
 ctx.fillStyle='#252139ee';ctx.strokeStyle='#ae93d1';ctx.lineWidth=1.5;
 ctx.beginPath();ctx.roundRect(x-width/2,y-24,width,34,9);ctx.fill();ctx.stroke();
 ctx.fillStyle='#f9eaff';ctx.fillText(value,x,y-2,282);
 ctx.restore();
}
function react(id){
 if(!Object.hasOwn(reactions,id))return;
 const now=Date.now();if(now-lastReaction<700)return;
 lastReaction=now;mine={id,time:now};
 const hint=document.getElementById('social-hint');
 if(hint)hint.textContent=connected?'Compartido con las visitas ♡':'Vista local · inicia sesión para compartir ♡';
 if(connected&&channel){channel.send({type:'broadcast',event:'reaction',payload:{user_id:me,id}}).catch(()=>{});}
}
document.querySelectorAll('[data-social-reaction]').forEach(b=>b.addEventListener('click',()=>react(b.dataset.socialReaction)));
const phraseButton=document.getElementById('send-room-phrase');
if(phraseButton)phraseButton.addEventListener('click',()=>react(document.getElementById('room-phrase')?.value));
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
 paintMagic(ctx);
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
  drawBubble(ctx,x,peer.reaction);
 }
 const local=view.getPosition();
 drawBubble(ctx,Number(local.x)||300,mine);
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
  if(view.visiting&&!['registered','friends'].includes(room.visibility)){note('Esta habitación es privada');return;}
  const {data:profile}=await db.from('ciudad_profiles').select('display_name').eq('user_id',me).maybeSingle();
  name=String(profile?.display_name||'Jugador').slice(0,25);
  await db.realtime.setAuth();
  const c=db.channel('ciudad:habitacion:'+owner,{config:{private:true,presence:{key:crypto.randomUUID()},broadcast:{self:false}}});
  channel=c;
  c.on('presence',{event:'sync'},sync);
  c.on('broadcast',{event:'walk'},({payload})=>onMove(payload));
  c.on('broadcast',{event:'reaction'},({payload})=>{
    if(!payload||typeof payload!=='object'||!remote.has(payload.user_id)||!Object.hasOwn(reactions,payload.id))return;
    const peer=remote.get(payload.user_id);peer.reaction={id:payload.id,time:Date.now()};
  });
  c.subscribe(async status=>{
   if(status==='SUBSCRIBED'){
    connected=true;note('Visitas online activas');
    const hint=document.getElementById('social-hint');if(hint)hint.textContent='Los gestos se comparten con quienes estén aquí ♡';
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