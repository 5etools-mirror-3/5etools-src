import {EVNT_VALCHANGE} from "../filter/filter-constants.js";

export class GetBrewUi {
	static _RenderState = class {
		constructor () {
			this.pageFilter = null;
			this.list = null;
			this.listSelectClickHandler = null;
			this.cbAll = null;
		}
	};

	static _TypeFilter = class extends Filter {
		constructor ({brewUtil}) {
			const pageProps = brewUtil.getPageProps({fallback: ["*"]});
			super({
				header: "Category",
				items: [],
				displayFn: brewUtil.getPropDisplayName.bind(brewUtil),
				selFn: prop => pageProps.includes("*") || pageProps.includes(prop),
				isSortByDisplayItems: true,
			});
			this._brewUtil = brewUtil;
		}

		_getHeaderControls_addExtraStateBtns (opts, wrpStateBtnsOuter) {
			const menu = ContextUtil.getMenu(
				this._brewUtil.getPropPages()
					.map(page => ({page, displayPage: UrlUtil.pageToDisplayPage(page)}))
					.sort(SortUtil.ascSortProp.bind(SortUtil, "displayPage"))
					.map(({page, displayPage}) => {
						return new ContextUtil.Action(
							displayPage,
							() => {
								const propsActive = new Set(this._brewUtil.getPageProps({page, fallback: []}));
								Object.keys(this._state).forEach(prop => this._state[prop] = propsActive.has(prop) ? 1 : 0);
							},
						);
					}),
			);

			const btnPage = e_({
				tag: "button",
				clazz: `ve-btn ve-btn-default w-100 ve-btn-xs`,
				text: `Select for Page...`,
				click: evt => ContextUtil.pOpenMenu(evt, menu),
			});

			e_({
				tag: "div",
				clazz: `ve-btn-group mr-2 w-100 ve-flex-v-center`,
				children: [
					btnPage,
				],
			}).prependTo(wrpStateBtnsOuter);
		}
	};

	static _PageFilterGetBrew = class extends PageFilterBase {
		static _STATUS_FILTER_DEFAULT_DESELECTED = new Set(["wip", "deprecated", "invalid"]);

		constructor ({brewUtil}) {
			super();

			this._brewUtil = brewUtil;

			this._typeFilter = new GetBrewUi._TypeFilter({brewUtil});
			this._statusFilter = new Filter({
				header: "Status",
				items: [
					"ready",
					"wip",
					"deprecated",
					"invalid",
				],
				displayFn: StrUtil.toTitleCase.bind(StrUtil),
				itemSortFn: null,
				deselFn: it => this.constructor._STATUS_FILTER_DEFAULT_DESELECTED.has(it),
			});
			this._miscFilter = new Filter({
				header: "Miscellaneous",
				items: ["Partnered", "Sample"],
				deselFn: it => it === "Sample",
			});
		}

		static mutateForFilters (brewInfo) {
			brewInfo._fMisc = [];
			if (brewInfo._brewAuthor && brewInfo._brewAuthor.toLowerCase().startsWith("sample -")) brewInfo._fMisc.push("Sample");
			if (brewInfo.sources?.some(ab => ab.startsWith(Parser.SRC_UA_ONE_PREFIX))) brewInfo._fMisc.push("One D&D");
			if (brewInfo._brewIsPartnered) brewInfo._fMisc.push("Partnered");
		}

		addToFilters (it, isExcluded) {
			if (isExcluded) return;

			this._typeFilter.addItem(it.props);
			this._miscFilter.addItem(it._fMisc);
		}

		async _pPopulateBoxOptions (opts) {
			opts.filters = [
				this._typeFilter,
				this._statusFilter,
				this._miscFilter,
			];
		}

		toDisplay (values, it) {
			return this._filterBox.toDisplay(
				values,
				it.props,
				it._brewStatus,
				it._fMisc,
			);
		}
	};

	static async pDoGetBrew ({brewUtil, isModal: isParentModal = false} = {}) {
		return new Promise((resolve, reject) => {
			const ui = new this({brewUtil, isModal: true});
			const rdState = new this._RenderState();
			const {$modalInner} = UiUtil.getShowModal({
				isHeight100: true,
				title: `Get ${brewUtil.DISPLAY_NAME.toTitleCase()}`,
				isUncappedHeight: true,
				isWidth100: true,
				overlayColor: isParentModal ? "transparent" : undefined,
				isHeaderBorder: true,
				cbClose: async () => {
					await ui.pHandlePreCloseModal({rdState});
					resolve([...ui._brewsLoaded]);
				},
			});
			ui.pInit()
				.then(() => ui.pRender($modalInner, {rdState}))
				.catch(e => reject(e));
		});
	}

	_sortUrlList (a, b, o) {
		a = this._dataList[a.ix];
		b = this._dataList[b.ix];

		switch (o.sortBy) {
			case "name": return this.constructor._sortUrlList_byName(a, b);
			case "author": return this.constructor._sortUrlList_orFallback(a, b, SortUtil.ascSortLower, "_brewAuthor");
			case "category": return this.constructor._sortUrlList_orFallback(a, b, SortUtil.ascSortLower, "_brewPropDisplayName");
			case "added": return this.constructor._sortUrlList_orFallback(a, b, SortUtil.ascSort, "_brewAdded");
			case "modified": return this.constructor._sortUrlList_orFallback(a, b, SortUtil.ascSort, "_brewModified");
			case "published": return this.constructor._sortUrlList_orFallback(a, b, SortUtil.ascSort, "_brewPublished");
			default: throw new Error(`No sort order defined for property "${o.sortBy}"`);
		}
	}

	static _sortUrlList_byName (a, b) { return SortUtil.ascSortLowerPropNumeric("_brewName", a, b); }
	static _sortUrlList_orFallback (a, b, fn, prop) { return fn(a[prop], b[prop]) || this._sortUrlList_byName(a, b); }

	constructor ({brewUtil, isModal} = {}) {
		this._brewUtil = brewUtil;
		this._isModal = isModal;

		this._dataList = null;

		this._brewsLoaded = []; // Track the brews we load during our lifetime
	}

	async pInit () {
		this._dataList = (await this._brewUtil.pGetCombinedIndexes()) || [];
	}

	async pHandlePreCloseModal ({rdState}) {
		// region If the user has selected list items, prompt to load them before closing the modal
		const cntSel = rdState.list.items.filter(it => it.data.cbSel.checked).length;
		if (!cntSel) return;

		const isSave = await InputUiUtil.pGetUserBoolean({
			title: `Selected ${this._brewUtil.DISPLAY_NAME}`,
			htmlDescription: `You have ${cntSel} ${cntSel === 1 ? this._brewUtil.DISPLAY_NAME : this._brewUtil.DISPLAY_NAME_PLURAL} selected which ${cntSel === 1 ? "is" : "are"} not yet loaded. Would you like to load ${cntSel === 1 ? "it" : "them"}?`,
			textYes: "Load",
			textNo: "Discard",
		});
		if (!isSave) return;

		await this._pHandleClick_btnAddSelected({rdState});
		// endregion
	}

	async pRender ($wrp, {rdState} = {}) {
		rdState = rdState || new this.constructor._RenderState();

		rdState.pageFilter = new this.constructor._PageFilterGetBrew({brewUtil: this._brewUtil});

		const $btnAddSelected = $(`<button class="ve-btn ${this._brewUtil.STYLE_BTN} ve-btn-sm ve-col-0-5 ve-text-center" disabled title="Add Selected"><span class="glyphicon glyphicon-save"></button>`);

		const $wrpRows = $$`<div class="list smooth-scroll max-h-unset"><div class="lst__row ve-flex-col"><div class="lst__wrp-cells lst__row-border lst__row-inner ve-flex w-100"><i>Loading...</i></div></div></div>`;

		const $btnFilter = $(`<button class="ve-btn ve-btn-default ve-btn-sm">Filter</button>`);

		const $btnToggleSummaryHidden = $(`<button class="ve-btn ve-btn-default" title="Toggle Filter Summary Display"><span class="glyphicon glyphicon-resize-small"></span></button>`);

		const $iptSearch = $(`<input type="search" class="search manbrew__search form-control w-100 lst__search lst__search--no-border-h" placeholder="Find ${this._brewUtil.DISPLAY_NAME}...">`)
			.keydown(evt => this._pHandleKeydown_iptSearch(evt, rdState));
		const $dispCntVisible = $(`<div class="lst__wrp-search-visible no-events ve-flex-vh-center"></div>`);

		rdState.cbAll = e_({
			tag: "input",
			type: "checkbox",
		});

		const $btnReset = $(`<button class="ve-btn ve-btn-default ve-btn-sm">Reset</button>`);

		const $wrpMiniPills = $(`<div class="fltr__mini-view ve-btn-group"></div>`);

		const btnSortAddedPublished = this._brewUtil.IS_PREFER_DATE_ADDED
			? `<button class="ve-col-1-4 sort ve-btn ve-btn-default ve-btn-xs" data-sort="added">Added</button>`
			: `<button class="ve-col-1-4 sort ve-btn ve-btn-default ve-btn-xs" data-sort="published">Published</button>`;

		const $wrpSort = $$`<div class="filtertools manbrew__filtertools ve-btn-group input-group input-group--bottom ve-flex no-shrink">
			<label class="ve-col-0-5 pr-0 ve-btn ve-btn-default ve-btn-xs ve-flex-vh-center">${rdState.cbAll}</label>
			<button class="ve-col-3-5 sort ve-btn ve-btn-default ve-btn-xs" data-sort="name">Name</button>
			<button class="ve-col-3 sort ve-btn ve-btn-default ve-btn-xs" data-sort="author">Author</button>
			<button class="ve-col-1-2 sort ve-btn ve-btn-default ve-btn-xs" data-sort="category">Category</button>
			<button class="ve-col-1-4 sort ve-btn ve-btn-default ve-btn-xs" data-sort="modified">Modified</button>
			${btnSortAddedPublished}
			<button class="sort ve-btn ve-btn-default ve-btn-xs ve-grow" disabled>Source</button>
		</div>`;

		$$($wrp)`
		<div class="mt-1"><i>A list of ${this._brewUtil.DISPLAY_NAME} available in the public repository. Click a name to load the ${this._brewUtil.DISPLAY_NAME}, or view the source directly.${this._brewUtil.IS_EDITABLE ? `<br>
		Contributions are welcome; see the <a href="${this._brewUtil.URL_REPO_DEFAULT}/blob/master/README.md" target="_blank" rel="noopener noreferrer">README</a>, or stop by our <a href="https://discord.gg/5etools" target="_blank" rel="noopener noreferrer">Discord</a>.` : ""}</i></div>
		<hr class="hr-3">
		<div class="lst__form-top">
			${$btnAddSelected}
			${$btnFilter}
			${$btnToggleSummaryHidden}
			<div class="w-100 relative">
				${$iptSearch}
				<div id="lst__search-glass" class="lst__wrp-search-glass no-events ve-flex-vh-center"><span class="glyphicon glyphicon-search"></span></div>
				${$dispCntVisible}
			</div>
			${$btnReset}
		</div>
		${$wrpMiniPills}
		${$wrpSort}
		${$wrpRows}`;

		rdState.list = new List({
			$iptSearch,
			$wrpList: $wrpRows,
			fnSort: this._sortUrlList.bind(this),
			isUseJquery: true,
			isFuzzy: true,
			isSkipSearchKeybindingEnter: true,
		});

		rdState.list.on("updated", () => $dispCntVisible.html(`${rdState.list.visibleItems.length}/${rdState.list.items.length}`));

		rdState.listSelectClickHandler = new ListSelectClickHandler({list: rdState.list});
		rdState.listSelectClickHandler.bindSelectAllCheckbox($(rdState.cbAll));
		SortUtil.initBtnSortHandlers($wrpSort, rdState.list);

		this._dataList.forEach((brewInfo, ix) => {
			const {listItem} = this._pRender_getUrlRowMeta(rdState, brewInfo, ix);
			rdState.list.addItem(listItem);
		});

		await rdState.pageFilter.pInitFilterBox({
			$iptSearch: $iptSearch,
			$btnReset: $btnReset,
			$btnOpen: $btnFilter,
			$btnToggleSummaryHidden,
			$wrpMiniPills,
			namespace: `get-homebrew-${UrlUtil.getCurrentPage()}`,
		});

		this._dataList.forEach(it => rdState.pageFilter.mutateAndAddToFilters(it));

		rdState.list.init();

		rdState.pageFilter.trimState();
		rdState.pageFilter.filterBox.render();

		rdState.pageFilter.filterBox.on(
			EVNT_VALCHANGE,
			this._handleFilterChange.bind(this, rdState),
		);

		this._handleFilterChange(rdState);

		$btnAddSelected
			.prop("disabled", false)
			.click(() => this._pHandleClick_btnAddSelected({rdState}));

		$iptSearch.focus();
	}

	_handleFilterChange (rdState) {
		const f = rdState.pageFilter.filterBox.getValues();
		rdState.list.filter(li => rdState.pageFilter.toDisplay(f, this._dataList[li.ix]));
	}

	_pRender_getUrlRowMeta (rdState, brewInfo, ix) {
		const epochAddedPublished = this._brewUtil.IS_PREFER_DATE_ADDED ? brewInfo._brewAdded : brewInfo._brewPublished;
		const timestampAddedPublished = epochAddedPublished
			? DatetimeUtil.getDateStr({date: new Date(epochAddedPublished * 1000), isShort: true, isPad: true})
			: "";
		const timestampModified = brewInfo._brewModified
			? DatetimeUtil.getDateStr({date: new Date(brewInfo._brewModified * 1000), isShort: true, isPad: true})
			: "";

		const cbSel = e_({
			tag: "input",
			clazz: "no-events",
			type: "checkbox",
		});

		const btnAdd = e_({
			tag: "span",
			clazz: `ve-col-3-5 bold manbrew__load_from_url pl-0 clickable`,
			text: brewInfo._brewName,
			click: evt => this._pHandleClick_btnGetRemote({evt, btn: btnAdd, url: brewInfo.urlDownload}),
		});

		const eleLi = e_({
			tag: "div",
			clazz: `lst__row lst__row-inner not-clickable lst__row-border lst__row--focusable no-select`,
			children: [
				e_({
					tag: "div",
					clazz: `lst__wrp-cells ve-flex w-100`,
					children: [
						e_({
							tag: "label",
							clazz: `ve-col-0-5 ve-flex-vh-center ve-self-flex-stretch`,
							children: [cbSel],
						}),
						btnAdd,
						e_({tag: "span", clazz: "ve-col-3", text: brewInfo._brewAuthor}),
						e_({tag: "span", clazz: "ve-col-1-2 ve-text-center mobile__text-clip-ellipsis", text: brewInfo._brewPropDisplayName, title: brewInfo._brewPropDisplayName}),
						e_({tag: "span", clazz: "ve-col-1-4 ve-text-center code", text: timestampModified}),
						e_({tag: "span", clazz: "ve-col-1-4 ve-text-center code", text: timestampAddedPublished}),
						e_({
							tag: "span",
							clazz: "ve-col-1 manbrew__source ve-text-center pr-0",
							children: [
								e_({
									tag: "a",
									text: `View Raw`,
								})
									.attr("href", brewInfo.urlDownload)
									.attr("target", "_blank")
									.attr("rel", "noopener noreferrer"),
							],
						}),
					],
				}),
			],
			keydown: evt => this._pHandleKeydown_row(evt, {rdState, btnAdd, url: brewInfo.urlDownload, listItem}),
		})
			.attr("tabindex", ix);

		const listItem = new ListItem(
			ix,
			eleLi,
			brewInfo._brewName,
			{
				author: brewInfo._brewAuthor,
				// category: brewInfo._brewPropDisplayName, // Unwanted in search
				internalSources: brewInfo._brewInternalSources, // Used for search
			},
			{
				btnAdd,
				cbSel,
				pFnDoDownload: ({isLazy = false} = {}) => this._pHandleClick_btnGetRemote({btn: btnAdd, url: brewInfo.urlDownload, isLazy}),
			},
		);

		eleLi.addEventListener("click", evt => rdState.listSelectClickHandler.handleSelectClick(listItem, evt, {isPassThroughEvents: true}));

		return {
			listItem,
		};
	}

	async _pHandleKeydown_iptSearch (evt, rdState) {
		switch (evt.key) {
			case "Enter": {
				const firstItem = rdState.list.visibleItems[0];
				if (!firstItem) return;
				await firstItem.data.pFnDoDownload();
				return;
			}

			case "ArrowDown": {
				const firstItem = rdState.list.visibleItems[0];
				if (firstItem) {
					evt.stopPropagation();
					evt.preventDefault();
					firstItem.ele.focus();
				}
			}
		}
	}

	async _pHandleClick_btnAddSelected ({rdState}) {
		const listItems = rdState.list.items.filter(it => it.data.cbSel.checked);

		if (!listItems.length) return JqueryUtil.doToast({type: "warning", content: `Please select some ${this._brewUtil.DISPLAY_NAME_PLURAL} first!`});

		if (listItems.length > 25 && !await InputUiUtil.pGetUserBoolean({title: "Are you sure?", htmlDescription: `<div>You area about to load ${listItems.length} ${this._brewUtil.DISPLAY_NAME} files.<br>Loading large quantities of ${this._brewUtil.DISPLAY_NAME_PLURAL} can lead to performance and stability issues.</div>`, textYes: "Continue"})) return;

		rdState.cbAll.checked = false;
		rdState.list.items.forEach(item => {
			item.data.cbSel.checked = false;
			item.ele.classList.remove("list-multi-selected");
		});

		await Promise.allSettled(listItems.map(it => it.data.pFnDoDownload({isLazy: true})));
		const lazyDepsAdded = await this._brewUtil.pAddBrewsLazyFinalize();
		this._brewsLoaded.push(...lazyDepsAdded);
		JqueryUtil.doToast(`Finished loading selected ${this._brewUtil.DISPLAY_NAME}!`);
	}

	async _pHandleClick_btnGetRemote ({evt, btn, url, isLazy}) {
		if (!(url || "").trim()) return JqueryUtil.doToast({type: "danger", content: `${this._brewUtil.DISPLAY_NAME.uppercaseFirst()} had no download URL!`});

		if (evt) {
			evt.stopPropagation();
			evt.preventDefault();
		}

		const cachedHtml = btn.html();
		btn.txt("Loading...").attr("disabled", true);
		const brewsAdded = await this._brewUtil.pAddBrewFromUrl(url, {isLazy});
		this._brewsLoaded.push(...brewsAdded);
		btn.txt("Done!");
		setTimeout(() => btn.html(cachedHtml).attr("disabled", false), VeCt.DUR_INLINE_NOTIFY);
	}

	async _pHandleKeydown_row (evt, {rdState, btnAdd, url, listItem}) {
		switch (evt.key) {
			case "Enter": return this._pHandleClick_btnGetRemote({evt, btn: btnAdd, url});

			case "ArrowUp": {
				const ixCur = rdState.list.visibleItems.indexOf(listItem);

				if (~ixCur) {
					const prevItem = rdState.list.visibleItems[ixCur - 1];
					if (prevItem) {
						evt.stopPropagation();
						evt.preventDefault();
						prevItem.ele.focus();
					}
					return;
				}

				const firstItem = rdState.list.visibleItems[0];
				if (firstItem) {
					evt.stopPropagation();
					evt.preventDefault();
					firstItem.ele.focus();
				}
				return;
			}

			case "ArrowDown": {
				const ixCur = rdState.list.visibleItems.indexOf(listItem);

				if (~ixCur) {
					const nxtItem = rdState.list.visibleItems[ixCur + 1];
					if (nxtItem) {
						evt.stopPropagation();
						evt.preventDefault();
						nxtItem.ele.focus();
					}
					return;
				}

				const lastItem = rdState.list.visibleItems.last();
				if (lastItem) {
					evt.stopPropagation();
					evt.preventDefault();
					lastItem.ele.focus();
				}
			}
		}
	}
}
