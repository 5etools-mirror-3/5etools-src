import {EncounterBuilderRulesBase, TierHtmlProviderBase} from "./encounterbuilder-rules-base.js";
import {BUDGET_MODE_CR} from "../consts/encounterbuilder-consts.js";
import {EncounterPartyMetaMcdmFleeMortals} from "../partymeta/encounter-partymeta-mcdmfleemortals.js";
import {TIER_EXTREME, TIER_STANDARD, TIER_TO_ENCOUNTER_POINTS, TIERS, TIERS_EXTENDED} from "../consts/encounterbuilder-consts-mcdmfleemortals.js";
import {EncounterbuilderUiThermometer} from "../encounterbuilder-ui-thermometer.js";
import {TIER_EASY, TIER_HARD} from "../consts/encounterbuilder-consts-classic.js";

class _TierHtmlProviderMcdmFleeMortals extends TierHtmlProviderBase {
	_budgetMode = BUDGET_MODE_CR;
	_tierTitles = {
		trivial: "Trivial encounters require barely any effort on the part of the characters\u2014like a group of 20th-level heroes taking on a handful of crawling claws or goblins. The characters are guaranteed to survive the fight and won't spend many resources. These encounters can be fun to occasionally throw into your game, but for many groups, the novelty disappears quickly. Too many trivial encounters can feel like a waste of time.",
		easy: "Unless the characters have already depleted many of their resources and hit points, easy encounters won't threaten their lives. Easy encounters are great for adventures that don't give the characters much time to rest or for times when you want the heroes to feel like superheroes.",
		standard: "Standard encounters are the most common for many adventuring groups. These battles deplete significant resources and hit points. While character death is uncommon in standard encounters, it isn't impossible, especially if a player makes a poor tactical choice or just finds the dice are against them.",
		hard: "Hard encounters are typically climactic encounters with bosses and their minions\u2014or anything else that puts the characters' lives in peril. Hard encounters are winnable, but the characters need all their resources, wits, and luck to survive.",
		extreme: "Extreme encounters are ones where the characters will likely not survive if they try to fight to the bitter end. Such encounters rarely or never appear in most campaigns\u2014though if the characters are level 17 or higher, they can typically survive (or come back to life after) such encounters.",
	};
}

// TODO(Future) add handling for "solo" creatures, as per the rules on p18
//   These are functionally a different type of encounter, with different difficulty
//     rules; this will require making a `mcdmFleeMortalsSolo` implementation.
//   Once we have the additional implementation, need to filter usable creatures to
//     "not solo" here, and "solo" in `mcdmFleeMortalsSolo`, which should produce the
//     majority of edge-cases.
export class EncounterBuilderRulesMcdmFleeMortals extends EncounterBuilderRulesBase {
	rulesId = "mcdmFleeMortals";
	displayName = "MCDM 'Flee, Mortals!'";
	_tierHtmlProvider = new _TierHtmlProviderMcdmFleeMortals();

	_budgetMode = BUDGET_MODE_CR;

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
			<div class="ve-flex mb-2">${Renderer.get().render(`{@note Based on the encounter building rules on page 16 of {@link MCDM|https://www.mcdmproductions.com}'s {@book Flee, Mortals!|FleeMortals|0|Encounter Building}}`)}</div>
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
				[TIER_EASY]: MiscUtil.COLOR_HEALTHY,
				[TIER_STANDARD]: MiscUtil.COLOR_HURT,
				[TIER_HARD]: MiscUtil.COLOR_BLOODIED,
				[TIER_EXTREME]: MiscUtil.COLOR_DEFEATED,
			},
			pFnDoGenerateRandomEncounter: this._pDoGenerateRandomEncounter.bind(this),
			pFnDoAdjustEncounter: this._pDoAdjustEncounter.bind(this),
		});

		const dispTtk = ee`<div></div>`;

		const dispPointsEncounter = ee`<div></div>`;

		const dispExpEncounter = ee`<div></div>`;
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
				spendCap: partyMeta.getBudget(TIER_EXTREME),
				thresholds: Object.fromEntries(
					TIERS_EXTENDED
						.map(tier => [tier, partyMeta.getBudget(tier)]),
				),
				tier: tier,
			});

			dispTtk
				.html(this._getTtkHtml({partyMeta}));

			dispPointsEncounter.html(`Encounter Points: ${TIER_TO_ENCOUNTER_POINTS[tier] || "?"}`);

			dispExpEncounter.html(`Encounter XP: ${this._getEncounterXp().toLocaleStringVe()} XP`);
			dispExpToLevel.html(this._getRenderedExpToLevel({partyMeta}));
		})();

		const wrpGroupSummary = ee`<div class="ve-text-right ve-flex-col">
			${dispsTierXp}
			${dispThermometer}
			<hr class="hr-2">
			${dispTtk}
			<hr class="hr-2">
			${dispPointsEncounter}
			<div class="ve-muted"><span class="help-subtle" title="Daily encounter points budget. To give the characters a good but survivable challenge, fill each adventuring day with encounters that total 6 to 8 points over the course of the day.">Daily Budget:</span> 6-8</div>
			<div class="my-2">
			${dispExpEncounter}
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
				.tooltip(new _TierHtmlProviderMcdmFleeMortals().getTierTitle({tier}));
		})();

		return ee`<div class="w-50">
			${dispDifficulty}
		</div>`;
	}

	_renderGroupAndDifficulty_getDifficultyRhs () {
		const dispCrTotal = ee`<h4></h4>`;
		const dispCrPerPlayer = ee`<i></i>`;

		this._comp.addHookPulseDeriverPartyMeta(() => {
			const partyMeta = this.getEncounterPartyMeta();

			const encounterSpendInfo = partyMeta.getEncounterSpendInfo(this._comp.creatureMetas);

			dispCrTotal.txt(`Total CR: ${encounterSpendInfo.baseSpend == null ? "?" : Parser.numberToVulgar(encounterSpendInfo.baseSpend)}`);
			dispCrPerPlayer.txt(
				partyMeta?.cntPlayers
					? `(${Parser.numberToVulgar(encounterSpendInfo.baseSpend / partyMeta?.cntPlayers)} per player)`
					: "",
			);
		})();

		return ee`<div class="w-50 ve-text-right">
			${dispCrTotal}
			<div>${dispCrPerPlayer}</div>
		</div>`;
	}

	_getEncounterXp () {
		return this._comp.creatureMetas
			.reduce((accum, creatureMeta) => accum + (Parser.crToXpNumber(Parser.numberToCr(creatureMeta.getCrNumber())) || 0) * creatureMeta.getCount(), 0);
	}

	_getEncounterPartyMeta (playerMetas) {
		return new EncounterPartyMetaMcdmFleeMortals(playerMetas);
	}

	/* -------------------------------------------- */

	getDisplaySummary () {
		const encounterXpInfo = this
			.getEncounterPartyMeta()
			.getEncounterSpendInfo(this._comp.creatureMetas);

		return `<span title="Total Encounter CR">${Parser.numberToVulgar(encounterXpInfo.baseSpend)} CR</span> (${this._getEncounterXp().toLocaleStringVe()} XP)`;
	}

	/* -------------------------------------------- */

	_getDefaultState () {
		return {
			...super._getDefaultState(),
			tierRandom: TIER_STANDARD,
			tierAdjust: TIER_STANDARD,
		};
	}
}
