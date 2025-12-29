import {EncounterBuilderCandidateEncounter, EncounterBuilderCreatureMeta, EncounterBuilderOptionalCandidateEncounter} from "../encounterbuilder-models.js";
import {EncounterBuilderRandomizerBase} from "./encounterbuilder-randomizer-base.js";
import {EncounterBuilderTemplaterRandom} from "../templater/encounterbuilder-templater-random.js";
import {EncounterbuilderTemplaterTemplated} from "../templater/encounterbuilder-templater-templated.js";
import {ENCOUNTER_SHAPE_RANDOM_NAME, ENCOUNTER_SHAPE_RANDOM_SOURCE} from "../encounterbuilder-consts.js";

/**
 * A randomizer which builds a valid encounter template of creature slots, then fills those slots.
 *
 * Algorithm:
 *   - Generate a minimum/maximum bound for the number of creatures (e.g. 3-5)
 *   - Generate one template per integer in those bounds (e.g. 3, 4, 5)
 *   - For each template, merge creatures into creature types, attempting to maintain a good variety of creature types (e.g. 2, 2, 4)
 *   - Randomly increase the XP available to each creature type, starting from the minimum, and distributing XP until the budget it spent
 *   - Generate a value (e.g. "goblin") for each creature type
 */
export class EncounterBuilderRandomizerTemplated extends EncounterBuilderRandomizerBase {
	constructor ({encounterShapesLookup, encounterShapeHash, ...rest}) {
		super({...rest});
		this._encounterShapesLookup = encounterShapesLookup;
		this._encounterShapeHash = encounterShapeHash || UrlUtil.URL_TO_HASH_BUILDER["encounterShape"]({name: ENCOUNTER_SHAPE_RANDOM_NAME, source: ENCOUNTER_SHAPE_RANDOM_SOURCE});
	}

	_getTemplater ({creatureMetasLocked}) {
		const spendKeys = this._cache.getKeys({
			budgetMode: this._budgetMode,
			// Skip TftYP "Reduced-Threat" values (i.e. those that are not real XP thresholds) 95% of the time
			isIgnoreNonStandardValues: RollerUtil.randomise(20) !== 20,
		});

		const encounterShape = this._encounterShapesLookup.getEncounterShape(this._encounterShapeHash);
		if (!encounterShape.shapeTemplate?.length) {
			return new EncounterBuilderTemplaterRandom({
				partyMeta: this._partyMeta,
				spendKeys,
				budgetMin: this._budgetMin,
				budgetMax: this._budgetMax,
				budgetMode: this._budgetMode,
				creatureMetasLocked,
			});
		}

		return new EncounterbuilderTemplaterTemplated({
			partyMeta: this._partyMeta,
			spendKeys,
			budgetMin: this._budgetMin,
			budgetMax: this._budgetMax,
			budgetMode: this._budgetMode,
			creatureMetasLocked,
			encounterShape,
		});
	}

	_pDoGenerateEncounter_getSolution ({creatureMetasLocked}) {
		const templater = this._getTemplater({creatureMetasLocked});

		const templateInfo = templater.getEncounterTemplateInfo();
		if (!templateInfo.templateOptions) return EncounterBuilderOptionalCandidateEncounter.failure({message: templateInfo.message});

		const validEncounters = templateInfo.templateOptions
			.map(creatureMetaTemplates => {
				const candidateEncounter = new EncounterBuilderCandidateEncounter({partyMeta: this._partyMeta, creatureMetasLocked});
				const usedCreatureHashes = new Set();

				const isAddPerTemplate = creatureMetaTemplates
					.map(({spendAmount, count}) => {
						const availableCreatures = [
							...this._cache.getCreatures({
								budgetMode: this._budgetMode,
								spendValue: spendAmount,
								isPreferNonSingleton: count !== 1,
							}),
						]
							.filter(mon => {
								if (candidateEncounter.isCreatureLocked(mon)) return false;
								if (templateInfo.isUniqueKeys && usedCreatureHashes.has(UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY](mon))) return false;
								return true;
							});

						if (!availableCreatures.length) return false;

						const creature = RollerUtil.rollOnArray(availableCreatures);
						usedCreatureHashes.add(UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY](creature));

						return candidateEncounter.addCreatureMeta(
							new EncounterBuilderCreatureMeta({
								creature,
								count,
							}),
						);
					});

				if (!isAddPerTemplate.every(Boolean)) return null;

				return candidateEncounter;
			})
			.filter(Boolean);
		if (!validEncounters.length) return EncounterBuilderOptionalCandidateEncounter.failure();

		return EncounterBuilderOptionalCandidateEncounter.success({candidateEncounter: RollerUtil.rollOnArray(validEncounters)});
	}
}
