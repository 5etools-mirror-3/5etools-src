"use strict";

class PageFilterTrapsHazards extends PageFilterBase {
	// region static
	static sortFilterType (a, b) {
		return SortUtil.ascSortLower(Parser.trapHazTypeToFull(a.item), Parser.trapHazTypeToFull(b.item));
	}
	// endregion

	constructor () {
		super();

		this._typeFilter = new Filter({
			header: "Type",
			items: [
				"MECH",
				"MAG",
				"SMPL",
				"CMPX",
				"HAZ",
				"WTH",
				"ENV",
				"WLD",
				"GEN",
				"TRP",
				"HAUNT",
			],
			displayFn: Parser.trapHazTypeToFull,
			itemSortFn: PageFilterTrapsHazards.sortFilterType.bind(PageFilterTrapsHazards),
		});
		this._miscFilter = new Filter({
			header: "Miscellaneous",
			items: ["Legacy", "Has Images", "Has Info"],
			isMiscFilter: true,
			deselFn: PageFilterBase.defaultMiscellaneousDeselFn.bind(PageFilterBase),
		});
	}

	static mutateForFilters (it) {
		it.trapHazType = it.trapHazType || "HAZ";

		this._mutateForFilters_commonSources(it);
		this._mutateForFilters_commonMisc(it);
	}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(it._fSources);
		this._typeFilter.addItem(it.trapHazType);
		this._miscFilter.addItem(it._fMisc);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._typeFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(
			values,
			it._fSources,
			it.trapHazType,
			it._fMisc,
		);
	}
}

globalThis.PageFilterTrapsHazards = PageFilterTrapsHazards;

class ListSyntaxTrapsHazards extends ListUiUtil.ListSyntax {
	static _INDEXABLE_PROPS_ENTRIES = [
		"effect",
		"trigger",
		"countermeasures",
		"entries",
	];
}

globalThis.ListSyntaxTrapsHazards = ListSyntaxTrapsHazards;
