"use strict";

// ============================================================
// ESCENA: UNIVERSIDAD
// ============================================================

// ============================================================
// COMPROBAR SISTEMA CENTRAL DE SEMILLAS
// ============================================================

if (
  typeof window.CitySeeds === "undefined"
) {

  console.error(
    "Universidad: semillas.js no fue cargado antes de script.js"
  );

}

// ============================================================
// NAVEGACIÓN DE TABS
// ============================================================

const tabButtons =
  document.querySelectorAll('.tab-btn');

tabButtons.forEach(btn => {

  btn.addEventListener('click', () => {

    tabButtons.forEach(button => {
      button.classList.remove('active');
    });

    btn.classList.add('active');

    document
      .querySelectorAll('.panel')
      .forEach(panel => {
        panel.classList.add('hidden');
      });

    const target =
      document.getElementById(
        'panel-' + btn.dataset.tab
      );

    if (target) {
      target.classList.remove('hidden');
    }

  });

});

// ============================================================
// ACCESOS RÁPIDOS
// ============================================================

const ACCESOS = [

  {
    label: 'Portal UNAB',
    description: 'intranet y servicios',
    symbol: '↗',
    url: 'https://portal.unab.cl'
  },

  {
    label: 'Canvas',
    description: 'aula virtual',
    symbol: '▦',
    url: 'https://canvas.unab.cl'
  },

  {
    label: 'Correo',
    description: 'correo institucional',
    symbol: '@',
    url: 'https://outlook.com'
  },

  {
    label: 'Biblioteca',
    description: 'recursos y catálogo',
    symbol: '▤',
    url: '#',
    pending: true
  }

];

function renderAccesosRapidos() {

  const grid =
    document.getElementById(
      'access-grid'
    );

  if (!grid) return;

  grid.innerHTML = '';

  ACCESOS.forEach(access => {

    const card =
      document.createElement('a');

    card.className =
      'access-card';

    if (access.pending) {
      card.classList.add(
        'pending-card'
      );
    }

    card.href =
      access.url;

    if (!access.pending) {

      card.target =
        '_blank';

      card.rel =
        'noopener noreferrer';

    }

    card.innerHTML = `

      <span class="access-symbol">
        ${access.symbol}
      </span>

      <span class="label">
        ${access.label}
      </span>

      <span class="access-description">
        ${access.description}
      </span>

      ${
        access.pending
          ? '<span class="pending">link pendiente</span>'
          : '<span class="access-arrow">abrir →</span>'
      }

    `;

    grid.appendChild(card);

  });

}

renderAccesosRapidos();

// ============================================================
// RAMOS EN CURSO
// ============================================================

const EN_CURSO_KEY =
  'ramosEnCurso';

function getRamosEnCurso() {

  try {

    return JSON.parse(
      localStorage.getItem(
        EN_CURSO_KEY
      ) || '[]'
    );

  } catch {

    return [];

  }

}

function setRamosEnCurso(
  ramos
) {

  localStorage.setItem(
    EN_CURSO_KEY,
    JSON.stringify(ramos)
  );

}

function estaEnCurso(id) {

  return getRamosEnCurso()
    .includes(id);

}

// ============================================================
// MALLA CURRICULAR
// ============================================================

const SEM_ROMANOS = {

  1: 'I',
  2: 'II',
  3: 'III',
  4: 'IV',
  5: 'V',
  6: 'VI',
  7: 'VII',
  8: 'VIII'

};

const RAMOS_MALLA = [
  // SEMESTRE 1
  { id: 'algebra', name: 'Álgebra', sem: 1, cat: 'matematica', prereq: [] },
  { id: 'calculo1', name: 'Cálculo I', sem: 1, cat: 'matematica', prereq: [] },
  { id: 'intromecanica', name: 'Introducción a la Mecánica', sem: 1, cat: 'mecanica', prereq: [] },
  { id: 'ideas1', name: 'Ideas Fundamentales de la Física I', sem: 1, cat: 'general', prereq: [] },

  // SEMESTRE 2
  { id: 'algebralineal', name: 'Álgebra Lineal', sem: 2, cat: 'matematica', prereq: ['algebra'] },
  { id: 'calculo2', name: 'Cálculo II', sem: 2, cat: 'matematica', prereq: ['calculo1'] },
  { id: 'introcompu', name: 'Introducción a las Ciencias de la Computación', sem: 2, cat: 'matematica', prereq: [] },
  { id: 'mecanica', name: 'Mecánica', sem: 2, cat: 'mecanica', prereq: ['intromecanica'] },
  { id: 'ideas2', name: 'Ideas Fundamentales de la Física II', sem: 2, cat: 'general', prereq: ['ideas1'] },

  // SEMESTRE 3
  { id: 'calculo3', name: 'Cálculo III', sem: 3, cat: 'matematica', prereq: ['calculo2'] },
  { id: 'edo', name: 'Series y EDO', sem: 3, cat: 'matematica', prereq: ['calculo2'] },
  { id: 'simulacion1', name: 'Simulación y Programación para la Física I', sem: 3, cat: 'general', prereq: ['introcompu'] },
  { id: 'medioscontinuos', name: 'Introducción a la Física de los Medios Continuos', sem: 3, cat: 'general', prereq: ['mecanica'] },
  { id: 'tecnosociedad', name: 'Tecnología y Sociedad', sem: 3, cat: 'humanista', prereq: [] },

  // SEMESTRE 4
  { id: 'estadistica', name: 'Probabilidad y Estadística', sem: 4, cat: 'matematica', prereq: ['calculo2'] },
  { id: 'metodos1', name: 'Métodos Matemáticos I', sem: 4, cat: 'matematica', prereq: ['edo', 'calculo3'] },
  { id: 'integrador1', name: 'Integrador I: Simulación y Programación para la Física II', sem: 4, cat: 'general', prereq: ['simulacion1'] },
  { id: 'elecmag', name: 'Electricidad y Magnetismo', sem: 4, cat: 'general', prereq: ['calculo3', 'mecanica'] },
  { id: 'ingles', name: 'Inglés para Ciencias', sem: 4, cat: 'ingles', prereq: [] },

  // SEMESTRE 5
  { id: 'metodos2', name: 'Métodos Matemáticos II', sem: 5, cat: 'matematica', prereq: ['metodos1'] },
  { id: 'clasica1', name: 'Mecánica Clásica I', sem: 5, cat: 'mecanica', prereq: ['mecanica', 'edo'] },
  { id: 'fisicamoderna', name: 'Física Moderna', sem: 5, cat: 'general', prereq: ['edo'] },
  { id: 'electrodinamica1', name: 'Electrodinámica I', sem: 5, cat: 'general', prereq: ['elecmag'] },

  // SEMESTRE 6
  { id: 'labfisicamoderna', name: 'Laboratorio de Física Moderna', sem: 6, cat: 'general', prereq: ['fisicamoderna'] },
  { id: 'cuantica1', name: 'Mecánica Cuántica I', sem: 6, cat: 'mecanica', prereq: ['clasica1'] },
  { id: 'electrodinamica2', name: 'Electrodinámica II', sem: 6, cat: 'general', prereq: ['electrodinamica1'] },
  { id: 'clasica2', name: 'Mecánica Clásica II', sem: 6, cat: 'mecanica', prereq: ['clasica1'] },
  { id: 'termo', name: 'Termodinámica', sem: 6, cat: 'general', prereq: ['calculo3', 'mecanica'] },

  // SEMESTRE 7
  { id: 'mecanicaestadistica', name: 'Mecánica Estadística', sem: 7, cat: 'mecanica', prereq: ['termo', 'estadistica'] },
  { id: 'cuantica2', name: 'Mecánica Cuántica II', sem: 7, cat: 'mecanica', prereq: ['cuantica1'] },
  { id: 'electivo1', name: 'Electivo I', sem: 7, cat: 'general', prereq: [] },
  { id: 'tesis1', name: 'Tesis I', sem: 7, cat: 'general', prereq: ['integrador1'] },
  { id: 'metodos3', name: 'Métodos Matemáticos III', sem: 7, cat: 'matematica', prereq: ['metodos2'] },

  // SEMESTRE 8
  { id: 'electivo2', name: 'Electivo II', sem: 8, cat: 'general', prereq: ['electivo1'] },
  { id: 'integrador2', name: 'Integrador II: Actividades de Graduación Tesis II', sem: 8, cat: 'general', prereq: ['tesis1'] },
  { id: 'desafios', name: 'Desafíos Globales y Sostenibilidad', sem: 8, cat: 'humanista', prereq: [] }
];

const MALLA_KEY =
  'mallaFisica';

function getCompletados() {

  try {

    return JSON.parse(
      localStorage.getItem(
        MALLA_KEY
      ) || '[]'
    );

  } catch {

    return [];

  }

}

function setCompletados(
  ramos
) {

  localStorage.setItem(
    MALLA_KEY,
    JSON.stringify(ramos)
  );

}

function estaCompletado(id) {

  return getCompletados()
    .includes(id);

}

function estaDesbloqueado(
  ramo
) {

  const completados =
    getCompletados();

  return ramo.prereq.every(
    prereq =>
      completados.includes(
        prereq
      )
  );

}

// ============================================================
// APROBAR / DESAPROBAR RAMO
// ============================================================

function toggleRamo(ramo) {

  const completados = getCompletados();

  const index = completados.indexOf(ramo.id);

  // ----------------------------------------------------------
  // DESAPROBAR
  // ----------------------------------------------------------

  if (index >= 0) {

    completados.splice(
      index,
      1
    );

    setCompletados(
      completados
    );

    // Si estaba en curso, también
    // deja de estar en curso.

    const actuales =
      getRamosEnCurso();

    const currentIndex =
      actuales.indexOf(
        ramo.id
      );

    if (currentIndex >= 0) {

      actuales.splice(
        currentIndex,
        1
      );

      setRamosEnCurso(
        actuales
      );

    }

    refreshUniversityScene();

    return;
  }

  // ----------------------------------------------------------
  // APROBAR
  // ----------------------------------------------------------

  if (
    !estaDesbloqueado(ramo)
  ) {

    return;

  }

  completados.push(
    ramo.id
  );

  setCompletados(
    completados
  );

  // ----------------------------------------------------------
  // RECOMPENSA
  // ----------------------------------------------------------

  if (
    window.CitySeeds &&
    typeof window.CitySeeds.add ===
      'function'
  ) {

    // Recompensa por ramo una sola vez: evita farmear semillas
    // desmarcando y aprobando el mismo ramo repetidamente.
    const rewardKey = 'ciudadRecompensasMalla';
    let rewarded = [];
    try { rewarded = JSON.parse(localStorage.getItem(rewardKey) || '[]'); } catch (_) {}
    if (!Array.isArray(rewarded)) rewarded = [];
    if (!rewarded.includes(ramo.id)) {
      rewarded.push(ramo.id);
      localStorage.setItem(rewardKey, JSON.stringify(rewarded));
      window.CitySeeds.add(5, `aprobación: ${ramo.name}`);
    }

  }

  // ----------------------------------------------------------
  // SACAR DE "EN CURSO"
  // ----------------------------------------------------------

  const actuales =
    getRamosEnCurso();

  const currentIndex =
    actuales.indexOf(
      ramo.id
    );

  if (currentIndex >= 0) {

    actuales.splice(
      currentIndex,
      1
    );

    setRamosEnCurso(
      actuales
    );

  }

  refreshUniversityScene();

}

// ============================================================
// MARCAR / DESMARCAR EN CURSO
// ============================================================

function toggleEnCurso(ramo) {

  // Un ramo aprobado no puede estar en curso.
  if (
    estaCompletado(ramo.id)
  ) {

    return;

  }

  // Un ramo bloqueado no puede marcarse en curso.
  if (
    !estaDesbloqueado(ramo)
  ) {

    return;

  }

  const actuales =
    getRamosEnCurso();

  const index =
    actuales.indexOf(
      ramo.id
    );

  if (index >= 0) {

    // Ya estaba en curso → quitarlo.

    actuales.splice(
      index,
      1
    );

  } else {

    // No estaba en curso → agregarlo.

    actuales.push(
      ramo.id
    );

  }

  setRamosEnCurso(
    actuales
  );

  refreshUniversityScene();

}

// ============================================================
// LIMPIAR INCONSISTENCIAS
// ============================================================

function limpiarInconsistencias() {

  let completados =
    getCompletados();

  let cambio = true;

  while (cambio) {

    cambio = false;

    completados =
      completados.filter(
        id => {

          const ramo =
            RAMOS_MALLA.find(
              item =>
                item.id === id
            );

          if (!ramo) {

            cambio = true;

            return false;

          }

          const valido =
            ramo.prereq.every(
              prereq =>
                completados.includes(
                  prereq
                )
            );

          if (!valido) {

            cambio = true;

            return false;

          }

          return true;

        }
      );

  }

  setCompletados(
    completados
  );

  const actuales =
    getRamosEnCurso();

  const cursosValidos =
    actuales.filter(
      id => {

        const ramo =
          RAMOS_MALLA.find(
            item =>
              item.id === id
          );

        if (!ramo) {
          return false;
        }

        if (
          completados.includes(id)
        ) {
          return false;
        }

        return ramo.prereq.every(
          prereq =>
            completados.includes(
              prereq
            )
        );

      }
    );

  setRamosEnCurso(
    cursosValidos
  );

}

// ============================================================
// RENDER MALLA
// ============================================================

function renderMallaCurricular() {

  const grid =
    document.getElementById(
      'malla-grid'
    );

  if (!grid) return;

  grid.innerHTML = '';

  const semestres =
    [
      ...new Set(
        RAMOS_MALLA.map(
          ramo => ramo.sem
        )
      )
    ].sort(
      (a, b) => a - b
    );

  semestres.forEach(
    sem => {

      const column =
        document.createElement(
          'div'
        );

      column.className =
        'malla-semestre';

      const label =
        document.createElement(
          'div'
        );

      label.className =
        'sem-label';

      label.textContent =
        `semestre ${
          SEM_ROMANOS[sem] || sem
        }`;

      column.appendChild(
        label
      );

      RAMOS_MALLA
        .filter(
          ramo =>
            ramo.sem === sem
        )
        .forEach(
          ramo => {

            const completed =
              estaCompletado(
                ramo.id
              );

            const current =
              estaEnCurso(
                ramo.id
              );

            const unlocked =
              completed ||
              estaDesbloqueado(
                ramo
              );

            const card =
              document.createElement(
                'div'
              );

            let stateClass =
              'locked';

            if (completed) {

              stateClass =
                'completed';

            } else if (current) {

              stateClass =
                'current';

            } else if (unlocked) {

              stateClass =
                'available';

            }

            card.className =
              `ramo-card cat-${ramo.cat} ${stateClass}`;

            card.dataset.ramoId =
              ramo.id;

            if (!unlocked) {

              card.title =
                'requiere: ' +
                (
                  ramo.prereq.length
                    ? ramo.prereq.join(
                        ', '
                      )
                    : 'prerrequisitos'
                );

            } else {

              card.title = '';

            }

            card.innerHTML = `

              <span class="ramo-name">
                ${escapeHTML(
                  ramo.name
                )}
              </span>

              <span
                class="ramo-state-dot"
                aria-hidden="true"
              ></span>

              <span class="ramo-state-label">
                ${
                  completed
                    ? 'aprobado'
                    : current
                      ? 'en curso'
                      : unlocked
                        ? 'disponible'
                        : 'bloqueado'
                }
              </span>

            `;

            // Bibliografía contextual: enlaza a los libros ya catalogados, sin duplicarlos.
            const libraryTopic = ({
              clasica1:'Mecánica Clásica',clasica2:'Mecánica Clásica',
              metodos1:'Métodos Matemáticos',metodos2:'Métodos Matemáticos',metodos3:'Métodos Matemáticos',
              termo:'Termodinámica',mecanicaestadistica:'Termodinámica'
            })[ramo.id];
            if(libraryTopic){
              const link=document.createElement('a');
              link.className='ramo-book-link';
              link.href='../biblioteca/index.html?q='+encodeURIComponent(libraryTopic);
              link.textContent='↗ Bibliografía';
              link.title='Ver libros de '+libraryTopic;
              link.addEventListener('click',event=>event.stopPropagation());
              link.addEventListener('dblclick',event=>event.stopPropagation());
              card.appendChild(link);
            }

            // ------------------------------------------------
            // CLICK
            // ------------------------------------------------

            if (
              unlocked &&
              !completed
            ) {

              card.addEventListener(
                'click',
                () => {

                  toggleEnCurso(
                    ramo
                  );

                }
              );

            }

            // ------------------------------------------------
            // DOBLE CLICK
            // ------------------------------------------------

            if (unlocked) {

              card.addEventListener(
                'dblclick',
                event => {

                  event.preventDefault();

                  toggleRamo(
                    ramo
                  );

                }
              );

            }

            column.appendChild(
              card
            );

          }
        );

      grid.appendChild(
        column
      );

    }
  );

}

// ============================================================
// CALIFICACIONES
// ============================================================

const GRADES_KEY =
  'calificacionesUniversidad';

function getGrades() {

  try {

    return JSON.parse(
      localStorage.getItem(
        GRADES_KEY
      ) || '{}'
    );

  } catch {

    return {};

  }

}

function setGrades(
  data
) {

  localStorage.setItem(
    GRADES_KEY,
    JSON.stringify(data)
  );

}

function getRamosEnCursoMalla() {

  const ids =
    getRamosEnCurso();

  return RAMOS_MALLA.filter(
    ramo =>
      ids.includes(
        ramo.id
      ) &&
      !estaCompletado(
        ramo.id
      )
  );

}

// ============================================================
// PROMEDIO
// ============================================================

function resumenPonderacion(evaluaciones) {
  const items = Array.isArray(evaluaciones) ? evaluaciones : [];
  const pesos = items.map(e => e.peso === '' || e.peso == null ? NaN : Number(e.peso));
  const totalProgramado = pesos.reduce((s,p) => s + (Number.isFinite(p) && p >= 0 ? p : 0), 0);
  const invalidos = pesos.some(p => !Number.isFinite(p) || p < 0 || p > 100);
  const conNota = items.filter((e,i) => Number.isFinite(Number(e.nota)) && e.nota !== null && e.nota !== '' && Number(e.nota)>=1 && Number(e.nota)<=7 && Number.isFinite(pesos[i]) && pesos[i]>0);
  const pesoEvaluado = conNota.reduce((s,e) => s + Number(e.peso), 0);
  const promedio = pesoEvaluado > 0 ? conNota.reduce((s,e) => s + Number(e.nota)*Number(e.peso), 0)/pesoEvaluado : null;
  return {promedio, totalProgramado, pesoEvaluado, invalidos};
}
function calcularPromedio(evaluaciones) {
  return resumenPonderacion(evaluaciones).promedio;
}
function etiquetaPonderacion(evaluaciones) {
  const p = resumenPonderacion(evaluaciones);
  if (!evaluaciones.length) return 'Agrega una evaluación y asigna su porcentaje.';
  if (p.invalidos) return '⚠ Revisa los pesos: deben estar entre 0 y 100%.';
  if (p.totalProgramado > 100.001) return `⚠ Los pesos suman ${p.totalProgramado.toFixed(1)}% (máximo 100%).`;
  const avance = `Evaluado: ${p.pesoEvaluado.toFixed(1)}% · Planificado: ${p.totalProgramado.toFixed(1)}%`;
  return p.totalProgramado < 99.999 ? `⚠ Falta distribuir ${(100-p.totalProgramado).toFixed(1)}%. ${avance}` : avance;
}

// Administrador explícito para corregir ramos en curso sin borrar notas.
function renderGestorRamosEnCurso() {
  const list = document.getElementById('uni-current-list');
  if (!list || list.classList.contains('hidden')) return;
  list.replaceChildren();
  const selected = new Set(getRamosEnCurso());
  const done = new Set(getCompletados());
  RAMOS_MALLA.forEach(ramo => {
    const label = document.createElement('label');
    label.className = 'uni-current-option';
    const box = document.createElement('input');
    box.type='checkbox'; box.checked=selected.has(ramo.id) && !done.has(ramo.id);
    box.disabled=done.has(ramo.id);
    box.addEventListener('change', () => {
      const next = new Set(getRamosEnCurso());
      if (box.checked) next.add(ramo.id); else next.delete(ramo.id);
      setRamosEnCurso([...next].filter(id => !done.has(id)));
      refreshUniversityScene();
      window.dispatchEvent(new Event('universidadCursosActualizados'));
    });
    label.append(box, document.createTextNode(ramo.name+' · semestre '+ramo.sem+(done.has(ramo.id)?' · aprobado':'')));
    list.appendChild(label);
  });
}
document.getElementById('uni-edit-current')?.addEventListener('click',()=>{
  const list=document.getElementById('uni-current-list');
  list.classList.toggle('hidden');
  renderGestorRamosEnCurso();
});
window.addEventListener('universidadCursosActualizados', renderGestorRamosEnCurso);

// ============================================================
// RENDER CALIFICACIONES
// ============================================================

function renderCalificaciones() {

  const grid =
    document.getElementById(
      'grades-grid'
    );

  if (!grid) return;

  grid.innerHTML = '';

  const ramosEnCurso =
    getRamosEnCursoMalla();

  ramosEnCurso.forEach(
    ramo => {

      const data =
        getGrades()[ramo.id] || {
          evaluaciones: []
        };

      const card =
        document.createElement(
          'div'
        );

      card.className =
        'grade-card';

      const average =
        calcularPromedio(
          data.evaluaciones
        );

      card.innerHTML = `

        <div class="grade-header">

          <div>

            <div class="grade-subject">
              ${escapeHTML(
                ramo.name
              )}
            </div>

            <div class="grade-meta">
              ramo en curso
            </div>

          </div>

          <div class="grade-average">
            ${
              average === null
                ? '--'
                : average.toFixed(2)
            }
          </div>

        </div>

        <div class="grade-list">

          ${
            data.evaluaciones.length

              ? data.evaluaciones
                  .map(
                    (ev, index) => `

                      <div
                        class="grade-row"
                        data-index="${index}"
                      >

                        <input
                          class="grade-name"
                          type="text"
                          value="${escapeHTML(
                            ev.nombre
                          )}"
                          placeholder="evaluación"
                        >

                        <input
                          class="grade-weight"
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value="${ev.peso ?? ''}"
                          placeholder="%"
                        >

                        <input
                          class="grade-value"
                          type="number"
                          min="1"
                          max="7"
                          step="0.1"
                          value="${
                            ev.nota ?? ''
                          }"
                          placeholder="nota"
                        >

                        <button
                          class="grade-delete"
                          type="button"
                        >
                          ×
                        </button>

                      </div>

                    `
                  )
                  .join('')

              : `

                  <div class="empty-grade">
                    todavía no hay evaluaciones.
                  </div>

                `
          }

        </div>

        <div class="grade-actions">

          <button
            class="grade-add"
            type="button"
          >
            + evaluación
          </button>

          <span class="grade-method">${etiquetaPonderacion(data.evaluaciones)}</span>

        </div>

      `;

      grid.appendChild(
        card
      );

      card
        .querySelectorAll(
          '.grade-row'
        )
        .forEach(
          row => {

            const index =
              Number(
                row.dataset.index
              );

            const nameInput =
              row.querySelector(
                '.grade-name'
              );

            const weightInput =
              row.querySelector(
                '.grade-weight'
              );

            const valueInput =
              row.querySelector(
                '.grade-value'
              );

            const deleteButton =
              row.querySelector(
                '.grade-delete'
              );

            nameInput.addEventListener(
              'input',
              event => {

                data
                  .evaluaciones[index]
                  .nombre =
                  event.target.value;

                saveCourseGrades(
                  ramo.id,
                  data
                );

              }
            );

            weightInput.addEventListener(
              'input',
              event => {

                data.evaluaciones[index].peso = event.target.value === ''
                  ? null : Number(event.target.value);

                saveCourseGrades(
                  ramo.id,
                  data
                );

                updateGradeAverage(
                  card,
                  data
                );

              }
            );

            valueInput.addEventListener(
              'input',
              event => {

                data
                  .evaluaciones[index]
                  .nota =
                  event.target.value === ''
                    ? null
                    : Number(
                        event.target.value
                      );

                saveCourseGrades(
                  ramo.id,
                  data
                );

                updateGradeAverage(
                  card,
                  data
                );

              }
            );

            deleteButton.addEventListener(
              'click',
              () => {

                data.evaluaciones.splice(
                  index,
                  1
                );

                saveCourseGrades(
                  ramo.id,
                  data
                );

                renderCalificaciones();

              }
            );

          }
        );

      card
        .querySelector(
          '.grade-add'
        )
        .addEventListener(
          'click',
          () => {

            data.evaluaciones.push({

              nombre: '',
              peso: null,
              nota: null

            });

            saveCourseGrades(
              ramo.id,
              data
            );

            renderCalificaciones();

          }
        );

    }
  );

  if (!grid.children.length) {

    grid.innerHTML = `

      <div class="empty-state">

        <div class="empty-state-symbol">
          +
        </div>

        <p>
          marca tus ramos disponibles como
          "en curso" en la malla para comenzar
          a registrar calificaciones.
        </p>

      </div>

    `;

  }

}

// ============================================================
// GUARDAR CALIFICACIONES
// ============================================================

function saveCourseGrades(
  courseId,
  data
) {

  const all =
    getGrades();

  all[courseId] =
    data;

  setGrades(
    all
  );

}

// ============================================================
// ACTUALIZAR PROMEDIO
// ============================================================

function updateGradeAverage(
  card,
  data
) {

  const average =
    calcularPromedio(
      data.evaluaciones
    );

  const averageElement =
    card.querySelector(
      '.grade-average'
    );

  const methodElement =
    card.querySelector(
      '.grade-method'
    );

  if (averageElement) {

    averageElement.textContent =
      average === null
        ? '--'
        : average.toFixed(2);

  }

  if (methodElement) {
    methodElement.textContent = etiquetaPonderacion(data.evaluaciones);
  }

}

// ============================================================
// AGENDA
// ============================================================

const AGENDA_KEY =
  'agendaUniversidad';

function getAgenda() {

  try {

    return JSON.parse(
      localStorage.getItem(
        AGENDA_KEY
      ) || '[]'
    );

  } catch {

    return [];

  }

}

function setAgenda(
  items
) {

  localStorage.setItem(
    AGENDA_KEY,
    JSON.stringify(items)
  );

}

function renderAgendaCourseSelect() {

  const select =
    document.getElementById(
      'agenda-course'
    );

  if (!select) return;

  const previousValue =
    select.value;

  select.innerHTML = `
    <option value="">
      ramo
    </option>
  `;

  getRamosEnCursoMalla()
    .forEach(
      ramo => {

        const option =
          document.createElement(
            'option'
          );

        option.value =
          ramo.id;

        option.textContent =
          ramo.name;

        select.appendChild(
          option
        );

      }
    );

  if (
    [...select.options].some(
      option =>
        option.value ===
        previousValue
    )
  ) {

    select.value =
      previousValue;

  }

}

// ============================================================
// RENDER AGENDA
// ============================================================

function renderAgenda() {

  const list =
    document.getElementById(
      'agenda-list'
    );

  if (!list) return;

  const items =
    getAgenda();

  list.innerHTML = '';

  if (!items.length) {

    list.innerHTML = `

      <div class="empty-state agenda-empty">

        <div class="empty-state-symbol">
          ◆
        </div>

        <p>
          no hay recordatorios todavía.
        </p>

      </div>

    `;

    return;

  }

  const courseNames =
    Object.fromEntries(
      RAMOS_MALLA.map(
        ramo => [
          ramo.id,
          ramo.name
        ]
      )
    );

  const sorted =
    items
      .map(
        (item, index) => ({
          ...item,
          originalIndex:
            index
        })
      )
      .sort(
        (a, b) => {

          if (
            a.done !== b.done
          ) {

            return a.done
              ? 1
              : -1;

          }

          const dateA =
            a.date ||
            '9999-12-31';

          const dateB =
            b.date ||
            '9999-12-31';

          return dateA.localeCompare(
            dateB
          );

        }
      );

  sorted.forEach(
    item => {

      const row =
        document.createElement(
          'div'
        );

      row.className =
        'agenda-item' +
        (
          item.done
            ? ' done'
            : ''
        );

      const course =
        courseNames[
          item.course
        ] ||
        'general';

      row.innerHTML = `

        <button
          class="agenda-check"
          type="button"
          aria-label="marcar como hecho"
        >
          ${
            item.done
              ? '✓'
              : '○'
          }
        </button>

        <div class="agenda-content">

          <div class="agenda-text">
            ${escapeHTML(
              item.text
            )}
          </div>

          <div class="agenda-meta">

            <span>
              ${escapeHTML(
                course
              )}
            </span>

            ${
              item.date
                ? `
                    <span>
                      ${formatDate(
                        item.date
                      )}
                    </span>
                  `
                : ''
            }

          </div>

        </div>

        <button
          class="agenda-delete"
          type="button"
          aria-label="eliminar"
        >
          ×
        </button>

      `;

      row
        .querySelector(
          '.agenda-check'
        )
        .addEventListener(
          'click',
          () => {

            const current =
              getAgenda();

            current[
              item.originalIndex
            ].done =
              !current[
                item.originalIndex
              ].done;

            setAgenda(
              current
            );

            renderAgenda();
            renderEvaluations();

          }
        );

      row
        .querySelector(
          '.agenda-delete'
        )
        .addEventListener(
          'click',
          () => {

            const current =
              getAgenda();

            current.splice(
              item.originalIndex,
              1
            );

            setAgenda(
              current
            );

            renderAgenda();
            renderEvaluations();

          }
        );

      list.appendChild(
        row
      );

    }
  );

}

// ============================================================
// AGREGAR AGENDA
// ============================================================

function initAgenda() {

  const addButton =
    document.getElementById(
      'agenda-add-btn'
    );

  const textInput =
    document.getElementById(
      'agenda-text'
    );

  const courseSelect =
    document.getElementById(
      'agenda-course'
    );

  if (
    !addButton ||
    !textInput ||
    !courseSelect
  ) {
    return;
  }

  let dateInput =
    document.getElementById(
      'agenda-date'
    );

  if (!dateInput) {

    dateInput =
      document.createElement(
        'input'
      );

    dateInput.type =
      'date';

    dateInput.id =
      'agenda-date';

    dateInput.className =
      'agenda-date';

    dateInput.title =
      'fecha opcional';

    const parent =
      textInput.parentElement;

    parent.insertBefore(
      dateInput,
      addButton
    );

  }

  addButton.addEventListener(
    'click',
    () => {

      const text =
        textInput.value.trim();

      const course =
        courseSelect.value;

      const date =
        dateInput.value;

      if (!text) {

        textInput.focus();

        return;

      }

      const items =
        getAgenda();

      items.push({

        id: Date.now(),

        text,

        course,

        date,

        done: false

      });

      setAgenda(
        items
      );

      textInput.value =
        '';

      dateInput.value =
        '';

      courseSelect.value =
        '';

      renderAgenda();
      renderEvaluations();

    }
  );

  textInput.addEventListener(
    'keydown',
    event => {

      if (
        event.key ===
        'Enter'
      ) {

        event.preventDefault();

        addButton.click();

      }

    }
  );

}

// ============================================================
// UTILIDADES
// ============================================================

function formatDate(
  dateString
) {

  if (!dateString) {
    return '';
  }

  const [
    year,
    month,
    day
  ] =
    dateString.split('-');

  return `${day}/${month}/${year}`;

}

function escapeHTML(
  value
) {

  return String(
    value ?? ''
  )
    .replace(
      /&/g,
      '&amp;'
    )
    .replace(
      /</g,
      '&lt;'
    )
    .replace(
      />/g,
      '&gt;'
    )
    .replace(
      /"/g,
      '&quot;'
    )
    .replace(
      /'/g,
      '&#039;'
    );

}

// ============================================================
// INICIALIZAR AGENDA
// ============================================================

renderAgendaCourseSelect();
initAgenda();
renderAgenda();

// ============================================================
// CALENDARIO
// ============================================================

const HORARIO = [

  {
    day: 'lunes',
    start: '10:20',
    end: '12:00',
    course: 'metodos',
    short: 'Métodos'
  },

  {
    day: 'lunes',
    start: '12:10',
    end: '13:50',
    course: 'clasica',
    short: 'Mecánica Clásica'
  },

  {
    day: 'lunes',
    start: '14:00',
    end: '15:40',
    course: 'electromagnetismo',
    short: 'Electromagnetismo'
  },

  {
    day: 'martes',
    start: '08:30',
    end: '10:10',
    course: 'termo',
    short: 'Termodinámica'
  },

  {
    day: 'martes',
    start: '10:20',
    end: '12:00',
    course: 'electromagnetismo',
    short: 'Electromagnetismo'
  },

  {
    day: 'martes',
    start: '12:10',
    end: '13:50',
    course: 'termo',
    short: 'Termodinámica'
  },

  {
    day: 'miércoles',
    start: '10:20',
    end: '12:00',
    course: 'metodos',
    short: 'Métodos'
  },

  {
    day: 'miércoles',
    start: '12:10',
    end: '13:50',
    course: 'clasica',
    short: 'Mecánica Clásica'
  },

  {
    day: 'jueves',
    start: '08:30',
    end: '10:10',
    course: 'electromagnetismo',
    short: 'Electromagnetismo'
  },

  {
    day: 'jueves',
    start: '10:20',
    end: '12:00',
    course: 'termo',
    short: 'Termodinámica'
  },

  {
    day: 'viernes',
    start: '12:10',
    end: '13:50',
    course: 'metodos',
    short: 'Métodos'
  },

  {
    day: 'viernes',
    start: '14:00',
    end: '15:40',
    course: 'termo',
    short: 'Termodinámica'
  }

];

const HORARIO_DEFAULT = HORARIO.map(item => ({...item}));
function cargarHorarioPersonal(){
  let saved = null;
  try { saved=JSON.parse(localStorage.getItem('ciudadHorarioPersonal') || 'null'); } catch(e) {}
  if(Array.isArray(saved)) HORARIO.splice(0,HORARIO.length,...saved.filter(x => x && typeof x.day==='string' && /^\d{2}:\d{2}$/.test(x.start||'') && /^\d{2}:\d{2}$/.test(x.end||'')).slice(0,80));
}
cargarHorarioPersonal();
const DAYS = [
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes'
];

function timeToMinutes(
  time
) {

  const [
    hours,
    minutes
  ] =
    time
      .split(':')
      .map(Number);

  return (
    hours * 60 +
    minutes
  );

}

// ============================================================
// RENDER HORARIO
// ============================================================

function renderHorario() {

  const grid =
    document.getElementById(
      'schedule-grid'
    );

  if (!grid) return;

  grid.innerHTML = '';

  const allMinutes =
    HORARIO.flatMap(
      item => [
        timeToMinutes(
          item.start
        ),
        timeToMinutes(
          item.end
        )
      ]
    );

  if(!allMinutes.length){ grid.innerHTML='<p class="horario-empty">Sin clases todavía. Usa «Editar horario» para agregar tus bloques.</p>'; return; }

  const minTime =
    Math.min(
      ...allMinutes
    );

  const maxTime =
    Math.max(
      ...allMinutes
    );

  const startHour =
    Math.floor(
      minTime / 60
    ) * 60;

  const endHour =
    Math.ceil(
      maxTime / 60
    ) * 60;

  const totalMinutes =
    endHour -
    startHour;

  const corner =
    document.createElement(
      'div'
    );

  corner.className =
    'schedule-corner';

  grid.appendChild(
    corner
  );

  DAYS.forEach(
    day => {

      const header =
        document.createElement(
          'div'
        );

      header.className =
        'schedule-day';

      header.textContent =
        day;

      grid.appendChild(
        header
      );

    }
  );

  const timeColumn =
    document.createElement(
      'div'
    );

  timeColumn.className =
    'schedule-times';

  for (
    let minutes = startHour;
    minutes <= endHour;
    minutes += 60
  ) {

    const label =
      document.createElement(
        'div'
      );

    label.className =
      'schedule-time';

    const percentage =
      (
        (minutes -
          startHour) /
        totalMinutes
      ) * 100;

    label.style.top =
      `${percentage}%`;

    const hours =
      Math.floor(
        minutes / 60
      );

    const mins =
      minutes % 60;

    label.textContent =
      `${String(
        hours
      ).padStart(
        2,
        '0'
      )}:${String(
        mins
      ).padStart(
        2,
        '0'
      )}`;

    timeColumn.appendChild(
      label
    );

  }

  grid.appendChild(
    timeColumn
  );

  DAYS.forEach(
    day => {

      const column =
        document.createElement(
          'div'
        );

      column.className =
        'schedule-column';

      for (
        let minutes = startHour;
        minutes <= endHour;
        minutes += 60
      ) {

        const line =
          document.createElement(
            'div'
          );

        line.className =
          'schedule-hour-line';

        const percentage =
          (
            (minutes -
              startHour) /
            totalMinutes
          ) * 100;

        line.style.top =
          `${percentage}%`;

        column.appendChild(
          line
        );

      }

      HORARIO
        .filter(
          item =>
            item.day === day
        )
        .forEach(
          item => {

            const start =
              timeToMinutes(
                item.start
              );

            const end =
              timeToMinutes(
                item.end
              );

            const top =
              (
                (start -
                  startHour) /
                totalMinutes
              ) * 100;

            const height =
              (
                (end - start) /
                totalMinutes
              ) * 100;

            const block =
              document.createElement(
                'div'
              );

            block.className =
              'schedule-class';

            block.dataset.course =
              item.course;

            block.style.top =
              `${top}%`;

            block.style.height =
              `${height}%`;

            block.innerHTML = `

              <span class="schedule-class-name">
                ${escapeHTML(
                  item.short
                )}
              </span>

              <span class="schedule-class-time">
                ${item.start} · ${item.end}
              </span>

            `;

            column.appendChild(
              block
            );

          }
        );

      grid.appendChild(
        column
      );

    }
  );

}

// ============================================================
// EVALUACIONES DEL CALENDARIO
// ============================================================

function renderEvaluations() {

  const list =
    document.getElementById(
      'evaluation-list'
    );

  if (!list) return;

  const items =
    getAgenda().filter(
      item =>
        item.date
    );

  list.innerHTML = '';

  if (!items.length) {

    list.innerHTML = `

      <div class="empty-state">

        <div class="empty-state-symbol">
          ◇
        </div>

        <p>
          las evaluaciones con fecha
          aparecerán aquí automáticamente.
        </p>

      </div>

    `;

    return;

  }

  const courseNames =
    Object.fromEntries(
      RAMOS_MALLA.map(
        ramo => [
          ramo.id,
          ramo.name
        ]
      )
    );

  const sorted =
    items
      .map(
        (item, index) => ({
          ...item,
          originalIndex:
            index
        })
      )
      .sort(
        (a, b) =>
          a.date.localeCompare(
            b.date
          )
      );

  sorted.forEach(
    item => {

      const row =
        document.createElement(
          'div'
        );

      row.className =
        'evaluation-row';

      row.innerHTML = `

        <div class="evaluation-date">
          ${formatDate(
            item.date
          )}
        </div>

        <div class="evaluation-info">

          <div class="evaluation-name">
            ${escapeHTML(
              item.text
            )}
          </div>

          <div class="evaluation-course">
            ${escapeHTML(
              courseNames[
                item.course
              ] ||
              'general'
            )}
          </div>

        </div>

      `;

      list.appendChild(
        row
      );

    }
  );

}

// ============================================================
// OCULTAR FORMULARIO ANTIGUO
// ============================================================

const evaluationAddForm =
  document.querySelector(
    '.evaluation-add'
  );

if (evaluationAddForm) {

  evaluationAddForm.style.display =
    'none';

}

// ============================================================
// INICIALIZAR CALENDARIO
// ============================================================

renderHorario();
renderEvaluations();

// ============================================================
// CAMBIO HORARIO / EVALUACIONES
// ============================================================

const calendarButtons =
  document.querySelectorAll(
    '.calendar-view-btn'
  );

calendarButtons.forEach(
  button => {

    button.addEventListener(
      'click',
      () => {

        calendarButtons.forEach(
          b => {
            b.classList.remove(
              'active'
            );
          }
        );

        button.classList.add(
          'active'
        );

        document
          .querySelectorAll(
            '.calendar-view'
          )
          .forEach(
            view => {
              view.classList.add(
                'hidden'
              );
            }
          );

        const target =
          document.getElementById(
            'calendar-' +
            button.dataset
              .calendarView
          );

        if (target) {

          target.classList.remove(
            'hidden'
          );

        }

      }
    );

  }
);

// ============================================================
// POMODORO
// ============================================================

const FOCUS_TIME =
  25 * 60;

const BREAK_TIME =
  5 * 60;

let timerSeconds =
  FOCUS_TIME;

let timerInterval =
  null;

let timerRunning =
  false;

let timerMode =
  'focus';

const timerDisplay =
  document.getElementById(
    'timer-display'
  );

const timerModeLabel =
  document.getElementById(
    'timer-mode'
  );

const timerStart =
  document.getElementById(
    'timer-start'
  );

const timerReset =
  document.getElementById(
    'timer-reset'
  );

function renderTimer() {

  if (!timerDisplay) {
    return;
  }

  const minutes =
    Math.floor(
      timerSeconds / 60
    );

  const seconds =
    timerSeconds % 60;

  timerDisplay.textContent =
    `${String(
      minutes
    ).padStart(
      2,
      '0'
    )}:${String(
      seconds
    ).padStart(
      2,
      '0'
    )}`;

  const progressEl=document.getElementById('focus-progress');
  const progressText=document.getElementById('focus-progress-text');
  if(progressEl&&progressText){const total=timerMode==='focus'?FOCUS_TIME:BREAK_TIME;const pct=Math.min(100,Math.max(0,(1-timerSeconds/total)*100));progressEl.style.width=pct.toFixed(1)+'%';progressText.textContent=Math.round(pct)+' % completado';}

  if (timerModeLabel) {

    timerModeLabel.textContent =
      timerMode === 'focus'
        ? 'enfoque'
        : 'descanso';

  }

  if (timerStart) {

    timerStart.textContent =
      timerRunning
        ? 'pausar'
        : 'iniciar';

  }

}

function switchTimerMode() {

  if (
    timerMode ===
    'focus'
  ) {

    timerMode =
      'break';

    timerSeconds =
      BREAK_TIME;

  } else {

    timerMode =
      'focus';

    timerSeconds =
      FOCUS_TIME;

  }

  renderTimer();

}

function completeFocusSession() {
  if(timerMode==='focus'){
    const feedback=document.getElementById('focus-feedback');
    const goal=document.getElementById('focus-intention');
    if(feedback){feedback.classList.add('completed');feedback.textContent='✦ ¡Sesión completada! +1 semilla local. '+(goal&&goal.value.trim()?'Objetivo: '+goal.value.trim(): 'Buen trabajo manteniendo el enfoque.');}
  }

  if (
    timerMode ===
    'focus'
  ) {

    if (
      window.CitySeeds &&
      typeof window.CitySeeds.add ===
        'function'
    ) {

      window.CitySeeds.add(
        1,
        'sesión de enfoque'
      );

    }

  }

  switchTimerMode();

}

function timerTick() {

  if (
    timerSeconds <= 0
  ) {

    completeFocusSession();

    return;

  }

  timerSeconds--;

  renderTimer();

}

function toggleTimer() {

  if (timerRunning) {

    clearInterval(
      timerInterval
    );

    timerInterval =
      null;

    timerRunning =
      false;

  } else {

    timerInterval =
      setInterval(
        timerTick,
        1000
      );

    timerRunning =
      true;

  }

  renderTimer();

}

function resetTimer() {

  clearInterval(
    timerInterval
  );

  timerInterval =
    null;

  timerRunning =
    false;

  timerMode =
    'focus';

  timerSeconds =
    FOCUS_TIME;

  renderTimer();

}

if (timerStart) {

  timerStart.addEventListener(
    'click',
    toggleTimer
  );

}

if (timerReset) {

  timerReset.addEventListener(
    'click',
    resetTimer
  );

}

renderTimer();

// ============================================================
// SINCRONIZACIÓN GENERAL
// ============================================================

function refreshUniversityScene() {

  renderMallaCurricular();

  renderCalificaciones();

  renderAgendaCourseSelect();

  renderAgenda();

  renderEvaluations();

  renderHorario();

  if (
    window.CitySeeds &&
    typeof window.CitySeeds.render ===
      'function'
  ) {

    window.CitySeeds.render();

  }

}

// ============================================================
// INICIALIZACIÓN FINAL
// ============================================================

refreshUniversityScene();