import {EncounterBuilderHelpers} from "./encounterbuilder-helpers.js";

export class EncounterBuilderXpInfo {
	static getDefault () {
		return new this({
			baseXp: 0,
			relevantCount: 0,
			count: 0,
			adjustedXp: 0,

			crCutoff: Parser.crToNumber(Parser.CRS.last()),
			playerCount: 0,
			playerAdjustedXpMult: 0,
		});
	}

	/* -------------------------------------------- */

	constructor (
		{
			baseXp,
			relevantCount,
			count,
			adjustedXp,
			crCutoff,
			playerCount,
			playerAdjustedXpMult,
		},
	) {
		this._baseXp = baseXp;
		this._relevantCount = relevantCount;
		this._count = count;
		this._adjustedXp = adjustedXp;
		this._crCutoff = crCutoff;
		this._playerCount = playerCount;
		this._playerAdjustedXpMult = playerAdjustedXpMult;
	}

	get baseXp () { return this._baseXp; }
	get relevantCount () { return this._relevantCount; }
	get count () { return this._count; }
	get adjustedXp () { return this._adjustedXp; }
	get crCutoff () { return this._crCutoff; }
	get playerCount () { return this._playerCount; }
	get playerAdjustedXpMult () { return this._playerAdjustedXpMult; }
}

export class EncounterBuilderCreatureMeta {
	constructor (
		{
			creature,
			count,

			isLocked = false,

			customHashId = null,
			baseCreature = null,
		},
	) {
		this.creature = creature;
		this.count = count;

		this.isLocked = isLocked;

		// used for encounter adjuster
		this.customHashId = customHashId ?? null;
		this.baseCreature = baseCreature;
	}

	/* -------------------------------------------- */

	getHash () { return UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY](this.creature); }

	getCrNumber () {
		return Parser.crToNumber(this.creature.cr, {isDefaultNull: true});
	}

	getXp () {
		return Parser.crToXpNumber(this.creature.cr);
	}

	getApproxHp () {
		if (this.creature.hp && this.creature.hp.average && !isNaN(this.creature.hp.average)) return Number(this.creature.hp.average);
		return null;
	}

	getApproxAc () {
		// Use the first AC listed, as this is usually the "primary"
		if (this.creature.ac && this.creature.ac[0] != null) {
			if (this.creature.ac[0].ac) return this.creature.ac[0].ac;
			if (typeof this.creature.ac[0] === "number") return this.creature.ac[0];
		}
		return null;
	}

	/* -------------------------------------------- */

	isSameCreature (other) {
		if (this.customHashId !== other.customHashId) return false;
		return this.getHash() === other.getHash();
	}

	hasCreature (mon) {
		const monCustomHashId = Renderer.monster.getCustomHashId(mon);
		if (this.customHashId !== monCustomHashId) return false;
		return this.getHash() === UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY](mon);
	}

	copy () {
		return new this.constructor(this);
	}

	/* -------------------------------------------- */

	/**
	 * @param {Array<EncounterBuilderCreatureMeta>} creatureMetas
	 * @param {?EncounterPartyMeta} partyMeta
	 */
	static getEncounterXpInfo (creatureMetas, partyMeta = null) {
		partyMeta ??= EncounterPartyMeta.getDefault();

		// Avoid including e.g. "summon" creatures.
		// Note that this effectively discounts non-XP-carrying creatures from "creature count XP multiplier"
		//   calculations. This is intentional; we make the simplifying assumption that if a creature doesn't carry XP,
		//   it should have no impact on the difficulty encounter.
		creatureMetas = creatureMetas.filter(creatureMeta => creatureMeta.getCrNumber() != null)
			.sort((a, b) => SortUtil.ascSort(b.getCrNumber(), a.getCrNumber()));

		if (!creatureMetas.length) {
			return EncounterBuilderXpInfo.getDefault();
		}

		let baseXp = 0;
		let relevantCount = 0;
		let count = 0;

		const crCutoff = EncounterBuilderHelpers.getCrCutoff(creatureMetas, partyMeta);
		creatureMetas
			.forEach(creatureMeta => {
				if (creatureMeta.getCrNumber() >= crCutoff) relevantCount += creatureMeta.count;
				count += creatureMeta.count;
				baseXp += (Parser.crToXpNumber(Parser.numberToCr(creatureMeta.getCrNumber())) || 0) * creatureMeta.count;
			});

		const playerAdjustedXpMult = Parser.numMonstersToXpMult(relevantCount, partyMeta.cntPlayers);

		const adjustedXp = playerAdjustedXpMult * baseXp;
		return new EncounterBuilderXpInfo({
			baseXp,
			relevantCount,
			count,
			adjustedXp,
			crCutoff,
			playerCount: partyMeta.cntPlayers,
			playerAdjustedXpMult,
		});
	}
}

export class EncounterBuilderCandidateEncounter {
	/**
	 * @param {Array<EncounterBuilderCreatureMeta>} lockedEncounterCreatures
	 */
	constructor ({lockedEncounterCreatures = []} = {}) {
		this.skipCount = 0;
		this._lockedEncounterCreatures = lockedEncounterCreatures;
		this._creatureMetas = [...lockedEncounterCreatures];
	}

	hasCreatures () { return !!this._creatureMetas.length; }

	getCreatureMetas ({xp = null, isSkipLocked = false} = {}) {
		return this._creatureMetas
			.filter(creatureMeta => {
				if (isSkipLocked && creatureMeta.isLocked) return false;
				return xp == null || creatureMeta.getXp() === xp;
			});
	}

	getEncounterXpInfo ({partyMeta}) {
		return EncounterBuilderCreatureMeta.getEncounterXpInfo(this._creatureMetas, partyMeta);
	}

	addCreatureMeta (creatureMeta) {
		const existingMeta = this._creatureMetas.find(it => it.isSameCreature(creatureMeta));
		if (existingMeta?.isLocked) return false;

		if (existingMeta) {
			existingMeta.count++;
			return true;
		}

		this._creatureMetas.push(creatureMeta);
		return true;
	}

	// Try to add another copy of an existing creature
	tryIncreaseExistingCreatureCount ({xp}) {
		const existingMetas = this.getCreatureMetas({isSkipLocked: true, xp});
		if (!existingMetas.length) return false;

		const roll = RollerUtil.roll(100);
		const chance = this._getChanceToAddNewCreature();
		if (roll < chance) return false;

		RollerUtil.rollOnArray(existingMetas).count++;
		return true;
	}

	_getChanceToAddNewCreature () {
		if (this._creatureMetas.length === 0) return 0;

		// Soft-cap at 5 creatures
		if (this._creatureMetas.length >= 5) return 2;

		/*
		 * 1 -> 80% chance to add new
		 * 2 -> 40%
		 * 3 -> 27%
		 * 4 -> 20%
		 */
		return Math.round(80 / this._creatureMetas.length);
	}

	isCreatureLocked (mon) {
		return this._lockedEncounterCreatures
			.some(creatureMeta => creatureMeta.customHashId == null && creatureMeta.getHash() === UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY](mon));
	}
}

export class EncounterPartyPlayerMeta {
	constructor ({level, count}) {
		this.level = level;
		this.count = count;
	}

	getXpToNextLevel () {
		const ixCur = Math.min(Math.max(0, this.level - 1), VeCt.LEVEL_MAX - 1);
		const ixNxt = Math.min(ixCur + 1, VeCt.LEVEL_MAX - 1);
		return (Parser.LEVEL_XP_REQUIRED[ixNxt] - Parser.LEVEL_XP_REQUIRED[ixCur]) * this.count;
	}
}

export class EncounterPartyMeta {
	static getDefault () {
		return new this(
			[
				new EncounterPartyPlayerMeta({level: 1, count: 1}),
			],
		);
	}

	/* -------------------------------------------- */

	/**
	 *
	 * @param {Array<EncounterPartyPlayerMeta>} playerMetas
	 */
	constructor (playerMetas) {
		/** @type {Array<EncounterPartyPlayerMeta>} */
		this.levelMetas = [];

		// Combine such that each `level` has at most one entry, with the total count for players of that level
		playerMetas.forEach(it => {
			const existingLvl = this.levelMetas.find(x => x.level === it.level);
			if (existingLvl) existingLvl.count += it.count;
			else this.levelMetas.push(new EncounterPartyPlayerMeta({count: it.count, level: it.level}));
		});

		this.cntPlayers = 0;
		this.avgPlayerLevel = 0;
		this.maxPlayerLevel = 0;

		this.threshEasy = 0;
		this.threshMedium = 0;
		this.threshHard = 0;
		this.threshDeadly = 0;
		this.threshAbsurd = 0;

		this.dailyBudget = 0;
		this.xpToNextLevel = 0;

		this.levelMetas
			.forEach(meta => {
				this.cntPlayers += meta.count;
				this.avgPlayerLevel += meta.level * meta.count;
				this.maxPlayerLevel = Math.max(this.maxPlayerLevel, meta.level);

				this.threshEasy += Parser.LEVEL_TO_XP_EASY[meta.level] * meta.count;
				this.threshMedium += Parser.LEVEL_TO_XP_MEDIUM[meta.level] * meta.count;
				this.threshHard += Parser.LEVEL_TO_XP_HARD[meta.level] * meta.count;
				this.threshDeadly += Parser.LEVEL_TO_XP_DEADLY[meta.level] * meta.count;

				this.dailyBudget += Parser.LEVEL_TO_XP_DAILY[meta.level] * meta.count;

				this.xpToNextLevel += meta.getXpToNextLevel();
			});
		if (this.cntPlayers) this.avgPlayerLevel /= this.cntPlayers;

		this.threshAbsurd = this.threshDeadly + (this.threshDeadly - this.threshHard);
	}

	/** Return true if at least a third of the party is level 5+. */
	isPartyLevelFivePlus () {
		const [levelMetasHigher, levelMetasLower] = this.levelMetas.partition(it => it.level >= 5);
		const cntLower = levelMetasLower.map(it => it.count).reduce((a, b) => a + b, 0);
		const cntHigher = levelMetasHigher.map(it => it.count).reduce((a, b) => a + b, 0);
		return (cntHigher / (cntLower + cntHigher)) >= 0.333;
	}

	// Expose these as getters to ease factoring elsewhere
	get easy () { return this.threshEasy; }
	get medium () { return this.threshMedium; }
	get hard () { return this.threshHard; }
	get deadly () { return this.threshDeadly; }
	get absurd () { return this.threshAbsurd; }
}
