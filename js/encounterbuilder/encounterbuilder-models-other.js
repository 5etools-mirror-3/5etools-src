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

export class EncounterBuilderCandidateEncounter {
	/**
	 * @param {EncounterPartyMetaBase} partyMeta
	 * @param {?Array<EncounterBuilderCreatureGroupBase>} creatureGroupsLocked
	 * @param {?Array<EncounterBuilderCreatureGroupBase>} creatureGroupsAdjustable
	 */
	constructor ({partyMeta, creatureGroupsLocked = null, creatureGroupsAdjustable = null} = {}) {
		creatureGroupsLocked ||= [];
		creatureGroupsAdjustable ||= [];

		this._partyMeta = partyMeta;
		this._lockedEncounterCreatures = creatureGroupsLocked;
		this._creatureGroups = [...creatureGroupsLocked, ...creatureGroupsAdjustable];

		this._skipCount = 0;
	}

	getSkipCount () { return this._skipCount; }
	incrementSkipCount () { this._skipCount++; }

	hasCreatures () { return !!this._creatureGroups.length; }

	getCreatureGroups ({budgetMode = null, spendValue = null, isSkipLocked = false} = {}) {
		if (spendValue != null && budgetMode == null) throw new Error(`Expected "budgetMode" argument when "spendValue" is provided!`);

		return this._creatureGroups
			.filter(creatureGroup => {
				if (isSkipLocked && creatureGroup.getIsLocked()) return false;
				return spendValue == null || creatureGroup.getSpend({budgetMode}) === spendValue;
			});
	}

	getEncounterSpendInfo () {
		return this._partyMeta.getEncounterSpendInfo(this._creatureGroups);
	}

	addCreatureGroup (creatureGroup) {
		const existingMeta = this._creatureGroups.find(it => it.isSameCreatureGroup(creatureGroup));
		if (existingMeta?.getIsLocked()) return false;

		if (existingMeta) {
			existingMeta.setCount(existingMeta.getCount() + 1);
			return true;
		}

		this._creatureGroups.push(creatureGroup);
		return true;
	}

	// Try to add another copy of an existing creature
	tryIncreaseExistingCreatureCount ({budgetMode, spendValue}) {
		const existingMetas = this.getCreatureGroups({isSkipLocked: true, budgetMode, spendValue});
		if (!existingMetas.length) return false;

		const roll = RollerUtil.roll(100);
		const chance = this._getChanceToAddNewCreature();
		if (roll < chance) return false;

		const picked = RollerUtil.rollOnArray(existingMetas);
		picked.setCount(picked.getCount() + 1);
		return true;
	}

	_getChanceToAddNewCreature () {
		if (this._creatureGroups.length === 0) return 0;

		// Soft-cap at 5 creatures
		if (this._creatureGroups.length >= 5) return 2;

		/*
		 * 1 -> 80% chance to add new
		 * 2 -> 40%
		 * 3 -> 27%
		 * 4 -> 20%
		 */
		return Math.round(80 / this._creatureGroups.length);
	}

	isCreatureLocked (mon) {
		const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY](mon);
		const customHashId = Renderer.monster.getCustomHashId(mon);

		return this._lockedEncounterCreatures
			.some(creatureGroup => {
				if (creatureGroup.getHash() !== hash) return false;
				return MiscUtil.isNearStrictlyEqual(creatureGroup.getCustomHashId(), customHashId);
			});
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
