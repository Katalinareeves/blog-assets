(()=>{'use strict';
const URL='https://mqjprleqctafnhokxcyk.supabase.co',KEY='sb_publishable_i9HKZXTtwrm709JyZ33rcg_OMe5oMp7';
const $=id=>document.getElementById(id),db=window.supabase?.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true}});
const Q=[
 {q:'¿Cuál es la unidad de fuerza en el Sistema Internacional?',o:['Joule','Newton','Watt','Pascal'],a:1,why:'La fuerza se mide en newtons (N), equivalentes a kg·m/s².'},
 {q:'¿Qué magnitud se conserva en una colisión aislada?',o:['Temperatura','Velocidad de cada cuerpo','Momento lineal total','Energía potencial de cada cuerpo'],a:2,why:'El momento lineal total se conserva si la fuerza externa neta es nula.'},
 {q:'¿Qué describe el principio de superposición para campos eléctricos?',o:['Los campos se suman vectorialmente','Las cargas siempre se atraen','La energía es negativa','La fuerza es constante'],a:0,why:'El campo eléctrico resultante es la suma vectorial de los campos de cada fuente.'},
 {q:'En un gas ideal monoatómico clásico, ¿cuál es la energía interna promedio por partícula?',o:['kBT/2','kBT','3kBT/2','5kBT/2'],a:2,why:'Los tres grados traslacionales aportan kBT/2 cada uno.'},
 {q:'¿Qué relación existe entre la frecuencia ν y la energía de un fotón?',o:['E=hν','E=h/ν','E=hν²','E=ν/h'],a:0,why:'La relación de Planck es E = hν.'}
];
let uid='',nickname='',room='',chan=null,members=[],idx=0,answers={},roundId=0;
const status=s=>{$('status').textContent=s;},valid=s=>/^[0-9a-f]{8}$/.test(s);
function roster(){if(!chan)return [];const users=new Map();Object.values(chan.presenceState()).forEach(items=>items.forEach(i=>{const id=String(i?.uid||'');if(id&&!users.has(id))users.set(id,{uid:id,name:String(i?.name||'Jugador').slice(0,24)});}));return [...users.values()].sort((a,b)=>a.uid.localeCompare(b.uid)).slice(0,2);}
const send=(event,payload)=>chan?.send({type:'broadcast',event,payload}).catch(console.warn);
function scores(){const out={};members.forEach(m=>out[m.uid]=0);return out;}
let tally={};
function render(){
 const ready=Boolean(chan)&&members.length===2&&members.some(m=>m.uid===uid);
 const q=Q[idx]||null,answered=Object.keys(answers).length===2,me=answers[uid];
 $('round').textContent='RONDA · '+Math.min(idx+1,Q.length)+' / '+Q.length;
 $('question').textContent=ready?(q?.q||'¡Trivia terminada!'):'Esperando a otra persona para empezar.';
 $('answers').replaceChildren();
 if(q&&ready)q.o.forEach((label,n)=>{const b=document.createElement('button');b.textContent=String.fromCharCode(65+n)+' · '+label;b.disabled=me!==undefined||idx>=Q.length;b.className=me===n?'chosen':'';b.onclick=()=>{if(answers[uid]!==undefined)return;answers[uid]=n;send('quiz_answer',{from:uid,idx,choice:n});render();};$('answers').append(b);});
 if(!ready)$('results').textContent='Conecta a dos jugadores en la misma sala.';
 else if(!q)$('results').textContent='¡Terminó la trivia! Crea una sala nueva para otra partida.';
 else if(answered)$('results').textContent=(q.a===answers[uid]?'✓ Respondiste bien. ':'Respuesta correcta: '+q.o[q.a]+'. ')+q.why;
 else $('results').textContent=me===undefined?'Selecciona una respuesta.':'Respuesta enviada. Esperando a la otra persona…';
 $('scores').replaceChildren();members.forEach(m=>{const chip=document.createElement('span');chip.textContent=m.name+': '+(tally[m.uid]||0)+' puntos';$('scores').append(chip);});
 $('people').replaceChildren();members.forEach(m=>{const chip=document.createElement('span');chip.textContent=m.name+(m.uid===uid?' (tú)':'');$('people').append(chip);});
 $('next').disabled=!ready||!answered||members[0]?.uid!==uid||idx>=Q.length;
 $('invite').hidden=!chan;$('leave').hidden=!chan;
 $('waiting').textContent=!ready?'SIN RIVAL':answered?'RESPUESTAS LISTAS':Object.keys(answers).length+'/2 RESPUESTAS';
}
function reset(){idx=0;answers={};tally=scores();roundId++;render();}
function applyRound(n,receivedTally){if(!Number.isInteger(n)||n<0||n>Q.length)return;idx=n;answers={};if(receivedTally&&typeof receivedTally==='object')tally={...receivedTally};render();}
function sync(){const previous=members.map(m=>m.uid).join(':');members=roster();if(previous!==members.map(m=>m.uid).join(':')){reset();if(members.length===2&&members[0].uid===uid)send('quiz_start',{from:uid,idx:0,tally});}render();}
async function leave(){const c=chan;chan=null;if(c){try{await c.untrack();await db.removeChannel(c)}catch(e){console.warn(e)}}members=[];room='';reset();$('create').disabled=false;$('join').disabled=false;$('room').disabled=false;status('Listo para un nuevo duelo.');}
async function join(code){
 if(!uid){location.href='../cuenta/index.html';return;}
 if(!valid(code)){status('Código inválido.');return;}
 if(chan)await leave();room=code;$('room').value=code;$('create').disabled=true;$('join').disabled=true;$('room').disabled=true;status('Conectando…');
 try{await db.realtime.setAuth();const c=db.channel('ciudad:juego:'+code,{config:{private:true,presence:{key:crypto.randomUUID()},broadcast:{self:false}}});chan=c;
 c.on('presence',{event:'sync'},sync);
 c.on('broadcast',{event:'quiz_start'},({payload})=>{if(payload?.from===members[0]?.uid)applyRound(payload.idx,payload.tally)});
 c.on('broadcast',{event:'quiz_answer'},({payload})=>{
  if(!payload||payload.idx!==idx||!members.some(p=>p.uid===payload.from)||answers[payload.from]!==undefined||!Number.isInteger(payload.choice)||payload.choice<0||payload.choice>3)return;
  answers[payload.from]=payload.choice;render();
 });
 c.on('broadcast',{event:'quiz_next'},({payload})=>{if(payload?.from===members[0]?.uid)applyRound(payload.idx,payload.tally)});
 c.subscribe(async state=>{if(state==='SUBSCRIBED'){status('Sala '+room+' · desafío abierto');await c.track({uid,name:nickname});render();}else if(['CHANNEL_ERROR','TIMED_OUT'].includes(state))status('Error de conexión. Sal y vuelve a entrar.');});
 }catch(e){status('Error: '+e.message);await leave();}
}
$('create').onclick=()=>{const v=new Uint8Array(4);crypto.getRandomValues(v);void join([...v].map(x=>x.toString(16).padStart(2,'0')).join(''));};
$('join').onclick=()=>void join($('room').value.trim().toLowerCase());
$('leave').onclick=()=>void leave();
$('invite').onclick=async()=>{const link=location.origin+location.pathname+'?sala='+room;try{await navigator.clipboard.writeText(link);status('Invitación copiada.')}catch{prompt('Copia el enlace',link)}};
$('next').onclick=()=>{if(members[0]?.uid!==uid||Object.keys(answers).length!==2)return;const q=Q[idx];if(q){Object.entries(answers).forEach(([user,n])=>{if(n===q.a)tally[user]=(tally[user]||0)+1;});}applyRound(idx+1,tally);send('quiz_next',{from:uid,idx,tally});};
window.addEventListener('pagehide',()=>{if(chan)void chan.untrack();});
(async()=>{try{
 if(!db){status('Error cargando Supabase');return;}
 const {data,error}=await db.auth.getUser();if(error||!data?.user){status('Inicia sesión en Mi cuenta para jugar.');return;}
 uid=data.user.id;const {data:p}=await db.from('ciudad_profiles').select('display_name').eq('user_id',uid).maybeSingle();nickname=p?.display_name||'Jugador';
 const code=new URLSearchParams(location.search).get('sala');if(code&&valid(code))await join(code);else status('Crea una sala para invitar a alguien.');
 }catch(e){status('Error de sesión: '+e.message)}})();render();
})();