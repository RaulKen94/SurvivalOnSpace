// js/inventory.js
(function () {
  'use strict';

  var S = (window.Survival = window.Survival || {});

  function getItemWeight(itemId) {
    var def = S.ITEMS[itemId];
    return def ? S.toInt(def.weight, 0) : 0;
  }

  function getItemsWeight(itemsMap) {
    var total = 0;
    var key, qty;
    if (!itemsMap || typeof itemsMap !== 'object') {
      return 0;
    }
    for (key in itemsMap) {
      if (Object.prototype.hasOwnProperty.call(itemsMap, key) && S.ITEMS[key]) {
        qty = Math.max(0, S.toInt(itemsMap[key], 0));
        total += getItemWeight(key) * qty;
      }
    }
    return total;
  }

  function getBackpackItemsWeight() {
    return getItemsWeight(S.state.backpack.items);
  }

  function getBackpackAmmoWeight() {
    return Math.max(0, S.toInt(S.state.backpack.ammo, 0)) * S.AMMO_WEIGHT;
  }

  function getBackpackTotalWeight() {
    return getBackpackItemsWeight() + getBackpackAmmoWeight();
  }

  function getBackpackFreeWeight() {
    return Math.max(0, S.state.backpack.maxWeight - getBackpackTotalWeight());
  }

  function getCargoMaxWeight() {
    var level = Math.max(0, S.toInt(S.state.upgrades.cargoLevel, 0));
    return S.CARGO_DEFAULT_WEIGHT + level * S.CARGO_UPGRADE_STEP;
  }

  function getCargoItemsWeight() {
    return getItemsWeight(S.state.cargo.items);
  }

  function getCargoFreeWeight() {
    return Math.max(0, getCargoMaxWeight() - getCargoItemsWeight());
  }

  function getCargoUpgradeInfo() {
    var lvl = Math.max(0, S.toInt(S.state.upgrades.cargoLevel, 0));
    var costs = S.CARGO_UPGRADE_COSTS || [];
    var maxLevel = costs.length;
    var isMaxed = lvl >= maxLevel;
    var currentMax = getCargoMaxWeight();
    return {
      level: lvl,
      maxLevel: maxLevel,
      isMaxed: isMaxed,
      nextCost: isMaxed ? null : S.toInt(costs[lvl], 0),
      currentMaxWeight: currentMax,
      nextMaxWeight: isMaxed ? currentMax : currentMax + S.CARGO_UPGRADE_STEP
    };
  }

  function getCooldownRemaining(kind) {
    var readyAt = 0;
    if (kind === 'regen') {
      readyAt = S.toInt(S.state.cooldowns.regenReadyAt, 0);
    } else if (kind === 'supply') {
      readyAt = S.toInt(S.state.cooldowns.supplyReadyAt, 0);
    }
    var diffMs = readyAt - Date.now();
    if (diffMs <= 0) {
      return 0;
    }
    return Math.ceil(diffMs / 1000);
  }

  function getRenameTokenCount() {
    var cargoCount = Math.max(0, S.toInt(S.state.cargo.items.chip_identita, 0));
    var packCount = Math.max(0, S.toInt(S.state.backpack.items.chip_identita, 0));
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
    if (S.toInt(S.state.cargo.items.chip_identita, 0) > 0) {
      S.removeItemFromMap(S.state.cargo.items, 'chip_identita', 1);
    } else if (S.toInt(S.state.backpack.items.chip_identita, 0) > 0) {
      S.removeItemFromMap(S.state.backpack.items, 'chip_identita', 1);
    } else {
      return {
        ok: false,
        message: 'Nessun Chip Cambio Identità disponibile nella Stiva o nello Zaino.'
      };
    }
    S.state.player.name = clean;
    S.notifyUI();
    return { ok: true, message: 'Identità aggiornata: ' + clean };
  }

  function useRegenChamber() {
    if (S.state.mission.active) {
      return { ok: false, message: 'Non puoi usare la Camera di Rigenerazione in missione.' };
    }
    var rem = getCooldownRemaining('regen');
    if (rem > 0) {
      return { ok: false, message: 'Camera di Rigenerazione in ricarica (' + S.formatDuration(rem) + ').' };
    }
    var lv = S.getLevelData(S.state.player.level);
    if (S.state.player.hp >= lv.maxHp && S.state.player.shield >= lv.maxShield) {
      return { ok: false, message: 'Vita e Scudo sono già al massimo.' };
    }
    S.state.player.hp = lv.maxHp;
    S.state.player.shield = lv.maxShield;
    S.state.cooldowns.regenReadyAt = Date.now() + S.COOLDOWN_TARGETS.regen * 1000;
    S.state.stats.regenUsed += 1;
    S.notifyUI();
    return { ok: true, message: 'Rigenerazione completata: Vita e Scudo ripristinati al 100%.' };
  }

  function pickSupplyBonusItem() {
    var pool = (S.SUPPLY_CAPSULE_CONFIG && S.SUPPLY_CAPSULE_CONFIG.bonusPool) || [];
    var totalWeight = 0;
    var i;
    for (i = 0; i < pool.length; i += 1) {
      totalWeight += S.toInt(pool[i].weight, 0);
    }
    if (totalWeight <= 0) {
      return 'snack_70g';
    }
    var roll = S.randomInt(1, totalWeight);
    var acc = 0;
    for (i = 0; i < pool.length; i += 1) {
      acc += S.toInt(pool[i].weight, 0);
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
      return { ok: false, message: 'Capsula Rifornimenti in ricarica (' + S.formatDuration(rem) + ').' };
    }
    var cfg = S.SUPPLY_CAPSULE_CONFIG;
    if (getBackpackFreeWeight() < cfg.minFreeWeightRequired && getCargoFreeWeight() < cfg.minFreeWeightRequired) {
      return {
        ok: false,
        message: 'Libera almeno ' + cfg.minFreeWeightRequired + ' pt. nello Zaino o nella Stiva prima di aprire la capsula.'
      };
    }

    var ammo = S.randomInt(cfg.ammoMin, cfg.ammoMax);
    var itemId = pickSupplyBonusItem();
    var itemDef = S.ITEMS[itemId];
    var destLabel = 'Stiva';

    S.state.cargo.ammo += ammo;

    if (itemDef) {
      if (getBackpackFreeWeight() >= itemDef.weight) {
        S.addItemToMap(S.state.backpack.items, itemId, 1);
        destLabel = 'Zaino';
      } else if (getCargoFreeWeight() >= itemDef.weight) {
        S.addItemToMap(S.state.cargo.items, itemId, 1);
        destLabel = 'Stiva';
      }
    }

    S.state.cooldowns.supplyReadyAt = Date.now() + S.COOLDOWN_TARGETS.supply * 1000;
    S.state.stats.suppliesClaimed += 1;
    S.notifyUI();

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
      var cargoAvail = Math.max(0, S.toInt(S.state.cargo.ammo, 0));
      if (cargoAvail <= 0) {
        return { ok: false, message: 'Nessuna munizione disponibile in Stiva.' };
      }
      var maxByWeight = Math.floor(getBackpackFreeWeight() / S.AMMO_WEIGHT);
      if (maxByWeight <= 0) {
        return { ok: false, message: 'Zaino pieno: nessun peso disponibile.' };
      }
      var wantedBp = amount === 'max' ? Math.min(cargoAvail, maxByWeight) : S.toInt(amount, 0);
      qty = Math.min(wantedBp, cargoAvail, maxByWeight);
      if (qty <= 0) {
        return { ok: false, message: 'Quantità non valida.' };
      }
      S.state.cargo.ammo -= qty;
      S.state.backpack.ammo += qty;
      S.notifyUI();
      return { ok: true, qty: qty, message: 'Trasferite +' + S.formatNumber(qty) + ' munizioni nello Zaino.' };
    }

    if (direction === 'toCargo') {
      var bpAvail = Math.max(0, S.toInt(S.state.backpack.ammo, 0));
      if (bpAvail <= 0) {
        return { ok: false, message: 'Nessuna munizione nello Zaino.' };
      }
      var wantedCargo = amount === 'max' ? bpAvail : S.toInt(amount, 0);
      qty = Math.min(wantedCargo, bpAvail);
      if (qty <= 0) {
        return { ok: false, message: 'Quantità non valida.' };
      }
      S.state.backpack.ammo -= qty;
      S.state.cargo.ammo += qty;
      S.notifyUI();
      return { ok: true, qty: qty, message: 'Depositate ' + S.formatNumber(qty) + ' munizioni nella Stiva.' };
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
    var avail = Math.max(0, S.toInt(srcMap[itemId], 0));
    if (avail <= 0) {
      return { ok: false, message: 'Oggetto non disponibile nella sorgente.' };
    }

    var wanted = qty === 'all' ? avail : Math.max(1, S.toInt(qty, 1));
    var freeW = isToBackpack ? getBackpackFreeWeight() : getCargoFreeWeight();
    var maxFit = def.weight === 0 ? avail : Math.floor(freeW / def.weight);
    var actual = Math.min(avail, wanted, maxFit);

    if (actual <= 0) {
      return {
        ok: false,
        message: (isToBackpack ? 'Zaino' : 'Stiva') + ' troppo piena per spostare ' + def.name + ' (' + def.weight + ' pt.).'
      };
    }

    S.removeItemFromMap(srcMap, itemId, actual);
    S.addItemToMap(dstMap, itemId, actual);
    S.notifyUI();
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
        amount = Math.min(missing, S.toInt(rawAmt, 0));
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
    if (S.toInt(srcMap[itemId], 0) <= 0) {
      return { ok: false, message: 'Non possiedi ' + def.name + ' in questa sezione.' };
    }

    var lv = S.getLevelData(S.state.player.level);
    var eff = def.effect || {};
    var msg = '';

    if (eff.type === 'heal_flat') {
      if (S.state.player.hp >= lv.maxHp) {
        return { ok: false, message: 'La Vita è già al massimo.' };
      }
      var prevHp = S.state.player.hp;
      S.state.player.hp = Math.min(lv.maxHp, S.state.player.hp + S.toInt(eff.value, 0));
      S.removeItemFromMap(srcMap, itemId, 1);
      msg = def.name + ': +' + (S.state.player.hp - prevHp) + ' Vita.';
    } else if (eff.type === 'heal_pct') {
      if (S.state.player.hp >= lv.maxHp) {
        return { ok: false, message: 'La Vita è già al massimo.' };
      }
      var pctHeal = Math.max(1, Math.round((lv.maxHp * S.toInt(eff.value, 0)) / 100));
      var beforeHp = S.state.player.hp;
      S.state.player.hp = Math.min(lv.maxHp, S.state.player.hp + pctHeal);
      S.removeItemFromMap(srcMap, itemId, 1);
      msg = def.name + ': +' + (S.state.player.hp - beforeHp) + ' Vita.';
    } else if (eff.type === 'shield_flat') {
      if (S.state.player.shield >= lv.maxShield) {
        return { ok: false, message: 'Lo Scudo è già al massimo.' };
      }
      var beforeShield = S.state.player.shield;
      S.state.player.shield = Math.min(lv.maxShield, S.state.player.shield + S.toInt(eff.value, 0));
      S.removeItemFromMap(srcMap, itemId, 1);
      msg = def.name + ': +' + (S.state.player.shield - beforeShield) + ' Scudo.';
    } else if (eff.type === 'add_ammo') {
      var ammoAdd = Math.max(0, S.toInt(eff.value, 0));
      if (source === 'backpack') {
        var projectedWeight = getBackpackTotalWeight() - def.weight + ammoAdd * S.AMMO_WEIGHT;
        if (projectedWeight > S.state.backpack.maxWeight) {
          return { ok: false, message: 'Peso dello Zaino insufficiente per aprire il caricatore.' };
        }
        S.removeItemFromMap(srcMap, itemId, 1);
        S.state.backpack.ammo += ammoAdd;
        msg = 'Caricato +' + ammoAdd + ' Munizioni nello Zaino.';
      } else {
        S.removeItemFromMap(srcMap, itemId, 1);
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
      S.removeItemFromMap(srcMap, itemId, 1);
      msg = eqModel.name + ' (' + found.inst.uid + '): +' + (found.inst.dd - beforeDd) + ' Dd (' + found.inst.dd + '/' + eqModel.maxDd + ').';
    } else {
      return { ok: false, message: 'Questo oggetto non può essere usato direttamente.' };
    }

    S.notifyUI();
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
    S.notifyUI();
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
    S.notifyUI();
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
    var price = model ? S.toInt(model.sellPrice, 0) : 0;
    list.splice(idx, 1);
    S.state.player.credits += price;
    S.state.stats.creditsEarned += price;
    S.notifyUI();
    return {
      ok: true,
      credits: price,
      message: 'Venduto ' + (model ? model.name : target.uid) + ' per +' + S.formatNumber(price) + ' Crediti.'
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
        message: 'Crediti insufficienti: servono ' + S.formatNumber(info.nextCost) + ' Crediti.'
      };
    }
    S.state.player.credits -= info.nextCost;
    S.state.upgrades.cargoLevel += 1;
    S.state.cargo.maxWeight = getCargoMaxWeight();
    S.notifyUI();
    return {
      ok: true,
      message: 'Stiva potenziata al Livello ' + S.state.upgrades.cargoLevel + ' (' + S.formatNumber(S.state.cargo.maxWeight) + ' pt.).'
    };
  }

  S.getItemWeight = getItemWeight;
  S.getItemsWeight = getItemsWeight;
  S.getBackpackItemsWeight = getBackpackItemsWeight;
  S.getBackpackAmmoWeight = getBackpackAmmoWeight;
  S.getBackpackTotalWeight = getBackpackTotalWeight;
  S.getBackpackFreeWeight = getBackpackFreeWeight;
  S.getCargoMaxWeight = getCargoMaxWeight;
  S.getCargoItemsWeight = getCargoItemsWeight;
  S.getCargoFreeWeight = getCargoFreeWeight;
  S.getCargoUpgradeInfo = getCargoUpgradeInfo;
  S.getCooldownRemaining = getCooldownRemaining;
  S.getRenameTokenCount = getRenameTokenCount;
  S.hasRenameToken = hasRenameToken;
  S.renamePlayer = renamePlayer;
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
})();
