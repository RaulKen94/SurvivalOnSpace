// js/city.js
(function() {
  window.Survival = window.Survival || {};
  const S = window.Survival;
  const state = S.state;
  const ITEMS = S.ITEMS_METADATA;
  const LEVEL = S.LEVEL_THRESHOLDS;

  // ============================================
  // CITY TOGGLE
  // ============================================
  S.toggleCityLocations = function() {
    S.cityExpanded = !S.cityExpanded;
    S.renderCity();
  };

  // ============================================
  // RENDER CITY
  // ============================================
  S.renderCity = function() {
    const list = document.getElementById('city-locations-list');
    const icon = document.getElementById('city-toggle-icon');
    
    if (S.cityExpanded) {
      list.classList.remove('hidden');
      icon.innerText = '▲';
    } else {
      list.classList.add('hidden');
      icon.innerText = '▼';
    }
    
    const inShip = (state.selectedZone === '0' && !state.inMission);
    const container = document.getElementById('spazi-cittadini-container');
    
    if (!inShip) {
      container.className = 'space-y-2.5 opacity-40 pointer-events-none';
      return;
    } else {
      container.className = 'space-y-2.5';
    }

    document.getElementById('city-boots-status').innerHTML = state.equipment.boots.val + '/' + state.equipment.boots.max + ' Dd';
    
    const locPiazza = document.getElementById('loc-piazza');
    const locLustra = document.getElementById('loc-lustrascarpe');
    const locEmporio = document.getElementById('loc-emporio');
    
    const bStyle = 'w-full text-left bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between active:scale-[0.99] transition';
    const bActiveStyle = 'w-full text-left bg-indigo-950/40 border-2 border-indigo-500 rounded-lg p-2.5 flex items-center justify-between active:scale-[0.99] transition';
    
    locPiazza.className = state.city.currentLocation === 'piazza' ? bActiveStyle : bStyle;
    locLustra.className = state.city.currentLocation === 'lustrascarpe' ? bActiveStyle : bStyle;
    locEmporio.className = state.city.currentLocation === 'emporio' ? bActiveStyle : bStyle;

    document.getElementById('cost-emporio').innerHTML = state.city.lustrascarpeActive ? 'GRATIS' : '4 Dd';
    document.getElementById('cost-emporio').className = state.city.lustrascarpeActive ? 'text-[9px] font-mono text-emerald-400 font-bold' : 'text-[9px] font-mono text-rose-400 font-bold';
  };

  // ============================================
  // VISITA LOCATION
  // ============================================
  S.visitLocation = function(loc) {
    if (loc === state.city.currentLocation) return;
    
    let cost = 0;
    if (loc === 'emporio') cost = state.city.lustrascarpeActive ? 0 : 4;
    
    if (state.equipment.boots.val < cost) {
      S.showToast('Dd Stivali insufficienti! Richiesti: ' + cost, 'error');
      return;
    }
    
    if (loc === 'lustrascarpe') {
      if (state.city.lustrascarpeActive) {
        S.showToast('Lucidatura già attiva!', 'info');
        return;
      }
      if (state.credits < 200) {
        S.showToast('Crediti insufficienti (200🪙)', 'error');
        return;
      }
      if (state.stats.missionsA1 + state.stats.missionsA2 + state.stats.missionsA3 < 2) {
        S.showToast('Completa almeno 2 sbarchi prima di riutilizzarlo.', 'error');
        return;
      }
      state.credits -= 200;
      state.city.lustrascarpeActive = true;
      S.showToast('Stivali lucidati! Prossimo ingresso gratuito.', 'success');
    }

    state.equipment.boots.val -= cost;
    if (cost > 0 && state.city.lustrascarpeActive) state.city.lustrascarpeActive = false;
    state.city.currentLocation = loc;
    
    if (loc !== 'piazza') {
      state.stats.cityVisits++;
      state.city.visits[loc] = (state.city.visits[loc] || 0) + 1;
    }
    if (loc === 'emporio') {
      state.city.emporioFluidiRiscattati = false;
      S.openEmporio();
    }

    S.renderAll();
  };

  // ============================================
  // EMPORIO
  // ============================================
  S.openEmporio = function() {
    document.getElementById('emporio-modal').classList.remove('hidden');
    S.updateEmporioUI();
  };

  S.closeEmporio = function() {
    document.getElementById('emporio-modal').classList.add('hidden');
    state.city.currentLocation = 'piazza';
    S.renderAll();
  };

  S.setEmporioDest = function(dest) {
    S.emporioDest = dest;
    S.updateEmporioUI();
  };

  S.updateEmporioUI = function() {
    document.getElementById('emporio-creds').innerHTML = state.credits;
    const freeZaino = 200 - S.getBackpackWeight();
    const freeStiva = S.getStivaMaxCapacity() - S.getStivaWeight();
    document.getElementById('emp-zaino-space').innerHTML = '(' + freeZaino + ' pt)';
    document.getElementById('emp-stiva-space').innerHTML = '(' + freeStiva + ' pt)';
    
    const btnFluidi = document.getElementById('btn-emp-fluidi');
    if (state.city.emporioFluidiRiscattati) {
      btnFluidi.innerHTML = 'Riscattato';
      btnFluidi.disabled = true;
    } else {
      btnFluidi.innerHTML = 'Gratis';
      btnFluidi.disabled = false;
    }
  };

  S.buyEmporio = function(itemKey, cost) {
    if (state.credits < cost) {
      S.showToast('Crediti insufficienti!', 'error');
      return;
    }
    const meta = ITEMS[itemKey];
    const targetSpace = S.emporioDest === 'zaino' ? (200 - S.getBackpackWeight()) : (S.getStivaMaxCapacity() - S.getStivaWeight());
    if (targetSpace < meta.weight) {
      S.showToast('Spazio insufficiente in ' + S.emporioDest + '!', 'error');
      return;
    }
    
    state.credits -= cost;
    if (S.emporioDest === 'zaino') {
      state.inventory[itemKey] = (state.inventory[itemKey] || 0) + 1;
    } else {
      state.stiva[itemKey] = (state.stiva[itemKey] || 0) + 1;
    }
    S.showToast('Acquisto effettuato!', 'success');
    S.updateEmporioUI();
    S.renderAll();
  };

  S.buyServiceEmporio = function(type) {
    if (type === 'heal') {
      if (state.credits < 100) {
        S.showToast('Crediti insufficienti!', 'error');
        return;
      }
      state.credits -= 100;
      state.hp = LEVEL[state.level - 1].maxHp;
      state.shield = LEVEL[state.level - 1].maxShield;
      S.showToast('Parametri vitali ripristinati!', 'success');
    } else if (type === 'fluidi') {
      if (state.city.emporioFluidiRiscattati) return;
      state.city.emporioFluidiRiscattati = true;
      
      const meta = ITEMS['fluido'];
      let fluidi = 5;
      if (S.emporioDest === 'zaino') {
        const spaceZaino = 200 - S.getBackpackWeight();
        const canFitZaino = Math.min(5, Math.floor(spaceZaino / meta.weight));
        if (canFitZaino > 0) {
          state.inventory['fluido'] = (state.inventory['fluido'] || 0) + canFitZaino;
          fluidi -= canFitZaino;
        }
        if (fluidi > 0) {
          const spaceStiva = S.getStivaMaxCapacity() - S.getStivaWeight();
          const canFitStiva = Math.min(fluidi, Math.floor(spaceStiva / meta.weight));
          if (canFitStiva > 0) {
            state.stiva['fluido'] = (state.stiva['fluido'] || 0) + canFitStiva;
            fluidi -= canFitStiva;
          }
        }
      } else {
        const spaceStiva = S.getStivaMaxCapacity() - S.getStivaWeight();
        const canFitStiva = Math.min(5, Math.floor(spaceStiva / meta.weight));
        if (canFitStiva > 0) {
          state.stiva['fluido'] = (state.stiva['fluido'] || 0) + canFitStiva;
          fluidi -= canFitStiva;
        }
      }
      
      if (fluidi > 0) {
        S.showToast(fluidi + ' fluidi persi per mancanza di spazio!', 'error');
      } else {
        S.showToast('Rifornimento fluidi ritirato!', 'success');
      }
    }
    S.updateEmporioUI();
    S.renderAll();
  };
})();