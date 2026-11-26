// js/combat.js
(function () {
  'use strict';

  var S = (window.Survival = window.Survival || {});

  function startSelectedMission() {
    if (S.state.mission.active) {
      return { ok: false, message: 'Una missione è già in corso.' };
    }
    var diff = S.toInt(S.state.mission.selectedDifficulty, 0);
    if (diff <= 0) {
      return { ok: false, message: 'Seleziona prima una difficoltà dalla Mappa.' };
    }
    var planet = S.getPlanet(S.state.player.planetId);
    var missionCfg = planet.missions[diff];
    var unlockCheck = S.isMissionUnlocked(planet.id, diff);
    if (!missionCfg || !unlockCheck.unlocked) {
      return { ok: false, message: unlockCheck.reason || 'Missione non disponibile.' };
    }
    if (S.state.player.hp <= 0) {
      return { ok: false, message: 'Vita insufficiente per partire in missione.' };
    }

    var aliensTotal = missionCfg.aliensMin === missionCfg.aliensMax
      ? missionCfg.aliensMin
      : S.randomInt(missionCfg.aliensMin, missionCfg.aliensMax);

    S.state.mission = {
      active: true,
      selectedDifficulty: diff,
      planetId: planet.id,
      turn: 0,
      aliensTotal: aliensTotal,
      aliensLeft: aliensTotal,
      completedReady: false,
      expGained: 0,
      shotsFired: 0,
      damageTaken: 0,
      levelsGained: 0,
      statuses: [],
      weather: null,
      lastShot: null
    };
    S.state.ui.activeTab = 'mission';
    S.notifyUI();
    return { ok: true };
  }

  function applyDamageToPlayer(rawDamage) {
    var dmg = Math.max(0, S.toInt(rawDamage, 0));
    var shieldAbsorbed = Math.min(S.state.player.shield, dmg);
    var hpLost = dmg - shieldAbsorbed;

    S.state.player.shield -= shieldAbsorbed;
    S.state.player.hp = Math.max(0, S.state.player.hp - hpLost);
    S.state.mission.damageTaken += dmg;

    return {
      damage: dmg,
      shieldAbsorbed: shieldAbsorbed,
      hpLost: hpLost
    };
  }

  function triggerMissionDefeat(planet, missionCfg) {
    var expLost = Math.floor((S.state.player.exp * S.COMBAT_RULES.deathExpLossPct) / 100);
    var creditsLost = Math.floor((S.state.player.credits * S.COMBAT_RULES.deathCreditsLossPct) / 100);
    S.state.player.exp = Math.max(0, S.state.player.exp - expLost);
    S.state.player.credits = Math.max(0, S.state.player.credits - creditsLost);

    var lvData = S.getLevelData(S.state.player.level);
    S.state.player.hp = Math.min(S.COMBAT_RULES.deathRespawnHp, lvData.maxHp);
    S.state.player.shield = S.COMBAT_RULES.deathRespawnShield;
    S.state.stats.deaths += 1;

    var summary = {
      planetName: planet.name,
      difficulty: missionCfg.difficulty,
      missionName: missionCfg.name,
      turn: S.state.mission.turn,
      aliensKilled: S.state.mission.aliensTotal - S.state.mission.aliensLeft,
      aliensTotal: S.state.mission.aliensTotal,
      expLost: expLost,
      creditsLost: creditsLost,
      respawnHp: S.state.player.hp
    };

    S.state.mission = S.createEmptyMissionState();
    S.state.ui.activeTab = 'ship';
    S.notifyUI();
    return { ok: true, outcome: 'death', summary: summary };
  }

  // Fase 1: Risoluzione Status (struttura pronta per status futuri in Step 4/5)
  function resolveStatusPhase() {
    var list = S.state.mission.statuses;
    if (!Array.isArray(list) || list.length === 0) {
      return { applied: 0 };
    }
    return { applied: 0 };
  }

  // Fase 2: Risoluzione Meteo (danni meteo, Dd Casco Spaziale e nuovi status in Step 4)
  function resolveWeatherPhase() {
    var weather = S.state.mission.weather;
    if (!weather) {
      return { applied: false, damage: 0 };
    }
    return { applied: false, damage: 0 };
  }

  // Fase 3: Risoluzione Danni Combattimento (scudi, vita, Dd Tuta Spaziale, eventuali status futuri)
  function resolveCombatDamagePhase(planet, missionCfg) {
    var rawDmg = Math.max(0, S.toInt(missionCfg.enemyDamage, 1));
    var suitInst = S.state.equipment.equipped.suit;
    var suitRed = 0;

    if (suitInst && suitInst.dd > 0) {
      var suitModel = S.EQUIP_MODELS[suitInst.modelId];
      suitRed = suitModel ? Math.max(0, S.toInt(suitModel.score, 0)) : 0;
      suitInst.dd = Math.max(0, suitInst.dd - 1);
    }

    var finalDmg = Math.max(0, rawDmg - suitRed);
    var dmgRes = applyDamageToPlayer(finalDmg);

    return {
      damage: finalDmg,
      shieldAbsorbed: dmgRes.shieldAbsorbed,
      hpLost: dmgRes.hpLost,
      suitReduced: suitRed
    };
  }

  // Fase 4: Risoluzione di incremento del turno
  function resolveTurnIncrementPhase() {
    S.state.mission.turn += 1;
  }

  // Fase 5: Risoluzione del Colpo (Check JustTanked + precisione con 8,3% miss)
  function resolveShotPhase(planet, missionCfg) {
    if (S.state.player.hp <= 0) {
      return triggerMissionDefeat(planet, missionCfg);
    }

    var missPermille = S.toInt(S.COMBAT_RULES.missChancePermille, 83);
    var isMiss = S.randomInt(1, 1000) <= missPermille;

    if (isMiss) {
      S.state.mission.lastShot = {
        turn: S.state.mission.turn,
        hit: false,
        expAdded: 0,
        leveledUp: false,
        newLevel: S.state.player.level
      };
      S.notifyUI();
      return {
        ok: true,
        outcome: 'miss',
        hit: false,
        leveledUp: false,
        newLevel: S.state.player.level
      };
    }

    S.state.mission.aliensLeft = Math.max(0, S.state.mission.aliensLeft - 1);
    S.state.stats.aliensKilled += 1;

    var expRes = S.addExp(S.COMBAT_RULES.expPerAlien);
    S.state.mission.expGained += expRes.expAdded;
    S.state.mission.levelsGained += expRes.levelsGained;

    S.state.mission.lastShot = {
      turn: S.state.mission.turn,
      hit: true,
      expAdded: expRes.expAdded,
      leveledUp: expRes.leveledUp,
      newLevel: expRes.newLevel
    };

    if (S.state.mission.aliensLeft === 0) {
      S.state.mission.completedReady = true;
      S.notifyUI();
      return {
        ok: true,
        outcome: 'ready_complete',
        hit: true,
        leveledUp: expRes.leveledUp,
        newLevel: expRes.newLevel
      };
    }

    S.notifyUI();
    return {
      ok: true,
      outcome: 'continue',
      hit: true,
      leveledUp: expRes.leveledUp,
      newLevel: expRes.newLevel
    };
  }

  function shootAlien() {
    if (!S.state.mission.active) {
      return { ok: false, message: 'Nessuna missione attiva.' };
    }
    if (S.state.mission.completedReady) {
      return { ok: false, message: 'Tutti gli alieni sono stati eliminati: premi Completa Missione.' };
    }
    if (S.state.backpack.ammo <= 0) {
      return { ok: false, message: 'Munizioni esaurite! Usa un caricatore o tenta la fuga.' };
    }

    var planet = S.getPlanet(S.state.mission.planetId || S.state.player.planetId);
    var missionCfg = planet.missions[S.state.mission.selectedDifficulty];
    if (!missionCfg) {
      return { ok: false, message: 'Configurazione missione non trovata.' };
    }

    S.state.backpack.ammo -= 1;
    S.state.stats.shotsFired += 1;
    S.state.mission.shotsFired += 1;

    resolveStatusPhase(planet, missionCfg);
    resolveWeatherPhase(planet, missionCfg);
    resolveCombatDamagePhase(planet, missionCfg);
    resolveTurnIncrementPhase();
    return resolveShotPhase(planet, missionCfg);
  }

  function attemptEscape() {
    if (!S.state.mission.active || S.state.mission.completedReady) {
      return { ok: false, message: 'Nessuna fuga disponibile in questo stato.' };
    }
    if (S.state.backpack.ammo > 0) {
      return { ok: false, message: 'Puoi tentare la fuga solo quando le munizioni sono a 0.' };
    }

    var planet = S.getPlanet(S.state.mission.planetId || S.state.player.planetId);
    var missionCfg = planet.missions[S.state.mission.selectedDifficulty];
    var roll = S.randomInt(1, 20);

    if (roll >= S.COMBAT_RULES.escapeRollTarget) {
      var expLost = Math.floor((S.state.player.exp * S.COMBAT_RULES.escapeExpLossPct) / 100);
      S.state.player.exp = Math.max(0, S.state.player.exp - expLost);
      S.state.stats.escapes += 1;

      var summary = {
        planetName: planet.name,
        difficulty: missionCfg.difficulty,
        missionName: missionCfg.name,
        roll: roll,
        turn: S.state.mission.turn,
        expLost: expLost
      };

      S.state.mission = S.createEmptyMissionState();
      S.state.ui.activeTab = 'ship';
      S.notifyUI();
      return { ok: true, outcome: 'escaped', summary: summary };
    }

    var combatRes = resolveCombatDamagePhase(planet, missionCfg);
    resolveTurnIncrementPhase();
    if (S.state.player.hp <= 0) {
      return triggerMissionDefeat(planet, missionCfg);
    }
    S.notifyUI();
    return {
      ok: true,
      outcome: 'escape_failed',
      roll: roll,
      damage: combatRes.damage
    };
  }

  function completeMission() {
    if (!S.state.mission.active || !S.state.mission.completedReady || S.state.mission.aliensLeft > 0) {
      return { ok: false, message: 'La missione non è ancora pronta per il completamento.' };
    }

    var planet = S.getPlanet(S.state.mission.planetId || S.state.player.planetId);
    var diff = S.state.mission.selectedDifficulty;
    var missionCfg = planet.missions[diff];
    if (!missionCfg) {
      return { ok: false, message: 'Configurazione missione non trovata.' };
    }

    var creditsEarned = Math.max(0, S.toInt(missionCfg.creditsReward, 0));
    S.state.player.credits += creditsEarned;
    S.state.stats.creditsEarned += creditsEarned;
    S.state.stats.missionsWon[diff] = S.toInt(S.state.stats.missionsWon[diff], 0) + 1;

    // Estrazione drop (prepara bozza interattiva in pendingLoot)
    var rolledItems = [];
    var rolledEquips = [];
    var table = missionCfg.dropTable || [];
    var i, entry, roll;
    for (i = 0; i < table.length; i += 1) {
      entry = table[i];
      roll = S.randomInt(1, 100);
      if (roll > S.toInt(entry.chance, 0)) {
        continue;
      }
      var qty = Math.max(1, S.toInt(entry.qty, 1));
      if (entry.kind === 'equip') {
        var eqModel = S.EQUIP_MODELS[entry.id];
        if (eqModel) {
          var uid = S.formatUid(S.state.equipment.nextUid);
          S.state.equipment.nextUid += 1;
          var slotMeta = S.EQUIP_SLOTS[eqModel.slot];
          rolledEquips.push({
            kind: 'equip',
            id: eqModel.id,
            uid: uid,
            name: eqModel.name,
            slot: eqModel.slot,
            icon: slotMeta && slotMeta.icon ? slotMeta.icon : '',
            maxDd: eqModel.maxDd,
            weight: 0,
            qty: 1
          });
        }
      } else {
        var itemDef = S.ITEMS[entry.id];
        if (itemDef) {
          rolledItems.push({
            kind: 'item',
            id: itemDef.id,
            name: itemDef.name,
            icon: itemDef.icon || '',
            weight: S.toInt(itemDef.weight, 0),
            qty: qty
          });
        }
      }
    }

    // Aggiornamento Global Score (10/10 stessa difficoltà e pianeta; cambio difficoltà azzera)
    var gsKey = planet.id + '_' + diff;
    if (S.state.globalScore.activeKey !== gsKey) {
      S.state.globalScore.activeKey = gsKey;
      S.state.globalScore.streak = 1;
    } else {
      S.state.globalScore.streak += 1;
    }

    var streakShown = S.state.globalScore.streak;
    var gsCompleted = false;
    var gsReward = null;
    if (S.state.globalScore.streak >= S.GLOBAL_SCORE_TARGET) {
      gsCompleted = true;
      gsReward = missionCfg.globalScoreReward || { liquids: 1, credits: 100 };
      var bonusLiq = Math.max(0, S.toInt(gsReward.liquids, 0));
      var bonusCr = Math.max(0, S.toInt(gsReward.credits, 0));
      S.state.player.liquids += bonusLiq;
      S.state.stats.liquidsEarned += bonusLiq;
      S.state.player.credits += bonusCr;
      S.state.stats.creditsEarned += bonusCr;
      S.state.globalScore.streak = 0;
    }

    var draft = S.createPendingLootDraft(rolledItems, rolledEquips);
    S.state.pendingLoot = draft;

    var recap = {
      planetId: planet.id,
      planetName: planet.name,
      difficulty: diff,
      missionName: missionCfg.name,
      turns: S.state.mission.turn,
      aliensKilled: S.state.mission.aliensTotal,
      shotsFired: S.state.mission.shotsFired,
      expGained: S.state.mission.expGained,
      levelsGained: S.state.mission.levelsGained,
      damageTaken: S.state.mission.damageTaken,
      creditsEarned: creditsEarned,
      interactiveLoot: true,
      drops: S.buildDropsSummaryFromDraft(draft),
      globalScore: {
        key: gsKey,
        streakShown: streakShown,
        streakAfter: S.state.globalScore.streak,
        target: S.GLOBAL_SCORE_TARGET,
        completed: gsCompleted,
        reward: gsReward
      }
    };

    S.state.lastMissionRecap = recap;
    S.state.mission = S.createEmptyMissionState();
    S.state.ui.activeTab = 'mission';
    S.notifyUI();
    return { ok: true, recap: recap };
  }

  S.startSelectedMission = startSelectedMission;
  S.shootAlien = shootAlien;
  S.attemptEscape = attemptEscape;
  S.completeMission = completeMission;
})();
