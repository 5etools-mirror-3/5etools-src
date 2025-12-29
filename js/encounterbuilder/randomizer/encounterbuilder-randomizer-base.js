import {EncounterBuilderCreatureMeta} from "../encounterbuilder-models.js";

export class EncounterBuilderRandomizerBase {
	_partyMeta;
	_cache;
	_budgetMode;

	/**
	 * @param {EncounterPartyMetaBase} partyMeta
	 * @param {EncounterBuilderCacheBase} cache
	 * @param {number} budgetMin
	 * @param {number} budgetMax
	 * @param {"xp" | "cr"} budgetMode
	 */
	constructor ({partyMeta, cache, budgetMin, budgetMax, budgetMode}) {
		if (budgetMin > budgetMax) throw new Error(`Expected "budgetMin" to be less than or equal to "budgetMax"!`);

		this._partyMeta = partyMeta;
		this._cache = cache;
		this._budgetMin = budgetMin;
		this._budgetMax = budgetMax;
		this._budgetMode = budgetMode;
	}

	async pGetRandomEncounter ({creatureMetasLocked}) {
		const closestSolution = this._pDoGenerateEncounter_getSolution({creatureMetasLocked});

		if (!closestSolution.candidateEncounter) {
			JqueryUtil.doToast({content: closestSolution.message, type: "warning"});
			return null;
		}

		return closestSolution.candidateEncounter.getCreatureMetas();
	}

	/**
	 * @param {Array<EncounterBuilderCreatureMeta>} creatureMetasLocked
	 * @return {EncounterBuilderOptionalCandidateEncounter}
	 */
	_pDoGenerateEncounter_getSolution ({creatureMetasLocked}) { throw new Error("Unimplemented!"); }

	_isValidEncounter ({candidateEncounter}) {
		const encounterXp = candidateEncounter.getEncounterSpendInfo();
		return encounterXp.adjustedSpend >= this._budgetMin && encounterXp.adjustedSpend <= (this._budgetMax * 1.1);
	}
}
