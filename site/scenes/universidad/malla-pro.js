/* Universidad · UI V16. Conserva exactamente la lógica de malla V9. */
'use strict';
(()=>{
  const $=id=>document.getElementById(id);
  const grid=$('malla-grid');if(!grid||!Array.isArray(RAMOS_MALLA))return;
  const norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  let hovered=null;
  function updateStats(){
    const ids=new Set(RAMOS_MALLA.map(r=>r.id));
    const done=new Set(getCompletados().filter(id=>ids.has(id)));
    const current=new Set(getRamosEnCurso().filter(id=>ids.has(id)&&!done.has(id)));
    const total=RAMOS_MALLA.length;
    const put=(id,value)=>{const el=$(id);if(el)el.textContent=String(value);};
    put('mc-total',total);put('mc-done',done.size);put('mc-current',current.size);
    put('mc-pending',Math.max(0,total-done.size-current.size)+' pendientes');
    const percent=total?Math.round(done.size*100/total):0;put('mc-progress',percent+'%');
    const bar=$('mc-progress-bar');if(bar)bar.style.width=percent+'%';
  }
  function highlight(){
    const search=norm($('mc-search')?.value.trim());
    let related=null;
    if(hovered){
      const r=RAMOS_MALLA.find(x=>x.id===hovered);
      related=new Set([hovered,...(r?.prereq||[]),...RAMOS_MALLA.filter(x=>x.prereq.includes(hovered)).map(x=>x.id)]);
    }
    for(const card of grid.querySelectorAll('[data-ramo-id]')){
      const id=card.dataset.ramoId;
      const course=RAMOS_MALLA.find(x=>x.id===id);
      const matching=!search||norm(course?.name).includes(search);
      card.classList.toggle('mc-search-dim',!matching);
      card.classList.toggle('mc-related',!!related&&related.has(id));
      card.classList.toggle('mc-muted',!!related&&!related.has(id));
    }
  }
  function enhance(){
    updateStats();
    for(const card of grid.querySelectorAll('[data-ramo-id]')){
      card.setAttribute('tabindex','0');
      card.setAttribute('role','button');
      const id=card.dataset.ramoId;
      card.addEventListener('mouseenter',()=>{hovered=id;highlight()});
      card.addEventListener('mouseleave',()=>{hovered=null;highlight()});
      card.addEventListener('focus',()=>{hovered=id;highlight()});
      card.addEventListener('blur',()=>{hovered=null;highlight()});
      card.addEventListener('keydown',e=>{
        if(e.key==='Enter'){e.preventDefault();card.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true}));}
        if(e.key===' '){e.preventDefault();card.click();}
      });
      const course=RAMOS_MALLA.find(x=>x.id===id);
      if(course)card.title=course.name+' · clic: en curso · doble clic: aprobado'+(course.prereq.length?' · requiere: '+course.prereq.map(p=>RAMOS_MALLA.find(r=>r.id===p)?.name||p).join(', '):'');
    }
    highlight();
  }
  const oldRender=renderMallaCurricular;
  renderMallaCurricular=function(){oldRender();enhance();};
  const search=$('mc-search');
  if(search)search.addEventListener('input',highlight);
  window.addEventListener('storage',e=>{if(e.key==='mallaFisica'||e.key==='ramosEnCurso'){renderMallaCurricular();updateStats();}});
  enhance();
})();
