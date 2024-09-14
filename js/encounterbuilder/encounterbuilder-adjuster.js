import {EncounterBuilderConsts} from "./encounterbuilder-consts.js";
import {EncounterBuilderHelpers} from "./encounterbuilder-helpers.js";
import {EncounterBuilderCreatureMeta} from "./encounterbuilder-models.js";

export class EncounterBuilderAdjuster {
	static _INCOMPLETE_EXHAUSTED = 0;
	static _INCOMPLETE_FAILED = -1;
	static _COMPLETE = 1;

	constructor ({partyMeta}) {
		this._partyMeta = partyMeta;
	}

	/**
	 * @param {string} difficulty
	 * @param {Array<EncounterBuilderCreatureMeta>} creatureMetas
	 */
	async pGetAdjustedEncounter ({difficulty, creatureMetas}) {
		if (!creatureMetas.length) {
			JqueryUtil.doToast({content: `The current encounter contained no creatures! Please add some first.`, type: "warning"});
			return;
		}

		if (creatureMetas.every(it => it.isLocked)) {
			JqueryUtil.doToast({content: `The current encounter contained only locked creatures! Please unlock or add some other creatures some first.`, type: "warning"});
			return;
		}

		creatureMetas = creatureMetas.map(creatureMeta => creatureMeta.copy());

		const creatureMetasAdjustable = creatureMetas
			.filter(creatureMeta => !creatureMeta.isLocked && creatureMeta.getCrNumber() != null);

		if (!creatureMetasAdjustable.length) {
			JqueryUtil.doToast({content: `The current encounter contained only locked creatures, or creatures without XP values! Please unlock or add some other creatures some first.`, type: "warning"});
			return;
		}

		creatureMetasAdjustable
			.forEach(creatureMeta => creatureMeta.count = 1);

		const ixDifficulty = EncounterBuilderConsts.TIERS.indexOf(difficulty);
		if (!~ixDifficulty) throw new Error(`Unhandled difficulty level: "${difficulty}"`);

		// fudge min/max numbers slightly
		const [targetMin, targetMax] = [
			Math.floor(this._partyMeta[EncounterBuilderConsts.TIERS[ixDifficulty]] * 0.9),
			Math.ceil((this._partyMeta[EncounterBuilderConsts.TIERS[ixDifficulty + 1]] - 1) * 1.1),
		];

		if (EncounterBuilderCreatureMeta.getEncounterXpInfo(creatureMetas, this._partyMeta).adjustedXp > targetMax) {
			JqueryUtil.doToast({content: `Could not adjust the current encounter to ${difficulty.uppercaseFirst()}, try removing some creatures!`, type: "danger"});
			return;
		}

		// only calculate this once rather than during the loop, to ensure stable conditions
		// less accurate in some cases, but should prevent infinite loops
		const crCutoff = EncounterBuilderHelpers.getCrCutoff(creatureMetas, this._partyMeta);

		// randomly choose creatures to skip
		// generate array of [0, 1, ... n-1] where n = number of unique creatures
		// this will be used to determine how many of the unique creatures we want to skip
		const numSkipTotals = [...new Array(creatureMetasAdjustable.length)]
			.map((_, ix) => ix);

		const invalidSolutions = [];
		let lastAdjustResult;
		for (let maxTries = 999; maxTries >= 0; --maxTries) {
			// -1/1 = complete; 0 = continue
			lastAdjustResult = this._pGetAdjustedEncounter_doTryAdjusting({creatureMetas, creatureMetasAdjustable, numSkipTotals, targetMin, targetMax});
			if (lastAdjustResult !== this.constructor._INCOMPLETE_EXHAUSTED) break;

			invalidSolutions.push(creatureMetas.map(creatureMeta => creatureMeta.copy()));

			// reset for next attempt
			creatureMetasAdjustable
				.forEach(creatureMeta => creatureMeta.count = 1);
		}

		// no good solution was found, so pick the closest invalid solution
		if (lastAdjustResult !== this.constructor._COMPLETE && invalidSolutions.length) {
			creatureMetas = invalidSolutions
				.map(creatureMetasInvalid => ({
					encounter: creatureMetasInvalid,
					distance: this._pGetAdjustedEncounter_getSolutionDistance({creatureMetas: creatureMetasInvalid, targetMin, targetMax}),
				}))
				.sort((a, b) => SortUtil.ascSort(a.distance, b.distance))[0].encounter;
		}

		// do a post-step to randomly bulk out our counts of "irrelevant" creatures, ensuring plenty of fireball fodder
		this._pGetAdjustedEncounter_doIncreaseIrrelevantCreatureCount({creatureMetas, creatureMetasAdjustable, crCutoff, targetMax});

		return creatureMetas;
	}

	_pGetAdjustedEncounter_getSolutionDistance ({creatureMetas, targetMin, targetMax}) {
		const xp = EncounterBuilderCreatureMeta.getEncounterXpInfo(creatureMetas, this._partyMeta).adjustedXp;
		if (xp > targetMax) return xp - targetMax;
		if (xp < targetMin) return targetMin - xp;
		return 0;
	}

	_pGetAdjustedEncounter_doTryAdjusting ({creatureMetas, creatureMetasAdjustable, numSkipTotals, targetMin, targetMax}) {
		if (!numSkipTotals.length) return this.constructor._INCOMPLETE_FAILED; // no solution possible, so exit loop

		let skipIx = 0;
		// 7/12 * 7/12 * ... chance of moving the skipIx along one
		while (!(RollerUtil.randomise(12) > 7) && skipIx < numSkipTotals.length - 1) skipIx++;

		const numSkips = numSkipTotals.splice(skipIx, 1)[0]; // remove the selected skip amount; we'll try the others if this one fails
		const curUniqueCreatures = [...creatureMetasAdjustable];
		if (numSkips) {
			[...new Array(numSkips)].forEach(() => {
				const ixRemove = RollerUtil.randomise(curUniqueCreatures.length) - 1;
				if (!~ixRemove) return;
				curUniqueCreatures.splice(ixRemove, 1);
			});
		}

		for (let maxTries = 999; maxTries >= 0; --maxTries) {
			const encounterXp = EncounterBuilderCreatureMeta.getEncounterXpInfo(creatureMetas, this._partyMeta);
			if (encounterXp.adjustedXp > targetMin && encounterXp.adjustedXp < targetMax) {
				return this.constructor._COMPLETE;
			}

			// chance to skip each creature at each iteration
			// otherwise, the case where every creature is relevant produces an equal number of every creature
			const pickFrom = [...curUniqueCreatures];
			if (pickFrom.length > 1) {
				let loops = Math.floor(pickFrom.length / 2);
				// skip [half, n-1] creatures
				loops = RollerUtil.randomise(pickFrom.length - 1, loops);
				while (loops-- > 0) {
					const ix = RollerUtil.randomise(pickFrom.length) - 1;
					pickFrom.splice(ix, 1);
				}
			}

			while (pickFrom.length) {
				const ix = RollerUtil.randomise(pickFrom.length) - 1;
				const picked = pickFrom.splice(ix, 1)[0];
				picked.count++;
				if (EncounterBuilderCreatureMeta.getEncounterXpInfo(creatureMetas, this._partyMeta).adjustedXp > targetMax) {
					picked.count--;
				}
			}
		}

		return this.constructor._INCOMPLETE_EXHAUSTED;
	}

	_pGetAdjustedEncounter_doIncreaseIrrelevantCreatureCount ({creatureMetas, creatureMetasAdjustable, crCutoff, targetMax}) {
		const creatureMetasBelowCrCutoff = creatureMetasAdjustable.filter(creatureMeta => creatureMeta.getCrNumber() < crCutoff);
		if (!creatureMetasBelowCrCutoff.length) return;

		let budget = targetMax - EncounterBuilderCreatureMeta.getEncounterXpInfo(creatureMetas, this._partyMeta).adjustedXp;
		if (budget <= 0) return;

		const usable = creatureMetasBelowCrCutoff.filter(creatureMeta => creatureMeta.getXp() < budget);
		if (!usable.length) return;

		// try to avoid flooding low-level parties
		const {min: playerToCreatureRatioMin, max: playerToCreatureRatioMax} = this._pGetAdjustedEncounter_getPlayerToCreatureRatios();
		const minDesired = Math.floor(playerToCreatureRatioMin * this._partyMeta.cntPlayers);
		const maxDesired = Math.ceil(playerToCreatureRatioMax * this._partyMeta.cntPlayers);

		// keep rolling until we fail to add a creature, or until we're out of budget
		while (EncounterBuilderCreatureMeta.getEncounterXpInfo(creatureMetas, this._partyMeta).adjustedXp <= targetMax) {
			const totalCreatures = creatureMetas
				.map(creatureMeta => creatureMeta.count)
				.sum();

			// if there's less than min desired, large chance of adding more
			// if there's more than max desired, small chance of adding more
			// if there's between min and max desired, medium chance of adding more
			const chanceToAdd = totalCreatures < minDesired ? 90 : totalCreatures > maxDesired ? 40 : 75;

			const isAdd = RollerUtil.roll(100) < chanceToAdd;
			if (!isAdd) break;

			RollerUtil.rollOnArray(creatureMetasBelowCrCutoff).count++;
		}
	}

	_pGetAdjustedEncounter_getPlayerToCreatureRatios () {
		if (this._partyMeta.avgPlayerLevel < 5) return {min: 0.8, max: 1.3};
		if (this._partyMeta.avgPlayerLevel < 11) return {min: 1, max: 2};
		if (this._partyMeta.avgPlayerLevel < 17) return {min: 1, max: 3};
		return {min: 1, max: 4};
	}
}
