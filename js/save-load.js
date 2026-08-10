// js/save-load.js
(function() {
  window.Survival = window.Survival || {};
  const S = window.Survival;
  const state = S.state;
  const COOLDOWN_TARGETS = S.COOLDOWN_TARGETS;

  // ============================================
  // GENERATE SAVE CODE
  // ============================================
  S.generateSaveCode = function() {
    if (state.inMission) {
      S.showToast('Non puoi salvare durante una missione!', 'error');
      return;
    }
    
    try {
      const now = Date.now();
      var getEl = function(k) {
        const c = state.cooldowns[k];
        return c.start === 0 ? COOLDOWN_TARGETS[k] : Math.min(c.target, Math.floor(((now - c.start) / 1000) * c.rate));
      };
      
      const savedCDs = {
        regen: { elapsed: getEl('regen'), rate: state.cooldowns.regen.rate },
        refill: { elapsed: getEl('refill'), rate: state.cooldowns.refill.rate },
        research: { elapsed: getEl('research'), rate: state.cooldowns.research.rate }
      };
      
      const saveData = {
        level: state.level,
        exp: state.exp,
        credits: state.credits,
        liquido: state.liquidoPlusvalente,
        compostoOrganico: state.compostoOrganico || 0,
        frammenti: state.frammenti || 0,
        hp: state.hp,
        shield: state.shield,
        bullets: state.bullets,
        selectedZone: state.selectedZone,
        aliens: state.aliens,
        inventory: state.inventory,
        stiva: state.stiva,
        equipment: state.equipment,
        unlockedBooks: state.unlockedBooks,
        researchProgress: state.researchProgress,
        techUnlocked: state.techUnlocked,
        consecutiveStreak: state.consecutiveStreak,
        synthesis: state.synthesis,
        backpackOrder: state.backpackOrder,
        stivaOrder: state.stivaOrder,
        cooldownsState: savedCDs,
        lastMissionStats: state.lastMissionStats,
        stats: state.stats,
        pockets: state.pockets,
        city: state.city,
        usedRegenSinceLastMission: state.usedRegenSinceLastMission
      };
      
      document.getElementById('save-code-output').value = btoa(unescape(encodeURIComponent(JSON.stringify(saveData))));
      document.getElementById('save-code-box').classList.remove('hidden');
      S.showToast('📋 Salvataggio generato!', 'success');
    } catch (err) {
      console.error(err);
      S.showToast('Errore durante il salvataggio!', 'error');
    }
  };

  // ============================================
  // COPY TO CLIPBOARD
  // ============================================
  S.copySaveToClipboard = function() {
    const output = document.getElementById('save-code-output');
    output.select();
    try {
      document.execCommand('copy');
      S.showToast('📋 Copiato negli appunti!', 'success');
    } catch (err) {
      S.showToast('Errore durante la copia!', 'error');
    }
  };

  // ============================================
  // LOAD SAVE CODE
  // ============================================
  S.loadSaveCode = function() {
    if (state.inMission) {
      S.showToast('Non puoi caricare durante una missione!', 'error');
      return;
    }
    
    const input = document.getElementById('load-code-input').value.trim();
    if (!input) {
      S.showToast('Inserisci un codice di salvataggio!', 'error');
      return;
    }
    
    try {
      const d = JSON.parse(decodeURIComponent(escape(atob(input))));
      if (typeof d.level !== 'number') throw new Error('Formato non valido');
      
      // Carica stato base
      state.level = d.level;
      state.exp = d.exp;
      state.credits = d.credits;
      state.liquidoPlusvalente = d.liquido || 0;
      state.compostoOrganico = d.compostoOrganico || 0;
      state.frammenti = d.frammenti || 0;
      state.hp = d.hp;
      state.shield = d.shield;
      state.bullets = (d.bullets != null) ? d.bullets : 300;
      state.selectedZone = d.selectedZone || '0';
      state.aliens = d.aliens;
      
      // Carica inventari
      state.inventory = { ...state.inventory, ...d.inventory };
      state.stiva = { ...state.stiva, ...d.stiva };
      
      // Carica equipaggiamento
      state.equipment = { ...state.equipment, ...d.equipment };
      
      // Carica libri e ricerca
      state.unlockedBooks = d.unlockedBooks || { snackCap1: false, repairCap1: false, rifleCap1: false };
      state.researchProgress = d.researchProgress || 0;
      state.techUnlocked = d.techUnlocked || false;
      
      // Carica streak
      state.consecutiveStreak = d.consecutiveStreak || { zone: null, count: 0 };
      
      // Carica sintesi
      state.synthesis = d.synthesis || state.synthesis;
      
      // Carica ultima missione
      state.lastMissionStats = d.lastMissionStats || null;
      
      // Carica pockets e city
      state.pockets = { ...state.pockets, ...(d.pockets || {}) };
      state.city = { ...state.city, ...(d.city || {}) };
      state.usedRegenSinceLastMission = d.usedRegenSinceLastMission || false;
      
      // Carica statistiche
      state.stats = { ...state.stats, ...(d.stats || {}) };
      
      // Carica cooldown
      const now = Date.now();
      const cds = d.cooldownsState || {
        regen: { elapsed: 120, rate: 1 },
        refill: { elapsed: 6, rate: 1 },
        research: { elapsed: 50, rate: 1 }
      };
      
      var resCD = function(k, s) {
        if (s.elapsed < COOLDOWN_TARGETS[k]) {
          state.cooldowns[k].rate = s.rate || 1;
          state.cooldowns[k].target = COOLDOWN_TARGETS[k];
          state.cooldowns[k].start = now - (s.elapsed / state.cooldowns[k].rate) * 1000;
        } else {
          state.cooldowns[k].start = 0;
          state.cooldowns[k].rate = 1;
        }
      };
      
      resCD('regen', cds.regen);
      resCD('refill', cds.refill);
      resCD('research', cds.research);
      
      // Reset missione attiva
      state.inMission = false;
      
      // Pulisci input
      document.getElementById('load-code-input').value = '';
      
      S.showToast('📥 Salvataggio caricato!', 'success');
      S.renderAll();
      S.switchTab('mappa');
    } catch (err) {
      console.error(err);
      S.showToast('⚠️ Codice non valido!', 'error');
    }
  };
})();
