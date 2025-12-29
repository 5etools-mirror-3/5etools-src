import {FilterItem} from "../filter-item.js";
import {Filter} from "./filter-filter-generic.js";
import {MISC_FILTER_VALUE__BASIC_RULES_2014, MISC_FILTER_VALUE__BASIC_RULES_2024, MISC_FILTER_VALUE__SRD_5_1, MISC_FILTER_VALUE__SRD_5_2, PILL_STATE__IGNORE, PILL_STATE__YES, SOURCE_HEADER} from "../filter-constants.js";
import {PageFilterBase} from "../filter-page-filter-base.js";

export class SourceFilterItem extends FilterItem {
	/**
	 * @param options
	 * @param [options.isOtherSource] If this is not the primary source of the entity.
	 */
	constructor (options) {
		super(options);
		this.isOtherSource = options.isOtherSource;
		this._sortName = null;
		this.itemFull = Parser.sourceJsonToFull(this.item);
	}
}

export class SourceFilter extends Filter {
	static _SORT_ITEMS (a, b) {
		return SortUtil.ascSortLowerPropNumeric("itemFull", a, b);
	}

	static _SORT_ITEMS_MINI (a, b) {
		const valA = BrewUtil2.hasSourceJson(a.item) ? 2 : (SourceUtil.isNonstandardSource(a.item) || PrereleaseUtil.hasSourceJson(a.item)) ? 1 : 0;
		const valB = BrewUtil2.hasSourceJson(b.item) ? 2 : (SourceUtil.isNonstandardSource(b.item) || PrereleaseUtil.hasSourceJson(b.item)) ? 1 : 0;
		return SortUtil.ascSort(valA, valB)
			|| SourceFilter._SORT_ITEMS(a, b);
	}

	static _getDisplayHtmlMini (item) {
		item = item.item || item;
		return `${this._getDisplayHtmlMini_icon(item)} ${Parser.sourceJsonToAbv(item)}`;
	}

	static _getDisplayHtmlMini_icon (item) {
		const group = SourceUtil.getFilterGroup(item);
		switch (group) {
			case SourceUtil.FILTER_GROUP_STANDARD: return `<span class="glyphicon glyphicon-book"></span>`;
			case SourceUtil.FILTER_GROUP_NON_STANDARD: return `<span title="(Other)" class="glyphicon glyphicon-file"></span>`;
			case SourceUtil.FILTER_GROUP_PARTNERED: return `<span title="(Partnered)" class="glyphicon glyphicon-star-empty"></span>`;
			case SourceUtil.FILTER_GROUP_PRERELEASE: return `<span title="(Prerelease)" class="glyphicon glyphicon-wrench"></span>`;
			case SourceUtil.FILTER_GROUP_HOMEBREW: return `<span title="(Homebrew)" class="glyphicon glyphicon-glass"></span>`;
			default: throw new Error(`Unhandled source filter group "${group}"`);
		}
	}

	constructor (opts) {
		opts = opts || {};

		opts.header = opts.header === undefined ? SOURCE_HEADER : opts.header;
		opts.displayFn = opts.displayFn === undefined ? item => Parser.sourceJsonToFullCompactPrefix(item.item || item) : opts.displayFn;
		opts.displayFnMini = opts.displayFnMini === undefined ? SourceFilter._getDisplayHtmlMini.bind(SourceFilter) : opts.displayFnMini;
		opts.displayFnTitle = opts.displayFnTitle === undefined ? item => Parser.sourceJsonToFull(item.item || item) : opts.displayFnTitle;
		opts.itemSortFnMini = opts.itemSortFnMini === undefined ? SourceFilter._SORT_ITEMS_MINI.bind(SourceFilter) : opts.itemSortFnMini;
		opts.itemSortFn = opts.itemSortFn === undefined ? SourceFilter._SORT_ITEMS.bind(SourceFilter) : opts.itemSortFn;
		opts.groupFn = opts.groupFn === undefined ? SourceUtil.getFilterGroup : opts.groupFn;
		opts.groupNameFn = opts.groupNameFn === undefined ? SourceUtil.getFilterGroupName : opts.groupNameFn;
		opts.selFn = opts.selFn === undefined ? PageFilterBase.defaultSourceSelFn : opts.selFn;

		super(opts);

		this.__tmpState = {ixAdded: 0};
		this._tmpState = this._getProxy("tmpState", this.__tmpState);
	}

	doSetPillsClear () { return this._doSetPillsClear(); }

	_getFilterItem (item) {
		return item instanceof FilterItem ? item : new SourceFilterItem({item});
	}

	addItem (item) {
		const out = super.addItem(item);
		this._tmpState.ixAdded++;
		return out;
	}

	trimState_ () {
		if (!this._items?.length) return;

		const sourcesLoaded = new Set(this._items.map(itm => itm.item));
		const nxtState = MiscUtil.copyFast(this.__state);
		Object.keys(nxtState)
			.filter(k => !sourcesLoaded.has(k))
			.forEach(k => delete nxtState[k]);

		this._proxyAssignSimple("state", nxtState, true);
	}

	_getHeaderControls_addExtraStateBtns (opts, wrpStateBtnsOuter) {
		const btnSupplements = e_({
			tag: "button",
			clazz: `ve-btn ve-btn-default w-100 ${opts.isMulti ? "ve-btn-xxs" : "ve-btn-xs"}`,
			title: `SHIFT to add to existing selection; CTRL to include UA/etc.`,
			html: `Core/Supplements`,
			click: evt => this._doSetPinsSupplements({isIncludeUnofficial: EventUtil.isCtrlMetaKey(evt), isAdditive: evt.shiftKey}),
		});

		const btnAdventures = e_({
			tag: "button",
			clazz: `ve-btn ve-btn-default w-100 ${opts.isMulti ? "ve-btn-xxs" : "ve-btn-xs"}`,
			title: `SHIFT to add to existing selection; CTRL to include UA`,
			html: `Adventures`,
			click: evt => this._doSetPinsAdventures({isIncludeUnofficial: EventUtil.isCtrlMetaKey(evt), isAdditive: evt.shiftKey}),
		});

		const btnPartnered = e_({
			tag: "button",
			clazz: `ve-btn ve-btn-default w-100 ${opts.isMulti ? "ve-btn-xxs" : "ve-btn-xs"}`,
			title: `SHIFT to add to existing selection`,
			html: `Partnered`,
			click: evt => this._doSetPinsPartnered({isAdditive: evt.shiftKey}),
		});

		const btnHomebrew = e_({
			tag: "button",
			clazz: `ve-btn ve-btn-default w-100 ${opts.isMulti ? "ve-btn-xxs" : "ve-btn-xs"}`,
			title: `SHIFT to add to existing selection`,
			html: `Homebrew`,
			click: evt => this._doSetPinsHomebrew({isAdditive: evt.shiftKey}),
		});

		const hkIsButtonsActive = () => {
			const hasPartnered = Object.keys(this.__state).some(src => SourceUtil.getFilterGroup(src) === SourceUtil.FILTER_GROUP_PARTNERED);
			btnPartnered.toggleClass("ve-hidden", !hasPartnered);

			const hasBrew = Object.keys(this.__state).some(src => SourceUtil.getFilterGroup(src) === SourceUtil.FILTER_GROUP_HOMEBREW);
			btnHomebrew.toggleClass("ve-hidden", !hasBrew);
		};
		this._addHook("tmpState", "ixAdded", hkIsButtonsActive);
		hkIsButtonsActive();

		const actionSelectDisplayMode = new ContextUtil.ActionSelect({
			values: Object.keys(SourceFilter._PILL_DISPLAY_MODE_LABELS).map(Number),
			fnGetDisplayValue: val => SourceFilter._PILL_DISPLAY_MODE_LABELS[val] || SourceFilter._PILL_DISPLAY_MODE_LABELS[SourceFilter._PILL_DISPLAY_MODE__AS_NAMES],
			fnOnChange: val => this._uiMeta.pillDisplayMode = val,
		});
		this._addHook("uiMeta", "pillDisplayMode", () => {
			actionSelectDisplayMode.setValue(this._uiMeta.pillDisplayMode);
		})();

		const menu = ContextUtil.getMenu([
			new ContextUtil.Action(
				"Select All Standard Sources",
				() => this._doSetPinsStandard(),
			),
			new ContextUtil.Action(
				"Select All Partnered Sources",
				() => this._doSetPinsPartnered(),
			),
			new ContextUtil.Action(
				"Select All Non-Standard Sources",
				() => this._doSetPinsNonStandard(),
			),
			new ContextUtil.Action(
				"Select All Prerelease Sources",
				() => this._doSetPinsPrerelease(),
			),
			new ContextUtil.Action(
				"Select All Homebrew Sources",
				() => this._doSetPinsHomebrew(),
			),
			null,
			new ContextUtil.Action(
				`Select 2014 Sources`,
				() => this._doSetPinsClassic(),
				{title: `Select sources published from 2014 to 2024.`},
			),
			new ContextUtil.Action(
				`Select 2024 Sources`,
				() => this._doSetPinsOne(),
				{title: `Select sources published from 2024 onwards.`},
			),
			null,
			new ContextUtil.Action(
				`Select "Vanilla" Sources`,
				() => this._doSetPinsVanilla(),
				{title: `Select a baseline set of sources suitable for any campaign.`},
			),
			new ContextUtil.Action(
				"Select All Non-UA Sources",
				() => this._doSetPinsNonUa(),
			),
			null,
			new ContextUtil.Action(
				"Select SRD Sources",
				() => this._doSetPinsSrd(),
				{title: `Select System Reference Document Sources.`},
			),
			new ContextUtil.Action(
				"Select Basic Rules Sources",
				() => this._doSetPinsBasicRules(),
			),
			null,
			new ContextUtil.Action(
				"Invert Selection",
				() => this._doInvertPins(),
			),
			null,
			actionSelectDisplayMode,
		]);
		const btnBurger = e_({
			tag: "button",
			clazz: `ve-btn ve-btn-default ${opts.isMulti ? "ve-btn-xxs" : "ve-btn-xs"}`,
			html: `<span class="glyphicon glyphicon-option-vertical"></span>`,
			click: evt => ContextUtil.pOpenMenu(evt, menu),
			title: "Other Options",
		});

		const btnOnlyPrimary = e_({
			tag: "button",
			clazz: `ve-btn ve-btn-default w-100 ${opts.isMulti ? "ve-btn-xxs" : "ve-btn-xs"}`,
			html: `Include References`,
			title: `Consider entities as belonging to every source they appear in (i.e. reprints) as well as their primary source`,
			click: () => this._meta.isIncludeOtherSources = !this._meta.isIncludeOtherSources,
		});
		const hkIsIncludeOtherSources = () => {
			btnOnlyPrimary.toggleClass("active", !!this._meta.isIncludeOtherSources);
		};
		hkIsIncludeOtherSources();
		this._addHook("meta", "isIncludeOtherSources", hkIsIncludeOtherSources);

		e_({
			tag: "div",
			clazz: `ve-btn-group mr-2 w-100 ve-flex-v-center mobile-sm__m-1 mobile-sm__mb-2`,
			children: [
				btnSupplements,
				btnAdventures,
				btnPartnered,
				btnHomebrew,
				btnBurger,
				btnOnlyPrimary,
			],
		}).prependTo(wrpStateBtnsOuter);
	}

	_doSetPinsStandard () {
		Object.keys(this._state).forEach(k => this._state[k] = SourceUtil.getFilterGroup(k) === SourceUtil.FILTER_GROUP_STANDARD ? PILL_STATE__YES : PILL_STATE__IGNORE);
	}

	_doSetPinsPartnered ({isAdditive = false} = {}) {
		this._proxyAssignSimple(
			"state",
			Object.keys(this._state)
				.mergeMap(k => ({[k]: SourceUtil.getFilterGroup(k) === SourceUtil.FILTER_GROUP_PARTNERED ? PILL_STATE__YES : isAdditive ? this._state[k] : PILL_STATE__IGNORE})),
		);
	}

	_doSetPinsNonStandard () {
		Object.keys(this._state).forEach(k => this._state[k] = SourceUtil.getFilterGroup(k) === SourceUtil.FILTER_GROUP_NON_STANDARD ? PILL_STATE__YES : PILL_STATE__IGNORE);
	}

	_doSetPinsPrerelease () {
		Object.keys(this._state).forEach(k => this._state[k] = SourceUtil.getFilterGroup(k) === SourceUtil.FILTER_GROUP_PRERELEASE ? PILL_STATE__YES : PILL_STATE__IGNORE);
	}

	_doSetPinsSupplements ({isIncludeUnofficial = false, isAdditive = false} = {}) {
		this._proxyAssignSimple(
			"state",
			Object.keys(this._state)
				.mergeMap(k => ({[k]: SourceUtil.isCoreOrSupplement(k) && (isIncludeUnofficial || !SourceUtil.isNonstandardSource(k)) ? PILL_STATE__YES : isAdditive ? this._state[k] : PILL_STATE__IGNORE})),
		);
	}

	_doSetPinsAdventures ({isIncludeUnofficial = false, isAdditive = false} = {}) {
		this._proxyAssignSimple(
			"state",
			Object.keys(this._state)
				.mergeMap(k => ({[k]: SourceUtil.isAdventure(k) && (isIncludeUnofficial || !SourceUtil.isNonstandardSource(k)) ? PILL_STATE__YES : isAdditive ? this._state[k] : PILL_STATE__IGNORE})),
		);
	}

	_doSetPinsHomebrew ({isAdditive = false} = {}) {
		this._proxyAssignSimple(
			"state",
			Object.keys(this._state)
				.mergeMap(k => ({[k]: SourceUtil.getFilterGroup(k) === SourceUtil.FILTER_GROUP_HOMEBREW ? PILL_STATE__YES : isAdditive ? this._state[k] : PILL_STATE__IGNORE})),
		);
	}

	_doSetPinsClassic () {
		Object.keys(this._state).forEach(k => this._state[k] = SourceUtil.isClassicSource(k) ? PILL_STATE__YES : PILL_STATE__IGNORE);
	}

	_doSetPinsOne () {
		Object.keys(this._state).forEach(k => this._state[k] = SourceUtil.isClassicSource(k) ? PILL_STATE__IGNORE : PILL_STATE__YES);
	}

	_doSetPinsVanilla () {
		Object.keys(this._state).forEach(k => this._state[k] = Parser.SOURCES_VANILLA.has(k) ? PILL_STATE__YES : PILL_STATE__IGNORE);
	}

	_doSetPinsNonUa () {
		Object.keys(this._state).forEach(k => this._state[k] = !SourceUtil.isPrereleaseSource(k) ? PILL_STATE__YES : PILL_STATE__IGNORE);
	}

	_doSetPinsSrd () {
		SourceFilter._SRD_SOURCES = SourceFilter._SRD_SOURCES || new Set([Parser.SRC_PHB, Parser.SRC_MM, Parser.SRC_DMG, Parser.SRC_XPHB, Parser.SRC_XDMG, Parser.SRC_XMM]);

		Object.keys(this._state).forEach(k => this._state[k] = SourceFilter._SRD_SOURCES.has(k) ? PILL_STATE__YES : PILL_STATE__IGNORE);

		const srdFilter = this._filterBox.filters.find(it => it.isSrdFilter);
		if (srdFilter) {
			srdFilter.setValue(MISC_FILTER_VALUE__SRD_5_1, PILL_STATE__YES);
			srdFilter.setValue(MISC_FILTER_VALUE__SRD_5_2, PILL_STATE__YES);
		}

		const basicRulesFilter = this._filterBox.filters.find(it => it.isBasicRulesFilter);
		if (basicRulesFilter) {
			basicRulesFilter.setValue(MISC_FILTER_VALUE__BASIC_RULES_2014, PILL_STATE__IGNORE);
			basicRulesFilter.setValue(MISC_FILTER_VALUE__BASIC_RULES_2024, PILL_STATE__IGNORE);
		}

		// also disable "Reprinted" otherwise some Deities are missing
		const reprintedFilter = this._filterBox.filters.find(it => it.isReprintedFilter);
		if (reprintedFilter) reprintedFilter.setValue("Reprinted", PILL_STATE__IGNORE);
	}

	_doSetPinsBasicRules () {
		SourceFilter._BASIC_RULES_SOURCES = SourceFilter._BASIC_RULES_SOURCES || new Set([Parser.SRC_PHB, Parser.SRC_MM, Parser.SRC_DMG, Parser.SRC_XPHB, Parser.SRC_XDMG, Parser.SRC_XMM]);

		Object.keys(this._state).forEach(k => this._state[k] = SourceFilter._BASIC_RULES_SOURCES.has(k) ? PILL_STATE__YES : PILL_STATE__IGNORE);

		const basicRulesFilter = this._filterBox.filters.find(it => it.isBasicRulesFilter);
		if (basicRulesFilter) {
			basicRulesFilter.setValue(MISC_FILTER_VALUE__BASIC_RULES_2014, PILL_STATE__YES);
			basicRulesFilter.setValue(MISC_FILTER_VALUE__BASIC_RULES_2024, PILL_STATE__YES);
		}

		const srdFilter = this._filterBox.filters.find(it => it.isSrdFilter);
		if (srdFilter) {
			srdFilter.setValue(MISC_FILTER_VALUE__SRD_5_1, PILL_STATE__IGNORE);
			srdFilter.setValue(MISC_FILTER_VALUE__SRD_5_2, PILL_STATE__IGNORE);
		}

		// also disable "Reprinted" otherwise some Deities are missing
		const reprintedFilter = this._filterBox.filters.find(it => it.isReprintedFilter);
		if (reprintedFilter) reprintedFilter.setValue("Reprinted", PILL_STATE__IGNORE);
	}

	static getCompleteFilterSources (ent, {isIncludeBaseSource = false} = {}) {
		const isSkipBaseSource = !isIncludeBaseSource || !ent._baseSource;

		if (!ent.otherSources && isSkipBaseSource) return ent.source;

		const otherSourcesFilt = (ent.otherSources || [])
			// Avoid `otherSources` from e.g. homebrews which are not loaded, and so lack their metadata
			.filter(src => this._getCompleteFilterSources_isIncludedSource(src.source));
		if (!otherSourcesFilt.length && isSkipBaseSource) return ent.source;

		const out = [ent.source].concat(otherSourcesFilt.map(src => new SourceFilterItem({item: src.source, isIgnoreRed: true, isOtherSource: true})));

		// Base sources should already be filtered
		if (!isSkipBaseSource && this._getCompleteFilterSources_isIncludedSource(ent._baseSource)) out.push(ent._baseSource);

		return out;
	}

	static _getCompleteFilterSources_isIncludedSource (source) {
		return !ExcludeUtil.isExcluded("*", "*", source, {isNoCount: true}) && SourceUtil.isKnownSource(source);
	}

	_doRenderPills_doRenderWrpGroup_getDividerHeaders (group) {
		switch (group) {
			case SourceUtil.FILTER_GROUP_PRERELEASE: return this._doRenderPills_doRenderWrpGroup_getDividerHeaders_groupPrerelease(group);
			case SourceUtil.FILTER_GROUP_HOMEBREW: return this._doRenderPills_doRenderWrpGroup_getDividerHeaders_groupBrew(group);
			default: return super._doRenderPills_doRenderWrpGroup_getDividerHeaders(group);
		}
	}

	_doRenderPills_doRenderWrpGroup_getDividerHeaders_groupPrerelease (group) {
		let dates = [];
		const comp = BaseComponent.fromObject({
			min: 0,
			max: 0,
			curMin: 0,
			curMax: 0,
		});

		const wrpSlider = new ComponentUiUtil.RangeSlider({
			comp,
			propMin: "min",
			propMax: "max",
			propCurMin: "curMin",
			propCurMax: "curMax",
			fnDisplay: val => dates[val]?.str,
		}).get();

		const wrpWrpSlider = e_({
			tag: "div",
			clazz: `"w-100 ve-flex pt-2 pb-5 mb-2 mt-1 fltr-src__wrp-slider`,
			children: [
				wrpSlider,
			],
		}).hideVe();

		const btnCancel = e_({
			tag: "button",
			clazz: `ve-btn ve-btn-xs ve-btn-default px-1`,
			html: "Cancel",
			click: () => {
				grpBtnsInactive.showVe();
				wrpWrpSlider.hideVe();
				grpBtnsActive.hideVe();
			},
		});

		const btnConfirm = e_({
			tag: "button",
			clazz: `ve-btn ve-btn-xs ve-btn-default px-1`,
			html: "Confirm",
			click: () => {
				grpBtnsInactive.showVe();
				wrpWrpSlider.hideVe();
				grpBtnsActive.hideVe();

				const min = comp._state.curMin;
				const max = comp._state.curMax;

				const allowedDateSet = new Set(dates.slice(min, max + 1).map(it => it.str));
				const nxtState = {};
				Object.keys(this._state)
					.filter(k => SourceUtil.isNonstandardSource(k))
					.forEach(k => {
						const sourceDate = Parser.sourceJsonToDate(k);
						nxtState[k] = allowedDateSet.has(sourceDate) ? PILL_STATE__YES : PILL_STATE__IGNORE;
					});
				this._proxyAssign("state", "_state", "__state", nxtState);
			},
		});

		const btnShowSlider = e_({
			tag: "button",
			clazz: `ve-btn ve-btn-xxs ve-btn-default px-1`,
			html: "Select by Date",
			click: () => {
				grpBtnsInactive.hideVe();
				wrpWrpSlider.showVe();
				grpBtnsActive.showVe();

				dates = Object.keys(this._state)
					.filter(it => SourceUtil.isPrereleaseSource(it))
					.map(it => Parser.sourceJsonToDate(it))
					.filter(Boolean)
					.unique()
					.map(it => ({str: it, date: new Date(it)}))
					.sort((a, b) => SortUtil.ascSortDate(a.date, b.date))
					.reverse();

				comp._proxyAssignSimple(
					"state",
					{
						min: 0,
						max: dates.length - 1,
						curMin: 0,
						curMax: dates.length - 1,
					},
				);
			},
		});

		const btnClear = e_({
			tag: "button",
			clazz: `ve-btn ve-btn-xxs ve-btn-default px-1`,
			html: "Clear",
			click: () => {
				const nxtState = {};
				Object.keys(this._state)
					.filter(k => SourceUtil.isPrereleaseSource(k))
					.forEach(k => nxtState[k] = PILL_STATE__IGNORE);
				this._proxyAssign("state", "_state", "__state", nxtState);
			},
		});

		const grpBtnsActive = e_({
			tag: "div",
			clazz: `ve-flex-v-center ve-btn-group`,
			children: [
				btnCancel,
				btnConfirm,
			],
		}).hideVe();

		const grpBtnsInactive = e_({
			tag: "div",
			clazz: `ve-flex-v-center ve-btn-group`,
			children: [
				btnClear,
				btnShowSlider,
			],
		});

		const elesDividerHeaders = super._doRenderPills_doRenderWrpGroup_getDividerHeaders(group);
		if (!elesDividerHeaders.length) elesDividerHeaders.push(e_({clazz: "div"}));
		if (elesDividerHeaders.length > 1) throw new Error("Unimplemented!");

		return [
			e_({
				tag: "div",
				clazz: `split-v-center w-100`,
				children: [
					...elesDividerHeaders,
					e_({
						tag: "div",
						clazz: `mb-1 ve-flex-h-right`,
						children: [
							grpBtnsActive,
							grpBtnsInactive,
						],
					}),
				],
			}),
			wrpWrpSlider,
		];
	}

	_doRenderPills_doRenderWrpGroup_getDividerHeaders_groupBrew (group) {
		const btnClear = e_({
			tag: "button",
			clazz: `ve-btn ve-btn-xxs ve-btn-default px-1`,
			html: "Clear",
			click: () => {
				const nxtState = {};
				Object.keys(this._state)
					.filter(k => BrewUtil2.hasSourceJson(k))
					.forEach(k => nxtState[k] = PILL_STATE__IGNORE);
				this._proxyAssign("state", "_state", "__state", nxtState);
			},
		});

		const elesDividerHeaders = super._doRenderPills_doRenderWrpGroup_getDividerHeaders(group);
		if (!elesDividerHeaders.length) elesDividerHeaders.push(e_({clazz: "div"}));
		if (elesDividerHeaders.length > 1) throw new Error("Unimplemented!");

		return [
			e_({
				tag: "div",
				clazz: `split-v-center w-100`,
				children: [
					...elesDividerHeaders,
					e_({
						tag: "div",
						clazz: `mb-1 ve-flex-h-right`,
						children: [
							e_({
								tag: "div",
								clazz: `ve-flex-v-center ve-btn-group`,
								children: [
									btnClear,
								],
							}),
						],
					}),
				],
			}),
		];
	}

	_toDisplay_getMappedEntryVal (entryVal) {
		entryVal = super._toDisplay_getMappedEntryVal(entryVal);
		if (!this._meta.isIncludeOtherSources) entryVal = entryVal.filter(it => !it.isOtherSource);
		return entryVal;
	}

	_getPill (item) {
		const displayText = this._getDisplayText(item);
		const displayTextMini = this._getDisplayTextMini(item);

		const dispName = e_({
			tag: "span",
			html: displayText,
		});

		const spc = e_({
			tag: "span",
			clazz: "px-2 fltr-src__spc-pill",
			text: "|",
		});

		const dispAbbreviation = e_({
			tag: "span",
			html: displayTextMini,
		});

		const btnPill = e_({
			tag: "div",
			clazz: "fltr__pill",
			children: [
				dispAbbreviation,
				spc,
				dispName,
			],
			click: evt => this._getPill_handleClick({evt, item}),
			contextmenu: evt => this._getPill_handleContextmenu({evt, item}),
		});

		this._getPill_bindHookState({btnPill, item});

		this._addHook("uiMeta", "pillDisplayMode", () => {
			dispAbbreviation.toggleVe(this._uiMeta.pillDisplayMode !== SourceFilter._PILL_DISPLAY_MODE__AS_NAMES);
			spc.toggleVe(this._uiMeta.pillDisplayMode === SourceFilter._PILL_DISPLAY_MODE__AS_BOTH);
			dispName.toggleVe(this._uiMeta.pillDisplayMode !== SourceFilter._PILL_DISPLAY_MODE__AS_ABVS);
		})();

		item.searchText = `${Parser.sourceJsonToAbv(item.item || item).toLowerCase()} -- ${displayText.toLowerCase()}`;

		return btnPill;
	}

	getSources () {
		const out = {
			all: [],
		};
		this._items.forEach(it => {
			out.all.push(it.item);
			const group = this._groupFn(it);
			(out[group] ||= []).push(it.item);
		});
		return out;
	}

	getDefaultMeta () {
		// Key order is important, as @filter tags depend on it
		return {
			...super.getDefaultMeta(),
			...SourceFilter._DEFAULT_META,
		};
	}

	getDefaultUiMeta () {
		return {
			...super.getDefaultUiMeta(),
			...SourceFilter._DEFAULT_UI_META,
		};
	}
}
SourceFilter._PILL_DISPLAY_MODE__AS_NAMES = 0;
SourceFilter._PILL_DISPLAY_MODE__AS_ABVS = 1;
SourceFilter._PILL_DISPLAY_MODE__AS_BOTH = 2;
SourceFilter._DEFAULT_META = {
	isIncludeOtherSources: false,
};
SourceFilter._DEFAULT_UI_META = {
	pillDisplayMode: SourceFilter._PILL_DISPLAY_MODE__AS_NAMES,
};
SourceFilter._PILL_DISPLAY_MODE_LABELS = {
	[SourceFilter._PILL_DISPLAY_MODE__AS_NAMES]: "As Names",
	[SourceFilter._PILL_DISPLAY_MODE__AS_ABVS]: "As Abbreviations",
	[SourceFilter._PILL_DISPLAY_MODE__AS_BOTH]: "As Names Plus Abbreviations",
};
SourceFilter._SRD_SOURCES = null;
SourceFilter._BASIC_RULES_SOURCES = null;
