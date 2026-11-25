/** @abstract */
export class EncounterBuilderAdjusterBase {
	/**
	 * @param {EncounterPartyMetaBase} partyMeta
	 * @param {EncounterBuilderCacheBase} cache
	 * @param {number} budgetMin An XP or CR budget.
	 * @param {number} budgetMax An XP or CR budget.
	 * @param {"xp" | "cr"} budgetMode
	 */
	constructor (
		{
			partyMeta,
			cache,
			budgetMin,
			budgetMax,
			budgetMode,
		},
	) {
		this._partyMeta = partyMeta;
		this._cache = cache;
		this._budgetMin = budgetMin;
		this._budgetMax = budgetMax;
		this._budgetMode = budgetMode;
	}

	/**
	 * @param {Array<EncounterBuilderCreatureGroupBase>} creatureGroups
	 * @return {Promise<?EncounterBuilderOptionalCandidateEncounter>}
	 */
	async pGetAdjustedEncounter ({creatureGroups}) {
		if (!creatureGroups.length) {
			JqueryUtil.doToast({content: `The current encounter contained no creatures! Please add some first.`, type: "warning"});
			return null;
		}

		if (creatureGroups.every(creatureGroup => creatureGroup.getIsLocked())) {
			JqueryUtil.doToast({content: `The current encounter contained only locked creatures! Please unlock or add some other creatures some first.`, type: "warning"});
			return null;
		}

		const creatureGroupsLocked = creatureGroups.filter(creatureGroup => creatureGroup.getIsLocked());
		creatureGroups = creatureGroups.map(creatureGroup => creatureGroup.getCopy());

		const creatureGroupsAdjustable = creatureGroups
			.filter(creatureGroup => !creatureGroup.getIsLocked() && creatureGroup.getCrNumber() != null);

		if (!creatureGroupsAdjustable.length) {
			JqueryUtil.doToast({content: `The current encounter contained only locked creatures, or creatures without XP values! Please unlock or add some other creatures some first.`, type: "warning"});
			return null;
		}

		creatureGroupsAdjustable
			.forEach(creatureGroup => creatureGroup.setCount(1));

		if (this._partyMeta.getEncounterSpendInfo(creatureGroups).adjustedSpend > this._budgetMax) {
			JqueryUtil.doToast({content: `Could not adjust the current encounter, try removing some creatures!`, type: "danger"});
			return null;
		}

		const closestSolution = await this._pGetAdjustedEncounter_getSolution({creatureGroups, creatureGroupsLocked, creatureGroupsAdjustable});

		if (!closestSolution.candidateEncounter) {
			JqueryUtil.doToast({content: closestSolution.message, type: "warning"});
			return null;
		}

		return closestSolution.candidateEncounter.getCreatureGroups();
	}

	/**
	 * @abstract
	 * @param {Array<EncounterBuilderCreatureGroupBase>} creatureGroups
	 * @param {Array<EncounterBuilderCreatureGroupBase>} creatureGroupsLocked
	 * @param {Array<EncounterBuilderCreatureGroupBase>} creatureGroupsAdjustable
	 * @return {Promise<EncounterBuilderOptionalCandidateEncounter>}
	 */
	async _pGetAdjustedEncounter_getSolution ({creatureGroups, creatureGroupsLocked, creatureGroupsAdjustable}) { throw new Error("Unimplemented!"); }
}
