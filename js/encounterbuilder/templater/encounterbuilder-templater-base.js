class _CategorizedCreatureSlotBundles {
	constructor ({creatureSlotBundlesIdeal, creatureSlotBundlesFallback}) {
		this.creatureSlotBundlesIdeal = creatureSlotBundlesIdeal;
		this.creatureSlotBundlesFallback = creatureSlotBundlesFallback;
	}
}

/**
 * @abstract
 */
export class EncounterBuilderTemplaterBase {
	/**
	 * @param {EncounterPartyMetaBase} partyMeta
	 * @param {Array<number>} spendKeys
	 * @param {number} budgetMin
	 * @param {number} budgetMax
	 * @param {"xp" | "cr"} budgetMode
	 *
	 * @param {Array<EncounterBuilderCreatureMeta>} creatureMetasLocked
	 */
	constructor (
		{
			partyMeta,
			spendKeys,
			budgetMin,
			budgetMax,
			budgetMode,

			creatureMetasLocked,
		},
	) {
		this._partyMeta = partyMeta;
		this._spendKeys = spendKeys;
		this._budgetMin = budgetMin;
		this._budgetMax = budgetMax;
		this._budgetMode = budgetMode;

		this._creatureMetasLocked = creatureMetasLocked;
	}

	/**
	 * @abstract
	 * @return {EncounterTemplateOptions}
	 */
	getEncounterTemplateInfo () { throw new Error("Unimplemented!"); }

	_getMaxCreatureCount ({cntMin, cntLockedCreatures}) {
		const cntMax = Math.ceil(this._partyMeta.cntPlayers * 2.2);

		// If we would use all our expected count on locked creatures, attempt to add 1-3 extra creatures
		if (cntMax <= cntMin) return cntLockedCreatures + 3;
		return cntMax;
	}

	_getMaxDesiredCreatureTypes () {
		// 2-5 different creature types is the core desirable range
		let cnt = RollerUtil.randomise(4) + 1;
		if (cnt < 5) return cnt;
		// On a 5, repeated 1/4 chance of adding +1 creature type
		while (RollerUtil.randomise(4) === 4) ++cnt;
		return cnt;
	}

	/**
	 * @return {_CategorizedCreatureSlotBundles}
	 */
	_getCategorizedCreatureSlotBundles ({creatureSlotBundles}) {
		const creatureSlotBundleMetas = creatureSlotBundles
			.map(creatureSlotBundle => {
				const cntCreatures = creatureSlotBundle
					.map(slot => slot.count)
					.sum();
				const playerAdjustedSpendMult = this._partyMeta.getPlayerAdjustedSpendMultiplier(cntCreatures);

				return {
					creatureSlotBundle,
					spendTotal: creatureSlotBundle
						.map(creatureSlot => creatureSlot.getTotalSpend({playerAdjustedSpendMult}))
						.sum(),
				};
			});

		// If there are templates which fit in the expected min-max range, prefer these
		// Otherwise, prefer templates with the smallest distance from the min-max range
		const minDelta = Math.min(
			...creatureSlotBundleMetas
				.map(({spendTotal}) => Math.abs(this._budgetMin - spendTotal)),
		);
		const closestSpendTotal = this._budgetMin - minDelta;

		return {
			creatureSlotBundlesIdeal: creatureSlotBundleMetas
				.filter(({spendTotal}) => spendTotal >= this._budgetMin)
				.map(({creatureSlotBundle}) => creatureSlotBundle),
			creatureSlotBundlesFallback: creatureSlotBundleMetas
				.filter(({spendTotal}) => spendTotal === closestSpendTotal)
				.map(({creatureSlotBundle}) => creatureSlotBundle),
		};
	}

	_getTemplateOptions ({categorizedCreatureSlotBundlesBase, categorizedCreatureSlotBundlesAdditional}) {
		const isPreferAdditional = Math.random() < 0.15;

		const getByProp = (prop) => {
			const isBase = !!categorizedCreatureSlotBundlesBase?.[prop]?.length;
			const isAdditional = !!categorizedCreatureSlotBundlesAdditional?.[prop]?.length;

			if (isAdditional && isBase) {
				if (isPreferAdditional) return categorizedCreatureSlotBundlesAdditional[prop];
				else return categorizedCreatureSlotBundlesBase[prop];
			}
			if (isBase) return categorizedCreatureSlotBundlesBase[prop];
			if (isAdditional) return categorizedCreatureSlotBundlesAdditional[prop];
			return null;
		};

		const inRange = getByProp("creatureSlotBundlesIdeal");
		if (inRange?.length) return inRange;

		return getByProp("creatureSlotBundlesFallback");
	}
}
