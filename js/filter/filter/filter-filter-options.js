import {FilterBase} from "./filter-filter-base.js";
import {PILL_STATES} from "../filter-constants.js";

export class OptionsFilter extends FilterBase {
	/**
	 * A filter which has a selection of true/false options.
	 * @param opts
	 * @param opts.defaultState The default options.
	 * @param opts.displayFn Display function which maps an option key to a user-friendly value.
	 * @param [opts.displayFnMini] As per `displayFn`, but used for mini pills.
	 */
	constructor (opts) {
		super(opts);
		this._defaultState = opts.defaultState;
		this._displayFn = opts.displayFn;
		this._displayFnMini = opts.displayFnMini;

		Object.assign(
			this.__state,
			MiscUtil.copy(opts.defaultState),
		);

		this._filterBox = null;
		this.__$wrpMini = null;
		this._$renderedMiniPills = {};
	}

	getSaveableState () {
		return {
			[this.header]: {
				...this.getBaseSaveableState(),
				state: {...this.__state},
			},
		};
	}

	setStateFromLoaded (filterState, {isUserSavedState = false} = {}) {
		if (!filterState?.[this.header]) return;

		const toLoad = filterState[this.header];
		this._hasUserSavedState = this._hasUserSavedState || isUserSavedState;

		this.setBaseStateFromLoaded(toLoad);

		const toAssign = {};
		Object.keys(this._defaultState).forEach(k => {
			if (toLoad.state[k] == null) return;
			if (typeof toLoad.state[k] !== typeof this._defaultState[k]) return; // Sanity check
			toAssign[k] = toLoad.state[k];
		});

		Object.assign(this._state, toAssign);
	}

	getSubHashes () {
		const out = [];

		const baseMeta = this.getMetaSubHashes();
		if (baseMeta) out.push(...baseMeta);

		const serOptionState = [];
		Object.entries(this._defaultState)
			.forEach(([k, vDefault]) => {
				if (this._state[k] !== vDefault) serOptionState.push(`${k.toLowerCase()}=${UrlUtil.mini.compress(this._state[k])}`);
			});
		if (serOptionState.length) {
			out.push(UrlUtil.packSubHash(this.getSubHashPrefix("state", this.header), serOptionState));
		}

		return out.length ? out : null;
	}

	/* -------------------------------------------- */

	_getDefaultItemState (k, {isIgnoreSnapshot = false}) {
		if (isIgnoreSnapshot) return this._defaultState[k];

		const fromSnapshot = this._snapshotManager?.getResolvedValue(this.header, "state", k);
		if (fromSnapshot != null) return fromSnapshot;

		return this._defaultState[k];
	}

	_getStateNotDefault ({nxtState = null, isIgnoreSnapshot = false} = {}) {
		return this._getStateNotDefault_generic({nxtState, isIgnoreSnapshot});
	}

	/* -------------------------------------------- */

	addItem () { /* No-op */ }

	/* -------------------------------------------- */

	getSnapshots () { return this._getSnapshots_generic(); }

	/* -------------------------------------------- */

	_mutNextState_fromSnapshots ({nxtState, snapshots = null}) { return this._mutNextState_fromSnapshots_generic({nxtState, snapshots}); }
	_mutNextState_fromSnapshots_state ({nxtState, snapshot}) { return this._mutNextState_fromSnapshots_state_generic({nxtState, snapshot}); }
	_mutNextState_fromSnapshots_meta ({nxtState, snapshot}) { return this._mutNextState_fromSnapshots_meta_generic({nxtState, snapshot}); }

	/* -------------------------------------------- */

	// TODO(Future) add `_meta` if required
	getFilterTagPart () {
		const areNotDefaultState = this._getStateNotDefault({isIgnoreSnapshot: true});
		if (!areNotDefaultState.length) return null;

		const pt = areNotDefaultState
			.map(([k, v]) => `${v ? "" : "!"}${k}`)
			.join(";").toLowerCase();

		return `${this.header.toLowerCase()}=::${pt}::`;
	}

	/* -------------------------------------------- */

	getDisplayStatePart ({nxtState = null, isIgnoreSnapshot = false} = {}) {
		const pts = this._getDisplayStateParts({nxtState, isIgnoreSnapshot, isPlainText: true});
		if (!pts.length) return null;
		return pts.join(", ");
	}

	getDisplayStatePartsHtml ({nxtState = null, isIgnoreSnapshot = false} = {}) {
		return this._getDisplayStateParts({nxtState, isIgnoreSnapshot});
	}

	_getDisplayStateParts ({nxtState = null, isIgnoreSnapshot = false, isPlainText = false}) {
		const state = nxtState?.[this.header]?.state || this.__state;

		const areNotDefaultState = this._getStateNotDefault({nxtState, isIgnoreSnapshot});

		// If _any_ value is non-default, we need to include _all_ values in the tag
		if (!areNotDefaultState.length) return [];

		const ptState = Object.entries(state)
			.map(([k, v]) => {
				const dispKey = this._displayFn(k);
				return {v, dispKey};
			})
			.filter(Boolean)
			.sort(SortUtil.ascSortLowerProp.bind(SortUtil, "dispKey"))
			.map(({v, dispKey}) => {
				if (isPlainText) return `${v ? "" : "not "}${dispKey}`;

				return `<span class="fltr__disp-state fltr__disp-state--${v ? "yes" : "no"}">${dispKey}</span>`;
			})
			.join(", ");

		return [
			`${this._getDisplayStatePart_getHeader({isPlainText})}${ptState}`,
		];
	}

	/* -------------------------------------------- */

	getSnapshotPreviews (snapshots) {
		/* Implement if required */
		return [];
	}

	getNextStateFromSubhashState (state) {
		const nxtState = this._getNextState_base();

		if (state == null) {
			this._mutNextState_reset({nxtState});
			return nxtState;
		}

		this._mutNextState_meta_fromSubHashState(nxtState, state);

		let hasState = false;

		Object.entries(state).forEach(([k, vals]) => {
			const prop = FilterBase.getProp(k);
			if (prop !== "state") return;

			hasState = true;
			vals.forEach(v => {
				const [prop, valCompressed] = v.split("=");
				const val = UrlUtil.mini.decompress(valCompressed);

				const casedProp = Object.keys(this._defaultState).find(k => k.toLowerCase() === prop);
				if (!casedProp) return;

				if (this._defaultState[casedProp] != null && typeof val === typeof this._defaultState[casedProp]) nxtState[this.header].state[casedProp] = val;
			});
		});

		if (!hasState) this._mutNextState_reset({nxtState});

		return nxtState;
	}

	setFromValues (values) {
		if (!values[this.header]) return;
		const vals = values[this.header];
		Object.entries(vals).forEach(([k, v]) => {
			if (this._defaultState[k] && typeof this._defaultState[k] === typeof v) this._state[k] = v;
		});
	}

	setValue (k, v) { this._state[k] = v; }

	/**
	 * @param opts Options.
	 * @param opts.filterBox The FilterBox to which this filter is attached.
	 * @param opts.isFirst True if this is visually the first filter in the box.
	 * @param opts.$wrpMini The form mini-view element.
	 * @param opts.isMulti The name of the MultiFilter this filter belongs to, if any.
	 */
	$render (opts) {
		this._filterBox = opts.filterBox;
		this.__$wrpMini = opts.$wrpMini;

		const $wrpControls = opts.isMulti ? null : this._$getHeaderControls();

		const $btns = Object.keys(this._defaultState)
			.map(k => this._$render_$getPill(k));
		const $wrpButtons = $$`<div>${$btns}</div>`;

		if (opts.isMulti) {
			return this.__$wrpFilter = $$`<div class="ve-flex">
				<div class="fltr__range-inline-label mr-2">${this._getRenderedHeader()}</div>
				${$wrpButtons}
			</div>`;
		} else {
			return this.__$wrpFilter = $$`<div class="ve-flex-col">
				${opts.isFirst ? "" : `<div class="fltr__dropdown-divider mb-1"></div>`}
				<div class="split fltr__h ${this._minimalUi ? "fltr__minimal-hide" : ""} mb-1">
					<div class="fltr__h-text ve-flex-h-center">${this._getRenderedHeader()}</div>
					${$wrpControls}
				</div>
				${$wrpButtons}
			</div>`;
		}
	}

	_$render_$getPill (key) {
		const displayText = this._displayFn(key);

		const $btnPill = $(`<div class="fltr__pill">${displayText}</div>`)
			.click(() => {
				this._state[key] = !this._state[key];
			})
			.contextmenu((evt) => {
				evt.preventDefault();
				this._state[key] = !this._state[key];
			});
		const hook = () => {
			const val = PILL_STATES[this._state[key] ? 1 : 2];
			$btnPill.attr("data-state", val);
		};
		this._addHook("state", key, hook);
		hook();

		return $btnPill;
	}

	$renderMinis (opts) {
		if (!opts.$wrpMini) return;

		this._filterBox = opts.filterBox;
		this.__$wrpMini = opts.$wrpMini;

		this._doRenderMiniPills();
	}

	_doRenderMiniPills () {
		Object.keys(this._defaultState)
			.forEach(k => {
				const $btn = this._$renderedMiniPills[k] ||= this._$getMiniPill(k);
				$btn.appendTo(this.__$wrpMini);
			});
	}

	_$getMiniPill (key) {
		const displayTextFull = this._displayFnMini ? this._displayFn(key) : null;
		const displayText = this._displayFnMini ? this._displayFnMini(key) : this._displayFn(key);

		const $btnMini = $(`<div class="fltr__mini-pill ${this._filterBox.isMinisHidden(this.header) ? "ve-hidden" : ""}" data-state="${PILL_STATES[this._defaultState[key] === this._state[key] ? 0 : this._state[key] ? 1 : 2]}">${displayText}</div>`)
			.title(`${displayTextFull ? `${displayTextFull} (` : ""}Filter: ${this._getHeaderDisplayName()}${displayTextFull ? ")" : ""}`)
			.click(() => {
				this._state[key] = this._defaultState[key];
				this._filterBox.fireChangeEvent();
			});

		const hook = () => $btnMini.attr("data-state", PILL_STATES[this._defaultState[key] === this._state[key] ? 0 : this._state[key] ? 1 : 2]);
		this._addHook("state", key, hook);

		const hideHook = () => $btnMini.toggleClass("ve-hidden", this._filterBox.isMinisHidden(this.header));
		this._filterBox.registerMinisHiddenHook(this.header, hideHook);

		return $btnMini;
	}

	_$getHeaderControls () {
		const $btnReset = $(`<button class="ve-btn ve-btn-default ve-btn-xs">Reset</button>`).click(() => this.reset());
		const $wrpBtns = $$`<div class="ve-flex-v-center">${$btnReset}</div>`;

		const $wrpSummary = $(`<div class="ve-flex-v-center fltr__summary_item fltr__summary_item--include"></div>`).hideVe();

		const btnShowHide = this._getBtnShowHide();
		const hkIsHidden = () => {
			btnShowHide.toggleClass("active", this._uiMeta.isHidden);
			$wrpBtns.toggleVe(!this._uiMeta.isHidden);
			$wrpSummary.toggleVe(this._uiMeta.isHidden);

			// Skip updating renders if results would be invisible
			if (!this._uiMeta.isHidden) return;

			// render summary
			const cntNonDefault = Object.entries(this._defaultState).filter(([k, v]) => this._state[k] != null && this._state[k] !== v).length;

			$wrpSummary
				.title(`${cntNonDefault} non-default option${cntNonDefault === 1 ? "" : "s"} selected`)
				.text(cntNonDefault);
		};
		this._addHook("uiMeta", "isHidden", hkIsHidden);
		this._addHookAll("state", hkIsHidden);
		hkIsHidden();

		return $$`
		<div class="ve-flex-v-center">
			${$wrpBtns}
			${$wrpSummary}
			<div class="ve-btn-group ve-flex-v-center ml-2">
				${btnShowHide}
				${this._getBtnMenu()}
			</div>
		</div>`;
	}

	getValues ({nxtState = null} = {}) {
		const state = nxtState?.[this.header]?.state || this.__state;

		const out = Object.entries(this._defaultState)
			.mergeMap(([k, v]) => ({[k]: state[k] == null ? v : state[k]}));
		out._isActive = Object.entries(this._defaultState).some(([k, v]) => state[k] != null && state[k] !== v);
		return {
			[this.header]: out,
		};
	}

	_mutNextState_reset ({nxtState, isResetAll = false}) {
		if (isResetAll) this._mutNextState_resetBase({nxtState, isResetAll});
		Object.assign(nxtState[this.header].state, MiscUtil.copy(this._defaultState));
	}

	update () {
		this._doRenderMiniPills();
	}

	toDisplay (boxState, entryVal) {
		const filterState = boxState[this.header];
		if (!filterState) return true; // discount any filters which were not rendered

		if (entryVal == null) return true; // Never filter if a null object, i.e. "no data," is passed in

		// If an object has a relevant value, display if the incoming value matches our state.
		return Object.entries(entryVal)
			.every(([k, v]) => this._state[k] === v);
	}

	getDefaultMeta () {
		// Key order is important, as @filter tags depend on it
		return {};
	}

	handleSearch (searchTerm) {
		if (this.__$wrpFilter == null) return;

		const isVisible = this._getHeaderDisplayName().toLowerCase().includes(searchTerm)
			|| Object.keys(this._defaultState).map(it => this._displayFn(it).toLowerCase()).some(it => it.includes(searchTerm));

		this.__$wrpFilter.toggleClass("fltr__hidden--search", !isVisible);

		return isVisible;
	}
}
