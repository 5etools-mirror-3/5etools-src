"use strict";

class PageFilterDecks extends PageFilterBase {
	constructor () {
		super();

		this._miscFilter = new Filter({
			header: "Miscellaneous",
			items: ["Has Card Art", "SRD", "Legacy"],
			isMiscFilter: true,
			selFn: it => it === "Has Card Art",
		});
	}

	static mutateForFilters (ent) {
		ent._fMisc = [];
		if (ent.srd) ent._fMisc.push("SRD");
		if (SourceUtil.isLegacySourceWotc(ent.source)) ent._fMisc.push("Legacy");
		if (ent.hasCardArt) ent._fMisc.push("Has Card Art");
	}

	addToFilters (ent, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(ent.source);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, ent) {
		return this._filterBox.toDisplay(
			values,
			ent.source,
			ent._fMisc,
		);
	}
}

globalThis.PageFilterDecks = PageFilterDecks;

class ListSyntaxDecks extends ListUiUtil.ListSyntax {
	static _INDEXABLE_PROPS_ENTRIES = [
		"entries",
		"cards",
	];
}

globalThis.ListSyntaxDecks = ListSyntaxDecks;
