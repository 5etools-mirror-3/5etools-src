import {EncounterBuilderSpendInfo, EncounterPartyPlayerMeta} from "../encounterbuilder-models.js";

export class EncounterPartyMetaUtils {
	static getThresholds (
		{
			tiers,
			tierToLevelSpend,
			levelMetas,
			tierAboveMax,
		},
	) {
		if (Object.values(tierToLevelSpend).some(arr => arr.length !== 21)) throw new Error(`Expected level 0-20 value for each tier!`);

		const thresholds = Object.fromEntries(tiers.map(tier => [tier, 0]));

		levelMetas
			.forEach(meta => {
				Object.entries(tierToLevelSpend)
					.forEach(([tier, xps]) => thresholds[tier] += xps[meta.level] * meta.count);
			});

		const [tierBelowMax, tierMax] = tiers.filter(tier => tier in tierToLevelSpend).slice(-2);
		thresholds[tierAboveMax] = thresholds[tierMax] + (thresholds[tierMax] - thresholds[tierBelowMax]);

		return thresholds;
	}
}

export class EncounterPartyMetaBudgetTierProviderSpendUpTo {
	constructor ({tiersExtended, thresholds, deltaBudgetMinInclusive}) {
		this._tiersExtended = tiersExtended;
		this._thresholds = thresholds;
		this._deltaBudgetMinInclusive = deltaBudgetMinInclusive;
	}

	getBudget (tier) {
		return this._thresholds[tier];
	}

	getBudgetRange (tier) {
		const ixTier = this._tiersExtended.indexOf(tier);
		if (!~ixTier) throw new Error(`Unhandled difficulty level: "${tier}"`);

		if (!ixTier) return {budgetMin: 0, budgetMax: this.getBudget(tier)};

		const budgetMinBase = this._thresholds[this._tiersExtended[ixTier - 1]];
		const budgetMaxBase = this.getBudget(tier);

		if (budgetMinBase === budgetMaxBase) {
			return {
				budgetMin: budgetMinBase,
				budgetMax: budgetMaxBase,
			};
		}

		return {
			budgetMin: budgetMinBase + this._deltaBudgetMinInclusive,
			budgetMax: budgetMaxBase,
		};
	}

	getBudgetRangeApprox (tier) {
		const budget = this.getBudget(tier);
		return {budgetMin: budget * 0.8, budgetMax: budget};
	}

	getEncounterTier (encounterXpInfo) {
		// Remove a tier if the tier above has the same threshold
		//   e.g. _Flee, Mortals!_ 1st-level "Easy"/"Standard"
		const thresholds = MiscUtil.copyFast(this._thresholds);
		this._tiersExtended
			.forEach((tier, ix, arr) => {
				const tierNxt = arr[ix + 1];
				if (!tierNxt) return;
				if (thresholds[tier] !== thresholds[tierNxt]) return;
				delete thresholds[tier];
			});

		for (const tier of this._tiersExtended) {
			if (encounterXpInfo.adjustedSpend <= thresholds[tier]) return tier;
		}
		return this._tiersExtended.at(-1);
	}
}

/**
 * @abstract
 */
export class EncounterPartyMetaBase {
	_thresholds;

	/**
	 * @param {Array<EncounterPartyPlayerMeta>} playerMetas
	 */
	constructor (playerMetas) {
		/** @type {Array<EncounterPartyPlayerMeta>} */
		this.levelMetas = [];

		// Combine such that each `level` has at most one entry, with the total count for players of that level
		playerMetas.forEach(it => {
			const existingLvl = this.levelMetas.find(x => x.level === it.level);
			if (existingLvl) existingLvl.count += it.count;
			else this.levelMetas.push(new EncounterPartyPlayerMeta({count: it.count, level: it.level}));
		});

		this.cntPlayers = 0;
		this.avgPlayerLevel = 0;
		this.maxPlayerLevel = 0;

		this.xpToNextLevel = 0;

		this.levelMetas
			.forEach(meta => {
				this.cntPlayers += meta.count;
				this.avgPlayerLevel += meta.level * meta.count;
				this.maxPlayerLevel = Math.max(this.maxPlayerLevel, meta.level);

				this.xpToNextLevel += meta.getXpToNextLevel();
			});

		if (this.cntPlayers) this.avgPlayerLevel /= this.cntPlayers;
	}

	/**
	 * @param {Array<EncounterBuilderCreatureMeta>} creatureMetas
	 * @return {EncounterBuilderSpendInfo}
	 */
	getEncounterSpendInfo (creatureMetas) {
		// Avoid including e.g. "summon" creatures.
		// Note that this effectively discounts non-XP-carrying creatures from "creature count XP multiplier"
		//   calculations. This is intentional; we make the simplifying assumption that if a creature doesn't carry XP,
		//   it should have no impact on the difficulty encounter.
		creatureMetas = creatureMetas
			.filter(creatureMeta => creatureMeta.getCrNumber() != null)
			.sort((a, b) => SortUtil.ascSort(b.getCrNumber(), a.getCrNumber()));

		return this._getEncounterSpendInfo({creatureMetas});
	}

	/**
	 * @abstract
	 * @return {EncounterBuilderSpendInfo}
	 */
	_getEncounterSpendInfo ({creatureMetas}) {
		throw new Error(`Unimplemented!`);
	}

	/**
	 * @abstract
	 * @return {number}
	 */
	getBudget (tier) {
		throw new Error(`Unimplemented!`);
	}

	/**
	 * @abstract
	 * @return {{budgetMin: number, budgetMax: number}}
	 */
	getBudgetRange (tier) {
		throw new Error(`Unimplemented!`);
	}

	/**
	 * @abstract
	 * @return {{budgetMin: number, budgetMax: number}}
	 */
	getBudgetRangeApprox (tier) {
		throw new Error(`Unimplemented!`);
	}

	/**
	 * @abstract
	 * @return {string}
	 */
	getEncounterTier (encounterXpInfo) {
		throw new Error(`Unimplemented!`);
	}

	/**
	 * @return {string}
	 */
	getTierDisplayBudget (tier, {multiplier = null} = {}) {
		return ((this._thresholds[tier] || 0) * (multiplier ?? 1))?.toLocaleStringVe();
	}

	/**
	 * @abstract
	 * @return {number}
	 */
	getCrCutoff (creatureMetas) {
		throw new Error(`Unimplemented!`);
	}

	/**
	 * @abstract
	 * @return {number}
	 */
	getPlayerAdjustedSpendMultiplier (cntCreatures) {
		throw new Error(`Unimplemented!`);
	}
}
