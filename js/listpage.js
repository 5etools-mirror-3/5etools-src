"use strict";

class _UtilListPage {
	static pDoMassPopout (evt, ele, entityHashTuples) {
		const elePos = ele.getBoundingClientRect();

		// do this in serial to have a "window cascade" effect
		for (let i = 0; i < entityHashTuples.length; ++i) {
			const {entity, hash} = entityHashTuples[i];
			const posOffset = Renderer.hover._BAR_HEIGHT * i;

			const page = UrlUtil.getCurrentPage();
			Renderer.hover.getShowWindow(
				Renderer.hover.$getHoverContent_stats(page, entity),
				Renderer.hover.getWindowPositionExact(
					elePos.x + posOffset,
					elePos.y + posOffset,
					evt,
				),
				{
					title: entity.name,
					isPermanent: true,
					pageUrl: `${page}#${hash}`,
					isBookContent: page === UrlUtil.PG_RECIPES,
					sourceData: entity,
				},
			);
		}
	}
}

class SublistCellTemplate {
	constructor (
		{
			name,
			css,
			colStyle,
		},
	) {
		this._name = name;
		this._css = css;
		this._colStyle = colStyle || "";
	}

	get name () { return this._name; }
	get colStyle () { return this._colStyle; }

	getCss (text) {
		return [
			this._css,
			text === VeCt.STR_NONE
				? "italic"
				: "",
		]
			.filter(Boolean)
			.join(" ");
	}
}

class SublistCell {
	constructor (
		{
			text,
			title,
			css,
			style,
		},
	) {
		this._text = text;
		this._title = title;
		this._css = css;
		this._style = style;
	}

	static renderHtml ({templates, cell, ix}) {
		const text = cell instanceof SublistCell ? cell._text : cell;
		const title = cell instanceof SublistCell ? cell._title : null;
		const cssCell = cell instanceof SublistCell ? cell._css : null;
		const style = cell instanceof SublistCell ? cell._style : null;

		const css = [
			templates[ix].getCss(text),
			cssCell,
		]
			.filter(Boolean)
			.join(" ");

		const attrs = [
			`class="${css}"`,
			title ? `title="${title.qq()}"` : "",
			style ? `style="${style}"` : "",
		]
			.filter(Boolean)
			.join(" ");

		return `<span ${attrs}>${text}</span>`;
	}

	static renderMarkdown ({listItem, cell}) {
		cell = (typeof cell === "function") ? cell({listItem}) : cell;
		return (cell instanceof SublistCell) ? cell._text : cell;
	}
}

class SublistManager {
	static _SUB_HASH_PREFIX = "sublistselected";

	/**
	 * @param [opts]
	 * @param [opts.sublistListOptions] Other sublist options.
	 * @param [opts.isSublistItemsCountable] If the sublist items should be countable, i.e. have a quantity.
	 * @param [opts.shiftCountAddSubtract] If the sublist items should be countable, i.e. have a quantity.
	 */
	constructor (opts) {
		opts = opts || {};

		this._styleHint = VetoolsConfig.get("styleSwitcher", "style");

		this._sublistListOptions = opts.sublistListOptions || {};
		this._isSublistItemsCountable = !!opts.isSublistItemsCountable;
		this._shiftCountAddSubtract = opts.shiftCountAddSubtract ?? 20;

		this._persistor = new SublistPersistor();

		this._saveManager = new SaveManager();
		this._plugins = [];

		this._listPage = null;

		this._listSub = null;

		this._hasLoadedState = false;
		this._isRolling = false;

		this._contextMenuListSub = null;

		this._wrpContainer = null;
		this._wrpSummaryControls = null;

		this._pSaveSublistDebounced = MiscUtil.debounce(this._pSaveSublist.bind(this), 50);

		this._hkOnListUpdated = null;
	}

	set listPage (val) { this._listPage = val; }

	get sublistItems () { return this._listSub?.items || []; }
	get isSublistItemsCountable () { return !!this._isSublistItemsCountable; }

	addPlugin (plugin) {
		this._plugins.push(plugin);
	}

	init () {
		this._listSub.init();

		this._plugins.forEach(plugin => plugin.initLate());
	}

	async pCreateSublist () {
		this._wrpContainer = e_(document.getElementById("sublistcontainer"));

		this._listSub = new List({
			...this._sublistListOptions,
			wrpList: e_(document.getElementById("sublist")),
		});

		const wrpBtnsSortSublist = e_(document.getElementById("sublistsort"));
		if (wrpBtnsSortSublist) SortUtil.initBtnSortHandlers(wrpBtnsSortSublist, this._listSub);

		if (this._wrpContainer.hasClass(`sublist--resizable`)) this._pBindSublistResizeHandlers();

		const {wrp: wrpSummaryControls, cbOnListUpdated} = this._saveManager.getRenderedSummary({
			cbOnNew: (evt) => this.pHandleClick_new(evt),
			cbOnDuplicate: (evt) => this.pHandleClick_duplicate(evt),
			cbOnSave: (evt) => this.pHandleClick_save(evt),
			cbOnLoad: (evt) => this.pHandleClick_load(evt),
			cbOnReset: (evt, exportedSublist) => this.pDoLoadExportedSublist(exportedSublist),
			cbOnUpload: (evt) => this.pHandleClick_upload({isAdditive: evt.shiftKey}),
		});

		this._wrpSummaryControls = wrpSummaryControls;

		this._hkOnListUpdated = () => cbOnListUpdated({cntVisibleItems: this._listSub.visibleItems.length});
		this._listSub.on("updated", this._hkOnListUpdated);
		this._hkOnListUpdated();

		this._wrpContainer.aftere(this._wrpSummaryControls);

		this._initContextMenu();

		this._listSub
			.on("updated", () => {
				this._plugins.forEach(plugin => plugin.onSublistUpdate());
			});
	}

	async _pBindSublistResizeHandlers () {
		const STORAGE_KEY = "SUBLIST_RESIZE";

		const eleHandle = ee`<div class="sublist__ele-resize mobile-sm__hidden">...</div>`.appendTo(this._wrpContainer);

		let mousePos;
		const resize = (evt) => {
			evt.preventDefault();
			evt.stopPropagation();
			const dx = EventUtil.getClientY(evt) - mousePos;
			mousePos = EventUtil.getClientY(evt);
			this._wrpContainer.style.height = `${this._wrpContainer.getBoundingClientRect().height + dx}px`;
		};

		eleHandle
			.onn("mousedown", (evt) => {
				if (evt.button !== 0) return;

				evt.preventDefault();
				mousePos = evt.clientY;
				document.removeEventListener("mousemove", resize);
				document.addEventListener("mousemove", resize);
			});

		document.addEventListener("mouseup", evt => {
			if (evt.button !== 0) return;

			document.removeEventListener("mousemove", resize);
			StorageUtil.pSetForPage(STORAGE_KEY, this._wrpContainer.css("height").slice(0, -2));
		});

		// Avoid setting the height on mobile, as we force the sublist to a static size
		if (JqueryUtil.isMobile()) return;

		const storedHeight = await StorageUtil.pGetForPage(STORAGE_KEY);
		if (storedHeight) this._wrpContainer.css("height", `${storedHeight}px`);
	}

	_onSublistChange () { /* Implement as required */ }

	_getSerializedPinnedItemData (listItem) { return {}; }
	_getDeserializedPinnedItemData (serialData) { return null; }

	_getContextActionRemove () {
		return this._isSublistItemsCountable
			? new ContextUtil.Action(
				"Remove",
				async (evt, {userData}) => {
					const {selection} = userData;
					await Promise.all(selection.map(item => this.pDoSublistRemove({entity: item.data.entity, doFinalize: false})));
					await this._pFinaliseSublist();
				},
			)
			: new ContextUtil.Action(
				"Unpin",
				async (evt, {userData}) => {
					const {selection} = userData;
					for (const item of selection) {
						await this.pDoSublistRemove({entity: item.data.entity, doFinalize: false});
					}
					await this._pFinaliseSublist();
				},
			);
	}

	_initContextMenu () {
		const subActions = [
			new ContextUtil.Action(
				"Popout",
				(evt, {userData}) => {
					const {ele, selection} = userData;
					const entities = selection.map(listItem => ({entity: listItem.data.entity, hash: listItem.values.hash}));
					return _UtilListPage.pDoMassPopout(evt, ele, entities);
				},
			),
			this._getContextActionRemove(),
			new ContextUtil.Action(
				"Clear List",
				() => this.pDoSublistRemoveAll(),
			),
			null,
			new ContextUtil.Action(
				"Roll on List",
				(evt) => this._rollSubListed({evt}),
				{title: "SHIFT to Skip Animation"},
			),
			null,
			new ContextUtil.Action(
				"Send to DM Screen",
				(evt) => this._pDoSendSublistToDmScreen({evt}),
				{title: "A DM Screen panel will be created for each entry. SHIFT to use tabs."},
			),
			ExtensionUtil.ACTIVE
				? new ContextUtil.Action(
					"Send to Foundry",
					() => this._pDoSendSublistToFoundry(),
					{title: "A Rivet import will be run for each entry."},
				)
				: undefined,
			null,
			new ContextUtil.Action(
				"Download JSON Data",
				() => this._pHandleJsonDownload(),
			),
			new ContextUtil.Action(
				"Download Markdown Data",
				() => this._pHandleMarkdownDownload(),
			),
			null,
			new ContextUtil.Action(
				"Copy as Markdown Table",
				() => this._pHandleCopyAsMarkdownTable(),
			),
		].filter(it => it !== undefined);
		this._contextMenuListSub = ContextUtil.getMenu(subActions);
	}

	_handleSublistItemContextMenu (evt, listItem) {
		const menu = this._contextMenuListSub;

		const listSelected = this._listSub.getSelected();
		const isItemInSelection = listSelected.length && listSelected.some(li => li === listItem);
		const selection = isItemInSelection ? listSelected : [listItem];
		if (!isItemInSelection) {
			this._listSub.deselectAll();
			this._listSub.doSelect(listItem);
		}

		ContextUtil.pOpenMenu(evt, menu, {userData: {ele: listItem.ele, selection}}).then(null);
	}

	pGetSublistItem () { throw new Error(`Unimplemented!`); }

	async pDoSublistRemoveAll ({isNoSave = false} = {}) {
		this._listSub.removeAllItems();
		await this._plugins.pSerialAwaitMap(plugin => plugin.pHandleRemoveAll());
		await this._pFinaliseSublist({isNoSave});
	}

	/**
	 * @param isForceIncludePlugins
	 * @param isMemoryOnly If this export is for a temporary internal application, e.g. export-modify-import.
	 */
	async pGetExportableSublist ({isForceIncludePlugins = false, isMemoryOnly = false} = {}) {
		const sources = new Set();
		const toSave = this._listSub.items
			.map(it => {
				sources.add(it.data.entity.source);

				return {
					h: it.values.hash.split(HASH_PART_SEP)[0],
					c: it.data.count || undefined,
					customHashId: this._getCustomHashId({entity: it.data.entity}) || undefined,
					...this._getSerializedPinnedItemData(it),
				};
			});
		const exportedSublist = {items: toSave, sources: Array.from(sources)};

		this._saveManager.mutSaveableData({exportedSublist});
		await this._plugins.pSerialAwaitMap(plugin => plugin.pMutSaveableData({
			exportedSublist,
			isForce: isForceIncludePlugins,
			isMemoryOnly,
		}));

		return exportedSublist;
	}

	async pDoLoadExportedSublist (
		exportedSublist,
		{
			isAdditive = false,
			isMemoryOnly = false,
			isNoSave = false,
		} = {},
	) {
		// This should never be necessary, but, ensure no unwanted state gets passed
		if (exportedSublist) ListUtil.getWithoutManagerClientState(exportedSublist);

		// Note that `exportedSublist` keys are case-insensitive here, as we can load from URL
		await this._plugins.pSerialAwaitMap(plugin => plugin.pMutLegacyData({exportedSublist, isMemoryOnly}));

		// Do this in series to ensure sublist items are added before having their counts updated
		//  This only becomes a problem when there are duplicate items in the list, but as we're not finalizing, the
		//  performance implications are negligible.
		const entityInfos = await ListUtil.pGetSublistEntities_fromList({
			exportedSublist,
			dataList: this._listPage.dataList_,
		});

		if (exportedSublist && !isAdditive) await this.pDoSublistRemoveAll({isNoSave: true});

		await this._listPage.pDoLoadExportedSublistSources(exportedSublist);

		for (const entityInfo of entityInfos) {
			const {count, entity, ser} = entityInfo;

			await this.pDoSublistAdd({
				addCount: count,
				entity,
				initialData: this._getDeserializedPinnedItemData(ser),
				doFinalize: false,
			});
		}

		await this._plugins.pSerialAwaitMap(plugin => plugin.pLoadData({
			exportedSublist,
			isAdditive,
			isMemoryOnly,
		}));

		await this._saveManager.pDoUpdateCurrentStateFrom(exportedSublist, {isNoSave});

		await this._pFinaliseSublist({isNoSave});
	}

	async pGetHashPartExport () {
		const toEncode = JSON.stringify(await this.pGetExportableSublist());
		return UrlUtil.packSubHash(this.constructor._SUB_HASH_PREFIX, [toEncode], {isEncodeBoth: true});
	}

	async pHandleClick_btnPin ({entity}) {
		if (!this.isSublisted({entity})) {
			await this.pDoSublistAdd({entity, doFinalize: true});
			return;
		}

		await this.pDoSublistRemove({entity, doFinalize: true});
	}

	getTitleBtnAdd () { return `Add (SHIFT for ${this._shiftCountAddSubtract}) (Hotkey: p)`; }
	getTitleBtnSubtract () { return `Subtract (SHIFT for ${this._shiftCountAddSubtract}) (Hotkey: P)`; }

	async pHandleClick_btnAdd ({entity, isMultiple = false}) {
		const addCount = isMultiple ? this._shiftCountAddSubtract : 1;
		return this.pDoSublistAdd({
			index: Hist.lastLoadedId,
			entity,
			doFinalize: true,
			addCount,
		});
	}

	async pHandleClick_btnSubtract ({entity, isMultiple = false}) {
		const subtractCount = isMultiple ? this._shiftCountAddSubtract : 1;
		return this.pDoSublistSubtract({
			index: Hist.lastLoadedId,
			entity,
			subtractCount,
		});
	}

	async pHandleClick_btnAddAll ({entities}) {
		for (const entity of entities) await this.pDoSublistAdd({entity});
		await this._pFinaliseSublist();
	}

	async pHandleClick_btnPinAll ({entities}) {
		for (const entity of entities) {
			if (!this.isSublisted({entity})) await this.pDoSublistAdd({entity});
		}
		await this._pFinaliseSublist();
	}

	async _pHandleJsonDownload () {
		const entities = this.getSublistedEntities().map(ent => MiscUtil.copyFast(ent));
		entities.forEach(ent => DataUtil.cleanJson(ent));
		DataUtil.userDownload(`${this._getDownloadName()}-data`, entities);
	}

	async _pHandleMarkdownDownload () {
		const markdown = this.getSublistedEntities()
			.map(ent => {
				return RendererMarkdown.get().render({
					entries: [
						{
							type: "statblockInline",
							dataType: ent.__prop,
							data: ent,
						},
					],
				})
					.trim();
			})
			.join("\n\n---\n\n");

		DataUtil.userDownloadText(`${this._getDownloadName()}.md`, markdown);
	}

	async _pHandleCopyAsMarkdownTable () {
		await MiscUtil.pCopyTextToClipboard(
			RendererMarkdown.get()
				.render({
					type: "table",
					colStyles: this.constructor._getRowEntryColStyles(),
					colLabels: this.constructor._getRowEntryColLabels(),
					rows: this._listSub.items
						.map(listItem => {
							return listItem.data.mdRow
								.map(cell => SublistCell.renderMarkdown({listItem, cell}));
						}),
				}),
		);
	}

	async pHandleClick_new (evt) {
		const exportableSublist = await this.pGetExportableSublist({isForceIncludePlugins: true});
		const exportableSublistMemory = await this.pGetExportableSublist({isForceIncludePlugins: true, isMemoryOnly: true});
		const didNew = await this._saveManager.pDoNew(exportableSublist);
		if (!didNew) return;
		await this.pDoSublistRemoveAll();

		// Handle e.g. copying some aspects of the old state over
		await this._plugins.pSerialAwaitMap(plugin => plugin.pDoInitNewState({
			prevExportableSublist: exportableSublistMemory,
			evt,
		}));
	}

	async pHandleClick_duplicate (evt) {
		await this._saveManager.pDoDuplicate(await this.pGetExportableSublist({isForceIncludePlugins: true}));
		// Simulate a list update, as the list display itself does not change during duplication
		this._hkOnListUpdated();
	}

	async pHandleClick_load (evt) {
		const exportedSublist = await this._saveManager.pDoLoad();
		if (exportedSublist == null) return;

		await this.pDoLoadExportedSublist(exportedSublist);
	}

	async pHandleClick_save (evt) {
		const saveInfo = await this._saveManager.pDoSave(await this.pGetExportableSublist({isForceIncludePlugins: true}));
		if (saveInfo == null) return;

		await this._pSaveSublist();

		JqueryUtil.doToast(`Saved "${saveInfo.name}"!`);

		return true;
	}

	/**
	 * @param isUrl
	 * @param {?HTMLElementExtended} eleCopyEffect
	 * @return {Promise<void>}
	 */
	async pHandleClick_download (
		{
			isUrl = false,
			eleCopyEffect = null,
		} = {},
	) {
		const exportableSublist = await this.pGetExportableSublist();

		if (isUrl) {
			const parts = [
				window.location.href,
				await this.pGetHashPartExport(),
			];
			await MiscUtil.pCopyTextToClipboard(parts.join(HASH_PART_SEP));
			JqueryUtil.showCopiedEffect(eleCopyEffect);
			return;
		}

		const filename = this._getDownloadName();
		const fileType = this._getDownloadFileType();
		DataUtil.userDownload(filename, exportableSublist, {fileType});
	}

	async pHandleClick_upload ({isAdditive = false} = {}) {
		const {jsons, errors} = await InputUiUtil.pGetUserUploadJson({expectedFileTypes: this._getUploadFileTypes()});

		DataUtil.doHandleFileLoadErrorsGeneric(errors);

		if (!jsons?.length) return;

		const json = jsons[0];

		await this.pDoLoadExportedSublist(json, {isAdditive});
	}

	_getDownloadName () {
		const fromPlugin = this._plugins.first(plugin => plugin.getDownloadName());
		if (fromPlugin) return fromPlugin;
		return `${UrlUtil.getCurrentPage().replace(".html", "")}-sublist`;
	}

	_getDownloadFileTypeBase () {
		return `${UrlUtil.getCurrentPage().replace(".html", "")}-sublist`;
	}

	_getDownloadFileType () {
		const fromPlugin = this._plugins.first(plugin => plugin.getDownloadFileType());
		if (fromPlugin) return fromPlugin;
		return this._getDownloadFileTypeBase();
	}

	_getUploadFileTypes () {
		const fromPlugin = this._plugins.first(plugin => plugin.getUploadFileTypes({
			downloadFileTypeBase: this._getDownloadFileTypeBase(),
		}));
		if (fromPlugin) return fromPlugin;
		return [this._getDownloadFileType()];
	}

	async pSetFromSubHashes (subHashes, pFnPreLoad) {
		// TODO(unpack) refactor
		const unpacked = {};
		subHashes.forEach(s => {
			const unpackedPart = UrlUtil.unpackSubHash(s, true);
			if (Object.keys(unpackedPart).length > 1) throw new Error(`Multiple keys in subhash!`);
			const k = Object.keys(unpackedPart)[0];
			unpackedPart[k] = {clean: unpackedPart[k], raw: s};
			Object.assign(unpacked, unpackedPart);
		});

		const setFrom = unpacked[this.constructor._SUB_HASH_PREFIX]?.clean;
		if (setFrom) {
			const json = JSON.parse(setFrom);

			if (pFnPreLoad) {
				await pFnPreLoad(json);
			}

			await this.pDoLoadExportedSublist(json);

			const [link] = Hist.getHashParts();
			const outSub = [];
			Object.keys(unpacked)
				.filter(k => k !== this.constructor._SUB_HASH_PREFIX)
				.forEach(k => {
					outSub.push(`${k}${HASH_SUB_KV_SEP}${unpacked[k].clean.join(HASH_SUB_LIST_SEP)}`);
				});
			Hist.setSuppressHistory(true);
			window.location.hash = `#${link}${outSub.length ? `${HASH_PART_SEP}${outSub.join(HASH_PART_SEP)}` : ""}`;
		}

		return Object.entries(unpacked)
			.filter(([k]) => k !== this.constructor._SUB_HASH_PREFIX)
			.map(([, v]) => v.raw);
	}

	getSublistListItem ({hash}) {
		return this._listSub.items.find(it => it.values.hash === hash);
	}

	async pDoSublistAdd ({entity, doFinalize = false, addCount = 1, initialData = null} = {}) {
		if (entity == null) {
			return JqueryUtil.doToast({
				content: "Please first view something from the list.",
				type: "danger",
			});
		}

		const hash = this._getSublistFullHash({entity});

		const existingSublistItem = this.getSublistListItem({hash});
		if (existingSublistItem != null) {
			existingSublistItem.data.count += addCount;
			this._updateSublistItemDisplays(existingSublistItem);
			if (doFinalize) await this._pFinaliseSublist();
			return;
		}

		await this._pDoSublistAddInitial({entity, hash, count: addCount, initialData, doFinalize});
	}

	_getSublistFullHash ({entity}) {
		return UrlUtil.autoEncodeHash(entity);
	}

	_getCustomHashId ({entity}) { return null; }

	async pDoSublistSubtract ({entity, subtractCount = 1} = {}) {
		const hash = this._getSublistFullHash({entity});

		const sublistItem = this.getSublistListItem({hash});
		if (!sublistItem) return;

		sublistItem.data.count -= subtractCount;
		if (sublistItem.data.count <= 0) {
			await this.pDoSublistRemove({entity, doFinalize: true});
			return;
		}

		this._updateSublistItemDisplays(sublistItem);
		await this._pFinaliseSublist();
	}

	async pDoSublistSetCount ({entity, doFinalize = false, count, initialData = null}) {
		if (entity == null) {
			return JqueryUtil.doToast({
				content: "Please first view something from the list.",
				type: "danger",
			});
		}

		const hash = this._getSublistFullHash({entity});

		const existingSublistItem = this.getSublistListItem({hash});
		if (existingSublistItem != null) {
			existingSublistItem.data.count = count;
			this._updateSublistItemDisplays(existingSublistItem);
			if (doFinalize) await this._pFinaliseSublist();
			return;
		}

		await this._pDoSublistAddInitial({entity, hash, count, initialData, doFinalize});
	}

	async _pDoSublistAddInitial ({entity, hash, count, initialData, doFinalize}) {
		const sublistItem = await this.pGetSublistItem(
			entity,
			hash,
			{
				count: count,
				customHashId: this._getCustomHashId({entity}),
				initialData,
			},
		);
		this._listSub.addItem(sublistItem);
		if (doFinalize) await this._pFinaliseSublist();
	}

	async pSetDataEntry ({sublistItem, key, value}) {
		sublistItem.data[key] = value;
		this._updateSublistItemDisplays(sublistItem);
		await this._pFinaliseSublist();
	}

	getSublistedEntities () {
		return this._listSub.items.map(({data}) => data.entity);
	}

	getSublistedEntityMetas () {
		return this._listSub.items
			.map(({data}) => ({entity: data.entity, count: data.count ?? 1}));
	}

	_updateSublistItemDisplays (sublistItem) {
		(sublistItem.data.elesCount || [])
			.forEach(ele => {
				if (ele.is("input")) ele.val(sublistItem.data.count);
				else ele.txt(sublistItem.data.count);
			});

		(sublistItem.data.fnsUpdate || [])
			.forEach(fn => fn({sublistItem}));
	}

	async _pFinaliseSublist ({isNoSave = false} = {}) {
		const isUpdateFired = this._listSub.update();

		// Manually trigger plugin updates if the list failed to do so
		if (!isUpdateFired) this._plugins.forEach(plugin => plugin.onSublistUpdate());

		this.doUpdateSublistVisibility();
		this._onSublistChange();
		if (!isNoSave) await this._pSaveSublist();
	}

	async _pSaveSublist () {
		await this._persistor.pDoSaveStateToStorage({
			exportableSublist: await this.pGetExportableSublist({isForceIncludePlugins: true}),
		});
		await this._saveManager.pDoSaveStateToStorage();
	}

	async pSaveSublistDebounced () {
		return this._pSaveSublistDebounced();
	}

	_isDisplaySublist () {
		// Always show the controls (including the list's name) if we're editing a previously-saved
		//   list, to differentiate between "new, unsaved list" and "editing existing list"
		if (this._saveManager.isActiveListSaved()) return true;
		return !!this._listSub.items.length;
	}

	doUpdateSublistVisibility () {
		this._wrpContainer.toggleClass("sublist--visible", this._isDisplaySublist());
		this._wrpSummaryControls.toggleVe(this._isDisplaySublist());
	}

	async pDoSublistRemove ({entity, doFinalize = true} = {}) {
		const hash = this._getSublistFullHash({entity});
		const sublistItem = this.getSublistListItem({hash});
		if (!sublistItem) return;
		this._listSub.removeItem(sublistItem);
		if (doFinalize) await this._pFinaliseSublist();
	}

	isSublisted ({entity}) {
		const hash = this._getSublistFullHash({entity});
		return !!this.getSublistListItem({hash});
	}

	async pLoadState () {
		if (this._hasLoadedState) return;
		this._hasLoadedState = true;
		try {
			const store = await this._persistor.pGetStateFromStorage();
			await this.pDoLoadExportedSublist(store, {isNoSave: true});

			await this._saveManager.pMutStateFromStorage();
		} catch (e) {
			setTimeout(() => { throw e; });
			await this._saveManager.pDoRemoveStateFromStorage();
			await this._persistor.pDoRemoveStateFromStorage();
		}
	}

	async pGetSelectedSources () {
		let store;
		try {
			store = await this._persistor.pGetStateFromStorage();
		} catch (e) {
			setTimeout(() => { throw e; });
		}
		if (store?.sources) return store.sources;
		return [];
	}

	async _pDoSendSublistToDmScreen ({evt}) {
		try {
			const exportedSublist = await this.pGetExportableSublist();
			const len = exportedSublist.items.length;
			await StorageUtil.pSet(
				VeCt.STORAGE_DMSCREEN_TEMP_SUBLIST,
				{
					page: UrlUtil.getCurrentPage(),
					exportedSublist,
					isTabs: evt.shiftKey,
				},
			);
			JqueryUtil.doToast(`${len} pin${len === 1 ? "" : "s"} will be loaded into the DM Screen on your next visit.`);
		} catch (e) {
			JqueryUtil.doToast(`Failed! ${VeCt.STR_SEE_CONSOLE}`);
			setTimeout(() => { throw e; });
		}
	}

	async _pDoSendSublistToFoundry () {
		const list = await this.pGetExportableSublist();
		const len = list.items.length;

		const page = UrlUtil.getCurrentPage();

		for (const serialItem of list.items) {
			const {entity} = await this.constructor.pDeserializeExportedSublistItem(serialItem);
			await ExtensionUtil._doSend("entity", {page, entity});
		}

		JqueryUtil.doToast(`Attempted to send ${len} item${len === 1 ? "" : "s"} to Foundry.`);
	}

	static async pDeserializeExportedSublistItem (serialItem) {
		const page = UrlUtil.getCurrentPage();
		const entityBase = await DataLoader.pCacheAndGetHash(page, serialItem.h);
		return {
			entity: await Renderer.hover.pApplyCustomHashId(page, entityBase, serialItem.customHashId),
			entityBase: serialItem.customHashId != null ? entityBase : null,
			count: serialItem.c,
			isLocked: !!serialItem.l,
			customHashId: serialItem.customHashId,
		};
	}

	_rollSubListed ({evt}) {
		if (this._isRolling) return;

		if (this._listSub.items.length <= 1) {
			return JqueryUtil.doToast({
				content: "Not enough entries to roll!",
				type: "danger",
			});
		}

		// FIXME(Future) update sublist from current hash state -> this becomes redundant
		this._listSub.items
			.forEach(listItem => listItem.isSelected = false);

		// Skip animation if SHIFT is pressed
		if (evt.shiftKey) {
			evt.preventDefault();
			const listItem = RollerUtil.rollOnArray(this._listSub.items);
			listItem.isSelected = true;
			window.location.hash = listItem.ele.find("a").attr("href");
			return;
		}

		const timerMult = RollerUtil.randomise(125, 75);
		const timers = [0, 1, 1, 1, 1, 1, 1.5, 1.5, 1.5, 2, 2, 2, 2.5, 3, 4, -1] // last element is always sliced off
			.map(it => it * timerMult)
			.slice(0, -RollerUtil.randomise(4));

		if (this._isRolling) return;

		this._isRolling = true;

		const sequence = this._rollSubListed_getSequence(this._listSub.items, timers.length);

		let total = 0;
		timers.map((it, i) => {
			total += it;
			setTimeout(() => {
				// FIXME(Future) update sublist from current hash state -> this becomes redundant
				this._listSub.items
					.forEach(listItem => listItem.isSelected = false);
				const listItem = sequence[i];
				listItem.isSelected = true;
				window.location.hash = listItem.ele.find("a").attr("href");
				if (i === timers.length - 1) this._isRolling = false;
			}, total);
		});
	}

	_rollSubListed_getSequence (array, length) {
		const out = [RollerUtil.rollOnArray(array)];
		for (let i = 0; i < length; ++i) {
			let next = RollerUtil.rollOnArray(array);
			while (next === out.last()) {
				next = RollerUtil.rollOnArray(array);
			}
			out.push(next);
		}
		return out;
	}

	doSublistDeselectAll () { this._listSub.deselectAll(); }

	/* -------------------------------------------- */

	static _ROW_TEMPLATE_CACHE;

	static get _ROW_TEMPLATE () {
		this._ROW_TEMPLATE_CACHE ||= this._getRowTemplate();
		return this._ROW_TEMPLATE_CACHE;
	}

	static _getRowTemplate () { throw new Error("Unimplemented!"); }

	static _doValidateRowTemplateValues ({values, templates}) {
		if (values.length !== templates.length) throw new Error(`Length of row template and row values did not match! This is a bug!`);
	}

	/**
	 * @param values
	 * @param {Array<SublistCellTemplate>} templates
	 */
	static _getRowCellsHtml ({values, templates = null}) {
		templates = templates || this._ROW_TEMPLATE;
		this._doValidateRowTemplateValues({values, templates});
		return values
			.map((val, i) => SublistCell.renderHtml({templates, cell: val, ix: i}))
			.join("");
	}

	static _getRowEntryColLabels () { return this._ROW_TEMPLATE.map(it => it.name); }
	static _getRowEntryColStyles () { return this._ROW_TEMPLATE.map(it => it.colStyle); }
}

class ListPageStateManager extends BaseComponent {
	static _STORAGE_KEY;

	async pInit () {
		const saved = await this._pGetPersistedState();
		if (!saved) return;
		this.setStateFrom(saved);
	}

	async _pGetPersistedState () {
		return StorageUtil.pGetForPage(this.constructor._STORAGE_KEY);
	}

	async _pPersistState () {
		await StorageUtil.pSetForPage(this.constructor._STORAGE_KEY, this.getSaveableState());
	}

	addHookBase (prop, hk) { return this._addHookBase(prop, hk); }
	removeHookBase (prop, hk) { return this._removeHookBase(prop, hk); }
}

class ListPageSettingsManager extends ListPageStateManager {
	static _STORAGE_KEY = "listPageSettings";

	static _SETTINGS = [];

	_getSettings () { return {}; }

	bindBtnOpen ({btn}) {
		if (!btn) return;

		btn
			.addEventListener(
				"click",
				() => {
					const btnReset = ee`<button class="ve-btn ve-btn-default ve-btn-xs" title="Reset"><span class="glyphicon glyphicon-refresh"></span></button>`
						.onn("click", () => {
							this._proxyAssignSimple("state", this._getDefaultState(), true);
							this._pPersistState()
								.then(() => Hist.hashChange());
						});

					const {eleModalInner} = UiUtil.getShowModal({
						isIndestructible: true,
						isHeaderBorder: true,
						title: "Settings",
						cbClose: () => {
							this._pPersistState()
								.then(() => Hist.hashChange());
						},
						eleTitleSplit: btnReset,
					});

					const rows = Object.entries(this._getSettings())
						.map(([prop, setting]) => {
							switch (setting.type) {
								case "boolean": {
									return ee`<label class="split-v-center stripe-even py-1">
										<span>${setting.name}</span>
										${ComponentUiUtil.getCbBool(this, prop)}
									</label>`;
								}

								case "enum": {
									return ee`<label class="split-v-center stripe-even py-1">
										<span>${setting.name}</span>
										${ComponentUiUtil.getSelEnum(this, prop, {values: setting.enumVals})}
									</label>`;
								}

								default: throw new Error(`Unhandled type "${setting.type}"`);
							}
						});

					ee(eleModalInner)`<div class="ve-flex-col">
						${rows}
					</div>`;
				},
			);
	}

	getValues () {
		return MiscUtil.copyFast(this.__state);
	}

	async pSet (key, val) {
		this._state[key] = val;
		await this._pPersistState();
	}

	get (key) { return this._state[key]; }

	_getDefaultState () {
		return SettingsUtil.getDefaultSettings(this._getSettings());
	}
}

class ListPage {
	static _LAZY_ENTITY_COUNT_THRESHOLD = 20_000;

	/**
	 * @param opts Options object.
	 * @param opts.dataSource Main JSON data url or function to fetch main data.
	 * @param [opts.prereleaseDataSource] Function to fetch prerelease data.
	 * @param [opts.brewDataSource] Function to fetch brew data.
	 * @param [opts.pFnGetFluff] Function to fetch fluff for a given entity.
	 * @param [opts.pageFilter] PageFilterBase implementation for this page. (Either `filters` and `filterSource` or
	 * `pageFilter` must be specified.)
	 * @param opts.listOptions Other list options.
	 * @param opts.dataProps JSON data propert(y/ies).
	 *
	 * @param [opts.bookViewOptions] Book view options.
	 * @param [opts.bookViewOptions.ClsBookView]
	 * @param [opts.bookViewOptions.pageTitle]
	 * @param [opts.bookViewOptions.namePlural]
	 * @param [opts.bookViewOptions.propMarkdown]
	 * @param [opts.bookViewOptions.fnPartition]
	 *
	 * @param [opts.tableViewOptions] Table view options.
	 * @param [opts.hasAudio] True if the entities have pronunciation audio.
	 * @param [opts.isPreviewable] True if the entities can be previewed in-line as part of the list.
	 * @param [opts.isLoadDataAfterFilterInit] If the order of data loading and filter-state loading should be flipped.
	 * @param [opts.propEntryData]
	 * @param [opts.listSyntax]
	 * @param [opts.compSettings]
	 */
	constructor (opts) {
		this._styleHint = VetoolsConfig.get("styleSwitcher", "style");

		this._dataSource = opts.dataSource;
		this._prereleaseDataSource = opts.prereleaseDataSource;
		this._brewDataSource = opts.brewDataSource;
		this._pFnGetFluff = opts.pFnGetFluff;
		this._pageFilter = opts.pageFilter;
		this._listOptions = opts.listOptions || {};
		this._dataProps = opts.dataProps;
		this._bookViewOptions = opts.bookViewOptions;
		this._tableViewOptions = opts.tableViewOptions;
		this._hasAudio = opts.hasAudio;
		this._isPreviewable = opts.isPreviewable;
		this._isLoadDataAfterFilterInit = !!opts.isLoadDataAfterFilterInit;
		this._propEntryData = opts.propEntryData;
		this._listSyntax = opts.listSyntax || new ListUiUtil.ListSyntax({fnGetDataList: () => this._dataList, pFnGetFluff: opts.pFnGetFluff});
		this._compSettings = opts.compSettings ? opts.compSettings : null;

		this._lockHashchange = new VeLock({name: "hashchange"});
		this._renderer = Renderer.get();
		this._list = null;
		this._filterBox = null;
		this._dataList = [];
		this._ixData = 0;
		this._bookView = null;
		this._sublistManager = null;
		this._btnsTabs = {};
		this._lastRender = {};

		this._pgContent = null;
		this._wrpTabs = null;

		this._contextMenuList = null;

		this._seenHashes = new Set();
	}

	get primaryLists () { return [this._list]; }
	get dataList_ () { return this._dataList; }

	set sublistManager (val) {
		this._sublistManager = val;
		val.listPage = this;
	}

	async pOnLoad () {
		Hist.setListPage(this);

		this._pOnLoad_findPageElements();

		await Promise.all([
			PrereleaseUtil.pInit(),
			BrewUtil2.pInit(),
		]);
		await ExcludeUtil.pInitialise();

		await this._pOnLoad_pInitSettingsManager();

		let data;
		// For pages which can load data without filter state, load the data early
		if (!this._isLoadDataAfterFilterInit) {
			await this._pOnLoad_pPreDataLoad();
			data = await this._pOnLoad_pGetData();
		}

		await this._pOnLoad_pInitPrimaryLists();

		// For pages which cannot load data without filter state, load the data late
		if (this._isLoadDataAfterFilterInit) {
			await this._pOnLoad_pPreDataLoad();
			data = await this._pOnLoad_pGetData();
		}

		this._pOnLoad_initVisibleItemsDisplay();

		if (this._sublistManager) {
			if (this._sublistManager.isSublistItemsCountable) {
				this._bindAddButton();
				this._bindSubtractButton();
			} else {
				this._bindPinButton();
			}
			this._initContextMenu();

			await this._sublistManager.pCreateSublist();
		}

		await this._pOnLoad_pPreDataAdd();

		this._addData(data);

		if (this._pageFilter) this._pageFilter.trimState();

		await this._pOnLoad_pLoadListState();

		this._pOnLoad_bindMiscButtons();

		this._pOnLoad_pBookView().then(null);
		this._pOnLoad_tableView();

		Hist.setFnLoadHash(this.pDoLoadHash.bind(this));
		Hist.setFnLoadSubhash(this.pDoLoadSubHash.bind(this));
		Hist.setFnHandleUnknownHash(this.pHandleUnknownHash.bind(this));

		this.primaryLists.forEach(list => list.init({
			// Throttle input changes if the user has an arbitrarily large number of items loaded
			isLazySearch: this._dataList.length > this.constructor._LAZY_ENTITY_COUNT_THRESHOLD,
		}));
		if (this._sublistManager) this._sublistManager.init();

		Hist.init(true);

		ListPage._checkShowAllExcluded(this._dataList, this._pgContent);

		if (this._filterBox) this._filterBox.on(FILTER_BOX_EVNT_VALCHANGE, this.handleFilterChange.bind(this));
		this.handleFilterChange();

		await this._pOnLoad_pPostLoad();

		window.dispatchEvent(new Event("toolsLoaded"));
	}

	_pOnLoad_findPageElements () {
		this._pgContent = e_(document.getElementById("pagecontent"));
		this._wrpTabs = e_(document.getElementById("stat-tabs"));
	}

	async _pOnLoad_pInitSettingsManager () {
		if (!this._compSettings) return;

		await this._compSettings.pInit();
		this._compSettings.bindBtnOpen({btn: document.getElementById("btn-list-settings")});
	}

	async _pOnLoad_pInitPrimaryLists () {
		const iptSearch = e_(document.getElementById("lst__search"));
		const btnReset = e_(document.getElementById("reset"));
		this._list = this._initList({
			iptSearch,
			wrpList: e_(document.getElementById("list")),
			btnReset,
			btnClear: e_(document.getElementById("lst__search-glass")),
			dispPageTagline: e_(document.getElementById(`page__subtitle`)),
			isPreviewable: this._isPreviewable,
			syntax: this._listSyntax.build(),
			isBindFindHotkey: true,
			optsList: this._listOptions,
		});
		const wrpBtnsSort = es("#filtertools");
		SortUtil.initBtnSortHandlers(wrpBtnsSort, this._list);
		if (this._isPreviewable) this._doBindPreviewAllButton(wrpBtnsSort.find(`[name="list-toggle-all-previews"]`));

		this._filterBox = await this._pageFilter.pInitFilterBox({
			iptSearch,
			wrpFormTop: e_(document.getElementById("filter-search-group")),
			btnReset,
		});
	}

	_pOnLoad_initVisibleItemsDisplay () {
		const outVisibleResults = es(`.lst__wrp-search-visible`);
		this._list.on("updated", () => outVisibleResults.html(`${this._list.visibleItems.length}/${this._list.items.length}`));
	}

	async _pOnLoad_pLoadListState () {
		await this._sublistManager.pLoadState();
		this._sublistManager.doUpdateSublistVisibility();
	}

	_pOnLoad_bindMiscButtons () {
		this._bindPopoutButton();
		this._bindLinkExportButton();
		this._bindOtherButtons({
			...(this._bindOtherButtonsOptions || {}),
		});

		const btnReset = e_(document.getElementById("reset"));
		// TODO(MODULES) refactor
		import("./utils-brew/utils-brew-ui-manage.js")
			.then(({ManageBrewUi}) => {
				ManageBrewUi.bindBtngroupManager(e_({id: "btngroup-manager"}));
			});
		this._renderListFeelingLucky({btnReset});
		this._renderListShowHide({
			eleWrpList: e_(document.getElementById("listcontainer")),
			wrpContent: e_(document.getElementById("contentwrapper")),
			btnReset,
		});
		if (this._hasAudio) Renderer.utils.bindPronounceButtons();
	}

	async _pOnLoad_pPreDataLoad () { /* Implement as required */ }
	async _pOnLoad_pPostLoad () { /* Implement as required */ }

	async pDoLoadExportedSublistSources (exportedSublist) { /* Implement as required */ }

	async _pOnLoad_pGetData () {
		const data = await (typeof this._dataSource === "string" ? DataUtil.loadJSON(this._dataSource) : this._dataSource());
		const prerelease = await (this._prereleaseDataSource ? this._prereleaseDataSource() : PrereleaseUtil.pGetBrewProcessed());
		const homebrew = await (this._brewDataSource ? this._brewDataSource() : BrewUtil2.pGetBrewProcessed());

		return BrewUtil2.getMergedData(PrereleaseUtil.getMergedData(data, prerelease), homebrew);
	}

	async _pOnLoad_pBookView () {
		if (!this._bookViewOptions) return;

		this._bookView = new (this._bookViewOptions.ClsBookView || ListPageBookView)({
			...this._bookViewOptions,
			sublistManager: this._sublistManager,
			fnGetEntLastLoaded: () => this._dataList[Hist.lastLoadedId],
			btnOpen: es(`#btn-book`),
		});
		await this._bookView.pInit();
	}

	async _pGetTableViewAdditionalData () { return null; }

	_pOnLoad_tableView () {
		if (!this._tableViewOptions) return;

		es(`#btn-show-table`)
			.onn("click", async () => {
				const sublisted = this._sublistManager.getSublistedEntities();
				UtilsTableview.show({
					entities: sublisted.length
						? sublisted
						: this.primaryLists
							.map(list => list.visibleItems.map(({ix}) => this._dataList[ix]))
							.flat(),
					sorter: (a, b) => SortUtil.ascSort(a.name, b.name) || SortUtil.ascSort(a.source, b.source),
					additionalData: await this._pGetTableViewAdditionalData(),
					...this._tableViewOptions,
				});
			});
	}

	async _pOnLoad_pPreDataAdd () { /* Implement as required */ }

	static _MAX_DATA_CHUNK_SIZE = 4096;

	_addData (data) {
		if (!this._dataProps.some(prop => data[prop] && data[prop].length)) return;

		for (const prop of this._dataProps) {
			const len = data[prop]?.length || 0;
			if (!len) continue;

			// Conservatively chunk data before spreading, to (hopefully) avoid call stack errors
			//   while maintaining speed for smaller datasets.
			// See e.g.:
			//   https://stackoverflow.com/a/67738439
			//   https://stackoverflow.com/a/22747272
			for (let i = 0; i < len; i += this.constructor._MAX_DATA_CHUNK_SIZE) {
				const chunk = data[prop].slice(i, i + this.constructor._MAX_DATA_CHUNK_SIZE);
				this._dataList.push(...chunk);
			}
		}

		const len = this._dataList.length;
		for (; this._ixData < len; this._ixData++) {
			const it = this._dataList[this._ixData];
			const isExcluded = ExcludeUtil.isExcluded(UrlUtil.autoEncodeHash(it), it.__prop, it.source);
			const listItem = this.getListItem(it, this._ixData, isExcluded);
			if (!listItem) continue;
			if (this._isPreviewable) this._doBindPreview(listItem);
			this._addListItem(listItem);
		}

		this.primaryLists.forEach(list => list.update());
		this._filterBox.render();
		if (!Hist.initialLoad) this.handleFilterChange();
	}

	/* Implement as required */
	get _bindOtherButtonsOptions () { return null; }

	_bindOtherButtonsOptions_openAsSinglePage (
		{
			slugPage,
			fnGetPageSourceHash = null,
			fnIsNonSiteLink = null,
		},
	) {
		fnGetPageSourceHash ||= () => ({page: UrlUtil.getCurrentPage(), source: SourceUtil.getEntitySource(this._lastRender.entity), hash: UrlUtil.autoEncodeHash(this._lastRender.entity)});
		fnIsNonSiteLink ||= () => !SourceUtil.isSiteSource(SourceUtil.getEntitySource(this._lastRender.entity));

		// We expect these pages when `Boolean(IS_DEPLOYED)`, but, enable for local testing
		return {
			name: "Open Page",
			type: "link",
			fn: () => {
				const {page, source, hash} = fnGetPageSourceHash();
				if (fnIsNonSiteLink()) {
					const params = new URLSearchParams({
						page: page.replace(/\.html$/, ""),
						source,
						hash,
						fluff: 1,
					});
					return `${location.origin}/${slugPage}/index.html?${params}`;
				}
				return `${location.origin}/${slugPage}/${UrlUtil.getSluggedHash(hash)}.html`;
			},
		};
	}

	_addListItem (listItem) {
		this._list.addItem(listItem);
	}

	_doBindPreviewAllButton (btn) {
		btn
			.onn("click", () => {
				const isExpand = btn.html() === `[+]`;
				btn.html(isExpand ? `[\u2212]` : "[+]");

				this.primaryLists.forEach(list => {
					list.visibleItems.forEach(listItem => {
						const {btnToggleExpand, dispExpandedOuter, dispExpandedInner} = this._getPreviewEles(listItem);

						if (!isExpand) return this._doPreviewCollapse({dispExpandedOuter, btnToggleExpand, dispExpandedInner});

						if (btnToggleExpand.innerHTML !== `[+]`) return;
						this._doPreviewExpand({listItem, dispExpandedOuter, btnToggleExpand, dispExpandedInner});
					});
				});
			});
	}

	/** Requires a "[+]" button as the first list column, and the item to contain a second hidden display element. */
	_doBindPreview (listItem) {
		const {btnToggleExpand, dispExpandedOuter, dispExpandedInner} = this._getPreviewEles(listItem);

		dispExpandedOuter.addEventListener("click", evt => {
			evt.stopPropagation();
		});

		btnToggleExpand.addEventListener("click", evt => {
			evt.stopPropagation();
			evt.preventDefault();

			this._doPreviewToggle({listItem, btnToggleExpand, dispExpandedInner, dispExpandedOuter});
		});
	}

	_getPreviewEles (listItem) {
		const btnToggleExpand = listItem.ele.firstElementChild.firstElementChild;
		const dispExpandedOuter = listItem.ele.lastElementChild;
		const dispExpandedInner = dispExpandedOuter.lastElementChild;

		return {
			btnToggleExpand,
			dispExpandedOuter,
			dispExpandedInner,
		};
	}

	_doPreviewToggle ({listItem, btnToggleExpand, dispExpandedInner, dispExpandedOuter}) {
		const isExpand = btnToggleExpand.innerHTML === `[+]`;
		if (isExpand) this._doPreviewExpand({listItem, dispExpandedOuter, btnToggleExpand, dispExpandedInner});
		else this._doPreviewCollapse({dispExpandedOuter, btnToggleExpand, dispExpandedInner});
	}

	_doPreviewExpand ({listItem, dispExpandedOuter, btnToggleExpand, dispExpandedInner}) {
		dispExpandedOuter.classList.remove("ve-hidden");
		btnToggleExpand.innerHTML = `[\u2212]`;
		Renderer.hover.$getHoverContent_stats(UrlUtil.getCurrentPage(), this._dataList[listItem.ix]).appendTo(dispExpandedInner);
	}

	_doPreviewCollapse ({dispExpandedOuter, btnToggleExpand, dispExpandedInner}) {
		dispExpandedOuter.classList.add("ve-hidden");
		btnToggleExpand.innerHTML = `[+]`;
		dispExpandedInner.innerHTML = "";
	}

	// ==================

	static _checkShowAllExcluded (list, elePagecontent) {
		if (!ExcludeUtil.isAllContentExcluded(list)) return;

		elePagecontent.html(`<tr><th class="ve-tbl-border" colspan="6"></th></tr>
			<tr><td colspan="6">${ExcludeUtil.getAllContentBlocklistedHtml()}</td></tr>
			<tr><th class="ve-tbl-border" colspan="6"></th></tr>`);
	}

	_renderListShowHide ({wrpContent, eleWrpList, btnReset}) {
		const btnHideSearch = ee`<button class="ve-btn ve-btn-default" title="Hide Search Bar and Entry List">Hide</button>`;
		btnReset.beforee(btnHideSearch);

		const btnShowSearch = ee`<button class="ve-btn ve-btn-block ve-btn-default ve-btn-xs" type="button">Show List</button>`;
		const wrpBtnShowSearch = ee`<div class="ve-col-12 mb-1 ve-hidden">${btnShowSearch}</div>`.prependTo(wrpContent);

		btnHideSearch.onn("click", () => {
			eleWrpList.hideVe();
			wrpBtnShowSearch.showVe();
			btnHideSearch.hideVe();
		});
		btnShowSearch.onn("click", () => {
			eleWrpList.showVe();
			wrpBtnShowSearch.hideVe();
			btnHideSearch.showVe();
		});
	}

	_renderListFeelingLucky ({isCompact, btnReset, isScrollablePage = false}) {
		const btnRoll = ee`<button class="ve-btn ve-btn-default ${isCompact ? "px-2" : ""}" title="Feeling Lucky?"><span class="glyphicon glyphicon-random"></span></button>`;

		btnRoll
			.onn("click", () => {
				const allLists = this.primaryLists.filter(l => l.visibleItems.length);
				if (allLists.length) {
					const rollX = RollerUtil.roll(allLists.length);
					const list = allLists[rollX];
					const rollY = RollerUtil.roll(list.visibleItems.length);
					window.location.hash = e_(list.visibleItems[rollY].ele).find(`a`).attr("href");
					if (!isScrollablePage) list.visibleItems[rollY].ele.scrollIntoView();
				}
			});

		btnReset.before(btnRoll);
	}

	_bindLinkExportButton ({btn} = {}) {
		btn ||= this._getOrTabRightButton(`link-export`, `magnet`);
		btn.addClass("ve-btn-copy-effect")
			.onn("click", evt => this._pHandleClick_doCopyFilterLink(evt, {btn, isAllowNonExtension: true}))
			.tooltip("Copy Link to Filters (SHIFT to add list; CTRL to copy @filter tag)");
	}

	_bindPopoutButton () {
		this._getOrTabRightButton(`popout`, `new-window`)
			.tooltip(`Popout Window (SHIFT for Source Data; CTRL for Markdown Render)`)
			.onn(
				"click",
				(evt) => {
					if (Hist.lastLoadedId === null) return;

					if (EventUtil.isCtrlMetaKey(evt)) return this._bindPopoutButton_doShowMarkdown(evt);
					return this._bindPopoutButton_doShowStatblock(evt);
				},
			)
			.onn("auxclick", evt => {
				if (Hist.lastLoadedId === null) return;

				if (!EventUtil.isMiddleMouse(evt)) return;
				evt.stopPropagation();

				return Renderer.hover.pDoBrowserPopoutCurPage(evt, this._lastRender.entity);
			});
	}

	_bindPopoutButton_doShowStatblock (evt) {
		if (!evt.shiftKey) return Renderer.hover.doPopoutCurPage(evt, this._lastRender.entity);

		const $content = Renderer.hover.$getHoverContent_statsCode(this._lastRender.entity);
		Renderer.hover.getShowWindow(
			$content,
			Renderer.hover.getWindowPositionFromEvent(evt),
			{
				title: `${this._lastRender.entity.name} \u2014 Source Data`,
				isPermanent: true,
				isBookContent: true,
			},
		);
	}

	_bindPopoutButton_doShowMarkdown (evt) {
		const propData = this._propEntryData || this._lastRender.entity.__prop;

		const name = `${this._lastRender.entity._displayName || this._lastRender.entity.name} \u2014 Markdown`;
		const mdText = RendererMarkdown.get().render({
			entries: [
				{
					type: "statblockInline",
					dataType: propData,
					data: this._lastRender.entity,
				},
			],
		});
		const $content = Renderer.hover.$getHoverContent_miscCode(name, mdText);

		Renderer.hover.getShowWindow(
			$content,
			Renderer.hover.getWindowPositionFromEvent(evt),
			{
				title: name,
				isPermanent: true,
				isBookContent: true,
			},
		);
	}

	_initList (
		{
			iptSearch,
			wrpList,
			btnReset,
			btnClear,

			dispPageTagline,
			isPreviewable,
			isBindFindHotkey,
			syntax,
			optsList,
		},
	) {
		const helpText = [];
		if (isBindFindHotkey) helpText.push(`Hotkey: f.`);

		const list = new List({iptSearch, wrpList, syntax, helpText, ...optsList});

		if (isBindFindHotkey) {
			e_({ele: document.body})
				.onn("keypress", (evt) => {
					if (!EventUtil.noModifierKeys(evt) || EventUtil.isInInput(evt)) return;
					if (EventUtil.getKeyIgnoreCapsLock(evt) === "f") {
						evt.preventDefault();
						iptSearch.selecte().focuse();
					}
				});
		}

		btnReset
			.onn("click", () => {
				iptSearch.val("");
				list.reset();
				_handleSearchChange();
			});

		// region Magnifying glass/clear button
		btnClear
			.onn("click", () => iptSearch.val("").trigger("change").trigger("keydown").trigger("keyup").focuse());
		const _handleSearchChange = () => {
			setTimeout(() => {
				const hasText = !!iptSearch.val().length;

				btnClear
					.toggleClass("no-events", !hasText)
					.toggleClass("clickable", hasText)
					.tooltip(hasText ? "Clear" : null)
					.html(`<span class="glyphicon ${hasText ? `glyphicon-remove` : `glyphicon-search`}"></span>`);
			});
		};
		const handleSearchChange = MiscUtil.throttle(_handleSearchChange, 50);
		iptSearch.onn("keydown", handleSearchChange);
		// endregion

		if (dispPageTagline) {
			dispPageTagline.innerHTML += ` Press J/K to navigate${isPreviewable ? `, M to expand` : ""}.`;
			this._initList_bindWindowHandlers();
		}

		return list;
	}

	_initList_scrollToItem () {
		const toShow = Hist.getSelectedListElementWithLocation();
		if (!toShow) return;

		const {scrollTop: parentScroll, height: parentHeight} = toShow.list.getScrollWrpInfo();
		const posInParent = toShow.item.ele.offsetTop;
		const height = toShow.item.ele.getBoundingClientRect().height;

		const parentRangeMin = parentScroll;
		const parentRangeMax = parentScroll + parentHeight;

		const isAboveMin = posInParent >= parentRangeMin;
		const isBelowMax = (posInParent + height) <= parentRangeMax;
		if (isAboveMin && isBelowMax) return;
		if (isAboveMin) return toShow.list.setScrollWrpTop(posInParent - parentHeight + height);
		if (isBelowMax) return toShow.item.ele.scrollIntoView();
	}

	_initList_bindWindowHandlers () {
		window.addEventListener("keypress", (evt) => {
			if (!EventUtil.noModifierKeys(evt)) return;

			const key = EventUtil.getKeyIgnoreCapsLock(evt);
			switch (key) {
				// k up; j down
				case "k":
				case "j": {
					// don't switch if the user is typing somewhere else
					if (EventUtil.isInInput(evt)) return;
					this._initList_handleListUpDownPress(key === "k" ? -1 : 1);
					return;
				}

				// p: toggle pinned/add 1 to sublist
				case "p": {
					if (EventUtil.isInInput(evt)) return;
					if (!this._sublistManager) return;
					if (this._sublistManager.isSublistItemsCountable) this._sublistManager.pHandleClick_btnAdd({entity: this._lastRender.entity}).then(null);
					else this._sublistManager.pHandleClick_btnPin({entity: this._lastRender.entity}).then(null);
					return;
				}
				// P: toggle pinned/remove 1 from sublist
				case "P": {
					if (EventUtil.isInInput(evt)) return;
					if (!this._sublistManager) return;
					if (this._sublistManager.isSublistItemsCountable) this._sublistManager.pHandleClick_btnSubtract({entity: this._lastRender.entity}).then(null);
					else this._sublistManager.pHandleClick_btnPin({entity: this._lastRender.entity}).then(null);
					return;
				}

				// m: expand/collapse current selection
				case "m": {
					if (EventUtil.isInInput(evt)) return;
					const it = Hist.getSelectedListElementWithLocation();
					e_(it.item.ele.firstElementChild.firstElementChild).trigger("click");
				}
			}
		});
	}

	_initList_handleListUpDownPress (dir) {
		const listItemMeta = Hist.getSelectedListElementWithLocation();
		if (!listItemMeta) return;

		const lists = [...this.primaryLists];

		const ixVisible = listItemMeta.list.visibleItems.indexOf(listItemMeta.item);
		if (!~ixVisible) {
			// If the currently-selected item is not visible, jump to the top/bottom of the list
			const listsWithVisibleItems = lists.filter(list => list.visibleItems.length);
			const tgtItem = dir === 1
				? listsWithVisibleItems[0].visibleItems[0]
				: listsWithVisibleItems.last().visibleItems.last();
			if (tgtItem) {
				window.location.hash = tgtItem.values.hash;
				this._initList_scrollToItem();
			}
			return;
		}

		const tgtItemSameList = listItemMeta.list.visibleItems[ixVisible + dir];
		if (tgtItemSameList) {
			window.location.hash = tgtItemSameList.values.hash;
			this._initList_scrollToItem();
			return;
		}

		const listCur = lists[listItemMeta.x];
		const listsCandidate = lists.filter(lst => lst?.visibleItems?.length);
		const ixCandidateCur = listsCandidate.indexOf(listCur);
		if (!~ixCandidateCur) throw new Error(`Could not find original list!`); // Should never occur

		let ixListOther = ixCandidateCur + dir;

		if (ixListOther === -1) ixListOther = listsCandidate.length - 1;
		else if (ixListOther === listsCandidate.length) ixListOther = 0;

		for (; ixListOther >= 0 && ixListOther < listsCandidate.length; ixListOther += dir) {
			if (!listsCandidate[ixListOther]?.visibleItems?.length) continue;

			const tgtItemOtherList = dir === 1 ? listsCandidate[ixListOther].visibleItems[0] : listsCandidate[ixListOther].visibleItems.last();
			if (!tgtItemOtherList) continue;

			window.location.hash = tgtItemOtherList.values.hash;
			this._initList_scrollToItem();
			return;
		}
	}

	_updateSelected () {
		const curSelectedItem = Hist.getSelectedListItem();
		this.primaryLists.forEach(l => l.updateSelected(curSelectedItem));
	}

	_openContextMenu (evt, list, listItem) {
		const listsWithSelections = this.primaryLists.map(l => ({l, selected: l.getSelected()}));

		let selection;
		if (listsWithSelections.some(it => it.selected.length)) {
			const isItemInSelection = listsWithSelections.some(it => it.selected.some(li => li === listItem));
			if (isItemInSelection) {
				selection = listsWithSelections.map(it => it.selected).flat();
				// trigger a context menu event with all the selected items
			} else {
				this.primaryLists.forEach(l => l.deselectAll());
				list.doSelect(listItem);
				selection = [listItem];
			}
		} else {
			list.doSelect(listItem);
			selection = [listItem];
		}

		ContextUtil.pOpenMenu(evt, this._contextMenuList, {userData: {ele: listItem.ele, selection}});
	}

	_initContextMenu () {
		if (this._contextMenuList) return;

		this._contextMenuList = ContextUtil.getMenu([
			new ContextUtil.Action(
				"Popout",
				async (evt, {userData}) => {
					const {ele, selection} = userData;
					await this._handleGenericContextMenuClick_pDoMassPopout(evt, ele, selection);
				},
			),
			this._getContextActionAdd(),
			null,
			this._getContextActionBlocklist(),
		]);
	}

	_getContextActionAdd () {
		const getEntities = () => this.primaryLists
			.map(list => list.getSelected()
				.map(li => {
					li.isSelected = false;
					return this._dataList[li.ix];
				}),
			)
			.flat();

		return this._sublistManager.isSublistItemsCountable
			? new ContextUtil.Action(
				"Add",
				async () => {
					await this._sublistManager.pHandleClick_btnAddAll({entities: getEntities()});
					this._updateSelected();
				},
			)
			: new ContextUtil.Action(
				"Pin",
				async () => {
					await this._sublistManager.pHandleClick_btnPinAll({entities: getEntities()});
					this._updateSelected();
				},
			);
	}

	_getContextActionBlocklist () {
		return new ContextUtil.Action(
			"Blocklist",
			async (evt, {userData}) => {
				const {ele, selection} = userData;
				await this._handleGenericContextMenuClick_pDoMassBlocklist(evt, ele, selection);
			},
		);
	}

	_getOrTabRightButton (ident, icon, {title} = {}) {
		if (this._btnsTabs[ident]) return this._btnsTabs[ident];

		this._btnsTabs[ident] = e_({
			tag: "button",
			clazz: "ui-tab__btn-tab-head ve-btn ve-btn-default pt-2p px-4p pb-0",
			children: [
				e_({
					tag: "span",
					clazz: `glyphicon glyphicon-${icon}`,
				}),
			],
			title,
		});

		const wrpBtns = document.getElementById("tabs-right");
		wrpBtns.appendChild(this._btnsTabs[ident]);

		return this._btnsTabs[ident];
	}

	_bindPinButton () {
		this._getOrTabRightButton(`pin`, `pushpin`)
			.onn("click", () => this._sublistManager.pHandleClick_btnPin({entity: this._lastRender.entity}))
			.tooltip("Pin (Toggle) (Hotkey: p/P)");
	}

	_bindAddButton () {
		this._getOrTabRightButton(`sublist-add`, `plus`)
			.tooltip(this._sublistManager.getTitleBtnAdd())
			.onn("click", evt => this._sublistManager.pHandleClick_btnAdd({entity: this._lastRender.entity, isMultiple: !!evt.shiftKey}));
	}

	_bindSubtractButton () {
		this._getOrTabRightButton(`sublist-subtract`, `minus`)
			.tooltip(this._sublistManager.getTitleBtnSubtract())
			.onn("click", evt => this._sublistManager.pHandleClick_btnSubtract({entity: this._lastRender.entity, isMultiple: !!evt.shiftKey}));
	}

	/**
	 * @param opts
	 * @param [opts.download]
	 * @param [opts.upload]
	 * @param [opts.upload.pPreloadSublistSources]
	 * @param [opts.sendToBrew]
	 * @param [opts.sendToBrew.fnGetMeta]
	 */
	_bindOtherButtons (opts) {
		opts = opts || {};

		const btnOptions = this._getOrTabRightButton(`sublist-other`, `option-vertical`, {title: "Other Options"});

		const contextOptions = [
			new ContextUtil.Action(
				"New Pinned List",
				evt => this._sublistManager.pHandleClick_new(evt),
			),
			new ContextUtil.Action(
				"Load Pinned List",
				evt => this._sublistManager.pHandleClick_load(evt),
			),
			new ContextUtil.Action(
				"Save Pinned List",
				evt => this._sublistManager.pHandleClick_save(evt),
			),
			null,
			new ContextUtil.Action(
				"Export as Image (SHIFT to Copy Image)",
				evt => this._pHandleClick_exportAsImage({evt, isFast: evt.shiftKey, eleCopyEffect: btnOptions}),
			),
			null,
			new ContextUtil.Action(
				"Download Pinned List (SHIFT to Copy Link)",
				evt => this._sublistManager.pHandleClick_download({isUrl: evt.shiftKey, eleCopyEffect: btnOptions}),
			),
			new ContextUtil.Action(
				"Upload Pinned List (SHIFT for Add Only)",
				evt => this._sublistManager.pHandleClick_upload({isAdditive: evt.shiftKey}),
			),
			null,
			new ContextUtil.Action(
				"Copy Link to Filters (Extensible)",
				evt => this._pHandleClick_doCopyFilterLink(evt),
			),
		];

		if (opts.sendToBrew) {
			if (contextOptions.length) contextOptions.push(null); // Add a spacer after the previous group

			const action = new ContextUtil.Action(
				"Edit in Homebrew Builder",
				() => {
					const meta = opts.sendToBrew.fnGetMeta();
					const toLoadData = [meta.page, meta.source, meta.hash];
					window.location = `${UrlUtil.PG_MAKE_BREW}#${opts.sendToBrew.mode.toUrlified()}${HASH_PART_SEP}${UrlUtil.packSubHash("statemeta", toLoadData)}`;
				},
			);
			contextOptions.push(action);
		}

		if (opts.other?.length) {
			if (contextOptions.length) contextOptions.push(null); // Add a spacer after the previous group

			opts.other.forEach(oth => {
				const action = oth.type === "link"
					? new ContextUtil.ActionLink(
						oth.name,
						oth.fn,
					)
					: new ContextUtil.Action(
						oth.name,
						oth.pFn,
					);
				contextOptions.push(action);
			});
		}

		contextOptions.push(
			null,
			new ContextUtil.Action(
				"Blocklist",
				async () => {
					await this._pDoMassBlocklist([this._dataList[Hist.lastLoadedId]]);
				},
			),
		);

		const menu = ContextUtil.getMenu(contextOptions);
		btnOptions
			.onn("mousedown", evt => {
				evt.preventDefault();
			})
			.onn("click", async evt => {
				evt.preventDefault();
				await ContextUtil.pOpenMenu(evt, menu);
			});
	}

	async _pHandleClick_doCopyFilterLink (evt, {btn = null, isAllowNonExtension = false} = {}) {
		const url = new URL(window.location.href);
		url.hash ||= globalThis.HASH_BLANK;

		if (EventUtil.isCtrlMetaKey(evt)) {
			await MiscUtil.pCopyTextToClipboard(this._filterBox.getFilterTag({isAddSearchTerm: true}));
			if (btn) JqueryUtil.showCopiedEffect(btn);
			else JqueryUtil.doToast("Copied!");
			return;
		}

		const parts = this._filterBox.getSubHashes({isAddSearchTerm: true, isAllowNonExtension});
		parts.unshift(url.toString());

		if (evt.shiftKey && this._sublistManager) {
			parts.push(await this._sublistManager.pGetHashPartExport());
		}

		await MiscUtil.pCopyTextToClipboard(parts.join(HASH_PART_SEP));
		if (btn) JqueryUtil.showCopiedEffect(btn);
		else JqueryUtil.doToast("Copied!");
	}

	async _handleGenericContextMenuClick_pDoMassPopout (evt, ele, selection) {
		const entities = selection.map(listItem => ({entity: this._dataList[listItem.ix], hash: listItem.values.hash}));
		return _UtilListPage.pDoMassPopout(evt, ele, entities);
	}

	async _handleGenericContextMenuClick_pDoMassBlocklist (evt, ele, selection) {
		await this._pDoMassBlocklist(selection.map(listItem => this._dataList[listItem.ix]));
	}

	async _pDoMassBlocklist (ents) {
		await ExcludeUtil.pExtendList(
			ents.map(ent => {
				return {
					category: ent.__prop,
					displayName: ent._displayName || ent.name,
					hash: UrlUtil.autoEncodeHash(ent),
					source: ent.source,
				};
			}),
		);

		JqueryUtil.doToast(`Added ${ents.length} entr${ents.length === 1 ? "y" : "ies"} to the blocklist! Reload the page to view any changes.`);
	}

	doDeselectAll () { this.primaryLists.forEach(list => list.deselectAll()); }

	async pDoLoadHash (id, {lockToken} = {}) {
		try {
			lockToken = await this._lockHashchange.pLock({token: lockToken});
			this._lastRender.entity = this._dataList[id];
			return (await this._pDoLoadHash({id, lockToken}));
		} finally {
			this._lockHashchange.unlock();
		}
	}

	getListItem () { throw new Error(`Unimplemented!`); }

	async pHandleUnknownHash (link, sub) {
		const locStart = window.location.hash;

		const {source} = UrlUtil.autoDecodeHash(link);

		// If the source is from prerelease/homebrew which has been loaded in the background but is
		//   not yet displayed, reload to refresh the list.
		if (this._pHandleUnknownHash_doSourceReload({source})) return true;

		// Otherwise, try to find the source in prerelease/homebrew, load it, and reload
		const loaded = await DataLoader.pCacheAndGetHash(UrlUtil.getCurrentPage(), link, {isSilent: true});
		if (!loaded) return false;

		// If navigation has occurred while we were loading the hash, bail out
		if (locStart !== window.location.hash) return false;

		return this._pHandleUnknownHash_doSourceReload({source});
	}

	_pHandleUnknownHash_isRequireReload ({source}) {
		return [
			PrereleaseUtil,
			BrewUtil2,
		]
			.some(brewUtil => brewUtil.hasSourceJson(source) && brewUtil.isReloadRequired());
	}

	_pHandleUnknownHash_doSourceReload ({source}) {
		return [
			PrereleaseUtil,
			BrewUtil2,
		]
			.some(brewUtil => {
				if (
					this._pHandleUnknownHash_isRequireReload({source})
				) {
					brewUtil.doLocationReload();
					return true;
				}
			});
	}

	async pDoLoadSubHash (sub, {lockToken} = {}) {
		try {
			lockToken = await this._lockHashchange.pLock({token: lockToken});
			return (await this._pDoLoadSubHash({sub, lockToken}));
		} finally {
			this._lockHashchange.unlock();
		}
	}

	/* -------------------------------------------- */

	handleFilterChange () {
		const f = this._filterBox.getValues();
		this._list.filter(item => this._pageFilter.toDisplay(f, this._dataList[item.ix]));
		FilterBox.selectFirstVisible(this._dataList);
	}

	/* -------------------------------------------- */

	_tabTitleStats = "Traits";

	async _pDoLoadHash ({id, lockToken}) {
		this._pgContent.empty();

		this._renderer.setFirstSection(true);
		const ent = this._dataList[id];

		const tabMetaStats = new Renderer.utils.TabButton({
			label: this._tabTitleStats,
			fnChange: this._renderStats_onTabChangeStats.bind(this),
			fnPopulate: this._renderStats_doBuildStatsTab.bind(this, {ent}),
			isVisible: true,
		});

		const tabMetasAdditional = this._renderStats_getTabMetasAdditional({ent});

		Renderer.utils.bindTabButtons({
			tabButtons: [tabMetaStats, ...tabMetasAdditional].filter(it => it.isVisible),
			tabLabelReference: [tabMetaStats, ...tabMetasAdditional].map(it => it.label),
			wrpTabs: this._wrpTabs,
			pgContent: this._pgContent,
		});

		this._updateSelected();

		await this._renderStats_pBuildFluffTabs({
			ent,
			tabMetaStats,
			tabMetasAdditional,
		});
	}

	async _pPreloadSublistSources (json) { /* Implement as required */ }

	async _pDoLoadSubHash ({sub, lockToken}) {
		if (this._filterBox) sub = this._filterBox.setFromSubHashes(sub);
		if (this._sublistManager) sub = await this._sublistManager.pSetFromSubHashes(sub, this._pPreloadSublistSources.bind(this));
		if (this._bookView) sub = await this._bookView.pHandleSub(sub);
		return sub;
	}

	_renderStats_getTabMetasAdditional ({ent}) { return []; }

	_renderStats_onTabChangeStats () { /* Implement as required. */ }
	_renderStats_onTabChangeFluff () { /* Implement as required. */ }

	async _renderStats_pBuildFluffTabs (
		{
			ent,
			tabMetaStats,
			tabMetasAdditional,
		},
	) {
		const propFluff = `${ent.__prop}Fluff`;

		const [hasFluffText, hasFluffImages] = await Promise.all([
			Renderer.utils.pHasFluffText(ent, propFluff),
			Renderer.utils.pHasFluffImages(ent, propFluff),
		]);

		if (!hasFluffText && !hasFluffImages) return;

		const tabMetas = [
			tabMetaStats,
			new Renderer.utils.TabButton({
				label: "Info",
				fnChange: this._renderStats_onTabChangeFluff.bind(this),
				fnPopulate: this._renderStats_doBuildFluffTab.bind(this, {ent, isImageTab: false}),
				isVisible: hasFluffText,
			}),
			new Renderer.utils.TabButton({
				label: "Images",
				fnChange: this._renderStats_onTabChangeFluff.bind(this),
				fnPopulate: this._renderStats_doBuildFluffTab.bind(this, {ent, isImageTab: true}),
				isVisible: hasFluffImages,
			}),
			...tabMetasAdditional,
		];

		Renderer.utils.bindTabButtons({
			tabButtons: tabMetas.filter(it => it.isVisible),
			tabLabelReference: tabMetas.map(it => it.label),
			wrpTabs: this._wrpTabs,
			pgContent: this._pgContent,
		});
	}

	_renderStats_doBuildFluffTab ({ent, isImageTab = false}) {
		this._pgContent.empty();

		return Renderer.utils.pBuildFluffTab({
			isImageTab,
			wrpContent: this._pgContent,
			pFnGetFluff: this._pFnGetFluff,
			entity: ent,
			wrpHeaderControls: this._renderStats_doBuildFluffTab_getHeaderControls({ent, isImageTab}),
		});
	}

	_renderStats_doBuildFluffTab_getHeaderControls ({ent, isImageTab = false}) {
		if (isImageTab) return null;

		const actions = [
			new ContextUtil.Action(
				"Copy as JSON",
				async () => {
					const fluffEntries = (await this._pFnGetFluff(ent))?.entries || [];
					MiscUtil.pCopyTextToClipboard(JSON.stringify(fluffEntries, null, "\t"));
					JqueryUtil.showCopiedEffect(btnOptions);
				},
			),
			new ContextUtil.Action(
				"Copy as Markdown",
				async () => {
					const fluffEntries = (await this._pFnGetFluff(ent))?.entries || [];
					const rendererMd = RendererMarkdown.get().setFirstSection(true);
					MiscUtil.pCopyTextToClipboard(fluffEntries.map(f => rendererMd.render(f)).join("\n"));
					JqueryUtil.showCopiedEffect(btnOptions);
				},
			),
		];
		const menu = ContextUtil.getMenu(actions);

		const btnOptions = ee`<button class="ve-btn ve-btn-default ve-btn-xs stats__btn-stats-name" title="Other Options"><span class="glyphicon glyphicon-option-vertical"></span></button>`
			.onn("click", evt => ContextUtil.pOpenMenu(evt, menu));

		return ee`<div class="ve-flex-v-center ve-btn-group ml-2">${btnOptions}</div>`;
	}

	/** @abstract */
	_renderStats_doBuildStatsTab ({ent}) { throw new Error("Unimplemented!"); }

	/* -------------------------------------------- */

	static _OFFSET_WINDOW_EXPORT_AS_IMAGE = 17;

	_pHandleClick_exportAsImage_mutOptions ({ele, optsDomToImage}) {
		// See:
		//  - https://github.com/1904labs/dom-to-image-more/issues/146
		//  - https://github.com/1904labs/dom-to-image-more/issues/160
		if (BrowserUtil.isFirefox()) {
			const bcr = ele.getBoundingClientRect();
			optsDomToImage.width = bcr.width;
			optsDomToImage.height = bcr.height;
		}
	}

	// FIXME(Future)
	//  - `table > caption` causes issues: https://github.com/1904labs/dom-to-image-more/issues/209
	async _pHandleClick_exportAsImage ({evt, isFast, eleCopyEffect}) {
		if (typeof domtoimage === "undefined") await import("../lib/dom-to-image-more.min.js");

		const ent = this._dataList[Hist.lastLoadedId];

		const optsDomToImage = {
			// FIXME(Future) doesn't seem to have the desired effect; `lst__is-exporting-image` bodge used instead
			adjustClonedNode: (node, clone, isAfter) => {
				if (node.classList && node.classList.contains("stats__wrp-h-source--token") && !isAfter) {
					clone.style.paddingRight = "0px";
				}
				return clone;
			},
		};

		if (isFast) {
			this._pHandleClick_exportAsImage_mutOptions({ele: this._pgContent, optsDomToImage});

			let blob;
			try {
				this._pgContent.addClass("lst__is-exporting-image");
				blob = await domtoimage.toBlob(this._pgContent, optsDomToImage);
			} finally {
				this._pgContent.removeClass("lst__is-exporting-image");
			}

			const isCopy = await MiscUtil.pCopyBlobToClipboard(blob);
			if (isCopy) JqueryUtil.showCopiedEffect(eleCopyEffect);

			return;
		}

		const html = this._pgContent.outerHTML;
		const page = UrlUtil.getCurrentPage();

		const cpy = e_({outer: html})
			.addClass("lst__is-exporting-image");

		const btnCpy = ee`<button class="ve-btn ve-btn-default ve-btn-xs" title="SHIFT to Copy and Close">Copy</button>`
			.onn("click", async evt => {
				this._pHandleClick_exportAsImage_mutOptions({ele: cpy, optsDomToImage});

				const blob = await domtoimage.toBlob(cpy, optsDomToImage);
				const isCopy = await MiscUtil.pCopyBlobToClipboard(blob);
				if (isCopy) JqueryUtil.showCopiedEffect(btnCpy);

				if (isCopy && evt.shiftKey) hoverWindow.doClose();
			});

		const btnSave = ee`<button class="ve-btn ve-btn-default ve-btn-xs" title="SHIFT to Save and Close">Save</button>`
			.onn("click", async evt => {
				this._pHandleClick_exportAsImage_mutOptions({ele: cpy, optsDomToImage});

				const dataUrl = await domtoimage.toPng(cpy, optsDomToImage);
				DataUtil.userDownloadDataUrl(`${ent.name}.png`, dataUrl);

				if (evt.shiftKey) hoverWindow.doClose();
			});

		const width = this._pgContent.getBoundingClientRect().width;
		const posBtn = eleCopyEffect.getBoundingClientRect().toJSON();
		const hoverWindow = Renderer.hover.getShowWindow(
			ee`<div class="ve-flex-col">
				<div class="split-v-center mb-2 px-2 mt-2">
					<i class="mr-2">Optionally resize the width of the window, then Copy or Save.</i>
					<div class="ve-btn-group">
						${btnCpy}
						${btnSave}
					</div>
				</div>
				${cpy}
			</div>`,
			Renderer.hover.getWindowPositionExact(
				posBtn.left - width + posBtn.width - this.constructor._OFFSET_WINDOW_EXPORT_AS_IMAGE,
				posBtn.top + posBtn.height + this.constructor._OFFSET_WINDOW_EXPORT_AS_IMAGE,
				evt,
			),
			{
				title: `Image Export - ${ent.name}`,
				isPermanent: true,
				isBookContent: page === UrlUtil.PG_RECIPES,
				isResizeOnlyWidth: true,
				isHideBottomBorder: true,
				width,
			},
		);
	}
}

class ListPageTokenDisplay {
	static _SRC_ERROR = `data:image/svg+xml,${encodeURIComponent(`
		<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
			<circle cx="200" cy="200" r="175" fill="#b00"/>
			<rect x="190" y="40" height="320" width="20" fill="#ddd" transform="rotate(45 200 200)"/>
			<rect x="190" y="40" height="320" width="20" fill="#ddd" transform="rotate(135 200 200)"/>
		</svg>`,
	)}`;

	constructor (
		{
			fnHasToken,
			fnGetTokenUrl,
		},
	) {
		this._fnHasToken = fnHasToken;
		this._fnGetTokenUrl = fnGetTokenUrl;

		this._wrpContainer = null;
		this._dispToken = null;
	}

	doShow () {
		if (!this._dispToken) return;
		this._dispToken.showVe();
	}

	doHide () {
		if (!this._dispToken) return;
		this._dispToken.hideVe();
	}

	render (ent) {
		if (!this._wrpContainer) this._wrpContainer ||= e_(document.getElementById("wrp-pagecontent"));
		if (!this._dispToken) this._dispToken ||= e_(document.getElementById("float-token"));
		this._dispToken.empty();

		if (!this._fnHasToken(ent)) return;

		const bcr = this._wrpContainer.getBoundingClientRect();
		const wMax = Math.max(Math.floor(bcr.height) - 6, 110);

		const imgLink = this._fnGetTokenUrl(ent);
		const img = ee`<img src="${imgLink}" class="stats__token" ${Renderer.utils.getTokenMetadataAttributes(ent)} loading="lazy">`
			.css({"max-width": `${wMax}px`});
		const lnkToken = ee`<a href="${imgLink}" class="stats__wrp-token" target="_blank" rel="noopener noreferrer">${img}</a>`
			.appendTo(this._dispToken);

		const altArtMeta = [];

		if (ent.altArt) altArtMeta.push(...MiscUtil.copy(ent.altArt));
		if (ent.variant) {
			const variantTokens = ent.variant.filter(it => it.token).map(it => it.token);
			if (variantTokens.length) altArtMeta.push(...MiscUtil.copy(variantTokens).map(it => ({...it, displayName: `Variant; ${it.name}`})));
		}

		if (!altArtMeta.length) return;

		// make a fake entry for the original token
		altArtMeta.unshift({ele: lnkToken});

		const buildEle = (meta) => {
			if (!meta.ele) {
				const imgLink = this._fnGetTokenUrl(meta);
				const displayName = Renderer.utils.getAltArtDisplayName(meta);
				const img = ee`<img src="${imgLink}" class="stats__token" ${Renderer.utils.getTokenMetadataAttributes(ent, {displayName})} loading="lazy">`
					.css({"max-width": `${wMax}px`})
					.onn("error", () => {
						img.attr("src", this.constructor._SRC_ERROR);
					});
				meta.ele = ee`<a href="${imgLink}" class="stats__wrp-token" target="_blank" rel="noopener noreferrer">${img}</a>`
					.hideVe()
					.appendTo(this._dispToken);
			}
		};
		altArtMeta.forEach(buildEle);

		let ix = 0;
		const handleClick = (evt, direction) => {
			evt.stopPropagation();
			evt.preventDefault();

			// avoid going off the edge of the list
			if (ix === 0 && !~direction) return;
			if (ix === altArtMeta.length - 1 && ~direction) return;

			ix += direction;

			if (!~direction) { // left
				if (ix === 0) {
					btnLeft.hideVe();
					wrpFooter.hideVe();
				}
				btnRight.showVe();
			} else {
				btnLeft.showVe();
				wrpFooter.showVe();
				if (ix === altArtMeta.length - 1) {
					btnRight.hideVe();
				}
			}
			altArtMeta.filter(it => it.ele).forEach(it => it.ele.hideVe());

			const meta = altArtMeta[ix];
			meta.ele
				.showVe()
				.css({"max-width": "100%"}); // Force full-width to catch hover event as token loads
			setTimeout(() => meta.ele.css({"max-width": ""}), 150); // Clear full-width after grace period

			footer.html(Renderer.utils.getRenderedAltArtEntry(meta));

			wrpFooter.detach().appendTo(meta.ele);
			btnLeft.detach().appendTo(meta.ele);
			btnRight.detach().appendTo(meta.ele);
		};

		// append footer first to be behind buttons
		const footer = ee`<div class="stats__token-footer"></div>`;
		const wrpFooter = ee`<div class="stats__wrp-token-footer">${footer}</div>`.hideVe().appendTo(lnkToken);

		const btnLeft = ee`<div class="stats__btn-token-cycle stats__btn-token-cycle--left"><span class="glyphicon glyphicon-chevron-left"></span></div>`
			.onn("click", evt => handleClick(evt, -1))
			.appendTo(lnkToken)
			.hideVe();

		const btnRight = ee`<div class="stats__btn-token-cycle stats__btn-token-cycle--right"><span class="glyphicon glyphicon-chevron-right"></span></div>`
			.onn("click", evt => handleClick(evt, 1))
			.appendTo(lnkToken);
	}
}

globalThis.ListPageTokenDisplay = ListPageTokenDisplay;

class _ListPageBookViewComponent extends BaseComponent {
	_getDefaultState () {
		return {
			isRenderCopies: false,
		};
	}
}

class ListPageBookView extends BookModeViewBase {
	_hashKey = "bookview";
	_hasPrintColumns = true;

	constructor (
		{
			sublistManager,
			fnGetEntLastLoaded,
			pageTitle,
			nameSingular,
			namePlural,
			isSublistItemsCountable = false,
			propMarkdown,
			fnPartition = null,
			...rest
		},
	) {
		super({...rest});
		this._sublistManager = sublistManager;
		this._fnGetEntLastLoaded = fnGetEntLastLoaded;
		this._pageTitle = pageTitle;
		this._nameSingular = nameSingular;
		this._namePlural = namePlural;
		this._isSublistItemsCountable = isSublistItemsCountable;
		this._propMarkdown = propMarkdown;
		this._fnPartition = fnPartition;

		this._bookViewToShow = null;
		this._comp = new _ListPageBookViewComponent();
		this._fnsCleanupCompRender = [];
	}

	_getEleNoneVisible () {
		return ee`<div class="w-100 ve-flex-col ve-flex-h-center no-shrink no-print mb-3 mt-auto">
			<div class="mb-2 ve-flex-vh-center min-h-0">
				<span class="initial-message initial-message--med">If you wish to view multiple ${this._namePlural}, please first make a list</span>
			</div>
			<div class="ve-flex-vh-center">${this._getBtnNoneVisibleClose()}</div>
		</div>`;
	}

	async _pInit () {
		const storageKey = `${this.constructor.name}.bookViewState`;

		const savedState = await StorageUtil.pGetForPage(storageKey);
		await this._comp.setStateFrom(savedState);

		this._comp._addHookAllBase(() => StorageUtil.pSetForPage(storageKey, this._comp.getSaveableState()));
	}

	_preRender () {
		this._fnsCleanupCompRender
			.splice(0, this._fnsCleanupCompRender.length)
			.forEach(fn => fn());
	}

	async _pGetWrpControls ({wrpContent}) {
		const out = await super._pGetWrpControls({wrpContent});
		const {wrpPrint} = out;
		if (this._propMarkdown) this._getControlsMarkdown().appendTo(wrpPrint);
		if (this._isSublistItemsCountable) this._getControlsCount().appendTo(wrpPrint);
		return out;
	}

	async _pGetRenderContentMeta ({wrpContent, wrpContentOuter}) {
		wrpContent.addClass("p-2");

		this._bookViewToShow = this._sublistManager.getSublistedEntityMetas()
			.sort(this._getSorted.bind(this));

		const partitions = [];
		if (this._fnPartition) {
			this._bookViewToShow.forEach(entityMeta => {
				const partition = this._fnPartition(entityMeta);
				(partitions[partition] = partitions[partition] || []).push(entityMeta);
			});
		} else partitions[0] = this._bookViewToShow;

		const stack = partitions
			.filter(Boolean)
			.flatMap(arr => {
				return arr
					.flatMap(({entity, count}) => Array.from({length: this._comp._state.isRenderCopies ? count : 1}, () => this._getRenderedEnt(entity)));
			});

		if (!this._bookViewToShow.length && Hist.lastLoadedId != null) {
			stack.push(this._getRenderedEnt(this._fnGetEntLastLoaded()));
		}

		wrpContent.appends(stack.join(""));

		return {
			cntSelectedEnts: this._bookViewToShow.length,
			isAnyEntityRendered: !!stack.length,
		};
	}

	_getRenderedEnt (ent) {
		return `<div class="bkmv__wrp-item ve-inline-block print__ve-block print__my-2">
			<table class="w-100 stats stats--book stats--bkmv"><tbody>
			${Renderer.hover.getFnRenderCompact(UrlUtil.getCurrentPage(), {isStatic: true})(ent)}
			</tbody></table>
		</div>`;
	}

	_getVisibleAsMarkdown () {
		const toRender = this._bookViewToShow?.length ? this._bookViewToShow : [this._fnGetEntLastLoaded()];
		const parts = [...toRender]
			.sort(this._getSorted.bind(this))
			// Ignore count, as we presume markdown is not being printed
			.map(({entity}) => this._getEntityMarkdown(entity));

		const out = [];
		let charLimit = RendererMarkdown.CHARS_PER_PAGE;
		for (let i = 0; i < parts.length; ++i) {
			const part = parts[i];
			out.push(part);

			if (i < parts.length - 1) {
				if ((charLimit -= part.length) < 0) {
					if (VetoolsConfig.get("markdown", "isAddPageBreaks")) out.push("", "\\pagebreak", "");
					charLimit = RendererMarkdown.CHARS_PER_PAGE;
				}
			}
		}

		return out.join("\n\n");
	}

	_getControlsMarkdown () {
		const btnDownloadMarkdown = ee`<button class="ve-btn ve-btn-default ve-btn-sm">Download as Markdown</button>`
			.onn("click", () => DataUtil.userDownloadText(`${UrlUtil.getCurrentPage().replace(".html", "")}.md`, this._getVisibleAsMarkdown()));

		const btnCopyMarkdown = ee`<button class="ve-btn ve-btn-default ve-btn-sm px-2" title="Copy Markdown to Clipboard"><span class="glyphicon glyphicon-copy"></span></button>`
			.onn("click", async () => {
				await MiscUtil.pCopyTextToClipboard(this._getVisibleAsMarkdown());
				JqueryUtil.showCopiedEffect(btnCopyMarkdown);
			});

		const btnDownloadMarkdownSettings = ee`<button class="ve-btn ve-btn-default ve-btn-sm px-2" title="Markdown Settings"><span class="glyphicon glyphicon-cog"></span></button>`
			.onn("click", async () => RendererMarkdown.pShowSettingsModal());

		return ee`<div class="ve-flex-v-center ve-btn-group ml-3">
			${btnDownloadMarkdown}
			${btnCopyMarkdown}
			${btnDownloadMarkdownSettings}
		</div>`;
	}

	_getControlsCount () {
		const {cb: cbIsRenderCopies, unhook} = ComponentUiUtil.getCbBool(this._comp, "isRenderCopies", {asMeta: true});
		this._fnsCleanupCompRender.push(unhook);

		const hkIsRenderCopies = () => this._pRender().then(null);
		this._comp._addHookBase("isRenderCopies", hkIsRenderCopies);
		this._fnsCleanupCompRender.push(() => this._comp._removeHookBase("isRenderCopies", hkIsRenderCopies));

		return ee`<label class="ve-flex-vh-center ml-3">
			<span class="mr-2 help" title="If enabled, each copy of a listed ${this._nameSingular} will be displayed separately. This may be preferable when printing handouts.">Show Duplicates</span>
			${cbIsRenderCopies}
		</label>`;
	}

	_getSorted (a, b) {
		a = a.entity;
		b = b.entity;
		return SortUtil.ascSortLower(a.name, b.name);
	}

	_getEntityMarkdown (ent) {
		return RendererMarkdown.get().render({type: "statblockInline", dataType: this._propMarkdown, data: ent}).trim();
	}
}
