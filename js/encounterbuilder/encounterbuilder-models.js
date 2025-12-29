import {BUDGET_MODE_CR, BUDGET_MODE_XP} from "./consts/encounterbuilder-consts.js";

export class EncounterBuilderSpendInfo {
	constructor (
		{
			baseSpend,
			relevantCount,
			count,
			adjustedSpend,
			crCutoff,
			playerCount,
			playerAdjustedSpendMult,
		},
	) {
		this._baseSpend = baseSpend;
		this._relevantCount = relevantCount;
		this._count = count;
		this._adjustedSpend = adjustedSpend;
		this._crCutoff = crCutoff;
		this._playerCount = playerCount;
		this._playerAdjustedSpendMult = playerAdjustedSpendMult;
	}

	get baseSpend () { return this._baseSpend; }
	get relevantCount () { return this._relevantCount; }
	get count () { return this._count; }
	get adjustedSpend () { return this._adjustedSpend; }
	get crCutoff () { return this._crCutoff; }
	get playerCount () { return this._playerCount; }
	get playerAdjustedSpendMult () { return this._playerAdjustedSpendMult; }
}

export class EncounterBuilderCreatureMeta {
	constructor (
		{
			id,

			creature,
			count,

			isLocked = false,

			customHashId = null,
			baseCreature = null,
		},
	) {
		this.id = id || CryptUtil.uid();
		this.entity = {
			creature,
			count,
			isLocked,
			customHashId,
			baseCreature,
		};
	}

	/* -------------------------------------------- */

	getCreature () { return this.entity.creature; }

	getCount () { return this.entity.count; }
	setCount (val) { return this.entity.count = val; }

	getCustomHashId () { return this.entity.customHashId || undefined; }
	getIsLocked () { return !!this.entity.isLocked; }

	/* ----- */

	getHash () { return UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY](this.entity.creature); }

	getCrNumber () {
		return Parser.crToNumber(this.entity.creature.cr, {isDefaultNull: true});
	}

	getXp () {
		if (this.entity.creature.cr?.xp != null) return this.entity.creature.cr.xp;
		return Parser.crToXpNumber(this.entity.creature.cr);
	}

	getSpend ({budgetMode}) {
		switch (budgetMode) {
			case BUDGET_MODE_XP: return this.getXp();
			case BUDGET_MODE_CR: return this.getCrNumber();
			default: throw new Error(`Unhandled budget mode "${budgetMode}"!`);
		}
	}

	getApproxHp () {
		if (this.entity.creature.hp && this.entity.creature.hp.average && !isNaN(this.entity.creature.hp.average)) return Number(this.entity.creature.hp.average);
		return null;
	}

	getApproxAc () {
		// Use the first AC listed, as this is usually the "primary"
		if (this.entity.creature.ac && this.entity.creature.ac[0] != null) {
			if (this.entity.creature.ac[0].ac) return this.entity.creature.ac[0].ac;
			if (typeof this.entity.creature.ac[0] === "number") return this.entity.creature.ac[0];
		}
		return null;
	}

	/* -------------------------------------------- */

	isSameCreature (other) {
		if (this.getCustomHashId() !== other.getCustomHashId()) return false;
		return this.getHash() === other.getHash();
	}

	hasCreature (mon) {
		const monCustomHashId = Renderer.monster.getCustomHashId(mon);
		if (this.getCustomHashId() !== monCustomHashId) return false;
		return this.getHash() === UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY](mon);
	}

	copy () {
		return new this.constructor({id: this.id, ...this.entity});
	}
}

export class EncounterBuilderCandidateEncounter {
	/**
	 * @param {EncounterPartyMetaBase} partyMeta
	 * @param {?Array<EncounterBuilderCreatureMeta>} creatureMetasLocked
	 * @param {?Array<EncounterBuilderCreatureMeta>} creatureMetasAdjustable
	 */
	constructor ({partyMeta, creatureMetasLocked = null, creatureMetasAdjustable = null} = {}) {
		creatureMetasLocked ||= [];
		creatureMetasAdjustable ||= [];

		this._partyMeta = partyMeta;
		this._lockedEncounterCreatures = creatureMetasLocked;
		this._creatureMetas = [...creatureMetasLocked, ...creatureMetasAdjustable];

		this._skipCount = 0;
	}

	getSkipCount () { return this._skipCount; }
	incrementSkipCount () { this._skipCount++; }

	hasCreatures () { return !!this._creatureMetas.length; }

	getCreatureMetas ({budgetMode = null, spendValue = null, isSkipLocked = false} = {}) {
		if (spendValue != null && budgetMode == null) throw new Error(`Expected "budgetMode" argument when "spendValue" is provided!`);

		return this._creatureMetas
			.filter(creatureMeta => {
				if (isSkipLocked && creatureMeta.getIsLocked()) return false;
				return spendValue == null || creatureMeta.getSpend({budgetMode}) === spendValue;
			});
	}

	getEncounterSpendInfo () {
		return this._partyMeta.getEncounterSpendInfo(this._creatureMetas);
	}

	addCreatureMeta (creatureMeta) {
		const existingMeta = this._creatureMetas.find(it => it.isSameCreature(creatureMeta));
		if (existingMeta?.getIsLocked()) return false;

		if (existingMeta) {
			existingMeta.setCount(existingMeta.getCount() + 1);
			return true;
		}

		this._creatureMetas.push(creatureMeta);
		return true;
	}

	// Try to add another copy of an existing creature
	tryIncreaseExistingCreatureCount ({budgetMode, spendValue}) {
		const existingMetas = this.getCreatureMetas({isSkipLocked: true, budgetMode, spendValue});
		if (!existingMetas.length) return false;

		const roll = RollerUtil.roll(100);
		const chance = this._getChanceToAddNewCreature();
		if (roll < chance) return false;

		const picked = RollerUtil.rollOnArray(existingMetas);
		picked.setCount(picked.getCount() + 1);
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

export class EncounterBuilderOptionalCandidateEncounter {
	/**
	 * @param {?EncounterBuilderCandidateEncounter} candidateEncounter
	 * @param {?string} message
	 */
	constructor ({candidateEncounter = undefined, message = undefined}) {
		this.candidateEncounter = candidateEncounter;
		this.message = message;
	}

	static success ({candidateEncounter}) {
		return new this({candidateEncounter});
	}

	static failure (
		{
			message = "Failed to generate a valid encounter within the provided parameters! Try adjusting your filters, adding more players, or unlocking some creatures.",
		} = {},
	) {
		return new this({message});
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
