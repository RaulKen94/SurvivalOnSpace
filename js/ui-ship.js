// js/ui-ship.js
(function () {
  'use strict';

  var S = (window.Survival = window.Survival || {});
  var U = (S.ui = S.ui || {});

  function renderStorageEquipSection() {
    var list = S.state.equipment.storage || [];
    if (list.length === 0) {
      return '<p class="section-subtitle" style="margin-top:10px;">Deposito equipaggiamenti vuoto. Trova nuovi pezzi Avanzati completando le missioni o rimuovi quelli indossati.</p>';
    }
    var html = '<div class="storage-equip-grid">';
    var i, inst, model, slotMeta, ddPct, isBroken, slotTitle;
    for (i = 0; i < list.length; i += 1) {
      inst = list[i];
      model = S.EQUIP_MODELS[inst.modelId];
      slotMeta = model ? S.EQUIP_SLOTS[model.slot] : null;
      if (!model || !slotMeta) {
        continue;
      }
      ddPct = U.percentInt(inst.dd, model.maxDd);
      isBroken = inst.dd <= 0;
      slotTitle = (slotMeta.icon ? slotMeta.icon + ' ' : '') + slotMeta.label;
      html += (
        '<div class="equip-card ' + slotMeta.cssClass + (isBroken ? ' equip-broken' : '') + '">' +
          '<div class="equip-slot-label">' +
            '<span>' + U.escapeHtml(slotTitle) + '</span>' +
            '<span>' + U.escapeHtml(inst.uid) + '</span>' +
          '</div>' +
          '<div class="equip-model-name">' + U.escapeHtml(model.name) + '</div>' +
          '<div class="equip-stats-row">' +
            '<span>Pt: ' + S.formatNumber(model.score) + '</span>' +
            '<span>Dd: ' + S.formatNumber(inst.dd) + ' / ' + S.formatNumber(model.maxDd) + '</span>' +
          '</div>' +
          '<div class="progress-track"><div class="progress-fill fill-dd" style="width:' + ddPct + '%"></div></div>' +
          '<div class="equip-card-foot">' +
            (isBroken ? '<span class="badge badge-danger">ROTTO</span>' : '<span></span>') +
            '<div class="btn-row" style="gap:6px;">' +
              '<button type="button" class="btn btn-primary btn-sm" data-equip-uid="' + U.escapeHtml(inst.uid) + '">Equipaggia</button>' +
              '<button type="button" class="btn btn-warn btn-sm" data-sell-uid="' + U.escapeHtml(inst.uid) + '">Vendi (' + U.icon('stats', 'credits') + ' +' + S.formatNumber(model.sellPrice) + ')</button>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }
    html += '</div>';
    return html;
  }

  function renderInventoryList(sourceKey, itemsMap, emptyText) {
    var keys = Object.keys(itemsMap || {});
    if (keys.length === 0) {
      return '<p class="section-subtitle" style="margin-top:10px;">' + U.escapeHtml(emptyText) + '</p>';
    }
    var isBackpack = sourceKey === 'backpack';
    var moveDir = isBackpack ? 'toCargo' : 'toBackpack';
    var destText = isBackpack ? U.icon('modules', 'cargo') + ' Stiva' : U.icon('modules', 'backpack') + ' Zaino';
    var destFree = isBackpack ? S.getCargoFreeWeight() : S.getBackpackFreeWeight();
    var tp = S.uiState.transferPicker;

    var html = '<div class="inv-item-list">';
    var i, id, qty, def, lineWeight, useBtnHtml, itemIcon, isOpen, maxFit, maxMovable, curQty, hasStep10, pickerHtml;
    for (i = 0; i < keys.length; i += 1) {
      id = keys[i];
      qty = S.toInt(itemsMap[id], 0);
      def = S.ITEMS[id];
      if (!def || qty <= 0) {
        continue;
      }
      lineWeight = def.weight * qty;
      itemIcon = def.icon ? def.icon + ' ' : '';
      if (id === 'chip_identita') {
        useBtnHtml = '<button type="button" class="btn btn-ghost btn-sm" data-nav-tab="options">Usa in Opzioni</button>';
      } else {
        useBtnHtml = '<button type="button" class="btn btn-sm" data-use-item="' + sourceKey + '|' + U.escapeHtml(id) + '">Usa</button>';
      }

      isOpen = Boolean(tp && tp.source === sourceKey && tp.itemId === id);
      pickerHtml = '';
      if (isOpen) {
        maxFit = def.weight === 0 ? qty : Math.floor(destFree / def.weight);
        maxMovable = Math.min(qty, maxFit);
        if (maxMovable <= 0) {
          curQty = 0;
        } else {
          curQty = S.clampInt(tp.qty, 1, maxMovable, 1);
          tp.qty = curQty;
        }
        hasStep10 = qty > 10;

        pickerHtml = (
          '<div class="transfer-picker">' +
            '<div class="transfer-picker-head">' +
              '<span>Sposta in ' + destText + ':</span>' +
              (maxMovable > 0
                ? '<span class="weight-text" data-transfer-weight="1">' + S.formatNumber(curQty * def.weight) + ' pt.</span>'
                : '<span class="badge badge-danger">Spazio insufficiente</span>') +
            '</div>' +
            '<div class="transfer-picker-grid' + (hasStep10 ? ' has-step10' : '') + '">' +
              (hasStep10 ? '<button type="button" class="btn btn-ghost btn-sm" data-transfer-delta="-10"' + (maxMovable <= 0 ? ' disabled' : '') + '>-10</button>' : '') +
              '<button type="button" class="btn btn-ghost btn-sm" data-transfer-delta="-1"' + (maxMovable <= 0 ? ' disabled' : '') + '>-1</button>' +
              '<input type="number" class="transfer-qty-input" min="' + (maxMovable > 0 ? 1 : 0) + '" max="' + maxMovable + '" value="' + curQty + '" data-transfer-input="1" aria-label="Quantità da spostare"' + (maxMovable <= 0 ? ' disabled' : '') + '>' +
              '<button type="button" class="btn btn-ghost btn-sm" data-transfer-delta="1"' + (maxMovable <= 0 ? ' disabled' : '') + '>+1</button>' +
              (hasStep10 ? '<button type="button" class="btn btn-ghost btn-sm" data-transfer-delta="10"' + (maxMovable <= 0 ? ' disabled' : '') + '>+10</button>' : '') +
              '<button type="button" class="btn btn-ghost btn-sm" data-transfer-delta="max"' + (maxMovable <= 0 ? ' disabled' : '') + '>Max</button>' +
            '</div>' +
            '<div class="transfer-picker-actions">' +
              '<button type="button" class="btn btn-primary btn-sm" data-transfer-confirm="' + moveDir + '|' + U.escapeHtml(id) + '"' + (maxMovable <= 0 ? ' disabled' : '') + '>Sposta</button>' +
              '<button type="button" class="btn btn-ghost btn-sm" data-transfer-cancel="1">Annulla</button>' +
            '</div>' +
          '</div>'
        );
      }

      html += (
        '<div class="inv-item-card">' +
          '<div class="inv-item-row">' +
            '<div class="inv-item-info inv-item-clickable" data-toggle-transfer="' + sourceKey + '|' + U.escapeHtml(id) + '" title="Clicca per spostare">' +
              '<span class="inv-item-title-line"><strong>' + U.escapeHtml(itemIcon + def.name) + '</strong> <span class="item-qty">×' + S.formatNumber(qty) + '</span> · <span class="weight-text">' + S.formatNumber(lineWeight) + ' pt.</span></span>' +
              '<span class="inv-item-sub">' + U.escapeHtml(def.description) + '</span>' +
            '</div>' +
            '<div class="inv-item-actions">' +
              useBtnHtml +
            '</div>' +
          '</div>' +
          pickerHtml +
        '</div>'
      );
    }
    html += '</div>';
    return html;
  }

  function renderBackpackCargoSection() {
    var bpItemsW = S.getBackpackItemsWeight();
    var bpAmmoW = S.getBackpackAmmoWeight();
    var bpTotalW = S.getBackpackTotalWeight();
    var bpMaxW = S.state.backpack.maxWeight;
    var bpAmmoPct = U.percentInt(bpAmmoW, bpMaxW);
    var bpItemsPct = Math.min(100 - bpAmmoPct, U.percentInt(bpItemsW, bpMaxW));

    var cargoItemsW = S.getCargoItemsWeight();
    var cargoMaxW = S.getCargoMaxWeight();
    var cargoPct = U.percentInt(cargoItemsW, cargoMaxW);

    return (
      '<div class="grid-2">' +
        '<div class="panel">' +
          '<div class="panel-title">' +
            '<span>' + U.icon('modules', 'backpack') + ' Zaino (Equipaggiato in Missione)</span>' +
            '<span class="weight-text">' + S.formatNumber(bpTotalW) + ' / ' + S.formatNumber(bpMaxW) + ' pt.</span>' +
          '</div>' +
          '<div class="progress-track" style="height:9px; margin-bottom:8px;">' +
            '<div class="progress-fill fill-ammo" style="width:' + bpAmmoPct + '%" title="Munizioni"></div>' +
            '<div class="progress-fill fill-items" style="width:' + bpItemsPct + '%" title="Oggetti"></div>' +
          '</div>' +
          '<div class="mission-option-meta">' +
            '<span>' + U.icon('stats', 'ammo') + ' Munizioni: <strong class="val-ammo">' + S.formatNumber(S.state.backpack.ammo) + '</strong> (<span class="weight-text">' + S.formatNumber(bpAmmoW) + ' pt.</span>)</span>' +
            '<span>Oggetti: <span class="weight-text">' + S.formatNumber(bpItemsW) + ' pt.</span></span>' +
          '</div>' +
          '<div class="ammo-transfer-bar">' +
            '<span class="ammo-transfer-label">Sposta ' + U.icon('stats', 'ammo') + ' Munizioni → ' + U.icon('modules', 'cargo') + ' Stiva:</span>' +
            '<div class="btn-row" style="gap:6px;">' +
              '<button type="button" class="btn btn-ghost btn-sm" data-transfer-ammo="toCargo|10">-10</button>' +
              '<button type="button" class="btn btn-ghost btn-sm" data-transfer-ammo="toCargo|30">-30</button>' +
              '<button type="button" class="btn btn-ghost btn-sm" data-transfer-ammo="toCargo|max">Tutte</button>' +
            '</div>' +
          '</div>' +
          renderInventoryList('backpack', S.state.backpack.items, 'Nessun oggetto nello Zaino.') +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-title">' +
            '<span>' + U.icon('modules', 'cargo') + ' Stiva (Riserva della Nave)</span>' +
            '<span class="weight-text">' + S.formatNumber(cargoItemsW) + ' / ' + S.formatNumber(cargoMaxW) + ' pt.</span>' +
          '</div>' +
          '<div class="progress-track" style="height:9px; margin-bottom:8px;">' +
            '<div class="progress-fill fill-items" style="width:' + cargoPct + '%"></div>' +
          '</div>' +
          '<div class="mission-option-meta">' +
            '<span>' + U.icon('stats', 'ammo') + ' Munizioni in Stiva: <strong class="val-ammo">' + S.formatNumber(S.state.cargo.ammo) + '</strong> (<span class="weight-text">Capienza ∞</span>)</span>' +
          '</div>' +
          '<div class="ammo-transfer-bar">' +
            '<span class="ammo-transfer-label">Trasferisci ' + U.icon('stats', 'ammo') + ' Munizioni → ' + U.icon('modules', 'backpack') + ' Zaino:</span>' +
            '<div class="btn-row" style="gap:6px;">' +
              '<button type="button" class="btn btn-ghost btn-sm" data-transfer-ammo="toBackpack|10">+10</button>' +
              '<button type="button" class="btn btn-ghost btn-sm" data-transfer-ammo="toBackpack|30">+30</button>' +
              '<button type="button" class="btn btn-ghost btn-sm" data-transfer-ammo="toBackpack|max">Max</button>' +
            '</div>' +
          '</div>' +
          renderInventoryList('cargo', S.state.cargo.items, 'Stiva oggetti vuota.') +
        '</div>' +
      '</div>'
    );
  }

  function renderShipTab(container) {
    var upgInfo = S.getCargoUpgradeInfo();
    var regenRem = S.getCooldownRemaining('regen');
    var supplyRem = S.getCooldownRemaining('supply');
    var hasRecap = Boolean(S.state.lastMissionRecap);
    var lastRecapLabel = hasRecap
      ? S.state.lastMissionRecap.planetName + ' (Diff. ' + S.state.lastMissionRecap.difficulty + ') · ' + S.formatNumber(S.state.lastMissionRecap.aliensKilled) + ' alieni'
      : 'Nessuna missione completata in questa sessione.';
    var isExpanded = Boolean(S.uiState.storageEquipExpanded);

    container.innerHTML = (
      '<div class="section-header">' +
        '<div>' +
          '<h1 class="section-title">' + U.icon('tabs', 'ship') + ' Nave Spaziale — Ponte Principale</h1>' +
          '<p class="section-subtitle">Home operativa di bordo. Prepara equipaggiamento, Zaino e Stiva prima di partire.</p>' +
        '</div>' +
        '<button type="button" class="btn btn-primary btn-sm" data-nav-tab="map">' + U.icon('tabs', 'map') + ' Scegli Missione in Mappa</button>' +
      '</div>' +
      '<div class="module-grid">' +
        '<div class="module-card">' +
          '<div>' +
            '<div class="module-card-head">' +
              '<h3 class="module-card-title">' + U.icon('modules', 'recap') + ' Recap Ultima Missione</h3>' +
              '<span class="badge ' + (hasRecap ? 'badge-ok' : 'badge-step') + '">' + (hasRecap ? 'Disponibile' : 'Vuoto') + '</span>' +
            '</div>' +
            '<p class="module-card-desc" style="margin-top:6px;">' + U.escapeHtml(lastRecapLabel) + '</p>' +
          '</div>' +
          '<button type="button" class="btn btn-sm" id="btn-open-last-recap"' + (hasRecap ? '' : ' disabled') + '>' + U.icon('modules', 'recap') + ' Apri Resoconto</button>' +
        '</div>' +
        '<div class="module-card">' +
          '<div>' +
            '<div class="module-card-head">' +
              '<h3 class="module-card-title">' + U.icon('modules', 'regen') + ' Camera di Rigenerazione</h3>' +
              '<span class="badge ' + (regenRem > 0 ? 'badge-warn' : 'badge-ok') + '" data-cd-label="regen">' + (regenRem > 0 ? S.formatDuration(regenRem) : 'Pronta') + '</span>' +
            '</div>' +
            '<p class="module-card-desc" style="margin-top:6px;">Ripristina al 100% ' + U.icon('stats', 'hp') + ' Vita e ' + U.icon('stats', 'shield') + ' Scudo senza consumare oggetti (ricarica 120s).</p>' +
          '</div>' +
          '<button type="button" class="btn btn-primary btn-sm" id="btn-regen-chamber" data-cd-btn="regen"' + (regenRem > 0 ? ' disabled' : '') + '>' + (regenRem > 0 ? 'In ricarica (' + S.formatDuration(regenRem) + ')' : U.icon('modules', 'regen') + ' Rigenera Tutto') + '</button>' +
        '</div>' +
        '<div class="module-card">' +
          '<div>' +
            '<div class="module-card-head">' +
              '<h3 class="module-card-title">' + U.icon('modules', 'supply') + ' Capsula Rifornimenti</h3>' +
              '<span class="badge ' + (supplyRem > 0 ? 'badge-warn' : 'badge-ok') + '" data-cd-label="supply">' + (supplyRem > 0 ? S.formatDuration(supplyRem) : 'Pronta') + '</span>' +
            '</div>' +
            '<p class="module-card-desc" style="margin-top:6px;">Consegna 25–40 ' + U.icon('stats', 'ammo') + ' Munizioni in Stiva e 1 consumabile base (ricarica 240s).</p>' +
          '</div>' +
          '<button type="button" class="btn btn-primary btn-sm" id="btn-supply-capsule" data-cd-btn="supply"' + (supplyRem > 0 ? ' disabled' : '') + '>' + (supplyRem > 0 ? 'In ricarica (' + S.formatDuration(supplyRem) + ')' : U.icon('modules', 'supply') + ' Apri Capsula') + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="panel-title">' +
          '<span>' + U.icon('modules', 'equip') + ' Equipaggiamento</span>' +
          '<button type="button" class="btn btn-ghost btn-sm" id="btn-toggle-storage-equip">Deposito: ' + S.formatNumber((S.state.equipment.storage || []).length) + ' pezzi ' + (isExpanded ? '▴' : '▾') + '</button>' +
        '</div>' +
        '<div class="grid-4">' +
          U.renderEquipSlotCard('helmet', true) +
          U.renderEquipSlotCard('suit', true) +
          U.renderEquipSlotCard('boots', true) +
          U.renderEquipSlotCard('rifle', true) +
        '</div>' +
        (isExpanded
          ? '<div class="storage-equip-drawer">' + renderStorageEquipSection() + '</div>'
          : '') +
      '</div>' +
      renderBackpackCargoSection() +
      '<div class="grid-2">' +
        '<div class="panel">' +
          '<div class="panel-title">' +
            '<span>' + U.icon('modules', 'upgrades') + ' Potenziamenti Nave</span>' +
            '<span class="badge badge-cyan">Stiva Lv. ' + S.formatNumber(upgInfo.level) + ' / ' + S.formatNumber(upgInfo.maxLevel) + '</span>' +
          '</div>' +
          '<p class="section-subtitle" style="margin-bottom:10px;">Espandi la capienza degli oggetti nella Stiva di <span class="weight-text">+100 pt.</span> per livello (attuale: <span class="weight-text">' + S.formatNumber(upgInfo.currentMaxWeight) + ' pt.</span>' + (upgInfo.isMaxed ? ' · MASSIMO' : ' → <span class="weight-text">' + S.formatNumber(upgInfo.nextMaxWeight) + ' pt.</span>') + ').</p>' +
          '<button type="button" class="btn btn-primary" id="btn-upgrade-cargo"' + (upgInfo.isMaxed || S.state.player.credits < upgInfo.nextCost ? ' disabled' : '') + '>' +
            (upgInfo.isMaxed
              ? 'Capienza Stiva al Massimo'
              : U.icon('modules', 'upgrades') + ' Potenzia Stiva (' + U.icon('stats', 'credits') + ' ' + S.formatNumber(upgInfo.nextCost) + ' Crediti)') +
          '</button>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-title"><span>' + U.icon('modules', 'library') + ' Biblioteca di bordo</span><span class="badge badge-step">Step 5</span></div>' +
          '<p class="section-subtitle">I Libri trovati durante le missioni e le esplorazioni verranno archiviati qui per la lettura integrale e sbloccheranno potenziamenti passivi permanenti.</p>' +
        '</div>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="panel-title"><span>📓 Diario di Bordo</span></div>' +
      '</div>'
    );
  }

  function refreshInventoryViews() {
    if (S.uiState.activeModalKind === 'backpack_cargo') {
      var bodyEl = document.getElementById('modal-body');
      if (bodyEl) {
        bodyEl.innerHTML = renderBackpackCargoSection();
      }
    }
    U.renderActiveTab();
  }

  function getTransferPickerLimits(source, itemId) {
    var srcMap = source === 'backpack' ? S.state.backpack.items : S.state.cargo.items;
    var avail = Math.max(0, S.toInt(srcMap && srcMap[itemId], 0));
    var def = S.ITEMS[itemId];
    if (!def || avail <= 0) {
      return { avail: 0, maxMovable: 0, weight: 0 };
    }
    var destFree = source === 'backpack' ? S.getCargoFreeWeight() : S.getBackpackFreeWeight();
    var maxFit = def.weight === 0 ? avail : Math.floor(destFree / def.weight);
    return {
      avail: avail,
      maxMovable: Math.min(avail, maxFit),
      weight: def.weight
    };
  }

  function handleInventoryAreaClick(e) {
    var navBtn = e.target.closest('[data-nav-tab]');
    if (navBtn) {
      var targetTab = navBtn.getAttribute('data-nav-tab');
      if (S.uiState.activeModalKind) {
        U.closeModal();
      }
      var navRes = S.setActiveTab(targetTab);
      if (!navRes.ok) {
        U.showToast(navRes.message, 'err');
      }
      return true;
    }

    var ammoBtn = e.target.closest('[data-transfer-ammo]');
    if (ammoBtn) {
      var ammoParts = ammoBtn.getAttribute('data-transfer-ammo').split('|');
      var ammoRes = S.transferAmmo(ammoParts[0], ammoParts[1]);
      U.showToast(ammoRes.message, ammoRes.ok ? 'ok' : 'err');
      return true;
    }

    var useBtn = e.target.closest('[data-use-item]');
    if (useBtn) {
      var uParts = useBtn.getAttribute('data-use-item').split('|');
      U.handleUseItemClick(uParts[0], uParts[1]);
      return true;
    }

    var toggleEl = e.target.closest('[data-toggle-transfer]');
    if (toggleEl) {
      var tParts = toggleEl.getAttribute('data-toggle-transfer').split('|');
      var src = tParts[0];
      var itemId = tParts[1];
      var tp = S.uiState.transferPicker;
      if (tp && tp.source === src && tp.itemId === itemId) {
        S.uiState.transferPicker = null;
      } else {
        S.uiState.transferPicker = { source: src, itemId: itemId, qty: 1 };
      }
      refreshInventoryViews();
      return true;
    }

    var deltaBtn = e.target.closest('[data-transfer-delta]');
    if (deltaBtn && S.uiState.transferPicker) {
      var tpCur = S.uiState.transferPicker;
      var lim = getTransferPickerLimits(tpCur.source, tpCur.itemId);
      if (lim.maxMovable <= 0) {
        return true;
      }
      var deltaAttr = deltaBtn.getAttribute('data-transfer-delta');
      if (deltaAttr === 'max') {
        tpCur.qty = lim.maxMovable;
      } else {
        var delta = S.toInt(deltaAttr, 0);
        tpCur.qty = S.clampInt(tpCur.qty + delta, 1, lim.maxMovable, 1);
      }
      refreshInventoryViews();
      return true;
    }

    var confirmBtn = e.target.closest('[data-transfer-confirm]');
    if (confirmBtn && S.uiState.transferPicker) {
      var cParts = confirmBtn.getAttribute('data-transfer-confirm').split('|');
      var tpConf = S.uiState.transferPicker;
      var limConf = getTransferPickerLimits(tpConf.source, tpConf.itemId);
      var qtyToMove = limConf.maxMovable > 0 ? S.clampInt(tpConf.qty, 1, limConf.maxMovable, 1) : 1;
      S.uiState.transferPicker = null;
      var moveRes = S.transferItem(cParts[1], cParts[0], qtyToMove);
      U.showToast(moveRes.message, moveRes.ok ? 'ok' : 'err');
      return true;
    }

    if (e.target.closest('[data-transfer-cancel]')) {
      S.uiState.transferPicker = null;
      refreshInventoryViews();
      return true;
    }

    return false;
  }

  function handleInventoryAreaInput(e) {
    var inputEl = e.target.closest('[data-transfer-input]');
    var tp = S.uiState.transferPicker;
    if (!inputEl || !tp) {
      return;
    }
    var lim = getTransferPickerLimits(tp.source, tp.itemId);
    if (lim.maxMovable <= 0) {
      tp.qty = 0;
      inputEl.value = '0';
      return;
    }
    var typed = S.toInt(inputEl.value, 1);
    var clamped = S.clampInt(typed, 1, lim.maxMovable, 1);
    tp.qty = clamped;
    var pickerEl = inputEl.closest('.transfer-picker');
    var weightEl = pickerEl ? pickerEl.querySelector('[data-transfer-weight]') : null;
    if (weightEl) {
      weightEl.textContent = S.formatNumber(clamped * lim.weight) + ' pt.';
    }
  }

  function handleShipClick(e) {
    if (e.target.closest('#btn-open-last-recap')) {
      if (S.state.lastMissionRecap) {
        U.openRecapModal(S.state.lastMissionRecap);
      }
      return true;
    }

    if (e.target.closest('#btn-toggle-storage-equip')) {
      S.uiState.storageEquipExpanded = !S.uiState.storageEquipExpanded;
      U.renderActiveTab();
      return true;
    }

    if (e.target.closest('#btn-regen-chamber')) {
      var regRes = S.useRegenChamber();
      U.showToast(regRes.message, regRes.ok ? 'ok' : 'err');
      return true;
    }

    if (e.target.closest('#btn-supply-capsule')) {
      var supRes = S.claimSupplyCapsule();
      U.showToast(supRes.message, supRes.ok ? 'ok' : 'err');
      return true;
    }

    var unequipBtn = e.target.closest('[data-unequip-slot]');
    if (unequipBtn) {
      var unRes = S.unequipSlot(unequipBtn.getAttribute('data-unequip-slot'));
      U.showToast(unRes.message, unRes.ok ? 'ok' : 'err');
      return true;
    }

    var equipBtn = e.target.closest('[data-equip-uid]');
    if (equipBtn) {
      var eqRes = S.equipFromStorage(equipBtn.getAttribute('data-equip-uid'));
      U.showToast(eqRes.message, eqRes.ok ? 'ok' : 'err');
      return true;
    }

    var sellBtn = e.target.closest('[data-sell-uid]');
    if (sellBtn) {
      U.openSellConfirmModal(sellBtn.getAttribute('data-sell-uid'));
      return true;
    }

    if (e.target.closest('#btn-upgrade-cargo')) {
      var upgRes = S.upgradeCargo();
      U.showToast(upgRes.message, upgRes.ok ? 'ok' : 'err');
      return true;
    }

    return false;
  }

  U.renderStorageEquipSection = renderStorageEquipSection;
  U.renderInventoryList = renderInventoryList;
  U.renderBackpackCargoSection = renderBackpackCargoSection;
  U.renderShipTab = renderShipTab;
  U.refreshInventoryViews = refreshInventoryViews;
  U.getTransferPickerLimits = getTransferPickerLimits;
  U.handleInventoryAreaClick = handleInventoryAreaClick;
  U.handleInventoryAreaInput = handleInventoryAreaInput;
  U.handleShipClick = handleShipClick;
})();
