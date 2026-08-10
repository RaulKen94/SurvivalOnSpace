// js/state.js
(function() {
  window.Survival = window.Survival || {};
  const S = window.Survival;
  
  S.state = {
    level: 1,
    exp: 0,
    credits: 0,
    liquidoPlusvalente: 0,
    compostoOrganico: 0,
    frammenti: 0,
    bullets: 300,
    hp: 50,
    shield: 5,
    selectedZone: '0',
    inMission: false,
    aliens: { A1: 20, A2: 50, A3: '65 + X' },
    
    inventory: {
      snack: 3, fluido: 0, caricatore: 0, scatola: 0,
      repair_suit: 0, repair_helmet: 0, repair_boots: 0, repair_weapon: 0,
      battery_c: 0, box_battery_c: 0, balloon: 0,
      meteo_a1: 0, meteo_a2: 0, meteo_a3: 0
    },
    
    stiva: {
      snack: 0, fluido: 0, caricatore: 0, scatola: 0,
      repair_suit: 0, repair_helmet: 0, repair_boots: 0, repair_weapon: 0,
      bullets: 0, battery_c: 0, box_battery_c: 0,
      balloon: 0, meteo_a1: 0, meteo_a2: 0, meteo_a3: 0
    },
    
    excessItems: {
      snack: 0, fluido: 0, caricatore: 0, scatola: 0,
      repair_suit: 0, repair_helmet: 0, repair_boots: 0, repair_weapon: 0,
      battery_c: 0, box_battery_c: 0, balloon: 0,
      meteo_a1: 0, meteo_a2: 0, meteo_a3: 0
    },
    
    excessKept: {
      snack: 0, fluido: 0, caricatore: 0, scatola: 0,
      repair_suit: 0, repair_helmet: 0, repair_boots: 0, repair_weapon: 0,
      battery_c: 0, box_battery_c: 0, balloon: 0,
      meteo_a1: 0, meteo_a2: 0, meteo_a3: 0
    },
    
    backpackOrder: ['snack', 'fluido', 'caricatore', 'scatola', 'repair_suit', 'repair_helmet', 'repair_boots', 'repair_weapon', 'battery_c', 'box_battery_c', 'balloon', 'meteo_a1', 'meteo_a2', 'meteo_a3'],
    stivaOrder: ['snack', 'fluido', 'caricatore', 'scatola', 'repair_suit', 'repair_helmet', 'repair_boots', 'repair_weapon', 'battery_c', 'box_battery_c', 'balloon', 'meteo_a1', 'meteo_a2', 'meteo_a3'],
    
    pockets: {
      p1: { id: "01", name: "Tasca superiore sx", slots: 1, grade: "C", item: null, targetType: "Curativo", effectDesc: "+1 HP/Scudo curato" },
      p2: { id: "02", name: "Tasca superiore dx", slots: 1, grade: "C", item: null, targetType: "Riparatore", effectDesc: "+2 Dd ripristinati" }
    },

    equipment: {
      helmet: { name: "Casco Spaziale Semplice", val: 50, max: 50, icon: "🟡" },
      suit: { name: "Tuta Spaziale Semplice", val: 100, max: 100, icon: "🔵" },
      boots: { name: "Stivali Spaziali Semplici", val: 20, max: 20, icon: "🟣" },
      weapon: { name: "Fucile Spaziale Semplice", val: 100, max: 100, icon: "⚫" }
    },
    
    unlockedBooks: { snackCap1: false, repairCap1: false, rifleCap1: false },
    researchProgress: 0,
    techUnlocked: false,
    consecutiveStreak: { zone: null, count: 0 },
    
    synthesis: {
      grid: Array(9).fill(null),
      keychainSlots: 0,
      keychain: Array(3).fill(null),
      selectedGrid: [],
      selectedKeychain: []
    },

    city: {
      currentLocation: 'piazza',
      lustrascarpeActive: false,
      emporioFluidiRiscattati: false,
      visits: { lustrascarpe: 0, emporio: 0, stazione: 0, osservatorio: 0 }
    },

    statuses: [],
    usedRegenSinceLastMission: false,

    activeMission: {
      zone: null,
      initialAliens: 0,
      aliensRemaining: 0,
      aliensKilled: 0,
      expGained: 0,
      weatherId: null,
      weatherName: "",
      weatherIcon: "",
      explorationLoot: { snack: 0, fluido: 0, caricatore: 0, scatola: 0, repair_suit: 0, repair_helmet: 0, repair_boots: 0, repair_weapon: 0, premium: 0, composto: 0, credits: 0, battery_c: 0, box_battery_c: 0, balloon: 0, meteo_a1: 0, meteo_a2: 0, meteo_a3: 0 },
      endMissionDrops: { snack: 0, fluido: 0, caricatore: 0, scatola: 0, repair_suit: 0, repair_helmet: 0, repair_boots: 0, repair_weapon: 0, premium: 0, battery_c: 0, book1: 0, book2: 0, book3: 0 },
      recapTriggered: false,
      lastUsedItem: null,
      lastUsedQty: 0,
      explorationsCount: 0,
      exploreState: 'none',
      searchCharges: 0,
      lastExploreStatus: "-",
      lastExploreResult: "-",
      pendingChoices: []
    },
    
    cooldowns: {
      regen: { start: 0, rate: 1, target: 120 },
      refill: { start: 0, rate: 1, target: 6 },
      research: { start: 0, rate: 1, target: 50 }
    },
    
    lastMissionStats: null,
    
    stats: {
      shotsFired: 0,
      missionsA1: 0,
      missionsA2: 0,
      missionsA3: 0,
      globalScores: 0,
      creditsEarned: 0,
      consumablesGained: 0,
      consumablesUsed: 0,
      booksDropped: 0,
      tabVisitsMappa: 1,
      tabVisitsMissione: 0,
      tabVisitsCasa: 0,
      tabVisitsOpzioni: 0,
      statViews: 0,
      researchStarted: 0,
      missionInfoViews: 0,
      regenUsed: 0,
      refillUsed: 0,
      compostoGained: 0,
      ddLostHelmet: 0,
      ddLostSuit: 0,
      ddLostBoots: 0,
      ddLostWeapon: 0,
      ddRestored: 0,
      keysCreated: 0,
      chestsCreated: 0,
      fusionsMade: 0,
      fragmentsObtained: 0,
      pocketsAssigned: 0,
      cityVisits: 0
    }
  };

  // Variabili globali di UI (non nello stato)
  S.activeTab = 'mappa';
  S.longPressTimer = null;
  S.isLongPress = false;
  S.longPressActive = false;
  S.activeModalItem = null;
  S.selectedModalQty = 1;
  S.transferModeActive = false;
  S.layoutModeActive = false;
  S.activeTransferItem = null;
  S.activeTransferSource = null;
  S.selectedTransferQty = 1;
  S.emporioDest = 'zaino';
  S.cityExpanded = false;
})();
