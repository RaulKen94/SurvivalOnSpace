# Roadmap di Sviluppo — Survival On Space

> **Architettura vincolata:** HTML + CSS + JavaScript puro con **IIFE** (`window.Survival`), zero moduli ES, compatibile con GitHub Pages e file locale. Tutti i valori numerici sono **strettamente interi** (zero virgole). Salvataggio **100% manuale e locale** con codice alfanumerico versionato e retrocompatibile.

---

## Stato Attuale: **Checkpoint Test & Feedback Utente (Alpha 1 — Fine Step 3)**

- [x] **Step 0 — Design & Specifiche** *(Completato)*
  - Definizione curva Livelli `1..30` (`10 HP / 5 Scudo` → `200 HP / 350 Scudo`), sistema a turni, peso condiviso Zaino (`500 pt.`) e Stiva (`200 pt.` oggetti / `∞` munizioni), catalogo oggetti e 20 riparatori, 8 equipaggiamenti (`Simple` iniziali + `Advanced` droppabili), Stile A (`Tactical Sci-Fi HUD` Ciano + pesi verde chiaro fluo).

- [x] **Step 1 — Fondamenta, HUD & Salvataggio Retrocompatibile** *(Completato)*
  - Struttura `index.html`, `CSS/style.css`, `js/config.js`, `js/main.js`, `js/ui.js`.
  - Barra superiore fissa, sistema a 4 Tab (`Mappa`, `Missione`, `Nave Spaziale`, `Opzioni`), salvataggio/caricamento manuale alfanumerico (`SOS1...`) retrocompatibile, cambio nome con `Chip Cambio Identità` (`0 pt.`), modale Statistiche completo.

- [x] **Step 2 — Nave Spaziale, Inventario & Equipaggiamenti** *(Completato)*
  - Camera di Rigenerazione attiva (CD 120s, ripristina al 100% Vita e Scudo).
  - Capsula Rifornimenti attiva (CD 240s, consegna munizioni standard + consumabile base).
  - Zaino ↔ Stiva interattivi: trasferimento oggetti e munizioni, uso consumabili e caricatori fuori missione, riparazione Dd tramite i 20 Riparatori (con scelta bersaglio).
  - Armeria Equipaggiamenti: rimozione/indossamento per ID univoco (`EQ-...`) e vendita di pezzi in deposito per Crediti.
  - Primo potenziamento Nave: espansione capienza Stiva (10 livelli da `+100 pt.` ciascuno).

- [x] **Step 3 — Loop Missioni & Global Score (Terra — Difficoltà 1)** *(Completato)*
  - Avvio missione (`Mission = true`, blocco cambio tab e opzione `Annulla → Nave Spaziale` prima della partenza).
  - Combattimento a turni: azione `Spara` (-1 Munizione, -1 alieno, +1 EXP immediato, eventuale Level-up con refresh completo HP e Scudo), contrattacco nemico (riduzione fissa Tuta, consumo Dd Tuta e Fucile, assorbimento Scudo → Vita), uso consumabili/riparatori dallo Zaino.
  - Fuga d'emergenza a Munizioni `0` (`1d20 >= 18` per fuggire perdendo il 30% EXP).
  - Vittoria ad Alieni `0`: pulsante `Completa Missione`, estrazione drop (`Tuta Spaziale Avanzata` al 1% + consumabili), popup resoconto identico a `Recap ultima missione` in Nave, track **Global Score** (`10/10` con reset al cambio difficoltà).
  - Sconfitta a Vita `0`: -75% EXP, -50% Crediti, rientro su Nave Spaziale con `5 HP` e `0 Scudo`.

- [ ] **Checkpoint Test & Feedback Utente (Alpha 1)** *(Siamo qui!)*
  - Prova sul campo da parte del giocatore (Desktop / Mobile): bilanciamento pesi, chiarezza UI combattimento, usabilità Zaino/Stiva, salvataggio/caricamento e raccolta feedback prima di introdurre Meteo, Mutati e Boss.

- [ ] **Step 4 — Difficoltà Avanzate sulla Terra (Diff. 2, 3, 4)** *(Prossimo dopo feedback)*
  - Difficoltà 2 (Liv. 2): sistema **Meteo** (mitigazione Casco + bonus EXP fisso per meteo al completamento).
  - Difficoltà 3 (Liv. 5): **Alieni Mutati** (contrasto tramite punteggio Fucile Spaziale).
  - Difficoltà 4 (Storyline): **Boss della Terra** unico e relativi drop/premi dedicati.

- [ ] **Step 5 — Fase Cozy: Esplorazione Pianeta, Libri & Storyline**
  - Esplorazione delle location planetarie con consumo Dd degli Stivali Spaziali (`Meccanico Spaziale`, `Centro di Ricerca Meteo`, dialoghi NPC ed eventi).
  - Raccolta e lettura integrale dei Libri sulla Nave Spaziale con bonus passivi permanenti e progressione storyline (incluso sblocco Difficoltà 4).

- [ ] **Step 6 — Espansione Universo & Rifinitura**
  - Viaggi tramite `Meccanico Spaziale` verso nuovi pianeti e satelliti, nuovi set di missioni e boss, ulteriori potenziamenti Nave, bilanciamento finale e rifiniture UI.
