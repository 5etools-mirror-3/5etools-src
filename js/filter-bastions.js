"use strict";

class PageFilterBastions extends PageFilterBase {
	constructor () {
		super();

		this._typeFilter = new Filter({
			header: "Type",
			items: ["basic", "special"],
			displayFn: it => it.toTitleCase(),
			deselFn: (it) => it === "basic",
		});
		this._levelFilter = new RangeFilter({
			header: "Level",
			isLabelled: true,
			labels: ["\u2014", ...Array.from({length: 20}, (_, i) => i + 1)],
			labelDisplayFn: n => n === "\u2014" ? "None" : n,
		});
		this._prereqFilter = new Filter({
			header: "Prerequisite",
			items: [...FilterCommon.PREREQ_FILTER_ITEMS],
		});
		this._miscFilter = new Filter({
			header: "Miscellaneous",
			items: ["Has Images", "Has Info"],
			isMiscFilter: true,
			deselFn: PageFilterBase.defaultMiscellaneousDeselFn.bind(PageFilterBase),
		});
	}

	static mutateForFilters (ent) {
		this._mutateForFilters_commonSources(ent);
		this._mutateForFilters_commonMisc(ent);

		ent._slPrereq = Renderer.utils.prerequisite.getHtml(ent.prerequisite, {isListMode: true}) || VeCt.STR_NONE;
		ent._fPrereq = FilterCommon.getFilterValuesPrerequisite(ent.prerequisite);
	}

	addToFilters (ent, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(ent._fSources);
		this._typeFilter.addItem(ent.type);
		this._levelFilter.addItem(ent.level);
		this._prereqFilter.addItem(ent._fPrereq);
		this._miscFilter.addItem(ent._fMisc);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._typeFilter,
			this._levelFilter,
			this._prereqFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, ent) {
		return this._filterBox.toDisplay(
			values,
			ent._fSources,
			ent.facilityType,
			ent.level,
			ent._fPrereq,
			ent._fMisc,
		);
	}
}

globalThis.PageFilterBastions = PageFilterBastions;
