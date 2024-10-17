"use strict";

class PageFilterCharCreationOptions extends PageFilterBase {
	static _filterFeatureTypeSort (a, b) {
		return SortUtil.ascSort(Parser.charCreationOptionTypeToFull(a.item), Parser.charCreationOptionTypeToFull(b.item));
	}

	constructor () {
		super();
		this._typeFilter = new Filter({
			header: "Feature Type",
			items: [],
			displayFn: Parser.charCreationOptionTypeToFull,
			itemSortFn: PageFilterCharCreationOptions._filterFeatureTypeSort,
		});
		this._miscFilter = new Filter({
			header: "Miscellaneous",
			items: ["Legacy", "Has Images", "Has Info"],
			isMiscFilter: true,
			deselFn: PageFilterBase.defaultMiscellaneousDeselFn.bind(PageFilterBase),
		});
	}

	static mutateForFilters (it) {
		this._mutateForFilters_commonSources(it);

		it._fOptionType = Parser.charCreationOptionTypeToFull(it.optionType);

		this._mutateForFilters_commonMisc(it);
	}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(it._fSources);
		this._typeFilter.addItem(it._fOptionType);
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
			it._fOptionType,
			it._fMisc,
		);
	}
}

globalThis.PageFilterCharCreationOptions = PageFilterCharCreationOptions;
