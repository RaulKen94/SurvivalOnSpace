// js/main.js — Bootstrap & Router degli eventi UI
(function () {
  'use strict';

  var S = (window.Survival = window.Survival || {});
  var U = (S.ui = S.ui || {});

  var initialized = false;
  var cooldownTimerId = null;

  function handleTabBarClick(e) {
    var btn = e.target.closest('.tab-btn');
    if (!btn) {
      return;
    }
    var tabId = btn.getAttribute('data-tab');
    var res = S.setActiveTab(tabId);
    if (!res.ok) {
      U.showToast(res.message, 'err');
    } else {
      S.uiState.importFeedback = { text: '', ok: true };
      S.uiState.renameFeedback = { text: '', ok: true };
      S.uiState.transferPicker = null;
      U.renderActiveTab();
    }
  }

  function handleContentClick(e) {
    if (U.handleMapMissionClick(e)) {
      return;
    }
    if (U.handleInventoryAreaClick(e)) {
      return;
    }
    if (U.handleShipClick(e)) {
      return;
    }
    U.handleOptionsClick(e);
  }

  function handleModalBodyClick(e) {
    if (U.handleInventoryAreaClick(e)) {
      return;
    }
    if (U.handleLootModalClick(e)) {
      return;
    }

    var pickBtn = e.target.closest('[data-repair-pick]');
    if (pickBtn) {
      var parts = pickBtn.getAttribute('data-repair-pick').split('|');
      var repRes = S.useItem(parts[0], parts[1], parts[2]);
      U.closeModal();
      U.showToast(repRes.message, repRes.ok ? 'ok' : 'err');
      return;
    }

    var sellConfirmBtn = e.target.closest('[data-confirm-sell-uid]');
    if (sellConfirmBtn) {
      var uid = sellConfirmBtn.getAttribute('data-confirm-sell-uid');
      var sellRes = S.sellStorageEquip(uid);
      U.closeModal();
      U.showToast(sellRes.message, sellRes.ok ? 'ok' : 'err');
    }
  }

  function initUI() {
    if (initialized) {
      return;
    }
    initialized = true;

    var tabBar = document.getElementById('tab-bar');
    var content = document.getElementById('tab-content');
    var modalBody = document.getElementById('modal-body');
    var modalCloseBtn = document.getElementById('modal-close-btn');

    if (tabBar) {
      tabBar.addEventListener('click', handleTabBarClick);
    }
    if (content) {
      content.addEventListener('click', handleContentClick);
      content.addEventListener('input', U.handleInventoryAreaInput);
    }
    if (modalBody) {
      modalBody.addEventListener('click', handleModalBodyClick);
      modalBody.addEventListener('input', U.handleInventoryAreaInput);
      modalBody.addEventListener('dragstart', U.handleModalDragStart);
      modalBody.addEventListener('dragover', U.handleModalDragOver);
      modalBody.addEventListener('dragleave', U.handleModalDragLeave);
      modalBody.addEventListener('drop', U.handleModalDrop);
      modalBody.addEventListener('dragend', U.handleModalDragEnd);
    }
    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', U.closeModal);
    }

    if (!cooldownTimerId) {
      cooldownTimerId = setInterval(U.refreshCooldownElements, 1000);
    }

    S.onStateChange(U.render);
  }

  function init() {
    if (!S.state) {
      S.state = S.createInitialState();
    }
    initUI();
    S.notifyUI();
  }

  U.init = initUI;
  S.init = init;

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
})();
