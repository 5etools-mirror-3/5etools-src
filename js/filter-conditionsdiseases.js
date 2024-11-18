"use strict";

class PageFilterConditionsDiseases extends PageFilterBase {
	// region static
	static _PROPS = new Set(["condition", "disease", "status"]);

	static getDisplayProp (prop) {
		if (!this._PROPS.has(prop)) return prop;
		return prop === "status" ? "Other" : Parser.getPropDisplayName(prop);
	}
	// endregion

	constructor () {
		super();

		this._typeFilter = new Filter({
			header: "Type",
			items: ["condition", "disease", "status"],
			displayFn: PageFilterConditionsDiseases.getDisplayProp.bind(PageFilterConditionsDiseases),
			deselFn: (it) => it !== "condition",
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
		this._mutateForFilters_commonMisc(it);
	}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(it._fSources);
		this._typeFilter.addItem(it.type);
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
			it.type || it.__prop,
			it._fMisc,
		);
	}
}

globalThis.PageFilterConditionsDiseases = PageFilterConditionsDiseases;
