import {Filter} from "./filter-filter-generic.js";
import {PILL_STATE__IGNORE, PILL_STATE__NO, PILL_STATE__YES} from "../filter-constants.js";

export class SearchableFilter extends Filter {
	constructor (opts) {
		super(opts);

		this._compSearch = BaseComponent.fromObject({
			search: "",
			searchTermParent: "",
		});
	}

	handleSearch (searchTerm) {
		const out = super.handleSearch(searchTerm);

		this._compSearch._state.searchTermParent = searchTerm;

		return out;
	}

	_getPill (item) {
		const btnPill = super._getPill(item);

		const hkIsVisible = () => {
			if (this._compSearch._state.searchTermParent) return btnPill.toggleClass("fltr__hidden--inactive", false);

			btnPill.toggleClass("fltr__hidden--inactive", this._state[item.item] === PILL_STATE__IGNORE);
		};
		this._addHook("state", item.item, hkIsVisible);
		this._compSearch._addHookBase("searchTermParent", hkIsVisible);
		hkIsVisible();

		return btnPill;
	}

	_getPill_handleClick ({evt, item}) {
		if (this._compSearch._state.searchTermParent) return super._getPill_handleClick({evt, item});

		this._state[item.item] = PILL_STATE__IGNORE;
	}

	_getPill_handleContextmenu ({evt, item}) {
		if (this._compSearch._state.searchTermParent) return super._getPill_handleContextmenu({evt, item});

		evt.preventDefault();
		this._state[item.item] = PILL_STATE__IGNORE;
	}

	_render_getRowBtn ({fnsCleanup, iptSearch, item, subtype, state}) {
		const handleClick = evt => {
			evt.stopPropagation();
			evt.preventDefault();

			// Keep the dropdown open
			iptSearch.focuse();

			if (evt.shiftKey) {
				this._doSetPillsClear();
			}

			if (this._state[item.item] === state) this._state[item.item] = PILL_STATE__IGNORE;
			else this._state[item.item] = state;
		};

		const btn = e_({
			tag: "div",
			clazz: `no-shrink clickable fltr-search__btn-activate fltr-search__btn-activate--${subtype} ve-flex-vh-center`,
			click: evt => handleClick(evt),
			contextmenu: evt => handleClick(evt),
			mousedown: evt => {
				evt.stopPropagation();
				evt.preventDefault();
			},
		});

		const hkIsActive = () => {
			btn.innerText = this._state[item.item] === state ? "×" : "";
		};
		this._addHookBase(item.item, hkIsActive);
		hkIsActive();
		fnsCleanup.push(() => this._removeHookBase(item.item, hkIsActive));

		return btn;
	}

	render (opts) {
		const out = super.render(opts);

		const iptSearch = ComponentUiUtil.getIptStr(
			this._compSearch,
			"search",
			{
				html: `<input class="form-control form-control--minimal input-xs" placeholder="Search...">`,
			},
		);

		const wrpValues = e_({
			tag: "div",
			clazz: "ve-overflow-y-auto bt-0 absolute fltr-search__wrp-values",
		});

		const fnsCleanup = [];
		const rowMetas = [];

		this._render_bindSearchHandler_keydown({iptSearch, fnsCleanup, rowMetas});
		this._render_bindSearchHandler_focus({iptSearch, fnsCleanup, rowMetas, wrpValues});
		this._render_bindSearchHandler_blur({iptSearch});

		const wrp = ee`<div class="fltr-search__wrp-search ve-flex-col relative mt-1 mx-2p mb-1">
			${iptSearch}
			${wrpValues}
		</div>`.prependTo(this.__wrpPills);

		const hkParentSearch = () => {
			wrp.toggleVe(!this._compSearch._state.searchTermParent);
		};
		this._compSearch._addHookBase("searchTermParent", hkParentSearch);
		hkParentSearch();

		return out;
	}

	_render_bindSearchHandler_keydown ({iptSearch, rowMetas}) {
		iptSearch
			.onn("keydown", evt => {
				switch (evt.key) {
					case "Escape": evt.stopPropagation(); return iptSearch.blur();

					case "ArrowDown": {
						evt.preventDefault();
						const visibleRowMetas = rowMetas.filter(it => it.isVisible);
						if (!visibleRowMetas.length) return;
						visibleRowMetas[0].row.focus();
						break;
					}

					case "Enter": {
						const visibleRowMetas = rowMetas.filter(it => it.isVisible);
						if (!visibleRowMetas.length) return;
						if (evt.shiftKey) this._doSetPillsClear();
						this._state[visibleRowMetas[0].item.item] = (EventUtil.isCtrlMetaKey(evt)) ? PILL_STATE__NO : PILL_STATE__YES;
						iptSearch.blure();
						break;
					}
				}
			});
	}

	_render_bindSearchHandler_focus ({iptSearch, fnsCleanup, rowMetas, wrpValues}) {
		iptSearch
			.onn("focus", () => {
				fnsCleanup
					.splice(0, fnsCleanup.length)
					.forEach(fn => fn());

				rowMetas.splice(0, rowMetas.length);

				wrpValues.innerHTML = "";

				rowMetas.push(
					...this._items
						.map(item => this._render_bindSearchHandler_focus_getRowMeta({iptSearch, fnsCleanup, rowMetas, wrpValues, item})),
				);

				this._render_bindSearchHandler_focus_addHookSearch({rowMetas, fnsCleanup});

				wrpValues.scrollIntoView({block: "nearest", inline: "nearest"});
			});
	}

	_render_bindSearchHandler_focus_getRowMeta ({iptSearch, fnsCleanup, rowMetas, wrpValues, item}) {
		const dispName = this._getDisplayText(item);

		const eleName = e_({
			tag: "div",
			clazz: "fltr-search__disp-name ml-2",
		});

		const btnBlue = this._render_getRowBtn({
			fnsCleanup,
			iptSearch,
			item,
			subtype: "yes",
			state: PILL_STATE__YES,
		});
		btnBlue.addClass("br-0");
		btnBlue.addClass("btr-0");
		btnBlue.addClass("bbr-0");

		const btnRed = this._render_getRowBtn({
			fnsCleanup,
			iptSearch,
			item,
			subtype: "no",
			state: PILL_STATE__NO,
		});
		btnRed.addClass("bl-0");
		btnRed.addClass("btl-0");
		btnRed.addClass("bbl-0");

		const row = e_({
			tag: "div",
			clazz: "py-1p px-2 ve-flex-v-center fltr-search__wrp-row",
			children: [
				btnBlue,
				btnRed,
				eleName,
			],
			attrs: {
				tabindex: "0",
			},
			keydown: evt => {
				switch (evt.key) {
					case "Escape": evt.stopPropagation(); return row.blur();

					case "ArrowDown": {
						evt.preventDefault();
						const visibleRowMetas = rowMetas.filter(it => it.isVisible);
						if (!visibleRowMetas.length) return;
						const ixCur = visibleRowMetas.indexOf(out);
						const nxt = visibleRowMetas[ixCur + 1];
						if (nxt) nxt.row.focus();
						break;
					}

					case "ArrowUp": {
						evt.preventDefault();
						const visibleRowMetas = rowMetas.filter(it => it.isVisible);
						if (!visibleRowMetas.length) return;
						const ixCur = visibleRowMetas.indexOf(out);
						const prev = visibleRowMetas[ixCur - 1];
						if (prev) return prev.row.focus();
						iptSearch.focuse();
						break;
					}

					case "Enter": {
						if (evt.shiftKey) this._doSetPillsClear();
						this._state[item.item] = (EventUtil.isCtrlMetaKey(evt)) ? PILL_STATE__NO : PILL_STATE__YES;
						row.blur();
						break;
					}
				}
			},
		});

		wrpValues.appendChild(row);

		const out = {
			isVisible: true,
			item,
			row,
			dispName,
			eleName,
		};

		return out;
	}

	_render_bindSearchHandler_focus_addHookSearch ({rowMetas, fnsCleanup}) {
		const hkSearch = () => {
			const searchTerm = this._compSearch._state.search.toLowerCase();

			rowMetas.forEach(({item, row}) => {
				row.isVisible = item.searchText.includes(searchTerm);
				row.toggleVe(row.isVisible);
			});

			// region Underline matching part
			if (!this._compSearch._state.search) {
				rowMetas.forEach(({dispName, eleName}) => eleName.textContent = dispName);
				return;
			}

			const re = new RegExp(this._compSearch._state.search.qq().escapeRegexp(), "gi");

			rowMetas.forEach(({dispName, eleName}) => {
				eleName.innerHTML = dispName
					.qq()
					.replace(re, (...m) => `<u>${m[0]}</u>`);
			});
			// endregion
		};
		this._compSearch._addHookBase("search", hkSearch);
		hkSearch();
		fnsCleanup.push(() => this._compSearch._removeHookBase("search", hkSearch));
	}

	_render_bindSearchHandler_blur ({iptSearch}) {
		iptSearch
			.onn("blur", () => {
				this._compSearch._state.search = "";
			});
	}
}
