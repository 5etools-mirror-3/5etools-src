"use strict";

class PageFilterClassesRaw extends PageFilterClassesBase {
	async _pPopulateBoxOptions (opts) {
		await super._pPopulateBoxOptions(opts);
		opts.isCompact = false;
	}

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

		this._sourceFilter.addItem(cls.source);
		this._miscFilter.addItem(cls._fMisc);

		if (cls.fluff) cls.fluff.forEach(it => this._addEntrySourcesToFilter(it));

		cls.subclasses.forEach(sc => {
			const isScExcluded = subclassExclusions[sc.source]?.[sc.name] || false;
			if (isScExcluded) return;

			this._sourceFilter.addItem(sc.source);
			this._miscFilter.addItem(sc._fMisc);
		});
	}
}

globalThis.PageFilterClassesRaw = PageFilterClassesRaw;

class ModalFilterClasses extends ModalFilterBase {
	/**
	 * @param opts
	 * @param opts.namespace
	 * @param [opts.allData]
	 */
	constructor (opts) {
		opts = opts || {};

		super({
			...opts,
			modalTitle: "Class and Subclass",
			pageFilter: new PageFilterClassesRaw(),
			fnSort: ModalFilterClasses.fnSort,
		});

		this._pLoadingAllData = null;

		this._ixPrevSelectedClass = null;
		this._isClassDisabled = false;
		this._isSubclassDisabled = false;
	}

	get pageFilter () { return this._pageFilter; }

	static fnSort (a, b, opts) {
		const out = SortUtil.listSort(a, b, opts);

		if (opts.sortDir === "desc" && a.data.ixClass === b.data.ixClass && (a.data.ixSubclass != null || b.data.ixSubclass != null)) {
			return a.data.ixSubclass != null ? -1 : 1;
		}

		return out;
	}

	/** Used to fetch the data for a level, given some identifying information from a previous user selection. */
	async pGetSelection (classSubclassMeta) {
		const {className, classSource, subclassName, subclassSource} = classSubclassMeta;

		const allData = this._allData || await this._pLoadAllData();

		const cls = allData.find(it => it.name === className && it.source === classSource);
		if (!cls) throw new Error(`Could not find class with name "${className}" and source "${classSource}"`);

		const out = {
			class: cls,
		};

		if (subclassName && subclassSource) {
			const sc = cls.subclasses.find(it => it.name === subclassName && it.source === subclassSource);
			if (!sc) throw new Error(`Could not find subclass with name "${subclassName}" and source "${subclassSource}" on class with name "${className}" and source "${classSource}"`);

			out.subclass = sc;
		}

		return out;
	}

	async pGetUserSelection ({filterExpression = null, selectedClass = null, selectedSubclass = null, isClassDisabled = false, isSubclassDisabled = false} = {}) {
		// eslint-disable-next-line no-async-promise-executor
		return new Promise(async resolve => {
			const {$modalInner, doClose} = await this._pGetShowModal(resolve);

			await this.pPreloadHidden($modalInner);

			this.doApplyFilterExpression(filterExpression);

			this._filterCache.$btnConfirm.off("click").click(async () => {
				// Note: use invisible items, as this might be the parent class of a selected subclass
				const checked = this._filterCache.list.items.filter(it => it.data.tglSel.classList.contains("active"));
				const out = {};
				checked.forEach(it => {
					if (it.data.ixSubclass == null) out.class = this._filterCache.allData[it.data.ixClass];
					else out.subclass = this._filterCache.allData[it.data.ixClass].subclasses[it.data.ixSubclass];
				});
				resolve(MiscUtil.copyFast(out));

				doClose(true);

				ModalFilterClasses._doListDeselectAll(this._filterCache.list);
			});

			// Since the UI gets moved to a new filter window on every call to this method, this state modification is correct.
			this._ixPrevSelectedClass = selectedClass != null
				? this._filterCache.allData.findIndex(it => it.name === selectedClass.name && it.source === selectedClass.source)
				: null;
			this._isClassDisabled = isClassDisabled;
			this._isSubclassDisabled = isSubclassDisabled;
			this._filterCache.list.items.forEach(li => {
				const isScLi = li.data.ixSubclass != null;
				if (isScLi) {
					li.data.tglSel.classList.toggle("disabled", this._isSubclassDisabled || (this._isClassDisabled && li.data.ixClass !== this._ixPrevSelectedClass));
				} else {
					li.data.tglSel.classList.toggle("disabled", this._isClassDisabled);
				}
			});

			if (selectedClass != null) {
				// region Restore selection
				const ixSubclass = ~this._ixPrevSelectedClass && selectedSubclass != null ? this._filterCache.allData[this._ixPrevSelectedClass].subclasses.findIndex(it => it.name === selectedSubclass.name && it.source === selectedSubclass.source) : -1;

				if (~this._ixPrevSelectedClass) {
					ModalFilterClasses._doListDeselectAll(this._filterCache.list);

					const clsItem = this._filterCache.list.items.find(it => it.data.ixClass === this._ixPrevSelectedClass && it.data.ixSubclass == null);
					if (clsItem) {
						clsItem.data.tglSel.classList.add("active");
						clsItem.ele.classList.add("list-multi-selected");
					}

					if (~ixSubclass && clsItem) {
						const scItem = this._filterCache.list.items.find(it => it.data.ixClass === this._ixPrevSelectedClass && it.data.ixSubclass === ixSubclass);
						scItem.data.tglSel.classList.add("active");
						scItem.ele.classList.add("list-multi-selected");
					}
				}
				// endregion

				// region Hide unwanted classes
				this._filterCache.list.setFnSearch((li, searchTerm) => {
					if (li.data.ixClass !== this._ixPrevSelectedClass) return false;
					return List.isVisibleDefaultSearch(li, searchTerm);
				});
				// endregion
			} else {
				this._filterCache.list.setFnSearch(null);
			}

			// Handle changes to `fnSearch`
			this._filterCache.list.update();

			await UiUtil.pDoForceFocus(this._filterCache.$iptSearch[0]);
		});
	}

	async pPreloadHidden ($modalInner) {
		// If we're rendering in "hidden" mode, create a dummy element to attach the UI to.
		$modalInner = $modalInner || $(`<div></div>`);

		if (this._filterCache) {
			this._filterCache.$wrpModalInner.appendTo($modalInner);
			return;
		}

		await this._pInit();

		const $ovlLoading = $(`<div class="w-100 h-100 ve-flex-vh-center"><i class="dnd-font ve-muted">Loading...</i></div>`).appendTo($modalInner);

		const $iptSearch = $(`<input class="form-control h-100" type="search" placeholder="Search...">`);
		const $btnReset = $(`<button class="ve-btn ve-btn-default">Reset</button>`);
		const $wrpFormTop = $$`<div class="ve-flex input-group ve-btn-group w-100 lst__form-top">${$iptSearch}${$btnReset}</div>`;

		const $wrpFormBottom = $(`<div class="w-100"></div>`);

		const $wrpFormHeaders = $(`<div class="input-group input-group--bottom ve-flex no-shrink">
			<div class="ve-btn ve-btn-default disabled ve-col-1 pl-0"></div>
			<button class="ve-col-9 sort ve-btn ve-btn-default ve-btn-xs" data-sort="name">Name</button>
			<button class="ve-col-2 pr-0 sort ve-btn ve-btn-default ve-btn-xs ve-grow" data-sort="source">Source</button>
		</div>`);

		const $wrpForm = $$`<div class="ve-flex-col w-100 mb-2">${$wrpFormTop}${$wrpFormBottom}${$wrpFormHeaders}</div>`;
		const $wrpList = this._$getWrpList();

		const $btnConfirm = $(`<button class="ve-btn ve-btn-default">Confirm</button>`);

		this._list = new List({
			$iptSearch,
			$wrpList,
			fnSort: this._fnSort,
		});

		SortUtil.initBtnSortHandlers($wrpFormHeaders, this._list);

		this._allData ||= await this._pLoadAllData();

		await this._pageFilter.pInitFilterBox({
			$wrpFormTop,
			$btnReset,
			$wrpMiniPills: $wrpFormBottom,
			namespace: this._namespace,
		});

		this._allData.forEach((it, i) => {
			this._pageFilter.mutateAndAddToFilters(it);
			const filterListItems = this._getListItems(this._pageFilter, it, i);
			filterListItems.forEach(li => {
				this._list.addItem(li);
				li.ele.addEventListener("click", evt => {
					const isScLi = li.data.ixSubclass != null;

					if (isScLi) {
						if (this._isSubclassDisabled) return;
						if (this._isClassDisabled && li.data.ixClass !== this._ixPrevSelectedClass) return;
					} else {
						if (this._isClassDisabled) return;
					}

					this._handleSelectClick({
						filterListItems,
						filterListItem: li,
						evt,
					});
				});
			});
		});

		this._list.init();
		this._list.update();

		this._pageFilter.trimState();

		this._pageFilter.filterBox.on(FILTER_BOX_EVNT_VALCHANGE, this._handleFilterChange.bind(this));
		this._pageFilter.filterBox.render();
		this._handleFilterChange();

		$ovlLoading.remove();

		const $wrpModalInner = $$`<div class="ve-flex-col h-100">
			${$wrpForm}
			${$wrpList}
			<div class="ve-flex-vh-center">${$btnConfirm}</div>
		</div>`.appendTo($modalInner);

		this._filterCache = {$wrpModalInner, $btnConfirm, pageFilter: this._pageFilter, list: this._list, allData: this._allData, $iptSearch};
	}

	// (Exposed for Plutonium use)
	static handleFilterChange ({pageFilter, list, allData}) {
		const f = pageFilter.filterBox.getValues();

		list.filter(li => {
			const cls = allData[li.data.ixClass];

			if (li.data.ixSubclass != null) {
				const sc = cls.subclasses[li.data.ixSubclass];
				// Both the subclass and the class must be displayed
				if (
					!pageFilter.toDisplay(f, cls)
				) return false;

				return pageFilter.filterBox.toDisplayByFilters(
					f,
					{
						filter: pageFilter._sourceFilter,
						value: sc.source,
					},
					{
						filter: pageFilter._miscFilter,
						value: sc._fMisc,
					},
				);
			}

			return pageFilter.toDisplay(f, cls);
		});
	}

	_handleFilterChange () {
		return this.constructor.handleFilterChange({pageFilter: this._pageFilter, list: this._list, allData: this._allData});
	}

	static _doListDeselectAll (list, {isSubclassItemsOnly = false} = {}) {
		list.items.forEach(it => {
			if (isSubclassItemsOnly && it.data.ixSubclass == null) return;

			if (it.data.tglSel) it.data.tglSel.classList.remove("active");
			it.ele.classList.remove("list-multi-selected");
		});
	}

	_handleSelectClick ({filterListItems, filterListItem, evt}) {
		evt.preventDefault();
		evt.stopPropagation();

		const isScLi = filterListItem.data.ixSubclass != null;

		// When only allowing subclass to be changed, avoid de-selecting the entire list
		if (this._isClassDisabled && this._ixPrevSelectedClass != null && isScLi) {
			if (!filterListItem.data.tglSel.classList.contains("active")) this.constructor._doListDeselectAll(this._list, {isSubclassItemsOnly: true});
			filterListItem.data.tglSel.classList.toggle("active");
			filterListItem.ele.classList.toggle("list-multi-selected");
			return;
		}

		// region De-selecting the currently-selected item
		if (filterListItem.data.tglSel.classList.contains("active")) {
			this.constructor._doListDeselectAll(this._list);
			return;
		}
		// endregion

		// region Selecting an item
		this.constructor._doListDeselectAll(this._list);

		if (isScLi) {
			const classItem = filterListItems[0];
			classItem.data.tglSel.classList.add("active");
			classItem.ele.classList.add("list-multi-selected");
		}

		filterListItem.data.tglSel.classList.add("active");
		filterListItem.ele.classList.add("list-multi-selected");
		// endregion
	}

	/** Caches the result for fast re-querying. */
	async _pLoadAllData () {
		this._pLoadingAllData = this._pLoadingAllData || (async () => {
			const data = MiscUtil.copyFast(await DataUtil.class.loadRawJSON());
			const propsCopied = new Set(Object.keys(data));

			const [prerelease, brew] = await Promise.all([
				PrereleaseUtil.pGetBrewProcessed(),
				BrewUtil2.pGetBrewProcessed(),
			]);

			// Combine main data with prerelease/brew
			this._pLoadAllData_mutAddPrereleaseBrew({data, brew: prerelease, brewUtil: PrereleaseUtil});
			this._pLoadAllData_mutAddPrereleaseBrew({data, brew: brew, brewUtil: BrewUtil2});

			this._allData = (await this.constructor.pPostLoad(data, {propsCopied})).class;
		})();

		await this._pLoadingAllData;
		return this._allData;
	}

	_pLoadAllData_mutAddPrereleaseBrew ({data, brew, brewUtil}) {
		const clsProps = brewUtil.getPageProps({page: UrlUtil.PG_CLASSES});

		if (!clsProps.includes("*")) {
			clsProps.forEach(prop => data[prop] = [...(data[prop] || []), ...MiscUtil.copyFast(brew[prop] || [])]);
			return;
		}

		Object.entries(brew)
			.filter(([, brewVal]) => brewVal instanceof Array)
			.forEach(([prop, brewArr]) => data[prop] = [...(data[prop] || []), ...MiscUtil.copyFast(brewArr)]);
	}

	/* -------------------------------------------- */

	static async _pGetParentClass (sc) {
		// Search in base classes
		let baseClass = (await DataUtil.class.loadRawJSON()).class.find(bc => bc.name.toLowerCase() === sc.className.toLowerCase() && (bc.source.toLowerCase() || Parser.SRC_PHB) === sc.classSource.toLowerCase());

		// Search in brew classes
		baseClass = baseClass || await this._pGetParentClass_pPrerelease({sc});
		baseClass = baseClass || await this._pGetParentClass_pBrew({sc});

		return baseClass;
	}

	static async _pGetParentClass_pPrerelease ({sc}) {
		return this._pGetParentClass_pPrereleaseBrew({sc, brewUtil: PrereleaseUtil});
	}

	static async _pGetParentClass_pBrew ({sc}) {
		return this._pGetParentClass_pPrereleaseBrew({sc, brewUtil: BrewUtil2});
	}

	static async _pGetParentClass_pPrereleaseBrew ({sc, brewUtil}) {
		const brew = await brewUtil.pGetBrewProcessed();
		return (brew.class || [])
			.find(bc => bc.name.toLowerCase() === sc.className.toLowerCase() && (bc.source.toLowerCase() || Parser.SRC_PHB) === sc.classSource.toLowerCase());
	}

	static async pPostLoad (data, {...opts} = {}) {
		// region Copy data
		data = {...data};

		const {propsCopied} = opts;

		data.class ||= [];
		if (!propsCopied || !propsCopied.has("class")) data.class = MiscUtil.copyFast(data.class);
		if (propsCopied) propsCopied.add("class");

		data.subclass ||= [];
		if (!propsCopied || !propsCopied.has("subclass")) data.subclass = MiscUtil.copyFast(data.subclass);
		if (propsCopied) propsCopied.add("subclass");
		// endregion

		// Ensure prerelease/homebrew is initialised
		await PrereleaseUtil.pGetBrewProcessed();
		await BrewUtil2.pGetBrewProcessed();

		// Attach subclasses to parent classes
		if (data.subclass) {
			// Do this sequentially, to avoid double-adding the same base classes
			for (const sc of data.subclass) {
				if (!sc.className) continue; // Subclass class name is required
				sc.classSource = sc.classSource || Parser.SRC_PHB;

				const entFaux = {
					name: sc.className.toLowerCase(),
					source: sc.classSource.toLowerCase(),
				};

				// Avoid finding/creating parent class if it would be excluded
				if (
					ExcludeUtil.isExcluded(
						UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](entFaux),
						"class",
						SourceUtil.getEntitySource(entFaux),
						{isNoCount: true},
					)
				) continue;

				let cls = data.class.find(it => (it.name || "").toLowerCase() === entFaux.name && (it.source || Parser.SRC_PHB).toLowerCase() === entFaux.source);

				if (!cls) {
					cls = await this._pGetParentClass(sc);
					if (cls) {
						// If a base class exists, make a stripped-down copy and override its subclasses with our own
						cls = MiscUtil.copyFast(cls);
						cls.subclasses = [];
						data.class.push(cls);
					} else {
						// Fall back on pushing a dummy class to the array, and we can handle its lack of content elsewhere
						cls = {name: sc.className, source: sc.classSource};
						data.class.push(cls);
					}
				}

				(cls.subclasses = cls.subclasses || []).push(sc);
			}

			delete data.subclass;
		}

		// Clean and initialise fields; sort arrays
		data.class.forEach(cls => {
			cls.source = cls.source || Parser.SRC_PHB;

			cls.subclasses = cls.subclasses || [];

			cls.subclasses.forEach(sc => {
				sc.name = sc.name || "(Unnamed subclass)";
				sc.source = sc.source || cls.source;
				sc.className = sc.className || cls.name;
				sc.classSource = sc.classSource || cls.source || Parser.SRC_PHB;
			});

			cls.subclasses.sort((a, b) => SortUtil.ascSortLower(a.name, b.name) || SortUtil.ascSortLower(a.source || cls.source, b.source || cls.source));

			cls._cntStartingSkillChoices = (MiscUtil.get(cls, "startingProficiencies", "skills") || [])
				.map(it => it.choose ? (it.choose.count || 1) : 0)
				.reduce((a, b) => a + b, 0);

			cls._cntStartingSkillChoicesMutliclass = (MiscUtil.get(cls, "multiclassing", "proficienciesGained", "skills") || [])
				.map(it => it.choose ? (it.choose.count || 1) : 0)
				.reduce((a, b) => a + b, 0);
		});
		data.class.sort((a, b) => SortUtil.ascSortLower(a.name, b.name) || SortUtil.ascSortLower(a.source, b.source));

		// Expand class/subclass feature references to "object" form
		data.class.forEach(cls => {
			cls.classFeatures = (cls.classFeatures || []).map(cf => typeof cf === "string" ? {classFeature: cf} : cf);

			(cls.subclasses || []).forEach(sc => {
				sc.subclassFeatures = (sc.subclassFeatures || []).map(cf => typeof cf === "string" ? {subclassFeature: cf} : cf);
			});
		});

		return data;
	}

	/* -------------------------------------------- */

	_getListItems (pageFilter, cls, clsI) {
		return [
			this._getListItems_getClassItem(pageFilter, cls, clsI),
			...cls.subclasses.map((sc, scI) => this._getListItems_getSubclassItem(pageFilter, cls, clsI, sc, scI)),
		];
	}

	_getListItems_getClassItem (pageFilter, cls, clsI) {
		const eleLabel = document.createElement("label");
		eleLabel.className = `w-100 ve-flex lst__row-border veapp__list-row no-select lst__wrp-cells`;

		const source = Parser.sourceJsonToAbv(cls.source);

		eleLabel.innerHTML = `<div class="ve-col-1 pl-0 ve-flex-vh-center"><div class="fltr-cls__tgl"></div></div>
		<div class="bold ve-col-9 ${cls._versionBase_isVersion ? "italic" : ""}">${cls._versionBase_isVersion ? `<span class="px-3"></span>` : ""}${cls.name}</div>
		<div class="ve-col-2 pr-0 ve-flex-h-center ${Parser.sourceJsonToSourceClassname(cls.source)}" title="${Parser.sourceJsonToFull(cls.source)}" ${Parser.sourceJsonToStyle(cls.source)}>${source}${Parser.sourceJsonToMarkerHtml(cls.source)}</div>`;

		return new ListItem(
			clsI,
			eleLabel,
			`${cls.name} -- ${cls.source}`,
			{
				source: `${source} -- ${cls.name}`,
				page: cls.page,
			},
			{
				ixClass: clsI,
				tglSel: eleLabel.firstElementChild.firstElementChild,
			},
		);
	}

	_getListItems_getSubclassItem (pageFilter, cls, clsI, sc, scI) {
		const eleLabel = document.createElement("label");
		eleLabel.className = `w-100 ve-flex lst__row-border veapp__list-row no-select lst__wrp-cells`;

		const source = Parser.sourceJsonToAbv(sc.source);

		eleLabel.innerHTML = `<div class="ve-col-1 pl-0 ve-flex-vh-center"><div class="fltr-cls__tgl"></div></div>
		<div class="ve-col-9 pl-1 ve-flex-v-center ${sc._versionBase_isVersion ? "italic" : ""}">${sc._versionBase_isVersion ? `<span class="px-3"></span>` : ""}<span class="mx-3">\u2014</span> ${sc.name}</div>
		<div class="ve-col-2 pr-0 ve-flex-h-center ${Parser.sourceJsonToSourceClassname(sc.source)}" title="${Parser.sourceJsonToFull(sc.source)}" ${Parser.sourceJsonToStyle(sc.source)}>${source}${Parser.sourceJsonToMarkerHtml(sc.source)}</div>`;

		return new ListItem(
			`${clsI}--${scI}`,
			eleLabel,
			`${cls.name} -- ${cls.source} -- ${sc.name} -- ${sc.source}`,
			{
				source: `${cls.source} -- ${cls.name} -- ${source} -- ${sc.name}`,
				page: sc.page,
			},
			{
				ixClass: clsI,
				ixSubclass: scI,
				tglSel: eleLabel.firstElementChild.firstElementChild,
			},
		);
	}
}

globalThis.ModalFilterClasses = ModalFilterClasses;
