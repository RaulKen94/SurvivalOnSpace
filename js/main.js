// js/main.js
(function () {
  'use strict';

  var S = (window.Survival = window.Survival || {});

  var VALID_TABS = ['map', 'mission', 'ship', 'options'];
  var BASE62_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
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

  function getItemWeight(itemId) {
    var def = S.ITEMS[itemId];
    return def ? toInt(def.weight, 0) : 0;
  }

  function getItemsWeight(itemsMap) {
    var total = 0;
    var key, qty;
    if (!itemsMap || typeof itemsMap !== 'object') {
      return 0;
    }
    for (key in itemsMap) {
      if (Object.prototype.hasOwnProperty.call(itemsMap, key) && S.ITEMS[key]) {
        qty = Math.max(0, toInt(itemsMap[key], 0));
        total += getItemWeight(key) * qty;
      }
    }
    return total;
  }

  function getBackpackItemsWeight() {
    return getItemsWeight(S.state.backpack.items);
  }

  function getBackpackAmmoWeight() {
    return Math.max(0, toInt(S.state.backpack.ammo, 0)) * S.AMMO_WEIGHT;
  }

  function getBackpackTotalWeight() {
    return getBackpackItemsWeight() + getBackpackAmmoWeight();
  }

  function getBackpackFreeWeight() {
    return Math.max(0, S.state.backpack.maxWeight - getBackpackTotalWeight());
  }

  function getCargoMaxWeight() {
    var level = Math.max(0, toInt(S.state.upgrades.cargoLevel, 0));
    return S.CARGO_DEFAULT_WEIGHT + level * S.CARGO_UPGRADE_STEP;
  }

  function getCargoItemsWeight() {
    return getItemsWeight(S.state.cargo.items);
  }

  function getCargoFreeWeight() {
    return Math.max(0, getCargoMaxWeight() - getCargoItemsWeight());
  }

  function getCargoUpgradeInfo() {
    var lvl = Math.max(0, toInt(S.state.upgrades.cargoLevel, 0));
    var costs = S.CARGO_UPGRADE_COSTS || [];
    var maxLevel = costs.length;
    var isMaxed = lvl >= maxLevel;
    var currentMax = getCargoMaxWeight();
    return {
      level: lvl,
      maxLevel: maxLevel,
      isMaxed: isMaxed,
      nextCost: isMaxed ? null : toInt(costs[lvl], 0),
      currentMaxWeight: currentMax,
      nextMaxWeight: isMaxed ? currentMax : currentMax + S.CARGO_UPGRADE_STEP
    };
  }

  function getCooldownRemaining(kind) {
    var readyAt = 0;
    if (kind === 'regen') {
      readyAt = toInt(S.state.cooldowns.regenReadyAt, 0);
    } else if (kind === 'supply') {
      readyAt = toInt(S.state.cooldowns.supplyReadyAt, 0);
    }
    var diffMs = readyAt - Date.now();
    if (diffMs <= 0) {
      return 0;
    }
    return Math.ceil(diffMs / 1000);
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

  function getRenameTokenCount() {
    var cargoCount = Math.max(0, toInt(S.state.cargo.items.chip_identita, 0));
    var packCount = Math.max(0, toInt(S.state.backpack.items.chip_identita, 0));
    return cargoCount + packCount;
  }

  function hasRenameToken() {
    return getRenameTokenCount() > 0;
  }

  function renamePlayer(newName) {
    if (S.state.mission.active) {
      return { ok: false, message: 'Non puoi cambiare nome durante una missione.' };
    }
    var clean = String(newName === undefined || newName === null ? '' : newName)
      .trim()
      .replace(/\s+/g, ' ');
    if (clean.length < 2 || clean.length > 20) {
      return { ok: false, message: 'Il nome deve contenere tra 2 e 20 caratteri.' };
    }
    if (toInt(S.state.cargo.items.chip_identita, 0) > 0) {
      removeItemFromMap(S.state.cargo.items, 'chip_identita', 1);
    } else if (toInt(S.state.backpack.items.chip_identita, 0) > 0) {
      removeItemFromMap(S.state.backpack.items, 'chip_identita', 1);
    } else {
      return {
        ok: false,
        message: 'Nessun Chip Cambio Identità disponibile nella Stiva o nello Zaino.'
      };
    }
    S.state.player.name = clean;
    notifyUI();
    return { ok: true, message: 'Identità aggiornata: ' + clean };
  }

  // --- Step 2: Funzionalità Nave Spaziale, Inventario & Armeria ---

  function useRegenChamber() {
    if (S.state.mission.active) {
      return { ok: false, message: 'Non puoi usare la Camera di Rigenerazione in missione.' };
    }
    var rem = getCooldownRemaining('regen');
    if (rem > 0) {
      return { ok: false, message: 'Camera di Rigenerazione in ricarica (' + formatDuration(rem) + ').' };
    }
    var lv = getLevelData(S.state.player.level);
    if (S.state.player.hp >= lv.maxHp && S.state.player.shield >= lv.maxShield) {
      return { ok: false, message: 'Vita e Scudo sono già al massimo.' };
    }
    S.state.player.hp = lv.maxHp;
    S.state.player.shield = lv.maxShield;
    S.state.cooldowns.regenReadyAt = Date.now() + S.COOLDOWN_TARGETS.regen * 1000;
    S.state.stats.regenUsed += 1;
    notifyUI();
    return { ok: true, message: 'Rigenerazione completata: Vita e Scudo ripristinati al 100%.' };
  }

  function pickSupplyBonusItem() {
    var pool = (S.SUPPLY_CAPSULE_CONFIG && S.SUPPLY_CAPSULE_CONFIG.bonusPool) || [];
    var totalWeight = 0;
    var i;
    for (i = 0; i < pool.length; i += 1) {
      totalWeight += toInt(pool[i].weight, 0);
    }
    if (totalWeight <= 0) {
      return 'snack_70g';
    }
    var roll = randomInt(1, totalWeight);
    var acc = 0;
    for (i = 0; i < pool.length; i += 1) {
      acc += toInt(pool[i].weight, 0);
      if (roll <= acc) {
        return pool[i].id;
      }
    }
    return pool[0].id;
  }

  function claimSupplyCapsule() {
    if (S.state.mission.active) {
      return { ok: false, message: 'Non puoi aprire la Capsula Rifornimenti durante una missione.' };
    }
    var rem = getCooldownRemaining('supply');
    if (rem > 0) {
      return { ok: false, message: 'Capsula Rifornimenti in ricarica (' + formatDuration(rem) + ').' };
    }
    var cfg = S.SUPPLY_CAPSULE_CONFIG;
    if (getBackpackFreeWeight() < cfg.minFreeWeightRequired && getCargoFreeWeight() < cfg.minFreeWeightRequired) {
      return {
        ok: false,
        message: 'Libera almeno ' + cfg.minFreeWeightRequired + ' pt. nello Zaino o nella Stiva prima di aprire la capsula.'
      };
    }

    var ammo = randomInt(cfg.ammoMin, cfg.ammoMax);
    var itemId = pickSupplyBonusItem();
    var itemDef = S.ITEMS[itemId];
    var destLabel = 'Stiva';

    S.state.cargo.ammo += ammo;

    if (itemDef) {
      if (getBackpackFreeWeight() >= itemDef.weight) {
        addItemToMap(S.state.backpack.items, itemId, 1);
        destLabel = 'Zaino';
      } else if (getCargoFreeWeight() >= itemDef.weight) {
        addItemToMap(S.state.cargo.items, itemId, 1);
        destLabel = 'Stiva';
      }
    }

    S.state.cooldowns.supplyReadyAt = Date.now() + S.COOLDOWN_TARGETS.supply * 1000;
    S.state.stats.suppliesClaimed += 1;
    notifyUI();

    return {
      ok: true,
      ammo: ammo,
      itemId: itemId,
      itemName: itemDef ? itemDef.name : itemId,
      destination: destLabel,
      message: 'Capsula ricevuta: +' + ammo + ' Munizioni (in Stiva) e 1× ' + (itemDef ? itemDef.name : itemId) + ' (in ' + destLabel + ').'
    };
  }

  function transferAmmo(direction, amount) {
    if (S.state.mission.active) {
      return { ok: false, message: 'Non puoi spostare munizioni durante una missione.' };
    }
    var qty = 0;
    if (direction === 'toBackpack') {
      var cargoAvail = Math.max(0, toInt(S.state.cargo.ammo, 0));
      if (cargoAvail <= 0) {
        return { ok: false, message: 'Nessuna munizione disponibile in Stiva.' };
      }
      var maxByWeight = Math.floor(getBackpackFreeWeight() / S.AMMO_WEIGHT);
      if (maxByWeight <= 0) {
        return { ok: false, message: 'Zaino pieno: nessun peso disponibile.' };
      }
      var wantedBp = amount === 'max' ? Math.min(cargoAvail, maxByWeight) : toInt(amount, 0);
      qty = Math.min(wantedBp, cargoAvail, maxByWeight);
      if (qty <= 0) {
        return { ok: false, message: 'Quantità non valida.' };
      }
      S.state.cargo.ammo -= qty;
      S.state.backpack.ammo += qty;
      notifyUI();
      return { ok: true, qty: qty, message: 'Trasferite +' + formatNumber(qty) + ' munizioni nello Zaino.' };
    }

    if (direction === 'toCargo') {
      var bpAvail = Math.max(0, toInt(S.state.backpack.ammo, 0));
      if (bpAvail <= 0) {
        return { ok: false, message: 'Nessuna munizione nello Zaino.' };
      }
      var wantedCargo = amount === 'max' ? bpAvail : toInt(amount, 0);
      qty = Math.min(wantedCargo, bpAvail);
      if (qty <= 0) {
        return { ok: false, message: 'Quantità non valida.' };
      }
      S.state.backpack.ammo -= qty;
      S.state.cargo.ammo += qty;
      notifyUI();
      return { ok: true, qty: qty, message: 'Depositate ' + formatNumber(qty) + ' munizioni nella Stiva.' };
    }

    return { ok: false, message: 'Direzione trasferimento non valida.' };
  }

  function transferItem(itemId, direction, qty) {
    if (S.state.mission.active) {
      return { ok: false, message: 'Non puoi spostare oggetti tra Zaino e Stiva durante una missione.' };
    }
    var def = S.ITEMS[itemId];
    if (!def) {
      return { ok: false, message: 'Oggetto sconosciuto.' };
    }
    var isToBackpack = direction === 'toBackpack';
    if (!isToBackpack && direction !== 'toCargo') {
      return { ok: false, message: 'Direzione trasferimento non valida.' };
    }

    var srcMap = isToBackpack ? S.state.cargo.items : S.state.backpack.items;
    var dstMap = isToBackpack ? S.state.backpack.items : S.state.cargo.items;
    var avail = Math.max(0, toInt(srcMap[itemId], 0));
    if (avail <= 0) {
      return { ok: false, message: 'Oggetto non disponibile nella sorgente.' };
    }

    var wanted = qty === 'all' ? avail : Math.max(1, toInt(qty, 1));
    var freeW = isToBackpack ? getBackpackFreeWeight() : getCargoFreeWeight();
    var maxFit = def.weight === 0 ? avail : Math.floor(freeW / def.weight);
    var actual = Math.min(avail, wanted, maxFit);

    if (actual <= 0) {
      return {
        ok: false,
        message: (isToBackpack ? 'Zaino' : 'Stiva') + ' troppo piena per spostare ' + def.name + ' (' + def.weight + ' pt.).'
      };
    }

    removeItemFromMap(srcMap, itemId, actual);
    addItemToMap(dstMap, itemId, actual);
    notifyUI();
    return {
      ok: true,
      qty: actual,
      message: 'Spostato ' + actual + '× ' + def.name + ' in ' + (isToBackpack ? 'Zaino' : 'Stiva') + '.'
    };
  }

  function getRepairTargetsForItem(itemId) {
    var def = S.ITEMS[itemId];
    if (!def || !def.effect || (def.effect.type !== 'repair' && def.effect.type !== 'repair_full')) {
      return [];
    }
    var targetSlot = def.effect.targetSlot;
    var targets = [];

    function maybePush(inst, location) {
      if (!inst) {
        return;
      }
      var model = S.EQUIP_MODELS[inst.modelId];
      if (!model) {
        return;
      }
      if (targetSlot !== 'any' && model.slot !== targetSlot) {
        return;
      }
      if (inst.dd >= model.maxDd) {
        return;
      }
      var missing = model.maxDd - inst.dd;
      var amount = missing;
      if (def.effect.type === 'repair') {
        var rawAmt = model.slot === 'boots' ? def.effect.bootsValue : def.effect.value;
        amount = Math.min(missing, toInt(rawAmt, 0));
      }
      targets.push({
        uid: inst.uid,
        modelId: inst.modelId,
        name: model.name,
        slot: model.slot,
        location: location,
        dd: inst.dd,
        maxDd: model.maxDd,
        repairAmount: amount
      });
    }

    var slotKeys = Object.keys(S.EQUIP_SLOTS);
    var i;
    for (i = 0; i < slotKeys.length; i += 1) {
      maybePush(S.state.equipment.equipped[slotKeys[i]], 'equipped');
    }

    if (!S.state.mission.active) {
      for (i = 0; i < S.state.equipment.storage.length; i += 1) {
        maybePush(S.state.equipment.storage[i], 'storage');
      }
    }

    return targets;
  }

  function findEquipInstanceByUid(uid, allowStorage) {
    var slotKeys = Object.keys(S.EQUIP_SLOTS);
    var i, inst;
    for (i = 0; i < slotKeys.length; i += 1) {
      inst = S.state.equipment.equipped[slotKeys[i]];
      if (inst && inst.uid === uid) {
        return { inst: inst, location: 'equipped' };
      }
    }
    if (allowStorage) {
      for (i = 0; i < S.state.equipment.storage.length; i += 1) {
        inst = S.state.equipment.storage[i];
        if (inst && inst.uid === uid) {
          return { inst: inst, location: 'storage' };
        }
      }
    }
    return null;
  }

  function useItem(source, itemId, targetEquipUid) {
    if (source !== 'backpack' && source !== 'cargo') {
      return { ok: false, message: 'Origine oggetto non valida.' };
    }
    if (source === 'cargo' && S.state.mission.active) {
      return { ok: false, message: 'Durante una missione puoi usare solo oggetti nello Zaino.' };
    }
    var def = S.ITEMS[itemId];
    if (!def) {
      return { ok: false, message: 'Oggetto non valido.' };
    }
    var srcMap = source === 'backpack' ? S.state.backpack.items : S.state.cargo.items;
    if (toInt(srcMap[itemId], 0) <= 0) {
      return { ok: false, message: 'Non possiedi ' + def.name + ' in questa sezione.' };
    }

    var lv = getLevelData(S.state.player.level);
    var eff = def.effect || {};
    var msg = '';

    if (eff.type === 'heal_flat') {
      if (S.state.player.hp >= lv.maxHp) {
        return { ok: false, message: 'La Vita è già al massimo.' };
      }
      var prevHp = S.state.player.hp;
      S.state.player.hp = Math.min(lv.maxHp, S.state.player.hp + toInt(eff.value, 0));
      removeItemFromMap(srcMap, itemId, 1);
      msg = def.name + ': +' + (S.state.player.hp - prevHp) + ' Vita.';
    } else if (eff.type === 'heal_pct') {
      if (S.state.player.hp >= lv.maxHp) {
        return { ok: false, message: 'La Vita è già al massimo.' };
      }
      var pctHeal = Math.max(1, Math.round((lv.maxHp * toInt(eff.value, 0)) / 100));
      var beforeHp = S.state.player.hp;
      S.state.player.hp = Math.min(lv.maxHp, S.state.player.hp + pctHeal);
      removeItemFromMap(srcMap, itemId, 1);
      msg = def.name + ': +' + (S.state.player.hp - beforeHp) + ' Vita.';
    } else if (eff.type === 'shield_flat') {
      if (S.state.player.shield >= lv.maxShield) {
        return { ok: false, message: 'Lo Scudo è già al massimo.' };
      }
      var beforeShield = S.state.player.shield;
      S.state.player.shield = Math.min(lv.maxShield, S.state.player.shield + toInt(eff.value, 0));
      removeItemFromMap(srcMap, itemId, 1);
      msg = def.name + ': +' + (S.state.player.shield - beforeShield) + ' Scudo.';
    } else if (eff.type === 'add_ammo') {
      var ammoAdd = Math.max(0, toInt(eff.value, 0));
      if (source === 'backpack') {
        var projectedWeight = getBackpackTotalWeight() - def.weight + ammoAdd * S.AMMO_WEIGHT;
        if (projectedWeight > S.state.backpack.maxWeight) {
          return { ok: false, message: 'Peso dello Zaino insufficiente per aprire il caricatore.' };
        }
        removeItemFromMap(srcMap, itemId, 1);
        S.state.backpack.ammo += ammoAdd;
        msg = 'Caricato +' + ammoAdd + ' Munizioni nello Zaino.';
      } else {
        removeItemFromMap(srcMap, itemId, 1);
        S.state.cargo.ammo += ammoAdd;
        msg = 'Aggiunte +' + ammoAdd + ' Munizioni nella Stiva.';
      }
    } else if (eff.type === 'rename_token') {
      return { ok: false, message: 'Usa il Chip Cambio Identità nella scheda Opzioni.' };
    } else if (eff.type === 'repair' || eff.type === 'repair_full') {
      var targets = getRepairTargetsForItem(itemId);
      if (targets.length === 0) {
        return { ok: false, message: 'Nessun equipaggiamento compatibile danneggiato da riparare.' };
      }
      var chosen = null;
      var i;
      if (targetEquipUid) {
        for (i = 0; i < targets.length; i += 1) {
          if (targets[i].uid === targetEquipUid) {
            chosen = targets[i];
            break;
          }
        }
        if (!chosen) {
          return { ok: false, message: 'Equipaggiamento selezionato non valido per questo riparatore.' };
        }
      } else if (targets.length === 1) {
        chosen = targets[0];
      } else {
        return {
          ok: false,
          needsTarget: true,
          source: source,
          itemId: itemId,
          targets: targets,
          message: 'Scegli quale equipaggiamento riparare.'
        };
      }

      var found = findEquipInstanceByUid(chosen.uid, !S.state.mission.active);
      if (!found) {
        return { ok: false, message: 'Equipaggiamento non trovato.' };
      }
      var eqModel = S.EQUIP_MODELS[found.inst.modelId];
      var beforeDd = found.inst.dd;
      found.inst.dd = Math.min(eqModel.maxDd, found.inst.dd + chosen.repairAmount);
      removeItemFromMap(srcMap, itemId, 1);
      msg = eqModel.name + ' (' + found.inst.uid + '): +' + (found.inst.dd - beforeDd) + ' Dd (' + found.inst.dd + '/' + eqModel.maxDd + ').';
    } else {
      return { ok: false, message: 'Questo oggetto non può essere usato direttamente.' };
    }

    notifyUI();
    return { ok: true, message: msg };
  }

  function equipFromStorage(uid) {
    if (S.state.mission.active) {
      return { ok: false, message: 'Non puoi cambiare equipaggiamento durante una missione.' };
    }
    var list = S.state.equipment.storage;
    var idx = -1;
    var i;
    for (i = 0; i < list.length; i += 1) {
      if (list[i].uid === uid) {
        idx = i;
        break;
      }
    }
    if (idx === -1) {
      return { ok: false, message: 'Equipaggiamento non trovato in deposito.' };
    }
    var incoming = list[idx];
    var model = S.EQUIP_MODELS[incoming.modelId];
    if (!model) {
      return { ok: false, message: 'Modello equipaggiamento non valido.' };
    }
    list.splice(idx, 1);
    var previous = S.state.equipment.equipped[model.slot];
    if (previous) {
      list.push(previous);
    }
    S.state.equipment.equipped[model.slot] = incoming;
    notifyUI();
    return { ok: true, message: 'Equipaggiato ' + model.name + ' (' + incoming.uid + ').' };
  }

  function unequipSlot(slotKey) {
    if (S.state.mission.active) {
      return { ok: false, message: 'Non puoi rimuovere equipaggiamenti durante una missione.' };
    }
    if (!S.EQUIP_SLOTS[slotKey]) {
      return { ok: false, message: 'Slot non valido.' };
    }
    var current = S.state.equipment.equipped[slotKey];
    if (!current) {
      return { ok: false, message: 'Lo slot è già vuoto.' };
    }
    var model = S.EQUIP_MODELS[current.modelId];
    S.state.equipment.equipped[slotKey] = null;
    S.state.equipment.storage.push(current);
    notifyUI();
    return { ok: true, message: (model ? model.name : current.uid) + ' spostato nel Deposito Nave.' };
  }

  function sellStorageEquip(uid) {
    if (S.state.mission.active) {
      return { ok: false, message: 'Non puoi vendere equipaggiamenti durante una missione.' };
    }
    var list = S.state.equipment.storage;
    var idx = -1;
    var i;
    for (i = 0; i < list.length; i += 1) {
      if (list[i].uid === uid) {
        idx = i;
        break;
      }
    }
    if (idx === -1) {
      return { ok: false, message: 'Equipaggiamento non trovato in deposito.' };
    }
    var target = list[idx];
    var model = S.EQUIP_MODELS[target.modelId];
    var price = model ? toInt(model.sellPrice, 0) : 0;
    list.splice(idx, 1);
    S.state.player.credits += price;
    S.state.stats.creditsEarned += price;
    notifyUI();
    return {
      ok: true,
      credits: price,
      message: 'Venduto ' + (model ? model.name : target.uid) + ' per +' + formatNumber(price) + ' Crediti.'
    };
  }

  function upgradeCargo() {
    if (S.state.mission.active) {
      return { ok: false, message: 'Non puoi potenziare la Nave durante una missione.' };
    }
    var info = getCargoUpgradeInfo();
    if (info.isMaxed) {
      return { ok: false, message: 'Capienza della Stiva già al livello massimo.' };
    }
    if (S.state.player.credits < info.nextCost) {
      return {
        ok: false,
        message: 'Crediti insufficienti: servono ' + formatNumber(info.nextCost) + ' Crediti.'
      };
    }
    S.state.player.credits -= info.nextCost;
    S.state.upgrades.cargoLevel += 1;
    S.state.cargo.maxWeight = getCargoMaxWeight();
    notifyUI();
    return {
      ok: true,
      message: 'Stiva potenziata al Livello ' + S.state.upgrades.cargoLevel + ' (' + formatNumber(S.state.cargo.maxWeight) + ' pt.).'
    };
  }

  // --- Step 3: Loop Missioni a Turni, Fuga, Morte, Drop & Global Score ---

  function startSelectedMission() {
    if (S.state.mission.active) {
      return { ok: false, message: 'Una missione è già in corso.' };
    }
    var diff = toInt(S.state.mission.selectedDifficulty, 0);
    if (diff <= 0) {
      return { ok: false, message: 'Seleziona prima una difficoltà dalla Mappa.' };
    }
    var planet = getPlanet(S.state.player.planetId);
    var missionCfg = planet.missions[diff];
    var unlockCheck = isMissionUnlocked(planet.id, diff);
    if (!missionCfg || !unlockCheck.unlocked) {
      return { ok: false, message: unlockCheck.reason || 'Missione non disponibile.' };
    }
    if (S.state.player.hp <= 0) {
      return { ok: false, message: 'Vita insufficiente per partire in missione.' };
    }

    var aliensTotal = missionCfg.aliensMin === missionCfg.aliensMax
      ? missionCfg.aliensMin
      : randomInt(missionCfg.aliensMin, missionCfg.aliensMax);

    S.state.mission = {
      active: true,
      selectedDifficulty: diff,
      planetId: planet.id,
      turn: 0,
      aliensTotal: aliensTotal,
      aliensLeft: aliensTotal,
      completedReady: false,
      expGained: 0,
      shotsFired: 0,
      damageTaken: 0,
      levelsGained: 0,
      statuses: [],
      weather: null,
      lastShot: null
    };
    S.state.ui.activeTab = 'mission';
    notifyUI();
    return { ok: true };
  }

  function applyDamageToPlayer(rawDamage) {
    var dmg = Math.max(0, toInt(rawDamage, 0));
    var shieldAbsorbed = Math.min(S.state.player.shield, dmg);
    var hpLost = dmg - shieldAbsorbed;

    S.state.player.shield -= shieldAbsorbed;
    S.state.player.hp = Math.max(0, S.state.player.hp - hpLost);
    S.state.mission.damageTaken += dmg;

    return {
      damage: dmg,
      shieldAbsorbed: shieldAbsorbed,
      hpLost: hpLost
    };
  }

  function triggerMissionDefeat(planet, missionCfg) {
    var expLost = Math.floor((S.state.player.exp * S.COMBAT_RULES.deathExpLossPct) / 100);
    var creditsLost = Math.floor((S.state.player.credits * S.COMBAT_RULES.deathCreditsLossPct) / 100);
    S.state.player.exp = Math.max(0, S.state.player.exp - expLost);
    S.state.player.credits = Math.max(0, S.state.player.credits - creditsLost);

    var lvData = getLevelData(S.state.player.level);
    S.state.player.hp = Math.min(S.COMBAT_RULES.deathRespawnHp, lvData.maxHp);
    S.state.player.shield = S.COMBAT_RULES.deathRespawnShield;
    S.state.stats.deaths += 1;

    var summary = {
      planetName: planet.name,
      difficulty: missionCfg.difficulty,
      missionName: missionCfg.name,
      turn: S.state.mission.turn,
      aliensKilled: S.state.mission.aliensTotal - S.state.mission.aliensLeft,
      aliensTotal: S.state.mission.aliensTotal,
      expLost: expLost,
      creditsLost: creditsLost,
      respawnHp: S.state.player.hp
    };

    S.state.mission = createEmptyMissionState();
    S.state.ui.activeTab = 'ship';
    notifyUI();
    return { ok: true, outcome: 'death', summary: summary };
  }

  // Fase 1: Risoluzione Status (struttura pronta per status futuri in Step 4/5)
  function resolveStatusPhase() {
    var list = S.state.mission.statuses;
    if (!Array.isArray(list) || list.length === 0) {
      return { applied: 0 };
    }
    return { applied: 0 };
  }

  // Fase 2: Risoluzione Meteo (danni meteo, Dd Casco Spaziale e nuovi status in Step 4)
  function resolveWeatherPhase() {
    var weather = S.state.mission.weather;
    if (!weather) {
      return { applied: false, damage: 0 };
    }
    return { applied: false, damage: 0 };
  }

  // Fase 3: Risoluzione Danni Combattimento (scudi, vita, Dd Tuta Spaziale, eventuali status futuri)
  function resolveCombatDamagePhase(planet, missionCfg) {
    var rawDmg = Math.max(0, toInt(missionCfg.enemyDamage, 1));
    var suitInst = S.state.equipment.equipped.suit;
    var suitRed = 0;

    if (suitInst && suitInst.dd > 0) {
      var suitModel = S.EQUIP_MODELS[suitInst.modelId];
      suitRed = suitModel ? Math.max(0, toInt(suitModel.score, 0)) : 0;
      suitInst.dd = Math.max(0, suitInst.dd - 1);
    }

    var finalDmg = Math.max(0, rawDmg - suitRed);
    var dmgRes = applyDamageToPlayer(finalDmg);

    return {
      damage: finalDmg,
      shieldAbsorbed: dmgRes.shieldAbsorbed,
      hpLost: dmgRes.hpLost,
      suitReduced: suitRed
    };
  }

  // Fase 4: Risoluzione di incremento del turno
  function resolveTurnIncrementPhase() {
    S.state.mission.turn += 1;
  }

  // Fase 5: Risoluzione del Colpo (Check JustTanked + precisione con 8,3% miss)
  function resolveShotPhase(planet, missionCfg) {
    if (S.state.player.hp <= 0) {
      return triggerMissionDefeat(planet, missionCfg);
    }

    var missPermille = toInt(S.COMBAT_RULES.missChancePermille, 83);
    var isMiss = randomInt(1, 1000) <= missPermille;

    if (isMiss) {
      S.state.mission.lastShot = {
        turn: S.state.mission.turn,
        hit: false,
        expAdded: 0,
        leveledUp: false,
        newLevel: S.state.player.level
      };
      notifyUI();
      return {
        ok: true,
        outcome: 'miss',
        hit: false,
        leveledUp: false,
        newLevel: S.state.player.level
      };
    }

    S.state.mission.aliensLeft = Math.max(0, S.state.mission.aliensLeft - 1);
    S.state.stats.aliensKilled += 1;

    var expRes = addExp(S.COMBAT_RULES.expPerAlien);
    S.state.mission.expGained += expRes.expAdded;
    S.state.mission.levelsGained += expRes.levelsGained;

    S.state.mission.lastShot = {
      turn: S.state.mission.turn,
      hit: true,
      expAdded: expRes.expAdded,
      leveledUp: expRes.leveledUp,
      newLevel: expRes.newLevel
    };

    if (S.state.mission.aliensLeft === 0) {
      S.state.mission.completedReady = true;
      notifyUI();
      return {
        ok: true,
        outcome: 'ready_complete',
        hit: true,
        leveledUp: expRes.leveledUp,
        newLevel: expRes.newLevel
      };
    }

    notifyUI();
    return {
      ok: true,
      outcome: 'continue',
      hit: true,
      leveledUp: expRes.leveledUp,
      newLevel: expRes.newLevel
    };
  }

  function shootAlien() {
    if (!S.state.mission.active) {
      return { ok: false, message: 'Nessuna missione attiva.' };
    }
    if (S.state.mission.completedReady) {
      return { ok: false, message: 'Tutti gli alieni sono stati eliminati: premi Completa Missione.' };
    }
    if (S.state.backpack.ammo <= 0) {
      return { ok: false, message: 'Munizioni esaurite! Usa un caricatore o tenta la fuga.' };
    }

    var planet = getPlanet(S.state.mission.planetId || S.state.player.planetId);
    var missionCfg = planet.missions[S.state.mission.selectedDifficulty];
    if (!missionCfg) {
      return { ok: false, message: 'Configurazione missione non trovata.' };
    }

    S.state.backpack.ammo -= 1;
    S.state.stats.shotsFired += 1;
    S.state.mission.shotsFired += 1;

    resolveStatusPhase(planet, missionCfg);
    resolveWeatherPhase(planet, missionCfg);
    resolveCombatDamagePhase(planet, missionCfg);
    resolveTurnIncrementPhase();
    return resolveShotPhase(planet, missionCfg);
  }

  function attemptEscape() {
    if (!S.state.mission.active || S.state.mission.completedReady) {
      return { ok: false, message: 'Nessuna fuga disponibile in questo stato.' };
    }
    if (S.state.backpack.ammo > 0) {
      return { ok: false, message: 'Puoi tentare la fuga solo quando le munizioni sono a 0.' };
    }

    var planet = getPlanet(S.state.mission.planetId || S.state.player.planetId);
    var missionCfg = planet.missions[S.state.mission.selectedDifficulty];
    var roll = randomInt(1, 20);

    if (roll >= S.COMBAT_RULES.escapeRollTarget) {
      var expLost = Math.floor((S.state.player.exp * S.COMBAT_RULES.escapeExpLossPct) / 100);
      S.state.player.exp = Math.max(0, S.state.player.exp - expLost);
      S.state.stats.escapes += 1;

      var summary = {
        planetName: planet.name,
        difficulty: missionCfg.difficulty,
        missionName: missionCfg.name,
        roll: roll,
        turn: S.state.mission.turn,
        expLost: expLost
      };

      S.state.mission = createEmptyMissionState();
      S.state.ui.activeTab = 'ship';
      notifyUI();
      return { ok: true, outcome: 'escaped', summary: summary };
    }

    var combatRes = resolveCombatDamagePhase(planet, missionCfg);
    resolveTurnIncrementPhase();
    if (S.state.player.hp <= 0) {
      return triggerMissionDefeat(planet, missionCfg);
    }
    notifyUI();
    return {
      ok: true,
      outcome: 'escape_failed',
      roll: roll,
      damage: combatRes.damage
    };
  }

  function completeMission() {
    if (!S.state.mission.active || !S.state.mission.completedReady || S.state.mission.aliensLeft > 0) {
      return { ok: false, message: 'La missione non è ancora pronta per il completamento.' };
    }

    var planet = getPlanet(S.state.mission.planetId || S.state.player.planetId);
    var diff = S.state.mission.selectedDifficulty;
    var missionCfg = planet.missions[diff];
    if (!missionCfg) {
      return { ok: false, message: 'Configurazione missione non trovata.' };
    }

    var creditsEarned = Math.max(0, toInt(missionCfg.creditsReward, 0));
    S.state.player.credits += creditsEarned;
    S.state.stats.creditsEarned += creditsEarned;
    S.state.stats.missionsWon[diff] = toInt(S.state.stats.missionsWon[diff], 0) + 1;

    // Estrazione drop (prepara bozza interattiva in pendingLoot)
    var rolledItems = [];
    var rolledEquips = [];
    var table = missionCfg.dropTable || [];
    var i, entry, roll;
    for (i = 0; i < table.length; i += 1) {
      entry = table[i];
      roll = randomInt(1, 100);
      if (roll > toInt(entry.chance, 0)) {
        continue;
      }
      var qty = Math.max(1, toInt(entry.qty, 1));
      if (entry.kind === 'equip') {
        var eqModel = S.EQUIP_MODELS[entry.id];
        if (eqModel) {
          var uid = formatUid(S.state.equipment.nextUid);
          S.state.equipment.nextUid += 1;
          var slotMeta = S.EQUIP_SLOTS[eqModel.slot];
          rolledEquips.push({
            kind: 'equip',
            id: eqModel.id,
            uid: uid,
            name: eqModel.name,
            slot: eqModel.slot,
            icon: slotMeta && slotMeta.icon ? slotMeta.icon : '',
            maxDd: eqModel.maxDd,
            weight: 0,
            qty: 1
          });
        }
      } else {
        var itemDef = S.ITEMS[entry.id];
        if (itemDef) {
          rolledItems.push({
            kind: 'item',
            id: itemDef.id,
            name: itemDef.name,
            icon: itemDef.icon || '',
            weight: toInt(itemDef.weight, 0),
            qty: qty
          });
        }
      }
    }

    // Aggiornamento Global Score (10/10 stessa difficoltà e pianeta; cambio difficoltà azzera)
    var gsKey = planet.id + '_' + diff;
    if (S.state.globalScore.activeKey !== gsKey) {
      S.state.globalScore.activeKey = gsKey;
      S.state.globalScore.streak = 1;
    } else {
      S.state.globalScore.streak += 1;
    }

    var streakShown = S.state.globalScore.streak;
    var gsCompleted = false;
    var gsReward = null;
    if (S.state.globalScore.streak >= S.GLOBAL_SCORE_TARGET) {
      gsCompleted = true;
      gsReward = missionCfg.globalScoreReward || { liquids: 1, credits: 100 };
      var bonusLiq = Math.max(0, toInt(gsReward.liquids, 0));
      var bonusCr = Math.max(0, toInt(gsReward.credits, 0));
      S.state.player.liquids += bonusLiq;
      S.state.stats.liquidsEarned += bonusLiq;
      S.state.player.credits += bonusCr;
      S.state.stats.creditsEarned += bonusCr;
      S.state.globalScore.streak = 0;
    }

    var draft = createPendingLootDraft(rolledItems, rolledEquips);
    S.state.pendingLoot = draft;

    var recap = {
      planetId: planet.id,
      planetName: planet.name,
      difficulty: diff,
      missionName: missionCfg.name,
      turns: S.state.mission.turn,
      aliensKilled: S.state.mission.aliensTotal,
      shotsFired: S.state.mission.shotsFired,
      expGained: S.state.mission.expGained,
      levelsGained: S.state.mission.levelsGained,
      damageTaken: S.state.mission.damageTaken,
      creditsEarned: creditsEarned,
      interactiveLoot: true,
      drops: buildDropsSummaryFromDraft(draft),
      globalScore: {
        key: gsKey,
        streakShown: streakShown,
        streakAfter: S.state.globalScore.streak,
        target: S.GLOBAL_SCORE_TARGET,
        completed: gsCompleted,
        reward: gsReward
      }
    };

    S.state.lastMissionRecap = recap;
    S.state.mission = createEmptyMissionState();
    S.state.ui.activeTab = 'mission';
    notifyUI();
    return { ok: true, recap: recap };
  }

  function buildDropsSummaryFromDraft(draft) {
    if (!draft || !Array.isArray(draft.entries)) {
      return [];
    }
    var summary = [];
    var i, e, destText;
    for (i = 0; i < draft.entries.length; i += 1) {
      e = draft.entries[i];
      if (e.origin !== 'drop') {
        continue;
      }
      if (e.list === 1) {
        destText = 'Lasciato a terra';
      } else if (e.kind === 'equip') {
        destText = '👤 Equipaggiamento';
      } else if (e.dest === 'cargo') {
        destText = 'Stiva';
      } else {
        destText = 'Zaino';
      }
      summary.push({
        kind: e.kind,
        id: e.id,
        uid: e.uid,
        name: e.name,
        slot: e.slot,
        maxDd: e.maxDd,
        weight: e.weight,
        qty: e.qty,
        destination: destText
      });
    }
    return summary;
  }

  function createPendingLootDraft(rolledItems, rolledEquips) {
    var startBpWeight = getBackpackTotalWeight();
    var ammoWeight = getBackpackAmmoWeight();
    var bpMax = S.state.backpack.maxWeight;
    var startCargoWeight = getCargoItemsWeight();
    var cargoMax = getCargoMaxWeight();

    var entries = [];
    var nextId = 1;
    var k, qty, def;

    var bpItems = S.state.backpack.items || {};
    for (k in bpItems) {
      if (Object.prototype.hasOwnProperty.call(bpItems, k) && S.ITEMS[k]) {
        qty = toInt(bpItems[k], 0);
        if (qty > 0) {
          def = S.ITEMS[k];
          entries.push({
            entryId: 'L-' + (nextId++),
            kind: 'item',
            id: def.id,
            name: def.name,
            icon: def.icon || '',
            weight: toInt(def.weight, 0),
            qty: qty,
            origin: 'backpack',
            list: 3,
            dest: null
          });
        }
      }
    }

    var cargoItems = S.state.cargo.items || {};
    for (k in cargoItems) {
      if (Object.prototype.hasOwnProperty.call(cargoItems, k) && S.ITEMS[k]) {
        qty = toInt(cargoItems[k], 0);
        if (qty > 0) {
          def = S.ITEMS[k];
          entries.push({
            entryId: 'L-' + (nextId++),
            kind: 'item',
            id: def.id,
            name: def.name,
            icon: def.icon || '',
            weight: toInt(def.weight, 0),
            qty: qty,
            origin: 'cargo',
            list: 4,
            dest: null
          });
        }
      }
    }

    // Ordina gli oggetti droppati dal peso unitario minore al maggiore
    var sortedItems = (rolledItems || []).slice().sort(function (a, b) {
      return a.weight - b.weight;
    });

    var remBp = Math.max(0, bpMax - startBpWeight);
    var remCargo = Math.max(0, cargoMax - startCargoWeight);
    var i, item, u, bpQty, cargoQty, groundQty, unitW;

    for (i = 0; i < sortedItems.length; i += 1) {
      item = sortedItems[i];
      unitW = Math.max(0, toInt(item.weight, 0));
      bpQty = 0;
      cargoQty = 0;
      groundQty = 0;

      for (u = 0; u < item.qty; u += 1) {
        if (unitW <= remBp) {
          remBp -= unitW;
          bpQty += 1;
        } else if (unitW <= remCargo) {
          remCargo -= unitW;
          cargoQty += 1;
        } else {
          groundQty += 1;
        }
      }

      if (bpQty > 0) {
        entries.push({
          entryId: 'L-' + (nextId++),
          kind: 'item',
          id: item.id,
          name: item.name,
          icon: item.icon,
          weight: unitW,
          qty: bpQty,
          origin: 'drop',
          list: 2,
          dest: 'backpack'
        });
      }
      if (cargoQty > 0) {
        entries.push({
          entryId: 'L-' + (nextId++),
          kind: 'item',
          id: item.id,
          name: item.name,
          icon: item.icon,
          weight: unitW,
          qty: cargoQty,
          origin: 'drop',
          list: 2,
          dest: 'cargo'
        });
      }
      if (groundQty > 0) {
        entries.push({
          entryId: 'L-' + (nextId++),
          kind: 'item',
          id: item.id,
          name: item.name,
          icon: item.icon,
          weight: unitW,
          qty: groundQty,
          origin: 'drop',
          list: 1,
          dest: null
        });
      }
    }

    var eqList = rolledEquips || [];
    var eq;
    for (i = 0; i < eqList.length; i += 1) {
      eq = eqList[i];
      entries.push({
        entryId: 'L-' + (nextId++),
        kind: 'equip',
        id: eq.id,
        uid: eq.uid,
        name: eq.name,
        slot: eq.slot,
        icon: eq.icon,
        maxDd: eq.maxDd,
        weight: 0,
        qty: 1,
        origin: 'drop',
        list: 2,
        dest: 'equip'
      });
    }

    return {
      startBpWeight: startBpWeight,
      ammoWeight: ammoWeight,
      bpMax: bpMax,
      startCargoWeight: startCargoWeight,
      cargoMax: cargoMax,
      nextEntryId: nextId,
      entries: entries
    };
  }

  function findLootEntry(entryId) {
    var draft = S.state.pendingLoot;
    if (!draft || !Array.isArray(draft.entries)) {
      return null;
    }
    var i;
    for (i = 0; i < draft.entries.length; i += 1) {
      if (draft.entries[i].entryId === entryId) {
        return { index: i, entry: draft.entries[i] };
      }
    }
    return null;
  }

  function getPendingLootStats() {
    var draft = S.state.pendingLoot;
    if (!draft) {
      return null;
    }
    var groundWeight = 0;
    var l2BpWeight = 0;
    var l2CargoWeight = 0;
    var l3DirectItemsWeight = 0;
    var l4DirectItemsWeight = 0;
    var i, e, w;

    for (i = 0; i < draft.entries.length; i += 1) {
      e = draft.entries[i];
      w = Math.max(0, toInt(e.weight, 0)) * Math.max(0, toInt(e.qty, 0));
      if (e.list === 1) {
        groundWeight += w;
      } else if (e.list === 2) {
        if (e.dest === 'backpack') {
          l2BpWeight += w;
        } else if (e.dest === 'cargo') {
          l2CargoWeight += w;
        }
      } else if (e.list === 3) {
        l3DirectItemsWeight += w;
      } else if (e.list === 4) {
        l4DirectItemsWeight += w;
      }
    }

    var l2TotalWeight = l2BpWeight + l2CargoWeight;
    var l3EndWeight = draft.ammoWeight + l3DirectItemsWeight + l2BpWeight;
    var l3Delta = l3EndWeight - draft.startBpWeight;
    var l4EndWeight = l4DirectItemsWeight + l2CargoWeight;
    var l4Delta = l4EndWeight - draft.startCargoWeight;

    return {
      startBpWeight: draft.startBpWeight,
      l3Delta: l3Delta,
      l3EndWeight: l3EndWeight,
      bpMax: draft.bpMax,
      bpFree: Math.max(0, draft.bpMax - l3EndWeight),
      startCargoWeight: draft.startCargoWeight,
      l4Delta: l4Delta,
      l4EndWeight: l4EndWeight,
      cargoMax: draft.cargoMax,
      cargoFree: Math.max(0, draft.cargoMax - l4EndWeight),
      groundWeight: groundWeight,
      l2TotalWeight: l2TotalWeight,
      l2BpWeight: l2BpWeight,
      l2CargoWeight: l2CargoWeight
    };
  }

  function canMoveLootEntry(entryId, targetList) {
    var found = findLootEntry(entryId);
    var target = toInt(targetList, 0);
    if (!found || target < 1 || target > 4) {
      return false;
    }
    var e = found.entry;
    if (e.list === target) {
      return false;
    }
    if (e.origin === 'drop') {
      return target === 1 || target === 2;
    }
    if (e.origin === 'backpack' || e.origin === 'cargo') {
      if (target === 2) {
        return false;
      }
      if (e.list === 1) {
        return (e.origin === 'backpack' && target === 3) || (e.origin === 'cargo' && target === 4);
      }
      if (e.list === 3) {
        return target === 4 || target === 1;
      }
      if (e.list === 4) {
        return target === 3 || target === 1;
      }
    }
    return false;
  }

  function mergeUnitIntoDraft(targetList, sourceEntry, newDest, qtyToAdd) {
    var draft = S.state.pendingLoot;
    var count = Math.max(1, toInt(qtyToAdd, 1));
    if (sourceEntry.kind === 'item') {
      var i, cand;
      for (i = 0; i < draft.entries.length; i += 1) {
        cand = draft.entries[i];
        if (
          cand.kind === 'item' &&
          cand.id === sourceEntry.id &&
          cand.origin === sourceEntry.origin &&
          cand.list === targetList &&
          cand.dest === newDest
        ) {
          cand.qty += count;
          return;
        }
      }
    }
    draft.entries.push({
      entryId: 'L-' + (draft.nextEntryId++),
      kind: sourceEntry.kind,
      id: sourceEntry.id,
      uid: sourceEntry.uid,
      name: sourceEntry.name,
      slot: sourceEntry.slot,
      icon: sourceEntry.icon,
      maxDd: sourceEntry.maxDd,
      weight: sourceEntry.weight,
      qty: count,
      origin: sourceEntry.origin,
      list: targetList,
      dest: newDest
    });
  }

  function moveLootEntry(entryId, targetList, moveQty) {
    var draft = S.state.pendingLoot;
    var found = findLootEntry(entryId);
    var target = toInt(targetList, 0);
    if (!draft || !found) {
      return { ok: false, message: 'Elemento bottino non trovato.' };
    }
    var e = found.entry;
    if (!canMoveLootEntry(entryId, target)) {
      return { ok: false, message: 'Spostamento non consentito tra queste due liste.' };
    }

    var stats = getPendingLootStats();
    var qtyStep = moveQty === 'all' ? e.qty : Math.min(e.qty, Math.max(1, toInt(moveQty, 1)));
    var neededWeight = e.weight * qtyStep;
    var newDest = null;

    if (target === 2) {
      if (e.kind === 'equip') {
        newDest = 'equip';
      } else if (stats.bpFree >= neededWeight) {
        newDest = 'backpack';
      } else if (stats.cargoFree >= neededWeight) {
        newDest = 'cargo';
      } else {
        return { ok: false, message: 'Spazio insufficiente in Zaino e Stiva.' };
      }
    } else if (target === 3) {
      if (stats.bpFree < neededWeight) {
        return { ok: false, message: 'Spazio insufficiente nello Zaino.' };
      }
    } else if (target === 4) {
      if (stats.cargoFree < neededWeight) {
        return { ok: false, message: 'Spazio insufficiente nella Stiva.' };
      }
    }

    e.qty -= qtyStep;
    if (e.qty <= 0) {
      draft.entries.splice(found.index, 1);
    }
    mergeUnitIntoDraft(target, e, newDest, qtyStep);
    notifyUI();
    return { ok: true };
  }

  function toggleLootDropDestination(entryId) {
    var draft = S.state.pendingLoot;
    var found = findLootEntry(entryId);
    if (!draft || !found) {
      return { ok: false, message: 'Oggetto non trovato.' };
    }
    var e = found.entry;
    if (e.list !== 2 || e.kind !== 'item') {
      return { ok: false, message: 'Solo gli oggetti raccolti possono cambiare destinazione.' };
    }
    var stats = getPendingLootStats();
    var totalW = e.weight * e.qty;
    var nextDest = e.dest === 'backpack' ? 'cargo' : 'backpack';

    if (nextDest === 'cargo' && stats.cargoFree < totalW) {
      return { ok: false, message: 'Spazio insufficiente nella Stiva (' + formatNumber(totalW) + ' pt. richiesti).' };
    }
    if (nextDest === 'backpack' && stats.bpFree < totalW) {
      return { ok: false, message: 'Spazio insufficiente nello Zaino (' + formatNumber(totalW) + ' pt. richiesti).' };
    }

    e.dest = nextDest;
    notifyUI();
    return { ok: true };
  }

  function splitLootEntry(entryId) {
    var draft = S.state.pendingLoot;
    var found = findLootEntry(entryId);
    if (!draft || !found) {
      return { ok: false, message: 'Oggetto non trovato.' };
    }
    var e = found.entry;
    if (e.list !== 2 || e.kind !== 'item' || e.qty <= 1) {
      return { ok: false, message: 'Puoi scorporare solo pile con più di 1 unità in Oggetti raccolti.' };
    }
    e.qty -= 1;
    draft.entries.splice(found.index + 1, 0, {
      entryId: 'L-' + (draft.nextEntryId++),
      kind: 'item',
      id: e.id,
      name: e.name,
      icon: e.icon,
      weight: e.weight,
      qty: 1,
      origin: 'drop',
      list: 2,
      dest: e.dest
    });
    notifyUI();
    return { ok: true };
  }

  function restoreGroundEntry(entryId) {
    var found = findLootEntry(entryId);
    if (!found) {
      return { ok: false, message: 'Oggetto non trovato.' };
    }
    var e = found.entry;
    if (e.list !== 1 || (e.origin !== 'backpack' && e.origin !== 'cargo')) {
      return { ok: false, message: 'Questo oggetto non ha una lista di origine.' };
    }
    var targetList = e.origin === 'backpack' ? 3 : 4;
    var stats = getPendingLootStats();
    var freeW = targetList === 3 ? stats.bpFree : stats.cargoFree;
    var fitQty = e.weight === 0 ? e.qty : Math.min(e.qty, Math.floor(freeW / e.weight));
    if (fitQty <= 0) {
      return {
        ok: false,
        message: 'Spazio insufficiente per ripristinare in ' + (targetList === 3 ? 'Zaino' : 'Stiva') + '.'
      };
    }
    return moveLootEntry(entryId, targetList, fitQty);
  }

  function commitPendingLoot() {
    var draft = S.state.pendingLoot;
    if (!draft) {
      return { ok: false };
    }
    var nextBp = {};
    var nextCargo = {};
    var i, e, eqModel, inst;

    for (i = 0; i < draft.entries.length; i += 1) {
      e = draft.entries[i];
      if (e.kind === 'equip') {
        if (e.list === 2) {
          eqModel = S.EQUIP_MODELS[e.id];
          if (eqModel) {
            inst = makeEquipInstance(e.uid, eqModel.id, e.maxDd);
            if (inst) {
              S.state.equipment.storage.push(inst);
            }
          }
        }
      } else if (e.kind === 'item' && e.qty > 0) {
        if (e.list === 3 || (e.list === 2 && e.dest === 'backpack')) {
          addItemToMap(nextBp, e.id, e.qty);
        } else if (e.list === 4 || (e.list === 2 && e.dest === 'cargo')) {
          addItemToMap(nextCargo, e.id, e.qty);
        }
      }
    }

    S.state.backpack.items = nextBp;
    S.state.cargo.items = nextCargo;

    if (S.state.lastMissionRecap) {
      S.state.lastMissionRecap.drops = buildDropsSummaryFromDraft(draft);
      S.state.lastMissionRecap.interactiveLoot = false;
    }

    S.state.pendingLoot = null;
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

  // --- Codec UTF-8 & Base62 puro (100% alfanumerico, indipendente da browser/locale) ---

  function utf8Encode(str) {
    var bytes = [];
    var i, code, code2, cp;
    for (i = 0; i < str.length; i += 1) {
      code = str.charCodeAt(i);
      if (code < 0x80) {
        bytes.push(code);
      } else if (code < 0x800) {
        bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
      } else if (code >= 0xd800 && code <= 0xdbff && i + 1 < str.length) {
        code2 = str.charCodeAt(i + 1);
        if (code2 >= 0xdc00 && code2 <= 0xdfff) {
          cp = 0x10000 + ((code - 0xd800) << 10) + (code2 - 0xdc00);
          i += 1;
          bytes.push(
            0xf0 | (cp >> 18),
            0x80 | ((cp >> 12) & 0x3f),
            0x80 | ((cp >> 6) & 0x3f),
            0x80 | (cp & 0x3f)
          );
        } else {
          throw new Error('UTF-8 encoding error: unpaired surrogate');
        }
      } else {
        bytes.push(
          0xe0 | (code >> 12),
          0x80 | ((code >> 6) & 0x3f),
          0x80 | (code & 0x3f)
        );
      }
    }
    return bytes;
  }

  function utf8Decode(bytes) {
    var out = '';
    var i = 0;
    var b1, b2, b3, b4, cp;
    while (i < bytes.length) {
      b1 = bytes[i];
      if (b1 < 0x80) {
        out += String.fromCharCode(b1);
        i += 1;
      } else if ((b1 & 0xe0) === 0xc0) {
        if (i + 1 >= bytes.length) {
          throw new Error('Invalid UTF-8 sequence');
        }
        b2 = bytes[i + 1];
        out += String.fromCharCode(((b1 & 0x1f) << 6) | (b2 & 0x3f));
        i += 2;
      } else if ((b1 & 0xf0) === 0xe0) {
        if (i + 2 >= bytes.length) {
          throw new Error('Invalid UTF-8 sequence');
        }
        b2 = bytes[i + 1];
        b3 = bytes[i + 2];
        out += String.fromCharCode(((b1 & 0x0f) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f));
        i += 3;
      } else if ((b1 & 0xf8) === 0xf0) {
        if (i + 3 >= bytes.length) {
          throw new Error('Invalid UTF-8 sequence');
        }
        b2 = bytes[i + 1];
        b3 = bytes[i + 2];
        b4 = bytes[i + 3];
        cp = ((b1 & 0x07) << 18) | ((b2 & 0x3f) << 12) | ((b3 & 0x3f) << 6) | (b4 & 0x3f);
        cp -= 0x10000;
        out += String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 0x3ff));
        i += 4;
      } else {
        throw new Error('Invalid UTF-8 byte');
      }
    }
    return out;
  }

  function bytesToBase62(rawBytes) {
    var digits = [1].concat(rawBytes);
    var result = [];
    var next, i, rem, val;

    while (digits.length > 0) {
      next = [];
      rem = 0;
      for (i = 0; i < digits.length; i += 1) {
        val = rem * 256 + digits[i];
        if (next.length > 0 || Math.floor(val / 62) > 0) {
          next.push(Math.floor(val / 62));
        }
        rem = val % 62;
      }
      result.push(BASE62_ALPHABET.charAt(rem));
      digits = next;
    }

    result.reverse();
    return result.join('');
  }

  function base62ToBytes(str) {
    var digits = [0];
    var i, j, idx, carry, val;

    for (i = 0; i < str.length; i += 1) {
      idx = BASE62_ALPHABET.indexOf(str.charAt(i));
      if (idx === -1) {
        throw new Error('Carattere non valido nel codice salvataggio');
      }
      carry = idx;
      for (j = digits.length - 1; j >= 0; j -= 1) {
        val = digits[j] * 62 + carry;
        digits[j] = val & 0xff;
        carry = val >> 8;
      }
      while (carry > 0) {
        digits.unshift(carry & 0xff);
        carry = carry >> 8;
      }
    }

    if (digits.length === 0 || digits[0] !== 1) {
      throw new Error('Intestazione binaria salvataggio non valida');
    }
    return digits.slice(1);
  }

  function computeChecksum(str) {
    var hash = 0x811c9dc5;
    var i;
    for (i = 0; i < str.length; i += 1) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).toUpperCase().padStart(8, '0');
  }

  function sanitizeItemsMap(rawMap, fallbackMap) {
    if (!rawMap || typeof rawMap !== 'object' || Array.isArray(rawMap)) {
      return fallbackMap ? Object.assign({}, fallbackMap) : {};
    }
    var clean = {};
    var key, qty;
    for (key in rawMap) {
      if (Object.prototype.hasOwnProperty.call(rawMap, key) && S.ITEMS[key]) {
        qty = toInt(rawMap[key], 0);
        if (qty > 0) {
          clean[key] = qty;
        }
      }
    }
    return clean;
  }

  function migrateSave(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new Error('Struttura dati di salvataggio non valida.');
    }

    var base = createInitialState();

    if (raw.player && typeof raw.player === 'object') {
      var rawName = typeof raw.player.name === 'string' ? raw.player.name.trim().replace(/\s+/g, ' ') : '';
      base.player.name = rawName.length >= 2 && rawName.length <= 20 ? rawName : base.player.name;
      base.player.level = clampInt(raw.player.level, 1, S.MAX_LEVEL, 1);
      var lvData = getLevelData(base.player.level);
      var maxExpGuard = lvData.nextExp ? Math.max(0, lvData.nextExp - 1) : 0;
      base.player.exp = lvData.nextExp
        ? clampInt(raw.player.exp, 0, maxExpGuard, 0)
        : 0;
      base.player.hp = clampInt(raw.player.hp, 0, lvData.maxHp, lvData.maxHp);
      base.player.shield = clampInt(raw.player.shield, 0, lvData.maxShield, lvData.maxShield);
      base.player.credits = Math.max(0, toInt(raw.player.credits, base.player.credits));
      base.player.liquids = Math.max(0, toInt(raw.player.liquids, base.player.liquids));
      base.player.planetId = S.PLANETS[raw.player.planetId] ? raw.player.planetId : 'earth';
    }

    if (raw.upgrades && typeof raw.upgrades === 'object') {
      var maxCargoLvl = S.CARGO_UPGRADE_COSTS ? S.CARGO_UPGRADE_COSTS.length : 10;
      base.upgrades.cargoLevel = clampInt(raw.upgrades.cargoLevel, 0, maxCargoLvl, 0);
    }

    if (raw.preferences && typeof raw.preferences === 'object') {
      var rawCols = toInt(raw.preferences.lootColumns, 2);
      base.preferences.lootColumns = (rawCols === 2 || rawCols === 3 || rawCols === 4) ? rawCols : 2;
    }

    if (raw.backpack && typeof raw.backpack === 'object') {
      base.backpack.maxWeight = Math.max(S.BACKPACK_DEFAULT_WEIGHT, toInt(raw.backpack.maxWeight, S.BACKPACK_DEFAULT_WEIGHT));
      base.backpack.ammo = Math.max(0, toInt(raw.backpack.ammo, 0));
      base.backpack.items = sanitizeItemsMap(raw.backpack.items, base.backpack.items);
    }

    if (raw.cargo && typeof raw.cargo === 'object') {
      base.cargo.ammo = Math.max(0, toInt(raw.cargo.ammo, 0));
      base.cargo.items = sanitizeItemsMap(raw.cargo.items, {});
    }
    base.cargo.maxWeight = S.CARGO_DEFAULT_WEIGHT + base.upgrades.cargoLevel * S.CARGO_UPGRADE_STEP;

    if (raw.equipment && typeof raw.equipment === 'object') {
      base.equipment.nextUid = Math.max(1, toInt(raw.equipment.nextUid, base.equipment.nextUid));

      if (raw.equipment.equipped && typeof raw.equipment.equipped === 'object') {
        var slotKeys = Object.keys(S.EQUIP_SLOTS);
        var sIdx, slotName, rawInst, inst;
        for (sIdx = 0; sIdx < slotKeys.length; sIdx += 1) {
          slotName = slotKeys[sIdx];
          if (Object.prototype.hasOwnProperty.call(raw.equipment.equipped, slotName)) {
            rawInst = raw.equipment.equipped[slotName];
            if (rawInst === null) {
              base.equipment.equipped[slotName] = null;
            } else if (rawInst && typeof rawInst === 'object' && S.EQUIP_MODELS[rawInst.modelId]) {
              if (S.EQUIP_MODELS[rawInst.modelId].slot === slotName) {
                inst = makeEquipInstance(
                  rawInst.uid || formatUid(base.equipment.nextUid++),
                  rawInst.modelId,
                  rawInst.dd
                );
                base.equipment.equipped[slotName] = inst;
              }
            }
          }
        }
      }

      if (Array.isArray(raw.equipment.storage)) {
        base.equipment.storage = [];
        var stIdx, stRaw, stInst;
        for (stIdx = 0; stIdx < raw.equipment.storage.length; stIdx += 1) {
          stRaw = raw.equipment.storage[stIdx];
          if (stRaw && typeof stRaw === 'object' && S.EQUIP_MODELS[stRaw.modelId]) {
            stInst = makeEquipInstance(
              stRaw.uid || formatUid(base.equipment.nextUid++),
              stRaw.modelId,
              stRaw.dd
            );
            if (stInst) {
              base.equipment.storage.push(stInst);
            }
          }
        }
      }
    }

    if (raw.globalScore && typeof raw.globalScore === 'object') {
      base.globalScore.activeKey = typeof raw.globalScore.activeKey === 'string'
        ? raw.globalScore.activeKey
        : null;
      base.globalScore.streak = clampInt(raw.globalScore.streak, 0, S.GLOBAL_SCORE_TARGET, 0);
    }

    if (raw.cooldowns && typeof raw.cooldowns === 'object') {
      base.cooldowns.regenReadyAt = Math.max(0, toInt(raw.cooldowns.regenReadyAt, 0));
      base.cooldowns.supplyReadyAt = Math.max(0, toInt(raw.cooldowns.supplyReadyAt, 0));
    }

    if (Array.isArray(raw.booksUnlocked)) {
      base.booksUnlocked = raw.booksUnlocked.filter(function (b) {
        return typeof b === 'string';
      });
    }
    if (raw.storyFlags && typeof raw.storyFlags === 'object' && !Array.isArray(raw.storyFlags)) {
      var flagKey;
      for (flagKey in raw.storyFlags) {
        if (Object.prototype.hasOwnProperty.call(raw.storyFlags, flagKey)) {
          base.storyFlags[flagKey] = Boolean(raw.storyFlags[flagKey]);
        }
      }
    }

    if (raw.lastMissionRecap && typeof raw.lastMissionRecap === 'object' && !Array.isArray(raw.lastMissionRecap)) {
      base.lastMissionRecap = raw.lastMissionRecap;
    }

    if (raw.stats && typeof raw.stats === 'object') {
      var statFields = [
        'aliensKilled',
        'shotsFired',
        'deaths',
        'escapes',
        'regenUsed',
        'suppliesClaimed',
        'creditsEarned',
        'liquidsEarned'
      ];
      var fIdx, field;
      for (fIdx = 0; fIdx < statFields.length; fIdx += 1) {
        field = statFields[fIdx];
        base.stats[field] = Math.max(0, toInt(raw.stats[field], 0));
      }
      if (raw.stats.missionsWon && typeof raw.stats.missionsWon === 'object') {
        var dIdx;
        for (dIdx = 1; dIdx <= 4; dIdx += 1) {
          base.stats.missionsWon[dIdx] = Math.max(0, toInt(raw.stats.missionsWon[dIdx], 0));
        }
      }
    }

    base.saveVersion = S.SAVE_VERSION;
    base.ui.activeTab = 'ship';
    base.mission = createEmptyMissionState();
    base.pendingLoot = null;

    return base;
  }

  function buildSavePayload(stateObj) {
    return {
      saveVersion: S.SAVE_VERSION,
      player: stateObj.player,
      backpack: stateObj.backpack,
      cargo: stateObj.cargo,
      equipment: stateObj.equipment,
      globalScore: stateObj.globalScore,
      cooldowns: stateObj.cooldowns,
      upgrades: stateObj.upgrades,
      preferences: stateObj.preferences,
      booksUnlocked: stateObj.booksUnlocked,
      storyFlags: stateObj.storyFlags,
      lastMissionRecap: stateObj.lastMissionRecap,
      stats: stateObj.stats
    };
  }

  function exportSaveCode() {
    var json = JSON.stringify(buildSavePayload(S.state));
    var bytes = utf8Encode(json);
    var payload = bytesToBase62(bytes);
    var checksum = computeChecksum(S.SAVE_PREFIX + payload);
    return S.SAVE_PREFIX + payload + checksum;
  }

  function importSaveCode(code) {
    if (typeof code !== 'string') {
      return { ok: false, message: 'Inserisci un codice di salvataggio valido.' };
    }
    var trimmed = code.trim();
    if (!trimmed) {
      return { ok: false, message: 'Il campo del codice è vuoto.' };
    }
    var match = trimmed.match(/^SOS(\d+)([0-9A-Za-z]+)([0-9A-Fa-f]{8})$/);
    if (!match) {
      return {
        ok: false,
        message: 'Formato non valido: il codice deve iniziare con ' + S.SAVE_PREFIX + ' ed essere alfanumerico.'
      };
    }

    var version = toInt(match[1], 0);
    if (version < 1 || version > S.SAVE_VERSION) {
      return {
        ok: false,
        message: 'Versione salvataggio SOS' + version + ' non supportata da questa build.'
      };
    }

    var payload = match[2];
    var givenChecksum = match[3].toUpperCase();
    var expectedChecksum = computeChecksum('SOS' + version + payload);
    if (givenChecksum !== expectedChecksum) {
      return {
        ok: false,
        message: 'Checksum non corrispondente: il codice risulta alterato o incompleto.'
      };
    }

    try {
      var bytes = base62ToBytes(payload);
      var jsonStr = utf8Decode(bytes);
      var parsed = JSON.parse(jsonStr);
      if (parsed.saveVersion === undefined) {
        parsed.saveVersion = version;
      }
      S.state = migrateSave(parsed);
      notifyUI();
      return {
        ok: true,
        message: 'Salvataggio SOS' + version + ' caricato con successo (' + S.state.player.name + ', Liv. ' + S.state.player.level + ').'
      };
    } catch (err) {
      return {
        ok: false,
        message: 'Impossibile decodificare i dati del salvataggio.'
      };
    }
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

  function init() {
    if (!S.state) {
      S.state = createInitialState();
    }
    if (S.ui && typeof S.ui.init === 'function') {
      S.ui.init();
    }
    notifyUI();
  }

  // Esposizione API pubblica sul namespace IIFE
  S.state = createInitialState();
  S.toInt = toInt;
  S.clampInt = clampInt;
  S.randomInt = randomInt;
  S.formatNumber = formatNumber;
  S.formatDuration = formatDuration;
  S.createInitialState = createInitialState;
  S.getLevelData = getLevelData;
  S.getPlanet = getPlanet;
  S.getItemWeight = getItemWeight;
  S.getBackpackItemsWeight = getBackpackItemsWeight;
  S.getBackpackAmmoWeight = getBackpackAmmoWeight;
  S.getBackpackTotalWeight = getBackpackTotalWeight;
  S.getBackpackFreeWeight = getBackpackFreeWeight;
  S.getCargoMaxWeight = getCargoMaxWeight;
  S.getCargoItemsWeight = getCargoItemsWeight;
  S.getCargoFreeWeight = getCargoFreeWeight;
  S.getCargoUpgradeInfo = getCargoUpgradeInfo;
  S.getCooldownRemaining = getCooldownRemaining;
  S.isMissionUnlocked = isMissionUnlocked;
  S.setActiveTab = setActiveTab;
  S.selectMission = selectMission;
  S.cancelSelectedMission = cancelSelectedMission;
  S.getRenameTokenCount = getRenameTokenCount;
  S.hasRenameToken = hasRenameToken;
  S.renamePlayer = renamePlayer;

  // Step 2
  S.useRegenChamber = useRegenChamber;
  S.claimSupplyCapsule = claimSupplyCapsule;
  S.transferAmmo = transferAmmo;
  S.transferItem = transferItem;
  S.getRepairTargetsForItem = getRepairTargetsForItem;
  S.useItem = useItem;
  S.equipFromStorage = equipFromStorage;
  S.unequipSlot = unequipSlot;
  S.sellStorageEquip = sellStorageEquip;
  S.upgradeCargo = upgradeCargo;

  // Step 3
  S.startSelectedMission = startSelectedMission;
  S.shootAlien = shootAlien;
  S.attemptEscape = attemptEscape;
  S.completeMission = completeMission;
  S.setLootColumnsPreference = setLootColumnsPreference;
  S.getPendingLootStats = getPendingLootStats;
  S.canMoveLootEntry = canMoveLootEntry;
  S.moveLootEntry = moveLootEntry;
  S.toggleLootDropDestination = toggleLootDropDestination;
  S.splitLootEntry = splitLootEntry;
  S.restoreGroundEntry = restoreGroundEntry;
  S.commitPendingLoot = commitPendingLoot;

  // Salvataggio & ciclo vita
  S.migrateSave = migrateSave;
  S.exportSaveCode = exportSaveCode;
  S.importSaveCode = importSaveCode;
  S.onStateChange = onStateChange;
  S.notifyUI = notifyUI;
  S.init = init;

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
})();
