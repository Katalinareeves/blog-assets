(()=>{'use strict';
const URL='https://mqjprleqctafnhokxcyk.supabase.co',KEY='sb_publishable_i9HKZXTtwrm709JyZ33rcg_OMe5oMp7';
const $=id=>document.getElementById(id),db=window.supabase?.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true}});
let uid='',nickname='',channel=null,code='',members=[],choices={},round=0,myChoice='';
const status=x=>{$('status').textContent=x};
const acceptable=s=>/^[0-9a-f]{8}$/.test(s);
const send=(event,payload)=>channel?.send({type:'broadcast',event,payload}).catch(console.warn);
const emoji={rock:'🪨',paper:'📄',scissors:'✂️'};
function roster(){
 if(!channel)return [];
 const all=new Map();
 Object.values(channel.presenceState()).forEach(items=>items.forEach(item=>{
  const id=String(item?.uid||'');if(id&&!all.has(id))all.set(id,{uid:id,name:String(item?.name||'Jugador').slice(0,24)});
 }));
 return [...all.values()].sort((a,b)=>a.uid.localeCompare(b.uid)).slice(0,2);
}
function result(){
 if(members.length!==2)return null;
 const a=choices[members[0].uid],b=choices[members[1].uid];if(!a||!b)return null;
 if(a===b)return '¡Empate! Los dos eligieron '+emoji[a];
 const win=(a==='rock'&&b==='scissors')||(a==='paper'&&b==='rock')||(a==='scissors'&&b==='paper');
 const w=members[win?0:1];return (w.uid===uid?'¡Ganaste!':'Ganó '+w.name)+' · '+emoji[a]+' contra '+emoji[b];
}
function render(){
 const connected=Boolean(channel),ready=members.length===2&&members.some(m=>m.uid===uid);
 $('people').replaceChildren();members.forEach(p=>{const item=document.createElement('span');item.textContent=p.name+(p.uid===uid?' (tú)':'');$('people').append(item);});
 const resolved=result();$('outcome').textContent=resolved||(!ready?'Esperando al segundo jugador':myChoice?'Elección enviada. Esperando a la otra persona…':'¡Elige tu jugada!');
 document.querySelectorAll('[data-choice]').forEach(b=>{b.disabled=!ready||!!myChoice||!!resolved;b.classList.toggle('selected',b.dataset.choice===myChoice);});
 $('again').disabled=!connected||!ready;$('invite').hidden=!connected;$('leave').hidden=!connected;
}
function reset(broadcast=false){choices={};myChoice='';round++;if(broadcast)send('rps_reset',{from:uid,round});render();}
function sync(){
 const next=roster();
 const before=members.map(p=>p.uid).join('|');members=next;
 if(before!==members.map(p=>p.uid).join('|'))reset(true);
 render();
}
async function leave(){
 if(channel){const prev=channel;channel=null;try{await prev.untrack();await db.removeChannel(prev)}catch(e){console.warn(e)}}
 code='';members=[];reset();$('create').disabled=false;$('join').disabled=false;$('room').disabled=false;status('Crea una sala o entra con una invitación.');render();
}
async function join(value){
 if(!uid){location.href='../cuenta/index.html';return;}
 if(!acceptable(value)){status('Introduce un código válido de ocho caracteres.');return;}
 if(channel)await leave();code=value;$('room').value=value;$('create').disabled=true;$('join').disabled=true;$('room').disabled=true;status('Conectando…');
 try{
  await db.realtime.setAuth();
  const c=db.channel('ciudad:juego:'+code,{config:{private:true,presence:{key:crypto.randomUUID()},broadcast:{self:false}}});channel=c;
  c.on('presence',{event:'sync'},sync);
  c.on('broadcast',{event:'rps_choice'},({payload})=>{
   if(!payload||!members.some(p=>p.uid===payload.from)||!emoji[payload.choice]||payload.round!==round)return;
   choices[payload.from]=payload.choice;render();
  });
  c.on('broadcast',{event:'rps_reset'},({payload})=>{
   if(payload&&!members.some(p=>p.uid===payload.from))return;
   choices={};myChoice='';round=Number.isInteger(payload?.round)?payload.round:round+1;render();
  });
  c.subscribe(async state=>{
   if(state==='SUBSCRIBED'){status('Sala '+code+' conectada');await c.track({uid,name:nickname});render();}
   else if(['CHANNEL_ERROR','TIMED_OUT'].includes(state)){status('Error al conectar. Sal de la sala y reintenta.');}
  });
 }catch(e){status('No se pudo conectar: '+e.message);await leave();}
}
$('create').onclick=()=>{const v=new Uint8Array(4);crypto.getRandomValues(v);void join([...v].map(x=>x.toString(16).padStart(2,'0')).join(''))};
$('join').onclick=()=>void join($('room').value.trim().toLowerCase());
$('leave').onclick=()=>void leave();
$('invite').onclick=async()=>{const link=location.origin+location.pathname+'?sala='+code;try{await navigator.clipboard.writeText(link);status('Invitación copiada.')}catch{prompt('Copia la invitación:',link)}};
$('again').onclick=()=>reset(true);
document.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{
 if(!channel||members.length!==2||myChoice)return;
 myChoice=b.dataset.choice;choices[uid]=myChoice;send('rps_choice',{from:uid,choice:myChoice,round});render();
});
window.addEventListener('pagehide',()=>{if(channel)void channel.untrack()});
(async()=>{try{
 if(!db){status('No se pudo cargar Supabase');return;}
 const {data,error}=await db.auth.getUser();if(error||!data?.user){status('Inicia sesión en Mi cuenta para jugar.');return;}
 uid=data.user.id;
 const {data:p}=await db.from('ciudad_profiles').select('display_name').eq('user_id',uid).maybeSingle();
 nickname=p?.display_name||'Jugador';
 const requested=new URLSearchParams(location.search).get('sala');if(requested&&acceptable(requested))await join(requested);
 else status('Lista para jugar. Crea una sala o únete a una.');
 }catch(e){status('Error de sesión: '+e.message)}})();
render();
})();