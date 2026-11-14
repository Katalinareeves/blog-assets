"use strict";
/* Universidad V2: perfiles independientes en ESTE navegador, sin fingir autenticación. */
(() => {
  const $ = id => document.getElementById(id);
  const PROFILES = 'ciudadV2Profiles';
  const CURRENT = 'ciudadV2Current';
  const PREFIX = 'ciudadV2Snapshot:';
  const DATA_KEYS = ['mallaFisica','ramosEnCurso','calificacionesUniversidad','agendaUniversidad','ciudadPersonaje','ciudadModoNoche','ciudadHorarioPersonal'];
  const DEFAULT = { id:'principal', name:'Mi universidad', school:'Universidad Andrés Bello', degree:'Licenciatura en Física', accent:'#b78cff', curriculum:null };
  const safeParse = (s, fallback) => { try { return JSON.parse(s); } catch { return fallback; } };
  function readProfiles(){ const p=safeParse(localStorage.getItem(PROFILES),null); return Array.isArray(p)&&p.length?p:[{...DEFAULT}]; }
  function writeProfiles(p){localStorage.setItem(PROFILES,JSON.stringify(p));}
  let profiles=readProfiles();
  let current=localStorage.getItem(CURRENT)||profiles[0].id;
  if(!profiles.some(p=>p.id===current))current=profiles[0].id;
  if(!localStorage.getItem(PROFILES)){writeProfiles(profiles);localStorage.setItem(CURRENT,current);}
  function active(){return profiles.find(p=>p.id===current)||profiles[0];}
  function capture(){const o={};DATA_KEYS.forEach(k=>{const v=localStorage.getItem(k);if(v!==null)o[k]=v;});return o;}
  // Iniciar SIN reemplazar datos heredados. El perfil principal importa el estado actual.
  if(!localStorage.getItem(PREFIX+current))localStorage.setItem(PREFIX+current,JSON.stringify(capture()));
  function persist(){localStorage.setItem(PREFIX+current,JSON.stringify(capture()));}
  function restore(id){const snap=safeParse(localStorage.getItem(PREFIX+id),{});DATA_KEYS.forEach(k=>{if(Object.hasOwn(snap,k))localStorage.setItem(k,snap[k]);else localStorage.removeItem(k);});}
  function switchTo(id){if(id===current)return;persist();restore(id);current=id;localStorage.setItem(CURRENT,id);location.reload();}
  // Save on page exit and when tab is backgrounded (existing code writes localStorage directly).
  window.addEventListener('pagehide',persist);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')persist();});
  const originalCurriculum=RAMOS_MALLA.map(r=>({...r,prereq:[...r.prereq]}));
  function validateCourse(r){return r&&typeof r.id==='string'&&/^[a-zA-Z0-9_-]{1,50}$/.test(r.id)&&typeof r.name==='string'&&r.name.trim().length>0&&r.name.length<=120&&Number.isInteger(r.sem)&&r.sem>=1&&r.sem<=16&&Array.isArray(r.prereq)&&r.prereq.every(x=>typeof x==='string');}
  function curriculumFor(p){return Array.isArray(p.curriculum)&&p.curriculum.length?p.curriculum:originalCurriculum;}
  function applyCurriculum(p){RAMOS_MALLA.splice(0,RAMOS_MALLA.length,...curriculumFor(p).map(r=>({...r,prereq:[...r.prereq]})));}
  function rerender(){refreshUniversityScene();renderStats();}
  function renderStats(){
 const rawDone=safeParse(localStorage.getItem('mallaFisica'),[]);
 const rawDoing=safeParse(localStorage.getItem('ramosEnCurso'),[]);
 const valid=new Set(RAMOS_MALLA.map(r=>r.id));
 const allDone=Array.isArray(rawDone)?rawDone:[];
 const done=[...new Set(allDone)].filter(id=>valid.has(id));
 const unknown=[...new Set(allDone)].filter(id=>!valid.has(id));
 const doing=Array.isArray(rawDoing)?[...new Set(rawDoing)].filter(id=>valid.has(id)&&!done.includes(id)):[];
 const total=RAMOS_MALLA.length;const remaining=Math.max(0,total-done.length-doing.length);
 const div=$('uni-progress-stats');if(!div)return;div.replaceChildren();
 [[done.length,'Aprobados registrados'],[doing.length,'En curso'],[remaining,'Pendientes'],[total,'Total en esta malla']].forEach(([count,label])=>{
  const item=document.createElement('div');const num=document.createElement('b');num.textContent=count;
  const txt=document.createElement('span');txt.textContent=label;item.append(num,txt);div.append(item);
 });
 const warnings=[];
 if(unknown.length)warnings.push(unknown.length+' registros de aprobación sin correspondencia: '+unknown.join(', '));
 if(new Set(allDone).size!==allDone.length)warnings.push('Hay aprobaciones duplicadas en el almacenamiento.');
 if(doing.length+done.length>total)warnings.push('El avance supera el total de asignaturas.');
 if(done.length>=total-4 && doing.length>=4)warnings.push('Revisa tus estados: el número de aprobaciones parece incompatible con los ramos en curso.');
 const audit=$('uni-audit-result');if(audit){
  audit.replaceChildren();
  const intro=document.createElement('p');
  intro.textContent='Plan activo: '+total+' asignaturas · '+done.length+' aprobaciones registradas · '+doing.length+' en curso. Son datos ingresados por el usuario, no certificados de la UNAB.';
  audit.append(intro);
  if(warnings.length){const box=document.createElement('div');box.className='uni-audit-alert';box.textContent=warnings.join(' ');audit.append(box);}
  const details=document.createElement('details');const sum=document.createElement('summary');sum.textContent='Revisar cuáles están marcados como aprobados ('+done.length+')';details.append(sum);
  const list=document.createElement('ol');done.forEach(id=>{
   const li=document.createElement('li');li.className='uni-audit-item';
   const name=document.createElement('span');name.textContent=RAMOS_MALLA.find(r=>r.id===id)?.name||id;
   const remove=document.createElement('button');remove.type='button';remove.textContent='Corregir';remove.title='Quitar aprobación errónea de '+name.textContent;
   remove.addEventListener('click',()=>{
     if(!confirm('¿Quitar la aprobación registrada de '+name.textContent+'? No modifica las notas de la Universidad.'))return;
     localStorage.setItem('ciudadMallaBackupAntesCorreccion',localStorage.getItem('mallaFisica')||'[]');
     localStorage.setItem('mallaFisica',JSON.stringify([...new Set(allDone)].filter(x=>x!==id)));
     persist();rerender();
   });
   li.append(name,remove);list.append(li);
 });details.append(list);audit.append(details);
 }
}
function applyTheme(p){const valid=/^#[0-9a-f]{6}$/i.test(p.accent)?p.accent:'#b78cff';document.documentElement.style.setProperty('--uni-accent',valid);$('uni-profile-title').textContent=p.name||'Mi universidad';$('uni-profile-subtitle').textContent=[p.degree,p.school].filter(Boolean).join(' · ')||'Tu espacio académico';$('uni-eyebrow').textContent=(p.school||'LA CIUDAD').toUpperCase()+' / EXPERIENCIA PERSONAL';}
  window.addEventListener('universidadCursosActualizados',renderStats);
  applyCurriculum(active());applyTheme(active());rerender();
  let draft=null;
  const dlg=$('uni-v2-dialog');
  const feedback=(s)=>{$('uni-feedback').textContent=s;};
  function renderEditor(){const list=$('uni-course-list');list.replaceChildren();draft.curriculum.forEach((course,i)=>{
    const line=document.createElement('div');line.className='uni-v2-course';
    const props=[['ID','id','text'],['Ramo','name','text'],['Sem.','sem','number'],['Categoría','cat','text'],['Prerrequisitos (IDs)','prereq','text']];
    props.forEach(([label,key,type])=>{const wrap=document.createElement('label');wrap.textContent=label;const input=document.createElement('input');input.type=type;input.value=key==='prereq'?course.prereq.join(', '):String(course[key]??'');if(key==='sem'){input.min='1';input.max='16';}input.addEventListener('input',()=>{course[key]=key==='prereq'?input.value.split(',').map(x=>x.trim()).filter(Boolean):key==='sem'?Number(input.value):input.value;});wrap.append(input);line.append(wrap);});
    const del=document.createElement('button');del.type='button';del.textContent='✕';del.title='Quitar ramo';del.className='uni-v2-remove';del.onclick=()=>{draft.curriculum.splice(i,1);renderEditor();};line.append(del);list.append(line);
  });}
  function refillSelect(){const sel=$('uni-profile-select');sel.replaceChildren();profiles.forEach(p=>{const opt=document.createElement('option');opt.value=p.id;opt.textContent=p.name;sel.append(opt);});sel.value=current;}
  function fill(){ $('uni-name').value=draft.name||'';$('uni-school').value=draft.school||'';$('uni-degree').value=draft.degree||'';$('uni-accent').value=/^#[0-9a-f]{6}$/i.test(draft.accent)?draft.accent:'#b78cff';renderEditor(); }
  function open(){draft={...active(),curriculum:curriculumFor(active()).map(r=>({...r,prereq:[...r.prereq]}))};refillSelect();fill();feedback('');dlg.showModal();}
  function close(){dlg.close();draft=null;}
  $('uni-profile-edit').addEventListener('click',open);$('uni-malla-open').addEventListener('click',open);$('uni-close').addEventListener('click',close);$('uni-cancel').addEventListener('click',close);
  $('uni-profile-select').addEventListener('change',e=>{close();switchTo(e.target.value);});
  $('uni-new-profile').addEventListener('click',()=>{let name=prompt('Nombre del nuevo perfil local:');if(name===null)return;name=name.trim().slice(0,54);if(!name){feedback('Escribe un nombre para el perfil.');return;}persist();const id='perfil_'+Date.now().toString(36);const p={...DEFAULT,id,name,school:'',degree:'',curriculum:originalCurriculum.map(r=>({...r,prereq:[...r.prereq]}))};profiles.push(p);writeProfiles(profiles);localStorage.setItem(PREFIX+id,JSON.stringify({}));close();switchTo(id);});
  $('uni-remove-profile').addEventListener('click',()=>{if(profiles.length===1){feedback('Debes conservar al menos un perfil.');return;}if(!confirm('¿Eliminar este perfil local y sus datos? Esta acción no se puede deshacer.'))return;const id=current;const next=profiles.find(p=>p.id!==id).id;profiles=profiles.filter(p=>p.id!==id);writeProfiles(profiles);localStorage.removeItem(PREFIX+id); // No guardar el perfil borrado al salir.
    current=next;restore(next);localStorage.setItem(CURRENT,next);location.reload();});
  $('uni-add-course').addEventListener('click',()=>{const id='nuevo_'+Math.random().toString(36).slice(2,8);draft.curriculum.push({id,name:'Nuevo ramo',sem:1,cat:'general',prereq:[]});renderEditor();$('uni-course-list').lastElementChild?.scrollIntoView({block:'nearest'});});
  $('uni-save').addEventListener('click',()=>{draft.name=$('uni-name').value.trim().slice(0,54)||'Mi universidad';draft.school=$('uni-school').value.trim().slice(0,80);draft.degree=$('uni-degree').value.trim().slice(0,100);draft.accent=$('uni-accent').value;
    const cs=draft.curriculum;if(!cs.length||cs.length>250||!cs.every(validateCourse)){feedback('Revisa los ramos: ID alfanumérico, nombre y semestre entre 1 y 16. Máximo 250.');return;}
    const ids=new Set(cs.map(r=>r.id));if(ids.size!==cs.length||cs.some(r=>r.prereq.some(id=>!ids.has(id)||id===r.id))){feedback('Hay IDs duplicados o prerrequisitos inexistentes.');return;}
    profiles=profiles.map(p=>p.id===current?{...draft}:p);writeProfiles(profiles);applyCurriculum(active());applyTheme(active());rerender();persist();close();});
  $('uni-profile-export').addEventListener('click',()=>{persist();const payload={format:'ciudad-universidad-v2',version:1,profile:active(),data:capture(),exportedAt:new Date().toISOString()};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='universidad-respaldo-'+current+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);});
  $('uni-import-file').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;if(file.size>3e6){feedback('Archivo demasiado grande.');return;}try{const payload=JSON.parse(await file.text());if(payload.format!=='ciudad-universidad-v2'||!payload.profile||!Array.isArray(payload.profile.curriculum)||!payload.profile.curriculum.every(validateCourse)||typeof payload.data!=='object'||!payload.data){throw Error('Formato de respaldo no válido');}if(!confirm('¿Reemplazar el perfil actual con este respaldo?'))return;
    const p={...active(),name:String(payload.profile.name||'Mi universidad').slice(0,54),school:String(payload.profile.school||'').slice(0,80),degree:String(payload.profile.degree||'').slice(0,100),accent:/^#[0-9a-f]{6}$/i.test(payload.profile.accent)?payload.profile.accent:'#b78cff',curriculum:payload.profile.curriculum};profiles=profiles.map(x=>x.id===current?p:x);writeProfiles(profiles);const data={};DATA_KEYS.forEach(k=>{if(typeof payload.data[k]==='string')data[k]=payload.data[k];});localStorage.setItem(PREFIX+current,JSON.stringify(data));restore(current);location.reload();}catch(err){feedback('No se pudo importar: '+err.message);}finally{e.target.value='';}});
})();
