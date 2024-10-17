"use strict";

class PageFilterClassesBase extends PageFilterBase {
	constructor () {
		super();

		this._primaryAbilityFilter = new Filter({
			header: "Primary Ability",
			items: [
				"str",
				"dex",
				"con",
				"int",
				"wis",
				"cha",
			],
			displayFn: Parser.attAbvToFull,
			itemSortFn: null,
		});

		this._miscFilter = new Filter({
			header: "Miscellaneous",
			items: ["Reprinted", "Sidekick", "Legacy"],
			deselFn: (it) => { return it === "Reprinted" || it === "Sidekick"; },
			displayFnMini: it => it === "Reprinted" ? "Repr." : it,
			displayFnTitle: it => it === "Reprinted" ? it : "",
			isMiscFilter: true,
		});

		this._optionsFilter = new OptionsFilter({
			header: "Other/Text Options",
			defaultState: {
				isDisplayClassIfSubclassActive: false,
				isClassFeatureVariant: true,
			},
			displayFn: k => {
				switch (k) {
					case "isClassFeatureVariant": return "Class Feature Options/Variants";
					case "isDisplayClassIfSubclassActive": return "Display Class if Any Subclass is Visible";
					default: throw new Error(`Unhandled key "${k}"`);
				}
			},
			displayFnMini: k => {
				switch (k) {
					case "isClassFeatureVariant": return "C.F.O/V.";
					case "isDisplayClassIfSubclassActive": return "Sc>C";
					default: throw new Error(`Unhandled key "${k}"`);
				}
			},
		});
	}

	get optionsFilter () { return this._optionsFilter; }

	static _mutateForFilters_getFilterPrimaryAbility (cls) {
		if (!cls.primaryAbility?.length) return null;
		const out = {};
		cls.primaryAbility.forEach(obj => Object.assign(out, obj));
		return Object.keys(out);
	}

	static mutateForFilters (cls) {
		cls.source = cls.source || Parser.SRC_PHB;
		cls.subclasses = cls.subclasses || [];

		this._mutateForFilters_commonSources(cls);

		cls._fSourceSubclass = [
			...new Set([
				cls.source,
				...cls.subclasses.map(it => [it.source, ...(it.otherSources || []).map(it => it.source)]).flat(),
			]),
		];

		cls._fPrimaryAbility = this._mutateForFilters_getFilterPrimaryAbility(cls);

		this._mutateForFilters_commonMisc(cls);
		if (cls.isSidekick) cls._fMisc.push("Sidekick");

		cls.subclasses.forEach(sc => {
			sc.source = sc.source || cls.source; // default subclasses to same source as parent
			sc.shortName = sc.shortName || sc.name; // ensure shortName

			this._mutateForFilters_commonMisc(sc);
		});
	}

	_addEntrySourcesToFilter (entry) { this._addEntrySourcesToFilter_walk(entry); }

	_addEntrySourcesToFilter_walk = (obj) => {
		if ((typeof obj !== "object") || obj == null) return;

		if (obj instanceof Array) return obj.forEach(this._addEntrySourcesToFilter_walk.bind(this));

		if (obj.source) this._sourceFilter.addItem(obj.source);
		// Assume anything we care about is under `entries`, for performance
		if (obj.entries) this._addEntrySourcesToFilter_walk(obj.entries);
	};

	/**
	 * @param cls
	 * @param isExcluded
	 * @param opts Options object.
	 * @param [opts.subclassExclusions] Map of `source:name:bool` indicating if each subclass is excluded or not.
	 */
	addToFilters (cls, isExcluded, opts) {
		if (isExcluded) return;
		opts = opts || {};
		const subclassExclusions = opts.subclassExclusions || {};

		// region Sources
		// Note that we assume that, for fluff from a given source, a class/subclass will exist from that source.
		//   This allows us to skip loading the class/subclass fluff in order to track the fluff's sources.
		this._sourceFilter.addItem(cls.source);
		this._miscFilter.addItem(cls._fMisc);

		cls.classFeatures.forEach(lvlFeatures => lvlFeatures.forEach(feature => this._addEntrySourcesToFilter(feature)));

		cls.subclasses.forEach(sc => {
			const isScExcluded = (subclassExclusions[sc.source] || {})[sc.name] || false;
			if (!isScExcluded) {
				this._sourceFilter.addItem(sc.source);
				this._miscFilter.addItem(sc._fMisc);
				sc.subclassFeatures.forEach(lvlFeatures => lvlFeatures.forEach(feature => this._addEntrySourcesToFilter(feature)));
			}
		});
		// endregion
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._primaryAbilityFilter,
			this._miscFilter,
			this._optionsFilter,
		];
		opts.isCompact = true;
	}

	isClassNaturallyDisplayed (values, cls) {
		return this._filterBox.toDisplay(
			values,
			...this.constructor._getIsClassNaturallyDisplayedToDisplayParams(cls),
		);
	}

	static _getIsClassNaturallyDisplayedToDisplayParams (cls) { return [cls._fSources, cls._fMisc]; }

	isAnySubclassDisplayed (f, cls) {
		if (!f[this._optionsFilter.header].isDisplayClassIfSubclassActive) return false;
		return (cls.subclasses || [])
			.some(sc => this.isSubclassVisible(f, cls, sc));
	}

	isSubclassVisible (f, cls, sc) {
		if (
			this._filterBox.toDisplayByFilters(
				f,
				{
					filter: this._sourceFilter,
					value: sc.source,
				},
				{
					filter: this._miscFilter,
					value: sc._fMisc,
				},
			)
		) return true;

		if (!sc.otherSources?.length) return false;

		return sc.otherSources
			.some(src => {
				return this._filterBox.toDisplayByFilters(
					f,
					{
						filter: this._sourceFilter,
						value: src,
					},
					{
						filter: this._miscFilter,
						value: sc._fMisc,
					},
				);
			});
	}

	/** Return the first active source we find; use this as a fake source for things we want to force-display. */
	getActiveSource (values) {
		const sourceFilterValues = values[this._sourceFilter.header];
		if (!sourceFilterValues) return null;
		return Object.keys(sourceFilterValues).find(it => this._sourceFilter.toDisplay(values, it));
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(
			values,
			...this._getToDisplayParams(values, it),
		);
	}

	_getToDisplayParams (values, cls) {
		return [
			this.isAnySubclassDisplayed(values, cls)
				? cls._fSourceSubclass
				: (cls._fSources ?? cls.source),
			cls._fPrimaryAbility,
			cls._fMisc,
			null, // Options filter
		];
	}
}

globalThis.PageFilterClassesBase = PageFilterClassesBase;

class PageFilterClasses extends PageFilterClassesBase {
	static _getClassSubclassLevelArray (it) {
		return it.classFeatures.map((_, i) => i + 1);
	}

	constructor () {
		super();

		this._levelFilter = new RangeFilter({
			header: "Feature Level",
			min: 1,
			max: 20,
		});
	}

	get levelFilter () { return this._levelFilter; }

	static mutateForFilters (cls) {
		super.mutateForFilters(cls);

		cls._fLevelRange = this._getClassSubclassLevelArray(cls);
	}

	/**
	 * @param cls
	 * @param isExcluded
	 * @param opts Options object.
	 * @param [opts.subclassExclusions] Map of `source:name:bool` indicating if each subclass is excluded or not.
	 */
	addToFilters (cls, isExcluded, opts) {
		super.addToFilters(cls, isExcluded, opts);

		if (isExcluded) return;

		this._levelFilter.addItem(cls._fLevelRange);
	}

	async _pPopulateBoxOptions (opts) {
		await super._pPopulateBoxOptions(opts);

		opts.filters = [
			this._sourceFilter,
			this._primaryAbilityFilter,
			this._miscFilter,
			this._levelFilter,
			this._optionsFilter,
		];
	}

	static _getIsClassNaturallyDisplayedToDisplayParams (cls) {
		return [cls._fSources, cls._fMisc, cls._fLevelRange];
	}

	_getToDisplayParams (values, cls) {
		return [
			this.isAnySubclassDisplayed(values, cls)
				? cls._fSourceSubclass
				: (cls._fSources ?? cls.source),
			cls._fPrimaryAbility,
			cls._fMisc,
			cls._fLevelRange,
			null, // Options filter
		];
	}
}

globalThis.PageFilterClasses = PageFilterClasses;
