// js/ui-options.js
(function () {
  'use strict';

  var S = (window.Survival = window.Survival || {});
  var U = (S.ui = S.ui || {});

  function renderOptionsTab(container) {
    var saveCode = S.exportSaveCode();
    var tokenCount = S.getRenameTokenCount();
    var canRename = S.hasRenameToken();
    var stats = S.state.stats;
    var prefCols = (S.state.preferences && S.state.preferences.lootColumns) || 2;
    var impFb = S.uiState.importFeedback;
    var renFb = S.uiState.renameFeedback;

    container.innerHTML = (
      '<div class="section-header">' +
        '<div>' +
          '<h1 class="section-title">' + U.icon('tabs', 'options') + ' Opzioni, Salvataggio Locale &amp; Statistiche</h1>' +
          '<p class="section-subtitle">Nessun salvataggio automatico online: copia manualmente il tuo codice alfanumerico per salvare i progressi.</p>' +
        '</div>' +
        '<span class="badge badge-cyan">Formato ' + U.escapeHtml(S.SAVE_PREFIX) + ' Retrocompatibile</span>' +
      '</div>' +
      '<div class="grid-2">' +
        '<div class="panel panel-highlight">' +
          '<div class="panel-title"><span>' + U.icon('modules', 'save') + ' Esporta Codice di Salvataggio</span><span class="badge badge-ok">Manuale</span></div>' +
          '<p class="section-subtitle" style="margin-bottom:8px;">Copia e conserva questo codice alfanumerico al sicuro. Resterà compatibile anche con tutti i futuri aggiornamenti del gioco.</p>' +
          '<textarea id="export-code-box" class="code-box" readonly aria-label="Codice di salvataggio">' + U.escapeHtml(saveCode) + '</textarea>' +
          '<div class="btn-row" style="margin-top:10px;">' +
            '<button type="button" class="btn btn-primary" id="btn-copy-save">' + U.icon('modules', 'save') + ' Copia Codice</button>' +
          '</div>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-title"><span>' + U.icon('modules', 'save') + ' Carica Codice di Salvataggio</span></div>' +
          '<p class="section-subtitle" style="margin-bottom:8px;">Incolla un codice salvataggio precedentemente esportato per ripristinare i tuoi progressi.</p>' +
          '<textarea id="import-code-input" class="code-box" placeholder="Incolla qui il codice (es. SOS1...)"></textarea>' +
          '<div class="btn-row" style="margin-top:10px;">' +
            '<button type="button" class="btn" id="btn-load-save">' + U.icon('modules', 'save') + ' Carica Salvataggio</button>' +
          '</div>' +
          (impFb.text
            ? '<div class="feedback-line ' + (impFb.ok ? 'feedback-ok' : 'feedback-err') + '">' + U.escapeHtml(impFb.text) + '</div>'
            : '') +
        '</div>' +
      '</div>' +
      '<div class="grid-2">' +
        '<div class="panel">' +
          '<div class="panel-title">' +
            '<span>' + U.icon('items', 'chip_identita') + ' Cambio Nome Personaggio</span>' +
            '<span>Chip Cambio Identità <span class="item-qty">×' + S.formatNumber(tokenCount) + '</span> · <span class="weight-text">0 pt.</span></span>' +
          '</div>' +
          '<p class="section-subtitle" style="margin-bottom:10px;">Richiede un oggetto consumabile <strong>' + U.icon('items', 'chip_identita') + ' Chip Cambio Identità</strong> (presente ×1 nella Stiva iniziale). Senza chip il cambio nome resta bloccato.</p>' +
          '<div class="btn-row">' +
            '<input type="text" id="rename-input" class="input-field" maxlength="20" placeholder="Nuovo nome (2-20 caratteri)" style="flex:1; min-width:180px;"' + (!canRename ? ' disabled' : '') + '>' +
            '<button type="button" class="btn btn-primary" id="btn-rename-player"' + (!canRename ? ' disabled' : '') + '>Cambia Nome</button>' +
          '</div>' +
          (renFb.text
            ? '<div class="feedback-line ' + (renFb.ok ? 'feedback-ok' : 'feedback-err') + '">' + U.escapeHtml(renFb.text) + '</div>'
            : '') +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-title"><span>' + U.icon('modules', 'recap') + ' Statistiche di Gioco &amp; Roadmap</span><span class="badge badge-ok">Alpha 1 (Step 3)</span></div>' +
          '<p class="section-subtitle" style="margin-bottom:10px;">Alieni uccisi: <strong class="mono">' + S.formatNumber(stats.aliensKilled) + '</strong> · Colpi sparati: <strong class="mono">' + S.formatNumber(stats.shotsFired) + '</strong> · Morti: <strong class="mono">' + S.formatNumber(stats.deaths) + '</strong></p>' +
          '<div class="btn-row">' +
            '<button type="button" class="btn" id="btn-open-stats">' + U.icon('modules', 'recap') + ' Consulta Statistiche Complete</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="panel-title"><span>' + U.icon('modules', 'controls') + ' Controlli</span></div>' +
        '<div class="controls-row">' +
          '<span class="section-subtitle" style="margin:0;">Liste visibili nel resoconto missione</span>' +
          '<div class="btn-row" style="gap:8px;">' +
            '<button type="button" class="btn btn-sm ' + (prefCols === 2 ? 'btn-primary' : 'btn-ghost') + '" data-set-loot-cols="2">2 Liste</button>' +
            '<button type="button" class="btn btn-sm ' + (prefCols === 3 ? 'btn-primary' : 'btn-ghost') + '" data-set-loot-cols="3">3 Liste</button>' +
            '<button type="button" class="btn btn-sm ' + (prefCols === 4 ? 'btn-primary' : 'btn-ghost') + '" data-set-loot-cols="4">4 Liste</button>' +
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
      { label: U.icon('modules', 'regen') + ' Camera di Rigenerazione usata', val: S.formatNumber(st.regenUsed) },
      { label: U.icon('modules', 'supply') + ' Capsule Rifornimenti aperte', val: S.formatNumber(st.suppliesClaimed) },
      { label: U.icon('stats', 'credits') + ' Crediti totali guadagnati', val: S.formatNumber(st.creditsEarned) },
      { label: U.icon('stats', 'liquids') + ' Liquidi Plusvalenti guadagnati', val: S.formatNumber(st.liquidsEarned) }
    ];
    var html = '<div class="stats-grid">';
    var i;
    for (i = 0; i < rows.length; i += 1) {
      html += (
        '<div class="stat-row">' +
          '<span class="stat-row-label">' + U.escapeHtml(rows[i].label) + '</span>' +
          '<span class="stat-row-val">' + U.escapeHtml(rows[i].val) + '</span>' +
        '</div>'
      );
    }
    html += '</div>';
    return html;
  }

  function fallbackCopy(box) {
    if (!box) {
      return;
    }
    box.focus();
    box.select();
    try {
      document.execCommand('copy');
      U.showToast('Codice di salvataggio copiato negli appunti.', 'ok');
    } catch (err) {
      U.showToast('Seleziona manualmente il codice dal riquadro e copialo.', 'err');
    }
  }

  function handleCopySave() {
    var box = document.getElementById('export-code-box');
    var code = box ? box.value : S.exportSaveCode();
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(code).then(
        function () {
          U.showToast('Codice di salvataggio copiato negli appunti.', 'ok');
        },
        function () {
          fallbackCopy(box);
        }
      );
    } else {
      fallbackCopy(box);
    }
  }

  function handleOptionsClick(e) {
    if (e.target.closest('#btn-copy-save')) {
      handleCopySave();
      return true;
    }

    if (e.target.closest('#btn-load-save')) {
      var inputEl = document.getElementById('import-code-input');
      var code = inputEl ? inputEl.value : '';
      var loadRes = S.importSaveCode(code);
      if (loadRes.ok) {
        S.uiState.importFeedback = { text: '', ok: true };
        S.uiState.renameFeedback = { text: '', ok: true };
        U.showToast(loadRes.message, 'ok');
      } else {
        S.uiState.importFeedback = { text: loadRes.message, ok: false };
        U.showToast(loadRes.message, 'err');
        U.renderActiveTab();
        var newInput = document.getElementById('import-code-input');
        if (newInput) {
          newInput.value = code;
        }
      }
      return true;
    }

    if (e.target.closest('#btn-rename-player')) {
      var nameInput = document.getElementById('rename-input');
      var proposed = nameInput ? nameInput.value : '';
      var renRes = S.renamePlayer(proposed);
      if (renRes.ok) {
        S.uiState.renameFeedback = { text: renRes.message, ok: true };
        U.showToast(renRes.message, 'ok');
        U.renderActiveTab();
      } else {
        S.uiState.renameFeedback = { text: renRes.message, ok: false };
        U.showToast(renRes.message, 'err');
        U.renderActiveTab();
        var newNameEl = document.getElementById('rename-input');
        if (newNameEl) {
          newNameEl.value = proposed;
        }
      }
      return true;
    }

    if (e.target.closest('#btn-open-stats')) {
      U.openModal('Statistiche di Gioco', renderStatsModalHtml());
      return true;
    }

    var lootPrefBtn = e.target.closest('[data-set-loot-cols]');
    if (lootPrefBtn) {
      var colsPref = S.toInt(lootPrefBtn.getAttribute('data-set-loot-cols'), 2);
      var prefRes = S.setLootColumnsPreference(colsPref);
      U.showToast(prefRes.message, prefRes.ok ? 'ok' : 'err');
      return true;
    }

    return false;
  }

  U.renderOptionsTab = renderOptionsTab;
  U.renderStatsModalHtml = renderStatsModalHtml;
  U.handleOptionsClick = handleOptionsClick;
})();
