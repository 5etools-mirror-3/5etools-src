import {EncounterPartyMetaBase, EncounterPartyMetaUtils} from "./encounter-partymeta-base.js";
import {EncounterBuilderSpendInfo} from "../encounterbuilder-models.js";
import {LEVEL_TO_XP_DAILY, MONSTER_COUNT_TO_XP_MULTIPLIER, TIER_ABSURD, TIER_TO_LEVEL_XP, TIER_TRIVIAL, TIERS_EXTENDED} from "../consts/encounterbuilder-consts-classic.js";

export class EncounterPartyMetaClassic extends EncounterPartyMetaBase {
	/**
	 * @param {Array<EncounterPartyPlayerMeta>} playerMetas
	 */
	constructor (playerMetas) {
		super(playerMetas);

		this._thresholds = EncounterPartyMetaUtils.getThresholds({
			tiers: TIERS_EXTENDED,
			tierToLevelSpend: TIER_TO_LEVEL_XP,
			levelMetas: this.levelMetas,
			tierAboveMax: TIER_ABSURD,
		});

		this._dailyBudget = this.levelMetas
			.map(meta => LEVEL_TO_XP_DAILY[meta.level] * meta.count)
			.sum();
	}

	_getEncounterSpendInfo ({creatureMetas}) {
		let baseSpend = 0;
		let relevantCount = 0;
		let count = 0;

		const crCutoff = this.getCrCutoff(creatureMetas);
		creatureMetas
			.forEach(creatureMeta => {
				if (creatureMeta.getCrNumber() >= crCutoff) relevantCount += creatureMeta.getCount();
				count += creatureMeta.getCount();
				baseSpend += (creatureMeta.getXp() || 0) * creatureMeta.getCount();
			});

		const playerAdjustedSpendMult = this.getPlayerAdjustedSpendMultiplier(relevantCount, this.cntPlayers);

		const adjustedSpend = playerAdjustedSpendMult * baseSpend;
		return new EncounterBuilderSpendInfo({
			baseSpend,
			relevantCount,
			count,
			adjustedSpend,
			crCutoff,
			playerCount: this.cntPlayers,
			playerAdjustedSpendMult,
		});
	}

	getBudget (tier) {
		const ixTier = TIERS_EXTENDED.indexOf(tier);
		if (!~ixTier) throw new Error(`Unhandled difficulty level: "${tier}"`);

		return this._thresholds[TIERS_EXTENDED[ixTier + 1]] - 1;
	}

	getBudgetRange (tier) {
		return {budgetMin: this._thresholds[tier], budgetMax: this.getBudget(tier)};
	}

	getBudgetRangeApprox (tier) {
		return this.getBudgetRange(tier);
	}

	getEncounterTier (encounterXpInfo) {
		if (!encounterXpInfo) return TIER_TRIVIAL;

		const tierMaximum = TIERS_EXTENDED.at(-1);
		if (encounterXpInfo.adjustedSpend >= this._thresholds[tierMaximum]) return TIER_ABSURD;

		for (const tier of [...TIERS_EXTENDED].reverse()) {
			if (encounterXpInfo.adjustedSpend >= this._thresholds[tier]) return tier;
		}

		return TIER_TRIVIAL;
	}

	/** Return true if at least a third of the party is level 5+. */
	_isPartyLevelFivePlus () {
		const [levelMetasHigher, levelMetasLower] = this.levelMetas.partition(it => it.level >= 5);
		const cntLower = levelMetasLower.map(it => it.count).reduce((a, b) => a + b, 0);
		const cntHigher = levelMetasHigher.map(it => it.count).reduce((a, b) => a + b, 0);
		return (cntHigher / (cntLower + cntHigher)) >= 0.333;
	}

	getCrCutoff (creatureMetas) {
		creatureMetas = creatureMetas
			.filter(creatureMeta => creatureMeta.getCrNumber() != null)
			.sort((a, b) => SortUtil.ascSort(b.getCrNumber(), a.getCrNumber()));
		if (!creatureMetas.length) return 0;

		// no cutoff for CR 0-2
		if (creatureMetas[0].getCrNumber() <= 2) return 0;

		// ===============================================================================================================
		// "When making this calculation, don't count any monsters whose challenge rating is significantly below the average
		// challenge rating of the other monsters in the group unless you think the weak monsters significantly contribute
		// to the difficulty of the encounter." -- DMG, p. 82
		// ===============================================================================================================

		// "unless you think the weak monsters significantly contribute to the difficulty of the encounter"
		// For player levels <5, always include every monster. We assume that levels 5> will have strong
		//   AoE/multiattack, allowing trash to be quickly cleared.
		if (!this._isPartyLevelFivePlus()) return 0;

		// Spread the CRs into a single array
		const crValues = [];
		creatureMetas.forEach(creatureMeta => {
			const cr = creatureMeta.getCrNumber();
			for (let i = 0; i < creatureMeta.getCount(); ++i) crValues.push(cr);
		});

		// TODO(Future) allow this to be controlled by the user
		let CR_THRESH_MODE = "statisticallySignificant";

		switch (CR_THRESH_MODE) {
			// "Statistically significant" method--note that this produces very passive filtering; the threshold is below
			//   the minimum CR in the vast majority of cases.
			case "statisticallySignificant": {
				const cpy = MiscUtil.copy(crValues)
					.sort(SortUtil.ascSort);

				const avg = cpy.mean();
				const deviation = cpy.meanAbsoluteDeviation();

				return avg - (deviation * 2);
			}

			case "5etools": {
				// The ideal interpretation of this:
				//   "don't count any monsters whose challenge rating is significantly below the average
				//   challenge rating of the other monsters in the group"
				// Is:
				//   Arrange the creatures in CR order, lowest to highest. Remove the lowest CR creature (or one of them, if there
				//   are ties). Calculate the average CR without this removed creature. If the removed creature's CR is
				//   "significantly below" this average, repeat the process with the next lowest CR creature.
				// However, this can produce a stair-step pattern where our average CR keeps climbing as we remove more and more
				//   creatures. Therefore, only do this "remove creature -> calculate average CR" step _once_, and use the
				//   resulting average CR to calculate a cutoff.

				const crMetas = [];

				// If there's precisely one CR value, use it
				if (crValues.length === 1) {
					crMetas.push({
						mean: crValues[0],
						deviation: 0,
					});
				} else {
					// Get an average CR for every possible encounter without one of the creatures in the encounter
					for (let i = 0; i < crValues.length; ++i) {
						const crValueFilt = crValues.filter((_, j) => i !== j);
						const crMean = crValueFilt.mean();
						const crStdDev = Math.sqrt((1 / crValueFilt.length) * crValueFilt.map(it => (it - crMean) ** 2).reduce((a, b) => a + b, 0));
						crMetas.push({mean: crMean, deviation: crStdDev});
					}
				}

				// Sort by descending average CR -> ascending deviation
				crMetas.sort((a, b) => SortUtil.ascSort(b.mean, a.mean) || SortUtil.ascSort(a.deviation, b.deviation));

				// "significantly below the average" -> cutoff at half the average
				return crMetas[0].mean / 2;
			}

			default:
				return 0;
		}
	}

	getPlayerAdjustedSpendMultiplier (cntCreatures) {
		const baseVal = cntCreatures >= MONSTER_COUNT_TO_XP_MULTIPLIER.length
			? 4
			: this._getMonsterCountXpMultiplier(cntCreatures);

		if (this.cntPlayers < 3) return baseVal >= 3 ? baseVal + 1 : baseVal + 0.5;
		if (this.cntPlayers > 5) return baseVal === 4 ? 3 : baseVal - 0.5;
		return baseVal;
	}

	_getMonsterCountXpMultiplier (cntCreatures) {
		if (!cntCreatures) return MONSTER_COUNT_TO_XP_MULTIPLIER[0];
		if (cntCreatures > MONSTER_COUNT_TO_XP_MULTIPLIER.length) return MONSTER_COUNT_TO_XP_MULTIPLIER.at(-1);
		return MONSTER_COUNT_TO_XP_MULTIPLIER[cntCreatures - 1];
	}

	getDailyBudget () {
		return this._dailyBudget;
	}
}
