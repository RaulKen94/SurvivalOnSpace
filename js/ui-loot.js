// js/ui-loot.js
(function () {
  'use strict';

  var S = (window.Survival = window.Survival || {});
  var U = (S.ui = S.ui || {});

  function formatAlgebraicWeight(startW, deltaW, maxW) {
    if (deltaW === 0) {
      return '<span class="weight-text">' + S.formatNumber(startW) + ' / ' + S.formatNumber(maxW) + ' pt.</span>';
    }
    var signStr = deltaW > 0 ? '+' + S.formatNumber(deltaW) : '-' + S.formatNumber(Math.abs(deltaW));
    var endW = startW + deltaW;
    return (
      '<span class="weight-text">' +
      S.formatNumber(startW) + ' ' + signStr + ' = ' + S.formatNumber(endW) + ' / ' + S.formatNumber(maxW) + ' pt.' +
      '</span>'
    );
  }

  function renderLootEntryRow(e) {
    var isDrop = e.origin === 'drop';
    var rowClasses = 'loot-item-row' + (isDrop ? ' loot-item-drop' : '');
    var labelIcon = e.icon ? e.icon + ' ' : '';
    var totalW = S.toInt(e.weight, 0) * S.toInt(e.qty, 1);

    var titleHtml = '';
    if (e.kind === 'equip') {
      titleHtml = '<span class="equip-text-' + U.escapeHtml(e.slot) + '"><strong>' + U.escapeHtml(labelIcon + e.name) + '</strong></span> <span class="badge badge-cyan">' + U.escapeHtml(e.uid) + '</span>';
    } else {
      titleHtml = '<strong>' + U.escapeHtml(labelIcon + e.name) + '</strong> <span class="item-qty">×' + S.formatNumber(e.qty) + '</span> · <span class="weight-text">' + S.formatNumber(totalW) + ' pt.</span>';
    }

    var subHtml = '';
    var splitBtn = '';
    var actionAttrs = '';

    if (e.list === 2) {
      if (e.kind === 'equip') {
        subHtml = '<span class="loot-item-dest">→ ' + U.icon('modules', 'equip') + ' Equipaggiamento</span>';
      } else {
        var destLabel = e.dest === 'cargo' ? U.icon('modules', 'cargo') + ' Stiva' : U.icon('modules', 'backpack') + ' Zaino';
        subHtml = '<span class="loot-item-dest">→ ' + destLabel + '</span>';
        actionAttrs = ' data-loot-toggle-dest="' + U.escapeHtml(e.entryId) + '" title="Clicca per cambiare destinazione (Zaino ↔ Stiva) o trascina"';
        if (e.qty > 1) {
          splitBtn = '<button type="button" class="btn btn-ghost btn-sm loot-split-btn" data-loot-split="' + U.escapeHtml(e.entryId) + '" title="Scorpora 1 unità">÷</button>';
        }
      }
    } else if (e.list === 1) {
      if (e.origin === 'backpack' || e.origin === 'cargo') {
        var origLabel = e.origin === 'backpack' ? U.icon('modules', 'backpack') + ' Zaino' : U.icon('modules', 'cargo') + ' Stiva';
        subHtml = '<span class="loot-item-dest">da ' + origLabel + ' (clicca per ripristinare)</span>';
        actionAttrs = ' data-loot-restore="' + U.escapeHtml(e.entryId) + '"';
      } else {
        subHtml = '<span class="loot-item-dest">Trascina in Oggetti raccolti per tenere</span>';
      }
    }

    return (
      '<div class="' + rowClasses + '" draggable="true" data-loot-entry="' + U.escapeHtml(e.entryId) + '"' + actionAttrs + '>' +
        '<div class="loot-item-main">' +
          '<div class="loot-item-title">' + titleHtml + '</div>' +
          (subHtml ? '<div>' + subHtml + '</div>' : '') +
        '</div>' +
        (splitBtn ? '<div class="loot-item-side">' + splitBtn + '</div>' : '') +
      '</div>'
    );
  }

  function renderLootColumn(listNum, draft, stats) {
    var entries = [];
    var i, e;
    for (i = 0; i < draft.entries.length; i += 1) {
      e = draft.entries[i];
      if (e.list === listNum) {
        entries.push(e);
      }
    }

    var title = '';
    var colClass = 'loot-col ';
    var weightHtml = '';
    var subWeightHtml = '';

    if (listNum === 1) {
      title = 'A Terra';
      colClass += 'loot-col-ground';
      weightHtml = '<span class="weight-text">' + S.formatNumber(stats.groundWeight) + ' pt. / ∞</span>';
    } else if (listNum === 2) {
      title = 'Oggetti raccolti';
      colClass += 'loot-col-collected';
      weightHtml = '<span class="weight-text">' + S.formatNumber(stats.l2TotalWeight) + ' pt.</span>';
      subWeightHtml = '<div class="loot-col-sub">' + U.icon('modules', 'backpack') + ' +' + S.formatNumber(stats.l2BpWeight) + ' · ' + U.icon('modules', 'cargo') + ' +' + S.formatNumber(stats.l2CargoWeight) + ' pt.</div>';
    } else if (listNum === 3) {
      title = U.icon('modules', 'backpack') + ' Zaino';
      colClass += 'loot-col-cyan';
      weightHtml = formatAlgebraicWeight(stats.startBpWeight, stats.l3Delta, stats.bpMax);
    } else {
      title = U.icon('modules', 'cargo') + ' Stiva';
      colClass += 'loot-col-cyan';
      weightHtml = formatAlgebraicWeight(stats.startCargoWeight, stats.l4Delta, stats.cargoMax);
    }

    var bodyHtml = '';
    if (entries.length === 0) {
      bodyHtml = '<div class="loot-empty-na">N/A</div>';
    } else {
      bodyHtml = '<div class="loot-items-stack">';
      for (i = 0; i < entries.length; i += 1) {
        bodyHtml += renderLootEntryRow(entries[i]);
      }
      bodyHtml += '</div>';
    }

    return (
      '<div class="' + colClass + '" data-loot-col="' + listNum + '">' +
        '<div class="loot-col-head">' +
          '<div>' +
            '<div class="loot-col-title">' + title + '</div>' +
            subWeightHtml +
          '</div>' +
          '<div class="loot-col-weight">' + weightHtml + '</div>' +
        '</div>' +
        bodyHtml +
      '</div>'
    );
  }

  function renderLootCarouselHtml() {
    var draft = S.state.pendingLoot;
    var stats = S.getPendingLootStats();
    if (!draft || !stats) {
      return '';
    }
    var prefCols = (S.state.preferences && S.state.preferences.lootColumns) || 2;
    var curCols = S.uiState.lootViewCols;
    var cols = (curCols === 2 || curCols === 3 || curCols === 4) ? curCols : 2;
    var isFav = prefCols === cols;
    var listOrder = [1, 2, 3, 4];
    var startIdx = cols === 4 ? 0 : ((S.uiState.lootCarouselStart % 4) + 4) % 4;
    var visibleNums = [];
    var k;
    for (k = 0; k < cols; k += 1) {
      visibleNums.push(listOrder[(startIdx + k) % 4]);
    }

    var gridHtml = '<div class="loot-carousel-grid cols-' + cols + '">';
    for (k = 0; k < visibleNums.length; k += 1) {
      gridHtml += renderLootColumn(visibleNums[k], draft, stats);
    }
    gridHtml += '</div>';

    var navHtml = cols < 4
      ? '<div class="btn-row" style="gap:6px;">' +
          '<button type="button" class="btn btn-ghost btn-sm" data-loot-shift="-1" aria-label="Ruota indietro">◀</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" data-loot-shift="1" aria-label="Ruota avanti">▶</button>' +
        '</div>'
      : '';

    return (
      '<div class="loot-toolbar">' +
        '<div class="btn-row" style="gap:6px;">' +
          '<span class="loot-toolbar-label">Vista:</span>' +
          '<button type="button" class="btn btn-sm ' + (cols === 2 ? 'btn-primary' : 'btn-ghost') + '" data-loot-view="2">2</button>' +
          '<button type="button" class="btn btn-sm ' + (cols === 3 ? 'btn-primary' : 'btn-ghost') + '" data-loot-view="3">3</button>' +
          '<button type="button" class="btn btn-sm ' + (cols === 4 ? 'btn-primary' : 'btn-ghost') + '" data-loot-view="4">4</button>' +
          '<button type="button" class="btn btn-ghost btn-sm loot-star-btn' + (isFav ? ' active' : '') + '" id="btn-loot-fav-star" title="Imposta come vista preferita">' + (isFav ? '⭐' : '☆') + '</button>' +
        '</div>' +
        navHtml +
      '</div>' +
      gridHtml
    );
  }

  function renderReadOnlyDropsHtml(recap) {
    if (!recap.drops || recap.drops.length === 0) {
      return '<p class="section-subtitle">N/A</p>';
    }
    var dropsHtml = '<div class="drop-list">';
    var i, d, eqSlot, itemDef, dIcon;
    for (i = 0; i < recap.drops.length; i += 1) {
      d = recap.drops[i];
      if (d.kind === 'equip') {
        eqSlot = S.EQUIP_SLOTS[d.slot];
        dIcon = eqSlot && eqSlot.icon ? eqSlot.icon + ' ' : '';
        dropsHtml += (
          '<div class="drop-row">' +
            '<div class="drop-row-left"><span class="equip-text-' + U.escapeHtml(d.slot) + '"><strong>' + U.escapeHtml(dIcon + d.name) + '</strong></span> <span class="badge badge-cyan">' + U.escapeHtml(d.uid) + ' · ' + S.formatNumber(d.maxDd) + ' Dd</span></div>' +
            '<div class="drop-row-right"><span class="badge badge-ok">' + U.escapeHtml(d.destination) + '</span></div>' +
          '</div>'
        );
      } else {
        itemDef = S.ITEMS[d.id];
        dIcon = itemDef && itemDef.icon ? itemDef.icon + ' ' : '';
        dropsHtml += (
          '<div class="drop-row">' +
            '<div class="drop-row-left"><strong>' + U.escapeHtml(dIcon + d.name) + ' <span class="item-qty">×' + S.formatNumber(d.qty) + '</span></strong></div>' +
            '<div class="drop-row-right"><span class="weight-text">' + S.formatNumber(d.weight * d.qty) + ' pt.</span><span class="badge badge-cyan">' + U.escapeHtml(d.destination) + '</span></div>' +
          '</div>'
        );
      }
    }
    dropsHtml += '</div>';
    return dropsHtml;
  }

  function renderRecapModalBody(recap) {
    var dropsSectionHtml = S.state.pendingLoot
      ? renderLootCarouselHtml()
      : renderReadOnlyDropsHtml(recap);

    var gs = recap.globalScore || {};
    var gsHtml =
      '<div class="panel" style="margin-bottom:12px;">' +
        '<div class="panel-title"><span>' + U.icon('modules', 'recap') + ' Global Score (' + U.escapeHtml(recap.planetName) + ' — Difficoltà ' + recap.difficulty + ')</span><span class="badge badge-cyan">' + S.formatNumber(gs.streakShown || 0) + ' / ' + S.formatNumber(gs.target || 10) + '</span></div>' +
        (gs.completed && gs.reward
          ? '<p class="feedback-line feedback-ok" style="margin-top:0;">STREAK 10/10 COMPLETATA! Premio ottenuto: +' + S.formatNumber(gs.reward.liquids) + ' ' + U.icon('stats', 'liquids') + ' Liquidi Plusvalenti e +' + S.formatNumber(gs.reward.credits) + ' ' + U.icon('stats', 'credits') + ' Crediti!</p>'
          : '<p class="section-subtitle">Progresso serie attuale: ' + S.formatNumber(gs.streakAfter || 0) + ' / ' + S.formatNumber(gs.target || 10) + '</p>') +
      '</div>';

    return (
      '<p class="section-subtitle" style="margin-bottom:10px;"><strong>' + U.icon('stats', 'planet') + ' ' + U.escapeHtml(recap.planetName) + ' — Difficoltà ' + recap.difficulty + ': ' + U.escapeHtml(recap.missionName) + '</strong></p>' +
      '<div class="recap-summary-grid">' +
        '<div class="stat-row"><span class="stat-row-label">Turni impiegati</span><span class="stat-row-val">' + U.formatRecapValue(recap.turns) + '</span></div>' +
        '<div class="stat-row"><span class="stat-row-label">Alieni uccisi</span><span class="stat-row-val">' + U.formatRecapValue(recap.aliensKilled) + '</span></div>' +
        '<div class="stat-row"><span class="stat-row-label">' + U.icon('stats', 'exp') + ' EXP ottenuta</span><span class="stat-row-val">' + U.formatRecapValue(recap.expGained, '+') + '</span></div>' +
        '<div class="stat-row"><span class="stat-row-label">' + U.icon('stats', 'credits') + ' Crediti missione</span><span class="stat-row-val val-credits">' + U.formatRecapValue(recap.creditsEarned, '+') + '</span></div>' +
        '<div class="stat-row"><span class="stat-row-label">' + U.icon('stats', 'hp') + ' Danni subiti</span><span class="stat-row-val">' + U.formatRecapValue(recap.damageTaken) + '</span></div>' +
        '<div class="stat-row"><span class="stat-row-label">' + U.icon('stats', 'exp') + ' Livelli ottenuti</span><span class="stat-row-val">' + U.formatRecapValue(recap.levelsGained, '+') + '</span></div>' +
      '</div>' +
      gsHtml +
      '<div class="panel-title" style="font-size:0.92rem;"><span>Oggetti droppati</span></div>' +
      dropsSectionHtml
    );
  }

  function getRecapModalSize() {
    if (!S.state.pendingLoot) {
      return '';
    }
    if (S.uiState.lootViewCols === 4) {
      return 'full';
    }
    if (S.uiState.lootViewCols === 3) {
      return 'xl';
    }
    return 'wide';
  }

  function openRecapModal(recap) {
    if (!recap) {
      return;
    }
    if (S.state.pendingLoot) {
      var pref = (S.state.preferences && S.state.preferences.lootColumns) || 2;
      S.uiState.lootViewCols = (pref === 2 || pref === 3 || pref === 4) ? pref : 2;
      S.uiState.lootCarouselStart = S.uiState.lootViewCols === 4 ? 0 : 1;
      S.uiState.draggingLootEntryId = null;
    }
    U.openModal(U.icon('modules', 'recap') + ' Resoconto Missione Completata', renderRecapModalBody(recap), {
      kind: 'mission_recap',
      size: getRecapModalSize()
    });
  }

  function refreshRecapModal() {
    if (S.uiState.activeModalKind !== 'mission_recap' || !S.state.lastMissionRecap) {
      return;
    }
    var root = document.getElementById('modal-root');
    var cardEl = root ? root.querySelector('.modal-card') : null;
    var bodyEl = document.getElementById('modal-body');
    U.applyModalSizeClasses(cardEl, { size: getRecapModalSize() });
    if (bodyEl) {
      bodyEl.innerHTML = renderRecapModalBody(S.state.lastMissionRecap);
    }
  }

  function handleLootModalClick(e) {
    var splitBtn = e.target.closest('[data-loot-split]');
    if (splitBtn) {
      var splitRes = S.splitLootEntry(splitBtn.getAttribute('data-loot-split'));
      if (!splitRes.ok) {
        U.showToast(splitRes.message, 'err');
      }
      return true;
    }

    var toggleDestRow = e.target.closest('[data-loot-toggle-dest]');
    if (toggleDestRow) {
      var tdRes = S.toggleLootDropDestination(toggleDestRow.getAttribute('data-loot-toggle-dest'));
      if (!tdRes.ok) {
        U.showToast(tdRes.message, 'err');
      }
      return true;
    }

    var restoreRow = e.target.closest('[data-loot-restore]');
    if (restoreRow) {
      var restRes = S.restoreGroundEntry(restoreRow.getAttribute('data-loot-restore'));
      if (!restRes.ok) {
        U.showToast(restRes.message, 'err');
      }
      return true;
    }

    var lootViewBtn = e.target.closest('[data-loot-view]');
    if (lootViewBtn) {
      var nextCols = S.toInt(lootViewBtn.getAttribute('data-loot-view'), 2);
      if (nextCols === 2 || nextCols === 3 || nextCols === 4) {
        S.uiState.lootViewCols = nextCols;
        S.uiState.lootCarouselStart = nextCols === 4 ? 0 : 1;
        refreshRecapModal();
      }
      return true;
    }

    if (e.target.closest('#btn-loot-fav-star')) {
      var favRes = S.setLootColumnsPreference(S.uiState.lootViewCols);
      U.showToast(favRes.message, favRes.ok ? 'ok' : 'err');
      return true;
    }

    var shiftBtn = e.target.closest('[data-loot-shift]');
    if (shiftBtn) {
      var dir = S.toInt(shiftBtn.getAttribute('data-loot-shift'), 0);
      S.uiState.lootCarouselStart = (((S.uiState.lootCarouselStart + dir) % 4) + 4) % 4;
      refreshRecapModal();
      return true;
    }

    return false;
  }

  function clearDragHighlights() {
    var cols = document.querySelectorAll('#modal-body [data-loot-col]');
    var i;
    for (i = 0; i < cols.length; i += 1) {
      cols[i].classList.remove('drop-allowed', 'drop-over');
    }
  }

  function handleModalDragStart(e) {
    var row = e.target.closest('[data-loot-entry]');
    if (!row || !S.state.pendingLoot) {
      return;
    }
    S.uiState.draggingLootEntryId = row.getAttribute('data-loot-entry');
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', S.uiState.draggingLootEntryId);
    }
    row.classList.add('dragging');
    var cols = document.querySelectorAll('#modal-body [data-loot-col]');
    var i, colNum;
    for (i = 0; i < cols.length; i += 1) {
      colNum = S.toInt(cols[i].getAttribute('data-loot-col'), 0);
      if (S.canMoveLootEntry(S.uiState.draggingLootEntryId, colNum)) {
        cols[i].classList.add('drop-allowed');
      }
    }
  }

  function handleModalDragOver(e) {
    if (!S.uiState.draggingLootEntryId || !S.state.pendingLoot) {
      return;
    }
    var colEl = e.target.closest('[data-loot-col]');
    if (!colEl) {
      return;
    }
    var targetList = S.toInt(colEl.getAttribute('data-loot-col'), 0);
    if (S.canMoveLootEntry(S.uiState.draggingLootEntryId, targetList)) {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'move';
      }
      colEl.classList.add('drop-over');
    } else if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'none';
    }
  }

  function handleModalDragLeave(e) {
    var colEl = e.target.closest('[data-loot-col]');
    if (colEl && (!e.relatedTarget || !colEl.contains(e.relatedTarget))) {
      colEl.classList.remove('drop-over');
    }
  }

  function handleModalDrop(e) {
    if (!S.uiState.draggingLootEntryId || !S.state.pendingLoot) {
      return;
    }
    var colEl = e.target.closest('[data-loot-col]');
    if (!colEl) {
      clearDragHighlights();
      S.uiState.draggingLootEntryId = null;
      return;
    }
    var targetList = S.toInt(colEl.getAttribute('data-loot-col'), 0);
    var entryId = S.uiState.draggingLootEntryId;
    clearDragHighlights();
    S.uiState.draggingLootEntryId = null;

    if (!S.canMoveLootEntry(entryId, targetList)) {
      return;
    }
    e.preventDefault();
    var res = S.moveLootEntry(entryId, targetList, 1);
    if (!res.ok) {
      U.showToast(res.message, 'err');
    }
  }

  function handleModalDragEnd() {
    clearDragHighlights();
    S.uiState.draggingLootEntryId = null;
  }

  U.openRecapModal = openRecapModal;
  U.refreshRecapModal = refreshRecapModal;
  U.handleLootModalClick = handleLootModalClick;
  U.handleModalDragStart = handleModalDragStart;
  U.handleModalDragOver = handleModalDragOver;
  U.handleModalDragLeave = handleModalDragLeave;
  U.handleModalDrop = handleModalDrop;
  U.handleModalDragEnd = handleModalDragEnd;
})();
