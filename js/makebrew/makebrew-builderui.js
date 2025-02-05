import {DiceConvert} from "../converter/converterutils-tags.js";

export class BuilderUi {
	static __setProp (toVal, options, state, ...path) {
		if (path.length > 1) {
			let cur = state;
			for (let i = 0; i < path.length - 1; ++i) cur = state[path[i]];

			if (toVal == null) {
				delete cur[path.last()];
				return null;
			} else return cur[path.last()] = toVal;
		} else {
			if (toVal == null) {
				delete state[path[0]];
				return null;
			} else return state[path[0]] = toVal;
		}
	}

	static fnPostProcessDice (ents) { return ents.map(ent => DiceConvert.getTaggedEntry(ent)); }

	/**
	 *
	 * @param name Row name.
	 * @param [options] Options object.
	 * @param [options.eleType] HTML element to use.
	 * @param [options.isMarked] If a "group" vertical marker should be displayed between the name and the row body.
	 * @param [options.isRow] If the row body should use ve-flex row (instead of ve-flex col).
	 * @param [options.title] Tooltip text.
	 */
	static getLabelledRowTuple (name, options) {
		options = options || {};

		const eleType = options.eleType || "div";

		const $rowInner = $(`<div class="${options.isRow ? "ve-flex" : "ve-flex-col"} w-100"></div>`);
		const $row = $$`<div class="mb-2 mkbru__row stripe-even"><${eleType} class="mkbru__wrp-row ve-flex-v-center"><span class="mr-2 mkbru__row-name ve-shrink-10 ${options.isMarked ? `mkbru__row-name--marked` : ""} ${options.title ? "help" : ""}" ${options.title ? `title="${options.title.qq()}"` : ""}>${name}</span>${options.isMarked ? `<div class="mkbru__row-mark mr-2"></div>` : ""}${$rowInner}</${eleType}></div>`;
		return [$row, $rowInner];
	}

	static __$getRow (name, $ipt, options) {
		options = options || {};

		const eleType = options.eleType || "div";

		return $$`<div class="mb-2 mkbru__row stripe-even"><${eleType} class="mkbru__wrp-row ve-flex-v-center">
		<span class="mr-2 mkbru__row-name ${options.title ? "help" : ""}" ${options.title ? `title="${options.title.qq()}"` : ""}>${name}</span>
		${$ipt}
		<${eleType}/></div>`;
	}

	static $getStateIptString (name, fnRender, state, options, ...path) {
		if (options.nullable == null) options.nullable = true;

		const initialState = MiscUtil.get(state, ...path);
		const $ipt = $(`<input class="form-control input-xs form-control--minimal ${options.type ? `type="${options.type}"` : ""}">`)
			.val(initialState)
			.change(() => {
				const raw = $ipt.val().trim();
				const set = BuilderUi.__setProp(raw || !options.nullable ? raw : null, options, state, ...path);
				fnRender();
				if (options.callback) options.callback(set);
			});
		return BuilderUi.__$getRow(name, $ipt, options);
	}

	/**
	 * @param name
	 * @param fnRender
	 * @param state
	 * @param options
	 * @param [options.nullable]
	 * @param [options.placeholder]
	 * @param [options.withHeader]
	 * @param [options.fnPostProcess]
	 * @param path
	 * @return {*}
	 */
	static $getStateIptEntries (name, fnRender, state, options, ...path) {
		if (options.nullable == null) options.nullable = true;

		let initialState = MiscUtil.get(state, ...path);
		if (options.withHeader && initialState) initialState = initialState[0].entries;

		const $ipt = $(`<textarea class="form-control form-control--minimal resize-vertical" ${options.placeholder ? `placeholder="${options.placeholder}"` : ""}/>`)
			.val(UiUtil.getEntriesAsText(initialState))
			.change(() => {
				const raw = $ipt.val();
				let out = raw || !options.nullable ? UiUtil.getTextAsEntries(raw) : null;

				if (out && options.fnPostProcess) {
					out = options.fnPostProcess(out);
					$ipt.val(UiUtil.getEntriesAsText(out));
				}

				if (options.withHeader && out) {
					out = [
						{
							type: "entries",
							name: options.withHeader,
							entries: out,
						},
					];
				}

				BuilderUi.__setProp(out, options, state, ...path);
				fnRender();
			});
		return BuilderUi.__$getRow(name, $ipt, options);
	}

	static $getStateIptStringArray (name, fnRender, state, options, ...path) {
		if (options.nullable == null) options.nullable = true;

		const [$row, $rowInner] = BuilderUi.getLabelledRowTuple(name, {isMarked: true});
		const initialState = this._$getStateIptStringArray_getInitialState(state, ...path);
		const stringRows = [];

		const doUpdateState = () => {
			const raw = stringRows.map(row => row.getState()).filter(it => it.trim());
			BuilderUi.__setProp(raw.length || !options.nullable ? raw : null, options, state, ...path);
			fnRender();
		};

		const $wrpRows = $(`<div></div>`).appendTo($rowInner);
		initialState.forEach(string => BuilderUi._$getStateIptStringArray_getRow(doUpdateState, stringRows, string).$wrp.appendTo($wrpRows));

		const $wrpBtnAdd = $(`<div></div>`).appendTo($rowInner);
		$(`<button class="ve-btn ve-btn-xs ve-btn-default">Add ${options.shortName}</button>`)
			.appendTo($wrpBtnAdd)
			.click(() => {
				BuilderUi._$getStateIptStringArray_getRow(doUpdateState, stringRows).$wrp.appendTo($wrpRows);
				doUpdateState();
			});

		return $row;
	}

	static _$getStateIptStringArray_getInitialState (state, ...path) {
		const initialState = MiscUtil.get(state, ...path) || [];
		if (initialState == null || initialState instanceof Array) return initialState;
		// Tolerate/"migrate" single-string data, as this is a common change in data structures
		if (typeof initialState === "string") return [initialState];
	}

	static _$getStateIptStringArray_getRow (doUpdateState, stringRows, initialString) {
		const getState = () => $iptString.val().trim();

		const $iptString = $(`<input class="form-control form-control--minimal input-xs mr-2">`)
			.change(() => doUpdateState());
		if (initialString && initialString.trim()) $iptString.val(initialString);

		const $btnRemove = $(`<button class="ve-btn ve-btn-xs ve-btn-danger" title="Remove Row"><span class="glyphicon glyphicon-trash"></span></button>`)
			.click(() => {
				stringRows.splice(stringRows.indexOf(out), 1);
				$wrp.empty().remove();
				doUpdateState();
			});

		const $wrp = $$`<div class="ve-flex-v-center mb-2">${$iptString}${$btnRemove}</div>`;
		const out = {$wrp, getState};
		stringRows.push(out);
		return out;
	}

	static $getStateIptNumber (name, fnRender, state, options, ...path) {
		if (options.nullable == null) options.nullable = true;

		const initialState = MiscUtil.get(state, ...path);
		const $ipt = $(`<input class="form-control input-xs form-control--minimal" ${options.placeholder ? `placeholder="${options.placeholder}"` : ""}>`)
			.val(initialState)
			.change(() => {
				const defaultVal = options.nullable ? null : 0;
				const val = UiUtil.strToInt($ipt.val(), defaultVal, {fallbackOnNaN: defaultVal});
				BuilderUi.__setProp(val, options, state, ...path);
				$ipt.val(val);
				fnRender();
			});
		return BuilderUi.__$getRow(name, $ipt, options);
	}

	/**
	 * @param name
	 * @param fnRender
	 * @param state
	 * @param options Options object.
	 * @param options.nullable
	 * @param options.fnDisplay
	 * @param options.vals
	 * @param path
	 */
	static $getStateIptEnum (name, fnRender, state, options, ...path) {
		if (options.nullable == null) options.nullable = true;

		const initialState = MiscUtil.get(state, ...path);
		const $sel = $(`<select class="form-control input-xs form-control--minimal">`);
		if (options.nullable) $sel.append(`<option value="-1">(None)</option>`);
		options.vals.forEach((v, i) => $(`<option>`).val(i).text(options.fnDisplay ? options.fnDisplay(v) : v).appendTo($sel));
		const ixInitial = options.vals.indexOf(initialState);
		$sel.val(ixInitial)
			.change(() => {
				const ixOut = Number($sel.val());
				const out = ~ixOut ? options.vals[ixOut] : null;
				BuilderUi.__setProp(out, options, state, ...path);
				fnRender();
			});
		return BuilderUi.__$getRow(name, $sel, options);
	}

	static $getStateIptBoolean (name, fnRender, state, options, ...path) {
		if (options.nullable == null) options.nullable = true;

		const initialState = MiscUtil.get(state, ...path);
		const $ipt = $(`<input class="mkbru__ipt-cb" type="checkbox">`)
			.prop("checked", initialState)
			.change(() => {
				// assumes false => null, unless not nullable
				const raw = !!$ipt.prop("checked");
				BuilderUi.__setProp(raw || !options.nullable ? raw : null, options, state, ...path);
				fnRender();
			});
		return BuilderUi.__$getRow(name, $$`<div class="w-100 ve-flex-v-center">${$ipt}</div>`, {...options, eleType: "label"});
	}

	/**
	 * @param name
	 * @param fnRender
	 * @param state
	 * @param options
	 * @param options.vals
	 * @param [options.nullable]
	 * @param [options.fnDisplay]
	 * @param path
	 * @return {*}
	 */
	static $getStateIptBooleanArray (name, fnRender, state, options, ...path) {
		if (options.nullable == null) options.nullable = true;
		const [$row, $rowInner] = BuilderUi.getLabelledRowTuple(name, {isMarked: true});

		const initialState = MiscUtil.get(state, ...path) || [];
		const $wrpIpts = $(`<div class="ve-flex-col w-100 mr-2"></div>`).appendTo($rowInner);
		const inputs = [];
		options.vals.forEach(val => {
			const $cb = $(`<input class="mkbru__ipt-cb" type="checkbox">`)
				.prop("checked", initialState.includes(val))
				.change(() => {
					BuilderUi.__setProp(getState(), options, state, ...path);
					fnRender();
				});
			inputs.push({$ipt: $cb, val});
			$$`<label class="ve-flex-v-center split stripe-odd--faint"><span>${options.fnDisplay ? options.fnDisplay(val) : val}</span>${$cb}</label>`.appendTo($wrpIpts);
		});

		const getState = () => {
			const raw = inputs.map(it => it.$ipt.prop("checked") ? it.val : false).filter(Boolean);
			return raw.length || !options.nullable ? raw : null;
		};

		return $row;
	}

	/**
	 * @param $ipt The input to sort.
	 * @param cb Callback function.
	 * @param sortOptions Sort order options.
	 * @param sortOptions.bottom Regex patterns that, should a token match, that token should be sorted to the end. Warning: slow.
	 */
	static $getSplitCommasSortButton ($ipt, cb, sortOptions) {
		sortOptions = sortOptions || {};
		return $(`<button class="ve-btn ve-btn-xs ve-btn-default">Sort</button>`)
			.click(() => {
				const spl = $ipt.val().split(StrUtil.COMMAS_NOT_IN_PARENTHESES_REGEX);
				$ipt.val(spl.sort((a, b) => {
					if (sortOptions.bottom) {
						const ixA = sortOptions.bottom.findIndex(re => {
							const m = re.test(a);
							re.lastIndex = 0;
							return m;
						});
						const ixB = sortOptions.bottom.findIndex(re => {
							const m = re.test(b);
							re.lastIndex = 0;
							return m;
						});

						if (~ixA && ~ixB) return 0;
						else if (~ixA) return 1;
						else if (~ixB) return -1;
						else return SortUtil.ascSortLower(a, b);
					} else return SortUtil.ascSortLower(a, b);
				}).join(", "));
				cb();
			});
	}

	static $getUpButton (cbUpdate, rows, myRow) {
		return $(`<button class="ve-btn ve-btn-xs ve-btn-default mkbru__btn-up-row ml-2" title="Move Up"><span class="glyphicon glyphicon-arrow-up"></span></button>`)
			.click(() => {
				const ix = rows.indexOf(myRow);
				const cache = rows[ix - 1];
				rows[ix - 1] = myRow;
				rows[ix] = cache;
				cbUpdate();
			});
	}

	static $getDownButton (cbUpdate, rows, myRow) {
		return $(`<button class="ve-btn ve-btn-xs ve-btn-default mkbru__btn-down-row ml-2" title="Move Down"><span class="glyphicon glyphicon-arrow-down"></span></button>`)
			.click(() => {
				const ix = rows.indexOf(myRow);
				const cache = rows[ix + 1];
				rows[ix + 1] = myRow;
				rows[ix] = cache;
				cbUpdate();
			});
	}

	// FIXME refactor this to use one of the variant in utils-ui
	static $getDragPad (cbUpdate, rows, myRow, options) {
		const dragMeta = {};
		const doDragCleanup = () => {
			dragMeta.on = false;
			dragMeta.$wrap.remove();
			dragMeta.$dummies.forEach($d => $d.remove());
			$(document.body).off(`mouseup.drag__stop`);
		};

		const doDragRender = () => {
			if (dragMeta.on) doDragCleanup();

			$(document.body).on(`mouseup.drag__stop`, () => {
				if (dragMeta.on) doDragCleanup();
			});

			dragMeta.on = true;
			dragMeta.$wrap = $(`<div class="ve-flex-col ui-drag__wrp-drag-block"></div>`).appendTo(options.$wrpRowsOuter);
			dragMeta.$dummies = [];

			const ixRow = rows.indexOf(myRow);

			rows.forEach((row, i) => {
				const dimensions = {w: row.$ele.outerWidth(), h: row.$ele.outerHeight()};
				const $dummy = $(`<div class="${i === ixRow ? "ui-drag__wrp-drag-dummy--highlight" : "ui-drag__wrp-drag-dummy--lowlight"}"></div>`)
					.width(dimensions.w).height(dimensions.h)
					.mouseup(() => {
						if (dragMeta.on) {
							doDragCleanup();
						}
					})
					.appendTo(dragMeta.$wrap);
				dragMeta.$dummies.push($dummy);

				if (i !== ixRow) { // on entering other areas, swap positions
					$dummy.mouseenter(() => {
						const cache = rows[i];
						rows[i] = myRow;
						rows[ixRow] = cache;

						if (options.cbSwap) options.cbSwap(cache);

						cbUpdate();
						doDragRender();
					});
				}
			});
		};

		return $(`<div class="ml-2 ui-drag__patch" title="Drag to Reorder">
		<div class="ui-drag__patch-col"><div>&#8729</div><div>&#8729</div><div>&#8729</div></div>
		<div class="ui-drag__patch-col"><div>&#8729</div><div>&#8729</div><div>&#8729</div></div>
		</div>`).mousedown(() => doDragRender());
	}
}

export class PageUiUtil {
	static $getSideMenuDivider (heavy) {
		return $(`<hr class="w-100 hr-2 sidemenu__row__divider ${heavy ? "sidemenu__row__divider--heavy" : ""}">`);
	}
}
