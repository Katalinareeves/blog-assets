/* Tema claro/oscuro compartido (se guarda en localStorage) */
(function () {
  "use strict";
  var KEY = "ciudadTema";
  function get() {
    try { return localStorage.getItem(KEY) === "light" ? "light" : "dark"; } catch (e) { return "dark"; }
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
