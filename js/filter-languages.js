"use strict";

class PageFilterLanguages extends PageFilterBase {
	constructor () {
		super();

		this._typeFilter = new Filter({header: "Type", items: ["standard", "exotic", "rare", "secret"], itemSortFn: null, displayFn: StrUtil.uppercaseFirst});
		this._scriptFilter = new Filter({header: "Script", displayFn: StrUtil.uppercaseFirst});
		this._miscFilter = new Filter({
			header: "Miscellaneous",
			items: ["Has Fonts", "Legacy", "Has Images", "Has Info"],
			isMiscFilter: true,
			deselFn: PageFilterBase.defaultMiscellaneousDeselFn.bind(PageFilterBase),
		});
	}

	static mutateForFilters (it) {
		this._mutateForFilters_commonSources(it);
		this._mutateForFilters_commonMisc(it);
		if (it.fonts || it._fonts) it._fMisc.push("Has Fonts");
	}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(it._fSources);
		this._scriptFilter.addItem(it.script);
		this._miscFilter.addItem(it._fMisc);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._typeFilter,
			this._scriptFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(
			values,
			it._fSources,
			it.type,
			it.script,
			it._fMisc,
		);
	}
}

globalThis.PageFilterLanguages = PageFilterLanguages;
