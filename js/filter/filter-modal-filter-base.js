import {EVNT_VALCHANGE} from "./filter-constants.js";

/** @abstract */
export class ModalFilterBase {
	static _$getFilterColumnHeaders (btnMeta) {
		return btnMeta.map((it, i) => $(`<button class="ve-col-${it.width} ${i === 0 ? "pl-0" : i === btnMeta.length ? "pr-0" : ""} ${it.disabled ? "" : "sort"} ve-btn ve-btn-default ve-btn-xs" ${it.disabled ? "" : `data-sort="${it.sort}"`} ${it.title ? `title="${it.title}"` : ""} ${it.disabled ? "disabled" : ""}>${it.text}</button>`));
	}

	/**
	 * @param opts Options object.
	 * @param opts.modalTitle
	 * @param opts.fnSort
	 * @param opts.pageFilter
	 * @param [opts.namespace]
	 * @param [opts.allData]
	 * @param [opts.sortByInitial]
	 * @param [opts.sortDirInitial]
	 * @param [opts.isRadio]
	 */
	constructor (opts) {
		this._modalTitle = opts.modalTitle;
		this._fnSort = opts.fnSort;
		this._sortByInitial = opts.sortByInitial;
		this._sortDirInitial = opts.sortDirInitial;
		this._pageFilter = opts.pageFilter;
		this._namespace = opts.namespace;
		this._allData = opts.allData || null;
		this._isRadio = !!opts.isRadio;

		this._list = null;
		this._filterCache = null;
	}

	get pageFilter () { return this._pageFilter; }

	get allData () { return this._allData; }

	_$getWrpList () { return $(`<div class="list ui-list__wrp ve-overflow-x-hidden ve-overflow-y-auto h-100 min-h-0"></div>`); }

	_$getColumnHeaderPreviewAll (opts) {
		return $(`<button class="ve-btn ve-btn-default ve-btn-xs ${opts.isBuildUi ? "ve-col-1" : "ve-col-0-5"}">${ListUiUtil.HTML_GLYPHICON_EXPAND}</button>`);
	}

	/**
	 * @param $wrp
	 * @param opts
	 * @param opts.$iptSearch
	 * @param opts.$btnReset
	 * @param opts.$btnOpen
	 * @param opts.$btnToggleSummaryHidden
	 * @param opts.$wrpMiniPills
	 * @param opts.isBuildUi If an alternate UI should be used, which has "send to right" buttons.
	 */
	async pPopulateWrapper ($wrp, opts = null) {
		opts = opts || {};

		await this._pInit();

		const $ovlLoading = $(`<div class="w-100 h-100 ve-flex-vh-center"><i class="dnd-font ve-muted">Loading...</i></div>`).appendTo($wrp);

		const $iptSearch = (opts.$iptSearch || $(`<input class="form-control lst__search lst__search--no-border-h h-100" type="search" placeholder="Search...">`)).disableSpellcheck();
		const $btnReset = opts.$btnReset || $(`<button class="ve-btn ve-btn-default">Reset</button>`);
		const $dispNumVisible = $(`<div class="lst__wrp-search-visible no-events ve-flex-vh-center"></div>`);

		const $wrpIptSearch = $$`<div class="w-100 relative">
			${$iptSearch}
			<div class="lst__wrp-search-glass no-events ve-flex-vh-center"><span class="glyphicon glyphicon-search"></span></div>
			${$dispNumVisible}
		</div>`;

		const $wrpFormTop = $$`<div class="ve-flex input-group ve-btn-group w-100 lst__form-top">${$wrpIptSearch}${$btnReset}</div>`;

		const $wrpFormBottom = opts.$wrpMiniPills || $(`<div class="w-100"></div>`);

		const $wrpFormHeaders = $(`<div class="input-group input-group--bottom ve-flex no-shrink"></div>`);
		const $cbSelAll = opts.isBuildUi || this._isRadio ? null : $(`<input type="checkbox">`);
		const $btnSendAllToRight = opts.isBuildUi ? $(`<button class="ve-btn ve-btn-xxs ve-btn-default ve-col-1" title="Add All"><span class="glyphicon glyphicon-arrow-right"></span></button>`) : null;

		if (!opts.isBuildUi) {
			if (this._isRadio) $wrpFormHeaders.append(`<label class="ve-btn ve-btn-default ve-btn-xs ve-col-0-5 ve-flex-vh-center" disabled></label>`);
			else $$`<label class="ve-btn ve-btn-default ve-btn-xs ve-col-0-5 ve-flex-vh-center">${$cbSelAll}</label>`.appendTo($wrpFormHeaders);
		}

		const $btnTogglePreviewAll = this._$getColumnHeaderPreviewAll(opts)
			.appendTo($wrpFormHeaders);

		this._$getColumnHeaders().forEach($ele => $wrpFormHeaders.append($ele));
		if (opts.isBuildUi) $btnSendAllToRight.appendTo($wrpFormHeaders);

		const $wrpForm = $$`<div class="ve-flex-col w-100 mb-1">${$wrpFormTop}${$wrpFormBottom}${$wrpFormHeaders}</div>`;
		const $wrpList = this._$getWrpList();

		const $btnConfirm = opts.isBuildUi ? null : $(`<button class="ve-btn ve-btn-default">Confirm</button>`);

		this._list = new List({
			$iptSearch,
			$wrpList,
			fnSort: this._fnSort,
			sortByInitial: this._sortByInitial,
			sortDirInitial: this._sortDirInitial,
		});
		const listSelectClickHandler = new ListSelectClickHandler({list: this._list});

		if (!opts.isBuildUi && !this._isRadio) listSelectClickHandler.bindSelectAllCheckbox($cbSelAll);
		ListUiUtil.bindPreviewAllButton($btnTogglePreviewAll, this._list);
		SortUtil.initBtnSortHandlers($wrpFormHeaders, this._list);
		this._list.on("updated", () => $dispNumVisible.html(`${this._list.visibleItems.length}/${this._list.items.length}`));

		this._allData = this._allData || await this._pLoadAllData();

		await this._pageFilter.pInitFilterBox({
			$wrpFormTop,
			$btnReset,
			$wrpMiniPills: $wrpFormBottom,
			namespace: this._namespace,
			$btnOpen: opts.$btnOpen,
			$btnToggleSummaryHidden: opts.$btnToggleSummaryHidden,
		});

		this._allData.forEach((it, i) => {
			this._pageFilter.mutateAndAddToFilters(it);
			const filterListItem = this._getListItem(this._pageFilter, it, i);
			this._list.addItem(filterListItem);
			if (!opts.isBuildUi) {
				if (this._isRadio) filterListItem.ele.addEventListener("click", evt => listSelectClickHandler.handleSelectClickRadio(filterListItem, evt));
				else filterListItem.ele.addEventListener("click", evt => listSelectClickHandler.handleSelectClick(filterListItem, evt));
			}
		});

		this._list.init();
		this._list.update();

		this._pageFilter.trimState();

		this._pageFilter.filterBox.on(EVNT_VALCHANGE, this._handleFilterChange.bind(this));
		this._pageFilter.filterBox.render();
		this._handleFilterChange();

		$ovlLoading.remove();

		const $wrpInner = $$`<div class="ve-flex-col h-100">
			${$wrpForm}
			${$wrpList}
			${opts.isBuildUi ? null : $$`<hr class="hr-1"><div class="ve-flex-vh-center">${$btnConfirm}</div>`}
		</div>`.appendTo($wrp.empty());

		return {
			$wrpIptSearch,
			$iptSearch,
			$wrpInner,
			$btnConfirm,
			pageFilter: this._pageFilter,
			list: this._list,
			$cbSelAll,
			$btnSendAllToRight,
		};
	}

	_isListItemMatchingFilter (f, li) { return this._isEntityItemMatchingFilter(f, this._allData[li.ix]); }
	_isEntityItemMatchingFilter (f, it) { return this._pageFilter.toDisplay(f, it); }

	async pPopulateHiddenWrapper () {
		await this._pInit();

		await this._pageFilter.pInitFilterBox({namespace: this._namespace});

		const allData = this._allData || await this._pLoadAllData();

		this.setHiddenWrapperAllData(allData);

		this._pageFilter.filterBox.render();
	}

	setHiddenWrapperAllData (allData) {
		// See `ModalFilterEquipment` if required later
		if (this._list) throw new Error(`Unimplemented!`);

		this._allData = allData;

		this._allData.forEach(ent => {
			this._pageFilter.mutateAndAddToFilters(ent);
		});

		this._pageFilter.trimState();
	}

	_handleFilterChange () {
		const f = this._pageFilter.filterBox.getValues();
		this._list.filter(li => this._isListItemMatchingFilter(f, li));
	}

	handleHiddenOpenButtonClick () {
		this._pageFilter.filterBox.show();
	}

	handleHiddenResetButtonClick (evt) {
		this._pageFilter.filterBox.reset({isResetAll: evt.shiftKey});
	}

	_getStateFromFilterExpression (filterExpression) {
		const filterSubhashMeta = Renderer.getFilterSubhashes(Renderer.splitTagByPipe(filterExpression), this._namespace);
		const subhashes = filterSubhashMeta.subhashes.map(it => `${it.key}${HASH_SUB_KV_SEP}${it.value}`);
		const unpackedSubhashes = this.pageFilter.filterBox.unpackSubHashes(subhashes, {force: true});
		return this.pageFilter.filterBox.getNextStateFromSubHashes({unpackedSubhashes});
	}

	/**
	 * N.b.: assumes any preloading has already been done
	 * @param filterExpression
	 */
	getItemsMatchingFilterExpression ({filterExpression}) {
		const f = this.getValuesFromFilterExpression({filterExpression});

		const filteredItems = this._filterCache.list.getFilteredItems({
			items: this._filterCache.list.items,
			fnFilter: li => this._isListItemMatchingFilter(f, li),
		});

		return this._filterCache.list.getSortedItems({items: filteredItems});
	}

	getEntitiesMatchingFilterExpression ({filterExpression = null, valuesOverride = null} = {}) {
		const f = this.getValuesFromFilterExpression({filterExpression});

		if (valuesOverride) {
			Object.entries(valuesOverride)
				.forEach(([header, values]) => {
					if (!f[header]) throw new Error(`Header "${header}" was not in filter values!`);

					const tgt = f[header];
					Object.entries(values)
						.forEach(([k, v]) => {
							if (tgt[k] == null) throw new Error(`Key "${k}" was not in "${header}" filter values!`);
							tgt[k] = v;
						});
				});
		}

		return this._allData.filter(this._isEntityItemMatchingFilter.bind(this, f));
	}

	getRenderedFilterExpression ({filterExpression}) {
		const nxtStateOuter = this._getStateFromFilterExpression(filterExpression);
		return this._pageFilter.filterBox.getDisplayState({nxtStateOuter});
	}

	getValuesFromFilterExpression ({filterExpression = null} = {}) {
		const nxtStateOuter = filterExpression ? this._getStateFromFilterExpression(filterExpression) : null;
		return this._pageFilter.filterBox.getValues({nxtStateOuter});
	}

	/**
	 * @param [opts]
	 * @param [opts.filterExpression] A filter expression, as usually found in @filter tags, which will be applied.
	 */
	async pGetUserSelection ({filterExpression = null} = {}) {
		// eslint-disable-next-line no-async-promise-executor
		return new Promise(async resolve => {
			const {$modalInner, doClose} = await this._pGetShowModal(resolve);

			await this.pPreloadHidden($modalInner);

			this.doApplyFilterExpression(filterExpression);

			this._filterCache.$btnConfirm.off("click").click(async () => {
				const checked = this._filterCache.list.visibleItems.filter(it => it.data.cbSel.checked);
				resolve(checked);

				doClose(true);

				// region reset selection state
				if (this._filterCache.$cbSelAll) this._filterCache.$cbSelAll.prop("checked", false);
				this._filterCache.list.items.forEach(it => {
					if (it.data.cbSel) it.data.cbSel.checked = false;
					it.ele.classList.remove("list-multi-selected");
				});
				// endregion
			});

			await UiUtil.pDoForceFocus(this._filterCache.$iptSearch[0]);
		});
	}

	async _pGetShowModal (resolve) {
		const {$modalInner, doClose} = await UiUtil.pGetShowModal({
			isHeight100: true,
			isWidth100: true,
			title: `Filter/Search for ${this._modalTitle}`,
			cbClose: (isDataEntered) => {
				if (this._filterCache) this._filterCache.$wrpModalInner.detach();
				if (!isDataEntered) resolve([]);
			},
			isUncappedHeight: true,
		});

		return {$modalInner, doClose};
	}

	doApplyFilterExpression (filterExpression) {
		if (!filterExpression) return;

		const filterSubhashMeta = Renderer.getFilterSubhashes(Renderer.splitTagByPipe(filterExpression), this._namespace);
		const subhashes = filterSubhashMeta.subhashes.map(it => `${it.key}${HASH_SUB_KV_SEP}${it.value}`);
		this.pageFilter.filterBox.setFromSubHashes(subhashes, {force: true, $iptSearch: this._filterCache.$iptSearch});
	}

	_getNameStyle () { return `bold`; }

	/**
	 * Pre-heat the modal, thus allowing access to the filter box underneath.
	 *
	 * @param [$modalInner]
	 */
	async pPreloadHidden ($modalInner) {
		// If we're rendering in "hidden" mode, create a dummy element to attach the UI to.
		$modalInner = $modalInner || $(`<div></div>`);

		if (this._filterCache) {
			this._filterCache.$wrpModalInner.appendTo($modalInner);
		} else {
			const meta = await this.pPopulateWrapper($modalInner);
			const {$iptSearch, $btnConfirm, pageFilter, list, $cbSelAll} = meta;
			const $wrpModalInner = meta.$wrpInner;

			this._filterCache = {$iptSearch, $wrpModalInner, $btnConfirm, pageFilter, list, $cbSelAll};
		}
	}

	/**
	 * Widths should total to 11/12ths, as 1/12th is set aside for the checkbox column.
	 * @abstract
	 */
	_$getColumnHeaders () { throw new Error(`Unimplemented!`); }
	async _pInit () { /* Implement as required */ }
	/** @abstract */
	async _pLoadAllData () { throw new Error(`Unimplemented!`); }
	/** @abstract */
	async _getListItem () { throw new Error(`Unimplemented!`); }
}
