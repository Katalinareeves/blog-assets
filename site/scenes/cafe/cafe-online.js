/* Café República · presencia multijugador optativa. Sin chat libre ni escritura de inventarios. */
(()=>{'use strict';
const root=window.CiudadCafeBridge,client=window.supabase;
const status=document.getElementById('cafe-online'),invite=document.getElementById('cafe-invite'),wave=document.getElementById('cafe-wave');
const topic='ciudad:cafe:v1',URL='https://mqjprleqctafnhokxcyk.supabase.co',KEY='sb_publishable_i9HKZXTtwrm709JyZ33rcg_OMe5oMp7';
const peers=new Map();let uid='',channel=null,connected=false,db=null,localWave=0,lastSent='',lastTick=0;
const safe=x=>Math.max(0,Math.min(1e4,Number(x)||0));
const colors=['skin','hair','top','bottom','accent'],hex=/^#[0-9a-f]{6}$/i;
const safeAvatar=a=>{const o={};for(const k of colors)if(hex.test(a?.[k]))o[k]=a[k];if(['largo','corto','cola'].includes(a?.style))o.style=a.style;return o;};
const safeName=s=>String(s||'Visitante').slice(0,20).replace(/[<>]/g,'');
const local=()=>{const p=root.getState();return{x:safe(p.x),y:safe(p.y),dir:['left','right','up','down'].includes(p.dir)?p.dir:'down',step:p.step===1?1:0,avatar:safeAvatar(p.avatar)};};
function statusText(){if(status)status.textContent=connected?'♡ '+(peers.size+1)+' en el Café':'♡ Modo individual';}
function sync(){
 if(!channel)return;
 const live=new Set();
 for(const items of Object.values(channel.presenceState())){
  for(const item of items){const id=String(item?.user_id||'');if(!id||id===uid)continue;live.add(id);
   const prev=peers.get(id)||{name:safeName(item.name),position:item.position||{x:450,y:400,dir:'down',step:0,avatar:{}}};
   prev.name=safeName(item.name);peers.set(id,prev);
  }
 }
 for(const id of peers.keys())if(!live.has(id))peers.delete(id);
 statusText();
}
function movement(payload){const id=String(payload?.user_id||'');if(!peers.has(id)||!payload?.position)return;
 const p=payload.position,peer=peers.get(id);
 peer.position={x:Math.max(20,Math.min(920,safe(p.x))),y:Math.max(275,Math.min(470,safe(p.y))),dir:['left','right','up','down'].includes(p.dir)?p.dir:'down',step:p.step===1?1:0,avatar:safeAvatar(p.avatar)};
}
function update(){
 if(!channel||!connected)return;const now=Date.now(),pos=local(),str=JSON.stringify(pos);
 if(str===lastSent||now-lastTick<150)return;
 lastSent=str;lastTick=now;
 void channel.send({type:'broadcast',event:'move',payload:{user_id:uid,position:pos}}).catch(()=>{});
}
function draw(ctx,drawCharacter){
 const now=Date.now();
 for(const peer of peers.values()){
  const p=peer.position;if(!p)continue;
  const x=Math.max(20,Math.min(920,safe(p.x))),y=Math.max(275,Math.min(470,safe(p.y)));
  drawCharacter(x,y,p.avatar,p.step,p.dir);
  ctx.save();ctx.font='bold 10px monospace';ctx.textAlign='center';
  const w=Math.min(145,ctx.measureText(peer.name).width+13);ctx.fillStyle='#302536dd';ctx.fillRect(x+10-w/2,y-23,w,16);
  ctx.fillStyle='#f2dfd6';ctx.fillText(peer.name,x+10,y-11,140);
  if(peer.waveAt&&now-peer.waveAt<2500){ctx.font='21px sans-serif';ctx.fillText('👋',x+10,y-35);}
  ctx.restore();
 }
 if(localWave&&now-localWave<2500){const p=local();ctx.save();ctx.textAlign='center';ctx.font='21px sans-serif';ctx.fillText('👋',p.x+10,p.y-25);ctx.restore();}
}
if(wave)wave.addEventListener('click',()=>{
 localWave=Date.now();
 if(connected&&channel)void channel.send({type:'broadcast',event:'wave',payload:{user_id:uid}}).catch(()=>{});
});
if(invite)invite.addEventListener('click',async()=>{
 const url=location.href.split('#')[0].split('?')[0];
 try{await navigator.clipboard.writeText(url);invite.textContent='¡Enlace copiado! ♡';}
 catch{prompt('Copia el enlace para invitar a tus amigos',url);}
 setTimeout(()=>{invite.textContent='♡ Invitar';},2200);
});
async function connect(){
 if(!client?.createClient||!root){status.textContent='♡ Modo individual';return;}
 try{
  db=client.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true}});
  const {data:{user},error}=await db.auth.getUser();
  if(error||!user){status.textContent='♡ Individual · inicia sesión para ver amigos';return;}
  uid=user.id;await db.realtime.setAuth();
  const {data:profile}=await db.from('ciudad_profiles').select('display_name').eq('user_id',uid).maybeSingle();
  const name=safeName(profile?.display_name||root.getUserName());
  channel=db.channel(topic,{config:{private:true,presence:{key:crypto.randomUUID()},broadcast:{self:false}}});
  channel.on('presence',{event:'sync'},sync);
  channel.on('broadcast',{event:'move'},({payload})=>movement(payload));
  channel.on('broadcast',{event:'wave'},({payload})=>{const peer=peers.get(String(payload?.user_id||''));if(peer)peer.waveAt=Date.now();});
  channel.subscribe(async type=>{
   if(type==='SUBSCRIBED'){connected=true;statusText();await channel.track({user_id:uid,name,position:local()});sync();lastSent='';update();}
   if(type==='CHANNEL_ERROR'||type==='TIMED_OUT'){connected=false;status.textContent='♡ Sin conexión · puedes seguir jugando';}
   if(type==='CLOSED'){connected=false;peers.clear();statusText();}
  });
 }catch(e){console.warn('Café online',e);status.textContent='♡ Individual · online no disponible';}
}
window.CiudadCafeOnline={draw};
setInterval(update,150);
window.addEventListener('pagehide',()=>{if(channel)void channel.untrack();});
void connect();
})();