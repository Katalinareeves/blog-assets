// ============================================================
//  PPHY — configuración (edita solo este archivo)
// ============================================================
window.PPHY_CONFIG = {
  // 1) Pega aquí los datos de tu proyecto de Supabase
  //    (Project Settings → API → Project URL y anon public key).
  //    Si los dejas vacíos, la escena funciona en MODO LOCAL:
  //    los apuntes se guardan solo en tu navegador.
  SUPABASE_URL: "https://mqjprleqctafnhokxcyk.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_i9HKZXTtwrm709JyZ33rcg_OMe5oMp7",

  // 2) Libro y ritmo del grupo
  book: "Thomson — Modern Particle Physics",
  // No colocar enlaces de materiales privados aquí: config.js es público.
  // El lector se reactivará con un enlace temporal desde almacenamiento privado.
  bookUrl: "",
  // Fecha del primer capítulo, formato AAAA-MM-DD (ej. "2026-10-26").
  // Con esto el calendario calcula la entrega de cada capítulo.
  startDate: "",
  daysPerChapter: 14,
  chapters: [
    { n: 1, title: "Introduction" },
    { n: 2, title: "Underlying Principles" },
    { n: 3, title: "Decay Rates and Cross Sections" },
    { n: 4, title: "The Dirac Equation" }
    // agrega más: { n: 5, title: "..." }
  ],

  // 3) Semillas que da marcar un capítulo como leído
  seedsPerChapter: 5
};
