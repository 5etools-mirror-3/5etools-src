import {PANEL_TYP_EMPTY} from "./dmscreen/dmscreen-consts.js";
import {DmMapper} from "./dmscreen/panels/dmscreen-panelapp-mapper.js";
import {TimerTrackerMoonSpriteLoader} from "./dmscreen/panels/dmscreen-panelapp-timetracker.js";
import {
	PanelContentManager_Counter,
	PanelContentManager_InitiativeTracker,
	PanelContentManager_InitiativeTrackerCreatureViewer,
	PanelContentManager_InitiativeTrackerPlayerViewV0,
	PanelContentManager_InitiativeTrackerPlayerViewV1,
	PanelContentManager_MoneyConverter,
	PanelContentManager_NoteBox, PanelContentManager_TimeTracker,
	PanelContentManager_UnitConverter,
	PanelContentManager_GenericEmbed,
	PanelContentManager_Twitch,
	PanelContentManager_TwitchChat,
	PanelContentManager_YouTube,
} from "./dmscreen/panels/dmscreen-panels.js";
import {OmnisearchBacking} from "./omnisearch/omnisearch-backing.js";
import {DmScreenSideMenu} from "./dmscreen/sidemenu/dmscreen-sidemenu.js";
import {DmScreenMigrator} from "./dmscreen/dmscreen-migrator.js";
import {DmScreenSettings} from "./dmscreen/dmscreen-settings.js";
import {DmScreenElementCache} from "./dmscreen/dmscreen-elementcache.js";
import {Panel} from "./dmscreen/dmscreen-panel.js";
import {adventureLoader, bookLoader} from "./dmscreen/dmscreen-corpusloader.js";

class Board {
	constructor () {
		this.panels = {};
		this.exiledPanels = [];
		this.eleScreen = veEs(`.dm-screen`);
		this.width = this.getInitialWidth();
		this.height = this.getInitialHeight();
		this.sideMenu = new DmScreenSideMenu({board: this});
		this.menu = new AddMenu();
		this.isFullscreen = false;
		this.isLocked = false;
		this.isAlertOnNav = false;
		this._compSettings = new DmScreenSettings();
		this._cacheElements = new DmScreenElementCache();

		this._idSaveSlotActive = "1";
		this._saveSlotStates = {[this._idSaveSlotActive]: {}};

		this.nextId = 1;
		this.hoveringPanel = null;
		this.availContent = {};
		this.availRules = {};
		this.availAdventures = {};
		this.availBooks = {};

		this._pDoSaveStateDebounced = MiscUtil.debounce(() => StorageUtil.pSet(VeCt.STORAGE_DMSCREEN, this.getSaveableState()), VeCt.DUR_DEBOUNCE_SAVE);
	}

	getInitialWidth () {
		const scW = this.eleScreen.vee.outerWidth();
		return Math.floor(scW / 360);
	}

	getInitialHeight () {
		const scH = this.eleScreen.vee.outerHeight();
		return Math.floor(scH / 280);
	}

	getNextId () {
		return this.nextId++;
	}

	getEleScreen () {
		return this.eleScreen;
	}

	getWidth () {
		return this.width;
	}

	getHeight () {
		return this.height;
	}

	getCompSettings () { return this._compSettings; }

	setDimensions (width, height) {
		const oldWidth = this.width;
		const oldHeight = this.height;
		if (width) this.width = Math.max(width, 1);
		if (height) this.height = Math.max(height, 1);
		if (!(oldWidth === width && oldHeight === height)) {
			this.doAdjustEleScreenCss();
			if (width < oldWidth || height < oldHeight) this.doCullPanels(oldWidth, oldHeight);
		}
		this.doCheckFillSpaces();
		this.eleScreen.vee.trigger("panelResize");
	}

	doCullPanels (oldWidth, oldHeight) {
		for (let x = oldWidth - 1; x >= 0; x--) {
			for (let y = oldHeight - 1; y >= 0; y--) {
				const p = this.getPanel(x, y);
				if (!p) continue; // happens when a large panel gets shrunk
				if (x >= this.width && y >= this.height) {
					if (p.canShrinkBottom() && p.canShrinkRight()) {
						p.doShrinkBottom();
						p.doShrinkRight();
					} else p.exile();
				} else if (x >= this.width) {
					if (p.canShrinkRight()) p.doShrinkRight();
					else p.exile();
				} else if (y >= this.height) {
					if (p.canShrinkBottom()) p.doShrinkBottom();
					else p.exile();
				}
			}
		}
	}

	doAdjustEleScreenCss () {
		// assumes 7px grid spacing
		this.eleScreen.vee.toggleClass("ve-mt-3p", !this.isFullscreen);
	}

	getPanelDimensions () {
		const w = this.eleScreen.vee.outerWidth();
		const h = this.eleScreen.vee.outerHeight();
		return {
			pxWidth: w / this.width,
			pxHeight: h / this.height,
		};
	}

	doShowLoading () {
		veT`<div class="dm-screen-loading"><span class="initial-message initial-message--large">Loading...</span></div>`.vee.css({
			gridColumnStart: 1,
			gridColumnEnd: String(this.width + 1),
			gridRowStart: 1,
			gridRowEnd: String(this.height + 1),
		}).vee.appendTo(this.eleScreen);
	}

	doHideLoading () {
		this.eleScreen.vee.find(`.dm-screen-loading`).remove();
	}

	/**
	 * @param {?boolean} val
	 */
	doToggleFullscreen ({val = null} = {}) {
		this.isFullscreen = val ?? !this.isFullscreen;

		veE(document.body).vee.toggleClass("is-fullscreen", this.isFullscreen);
		this.doAdjustEleScreenCss();
		this.sideMenu.setIsFullscreen(this.isFullscreen);

		this.doSaveStateDebounced();

		this.eleScreen.vee.trigger("panelResize");
	}

	/**
	 * @param {?boolean} val
	 */
	doToggleLocked ({val = null} = {}) {
		this.isLocked = val ?? !this.isLocked;

		if (this.isLocked) {
			this.setAllControlBarsVisible(false);
		}

		veE(document.body).vee.toggleClass(`dm-screen-locked`, this.isLocked);
		this.sideMenu.setIsLocked(!!this.isLocked);

		this.doSaveStateDebounced();
	}

	async pInitialise () {
		this.sideMenu.init();

		this.doAdjustEleScreenCss();
		this.doShowLoading();

		await Promise.all([
			PrereleaseUtil.pInit(),
			BrewUtil2.pInit(),
		]);
		await ExcludeUtil.pInitialise();

		await Promise.all([
			TimerTrackerMoonSpriteLoader.pInit(),
			this._pInitSearchAndMenu(),
			adventureLoader.pInit(),
			bookLoader.pInit(),
		]);
		if (this.hasSavedStateUrl()) {
			await this.pDoLoadUrlState();
		} else if (await this.pHasSavedState()) {
			await this.pDoLoadState();
		}
		this.doCheckFillSpaces({isSkipSave: true});
		this.initGlobalHandlers();

		this._compSettings._addHookBase("isHistoryEnabled", () => {
			if (this._compSettings.getIsHistoryEnabled()) return;

			const cntDestroyed = this.exiledPanels.map(panel => panel.destroy()).length;
			this.exiledPanels = [];
			if (cntDestroyed) this.sideMenu.doUpdateHistory();
		});

		this._compSettings._addHookBase("historySize", () => {
			const toDestroy = this.exiledPanels.splice(this._compSettings.getHistorySize());
			toDestroy.forEach(panel => panel.destroy());
			if (toDestroy.length) this.sideMenu.doUpdateHistory();
		});

		this._compSettings._addHookAll("state", () => this.doSaveStateDebounced());

		this._cacheElements.init();

		this.doHideLoading();

		await this._pLoadTempData();

		veE(document.body)
			.vee.onn("keydown", evt => {
				if (evt.key !== "Escape" || !this.isFullscreen) return;
				evt.stopPropagation();
				evt.preventDefault();
				this.doToggleFullscreen();
			})
			.vee.onn("mousemove", evt => {
				this.setHoveringPanel(null);

				const x = EventUtil.getClientX(evt);
				const y = EventUtil.getClientY(evt);

				for (const panel of Object.values(this.panels)) {
					const bcr = panel.pnl?.getBoundingClientRect();
					if (!bcr) continue;

					if (
						x >= bcr.left && x <= bcr.left + bcr.width
						&& y >= bcr.top && y <= bcr.top + bcr.height
					) {
						this.setHoveringPanel(panel);
						break;
					}
				}
			});

		window.dispatchEvent(new Event("toolsLoaded"));
	}

	initGlobalHandlers () {
		window.onhashchange = () => this.pDoLoadUrlState();
	}

	async _pLoadTempData () {
		const temp = await StorageUtil.pGet(VeCt.STORAGE_DMSCREEN_TEMP_SUBLIST);
		if (!temp) return;

		try {
			await this._pLoadTempData_({temp});
		} finally {
			await StorageUtil.pRemove(VeCt.STORAGE_DMSCREEN_TEMP_SUBLIST);
		}
	}

	async _pLoadTempData_ ({temp}) {
		const entityInfos = await ListUtil.pGetSublistEntities_fromHover({
			exportedSublist: temp.exportedSublist,
			page: temp.page,
		});

		const len = entityInfos.length;
		if (!len) return;

		const entities = entityInfos.map(it => it.entity);

		this.doMassPopulate_Entities({
			page: temp.page,
			entities,
			isTabs: temp.isTabs,
		});
	}

	async _pInitSearchAndMenu () {
		await SearchUiUtil.pDoGlobalInit();

		// region rules
		await (async () => {
			const data = await DataUtil.loadJSON("data/generated/bookref-dmscreen-index.json");
			this.availRules.ALL = elasticlunr(function () {
				this.addField("b");
				this.addField("s");
				this.addField("p");
				this.addField("n");
				this.addField("h");
				this.setRef("id");
			});
			SearchUtil.removeStemmer(this.availRules.ALL);

			data.data.forEach(d => {
				d.n = data._meta.name[d.b];
				d.b = data._meta.id[d.b];
				d.s = data._meta.section[d.s];
				this.availRules.ALL.addDoc(d);
			});
		})();
		// endregion

		// region adventures/books
		const adventureOrBookIdToSource = {};

		// adventures
		await this._pDoBuildAdventureOrBookIndex({
			adventureOrBookIdToSource,
			dataPath: `data/adventures.json`,
			dataProp: "adventure",
			page: UrlUtil.PG_ADVENTURE,
			indexStorage: this.availAdventures,
			indexIdField: "a",
		});

		// books
		await this._pDoBuildAdventureOrBookIndex({
			adventureOrBookIdToSource,
			dataPath: `data/books.json`,
			dataProp: "book",
			page: UrlUtil.PG_BOOK,
			indexStorage: this.availBooks,
			indexIdField: "b",
		});
		// endregion

		// search
		this.availContent = await SearchUiUtil.pGetContentIndices();

		// add tabs
		const omniTab = new AddMenuSearchTab({board: this, indexes: this.availContent, tabId: "omni"});
		const ruleTab = new AddMenuSearchTab({board: this, indexes: this.availRules, subType: "rule", tabId: "rule"});
		const adventureTab = new AddMenuSearchTab({board: this, indexes: this.availAdventures, subType: "adventure", adventureOrBookIdToSource, tabId: "adventure"});
		const bookTab = new AddMenuSearchTab({board: this, indexes: this.availBooks, subType: "book", adventureOrBookIdToSource, tabId: "book"});
		const embedTab = new AddMenuVideoTab({board: this});
		const imageTab = new AddMenuImageTab({board: this});
		const specialTab = new AddMenuSpecialTab({board: this});

		this.menu
			.addTab(omniTab)
			.addTab(ruleTab)
			.addTab(adventureTab)
			.addTab(bookTab)
			.addTab(imageTab)
			.addTab(embedTab)
			.addTab(specialTab);

		await this.menu.pRender();

		this.sideMenu.render();
	}

	async _pDoBuildAdventureOrBookIndex (
		{
			adventureOrBookIdToSource,
			dataPath,
			dataProp,
			page,
			indexStorage,
			indexIdField,
		},
	) {
		const data = await DataUtil.loadJSON(dataPath);
		adventureOrBookIdToSource[dataProp] = adventureOrBookIdToSource[dataProp] || {};

		indexStorage.ALL = elasticlunr(function () {
			this.addField(indexIdField);
			this.addField("c");
			this.addField("n");
			this.addField("p");
			this.addField("o");
			this.setRef("id");
		});
		SearchUtil.removeStemmer(indexStorage.ALL);

		let bookOrAdventureId = 0;
		const handleAdventureOrBook = (adventureOrBook, isBrew) => {
			if (ExcludeUtil.isExcluded(UrlUtil.URL_TO_HASH_BUILDER[page](adventureOrBook), dataProp, adventureOrBook.source, {isNoCount: true})) return;

			adventureOrBookIdToSource[dataProp][adventureOrBook.id] = adventureOrBook.source;

			indexStorage[adventureOrBook.id] = elasticlunr(function () {
				this.addField(indexIdField);
				this.addField("c");
				this.addField("n");
				this.addField("p");
				this.addField("o");
				this.setRef("id");
			});
			SearchUtil.removeStemmer(indexStorage[adventureOrBook.id]);

			adventureOrBook.contents.forEach((chap, i) => {
				const chapDoc = {
					[indexIdField]: adventureOrBook.id,
					n: adventureOrBook.name,
					c: chap.name,
					p: i,
					id: bookOrAdventureId++,
				};
				if (chap.ordinal) chapDoc.o = Parser.bookOrdinalToAbv(chap.ordinal, {isPreNoSuff: true, isPlainText: true});
				if (isBrew) chapDoc.w = true;

				indexStorage.ALL.addDoc(chapDoc);
				indexStorage[adventureOrBook.id].addDoc(chapDoc);
			});
		};

		data[dataProp].forEach(adventureOrBook => handleAdventureOrBook(adventureOrBook));
		((await PrereleaseUtil.pGetBrewProcessed())[dataProp] || []).forEach(adventureOrBook => handleAdventureOrBook(adventureOrBook, true));
		((await BrewUtil2.pGetBrewProcessed())[dataProp] || []).forEach(adventureOrBook => handleAdventureOrBook(adventureOrBook, true));
	}

	getPanel (x, y) {
		return Object.values(this.panels).find(p => {
			// x <= pX < x+w && y <= pY < y+h
			return (p.x <= x) && (x < (p.x + p.width)) && (p.y <= y) && (y < (p.y + p.height));
		});
	}

	getPanels (x, y, w = 1, h = 1) {
		const out = [];
		for (let wOffset = 0; wOffset < w; ++wOffset) {
			for (let hOffset = 0; hOffset < h; ++hOffset) {
				out.push(this.getPanel(x + wOffset, y + hOffset));
			}
		}
		return out.filter(it => it);
	}

	getPanelPx (xPx, hPx) {
		const dim = this.getPanelDimensions();
		return this.getPanel(Math.floor(xPx / dim.pxWidth), Math.floor(hPx / dim.pxHeight));
	}

	setHoveringPanel (panel) {
		this.hoveringPanel = panel;
	}

	setVisiblyHoveringPanel (isVis) {
		Object.values(this.panels).forEach(p => p.removeHoverClass());
		if (isVis && this.hoveringPanel) this.hoveringPanel.addHoverClass();
	}

	/* -------------------------------------------- */

	_exilePanel_doExile (panel) {
		if (panel.getEmpty()) {
			panel.destroy();
			return;
		}

		if (!this._compSettings.getIsHistoryEnabled()) {
			panel.destroy();
			return;
		}

		panel.doDetachExileElements();
		this.untrackPanel(panel.id, {isSkipSave: true});

		this.exiledPanels.unshift(panel);
		this.exiledPanels.splice(this._compSettings.getHistorySize())
			.forEach(p => p.destroy());
		this.sideMenu.doUpdateHistory();
	}

	exilePanel (panelId) {
		if (!this.panels[panelId]) return;
		this._exilePanel_doExile(this.panels[panelId]);
		this.doSaveStateDebounced();
	}

	/* ----- */

	recallPanel (panel) {
		const ix = this.exiledPanels.findIndex(p => p.id === panel.id);
		if (~ix) this.exiledPanels.splice(ix, 1);
		panel.doReattachExileElements();
		this.panels[panel.id] = panel;
		this.fireBoardEvent({type: "panelIdSetActive", payload: {type: panel.type}});
		this.doSaveStateDebounced();
	}

	/* ----- */

	untrackPanel (panelId, {isSkipSave = false} = {}) {
		if (!this.panels[panelId]) return;
		delete this.panels[panelId];
		if (!isSkipSave) this.doSaveStateDebounced();
	}

	/* -------------------------------------------- */

	doCheckFillSpaces ({isSkipSave = false} = {}) {
		const panelsToRender = [];
		let isAnyFilled = false;

		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < this.height; ++y) {
				const pnl = this.getPanel(x, y);
				if (pnl) continue;

				isAnyFilled = true;
				const nuPnl = new Panel(this, x, y);
				this.panels[nuPnl.id] = nuPnl;
				this.fireBoardEvent({type: "panelIdSetActive", payload: {type: nuPnl.type}});
				panelsToRender.push(nuPnl);
			}
		}

		panelsToRender.forEach(p => p.render());
		if (!isSkipSave && isAnyFilled) this.doSaveStateDebounced();
	}

	/* -------------------------------------------- */

	_doVerifySaveSlotId (state, id) {
		if (!state.sls[id]) throw new Error(`Save slot with ID "${id}" does not exist!`);
	}

	async pHandleClick_setActiveSaveSlot (id) {
		const nxt = this.getSaveableState();
		this._doVerifySaveSlotId(nxt, id);
		nxt.sla = id;
		await this.pDoLoadStateFrom(nxt);
	}

	static _MAX_SAVE_SLOTS = 99;

	_isNextSaveSlotStatesAvailable (state, {isNotify = false, cntAdditional = 1} = {}) {
		const cntNxtSlotStates = Object.keys(state.sls || {}).length + cntAdditional;

		if ((this.constructor._MAX_SAVE_SLOTS - cntNxtSlotStates) < 0) {
			if (isNotify) JqueryUtil.doToast({type: "warning", content: `Too many save slots! Try deleting some first.`});
			return false;
		}

		return true;
	}

	_getNextSaveSlotId (state) {
		// Attempt to fill holes
		for (let idSaveSlot = 1; idSaveSlot < this.constructor._MAX_SAVE_SLOTS; ++idSaveSlot) {
			if (state.sls[idSaveSlot]) continue;
			return `${idSaveSlot}`;
		}
		throw new Error(`No valid save slot ID available! This is a bug!`);
	}

	async pHandleClick_doNewSaveSlot ({isActive = false} = {}) {
		const nxt = this.getSaveableState();
		if (!this._isNextSaveSlotStatesAvailable(nxt, {isNotify: true})) return;

		const idSaveSlot = this._getNextSaveSlotId(nxt);
		if (isActive) nxt.sla = idSaveSlot;
		nxt.sls[idSaveSlot] = {};

		await this.pDoLoadStateFrom(nxt);
	}

	async pHandleClick_doDuplicateSaveSlot (id) {
		const nxt = this.getSaveableState();
		this._doVerifySaveSlotId(nxt, id);
		if (!this._isNextSaveSlotStatesAvailable(nxt, {isNotify: true})) return;

		const idSaveSlot = this._getNextSaveSlotId(nxt);
		nxt.sla = idSaveSlot;
		nxt.sls[idSaveSlot] = MiscUtil.copyFast(nxt.sls[id]);

		await this.pDoLoadStateFrom(nxt);
	}

	hasSavedStateUrl () {
		return window.location.hash.length;
	}

	async pDoLoadUrlState () {
		if (window.location.hash.length) {
			const toLoad = JSON.parse(decodeURIComponent(window.location.hash.slice(1)));
			await this.pDoLoadStateFrom(toLoad);
		}
		window.location.hash = "";
	}

	async pHasSavedState () {
		return !!await StorageUtil.pGet(VeCt.STORAGE_DMSCREEN);
	}

	_getSaveSlotState () {
		return {
			// n -- name
			// ns -- short name
			ps: Object.values(this.panels).map(p => p.getSaveableState()),
			ex: this.exiledPanels.map(p => p.getSaveableState()),
		};
	}

	/** One-way sync from sidebar */
	setSaveSlotInfo ({idSaveSlotActive, saveSlotStates}) {
		if (idSaveSlotActive == null) throw new Error(`No active save slot ID provided!`);
		if (saveSlotStates == null || !Object.keys(saveSlotStates).length) throw new Error(`No save slot states provided!`);

		this._idSaveSlotActive = idSaveSlotActive;
		this._saveSlotStates = saveSlotStates;
		this.doSaveStateDebounced();
	}

	getSaveableState () {
		const sls = MiscUtil.copyFast(this._saveSlotStates);
		sls[this._idSaveSlotActive] = {
			...sls[this._idSaveSlotActive],
			...this._getSaveSlotState(),
		};

		const out = {
			mv: DmScreenMigrator.CURRENT_MIGRATION_VERSION,

			w: this.width,
			h: this.height,
			fs: this.isFullscreen,
			lk: this.isLocked,

			sla: this._idSaveSlotActive,
			sls,
		};

		const compSettingsState = this._compSettings.getSerializedState();
		if (Object.keys(compSettingsState).some(k => k in out)) throw new Error(`Key conflict found when merging saveable state! This is a bug.`);

		return Object.assign(out, compSettingsState);
	}

	doSaveStateDebounced () {
		this._pDoSaveStateDebounced();
	}

	/* -------------------------------------------- */

	async _pDoLoadStateFrom_pGetLoadableState ({save, isOptionallyPromptCombine = false, isCombine = false}) {
		const migrator = new DmScreenMigrator();

		if (isCombine) {
			migrator.mutMigrateSave(save);

			const nxt = this.getSaveableState();

			if (!this._isNextSaveSlotStatesAvailable(nxt, {cntAdditional: Object.keys(save.sls || {}).length, isNotify: true})) {
				return {state: null, isCombined: false};
			}

			Object.values(save.sls)
				.forEach(saveSlotState => {
					nxt.sls[this._getNextSaveSlotId(nxt)] = saveSlotState;
				});

			return {state: nxt, isCombined: true};
		}

		if (!isOptionallyPromptCombine || !migrator.isCombinableSave(save)) {
			migrator.mutMigrateSave(save);
			return {state: save, isCombined: false};
		}

		const nxt = this.getSaveableState();
		if (!this._isNextSaveSlotStatesAvailable(nxt)) {
			migrator.mutMigrateSave(save);
			return {state: save, isCombined: false};
		}

		const valUser = await InputUiUtil.pGetUserBoolean({
			title: "Load Legacy State",
			htmlDescription: `<div>You are attempting to load a legacy state file, containing a single save slot.<br>Would you like to add the save slot to your current screen, or overwrite all save slots with this single save?</div>`,
			textYes: "Add As Save Slot",
			textNo: "Overwrite Existing Save Slots",
		});
		if (valUser == null) return {state: null, isCombined: false};

		if (valUser) {
			const combinableSave = migrator.getCombinableSave(save);

			const idSaveSlot = this._getNextSaveSlotId(nxt);
			nxt.sla = idSaveSlot;
			nxt.sls[idSaveSlot] = combinableSave;

			save = nxt;
		}

		migrator.mutMigrateSave(save);

		return {state: save, isCombined: true};
	}

	/**
	 * Stretch width/height to meet the largest value required amongst panels
	 */
	_pDoLoadStateFrom_getStretchedWidthHeight ({state, isCombined}) {
		if (!isCombined) {
			return {
				width: state.w,
				height: state.h,
			};
		}

		const getValsDimension = prop => {
			return Object.values(state.sls)
				.flatMap(slotState => {
					return (slotState.ps || [])
						.filter(p => p[prop] != null)
						.map(p => p[prop] + 1)
						.filter(v => v != null);
				});
		};

		const valsWidth = [
			state.w,
			...getValsDimension("x"),
		]
			.filter(v => v != null);
		const valsHeight = [
			state.h,
			...getValsDimension("y"),
		]
			.filter(v => v != null);

		return {
			width: valsWidth.length ? Math.max(...valsWidth) : null,
			height: valsHeight.length ? Math.max(...valsHeight) : null,
		};
	}

	async pDoLoadStateFrom (save, {isOptionallyPromptCombine = false, isCombine = false} = {}) {
		const {state, isCombined} = await this._pDoLoadStateFrom_pGetLoadableState({save, isOptionallyPromptCombine, isCombine});
		if (state == null) return;

		const {width, height} = this._pDoLoadStateFrom_getStretchedWidthHeight({state, isCombined});
		const idSaveSlotActiveNxt = state.sla ?? "1";
		const isPreserveEmbedsOnSaveSlotChange = this._compSettings.getIsPreserveEmbedsOnSaveSlotChange()
			&& this._idSaveSlotActive !== idSaveSlotActiveNxt;

		if (isPreserveEmbedsOnSaveSlotChange) {
			this._cacheElements.doCacheElementsForSaveSlot({
				idSaveSlot: this._idSaveSlotActive,
				cacheableElementsInfos: Object.values(this.panels)
					.map(p => p.getCacheableElementsInfo())
					.flat(),
			});
		}

		this.doReset({width, height});

		this._compSettings.setStateFromSerialized(state);
		if ((state.fs !== !!this.isFullscreen)) this.doToggleFullscreen({val: !!state.fs});
		if ((state.lk !== !!this.isLocked)) this.doToggleLocked({val: !!state.lk});

		this._idSaveSlotActive = idSaveSlotActiveNxt;
		this._saveSlotStates = state.sls ?? {[this._idSaveSlotActive]: {}};

		const saveSlotStateActive = state.sls?.[state.sla] || {};

		// re-exile
		const toReExile = (saveSlotStateActive.ex || [])
			.filter(Boolean)
			.reverse();
		for (const saved of toReExile) {
			const panel = await Panel.fromSavedState(this, saved);
			if (!panel) continue;

			this.panels[panel.id] = panel;
			this.fireBoardEvent({type: "panelIdSetActive", payload: {type: panel.type}});
			panel.exile();
		}

		// reload
		// fill content first; empties can fill any remaining space
		const toReload = (saveSlotStateActive.ps || [])
			.filter(Boolean)
			// Drop empty panels
			.filter(saved => saved.t !== PANEL_TYP_EMPTY)
			// Drop panels which would be outside the visible area
			.filter(saved => (saved.x < this.width) && (saved.y < this.height));
		for (const saved of toReload) {
			const panel = await Panel.fromSavedState(this, saved);
			if (!panel) continue;

			this.panels[panel.id] = panel;
			this.fireBoardEvent({type: "panelIdSetActive", payload: {type: panel.type}});
		}

		if (isPreserveEmbedsOnSaveSlotChange) {
			this._cacheElements.doRestoreElementsForSaveSlot({
				idSaveSlot: this._idSaveSlotActive,
				cacheableElementsInfos: Object.values(this.panels)
					.map(p => p.getCacheableElementsInfo())
					.flat(),
			});
		}

		this.doCheckFillSpaces();

		this.sideMenu.setSaveSlotInfo({
			idSaveSlotActive: this._idSaveSlotActive,
			saveSlotStates: this._saveSlotStates,
		});
	}

	/* -------------------------------------------- */

	async pDoLoadState () {
		let toLoad;
		try {
			toLoad = await StorageUtil.pGet(VeCt.STORAGE_DMSCREEN);
		} catch (e) {
			JqueryUtil.doToast({
				content: `Error when loading DM screen! Purged saved data. ${VeCt.STR_SEE_CONSOLE}`,
				type: "danger",
			});
			await StorageUtil.pRemove(VeCt.STORAGE_DMSCREEN);
			setTimeout(() => { throw e; });
			return;
		}

		try {
			await this.pDoLoadStateFrom(toLoad);
		} catch (e) {
			await this._pDoLoadState_pHandleError({toLoad, e});
		}
	}

	async _pDoLoadState_pHandleError ({toLoad, e}) {
		setTimeout(() => { throw e; });

		const {eleModalInner, doClose, pGetResolved} = UiUtil.getShowModal({
			isMinHeight0: true,
			isHeaderBorder: true,
			title: "Failed to Load",
			isPermanent: true,
		});

		const handleClickDownload = () => {
			DataUtil.userDownload(`dm-screen`, toLoad, {fileType: "dm-screen"});
		};

		const btnDownload = veT`<button class="ve-btn ve-btn-sm ve-btn-primary ve-mr-2">Download Save</button>`
			.vee.onn("click", () => handleClickDownload());

		const handleClickPurge = async () => {
			if (!await InputUiUtil.pGetUserBoolean({title: "Purge", htmlDescription: "Are you sure?", textYes: "Yes", textNo: "Cancel"})) return;
			await StorageUtil.pRemove(VeCt.STORAGE_DMSCREEN);
			doClose(true);
		};

		const btnPurge = veT`<button class="ve-btn ve-btn-sm ve-btn-danger">Purge and Continue</button>`
			.vee.onn("click", () => handleClickPurge());

		const txtDownload = veT`<b class="ve-clickable">download a backup of your save</b>`
			.vee.onn("click", () => handleClickDownload());
		const txtPurge = veT`<span class="ve-clickable text-danger">purge the save</span>`
			.vee.onn("click", () => handleClickPurge());

		veT(eleModalInner)`
			<div class="ve-py-2 ve-w-100 ve-h-100">
				<div class="ve-mb-2">
					<b>Failed to load saved DM Screen.</b> ${VeCt.STR_SEE_CONSOLE}
				</div>

				<div class="ve-mb-2">
					Please ${txtDownload}, then ${txtPurge} if you wish to continue.
				</div>

				<div class="ve-mb-4">
					If you suspect this is the <span class="ve-help" title="Spoiler: it always is">result of a bug</span>, or need help recovering lost data, drop past our <a href="https://discord.gg/5etools" target="_blank" rel="noopener noreferrer">Discord</a>.
				</div>

				<div class="ve-flex-h-right ve-flex-v-center">
					${btnDownload}
					${btnPurge}
				</div>
			</div>
		`;

		return pGetResolved();
	}

	/* -------------------------------------------- */

	async pDoResetAll ({isRetainWidthHeight = false, width = null, height = null} = {}) {
		const nxt = this.getSaveableState();
		Object.keys(nxt.sls || {})
			.forEach(id => {
				// Skip resetting the active slot, as the reset below will handle this
				if (id === nxt.sla) return;
				nxt.sls[id] = {};
			});
		await this.pDoLoadStateFrom(nxt);

		this.doReset({isRetainWidthHeight, width, height});
	}

	/**
	 * @param {?boolean} isRetainWidthHeight
	 * @param {?number} width
	 * @param {?number} height
	 */
	doReset ({isRetainWidthHeight = false, width = null, height = null} = {}) {
		this.exiledPanels.forEach(p => p.destroy());
		this.exiledPanels = [];
		this.sideMenu.doUpdateHistory();
		Object.values(this.panels).forEach(p => p.destroy());
		this.panels = {};

		width ??= isRetainWidthHeight ? this.getWidth() : this.getInitialWidth();
		height ??= isRetainWidthHeight ? this.getHeight() : this.getInitialHeight();
		this.setDimensions(width, height);
	}

	/* -------------------------------------------- */

	setHoveringButton (panel) {
		this.resetHoveringButton(panel);
		panel.btnAddInner.vee.addClass("faux-hover");
	}

	resetHoveringButton (panel) {
		Object.values(this.panels).forEach(p => {
			if (panel && panel.id === p.id) return;
			p.btnAddInner.vee.removeClass("faux-hover");
		});
	}

	addPanel (panel) {
		this.panels[panel.id] = panel;
		panel.render();
		this.fireBoardEvent({type: "panelIdSetActive", payload: {type: panel.type}});
		this.doSaveStateDebounced();
	}

	setAllControlBarsVisible (val) {
		Object.values(this.panels).forEach(p => p.setMoveModeActive(val));
	}

	doBindAlertOnNavigation () {
		if (this.isAlertOnNav) return;
		this.isAlertOnNav = true;
		window.addEventListener("beforeunload", evt => {
			const message = `Temporary data and connections will be lost.`;
			(evt || window.event).message = message;
			return message;
		});
	}

	getPanelsByType (type) {
		return Object.values(this.panels).filter(p => p.tabDatas.length && p.tabDatas.find(td => td.type === type));
	}

	doMassPopulate_Entities (
		{
			page,
			entities,
			isTabs,

			panel = null,
		},
	) {
		if (!entities?.length) {
			return JqueryUtil.doToast({type: "warning", content: `Nothing to add!`});
		}

		if (panel) {
			return this._doMassPopulate_Entities_forPanel({
				page,
				entities,
				isTabs,
				panel,
			});
		}

		let panels = this.getPanels(0, 0, this.width, this.height);

		if (isTabs) {
			const panel = panels.find(it => it.getEmpty());
			return this._doMassPopulate_Entities_forPanel({
				page,
				entities,
				isTabs,
				panel,
			});
		}

		const availablePanels = panels.filter(it => it.getEmpty()).length;

		// Prefer to increase the number of panels on the vertical axis
		if (availablePanels < entities.length) {
			const diff = entities.length - availablePanels;
			const heightIncrease = Math.ceil(diff / this.width);
			this.setDimensions(this.width, this.height + heightIncrease);
			panels = this.getPanels(0, 0, this.width, this.height);
		}

		let ixEntity = 0;
		for (const panel of panels) {
			if (!panel.getEmpty()) continue;

			const ent = entities[ixEntity];
			const hash = UrlUtil.URL_TO_HASH_BUILDER[page](ent);
			this._doMassPopulate_Entities_doPopulatePanel({page, ent, panel, hash});

			++ixEntity;

			if (ixEntity >= entities.length) break;
		}
	}

	_doMassPopulate_Entities_doPopulatePanel ({page, ent, panel, hash}) {
		ent?._scaledCr
			? panel.doPopulate_StatsScaledCr(page, ent.source, hash, ent._scaledCr)
			: panel.doPopulate_Stats(page, ent.source, hash);
	}

	_doMassPopulate_Entities_forPanel (
		{
			page,
			entities,
			panel,
		},
	) {
		panel.setIsTabs(true);

		entities.forEach(ent => {
			const hash = UrlUtil.URL_TO_HASH_BUILDER[page](ent);
			this._doMassPopulate_Entities_doPopulatePanel({page, ent, panel, hash});
		});
	}

	/**
	 * @param {string} opts.type
	 * @param {?object} opts.payload
	 */
	fireBoardEvent (opts) {
		const {type} = opts;

		if (!type) throw new Error(`Event type must be specified!`);

		Object.values(this.panels)
			.forEach(panel => this._fireBoardEvent_panel({panel, ...opts}));

		this.exiledPanels
			.forEach(panel => this._fireBoardEvent_panel({panel, ...opts}));
	}

	_fireBoardEvent_panel ({panel, ...opts}) {
		panel.fireBoardEvent({...opts});
	}
}

class AddMenu {
	constructor () {
		this.tabs = [];

		this._eleMenuInner = null;
		this.tabView = null;
		this.activeTab = null;
		this.pnl = null; // panel where an add button was last clicked

		this._doClose = null;
	}

	addTab (tab) {
		tab.setMenu(this);
		this.tabs.push(tab);
		return this;
	}

	getTab ({label}) {
		return this.tabs.find(it => it.label === label);
	}

	async pSetActiveTab (tab) {
		veE(document.activeElement).vee.blur();

		this._eleMenuInner.vee.findAll(`.panel-addmenu-tab-head`).forEach(ele => ele.vee.attr(`active`, false));
		if (this.activeTab) this.activeTab.getEleTab().vee.detach();
		this.activeTab = tab;
		this.tabView.vee.appends(tab.getEleTab());
		tab.eleHead.vee.attr(`active`, true);

		if (tab.pDoTransitionActive) await tab.pDoTransitionActive();
	}

	hasActiveTab () {
		return this.activeTab !== null;
	}

	getActiveTab () {
		return this.activeTab;
	}

	async pSetFirstTabActive () {
		const t = this.tabs[0];
		await this.pSetActiveTab(t);
	}

	async pRender () {
		if (this._eleMenuInner) return;

		this._eleMenuInner = veT`<div class="ve-flex-col ve-w-100 ve-h-100">`;
		const tabBar = veT`<div class="panel-addmenu-bar"></div>`.vee.appendTo(this._eleMenuInner);
		this.tabView = veT`<div class="panel-addmenu-view"></div>`.vee.appendTo(this._eleMenuInner);

		await this.tabs.pMap(t => t.pRender());

		this.tabs
			.forEach(t => {
				t.eleHead = veT`<button class="ve-btn ve-btn-default panel-addmenu-tab-head">${t.label}</button>`.vee.appendTo(tabBar);
				veT`<div class="panel-addmenu-tab-body"></div>`.vee.appendTo(tabBar);
				t.eleHead.vee.onn("click", () => this.pSetActiveTab(t));
			});
	}

	setPanel (pnl) {
		this.pnl = pnl;
	}

	doClose () {
		if (this._doClose) this._doClose();
	}

	doOpen () {
		const {eleModalInner, doClose} = UiUtil.getShowModal({
			cbClose: () => {
				this._eleMenuInner.vee.detach();

				// undo entering "tabbed mode" if we close without adding a tab
				if (this.pnl.isTabs && this.pnl.tabDatas.filter(it => !it.isDeleted).length === 1) {
					this.pnl.setIsTabs(false);
				}
			},
			zIndex: VeCt.Z_INDEX_BENEATH_HOVER,
		});
		this._doClose = doClose;
		eleModalInner.vee.appends(this._eleMenuInner);
	}
}

class AddMenuTab {
	constructor ({board, label}) {
		this._board = board;
		this.label = label;

		this.eleTab = null;
		this.menu = null;
	}

	getEleTab () {
		return this.eleTab;
	}

	setMenu (menu) {
		this.menu = menu;
	}
}

class AddMenuVideoTab extends AddMenuTab {
	constructor ({...opts}) {
		super({...opts, label: "Embed"});
		this.tabId = "embed";
	}

	pRender () {
		if (this.eleTab) return;

		const iptUrlYT = veT`<input class="ve-form-control" placeholder="Paste YouTube URL">`
			.vee.onn("keydown", evt => {
				if (evt.key === "Enter") btnAddYT.vee.trigger("click");
			});
		const btnAddYT = veT`<button class="ve-btn ve-btn-primary ve-btn-sm">Embed</button>`
			.vee.onn("click", async () => {
				let url;
				try {
					url = new URL(iptUrlYT.vee.val().trim());
				} catch (e) {
					setTimeout(() => { throw e; });
					JqueryUtil.doToast({
						content: `Please enter a valid URL!`,
						type: "danger",
					});
					return;
				}

				if (!url.searchParams.get("v")) {
					JqueryUtil.doToast({
						content: `Please enter a YouTube URL with a "v=..." parameter!`,
						type: "danger",
					});
					return;
				}

				const pcm = new PanelContentManager_YouTube({board: this._board, panel: this.menu.pnl});
				if (url.searchParams.get("list")) {
					// FIXME embedding playlists *should* be possible; what gives?
					// await pcm.pDoPopulate({state: {u: `https://www.youtube.com/embed/${url.searchParams.get("v")}?list=${url.searchParams.get("list")}`}});
					await pcm.pDoPopulate({state: {u: `https://www.youtube.com/embed/${url.searchParams.get("v")}`}});
				} else {
					await pcm.pDoPopulate({state: {u: `https://www.youtube.com/embed/${url.searchParams.get("v")}`}});
				}

				iptUrlYT.vee.val("");
				this.menu.doClose();
			});

		const getTwitchUrlRegexMatch = (url) => {
			return /https?:\/\/(?:www\.)?twitch\.tv\/(?<channel>.*?)(?:\?.*$|$)/.exec(url);
		};
		const iptUrlTwitch = veT`<input class="ve-form-control" placeholder="Paste Twitch URL">`
			.vee.onn("keydown", evt => {
				if (evt.key === "Enter") btnAddTwitch.vee.trigger("click");
			});
		const btnAddTwitch = veT`<button class="ve-btn ve-btn-primary ve-btn-sm">Embed</button>`
			.vee.onn("click", async () => {
				const url = iptUrlTwitch.vee.val().trim();

				const mTwitchUrl = getTwitchUrlRegexMatch(url);
				if (!url || !mTwitchUrl) {
					JqueryUtil.doToast({
						content: `Please enter a URL of the form: "https://www.twitch.tv/XXXXXX"`,
						type: "danger",
					});
					return;
				}

				const pcm = new PanelContentManager_Twitch({board: this._board, panel: this.menu.pnl});
				await pcm.pDoPopulate({state: {u: `http://player.twitch.tv/?channel=${mTwitchUrl.groups.channel}`}});

				iptUrlTwitch.vee.val("");
				this.menu.doClose();
			});

		const btnAddTwitchChat = veT`<button class="ve-btn ve-btn-primary ve-btn-sm">Embed Chat</button>`
			.vee.onn("click", async () => {
				const url = iptUrlTwitch.vee.val().trim();

				const mTwitchUrl = getTwitchUrlRegexMatch(url);
				if (!url || !mTwitchUrl) {
					JqueryUtil.doToast({
						content: `Please enter a URL of the form: "https://www.twitch.tv/XXXXXX"`,
						type: "danger",
					});
					return;
				}

				const pcm = new PanelContentManager_TwitchChat({board: this._board, panel: this.menu.pnl});
				await pcm.pDoPopulate({state: {u: `https://www.twitch.tv/embed/${mTwitchUrl.groups.channel}/chat`}});

				iptUrlTwitch.vee.val("");
				this.menu.doClose();
			});

		const iptUrlGeneric = veT`<input class="ve-form-control" placeholder="Paste any URL">`
			.vee.onn("keydown", evt => {
				if (evt.key === "Enter") iptUrlGeneric.vee.trigger("click");
			});
		const btnAddGeneric = veT`<button class="ve-btn ve-btn-primary ve-btn-sm">Embed</button>`
			.vee.onn("click", async () => {
				const url = iptUrlGeneric.vee.val().trim();

				if (!url) {
					JqueryUtil.doToast({
						content: `Please enter a URL!`,
						type: "danger",
					});
					return;
				}

				const pcm = new PanelContentManager_GenericEmbed({board: this._board, panel: this.menu.pnl});
				await pcm.pDoPopulate({state: {u: url}});

				iptUrlGeneric.vee.val("");
				this.menu.doClose();
			});

		this.eleTab = veT`<div class="ve-ui-search__wrp-output underline-tabs" id="${this.tabId}">
			<div class="ve-ui-modal__row">${iptUrlYT}${btnAddYT}</div>
			<div class="ve-ui-modal__row">${iptUrlTwitch}${btnAddTwitch}${btnAddTwitchChat}</div>
			<div class="ve-ui-modal__row">${iptUrlGeneric}${btnAddGeneric}</div>
		</div>`;
	}
}

class AddMenuImageTab extends AddMenuTab {
	constructor ({...opts}) {
		super({...opts, label: "Image"});
		this.tabId = "image";
	}

	async pRender () {
		if (!this.eleTab) {
			const eleTab = veT`<div class="ve-ui-search__wrp-output underline-tabs" id="${this.tabId}"></div>`;

			// region Imgur
			const wrpImgur = veT`<div class="ve-ui-modal__row"></div>`.vee.appendTo(eleTab);
			veT`<span>Imgur (Anonymous Upload) <i class="ve-muted">(accepts <a href="https://help.imgur.com/hc/en-us/articles/26511665959579-What-files-can-I-upload-Is-there-a-size-limit" target="_blank" rel="noopener noreferrer">imgur-friendly formats</a>)</i></span>`.vee.appendTo(wrpImgur);
			const iptFile = veT`<input type="file" class="hidden">`
				.vee.onn("change", (evt) => {
					const input = evt.target;
					const reader = new FileReader();
					reader.onload = async () => {
						const postBody = new URLSearchParams({
							image: reader.result.replace(/.*,/, ""),
							type: "base64",
						});

						let response;
						let data;
						try {
							response = await fetch("https://api.imgur.com/3/image", {
								method: "POST",
								headers: {
									"Accept": "application/json",
									"Authorization": `Client-ID ${IMGUR_CLIENT_ID}`,
									"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
								},
								body: postBody,
							});

							data = await response.json();
						} catch (error) {
							JqueryUtil.doToast({
								content: `Failed to upload: ${error.message || "Unknown error"}`,
								type: "danger",
							});

							this.menu.pnl.doPopulate_Empty(ix);
						}

						if (!response || !response.ok) {
							throw new Error(data?.data?.error || "Unknown error");
						}

						this.menu.pnl.doPopulate_Image(data.data.link, ix);
					};
					reader.onerror = () => {
						this.menu.pnl.doPopulate_Empty(ix);
					};
					reader.fileName = input.files[0].name;
					reader.readAsDataURL(input.files[0]);
					const ix = this.menu.pnl.doPopulate_Loading("Uploading"); // will be null if not in tabbed mode
					this.menu.doClose();
				})
				.vee.appendTo(eleTab);
			const btnAdd = veT`<button class="ve-btn ve-btn-primary ve-btn-sm">Upload</button>`
				.vee.appendTo(wrpImgur)
				.vee.onn("click", () => {
					iptFile.vee.trigger("click");
				});
			// endregion

			// region URL
			const wrpUtl = veT`<div class="ve-ui-modal__row"></div>`.vee.appendTo(eleTab);
			const iptUrl = veT`<input class="ve-form-control" placeholder="Paste image URL">`
				.vee.onn("keydown", (e) => {
					if (e.key === "Enter") btnAddUrl.vee.trigger("click");
				})
				.vee.appendTo(wrpUtl);
			const btnAddUrl = veT`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`.vee.appendTo(wrpUtl);
			btnAddUrl.vee.onn("click", () => {
				let url = iptUrl.vee.val().trim();
				if (url) {
					this.menu.pnl.doPopulate_Image(url);
					iptUrl.vee.val("");
					this.menu.doClose();
				} else {
					JqueryUtil.doToast({
						content: `Please enter a URL!`,
						type: "danger",
					});
				}
			});
			// endregion

			veT`<hr class="ve-hr-2">`.vee.appendTo(eleTab);

			// region Adventure dynamic viewer
			const btnSelectAdventure = veT`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`
				.vee.onn("click", () => DmMapper.pHandleMenuButtonClick(this.menu));

			veT`<div class="ve-ui-modal__row">
				<div>Adventure/Book Map Dynamic Viewer</div>
				${btnSelectAdventure}
			</div>`.vee.appendTo(eleTab);
			// endregion

			this.eleTab = eleTab;
		}
	}
}

class AddMenuSpecialTab extends AddMenuTab {
	constructor ({...opts}) {
		super({...opts, label: "Special"});
		this.tabId = "special";
	}

	async pRender () {
		if (!this.eleTab) {
			const eleTab = veT`<div class="ve-ui-search__wrp-output underline-tabs ve-overflow-y-auto ve-pr-1" id="${this.tabId}"></div>`;

			const wrpRoller = veT`<div class="ve-ui-modal__row"><span>Dice Roller <i class="ve-muted">(pins the existing dice roller to a panel)</i></span></div>`.vee.appendTo(eleTab);
			const btnRoller = veT`<button class="ve-btn ve-btn-primary ve-btn-sm">Pin</button>`.vee.appendTo(wrpRoller);
			btnRoller.vee.onn("click", () => {
				Renderer.dice.bindDmScreenPanel(this.menu.pnl);
				this.menu.doClose();
			});
			veT`<hr class="ve-hr-2">`.vee.appendTo(eleTab);

			const btnTracker = veT`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`
				.vee.onn("click", async () => {
					const pcm = new PanelContentManager_InitiativeTracker({board: this._board, panel: this.menu.pnl});
					await pcm.pDoPopulate();
					this.menu.doClose();
				});

			veT`<div class="ve-ui-modal__row">
			<span>Initiative Tracker</span>
			${btnTracker}
			</div>`.vee.appendTo(eleTab);

			const btnTrackerCreatureViewer = veT`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`
				.vee.onn("click", async () => {
					const pcm = new PanelContentManager_InitiativeTrackerCreatureViewer({board: this._board, panel: this.menu.pnl});
					await pcm.pDoPopulate();
					this.menu.doClose();
				});

			veT`<div class="ve-ui-modal__row">
			<span>Initiative Tracker Creature Viewer</span>
			${btnTrackerCreatureViewer}
			</div>`.vee.appendTo(eleTab);

			const btnPlayerTrackerV1 = veT`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`
				.vee.onn("click", async () => {
					const pcm = new PanelContentManager_InitiativeTrackerPlayerViewV1({board: this._board, panel: this.menu.pnl});
					await pcm.pDoPopulate();
					this.menu.doClose();
				});

			veT`<div class="ve-ui-modal__row">
			<span>Initiative Tracker Player View (Standard)</span>
			${btnPlayerTrackerV1}
			</div>`.vee.appendTo(eleTab);

			const btnPlayerTrackerV0 = veT`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`
				.vee.onn("click", async () => {
					const pcm = new PanelContentManager_InitiativeTrackerPlayerViewV0({board: this._board, panel: this.menu.pnl});
					await pcm.pDoPopulate();
					this.menu.doClose();
				});

			veT`<div class="ve-ui-modal__row">
			<span>Initiative Tracker Player View (Manual/Legacy)</span>
			${btnPlayerTrackerV0}
			</div>`.vee.appendTo(eleTab);

			veT`<hr class="ve-hr-2">`.vee.appendTo(eleTab);

			const btnSublist = veT`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`
				.vee.onn("click", async evt => {
					await this.menu.pnl.pDoMassPopulate_Entities(evt);
					this.menu.doClose();
				});

			veT`<div class="ve-ui-modal__row">
			<span title="Including, but not limited to, a Bestiary Encounter.">Pinned List Entries</span>
			${btnSublist}
			</div>`.vee.appendTo(eleTab);

			veT`<hr class="ve-hr-2">`.vee.appendTo(eleTab);

			const btnSwitchToEmbedTag = veT`<button class="ve-btn ve-btn-default ve-btn-xxs">embed</button>`
				.vee.onn("click", async () => {
					await this.menu.pSetActiveTab(this.menu.getTab({label: "Embed"}));
				});

			const wrpText = veT`<div class="ve-ui-modal__row"><span>Basic Text Box <i class="ve-muted">(for a feature-rich editor, ${btnSwitchToEmbedTag} a Google Doc or similar)</i></span></div>`.vee.appendTo(eleTab);
			const btnText = veT`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`.vee.appendTo(wrpText);
			btnText.vee.onn("click", async () => {
				const pcm = new PanelContentManager_NoteBox({board: this._board, panel: this.menu.pnl});
				await pcm.pDoPopulate();
				this.menu.doClose();
			});
			veT`<hr class="ve-hr-2">`.vee.appendTo(eleTab);

			const wrpUnitConverter = veT`<div class="ve-ui-modal__row"><span>Unit Converter</span></div>`.vee.appendTo(eleTab);
			const btnUnitConverter = veT`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`.vee.appendTo(wrpUnitConverter);
			btnUnitConverter.vee.onn("click", async () => {
				const pcm = new PanelContentManager_UnitConverter({board: this._board, panel: this.menu.pnl});
				await pcm.pDoPopulate();
				this.menu.doClose();
			});

			const wrpMoneyConverter = veT`<div class="ve-ui-modal__row"><span>Coin Converter</span></div>`.vee.appendTo(eleTab);
			const btnMoneyConverter = veT`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`.vee.appendTo(wrpMoneyConverter);
			btnMoneyConverter.vee.onn("click", async () => {
				const pcm = new PanelContentManager_MoneyConverter({board: this._board, panel: this.menu.pnl});
				await pcm.pDoPopulate();
				this.menu.doClose();
			});

			const wrpCounter = veT`<div class="ve-ui-modal__row"><span>Counter</span></div>`.vee.appendTo(eleTab);
			const btnCounter = veT`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`.vee.appendTo(wrpCounter);
			btnCounter.vee.onn("click", async () => {
				const pcm = new PanelContentManager_Counter({board: this._board, panel: this.menu.pnl});
				await pcm.pDoPopulate();
				this.menu.doClose();
			});

			veT`<hr class="ve-hr-2">`.vee.appendTo(eleTab);

			const wrpTimeTracker = veT`<div class="ve-ui-modal__row"><span>In-Game Clock/Calendar</span></div>`.vee.appendTo(eleTab);
			const btnTimeTracker = veT`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`.vee.appendTo(wrpTimeTracker);
			btnTimeTracker.vee.onn("click", async () => {
				const pcm = new PanelContentManager_TimeTracker({board: this._board, panel: this.menu.pnl});
				await pcm.pDoPopulate();
				this.menu.doClose();
			});

			veT`<hr class="ve-hr-2">`.vee.appendTo(eleTab);

			const wrpBlank = veT`<div class="ve-ui-modal__row"><span class="ve-help" title="For those who don't like plus signs.">Blank Space</span></div>`.vee.appendTo(eleTab);
			veT`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`
				.vee.onn("click", () => {
					this.menu.pnl.doPopulate_Blank();
					this.menu.doClose();
				})
				.vee.appendTo(wrpBlank);

			this.eleTab = eleTab;
		}
	}
}

class AddMenuSearchTab extends AddMenuTab {
	static _getTitle (subType) {
		switch (subType) {
			case "content": return "Content";
			case "rule": return `Rules <span class="ve-small ve-muted">(5e/2014)</span>`;
			case "adventure": return "Adventures";
			case "book": return "Books";
			default: throw new Error(`Unhandled search tab subtype: "${subType}"`);
		}
	}

	/**
	 * @param {?object} indexes
	 * @param {?string} subType
	 * @param {string} tabId
	 * @param {?object} adventureOrBookIdToSource
	 * @param opts
	 */
	constructor ({indexes, subType = "content", tabId, adventureOrBookIdToSource = null, ...opts}) {
		super({...opts, label: AddMenuSearchTab._getTitle(subType)});
		this.tabId = tabId;
		this.indexes = indexes;
		this.cat = "ALL";
		this.subType = subType;
		this._adventureOrBookIdToSource = adventureOrBookIdToSource;

		this.selCat = null;
		this.iptSearch = null;
		this.wrpResults = null;
		this.showMsgIpt = null;
		this._pDoSearch = null;
		this._ptrRows = null;
	}

	_getSearchOptions () {
		switch (this.subType) {
			case "content": return {
				fields: {
					n: {boost: 5, expand: true},
					s: {expand: true},
				},
				bool: "AND",
				expand: true,
			};
			case "rule": return {
				fields: {
					h: {boost: 5, expand: true},
					s: {expand: true},
				},
				bool: "AND",
				expand: true,
			};
			case "adventure":
			case "book": return {
				fields: {
					c: {boost: 5, expand: true},
					n: {expand: true},
				},
				bool: "AND",
				expand: true,
			};
			default: throw new Error(`Unhandled search tab subtype: "${this.subType}"`);
		}
	}

	_getRow (r) {
		switch (this.subType) {
			case "content": return veT`
				<div class="ve-ui-search__row" tabindex="0">
					<span><span class="ve-muted">${r.doc.cf}</span> ${r.doc.n}</span>
					<span>${r.doc.s ? `<i title="${Parser.sourceJsonToFull(r.doc.s)}">${Parser.sourceJsonToAbv(r.doc.s)}${r.doc.p ? ` p${r.doc.p}` : ""}</i>` : ""}</span>
				</div>
			`;
			case "rule": return veT`
				<div class="ve-ui-search__row" tabindex="0">
					<span>${r.doc.h}</span>
					<span><i>${r.doc.n}, ${r.doc.s}</i></span>
				</div>
			`;
			case "adventure":
			case "book": return veT`
				<div class="ve-ui-search__row" tabindex="0">
					<span>${r.doc.c}</span>
					<span><i>${r.doc.n}${r.doc.o ? `, ${r.doc.o}` : ""}</i></span>
				</div>
			`;
			default: throw new Error(`Unhandled search tab subtype: "${this.subType}"`);
		}
	}

	_getAllTitle () {
		switch (this.subType) {
			case "content": return "All Categories";
			case "rule": return "All Categories";
			case "adventure": return "All Adventures";
			case "book": return "All Books";
			default: throw new Error(`Unhandled search tab subtype: "${this.subType}"`);
		}
	}

	_getCatOptionText (key) {
		switch (this.subType) {
			case "content": return key;
			case "rule": return key;
			case "adventure":
			case "book": {
				key = (this._adventureOrBookIdToSource[this.subType] || {})[key] || key; // map the key (an adventure/book id) to its source if possible
				return Parser.sourceJsonToFull(key);
			}
			default: throw new Error(`Unhandled search tab subtype: "${this.subType}"`);
		}
	}

	async pRender () {
		const flags = {
			doClickFirst: false,
			isWait: false,
		};

		this.showMsgIpt = () => {
			flags.isWait = true;
			this.wrpResults.vee.empty().vee.appends(SearchWidget.getSearchEnter());
		};

		const showMsgDots = () => {
			this.wrpResults.vee.empty().vee.appends(SearchWidget.getSearchLoading());
		};

		const showNoResults = () => {
			flags.isWait = true;
			this.wrpResults.vee.empty().vee.appends(SearchWidget.getSearchEnter());
		};

		this._ptrRows = {_: []};

		this._pDoSearch = async () => {
			const searchTerm = this.iptSearch.vee.val().trim();

			const searchOptions = this._getSearchOptions();
			const index = this.indexes[this.cat];
			let results = index.search(searchTerm, searchOptions);

			if (this.subType === "content") {
				results = await OmnisearchBacking.pGetFilteredResults(results, {searchTerm});
			}

			const resultCount = results.length ? results.length : index.documentStore.length;
			const toProcess = results.length ? results : Object.values(index.documentStore.docs).slice(0, UiUtil.SEARCH_RESULTS_CAP).map(it => ({doc: it}));

			this.wrpResults.vee.empty();
			this._ptrRows._ = [];

			if (toProcess.length) {
				const handleClick = (r) => {
					switch (this.subType) {
						case "content": {
							const page = UrlUtil.categoryToHoverPage(r.doc.c);
							const source = r.doc.s;
							const hash = r.doc.u;

							this.menu.pnl.doPopulate_Stats(page, source, hash);
							break;
						}
						case "rule": {
							this.menu.pnl.doPopulate_Rules(r.doc.b, r.doc.p, r.doc.h);
							break;
						}
						case "adventure": {
							this.menu.pnl.doPopulate_Adventures(r.doc.a, r.doc.p);
							break;
						}
						case "book": {
							this.menu.pnl.doPopulate_Books(r.doc.b, r.doc.p);
							break;
						}
						default: throw new Error(`Unhandled search tab subtype: "${this.subType}"`);
					}
					this.menu.doClose();
				};

				if (flags.doClickFirst) {
					handleClick(toProcess[0]);
					flags.doClickFirst = false;
					return;
				}

				const res = toProcess.slice(0, UiUtil.SEARCH_RESULTS_CAP);

				res.forEach(r => {
					const row = this._getRow(r).vee.appendTo(this.wrpResults);
					SearchWidget.bindRowHandlers({result: r, row, ptrRows: this._ptrRows, pFnHandleClick: handleClick, iptSearch: this.iptSearch});
					this._ptrRows._.push(row);
				});

				if (resultCount > UiUtil.SEARCH_RESULTS_CAP) {
					const diff = resultCount - UiUtil.SEARCH_RESULTS_CAP;
					this.wrpResults.vee.appends(`<div class="ve-ui-search__row ve-ui-search__row--readonly">...${diff} more result${diff === 1 ? " was" : "s were"} hidden. Refine your search!</div>`);
				}
			} else {
				if (!searchTerm.trim()) this.showMsgIpt();
				else showNoResults();
			}
		};

		if (!this.eleTab) {
			const eleTab = veT`<div class="ve-ui-search__wrp-output" id="${this.tabId}"></div>`;
			const wrpCtrls = veT`<div class="ve-ui-search__wrp-controls ve-ui-search__wrp-controls--in-tabs"></div>`.vee.appendTo(eleTab);

			const selCat = veT`
				<select class="ve-form-control ve-ui-search__sel-category">
					<option value="ALL">${this._getAllTitle()}</option>
				</select>
			`.vee.appendTo(wrpCtrls).vee.toggle(Object.keys(this.indexes).length !== 1);
			Object.keys(this.indexes).sort().filter(it => it !== "ALL").forEach(it => {
				selCat.vee.appends(`<option value="${it}">${this._getCatOptionText(it)}</option>`);
			});
			selCat.vee.onn("change", async () => {
				this.cat = selCat.vee.val();
				await this._pDoSearch();
			});

			const iptSearch = veT`<input class="ve-ui-search__ipt-search search ve-form-control" placeholder="Search...">`
				.vee.disableSpellcheck()
				.vee.appendTo(wrpCtrls);
			const wrpResults = veT`<div class="ve-ui-search__wrp-results"></div>`.vee.appendTo(eleTab);

			SearchWidget.bindAutoSearch(iptSearch, {
				flags,
				pFnSearch: this._pDoSearch,
				fnShowWait: showMsgDots,
				ptrRows: this._ptrRows,
			});

			this.eleTab = eleTab;
			this.selCat = selCat;
			this.iptSearch = iptSearch;
			this.wrpResults = wrpResults;

			await this._pDoSearch();
		}
	}

	async pDoTransitionActive () {
		this.iptSearch.vee.val("").vee.focus();
		if (this._pDoSearch) await this._pDoSearch();
	}
}

window.addEventListener("load", () => {
	// expose it for dbg purposes
	window.DM_SCREEN = new Board();
	Renderer.hover.bindDmScreen(window.DM_SCREEN);
	window.DM_SCREEN.pInitialise()
		.catch(err => {
			JqueryUtil.doToast({content: `Failed to load with error "${err.message}". ${VeCt.STR_SEE_CONSOLE}`, type: "danger"});
			veEs(`.dm-screen-loading .initial-message`)?.vee.txt("Failed!");
			setTimeout(() => { throw err; });
		});
});
