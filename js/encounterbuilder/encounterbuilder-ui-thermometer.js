export class EncounterbuilderUiThermometer extends BaseComponent {
	constructor (
		{
			tierHtmlProvider,
			tiers,
			tiersActionable,
			thresholdColors,
			pFnDoGenerateRandomEncounter,
			pFnDoAdjustEncounter,
		},
	) {
		super();
		this._tierHtmlProvider = tierHtmlProvider;
		this._tiers = tiers;
		this._tiersActionable = tiersActionable;
		this._thresholdColors = thresholdColors;
		this._pFnDoGenerateRandomEncounter = pFnDoGenerateRandomEncounter;
		this._pFnDoAdjustEncounter = pFnDoAdjustEncounter;
	}

	_getWidthPct (val) {
		if (!this._state.spendCap) return 0;
		return Math.min(Math.max(0, val / this._state.spendCap), 1) * 100;
	}

	render () {
		const elesNotchLookup = Object.fromEntries(
			this._tiers
				.slice(0, -1)
				.map(tier => [tier, ee`<div class="ecgen-therm__notch absolute"></div>`]),
		);
		const elesHotzoneLookup = Object.fromEntries(
			this._tiers
				.map((tier, ix, arr) => {
					const isActionableTier = this._tiersActionable.includes(tier);

					const tierName = this._tierHtmlProvider.getTierName({tier});
					const ptTitle = [
						tierName ? `${tierName} Difficulty Encounter.` : tierName,
						isActionableTier ? `Click to adjust encounter to this difficulty. CTRL+click to generate an encounter of this difficulty.` : "",
						this._tierHtmlProvider.getTierTitle({tier}),
					]
						.filter(Boolean)
						.join(" ");
					const eleHotzone = ee`<div class="ecgen-therm__hotzone ${isActionableTier ? `clickable` : `help-subtle`} absolute" title="${ptTitle}"></div>`;

					if (isActionableTier) {
						eleHotzone
							.onn("click", async evt => {
								if (EventUtil.isCtrlMetaKey(evt)) {
									await this._pFnDoGenerateRandomEncounter({tier});
									return;
								}
								await this._pFnDoAdjustEncounter({tier});
							});
					}

					if (!ix) eleHotzone.addClass("ecgen-therm__hotzone--first");
					else if (ix === arr.length - 1) eleHotzone.addClass("ecgen-therm__hotzone--last");

					return [tier, eleHotzone];
				}),
		);

		const hkNotches = () => {
			Object.entries(this._state.thresholds)
				.forEach(([tier, threshold]) => {
					const ixTier = this._tiers.indexOf(tier);
					const thresholdPrev = ixTier ? this._state.thresholds[this._tiers[ixTier - 1]] : 0;

					if (elesNotchLookup[tier]) elesNotchLookup[tier].css({left: `${this._getWidthPct(threshold)}%`});

					elesHotzoneLookup[tier].css({
						left: `${this._getWidthPct(thresholdPrev)}%`,
						width: `${this._getWidthPct(threshold - thresholdPrev)}%`,
					});
				});
		};
		this._addHookBase("thresholds", hkNotches)();
		this._addHookBase("spendCap", hkNotches)();
		hkNotches();

		const dispBar = ee`<div class="h-100 ecgen-therm__bar"></div>`;

		const hkSpendInfo = () => {
			dispBar
				.css({width: `${this._getWidthPct(this._state.spendValue)}%`})
				.toggleClass(`ecgen-therm__bar--max`, this._state.spendValue >= this._state.spendCap)
				.toggleClass(`b-0`, !this._state.spendValue);
		};
		this._addHookBase("spendValue", hkSpendInfo);
		this._addHookBase("spendCap", hkSpendInfo);
		hkSpendInfo();

		this._addHookBase("tier", () => {
			dispBar.css({
				backgroundColor: this._thresholdColors[this._state.tier],
			});

			const ixTier = this._tiers.indexOf(this._state.tier);
			this._tiers
				.forEach((tier, ixTier_) => {
					// Color hotzones up to and including the active
					//   zone in the color of the active zone
					if (ixTier_ <= ixTier) {
						elesHotzoneLookup[tier].css({
							outlineColor: this._thresholdColors[this._state.tier],
						});
						return;
					}

					elesHotzoneLookup[tier].css({
						outlineColor: this._thresholdColors[tier],
					});
				});
		})();

		return ee`<div class="ve-flex w-100 h-20p b-1p relative ecgen-therm__wrp">
			${dispBar}
			${Object.values(elesNotchLookup)}
			${Object.values(elesHotzoneLookup)}
		</div>`;
	}

	setInfo (
		{
			spendValue,
			spendCap,
			thresholds,
			tier,
		},
	) {
		this._proxyAssignSimple("state", {spendValue, spendCap, thresholds, tier});
	}

	_getDefaultState () {
		return {
			spendValue: 0,
			spendCap: 0,
			thresholds: {},
			tier: null,
		};
	}
}
