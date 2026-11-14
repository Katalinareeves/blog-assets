// ============================================================
// LA CIUDAD — SISTEMA CENTRAL DE SEMILLAS
// ============================================================
// Este archivo NO pertenece a una escena específica.
// Todas las escenas pueden usarlo.
//
// Moneda compartida:
//   ciudadSemillas
//
// También administra:
//   - historial
//   - estadísticas
//   - gacha
//   - pity
//   - colección
//   - recompensas desbloqueadas
//   - rachas
// ============================================================

"use strict";

// ============================================================
// CONFIGURACIÓN
// ============================================================

const SEED_KEY = "ciudadSemillas";

const SEED_HISTORY_KEY = "ciudadSemillasHistorial";
const GACHA_KEY = "ciudadGacha";
const COLLECTION_KEY = "ciudadColeccion";
const DAILY_KEY = "ciudadDaily";
const STATS_KEY = "ciudadStats";

// ============================================================
// SEMILLAS
// ============================================================

function getSeeds() {
  return parseInt(
    localStorage.getItem(SEED_KEY) || "0",
    10
  );
}

function setSeeds(amount) {
  const value = Math.max(
    0,
    Math.floor(Number(amount) || 0)
  );

  localStorage.setItem(
    SEED_KEY,
    String(value)
  );

  renderSeedCount();
  emitSeedsChanged();

  return value;
}

function addSeeds(amount, reason = "sin especificar") {
  amount = Math.floor(Number(amount) || 0);

  if (amount === 0) {
    return getSeeds();
  }

  const before = getSeeds();

  const after = Math.max(
    0,
    before + amount
  );

  localStorage.setItem(
    SEED_KEY,
    String(after)
  );

  registerSeedHistory(
    amount,
    reason
  );

  updateStats(
    amount > 0 ? "earned" : "spent",
    Math.abs(amount)
  );

  renderSeedCount();
  emitSeedsChanged();

  return after;
}

function spendSeeds(amount, reason = "compra") {
  amount = Math.floor(Number(amount) || 0);

  if (amount <= 0) {
    return false;
  }

  if (getSeeds() < amount) {
    return false;
  }

  addSeeds(
    -amount,
    reason
  );

  return true;
}

// ============================================================
// RENDER
// ============================================================

function renderSeedCount() {
  const elements = document.querySelectorAll(
    "#seed-count, #val-seeds, [data-seeds]"
  );

  const value = getSeeds();

  elements.forEach(el => {
    el.textContent = value;
  });
}

// ============================================================
// EVENTO GLOBAL
// ============================================================

function emitSeedsChanged() {
  window.dispatchEvent(
    new CustomEvent(
      "seedsChanged",
      {
        detail: {
          seeds: getSeeds()
        }
      }
    )
  );
}

// ============================================================
// HISTORIAL
// ============================================================

function getSeedHistory() {
  try {
    return JSON.parse(
      localStorage.getItem(
        SEED_HISTORY_KEY
      ) || "[]"
    );
  } catch {
    return [];
  }
}

function registerSeedHistory(
  amount,
  reason
) {
  const history =
    getSeedHistory();

  history.unshift({
    amount,
    reason,
    balance: getSeeds(),
    timestamp: Date.now()
  });

  localStorage.setItem(
    SEED_HISTORY_KEY,
    JSON.stringify(
      history.slice(0, 200)
    )
  );
}

// ============================================================
// ESTADÍSTICAS
// ============================================================

function getStats() {
  try {
    return JSON.parse(
      localStorage.getItem(
        STATS_KEY
      ) || "{}"
    );
  } catch {
    return {};
  }
}

function updateStats(
  type,
  amount
) {
  const stats =
    getStats();

  stats.totalEarned =
    Number(stats.totalEarned) || 0;

  stats.totalSpent =
    Number(stats.totalSpent) || 0;

  if (type === "earned") {
    stats.totalEarned += amount;
  }

  if (type === "spent") {
    stats.totalSpent += amount;
  }

  localStorage.setItem(
    STATS_KEY,
    JSON.stringify(stats)
  );
}

// ============================================================
// GACHA
// ============================================================

const GACHA = {

  singleCost: 10,

  tenCost: 90,

  pityRare: 10,

  pityEpic: 30,

  pityLegendary: 80

};

// ============================================================
// RAREZAS
// ============================================================

const GACHA_RARITIES = {

  common: {
    label: "COMÚN",
    chance: 0.60,
    color: "#a9a3ad"
  },

  uncommon: {
    label: "POCO COMÚN",
    chance: 0.25,
    color: "#8fcfa4"
  },

  rare: {
    label: "RARO",
    chance: 0.10,
    color: "#c39be8"
  },

  epic: {
    label: "ÉPICO",
    chance: 0.045,
    color: "#ee9bd1"
  },

  legendary: {
    label: "LEGENDARIO",
    chance: 0.005,
    color: "#f5c7df"
  }

};

// ============================================================
// ESTADO GACHA
// ============================================================

function getGachaState() {
  try {
    return JSON.parse(
      localStorage.getItem(
        GACHA_KEY
      ) || "{}"
    );
  } catch {
    return {};
  }
}

function saveGachaState(state) {
  localStorage.setItem(
    GACHA_KEY,
    JSON.stringify(state)
  );
}

function ensureGachaState() {
  const state =
    getGachaState();

  state.totalPulls =
    Number(state.totalPulls) || 0;

  state.pityRare =
    Number(state.pityRare) || 0;

  state.pityEpic =
    Number(state.pityEpic) || 0;

  state.pityLegendary =
    Number(state.pityLegendary) || 0;

  state.freePullAvailable =
    state.freePullAvailable ?? true;

  saveGachaState(state);

  return state;
}

// ============================================================
// ELECCIÓN DE RAREZA
// ============================================================

function rollRarity(state) {

  state.pityRare++;
  state.pityEpic++;
  state.pityLegendary++;

  if (
    state.pityLegendary >=
    GACHA.pityLegendary
  ) {

    state.pityLegendary = 0;
    state.pityEpic = 0;
    state.pityRare = 0;

    return "legendary";
  }

  if (
    state.pityEpic >=
    GACHA.pityEpic
  ) {

    state.pityEpic = 0;
    state.pityRare = 0;

    return Math.random() < 0.15
      ? "legendary"
      : "epic";
  }

  if (
    state.pityRare >=
    GACHA.pityRare
  ) {

    state.pityRare = 0;

    return Math.random() < 0.03
      ? "epic"
      : "rare";
  }

  const r =
    Math.random();

  let accumulated = 0;

  for (
    const rarity of
    Object.keys(GACHA_RARITIES)
  ) {

    accumulated +=
      GACHA_RARITIES[rarity].chance;

    if (r <= accumulated) {
      return rarity;
    }

  }

  return "common";
}

// ============================================================
// CATÁLOGO
// ============================================================

const GACHA_ITEMS = [

  {
    id: "tiny_seed",
    name: "Semillita curiosa",
    rarity: "common",
    description:
      "Una pequeña semilla para tu colección."
  },

  {
    id: "city_stamp",
    name: "Sello de la ciudad",
    rarity: "common",
    description:
      "Un sello cosmético para tu perfil."
  },

  {
    id: "street_note",
    name: "Nota encontrada",
    rarity: "common",
    description:
      "Un fragmento de texto perdido por la ciudad."
  },

  {
    id: "purple_flower",
    name: "Flor violeta",
    rarity: "uncommon",
    description:
      "Desbloquea una decoración para el jardín."
  },

  {
    id: "night_lamp",
    name: "Lámpara nocturna",
    rarity: "uncommon",
    description:
      "Una pequeña luz para decorar una escena."
  },

  {
    id: "coffee_token",
    name: "Ficha de café",
    rarity: "uncommon",
    description:
      "Una ficha coleccionable del barrio."
  },

  {
    id: "cat_companion",
    name: "Gato callejero",
    rarity: "rare",
    description:
      "Desbloquea un visitante para una escena."
  },

  {
    id: "rain_effect",
    name: "Noche lluviosa",
    rarity: "rare",
    description:
      "Desbloquea un ambiente alternativo."
  },

  {
    id: "cassette",
    name: "Cassette perdido",
    rarity: "rare",
    description:
      "Una pieza especial de la colección musical."
  },

  {
    id: "special_room",
    name: "Habitación secreta",
    rarity: "epic",
    description:
      "Desbloquea una pequeña escena oculta."
  },

  {
    id: "special_outfit",
    name: "Outfit alternativo",
    rarity: "epic",
    description:
      "Una apariencia alternativa para tu personaje."
  },

  {
    id: "secret_song",
    name: "Canción secreta",
    rarity: "epic",
    description:
      "Desbloquea contenido musical oculto."
  },

  {
    id: "golden_seed",
    name: "Semilla dorada",
    rarity: "legendary",
    description:
      "Una pieza extremadamente rara de la colección."
  },

  {
    id: "city_secret",
    name: "Secreto de la ciudad",
    rarity: "legendary",
    description:
      "Desbloquea contenido especial del mundo."
  },

  {
    id: "ultimate_room",
    name: "La habitación imposible",
    rarity: "legendary",
    description:
      "Un espacio secreto que casi nadie encuentra."
  }

];

// ============================================================
// COLECCIÓN
// ============================================================

function getCollection() {
  try {
    return JSON.parse(
      localStorage.getItem(
        COLLECTION_KEY
      ) || "{}"
    );
  } catch {
    return {};
  }
}

function saveCollection(
  collection
) {
  localStorage.setItem(
    COLLECTION_KEY,
    JSON.stringify(collection)
  );
}

function addToCollection(item) {

  const collection =
    getCollection();

  if (!collection[item.id]) {

    collection[item.id] = {

      itemId: item.id,

      count: 0,

      firstObtained: Date.now()

    };

  }

  collection[item.id].count++;

  saveCollection(collection);
}

// ============================================================
// ELEGIR ITEM
// ============================================================

function getItemForRarity(
  rarity
) {

  const available =
    GACHA_ITEMS.filter(
      item =>
        item.rarity === rarity
    );

  if (!available.length) {
    return GACHA_ITEMS[0];
  }

  return available[
    Math.floor(
      Math.random() *
      available.length
    )
  ];
}

// ============================================================
// DUPLICADOS
// ============================================================

const DUPLICATE_VALUES = {

  common: 2,

  uncommon: 4,

  rare: 8,

  epic: 15,

  legendary: 40

};

// ============================================================
// UNA TIRADA
// ============================================================

function pullGacha() {

  const state =
    ensureGachaState();

  if (
    !spendSeeds(
      GACHA.singleCost,
      "tirada gacha"
    )
  ) {

    return {
      success: false,
      reason: "not_enough_seeds"
    };

  }

  const rarity =
    rollRarity(state);

  const item =
    getItemForRarity(rarity);

  const collection =
    getCollection();

  const duplicate =
    Boolean(collection[item.id]);

  addToCollection(item);

  state.totalPulls++;

  saveGachaState(state);

  let duplicateReward = 0;

  if (duplicate) {

    duplicateReward =
      DUPLICATE_VALUES[rarity];

    addSeeds(
      duplicateReward,
      "duplicado gacha"
    );

  }

  return {

    success: true,

    item,

    rarity,

    duplicate,

    duplicateReward,

    remainingSeeds:
      getSeeds()

  };

}

// ============================================================
// DIEZ TIRADAS
// ============================================================

function pullGachaTen() {
  if (!spendSeeds(GACHA.tenCost, "paquete de diez tiradas")) {
    return {success:false, reason:"not_enough_seeds"};
  }
  // Cada una de las 10 tiradas usa el mismo estado de pity y las mismas reglas
  // que una tirada individual, sin volver a cobrar las semillas.
  const results = [];
  for (let i = 0; i < 10; i++) {
    const state = ensureGachaState();
    const rarity = rollRarity(state);
    const item = getItemForRarity(rarity);
    const duplicate = Boolean(getCollection()[item.id]);
    addToCollection(item);
    state.totalPulls++;
    saveGachaState(state);
    const duplicateReward = duplicate ? DUPLICATE_VALUES[rarity] : 0;
    if (duplicateReward) addSeeds(duplicateReward, "duplicado gacha");
    results.push({success:true,item,rarity,duplicate,duplicateReward,remainingSeeds:getSeeds()});
  }
  return {success:true,results};
}

// ============================================================
// PULL GRATIS DIARIO
// ============================================================

function canUseDailyPull() {

  const today =
    new Date()
      .toISOString()
      .slice(0, 10);

  const last =
    localStorage.getItem(
      DAILY_KEY
    );

  return last !== today;
}

function useDailyPull() {

  if (!canUseDailyPull()) {

    return {

      success: false,

      reason:
        "already_used"

    };

  }

  localStorage.setItem(
    DAILY_KEY,
    new Date()
      .toISOString()
      .slice(0, 10)
  );

  const state =
    ensureGachaState();

  const rarity =
    rollRarity(state);

  const item =
    getItemForRarity(rarity);

  const collection =
    getCollection();

  const duplicate =
    Boolean(collection[item.id]);

  addToCollection(item);

  state.totalPulls++;

  saveGachaState(state);

  let duplicateReward = 0;

  if (duplicate) {

    duplicateReward =
      DUPLICATE_VALUES[rarity];

    addSeeds(
      duplicateReward,
      "duplicado gacha diario"
    );

  }

  return {

    success: true,

    item,

    rarity,

    duplicate,

    duplicateReward

  };

}

// ============================================================
// PITY
// ============================================================

function getPityInfo() {

  const state =
    ensureGachaState();

  return {

    rare: {
      current: state.pityRare,
      max: GACHA.pityRare
    },

    epic: {
      current: state.pityEpic,
      max: GACHA.pityEpic
    },

    legendary: {
      current: state.pityLegendary,
      max: GACHA.pityLegendary
    }

  };

}

// ============================================================
// INICIALIZACIÓN
// ============================================================

ensureGachaState();

// ============================================================
// API GLOBAL
// ============================================================

window.CitySeeds = {

  get: getSeeds,

  set: setSeeds,

  add: addSeeds,

  spend: spendSeeds,

  render: renderSeedCount,

  history: getSeedHistory,

  stats: getStats,

  gacha: {

    pull: pullGacha,

    pullTen: pullGachaTen,

    daily: useDailyPull,

    canDaily: canUseDailyPull,

    pity: getPityInfo,

    config: GACHA,

    rarities:
      GACHA_RARITIES,

    items:
      GACHA_ITEMS

  },

  collection: {

    get:
      getCollection,

    add:
      addToCollection

  }

};

// ============================================================
// PRIMER RENDER
// ============================================================

renderSeedCount();
// Mantener el contador actualizado si otra pestaña cambia el saldo.
window.addEventListener('storage', event => {
  if (event.key === SEED_KEY) { renderSeedCount(); emitSeedsChanged(); }
});
