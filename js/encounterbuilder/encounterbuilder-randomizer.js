import {EncounterBuilderConsts} from "./encounterbuilder-consts.js";
import {EncounterBuilderCandidateEncounter, EncounterBuilderCreatureMeta} from "./encounterbuilder-models.js";

export class EncounterBuilderRandomizer {
	static _NUM_SAMPLES = 20;

	constructor ({partyMeta, cache}) {
		this._partyMeta = partyMeta;
		this._cache = cache;

		// region Pre-cache various "constants" required during generation, for performance
		this._STANDARD_XP_VALUES = new Set(Object.values(Parser.XP_CHART_ALT));
		this._DESCENDING_AVAILABLE_XP_VALUES = this._cache.getXpKeys().sort(SortUtil.ascSort).reverse();
		if (this._DESCENDING_AVAILABLE_XP_VALUES.some(k => typeof k !== "number")) throw new Error(`Expected numerical XP values!`);

		/*
		Sorted array of:
		{
			cr: "1/2",
			xp: 50,
			crNum: 0.5
		}
		 */
		this._CR_METAS = Object.entries(Parser.XP_CHART_ALT)
			.map(([cr, xp]) => ({cr, xp, crNum: Parser.crToNumber(cr)}))
			.sort((a, b) => SortUtil.ascSort(b.crNum, a.crNum));
		// endregion
	}

	async pGetRandomEncounter ({difficulty, lockedEncounterCreatures}) {
		const ixLow = EncounterBuilderConsts.TIERS.indexOf(difficulty);
		if (!~ixLow) throw new Error(`Unhandled difficulty level: "${difficulty}"`);

		const budget = this._partyMeta[EncounterBuilderConsts.TIERS[ixLow + 1]] - 1;

		const closestSolution = this._pDoGenerateEncounter_getSolution({budget, lockedEncounterCreatures});

		if (!closestSolution) {
			JqueryUtil.doToast({content: `Failed to generate a valid encounter within the provided parameters!`, type: "warning"});
			return;
		}

		return closestSolution.getCreatureMetas();
	}

	_pDoGenerateEncounter_getSolution ({budget, lockedEncounterCreatures}) {
		const solutions = this._pDoGenerateEncounter_getSolutions({budget, lockedEncounterCreatures});
		const validSolutions = solutions.filter(it => this._isValidEncounter({candidateEncounter: it, budget}));
		if (validSolutions.length) return RollerUtil.rollOnArray(validSolutions);
		return null;
	}

	_pDoGenerateEncounter_getSolutions ({budget, lockedEncounterCreatures}) {
		// If there are enough players that single-monster XP is halved, generate twice as many solutions, half with double XP cap
		if (this._partyMeta.cntPlayers >= 6) {
			return [...new Array(this.constructor._NUM_SAMPLES * 2)]
				.map((_, i) => {
					return this._pDoGenerateEncounter_generateClosestEncounter({
						budget: budget * (Number((i >= this.constructor._NUM_SAMPLES)) + 1),
						rawBudget: budget,
						lockedEncounterCreatures,
					});
				});
		}

		return [...new Array(this.constructor._NUM_SAMPLES)]
			.map(() => this._pDoGenerateEncounter_generateClosestEncounter({budget: budget, lockedEncounterCreatures}));
	}

	_isValidEncounter ({candidateEncounter, budget}) {
		const encounterXp = candidateEncounter.getEncounterXpInfo({partyMeta: this._partyMeta});
		return encounterXp.adjustedXp >= (budget * 0.6) && encounterXp.adjustedXp <= (budget * 1.1);
	}

	_pDoGenerateEncounter_generateClosestEncounter ({budget, rawBudget, lockedEncounterCreatures}) {
		if (rawBudget == null) rawBudget = budget;

		const candidateEncounter = new EncounterBuilderCandidateEncounter({lockedEncounterCreatures});
		const xps = this._getUsableXpsForBudget({budget});

		let nextBudget = budget;
		let skips = 0;
		let steps = 0;
		while (xps.length) {
			if (steps++ > 100) break;

			if (skips) {
				skips--;
				xps.shift();
				continue;
			}

			const xp = xps[0];

			if (xp > nextBudget) {
				xps.shift();
				continue;
			}

			skips = this._getNumSkips({xps, candidateEncounter, xp});
			if (skips) {
				skips--;
				xps.shift();
				continue;
			}

			this._mutEncounterAddCreatureByXp({candidateEncounter, xp});

			nextBudget = this._getBudgetRemaining({candidateEncounter, budget, rawBudget});
		}

		return candidateEncounter;
	}

	_getUsableXpsForBudget ({budget}) {
		const xps = this._DESCENDING_AVAILABLE_XP_VALUES
			.filter(it => {
				// Make TftYP values (i.e. those that are not real XP thresholds) get skipped 9/10 times
				if (!this._STANDARD_XP_VALUES.has(it) && RollerUtil.randomise(10) !== 10) return false;
				return it <= budget;
			});

		// region Do initial skips--discard some potential XP values early
		// 50% of the time, skip the first 0-1/3rd of available CRs
		if (xps.length > 4 && RollerUtil.roll(2) === 1) {
			const skips = RollerUtil.roll(Math.ceil(xps.length / 3));
			return xps.slice(skips);
		}

		return xps;
		// endregion
	}

	_getBudgetRemaining ({candidateEncounter, budget, rawBudget}) {
		if (!candidateEncounter.hasCreatures()) return budget;

		const curr = candidateEncounter.getEncounterXpInfo({partyMeta: this._partyMeta});
		const budgetRemaining = budget - curr.adjustedXp;

		const meta = this._CR_METAS.filter(it => it.xp <= budgetRemaining);

		// If we're a large party, and we're doing a "single creature worth less XP" generation, force the generation
		//   to stop.
		if (rawBudget !== budget && curr.count === 1 && (rawBudget - curr.baseXp) <= 0) {
			return 0;
		}

		// if the highest CR creature has CR greater than the cutoff, adjust for next multiplier
		if (meta.length && meta[0].crNum >= curr.crCutoff) {
			const nextMult = Parser.numMonstersToXpMult(curr.relevantCount + 1, this._partyMeta.cntPlayers);
			return Math.floor((budget - (nextMult * curr.baseXp)) / nextMult);
		}

		// otherwise, no creature has CR greater than the cutoff, don't worry about multipliers
		return budgetRemaining;
	}

	_mutEncounterAddCreatureByXp ({candidateEncounter, xp}) {
		if (candidateEncounter.tryIncreaseExistingCreatureCount({xp})) return;

		// region Try to add a new creature
		// We retrieve the list of all available creatures for this XP, then randomly pick creatures from that list until
		//   we exhaust all options.
		// Generally, the first creature picked should be usable. We only need to continue our search loop if the creature
		//   picked is already included in our encounter, and is locked.
		const availableCreatures = [...this._cache.getCreaturesByXp(xp)];
		while (availableCreatures.length) {
			const ixRolled = RollerUtil.randomise(availableCreatures.length) - 1;
			const rolled = availableCreatures[ixRolled];
			availableCreatures.splice(ixRolled, 1);

			const isAdded = candidateEncounter.addCreatureMeta(
				new EncounterBuilderCreatureMeta({
					creature: rolled,
					count: 1,
				}),
			);
			if (!isAdded) continue;

			break;
		}
		// endregion
	}

	_getNumSkips ({xps, candidateEncounter, xp}) {
		// if there are existing entries at this XP, don't skip
		const existing = candidateEncounter.getCreatureMetas({xp});
		if (existing.length) return 0;

		if (xps.length <= 1) return 0;

		// skip 70% of the time by default, less 13% chance per item skipped
		const isSkip = RollerUtil.roll(100) < (70 - (13 * candidateEncounter.skipCount));
		if (!isSkip) return 0;

		candidateEncounter.skipCount++;
		const maxSkip = xps.length - 1;
		// flip coins; so long as we get heads, keep skipping
		for (let i = 0; i < maxSkip; ++i) {
			if (RollerUtil.roll(2) === 0) {
				return i;
			}
		}
		return maxSkip - 1;
	}
}
