"use strict";

class PageFilterTables extends PageFilterBase {
	// region static
	static _sourceSelFn (val) {
		return !SourceUtil.isNonstandardSource(val) && !SourceUtil.isAdventure(val);
	}
	// endregion

	constructor () {
		super({sourceFilterOpts: {selFn: PageFilterTables._sourceSelFn}});

		this._miscFilter = new Filter({
			header: "Miscellaneous",
			items: ["Legacy"],
			isMiscFilter: true,
			deselFn: PageFilterBase.defaultMiscellaneousDeselFn.bind(PageFilterBase),
		});
	}

	static mutateForFilters (it) {
		this._mutateForFilters_commonSources(it);
		this._mutateForFilters_commonMisc(it);

		if (it.isNameGenerator) it._fMisc.push("Name Generator");
	}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(it._fSources);
		this._miscFilter.addItem(it._fMisc);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(
			values,
			it._fSources,
			it._fMisc,
		);
	}
}

globalThis.PageFilterTables = PageFilterTables;

class ListSyntaxTables extends ListUiUtil.ListSyntax {
	static _INDEXABLE_PROPS_ENTRIES = [
		"rows",
		"tables",
	];
}

globalThis.ListSyntaxTables = ListSyntaxTables;
