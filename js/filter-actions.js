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
		this._miscFilter = new Filter({header: "Miscellaneous", items: ["Optional/Variant Action", "SRD", "Basic Rules", "Legacy"], isMiscFilter: true});
	}

	static mutateForFilters (it) {
		it._fTime = it.time ? it.time.map(it => it.unit || it) : null;
		it._fMisc = [];
		if (it.srd) it._fMisc.push("SRD");
		if (it.basicRules) it._fMisc.push("Basic Rules");
		if (SourceUtil.isLegacySourceWotc(it.source)) it._fMisc.push("Legacy");
		if (it.fromVariant) it._fMisc.push("Optional/Variant Action");
	}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(it.source);
		this._timeFilter.addItem(it._fTime);
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
			it.source,
			it._fTime,
			it._fMisc,
		);
	}
}

globalThis.PageFilterActions = PageFilterActions;
