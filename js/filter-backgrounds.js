"use strict";

class PageFilterBackgrounds extends PageFilterBase {
	// TODO(Future) expand/move to `Renderer.generic`
	static _getToolDisplayText (tool) {
		if (tool === "anyTool") return "Any Tool";
		if (tool === "anyArtisansTool") return "Any Artisan's Tool";
		if (tool === "anyMusicalInstrument") return "Any Musical Instrument";
		if (tool === "anyGamingSet") return "Any Gaming Set";
		return tool.toTitleCase();
	}

	static _TRAIT_DISPLAY_VALUES = {
		"Armor Proficiency": "Armor Training",
	};

	constructor () {
		super();

		this._asiFilter = new AbilityScoreFilter({header: "Ability Scores"});
		this._skillFilter = new Filter({
			header: "Skill Proficiencies",
			displayFn: it => {
				const [name, sourceJson] = it.split("|");
				return `${name.toTitleCase()}${sourceJson ? ` (${Parser.sourceJsonToAbv(sourceJson)})` : ""}`;
			},
		});
		this._prereqFilter = new Filter({
			header: "Prerequisite",
			items: [...FilterCommon.PREREQ_FILTER_ITEMS],
		});
		this._toolFilter = new Filter({header: "Tool Proficiencies", displayFn: PageFilterBackgrounds._getToolDisplayText.bind(PageFilterBackgrounds)});
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

	_$getColumnHeaders () {
		const btnMeta = [
			{sort: "name", text: "Name", width: "3"},
			{sort: "ability", text: "Ability", width: "4"},
			{sort: "skills", text: "Skills", width: "4"},
			{sort: "source", text: "Source", width: "1"},
		];
		return ModalFilterBase._$getFilterColumnHeaders(btnMeta);
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
		eleRow.className = "px-0 w-100 ve-flex-col no-shrink";

		const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BACKGROUNDS](bg);
		const source = Parser.sourceJsonToAbv(bg.source);

		eleRow.innerHTML = `<div class="w-100 ve-flex-vh-center lst__row-border veapp__list-row no-select lst__wrp-cells">
			<div class="ve-col-0-5 pl-0 ve-flex-vh-center">${this._isRadio ? `<input type="radio" name="radio" class="no-events">` : `<input type="checkbox" class="no-events">`}</div>

			<div class="ve-col-0-5 px-1 ve-flex-vh-center">
				<div class="ui-list__btn-inline px-2 no-select" title="Toggle Preview (SHIFT to Toggle Info Preview)">[+]</div>
			</div>

			<div class="ve-col-3 px-1 ${bg._versionBase_isVersion ? "italic" : ""} ${this._getNameStyle()}">${bg._versionBase_isVersion ? `<span class="px-3"></span>` : ""}${bg.name}</div>
			<span class="ve-col-4 px-1 ${bg._slAbility === VeCt.STR_NONE ? "italic" : ""}">${bg._slAbility}</span>
			<div class="ve-col-4 px-1">${bg._skillDisplay}</div>
			<div class="ve-col-1 pl-1 pr-0 ve-flex-h-center ${Parser.sourceJsonToSourceClassname(bg.source)}" title="${Parser.sourceJsonToFull(bg.source)}">${source}${Parser.sourceJsonToMarkerHtml(bg.source, {isList: true})}</div>
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
