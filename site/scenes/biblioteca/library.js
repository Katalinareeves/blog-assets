"use strict";

/* =========================================================
   BIBLIOTECA — visor integrado + progreso manual
   - Los libros salen de books.json (relativo) + los que agregues tú
     (se guardan en este navegador).
   - El visor usa la vista previa de Google Drive (o un PDF directo).
   - Drive no avisa en qué página vas, así que el progreso lo
     registras tú; las semillas se dan por bloques de páginas.
   ========================================================= */

const BOOKS_URL = "books.json";
const CUSTOM_KEY = "libraryCustomBooks";
const MAX_SEED_PAGES_PER_SAVE = 100;   // tope de páginas que dan semillas por guardado
const DEFAULT_PAGES_PER_SEED = 10;

const $ = id => document.getElementById(id);

let BOOKS = [];
let currentBook = null;
let subjectFilter = "";
let catalogQuery = new URLSearchParams(location.search).get('q')?.trim().slice(0,80) || "";
const normalizeText = x => String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

/* ---------- utilidades ---------- */
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}
function safeUrl(u) {
  try {
    const x = new URL(u);
    return (x.protocol === "http:" || x.protocol === "https:") ? x.href : "";
  } catch (e) { return ""; }
}
function intOr(v, d) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 ? n : d;
}
function hueFor(text) {
  // Tonos de la paleta (verdes azulados, azul, cobre y rosa apagado) en vez de cualquier color
  const HUES = [172, 186, 202, 28, 12, 150, 218];
  let h = 0;
  for (const ch of String(text || "")) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return HUES[h % HUES.length];
}
function isDrive(url) {
  return /^https:\/\/(drive|docs)\.google\.com\//.test(url);
}
function toEmbedUrl(url) {
  const m = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/);
  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
  const o = url.match(/drive\.google\.com\/open\?id=([^&#]+)/);
  if (o) return `https://drive.google.com/file/d/${o[1]}/preview`;
  const d = url.match(/docs\.google\.com\/(document|presentation|spreadsheets)\/d\/([^/?#]+)/);
  if (d) return `https://docs.google.com/${d[1]}/d/${d[2]}/preview`;
  return url;
}
function bookUrl(b) { return safeUrl(b.driveUrl || b.url || b.pdf || ""); }

/* ---------- semillas ---------- */
function addSeeds(amount, reason) {
  if (window.CitySeeds && typeof window.CitySeeds.add === "function") {
    window.CitySeeds.add(amount, reason);
  } else {
    const k = "ciudadSemillas";
    localStorage.setItem(k, String((parseInt(localStorage.getItem(k) || "0", 10) || 0) + amount));
  }
  updateSeedCounter();
}
function updateSeedCounter() {
  const c = $("seed-count");
  if (!c) return;
  let v = 0;
  if (window.CitySeeds && typeof window.CitySeeds.get === "function") v = window.CitySeeds.get();
  else v = parseInt(localStorage.getItem("ciudadSemillas") || "0", 10) || 0;
  c.textContent = v;
}
function toast(text) {
  $("toast-text").textContent = text;
  $("seed-toast").classList.remove("hidden");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => $("seed-toast").classList.add("hidden"), 2400);
}

/* ---------- datos por libro (progreso, estado, total) ---------- */
const getProgress = id => intOr(localStorage.getItem("libraryProgress_" + id), 0);
const setProgress = (id, p) => localStorage.setItem("libraryProgress_" + id, String(p));
function getStatus(b) {
  const s = localStorage.getItem("libraryStatus_" + b.id);
  return ["to-read", "reading", "done"].includes(s) ? s : (b.status || "to-read");
}
const setStatus = (id, s) => localStorage.setItem("libraryStatus_" + id, s);
function getTotal(b) {
  const t = localStorage.getItem("libraryTotal_" + b.id);
  return t !== null ? intOr(t, 0) : intOr(b.pages, 0);
}
const setTotal = (id, t) => localStorage.setItem("libraryTotal_" + id, String(t));

function loadCustom() {
  try {
    const arr = JSON.parse(localStorage.getItem(CUSTOM_KEY));
    return Array.isArray(arr) ? arr : [];
  } catch (e) { return []; }
}
function saveCustom(arr) { localStorage.setItem(CUSTOM_KEY, JSON.stringify(arr)); }

/* ---------- carga ---------- */
async function loadBooks() {
  const status = $("catalog-status");
  let base = [];
  try {
    const r = await fetch(BOOKS_URL, { cache: "no-store" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const data = await r.json();
    if (!data || !Array.isArray(data.books)) throw new Error("formato inválido");
    base = data.books;
  } catch (e) {
    console.error("books.json:", e);
    status.textContent = "no pude leer books.json (" + e.message + "). se muestran solo los libros que agregaste.";
  }
  const custom = loadCustom().map(b => ({ ...b, custom: true }));
  BOOKS = [...base, ...custom];
  renderAll();
}

/* ---------- catálogo ---------- */
function subjects() {
  return [...new Set(BOOKS.map(b => b.subject).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
}
function renderChips() {
  const box = $("subject-chips");
  box.innerHTML = "";
  const mk = (label, value) => {
    const b = el("button", "chip-btn" + (subjectFilter === value ? " active" : ""), label);
    b.type = "button";
    b.addEventListener("click", () => { subjectFilter = value; renderChips(); renderCatalog(); });
    box.appendChild(b);
  };
  mk("todos", "");
  subjects().forEach(s => mk(s, s));
  const dl = $("subject-list");
  dl.innerHTML = "";
  subjects().forEach(s => { const o = document.createElement("option"); o.value = s; dl.appendChild(o); });
}
function updateStats() {
  $("stat-books").textContent = BOOKS.length;
  $("stat-pages").textContent = BOOKS.reduce((t, b) => t + getProgress(b.id), 0);
  $("stat-done").textContent = BOOKS.filter(b => getStatus(b) === "done").length;
}
const STATUS_LABEL = { "to-read": "por leer", reading: "leyendo", done: "terminado" };

function renderCatalog() {
  const grid = $("book-grid");
  grid.innerHTML = "";
  const sf = $("status-filter").value;
  const q=normalizeText(catalogQuery);
  const list = BOOKS.filter(b => (!subjectFilter || b.subject === subjectFilter) && (!sf || getStatus(b) === sf) && (!q || normalizeText([b.subject,b.title,b.author,b.description].join(' ')).includes(q)));
  $("catalog-status").textContent = `${list.length} de ${BOOKS.length} libros`;

  if (!list.length) {
    grid.appendChild(el("div", "empty-box", BOOKS.length ? "no hay libros con ese filtro" : "aún no hay libros. agrega el primero con “+ agregar libro”."));
    return;
  }

  list.forEach(b => {
    const progress = getProgress(b.id);
    const total = getTotal(b);
    const pct = total > 0 ? Math.min(100, Math.round(progress / total * 100)) : 0;
    const status = getStatus(b);
    const url = bookUrl(b);

    const card = el("article", "book-card");
    const cover = el("div", "book-cover");
    cover.style.setProperty("--h", hueFor(b.subject || b.title));
    cover.appendChild(el("span", "cover-subject", b.subject || "libro"));
    cover.appendChild(el("strong", "cover-title", b.shortTitle || b.title));
    cover.appendChild(el("span", "cover-author", b.author || ""));
    card.appendChild(cover);

    const body = el("div", "book-body");
    const meta = el("div", "book-meta");
    meta.appendChild(el("span", "tag " + status, STATUS_LABEL[status]));
    if (!url) meta.appendChild(el("span", "tag nolink", "sin link"));
    body.appendChild(meta);
    body.appendChild(el("h3", null, b.title));
    if (b.description) body.appendChild(el("p", null, b.description));

    const mini = el("div", "p-mini");
    const top = el("div", "p-mini-top");
    top.appendChild(el("span", null, "progreso"));
    top.appendChild(el("strong", null, total > 0 ? `${progress} / ${total} pág.` : `${progress} pág.`));
    mini.appendChild(top);
    const bar = el("div", "p-bar"); const fill = el("div"); fill.style.width = pct + "%"; bar.appendChild(fill);
    mini.appendChild(bar);
    body.appendChild(mini);

    const actions = el("div", "book-actions");
    const open = el("button", "btn", "abrir");
    open.type = "button";
    open.addEventListener("click", () => openBook(b));
    actions.appendChild(open);
    body.appendChild(actions);

    card.appendChild(body);
    grid.appendChild(card);
  });
}
function renderAll() { renderChips(); renderCatalog(); updateStats(); }

/* ---------- agregar libro ---------- */
$("add-toggle").addEventListener("click", () => $("add-panel").classList.toggle("hidden"));
$("a-cancel").addEventListener("click", () => { $("add-panel").classList.add("hidden"); setAddMsg(""); });
function setAddMsg(t, type) { const m = $("a-msg"); m.textContent = t || ""; m.className = "msg" + (type ? " " + type : ""); }

$("a-save").addEventListener("click", () => {
  const title = $("a-title").value.trim();
  const author = $("a-author").value.trim();
  const subject = $("a-subject").value.trim();
  const pages = intOr($("a-pages").value, 0);
  const rawUrl = $("a-url").value.trim();
  if (!title) return setAddMsg("ponle un título", "err");
  if (rawUrl && !safeUrl(rawUrl)) return setAddMsg("el link debe empezar con http(s)://", "err");

  const custom = loadCustom();
  const id = "custom-" + Date.now().toString(36) + Math.random().toString(16).slice(2, 5);
  custom.push({ id, title, shortTitle: title, author, subject: subject || "Otros", status: "to-read",
                pages, driveUrl: rawUrl ? safeUrl(rawUrl) : "", description: "", pagesPerSeed: DEFAULT_PAGES_PER_SEED });
  saveCustom(custom);
  ["a-title", "a-author", "a-subject", "a-pages", "a-url"].forEach(i => { $(i).value = ""; });
  setAddMsg("libro agregado ✓", "ok");
  $("add-panel").classList.add("hidden");
  BOOKS = BOOKS.filter(b => !b.custom).concat(loadCustom().map(b => ({ ...b, custom: true })));
  renderAll();
});
$("status-filter").addEventListener("change", renderCatalog);

/* ---------- lector ---------- */
function openBook(b) {
  currentBook = b;
  $("catalog-view").classList.add("hidden");
  $("reader-view").classList.remove("hidden");
  window.scrollTo(0, 0);

  $("reader-subject").textContent = b.subject || "libro";
  $("reader-title").textContent = b.title;
  $("reader-author").textContent = b.author || "";

  const url = bookUrl(b);
  const open = $("reader-open");
  if (url) { open.href = url; open.classList.remove("hidden"); } else { open.classList.add("hidden"); }

  const wrap = $("reader-frame-wrap");
  wrap.innerHTML = "";
  if (!url) {
    const nl = el("div", "no-link");
    nl.appendChild(el("h3", null, "este libro no tiene link"));
    nl.appendChild(el("p", null, "agrega el link del Drive en books.json (campo driveUrl) o quita el libro y vuelve a agregarlo con su link."));
    wrap.appendChild(nl);
  } else {
    const f = document.createElement("iframe");
    f.title = b.title;
    f.src = toEmbedUrl(url);
    f.setAttribute("allow", "fullscreen");
    // El visor nativo de PDF de los navegadores no funciona dentro de un iframe con sandbox,
    // así que el sandbox solo se aplica a Drive.
    if (isDrive(url)) f.setAttribute("sandbox", "allow-scripts allow-same-origin allow-popups");
    wrap.appendChild(f);
  }

  const pps = Math.max(1, intOr(b.pagesPerSeed, DEFAULT_PAGES_PER_SEED) || DEFAULT_PAGES_PER_SEED);
  $("p-note").textContent =
    `el visor de Drive no avisa en qué página vas, así que tú registras el avance. ` +
    `ganas 1 semilla cada ${pps} páginas nuevas (hasta ${MAX_SEED_PAGES_PER_SAVE} páginas por guardado).`;
  $("p-delete").classList.toggle("hidden", !b.custom);
  $("p-noseeds").checked = false;
  setProgMsg("");
  refreshProgressUI();
}

function refreshProgressUI() {
  const b = currentBook;
  if (!b) return;
  const progress = getProgress(b.id);
  const total = getTotal(b);
  const pct = total > 0 ? Math.min(100, Math.round(progress / total * 100)) : 0;
  $("p-page").textContent = progress;
  $("p-total").textContent = total > 0 ? `/ ${total} págs.` : "págs.";
  $("p-percent").textContent = total > 0 ? `· ${pct}%` : "";
  $("p-bar-fill").style.width = pct + "%";
  $("p-input").value = progress;
  $("p-total-input").value = total > 0 ? total : "";
  $("p-status").value = getStatus(b);
}
function setProgMsg(t, type) { const m = $("p-msg"); m.textContent = t || ""; m.className = "msg" + (type ? " " + type : ""); }

$("p-save").addEventListener("click", () => {
  const b = currentBook;
  if (!b) return;
  const newPage = intOr($("p-input").value, -1);
  if (newPage < 0) return setProgMsg("escribe un número de página válido", "err");

  const totalRaw = $("p-total-input").value.trim();
  if (totalRaw !== "") setTotal(b.id, intOr(totalRaw, 0));
  const total = getTotal(b);

  const saved = getProgress(b.id);
  let page = newPage;
  if (total > 0 && page > total) page = total;
  setProgress(b.id, page);

  let seeds = 0;
  if (!$("p-noseeds").checked && page > saved) {
    const pps = Math.max(1, intOr(b.pagesPerSeed, DEFAULT_PAGES_PER_SEED) || DEFAULT_PAGES_PER_SEED);
    const credited = Math.min(page, saved + MAX_SEED_PAGES_PER_SAVE);
    seeds = Math.floor(credited / pps) - Math.floor(saved / pps);
    if (seeds > 0) {
      addSeeds(seeds, "biblioteca: " + (b.shortTitle || b.title));
      toast(`+${seeds} semilla${seeds === 1 ? "" : "s"}`);
    }
  }

  // estado automático según el avance
  let st = getStatus(b);
  if (total > 0 && page >= total) st = "done";
  else if (page > 0 && st === "to-read") st = "reading";
  setStatus(b.id, st);

  refreshProgressUI();
  setProgMsg(seeds > 0 ? `guardado · +${seeds} semilla${seeds === 1 ? "" : "s"}` : "progreso guardado", "ok");
});

$("p-status").addEventListener("change", () => {
  if (!currentBook) return;
  setStatus(currentBook.id, $("p-status").value);
  setProgMsg("estado actualizado", "ok");
});

$("p-delete").addEventListener("click", () => {
  const b = currentBook;
  if (!b || !b.custom) return;
  if (!confirm("¿quitar este libro de tu biblioteca?")) return;
  saveCustom(loadCustom().filter(x => x.id !== b.id));
  ["libraryProgress_", "libraryStatus_", "libraryTotal_"].forEach(k => localStorage.removeItem(k + b.id));
  BOOKS = BOOKS.filter(x => x.id !== b.id);
  closeBook();
});

function closeBook() {
  currentBook = null;
  $("reader-frame-wrap").innerHTML = "";
  $("reader-view").classList.add("hidden");
  $("catalog-view").classList.remove("hidden");
  renderAll();
}
$("back-library").addEventListener("click", closeBook);
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && currentBook && !["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement && document.activeElement.tagName)) closeBook();
});

/* ---------- acceso contextual desde Universidad ---------- */
const searchBox=document.getElementById('library-course-filter');
if(searchBox){searchBox.value=catalogQuery;searchBox.addEventListener('input',()=>{catalogQuery=searchBox.value.trim().slice(0,80);renderCatalog();});}
/* ---------- inicio ---------- */
updateSeedCounter();
loadBooks();
