// js/game-core.js
(function() {
  window.Survival = window.Survival || {};
  const S = window.Survival;
  const state = S.state;
  const LEVEL = S.LEVEL_THRESHOLDS;
  const ZONES = S.ZONE_DATA;
  const ITEMS = S.ITEMS_METADATA;

  S.startMission = function() {
    if (state.selectedZone === '0' || state.inMission) return;
    
    let alienCount = state.aliens[state.selectedZone];
    if (state.selectedZone === 'A3') {
      alienCount = Math.floor(Math.random() * 11) + 90;
    }
    
    state.inMission = true;
    if (S.layoutModeActive) S.toggleLayoutMode();
    if (S.transferModeActive) S.toggleTransferMode();
    state.city.currentLocation = 'piazza';

    const wId = S.rollMissionWeather(state.selectedZone);

    state.activeMission = {
      zone: state.selectedZone,
      initialAliens: alienCount,
      aliensRemaining: alienCount,
      aliensKilled: 0,
      expGained: 0,
      weatherId: wId,
      explorationLoot: { snack: 0, fluido: 0, caricatore: 0, scatola: 0, repair_suit: 0, repair_helmet: 0, repair_boots: 0, repair_weapon: 0, premium: 0, composto: 0, credits: 0, battery_c: 0, box_battery_c: 0, balloon: 0, meteo_a1: 0, meteo_a2: 0, meteo_a3: 0 },
      endMissionDrops: { snack: 0, fluido: 0, caricatore: 0, scatola: 0, repair_suit: 0, repair_helmet: 0, repair_boots: 0, repair_weapon: 0, premium: 0, battery_c: 0, book1: 0, book2: 0, book3: 0 },
      recapTriggered: false,
      lastUsedItem: null,
      lastUsedQty: 0,
      explorationsCount: 0,
      exploreState: 'none',
      searchCharges: 0,
      lastExploreStatus: '-',
      lastExploreResult: '-',
      pendingChoices: []
    };

    if (state.usedRegenSinceLastMission) {
      S.addStatus('001');
      state.usedRegenSinceLastMission = false;
    }
    
    document.getElementById('combat-shot-status').innerText = '-';
    document.getElementById('combat-explore-status').innerText = '-';
    document.getElementById('combat-last-item').innerText = '-';
    document.getElementById('combat-explore-result').innerText = '-';
    S.switchTab('missione');
  };

  S.rollMissionWeather = function(zoneId) {
    const roll = Math.random() * 100;
    if (zoneId === 'A1') return 'limpido';
    else if (zoneId === 'A2') {
      if (roll < 70) return 'limpido';
      else if (roll < 85) return 'acido';
      else return 'gravitazionale';
    } else {
      if (roll < 54) return 'limpido';
      else if (roll < 77) return 'acido';
      else return 'gravitazionale';
    }
  };

  S.applyWeatherEffects = function() {
    const wId = state.activeMission.weatherId;
    if (!wId || wId === 'limpido') return;
    if (Math.random() * 100 >= 45) return;
    
    let dmgMsg = '';
    if (wId === 'acido') {
      let dmg = Math.floor(Math.random() * 3) + 2;
      if (state.equipment.helmet.val > 0) {
        const dmgToHelmet = Math.min(state.equipment.helmet.val, dmg);
        state.equipment.helmet.val -= dmgToHelmet;
        dmg -= dmgToHelmet;
        state.stats.ddLostHelmet += dmgToHelmet;
      }
      if (dmg > 0) state.hp -= dmg;
      dmgMsg = 'Pioggia Acida! Danni subiti.';
      S.spawnFloatingDamage(dmg > 0 ? dmg : 0, 'helmet_acid');
    } else if (wId === 'gravitazionale') {
      let dmg = 0;
      if (state.shield > 0) {
        state.shield = 0;
        dmgMsg = 'Tempesta Gravitazionale! Scudo azzerato.';
      } else {
        dmg = Math.floor(Math.random() * 2) + 1;
        if (state.equipment.helmet.val > 0) {
          const dmgToHelmet = Math.min(state.equipment.helmet.val, dmg);
          state.equipment.helmet.val -= dmgToHelmet;
          dmg -= dmgToHelmet;
          state.stats.ddLostHelmet += dmgToHelmet;
        }
        if (dmg > 0) state.hp -= dmg;
        dmgMsg = 'Tempesta Gravitazionale! Danni penetranti.';
      }
      S.addStatus('003');
      if (dmg > 0) S.spawnFloatingDamage(dmg, 'hp');
    }
    if (dmgMsg) S.showToast(dmgMsg, 'error');
  };

  S.executeTurnEnd = function() {
    S.applyWeatherEffects();
    S.processStatusesEndTurn();
    if (state.hp <= 0) S.handleMissionFailure();
    else S.renderAll();
  };

  S.exploreZone = function() {
    if (!state.inMission || state.activeMission.aliensRemaining <= 0 || state.activeMission.explorationsCount >= 2) return;
    state.activeMission.explorationsCount++;
    const isSuccess = Math.random() < 0.5;
    if (!isSuccess) {
      state.activeMission.lastExploreStatus = 'KO 💨';
      state.activeMission.lastExploreResult = 'Niente di utile...';
    } else {
      const isEventA = Math.random() < 0.5;
      if (isEventA) {
        state.activeMission.lastExploreStatus = 'OK 🪙';
        const credBonus = Math.floor(ZONES[state.activeMission.zone].reward * 0.10);
        state.credits += credBonus;
        state.activeMission.explorationLoot.credits += credBonus;
        state.activeMission.explorationLoot.composto += 25;
        state.compostoOrganico += 25;
        state.activeMission.lastExploreResult = '+' + credBonus + ' 🪙, +25 🧫';
      } else {
        state.activeMission.lastExploreStatus = 'OK 🌆';
        state.activeMission.exploreState = 'searching';
        state.activeMission.searchCharges = 3;
        state.activeMission.lastExploreResult = 'Edifici individuati. Cerca!';
      }
    }
    S.executeTurnEnd();
  };

  S.searchBuilding = function() {
    if (!state.inMission || state.activeMission.exploreState !== 'searching' || state.activeMission.searchCharges <= 0) return;
    state.activeMission.searchCharges--;
    const isSuccess = Math.random() < 0.33;
    if (isSuccess) {
      S.generateExploreChoicesAndOpenModal(state.activeMission.zone);
    } else {
      state.activeMission.lastExploreResult = 'Niente di utile... 💨';
    }
    if (state.activeMission.searchCharges <= 0) {
      state.activeMission.exploreState = 'none';
      if (state.activeMission.lastExploreResult === 'Edifici individuati. Cerca!') {
        state.activeMission.lastExploreResult = 'Ricerca conclusa.';
      }
    }
    if (!isSuccess || state.activeMission.searchCharges <= 0) S.executeTurnEnd();
  };

  S.generateExploreChoicesAndOpenModal = function(zone) {
    let choices = [];
    if (zone === 'A1') {
      const x = Math.floor(Math.random() * 4) + 2;
      choices.push({ text: '+1 🥼 Tuta, +5 🛡️ Scudo', loot: [{k: 'repair_suit', q: 1}], hp: 0, shield: 5, composto: 0 });
      choices.push({ text: '+50 🧫 Composto, +' + x + ' 🍪 Snack', loot: [{k: 'snack', q: x}], hp: 0, shield: 0, composto: 50 });
    } else if (zone === 'A2') {
      const x = Math.floor(Math.random() * 4) + 2;
      const y = Math.floor(Math.random() * 2) + 1;
      choices.push({ text: '+1 🪖 Casco, +5 🛡️ Scudo', loot: [{k: 'repair_helmet', q: 1}], hp: 0, shield: 5, composto: 0 });
      choices.push({ text: '+2 🥼 Tuta, +1 🧪 Fluido', loot: [{k: 'repair_suit', q: 2}, {k: 'fluido', q: 1}], hp: 0, shield: 0, composto: 0 });
      choices.push({ text: '+50 🧫 Composto, +' + x + ' 🍪 Snack, +' + y + ' 🥾 Stivali', loot: [{k: 'snack', q: x}, {k: 'repair_boots', q: y}], hp: 0, shield: 0, composto: 50 });
    } else if (zone === 'A3') {
      const x = Math.floor(Math.random() * 4) + 2;
      const y = Math.floor(Math.random() * 2) + 1;
      const z = Math.floor(Math.random() * 6) + 5;
      choices.push({ text: '+6 🥼 Tuta, +10 🛡️ Scudo', loot: [{k: 'repair_suit', q: 6}], hp: 0, shield: 10, composto: 0 });
      choices.push({ text: '+6 🪖 Casco, +10 ❤️ HP, +10 🛡️ Scudo', loot: [{k: 'repair_helmet', q: 6}], hp: 10, shield: 10, composto: 0 });
      choices.push({ text: '+3 🥼 Tuta, +3 🪖 Casco, +1 🔫 Fucile, +2 🍪 Snack', loot: [{k: 'repair_suit', q: 3}, {k: 'repair_helmet', q: 3}, {k: 'repair_weapon', q: 1}, {k: 'snack', q: 2}], hp: 0, shield: 0, composto: 0 });
      choices.push({ text: '+50 🧫 Composto, +' + x + ' 🍪 Snack, +' + y + ' 🥾 Stivali, +' + z + ' 🧪 Fluidi', loot: [{k: 'snack', q: x}, {k: 'repair_boots', q: y}, {k: 'fluido', q: z}], hp: 0, shield: 0, composto: 50 });
    }
    state.activeMission.pendingChoices = choices;
    const listDiv = document.getElementById('explore-choice-list');
    listDiv.innerHTML = '';
    choices.forEach(function(c, idx) {
      listDiv.innerHTML += '<button onclick="Survival.selectExploreChoice(' + idx + ')" class="w-full text-left bg-slate-950 p-3 rounded-xl border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 transition active:scale-95 shadow-md flex items-center justify-between group"><span class="text-[11px] font-bold text-slate-200 group-hover:text-amber-400 transition-colors">' + c.text + '</span><span class="text-xs font-black text-amber-500">→</span></button>';
    });
    document.getElementById('mission-explore-choice-modal').classList.remove('hidden');
  };

  S.selectExploreChoice = function(index) {
    const c = state.activeMission.pendingChoices[index];
    if (!c) return;
    document.getElementById('mission-explore-choice-modal').classList.add('hidden');
    state.activeMission.pendingChoices = [];
    if (c.hp > 0) S.applyHealing(c.hp);
    if (c.shield > 0) {
      state.shield = Math.min(LEVEL[state.level - 1].maxShield, state.shield + c.shield);
    }
    if (c.composto > 0) {
      state.compostoOrganico += c.composto;
      state.activeMission.explorationLoot.composto += c.composto;
    }
    c.loot.forEach(function(i) {
      state.inventory[i.k] = (state.inventory[i.k] || 0) + i.q;
      state.activeMission.explorationLoot[i.k] += i.q;
    });
    state.activeMission.lastExploreResult = c.text;
    if (S.getBackpackWeight() > 200) S.openOverloadModal();
    else S.executeTurnEnd();
  };

  S.applyHealing = function(baseAmount) {
    let actual = baseAmount;
    if (state.statuses.some(function(s) { return s.id === '003'; })) {
      actual = Math.max(1, actual - 2);
    }
    state.hp = Math.min(LEVEL[state.level - 1].maxHp, state.hp + actual);
  };

  S.fireWeapon = function() {
    if (!state.inMission || state.activeMission.aliensRemaining <= 0) return;
    if (!state.bullets || state.bullets <= 0) return;
    state.bullets--;
    state.stats.shotsFired++;

    const hitRoll = Math.random() * 100;
    const hitFeedback = document.getElementById('combat-feedback-hit');
    const missFeedback = document.getElementById('combat-feedback-miss');
    const alienSprite = document.getElementById('combat-alien-sprite');
    if (hitRoll < 90) {
      state.activeMission.aliensRemaining--;
      state.activeMission.aliensKilled++;
      state.exp++;
      state.activeMission.expGained++;
      S.checkLevelUp();
      document.getElementById('combat-shot-status').innerHTML = '<span class="text-emerald-400 font-bold">OK 🎯</span>';
      hitFeedback.style.opacity = '1';
      setTimeout(function() { hitFeedback.style.opacity = '0'; }, 100);
      alienSprite.style.transform = 'scale(0.8) translateY(10px)';
      setTimeout(function() { alienSprite.style.transform = 'scale(1) translateY(0)'; }, 100);
      if (state.activeMission.aliensRemaining <= 0) {
        state.activeMission.aliensRemaining = 0;
        S.renderAll();
        return;
      }
    } else {
      document.getElementById('combat-shot-status').innerHTML = '<span class="text-amber-500 font-bold">KO 💨</span>';
      missFeedback.style.opacity = '1';
      setTimeout(function() { missFeedback.style.opacity = '0'; }, 100);
    }

    const zoneId = state.activeMission.zone;
    let dmg = (zoneId === 'A3' ? 2 : 1) * ZONES[zoneId].multiplier;
    const extraChance = zoneId === 'A1' ? 10 : (zoneId === 'A2' ? 12 : 15);
    if (Math.random() * 100 < extraChance) dmg += 1;

    let shieldDmg = 0;
    let healthDmg = 0;
    if (state.equipment.suit.val > 0) {
      dmg = Math.max(0, dmg - 1);
      state.equipment.suit.val -= 1;
      state.stats.ddLostSuit++;
      S.spawnFloatingDamage(1, 'suit');
    }
    if (dmg > 0) {
      if (state.shield > 0) {
        if (state.shield >= dmg) {
          state.shield -= dmg;
          shieldDmg = dmg;
        } else {
          shieldDmg = state.shield;
          const rem = dmg - state.shield;
          state.shield = 0;
          state.hp -= rem;
          healthDmg = rem;
        }
      } else {
        state.hp -= dmg;
        healthDmg = dmg;
      }
    }

    const container = document.getElementById('game-container');
    container.classList.add('animate-shake');
    setTimeout(function() { container.classList.remove('animate-shake'); }, 200);
    if (shieldDmg > 0) S.spawnFloatingDamage(shieldDmg, 'shield');
    if (healthDmg > 0) S.spawnFloatingDamage(healthDmg, 'hp');

    S.executeTurnEnd();
  };

  S.repeatLastMission = function() {
    if (state.inMission) return;
    if (state.lastMissionStats && state.lastMissionStats.zone && state.lastMissionStats.zone !== '0') {
      state.selectedZone = state.lastMissionStats.zone;
      S.startMission();
    }
  };

  S.cancelMissionAndGoHome = function() {
    if (state.inMission) return;
    state.selectedZone = '0';
    S.renderAll();
  };

  S.selectZone = function(zoneId) {
    if (state.inMission || state.city.currentLocation !== 'piazza') return;
    state.selectedZone = zoneId;
    S.renderAll();
  };

  S.checkLevelUp = function() {
    if (state.level >= 10) return;
    const currentStats = LEVEL[state.level - 1];
    if (state.exp >= currentStats.nextExp) {
      state.level++;
      state.exp = 0;
      const newStats = LEVEL[state.level - 1];
      state.hp = newStats.maxHp;
      state.shield = newStats.maxShield;
      S.showToast('🎉 LEVEL UP! Raggiunto il livello ' + state.level + '!', 'success');
      const container = document.getElementById('game-container');
      container.style.transition = 'background-color 0.1s ease';
      container.style.backgroundColor = 'rgba(16, 185, 129, 0.12)';
      setTimeout(function() { container.style.backgroundColor = 'transparent'; }, 250);
      S.checkLevelUp();
    }
  };

  S.handleMissionFailure = function() {
    const pStats = state.level > 1 ? LEVEL[state.level - 2] : { nextExp: 0 };
    const prog = state.exp - pStats.nextExp;
    let eLoss = 0;
    if (prog > 0) {
      eLoss = Math.floor(prog * 0.5);
      state.exp -= eLoss;
    }
    const cLoss = Math.floor(state.credits * 0.5);
    state.credits -= cLoss;
    state.hp = 1;
    state.shield = 0;
    state.aliens.A1 = 20;
    state.aliens.A2 = 50;
    state.aliens.A3 = '65 + X';
    state.lastMissionStats = {
      zone: state.activeMission.zone,
      credits: 0,
      exp: state.activeMission.expGained,
      aliens: state.activeMission.aliensKilled,
      success: false,
      premium: 0,
      composto: 0,
      expLoot: state.activeMission.explorationLoot
    };
    state.inMission = false;
    state.selectedZone = '0';
    S.clearAllStatuses();
    document.getElementById('failed-penal-exp').innerText = '-' + eLoss + ' EXP';
    document.getElementById('failed-penal-credits').innerText = '-' + cLoss + ' 🪙';
    document.getElementById('mission-failed-modal').classList.remove('hidden');
    document.getElementById('game-container').classList.add('animate-red-flash');
    setTimeout(function() { document.getElementById('game-container').classList.remove('animate-red-flash'); }, 1600);
  };

  S.rollEndMissionDrops = function(zoneId) {
    let drops = { snack: 0, fluido: 0, caricatore: 0, scatola: 0, repair_suit: 0, repair_helmet: 0, repair_boots: 0, repair_weapon: 0, premium: 0, battery_c: 0, book1: 0, book2: 0, book3: 0 };
    var roll = function(chance) { return Math.random() * 100 < chance; };

    if (zoneId === 'A1') {
      if (roll(25)) drops.snack += 1;
      if (roll(50)) drops.caricatore += 1;
      if (roll(20)) drops.repair_suit += 1;
      if (roll(3)) drops.scatola += 1;
      if (roll(1)) drops.premium += 2;
      if (roll(5) && !state.unlockedBooks.snackCap1) drops.book1 += 1;
    } else if (zoneId === 'A2') {
      if (roll(44)) drops.snack += 1;
      if (roll(18)) drops.fluido += 1;
      if (roll(65)) drops.caricatore += 1;
      if (roll(5)) drops.scatola += 1;
      if (roll(33)) drops.repair_suit += 2;
      if (roll(33)) drops.repair_helmet += 2;
      if (roll(8)) drops.repair_boots += 2;
      if (roll(5)) drops.battery_c += 1;
      if (roll(1)) drops.premium += 5;
      if (roll(5) && !state.unlockedBooks.repairCap1) drops.book2 += 1;
    } else if (zoneId === 'A3') {
      if (roll(35)) drops.snack += 2;
      if (roll(30)) drops.fluido += 1;
      if (roll(75)) drops.caricatore += 2;
      if (roll(10)) drops.scatola += 1;
      if (roll(45)) drops.repair_suit += 2;
      if (roll(45)) drops.repair_helmet += 2;
      if (roll(20)) drops.repair_boots += 2;
      if (roll(15)) drops.repair_weapon += 1;
      if (roll(5)) drops.battery_c += 1;
      if (roll(2)) drops.premium += 5;
      if (roll(5) && !state.unlockedBooks.rifleCap1) drops.book3 += 1;
    }
    return drops;
  };

  S.triggerCompleteMissionLoot = function() {
    if (!state.inMission || state.activeMission.aliensRemaining > 0) return;
    const zoneId = state.activeMission.zone;
    const d = S.rollEndMissionDrops(zoneId);
    state.activeMission.endMissionDrops = d;

    if (d.book1 > 0) { state.unlockedBooks.snackCap1 = true; state.stats.booksDropped++; }
    if (d.book2 > 0) { state.unlockedBooks.repairCap1 = true; state.stats.booksDropped++; }
    if (d.book3 > 0) { state.unlockedBooks.rifleCap1 = true; state.stats.booksDropped++; }

    state.activeMission.recapTriggered = true;
    S.renderAll();
  };

  S.acceptMissionRewards = function() {
    const zoneId = state.activeMission.zone;
    const d = state.activeMission.endMissionDrops;
    const kills = state.activeMission.aliensKilled;

    state.credits += ZONES[zoneId].reward;
    state.stats.creditsEarned += ZONES[zoneId].reward;
    
    if (d.premium > 0) state.liquidoPlusvalente += d.premium;
    let compGained = (zoneId === 'A1' ? 20 : (zoneId === 'A2' ? 40 : 80));
    let extraComp = kills * (Math.floor(Math.random() * 3) + 1);
    state.compostoOrganico += (compGained + extraComp);
    state.stats.compostoGained += (compGained + extraComp);

    const totalConsGained = d.snack + d.fluido + d.caricatore + d.scatola + d.repair_suit + d.repair_helmet + d.repair_boots + d.repair_weapon + d.battery_c;
    state.stats.consumablesGained += totalConsGained;

    const wasInMission = state.inMission;
    state.inMission = false;
    S.clearAllStatuses();

    ['snack', 'fluido', 'caricatore', 'scatola', 'repair_suit', 'repair_helmet', 'repair_boots', 'repair_weapon', 'battery_c'].forEach(function(k) {
      S.distributeItemToStorage(k, d[k]);
    });

    if (zoneId === 'A1') state.stats.missionsA1++;
    else if (zoneId === 'A2') state.stats.missionsA2++;
    else if (zoneId === 'A3') state.stats.missionsA3++;
    
    state.inMission = wasInMission;
    S.handleGlobalStreakUpdate(zoneId);
    state.aliens.A1 = 20;
    state.aliens.A2 = 50;
    state.aliens.A3 = '65 + X';

    state.lastMissionStats = {
      zone: zoneId,
      credits: ZONES[zoneId].reward,
      exp: state.activeMission.expGained,
      aliens: kills,
      success: true,
      premium: d.premium,
      composto: compGained + extraComp,
      expLoot: state.activeMission.explorationLoot,
      snack: d.snack, fluido: d.fluido, caricatore: d.caricatore,
      scatola: d.scatola, repair_suit: d.repair_suit, repair_helmet: d.repair_helmet,
      repair_boots: d.repair_boots, repair_weapon: d.repair_weapon,
      battery_c: d.battery_c, book1: d.book1, book2: d.book2, book3: d.book3
    };

    if (Object.values(state.excessItems).every(function(v) { return v === 0; })) {
      S.finalizeMissionExit();
    }
  };

  S.finalizeMissionExit = function() {
    state.inMission = false;
    state.selectedZone = '0';
    S.renderAll();
  };

  S.handleGlobalStreakUpdate = function(zoneId) {
    const c = state.consecutiveStreak;
    if (c.zone !== zoneId) {
      c.zone = zoneId;
      c.count = 1;
    } else {
      c.count++;
      if (c.count === 10) {
        state.liquidoPlusvalente += (zoneId === 'A1' ? 10 : (zoneId === 'A2' ? 15 : 20));
        state.stats.globalScores++;
        c.count = 0;
        c.zone = null;
      }
    }
  };

  S.addStatus = function(statusId) {
    const existingIdx = state.statuses.findIndex(function(s) { return s.id === statusId; });
    if (existingIdx !== -1) {
      S.executeStatusExpire(state.statuses[existingIdx].id);
      state.statuses.splice(existingIdx, 1);
    }
    if (state.statuses.length >= 15) return;
    
    const meta = S.STATUSES_METADATA[statusId];
    state.statuses.push({ id: statusId, remaining: meta.maxDuration, order: state.statuses.length + 1 });
    S.reorderStatuses();
    S.updateStatusesUI();
  };

  S.reorderStatuses = function() {
    state.statuses.forEach(function(s, idx) { s.order = idx + 1; });
  };

  S.processStatusesEndTurn = function() {
    var toProcess = state.statuses.slice().sort(function(a, b) { return a.order - b.order; });
    var anyRemoved = false;
    toProcess.forEach(function(s) {
      var actualStatus = state.statuses.find(function(x) { return x.id === s.id; });
      if (actualStatus) {
        actualStatus.remaining -= 1;
        if (actualStatus.remaining <= 0) {
          S.executeStatusExpire(actualStatus.id);
          state.statuses = state.statuses.filter(function(x) { return x.id !== actualStatus.id; });
          anyRemoved = true;
        }
      }
    });
    if (anyRemoved) S.reorderStatuses();
    S.updateStatusesUI();
  };

  S.executeStatusExpire = function(statusId) {
    if (statusId === '001') {
      const heal = Math.floor(Math.random() * 9) + 12;
      const maxHp = LEVEL[state.level - 1].maxHp;
      const maxShield = LEVEL[state.level - 1].maxShield;
      if (state.hp + heal > maxHp) {
        const excess = (state.hp + heal) - maxHp;
        state.hp = maxHp;
        state.shield = Math.min(maxShield, state.shield + excess);
      } else {
        state.hp += heal;
      }
      S.showToast('⛺ Riposo concluso: recuperati parametri vitali.', 'success');
    } else if (statusId === '002') {
      const zone = state.activeMission.zone;
      var meteoItem = zone === 'A1' ? 'meteo_a1' : (zone === 'A2' ? 'meteo_a2' : 'meteo_a3');
      S.distributeItemToStorage(meteoItem, 1);
      S.showToast('🎈 La sonda ha inviato i dati (' + meteoItem.replace('_', ' ').toUpperCase() + ')!', 'success');
    }
  };

  S.clearAllStatuses = function() {
    var toProcess = state.statuses.slice().sort(function(a, b) { return a.order - b.order; });
    toProcess.forEach(function(s) { S.executeStatusExpire(s.id); });
    state.statuses = [];
  };

  S.showLastMissionRecap = function() {
    const c = document.getElementById('last-mission-recap-content');
    const s = state.lastMissionStats;
    if (!s) {
      c.innerHTML = '<div class="text-slate-500 italic text-center text-[10px]">Nessun record di missione registrato in questa sessione.</div>';
    } else {
      const titleColor = s.success ? 'text-emerald-400 font-black' : 'text-rose-500 font-black';
      const titleText = s.success ? 'Missione Completata 🏆' : 'Missione non completata 💀';
      
      var expHtml = '';
      if (s.expLoot) {
        var html = '';
        var f = false;
        Object.keys(s.expLoot).forEach(function(k) {
          if (s.expLoot[k] > 0) {
            f = true;
            var name = k;
            if (ITEMS[k]) name = ITEMS[k].icon + ' ' + ITEMS[k].name;
            else if (k === 'composto') name = '🧫 Composto Organico';
            else if (k === 'credits') name = '🪙 Crediti';
            html += '<div>• ' + name + ': +' + s.expLoot[k] + '</div>';
          }
        });
        if (f) expHtml = '<div class="border-t border-slate-800/60 pt-2 mt-2"><span class="text-[9px] text-indigo-400 font-bold block mb-1">Bottini Esplorazione:</span><div class="flex flex-col gap-0.5 text-slate-300">' + html + '</div></div>';
      }
      
      var dropsHtml = '';
      if (s.success) {
        var h = '';
        var fd = false;
        ['snack','fluido','caricatore','scatola','repair_suit','repair_helmet','repair_boots','repair_weapon','battery_c','book1','book2','book3'].forEach(function(k) {
          if (s[k] > 0) {
            fd = true;
            var n = k;
            if (ITEMS[k]) n = ITEMS[k].icon + ' ' + ITEMS[k].name;
            else if (k === 'book1') n = '📖 Libro "I Segreti degli Snack - Cap. I"';
            else if (k === 'book2') n = '📖 Libro "I Segreti dei Riparatori - Cap. I"';
            else if (k === 'book3') n = '📖 Libro "I Segreti del Fucile - Cap. I"';
            h += '<div>• ' + n + ': +' + s[k] + '</div>';
          }
        });
        if (fd) dropsHtml = '<div class="border-t border-slate-800/60 pt-2 mt-2"><span class="text-[9px] text-slate-400 font-bold block mb-1">Loot Fine Sbarco:</span><div class="flex flex-col gap-0.5 text-slate-300">' + h + '</div></div>';
      }
      
      c.innerHTML = '<div class="text-center border-b border-slate-800 pb-2 mb-2"><span class="' + titleColor + ' text-xs uppercase tracking-wider">' + titleText + '</span><div class="text-[9px] text-slate-500 mt-0.5">Settore: ' + ZONES[s.zone].name + '</div></div><div class="space-y-1"><div class="flex justify-between"><span>Alieni Eliminati:</span><span class="text-rose-400 font-bold">' + s.aliens + '</span></div><div class="flex justify-between"><span>EXP Accumulata:</span><span class="text-amber-400 font-bold">+' + s.exp + '</span></div><div class="flex justify-between"><span>Crediti Riscossi:</span><span class="text-yellow-400 font-bold">' + (s.success ? '+' + s.credits + ' 🪙' : '0 🪙') + '</span></div><div class="flex justify-between"><span>Liquidi Plusvalenti:</span><span class="text-indigo-400 font-bold">' + (s.premium > 0 ? '+' + s.premium + ' 🪩' : '0 🪩') + '</span></div><div class="flex justify-between"><span>Composto Organico:</span><span class="text-emerald-400 font-bold">' + (s.composto > 0 ? '+' + s.composto + ' 🧫' : '0 🧫') + '</span></div>' + expHtml + dropsHtml + '</div>';
    }
    document.getElementById('last-mission-recap-modal').classList.remove('hidden');
  };

  S.openStatsModal = function() {
    state.stats.statViews++;
    const c = document.getElementById('stats-content-list');
    c.innerHTML = '';
    var r = function(k, v, cl) {
      return '<div class="flex justify-between py-1 border-b border-slate-800/50 text-slate-300"><span>' + k + ':</span><span class="' + cl + ' font-bold">' + v + '</span></div>';
    };
    const s = state.stats;
    c.innerHTML += r('Colpi sparati (K1)', s.shotsFired, 'text-emerald-400');
    c.innerHTML += r('Missioni A1 completate', s.missionsA1, 'text-indigo-400');
    c.innerHTML += r('Missioni A2 completate', s.missionsA2, 'text-indigo-400');
    c.innerHTML += r('Missioni A3 completate', s.missionsA3, 'text-indigo-400');
    c.innerHTML += r('Global Score ottenuti', s.globalScores, 'text-amber-400');
    c.innerHTML += r('Crediti guadagnati', s.creditsEarned, 'text-yellow-400');
    c.innerHTML += '<div class="flex justify-between py-1 border-b border-slate-800/50 text-slate-300 mt-2"><span class="font-bold text-slate-400 uppercase text-[8px] tracking-wider">Risorse & Interazioni</span></div>';
    c.innerHTML += r('Consumabili ottenuti', s.consumablesGained, 'text-emerald-400');
    c.innerHTML += r('Consumabili usati', s.consumablesUsed, 'text-rose-400');
    c.innerHTML += r('Tasche configurate', s.pocketsAssigned, 'text-indigo-400');
    c.innerHTML += r('Visite Spazi Cittadini', s.cityVisits, 'text-emerald-400');
    c.innerHTML += r('Dd Casco erosi', s.ddLostHelmet, 'text-rose-400');
    c.innerHTML += r('Dd Tuta erosi', s.ddLostSuit, 'text-rose-400');
    c.innerHTML += r('Dd totali ripristinati', s.ddRestored, 'text-emerald-400');
    document.getElementById('stats-modal').classList.remove('hidden');
  };
})();