// js/ui-core.js
(function () {
  'use strict';

  var S = (window.Survival = window.Survival || {});
  var U = (S.ui = S.ui || {});

  S.uiState = S.uiState || {
    activeModalKind: null,
    transferPicker: null,
    storageEquipExpanded: false,
    lootViewCols: 2,
    lootCarouselStart: 1,
    draggingLootEntryId: null,
    importFeedback: { text: '', ok: true },
    renameFeedback: { text: '', ok: true }
  };

  function escapeHtml(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function percentInt(part, total) {
    if (!total || total <= 0) {
      return 0;
    }
    var pct = Math.floor((part * 100) / total);
    if (pct < 0) {
      return 0;
    }
    if (pct > 100) {
      return 100;
    }
    return pct;
  }

  function showToast(message, type) {
    var root = document.getElementById('toast-root');
    if (!root) {
      return;
    }
    var toast = document.createElement('div');
    toast.className = 'toast ' + (type === 'err' ? 'toast-err' : 'toast-ok');
    toast.textContent = message;
    root.appendChild(toast);
    setTimeout(function () {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3200);
  }

  function applyModalSizeClasses(cardEl, options) {
    if (!cardEl) {
      return;
    }
    var size = options && options.size ? options.size : (options && options.wide ? 'wide' : '');
    cardEl.classList.toggle('modal-wide', size === 'wide');
    cardEl.classList.toggle('modal-xl', size === 'xl');
    cardEl.classList.toggle('modal-full', size === 'full');
  }

  function openModal(title, bodyHtml, options) {
    var root = document.getElementById('modal-root');
    var cardEl = root ? root.querySelector('.modal-card') : null;
    var titleEl = document.getElementById('modal-title');
    var bodyEl = document.getElementById('modal-body');
    if (!root || !titleEl || !bodyEl) {
      return;
    }
    S.uiState.activeModalKind = options && options.kind ? options.kind : null;
    applyModalSizeClasses(cardEl, options);
    titleEl.textContent = title;
    bodyEl.innerHTML = bodyHtml;
    root.classList.remove('hidden');
  }

  function closeModal() {
    var root = document.getElementById('modal-root');
    var cardEl = root ? root.querySelector('.modal-card') : null;
    var wasRecapWithPending = S.uiState.activeModalKind === 'mission_recap' && Boolean(S.state.pendingLoot);

    S.uiState.activeModalKind = null;
    S.uiState.transferPicker = null;
    S.uiState.draggingLootEntryId = null;
    if (cardEl) {
      cardEl.classList.remove('modal-wide', 'modal-xl', 'modal-full');
    }
    if (root) {
      root.classList.add('hidden');
    }
    if (wasRecapWithPending && typeof S.commitPendingLoot === 'function') {
      S.commitPendingLoot();
    }
  }

  function icon(group, key) {
    var icons = S.ICONS && S.ICONS[group];
    return icons && icons[key] ? icons[key] : '';
  }

  function formatRecapValue(val, prefix) {
    var n = S.toInt(val, 0);
    if (n === 0) {
      return 'N/A';
    }
    return (prefix || '') + S.formatNumber(n);
  }

  function formatGlobalScoreActive(activeKey) {
    if (!activeKey || typeof activeKey !== 'string') {
      return 'Nessuno';
    }
    var parts = activeKey.split('_');
    if (parts.length < 2) {
      return activeKey;
    }
    var diffPart = parts[parts.length - 1];
    var planetId = parts.slice(0, parts.length - 1).join('_');
    var planet = S.PLANETS && S.PLANETS[planetId] ? S.PLANETS[planetId] : null;
    var planetName = planet ? planet.name : planetId;
    return planetName + ' — Difficoltà ' + diffPart;
  }

  function formatAliensRange(mission) {
    if (!mission) {
      return '0';
    }
    if (mission.aliensMin === mission.aliensMax) {
      return S.formatNumber(mission.aliensMin);
    }
    return S.formatNumber(mission.aliensMin) + ' – ' + S.formatNumber(mission.aliensMax);
  }

  function renderFeatureBadges(features) {
    if (!features || features.length === 0) {
      return '';
    }
    var html = '';
    var i, f;
    for (i = 0; i < features.length; i += 1) {
      f = features[i];
      if (f === 'weather') {
        html += '<span class="badge badge-warn">Meteo</span> ';
      } else if (f === 'mutants') {
        html += '<span class="badge badge-purple">Alieni Mutati</span> ';
      } else if (f === 'boss') {
        html += '<span class="badge badge-danger">Boss</span> ';
      }
    }
    return html;
  }

  function renderEquipSlotCard(slotKey, allowUnequip) {
    var slotMeta = S.EQUIP_SLOTS[slotKey];
    var inst = S.state.equipment.equipped[slotKey];
    if (!slotMeta) {
      return '';
    }
    var slotTitle = (slotMeta.icon ? slotMeta.icon + ' ' : '') + slotMeta.label;
    if (!inst) {
      return (
        '<div class="equip-card ' + slotMeta.cssClass + '">' +
          '<div class="equip-slot-label">' +
            '<span>' + escapeHtml(slotTitle) + '</span>' +
          '</div>' +
          '<div class="equip-model-name">Slot vuoto</div>' +
          '<div class="equip-stats-row"><span>Pt: 0</span><span>Dd: 0 / 0</span></div>' +
        '</div>'
      );
    }
    var model = S.EQUIP_MODELS[inst.modelId];
    var ddPct = model ? percentInt(inst.dd, model.maxDd) : 0;
    var isBroken = inst.dd <= 0;

    return (
      '<div class="equip-card ' + slotMeta.cssClass + (isBroken ? ' equip-broken' : '') + '">' +
        '<div class="equip-slot-label">' +
          '<span>' + escapeHtml(slotTitle) + '</span>' +
        '</div>' +
        '<div class="equip-model-name">' + escapeHtml(model ? model.name : inst.modelId) + '</div>' +
        '<div class="equip-stats-row">' +
          '<span>Pt: ' + (model ? S.formatNumber(model.score) : 0) + ' · ' + escapeHtml(inst.uid) + '</span>' +
          '<span>Dd: ' + S.formatNumber(inst.dd) + ' / ' + (model ? S.formatNumber(model.maxDd) : 0) + '</span>' +
        '</div>' +
        '<div class="progress-track"><div class="progress-fill fill-dd" style="width:' + ddPct + '%"></div></div>' +
        (isBroken || allowUnequip
          ? '<div class="equip-card-foot">' +
              (isBroken ? '<span class="badge badge-danger">ROTTO (0 Dd)</span>' : '<span></span>') +
              (allowUnequip ? '<button type="button" class="btn btn-ghost btn-sm" data-unequip-slot="' + slotKey + '">Rimuovi</button>' : '') +
            '</div>'
          : '') +
      '</div>'
    );
  }

  function renderDropPreviewList(mission) {
    if (!mission) {
      return '';
    }
    if (!mission.dropTable || mission.dropTable.length === 0) {
      return '<p class="section-subtitle">Tabella drop per questa difficoltà in arrivo nello Step 4.</p>';
    }
    var html = '<div class="drop-list">';
    var i, entry, name, metaHtml, weightHtml, eqIcon, itemIcon;
    for (i = 0; i < mission.dropTable.length; i += 1) {
      entry = mission.dropTable[i];
      if (entry.kind === 'equip') {
        var eqModel = S.EQUIP_MODELS[entry.id];
        var eqSlot = eqModel ? S.EQUIP_SLOTS[eqModel.slot] : null;
        eqIcon = eqSlot && eqSlot.icon ? eqSlot.icon + ' ' : '';
        name = eqModel ? eqModel.name : entry.id;
        metaHtml =
          '<span class="equip-text-' + (eqSlot ? eqSlot.id : 'suit') + '"><strong>' + escapeHtml(eqIcon + name) + '</strong></span>' +
          '<span class="badge badge-cyan">Equip (' + (eqModel ? eqModel.maxDd : 0) + ' Dd)</span>';
        weightHtml = '<span class="badge badge-step">Slot</span>';
      } else {
        var itemDef = S.ITEMS[entry.id];
        itemIcon = itemDef && itemDef.icon ? itemDef.icon + ' ' : '';
        name = itemDef ? itemDef.name : entry.id;
        metaHtml = '<span><strong>' + escapeHtml(itemIcon + name) + '</strong></span>';
        weightHtml = '<span class="weight-text">' + (itemDef ? S.formatNumber(itemDef.weight) : 0) + ' pt.</span>';
      }
      html += (
        '<div class="drop-row">' +
          '<div class="drop-row-left">' + metaHtml + '</div>' +
          '<div class="drop-row-right">' +
            weightHtml +
            '<span class="drop-chance">' + S.formatNumber(entry.chance) + '%</span>' +
          '</div>' +
        '</div>'
      );
    }
    html += '</div>';
    return html;
  }

  function renderHud() {
    var hud = document.getElementById('hud-bar');
    if (!hud) {
      return;
    }
    var p = S.state.player;
    var lv = S.getLevelData(p.level);
    var planet = S.getPlanet(p.planetId);

    var expLabel = lv.nextExp
      ? S.formatNumber(p.exp) + ' / ' + S.formatNumber(lv.nextExp)
      : 'LIV. MAX';
    var expPct = lv.nextExp ? percentInt(p.exp, lv.nextExp) : 100;
    var hpPct = percentInt(p.hp, lv.maxHp);
    var shieldPct = percentInt(p.shield, lv.maxShield);

    hud.innerHTML = (
      '<div class="hud-top-row">' +
        '<div class="hud-identity">' +
          '<span class="hud-name">' + escapeHtml(p.name) + '</span>' +
          '<span class="hud-planet-pill">' + icon('stats', 'planet') + ' ' + escapeHtml(planet.name) + '</span>' +
          (S.state.mission.active ? '<span class="hud-mission-flag">' + icon('tabs', 'mission') + ' In Missione</span>' : '') +
        '</div>' +
        '<div class="hud-currencies">' +
          '<div class="hud-chip"><span class="hud-chip-label">' + icon('stats', 'credits') + ' Crediti</span><span class="hud-chip-val val-credits">' + S.formatNumber(p.credits) + '</span></div>' +
          '<div class="hud-chip"><span class="hud-chip-label">' + icon('stats', 'liquids') + ' Liquidi Plusvalenti</span><span class="hud-chip-val val-liquids">' + S.formatNumber(p.liquids) + '</span></div>' +
          '<div class="hud-chip"><span class="hud-chip-label">' + icon('stats', 'ammo') + ' Munizioni</span><span class="hud-chip-val val-ammo">' + S.formatNumber(S.state.backpack.ammo) + '</span></div>' +
        '</div>' +
      '</div>' +
      '<div class="hud-bars-grid">' +
        '<div class="stat-meter">' +
          '<div class="stat-meter-head"><span class="stat-meter-title">' + icon('stats', 'exp') + ' Livello ' + S.formatNumber(p.level) + ' · EXP</span><span class="stat-meter-value">' + expLabel + '</span></div>' +
          '<div class="progress-track"><div class="progress-fill fill-exp" style="width:' + expPct + '%"></div></div>' +
        '</div>' +
        '<div class="stat-meter">' +
          '<div class="stat-meter-head"><span class="stat-meter-title">' + icon('stats', 'hp') + ' Vita</span><span class="stat-meter-value">' + S.formatNumber(p.hp) + ' / ' + S.formatNumber(lv.maxHp) + '</span></div>' +
          '<div class="progress-track"><div class="progress-fill fill-hp" style="width:' + hpPct + '%"></div></div>' +
        '</div>' +
        '<div class="stat-meter">' +
          '<div class="stat-meter-head"><span class="stat-meter-title">' + icon('stats', 'shield') + ' Scudo</span><span class="stat-meter-value">' + S.formatNumber(p.shield) + ' / ' + S.formatNumber(lv.maxShield) + '</span></div>' +
          '<div class="progress-track"><div class="progress-fill fill-shield" style="width:' + shieldPct + '%"></div></div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderTabs() {
    var nav = document.getElementById('tab-bar');
    if (!nav) {
      return;
    }
    var active = S.state.ui.activeTab;
    var inMission = S.state.mission.active;
    var selectedDiff = S.state.mission.selectedDifficulty;
    var buttons = nav.querySelectorAll('.tab-btn');
    var i, btn, tabId, isCurrent, isLocked, labelText;
    var labels = {
      map: icon('tabs', 'map') + ' Mappa',
      mission: icon('tabs', 'mission') + ' Missione',
      ship: icon('tabs', 'ship') + ' Nave Spaziale',
      options: icon('tabs', 'options') + ' Opzioni'
    };

    for (i = 0; i < buttons.length; i += 1) {
      btn = buttons[i];
      tabId = btn.getAttribute('data-tab');
      isCurrent = tabId === active;
      isLocked = inMission && tabId !== 'mission';

      btn.classList.toggle('active', isCurrent);
      btn.classList.toggle('locked-by-mission', isLocked);
      btn.disabled = isLocked;

      labelText = labels[tabId] || tabId;
      if (tabId === 'mission' && selectedDiff > 0 && !inMission) {
        btn.innerHTML = '<span>' + escapeHtml(labelText) + '</span><span class="tab-indicator" title="Missione selezionata"></span>';
      } else {
        btn.textContent = labelText;
      }
    }
  }

  function openRepairTargetModal(res) {
    var itemDef = S.ITEMS[res.itemId];
    var html = '<p class="section-subtitle">Scegli l\'equipaggiamento su cui applicare <strong>' + escapeHtml(itemDef ? itemDef.name : res.itemId) + '</strong>:</p><div class="target-pick-list">';
    var i, t;
    for (i = 0; i < res.targets.length; i += 1) {
      t = res.targets[i];
      html += (
        '<button type="button" class="target-pick-btn" data-repair-pick="' + escapeHtml(res.source) + '|' + escapeHtml(res.itemId) + '|' + escapeHtml(t.uid) + '">' +
          '<span><strong class="equip-text-' + escapeHtml(t.slot) + '">' + escapeHtml(t.name) + '</strong> (' + escapeHtml(t.uid) + ' · ' + (t.location === 'equipped' ? 'Indossato' : 'Deposito') + ')</span>' +
          '<span class="mono">Dd ' + S.formatNumber(t.dd) + ' → ' + S.formatNumber(t.dd + t.repairAmount) + ' / ' + S.formatNumber(t.maxDd) + '</span>' +
        '</button>'
      );
    }
    html += '</div>';
    openModal('Seleziona Bersaglio Riparazione', html);
  }

  function openSellConfirmModal(uid) {
    var list = S.state.equipment.storage || [];
    var inst = null;
    var i;
    for (i = 0; i < list.length; i += 1) {
      if (list[i].uid === uid) {
        inst = list[i];
        break;
      }
    }
    if (!inst) {
      showToast('Equipaggiamento non trovato.', 'err');
      return;
    }
    var model = S.EQUIP_MODELS[inst.modelId];
    if (!model) {
      return;
    }
    var html = (
      '<p class="section-subtitle" style="margin-bottom:12px;">Vuoi vendere definitivamente <strong class="equip-text-' + escapeHtml(model.slot) + '">' + escapeHtml(model.name) + '</strong> (' + escapeHtml(inst.uid) + ', Dd ' + S.formatNumber(inst.dd) + '/' + S.formatNumber(model.maxDd) + ')?</p>' +
      '<div class="btn-row">' +
        '<button type="button" class="btn btn-warn" data-confirm-sell-uid="' + escapeHtml(inst.uid) + '">Conferma Vendita (+' + S.formatNumber(model.sellPrice) + ' Crediti)</button>' +
      '</div>'
    );
    openModal('Conferma Vendita Equipaggiamento', html);
  }

  function handleUseItemClick(source, itemId) {
    var res = S.useItem(source, itemId);
    if (res.ok) {
      showToast(res.message, 'ok');
    } else if (res.needsTarget) {
      openRepairTargetModal(res);
    } else {
      showToast(res.message, 'err');
    }
  }

  function renderActiveTab() {
    var content = document.getElementById('tab-content');
    if (!content) {
      return;
    }
    var active = S.state.ui.activeTab;
    if (active === 'map') {
      U.renderMapTab(content);
    } else if (active === 'mission') {
      U.renderMissionTab(content);
    } else if (active === 'options') {
      U.renderOptionsTab(content);
    } else {
      U.renderShipTab(content);
    }
  }

  function refreshCooldownElements() {
    var kinds = ['regen', 'supply'];
    var i, kind, rem, badge, btn;
    for (i = 0; i < kinds.length; i += 1) {
      kind = kinds[i];
      badge = document.querySelector('[data-cd-label="' + kind + '"]');
      btn = document.querySelector('[data-cd-btn="' + kind + '"]');
      if (!badge || !btn) {
        continue;
      }
      rem = S.getCooldownRemaining(kind);
      if (rem > 0) {
        badge.textContent = S.formatDuration(rem);
        badge.classList.remove('badge-ok');
        badge.classList.add('badge-warn');
        btn.disabled = true;
        btn.textContent = 'In ricarica (' + S.formatDuration(rem) + ')';
      } else {
        badge.textContent = 'Pronta';
        badge.classList.remove('badge-warn');
        badge.classList.add('badge-ok');
        btn.disabled = false;
        btn.textContent = kind === 'regen' ? 'Rigenera Tutto' : 'Apri Capsula';
      }
    }
  }

  function render() {
    renderHud();
    renderTabs();
    renderActiveTab();
    if (S.uiState.activeModalKind === 'backpack_cargo') {
      var bodyEl = document.getElementById('modal-body');
      if (bodyEl && typeof U.renderBackpackCargoSection === 'function') {
        bodyEl.innerHTML = U.renderBackpackCargoSection();
      }
    } else if (S.uiState.activeModalKind === 'mission_recap') {
      if (typeof U.refreshRecapModal === 'function') {
        U.refreshRecapModal();
      }
    }
  }

  U.escapeHtml = escapeHtml;
  U.percentInt = percentInt;
  U.showToast = showToast;
  U.applyModalSizeClasses = applyModalSizeClasses;
  U.openModal = openModal;
  U.closeModal = closeModal;
  U.icon = icon;
  U.formatRecapValue = formatRecapValue;
  U.formatGlobalScoreActive = formatGlobalScoreActive;
  U.formatAliensRange = formatAliensRange;
  U.renderFeatureBadges = renderFeatureBadges;
  U.renderEquipSlotCard = renderEquipSlotCard;
  U.renderDropPreviewList = renderDropPreviewList;
  U.renderHud = renderHud;
  U.renderTabs = renderTabs;
  U.openRepairTargetModal = openRepairTargetModal;
  U.openSellConfirmModal = openSellConfirmModal;
  U.handleUseItemClick = handleUseItemClick;
  U.renderActiveTab = renderActiveTab;
  U.refreshCooldownElements = refreshCooldownElements;
  U.render = render;
})();
