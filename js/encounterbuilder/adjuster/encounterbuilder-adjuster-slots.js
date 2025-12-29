import {EncounterBuilderCandidateEncounter, EncounterBuilderCreatureMeta, EncounterBuilderOptionalCandidateEncounter} from "../encounterbuilder-models.js";
import {EncounterBuilderAdjusterBase} from "./encounterbuilder-adjuster-base.js";
import {EncounterBuilderTemplaterSeeded} from "../templater/encounterbuilder-templater-seeded.js";

export class EncounterbuilderAdjusterTemplated extends EncounterBuilderAdjusterBase {
	/**
	 * @param {Array<EncounterBuilderCreatureMeta>} creatureMetas
	 * @param {Array<EncounterBuilderCreatureMeta>} creatureMetasLocked
	 * @param {Array<EncounterBuilderCreatureMeta>} creatureMetasAdjustable
	 */
	async _pGetAdjustedEncounter_getSolution ({creatureMetas, creatureMetasLocked, creatureMetasAdjustable}) {
		const slotSeeds = creatureMetasAdjustable.map(creatureMeta => creatureMeta.getSpend({budgetMode: this._budgetMode}));

		const templater = new EncounterBuilderTemplaterSeeded({
			partyMeta: this._partyMeta,
			spendKeys: this._cache.getKeys({budgetMode: this._budgetMode}),
			budgetMin: this._budgetMin,
			budgetMax: this._budgetMax,
			budgetMode: this._budgetMode,
			creatureMetasLocked,
			slotSeeds,
		});

		const templateInfo = templater.getEncounterTemplateInfo();
		if (!templateInfo.templateOptions) return EncounterBuilderOptionalCandidateEncounter.failure({message: templateInfo.message});

		const templateOption = RollerUtil.rollOnArray(templateInfo.templateOptions);

		if (templateOption.length !== creatureMetasAdjustable.length) throw new Error(`Should never occur!`);

		// The seeded solution is in low-to-high spend order; apply the results to existing creature metas in the same order
		[...creatureMetasAdjustable]
			.sort((a, b) => SortUtil.ascSort(a.getSpend({budgetMode: this._budgetMode}), b.getSpend({budgetMode: this._budgetMode})))
			.forEach((creatureMeta, i) => {
				creatureMeta.setCount(templateOption[i].count);
			});

		return EncounterBuilderOptionalCandidateEncounter.success({
			candidateEncounter: new EncounterBuilderCandidateEncounter({
				partyMeta: this._partyMeta,
				creatureMetasLocked,
				creatureMetasAdjustable,
			}),
		});
	}
}
