// js/synthesis.js
(function() {
  window.Survival = window.Survival || {};
  const S = window.Survival;
  const state = S.state;

  // ============================================
  // RENDER SINTESI
  // ============================================
  S.renderSynthesis = function() {
    const container = document.getElementById('nave-synthesis-container');
    if (!container) return;
    
    const grid = state.synthesis.grid;
    const keych = state.synthesis.keychain;
    const selGrid = state.synthesis.selectedGrid;
    const selKeych = state.synthesis.selectedKeychain;
    
    // Griglia 3x3
    let gridHtml = '<div class="grid grid-cols-3 gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">';
    for (var i = 0; i < 9; i++) {
      const item = grid[i];
      const isSel = selGrid.indexOf(i) !== -1;
      let content = '';
      if (item) {
        const icon = item.type === 'key' ? '🗝️' : '🎁';
        content = '<div class="flex flex-col items-center"><span class="text-xl">' + icon + '</span><span class="text-[8px] font-mono font-bold text-amber-400">L' + item.level + '</span></div>';
      }
      gridHtml += '<button data-grid-idx="' + i + '" class="h-16 rounded-lg border ' + 
        (isSel ? 'border-amber-400 bg-amber-950/40 shadow-md shadow-amber-950' : 'border-slate-800 bg-slate-900') + 
        ' flex items-center justify-center transition active:scale-95">' + content + '</button>';
    }
    gridHtml += '</div>';

    // Portachiavi
    let keychHtml = '<div class="bg-slate-950 p-2 rounded-xl border border-indigo-900/40 space-y-1.5">' +
      '<div class="flex justify-between items-center text-[9px] font-mono text-indigo-300 font-bold">' +
      '<span>🔐 Portachiavi Sicuro (' + state.synthesis.keychainSlots + '/3)</span>' +
      '<span class="text-amber-400">Frammenti: ' + state.frammenti + ' 🧩</span>' +
      '</div><div class="grid grid-cols-3 gap-2">';
    
    for (var k = 0; k < 3; k++) {
      const isUnlocked = k < state.synthesis.keychainSlots;
      const item = keych[k];
      const isSel = selKeych.indexOf(k) !== -1;
      
      if (!isUnlocked) {
        const unlockCost = k === 0 ? 30 : (k === 1 ? 100 : 2000);
        keychHtml += '<button data-keychain-idx="' + k + '" class="h-12 rounded-lg border border-dashed border-indigo-900/60 bg-slate-950 flex flex-col items-center justify-center text-[8px] font-mono text-indigo-400 hover:bg-indigo-950/30 transition">' +
          '<span>🔒 Sblocca</span><span class="text-amber-400 font-bold">' + unlockCost + ' 🧩</span></button>';
      } else {
        let content = '<span class="text-slate-600 text-[9px] font-mono">Vuoto</span>';
        if (item) {
          content = '<div class="flex flex-col items-center"><span class="text-lg">🗝️</span><span class="text-[8px] font-mono font-bold text-amber-400">L' + item.level + '</span></div>';
        }
        keychHtml += '<button data-keychain-idx="' + k + '" class="h-12 rounded-lg border ' + 
          (isSel ? 'border-amber-400 bg-amber-950/40' : 'border-indigo-800/60 bg-slate-900') + 
          ' flex items-center justify-center transition active:scale-95">' + content + '</button>';
      }
    }
    keychHtml += '</div></div>';

    // Pulsanti azione
    let canCreate = state.compostoOrganico >= 100 && grid.some(function(x) { return x === null; });
    let actionBtnText = 'Fondi / Apri';
    let canAction = false;
    let actionType = '';

    if (selGrid.length === 3 && selKeych.length === 0) {
      const items = selGrid.map(function(i) { return grid[i]; });
      if (items.every(function(it) { return it && it.type === items[0].type && it.level === items[0].level && items[0].level < 3; })) {
        canAction = true;
        actionType = 'merge';
        actionBtnText = '⚡ Fondevi 3x ' + (items[0].type === 'key' ? 'Chiavi' : 'Scrigni') + ' (L' + items[0].level + ' ➡️ L' + (items[0].level + 1) + ')';
      }
    } else if (selGrid.length === 2 && selKeych.length === 0) {
      const items = selGrid.map(function(i) { return grid[i]; });
      if (items[0] && items[1] && items[0].level === items[1].level && 
          ((items[0].type === 'key' && items[1].type === 'chest') || 
           (items[0].type === 'chest' && items[1].type === 'key'))) {
        canAction = true;
        actionType = 'open';
        const fragReward = items[0].level === 0 ? 1 : (items[0].level === 1 ? 4 : (items[0].level === 2 ? 20 : 100));
        actionBtnText = '🔓 Apri Scrigno L' + items[0].level + ' (+' + fragReward + ' 🧩)';
      }
    }

    // Spostamento
    let moveBtnHtml = '';
    if (selGrid.length === 1 && selKeych.length === 1) {
      const gIdx = selGrid[0];
      const kIdx = selKeych[0];
      if (grid[gIdx] && grid[gIdx].type === 'key' && keych[kIdx] === null) {
        moveBtnHtml = '<button id="btn-key-to-keychain" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl text-xs uppercase shadow transition">Sposta in Portachiavi ⬇️</button>';
      } else if (grid[gIdx] === null && keych[kIdx] !== null) {
        moveBtnHtml = '<button id="btn-key-to-grid" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl text-xs uppercase shadow transition">Sposta in Griglia ⬆️</button>';
      }
    }

    container.innerHTML = 
      '<div class="flex justify-between items-center text-[10px] font-mono text-slate-300">' +
      '<span>Composto Organico: <strong class="text-emerald-400">' + state.compostoOrganico + ' 🧫</strong></span>' +
      '<span>Frammenti: <strong class="text-amber-400">' + state.frammenti + ' 🧩</strong></span>' +
      '</div>' +
      gridHtml +
      keychHtml +
      '<div class="grid grid-cols-2 gap-2 pt-1">' +
      '<button id="btn-create-synthesis" ' + (canCreate ? '' : 'disabled') + ' class="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold py-2.5 px-2 rounded-xl text-xs uppercase shadow active:scale-95 transition">Crea (100 🧫)</button>' +
      '<button id="btn-action-synthesis" ' + (canAction ? '' : 'disabled') + ' data-action="' + actionType + '" class="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-2.5 px-2 rounded-xl text-[10px] uppercase shadow active:scale-95 transition">' + actionBtnText + '</button>' +
      '</div>' +
      moveBtnHtml;
  };

  // ============================================
  // FUNZIONI SINTESI
  // ============================================
  S.toggleSynthesisGridSlot = function(idx) {
    const s = state.synthesis.selectedGrid;
    const pos = s.indexOf(idx);
    if (pos !== -1) s.splice(pos, 1);
    else if (s.length < 3) s.push(idx);
    S.renderSynthesis();
  };

  S.toggleSynthesisKeychainSlot = function(idx) {
    const s = state.synthesis.selectedKeychain;
    const pos = s.indexOf(idx);
    if (pos !== -1) s.splice(pos, 1);
    else if (s.length < 1) s.push(idx);
    S.renderSynthesis();
  };

  S.createSynthesisItem = function() {
    if (state.compostoOrganico < 100) return;
    const emptyIdx = state.synthesis.grid.indexOf(null);
    if (emptyIdx === -1) return;
    
    state.compostoOrganico -= 100;
    const type = Math.random() < 0.75 ? 'key' : 'chest';
    state.synthesis.grid[emptyIdx] = { id: S.generateUUID(), type: type, level: 0 };
    if (type === 'key') state.stats.keysCreated++;
    else state.stats.chestsCreated++;
    S.renderAll();
  };

  S.executeSynthesisAction = function(actionType) {
    const sGrid = state.synthesis.selectedGrid;
    
    if (actionType === 'merge') {
      const lvl = state.synthesis.grid[sGrid[0]].level;
      const type = state.synthesis.grid[sGrid[0]].type;
      sGrid.forEach(function(idx) { state.synthesis.grid[idx] = null; });
      state.synthesis.grid[sGrid[0]] = { id: S.generateUUID(), type: type, level: lvl + 1 };
      state.stats.fusionsMade++;
      S.showToast('✨ Fusione completata!', 'success');
    } else if (actionType === 'open') {
      const lvl = state.synthesis.grid[sGrid[0]].level;
      const fragReward = lvl === 0 ? 1 : (lvl === 1 ? 4 : (lvl === 2 ? 20 : 100));
      sGrid.forEach(function(idx) { state.synthesis.grid[idx] = null; });
      state.frammenti += fragReward;
      state.stats.fragmentsObtained += fragReward;
      S.showToast('🔓 Scrigno aperto! +' + fragReward + ' 🧩', 'success');
    }
    
    state.synthesis.selectedGrid = [];
    state.synthesis.selectedKeychain = [];
    S.renderAll();
  };

  S.unlockKeychainSlot = function(slotIdx, cost) {
    if (state.frammenti < cost) {
      S.showToast('Frammenti 🧩 insufficienti!', 'error');
      return;
    }
    state.frammenti -= cost;
    state.synthesis.keychainSlots = slotIdx + 1;
    S.showToast('🔐 Slot Portachiavi sbloccato!', 'success');
    S.renderAll();
  };

  S.executeKeyMove = function(dir) {
    const gIdx = state.synthesis.selectedGrid[0];
    const kIdx = state.synthesis.selectedKeychain[0];
    
    if (dir === 'to_keychain') {
      state.synthesis.keychain[kIdx] = state.synthesis.grid[gIdx];
      state.synthesis.grid[gIdx] = null;
    } else {
      state.synthesis.grid[gIdx] = state.synthesis.keychain[kIdx];
      state.synthesis.keychain[kIdx] = null;
    }
    
    state.synthesis.selectedGrid = [];
    state.synthesis.selectedKeychain = [];
    S.renderAll();
  };
})();
