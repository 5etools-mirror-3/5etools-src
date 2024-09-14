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
			deselFn: (it) => it === "Reprinted",
			isMiscFilter: true,
		});
	}

	static mutateForFilters (it) {
		it._fType = it.__prop === "cult" ? "Cult" : it.type ? `Boon, ${it.type}` : "Boon";
		it._fMisc = [];
		if (SourceUtil.isLegacySourceWotc(it.source)) it._fMisc.push("Legacy");
		if (this._isReprinted({reprintedAs: it.reprintedAs, tag: it.__prop, prop: it.__prop, page: UrlUtil.PG_CULTS_BOONS})) it._fMisc.push("Reprinted");
	}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(it.source);
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
			cb.source,
			cb._fType,
			cb.type,
			cb._fMisc,
		);
	}
}

globalThis.PageFilterCultsBoons = PageFilterCultsBoons;
