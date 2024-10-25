"use strict";

class PageFilterObjects extends PageFilterBase {
	constructor () {
		super();

		this._miscFilter = new Filter({
			header: "Miscellaneous",
			items: ["Legacy", "Has Images", "Has Info", "Has Token"],
			isMiscFilter: true,
			deselFn: PageFilterBase.defaultMiscellaneousDeselFn.bind(PageFilterBase),
		});
	}

	static mutateForFilters (obj) {
		this._mutateForFilters_commonSources(obj);
		this._mutateForFilters_commonMisc(obj);
		if (Renderer.object.hasToken(obj)) obj._fMisc.push("Has Token");
	}

	addToFilters (obj, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(obj._fSources);
		this._miscFilter.addItem(obj._fMisc);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, obj) {
		return this._filterBox.toDisplay(
			values,
			obj._fSources,
			obj._fMisc,
		);
	}
}

globalThis.PageFilterObjects = PageFilterObjects;

class ListSyntaxObjects extends ListUiUtil.ListSyntax {
	static _INDEXABLE_PROPS_ENTRIES = [
		"entries",
		"actionEntries",
	];
}

globalThis.ListSyntaxObjects = ListSyntaxObjects;
