# 🚀 Survival on Space - Tactical RPG

[![Version](https://img.shields.io/badge/version-3.0.3-blue.svg)]()
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Made with](https://img.shields.io/badge/made%20with-HTML%2FCSS%2FJS-orange.svg)](https://developer.mozilla.org/)

> A mobile-first tactical turn-based survival RPG set in a sci-fi universe. Fight aliens, manage resources, upgrade your gear, and survive!

[🇮🇹 Versione Italiana](#italiano)

---

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [How to Play](#how-to-play)
- [Game Mechanics](#game-mechanics)
- [Development](#development)
- [Contributing](#contributing)

---
<a name="overview"></a>
## 🎮 Overview

**Survival on Space** is a browser-based tactical RPG where you command a space marine fighting against alien infestations on Earth. Built with vanilla HTML, CSS, and JavaScript, it's designed for mobile-first gameplay with touch-friendly interfaces.

The game features:
- Turn-based combat system
- Resource management (health, shields, ammunition)
- Inventory system with weight limits
- Organic synthesis crafting system
- Equipment durability and repairs
- City locations with shops and services
- Save/load progress system
- Weather effects that impact combat
- Status effects and buffs

---
<a name="features"></a>
## ✨ Features

### Core Gameplay
- **Tactical Combat**: Turn-based alien elimination with weapons and exploration
- **Zone System**: Multiple sectors (A1, A2, A3) with increasing difficulty
- **Progression System**: Level up, gain EXP, unlock new abilities
- **Global Score Streak**: Consecutive zone completions grant bonus rewards

### Resource Management
- **Health & Shields**: Manage your vital stats
- **Ammunition**: Limited K1 ammunition with reload mechanics
- **Inventory**: Weight-based inventory system (200 pts backpack, 200-350 pts cargo hold)
- **Equipment Durability**: Helmet, suit, boots, and weapon degradation

### Crafting & Synthesis
- **Organic Synthesis**: Create keys and chests using Organic Compound
- **Fusion System**: Merge 3 items to upgrade their level
- **Keychain**: Store and manage special keys

### City & Services
- **Piazza**: Free meeting point
- **Shoe Shiner**: Temporary buff for boots (200 credits)
- **Emporium**: Shop for items and services
- **Meteorological Center**: Weather information (disabled)
- **Launch Station**: Interplanetary travel (disabled)

### Save System
- **Export/Import**: Generate base64 save codes
- **Cross-session**: Carry progress between game sessions

---
<a name="screenshots"></a>
## 📸 Screenshots

*(Add screenshots of your game here)*

| Main Map | Combat | Inventory |
|----------|--------|-----------|
| ![Map](screenshots/map.png) | ![Combat](screenshots/combat.png) | ![Inventory](screenshots/inventory.png) |

---
<a name="tech-stack"></a>
## 🛠️ Tech Stack

- **HTML5** - Structure
- **CSS3** - Styling with custom animations
- **Tailwind CSS** - Utility-first CSS framework
- **Vanilla JavaScript** - All game logic (no frameworks)
- **Local Storage** - Save/load functionality (via base64 codes)

---
<a name="project-structure"></a>
## 📁 Project Structure

survival-on-space/
├── index.html              # Main HTML file
├── css/
│   └── style.css          # Custom styles
├── js/
│   ├── constants.js       # Static data (levels, items, zones, etc.)
│   ├── state.js           # Global game state
│   ├── utils.js           # Utility functions (toast, UUID, etc.)
│   ├── ui.js              # UI rendering
│   ├── game-core.js       # Core game logic
│   ├── inventory.js       # Inventory management
│   ├── synthesis.js       # Organic synthesis system
│   ├── city.js            # City locations and emporium
│   ├── equipment.js       # Equipment and pocket system
│   ├── cooldowns.js       # Cooldown management
│   ├── save-load.js       # Save/Load functionality
│   ├── events.js          # All event listeners
│   └── main.js            # Entry point
└── README.md              # This file

---
<a name="installation"></a>
## 🚀 Installation

### Option 1: Direct Download

1. Clone the repository
   git clone https://github.com/yourusername/survival-on-space.git
   cd survival-on-space

2. Open in browser
   open index.html
   # or simply double-click index.html

### Option 2: Live Server (Development)

# Install live-server globally
npm install -g live-server

# Run the game
live-server

### Option 3: GitHub Pages

1. Fork the repository
2. Enable GitHub Pages in repository settings
3. Access via https://yourusername.github.io/survival-on-space/
---
<a name="how-to-play"></a>
## 🎯 How to Play

### Quick Start Guide

1. Select a Zone: Tap on A1, A2, or A3 sectors on the map
2. Launch Mission: Click "Avvia Sbarco" to start combat
3. Combat:
   - Fire: Tap 💥 to shoot aliens (uses 1 K1 ammo)
   - Explore: Tap 🧭 to search for resources (2 charges)
   - Search: Tap 🔦 to loot buildings (3 charges)
4. Manage Resources:
   - Use consumables from inventory
   - Transfer items between backpack and cargo hold
   - Repair equipment with repair kits
5. Return to Ship: Complete mission or use "Annulla e Torna a Nave"

### Tips for Success

- 📊 Monitor your status: Keep HP and shields high
- 🎒 Manage weight: Don't exceed 200 pts in backpack
- 🔧 Repair equipment: Maintain helmet, suit, boots, and weapon
- 🧪 Craft wisely: Use synthesis to upgrade items
- 💰 Save credits: Purchase items at Emporium strategically

---
<a name="game-mechanics"></a>
## ⚙️ Game Mechanics

### Level System
| Level | Next EXP | Max HP | Max Shield |
|-------|----------|--------|------------|
| 1     | 20       | 50     | 5          |
| 2     | 180      | 70     | 10         |
| 3     | 450      | 90     | 15         |
| 4     | 7800     | 110    | 20         |
| 5     | 174500   | 130    | 25         |
| 6     | 840000   | 250    | 30         |
| 7     | 2300000  | 300    | 35         |
| 8     | 31500000 | 350    | 40         |
| 9     | 800000000| 450    | 50         |
| 10    | 3000000000| 1000  | 150        |

### Zone Data
| Zone | Aliens | Reward | Multiplier |
|------|--------|--------|------------|
| A1   | 20     | 100    | 1x         |
| A2   | 50     | 250    | 1.5x       |
| A3   | 65+    | 500    | 2x         |

### Weather Effects
- Clear: No effects
- Acid Rain: Damage to helmet and HP
- Gravitational Storm: Shield depletion, HP damage

### Organic Synthesis
- Create: 100 Organic Compound → Random Key or Chest (Lv.0)
- Fusion: 3 same type/level → Upgrade to next level
- Open Chest: 1 Key + 1 Chest → Fragments reward

---
<a name="development"></a>
## 💻 Development

### Code Organization

The game uses an IIFE (Immediately Invoked Function Expression) pattern for modularization without ES6 imports:

(function() {
  window.Survival = window.Survival || {};
  const S = window.Survival;
  // ... module code
})();

### Adding New Features

1. New Item:
   - Add to ITEMS_METADATA in constants.js
   - Add initial quantity to state.inventory or state.stiva

2. New Zone:
   - Add to ZONE_DATA in constants.js
   - Add HTML button in zone list

3. New Status Effect:
   - Add to STATUSES_METADATA in constants.js
   - Implement effect in game-core.js

### Debugging

Open browser console (F12) to access:
- window.Survival - Full game API
- window.Survival.state - Current game state
- window.Survival.renderAll() - Force UI refresh

---
<a name="contributing"></a>
## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (git checkout -b feature/amazing-feature)
3. Commit changes (git commit -m 'Add amazing feature')
4. Push to branch (git push origin feature/amazing-feature)
5. Open a Pull Request

### Guidelines
- Follow existing code style
- Test on mobile devices
- Update documentation if needed
- Keep commits atomic and descriptive

---

## 📜 License

This project is licensed under the **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)**.

* **Attribution Required:** You **must** give appropriate credit to the original author, provide a link to the license, and indicate if changes were made.
* **Free to Use & Modify:** You can play, customize, and share the code freely for personal, non-commercial use.
* **Non-Commercial:** Commercial use, monetisation, or resale of this code or its derivatives is strictly prohibited.

---

## 🙏 Acknowledgments

- Icons and emojis for visual elements
- Tailwind CSS for rapid UI development
- All playtesters and contributors

---

<div align="center">
  <sub>Built with ❤️ by the Survival on Space Team</sub>
</div>

---

<a name="italiano"></a>
# 🇮🇹 Survival on Space - RPG Tattico

[![Versione](https://img.shields.io/badge/versione-3.0.3-blue.svg)]()
[![Licenza](https://img.shields.io/badge/Licenza-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Realizzato con](https://img.shields.io/badge/realizzato%20con-HTML%2FCSS%2FJS-orange.svg)](https://developer.mozilla.org/)

> Un RPG tattico a turni di sopravvivenza per dispositivi mobili ambientato in un universo fantascientifico. Combatti alieni, gestisci risorse, potenzia il tuo equipaggiamento e sopravvivi!

[🇬🇧 English Version](#overview)

---

## 📖 Indice

- [Panoramica](#panoramica)
- [Caratteristiche](#caratteristiche-italiano)
- [Screenshot](#screenshot-italiano)
- [Stack Tecnologico](#stack-tecnologico-italiano)
- [Struttura del Progetto](#struttura-del-progetto-italiano)
- [Installazione](#installazione-italiano)
- [Come Giocare](#come-giocare-italiano)
- [Meccaniche di Gioco](#meccaniche-di-gioco-italiano)
- [Sviluppo](#sviluppo-italiano)
- [Contributi](#contributi-italiano)

---

<a name="panoramica"></a>
## 🎮 Panoramica

**Survival on Space** è un RPG tattico basato su browser dove comandi un marine spaziale che combatte contro infestazioni aliene sulla Terra. Realizzato con HTML, CSS e JavaScript vanilla, è progettato per il gameplay mobile-first con interfacce touch-friendly.

Il gioco include:
- Sistema di combattimento a turni
- Gestione risorse (vita, scudi, munizioni)
- Sistema di inventario con limiti di peso
- Sistema di creazione tramite sintesi organica
- Durabilità e riparazione dell'equipaggiamento
- Location cittadine con negozi e servizi
- Sistema di salvataggio/caricamento progressi
- Effetti meteorologici che influenzano il combattimento
- Effetti di stato e potenziamenti

---

<a name="caratteristiche-italiano"></a>
## ✨ Caratteristiche

### Gameplay Principale
- **Combattimento Tattico**: Eliminazione alieni a turni con armi ed esplorazione
- **Sistema di Zone**: Settori multipli (A1, A2, A3) con difficoltà crescente
- **Sistema di Progressione**: Salita di livello, guadagno EXP, sblocco abilità
- **Global Score Streak**: Completioni consecutive delle zone che concedono ricompense bonus

### Gestione Risorse
- **Vita & Scudi**: Gestisci le tue statistiche vitali
- **Munizioni**: Munizioni K1 limitate con meccaniche di ricarica
- **Inventario**: Sistema di inventario basato sul peso (200 pts zaino, 200-350 pts stiva)
- **Durabilità Equipaggiamento**: Degrado di casco, tuta, stivali e fucile

### Creazione & Sintesi
- **Sintesi Organica**: Crea chiavi e scrigni usando Composto Organico
- **Sistema di Fusione**: Unisci 3 oggetti per aumentare il loro livello
- **Portachiavi**: Conserva e gestisci chiavi speciali

### Città & Servizi
- **Piazza**: Punto di ritrovo gratuito
- **Lustrascarpe**: Potenziamento temporaneo per gli stivali (200 crediti)
- **Emporio**: Negozio per oggetti e servizi
- **Centro Meteorologico**: Informazioni meteorologiche (disabilitato)
- **Stazione di Lancio**: Viaggi interplanetari (disabilitato)

### Sistema di Salvataggio
- **Esporta/Importa**: Genera codici di salvataggio in base64
- **Cross-sessione**: Mantieni i progressi tra sessioni di gioco

---

<a name="screenshot-italiano"></a>
## 📸 Screenshot

*(Aggiungi qui gli screenshot del tuo gioco)*

| Mappa | Combattimento | Inventario |
|-------|---------------|------------|
| ![Mappa](screenshots/map.png) | ![Combattimento](screenshots/combat.png) | ![Inventario](screenshots/inventory.png) |

---

<a name="stack-tecnologico-italiano"></a>
## 🛠️ Stack Tecnologico

- **HTML5** - Struttura
- **CSS3** - Styling con animazioni personalizzate
- **Tailwind CSS** - Framework CSS utility-first
- **JavaScript Vanilla** - Tutta la logica di gioco (nessun framework)
- **Local Storage** - Funzionalità di salvataggio/caricamento (tramite codici base64)

---

<a name="struttura-del-progetto-italiano"></a>
## 📁 Struttura del Progetto

survival-on-space/
├── index.html              # File HTML principale
├── css/
│   └── style.css          # Stili personalizzati
├── js/
│   ├── constants.js       # Dati statici (livelli, oggetti, zone, ecc.)
│   ├── state.js           # Stato globale del gioco
│   ├── utils.js           # Funzioni di utilità (toast, UUID, ecc.)
│   ├── ui.js              # Rendering UI
│   ├── game-core.js       # Logica di gioco principale
│   ├── inventory.js       # Gestione inventario
│   ├── synthesis.js       # Sistema di sintesi organica
│   ├── city.js            # Location cittadine e emporio
│   ├── equipment.js       # Equipaggiamento e sistema tasche
│   ├── cooldowns.js       # Gestione cooldown
│   ├── save-load.js       # Funzionalità Salvataggio/Caricamento
│   ├── events.js          # Tutti gli event listener
│   └── main.js            # Punto di ingresso
└── README.md              # Questo file

---

<a name="installazione-italiano"></a>
## 🚀 Installazione

### Opzione 1: Download Diretto

1. Clona il repository
   git clone https://github.com/yourusername/survival-on-space.git
   cd survival-on-space

2. Apri nel browser
   open index.html
   # oppure fai doppio clic su index.html

### Opzione 2: Live Server (Sviluppo)

# Installa live-server globalmente
npm install -g live-server

# Avvia il gioco
live-server

### Opzione 3: GitHub Pages

1. Fai il fork del repository
2. Attiva GitHub Pages nelle impostazioni del repository
3. Accedi tramite https://tuousername.github.io/survival-on-space/
---

<a name="come-giocare-italiano"></a>
## 🎯 Come Giocare

### Guida Rapida

1. Seleziona una Zona: Tocca A1, A2 o A3 sulla mappa
2. Avvia Missione: Clicca "Avvia Sbarco" per iniziare il combattimento
3. Combattimento:
   - Spara: Tocca 💥 per sparare agli alieni (usa 1 munizione K1)
   - Esplora: Tocca 🧭 per cercare risorse (2 cariche)
   - Cerca: Tocca 🔦 per saccheggiare edifici (3 cariche)
4. Gestisci Risorse:
   - Usa oggetti consumabili dall'inventario
   - Trasferisci oggetti tra zaino e stiva
   - Ripara l'equipaggiamento con kit di riparazione
5. Torna alla Nave: Completa la missione o usa "Annulla e Torna a Nave"

### Consigli per il Successo

- 📊 Monitora lo stato: Mantieni HP e scudi alti
- 🎒 Gestisci il peso: Non superare i 200 pts nello zaino
- 🔧 Ripara l'equipaggiamento: Mantieni casco, tuta, stivali e fucile
- 🧪 Crea saggiamente: Usa la sintesi per potenziare gli oggetti
- 💰 Risparmia crediti: Acquista oggetti all'Emporio strategicamente

---

<a name="meccaniche-di-gioco-italiano"></a>
## ⚙️ Meccaniche di Gioco

### Sistema di Livelli
| Livello | EXP Successiva | HP Max | Scudo Max |
|---------|----------------|--------|-----------|
| 1       | 20             | 50     | 5         |
| 2       | 180            | 70     | 10        |
| 3       | 450            | 90     | 15        |
| 4       | 7800           | 110    | 20        |
| 5       | 174500         | 130    | 25        |
| 6       | 840000         | 250    | 30        |
| 7       | 2300000        | 300    | 35        |
| 8       | 31500000       | 350    | 40        |
| 9       | 800000000      | 450    | 50        |
| 10      | 3000000000     | 1000   | 150       |

### Dati Zone
| Zona | Alieni | Ricompensa | Moltiplicatore |
|------|--------|------------|----------------|
| A1   | 20     | 100        | 1x             |
| A2   | 50     | 250        | 1.5x           |
| A3   | 65+    | 500        | 2x             |

### Effetti Meteorologici
- Limpido: Nessun effetto
- Pioggia Acida: Danno al casco e HP
- Tempesta Gravitazionale: Deplezione scudi, danno HP

### Sintesi Organica
- Crea: 100 Composto Organico → Chiave o Scrigno casuale (Lv.0)
- Fusione: 3 stesso tipo/livello → Passaggio al livello successivo
- Apri Scrigno: 1 Chiave + 1 Scrigno → Ricompensa in Frammenti

---

<a name="sviluppo-italiano"></a>
## 💻 Sviluppo

### Organizzazione del Codice

Il gioco utilizza il pattern IIFE (Immediately Invoked Function Expression) per la modularizzazione senza import ES6:

(function() {
  window.Survival = window.Survival || {};
  const S = window.Survival;
  // ... codice del modulo
})();

### Aggiungere Nuove Funzionalità

1. Nuovo Oggetto:
   - Aggiungi a ITEMS_METADATA in constants.js
   - Aggiungi quantità iniziale a state.inventory o state.stiva

2. Nuova Zona:
   - Aggiungi a ZONE_DATA in constants.js
   - Aggiungi pulsante HTML nella lista zone

3. Nuovo Effetto di Stato:
   - Aggiungi a STATUSES_METADATA in constants.js
   - Implementa l'effetto in game-core.js

### Debugging

Apri la console del browser (F12) per accedere a:
- window.Survival - API completa del gioco
- window.Survival.state - Stato corrente del gioco
- window.Survival.renderAll() - Forza il refresh UI

---

<a name="contributi-italiano"></a>
## 🤝 Contributi

I contributi sono benvenuti! Ecco come puoi aiutare:

1. Fai il fork del repository
2. Crea un branch per la feature (git checkout -b feature/feature-eccezionale)
3. Commit le modifiche (git commit -m 'Aggiungi feature eccezionale')
4. Push sul branch (git push origin feature/feature-eccezionale)
5. Apri una Pull Request

### Linee Guida
- Segui lo stile di codice esistente
- Testa su dispositivi mobili
- Aggiorna la documentazione se necessario
- Mantieni i commit atomici e descrittivi

---

<a name="licenza-italiano"></a>
## 📜 Licenza

Questo progetto è distribuito sotto licenza **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)**.

* **Obbligo di Citazione:** È **obbligatorio** citare l'autore originale, inserire un link alla licenza e indicare le eventuali modifiche apportate.
* **Uso e Modifica Gratuita:** Puoi giocare, personalizzare e condividere il codice liberamente per uso personale e non commerciale.
* **Divieto di Monetizzazione:** La vendita, la monetizzazione o qualsiasi utilizzo commerciale di questo codice e dei suoi derivati sono severamente vietati.

---

## 🙏 Ringraziamenti

- Icone ed emoji per gli elementi visivi
- Tailwind CSS per lo sviluppo rapido UI
- Tutti i playtester e i contributori

---

<div align="center">
  <sub>Realizzato con ❤️ dal team di Survival on Space</sub>
</div>
