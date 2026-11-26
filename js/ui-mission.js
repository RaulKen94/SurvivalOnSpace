// js/ui-mission.js
(function () {
  'use strict';

  var S = (window.Survival = window.Survival || {});
  var U = (S.ui = S.ui || {});

  function renderMapTab(container) {
    var planet = S.getPlanet();
    var selected = S.state.mission.selectedDifficulty;
    var listHtml = '';

    listHtml += (
      '<button type="button" class="mission-option' + (selected === 0 ? ' selected' : '') + '" data-select-diff="0">' +
        '<div class="mission-option-top">' +
          '<span class="mission-option-name">' + U.icon('tabs', 'ship') + ' Nave Spaziale (Posizione Attuale)</span>' +
        '</div>' +
        '<div class="mission-option-meta"><span>Base orbitale su ' + U.escapeHtml(planet.name) + ' · Nessun combattimento</span></div>' +
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
            '<span class="mission-option-name">' + U.icon('tabs', 'mission') + ' Difficoltà ' + d + ' — ' + U.escapeHtml(m.name) + '</span>' +
            (lockInfo.unlocked
              ? ''
              : '<span class="badge badge-danger">' + U.escapeHtml(lockInfo.reason) + '</span>') +
          '</div>' +
          '<div class="mission-option-meta">' +
            '<span>Alieni: <strong>' + U.formatAliensRange(m) + '</strong></span>' +
            '<span>Premio base: <strong class="val-credits">' + U.icon('stats', 'credits') + ' ' + S.formatNumber(m.creditsReward) + ' Crediti</strong></span>' +
            U.renderFeatureBadges(m.features) +
          '</div>' +
        '</button>'
      );
    }

    var gs = S.state.globalScore;
    var gsTarget = S.GLOBAL_SCORE_TARGET;
    var gsPct = U.percentInt(gs.streak, gsTarget);

    var locsHtml = '';
    var i, loc;
    for (i = 0; i < planet.locations.length; i += 1) {
      loc = planet.locations[i];
      locsHtml += (
        '<div class="module-card">' +
          '<div>' +
            '<div class="module-card-head">' +
              '<h3 class="module-card-title">' + (loc.icon ? loc.icon + ' ' : '') + U.escapeHtml(loc.name) + '</h3>' +
              '<span class="badge badge-step">Step 5</span>' +
            '</div>' +
            '<p class="module-card-desc" style="margin-top:6px;">' + U.escapeHtml(loc.description) + '</p>' +
          '</div>' +
          '<div class="btn-row">' +
            '<button type="button" class="btn btn-ghost btn-sm" disabled>' + U.icon('equip', 'boots') + ' Visita (Dd Stivali)</button>' +
          '</div>' +
        '</div>'
      );
    }

    container.innerHTML = (
      '<div class="section-header">' +
        '<div>' +
          '<h1 class="section-title">' + U.icon('tabs', 'map') + ' Mappa Planetaria — ' + U.icon('stats', 'planet') + ' ' + U.escapeHtml(planet.name) + '</h1>' +
          '<p class="section-subtitle">' + U.escapeHtml(planet.subtitle) + ' · ' + U.escapeHtml(planet.description) + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="panel-title"><span>' + U.icon('tabs', 'mission') + ' Missioni Disponibili</span></div>' +
        '<div class="mission-list">' + listHtml + '</div>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="panel-title">' +
          '<span>' + U.icon('modules', 'recap') + ' Global Score</span>' +
          '<span class="badge badge-cyan">' + S.formatNumber(gs.streak) + ' / ' + S.formatNumber(gsTarget) + '</span>' +
        '</div>' +
        '<div class="progress-track" style="height:10px; margin-bottom:8px;">' +
          '<div class="progress-fill fill-exp" style="width:' + gsPct + '%"></div>' +
        '</div>' +
        '<p class="section-subtitle">Attivo: <strong>' + U.escapeHtml(U.formatGlobalScoreActive(gs.activeKey)) + '</strong></p>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="panel-title"><span>' + U.icon('equip', 'boots') + ' Esplorazione Pianeta (Fuori Missione)</span></div>' +
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
              '<span class="inv-item-title-line"><strong>' + U.escapeHtml(itemIcon + def.name) + '</strong> <span class="item-qty">×' + S.formatNumber(qty) + '</span> · <span class="weight-text">' + S.formatNumber(lineW) + ' pt.</span></span>' +
              '<span class="inv-item-sub">' + U.escapeHtml(def.description) + '</span>' +
            '</div>' +
            '<div class="inv-item-actions">' +
              (canUse
                ? '<button type="button" class="btn btn-sm" data-use-item="backpack|' + U.escapeHtml(id) + '">Usa</button>'
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
      var aliensLeftPct = U.percentInt(ms.aliensLeft, ms.aliensTotal);
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
          '<p class="section-subtitle notice-danger" style="margin-bottom:10px;"><strong>' + U.icon('stats', 'ammo') + ' Munizioni esaurite!</strong> Usa un Caricatore Standard nello Zaino oppure tenta la fuga d\'emergenza (tiro 1d20, serve almeno 18; in caso di successo perdi il 30% dell\'EXP attuale, altrimenti subisci il contrattacco).</p>' +
          '<button type="button" class="btn btn-danger btn-combat-big" id="btn-escape-mission">FUGGI (Tira 1d20 — serve ≥ 18)</button>'
        );
      }

      container.innerHTML = (
        '<div class="combat-banner">' +
          '<div class="section-header" style="padding-bottom:6px;">' +
            '<div>' +
              '<h1 class="section-title">' + U.icon('tabs', 'mission') + ' ' + U.escapeHtml(planet.name) + ' · Difficoltà ' + ms.selectedDifficulty + ' — ' + U.escapeHtml(mCfg ? mCfg.name : '') + '</h1>' +
              '<p class="section-subtitle">Mission = TRUE · Tutte le altre schede sono bloccate fino al termine della missione.</p>' +
            '</div>' +
            U.renderFeatureBadges(mCfg ? mCfg.features : []) +
          '</div>' +
          '<div class="combat-counters">' +
            '<div class="combat-stat-box"><span class="combat-stat-label">Turni</span><span class="combat-stat-value">' + S.formatNumber(ms.turn) + '</span></div>' +
            '<div class="combat-stat-box"><span class="combat-stat-label">Alieni Rimanenti</span><span class="combat-stat-value aliens-val">' + S.formatNumber(ms.aliensLeft) + ' / ' + S.formatNumber(ms.aliensTotal) + '</span></div>' +
            '<div class="combat-stat-box"><span class="combat-stat-label">' + U.icon('stats', 'ammo') + ' Munizioni Zaino</span><span class="combat-stat-value">' + S.formatNumber(ammoLeft) + '</span></div>' +
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
            '<div class="panel-title"><span>' + U.icon('tabs', 'mission') + ' Azioni di Combattimento</span><span class="badge badge-cyan">Turni: ' + S.formatNumber(ms.turn) + '</span></div>' +
            actionHtml +
          '</div>' +
          '<div class="panel">' +
            '<div class="panel-title">' +
              '<span>' + U.icon('modules', 'backpack') + ' Zaino</span>' +
              '<span class="weight-text">' + S.formatNumber(bpUsed) + ' / ' + S.formatNumber(bpMax) + ' pt.</span>' +
            '</div>' +
            renderMissionBackpackItems() +
          '</div>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-title"><span>' + U.icon('stats', 'shield') + ' Equipaggiamento</span></div>' +
          '<div class="grid-4">' +
            U.renderEquipSlotCard('helmet', false) +
            U.renderEquipSlotCard('suit', false) +
            U.renderEquipSlotCard('boots', false) +
            U.renderEquipSlotCard('rifle', false) +
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
          '<h1 class="section-title">' + U.icon('tabs', 'mission') + ' Nessuna Missione Selezionata</h1>' +
          '<p class="section-subtitle">Sei attualmente attraccato sulla Nave Spaziale. Scegli una difficoltà disponibile dal tab <strong>' + U.icon('tabs', 'map') + ' Mappa</strong> per aprire il briefing operativo.</p>' +
          '<button type="button" class="btn btn-primary" data-nav-tab="map">' + U.icon('tabs', 'map') + ' Apri Mappa</button>' +
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
          '<h1 class="section-title">' + U.icon('tabs', 'mission') + ' Briefing Missione — ' + U.icon('stats', 'planet') + ' ' + U.escapeHtml(planet.name) + ' (Difficoltà ' + diff + ')</h1>' +
          '<p class="section-subtitle">' + U.escapeHtml(m.name) + ' · ' + U.escapeHtml(m.description) + '</p>' +
        '</div>' +
        U.renderFeatureBadges(m.features) +
      '</div>' +
      '<div class="grid-2">' +
        '<div class="panel panel-highlight">' +
          '<div class="panel-title"><span>Parametri Operativi</span><span class="badge badge-ok">Pronto al Lancio</span></div>' +
          '<div class="inv-item-list" style="margin-top:0;">' +
            '<div class="inv-item-row"><span>Alieni da abbattere</span><strong class="mono">' + U.formatAliensRange(m) + '</strong></div>' +
            '<div class="inv-item-row"><span>Danno base nemico</span><strong class="mono">' + S.formatNumber(m.enemyDamage) + ' / turno</strong></div>' +
            '<div class="inv-item-row"><span>' + U.icon('stats', 'credits') + ' Ricompensa base</span><strong class="mono val-credits">' + S.formatNumber(m.creditsReward) + ' Crediti</strong></div>' +
            '<button type="button" class="inv-item-row inv-item-row-clickable" id="btn-open-prep-backpack"><span>' + U.icon('modules', 'backpack') + ' Zaino</span><span class="weight-text">' + S.formatNumber(bpTotal) + ' / ' + S.formatNumber(bpCap) + ' pt.</span></button>' +
            '<div class="inv-item-row"><span>' + U.icon('stats', 'ammo') + ' Munizioni pronte</span><strong class="mono val-ammo">' + S.formatNumber(S.state.backpack.ammo) + '</strong></div>' +
          '</div>' +
          '<div class="briefing-actions">' +
            '<div class="briefing-cancel-col">' +
              '<button type="button" class="btn btn-ghost" id="btn-cancel-mission-ship">Annulla → ' + U.icon('tabs', 'ship') + ' Nave Spaziale</button>' +
              '<button type="button" class="btn btn-ghost" id="btn-cancel-mission-map">Annulla → ' + U.icon('tabs', 'map') + ' Mappa</button>' +
            '</div>' +
            '<div class="briefing-start-col">' +
              '<button type="button" class="btn btn-primary" id="btn-start-mission">' + U.icon('tabs', 'mission') + ' Inizia Missione</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-title"><span>Probabilità Drop Missione</span></div>' +
          U.renderDropPreviewList(m) +
        '</div>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="panel-title"><span>' + U.icon('stats', 'shield') + ' Equipaggiamento per la missione</span></div>' +
        '<div class="grid-4">' +
          U.renderEquipSlotCard('helmet', false) +
          U.renderEquipSlotCard('suit', false) +
          U.renderEquipSlotCard('boots', false) +
          U.renderEquipSlotCard('rifle', false) +
        '</div>' +
      '</div>'
    );
  }

  function openDefeatModal(summary) {
    var body = (
      '<p class="section-subtitle notice-danger" style="margin-bottom:12px;">La tua Vita è scesa a zero durante <strong>' + U.escapeHtml(summary.missionName) + '</strong> su ' + U.escapeHtml(summary.planetName) + '.</p>' +
      '<div class="recap-summary-grid">' +
        '<div class="stat-row"><span class="stat-row-label">EXP persa (-75%)</span><span class="stat-row-val stat-val-danger">-' + S.formatNumber(summary.expLost) + '</span></div>' +
        '<div class="stat-row"><span class="stat-row-label">Crediti persi (-50%)</span><span class="stat-row-val stat-val-danger">-' + S.formatNumber(summary.creditsLost) + '</span></div>' +
        '<div class="stat-row"><span class="stat-row-label">Alieni abbattuti</span><span class="stat-row-val">' + S.formatNumber(summary.aliensKilled) + ' / ' + S.formatNumber(summary.aliensTotal) + '</span></div>' +
        '<div class="stat-row"><span class="stat-row-label">Stato rientro</span><span class="stat-row-val">' + S.formatNumber(summary.respawnHp) + ' Vita · 0 Scudo</span></div>' +
      '</div>' +
      '<p class="section-subtitle">Sei stato riportato d\'emergenza sulla tua Nave Spaziale.</p>'
    );
    U.openModal('Missione Fallita — Sei stato abbattuto', body);
  }

  function openEscapeModal(summary) {
    var body = (
      '<p class="section-subtitle notice-ok" style="margin-bottom:12px;">Tiro 1d20 riuscito con <strong>' + S.formatNumber(summary.roll) + ' / 20</strong>! Sei riuscito a sganciarti da <strong>' + U.escapeHtml(summary.missionName) + '</strong>.</p>' +
      '<div class="recap-summary-grid">' +
        '<div class="stat-row"><span class="stat-row-label">EXP persa (-30%)</span><span class="stat-row-val stat-val-warn">-' + S.formatNumber(summary.expLost) + '</span></div>' +
        '<div class="stat-row"><span class="stat-row-label">Turno di fuga</span><span class="stat-row-val">' + S.formatNumber(summary.turn) + '</span></div>' +
      '</div>' +
      '<p class="section-subtitle">Sei rientrato sulla tua Nave Spaziale su ' + U.escapeHtml(summary.planetName) + '.</p>'
    );
    U.openModal('Fuga Riuscita', body);
  }

  function handleMapMissionClick(e) {
    var diffBtn = e.target.closest('[data-select-diff]');
    if (diffBtn) {
      var diff = S.toInt(diffBtn.getAttribute('data-select-diff'), 0);
      var selRes = S.selectMission(diff, diff > 0);
      if (!selRes.ok) {
        U.showToast(selRes.message, 'err');
      }
      return true;
    }

    if (e.target.closest('#btn-open-prep-backpack')) {
      S.uiState.transferPicker = null;
      U.openModal('Preparazione ' + U.icon('modules', 'backpack') + ' Zaino', U.renderBackpackCargoSection(), {
        wide: true,
        kind: 'backpack_cargo'
      });
      return true;
    }

    if (e.target.closest('#btn-cancel-mission-ship')) {
      var cancelShipRes = S.cancelSelectedMission('ship');
      if (!cancelShipRes.ok) {
        U.showToast(cancelShipRes.message, 'err');
      }
      return true;
    }

    if (e.target.closest('#btn-cancel-mission-map')) {
      var cancelMapRes = S.cancelSelectedMission('map');
      if (!cancelMapRes.ok) {
        U.showToast(cancelMapRes.message, 'err');
      }
      return true;
    }

    if (e.target.closest('#btn-start-mission')) {
      var startRes = S.startSelectedMission();
      if (!startRes.ok) {
        U.showToast(startRes.message, 'err');
      }
      return true;
    }

    if (e.target.closest('#btn-shoot-alien')) {
      var shootRes = S.shootAlien();
      if (!shootRes.ok) {
        U.showToast(shootRes.message, 'err');
      } else if (shootRes.outcome === 'death') {
        openDefeatModal(shootRes.summary);
      } else if (shootRes.leveledUp) {
        U.showToast('LEVEL UP! Raggiunto il Livello ' + shootRes.newLevel + '!', 'ok');
      }
      return true;
    }

    if (e.target.closest('#btn-escape-mission')) {
      var escRes = S.attemptEscape();
      if (!escRes.ok) {
        U.showToast(escRes.message, 'err');
      } else if (escRes.outcome === 'escaped') {
        openEscapeModal(escRes.summary);
      } else if (escRes.outcome === 'death') {
        openDefeatModal(escRes.summary);
      } else if (escRes.outcome === 'escape_failed') {
        U.showToast('Fuga fallita (1d20: ' + escRes.roll + ')! Subiti ' + escRes.damage + ' danni.', 'err');
      }
      return true;
    }

    if (e.target.closest('#btn-complete-mission')) {
      var compRes = S.completeMission();
      if (!compRes.ok) {
        U.showToast(compRes.message, 'err');
      } else {
        U.openRecapModal(compRes.recap);
      }
      return true;
    }

    return false;
  }

  U.renderMapTab = renderMapTab;
  U.renderMissionBackpackItems = renderMissionBackpackItems;
  U.renderLastShotBox = renderLastShotBox;
  U.renderMissionTab = renderMissionTab;
  U.openDefeatModal = openDefeatModal;
  U.openEscapeModal = openEscapeModal;
  U.handleMapMissionClick = handleMapMissionClick;
})();
