# FILE_MAP.md — Architettura, File e Dipendenze (`Survival On Space`)

> **Riferimento operativo prioritario**: prima di progettare o modificare codice, consulta questo file per individuare subito il modulo esatto, le sue dipendenze e gli eventi DOM posseduti. Aggiornalo nello stesso commit ogni volta che crei, sposti o modifichi responsabilità o API pubbliche.

---

## 1. Regole Architetturali del Progetto

- **Stack puro**: HTML + CSS + JavaScript ES5/ES6 vanilla — **nessun bundler**, **nessun ES module** (`import`/`export` vietati).
- **Pattern IIFE obbligatorio**: ogni script usa `(function () { 'use strict'; ... })();` e legge/espone su `window.Survival` (`S`) e `window.Survival.ui` (`U`), con stato UI condiviso in `S.uiState`.
- **Zero salvataggi automatici/online**: vietati `localStorage` e `sessionStorage`. Solo codici manuali `SOS1` (`S.SAVE_PREFIX`) retrocompatibili.
- **Matematica 100% intera**: nessun numero decimale nei calcoli o nei display (`toInt`, `clampInt`, millesimi per probabilità tipo `83` = `8,3%`).
- **Percorso CSS**: `CSS/style.css` (`CSS/` maiuscolo per compatibilità case-sensitive su GitHub Pages).

---

## 2. Ordine di Caricamento (`index.html`) e Grafo Dipendenze

Gli `<script>` devono restare esattamente in quest'ordine in `index.html`:

```text
 1. js/config.js      (nessuna dipendenza — definisce costanti e dati statici)
 2. js/state.js       <- config
 3. js/save.js        <- config, state
 4. js/inventory.js   <- config, state
 5. js/loot.js        <- config, state, inventory
 6. js/combat.js      <- config, state, loot
 7. js/ui-core.js     <- config, state, inventory (+ chiama U.render* e U.refreshRecapModal)
 8. js/ui-ship.js     <- config, state, inventory, ui-core, ui-loot
 9. js/ui-mission.js  <- config, state, inventory, combat, ui-core, ui-ship, ui-loot
10. js/ui-loot.js     <- config, state, loot, ui-core
11. js/ui-options.js  <- config, state, save, inventory, ui-core
12. js/main.js        <- tutti i moduli precedenti (bootstrap + router eventi DOM)
```

---

## 3. Inventario Completo dei File

### Root, Stile & Documentazione
| File | Funzione |
|---|---|
| `index.html` | App shell bloccata a `100dvh`: `#hud-bar` (top), `#tab-content` (scroll interno), `#tab-bar` (bottom bar fissa 4 tab senza numeri), `#modal-root` (chiusura solo su `✕`), `#toast-root`, 12 `<script>`. |
| `CSS/style.css` | Foglio di stile unico: palette ciano + liste panna (`#faf3e0`), pesi in smeraldo vivo (`--weight-green: #10b981`) senza badge, 4 colori equipaggiamento, griglia inventario tarata, carosello loot 2/3/4 colonne, responsive mobile. |
| `ROADMAP.md` | Piano di sviluppo a 6 Step + Checkpoint Alpha 1. |
| `FILE_MAP.md` | Questo file: mappa completa file, dipendenze, API, ownership DOM e schema stato. |
| `README.md` / `LICENSE` | Descrizione repository e licenza MIT. |

### Strato Dati & Logica (`js/`)
| File | Responsabilità | Dipendenze | API esposte su `S` (`window.Survival`) |
|---|---|---|---|
| `js/config.js` | Costanti globali (`SAVE_VERSION`, `COOLDOWN_TARGETS`, `CARGO_UPGRADE_COSTS`, `SUPPLY_CAPSULE_CONFIG`, `COMBAT_RULES`), icone (`ICONS`), 30 livelli (`LEVEL_THRESHOLDS`), `EQUIP_SLOTS`, `EQUIP_MODELS`, `ITEMS` (inclusi 20 riparatori), `PLANETS.earth` (location e 4 missioni). | — | `SAVE_VERSION`, `SAVE_PREFIX`, `MAX_LEVEL`, `GLOBAL_SCORE_TARGET`, `COOLDOWN_TARGETS`, `BACKPACK_DEFAULT_WEIGHT`, `CARGO_DEFAULT_WEIGHT`, `CARGO_UPGRADE_STEP`, `AMMO_WEIGHT`, `CARGO_UPGRADE_COSTS`, `SUPPLY_CAPSULE_CONFIG`, `COMBAT_RULES`, `ICONS`, `LEVEL_THRESHOLDS`, `EQUIP_SLOTS`, `EQUIP_MODELS`, `ITEMS`, `PLANETS` |
| `js/state.js` | Helper interi (`toInt`, `clampInt`, `randomInt`, format), `S.state` iniziale e missione vuota, mappe oggetti, progressione EXP/Livelli, sblocco missioni, cambio tab, selezione/annullo missione, preferenza vista resoconto, pub/sub `notifyUI`. | `config` | `state`, `toInt`, `clampInt`, `randomInt`, `formatNumber`, `formatDuration`, `getLevelData`, `getPlanet`, `makeEquipInstance`, `formatUid`, `createEmptyMissionState`, `createInitialState`, `addItemToMap`, `removeItemFromMap`, `addExp`, `isMissionUnlocked`, `setActiveTab`, `selectMission`, `cancelSelectedMission`, `setLootColumnsPreference`, `onStateChange`, `notifyUI` |
| `js/save.js` | Codec puro UTF-8 ↔ Base62 (zero `btoa`/`atob`), checksum FNV-1a 8-hex, `migrateSave` retrocompatibile da `SOS1`, serializzazione `buildSavePayload`, export/import. | `config`, `state` | `migrateSave`, `exportSaveCode`, `importSaveCode` |
| `js/inventory.js` | Calcolo pesi Zaino/Stiva e cooldown, rename con Chip Identità, Camera di Rigenerazione, Capsula Rifornimenti, trasferimenti munizioni e oggetti, ricerca bersagli riparazione, consumo oggetti, Armeria (`equip`/`unequip`/`sell`), upgrade Stiva. | `config`, `state` | `getItemWeight`, `getItemsWeight`, `getBackpackItemsWeight`, `getBackpackAmmoWeight`, `getBackpackTotalWeight`, `getBackpackFreeWeight`, `getCargoMaxWeight`, `getCargoItemsWeight`, `getCargoFreeWeight`, `getCargoUpgradeInfo`, `getCooldownRemaining`, `getRenameTokenCount`, `hasRenameToken`, `renamePlayer`, `useRegenChamber`, `claimSupplyCapsule`, `transferAmmo`, `transferItem`, `getRepairTargetsForItem`, `useItem`, `equipFromStorage`, `unequipSlot`, `sellStorageEquip`, `upgradeCargo` |
| `js/loot.js` | Bozza `pendingLoot` a fine missione: distribuzione automatica per peso crescente (Zaino → Stiva → A Terra), pesi algebrici `S ± X = E`, matrice permessi `canMoveLootEntry` (`drop` solo `1↔2`; propri `3↔4` o `3/4↔1` con ritorno all'origine), spostamento 1 unità, toggle dest Lista 2, scorporo `÷`, ripristino da terra, `commitPendingLoot`. | `config`, `state`, `inventory` | `buildDropsSummaryFromDraft`, `createPendingLootDraft`, `getPendingLootStats`, `canMoveLootEntry`, `moveLootEntry`, `toggleLootDropDestination`, `splitLootEntry`, `restoreGroundEntry`, `commitPendingLoot` |
| `js/combat.js` | Avvio missione, danni su Scudo → Vita, sconfitta (`-75% EXP`, `-50% Crediti`), **pipeline turno a 5 fasi** (`Status` → `Meteo` → `Danni Combattimento & -1 Dd Tuta` → `+1 Turno` → `Check JustTanked & Colpo 8,3% miss`), fuga (`1d20 ≥ 18`), completamento missione + Global Score + creazione bozza `pendingLoot`. | `config`, `state`, `loot` | `startSelectedMission`, `shootAlien`, `attemptEscape`, `completeMission` |

### Strato UI & Bootstrap (`js/`)
| File | Responsabilità | Dipendenze | API esposte su `U` (`S.ui`) e selettori DOM posseduti |
|---|---|---|---|
| `js/ui-core.js` | Stato UI transiente `S.uiState`, helper HTML/icone/`N/A`, toast, modali (`openModal`/`closeModal` solo con `✕` + commit automatico `pendingLoot`), `#hud-bar`, `#tab-bar`, card equipaggiamenti, anteprima drop, modali riparazione/vendita, `renderActiveTab`, ticker 1s cooldown, `render()`. | `config`, `state`, `inventory` | `U.*`: `escapeHtml`, `percentInt`, `showToast`, `applyModalSizeClasses`, `openModal`, `closeModal`, `icon`, `formatRecapValue`, `formatGlobalScoreActive`, `formatAliensRange`, `renderFeatureBadges`, `renderEquipSlotCard`, `renderDropPreviewList`, `renderHud`, `renderTabs`, `openRepairTargetModal`, `openSellConfirmModal`, `handleUseItemClick`, `renderActiveTab`, `refreshCooldownElements`, `render` |
| `js/ui-ship.js` | Vista **Nave Spaziale** (`👤 Equipaggiamento` collassabile con cassetto scorrevole, Rigenerazione, Capsula, Potenziamenti, Biblioteca, Diario di Bordo) e **componente condiviso Zaino/Stiva** (usato anche nella modale Briefing) con selettore quantità inline (`-10` se `>10`, `-1`, input, `+1`, `+10`, `Max`). | `config`, `state`, `inventory`, `ui-core`, `ui-loot` | `U.*`: `renderStorageEquipSection`, `renderInventoryList`, `renderBackpackCargoSection`, `renderShipTab`, `refreshInventoryViews`, `getTransferPickerLimits`, `handleInventoryAreaClick`, `handleInventoryAreaInput`, `handleShipClick`. Selettori: `[data-nav-tab]`, `[data-transfer-ammo]`, `[data-use-item]`, `[data-toggle-transfer]`, `[data-transfer-delta]`, `[data-transfer-input]`, `[data-transfer-confirm]`, `[data-transfer-cancel]`, `#btn-open-last-recap`, `#btn-toggle-storage-equip`, `#btn-regen-chamber`, `#btn-supply-capsule`, `[data-unequip-slot]`, `[data-equip-uid]`, `[data-sell-uid]`, `#btn-upgrade-cargo` |
| `js/ui-mission.js` | Viste **Mappa** (lista missioni, Global Score, location Step 5) e **Missione** (vuoto, Briefing con `Preparazione 🎒 Zaino` e annulla verso Nave/Mappa, Combattimento con solo `SPARA` + ultimo sparo + Zaino + Equipaggiamento), modali Sconfitta/Fuga. | `config`, `state`, `inventory`, `combat`, `ui-core`, `ui-ship`, `ui-loot` | `U.*`: `renderMapTab`, `renderMissionBackpackItems`, `renderLastShotBox`, `renderMissionTab`, `openDefeatModal`, `openEscapeModal`, `handleMapMissionClick`. Selettori: `[data-select-diff]`, `#btn-open-prep-backpack`, `#btn-cancel-mission-ship`, `#btn-cancel-mission-map`, `#btn-start-mission`, `#btn-shoot-alien`, `#btn-escape-mission`, `#btn-complete-mission` |
| `js/ui-loot.js` | Modale **Resoconto Missione**: carosello circolare a 4 liste (vista `2`/`3`/`4` + stellina preferenza, rotazione `◀`/`▶`, pesi algebrici `S ± X = E`, drag & drop solo su colonne visibili e lecite) oppure riepilogo in sola lettura quando riaperto dalla Nave. | `config`, `state`, `loot`, `ui-core` | `U.*`: `openRecapModal`, `refreshRecapModal`, `handleLootModalClick`, `handleModalDragStart`, `handleModalDragOver`, `handleModalDragLeave`, `handleModalDrop`, `handleModalDragEnd`. Selettori: `[data-loot-split]`, `[data-loot-toggle-dest]`, `[data-loot-restore]`, `[data-loot-view]`, `#btn-loot-fav-star`, `[data-loot-shift]`, `[data-loot-entry]`, `[data-loot-col]` |
| `js/ui-options.js` | Vista **Opzioni** (export/import codice `SOS1`, rename con Chip, `🎛️ Controlli` vista resoconto, statistiche) e modale Statistiche Complete. | `config`, `state`, `save`, `inventory`, `ui-core` | `U.*`: `renderOptionsTab`, `renderStatsModalHtml`, `handleOptionsClick`. Selettori: `#btn-copy-save`, `#btn-load-save`, `#btn-rename-player`, `#btn-open-stats`, `[data-set-loot-cols]` |
| `js/main.js` | Bootstrap finale (`init`, `initUI`) e router degli eventi su `#tab-bar`, `#tab-content`, `#modal-body` e `#modal-close-btn` (`✕`). | Tutti i moduli sopra | `S.init`, `U.init`. Gestisce anche `[data-repair-pick]` e `[data-confirm-sell-uid]` nelle modali |

---

## 4. Mappa Rapida "Dove Modificare Cosa"

| Area / Future Feature Roadmap | File esatto(i) da aprire |
|---|---|
| Nuovi oggetti, icone, prezzi, livelli, drop table (Step 4/5), location, pianeti (Step 6) | `js/config.js` |
| Regole turno, Meteo (Diff. 2), Alieni Mutati (Diff. 3), Boss (Diff. 4), nuovi Status | `js/combat.js` (+ `js/config.js` + eventuale UI in `js/ui-mission.js`) |
| Regole peso Zaino/Stiva, Armeria, Rigenerazione, Capsula, Riparazioni | `js/inventory.js` |
| Carosello loot fine missione, regole drag & drop, scorporo, pesi algebrici | `js/loot.js` (logica) + `js/ui-loot.js` (UI) |
| Mappa planetaria, Esplorazione location Step 5 (Stivali Dd), Briefing, Combattimento | `js/ui-mission.js` (+ nuova logica in `js/state.js` / modulo dedicato se Step 5) |
| Nave Spaziale, Zaino/Stiva condiviso, Diario di Bordo, Biblioteca (Step 5) | `js/ui-ship.js` |
| HUD, Tab bar, Modali globali, Card equipaggiamento, Anteprima drop | `js/ui-core.js` |
| Salvataggio/caricamento `SOS1`, nuove chiavi persistenti | `js/state.js` (default) + `js/save.js` (`migrateSave` & `buildSavePayload`) |
| Opzioni, Controlli, Statistiche | `js/ui-options.js` |
| Colori, griglie, layout, tema visivo | `CSS/style.css` |

---

## 5. Schema dello Stato (`S.state` e `S.uiState`)

- **Persistiti nel codice `SOS1` (`buildSavePayload`)**:
  - `saveVersion`, `player` (`name`, `level`, `exp`, `hp`, `shield`, `credits`, `liquids`, `planetId`), `backpack` (`maxWeight`, `ammo`, `items`), `cargo` (`maxWeight`, `ammo`, `items`), `equipment` (`nextUid`, `equipped.{helmet,suit,boots,rifle}`, `storage[]`), `globalScore` (`activeKey`, `streak`), `cooldowns` (`regenReadyAt`, `supplyReadyAt`), `upgrades` (`cargoLevel`), `preferences` (`lootColumns`), `booksUnlocked[]`, `storyFlags{}`, `lastMissionRecap`, `stats` (`aliensKilled`, `shotsFired`, `deaths`, `escapes`, `regenUsed`, `suppliesClaimed`, `creditsEarned`, `liquidsEarned`, `missionsWon.{1..4}`).
- **Transienti in `S.state`** *(resettati a reload/import/chiusura)*:
  - `ui.activeTab`, `mission` (`active`, `selectedDifficulty`, `planetId`, `turn`, `aliensTotal`, `aliensLeft`, `completedReady`, `expGained`, `shotsFired`, `damageTaken`, `levelsGained`, `statuses`, `weather`, `lastShot`), `pendingLoot`.
- **Transienti UI in `S.uiState`**:
  - `activeModalKind`, `transferPicker`, `storageEquipExpanded`, `lootViewCols`, `lootCarouselStart`, `draggingLootEntryId`, `importFeedback`, `renameFeedback`.

---

## 6. Mappa Sezioni di `CSS/style.css`

1. Variabili tema & palette (`--bg-shell`, `--cream`, `--weight-green: #10b981`, colori 4 equipaggiamenti)
2. Shell principale bloccata (`html, body, .app-shell`, `100dvh`) e top `#hud-bar`
3. `.tab-viewport` scorrevole, pannelli ciano, badge e bottoni
4. Liste nodi Mappa & Drop in panna chiara (`.mission-option`, `.drop-row`)
5. Card Equipaggiamento (`.equip-helmet/suit/boots/rifle`) & cassetto scorrevole `.storage-equip-drawer`
6. Griglia Inventario tarata (`.inv-item-card`, `.inv-item-row`, `.transfer-picker`) & azioni Briefing (`.briefing-actions`)
7. Moduli Nave (`.module-grid`), Combattimento (`.combat-banner`, `.last-shot-box`) & form Opzioni (`.controls-row`)
8. Modali (`.modal-wide`, `.modal-xl`, `.modal-full`, `.modal-close-x`) & Carosello Loot (`.loot-col-ground/collected/cyan`, `.loot-item-drop`, `.drop-allowed/.drop-over`)
9. Bottom Navigation Bar (`.tab-bar`), Toast & Media Query responsive (`860px`, `600px`)
