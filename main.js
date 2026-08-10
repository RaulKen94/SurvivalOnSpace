// js/main.js
(function() {
  window.Survival = window.Survival || {};
  const S = window.Survival;
  const state = S.state;
  const LEVEL = S.LEVEL_THRESHOLDS;

  function initGame() {
    const startStats = LEVEL[state.level - 1];
    state.hp = state.hp || startStats.maxHp;
    state.shield = state.shield || startStats.maxShield;
    state.bullets = state.bullets || 300;
    
    // Inizializza tutti gli event listeners
    S.initEvents();
    
    // Render iniziale
    S.renderAll();
    
    // Avvia il loop dei cooldown
    setInterval(function() {
      S.updateCooldownButtons();
    }, 1000);
    
    console.log('🚀 Survival on Space v3.0.3 - Inizializzato!');
  }

  // Avvia quando il DOM è pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
  } else {
    initGame();
  }
})();