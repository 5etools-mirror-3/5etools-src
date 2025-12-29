import {EncounterSizer} from "./encounterbuilder-templater-sizer.js";
import {CreatureSlot, EncounterTemplateOptions} from "./encounterbuilder-templater-models.js";
import {EncounterBuilderTemplaterBase} from "./encounterbuilder-templater-base.js";

export class EncounterBuilderTemplaterSeeded extends EncounterBuilderTemplaterBase {
	/**
	 * @param {Array<number>} slotSeeds
	 * @param rest
	 */
	constructor ({slotSeeds, ...rest}) {
		super({...rest});
		this._slotSeeds = slotSeeds;
	}

	getEncounterTemplateInfo () {
		const cntLockedCreatures = this._creatureMetasLocked
			.map(creatureMeta => creatureMeta.getCount())
			.sum();
		const cntSlotSeeds = this._slotSeeds?.length || 0;

		const lowestSpendAmount = Math.min(...this._slotSeeds);
		const lowestNonFreeSpendAmount = this._slotSeeds.filter(Boolean).length
			? Math.min(...this._slotSeeds.filter(Boolean))
			: null;

		const cntMin = Math.max(1, cntLockedCreatures + cntSlotSeeds);
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
				slotSeeds: this._slotSeeds,
				cntLockedCreatures,
				lowestSpendAmount,
				lowestNonFreeSpendAmount,
				cntMin,
				cntMax,
			});

		if (!encounterSizeInfosBase.length && !encounterSizeInfosAdditional.length) return new EncounterTemplateOptions();

		const creatureSlotBundlesBase = this._getEncounterMetasCreatureSlotBundlesFromSeeds({
			cntLockedCreatures,
			lowestSpendAmount,
			encounterSizeMetas: encounterSizeInfosBase,
		});

		const creatureSlotBundlesAdditional = this._getEncounterMetasCreatureSlotBundlesFromSeeds({
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
	 * @param {number} cntLockedCreatures
	 * @param {Array<_EncounterSizeInfo>} encounterSizeMetas
	 **
	 * @return {Array<Array<CreatureSlot>>}
	 */
	_getEncounterMetasCreatureSlotBundlesFromSeeds (
		{
			cntLockedCreatures,
			encounterSizeMetas,
		},
	) {
		const slotSeeds = [...this._slotSeeds]
			.sort(SortUtil.ascSort);

		const slotSeedsSpendable = [...slotSeeds]
			.reverse()
			.unique();

		return encounterSizeMetas
			.flatMap(({cntCreatures, playerAdjustedSpendMult}) => {
				const spendLocked = this._creatureMetasLocked
					.map(creatureMeta => creatureMeta.getCount() * creatureMeta.getSpend({budgetMode: this._budgetMode}) * playerAdjustedSpendMult)
					.sum();

				const slots = slotSeeds
					.map(spendAmount => new CreatureSlot({
						spendAmount,
						count: 1,
					}));

				const cntToAdd = cntCreatures - cntLockedCreatures - slotSeeds.length;
				if (cntToAdd < 0) throw new Error(`Should never occur!`);
				if (!cntToAdd) return [slots];

				const spendAmountToSlot = slots
					.reduce((accum, slot) => {
						(accum[slot.spendAmount] ||= []).push(slot);
						return accum;
					}, {});

				const getBudgetSpent = () => slots.map(slot => slot.getTotalSpend({playerAdjustedSpendMult})).sum() - spendLocked;

				const recurseFillSlots = (
					{
						operations,
						cpySlotSeedsSpendable,
						budgetRemaining,
						cntCreaturesAdded,
					},
				) => {
					if (cntCreaturesAdded >= cntToAdd) return cntToAdd - cntCreaturesAdded;
					if (!cpySlotSeedsSpendable.length) return cntToAdd - cntCreaturesAdded;

					for (let ixSlotSeed = 0; ixSlotSeed < cpySlotSeedsSpendable.length; ++ixSlotSeed) {
						const slotSeed = cpySlotSeedsSpendable[ixSlotSeed];
						if ((slotSeed * playerAdjustedSpendMult) > budgetRemaining) continue;

						const slot = RollerUtil.rollOnArray(spendAmountToSlot[slotSeed]);
						slot.count += 1;
						operations.push({slotSeed, slot, ixSlotSeed});

						return recurseFillSlots({
							operations,
							cpySlotSeedsSpendable,
							budgetRemaining: budgetRemaining - (slotSeed * playerAdjustedSpendMult),
							cntCreaturesAdded: cntCreaturesAdded + 1,
						});
					}

					const maxSpend = Math.max(...operations.map(({slotSeed}) => slotSeed));
					const ixUndo = operations.findIndex(({slotSeed}) => slotSeed === maxSpend);

					const [opUndo] = operations.splice(ixUndo, 1);
					if (!opUndo) return cntToAdd - cntCreaturesAdded;

					const {slotSeed, slot} = opUndo;
					slot.count -= 1;

					return recurseFillSlots({
						operations,
						cpySlotSeedsSpendable: cpySlotSeedsSpendable
							.filter(slotSeed_ => slotSeed_ !== slotSeed),
						budgetRemaining: budgetRemaining + (slotSeed * playerAdjustedSpendMult),
						cntCreaturesAdded: cntCreaturesAdded - 1,
					});
				};

				// Try "random spend first", as it produces more interesting results
				const cntToAddUnusedShuffle = recurseFillSlots({
					operations: [],
					cpySlotSeedsSpendable: [...slotSeedsSpendable].shuffle(),
					budgetRemaining: this._budgetMax - getBudgetSpent(),
					cntCreaturesAdded: 0,
				});
				if (!cntToAddUnusedShuffle && getBudgetSpent() >= this._budgetMin) return [slots];

				// If we couldn't find an encounter with "random spend first", reset, and use "largest spend first"
				slots.forEach(slot => slot.count = 1);

				recurseFillSlots({
					operations: [],
					cpySlotSeedsSpendable: [...slotSeedsSpendable],
					budgetRemaining: this._budgetMax - getBudgetSpent(),
					cntCreaturesAdded: 0,
				});

				return [slots];
			});
	}
}
