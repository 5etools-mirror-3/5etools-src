// [PERSONAL] DH 2026-03-24 — War Table: main controller and session state manager

/**
 * WarTableState — Central state manager for the War Table feature.
 *
 * Manages a shared session state object persisted to localStorage.
 * Uses a simple event emitter pattern for cross-module reactivity.
 * Both the Spell Loadout Planner and Encounter Forecast Panel
 * read from and write to this shared state.
 */
globalThis.WarTableState = class {
	static STORAGE_KEY = "war-table-state";

	// -- Spell slot progression tables (full / half / third caster) ----------
	// Index 0 = level 1, index 19 = level 20
	// Each entry is an array of 9 values for slot levels 1-9.
	static SLOT_PROGRESSION = {
		full: [
			[2,0,0,0,0,0,0,0,0], // 1
			[3,0,0,0,0,0,0,0,0], // 2
			[4,2,0,0,0,0,0,0,0], // 3
			[4,3,0,0,0,0,0,0,0], // 4
			[4,3,2,0,0,0,0,0,0], // 5
			[4,3,3,0,0,0,0,0,0], // 6
			[4,3,3,1,0,0,0,0,0], // 7
			[4,3,3,2,0,0,0,0,0], // 8
			[4,3,3,3,1,0,0,0,0], // 9
			[4,3,3,3,2,0,0,0,0], // 10
			[4,3,3,3,2,1,0,0,0], // 11
			[4,3,3,3,2,1,0,0,0], // 12
			[4,3,3,3,2,1,1,0,0], // 13
			[4,3,3,3,2,1,1,0,0], // 14
			[4,3,3,3,2,1,1,1,0], // 15
			[4,3,3,3,2,1,1,1,0], // 16
			[4,3,3,3,2,1,1,1,1], // 17
			[4,3,3,3,3,1,1,1,1], // 18
			[4,3,3,3,3,2,1,1,1], // 19
			[4,3,3,3,3,2,2,1,1], // 20
		],
		half: [
			[0,0,0,0,0,0,0,0,0], // 1
			[2,0,0,0,0,0,0,0,0], // 2
			[3,0,0,0,0,0,0,0,0], // 3
			[3,0,0,0,0,0,0,0,0], // 4
			[4,2,0,0,0,0,0,0,0], // 5
			[4,2,0,0,0,0,0,0,0], // 6
			[4,3,0,0,0,0,0,0,0], // 7
			[4,3,0,0,0,0,0,0,0], // 8
			[4,3,2,0,0,0,0,0,0], // 9
			[4,3,2,0,0,0,0,0,0], // 10
			[4,3,3,0,0,0,0,0,0], // 11
			[4,3,3,0,0,0,0,0,0], // 12
			[4,3,3,1,0,0,0,0,0], // 13
			[4,3,3,1,0,0,0,0,0], // 14
			[4,3,3,2,0,0,0,0,0], // 15
			[4,3,3,2,0,0,0,0,0], // 16
			[4,3,3,3,1,0,0,0,0], // 17
			[4,3,3,3,1,0,0,0,0], // 18
			[4,3,3,3,2,0,0,0,0], // 19
			[4,3,3,3,2,0,0,0,0], // 20
		],
		third: [
			[0,0,0,0,0,0,0,0,0], // 1
			[0,0,0,0,0,0,0,0,0], // 2
			[2,0,0,0,0,0,0,0,0], // 3
			[3,0,0,0,0,0,0,0,0], // 4
			[3,0,0,0,0,0,0,0,0], // 5
			[3,0,0,0,0,0,0,0,0], // 6
			[4,2,0,0,0,0,0,0,0], // 7
			[4,2,0,0,0,0,0,0,0], // 8
			[4,2,0,0,0,0,0,0,0], // 9
			[4,3,0,0,0,0,0,0,0], // 10
			[4,3,0,0,0,0,0,0,0], // 11
			[4,3,0,0,0,0,0,0,0], // 12
			[4,3,2,0,0,0,0,0,0], // 13
			[4,3,2,0,0,0,0,0,0], // 14
			[4,3,2,0,0,0,0,0,0], // 15
			[4,3,3,0,0,0,0,0,0], // 16
			[4,3,3,0,0,0,0,0,0], // 17
			[4,3,3,0,0,0,0,0,0], // 18
			[4,3,3,1,0,0,0,0,0], // 19
			[4,3,3,1,0,0,0,0,0], // 20
		],
		pact: [
			[1,0,0,0,0,0,0,0,0], // 1
			[2,0,0,0,0,0,0,0,0], // 2
			[0,2,0,0,0,0,0,0,0], // 3
			[0,2,0,0,0,0,0,0,0], // 4
			[0,0,2,0,0,0,0,0,0], // 5
			[0,0,2,0,0,0,0,0,0], // 6
			[0,0,0,2,0,0,0,0,0], // 7
			[0,0,0,2,0,0,0,0,0], // 8
			[0,0,0,0,2,0,0,0,0], // 9
			[0,0,0,0,2,0,0,0,0], // 10
			[0,0,0,0,3,0,0,0,0], // 11
			[0,0,0,0,3,0,0,0,0], // 12
			[0,0,0,0,3,0,0,0,0], // 13
			[0,0,0,0,3,0,0,0,0], // 14
			[0,0,0,0,3,0,0,0,0], // 15
			[0,0,0,0,3,0,0,0,0], // 16
			[0,0,0,0,4,0,0,0,0], // 17
			[0,0,0,0,4,0,0,0,0], // 18
			[0,0,0,0,4,0,0,0,0], // 19
			[0,0,0,0,4,0,0,0,0], // 20
		],
	};

	// -- Caster type by class name -------------------------------------------
	static CASTER_TYPE = {
		"Wizard": "full",
		"Cleric": "full",
		"Druid": "full",
		"Bard": "full",
		"Sorcerer": "full",
		"Paladin": "half",
		"Ranger": "half",
		"Artificer": "half",
		"Fighter": "third", // Eldritch Knight
		"Rogue": "third", // Arcane Trickster
		"Warlock": "pact",
	};

	// -- Spellcasting ability by class ---------------------------------------
	static CASTING_ABILITY = {
		"Wizard": "int",
		"Artificer": "int",
		"Fighter": "int", // Eldritch Knight
		"Rogue": "int", // Arcane Trickster
		"Cleric": "wis",
		"Druid": "wis",
		"Ranger": "wis",
		"Monk": "wis",
		"Bard": "cha",
		"Sorcerer": "cha",
		"Paladin": "cha",
		"Warlock": "cha",
	};

	// -- Prepared spell formula by class -------------------------------------
	// Returns max prepared spells given level and ability modifier.
	// "known" means the class uses spells known, not preparation.
	static PREPARED_FORMULA = {
		"Wizard": (level, mod) => level + mod,
		"Cleric": (level, mod) => level + mod,
		"Druid": (level, mod) => level + mod,
		"Paladin": (level, mod) => Math.max(1, Math.floor(level / 2) + mod),
		"Artificer": (level, mod) => Math.max(1, Math.floor(level / 2) + mod),
		"Ranger": "known",
		"Bard": "known",
		"Sorcerer": "known",
		"Warlock": "known",
		"Fighter": "known",
		"Rogue": "known",
	};

	// -- Default state factory -----------------------------------------------
	static getDefaultState () {
		return {
			// Character profile
			character: {
				className: "Wizard",
				subclass: "",
				level: 1,
				spellcastingModifier: 3, // ability modifier (e.g. Int mod)
				saveDC: 13,
				spellAttackBonus: 5,
				features: {
					warCaster: false,
					resilientCon: false,
					arcaneAbeyance: false,
					clockworkSpell: false,
				},
			},

			// Prepared spell list — each entry: {name, source}
			preparedSpells: [],

			// Spell slots: levels 1-9, max and current
			spellSlots: {
				max: [2, 0, 0, 0, 0, 0, 0, 0, 0],
				current: [2, 0, 0, 0, 0, 0, 0, 0, 0],
			},

			// Arcane Abeyance bead
			arcaneAbeyance: {
				storedSpell: null, // {name, source, level} or null
			},

			// Session forecast inputs
			forecast: {
				combatIntensity: "moderate", // light | moderate | heavy
				encounterScale: "unknown", // single | multiple | unknown
				environment: "mixed", // dungeon | wilderness | urban | social | mixed
				restAvailability: "longRest", // longRest | shortRests | noRests
			},

			// Encounter list — each: {id, name, monsters: [{name, source, count}], partySize, partyLevel}
			encounters: [],

			// Session mode
			mode: "planning", // planning | live

			// Live session state
			liveSession: {
				activeConcentration: null, // {name, source} or null
				castLog: [], // [{name, source, slotLevel, timestamp}]
			},
		};
	}

	// -- Constructor ---------------------------------------------------------
	constructor () {
		this._state = null;
		this._listeners = {}; // event -> [callback]
		this._init();
	}

	// -- Initialization ------------------------------------------------------
	_init () {
		const stored = this._loadFromStorage();
		if (stored) {
			// Merge with defaults to pick up any new fields added in updates
			this._state = this._mergeDefaults(WarTableState.getDefaultState(), stored);
		} else {
			this._state = WarTableState.getDefaultState();
		}
		this._recalcSlots();
	}

	_mergeDefaults (defaults, stored) {
		const merged = {};
		for (const key of Object.keys(defaults)) {
			if (stored[key] === undefined) {
				merged[key] = defaults[key];
			} else if (
				typeof defaults[key] === "object"
				&& defaults[key] !== null
				&& !Array.isArray(defaults[key])
			) {
				merged[key] = this._mergeDefaults(defaults[key], stored[key]);
			} else {
				merged[key] = stored[key];
			}
		}
		return merged;
	}

	// -- Persistence ---------------------------------------------------------
	_loadFromStorage () {
		try {
			const raw = localStorage.getItem(WarTableState.STORAGE_KEY);
			if (!raw) return null;
			return JSON.parse(raw);
		} catch (e) {
			console.error("WarTable: Failed to load state from localStorage", e);
			return null;
		}
	}

	_saveToStorage () {
		try {
			localStorage.setItem(WarTableState.STORAGE_KEY, JSON.stringify(this._state));
		} catch (e) {
			console.error("WarTable: Failed to save state to localStorage", e);
		}
	}

	// -- Event emitter -------------------------------------------------------
	on (event, callback) {
		if (!this._listeners[event]) this._listeners[event] = [];
		this._listeners[event].push(callback);
		return this; // allow chaining
	}

	off (event, callback) {
		if (!this._listeners[event]) return this;
		this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
		return this;
	}

	_emit (event, data) {
		if (!this._listeners[event]) return;
		for (const cb of this._listeners[event]) {
			try { cb(data); } catch (e) { console.error(`WarTable: Error in listener for "${event}"`, e); }
		}
	}

	// -- State access --------------------------------------------------------
	getState () { return this._state; }

	getCharacter () { return this._state.character; }
	getPreparedSpells () { return this._state.preparedSpells; }
	getSpellSlots () { return this._state.spellSlots; }
	getArcaneAbeyance () { return this._state.arcaneAbeyance; }
	getForecast () { return this._state.forecast; }
	getEncounters () { return this._state.encounters; }
	getMode () { return this._state.mode; }
	getLiveSession () { return this._state.liveSession; }

	// -- State mutation (always triggers save + emit) ------------------------
	_commit (event) {
		this._saveToStorage();
		this._emit(event || "stateChange", this._state);
		this._emit("recalculate", this._state);
	}

	setCharacter (updates) {
		Object.assign(this._state.character, updates);
		this._recalcSlots();
		this._commit("characterChange");
	}

	setCharacterFeatures (updates) {
		Object.assign(this._state.character.features, updates);
		this._commit("characterChange");
	}

	setPreparedSpells (spells) {
		this._state.preparedSpells = [...spells];
		this._commit("preparedSpellsChange");
	}

	addPreparedSpell (spell) {
		// Avoid duplicates by name+source
		const exists = this._state.preparedSpells.some(
			s => s.name === spell.name && s.source === spell.source,
		);
		if (exists) return false;
		this._state.preparedSpells.push({...spell});
		this._commit("preparedSpellsChange");
		return true;
	}

	removePreparedSpell (name, source) {
		this._state.preparedSpells = this._state.preparedSpells.filter(
			s => !(s.name === name && s.source === source),
		);
		this._commit("preparedSpellsChange");
	}

	setSpellSlotCurrent (levelIndex, value) {
		this._state.spellSlots.current[levelIndex] = Math.max(
			0,
			Math.min(value, this._state.spellSlots.max[levelIndex]),
		);
		this._commit("slotsChange");
	}

	expendSlot (levelIndex) {
		if (this._state.spellSlots.current[levelIndex] > 0) {
			this._state.spellSlots.current[levelIndex]--;
			this._commit("slotsChange");
			return true;
		}
		return false;
	}

	restoreSlot (levelIndex) {
		if (this._state.spellSlots.current[levelIndex] < this._state.spellSlots.max[levelIndex]) {
			this._state.spellSlots.current[levelIndex]++;
			this._commit("slotsChange");
			return true;
		}
		return false;
	}

	restoreAllSlots () {
		this._state.spellSlots.current = [...this._state.spellSlots.max];
		this._commit("slotsChange");
	}

	setArcaneAbeyance (spell) {
		this._state.arcaneAbeyance.storedSpell = spell ? {...spell} : null;
		this._commit("abeyanceChange");
	}

	setForecast (updates) {
		Object.assign(this._state.forecast, updates);
		this._commit("forecastChange");
	}

	addEncounter (encounter) {
		const id = `enc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
		this._state.encounters.push({
			id,
			name: encounter.name || `Encounter ${this._state.encounters.length + 1}`,
			monsters: encounter.monsters || [],
			partySize: encounter.partySize || 4,
			partyLevel: encounter.partyLevel || 1,
		});
		this._commit("encountersChange");
		return id;
	}

	updateEncounter (id, updates) {
		const enc = this._state.encounters.find(e => e.id === id);
		if (!enc) return false;
		Object.assign(enc, updates);
		this._commit("encountersChange");
		return true;
	}

	removeEncounter (id) {
		this._state.encounters = this._state.encounters.filter(e => e.id !== id);
		this._commit("encountersChange");
	}

	setMode (mode) {
		this._state.mode = mode;
		this._commit("modeChange");
	}

	setActiveConcentration (spell) {
		this._state.liveSession.activeConcentration = spell ? {...spell} : null;
		this._commit("liveSessionChange");
	}

	addCastLogEntry (entry) {
		this._state.liveSession.castLog.push({
			...entry,
			timestamp: Date.now(),
		});
		this._commit("liveSessionChange");
	}

	clearCastLog () {
		this._state.liveSession.castLog = [];
		this._commit("liveSessionChange");
	}

	// -- Slot recalculation --------------------------------------------------
	_recalcSlots () {
		const {className, level} = this._state.character;
		const casterType = WarTableState.CASTER_TYPE[className];
		if (!casterType || !WarTableState.SLOT_PROGRESSION[casterType]) {
			this._state.spellSlots.max = [0, 0, 0, 0, 0, 0, 0, 0, 0];
		} else {
			const lvlIdx = Math.max(0, Math.min(19, level - 1));
			this._state.spellSlots.max = [...WarTableState.SLOT_PROGRESSION[casterType][lvlIdx]];
		}
		// Clamp current slots to new max
		this._state.spellSlots.current = this._state.spellSlots.current.map(
			(cur, i) => Math.min(cur, this._state.spellSlots.max[i]),
		);
	}

	// -- Prepared spell count ------------------------------------------------
	getMaxPreparedSpells () {
		const {className, level, spellcastingModifier} = this._state.character;
		const formula = WarTableState.PREPARED_FORMULA[className];
		if (!formula) return null;
		if (formula === "known") return null; // spells-known classes don't have a prep limit
		return Math.max(1, formula(level, spellcastingModifier));
	}

	// -- Export / Import -----------------------------------------------------
	exportJSON () {
		return JSON.stringify(this._state, null, "\t");
	}

	importJSON (jsonString) {
		try {
			const parsed = JSON.parse(jsonString);
			this._state = this._mergeDefaults(WarTableState.getDefaultState(), parsed);
			this._recalcSlots();
			this._commit("stateChange");
			return true;
		} catch (e) {
			console.error("WarTable: Failed to import JSON", e);
			return false;
		}
	}

	resetState () {
		this._state = WarTableState.getDefaultState();
		this._commit("stateChange");
	}

	// -- Singleton -----------------------------------------------------------
	static _instance = null;

	static getInstance () {
		if (!WarTableState._instance) {
			WarTableState._instance = new WarTableState();
		}
		return WarTableState._instance;
	}
};
