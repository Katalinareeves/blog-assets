// ═══════════════════════════════════════════════════════════
//  LA CIUDAD — motor RPG top-down, calcado de tu Capa 2 real:
//  cielo + veredas + calle con cruce peatonal + fachadas
//  patrimoniales/modernas + autos + postes + micro cruzando
// ═══════════════════════════════════════════════════════════
"use strict";

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;
const ORIGINAL_W = 640;
const DISTRICT_OFFSET = (W - ORIGINAL_W) / 2;

const SEED_KEY = 'ciudadSemillas';
function getSeeds() { return parseInt(localStorage.getItem(SEED_KEY) || '0', 10); }
function renderSeeds() { document.getElementById('val-seeds').textContent = getSeeds(); }
renderSeeds();

// ── MODO DÍA / NOCHE ──
// Se guarda en localStorage para que se mantenga entre recargas.
// Por defecto arranca de día; el farol del HUD alterna a noche.
const NIGHT_KEY = 'ciudadModoNoche';
let isNight = localStorage.getItem(NIGHT_KEY) === '1';

function setNightMode(value) {
  isNight = value;
  localStorage.setItem(NIGHT_KEY, value ? '1' : '0');
  const btn = document.getElementById('nightToggle');
  if (btn) {
    btn.textContent = isNight ? '☀' : '☾';
    btn.title = isNight ? 'cambiar a modo día' : 'cambiar a modo noche';
    btn.classList.toggle('active', isNight);
  }
}

function initNightToggle() {
  const btn = document.getElementById('nightToggle');
  if (!btn) return;
  btn.addEventListener('click', () => setNightMode(!isNight));
  setNightMode(isNight); // refleja el estado cargado en el botón
}

const state = { isPaused: false, transitioning: false };

const player = { x: 80 + DISTRICT_OFFSET, y: 390, w: 18, h: 25, speed: 3, dir: 'down', step: 0, stepTimer: 0 };

const keys = {};
window.addEventListener('keydown', e => {
  if (charUI.open) return;
  keys[e.key] = true;
  if (e.key.toLowerCase() === 'e') tryInteract();
});
window.addEventListener('keyup', e => { keys[e.key] = false; });

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function triggerZone(rect, pad = 14) {
  return { x: rect.x - pad, y: rect.y - pad, w: rect.w + pad * 2, h: rect.h + pad * 2 };
}

// ── PAREDES (solo el borde — la calle se camina libre, como tu Capa 2 real) ──
const walls = [
  { x: 0, y: 0, w: W, h: 16 }, { x: 0, y: H - 16, w: W, h: 16 },
  { x: 0, y: 0, w: 16, h: H }, { x: W - 16, y: 0, w: 16, h: H },
];

// ── EDIFICIOS — fila de fachadas, mismo estilo que tu R7/R8/R4/R2/R14/R1 ──
const buildings = [
  {
    id: 'universidad', label: 'UNIVERSIDAD', type: 'patrimonial', x: 0, y: 0, w: 130, h: 130,
    colorBase: '#c8b888', colorOscuro: '#b0a070', colorMoldura: '#d8c898',
    ventanas: [[10, 18], [50, 18], [90, 18], [10, 54], [50, 54], [90, 54], [10, 90], [50, 90], [90, 90]],
    anchoV: 28, altoV: 22, entrada: { x: 50, w: 30, h: 26 }, colV: '#1a2a40', cornisa: true,
    href: '../scenes/universidad/index.html',
  },
  {
    id: null, label: '', type: 'moderna', x: 130, y: 0, w: 80, h: 130,
    colorBase: '#585860', colorClaro: '#686870',
    ventanas: [[8, 12], [44, 12], [8, 40], [44, 40], [8, 68], [44, 68], [8, 96], [44, 96]],
    anchoV: 24, altoV: 20, colV: '#203848',
  },
  {
    id: 'biblioteca', label: 'BIBLIOTECA', type: 'patrimonial', x: 210, y: 0, w: 160, h: 130,
    colorBase: '#d4c090', colorOscuro: '#bca870', colorMoldura: '#e4d0a0',
    ventanas: [[10, 16], [54, 16], [98, 16], [132, 16], [10, 52], [54, 52], [98, 52], [132, 52], [10, 88], [54, 88], [98, 88], [132, 88]],
    anchoV: 30, altoV: 24, entrada: { x: 65, w: 30, h: 28 }, colV: '#1a3050', cornisa: true,
    href: '../scenes/biblioteca/index.html',
  },
  {
    id: 'banco', label: 'BANCO', type: 'patrimonial', x: 370, y: 0, w: 100, h: 130,
    colorBase: '#c8b880', colorOscuro: '#b0a068', colorMoldura: '#d8c890',
    ventanas: [[10, 18], [58, 18], [10, 52], [58, 52], [10, 86], [58, 86]],
    anchoV: 28, altoV: 22, entrada: { x: 35, w: 28, h: 24 }, colV: '#1a2840', cornisa: false,
    href: '../scenes/banco/index.html',
  },
  {
    id: 'taller', label: 'TALLER', type: 'moderna', x: 470, y: 0, w: 90, h: 130,
    colorBase: '#304050', colorClaro: '#405060',
    ventanas: [[8, 8], [36, 8], [64, 8], [8, 34], [36, 34], [64, 34], [8, 60], [36, 60], [64, 60], [8, 86], [36, 86], [64, 86]],
    anchoV: 20, altoV: 20, entrada: { x: 33, w: 24, h: 22 }, colV: '#204060',
    href: '/scenes/taller/index.html?v=30',
  },
  {
    id: 'pphy', label: 'PPHY', type: 'patrimonial', x: 560, y: 0, w: 80, h: 130,
    colorBase: '#b8a878', colorOscuro: '#a09060', colorMoldura: '#c8b888',
    ventanas: [[10, 20], [48, 20], [10, 56], [48, 56], [10, 90], [48, 90]],
    anchoV: 22, altoV: 20, entrada: { x: 28, w: 24, h: 22 }, colV: '#182030', cornisa: false,
    href: '../scenes/pphy/index.html',
  },
];
buildings.forEach(b => {
  if (b.entrada) b.entradaAbs = { x: DISTRICT_OFFSET + b.x + b.entrada.x, y: b.y + b.h - b.entrada.h, w: b.entrada.w, h: b.entrada.h };
});

// ── PARADA DE MICRO — reemplaza el bus animado de fondo por un punto
// de interacción real, junto a la vereda inferior ──
const busStop = { x: 540 + DISTRICT_OFFSET, y: 424, w: 20, h: 10, href: null };

let nearTarget = null; // { kind:'building', ref } | { kind:'bus', ref }

// ── DIALOG ──
function showDialog(title, text, options) {
  state.isPaused = true;
  document.getElementById('dialog-title').textContent = title;
  document.getElementById('dialog-text').textContent = text;
  const opts = document.getElementById('dialog-options');
  opts.innerHTML = '';
  options.forEach(o => {
    const btn = document.createElement('button');
    btn.textContent = o.label;
    btn.addEventListener('click', () => { hideDialog(); o.action(); });
    opts.appendChild(btn);
  });
  document.getElementById('dialog-box').classList.remove('hidden');
  document.getElementById('prompt-box').classList.add('hidden');
}
function hideDialog() {
  document.getElementById('dialog-box').classList.add('hidden');
  state.isPaused = false;
}

function tryInteract() {
  if (!nearTarget || state.isPaused || state.transitioning) return;
  if (nearTarget.kind === 'bus') {
    showDialog('PARADA DE MICRO', 'La ruta hacia otros mundos no está disponible desde La Ciudad compartida. Este será un punto para futuras aventuras dentro de la ciudad.', [
      { label: 'Seguir explorando', action: () => {} },
    ]);
  } else {
    const b = nearTarget.ref;
    showDialog(b.label, `Entrar a ${b.label.toLowerCase()}?`, [
      { label: 'Entrar', action: () => goTo(b.href) },
      { label: 'Ahora no', action: () => {} },
    ]);
  }
}

function goTo(href) {
  state.transitioning = true;
  document.getElementById('fade').classList.add('active');
  setTimeout(() => { window.location.href = href; }, 400);
}
function startTravel(href) {
  state.transitioning = true;
  const fade = document.getElementById('fade');
  fade.classList.add('active');
  setTimeout(() => {
    fade.classList.remove('active');
    document.getElementById('travel-screen').classList.remove('hidden');
    setTimeout(() => { window.location.href = href; }, 1800);
  }, 400);
}

// ══════════════════════════════════════════════════════════
//  ESCENA — porteado directo de tu drawLayer2 real
//  + paleta de día/noche alternable con isNight
// ══════════════════════════════════════════════════════════
function drawScene() {
  // La cuadra original ocupa el centro, sin modificar sus píxeles ni fachadas.
  drawDistrictExtensions();
  ctx.save();
  ctx.beginPath();ctx.rect(DISTRICT_OFFSET,0,ORIGINAL_W,H);ctx.clip();
  ctx.translate(DISTRICT_OFFSET,0);
  drawOriginalDistrict();
  ctx.restore();
  // Todo el tránsito se dibuja en coordenadas del mundo completo (960 px),
  // FUERA del recorte de la cuadra original. Cruza sus límites sin teletransportarse.
  const worldTime = performance.now() / 1000;
  drawMicro(((worldTime * 40) % (W + 100)) - 85, 230);
  drawRepublicaTraffic(worldTime);
  drawRepublicaPedestrians(worldTime);
  // Personajes en coordenadas globales: las fachadas nuevas sí son explorables.
  drawPlayer(player);
  if (window.CityMultiplayer) window.CityMultiplayer.draw();
}

function drawOriginalDistrict() {
  const t = performance.now() / 1000;

  if (isNight) {
    // ---- NOCHE: morados oscuros / azul medianoche ----
    ctx.fillStyle = '#0b0616'; ctx.fillRect(0, 0, W, H);
    const skyG = ctx.createLinearGradient(0, 0, 0, 130);
    skyG.addColorStop(0, 'rgba(26,14,48,1)');
    skyG.addColorStop(1, 'rgba(12,8,26,1)');
    ctx.fillStyle = skyG; ctx.fillRect(0, 0, W, 130);

    // estrellas, más presentes que de día
    ctx.fillStyle = 'rgba(220,210,255,0.75)';
    [[30, 8], [88, 14], [160, 5], [240, 11], [310, 7], [390, 13], [460, 4], [530, 9], [600, 14], [70, 22], [290, 19],
     [45, 30], [130, 25], [200, 32], [350, 22], [420, 28], [480, 20], [560, 25]]
      .forEach(([sx, sy]) => ctx.fillRect(sx, sy, 2, 2));

    // luna
    ctx.fillStyle = 'rgba(235,230,255,0.9)';
    ctx.beginPath(); ctx.arc(580, 34, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0b0616';
    ctx.beginPath(); ctx.arc(585, 30, 10, 0, Math.PI * 2); ctx.fill();
  } else {
    // ---- DÍA: cielo despejado ----
    ctx.fillStyle = '#7fc8e8'; ctx.fillRect(0, 0, W, H);
    const skyG = ctx.createLinearGradient(0, 0, 0, 130);
    skyG.addColorStop(0, 'rgba(140,210,245,1)');
    skyG.addColorStop(1, 'rgba(200,235,250,1)');
    ctx.fillStyle = skyG; ctx.fillRect(0, 0, W, 130);

    // sol con halo suave
    const sunG = ctx.createRadialGradient(560, 26, 2, 560, 26, 34);
    sunG.addColorStop(0, 'rgba(255,244,200,0.9)');
    sunG.addColorStop(1, 'rgba(255,244,200,0)');
    ctx.fillStyle = sunG; ctx.beginPath(); ctx.arc(560, 26, 34, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff6d8';
    ctx.beginPath(); ctx.arc(560, 26, 13, 0, Math.PI * 2); ctx.fill();

    // un par de nubes simples
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    [[90, 24], [220, 16], [340, 30]].forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.ellipse(cx, cy, 20, 8, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 14, cy + 3, 14, 7, 0, 0, Math.PI * 2);
      ctx.ellipse(cx - 14, cy + 3, 14, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  const vereda = isNight ? '#221a34' : '#cfc9b4';
  const veredaLinea = isNight ? '#160f24' : '#b0aa93';
  const veredaBorde = isNight ? '#302446' : '#dfd9c2';
  const calzada = isNight ? '#100a1e' : '#5a5a56';
  const lineaCentral = isNight ? 'rgba(190,170,255,0.22)' : 'rgba(230,200,40,0.65)';
  const cruceColor = isNight ? 'rgba(200,190,255,0.12)' : 'rgba(255,255,255,0.55)';

  // vereda superior
  ctx.fillStyle = vereda; ctx.fillRect(0, 128, W, 18);
  ctx.strokeStyle = veredaLinea; ctx.lineWidth = 0.5;
  for (let i = 0; i < W; i += 16) { ctx.beginPath(); ctx.moveTo(i, 128); ctx.lineTo(i, 146); ctx.stroke(); }
  ctx.fillStyle = veredaBorde; ctx.fillRect(0, 145, W, 4);

  // calzada
  ctx.fillStyle = calzada; ctx.fillRect(0, 149, W, H - 149);
  ctx.strokeStyle = lineaCentral; ctx.lineWidth = 2;
  ctx.setLineDash([22, 14]);
  ctx.beginPath(); ctx.moveTo(0, 290); ctx.lineTo(W, 290); ctx.stroke();
  ctx.setLineDash([]);

  // cruce peatonal
  ctx.fillStyle = cruceColor;
  for (let i = 0; i < 7; i++) {
    ctx.fillRect(295 + i * 14, 149, 10, 18);
    ctx.fillRect(295 + i * 14, 418, 10, 22);
  }

  // vereda inferior
  ctx.fillStyle = vereda; ctx.fillRect(0, 436, W, 28);
  ctx.strokeStyle = veredaLinea; ctx.lineWidth = 0.5;
  for (let i = 0; i < W; i += 16) { ctx.beginPath(); ctx.moveTo(i, 436); ctx.lineTo(i, 464); ctx.stroke(); }
  ctx.fillStyle = veredaBorde; ctx.fillRect(0, 435, W, 4);

  buildings.forEach(b => {
    if (b.type === 'patrimonial') drawFachadaPatrimonial(b);
    else drawFachadaModerna(b);
  });
  drawLocalPlantaBaja(370, 88, 60, 42);

  [100, 320, 540].forEach(px => drawPosteLuz(px, 146, -100));
  [130, 340, 480, 548].forEach(tx => drawArbol(tx, 150));

  ctx.save();
  ctx.globalAlpha = isNight ? 0.75 : 0.22;
  if (isNight) { ctx.shadowColor = '#ff2f8f'; ctx.shadowBlur = 8; }
  ctx.font = '7px monospace';
  ctx.fillStyle = '#eb1552'; ctx.fillText('XUPALO KAST', 8, 126);
  ctx.fillStyle = '#eb1552'; ctx.fillText('KKAST', 38, 124);
  ctx.fillStyle = '#eb1552'; ctx.fillText('TE ♥ MATIAS ', 216, 127);
  ctx.fillStyle = '#eb1552'; ctx.fillText('KYM', 565, 127);
  ctx.restore();

  [160, 380, 560].forEach(px => drawPosteLuz(px, 436, 1));
  [80, 230, 440, 600].forEach(tx => drawArbol(tx, 440));

  drawAuto2(30, 150, '#1a243a', false); drawAuto2(440, 155, '#181a28', false);
  drawAuto2(105, 408, '#282018', true); drawAuto2(480, 408, '#201818', true);

  // La micro, los vehículos y estudiantes se dibujan una sola vez en
  // coordenadas globales, después de cerrar el recorte de la cuadra antigua.
  drawRepublicaDetails(t);
  drawParadaMicro({ ...busStop, x: busStop.x - DISTRICT_OFFSET }, nearTarget && nearTarget.kind === 'bus');

}

// Nuevas fachadas de la misma cuadra, no reemplazos de las originales.
const districtExtras=[
 {id:null,label:'CAFÉ',type:'patrimonial',x:0,y:0,w:80,h:130,
  colorBase:'#b5a186',colorOscuro:'#877362',colorMoldura:'#d2bf9f',
  ventanas:[[8,15],[45,15],[8,52],[45,52],[8,88],[45,88]],
  anchoV:24,altoV:20,entrada:{x:27,w:26,h:27},colV:'#27323c',cornisa:true},
 {id:null,label:'COPIAS',type:'moderna',x:80,y:0,w:80,h:130,
  colorBase:'#66616d',colorClaro:'#81798b',
  ventanas:[[8,12],[45,12],[8,42],[45,42],[8,73],[45,73]],anchoV:24,altoV:20,
  entrada:{x:29,w:24,h:30},colV:'#263d4c'},
 {id:null,label:'',type:'patrimonial',x:W-160,y:0,w:80,h:130,
  colorBase:'#c4ad8c',colorOscuro:'#9b876e',colorMoldura:'#dfc5a5',
  ventanas:[[8,14],[44,14],[8,51],[44,51],[8,87],[44,87]],anchoV:24,altoV:22,
  entrada:{x:27,w:26,h:28},colV:'#304455',cornisa:true},
 {id:null,label:'',type:'patrimonial',x:W-80,y:0,w:80,h:130,
  colorBase:'#b5a49b',colorOscuro:'#8c7773',colorMoldura:'#d4bbb1',
  ventanas:[[8,14],[44,14],[8,51],[44,51],[8,87],[44,87]],anchoV:24,altoV:22,
  entrada:{x:29,w:24,h:28},colV:'#33404a',cornisa:false}
];
function drawDistrictExtensions(){
 const t=performance.now()/1000;
 ctx.fillStyle=isNight?'#0b0616':'#a4d5ec';ctx.fillRect(0,0,W,H);
 const sky=ctx.createLinearGradient(0,0,0,128);
 sky.addColorStop(0,isNight?'#170d2b':'#8ad1ef');
 sky.addColorStop(1,isNight?'#0c081a':'#c6ebfa');
 ctx.fillStyle=sky;ctx.fillRect(0,0,W,128);
 for(const [x,w] of [[0,DISTRICT_OFFSET],[DISTRICT_OFFSET+ORIGINAL_W,DISTRICT_OFFSET]]){
  ctx.fillStyle=isNight?'#221a34':'#cfc9b4';ctx.fillRect(x,128,w,18);
  ctx.fillStyle=isNight?'#302446':'#dfd9c2';ctx.fillRect(x,145,w,4);
  ctx.fillStyle=isNight?'#100a1e':'#5a5a56';ctx.fillRect(x,149,w,H-149);
  ctx.fillStyle=isNight?'#221a34':'#cfc9b4';ctx.fillRect(x,436,w,28);
  ctx.fillStyle=isNight?'#302446':'#dfd9c2';ctx.fillRect(x,435,w,4);
  ctx.strokeStyle=isNight?'#160f24':'#b0aa93';ctx.lineWidth=.5;
  for(let i=x;i<x+w;i+=16){ctx.beginPath();ctx.moveTo(i,128);ctx.lineTo(i,146);ctx.moveTo(i,436);ctx.lineTo(i,464);ctx.stroke();}
  ctx.strokeStyle=isNight?'#76698a':'#dfc652';ctx.lineWidth=2;ctx.setLineDash([22,14]);
  ctx.beginPath();ctx.moveTo(x,290);ctx.lineTo(x+w,290);ctx.stroke();ctx.setLineDash([]);
 }
 for(const b of districtExtras) {
  if(b.type==='patrimonial')drawFachadaPatrimonial(b);else drawFachadaModerna(b);
 }
 // Detalles de calle discretos, sin afiches ni bicicletas.
 for(const px of [90,W-91]){drawPosteLuz(px,146,-100);drawPosteLuz(px,436,1);}
 for(const px of [138,W-136])drawArbol(px,150);
 for(const px of [85,W-95])drawArbol(px,440);
 // Todo el tráfico se dibuja en drawScene fuera del recorte, de borde a borde.
}

function drawFachadaPatrimonial(b) {
  const { x, y, w, h } = b;
  const highlighted = nearTarget && nearTarget.kind === 'building' && nearTarget.ref === b;
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x + w, y + 3, 5, h);
  ctx.fillStyle = b.colorBase; ctx.fillRect(x, y, w, h);
  if (b.cornisa) {
    ctx.fillStyle = b.colorMoldura;
    ctx.fillRect(x - 2, y, w + 4, 10); ctx.fillRect(x - 1, y + 10, w + 2, 4);
  }
  ctx.fillStyle = b.colorMoldura;
  for (let p = 1; p < 3; p++) { const my = y + Math.floor(h * p / 3); ctx.fillRect(x, my, w, 4); }
  ctx.fillStyle = b.colorOscuro; ctx.fillRect(x, y + h - 30, w, 30);

  // de noche, un velo morado sobre la fachada (multiply) antes de las
  // ventanas, para que la piedra/ladrillo se vea nocturna pero las
  // ventanas encendidas queden cálidas y sin verse afectadas
  if (isNight) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(70,45,130,0.55)';
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  b.ventanas.forEach(([vx, vy]) => {
    const wx = x + vx, wy = y + vy, vw = b.anchoV, vh = b.altoV;
    ctx.fillStyle = b.colorMoldura; ctx.fillRect(wx - 3, wy - 3, vw + 6, vh + 6);

    if (isNight) {
      const lit = ((wx * 3 + wy * 7) % 11) > 1; // casi todas encendidas de noche
      if (lit) {
        const cx = wx + vw / 2, cy = wy + vh / 2;
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, vw * 1.6);
        glow.addColorStop(0, 'rgba(255,200,110,0.35)');
        glow.addColorStop(1, 'rgba(255,200,110,0)');
        ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, vw * 1.6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = lit ? '#f7c463' : '#0b0714';
      ctx.fillRect(wx, wy, vw, vh);
      if (lit) { ctx.fillStyle = 'rgba(255,225,170,0.25)'; ctx.fillRect(wx, wy, vw / 2, vh); }
    } else {
      const lit = ((wx * 3 + wy * 7) % 11) > 7; // pocas encendidas de día
      ctx.fillStyle = lit ? b.colV : '#d8ecf5';
      ctx.fillRect(wx, wy, vw, vh);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(wx, wy, vw / 2, vh);
    }

    ctx.fillStyle = b.colorMoldura;
    ctx.fillRect(wx + vw / 2 - 1, wy, 2, vh); ctx.fillRect(wx, wy + vh / 2 - 1, vw, 2);
  });

  if (b.entrada) {
    const ex = x + b.entrada.x, ey = y + h - b.entrada.h;
    ctx.fillStyle = b.colorMoldura; ctx.fillRect(ex - 4, ey - 6, b.entrada.w + 8, b.entrada.h + 6);
    ctx.fillStyle = highlighted ? '#4fd8ff' : '#0a0c10'; ctx.fillRect(ex, ey, b.entrada.w, b.entrada.h);
    if (!highlighted) { ctx.fillStyle = 'rgba(80,120,180,0.08)'; ctx.fillRect(ex + 2, ey + 2, b.entrada.w / 2 - 2, b.entrada.h - 4); }
    ctx.fillStyle = b.colorOscuro; ctx.fillRect(ex + b.entrada.w / 2 - 1, ey, 2, b.entrada.h);
  }
  if (b.label) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x + w / 2 - b.label.length * 3 - 4, y + h - 10, b.label.length * 6 + 8, 10);
    ctx.font = '5px "Press Start 2P",monospace'; ctx.fillStyle = highlighted ? '#4fd8ff' : '#d0c060';
    ctx.textAlign = 'center'; ctx.fillText(b.label, x + w / 2, y + h - 2); ctx.textAlign = 'left';
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);
  if (highlighted && Math.sin(performance.now() / 200) > 0.3) {
    ctx.font = '9px monospace'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.fillText('!', x + w / 2, y - 6); ctx.textAlign = 'left';
  }
}

function drawFachadaModerna(b) {
  const { x, y, w, h } = b;
  const highlighted = nearTarget && nearTarget.kind === 'building' && nearTarget.ref === b;
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x + w, y + 3, 5, h);
  ctx.fillStyle = b.colorBase; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = b.colorClaro;
  for (let fy = y + 8; fy < y + h; fy += 28) ctx.fillRect(x, fy, w, 4);

  if (isNight) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(60,40,120,0.5)';
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  b.ventanas.forEach(([vx, vy]) => {
    const wx = x + vx, wy = y + vy;
    if (isNight) {
      const lit = ((wx * 5 + wy * 3) % 9) > 1;
      if (lit) {
        const cx = wx + b.anchoV / 2, cy = wy + b.altoV / 2;
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, b.anchoV * 1.6);
        glow.addColorStop(0, 'rgba(255,200,110,0.3)');
        glow.addColorStop(1, 'rgba(255,200,110,0)');
        ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, b.anchoV * 1.6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = lit ? '#f7c463' : '#0b0714';
      ctx.fillRect(wx, wy, b.anchoV, b.altoV);
      if (lit) { ctx.fillStyle = 'rgba(255,225,170,0.22)'; ctx.fillRect(wx, wy, b.anchoV / 2, b.altoV); }
      ctx.strokeStyle = 'rgba(150,120,200,0.35)';
    } else {
      const lit = ((wx * 5 + wy * 3) % 9) > 6;
      ctx.fillStyle = lit ? b.colV : '#cfe8f5';
      ctx.fillRect(wx, wy, b.anchoV, b.altoV);
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(wx, wy, b.anchoV / 2, b.altoV);
      ctx.strokeStyle = 'rgba(80,100,120,0.4)';
    }
    ctx.lineWidth = 0.5;
    ctx.strokeRect(wx, wy, b.anchoV, b.altoV);
  });

  if (b.entrada) {
    const ex = x + b.entrada.x, ey = y + h - b.entrada.h;
    ctx.fillStyle = highlighted ? '#4fd8ff' : '#0a0c10'; ctx.fillRect(ex, ey, b.entrada.w, b.entrada.h);
    ctx.strokeStyle = '#7a8390'; ctx.lineWidth = 1; ctx.strokeRect(ex, ey, b.entrada.w, b.entrada.h);
  }
  if (b.label) {
    // El rótulo del Taller queda en la planta baja, no escondido arriba.
    const labelY = b.id === 'taller' ? y + h - 17 : y;
    ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(x + 2, labelY, w - 4, 13);
    ctx.font = '6px "Press Start 2P",monospace'; ctx.fillStyle = highlighted ? '#4fd8ff' : '#a5d9f3';
    ctx.textAlign = 'center'; ctx.fillText(b.label, x + w / 2, labelY + 9); ctx.textAlign = 'left';
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);
  if (highlighted && Math.sin(performance.now() / 200) > 0.3) {
    ctx.font = '9px monospace'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.fillText('!', x + w / 2, y - 6); ctx.textAlign = 'left';
  }
}

function drawLocalPlantaBaja(x, y, w, h) {

}

function drawPosteLuz(x, y, dir) {
  const len = 65, px = x, py = y;
  ctx.fillStyle = '#3a3830'; ctx.fillRect(px - 2, py + (dir < 0 ? -len : 0), 4, len);
  ctx.fillRect(px - 2, py + (dir < 0 ? -len : 0), 20, 3);
  ctx.fillRect(px - 20, py + (dir < 0 ? -len + 8 : -8), 20, 3);
  ctx.fillStyle = isNight ? '#e0c070' : '#a09868';
  ctx.fillRect(px + 16, py + (dir < 0 ? -len - 4 : -4), 10, 6);
  ctx.fillRect(px - 22, py + (dir < 0 ? -len + 4 : 4), 10, 6);

  if (isNight) {
    [[px + 21, py + (dir < 0 ? -len : 0)], [px - 17, py + (dir < 0 ? -len + 8 : 8)]].forEach(([lx, ly]) => {
      const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, 34);
      lg.addColorStop(0, 'rgba(255,210,120,0.32)'); lg.addColorStop(1, 'rgba(255,210,120,0)');
      ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(lx, ly, 34, 0, Math.PI * 2); ctx.fill();
    });
  }
}

function drawArbol(x, y) {
  ctx.fillStyle = '#2a1a08'; ctx.fillRect(x - 3, y - 18, 6, 18);
  ctx.fillStyle = '#0a2808'; ctx.fillRect(x - 14, y - 44, 28, 26);
  ctx.fillStyle = '#0e380a'; ctx.fillRect(x - 12, y - 56, 24, 20);
  ctx.fillStyle = '#124814'; ctx.fillRect(x - 9, y - 65, 18, 16);
  ctx.fillStyle = '#165a16'; ctx.fillRect(x - 6, y - 72, 12, 12);
  ctx.fillStyle = 'rgba(30,100,20,0.5)';
  [[x - 8, y - 50], [x + 4, y - 52], [x - 4, y - 62], [x + 2, y - 45], [x - 10, y - 38]].forEach(([lx, ly]) => {
    ctx.fillRect(lx, ly, 4, 4);
  });
}

// ── REPÚBLICA VIVA · Ambientación adicional no interactiva ──
// No modifica fachadas, grafitis, colisiones, autos estacionados ni edificios originales.
// ── REPÚBLICA VIVA, versión limpia ──
// Mantiene intactos los grafitis originales, fachadas y colisiones.
// NPCs caminando SOLAMENTE en las veredas: superior (y 128-146)
// e inferior (y 436-464). Sus pies se apoyan en esas superficies.
const republicaPeople = [
  {seed:17,feet:142,speed:7.3,reverse:false,top:'#b58ac2',hair:'#4b293a',skin:'#e1b18e',bottom:'#383247',style:'corto',accent:'#f1bbd1'},
  {seed:311,feet:142,speed:5.8,reverse:true,top:'#708c9a',hair:'#30202b',skin:'#e5c8a4',bottom:'#353b4a',style:'cola',accent:'#d9d4e4'},
  {seed:119,feet:461,speed:7.0,reverse:false,top:'#876b78',hair:'#8a4933',skin:'#deb08a',bottom:'#24243f',style:'largo',accent:'#e7bfbd'},
  {seed:476,feet:461,speed:6.1,reverse:true,top:'#445e73',hair:'#2e2837',skin:'#c28b6c',bottom:'#383b48',style:'corto',accent:'#d9d2a0'}
];
function drawRepublicaPedestrians(t){
 for (const n of republicaPeople){
  const span=W+90;
  const offset=((t*n.speed+n.seed)%span+span)%span;
  const xx=n.reverse?W+35-offset:offset-35;
  const y=n.feet-25; // los pies quedan exactamente en la vereda
  const cfg={skin:n.skin,hair:n.hair,top:n.top,bottom:n.bottom,style:n.style,accent:n.accent};
  ctx.save();ctx.translate(Math.round(xx),Math.round(y));
  drawCharacter(ctx,{x:0,y:0,w:18,h:25,dir:n.reverse?'left':'right',step:Math.floor(t*n.speed/3)%2},cfg);
  ctx.restore();
 }
}
function drawRepublicaTraffic(t){
 // Solo dos autos en circulación. La micro original ya tiene su propio recorrido.
 const cars=[
   {offset:30,speed:19,y:184,color:'#51425d',reverse:false},
   {offset:392,speed:16,y:336,color:'#4e6673',reverse:true}
 ];
 for(const car of cars){
  const v=(t*car.speed+car.offset)%(W+100);
  const x=car.reverse?W+50-v:v-60;
  drawAuto2(Math.round(x),car.y,car.color,car.reverse);
 }
}
function drawRepublicaDetails(t){
 // Un único detalle ambiental silencioso: el gato del barrio en la vereda.
 const x=528+Math.sin(t*.32)*7, y=426;
 ctx.save();
 ctx.fillStyle='#242030';ctx.fillRect(x,y,10,8);
 ctx.fillRect(x+1,y-4,3,5);ctx.fillRect(x+7,y-4,3,5);
 ctx.fillRect(x+9,y+1,6,3);
 ctx.fillStyle='#d9b0cf';ctx.fillRect(x+2,y+1,1,1);ctx.fillRect(x+7,y+1,1,1);
 ctx.restore();
}
function drawAuto2(x, y, color, espejo) {
  const aw = 42, ah = 20;
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x + 3, y + ah, aw, 5);
  ctx.fillStyle = color; ctx.fillRect(x, y, aw, ah);
  ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(x + 6, y + 3, aw - 12, ah - 6);
  ctx.fillStyle = '#101828'; ctx.fillRect(x + 5, y + 3, 12, ah - 6); ctx.fillRect(x + aw - 17, y + 3, 12, ah - 6);
  ctx.fillStyle = 'rgba(80,120,180,0.12)'; ctx.fillRect(x + 5, y + 3, 6, ah - 6); ctx.fillRect(x + aw - 17, y + 3, 6, ah - 6);
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(x - 2, y + 2, 5, 7); ctx.fillRect(x - 2, y + 11, 5, 7);
  ctx.fillRect(x + aw - 3, y + 2, 5, 7); ctx.fillRect(x + aw - 3, y + 11, 5, 7);
  ctx.fillStyle = '#282828';
  ctx.fillRect(x - 1, y + 3, 3, 5); ctx.fillRect(x - 1, y + 12, 3, 5);
  ctx.fillRect(x + aw - 2, y + 3, 3, 5); ctx.fillRect(x + aw - 2, y + 12, 3, 5);
  if (!espejo) {
    ctx.fillStyle = '#e0d060'; ctx.fillRect(x + aw - 3, y + 2, 3, 4); ctx.fillRect(x + aw - 3, y + 14, 3, 4);
    ctx.fillStyle = '#c03020'; ctx.fillRect(x, y + 2, 3, 4); ctx.fillRect(x, y + 14, 3, 4);
  } else {
    ctx.fillStyle = '#c03020'; ctx.fillRect(x + aw - 3, y + 2, 3, 4); ctx.fillRect(x + aw - 3, y + 14, 3, 4);
    ctx.fillStyle = '#e0d060'; ctx.fillRect(x, y + 2, 3, 4); ctx.fillRect(x, y + 14, 3, 4);
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 0.5; ctx.strokeRect(x, y, aw, ah);
}

function drawMicro(x, y) {
  const bw = 70, bh = 28;
  ctx.fillStyle = '#1a0808'; ctx.fillRect(x, y, bw, bh);
  ctx.fillStyle = '#8a2010'; ctx.fillRect(x + 2, y + 2, bw - 4, bh - 4);
  ctx.fillStyle = '#c0c0c0'; ctx.fillRect(x + 2, y + 10, bw - 4, 6);
  ctx.fillStyle = '#101828';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(x + 6 + i * 15, y + 4, 12, 6);
    ctx.fillStyle = 'rgba(80,120,180,0.1)'; ctx.fillRect(x + 6 + i * 15, y + 4, 6, 6);
    ctx.fillStyle = '#101828';
  }
  ctx.fillStyle = '#601008'; ctx.fillRect(x + bw - 5, y, 5, bh);
  ctx.fillStyle = '#e0e060'; ctx.fillRect(x + bw - 4, y + 4, 3, 6); ctx.fillRect(x + bw - 4, y + 18, 3, 6);
  ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 0.5; ctx.strokeRect(x, y, bw, bh);
}

function drawParadaMicro(b, highlighted) {
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(b.x + 2, b.y + 26, 16, 3);
  ctx.fillStyle = '#0d1420'; ctx.fillRect(b.x + 8, b.y, 3, 26);
  ctx.fillStyle = highlighted ? '#8fdba0' : '#4fd8ff'; ctx.fillRect(b.x - 4, b.y - 12, 28, 12);
  ctx.font = '5px "Press Start 2P",monospace'; ctx.fillStyle = '#0a0e17'; ctx.textAlign = 'center';
  ctx.fillText('MICRO', b.x + 10, b.y - 4); ctx.textAlign = 'left';
  if (highlighted && Math.sin(performance.now() / 200) > 0.3) {
    ctx.font = '9px monospace'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.fillText('!', b.x + 10, b.y - 18); ctx.textAlign = 'left';
  }
}

// ── PERSONAJE — personalizable (se guarda en localStorage) ──
const CHAR_KEY = 'ciudadPersonaje';
const CHAR_PRESETS = [
  { id: 'clasica', etiqueta: 'Clásica',  skin: '#f6e7db', hair: '#ab653c', style: 'largo', top: '#1c1c1c', bottom: '#141414', accent: '#4fd8ff' },
  { id: 'violeta', etiqueta: 'Violeta',  skin: '#f6e7db', hair: '#7a4bb0', style: 'corto', top: '#2a1d3a', bottom: '#141414', accent: '#e29ab7' },
  { id: 'noche',   etiqueta: 'Noche',    skin: '#e8c4a0', hair: '#1b1520', style: 'cola',  top: '#6b2f4a', bottom: '#1a1a2a', accent: '#91c69b' },
  { id: 'sol',     etiqueta: 'Sol',      skin: '#f3d9c4', hair: '#d9b45a', style: 'largo', top: '#365d7a', bottom: '#222222', accent: '#ffffff' },
  { id: 'cacao',   etiqueta: 'Cacao',    skin: '#8d5a3b', hair: '#2a1a12', style: 'corto', top: '#4a6a4a', bottom: '#1a1a1a', accent: '#d49a78' },
  { id: 'fuego',   etiqueta: 'Fuego',    skin: '#f6e7db', hair: '#b8452b', style: 'cola',  top: '#e8e0d0', bottom: '#3a3a50', accent: '#9c72c7' },
];
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function sanitizeChar(c) {
  const base = CHAR_PRESETS[0];
  const out = { skin: base.skin, hair: base.hair, style: base.style, top: base.top, bottom: base.bottom, accent: base.accent, nombre: '' };
  if (c && typeof c === 'object') {
    ['skin', 'hair', 'top', 'bottom', 'accent'].forEach(k => { if (HEX_RE.test(c[k])) out[k] = c[k]; });
    if (['largo', 'corto', 'cola'].includes(c.style)) out.style = c.style;
    if (typeof c.nombre === 'string') out.nombre = c.nombre.slice(0, 20);
  }
  return out;
}
function loadChar() {
  try { const raw = localStorage.getItem(CHAR_KEY); if (raw) return sanitizeChar(JSON.parse(raw)); } catch (e) {}
  return null;
}
function saveChar(c) { localStorage.setItem(CHAR_KEY, JSON.stringify(c)); }

let character = loadChar() || sanitizeChar(CHAR_PRESETS[0]);

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
function drawPlayer(p) {
  drawCharacter(ctx, p, character);
  try {
    const eq = JSON.parse(localStorage.getItem('ciudadAtelierV3') || '{}');
    const inv = JSON.parse(localStorage.getItem('ciudadColeccion') || '{}');
    if (eq.companion === 'cat_companion' && Number(inv.cat_companion?.count) > 0) {
      const side = p.dir === 'left' ? 1 : -1;
      const x = Math.round(p.x + p.w / 2 + side * 17), y = Math.round(p.y + p.h - 10);
      ctx.fillStyle='#262037';ctx.fillRect(x-5,y-3,11,11);
      ctx.fillRect(x-5,y-7,3,5);ctx.fillRect(x+3,y-7,3,5);
      ctx.fillStyle='#d3a9f3';ctx.fillRect(x-2,y+1,2,2);ctx.fillRect(x+3,y+1,2,2);
      ctx.fillStyle='#8a69b1';ctx.fillRect(x+6,y+4,5,3);
    }
    if (eq.accessory === 'special_outfit' && Number(inv.special_outfit?.count) > 0) {
      ctx.fillStyle='#e8acef';ctx.fillRect(Math.round(p.x+2),Math.round(p.y+9),Math.max(2,p.w-4),3);
    }
  } catch (_) {}
}

// ══════════════════════════════════════════════════════════
//  SELECTOR DE PERSONAJE (overlay)
// ══════════════════════════════════════════════════════════
const charUI = { open: false, draft: null };

function previewInto(canvasEl, cfg, dir, scale) {
  const sc = scale || 1;
  const pc = canvasEl.getContext('2d');
  pc.setTransform(1, 0, 0, 1, 0, 0);
  pc.clearRect(0, 0, canvasEl.width, canvasEl.height);
  pc.translate(Math.floor((canvasEl.width - 18 * sc) / 2), Math.floor(9 * sc));
  pc.scale(sc, sc);
  drawCharacter(pc, { x: 0, y: 0, w: 18, h: 25, dir: dir || 'down', step: 0 }, cfg);
}

function renderCharPresets() {
  const grid = document.getElementById('char-presets');
  grid.innerHTML = '';
  CHAR_PRESETS.forEach(preset => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'char-preset';
    const cv = document.createElement('canvas'); cv.width = 36; cv.height = 48;
    previewInto(cv, preset, 'down');
    const lbl = document.createElement('span'); lbl.textContent = preset.etiqueta;
    b.appendChild(cv); b.appendChild(lbl);
    b.addEventListener('click', () => {
      charUI.draft = sanitizeChar({ ...preset, nombre: document.getElementById('char-name').value });
      syncCharControls();
    });
    grid.appendChild(b);
  });
}
const CHAR_FIELDS = ['skin', 'hair', 'top', 'bottom', 'accent'];
function syncCharControls() {
  CHAR_FIELDS.forEach(k => { document.getElementById('char-' + k).value = charUI.draft[k]; });
  document.getElementById('char-style').value = charUI.draft.style;
  refreshCharPreview();
}
function refreshCharPreview() {
  ['down', 'left', 'up', 'right'].forEach(d => previewInto(document.getElementById('char-prev-' + d), charUI.draft, d, 2));
}
function openCharacterEditor(first) {
  charUI.open = true;
  charUI.draft = sanitizeChar(character);
  state.isPaused = true;
  document.getElementById('char-name').value = charUI.draft.nombre;
  document.getElementById('char-cancel').classList.toggle('hidden', !!first);
  document.getElementById('char-title').textContent = first ? 'elige tu personaje' : 'tu personaje';
  document.getElementById('prompt-box').classList.add('hidden');
  renderCharPresets();
  syncCharControls();
  document.getElementById('char-overlay').classList.remove('hidden');
}
function closeCharacterEditor() {
  charUI.open = false;
  document.getElementById('char-overlay').classList.add('hidden');
  state.isPaused = false;
  Object.keys(keys).forEach(k => { keys[k] = false; });
}
function initCharacterUI() {
  CHAR_FIELDS.forEach(k => {
    document.getElementById('char-' + k).addEventListener('input', e => {
      charUI.draft[k] = e.target.value; refreshCharPreview();
    });
  });
  document.getElementById('char-style').addEventListener('change', e => {
    charUI.draft.style = e.target.value; refreshCharPreview();
  });
  document.getElementById('char-name').addEventListener('input', e => {
    charUI.draft.nombre = e.target.value.slice(0, 20);
  });
  document.getElementById('char-save').addEventListener('click', () => {
    character = sanitizeChar(charUI.draft);
    saveChar(character);
    window.dispatchEvent(new Event('ciudad-personaje-guardado'));
    if(window.CityMultiplayer)window.CityMultiplayer.sendPosition(true);
    closeCharacterEditor();
  });
  document.getElementById('char-cancel').addEventListener('click', closeCharacterEditor);
  document.getElementById('charBtn').addEventListener('click', () => {
    if (!state.isPaused && !state.transitioning) openCharacterEditor(false);
  });
  if (!loadChar()) openCharacterEditor(true);
}

function render() {
  ctx.clearRect(0, 0, W, H);
  drawScene();
}

// ── LOOP ──
function update() {
  if (state.isPaused || state.transitioning) return;
  let dx = 0, dy = 0;
  if (keys['ArrowLeft'] || keys['a'] || keys['A']) { dx = -1; player.dir = 'left'; }
  if (keys['ArrowRight'] || keys['d'] || keys['D']) { dx = 1; player.dir = 'right'; }
  if (keys['ArrowUp'] || keys['w'] || keys['W']) { dy = -1; player.dir = 'up'; }
  if (keys['ArrowDown'] || keys['s'] || keys['S']) { dy = 1; player.dir = 'down'; }
  if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

  const spd = player.speed;
  const nx = player.x + dx * spd, ny = player.y + dy * spd;
  if (!walls.some(wl => rectsOverlap({ x: nx, y: player.y, w: player.w, h: player.h }, wl))) player.x = nx;
  if (!walls.some(wl => rectsOverlap({ x: player.x, y: ny, w: player.w, h: player.h }, wl))) player.y = ny;
  player.x = Math.max(16, Math.min(W - 16 - player.w, player.x));
  player.y = Math.max(16, Math.min(H - 16 - player.h, player.y));

  if (dx !== 0 || dy !== 0) {
    player.stepTimer++;
    if (player.stepTimer > 10) { player.step = player.step === 0 ? 1 : 0; player.stepTimer = 0; }
  } else player.step = 0;

  const pr = { x: player.x, y: player.y, w: player.w, h: player.h };
  nearTarget = null;
  for (const b of buildings) {
    if (b.entradaAbs && rectsOverlap(pr, triggerZone(b.entradaAbs))) { nearTarget = { kind: 'building', ref: b }; break; }
  }
  if (!nearTarget && rectsOverlap(pr, triggerZone(busStop, 18))) {
    nearTarget = { kind: 'bus', ref: busStop };
  }
  document.getElementById('prompt-box').classList.toggle('hidden', !nearTarget || state.isPaused);
}

function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

function initLugares() {
  const nav = document.getElementById('lugares');
  if (!nav) return;
  buildings.filter(b => b.href && b.label).forEach(b => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = b.label;
    btn.title = 'ir a ' + b.label.toLowerCase();
    btn.addEventListener('click', () => {
      if (state.isPaused || state.transitioning || charUI.open) return;
      goTo(b.href);
    });
    nav.appendChild(btn);
  });
}

initNightToggle();
initLugares();
initCharacterUI();
gameLoop();