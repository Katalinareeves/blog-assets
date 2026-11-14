/* La Ciudad · Habitación V6. Escena local, sin servidor ni intercambio de inventario. */
(()=>{'use strict';
const $=id=>document.getElementById(id),canvas=$('room'),ctx=canvas.getContext('2d');
const W=2300,H=420,VIEW=1100,KEY='ciudadHabitacionV6';
const starts=[
{id:'bed',name:'Cama de ensueño',icon:'🛏️',type:'muebles',w:170,h:110},
{id:'desk',name:'Escritorio de estudio',icon:'🖥️',type:'muebles',w:150,h:94},
{id:'shelf',name:'Biblioteca',icon:'📚',type:'muebles',w:100,h:169},
{id:'sofa',name:'Sofá lavanda',icon:'🛋️',type:'muebles',w:164,h:87},
{id:'rug',name:'Alfombra floral',icon:'🌸',type:'decoracion',w:205,h:28},
{id:'plant',name:'Maceta de hojas',icon:'🪴',type:'decoracion',w:62,h:92},
{id:'lamp',name:'Lámpara cálida',icon:'💡',type:'decoracion',w:48,h:96},
{id:'window',name:'Ventana al jardín',icon:'🪟',type:'pared',w:170,h:150},
{id:'poster',name:'Cuadro nocturno',icon:'🖼️',type:'pared',w:86,h:96},
{id:'chalkboard',name:'Pizarra de física',icon:'⚛️',type:'pared',w:208,h:146},
{id:'cork',name:'Tablón de apuntes',icon:'📌',type:'pared',w:190,h:130},
{id:'wallbooks',name:'Repisa con libros',icon:'📗',type:'pared',w:232,h:55}
];
const extra={night_lamp:{id:'night_lamp',name:'Luz nocturna',icon:'🕯️',type:'decoracion',w:55,h:70},purple_flower:{id:'purple_flower',name:'Flor violeta',icon:'🌷',type:'decoracion',w:54,h:72},cat_companion:{id:'cat_companion',name:'Gatito compañero',icon:'🐈',type:'decoracion',w:56,h:50},cassette:{id:'cassette',name:'Casete vintage',icon:'📼',type:'decoracion',w:54,h:40}};
const catalog=[...starts,...Object.values(extra)],byId=Object.fromEntries(catalog.map(x=>[x.id,x]));
const DEFAULT={wall:'cream',floor:'cream',light:'auto',lamps:true,placed:[{id:'bed',x:1580,y:366},{id:'desk',x:320,y:372},{id:'rug',x:540,y:393},{id:'plant',x:675,y:372},{id:'window',x:1060,y:227},{id:'shelf',x:540,y:373},{id:'poster',x:1810,y:160},{id:'lamp',x:840,y:377},{id:'sofa',x:1130,y:371},{id:'chalkboard',x:335,y:215},{id:'cork',x:700,y:190},{id:'wallbooks',x:1520,y:150}],playerX:300,done:false};
let saved={};try{saved=JSON.parse(localStorage.getItem(KEY))||{}}catch{};
const data={...DEFAULT,...saved,placed:Array.isArray(saved.placed)?saved.placed.map(o=>({...o})):DEFAULT.placed.map(o=>({...o}))};
data.placed=data.placed.filter(o=>byId[o.id]&&Number.isFinite(o.x)&&Number.isFinite(o.y));
let mode='play',cam=0,goal=data.playerX||480,playerX=goal,selected=-1,placing=null,category='todos',drag=null,last=0,step=0,toastTimer;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));const own=()=>{try{return JSON.parse(localStorage.getItem('ciudadColeccion'))||{}}catch{return {}}};
const stock=id=>starts.some(i=>i.id===id)?1:Math.max(0,Number(own()[id]?.count)||0);
const available=id=>stock(id)-data.placed.filter(p=>p.id===id).length;
function save(){data.playerX=playerX;localStorage.setItem(KEY,JSON.stringify(data));$('save-label').textContent='✓ Guardado en este dispositivo'}
function notify(s){const e=$('toast');e.textContent=s;e.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove('visible'),2300)}
function box(x,y,w,h,fill,stroke){ctx.fillStyle=fill;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=3;ctx.strokeRect(Math.round(x)+1,Math.round(y)+1,Math.round(w)-2,Math.round(h)-2)}}
function ellipse(x,y,rx,ry,color){ctx.beginPath();ctx.ellipse(x,y,Math.max(1,rx),Math.max(1,ry),0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill()}
function line(x,y,x2,y2,color,width=3){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.lineWidth=width;ctx.strokeStyle=color;ctx.stroke()}
function text(t,x,y,size=18,color='#79516c'){ctx.fillStyle=color;ctx.font=`bold ${size}px Georgia,serif`;ctx.textAlign='center';ctx.fillText(t,x,y)}
function round(x,y,w,h,r,color,edge){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=color;ctx.fill();if(edge){ctx.strokeStyle=edge;ctx.lineWidth=3;ctx.stroke()}}
const palettes={rose:['#cdb9b5','#e1cfca','#9a837f'],lilac:['#b8b6c0','#dad6dd','#827e8d'],cream:['#c5b9aa','#e0d4c4','#928277'],sage:['#afc0b5','#d2ddd1','#819587']};
function isNight(){const h=new Date().getHours();return h<7||h>=19}
function night(){return data.light==='night'||(data.light==='auto'&&isNight())}
function background(now){const pal=palettes[data.wall]||palettes.rose;box(0,0,W,270,pal[0]);box(0,12,W,14,pal[1]);
  for(let y=32;y<263;y+=48){line(0,y,W,y,pal[1],2);for(let x=((y/48|0)%2)*31;x<W;x+=74)line(x,y,x,y+46,pal[1],1)}
  box(0,264,W,10,pal[2]); const floors={oak:['#a3816e','#c7a68e','#806557'],cream:['#b5a08a','#d3bda6','#8f7b6a'],plum:['#756c7a','#aaa0aa','#5f5567'],mint:['#839b8d','#b9c8b8','#687f71']};const fl=floors[data.floor]||floors.oak;
  box(0,274,W,146,fl[0]); for(let y=274;y<420;y+=36){line(0,y,W,y,fl[2],2);for(let x=((y/36|0)%2)*72;x<W;x+=145){line(x,y,x+22,y+36,fl[2],2);box(x+25,y+5,91,3,fl[1])}}
  // Marquetería y molduras integradas, no stickers.
  for(let x=50;x<W;x+=240){line(x,24,x,258,pal[2],2);box(x-9,22,18,8,pal[1]);}
  if(night()){box(0,0,W,420,'#20153749');if(data.lamps){for(let x of [185,1130,2030]){const g=ctx.createRadialGradient(x,212,4,x,212,190);g.addColorStop(0,'#fff0af66');g.addColorStop(1,'#f3b86e00');box(x-190,30,380,370,g)}}}
  // Guirnaldas animadas.
  for(let x=35;x<W;x+=35){const yy=20+7*Math.sin(x/100);line(x,15,x,yy,'#987d70',1);ellipse(x,yy,3,4,(Math.sin(now/900+x)>0)?'#fff0b0':'#d5a0bb')}
}

// Integrados al escenario: rincón científico creativo, detalles arquitectónicos y papelería.
// Son parte del arte ambiental y no consumen objetos del inventario.
function studioDetails(now){
 ctx.save();ctx.translate(-540,0);
 const n=night();
 // Paneles, rodapiés y profundidad. Las zonas se repiten para conservar el recorrido horizontal.
 for(let z=0;z<3;z++){
   const ox=z*770;
   box(ox+18,31,6,224,'#fff3e055');box(ox+20,31,2,224,'#88617c55');
   box(ox+28,245,712,6,'#ffeddf8b');box(ox+28,255,712,3,'#7c567560');
   for(let i=0;i<6;i++){const px=ox+65+i*104;box(px,275,3,142,'#fff0d529');}
 }
 // Las pizarras, repisas y tablones ya son objetos editables de la colección.
 // Los ventanales también son muebles movibles. Solo la arquitectura es fija.
 // Las notas se representan mediante tablones recolocables.
 // Iluminación con degradados sutiles detrás de los muebles.
 if(data.lamps){for(const px of [834,1465]){const g=ctx.createRadialGradient(px,214,12,px,214,195);g.addColorStop(0,'#ffe8af3b');g.addColorStop(1,'#ffe8af00');box(px-195,28,390,372,g)}}
 ctx.restore();
}
function oh(x){return x}function oxFix(x){return x}

function shadow(x,y,rx){ellipse(x,y,rx,10,'#49334636')}
function furniture(o,t){const d=byId[o.id];if(!d)return;const x=Math.round(o.x),y=Math.round(o.y),w=d.w,h=d.h;ctx.save();
 if(o.id==='chalkboard'){round(x-w/2,y-h,w,h,6,'#80695b','#584841');round(x-w/2+8,y-h+8,w-16,h-19,3,'#34494b','#d1c4ac');ctx.save();ctx.textAlign='left';ctx.fillStyle='#eee2c8';ctx.font='18px Georgia';ctx.fillText('E = mc²',x-w/2+20,y-h+37);ctx.font='13px Georgia';ctx.fillText('∇ · E = ρ/ε₀',x-w/2+20,y-h+66);ctx.fillText('F = ma',x-w/2+20,y-h+96);ctx.fillText('ψ(x,t)',x+w/2-72,y-h+103);ctx.restore();ellipse(x+w/2-42,y-h+44,21,9,'#adc8b72c');ctx.save();ctx.strokeStyle='#ebdfc8';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x+w/2-42,y-h+44,24,12,.6,0,Math.PI*2);ctx.stroke();ctx.restore();}
 if(o.id==='cork'){round(x-w/2,y-h,w,h,4,'#a6836d','#69534a');round(x-w/2+8,y-h+8,w-16,h-16,2,'#c1a28a');for(let i=0;i<5;i++){const bx=x-w/2+18+(i%3)*50,by=y-h+15+Math.floor(i/3)*54;box(bx,by,43,46,['#f0e1c9','#d0d6d4','#d9cbd8','#f0d7cb'][i%4]);ellipse(bx+21,by+5,3,3,'#8f6873');for(let j=0;j<3;j++)line(bx+8,by+20+j*7,bx+35,by+20+j*7,'#a49a8d',1)}}
 if(o.id==='wallbooks'){box(x-w/2,y-10,w,9,'#6c574c');box(x-w/2,y-3,w,5,'#b79a7b');for(let i=0;i<16;i++){let ht=25+(i*7%18);box(x-w/2+8+i*13,y-10-ht,10,ht,['#b98d87','#968ba5','#91a99e','#c8b390'][i%4]);box(x-w/2+13+i*13,y-ht-5,1,ht-7,'#f5e5cf84')}}
 if(o.id==='rug'){ellipse(x,y,w/2,h/2,'#a87b9e');ellipse(x,y,w/2-9,h/2-4,'#c2b2ba');for(let i=0;i<10;i++){let a=i*Math.PI/5;ellipse(x+Math.cos(a)*66,y+Math.sin(a)*5,10,4,'#fff3d5')}ellipse(x,y,12,6,'#fff1ba');}
 if(o.id==='bed'){shadow(x,y,90);box(x-78,y-85,156,90,'#956b77','#745565');round(x-81,y-96,162,58,14,'#b6a09f','#78576c');round(x-72,y-71,144,58,14,'#e2d3cd','#a77c99');for(let i=0;i<7;i++)line(x-66,y-23+i*5,x+67,y-23+i*5,i%2?'#d397ad':'#edc1d3',2);round(x-60,y-90,51,27,8,'#fff0dd','#b793a3');round(x+8,y-90,49,27,8,'#fff0dd','#b793a3');box(x-76,y-3,13,15,'#745767');box(x+63,y-3,13,15,'#745767');}
 if(o.id==='desk'){shadow(x,y,75);box(x-66,y-67,132,15,'#dcae9a','#8d5f66');box(x-61,y-51,12,55,'#91677b');box(x+50,y-51,12,55,'#91677b');box(x-20,y-93,65,27,'#776184','#453d61');box(x-16,y-89,57,19,'#aa9ccd');box(x+8,y-66,9,7,'#6f526d');box(x-55,y-73,26,7,'#f9e9ce');box(x-47,y-94,17,22,'#eeb2b7');line(x-40,y-95,x-40,y-108,'#6b8e74',3);ellipse(x-40,y-110,9,8,'#769974');}
 if(o.id==='shelf'){shadow(x,y,55);round(x-w/2,y-h+7,w,h-7,4,'#805a76','#5a405c');for(let yy=y-h+16;yy<y-16;yy+=34){box(x-w/2+8,yy+23,w-16,7,'#d3a08e','#674959');for(let xx=x-w/2+14;xx<x+w/2-14;xx+=12){box(xx,yy+3,8,19,['#e7b0be','#b7a4d5','#f7dca6','#8cacaa'][Math.floor(xx/12)%4])}}}
 if(o.id==='sofa'){shadow(x,y,90);round(x-77,y-78,154,68,19,'#9e929d','#7f6689');round(x-80,y-49,160,43,12,'#c0b4bf','#9c7aa3');round(x-81,y-67,30,56,12,'#a195a3');round(x+51,y-67,30,56,12,'#a195a3');round(x-19,y-54,42,28,8,'#ddd0bd');box(x-69,y-10,13,14,'#80617b');box(x+55,y-10,13,14,'#80617b');}
 if(o.id==='plant'||o.id==='purple_flower'){shadow(x,y,27);round(x-21,y-31,42,30,4,'#c48e84','#82535c');box(x-17,y-31,34,6,'#d7a096');line(x,y-30,x,y-75,'#58866b',4);for(let i=0;i<7;i++){let a=i*2.4;ellipse(x+Math.cos(a)*22+Math.sin(t/1200+a)*2,y-54+Math.sin(a)*15,16,9,i%2?'#8caf80':'#5d8c77')}if(o.id==='purple_flower')for(let i=0;i<5;i++)ellipse(x+Math.cos(i*1.3)*16,y-80+Math.sin(i*1.3)*5,8,6,'#ce91c5');}
 if(o.id==='lamp'||o.id==='night_lamp'){shadow(x,y,23);box(x-12,y-15,24,11,'#876576');line(x,y-15,x,y-62,'#8a687d',7);round(x-23,y-90,46,31,6,'#efb7bc','#a97992');if(data.lamps){ellipse(x,y-69,16,8,'#fff3c3');const g=ctx.createRadialGradient(x,y-64,3,x,y-55,93);g.addColorStop(0,'#fff4c46b');g.addColorStop(1,'#fff4c400');round(x-80,y-125,160,160,30,g);}}
 if(o.id==='window'){round(x-w/2,y-h,w,h,8,'#986a79','#5b4058');const sky=night()?'#454575':'#a7d4d2';box(x-w/2+12,y-h+12,w-24,h-23,sky);ellipse(x+35,y-h+36,19,19,night()?'#fff1bb':'#fff2c8');for(let i=0;i<7;i++){const xx=x-w/2+14+i*24;box(xx,y-51-((i*29)%43),18,37+((i*29)%43),night()?'#6f6087':'#947d98');for(let yy=y-42;yy<y-12;yy+=11)box(xx+5,yy,4,5,night()?'#f8d8a0':'#e5bfc6')}box(x-5,y-h+8,10,h-18,'#d7b7a5');box(x-w/2+9,y-h/2-5,w-18,10,'#d7b7a5');round(x-w/2-16,y-h+5,26,h-8,7,'#f3c8d4');round(x+w/2-10,y-h+5,26,h-8,7,'#f3c8d4');}
 if(o.id==='poster'){round(x-w/2,y-h,w,h,3,'#795b6b','#533a53');box(x-w/2+7,y-h+7,w-14,h-14,'#69537b');ellipse(x+14,y-h+27,14,14,'#f8daa9');for(let i=0;i<9;i++)box(x-w/2+13+(i*23)%60,y-h+16+(i*17)%58,3,3,'#fff0cc');line(x-28,y-21,x+23,y-21,'#bd9eb8',3);}
 if(o.id==='cat_companion'){shadow(x,y,25);ellipse(x,y-19,28,20,'#e9ba9b');ellipse(x-11,y-36,17,17,'#f4c8a4');ctx.fillStyle='#ebba93';ctx.beginPath();ctx.moveTo(x-25,y-43);ctx.lineTo(x-23,y-59);ctx.lineTo(x-9,y-48);ctx.moveTo(x-6,y-49);ctx.lineTo(x+3,y-59);ctx.lineTo(x+7,y-43);ctx.fill();ellipse(x-16,y-37,3,3,'#433d48');ellipse(x-6,y-37,3,3,'#433d48');line(x+23,y-18,x+32,y-41,'#e0ae8a',7);}
 if(o.id==='cassette'){shadow(x,y,27);round(x-29,y-37,58,30,5,'#b28bb9','#695473');round(x-24,y-32,48,19,2,'#f7c4ce');ellipse(x-12,y-22,7,7,'#7f6386');ellipse(x+12,y-22,7,7,'#7f6386');}
 if(selected===data.placed.indexOf(o)&&mode==='edit'){ctx.setLineDash([6,5]);ctx.strokeStyle='#fff7a5';ctx.lineWidth=3;ctx.strokeRect(x-w/2-8,y-h-8,w+16,h+16);ctx.setLineDash([])}ctx.restore()}
// Dibuja exactamente el mismo personaje de la plaza, con su estilo guardado.
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const ch = v => Math.max(0, Math.min(255, Math.round(v * f)));
  const r = ch((n >> 16) & 255), g = ch((n >> 8) & 255), b = ch(n & 255);
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

// c = contexto donde dibujar (el del juego o el de la vista previa)
function drawCharacter(c, p, cfg) {
  const { x, y, w, h, dir, step } = p;
  const cx = x + w / 2;
  const legOff = step === 1 ? 2 : 0;
  const hairMid = cfg.hair, hairDark = shade(cfg.hair, 0.78), hairShine = shade(cfg.hair, 1.25);

  c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(cx - 9, y + h - 3, 18, 4);

  c.fillStyle = cfg.bottom;
  if (dir !== 'up') {
    c.fillRect(x + 3, y + h - 9 + legOff, 5, 9); c.fillRect(x + w - 8, y + h - 9 - legOff, 5, 9);
  } else {
    c.fillRect(x + 3, y + h - 9, 5, 9); c.fillRect(x + w - 8, y + h - 9, 5, 9);
  }
  c.fillStyle = '#0a0a0a';
  c.fillRect(x + 2, y + h - 2 + legOff, 7, 2); c.fillRect(x + w - 9, y + h - 2 - legOff, 7, 2);
  c.fillStyle = cfg.accent;
  c.fillRect(x + 3, y + h - 1 + legOff, 5, 1); c.fillRect(x + w - 8, y + h - 1 - legOff, 5, 1);

  c.fillStyle = cfg.top; c.fillRect(x + 2, y + 9, w - 4, h - 18);
  c.fillStyle = shade(cfg.top, 0.6); c.fillRect(cx - 1, y + 10, 2, h - 20);

  if (dir !== 'up') { c.fillStyle = cfg.skin; c.fillRect(x + 3, y - 3, w - 6, 12); }

  const largo = cfg.style === 'largo', cola = cfg.style === 'cola';
  if (dir === 'down') {
    c.fillStyle = hairDark;
    c.fillRect(x + 2, y - 7, w - 4, 5);
    const sideH = largo ? 16 : 7;
    c.fillRect(x + 1, y - 4, 3, sideH);
    c.fillRect(x + w - 4, y - 4, 3, sideH);
    c.fillStyle = hairMid;
    c.fillRect(x + 3, y - 3, 3, 3); c.fillRect(x + 7, y - 4, 3, 4); c.fillRect(x + 11, y - 3, 3, 3);
    c.fillStyle = hairShine; c.fillRect(x + 4, y - 6, w - 8, 1);
  } else if (dir === 'up') {
    c.fillStyle = hairDark;
    c.fillRect(x + 1, y - 7, w - 2, largo ? 15 : 11);
    c.fillStyle = hairMid;
    c.fillRect(x + 2, y - 6, w - 4, 4);
    if (largo) { c.fillRect(x + 1, y + 6, 3, 8); c.fillRect(x + w - 4, y + 6, 3, 8); }
    c.fillStyle = hairShine;
    c.fillRect(x + 3, y - 6, 2, largo ? 10 : 6); c.fillRect(x + w - 5, y - 6, 2, largo ? 10 : 6);
    if (cola) { c.fillStyle = hairDark; c.fillRect(cx - 2, y + 4, 4, 10); c.fillStyle = cfg.accent; c.fillRect(cx - 2, y + 4, 4, 2); }
  } else if (dir === 'right') {
    c.fillStyle = hairDark;
    c.fillRect(x + 1, y - 7, w - 3, 6);
    c.fillRect(x + 1, y - 4, 4, largo ? 17 : 9);
    if (cola) { c.fillRect(x - 3, y - 2, 4, 10); c.fillStyle = cfg.accent; c.fillRect(x - 3, y - 2, 4, 2); }
    c.fillStyle = hairMid; c.fillRect(x + w - 6, y - 5, 4, 4);
    c.fillStyle = hairShine; c.fillRect(x + 2, y - 6, w - 6, 1);
  } else if (dir === 'left') {
    c.fillStyle = hairDark;
    c.fillRect(x + 4, y - 7, w - 3, 6);
    c.fillRect(x + w - 5, y - 4, 4, largo ? 17 : 9);
    if (cola) { c.fillRect(x + w - 1, y - 2, 4, 10); c.fillStyle = cfg.accent; c.fillRect(x + w - 1, y - 2, 4, 2); }
    c.fillStyle = hairMid; c.fillRect(x + 2, y - 5, 4, 4);
    c.fillStyle = hairShine; c.fillRect(x + 4, y - 6, w - 6, 1);
  }

  c.fillStyle = '#1a1010';
  if (dir === 'down') { c.fillRect(x + 5, y + 3, 2, 2); c.fillRect(x + w - 7, y + 3, 2, 2); }
  else if (dir === 'right') { c.fillRect(x + w - 6, y + 3, 2, 2); }
  else if (dir === 'left') { c.fillRect(x + 4, y + 3, 2, 2); }

  if (dir !== 'down') {
    c.fillStyle = cfg.bottom; c.fillRect(dir === 'up' ? x + 4 : x + 2, y + 10, 7, 9);
    c.fillStyle = cfg.accent; c.fillRect(dir === 'up' ? x + 6 : x + 4, y + 12, 3, 2);
  }
}

let facing='down';
function character(t){
 const base={skin:'#f6e7db',hair:'#ab653c',style:'largo',top:'#1c1c1c',bottom:'#141414',accent:'#4fd8ff'};
 try{const saved=JSON.parse(localStorage.getItem('ciudadPersonaje')||'{}');for(const k of ['skin','hair','top','bottom','accent'])if(/^#[0-9a-f]{6}$/i.test(saved[k]))base[k]=saved[k];if(['largo','corto','cola'].includes(saved.style))base.style=saved.style;}catch{}
 // Escala 2.45: preserva todos los píxeles originales, no inventa otro avatar.
 ctx.save(); ctx.translate(Math.round(playerX-22),Math.round(369-61));ctx.scale(2.45,2.45);
 drawCharacter(ctx,{x:0,y:7,w:18,h:25,dir:facing,step:Math.abs(step)>0.1?(Math.floor(step*3)%2):0},base);
 ctx.restore();
}

function draw(now){ctx.clearRect(0,0,VIEW,H);ctx.save();ctx.translate(-Math.round(cam),0);background(now);studioDetails(now);
 const objects=data.placed.slice().sort((a,b)=>a.y-b.y);const foreground=objects.filter(o=>o.y>=360);const behind=objects.filter(o=>o.y<360);for(const o of behind)furniture(o,now);character(now);for(const o of foreground)furniture(o,now);
 // Partículas y motas de luz.
 for(let i=0;i<28;i++){let x=(i*197+Math.sin(now/2700+i)*18)%W,y=38+(i*73)%288;ellipse(x,y,1.4,1.4,night()?'#fff2c88a':'#fff9eb8c')}
 ctx.restore();if(placing){ctx.save();ctx.globalAlpha=.45;const pos={x:pointer.x+cam,y:pointer.y};ctx.translate(-Math.round(cam),0);furniture({id:placing,x:pos.x,y:pos.y},now);ctx.restore()}requestAnimationFrame(tick)}
const pointer={x:500,y:260};function screenToWorld(x,y){const r=canvas.getBoundingClientRect();return{x:clamp(x/r.width*VIEW+cam,0,W),y:clamp(y/r.height*H,0,H)}}
function target(o,x,y){if(o.type==='pared')return{x:clamp(x,o.w/2+8,W-o.w/2-8),y:clamp(y,o.h+20,253)};return{x:clamp(x,o.w/2+8,W-o.w/2-8),y:clamp(y,290,395)}}
function collides(id,x,y,ignore=-1){const a=byId[id];if(a.id==='rug'||a.type==='pared'||a.id==='cat_companion')return false;return data.placed.some((o,i)=>{if(i===ignore||o.id==='rug'||byId[o.id]?.type==='pared'||o.id==='cat_companion')return false;const b=byId[o.id];return Math.abs(x-o.x)<(a.w+b.w)*.43&&Math.abs(y-o.y)<34})}
function add(id,x,y){if(available(id)<=0)return notify('Ya utilizaste todas las copias de este objeto.');const d=byId[id],p=target(d,x,y);if(collides(id,p.x,p.y))return notify('Ese espacio está ocupado. Prueba otro lugar.');snapshot();data.placed.push({id,x:p.x,y:p.y});selected=data.placed.length-1;placing=null;save();inventory();notify('¡Objeto colocado! Puedes arrastrarlo para moverlo. ✿')}
function nearest(x,y){const hits=data.placed.map((o,i)=>({o,i,d:byId[o.id]})).filter(v=>Math.abs(x-v.o.x)<v.d.w/2+8&&y>=v.o.y-v.d.h-7&&y<=v.o.y+12);hits.sort((a,b)=>b.o.y-a.o.y||b.i-a.i);return hits.length?hits[0].i:-1}
let history=[];function snapshot(){history.push(JSON.stringify({placed:data.placed,wall:data.wall,floor:data.floor,light:data.light}));if(history.length>20)history.shift();$('undo-btn').disabled=false}
function mousePos(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*VIEW,y:(e.clientY-r.top)/r.height*H}}
canvas.addEventListener('pointerdown',e=>{const p=mousePos(e),world=screenToWorld(e.clientX-canvas.getBoundingClientRect().left,e.clientY-canvas.getBoundingClientRect().top);pointer.x=p.x;pointer.y=p.y;canvas.setPointerCapture(e.pointerId);if(mode==='play'){goal=clamp(world.x,25,W-25);return}const found=nearest(world.x,world.y);if(placing){add(placing,world.x,world.y);return}if(found>=0){selected=found;drag={type:'item',i:found,dx:world.x-data.placed[found].x,dy:world.y-data.placed[found].y,prev:{...data.placed[found]}};selectedLabel();}else{drag={type:'pan',start:e.clientX,cam};selected=-1;selectedLabel();}});
canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect(),p=mousePos(e);pointer.x=p.x;pointer.y=p.y;if(!drag||mode!=='edit')return;if(drag.type==='pan')cam=clamp(drag.cam-(e.clientX-drag.start)/r.width*VIEW,0,W-VIEW);else{const w=screenToWorld(e.clientX-r.left,e.clientY-r.top),o=data.placed[drag.i],d=byId[o.id],at=target(d,w.x-drag.dx,w.y-drag.dy);o.x=at.x;o.y=at.y;}});
function finishDrag(){if(drag?.type==='item'){const o=data.placed[drag.i];if(collides(o.id,o.x,o.y,drag.i)&&!collides(o.id,drag.prev.x,drag.prev.y,drag.i)){Object.assign(o,drag.prev);notify('Se superpone con otro mueble. Se conservó la posición anterior.')}else{const cur={...o};Object.assign(o,drag.prev);snapshot();Object.assign(o,cur);save()}}drag=null}canvas.addEventListener('pointerup',finishDrag);canvas.addEventListener('pointercancel',finishDrag);
const keyDown=new Set();window.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','a','d','A','D'].includes(e.key)&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)){keyDown.add(e.key.toLowerCase());if(e.key.startsWith('Arrow'))e.preventDefault()}if(e.key==='Escape'&&mode==='edit')setMode('play');if((e.key==='Delete'||e.key==='Backspace')&&mode==='edit'&&selected>=0&&document.activeElement?.tagName!=='INPUT'){e.preventDefault();removeSelected()}});window.addEventListener('keyup',e=>keyDown.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keyDown.clear());
function tick(t){const dt=Math.min(55,t-last||16)/16.67;last=t;if(mode==='play'){if(keyDown.has('arrowleft')||keyDown.has('a')){goal=playerX-3.3*dt;facing='left'}if(keyDown.has('arrowright')||keyDown.has('d')){goal=playerX+3.3*dt;facing='right'}goal=clamp(goal,25,W-25);const dx=goal-playerX;if(Math.abs(dx)>1){facing=dx>0?'right':'left'}if(Math.abs(dx)>1){playerX+=Math.sign(dx)*Math.min(Math.abs(dx),3.3*dt);step+=.16*dt;data.playerX=playerX}else step=0;const focus=clamp(playerX-VIEW*.45,0,W-VIEW);cam+=(focus-cam)*Math.min(.11*dt,1)}draw(t)}
function setMode(m){mode=m;placing=null;selected=-1;drag=null;$('scene-wrap').classList.toggle('editing',m==='edit');$('editor').classList.toggle('closed',m!=='edit');$('mode-btn').textContent=m==='edit'?'✓ Terminar':'✦ Decorar';$('tray-btn').hidden=m!=='edit';$('tray-btn').textContent='⌑ Ocultar inventario';$('lamp-btn').hidden=m==='edit';if(m==='edit'){inventory();notify('Elige un mueble. Arrastra el fondo para recorrer tu habitación.')}else save();selectedLabel()}
function syncPlacedList(){const list=$('placed-list');if(!list)return;const previous=String(selected);list.replaceChildren();const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='Seleccionar mueble colocado…';list.append(placeholder);data.placed.forEach((o,i)=>{const opt=document.createElement('option');opt.value=String(i);opt.textContent=(byId[o.id]?.icon||'✦')+' '+(byId[o.id]?.name||o.id)+' · '+(i+1);list.append(opt)});list.value=selected>=0?previous:'';}
function focusSelected(){if(selected<0)return;cam=clamp(data.placed[selected].x-VIEW/2,0,W-VIEW)}
function nudge(dx,dy){if(selected<0)return;const o=data.placed[selected],p=target(byId[o.id],o.x+dx,o.y+dy);if(collides(o.id,p.x,p.y,selected)){notify('Ese espacio está ocupado');return}snapshot();o.x=p.x;o.y=p.y;save();selectedLabel()}
function reorganize(){if(!confirm('¿Distribuir automáticamente los muebles superpuestos? Puedes deshacerlo.'))return;snapshot();let moved=0;data.placed.forEach((o,i)=>{if(byId[o.id]?.type==='pared'||o.id==='rug')return;let tries=0;while(collides(o.id,o.x,o.y,i)&&tries++<120){const p=target(byId[o.id],o.x+25,o.y);if(p.x===o.x){o.x=byId[o.id].w/2+15;o.y=clamp(o.y+42,290,395)}else o.x=p.x;moved++}});save();selectedLabel();notify(moved?'Distribución ajustada. Puedes deshacerla.':'No se encontraron superposiciones detectables.')}
function selectedLabel(){syncPlacedList();$('selected-label').textContent=placing?'Haz clic en la habitación para colocar: '+byId[placing].name:selected>=0?'Seleccionado: '+byId[data.placed[selected].id].name:'Elige un objeto para colocarlo.';$('remove-btn').disabled=selected<0}
function removeSelected(){if(selected<0)return;snapshot();data.placed.splice(selected,1);selected=-1;save();inventory();selectedLabel();notify('Objeto retirado. Sigue en tu inventario.')}
function inventory(){const root=$('inventory');root.replaceChildren();const group=category;function item(icon,name,desc,onclick,disabled=false){const b=document.createElement('button');b.className='item';b.disabled=disabled;b.innerHTML='<span class="ico"></span><strong></strong><small></small>';b.children[0].textContent=icon;b.children[1].textContent=name;b.children[2].textContent=desc;b.onclick=onclick;root.append(b)};
 if(group==='ambiente'){for(const [id,name,col] of [['rose','Rosa empolvado','🌷'],['lilac','Lila suave','💜'],['cream','Crema cálido','🤍'],['sage','Verde salvia','🌿']])item(col,name,'Pared',()=>{snapshot();data.wall=id;save();notify('Paredes actualizadas')});for(const [id,name,icon] of [['oak','Madera rosa','🪵'],['cream','Madera crema','🏡'],['plum','Suelo violeta','💜'],['mint','Suelo menta','🌱']])item(icon,name,'Suelo',()=>{snapshot();data.floor=id;save();notify('Suelo actualizado')});for(const [id,name,icon] of [['auto','Hora real','🕒'],['day','Siempre de día','☀️'],['night','Siempre de noche','🌙']])item(icon,name,'Luz exterior',()=>{snapshot();data.light=id;save();notify('Iluminación actualizada')});item('💡',data.lamps?'Apagar lámparas':'Encender lámparas','Iluminación interior',()=>{snapshot();data.lamps=!data.lamps;save();inventory()});return}
 for(const d of catalog.filter(x=>group==='todos'||x.type===group))item(d.icon,d.name,available(d.id)+' disponible(s)',()=>{placing=d.id;selected=-1;selectedLabel();notify('Haz clic en el escenario para colocar '+d.name)},available(d.id)<=0)}
function seeds(){try{const v=JSON.parse(localStorage.getItem('ciudadSemillas'));return typeof v==='number'?v:(Number(v?.balance)||Number(v?.semillas)||0)}catch{return Number(localStorage.getItem('ciudadSemillas'))||0}}
$('seed-display').textContent='✿ '+seeds()+' semillas';$('mode-btn').onclick=()=>setMode(mode==='edit'?'play':'edit');$('close-editor').onclick=()=>setMode('play');$('tray-btn').onclick=()=>{const hidden=$('editor').classList.toggle('closed');$('tray-btn').textContent=hidden?'⌑ Mostrar inventario':'⌑ Ocultar inventario';};$('lamp-btn').onclick=()=>{data.lamps=!data.lamps;save();notify(data.lamps?'Lámparas encendidas':'Lámparas apagadas');$('lamp-btn').textContent=data.lamps?'☀ Apagar lámparas':'☾ Encender lámparas'};$('lamp-btn').textContent=data.lamps?'☀ Apagar lámparas':'☾ Encender lámparas';$('undo-btn').onclick=()=>{const prev=history.pop();if(!prev)return;Object.assign(data,JSON.parse(prev));selected=-1;placing=null;save();inventory();selectedLabel();$('undo-btn').disabled=!history.length};$('undo-btn').disabled=true;$('remove-btn').onclick=removeSelected;$('placed-list').onchange=e=>{selected=e.target.value===''?-1:Number(e.target.value);placing=null;focusSelected();selectedLabel()};document.querySelectorAll('[data-nudge]').forEach(b=>b.onclick=()=>{const [dx,dy]=b.dataset.nudge.split(',').map(Number);nudge(dx,dy)});$('arrange-btn').onclick=reorganize;$('neutral-btn').onclick=()=>{snapshot();data.wall='cream';data.floor='cream';save();notify('Paleta neutra aplicada, sin mover tus muebles')};document.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{category=b.dataset.category;document.querySelectorAll('[data-category]').forEach(t=>t.classList.toggle('active',t===b));inventory()});$('reset-layout').onclick=()=>{if(!confirm('¿Restaurar la disposición de muestra del estudio creativo? Se reemplazarán los muebles colocados, pero no perderás tu colección.'))return;snapshot();data.placed=DEFAULT.placed.map(o=>({...o}));goal=DEFAULT.playerX;playerX=goal;cam=0;save();inventory();notify('Rincón creativo restaurado ✿')};$('help-btn').onclick=()=>{$('instructions').hidden=false};$('close-help').onclick=()=>{$('instructions').hidden=true};
function clock(){const now=new Date(),hr=now.getHours();$('clock').textContent=(hr>=7&&hr<19?'☀':'☾')+' '+now.toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'});$('seed-display').textContent='✿ '+seeds()+' semillas'}
// V9.1: la habitación también puede recuperar su estado directamente, sin pasar por Mi cuenta.
// No escribe nunca en la nube: evita sobrescribir accidentalmente una copia buena.
async function initCloud(){
 const status=$('cloud-status'),btn=$('cloud-load');
 const setStatus=(message)=>{status.textContent=message};
 if(!window.supabase?.createClient){setStatus('☁ Sin conexión a Supabase');btn.disabled=true;return}
 const db=window.supabase.createClient('https://mqjprleqctafnhokxcyk.supabase.co','sb_publishable_i9HKZXTtwrm709JyZ33rcg_OMe5oMp7',{auth:{persistSession:true,autoRefreshToken:true}});
 let uid=null;
 const load=async(force=false)=>{
  btn.disabled=true;setStatus('☁ Recuperando habitación…');
  try{
   const {data:auth,error:authError}=await db.auth.getUser();
   if(authError||!auth?.user){setStatus('☁ Inicia sesión en Mi cuenta');return}
   uid=auth.user.id;
   const {data:row,error}=await db.from('ciudad_rooms').select('state,revision').eq('user_id',uid).maybeSingle();
   if(error)throw error;
   const cloud=row?.state;
   if(!cloud||!Array.isArray(cloud.placed)||!cloud.placed.every(o=>o&&byId[o.id]&&Number.isFinite(o.x)&&Number.isFinite(o.y))){setStatus('☁ No hay habitación compatible en la nube');return}
   if(!force){
    // La copia inicial por defecto es reemplazable; una decoración local personalizada no.
    const sameDefault=JSON.stringify(data.placed)===JSON.stringify(DEFAULT.placed)&&data.wall===DEFAULT.wall&&data.floor===DEFAULT.floor;
    if(!sameDefault){setStatus('☁ Cuenta conectada · pulsa Cargar nube para cambiar');return}
   }
   if(force&&!confirm(`¿Cargar ${cloud.placed.length} muebles desde Supabase? Tu decoración local quedará respaldada en este navegador.`)){setStatus('☁ Carga cancelada');return}
   const backup=localStorage.getItem(KEY);
   if(backup)localStorage.setItem('ciudadHabitacionRespaldoV9_1',backup);
   Object.assign(data,DEFAULT,cloud,{placed:cloud.placed.map(o=>({...o}))});
   selected=-1;placing=null;drag=null;mode='play';
   goal=clamp(Number(data.playerX)||DEFAULT.playerX,30,W-30);playerX=goal;cam=clamp(playerX-VIEW*.45,0,W-VIEW);
   $('scene-wrap').classList.remove('editing');$('editor').classList.add('closed');$('mode-btn').textContent='✦ Decorar';$('lamp-btn').hidden=false;$('tray-btn').hidden=true;
   save();inventory();selectedLabel();
   setStatus(`☁ Recuperada de Supabase: ${data.placed.length} muebles · revisión ${row.revision}`);
   notify(`Habitación recuperada: ${data.placed.length} muebles`);
  }catch(e){console.error('Error recuperando habitación',e);setStatus('☁ Error: '+(e.message||'No se pudo recuperar'))}
  finally{btn.disabled=false}
 };
 btn.onclick=()=>load(true);
 await load(false);
}

clock();setInterval(clock,45000);initCloud();setInterval(()=>{if(mode==='play')save()},7000);cam=clamp(playerX-VIEW*.45,0,W-VIEW);inventory();selectedLabel();requestAnimationFrame(tick);
})();
