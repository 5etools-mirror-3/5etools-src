import {EncounterPartyPlayerMeta} from "../encounterbuilder-models.js";
import {EncounterBuilderRandomizerTemplated} from "../randomizer/encounterbuilder-randomizer-templated.js";
import {BUDGET_MODE_CR, BUDGET_MODE_XP} from "../consts/encounterbuilder-consts.js";
import {EncounterbuilderAdjusterTemplated} from "../adjuster/encounterbuilder-adjuster-slots.js";
import {SITE_STYLE__CLASSIC, SITE_STYLE__ONE} from "../../consts.js";
import {EncounterBuilderTtkClassic} from "../ttk/encounterbuilder-ttk-classic.js";
import {EncounterbuilderTtkOne} from "../ttk/encounterbuilder-ttk-one.js";
import {ENCOUNTER_SHAPE_CUSTOM_NAME, ENCOUNTER_SHAPE_CUSTOM_SOURCE, ENCOUNTER_SHAPE_RANDOM_NAME, ENCOUNTER_SHAPE_RANDOM_SOURCE} from "../encounterbuilder-consts.js";

export class TierHtmlProviderBase {
	_budgetMode;
	_tierTitles;

	getTierName ({tier}) {
		return tier?.toTitleCase();
	}

	getTierHtml ({partyMeta, tier}) {
		const title = this.getTierTitle({tier});
		const ptTierName = this.getTierName({tier}) || "?";
		const ptTierBudget = partyMeta?.getTierDisplayBudget(tier) || "?";

		return `<span class="help-subtle" ${title ? `title="${title}"` : ""}>${ptTierName}:</span> ${ptTierBudget} ${this._getBudgetUnit()}`;
	}

	getTierTitle ({tier}) {
		return this._tierTitles[tier] || "";
	}

	_getBudgetUnit () {
		switch (this._budgetMode) {
			case BUDGET_MODE_XP: return "XP";
			case BUDGET_MODE_CR: return "CR";
			default: throw new Error(`Unhandled budget mode "${this._budgetMode}"!`);
		}
	}

	/* -------------------------------------------- */

	_getPtRatioSpentPct ({ratioSpent}) {
		const ptPct = (ratioSpent * 100).toFixed(2).replace(/\.0+$/, "")
			.padStart(3, "\u2007");

		return `<span class="mr-1">${ptPct}%</span>`;
	}

	getSpentHtml (
		{
			partyMeta,
			tier,
			ratioSpent = null,
		},
	) {
		if (!partyMeta || !tier || ratioSpent == null) return "";

		const ptTierBudgetSpent = partyMeta.getTierDisplayBudget(tier, {multiplier: ratioSpent});
		const ptTierBudgetTotal = partyMeta.getTierDisplayBudget(tier);

		return `${this._getPtRatioSpentPct({ratioSpent})} <span class="ve-small ve-muted">(${ptTierBudgetSpent}/${ptTierBudgetTotal} ${this._getBudgetUnit()})</span>`;
	}

	getGroupSpentHtml (
		{
			partyMeta,
			tier,
			ratioSpent,
			cntMin,
			cntMax,
		},
	) {
		if (!partyMeta || !tier || ratioSpent == null) return "";

		const unit = this._getBudgetUnit();

		if (cntMin === cntMax || !ratioSpent) {
			const ptTierBudgetSpent = partyMeta.getTierDisplayBudget(tier, {multiplier: ratioSpent});
			const ptTierBudgetSpentPerCreature = cntMin
				? partyMeta.getTierDisplayBudget(tier, {multiplier: ratioSpent / cntMin})
				: 0;
			return `<span class="ve-small small-caps split-v-center" title="${ptTierBudgetSpentPerCreature} ${unit} Per Creature (${ptTierBudgetSpent} ${unit} Total)">
				${this._getPtRatioSpentPct({ratioSpent})}
				<span class="ve-muted">(${ptTierBudgetSpentPerCreature} ${unit} ea.)</span>
			</span>`;
		}

		const ptTierBudgetSpentPerCreatureMin = cntMin
			? partyMeta.getTierDisplayBudget(tier, {multiplier: ratioSpent / cntMin})
			: 0;
		const ptTierBudgetSpentMin = cntMin
			? partyMeta.getTierDisplayBudget(tier, {multiplier: ratioSpent})
			: 0;
		const ptTierBudgetSpentPerCreatureMax = cntMax
			? partyMeta.getTierDisplayBudget(tier, {multiplier: ratioSpent / cntMax})
			: 0;
		const ptTierBudgetSpentMax = cntMax
			? partyMeta.getTierDisplayBudget(tier, {multiplier: ratioSpent})
			: 0;
		return `<span class="ve-small small-caps split-v-center" title="${ptTierBudgetSpentPerCreatureMin}\u2013${ptTierBudgetSpentPerCreatureMax} ${unit} Per Creature (${ptTierBudgetSpentMin}\u2013${ptTierBudgetSpentMax} ${unit} Total)">
			${this._getPtRatioSpentPct({ratioSpent})}
			<span class="ve-muted">(${ptTierBudgetSpentPerCreatureMin}\u2013${ptTierBudgetSpentPerCreatureMax} ${unit} ea.)</span>
		</span>`;
	}
}

/**
 * @abstract
 */
export class EncounterBuilderRulesBase extends BaseComponent {
	rulesId;
	displayName;
	_tierHtmlProvider;

	_budgetMode;

	constructor ({comp, cache, encounterShapesLookup}) {
		super();
		this._comp = comp;
		this._cache = cache;
		this._encounterShapesLookup = encounterShapesLookup;
	}

	/* -------------------------------------------- */

	getBudgetMode () { return this._budgetMode; }

	isCustomEncounterShape () { return this._state.shapeHashRandom === UrlUtil.URL_TO_HASH_BUILDER["encounterShape"]({name: ENCOUNTER_SHAPE_CUSTOM_NAME, source: ENCOUNTER_SHAPE_CUSTOM_SOURCE}); }

	/* -------------------------------------------- */

	addHookOnSave (hk) { return this._addHookAll("state", hk); }

	addHookTierRandom (hk) { return this._addHookBase("tierRandom", hk); }
	addHookShapeHashRandom (hk) { return this._addHookBase("shapeHashRandom", hk); }

	/* -------------------------------------------- */

	setStateFrom (toLoad, isOverwrite = false) {
		if (!toLoad) return super.setStateFrom(toLoad, isOverwrite);

		if (!this._encounterShapesLookup.getEncounterShape(toLoad.state.shapeHashRandom)) {
			toLoad.state.shapeHashRandom = UrlUtil.URL_TO_HASH_BUILDER["encounterShape"]({name: ENCOUNTER_SHAPE_RANDOM_NAME, source: ENCOUNTER_SHAPE_RANDOM_SOURCE});
		}

		super.setStateFrom(toLoad, isOverwrite);
	}

	/* -------------------------------------------- */

	/**
	 * @abstract
	 * @return void
	 */
	render ({stgSettingsRules, stgRandomAndAdjust, stgGroup, stgDifficulty}) { throw new Error("Unimplemented!"); }

	/* -------------------------------------------- */

	/**
	 * @abstract
	 * @return string
	 */
	getDisplaySummary () { throw new Error("Unimplemented!"); }

	/* -------------------------------------------- */

	/**
	 * @abstract
	 * @param {?number} ratioSpent
	 * @param {?EncounterPartyMetaBase} partyMeta
	 * @return string
	 */
	getDisplayBudgetSpent (
		{
			ratioSpent,
			partyMeta = null,
		},
	) {
		partyMeta ??= this.getEncounterPartyMeta();

		return this._tierHtmlProvider.getSpentHtml({
			partyMeta,
			tier: this._state.tierRandom,
			ratioSpent,
		});
	}

	/**
	 * @abstract
	 * @param {number} ratioSpent
	 * @param {EncounterPartyMetaBase} partyMeta
	 * @param {number} cntMin
	 * @param {number} cntMax
	 * @return string
	 */
	getDisplayGroupBudgetSpent (
		{
			ratioSpent,
			partyMeta = null,
			cntMin = null,
			cntMax = null,
		},
	) {
		partyMeta ??= this.getEncounterPartyMeta();

		return this._tierHtmlProvider.getGroupSpentHtml({
			partyMeta,
			tier: this._state.tierRandom,
			ratioSpent,
			cntMin,
			cntMax,
		});
	}

	/* -------------------------------------------- */

	async _pDoGenerateRandomEncounter ({shapeHash, tier}) {
		const partyMeta = this.getEncounterPartyMeta();

		const {budgetMin, budgetMax} = partyMeta.getBudgetRange(tier);

		const randomizer = new EncounterBuilderRandomizerTemplated({
			partyMeta,
			cache: this._cache,
			budgetMin,
			budgetMax,
			budgetMode: this._budgetMode,
			encounterShapesLookup: this._encounterShapesLookup,
			encounterShapeHash: shapeHash,
		});

		const randomCreatureMetas = await randomizer.pGetRandomEncounter({
			creatureMetasLocked: this._comp.creatureMetas.filter(creatureMeta => creatureMeta.getIsLocked()),
		});

		if (randomCreatureMetas != null) this._comp.creatureMetas = randomCreatureMetas;
	}

	async _pDoAdjustEncounter ({tier}) {
		const partyMeta = this.getEncounterPartyMeta();

		const {budgetMin, budgetMax} = partyMeta.getBudgetRangeApprox(tier);

		const adjuster = new EncounterbuilderAdjusterTemplated({
			partyMeta,
			cache: this._cache,
			budgetMin,
			budgetMax,
			budgetMode: this._budgetMode,
		});

		const adjustedCreatureMetas = await adjuster.pGetAdjustedEncounter({
			creatureMetas: this._comp.creatureMetas,
		});

		if (adjustedCreatureMetas != null) this._comp.creatureMetas = adjustedCreatureMetas;
	}

	/* -------------------------------------------- */

	_getRenderedWrpRandomAndAdjust (
		{
			tiers,
		},
	) {
		const stgRandom = this._getRenderedWrpRandomAndAdjust_getStgRandom({tiers});
		const stgAdjust = this._getRenderedWrpRandomAndAdjust_getAdjustMeta({tiers});

		return ee`<div class="ve-flex-col">
			<div class="ve-flex-v-center">
				${stgRandom}

				<div class="vr-2 min-h-24p"></div>

				${stgAdjust}
			</div>
		</div>`
			.hideVe();
	}

	_getRenderedWrpRandomAndAdjust_getStgRandom ({tiers}) {
		const selTier = ComponentUiUtil.getSelEnum(
			this,
			"tierRandom",
			{
				html: `<select class="form-control br-0"></select>`,
				values: tiers,
				fnDisplay: val => val.toTitleCase(),
			},
		);

		const selShapeType = ComponentUiUtil.getSelEnum(
			this,
			"shapeHashRandom",
			{
				html: `<select class="form-control br-0"></select>`,
				values: this._encounterShapesLookup.getHashList(),
				fnDisplay: val => this._encounterShapesLookup.getEncounterShape(val).name,
			},
		);

		const btnGenerate = ee`<button class="ve-btn ve-btn-primary" title="Generate Encounter"><span class="glyphicon glyphicon-play"></span></button>`
			.onn("click", async () => {
				if (
					this._encounterShapesLookup.isCustomEncounterHash(this._state.shapeHashRandom)
				) {
					if (!this._comp.customShapeGroups?.length) return JqueryUtil.doToast({type: "warning", content: `Your custom encounter does not contain any creature groups! Please add a creature group first.`});
					if (this._comp.customShapeGroups.map(({entity}) => entity.ratioPercentage).sum() !== 100) return JqueryUtil.doToast({type: "warning", content: `Your custom encounter has un-allocated budget! Please allocate the full budget first.`});
				}

				await this._pDoGenerateRandomEncounter({
					shapeHash: this._state.shapeHashRandom,
					tier: this._state.tierRandom,
				});
			});

		return ee`<div class="ve-flex-v-center input-group">
			${selTier}
			${selShapeType}
			${btnGenerate}
		</div>`;
	}

	_getRenderedWrpRandomAndAdjust_getAdjustMeta ({tiers}) {
		const getButtonText = tier => `Adjust to ${tier.toTitleCase()}`;
		const getButtonTitle = tier => `Adjust the current encounter to ${tier.toTitleCase()} Difficulty`;

		const pSetTier = async ({tier = null} = {}) => {
			if (tier) this._state.tierAdjust = tier;

			await this._pDoAdjustEncounter({tier: this._state.tierAdjust});
		};

		const getLi = (tier) => {
			return ee`<li title="${getButtonTitle(tier)}"><a href="#">${getButtonText(tier)}</a></li>`
				.onn("click", async (evt) => {
					evt.preventDefault();
					await pSetTier({tier});
				});
		};

		const btn = ee`<button class="ve-btn ve-btn-primary ecgen__btn-adjust"></button>`
			.onn("click", async evt => {
				evt.preventDefault();
				await pSetTier();
			});

		this._addHookBase("tierAdjust", () => {
			btn
				.txt(getButtonText(this._state.tierAdjust))
				.tooltip(getButtonTitle(this._state.tierAdjust));
		})();

		const wrpMenu = ee`<ul class="ve-dropdown-menu ve-block">${tiers.map(tier => getLi(tier))}</ul>`
			.hideVe();

		const dispCaret = e_({outer: `<span class="caret"></span>`});
		document.body.addEventListener("click", evt => {
			if (btnMenu.contains(evt.target)) return;
			wrpMenu.hideVe();
			dispCaret.removeClass("caret--up");
		});
		const btnMenu = ee`<button class="ve-btn ve-btn-primary w-24p px-0">${dispCaret}</button>`
			.onn("click", () => {
				wrpMenu.toggleVe(!dispCaret.hasClass("caret--up"));
				dispCaret.toggleClass("caret--up");
			});

		return ee`<div class="ve-flex-v-center relative">
			<div class="ve-btn-group">
				${btn}
				${btnMenu}
			</div>

			${wrpMenu}
		</div>`;
	}

	/* -------------------------------------------- */

	_getRenderedDispsTierMeta ({tiers}) {
		const dispsLookup = Object.fromEntries(
			tiers
				.map(tier => [tier, ee`<div></div>`]),
		);

		const onHookPulseDeriverPartyMeta = ({partyMeta}) => {
			const encounterXpInfo = partyMeta.getEncounterSpendInfo(this._comp.creatureMetas);

			const tier = partyMeta.getEncounterTier(encounterXpInfo);

			Object.entries(dispsLookup)
				.forEach(([tier_, disp]) => {
					disp
						.toggleClass("bold", tier === tier_)
						.html(
							this._tierHtmlProvider.getTierHtml({
								partyMeta,
								tier: tier_,
							}),
						);
				});
		};

		return {
			disps: tiers.map(tier => dispsLookup[tier]),
			onHookPulseDeriverPartyMeta,
		};
	}

	/* -------------------------------------------- */

	static _TITLE_XP_TO_NEXT_LEVEL = "The total XP required to allow each member of the party to level up to their next level.";

	_getRenderedExpToLevel ({partyMeta}) {
		return `<span class="help-subtle" title="${this.constructor._TITLE_XP_TO_NEXT_LEVEL}">XP to Next Level:</span> ${partyMeta?.xpToNextLevel.toLocaleStringVe() || "?"} XP`;
	}

	/* -------------------------------------------- */

	getEncounterPartyMeta () { return this._getEncounterPartyMeta(this._comp.getPartyPlayerMetas()); }

	/**
	 * @abstract
	 * @param {Array<EncounterPartyPlayerMeta>} playerMetas
	 * @return {EncounterPartyMetaBase}
	 */
	_getEncounterPartyMeta (playerMetas) { throw new Error("Unimplemented!"); }

	/* -------------------------------------------- */

	static _TITLE_TTK = "Time to Kill: The estimated number of turns the party will require to defeat the encounter. This assumes single-target damage only.";

	_getTtkProvider ({partyMeta, styleHint}) {
		const sharedOpts = {partyMeta, creatureMetas: this._comp.creatureMetas};

		switch (styleHint) {
			case SITE_STYLE__CLASSIC: return new EncounterBuilderTtkClassic(sharedOpts);
			case SITE_STYLE__ONE: return new EncounterbuilderTtkOne(sharedOpts);
			default: throw new Error(`Unhandled style "${styleHint}"!`);
		}
	}

	_getTtkHtml ({partyMeta, styleHint = null}) {
		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		return `<span class="help" title="${this.constructor._TITLE_TTK}">TTK:</span> ${this._getTtkProvider({partyMeta, styleHint}).getApproxTurnsToKill().toFixed(2)}`;
	}

	/* -------------------------------------------- */

	_getDefaultState () {
		return {
			tierRandom: null,
			shapeHashRandom: UrlUtil.URL_TO_HASH_BUILDER["encounterShape"]({name: ENCOUNTER_SHAPE_RANDOM_NAME, source: ENCOUNTER_SHAPE_RANDOM_SOURCE}),
		};
	}
}
