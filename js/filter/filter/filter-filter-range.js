import {FilterBase} from "./filter-filter-base.js";
import {PILL_STATE__IGNORE, PILL_STATE__YES, PILL_STATES} from "../filter-constants.js";

export class RangeFilter extends FilterBase {
	/**
	 * @param opts Options object.
	 * @param opts.header Filter header (name)
	 * @param [opts.headerHelp] Filter header help text (tooltip)
	 * @param [opts.min] Minimum slider value.
	 * @param [opts.max] Maximum slider value.
	 * @param [opts.isSparse] If this slider should only display known values, rather than a continual range.
	 * @param [opts.isLabelled] If this slider has labels.
	 * @param [opts.labels] Initial labels to populate this filter with.
	 * @param [opts.isAllowGreater] If this slider should allow all items greater than its max.
	 * @param [opts.isRequireFullRangeMatch] If range values, e.g. `[1, 5]`, must be entirely within the slider's
	 * selected range in order to be produce a positive `toDisplay` result.
	 * @param [opts.suffix] Suffix to add to number displayed above slider.
	 * @param [opts.labelSortFn] Function used to sort labels if new labels are added. Defaults to ascending alphabetical.
	 * @param [opts.labelDisplayFn] Function which converts a label to a display value.
	 * @param [opts.displayFn] Function which converts a (non-label) value to a display value.
	 * @param [opts.displayFnTooltip] Function which converts a (non-label) value to a tooltip display value.
	 */
	constructor (opts) {
		super(opts);

		if (opts.labels && opts.min == null) opts.min = 0;
		if (opts.labels && opts.max == null) opts.max = opts.labels.length - 1;

		this._min = Number(opts.min || 0);
		this._max = Number(opts.max || 0);
		this._labels = opts.isLabelled ? opts.labels : null;
		this._isAllowGreater = !!opts.isAllowGreater;
		this._isRequireFullRangeMatch = !!opts.isRequireFullRangeMatch;
		this._sparseValues = opts.isSparse ? [] : null;
		this._suffix = opts.suffix;
		this._labelSortFn = opts.labelSortFn === undefined ? SortUtil.ascSort : opts.labelSortFn;
		this._labelDisplayFn = opts.labelDisplayFn;
		this._displayFn = opts.displayFn;
		this._displayFnTooltip = opts.displayFnTooltip;

		this._filterBox = null;
		Object.assign(
			this.__state,
			{
				min: this._min,
				max: this._max,
				curMin: this._min,
				curMax: this._max,
			},
		);
		this.__$wrpFilter = null;
		this.__$wrpMini = null;
		this._slider = null;

		this._labelSearchCache = null;

		this._$btnMiniGt = null;
		this._$btnMiniLt = null;
		this._$btnMiniEq = null;

		// region Trimming
		this._seenMin = this._min;
		this._seenMax = this._max;
		// endregion
	}

	set isUseDropdowns (val) { this._uiMeta.isUseDropdowns = !!val; }

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

		// region Ensure to-be-loaded state is populated with sensible data
		const tgt = (toLoad.state || {});

		if (tgt.max == null) tgt.max = this._max;
		else if (this._max > tgt.max) {
			if (tgt.max === tgt.curMax) tgt.curMax = this._max; // If it's set to "max", respect this
			tgt.max = this._max;
		}

		if (tgt.curMax == null) tgt.curMax = tgt.max;
		else if (tgt.curMax > tgt.max) tgt.curMax = tgt.max;

		if (tgt.min == null) tgt.min = this._min;
		else if (this._min < tgt.min) {
			if (tgt.min === tgt.curMin) tgt.curMin = this._min; // If it's set to "min", respect this
			tgt.min = this._min;
		}

		if (tgt.curMin == null) tgt.curMin = tgt.min;
		else if (tgt.curMin < tgt.min) tgt.curMin = tgt.min;
		// endregion

		this.setBaseStateFromLoaded(toLoad);

		Object.assign(this._state, toLoad.state);
	}

	trimState_ () {
		if (this._seenMin <= this._state.min && this._seenMax >= this._state.max) return;

		const nxtState = {min: this._seenMin, curMin: this._seenMin, max: this._seenMax, curMax: this._seenMax};
		this._proxyAssignSimple("state", nxtState);
	}

	getSubHashes () {
		const out = [];

		const baseMeta = this.getMetaSubHashes();
		if (baseMeta) out.push(...baseMeta);

		const serSliderState = [
			this._state.min !== this._state.curMin ? `min=${this._state.curMin}` : null,
			this._state.max !== this._state.curMax ? `max=${this._state.curMax}` : null,
		].filter(Boolean);
		if (serSliderState.length) {
			out.push(UrlUtil.packSubHash(this.getSubHashPrefix("state", this.header), serSliderState));
		}

		return out.length ? out : null;
	}

	/* -------------------------------------------- */

	_isAtDefaultPosition ({nxtState = null} = {}) {
		const state = nxtState?.[this.header]?.state || this.__state;
		return state.min === state.curMin && state.max === state.curMax;
	}

	_getDefaultItemState (k, {isIgnoreSnapshot = false}) {
		if (isIgnoreSnapshot) return this._getDefaultState_base(k);

		const fromSnapshot = this._getDefaultState_snapshot(k);
		if (fromSnapshot != null) return fromSnapshot;

		return this._getDefaultState_base(k);
	}

	_getDefaultState_base (k) {
		switch (k) {
			case "curMin": return this._state.min;
			case "curMax": return this._state.max;
			case "min": return this._state.min;
			case "max": return this._state.max;
			default: throw new Error(`Unhandled state key "${k}"`);
		}
	}

	_getDefaultState_snapshot (k) {
		switch (k) {
			case "curMin": {
				const curMinSnapshot = this._snapshotManager?.getResolvedValue(this.header, "state", "curMin") ?? this._state.min;
				const minSnapshot = this._snapshotManager?.getResolvedValue(this.header, "state", "min") ?? this._state.min;
				if (curMinSnapshot === minSnapshot) return this._state.min;
				return curMinSnapshot;
			}
			case "curMax": {
				const curMaxSnapshot = this._snapshotManager?.getResolvedValue(this.header, "state", "curMax") ?? this._state.max;
				const maxSnapshot = this._snapshotManager?.getResolvedValue(this.header, "state", "max") ?? this._state.max;
				if (curMaxSnapshot === maxSnapshot) return this._state.max;
				return curMaxSnapshot;
			}
			case "min": return Math.min(this._state.min, this._snapshotManager?.getResolvedValue(this.header, "state", "min") ?? this._state.min);
			case "max": return Math.max(this._state.max, this._snapshotManager?.getResolvedValue(this.header, "state", "max") ?? this._state.max);

			default: throw new Error(`Unhandled state key "${k}"`);
		}
	}

	_getStateNotDefault ({nxtState = null, isIgnoreSnapshot = false}) {
		return this._getStateNotDefault_generic({nxtState, isIgnoreSnapshot});
	}

	/* -------------------------------------------- */

	getSnapshots () { return this._getSnapshots_generic(); }

	/* -------------------------------------------- */

	_mutNextState_fromSnapshots ({nxtState, snapshots = null}) { return this._mutNextState_fromSnapshots_generic({nxtState, snapshots}); }
	_mutNextState_fromSnapshots_state ({nxtState, snapshot}) { return this._mutNextState_fromSnapshots_state_generic({nxtState, snapshot}); }
	_mutNextState_fromSnapshots_meta ({nxtState, snapshot}) { return this._mutNextState_fromSnapshots_meta_generic({nxtState, snapshot}); }

	/* -------------------------------------------- */

	// TODO(Future) add `_meta` if required
	getFilterTagPart () {
		if (this._isAtDefaultPosition()) return null;

		if (!this._labels) {
			if (this._state.curMin === this._state.curMax) return `${this.header}=[${this._state.curMin}]`;
			return `${this.header}=[${this._state.curMin};${this._state.curMax}]`;
		}

		if (this._state.curMin === this._state.curMax) {
			const label = this._labels[this._state.curMin];
			return `${this.header}=[&${label}]`;
		}

		const labelLow = this._labels[this._state.curMin];
		const labelHigh = this._labels[this._state.curMax];
		return `${this.header}=[&${labelLow};&${labelHigh}]`;
	}

	/* -------------------------------------------- */

	getDisplayStatePart ({nxtState = null, isIgnoreSnapshot = false} = {}) {
		if (this._isAtDefaultPosition({nxtState})) return null;

		const {summary} = this._getDisplaySummary({nxtState, isIgnoreSnapshot, isPlainText: true});

		return `${this._getDisplayStatePart_getHeader({isPlainText: true})}${summary}`;
	}

	getDisplayStatePartsHtml ({nxtState = null, isIgnoreSnapshot = false} = {}) {
		if (this._isAtDefaultPosition({nxtState})) return [];

		const {summary} = this._getDisplaySummary({nxtState, isIgnoreSnapshot});

		return [
			`${this._getDisplayStatePart_getHeader()}${summary}`,
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
			if (prop === "state") {
				hasState = true;
				vals.forEach(v => {
					const [prop, val] = v.split("=");
					if (val.startsWith("&") && !this._labels) throw new Error(`Could not dereference label: "${val}"`);

					let num;
					if (val.startsWith("&")) { // prefixed with "&" for "address (index) of..."
						const clean = val.replace("&", "").toLowerCase();
						num = this._labels.findIndex(it => String(it).toLowerCase() === clean);
						if (!~num) throw new Error(`Could not find index for label "${clean}"`);
					} else num = Number(val);

					switch (prop) {
						case "min":
							if (num < nxtState[this.header].state.min) nxtState[this.header].state.min = num;
							nxtState[this.header].state.curMin = Math.max(nxtState[this.header].state.min, num);
							break;
						case "max":
							if (num > nxtState[this.header].state.max) nxtState[this.header].state.max = num;
							nxtState[this.header].state.curMax = Math.min(nxtState[this.header].state.max, num);
							break;
						default: throw new Error(`Unknown prop "${prop}"`);
					}
				});
			}
		});

		if (!hasState) this._mutNextState_reset({nxtState});

		return nxtState;
	}

	setFromValues (values) {
		if (!values[this.header]) return;

		const vals = values[this.header];

		if (vals.min != null) this._state.curMin = Math.max(this._state.min, vals.min);
		else this._state.curMin = this._state.min;

		if (vals.max != null) this._state.curMax = Math.max(this._state.max, vals.max);
		else this._state.curMax = this._state.max;
	}

	_$getHeaderControls () {
		const $btnForceMobile = ComponentUiUtil.$getBtnBool(
			this,
			"isUseDropdowns",
			{
				$ele: $(`<button class="ve-btn ve-btn-default ve-btn-xs mr-2">Show as Dropdowns</button>`),
				stateName: "uiMeta",
				stateProp: "_uiMeta",
			},
		);
		const $btnReset = $(`<button class="ve-btn ve-btn-default ve-btn-xs">Reset</button>`).click(() => this.reset());
		const $wrpBtns = $$`<div>${$btnForceMobile}${$btnReset}</div>`;

		const $wrpSummary = $(`<div class="ve-flex-v-center fltr__summary_item fltr__summary_item--include"></div>`).hideVe();

		const btnShowHide = this._getBtnShowHide();
		const hkIsHidden = () => {
			btnShowHide.toggleClass("active", this._uiMeta.isHidden);
			$wrpBtns.toggleVe(!this._uiMeta.isHidden);
			$wrpSummary.toggleVe(this._uiMeta.isHidden);

			// Skip updating renders if results would be invisible
			if (!this._uiMeta.isHidden) return;

			// render summary
			const {summaryTitle, summary} = this._getDisplaySummary();
			$wrpSummary
				.title(summaryTitle)
				.text(summary);
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

	_getDisplaySummary ({nxtState = null, isIgnoreSnapshot = false, isPlainText = false} = {}) {
		const cur = this.getValues({nxtState})[this.header];

		const isRange = !cur.isMinVal && !cur.isMaxVal;
		const isCapped = !cur.isMinVal || !cur.isMaxVal;

		return {
			summaryTitle: isRange ? `Hidden range` : isCapped ? `Hidden limit` : "",
			summary: isRange ? `${this._getDisplayText(cur.min)}-${this._getDisplayText(cur.max)}` : !cur.isMinVal ? `≥ ${this._getDisplayText(cur.min)}` : !cur.isMaxVal ? `≤ ${this._getDisplayText(cur.max)}` : "",
		};
	}

	_getDisplayText (value, {isBeyondMax = false, isTooltip = false} = {}) {
		value = `${this._labels ? this._labelDisplayFn ? this._labelDisplayFn(this._labels[value]) : this._labels[value] : (isTooltip && this._displayFnTooltip) ? this._displayFnTooltip(value) : this._displayFn ? this._displayFn(value) : value}${isBeyondMax ? "+" : ""}`;
		if (this._suffix) value += this._suffix;
		return value;
	}

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

		const $wrpSlider = $$`<div class="fltr__wrp-pills fltr__wrp-pills--flex"></div>`;
		const $wrpDropdowns = $$`<div class="fltr__wrp-pills fltr__wrp-pills--flex"></div>`;
		const hookHidden = () => {
			$wrpSlider.toggleVe(!this._uiMeta.isHidden && !this._uiMeta.isUseDropdowns);
			$wrpDropdowns.toggleVe(!this._uiMeta.isHidden && !!this._uiMeta.isUseDropdowns);
		};
		this._addHook("uiMeta", "isHidden", hookHidden);
		this._addHook("uiMeta", "isUseDropdowns", hookHidden);
		hookHidden();

		// region Slider
		// ensure sparse values are correctly constrained
		if (this._sparseValues?.length) {
			const sparseMin = this._sparseValues[0];
			if (this._state.min < sparseMin) {
				this._state.curMin = Math.max(this._state.curMin, sparseMin);
				this._state.min = sparseMin;
			}

			const sparseMax = this._sparseValues.last();
			if (this._state.max > sparseMax) {
				this._state.curMax = Math.min(this._state.curMax, sparseMax);
				this._state.max = sparseMax;
			}
		}

		// prepare slider options
		const getSliderOpts = () => {
			const fnDisplay = (val, {isTooltip = false} = {}) => {
				return this._getDisplayText(val, {isBeyondMax: this._isAllowGreater && val === this._state.max, isTooltip});
			};

			return {
				propMin: "min",
				propMax: "max",
				propCurMin: "curMin",
				propCurMax: "curMax",
				fnDisplay: (val) => fnDisplay(val),
				fnDisplayTooltip: (val) => fnDisplay(val, {isTooltip: true}),
				sparseValues: this._sparseValues,
			};
		};

		const hkUpdateLabelSearchCache = () => {
			if (this._labels) return this._doUpdateLabelSearchCache();
			this._labelSearchCache = null;
		};
		this._addHook("state", "curMin", hkUpdateLabelSearchCache);
		this._addHook("state", "curMax", hkUpdateLabelSearchCache);
		hkUpdateLabelSearchCache();

		this._slider = new ComponentUiUtil.RangeSlider({comp: this, ...getSliderOpts()});
		$wrpSlider.append(this._slider.get());
		// endregion

		// region Dropdowns
		const selMin = e_({
			tag: "select",
			clazz: `form-control mr-2`,
			change: () => {
				const nxtMin = Number(selMin.val());
				const [min, max] = [nxtMin, this._state.curMax].sort(SortUtil.ascSort);
				this._state.curMin = min;
				this._state.curMax = max;
			},
		});
		const selMax = e_({
			tag: "select",
			clazz: `form-control`,
			change: () => {
				const nxMax = Number(selMax.val());
				const [min, max] = [this._state.curMin, nxMax].sort(SortUtil.ascSort);
				this._state.curMin = min;
				this._state.curMax = max;
			},
		});
		$$`<div class="ve-flex-v-center w-100 px-3 py-1">${selMin}${selMax}</div>`.appendTo($wrpDropdowns);
		// endregion

		const handleCurUpdate = () => {
			// Dropdowns
			selMin.val(`${this._state.curMin}`);
			selMax.val(`${this._state.curMax}`);
		};

		const handleLimitUpdate = () => {
			// Dropdowns
			this._doPopulateDropdown(selMin, this._state.curMin);
			this._doPopulateDropdown(selMax, this._state.curMax);
		};

		this._addHook("state", "min", handleLimitUpdate);
		this._addHook("state", "max", handleLimitUpdate);
		this._addHook("state", "curMin", handleCurUpdate);
		this._addHook("state", "curMax", handleCurUpdate);
		handleCurUpdate();
		handleLimitUpdate();

		if (opts.isMulti) {
			this._slider.get().classList.add("ve-grow");
			$wrpSlider.addClass("ve-grow");
			$wrpDropdowns.addClass("ve-grow");

			return this.__$wrpFilter = $$`<div class="ve-flex">
				<div class="fltr__range-inline-label mr-2">${this._getRenderedHeader()}</div>
				${$wrpSlider}
				${$wrpDropdowns}
			</div>`;
		} else {
			const btnMobToggleControls = this._getBtnMobToggleControls($wrpControls);

			return this.__$wrpFilter = $$`<div class="ve-flex-col">
				${opts.isFirst ? "" : `<div class="fltr__dropdown-divider mb-1"></div>`}
				<div class="split fltr__h ${this._minimalUi ? "fltr__minimal-hide" : ""} mb-1">
					<div class="fltr__h-text ve-flex-h-center">${this._getRenderedHeader()}${btnMobToggleControls}</div>
					${$wrpControls}
				</div>
				${$wrpSlider}
				${$wrpDropdowns}
			</div>`;
		}
	}

	$renderMinis (opts) {
		if (!opts.$wrpMini) return;

		this._filterBox = opts.filterBox;
		this.__$wrpMini = opts.$wrpMini;

		// region Mini pills
		this._$btnMiniGt = this._$btnMiniGt || $(`<div class="fltr__mini-pill" data-state="${PILL_STATES[PILL_STATE__IGNORE]}"></div>`)
			.click(() => {
				this._state.curMin = this._state.min;
				this._filterBox.fireChangeEvent();
			});
		this._$btnMiniGt.appendTo(this.__$wrpMini);

		this._$btnMiniLt = this._$btnMiniLt || $(`<div class="fltr__mini-pill" data-state="${PILL_STATES[PILL_STATE__IGNORE]}"></div>`)
			.click(() => {
				this._state.curMax = this._state.max;
				this._filterBox.fireChangeEvent();
			});
		this._$btnMiniLt.appendTo(this.__$wrpMini);

		this._$btnMiniEq = this._$btnMiniEq || $(`<div class="fltr__mini-pill" data-state="${PILL_STATES[PILL_STATE__IGNORE]}"></div>`)
			.click(() => {
				this._state.curMin = this._state.min;
				this._state.curMax = this._state.max;
				this._filterBox.fireChangeEvent();
			});
		this._$btnMiniEq.appendTo(this.__$wrpMini);

		const hideHook = () => {
			const isHidden = this._filterBox.isMinisHidden(this.header);
			this._$btnMiniGt.toggleClass("ve-hidden", isHidden);
			this._$btnMiniLt.toggleClass("ve-hidden", isHidden);
			this._$btnMiniEq.toggleClass("ve-hidden", isHidden);
		};
		this._filterBox.registerMinisHiddenHook(this.header, hideHook);
		hideHook();

		const handleMiniUpdate = () => {
			if (this._state.curMin === this._state.curMax) {
				this._$btnMiniGt.attr("data-state", PILL_STATES[PILL_STATE__IGNORE]);
				this._$btnMiniLt.attr("data-state", PILL_STATES[PILL_STATE__IGNORE]);

				this._$btnMiniEq
					.attr("data-state", this._isAtDefaultPosition() ? PILL_STATES[PILL_STATE__IGNORE] : PILL_STATES[PILL_STATE__YES])
					.text(`${this._getHeaderDisplayName()} = ${this._getDisplayText(this._state.curMin, {isBeyondMax: this._isAllowGreater && this._state.curMin === this._state.max})}`);
			} else {
				if (this._state.min !== this._state.curMin) {
					this._$btnMiniGt.attr("data-state", PILL_STATES[PILL_STATE__YES])
						.text(`${this._getHeaderDisplayName()} ≥ ${this._getDisplayText(this._state.curMin)}`);
				} else this._$btnMiniGt.attr("data-state", PILL_STATES[PILL_STATE__IGNORE]);

				if (this._state.max !== this._state.curMax) {
					this._$btnMiniLt.attr("data-state", PILL_STATES[PILL_STATE__YES])
						.text(`${this._getHeaderDisplayName()} ≤ ${this._getDisplayText(this._state.curMax)}`);
				} else this._$btnMiniLt.attr("data-state", PILL_STATES[PILL_STATE__IGNORE]);

				this._$btnMiniEq.attr("data-state", PILL_STATES[PILL_STATE__IGNORE]);
			}
		};
		// endregion

		const handleCurUpdate = () => {
			handleMiniUpdate();
		};

		const handleLimitUpdate = () => {
			handleMiniUpdate();
		};

		this._addHook("state", "min", handleLimitUpdate);
		this._addHook("state", "max", handleLimitUpdate);
		this._addHook("state", "curMin", handleCurUpdate);
		this._addHook("state", "curMax", handleCurUpdate);
		handleCurUpdate();
		handleLimitUpdate();
	}

	_doPopulateDropdown (sel, curVal) {
		let tmp = "";
		for (let i = 0, len = this._state.max - this._state.min + 1; i < len; ++i) {
			const val = i + this._state.min;
			const label = `${this._getDisplayText(val)}`.qq();
			tmp += `<option value="${val}" ${curVal === val ? "selected" : ""}>${label}</option>`;
		}
		sel.innerHTML = tmp;
		return sel;
	}

	getValues ({nxtState = null} = {}) {
		const state = nxtState?.[this.header]?.state || this.__state;

		const out = {
			isMaxVal: state.max === state.curMax,
			isMinVal: state.min === state.curMin,
			max: state.curMax,
			min: state.curMin,
		};
		out._isActive = !(out.isMinVal && out.isMaxVal);
		return {[this.header]: out};
	}

	_mutNextState_reset ({nxtState, isResetAll = false}) {
		if (isResetAll) this._mutNextState_resetBase({nxtState, isResetAll});
		nxtState[this.header].state.curMin = nxtState[this.header].state.min;
		nxtState[this.header].state.curMax = nxtState[this.header].state.max;
	}

	update () {
		if (!this.__$wrpMini) return;

		// (labels will be automatically updated by the slider handlers)
		// always render the mini-pills, to ensure the overall order in the grid stays correct (shared between multiple filters)
		if (this._$btnMiniGt) this.__$wrpMini.append(this._$btnMiniGt);
		if (this._$btnMiniLt) this.__$wrpMini.append(this._$btnMiniLt);
		if (this._$btnMiniEq) this.__$wrpMini.append(this._$btnMiniEq);
	}

	toDisplay (boxState, entryVal) {
		const filterState = boxState[this.header];
		if (!filterState) return true; // discount any filters which were not rendered

		// match everything if filter is set to complete range
		if (entryVal == null) return filterState.min === this._state.min && filterState.max === this._state.max;

		if (this._labels) {
			const slice = this._labels.slice(filterState.min, filterState.max + 1);

			// Special case for "isAllowGreater" filters, which assumes the labels are numerical values
			if (this._isAllowGreater) {
				if (filterState.max === this._state.max && entryVal > this._labels[filterState.max]) return true;

				const sliceMin = Math.min(...slice);
				const sliceMax = Math.max(...slice);

				if (entryVal instanceof Array) return entryVal.some(it => it >= sliceMin && it <= sliceMax);
				return entryVal >= sliceMin && entryVal <= sliceMax;
			}

			if (entryVal instanceof Array) return entryVal.some(it => slice.includes(it));
			return slice.includes(entryVal);
		} else {
			if (entryVal instanceof Array) {
				// If we require a full match on the range, take the lowest/highest input and test them against our min/max
				if (this._isRequireFullRangeMatch) return filterState.min <= entryVal[0] && filterState.max >= entryVal.last();

				// Otherwise, If any of the item's values are in the range, return true
				return entryVal.some(ev => this._toDisplay_isToDisplayEntry(filterState, ev));
			}
			return this._toDisplay_isToDisplayEntry(filterState, entryVal);
		}
	}

	_toDisplay_isToDisplayEntry (filterState, ev) {
		const isGtMin = filterState.min <= ev;
		const isLtMax = filterState.max >= ev;
		if (this._isAllowGreater) return isGtMin && (isLtMax || filterState.max === this._state.max);
		return isGtMin && isLtMax;
	}

	addItem (item) {
		if (item == null) return;

		if (item instanceof Array) {
			const len = item.length;
			for (let i = 0; i < len; ++i) this.addItem(item[i]);
			return;
		}

		if (this._labels) {
			if (!this._labels.some(it => it === item)) this._labels.push(item);

			this._doUpdateLabelSearchCache();

			// Fake an update to trigger label handling
			this._addItem_addNumber(this._labels.length - 1);
		} else {
			this._addItem_addNumber(item);
		}
	}

	_doUpdateLabelSearchCache () {
		this._labelSearchCache = [...new Array(Math.max(0, this._max - this._min))]
			.map((_, i) => i + this._min)
			.map(val => this._getDisplayText(val, {isBeyondMax: this._isAllowGreater && val === this._state.max, isTooltip: true}))
			.join(" -- ")
			.toLowerCase();
	}

	_addItem_addNumber (number) {
		if (number == null || isNaN(number)) return;

		this._seenMin = Math.min(this._seenMin, number);
		this._seenMax = Math.max(this._seenMax, number);

		if (this._sparseValues && !this._sparseValues.includes(number)) {
			this._sparseValues.push(number);
			this._sparseValues.sort(SortUtil.ascSort);
		}

		if (number >= this._state.min && number <= this._state.max) return; // it's already in the range
		if (this._state.min == null && this._state.max == null) this._state.min = this._state.max = number;
		else {
			const old = {...this.__state};

			if (number < old.min) this._state.min = number;
			if (number > old.max) this._state.max = number;

			// if the slider was previously at the full extent of its range, maintain this
			if (old.curMin === old.min) this._state.curMin = this._state.min;
			if (old.curMax === old.max) this._state.curMax = this._state.max;
		}
	}

	getDefaultMeta () {
		// Key order is important, as @filter tags depend on it
		return {};
	}

	getDefaultUiMeta () {
		const out = {
			...super.getDefaultUiMeta(),
			...RangeFilter._DEFAULT_UI_META,
		};
		if (Renderer.hover.isSmallScreen()) out.isUseDropdowns = true;
		return out;
	}

	handleSearch (searchTerm) {
		if (this.__$wrpFilter == null) return;

		const isVisible = this._getHeaderDisplayName().toLowerCase().includes(searchTerm)
			|| (this._labelSearchCache != null
				? this._labelSearchCache.includes(searchTerm)
				: [...new Array(this._state.max - this._state.min)].map((_, n) => n + this._state.min).join(" -- ").includes(searchTerm));

		this.__$wrpFilter.toggleClass("fltr__hidden--search", !isVisible);

		return isVisible;
	}
}
RangeFilter._DEFAULT_UI_META = {
	isUseDropdowns: false,
};
