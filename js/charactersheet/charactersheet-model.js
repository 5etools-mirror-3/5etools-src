import {CHAR_SHEET_ABILITIES, CHAR_SHEET_SCHEMA_VERSION, CHAR_SHEET_SKILLS, EXPENDABLE_RESOURCES, getSkillKeyByName} from "./charactersheet-consts.js";
import {getChoiceReversal, getEntitySkillNames, getProfListDisplay, getSkillNamesFromRecords} from "./charactersheet-choices.js";
import {getClassProficiencies, getEntityProficiencies, getMulticlassProficiencies} from "./charactersheet-proficiencies.js";
import {getEntityDefenses} from "./charactersheet-defenses.js";
import {formatSpeeds, getNaturalArmor, getSpeciesTraitNames, getSpeeds, getTraitTags} from "./charactersheet-appearance.js";
import {THEME_SITE} from "./charactersheet-theme.js";
import {getStateWithMigratedAbilityNotes} from "./charactersheet-charstore.js";
import {getAmmoRecovered, getChargesAfterRest} from "./charactersheet-equipment.js";
import {
	EV_AMMO_FIRED,
	EV_AMMO_RECOVERED,
	EV_CHARGE,
	EV_CONDITION,
	EV_RESOURCE,
	EV_REST,
	EV_SESSION,
	EV_SLOT,
	appendJournalEvent,
} from "./charactersheet-journal.js";
import {
	getCreatureTraitEntries,
	getSidekickRoleOfCreature,
	getSidekickTypeOfCreature,
} from "./charactersheet-sidekick.js";

/**
 * The character data model: single source of truth for the sheet.
 *
 * Rendering is one-directional (`state → DOM`); user input mutates this model, and `BaseComponent`
 * hooks drive re-renders. The DOM is never read back to determine character state.
 *
 * Numeric input-backed props are `number | null` (null = blank input). Free-text fields
 * (`featuresText`, `proficienciesText`, ...) are deliberately retained alongside the structured
 * fields as an overrides/notes escape hatch for homebrew and edge cases.
 */
export class CharacterModel extends BaseComponent {
	static _LEGACY_FIELD_TO_PROP_STR = {
		"cs-name": "name",
		"cs-playername": "playerName",
		"cs-classlevel": "classText",
		"cs-background": "backgroundText",
		"cs-species": "speciesText",
		"cs-alignment": "alignment",
		"cs-speed": "speed",
		"cs-hd-total": "hdTotal",
		"cs-hd-cur": "hdCur",
		"cs-spell-ability": "spellAbility",
		"cs-spells": "spellsText",
		"cs-features": "featuresText",
		"cs-equipment": "equipmentText",
		"cs-proficiencies": "proficienciesText",
		"cs-personality": "personalityText",
	};

	static _LEGACY_FIELD_TO_PROP_NUM = {
		"cs-xp": "xp",
		"cs-ac": "ac",
		"cs-hp-max": "hpMax",
		"cs-hp-cur": "hpCur",
		"cs-hp-temp": "hpTemp",
		"cs-cp": "cp",
		"cs-sp": "sp",
		"cs-ep": "ep",
		"cs-gp": "gp",
		"cs-pp": "pp",
	};

	constructor () {
		super();
		// Keep the single-class level in sync with the manual level field until true multiclass UI exists (Phase 2)
		this._addHookBase("level", () => this._syncSingleClassLevel());
	}

	_getDefaultState () {
		const out = {
			name: "",
			playerName: "",
			alignment: "",
			xp: null,

			classText: "",
			backgroundText: "",
			speciesText: "",

			// The look this character is read in, stored with the character rather than the browser —
			// see `charactersheet-theme.js`. "site" changes nothing, which is what every character
			// built before this existed gets
			theme: THEME_SITE,

			// Structured entity references, populated by the pickers; the `*Text` fields above remain
			// free-text overrides
			isSidekick: false, // a sidekick is a stat block plus levels in a sidekick class
			refCreature: null, // {name, source, tag} — the stat block a sidekick started from
			sidekickHitDie: null, // faces of the die it gains per level, from its stat block
			sidekickType: null, // "expert" | "spellcaster" | "warrior" — the Essentials Kit sidekick
			sidekickRole: null, // "healer" | "mage" | "attacker" | "defender" — its specialisation
			sidekickTraits: [], // [{id, section, name, text, level}] — traits/actions, one row each
			refSpecies: null, // {name, source, tag}
			refBackground: null, // {name, source, tag}
			classes: [], // [{id, name, source, level, hdFaces, subclass: null | {name, shortName, source}}]
			pickTags: {}, // {species, background, class} → renderable `{@...}` tags for the header links

			level: 1,
			ac: 10, // manual AC (used when acMode === "manual")
			acMode: "auto", // "auto" | "barbarian" | "monk" | "manual"
			acMisc: 0, // flat misc bonus added to computed AC
			initMisc: 0,
			speed: "30 ft.",
			// Which size, when the species offers a choice ("Small or Medium" — 30 of them do). Stored
			// as the data's abbreviation; blank means unanswered, not Medium.
			size: "",
			creatureTypes: [], // what kind of creature the species is — a Plasmoid is an Ooze, not a Humanoid
			// The parenthetical half of the type: a Bugbear is "Humanoid (Goblinoid)", and it is the
			// tag that spells and features actually name
			creatureTypeTags: [],
			// The species' `traitTags`. Kept because one of them is a number: Powerful Build doubles
			// carrying capacity, and the entity is not around when the inventory is totalled.
			speciesTraitTags: [],
			// The species' trait names, for the few that change a number: Dwarven Toughness
			speciesTraitNames: [],
			// A species' own AC formula — a Tortle's shell, a Lizardfolk's scales — read off its trait
			naturalArmor: null,

			hpMax: 0,
			hpCur: 0,
			hpTemp: 0,
			hdTotal: "",
			hdCur: "",

			deathSuccess: 0,
			deathFail: 0,
			inspiration: false,

			conditions: [], // active condition names
			exhaustion: 0, // 0–6
			concentration: "", // what the character is concentrating on
			hpPolicy: "ask", // "ask" | "average" | "max" | "roll" — how the level-up prompt gains HP

			attacks: [], // [{id, name, atkBonus, damage}]
			inventory: [], // [{id, name, source, quantity, weightLb}]
			weaponMasteries: [], // inventory weapon names whose mastery property is active
			originFeats: [], // [{id, name, source, bonuses}] — feats granted by a 2024 background
			featureFeats: [], // [{id, entryId, featureKey, category, name, source, bonuses}] — feats a class feature grants (Fighting Style, Epic Boon, ...)
			manualFeats: [], // [{id, name, source, note, bonuses}] — feats granted outside the rules (training, story rewards)

			spellAbility: "",
			spellsText: "",
			spellsKnown: [], // [{id, name, source, level}]
			grantedSpellChoices: [], // [{id, grantKey, name, source, level}] — picks for `additionalSpells` {choose} grants
			spellGroups: [], // [{key, index}] — which alternative `additionalSpells` group an entity was taken with (a Circle of the Land's terrain)
			slotsUsed: {}, // {"1": n, ..., "9": n, pact: n}
			resourcesUsed: {}, // {resourceLabel: n} — expended class resources (Rages, Ki, Wild Shape, ...)
			sourceFilter: {mode: "all", sources: {}}, // which books this character may pick content from
			abilityBonusLog: [], // [{id, source, bonuses}] — provenance for ability-score increases
			proficiencies: [], // [{id, kind, name, source}] — armor/weapon/tool/language, with what granted each
			defenses: [], // [{id, kind, name, note, source}] — resistances/immunities/vulnerabilities/senses (gear is derived, not stored)
			traitChoices: [], // [{id, source, trait, level, option, resist}] — "choose one" species traits
			pendingAbilityOffers: [], // [{id, source, offer, packages}] — ability increases offered but not yet assigned
			// [{sig, sourceName, type, picks}] — the choices a species or background asked for and
			// somebody answered. Recorded because a *skill* keeps no note of where it came from, so
			// without this nothing could tell "Perception, granted by Sailor" from "Perception,
			// chosen for the Rogue" — and the guided setup and the panels each guessed differently.
			choiceLog: [],
			journal: [], // [{t, k, v, n}] — what happened at the table, grouped into sessions on read

			portrait: "", // a data URL, downscaled on import — it shares localStorage with everything else
			appearanceAge: "",
			appearanceHeight: "",
			appearanceWeight: "",
			appearanceEyes: "",
			appearanceSkin: "",
			appearanceHair: "",

			featuresText: "",
			equipmentText: "",
			proficienciesText: "",
			personalityText: "",

			cp: 0,
			sp: 0,
			ep: 0,
			gp: 0,
			pp: 0,
		};

		CHAR_SHEET_ABILITIES.forEach(([abv]) => {
			out[`abil_${abv}`] = 10;
			out[`save_${abv}`] = false;
		});
		CHAR_SHEET_SKILLS.forEach(({key}) => out[`skill_${key}`] = 0);

		return out;
	}

	getLevelNumber () {
		return Math.min(20, Math.max(1, Number(this._state.level) || 1));
	}

	/* -------------------------------------------- Mutators -------------------------------------------- */

	addAttack (data = {}) {
		this._state.attacks = [
			...this._state.attacks,
			{
				id: CryptUtil.uid(),
				name: data.name || "",
				atkBonus: data.atkBonus != null ? Number(data.atkBonus) : 0,
				damage: data.damage || "",
				// Kept so a row derived from a weapon can explain where its numbers came from
				atkParts: data.atkParts || null,
				damageParts: data.damageParts || null,
			},
		];
	}

	updateAttack (id, data) {
		const atk = this._state.attacks.find(it => it.id === id);
		if (!atk) return;
		Object.assign(atk, data);
		this._triggerCollectionUpdate("attacks");
	}

	removeAttack (id) {
		this._state.attacks = this._state.attacks.filter(it => it.id !== id);
	}

	setPickTag (which, tag) {
		this._state.pickTags = {...this._state.pickTags, [which]: tag};
	}

	/* -------------------------------------------- Inventory -------------------------------------------- */

	/** Add an item; stacking onto an existing row when name/source match. Extra fields (armor/weapon
	 *  metadata from `getInventoryItemMeta`) are stored on the row for AC/attack derivation. */
	addInventoryItem ({name, source, quantity = 1, weightLb = null, ...meta}) {
		const existing = this._state.inventory.find(it => it.name === name && it.source === source);
		if (existing) {
			existing.quantity = (Number(existing.quantity) || 0) + quantity;
			this._triggerCollectionUpdate("inventory");
			return;
		}
		this._state.inventory = [
			...this._state.inventory,
			{id: CryptUtil.uid(), name, source, quantity, weightLb, equipped: false, attuned: false, ...meta},
		];
	}

	updateInventoryItem (id, data) {
		const item = this._state.inventory.find(it => it.id === id);
		if (!item) return;
		Object.assign(item, data);
		this._triggerCollectionUpdate("inventory");
	}

	removeInventoryItem (id) {
		this._state.inventory = this._state.inventory.filter(it => it.id !== id);
	}

	/* -------------------------------------------- Spells -------------------------------------------- */

	/** @return `false` if the spell was already known (for that class) */
	addKnownSpell ({name, source, level, className = null, ritual = false, castTime = null}) {
		if (this._state.spellsKnown.some(it => it.name === name && it.source === source && (it.className || null) === (className || null))) return false;
		this._state.spellsKnown = [
			...this._state.spellsKnown,
			{id: CryptUtil.uid(), name, source, level: Number(level) || 0, className, ritual: !!ritual, castTime},
		];
		return true;
	}

	removeKnownSpell (id) {
		this._state.spellsKnown = this._state.spellsKnown.filter(it => it.id !== id);
	}

	/** Record a pick for a dynamic `additionalSpells` {choose} grant, scoped to that grant. */
	addGrantedSpellChoice ({grantKey, name, source, level, className = null}) {
		const cur = this._state.grantedSpellChoices || [];
		if (cur.some(it => it.grantKey === grantKey && it.name === name && it.source === source)) return false;
		this._state.grantedSpellChoices = [...cur, {id: CryptUtil.uid(), grantKey, name, source, level: Number(level) || 0, className}];
		return true;
	}

	/** Which of an entity's alternative spell groups the character took (`key` from `getSpellGroupKey`). */
	setSpellGroup (key, index) {
		if (!key) return;
		this._state.spellGroups = [...(this._state.spellGroups || []).filter(it => it.key !== key), {key, index: Number(index) || 0}];
	}

	removeGrantedSpellChoice (id) {
		this._state.grantedSpellChoices = (this._state.grantedSpellChoices || []).filter(it => it.id !== id);
	}

	/**
	 * Replace the known/prepared spells attributed to `className` with `spells`
	 * (each `{name, source, level, ritual}`), preserving spells of other classes and
	 * the ids of any that are retained. Used by the class-filtered spell manager.
	 */
	setKnownSpellsForClass (className, spells) {
		const key = className || null;
		const others = this._state.spellsKnown.filter(it => (it.className || null) !== key);
		const existingById = new Map(this._state.spellsKnown
			.filter(it => (it.className || null) === key)
			.map(it => [`${it.name}|${it.source}`, it.id]));
		const forClass = spells.map(sp => ({
			id: existingById.get(`${sp.name}|${sp.source}`) || CryptUtil.uid(),
			name: sp.name,
			source: sp.source,
			level: Number(sp.level) || 0,
			className: key,
			ritual: !!sp.ritual,
			castTime: sp.castTime ?? null,
		}));
		this._state.spellsKnown = [...others, ...forClass];
	}

	/** Set the number of expended slots for a spell level (1-9) or "pact". */
	/** Record a background-granted origin feat and apply its ability bonuses (no duplicates by name/source). */
	/**
	 * @param from the entity that granted it — "Sailor", "Human". Recorded because more than one can
	 *        grant one, and a panel that has to guess which of them a feat belongs to guesses wrong.
	 */
	addOriginFeat ({name, source, displayName = null, bonuses = null, from = null, isRepeatable = false}) {
		// A feat the book marks repeatable may be held twice; anything else is a duplicate. Without
		// this the picker would offer a second Skilled and then drop it on the floor.
		if (!isRepeatable && this._state.originFeats.some(it => it.name === name && it.source === source)) return false;
		const id = CryptUtil.uid();
		this._state.originFeats = [...this._state.originFeats, {id, name, source, displayName: displayName || name, bonuses, from}];
		if (bonuses) this.applyAbilityBonuses(bonuses, {source: `${displayName || name} (feat)`, logId: id});
		return true;
	}

	removeOriginFeat (id) {
		const feat = this._state.originFeats.find(it => it.id === id);
		if (!feat) return;
		this._takeBackFeat(feat.name, {exceptId: id});
		if (feat.bonuses) this.applyAbilityBonuses(feat.bonuses, {isRevert: true, logId: id});
		this._state.originFeats = this._state.originFeats.filter(it => it.id !== id);
	}

	/** Record a feat granted by a class feature (Fighting Style, Epic Boon, ...), scoped to that feature occurrence. */
	addFeatureFeat ({entryId, featureKey, category, name, source, bonuses = null}) {
		if (this._state.featureFeats.some(it => it.entryId === entryId && it.featureKey === featureKey && it.name === name && it.source === source)) return false;
		const id = CryptUtil.uid();
		this._state.featureFeats = [...this._state.featureFeats, {id, entryId, featureKey, category, name, source, bonuses}];
		if (bonuses) this.applyAbilityBonuses(bonuses, {source: `${name} (feat)`, logId: id});
		return true;
	}

	removeFeatureFeat (id) {
		const feat = this._state.featureFeats.find(it => it.id === id);
		if (!feat) return;
		this._takeBackFeat(feat.name, {exceptId: id});
		if (feat.bonuses) this.applyAbilityBonuses(feat.bonuses, {isRevert: true, logId: id});
		this._state.featureFeats = this._state.featureFeats.filter(it => it.id !== id);
	}

	/**
	 * Record a feat granted outside the normal progression — a DM award for training or a story
	 * beat. Kept separate from ASI-slot feats so it never consumes a slot the character has earned.
	 */
	addManualFeat ({name, source, note = "", bonuses = null}) {
		const cur = this._state.manualFeats || [];
		if (cur.some(it => it.name === name && it.source === source)) return false;
		const id = CryptUtil.uid();
		this._state.manualFeats = [...cur, {id, name, source, note, bonuses}];
		if (bonuses) this.applyAbilityBonuses(bonuses, {source: `${name} (feat)`, logId: id});
		return true;
	}

	removeManualFeat (id) {
		const feat = (this._state.manualFeats || []).find(it => it.id === id);
		if (!feat) return;
		this._takeBackFeat(feat.name, {exceptId: id});
		if (feat.bonuses) this.applyAbilityBonuses(feat.bonuses, {isRevert: true, logId: id});
		this._state.manualFeats = this._state.manualFeats.filter(it => it.id !== id);
	}

	setManualFeatNote (id, note) {
		const feat = (this._state.manualFeats || []).find(it => it.id === id);
		if (!feat) return;
		feat.note = note;
		this._triggerCollectionUpdate("manualFeats");
	}

	/* -------------------------------------------- Proficiencies -------------------------------------------- */

	/**
	 * Record armor/weapon/tool/language proficiencies granted by a source. Re-applying the same
	 * source replaces its previous grants, so re-picking a class or background does not duplicate
	 * them and dropping one removes exactly what it gave.
	 */
	setProficienciesFromSource (source, entries) {
		const kept = (this._state.proficiencies || []).filter(it => it.source !== source);
		const added = (entries || [])
			.filter(it => it?.name)
			.map(it => ({id: CryptUtil.uid(), kind: it.kind, name: it.name, source, isOptional: !!it.isOptional}));
		this._state.proficiencies = [...kept, ...added];
	}

	/** Add a single proficiency (a resolved choice, or one added by hand). */
	addProficiency ({kind, name, source}) {
		if (!name) return false;
		const cur = this._state.proficiencies || [];
		if (cur.some(it => it.kind === kind && it.name.toLowerCase() === name.toLowerCase() && it.source === source)) return false;
		this._state.proficiencies = [...cur, {id: CryptUtil.uid(), kind, name, source, isOptional: false}];
		return true;
	}

	removeProficiency (id) {
		this._state.proficiencies = (this._state.proficiencies || []).filter(it => it.id !== id);
	}

	/* -------------------------------------------- Defenses & senses -------------------------------------------- */

	/**
	 * Replace what one source grants, the way proficiencies work. Gear is *not* stored: an equipped
	 * item's resistances are derived, so unequipping it takes them away again.
	 */
	setDefensesFromSource (source, entries) {
		const kept = (this._state.defenses || []).filter(it => it.source !== source);
		const added = (entries || [])
			.filter(it => it?.name)
			.map(it => ({id: CryptUtil.uid(), kind: it.kind, name: it.name, note: it.note || null, source}));
		this._state.defenses = [...kept, ...added];
	}

	/** Add a single defense or sense (a resolved choice, or one added by hand). */
	addDefense ({kind, name, source, note = null}) {
		if (!name) return false;
		const cur = this._state.defenses || [];
		if (cur.some(it => it.kind === kind && it.name.toLowerCase() === name.toLowerCase() && it.source === source)) return false;
		this._state.defenses = [...cur, {id: CryptUtil.uid(), kind, name, note, source}];
		return true;
	}

	removeDefense (id) {
		this._state.defenses = (this._state.defenses || []).filter(it => it.id !== id);
	}

	/* -------------------------------------------- Unassigned ability increases -------------------------------------------- */

	/**
	 * Remember an ability-score increase that was offered and not taken, so the sheet can offer it
	 * again rather than leaving a note in the box forever. The packages come along, which is what
	 * makes "assign it now" possible later.
	 */
	addPendingAbilityOffer ({source, offer, packages = null}) {
		const cur = this._state.pendingAbilityOffers || [];
		if (cur.some(it => it.source === source && it.offer === offer)) return false;
		this._state.pendingAbilityOffers = [...cur, {id: CryptUtil.uid(), source, offer, packages}];
		return true;
	}

	removePendingAbilityOffer (id) {
		this._state.pendingAbilityOffers = (this._state.pendingAbilityOffers || []).filter(it => it.id !== id);
	}

	/** Drop every outstanding offer from one source — it was assigned, or the source itself is gone. */
	clearPendingAbilityOffers (source) {
		this._state.pendingAbilityOffers = (this._state.pendingAbilityOffers || []).filter(it => it.source !== source);
	}

	/* -------------------------------------------- "Choose one" trait picks -------------------------------------------- */

	/**
	 * Record the option picked for a species trait such as Elven Lineage or Draconic Ancestry.
	 * Picking again for the same trait replaces the earlier answer; `option` of `null` clears it.
	 */
	setTraitChoice ({source, trait, level = 1, option, resist = null}) {
		const kept = (this._state.traitChoices || []).filter(it => !(it.source === source && it.trait === trait));
		this._state.traitChoices = option
			? [...kept, {id: CryptUtil.uid(), source, trait, level, option, resist}]
			: kept;
	}

	getTraitChoice (source, trait) {
		return (this._state.traitChoices || []).find(it => it.source === source && it.trait === trait) || null;
	}

	/** Drop every trait pick a source gave (when swapping species, say). */
	clearTraitChoicesFromSource (source) {
		this._state.traitChoices = (this._state.traitChoices || []).filter(it => it.source !== source);
	}

	/** Toggle an owned weapon's mastery as active. */
	toggleWeaponMastery (name) {
		const set = new Set(this._state.weaponMasteries || []);
		if (set.has(name)) set.delete(name);
		else set.add(name);
		this._state.weaponMasteries = [...set];
	}

	/* -------------------------------------------- The session journal -------------------------------------------- */

	/**
	 * Record something that happened at the table. Silent while the sheet is loading or switching
	 * character: restoring a saved hit-point total is not damage, and would otherwise write a fight
	 * into the journal every time the page opened.
	 */
	logJournal (k, {v = null, n = null} = {}) {
		if (this._isJournalPaused) return;
		const ev = {k};
		if (v != null) ev.v = v;
		if (n != null) ev.n = n;
		this._state.journal = appendJournalEvent(this._state.journal, ev);
	}

	/** Stop recording (while loading), or start again. */
	setJournalPaused (isPaused) { this._isJournalPaused = !!isPaused; }

	/** Draw a line: whatever comes next belongs to a new session. */
	startJournalSession () {
		this._state.journal = appendJournalEvent(this._state.journal, {k: EV_SESSION});
	}

	clearJournal () { this._state.journal = []; }

	/* -------------------------------------------- Rests & conditions -------------------------------------------- */

	/** Toggle a named condition on/off. */
	toggleCondition (name) {
		const set = new Set(this._state.conditions || []);
		const isAdding = !set.has(name);
		if (isAdding) set.add(name);
		else set.delete(name);
		this._state.conditions = [...set];
		this.logJournal(EV_CONDITION, {n: name, v: isAdding ? 1 : 0});
	}

	/**
	 * A long rest: restore HP to max, clear temporary HP and all spell slots, restore Hit Dice and
	 * death saves, drop concentration, and reduce Exhaustion by one.
	 */
	longRest () {
		this._state.hpCur = Number(this._state.hpMax) || 0;
		this._state.hpTemp = 0;
		this._state.slotsUsed = {};
		this._state.resourcesUsed = {}; // a long rest restores every class resource
		if (this._state.hdTotal) this._state.hdCur = this._state.hdTotal;
		this._state.deathSuccess = 0;
		this._state.deathFail = 0;
		this._state.concentration = "";
		this._state.exhaustion = Math.max(0, (Number(this._state.exhaustion) || 0) - 1);
		this.rechargeItems("long");
		this.logJournal(EV_REST, {n: "long"});
	}

	/** A short rest: restore Pact Magic slots (Warlock) and short-rest class resources (Ki, Wild Shape, ...). */
	shortRest () {
		this._state.slotsUsed = {...this._state.slotsUsed, pact: 0};
		const used = {...this._state.resourcesUsed};
		Object.keys(used).forEach(label => { if (EXPENDABLE_RESOURCES[label] === "short") used[label] = 0; });
		this._state.resourcesUsed = used;
		this.rechargeItems("short");
		this.logJournal(EV_REST, {n: "short"});
	}

	/* -------------------------------------------- Charges & ammunition -------------------------------------------- */

	/**
	 * Give back the charges this rest restores. The amount is often a die roll, so it is rolled here
	 * rather than assumed — a Wand of Fireballs regains 1d6 + 1 at dawn, not all seven.
	 * @return {Array<{name: string, regained: number}>} what came back, for the sheet to report
	 */
	rechargeItems (restKind) {
		const report = [];
		let isChanged = false;

		this._state.inventory.forEach(item => {
			if (!item.chargesMax) return;
			const before = Math.max(0, Number(item.chargesUsed) || 0);
			const after = getChargesAfterRest(item, restKind);
			if (after === before) return;
			item.chargesUsed = after;
			isChanged = true;
			report.push({name: item.name, regained: before - after});
		});

		if (isChanged) this._triggerCollectionUpdate("inventory");
		return report;
	}

	/** Spend or restore charges on one item, clamped to what it can hold. */
	adjustCharges (id, delta) {
		const item = this._state.inventory.find(it => it.id === id);
		if (!item?.chargesMax) return;
		const used = Math.max(0, Number(item.chargesUsed) || 0);
		const after = Math.max(0, Math.min(item.chargesMax, used - delta));
		if (after > used) this.logJournal(EV_CHARGE, {n: item.name, v: after - used});
		item.chargesUsed = after;
		this._triggerCollectionUpdate("inventory");
	}

	/**
	 * Fire a piece of ammunition: one off the pile, and one onto the count of what is lying on the
	 * battlefield waiting to be picked back up.
	 */
	spendAmmo (id, n = 1) {
		const item = this._state.inventory.find(it => it.id === id);
		if (!item) return;
		const have = Math.max(0, Number(item.quantity) || 0);
		const spend = Math.min(have, Math.max(0, n));
		if (!spend) return;
		item.quantity = have - spend;
		item.ammoSpent = (Number(item.ammoSpent) || 0) + spend;
		this.logJournal(EV_AMMO_FIRED, {n: item.name, v: spend});
		this._triggerCollectionUpdate("inventory");
	}

	/** Search the battlefield: half of what was spent comes back, and the rest is gone for good. */
	recoverAmmo (id) {
		const item = this._state.inventory.find(it => it.id === id);
		if (!item?.ammoSpent) return 0;
		const recovered = getAmmoRecovered(item.ammoSpent);
		item.quantity = (Number(item.quantity) || 0) + recovered;
		item.ammoSpent = 0;
		this.logJournal(EV_AMMO_RECOVERED, {n: item.name, v: recovered});
		this._triggerCollectionUpdate("inventory");
		return recovered;
	}

	/** Replace this character's source filter (which books its pickers offer). */
	setSourceFilter (filter) {
		this._state.sourceFilter = {
			mode: filter?.mode || "all",
			sources: {...(filter?.sources || {})},
			// Stored explicitly, both ways round: the default is "prefer the newest", and a character
			// that has opted out has to keep saying so
			isPreferReprints: filter?.isPreferReprints !== false,
		};
	}

	/** Set expended uses of a named class resource (Rages, Ki Points, Wild Shape, ...). */
	setResourceUsed (label, n) {
		const before = Math.max(0, Number((this._state.resourcesUsed || {})[label]) || 0);
		const after = Math.max(0, Number(n) || 0);
		// Only spending is worth recording; a rest giving them back is already logged as the rest
		if (after > before) this.logJournal(EV_RESOURCE, {n: label, v: after - before});
		this._state.resourcesUsed = {...this._state.resourcesUsed, [label]: after};
	}

	setSlotsUsed (level, count) {
		const before = Math.max(0, Number((this._state.slotsUsed || {})[level]) || 0);
		const after = Math.max(0, Number(count) || 0);
		if (after > before) this.logJournal(EV_SLOT, {n: `${level}`, v: after - before});
		this._state.slotsUsed = {...this._state.slotsUsed, [level]: after};
	}

	appendToTextProp (prop, text) {
		if (!text) return;
		const cur = (this._state[prop] || "").trim();
		if (cur.includes(text)) return;
		this._state[prop] = cur ? `${cur}\n${text}` : text;
	}

	/** Set a skill's proficiency state by data name (e.g. "animal handling"), never downgrading. */
	setSkillProfByName (name, val) {
		const key = getSkillKeyByName(name);
		if (!key) return;
		const prop = `skill_${key}`;
		this._state[prop] = Math.max(Number(this._state[prop]) || 0, val);
	}

	/* -------------------------------------------- Sidekicks -------------------------------------------- */

	/**
	 * Apply a stat block as a sidekick's starting point. Everything written here is a suggestion the
	 * DM can overwrite — a sidekick sheet is a scratchpad, not a locked-down character.
	 */
	applySidekickCreature ({doc, ent, seed}) {
		// A search result names the entity `n`; a block we loaded ourselves carries its own `name`
		const name = doc.name ?? doc.n;

		this._state.isSidekick = true;
		this._state.refCreature = {name, source: doc.source, tag: doc.tag};
		this._state.speciesText = name;
		this.setPickTag("species", doc.tag);

		// One of the three published sidekicks carries its type (and, when statted per role, its role)
		const type = getSidekickTypeOfCreature(ent);
		if (type) {
			this._state.sidekickType = type;
			this._state.sidekickRole = getSidekickRoleOfCreature(ent) ?? this._state.sidekickRole;
		}

		Object.entries(seed.abilities || {}).forEach(([abv, score]) => {
			if (`abil_${abv}` in this.__state) this._state[`abil_${abv}`] = score;
		});
		if (seed.hitDie) this._state.sidekickHitDie = seed.hitDie;
		if (seed.ac != null) { this._state.ac = seed.ac; this._state.acMode = "manual"; }
		if (seed.hpMax != null) { this._state.hpMax = seed.hpMax; this._state.hpCur = seed.hpMax; }
		if (seed.speed) this._state.speed = seed.speed;

		Object.entries(seed.skills || {}).forEach(([name, level]) => this.setSkillProfByName(name, level));
		(seed.saves || []).forEach(abv => this._state[`save_${abv}`] = true);

		const notes = [seed.sizeType, seed.sensesText ? `Senses: ${seed.sensesText}` : null, seed.languagesText ? `Languages: ${seed.languagesText}` : null]
			.filter(Boolean)
			.join("\n");
		if (notes) this.appendToTextProp("proficienciesText", notes);

		// The stat block's own traits and actions become editable rows, one per entry
		if (ent) this.setSidekickTraitsFromCreature(ent, {role: this._state.sidekickRole});
	}

	/**
	 * Replace the rows that came from a stat block, keeping everything the DM added by hand and every
	 * feature a level granted — re-picking a creature should not throw away work.
	 */
	setSidekickTraitsFromCreature (ent, {role = null} = {}) {
		const kept = this._state.sidekickTraits.filter(it => it.source !== "creature");
		const seeded = getCreatureTraitEntries(ent, {role})
			.map(it => ({id: CryptUtil.uid(), source: "creature", level: null, ...it}));
		this._state.sidekickTraits = [...seeded, ...kept];
	}

	addSidekickTrait (data = {}) {
		this._state.sidekickTraits = [
			...this._state.sidekickTraits,
			{
				id: CryptUtil.uid(),
				section: data.section || "Trait",
				name: data.name || "",
				text: data.text || "",
				// What put the row there: a stat block, a level's feature, or the DM
				source: data.source || "manual",
				level: data.level ?? null,
			},
		];
	}

	updateSidekickTrait (id, data) {
		const trait = this._state.sidekickTraits.find(it => it.id === id);
		if (!trait) return;
		Object.assign(trait, data);
		this._triggerCollectionUpdate("sidekickTraits");
	}

	removeSidekickTrait (id) {
		this._state.sidekickTraits = this._state.sidekickTraits.filter(it => it.id !== id);
	}

	/** Which of the Essentials Kit sidekicks this is, and (for two of them) its role. */
	setSidekickType (type, {role = null} = {}) {
		this._state.sidekickType = type || null;
		// A role from another type does not carry over
		if (role !== null || !type) this._state.sidekickRole = role;
	}

	setSidekickRole (role) {
		this._state.sidekickRole = role || null;
	}

	/**
	 * Take a level from the Essentials Kit table: its hit-point maximum, and its features as rows.
	 * Applied on the DM's word rather than automatically, because a sidekick's sheet is often
	 * hand-tuned by the time it levels.
	 */
	applyEskLevelFeatures (features) {
		const have = new Set(this._state.sidekickTraits.map(it => `${it.name}|${it.level ?? ""}`));
		const added = features
			.filter(it => !have.has(`${it.name}|${it.level ?? ""}`))
			.map(it => ({
				id: CryptUtil.uid(),
				section: "Feature",
				name: it.name,
				text: it.text,
				source: "level",
				level: it.level ?? null,
			}));
		if (!added.length) return 0;
		this._state.sidekickTraits = [...this._state.sidekickTraits, ...added];
		return added.length;
	}

	/**
	 * Set (or change) the sidekick's class, keeping its level and the hit die from its stat block.
	 * The die is stored on the sidekick rather than the class entry, so picking a creature and
	 * picking a class work in either order.
	 */
	setSidekickClass (cls, {level = null, hdFaces = null} = {}) {
		const existing = this._state.classes[0];
		this._state.classes = [{
			id: existing?.id || CryptUtil.uid(),
			name: cls.name,
			source: cls.source,
			level: level ?? existing?.level ?? this.getLevelNumber(),
			hdFaces: hdFaces ?? this._state.sidekickHitDie ?? existing?.hdFaces ?? null,
			subclass: null,
			optionalFeatures: [],
			asiFeatChoices: existing?.asiFeatChoices || [],
		}];
	}

	/* -------------------------------------------- Entity application -------------------------------------------- */

	/** Apply a picked species/race: search doc bookkeeping + mechanical fields from the entity. */
	/**
	 * @param [opts.prevEnt] the species being replaced, so the skills it granted outright come off too.
	 * @param [opts.keepSkillNames] lower-case skills something else grants outright (the background).
	 */
	applyPickedRace ({doc, ent, prevEnt = null, keepSkillNames = []}) {
		// Swapping species takes what the old one gave with it
		const prev = this._state.refSpecies?.name;
		if (prev && prev !== doc.n) {
			this.clearTraitChoicesFromSource(prev);
			this.setProficienciesFromSource(prev, []);
			this.setDefensesFromSource(prev, []);
			this.clearPendingAbilityOffers(prev);
			// The new species asks its own questions rather than inheriting the old one's answers — and
			// the old answers come off the character, not only out of the record
			this._takeBackSource({sourceName: `Species: ${prev}`, name: prev, prevEnt, keepSkillNames: [...keepSkillNames, ...(ent ? getEntitySkillNames(ent) : [])]});
		}

		this._state.speciesText = doc.n;
		this._state.refSpecies = {name: doc.n, source: doc.source, tag: doc.tag};
		this.setPickTag("species", doc.tag);
		if (ent) this.applyRaceData(ent);
	}

	applyRaceData (race) {
		// Not the walking speed alone: an Aarakocra flies, a Triton swims, and reading only `walk`
		// threw away the one thing those species are for
		const speed = formatSpeeds(getSpeeds(race));
		if (speed) this._state.speed = speed;

		(race.skillProficiencies || []).forEach(grp => {
			Object.entries(grp).forEach(([k, v]) => { if (v === true) this.setSkillProfByName(k, 1); });
		});

		// A species with one size settles it; one with a choice leaves it for the player to answer
		const sizes = [race.size].flat().filter(Boolean);
		if (sizes.length === 1) this._state.size = sizes[0];
		this._state.creatureTypes = [race.creatureTypes].flat().filter(Boolean);
		this._state.creatureTypeTags = [race.creatureTypeTags].flat().filter(Boolean);
		this._state.speciesTraitTags = getTraitTags(race);
		this._state.speciesTraitNames = getSpeciesTraitNames(race);
		this._state.naturalArmor = getNaturalArmor(race);

		this.setProficienciesFromSource(race.name, getEntityProficiencies(race));
		// Darkvision, resistances, immunities and the rest are structured now, so they are no longer
		// copied into the notes box as well
		this.setDefensesFromSource(race.name, getEntityDefenses(race));

		// The traits are *not* copied into the notes box. The Species panel renders them as cards, from
		// the data, so a second hand-written copy could only go stale — and a list of names in a
		// notes box was never what somebody needed anyway.
	}

	/**
	 * Add (or, with `isRevert`, subtract) a `{abv: n}` bonus map to the ability scores.
	 *
	 * Scores are stored as final values, so pass a `source` to record where an increase came from —
	 * that log is what lets the sheet explain a score ("15 base, +2 Species, +1 Feat"). Reverting with
	 * the same `logId` removes the entry again.
	 */
	applyAbilityBonuses (bonuses, {isRevert = false, source = null, logId = null} = {}) {
		Object.entries(bonuses || {}).forEach(([abv, n]) => {
			const prop = `abil_${abv}`;
			if (!(prop in this.__state)) return;
			const cur = Number(this._state[prop]) || 10;
			this._state[prop] = cur + (isRevert ? -n : n);
		});

		const log = this._state.abilityBonusLog || [];
		if (isRevert) {
			if (logId) this._state.abilityBonusLog = log.filter(it => it.id !== logId);
			return;
		}
		if (!source || !Object.keys(bonuses || {}).length) return;
		this._state.abilityBonusLog = [...log, {id: logId || CryptUtil.uid(), source, bonuses: {...bonuses}}];
	}

	/* -------------------------------------------- The choice log -------------------------------------------- */

	/**
	 * Record that one of a species' or background's choices has been answered.
	 *
	 * Keyed by `getChoiceSignature`, so the guided setup and the pickers write the same key and the
	 * panels and the Build Check read it. Re-answering the same choice replaces the old record
	 * rather than adding a second.
	 */
	recordChoice ({sig, sourceName, type, picks = [], applied = null, logId = null, bonuses = null}) {
		if (!sig) return;
		// What the answer put on the character, so it can be taken back exactly (`getChoiceReversal`)
		const extra = {
			...(applied ? {applied: applied.map(it => ({...it}))} : {}),
			...(logId ? {logId} : {}),
			...(bonuses ? {bonuses: {...bonuses}} : {}),
		};
		this._state.choiceLog = [
			...(this._state.choiceLog || []).filter(it => it.sig !== sig),
			{sig, sourceName, type, picks: [...picks], ...extra},
		];
	}

	/**
	 * Take one answered choice back: its skills, tools, languages and ability increases come off, and
	 * the choice is asked again. A skill something else still grants stays — the caller knows the
	 * entities, so it passes those in; the other answers on record are counted here.
	 *
	 * @param [opts.keepSkillNames] lower-case skill names granted outright by an entity.
	 * @return `true` if there was an answer to take back.
	 */
	revertChoice (sig, {keepSkillNames = []} = {}) {
		const log = this._state.choiceLog || [];
		const record = log.find(it => it.sig === sig);
		if (!record) return false;
		const others = getSkillNamesFromRecords(log.filter(it => it.sig !== sig), this._state);
		this._applyChoiceReversal(getChoiceReversal({state: this._state, record, keepSkillNames: new Set([...keepSkillNames, ...others])}));
		this._state.choiceLog = log.filter(it => it.sig !== sig);
		return true;
	}

	/** Every answer a source gave, taken back — the source itself is gone (a class removed, a species replaced). */
	revertChoicesFrom (sourceName, {keepSkillNames = []} = {}) {
		if (!sourceName) return;
		const log = this._state.choiceLog || [];
		const own = log.filter(it => it.sourceName === sourceName);
		if (!own.length) return;
		const others = getSkillNamesFromRecords(log.filter(it => it.sourceName !== sourceName), this._state);
		const keep = new Set([...keepSkillNames, ...others]);
		own.forEach(record => this._applyChoiceReversal(getChoiceReversal({state: this._state, record, keepSkillNames: keep})));
		this._state.choiceLog = (this._state.choiceLog || []).filter(it => it.sourceName !== sourceName);
	}

	_applyChoiceReversal ({skills, proficiencyIds, abilityLog}) {
		Object.entries(skills || {}).forEach(([key, level]) => { this._state[`skill_${key}`] = level; });
		if (proficiencyIds?.length) {
			const ids = new Set(proficiencyIds);
			this._state.proficiencies = (this._state.proficiencies || []).filter(it => !ids.has(it.id));
		}
		(abilityLog || []).forEach(({id, bonuses}) => this.applyAbilityBonuses(bonuses, {isRevert: true, logId: id}));
	}

	hasAnsweredChoice (sig) {
		return (this._state.choiceLog || []).some(it => it.sig === sig && it.picks.length);
	}

	/**
	 * Forget every choice a source answered — used when that species or background is replaced, so
	 * the new one asks its own questions rather than inheriting the old one's answers.
	 */
	clearChoicesFrom (sourceName) {
		if (!sourceName) return;
		this._state.choiceLog = (this._state.choiceLog || []).filter(it => it.sourceName !== sourceName);
	}

	/** Every feat the character holds, wherever it was taken. */
	_getAllTakenFeats () {
		const st = this._state;
		return [
			...(st.originFeats || []), ...(st.featureFeats || []), ...(st.manualFeats || []),
			...(st.classes || []).flatMap(c => (c.asiFeatChoices || []).filter(it => it?.type === "feat")),
		];
	}

	/**
	 * What a feat gave beyond its ability increases: the questions it asked, the proficiencies and
	 * defenses it granted. Kept while another copy is held — a second Skilled answers under the same
	 * name, so taking one back would take both.
	 */
	_takeBackFeat (featName, {keepSkillNames = [], exceptId = null} = {}) {
		if (!featName) return;
		if (this._getAllTakenFeats().some(it => it.name === featName && it.id !== exceptId)) return;
		this.revertChoicesFrom(featName, {keepSkillNames});
		this.setProficienciesFromSource(featName, []);
		this.setDefensesFromSource(featName, []);
	}

	/**
	 * Everything one species or background gave, taken back: its answered choices (skills, tools,
	 * languages, ability increases), the skills it granted outright, and the Origin feats it brought
	 * with the questions those answered.
	 */
	_takeBackSource ({sourceName, name, prevEnt = null, keepSkillNames = []}) {
		(this._state.originFeats || []).filter(it => it.from === name).forEach(feat => this.removeOriginFeat(feat.id));
		this.revertChoicesFrom(sourceName, {keepSkillNames});
		if (!prevEnt) return;
		const keep = new Set([...keepSkillNames, ...getSkillNamesFromRecords(this._state.choiceLog || [], this._state)]);
		getEntitySkillNames(prevEnt).forEach(skill => {
			const key = keep.has(skill) ? null : getSkillKeyByName(skill);
			if (key) this._state[`skill_${key}`] = 0;
		});
	}

	/**
	 * Apply a picked background: search doc bookkeeping + mechanical fields from the entity.
	 * @param [opts.prevEnt] the background being replaced, so the skills it granted outright come off too.
	 * @param [opts.keepSkillNames] lower-case skills something else grants outright (the species).
	 */
	applyPickedBackground ({doc, ent, isFixedOnly = false, prevEnt = null, keepSkillNames = []}) {
		const prev = this._state.refBackground?.name;
		if (prev && prev !== doc.n) {
			this.setProficienciesFromSource(prev, []);
			this._takeBackSource({sourceName: `Background: ${prev}`, name: prev, prevEnt, keepSkillNames: [...keepSkillNames, ...(ent ? getEntitySkillNames(ent) : [])]});
		}

		this._state.backgroundText = doc.n;
		this._state.refBackground = {name: doc.n, source: doc.source, tag: doc.tag};
		this.setPickTag("background", doc.tag);
		if (ent) this.applyBackgroundData(ent, {isFixedOnly});
	}

	/** @param [opts.isFixedOnly] Skip "N of your choice" display entries (when a choice queue resolves them separately). */
	applyBackgroundData (bg, {isFixedOnly = false} = {}) {
		(bg.skillProficiencies || []).forEach(grp => {
			Object.entries(grp).forEach(([k, v]) => { if (v === true) this.setSkillProfByName(k, 1); });
		});
		this.setProficienciesFromSource(bg.name, getEntityProficiencies(bg));

		// Outright grants are stored structurally above; only the unresolved "N of your choice" ones
		// need a note, and even those are skipped when the caller resolves them interactively.
		const tools = isFixedOnly ? "" : getProfListDisplay(bg.toolProficiencies, {isChoiceOnly: true});
		const langs = isFixedOnly ? "" : getProfListDisplay(bg.languageProficiencies, {isChoiceOnly: true});
		const parts = [];
		if (tools) parts.push(`Tools: ${tools}`);
		if (langs) parts.push(`Languages: ${langs}`);
		if (parts.length) this.appendToTextProp("proficienciesText", parts.join("\n"));

		// A 2024 background's Origin feat is *not* written into the notes here. It used to be, and a
		// line of text is the one thing it must not be: nothing counted it, nothing showed it, and
		// the feat's own choices were never asked. It is applied as a real feat by whoever did the
		// picking (the wizard, or the background picker), and the Build Check reports it if it never
		// was — see `getBuildAudit`.
	}

	/** Apply a picked class at a given level: display text, tag, structured entry, and mechanical fields. */
	applyPickedClass (cls, level) {
		this._state.classText = `${cls.name} ${level}`;
		this.setPickTag("class", `{@class ${cls.name}${cls.source !== Parser.SRC_PHB ? `|${cls.source}` : ""}}`);
		this.setSingleClass(cls);

		if (cls.hd && cls.hd.faces) this._state.hdTotal = `${level}d${cls.hd.faces}`;
		(cls.proficiency || []).forEach(abv => this._state[`save_${abv}`] = true);
		if (cls.spellcastingAbility) this._state.spellAbility = cls.spellcastingAbility;
	}

	/**
	 * Proficiency in one saving throw. Classes set these directly on apply; a feat (Resilient) grants
	 * one by choice, and goes through here so there is one way in.
	 */
	/** The size a species left to the player, as the data's abbreviation ("S"/"M"). */
	setSize (abv) {
		this._state.size = abv || "";
	}

	setSaveProficiency (abv, isProficient = true) {
		const prop = `save_${abv}`;
		if (!(prop in this.__state)) return false;
		this._state[prop] = !!isProficient;
		return true;
	}

	/** Set the (single) primary class from picked class data, replacing any existing classes. */
	setSingleClass (cls) {
		// Dropping the other classes drops the proficiencies they granted with them
		this._state.classes
			.filter(it => it.name !== cls.name)
			.forEach(it => this.setProficienciesFromSource(it.name, []));
		this.setProficienciesFromSource(cls.name, getClassProficiencies(cls));

		const existing = this._state.classes.length === 1 ? this._state.classes[0] : null;
		const isSameClass = existing && existing.name === cls.name && existing.source === cls.source;
		this._state.classes = [{
			id: CryptUtil.uid(),
			name: cls.name,
			source: cls.source,
			level: this.getLevelNumber(),
			hdFaces: cls.hd?.faces ?? null,
			// Re-picking the same class (e.g. to refresh level) keeps its subclass/feature choices
			subclass: isSameClass ? existing.subclass : null,
			optionalFeatures: isSameClass ? (existing.optionalFeatures || []) : [],
			featureVariants: isSameClass ? (existing.featureVariants || []) : [],
			asiFeatChoices: isSameClass ? (existing.asiFeatChoices || []) : [],
		}];
	}

	/** Add an additional (multiclass) class entry. */
	addClassEntry (cls, level) {
		// Multiclassing grants only a subset of the class's starting proficiencies
		this.setProficienciesFromSource(cls.name, getMulticlassProficiencies(cls));

		this._state.classes = [
			...this._state.classes,
			{
				id: CryptUtil.uid(),
				name: cls.name,
				source: cls.source,
				level: Math.min(20, Math.max(1, Number(level) || 1)),
				hdFaces: cls.hd?.faces ?? null,
				subclass: null,
				optionalFeatures: [],
				featureVariants: [],
				asiFeatChoices: [],
			},
		];
		this._syncDisplayFromClasses();
	}

	/**
	 * Remove a class, and what it gave: its proficiencies, the skills and tools picked from its list,
	 * the improvements and feats taken at its levels, the proficiencies its feature options brought.
	 * Adding it back then asks the same questions again from its whole list.
	 *
	 * @param [opts.keepSkillNames] lower-case skills an entity grants outright (species, background).
	 */
	removeClassEntry (id, {keepSkillNames = []} = {}) {
		const entry = this._state.classes.find(it => it.id === id);
		if (entry) {
			this.setProficienciesFromSource(entry.name, []);
			(entry.featureOptions || []).forEach(it => this.setProficienciesFromSource(`${it.feature} (${entry.name})`, []));
			(entry.asiFeatChoices || []).forEach(it => this.removeAsiFeatChoice(id, it.id));
			(this._state.featureFeats || []).filter(it => it.entryId === id).forEach(it => this.removeFeatureFeat(it.id));
			// Two entries of one class is a multiclass into itself; its picks belong to the one left
			if (!this._state.classes.some(it => it.id !== id && it.name === entry.name)) this.revertChoicesFrom(`Class: ${entry.name}`, {keepSkillNames});
		}
		this._state.classes = this._state.classes.filter(it => it.id !== id);
		this._syncDisplayFromClasses();
	}

	setClassEntryLevel (id, level) {
		const entry = this._state.classes.find(it => it.id === id);
		if (!entry) return;
		entry.level = Math.min(20, Math.max(1, Number(level) || 1));
		this._triggerCollectionUpdate("classes");
		this._syncDisplayFromClasses();
	}

	setSubclassForClass (id, subclass) {
		const entry = this._state.classes.find(it => it.id === id);
		if (!entry) return;
		entry.subclass = subclass ? {name: subclass.name, shortName: subclass.shortName, source: subclass.source} : null;
		this._triggerCollectionUpdate("classes");
	}

	addOptionalFeatureForClass (id, {name, source, progressionName}) {
		const entry = this._state.classes.find(it => it.id === id);
		if (!entry) return;
		entry.optionalFeatures = entry.optionalFeatures || [];
		if (entry.optionalFeatures.some(it => it.name === name && it.source === source)) return;
		entry.optionalFeatures.push({name, source, progressionName});
		this._triggerCollectionUpdate("classes");
	}

	/**
	 * Answer a feature that offers a choice of features — the 2024 Cleric's Divine Order (Protector or
	 * Thaumaturge), a Druid's Primal Order. One answer per feature; answering again replaces it.
	 */
	setFeatureOptionForClass (id, {feature, option, source = null, level = null}) {
		const entry = this._state.classes.find(it => it.id === id);
		if (!entry) return;
		entry.featureOptions = [
			...(entry.featureOptions || []).filter(it => it.feature !== feature),
			...(option ? [{feature, option, source, level}] : []),
		];
		this._triggerCollectionUpdate("classes");
	}

	removeOptionalFeatureForClass (id, {name, source}) {
		const entry = this._state.classes.find(it => it.id === id);
		if (!entry?.optionalFeatures) return;
		entry.optionalFeatures = entry.optionalFeatures.filter(it => !(it.name === name && it.source === source));
		this._triggerCollectionUpdate("classes");
	}

	/**
	 * Take, or give back, one of Tasha's optional class features. These are a permission the table
	 * gives rather than something a level grants, so they default to off and what they replace stays
	 * in force until one is taken.
	 */
	setFeatureVariantForClass (id, {name, source}, isTaken) {
		const entry = this._state.classes.find(it => it.id === id);
		if (!entry || !name) return;
		const rest = (entry.featureVariants || []).filter(it => !(it.name === name && it.source === source));
		entry.featureVariants = isTaken ? [...rest, {name, source}] : rest;
		this._triggerCollectionUpdate("classes");
	}

	/**
	 * Record an Ability Score Improvement-slot choice for a class: either an ASI
	 * (`{type: "asi", bonuses}`) or a feat (`{type: "feat", name, source, bonuses}`).
	 * Ability bonuses are applied now and reverted if the choice is removed.
	 */
	addAsiFeatChoice (classId, choice) {
		const entry = this._state.classes.find(it => it.id === classId);
		if (!entry) return;
		entry.asiFeatChoices = entry.asiFeatChoices || [];
		const id = CryptUtil.uid();
		entry.asiFeatChoices.push({id, ...choice});
		if (choice.bonuses) {
			const label = choice.type === "feat" ? `${choice.name} (feat)` : "Ability Score Improvement";
			this.applyAbilityBonuses(choice.bonuses, {source: label, logId: id});
		}
		this._triggerCollectionUpdate("classes");
	}

	removeAsiFeatChoice (classId, choiceId) {
		const entry = this._state.classes.find(it => it.id === classId);
		if (!entry?.asiFeatChoices) return;
		const choice = entry.asiFeatChoices.find(it => it.id === choiceId);
		if (!choice) return;
		if (choice.type === "feat") this._takeBackFeat(choice.name, {exceptId: choiceId});
		if (choice.bonuses) this.applyAbilityBonuses(choice.bonuses, {isRevert: true, logId: choiceId});
		entry.asiFeatChoices = entry.asiFeatChoices.filter(it => it.id !== choiceId);
		this._triggerCollectionUpdate("classes");
	}

	/** Update the display fields (class text, total level, hit dice) after structural class changes. */
	_syncDisplayFromClasses () {
		const classes = this._state.classes;
		if (!classes.length) return;

		this._state.classText = classes.map(it => `${it.name} ${it.level}`).join(" / ");
		this._state.level = Math.min(20, classes.reduce((acc, it) => acc + (Number(it.level) || 0), 0));

		const byFaces = {};
		classes.forEach(it => {
			if (!it.hdFaces) return;
			byFaces[it.hdFaces] = (byFaces[it.hdFaces] || 0) + (Number(it.level) || 0);
		});
		const hd = Object.entries(byFaces).map(([faces, cnt]) => `${cnt}d${faces}`).join(" + ");
		if (hd) this._state.hdTotal = hd;
	}

	_syncSingleClassLevel () {
		const classes = this._state.classes;
		if (!classes.length) return;

		if (classes.length === 1 && classes[0].level !== this.getLevelNumber()) {
			classes[0].level = this.getLevelNumber();
			this._triggerCollectionUpdate("classes");
		}

		// With multiple classes the total is derived from per-class levels; this also refreshes
		// the class text and hit dice displays (equal-value assignments are no-ops, so no loops)
		this._syncDisplayFromClasses();
	}

	/* -------------------------------------------- Persistence -------------------------------------------- */

	getSaveableState () {
		return {
			version: CHAR_SHEET_SCHEMA_VERSION,
			...this.getBaseSaveableState(),
		};
	}

	/** @return `true` if the state was recognised and applied */
	setStateFrom (saved) {
		if (!saved || typeof saved !== "object") return false;
		const migrated = this.constructor.getMigratedState(saved);
		if (!migrated) return false;
		this._setState({...this._getDefaultState(), ...migrated.state});
		return true;
	}

	/**
	 * Migrate a saved state envelope to the current schema version.
	 * Version 1 (implicit; no `version` key) stored raw DOM values keyed by element ID.
	 */
	static getMigratedState (saved) {
		if (saved.version == null && saved.fields) return {version: CHAR_SHEET_SCHEMA_VERSION, state: this._getStateFromLegacy(saved)};
		if (saved.version === CHAR_SHEET_SCHEMA_VERSION && saved.state) return {...saved, state: getStateWithMigratedAbilityNotes(saved.state)};
		return null;
	}

	static _getNumOrNull (val) {
		if (val == null || `${val}`.trim() === "") return null;
		const num = Number(val);
		return isNaN(num) ? null : num;
	}

	static _getStateFromLegacy (legacy) {
		const state = {};

		Object.entries(this._LEGACY_FIELD_TO_PROP_STR).forEach(([fieldId, prop]) => {
			const val = legacy.fields?.[fieldId];
			if (val != null) state[prop] = `${val}`;
		});

		Object.entries(this._LEGACY_FIELD_TO_PROP_NUM).forEach(([fieldId, prop]) => {
			const val = legacy.fields?.[fieldId];
			if (val != null) state[prop] = this._getNumOrNull(val);
		});

		state.level = Math.min(20, Math.max(1, Number(legacy.fields?.["cs-level"]) || 1));
		state.initMisc = Number(legacy.fields?.["cs-init-misc"]) || 0;

		CHAR_SHEET_ABILITIES.forEach(([abv]) => {
			const score = Number(legacy.fields?.[`cs-abil-${abv}`]);
			if (!isNaN(score) && score) state[`abil_${abv}`] = score;
			state[`save_${abv}`] = !!legacy.saves?.[abv];
		});

		CHAR_SHEET_SKILLS.forEach(({key}) => {
			state[`skill_${key}`] = Math.min(2, Math.max(0, Number(legacy.skills?.[key]) || 0));
		});

		state.inspiration = !!legacy.inspiration;
		state.deathSuccess = Math.min(3, Math.max(0, Number(legacy.deathSuccess) || 0));
		state.deathFail = Math.min(3, Math.max(0, Number(legacy.deathFail) || 0));

		if (legacy.pickTags && typeof legacy.pickTags === "object") state.pickTags = {...legacy.pickTags};

		state.attacks = (Array.isArray(legacy.attacks) ? legacy.attacks : [])
			.map(atk => ({
				id: CryptUtil.uid(),
				name: atk.name || "",
				atkBonus: Number(atk.atkBonus) || 0,
				damage: atk.damage || "",
			}));

		return state;
	}
}
