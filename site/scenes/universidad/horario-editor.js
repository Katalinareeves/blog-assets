"use strict";
(()=>{
  const $=id=>document.getElementById(id);
  const dlg=$('horario-dialog'), list=$('horario-items'), status=$('horario-msg');
  let draft=[];
  const dayNames={lunes:'Lunes',martes:'Martes',miércoles:'Miércoles',jueves:'Jueves',viernes:'Viernes'};
  const validTime=t=>/^([01]\d|2[0-3]):[0-5]\d$/.test(t);
  function courseOptions(){const sel=$('horario-course');sel.replaceChildren();RAMOS_MALLA.forEach(r=>{const o=document.createElement('option');o.value=r.id;o.textContent=r.name;sel.append(o);});}
  function show(){list.replaceChildren();draft.sort((a,b)=>Object.keys(dayNames).indexOf(a.day)-Object.keys(dayNames).indexOf(b.day)||a.start.localeCompare(b.start));draft.forEach((s,i)=>{const item=document.createElement('div');item.className='horario-row';const label=document.createElement('span');label.textContent=`${dayNames[s.day]||s.day} · ${s.start}–${s.end} · ${s.short}`;const edit=document.createElement('button');edit.textContent='Editar';edit.type='button';edit.onclick=()=>{$('horario-day').value=s.day;$('horario-start').value=s.start;$('horario-end').value=s.end;$('horario-course').value=s.course;draft.splice(i,1);show();status.textContent='Bloque cargado arriba. Corrige y pulsa «Agregar clase».';};const del=document.createElement('button');del.textContent='Eliminar';del.type='button';del.onclick=()=>{draft.splice(i,1);show();};item.append(label,edit,del);list.append(item);});if(!draft.length)list.textContent='Todavía no hay bloques agregados.';}
  $('horario-edit-open').onclick=()=>{draft=HORARIO.map(x=>({...x}));courseOptions();status.textContent='';show();dlg.showModal();};
  $('horario-close').onclick=()=>dlg.close();
  $('horario-add').onclick=()=>{const day=$('horario-day').value,start=$('horario-start').value,end=$('horario-end').value,course=$('horario-course').value;const r=RAMOS_MALLA.find(c=>c.id===course);if(!r||!dayNames[day]||!validTime(start)||!validTime(end)||end<=start){status.textContent='Revisa el ramo y las horas: el término debe ser posterior al inicio.';return;}if(draft.some(x=>x.day===day&&x.start<end&&start<x.end)){status.textContent='Ese bloque se cruza con otra clase del mismo día.';return;}draft.push({day,start,end,course,short:r.name});status.textContent='Clase agregada. Guarda para aplicarla.';show();};
  $('horario-save').onclick=()=>{HORARIO.splice(0,HORARIO.length,...draft);localStorage.setItem('ciudadHorarioPersonal',JSON.stringify(HORARIO));renderHorario();dlg.close();window.dispatchEvent(new Event('ciudadHorarioGuardado'));};
  $('horario-reset').onclick=()=>{if(!confirm('¿Restaurar el horario inicial del proyecto? Se reemplazarán los cambios de este perfil.'))return;draft=HORARIO_DEFAULT.map(x=>({...x}));show();status.textContent='Horario inicial cargado. Pulsa guardar para confirmar.';};
})();
