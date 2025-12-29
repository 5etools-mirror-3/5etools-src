import {RenderItems} from "./render-items.js";

class ItemsSublistManager extends SublistManager {
	constructor () {
		super({
			sublistListOptions: {
				fnSort: PageFilterItems.sortItems,
			},
			isSublistItemsCountable: true,
		});

		this._sublistCurrencyConversion = null;
		this._sublistCurrencyDisplayMode = null;

		this._totalWeight = null;
		this._totalValue = null;
		this._totalItems = null;
	}

	async pCreateSublist () {
		[this._sublistCurrencyConversion, this._sublistCurrencyDisplayMode] = await Promise.all([
			StorageUtil.pGetForPage("sublistCurrencyConversion"),
			StorageUtil.pGetForPage("sublistCurrencyDisplayMode"),
		]);

		return super.pCreateSublist();
	}

	static _getRowTemplate () {
		return [
			new SublistCellTemplate({
				name: "Name",
				css: "bold ve-col-6 pl-0 pr-1",
				colStyle: "",
			}),
			new SublistCellTemplate({
				name: "Weight",
				css: "ve-text-center ve-col-2 px-1",
				colStyle: "text-center",
			}),
			new SublistCellTemplate({
				name: "Cost",
				css: "ve-text-center ve-col-2 px-1",
				colStyle: "text-center",
			}),
			new SublistCellTemplate({
				name: "Number",
				css: "ve-text-center ve-col-2 pl-1 pr-0",
				colStyle: "text-center",
			}),
		];
	}

	pGetSublistItem (item, hash, {count = 1} = {}) {
		const cellsText = [
			item.name,
			item._l_weight || "\u2014",
			item._l_value,
		];

		const {stg: stgCount, comp: compCount} = (() => {
			const comp = BaseComponent.fromObject({count});

			const ipt = ComponentUiUtil.getIptNumber(
				comp,
				"count",
				1,
				{
					fallbackOnNaN: count,
					html: `<input class="w-100 ve-text-center form-control form-control--minimal input-xs">`,
				},
			);

			comp._addHookBase("count", () => {
				if (comp._state.count <= 0) {
					this.pDoSublistRemove({entity: item, doFinalize: true}).then(null);
					return;
				}

				this.pDoSublistSetCount({entity: item, doFinalize: true, count: comp._state.count}).then(null);
			});

			const stg = this._pGetSublistItem_getWrpIptCount()
				.addClass("absolute")
				// Match padding
				.css({right: "2px"})
				.appends(ipt);

			return {stg, ipt, comp};
		})();

		const ptsCells = [
			...this.constructor._getRowCellsHtml({values: cellsText, templates: this.constructor._ROW_TEMPLATE.slice(0, 3)}),
			// Placeholder to vertically expand row
			this._pGetSublistItem_getWrpIptCount()
				.appends(`<input class="w-100 ve-text-center form-control form-control--minimal input-xs" disabled>`),
		];

		const ele = ee`<div class="lst__row lst__row--sublist ve-flex-col">
			<div class="lst__wrp-cells lst__row-border lst__row-inner relative">
				<a href="#${hash}" class="lst__row-lnk-inner">
					${ptsCells}
				</a>
				${stgCount}
			</div>
		</div>`
			.onn("contextmenu", evt => this._handleSublistItemContextMenu(evt, listItem))
			.onn("click", evt => this._listSub.doSelect(listItem, evt));

		const listItem = new ListItem(
			hash,
			ele,
			item.name,
			{
				hash,
				source: Parser.sourceJsonToAbv(item.source),
				page: item.page,
				weight: Parser.weightValueToNumber(item.weight),
				cost: item.value || 0,
			},
			{
				count,
				elesCount: [],
				fnsUpdate: [({sublistItem}) => compCount._state.count = sublistItem.data.count],
				entity: item,
				mdRow: [...cellsText, ({listItem}) => listItem.data.count],
			},
		);
		return listItem;
	}

	_pGetSublistItem_getWrpIptCount () {
		return ee`<span class="ve-text-center ve-col-2 pr-0 col-2"></span>`;
	}

	_onSublistChange () {
		this._totalWeight ||= es(`#totalweight`);
		this._totalValue ||= es(`#totalvalue`);
		this._totalItems ||= es(`#totalitems`);

		let weight = 0;
		let value = 0;
		let cntItems = 0;

		const availConversions = new Set();
		this._listSub.items.forEach(it => {
			const {data: {entity: item}} = it;
			if (item.currencyConversion) availConversions.add(item.currencyConversion);
			const count = it.data.count;
			cntItems += it.data.count;
			if (item.weight) weight += Number(item.weight) * count;
			if (item.value) value += item.value * count;
		});

		this._totalWeight.txt(Parser.itemWeightToFull({weight}, true));
		this._totalItems.txt(cntItems);

		if (availConversions.size) {
			this._totalValue
				.txt(Parser.itemValueToFullMultiCurrency({value, currencyConversion: this._sublistCurrencyConversion}, {styleHint: this._styleHint}))
				.off("click")
				.onn("click", async () => {
					const values = ["(Default)", ...[...availConversions].sort(SortUtil.ascSortLower)];
					const defaultSel = values.indexOf(this._sublistCurrencyConversion);
					const userSel = await InputUiUtil.pGetUserEnum({
						values,
						isResolveItem: true,
						default: ~defaultSel ? defaultSel : 0,
						title: "Select Currency Conversion Table",
						fnDisplay: it => it === null ? values[0] : it,
					});
					if (userSel == null) return;
					this._sublistCurrencyConversion = userSel === values[0] ? null : userSel;
					await StorageUtil.pSetForPage("sublistCurrencyConversion", this._sublistCurrencyConversion);
					this._onSublistChange();
				});
			return;
		}

		this._totalValue
			.txt(this._getTotalValueText({value}) || "\u2014")
			.off("click")
			.onn("click", async () => {
				const defaultSel = this.constructor._TOTAL_VALUE_MODES.indexOf(this._sublistCurrencyDisplayMode);
				const userSel = await InputUiUtil.pGetUserEnum({
					values: this.constructor._TOTAL_VALUE_MODES,
					isResolveItem: true,
					default: ~defaultSel ? defaultSel : 0,
					title: "Select Display Mode",
					fnDisplay: it => it === null ? this.constructor._TOTAL_VALUE_MODES[0] : it,
				});
				if (userSel == null) return;
				this._sublistCurrencyDisplayMode = userSel === this.constructor._TOTAL_VALUE_MODES[0] ? null : userSel;
				await StorageUtil.pSetForPage("sublistCurrencyDisplayMode", this._sublistCurrencyDisplayMode);
				this._onSublistChange();
			});
	}

	static _TOTAL_VALUE_MODE_EXACT_COINAGE = "Exact Coinage";
	static _TOTAL_VALUE_MODE_LOWEST_COMMON = "Lowest Common Currency";
	static _TOTAL_VALUE_MODE_GOLD = "Gold";
	static _TOTAL_VALUE_MODES = [
		this._TOTAL_VALUE_MODE_EXACT_COINAGE,
		this._TOTAL_VALUE_MODE_LOWEST_COMMON,
		this._TOTAL_VALUE_MODE_GOLD,
	];
	_getTotalValueText ({value}) {
		switch (this._sublistCurrencyDisplayMode) {
			case this.constructor._TOTAL_VALUE_MODE_LOWEST_COMMON: return Parser.itemValueToFull({value});

			case this.constructor._TOTAL_VALUE_MODE_GOLD: {
				return value ? `${Number((Parser.DEFAULT_CURRENCY_CONVERSION_TABLE.find(it => it.coin === "gp").mult * value).toFixed(2))} gp` : "";
			}

			default: {
				const CURRENCIES = ["gp", "sp", "cp"];
				const coins = {cp: value};
				CurrencyUtil.doSimplifyCoins(coins);
				return CURRENCIES.filter(it => coins[it]).map(it => `${coins[it].toLocaleStringVe()} ${it}`).join(", ");
			}
		}
	}
}

class ItemsPage extends ListPage {
	constructor () {
		const pFnGetFluff = Renderer.item.pGetFluff.bind(Renderer.item);

		super({
			dataSource: DataUtil.item.loadJSON.bind(DataUtil.item),
			prereleaseDataSource: DataUtil.item.loadPrerelease.bind(DataUtil.item),
			brewDataSource: DataUtil.item.loadBrew.bind(DataUtil.item),

			pFnGetFluff,

			pageFilter: new PageFilterItems(),

			dataProps: ["item"],

			bookViewOptions: {
				nameSingular: "item",
				namePlural: "items",
				pageTitle: "Items Book View",
				propMarkdown: "item",
				isSublistItemsCountable: true,
			},

			tableViewOptions: {
				title: "Items",
				colTransforms: {
					name: UtilsTableview.COL_TRANSFORM_NAME,
					source: UtilsTableview.COL_TRANSFORM_SOURCE,
					page: UtilsTableview.COL_TRANSFORM_PAGE,
					rarity: {name: "Rarity"},
					_type: {
						name: "Type",
						transform: (item, additionalData, {styleHint}) => {
							const {
								entryType,
								entrySubtype,
							} = Renderer.item.getTransformedTypeEntriesMeta({item, styleHint});

							return [Renderer.get().render(entryType), Renderer.get().render(entrySubtype)].filter(Boolean).join(", ");
						},
					},
					_attunement: {name: "Attunement", transform: it => it._attunement ? it._attunement.slice(1, it._attunement.length - 1) : ""},
					_damage: {name: "Damage", transform: it => Renderer.item.getRenderedDamageAndProperties(it)[0]},
					_properties: {name: "Properties", transform: it => Renderer.item.getRenderedDamageAndProperties(it)[1]},
					_mastery: {name: "Mastery", transform: it => Renderer.item.getRenderedMastery(it)},
					_weight: {name: "Weight", transform: it => Parser.itemWeightToFull(it)},
					_value: {name: "Value", transform: it => Parser.itemValueToFullMultiCurrency(it, {styleHint: this._styleHint})},
					_entries: {name: "Text", transform: (it) => Renderer.item.getRenderedEntries(it, {isCompact: true}), flex: 3},
				},
			},
			propEntryData: "item",

			listSyntax: new ListSyntaxItems({fnGetDataList: () => this._dataList, pFnGetFluff}),
		});

		this._mundaneList = null;
		this._magicList = null;
	}

	get _bindOtherButtonsOptions () {
		return {
			other: [
				this._bindOtherButtonsOptions_openAsSinglePage({slugPage: "items"}),
			].filter(Boolean),
		};
	}

	get primaryLists () { return [this._mundaneList, this._magicList]; }

	getListItem (item, itI, isExcluded) {
		const hash = UrlUtil.autoEncodeHash(item);

		if (Renderer.item.isExcluded(item, {hash})) return null;
		if (item.noDisplay) return null;
		Renderer.item.enhanceItem(item);

		this._pageFilter.mutateAndAddToFilters(item, isExcluded);

		const source = Parser.sourceJsonToAbv(item.source);
		const type = item._textTypes.join(", ").toTitleCase();

		if (item._fIsMundane) {
			const eleLi = e_({
				tag: "div",
				clazz: `lst__row ve-flex-col ${isExcluded ? "lst__row--blocklisted" : ""}`,
				click: (evt) => this._mundaneList.doSelect(listItem, evt),
				contextmenu: (evt) => this._openContextMenu(evt, this._mundaneList, listItem),
				children: [
					e_({
						tag: "a",
						href: `#${hash}`,
						clazz: "lst__row-border lst__row-inner",
						children: [
							e_({tag: "span", clazz: `ve-col-3-5 pl-0 pr-1 bold`, text: item.name}),
							e_({tag: "span", clazz: `ve-col-4-5 px-1`, text: type}),
							e_({tag: "span", clazz: `ve-col-1-5 px-1 ve-text-center`, text: item._l_value}),
							e_({tag: "span", clazz: `ve-col-1-5 px-1 ve-text-center`, text: item._l_weight}),
							e_({
								tag: "span",
								clazz: `ve-col-1 ve-text-center ${Parser.sourceJsonToSourceClassname(item.source)} pl-1 pr-0`,
								title: `${Parser.sourceJsonToFull(item.source)}${Renderer.utils.getSourceSubText(item)}`,
								text: source,
							}),
						],
					}),
				],
			});

			const listItem = new ListItem(
				itI,
				eleLi,
				item.name,
				{
					hash,
					source,
					...ListItem.getCommonValues(item),
					type,
					cost: item.value || 0,
					weight: Parser.weightValueToNumber(item.weight),
				},
				{
					isExcluded,
				},
			);

			return {mundane: listItem};
		} else {
			const eleLi = e_({
				tag: "div",
				clazz: `lst__row ve-flex-col ${isExcluded ? "lst__row--blocklisted" : ""}`,
				click: (evt) => this._magicList.doSelect(listItem, evt),
				contextmenu: (evt) => this._openContextMenu(evt, this._magicList, listItem),
				children: [
					e_({
						tag: "a",
						href: `#${hash}`,
						clazz: "lst__row-border lst__row-inner",
						children: [
							e_({tag: "span", clazz: `ve-col-3-5 pl-0 bold`, text: item.name}),
							e_({tag: "span", clazz: `ve-col-4`, text: type}),
							e_({tag: "span", clazz: `ve-col-1-5 ve-text-center`, text: item._l_weight}),
							e_({tag: "span", clazz: `ve-col-0-6 ve-text-center`, text: item._attunementCategory !== VeCt.STR_NO_ATTUNEMENT ? "×" : ""}),
							e_({
								tag: "span",
								clazz: `ve-col-1-4 ve-text-center ${item.rarity ? `itm__rarity-${item.rarity}` : ""}`,
								title: (item.rarity || "").toTitleCase(),
								text: Parser.itemRarityToShort(item.rarity) || "",
							}),
							e_({
								tag: "span",
								clazz: `ve-col-1 ve-text-center ${Parser.sourceJsonToSourceClassname(item.source)} pr-0`,
								title: `${Parser.sourceJsonToFull(item.source)}${Renderer.utils.getSourceSubText(item)}`,
								text: source,
							}),
						],
					}),
				],
			});

			const listItem = new ListItem(
				itI,
				eleLi,
				item.name,
				{
					hash,
					source,
					...ListItem.getCommonValues(item),
					type,
					rarity: item.rarity,
					attunement: item._attunementCategory !== VeCt.STR_NO_ATTUNEMENT,
					weight: Parser.weightValueToNumber(item.weight),
				},
			);

			return {magic: listItem};
		}
	}

	handleFilterChange () {
		const f = this._pageFilter.filterBox.getValues();
		const listFilter = li => this._pageFilter.toDisplay(f, this._dataList[li.ix]);
		this._mundaneList.filter(listFilter);
		this._magicList.filter(listFilter);
		FilterBox.selectFirstVisible(this._dataList);
	}

	_tabTitleStats = "Item";

	_renderStats_doBuildStatsTab ({ent}) {
		this._pgContent.empty().appends(RenderItems.getRenderedItem(ent));
	}

	async _pOnLoad_pInitPrimaryLists () {
		const iptSearch = e_(document.getElementById("lst__search"));
		const btnReset = e_(document.getElementById("reset"));
		const btnClear = e_(document.getElementById("lst__search-glass"));
		this._mundaneList = this._initList({
			iptSearch,
			btnReset,
			btnClear,
			dispPageTagline: document.getElementById(`page__subtitle`),
			wrpList: e_(document.getElementById("list-mundane")),
			syntax: this._listSyntax.build(),
			isBindFindHotkey: true,
			optsList: {
				fnSort: PageFilterItems.sortItems,
			},
		});
		this._magicList = this._initList({
			iptSearch,
			btnReset,
			btnClear,
			wrpList: e_(document.getElementById("list-magic")),
			syntax: this._listSyntax.build(),
			optsList: {
				fnSort: PageFilterItems.sortItems,
			},
		});

		SortUtil.initBtnSortHandlers(es("#filtertools-mundane"), this._mundaneList);
		SortUtil.initBtnSortHandlers(es("#filtertools-magic"), this._magicList);

		this._mundaneList.nextList = this._magicList;
		this._magicList.prevList = this._mundaneList;

		this._filterBox = await this._pageFilter.pInitFilterBox({
			iptSearch,
			wrpFormTop: e_(document.getElementById("filter-search-group")),
			btnReset,
		});
	}

	_pOnLoad_initVisibleItemsDisplay () {
		const elesMundaneAndMagic = em(`.ele-mundane-and-magic`);
		es(`.side-label--mundane`).onn("click", () => {
			const filterValues = this._pageFilter.filterBox.getValues();
			const curValue = MiscUtil.get(filterValues, "Miscellaneous", "Mundane");
			this._pageFilter.filterBox.setFromValues({
				Miscellaneous: {
					...(filterValues?.Miscellaneous || {}),
					Mundane: curValue === 1 ? 0 : 1,
				},
			});
		});
		es(`.side-label--magic`).onn("click", () => {
			const filterValues = this._pageFilter.filterBox.getValues();
			const curValue = MiscUtil.get(filterValues, "Miscellaneous", "Magic");
			this._pageFilter.filterBox.setFromValues({
				Miscellaneous: {
					...(filterValues?.Miscellaneous || {}),
					Magic: curValue === 1 ? 0 : 1,
				},
			});
		});
		const outVisibleResults = es(`.lst__wrp-search-visible`);
		const wrpListMundane = es(`.itm__wrp-list--mundane`);
		const wrpListMagic = es(`.itm__wrp-list--magic`);
		const elesMundane = em(`.ele-mundane`);
		const elesMagic = em(`.ele-magic`);
		this._mundaneList.on("updated", () => {
			// Force-show the mundane list if there are no items on display
			if (this._magicList.visibleItems.length) elesMundane.forEach(ele => ele.toggleVe(!!this._mundaneList.visibleItems.length));
			else elesMundane.forEach(ele => ele.showVe());
			elesMundaneAndMagic.forEach(ele => ele.toggleVe(!!(this._mundaneList.visibleItems.length && this._magicList.visibleItems.length)));

			const current = this._mundaneList.visibleItems.length + this._magicList.visibleItems.length;
			const total = this._mundaneList.items.length + this._magicList.items.length;
			outVisibleResults.html(`${current}/${total}`);

			// Collapse the mundane section if there are no magic items displayed
			wrpListMundane.toggleClass(`itm__wrp-list--empty`, this._mundaneList.visibleItems.length === 0);
		});
		this._magicList.on("updated", () => {
			elesMagic.forEach(ele => ele.toggleVe(!!this._magicList.visibleItems.length));
			// Force-show the mundane list if there are no items on display
			if (!this._magicList.visibleItems.length) elesMundane.forEach(ele => ele.showVe());
			else elesMundane.forEach(ele => ele.toggleVe(!!this._mundaneList.visibleItems.length));
			elesMundaneAndMagic.forEach(ele => ele.toggleVe(!!(this._mundaneList.visibleItems.length && this._magicList.visibleItems.length)));

			const current = this._mundaneList.visibleItems.length + this._magicList.visibleItems.length;
			const total = this._mundaneList.items.length + this._magicList.items.length;
			outVisibleResults.html(`${current}/${total}`);

			// Collapse the magic section if there are no magic items displayed
			wrpListMagic.toggleClass(`itm__wrp-list--empty`, this._magicList.visibleItems.length === 0);
		});
	}

	_addData (data) {
		super._addData(data);

		// Populate table labels
		es(`h3.ele-mundane span.side-label`).txt("Mundane");
		es(`h3.ele-magic span.side-label`).txt("Magic");
	}

	_addListItem (listItem) {
		if (listItem.mundane) this._mundaneList.addItem(listItem.mundane);
		if (listItem.magic) this._magicList.addItem(listItem.magic);
	}
}

const itemsPage = new ItemsPage();
itemsPage.sublistManager = new ItemsSublistManager();
window.addEventListener("load", () => itemsPage.pOnLoad());

globalThis.dbg_page = itemsPage;
