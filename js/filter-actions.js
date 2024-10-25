"use strict";

class PageFilterActions extends PageFilterBase {
	static getTimeText (time) {
		return typeof time === "string" ? time : Parser.getTimeToFull(time);
	}

	constructor () {
		super();

		this._timeFilter = new Filter({
			header: "Type",
			displayFn: StrUtil.uppercaseFirst,
			itemSortFn: SortUtil.ascSortLower,
		});
		this._miscFilter = new Filter({
			header: "Miscellaneous",
			items: ["Optional/Variant Action", "Legacy"],
			isMiscFilter: true,
			deselFn: PageFilterBase.defaultMiscellaneousDeselFn.bind(PageFilterBase),
		});
	}

	static mutateForFilters (it) {
		this._mutateForFilters_commonSources(it);
		it._fTime = it.time ? it.time.map(it => it.unit || it) : null;
		this._mutateForFilters_commonMisc(it);
		if (it.fromVariant) it._fMisc.push("Optional/Variant Action");
	}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(it._fSources);
		this._timeFilter.addItem(it._fTime);
		this._miscFilter.addItem(it._fMisc);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._timeFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(
			values,
			it._fSources,
			it._fTime,
			it._fMisc,
		);
	}
}

globalThis.PageFilterActions = PageFilterActions;
