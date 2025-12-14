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

		const rowInner = ee`<div class="${options.isRow ? "ve-flex" : "ve-flex-col"} w-100"></div>`;
		const row = ee`<div class="mb-2 mkbru__row stripe-even"><${eleType} class="mkbru__wrp-row ve-flex-v-center"><span class="mr-2 mkbru__row-name ${options.isMarked ? `mkbru__row-name--marked` : ""} ${options.title ? "help" : ""}" ${options.title ? `title="${options.title.qq()}"` : ""}>${name}</span>${options.isMarked ? `<div class="mkbru__row-mark mr-2"></div>` : ""}${rowInner}</${eleType}></div>`;
		return [row, rowInner];
	}

	static __getRow (name, ipt, options) {
		options = options || {};

		const eleType = options.eleType || "div";

		return ee`<div class="mb-2 mkbru__row stripe-even"><${eleType} class="mkbru__wrp-row ve-flex-v-center">
		<span class="mr-2 mkbru__row-name ${options.title ? "help" : ""}" ${options.title ? `title="${options.title.qq()}"` : ""}>${name}</span>
		${ipt}
		<${eleType}/></div>`;
	}

	static getStateIptString (name, fnRender, state, options, ...path) {
		if (options.nullable == null) options.nullable = true;

		const initialState = MiscUtil.get(state, ...path);
		const ipt = ee`<input class="form-control input-xs form-control--minimal ${options.type ? `type="${options.type}"` : ""}">`
			.val(initialState || null)
			.onn("change", () => {
				const raw = ipt.val().trim();
				const set = BuilderUi.__setProp(raw || !options.nullable ? raw : null, options, state, ...path);
				fnRender();
				if (options.callback) options.callback(set);
			});
		return BuilderUi.__getRow(name, ipt, options);
	}

	/**
	 * @param name
	 * @param fnRender
	 * @param state
	 * @param options
	 * @param [options.nullable]
	 * @param [options.placeholder]
	 * @param [options.withHeader]
	 * @param [options.fnGetHeader]
	 * @param [options.fnPostProcess]
	 * @param [options.asMeta]
	 * @param path
	 * @return {*}
	 */
	static getStateIptEntries (name, fnRender, state, options, ...path) {
		if (options.withHeader && options.fnGetHeader) throw new Error(`"withHeader" and "fnGetHeader" are mutually exclusive!`);

		if (options.nullable == null) options.nullable = true;

		let initialState = MiscUtil.get(state, ...path);
		if ((options.withHeader || options.fnGetHeader) && initialState) initialState = initialState[0].entries;

		const onChange = () => {
			const raw = ipt.val();
			let out = raw || !options.nullable ? UiUtil.getTextAsEntries(raw) : null;

			if (out && options.fnPostProcess) {
				out = options.fnPostProcess(out);
				ipt.val(UiUtil.getEntriesAsText(out));
			}

			if (
				(options.withHeader || options.fnGetHeader)
				&& out
			) {
				const name = options.withHeader || options.fnGetHeader(state);
				out = [
					{
						type: "entries",
						name,
						entries: out,
					},
				];
			}

			BuilderUi.__setProp(out, options, state, ...path);
			fnRender();
		};

		const ipt = ee`<textarea class="form-control form-control--minimal resize-vertical" ${options.placeholder ? `placeholder="${options.placeholder}"` : ""}/>`
			.val(UiUtil.getEntriesAsText(initialState))
			.onn("change", () => onChange());

		const row = BuilderUi.__getRow(name, ipt, options);
		if (options.asMeta) {
			return {
				row,
				onChange,
			};
		}
		return row;
	}

	static getStateIptStringArray (name, fnRender, state, options, ...path) {
		if (options.nullable == null) options.nullable = true;

		const [row, rowInner] = BuilderUi.getLabelledRowTuple(name, {isMarked: true});
		const initialState = this._getStateIptStringArray_getInitialState(state, ...path);
		const stringRows = [];

		const doUpdateState = () => {
			const raw = stringRows.map(row => row.getState()).filter(it => it.trim());
			BuilderUi.__setProp(raw.length || !options.nullable ? raw : null, options, state, ...path);
			fnRender();
		};

		const wrpRows = ee`<div></div>`.appendTo(rowInner);
		initialState.forEach(string => BuilderUi._getStateIptStringArray_getRow(doUpdateState, stringRows, string).wrp.appendTo(wrpRows));

		const wrpBtnAdd = ee`<div></div>`.appendTo(rowInner);
		ee`<button class="ve-btn ve-btn-xs ve-btn-default">Add ${options.shortName}</button>`
			.appendTo(wrpBtnAdd)
			.onn("click", () => {
				BuilderUi._getStateIptStringArray_getRow(doUpdateState, stringRows).wrp.appendTo(wrpRows);
				doUpdateState();
			});

		return row;
	}

	static _getStateIptStringArray_getInitialState (state, ...path) {
		const initialState = MiscUtil.get(state, ...path) || [];
		if (initialState == null || initialState instanceof Array) return initialState;
		// Tolerate/"migrate" single-string data, as this is a common change in data structures
		if (typeof initialState === "string") return [initialState];
	}

	static _getStateIptStringArray_getRow (doUpdateState, stringRows, initialString) {
		const getState = () => iptString.val().trim();

		const iptString = ee`<input class="form-control form-control--minimal input-xs mr-2">`
			.onn("change", () => doUpdateState());
		if (initialString && initialString.trim()) iptString.val(initialString);

		const btnRemove = ee`<button class="ve-btn ve-btn-xs ve-btn-danger" title="Remove Row"><span class="glyphicon glyphicon-trash"></span></button>`
			.onn("click", () => {
				stringRows.splice(stringRows.indexOf(out), 1);
				wrp.empty().remove();
				doUpdateState();
			});

		const wrp = ee`<div class="ve-flex-v-center mb-2">${iptString}${btnRemove}</div>`;
		const out = {wrp, getState};
		stringRows.push(out);
		return out;
	}

	static getStateIptNumber (name, fnRender, state, options, ...path) {
		if (options.nullable == null) options.nullable = true;

		const initialState = MiscUtil.get(state, ...path);
		const ipt = ee`<input class="form-control input-xs form-control--minimal" ${options.placeholder ? `placeholder="${options.placeholder}"` : ""}>`
			.val(initialState || null)
			.onn("change", () => {
				const defaultVal = options.nullable ? null : 0;
				const val = UiUtil.strToInt(ipt.val(), defaultVal, {fallbackOnNaN: defaultVal});
				BuilderUi.__setProp(val, options, state, ...path);
				ipt.val(val);
				fnRender();
			});
		return BuilderUi.__getRow(name, ipt, options);
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
	static getStateIptEnum (name, fnRender, state, options, ...path) {
		if (options.nullable == null) options.nullable = true;

		const initialState = MiscUtil.get(state, ...path);
		const sel = ee`<select class="form-control input-xs form-control--minimal">`;
		if (options.nullable) sel.appends(`<option value="-1">(None)</option>`);
		options.vals.forEach((v, i) => sel.appends(`<option value="${i}">${(options.fnDisplay ? options.fnDisplay(v) : v).qq()}</option>`));
		const ixInitial = options.vals.indexOf(initialState || null);
		sel.val(`${ixInitial}`)
			.onn("change", () => {
				const ixOut = Number(sel.val());
				const out = ~ixOut ? options.vals[ixOut] : null;
				BuilderUi.__setProp(out, options, state, ...path);
				fnRender();
			});
		return BuilderUi.__getRow(name, sel, options);
	}

	static getStateIptBoolean (name, fnRender, state, options, ...path) {
		if (options.nullable == null) options.nullable = true;

		const initialState = MiscUtil.get(state, ...path);
		const ipt = ee`<input class="mkbru__ipt-cb" type="checkbox">`
			.prop("checked", !!initialState)
			.onn("change", () => {
				// assumes false => null, unless not nullable
				const raw = !!ipt.prop("checked");
				BuilderUi.__setProp(raw || !options.nullable ? raw : null, options, state, ...path);
				fnRender();
			});
		return BuilderUi.__getRow(name, ee`<div class="w-100 ve-flex-v-center">${ipt}</div>`, {...options, eleType: "label"});
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
	static getStateIptBooleanArray (name, fnRender, state, options, ...path) {
		if (options.nullable == null) options.nullable = true;
		const [row, rowInner] = BuilderUi.getLabelledRowTuple(name, {isMarked: true});

		const initialState = MiscUtil.get(state, ...path) || [];
		const wrpIpts = ee`<div class="ve-flex-col w-100 mr-2"></div>`.appendTo(rowInner);
		const inputs = [];
		options.vals.forEach(val => {
			const cb = ee`<input class="mkbru__ipt-cb" type="checkbox">`
				.prop("checked", initialState.includes(val))
				.onn("change", () => {
					BuilderUi.__setProp(getState(), options, state, ...path);
					fnRender();
				});
			inputs.push({ipt: cb, val});
			ee`<label class="ve-flex-v-center split stripe-odd--faint"><span>${options.fnDisplay ? options.fnDisplay(val) : val}</span>${cb}</label>`.appendTo(wrpIpts);
		});

		const getState = () => {
			const raw = inputs.map(it => it.ipt.prop("checked") ? it.val : false).filter(Boolean);
			return raw.length || !options.nullable ? raw : null;
		};

		return row;
	}

	/**
	 * @param ipt The input to sort.
	 * @param cb Callback function.
	 * @param sortOptions Sort order options.
	 * @param sortOptions.bottom Regex patterns that, should a token match, that token should be sorted to the end. Warning: slow.
	 */
	static getSplitCommasSortButton (ipt, cb, sortOptions = null) {
		sortOptions = sortOptions || {};
		return ee`<button class="ve-btn ve-btn-xs ve-btn-default">Sort</button>`
			.onn("click", () => {
				const spl = ipt.val().split(StrUtil.COMMAS_NOT_IN_PARENTHESES_REGEX);
				ipt.val(spl.sort((a, b) => {
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

	static getUpButton (cbUpdate, rows, myRow) {
		return ee`<button class="ve-btn ve-btn-xs ve-btn-default mkbru__btn-up-row ml-2" title="Move Up"><span class="glyphicon glyphicon-arrow-up"></span></button>`
			.onn("click", () => {
				const ix = rows.indexOf(myRow);
				const cache = rows[ix - 1];
				rows[ix - 1] = myRow;
				rows[ix] = cache;
				cbUpdate();
			});
	}

	static getDownButton (cbUpdate, rows, myRow) {
		return ee`<button class="ve-btn ve-btn-xs ve-btn-default mkbru__btn-down-row ml-2" title="Move Down"><span class="glyphicon glyphicon-arrow-down"></span></button>`
			.onn("click", () => {
				const ix = rows.indexOf(myRow);
				const cache = rows[ix + 1];
				rows[ix + 1] = myRow;
				rows[ix] = cache;
				cbUpdate();
			});
	}

	// FIXME refactor this to use one of the variant in utils-ui
	static getDragPad (cbUpdate, rows, myRow, options) {
		const dragMeta = {};
		const doDragCleanup = () => {
			dragMeta.on = false;
			dragMeta.wrap.remove();
			dragMeta.dummies.forEach(eleD => eleD.remove());
			e_(document.body).off(`mouseup`, dragMeta.onMouseup);
		};

		const doDragRender = () => {
			if (dragMeta.on) doDragCleanup();

			const onMouseup = () => {
				if (dragMeta.on) doDragCleanup();
			};
			dragMeta.onMouseup = onMouseup;

			e_(document.body).onn(`mouseup`, onMouseup);

			dragMeta.on = true;
			dragMeta.wrap = ee`<div class="ve-flex-col ui-drag__wrp-drag-block"></div>`.appendTo(options.wrpRowsOuter);
			dragMeta.dummies = [];

			const ixRow = rows.indexOf(myRow);

			rows.forEach((row, i) => {
				const dimensions = {w: row.ele.outerWidthe(), h: row.ele.outerHeighte()};
				const eleDummy = ee`<div class="${i === ixRow ? "ui-drag__wrp-drag-dummy--highlight" : "ui-drag__wrp-drag-dummy--lowlight"}"></div>`
					.css({
						width: `${dimensions.w}px`,
						height: `${dimensions.h}px`,
					})
					.onn("mouseup", () => {
						if (dragMeta.on) {
							doDragCleanup();
						}
					})
					.appendTo(dragMeta.wrap);
				dragMeta.dummies.push(eleDummy);

				if (i !== ixRow) { // on entering other areas, swap positions
					eleDummy.onn("mouseenter", () => {
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

		return ee`<div class="ml-2 ui-drag__patch" title="Drag to Reorder">
			<div class="ui-drag__patch-col"><div>&#8729</div><div>&#8729</div><div>&#8729</div></div>
			<div class="ui-drag__patch-col"><div>&#8729</div><div>&#8729</div><div>&#8729</div></div>
		</div>`
			.onn("mousedown", () => doDragRender());
	}
}

export class PageUiUtil {
	static getSideMenuDivider (heavy) {
		return ee`<hr class="w-100 hr-2 sidemenu__row__divider ${heavy ? "sidemenu__row__divider--heavy" : ""}">`;
	}
}
