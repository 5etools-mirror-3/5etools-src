export class LootgenStateManager extends BaseComponent {
	static getInstance () {
		return new Proxy(new this(), {
			get (target, prop) {
				if (prop in target) return target[prop];
				return target._state[prop];
			},
		});
	}

	addHookBase (prop, hk) { return this._addHookBase(prop, hk); }

	getPropsCoins (coin) {
		return {
			propIsAllowed: `isAllowCurrency${coin.uppercaseFirst()}`,
		};
	}

	getConvertedCoins (coins) {
		if (!coins) return coins;

		if (Parser.COIN_ABVS.every(it => this._state[this.getPropsCoins(it).propIsAllowed])) return coins;

		if (Parser.COIN_ABVS.every(it => !this._state[this.getPropsCoins(it).propIsAllowed])) {
			JqueryUtil.doToast({content: "All currencies are disabled! Generated currency has been discarded.", type: "warning"});
			return {};
		}

		coins = MiscUtil.copy(coins);
		let coinsRemoved = {};

		Parser.COIN_ABVS
			.forEach(it => {
				const {propIsAllowed} = this.getPropsCoins(it);
				if (this._state[propIsAllowed]) return;
				if (!coins[it]) return;

				coinsRemoved[it] = coins[it];
				delete coins[it];
			});

		if (!Object.keys(coinsRemoved).length) return coins;

		coinsRemoved = {cp: CurrencyUtil.getAsCopper(coinsRemoved)};

		const conversionTableFiltered = MiscUtil.copy(Parser.FULL_CURRENCY_CONVERSION_TABLE)
			.filter(({coin}) => this._state[this.getPropsCoins(coin).propIsAllowed]);
		if (!conversionTableFiltered.some(it => it.isFallback)) conversionTableFiltered[0].isFallback = true;

		// If we have filtered out copper, upgrade our copper amount to the nearest currency
		if (!conversionTableFiltered.some(it => it.coin === "cp")) {
			const conv = conversionTableFiltered[0];
			coinsRemoved = {[conv.coin]: coinsRemoved.cp * conv.mult};
		}

		const coinsRemovedSimplified = CurrencyUtil.doSimplifyCoins(coinsRemoved, {currencyConversionTable: conversionTableFiltered});

		Object.entries(coinsRemovedSimplified).forEach(([coin, count]) => {
			if (!count) return;
			coins[coin] = (coins[coin] || 0) + count;
		});

		return coins;
	}

	_getDefaultState () {
		return {
			pulseSpellsFiltered: false,
			pulseItemsFiltered: false,
			pulseGemsArtObjectsFiltered: false,

			isAllowCurrencyCp: true,
			isAllowCurrencySp: true,
			isAllowCurrencyEp: true,
			isAllowCurrencyGp: true,
			isAllowCurrencyPp: true,
		};
	}
}
