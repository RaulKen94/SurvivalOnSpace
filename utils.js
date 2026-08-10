// js/utils.js
(function() {
  window.Survival = window.Survival || {};
  const S = window.Survival;
  const state = S.state;

  S.generateUUID = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0,
          v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  S.showToast = function(message, type) {
    type = type || 'info';
    const toast = document.getElementById('notification-toast');
    toast.innerText = message;
    toast.className = 'fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xl transition-all duration-300 pointer-events-none ';
    
    if (type === 'error') toast.className += 'bg-rose-950 border border-rose-500/50 text-rose-300';
    else if (type === 'success') toast.className += 'bg-emerald-950 border border-emerald-500/50 text-emerald-300';
    else toast.className += 'bg-slate-900 border border-slate-700 text-slate-100';
    
    toast.style.opacity = '1';
    toast.style.transform = 'translate(-50%, 0)';
    
    setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%, -20px)';
    }, 3500);
  };

  S.spawnFloatingDamage = function(amount, type) {
    const container = document.getElementById('damage-indicator-container');
    if (!container) return;
    
    const indicator = document.createElement('div');
    indicator.className = 'absolute text-sm font-black animate-bounce-up pointer-events-none drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.8)] z-50 flex items-center gap-1';
    
    if (type === 'shield') indicator.innerHTML = '<span class="text-cyan-400">-' + amount + ' 🛡️</span>';
    else if (type === 'suit') indicator.innerHTML = '<span class="text-blue-400">-1 🔵</span>';
    else if (type === 'helmet_acid') indicator.innerHTML = '<span class="text-purple-400">-' + amount + ' 🪖/❤️</span>';
    else indicator.innerHTML = '<span class="text-rose-500">-' + amount + ' ❤️</span>';
    
    indicator.style.left = (Math.floor(Math.random() * 20) + 40) + '%';
    indicator.style.top = '40%';
    container.appendChild(indicator);
    
    setTimeout(function() { indicator.remove(); }, 1000);
  };

  S.getBackpackWeight = function() {
    let w = 0;
    const items = S.ITEMS_METADATA;
    Object.keys(state.inventory).forEach(function(key) {
      if (items[key]) w += state.inventory[key] * items[key].weight;
    });
    return w;
  };

  S.getBackpackAmmoWeight = function() {
    return Math.ceil((state.bullets || 0) / 10);
  };

  S.getStivaWeight = function() {
    let w = 0;
    const items = S.ITEMS_METADATA;
    Object.keys(state.stiva).forEach(function(key) {
      if (key !== 'bullets' && items[key]) w += state.stiva[key] * items[key].weight;
    });
    return w;
  };

  S.getStivaMaxCapacity = function() {
    return state.techUnlocked ? 350 : 200;
  };

  S.getPocketBonusValue = function(itemKey) {
    if (state.pockets.p1.item === itemKey) return 1;
    if (state.pockets.p2.item === itemKey) return 2;
    return 0;
  };
})();