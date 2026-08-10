// js/inventory.js
(function() {
  window.Survival = window.Survival || {};
  const S = window.Survival;
  const state = S.state;
  const ITEMS = S.ITEMS_METADATA;
  const LEVEL = S.LEVEL_THRESHOLDS;

  // ============================================
  // GESTIONE ITEM CLICK
  // ============================================
  S.handleItemClick = function(itemKey, sourceName) {
    if (S.isLongPress) return;
    
    if (S.transferModeActive) {
      S.activeTransferItem = itemKey;
      S.activeTransferSource = sourceName;
      S.selectedTransferQty = 1;
      S.updateTransferPanelUI();
      S.renderShedInventories();
    } else if (sourceName === 'backpack') {
      const meta = ITEMS[itemKey];
      if (meta.subType === 'Documento') {
        S.openMeteoDocModal(itemKey);
      } else {
        S.openInventoryModal(itemKey);
      }
    }
  };

  // ============================================
  // INVENTORY MODAL
  // ============================================
  S.openInventoryModal = function(itemKey) {
    const meta = ITEMS[itemKey];
    if (!meta) return;
    
    S.activeModalItem = itemKey;
    S.selectedModalQty = 1;
    
    document.getElementById('inv-modal-title').innerHTML = meta.icon + ' Consuma ' + meta.name;
    
    const stats = LEVEL[state.level - 1];
    document.getElementById('modal-item-stats-container').innerHTML = 
      '<div class="grid grid-cols-2 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-850/80 font-mono text-[9px] text-slate-300">' +
      '<div>❤️ Vita: <strong class="text-rose-400">' + state.hp + '/' + stats.maxHp + '</strong></div>' +
      '<div>🛡️ Scudo: <strong class="text-cyan-400">' + state.shield + '/' + stats.maxShield + '</strong></div>' +
      '</div>';
    
    S.updateModalQtyUI();
    document.getElementById('inventory-modal').classList.remove('hidden');
  };

  S.closeInventoryModal = function() {
    document.getElementById('inventory-modal').classList.add('hidden');
    S.activeModalItem = null;
  };

  S.changeModalQty = function(direction) {
    const avail = state.inventory[S.activeModalItem] || 0;
    const nextQty = S.selectedModalQty + direction;
    if (nextQty >= 1 && nextQty <= avail) {
      S.selectedModalQty = nextQty;
      S.updateModalQtyUI();
    }
  };

  S.setModalQtyMax = function() {
    const avail = state.inventory[S.activeModalItem] || 0;
    if (avail > 0) {
      S.selectedModalQty = avail;
      S.updateModalQtyUI();
    }
  };

  S.updateModalQtyUI = function() {
    const avail = state.inventory[S.activeModalItem] || 0;
    document.getElementById('modal-selected-qty').innerText = S.selectedModalQty;
    document.getElementById('modal-avail-indicator').innerHTML = S.selectedModalQty + ' / ' + avail;
    
    const previewText = document.getElementById('modal-preview-text');
    const pBonus = S.getPocketBonusValue(S.activeModalItem);
    const bonusStr = pBonus > 0 ? ' (+' + pBonus + ' Tasca)' : '';

    if (S.activeModalItem === 'snack') {
      const min = (5 + (pBonus === 1 ? 1 : 0)) * S.selectedModalQty;
      const max = (7 + (pBonus === 1 ? 1 : 0)) * S.selectedModalQty;
      previewText.innerHTML = 'Effetto previsto: Ripristina ' + min + '-' + max + ' ❤️ ' + bonusStr;
    } else if (S.activeModalItem === 'fluido') {
      const h = (pBonus === 1 ? 1 : 0) * S.selectedModalQty;
      previewText.innerHTML = 'Effetto previsto: Scudo Max' + (h > 0 ? ' e +' + h + ' ❤️' : '') + ' ' + bonusStr;
    } else if (S.activeModalItem === 'caricatore') {
      previewText.innerText = 'Effetto previsto: +' + (25 * S.selectedModalQty) + '-' + (45 * S.selectedModalQty) + ' Munizioni K1';
    } else if (S.activeModalItem === 'scatola') {
      previewText.innerText = 'Effetto previsto: Estrai caricatori extra.';
    } else if (S.activeModalItem === 'battery_c') {
      previewText.innerText = 'Effetto previsto: +' + (2 * S.selectedModalQty) + ' Cariche Torcia (Solo Esplorazione)';
    } else if (S.activeModalItem === 'box_battery_c') {
      previewText.innerText = 'Effetto previsto: Estrai 0-2 Batterie C per scatola.';
    } else if (S.activeModalItem === 'balloon') {
      previewText.innerText = 'Effetto previsto: Avvia Sonda Meteo (1x).';
    } else if (S.activeModalItem && S.activeModalItem.startsWith('repair_')) {
      let tName = S.activeModalItem === 'repair_suit' ? 'Tuta' :
                  (S.activeModalItem === 'repair_helmet' ? 'Casco' :
                  (S.activeModalItem === 'repair_boots' ? 'Stivali' : 'Fucile'));
      const ext = pBonus === 2 ? 2 : 0;
      let min = 0, max = 0;
      if (S.activeModalItem === 'repair_suit') { min = 35; max = 45; }
      else if (S.activeModalItem === 'repair_helmet') { min = 12; max = 20; }
      else if (S.activeModalItem === 'repair_boots') { min = 2; max = 5; }
      else { min = 15; max = 25; }
      previewText.innerHTML = 'Effetto previsto: Ripristina ' + (min + ext) * S.selectedModalQty + '-' + (max + ext) * S.selectedModalQty + ' Dd a [' + tName + '] ' + bonusStr;
    } else {
      previewText.innerText = '';
    }
  };

  S.confirmConsumeItem = function() {
    const avail = state.inventory[S.activeModalItem] || 0;
    if (S.selectedModalQty <= 0 || S.selectedModalQty > avail) return;
    
    const key = S.activeModalItem;
    const qty = S.selectedModalQty;
    
    if (key === 'balloon' && qty > 1) {
      S.showToast('Puoi lanciare un solo pallone alla volta!', 'error');
      return;
    }
    if (key === 'battery_c' && (!state.inMission || state.activeMission.exploreState !== 'searching')) {
      S.showToast('Usabile solo durante una ricerca attiva in missione!', 'error');
      return;
    }

    state.inventory[key] -= qty;
    state.stats.consumablesUsed += qty;
    const pBonus = S.getPocketBonusValue(key);

    for (var i = 0; i < qty; i++) {
      if (key === 'snack') {
        S.applyHealing(Math.floor(Math.random() * 3) + 5 + (pBonus === 1 ? 1 : 0));
      } else if (key === 'fluido') {
        state.shield = LEVEL[state.level - 1].maxShield;
        if (pBonus === 1) S.applyHealing(1);
      } else if (key === 'caricatore') {
        const bR = Math.floor(Math.random() * 21) + 25;
        if (!state.inMission) {
          let sp = 300 - (state.bullets || 0);
          if (bR <= sp) state.bullets = (state.bullets || 0) + bR;
          else {
            state.bullets = 300;
            state.stiva.bullets = (state.stiva.bullets || 0) + (bR - sp);
          }
        } else {
          state.bullets = Math.min(300, (state.bullets || 0) + bR);
        }
      } else if (key === 'scatola') {
        let tCar = 0;
        let tBul = 0;
        const r = Math.random() * 100;
        if (r >= 15 && r < 50) tCar += 1;
        else if (r >= 50 && r < 93) tCar += 2;
        else if (r >= 93) tCar += 3;
        tBul += Math.floor(Math.random() * 3);
        
        if (tBul > 0) {
          if (!state.inMission) {
            let sp = 300 - (state.bullets || 0);
            if (tBul <= sp) state.bullets = (state.bullets || 0) + tBul;
            else {
              state.bullets = 300;
              state.stiva.bullets = (state.stiva.bullets || 0) + (tBul - sp);
            }
          } else {
            state.bullets = Math.min(300, (state.bullets || 0) + tBul);
          }
        }
        S.distributeItemToStorage('caricatore', tCar);
        state.stats.consumablesGained += tCar;
      } else if (key === 'box_battery_c') {
        let r = Math.random() * 100;
        let b = 0;
        if (r >= 50 && r < 75) b = 1;
        else if (r >= 75) b = 2;
        S.distributeItemToStorage('battery_c', b);
        state.stats.consumablesGained += b;
      } else if (key === 'battery_c') {
        state.activeMission.searchCharges += 2;
      } else if (key === 'balloon') {
        S.addStatus('002');
      } else if (key && key.startsWith('repair_')) {
        const ext = pBonus === 2 ? 2 : 0;
        let old = 0;
        if (key === 'repair_suit') {
          old = state.equipment.suit.val;
          state.equipment.suit.val = Math.min(state.equipment.suit.max, state.equipment.suit.val + Math.floor(Math.random() * 11) + 35 + ext);
          state.stats.ddRestored += (state.equipment.suit.val - old);
        } else if (key === 'repair_helmet') {
          old = state.equipment.helmet.val;
          state.equipment.helmet.val = Math.min(state.equipment.helmet.max, state.equipment.helmet.val + Math.floor(Math.random() * 9) + 12 + ext);
          state.stats.ddRestored += (state.equipment.helmet.val - old);
        } else if (key === 'repair_boots') {
          old = state.equipment.boots.val;
          state.equipment.boots.val = Math.min(state.equipment.boots.max, state.equipment.boots.val + Math.floor(Math.random() * 4) + 2 + ext);
          state.stats.ddRestored += (state.equipment.boots.val - old);
        } else if (key === 'repair_weapon') {
          old = state.equipment.weapon.val;
          state.equipment.weapon.val = Math.min(state.equipment.weapon.max, state.equipment.weapon.val + Math.floor(Math.random() * 11) + 15 + ext);
          state.stats.ddRestored += (state.equipment.weapon.val - old);
        }
      }
    }

    if (state.inMission) {
      state.activeMission.lastUsedItem = key;
      state.activeMission.lastUsedQty = qty;
      document.getElementById('combat-last-item').innerHTML = ITEMS[key].icon + ' ' + ITEMS[key].name + ' (x' + qty + ')';
    }
    
    S.closeInventoryModal();
    S.renderAll();
  };

  // ============================================
  // METEO DOC MODAL
  // ============================================
  S.openMeteoDocModal = function(key) {
    const meta = ITEMS[key];
    document.getElementById('meteo-doc-title').innerHTML = meta.name;
    const c = document.getElementById('meteo-doc-content');
    
    if (key === 'meteo_a1') {
      c.innerHTML = 'Limpido: <span class="text-emerald-400">100%</span><br>Pioggia Acida: <span class="text-rose-400">0%</span><br>Temp. Gravitazionale: <span class="text-purple-400">0%</span>';
    } else if (key === 'meteo_a2') {
      c.innerHTML = 'Limpido: <span class="text-emerald-400">70%</span><br>Pioggia Acida: <span class="text-rose-400">15%</span><br>Temp. Gravitazionale: <span class="text-purple-400">15%</span>';
    } else if (key === 'meteo_a3') {
      c.innerHTML = 'Limpido: <span class="text-emerald-400">54%</span><br>Pioggia Acida: <span class="text-rose-400">23%</span><br>Temp. Gravitazionale: <span class="text-purple-400">23%</span>';
    }
    
    document.getElementById('meteo-doc-modal').classList.remove('hidden');
    state.inventory[key]--;
    S.renderAll();
  };

  S.closeMeteoDocModal = function() {
    document.getElementById('meteo-doc-modal').classList.add('hidden');
  };

  // ============================================
  // OVERLOAD MODAL
  // ============================================
  S.openOverloadModal = function() {
    const m = document.getElementById('mission-overload-modal');
    S.renderOverloadModalList();
    m.classList.remove('hidden');
  };

  S.renderOverloadModalList = function() {
    const listDiv = document.getElementById('overload-items-list');
    const wStat = document.getElementById('overload-weight-status');
    const btnResume = document.getElementById('btn-overload-resume');
    const currW = S.getBackpackWeight();
    
    wStat.innerText = currW + ' / 200 pt.';
    if (currW > 200) {
      wStat.className = 'font-bold text-rose-400';
      btnResume.disabled = true;
    } else {
      wStat.className = 'font-bold text-emerald-400';
      btnResume.disabled = false;
    }
    
    listDiv.innerHTML = '';
    state.backpackOrder.forEach(function(key) {
      const qty = state.inventory[key] || 0;
      if (qty <= 0) return;
      const meta = ITEMS[key];
      const isUsable = ['snack', 'fluido', 'caricatore', 'scatola', 'repair_suit', 'repair_helmet', 'repair_boots', 'repair_weapon', 'battery_c', 'box_battery_c', 'balloon', 'meteo_a1', 'meteo_a2', 'meteo_a3'].indexOf(key) !== -1;
      
      listDiv.innerHTML += '<div class="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">' +
        '<div class="flex items-center gap-2"><span class="text-xl shrink-0">' + meta.icon + '</span>' +
        '<div><div class="text-[10px] font-bold text-slate-200">' + meta.name + '</div>' +
        '<div class="text-[8px] text-slate-500 font-mono">Peso: ' + meta.weight + ' pt. - Qty: <span class="text-amber-400 font-black">x' + qty + '</span></div></div></div>' +
        '<div class="flex flex-col gap-1 shrink-0">' +
        (isUsable ? '<button data-item="' + key + '" class="btn-overload-use bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2 py-1 rounded text-[8px] uppercase active:scale-95">Usa</button>' : '') +
        '<button data-item="' + key + '" class="btn-overload-discard bg-rose-900 hover:bg-rose-800 text-rose-300 font-bold px-2 py-1 rounded text-[8px] uppercase active:scale-95 border border-rose-800">Scarta</button>' +
        '</div></div>';
    });
  };

  S.discardOverloadItem = function(key) {
    if (state.inventory[key] > 0) {
      state.inventory[key]--;
      S.renderOverloadModalList();
    }
  };

  S.resumeFromOverload = function() {
    document.getElementById('mission-overload-modal').classList.add('hidden');
    S.executeTurnEnd();
  };

  // ============================================
  // STIVA DISCARD MODAL
  // ============================================
  S.openStivaDiscardModal = function() {
    const modal = document.getElementById('stiva-full-modal');
    const listDiv = document.getElementById('stiva-excess-items-list');
    document.getElementById('stiva-discard-free').innerHTML = S.getStivaMaxCapacity() - S.getStivaWeight() + ' pt.';
    listDiv.innerHTML = '';
    
    Object.keys(state.excessItems).forEach(function(itemKey) {
      const qty = state.excessItems[itemKey] || 0;
      if (qty <= 0) return;
      const meta = ITEMS[itemKey];
      
      listDiv.innerHTML += '<div class="bg-slate-950 p-2.5 rounded-xl border border-slate-850 space-y-1.5" data-item="' + itemKey + '">' +
        '<div class="flex justify-between items-center"><span class="text-[11px] font-bold text-slate-200">' + meta.icon + ' ' + meta.name + ' <span class="text-[9px] text-slate-500">(' + meta.weight + ' pt.)</span></span>' +
        '<span class="text-xs font-black text-rose-400">Eccesso: x' + qty + '</span></div>' +
        '<div class="flex items-center gap-3"><span class="text-[9px] text-slate-400">Salva in Stiva:</span>' +
        '<div class="flex items-center gap-2"><button class="btn-discard-qty-minus w-6 h-6 bg-slate-800 text-white rounded font-black text-xs flex items-center justify-center">-</button>' +
        '<span id="discard-qty-' + itemKey + '" class="text-xs font-mono font-bold text-amber-400">' + (state.excessKept[itemKey] || 0) + '</span>' +
        '<button class="btn-discard-qty-plus w-6 h-6 bg-slate-800 text-white rounded font-black text-xs flex items-center justify-center">+</button>' +
        '<span class="text-[9px] text-slate-500 font-mono">/ ' + qty + '</span></div></div></div>';
    });
    
    modal.classList.remove('hidden');
    S.updateStivaDiscardUI();
  };

  S.changeDiscardQty = function(k, d) {
    const max = state.excessItems[k] || 0;
    const n = (state.excessKept[k] || 0) + d;
    if (n >= 0 && n <= max) {
      state.excessKept[k] = n;
      S.updateStivaDiscardUI();
    }
  };

  S.updateStivaDiscardUI = function() {
    let w = 0;
    Object.keys(state.excessKept).forEach(function(k) {
      const q = state.excessKept[k] || 0;
      w += q * ITEMS[k].weight;
      const disp = document.getElementById('discard-qty-' + k);
      if (disp) disp.innerText = q;
    });
    
    const free = S.getStivaMaxCapacity() - S.getStivaWeight();
    const span = document.getElementById('stiva-discard-weight');
    span.innerText = w + ' pt.';
    const btn = document.getElementById('btn-stiva-discard-confirm');
    
    if (w > free) {
      span.className = 'text-rose-500 font-bold';
      btn.disabled = true;
    } else {
      span.className = 'text-amber-400 font-bold';
      btn.disabled = false;
    }
  };

  S.confirmStivaStorage = function() {
    Object.keys(state.excessKept).forEach(function(k) {
      const q = state.excessKept[k] || 0;
      if (q > 0) state.stiva[k] = (state.stiva[k] || 0) + q;
    });
    Object.keys(state.excessItems).forEach(function(k) {
      state.excessItems[k] = 0;
      state.excessKept[k] = 0;
    });
    document.getElementById('stiva-full-modal').classList.add('hidden');
    if (state.selectedZone !== '0' && state.activeMission.recapTriggered) {
      S.finalizeMissionExit();
    } else {
      S.renderAll();
    }
  };

  // ============================================
  // DISTRIBUZIONE ITEM
  // ============================================
  S.distributeItemToStorage = function(itemKey, qty) {
    if (qty <= 0) return;
    const meta = ITEMS[itemKey];
    const availZ = 200 - S.getBackpackWeight();
    const reqW = qty * meta.weight;
    
    if (reqW <= availZ) {
      state.inventory[itemKey] = (state.inventory[itemKey] || 0) + qty;
    } else {
      const qtyToZ = Math.floor(availZ / meta.weight);
      if (qtyToZ > 0) state.inventory[itemKey] = (state.inventory[itemKey] || 0) + qtyToZ;
      const rem = qty - qtyToZ;
      if (rem <= 0) return;
      
      const availS = S.getStivaMaxCapacity() - S.getStivaWeight();
      if (rem * meta.weight <= availS) {
        state.stiva[itemKey] = (state.stiva[itemKey] || 0) + rem;
      } else {
        const qtyToS = Math.floor(availS / meta.weight);
        if (qtyToS > 0) state.stiva[itemKey] = (state.stiva[itemKey] || 0) + qtyToS;
        const exc = rem - qtyToS;
        if (exc > 0 && !state.inMission) {
          state.excessItems[itemKey] = (state.excessItems[itemKey] || 0) + exc;
          state.excessKept[itemKey] = 0;
        }
      }
    }
    
    if (!state.inMission && Object.values(state.excessItems).some(function(v) { return v > 0; })) {
      S.openStivaDiscardModal();
    }
  };

  // ============================================
  // TRANSFER MODE
  // ============================================
  S.toggleTransferMode = function() {
    if (S.layoutModeActive) S.toggleLayoutMode();
    S.transferModeActive = !S.transferModeActive;
    const btn = document.getElementById('btn-toggle-transfer');
    const p = document.getElementById('transfer-panel');
    
    if (S.transferModeActive) {
      btn.innerText = 'Chiudi';
      btn.className = 'bg-rose-900/60 hover:bg-rose-800 text-rose-300 border border-rose-500/30 font-bold px-2.5 py-1 rounded text-[9px] uppercase tracking-wider transition active:scale-95';
      p.classList.remove('hidden');
    } else {
      btn.innerText = 'Sposta';
      btn.className = 'bg-indigo-900/60 hover:bg-indigo-800 text-indigo-300 border border-indigo-500/30 font-bold px-2.5 py-1 rounded text-[9px] uppercase tracking-wider transition active:scale-95';
      p.classList.add('hidden');
      S.activeTransferItem = null;
      S.activeTransferSource = null;
    }
    S.renderShedInventories();
  };

  S.changeTransferQty = function(amount) {
    if (!S.activeTransferItem) return;
    const obj = S.activeTransferSource === 'backpack' ? state.inventory : state.stiva;
    const max = obj[S.activeTransferItem] || 0;
    let n = S.selectedTransferQty + amount;
    if (n < 1) n = 1;
    if (n > max) n = max;
    S.selectedTransferQty = n;
    S.updateTransferPanelUI();
  };

  S.updateTransferPanelUI = function() {
    document.getElementById('trans-zaino-ammo').innerHTML = state.bullets || 0;
    document.getElementById('trans-stiva-ammo').innerHTML = state.stiva.bullets || 0;
    
    const btnMoveAmmo1 = document.getElementById('btn-ammo-zaino-1');
    const btnMoveAmmo10 = document.getElementById('btn-ammo-zaino-10');
    if ((state.bullets || 0) >= 300) {
      btnMoveAmmo1.disabled = true;
      btnMoveAmmo10.disabled = true;
      btnMoveAmmo1.className += ' opacity-40';
      btnMoveAmmo10.className += ' opacity-40';
    } else {
      btnMoveAmmo1.disabled = false;
      btnMoveAmmo10.disabled = false;
      btnMoveAmmo1.className = btnMoveAmmo1.className.replace('opacity-40', '');
      btnMoveAmmo10.className = btnMoveAmmo10.className.replace('opacity-40', '');
    }
    
    if (!S.activeTransferItem) {
      document.getElementById('transfer-item-name').innerHTML = '-';
      document.getElementById('transfer-qty').innerHTML = '1';
      document.getElementById('transfer-max').innerHTML = '0';
      document.getElementById('btn-move-to-stiva').disabled = true;
      document.getElementById('btn-move-to-zaino').disabled = true;
      document.getElementById('btn-move-to-stiva').style.opacity = '0.4';
      document.getElementById('btn-move-to-zaino').style.opacity = '0.4';
      return;
    }
    
    const meta = ITEMS[S.activeTransferItem];
    const max = (S.activeTransferSource === 'backpack' ? state.inventory : state.stiva)[S.activeTransferItem] || 0;
    if (S.selectedTransferQty > max) S.selectedTransferQty = max;
    if (S.selectedTransferQty < 1 && max > 0) S.selectedTransferQty = 1;
    
    document.getElementById('transfer-item-name').innerHTML = meta.icon + ' ' + meta.name;
    document.getElementById('transfer-qty').innerHTML = S.selectedTransferQty;
    document.getElementById('transfer-max').innerHTML = max;
    
    const fZ = 200 - S.getBackpackWeight();
    const fS = S.getStivaMaxCapacity() - S.getStivaWeight();
    
    if (S.activeTransferSource === 'backpack') {
      document.getElementById('btn-move-to-stiva').disabled = (fS < meta.weight);
      document.getElementById('btn-move-to-stiva').style.opacity = (fS < meta.weight) ? '0.4' : '1';
      document.getElementById('btn-move-to-zaino').disabled = true;
      document.getElementById('btn-move-to-zaino').style.opacity = '0.4';
    } else {
      document.getElementById('btn-move-to-zaino').disabled = (fZ < meta.weight);
      document.getElementById('btn-move-to-zaino').style.opacity = (fZ < meta.weight) ? '0.4' : '1';
      document.getElementById('btn-move-to-stiva').disabled = true;
      document.getElementById('btn-move-to-stiva').style.opacity = '0.4';
    }
  };

  S.executeTransfer = function(direction) {
    if (!S.activeTransferItem) return;
    const meta = ITEMS[S.activeTransferItem];
    const fZ = 200 - S.getBackpackWeight();
    const fS = S.getStivaMaxCapacity() - S.getStivaWeight();
    
    if (direction === 'to_stiva' && S.activeTransferSource === 'backpack') {
      if (S.selectedTransferQty * meta.weight <= fS) {
        state.inventory[S.activeTransferItem] -= S.selectedTransferQty;
        state.stiva[S.activeTransferItem] = (state.stiva[S.activeTransferItem] || 0) + S.selectedTransferQty;
      } else {
        const p = Math.floor(fS / meta.weight);
        if (p > 0) {
          state.inventory[S.activeTransferItem] -= p;
          state.stiva[S.activeTransferItem] = (state.stiva[S.activeTransferItem] || 0) + p;
        }
      }
    } else if (direction === 'to_zaino' && S.activeTransferSource === 'stiva') {
      if (S.selectedTransferQty * meta.weight <= fZ) {
        state.stiva[S.activeTransferItem] -= S.selectedTransferQty;
        state.inventory[S.activeTransferItem] = (state.inventory[S.activeTransferItem] || 0) + S.selectedTransferQty;
      } else {
        const p = Math.floor(fZ / meta.weight);
        if (p > 0) {
          state.stiva[S.activeTransferItem] -= p;
          state.inventory[S.activeTransferItem] = (state.inventory[S.activeTransferItem] || 0) + p;
        }
      }
    }
    
    S.selectedTransferQty = 1;
    S.updateTransferPanelUI();
    S.renderShedInventories();
  };

  S.moveAmmo = function(direction, qty) {
    if (direction === 'to_stiva') {
      const toMove = Math.min(qty, state.bullets || 0);
      if (toMove > 0) {
        state.bullets = (state.bullets || 0) - toMove;
        state.stiva.bullets = (state.stiva.bullets || 0) + toMove;
      }
    } else if (direction === 'to_zaino') {
      const toMove = Math.min(qty, state.stiva.bullets || 0, 300 - (state.bullets || 0));
      if (toMove > 0) {
        state.bullets = (state.bullets || 0) + toMove;
        state.stiva.bullets -= toMove;
      }
    }
    S.updateTransferPanelUI();
    S.renderShedInventories();
  };

  // ============================================
  // LONG PRESS
  // ============================================
  S.startLongPress = function(itemKey) {
    S.isLongPress = false;
    S.longPressActive = true;
    S.longPressTimer = setTimeout(function() {
      S.isLongPress = true;
      const meta = ITEMS[itemKey];
      if (meta) {
        document.getElementById('item-info-toast-text').innerHTML = meta.name + ': ' + meta.desc + '<br><span class="text-slate-400 text-[10px]">Peso unitario: ' + meta.weight + ' pt.</span>';
        document.getElementById('item-info-toast-type').innerHTML = 'TIPOLOGIA: ' + meta.subType.toUpperCase();
        document.getElementById('item-info-toast').classList.remove('hidden');
      }
    }, 700);
  };

  S.endLongPress = function() {
    clearTimeout(S.longPressTimer);
    S.longPressActive = false;
    setTimeout(function() {
      document.getElementById('item-info-toast').classList.add('hidden');
    }, 500);
  };
})();