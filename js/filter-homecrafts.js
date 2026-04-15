"use strict";

class PageFilterHomeCrafts extends PageFilterBase {
	static _SKILL_LEVELS = ["B", "I", "A"];

	static _ascSortSkillLevelFilter (a, b) {
		const aSort = this._SKILL_LEVELS.indexOf(a.item);
		const bSort = this._SKILL_LEVELS.indexOf(b.item);
		return SortUtil.ascSort(~aSort ? aSort : Number.MAX_SAFE_INTEGER, ~bSort ? bSort : Number.MAX_SAFE_INTEGER);
	}

	constructor () {
		super();

		this._categoryFilter = new Filter({
			header: "Category",
			items: ["amigurumi", "wearable", "household item"],
			displayFn: it => it.toTitleCase(),
		});
		this._skillLevelFilter = new Filter({
			header: "Skill Level",
			items: [...PageFilterHomeCrafts._SKILL_LEVELS],
			displayFn: it => Parser.crochetPatternSkilLevelToFull(it),
			itemSortFn: PageFilterHomeCrafts._ascSortSkillLevelFilter.bind(PageFilterHomeCrafts),
		});
		this._sizeFilterWidth = new RangeFilter({header: "Width", min: 1, max: 10, suffix: " in."});
		this._sizeFilterHeight = new RangeFilter({header: "Height", min: 1, max: 10, suffix: " in."});
		this._sizesFilter = new MultiFilter({
			header: "Sizes",
			filters: [this._sizeFilterWidth, this._sizeFilterHeight],
			isAddDropdownToggle: true,
		});
		this._hookFilter = new Filter({
			header: "Hook",
			displayFn: sizeMm => {
				const asMm = `${sizeMm.toFixed(2)} mm`;

				const usSize = Parser.crochetHookMmToUs(sizeMm);
				if (!usSize) return asMm;

				return `${usSize} (${asMm})`;
			},
		});
		this._designerFilter = new Filter({
			header: "Designer",
		});
		this._miscFilter = new Filter({
			header: "Miscellaneous",
			items: ["Has Images", "Has Info"],
			isMiscFilter: true,
			deselFn: PageFilterBase.defaultMiscellaneousDeselFn.bind(PageFilterBase),
		});
	}

	static mutateForFilters (ent) {
		this._mutateForFilters_commonSources(ent);
		this._mutateForFilters_commonMisc(ent);

		ent._fWidth = (ent.size || []).filter(sz => sz.width?.mm != null).map(sz => Parser.metric.getApproxDisplayInches(sz.width.mm));
		if (!ent._fWidth.length) ent._fWidth = null;
		ent._fHeight = (ent.size || []).filter(sz => sz.height?.mm != null).map(sz => Parser.metric.getApproxDisplayInches(sz.height.mm));
		if (!ent._fHeight.length) ent._fHeight = null;

		ent._fHooks = (ent.hooks || []).flatMap(it => typeof it === "number" ? it : it.hooks).filter(Boolean);
	}

	addToFilters (ent, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(ent._fSources);
		this._categoryFilter.addItem(ent.patternType);
		this._skillLevelFilter.addItem(ent.level);
		this._sizeFilterWidth.addItem(ent._fWidth);
		this._sizeFilterHeight.addItem(ent._fHeight);
		this._hookFilter.addItem(ent._fHooks);
		this._designerFilter.addItem(ent.designers);
		this._miscFilter.addItem(ent._fMisc);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._categoryFilter,
			this._skillLevelFilter,
			this._sizesFilter,
			this._hookFilter,
			this._designerFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, ent) {
		return this._filterBox.toDisplay(
			values,
			ent._fSources,
			ent.patternType,
			ent.level,
			[
				ent._fWidth,
				ent._fHeight,
			],
			ent._fHooks,
			ent.designers,
			ent._fMisc,
		);
	}
}

globalThis.PageFilterHomeCrafts = PageFilterHomeCrafts;
