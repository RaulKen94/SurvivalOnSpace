// js/events.js
(function() {
  window.Survival = window.Survival || {};
  const S = window.Survival;

  function initEvents() {
    // ========================
    // NAVIGAZIONE
    // ========================
    document.getElementById('nav-mappa').addEventListener('click', function() {
      S.switchTab('mappa');
    });
    document.getElementById('nav-missione').addEventListener('click', function() {
      S.switchTab('missione');
    });
    document.getElementById('nav-casa').addEventListener('click', function() {
      S.switchTab('casa');
    });
    document.getElementById('nav-opzioni').addEventListener('click', function() {
      S.switchTab('opzioni');
    });

    // ========================
    // MAPPA - ZONE
    // ========================
    document.getElementById('zone-card-0').addEventListener('click', function() {
      S.selectZone('0');
    });
    document.getElementById('zone-card-A1').addEventListener('click', function() {
      S.selectZone('A1');
    });
    document.getElementById('zone-card-A2').addEventListener('click', function() {
      S.selectZone('A2');
    });
    document.getElementById('zone-card-A3').addEventListener('click', function() {
      S.selectZone('A3');
    });

    // ========================
    // MAPPA - CITY
    // ========================
    document.getElementById('city-toggle-header').addEventListener('click', function() {
      S.toggleCityLocations();
    });
    document.getElementById('loc-piazza').addEventListener('click', function() {
      S.visitLocation('piazza');
    });
    document.getElementById('loc-lustrascarpe').addEventListener('click', function() {
      S.visitLocation('lustrascarpe');
    });
    document.getElementById('loc-emporio').addEventListener('click', function() {
      S.visitLocation('emporio');
    });

    // ========================
    // MISSIONE
    // ========================
    document.getElementById('btn-sbarco').addEventListener('click', function() {
      S.startMission();
    });
    document.getElementById('btn-annulla-missione').addEventListener('click', function() {
      S.cancelMissionAndGoHome();
    });
    document.getElementById('btn-repeat-last').addEventListener('click', function() {
      S.repeatLastMission();
    });
    document.getElementById('btn-fire').addEventListener('click', function() {
      S.fireWeapon();
    });
    document.getElementById('btn-esplora').addEventListener('click', function() {
      S.exploreZone();
    });
    document.getElementById('btn-cerca').addEventListener('click', function() {
      S.searchBuilding();
    });
    document.getElementById('btn-complete-mission').addEventListener('click', function() {
      S.triggerCompleteMissionLoot();
    });
    document.getElementById('btn-accetta-ricompense').addEventListener('click', function() {
      S.acceptMissionRewards();
    });
    document.getElementById('btn-loot-info').addEventListener('click', function() {
      S.openLootInfo();
    });
    document.getElementById('btn-tasche').addEventListener('click', function() {
      S.openSoftLayoutModal();
    });

    // ========================
    // MODALI MISSIONE
    // ========================
    document.getElementById('btn-chiudi-loot-info').addEventListener('click', function() {
      S.closeLootInfo();
    });
    document.getElementById('btn-chiudi-soft-layout').addEventListener('click', function() {
      S.closeSoftLayoutModal();
    });
    document.getElementById('btn-chiudi-recap').addEventListener('click', function() {
      S.closeLastMissionRecap();
    });
    document.getElementById('btn-close-failed').addEventListener('click', function() {
      S.closeFailedModal();
    });
    document.getElementById('btn-chiudi-meteo').addEventListener('click', function() {
      S.closeMeteoDocModal();
    });
    document.getElementById('btn-overload-resume').addEventListener('click', function() {
      S.resumeFromOverload();
    });
    document.getElementById('btn-stiva-discard-confirm').addEventListener('click', function() {
      S.confirmStivaStorage();
    });

    // Explore choices (delegated)
    document.getElementById('explore-choice-list').addEventListener('click', function(e) {
      const btn = e.target.closest('button');
      if (btn) {
        const idx = Array.from(btn.parentElement.children).indexOf(btn);
        S.selectExploreChoice(idx);
      }
    });

    // ========================
    // CASA - RECAP
    // ========================
    document.getElementById('btn-recap-missione').addEventListener('click', function() {
      S.showLastMissionRecap();
    });

    // ========================
    // CASA - REGEN
    // ========================
    document.getElementById('btn-regen-standard').addEventListener('click', function() {
      S.triggerRegen('standard');
    });
    document.getElementById('btn-regen-fast').addEventListener('click', function() {
      S.triggerRegen('fast');
    });
    document.getElementById('btn-refill').addEventListener('click', function() {
      S.triggerRefill();
    });

    // ========================
    // CASA - LAYOUT & TRANSFER
    // ========================
    document.getElementById('btn-toggle-layout').addEventListener('click', function() {
      S.toggleLayoutMode();
    });
    document.getElementById('btn-toggle-transfer').addEventListener('click', function() {
      S.toggleTransferMode();
    });

    // Transfer buttons
    document.getElementById('btn-transfer-minus1').addEventListener('click', function() {
      S.changeTransferQty(-1);
    });
    document.getElementById('btn-transfer-plus1').addEventListener('click', function() {
      S.changeTransferQty(1);
    });
    document.getElementById('btn-transfer-minus10').addEventListener('click', function() {
      S.changeTransferQty(-10);
    });
    document.getElementById('btn-transfer-plus10').addEventListener('click', function() {
      S.changeTransferQty(10);
    });
    document.getElementById('btn-move-to-stiva').addEventListener('click', function() {
      S.executeTransfer('to_stiva');
    });
    document.getElementById('btn-move-to-zaino').addEventListener('click', function() {
      S.executeTransfer('to_zaino');
    });

    // Ammo transfer
    document.getElementById('btn-ammo-stiva-1').addEventListener('click', function() {
      S.moveAmmo('to_stiva', 1);
    });
    document.getElementById('btn-ammo-stiva-10').addEventListener('click', function() {
      S.moveAmmo('to_stiva', 10);
    });
    document.getElementById('btn-ammo-zaino-1').addEventListener('click', function() {
      S.moveAmmo('to_zaino', 1);
    });
    document.getElementById('btn-ammo-zaino-10').addEventListener('click', function() {
      S.moveAmmo('to_zaino', 10);
    });

    // ========================
    // CASA - POCKETS
    // ========================
    document.getElementById('pockets-container').addEventListener('change', function(e) {
      if (e.target.tagName === 'SELECT') {
        const pKey = e.target.closest('.bg-slate-950').dataset.pocket;
        if (pKey) S.assignPocketItem(pKey, e.target.value);
      }
    });
    document.getElementById('pockets-container').addEventListener('click', function(e) {
      const btn = e.target.closest('button');
      if (btn && btn.innerText === '?') {
        const pKey = btn.closest('.bg-slate-950').dataset.pocket;
        if (pKey) S.openPocketInfo(pKey);
      }
    });

    // ========================
    // CASA - SYNTHESIS (delegated)
    // ========================
    document.getElementById('nave-synthesis-container').addEventListener('click', function(e) {
      const btn = e.target.closest('button');
      if (!btn) return;
      
      // Grid slots
      if (btn.closest('.grid-cols-3') && !btn.closest('.grid-cols-3').classList.contains('grid-cols-3')) {
        // It's a grid slot
        const idx = Array.from(btn.parentElement.children).indexOf(btn);
        S.toggleSynthesisGridSlot(idx);
      }
      // Keychain slots
      else if (btn.closest('.grid-cols-3') && btn.closest('.grid-cols-3').classList.contains('grid-cols-3')) {
        const idx = Array.from(btn.parentElement.children).indexOf(btn);
        S.toggleSynthesisKeychainSlot(idx);
      }
      // Action buttons
      else if (btn.innerText.includes('Crea')) {
        S.createSynthesisItem();
      } else if (btn.innerText.includes('Fondi') || btn.innerText.includes('Apri')) {
        const actionType = btn.innerText.includes('Fondi') ? 'merge' : 'open';
        S.executeSynthesisAction(actionType);
      } else if (btn.innerText.includes('Sposta')) {
        S.executeKeyMove('to_keychain');
      } else if (btn.innerText.includes('⬆️')) {
        S.executeKeyMove('to_grid');
      }
    });

    // ========================
    // CASA - LIBRARY
    // ========================
    document.getElementById('nave-library-container').addEventListener('click', function(e) {
      const btn = e.target.closest('button');
      if (btn) {
        const key = btn.innerText.includes('Snack') ? 'snackCap1' :
                    btn.innerText.includes('Riparatori') ? 'repairCap1' :
                    btn.innerText.includes('Fucile') ? 'rifleCap1' : null;
        if (key) S.openBookModal(key);
      }
    });
    document.getElementById('btn-chiudi-book').addEventListener('click', function() {
      S.closeBookModal();
    });

    // ========================
    // CASA - RESEARCH
    // ========================
    document.getElementById('nave-research-container').addEventListener('click', function(e) {
      const btn = e.target.closest('button');
      if (btn && btn.innerText.includes('Avvia')) {
        S.startResearch();
      }
      if (btn && btn.innerText === 'Info ?') {
        document.getElementById('tech-info-modal').classList.remove('hidden');
      }
    });
    document.getElementById('btn-chiudi-tech-info').addEventListener('click', function() {
      S.closeResearchInfoPopup();
    });

    // ========================
    // POCKET INFO MODAL
    // ========================
    document.getElementById('btn-chiudi-pocket-info').addEventListener('click', function() {
      S.closePocketInfo();
    });

    // ========================
    // EMPORIO
    // ========================
    document.getElementById('emp-dest-zaino-label').addEventListener('click', function() {
      S.setEmporioDest('zaino');
    });
    document.getElementById('emp-dest-stiva-label').addEventListener('click', function() {
      S.setEmporioDest('stiva');
    });
    document.getElementById('btn-emp-repair-helmet').addEventListener('click', function() {
      S.buyEmporio('repair_helmet', 1000);
    });
    document.getElementById('btn-emp-repair-weapon').addEventListener('click', function() {
      S.buyEmporio('repair_weapon', 1000);
    });
    document.getElementById('btn-emp-box-battery').addEventListener('click', function() {
      S.buyEmporio('box_battery_c', 2000);
    });
    document.getElementById('btn-emp-heal').addEventListener('click', function() {
      S.buyServiceEmporio('heal');
    });
    document.getElementById('btn-emp-fluidi').addEventListener('click', function() {
      S.buyServiceEmporio('fluidi');
    });
    document.getElementById('btn-chiudi-emporio').addEventListener('click', function() {
      S.closeEmporio();
    });

    // ========================
    // INVENTORY MODAL
    // ========================
    document.getElementById('btn-modal-minus').addEventListener('click', function() {
      S.changeModalQty(-1);
    });
    document.getElementById('btn-modal-plus').addEventListener('click', function() {
      S.changeModalQty(1);
    });
    document.getElementById('btn-modal-max').addEventListener('click', function() {
      S.setModalQtyMax();
    });
    document.getElementById('btn-modal-annulla').addEventListener('click', function() {
      S.closeInventoryModal();
    });
    document.getElementById('btn-modal-conferma').addEventListener('click', function() {
      S.confirmConsumeItem();
    });

    // ========================
    // OPZIONI - SAVE/LOAD
    // ========================
    document.getElementById('btn-esporta-salvataggio').addEventListener('click', function() {
      S.generateSaveCode();
    });
    document.getElementById('btn-copia-salvataggio').addEventListener('click', function() {
      S.copySaveToClipboard();
    });
    document.getElementById('btn-carica-salvataggio').addEventListener('click', function() {
      S.loadSaveCode();
    });
    document.getElementById('btn-statistiche').addEventListener('click', function() {
      S.openStatsModal();
    });
    document.getElementById('btn-close-stats').addEventListener('click', function() {
      S.closeStatsModal();
    });

    // ========================
    // OVERLOAD MODAL - Item discard (delegated)
    // ========================
    document.getElementById('overload-items-list').addEventListener('click', function(e) {
      const btn = e.target.closest('button');
      if (!btn) return;
      if (btn.innerText.includes('Usa')) {
        const itemKey = btn.closest('.bg-slate-950').querySelector('.font-bold').innerText.trim();
        // Find the key from the item name
        const key = Object.keys(S.ITEMS_METADATA).find(function(k) {
          return S.ITEMS_METADATA[k].name === itemKey;
        });
        if (key) S.handleItemClick(key, 'backpack');
      } else if (btn.innerText.includes('Scarta')) {
        const itemKey = btn.closest('.bg-slate-950').querySelector('.font-bold').innerText.trim();
        const key = Object.keys(S.ITEMS_METADATA).find(function(k) {
          return S.ITEMS_METADATA[k].name === itemKey;
        });
        if (key) S.discardOverloadItem(key);
      }
    });

    // ========================
    // STIVA DISCARD - Quantity buttons (delegated)
    // ========================
    document.getElementById('stiva-excess-items-list').addEventListener('click', function(e) {
      const btn = e.target.closest('button');
      if (!btn) return;
      const parent = btn.closest('.bg-slate-950');
      if (!parent) return;
      const itemName = parent.querySelector('.font-bold').innerText.trim();
      const key = Object.keys(S.ITEMS_METADATA).find(function(k) {
        return S.ITEMS_METADATA[k].name === itemName;
      });
      if (!key) return;
      if (btn.innerText === '+') S.changeDiscardQty(key, 1);
      else if (btn.innerText === '-') S.changeDiscardQty(key, -1);
    });

    // ========================
    // KEYBOARD SHORTCUTS
    // ========================
    document.addEventListener('keydown', function(e) {
      // Tasto F per sparare
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        S.fireWeapon();
      }
      // Tasto E per esplorare
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        S.exploreZone();
      }
      // Tasto C per cercare
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        S.searchBuilding();
      }
      // Tasto M per mappa
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        S.switchTab('mappa');
      }
      // Tasto 1-4 per le tab
      if (e.key === '1') { e.preventDefault(); S.switchTab('mappa'); }
      if (e.key === '2') { e.preventDefault(); S.switchTab('missione'); }
      if (e.key === '3') { e.preventDefault(); S.switchTab('casa'); }
      if (e.key === '4') { e.preventDefault(); S.switchTab('opzioni'); }
    });

    console.log('✅ Event listeners inizializzati!');
  }

  // Esponi la funzione per essere chiamata da main.js
  S.initEvents = initEvents;
})();