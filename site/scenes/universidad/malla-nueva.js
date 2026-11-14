/* La Ciudad · malla moderna de Licenciatura en Física UNAB (37 asignaturas)
 * Lista de asignaturas: fuente oficial Admisión UNAB. Los vínculos de requisitos
 * aquí presentados corresponden SOLO a los extraídos con claridad del decreto 2542-2018;
 * las demás asignaturas permanecen sin líneas hasta su verificación individual.
 * Las condiciones no se usan para impedir marcar estados académicos.
 */
'use strict';
(function(){
const curriculum=[{"id":"filosofia","name":"Filosofía de las Ciencias y Pensamiento Científico","sem":1,"cat":"general","prereq":[]},{"id":"calc_diff","name":"Cálculo Diferencial","sem":1,"cat":"matematica","prereq":[]},{"id":"algebra","name":"Álgebra","sem":1,"cat":"matematica","prereq":[]},{"id":"modelos_fm","name":"Modelos Fisicomatemáticos","sem":1,"cat":"matematica","prereq":[]},{"id":"programacion","name":"Programación para la Física y Astronomía","sem":1,"cat":"computacion","prereq":[]},{"id":"epistemologia","name":"Epistemología de las Ciencias","sem":2,"cat":"general","prereq":[]},{"id":"calc_int","name":"Cálculo Integral","sem":2,"cat":"matematica","prereq":["calc_diff"]},{"id":"alg_lineal","name":"Álgebra Lineal","sem":2,"cat":"matematica","prereq":[]},{"id":"mec_particula","name":"Mecánica de la Partícula","sem":2,"cat":"mecanica","prereq":[]},{"id":"habilidades","name":"Habilidades Comunicativas","sem":2,"cat":"general","prereq":[]},{"id":"cvv","name":"Cálculo en Varias Variables y Vectorial","sem":3,"cat":"matematica","prereq":["calc_int"]},{"id":"edo","name":"Ecuaciones Diferenciales","sem":3,"cat":"matematica","prereq":["calc_int"]},{"id":"mec_solido","name":"Mecánica del Sólido Rígido","sem":3,"cat":"mecanica","prereq":[]},{"id":"ingles1","name":"Inglés I","sem":3,"cat":"ingles","prereq":[]},{"id":"metodos_fa","name":"Métodos Matemáticos para la Física y Astronomía","sem":4,"cat":"matematica","prereq":[]},{"id":"fis_moderna","name":"Física Moderna","sem":4,"cat":"mecanica","prereq":[]},{"id":"electromag","name":"Electromagnetismo","sem":4,"cat":"mecanica","prereq":[]},{"id":"modelos_comp","name":"Modelos Computacionales de Física","sem":4,"cat":"computacion","prereq":[]},{"id":"ingles2","name":"Inglés II","sem":4,"cat":"ingles","prereq":[]},{"id":"modelos_contemp","name":"Modelos Contemporáneos de las Ciencias","sem":5,"cat":"general","prereq":[]},{"id":"termo","name":"Termodinámica","sem":5,"cat":"mecanica","prereq":[]},{"id":"mec_clasica","name":"Mecánica Clásica","sem":5,"cat":"mecanica","prereq":["mec_solido"]},{"id":"metodos","name":"Métodos Matemáticos","sem":5,"cat":"matematica","prereq":[]},{"id":"ingles3","name":"Inglés III","sem":5,"cat":"ingles","prereq":[]},{"id":"lab_moderna","name":"Laboratorio de Física Moderna","sem":6,"cat":"mecanica","prereq":[]},{"id":"cuantica1","name":"Mecánica Cuántica I","sem":6,"cat":"mecanica","prereq":["mec_clasica"]},{"id":"electrodinamica","name":"Electrodinámica","sem":6,"cat":"mecanica","prereq":[]},{"id":"taller1","name":"Taller I","sem":6,"cat":"investigacion","prereq":["mec_clasica"]},{"id":"ingles4","name":"Inglés IV","sem":6,"cat":"ingles","prereq":[]},{"id":"electivo1","name":"Electivo de Licenciatura en Física I","sem":7,"cat":"investigacion","prereq":[]},{"id":"mec_estadistica","name":"Mecánica Estadística","sem":7,"cat":"mecanica","prereq":["cuantica1"]},{"id":"cuantica2","name":"Mecánica Cuántica II","sem":7,"cat":"mecanica","prereq":["cuantica1"]},{"id":"taller2","name":"Taller II","sem":7,"cat":"investigacion","prereq":["cuantica1"]},{"id":"responsabilidad","name":"Responsabilidad Social","sem":7,"cat":"general","prereq":[]},{"id":"electivo2","name":"Electivo de Licenciatura en Física II","sem":8,"cat":"investigacion","prereq":[]},{"id":"electivo_investigacion","name":"Electivo de Investigación","sem":8,"cat":"investigacion","prereq":[]},{"id":"taller3","name":"Taller III","sem":8,"cat":"investigacion","prereq":[]}];
const STATE_BACKUP='ciudadMallaAnteriorBackup';
window.CIUDAD_NUEVA_MALLA=curriculum;
if(!localStorage.getItem(STATE_BACKUP)){
 const before={curriculum:RAMOS_MALLA,completed:localStorage.getItem('mallaFisica'),current:localStorage.getItem('ramosEnCurso'),profiles:localStorage.getItem('ciudadV2Profiles'),savedAt:new Date().toISOString()};
 localStorage.setItem(STATE_BACKUP,JSON.stringify(before));
}
RAMOS_MALLA.splice(0,RAMOS_MALLA.length,...curriculum.map(c=>({...c,prereq:[...c.prereq]})));
const typeName={matematica:'Matemáticas',mecanica:'Física',computacion:'Computación',investigacion:'Investigación',general:'Formación general',ingles:'Inglés'};
const known=new Map(curriculum.map(c=>[c.id,c]));
let selected=null;
function stateOf(id){if(getCompletados().includes(id))return 'completed';if(getRamosEnCurso().includes(id))return 'current';return 'pending';}
function setState(id,value){
 const course=RAMOS_MALLA.find(c=>c.id===id);if(!course)return;
 setCompletados(getCompletados().filter(x=>x!==id).concat(value==='completed'?[id]:[]));
 setRamosEnCurso(getRamosEnCurso().filter(x=>x!==id).concat(value==='current'?[id]:[]));
 window.dispatchEvent(new Event('universidadCursosActualizados'));
 refreshUniversityScene();
 // La vista actual se actualiza incluso si el render heredado cambia en otro módulo.
 render();
 const cloud=window.CiudadCloud;if(cloud?.state.signedIn&&cloud.state.enabled){cloud.upload().catch(e=>console.warn('Sincronización pendiente',e));}
}
function linePaths(){
 const graph=document.querySelector('.uni-graph');
 const canvas=document.querySelector('.uni-graph-canvas');
 if(!graph||!canvas)return;
 const bounds=graph.getBoundingClientRect();
 const width=Math.max(graph.scrollWidth,graph.clientWidth);
 const height=Math.max(graph.scrollHeight,graph.clientHeight);
 canvas.setAttribute('viewBox','0 0 '+width+' '+height);canvas.setAttribute('width',width);canvas.setAttribute('height',height);canvas.replaceChildren();
 if(!selected)return;
 const selectedCard=graph.querySelector('[data-ramo-id="'+selected+'"]');
 if(!selectedCard)return;
 const arrow=(a,b,inverted=false)=>{
  if(!a||!b)return;
  const ra=a.getBoundingClientRect(),rb=b.getBoundingClientRect();
  const ax=ra.right-bounds.left+graph.scrollLeft,ay=ra.top+ra.height/2-bounds.top+graph.scrollTop;
  const bx=rb.left-bounds.left+graph.scrollLeft,by=rb.top+rb.height/2-bounds.top+graph.scrollTop;
  const path=document.createElementNS('http://www.w3.org/2000/svg','path');
  path.setAttribute('d',`M ${ax} ${ay} C ${(ax+bx)/2} ${ay}, ${(ax+bx)/2} ${by}, ${bx} ${by}`);
  path.setAttribute('class',inverted?'uni-line downstream':'uni-line');canvas.append(path);
 };
 const cur=known.get(selected);if(!cur)return;
 for(const id of cur.prereq)arrow(graph.querySelector('[data-ramo-id="'+id+'"]'),selectedCard,false);
 for(const course of RAMOS_MALLA.filter(c=>c.prereq.includes(selected)))arrow(selectedCard,graph.querySelector('[data-ramo-id="'+course.id+'"]'),true);
}
function inspector(){
 const panel=document.getElementById('uni-course-inspector');if(!panel)return;
 const course=known.get(selected);
 if(!course){panel.innerHTML='<div class="uni-inspector-empty">Selecciona una asignatura para ver sus relaciones y actualizar su estado.</div>';return;}
 panel.replaceChildren();
 const tag=document.createElement('div');tag.className='uni-inspector-tag';tag.textContent='SEMESTRE '+course.sem+'  ·  '+(typeName[course.cat]||'Asignatura');
 const name=document.createElement('h3');name.textContent=course.name;
 const desc=document.createElement('p');desc.textContent='Marca tu progreso real. Los estados se guardan por cuenta; no se infieren homologaciones.';
 const controls=document.createElement('div');controls.className='uni-state-buttons';
 for(const [value,label] of [['pending','Pendiente'],['current','En curso'],['completed','Aprobado']]){
  const b=document.createElement('button');b.type='button';b.textContent=label;b.className=stateOf(course.id)===value?'active':'';b.setAttribute('aria-pressed',String(stateOf(course.id)===value));b.onclick=()=>setState(course.id,value);controls.append(b);
 }
 const up=document.createElement('div');up.className='uni-related';const deps=course.prereq.map(id=>known.get(id)?.name).filter(Boolean);
 const downstream=RAMOS_MALLA.filter(c=>c.prereq.includes(course.id)).map(c=>c.name);
 const make=(title,values)=>{const h=document.createElement('b');h.textContent=title;up.append(h);const p=document.createElement('p');p.textContent=values.length?values.join(' · '):'Sin requisitos verificados en los datos cargados.';up.append(p)};
 make('Prerrequisitos documentados',deps);make('Asignaturas relacionadas después',downstream);
 const note=document.createElement('small');note.textContent='Las líneas de requisitos documentadas aún son parciales. La ausencia de una línea no significa que no exista un prerrequisito oficial.';
 panel.append(tag,name,desc,controls,up,note);
}
function render(){
 const grid=document.getElementById('malla-grid');if(!grid)return;
 grid.replaceChildren();
 grid.classList.add('uni-graph');
 const canvas=document.createElementNS('http://www.w3.org/2000/svg','svg');canvas.classList.add('uni-graph-canvas');canvas.setAttribute('aria-hidden','true');grid.append(canvas);
 for(let sem=1;sem<=8;sem++){
  const column=document.createElement('section');column.className='uni-semester';
  const h=document.createElement('header');h.className='uni-semester-header';
  h.innerHTML='<span>0'+sem+'</span><small>SEMESTRE '+sem+'</small>';column.append(h);
  for(const course of RAMOS_MALLA.filter(x=>x.sem===sem)){
   const card=document.createElement('button');card.type='button';card.className='uni-course-card uni-cat-'+course.cat+' uni-status-'+stateOf(course.id)+(selected===course.id?' is-selected':'');
   card.dataset.ramoId=course.id;card.setAttribute('aria-pressed',String(selected===course.id));
   const code=document.createElement('span');code.className='uni-course-index';code.textContent=String(curriculum.indexOf(course)+1).padStart(2,'0');
   const title=document.createElement('strong');title.textContent=course.name;
   const foot=document.createElement('span');foot.className='uni-course-foot';foot.textContent=stateOf(course.id)==='completed'?'✓ Aprobado':stateOf(course.id)==='current'?'● En curso':'○ Pendiente';
   card.append(code,title,foot);
   // Un clic selecciona y muestra relaciones; doble clic aprueba/desaprueba.
   // No se debe convertir el primer clic en "en curso" al hacer doble clic.
   // Mantener el DOM estable: reconstruirlo en click rompe el evento dblclick.
   card.addEventListener('click',()=>{
     selected=course.id;
     grid.querySelectorAll('.uni-course-card').forEach(el=>{
       const active=el.dataset.ramoId===selected;
       el.classList.toggle('is-selected',active);
       el.setAttribute('aria-pressed',String(active));
     });
     inspector();linePaths();
   });
   card.addEventListener('dblclick',event=>{
     event.preventDefault();
     selected=course.id;
     setState(course.id,stateOf(course.id)==='completed'?'pending':'completed');
   });
   card.title='Clic: detalles · doble clic: aprobar / desmarcar';
   column.append(card);
  }
  grid.append(column);
 }
 inspector();
 requestAnimationFrame(linePaths);
}
renderMallaCurricular=render;
window.addEventListener('resize',()=>requestAnimationFrame(linePaths));
const tab=document.querySelector('[data-tab="malla"]');if(tab)tab.addEventListener('click',()=>requestAnimationFrame(linePaths));
window.addEventListener('universidadCursosActualizados',()=>{if(selected)inspector();});
render();
})();