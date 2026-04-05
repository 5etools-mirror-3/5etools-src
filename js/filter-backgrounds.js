"use strict";

class PageFilterBackgrounds extends PageFilterBase {
	static _TRAIT_DISPLAY_VALUES = {
		"Armor Proficiency": "Armor Training",
	};

	constructor () {
		super();

		this._asiFilter = new AbilityScoreFilter({header: "Ability Scores"});
		this._skillFilter = FilterCommon.getSkillProficienciesFilter();
		this._prereqFilter = new Filter({
			header: "Prerequisite",
			items: [...FilterCommon.PREREQ_FILTER_ITEMS],
		});
		this._toolFilter = FilterCommon.getToolProficienciesFilter();
		this._languageFilter = FilterCommon.getLanguageProficienciesFilter();
		this._otherBenefitsFilter = new Filter({
			header: "Other Benefits",
			displayFn: val => this.constructor._TRAIT_DISPLAY_VALUES[val] || val,
		});
		this._miscFilter = new Filter({
			header: "Miscellaneous",
			items: ["Has Info", "Has Images", "Legacy"],
			isMiscFilter: true,
			deselFn: PageFilterBase.defaultMiscellaneousDeselFn.bind(PageFilterBase),
		});
		this._featsFilter = new SearchableFilter({header: "Feats", itemSortFn: SortUtil.ascSortLower});
	}

	static _mutateForFilters_getFilterFeats (bg) {
		if (!bg.feats?.length) return null;
		return bg.feats
			.flatMap(obj => {
				return Object.entries(obj)
					.filter(([, v]) => v)
					.map(([k, v]) => {
						switch (k) {
							case "any": return "(Any)";
							case "anyFromCategory": return `(Any From Category)`;
							default: return k.split("|")[0].toTitleCase();
						}
					});
			});
	}

	static mutateForFilters (bg) {
		this._mutateForFilters_commonSources(bg);

		bg._fPrereq = FilterCommon.getFilterValuesPrerequisite(bg.prerequisite);

		const {summary: skillDisplay, collection: skills} = Renderer.generic.getSkillSummary({
			skillProfs: bg.skillProficiencies,
			skillToolLanguageProfs: bg.skillToolLanguageProficiencies,
			isShort: true,
		});
		bg._fSkills = skills;

		const {collection: tools} = Renderer.generic.getToolSummary({
			toolProfs: bg.toolProficiencies,
			skillToolLanguageProfs: bg.skillToolLanguageProficiencies,
			isShort: true,
		});
		bg._fTools = tools;

		const {collection: languages} = Renderer.generic.getLanguageSummary({
			languageProfs: bg.languageProficiencies,
			skillToolLanguageProfs: bg.skillToolLanguageProficiencies,
			isShort: true,
		});
		bg._fLangs = languages;

		this._mutateForFilters_commonMisc(bg);
		bg._fOtherBenefits = [];
		if (bg.feats) bg._fOtherBenefits.push("Feat");
		if (bg.additionalSpells) bg._fOtherBenefits.push("Additional Spells");
		if (bg.armorProficiencies) bg._fOtherBenefits.push("Armor Proficiencies");
		if (bg.weaponProficiencies) bg._fOtherBenefits.push("Weapon Proficiencies");
		bg._skillDisplay = skillDisplay;

		bg._slAbility = bg.ability
			? (Renderer.getAbilityData(bg.ability, {isOnlyShort: true, isBackgroundShortForm: bg.edition === "one"}).asTextShort || VeCt.STR_NONE)
			: VeCt.STR_NONE;

		bg._fFeats = this._mutateForFilters_getFilterFeats(bg);
	}

	addToFilters (bg, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(bg._fSources);
		this._asiFilter.addItem(bg.ability);
		this._prereqFilter.addItem(bg._fPrereq);
		this._skillFilter.addItem(bg._fSkills);
		this._toolFilter.addItem(bg._fTools);
		this._languageFilter.addItem(bg._fLangs);
		this._otherBenefitsFilter.addItem(bg._fOtherBenefits);
		this._miscFilter.addItem(bg._fMisc);
		this._featsFilter.addItem(bg._fFeats);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._asiFilter,
			this._prereqFilter,
			this._skillFilter,
			this._toolFilter,
			this._languageFilter,
			this._otherBenefitsFilter,
			this._miscFilter,
			this._featsFilter,
		];
	}

	toDisplay (values, bg) {
		return this._filterBox.toDisplay(
			values,
			bg._fSources,
			bg.ability,
			bg._fPrereq,
			bg._fSkills,
			bg._fTools,
			bg._fLangs,
			bg._fOtherBenefits,
			bg._fMisc,
			bg._fFeats,
		);
	}
}

globalThis.PageFilterBackgrounds = PageFilterBackgrounds;

class ModalFilterBackgrounds extends ModalFilterBase {
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
			modalTitle: `Background${opts.isRadio ? "" : "s"}`,
			pageFilter: new PageFilterBackgrounds(),
		});
	}

	_getColumnHeaders () {
		const btnMeta = [
			{sort: "name", text: "Name", width: "3"},
			{sort: "ability", text: "Ability", width: "4"},
			{sort: "skills", text: "Skills", width: "4"},
			{sort: "source", text: "Source", width: "1"},
		];
		return ModalFilterBase._getFilterColumnHeaders(btnMeta);
	}

	async _pLoadAllData () {
		return [
			...(await DataLoader.pCacheAndGetAllSite(UrlUtil.PG_BACKGROUNDS)),
			...((await PrereleaseUtil.pGetBrewProcessed()).background || []),
			...((await BrewUtil2.pGetBrewProcessed()).background || []),
		];
	}

	_getListItem (pageFilter, bg, bgI) {
		const eleRow = document.createElement("div");
		eleRow.className = "ve-px-0 ve-w-100 ve-flex-col ve-no-shrink";

		const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BACKGROUNDS](bg);
		const source = Parser.sourceJsonToAbv(bg.source);

		eleRow.innerHTML = `<div class="ve-w-100 ve-flex-vh-center ve-lst__row-border veapp__list-row ve-no-select ve-lst__wrp-cells">
			<div class="ve-col-0-5 ve-pl-0 ve-flex-vh-center">${this._isRadio ? `<input type="radio" name="radio" class="ve-no-events">` : `<input type="checkbox" class="ve-no-events">`}</div>

			<div class="ve-col-0-5 ve-px-1 ve-flex-vh-center">
				<div class="ve-ui-list__btn-inline ve-px-2 ve-no-select" title="Toggle Preview (SHIFT to Toggle Info Preview)">[+]</div>
			</div>

			<div class="ve-col-3 ve-px-1 ${bg._versionBase_isVersion ? "ve-italic" : ""} ${this._getNameStyle()}">${bg._versionBase_isVersion ? `<span class="ve-px-3"></span>` : ""}${bg.name}</div>
			<span class="ve-col-4 ve-px-1 ${bg._slAbility === VeCt.STR_NONE ? "ve-italic" : ""}">${bg._slAbility}</span>
			<div class="ve-col-4 ve-px-1">${bg._skillDisplay}</div>
			<div class="ve-col-1 ve-pl-1 ve-pr-0 ve-flex-h-center ${Parser.sourceJsonToSourceClassname(bg.source)}" title="${Parser.sourceJsonToFull(bg.source)}">${source}${Parser.sourceJsonToMarkerHtml(bg.source, {isList: true})}</div>
		</div>`;

		const btnShowHidePreview = eleRow.firstElementChild.children[1].firstElementChild;

		const listItem = new ListItem(
			bgI,
			eleRow,
			bg.name,
			{
				hash,
				source,
				sourceJson: bg.source,
				...ListItem.getCommonValues(bg),
				ability: bg._slAbility,
				skills: bg._skillDisplay,
			},
			{
				cbSel: eleRow.firstElementChild.firstElementChild.firstElementChild,
				btnShowHidePreview,
			},
		);

		ListUiUtil.bindPreviewButton(UrlUtil.PG_BACKGROUNDS, this._allData, listItem, btnShowHidePreview);

		return listItem;
	}
}

globalThis.ModalFilterBackgrounds = ModalFilterBackgrounds;
