import {EncounterSizer} from "./encounterbuilder-templater-sizer.js";
import {CreatureSlot, EncounterTemplateOptions} from "./encounterbuilder-templater-models.js";
import {EncounterBuilderTemplaterBase} from "./encounterbuilder-templater-base.js";

export class EncounterBuilderTemplaterRandom extends EncounterBuilderTemplaterBase {
	getEncounterTemplateInfo () {
		const cntLockedCreatures = this._creatureMetasLocked
			.map(creatureMeta => creatureMeta.getCount())
			.sum();

		const lowestSpendAmount = Math.min(...this._spendKeys);
		const lowestNonFreeSpendAmount = this._spendKeys.filter(Boolean).length
			? Math.min(...this._spendKeys.filter(Boolean))
			: null;

		const cntMin = Math.max(1, cntLockedCreatures);
		const cntMax = this._getMaxCreatureCount({cntMin, cntLockedCreatures});

		if (cntMin > cntMax) return new EncounterTemplateOptions({message: "Too many locked creatures! Unlock some, or add more players."});

		const {encounterSizeInfosBase, encounterSizeInfosAdditional} = new EncounterSizer({
			partyMeta: this._partyMeta,
			budgetMin: this._budgetMin,
			budgetMax: this._budgetMax,
			budgetMode: this._budgetMode,
		})
			.getEncounterSizeInfosGroups({
				creatureMetasLocked: this._creatureMetasLocked,
				slotSeeds: null,
				cntLockedCreatures,
				lowestSpendAmount,
				lowestNonFreeSpendAmount,
				cntMin,
				cntMax,
			});

		if (!encounterSizeInfosBase.length && !encounterSizeInfosAdditional.length) return new EncounterTemplateOptions();

		const creatureSlotBundlesBase = this._getEncounterMetasCreatureSlotBundles({
			cntLockedCreatures,
			lowestSpendAmount,
			encounterSizeMetas: encounterSizeInfosBase,
		});

		const creatureSlotBundlesAdditional = this._getEncounterMetasCreatureSlotBundles({
			cntLockedCreatures,
			lowestSpendAmount,
			encounterSizeMetas: encounterSizeInfosAdditional,
		});

		return new EncounterTemplateOptions({
			templateOptions: this._getTemplateOptions({
				categorizedCreatureSlotBundlesBase: this._getCategorizedCreatureSlotBundles({
					creatureSlotBundles: creatureSlotBundlesBase,
				}),
				categorizedCreatureSlotBundlesAdditional: this._getCategorizedCreatureSlotBundles({
					creatureSlotBundles: creatureSlotBundlesAdditional,
				}),
			}),
		});
	}

	/**
	 * @return {Array<Array<CreatureSlot>>}
	 */
	_getEncounterMetasCreatureSlotBundles (
		{
			cntLockedCreatures,
			lowestSpendAmount,
			encounterSizeMetas,
		},
	) {
		return encounterSizeMetas
			.map(({cntCreatures, playerAdjustedSpendMult}) => {
				const spendLocked = this._creatureMetasLocked
					.map(creatureMeta => creatureMeta.getCount() * creatureMeta.getSpend({budgetMode: this._budgetMode}) * playerAdjustedSpendMult)
					.sum();

				const slots = Array.from({length: cntCreatures - cntLockedCreatures}, () => new CreatureSlot({
					spendAmount: lowestSpendAmount,
					count: 1,
				}));

				const cntSlotsDesired = Math.max(1, this._getMaxDesiredCreatureTypes() - this._creatureMetasLocked.length);
				const slotsMerged = [];
				slots.forEach(slot => {
					if (slotsMerged.length < cntSlotsDesired) return slotsMerged.push(slot);
					RollerUtil.rollOnArray(slotsMerged).count += slot.count;
				});

				const ixsRemaining = [...slotsMerged.keys()];

				while (ixsRemaining.length) {
					const ix = RollerUtil.rollOnArray(ixsRemaining);
					const slotToBump = slotsMerged[ix];
					const spendCur = slotToBump.spendAmount;

					const ixSpendNxt = this._spendKeys.indexOf(spendCur);
					if (!~ixSpendNxt) throw new Error(`Could not find "${spendCur}" in cache keys "${this._spendKeys.join(", ")}. This should never occur!`);

					const spendNxt = this._spendKeys[ixSpendNxt + 1];
					if (spendNxt == null) {
						ixsRemaining.splice(ixsRemaining.indexOf(ix), 1);
						continue;
					}

					slotToBump.spendAmount = spendNxt;

					if (
						(spendLocked + slotsMerged.map(slot => slot.getTotalSpend({playerAdjustedSpendMult})).sum()) > this._budgetMax
					) {
						slotToBump.spendAmount = spendCur;
						ixsRemaining.splice(ixsRemaining.indexOf(ix), 1);
					}
				}

				return slotsMerged;
			});
	}
}
