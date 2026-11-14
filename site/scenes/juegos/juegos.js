/* La Ciudad · tres en raya online alfa, sin premios monetarios.
 * Salas efímeras privadas para cuentas autenticadas, acceso por código.
 */
'use strict';
(()=>{
const URL='https://mqjprleqctafnhokxcyk.supabase.co';
const KEY='sb_publishable_i9HKZXTtwrm709JyZ33rcg_OMe5oMp7';
const $=id=>document.getElementById(id);
const db=window.supabase?.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true}});
const status=$('game-status'),board=$('game-board'),codeInput=$('room-code');
let uid='',name='',room=null,channel=null,participants=[],cells=Array(9).fill(''),turn='X',serial=0;
const write=x=>{status.textContent=x;};
const validCode=s=>/^[a-f0-9]{8}$/.test(s);
const winner=b=>{
 const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
 for(const [a,c,d] of lines)if(b[a]&&b[a]===b[c]&&b[a]===b[d])return b[a];
 return b.every(Boolean)?'draw':null;
};
function seats(){
 if(!channel)return [];
 const members=new Map();
 for(const [key,arr] of Object.entries(channel.presenceState())){
  if(!Array.isArray(arr))continue;
  for(const p of arr){const id=String(p?.uid||'');if(id&&id!==''&&!members.has(id))members.set(id,{id,name:String(p?.name||'Jugador').slice(0,25)});}
 }
 return [...members.values()].sort((a,b)=>a.id.localeCompare(b.id)).slice(0,2);
}
function symbol(){const index=participants.findIndex(p=>p.id===uid);return index===0?'X':index===1?'O':null;}
function refresh(){
 const w=winner(cells),my=symbol(),ready=participants.length===2;
 $('my-symbol').textContent=my||'–';$('turn-display').textContent=w?(w==='draw'?'Empate':w+' ganó'):turn;
 $('players-list').replaceChildren();
 for(let i=0;i<participants.length;i++){const badge=document.createElement('span');badge.textContent=(i===0?'X':'O')+' · '+participants[i].name+(participants[i].id===uid?' (tú)':'');$('players-list').append(badge);}
 for(let i=0;i<9;i++){
  const btn=board.children[i];btn.textContent=cells[i];btn.className=cells[i]==='O'?'o':'';
  btn.disabled=!channel||!ready||!my||Boolean(w)||turn!==my||Boolean(cells[i]);
 }
 $('reset-game').disabled=!channel||!my;
 if(!channel){write('Crea una sala o únete con el código de un amigo.');return;}
 if(!ready){write('Esperando a otra persona en la sala '+room+'…');return;}
 if(w)write(w==='draw'?'¡Empate! Pueden iniciar otra partida.':w===my?'¡Ganaste la ronda!':'Ganó '+participants[w==='X'?0:1]?.name);
 else write(turn===my?'¡Tu turno!':'Turno de '+participants[turn==='X'?0:1]?.name);
}
function move(index,who,role){
 if(!Number.isInteger(index)||index<0||index>8||cells[index]||winner(cells)||participants.length!==2)return false;
 const expected=participants[turn==='X'?0:1];
 if(expected?.id!==who||turn!==role)return false;
 cells[index]=turn;serial++;turn=turn==='X'?'O':'X';refresh();return true;
}
function send(event,payload){if(!channel)return;channel.send({type:'broadcast',event,payload}).catch(e=>console.warn(e));}
function sync(){
 const before=participants.map(p=>p.id).join(',');
 participants=seats();
 if(before!==participants.map(p=>p.id).join(',')){cells=Array(9).fill('');turn='X';serial=0;send('reset',{from:uid});}
 refresh();
}
function reset(notify=true){cells=Array(9).fill('');turn='X';serial=0;refresh();if(notify)send('reset',{from:uid});}
function onSyncRequest({payload}){if(!payload||!channel||!participants.length)return;const leader=participants[0]?.id;if(uid!==leader)return;send('snapshot',{from:uid,cells,turn,serial});}
function onSnapshot({payload}){
 if(!payload||!participants.some(x=>x.id===payload.from))return;
 if(!Array.isArray(payload.cells)||payload.cells.length!==9||payload.cells.some(c=>!['','X','O'].includes(c)))return;
 if(!['X','O'].includes(payload.turn)||!Number.isSafeInteger(payload.serial)||payload.serial<0)return;
 if(payload.serial<serial)return;
 cells=payload.cells.slice();turn=payload.turn;serial=payload.serial;refresh();
}
function onMove({payload}){if(!payload||!participants.some(p=>p.id===payload.from))return;move(payload.index,payload.from,payload.role);}
async function leave(){
 if(channel){try{await channel.untrack();await db.removeChannel(channel);}catch(e){console.warn(e)}}
 channel=null;room=null;participants=[];reset(false);$('leave-room').hidden=true;
 $('create-room').disabled=false;$('join-room').disabled=false;codeInput.disabled=false;
 refresh();
}
async function join(code){
 if(!db){write('Supabase no está disponible');return;}
 if(!validCode(code)){write('El código debe tener ocho caracteres hexadecimales.');return;}
 if(!uid){location.href='../cuenta/index.html';return;}
 await leave();room=code;codeInput.value=code;
 $('create-room').disabled=true;$('join-room').disabled=true;codeInput.disabled=true;
 write('Entrando a la sala…');
 try{
  await db.realtime.setAuth();
  channel=db.channel('ciudad:juego:'+code,{config:{private:true,presence:{key:crypto.randomUUID()},broadcast:{self:false}}});
  channel.on('presence',{event:'sync'},sync);
  channel.on('broadcast',{event:'move'},onMove);
  channel.on('broadcast',{event:'reset'},()=>reset(false));
  channel.on('broadcast',{event:'sync_request'},onSyncRequest);
  channel.on('broadcast',{event:'snapshot'},onSnapshot);
  channel.subscribe(async (state,error)=>{
    if(state==='SUBSCRIBED'){
     $('leave-room').hidden=false;
     await channel.track({uid,name});
     send('sync_request',{from:uid});refresh();
    }else if(state==='CHANNEL_ERROR'||state==='TIMED_OUT'){
     write('Error de sala: '+(error?.message||'Comprueba tu sesión y vuelve a intentarlo.'));
    }
  });
 }catch(e){console.error(e);write('No se pudo entrar: '+e.message);await leave();}
}
for(let i=0;i<9;i++){
 const cell=document.createElement('button');cell.type='button';cell.setAttribute('aria-label','Casilla '+(i+1));cell.disabled=true;
 cell.onclick=()=>{
  const role=symbol();if(!role||!uid)return;
  if(move(i,uid,role))send('move',{from:uid,index:i,role});
 };
 board.append(cell);
}
$('create-room').onclick=()=>{const bytes=new Uint8Array(4);crypto.getRandomValues(bytes);const code=[...bytes].map(n=>n.toString(16).padStart(2,'0')).join('');void join(code);};
$('join-room').onclick=()=>void join(codeInput.value.trim().toLowerCase());
$('leave-room').onclick=()=>void leave();
$('reset-game').onclick=()=>reset(true);
window.addEventListener('pagehide',()=>{if(channel)void channel.untrack();});
const params=new URLSearchParams(location.search);const invite=params.get('sala');
(async()=>{if(!db){write('No se cargó Supabase');return;}
 try{const {data,error}=await db.auth.getUser();if(error||!data?.user){write('Inicia sesión en Mi cuenta para jugar con los demás.');return;}
 uid=data.user.id;const r=await db.from('ciudad_profiles').select('display_name').eq('user_id',uid).maybeSingle();
 name=r.data?.display_name||'Jugador';refresh();
 if(invite&&validCode(invite))void join(invite);
 }catch(e){write('No se pudo validar la sesión: '+e.message);}
})();
refresh();
})();
