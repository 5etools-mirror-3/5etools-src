import {CreatureSlot} from "./encounterbuilder-templater-models.js";

class _EncounterSizeInfo {
	constructor ({cntCreatures, playerAdjustedSpendMult, isAboveBudgetMin}) {
		this.cntCreatures = cntCreatures;
		this.playerAdjustedSpendMult = playerAdjustedSpendMult;
		this.isAboveBudgetMin = isAboveBudgetMin;
	}
}

class _EncounterSizeInfosGroup {
	/**
	 * @param {?Array<_EncounterSizeInfo>} encounterSizeInfosBase
	 * @param {?Array<_EncounterSizeInfo>} encounterSizeInfosAdditional
	 */
	constructor ({encounterSizeInfosBase, encounterSizeInfosAdditional} = {}) {
		this.encounterSizeInfosBase = encounterSizeInfosBase || [];
		this.encounterSizeInfosAdditional = encounterSizeInfosAdditional || [];
	}
}

export class EncounterSizer {
	constructor ({partyMeta, budgetMin, budgetMax, budgetMode}) {
		this._partyMeta = partyMeta;
		this._budgetMin = budgetMin;
		this._budgetMax = budgetMax;
		this._budgetMode = budgetMode;
	}

	// This is obviously horribly impractical, but if the user is e.g. attempting to adjust an encounter
	//   of only CR 1/8 creatures for a party of level 20 characters, then they probably expect/want
	//   absurd results.
	// Fighting `2,000× Giant Crab` _is_ pretty funny.
	static _MAX_ENCOUNTER_SIZE = 2_500;

	/**
	 * @return {_EncounterSizeInfosGroup}
	 */
	getEncounterSizeInfosGroups (
		{
			creatureMetasLocked,
			slotSeeds = null,
			cntLockedCreatures,
			lowestSpendAmount,
			lowestNonFreeSpendAmount = null,
			cntMin,
			cntMax,
		},
	) {
		const seededSlotsMin = slotSeeds
			? [...slotSeeds]
				.sort(SortUtil.ascSort)
				.map(spendAmount => new CreatureSlot({
					spendAmount,
					count: 1,
				}))
			: null;

		// Check both with/without using "free" creatures; this allows us to find solutions which meet the desired number:
		//   - by spamming free creatures
		//   - by avoiding free creatures
		//   - by having a healthy mix of both
		const encounterSizeMetaPairsBase = Array.from({length: (cntMax - cntMin) + 1}, (_, i) => cntMin + i)
			.map(cntCreatures => ({
				encounterSizeMeta: this._getEncounterSizeMeta({
					creatureMetasLocked,
					cntLockedCreatures,
					lowestSpendAmount,
					seededSlotsMin,
					cntCreatures,
				}),
				encounterSizeMetaNonFree: lowestNonFreeSpendAmount == null
					? null
					: this._getEncounterSizeMeta({
						creatureMetasLocked,
						cntLockedCreatures,
						lowestSpendAmount: lowestNonFreeSpendAmount,
						seededSlotsMin,
						cntCreatures,
					}),
			}))
			.filter(({encounterSizeMeta}) => encounterSizeMeta);

		// If every option was over budget, bail out
		if (!encounterSizeMetaPairsBase.length) return new _EncounterSizeInfosGroup();

		// If we *only* have "free" creatures, use what we have, as no amount of addition will help
		if (lowestNonFreeSpendAmount == null) {
			return new _EncounterSizeInfosGroup({
				encounterSizeInfosBase: encounterSizeMetaPairsBase
					.map(({encounterSizeMeta}) => encounterSizeMeta),
			});
		}

		// Otherwise, attempt to extend the list until we find something in the exact range (or exhaust the available size options)
		// Always attempt to generate *some* additional size metas, but reduce the amount if we already have any which are valid.
		const encounterSizeMetaPairsAdditional = [];

		// Give up after too many encounters which only work with "free" creatures
		//   If we have seeds, allow for an additional instance of each "free" seed
		const cntAdditional = (slotSeeds || []).filter(slotSeed => !slotSeed).length
			+ Math.max(0, 5 - encounterSizeMetaPairsBase.length)
			+ Math.floor(Math.random() * 8);
		let triesNonFreeMiss = cntAdditional;
		for (let cntCreatures = cntMax + 1; cntCreatures < cntMax + this.constructor._MAX_ENCOUNTER_SIZE; ++cntCreatures) {
			const encounterSizeMeta = this._getEncounterSizeMeta({
				creatureMetasLocked,
				cntLockedCreatures,
				lowestSpendAmount,
				seededSlotsMin,
				cntCreatures,
			});
			const encounterSizeMetaNonFree = this._getEncounterSizeMeta({
				creatureMetasLocked,
				cntLockedCreatures,
				lowestSpendAmount: lowestNonFreeSpendAmount,
				seededSlotsMin,
				cntCreatures,
			});

			// Larger encounters don't work; we've exhausted all options
			if (!encounterSizeMeta) break;

			if (!encounterSizeMetaNonFree) {
				if (!--triesNonFreeMiss) break;
			}

			encounterSizeMetaPairsAdditional.push({encounterSizeMeta, encounterSizeMetaNonFree});
		}

		const getRandomItems = (arr, cnt) => {
			if (arr.length <= cnt) return arr;
			const out = [];
			const cpy = arr.slice();
			for (let i = 0; i < cnt; ++i) {
				const ix = RollerUtil.randomise(cpy.length) - 1;
				const [itm] = cpy.splice(ix, 1);
				out.push(itm);
			}
			return out;
		};

		return new _EncounterSizeInfosGroup({
			encounterSizeInfosBase: encounterSizeMetaPairsBase
				.map(({encounterSizeMeta}) => encounterSizeMeta),
			encounterSizeInfosAdditional: getRandomItems(encounterSizeMetaPairsAdditional, cntAdditional)
				.map(({encounterSizeMeta}) => encounterSizeMeta),
		});
	}

	_getEncounterSizeMeta (
		{
			creatureMetasLocked,
			cntLockedCreatures,
			lowestSpendAmount,
			seededSlotsMin,
			cntCreatures,
		},
	) {
		if (seededSlotsMin && cntCreatures < seededSlotsMin.length) throw new Error(`Should never occur!`);

		const playerAdjustedSpendMult = this._partyMeta.getPlayerAdjustedSpendMultiplier(cntCreatures);

		let spendLocked = 0;
		let spendLowestUnlocked = seededSlotsMin
			? 0
			: (lowestSpendAmount * playerAdjustedSpendMult * cntCreatures);

		// If this number of creatures can never produce a valid encounter, skip it
		if (spendLowestUnlocked > this._budgetMax) return null;

		if (cntLockedCreatures) {
			spendLocked = creatureMetasLocked
				.map(creatureMeta => creatureMeta.getCount() * creatureMeta.getSpend({budgetMode: this._budgetMode}) * playerAdjustedSpendMult)
				.sum();
			const spendUnlockedMin = lowestSpendAmount * playerAdjustedSpendMult * (cntCreatures - cntLockedCreatures);

			if ((spendLocked + spendUnlockedMin) > this._budgetMax) return null;

			spendLowestUnlocked += spendLocked;
		}

		if (seededSlotsMin) {
			// If we're using seeded slots, add all additional creatures to the cheapest slot,
			//   and check if this could ever be a valid encounter
			const cntAdditionalCheapest = cntCreatures - seededSlotsMin.length;
			const spendSeeded = seededSlotsMin
				.map((slot, i) => slot.getTotalSpend({playerAdjustedSpendMult, countAdditional: i === 0 ? cntAdditionalCheapest : 0}))
				.sum();
			if ((spendLocked + spendSeeded) > this._budgetMax) return null;

			spendLowestUnlocked += spendSeeded;
		}

		return new _EncounterSizeInfo({
			cntCreatures,
			playerAdjustedSpendMult,
			isAboveBudgetMin: spendLowestUnlocked >= this._budgetMin,
		});
	}
}
