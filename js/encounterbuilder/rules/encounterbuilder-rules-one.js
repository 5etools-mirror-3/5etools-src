import {EncounterBuilderRulesBase, TierHtmlProviderBase} from "./encounterbuilder-rules-base.js";
import {EncounterPartyMetaOne} from "../partymeta/encounter-partymeta-one.js";
import {TIER_ABSURD, TIER_HIGH, TIER_LOW, TIER_MODERATE, TIERS, TIERS_EXTENDED} from "../consts/encounterbuilder-consts-one.js";
import {BUDGET_MODE_XP} from "../consts/encounterbuilder-consts.js";
import {EncounterbuilderUiThermometer} from "../encounterbuilder-ui-thermometer.js";

class _TierHtmlProviderOne extends TierHtmlProviderBase {
	_budgetMode = BUDGET_MODE_XP;
	_tierTitles = {
		low: "An encounter of low difficulty is likely to have one or two scary moments for the players, but their characters should emerge victorious with no casualties. One or more of them might need to use healing resources, however. As a rough guideline, a single monster generally presents a low-difficulty challenge for a party of four characters whose level equals the monster's CR.",
		moderate: "Absent healing and other resources, an encounter of moderate difficulty could go badly for the adventurers. Weaker characters might get taken out of the fight, and there's a slim chance that one or more characters might die.",
		high: "A high-difficulty encounter could be lethal for one or more characters. To survive it, the characters will need smart tactics, quick thinking, and maybe even a little luck.",
		absurd: "An encounter of &quot;absurd&quot; difficulty is an extrapolated addition for encounters which are intentionally over-budget. It is calculated as: &quot;high + (high - moderate)&quot;.",
	};
}

export class EncounterBuilderRulesOne extends EncounterBuilderRulesBase {
	rulesId = "one";
	displayName = "Modern (2024)";
	_tierHtmlProvider = new _TierHtmlProviderOne();

	_budgetMode = BUDGET_MODE_XP;

	render ({stgSettingsRules, stgRandomAndAdjust, stgGroupSummary, stgDifficulty}) {
		const {wrpSettingsRules} = this._render_settingsRules({stgSettingsRules});
		const {wrpRandomAndAdjust} = this._render_randomAndAdjust({stgRandomAndAdjust});
		const {wrpGroupSummary} = this._render_groupSummary({stgGroupSummary});
		const {wrpDifficulty} = this._render_difficulty({stgDifficulty});

		return {
			eles: [
				wrpSettingsRules,
				wrpRandomAndAdjust,
				wrpGroupSummary,
				wrpDifficulty,
			],
		};
	}

	_render_settingsRules ({stgSettingsRules}) {
		const wrpSettingsRules = ee`<div class="ve-flex-col">
			<div class="ve-flex mb-2">${Renderer.get().render(`{@note Based on the encounter building rules on page 114 of the {@book ${Parser.sourceJsonToFull(Parser.SRC_XDMG)}|XDMG|3|Combat Encounter Difficulty}}`)}</div>
		</div>`
			.appendTo(stgSettingsRules);

		return {
			wrpSettingsRules,
		};
	}

	_render_randomAndAdjust ({stgRandomAndAdjust}) {
		const wrpRandomAndAdjust = this._getRenderedWrpRandomAndAdjust({
			tiers: TIERS,
		});

		wrpRandomAndAdjust.appendTo(stgRandomAndAdjust);

		return {wrpRandomAndAdjust};
	}

	/* -------------------------------------------- */

	_render_groupSummary ({stgGroupSummary}) {
		const {
			disps: dispsTierXp,
			onHookPulseDeriverPartyMeta: onHookPulseDeriverPartyMetaTierXp,
		} = this._getRenderedDispsTierMeta({
			tiers: TIERS_EXTENDED,
		});

		const thermometer = new EncounterbuilderUiThermometer({
			tierHtmlProvider: this._tierHtmlProvider,
			tiers: TIERS_EXTENDED,
			tiersActionable: TIERS,
			thresholdColors: {
				[TIER_LOW]: MiscUtil.COLOR_HEALTHY,
				[TIER_MODERATE]: MiscUtil.COLOR_HURT,
				[TIER_HIGH]: MiscUtil.COLOR_BLOODIED,
				[TIER_ABSURD]: MiscUtil.COLOR_DEFEATED,
			},
			pFnDoGenerateRandomEncounter: this._pDoGenerateRandomEncounter.bind(this),
			pFnDoAdjustEncounter: this._pDoAdjustEncounter.bind(this),
		});

		const dispTtk = ee`<div></div>`;

		const dispExpToLevel = ee`<div class="ve-muted"></div>`;

		const dispThermometer = thermometer.render()
			.addClass("mt-2");

		this._comp.addHookPulseDeriverPartyMeta(() => {
			const partyMeta = this.getEncounterPartyMeta();
			const encounterSpendInfo = partyMeta.getEncounterSpendInfo(this._comp.creatureMetas);
			const tier = partyMeta.getEncounterTier(encounterSpendInfo);

			onHookPulseDeriverPartyMetaTierXp({partyMeta});

			thermometer.setInfo({
				spendValue: encounterSpendInfo.adjustedSpend,
				spendCap: partyMeta.getBudget(TIER_ABSURD),
				thresholds: Object.fromEntries(
					TIERS_EXTENDED
						.map(tier => [tier, partyMeta.getBudget(tier)]),
				),
				tier: tier,
			});

			dispTtk
				.html(this._getTtkHtml({partyMeta}));

			dispExpToLevel.html(this._getRenderedExpToLevel({partyMeta}));
		})();

		const wrpGroupSummary = ee`<div class="ve-text-right">
			${dispsTierXp}
			${dispThermometer}
			<hr class="hr-2">
			${dispTtk}
			<br>
			${dispExpToLevel}
		</div>`
			.hideVe()
			.appendTo(stgGroupSummary);

		return {
			wrpGroupSummary,
		};
	}

	/* -------------------------------------------- */

	_render_difficulty ({stgDifficulty}) {
		const hrHasCreatures = ee`<hr class="hr-1">`;
		const wrpDifficultyCols = ee`<div class="ve-flex">
			${this._renderGroupAndDifficulty_getDifficultyLhs()}
			${this._renderGroupAndDifficulty_getDifficultyRhs()}
		</div>`;

		this._comp.addHookPulseDeriverPartyMeta(() => {
			const encounterSpendInfo = this.getEncounterPartyMeta().getEncounterSpendInfo(this._comp.creatureMetas);
			hrHasCreatures.toggleVe(encounterSpendInfo.relevantCount);
			wrpDifficultyCols.toggleVe(encounterSpendInfo.relevantCount);
		})();

		const wrpDifficulty = ee`<div class="ve-flex-col w-100">
			${hrHasCreatures}
			${wrpDifficultyCols}
		</div>`
			.hideVe()
			.appendTo(stgDifficulty);

		return {
			wrpDifficulty,
		};
	}

	_renderGroupAndDifficulty_getDifficultyLhs () {
		const dispDifficulty = ee`<h4 class="my-2"></h4>`;

		this._comp.addHookPulseDeriverPartyMeta(() => {
			const partyMeta = this.getEncounterPartyMeta();

			const encounterSpendInfo = partyMeta.getEncounterSpendInfo(this._comp.creatureMetas);

			const tier = partyMeta.getEncounterTier(encounterSpendInfo);

			dispDifficulty
				.html(`Difficulty: <span class="help-subtle">${tier.toTitleCase()}</span>`)
				.tooltip(new _TierHtmlProviderOne().getTierTitle({tier}));
		})();

		return ee`<div class="w-50">
			${dispDifficulty}
		</div>`;
	}

	_renderGroupAndDifficulty_getDifficultyRhs () {
		const dispXpRawTotal = ee`<h4></h4>`;
		const dispXpRawPerPlayer = ee`<i></i>`;

		this._comp.addHookPulseDeriverPartyMeta(() => {
			const partyMeta = this.getEncounterPartyMeta();

			const encounterSpendInfo = partyMeta.getEncounterSpendInfo(this._comp.creatureMetas);

			dispXpRawTotal.txt(`Total XP: ${encounterSpendInfo.baseSpend?.toLocaleStringVe() || "?"}`);
			dispXpRawPerPlayer.txt(
				partyMeta?.cntPlayers
					? `(${Math.floor(encounterSpendInfo.baseSpend / partyMeta?.cntPlayers)?.toLocaleStringVe()} per player)`
					: "",
			);
		})();

		return ee`<div class="w-50 ve-text-right">
			${dispXpRawTotal}
			<div>${dispXpRawPerPlayer}</div>
		</div>`;
	}

	_getEncounterPartyMeta (playerMetas) {
		return new EncounterPartyMetaOne(playerMetas);
	}

	/* -------------------------------------------- */

	getDisplaySummary () {
		const encounterXpInfo = this
			.getEncounterPartyMeta()
			.getEncounterSpendInfo(this._comp.creatureMetas);

		return `${encounterXpInfo.baseSpend.toLocaleStringVe()} XP`;
	}

	/* -------------------------------------------- */

	_getDefaultState () {
		return {
			...super._getDefaultState(),
			tierRandom: TIER_MODERATE,
			tierAdjust: TIER_MODERATE,
		};
	}
}
