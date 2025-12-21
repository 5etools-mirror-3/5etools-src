"use strict";

class PageFilterFeats extends PageFilterBase {
	// region static
	static _PREREQ_KEYs_OTHER_IGNORED = new Set(["level"]);

	static _TRAIT_DISPLAY_VALUES = {
		"Armor Proficiency": "Armor Training",
	};
	// endregion

	constructor () {
		super();

		this._categoryFilter = new Filter({
			header: "Category",
			displayFn: Parser.featCategoryToFull,
			items: [...Object.keys(Parser.FEAT_CATEGORY_TO_FULL), "Other"],
		});
		this._asiFilter = new Filter({
			header: "Ability Bonus",
			items: [
				"str",
				"dex",
				"con",
				"int",
				"wis",
				"cha",
			],
			displayFn: Parser.attAbvToFull,
			itemSortFn: null,
		});
		this._otherPrereqFilter = new Filter({
			header: "Other",
			items: [...FilterCommon.PREREQ_FILTER_ITEMS],
		});
		this._levelFilter = new Filter({
			header: "Level",
			itemSortFn: SortUtil.ascSortNumericalSuffix,
		});
		this._prerequisiteFilter = new MultiFilter({header: "Prerequisite", filters: [this._otherPrereqFilter, this._levelFilter]});
		this._benefitsFilter = new Filter({
			header: "Benefits",
			items: [
				"Armor Proficiency",
				"Language Proficiency",
				"Skill Proficiency",
				"Spellcasting",
				"Tool Proficiency",
				"Weapon Proficiency",
			],
			displayFn: val => this.constructor._TRAIT_DISPLAY_VALUES[val] || val,
		});
		this._vulnerableFilter = FilterCommon.getDamageVulnerableFilter();
		this._resistFilter = FilterCommon.getDamageResistFilter();
		this._immuneFilter = FilterCommon.getDamageImmuneFilter();
		this._defenseFilter = new MultiFilter({header: "Damage", filters: [this._vulnerableFilter, this._resistFilter, this._immuneFilter]});
		this._conditionImmuneFilter = FilterCommon.getConditionImmuneFilter();
		this._miscFilter = new Filter({
			header: "Miscellaneous",
			items: ["Has Info", "Has Images", "Legacy"],
			isMiscFilter: true,
			deselFn: PageFilterBase.defaultMiscellaneousDeselFn.bind(PageFilterBase),
		});
	}

	static mutateForFilters (feat) {
		this._mutateForFilters_commonSources(feat);

		const ability = Renderer.getAbilityData(feat.ability);
		feat._fAbility = ability.asCollection.filter(a => !ability.areNegative.includes(a)); // used for filtering

		feat._fCategory = feat.category || "Other";

		const prereqText = Renderer.utils.prerequisite.getHtml(feat.prerequisite, {isListMode: true}) || VeCt.STR_NONE;

		feat._fPrereqOther = FilterCommon.getFilterValuesPrerequisite(feat.prerequisite, {ignoredKeys: this._PREREQ_KEYs_OTHER_IGNORED});
		feat._fPrereqLevel = feat.prerequisite
			? feat.prerequisite
				.filter(it => it.level != null)
				.map(it => `Level ${it.level.level ?? it.level}`)
			: [];
		feat._fBenefits = [
			...(feat.traitTags || []),
			feat.resist ? "Damage Resistance" : null,
			feat.immune ? "Damage Immunity" : null,
			feat.conditionImmune ? "Condition Immunity" : null,
			feat.skillProficiencies ? "Skill Proficiency" : null,
			feat.additionalSpells ? "Spellcasting" : null,
			feat.armorProficiencies ? "Armor Proficiency" : null,
			feat.weaponProficiencies ? "Weapon Proficiency" : null,
			feat.toolProficiencies ? "Tool Proficiency" : null,
			feat.languageProficiencies ? "Language Proficiency" : null,
		].filter(Boolean);
		if (feat.skillToolLanguageProficiencies?.length) {
			if (feat.skillToolLanguageProficiencies.some(it => (it.choose || []).some(x => x.from || [].includes("anySkill")))) feat._fBenefits.push("Skill Proficiency");
			if (feat.skillToolLanguageProficiencies.some(it => (it.choose || []).some(x => x.from || [].includes("anyTool")))) feat._fBenefits.push("Tool Proficiency");
			if (feat.skillToolLanguageProficiencies.some(it => (it.choose || []).some(x => x.from || [].includes("anyLanguage")))) feat._fBenefits.push("Language Proficiency");
		}
		this._mutateForFilters_commonMisc(feat);
		if (feat.repeatable != null) feat._fMisc.push(feat.repeatable ? "Repeatable" : "Not Repeatable");

		feat._slAbility = ability.asTextShort || VeCt.STR_NONE;
		feat._slPrereq = prereqText;

		FilterCommon.mutateForFilters_damageVulnResImmunePlayer(feat);
		FilterCommon.mutateForFilters_conditionImmunePlayer(feat);
	}

	addToFilters (feat, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(feat._fSources);
		this._categoryFilter.addItem(feat.category);
		this._levelFilter.addItem(feat._fPrereqLevel);
		this._otherPrereqFilter.addItem(feat._fPrereqOther);
		this._vulnerableFilter.addItem(feat._fVuln);
		this._resistFilter.addItem(feat._fRes);
		this._immuneFilter.addItem(feat._fImm);
		this._conditionImmuneFilter.addItem(feat._fCondImm);
		this._benefitsFilter.addItem(feat._fBenefits);
		this._miscFilter.addItem(feat._fMisc);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._categoryFilter,
			this._asiFilter,
			this._prerequisiteFilter,
			this._benefitsFilter,
			this._defenseFilter,
			this._conditionImmuneFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, ft) {
		return this._filterBox.toDisplay(
			values,
			ft._fSources,
			ft._fCategory,
			ft._fAbility,
			[
				ft._fPrereqOther,
				ft._fPrereqLevel,
			],
			ft._fBenefits,
			[
				ft._fVuln,
				ft._fRes,
				ft._fImm,
			],
			ft._fCondImm,
			ft._fMisc,
		);
	}
}

globalThis.PageFilterFeats = PageFilterFeats;

class ModalFilterFeats extends ModalFilterBase {
	/**
	 * @param opts
	 * @param opts.namespace
	 * @param [opts.isRadio]
	 * @param [opts.allData]
	 */
	constructor (opts) {
		opts = opts || {};
		super({
			...opts,
			modalTitle: `Feat${opts.isRadio ? "" : "s"}`,
			pageFilter: new PageFilterFeats(),
		});
	}

	_$getColumnHeaders () {
		const btnMeta = [
			{sort: "name", text: "Name", width: "3-5"},
			{sort: "category", text: "Category", width: "1-5"},
			{sort: "ability", text: "Ability", width: "2"},
			{sort: "prerequisite", text: "Prerequisite", width: "3"},
			{sort: "source", text: "Source", width: "1"},
		];
		return ModalFilterBase._$getFilterColumnHeaders(btnMeta);
	}

	async _pLoadAllData () {
		return [
			...(await DataLoader.pCacheAndGetAllSite(UrlUtil.PG_FEATS)),
			...((await PrereleaseUtil.pGetBrewProcessed()).feat || []),
			...((await BrewUtil2.pGetBrewProcessed()).feat || []),
		];
	}

	_getListItem (pageFilter, feat, ftI) {
		const eleRow = document.createElement("div");
		eleRow.className = "px-0 w-100 ve-flex-col no-shrink";

		const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_FEATS](feat);
		const source = Parser.sourceJsonToAbv(feat.source);

		eleRow.innerHTML = `<div class="w-100 ve-flex-vh-center lst__row-border veapp__list-row no-select lst__wrp-cells">
			<div class="ve-col-0-5 pl-0 ve-flex-vh-center">${this._isRadio ? `<input type="radio" name="radio" class="no-events">` : `<input type="checkbox" class="no-events">`}</div>

			<div class="ve-col-0-5 px-1 ve-flex-vh-center">
				<div class="ui-list__btn-inline px-2 no-select" title="Toggle Preview (SHIFT to Toggle Info Preview)">[+]</div>
			</div>

			<div class="ve-col-3-5 px-1 ${feat._versionBase_isVersion ? "italic" : ""} ${this._getNameStyle()}">${feat._versionBase_isVersion ? `<span class="px-3"></span>` : ""}${feat.name}</div>
			<span class="ve-col-1-5 px-1 ve-text-center ${feat.category == null ? "italic" : ""}" ${feat.category ? `title="${Parser.featCategoryToFull(feat.category).qq()}"` : ""}>${feat.category || "\u2014"}</span>
			<span class="ve-col-2 px-1 ${feat._slAbility === VeCt.STR_NONE ? "italic" : ""}">${feat._slAbility}</span>
			<span class="ve-col-3 px-1 ${feat._slPrereq === VeCt.STR_NONE ? "italic" : ""}">${feat._slPrereq}</span>
			<div class="ve-col-1 pl-1 pr-0 ve-flex-h-center ${Parser.sourceJsonToSourceClassname(feat.source)}" title="${Parser.sourceJsonToFull(feat.source)}">${source}${Parser.sourceJsonToMarkerHtml(feat.source, {isList: true})}</div>
		</div>`;

		const btnShowHidePreview = eleRow.firstElementChild.children[1].firstElementChild;

		const listItem = new ListItem(
			ftI,
			eleRow,
			feat.name,
			{
				hash,
				source,
				sourceJson: feat.source,
				...ListItem.getCommonValues(feat),
				category: feat.category || "Other",
				ability: feat._slAbility,
				prerequisite: feat._slPrereq,
			},
			{
				cbSel: eleRow.firstElementChild.firstElementChild.firstElementChild,
				btnShowHidePreview,
			},
		);

		ListUiUtil.bindPreviewButton(UrlUtil.PG_FEATS, this._allData, listItem, btnShowHidePreview);

		return listItem;
	}
}

globalThis.ModalFilterFeats = ModalFilterFeats;
