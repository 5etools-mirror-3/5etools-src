import {FilterBase} from "./filter-filter-base.js";
import {Filter} from "./filter-filter-generic.js";
import {PILL_STATE__IGNORE, PILL_STATE__NO, PILL_STATE__YES, PILL_STATES} from "../filter-constants.js";

export class AbilityScoreFilter extends FilterBase {
	static _MODIFIER_SORT_OFFSET = 10000; // Arbitrarily large value

	constructor (opts) {
		super(opts);

		this._items = [];
		this._isItemsDirty = false;
		this._itemsLookup = {}; // Cache items for fast lookup
		this._seenUids = {};

		this.__$wrpFilter = null;
		this.__wrpPills = null;
		this.__wrpPillsRows = {};
		this.__wrpMiniPills = null;

		this._maxMod = 2;
		this._minMod = 0;

		// region Init state
		Parser.ABIL_ABVS.forEach(ab => {
			const itemAnyIncrease = new AbilityScoreFilter.FilterItem({isAnyIncrease: true, ability: ab});
			const itemAnyDecrease = new AbilityScoreFilter.FilterItem({isAnyDecrease: true, ability: ab});
			this._items.push(itemAnyIncrease, itemAnyDecrease);
			this._itemsLookup[itemAnyIncrease.uid] = itemAnyIncrease;
			this._itemsLookup[itemAnyDecrease.uid] = itemAnyDecrease;
			if (this.__state[itemAnyIncrease.uid] == null) this.__state[itemAnyIncrease.uid] = PILL_STATE__IGNORE;
			if (this.__state[itemAnyDecrease.uid] == null) this.__state[itemAnyDecrease.uid] = PILL_STATE__IGNORE;
		});

		for (let i = this._minMod; i <= this._maxMod; ++i) {
			if (i === 0) continue;
			Parser.ABIL_ABVS.forEach(ab => {
				const item = new AbilityScoreFilter.FilterItem({modifier: i, ability: ab});
				this._items.push(item);
				this._itemsLookup[item.uid] = item;
				if (this.__state[item.uid] == null) this.__state[item.uid] = PILL_STATE__IGNORE;
			});
		}
		// endregion
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
		this.__wrpMiniPills = e_({ele: opts.$wrpMini[0]});

		const wrpControls = this._getHeaderControls(opts);

		this.__wrpPills = e_({tag: "div", clazz: `fltr__wrp-pills ve-overflow-x-auto ve-flex-col w-100`});
		const hook = () => this.__wrpPills.toggleVe(!this._uiMeta.isHidden);
		this._addHook("uiMeta", "isHidden", hook);
		hook();

		this._doRenderPills();

		// FIXME refactor this so we're not stealing the private method
		const btnMobToggleControls = Filter.prototype._getBtnMobToggleControls.bind(this)(wrpControls);

		this.__$wrpFilter = $$`<div>
			${opts.isFirst ? "" : `<div class="fltr__dropdown-divider ${opts.isMulti ? "fltr__dropdown-divider--indented" : ""} mb-1"></div>`}
			<div class="split fltr__h mb-1">
				<div class="ml-2 fltr__h-text ve-flex-h-center">${opts.isMulti ? `<span class="mr-2">\u2212</span>` : ""}${this._getRenderedHeader()}${btnMobToggleControls}</div>
				${wrpControls}
			</div>
			${this.__wrpPills}
		</div>`;

		this.update(); // Force an update, to properly mute/unmute our pills

		return this.__$wrpFilter;
	}

	_getHeaderControls (opts) {
		const btnClear = e_({
			tag: "button",
			clazz: `ve-btn ve-btn-default ${opts.isMulti ? "ve-btn-xxs" : "ve-btn-xs"} fltr__h-btn--clear w-100`,
			click: () => this._doSetPillsClear(),
			html: "Clear",
		});

		const wrpStateBtnsOuter = e_({
			tag: "div",
			clazz: "ve-flex-v-center fltr__h-wrp-state-btns-outer",
			children: [
				e_({
					tag: "div",
					clazz: "ve-btn-group ve-flex-v-center w-100",
					children: [
						btnClear,
					],
				}),
			],
		});

		const wrpSummary = e_({tag: "div", clazz: "ve-flex-vh-center ve-hidden"});

		const btnShowHide = this._getBtnShowHide({isMulti: opts.isMulti});
		const hkIsHidden = () => {
			e_({ele: btnShowHide}).toggleClass("active", this._uiMeta.isHidden);
			wrpStateBtnsOuter.toggleVe(!this._uiMeta.isHidden);

			// Skip updating renders if results would be invisible
			if (!this._uiMeta.isHidden) return;

			// TODO
			// region Render summary
			const cur = this.getValues()[this.header];

			const htmlSummary = [
				cur._totals?.yes
					? `<span class="fltr__summary_item fltr__summary_item--include" title="${cur._totals.yes} hidden &quot;required&quot; tags">${cur._totals.yes}</span>`
					: null,
			].filter(Boolean).join("");
			e_({ele: wrpSummary, html: htmlSummary}).toggleVe(this._uiMeta.isHidden);
			// endregion
		};
		this._addHook("uiMeta", "isHidden", hkIsHidden);
		this._addHookAll("state", hkIsHidden);
		hkIsHidden();

		return e_({
			tag: "div",
			clazz: `ve-flex-v-center fltr__h-wrp-btns-outer`,
			children: [
				wrpSummary,
				wrpStateBtnsOuter,
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
	}

	_doRenderPills () {
		this._items.sort(this.constructor._ascSortItems.bind(this.constructor));

		if (!this.__wrpPills) return;
		this._items.forEach(it => {
			if (!it.rendered) it.rendered = this._getPill(it);
			if (!it.isAnyIncrease && !it.isAnyDecrease) it.rendered.toggleClass("fltr__pill--muted", !this._seenUids[it.uid]);

			if (!this.__wrpPillsRows[it.ability]) {
				this.__wrpPillsRows[it.ability] = {
					row: e_({
						tag: "div",
						clazz: "ve-flex-v-center w-100 my-1",
						children: [
							e_({
								tag: "div",
								clazz: "mr-3 ve-text-right fltr__label-ability-score no-shrink no-grow",
								text: Parser.attAbvToFull(it.ability),
							}),
						],
					}).appendTo(this.__wrpPills),
					searchText: Parser.attAbvToFull(it.ability).toLowerCase(),
				};
			}

			it.rendered.appendTo(this.__wrpPillsRows[it.ability].row);
		});
	}

	_getPill (item) {
		const unsetRow = () => {
			const nxtState = {};
			for (let i = this._minMod; i <= this._maxMod; ++i) {
				if (!i || i === item.modifier) continue;
				const siblingUid = AbilityScoreFilter.FilterItem.getUid_({ability: item.ability, modifier: i});
				nxtState[siblingUid] = PILL_STATE__IGNORE;
			}

			if (!item.isAnyIncrease) nxtState[AbilityScoreFilter.FilterItem.getUid_({ability: item.ability, isAnyIncrease: true})] = PILL_STATE__IGNORE;
			if (!item.isAnyDecrease) nxtState[AbilityScoreFilter.FilterItem.getUid_({ability: item.ability, isAnyDecrease: true})] = PILL_STATE__IGNORE;

			this._proxyAssignSimple("state", nxtState);
		};

		const btnPill = e_({
			tag: "div",
			clazz: `fltr__pill fltr__pill--ability-bonus px-2`,
			html: item.getPillDisplayHtml(),
			click: evt => {
				if (evt.shiftKey) {
					const nxtState = {};
					Object.keys(this._state).forEach(k => nxtState[k] = PILL_STATE__IGNORE);
					this._proxyAssign("state", "_state", "__state", nxtState, true);
				}

				this._state[item.uid] = this._state[item.uid] ? PILL_STATE__IGNORE : PILL_STATE__YES;
				if (this._state[item.uid]) unsetRow();
			},
			contextmenu: (evt) => {
				evt.preventDefault();

				this._state[item.uid] = this._state[item.uid] ? PILL_STATE__IGNORE : PILL_STATE__YES;
				if (this._state[item.uid]) unsetRow();
			},
		});

		const hook = () => {
			const val = PILL_STATES[this._state[item.uid] || PILL_STATE__IGNORE];
			btnPill.attr("data-state", val);
		};
		this._addHook("state", item.uid, hook);
		hook();

		return btnPill;
	}

	_doRenderMiniPills () {
		// create a list view so we can freely sort
		this._items.slice(0)
			.sort(this.constructor._ascSortMiniPills.bind(this.constructor))
			.forEach(it => {
				// re-append existing elements to sort them
				(it.btnMini = it.btnMini || this._getBtnMini(it)).appendTo(this.__wrpMiniPills);
			});
	}

	_getBtnMini (item) {
		const btnMini = e_({
			tag: "div",
			clazz: `fltr__mini-pill ${this._filterBox.isMinisHidden(this.header) ? "ve-hidden" : ""}`,
			text: item.getMiniPillDisplayText(),
			title: `Filter: ${this._getHeaderDisplayName()}`,
			click: () => {
				this._state[item.uid] = PILL_STATE__IGNORE;
				this._filterBox.fireChangeEvent();
			},
		}).attr("data-state", PILL_STATES[this._state[item.uid] || PILL_STATE__IGNORE]);

		const hook = () => btnMini.attr("data-state", PILL_STATES[this._state[item.uid] || PILL_STATE__IGNORE]);
		this._addHook("state", item.uid, hook);

		const hideHook = () => btnMini.toggleClass("ve-hidden", this._filterBox.isMinisHidden(this.header));
		this._filterBox.registerMinisHiddenHook(this.header, hideHook);

		return btnMini;
	}

	static _ascSortItems (a, b) {
		return SortUtil.ascSort(Number(b.isAnyIncrease), Number(a.isAnyIncrease))
			|| SortUtil.ascSortAtts(a.ability, b.ability)
			// Offset ability scores to ensure they're all in positive space. This forces the "any decrease" section to
			//   appear last.
			|| SortUtil.ascSort(b.modifier ? b.modifier + AbilityScoreFilter._MODIFIER_SORT_OFFSET : b.modifier, a.modifier ? a.modifier + AbilityScoreFilter._MODIFIER_SORT_OFFSET : a.modifier)
			|| SortUtil.ascSort(Number(b.isAnyDecrease), Number(a.isAnyDecrease));
	}

	static _ascSortMiniPills (a, b) {
		return SortUtil.ascSort(Number(b.isAnyIncrease), Number(a.isAnyIncrease))
			|| SortUtil.ascSort(Number(b.isAnyDecrease), Number(a.isAnyDecrease))
			// Offset ability scores to ensure they're all in positive space. This forces the "any decrease" section to
			//   appear last.
			|| SortUtil.ascSort(b.modifier ? b.modifier + AbilityScoreFilter._MODIFIER_SORT_OFFSET : b.modifier, a.modifier ? a.modifier + AbilityScoreFilter._MODIFIER_SORT_OFFSET : a.modifier)
			|| SortUtil.ascSortAtts(a.ability, b.ability);
	}

	/**
	 * @param opts Options.
	 * @param opts.filterBox The FilterBox to which this filter is attached.
	 * @param opts.isFirst True if this is visually the first filter in the box.
	 * @param opts.$wrpMini The form mini-view element.
	 * @param opts.isMulti The name of the MultiFilter this filter belongs to, if any.
	 */
	$renderMinis (opts) {
		this._filterBox = opts.filterBox;
		this.__wrpMiniPills = e_({ele: opts.$wrpMini[0]});

		this._doRenderMiniPills();
	}

	getValues ({nxtState = null} = {}) {
		const out = {
			_totals: {yes: 0},
		};

		const state = nxtState?.[this.header]?.state || this.__state;

		Object.entries(state)
			.filter(([, value]) => value)
			.forEach(([uid]) => {
				out._totals.yes++;
				out[uid] = true;
			});

		return {[this.header]: out};
	}

	_mutNextState_reset ({nxtState, isResetAll = false}) {
		Object.keys(nxtState[this.header].state).forEach(k => delete nxtState[this.header].state[k]);
	}

	update () {
		if (this._isItemsDirty) {
			this._isItemsDirty = false;

			this._doRenderPills();
		}

		// always render the mini-pills, to ensure the overall order in the grid stays correct (shared between multiple filters)
		this._doRenderMiniPills();
	}

	_doSetPillsClear () {
		Object.keys(this._state).forEach(k => {
			if (this._state[k] !== PILL_STATE__IGNORE) this._state[k] = PILL_STATE__IGNORE;
		});
	}

	toDisplay (boxState, entryVal) {
		const filterState = boxState[this.header];
		if (!filterState) return true;

		const activeItems = Object.keys(filterState)
			.filter(it => !it.startsWith("_"))
			.map(it => this._itemsLookup[it])
			.filter(Boolean);

		if (!activeItems.length) return true;
		if ((!entryVal || !entryVal.length) && activeItems.length) return false;

		return entryVal.some(abilObject => {
			const cpyAbilObject = MiscUtil.copy(abilObject);
			const vewActiveItems = [...activeItems];

			// region Stage 1. Exact ability score match.
			Parser.ABIL_ABVS.forEach(ab => {
				if (!cpyAbilObject[ab] || !vewActiveItems.length) return;

				const ixExact = vewActiveItems.findIndex(it => it.ability === ab && it.modifier === cpyAbilObject[ab]);
				if (~ixExact) return vewActiveItems.splice(ixExact, 1);
			});
			if (!vewActiveItems.length) return true;
			// endregion

			// region Stage 2. "Choice" ability score match
			if (cpyAbilObject.choose?.from) {
				const amount = cpyAbilObject.choose.amount || 1;
				const count = cpyAbilObject.choose.count || 1;

				for (let i = 0; i < count; ++i) {
					if (!vewActiveItems.length) break;

					const ix = vewActiveItems.findIndex(it => cpyAbilObject.choose.from.includes(it.ability) && amount === it.modifier);
					if (~ix) {
						const [cpyActiveItem] = vewActiveItems.splice(ix, 1);
						cpyAbilObject.choose.from = cpyAbilObject.choose.from.filter(it => it !== cpyActiveItem.ability);
					}
				}
			} else if (cpyAbilObject.choose?.weighted?.weights && cpyAbilObject.choose?.weighted?.from) {
				cpyAbilObject.choose.weighted.weights.forEach(weight => {
					const ix = vewActiveItems.findIndex(it => cpyAbilObject.choose.weighted.from.includes(it.ability) && weight === it.modifier);
					if (~ix) {
						const [cpyActiveItem] = vewActiveItems.splice(ix, 1);
						cpyAbilObject.choose.weighted.from = cpyAbilObject.choose.weighted.from.filter(it => it !== cpyActiveItem.ability);
					}
				});
			}
			if (!vewActiveItems.length) return true;
			// endregion

			// region Stage 3. "Any" ability score match
			Parser.ABIL_ABVS.forEach(ab => {
				if (!cpyAbilObject[ab] || !vewActiveItems.length) return;

				const ix = vewActiveItems.findIndex(it => it.ability === ab && ((cpyAbilObject[ab] > 0 && it.isAnyIncrease) || (cpyAbilObject[ab] < 0 && it.isAnyDecrease)));
				if (~ix) return vewActiveItems.splice(ix, 1);
			});
			if (!vewActiveItems.length) return true;

			if (cpyAbilObject.choose?.from) {
				const amount = cpyAbilObject.choose.amount || 1;
				const count = cpyAbilObject.choose.count || 1;

				for (let i = 0; i < count; ++i) {
					if (!vewActiveItems.length) return true;

					const ix = vewActiveItems.findIndex(it => cpyAbilObject.choose.from.includes(it.ability) && ((amount > 0 && it.isAnyIncrease) || (amount < 0 && it.isAnyDecrease)));
					if (~ix) {
						const [cpyActiveItem] = vewActiveItems.splice(ix, 1);
						cpyAbilObject.choose.from = cpyAbilObject.choose.from.filter(it => it !== cpyActiveItem.ability);
					}
				}
			} else if (cpyAbilObject.choose?.weighted?.weights && cpyAbilObject.choose?.weighted?.from) {
				cpyAbilObject.choose.weighted.weights.forEach(weight => {
					if (!vewActiveItems.length) return;

					const ix = vewActiveItems.findIndex(it => cpyAbilObject.choose.weighted.from.includes(it.ability) && ((weight > 0 && it.isAnyIncrease) || (weight < 0 && it.isAnyDecrease)));
					if (~ix) {
						const [cpyActiveItem] = vewActiveItems.splice(ix, 1);
						cpyAbilObject.choose.weighted.from = cpyAbilObject.choose.weighted.from.filter(it => it !== cpyActiveItem.ability);
					}
				});
			}
			return !vewActiveItems.length;
			// endregion
		});
	}

	addItem (abilArr) {
		if (!abilArr?.length) return;

		// region Update our min/max scores
		let nxtMaxMod = this._maxMod;
		let nxtMinMod = this._minMod;

		abilArr.forEach(abilObject => {
			Parser.ABIL_ABVS.forEach(ab => {
				if (abilObject[ab] != null) {
					nxtMaxMod = Math.max(nxtMaxMod, abilObject[ab]);
					nxtMinMod = Math.min(nxtMinMod, abilObject[ab]);

					const uid = AbilityScoreFilter.FilterItem.getUid_({ability: ab, modifier: abilObject[ab]});
					if (!this._seenUids[uid]) this._isItemsDirty = true;
					this._seenUids[uid] = true;
				}
			});

			if (abilObject.choose?.from) {
				const amount = abilObject.choose.amount || 1;
				nxtMaxMod = Math.max(nxtMaxMod, amount);
				nxtMinMod = Math.min(nxtMinMod, amount);

				abilObject.choose.from.forEach(ab => {
					const uid = AbilityScoreFilter.FilterItem.getUid_({ability: ab, modifier: amount});
					if (!this._seenUids[uid]) this._isItemsDirty = true;
					this._seenUids[uid] = true;
				});
			}

			if (abilObject.choose?.weighted?.weights) {
				nxtMaxMod = Math.max(nxtMaxMod, ...abilObject.choose.weighted.weights);
				nxtMinMod = Math.min(nxtMinMod, ...abilObject.choose.weighted.weights);

				abilObject.choose.weighted.from.forEach(ab => {
					abilObject.choose.weighted.weights.forEach(weight => {
						const uid = AbilityScoreFilter.FilterItem.getUid_({ability: ab, modifier: weight});
						if (!this._seenUids[uid]) this._isItemsDirty = true;
						this._seenUids[uid] = true;
					});
				});
			}
		});
		// endregion

		// region If we have a new max score, populate items
		if (nxtMaxMod > this._maxMod) {
			for (let i = this._maxMod + 1; i <= nxtMaxMod; ++i) {
				if (i === 0) continue;
				Parser.ABIL_ABVS.forEach(ab => {
					const item = new AbilityScoreFilter.FilterItem({modifier: i, ability: ab});
					this._items.push(item);
					this._itemsLookup[item.uid] = item;
					if (this.__state[item.uid] == null) this.__state[item.uid] = PILL_STATE__IGNORE;
				});
			}

			this._isItemsDirty = true;
			this._maxMod = nxtMaxMod;
		}
		// endregion

		// region If we have a new min score, populate items
		if (nxtMinMod < this._minMod) {
			for (let i = nxtMinMod; i < this._minMod; ++i) {
				if (i === 0) continue;
				Parser.ABIL_ABVS.forEach(ab => {
					const item = new AbilityScoreFilter.FilterItem({modifier: i, ability: ab});
					this._items.push(item);
					this._itemsLookup[item.uid] = item;
					if (this.__state[item.uid] == null) this.__state[item.uid] = PILL_STATE__IGNORE;
				});
			}

			this._isItemsDirty = true;
			this._minMod = nxtMinMod;
		}
		// endregion
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
		Object.assign(this._state, toLoad.state);
	}

	getSubHashes () {
		const out = [];

		const baseMeta = this.getMetaSubHashes();
		if (baseMeta) out.push(...baseMeta);

		const areNotDefaultState = Object.entries(this._state).filter(([k, v]) => {
			if (k.startsWith("_")) return false;
			return !!v;
		});
		if (areNotDefaultState.length) {
			// serialize state as `key=value` pairs
			const serPillStates = areNotDefaultState.map(([k, v]) => `${k.toUrlified()}=${v}`);
			out.push(UrlUtil.packSubHash(this.getSubHashPrefix("state", this.header), serPillStates));
		}

		if (!out.length) return null;

		return out;
	}

	getNextStateFromSubhashState (state) {
		const nxtState = this._getNextState_base();

		if (state == null) {
			this._mutNextState_reset({nxtState});
			return nxtState;
		}

		let hasState = false;

		Object.entries(state).forEach(([k, vals]) => {
			const prop = FilterBase.getProp(k);
			switch (prop) {
				case "state": {
					hasState = true;
					Object.keys(nxtState[this.header].state).forEach(k => nxtState[this.header].state[k] = PILL_STATE__IGNORE);

					vals.forEach(v => {
						const [statePropLower, state] = v.split("=");
						const stateProp = Object.keys(nxtState[this.header].state).find(k => k.toLowerCase() === statePropLower);
						if (stateProp) nxtState[this.header].state[stateProp] = Number(state) ? PILL_STATE__YES : PILL_STATE__IGNORE;
					});
					break;
				}
			}
		});

		if (!hasState) this._mutNextState_reset({nxtState});

		return nxtState;
	}

	setFromValues (values) {
		if (!values[this.header]) return;
		const nxtState = {};
		Object.keys(this._state).forEach(k => nxtState[k] = PILL_STATE__IGNORE);
		Object.assign(nxtState, values[this.header]);
	}

	getDefaultMeta () {
		// Key order is important, as @filter tags depend on it
		return {};
	}

	handleSearch (searchTerm) {
		const isHeaderMatch = this._getHeaderDisplayName().toLowerCase().includes(searchTerm);

		if (isHeaderMatch) {
			Object.values(this.__wrpPillsRows).forEach(meta => meta.row.removeClass("fltr__hidden--search"));

			if (this.__$wrpFilter) this.__$wrpFilter.toggleClass("fltr__hidden--search", false);

			return true;
		}

		// Simply display all if the user searched a "+x" or "-x" value; we don't care if this produces false positives.
		const isModNumber = /^[-+]\d*$/.test(searchTerm);

		let visibleCount = 0;
		Object.values(this.__wrpPillsRows).forEach(({row, searchText}) => {
			const isVisible = isModNumber || searchText.includes(searchTerm);
			row.toggleClass("fltr__hidden--search", !isVisible);
			if (isVisible) visibleCount++;
		});

		if (this.__$wrpFilter) this.__$wrpFilter.toggleClass("fltr__hidden--search", visibleCount === 0);

		return visibleCount !== 0;
	}

	_doTeardown () {
		this._items.forEach(it => {
			if (it.rendered) it.rendered.detach();
			if (it.btnMini) it.btnMini.detach();
		});

		Object.values(this.__wrpPillsRows).forEach(meta => meta.row.detach());
	}

	_getStateNotDefault ({nxtState, isIgnoreSnapshot = false} = {}) {
		const state = nxtState?.[this.header]?.state || this.__state;

		return Object.entries(state)
			.filter(([k, v]) => {
				const defState = this._getDefaultItemState(k, {isIgnoreSnapshot});
				return defState !== v;
			});
	}

	_getDefaultItemState (k, {isIgnoreSnapshot = false} = {}) {
		if (isIgnoreSnapshot) return PILL_STATE__IGNORE;

		const fromSnapshot = this._snapshotManager?.getResolvedValue(this.header, "state", k);
		if (fromSnapshot != null) return fromSnapshot;

		return PILL_STATE__IGNORE;
	}

	/* -------------------------------------------- */

	getSnapshots () { return this._getSnapshots_generic(); }

	/* -------------------------------------------- */

	_mutNextState_fromSnapshots ({nxtState, snapshots = null}) { return this._mutNextState_fromSnapshots_generic({nxtState, snapshots}); }
	_mutNextState_fromSnapshots_state ({nxtState, snapshot}) { return this._mutNextState_fromSnapshots_state_generic({nxtState, snapshot}); }
	_mutNextState_fromSnapshots_meta ({nxtState, snapshot}) { return this._mutNextState_fromSnapshots_meta_generic({nxtState, snapshot}); }

	/* -------------------------------------------- */

	getFilterTagPart () {
		const areNotDefaultState = this._getStateNotDefault({isIgnoreSnapshot: true});
		const compressedMeta = this._getCompressedMeta();

		// If _any_ value is non-default, we need to include _all_ values in the tag
		// The same goes for meta values
		if (!areNotDefaultState.length && !compressedMeta) return null;

		const pt = Object.entries(this._state)
			.filter(([, v]) => !!v)
			.map(([k, v]) => `${v === PILL_STATE__NO ? "!" : ""}${k}`)
			.join(";")
			.toLowerCase();

		return [
			this.header.toLowerCase(),
			pt,
			compressedMeta ? compressedMeta.join(HASH_SUB_LIST_SEP) : null,
		]
			.filter(it => it != null)
			.join("=");
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
		// The same goes for meta values
		if (!areNotDefaultState.length) return [];

		const ptState = Object.entries(state)
			.filter(([, v]) => !!v)
			.map(([k, v]) => {
				const item = this._items.find(item => item.uid === k);
				if (!item) return null; // Should never occur

				if (isPlainText) return `${v === PILL_STATE__NO ? "not " : ""}${item.getMiniPillDisplayText()}`;

				return `<span class="fltr__disp-state fltr__disp-state--${PILL_STATES[v]}">${item.getMiniPillDisplayText()}</span>`;
			})
			.filter(Boolean)
			.join(", ");

		if (!ptState) {
			if (isPlainText) return [`${this._getHeaderDisplayName()}: (cleared)`];
			return [
				`${this._getDisplayStatePart_getHeader({isPlainText})}<span class="italic fltr__disp-state fltr__disp-state--ignore">(cleared)</span>`,
			];
		}

		return [
			`${this._getDisplayStatePart_getHeader({isPlainText})}${ptState}`,
		];
	}

	/* -------------------------------------------- */

	getSnapshotPreviews (snapshots) {
		/* Implement if required */
		return [];
	}
}

AbilityScoreFilter.FilterItem = class {
	static getUid_ ({ability = null, isAnyIncrease = false, isAnyDecrease = false, modifier = null}) {
		return `${Parser.attAbvToFull(ability)} ${modifier != null ? UiUtil.intToBonus(modifier) : (isAnyIncrease ? `+any` : isAnyDecrease ? `-any` : "?")}`;
	}

	constructor ({isAnyIncrease = false, isAnyDecrease = false, modifier = null, ability = null}) {
		if (isAnyIncrease && isAnyDecrease) throw new Error(`Invalid arguments!`);
		if ((isAnyIncrease || isAnyDecrease) && modifier != null) throw new Error(`Invalid arguments!`);

		this._ability = ability;
		this._modifier = modifier;
		this._isAnyIncrease = isAnyIncrease;
		this._isAnyDecrease = isAnyDecrease;
		this._uid = AbilityScoreFilter.FilterItem.getUid_({
			isAnyIncrease: this._isAnyIncrease,
			isAnyDecrease: this._isAnyDecrease,
			modifier: this._modifier,
			ability: this._ability,
		});
	}

	get ability () { return this._ability; }
	get modifier () { return this._modifier; }
	get isAnyIncrease () { return this._isAnyIncrease; }
	get isAnyDecrease () { return this._isAnyDecrease; }
	get uid () { return this._uid; }

	getMiniPillDisplayText () {
		if (this._isAnyIncrease) return `+Any ${Parser.attAbvToFull(this._ability)}`;
		if (this._isAnyDecrease) return `\u2212Any ${Parser.attAbvToFull(this._ability)}`;
		return `${UiUtil.intToBonus(this._modifier, {isPretty: true})} ${Parser.attAbvToFull(this._ability)}`;
	}

	getPillDisplayHtml () {
		if (this._isAnyIncrease) return `+Any`;
		if (this._isAnyDecrease) return `\u2212Any`;
		return UiUtil.intToBonus(this._modifier, {isPretty: true});
	}
};
