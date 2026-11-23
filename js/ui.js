// js/ui.js
(function () {
  'use strict';

  var S = (window.Survival = window.Survival || {});
  var initialized = false;
  var cooldownTimerId = null;
  var importFeedback = { text: '', ok: true };
  var renameFeedback = { text: '', ok: true };

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

  function openModal(title, bodyHtml) {
    var root = document.getElementById('modal-root');
    var titleEl = document.getElementById('modal-title');
    var bodyEl = document.getElementById('modal-body');
    if (!root || !titleEl || !bodyEl) {
      return;
    }
    titleEl.textContent = title;
    bodyEl.innerHTML = bodyHtml;
    root.classList.remove('hidden');
  }

  function closeModal() {
    var root = document.getElementById('modal-root');
    if (root) {
      root.classList.add('hidden');
    }
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
      return '<span class="badge badge-ok">Standard</span>';
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
    if (!inst) {
      return (
        '<div class="equip-card ' + slotMeta.cssClass + '">' +
          '<div class="equip-slot-label">' +
            '<span>' + escapeHtml(slotMeta.label) + '</span>' +
            '<span>' + escapeHtml(slotMeta.role) + '</span>' +
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
          '<span>' + escapeHtml(slotMeta.label) + '</span>' +
          '<span>' + escapeHtml(slotMeta.role) + '</span>' +
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
    var i, entry, name, metaHtml, weightHtml;
    for (i = 0; i < mission.dropTable.length; i += 1) {
      entry = mission.dropTable[i];
      if (entry.kind === 'equip') {
        var eqModel = S.EQUIP_MODELS[entry.id];
        var eqSlot = eqModel ? S.EQUIP_SLOTS[eqModel.slot] : null;
        name = eqModel ? eqModel.name : entry.id;
        metaHtml =
          '<span class="equip-text-' + (eqSlot ? eqSlot.id : 'suit') + '"><strong>' + escapeHtml(name) + '</strong></span>' +
          '<span class="badge badge-cyan">Equip (' + (eqModel ? eqModel.maxDd : 0) + ' Dd)</span>';
        weightHtml = '<span class="badge badge-step">Slot</span>';
      } else {
        var itemDef = S.ITEMS[entry.id];
        name = itemDef ? itemDef.name : entry.id;
        metaHtml = '<span><strong>' + escapeHtml(name) + '</strong></span>';
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
          '<span class="hud-planet-pill">' + escapeHtml(planet.name) + '</span>' +
          (S.state.mission.active ? '<span class="hud-mission-flag">In Missione</span>' : '') +
        '</div>' +
        '<div class="hud-currencies">' +
          '<div class="hud-chip"><span class="hud-chip-label">Crediti</span><span class="hud-chip-val val-credits">' + S.formatNumber(p.credits) + '</span></div>' +
          '<div class="hud-chip"><span class="hud-chip-label">Liquidi</span><span class="hud-chip-val val-liquids">' + S.formatNumber(p.liquids) + '</span></div>' +
          '<div class="hud-chip"><span class="hud-chip-label">Munizioni</span><span class="hud-chip-val val-ammo">' + S.formatNumber(S.state.backpack.ammo) + '</span></div>' +
        '</div>' +
      '</div>' +
      '<div class="hud-bars-grid">' +
        '<div class="stat-meter">' +
          '<div class="stat-meter-head"><span class="stat-meter-title">Livello ' + S.formatNumber(p.level) + ' · EXP</span><span class="stat-meter-value">' + expLabel + '</span></div>' +
          '<div class="progress-track"><div class="progress-fill fill-exp" style="width:' + expPct + '%"></div></div>' +
        '</div>' +
        '<div class="stat-meter">' +
          '<div class="stat-meter-head"><span class="stat-meter-title">Vita</span><span class="stat-meter-value">' + S.formatNumber(p.hp) + ' / ' + S.formatNumber(lv.maxHp) + '</span></div>' +
          '<div class="progress-track"><div class="progress-fill fill-hp" style="width:' + hpPct + '%"></div></div>' +
        '</div>' +
        '<div class="stat-meter">' +
          '<div class="stat-meter-head"><span class="stat-meter-title">Scudo</span><span class="stat-meter-value">' + S.formatNumber(p.shield) + ' / ' + S.formatNumber(lv.maxShield) + '</span></div>' +
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
    var i, btn, tabId, isCurrent, isLocked;
    var labels = {
      map: 'Mappa',
      mission: 'Missione',
      ship: 'Nave Spaziale',
      options: 'Opzioni'
    };

    for (i = 0; i < buttons.length; i += 1) {
      btn = buttons[i];
      tabId = btn.getAttribute('data-tab');
      isCurrent = tabId === active;
      isLocked = inMission && tabId !== 'mission';

      btn.classList.toggle('active', isCurrent);
      btn.classList.toggle('locked-by-mission', isLocked);
      btn.disabled = isLocked;

      if (tabId === 'mission' && selectedDiff > 0 && !inMission) {
        btn.innerHTML = '<span>' + labels[tabId] + '</span><span class="tab-indicator" title="Missione selezionata"></span>';
      } else {
        btn.textContent = labels[tabId] || tabId;
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
          '<span class="mission-option-name">Nave Spaziale (Posizione Attuale)</span>' +
          '<span class="badge badge-cyan">Sicura</span>' +
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
            '<span class="mission-option-name">Difficoltà ' + d + ' — ' + escapeHtml(m.name) + '</span>' +
            (lockInfo.unlocked
              ? '<span class="badge badge-ok">Sbloccata</span>'
              : '<span class="badge badge-danger">' + escapeHtml(lockInfo.reason) + '</span>') +
          '</div>' +
          '<div class="mission-option-meta">' +
            '<span>Alieni: <strong>' + formatAliensRange(m) + '</strong></span>' +
            '<span>Premio base: <strong class="val-credits">' + S.formatNumber(m.creditsReward) + ' Crediti</strong></span>' +
            renderFeatureBadges(m.features) +
          '</div>' +
        '</button>'
      );
    }

    var detailHtml = '';
    if (selected === 0) {
      detailHtml = (
        '<div class="panel">' +
          '<div class="panel-title"><span>Dettagli Selezione</span><span class="badge badge-cyan">Nave Spaziale</span></div>' +
          '<p class="section-subtitle">Attualmente sei attraccato sulla tua Nave Spaziale in orbita attorno a <strong>' + escapeHtml(planet.name) + '</strong>. Seleziona una delle 4 difficoltà qui a sinistra per consultarne i nemici, le probabilità di drop e prepararti alla missione.</p>' +
        '</div>'
      );
    } else {
      var selMission = planet.missions[selected];
      detailHtml = (
        '<div class="panel panel-highlight">' +
          '<div class="panel-title">' +
            '<span>Difficoltà ' + selected + ': ' + escapeHtml(selMission.name) + '</span>' +
            renderFeatureBadges(selMission.features) +
          '</div>' +
          '<p class="section-subtitle">' + escapeHtml(selMission.description) + '</p>' +
          '<div class="btn-row" style="margin: 10px 0 12px;">' +
            '<span class="badge badge-cyan">Alieni: ' + formatAliensRange(selMission) + '</span>' +
            '<span class="badge badge-warn">Premio: ' + S.formatNumber(selMission.creditsReward) + ' Crediti</span>' +
          '</div>' +
          '<div class="panel-title" style="font-size:0.88rem; margin-bottom:6px;"><span>Anteprima Probabilità Drop</span></div>' +
          renderDropPreviewList(selMission) +
          '<div class="btn-row" style="margin-top: 14px;">' +
            '<button type="button" class="btn btn-primary" data-go-mission="' + selected + '">Vai al Briefing Missione</button>' +
          '</div>' +
        '</div>'
      );
    }

    var gs = S.state.globalScore;
    var gsTarget = S.GLOBAL_SCORE_TARGET;
    var gsPct = percentInt(gs.streak, gsTarget);
    var previewDiff = selected > 0 ? selected : 1;
    var gsMission = planet.missions[previewDiff];
    var gsReward = gsMission && gsMission.globalScoreReward ? gsMission.globalScoreReward : { liquids: 1, credits: 100 };

    var locsHtml = '';
    var i, loc;
    for (i = 0; i < planet.locations.length; i += 1) {
      loc = planet.locations[i];
      locsHtml += (
        '<div class="module-card">' +
          '<div>' +
            '<div class="module-card-head">' +
              '<h3 class="module-card-title">' + escapeHtml(loc.name) + '</h3>' +
              '<span class="badge badge-step">Step 5</span>' +
            '</div>' +
            '<p class="module-card-desc" style="margin-top:6px;">' + escapeHtml(loc.description) + '</p>' +
          '</div>' +
          '<div class="btn-row">' +
            '<span class="badge badge-purple">' + escapeHtml(loc.tag) + '</span>' +
            '<button type="button" class="btn btn-ghost btn-sm" disabled>Visita (Dd Stivali)</button>' +
          '</div>' +
        '</div>'
      );
    }

    container.innerHTML = (
      '<div class="section-header">' +
        '<div>' +
          '<h1 class="section-title">Mappa Planetaria — ' + escapeHtml(planet.name) + '</h1>' +
          '<p class="section-subtitle">' + escapeHtml(planet.subtitle) + ' · ' + escapeHtml(planet.description) + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="map-layout">' +
        '<div class="panel">' +
          '<div class="panel-title"><span>Missioni Disponibili</span><span class="badge badge-cyan">4 Difficoltà</span></div>' +
          '<div class="mission-list">' + listHtml + '</div>' +
        '</div>' +
        detailHtml +
      '</div>' +
      '<div class="panel">' +
        '<div class="panel-title">' +
          '<span>Global Score (Streak 10/10)</span>' +
          '<span class="badge badge-cyan">' + S.formatNumber(gs.streak) + ' / ' + S.formatNumber(gsTarget) + '</span>' +
        '</div>' +
        '<div class="progress-track" style="height:10px; margin-bottom:8px;">' +
          '<div class="progress-fill fill-exp" style="width:' + gsPct + '%"></div>' +
        '</div>' +
        '<p class="section-subtitle">Track attivo: <strong>' + escapeHtml(gs.activeKey || 'Nessuna serie iniziata') + '</strong> · Premio 10/10 (Diff. ' + previewDiff + '): <strong class="val-liquids">' + S.formatNumber(gsReward.liquids) + ' Liquidi Plusvalenti</strong> + <strong class="val-credits">' + S.formatNumber(gsReward.credits) + ' Crediti</strong>. Cambiare difficoltà azzera il progresso attuale.</p>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="panel-title"><span>Esplorazione Pianeta (Fuori Missione)</span><span class="badge badge-purple">Usa Dd Stivali Spaziali</span></div>' +
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
    var i, id, qty, def, lineW, canUse;
    for (i = 0; i < keys.length; i += 1) {
      id = keys[i];
      qty = S.toInt(items[id], 0);
      def = S.ITEMS[id];
      if (!def || qty <= 0) {
        continue;
      }
      lineW = def.weight * qty;
      canUse = id !== 'chip_identita';
      html += (
        '<div class="inv-item-row">' +
          '<div class="inv-item-info">' +
            '<span><strong>' + escapeHtml(def.name) + '</strong> ×' + S.formatNumber(qty) + ' · <span class="weight-text">' + S.formatNumber(lineW) + ' pt.</span></span>' +
            '<span class="inv-item-sub">' + escapeHtml(def.description) + '</span>' +
          '</div>' +
          '<div class="inv-item-actions">' +
            (canUse
              ? '<button type="button" class="btn btn-sm" data-use-item="backpack|' + escapeHtml(id) + '">Usa</button>'
              : '<span class="badge badge-step">Solo Opzioni</span>') +
          '</div>' +
        '</div>'
      );
    }
    html += '</div>';
    return html;
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

      var actionHtml = '';
      if (ms.completedReady) {
        actionHtml = (
          '<p class="section-subtitle" style="margin-bottom:10px; color:var(--weight-green);">Tutti gli alieni sono stati eliminati! Premi il pulsante qui sotto per completare la missione, raccogliere i drop e tornare al riepilogo.</p>' +
          '<button type="button" class="btn btn-success btn-combat-big" id="btn-complete-mission">Completa Missione</button>'
        );
      } else if (ammoLeft > 0) {
        actionHtml = (
          '<button type="button" class="btn btn-primary btn-combat-big" id="btn-shoot-alien">SPARA (-1 Munizione)</button>' +
          '<p class="section-subtitle" style="margin-top:8px;">Ogni sparo elimina 1 alieno (+1 EXP immediato) e, se restano nemici vivi, attiva il loro contrattacco (danno base ' + S.formatNumber(mCfg ? mCfg.enemyDamage : 1) + ', ridotto dalla Tuta e assorbito prima dallo Scudo).</p>'
        );
      } else {
        actionHtml = (
          '<p class="section-subtitle" style="margin-bottom:10px; color:#ff8fa3;"><strong>Munizioni esaurite!</strong> Usa un Caricatore Standard nello Zaino oppure tenta la fuga d\'emergenza (tiro 1d20, serve almeno 18; in caso di successo perdi il 30% dell\'EXP attuale, altrimenti subisci il contrattacco).</p>' +
          '<button type="button" class="btn btn-danger btn-combat-big" id="btn-escape-mission">FUGGI (Tira 1d20 — serve ≥ 18)</button>'
        );
      }

      var logHtml = '';
      if (!ms.log || ms.log.length === 0) {
        logHtml = '<p class="section-subtitle">Nessuna azione registrata.</p>';
      } else {
        logHtml = '<div class="combat-log">';
        var li, entry;
        for (li = 0; li < ms.log.length; li += 1) {
          entry = ms.log[li];
          logHtml += (
            '<div class="combat-log-entry">' +
              '<span class="combat-log-turn">[T' + S.formatNumber(entry.turn) + ']</span>' +
              '<span>' + escapeHtml(entry.text) + '</span>' +
            '</div>'
          );
        }
        logHtml += '</div>';
      }

      container.innerHTML = (
        '<div class="combat-banner">' +
          '<div class="section-header" style="border-bottom-color:rgba(0,229,255,0.28); padding-bottom:6px;">' +
            '<div>' +
              '<h1 class="section-title">' + escapeHtml(planet.name) + ' · Difficoltà ' + ms.selectedDifficulty + ' — ' + escapeHtml(mCfg ? mCfg.name : '') + '</h1>' +
              '<p class="section-subtitle">Mission = TRUE · Tutte le altre schede sono bloccate fino al termine della missione.</p>' +
            '</div>' +
            renderFeatureBadges(mCfg ? mCfg.features : []) +
          '</div>' +
          '<div class="combat-counters">' +
            '<div class="combat-stat-box"><span class="combat-stat-label">Turno</span><span class="combat-stat-value">' + S.formatNumber(ms.turn) + '</span></div>' +
            '<div class="combat-stat-box"><span class="combat-stat-label">Alieni Rimanenti</span><span class="combat-stat-value aliens-val">' + S.formatNumber(ms.aliensLeft) + ' / ' + S.formatNumber(ms.aliensTotal) + '</span></div>' +
            '<div class="combat-stat-box"><span class="combat-stat-label">Munizioni Zaino</span><span class="combat-stat-value">' + S.formatNumber(ammoLeft) + '</span></div>' +
          '</div>' +
          '<div class="progress-track" style="height:9px;" title="Alieni eliminati: ' + aliensKilled + '/' + ms.aliensTotal + '">' +
            '<div class="progress-fill fill-hp" style="width:' + aliensLeftPct + '%"></div>' +
          '</div>' +
          (ms.selectedDifficulty >= 2
            ? '<p class="section-subtitle">Nota: le meccaniche speciali di Meteo / Alieni Mutati / Boss per le Difficoltà 2–4 saranno attivate nello Step 4.</p>'
            : '') +
        '</div>' +
        '<div class="grid-2">' +
          '<div class="panel panel-highlight">' +
            '<div class="panel-title"><span>Azioni di Combattimento</span><span class="badge badge-cyan">Turno ' + S.formatNumber(ms.turn) + '</span></div>' +
            actionHtml +
          '</div>' +
          '<div class="panel">' +
            '<div class="panel-title">' +
              '<span>Zaino Rapido (Non avanza il turno)</span>' +
              '<span class="weight-text">' + S.formatNumber(bpUsed) + ' / ' + S.formatNumber(bpMax) + ' pt.</span>' +
            '</div>' +
            renderMissionBackpackItems() +
          '</div>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-title"><span>Equipaggiamento Attivo</span><span class="badge badge-cyan">Usura Dd in Tempo Reale</span></div>' +
          '<div class="grid-4">' +
            renderEquipSlotCard('helmet', false) +
            renderEquipSlotCard('suit', false) +
            renderEquipSlotCard('boots', false) +
            renderEquipSlotCard('rifle', false) +
          '</div>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-title"><span>Registro Tattico</span><span class="badge badge-cyan">EXP guadagnata: +' + S.formatNumber(ms.expGained) + '</span></div>' +
          logHtml +
        '</div>'
      );
      return;
    }

    // Stato fuori missione senza difficoltà selezionata
    var diff = ms.selectedDifficulty;
    if (!diff || diff <= 0 || !planet.missions[diff]) {
      container.innerHTML = (
        '<div class="panel empty-state">' +
          '<h1 class="section-title">Nessuna Missione Selezionata</h1>' +
          '<p class="section-subtitle">Sei attualmente attraccato sulla Nave Spaziale. Scegli una difficoltà disponibile dal tab <strong>Mappa</strong> per aprire il briefing operativo.</p>' +
          '<button type="button" class="btn btn-primary" data-nav-tab="map">Apri Mappa</button>' +
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
          '<h1 class="section-title">Briefing Missione — ' + escapeHtml(planet.name) + ' (Difficoltà ' + diff + ')</h1>' +
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
            '<div class="inv-item-row"><span>Ricompensa base</span><strong class="mono val-credits">' + S.formatNumber(m.creditsReward) + ' Crediti</strong></div>' +
            '<div class="inv-item-row"><span>Peso Zaino caricato</span><span class="weight-text">' + S.formatNumber(bpTotal) + ' / ' + S.formatNumber(bpCap) + ' pt.</span></div>' +
            '<div class="inv-item-row"><span>Munizioni pronte</span><strong class="mono val-ammo">' + S.formatNumber(S.state.backpack.ammo) + '</strong></div>' +
          '</div>' +
          '<div class="btn-row" style="margin-top:14px;">' +
            '<button type="button" class="btn btn-ghost" id="btn-cancel-mission">Annulla → Nave Spaziale</button>' +
            '<button type="button" class="btn btn-primary" id="btn-start-mission">Inizia Missione</button>' +
          '</div>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-title"><span>Probabilità Drop Missione</span></div>' +
          renderDropPreviewList(m) +
        '</div>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="panel-title"><span>Equipaggiamento Attivo per la Missione</span></div>' +
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
    var i, inst, model, slotMeta, ddPct, isBroken;
    for (i = 0; i < list.length; i += 1) {
      inst = list[i];
      model = S.EQUIP_MODELS[inst.modelId];
      slotMeta = model ? S.EQUIP_SLOTS[model.slot] : null;
      if (!model || !slotMeta) {
        continue;
      }
      ddPct = percentInt(inst.dd, model.maxDd);
      isBroken = inst.dd <= 0;
      html += (
        '<div class="equip-card ' + slotMeta.cssClass + (isBroken ? ' equip-broken' : '') + '">' +
          '<div class="equip-slot-label">' +
            '<span>' + escapeHtml(slotMeta.label) + '</span>' +
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
              '<button type="button" class="btn btn-warn btn-sm" data-sell-uid="' + escapeHtml(inst.uid) + '">Vendi (+' + S.formatNumber(model.sellPrice) + ')</button>' +
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
    var moveLabel = isBackpack ? '→ Stiva' : '← Zaino';

    var html = '<div class="inv-item-list">';
    var i, id, qty, def, lineWeight, useBtnHtml;
    for (i = 0; i < keys.length; i += 1) {
      id = keys[i];
      qty = S.toInt(itemsMap[id], 0);
      def = S.ITEMS[id];
      if (!def || qty <= 0) {
        continue;
      }
      lineWeight = def.weight * qty;
      if (id === 'chip_identita') {
        useBtnHtml = '<button type="button" class="btn btn-ghost btn-sm" data-nav-tab="options">Usa in Opzioni</button>';
      } else {
        useBtnHtml = '<button type="button" class="btn btn-sm" data-use-item="' + sourceKey + '|' + escapeHtml(id) + '">Usa</button>';
      }

      html += (
        '<div class="inv-item-row">' +
          '<div class="inv-item-info">' +
            '<span><strong>' + escapeHtml(def.name) + '</strong> ×' + S.formatNumber(qty) + ' · <span class="weight-text">' + S.formatNumber(lineWeight) + ' pt.</span></span>' +
            '<span class="inv-item-sub">' + escapeHtml(def.description) + '</span>' +
          '</div>' +
          '<div class="inv-item-actions">' +
            useBtnHtml +
            '<button type="button" class="btn btn-ghost btn-sm" data-move-item="' + moveDir + '|' + escapeHtml(id) + '|1">' + moveLabel + '</button>' +
            (qty > 1
              ? '<button type="button" class="btn btn-ghost btn-sm" data-move-item="' + moveDir + '|' + escapeHtml(id) + '|all">Tutti</button>'
              : '') +
          '</div>' +
        '</div>'
      );
    }
    html += '</div>';
    return html;
  }

  function renderShipTab(container) {
    var bpItemsW = S.getBackpackItemsWeight();
    var bpAmmoW = S.getBackpackAmmoWeight();
    var bpTotalW = S.getBackpackTotalWeight();
    var bpMaxW = S.state.backpack.maxWeight;
    var bpAmmoPct = percentInt(bpAmmoW, bpMaxW);
    var bpItemsPct = Math.min(100 - bpAmmoPct, percentInt(bpItemsW, bpMaxW));

    var cargoItemsW = S.getCargoItemsWeight();
    var cargoMaxW = S.getCargoMaxWeight();
    var cargoPct = percentInt(cargoItemsW, cargoMaxW);
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
          '<h1 class="section-title">Nave Spaziale — Ponte Principale</h1>' +
          '<p class="section-subtitle">Home operativa di bordo. Prepara equipaggiamento, Zaino e Stiva prima di partire.</p>' +
        '</div>' +
        '<button type="button" class="btn btn-primary btn-sm" data-nav-tab="map">Scegli Missione in Mappa</button>' +
      '</div>' +
      '<div class="module-grid">' +
        '<div class="module-card">' +
          '<div>' +
            '<div class="module-card-head">' +
              '<h3 class="module-card-title">Recap Ultima Missione</h3>' +
              '<span class="badge ' + (hasRecap ? 'badge-ok' : 'badge-step') + '">' + (hasRecap ? 'Disponibile' : 'Vuoto') + '</span>' +
            '</div>' +
            '<p class="module-card-desc" style="margin-top:6px;">' + escapeHtml(lastRecapLabel) + '</p>' +
          '</div>' +
          '<button type="button" class="btn btn-sm" id="btn-open-last-recap"' + (hasRecap ? '' : ' disabled') + '>Apri Resoconto</button>' +
        '</div>' +
        '<div class="module-card">' +
          '<div>' +
            '<div class="module-card-head">' +
              '<h3 class="module-card-title">Camera di Rigenerazione</h3>' +
              '<span class="badge ' + (regenRem > 0 ? 'badge-warn' : 'badge-ok') + '" data-cd-label="regen">' + (regenRem > 0 ? S.formatDuration(regenRem) : 'Pronta') + '</span>' +
            '</div>' +
            '<p class="module-card-desc" style="margin-top:6px;">Ripristina al 100% Vita e Scudo senza consumare oggetti (ricarica 120s).</p>' +
          '</div>' +
          '<button type="button" class="btn btn-primary btn-sm" id="btn-regen-chamber" data-cd-btn="regen"' + (regenRem > 0 ? ' disabled' : '') + '>' + (regenRem > 0 ? 'In ricarica (' + S.formatDuration(regenRem) + ')' : 'Rigenera Tutto') + '</button>' +
        '</div>' +
        '<div class="module-card">' +
          '<div>' +
            '<div class="module-card-head">' +
              '<h3 class="module-card-title">Capsula Rifornimenti</h3>' +
              '<span class="badge ' + (supplyRem > 0 ? 'badge-warn' : 'badge-ok') + '" data-cd-label="supply">' + (supplyRem > 0 ? S.formatDuration(supplyRem) : 'Pronta') + '</span>' +
            '</div>' +
            '<p class="module-card-desc" style="margin-top:6px;">Consegna 25–40 Munizioni in Stiva e 1 consumabile base (ricarica 240s).</p>' +
          '</div>' +
          '<button type="button" class="btn btn-primary btn-sm" id="btn-supply-capsule" data-cd-btn="supply"' + (supplyRem > 0 ? ' disabled' : '') + '>' + (supplyRem > 0 ? 'In ricarica (' + S.formatDuration(supplyRem) + ')' : 'Apri Capsula') + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="panel-title"><span>Equipaggiamento Indossato & Armeria Nave</span><span class="badge badge-cyan">Deposito: ' + S.formatNumber((S.state.equipment.storage || []).length) + ' pezzi</span></div>' +
        '<div class="grid-4">' +
          renderEquipSlotCard('helmet', true) +
          renderEquipSlotCard('suit', true) +
          renderEquipSlotCard('boots', true) +
          renderEquipSlotCard('rifle', true) +
        '</div>' +
        renderStorageEquipSection() +
      '</div>' +
      '<div class="grid-2">' +
        '<div class="panel">' +
          '<div class="panel-title">' +
            '<span>Zaino (Equipaggiato in Missione)</span>' +
            '<span class="weight-text">' + S.formatNumber(bpTotalW) + ' / ' + S.formatNumber(bpMaxW) + ' pt.</span>' +
          '</div>' +
          '<div class="progress-track" style="height:9px; margin-bottom:8px;">' +
            '<div class="progress-fill fill-ammo" style="width:' + bpAmmoPct + '%" title="Munizioni"></div>' +
            '<div class="progress-fill fill-items" style="width:' + bpItemsPct + '%" title="Oggetti"></div>' +
          '</div>' +
          '<div class="mission-option-meta">' +
            '<span>Munizioni: <strong class="val-ammo">' + S.formatNumber(S.state.backpack.ammo) + '</strong> (<span class="weight-text">' + S.formatNumber(bpAmmoW) + ' pt.</span>)</span>' +
            '<span>Oggetti: <span class="weight-text">' + S.formatNumber(bpItemsW) + ' pt.</span></span>' +
          '</div>' +
          '<div class="ammo-transfer-bar">' +
            '<span class="ammo-transfer-label">Sposta Munizioni → Stiva:</span>' +
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
            '<span>Stiva (Riserva della Nave)</span>' +
            '<span class="weight-text">' + S.formatNumber(cargoItemsW) + ' / ' + S.formatNumber(cargoMaxW) + ' pt.</span>' +
          '</div>' +
          '<div class="progress-track" style="height:9px; margin-bottom:8px;">' +
            '<div class="progress-fill fill-items" style="width:' + cargoPct + '%"></div>' +
          '</div>' +
          '<div class="mission-option-meta">' +
            '<span>Munizioni in Stiva: <strong class="val-ammo">' + S.formatNumber(S.state.cargo.ammo) + '</strong> (<span class="weight-text">Capienza ∞</span>)</span>' +
          '</div>' +
          '<div class="ammo-transfer-bar">' +
            '<span class="ammo-transfer-label">Trasferisci Munizioni → Zaino:</span>' +
            '<div class="btn-row" style="gap:6px;">' +
              '<button type="button" class="btn btn-ghost btn-sm" data-transfer-ammo="toBackpack|10">+10</button>' +
              '<button type="button" class="btn btn-ghost btn-sm" data-transfer-ammo="toBackpack|30">+30</button>' +
              '<button type="button" class="btn btn-ghost btn-sm" data-transfer-ammo="toBackpack|max">Max</button>' +
            '</div>' +
          '</div>' +
          renderInventoryList('cargo', S.state.cargo.items, 'Stiva oggetti vuota.') +
        '</div>' +
      '</div>' +
      '<div class="grid-2">' +
        '<div class="panel">' +
          '<div class="panel-title">' +
            '<span>Ricerca & Potenziamenti Nave</span>' +
            '<span class="badge badge-cyan">Stiva Lv. ' + S.formatNumber(upgInfo.level) + ' / ' + S.formatNumber(upgInfo.maxLevel) + '</span>' +
          '</div>' +
          '<p class="section-subtitle" style="margin-bottom:10px;">Espandi la capienza degli oggetti nella Stiva di <span class="weight-text">+100 pt.</span> per livello (attuale: <span class="weight-text">' + S.formatNumber(upgInfo.currentMaxWeight) + ' pt.</span>' + (upgInfo.isMaxed ? ' · MASSIMO' : ' → <span class="weight-text">' + S.formatNumber(upgInfo.nextMaxWeight) + ' pt.</span>') + ').</p>' +
          '<button type="button" class="btn btn-primary" id="btn-upgrade-cargo"' + (upgInfo.isMaxed || S.state.player.credits < upgInfo.nextCost ? ' disabled' : '') + '>' +
            (upgInfo.isMaxed
              ? 'Capienza Stiva al Massimo'
              : 'Potenzia Stiva (' + S.formatNumber(upgInfo.nextCost) + ' Crediti)') +
          '</button>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-title"><span>Biblioteca di Bordo (Libri)</span><span class="badge badge-step">Step 5</span></div>' +
          '<p class="section-subtitle">I Libri trovati durante le missioni e le esplorazioni verranno archiviati qui per la lettura integrale e sbloccheranno potenziamenti passivi permanenti.</p>' +
        '</div>' +
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
          '<h1 class="section-title">Opzioni, Salvataggio Locale & Statistiche</h1>' +
          '<p class="section-subtitle">Nessun salvataggio automatico online: copia manualmente il tuo codice alfanumerico per salvare i progressi.</p>' +
        '</div>' +
        '<span class="badge badge-cyan">Formato ' + escapeHtml(S.SAVE_PREFIX) + ' Retrocompatibile</span>' +
      '</div>' +
      '<div class="grid-2">' +
        '<div class="panel panel-highlight">' +
          '<div class="panel-title"><span>Esporta Codice di Salvataggio</span><span class="badge badge-ok">Manuale</span></div>' +
          '<p class="section-subtitle" style="margin-bottom:8px;">Copia e conserva questo codice alfanumerico al sicuro. Resterà compatibile anche con tutti i futuri aggiornamenti del gioco.</p>' +
          '<textarea id="export-code-box" class="code-box" readonly aria-label="Codice di salvataggio">' + escapeHtml(saveCode) + '</textarea>' +
          '<div class="btn-row" style="margin-top:10px;">' +
            '<button type="button" class="btn btn-primary" id="btn-copy-save">Copia Codice</button>' +
          '</div>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-title"><span>Carica Codice di Salvataggio</span></div>' +
          '<p class="section-subtitle" style="margin-bottom:8px;">Incolla un codice salvataggio precedentemente esportato per ripristinare i tuoi progressi.</p>' +
          '<textarea id="import-code-input" class="code-box" placeholder="Incolla qui il codice (es. SOS1...)"></textarea>' +
          '<div class="btn-row" style="margin-top:10px;">' +
            '<button type="button" class="btn" id="btn-load-save">Carica Salvataggio</button>' +
          '</div>' +
          (importFeedback.text
            ? '<div class="feedback-line ' + (importFeedback.ok ? 'feedback-ok' : 'feedback-err') + '">' + escapeHtml(importFeedback.text) + '</div>'
            : '') +
        '</div>' +
      '</div>' +
      '<div class="grid-2">' +
        '<div class="panel">' +
          '<div class="panel-title">' +
            '<span>Cambio Nome Personaggio</span>' +
            '<span class="weight-text">Chip Cambio Identità: 0 pt. (×' + S.formatNumber(tokenCount) + ')</span>' +
          '</div>' +
          '<p class="section-subtitle" style="margin-bottom:10px;">Richiede un oggetto consumabile <strong>Chip Cambio Identità</strong> (presente ×1 nella Stiva iniziale). Senza chip il cambio nome resta bloccato.</p>' +
          '<div class="btn-row">' +
            '<input type="text" id="rename-input" class="input-field" maxlength="20" placeholder="Nuovo nome (2-20 caratteri)" style="flex:1; min-width:180px;"' + (!canRename ? ' disabled' : '') + '>' +
            '<button type="button" class="btn btn-primary" id="btn-rename-player"' + (!canRename ? ' disabled' : '') + '>Cambia Nome</button>' +
          '</div>' +
          (renameFeedback.text
            ? '<div class="feedback-line ' + (renameFeedback.ok ? 'feedback-ok' : 'feedback-err') + '">' + escapeHtml(renameFeedback.text) + '</div>'
            : '') +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-title"><span>Statistiche di Gioco & Roadmap</span><span class="badge badge-ok">Alpha 1 (Step 3)</span></div>' +
          '<p class="section-subtitle" style="margin-bottom:10px;">Alieni uccisi: <strong class="mono">' + S.formatNumber(stats.aliensKilled) + '</strong> · Colpi sparati: <strong class="mono">' + S.formatNumber(stats.shotsFired) + '</strong> · Morti: <strong class="mono">' + S.formatNumber(stats.deaths) + '</strong></p>' +
          '<div class="btn-row">' +
            '<button type="button" class="btn" id="btn-open-stats">Consulta Statistiche Complete</button>' +
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
      { label: 'Camera di Rigenerazione usata', val: S.formatNumber(st.regenUsed) },
      { label: 'Capsule Rifornimenti aperte', val: S.formatNumber(st.suppliesClaimed) },
      { label: 'Crediti totali guadagnati', val: S.formatNumber(st.creditsEarned) },
      { label: 'Liquidi Plusvalenti guadagnati', val: S.formatNumber(st.liquidsEarned) }
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
      var i, d;
      for (i = 0; i < recap.drops.length; i += 1) {
        d = recap.drops[i];
        if (d.kind === 'equip') {
          dropsHtml += (
            '<div class="drop-row">' +
              '<div class="drop-row-left"><span class="equip-text-' + escapeHtml(d.slot) + '"><strong>' + escapeHtml(d.name) + '</strong></span> <span class="badge badge-cyan">' + escapeHtml(d.uid) + ' · ' + S.formatNumber(d.maxDd) + ' Dd</span></div>' +
              '<div class="drop-row-right"><span class="badge badge-ok">' + escapeHtml(d.destination) + '</span></div>' +
            '</div>'
          );
        } else {
          dropsHtml += (
            '<div class="drop-row">' +
              '<div class="drop-row-left"><strong>' + escapeHtml(d.name) + ' ×' + S.formatNumber(d.qty) + '</strong></div>' +
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
        '<div class="panel-title"><span>Global Score (' + escapeHtml(recap.planetName) + ' Diff. ' + recap.difficulty + ')</span><span class="badge badge-cyan">' + S.formatNumber(gs.streakShown || 0) + ' / ' + S.formatNumber(gs.target || 10) + '</span></div>' +
        (gs.completed && gs.reward
          ? '<p class="feedback-line feedback-ok" style="margin-top:0;">STREAK 10/10 COMPLETATA! Premio ottenuto: +' + S.formatNumber(gs.reward.liquids) + ' Liquidi Plusvalenti e +' + S.formatNumber(gs.reward.credits) + ' Crediti!</p>'
          : '<p class="section-subtitle">Progresso serie attuale: ' + S.formatNumber(gs.streakAfter || 0) + ' / ' + S.formatNumber(gs.target || 10) + '</p>') +
      '</div>';

    var body = (
      '<p class="section-subtitle" style="margin-bottom:10px;"><strong>' + escapeHtml(recap.planetName) + ' — Difficoltà ' + recap.difficulty + ': ' + escapeHtml(recap.missionName) + '</strong></p>' +
      '<div class="recap-summary-grid">' +
        '<div class="stat-row"><span class="stat-row-label">Turni impiegati</span><span class="stat-row-val">' + S.formatNumber(recap.turns) + '</span></div>' +
        '<div class="stat-row"><span class="stat-row-label">Alieni abbattuti</span><span class="stat-row-val">' + S.formatNumber(recap.aliensKilled) + '</span></div>' +
        '<div class="stat-row"><span class="stat-row-label">EXP guadagnata</span><span class="stat-row-val">+' + S.formatNumber(recap.expGained) + '</span></div>' +
        '<div class="stat-row"><span class="stat-row-label">Crediti missione</span><span class="stat-row-val val-credits">+' + S.formatNumber(recap.creditsEarned) + '</span></div>' +
        '<div class="stat-row"><span class="stat-row-label">Danni subiti</span><span class="stat-row-val">' + S.formatNumber(recap.damageTaken) + '</span></div>' +
        '<div class="stat-row"><span class="stat-row-label">Livelli saliti</span><span class="stat-row-val">+' + S.formatNumber(recap.levelsGained) + '</span></div>' +
      '</div>' +
      gsHtml +
      '<div class="panel-title" style="font-size:0.92rem;"><span>Oggetti & Equipaggiamenti Droppati</span></div>' +
      dropsHtml
    );
    openModal('Resoconto Missione Completata', body);
  }

  function openDefeatModal(summary) {
    var body = (
      '<p class="section-subtitle" style="margin-bottom:12px; color:#ff8fa3;">La tua Vita è scesa a zero durante <strong>' + escapeHtml(summary.missionName) + '</strong> su ' + escapeHtml(summary.planetName) + '.</p>' +
      '<div class="recap-summary-grid">' +
        '<div class="stat-row"><span class="stat-row-label">EXP persa (-75%)</span><span class="stat-row-val" style="color:var(--danger);">-' + S.formatNumber(summary.expLost) + '</span></div>' +
        '<div class="stat-row"><span class="stat-row-label">Crediti persi (-50%)</span><span class="stat-row-val" style="color:var(--danger);">-' + S.formatNumber(summary.creditsLost) + '</span></div>' +
        '<div class="stat-row"><span class="stat-row-label">Alieni abbattuti</span><span class="stat-row-val">' + S.formatNumber(summary.aliensKilled) + ' / ' + S.formatNumber(summary.aliensTotal) + '</span></div>' +
        '<div class="stat-row"><span class="stat-row-label">Stato rientro</span><span class="stat-row-val">' + S.formatNumber(summary.respawnHp) + ' Vita · 0 Scudo</span></div>' +
      '</div>' +
      '<p class="section-subtitle">Sei stato riportato d\'emergenza sulla tua Nave Spaziale.</p>'
    );
    openModal('Missione Fallita — Sei stato abbattuto', body);
  }

  function openEscapeModal(summary) {
    var body = (
      '<p class="section-subtitle" style="margin-bottom:12px; color:var(--weight-green);">Tiro 1d20 riuscito con <strong>' + S.formatNumber(summary.roll) + ' / 20</strong>! Sei riuscito a sganciarti da <strong>' + escapeHtml(summary.missionName) + '</strong>.</p>' +
      '<div class="recap-summary-grid">' +
        '<div class="stat-row"><span class="stat-row-label">EXP persa (-30%)</span><span class="stat-row-val" style="color:var(--warning);">-' + S.formatNumber(summary.expLost) + '</span></div>' +
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

  function render() {
    renderHud();
    renderTabs();
    renderActiveTab();
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

  function handleContentClick(e) {
    var diffBtn = e.target.closest('[data-select-diff]');
    if (diffBtn) {
      var diff = S.toInt(diffBtn.getAttribute('data-select-diff'), 0);
      var selRes = S.selectMission(diff, false);
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

    var navBtn = e.target.closest('[data-nav-tab]');
    if (navBtn) {
      var targetTab = navBtn.getAttribute('data-nav-tab');
      var navRes = S.setActiveTab(targetTab);
      if (!navRes.ok) {
        showToast(navRes.message, 'err');
      }
      return;
    }

    // Step 3: Mission actions
    if (e.target.closest('#btn-cancel-mission')) {
      var cancelRes = S.cancelSelectedMission();
      if (!cancelRes.ok) {
        showToast(cancelRes.message, 'err');
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

    var ammoBtn = e.target.closest('[data-transfer-ammo]');
    if (ammoBtn) {
      var ammoParts = ammoBtn.getAttribute('data-transfer-ammo').split('|');
      var ammoRes = S.transferAmmo(ammoParts[0], ammoParts[1]);
      showToast(ammoRes.message, ammoRes.ok ? 'ok' : 'err');
      return;
    }

    var moveBtn = e.target.closest('[data-move-item]');
    if (moveBtn) {
      var mParts = moveBtn.getAttribute('data-move-item').split('|');
      var mRes = S.transferItem(mParts[1], mParts[0], mParts[2]);
      showToast(mRes.message, mRes.ok ? 'ok' : 'err');
      return;
    }

    var useBtn = e.target.closest('[data-use-item]');
    if (useBtn) {
      var uParts = useBtn.getAttribute('data-use-item').split('|');
      handleUseItemClick(uParts[0], uParts[1]);
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
    }
    if (modalBody) {
      modalBody.addEventListener('click', handleModalBodyClick);
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
