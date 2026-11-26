// js/state.js
(function () {
  'use strict';

  var S = (window.Survival = window.Survival || {});

  var VALID_TABS = ['map', 'mission', 'ship', 'options'];
  var listeners = [];

  function toInt(val, fallback) {
    var fb = typeof fallback === 'number' && isFinite(fallback) ? Math.trunc(fallback) : 0;
    if (val === null || val === undefined || val === '' || typeof val === 'boolean') {
      return fb;
    }
    var n = Number(val);
    if (!isFinite(n)) {
      return fb;
    }
    return Math.trunc(n);
  }

  function clampInt(val, min, max, fallback) {
    var n = toInt(val, fallback !== undefined ? fallback : min);
    if (n < min) {
      return min;
    }
    if (n > max) {
      return max;
    }
    return n;
  }

  function randomInt(min, max) {
    var lo = toInt(min, 0);
    var hi = toInt(max, lo);
    if (hi < lo) {
      hi = lo;
    }
    return lo + Math.floor(Math.random() * (hi - lo + 1));
  }

  function formatNumber(val) {
    var n = toInt(val, 0);
    var sign = n < 0 ? '-' : '';
    var absStr = String(Math.abs(n));
    return sign + absStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function formatDuration(totalSeconds) {
    var sec = Math.max(0, toInt(totalSeconds, 0));
    var mins = Math.floor(sec / 60);
    var rem = sec % 60;
    return String(mins).padStart(2, '0') + ':' + String(rem).padStart(2, '0');
  }

  function getLevelData(level) {
    var lvl = clampInt(level, 1, S.MAX_LEVEL, 1);
    return S.LEVEL_THRESHOLDS[lvl - 1] || S.LEVEL_THRESHOLDS[0];
  }

  function getPlanet(planetId) {
    var id = planetId || (S.state && S.state.player ? S.state.player.planetId : 'earth');
    return S.PLANETS[id] || S.PLANETS.earth;
  }

  function makeEquipInstance(uid, modelId, dd) {
    var model = S.EQUIP_MODELS[modelId];
    if (!model) {
      return null;
    }
    var actualDd = dd === undefined || dd === null ? model.maxDd : clampInt(dd, 0, model.maxDd, model.maxDd);
    return {
      uid: String(uid),
      modelId: model.id,
      dd: actualDd
    };
  }

  function formatUid(num) {
    var n = Math.max(1, toInt(num, 1));
    var s = String(n);
    while (s.length < 4) {
      s = '0' + s;
    }
    return 'EQ-' + s;
  }

  function createEmptyMissionState() {
    return {
      active: false,
      selectedDifficulty: 0,
      planetId: null,
      turn: 0,
      aliensTotal: 0,
      aliensLeft: 0,
      completedReady: false,
      expGained: 0,
      shotsFired: 0,
      damageTaken: 0,
      levelsGained: 0,
      statuses: [],
      weather: null,
      lastShot: null
    };
  }

  function createInitialState() {
    var lv1 = getLevelData(1);
    return {
      saveVersion: S.SAVE_VERSION,
      player: {
        name: 'Esploratore',
        level: 1,
        exp: 0,
        hp: lv1.maxHp,
        shield: lv1.maxShield,
        credits: 100,
        liquids: 0,
        planetId: 'earth'
      },
      ui: {
        activeTab: 'ship'
      },
      mission: createEmptyMissionState(),
      backpack: {
        maxWeight: S.BACKPACK_DEFAULT_WEIGHT,
        ammo: 50,
        items: {
          snack_70g: 2,
          fluido_energizzante: 1
        }
      },
      cargo: {
        maxWeight: S.CARGO_DEFAULT_WEIGHT,
        ammo: 100,
        items: {
          chip_identita: 1
        }
      },
      equipment: {
        nextUid: 5,
        equipped: {
          helmet: makeEquipInstance(formatUid(1), 'helmet_simple', 50),
          suit: makeEquipInstance(formatUid(2), 'suit_simple', 100),
          boots: makeEquipInstance(formatUid(3), 'boots_simple', 15),
          rifle: makeEquipInstance(formatUid(4), 'rifle_simple', 25)
        },
        storage: []
      },
      globalScore: {
        activeKey: null,
        streak: 0
      },
      cooldowns: {
        regenReadyAt: 0,
        supplyReadyAt: 0
      },
      upgrades: {
        cargoLevel: 0
      },
      preferences: {
        lootColumns: 2
      },
      booksUnlocked: [],
      storyFlags: {},
      lastMissionRecap: null,
      pendingLoot: null,
      stats: {
        aliensKilled: 0,
        shotsFired: 0,
        deaths: 0,
        escapes: 0,
        regenUsed: 0,
        suppliesClaimed: 0,
        creditsEarned: 0,
        liquidsEarned: 0,
        missionsWon: {
          1: 0,
          2: 0,
          3: 0,
          4: 0
        }
      }
    };
  }

  function addItemToMap(map, itemId, qty) {
    var addQty = Math.max(0, toInt(qty, 0));
    if (!map || !S.ITEMS[itemId] || addQty <= 0) {
      return;
    }
    map[itemId] = Math.max(0, toInt(map[itemId], 0)) + addQty;
  }

  function removeItemFromMap(map, itemId, qty) {
    var remQty = Math.max(0, toInt(qty, 0));
    if (!map || remQty <= 0) {
      return 0;
    }
    var cur = Math.max(0, toInt(map[itemId], 0));
    var taken = Math.min(cur, remQty);
    var left = cur - taken;
    if (left > 0) {
      map[itemId] = left;
    } else {
      delete map[itemId];
    }
    return taken;
  }

  function addExp(amount) {
    var add = Math.max(0, toInt(amount, 0));
    if (S.state.player.level >= S.MAX_LEVEL || add <= 0) {
      if (S.state.player.level >= S.MAX_LEVEL) {
        S.state.player.exp = 0;
      }
      return {
        expAdded: 0,
        leveledUp: false,
        levelsGained: 0,
        newLevel: S.state.player.level
      };
    }

    S.state.player.exp += add;
    var levelsGained = 0;

    while (S.state.player.level < S.MAX_LEVEL) {
      var curLv = getLevelData(S.state.player.level);
      if (!curLv.nextExp || S.state.player.exp < curLv.nextExp) {
        break;
      }
      S.state.player.level += 1;
      S.state.player.exp = 0;
      var newLv = getLevelData(S.state.player.level);
      S.state.player.hp = newLv.maxHp;
      S.state.player.shield = newLv.maxShield;
      levelsGained += 1;
    }

    if (S.state.player.level >= S.MAX_LEVEL) {
      S.state.player.exp = 0;
    }

    return {
      expAdded: add,
      leveledUp: levelsGained > 0,
      levelsGained: levelsGained,
      newLevel: S.state.player.level
    };
  }

  function isMissionUnlocked(planetId, difficulty) {
    var planet = getPlanet(planetId);
    var mission = planet.missions ? planet.missions[String(difficulty)] || planet.missions[difficulty] : null;
    if (!mission) {
      return { unlocked: false, reason: 'Missione non disponibile' };
    }
    var rule = mission.unlock || { type: 'always', label: 'Sempre disponibile' };
    if (rule.type === 'always') {
      return { unlocked: true, reason: rule.label || 'Sempre disponibile' };
    }
    if (rule.type === 'level') {
      var req = toInt(rule.level, 1);
      var okLevel = S.state.player.level >= req;
      return {
        unlocked: okLevel,
        reason: rule.label || ('Richiede Livello ' + req)
      };
    }
    if (rule.type === 'story') {
      var flag = rule.flag;
      var okStory = Boolean(S.state.storyFlags && S.state.storyFlags[flag]);
      return {
        unlocked: okStory,
        reason: rule.label || 'Sblocca proseguendo nella storyline'
      };
    }
    return { unlocked: false, reason: 'Bloccata' };
  }

  function setActiveTab(tabId) {
    if (VALID_TABS.indexOf(tabId) === -1) {
      return { ok: false, message: 'Scheda non valida.' };
    }
    if (S.state.mission.active) {
      return { ok: false, message: 'Non puoi cambiare scheda mentre sei in missione.' };
    }
    S.state.ui.activeTab = tabId;
    if (tabId === 'ship') {
      S.state.mission.selectedDifficulty = 0;
    }
    notifyUI();
    return { ok: true };
  }

  function selectMission(difficulty, goToMissionTab) {
    if (S.state.mission.active) {
      return { ok: false, message: 'Completa prima la missione in corso.' };
    }
    var diff = toInt(difficulty, 0);
    if (diff === 0) {
      S.state.mission.selectedDifficulty = 0;
      notifyUI();
      return { ok: true };
    }
    var check = isMissionUnlocked(S.state.player.planetId, diff);
    if (!check.unlocked) {
      return { ok: false, message: check.reason };
    }
    S.state.mission.selectedDifficulty = diff;
    if (goToMissionTab) {
      S.state.ui.activeTab = 'mission';
    }
    notifyUI();
    return { ok: true };
  }

  function cancelSelectedMission(targetTab) {
    if (S.state.mission.active) {
      return { ok: false, message: 'Impossibile annullare una missione già iniziata.' };
    }
    S.state.mission.selectedDifficulty = 0;
    S.state.ui.activeTab = targetTab === 'map' ? 'map' : 'ship';
    notifyUI();
    return { ok: true };
  }

  function setLootColumnsPreference(cols) {
    var n = toInt(cols, 2);
    if (n !== 2 && n !== 3 && n !== 4) {
      return { ok: false, message: 'Numero liste non valido.' };
    }
    if (!S.state.preferences) {
      S.state.preferences = { lootColumns: 2 };
    }
    S.state.preferences.lootColumns = n;
    notifyUI();
    return { ok: true, lootColumns: n, message: 'Vista resoconto preferita impostata a ' + n + ' liste.' };
  }

  function onStateChange(fn) {
    if (typeof fn === 'function') {
      listeners.push(fn);
    }
  }

  function notifyUI() {
    var i;
    for (i = 0; i < listeners.length; i += 1) {
      listeners[i](S.state);
    }
  }

  S.state = createInitialState();
  S.toInt = toInt;
  S.clampInt = clampInt;
  S.randomInt = randomInt;
  S.formatNumber = formatNumber;
  S.formatDuration = formatDuration;
  S.getLevelData = getLevelData;
  S.getPlanet = getPlanet;
  S.makeEquipInstance = makeEquipInstance;
  S.formatUid = formatUid;
  S.createEmptyMissionState = createEmptyMissionState;
  S.createInitialState = createInitialState;
  S.addItemToMap = addItemToMap;
  S.removeItemFromMap = removeItemFromMap;
  S.addExp = addExp;
  S.isMissionUnlocked = isMissionUnlocked;
  S.setActiveTab = setActiveTab;
  S.selectMission = selectMission;
  S.cancelSelectedMission = cancelSelectedMission;
  S.setLootColumnsPreference = setLootColumnsPreference;
  S.onStateChange = onStateChange;
  S.notifyUI = notifyUI;
})();
