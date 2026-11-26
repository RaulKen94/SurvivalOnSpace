// js/ui.js
(function () {
  'use strict';

  var S = (window.Survival = window.Survival || {});
  var initialized = false;
  var cooldownTimerId = null;
  var importFeedback = { text: '', ok: true };
  var renameFeedback = { text: '', ok: true };
  var activeModalKind = null;
  var transferPicker = null;

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

  function openModal(title, bodyHtml, options) {
    var root = document.getElementById('modal-root');
    var cardEl = root ? root.querySelector('.modal-card') : null;
    var titleEl = document.getElementById('modal-title');
    var bodyEl = document.getElementById('modal-body');
    if (!root || !titleEl || !bodyEl) {
      return;
    }
    activeModalKind = options && options.kind ? options.kind : null;
    if (cardEl) {
      cardEl.classList.toggle('modal-wide', Boolean(options && options.wide));
    }
    titleEl.textContent = title;
    bodyEl.innerHTML = bodyHtml;
    root.classList.remove('hidden');
  }

  function closeModal() {
    var root = document.getElementById('modal-root');
    var cardEl = root ? root.querySelector('.modal-card') : null;
    activeModalKind = null;
    transferPicker = null;
    if (cardEl) {
      cardEl.classList.remove('modal-wide');
    }
    if (root) {
      root.classList.add('hidden');
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

  function renderMapTab(container) {
    var planet = S.getPlanet();
    var selected = S.state.mission.selectedDifficulty;
    var listHtml = '';

    listHtml += (
      '<button type="button" class="mission-option' + (selected === 0 ? ' selected' : '') + '" data-select-diff="0">' +
        '<div class="mission-option-top">' +
          '<span class="mission-option-name">' + icon('tabs', 'ship') + ' Nave Spaziale (Posizione Attuale)</span>' +
        '</div>' +
        '<div class="mission-option-meta"><span>Base orbitale su ' + escapeHtml(planet.name) + ' · Nessun combattimento</span></div>' +
      '</button>'
    );

    var d, m, lockInfo, isSelected;
    for (d = 1; d <= 4; d += 1) {
      m = planet.missions[d];
      if (!m) {
        continue;
      }
      lockInfo = S.isMissionUnlocked(planet.id, d);
      isSelected = selected === d;
      listHtml += (
        '<button type="button" class="mission-option' +
          (isSelected ? ' selected' : '') +
          (!lockInfo.unlocked ? ' locked' : '') +
        '" data-select-diff="' + d + '"' + (!lockInfo.unlocked ? ' disabled' : '') + '>' +
          '<div class="mission-option-top">' +
            '<span class="mission-option-name">' + icon('tabs', 'mission') + ' Difficoltà ' + d + ' — ' + escapeHtml(m.name) + '</span>' +
            (lockInfo.unlocked
              ? ''
              : '<span class="badge badge-danger">' + escapeHtml(lockInfo.reason) + '</span>') +
          '</div>' +
          '<div class="mission-option-meta">' +
            '<span>Alieni: <strong>' + formatAliensRange(m) + '</strong></span>' +
            '<span>Premio base: <strong class="val-credits">' + icon('stats', 'credits') + ' ' + S.formatNumber(m.creditsReward) + ' Crediti</strong></span>' +
            renderFeatureBadges(m.features) +
          '</div>' +
        '</button>'
      );
    }

    var gs = S.state.globalScore;
    var gsTarget = S.GLOBAL_SCORE_TARGET;
    var gsPct = percentInt(gs.streak, gsTarget);

    var locsHtml = '';
    var i, loc;
    for (i = 0; i < planet.locations.length; i += 1) {
      loc = planet.locations[i];
      locsHtml += (
        '<div class="module-card">' +
          '<div>' +
            '<div class="module-card-head">' +
              '<h3 class="module-card-title">' + (loc.icon ? loc.icon + ' ' : '') + escapeHtml(loc.name) + '</h3>' +
              '<span class="badge badge-step">Step 5</span>' +
            '</div>' +
            '<p class="module-card-desc" style="margin-top:6px;">' + escapeHtml(loc.description) + '</p>' +
          '</div>' +
          '<div class="btn-row">' +
            '<button type="button" class="btn btn-ghost btn-sm" disabled>' + icon('equip', 'boots') + ' Visita (Dd Stivali)</button>' +
          '</div>' +
        '</div>'
      );
    }

    container.innerHTML = (
      '<div class="section-header">' +
        '<div>' +
          '<h1 class="section-title">' + icon('tabs', 'map') + ' Mappa Planetaria — ' + icon('stats', 'planet') + ' ' + escapeHtml(planet.name) + '</h1>' +
          '<p class="section-subtitle">' + escapeHtml(planet.subtitle) + ' · ' + escapeHtml(planet.description) + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="panel-title"><span>' + icon('tabs', 'mission') + ' Missioni Disponibili</span></div>' +
        '<div class="mission-list">' + listHtml + '</div>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="panel-title">' +
          '<span>' + icon('modules', 'recap') + ' Global Score</span>' +
          '<span class="badge badge-cyan">' + S.formatNumber(gs.streak) + ' / ' + S.formatNumber(gsTarget) + '</span>' +
        '</div>' +
        '<div class="progress-track" style="height:10px; margin-bottom:8px;">' +
          '<div class="progress-fill fill-exp" style="width:' + gsPct + '%"></div>' +
        '</div>' +
        '<p class="section-subtitle">Attivo: <strong>' + escapeHtml(formatGlobalScoreActive(gs.activeKey)) + '</strong></p>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="panel-title"><span>' + icon('equip', 'boots') + ' Esplorazione Pianeta (Fuori Missione)</span></div>' +
        '<div class="grid-2">' + locsHtml + '</div>' +
      '</div>'
    );
  }

  function renderMissionBackpackItems() {
    var items = S.state.backpack.items || {};
    var keys = Object.keys(items);
    if (keys.length === 0) {
      return '<p class="section-subtitle">Nessun oggetto nello Zaino.</p>';
    }
    var html = '<div class="inv-item-list">';
    var i, id, qty, def, lineW, canUse, itemIcon;
    for (i = 0; i < keys.length; i += 1) {
      id = keys[i];
      qty = S.toInt(items[id], 0);
      def = S.ITEMS[id];
      if (!def || qty <= 0) {
        continue;
      }
      lineW = def.weight * qty;
      canUse = id !== 'chip_identita';
      itemIcon = def.icon ? def.icon + ' ' : '';
      html += (
        '<div class="inv-item-card">' +
          '<div class="inv-item-row">' +
            '<div class="inv-item-info">' +
              '<span class="inv-item-title-line"><strong>' + escapeHtml(itemIcon + def.name) + '</strong> <span class="item-qty">×' + S.formatNumber(qty) + '</span> · <span class="weight-text">' + S.formatNumber(lineW) + ' pt.</span></span>' +
              '<span class="inv-item-sub">' + escapeHtml(def.description) + '</span>' +
            '</div>' +
            '<div class="inv-item-actions">' +
              (canUse
                ? '<button type="button" class="btn btn-sm" data-use-item="backpack|' + escapeHtml(id) + '">Usa</button>'
                : '<span class="badge badge-step">Solo Opzioni</span>') +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }
    html += '</div>';
    return html;
  }

  function renderLastShotBox(lastShot) {
    if (!lastShot) {
      return '';
    }
    if (lastShot.hit) {
      return '<div class="last-shot-box last-shot-hit">🎯 Colpo a segno!</div>';
    }
    return '<div class="last-shot-box last-shot-miss">💨 Colpo mancato!</div>';
  }

  function renderMissionTab(container) {
    var ms = S.state.mission;
    var planet = S.getPlanet(ms.planetId || S.state.player.planetId);

    // Stato attivo in missione: Combattimento a turni
    if (ms.active) {
      var mCfg = planet.missions[ms.selectedDifficulty];
      var aliensKilled = Math.max(0, ms.aliensTotal - ms.aliensLeft);
      var aliensLeftPct = percentInt(ms.aliensLeft, ms.aliensTotal);
      var bpUsed = S.getBackpackTotalWeight();
      var bpMax = S.state.backpack.maxWeight;
      var ammoLeft = S.state.backpack.ammo;

      var lastShotHtml = renderLastShotBox(ms.lastShot);
      var actionHtml = '';
      if (ms.completedReady) {
        actionHtml = (
          lastShotHtml +
          '<p class="section-subtitle notice-ok" style="margin-bottom:10px;">Tutti gli alieni sono stati eliminati! Premi il pulsante qui sotto per completare la missione, raccogliere i drop e tornare al riepilogo.</p>' +
          '<button type="button" class="btn btn-success btn-combat-big" id="btn-complete-mission">Completa Missione</button>'
        );
      } else if (ammoLeft > 0) {
        actionHtml = (
          '<button type="button" class="btn btn-primary btn-combat-big" id="btn-shoot-alien">SPARA</button>' +
          lastShotHtml
        );
      } else {
        actionHtml = (
          lastShotHtml +
          '<p class="section-subtitle notice-danger" style="margin-bottom:10px;"><strong>' + icon('stats', 'ammo') + ' Munizioni esaurite!</strong> Usa un Caricatore Standard nello Zaino oppure tenta la fuga d\'emergenza (tiro 1d20, serve almeno 18; in caso di successo perdi il 30% dell\'EXP attuale, altrimenti subisci il contrattacco).</p>' +
          '<button type="button" class="btn btn-danger btn-combat-big" id="btn-escape-mission">FUGGI (Tira 1d20 — serve ≥ 18)</button>'
        );
      }

      container.innerHTML = (
        '<div class="combat-banner">' +
          '<div class="section-header" style="padding-bottom:6px;">' +
            '<div>' +
              '<h1 class="section-title">' + icon('tabs', 'mission') + ' ' + escapeHtml(planet.name) + ' · Difficoltà ' + ms.selectedDifficulty + ' — ' + escapeHtml(mCfg ? mCfg.name : '') + '</h1>' +
              '<p class="section-subtitle">Mission = TRUE · Tutte le altre schede sono bloccate fino al termine della missione.</p>' +
            '</div>' +
            renderFeatureBadges(mCfg ? mCfg.features : []) +
          '</div>' +
          '<div class="combat-counters">' +
            '<div class="combat-stat-box"><span class="combat-stat-label">Turni</span><span class="combat-stat-value">' + S.formatNumber(ms.turn) + '</span></div>' +
            '<div class="combat-stat-box"><span class="combat-stat-label">Alieni Rimanenti</span><span class="combat-stat-value aliens-val">' + S.formatNumber(ms.aliensLeft) + ' / ' + S.formatNumber(ms.aliensTotal) + '</span></div>' +
            '<div class="combat-stat-box"><span class="combat-stat-label">' + icon('stats', 'ammo') + ' Munizioni Zaino</span><span class="combat-stat-value">' + S.formatNumber(ammoLeft) + '</span></div>' +
          '</div>' +
          '<div class="progress-track" style="height:9px;" title="Alieni uccisi: ' + aliensKilled + '/' + ms.aliensTotal + '">' +
            '<div class="progress-fill fill-hp" style="width:' + aliensLeftPct + '%"></div>' +
          '</div>' +
          (ms.selectedDifficulty >= 2
            ? '<p class="section-subtitle">Nota: le meccaniche speciali di Meteo / Alieni Mutati / Boss per le Difficoltà 2–4 saranno attivate nello Step 4.</p>'
            : '') +
        '</div>' +
        '<div class="grid-2">' +
          '<div class="panel panel-highlight">' +
            '<div class="panel-title"><span>' + icon('tabs', 'mission') + ' Azioni di Combattimento</span><span class="badge badge-cyan">Turni: ' + S.formatNumber(ms.turn) + '</span></div>' +
            actionHtml +
          '</div>' +
          '<div class="panel">' +
            '<div class="panel-title">' +
              '<span>' + icon('modules', 'backpack') + ' Zaino</span>' +
              '<span class="weight-text">' + S.formatNumber(bpUsed) + ' / ' + S.formatNumber(bpMax) + ' pt.</span>' +
            '</div>' +
            renderMissionBackpackItems() +
          '</div>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-title"><span>' + icon('stats', 'shield') + ' Equipaggiamento</span></div>' +
          '<div class="grid-4">' +
            renderEquipSlotCard('helmet', false) +
            renderEquipSlotCard('suit', false) +
            renderEquipSlotCard('boots', false) +
            renderEquipSlotCard('rifle', false) +
          '</div>' +
        '</div>'
      );
      return;
    }

    // Stato fuori missione senza difficoltà selezionata
    var diff = ms.selectedDifficulty;
    if (!diff || diff <= 0 || !planet.missions[diff]) {
      container.innerHTML = (
        '<div class="panel empty-state">' +
          '<h1 class="section-title">' + icon('tabs', 'mission') + ' Nessuna Missione Selezionata</h1>' +
          '<p class="section-subtitle">Sei attualmente attraccato sulla Nave Spaziale. Scegli una difficoltà disponibile dal tab <strong>' + icon('tabs', 'map') + ' Mappa</strong> per aprire il briefing operativo.</p>' +
          '<button type="button" class="btn btn-primary" data-nav-tab="map">' + icon('tabs', 'map') + ' Apri Mappa</button>' +
        '</div>'
      );
      return;
    }

    // Briefing pre-missione
    var m = planet.missions[diff];
    var bpTotal = S.getBackpackTotalWeight();
    var bpCap = S.state.backpack.maxWeight;

    container.innerHTML = (
      '<div class="section-header">' +
        '<div>' +
          '<h1 class="section-title">' + icon('tabs', 'mission') + ' Briefing Missione — ' + icon('stats', 'planet') + ' ' + escapeHtml(planet.name) + ' (Difficoltà ' + diff + ')</h1>' +
          '<p class="section-subtitle">' + escapeHtml(m.name) + ' · ' + escapeHtml(m.description) + '</p>' +
        '</div>' +
        renderFeatureBadges(m.features) +
      '</div>' +
      '<div class="grid-2">' +
        '<div class="panel panel-highlight">' +
          '<div class="panel-title"><span>Parametri Operativi</span><span class="badge badge-ok">Pronto al Lancio</span></div>' +
          '<div class="inv-item-list" style="margin-top:0;">' +
            '<div class="inv-item-row"><span>Alieni da abbattere</span><strong class="mono">' + formatAliensRange(m) + '</strong></div>' +
            '<div class="inv-item-row"><span>Danno base nemico</span><strong class="mono">' + S.formatNumber(m.enemyDamage) + ' / turno</strong></div>' +
            '<div class="inv-item-row"><span>' + icon('stats', 'credits') + ' Ricompensa base</span><strong class="mono val-credits">' + S.formatNumber(m.creditsReward) + ' Crediti</strong></div>' +
            '<button type="button" class="inv-item-row inv-item-row-clickable" id="btn-open-prep-backpack"><span>' + icon('modules', 'backpack') + ' Zaino</span><span class="weight-text">' + S.formatNumber(bpTotal) + ' / ' + S.formatNumber(bpCap) + ' pt.</span></button>' +
            '<div class="inv-item-row"><span>' + icon('stats', 'ammo') + ' Munizioni pronte</span><strong class="mono val-ammo">' + S.formatNumber(S.state.backpack.ammo) + '</strong></div>' +
          '</div>' +
          '<div class="briefing-actions">' +
            '<div class="briefing-cancel-col">' +
              '<button type="button" class="btn btn-ghost" id="btn-cancel-mission-ship">Annulla → ' + icon('tabs', 'ship') + ' Nave Spaziale</button>' +
              '<button type="button" class="btn btn-ghost" id="btn-cancel-mission-map">Annulla → ' + icon('tabs', 'map') + ' Mappa</button>' +
            '</div>' +
            '<div class="briefing-start-col">' +
              '<button type="button" class="btn btn-primary" id="btn-start-mission">' + icon('tabs', 'mission') + ' Inizia Missione</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-title"><span>Probabilità Drop Missione</span></div>' +
          renderDropPreviewList(m) +
        '</div>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="panel-title"><span>' + icon('stats', 'shield') + ' Equipaggiamento per la missione</span></div>' +
        '<div class="grid-4">' +
          renderEquipSlotCard('helmet', false) +
          renderEquipSlotCard('suit', false) +
          renderEquipSlotCard('boots', false) +
          renderEquipSlotCard('rifle', false) +
        '</div>' +
      '</div>'
    );
  }

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
      ddPct = percentInt(inst.dd, model.maxDd);
      isBroken = inst.dd <= 0;
      slotTitle = (slotMeta.icon ? slotMeta.icon + ' ' : '') + slotMeta.label;
      html += (
        '<div class="equip-card ' + slotMeta.cssClass + (isBroken ? ' equip-broken' : '') + '">' +
          '<div class="equip-slot-label">' +
            '<span>' + escapeHtml(slotTitle) + '</span>' +
            '<span>' + escapeHtml(inst.uid) + '</span>' +
          '</div>' +
          '<div class="equip-model-name">' + escapeHtml(model.name) + '</div>' +
          '<div class="equip-stats-row">' +
            '<span>Pt: ' + S.formatNumber(model.score) + '</span>' +
            '<span>Dd: ' + S.formatNumber(inst.dd) + ' / ' + S.formatNumber(model.maxDd) + '</span>' +
          '</div>' +
          '<div class="progress-track"><div class="progress-fill fill-dd" style="width:' + ddPct + '%"></div></div>' +
          '<div class="equip-card-foot">' +
            (isBroken ? '<span class="badge badge-danger">ROTTO</span>' : '<span></span>') +
            '<div class="btn-row" style="gap:6px;">' +
              '<button type="button" class="btn btn-primary btn-sm" data-equip-uid="' + escapeHtml(inst.uid) + '">Equipaggia</button>' +
              '<button type="button" class="btn btn-warn btn-sm" data-sell-uid="' + escapeHtml(inst.uid) + '">Vendi (' + icon('stats', 'credits') + ' +' + S.formatNumber(model.sellPrice) + ')</button>' +
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
      return '<p class="section-subtitle" style="margin-top:10px;">' + escapeHtml(emptyText) + '</p>';
    }
    var isBackpack = sourceKey === 'backpack';
    var moveDir = isBackpack ? 'toCargo' : 'toBackpack';
    var destText = isBackpack ? icon('modules', 'cargo') + ' Stiva' : icon('modules', 'backpack') + ' Zaino';
    var destFree = isBackpack ? S.getCargoFreeWeight() : S.getBackpackFreeWeight();

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
        useBtnHtml = '<button type="button" class="btn btn-sm" data-use-item="' + sourceKey + '|' + escapeHtml(id) + '">Usa</button>';
      }

      isOpen = Boolean(transferPicker && transferPicker.source === sourceKey && transferPicker.itemId === id);
      pickerHtml = '';
      if (isOpen) {
        maxFit = def.weight === 0 ? qty : Math.floor(destFree / def.weight);
        maxMovable = Math.min(qty, maxFit);
        if (maxMovable <= 0) {
          curQty = 0;
        } else {
          curQty = S.clampInt(transferPicker.qty, 1, maxMovable, 1);
          transferPicker.qty = curQty;
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
              '<button type="button" class="btn btn-primary btn-sm" data-transfer-confirm="' + moveDir + '|' + escapeHtml(id) + '"' + (maxMovable <= 0 ? ' disabled' : '') + '>Sposta</button>' +
              '<button type="button" class="btn btn-ghost btn-sm" data-transfer-cancel="1">Annulla</button>' +
            '</div>' +
          '</div>'
        );
      }

      html += (
        '<div class="inv-item-card">' +
          '<div class="inv-item-row">' +
            '<div class="inv-item-info inv-item-clickable" data-toggle-transfer="' + sourceKey + '|' + escapeHtml(id) + '" title="Clicca per spostare">' +
              '<span class="inv-item-title-line"><strong>' + escapeHtml(itemIcon + def.name) + '</strong> <span class="item-qty">×' + S.formatNumber(qty) + '</span> · <span class="weight-text">' + S.formatNumber(lineWeight) + ' pt.</span></span>' +
              '<span class="inv-item-sub">' + escapeHtml(def.description) + '</span>' +
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
    var bpAmmoPct = percentInt(bpAmmoW, bpMaxW);
    var bpItemsPct = Math.min(100 - bpAmmoPct, percentInt(bpItemsW, bpMaxW));

    var cargoItemsW = S.getCargoItemsWeight();
    var cargoMaxW = S.getCargoMaxWeight();
    var cargoPct = percentInt(cargoItemsW, cargoMaxW);

    return (
      '<div class="grid-2">' +
        '<div class="panel">' +
          '<div class="panel-title">' +
            '<span>' + icon('modules', 'backpack') + ' Zaino (Equipaggiato in Missione)</span>' +
            '<span class="weight-text">' + S.formatNumber(bpTotalW) + ' / ' + S.formatNumber(bpMaxW) + ' pt.</span>' +
          '</div>' +
          '<div class="progress-track" style="height:9px; margin-bottom:8px;">' +
            '<div class="progress-fill fill-ammo" style="width:' + bpAmmoPct + '%" title="Munizioni"></div>' +
            '<div class="progress-fill fill-items" style="width:' + bpItemsPct + '%" title="Oggetti"></div>' +
          '</div>' +
          '<div class="mission-option-meta">' +
            '<span>' + icon('stats', 'ammo') + ' Munizioni: <strong class="val-ammo">' + S.formatNumber(S.state.backpack.ammo) + '</strong> (<span class="weight-text">' + S.formatNumber(bpAmmoW) + ' pt.</span>)</span>' +
            '<span>Oggetti: <span class="weight-text">' + S.formatNumber(bpItemsW) + ' pt.</span></span>' +
          '</div>' +
          '<div class="ammo-transfer-bar">' +
            '<span class="ammo-transfer-label">Sposta ' + icon('stats', 'ammo') + ' Munizioni → ' + icon('modules', 'cargo') + ' Stiva:</span>' +
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
            '<span>' + icon('modules', 'cargo') + ' Stiva (Riserva della Nave)</span>' +
            '<span class="weight-text">' + S.formatNumber(cargoItemsW) + ' / ' + S.formatNumber(cargoMaxW) + ' pt.</span>' +
          '</div>' +
          '<div class="progress-track" style="height:9px; margin-bottom:8px;">' +
            '<div class="progress-fill fill-items" style="width:' + cargoPct + '%"></div>' +
          '</div>' +
          '<div class="mission-option-meta">' +
            '<span>' + icon('stats', 'ammo') + ' Munizioni in Stiva: <strong class="val-ammo">' + S.formatNumber(S.state.cargo.ammo) + '</strong> (<span class="weight-text">Capienza ∞</span>)</span>' +
          '</div>' +
          '<div class="ammo-transfer-bar">' +
            '<span class="ammo-transfer-label">Trasferisci ' + icon('stats', 'ammo') + ' Munizioni → ' + icon('modules', 'backpack') + ' Zaino:</span>' +
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

    container.innerHTML = (
      '<div class="section-header">' +
        '<div>' +
          '<h1 class="section-title">' + icon('tabs', 'ship') + ' Nave Spaziale — Ponte Principale</h1>' +
          '<p class="section-subtitle">Home operativa di bordo. Prepara equipaggiamento, Zaino e Stiva prima di partire.</p>' +
        '</div>' +
        '<button type="button" class="btn btn-primary btn-sm" data-nav-tab="map">' + icon('tabs', 'map') + ' Scegli Missione in Mappa</button>' +
      '</div>' +
      '<div class="module-grid">' +
        '<div class="module-card">' +
          '<div>' +
            '<div class="module-card-head">' +
              '<h3 class="module-card-title">' + icon('modules', 'recap') + ' Recap Ultima Missione</h3>' +
              '<span class="badge ' + (hasRecap ? 'badge-ok' : 'badge-step') + '">' + (hasRecap ? 'Disponibile' : 'Vuoto') + '</span>' +
            '</div>' +
            '<p class="module-card-desc" style="margin-top:6px;">' + escapeHtml(lastRecapLabel) + '</p>' +
          '</div>' +
          '<button type="button" class="btn btn-sm" id="btn-open-last-recap"' + (hasRecap ? '' : ' disabled') + '>' + icon('modules', 'recap') + ' Apri Resoconto</button>' +
        '</div>' +
        '<div class="module-card">' +
          '<div>' +
            '<div class="module-card-head">' +
              '<h3 class="module-card-title">' + icon('modules', 'regen') + ' Camera di Rigenerazione</h3>' +
              '<span class="badge ' + (regenRem > 0 ? 'badge-warn' : 'badge-ok') + '" data-cd-label="regen">' + (regenRem > 0 ? S.formatDuration(regenRem) : 'Pronta') + '</span>' +
            '</div>' +
            '<p class="module-card-desc" style="margin-top:6px;">Ripristina al 100% ' + icon('stats', 'hp') + ' Vita e ' + icon('stats', 'shield') + ' Scudo senza consumare oggetti (ricarica 120s).</p>' +
          '</div>' +
          '<button type="button" class="btn btn-primary btn-sm" id="btn-regen-chamber" data-cd-btn="regen"' + (regenRem > 0 ? ' disabled' : '') + '>' + (regenRem > 0 ? 'In ricarica (' + S.formatDuration(regenRem) + ')' : icon('modules', 'regen') + ' Rigenera Tutto') + '</button>' +
        '</div>' +
        '<div class="module-card">' +
          '<div>' +
            '<div class="module-card-head">' +
              '<h3 class="module-card-title">' + icon('modules', 'supply') + ' Capsula Rifornimenti</h3>' +
              '<span class="badge ' + (supplyRem > 0 ? 'badge-warn' : 'badge-ok') + '" data-cd-label="supply">' + (supplyRem > 0 ? S.formatDuration(supplyRem) : 'Pronta') + '</span>' +
            '</div>' +
            '<p class="module-card-desc" style="margin-top:6px;">Consegna 25–40 ' + icon('stats', 'ammo') + ' Munizioni in Stiva e 1 consumabile base (ricarica 240s).</p>' +
          '</div>' +
          '<button type="button" class="btn btn-primary btn-sm" id="btn-supply-capsule" data-cd-btn="supply"' + (supplyRem > 0 ? ' disabled' : '') + '>' + (supplyRem > 0 ? 'In ricarica (' + S.formatDuration(supplyRem) + ')' : icon('modules', 'supply') + ' Apri Capsula') + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="panel-title"><span>' + icon('stats', 'shield') + ' Equipaggiamento Indossato &amp; Armeria Nave</span><span class="badge badge-cyan">Deposito: ' + S.formatNumber((S.state.equipment.storage || []).length) + ' pezzi</span></div>' +
        '<div class="grid-4">' +
          renderEquipSlotCard('helmet', true) +
          renderEquipSlotCard('suit', true) +
          renderEquipSlotCard('boots', true) +
          renderEquipSlotCard('rifle', true) +
        '</div>' +
        renderStorageEquipSection() +
      '</div>' +
      renderBackpackCargoSection() +
      '<div class="grid-2">' +
        '<div class="panel">' +
          '<div class="panel-title">' +
            '<span>' + icon('modules', 'upgrades') + ' Potenziamenti Nave</span>' +
            '<span class="badge badge-cyan">Stiva Lv. ' + S.formatNumber(upgInfo.level) + ' / ' + S.formatNumber(upgInfo.maxLevel) + '</span>' +
          '</div>' +
          '<p class="section-subtitle" style="margin-bottom:10px;">Espandi la capienza degli oggetti nella Stiva di <span class="weight-text">+100 pt.</span> per livello (attuale: <span class="weight-text">' + S.formatNumber(upgInfo.currentMaxWeight) + ' pt.</span>' + (upgInfo.isMaxed ? ' · MASSIMO' : ' → <span class="weight-text">' + S.formatNumber(upgInfo.nextMaxWeight) + ' pt.</span>') + ').</p>' +
          '<button type="button" class="btn btn-primary" id="btn-upgrade-cargo"' + (upgInfo.isMaxed || S.state.player.credits < upgInfo.nextCost ? ' disabled' : '') + '>' +
            (upgInfo.isMaxed
              ? 'Capienza Stiva al Massimo'
              : icon('modules', 'upgrades') + ' Potenzia Stiva (' + icon('stats', 'credits') + ' ' + S.formatNumber(upgInfo.nextCost) + ' Crediti)') +
          '</button>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-title"><span>' + icon('modules', 'library') + ' Biblioteca di bordo</span><span class="badge badge-step">Step 5</span></div>' +
          '<p class="section-subtitle">I Libri trovati durante le missioni e le esplorazioni verranno archiviati qui per la lettura integrale e sbloccheranno potenziamenti passivi permanenti.</p>' +
        '</div>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="panel-title"><span>📓 Diario di Bordo</span></div>' +
      '</div>'
    );
  }

  function renderOptionsTab(container) {
    var saveCode = S.exportSaveCode();
    var tokenCount = S.getRenameTokenCount();
    var canRename = S.hasRenameToken();
    var stats = S.state.stats;

    container.innerHTML = (
      '<div class="section-header">' +
        '<div>' +
          '<h1 class="section-title">' + icon('tabs', 'options') + ' Opzioni, Salvataggio Locale &amp; Statistiche</h1>' +
          '<p class="section-subtitle">Nessun salvataggio automatico online: copia manualmente il tuo codice alfanumerico per salvare i progressi.</p>' +
        '</div>' +
        '<span class="badge badge-cyan">Formato ' + escapeHtml(S.SAVE_PREFIX) + ' Retrocompatibile</span>' +
      '</div>' +
      '<div class="grid-2">' +
        '<div class="panel panel-highlight">' +
          '<div class="panel-title"><span>' + icon('modules', 'save') + ' Esporta Codice di Salvataggio</span><span class="badge badge-ok">Manuale</span></div>' +
          '<p class="section-subtitle" style="margin-bottom:8px;">Copia e conserva questo codice alfanumerico al sicuro. Resterà compatibile anche con tutti i futuri aggiornamenti del gioco.</p>' +
          '<textarea id="export-code-box" class="code-box" readonly aria-label="Codice di salvataggio">' + escapeHtml(saveCode) + '</textarea>' +
          '<div class="btn-row" style="margin-top:10px;">' +
            '<button type="button" class="btn btn-primary" id="btn-copy-save">' + icon('modules', 'save') + ' Copia Codice</button>' +
          '</div>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-title"><span>' + icon('modules', 'save') + ' Carica Codice di Salvataggio</span></div>' +
          '<p class="section-subtitle" style="margin-bottom:8px;">Incolla un codice salvataggio precedentemente esportato per ripristinare i tuoi progressi.</p>' +
          '<textarea id="import-code-input" class="code-box" placeholder="Incolla qui il codice (es. SOS1...)"></textarea>' +
          '<div class="btn-row" style="margin-top:10px;">' +
            '<button type="button" class="btn" id="btn-load-save">' + icon('modules', 'save') + ' Carica Salvataggio</button>' +
          '</div>' +
          (importFeedback.text
            ? '<div class="feedback-line ' + (importFeedback.ok ? 'feedback-ok' : 'feedback-err') + '">' + escapeHtml(importFeedback.text) + '</div>'
            : '') +
        '</div>' +
      '</div>' +
      '<div class="grid-2">' +
        '<div class="panel">' +
          '<div class="panel-title">' +
            '<span>' + icon('items', 'chip_identita') + ' Cambio Nome Personaggio</span>' +
            '<span>Chip Cambio Identità <span class="item-qty">×' + S.formatNumber(tokenCount) + '</span> · <span class="weight-text">0 pt.</span></span>' +
          '</div>' +
          '<p class="section-subtitle" style="margin-bottom:10px;">Richiede un oggetto consumabile <strong>' + icon('items', 'chip_identita') + ' Chip Cambio Identità</strong> (presente ×1 nella Stiva iniziale). Senza chip il cambio nome resta bloccato.</p>' +
          '<div class="btn-row">' +
            '<input type="text" id="rename-input" class="input-field" maxlength="20" placeholder="Nuovo nome (2-20 caratteri)" style="flex:1; min-width:180px;"' + (!canRename ? ' disabled' : '') + '>' +
            '<button type="button" class="btn btn-primary" id="btn-rename-player"' + (!canRename ? ' disabled' : '') + '>Cambia Nome</button>' +
          '</div>' +
          (renameFeedback.text
            ? '<div class="feedback-line ' + (renameFeedback.ok ? 'feedback-ok' : 'feedback-err') + '">' + escapeHtml(renameFeedback.text) + '</div>'
            : '') +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-title"><span>' + icon('modules', 'recap') + ' Statistiche di Gioco &amp; Roadmap</span><span class="badge badge-ok">Alpha 1 (Step 3)</span></div>' +
          '<p class="section-subtitle" style="margin-bottom:10px;">Alieni uccisi: <strong class="mono">' + S.formatNumber(stats.aliensKilled) + '</strong> · Colpi sparati: <strong class="mono">' + S.formatNumber(stats.shotsFired) + '</strong> · Morti: <strong class="mono">' + S.formatNumber(stats.deaths) + '</strong></p>' +
          '<div class="btn-row">' +
            '<button type="button" class="btn" id="btn-open-stats">' + icon('modules', 'recap') + ' Consulta Statistiche Complete</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderStatsModalHtml() {
    var st = S.state.stats;
    var rows = [
      { label: 'Alieni uccisi', val: S.formatNumber(st.aliensKilled) },
      { label: 'Spari effettuati', val: S.formatNumber(st.shotsFired) },
      { label: 'Missioni Difficoltà 1 vinte', val: S.formatNumber(st.missionsWon[1]) },
      { label: 'Missioni Difficoltà 2 vinte', val: S.formatNumber(st.missionsWon[2]) },
      { label: 'Missioni Difficoltà 3 vinte', val: S.formatNumber(st.missionsWon[3]) },
      { label: 'Missioni Difficoltà 4 vinte', val: S.formatNumber(st.missionsWon[4]) },
      { label: 'Morti subite', val: S.formatNumber(st.deaths) },
      { label: 'Fughe riuscite', val: S.formatNumber(st.escapes) },
      { label: icon('modules', 'regen') + ' Camera di Rigenerazione usata', val: S.formatNumber(st.regenUsed) },
      { label: icon('modules', 'supply') + ' Capsule Rifornimenti aperte', val: S.formatNumber(st.suppliesClaimed) },
      { label: icon('stats', 'credits') + ' Crediti totali guadagnati', val: S.formatNumber(st.creditsEarned) },
      { label: icon('stats', 'liquids') + ' Liquidi Plusvalenti guadagnati', val: S.formatNumber(st.liquidsEarned) }
    ];
    var html = '<div class="stats-grid">';
    var i;
    for (i = 0; i < rows.length; i += 1) {
      html += (
        '<div class="stat-row">' +
          '<span class="stat-row-label">' + escapeHtml(rows[i].label) + '</span>' +
          '<span class="stat-row-val">' + escapeHtml(rows[i].val) + '</span>' +
        '</div>'
      );
    }
    html += '</div>';
    return html;
  }

  function openRecapModal(recap) {
    if (!recap) {
      return;
    }
    var dropsHtml = '';
    if (!recap.drops || recap.drops.length === 0) {
      dropsHtml = '<p class="section-subtitle">Nessun oggetto droppato in questa missione.</p>';
    } else {
      dropsHtml = '<div class="drop-list">';
      var i, d, eqSlot, itemDef, dIcon;
      for (i = 0; i < recap.drops.length; i += 1) {
        d = recap.drops[i];
        if (d.kind === 'equip') {
          eqSlot = S.EQUIP_SLOTS[d.slot];
          dIcon = eqSlot && eqSlot.icon ? eqSlot.icon + ' ' : '';
          dropsHtml += (
            '<div class="drop-row">' +
              '<div class="drop-row-left"><span class="equip-text-' + escapeHtml(d.slot) + '"><strong>' + escapeHtml(dIcon + d.name) + '</strong></span> <span class="badge badge-cyan">' + escapeHtml(d.uid) + ' · ' + S.formatNumber(d.maxDd) + ' Dd</span></div>' +
              '<div class="drop-row-right"><span class="badge badge-ok">' + escapeHtml(d.destination) + '</span></div>' +
            '</div>'
          );
        } else {
          itemDef = S.ITEMS[d.id];
          dIcon = itemDef && itemDef.icon ? itemDef.icon + ' ' : '';
          dropsHtml += (
            '<div class="drop-row">' +
              '<div class="drop-row-left"><strong>' + escapeHtml(dIcon + d.name) + ' ×' + S.formatNumber(d.qty) + '</strong></div>' +
              '<div class="drop-row-right"><span class="weight-text">' + S.formatNumber(d.weight * d.qty) + ' pt.</span><span class="badge badge-cyan">' + escapeHtml(d.destination) + '</span></div>' +
            '</div>'
          );
        }
      }
      dropsHtml += '</div>';
    }

    var gs = recap.globalScore || {};
    var gsHtml =
      '<div class="panel" style="margin-bottom:12px;">' +
        '<div class="panel-title"><span>' + icon('modules', 'recap') + ' Global Score (' + escapeHtml(recap.planetName) + ' — Difficoltà ' + recap.difficulty + ')</span><span class="badge badge-cyan">' + S.formatNumber(gs.streakShown || 0) + ' / ' + S.formatNumber(gs.target || 10) + '</span></div>' +
        (gs.completed && gs.reward
          ? '<p class="feedback-line feedback-ok" style="margin-top:0;">STREAK 10/10 COMPLETATA! Premio ottenuto: +' + S.formatNumber(gs.reward.liquids) + ' ' + icon('stats', 'liquids') + ' Liquidi Plusvalenti e +' + S.formatNumber(gs.reward.credits) + ' ' + icon('stats', 'credits') + ' Crediti!</p>'
          : '<p class="section-subtitle">Progresso serie attuale: ' + S.formatNumber(gs.streakAfter || 0) + ' / ' + S.formatNumber(gs.target || 10) + '</p>') +
      '</div>';

    var body = (
      '<p class="section-subtitle" style="margin-bottom:10px;"><strong>' + icon('stats', 'planet') + ' ' + escapeHtml(recap.planetName) + ' — Difficoltà ' + recap.difficulty + ': ' + escapeHtml(recap.missionName) + '</strong></p>' +
      '<div class="recap-summary-grid">' +
        '<div class="stat-row"><span class="stat-row-label">Turni impiegati</span><span class="stat-row-val">' + formatRecapValue(recap.turns) + '</span></div>' +
        '<div class="stat-row"><span class="stat-row-label">Alieni uccisi</span><span class="stat-row-val">' + formatRecapValue(recap.aliensKilled) + '</span></div>' +
        '<div class="stat-row"><span class="stat-row-label">' + icon('stats', 'exp') + ' EXP ottenuta</span><span class="stat-row-val">' + formatRecapValue(recap.expGained, '+') + '</span></div>' +
        '<div class="stat-row"><span class="stat-row-label">' + icon('stats', 'credits') + ' Crediti missione</span><span class="stat-row-val val-credits">' + formatRecapValue(recap.creditsEarned, '+') + '</span></div>' +
        '<div class="stat-row"><span class="stat-row-label">' + icon('stats', 'hp') + ' Danni subiti</span><span class="stat-row-val">' + formatRecapValue(recap.damageTaken) + '</span></div>' +
        '<div class="stat-row"><span class="stat-row-label">' + icon('stats', 'exp') + ' Livelli ottenuti</span><span class="stat-row-val">' + formatRecapValue(recap.levelsGained, '+') + '</span></div>' +
      '</div>' +
      gsHtml +
      '<div class="panel-title" style="font-size:0.92rem;"><span>Oggetti &amp; Equipaggiamenti Droppati</span></div>' +
      dropsHtml
    );
    openModal(icon('modules', 'recap') + ' Resoconto Missione Completata', body);
  }

  function openDefeatModal(summary) {
    var body = (
      '<p class="section-subtitle notice-danger" style="margin-bottom:12px;">La tua Vita è scesa a zero durante <strong>' + escapeHtml(summary.missionName) + '</strong> su ' + escapeHtml(summary.planetName) + '.</p>' +
      '<div class="recap-summary-grid">' +
        '<div class="stat-row"><span class="stat-row-label">EXP persa (-75%)</span><span class="stat-row-val stat-val-danger">-' + S.formatNumber(summary.expLost) + '</span></div>' +
        '<div class="stat-row"><span class="stat-row-label">Crediti persi (-50%)</span><span class="stat-row-val stat-val-danger">-' + S.formatNumber(summary.creditsLost) + '</span></div>' +
        '<div class="stat-row"><span class="stat-row-label">Alieni abbattuti</span><span class="stat-row-val">' + S.formatNumber(summary.aliensKilled) + ' / ' + S.formatNumber(summary.aliensTotal) + '</span></div>' +
        '<div class="stat-row"><span class="stat-row-label">Stato rientro</span><span class="stat-row-val">' + S.formatNumber(summary.respawnHp) + ' Vita · 0 Scudo</span></div>' +
      '</div>' +
      '<p class="section-subtitle">Sei stato riportato d\'emergenza sulla tua Nave Spaziale.</p>'
    );
    openModal('Missione Fallita — Sei stato abbattuto', body);
  }

  function openEscapeModal(summary) {
    var body = (
      '<p class="section-subtitle notice-ok" style="margin-bottom:12px;">Tiro 1d20 riuscito con <strong>' + S.formatNumber(summary.roll) + ' / 20</strong>! Sei riuscito a sganciarti da <strong>' + escapeHtml(summary.missionName) + '</strong>.</p>' +
      '<div class="recap-summary-grid">' +
        '<div class="stat-row"><span class="stat-row-label">EXP persa (-30%)</span><span class="stat-row-val stat-val-warn">-' + S.formatNumber(summary.expLost) + '</span></div>' +
        '<div class="stat-row"><span class="stat-row-label">Turno di fuga</span><span class="stat-row-val">' + S.formatNumber(summary.turn) + '</span></div>' +
      '</div>' +
      '<p class="section-subtitle">Sei rientrato sulla tua Nave Spaziale su ' + escapeHtml(summary.planetName) + '.</p>'
    );
    openModal('Fuga Riuscita', body);
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

  function renderActiveTab() {
    var content = document.getElementById('tab-content');
    if (!content) {
      return;
    }
    var active = S.state.ui.activeTab;
    if (active === 'map') {
      renderMapTab(content);
    } else if (active === 'mission') {
      renderMissionTab(content);
    } else if (active === 'options') {
      renderOptionsTab(content);
    } else {
      renderShipTab(content);
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

  function refreshInventoryViews() {
    if (activeModalKind === 'backpack_cargo') {
      var bodyEl = document.getElementById('modal-body');
      if (bodyEl) {
        bodyEl.innerHTML = renderBackpackCargoSection();
      }
    }
    renderActiveTab();
  }

  function render() {
    renderHud();
    renderTabs();
    renderActiveTab();
    if (activeModalKind === 'backpack_cargo') {
      var bodyEl = document.getElementById('modal-body');
      if (bodyEl) {
        bodyEl.innerHTML = renderBackpackCargoSection();
      }
    }
  }

  function handleCopySave() {
    var box = document.getElementById('export-code-box');
    var code = box ? box.value : S.exportSaveCode();
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(code).then(
        function () {
          showToast('Codice di salvataggio copiato negli appunti.', 'ok');
        },
        function () {
          fallbackCopy(box);
        }
      );
    } else {
      fallbackCopy(box);
    }
  }

  function fallbackCopy(box) {
    if (!box) {
      return;
    }
    box.focus();
    box.select();
    try {
      document.execCommand('copy');
      showToast('Codice di salvataggio copiato negli appunti.', 'ok');
    } catch (err) {
      showToast('Seleziona manualmente il codice dal riquadro e copialo.', 'err');
    }
  }

  function handleTabBarClick(e) {
    var btn = e.target.closest('.tab-btn');
    if (!btn) {
      return;
    }
    var tabId = btn.getAttribute('data-tab');
    var res = S.setActiveTab(tabId);
    if (!res.ok) {
      showToast(res.message, 'err');
    } else {
      importFeedback = { text: '', ok: true };
      renameFeedback = { text: '', ok: true };
      transferPicker = null;
      renderActiveTab();
    }
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
      if (activeModalKind) {
        closeModal();
      }
      var navRes = S.setActiveTab(targetTab);
      if (!navRes.ok) {
        showToast(navRes.message, 'err');
      }
      return true;
    }

    var ammoBtn = e.target.closest('[data-transfer-ammo]');
    if (ammoBtn) {
      var ammoParts = ammoBtn.getAttribute('data-transfer-ammo').split('|');
      var ammoRes = S.transferAmmo(ammoParts[0], ammoParts[1]);
      showToast(ammoRes.message, ammoRes.ok ? 'ok' : 'err');
      return true;
    }

    var useBtn = e.target.closest('[data-use-item]');
    if (useBtn) {
      var uParts = useBtn.getAttribute('data-use-item').split('|');
      handleUseItemClick(uParts[0], uParts[1]);
      return true;
    }

    var toggleEl = e.target.closest('[data-toggle-transfer]');
    if (toggleEl) {
      var tParts = toggleEl.getAttribute('data-toggle-transfer').split('|');
      var src = tParts[0];
      var itemId = tParts[1];
      if (transferPicker && transferPicker.source === src && transferPicker.itemId === itemId) {
        transferPicker = null;
      } else {
        transferPicker = { source: src, itemId: itemId, qty: 1 };
      }
      refreshInventoryViews();
      return true;
    }

    var deltaBtn = e.target.closest('[data-transfer-delta]');
    if (deltaBtn && transferPicker) {
      var lim = getTransferPickerLimits(transferPicker.source, transferPicker.itemId);
      if (lim.maxMovable <= 0) {
        return true;
      }
      var deltaAttr = deltaBtn.getAttribute('data-transfer-delta');
      if (deltaAttr === 'max') {
        transferPicker.qty = lim.maxMovable;
      } else {
        var delta = S.toInt(deltaAttr, 0);
        transferPicker.qty = S.clampInt(transferPicker.qty + delta, 1, lim.maxMovable, 1);
      }
      refreshInventoryViews();
      return true;
    }

    var confirmBtn = e.target.closest('[data-transfer-confirm]');
    if (confirmBtn && transferPicker) {
      var cParts = confirmBtn.getAttribute('data-transfer-confirm').split('|');
      var limConf = getTransferPickerLimits(transferPicker.source, transferPicker.itemId);
      var qtyToMove = limConf.maxMovable > 0 ? S.clampInt(transferPicker.qty, 1, limConf.maxMovable, 1) : 1;
      transferPicker = null;
      var moveRes = S.transferItem(cParts[1], cParts[0], qtyToMove);
      showToast(moveRes.message, moveRes.ok ? 'ok' : 'err');
      return true;
    }

    if (e.target.closest('[data-transfer-cancel]')) {
      transferPicker = null;
      refreshInventoryViews();
      return true;
    }

    return false;
  }

  function handleInventoryAreaInput(e) {
    var inputEl = e.target.closest('[data-transfer-input]');
    if (!inputEl || !transferPicker) {
      return;
    }
    var lim = getTransferPickerLimits(transferPicker.source, transferPicker.itemId);
    if (lim.maxMovable <= 0) {
      transferPicker.qty = 0;
      inputEl.value = '0';
      return;
    }
    var typed = S.toInt(inputEl.value, 1);
    var clamped = S.clampInt(typed, 1, lim.maxMovable, 1);
    transferPicker.qty = clamped;
    var pickerEl = inputEl.closest('.transfer-picker');
    var weightEl = pickerEl ? pickerEl.querySelector('[data-transfer-weight]') : null;
    if (weightEl) {
      weightEl.textContent = S.formatNumber(clamped * lim.weight) + ' pt.';
    }
  }

  function handleContentClick(e) {
    var diffBtn = e.target.closest('[data-select-diff]');
    if (diffBtn) {
      var diff = S.toInt(diffBtn.getAttribute('data-select-diff'), 0);
      var selRes = S.selectMission(diff, diff > 0);
      if (!selRes.ok) {
        showToast(selRes.message, 'err');
      }
      return;
    }

    var goMissionBtn = e.target.closest('[data-go-mission]');
    if (goMissionBtn) {
      var mDiff = S.toInt(goMissionBtn.getAttribute('data-go-mission'), 0);
      var goRes = S.selectMission(mDiff, true);
      if (!goRes.ok) {
        showToast(goRes.message, 'err');
      }
      return;
    }

    if (handleInventoryAreaClick(e)) {
      return;
    }

    // Step 3: Mission & Briefing actions
    if (e.target.closest('#btn-open-prep-backpack')) {
      transferPicker = null;
      openModal('Preparazione ' + icon('modules', 'backpack') + ' Zaino', renderBackpackCargoSection(), {
        wide: true,
        kind: 'backpack_cargo'
      });
      return;
    }

    if (e.target.closest('#btn-cancel-mission-ship')) {
      var cancelShipRes = S.cancelSelectedMission('ship');
      if (!cancelShipRes.ok) {
        showToast(cancelShipRes.message, 'err');
      }
      return;
    }

    if (e.target.closest('#btn-cancel-mission-map')) {
      var cancelMapRes = S.cancelSelectedMission('map');
      if (!cancelMapRes.ok) {
        showToast(cancelMapRes.message, 'err');
      }
      return;
    }

    if (e.target.closest('#btn-start-mission')) {
      var startRes = S.startSelectedMission();
      if (!startRes.ok) {
        showToast(startRes.message, 'err');
      }
      return;
    }

    if (e.target.closest('#btn-shoot-alien')) {
      var shootRes = S.shootAlien();
      if (!shootRes.ok) {
        showToast(shootRes.message, 'err');
      } else if (shootRes.outcome === 'death') {
        openDefeatModal(shootRes.summary);
      } else if (shootRes.leveledUp) {
        showToast('LEVEL UP! Raggiunto il Livello ' + shootRes.newLevel + '!', 'ok');
      }
      return;
    }

    if (e.target.closest('#btn-escape-mission')) {
      var escRes = S.attemptEscape();
      if (!escRes.ok) {
        showToast(escRes.message, 'err');
      } else if (escRes.outcome === 'escaped') {
        openEscapeModal(escRes.summary);
      } else if (escRes.outcome === 'death') {
        openDefeatModal(escRes.summary);
      } else if (escRes.outcome === 'escape_failed') {
        showToast('Fuga fallita (1d20: ' + escRes.roll + ')! Subiti ' + escRes.damage + ' danni.', 'err');
      }
      return;
    }

    if (e.target.closest('#btn-complete-mission')) {
      var compRes = S.completeMission();
      if (!compRes.ok) {
        showToast(compRes.message, 'err');
      } else {
        openRecapModal(compRes.recap);
      }
      return;
    }

    // Step 2: Ship actions
    if (e.target.closest('#btn-open-last-recap')) {
      if (S.state.lastMissionRecap) {
        openRecapModal(S.state.lastMissionRecap);
      }
      return;
    }

    if (e.target.closest('#btn-regen-chamber')) {
      var regRes = S.useRegenChamber();
      showToast(regRes.message, regRes.ok ? 'ok' : 'err');
      return;
    }

    if (e.target.closest('#btn-supply-capsule')) {
      var supRes = S.claimSupplyCapsule();
      showToast(supRes.message, supRes.ok ? 'ok' : 'err');
      return;
    }

    var unequipBtn = e.target.closest('[data-unequip-slot]');
    if (unequipBtn) {
      var unRes = S.unequipSlot(unequipBtn.getAttribute('data-unequip-slot'));
      showToast(unRes.message, unRes.ok ? 'ok' : 'err');
      return;
    }

    var equipBtn = e.target.closest('[data-equip-uid]');
    if (equipBtn) {
      var eqRes = S.equipFromStorage(equipBtn.getAttribute('data-equip-uid'));
      showToast(eqRes.message, eqRes.ok ? 'ok' : 'err');
      return;
    }

    var sellBtn = e.target.closest('[data-sell-uid]');
    if (sellBtn) {
      openSellConfirmModal(sellBtn.getAttribute('data-sell-uid'));
      return;
    }

    if (e.target.closest('#btn-upgrade-cargo')) {
      var upgRes = S.upgradeCargo();
      showToast(upgRes.message, upgRes.ok ? 'ok' : 'err');
      return;
    }

    // Options actions
    if (e.target.closest('#btn-copy-save')) {
      handleCopySave();
      return;
    }

    if (e.target.closest('#btn-load-save')) {
      var inputEl = document.getElementById('import-code-input');
      var code = inputEl ? inputEl.value : '';
      var loadRes = S.importSaveCode(code);
      if (loadRes.ok) {
        importFeedback = { text: '', ok: true };
        renameFeedback = { text: '', ok: true };
        showToast(loadRes.message, 'ok');
      } else {
        importFeedback = { text: loadRes.message, ok: false };
        showToast(loadRes.message, 'err');
        renderActiveTab();
        var newInput = document.getElementById('import-code-input');
        if (newInput) {
          newInput.value = code;
        }
      }
      return;
    }

    if (e.target.closest('#btn-rename-player')) {
      var nameInput = document.getElementById('rename-input');
      var proposed = nameInput ? nameInput.value : '';
      var renRes = S.renamePlayer(proposed);
      if (renRes.ok) {
        renameFeedback = { text: renRes.message, ok: true };
        showToast(renRes.message, 'ok');
        renderActiveTab();
      } else {
        renameFeedback = { text: renRes.message, ok: false };
        showToast(renRes.message, 'err');
        renderActiveTab();
        var newNameEl = document.getElementById('rename-input');
        if (newNameEl) {
          newNameEl.value = proposed;
        }
      }
      return;
    }

    if (e.target.closest('#btn-open-stats')) {
      openModal('Statistiche di Gioco', renderStatsModalHtml());
    }
  }

  function handleModalBodyClick(e) {
    if (handleInventoryAreaClick(e)) {
      return;
    }

    var pickBtn = e.target.closest('[data-repair-pick]');
    if (pickBtn) {
      var parts = pickBtn.getAttribute('data-repair-pick').split('|');
      var repRes = S.useItem(parts[0], parts[1], parts[2]);
      closeModal();
      showToast(repRes.message, repRes.ok ? 'ok' : 'err');
      return;
    }

    var sellConfirmBtn = e.target.closest('[data-confirm-sell-uid]');
    if (sellConfirmBtn) {
      var uid = sellConfirmBtn.getAttribute('data-confirm-sell-uid');
      var sellRes = S.sellStorageEquip(uid);
      closeModal();
      showToast(sellRes.message, sellRes.ok ? 'ok' : 'err');
    }
  }

  function init() {
    if (initialized) {
      return;
    }
    initialized = true;

    var tabBar = document.getElementById('tab-bar');
    var content = document.getElementById('tab-content');
    var modalRoot = document.getElementById('modal-root');
    var modalBody = document.getElementById('modal-body');
    var modalCloseBtn = document.getElementById('modal-close-btn');

    if (tabBar) {
      tabBar.addEventListener('click', handleTabBarClick);
    }
    if (content) {
      content.addEventListener('click', handleContentClick);
      content.addEventListener('input', handleInventoryAreaInput);
    }
    if (modalBody) {
      modalBody.addEventListener('click', handleModalBodyClick);
      modalBody.addEventListener('input', handleInventoryAreaInput);
    }
    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', closeModal);
    }
    if (modalRoot) {
      modalRoot.addEventListener('click', function (e) {
        if (e.target === modalRoot) {
          closeModal();
        }
      });
    }

    if (!cooldownTimerId) {
      cooldownTimerId = setInterval(refreshCooldownElements, 1000);
    }

    S.onStateChange(render);
  }

  S.ui = {
    init: init,
    render: render,
    showToast: showToast,
    openModal: openModal,
    closeModal: closeModal
  };

  if (typeof document !== 'undefined' && document.readyState !== 'loading') {
    init();
    render();
  }
})();
