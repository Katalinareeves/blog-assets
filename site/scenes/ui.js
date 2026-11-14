/* Tema claro/oscuro compartido: respeta tu elección guardada y, si no hay, el tema del sistema */
(function () {
  "use strict";
  var KEY = "ciudadTema";
  function get() {
    try {
      var v = localStorage.getItem(KEY);
      if (v === "light" || v === "dark") return v;
    } catch (e) {}
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function apply(t) {
    document.documentElement.setAttribute("data-theme", t);
    var b = document.getElementById("theme-toggle");
    if (b) {
      b.textContent = t === "light" ? "☾" : "☀";
      b.title = t === "light" ? "cambiar a modo oscuro" : "cambiar a modo claro";
      b.setAttribute("aria-label", b.title);
    }
  }
  apply(get());
  document.addEventListener("DOMContentLoaded", function () {
    apply(get());
    var b = document.getElementById("theme-toggle");
    if (b) b.addEventListener("click", function () {
      var t = get() === "light" ? "dark" : "light";
      try { localStorage.setItem(KEY, t); } catch (e) {}
      apply(t);
    });
  });
})();
