import {EncounterBuilderCreatureMeta} from "../encounterbuilder-models.js";

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
	 * @param {Array<EncounterBuilderCreatureMeta>} creatureMetas
	 * @return {Promise<?EncounterBuilderOptionalCandidateEncounter>}
	 */
	async pGetAdjustedEncounter ({creatureMetas}) {
		if (!creatureMetas.length) {
			JqueryUtil.doToast({content: `The current encounter contained no creatures! Please add some first.`, type: "warning"});
			return null;
		}

		if (creatureMetas.every(creatureMeta => creatureMeta.getIsLocked())) {
			JqueryUtil.doToast({content: `The current encounter contained only locked creatures! Please unlock or add some other creatures some first.`, type: "warning"});
			return null;
		}

		const creatureMetasLocked = creatureMetas.filter(creatureMeta => creatureMeta.getIsLocked());
		creatureMetas = creatureMetas.map(creatureMeta => creatureMeta.copy());

		const creatureMetasAdjustable = creatureMetas
			.filter(creatureMeta => !creatureMeta.getIsLocked() && creatureMeta.getCrNumber() != null);

		if (!creatureMetasAdjustable.length) {
			JqueryUtil.doToast({content: `The current encounter contained only locked creatures, or creatures without XP values! Please unlock or add some other creatures some first.`, type: "warning"});
			return null;
		}

		creatureMetasAdjustable
			.forEach(creatureMeta => creatureMeta.setCount(1));

		if (this._partyMeta.getEncounterSpendInfo(creatureMetas).adjustedSpend > this._budgetMax) {
			JqueryUtil.doToast({content: `Could not adjust the current encounter, try removing some creatures!`, type: "danger"});
			return null;
		}

		const closestSolution = await this._pGetAdjustedEncounter_getSolution({creatureMetas, creatureMetasLocked, creatureMetasAdjustable});

		if (!closestSolution.candidateEncounter) {
			JqueryUtil.doToast({content: closestSolution.message, type: "warning"});
			return null;
		}

		return closestSolution.candidateEncounter.getCreatureMetas();
	}

	/**
	 * @abstract
	 * @param {Array<EncounterBuilderCreatureMeta>} creatureMetas
	 * @param {Array<EncounterBuilderCreatureMeta>} creatureMetasLocked
	 * @param {Array<EncounterBuilderCreatureMeta>} creatureMetasAdjustable
	 * @return {Promise<EncounterBuilderOptionalCandidateEncounter>}
	 */
	async _pGetAdjustedEncounter_getSolution ({creatureMetas, creatureMetasLocked, creatureMetasAdjustable}) { throw new Error("Unimplemented!"); }
}
