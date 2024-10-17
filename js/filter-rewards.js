"use strict";

class PageFilterRewards extends PageFilterBase {
	constructor () {
		super();

		this._typeFilter = new Filter({
			header: "Type",
			items: [
				"Blessing",
				"Boon",
				"Charm",
			],
		});
		this._rarityFilter = new Filter({
			header: "Rarity",
			items: ["unknown", ...Parser.RARITIES],
			itemSortFn: null,
			displayFn: StrUtil.toTitleCase,
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
		it._fRarity = it.rarity || "unknown";
		this._mutateForFilters_commonMisc(it);
	}

	addToFilters (ent, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(ent._fSources);
		this._typeFilter.addItem(ent.type);
		this._rarityFilter.addItem(ent._fRarity);
		this._miscFilter.addItem(ent._fMisc);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._typeFilter,
			this._rarityFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, r) {
		return this._filterBox.toDisplay(
			values,
			r.source,
			r.type,
			r._fRarity,
			r._fMisc,
		);
	}
}

globalThis.PageFilterRewards = PageFilterRewards;
