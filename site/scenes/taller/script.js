// ============================================================
// ESCENA: EL TALLER
// ============================================================

"use strict";


// ============================================================
// ELEMENTOS
// ============================================================

const seedCount =
  document.getElementById("seed-count");

const balanceDisplay =
  document.getElementById("balance-display");

const pullCount =
  document.getElementById("pull-count");

const pullOne =
  document.getElementById("pull-one");

const pullTen =
  document.getElementById("pull-ten");

const overlay =
  document.getElementById("gacha-overlay");

const resultRarity =
  document.getElementById("result-rarity");

const resultName =
  document.getElementById("result-name");

const resultDescription =
  document.getElementById("result-description");

const resultDuplicate =
  document.getElementById("result-duplicate");

const closeResult =
  document.getElementById("close-result");

const resultContinue =
  document.getElementById("result-continue");


// ============================================================
// TABS
// ============================================================

const tabButtons =
  document.querySelectorAll(".tab-btn");

const panels =
  document.querySelectorAll(".panel");


tabButtons.forEach(button => {

  button.addEventListener("click", () => {

    const tab =
      button.dataset.tab;

    tabButtons.forEach(btn => {

      btn.classList.remove("active");

    });

    button.classList.add("active");

    panels.forEach(panel => {

      panel.classList.add("hidden");

    });

    const target =
      document.getElementById(
        "panel-" + tab
      );

    if (target) {

      target.classList.remove("hidden");

    }

    if (tab === "collection") {

      renderCollection();

    }

    if (tab === "missions") {

      renderMissions();

    }

  });

});


// ============================================================
// SEMILLAS
// ============================================================

function updateSeedUI() {

  const seeds =
    CitySeeds.get();

  seedCount.textContent =
    seeds;

  balanceDisplay.textContent =
    seeds;

  pullOne.disabled =
    seeds < CitySeeds.gacha.config.singleCost;

  pullTen.disabled =
    seeds < CitySeeds.gacha.config.tenCost;

}


window.addEventListener(
  "seedsChanged",
  updateSeedUI
);

updateSeedUI();


// ============================================================
// GACHA STATE
// ============================================================

function getGachaState() {

  try {

    return JSON.parse(
      localStorage.getItem(
        "ciudadGacha"
      ) || "{}"
    );

  } catch {

    return {};

  }

}


// ============================================================
// PULL COUNTER
// ============================================================

function renderPullCount() {

  const state =
    getGachaState();

  pullCount.textContent =
    state.totalPulls || 0;

}


// ============================================================
// PITY
// ============================================================

function renderPity() {

  const pity =
    CitySeeds.gacha.pity();

  const values = [

    {
      current: pity.rare.current,
      max: pity.rare.max,
      text: "pity-rare",
      bar: "pity-rare-bar"
    },

    {
      current: pity.epic.current,
      max: pity.epic.max,
      text: "pity-epic",
      bar: "pity-epic-bar"
    },

    {
      current: pity.legendary.current,
      max: pity.legendary.max,
      text: "pity-legendary",
      bar: "pity-legendary-bar"
    }

  ];


  values.forEach(item => {

    const text =
      document.getElementById(
        item.text
      );

    const bar =
      document.getElementById(
        item.bar
      );

    text.textContent =
      `${item.current} / ${item.max}`;

    const percentage =
      Math.min(
        100,
        (item.current / item.max) * 100
      );

    bar.style.width =
      percentage + "%";

  });

}


// ============================================================
// RAREZA
// ============================================================

function getRarityStyle(rarity) {

  const styles = {

    common: {
      color: "#aaa4ad"
    },

    uncommon: {
      color: "#91c9a2"
    },

    rare: {
      color: "#b89ad8"
    },

    epic: {
      color: "#e89ac4"
    },

    legendary: {
      color: "#f5c7df"
    }

  };

  return styles[rarity]
    || styles.common;

}


// ============================================================
// MOSTRAR RESULTADO
// ============================================================

function showResult(result) {
  resultContinue.onclick = null; // limpiar la navegación de paquetes anteriores

  const style =
    getRarityStyle(
      result.rarity
    );

  const rarityData =
    CitySeeds.gacha.rarities[
      result.rarity
    ];


  resultRarity.textContent =
    rarityData.label;

  resultRarity.style.color =
    style.color;

  resultName.textContent =
    result.item.name;

  resultDescription.textContent =
    result.item.description;
  const rewardArt=document.getElementById('result-art');
  if(rewardArt)rewardArt.src='assets/furniture/'+encodeURIComponent(result.item.id)+'.svg';


  if (result.duplicate) {

    resultDuplicate.classList.remove(
      "hidden"
    );

    resultDuplicate.textContent =
      `DUPLICADO · +${result.duplicateReward} SEMILLAS`;

  } else {

    resultDuplicate.classList.add(
      "hidden"
    );

  }


  overlay.classList.remove(
    "hidden"
  );

}


// ============================================================
// CERRAR RESULTADO
// ============================================================

function closeOverlay() {

  overlay.classList.add(
    "hidden"
  );

  updateAll();

}


closeResult.addEventListener(
  "click",
  closeOverlay
);

resultContinue.addEventListener(
  "click",
  closeOverlay
);

overlay.addEventListener(
  "click",
  event => {

    if (
      event.target === overlay
    ) {

      closeOverlay();

    }

  }
);


// ============================================================
// ANIMACIÓN DE MÁQUINA
// ============================================================

function animateMachine() {

  const machine =
    document.querySelector(
      ".machine"
    );

  machine.classList.add(
    "machine-pulling"
  );

  setTimeout(() => {

    machine.classList.remove(
      "machine-pulling"
    );

  }, 500);

}


// ============================================================
// UNA TIRADA
// ============================================================

pullOne.addEventListener(
  "click",
  () => {

    if (
      CitySeeds.get() <
      CitySeeds.gacha.config.singleCost
    ) {

      return;

    }

    animateMachine();

    const result =
      CitySeeds.gacha.pull();

    if (!result.success) {

      updateAll();

      return;

    }

    setTimeout(() => {

      showResult(result);

      updateAll();

    }, 450);

  }
);


// ============================================================
// DIEZ TIRADAS
// ============================================================

pullTen.addEventListener(
  "click",
  () => {

    if (
      CitySeeds.get() <
      CitySeeds.gacha.config.tenCost
    ) {

      return;

    }

    animateMachine();

    const result =
      CitySeeds.gacha.pullTen();

    if (!result.success) {

      updateAll();

      return;

    }


    // Por ahora mostramos los resultados
    // uno por uno.

    showTenResults(
      result.results,
      0
    );

  }
);


// ============================================================
// RESULTADOS ×10
// ============================================================

function showTenResults(
  results,
  index
) {

  if (
    index >= results.length
  ) {
    resultContinue.onclick = null;
    updateAll();

    return;

  }


  const result =
    results[index];


  const style =
    getRarityStyle(
      result.rarity
    );

  const rarityData =
    CitySeeds.gacha.rarities[
      result.rarity
    ];


  resultRarity.textContent =
    rarityData.label;

  resultRarity.style.color =
    style.color;

  resultName.textContent =
    result.item.name;

  resultDescription.textContent =
    result.item.description;
  const rewardArt=document.getElementById('result-art');
  if(rewardArt)rewardArt.src='assets/furniture/'+encodeURIComponent(result.item.id)+'.svg';


  if (result.duplicate) {

    resultDuplicate.classList.remove(
      "hidden"
    );

    resultDuplicate.textContent =
      `DUPLICADO · +${result.duplicateReward} SEMILLAS`;

  } else {

    resultDuplicate.classList.add(
      "hidden"
    );

  }


  overlay.classList.remove(
    "hidden"
  );


  resultContinue.onclick = () => {

    overlay.classList.add(
      "hidden"
    );

    setTimeout(() => {

      showTenResults(
        results,
        index + 1
      );

    }, 100);

  };

}


// ============================================================
// COLECCIÓN
// ============================================================

function renderCollection() {

  const grid =
    document.getElementById(
      "collection-grid"
    );

  const owned =
    CitySeeds.collection.get();

  const items =
    CitySeeds.gacha.items;


  grid.innerHTML = "";


  let uniqueOwned = 0;


  items.forEach(item => {

    const data =
      owned[item.id];

    const hasItem =
      Boolean(data);


    if (hasItem) {

      uniqueOwned++;

    }


    const rarity =
      CitySeeds.gacha.rarities[
        item.rarity
      ];

    const card =
      document.createElement(
        "article"
      );

    card.className =
      "collection-card" +
      (hasItem
        ? ""
        : " locked");


    if (hasItem) {

      card.innerHTML = `

        <img class="item-art" alt="" src="assets/furniture/${item.id}.svg">

        <div
          class="item-rarity"
          style="color:${rarity.color}"
        >
          ${rarity.label}
        </div>

        <div class="item-name">
          ${item.name}
        </div>

        <div class="item-description">
          ${item.description}
        </div>

        <div class="item-count">
          ×${data.count}
        </div>

      `;

    } else {

      card.innerHTML = `

        <img class="item-art" alt="" src="assets/furniture/${item.id}.svg">

        <div class="item-rarity">
          DESCONOCIDO
        </div>

        <div class="item-name">
          OBJETO BLOQUEADO
        </div>

        <div class="item-description">
          Consigue este objeto en el gachapón.
        </div>

      `;

    }


    grid.appendChild(card);

  });


  document.getElementById(
    "collection-owned"
  ).textContent =
    uniqueOwned;


  document.getElementById(
    "collection-total"
  ).textContent =
    items.length;

}


// ============================================================
// MISIONES
// ============================================================

// ============================================================
// MISIONES
// ============================================================

const MISSIONS_KEY = "ciudadGachaMissions";

function getMissionState() {

  try {

    return JSON.parse(
      localStorage.getItem(MISSIONS_KEY) || "{}"
    );

  } catch {

    return {};

  }

}


function saveMissionState(state) {

  localStorage.setItem(
    MISSIONS_KEY,
    JSON.stringify(state)
  );

}


// ------------------------------------------------------------
// RECOMPENSA DE MISIÓN
// ------------------------------------------------------------

function claimMission(id, reward) {

  const missions = getMissionState();

  // Ya fue reclamada
  if (missions[id]) {
    return false;
  }

  missions[id] = true;

  saveMissionState(missions);

  CitySeeds.add(reward);

  return true;

}


// ------------------------------------------------------------
// RENDER DE MISIONES
// ------------------------------------------------------------

function renderMissions() {

  const state =
    getGachaState();

  const collection =
    CitySeeds.collection.get();


  const missions =
    getMissionState();


  const pulls =
    state.totalPulls || 0;


  const unique =
    Object.keys(collection).length;


  // ----------------------------------------------------------
  // LEGENDARIO
  // ----------------------------------------------------------

  const legendary =
    Object.values(collection).some(entry => {

      const item =
        CitySeeds.gacha.items.find(
          i => i.id === entry.itemId
        );

      return item &&
        item.rarity === "legendary";

    });


  // ==========================================================
  // MISIÓN 1 — PRIMERA TIRADA
  // ==========================================================

  const firstPullComplete =
    pulls >= 1;


  if (
    firstPullComplete &&
    !missions.firstPull
  ) {

    claimMission(
      "firstPull",
      5
    );

  }


  const firstPullStatus =
    document.getElementById(
      "mission-first-pull"
    );


  if (firstPullStatus) {

    firstPullStatus.textContent =
      missions.firstPull
        ? "COMPLETADA"
        : `${Math.min(pulls, 1)} / 1`;

  }


  // ==========================================================
  // MISIÓN 2 — COLECCIONISTA
  // ==========================================================

  const collectorComplete =
    unique >= 5;


  if (
    collectorComplete &&
    !missions.collector
  ) {

    claimMission(
      "collector",
      10
    );

  }


  const collectorStatus =
    document.getElementById(
      "mission-collector"
    );


  if (collectorStatus) {

    collectorStatus.textContent =
      missions.collector
        ? "COMPLETADA"
        : `${Math.min(unique, 5)} / 5`;

  }


  // ==========================================================
  // MISIÓN 3 — LEGENDARIO
  // ==========================================================

  if (
    legendary &&
    !missions.legendary
  ) {

    claimMission(
      "legendary",
      25
    );

  }


  const legendaryStatus =
    document.getElementById(
      "mission-legendary"
    );


  if (legendaryStatus) {

    legendaryStatus.textContent =
      missions.legendary
        ? "COMPLETADA"
        : "BLOQUEADA";

  }

}

// ============================================================
// ACTUALIZAR TODO
// ============================================================

function updateAll() {

  updateSeedUI();

  renderPullCount();

  renderPity();

  renderCollection();

  renderMissions();
  if (window.AtelierGame) window.AtelierGame.render();

}


updateAll();


// ============================================================
// TECLA ESC
// ============================================================

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape" &&
      !overlay.classList.contains("hidden")
    ) {

      closeOverlay();

    }

  }
);
window.addEventListener("pageshow",()=>{updateAll();});
window.addEventListener("storage",e=>{if(e.key==="ciudadSemillas"){updateAll();}});
