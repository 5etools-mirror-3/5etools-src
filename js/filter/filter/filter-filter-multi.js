import {FilterBase} from "./filter-filter-base.js";
import {RangeFilter} from "./filter-filter-range.js";

export class MultiFilter extends FilterBase {
	constructor (opts) {
		super(opts);
		this._filters = opts.filters;
		this._isAddDropdownToggle = !!opts.isAddDropdownToggle;

		Object.assign(
			this.__state,
			{
				...MultiFilter._DETAULT_STATE,
				mode: opts.mode || MultiFilter._DETAULT_STATE.mode,
			},
		);
		this._defaultState = MiscUtil.copy(this.__state);
		this._state = this._getProxy("state", this.__state);

		this.__$wrpFilter = null;
		this._$wrpChildren = null;
	}

	getChildFilters () {
		return [...this._filters, ...this._filters.map(f => f.getChildFilters())].flat();
	}

	getSaveableState () {
		const out = {
			[this.header]: {
				...this.getBaseSaveableState(),
				state: {...this.__state},
			},
		};
		this._filters.forEach(it => Object.assign(out, it.getSaveableState()));
		return out;
	}

	setStateFromLoaded (filterState, {isUserSavedState = false} = {}) {
		if (!filterState?.[this.header]) return;

		const toLoad = filterState[this.header];
		this._hasUserSavedState = this._hasUserSavedState || isUserSavedState;
		this.setBaseStateFromLoaded(toLoad);
		Object.assign(this._state, toLoad.state);
		this._filters.forEach(it => it.setStateFromLoaded(filterState, {isUserSavedState}));
	}

	_getDefaultItemState (k, {isIgnoreSnapshot = false}) {
		if (isIgnoreSnapshot) return this._defaultState[k];

		const fromSnapshot = this._snapshotManager?.getResolvedValue(this.header, "state", k);
		if (fromSnapshot != null) return fromSnapshot;

		return this._defaultState[k];
	}

	_getStateNotDefault ({nxtState = null, isIgnoreSnapshot = false} = {}) {
		return this._getStateNotDefault_generic({nxtState, isIgnoreSnapshot});
	}

	getSubHashes (opts) {
		const out = [];

		const baseMeta = this.getMetaSubHashes();
		if (baseMeta) out.push(...baseMeta);

		const anyNotDefault = this._getStateNotDefault();
		if (anyNotDefault.length) {
			out.push(UrlUtil.packSubHash(this.getSubHashPrefix("state", this.header), this._getCompressedState()));
		}

		// each getSubHashes should return an array of arrays, or null
		// flatten any arrays of arrays into our array of arrays
		this._filters.map(it => it.getSubHashes(opts)).filter(Boolean).forEach(it => out.push(...it));
		return out.length ? out : null;
	}

	/* -------------------------------------------- */

	getSnapshots () {
		return [
			...this._getSnapshots_generic(),
			...this._filters
				.flatMap(filter => filter.getSnapshots()),
		];
	}

	/* -------------------------------------------- */

	isAnySnapshotRelevant ({snapshots}) {
		return super.isAnySnapshotRelevant({snapshots})
			|| this._filters
				.some(filter => filter.isAnySnapshotRelevant({snapshots}));
	}

	/* -------------------------------------------- */

	_mutNextState_fromSnapshots ({nxtState, snapshots = null}) {
		this._mutNextState_fromSnapshots_generic({nxtState, snapshots});
		return this._filters
			.forEach(filter => filter._mutNextState_fromSnapshots({nxtState, snapshots}));
	}

	_mutNextState_fromSnapshots_state ({nxtState, snapshot}) { return this._mutNextState_fromSnapshots_state_generic({nxtState, snapshot}); }
	_mutNextState_fromSnapshots_meta ({nxtState, snapshot}) { return this._mutNextState_fromSnapshots_meta_generic({nxtState, snapshot}); }

	/* -------------------------------------------- */

	getFilterTagPart () {
		return [
			this._getFilterTagPart_self(),
			...this._filters.map(it => it.getFilterTagPart()).filter(Boolean),
		]
			.filter(it => it != null)
			.join("|");
	}

	// TODO(Future) add `_meta` if required
	_getFilterTagPart_self () {
		const areNotDefaultState = this._getStateNotDefault();
		if (!areNotDefaultState.length) return null;

		return `${this.header.toLowerCase()}=${this._getCompressedState().join(HASH_SUB_LIST_SEP)}`;
	}

	_getCompressedState () {
		return Object.keys(this._defaultState)
			.map(k => UrlUtil.mini.compress(this._state[k] === undefined ? this._defaultState[k] : this._state[k]));
	}

	/* -------------------------------------------- */

	getDisplayStatePart ({nxtState = null, isIgnoreSnapshot = false} = {}) {
		const out = this._filters
			.map(filter => filter.getDisplayStatePart({nxtState, isIgnoreSnapshot}))
			.filter(Boolean)
			.join(", ");
		return out.length ? out : null;
	}

	getDisplayStatePartsHtml ({nxtState = null, isIgnoreSnapshot = false} = {}) {
		return this._filters
			.flatMap(filter => filter.getDisplayStatePartsHtml({nxtState, isIgnoreSnapshot}));
	}

	/* -------------------------------------------- */

	getSnapshotPreviews (snapshots) {
		return this._filters
			.map(filter => filter.getSnapshotPreviews(snapshots))
			.filter(Boolean)
			.flat();
	}

	setStateFromNextState (nxtState) {
		super.setStateFromNextState(nxtState);
	}

	getNextStateFromSubhashState (state) {
		const nxtState = this._getNextState_base();

		if (state == null) {
			this._mutNextState_reset_self(nxtState);
			return nxtState;
		}

		this._mutNextState_meta_fromSubHashState(nxtState, state);

		let hasState = false;

		Object.entries(state).forEach(([k, vals]) => {
			const prop = FilterBase.getProp(k);
			if (prop === "state") {
				hasState = true;
				const data = vals.map(v => UrlUtil.mini.decompress(v));
				Object.keys(this._defaultState).forEach((k, i) => nxtState[this.header].state[k] = data[i]);
			}
		});

		if (!hasState) this._mutNextState_reset_self(nxtState);

		return nxtState;
	}

	setFromValues (values) {
		this._setFromValues(values);
		this._filters.forEach(it => it.setFromValues(values));
	}

	_setFromValues (values) {
		if (!values[this.header]) return;

		const stateNxt = MiscUtil.copyFast(this._defaultState);
		Object.entries(values[this.header])
			.filter(([k, v]) => typeof this._defaultState[k] === typeof v)
			.forEach(([k, v]) => stateNxt[k] = v);

		this._proxyAssignSimple("state", stateNxt);
	}

	_getHeaderControls (opts) {
		const wrpSummary = e_({
			tag: "div",
			clazz: "fltr__summary_item",
		}).hideVe();

		const btnForceMobile = this._isAddDropdownToggle ? ComponentUiUtil.getBtnBool(
			this,
			"isUseDropdowns",
			{
				$ele: $(`<button class="ve-btn ve-btn-default ve-btn-xs ml-2">Show as Dropdowns</button>`),
				stateName: "uiMeta",
				stateProp: "_uiMeta",
			},
		) : null;
		// Propagate parent state to children
		const hkChildrenDropdowns = () => {
			this._filters
				.filter(it => it instanceof RangeFilter)
				.forEach(it => it.isUseDropdowns = this._uiMeta.isUseDropdowns);
		};
		this._addHook("uiMeta", "isUseDropdowns", hkChildrenDropdowns);
		hkChildrenDropdowns();

		const btnResetAll = e_({
			tag: "button",
			clazz: "ve-btn ve-btn-default ve-btn-xs ml-2",
			text: "Reset All",
			click: () => this._filters.forEach(it => it.reset()),
		});

		const wrpBtns = e_({tag: "div", clazz: "ve-flex", children: [btnForceMobile, btnResetAll].filter(Boolean)});
		this._getHeaderControls_addExtraStateBtns(opts, wrpBtns);

		const btnShowHide = this._getBtnShowHide({isMulti: opts.isMulti});
		const wrpControls = e_({
			tag: "div",
			clazz: "ve-flex-v-center",
			children: [
				wrpSummary,
				wrpBtns,
				e_({
					tag: "div",
					clazz: "ve-btn-group ve-flex-v-center ml-2",
					children: [
						btnShowHide,
						this._getBtnMenu({isMulti: opts.isMulti}),
					],
				}),
			],
		});

		const hkIsHidden = () => {
			wrpBtns.toggleVe(!this._uiMeta.isHidden);
			btnShowHide.toggleClass("active", this._uiMeta.isHidden);
			this._$wrpChildren.toggleVe(!this._uiMeta.isHidden);
			wrpSummary.toggleVe(this._uiMeta.isHidden);

			// Skip updating renders if results would be invisible
			if (!this._uiMeta.isHidden) return;

			const numActive = this._filters.map(it => it.getValues()[it.header]._isActive).filter(Boolean).length;
			if (numActive) {
				e_({ele: wrpSummary, title: `${numActive} hidden active filter${numActive === 1 ? "" : "s"}`, text: `(${numActive})`});
			}
		};
		this._addHook("uiMeta", "isHidden", hkIsHidden);
		this._filters.forEach(filter => filter.addHookAllState(hkIsHidden));
		hkIsHidden();

		return wrpControls;
	}

	_getHeaderControls_addExtraStateBtns (opts, wrpStateBtnsOuter) {}

	$render (opts) {
		const btnAndOr = e_({
			tag: "div",
			clazz: `fltr__group-comb-toggle ve-muted`,
			click: () => this._state.mode = this._state.mode === "and" ? "or" : "and",
			contextmenu: () => this._state.mode = this._state.mode === "and" ? "or" : "and",
			title: `"Group AND" requires all filters in this group to match. "Group OR" required any filter in this group to match.`,
		});

		const hookAndOr = () => btnAndOr.innerText = `(group ${this._state.mode.toUpperCase()})`;
		this._addHook("state", "mode", hookAndOr);
		hookAndOr();

		const $children = this._filters.map((it, i) => it.$render({...opts, isMulti: true, isFirst: i === 0}));
		this._$wrpChildren = $$`<div>${$children}</div>`;

		const wrpControls = this._getHeaderControls(opts);

		return this.__$wrpFilter = $$`<div class="ve-flex-col">
			${opts.isFirst ? "" : `<div class="fltr__dropdown-divider mb-1"></div>`}
			<div class="split fltr__h fltr__h--multi ${this._minimalUi ? "fltr__minimal-hide" : ""} mb-1">
				<div class="ve-flex-v-center">
					<div class="mr-2">${this._getRenderedHeader()}</div>
					${btnAndOr}
				</div>
				${wrpControls}
			</div>
			${this._$wrpChildren}
		</div>`;
	}

	$renderMinis (opts) {
		this._filters.map((it, i) => it.$renderMinis({...opts, isMulti: true, isFirst: i === 0}));
	}

	/**
	 * @param vals Previously-read filter value may be passed in for performance.
	 */
	isActive (vals) {
		vals = vals || this.getValues();
		return this._filters.some(it => it.isActive(vals));
	}

	getValues ({nxtState = null} = {}) {
		const state = nxtState?.[this.header]?.state || this.__state;

		const out = {
			[this.header]: Object.entries(this._defaultState)
				.mergeMap(([k, v]) => ({[k]: state[k] == null ? v : state[k]})),
		};
		this._filters.forEach(it => Object.assign(out, it.getValues({nxtState})));
		return out;
	}

	_mutNextState_reset_self (nxtState) {
		Object.assign(nxtState[this.header].state, MiscUtil.copy(this._defaultState));
	}

	_mutNextState_reset ({nxtState, isResetAll = false}) {
		if (isResetAll) this._mutNextState_resetBase({nxtState, isResetAll});
		this._mutNextState_reset_self(nxtState);
	}

	reset ({isResetAll = false, snapshots = null} = {}) {
		super.reset({isResetAll, snapshots});
		this._filters.forEach(it => it.reset({isResetAll, snapshots}));
	}

	update () {
		this._filters.forEach(it => it.update());
	}

	toDisplay (boxState, entryValArr) {
		if (this._filters.length !== entryValArr.length) throw new Error("Number of filters and number of values did not match");

		const results = [];
		for (let i = this._filters.length - 1; i >= 0; --i) {
			const f = this._filters[i];
			if (f instanceof RangeFilter) {
				results.push(f.toDisplay(boxState, entryValArr[i]));
			} else {
				const totals = boxState[f.header]._totals;

				if (totals.yes === 0 && totals.no === 0) results.push(null);
				else results.push(f.toDisplay(boxState, entryValArr[i]));
			}
		}

		const resultsActive = results.filter(r => r !== null);
		if (this._state.mode === "or") {
			if (!resultsActive.length) return true;
			return resultsActive.find(r => r);
		} else {
			return resultsActive.filter(r => r).length === resultsActive.length;
		}
	}

	addItem () { throw new Error(`Cannot add item to MultiFilter! Add the item to a child filter instead.`); }

	handleSearch (searchTerm) {
		const isHeaderMatch = this._getHeaderDisplayName().toLowerCase().includes(searchTerm);

		if (isHeaderMatch) {
			if (this.__$wrpFilter) this.__$wrpFilter.toggleClass("fltr__hidden--search", false);
			// Force-display the children if the parent is visible
			this._filters.forEach(it => it.handleSearch(""));
			return true;
		}

		const numVisible = this._filters.map(it => it.handleSearch(searchTerm)).reduce((a, b) => a + b, 0);
		if (!this.__$wrpFilter) return;
		this.__$wrpFilter.toggleClass("fltr__hidden--search", numVisible === 0);
	}

	getDefaultMeta () {
		// Key order is important, as @filter tags depend on it
		return {};
	}

	getDefaultUiMeta () {
		const out = {
			...super.getDefaultUiMeta(),
			...MultiFilter._DEFAULT_UI_META,
		};
		if (Renderer.hover.isSmallScreen()) out.isUseDropdowns = true;
		return out;
	}

	doTeardown () { this._filters.forEach(it => it.doTeardown()); }
	trimState_ () { this._filters.forEach(it => it.trimState_()); }
}
MultiFilter._DETAULT_STATE = {
	mode: "and",
};
MultiFilter._DEFAULT_UI_META = {
	isUseDropdowns: false,
};
