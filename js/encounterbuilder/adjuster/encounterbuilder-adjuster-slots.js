import {EncounterBuilderCandidateEncounter} from "../encounterbuilder-models-other.js";
import {EncounterBuilderOptionalCandidateEncounter} from "../encounterbuilder-models-other.js";
import {EncounterBuilderAdjusterBase} from "./encounterbuilder-adjuster-base.js";
import {EncounterBuilderTemplaterSeeded} from "../templater/encounterbuilder-templater-seeded.js";

export class EncounterbuilderAdjusterTemplated extends EncounterBuilderAdjusterBase {
	/**
	 * @param {Array<EncounterBuilderCreatureGroupBase>} creatureGroups
	 * @param {Array<EncounterBuilderCreatureGroupBase>} creatureGroupsLocked
	 * @param {Array<EncounterBuilderCreatureGroupBase>} creatureGroupsAdjustable
	 */
	async _pGetAdjustedEncounter_getSolution ({creatureGroups, creatureGroupsLocked, creatureGroupsAdjustable}) {
		const slotSeeds = creatureGroupsAdjustable.map(creatureGroup => creatureGroup.getSpend({budgetMode: this._budgetMode}));

		const templater = new EncounterBuilderTemplaterSeeded({
			partyMeta: this._partyMeta,
			spendKeys: this._cache.getKeys({budgetMode: this._budgetMode}),
			budgetMin: this._budgetMin,
			budgetMax: this._budgetMax,
			budgetMode: this._budgetMode,
			creatureGroupsLocked,
			slotSeeds,
		});

		const templateInfo = templater.getEncounterTemplateInfo();
		if (!templateInfo.templateOptions) return EncounterBuilderOptionalCandidateEncounter.failure({message: templateInfo.message});

		const templateOption = RollerUtil.rollOnArray(templateInfo.templateOptions);

		if (templateOption.length !== creatureGroupsAdjustable.length) throw new Error(`Should never occur!`);

		// The seeded solution is in low-to-high spend order; apply the results to existing creature metas in the same order
		[...creatureGroupsAdjustable]
			.sort((a, b) => SortUtil.ascSort(a.getSpend({budgetMode: this._budgetMode}), b.getSpend({budgetMode: this._budgetMode})))
			.forEach((creatureGroup, i) => {
				creatureGroup.setCount(templateOption[i].count);
			});

		return EncounterBuilderOptionalCandidateEncounter.success({
			candidateEncounter: new EncounterBuilderCandidateEncounter({
				partyMeta: this._partyMeta,
				creatureGroupsLocked,
				creatureGroupsAdjustable,
			}),
		});
	}
}
