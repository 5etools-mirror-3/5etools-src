"use strict";

class PageFilterRecipes extends PageFilterBase {
	static _DIET_TO_FULL = {
		"V": "Vegan",
		"C": "Vegetarian",
		"X": "Omni",
	};
	static _MISC_TAG_TO_FULL = {
		"alcohol": "Contains Alcohol",
		"feast": "Feast Dish",
	};

	constructor () {
		super();

		this._typeFilter = new Filter({
			header: "Category",
			displayFn: StrUtil.toTitleCase.bind(StrUtil),
			itemSortFn: SortUtil.ascSortLower,
		});
		this._dishTypeFilter = new Filter({
			header: "Dish Type",
			displayFn: StrUtil.toTitleCase.bind(StrUtil),
			itemSortFn: SortUtil.ascSortLower,
		});
		this._servesFilter = new RangeFilter({header: "Serves", min: 1, max: 1});
		this._timeFilterTotal = new RangeFilter({header: "Total", min: 10, max: 60, displayFn: time => Parser.getMinutesToFull(time, {isShort: true}), displayFnTooltip: Parser.getMinutesToFull});
		this._timeFilterPreparation = new RangeFilter({header: "Preparation", min: 10, max: 60, displayFn: time => Parser.getMinutesToFull(time, {isShort: true}), displayFnTooltip: Parser.getMinutesToFull});
		this._timeFilterCooking = new RangeFilter({header: "Cooking", min: 10, max: 60, displayFn: time => Parser.getMinutesToFull(time, {isShort: true}), displayFnTooltip: Parser.getMinutesToFull});
		this._timeFilter = new MultiFilter({
			header: "Time",
			filters: [this._timeFilterTotal, this._timeFilterPreparation, this._timeFilterCooking],
		});
		this._dietFilter = new Filter({
			header: "Diet",
			displayFn: PageFilterRecipes._dietToFull,
			itemSortFn: SortUtil.ascSortLower,
		});
		this._allergensFilter = new Filter({
			header: "Allergens",
			displayFn: StrUtil.toTitleCase.bind(StrUtil),
			itemSortFn: SortUtil.ascSortLower,
		});
		this._miscFilter = new Filter({
			header: "Miscellaneous",
			items: ["Legacy"],
			isMiscFilter: true,
			displayFn: PageFilterRecipes._miscTagToFull,
			deselFn: PageFilterBase.defaultMiscellaneousDeselFn.bind(PageFilterBase),
		});
	}

	static mutateForFilters (it) {
		this._mutateForFilters_commonSources(it);
		this._mutateForFilters_commonMisc(it);
		if (it.miscTags) it._fMisc.push(...it.miscTags);
		it._fServes = (it.serves?.min != null && it.serves?.max != null) ? [it.serves.min, it.serves.max] : (it.serves?.exact ?? null);
		const totalTime = it.time?.total ?? this._mutateForFilters_getTotalTime(it.time);
		it._fTimeTotal = totalTime != null ? this._mutateForFilters_getFilterTime(totalTime) : null;
		it._fTimePreparation = it.time?.preparation ? this._mutateForFilters_getFilterTime(it.time.preparation) : null;
		it._fTimeCooking = it.time?.cooking ? this._mutateForFilters_getFilterTime(it.time.cooking) : null;
		it._fDiet = it.diet ? PageFilterRecipes._DIET_TO_FULL[it.diet] || it.diet : null;
	}

	static _ONE_DAY_MINS = 24 * 60;

	static _mutateForFilters_getTotalTime (time) {
		if (time == null) return null;

		let min = 0; let max = 0;

		Object.values(time)
			.forEach(val => {
				if (val.min != null && val.max != null) {
					min += val.min;
					max += val.max;
					return;
				}

				if (typeof val === "number") {
					min += val;
					max += val;
				}
			});

		if (!min && !max) return null;

		// Heuristic -- if calculated total time is longer than a day, we probably don't want to display it
		//   e.g. when including long "fermentation" time
		if (min >= this._ONE_DAY_MINS || max >= this._ONE_DAY_MINS) return null;

		if (min === max) return min;
		return {min, max};
	}

	static _mutateForFilters_getFilterTime (val) {
		if (val.min != null && val.max != null) return [val.min, val.max];
		if (typeof val === "number") return val;
		return null;
	}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(it._fSources);
		this._typeFilter.addItem(it.type);
		this._dishTypeFilter.addItem(it.dishTypes);
		this._servesFilter.addItem(it._fServes);
		this._timeFilterTotal.addItem(it._fTimeTotal);
		this._timeFilterPreparation.addItem(it._fTimePreparation);
		this._timeFilterCooking.addItem(it._fTimeCooking);
		this._dietFilter.addItem(it._fDiet);
		this._allergensFilter.addItem(it.allergenGroups);
		this._miscFilter.addItem(it._fMisc);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._typeFilter,
			this._dishTypeFilter,
			this._servesFilter,
			this._timeFilter,
			this._dietFilter,
			this._allergensFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(
			values,
			it._fSources,
			it.type,
			it.dishTypes,
			it._fServes,
			[
				it._fTimeTotal,
				it._fTimePreparation,
				it._fTimeCooking,
			],
			it._fDiet,
			it.allergenGroups,
			it._fMisc,
		);
	}

	static _dietToFull (diet) { return PageFilterRecipes._DIET_TO_FULL[diet] || diet; }
	static _miscTagToFull (tag) { return PageFilterRecipes._MISC_TAG_TO_FULL[tag] || tag; }
}

globalThis.PageFilterRecipes = PageFilterRecipes;

class ListSyntaxRecipes extends ListUiUtil.ListSyntax {
	static _INDEXABLE_PROPS_ENTRIES = [
		"ingredients",
		"instructions",
	];
}

globalThis.ListSyntaxRecipes = ListSyntaxRecipes;
