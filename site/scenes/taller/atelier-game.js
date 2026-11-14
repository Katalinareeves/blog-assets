/* Taller V5: estudio desplazable con personaje visible y decoración libre. */
(() => {
'use strict';
const KEY='ciudadAtelierV3', ROOM_KEY='ciudadRoomV5';
const $=id=>document.getElementById(id);
const items=CitySeeds.gacha.items;
const catalog=Object.fromEntries(items.map(item=>[item.id,item]));
const asset=id=>'assets/furniture/'+encodeURIComponent(id)+'.svg';
const starterFurniture={sofa:'Sofá lavanda',rug:'Alfombra circular',bookshelf:'Estantería',chair:'Silla de estudio',plant:'Planta de interior'};
const metadata={
 tiny_seed:{kind:'decor'},city_stamp:{kind:'decor'},street_note:{kind:'decor'},purple_flower:{kind:'decor'},night_lamp:{kind:'decor'},coffee_token:{kind:'decor'},
 cat_companion:{kind:'companion'},rain_effect:{kind:'theme'},cassette:{kind:'decor'},special_room:{kind:'theme'},special_outfit:{kind:'accessory'},secret_song:{kind:'decor'},golden_seed:{kind:'decor'},city_secret:{kind:'decor'},ultimate_room:{kind:'theme'}
};
const craftRecipes=[
 {name:'Flor violeta',target:'purple_flower',need:{tiny_seed:3}},
 {name:'Lámpara nocturna',target:'night_lamp',need:{city_stamp:2,street_note:1}},
 {name:'Gato callejero',target:'cat_companion',need:{coffee_token:3,cassette:1}},
 {name:'Vestuario alternativo',target:'special_outfit',need:{rain_effect:2,cat_companion:1}}
];
for(const [id,name] of Object.entries(starterFurniture)) catalog[id]={id,name,rarity:'common'};

const owned=()=>CitySeeds.collection.get()||{};
const count=id=>Number(owned()[id]?.count)||0;
const load=(key,fallback={})=>{try{return JSON.parse(localStorage.getItem(key)||'null')||fallback;}catch{return fallback;}};
const state=()=>load(KEY);
const save=o=>{localStorage.setItem(KEY,JSON.stringify(o));render();};
const create=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
const btn=(label,fn,disabled=false)=>{let b=create('button','atelier-action',label);b.type='button';b.disabled=disabled;b.addEventListener('click',fn);return b;};
const img=(id,cls='')=>{const im=create('img',cls);im.src=asset(id);im.alt=catalog[id]?.name||'';im.draggable=false;return im;};
const valid=(s,key)=>s[key]&&count(s[key])>0?s[key]:null;

let room=load(ROOM_KEY,{placed:[],nextId:1,avatarX:18,scrollX:0});
if(!Array.isArray(room.placed)) room={placed:[],nextId:1,avatarX:18,scrollX:0};
if(!('avatarX' in room)) room.avatarX=18;
if(!('scrollX' in room)) room.scrollX=0;

// Importa una composición previa si existiera.
if(!localStorage.getItem(ROOM_KEY)){
 const old=state();
 for(const [slot,x,y,size] of [['wall',16,34,18],['desk',78,74,16],['floor',57,88,20]]) if(valid(old,slot)) room.placed.push({uid:room.nextId++,itemId:old[slot],x,y,z:room.nextId,size});
}
let selected=null,drag=null;
const decor=id=>Object.hasOwn(starterFurniture,id)||metadata[id]?.kind==='decor'||metadata[id]?.kind==='companion';
function persist(){localStorage.setItem(ROOM_KEY,JSON.stringify(room));}
function stock(id){return Object.hasOwn(starterFurniture,id)?1:count(id);}
function available(id){return stock(id)-room.placed.filter(p=>p.itemId===id).length;}
function msg(s){if($('room-message')) $('room-message').textContent=s;}
function normalized(){
 const used={};
 room.placed=room.placed.filter(p=>{
   if(!catalog[p.itemId]||!decor(p.itemId)) return false;
   used[p.itemId]=(used[p.itemId]||0)+1;
   return used[p.itemId]<=stock(p.itemId);
 });
 if(selected && !room.placed.some(p=>p.uid===selected)) selected=null;
}
function place(id){
 if(available(id)<=0) return msg('No hay más copias disponibles de este objeto.');
 const offset=room.placed.length%8;
 const p={uid:room.nextId++,itemId:id,x:20+offset*8,y:78-(offset%3)*8,z:room.nextId,size:18};
 room.placed.push(p); selected=p.uid; persist(); renderRoom(); msg('Objeto colocado. Arrástralo por la habitación para ubicarlo.');
}
function remove(){if(!selected) return; room.placed=room.placed.filter(p=>p.uid!==selected); selected=null; persist(); renderRoom(); msg('Objeto retirado. Sigue disponible en el inventario.');}
function reorder(direction){let p=room.placed.find(p=>p.uid===selected); if(!p) return; const z=room.placed.map(x=>x.z); p.z=direction>0?Math.max(0,...z)+1:Math.min(0,...z)-1; persist(); renderRoom();}
function resize(delta){const p=room.placed.find(o=>o.uid===selected); if(!p) return msg('Selecciona un objeto primero.'); p.size=Math.max(8,Math.min(32,(p.size||17)+delta)); persist(); renderRoom();}

function roomWorld(){return $('atelier-room');}
function roomViewport(){return $('room-viewport');}
function clamp(v,min,max){return Math.max(min,Math.min(max,v));}

// ── Personaje dentro del estudio ──
const CHAR_KEY='ciudadPersonaje';
const HEX_RE=/^#[0-9a-fA-F]{6}$/;
const DEFAULT_CHAR={skin:'#f6e7db',hair:'#7a4bb0',style:'corto',top:'#2a1d3a',bottom:'#141414',accent:'#e29ab7',nombre:''};
function sanitizeChar(c){
 const out={...DEFAULT_CHAR};
 if(c&&typeof c==='object'){
   ['skin','hair','top','bottom','accent'].forEach(k=>{if(HEX_RE.test(c[k])) out[k]=c[k];});
   if(['largo','corto','cola'].includes(c.style)) out.style=c.style;
   if(typeof c.nombre==='string') out.nombre=c.nombre.slice(0,20);
 }
 return out;
}
function loadChar(){try{return sanitizeChar(JSON.parse(localStorage.getItem(CHAR_KEY)||'null'));}catch{return {...DEFAULT_CHAR};}}
function shade(hex,f){const n=parseInt(hex.slice(1),16);const ch=v=>Math.max(0,Math.min(255,Math.round(v*f))); const r=ch((n>>16)&255),g=ch((n>>8)&255),b=ch(n&255); return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');}
function drawCharacter(c,p,cfg,outfit=false){
 const {x,y,w,h,dir='right',step=0}=p; const cx=x+w/2; const legOff=step===1?2:0;
 const hairMid=cfg.hair,hairDark=shade(cfg.hair,.78),hairShine=shade(cfg.hair,1.22);
 c.clearRect(0,0,c.canvas.width,c.canvas.height);
 c.fillStyle='rgba(0,0,0,.18)'; c.fillRect(cx-11,y+h-2,22,5);
 c.fillStyle=cfg.bottom; c.fillRect(x+3,y+h-10+legOff,5,10); c.fillRect(x+w-8,y+h-10-legOff,5,10);
 c.fillStyle='#121212'; c.fillRect(x+2,y+h-2+legOff,7,2); c.fillRect(x+w-9,y+h-2-legOff,7,2);
 c.fillStyle=cfg.accent; c.fillRect(x+3,y+h-1+legOff,5,1); c.fillRect(x+w-8,y+h-1-legOff,5,1);
 c.fillStyle=outfit?'#e9e2f6':cfg.top; c.fillRect(x+2,y+12,w-4,h-23);
 c.fillStyle=shade(outfit?'#e9e2f6':cfg.top,.55); c.fillRect(cx-1,y+12,2,h-23);
 c.fillStyle=cfg.skin; c.fillRect(x+3,y, w-6, 15);
 c.fillStyle=hairDark;
 c.fillRect(x+1,y-6,w-2,cfg.style==='largo'?15:11);
 if(cfg.style!=='corto'){ c.fillRect(x+1,y+8,3,10); c.fillRect(x+w-4,y+8,3,10); }
 if(cfg.style==='cola'){ c.fillRect(cx-2,y+8,4,14); c.fillStyle=cfg.accent; c.fillRect(cx-2,y+8,4,2); c.fillStyle=hairDark; }
 c.fillStyle=hairMid; c.fillRect(x+2,y-5,w-4,4); c.fillStyle=hairShine; c.fillRect(x+4,y-5,w-8,1);
 c.fillStyle='#1b0f11'; c.fillRect(x+5,y+6,2,2); c.fillRect(x+w-7,y+6,2,2);
 if(outfit){ c.fillStyle='#c79fd0'; c.fillRect(x+4,y+22,w-8,4); c.fillStyle='#fff4ff'; c.fillRect(cx-2,y+22,4,4); }
}
function renderAvatar(theme,companionId){
 const host=$('room-avatar-layer'); host.replaceChildren();
 const avatar=create('div','room-avatar'); avatar.style.left=room.avatarX+'%';
 const bubble=create('div','room-avatar-bubble', theme==='ultimate_room' ? 'Esta habitación ya se siente mía.' : 'Quiero que este estudio quede perfecto.');
 avatar.append(bubble);
 const canvas=create('canvas','room-avatar-canvas'); canvas.width=74; canvas.height=98;
 const ctx=canvas.getContext('2d'); const s=state(); drawCharacter(ctx,{x:27,y:12,w:20,h:58,dir:'right',step:1},loadChar(), valid(s,'accessory')==='special_outfit');
 avatar.append(canvas);
 if(companionId){ const pet=img(companionId,'room-avatar-companion'); avatar.append(pet); }
 host.append(avatar);
 const zoneA=create('div','room-zone-label room-zone-left','Rincón de descanso');
 const zoneB=create('div','room-zone-label room-zone-mid','Ventanal nocturno');
 const zoneC=create('div','room-zone-label room-zone-right','Zona de estudio');
 host.append(zoneA,zoneB,zoneC);
}
function centerViewportOn(percent){
 const vp=roomViewport(), world=roomWorld();
 const px=(percent/100)*world.clientWidth - vp.clientWidth/2;
 vp.scrollLeft=clamp(px,0,world.scrollWidth-vp.clientWidth);
 room.scrollX=vp.scrollLeft; persist();
}
function bindRoomNav(){
 $('room-nav-left').onclick=()=>{const vp=roomViewport(); vp.scrollBy({left:-vp.clientWidth*.7,behavior:'smooth'}); setTimeout(()=>{room.scrollX=vp.scrollLeft;persist();},350);};
 $('room-nav-right').onclick=()=>{const vp=roomViewport(); vp.scrollBy({left:vp.clientWidth*.7,behavior:'smooth'}); setTimeout(()=>{room.scrollX=vp.scrollLeft;persist();},350);};
 const vp=roomViewport();
 if(vp.dataset.bound==='1') return; vp.dataset.bound='1';
 vp.addEventListener('scroll',()=>{room.scrollX=vp.scrollLeft; persist();},{passive:true});
 roomWorld().addEventListener('click',e=>{
   if(e.target.closest('.room-furniture')) return;
   const rect=roomWorld().getBoundingClientRect();
   const x=((e.clientX-rect.left)/rect.width)*100;
   const y=((e.clientY-rect.top)/rect.height)*100;
   if(y<55) return;
   room.avatarX=clamp(x,6,95); persist(); renderRoom(); msg('Tu personaje se ha movido por la habitación.');
   setTimeout(()=>centerViewportOn(room.avatarX),50);
 });
}

function renderRoom(){
 normalized(); persist();
 const s=state(), theme=valid(s,'theme'), companion=valid(s,'companion');
 const world=roomWorld(), vp=roomViewport();
 world.dataset.theme=theme||'base';
 $('room-theme-label').textContent=theme?catalog[theme].name.toUpperCase():'NOCHE VIOLETA';
 if(vp.scrollLeft!==room.scrollX) vp.scrollLeft=room.scrollX||0;
 renderAvatar(theme, companion);
 const layer=$('room-object-layer'); layer.replaceChildren();
 [...room.placed].sort((a,b)=>a.z-b.z).forEach(p=>{
   const el=create('button','room-furniture'+(selected===p.uid?' is-selected':''));
   el.type='button'; el.style.left=p.x+'%'; el.style.top=p.y+'%'; el.style.width=(p.size||17)+'%';
   el.style.zIndex=String(Math.round(p.z+30)); el.dataset.uid=String(p.uid); el.title=catalog[p.itemId].name+' · Arrastrar para mover'; el.setAttribute('aria-label',el.title); el.append(img(p.itemId));
   el.addEventListener('pointerdown',e=>{
     if(e.button!==0) return; selected=p.uid; const rect=world.getBoundingClientRect();
     drag={uid:p.uid,dx:e.clientX-rect.left,dy:e.clientY-rect.top}; el.setPointerCapture(e.pointerId); renderRoom();
   });
   el.addEventListener('pointermove',e=>{
     if(!drag||drag.uid!==p.uid) return; const rect=world.getBoundingClientRect();
     p.x=clamp(((e.clientX-rect.left)/rect.width)*100,4,96); p.y=clamp(((e.clientY-rect.top)/rect.height)*100,20,94);
     el.style.left=p.x+'%'; el.style.top=p.y+'%';
   });
   el.addEventListener('pointerup',()=>{if(drag){drag=null;persist();renderRoom();}});
   el.addEventListener('pointercancel',()=>{drag=null;persist();renderRoom();});
   el.addEventListener('click',e=>{e.stopPropagation(); selected=p.uid; renderRoom();});
   el.addEventListener('keydown',e=>{
     const dirs={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
     if(dirs[e.key]){e.preventDefault(); selected=p.uid; const [dx,dy]=dirs[e.key]; p.x=clamp(p.x+dx*(e.shiftKey?4:1),4,96); p.y=clamp(p.y+dy*(e.shiftKey?4:1),20,94); persist(); renderRoom(); const active=layer.querySelector('[data-uid="'+p.uid+'"]'); active?.focus();}
     if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault(); selected=p.uid; remove();}
   });
   layer.append(el);
 });
 const inventory=$('room-inventory-list'); inventory.replaceChildren();
 const ownDecor=[...Object.keys(starterFurniture).map(id=>({id,name:starterFurniture[id]})), ...items.filter(item=>decor(item.id)&&count(item.id)>0)];
 if(!ownDecor.length) inventory.append(create('p','atelier-note','Todavía no tienes objetos decorativos. Puedes reclamar tu kit de bienvenida.'));
 for(const item of ownDecor){
   const el=create('button','room-inventory-item'); el.type='button'; el.disabled=available(item.id)<=0; el.append(img(item.id));
   const info=create('span','room-item-info'); info.append(create('strong','',item.name), create('small','',available(item.id)+' disponibles de '+stock(item.id))); el.append(info);
   el.addEventListener('click',()=>place(item.id)); inventory.append(el);
 }
 const controls=$('room-controls'); controls.replaceChildren();
 const box=create('div','room-control'); box.append(create('label','room-control-label','AMBIENTE DE LA HABITACIÓN'));
 const select=create('select','atelier-select'); select.setAttribute('aria-label','Ambiente de la habitación'); select.append(new Option('Noche violeta',''));
 for(const item of items.filter(x=>metadata[x.id]?.kind==='theme'&&count(x.id)>0)) select.append(new Option(item.name,item.id));
 select.value=theme||''; select.addEventListener('change',()=>{const n=state(); n.theme=select.value; save(n);}); box.append(select); controls.append(box);
 bindRoomNav();
}

function renderWardrobe(){
 const s=state(),a=valid(s,'accessory'),c=valid(s,'companion');
 const host=$('outfit-icon'); host.replaceChildren(); host.append(img(a||'special_outfit','wardrobe-asset'));
 const pet=$('outfit-companion'); pet.replaceChildren(); if(c) pet.append(img(c,'wardrobe-pet'));
 $('outfit-title').textContent=a?catalog[a].name:'Tu personaje';
 $('outfit-desc').textContent=c?'Compañero equipado: '+catalog[c].name:'Personaliza tu aspecto usando objetos de tu colección.';
 const controls=$('wardrobe-controls'); controls.replaceChildren();
 for(const kind of ['accessory','companion']){
   const box=create('article','craft-card'); box.append(create('div','card-eyebrow',kind==='accessory'?'ROPA Y ACCESORIOS':'COMPAÑERO'));
   const select=create('select','atelier-select'); select.append(new Option('Sin equipar',''));
   for(const item of items.filter(x=>count(x.id)>0&&metadata[x.id]?.kind===kind)) select.append(new Option(item.name,item.id));
   select.value=valid(s,kind)||''; select.setAttribute('aria-label',kind==='accessory'?'Prenda equipada':'Compañero equipado');
   select.addEventListener('change',()=>{const n=state(); n[kind]=select.value; save(n);}); box.append(select); controls.append(box);
 }
 controls.append(create('p','atelier-note','Los objetos equipados también aparecen dentro del estudio y se conservan al volver a La Ciudad.'));
}
const canCraft=r=>Object.entries(r.need).every(([id,n])=>count(id)>=n);
function craft(recipe){const inv=owned(); if(!canCraft(recipe)) return false; for(const [id,n] of Object.entries(recipe.need)){inv[id].count-=n; if(!inv[id].count) delete inv[id];} if(!inv[recipe.target]) inv[recipe.target]={itemId:recipe.target,count:0,firstObtained:Date.now()}; inv[recipe.target].count++; localStorage.setItem('ciudadColeccion',JSON.stringify(inv)); $('craft-status').textContent='Has fabricado: '+catalog[recipe.target].name+'.'; if(typeof updateAll==='function') updateAll(); render(); return true;}
function renderCraft(){const host=$('craft-grid'); host.replaceChildren(); for(const r of craftRecipes){const box=create('article','craft-card'); box.append(create('div','card-eyebrow','FABRICACIÓN SIN AZAR'), img(r.target,'craft-illustration'), create('h3','',catalog[r.target].name)); box.append(create('p','',Object.entries(r.need).map(([id,n])=>catalog[id].name+' '+Math.min(count(id),n)+'/'+n).join(' · '))); box.append(btn('Fabricar',()=>craft(r),!canCraft(r))); host.append(box);}}
function renderStarter(){ $('starter-kit').hidden=localStorage.getItem('ciudadAtelierV3Starter')==='1'; }
$('claim-starter').addEventListener('click',()=>{ if(localStorage.getItem('ciudadAtelierV3Starter')==='1') return; const inv=owned(); for(const id of ['tiny_seed','city_stamp','street_note']){ if(!inv[id]) inv[id]={itemId:id,count:0,firstObtained:Date.now()}; inv[id].count++; } localStorage.setItem('ciudadColeccion',JSON.stringify(inv)); localStorage.setItem('ciudadAtelierV3Starter','1'); if(typeof updateAll==='function') updateAll(); render(); msg('Kit recibido. Tus nuevos objetos están en el inventario.'); });
$('room-remove-selected').addEventListener('click',remove);
$('room-front').addEventListener('click',()=>reorder(1)); $('room-back').addEventListener('click',()=>reorder(-1));
$('room-smaller').addEventListener('click',()=>resize(-3)); $('room-bigger').addEventListener('click',()=>resize(3));
$('room-reset').addEventListener('click',()=>{ if(!confirm('¿Quieres retirar todos los objetos colocados? No perderás ninguno.')) return; room.placed=[]; selected=null; persist(); renderRoom(); msg('Habitación despejada. Tus objetos siguen en el inventario.'); });
function render(){ renderStarter(); renderRoom(); renderWardrobe(); renderCraft(); }
window.AtelierGame={render,craft,metadata};
document.querySelectorAll('.tab-btn').forEach(x=>x.addEventListener('click',render));
window.addEventListener('storage',e=>{ if(['ciudadColeccion',KEY,ROOM_KEY,CHAR_KEY].includes(e.key)){ room=load(ROOM_KEY,{placed:[],nextId:1,avatarX:18,scrollX:0}); render(); } });
render();
})();
