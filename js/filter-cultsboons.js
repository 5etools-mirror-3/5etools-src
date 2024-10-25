"use strict";

class PageFilterCultsBoons extends PageFilterBase {
	constructor () {
		super();

		this._typeFilter = new Filter({
			header: "Type",
			items: ["Boon, Demonic", "Cult"],
		});
		this._subtypeFilter = new Filter({
			header: "Subtype",
			items: [],
		});
		this._miscFilter = new Filter({
			header: "Miscellaneous",
			items: ["Legacy", "Reprinted"],
			isMiscFilter: true,
			deselFn: PageFilterBase.defaultMiscellaneousDeselFn.bind(PageFilterBase),
		});
	}

	static mutateForFilters (it) {
		this._mutateForFilters_commonSources(it);
		it._fType = it.__prop === "cult" ? "Cult" : it.type ? `Boon, ${it.type}` : "Boon";
		this._mutateForFilters_commonMisc(it);
	}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(it._fSources);
		this._typeFilter.addItem(it._fType);
		this._subtypeFilter.addItem(it.type);
		this._miscFilter.addItem(it._fMisc);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._typeFilter,
			this._subtypeFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, cb) {
		return this._filterBox.toDisplay(
			values,
			cb._fSources,
			cb._fType,
			cb.type,
			cb._fMisc,
		);
	}
}

globalThis.PageFilterCultsBoons = PageFilterCultsBoons;
