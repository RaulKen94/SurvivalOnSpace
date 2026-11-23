// js/config.js
(function () {
  'use strict';

  window.Survival = window.Survival || {};

  window.Survival.SAVE_VERSION = 1;
  window.Survival.SAVE_PREFIX = 'SOS1';
  window.Survival.MAX_LEVEL = 30;
  window.Survival.GLOBAL_SCORE_TARGET = 10;

  window.Survival.COOLDOWN_TARGETS = {
    regen: 120,
    supply: 240
  };

  window.Survival.BACKPACK_DEFAULT_WEIGHT = 500;
  window.Survival.CARGO_DEFAULT_WEIGHT = 200;
  window.Survival.CARGO_UPGRADE_STEP = 100;
  window.Survival.AMMO_WEIGHT = 1;

  window.Survival.CARGO_UPGRADE_COSTS = [150, 300, 550, 900, 1400, 2100, 3000, 4200, 5800, 8000];

  window.Survival.SUPPLY_CAPSULE_CONFIG = {
    ammoMin: 25,
    ammoMax: 40,
    minFreeWeightRequired: 20,
    bonusPool: [
      { id: 'snack_70g', weight: 60 },
      { id: 'fluido_energizzante', weight: 30 },
      { id: 'medikit', weight: 10 }
    ]
  };

  window.Survival.COMBAT_RULES = {
    expPerAlien: 1,
    escapeRollTarget: 18,
    escapeExpLossPct: 30,
    deathExpLossPct: 75,
    deathCreditsLossPct: 50,
    deathRespawnHp: 5,
    deathRespawnShield: 0
  };

  window.Survival.LEVEL_THRESHOLDS = [
    { level: 1, nextExp: 15, maxHp: 10, maxShield: 5 },
    { level: 2, nextExp: 40, maxHp: 15, maxShield: 10 },
    { level: 3, nextExp: 85, maxHp: 20, maxShield: 15 },
    { level: 4, nextExp: 160, maxHp: 25, maxShield: 20 },
    { level: 5, nextExp: 300, maxHp: 30, maxShield: 25 },
    { level: 6, nextExp: 550, maxHp: 36, maxShield: 33 },
    { level: 7, nextExp: 950, maxHp: 42, maxShield: 41 },
    { level: 8, nextExp: 1600, maxHp: 48, maxShield: 49 },
    { level: 9, nextExp: 2700, maxHp: 54, maxShield: 57 },
    { level: 10, nextExp: 4500, maxHp: 60, maxShield: 65 },
    { level: 11, nextExp: 7500, maxHp: 66, maxShield: 75 },
    { level: 12, nextExp: 12500, maxHp: 72, maxShield: 85 },
    { level: 13, nextExp: 21000, maxHp: 78, maxShield: 95 },
    { level: 14, nextExp: 35000, maxHp: 84, maxShield: 105 },
    { level: 15, nextExp: 60000, maxHp: 90, maxShield: 115 },
    { level: 16, nextExp: 120000, maxHp: 97, maxShield: 129 },
    { level: 17, nextExp: 250000, maxHp: 104, maxShield: 143 },
    { level: 18, nextExp: 550000, maxHp: 111, maxShield: 157 },
    { level: 19, nextExp: 1200000, maxHp: 118, maxShield: 171 },
    { level: 20, nextExp: 2800000, maxHp: 125, maxShield: 185 },
    { level: 21, nextExp: 6500000, maxHp: 132, maxShield: 200 },
    { level: 22, nextExp: 15000000, maxHp: 139, maxShield: 215 },
    { level: 23, nextExp: 35000000, maxHp: 146, maxShield: 230 },
    { level: 24, nextExp: 85000000, maxHp: 153, maxShield: 245 },
    { level: 25, nextExp: 200000000, maxHp: 160, maxShield: 260 },
    { level: 26, nextExp: 450000000, maxHp: 168, maxShield: 278 },
    { level: 27, nextExp: 1000000000, maxHp: 176, maxShield: 296 },
    { level: 28, nextExp: 2200000000, maxHp: 184, maxShield: 314 },
    { level: 29, nextExp: 5000000000, maxHp: 192, maxShield: 332 },
    { level: 30, nextExp: null, maxHp: 200, maxShield: 350 }
  ];

  window.Survival.EQUIP_SLOTS = {
    helmet: {
      id: 'helmet',
      label: 'Casco Spaziale',
      role: 'vs Meteo',
      cssClass: 'equip-helmet',
      colorHex: '#f5c542'
    },
    suit: {
      id: 'suit',
      label: 'Tuta Spaziale',
      role: 'vs Danni',
      cssClass: 'equip-suit',
      colorHex: '#7eeeff'
    },
    boots: {
      id: 'boots',
      label: 'Stivali Spaziali',
      role: 'Esplorazione Pianeta',
      cssClass: 'equip-boots',
      colorHex: '#b86bff'
    },
    rifle: {
      id: 'rifle',
      label: 'Fucile Spaziale',
      role: 'vs Alieni Mutati',
      cssClass: 'equip-rifle',
      colorHex: '#090d14'
    }
  };

  window.Survival.EQUIP_MODELS = {
    helmet_simple: {
      id: 'helmet_simple',
      name: 'Casco Spaziale Semplice',
      slot: 'helmet',
      tier: 'simple',
      score: 1,
      maxDd: 50,
      sellPrice: 25,
      description: 'Casco standard di bordo contro le anomalie meteorologiche.'
    },
    suit_simple: {
      id: 'suit_simple',
      name: 'Tuta Spaziale Semplice',
      slot: 'suit',
      tier: 'simple',
      score: 1,
      maxDd: 100,
      sellPrice: 30,
      description: 'Riduce di 1 fisso i danni subiti in missione.'
    },
    boots_simple: {
      id: 'boots_simple',
      name: 'Stivali Spaziali Semplici',
      slot: 'boots',
      tier: 'simple',
      score: 1,
      maxDd: 15,
      sellPrice: 20,
      description: 'Calzature base per muoversi tra le location del pianeta.'
    },
    rifle_simple: {
      id: 'rifle_simple',
      name: 'Fucile Spaziale Semplice',
      slot: 'rifle',
      tier: 'simple',
      score: 1,
      maxDd: 25,
      sellPrice: 35,
      description: 'Arma standard in dotazione contro la fauna ostile.'
    },
    helmet_advanced: {
      id: 'helmet_advanced',
      name: 'Casco Spaziale Avanzato',
      slot: 'helmet',
      tier: 'advanced',
      score: 2,
      maxDd: 80,
      sellPrice: 70,
      description: 'Schermatura potenziata per resistere a eventi meteo severi.'
    },
    suit_advanced: {
      id: 'suit_advanced',
      name: 'Tuta Spaziale Avanzata',
      slot: 'suit',
      tier: 'advanced',
      score: 2,
      maxDd: 150,
      sellPrice: 80,
      description: 'Riduce di 2 fissi i danni subiti in missione.'
    },
    boots_advanced: {
      id: 'boots_advanced',
      name: 'Stivali Spaziali Avanzati',
      slot: 'boots',
      tier: 'advanced',
      score: 2,
      maxDd: 25,
      sellPrice: 60,
      description: 'Suole rinforzate ad alta durata per lunghe esplorazioni.'
    },
    rifle_advanced: {
      id: 'rifle_advanced',
      name: 'Fucile Spaziale Avanzato',
      slot: 'rifle',
      tier: 'advanced',
      score: 2,
      maxDd: 45,
      sellPrice: 90,
      description: 'Potenza di fuoco maggiorata efficace contro Alieni Mutati.'
    }
  };

  var ITEMS = {
    snack_70g: {
      id: 'snack_70g',
      name: 'Snack 70g',
      category: 'consumable',
      weight: 5,
      description: 'Ripristina 5 punti Vita.',
      effect: { type: 'heal_flat', value: 5 }
    },
    medikit: {
      id: 'medikit',
      name: 'Medikit',
      category: 'consumable',
      weight: 20,
      description: 'Ripristina il 75% della Vita massima.',
      effect: { type: 'heal_pct', value: 75 }
    },
    fluido_energizzante: {
      id: 'fluido_energizzante',
      name: 'Fluido Energizzante',
      category: 'consumable',
      weight: 10,
      description: 'Ripristina 10 punti Scudo.',
      effect: { type: 'shield_flat', value: 10 }
    },
    caricatore_std: {
      id: 'caricatore_std',
      name: 'Caricatore Standard (x30)',
      category: 'ammo',
      weight: 30,
      description: 'Fornisce 30 Munizioni Standard pronte all\'uso.',
      effect: { type: 'add_ammo', value: 30 }
    },
    chip_identita: {
      id: 'chip_identita',
      name: 'Chip Cambio Identità',
      category: 'special',
      weight: 0,
      description: 'Consente di modificare il nome del personaggio nelle Opzioni.',
      effect: { type: 'rename_token' }
    }
  };

  (function registerRepairItems() {
    var repairTargets = [
      { key: 'helmet', label: 'Casco Spaziale' },
      { key: 'suit', label: 'Tuta Spaziale' },
      { key: 'boots', label: 'Stivali Spaziali' },
      { key: 'rifle', label: 'Fucile Spaziale' },
      { key: 'any', label: 'Universale' }
    ];

    var repairClasses = [
      { code: 'c', label: 'C', weight: 8, value: 25, bootsValue: 3, full: false },
      { code: 'b', label: 'B', weight: 15, value: 45, bootsValue: 6, full: false },
      { code: 'a', label: 'A', weight: 25, value: 75, bootsValue: 9, full: false },
      { code: 's', label: 'S', weight: 40, value: null, bootsValue: null, full: true }
    ];

    var i, j, target, cls, itemId, desc;
    for (i = 0; i < repairTargets.length; i += 1) {
      target = repairTargets[i];
      for (j = 0; j < repairClasses.length; j += 1) {
        cls = repairClasses[j];
        itemId = 'rep_' + target.key + '_' + cls.code;

        if (cls.full) {
          desc = target.key === 'any'
            ? 'Ripristina al 100% la Dd di qualsiasi equipaggiamento.'
            : 'Ripristina al 100% la Dd (' + target.label + ').';
        } else if (target.key === 'boots') {
          desc = 'Ripristina +' + cls.bootsValue + ' Dd sugli Stivali Spaziali.';
        } else if (target.key === 'any') {
          desc = 'Ripristina +' + cls.value + ' Dd (+' + cls.bootsValue + ' sugli Stivali) su qualsiasi equipaggiamento.';
        } else {
          desc = 'Ripristina +' + cls.value + ' Dd (' + target.label + ').';
        }

        ITEMS[itemId] = {
          id: itemId,
          name: 'Riparatore ' + target.label + ' Classe ' + cls.label,
          category: 'repair',
          weight: cls.weight,
          description: desc,
          effect: cls.full
            ? { type: 'repair_full', targetSlot: target.key }
            : {
                type: 'repair',
                targetSlot: target.key,
                value: target.key === 'boots' ? cls.bootsValue : cls.value,
                bootsValue: cls.bootsValue
              }
        };
      }
    }
  })();

  window.Survival.ITEMS = ITEMS;

  window.Survival.PLANETS = {
    earth: {
      id: 'earth',
      name: 'Terra',
      subtitle: 'Settore Orbitale Alpha-01',
      description: 'Pianeta madre contaminato da frammenti alieni. Punto di partenza della spedizione.',
      locations: [
        {
          id: 'meccanico_spaziale',
          name: 'Meccanico Spaziale',
          tag: 'Viaggi & Rotte',
          description: 'Consente di preparare la Nave Spaziale per i viaggi interplanetari verso nuovi pianeti e satelliti.'
        },
        {
          id: 'centro_ricerca_meteo',
          name: 'Centro di Ricerca Meteo',
          tag: 'Analisi Ambientale',
          description: 'Archivio scientifico per consultare gli effetti e i modificatori di ciascun evento meteorologico.'
        }
      ],
      missions: {
        1: {
          difficulty: 1,
          name: 'Periferia Contaminata',
          description: 'Settore a bassa intensità. Ideale per raccogliere rifornimenti e fare esperienza.',
          unlock: { type: 'always', label: 'Sempre disponibile' },
          aliensMin: 12,
          aliensMax: 12,
          enemyDamage: 2,
          creditsReward: 35,
          globalScoreReward: { liquids: 1, credits: 100 },
          features: [],
          dropTable: [
            { kind: 'item', id: 'snack_70g', chance: 60, qty: 1 },
            { kind: 'item', id: 'fluido_energizzante', chance: 35, qty: 1 },
            { kind: 'item', id: 'caricatore_std', chance: 25, qty: 1 },
            { kind: 'item', id: 'medikit', chance: 10, qty: 1 },
            { kind: 'item', id: 'rep_suit_c', chance: 15, qty: 1 },
            { kind: 'item', id: 'rep_helmet_c', chance: 10, qty: 1 },
            { kind: 'item', id: 'rep_boots_c', chance: 10, qty: 1 },
            { kind: 'item', id: 'rep_rifle_c', chance: 10, qty: 1 },
            { kind: 'equip', id: 'suit_advanced', chance: 1, qty: 1 }
          ]
        },
        2: {
          difficulty: 2,
          name: 'Settore Tempesta',
          description: 'Zona esposta a fenomeni meteorologici attivi. Richiede attenzione al Casco Spaziale.',
          unlock: { type: 'level', level: 2, label: 'Richiede Livello 2' },
          aliensMin: 15,
          aliensMax: 25,
          enemyDamage: 3,
          creditsReward: 75,
          globalScoreReward: { liquids: 2, credits: 250 },
          features: ['weather'],
          dropTable: []
        },
        3: {
          difficulty: 3,
          name: 'Zona Quarantena',
          description: 'Presenza confermata di Alieni Mutati sotto condizioni meteo variabili.',
          unlock: { type: 'level', level: 5, label: 'Richiede Livello 5' },
          aliensMin: 30,
          aliensMax: 70,
          enemyDamage: 5,
          creditsReward: 160,
          globalScoreReward: { liquids: 4, credits: 600 },
          features: ['weather', 'mutants'],
          dropTable: []
        },
        4: {
          difficulty: 4,
          name: 'Nido del Leviatano',
          description: 'Assalto finale al Boss planetario tra ondate intense, meteo e mutazioni.',
          unlock: { type: 'story', flag: 'earth_diff4_unlocked', label: 'Sblocca proseguendo nella storyline' },
          aliensMin: 100,
          aliensMax: 180,
          enemyDamage: 8,
          creditsReward: 400,
          globalScoreReward: { liquids: 10, credits: 1500 },
          features: ['weather', 'mutants', 'boss'],
          dropTable: []
        }
      }
    }
  };
})();
