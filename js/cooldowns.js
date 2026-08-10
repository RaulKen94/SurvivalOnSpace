// js/cooldowns.js
(function() {
  window.Survival = window.Survival || {};
  const S = window.Survival;
  const state = S.state;
  const LEVEL = S.LEVEL_THRESHOLDS;
  const COOLDOWN_TARGETS = S.COOLDOWN_TARGETS;

  // ============================================
  // REGEN
  // ============================================
  S.triggerRegen = function(type) {
    if (state.inMission || state.selectedZone !== '0') return;
    if (state.cooldowns.regen.start !== 0) return;
    
    if (type === 'fast') {
      if (state.liquidoPlusvalente < 2) {
        S.showToast('🪩 Liquido Plusvalente insufficiente!', 'error');
        return;
      }
      state.liquidoPlusvalente -= 2;
      state.cooldowns.regen.rate = 3;
    } else {
      state.cooldowns.regen.rate = 1;
    }
    
    state.stats.regenUsed++;
    state.cooldowns.regen.start = Date.now();
    state.cooldowns.regen.target = COOLDOWN_TARGETS.regen;
    
    document.getElementById('regen-bar-container').classList.remove('hidden');
    document.getElementById('regen-cooldown-text').classList.remove('hidden');
    document.getElementById('regen-actions').classList.add('hidden');
    S.renderAll();
  };

  // ============================================
  // REFILL
  // ============================================
  S.triggerRefill = function() {
    if (state.inMission || state.selectedZone !== '0') return;
    if (state.cooldowns.refill.start !== 0) return;
    
    state.stats.refillUsed++;
    state.stats.consumablesGained += 2;
    S.distributeItemToStorage('snack', 1);
    S.distributeItemToStorage('scatola', 1);
    
    state.cooldowns.refill.start = Date.now();
    state.cooldowns.refill.rate = 1;
    state.cooldowns.refill.target = COOLDOWN_TARGETS.refill;
    
    document.getElementById('refill-bar-container').classList.remove('hidden');
    document.getElementById('refill-cooldown-text').innerHTML = 'Attesa...';
    S.renderAll();
  };

  // ============================================
  // UPDATE COOLDOWN BUTTONS
  // ============================================
  S.updateCooldownButtons = function() {
    const now = Date.now();
    
    // REGEN
    const regen = state.cooldowns.regen;
    if (regen.start !== 0) {
      const p = Math.floor(((now - regen.start) / 1000) * regen.rate);
      if (p >= regen.target) {
        regen.start = 0;
        regen.rate = 1;
        const s = LEVEL[state.level - 1];
        state.hp = s.maxHp;
        state.shield = s.maxShield;
        state.usedRegenSinceLastMission = true;
        document.getElementById('regen-bar-container').classList.add('hidden');
        document.getElementById('regen-cooldown-text').classList.add('hidden');
        document.getElementById('regen-actions').classList.remove('hidden');
        S.renderAll();
      } else {
        document.getElementById('regen-cooldown-text').innerHTML = p + ' / ' + regen.target + 's';
        document.getElementById('regen-bar').style.width = Math.min(100, (p / regen.target) * 100) + '%';
      }
    }
    
    // REFILL
    const refill = state.cooldowns.refill;
    if (refill.start !== 0) {
      const p = Math.floor(((now - refill.start) / 1000) * refill.rate);
      if (p >= refill.target) {
        refill.start = 0;
        document.getElementById('refill-bar-container').classList.add('hidden');
        document.getElementById('refill-cooldown-text').innerHTML = 'Pronto';
        S.renderAll();
      } else {
        document.getElementById('refill-cooldown-text').innerHTML = p + ' / ' + refill.target + 's';
        document.getElementById('refill-bar').style.width = Math.min(100, (p / refill.target) * 100) + '%';
      }
    }
  };
})();
