// js/ui.js
(function() {
  window.Survival = window.Survival || {};
  const S = window.Survival;
  const state = S.state;
  const LEVEL = S.LEVEL_THRESHOLDS;
  const ZONES = S.ZONE_DATA;
  const ITEMS = S.ITEMS_METADATA;
  
  // ===========================
  // RENDER PRINCIPALE
  // ===========================
  S.renderAll = function() {
    S.renderHUD();
    S.renderMappa();
    S.renderMissione();
    S.renderCasa();
    S.updateStatusesUI();
  };

  // ===========================
  // HUD
  // ===========================
  S.renderHUD = function() {
    const stats = LEVEL[state.level - 1];
    const prevStats = state.level > 1 ? LEVEL[state.level - 2] : { nextExp: 0 };
    
    document.getElementById('hud-level').innerText = state.level;
    document.getElementById('hud-exp').innerText = state.exp;
    document.getElementById('hud-next-exp').innerText = stats.nextExp;
    document.getElementById('hud-credits').innerText = state.credits;
    document.getElementById('hud-liquido').innerText = state.liquidoPlusvalente;
    document.getElementById('hud-bullets').innerText = state.bullets || 0;
    document.getElementById('hud-hp').innerText = state.hp + '/' + stats.maxHp;
    document.getElementById('hud-shield').innerText = state.shield + '/' + stats.maxShield;
    
    const hpPercent = Math.max(0, Math.min(100, (state.hp / stats.maxHp) * 100));
    const shieldPercent = Math.max(0, Math.min(100, (state.shield / stats.maxShield) * 100));
    
    let expProgressPercent = 0;
    if (state.level >= 10) {
      expProgressPercent = 100;
    } else {
      const segmentExp = state.exp - prevStats.nextExp;
      const segmentTotal = stats.nextExp - prevStats.nextExp;
      expProgressPercent = Math.max(0, Math.min(100, (segmentExp / segmentTotal) * 100));
    }
    
    document.getElementById('hud-hp-bar').style.width = hpPercent + '%';
    document.getElementById('hud-shield-bar').style.width = shieldPercent + '%';
    document.getElementById('hud-exp-bar').style.width = expProgressPercent + '%';
    
    const missionBadge = document.getElementById('nav-badge-mission');
    if (state.inMission) missionBadge.classList.remove('hidden');
    else missionBadge.classList.add('hidden');
  };

  // ===========================
  // MAPPA
  // ===========================
  S.renderMappa = function() {
    const zones = ['0', 'A1', 'A2', 'A3'];
    zones.forEach(function(z) {
      const card = document.getElementById('zone-card-' + z);
      const check = document.getElementById('zone-check-' + z);
      if (z !== '0') {
        document.getElementById('map-aliens-' + z).innerText = state.aliens[z];
      }
      if (state.selectedZone === z) {
        card.className = 'w-full text-left bg-indigo-950/40 border-2 border-indigo-500 rounded-xl p-3 transition-all flex items-center justify-between active:scale-[0.99] touch-manipulation';
        if (check) check.classList.remove('hidden');
      } else {
        card.className = 'w-full text-left bg-slate-900 border border-slate-800 rounded-xl p-3 transition-all flex items-center justify-between active:scale-[0.99] touch-manipulation';
        if (check) check.classList.add('hidden');
      }
      if (state.inMission || state.city.currentLocation !== 'piazza') {
        card.style.opacity = '0.5';
        card.style.pointerEvents = 'none';
      } else {
        card.style.opacity = '1';
        card.style.pointerEvents = 'auto';
      }
    });
    
    const warning = document.getElementById('map-mission-lock-warning');
    if (state.inMission || state.city.currentLocation !== 'piazza') warning.classList.remove('hidden');
    else warning.classList.add('hidden');

    const container = document.getElementById('global-score-tracker');
    if (!state.consecutiveStreak.zone) {
      container.innerHTML = '<div class="text-slate-500 italic text-[10px] text-center w-full">Nessuna progressione attiva.</div>';
    } else {
      let dotsHtml = '';
      for (var i = 1; i <= 10; i++) {
        if (i <= state.consecutiveStreak.count) {
          dotsHtml += '<span class="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block border border-emerald-400"></span>';
        } else {
          dotsHtml += '<span class="w-2.5 h-2.5 rounded-full bg-slate-850 inline-block border border-slate-850"></span>';
        }
      }
      container.innerHTML = '<div class="flex flex-col gap-1 w-full"><div class="flex justify-between items-center text-[10px] font-bold text-slate-300"><span>Settore Focus: <strong class="text-indigo-400">' + state.consecutiveStreak.zone + '</strong></span><span>' + state.consecutiveStreak.count + ' / 10</span></div><div class="flex justify-between items-center gap-1.5 bg-slate-950 p-2 rounded-lg border border-slate-850 mt-1">' + dotsHtml + '</div></div>';
    }
  };

  // ===========================
  // MISSIONE
  // ===========================
  S.renderMissione = function() {
    const inactiveScreen = document.getElementById('mission-inactive-screen');
    const activeScreen = document.getElementById('mission-active-screen');
    const completionScreen = document.getElementById('mission-completion-screen');
    const repeatContainer = document.getElementById('repeat-mission-container');
    const btnRepeat = document.getElementById('btn-repeat-last');

    if (!state.inMission && state.lastMissionStats && state.lastMissionStats.zone !== '0') {
      const lastZ = state.lastMissionStats.zone;
      if (state.aliens[lastZ] !== 0 && state.aliens[lastZ] !== '0') {
        repeatContainer.classList.remove('hidden');
        btnRepeat.innerText = '🔄 Ripeti Ultima Missione (' + lastZ + ')';
      } else {
        repeatContainer.classList.add('hidden');
      }
    } else {
      repeatContainer.classList.add('hidden');
    }
    
    const btnLootInfo = document.getElementById('btn-loot-info');
    if (state.selectedZone === '0' || state.selectedZone === 0) btnLootInfo.classList.add('hidden');
    else btnLootInfo.classList.remove('hidden');

    if (!state.inMission) {
      completionScreen.classList.add('hidden');
      if (state.selectedZone !== '0') {
        inactiveScreen.classList.remove('hidden');
        activeScreen.classList.add('hidden');
        document.getElementById('mission-zone-ready-card').classList.remove('hidden');
        document.getElementById('ready-zone-name').innerText = ZONES[state.selectedZone].name;
        const alienCount = state.aliens[state.selectedZone];
        document.getElementById('ready-zone-aliens').innerText = alienCount;
        document.getElementById('ready-zone-reward').innerText = ZONES[state.selectedZone].reward + ' Crediti';
        const btnSbarco = document.getElementById('btn-sbarco');
        const blockWarning = document.getElementById('mission-block-warning');
        if (alienCount === 0 || alienCount === '0') {
          btnSbarco.classList.add('hidden');
          blockWarning.classList.remove('hidden');
        } else {
          btnSbarco.classList.remove('hidden');
          blockWarning.classList.add('hidden');
        }
      } else {
        inactiveScreen.classList.remove('hidden');
        activeScreen.classList.add('hidden');
        document.getElementById('mission-zone-ready-card').classList.add('hidden');
      }
    } else {
      inactiveScreen.classList.add('hidden');
      if (state.activeMission.recapTriggered) {
        activeScreen.classList.add('hidden');
        completionScreen.classList.remove('hidden');
        document.getElementById('recap-aliens').innerText = state.activeMission.aliensKilled;
        document.getElementById('recap-exp').innerText = '+' + state.activeMission.expGained;
        document.getElementById('recap-credits').innerText = '+' + ZONES[state.activeMission.zone].reward + ' 🪙';

        const expContainer = document.getElementById('recap-exploration-container');
        const expDropsDiv = document.getElementById('recap-explore-drops');
        expDropsDiv.innerHTML = '';
        const expLoot = state.activeMission.explorationLoot;
        let expDropsFound = false;
        Object.keys(expLoot).forEach(function(k) {
          if (expLoot[k] > 0) {
            expDropsFound = true;
            let name = k;
            if (ITEMS[k]) name = ITEMS[k].icon + ' ' + ITEMS[k].name;
            else if (k === 'composto') name = '🧫 Composto Organico';
            else if (k === 'credits') name = '🪙 Crediti';
            expDropsDiv.innerHTML += '<div>• ' + name + ' x' + expLoot[k] + '</div>';
          }
        });
        if (expDropsFound) expContainer.classList.remove('hidden');
        else expContainer.classList.add('hidden');

        const recapDropsDiv = document.getElementById('recap-drops');
        recapDropsDiv.innerHTML = '';
        const endDrops = state.activeMission.endMissionDrops;
        let endDropsFound = false;
        Object.keys(endDrops).forEach(function(k) {
          if (endDrops[k] > 0) {
            endDropsFound = true;
            let name = k;
            if (ITEMS[k]) name = ITEMS[k].icon + ' ' + ITEMS[k].name;
            else if (k === 'book1') name = '📖 "I Segreti degli Snack - Cap. I"';
            else if (k === 'book2') name = '📖 "I Segreti dei Riparatori - Cap. I"';
            else if (k === 'book3') name = '📖 "I Segreti del Fucile - Cap. I"';
            recapDropsDiv.innerHTML += '<div>• ' + name + ' x' + endDrops[k] + '</div>';
          }
        });
        if (!endDropsFound) {
          recapDropsDiv.innerHTML = '<div class="text-slate-500 italic">Nessun bottino extra ottenuto da questo scontro.</div>';
        }
      } else {
        activeScreen.classList.remove('hidden');
        completionScreen.classList.add('hidden');
        document.getElementById('active-mission-zone-title').innerText = ZONES[state.activeMission.zone].name.toUpperCase();
        document.getElementById('active-aliens-count').innerText = state.activeMission.aliensRemaining + '/' + state.activeMission.initialAliens;
        document.getElementById('active-aliens-bar').style.width = ((state.activeMission.aliensRemaining / state.activeMission.initialAliens) * 100) + '%';

        const wId = state.activeMission.weatherId;
        document.getElementById('weather-icon').innerText = wId === 'limpido' ? '☀️' : (wId === 'acido' ? '🌧️' : '🌌');
        document.getElementById('weather-name').innerText = wId === 'limpido' ? 'Limpido' : (wId === 'acido' ? 'Acida' : 'Grav. Storm');
        if (wId === 'acido') {
          document.getElementById('weather-name').className = 'text-[8px] font-bold text-emerald-400 uppercase';
        } else if (wId === 'gravitazionale') {
          document.getElementById('weather-name').className = 'text-[8px] font-bold text-purple-400 uppercase';
        } else {
          document.getElementById('weather-name').className = 'text-[8px] font-bold text-slate-300 uppercase';
        }

        S.updateStatusesUI();

        const btnFire = document.getElementById('btn-fire');
        const btnEsplora = document.getElementById('btn-esplora');
        const btnCerca = document.getElementById('btn-cerca');
        const btnComplete = document.getElementById('btn-complete-mission');
        document.getElementById('combat-explore-status').innerText = state.activeMission.lastExploreStatus;
        document.getElementById('esplora-charges').innerText = (2 - state.activeMission.explorationsCount) + '/2';
        document.getElementById('cerca-charges').innerText = state.activeMission.searchCharges + ' Batt.';
        document.getElementById('combat-explore-result').innerText = state.activeMission.lastExploreResult;

        if (state.activeMission.aliensRemaining === 0) {
          btnFire.classList.add('hidden');
          btnEsplora.classList.add('hidden');
          btnCerca.classList.add('hidden');
          btnComplete.classList.remove('hidden');
        } else {
          btnComplete.classList.add('hidden');
          if (state.activeMission.exploreState === 'searching') {
            btnFire.classList.add('hidden');
            btnEsplora.classList.add('hidden');
            btnCerca.classList.remove('hidden');
          } else {
            btnFire.classList.remove('hidden');
            btnCerca.classList.add('hidden');
            btnEsplora.classList.remove('hidden');
            btnEsplora.disabled = state.activeMission.explorationsCount >= 2;
          }
        }

        const missionInvContainer = document.getElementById('mission-inventory-container');
        missionInvContainer.innerHTML = '<div class="bg-slate-900 border border-slate-850 rounded-xl p-3 space-y-2"><div class="flex justify-between items-center border-b border-slate-800 pb-1"><span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">🎒 Zaino</span><div class="text-[9px] font-mono text-slate-400 flex flex-col items-end gap-0.5"><span>Oggetti: <strong class="text-emerald-400">' + S.getBackpackWeight() + ' / 200 pt.</strong></span><span>Munizioni ' + (state.bullets || 0) + '/300 - ' + S.getBackpackAmmoWeight() + '/30 pt.</span></div></div><div id="mission-zaino-items-list" class="space-y-1.5 pt-1"></div></div>';
        S.renderInventoryList('mission-zaino-items-list', state.backpackOrder, state.inventory, 'backpack', true);
        S.renderCombatEquipmentUI();
      }
    }
  };

  S.renderCombatEquipmentUI = function() {
    const bar = document.getElementById('combat-equipment-bar');
    if (!bar) return;
    const h = state.equipment.helmet;
    const s = state.equipment.suit;
    const b = state.equipment.boots;
    const w = state.equipment.weapon;
    bar.innerHTML = '<div class="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 flex gap-3 text-[10px] font-mono font-bold text-slate-300"><span>' + h.val + '/' + h.max + ' ' + h.icon + '</span><span>|</span><span>' + s.val + '/' + s.max + ' ' + s.icon + '</span><span>|</span><span>' + b.val + '/' + b.max + ' ' + b.icon + '</span><span>|</span><span>' + w.val + '/' + w.max + ' ' + w.icon + '</span></div>';
  };

  // ===========================
  // CASA
  // ===========================
  S.renderCasa = function() {
    S.renderShedInventories();
    S.renderSynthesis();
    S.renderLibrary();
    S.renderResearch();
    S.renderEquipment();
  };

  S.renderShedInventories = function() {
    const zainoContainer = document.getElementById('casa-inventory-container');
    const stivaContainer = document.getElementById('nave-stiva-container');
    const totalZainoWeight = S.getBackpackWeight();
    const ammoZainoWeight = S.getBackpackAmmoWeight();
    const totalStivaWeight = S.getStivaWeight();
    const stivaMaxCap = S.getStivaMaxCapacity();
    
    zainoContainer.innerHTML = '<div class="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2"><div class="flex justify-between items-center border-b border-slate-850 pb-1.5"><h4 class="font-bold text-slate-200 text-sm flex items-center gap-1.5"><span>🎒</span> Zaino</h4><div class="text-[9px] font-mono text-emerald-400 flex flex-col items-end gap-0.5"><span class="font-bold">Oggetti: ' + totalZainoWeight + ' / 200 pt.</span><span class="text-slate-400">Munizioni ' + (state.bullets || 0) + '/300 - ' + ammoZainoWeight + '/30 pt.</span></div></div><div id="zaino-items-list" class="space-y-2 pt-1"></div></div>';
    
    stivaContainer.innerHTML = '<div class="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2"><div class="flex justify-between items-center border-b border-slate-850 pb-1.5"><h4 class="font-bold text-slate-200 text-sm flex items-center gap-1.5"><span>📦</span> Stiva</h4><div class="text-[9px] font-mono text-emerald-400 flex flex-col items-end gap-0.5"><span class="font-bold">Oggetti: ' + totalStivaWeight + ' / ' + stivaMaxCap + ' pt.</span><span class="text-slate-400">Munizioni ' + (state.stiva.bullets || 0) + '/∞ - ' + Math.ceil((state.stiva.bullets || 0) / 10) + '/∞ pt.</span></div></div><div id="stiva-items-list" class="space-y-2 pt-1"></div></div>';
    
    S.renderInventoryList('zaino-items-list', state.backpackOrder, state.inventory, 'backpack', !state.inMission);
    S.renderInventoryList('stiva-items-list', state.stivaOrder, state.stiva, 'stiva', S.transferModeActive);
    
    if (S.transferModeActive) S.updateTransferPanelUI();
    
    const btnLayout = document.getElementById('btn-toggle-layout');
    const btnTrans = document.getElementById('btn-toggle-transfer');
    if (state.inMission) {
      btnLayout.classList.add('hidden');
      btnTrans.classList.add('hidden');
    } else {
      btnLayout.classList.remove('hidden');
      btnTrans.classList.remove('hidden');
    }
  };

  S.renderInventoryList = function(divId, orderArray, sourceObj, sourceName, allowInteraction) {
    const container = document.getElementById(divId);
    container.innerHTML = '';
    let itemsCount = 0;
    const _this = S;
    
    orderArray.forEach(function(key) {
      const qty = sourceObj[key] || 0;
      if (qty <= 0) return;
      itemsCount++;
      const meta = ITEMS[key];
      const totWeight = qty * meta.weight;
      const isTransSelected = (S.transferModeActive && S.activeTransferItem === key && S.activeTransferSource === sourceName);
      const cardBg = isTransSelected ? 'bg-indigo-950/40 border-indigo-500/80' : 'bg-slate-950/60 border-slate-900/60 hover:bg-slate-950/80';
      
      let pocketBadge = '';
      if (sourceName === 'backpack') {
        if (state.pockets.p1.item === key) pocketBadge = '<span class="bg-emerald-900 text-emerald-300 text-[7px] px-1 rounded ml-1 border border-emerald-500/50">P1</span>';
        if (state.pockets.p2.item === key) pocketBadge = '<span class="bg-emerald-900 text-emerald-300 text-[7px] px-1 rounded ml-1 border border-emerald-500/50">P2</span>';
      }

      container.innerHTML += '<div id="inv-card-' + sourceName + '-' + key + '" class="border rounded-xl p-2.5 transition flex items-center justify-between select-none ' + cardBg + (allowInteraction ? ' cursor-pointer active:scale-[0.99]' : '') + '" onclick="' + (allowInteraction ? 'Survival.handleItemClick(\'' + key + '\', \'' + sourceName + '\')' : '') + '" onmousedown="Survival.startLongPress(\'' + key + '\')" onmouseup="Survival.endLongPress()" onmouseleave="Survival.endLongPress()" ontouchstart="Survival.startLongPress(\'' + key + '\')" ontouchend="Survival.endLongPress()"><div class="flex items-center gap-3 pr-2 min-w-0"><span class="text-xl shrink-0">' + meta.icon + '</span><div class="text-left min-w-0"><div class="flex items-center gap-1.5 flex-wrap"><h4 class="font-bold text-slate-200 text-xs truncate">' + meta.name + ' ' + pocketBadge + '</h4><span class="bg-emerald-950/30 text-emerald-400 text-[8px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/10 shrink-0">' + totWeight + ' pt.</span></div></div></div><div class="text-right shrink-0"><span class="text-xs font-black text-amber-400 font-mono">x' + qty + '</span></div></div>';
    });
    
    if (itemsCount === 0) {
      container.innerHTML = '<div class="text-center py-4 text-slate-500 italic text-[10px]">Nessun materiale immagazzinato.</div>';
    }
  };

  // ===========================
  // STATUSES UI
  // ===========================
  S.updateStatusesUI = function() {
    const cont = document.getElementById('active-statuses-container');
    if (!cont) return;
    cont.innerHTML = '';
    const sorted = state.statuses.slice().sort(function(a, b) { return a.order - b.order; });
    sorted.forEach(function(s) {
      const meta = S.STATUSES_METADATA[s.id];
      cont.innerHTML += '<div class="bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-0.5 flex items-center gap-1 shadow-md status-icon-enter"><span class="text-sm">' + meta.icon + '</span><span class="text-[8px] font-mono font-bold text-slate-300">' + s.remaining + 'T</span></div>';
    });
  };

  // ===========================
  // MODALI
  // ===========================
  S.openSoftLayoutModal = function() {
    const c = document.getElementById('soft-layout-content');
    c.innerHTML = '';
    ['p1', 'p2'].forEach(function(pKey) {
      const p = state.pockets[pKey];
      const i = p.item;
      let itemText = i ? '<span class="text-amber-400 font-bold">' + ITEMS[i].icon + ' ' + ITEMS[i].name + '</span>' : '<span class="text-slate-500 italic">Nessuno</span>';
      c.innerHTML += '<div class="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[10px]"><div class="flex justify-between font-bold text-slate-200 border-b border-slate-800 pb-1 mb-1"><span>' + p.name + '</span><span class="text-indigo-400">Grado ' + p.grade + '</span></div><div class="flex flex-col gap-0.5"><span>Equipaggiato: ' + itemText + '</span><span class="text-emerald-400 font-mono">' + p.effectDesc + '</span></div></div>';
    });
    document.getElementById('soft-layout-modal').classList.remove('hidden');
  };

  S.closeSoftLayoutModal = function() {
    document.getElementById('soft-layout-modal').classList.add('hidden');
  };

  S.openLootInfo = function() {
    const zoneId = state.selectedZone;
    const content = document.getElementById('loot-info-content');
    state.stats.missionInfoViews++;
    
    if (zoneId === '0') {
      content.innerHTML = '<div class="text-center py-2 text-slate-500 italic">Nave Spaziale in Orbita Terrestre.<br>Seleziona un settore d\'attacco sulla mappa per visualizzare i rapporti.</div>';
    } else {
      var html = '';
      if (zoneId === 'A1') {
        html = '<div class="border-b border-slate-800 pb-1.5 mb-2 flex justify-between items-end"><h4 class="text-xs font-bold text-indigo-300">ZONA A1</h4><span class="text-[9px] text-amber-500">Premio: 100 🪙</span></div><div class="flex flex-col gap-1 text-[9px] font-bold text-slate-300"><div class="bg-slate-800/50 p-1.5 rounded border border-slate-700/50">[ 🍪 Snack 70g · <span class="text-emerald-400">25%</span> · <span class="text-cyan-300">x1</span> ]</div><div class="bg-slate-800/50 p-1.5 rounded border border-slate-700/50">[ 🔋 Caricatore - L1 K1 · <span class="text-emerald-400">50%</span> · <span class="text-cyan-300">x1</span> ]</div><div class="bg-slate-800/50 p-1.5 rounded border border-slate-700/50">[ 🥼 Riparatore Tuta Spaziale Classe C · <span class="text-emerald-400">20%</span> · <span class="text-cyan-300">x1</span> ]</div><div class="bg-slate-800/50 p-1.5 rounded border border-slate-700/50">[ 📦 Scatola di caricatori · <span class="text-emerald-400">3%</span> · <span class="text-cyan-300">x1</span> ]</div><div class="bg-slate-800/50 p-1.5 rounded border border-slate-700/50">[ 🔮 Liquido Plusvalente · <span class="text-indigo-400">1%</span> · <span class="text-cyan-300">x2</span> ]</div><div class="bg-slate-800/50 p-1.5 rounded border border-slate-700/50">[ 📖 Libro "I Segreti degli Snack - Cap. I" · <span class="text-amber-400">5%</span> · <span class="text-cyan-300">x1</span> ]</div></div>';
      } else if (zoneId === 'A2') {
        html = '<div class="border-b border-slate-800 pb-1.5 mb-2 flex justify-between items-end"><h4 class="text-xs font-bold text-indigo-300">ZONA A2</h4><span class="text-[9px] text-amber-500">Premio: 250 🪙</span></div><div class="flex flex-col gap-1 text-[9px] font-bold text-slate-300"><div class="bg-slate-800/50 p-1.5 rounded border border-slate-700/50">[ 🍪 Snack 70g · <span class="text-emerald-400">44%</span> · <span class="text-cyan-300">x1</span> ]</div><div class="bg-slate-800/50 p-1.5 rounded border border-slate-700/50">[ 🧪 Fluido Energizzante · <span class="text-emerald-400">18%</span> · <span class="text-cyan-300">x1</span> ]</div><div class="bg-slate-800/50 p-1.5 rounded border border-slate-700/50">[ 🔋 Caricatore - L1 K1 · <span class="text-emerald-400">65%</span> · <span class="text-cyan-300">x1</span> ]</div><div class="bg-slate-800/50 p-1.5 rounded border border-slate-700/50">[ 📦 Scatola di caricatori · <span class="text-emerald-400">5%</span> · <span class="text-cyan-300">x1</span> ]</div><div class="bg-slate-800/50 p-1.5 rounded border border-slate-700/50">[ 🥼 Riparatore Tuta Spaziale Classe C · <span class="text-emerald-400">33%</span> · <span class="text-cyan-300">x2</span> ]</div><div class="bg-slate-800/50 p-1.5 rounded border border-slate-700/50">[ 🪖 Riparatore Casco Spaziale Classe C · <span class="text-emerald-400">33%</span> · <span class="text-cyan-300">x2</span> ]</div><div class="bg-slate-800/50 p-1.5 rounded border border-slate-700/50">[ 🥾 Riparatore Stivali Spaziali Classe C · <span class="text-emerald-400">8%</span> · <span class="text-cyan-300">x2</span> ]</div><div class="bg-slate-800/50 p-1.5 rounded border border-slate-700/50">[ ⚡ Batteria classe C · <span class="text-emerald-400">5%</span> · <span class="text-cyan-300">x1</span> ]</div><div class="bg-slate-800/50 p-1.5 rounded border border-slate-700/50">[ 🔮 Liquido Plusvalente · <span class="text-indigo-400">1%</span> · <span class="text-cyan-300">x5</span> ]</div><div class="bg-slate-800/50 p-1.5 rounded border border-slate-700/50">[ 📖 Libro "I Segreti dei Riparatori - Cap. I" · <span class="text-amber-400">5%</span> · <span class="text-cyan-300">x1</span> ]</div></div>';
      } else {
        html = '<div class="border-b border-slate-800 pb-1.5 mb-2 flex justify-between items-end"><h4 class="text-xs font-bold text-indigo-300">ZONA A3</h4><span class="text-[9px] text-amber-500">Premio: 500 🪙</span></div><div class="flex flex-col gap-1 text-[9px] font-bold text-slate-300"><div class="bg-slate-800/50 p-1.5 rounded border border-slate-700/50">[ 🍪 Snack 70g · <span class="text-emerald-400">35%</span> · <span class="text-cyan-300">x2</span> ]</div><div class="bg-slate-800/50 p-1.5 rounded border border-slate-700/50">[ 🧪 Fluido Energizzante · <span class="text-emerald-400">30%</span> · <span class="text-cyan-300">x1</span> ]</div><div class="bg-slate-800/50 p-1.5 rounded border border-slate-700/50">[ 🔋 Caricatore - L1 K1 · <span class="text-emerald-400">75%</span> · <span class="text-cyan-300">x2</span> ]</div><div class="bg-slate-800/50 p-1.5 rounded border border-slate-700/50">[ 📦 Scatola di caricatori · <span class="text-emerald-400">10%</span> · <span class="text-cyan-300">x1</span> ]</div><div class="bg-slate-800/50 p-1.5 rounded border border-slate-700/50">[ 🥼 Riparatore Tuta Spaziale Classe C · <span class="text-emerald-400">45%</span> · <span class="text-cyan-300">x2</span> ]</div><div class="bg-slate-800/50 p-1.5 rounded border border-slate-700/50">[ 🪖 Riparatore Casco Spaziale Classe C · <span class="text-emerald-400">45%</span> · <span class="text-cyan-300">x2</span> ]</div><div class="bg-slate-800/50 p-1.5 rounded border border-slate-700/50">[ 🥾 Riparatore Stivali Spaziali Classe C · <span class="text-emerald-400">20%</span> · <span class="text-cyan-300">x2</span> ]</div><div class="bg-slate-800/50 p-1.5 rounded border border-slate-700/50">[ 🔫 Riparatore Fucile Spaziale Classe C · <span class="text-emerald-400">15%</span> · <span class="text-cyan-300">x1</span> ]</div><div class="bg-slate-800/50 p-1.5 rounded border border-slate-700/50">[ ⚡ Batteria classe C · <span class="text-emerald-400">5%</span> · <span class="text-cyan-300">x1</span> ]</div><div class="bg-slate-800/50 p-1.5 rounded border border-slate-700/50">[ 🔮 Liquido Plusvalente · <span class="text-indigo-400">2%</span> · <span class="text-cyan-300">x5</span> ]</div><div class="bg-slate-800/50 p-1.5 rounded border border-slate-700/50">[ 📖 Libro "I Segreti del Fucile - Cap. I" · <span class="text-amber-400">5%</span> · <span class="text-cyan-300">x1</span> ]</div></div>';
      }
      content.innerHTML = html;
    }
    document.getElementById('loot-info-modal').classList.remove('hidden');
  };

  S.closeLootInfo = function() {
    document.getElementById('loot-info-modal').classList.add('hidden');
  };

  S.closeMeteoDocModal = function() {
    document.getElementById('meteo-doc-modal').classList.add('hidden');
  };

  // ===========================
  // EQUIPAGGIAMENTO UI
  // ===========================
  S.renderEquipment = function() {
    const c = document.getElementById('nave-equipment-container');
    if (!c) return;
    const e = state.equipment;
    c.innerHTML = '<div class="grid grid-cols-2 gap-2 text-[10px] font-mono"><div class="bg-slate-950 p-2 rounded-lg border border-slate-800 flex justify-between items-center"><span>🟡 Casco:</span><strong class="text-amber-400">' + e.helmet.val + '/' + e.helmet.max + ' Dd</strong></div><div class="bg-slate-950 p-2 rounded-lg border border-slate-800 flex justify-between items-center"><span>🔵 Tuta:</span><strong class="text-cyan-400">' + e.suit.val + '/' + e.suit.max + ' Dd</strong></div><div class="bg-slate-950 p-2 rounded-lg border border-slate-800 flex justify-between items-center"><span>🟣 Stivali:</span><strong class="text-purple-400">' + e.boots.val + '/' + e.boots.max + ' Dd</strong></div><div class="bg-slate-950 p-2 rounded-lg border border-slate-800 flex justify-between items-center"><span>⚫ Fucile:</span><strong class="text-slate-300">' + e.weapon.val + '/' + e.weapon.max + ' Dd</strong></div></div>';
  };

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

      container.innerHTML += '<div class="bg-slate-950 p-2 rounded-xl border border-slate-800 space-y-1.5"><div class="flex justify-between items-center"><div class="flex items-center gap-1.5"><span class="text-[10px] font-bold text-slate-200">' + pocket.id + ' - ' + pocket.name + '</span><button onclick="Survival.openPocketInfo(\'' + pKey + '\')" class="w-4 h-4 rounded-full bg-slate-800 text-[8px] font-bold text-slate-300 flex items-center justify-center">?</button></div><span class="text-[8px] font-mono text-emerald-400 font-bold">Grado ' + pocket.grade + '</span></div><div class="flex items-center gap-2">' + assignedIcon + '<select onchange="Survival.assignPocketItem(\'' + pKey + '\', this.value)" class="w-full bg-slate-900 border border-slate-700 text-slate-300 text-[9px] rounded-lg p-1.5 focus:outline-none">' + optionsHtml + '</select></div></div>';
    });
  };

  S.openPocketInfo = function(pKey) {
    const pocket = state.pockets[pKey];
    document.getElementById('pocket-info-title').innerText = pocket.name;
    document.getElementById('pocket-info-grade').innerText = pocket.grade;
    document.getElementById('pocket-info-slots').innerText = pocket.slots;
    document.getElementById('pocket-info-desc').innerText = pocket.effectDesc;
    document.getElementById('pocket-info-modal').classList.remove('hidden');
  };

  S.closePocketInfo = function() {
    document.getElementById('pocket-info-modal').classList.add('hidden');
  };

  S.assignPocketItem = function(pKey, itemKey) {
    state.pockets[pKey].item = itemKey || null;
    if (itemKey) state.stats.pocketsAssigned++;
    S.renderPocketsUI();
  };

  // ===========================
  // LIBRARY & RESEARCH UI
  // ===========================
  S.renderLibrary = function() {
    const c = document.getElementById('nave-library-container');
    if (!c) return;
    const b1 = state.unlockedBooks.snackCap1;
    const b2 = state.unlockedBooks.repairCap1;
    const b3 = state.unlockedBooks.rifleCap1;
    c.innerHTML = '<div class="grid grid-cols-3 gap-2"><button onclick="Survival.openBookModal(\'snackCap1\')" class="p-2 bg-slate-950 border ' + (b1 ? 'border-amber-500/50 text-amber-300' : 'border-slate-800 text-slate-600') + ' rounded-xl flex flex-col items-center justify-center text-center transition active:scale-95"><span class="text-xl">📖</span><span class="text-[8px] font-bold mt-1">Snack Cap. I</span></button><button onclick="Survival.openBookModal(\'repairCap1\')" class="p-2 bg-slate-950 border ' + (b2 ? 'border-amber-500/50 text-amber-300' : 'border-slate-800 text-slate-600') + ' rounded-xl flex flex-col items-center justify-center text-center transition active:scale-95"><span class="text-xl">📖</span><span class="text-[8px] font-bold mt-1">Riparatori Cap. I</span></button><button onclick="Survival.openBookModal(\'rifleCap1\')" class="p-2 bg-slate-950 border ' + (b3 ? 'border-amber-500/50 text-amber-300' : 'border-slate-800 text-slate-600') + ' rounded-xl flex flex-col items-center justify-center text-center transition active:scale-95"><span class="text-xl">📖</span><span class="text-[8px] font-bold mt-1">Fucile Cap. I</span></button></div>';
  };

  S.openBookModal = function(key) {
    const isUnlocked = state.unlockedBooks[key];
    const title = key === 'snackCap1' ? 'I Segreti degli Snack - Cap. I' : (key === 'repairCap1' ? 'I Segreti dei Riparatori - Cap. I' : 'I Segreti del Fucile - Cap. I');
    const desc = isUnlocked ? 'Capitolo decifrato dagli archivi di bordo.' : 'Capitolo non ancora scoperto nelle zone di sbarco.';
    const benefit = key === 'snackCap1' ? '+1 punto curativo aggiuntivo sugli Snack 70g.' : (key === 'repairCap1' ? '+2 Dd extra al ripristino delle componenti Tuta/Casco/Stivali.' : '+10% precisione ed efficienza al Fucile Spaziale.');
    
    document.getElementById('book-modal-title').innerText = title;
    document.getElementById('book-modal-sub').innerText = desc;
    document.getElementById('book-modal-benefit').innerText = isUnlocked ? benefit : '🔒 Sblocca questo volume per attivare il vantaggio passivo.';
    document.getElementById('library-book-modal').classList.remove('hidden');
  };

  S.closeBookModal = function() {
    document.getElementById('library-book-modal').classList.add('hidden');
  };

  S.renderResearch = function() {
    const c = document.getElementById('nave-research-container');
    if (!c) return;
    if (state.techUnlocked) {
      c.innerHTML = '<div class="bg-indigo-950/40 border border-indigo-500/40 rounded-xl p-3 flex items-center justify-between"><div class="flex items-center gap-2"><span class="text-2xl">🔬</span><div><h4 class="font-bold text-xs text-indigo-200">Stiva Espansa L1</h4><p class="text-[9px] text-slate-400">Capienza aumentata a 350 pt.</p></div></div><span class="text-emerald-400 font-bold text-xs">SBLOCCATA ✔️</span></div>';
    } else {
      c.innerHTML = '<div class="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2"><div class="flex justify-between items-center"><h4 class="font-bold text-xs text-slate-200">Ricerca Capienza Stiva L1</h4><button onclick="document.getElementById(\'tech-info-modal\').classList.remove(\'hidden\')" class="text-indigo-400 font-bold text-[10px]">Info ?</button></div><p class="text-[9px] text-slate-400">Requisiti: 2000🪙, 100🧫, 10🪩, 20🧩</p><button onclick="Survival.startResearch()" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg text-[10px] uppercase tracking-wider">Avvia Ricerca Tecnologica</button></div>';
    }
  };

  S.closeResearchInfoPopup = function() {
    document.getElementById('tech-info-modal').classList.add('hidden');
  };

  S.startResearch = function() {
    if (state.credits < 2000 || state.compostoOrganico < 100 || state.liquidoPlusvalente < 10 || state.frammenti < 20) {
      S.showToast('Risorse insufficienti per la ricerca!', 'error');
      return;
    }
    state.credits -= 2000;
    state.compostoOrganico -= 100;
    state.liquidoPlusvalente -= 10;
    state.frammenti -= 20;
    state.techUnlocked = true;
    state.stats.researchStarted++;
    S.showToast('🔬 Ricerca Stiva L1 Completata!', 'success');
    S.renderAll();
  };

  // ===========================
  // MODALI DI SISTEMA
  // ===========================
  S.closeLastMissionRecap = function() {
    document.getElementById('last-mission-recap-modal').classList.add('hidden');
  };

  S.closeFailedModal = function() {
    document.getElementById('mission-failed-modal').classList.add('hidden');
    S.switchTab('casa');
  };

  S.closeStatsModal = function() {
    document.getElementById('stats-modal').classList.add('hidden');
  };

  S.closeInventoryModal = function() {
    document.getElementById('inventory-modal').classList.add('hidden');
    S.activeModalItem = null;
  };

  // ===========================
  // SWITCH TAB
  // ===========================
  S.switchTab = function(tabId) {
    if (state.inMission && tabId === 'mappa') return;
    S.activeTab = tabId;

    if (tabId === 'mappa') state.stats.tabVisitsMappa++;
    else if (tabId === 'missione') state.stats.tabVisitsMissione++;
    else if (tabId === 'casa') state.stats.tabVisitsCasa++;
    else if (tabId === 'opzioni') state.stats.tabVisitsOpzioni++;

    const tabs = ['mappa', 'missione', 'casa', 'opzioni'];
    tabs.forEach(function(t) {
      const btn = document.getElementById('nav-' + t);
      const screen = document.getElementById('tab-' + t);
      if (t === tabId) {
        btn.className = 'flex-1 py-1.5 px-1 rounded-lg flex flex-col items-center text-emerald-400 font-bold bg-slate-900 transition-all';
        screen.classList.remove('hidden');
      } else {
        btn.className = 'flex-1 py-1.5 px-1 rounded-lg flex flex-col items-center text-slate-500 transition-all';
        screen.classList.add('hidden');
      }
    });

    if (S.layoutModeActive && tabId !== 'casa') S.toggleLayoutMode();
    if (S.transferModeActive && tabId !== 'casa') S.toggleTransferMode();
    S.renderAll();
  };
})();
