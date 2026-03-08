import {
	PANEL_TYP_EMPTY,
	PANEL_TYP_STATS,
	PANEL_TYP_ROLLBOX,
	PANEL_TYP_RULES,
	PANEL_TYP_CREATURE_SCALED_CR,
	PANEL_TYP_CREATURE_SCALED_SPELL_SUMMON,
	PANEL_TYP_CREATURE_SCALED_CLASS_SUMMON,
	PANEL_TYP_TUBE,
	PANEL_TYP_TWITCH,
	PANEL_TYP_TWITCH_CHAT,
	PANEL_TYP_ADVENTURES,
	PANEL_TYP_BOOKS,
	PANEL_TYP_IMAGE,
	PANEL_TYP_GENERIC_EMBED,
	PANEL_TYP_ERROR,
	PANEL_TYP_BLANK,
} from "./dmscreen/dmscreen-consts.js";
import {DmMapper} from "./dmscreen/dmscreen-mapper.js";
import {TimerTrackerMoonSpriteLoader} from "./dmscreen/dmscreen-timetracker.js";
import {
	PanelContentManager_Counter,
	PanelContentManager_InitiativeTracker,
	PanelContentManager_InitiativeTrackerCreatureViewer,
	PanelContentManager_InitiativeTrackerPlayerViewV0,
	PanelContentManager_InitiativeTrackerPlayerViewV1,
	PanelContentManager_MoneyConverter,
	PanelContentManager_NoteBox, PanelContentManager_TimeTracker,
	PanelContentManager_UnitConverter,
	PanelContentManagerFactory,
} from "./dmscreen/dmscreen-panels.js";

import {OmnisearchBacking} from "./omnisearch/omnisearch-backing.js";
import {Panzoom} from "./utils-ui/utils-ui-panzoom.js";
import {DmScreenExiledPanelJoystickMenu, DmScreenJoystickMenu} from "./dmscreen/dmscreen-joystickmenu.js";

const TITLE_LOADING = "Loading...";

class Board {
	constructor () {
		this.panels = {};
		this.exiledPanels = [];
		this.eleScreen = es(`.dm-screen`);
		this.width = this.getInitialWidth();
		this.height = this.getInitialHeight();
		this.sideMenu = new SideMenu(this);
		this.menu = new AddMenu();
		this.isFullscreen = false;
		this.isLocked = false;
		this.isAlertOnNav = false;

		this.nextId = 1;
		this.hoveringPanel = null;
		this.availContent = {};
		this.availRules = {};
		this.availAdventures = {};
		this.availBooks = {};

		this.cbConfirmTabClose = null;
		this.btnFullscreen = null;
		this.btnLockPanels = null;

		this._pDoSaveStateDebounced = MiscUtil.debounce(() => StorageUtil.pSet(VeCt.STORAGE_DMSCREEN, this.getSaveableState()), 25);
	}

	getInitialWidth () {
		const scW = this.eleScreen.outerWidthe();
		return Math.floor(scW / 360);
	}

	getInitialHeight () {
		const scH = this.eleScreen.outerHeighte();
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

	getConfirmTabClose () {
		return this.cbConfirmTabClose == null ? false : this.cbConfirmTabClose.prop("checked");
	}

	setDimensions (width, height) {
		const oldWidth = this.width;
		const oldHeight = this.height;
		if (width) this.width = Math.max(width, 1);
		if (height) this.height = Math.max(height, 1);
		if (!(oldWidth === width && oldHeight === height)) {
			this.doAdjustEleScreenCss();
			if (width < oldWidth || height < oldHeight) this.doCullPanels(oldWidth, oldHeight);
			this.sideMenu.doUpdateDimensions();
		}
		this.doCheckFillSpaces();
		this.eleScreen.trigger("panelResize");
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
		this.eleScreen.css({
			marginTop: this.isFullscreen ? "0px" : "3px",
		});
	}

	getPanelDimensions () {
		const w = this.eleScreen.outerWidthe();
		const h = this.eleScreen.outerHeighte();
		return {
			pxWidth: w / this.width,
			pxHeight: h / this.height,
		};
	}

	doShowLoading () {
		ee`<div class="dm-screen-loading"><span class="initial-message initial-message--large">Loading...</span></div>`.css({
			gridColumnStart: 1,
			gridColumnEnd: String(this.width + 1),
			gridRowStart: 1,
			gridRowEnd: String(this.height + 1),
		}).appendTo(this.eleScreen);
	}

	doToggleFullscreen () {
		this.isFullscreen = !this.isFullscreen;
		e_(document.body).toggleClass("is-fullscreen", this.isFullscreen);
		this.doAdjustEleScreenCss();
		this.doSaveStateDebounced();
		this.eleScreen.trigger("panelResize");
	}

	doHideLoading () {
		this.eleScreen.find(`.dm-screen-loading`).remove();
	}

	async pInitialise () {
		this.doAdjustEleScreenCss();
		this.doShowLoading();

		await Promise.all([
			PrereleaseUtil.pInit(),
			BrewUtil2.pInit(),
		]);
		await ExcludeUtil.pInitialise();

		await Promise.all([
			TimerTrackerMoonSpriteLoader.pInit(),
			this.pLoadIndex(),
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
		await this._pLoadTempData();

		e_(document.body)
			.onn("keydown", evt => {
				if (evt.key !== "Escape" || !this.isFullscreen) return;
				evt.stopPropagation();
				evt.preventDefault();
				this.doToggleFullscreen();
			})
			.onn("mousemove", evt => {
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

	async pLoadIndex () {
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
		const omniTab = new AddMenuSearchTab({board: this, indexes: this.availContent});
		const ruleTab = new AddMenuSearchTab({board: this, indexes: this.availRules, subType: "rule"});
		const adventureTab = new AddMenuSearchTab({board: this, indexes: this.availAdventures, subType: "adventure", adventureOrBookIdToSource});
		const bookTab = new AddMenuSearchTab({board: this, indexes: this.availBooks, subType: "book", adventureOrBookIdToSource});
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

		this.doHideLoading();
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

	exilePanel (id) {
		const panelK = Object.keys(this.panels).find(k => this.panels[k].id === id);
		if (!panelK) return;

		const toExile = this.panels[panelK];
		if (toExile.getEmpty()) {
			this.destroyPanel(id);
		} else {
			delete this.panels[panelK];
			this.exiledPanels.unshift(toExile);
			const toDestroy = this.exiledPanels.splice(10);
			toDestroy.forEach(p => p.destroy());
			this.sideMenu.doUpdateHistory();
		}
		this.doSaveStateDebounced();
	}

	recallPanel (panel) {
		const ix = this.exiledPanels.findIndex(p => p.id === panel.id);
		if (~ix) this.exiledPanels.splice(ix, 1);
		this.panels[panel.id] = panel;
		this.fireBoardEvent({type: "panelIdSetActive", payload: {type: panel.type}});
		this.doSaveStateDebounced();
	}

	destroyPanel (id) {
		const panelK = Object.keys(this.panels).find(k => this.panels[k].id === id);
		if (panelK) delete this.panels[panelK];
		this.doSaveStateDebounced();
	}

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

	hasSavedStateUrl () {
		return window.location.hash.length;
	}

	async pDoLoadUrlState () {
		if (window.location.hash.length) {
			const toLoad = JSON.parse(decodeURIComponent(window.location.hash.slice(1)));
			this.doReset();
			await this.pDoLoadStateFrom(toLoad);
		}
		window.location.hash = "";
	}

	async pHasSavedState () {
		return !!await StorageUtil.pGet(VeCt.STORAGE_DMSCREEN);
	}

	getSaveableState () {
		return {
			w: this.width,
			h: this.height,
			ctc: this.getConfirmTabClose(),
			fs: this.isFullscreen,
			lk: this.isLocked,
			ps: Object.values(this.panels).map(p => p.getSaveableState()),
			ex: this.exiledPanels.map(p => p.getSaveableState()),
		};
	}

	doSaveStateDebounced () {
		this._pDoSaveStateDebounced();
	}

	async pDoLoadStateFrom (toLoad) {
		if (this.cbConfirmTabClose) this.cbConfirmTabClose.prop("checked", !!toLoad.ctc);
		if (this.btnFullscreen && (toLoad.fs !== !!this.isFullscreen)) this.btnFullscreen.trigger("click");
		if (this.btnLockPanels && (toLoad.lk !== !!this.isLocked)) this.btnLockPanels.trigger("click");

		// re-exile
		const toReExile = toLoad.ex.filter(Boolean).reverse();
		for (const saved of toReExile) {
			const p = await Panel.fromSavedState(this, saved);
			if (p) {
				this.panels[p.id] = p;
				this.fireBoardEvent({type: "panelIdSetActive", payload: {type: p.type}});
				p.exile();
			}
		}
		this.setDimensions(toLoad.w, toLoad.h); // FIXME is this necessary?

		// reload
		// fill content first; empties can fill any remaining space
		const toReload = toLoad.ps.filter(Boolean).filter(saved => saved.t !== PANEL_TYP_EMPTY);
		for (const saved of toReload) {
			const p = await Panel.fromSavedState(this, saved);
			if (p) {
				this.panels[p.id] = p;
				this.fireBoardEvent({type: "panelIdSetActive", payload: {type: p.type}});
			}
		}
		this.setDimensions(toLoad.w, toLoad.h);
	}

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

		const btnDownload = ee`<button class="ve-btn ve-btn-sm ve-btn-primary mr-2">Download Save</button>`
			.onn("click", () => handleClickDownload());

		const handleClickPurge = async () => {
			if (!await InputUiUtil.pGetUserBoolean({title: "Purge", htmlDescription: "Are you sure?", textYes: "Yes", textNo: "Cancel"})) return;
			await StorageUtil.pRemove(VeCt.STORAGE_DMSCREEN);
			doClose(true);
		};

		const btnPurge = ee`<button class="ve-btn ve-btn-sm ve-btn-danger">Purge and Continue</button>`
			.onn("click", () => handleClickPurge());

		const txtDownload = ee`<b class="clickable">download a backup of your save</b>`
			.onn("click", () => handleClickDownload());
		const txtPurge = ee`<span class="clickable text-danger">purge the save</span>`
			.onn("click", () => handleClickPurge());

		ee(eleModalInner)`
			<div class="py-2 w-100 h-100">
				<div class="mb-2">
					<b>Failed to load saved DM Screen.</b> ${VeCt.STR_SEE_CONSOLE}
				</div>

				<div class="mb-2">
					Please ${txtDownload}, then ${txtPurge} if you wish to continue.
				</div>

				<div class="mb-4">
					If you suspect this is the <span class="help" title="Spoiler: it always is">result of a bug</span>, or need help recovering lost data, drop past our <a href="https://discord.gg/5etools" target="_blank" rel="noopener noreferrer">Discord</a>.
				</div>

				<div class="ve-flex-h-right ve-flex-v-center">
					${btnDownload}
					${btnPurge}
				</div>
			</div>
		`;

		return pGetResolved();
	}

	doReset ({isRetainWidthHeight = false} = {}) {
		this.exiledPanels.forEach(p => p.destroy());
		this.exiledPanels = [];
		this.sideMenu.doUpdateHistory();
		Object.values(this.panels).forEach(p => p.destroy());
		this.panels = {};

		if (isRetainWidthHeight) this.setDimensions(this.getWidth(), this.getHeight());
		else this.setDimensions(this.getInitialWidth(), this.getInitialHeight());
	}

	setHoveringButton (panel) {
		this.resetHoveringButton(panel);
		panel.btnAddInner.addClass("faux-hover");
	}

	resetHoveringButton (panel) {
		Object.values(this.panels).forEach(p => {
			if (panel && panel.id === p.id) return;
			p.btnAddInner.removeClass("faux-hover");
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

class SideMenu {
	constructor (board) {
		this.board = board;
		this.eleMnu = es(`.sidemenu`);

		this.eleMnu.onn("mouseover", () => {
			this.board.setHoveringPanel(null);
			this.board.setVisiblyHoveringPanel(false);
			this.board.resetHoveringButton();
		});

		this.iptWidth = null;
		this.iptHeight = null;
		this.wrpHistory = null;
	}

	render () {
		const renderDivider = () => this.eleMnu.appends(`<hr class="w-100 hr-2 sidemenu__row__divider">`);

		const wrpResizeW = ee`<div class="w-100 mb-2 split-v-center"><div class="sidemenu__row__label">Width</div></div>`.appendTo(this.eleMnu);
		const iptWidth = ee`<input class="form-control" type="number" value="${this.board.width}">`.appendTo(wrpResizeW);
		this.iptWidth = iptWidth;
		const wrpResizeH = ee`<div class="w-100 mb-2 split-v-center"><div class="sidemenu__row__label">Height</div></div>`.appendTo(this.eleMnu);
		const iptHeight = ee`<input class="form-control" type="number" value="${this.board.height}">`.appendTo(wrpResizeH);
		this.iptHeight = iptHeight;
		const wrpSetDim = ee`<div class="w-100 split-v-center"></div>`.appendTo(this.eleMnu);
		const btnSetDim = ee`<button class="ve-btn ve-btn-primary" style="width: 100%;">Set Dimensions</div>`.appendTo(wrpSetDim);
		btnSetDim.onn("click", async () => {
			const w = Number(iptWidth.val());
			const h = Number(iptHeight.val());

			if (w > 10 || h > 10) {
				if (!await InputUiUtil.pGetUserBoolean({title: "Too Many Panels", htmlDescription: "That's a lot of panels. Are you sure?", textYes: "Yes", textNo: "Cancel"})) return;
			}

			this.board.setDimensions(w, h);
		});
		renderDivider();

		const wrpFullscreen = ee`<div class="w-100 ve-flex-vh-center-around"></div>`.appendTo(this.eleMnu);
		const btnFullscreen = ee`<button class="ve-btn ve-btn-primary">Toggle Fullscreen</button>`.appendTo(wrpFullscreen);
		this.board.btnFullscreen = btnFullscreen;
		btnFullscreen.onn("click", () => this.board.doToggleFullscreen());
		const btnLockPanels = ee`<button class="ve-btn ve-btn-danger" title="Lock Panels"><span class="glyphicon glyphicon-lock"></span></button>`.appendTo(wrpFullscreen);
		this.board.btnLockPanels = btnLockPanels;
		btnLockPanels.onn("click", () => {
			this.board.isLocked = !this.board.isLocked;
			if (this.board.isLocked) {
				this.board.setAllControlBarsVisible(false);
				e_(document.body).addClass(`dm-screen-locked`);
				btnLockPanels.removeClass(`ve-btn-danger`).addClass(`ve-btn-success`);
			} else {
				e_(document.body).removeClass(`dm-screen-locked`);
				btnLockPanels.addClass(`ve-btn-danger`).removeClass(`ve-btn-success`);
			}
			this.board.doSaveStateDebounced();
		});
		renderDivider();

		const wrpSaveLoad = ee`<div class="w-100"></div>`.appendTo(this.eleMnu);
		const wrpSaveLoadFile = ee`<div class="w-100 mb-2 ve-flex-vh-center-around"></div>`.appendTo(wrpSaveLoad);
		const btnSaveFile = ee`<button class="ve-btn ve-btn-primary">Save to File</button>`.appendTo(wrpSaveLoadFile);
		btnSaveFile.onn("click", () => {
			DataUtil.userDownload(`dm-screen`, this.board.getSaveableState(), {fileType: "dm-screen"});
		});
		const btnLoadFile = ee`<button class="ve-btn ve-btn-primary">Load from File</button>`.appendTo(wrpSaveLoadFile);
		btnLoadFile.onn("click", async () => {
			const {jsons, errors} = await InputUiUtil.pGetUserUploadJson({expectedFileTypes: ["dm-screen"]});

			DataUtil.doHandleFileLoadErrorsGeneric(errors);

			if (!jsons?.length) return;
			this.board.doReset();
			await this.board.pDoLoadStateFrom(jsons[0]);
		});
		const wrpSaveLoadUrl = ee`<div class="w-100 ve-flex-vh-center-around"></div>`.appendTo(wrpSaveLoad);
		const btnSaveLink = ee`<button class="ve-btn ve-btn-primary">Save to URL</button>`.appendTo(wrpSaveLoadUrl);
		btnSaveLink.onn("click", async () => {
			const encoded = `${window.location.href.split("#")[0]}#${encodeURIComponent(JSON.stringify(this.board.getSaveableState()))}`;
			await MiscUtil.pCopyTextToClipboard(encoded);
			JqueryUtil.showCopiedEffect(btnSaveLink);
		});
		renderDivider();

		const wrpCbConfirm = ee`<div class="w-100 split-v-center"><label class="sidemenu__row__label sidemenu__row__label--cb-label"><span>Confirm on Panel Tab Close</span></label></div>`.appendTo(this.eleMnu);
		this.board.cbConfirmTabClose = ee`<input type="checkbox" class="sidemenu__row__label__cb">`.appendTo(wrpCbConfirm.find(`label`));
		renderDivider();

		const wrpReset = ee`<div class="w-100 split-v-center"></div>`.appendTo(this.eleMnu);
		const btnReset = ee`<button class="ve-btn ve-btn-danger" style="width: 100%;">Reset Screen</button>`.appendTo(wrpReset);
		btnReset.onn("click", async () => {
			const comp = BaseComponent.fromObject({isRetainWidthHeight: true});
			const cbKeepWidthHeight = ComponentUiUtil.getCbBool(comp, "isRetainWidthHeight");

			const eleDescription = ee`<div class="w-320p">
				<label class="split-v-center mb-2"><span>Keep Current Width/Height</span> ${cbKeepWidthHeight}</label>
				<hr class="hr-1">
				<div>Are you sure?</div>
			</div>`;

			if (!await InputUiUtil.pGetUserBoolean({title: "Reset", eleDescription, textYes: "Yes", textNo: "Cancel"})) return;

			this.board.doReset({isRetainWidthHeight: comp._state.isRetainWidthHeight});
		});
		renderDivider();

		this.wrpHistory = ee`<div class="sidemenu__history ve-overflow-y-auto ve-overflow-x-hidden"></div>`.appendTo(this.eleMnu);
	}

	doUpdateDimensions () {
		this.iptWidth.val(this.board.width);
		this.iptHeight.val(this.board.height);
	}

	doUpdateHistory () {
		this.board.exiledPanels.forEach(p => p.getContentWrapper().detach());
		this.wrpHistory.childrene().forEach(ele => ele.remove());
		if (this.board.exiledPanels.length) {
			const wrpHistHeader = ee`<div class="w-100 mb-2 split-v-center"><span style="font-variant: small-caps;">Recently Removed</span></div>`.appendTo(this.wrpHistory);
			const btnHistClear = ee`<button class="ve-btn ve-btn-danger">Clear</button>`.appendTo(wrpHistHeader);
			btnHistClear.onn("click", () => {
				this.board.exiledPanels.forEach(p => p.destroy());
				this.board.exiledPanels = [];
				this.doUpdateHistory();
			});
		}
		this.board.exiledPanels.forEach((panel, i) => {
			const wrpHistItem = ee`<div class="sidemenu__history-item"></div>`.appendTo(this.wrpHistory);
			const cvrHistItem = ee`<div class="sidemenu__history-item-cover"></div>`.appendTo(wrpHistItem);
			const btnRemove = ee`<div class="panel-history-control-remove-wrapper"><span class="panel-history-control-remove glyphicon glyphicon-remove" title="Remove"></span></div>`.appendTo(cvrHistItem);
			const ctrlMove = ee`<div class="panel-history-control-middle" title="Move"></div>`.appendTo(cvrHistItem);

			btnRemove.onn("click", () => {
				this.board.exiledPanels[i].destroy();
				this.board.exiledPanels.splice(i, 1);
				this.doUpdateHistory();
			});

			const contents = panel.getContentWrapper();
			wrpHistItem.appends(contents);

			DmScreenExiledPanelJoystickMenu.bindCtrlMoveHandlers({
				sideMenu: this,
				panel,
				ctrlMove,
				wrpHistItem,
				btnRemove,
			});
		});
		this.board.doSaveStateDebounced();
	}
}

class Panel {
	constructor (board, x, y, width = 1, height = 1, title = "") {
		this.id = board.getNextId();
		this.board = board;
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.title = title;
		this.isDirty = true;
		this.isContentDirty = false;
		this.isLocked = false; // unused
		this.type = PANEL_TYP_EMPTY;
		this.contentMeta = null; // info used during saved state re-load
		this.isTabs = false;
		this.tabIndex = null;
		this.tabDatas = [];
		this.tabCanRename = false;
		this.tabRenamed = false;

		this.btnAdd = null;
		this.btnAddInner = null;
		this.eleContent = null;
		this.joyMenu = null;
		this.pnl = null;
		this.pnlWrpContent = null;
		this.pnlTitle = null;
		this.pnlAddTab = null;
		this.pnlWrpTabs = null;
		this.pnlTabs = null;
	}

	static async fromSavedState (board, saved) {
		const existing = board.getPanels(saved.x, saved.y, saved.w, saved.h);
		if (saved.t === PANEL_TYP_EMPTY && existing.length) return null; // cull empties
		else if (existing.length) existing.forEach(p => p.destroy()); // prefer more recent panels
		const panel = new Panel(board, saved.x, saved.y, saved.w, saved.h);
		panel.render();

		const pLoadState = async (saved, skipSetTab, ixTab) => {
			// TODO(Future) refactor other panels to use this
			const isViaPcm = await PanelContentManagerFactory.pFromSavedState({board, saved, ixTab, panel});
			if (isViaPcm) return;

			const handleTabRenamed = (panel) => {
				if (saved.r != null) panel.tabDatas[ixTab].tabRenamed = true;
			};

			switch (saved.t) {
				case PANEL_TYP_EMPTY:
					return panel;
				case PANEL_TYP_STATS: {
					const page = saved.c.p;
					const source = saved.c.s;
					const hash = saved.c.u;
					await panel.doPopulate_Stats(page, source, hash, skipSetTab, saved.r);
					handleTabRenamed(panel);
					return panel;
				}
				case PANEL_TYP_CREATURE_SCALED_CR: {
					const page = saved.c.p;
					const source = saved.c.s;
					const hash = saved.c.u;
					const cr = saved.c.cr;
					await panel.doPopulate_StatsScaledCr(page, source, hash, cr, skipSetTab, saved.r);
					handleTabRenamed(panel);
					return panel;
				}
				case PANEL_TYP_CREATURE_SCALED_SPELL_SUMMON: {
					const page = saved.c.p;
					const source = saved.c.s;
					const hash = saved.c.u;
					const summonSpellLevel = saved.c.ssl;
					await panel.doPopulate_StatsScaledSpellSummonLevel(page, source, hash, summonSpellLevel, skipSetTab, saved.r);
					handleTabRenamed(panel);
					return panel;
				}
				case PANEL_TYP_CREATURE_SCALED_CLASS_SUMMON: {
					const page = saved.c.p;
					const source = saved.c.s;
					const hash = saved.c.u;
					const summonClassLevel = saved.c.csl;
					await panel.doPopulate_StatsScaledClassSummonLevel(page, source, hash, summonClassLevel, skipSetTab, saved.r);
					handleTabRenamed(panel);
					return panel;
				}
				case PANEL_TYP_RULES: {
					const book = saved.c.b;
					const chapter = saved.c.c;
					const header = saved.c.h;
					await panel.doPopulate_Rules(book, chapter, header, skipSetTab, saved.r);
					handleTabRenamed(panel);
					return panel;
				}
				case PANEL_TYP_ADVENTURES: {
					const adventure = saved.c.a;
					const chapter = saved.c.c;
					await panel.doPopulate_Adventures(adventure, chapter, skipSetTab, saved.r);
					handleTabRenamed(panel);
					return panel;
				}
				case PANEL_TYP_BOOKS: {
					const book = saved.c.b;
					const chapter = saved.c.c;
					await panel.doPopulate_Books(book, chapter, skipSetTab, saved.r);
					handleTabRenamed(panel);
					return panel;
				}
				case PANEL_TYP_ROLLBOX:
					Renderer.dice.bindDmScreenPanel(panel, saved.r);
					handleTabRenamed(panel);
					return panel;
				case PANEL_TYP_TUBE:
					panel.doPopulate_YouTube(saved.c.u, saved.r);
					handleTabRenamed(panel);
					return panel;
				case PANEL_TYP_TWITCH:
					panel.doPopulate_Twitch(saved.c.u, saved.r);
					handleTabRenamed(panel);
					return panel;
				case PANEL_TYP_TWITCH_CHAT:
					panel.doPopulate_TwitchChat(saved.c.u, saved.r);
					handleTabRenamed(panel);
					return panel;
				case PANEL_TYP_GENERIC_EMBED:
					panel.doPopulate_GenericEmbed(saved.c.u, saved.r);
					handleTabRenamed(panel);
					return panel;
				case PANEL_TYP_IMAGE:
					panel.doPopulate_Image(saved.c.u, saved.r);
					handleTabRenamed(panel);
					return panel;
				case PANEL_TYP_ERROR:
					panel.doPopulate_Error(saved.s, saved.r);
					handleTabRenamed(panel);
					return panel;
				case PANEL_TYP_BLANK:
					panel.doPopulate_Blank(saved.r);
					handleTabRenamed(panel);
					return panel;
				default:
					throw new Error(`Unhandled panel type ${saved.t}`);
			}
		};

		if (saved.a) {
			panel.setIsTabs(true);

			// If tab data is untyped, replace it with a blank panel, to avoid breaking "active tab" index.
			// This can happen if a "blank space" panel is mixed in with other tabs.
			saved.a.forEach(it => it.t = it.t ?? PANEL_TYP_BLANK);

			for (let ix = 0; ix < saved.a.length; ++ix) {
				const tab = saved.a[ix];
				await pLoadState(tab, true, ix);
			}
			panel.setActiveTab(saved.b);
		} else {
			await pLoadState(saved);
		}

		return panel;
	}

	static _getEleLoading (message = "Loading") {
		return ee`<div class="panel-content-wrapper-inner"><div class="ui-search__message loading-spinner"><i>${message}...</i></div></div>`;
	}

	static isNonExilableType (type) {
		return type === PANEL_TYP_ROLLBOX || type === PANEL_TYP_TUBE || type === PANEL_TYP_TWITCH;
	}

	// region Panel population

	doPopulate_Empty (ixOpt) {
		this.closeTabContent(ixOpt);
	}

	doPopulate_Loading (message) {
		return this.setEleContentTab({
			panelType: PANEL_TYP_EMPTY,
			eleContent: Panel._getEleLoading(message),
			title: TITLE_LOADING,
		});
	}

	doPopulate_Stats (page, source, hash, skipSetTab, title) { // FIXME skipSetTab is never used
		const meta = {p: page, s: source, u: hash};
		const ix = this.setTabLoading(
			PANEL_TYP_STATS,
			meta,
		);
		return DataLoader.pCacheAndGet(
			page,
			source,
			hash,
		).then(it => {
			if (!it) {
				setTimeout(() => { throw new Error(`Failed to load entity: "${hash}" (${source}) from ${page}`); });
				return this.doPopulate_Error({message: `Failed to load <code>${hash}</code> from page <code>${page}</code>! (Content does not exist.)`}, title);
			}

			const fn = Renderer.hover.getFnRenderCompact(page);

			const eleContentInner = ee`<div class="panel-content-wrapper-inner"></div>`;
			const eleContentStats = ee`<table class="w-100 stats"></table>`.appendTo(eleContentInner);
			eleContentStats.appends(fn(it));

			const fnBind = Renderer.hover.getFnBindListenersCompact(page);
			if (fnBind) fnBind(it, eleContentStats);

			this._stats_bindCrScaleClickHandler(it, meta, eleContentInner, eleContentStats);
			this._stats_bindSummonScaleClickHandler(it, meta, eleContentInner, eleContentStats);

			this.setTab({
				ix,
				type: PANEL_TYP_STATS,
				contentMeta: meta,
				eleContent: eleContentInner,
				title: title || it.name,
				tabCanRename: true,
				tabRenamed: !!title,
			});
		});
	}

	_onClickBtnScaleCrPrev = null;
	_onClickBtnResetCrPrev = null;

	_stats_bindCrScaleClickHandler (mon, meta, eleContentInner, eleContentStats) {
		if (mon.__prop !== "monster") return;

		const onClickBtnScaleCr = (evt) => {
			const btnScale_ = evt.target.closest(".mon__btn-scale-cr");
			if (!btnScale_) return;

			evt.stopPropagation();
			const win = (evt.view || {}).window;

			const btnScale = e_(btnScale_);
			const lastCr = this.contentMeta.cr != null ? Parser.numberToCr(this.contentMeta.cr) : mon.cr ? (mon.cr.cr || mon.cr) : null;

			Renderer.monster.getCrScaleTarget({
				win,
				btnScale,
				initialCr: lastCr,
				isCompact: true,
				cbRender: (targetCr) => {
					const originalCr = Parser.crToNumber(mon.cr) === targetCr;

					const doRender = (toRender) => {
						eleContentStats.empty().appends(Renderer.monster.getCompactRenderedString(toRender, {isShowScalers: true, isScaledCr: !originalCr}));

						const nxtMeta = {
							...meta,
							cr: targetCr,
						};
						if (originalCr) delete nxtMeta.cr;

						this.setTab({
							ix: this.tabIndex,
							type: originalCr ? PANEL_TYP_STATS : PANEL_TYP_CREATURE_SCALED_CR,
							contentMeta: nxtMeta,
							eleContent: eleContentInner,
							title: toRender._displayName || toRender.name,
							tabCanRename: true,
						});
					};

					if (originalCr) {
						doRender(mon);
					} else {
						ScaleCreature.scale(mon, targetCr).then(toRender => doRender(toRender));
					}
				},
			});
		};

		if (this._onClickBtnScaleCrPrev) eleContentStats.off("click", this._onClickBtnScaleCrPrev);
		this._onClickBtnScaleCrPrev = onClickBtnScaleCr;
		eleContentStats.onn("click", onClickBtnScaleCr);

		const onClickBtnResetCr = (evt) => {
			const btnReset = evt.target.closest(".mon__btn-reset-cr");
			if (!btnReset) return;

			evt.stopPropagation();
			eleContentStats.empty().appends(Renderer.monster.getCompactRenderedString(mon, {isShowScalers: true, isScaledCr: false}));
			this.setTab({
				ix: this.tabIndex,
				type: PANEL_TYP_STATS,
				contentMeta: meta,
				eleContent: eleContentInner,
				title: mon.name,
				tabCanRename: true,
			});
		};

		if (this._onClickBtnResetCrPrev) eleContentStats.off("click", this._onClickBtnResetCrPrev);
		this._onClickBtnResetCrPrev = onClickBtnResetCr;
		eleContentStats.onn("click", onClickBtnResetCr);
	}

	_onChangeSelScaleSummonSpellLevelPrev = null;
	_onChangeSelScaleSummonClassLevelPrev = null;

	_stats_bindSummonScaleClickHandler (mon, meta, eleContentInner, eleContentStats) {
		if (mon.__prop !== "monster") return;

		const onChangeSelScaleSummonSpellLevel = async (evt) => {
			const selScale_ = evt.target.closest(`[name="mon__sel-summon-spell-level"]`);
			if (!selScale_) return;

			const selSummonSpellLevel = e_(selScale_);

			const spellLevel = Number(selSummonSpellLevel.val());
			if (~spellLevel) {
				const nxtMeta = {
					...meta,
					ssl: spellLevel,
				};

				ScaleSpellSummonedCreature.scale(mon, spellLevel)
					.then(toRender => {
						eleContentStats.empty().appends(Renderer.monster.getCompactRenderedString(toRender, {isShowScalers: true, isScaledSpellSummon: true}));

						this._stats_doUpdateSummonScaleDropdowns(toRender, eleContentStats);

						this.setTab({
							ix: this.tabIndex,
							type: PANEL_TYP_CREATURE_SCALED_SPELL_SUMMON,
							contentMeta: nxtMeta,
							eleContent: eleContentInner,
							title: mon._displayName || mon.name,
							tabCanRename: true,
						});
					});
			} else {
				eleContentStats.empty().appends(Renderer.monster.getCompactRenderedString(mon, {isShowScalers: true, isScaledCr: false, isScaledSpellSummon: false}));

				this._stats_doUpdateSummonScaleDropdowns(mon, eleContentStats);

				this.setTab({
					ix: this.tabIndex,
					type: PANEL_TYP_STATS,
					contentMeta: meta,
					eleContent: eleContentInner,
					title: mon.name,
					tabCanRename: true,
				});
			}
		};

		if (this._onChangeSelScaleSummonSpellLevelPrev) eleContentStats.off("change", this._onChangeSelScaleSummonSpellLevelPrev);
		this._onChangeSelScaleSummonSpellLevelPrev = onChangeSelScaleSummonSpellLevel;
		eleContentStats.onn("change", onChangeSelScaleSummonSpellLevel);

		const onChangeSelScaleSummonClassLevel = async (evt) => {
			const selScale_ = evt.target.closest(`[name="mon__sel-summon-class-level"]`);
			if (!selScale_) return;

			const selSummonClassLevel = e_(selScale_);

			const classLevel = Number(selSummonClassLevel.val());
			if (~classLevel) {
				const nxtMeta = {
					...meta,
					csl: classLevel,
				};

				ScaleClassSummonedCreature.scale(mon, classLevel)
					.then(toRender => {
						eleContentStats.empty().appends(Renderer.monster.getCompactRenderedString(toRender, {isShowScalers: true, isScaledClassSummon: true}));

						this._stats_doUpdateSummonScaleDropdowns(toRender, eleContentStats);

						this.setTab({
							ix: this.tabIndex,
							type: PANEL_TYP_CREATURE_SCALED_CLASS_SUMMON,
							contentMeta: nxtMeta,
							eleContent: eleContentInner,
							title: mon._displayName || mon.name,
							tabCanRename: true,
						});
					});
			} else {
				eleContentStats.empty().appends(Renderer.monster.getCompactRenderedString(mon, {isShowScalers: true, isScaledCr: false, isScaledClassSummon: false}));

				this._stats_doUpdateSummonScaleDropdowns(mon, eleContentStats);

				this.setTab({
					ix: this.tabIndex,
					type: PANEL_TYP_STATS,
					contentMeta: meta,
					eleContent: eleContentInner,
					title: mon.name,
					tabCanRename: true,
				});
			}
		};

		if (this._onChangeSelScaleSummonClassLevelPrev) eleContentStats.off("change", this._onChangeSelScaleSummonClassLevelPrev);
		this._onChangeSelScaleSummonClassLevelPrev = onChangeSelScaleSummonClassLevel;
		eleContentStats.onn("change", onChangeSelScaleSummonClassLevel);
	}

	_stats_doUpdateSummonScaleDropdowns (scaledMon, eleContentStats) {
		eleContentStats
			.find(`[name="mon__sel-summon-spell-level"]`)
			?.val(scaledMon._summonedBySpell_level != null ? `${scaledMon._summonedBySpell_level}` : "-1");

		eleContentStats
			.find(`[name="mon__sel-summon-class-level"]`)
			?.val(scaledMon._summonedByClass_level != null ? `${scaledMon._summonedByClass_level}` : "-1");
	}

	doPopulate_StatsScaledCr (page, source, hash, targetCr, skipSetTab, title) { // FIXME skipSetTab is never used
		const meta = {p: page, s: source, u: hash, cr: targetCr};
		const ix = this.setTabLoading(
			PANEL_TYP_CREATURE_SCALED_CR,
			meta,
		);
		return DataLoader.pCacheAndGet(
			page,
			source,
			hash,
		).then(it => {
			ScaleCreature.scale(it, targetCr).then(initialRender => {
				const eleContentInner = ee`<div class="panel-content-wrapper-inner"></div>`;
				const eleContentStats = ee`<table class="w-100 stats"></table>`.appendTo(eleContentInner);
				eleContentStats.appends(Renderer.monster.getCompactRenderedString(initialRender, {isShowScalers: true, isScaledCr: true}));

				this._stats_bindCrScaleClickHandler(it, meta, eleContentInner, eleContentStats);

				this.setTab({
					ix: ix,
					type: PANEL_TYP_CREATURE_SCALED_CR,
					contentMeta: meta,
					eleContent: eleContentInner,
					title: title || initialRender._displayName || initialRender.name,
					tabCanRename: true,
					tabRenamed: !!title,
				});
			});
		});
	}

	doPopulate_StatsScaledSpellSummonLevel (page, source, hash, summonSpellLevel, skipSetTab, title) { // FIXME skipSetTab is never used
		const meta = {p: page, s: source, u: hash, ssl: summonSpellLevel};
		const ix = this.setTabLoading(
			PANEL_TYP_CREATURE_SCALED_SPELL_SUMMON,
			meta,
		);
		return DataLoader.pCacheAndGet(
			page,
			source,
			hash,
		).then(it => {
			ScaleSpellSummonedCreature.scale(it, summonSpellLevel).then(scaledMon => {
				const eleContentInner = ee`<div class="panel-content-wrapper-inner"></div>`;
				const eleContentStats = ee`<table class="w-100 stats"></table>`.appendTo(eleContentInner);
				eleContentStats.appends(Renderer.monster.getCompactRenderedString(scaledMon, {isShowScalers: true, isScaledSpellSummon: true}));

				this._stats_doUpdateSummonScaleDropdowns(scaledMon, eleContentStats);

				this._stats_bindSummonScaleClickHandler(it, meta, eleContentInner, eleContentStats);

				this.setTab({
					ix: ix,
					type: PANEL_TYP_CREATURE_SCALED_SPELL_SUMMON,
					contentMeta: meta,
					eleContent: eleContentInner,
					title: title || scaledMon._displayName || scaledMon.name,
					tabCanRename: true,
					tabRenamed: !!title,
				});
			});
		});
	}

	doPopulate_StatsScaledClassSummonLevel (page, source, hash, summonClassLevel, skipSetTab, title) { // FIXME skipSetTab is never used
		const meta = {p: page, s: source, u: hash, csl: summonClassLevel};
		const ix = this.setTabLoading(
			PANEL_TYP_CREATURE_SCALED_CLASS_SUMMON,
			meta,
		);
		return DataLoader.pCacheAndGet(
			page,
			source,
			hash,
		).then(it => {
			ScaleClassSummonedCreature.scale(it, summonClassLevel).then(scaledMon => {
				const eleContentInner = ee`<div class="panel-content-wrapper-inner"></div>`;
				const eleContentStats = ee`<table class="w-100 stats"></table>`.appendTo(eleContentInner);
				eleContentStats.appends(Renderer.monster.getCompactRenderedString(scaledMon, {isShowScalers: true, isScaledClassSummon: true}));

				this._stats_doUpdateSummonScaleDropdowns(scaledMon, eleContentStats);

				this._stats_bindSummonScaleClickHandler(it, meta, eleContentInner, eleContentStats);

				this.setTab({
					ix: ix,
					type: PANEL_TYP_CREATURE_SCALED_CLASS_SUMMON,
					contentMeta: meta,
					eleContent: eleContentInner,
					title: title || scaledMon._displayName || scaledMon.name,
					tabCanRename: true,
					tabRenamed: !!title,
				});
			});
		});
	}

	doPopulate_Rules (book, chapter, header, skipSetTab, title) { // FIXME skipSetTab is never used
		const meta = {b: book, c: chapter, h: header};
		const ix = this.setTabLoading(
			PANEL_TYP_RULES,
			meta,
		);
		return RuleLoader.pFill(book).then(() => {
			const rule = RuleLoader.getFromCache(book, chapter, header);
			const it = Renderer.rule.getCompactRenderedString(rule);
			this.setTab({
				ix: ix,
				type: PANEL_TYP_RULES,
				contentMeta: meta,
				eleContent: ee`<div class="panel-content-wrapper-inner"><table class="w-100 stats">${it}</table></div>`,
				title: title || rule.name || "",
				tabCanRename: true,
				tabRenamed: !!title,
			});
		});
	}

	doPopulate_Adventures (adventure, chapter, skipSetTab, title) { // FIXME skipSetTab is never used
		const meta = {a: adventure, c: chapter};
		const ix = this.setTabLoading(
			PANEL_TYP_ADVENTURES,
			meta,
		);
		return adventureLoader.pFill(adventure).then(() => {
			const data = adventureLoader.getFromCache(adventure, chapter);
			const view = new AdventureOrBookView("a", this, adventureLoader, ix, meta);
			this.setTab({
				ix: ix,
				type: PANEL_TYP_ADVENTURES,
				contentMeta: meta,
				eleContent: ee`<div class="panel-content-wrapper-inner"></div>`.appends(view.getEle()),
				title: title || data?.chapter?.name || "",
				tabCanRename: true,
				tabRenamed: !!title,
			});
		});
	}

	doPopulate_Books (book, chapter, skipSetTab, title) { // FIXME skipSetTab is never used
		const meta = {b: book, c: chapter};
		const ix = this.setTabLoading(
			PANEL_TYP_BOOKS,
			meta,
		);
		return bookLoader.pFill(book).then(() => {
			const data = bookLoader.getFromCache(book, chapter);
			const view = new AdventureOrBookView("b", this, bookLoader, ix, meta);
			this.setTab({
				ix: ix,
				type: PANEL_TYP_BOOKS,
				contentMeta: meta,
				eleContent: ee`<div class="panel-content-wrapper-inner"></div>`.appends(view.getEle()),
				title: title || data?.chapter?.name || "",
				tabCanRename: true,
				tabRenamed: !!title,
			});
		});
	}

	setEleContentTab (
		{
			panelType,
			contentMeta = null,
			panelApp = null,
			eleContent,
			title,
			tabCanRename,
			tabRenamed,
		},
	) {
		const ix = this.isTabs ? this.getNextTabIndex() : 0;
		return this.setTab({
			ix: ix,
			type: panelType,
			contentMeta: contentMeta,
			panelApp,
			eleContent: eleContent,
			title: title,
			tabCanRename: tabCanRename,
			tabRenamed: tabRenamed,
		});
	}

	doPopulate_Rollbox (title) {
		this.setEleContentTab({
			panelType: PANEL_TYP_ROLLBOX,
			contentMeta: null,
			eleContent: ee`<div class="panel-content-wrapper-inner"></div>`.appends(Renderer.dice.getRoller().addClass("rollbox-panel")),
			title: title || "Dice Roller",
			tabCanRename: true,
			tabRenamed: !!title,
		});
	}

	doPopulate_YouTube (url, title = "YouTube") {
		const meta = {u: url};
		this.setEleContentTab({
			panelType: PANEL_TYP_TUBE,
			contentMeta: meta,
			eleContent: ee`<div class="panel-content-wrapper-inner"><iframe src="${url}?autoplay=1&enablejsapi=1&modestbranding=1&iv_load_policy=3" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen ${ElementUtil.getIframeSandboxAttribute()}></iframe></div>`,
			title: title,
			tabCanRename: true,
		});
	}

	doPopulate_Twitch (url, title = "Twitch") {
		const meta = {u: url};
		this.setEleContentTab({
			panelType: PANEL_TYP_TWITCH,
			contentMeta: meta,
			eleContent: ee`<div class="panel-content-wrapper-inner"><iframe src="${url}&parent=${location.hostname}" frameborder="0" allowfullscreen scrolling="no" ${ElementUtil.getIframeSandboxAttribute()}></iframe></div>`,
			title: title,
			tabCanRename: true,
		});
	}

	doPopulate_TwitchChat (url, title = "Twitch Chat") {
		const meta = {u: url};
		const channelId = url.split("/").map(it => it.trim()).filter(Boolean).slice(-2)[0];
		this.setEleContentTab({
			panelType: PANEL_TYP_TWITCH_CHAT,
			contentMeta: meta,
			eleContent: ee`<div class="panel-content-wrapper-inner"><iframe src="${url}?parent=${location.hostname}" frameborder="0" scrolling="no" id="${channelId}" ${ElementUtil.getIframeSandboxAttribute()}></iframe></div>`,
			title: title,
			tabCanRename: true,
		});
	}

	doPopulate_GenericEmbed (url, title = "Embed") {
		const meta = {u: url};
		this.setEleContentTab({
			panelType: PANEL_TYP_GENERIC_EMBED,
			contentMeta: meta,
			eleContent: ee`<div class="panel-content-wrapper-inner"><iframe src="${url}" ${ElementUtil.getIframeSandboxAttribute({url, isAllowPdf: true})}></iframe></div>`,
			title: title,
			tabCanRename: true,
		});
	}

	doPopulate_Image (url, title = "Image") {
		const meta = {u: url};
		const wrpPanel = ee`<div class="panel-content-wrapper-inner"></div>`;
		const wrpImage = ee`<div class="panel-content-wrapper-img"></div>`.appendTo(wrpPanel);
		const img = ee`<img src="${url}" alt="${title}" loading="lazy">`.appendTo(wrpImage);
		const btnReset = ee`<button class="panel-zoom-reset ve-btn ve-btn-xs ve-btn-default"><span class="glyphicon glyphicon-refresh"></span></button>`.appendTo(wrpPanel);
		const iptRange = ee`<input type="range" class="panel-zoom-slider">`.appendTo(wrpPanel);
		this.setEleContentTab({
			panelType: PANEL_TYP_IMAGE,
			contentMeta: meta,
			eleContent: wrpPanel,
			title: title,
			tabCanRename: true,
		});
		Panzoom.mutBindPanzoom({
			img,
			btnReset,
			iptRange,
			scaleMin: 0.1,
			scaleMax: 8,
			scaleStep: 0.1,
		});
	}

	doPopulate_Error (state, title = "") {
		this.setEleContentTab({
			panelType: PANEL_TYP_ERROR,
			contentMeta: state,
			eleContent: ee`<div class="panel-content-wrapper-inner"></div>`.appends(`<div class="w-100 h-100 ve-flex-vh-center text-danger"><div>${state.message}</div></div>`),
			title: title,
			tabCanRename: true,
		});
	}

	doPopulate_Blank (title = "") {
		const meta = {};
		this.setEleContentTab({
			panelType: PANEL_TYP_BLANK,
			contentMeta: meta,
			eleContent: ee`<div class="dm-blank__panel"></div>`,
			title: title,
			tabCanRename: true,
		});
	}

	// endregion

	// region Mass panel population

	async pDoMassPopulate_Entities (evt) {
		evt.stopPropagation();

		const page = await InputUiUtil.pGetUserEnum({
			title: "Select Page",
			values: Object.keys(UrlUtil.SUBLIST_PAGES)
				.sort((a, b) => SortUtil.ascSortLower(UrlUtil.pageToDisplayPage(a), UrlUtil.pageToDisplayPage(b))),
			fnDisplay: page => UrlUtil.pageToDisplayPage(page),
			isResolveItem: true,
		});
		if (!page) return;

		const pFnConfirmPanels = () => InputUiUtil.pGetUserBoolean({title: "Add as Panels", htmlDescription: "Adding entries one-per-panel may resize your DM Screen<br>Are you sure you want to add as panels?", textYes: "Yes", textNo: "Cancel"});

		await ListUtilEntity.pDoUserInputLoadSublist({
			page,

			pFnOnSelect: ({isTabs, entityInfos}) => {
				this.board.doMassPopulate_Entities({
					page,
					entities: entityInfos.map(it => it.entity),
					panel: isTabs ? this : null,
				});
			},

			optsFromCurrent: {
				renamer: name => `${name} (One per Panel)`,
				pFnConfirm: pFnConfirmPanels,
			},
			optsFromSaved: {
				renamer: name => `${name} (One per Panel)`,
				pFnConfirm: pFnConfirmPanels,
			},
			optsFromFile: {
				renamer: name => `${name} (One per Panel)`,
				pFnConfirm: pFnConfirmPanels,
			},

			altGenerators: [
				{
					fromCurrent: {
						renamer: name => `${name} (Stacked Tabs)`,
						otherOpts: {isTabs: true},
					},
					fromSaved: {
						renamer: name => `${name} (Stacked Tabs)`,
						otherOpts: {isTabs: true},
					},
					fromFile: {
						renamer: name => `${name} (Stacked Tabs)`,
						otherOpts: {isTabs: true},
					},
				},
			],
		});
	}

	// endregion

	// region Get neighbours

	getTopNeighbours () {
		return [...new Array(this.width)]
			.map((blank, i) => i + this.x).map(x => this.board.getPanel(x, this.y - 1))
			.filter(p => p);
	}

	getRightNeighbours () {
		const rightmost = this.x + this.width;
		return [...new Array(this.height)].map((blank, i) => i + this.y)
			.map(y => this.board.getPanel(rightmost, y))
			.filter(p => p);
	}

	getBottomNeighbours () {
		const lowest = this.y + this.height;
		return [...new Array(this.width)].map((blank, i) => i + this.x)
			.map(x => this.board.getPanel(x, lowest))
			.filter(p => p);
	}

	getLeftNeighbours () {
		return [...new Array(this.height)].map((blank, i) => i + this.y)
			.map(y => this.board.getPanel(this.x - 1, y))
			.filter(p => p);
	}

	// endregion

	// region Location checkers

	hasRowTop () {
		return this.y > 0;
	}

	hasColumnRight () {
		return (this.x + this.width) < this.board.getWidth();
	}

	hasRowBottom () {
		return (this.y + this.height) < this.board.getHeight();
	}

	hasColumnLeft () {
		return this.x > 0;
	}

	// endregion

	// region Available space checkers

	hasSpaceTop () {
		const hasLockedNeighbourTop = this.getTopNeighbours().filter(p => p.getLocked()).length;
		return this.hasRowTop() && !hasLockedNeighbourTop;
	}

	hasSpaceRight () {
		const hasLockedNeighbourRight = this.getRightNeighbours().filter(p => p.getLocked()).length;
		return this.hasColumnRight() && !hasLockedNeighbourRight;
	}

	hasSpaceBottom () {
		const hasLockedNeighbourBottom = this.getBottomNeighbours().filter(p => p.getLocked()).length;
		return this.hasRowBottom() && !hasLockedNeighbourBottom;
	}

	hasSpaceLeft () {
		const hasLockedNeighbourLeft = this.getLeftNeighbours().filter(p => p.getLocked()).length;
		return this.hasColumnLeft() && !hasLockedNeighbourLeft;
	}

	// endregion

	// region Shrink checkers

	canShrinkTop () {
		return this.height > 1 && !this.getLocked();
	}

	canShrinkRight () {
		return this.width > 1 && !this.getLocked();
	}

	canShrinkBottom () {
		return this.height > 1 && !this.getLocked();
	}

	canShrinkLeft () {
		return this.width > 1 && !this.getLocked();
	}

	// endregion

	// region Shrinkers

	doShrinkTop () {
		this.height -= 1;
		this.y += 1;
		this.setDirty(true);
		this.render();
	}

	doShrinkRight () {
		this.width -= 1;
		this.setDirty(true);
		this.render();
	}

	doShrinkBottom () {
		this.height -= 1;
		this.setDirty(true);
		this.render();
	}

	doShrinkLeft () {
		this.width -= 1;
		this.x += 1;
		this.setDirty(true);
		this.render();
	}

	// endregion

	// region Bump checkers

	canBumpTop () {
		if (!this.hasRowTop()) return false; // if there's no row above, we can't bump up a row
		if (!this.getTopNeighbours().filter(p => !p.getEmpty()).length) return true; // if there's a row above and it's empty, we can bump
		// if there's a row above and it has non-empty panels, we can bump if they can all bump
		return !this.getTopNeighbours().filter(p => !p.getEmpty()).filter(p => !p.canBumpTop()).length;
	}

	canBumpRight () {
		if (!this.hasColumnRight()) return false;
		if (!this.getRightNeighbours().filter(p => !p.getEmpty()).length) return true;
		return !this.getRightNeighbours().filter(p => !p.getEmpty()).filter(p => !p.canBumpRight()).length;
	}

	canBumpBottom () {
		if (!this.hasRowBottom()) return false;
		if (!this.getBottomNeighbours().filter(p => !p.getEmpty()).length) return true;
		return !this.getBottomNeighbours().filter(p => !p.getEmpty()).filter(p => !p.canBumpBottom()).length;
	}

	canBumpLeft () {
		if (!this.hasColumnLeft()) return false;
		if (!this.getLeftNeighbours().filter(p => !p.getEmpty()).length) return true;
		return !this.getLeftNeighbours().filter(p => !p.getEmpty()).filter(p => !p.canBumpLeft()).length;
	}

	// endregion

	// region Bumpers

	doBumpTop () {
		this.getTopNeighbours().filter(p => p.getEmpty()).forEach(p => p.destroy());
		this.getTopNeighbours().filter(p => !p.getEmpty()).forEach(p => p.doBumpTop());
		this.y -= 1;
		this.setDirty(true);
		this.render();
	}

	doBumpRight () {
		this.getRightNeighbours().filter(p => p.getEmpty()).forEach(p => p.destroy());
		this.getRightNeighbours().filter(p => !p.getEmpty()).forEach(p => p.doBumpRight());
		this.x += 1;
		this.setDirty(true);
		this.render();
	}

	doBumpBottom () {
		this.getBottomNeighbours().filter(p => p.getEmpty()).forEach(p => p.destroy());
		this.getBottomNeighbours().filter(p => !p.getEmpty()).forEach(p => p.doBumpBottom());
		this.y += 1;
		this.setDirty(true);
		this.render();
	}

	doBumpLeft () {
		this.getLeftNeighbours().filter(p => p.getEmpty()).forEach(p => p.destroy());
		this.getLeftNeighbours().filter(p => !p.getEmpty()).forEach(p => p.doBumpLeft());
		this.x -= 1;
		this.setDirty(true);
		this.render();
	}

	// endregion

	getPanelMeta () {
		return {
			type: this.type,
			contentMeta: this.contentMeta,
			title: this.title,
			isTabs: this.isTabs,
			tabIndex: this.tabIndex,
			tabDatas: this.tabDatas,
			tabCanRename: this.tabCanRename,
			tabRenamed: this.tabRenamed,
		};
	}

	getEmpty () {
		return this.eleContent == null;
	}

	getLocked () {
		return this.isLocked;
	}

	setDirty (dirty) {
		this.isDirty = dirty;
	}

	setIsTabs (isTabs) {
		this.isTabs = isTabs;
		this.doRenderTabs();
	}

	doRenderTitle () {
		const displayText = this.title !== TITLE_LOADING
		&& (this.type === PANEL_TYP_STATS || this.type === PANEL_TYP_CREATURE_SCALED_CR || this.type === PANEL_TYP_CREATURE_SCALED_SPELL_SUMMON || this.type === PANEL_TYP_CREATURE_SCALED_CLASS_SUMMON || this.type === PANEL_TYP_RULES || this.type === PANEL_TYP_ADVENTURES || this.type === PANEL_TYP_BOOKS) ? this.title : "";

		this._doUpdatePanelTitleDisplay(displayText);
		if (!displayText) this.pnlTitle.addClass("hidden");
		else this.pnlTitle.removeClass("hidden");
	}

	doRenderTabs () {
		if (this.isTabs) {
			this.pnlWrpTabs.showVe();
			this.pnlWrpContent.addClass("panel-content-wrapper-tabs");
			this.pnlAddTab.addClass("hidden");
		} else {
			this.pnlWrpTabs.hideVe();
			this.pnlWrpContent.removeClass("panel-content-wrapper-tabs");
			this.pnlAddTab.removeClass("hidden");
		}
	}

	getReplacementPanel () {
		const replacement = new Panel(this.board, this.x, this.y, this.width, this.height);

		if (this.tabDatas.length > 1 && this.tabDatas.filter(it => !it.isDeleted && (Panel.isNonExilableType(it.type))).length) {
			const prevTabIx = this.tabDatas.findIndex(it => !it.isDeleted);
			if (~prevTabIx) {
				this.setActiveTab(prevTabIx);
			}
			// otherwise, it should be the currently displayed panel, and so will be destroyed on exile

			this.tabDatas.filter(it => it.type === PANEL_TYP_ROLLBOX).forEach(it => {
				it.isDeleted = true;
				Renderer.dice.unbindDmScreenPanel();
			});
		}

		this.exile();
		this.board.addPanel(replacement);
		this.board.doCheckFillSpaces();
		return replacement;
	}

	getIsMoveModeActive () {
		return !!this.pnl.hasClass(`panel-mode-move`);
	}

	setMoveModeActive (val) {
		if (val) this.joyMenu.doShow();
		else this.joyMenu.doHide();

		this.pnl.toggleClass(`panel-mode-move`, val);
		this.pnl.findAll(`.panel-control-bar`).forEach(ele => ele.toggleClass("move-expand-active", val));
	}

	render () {
		const doApplyPosCss = (ele) => {
			// indexed from 1 instead of zero...
			return ele.css({
				gridColumnStart: String(this.x + 1),
				gridColumnEnd: String(this.x + 1 + this.width),

				gridRowStart: String(this.y + 1),
				gridRowEnd: String(this.y + 1 + this.height),
			});
		};

		const pOpenAddMenu = async () => {
			this.board.menu.doOpen();
			this.board.menu.setPanel(this);
			if (!this.board.menu.hasActiveTab()) await this.board.menu.pSetFirstTabActive();
			else if (this.board.menu.getActiveTab().pDoTransitionActive) await this.board.menu.getActiveTab().pDoTransitionActive();
		};

		const doInitialRender = () => {
			const pnl = ee`<div data-panelId="${this.id}" class="dm-screen-panel min-w-0 min-h-0" empty="true"></div>`;
			this.pnl = pnl;
			const ctrlBar = ee`<div class="panel-control-bar"></div>`.appendTo(pnl);
			this.pnlTitle = ee`<div class="panel-control-bar panel-control-title"></div>`.appendTo(pnl).onn("click", () => this.pnlTitle.toggleClass("panel-control-title--bumped"));
			this.pnlAddTab = ee`<div class="panel-control-bar panel-control-addtab"><div class="panel-control-icon glyphicon glyphicon-plus" title="Add Tab"></div></div>`
				.onn("click", async () => {
					this.setIsTabs(true);
					this.setDirty(true);
					this.render();
					await pOpenAddMenu();
				})
				.appendTo(pnl);

			const ctrlMove = ee`<div class="panel-control-icon glyphicon glyphicon-move" title="Move"></div>`.appendTo(ctrlBar);
			ctrlMove.onn("click", () => {
				this.setMoveModeActive(!this.getIsMoveModeActive());
			});
			const ctrlEmpty = ee`<div class="panel-control-icon glyphicon glyphicon-remove" title="Close"></div>`.appendTo(ctrlBar);
			ctrlEmpty.onn("click", () => {
				this.getReplacementPanel();
			});

			const joyMenu = new DmScreenJoystickMenu(this.board, this);
			this.joyMenu = joyMenu;
			joyMenu.initialise();

			const wrpContent = ee`<div class="panel-content-wrapper"></div>`.appendTo(pnl);
			const wrpBtnAdd = ee`<div class="panel-add"></div>`.appendTo(wrpContent);
			const btnAdd = ee`<span class="ve-btn-panel-add glyphicon glyphicon-plus"></span>`
				.onn("click", async () => {
					await pOpenAddMenu();
				})
				.onn("drop", async evt => {
					const data = EventUtil.getDropJson(evt);
					if (!data) return;

					if (data.type !== VeCt.DRAG_TYPE_IMPORT) return;

					evt.stopPropagation();
					evt.preventDefault();

					const {page, source, hash} = data;
					// FIXME(Future) "Stats" may not be the correct panel type, but works in most useful cases
					this.doPopulate_Stats(page, source, hash);
				})
				.appendTo(wrpBtnAdd);
			this.btnAdd = wrpBtnAdd;
			this.btnAddInner = btnAdd;
			this.pnlWrpContent = wrpContent;

			const wrpTabs = ee`<div class="content-tab-bar ve-flex"></div>`.hideVe().appendTo(pnl);
			const wrpTabsInner = ee`<div class="content-tab-bar-inner"></div>`.onn("wheel", (evt) => {
				const delta = evt.deltaY;
				const curr = wrpTabsInner.scrollLeft();
				wrpTabsInner.scrollLeft(Math.max(0, curr + delta));
			}).appendTo(wrpTabs);
			const btnTabAdd = ee`<button class="ve-btn ve-btn-default content-tab" title="Add Tab"><span class="glyphicon glyphicon-plus"></span></button>`
				.onn("click", () => pOpenAddMenu())
				.appendTo(wrpTabsInner);
			this.pnlWrpTabs = wrpTabs;
			this.pnlTabs = wrpTabsInner;

			if (this.eleContent) wrpContent.appends(this.eleContent);

			doApplyPosCss(pnl).appendTo(this.board.getEleScreen());
			this.isDirty = false;
		};

		if (this.isDirty) {
			if (!this.pnl) doInitialRender();
			else {
				doApplyPosCss(this.pnl);
				this.doRenderTitle();
				this.doRenderTabs();

				if (this.isContentDirty) {
					this.pnlWrpContent.clear();
					if (this.eleContent) this.pnlWrpContent.appends(this.eleContent);
					this.isContentDirty = false;
				}
			}
			this.isDirty = false;
		}
	}

	getPos () {
		const offset = this.pnl.getBoundingClientRect().toJSON();
		return {
			top: offset.top,
			left: offset.left,
			width: this.pnl.outerWidthe(),
			height: this.pnl.outerHeighte(),
		};
	}

	getAddButtonPos () {
		const offset = this.btnAddInner.getBoundingClientRect().toJSON();
		return {
			top: offset.top,
			left: offset.left,
			width: this.btnAddInner.outerWidthe(),
			height: this.btnAddInner.outerHeighte(),
		};
	}

	doCloseTab (ixOpt) {
		if (this.isTabs) {
			this.closeTabContent(ixOpt);
		}

		const activeTabs = this.tabDatas.filter(it => !it.isDeleted).length;

		if (activeTabs === 1) { // if there is only one active tab remaining, remove the tab bar
			this.setIsTabs(false);
		} else if (activeTabs === 0) {
			const replacement = new Panel(this.board, this.x, this.y, this.width, this.height);
			this.exile();
			this.board.addPanel(replacement);
			this.board.doCheckFillSpaces();
		}
	}

	closeTabContent (ixOpt = 0) {
		return this.setTab({
			ix: -1 * (ixOpt + 1),
			type: PANEL_TYP_EMPTY,
			contentMeta: null,
			panelApp: null,
			eleContent: null,
			title: null,
			tabCanRename: false,
		});
	}

	setEleContent (type, contentMeta, eleContent, title, tabCanRename, tabRenamed) {
		this.type = type;
		this.contentMeta = contentMeta;
		this.eleContent = eleContent;
		this.title = title;
		this.tabCanRename = tabCanRename;
		this.tabRenamed = tabRenamed;

		if (eleContent === null) {
			this.pnlWrpContent.childrene().forEach(ele => ele.detach());
			this.pnlWrpContent.appends(this.btnAdd);
		} else {
			this.btnAdd.detach(); // preserve the "add panel" controls so we can re-attach them later if the panel empties
			this.pnlWrpContent.findAll(`.ui-search__message.loading-spinner`).forEach(ele => ele.remove()); // clean up any temp "loading" panels
			this.pnlWrpContent.childrene().forEach(ele => ele.addClass("dms__tab_hidden"));
			eleContent.removeClass("dms__tab_hidden");
			if (!this.pnlWrpContent.contains(eleContent)) this.pnlWrpContent.appends(eleContent);
		}

		this.pnl.attr("empty", !eleContent);
		this.doRenderTitle();
		this.doRenderTabs();
	}

	setFromPeer ({hisMeta, hisContent, isMoveModeActive}) {
		this.isTabs = hisMeta.isTabs;
		this.tabIndex = hisMeta.tabIndex;
		this.tabDatas = hisMeta.tabDatas;
		this.tabCanRename = hisMeta.tabCanRename;
		this.tabRenamed = hisMeta.tabRenamed;

		this.setTab({
			ix: hisMeta.tabIndex,
			type: hisMeta.type,
			contentMeta: hisMeta.contentMeta,
			panelApp: hisMeta.tabDatas[hisMeta.tabIndex]?.panelApp,
			eleContent: hisContent,
			title: hisMeta.title,
			tabCanRename: hisMeta.tabCanRename,
			tabRenamed: hisMeta.tabRenamed,
		});
		hisMeta.tabDatas
			.forEach((it, ix) => {
				if (!it.isDeleted && it.tabButton) {
					// regenerate tab buttons to refer to the correct tab
					it.tabButton.remove();
					it.tabButton = this._getBtnSelTab(ix, it.title);
					this.pnlTabs.childrene().last().beforee(it.tabButton);
				}
			});

		this.setMoveModeActive(isMoveModeActive);
	}

	getNextTabIndex () {
		return this.tabDatas.length;
	}

	setTabLoading (type, contentMeta) {
		return this.setEleContentTab({
			panelType: type,
			contentMeta: contentMeta,
			eleContent: Panel._getEleLoading(),
			title: TITLE_LOADING,
		});
	}

	_getBtnSelTab (ix, title) {
		title = title || "[Untitled]";

		const doCloseTabWithConfirmation = async () => {
			if (this.board.getConfirmTabClose()) {
				if (!await InputUiUtil.pGetUserBoolean({title: "Close Tab", htmlDescription: `Are you sure you want to close tab "${this.tabDatas[ix].title}"?`, textYes: "Yes", textNo: "Cancel"})) return;
			}
			this.doCloseTab(ix);
		};

		const btnCloseTab = ee`<span class="glyphicon glyphicon-remove content-tab-remove"></span>`
			.onn("mousedown", async (evt) => {
				if (evt.button === 0) {
					evt.stopPropagation();
					await doCloseTabWithConfirmation();
				}
			});

		const btnSelTab = ee`<span class="ve-btn ve-btn-default content-tab ve-flex"><span class="content-tab-title ve-overflow-ellipsis" title="${title}">${title}</span>${btnCloseTab}</span>`
			.onn("mousedown", async (evt) => {
				if (evt.button === 0) {
					this.setActiveTab(ix);
				} else if (evt.button === 1) {
					await doCloseTabWithConfirmation();
				}
			})
			.onn("contextmenu", async (evt) => {
				evt.stopPropagation();
				evt.preventDefault();

				if (!this.tabDatas[ix].tabCanRename) return;

				const existingTitle = this.getTabTitle(ix) || "";
				const nuTitle = await InputUiUtil.pGetUserString({default: existingTitle, title: "Rename Tab"});
				if (nuTitle && nuTitle.trim()) {
					this.setTabTitle(ix, nuTitle);
				}
			});

		return btnSelTab;
	}

	getTabTitle (ix) {
		return (this.tabDatas[ix] || {}).title;
	}

	setTabTitle (ix, nuTitle) {
		const tabData = this.tabDatas[ix];

		tabData.tabButton.find(`.content-tab-title`).txt(nuTitle || "").tooltip(nuTitle);
		this._doUpdatePanelTitleDisplay(nuTitle);
		const x = this.tabDatas[ix];
		x.title = nuTitle;
		x.tabRenamed = true;
		if (this.tabIndex === ix) {
			this.title = nuTitle;
			this.tabRenamed = true;
		}
		this.board.doSaveStateDebounced();
	}

	_doUpdatePanelTitleDisplay (nuTitle) {
		nuTitle = Renderer.stripTags(nuTitle);
		this.pnlTitle.txt(nuTitle);
		this.pnl.attr("data-roll-name-ancestor-roller", nuTitle);
	}

	setTab (
		{
			ix,
			type,
			contentMeta,
			panelApp,
			eleContent,
			title,
			tabCanRename,
			tabRenamed,
		},
	) {
		if (ix === null) ix = 0;
		if (ix < 0) {
			const ixPos = Math.abs(ix + 1);
			const td = this.tabDatas[ixPos];
			if (td) {
				td.isDeleted = true;
				if (td.tabButton) td.tabButton.detach();
			}
		} else {
			const btnOld = (this.tabDatas[ix] || {}).tabButton; // preserve tab button
			this.tabDatas[ix] = {
				type: type,
				contentMeta: contentMeta,
				panelApp,
				eleContent: eleContent,
				title: title,
				tabCanRename: !!tabCanRename,
				tabRenamed: !!tabRenamed,
			};
			if (btnOld) this.tabDatas[ix].tabButton = btnOld;

			const doAddbtnSelTab = (ix, title) => {
				const btnSelTab = this._getBtnSelTab(ix, title);
				this.pnlTabs.childrene().last().before(btnSelTab);
				return btnSelTab;
			};

			if (!this.tabDatas[ix].tabButton) this.tabDatas[ix].tabButton = doAddbtnSelTab(ix, title);
			else this.tabDatas[ix].tabButton.find(`.content-tab-title`).txt(title).tooltip(title);
		}

		this.setActiveTab(ix);
		return ix;
	}

	setActiveTab (ix) {
		if (ix < 0) {
			const handleNoTabs = () => {
				this.isTabs = false;
				this.tabIndex = 0;
				this.tabCanRename = false;
				this.tabRenamed = false;
				this.setEleContent(PANEL_TYP_EMPTY, null, null, null, false);
			};

			if (this.isTabs) {
				const prevTabIx = this.tabDatas.findIndex(it => !it.isDeleted);
				if (~prevTabIx) {
					this.setActiveTab(prevTabIx);
				} else handleNoTabs();
			} else handleNoTabs();
		} else {
			this.tabIndex = ix;
			const tabData = this.tabDatas[ix];
			this.setEleContent(tabData.type, tabData.contentMeta, tabData.eleContent, tabData.title, tabData.tabCanRename, tabData.tabRenamed);
		}
		this.board.doSaveStateDebounced();
	}

	getContentWrapper () {
		return this.pnlWrpContent;
	}

	getEleContent () {
		return this.eleContent;
	}

	exile () {
		if (Panel.isNonExilableType(this.type)) this.destroy();
		else {
			if (this.pnl) this.pnl.detach();
			this.board.exilePanel(this.id);
		}
	}

	destroy () {
		// do cleanup
		if (this.type === PANEL_TYP_ROLLBOX) Renderer.dice.unbindDmScreenPanel();

		const fnsOnDestroy = this.tabDatas
			.filter(tabData => tabData?.panelApp?.onDestroy)
			.map(tabData => tabData.panelApp.onDestroy.bind(tabData.panelApp));

		if (this.pnl) this.pnl.remove();
		this.joyMenu?.destroy();
		this.board.destroyPanel(this.id);

		fnsOnDestroy
			.forEach(fnOnDestroy => fnOnDestroy());

		this.board.fireBoardEvent({type: "panelDestroy"});
	}

	addHoverClass () {
		this.pnl.addClass("faux-hover");
	}

	removeHoverClass () {
		this.pnl.removeClass("faux-hover");
	}

	getSaveableState () {
		const out = {
			x: this.x,
			y: this.y,
			w: this.width,
			h: this.height,
			t: this.type,
		};

		const toSave = this._getSaveableState_getSaveableContent({
			type: this.type,
			contentMeta: this.contentMeta,
			panelApp: this.tabDatas[this.tabIndex]?.panelApp,
		});
		if (toSave) Object.assign(out, toSave);

		if (this.isTabs) {
			out.a = this.tabDatas.filter(it => !it.isDeleted)
				.map(td => this._getSaveableState_getSaveableContent({
					type: td.type,
					contentMeta: td.contentMeta,
					panelApp: td.panelApp,
					tabRenamed: td.tabRenamed,
					tabTitle: td.title,
				}));

			// offset saved tabindex by number of deleted tabs that come before
			let delCount = 0;
			for (let i = 0; i < this.tabIndex; ++i) {
				if (this.tabDatas[i].isDeleted) delCount++;
			}
			out.b = this.tabIndex - delCount;
		}

		return out;
	}

	_getSaveableState_getSaveableContent (
		{
			type,
			contentMeta,
			panelApp,
			tabRenamed,
			tabTitle,
		},
	) {
		const toSaveTitle = tabRenamed ? tabTitle : undefined;

		// TODO(Future) refactor other panels to use this
		const fromPcm = PanelContentManagerFactory.getSaveableContent({
			type,
			toSaveTitle,
			panelApp,
		});
		if (fromPcm !== undefined) return fromPcm;

		switch (type) {
			case PANEL_TYP_EMPTY:
				return null;

			case PANEL_TYP_ROLLBOX:
				return {
					t: type,
					r: toSaveTitle,
				};
			case PANEL_TYP_STATS:
				return {
					t: type,
					r: toSaveTitle,
					c: {
						p: contentMeta.p,
						s: contentMeta.s,
						u: contentMeta.u,
					},
				};
			case PANEL_TYP_CREATURE_SCALED_CR:
				return {
					t: type,
					r: toSaveTitle,
					c: {
						p: contentMeta.p,
						s: contentMeta.s,
						u: contentMeta.u,
						cr: contentMeta.cr,
					},
				};
			case PANEL_TYP_CREATURE_SCALED_SPELL_SUMMON:
				return {
					t: type,
					r: toSaveTitle,
					c: {
						p: contentMeta.p,
						s: contentMeta.s,
						u: contentMeta.u,
						ssl: contentMeta.ssl,
					},
				};
			case PANEL_TYP_CREATURE_SCALED_CLASS_SUMMON:
				return {
					t: type,
					r: toSaveTitle,
					c: {
						p: contentMeta.p,
						s: contentMeta.s,
						u: contentMeta.u,
						csl: contentMeta.csl,
					},
				};
			case PANEL_TYP_RULES:
				return {
					t: type,
					r: toSaveTitle,
					c: {
						b: contentMeta.b,
						c: contentMeta.c,
						h: contentMeta.h,
					},
				};
			case PANEL_TYP_ADVENTURES:
				return {
					t: type,
					r: toSaveTitle,
					c: {
						a: contentMeta.a,
						c: contentMeta.c,
					},
				};
			case PANEL_TYP_BOOKS:
				return {
					t: type,
					r: toSaveTitle,
					c: {
						b: contentMeta.b,
						c: contentMeta.c,
					},
				};
			case PANEL_TYP_TUBE:
			case PANEL_TYP_TWITCH:
			case PANEL_TYP_TWITCH_CHAT:
			case PANEL_TYP_GENERIC_EMBED:
			case PANEL_TYP_IMAGE:
				return {
					t: type,
					r: toSaveTitle,
					c: {
						u: contentMeta.u,
					},
				};
			case PANEL_TYP_ERROR:
				return {r: toSaveTitle, s: contentMeta};
			case PANEL_TYP_BLANK:
				return {r: toSaveTitle};
			default:
				throw new Error(`Unhandled panel type ${this.type}`);
		}
	}

	fireBoardEvent (boardEvt) {
		this.tabDatas
			.filter(tabData => tabData?.panelApp?.onBoardEvent)
			.map(tabData => tabData.panelApp.onBoardEvent.bind(tabData.panelApp))
			.forEach(fnOnBoardEvent => fnOnBoardEvent(boardEvt));
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
		e_(document.activeElement).blure();

		this._eleMenuInner.findAll(`.panel-addmenu-tab-head`).forEach(ele => ele.attr(`active`, false));
		if (this.activeTab) this.activeTab.getEleTab().detach();
		this.activeTab = tab;
		this.tabView.appends(tab.getEleTab());
		tab.eleHead.attr(`active`, true);

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

		this._eleMenuInner = ee`<div class="ve-flex-col w-100 h-100">`;
		const tabBar = ee`<div class="panel-addmenu-bar"></div>`.appendTo(this._eleMenuInner);
		this.tabView = ee`<div class="panel-addmenu-view"></div>`.appendTo(this._eleMenuInner);

		await this.tabs.pMap(t => t.pRender());

		this.tabs
			.forEach(t => {
				t.eleHead = ee`<button class="ve-btn ve-btn-default panel-addmenu-tab-head">${t.label}</button>`.appendTo(tabBar);
				ee`<div class="panel-addmenu-tab-body"></div>`.appendTo(tabBar);
				t.eleHead.onn("click", () => this.pSetActiveTab(t));
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
				this._eleMenuInner.detach();

				// undo entering "tabbed mode" if we close without adding a tab
				if (this.pnl.isTabs && this.pnl.tabDatas.filter(it => !it.isDeleted).length === 1) {
					this.pnl.setIsTabs(false);
				}
			},
			zIndex: VeCt.Z_INDEX_BENEATH_HOVER,
		});
		this._doClose = doClose;
		eleModalInner.appends(this._eleMenuInner);
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

	genTabId (type) {
		return `tab-${type}-${this.label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "_")}`;
	}

	setMenu (menu) {
		this.menu = menu;
	}
}

class AddMenuVideoTab extends AddMenuTab {
	constructor ({...opts}) {
		super({...opts, label: "Embed"});
		this.tabId = this.genTabId("tube");
	}

	async pRender () {
		if (!this.eleTab) {
			const eleTab = ee`<div class="ui-search__wrp-output underline-tabs" id="${this.tabId}"></div>`;

			const wrpYT = ee`<div class="ui-modal__row"></div>`.appendTo(eleTab);
			const iptUrlYT = ee`<input class="form-control" placeholder="Paste YouTube URL">`
				.onn("keydown", (e) => {
					if (e.key === "Enter") btnAddYT.trigger("click");
				})
				.appendTo(wrpYT);
			const btnAddYT = ee`<button class="ve-btn ve-btn-primary ve-btn-sm">Embed</button>`.appendTo(wrpYT);
			btnAddYT.onn("click", () => {
				let url;
				try {
					url = new URL(iptUrlYT.val().trim());
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

				if (url.searchParams.get("list")) {
					// FIXME embedding playlists *should* be possible; what gives?
					// this.menu.pnl.doPopulate_YouTube(`https://www.youtube.com/embed/${url.searchParams.get("v")}?list=${url.searchParams.get("list")}`);
					this.menu.pnl.doPopulate_YouTube(`https://www.youtube.com/embed/${url.searchParams.get("v")}`);
				} else {
					this.menu.pnl.doPopulate_YouTube(`https://www.youtube.com/embed/${url.searchParams.get("v")}`);
				}

				this.menu.doClose();
				iptUrlYT.val("");
			});

			const wrpTwitch = ee`<div class="ui-modal__row"></div>`.appendTo(eleTab);
			const iptUrlTwitch = ee`<input class="form-control" placeholder="Paste Twitch URL">`
				.onn("keydown", (e) => {
					if (e.key === "Enter") btnAddTwitch.trigger("click");
				})
				.appendTo(wrpTwitch);
			const btnAddTwitch = ee`<button class="ve-btn ve-btn-primary ve-btn-sm">Embed</button>`.appendTo(wrpTwitch);
			const btnAddTwitchChat = ee`<button class="ve-btn ve-btn-primary ve-btn-sm">Embed Chat</button>`.appendTo(wrpTwitch);
			const getTwitchM = (url) => {
				return /https?:\/\/(www\.)?twitch\.tv\/(.*?)(\?.*$|$)/.exec(url);
			};
			btnAddTwitch.onn("click", () => {
				let url = iptUrlTwitch.val().trim();
				const m = getTwitchM(url);
				if (url && m) {
					url = `http://player.twitch.tv/?channel=${m[2]}`;
					this.menu.pnl.doPopulate_Twitch(url);
					this.menu.doClose();
					iptUrlTwitch.val("");
				} else {
					JqueryUtil.doToast({
						content: `Please enter a URL of the form: "https://www.twitch.tv/XXXXXX"`,
						type: "danger",
					});
				}
			});

			btnAddTwitchChat.onn("click", () => {
				let url = iptUrlTwitch.val().trim();
				const m = getTwitchM(url);
				if (url && m) {
					url = `https://www.twitch.tv/embed/${m[2]}/chat`;
					this.menu.pnl.doPopulate_TwitchChat(url);
					this.menu.doClose();
					iptUrlTwitch.val("");
				} else {
					JqueryUtil.doToast({
						content: `Please enter a URL of the form: "https://www.twitch.tv/XXXXXX"`,
						type: "danger",
					});
				}
			});

			const wrpGeneric = ee`<div class="ui-modal__row"></div>`.appendTo(eleTab);
			const iptUrlGeneric = ee`<input class="form-control" placeholder="Paste any URL">`
				.onn("keydown", (e) => {
					if (e.key === "Enter") iptUrlGeneric.trigger("click");
				})
				.appendTo(wrpGeneric);
			const btnAddGeneric = ee`<button class="ve-btn ve-btn-primary ve-btn-sm">Embed</button>`.appendTo(wrpGeneric);
			btnAddGeneric.onn("click", () => {
				let url = iptUrlGeneric.val().trim();
				if (url) {
					this.menu.pnl.doPopulate_GenericEmbed(url);
					this.menu.doClose();
				} else {
					JqueryUtil.doToast({
						content: `Please enter a URL!`,
						type: "danger",
					});
				}
			});

			this.eleTab = eleTab;
		}
	}
}

class AddMenuImageTab extends AddMenuTab {
	constructor ({...opts}) {
		super({...opts, label: "Image"});
		this.tabId = this.genTabId("image");
	}

	async pRender () {
		if (!this.eleTab) {
			const eleTab = ee`<div class="ui-search__wrp-output underline-tabs" id="${this.tabId}"></div>`;

			// region Imgur
			const wrpImgur = ee`<div class="ui-modal__row"></div>`.appendTo(eleTab);
			ee`<span>Imgur (Anonymous Upload) <i class="ve-muted">(accepts <a href="https://help.imgur.com/hc/en-us/articles/26511665959579-What-files-can-I-upload-Is-there-a-size-limit" target="_blank" rel="noopener noreferrer">imgur-friendly formats</a>)</i></span>`.appendTo(wrpImgur);
			const iptFile = ee`<input type="file" class="hidden">`
				.onn("change", (evt) => {
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
				.appendTo(eleTab);
			const btnAdd = ee`<button class="ve-btn ve-btn-primary ve-btn-sm">Upload</button>`
				.appendTo(wrpImgur)
				.onn("click", () => {
					iptFile.trigger("click");
				});
			// endregion

			// region URL
			const wrpUtl = ee`<div class="ui-modal__row"></div>`.appendTo(eleTab);
			const iptUrl = ee`<input class="form-control" placeholder="Paste image URL">`
				.onn("keydown", (e) => {
					if (e.key === "Enter") btnAddUrl.trigger("click");
				})
				.appendTo(wrpUtl);
			const btnAddUrl = ee`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`.appendTo(wrpUtl);
			btnAddUrl.onn("click", () => {
				let url = iptUrl.val().trim();
				if (url) {
					this.menu.pnl.doPopulate_Image(url);
					this.menu.doClose();
				} else {
					JqueryUtil.doToast({
						content: `Please enter a URL!`,
						type: "danger",
					});
				}
			});
			// endregion

			ee`<hr class="hr-2">`.appendTo(eleTab);

			// region Adventure dynamic viewer
			const btnSelectAdventure = ee`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`
				.onn("click", () => DmMapper.pHandleMenuButtonClick(this.menu));

			ee`<div class="ui-modal__row">
				<div>Adventure/Book Map Dynamic Viewer</div>
				${btnSelectAdventure}
			</div>`.appendTo(eleTab);
			// endregion

			this.eleTab = eleTab;
		}
	}
}

class AddMenuSpecialTab extends AddMenuTab {
	constructor ({...opts}) {
		super({...opts, label: "Special"});
		this.tabId = this.genTabId("special");
	}

	async pRender () {
		if (!this.eleTab) {
			const eleTab = ee`<div class="ui-search__wrp-output underline-tabs ve-overflow-y-auto pr-1" id="${this.tabId}"></div>`;

			const wrpRoller = ee`<div class="ui-modal__row"><span>Dice Roller <i class="ve-muted">(pins the existing dice roller to a panel)</i></span></div>`.appendTo(eleTab);
			const btnRoller = ee`<button class="ve-btn ve-btn-primary ve-btn-sm">Pin</button>`.appendTo(wrpRoller);
			btnRoller.onn("click", () => {
				Renderer.dice.bindDmScreenPanel(this.menu.pnl);
				this.menu.doClose();
			});
			ee`<hr class="hr-2">`.appendTo(eleTab);

			const btnTracker = ee`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`
				.onn("click", async () => {
					const pcm = new PanelContentManager_InitiativeTracker({board: this._board, panel: this.menu.pnl});
					await pcm.pDoPopulate();
					this.menu.doClose();
				});

			ee`<div class="ui-modal__row">
			<span>Initiative Tracker</span>
			${btnTracker}
			</div>`.appendTo(eleTab);

			const btnTrackerCreatureViewer = ee`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`
				.onn("click", async () => {
					const pcm = new PanelContentManager_InitiativeTrackerCreatureViewer({board: this._board, panel: this.menu.pnl});
					await pcm.pDoPopulate();
					this.menu.doClose();
				});

			ee`<div class="ui-modal__row">
			<span>Initiative Tracker Creature Viewer</span>
			${btnTrackerCreatureViewer}
			</div>`.appendTo(eleTab);

			const btnPlayerTrackerV1 = ee`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`
				.onn("click", async () => {
					const pcm = new PanelContentManager_InitiativeTrackerPlayerViewV1({board: this._board, panel: this.menu.pnl});
					await pcm.pDoPopulate();
					this.menu.doClose();
				});

			ee`<div class="ui-modal__row">
			<span>Initiative Tracker Player View (Standard)</span>
			${btnPlayerTrackerV1}
			</div>`.appendTo(eleTab);

			const btnPlayerTrackerV0 = ee`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`
				.onn("click", async () => {
					const pcm = new PanelContentManager_InitiativeTrackerPlayerViewV0({board: this._board, panel: this.menu.pnl});
					await pcm.pDoPopulate();
					this.menu.doClose();
				});

			ee`<div class="ui-modal__row">
			<span>Initiative Tracker Player View (Manual/Legacy)</span>
			${btnPlayerTrackerV0}
			</div>`.appendTo(eleTab);

			ee`<hr class="hr-2">`.appendTo(eleTab);

			const btnSublist = ee`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`
				.onn("click", async evt => {
					await this.menu.pnl.pDoMassPopulate_Entities(evt);
					this.menu.doClose();
				});

			ee`<div class="ui-modal__row">
			<span title="Including, but not limited to, a Bestiary Encounter.">Pinned List Entries</span>
			${btnSublist}
			</div>`.appendTo(eleTab);

			ee`<hr class="hr-2">`.appendTo(eleTab);

			const btnSwitchToEmbedTag = ee`<button class="ve-btn ve-btn-default ve-btn-xxs">embed</button>`
				.onn("click", async () => {
					await this.menu.pSetActiveTab(this.menu.getTab({label: "Embed"}));
				});

			const wrpText = ee`<div class="ui-modal__row"><span>Basic Text Box <i class="ve-muted">(for a feature-rich editor, ${btnSwitchToEmbedTag} a Google Doc or similar)</i></span></div>`.appendTo(eleTab);
			const btnText = ee`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`.appendTo(wrpText);
			btnText.onn("click", async () => {
				const pcm = new PanelContentManager_NoteBox({board: this._board, panel: this.menu.pnl});
				await pcm.pDoPopulate();
				this.menu.doClose();
			});
			ee`<hr class="hr-2">`.appendTo(eleTab);

			const wrpUnitConverter = ee`<div class="ui-modal__row"><span>Unit Converter</span></div>`.appendTo(eleTab);
			const btnUnitConverter = ee`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`.appendTo(wrpUnitConverter);
			btnUnitConverter.onn("click", async () => {
				const pcm = new PanelContentManager_UnitConverter({board: this._board, panel: this.menu.pnl});
				await pcm.pDoPopulate();
				this.menu.doClose();
			});

			const wrpMoneyConverter = ee`<div class="ui-modal__row"><span>Coin Converter</span></div>`.appendTo(eleTab);
			const btnMoneyConverter = ee`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`.appendTo(wrpMoneyConverter);
			btnMoneyConverter.onn("click", async () => {
				const pcm = new PanelContentManager_MoneyConverter({board: this._board, panel: this.menu.pnl});
				await pcm.pDoPopulate();
				this.menu.doClose();
			});

			const wrpCounter = ee`<div class="ui-modal__row"><span>Counter</span></div>`.appendTo(eleTab);
			const btnCounter = ee`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`.appendTo(wrpCounter);
			btnCounter.onn("click", async () => {
				const pcm = new PanelContentManager_Counter({board: this._board, panel: this.menu.pnl});
				await pcm.pDoPopulate();
				this.menu.doClose();
			});

			ee`<hr class="hr-2">`.appendTo(eleTab);

			const wrpTimeTracker = ee`<div class="ui-modal__row"><span>In-Game Clock/Calendar</span></div>`.appendTo(eleTab);
			const btnTimeTracker = ee`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`.appendTo(wrpTimeTracker);
			btnTimeTracker.onn("click", async () => {
				const pcm = new PanelContentManager_TimeTracker({board: this._board, panel: this.menu.pnl});
				await pcm.pDoPopulate();
				this.menu.doClose();
			});

			ee`<hr class="hr-2">`.appendTo(eleTab);

			const wrpBlank = ee`<div class="ui-modal__row"><span class="help" title="For those who don't like plus signs.">Blank Space</span></div>`.appendTo(eleTab);
			ee`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`
				.onn("click", () => {
					this.menu.pnl.doPopulate_Blank();
					this.menu.doClose();
				})
				.appendTo(wrpBlank);

			this.eleTab = eleTab;
		}
	}
}

class AddMenuSearchTab extends AddMenuTab {
	static _getTitle (subType) {
		switch (subType) {
			case "content": return "Content";
			case "rule": return "Rules";
			case "adventure": return "Adventures";
			case "book": return "Books";
			default: throw new Error(`Unhandled search tab subtype: "${subType}"`);
		}
	}

	/**
	 * @param {?object} indexes
	 * @param {?string} subType
	 * @param {?object} adventureOrBookIdToSource
	 * @param opts
	 */
	constructor ({indexes, subType = "content", adventureOrBookIdToSource = null, ...opts}) {
		super({...opts, label: AddMenuSearchTab._getTitle(subType)});
		this.tabId = this.genTabId(subType);
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
			case "content": return ee`
				<div class="ui-search__row" tabindex="0">
					<span><span class="ve-muted">${r.doc.cf}</span> ${r.doc.n}</span>
					<span>${r.doc.s ? `<i title="${Parser.sourceJsonToFull(r.doc.s)}">${Parser.sourceJsonToAbv(r.doc.s)}${r.doc.p ? ` p${r.doc.p}` : ""}</i>` : ""}</span>
				</div>
			`;
			case "rule": return ee`
				<div class="ui-search__row" tabindex="0">
					<span>${r.doc.h}</span>
					<span><i>${r.doc.n}, ${r.doc.s}</i></span>
				</div>
			`;
			case "adventure":
			case "book": return ee`
				<div class="ui-search__row" tabindex="0">
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
			this.wrpResults.empty().appends(SearchWidget.getSearchEnter());
		};

		const showMsgDots = () => {
			this.wrpResults.empty().appends(SearchWidget.getSearchLoading());
		};

		const showNoResults = () => {
			flags.isWait = true;
			this.wrpResults.empty().appends(SearchWidget.getSearchEnter());
		};

		this._ptrRows = {_: []};

		this._pDoSearch = async () => {
			const searchTerm = this.iptSearch.val().trim();

			const searchOptions = this._getSearchOptions();
			const index = this.indexes[this.cat];
			let results = index.search(searchTerm, searchOptions);

			if (this.subType === "content") {
				results = await OmnisearchBacking.pGetFilteredResults(results, {searchTerm});
			}

			const resultCount = results.length ? results.length : index.documentStore.length;
			const toProcess = results.length ? results : Object.values(index.documentStore.docs).slice(0, UiUtil.SEARCH_RESULTS_CAP).map(it => ({doc: it}));

			this.wrpResults.empty();
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
					const row = this._getRow(r).appendTo(this.wrpResults);
					SearchWidget.bindRowHandlers({result: r, row, ptrRows: this._ptrRows, fnHandleClick: handleClick, iptSearch: this.iptSearch});
					this._ptrRows._.push(row);
				});

				if (resultCount > UiUtil.SEARCH_RESULTS_CAP) {
					const diff = resultCount - UiUtil.SEARCH_RESULTS_CAP;
					this.wrpResults.appends(`<div class="ui-search__row ui-search__row--readonly">...${diff} more result${diff === 1 ? " was" : "s were"} hidden. Refine your search!</div>`);
				}
			} else {
				if (!searchTerm.trim()) this.showMsgIpt();
				else showNoResults();
			}
		};

		if (!this.eleTab) {
			const eleTab = ee`<div class="ui-search__wrp-output" id="${this.tabId}"></div>`;
			const wrpCtrls = ee`<div class="ui-search__wrp-controls ui-search__wrp-controls--in-tabs"></div>`.appendTo(eleTab);

			const selCat = ee`
				<select class="form-control ui-search__sel-category">
					<option value="ALL">${this._getAllTitle()}</option>
				</select>
			`.appendTo(wrpCtrls).toggleVe(Object.keys(this.indexes).length !== 1);
			Object.keys(this.indexes).sort().filter(it => it !== "ALL").forEach(it => {
				selCat.appends(`<option value="${it}">${this._getCatOptionText(it)}</option>`);
			});
			selCat.onn("change", async () => {
				this.cat = selCat.val();
				await this._pDoSearch();
			});

			const iptSearch = ee`<input class="ui-search__ipt-search search form-control" autocomplete="off" placeholder="Search...">`.appendTo(wrpCtrls);
			const wrpResults = ee`<div class="ui-search__wrp-results"></div>`.appendTo(eleTab);

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
		this.iptSearch.val("").focuse();
		if (this._pDoSearch) await this._pDoSearch();
	}
}

class RuleLoader {
	static async pFill (book) {
		const eeEle = RuleLoader.cache;
		if (eeEle[book]) return eeEle[book];

		const data = await DataUtil.loadJSON(`data/generated/${book}.json`);
		Object.keys(data.data).forEach(b => {
			const ref = data.data[b];
			if (!eeEle[b]) eeEle[b] = {};
			ref.forEach((c, i) => {
				if (!eeEle[b][i]) eeEle[b][i] = {};
				c.entries.forEach(s => {
					eeEle[b][i][s.name] = s;
				});
			});
		});
	}

	static getFromCache (book, chapter, header) {
		return RuleLoader.cache[book][chapter][header];
	}
}
RuleLoader.cache = {};

class AdventureOrBookLoader {
	constructor (type) {
		this._type = type;
		this._cache = {};
		this._pLoadings = {};
		this._availableOfficial = new Set();

		this._indexOfficial = null;
	}

	async pInit () {
		const indexPath = this._getIndexPath();
		this._indexOfficial = await DataUtil.loadJSON(indexPath);
		this._indexOfficial[this._type].forEach(meta => this._availableOfficial.add(meta.id.toLowerCase()));
	}

	_getIndexPath () {
		switch (this._type) {
			case "adventure": return `${Renderer.get().baseUrl}data/adventures.json`;
			case "book": return `${Renderer.get().baseUrl}data/books.json`;
			default: throw new Error(`Unknown loader type "${this._type}"`);
		}
	}

	_getJsonPath (bookOrAdventure) {
		switch (this._type) {
			case "adventure": return `${Renderer.get().baseUrl}data/adventure/adventure-${bookOrAdventure.toLowerCase()}.json`;
			case "book": return `${Renderer.get().baseUrl}data/book/book-${bookOrAdventure.toLowerCase()}.json`;
			default: throw new Error(`Unknown loader type "${this._type}"`);
		}
	}

	async _pGetPrereleaseData ({advBookId, prop}) {
		return this._pGetPrereleaseBrewData({advBookId, prop, brewUtil: PrereleaseUtil});
	}

	async _pGetBrewData ({advBookId, prop}) {
		return this._pGetPrereleaseBrewData({advBookId, prop, brewUtil: BrewUtil2});
	}

	async _pGetPrereleaseBrewData ({advBookId, prop, brewUtil}) {
		const searchFor = advBookId.toLowerCase();
		const brew = await brewUtil.pGetBrewProcessed();
		switch (this._type) {
			case "adventure":
			case "book": {
				return (brew[prop] || []).find(it => it.id.toLowerCase() === searchFor);
			}
			default: throw new Error(`Unknown loader type "${this._type}"`);
		}
	}

	async pFill (advBookId) {
		if (!this._pLoadings[advBookId]) {
			this._pLoadings[advBookId] = (async () => {
				this._cache[advBookId] = {};

				let head, body;
				if (this._availableOfficial.has(advBookId.toLowerCase())) {
					head = this._indexOfficial[this._type].find(it => it.id.toLowerCase() === advBookId.toLowerCase());
					body = await DataUtil.loadJSON(this._getJsonPath(advBookId));
				} else {
					head = await this._pGetBrewData({advBookId, prop: this._type});
					body = await this._pGetBrewData({advBookId, prop: `${this._type}Data`});
				}
				if (!head || !body) return;

				this._cache[advBookId] = {head, chapters: {}};
				body.data.forEach((chap, i) => this._cache[advBookId].chapters[i] = chap);
			})();
		}
		await this._pLoadings[advBookId];
	}

	getFromCache (adventure, chapter, {isAllowMissing = false} = {}) {
		const outHead = this._cache?.[adventure]?.head;
		const outBody = this._cache?.[adventure]?.chapters?.[chapter];
		if (outHead && outBody) return {chapter: outBody, head: outHead};
		if (isAllowMissing) return null;
		return {chapter: MiscUtil.copy(AdventureOrBookLoader._NOT_FOUND), head: {source: VeCt.STR_GENERIC, id: VeCt.STR_GENERIC}};
	}
}
AdventureOrBookLoader._NOT_FOUND = {
	type: "section",
	name: "(Missing Content)",
	entries: [
		"The content you attempted to load could not be found. Is it homebrew, and not currently loaded?",
	],
};

class AdventureLoader extends AdventureOrBookLoader { constructor () { super("adventure"); } }
class BookLoader extends AdventureOrBookLoader { constructor () { super("book"); } }

const adventureLoader = new AdventureLoader();
const bookLoader = new BookLoader();

class AdventureOrBookView {
	constructor (prop, panel, loader, tabIx, contentMeta) {
		this._prop = prop;
		this._panel = panel;
		this._loader = loader;
		this._tabIx = tabIx;
		this._contentMeta = contentMeta;

		this._wrpContent = null;
		this._wrpContentOuter = null;
		this._titlePrev = null;
		this._titleNext = null;
	}

	getEle () {
		this._titlePrev = ee`<div class="dm-book__controls-title ve-overflow-ellipsis ve-text-right"></div>`;
		this._titleNext = ee`<div class="dm-book__controls-title ve-overflow-ellipsis"></div>`;

		const btnPrev = ee`<button class="ve-btn ve-btn-xs ve-btn-default mr-2" title="Previous Chapter"><span class="glyphicon glyphicon-chevron-left"></span></button>`
			.onn("click", () => this._handleButtonClick(-1));
		const btnNext = ee`<button class="ve-btn ve-btn-xs ve-btn-default" title="Next Chapter"><span class="glyphicon glyphicon-chevron-right"></span></button>`
			.onn("click", () => this._handleButtonClick(1));

		this._wrpContent = ee`<div class="h-100"></div>`;
		this._wrpContentOuter = ee`<div class="h-100 dm-book__wrp-content">
			<table class="w-100 stats stats--book stats--book-hover"><tr><td colspan="6" class="pb-3">${this._wrpContent}</td></tr></table>
		</div>`;

		const wrp = ee`<div class="ve-flex-col h-100">
		${this._wrpContentOuter}
		<div class="ve-flex no-shrink dm-book__wrp-controls">${this._titlePrev}${btnPrev}${btnNext}${this._titleNext}</div>
		</div>`;

		// assumes the data has already been loaded/cached
		this._render();

		return wrp;
	}

	_handleButtonClick (direction) {
		this._contentMeta.c += direction;
		const hasRenderedData = this._render({isSkipMissingData: true});
		if (!hasRenderedData) this._contentMeta.c -= direction;
		else {
			this._wrpContentOuter.scrollTope(0);
			this._panel.board.doSaveStateDebounced();
		}
	}

	_getData (chapter, {isAllowMissing = false} = {}) {
		return this._loader.getFromCache(this._contentMeta[this._prop], chapter, {isAllowMissing});
	}

	static _PROP_TO_URL = {
		"a": UrlUtil.PG_ADVENTURE,
		"b": UrlUtil.PG_BOOK,
	};

	_render ({isSkipMissingData = false} = {}) {
		const hasData = !!this._getData(this._contentMeta.c, {isAllowMissing: true});
		if (!hasData && isSkipMissingData) return false;

		const {head, chapter} = this._getData(this._contentMeta.c);

		this._panel.setTabTitle(this._tabIx, chapter.name);
		const stack = [];
		const page = this.constructor._PROP_TO_URL[this._prop];
		Renderer
			.get()
			.setFirstSection(true)
			.recursiveRender(
				chapter,
				stack,
				{
					adventureBookPage: page,
					adventureBookSource: head.source,
					adventureBookHash: UrlUtil.URL_TO_HASH_BUILDER[page]({id: this._contentMeta[this._prop]}),
				},
			);
		this._wrpContent.empty().html(stack);

		const dataPrev = this._getData(this._contentMeta.c - 1, {isAllowMissing: true});
		const dataNext = this._getData(this._contentMeta.c + 1, {isAllowMissing: true});
		this._titlePrev.txt(dataPrev?.name || "").tooltip(dataPrev?.name || "");
		this._titleNext.txt(dataNext?.name || "").tooltip(dataNext?.name || "");

		return hasData;
	}
}

window.addEventListener("load", () => {
	// expose it for dbg purposes
	window.DM_SCREEN = new Board();
	Renderer.hover.bindDmScreen(window.DM_SCREEN);
	window.DM_SCREEN.pInitialise()
		.catch(err => {
			JqueryUtil.doToast({content: `Failed to load with error "${err.message}". ${VeCt.STR_SEE_CONSOLE}`, type: "danger"});
			es(`.dm-screen-loading`).find(`.initial-message`).txt("Failed!");
			setTimeout(() => { throw err; });
		});
});
