"use strict";

class PageFilterTables extends PageFilterBase {
	// region static
	static sortTables (a, b, opts) {
		opts = opts || {sortBy: "sortName"};
		if (opts.sortBy === "sortName") return SortUtil._listSort_compareBy(a, b, opts.sortBy);
		if (opts.sortBy === "source") return SortUtil._listSort_compareBy(a, b, opts.sortBy) || SortUtil._listSort_compareBy(a, b, "page") || SortUtil._listSort_compareBy(a, b, "sortName");
		return SortUtil._listSort_compareBy(a, b, opts.sortBy) || SortUtil._listSort_compareBy(a, b, "sortName");
	}

	static getSortName (name) {
		return name.replace(/^\s*([\d,.]+)\s*gp/i, (...m) => m[1].replace(Parser._numberCleanRegexp, "").padStart(9, "0"));
	}

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
