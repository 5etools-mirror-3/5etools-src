import {EncounterPartyMetaBase, EncounterPartyMetaBudgetTierProviderSpendUpTo, EncounterPartyMetaUtils} from "./encounter-partymeta-base.js";
import {EncounterBuilderSpendInfo} from "../encounterbuilder-models-other.js";
import {LEVEL_CR_CAP, TIER_EXTREME, TIER_TO_LEVEL_CR, TIERS, TIERS_EXTENDED} from "../consts/encounterbuilder-consts-mcdmfleemortals.js";

export class EncounterPartyMetaMcdmFleeMortals extends EncounterPartyMetaBase {
	/**
	 * @param {Array<EncounterPartyPlayerMeta>} playerMetas
	 */
	constructor (playerMetas) {
		super(playerMetas);

		this._thresholds = EncounterPartyMetaUtils.getThresholds({
			tiers: TIERS,
			tierToLevelSpend: TIER_TO_LEVEL_CR,
			levelMetas: this.levelMetas,
			tierAboveMax: TIER_EXTREME,
		});

		this._budgetTierProvider = new EncounterPartyMetaBudgetTierProviderSpendUpTo({
			tiersExtended: TIERS_EXTENDED,
			thresholds: this._thresholds,
			deltaBudgetMinInclusive: 1 / 16,
		});
	}

	_getEncounterSpendInfo ({creatureGroups}) {
		let baseSpend = 0;
		let count = 0;

		creatureGroups
			.forEach(creatureGroup => {
				count += creatureGroup.getCount();
				baseSpend += (creatureGroup.getCrNumber() || 0) * creatureGroup.getCount();
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

	getTierDisplayBudget (tier, {multiplier = null} = {}) {
		return Parser.numberToVulgar(this._getTierBudget({tier, multiplier}));
	}

	_getEncounterTier (encounterXpInfo) {
		return this._budgetTierProvider.getEncounterTier(encounterXpInfo);
	}

	getCrCutoff (creatureGroups) {
		// "Once you choose the desired difficulty of your encounter, you can determine its CR budget.
		//   To do so, you'll need to know the average character level of the party (rounding down)."
		const avgPlayerLevel = Math.floor(this.avgPlayerLevel);
		const ix = Math.max(
			0,
			Math.min(
				LEVEL_CR_CAP.length - 1,
				avgPlayerLevel - 1,
			),
		);
		return LEVEL_CR_CAP[ix];
	}

	// Unused in Flee, Mortals! rules
	getPlayerAdjustedSpendMultiplier (cntCreatures) { return 1; }
}
