// js/loot.js
(function () {
  'use strict';

  var S = (window.Survival = window.Survival || {});

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
    var startBpWeight = S.getBackpackTotalWeight();
    var ammoWeight = S.getBackpackAmmoWeight();
    var bpMax = S.state.backpack.maxWeight;
    var startCargoWeight = S.getCargoItemsWeight();
    var cargoMax = S.getCargoMaxWeight();

    var entries = [];
    var nextId = 1;
    var k, qty, def;

    var bpItems = S.state.backpack.items || {};
    for (k in bpItems) {
      if (Object.prototype.hasOwnProperty.call(bpItems, k) && S.ITEMS[k]) {
        qty = S.toInt(bpItems[k], 0);
        if (qty > 0) {
          def = S.ITEMS[k];
          entries.push({
            entryId: 'L-' + (nextId++),
            kind: 'item',
            id: def.id,
            name: def.name,
            icon: def.icon || '',
            weight: S.toInt(def.weight, 0),
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
        qty = S.toInt(cargoItems[k], 0);
        if (qty > 0) {
          def = S.ITEMS[k];
          entries.push({
            entryId: 'L-' + (nextId++),
            kind: 'item',
            id: def.id,
            name: def.name,
            icon: def.icon || '',
            weight: S.toInt(def.weight, 0),
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
      unitW = Math.max(0, S.toInt(item.weight, 0));
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
      w = Math.max(0, S.toInt(e.weight, 0)) * Math.max(0, S.toInt(e.qty, 0));
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
    var target = S.toInt(targetList, 0);
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
    var count = Math.max(1, S.toInt(qtyToAdd, 1));
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
    var target = S.toInt(targetList, 0);
    if (!draft || !found) {
      return { ok: false, message: 'Elemento bottino non trovato.' };
    }
    var e = found.entry;
    if (!canMoveLootEntry(entryId, target)) {
      return { ok: false, message: 'Spostamento non consentito tra queste due liste.' };
    }

    var stats = getPendingLootStats();
    var qtyStep = moveQty === 'all' ? e.qty : Math.min(e.qty, Math.max(1, S.toInt(moveQty, 1)));
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
    S.notifyUI();
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
      return { ok: false, message: 'Spazio insufficiente nella Stiva (' + S.formatNumber(totalW) + ' pt. richiesti).' };
    }
    if (nextDest === 'backpack' && stats.bpFree < totalW) {
      return { ok: false, message: 'Spazio insufficiente nello Zaino (' + S.formatNumber(totalW) + ' pt. richiesti).' };
    }

    e.dest = nextDest;
    S.notifyUI();
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
    S.notifyUI();
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
            inst = S.makeEquipInstance(e.uid, eqModel.id, e.maxDd);
            if (inst) {
              S.state.equipment.storage.push(inst);
            }
          }
        }
      } else if (e.kind === 'item' && e.qty > 0) {
        if (e.list === 3 || (e.list === 2 && e.dest === 'backpack')) {
          S.addItemToMap(nextBp, e.id, e.qty);
        } else if (e.list === 4 || (e.list === 2 && e.dest === 'cargo')) {
          S.addItemToMap(nextCargo, e.id, e.qty);
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
    S.notifyUI();
    return { ok: true };
  }

  S.buildDropsSummaryFromDraft = buildDropsSummaryFromDraft;
  S.createPendingLootDraft = createPendingLootDraft;
  S.getPendingLootStats = getPendingLootStats;
  S.canMoveLootEntry = canMoveLootEntry;
  S.moveLootEntry = moveLootEntry;
  S.toggleLootDropDestination = toggleLootDropDestination;
  S.splitLootEntry = splitLootEntry;
  S.restoreGroundEntry = restoreGroundEntry;
  S.commitPendingLoot = commitPendingLoot;
})();
