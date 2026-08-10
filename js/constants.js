// js/constants.js
(function() {
  window.Survival = window.Survival || {};
  
  window.Survival.LEVEL_THRESHOLDS = [
    { level: 1, nextExp: 20, maxHp: 50, maxShield: 5 },
    { level: 2, nextExp: 180, maxHp: 70, maxShield: 10 },
    { level: 3, nextExp: 450, maxHp: 90, maxShield: 15 },
    { level: 4, nextExp: 7800, maxHp: 110, maxShield: 20 },
    { level: 5, nextExp: 174500, maxHp: 130, maxShield: 25 },
    { level: 6, nextExp: 840000, maxHp: 250, maxShield: 30 },
    { level: 7, nextExp: 2300000, maxHp: 300, maxShield: 35 },
    { level: 8, nextExp: 31500000, maxHp: 350, maxShield: 40 },
    { level: 9, nextExp: 800000000, maxHp: 450, maxShield: 50 },
    { level: 10, nextExp: 3000000000, maxHp: 1000, maxShield: 150 }
  ];

  window.Survival.COOLDOWN_TARGETS = {
    regen: 120,
    refill: 6,
    research: 50
  };

  window.Survival.ITEMS_METADATA = {
    snack: { name: "Snack 70g", subType: "Curativo", icon: "🍪", desc: "Alimento condensato zuccherino. Ripristina 5-7 Punti Vita.", weight: 2 },
    fluido: { name: "Fluido Energizzante", subType: "Curativo", icon: "🧪", desc: "Fluido rigenerante barriere. Ripristina interamente lo Scudo.", weight: 5 },
    caricatore: { name: "Caricatore - L1 K1", subType: "Ammo", icon: "🔋", desc: "Caricatore standard K1. Aggiunge 25-45 munizioni K1.", weight: 5 },
    scatola: { name: "Scatola di caricatori", subType: "Box", icon: "📦", desc: "Consumala per estrarre caricatori L1 K1 e munizioni.", weight: 20 },
    repair_suit: { name: "Riparatore Tuta - Classe C", subType: "Riparatore", icon: "🥼", desc: "Kit polimerico liquido. Ripristina 35-45 Dd alla Tuta Spaziale.", weight: 10 },
    repair_helmet: { name: "Riparatore Casco - Classe C", subType: "Riparatore", icon: "🪖", desc: "Spray pressurizzante. Ripristina 12-20 Dd al Casco.", weight: 10 },
    repair_boots: { name: "Riparatore Stivali - Classe C", subType: "Riparatore", icon: "🥾", desc: "Mastice ad alta gravità. Ripristina 2-5 Dd agli Stivali.", weight: 10 },
    repair_weapon: { name: "Riparatore Fucile - Classe C", subType: "Riparatore", icon: "🔫", desc: "Solvente lubrificante termico. Ripristina 15-25 Dd al Fucile.", weight: 15 },
    battery_c: { name: "Batteria classe C", subType: "Utility", icon: "⚡", desc: "Ripristina 2 punti alla funzione 'Cerca' (usabile in missione).", weight: 1 },
    box_battery_c: { name: "Confezione Batterie C", subType: "Box", icon: "📦", desc: "Se aperta, svela da 0 a 2 Batterie classe C.", weight: 3 },
    balloon: { name: "Pallone Sonda Aerostatico", subType: "Utility", icon: "🎈", desc: "Invia una sonda meteo in orbita. Assegna l'effetto temporaneo.", weight: 8 },
    meteo_a1: { name: "Meteo Terra - A1", subType: "Documento", icon: "📊", desc: "Rapporto statistico meteorologico per la zona A1.", weight: 1 },
    meteo_a2: { name: "Meteo Terra - A2", subType: "Documento", icon: "📊", desc: "Rapporto statistico meteorologico per la zona A2.", weight: 1 },
    meteo_a3: { name: "Meteo Terra - A3", subType: "Documento", icon: "📊", desc: "Rapporto statistico meteorologico per la zona A3.", weight: 1 }
  };

  window.Survival.STATUSES_METADATA = {
    "001": { id: "001", name: "Riposato", icon: "🏕️", maxDuration: 999 },
    "002": { id: "002", name: "Pallone sonda in viaggio", icon: "🎈", maxDuration: 8 },
    "003": { id: "003", name: "Gravitoni rallentati", icon: "🪇", maxDuration: 3 }
  };

  window.Survival.ZONE_DATA = {
    '0': { name: 'Nave Spaziale', startAliens: 0, reward: 0, multiplier: 0 },
    'A1': { name: 'Zona A1', startAliens: 20, reward: 100, multiplier: 1 },
    'A2': { name: 'Zona A2', startAliens: 50, reward: 250, multiplier: 1.5 },
    'A3': { name: 'Zona A3', startAliens: '65 + X', reward: 500, multiplier: 2 }
  };
})();
