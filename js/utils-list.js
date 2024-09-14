"use strict";

class ListUtil {
	static _pGetSublistEntities_getCount ({ser}) { return isNaN(ser.c) ? 1 : Number(ser.c); }

	static async pGetSublistEntities_fromList ({exportedSublist, dataList, page}) {
		if (!exportedSublist?.items) return [];

		page = page || UrlUtil.getCurrentPage();

		return (await exportedSublist
			.items
			.pSerialAwaitMap(async ser => {
				const listItem = Hist.getActiveListItem(ser.h);
				if (listItem == null) return null;

				const entity = await Renderer.hover.pApplyCustomHashId(
					page,
					// Pull from the list page, as there may be list-page-specific temp data
					dataList[listItem.ix],
					// Support lowercase prop from URL
					ser.customHashId || ser.customhashid,
				);

				return {
					count: this._pGetSublistEntities_getCount({ser}),
					entity,
					ser,
				};
			}))
			.filter(Boolean);
	}

	static async pGetSublistEntities_fromHover ({exportedSublist, page}) {
		if (!exportedSublist?.items) return [];

		page = page || UrlUtil.getCurrentPage();

		return (await exportedSublist
			.items
			.pSerialAwaitMap(async ser => {
				let entity = await DataLoader.pCacheAndGetHash(page, ser.h);

				if (!entity) return null;

				entity = await Renderer.hover.pApplyCustomHashId(
					page,
					entity,
					// Support lowercase prop from URL
					ser.customHashId || ser.customhashid,
				);

				if (!entity) return null;

				return {
					count: this._pGetSublistEntities_getCount({ser}),
					entity,
				};
			}))
			.filter(Boolean);
	}

	static getWithoutManagerState (saveEntity) {
		return this._getWithoutManagerState({saveEntity, prefix: "manager_"});
	}

	static getWithoutManagerClientState (saveEntity) {
		return this._getWithoutManagerState({saveEntity, prefix: "managerClient_"});
	}

	static _getWithoutManagerState ({saveEntity, prefix}) {
		if (!saveEntity) return saveEntity;

		const cpy = MiscUtil.copyFast(saveEntity);
		Object.keys(cpy)
			.filter(k => k.startsWith(prefix))
			.forEach(k => delete cpy[k]);

		return cpy;
	}

	static getDownloadFiletype ({page}) {
		page = page || UrlUtil.getCurrentPage();
		return `${page.replace(".html", "")}-sublist`;
	}

	static getDownloadName ({page, save}) {
		return `${this.getDownloadFiletype({page})}${save.entity.name ? `-${save.entity.name}` : ""}`;
	}

	static getDownloadFiletypeSaves ({page}) {
		page = page || UrlUtil.getCurrentPage();
		return `${page.replace(".html", "")}-sublist-saves`;
	}

	static getDownloadNameSaves ({page}) {
		return this.getDownloadFiletypeSaves({page});
	}
}

class ListUtilEntity {
	static _getString_action_currentPinned_name ({page}) { return `From Current ${UrlUtil.pageToDisplayPage(page)} Pinned List`; }
	static _getString_action_savedPinned_name ({page}) { return `From Saved ${UrlUtil.pageToDisplayPage(page)} Pinned List`; }
	static _getString_action_file_name ({page}) { return `From ${UrlUtil.pageToDisplayPage(page)} Pinned List File`; }

	static _getString_action_currentPinned_msg_noSaved ({page}) { return `No saved list! Please first go to the ${UrlUtil.pageToDisplayPage(page)} page and create one.`; }
	static _getString_action_savedPinned_msg_noSaved ({page}) { return `No saved lists were found! Go to the ${UrlUtil.pageToDisplayPage(page)} page and create some first.`; }

	static async _pGetLoadableSublist_getAdditionalState ({exportedSublist}) { return {}; }

	static async pGetLoadableSublist ({exportedSublist, page}) {
		if (exportedSublist == null) return null;

		const entityInfos = await ListUtil.pGetSublistEntities_fromHover({exportedSublist, page});
		const additionalState = await this._pGetLoadableSublist_getAdditionalState({exportedSublist});

		return {
			entityInfos,
			...additionalState,
		};
	}

	static async _pHandleExportedSublist_pMutAdditionalState ({exportedSublist}) { /* Implement as required */ }

	static async _pHandleExportedSublist (
		{
			pFnOnSelect,
			page,

			evt,
			exportedSublist,
			isReferencable,

			...others
		},
	) {
		if (exportedSublist == null) return;

		const loadableSublist = await this.pGetLoadableSublist({exportedSublist, page});

		await pFnOnSelect({
			isShiftKey: evt?.shiftKey,
			...others,

			isReferencable,

			exportedSublist,

			...loadableSublist,
		});
	}

	static _getFileTypes ({page}) {
		return [ListUtil.getDownloadFiletype({page})];
	}

	static async _pHandleClick_loadSublist_currentPinned (
		{
			pFnOnSelect,

			page,

			evt,
			...others
		},
	) {
		const sublistPersistor = new SublistPersistor({page});
		const exportedSublist = await sublistPersistor.pGetStateFromStorage();

		if (!exportedSublist) {
			return JqueryUtil.doToast({
				content: this._getString_action_currentPinned_msg_noSaved({page}),
				type: "warning",
			});
		}

		await this._pHandleExportedSublist({pFnOnSelect, page, exportedSublist, evt, ...others});
	}

	static async _pHandleClick_loadSublist_savedPinned (
		{
			pFnOnSelect,

			optsSaveManager,

			page,

			evt,
			...others
		},
	) {
		const saveManager = new SaveManager({
			isReadOnlyUi: true,
			page,
			...optsSaveManager,
		});
		await saveManager.pMutStateFromStorage();

		if (!(await saveManager.pHasSaves())) {
			return JqueryUtil.doToast({
				type: "warning",
				content: this._getString_action_savedPinned_msg_noSaved({page}),
			});
		}

		const exportedSublist = await saveManager.pDoLoad({isIncludeManagerClientState: true});
		if (!exportedSublist) return;

		await this._pHandleExportedSublist({pFnOnSelect, page, exportedSublist, evt, ...others});
	}

	static async _pHandleClick_loadSublist_file (
		{
			pFnOnSelect,

			page,

			evt,
			...others
		},
	) {
		const {jsons, errors} = await InputUiUtil.pGetUserUploadJson({
			expectedFileTypes: this._getFileTypes({page}),
		});

		DataUtil.doHandleFileLoadErrorsGeneric(errors);

		if (!jsons?.length) return;

		const json = jsons[0];

		await this._pHandleExportedSublist({pFnOnSelect, page, exportedSublist: json, evt, ...others});
	}

	static getContextOptionsLoadSublist (
		{
			pFnOnSelect,

			optsSaveManager,

			optsFromCurrent,
			optsFromSaved,
			optsFromFile,

			page,
		},
	) {
		if (!page) throw new Error(`Missing required "page" arg!`);

		return [
			new ContextUtil.Action(
				this._getString_action_currentPinned_name({page}),
				evt => this._pHandleClick_loadSublist_currentPinned({pFnOnSelect, page, evt}),
				{
					...optsFromCurrent || {},
				},
			),
			new ContextUtil.Action(
				this._getString_action_savedPinned_name({page}),
				evt => this._pHandleClick_loadSublist_savedPinned({pFnOnSelect, optsSaveManager, page, evt}),
				{
					...optsFromSaved || {},
				},
			),
			new ContextUtil.Action(
				this._getString_action_file_name({page}),
				evt => this._pHandleClick_loadSublist_file({pFnOnSelect, page, evt}),
				{
					...optsFromFile || {},
				},
			),
		];
	}

	static async pDoUserInputLoadSublist (
		{
			pFnOnSelect,

			optsSaveManager,

			page,

			optsFromCurrent,
			optsFromSaved,
			optsFromFile,

			altGenerators,
		},
	) {
		const values = [
			optsFromCurrent?.renamer ? optsFromCurrent.renamer(this._getString_action_currentPinned_name({page})) : this._getString_action_currentPinned_name({page}),
			optsFromSaved?.renamer ? optsFromSaved.renamer(this._getString_action_savedPinned_name({page})) : this._getString_action_savedPinned_name({page}),
			optsFromFile?.renamer ? optsFromFile.renamer(this._getString_action_file_name({page})) : this._getString_action_file_name({page}),
		];

		const ixdPFnConfirms = [
			optsFromCurrent?.pFnConfirm,
			optsFromSaved?.pFnConfirm,
			optsFromFile?.pFnConfirm,
		];
		const ixdOtherOpts = [...new Array(3)].map(() => {});
		if (altGenerators?.length) {
			altGenerators.forEach(({fromCurrent, fromSaved, fromFile}) => {
				const modes = [fromCurrent, fromSaved, fromFile];

				modes.forEach(mode => {
					ixdPFnConfirms.push(mode?.pFnConfirm);
					ixdOtherOpts.push(mode?.otherOpts || {});
				});

				values.push(fromCurrent.renamer(this._getString_action_currentPinned_name({page})));
				values.push(fromSaved.renamer(this._getString_action_savedPinned_name({page})));
				values.push(fromFile.renamer(this._getString_action_file_name({page})));
			});
		}

		const ix = await InputUiUtil.pGetUserEnum({
			values: values,
		});
		if (ix == null) return;

		const ixBase = ix % 3;

		if (ixdPFnConfirms[ix] && !(await ixdPFnConfirms[ix]())) return;
		switch (ixBase) {
			case 0: return this._pHandleClick_loadSublist_currentPinned({pFnOnSelect, page, ...ixdOtherOpts[ix]});
			case 1: return this._pHandleClick_loadSublist_savedPinned({pFnOnSelect, optsSaveManager, page, ...ixdOtherOpts[ix]});
			case 2: return this._pHandleClick_loadSublist_file({pFnOnSelect, page, ...ixdOtherOpts[ix]});
			default: throw new Error(`Unhandled!`);
		}
	}
}

class _LegacyPersistedStateMigrator {
	constructor () { this._legacyMigrations = []; }

	registerLegacyMigration (pFnMigrate) { this._legacyMigrations.push(pFnMigrate); }

	async pApplyLegacyMigrations (stored) {
		const results = await this._legacyMigrations.pSerialAwaitMap(pFn => pFn(stored));
		return results.some(Boolean); // Run all migrations; check if any were applied
	}
}

class SublistPersistor {
	static _STORAGE_KEY_SUBLIST = "sublist";

	static _LEGACY_MIGRATOR = new _LegacyPersistedStateMigrator();

	constructor ({page = null} = {}) {
		this._page = page || UrlUtil.getCurrentPage();
	}

	async pGetStateFromStorage () {
		let stored = await StorageUtil.pGetForPage(this.constructor._STORAGE_KEY_SUBLIST, {page: this._page});
		stored = stored || {};
		const isMigration = await this.constructor._LEGACY_MIGRATOR.pApplyLegacyMigrations(stored);
		if (isMigration) await StorageUtil.pSetForPage(this.constructor._STORAGE_KEY_SUBLIST, stored, {page: this._page});
		return stored;
	}

	async pDoSaveStateToStorage ({exportableSublist} = {}) {
		await StorageUtil.pSetForPage(this.constructor._STORAGE_KEY_SUBLIST, exportableSublist, {page: this._page});
	}

	async pDoRemoveStateFromStorage () {
		await StorageUtil.pRemoveForPage(this.constructor._STORAGE_KEY_SUBLIST, {page: this._page});
	}
}

class SaveManager extends BaseComponent {
	static _STORAGE_KEY_SAVES = "listSaveManager";

	static _LEGACY_MIGRATOR = new _LegacyPersistedStateMigrator();

	constructor ({isReadOnlyUi = false, isReferencable = false, page = null} = {}) {
		super();
		this._page = page || UrlUtil.getCurrentPage();
		this._isReferencable = !!isReferencable;
		this._isReadOnlyUi = !!isReadOnlyUi;

		this._pDoSaveStateToStorageDebounced = MiscUtil.debounce(
			this.pDoSaveStateToStorage.bind(this),
			50,
		);
	}

	// region Persistent state
	async pMutStateFromStorage () {
		let stored = await StorageUtil.pGetForPage(this.constructor._STORAGE_KEY_SAVES, {page: this._page});
		stored = stored || this._getDefaultState();
		const isMigration = await this.constructor._LEGACY_MIGRATOR.pApplyLegacyMigrations(stored);
		if (isMigration) await StorageUtil.pSetForPage(this.constructor._STORAGE_KEY_SAVES, stored, {page: this._page});
		this.setBaseSaveableStateFrom(stored);
	}

	async pDoSaveStateToStorage () {
		await StorageUtil.pSetForPage(this.constructor._STORAGE_KEY_SAVES, this.getBaseSaveableState(), {page: this._page});
	}

	async pDoRemoveStateFromStorage () {
		await StorageUtil.pRemoveForPage(this.constructor._STORAGE_KEY_SAVES, {page: this._page});
	}
	// endregion

	_getActiveSave () { return this._state.saves.find(it => it.id === this._state.activeId); }

	/** Note that the "-or-create" should never be required, but ensures we don't get into a bad state. */
	_getOrCreateActiveSave () {
		const save = this._getActiveSave();
		if (save) return save;

		this._doNew();
		return this._getActiveSave();
	}

	mutSaveableData ({exportedSublist}) {
		const save = this._getActiveSave();
		if (!save) return;

		["name", "saveId"]
			.forEach(prop => {
				if (save.entity[prop] != null) exportedSublist[prop] = save.entity[prop];
			});
	}

	async pDoNew (exportedSublist = null) {
		const isWarnUnsaved = this._isWarnUnsavedChanges(exportedSublist);
		if (
			isWarnUnsaved
			&& !await InputUiUtil.pGetUserBoolean({title: "Discard Unsaved Changes", htmlDescription: `You have unsaved changes.<br>Are you sure you want to create a new list, discarding these changes?`, textYes: "Yes", textNo: "Cancel"})
		) return false;

		if (
			// region These are mutually exclusive
			!isWarnUnsaved
			&& this._isWarnNeverSaved(exportedSublist)
			// endregion
			&& !await InputUiUtil.pGetUserBoolean({title: "Discard Unsaved List", htmlDescription: `Your current list has not been saved.<br>Are you sure you want to create a new list, discarding this one?`, textYes: "Yes", textNo: "Cancel"})
		) return false;

		this._doNew();

		return true;
	}

	_doNew (nxt = null) {
		nxt = nxt || this._getNewSave();
		this._state.saves = [
			...this._state.saves,
			nxt,
		];
		this._state.activeId = nxt.id;

		// Prune other unsaved state
		this._state.saves = this._state.saves.filter(it => it.entity.manager_isSaved || it.id === nxt.id);
	}

	_getUsableSaves () { return this._state.saves.filter(it => it.entity.name && it.entity.manager_isSaved); }

	async pDoUpdateCurrentStateFrom (exportedSublist, {isNoSave = false} = {}) {
		if (!exportedSublist) return;

		const activeSave = this._getOrCreateActiveSave();

		Object.keys(this._getNewSave_entity()).forEach(k => activeSave.entity[k] = exportedSublist[k]);

		this._triggerCollectionUpdate("saves");

		if (!isNoSave) this._pDoSaveStateToStorageDebounced();
	}

	async pDoLoad (
		{
			isIncludeManagerClientState = false,
		} = {},
	) {
		this._addHookBase("saves", this._pDoSaveStateToStorageDebounced);

		const dispCaret = e_({
			tag: "span",
			clazz: "lst__caret lst__caret--active",
		});

		const doSortSaves = (isDescending) => {
			this._state.saves.sort((a, b) => SortUtil.ascSortLower(
				isDescending ? b.entity.name || "" : a.entity.name || "",
				isDescending ? a.entity.name || "" : b.entity.name || ""),
			);
			this._triggerCollectionUpdate("saves");
			dispCaret.toggleClass("lst__caret--reverse", !isDescending);
		};

		// Sort (and save) on opening
		doSortSaves();

		const $wrpIsReference = !this._isReferencable
			? null
			: $$`<label class="ve-flex-v-center mr-2">
				<div class="mr-1 help" title="Turning this on will make a copy of the list as it currently exists, allowing the original to be modified or deleted without affecting the copy. Leaving this off will instead keep a reference to the list, so any change to the list will be reflected in applications which make use of it.">Make Copy</div>
				${ComponentUiUtil.$getCbBool(this, "isLoadAsCopy")}
			</label>`;

		const $btnExportAll = $(`<button class="ve-btn ve-btn-default ve-btn-xs" title="Save All Lists to File">Export All</button>`)
			.click(() => {
				DataUtil.userDownload(
					ListUtil.getDownloadNameSaves({page: this._page}),
					{saves: MiscUtil.copyFast(this._state.saves)},
					{
						fileType: ListUtil.getDownloadFiletypeSaves({page: this._page}),
					},
				);
			});

		const $btnImportAll = this._isReadOnlyUi
			? null
			: $(`<button class="ve-btn ve-btn-default ve-btn-xs" title="Load Lists from File">Import All</button>`)
				.click(async () => {
					const {jsons, errors} = await InputUiUtil.pGetUserUploadJson({
						expectedFileTypes: [ListUtil.getDownloadFiletypeSaves({page: this._page})],
					});

					DataUtil.doHandleFileLoadErrorsGeneric(errors);

					if (!jsons?.length) return;

					const json = jsons[0];

					if (!json.saves) return;

					const nxt = {saves: json.saves};
					if (!json.saves.some(it => it.id === this._state.activeId)) {
						nxt.activeId = null;
					}

					this._proxyAssignSimple("state", nxt);
				});

		const $titleSplit = $$`<div class="ve-flex-vh-center">
			${$wrpIsReference}
			<div class="ve-flex-v-center ve-btn-group">
				${$btnExportAll}
				${$btnImportAll}
			</div>
		</div>`;

		const {$modalInner, doClose, pGetResolved} = await UiUtil.pGetShowModal({
			title: "Load Saved List",
			isMinHeight0: true,
			isHeight100: true,
			isWidth100: true,
			isUncappedHeight: true,
			zIndex: VeCt.Z_INDEX_BENEATH_HOVER,
			$titleSplit,
		});

		const isEveryExpanded = saves => saves.every(it => it.entity.manager_loader_isExpanded);

		const $wrpRows = $(`<div class="ve-flex-col"></div>`);

		const $dispNoSaves = $(`<div class="ve-flex-col"><i class="ve-muted ve-text-center">No saves found.</i></div>`);

		const $btnExpandCollapseAll = $(`<button class="ve-btn ve-btn-default ve-btn-xs px-1 ve-flex-vh-center h-100 no-shrink"></button>`)
			.click(() => {
				const usableSaves = this._getUsableSaves();
				if (!usableSaves.length) return;

				const isCollapse = isEveryExpanded(usableSaves);
				usableSaves.forEach(it => it.entity.manager_loader_isExpanded = !isCollapse);
				this._triggerCollectionUpdate("saves");
			});

		let isDescending = false;
		const $btnSortName = $$`<button class="ve-btn ve-btn-default ve-btn-xs w-100">
			<span>Name</span>
			${dispCaret}
		</button>`
			.click(evt => {
				evt.stopPropagation();
				isDescending = !isDescending;
				doSortSaves(isDescending);
			});

		const renderableCollectionSaves = new SaveManager._RenderableCollectionSaves_Load(
			{
				comp: this,
				$wrpRows,
				doClose,
				page: this._page,
				isReadOnlyUi: this._isReadOnlyUi,
			},
		);

		const hkSaves = () => {
			renderableCollectionSaves.render();

			const usableSaves = this._getUsableSaves();

			$dispNoSaves.toggleVe(!usableSaves.length);

			$btnExpandCollapseAll.text(
				!usableSaves.length
					? `[+]`
					: isEveryExpanded(usableSaves) ? `[\u2013]` : `[+]`,
			);
		};
		hkSaves();
		this._addHookBase("saves", hkSaves);

		$$($modalInner)`
		<div class="ve-flex-v-center my-1 px-2p ve-btn-group">
			<button class="ve-btn ve-btn-default ve-btn-xs w-30p no-shrink" disabled>&nbsp;</button>
			${$btnExpandCollapseAll}
			${$btnSortName}
			<button class="ve-btn ve-btn-default ve-btn-xs w-50p no-shrink" disabled>&nbsp;</button>
		</div>
		${$dispNoSaves}
		${$wrpRows}`;

		const [isSelected, exportedSublist] = (await pGetResolved());

		this._removeHookBase("saves", this._pDoSaveStateToStorageDebounced);
		this._removeHookBase("saves", hkSaves);
		this._resetCollectionRenders("saves", "load");

		if (!isSelected || !exportedSublist) return null;

		const out = {...exportedSublist};
		if (isIncludeManagerClientState && this._isReferencable) {
			out.managerClient_isReferencable = !!this._isReferencable;
			out.managerClient_isLoadAsCopy = !!this._state.isLoadAsCopy;
		}
		return out;
	}

	async pGetSaveBySaveId ({saveId}) {
		if (!saveId) return null;
		const save = this._state.saves.find(it => it.entity?.saveId === saveId);
		if (!save) return null;
		return ListUtil.getWithoutManagerState(save.entity);
	}

	async pHasSaves () { return !!this._getUsableSaves().length; }

	async pDoSave (exportedSublist) {
		const save = this._getOrCreateActiveSave();

		if (!save.entity.name) {
			const name = await InputUiUtil.pGetUserString({title: "List Name"});
			if (!name || !name.trim().length) return;

			save.entity.name = name;
		}

		Object.assign(save.entity, exportedSublist);
		save.entity.manager_isSaved = true;

		this._triggerCollectionUpdate("saves");

		return save.entity;
	}

	async pDoDuplicate (exportedSublist) {
		const isWarnUnsaved = this._isWarnUnsavedChanges(exportedSublist);
		if (
			isWarnUnsaved
			&& !await InputUiUtil.pGetUserBoolean({title: "Discard Unsaved Changes", htmlDescription: `You have unsaved changes.<br>Are you sure you want to create a new list, discarding these changes?`, textYes: "Yes", textNo: "Cancel"})
		) return false;

		// (If the list has never been saved, just let the user dupe it)

		const save = this._getOrCreateActiveSave();

		const duplicate = this._getSaveCopy(save);

		this._doNew(duplicate);

		return true;
	}

	_isWarnUnsavedChanges (exportedSublist = null) {
		if (!exportedSublist) return false;

		const save = this._getActiveSave();
		if (!save?.entity.manager_isSaved) return false;

		return !CollectionUtil.deepEquals(
			ListUtil.getWithoutManagerState(save.entity),
			ListUtil.getWithoutManagerState(exportedSublist),
		);
	}

	_isWarnNeverSaved (exportedSublist = null) {
		if (!exportedSublist) return false;

		const save = this._getActiveSave();
		if (save?.entity.manager_isSaved) return false;

		return !!exportedSublist.items?.length;
	}

	$getRenderedSummary (
		{
			cbOnNew,
			cbOnDuplicate,
			cbOnSave,
			cbOnLoad,
			cbOnReset,
			cbOnUpload,
		},
	) {
		const $wrp = $(`<div class="pt-2 ve-flex-col no-print"></div>`);

		const renderableCollectionSummary = new SaveManager._RenderableCollectionSaves_Summary(
			{
				comp: this,
				$wrp,
				cbOnNew,
				cbOnDuplicate,
				cbOnSave,
				cbOnLoad,
				cbOnReset,
				cbOnUpload,
			},
		);

		const hkSaves = () => {
			renderableCollectionSummary.render();
		};
		hkSaves();
		this._addHookBase("saves", hkSaves);
		this._addHookBase("activeId", hkSaves);

		return {
			$wrp,
			cbOnListUpdated: renderableCollectionSummary.cbOnListUpdated.bind(renderableCollectionSummary),
		};
	}

	$getBtnDownloadSave_ ({save, title = "Download", cbOnSave = null}) {
		return $(`<button class="ve-btn ve-btn-5et ve-btn-xs ve-btn-default" title="${title.qq()}"><span class="glyphicon glyphicon-download"></span></button>`)
			.click(async evt => {
				evt.stopPropagation();

				if (cbOnSave) {
					const didSave = await cbOnSave(evt);
					if (!didSave) return;
				}

				DataUtil.userDownload(
					ListUtil.getDownloadName({page: this._page, save}),
					// Export in a format the "Upload Pinned List" loader can understand
					ListUtil.getWithoutManagerState(save.entity),
					{
						fileType: ListUtil.getDownloadFiletype({page: this._page}),
					},
				);
			});
	}

	_getNewSave_entity () {
		return {
			name: null,
		};
	}

	_getNewSave () {
		return {
			id: CryptUtil.uid(),
			entity: {
				...this._getNewSave_entity(),

				// Used to e.g. reference encounters in the DM Screen timetracker
				saveId: CryptUtil.uid(),

				manager_isSaved: false,

				manager_loader_isExpanded: false,
			},
		};
	}

	_getSaveCopy (save) {
		save = MiscUtil.copyFast(save);

		save.id = CryptUtil.uid();
		save.entity.saveId = CryptUtil.uid();

		if (save.entity.name) {
			let isReplaced = false;

			save.entity.name = save.entity.name
				.replace(/(?<prefix> \()(?<num>\d+)(?<suffix>\)\s*)$/i, (...m) => {
					isReplaced = true;
					return `${m.last().prefix}${Number(m.last().num) + 1}${m.last().suffix}`;
				});

			if (!isReplaced) {
				save.entity.name = `${save.entity.name} (1)`;
			}
		}

		return save;
	}

	_getDefaultState () {
		const save = this._getNewSave();
		return {
			activeId: save.id,
			isLoadAsCopy: false,
			saves: [
				save,
			],
		};
	}
}

SaveManager._RenderableCollectionSaves_Load = class extends RenderableCollectionGenericRows {
	constructor (
		{
			comp,

			doClose,
			$wrpRows,
			page,
			isReadOnlyUi,
		},
	) {
		super(comp, "saves", $wrpRows, {namespace: "load"});
		this._doClose = doClose;
		this._page = page;
		this._isReadOnlyUi = isReadOnlyUi;
	}

	getNewRender (save, i) {
		const comp = this._utils.getNewRenderComp(save, i);

		const $wrpPreviewInner = $(`<div class="ve-flex-col py-3 ml-4 accordion__wrp-preview-inner w-100"></div>`);

		const $wrpPreview = $$`<div class="ve-flex ve-hidden relative accordion__wrp-preview">
			<div class="vr-0 absolute accordion__vr-preview"></div>
			${$wrpPreviewInner}
		</div>`;

		let pExpandLoadList = null;
		const $btnExpand = $(`<div class="px-1 ve-flex-vh-center h-100 mr-2 relative top-n1p clickable no-select"></div>`);
		const hkIsExpanded = () => {
			$wrpPreview.toggleVe(!!comp._state.manager_loader_isExpanded);
			$btnExpand
				.text(comp._state.manager_loader_isExpanded ? `[\u2013]` : `[+]`)
				.title(comp._state.manager_loader_isExpanded ? "Collapse Preview" : "Expand Preview");

			if (!comp._state.manager_loader_isExpanded) return;

			pExpandLoadList = pExpandLoadList || ListUtil
				.pGetSublistEntities_fromHover({
					exportedSublist: save.entity,
					page: this._page,
				})
				.then(entityInfos => {
					const lis = entityInfos
						.sort(({entity: entityA}, {entity: entityB}) => SortUtil.ascSortLower(entityA.name || "", entityB.name || ""))
						.map(({count, entity}) => {
							return `<li>${count > 1 ? `${count}× ` : ""}${Renderer.hover.getEntityLink(entity)}</li>`;
						})
						.join("");

					$wrpPreviewInner
						.empty()
						.fastSetHtml(lis ? `<ul class="my-0" onclick="event.stopPropagation()">${lis}</ul>` : Renderer.get().render(`{@note This list is empty.}`));
				});
		};
		comp._addHookBase("manager_loader_isExpanded", hkIsExpanded);
		hkIsExpanded();

		const $btnLoad = $(`<button class="ve-btn ve-btn-5et ve-btn-xs ve-btn-primary" title="Load"><span class="glyphicon glyphicon-ok"></span></button>`)
			.click(evt => {
				evt.stopPropagation();
				this._comp._state.activeId = save.id;
				this._doClose(true, ListUtil.getWithoutManagerState(comp.toObject("*")));
			});

		const $dispName = ComponentUiUtil.$getDisp(comp, "name", {$ele: $(`<div class="w-100"></div>`)});

		const $btnDownload = this._comp.$getBtnDownloadSave_({save});

		const $btnDelete = this._isReadOnlyUi
			? null
			: $(`<button class="ve-btn ve-btn-5et ve-btn-xs ve-btn-danger" title="Delete"><span class="glyphicon glyphicon-trash"></span></button>`)
				.click(evt => {
					evt.stopPropagation();
					this._comp._state.saves = this._comp._state.saves.filter(it => it.id !== save.id);
					if (this._comp._state.activeId === save.id) this._comp._doNew();
				});

		const $wrpRow = $$`<div class="ve-flex-col w-100">
			<div class="ve-flex-v-center w-100 py-1 clickable lst__row lst__row-border lst__row-inner">
				<div class="ve-flex-vh-center w-30p no-shrink">
					${$btnLoad}
				</div>
				${$btnExpand}
				${$dispName}
				<div class="ve-flex-vh-center ve-btn-group ml-2 w-50p">
					${$btnDownload}
					${$btnDelete}
				</div>
			</div>
			${$wrpPreview}
		</div>`
			.click(() => comp._state.manager_loader_isExpanded = !comp._state.manager_loader_isExpanded)
			.appendTo(this._$wrpRows);

		const hkDisplay = () => $wrpRow.toggleVe(comp._state.name && comp._state.manager_isSaved);
		comp._addHookBase("name", hkDisplay);
		comp._addHookBase("manager_isSaved", hkDisplay);
		hkDisplay();

		return {
			comp,
			$wrpRow,
		};
	}
};

SaveManager._RenderableCollectionSaves_Summary = class extends RenderableCollectionBase {
	constructor (
		{
			comp,

			$wrp,
			cbOnNew,
			cbOnDuplicate,
			cbOnSave,
			cbOnLoad,
			cbOnReset,
			cbOnUpload,
		},
	) {
		super(comp, "saves", {namespace: "summary"});
		this._$wrp = $wrp;
		this._cbOnNew = cbOnNew;
		this._cbOnDuplicate = cbOnDuplicate;
		this._cbOnSave = cbOnSave;
		this._cbOnLoad = cbOnLoad;
		this._cbOnReset = cbOnReset;
		this._cbOnUpload = cbOnUpload;
	}

	cbOnListUpdated ({cntVisibleItems}) {
		const renderedCollection = this._comp._getRenderedCollection({prop: "saves", namespace: "summary"});
		Object.values(renderedCollection).forEach(renderedMeta => renderedMeta.$dispCount.html(`<span class="glyphicon glyphicon-pushpin mr-1"></span> ${cntVisibleItems}`));
	}

	getNewRender (save, i) {
		const comp = BaseComponent.fromObject(save.entity, "*");
		comp._addHookAll("state", () => {
			this._getCollectionItem(save.id).entity = comp.toObject("*");
			this._comp._triggerCollectionUpdate("saves");
		});

		const $iptName = ComponentUiUtil.$getIptStr(comp, "name", {placeholder: "(Unnamed List)"});

		const $dispCount = $(`<div class="absolute right-0 z-index-1 no-events ve-flex-vh-center ve-muted pr-2 ve-small" title="Number of Pinned List Items"></div>`);

		const $btnNew = $(`<button class="ve-btn ve-btn-5et ve-btn-xs ve-btn-default" title="New Pinned List"><span class="glyphicon glyphicon-file"></span></button>`)
			.click(evt => this._cbOnNew(evt));

		const $btnDuplicate = $(`<button class="ve-btn ve-btn-5et ve-btn-xs ve-btn-default" title="Duplicate Pinned List"><span class="glyphicon glyphicon-duplicate"></span></button>`)
			.click(evt => this._cbOnDuplicate(evt));

		const $btnSave = $(`<button class="ve-btn ve-btn-5et ve-btn-xs ve-btn-default" title="Save Pinned List"><span class="glyphicon glyphicon-floppy-disk"></span></button>`)
			.click(evt => this._cbOnSave(evt));

		const $btnLoad = $(`<button class="ve-btn ve-btn-5et ve-btn-xs ve-btn-default" title="Load Pinned List"><span class="glyphicon glyphicon-folder-open"></span></button>`)
			.click(evt => this._cbOnLoad(evt));

		const $btnDownload = this._comp.$getBtnDownloadSave_({save, title: "Download Pinned List", cbOnSave: this._cbOnSave});

		const $btnUpload = $(`<button class="ve-btn ve-btn-5et ve-btn-xs ve-btn-default" title="Upload Pinned List"><span class="glyphicon glyphicon-upload"></span></button>`)
			.click(evt => this._cbOnUpload(evt));

		const $btnReset = $(`<button class="ve-btn ve-btn-5et ve-btn-xs ve-btn-default" title="Reload Pinned List"><span class="glyphicon glyphicon-refresh"></span></button>`)
			.click(evt => this._cbOnReset(evt, ListUtil.getWithoutManagerState(comp.toObject("*"))));

		const hkBtnReset = () => $btnReset.prop("disabled", !comp._state.manager_isSaved);
		comp._addHookBase("name", hkBtnReset);
		comp._addHookBase("manager_isSaved", hkBtnReset);
		hkBtnReset();

		const $wrpRow = $$`<div class="ve-flex-col my-2 w-100">
			<div class="ve-flex-v-center">
				<div class="ve-flex-v-center mr-1 w-100 min-w-0 relative">
					<div class="mr-2 ve-muted">List:</div>
					${$iptName}
					${$dispCount}
				</div>
				<div class="ve-flex-h-right ve-flex-v-center ve-btn-group no-shrink">
					${$btnNew}
					${$btnDuplicate}
					${$btnSave}
					${$btnLoad}
					${$btnDownload}
					${$btnUpload}
					${$btnReset}
				</div>
			</div>
		</div>`.appendTo(this._$wrp);

		const hkDisplay = () => $wrpRow.toggleVe(this._comp._state.activeId === save.id);
		hkDisplay();

		return {
			comp,
			$wrpRow,
			$dispCount,
			$iptName,
			hkDisplay,
		};
	}

	doUpdateExistingRender (renderedMeta, save, i) {
		renderedMeta.hkDisplay();
		renderedMeta.comp._proxyAssignSimple("state", save.entity, true);
		if (!renderedMeta.$wrpRow.parent().is(this._$wrp)) renderedMeta.$wrpRow.appendTo(this._$wrp);
	}
};

class SublistPlugin {
	initLate () { /* Implement as required */ }

	async pLoadData ({exportedSublist, isMemoryOnly = false}) { throw new Error(`Unimplemented!`); }
	async pMutLegacyData ({exportedSublist, isMemoryOnly = false}) { /* Implement as required */ }

	async pMutSaveableData ({exportedSublist, isMemoryOnly = false}) { throw new Error(`Unimplemented!`); }

	async pHandleRemoveAll () { /* Implement as required */ }

	async pDoInitNewState ({prevExportableSublist, evt}) { /* Implement as required */ }

	getDownloadName () { /* Implement as required */ }
	getDownloadFileType () { /* Implement as required */ }
	getUploadFileTypes ({downloadFileTypeBase}) { /* Implement as required */ }

	onSublistUpdate () { /* Implement as required */ }
}
