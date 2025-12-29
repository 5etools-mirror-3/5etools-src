import {EncounterPartyMetaBase, EncounterPartyMetaBudgetTierProviderSpendUpTo, EncounterPartyMetaUtils} from "./encounter-partymeta-base.js";
import {EncounterBuilderSpendInfo} from "../encounterbuilder-models.js";
import {TIER_ABSURD, TIER_TO_LEVEL_XP, TIERS, TIERS_EXTENDED} from "../consts/encounterbuilder-consts-one.js";

export class EncounterPartyMetaOne extends EncounterPartyMetaBase {
	/**
	 * @param {Array<EncounterPartyPlayerMeta>} playerMetas
	 */
	constructor (playerMetas) {
		super(playerMetas);

		this._thresholds = EncounterPartyMetaUtils.getThresholds({
			tiers: TIERS,
			tierToLevelSpend: TIER_TO_LEVEL_XP,
			levelMetas: this.levelMetas,
			tierAboveMax: TIER_ABSURD,
		});

		this._budgetTierProvider = new EncounterPartyMetaBudgetTierProviderSpendUpTo({
			tiersExtended: TIERS_EXTENDED,
			thresholds: this._thresholds,
			deltaBudgetMinInclusive: 1,
		});
	}

	_getEncounterSpendInfo ({creatureMetas}) {
		let baseSpend = 0;
		let count = 0;

		creatureMetas
			.forEach(creatureMeta => {
				count += creatureMeta.getCount();
				baseSpend += (creatureMeta.getXp() || 0) * creatureMeta.getCount();
			});

		return new EncounterBuilderSpendInfo({
			baseSpend,
			relevantCount: count,
			count,
			adjustedSpend: baseSpend,
			crCutoff: 0,
			playerCount: this.cntPlayers,
			playerAdjustedSpendMult: 1,
		});
	}

	getBudget (tier) {
		return this._budgetTierProvider.getBudget(tier);
	}

	getBudgetRange (tier) {
		return this._budgetTierProvider.getBudgetRange(tier);
	}

	getBudgetRangeApprox (tier) {
		return this._budgetTierProvider.getBudgetRangeApprox(tier);
	}

	getEncounterTier (encounterXpInfo) {
		return this._budgetTierProvider.getEncounterTier(encounterXpInfo);
	}

	// Unused in '24 rules
	getCrCutoff (creatureMetas) { return 0; }

	// Unused in '24 rules
	getPlayerAdjustedSpendMultiplier (cntCreatures) { return 1; }
}
