import {EVNT_VALCHANGE, SOURCE_HEADER, SUB_HASH_PREFIX_LENGTH, TITLE_BTN_RESET} from "./filter-constants.js";
import {FilterRegistry} from "./filter-registry.js";
import {FilterSnapshotManager} from "./snapshot/filter-snapshot-manager.js";

export class FilterBox extends ProxyBase {
	static selectFirstVisible (entryList) {
		if (Hist.lastLoadedId == null && !Hist.initialLoad) {
			Hist._freshLoad();
		}

		// This version deemed too annoying to be of practical use
		//  Instead of always loading the URL, this would switch to the first visible item that matches the filter
		/*
		if (Hist.lastLoadedId && !Hist.initialLoad) {
			const last = entryList[Hist.lastLoadedId];
			const lastHash = UrlUtil.autoEncodeHash(last);
			const link = $("#listcontainer").find(`.list a[href="#${lastHash.toLowerCase()}"]`);
			if (!link.length) Hist._freshLoad();
		} else if (Hist.lastLoadedId == null && !Hist.initialLoad) {
			Hist._freshLoad();
		}
		*/
	}

	/**
	 * @param opts Options object.
	 * @param [opts.$wrpFormTop] Form input group.
	 * @param [opts.wrpFormTop] Form input group.
	 * @param opts.$btnReset Form reset button.
	 * @param opts.btnReset Form reset button.
	 * @param [opts.$btnOpen] A custom button to use to open the filter overlay.
	 * @param [opts.btnOpen] A custom button to use to open the filter overlay.
	 * @param [opts.$iptSearch] Search input associated with the "form" this filter is a part of. Only used for passing
	 * through search terms in @filter tags.
	 * @param [opts.iptSearch] Search input associated with the "form" this filter is a part of. Only used for passing
	 * through search terms in @filter tags.
	 * @param [opts.$wrpMiniPills] Element to house mini pills.
	 * @param [opts.wrpMiniPills] Element to house mini pills.
	 * @param [opts.$btnToggleSummaryHidden] Button which toggles the filter summary.
	 * @param [opts.btnToggleSummaryHidden] Button which toggles the filter summary.
	 * @param opts.filters Array of filters to be included in this box.
	 * @param [opts.isCompact] True if this box should have a compact/reduced UI.
	 * @param [opts.namespace] Namespace for this filter, to prevent collisions with other filters on the same page.
	 * @param [opts.namespaceSnapshots] Namespace for filters of this type.
	 */
	constructor (opts) {
		super();

		// region TODO(jQuery) migrate
		if (opts.$wrpFormTop && opts.wrpFormTop) throw new Error(`Only one of "$wrpFormTop" and "wrpFormTop" may be specified!`);
		if (opts.$btnReset && opts.btnReset) throw new Error(`Only one of "$btnReset" and "btnReset" may be specified!`);
		if (opts.$btnOpen && opts.btnOpen) throw new Error(`Only one of "$btnOpen" and "btnOpen" may be specified!`);
		if (opts.$iptSearch && opts.iptSearch) throw new Error(`Only one of "$iptSearch" and "iptSearch" may be specified!`);
		if (opts.$wrpMiniPills && opts.wrpMiniPills) throw new Error(`Only one of "$wrpMiniPills" and "wrpMiniPills" may be specified!`);
		if (opts.$btnToggleSummaryHidden && opts.btnToggleSummaryHidden) throw new Error(`Only one of "$btnToggleSummaryHidden" and "btnToggleSummaryHidden" may be specified!`);

		if (!opts.$wrpFormTop && opts.wrpFormTop) opts.$wrpFormTop = $(opts.wrpFormTop);
		if (!opts.$btnReset && opts.btnReset) opts.$btnReset = $(opts.btnReset);
		if (!opts.$btnOpen && opts.btnOpen) opts.$btnOpen = $(opts.btnOpen);
		if (!opts.$iptSearch && opts.iptSearch) opts.$iptSearch = $(opts.iptSearch);
		if (!opts.$wrpMiniPills && opts.wrpMiniPills) opts.$wrpMiniPills = $(opts.wrpMiniPills);
		if (!opts.$btnToggleSummaryHidden && opts.btnToggleSummaryHidden) opts.$btnToggleSummaryHidden = $(opts.btnToggleSummaryHidden);
		// endregion

		this._$iptSearch = opts.$iptSearch;
		this._$wrpFormTop = opts.$wrpFormTop;
		this._$btnReset = opts.$btnReset;
		this._$btnOpen = opts.$btnOpen;
		this._$wrpMiniPills = opts.$wrpMiniPills;
		this._$btnToggleSummaryHidden = opts.$btnToggleSummaryHidden;
		this._filters = opts.filters;
		this._isCompact = opts.isCompact;
		this._namespace = opts.namespace;

		this._doSaveStateThrottled = MiscUtil.throttle(() => this._pDoSaveState(), 50);
		this.__meta = this._getDefaultMeta();
		if (this._isCompact) this.__meta.isSummaryHidden = true;

		this._meta = this._getProxy("meta", this.__meta);
		this.__minisHidden = {};
		this._minisHidden = this._getProxy("minisHidden", this.__minisHidden);
		this.__combineAs = {};
		this._combineAs = this._getProxy("combineAs", this.__combineAs);
		this._modalMeta = null;
		this._isRendered = false;

		this._cachedState = null;

		this._compSearch = BaseComponent.fromObject({search: ""});
		this._metaIptSearch = null;

		this._filters.forEach(filter => filter.filterBox = this);

		this._snapshotManager = new FilterSnapshotManager({
			namespaceSnapshots: opts.namespaceSnapshots,
			filterBox: this,
			filters: this._filters,
		});
		this._filters.forEach(filter => filter.snapshotManager = this._snapshotManager);

		this._eventListeners = {};
	}

	get filters () { return this._filters; }

	teardown () {
		this._filters.forEach(f => f.doTeardown());
		if (this._modalMeta) this._modalMeta.doTeardown();
	}

	// region Event listeners
	on (identifier, fn) {
		const [eventName, namespace] = identifier.split(".");
		(this._eventListeners[eventName] = this._eventListeners[eventName] || []).push({namespace, fn});
		return this;
	}

	off (identifier, fn = null) {
		const [eventName, namespace] = identifier.split(".");
		this._eventListeners[eventName] = (this._eventListeners[eventName] || []).filter(it => {
			if (fn != null) return it.namespace !== namespace || it.fn !== fn;
			return it.namespace !== namespace;
		});
		if (!this._eventListeners[eventName].length) delete this._eventListeners[eventName];
		return this;
	}

	fireChangeEvent () {
		this._doSaveStateThrottled();
		this.fireEvent(EVNT_VALCHANGE);
	}

	fireEvent (eventName) {
		(this._eventListeners[eventName] || []).forEach(it => it.fn());
	}
	// endregion

	_getNamespacedStorageKey () { return `${FilterBox._STORAGE_KEY}${this._namespace ? `.${this._namespace}` : ""}`; }
	getNamespacedHashKey (k) { return `${k || "_".repeat(SUB_HASH_PREFIX_LENGTH)}${this._namespace ? `.${this._namespace}` : ""}`; }

	async pGetStoredActiveSources () {
		const stored = await StorageUtil.pGetForPage(this._getNamespacedStorageKey());
		if (stored) {
			const sourceFilterData = stored.filters[SOURCE_HEADER];
			if (sourceFilterData) {
				const state = sourceFilterData.state;
				const blue = [];
				const white = [];
				Object.entries(state).forEach(([src, mode]) => {
					if (mode === 1) blue.push(src);
					else if (mode !== -1) white.push(src);
				});
				if (blue.length) return blue; // if some are selected, we load those
				else return white; // otherwise, we load non-red
			}
		}
		return null;
	}

	registerMinisHiddenHook (prop, hook) {
		this._addHook("minisHidden", prop, hook);
	}

	isMinisHidden (header) {
		return !!this._minisHidden[header];
	}

	async pDoLoadState () {
		await this._pDoLoadState_filterBox();
		await this._snapshotManager.pDoLoadState();
	}

	async _pDoLoadState_filterBox () {
		const toLoad = await StorageUtil.pGetForPage(this._getNamespacedStorageKey());
		if (toLoad == null) return;
		this._setStateFromLoaded(toLoad, {isUserSavedState: true});
	}

	_setStateFromLoaded (state, {isUserSavedState = false} = {}) {
		state.box = state.box || {};
		this._proxyAssign("meta", "_meta", "__meta", state.box.meta || {}, true);
		this._proxyAssign("minisHidden", "_minisHidden", "__minisHidden", state.box.minisHidden || {}, true);
		this._proxyAssign("combineAs", "_combineAs", "__combineAs", state.box.combineAs || {}, true);
		this._filters.forEach(it => it.setStateFromLoaded(state.filters, {isUserSavedState}));
	}

	_getSaveableState () {
		const filterOut = {};
		this._filters.forEach(it => Object.assign(filterOut, it.getSaveableState()));
		return {
			box: {
				meta: {...this.__meta},
				minisHidden: {...this.__minisHidden},
				combineAs: {...this.__combineAs},
			},
			filters: filterOut,
		};
	}

	async _pDoSaveState () {
		await StorageUtil.pSetForPage(this._getNamespacedStorageKey(), this._getSaveableState());
	}

	trimState_ () {
		this._filters.forEach(f => f.trimState_());
	}

	render () {
		if (this._isRendered) {
			// already rendered previously; simply update the filters
			this._filters.map(f => f.update());
			return;
		}
		this._isRendered = true;

		if (this._$wrpFormTop || this._$wrpMiniPills) {
			if (!this._$wrpMiniPills) {
				this._$wrpMiniPills = $(`<div class="fltr__mini-view ve-btn-group"></div>`).insertAfter(this._$wrpFormTop);
			} else {
				this._$wrpMiniPills.addClass("fltr__mini-view");
			}
		}

		if (this._$btnReset) {
			this._$btnReset
				.title(TITLE_BTN_RESET)
				.click((evt) => this.reset(evt.shiftKey));
		}

		if (this._$wrpFormTop || this._$btnToggleSummaryHidden) {
			if (!this._$btnToggleSummaryHidden) {
				this._$btnToggleSummaryHidden = $(`<button class="ve-btn ve-btn-default ${this._isCompact ? "p-2" : ""}" title="Toggle Filter Summary"><span class="glyphicon glyphicon-resize-small"></span></button>`)
					.prependTo(this._$wrpFormTop);
			} else if (!this._$btnToggleSummaryHidden.parent().length) {
				this._$btnToggleSummaryHidden.prependTo(this._$wrpFormTop);
			}
			this._$btnToggleSummaryHidden
				.click(() => {
					this._meta.isSummaryHidden = !this._meta.isSummaryHidden;
					this._doSaveStateThrottled();
				});
			const summaryHiddenHook = () => {
				this._$btnToggleSummaryHidden.toggleClass("active", !!this._meta.isSummaryHidden);
				this._$wrpMiniPills.toggleClass("ve-hidden", !!this._meta.isSummaryHidden);
			};
			this._addHook("meta", "isSummaryHidden", summaryHiddenHook);
			summaryHiddenHook();
		}

		if (this._$wrpFormTop || this._$btnOpen) {
			if (!this._$btnOpen) {
				this._$btnOpen = $(`<button class="ve-btn ve-btn-default ${this._isCompact ? "px-2" : ""}">Filter</button>`)
					.prependTo(this._$wrpFormTop);
			} else if (!this._$btnOpen.parent().length) {
				this._$btnOpen.prependTo(this._$wrpFormTop);
			}
			this._$btnOpen.click(() => this.show());
		}

		const sourceFilter = this._filters.find(it => it.header === SOURCE_HEADER);
		if (sourceFilter) {
			const hkSelFn = () => {
				const {isPrereleaseDefaultHidden, isBrewDefaultHidden} = this._meta;
				if (isPrereleaseDefaultHidden || isBrewDefaultHidden) {
					const selFnAlt = (val) => {
						return PageFilterBase.defaultSourceSelFnStandardPartnered(val)
							|| (SourceUtil.getFilterGroup(val) === SourceUtil.FILTER_GROUP_PRERELEASE && !isPrereleaseDefaultHidden)
							|| (SourceUtil.getFilterGroup(val) === SourceUtil.FILTER_GROUP_HOMEBREW && !isBrewDefaultHidden);
					};
					sourceFilter.setTempFnSel(selFnAlt);
				} else sourceFilter.setTempFnSel(null);

				sourceFilter.updateMiniPillClasses();
			};
			this._addHook("meta", "isPrereleaseDefaultHidden", hkSelFn);
			this._addHook("meta", "isBrewDefaultHidden", hkSelFn);
			hkSelFn();
		}

		if (this._$wrpMiniPills) this._filters.map((f, i) => f.$renderMinis({filterBox: this, isFirst: i === 0, $wrpMini: this._$wrpMiniPills}));
	}

	async _render_pRenderModal () {
		this._isModalRendered = true;

		this._modalMeta = await UiUtil.pGetShowModal({
			isHeight100: true,
			isWidth100: true,
			isUncappedHeight: true,
			isIndestructible: true,
			isClosed: true,
			isEmpty: true,
			title: "Filter", // Not shown due toe `isEmpty`, but useful for external overrides
			cbClose: (isDataEntered) => this._pHandleHide(!isDataEntered),
		});

		const $children = this._filters.map((filter, i) => filter.$render({filterBox: this, isFirst: i === 0, $wrpMini: this._$wrpMiniPills}));

		this._metaIptSearch = ComponentUiUtil.$getIptStr(
			this._compSearch, "search",
			{decorationRight: "clear", asMeta: true, html: `<input class="form-control input-xs" placeholder="Search...">`},
		);
		this._compSearch._addHookBase("search", () => {
			const searchTerm = this._compSearch._state.search.toLowerCase();
			this._filters.forEach(f => f.handleSearch(searchTerm));
		});

		const $btnShowAllFilters = $(`<button class="ve-btn ve-btn-xs ve-btn-default">Show All</button>`)
			.click(() => this.showAllFilters());
		const $btnHideAllFilters = $(`<button class="ve-btn ve-btn-xs ve-btn-default">Hide All</button>`)
			.click(() => this.hideAllFilters());

		const $btnReset = $(`<button class="ve-btn ve-btn-xs ve-btn-default mr-3" title="${TITLE_BTN_RESET}">Reset</button>`)
			.click(evt => this.reset(evt.shiftKey));

		const btnSnapshotManager = this._snapshotManager.getBtn();

		const $btnSettings = $(`<button class="ve-btn ve-btn-xs ve-btn-default" title="Settings"><span class="glyphicon glyphicon-cog"></span></button>`)
			.click(() => this._pOpenSettingsModal());

		const $btnSaveAlt = $(`<button class="ve-btn ve-btn-xs ve-btn-primary" title="Save"><span class="glyphicon glyphicon-ok"></span></button>`)
			.click(() => this._modalMeta.doClose(true));

		const $wrpBtnCombineFilters = $(`<div class="ve-btn-group mr-3"></div>`);
		const $btnCombineFilterSettings = $(`<button class="ve-btn ve-btn-xs ve-btn-default"><span class="glyphicon glyphicon-cog"></span></button>`)
			.click(() => this._pOpenCombineAsModal());

		const btnCombineFiltersAs = e_({
			tag: "button",
			clazz: `ve-btn ve-btn-xs ve-btn-default`,
			click: () => this._meta.modeCombineFilters = FilterBox._COMBINE_MODES.getNext(this._meta.modeCombineFilters),
			title: `"AND" requires every filter to match. "OR" requires any filter to match. "Custom" allows you to specify a combination (every "AND" filter must match; only one "OR" filter must match) .`,
		}).appendTo($wrpBtnCombineFilters[0]);

		const hook = () => {
			btnCombineFiltersAs.innerText = this._meta.modeCombineFilters === "custom" ? this._meta.modeCombineFilters.uppercaseFirst() : this._meta.modeCombineFilters.toUpperCase();
			if (this._meta.modeCombineFilters === "custom") $wrpBtnCombineFilters.append($btnCombineFilterSettings);
			else $btnCombineFilterSettings.detach();
			this._doSaveStateThrottled();
		};
		this._addHook("meta", "modeCombineFilters", hook);
		hook();

		const $btnSave = $(`<button class="ve-btn ve-btn-primary fltr__btn-close mr-2">Save</button>`)
			.click(() => this._modalMeta.doClose(true));

		const $btnCancel = $(`<button class="ve-btn ve-btn-default fltr__btn-close">Cancel</button>`)
			.click(() => this._modalMeta.doClose(false));

		$$(this._modalMeta.$modal)`<div class="split mb-2 mt-2 ve-flex-v-center mobile-sm__ve-flex-col">
			<div class="ve-flex-v-baseline mobile-sm__ve-flex-col">
				<h4 class="m-0 mr-2 mobile-sm__mb-2">Filters</h4>
				${this._metaIptSearch.$wrp.addClass("mobile-sm__mb-2")}
			</div>
			<div class="ve-flex-v-center mobile-sm__ve-flex-col">
				<div class="ve-flex-v-center mobile-sm__m-1">
					<div class="mr-2">Combine as</div>
					${$wrpBtnCombineFilters}
				</div>
				<div class="ve-flex-v-center mobile-sm__m-1">
					<div class="ve-btn-group mr-2 ve-flex-h-center">
						${$btnShowAllFilters}
						${$btnHideAllFilters}
					</div>
					${$btnReset}
					<div class="ve-btn-group mr-3 ve-flex-h-center">
						${btnSnapshotManager}
						${$btnSettings}
					</div>
					${$btnSaveAlt}
				</div>
			</div>
		</div>
		<hr class="w-100 m-0 mb-2">

		<div class="ui-modal__scroller smooth-scroll px-1">
			${$children}
		</div>
		<hr class="my-1 w-100">
		<div class="w-100 ve-flex-vh-center my-1">${$btnSave}${$btnCancel}</div>`;
	}

	async _pOpenSettingsModal () {
		const {$modalInner} = await UiUtil.pGetShowModal({title: "Settings"});

		UiUtil.$getAddModalRowCb($modalInner, "Deselect Prerelease Content Sources by Default", this._meta, "isPrereleaseDefaultHidden");
		UiUtil.$getAddModalRowCb($modalInner, "Deselect Homebrew Sources by Default", this._meta, "isBrewDefaultHidden");

		UiUtil.addModalSep($modalInner);

		UiUtil.$getAddModalRowHeader($modalInner, "Hide summary for filter...", {helpText: "The summary is the small red and blue button panel which appear below the search bar."});
		this._filters.forEach(f => UiUtil.$getAddModalRowCb($modalInner, f.header, this._minisHidden, f.header));

		UiUtil.addModalSep($modalInner);

		const $rowResetAlwaysSave = UiUtil.$getAddModalRow($modalInner, "div").addClass("pr-2");
		$rowResetAlwaysSave.append(`<span>Always Save on Close</span>`);
		$(`<button class="ve-btn ve-btn-xs ve-btn-default">Reset</button>`)
			.appendTo($rowResetAlwaysSave)
			.click(async () => {
				await StorageUtil.pRemove(FilterBox._STORAGE_KEY_ALWAYS_SAVE_UNCHANGED);
				JqueryUtil.doToast("Saved!");
			});
	}

	async _pOpenCombineAsModal () {
		const {$modalInner} = await UiUtil.pGetShowModal({title: "Filter Combination Logic"});
		const $btnReset = $(`<button class="ve-btn ve-btn-xs ve-btn-default">Reset</button>`)
			.click(() => {
				Object.keys(this._combineAs).forEach(k => this._combineAs[k] = "and");
				$sels.forEach($sel => $sel.val("0"));
			});
		UiUtil.$getAddModalRowHeader($modalInner, "Combine filters as...", {$eleRhs: $btnReset});
		const $sels = this._filters.map(f => UiUtil.$getAddModalRowSel($modalInner, f.header, this._combineAs, f.header, ["and", "or"], {fnDisplay: (it) => it.toUpperCase()}));
	}

	getValues ({nxtStateOuter = null} = {}) {
		const outObj = {};
		this._filters.forEach(f => Object.assign(outObj, f.getValues({nxtState: nxtStateOuter?.filters})));
		return outObj;
	}

	addEventListener (type, listener) {
		(this._$wrpFormTop ? this._$wrpFormTop[0] : this._$btnOpen[0]).addEventListener(type, listener);
	}

	_mutNextState_reset_meta ({tgt}) {
		Object.assign(tgt, this._getDefaultMeta());
	}

	_mutNextState_minisHidden ({tgt}) {
		Object.assign(tgt, this._getDefaultMinisHidden(tgt));
	}

	_mutNextState_combineAs ({tgt}) {
		Object.assign(tgt, this._getDefaultCombineAs(tgt));
	}

	_reset_getSnapshots () {
		if (!this._snapshotManager.hasActiveSnapshotDeck()) return null;
		return this._snapshotManager.getSnapshots();
	}

	_reset_meta () {
		const nxtBoxState = this._getNextBoxState_base();
		this._mutNextState_reset_meta({tgt: nxtBoxState.meta});
		this._setBoxStateFromNextBoxState(nxtBoxState);
	}

	_reset_minisHidden () {
		const nxtBoxState = this._getNextBoxState_base();
		this._mutNextState_minisHidden({tgt: nxtBoxState.minisHidden});
		this._setBoxStateFromNextBoxState(nxtBoxState);
	}

	_reset_combineAs () {
		const nxtBoxState = this._getNextBoxState_base();
		this._mutNextState_combineAs({tgt: nxtBoxState.combineAs});
		this._setBoxStateFromNextBoxState(nxtBoxState);
	}

	reset ({isResetAll = false, snapshots = null} = {}) {
		snapshots ??= this._reset_getSnapshots();
		this._filters.forEach(filter => filter.reset({isResetAll, snapshots}));
		if (isResetAll) {
			this._reset_meta();
			this._reset_minisHidden();
			this._reset_combineAs();
		}
		this.render();
		this.fireChangeEvent();
	}

	async show () {
		if (!this._isModalRendered) await this._render_pRenderModal();
		this._cachedState = this._getSaveableState();
		this._modalMeta.doOpen();
		if (this._metaIptSearch?.$ipt) this._metaIptSearch.$ipt.focus();
	}

	async _pHandleHide (isCancel = false) {
		if (this._cachedState && isCancel) {
			const curState = this._getSaveableState();
			const hasChanges = !CollectionUtil.deepEquals(curState, this._cachedState);

			if (hasChanges) {
				const isSave = await InputUiUtil.pGetUserBoolean({
					title: "Unsaved Changes",
					textYesRemember: "Always Save",
					textYes: "Save",
					textNo: "Discard",
					storageKey: FilterBox._STORAGE_KEY_ALWAYS_SAVE_UNCHANGED,
					isGlobal: true,
				});
				if (isSave) {
					this._cachedState = null;
					this.fireChangeEvent();
					return;
				} else this._setStateFromLoaded(this._cachedState, {isUserSavedState: true});
			}
		} else {
			this.fireChangeEvent();
		}

		this._cachedState = null;
	}

	showAllFilters () {
		this._filters.forEach(f => f.show());
	}

	hideAllFilters () {
		this._filters.forEach(f => f.hide());
	}

	unpackSubHashes (subHashes, {force = false} = {}) {
		// TODO(unpack) refactor
		const unpacked = {};
		subHashes.forEach(s => {
			const unpackedPart = UrlUtil.unpackSubHash(s, true);
			if (Object.keys(unpackedPart).length > 1) throw new Error(`Multiple keys in subhash!`);
			const k = Object.keys(unpackedPart)[0];
			unpackedPart[k] = {clean: unpackedPart[k], raw: s};
			Object.assign(unpacked, unpackedPart);
		});

		const urlHeaderToFilter = {};
		this._filters.forEach(f => {
			const childFilters = f.getChildFilters();
			if (childFilters.length) childFilters.forEach(f => urlHeaderToFilter[f.header.toLowerCase()] = f);
			urlHeaderToFilter[f.header.toLowerCase()] = f;
		});

		const urlHeadersUpdated = new Set();
		const subHashesConsumed = new Set();
		let filterInitialSearch;
		let isPreserveExisting = false;

		const filterBoxState = {};
		const statePerFilter = {};
		const prefixLen = this.getNamespacedHashKey().length;
		Object.entries(unpacked)
			.forEach(([hashKey, data]) => {
				const rawPrefix = hashKey.substring(0, prefixLen);
				const prefix = rawPrefix.substring(0, SUB_HASH_PREFIX_LENGTH);

				const urlHeader = hashKey.substring(prefixLen);

				if (FilterRegistry.SUB_HASH_PREFIXES.has(prefix) && urlHeaderToFilter[urlHeader]) {
					(statePerFilter[urlHeader] = statePerFilter[urlHeader] || {})[prefix] = data.clean;
					urlHeadersUpdated.add(urlHeader);
					subHashesConsumed.add(data.raw);
					return;
				}

				if (Object.values(FilterBox._SUB_HASH_PREFIXES).includes(prefix)) {
					switch (prefix) {
						case VeCt.FILTER_BOX_SUB_HASH_SEARCH_PREFIX:
							filterInitialSearch = data.clean[0];
							break;
						case VeCt.FILTER_BOX_SUB_HASH_FLAG_IS_PRESERVE_EXISTING:
							isPreserveExisting = true;
							break;
						default:
							filterBoxState[prefix] = data.clean;
					}

					subHashesConsumed.add(data.raw);
					return;
				}

				if (FilterRegistry.SUB_HASH_PREFIXES.has(prefix)) throw new Error(`Could not find filter with header ${urlHeader} for subhash ${data.raw}`);
			});

		if (!subHashesConsumed.size && !force) return null;

		return {
			urlHeaderToFilter,
			filterBoxState,
			statePerFilter,
			urlHeadersUpdated,
			unpacked,
			subHashesConsumed,
			filterInitialSearch,
			isPreserveExisting,
		};
	}

	setFromSubHashes (subHashes, {force = false, $iptSearch = null} = {}) {
		const unpackedSubhashes = this.unpackSubHashes(subHashes, {force});

		if (unpackedSubhashes == null) return subHashes;

		// region Update filter state
		const {box: nxtStateBox, filters: nxtStatesFilters} = this.getNextStateFromSubHashes({unpackedSubhashes});

		this._setBoxStateFromNextBoxState(nxtStateBox);

		this._filters
			.flatMap(f => [
				f,
				...f.getChildFilters(),
			])
			.filter(filter => nxtStatesFilters[filter.header])
			.forEach(filter => filter.setStateFromNextState(nxtStatesFilters));
		// endregion

		const {
			unpacked,
			subHashesConsumed,
			filterInitialSearch,
		} = unpackedSubhashes;

		// region Update search input value
		if (filterInitialSearch && ($iptSearch || this._$iptSearch)) ($iptSearch || this._$iptSearch).val(filterInitialSearch).change().keydown().keyup().trigger("instantKeyup");
		// endregion

		// region Re-assemble and return remaining subhashes
		const [link] = Hist.getHashParts();

		const outSub = [];
		Object.values(unpacked)
			.filter(v => !subHashesConsumed.has(v.raw))
			.forEach(v => outSub.push(v.raw));

		Hist.setSuppressHistory(true);
		Hist.replaceHistoryHash(`${link}${outSub.length ? `${HASH_PART_SEP}${outSub.join(HASH_PART_SEP)}` : ""}`);

		this.fireChangeEvent();
		Hist.hashChange({isBlankFilterLoad: true});
		return outSub;
		// endregion
	}

	getNextStateFromSubHashes ({unpackedSubhashes}) {
		const {
			urlHeaderToFilter,
			filterBoxState,
			statePerFilter,
			urlHeadersUpdated,
			isPreserveExisting,
		} = unpackedSubhashes;

		const nxtStateBox = this._getNextBoxStateFromSubHashes(urlHeaderToFilter, filterBoxState);

		const nxtStateFilters = {};

		Object.entries(statePerFilter)
			.forEach(([urlHeader, state]) => {
				const filter = urlHeaderToFilter[urlHeader];
				Object.assign(nxtStateFilters, filter.getNextStateFromSubhashState(state));
			});

		// reset any other state/meta state/etc
		if (!isPreserveExisting) {
			Object.keys(urlHeaderToFilter)
				.filter(k => !urlHeadersUpdated.has(k))
				.forEach(k => {
					const filter = urlHeaderToFilter[k];
					Object.assign(nxtStateFilters, filter.getNextStateFromSubhashState(null));
				});
		}

		return {box: nxtStateBox, filters: nxtStateFilters};
	}

	_getNextBoxState_base () {
		return {
			meta: MiscUtil.copyFast(this.__meta),
			minisHidden: MiscUtil.copyFast(this.__minisHidden),
			combineAs: MiscUtil.copyFast(this.__combineAs),
		};
	}

	_getNextBoxStateFromSubHashes (urlHeaderToFilter, filterBoxState) {
		const nxtBoxState = this._getNextBoxState_base();

		let hasMeta = false;
		let hasMinisHidden = false;
		let hasCombineAs = false;

		Object.entries(filterBoxState).forEach(([k, vals]) => {
			const mappedK = this.getNamespacedHashKey(Parser._parse_bToA(FilterBox._SUB_HASH_PREFIXES, k));
			switch (mappedK) {
				case "meta": {
					hasMeta = true;
					const data = vals.map(v => UrlUtil.mini.decompress(v));
					Object.keys(this._getDefaultMeta()).forEach((k, i) => nxtBoxState.meta[k] = data[i]);
					break;
				}
				case "minisHidden": {
					hasMinisHidden = true;
					Object.keys(nxtBoxState.minisHidden).forEach(k => nxtBoxState.minisHidden[k] = false);
					vals.forEach(v => {
						const [urlHeader, isHidden] = v.split("=");
						const filter = urlHeaderToFilter[urlHeader];
						if (!filter) throw new Error(`Could not find filter with name "${urlHeader}"`);
						nxtBoxState.minisHidden[filter.header] = !!Number(isHidden);
					});
					break;
				}
				case "combineAs": {
					hasCombineAs = true;
					Object.keys(nxtBoxState.combineAs).forEach(k => nxtBoxState.combineAs[k] = "and");
					vals.forEach(v => {
						const [urlHeader, ixCombineMode] = v.split("=");
						const filter = urlHeaderToFilter[urlHeader];
						if (!filter) throw new Error(`Could not find filter with name "${urlHeader}"`);
						nxtBoxState.combineAs[filter.header] = FilterBox._COMBINE_MODES[ixCombineMode] || FilterBox._COMBINE_MODES[0];
					});
					break;
				}
			}
		});

		if (!hasMeta) this._mutNextState_reset_meta({tgt: nxtBoxState.meta});
		if (!hasMinisHidden) this._mutNextState_minisHidden({tgt: nxtBoxState.minisHidden});
		if (!hasCombineAs) this._mutNextState_combineAs({tgt: nxtBoxState.combineAs});

		return nxtBoxState;
	}

	_setBoxStateFromNextBoxState (nxtBoxState) {
		this._proxyAssignSimple("meta", nxtBoxState.meta, true);
		this._proxyAssignSimple("minisHidden", nxtBoxState.minisHidden, true);
		this._proxyAssignSimple("combineAs", nxtBoxState.combineAs, true);
	}

	/**
	 * @param [opts] Options object.
	 * @param [opts.isAddSearchTerm] If the active search should be added to the subhashes.
	 * @param [opts.isAllowNonExtension] If and alternate "overwrite, don't extend" hash version should be allowed, when shorter.
	 */
	getSubHashes (opts) {
		opts = opts || {};
		const out = [];
		const boxSubHashes = this.getBoxSubHashes();
		if (boxSubHashes) out.push(boxSubHashes);
		out.push(...this._filters.map(f => f.getSubHashes(opts)).filter(Boolean));
		if (opts.isAddSearchTerm && this._$iptSearch) {
			const searchTerm = UrlUtil.encodeForHash(this._$iptSearch.val().trim());
			if (searchTerm) out.push(UrlUtil.packSubHash(this._getSubhashPrefix("search"), [searchTerm]));
		}
		return out.flat();
	}

	getBoxSubHashes () {
		const out = [];

		const defaultMeta = this._getDefaultMeta();

		// serialize base meta in a set order
		const anyNotDefault = Object.keys(defaultMeta).find(k => this._meta[k] !== defaultMeta[k]);
		if (anyNotDefault) {
			const serMeta = Object.keys(defaultMeta).map(k => UrlUtil.mini.compress(this._meta[k] === undefined ? defaultMeta[k] : this._meta[k]));
			out.push(UrlUtil.packSubHash(this._getSubhashPrefix("meta"), serMeta));
		}

		// serialize minisHidden as `key=value` pairs
		const setMinisHidden = Object.entries(this._minisHidden).filter(([k, v]) => !!v).map(([k]) => `${k.toUrlified()}=1`);
		if (setMinisHidden.length) {
			out.push(UrlUtil.packSubHash(this._getSubhashPrefix("minisHidden"), setMinisHidden));
		}

		// serialize combineAs as `key=value` pairs
		const setCombineAs = Object.entries(this._combineAs).filter(([k, v]) => v !== FilterBox._COMBINE_MODES[0]).map(([k, v]) => `${k.toUrlified()}=${FilterBox._COMBINE_MODES.indexOf(v)}`);
		if (setCombineAs.length) {
			out.push(UrlUtil.packSubHash(this._getSubhashPrefix("combineAs"), setCombineAs));
		}

		return out.length ? out : null;
	}

	getFilterTag ({isAddSearchTerm = false} = {}) {
		return `{@filter |${UrlUtil.getCurrentPage().replace(/\.html$/, "")}|${this.getFilterTagExpression({isAddSearchTerm})}}`;
	}

	getFilterTagExpression ({isAddSearchTerm = false} = {}) {
		const parts = this._filters.map(f => f.getFilterTagPart()).filter(Boolean);
		if (isAddSearchTerm && this._$iptSearch) {
			const term = this._$iptSearch.val().trim();
			if (term) parts.push(`search=${term}`);
		}
		return parts.join("|");
	}

	/**
	 * @param {?object} nxtStateOuter
	 * @param {boolean} isIgnoreSnapshot
	 */
	getDisplayState ({nxtStateOuter = null, isIgnoreSnapshot = false} = {}) {
		return this._filters
			.map(filter => filter.getDisplayStatePart({nxtState: nxtStateOuter?.filters, isIgnoreSnapshot}))
			.filter(Boolean)
			.join("; ");
	}

	getSnapshotPreviews (snapshots) {
		return this._filters
			.map(filter => filter.getSnapshotPreviews(snapshots));
	}

	setFromValues (values) {
		this._filters.forEach(it => it.setFromValues(values));
		this.fireChangeEvent();
	}

	toDisplay (boxState, ...entryVals) {
		return this._toDisplay(boxState, this._filters, entryVals);
	}

	/** `filterToValueTuples` should be an array of `{filter: <Filter>, value: <Any>}` objects */
	toDisplayByFilters (boxState, ...filterToValueTuples) {
		return this._toDisplay(
			boxState,
			filterToValueTuples.map(it => it.filter),
			filterToValueTuples.map(it => it.value),
		);
	}

	_toDisplay (boxState, filters, entryVals) {
		switch (this._meta.modeCombineFilters) {
			case "and": return this._toDisplay_isAndDisplay(boxState, filters, entryVals);
			case "or": return this._toDisplay_isOrDisplay(boxState, filters, entryVals);
			case "custom": {
				if (entryVals.length !== filters.length) throw new Error(`Number of filters and number of values did not match!`);

				const andFilters = [];
				const andValues = [];
				const orFilters = [];
				const orValues = [];

				for (let i = 0; i < filters.length; ++i) {
					const f = filters[i];
					if (!this._combineAs[f.header] || this._combineAs[f.header] === "and") { // default to "and" if undefined
						andFilters.push(f);
						andValues.push(entryVals[i]);
					} else {
						orFilters.push(f);
						orValues.push(entryVals[i]);
					}
				}

				return this._toDisplay_isAndDisplay(boxState, andFilters, andValues) && this._toDisplay_isOrDisplay(boxState, orFilters, orValues);
			}
			default: throw new Error(`Unhandled combining mode "${this._meta.modeCombineFilters}"`);
		}
	}

	_toDisplay_isAndDisplay (boxState, filters, vals) {
		return filters
			.map((f, i) => f.toDisplay(boxState, vals[i]))
			.every(it => it);
	}

	_toDisplay_isOrDisplay (boxState, filters, vals) {
		const res = filters.map((f, i) => {
			// filter out "ignored" filter (i.e. all white)
			if (!f.isActive(boxState)) return null;
			return f.toDisplay(boxState, vals[i]);
		}).filter(it => it != null);
		return res.length === 0 || res.find(it => it);
	}

	_getSubhashPrefix (prop) {
		if (FilterBox._SUB_HASH_PREFIXES[prop]) return this.getNamespacedHashKey(FilterBox._SUB_HASH_PREFIXES[prop]);
		throw new Error(`Unknown property "${prop}"`);
	}

	_getDefaultMeta () {
		const out = MiscUtil.copy(FilterBox._DEFAULT_META);
		if (this._isCompact) out.isSummaryHidden = true;
		return out;
	}

	_getDefaultMinisHidden (minisHidden) {
		if (!minisHidden) throw new Error(`Missing "minisHidden" argument!`);
		return Object.keys(minisHidden)
			.mergeMap(k => ({[k]: false}));
	}

	_getDefaultCombineAs (combineAs) {
		if (!combineAs) throw new Error(`Missing "combineAs" argument!`);
		return Object.keys(combineAs)
			.mergeMap(k => ({[k]: "and"}));
	}
}
FilterBox._COMBINE_MODES = ["and", "or", "custom"];
FilterBox._STORAGE_KEY = "filterBoxState";
FilterBox._DEFAULT_META = {
	modeCombineFilters: "and",
	isSummaryHidden: false,
	isPrereleaseDefaultHidden: false,
	isBrewDefaultHidden: false,
};
FilterBox._STORAGE_KEY_ALWAYS_SAVE_UNCHANGED = "filterAlwaysSaveUnchanged";

// These are assumed to be the same length (4 characters)
FilterBox._SUB_HASH_BOX_META_PREFIX = "fbmt";
FilterBox._SUB_HASH_BOX_MINIS_HIDDEN_PREFIX = "fbmh";
FilterBox._SUB_HASH_BOX_COMBINE_AS_PREFIX = "fbca";
FilterBox._SUB_HASH_PREFIXES = {
	meta: FilterBox._SUB_HASH_BOX_META_PREFIX,
	minisHidden: FilterBox._SUB_HASH_BOX_MINIS_HIDDEN_PREFIX,
	combineAs: FilterBox._SUB_HASH_BOX_COMBINE_AS_PREFIX,
	search: VeCt.FILTER_BOX_SUB_HASH_SEARCH_PREFIX,
	flagIsPreserveExisting: VeCt.FILTER_BOX_SUB_HASH_FLAG_IS_PRESERVE_EXISTING,
};

FilterRegistry.registerSubhashes(Object.values(FilterBox._SUB_HASH_PREFIXES));
