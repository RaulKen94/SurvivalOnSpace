// js/save.js
(function () {
  'use strict';

  var S = (window.Survival = window.Survival || {});
  var BASE62_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

  // Codec UTF-8 & Base62 puro (100% alfanumerico, indipendente da browser/locale)
  function utf8Encode(str) {
    var bytes = [];
    var i, code, code2, cp;
    for (i = 0; i < str.length; i += 1) {
      code = str.charCodeAt(i);
      if (code < 0x80) {
        bytes.push(code);
      } else if (code < 0x800) {
        bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
      } else if (code >= 0xd800 && code <= 0xdbff && i + 1 < str.length) {
        code2 = str.charCodeAt(i + 1);
        if (code2 >= 0xdc00 && code2 <= 0xdfff) {
          cp = 0x10000 + ((code - 0xd800) << 10) + (code2 - 0xdc00);
          i += 1;
          bytes.push(
            0xf0 | (cp >> 18),
            0x80 | ((cp >> 12) & 0x3f),
            0x80 | ((cp >> 6) & 0x3f),
            0x80 | (cp & 0x3f)
          );
        } else {
          throw new Error('UTF-8 encoding error: unpaired surrogate');
        }
      } else {
        bytes.push(
          0xe0 | (code >> 12),
          0x80 | ((code >> 6) & 0x3f),
          0x80 | (code & 0x3f)
        );
      }
    }
    return bytes;
  }

  function utf8Decode(bytes) {
    var out = '';
    var i = 0;
    var b1, b2, b3, b4, cp;
    while (i < bytes.length) {
      b1 = bytes[i];
      if (b1 < 0x80) {
        out += String.fromCharCode(b1);
        i += 1;
      } else if ((b1 & 0xe0) === 0xc0) {
        if (i + 1 >= bytes.length) {
          throw new Error('Invalid UTF-8 sequence');
        }
        b2 = bytes[i + 1];
        out += String.fromCharCode(((b1 & 0x1f) << 6) | (b2 & 0x3f));
        i += 2;
      } else if ((b1 & 0xf0) === 0xe0) {
        if (i + 2 >= bytes.length) {
          throw new Error('Invalid UTF-8 sequence');
        }
        b2 = bytes[i + 1];
        b3 = bytes[i + 2];
        out += String.fromCharCode(((b1 & 0x0f) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f));
        i += 3;
      } else if ((b1 & 0xf8) === 0xf0) {
        if (i + 3 >= bytes.length) {
          throw new Error('Invalid UTF-8 sequence');
        }
        b2 = bytes[i + 1];
        b3 = bytes[i + 2];
        b4 = bytes[i + 3];
        cp = ((b1 & 0x07) << 18) | ((b2 & 0x3f) << 12) | ((b3 & 0x3f) << 6) | (b4 & 0x3f);
        cp -= 0x10000;
        out += String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 0x3ff));
        i += 4;
      } else {
        throw new Error('Invalid UTF-8 byte');
      }
    }
    return out;
  }

  function bytesToBase62(rawBytes) {
    var digits = [1].concat(rawBytes);
    var result = [];
    var next, i, rem, val;

    while (digits.length > 0) {
      next = [];
      rem = 0;
      for (i = 0; i < digits.length; i += 1) {
        val = rem * 256 + digits[i];
        if (next.length > 0 || Math.floor(val / 62) > 0) {
          next.push(Math.floor(val / 62));
        }
        rem = val % 62;
      }
      result.push(BASE62_ALPHABET.charAt(rem));
      digits = next;
    }

    result.reverse();
    return result.join('');
  }

  function base62ToBytes(str) {
    var digits = [0];
    var i, j, idx, carry, val;

    for (i = 0; i < str.length; i += 1) {
      idx = BASE62_ALPHABET.indexOf(str.charAt(i));
      if (idx === -1) {
        throw new Error('Carattere non valido nel codice salvataggio');
      }
      carry = idx;
      for (j = digits.length - 1; j >= 0; j -= 1) {
        val = digits[j] * 62 + carry;
        digits[j] = val & 0xff;
        carry = val >> 8;
      }
      while (carry > 0) {
        digits.unshift(carry & 0xff);
        carry = carry >> 8;
      }
    }

    if (digits.length === 0 || digits[0] !== 1) {
      throw new Error('Intestazione binaria salvataggio non valida');
    }
    return digits.slice(1);
  }

  function computeChecksum(str) {
    var hash = 0x811c9dc5;
    var i;
    for (i = 0; i < str.length; i += 1) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).toUpperCase().padStart(8, '0');
  }

  function sanitizeItemsMap(rawMap, fallbackMap) {
    if (!rawMap || typeof rawMap !== 'object' || Array.isArray(rawMap)) {
      return fallbackMap ? Object.assign({}, fallbackMap) : {};
    }
    var clean = {};
    var key, qty;
    for (key in rawMap) {
      if (Object.prototype.hasOwnProperty.call(rawMap, key) && S.ITEMS[key]) {
        qty = S.toInt(rawMap[key], 0);
        if (qty > 0) {
          clean[key] = qty;
        }
      }
    }
    return clean;
  }

  function migrateSave(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new Error('Struttura dati di salvataggio non valida.');
    }

    var base = S.createInitialState();

    if (raw.player && typeof raw.player === 'object') {
      var rawName = typeof raw.player.name === 'string' ? raw.player.name.trim().replace(/\s+/g, ' ') : '';
      base.player.name = rawName.length >= 2 && rawName.length <= 20 ? rawName : base.player.name;
      base.player.level = S.clampInt(raw.player.level, 1, S.MAX_LEVEL, 1);
      var lvData = S.getLevelData(base.player.level);
      var maxExpGuard = lvData.nextExp ? Math.max(0, lvData.nextExp - 1) : 0;
      base.player.exp = lvData.nextExp
        ? S.clampInt(raw.player.exp, 0, maxExpGuard, 0)
        : 0;
      base.player.hp = S.clampInt(raw.player.hp, 0, lvData.maxHp, lvData.maxHp);
      base.player.shield = S.clampInt(raw.player.shield, 0, lvData.maxShield, lvData.maxShield);
      base.player.credits = Math.max(0, S.toInt(raw.player.credits, base.player.credits));
      base.player.liquids = Math.max(0, S.toInt(raw.player.liquids, base.player.liquids));
      base.player.planetId = S.PLANETS[raw.player.planetId] ? raw.player.planetId : 'earth';
    }

    if (raw.upgrades && typeof raw.upgrades === 'object') {
      var maxCargoLvl = S.CARGO_UPGRADE_COSTS ? S.CARGO_UPGRADE_COSTS.length : 10;
      base.upgrades.cargoLevel = S.clampInt(raw.upgrades.cargoLevel, 0, maxCargoLvl, 0);
    }

    if (raw.preferences && typeof raw.preferences === 'object') {
      var rawCols = S.toInt(raw.preferences.lootColumns, 2);
      base.preferences.lootColumns = (rawCols === 2 || rawCols === 3 || rawCols === 4) ? rawCols : 2;
    }

    if (raw.backpack && typeof raw.backpack === 'object') {
      base.backpack.maxWeight = Math.max(S.BACKPACK_DEFAULT_WEIGHT, S.toInt(raw.backpack.maxWeight, S.BACKPACK_DEFAULT_WEIGHT));
      base.backpack.ammo = Math.max(0, S.toInt(raw.backpack.ammo, 0));
      base.backpack.items = sanitizeItemsMap(raw.backpack.items, base.backpack.items);
    }

    if (raw.cargo && typeof raw.cargo === 'object') {
      base.cargo.ammo = Math.max(0, S.toInt(raw.cargo.ammo, 0));
      base.cargo.items = sanitizeItemsMap(raw.cargo.items, {});
    }
    base.cargo.maxWeight = S.CARGO_DEFAULT_WEIGHT + base.upgrades.cargoLevel * S.CARGO_UPGRADE_STEP;

    if (raw.equipment && typeof raw.equipment === 'object') {
      base.equipment.nextUid = Math.max(1, S.toInt(raw.equipment.nextUid, base.equipment.nextUid));

      if (raw.equipment.equipped && typeof raw.equipment.equipped === 'object') {
        var slotKeys = Object.keys(S.EQUIP_SLOTS);
        var sIdx, slotName, rawInst, inst;
        for (sIdx = 0; sIdx < slotKeys.length; sIdx += 1) {
          slotName = slotKeys[sIdx];
          if (Object.prototype.hasOwnProperty.call(raw.equipment.equipped, slotName)) {
            rawInst = raw.equipment.equipped[slotName];
            if (rawInst === null) {
              base.equipment.equipped[slotName] = null;
            } else if (rawInst && typeof rawInst === 'object' && S.EQUIP_MODELS[rawInst.modelId]) {
              if (S.EQUIP_MODELS[rawInst.modelId].slot === slotName) {
                inst = S.makeEquipInstance(
                  rawInst.uid || S.formatUid(base.equipment.nextUid++),
                  rawInst.modelId,
                  rawInst.dd
                );
                base.equipment.equipped[slotName] = inst;
              }
            }
          }
        }
      }

      if (Array.isArray(raw.equipment.storage)) {
        base.equipment.storage = [];
        var stIdx, stRaw, stInst;
        for (stIdx = 0; stIdx < raw.equipment.storage.length; stIdx += 1) {
          stRaw = raw.equipment.storage[stIdx];
          if (stRaw && typeof stRaw === 'object' && S.EQUIP_MODELS[stRaw.modelId]) {
            stInst = S.makeEquipInstance(
              stRaw.uid || S.formatUid(base.equipment.nextUid++),
              stRaw.modelId,
              stRaw.dd
            );
            if (stInst) {
              base.equipment.storage.push(stInst);
            }
          }
        }
      }
    }

    if (raw.globalScore && typeof raw.globalScore === 'object') {
      base.globalScore.activeKey = typeof raw.globalScore.activeKey === 'string'
        ? raw.globalScore.activeKey
        : null;
      base.globalScore.streak = S.clampInt(raw.globalScore.streak, 0, S.GLOBAL_SCORE_TARGET, 0);
    }

    if (raw.cooldowns && typeof raw.cooldowns === 'object') {
      base.cooldowns.regenReadyAt = Math.max(0, S.toInt(raw.cooldowns.regenReadyAt, 0));
      base.cooldowns.supplyReadyAt = Math.max(0, S.toInt(raw.cooldowns.supplyReadyAt, 0));
    }

    if (Array.isArray(raw.booksUnlocked)) {
      base.booksUnlocked = raw.booksUnlocked.filter(function (b) {
        return typeof b === 'string';
      });
    }
    if (raw.storyFlags && typeof raw.storyFlags === 'object' && !Array.isArray(raw.storyFlags)) {
      var flagKey;
      for (flagKey in raw.storyFlags) {
        if (Object.prototype.hasOwnProperty.call(raw.storyFlags, flagKey)) {
          base.storyFlags[flagKey] = Boolean(raw.storyFlags[flagKey]);
        }
      }
    }

    if (raw.lastMissionRecap && typeof raw.lastMissionRecap === 'object' && !Array.isArray(raw.lastMissionRecap)) {
      base.lastMissionRecap = raw.lastMissionRecap;
    }

    if (raw.stats && typeof raw.stats === 'object') {
      var statFields = [
        'aliensKilled',
        'shotsFired',
        'deaths',
        'escapes',
        'regenUsed',
        'suppliesClaimed',
        'creditsEarned',
        'liquidsEarned'
      ];
      var fIdx, field;
      for (fIdx = 0; fIdx < statFields.length; fIdx += 1) {
        field = statFields[fIdx];
        base.stats[field] = Math.max(0, S.toInt(raw.stats[field], 0));
      }
      if (raw.stats.missionsWon && typeof raw.stats.missionsWon === 'object') {
        var dIdx;
        for (dIdx = 1; dIdx <= 4; dIdx += 1) {
          base.stats.missionsWon[dIdx] = Math.max(0, S.toInt(raw.stats.missionsWon[dIdx], 0));
        }
      }
    }

    base.saveVersion = S.SAVE_VERSION;
    base.ui.activeTab = 'ship';
    base.mission = S.createEmptyMissionState();
    base.pendingLoot = null;

    return base;
  }

  function buildSavePayload(stateObj) {
    return {
      saveVersion: S.SAVE_VERSION,
      player: stateObj.player,
      backpack: stateObj.backpack,
      cargo: stateObj.cargo,
      equipment: stateObj.equipment,
      globalScore: stateObj.globalScore,
      cooldowns: stateObj.cooldowns,
      upgrades: stateObj.upgrades,
      preferences: stateObj.preferences,
      booksUnlocked: stateObj.booksUnlocked,
      storyFlags: stateObj.storyFlags,
      lastMissionRecap: stateObj.lastMissionRecap,
      stats: stateObj.stats
    };
  }

  function exportSaveCode() {
    var json = JSON.stringify(buildSavePayload(S.state));
    var bytes = utf8Encode(json);
    var payload = bytesToBase62(bytes);
    var checksum = computeChecksum(S.SAVE_PREFIX + payload);
    return S.SAVE_PREFIX + payload + checksum;
  }

  function importSaveCode(code) {
    if (typeof code !== 'string') {
      return { ok: false, message: 'Inserisci un codice di salvataggio valido.' };
    }
    var trimmed = code.trim();
    if (!trimmed) {
      return { ok: false, message: 'Il campo del codice è vuoto.' };
    }
    var match = trimmed.match(/^SOS(\d+)([0-9A-Za-z]+)([0-9A-Fa-f]{8})$/);
    if (!match) {
      return {
        ok: false,
        message: 'Formato non valido: il codice deve iniziare con ' + S.SAVE_PREFIX + ' ed essere alfanumerico.'
      };
    }

    var version = S.toInt(match[1], 0);
    if (version < 1 || version > S.SAVE_VERSION) {
      return {
        ok: false,
        message: 'Versione salvataggio SOS' + version + ' non supportata da questa build.'
      };
    }

    var payload = match[2];
    var givenChecksum = match[3].toUpperCase();
    var expectedChecksum = computeChecksum('SOS' + version + payload);
    if (givenChecksum !== expectedChecksum) {
      return {
        ok: false,
        message: 'Checksum non corrispondente: il codice risulta alterato o incompleto.'
      };
    }

    try {
      var bytes = base62ToBytes(payload);
      var jsonStr = utf8Decode(bytes);
      var parsed = JSON.parse(jsonStr);
      if (parsed.saveVersion === undefined) {
        parsed.saveVersion = version;
      }
      S.state = migrateSave(parsed);
      S.notifyUI();
      return {
        ok: true,
        message: 'Salvataggio SOS' + version + ' caricato con successo (' + S.state.player.name + ', Liv. ' + S.state.player.level + ').'
      };
    } catch (err) {
      return {
        ok: false,
        message: 'Impossibile decodificare i dati del salvataggio.'
      };
    }
  }

  S.migrateSave = migrateSave;
  S.exportSaveCode = exportSaveCode;
  S.importSaveCode = importSaveCode;
})();
