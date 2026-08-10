// js/equipment.js
(function() {
  window.Survival = window.Survival || {};
  const S = window.Survival;
  const state = S.state;
  const ITEMS = S.ITEMS_METADATA;

  // ============================================
  // LAYOUT MODE
  // ============================================
  S.toggleLayoutMode = function() {
    if (state.inMission) return;
    S.layoutModeActive = !S.layoutModeActive;
    const btn = document.getElementById('btn-toggle-layout');
    const panel = document.getElementById('layout-panel');
    
    if (S.layoutModeActive) {
      if (S.transferModeActive) S.toggleTransferMode();
      btn.innerText = 'Chiudi Layout';
      btn.className = 'bg-rose-900/60 hover:bg-rose-800 text-rose-300 border border-rose-500/30 font-bold px-2 py-1 rounded text-[9px] uppercase tracking-wider transition active:scale-95';
      panel.classList.remove('hidden');
      S.renderPocketsUI();
    } else {
      btn.innerText = 'Configura Layout';
      btn.className = 'bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 border border-emerald-500/30 font-bold px-2 py-1 rounded text-[9px] uppercase tracking-wider transition active:scale-95';
      panel.classList.add('hidden');
    }
    S.renderShedInventories();
  };

  // ============================================
  // POCKETS UI
  // ============================================
  S.renderPocketsUI = function() {
    const container = document.getElementById('pockets-container');
    container.innerHTML = '';
    
    ['p1', 'p2'].forEach(function(pKey) {
      const pocket = state.pockets[pKey];
      let optionsHtml = '<option value="">-- Nessun oggetto assegnato --</option>';
      
      Object.keys(state.inventory).forEach(function(itemKey) {
        if (state.inventory[itemKey] > 0 && ITEMS[itemKey].subType === pocket.targetType) {
          const assignedElsewhere = ['p1', 'p2'].some(function(k) {
            return k !== pKey && state.pockets[k].item === itemKey;
          });
          if (!assignedElsewhere) {
            const sel = pocket.item === itemKey ? 'selected' : '';
            optionsHtml += '<option value="' + itemKey + '" ' + sel + '>' + ITEMS[itemKey].name + '</option>';
          }
        }
      });

      const assignedIcon = pocket.item && ITEMS[pocket.item] ? '<span class="text-base">' + ITEMS[pocket.item].icon + '</span>' : '';

      container.innerHTML += 
        '<div class="bg-slate-950 p-2 rounded-xl border border-slate-800 space-y-1.5" data-pocket="' + pKey + '">' +
        '<div class="flex justify-between items-center"><div class="flex items-center gap-1.5">' +
        '<span class="text-[10px] font-bold text-slate-200">' + pocket.id + ' - ' + pocket.name + '</span>' +
        '<button class="w-4 h-4 rounded-full bg-slate-800 text-[8px] font-bold text-slate-300 flex items-center justify-center">?</button>' +
        '</div><span class="text-[8px] font-mono text-emerald-400 font-bold">Grado ' + pocket.grade + '</span></div>' +
        '<div class="flex items-center gap-2">' + assignedIcon +
        '<select class="w-full bg-slate-900 border border-slate-700 text-slate-300 text-[9px] rounded-lg p-1.5 focus:outline-none">' + optionsHtml + '</select>' +
        '</div></div>';
    });
  };

  S.assignPocketItem = function(pKey, itemKey) {
    state.pockets[pKey].item = itemKey || null;
    if (itemKey) state.stats.pocketsAssigned++;
    S.renderPocketsUI();
  };

  S.openPocketInfo = function(pKey) {
    const pocket = state.pockets[pKey];
    document.getElementById('pocket-info-title').innerHTML = pocket.name;
    document.getElementById('pocket-info-grade').innerHTML = pocket.grade;
    document.getElementById('pocket-info-slots').innerHTML = pocket.slots;
    document.getElementById('pocket-info-desc').innerHTML = pocket.effectDesc;
    document.getElementById('pocket-info-modal').classList.remove('hidden');
  };

  S.closePocketInfo = function() {
    document.getElementById('pocket-info-modal').classList.add('hidden');
  };

  // ============================================
  // SOFT LAYOUT MODAL
  // ============================================
  S.openSoftLayoutModal = function() {
    const c = document.getElementById('soft-layout-content');
    c.innerHTML = '';
    
    ['p1', 'p2'].forEach(function(pKey) {
      const p = state.pockets[pKey];
      const i = p.item;
      let itemText = i ? '<span class="text-amber-400 font-bold">' + ITEMS[i].icon + ' ' + ITEMS[i].name + '</span>' : 
                         '<span class="text-slate-500 italic">Nessuno</span>';
      c.innerHTML += 
        '<div class="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[10px]">' +
        '<div class="flex justify-between font-bold text-slate-200 border-b border-slate-800 pb-1 mb-1">' +
        '<span>' + p.name + '</span><span class="text-indigo-400">Grado ' + p.grade + '</span></div>' +
        '<div class="flex flex-col gap-0.5"><span>Equipaggiato: ' + itemText + '</span>' +
        '<span class="text-emerald-400 font-mono">' + p.effectDesc + '</span></div></div>';
    });
    
    document.getElementById('soft-layout-modal').classList.remove('hidden');
  };

  S.closeSoftLayoutModal = function() {
    document.getElementById('soft-layout-modal').classList.add('hidden');
  };

  // ============================================
  // GET POCKET BONUS
  // ============================================
  S.getPocketBonusValue = function(itemKey) {
    if (state.pockets.p1.item === itemKey) return 1;
    if (state.pockets.p2.item === itemKey) return 2;
    return 0;
  };
})();
