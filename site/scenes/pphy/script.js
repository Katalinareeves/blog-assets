"use strict";

// ============================================================
// ESCENA: PPHY — grupo de estudio de física de partículas
// Dos modos:
//   · SUPABASE (compartido): si config.js tiene URL y anon key
//   · LOCAL (solo tu navegador): si están vacíos
// ============================================================

const CFG = window.PPHY_CONFIG || {};
const CHAPTERS = (CFG.chapters && CFG.chapters.length) ? CFG.chapters : [{ n: 1, title: "Capítulo 1" }];
const KINDS = ["apunte", "duda", "resumen", "ejercicio", "otro"];

const $ = id => document.getElementById(id);
// ------------------------------------------------------------
// CONFIGURACIÓN DE SUPABASE (se limpia y se valida antes de usarla)
// ------------------------------------------------------------
function b64urlJson(part) {
  try { return JSON.parse(decodeURIComponent(escape(atob(part.replace(/-/g, "+").replace(/_/g, "/"))))); } catch (e) { return null; }
}
function readSupabaseConfig() {
  const out = { used: false, url: "", key: "", problems: [], fatal: false };
  let url = String(CFG.SUPABASE_URL || "").trim().replace(/^["']|["']$/g, "");
  let key = String(CFG.SUPABASE_ANON_KEY || "").trim().replace(/^["']|["']$/g, "");
  if (!url && !key) return out;                       // modo local, sin avisos
  out.used = true;
  if (!url || !key) {
    out.fatal = true;
    out.problems.push("Falta " + (!url ? "SUPABASE_URL" : "SUPABASE_ANON_KEY") + " en config.js (los dos van juntos).");
    return out;
  }
  const dash = url.match(/supabase\.com\/dashboard\/project\/([a-z0-9]+)/i);
  if (dash) {
    url = "https://" + dash[1] + ".supabase.co";
    out.problems.push("Pegaste la URL del panel de Supabase. Usé la URL del proyecto: " + url);
  }
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  url = url.replace(/\/(rest|auth)\/v1.*$/i, "").replace(/\/+$/, "");
  try { new URL(url); } catch (e) { out.fatal = true; out.problems.push("La URL no es válida. Debe verse así: https://abcdefghij.supabase.co"); return out; }
  if (!/\.supabase\.(co|in)$/i.test(new URL(url).hostname)) out.problems.push("La URL no parece de Supabase (debería terminar en .supabase.co).");

  if (/^sb_secret_/i.test(key)) {
    out.fatal = true;
    out.problems.push("🚨 Pegaste una clave SECRETA (sb_secret_…). Esa NUNCA va en una página web. Bórrala de config.js, créala de nuevo en Supabase (Settings → API Keys) y usa la clave PUBLISHABLE (sb_publishable_…).");
    return out;
  }
  if (key.split(".").length === 3) {
    const payload = b64urlJson(key.split(".")[1]);
    if (payload && payload.role === "service_role") {
      out.fatal = true;
      out.problems.push("🚨 Pegaste la clave service_role. Esa NUNCA va en una página web (da acceso total a tu base). Bórrala de config.js y del sitio, y usa la clave anon (o la publishable). Conviene rotarla en Supabase.");
      return out;
    }
    if (payload && payload.role && payload.role !== "anon") out.problems.push("La clave tiene rol “" + payload.role + "”; debería ser la anon.");
  } else if (!/^sb_publishable_/i.test(key)) {
    out.problems.push("La clave no tiene el formato esperado: debe empezar con sb_publishable_ o con eyJ (anon).");
  }
  out.url = url; out.key = key;
  return out;
}
const SB = readSupabaseConfig();
const USE_SUPABASE = !!(SB.used && !SB.fatal && window.supabase);

let currentUser = null;   // { id, name, email }
let allNotes = [];

// ------------------------------------------------------------
// utilidades
// ------------------------------------------------------------
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}
function setMsg(id, text, type) {
  const m = $(id);
  m.textContent = text || "";
  m.className = "msg" + (type ? " " + type : "");
}
function safeUrl(u) {
  try {
    const x = new URL(u);
    return (x.protocol === "http:" || x.protocol === "https:") ? x.href : "";
  } catch (e) { return ""; }
}
function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
}
function chapterLabel(n) {
  const c = CHAPTERS.find(x => x.n === Number(n));
  return c ? `cap. ${c.n} · ${c.title}` : `cap. ${n}`;
}
function renderMath(node) {
  if (typeof renderMathInElement !== "function") return;
  try {
    renderMathInElement(node, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
        { left: "\\(", right: "\\)", display: false },
        { left: "\\[", right: "\\]", display: true }
      ],
      throwOnError: false
    });
  } catch (e) { console.warn("KaTeX:", e); }
}

// ------------------------------------------------------------
// BACKEND LOCAL (modo sin servidor)
// ------------------------------------------------------------
const LOCAL_NOTES_KEY = "pphyNotesLocal";
const LOCAL_USER_KEY = "pphyUserLocal";

const localBackend = {
  async init() {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    if (raw) { try { return JSON.parse(raw); } catch (e) {} }
    return null;
  },
  async signIn(email, pass, name) {
    const u = { id: "local", name: name || email.split("@")[0] || "yo", email };
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(u));
    return u;
  },
  async signUp(email, pass, name) { return this.signIn(email, pass, name); },
  async signOut() { localStorage.removeItem(LOCAL_USER_KEY); },
  async list() {
    try { return JSON.parse(localStorage.getItem(LOCAL_NOTES_KEY)) || []; }
    catch (e) { return []; }
  },
  async add(note) {
    const notes = await this.list();
    notes.unshift({
      ...note,
      id: "n" + Date.now() + Math.random().toString(16).slice(2, 6),
      author_id: "local",
      author_name: currentUser.name,
      created_at: new Date().toISOString()
    });
    localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(notes));
  },
  async remove(id) {
    const notes = (await this.list()).filter(n => n.id !== id);
    localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(notes));
  }
};

// ------------------------------------------------------------
// BACKEND SUPABASE (compartido)
// ------------------------------------------------------------
let sb = null;
function userFromSession(session) {
  if (!session || !session.user) return null;
  const u = session.user;
  const meta = u.user_metadata || {};
  return { id: u.id, email: u.email, name: meta.name || (u.email || "").split("@")[0] };
}

const supaBackend = {
  async init() {
    sb = window.supabase.createClient(SB.url, SB.key);
    const { data } = await sb.auth.getSession();
    return userFromSession(data.session);
  },
  async signIn(email, pass) {
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    return userFromSession(data.session);
  },
  async signUp(email, pass, name) {
    const { data, error } = await sb.auth.signUp({
      email, password: pass,
      options: { data: { name: name || email.split("@")[0] }, emailRedirectTo: location.href.split("#")[0].split("?")[0] }
    });
    if (error) throw error;
    if (!data.session) {
      const err = new Error("Revisa tu correo para confirmar la cuenta y luego entra.");
      err.soft = true;
      throw err;
    }
    return userFromSession(data.session);
  },
  async signOut() { await sb.auth.signOut(); },
  async list() {
    const { data, error } = await sb.from("pphy_notes").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },
  async add(note) {
    const { error } = await sb.from("pphy_notes").insert({ ...note, author_name: currentUser.name });
    if (error) throw error;
  },
  async remove(id) {
    const { error } = await sb.from("pphy_notes").delete().eq("id", id);
    if (error) throw error;
  }
};

const backend = USE_SUPABASE ? supaBackend : null; // Sin modo local para un espacio privado

// ------------------------------------------------------------
// TABS
// ------------------------------------------------------------
function showTab(name) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === name));
  ["inicio", "materiales", "apuntes", "subir", "libro", "plan"].forEach(t => $("panel-" + t).classList.add("hidden"));
  $("panel-" + name).classList.remove("hidden");
  if (name === "plan") renderPlan();
  if (name === "libro") renderBook();
  document.querySelector('.extra-tab').classList.toggle("hidden", name !== "libro");
}
document.querySelectorAll(".tab-btn").forEach(btn => btn.addEventListener("click", () => showTab(btn.dataset.tab)));
document.querySelectorAll("[data-go-tab]").forEach(btn => btn.addEventListener("click", () => showTab(btn.dataset.goTab)));

// ------------------------------------------------------------
// FILTROS Y SELECTS
// ------------------------------------------------------------
function fillChapterSelects() {
  const f = $("f-chapter");
  f.innerHTML = "";
  const all = el("option", null, "todos los capítulos"); all.value = "";
  f.appendChild(all);
  const n = $("n-chapter");
  n.innerHTML = "";
  CHAPTERS.forEach(c => {
    const o1 = el("option", null, chapterLabel(c.n)); o1.value = c.n; f.appendChild(o1);
    const o2 = el("option", null, chapterLabel(c.n)); o2.value = c.n; n.appendChild(o2);
  });
}
function fillAuthorSelect() {
  const f = $("f-author");
  const prev = f.value;
  f.innerHTML = "";
  const all = el("option", null, "todos los autores"); all.value = "";
  f.appendChild(all);
  [...new Set(allNotes.map(n => n.author_name))].sort().forEach(a => {
    const o = el("option", null, a); o.value = a; f.appendChild(o);
  });
  f.value = prev;
}
["f-chapter", "f-kind", "f-author"].forEach(id => $(id).addEventListener("change", renderNotes));

// ------------------------------------------------------------
// VISOR (Drive / PDF / links)
// ------------------------------------------------------------
function toEmbedUrl(url) {
  const m = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
  const d = url.match(/docs\.google\.com\/(document|presentation|spreadsheets)\/d\/([^/]+)/);
  if (d) return `https://docs.google.com/${d[1]}/d/${d[2]}/preview`;
  return url;
}
function openViewer(url) {
  $("viewer-frame").src = toEmbedUrl(url);
  $("viewer-open").href = url;
  $("viewer").classList.remove("hidden");
}
$("viewer-close").addEventListener("click", () => {
  $("viewer").classList.add("hidden");
  $("viewer-frame").src = "about:blank";
});

// ------------------------------------------------------------
// LISTA DE APUNTES
// ------------------------------------------------------------
function renderNotes() {
  const list = $("notes-list");
  list.innerHTML = "";
  const ch = $("f-chapter").value, kind = $("f-kind").value, au = $("f-author").value;
  const notes = allNotes.filter(n =>
    (!ch || String(n.chapter) === ch) && (!kind || n.kind === kind) && (!au || n.author_name === au));

  if (!notes.length) {
    list.appendChild(el("div", "empty", allNotes.length ? "no hay apuntes con ese filtro" : "aún no hay apuntes. ¡sube el primero!"));
    return;
  }

  notes.forEach(n => {
    const card = el("article", "note k-" + (KINDS.includes(n.kind) ? n.kind : "otro"));
    const head = el("div", "note-head");
    head.appendChild(el("span", "tag " + n.kind, n.kind));
    head.appendChild(el("h3", "note-title", n.title));
    head.appendChild(el("div", "note-meta", `${chapterLabel(n.chapter)} · ${n.author_name} · ${fmtDate(n.created_at)}`));
    card.appendChild(head);

    if (n.body) card.appendChild(el("div", "note-body", n.body));

    const actions = el("div", "note-actions");
    const url = n.link ? safeUrl(n.link) : "";
    if (url) {
      const v = el("button", "btn ghost small", "ver adjunto");
      v.type = "button"; v.addEventListener("click", () => openViewer(url));
      actions.appendChild(v);
    }
    if (currentUser && n.author_id === currentUser.id) {
      const d = el("button", "btn ghost small", "borrar");
      d.type = "button";
      d.addEventListener("click", async () => {
        if (!confirm("¿borrar este apunte?")) return;
        try { await backend.remove(n.id); await loadNotes(); }
        catch (e) { alert("No se pudo borrar: " + (e.message || e)); }
      });
      actions.appendChild(d);
    }
    if (actions.children.length) card.appendChild(actions);
    list.appendChild(card);
    if (n.body) renderMath(card);
  });
}

async function loadNotes() {
  try {
    allNotes = await backend.list();
  } catch (e) {
    allNotes = [];
    $("notes-list").innerHTML = "";
    $("notes-list").appendChild(el("div", "empty",
      "no se pudieron cargar los apuntes (¿tu correo está en la lista del grupo?)"));
    console.error(e);
    return;
  }
  fillAuthorSelect();
  renderNotes();
}
$("refresh-btn").addEventListener("click", loadNotes);

// ------------------------------------------------------------
// SUBIR
// ------------------------------------------------------------
$("n-preview-btn").addEventListener("click", () => {
  const box = $("n-preview");
  box.textContent = $("n-body").value || "(vacío)";
  box.classList.remove("hidden");
  renderMath(box);
});

$("n-save").addEventListener("click", async () => {
  const title = $("n-title").value.trim();
  const body = $("n-body").value.trim();
  const link = $("n-link").value.trim();
  const kind = $("n-kind").value;
  const chapter = parseInt($("n-chapter").value, 10);

  if (!title) return setMsg("n-msg", "ponle un título", "err");
  if (!body && !link) return setMsg("n-msg", "escribe algo o agrega un link", "err");
  if (link && !safeUrl(link)) return setMsg("n-msg", "el link debe empezar con http(s)://", "err");
  if (!KINDS.includes(kind)) return setMsg("n-msg", "tipo inválido", "err");

  const btn = $("n-save");
  btn.disabled = true;
  try {
    await backend.add({ chapter, title, kind, body, link: link ? safeUrl(link) : "" });
    $("n-title").value = ""; $("n-body").value = ""; $("n-link").value = "";
    $("n-preview").classList.add("hidden");
    setMsg("n-msg", "apunte guardado ✓", "ok");
    await loadNotes();
  } catch (e) {
    setMsg("n-msg", "no se pudo guardar: " + (e.message || e), "err");
  } finally {
    btn.disabled = false;
  }
});

// ------------------------------------------------------------
// LIBRO (visor del Drive)
// ------------------------------------------------------------
function renderBook() {
  const box = $("book-box");
  box.innerHTML = "";
  const url = CFG.bookUrl ? safeUrl(CFG.bookUrl) : "";
  const card = el("div", "card book-card");
  if (!url) {
    const empty = el("div", "book-empty");
    empty.appendChild(el("h3", null, "falta el link del libro"));
    const p = el("p");
    p.appendChild(document.createTextNode("sube el PDF al Drive del grupo, compártelo con “cualquiera con el enlace” y pega el link en "));
    p.appendChild(el("code", null, "bookUrl"));
    p.appendChild(document.createTextNode(" dentro de config.js."));
    empty.appendChild(p);
    card.appendChild(empty);
  } else {
    const bar = el("div", "book-bar");
    bar.appendChild(el("strong", null, CFG.book || "libro"));
    const open = el("a", "btn ghost small", "abrir en pestaña nueva ↗");
    open.href = url; open.target = "_blank"; open.rel = "noopener noreferrer";
    bar.appendChild(open);
    card.appendChild(bar);
    const f = document.createElement("iframe");
    f.className = "book-frame"; f.title = CFG.book || "libro";
    f.setAttribute("sandbox", "allow-scripts allow-same-origin allow-popups");
    f.src = toEmbedUrl(url);
    card.appendChild(f);
  }
  box.appendChild(card);
}

// ------------------------------------------------------------
// PLAN DE LECTURA (progreso personal en tu navegador)
// ------------------------------------------------------------
const READ_KEY = "pphyCapitulosLeidos";
function getRead() {
  try { return JSON.parse(localStorage.getItem(READ_KEY)) || {}; } catch (e) { return {}; }
}
function dueDate(n) {
  if (!CFG.startDate) return null;
  const d = new Date(CFG.startDate + "T12:00:00");
  if (isNaN(d)) return null;
  d.setDate(d.getDate() + (CFG.daysPerChapter || 14) * n);
  return d;
}
function renderPlan() {
  $("plan-sub").textContent = CFG.startDate
    ? `un capítulo cada ${CFG.daysPerChapter || 14} días · marca los que ya leíste`
    : "marca los capítulos que ya leíste (agrega startDate en config.js para ver fechas)";
  const list = $("plan-list");
  list.innerHTML = "";
  const read = getRead();
  CHAPTERS.forEach(c => {
    const item = el("div", "plan-item" + (read[c.n] ? " done" : ""));
    const cb = document.createElement("input");
    cb.type = "checkbox"; cb.checked = !!read[c.n];
    cb.addEventListener("change", () => {
      const r = getRead();
      const first = cb.checked && !r[c.n];
      r[c.n] = cb.checked;
      localStorage.setItem(READ_KEY, JSON.stringify(r));
      if (first && window.CitySeeds && typeof window.CitySeeds.add === "function") {
        const key = "pphySemillasCap" + c.n;
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, "1");
          window.CitySeeds.add(CFG.seedsPerChapter || 5, "pphy: capítulo " + c.n + " leído");
        }
      }
      renderPlan(); renderHero();
    });
    item.appendChild(el("div", "plan-num", String(c.n)));
    const g = el("div", "grow");
    g.appendChild(el("div", "t", `capítulo ${c.n} · ${c.title}`));
    const due = dueDate(c.n);
    if (due) g.appendChild(el("div", "d", "reunión: " + due.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })));
    item.appendChild(g);
    item.appendChild(cb);
    list.appendChild(item);
  });
}

// ------------------------------------------------------------
// HERO: plan lateral, capítulos y botones
// ------------------------------------------------------------
function scrollToId(id) { const e = $(id); if (e) e.scrollIntoView({ behavior: "smooth", block: "start" }); }
function goToApp(tab, chapter) {
  if (!currentUser) { $("login-button").click(); return; }
  showTab(tab);
  if (chapter !== undefined) { $("f-chapter").value = String(chapter); renderNotes(); }
  scrollToId("workspace");
}
function renderHero() {
  const read = getRead();
  const side = $("side-list");
  side.innerHTML = "";
  CHAPTERS.forEach(c => {
    const li = el("li");
    const btn = el("button", "side-item"); btn.type = "button";
    btn.appendChild(el("span", "si-n", String(c.n).padStart(2, "0")));
    const body = el("span", "si-body");
    body.appendChild(el("span", "si-title", c.title));
    const due = dueDate(c.n);
    body.appendChild(el("span", "si-sub", due ? "Reunión: " + due.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" }) : "Capítulo " + c.n));
    btn.appendChild(body);
    btn.appendChild(el("span", "si-check" + (read[c.n] ? "" : " off"), "✓"));
    btn.addEventListener("click", () => goToApp("apuntes", c.n));
    li.appendChild(btn); side.appendChild(li);
  });
  const chips = $("hero-chips");
  chips.innerHTML = "";
  CHAPTERS.forEach(c => {
    const b = el("button", "chip-link", "Cap. " + c.n); b.type = "button"; b.title = c.title;
    b.addEventListener("click", () => goToApp("apuntes", c.n));
    chips.appendChild(b);
  });
  const info = $("hero-info");
  info.innerHTML = "";
  if (CFG.book) { const st = document.createElement("strong"); st.textContent = CFG.book; info.appendChild(st); }
  info.appendChild(document.createTextNode(" · 1 capítulo cada " + (CFG.daysPerChapter || 14) + " días · " + CHAPTERS.length + " capítulos"));
}
function paintCtas() {
  $("cta-primary-text").textContent = currentUser ? "Ver apuntes" : "Entrar al grupo";
  $("cta-secondary").classList.toggle("hidden", !currentUser);
}
$("cta-primary").addEventListener("click", () => goToApp("apuntes"));
$("cta-secondary").addEventListener("click", () => goToApp("subir"));

// ------------------------------------------------------------
// ACCESO
// ------------------------------------------------------------
function showApp() {
  $("backdrop").classList.remove("open"); document.body.style.overflow = "";
  $("workspace").classList.remove("hidden");
  $("app").classList.remove("hidden");
  showTab("inicio");
  paintCtas();
  $("user-name").textContent = currentUser.name;
  loadNotes();
  scrollToId("workspace");
}
function showAuth() {
  $("workspace").classList.add("hidden");
  $("app").classList.remove("hidden");
  $("backdrop").classList.remove("open"); document.body.style.overflow = "";
  paintCtas();
}
function friendlyAuthError(e) {
  const m = String((e && e.message) || e || "");
  if (/invalid login credentials/i.test(m)) return "Correo o contraseña incorrectos. Pide acceso a quien administra PPHY si aún no tienes cuenta.";
  if (/email not confirmed/i.test(m)) return "Falta confirmar tu correo: abre el mail que te mandó Supabase y toca el enlace.";
  if (/already registered|already been registered/i.test(m)) return "Ese correo ya tiene cuenta. Toca “entrar”.";
  if (/rate limit|too many/i.test(m)) return "Supabase limitó los correos por un rato. Espera unos minutos (o desactiva “Confirm email” en Authentication → Providers → Email).";
  if (/signups? (are )?(not allowed|disabled)/i.test(m)) return "En Supabase están desactivados los registros nuevos (Authentication → Sign In / Providers).";
  if (/password should be at least/i.test(m)) return "La contraseña es muy corta (mínimo 6 caracteres).";
  if (/failed to fetch|networkerror|load failed/i.test(m)) return "No se pudo conectar con Supabase. Revisa la URL en config.js (usa el botón “Probar conexión”).";
  if (/invalid api key|apikey/i.test(m)) return "Supabase rechazó la clave. Revisa SUPABASE_ANON_KEY en config.js (botón “Probar conexión”).";
  return m;
}

async function doAuth(kind) {
  const email = $("auth-email").value.trim();
  const pass = $("auth-pass").value;
  const name = $("auth-name").value.trim();
  if (!USE_SUPABASE || !backend) return setMsg("auth-msg", "No está disponible la conexión segura con Supabase. No se permite el modo local.", "err");
  if (!email || pass.length < 6) return setMsg("auth-msg", "correo y contraseña (mín. 6 caracteres)", "err");
  setMsg("auth-msg", "…");
  try {
    const signedIn = await backend.signIn(email, pass);
    const { data: member, error: memberError } = await sb.rpc("pphy_is_member");
    if (memberError || member !== true) { await backend.signOut(); throw new Error("Esta cuenta no está autorizada para acceder al grupo."); }
    currentUser = signedIn;
    setMsg("auth-msg", "");
    $("auth-pass").value = "";
    showApp();
  } catch (e) {
    setMsg("auth-msg", e.soft ? e.message : friendlyAuthError(e), e.soft ? "ok" : "err");
  }
}
$("auth-login").addEventListener("click", () => doAuth("login"));

$("auth-pass").addEventListener("keydown", e => { if (e.key === "Enter") doAuth("login"); });
$("logout-btn").addEventListener("click", async () => {
  await backend.signOut();
  currentUser = null;
  allNotes = [];
  showAuth();
});

// ------------------------------------------------------------
// DIAGNÓSTICO DE CONEXIÓN
// ------------------------------------------------------------
async function probe(url, headers) {
  try {
    const r = await fetch(url, { headers });
    let body = ""; try { body = await r.text(); } catch (e) {}
    return { ok: r.ok, status: r.status, body };
  } catch (e) { return { ok: false, status: 0, body: String(e && e.message || e) }; }
}
async function runDiagnostics() {
  const out = $("diag-out");
  out.classList.remove("hidden");
  const lines = [];
  const add = (ok, text) => lines.push((ok === true ? "✅ " : ok === false ? "❌ " : "ℹ️ ") + text);
  const paint = () => { out.textContent = lines.join("\n"); };
  if (!SB.used) { add(null, "config.js no tiene SUPABASE_URL ni SUPABASE_ANON_KEY: la escena está en modo local."); paint(); return; }
  SB.problems.forEach(p => add(false, p));
  if (SB.fatal) { paint(); return; }
  add(!!window.supabase, window.supabase ? "La librería de Supabase cargó." : "La librería de Supabase NO cargó (¿bloqueador de anuncios, sin internet o red de la u?).");
  add(null, "Proyecto: " + SB.url + " · clave: " + (SB.key.startsWith("sb_publishable_") ? "publishable" : "anon (JWT)"));
  paint();
  const H = { apikey: SB.key };
  const a = await probe(SB.url + "/auth/v1/settings", H);
  if (a.ok) add(true, "La URL y la clave son válidas (Supabase respondió).");
  else if (a.status === 0) add(false, "No se pudo llegar a la URL. Revisa que sea exactamente la “Project URL” de Settings → API (https://xxxx.supabase.co).");
  else if (a.status === 401 || a.status === 403) add(false, "Supabase rechazó la clave (error " + a.status + "). Copia otra vez la clave anon/publishable completa.");
  else add(false, "Supabase respondió error " + a.status + ".");
  paint();
  if (a.ok) {
    try { const j = JSON.parse(a.body); if (j && j.disable_signup) add(false, "Los registros están desactivados en Supabase."); if (j && j.mailer_autoconfirm === false) add(null, "“Confirm email” está activo: al crear cuenta llega un correo para confirmar."); } catch (e) {}
    const t = await probe(SB.url + "/rest/v1/pphy_notes?select=id&limit=1", H);
    if (t.ok) add(true, "La tabla pphy_notes existe.");
    else if (t.status === 404 || /PGRST205|does not exist|schema cache/i.test(t.body)) add(false, "No existe la tabla pphy_notes en ESTE proyecto: ejecuta supabase-setup.sql en el SQL Editor del mismo proyecto cuya URL pusiste.");
    else add(false, "No se pudo leer pphy_notes (error " + t.status + ").");
    if (currentUser && sb) {
      const { data, error } = await sb.rpc("pphy_is_member");
      if (error) add(false, "No se pudo comprobar la lista del grupo: " + error.message + " (¿corriste el SQL completo?)");
      else add(data === true, data === true ? "Tu correo (" + currentUser.email + ") está en la lista del grupo." : "Tu correo (" + currentUser.email + ") NO está en pphy_members.");
    } else add(null, "Inicia sesión y vuelve a probar para comprobar si tu correo está en la lista del grupo.");
  }
  paint();
}
$("diag-btn").addEventListener("click", runDiagnostics);

function showBanner(id, text, kind) {
  const b = $(id); b.textContent = text; b.classList.remove("hidden");
  b.classList.toggle("bad", kind === "bad");
}
window.addEventListener("error", e => showBanner("err-banner", "Error en la página: " + (e.message || "desconocido") + " — abre la consola (F12) para más detalle.", "bad"));
window.addEventListener("unhandledrejection", e => showBanner("err-banner", "Error: " + ((e.reason && e.reason.message) || e.reason || "desconocido"), "bad"));

async function checkMembership() {
  if (!USE_SUPABASE || !sb || !currentUser) return;
  try {
    const { data, error } = await sb.rpc("pphy_is_member");
    if (!error && data === false) {
      showBanner("err-banner", "Tu correo (" + currentUser.email + ") no está en la lista del grupo, así que no verás ni podrás subir apuntes. Agrégalo en Supabase → SQL Editor: insert into public.pphy_members (email) values ('" + currentUser.email + "');", "bad");
    } else if (!error) { $("err-banner").classList.add("hidden"); }
  } catch (e) { /* el diagnóstico lo explica */ }
}

// ------------------------------------------------------------
// INICIO
// ------------------------------------------------------------
(async function init() {
  renderHero();
  const banner = $("mode-banner");
  if (SB.used && SB.problems.length) showBanner("mode-banner", SB.problems.join(" "), SB.fatal ? "bad" : "");
  if (SB.used && !SB.fatal && !window.supabase) showBanner("mode-banner", "Pusiste los datos de Supabase pero la librería no cargó (¿bloqueador de anuncios o sin internet?). El espacio privado permanecerá deshabilitado.", "bad");
  if (!USE_SUPABASE) {
    showBanner("mode-banner", "No se pudo configurar la conexión segura a Supabase. El acceso privado está deshabilitado.", "bad");
  }
  const seedEl = $("seed-count");
  if (seedEl && window.CitySeeds && typeof window.CitySeeds.get === "function") {
    try { seedEl.textContent = window.CitySeeds.get(); } catch (e) {}
  }
  fillChapterSelects();
  try {
    if (backend) {
      const sessionUser = await backend.init();
      if (sessionUser) {
        const { data: member, error } = await sb.rpc("pphy_is_member");
        if (!error && member === true) currentUser = sessionUser;
        else { await backend.signOut(); currentUser = null; }
      }
    }
  } catch (e) { console.error(e); currentUser = null; }
  if (currentUser) showApp(); else showAuth();
})();
