import {
	PANEL_TYP_EMPTY,
	PANEL_TYP_STATS,
	PANEL_TYP_ROLLBOX,
	PANEL_TYP_TEXTBOX,
	PANEL_TYP_RULES,
	PANEL_TYP_UNIT_CONVERTER,
	PANEL_TYP_CREATURE_SCALED_CR,
	PANEL_TYP_CREATURE_SCALED_SPELL_SUMMON,
	PANEL_TYP_CREATURE_SCALED_CLASS_SUMMON,
	PANEL_TYP_TIME_TRACKER,
	PANEL_TYP_MONEY_CONVERTER,
	PANEL_TYP_TUBE,
	PANEL_TYP_TWITCH,
	PANEL_TYP_TWITCH_CHAT,
	PANEL_TYP_ADVENTURES,
	PANEL_TYP_BOOKS,
	PANEL_TYP_COUNTER,
	PANEL_TYP_IMAGE,
	PANEL_TYP_ADVENTURE_DYNAMIC_MAP,
	PANEL_TYP_GENERIC_EMBED,
	PANEL_TYP_ERROR,
	PANEL_TYP_BLANK,
} from "./dmscreen/dmscreen-consts.js";
import {DmMapper} from "./dmscreen/dmscreen-mapper.js";
import {MoneyConverter} from "./dmscreen/dmscreen-moneyconverter.js";
import {
	TimerTrackerMoonSpriteLoader,
	TimeTracker,
} from "./dmscreen/dmscreen-timetracker.js";
import {Counter} from "./dmscreen/dmscreen-counter.js";
import {
	PanelContentManager_InitiativeTracker,
	PanelContentManager_InitiativeTrackerCreatureViewer,
	PanelContentManager_InitiativeTrackerPlayerViewV0,
	PanelContentManager_InitiativeTrackerPlayerViewV1,
	PanelContentManagerFactory,
} from "./dmscreen/dmscreen-panels.js";

const UP = "UP";
const RIGHT = "RIGHT";
const LEFT = "LEFT";
const DOWN = "DOWN";
const AX_X = "AXIS_X";
const AX_Y = "AXIS_Y";

const EVT_NAMESPACE = ".dm_screen";

const TITLE_LOADING = "Loading...";

class Board {
	constructor () {
		this.panels = {};
		this.exiledPanels = [];
		this.$creen = $(`.dm-screen`);
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

		this.$cbConfirmTabClose = null;
		this.$btnFullscreen = null;
		this.$btnLockPanels = null;

		this._pDoSaveStateDebounced = MiscUtil.debounce(() => StorageUtil.pSet(VeCt.STORAGE_DMSCREEN, this.getSaveableState()), 25);
	}

	getInitialWidth () {
		const scW = this.$creen.width();
		return Math.floor(scW / 360);
	}

	getInitialHeight () {
		const scH = this.$creen.height();
		return Math.floor(scH / 280);
	}

	getNextId () {
		return this.nextId++;
	}

	get$creen () {
		return this.$creen;
	}

	getWidth () {
		return this.width;
	}

	getHeight () {
		return this.height;
	}

	getConfirmTabClose () {
		return this.$cbConfirmTabClose == null ? false : this.$cbConfirmTabClose.prop("checked");
	}

	setDimensions (width, height) {
		const oldWidth = this.width;
		const oldHeight = this.height;
		if (width) this.width = Math.max(width, 1);
		if (height) this.height = Math.max(height, 1);
		if (!(oldWidth === width && oldHeight === height)) {
			this.doAdjust$creenCss();
			if (width < oldWidth || height < oldHeight) this.doCullPanels(oldWidth, oldHeight);
			this.sideMenu.doUpdateDimensions();
		}
		this.doCheckFillSpaces();
		this.$creen.trigger("panelResize");
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

	doAdjust$creenCss () {
		// assumes 7px grid spacing
		this.$creen.css({
			marginTop: this.isFullscreen ? 0 : 3,
		});
	}

	getPanelDimensions () {
		const w = this.$creen.outerWidth();
		const h = this.$creen.outerHeight();
		return {
			pxWidth: w / this.width,
			pxHeight: h / this.height,
		};
	}

	doShowLoading () {
		$(`<div class="dm-screen-loading"><span class="initial-message initial-message--large">Loading...</span></div>`).css({
			gridColumnStart: "1",
			gridColumnEnd: String(this.width + 1),
			gridRowStart: "1",
			gridRowEnd: String(this.height + 1),
		}).appendTo(this.$creen);
	}

	doToggleFullscreen () {
		this.isFullscreen = !this.isFullscreen;
		$(document.body).toggleClass("is-fullscreen", this.isFullscreen);
		this.doAdjust$creenCss();
		this.doSaveStateDebounced();
		this.$creen.trigger("panelResize");
	}

	doHideLoading () {
		this.$creen.find(`.dm-screen-loading`).remove();
	}

	async pInitialise () {
		this.doAdjust$creenCss();
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

		$(document.body)
			.on("keydown", evt => {
				if (evt.key !== "Escape" || !this.isFullscreen) return;
				evt.stopPropagation();
				evt.preventDefault();
				this.doToggleFullscreen();
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
				if (chap.ordinal) chapDoc.o = Parser.bookOrdinalToAbv(chap.ordinal, true);
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

		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < this.height; ++y) {
				const pnl = this.getPanel(x, y);
				if (!pnl) {
					const nuPnl = new Panel(this, x, y);
					this.panels[nuPnl.id] = nuPnl;
					this.fireBoardEvent({type: "panelIdSetActive", payload: {type: nuPnl.type}});
					panelsToRender.push(nuPnl);
				}
			}
		}

		panelsToRender.forEach(p => p.render());
		if (!isSkipSave) this.doSaveStateDebounced();
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
		if (this.$cbConfirmTabClose) this.$cbConfirmTabClose.prop("checked", !!toLoad.ctc);
		if (this.$btnFullscreen && (toLoad.fs !== !!this.isFullscreen)) this.$btnFullscreen.click();
		if (this.$btnLockPanels && (toLoad.lk !== !!this.isLocked)) this.$btnLockPanels.click();

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

		const {$modalInner, doClose, pGetResolved} = UiUtil.getShowModal({
			isMinHeight0: true,
			isHeaderBorder: true,
			title: "Failed to Load",
			isPermanent: true,
		});

		const handleClickDownload = () => {
			DataUtil.userDownload(`dm-screen`, toLoad, {fileType: "dm-screen"});
		};

		const $btnDownload = $(`<button class="ve-btn ve-btn-sm ve-btn-primary mr-2">Download Save</button>`)
			.on("click", () => handleClickDownload());

		const handleClickPurge = async () => {
			if (!await InputUiUtil.pGetUserBoolean({title: "Purge", htmlDescription: "Are you sure?", textYes: "Yes", textNo: "Cancel"})) return;
			await StorageUtil.pRemove(VeCt.STORAGE_DMSCREEN);
			doClose(true);
		};

		const $btnPurge = $(`<button class="ve-btn ve-btn-sm ve-btn-danger">Purge and Continue</button>`)
			.on("click", () => handleClickPurge());

		const $txtDownload = $(`<b class="clickable">download a backup of your save</b>`)
			.on("click", () => handleClickDownload());
		const $txtPurge = $(`<span class="clickable text-danger">purge the save</span>`)
			.on("click", () => handleClickPurge());

		$$($modalInner)`
			<div class="py-2 w-100 h-100">
				<div class="mb-2">
					<b>Failed to load saved DM Screen.</b> ${VeCt.STR_SEE_CONSOLE}
				</div>

				<div class="mb-2">
					Please ${$txtDownload}, then ${$txtPurge} if you wish to continue.
				</div>

				<div class="mb-4">
					If you suspect this is the <span class="help" title="Spoiler: it always is">result of a bug</span>, or need help recovering lost data, drop past our <a href="https://discord.gg/5etools" target="_blank" rel="noopener noreferrer">Discord</a>.
				</div>

				<div class="ve-flex-h-right ve-flex-v-center">
					${$btnDownload}
					${$btnPurge}
				</div>
			</div>
		`;

		return pGetResolved();
	}

	doReset () {
		this.exiledPanels.forEach(p => p.destroy());
		this.exiledPanels = [];
		this.sideMenu.doUpdateHistory();
		Object.values(this.panels).forEach(p => p.destroy());
		this.panels = {};
		this.setDimensions(this.getInitialWidth(), this.getInitialHeight());
	}

	setHoveringButton (panel) {
		this.resetHoveringButton(panel);
		panel.$btnAddInner.addClass("faux-hover");
	}

	resetHoveringButton (panel) {
		Object.values(this.panels).forEach(p => {
			if (panel && panel.id === p.id) return;
			p.$btnAddInner.removeClass("faux-hover");
		});
	}

	addPanel (panel) {
		this.panels[panel.id] = panel;
		panel.render();
		this.fireBoardEvent({type: "panelIdSetActive", payload: {type: panel.type}});
		this.doSaveStateDebounced();
	}

	disablePanelMoves () {
		Object.values(this.panels).forEach(p => p.toggleMovable(false));
	}

	doBindAlertOnNavigation () {
		if (this.isAlertOnNav) return;
		this.isAlertOnNav = true;
		$(window).on("beforeunload", evt => {
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
		this.$mnu = $(`.sidemenu`);

		this.$mnu.on("mouseover", () => {
			this.board.setHoveringPanel(null);
			this.board.setVisiblyHoveringPanel(false);
			this.board.resetHoveringButton();
		});

		this.$iptWidth = null;
		this.$iptHeight = null;
		this.$wrpHistory = null;
	}

	render () {
		const renderDivider = () => this.$mnu.append(`<hr class="w-100 hr-2 sidemenu__row__divider">`);

		const $wrpResizeW = $(`<div class="w-100 mb-2 split-v-center"><div class="sidemenu__row__label">Width</div></div>`).appendTo(this.$mnu);
		const $iptWidth = $(`<input class="form-control" type="number" value="${this.board.width}">`).appendTo($wrpResizeW);
		this.$iptWidth = $iptWidth;
		const $wrpResizeH = $(`<div class="w-100 mb-2 split-v-center"><div class="sidemenu__row__label">Height</div></div>`).appendTo(this.$mnu);
		const $iptHeight = $(`<input class="form-control" type="number" value="${this.board.height}">`).appendTo($wrpResizeH);
		this.$iptHeight = $iptHeight;
		const $wrpSetDim = $(`<div class="w-100 split-v-center"></div>`).appendTo(this.$mnu);
		const $btnSetDim = $(`<button class="ve-btn ve-btn-primary" style="width: 100%;">Set Dimensions</div>`).appendTo($wrpSetDim);
		$btnSetDim.on("click", async () => {
			const w = Number($iptWidth.val());
			const h = Number($iptHeight.val());

			if (w > 10 || h > 10) {
				if (!await InputUiUtil.pGetUserBoolean({title: "Too Many Panels", htmlDescription: "That's a lot of panels. Are you sure?", textYes: "Yes", textNo: "Cancel"})) return;
			}

			this.board.setDimensions(w, h);
		});
		renderDivider();

		const $wrpFullscreen = $(`<div class="w-100 ve-flex-vh-center-around"></div>`).appendTo(this.$mnu);
		const $btnFullscreen = $(`<button class="ve-btn ve-btn-primary">Toggle Fullscreen</button>`).appendTo($wrpFullscreen);
		this.board.$btnFullscreen = $btnFullscreen;
		$btnFullscreen.on("click", () => this.board.doToggleFullscreen());
		const $btnLockPanels = $(`<button class="ve-btn ve-btn-danger" title="Lock Panels"><span class="glyphicon glyphicon-lock"></span></button>`).appendTo($wrpFullscreen);
		this.board.$btnLockPanels = $btnLockPanels;
		$btnLockPanels.on("click", () => {
			this.board.isLocked = !this.board.isLocked;
			if (this.board.isLocked) {
				this.board.disablePanelMoves();
				$(`body`).addClass(`dm-screen-locked`);
				$btnLockPanels.removeClass(`ve-btn-danger`).addClass(`ve-btn-success`);
			} else {
				$(`body`).removeClass(`dm-screen-locked`);
				$btnLockPanels.addClass(`ve-btn-danger`).removeClass(`ve-btn-success`);
			}
			this.board.doSaveStateDebounced();
		});
		renderDivider();

		const $wrpSaveLoad = $(`<div class="w-100"></div>`).appendTo(this.$mnu);
		const $wrpSaveLoadFile = $(`<div class="w-100 mb-2 ve-flex-vh-center-around"></div>`).appendTo($wrpSaveLoad);
		const $btnSaveFile = $(`<button class="ve-btn ve-btn-primary">Save to File</button>`).appendTo($wrpSaveLoadFile);
		$btnSaveFile.on("click", () => {
			DataUtil.userDownload(`dm-screen`, this.board.getSaveableState(), {fileType: "dm-screen"});
		});
		const $btnLoadFile = $(`<button class="ve-btn ve-btn-primary">Load from File</button>`).appendTo($wrpSaveLoadFile);
		$btnLoadFile.on("click", async () => {
			const {jsons, errors} = await InputUiUtil.pGetUserUploadJson({expectedFileTypes: ["dm-screen"]});

			DataUtil.doHandleFileLoadErrorsGeneric(errors);

			if (!jsons?.length) return;
			this.board.doReset();
			await this.board.pDoLoadStateFrom(jsons[0]);
		});
		const $wrpSaveLoadUrl = $(`<div class="w-100 ve-flex-vh-center-around"></div>`).appendTo($wrpSaveLoad);
		const $btnSaveLink = $(`<button class="ve-btn ve-btn-primary">Save to URL</button>`).appendTo($wrpSaveLoadUrl);
		$btnSaveLink.on("click", async () => {
			const encoded = `${window.location.href.split("#")[0]}#${encodeURIComponent(JSON.stringify(this.board.getSaveableState()))}`;
			await MiscUtil.pCopyTextToClipboard(encoded);
			JqueryUtil.showCopiedEffect($btnSaveLink);
		});
		renderDivider();

		const $wrpCbConfirm = $(`<div class="w-100 split-v-center"><label class="sidemenu__row__label sidemenu__row__label--cb-label"><span>Confirm on Panel Tab Close</span></label></div>`).appendTo(this.$mnu);
		this.board.$cbConfirmTabClose = $(`<input type="checkbox" class="sidemenu__row__label__cb">`).appendTo($wrpCbConfirm.find(`label`));
		renderDivider();

		const $wrpReset = $(`<div class="w-100 split-v-center"></div>`).appendTo(this.$mnu);
		const $btnReset = $(`<button class="ve-btn ve-btn-danger" style="width: 100%;">Reset Screen</button>`).appendTo($wrpReset);
		$btnReset.on("click", async () => {
			if (!await InputUiUtil.pGetUserBoolean({title: "Reset", htmlDescription: "Are you sure?", textYes: "Yes", textNo: "Cancel"})) return;
			this.board.doReset();
		});
		renderDivider();

		this.$wrpHistory = $(`<div class="sidemenu__history ve-overflow-y-auto ve-overflow-x-hidden"></div>`).appendTo(this.$mnu);
	}

	doUpdateDimensions () {
		this.$iptWidth.val(this.board.width);
		this.$iptHeight.val(this.board.height);
	}

	doUpdateHistory () {
		this.board.exiledPanels.forEach(p => p.get$ContentWrapper().detach());
		this.$wrpHistory.children().remove();
		if (this.board.exiledPanels.length) {
			const $wrpHistHeader = $(`<div class="w-100 mb-2 split-v-center"><span style="font-variant: small-caps;">Recently Removed</span></div>`).appendTo(this.$wrpHistory);
			const $btnHistClear = $(`<button class="ve-btn ve-btn-danger">Clear</button>`).appendTo($wrpHistHeader);
			$btnHistClear.on("click", () => {
				this.board.exiledPanels.forEach(p => p.destroy());
				this.board.exiledPanels = [];
				this.doUpdateHistory();
			});
		}
		this.board.exiledPanels.forEach((p, i) => {
			const $wrpHistItem = $(`<div class="sidemenu__history-item"></div>`).appendTo(this.$wrpHistory);
			const $cvrHistItem = $(`<div class="sidemenu__history-item-cover"></div>`).appendTo($wrpHistItem);
			const $btnRemove = $(`<div class="panel-history-control-remove-wrapper"><span class="panel-history-control-remove glyphicon glyphicon-remove" title="Remove"></span></div>`).appendTo($cvrHistItem);
			const $ctrlMove = $(`<div class="panel-history-control-middle" title="Move"></div>`).appendTo($cvrHistItem);

			$btnRemove.on("click", () => {
				this.board.exiledPanels[i].destroy();
				this.board.exiledPanels.splice(i, 1);
				this.doUpdateHistory();
			});

			const $contents = p.get$ContentWrapper();
			$wrpHistItem.append($contents);

			$ctrlMove.on("mousedown touchstart", (e) => {
				this.board.setVisiblyHoveringPanel(true);
				const $body = $(`body`);
				MiscUtil.clearSelection();
				$body.css("userSelect", "none");

				const w = $contents.width();
				const h = $contents.height();
				const offset = $contents.offset();
				const offsetX = EventUtil.getClientX(e) - offset.left;
				const offsetY = EventUtil.getClientY(e) - offset.top;

				$body.append($contents);
				$(`.panel-control-move`).hide();
				$contents.css("overflow-y", "hidden");
				Panel.setMovingCss(e, $contents, w, h, offsetX, offsetY, 61);
				$wrpHistItem.css("box-shadow", "none");
				$btnRemove.hide();
				$ctrlMove.hide();
				this.board.get$creen().addClass("board-content-hovering");
				p.get$Content().addClass("panel-content-hovering");

				Panel.bindMovingEvents(this.board, $contents, offsetX, offsetY);

				$(document).on(`mouseup${EVT_NAMESPACE} touchend${EVT_NAMESPACE}`, () => {
					this.board.setVisiblyHoveringPanel(false);
					$(document).off(`mousemove${EVT_NAMESPACE} touchmove${EVT_NAMESPACE}`).off(`mouseup${EVT_NAMESPACE} touchend${EVT_NAMESPACE}`);

					$body.css("userSelect", "");
					$contents.css("overflow-y", "");
					Panel.unsetMovingCss($contents);
					$wrpHistItem.css("box-shadow", "");
					$btnRemove.show();
					$ctrlMove.show();
					this.board.get$creen().removeClass("board-content-hovering");
					p.get$Content().removeClass("panel-content-hovering");

					if (!this.board.hoveringPanel || p.id === this.board.hoveringPanel.id) $wrpHistItem.append($contents);
					else {
						this.board.recallPanel(p);
						const her = this.board.hoveringPanel;
						if (her.getEmpty()) {
							her.setFromPeer(p.getPanelMeta(), p.$content, p.isMovable());
							p.destroy();
						} else {
							const herMeta = her.getPanelMeta();
							const $herContent = her.get$Content();
							her.setFromPeer(p.getPanelMeta(), p.get$Content(), p.isMovable());
							p.setFromPeer(herMeta, $herContent, her.isMovable());
							p.exile();
						}
						// clean any lingering hidden scrollbar
						her.$pnl.removeClass("panel-mode-move");
						her.doShowJoystick();
						this.doUpdateHistory();
					}
					MiscUtil.clearSelection();
					this.board.doSaveStateDebounced();
				});
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
		this.isMousedown = false;
		this.isTabs = false;
		this.tabIndex = null;
		this.tabDatas = [];
		this.tabCanRename = false;
		this.tabRenamed = false;

		this.$btnAdd = null;
		this.$btnAddInner = null;
		this.$content = null;
		this.joyMenu = null;
		this.$pnl = null;
		this.$pnlWrpContent = null;
		this.$pnlTitle = null;
		this.$pnlAddTab = null;
		this.$pnlWrpTabs = null;
		this.$pnlTabs = null;
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
				case PANEL_TYP_TEXTBOX:
					panel.doPopulate_TextBox(saved.s.x, saved.r);
					handleTabRenamed(panel);
					return panel;
				case PANEL_TYP_COUNTER:
					panel.doPopulate_Counter(saved.s, saved.r);
					handleTabRenamed(panel);
					return panel;
				case PANEL_TYP_UNIT_CONVERTER:
					panel.doPopulate_UnitConverter(saved.s, saved.r);
					handleTabRenamed(panel);
					return panel;
				case PANEL_TYP_MONEY_CONVERTER:
					panel.doPopulate_MoneyConverter(saved.s, saved.r);
					handleTabRenamed(panel);
					return panel;
				case PANEL_TYP_TIME_TRACKER:
					panel.doPopulate_TimeTracker(saved.s, saved.r);
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
				case PANEL_TYP_ADVENTURE_DYNAMIC_MAP:
					panel.doPopulate_AdventureBookDynamicMap(saved.s, saved.r);
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

	static _get$eleLoading (message = "Loading") {
		return $(`<div class="panel-content-wrapper-inner"><div class="ui-search__message loading-spinner"><i>${message}...</i></div></div>`);
	}

	static setMovingCss (evt, $ele, w, h, offsetX, offsetY, zIndex) {
		$ele.css({
			width: w,
			height: h,
			position: "fixed",
			top: EventUtil.getClientY(evt) - offsetY,
			left: EventUtil.getClientX(evt) - offsetX,
			zIndex: zIndex,
			pointerEvents: "none",
			transform: "rotate(-4deg)",
			background: "none",
		});
	}

	static unsetMovingCss ($ele) {
		$ele.css({
			width: "",
			height: "",
			position: "",
			top: "",
			left: "",
			zIndex: "",
			pointerEvents: "",
			transform: "",
			background: "",
		});
	}

	static bindMovingEvents (board, $content, offsetX, offsetY) {
		$(document).off(`mousemove${EVT_NAMESPACE} touchmove${EVT_NAMESPACE}`).off(`mouseup${EVT_NAMESPACE} touchend${EVT_NAMESPACE}`);
		$(document).on(`mousemove${EVT_NAMESPACE} touchmove${EVT_NAMESPACE}`, (e) => {
			board.setVisiblyHoveringPanel(true);
			$content.css({
				top: EventUtil.getClientY(e) - offsetY,
				left: EventUtil.getClientX(e) - offsetX,
			});
		});
	}

	static isNonExilableType (type) {
		return type === PANEL_TYP_ROLLBOX || type === PANEL_TYP_TUBE || type === PANEL_TYP_TWITCH;
	}

	// region Panel population

	doPopulate_Empty (ixOpt) {
		this.close$TabContent(ixOpt);
	}

	doPopulate_Loading (message) {
		return this.set$ContentTab(
			PANEL_TYP_EMPTY,
			null,
			Panel._get$eleLoading(message),
			TITLE_LOADING,
		);
	}

	doPopulate_Stats (page, source, hash, skipSetTab, title) { // FIXME skipSetTab is never used
		const meta = {p: page, s: source, u: hash};
		const ix = this.set$TabLoading(
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

			const $contentInner = $(`<div class="panel-content-wrapper-inner"></div>`);
			const $contentStats = $(`<table class="w-100 stats"></table>`).appendTo($contentInner);
			$contentStats.append(fn(it));

			const fnBind = Renderer.hover.getFnBindListenersCompact(page);
			if (fnBind) fnBind(it, $contentInner[0]);

			this._stats_bindCrScaleClickHandler(it, meta, $contentInner, $contentStats);
			this._stats_bindSummonScaleClickHandler(it, meta, $contentInner, $contentStats);

			this.set$Tab(
				ix,
				PANEL_TYP_STATS,
				meta,
				$contentInner,
				title || it.name,
				true,
				!!title,
			);
		});
	}

	_stats_bindCrScaleClickHandler (mon, meta, $contentInner, $contentStats) {
		const self = this;
		$contentStats.off("click", ".mon__btn-scale-cr").on("click", ".mon__btn-scale-cr", function (evt) {
			evt.stopPropagation();
			const win = (evt.view || {}).window;

			const $this = $(this);
			const lastCr = self.contentMeta.cr != null ? Parser.numberToCr(self.contentMeta.cr) : mon.cr ? (mon.cr.cr || mon.cr) : null;

			Renderer.monster.getCrScaleTarget({
				win,
				$btnScale: $this,
				initialCr: lastCr,
				isCompact: true,
				cbRender: (targetCr) => {
					const originalCr = Parser.crToNumber(mon.cr) === targetCr;

					const doRender = (toRender) => {
						$contentStats.empty().append(Renderer.monster.getCompactRenderedString(toRender, {isShowScalers: true, isScaledCr: !originalCr}));

						const nxtMeta = {
							...meta,
							cr: targetCr,
						};
						if (originalCr) delete nxtMeta.cr;

						self.set$Tab(
							self.tabIndex,
							originalCr ? PANEL_TYP_STATS : PANEL_TYP_CREATURE_SCALED_CR,
							nxtMeta,
							$contentInner,
							toRender._displayName || toRender.name,
							true,
						);
					};

					if (originalCr) {
						doRender(mon);
					} else {
						ScaleCreature.scale(mon, targetCr).then(toRender => doRender(toRender));
					}
				},
			});
		});

		$contentStats.off("click", ".mon__btn-reset-cr").on("click", ".mon__btn-reset-cr", function () {
			$contentStats.empty().append(Renderer.monster.getCompactRenderedString(mon, {isShowScalers: true, isScaledCr: false}));
			self.set$Tab(
				self.tabIndex,
				PANEL_TYP_STATS,
				meta,
				$contentInner,
				mon.name,
				true,
			);
		});
	}

	_stats_bindSummonScaleClickHandler (mon, meta, $contentInner, $contentStats) {
		const self = this;

		$contentStats
			.off("change", `[name="mon__sel-summon-spell-level"]`)
			.on("change", `[name="mon__sel-summon-spell-level"]`, async function () {
				const $selSummonSpellLevel = $(this);

				const spellLevel = Number($selSummonSpellLevel.val());
				if (~spellLevel) {
					const nxtMeta = {
						...meta,
						ssl: spellLevel,
					};

					ScaleSpellSummonedCreature.scale(mon, spellLevel)
						.then(toRender => {
							$contentStats.empty().append(Renderer.monster.getCompactRenderedString(toRender, {isShowScalers: true, isScaledSpellSummon: true}));

							self._stats_doUpdateSummonScaleDropdowns(toRender, $contentStats);

							self.set$Tab(
								self.tabIndex,
								PANEL_TYP_CREATURE_SCALED_SPELL_SUMMON,
								nxtMeta,
								$contentInner,
								mon._displayName || mon.name,
								true,
							);
						});
				} else {
					$contentStats.empty().append(Renderer.monster.getCompactRenderedString(mon, {isShowScalers: true, isScaledCr: false, isScaledSpellSummon: false}));

					self._stats_doUpdateSummonScaleDropdowns(mon, $contentStats);

					self.set$Tab(
						self.tabIndex,
						PANEL_TYP_STATS,
						meta,
						$contentInner,
						mon.name,
						true,
					);
				}
			});

		$contentStats
			.off("change", `[name="mon__sel-summon-class-level"]`)
			.on("change", `[name="mon__sel-summon-class-level"]`, async function () {
				const $selSummonClassLevel = $(this);

				const classLevel = Number($selSummonClassLevel.val());
				if (~classLevel) {
					const nxtMeta = {
						...meta,
						csl: classLevel,
					};

					ScaleClassSummonedCreature.scale(mon, classLevel)
						.then(toRender => {
							$contentStats.empty().append(Renderer.monster.getCompactRenderedString(toRender, {isShowScalers: true, isScaledClassSummon: true}));

							self._stats_doUpdateSummonScaleDropdowns(toRender, $contentStats);

							self.set$Tab(
								self.tabIndex,
								PANEL_TYP_CREATURE_SCALED_CLASS_SUMMON,
								nxtMeta,
								$contentInner,
								mon._displayName || mon.name,
								true,
							);
						});
				} else {
					$contentStats.empty().append(Renderer.monster.getCompactRenderedString(mon, {isShowScalers: true, isScaledCr: false, isScaledClassSummon: false}));

					self._stats_doUpdateSummonScaleDropdowns(mon, $contentStats);

					self.set$Tab(
						self.tabIndex,
						PANEL_TYP_STATS,
						meta,
						$contentInner,
						mon.name,
						true,
					);
				}
			});
	}

	_stats_doUpdateSummonScaleDropdowns (scaledMon, $contentStats) {
		$contentStats
			.find(`[name="mon__sel-summon-spell-level"]`)
			.val(scaledMon._summonedBySpell_level != null ? `${scaledMon._summonedBySpell_level}` : "-1");

		$contentStats
			.find(`[name="mon__sel-summon-class-level"]`)
			.val(scaledMon._summonedByClass_level != null ? `${scaledMon._summonedByClass_level}` : "-1");
	}

	doPopulate_StatsScaledCr (page, source, hash, targetCr, skipSetTab, title) { // FIXME skipSetTab is never used
		const meta = {p: page, s: source, u: hash, cr: targetCr};
		const ix = this.set$TabLoading(
			PANEL_TYP_CREATURE_SCALED_CR,
			meta,
		);
		return DataLoader.pCacheAndGet(
			page,
			source,
			hash,
		).then(it => {
			ScaleCreature.scale(it, targetCr).then(initialRender => {
				const $contentInner = $(`<div class="panel-content-wrapper-inner"></div>`);
				const $contentStats = $(`<table class="w-100 stats"></table>`).appendTo($contentInner);
				$contentStats.append(Renderer.monster.getCompactRenderedString(initialRender, {isShowScalers: true, isScaledCr: true}));

				this._stats_bindCrScaleClickHandler(it, meta, $contentInner, $contentStats);

				this.set$Tab(
					ix,
					PANEL_TYP_CREATURE_SCALED_CR,
					meta,
					$contentInner,
					title || initialRender._displayName || initialRender.name,
					true,
					!!title,
				);
			});
		});
	}

	doPopulate_StatsScaledSpellSummonLevel (page, source, hash, summonSpellLevel, skipSetTab, title) { // FIXME skipSetTab is never used
		const meta = {p: page, s: source, u: hash, ssl: summonSpellLevel};
		const ix = this.set$TabLoading(
			PANEL_TYP_CREATURE_SCALED_SPELL_SUMMON,
			meta,
		);
		return DataLoader.pCacheAndGet(
			page,
			source,
			hash,
		).then(it => {
			ScaleSpellSummonedCreature.scale(it, summonSpellLevel).then(scaledMon => {
				const $contentInner = $(`<div class="panel-content-wrapper-inner"></div>`);
				const $contentStats = $(`<table class="w-100 stats"></table>`).appendTo($contentInner);
				$contentStats.append(Renderer.monster.getCompactRenderedString(scaledMon, {isShowScalers: true, isScaledSpellSummon: true}));

				this._stats_doUpdateSummonScaleDropdowns(scaledMon, $contentStats);

				this._stats_bindSummonScaleClickHandler(it, meta, $contentInner, $contentStats);

				this.set$Tab(
					ix,
					PANEL_TYP_CREATURE_SCALED_SPELL_SUMMON,
					meta,
					$contentInner,
					title || scaledMon._displayName || scaledMon.name,
					true,
					!!title,
				);
			});
		});
	}

	doPopulate_StatsScaledClassSummonLevel (page, source, hash, summonClassLevel, skipSetTab, title) { // FIXME skipSetTab is never used
		const meta = {p: page, s: source, u: hash, csl: summonClassLevel};
		const ix = this.set$TabLoading(
			PANEL_TYP_CREATURE_SCALED_CLASS_SUMMON,
			meta,
		);
		return DataLoader.pCacheAndGet(
			page,
			source,
			hash,
		).then(it => {
			ScaleClassSummonedCreature.scale(it, summonClassLevel).then(scaledMon => {
				const $contentInner = $(`<div class="panel-content-wrapper-inner"></div>`);
				const $contentStats = $(`<table class="w-100 stats"></table>`).appendTo($contentInner);
				$contentStats.append(Renderer.monster.getCompactRenderedString(scaledMon, {isShowScalers: true, isScaledClassSummon: true}));

				this._stats_doUpdateSummonScaleDropdowns(scaledMon, $contentStats);

				this._stats_bindSummonScaleClickHandler(it, meta, $contentInner, $contentStats);

				this.set$Tab(
					ix,
					PANEL_TYP_CREATURE_SCALED_CLASS_SUMMON,
					meta,
					$contentInner,
					title || scaledMon._displayName || scaledMon.name,
					true,
					!!title,
				);
			});
		});
	}

	doPopulate_Rules (book, chapter, header, skipSetTab, title) { // FIXME skipSetTab is never used
		const meta = {b: book, c: chapter, h: header};
		const ix = this.set$TabLoading(
			PANEL_TYP_RULES,
			meta,
		);
		return RuleLoader.pFill(book).then(() => {
			const rule = RuleLoader.getFromCache(book, chapter, header);
			const it = Renderer.rule.getCompactRenderedString(rule);
			this.set$Tab(
				ix,
				PANEL_TYP_RULES,
				meta,
				$(`<div class="panel-content-wrapper-inner"><table class="w-100 stats">${it}</table></div>`),
				title || rule.name || "",
				true,
				!!title,
			);
		});
	}

	doPopulate_Adventures (adventure, chapter, skipSetTab, title) { // FIXME skipSetTab is never used
		const meta = {a: adventure, c: chapter};
		const ix = this.set$TabLoading(
			PANEL_TYP_ADVENTURES,
			meta,
		);
		return adventureLoader.pFill(adventure).then(() => {
			const data = adventureLoader.getFromCache(adventure, chapter);
			const view = new AdventureOrBookView("a", this, adventureLoader, ix, meta);
			this.set$Tab(
				ix,
				PANEL_TYP_ADVENTURES,
				meta,
				$(`<div class="panel-content-wrapper-inner"></div>`).append(view.$getEle()),
				title || data?.chapter?.name || "",
				true,
				!!title,
			);
		});
	}

	doPopulate_Books (book, chapter, skipSetTab, title) { // FIXME skipSetTab is never used
		const meta = {b: book, c: chapter};
		const ix = this.set$TabLoading(
			PANEL_TYP_BOOKS,
			meta,
		);
		return bookLoader.pFill(book).then(() => {
			const data = bookLoader.getFromCache(book, chapter);
			const view = new AdventureOrBookView("b", this, bookLoader, ix, meta);
			this.set$Tab(
				ix,
				PANEL_TYP_BOOKS,
				meta,
				$(`<div class="panel-content-wrapper-inner"></div>`).append(view.$getEle()),
				title || data?.chapter?.name || "",
				true,
				!!title,
			);
		});
	}

	set$ContentTab (type, contentMeta, $content, title, tabCanRename, tabRenamed) {
		const ix = this.isTabs ? this.getNextTabIndex() : 0;
		return this.set$Tab(ix, type, contentMeta, $content, title, tabCanRename, tabRenamed);
	}

	doPopulate_Rollbox (title) {
		this.set$ContentTab(
			PANEL_TYP_ROLLBOX,
			null,
			$(`<div class="panel-content-wrapper-inner"></div>`).append(Renderer.dice.get$Roller().addClass("rollbox-panel")),
			title || "Dice Roller",
			true,
			!!title,
		);
	}

	doPopulate_Counter (state = {}, title) {
		this.set$ContentTab(
			PANEL_TYP_COUNTER,
			state,
			$(`<div class="panel-content-wrapper-inner"></div>`).append(Counter.$getCounter(this.board, state)),
			title || "Counter",
			true,
		);
	}

	doPopulate_UnitConverter (state = {}, title) {
		this.set$ContentTab(
			PANEL_TYP_UNIT_CONVERTER,
			state,
			$(`<div class="panel-content-wrapper-inner"></div>`).append(UnitConverter.make$Converter(this.board, state)),
			title || "Unit Converter",
			true,
		);
	}

	doPopulate_MoneyConverter (state = {}, title) {
		this.set$ContentTab(
			PANEL_TYP_MONEY_CONVERTER,
			state,
			$(`<div class="panel-content-wrapper-inner"></div>`).append(MoneyConverter.make$Converter(this.board, state)),
			title || "Money Converter",
			true,
		);
	}

	doPopulate_TimeTracker (state = {}, title) {
		this.set$ContentTab(
			PANEL_TYP_TIME_TRACKER,
			state,
			$(`<div class="panel-content-wrapper-inner"></div>`).append(TimeTracker.$getTracker(this.board, state)),
			title || "Time Tracker",
			true,
		);
	}

	doPopulate_TextBox (content, title = "Notes") {
		this.set$ContentTab(
			PANEL_TYP_TEXTBOX,
			null,
			$(`<div class="panel-content-wrapper-inner ve-overflow-y-hidden"></div>`).append(NoteBox.make$Notebox(this.board, content)),
			title,
			true,
		);
	}

	doPopulate_YouTube (url, title = "YouTube") {
		const meta = {u: url};
		this.set$ContentTab(
			PANEL_TYP_TUBE,
			meta,
			$(`<div class="panel-content-wrapper-inner"><iframe src="${url}?autoplay=1&enablejsapi=1&modestbranding=1&iv_load_policy=3" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen/></div>`),
			title,
			true,
		);
	}

	doPopulate_Twitch (url, title = "Twitch") {
		const meta = {u: url};
		this.set$ContentTab(
			PANEL_TYP_TWITCH,
			meta,
			$(`<div class="panel-content-wrapper-inner"><iframe src="${url}" frameborder="0"  scrolling="no" allowfullscreen/></div>`),
			title,
			true,
		);
	}

	doPopulate_TwitchChat (url, title = "Twitch Chat") {
		const meta = {u: url};
		const channelId = url.split("/").map(it => it.trim()).filter(Boolean).slice(-2)[0];
		this.set$ContentTab(
			PANEL_TYP_TWITCH_CHAT,
			meta,
			$(`<div class="panel-content-wrapper-inner"><iframe src="${url}?parent=${location.hostname}" frameborder="0" scrolling="no" id="${channelId}"></iframe></div>`),
			title,
			true,
		);
	}

	doPopulate_GenericEmbed (url, title = "Embed") {
		const meta = {u: url};
		this.set$ContentTab(
			PANEL_TYP_GENERIC_EMBED,
			meta,
			$(`<div class="panel-content-wrapper-inner"><iframe src="${url}"></iframe></div>`),
			title,
			true,
		);
	}

	doPopulate_Image (url, title = "Image") {
		const meta = {u: url};
		const $wrpPanel = $(`<div class="panel-content-wrapper-inner"></div>`);
		const $wrpImage = $(`<div class="panel-content-wrapper-img"></div>`).appendTo($wrpPanel);
		const $img = $(`<img src="${url}" alt="${title}" loading="lazy">`).appendTo($wrpImage);
		const $iptReset = $(`<button class="panel-zoom-reset ve-btn ve-btn-xs ve-btn-default"><span class="glyphicon glyphicon-refresh"></span></button>`).appendTo($wrpPanel);
		const $iptRange = $(`<input type="range" class="panel-zoom-slider">`).appendTo($wrpPanel);
		this.set$ContentTab(
			PANEL_TYP_IMAGE,
			meta,
			$wrpPanel,
			title,
			true,
		);
		$img.panzoom({
			$reset: $iptReset,
			$zoomRange: $iptRange,
			minScale: 0.1,
			maxScale: 8,
			duration: 100,
		});
	}

	doPopulate_AdventureBookDynamicMap (state, title = "Map Viewer") {
		this.set$ContentTab(
			PANEL_TYP_ADVENTURE_DYNAMIC_MAP,
			state,
			$(`<div class="panel-content-wrapper-inner"></div>`).append(DmMapper.$getMapper(this.board, state)),
			title || "Map Viewer",
			true,
		);
	}

	doPopulate_Error (state, title = "") {
		this.set$ContentTab(
			PANEL_TYP_ERROR,
			state,
			$(`<div class="panel-content-wrapper-inner"></div>`).append(`<div class="w-100 h-100 ve-flex-vh-center text-danger"><div>${state.message}</div></div>`),
			title,
			true,
		);
	}

	doPopulate_Blank (title = "") {
		const meta = {};
		this.set$ContentTab(
			PANEL_TYP_BLANK,
			meta,
			$(`<div class="dm-blank__panel"></div>`),
			title,
			true,
		);
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

	setPanelMeta (type, contentMeta) {
		this.type = type;
		this.contentMeta = contentMeta;
	}

	getEmpty () {
		return this.$content == null;
	}

	getLocked () {
		return this.isLocked;
	}

	getMousedown () {
		return this.isMousedown;
	}

	setMousedown (isMousedown) {
		this.isMousedown = isMousedown;
	}

	setDirty (dirty) {
		this.isDirty = dirty;
	}

	setIsTabs (isTabs) {
		this.isTabs = isTabs;
		this.doRenderTabs();
	}

	setContentDirty (dirty) {
		this.setDirty.bind(this)(dirty);
		this.isContentDirty = true;
	}

	doShowJoystick () {
		this.joyMenu.doShow();
		this.$pnl.addClass(`panel-mode-move`);
	}

	doHideJoystick () {
		this.joyMenu.doHide();
		this.$pnl.removeClass(`panel-mode-move`);
	}

	doRenderTitle () {
		const displayText = this.title !== TITLE_LOADING
		&& (this.type === PANEL_TYP_STATS || this.type === PANEL_TYP_CREATURE_SCALED_CR || this.type === PANEL_TYP_CREATURE_SCALED_SPELL_SUMMON || this.type === PANEL_TYP_CREATURE_SCALED_CLASS_SUMMON || this.type === PANEL_TYP_RULES || this.type === PANEL_TYP_ADVENTURES || this.type === PANEL_TYP_BOOKS) ? this.title : "";

		this._doUpdatePanelTitleDisplay(displayText);
		if (!displayText) this.$pnlTitle.addClass("hidden");
		else this.$pnlTitle.removeClass("hidden");
	}

	doRenderTabs () {
		if (this.isTabs) {
			this.$pnlWrpTabs.showVe();
			this.$pnlWrpContent.addClass("panel-content-wrapper-tabs");
			this.$pnlAddTab.addClass("hidden");
		} else {
			this.$pnlWrpTabs.hideVe();
			this.$pnlWrpContent.removeClass("panel-content-wrapper-tabs");
			this.$pnlAddTab.removeClass("hidden");
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

	toggleMovable (val) {
		this.$pnl.find(`.panel-control-move`).toggle(val);
		// TODO this
		this.$pnl.toggleClass(`panel-mode-move`, val);
		this.$pnl.find(`.panel-control-bar`).toggleClass("move-expand-active", val);
	}

	isMovable () {
		this.$pnl.hasClass(`panel-mode-move`);
	}

	render () {
		const doApplyPosCss = ($ele) => {
			// indexed from 1 instead of zero...
			return $ele.css({
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

		function doInitialRender () {
			const $pnl = $(`<div data-panelId="${this.id}" class="dm-screen-panel min-w-0 min-h-0" empty="true"></div>`);
			this.$pnl = $pnl;
			const $ctrlBar = $(`<div class="panel-control-bar"></div>`).appendTo($pnl);
			this.$pnlTitle = $(`<div class="panel-control-bar panel-control-title"></div>`).appendTo($pnl).click(() => this.$pnlTitle.toggleClass("panel-control-title--bumped"));
			this.$pnlAddTab = $(`<div class="panel-control-bar panel-control-addtab"><div class="panel-control-icon glyphicon glyphicon-plus" title="Add Tab"></div></div>`)
				.on("click", async () => {
					this.setIsTabs(true);
					this.setDirty(true);
					this.render();
					await pOpenAddMenu();
				})
				.appendTo($pnl);

			const $ctrlMove = $(`<div class="panel-control-icon glyphicon glyphicon-move" title="Move"></div>`).appendTo($ctrlBar);
			$ctrlMove.on("click", () => {
				this.toggleMovable();
			});
			const $ctrlEmpty = $(`<div class="panel-control-icon glyphicon glyphicon-remove" title="Close"></div>`).appendTo($ctrlBar);
			$ctrlEmpty.on("click", () => {
				this.getReplacementPanel();
			});

			const joyMenu = new JoystickMenu(this.board, this);
			this.joyMenu = joyMenu;
			joyMenu.initialise();

			const $wrpContent = $(`<div class="panel-content-wrapper"></div>`).appendTo($pnl);
			const $wrpBtnAdd = $(`<div class="panel-add"></div>`).appendTo($wrpContent);
			const $btnAdd = $(`<span class="ve-btn-panel-add glyphicon glyphicon-plus"></span>`)
				.on("click", async () => {
					await pOpenAddMenu();
				})
				.on("drop", async evt => {
					evt = evt.originalEvent;

					const data = EventUtil.getDropJson(evt);
					if (!data) return;

					if (data.type !== VeCt.DRAG_TYPE_IMPORT) return;

					evt.stopPropagation();
					evt.preventDefault();

					const {page, source, hash} = data;
					// FIXME(Future) "Stats" may not be the correct panel type, but works in most useful cases
					this.doPopulate_Stats(page, source, hash);
				})
				.appendTo($wrpBtnAdd);
			this.$btnAdd = $wrpBtnAdd;
			this.$btnAddInner = $btnAdd;
			this.$pnlWrpContent = $wrpContent;

			const $wrpTabs = $(`<div class="content-tab-bar ve-flex"></div>`).hideVe().appendTo($pnl);
			const $wrpTabsInner = $(`<div class="content-tab-bar-inner"></div>`).on("wheel", (evt) => {
				const delta = evt.originalEvent.deltaY;
				const curr = $wrpTabsInner.scrollLeft();
				$wrpTabsInner.scrollLeft(Math.max(0, curr + delta));
			}).appendTo($wrpTabs);
			const $btnTabAdd = $(`<button class="ve-btn ve-btn-default content-tab" title="Add Tab"><span class="glyphicon glyphicon-plus"></span></button>`)
				.on("click", () => pOpenAddMenu())
				.appendTo($wrpTabsInner);
			this.$pnlWrpTabs = $wrpTabs;
			this.$pnlTabs = $wrpTabsInner;

			if (this.$content) $wrpContent.append(this.$content);

			doApplyPosCss($pnl).appendTo(this.board.get$creen());
			this.isDirty = false;
		}

		if (this.isDirty) {
			if (!this.$pnl) doInitialRender.bind(this)();
			else {
				doApplyPosCss(this.$pnl);
				this.doRenderTitle();
				this.doRenderTabs();

				if (this.isContentDirty) {
					this.$pnlWrpContent.clear();
					if (this.$content) this.$pnlWrpContent.append(this.$content);
					this.isContentDirty = false;
				}
			}
			this.isDirty = false;
		}
	}

	getPos () {
		const offset = this.$pnl.offset();
		return {
			top: offset.top,
			left: offset.left,
			width: this.$pnl.outerWidth(),
			height: this.$pnl.outerHeight(),
		};
	}

	getAddButtonPos () {
		const offset = this.$btnAddInner.offset();
		return {
			top: offset.top,
			left: offset.left,
			width: this.$btnAddInner.outerWidth(),
			height: this.$btnAddInner.outerHeight(),
		};
	}

	doCloseTab (ixOpt) {
		if (this.isTabs) {
			this.close$TabContent(ixOpt);
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

	close$TabContent (ixOpt = 0) {
		return this.set$Tab(-1 * (ixOpt + 1), PANEL_TYP_EMPTY, null, null, null, false);
	}

	set$Content (type, contentMeta, $content, title, tabCanRename, tabRenamed) {
		this.type = type;
		this.contentMeta = contentMeta;
		this.$content = $content;
		this.title = title;
		this.tabCanRename = tabCanRename;
		this.tabRenamed = tabRenamed;

		if ($content === null) {
			this.$pnlWrpContent.children().detach();
			this.$pnlWrpContent.append(this.$btnAdd);
		} else {
			this.$btnAdd.detach(); // preserve the "add panel" controls so we can re-attach them later if the panel empties
			this.$pnlWrpContent.find(`.ui-search__message.loading-spinner`).remove(); // clean up any temp "loading" panels
			this.$pnlWrpContent.children().addClass("dms__tab_hidden");
			$content.removeClass("dms__tab_hidden");
			if (!this.$pnlWrpContent.has($content[0]).length) this.$pnlWrpContent.append($content);
		}

		this.$pnl.attr("empty", !$content);
		this.doRenderTitle();
		this.doRenderTabs();
	}

	setFromPeer (hisMeta, $hisContent, isMovable) {
		this.isTabs = hisMeta.isTabs;
		this.tabIndex = hisMeta.tabIndex;
		this.tabDatas = hisMeta.tabDatas;
		this.tabCanRename = hisMeta.tabCanRename;
		this.tabRenamed = hisMeta.tabRenamed;

		this.set$Tab(hisMeta.tabIndex, hisMeta.type, hisMeta.contentMeta, $hisContent, hisMeta.title, hisMeta.tabCanRename, hisMeta.tabRenamed);
		hisMeta.tabDatas
			.forEach((it, ix) => {
				if (!it.isDeleted && it.$tabButton) {
					// regenerate tab buttons to refer to the correct tab
					it.$tabButton.remove();
					it.$tabButton = this._get$BtnSelTab(ix, it.title, it.tabCanRename);
					this.$pnlTabs.children().last().before(it.$tabButton);
				}
			});

		this.toggleMovable(isMovable);
	}

	getNextTabIndex () {
		return this.tabDatas.length;
	}

	set$TabLoading (type, contentMeta) {
		return this.set$ContentTab(
			type,
			contentMeta,
			Panel._get$eleLoading(),
			TITLE_LOADING,
		);
	}

	_get$BtnSelTab (ix, title, tabCanRename) {
		title = title || "[Untitled]";

		const doCloseTabWithConfirmation = async () => {
			if (this.board.getConfirmTabClose()) {
				if (!await InputUiUtil.pGetUserBoolean({title: "Close Tab", htmlDescription: `Are you sure you want to close tab "${this.tabDatas[ix].title}"?`, textYes: "Yes", textNo: "Cancel"})) return;
			}
			this.doCloseTab(ix);
		};

		const $btnSelTab = $(`<span class="ve-btn ve-btn-default content-tab ve-flex ${tabCanRename ? "content-tab-can-rename" : ""}"><span class="content-tab-title ve-overflow-ellipsis" title="${title}">${title}</span></span>`)
			.on("mousedown", (evt) => {
				if (evt.which === 1) {
					this.setActiveTab(ix);
				} else if (evt.which === 2) {
					doCloseTabWithConfirmation();
				}
			})
			.on("contextmenu", async (evt) => {
				evt.stopPropagation();
				evt.preventDefault();
				if ($btnSelTab.hasClass("content-tab-can-rename")) {
					const existingTitle = this.getTabTitle(ix) || "";
					const nuTitle = await InputUiUtil.pGetUserString({default: existingTitle, title: "Rename Tab"});
					if (nuTitle && nuTitle.trim()) {
						this.setTabTitle(ix, nuTitle);
					}
				}
			});
		const $btnCloseTab = $(`<span class="glyphicon glyphicon-remove content-tab-remove"></span>`)
			.on("mousedown", (evt) => {
				if (evt.button === 0) {
					evt.stopPropagation();
					doCloseTabWithConfirmation();
				}
			}).appendTo($btnSelTab);
		return $btnSelTab;
	}

	getTabTitle (ix) {
		return (this.tabDatas[ix] || {}).title;
	}

	setTabTitle (ix, nuTitle) {
		const tabData = this.tabDatas[ix];

		tabData.$tabButton.find(`.content-tab-title`).text(nuTitle).title(nuTitle);
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
		this.$pnlTitle.text(nuTitle);
		this.$pnl.attr("data-roll-name-ancestor-roller", nuTitle);
	}

	set$Tab (ix, type, contentMeta, $content, title, tabCanRename, tabRenamed) {
		if (ix === null) ix = 0;
		if (ix < 0) {
			const ixPos = Math.abs(ix + 1);
			const td = this.tabDatas[ixPos];
			if (td) {
				td.isDeleted = true;
				if (td.$tabButton) td.$tabButton.detach();
			}
		} else {
			const $btnOld = (this.tabDatas[ix] || {}).$tabButton; // preserve tab button
			this.tabDatas[ix] = {
				type: type,
				contentMeta: contentMeta,
				$content: $content,
				title: title,
				tabCanRename: !!tabCanRename,
				tabRenamed: !!tabRenamed,
			};
			if ($btnOld) this.tabDatas[ix].$tabButton = $btnOld;

			const doAdd$BtnSelTab = (ix, title) => {
				const $btnSelTab = this._get$BtnSelTab(ix, title);
				this.$pnlTabs.children().last().before($btnSelTab);
				return $btnSelTab;
			};

			if (!this.tabDatas[ix].$tabButton) this.tabDatas[ix].$tabButton = doAdd$BtnSelTab(ix, title);
			else this.tabDatas[ix].$tabButton.find(`.content-tab-title`).text(title).title(title);

			this.tabDatas[ix].$tabButton.toggleClass("content-tab-can-rename", tabCanRename);
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
				this.set$Content(PANEL_TYP_EMPTY, null, null, null, false);
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
			this.set$Content(tabData.type, tabData.contentMeta, tabData.$content, tabData.title, tabData.tabCanRename, tabData.tabRenamed);
		}
		this.board.doSaveStateDebounced();
	}

	get$ContentWrapper () {
		return this.$pnlWrpContent;
	}

	get$Content () {
		return this.$content;
	}

	exile () {
		if (Panel.isNonExilableType(this.type)) this.destroy();
		else {
			if (this.$pnl) this.$pnl.detach();
			this.board.exilePanel(this.id);
		}
	}

	destroy () {
		// do cleanup
		if (this.type === PANEL_TYP_ROLLBOX) Renderer.dice.unbindDmScreenPanel();

		const fnOnDestroy = this.$content ? $(this.$content.children()[0]).data("onDestroy") : null;

		if (this.$pnl) this.$pnl.remove();
		this.board.destroyPanel(this.id);

		if (fnOnDestroy) fnOnDestroy();

		this.board.fireBoardEvent({type: "panelDestroy"});
	}

	addHoverClass () {
		this.$pnl.addClass("faux-hover");
	}

	removeHoverClass () {
		this.$pnl.removeClass("faux-hover");
	}

	getSaveableState () {
		const out = {
			x: this.x,
			y: this.y,
			w: this.width,
			h: this.height,
			t: this.type,
		};

		const getSaveableContent = (type, contentMeta, $content, tabRenamed, tabTitle) => {
			const toSaveTitle = tabRenamed ? tabTitle : undefined;

			// TODO(Future) refactor other panels to use this
			const fromPcm = PanelContentManagerFactory.getSaveableContent({
				type,
				toSaveTitle,
				$content,
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
				case PANEL_TYP_TEXTBOX:
					return {
						t: type,
						r: toSaveTitle,
						s: {
							x: $content ? $content.find(`textarea`).val() : "",
						},
					};
				case PANEL_TYP_COUNTER: {
					return {
						t: type,
						r: toSaveTitle,
						s: $content.find(`.dm-cnt__root`).data("getState")(),
					};
				}
				case PANEL_TYP_UNIT_CONVERTER: {
					return {
						t: type,
						r: toSaveTitle,
						s: $content.find(`.dm-unitconv`).data("getState")(),
					};
				}
				case PANEL_TYP_MONEY_CONVERTER: {
					return {
						t: type,
						r: toSaveTitle,
						s: $content.find(`.dm_money`).data("getState")(),
					};
				}
				case PANEL_TYP_TIME_TRACKER: {
					return {
						t: type,
						r: toSaveTitle,
						s: $content.find(`.dm-time__root`).data("getState")(),
					};
				}
				case PANEL_TYP_ADVENTURE_DYNAMIC_MAP: {
					return {
						t: type,
						r: toSaveTitle,
						s: $content.find(`.dm-map__root`).data("getState")(),
					};
				}
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
		};

		const toSave = getSaveableContent(this.type, this.contentMeta, this.$content);
		if (toSave) Object.assign(out, toSave);

		if (this.isTabs) {
			out.a = this.tabDatas.filter(it => !it.isDeleted).map(td => getSaveableContent(td.type, td.contentMeta, td.$content, td.tabRenamed, td.title));
			// offset saved tabindex by number of deleted tabs that come before
			let delCount = 0;
			for (let i = 0; i < this.tabIndex; ++i) {
				if (this.tabDatas[i].isDeleted) delCount++;
			}
			out.b = this.tabIndex - delCount;
		}

		return out;
	}

	fireBoardEvent (boardEvt) {
		if (!this.$content) return;

		const fnHandleBoardEvent = $(this.$content.children()[0]).data("onBoardEvent");
		if (!fnHandleBoardEvent) return;

		fnHandleBoardEvent(boardEvt);
	}
}

class JoystickMenu {
	constructor (board, panel) {
		this.board = board;
		this.panel = panel;

		this.$ctrls = null;
	}

	initialise () {
		this.panel.$pnl.on("mouseover", () => this.panel.board.setHoveringPanel(this.panel));
		this.panel.$pnl.on("mouseout", () => this.panel.board.setHoveringPanel(null));

		const $ctrlMove = $(`<div class="panel-control-move panel-control-move--bg panel-control-move-middle"></div>`);
		const $ctrlXpandUp = $(`<div class="panel-control-move panel-control-move--bg panel-control-move-top"></div>`);
		const $ctrlXpandRight = $(`<div class="panel-control-move panel-control-move--bg panel-control-move-right"></div>`);
		const $ctrlXpandDown = $(`<div class="panel-control-move panel-control-move--bg panel-control-move-bottom"></div>`);
		const $ctrlXpandLeft = $(`<div class="panel-control-move panel-control-move--bg panel-control-move-left"></div>`);
		const $ctrlBtnDone = $(`<div class="panel-control-move panel-control-move--bg panel-control-move-btn-done">
			<div class="panel-control-move-icn-done glyphicon glyphicon-move ve-text-center" title="Stop Moving"></div>
		</div>`);
		const $ctrlBg = $(`<div class="panel-control-move panel-control-bg"></div>`);
		this.$ctrls = [$ctrlMove, $ctrlXpandUp, $ctrlXpandRight, $ctrlXpandDown, $ctrlXpandLeft, $ctrlBtnDone, $ctrlBg];

		$ctrlMove.on("mousedown touchstart", (evt) => {
			evt.preventDefault();
			this.panel.board.setVisiblyHoveringPanel(true);
			const $body = $(`body`);
			MiscUtil.clearSelection();
			$body.css("userSelect", "none");
			if (!this.panel.$content) return;

			const w = this.panel.$content.width();
			const h = this.panel.$content.height();
			const childH = this.panel.$content.children().first().height();
			const offset = this.panel.$content.offset();
			const offsetX = EventUtil.getClientX(evt) - offset.left;
			const offsetY = h > childH ? childH / 2 : (EventUtil.getClientY(evt) - offset.top);

			$body.append(this.panel.$content);
			$(`.panel-control-move`).hide();
			Panel.setMovingCss(evt, this.panel.$content, w, h, offsetX, offsetY, 52);
			this.panel.board.get$creen().addClass("board-content-hovering");
			this.panel.$content.addClass("panel-content-hovering");
			this.panel.$pnl.addClass("pnl-content-tab-bar-hidden");
			// clean any lingering hidden scrollbar
			this.panel.$pnl.removeClass("panel-mode-move");

			Panel.bindMovingEvents(this.panel.board, this.panel.$content, offsetX, offsetY);

			$(document).on(`mouseup${EVT_NAMESPACE} touchend${EVT_NAMESPACE}`, () => {
				this.panel.board.setVisiblyHoveringPanel(false);
				$(document).off(`mousemove${EVT_NAMESPACE} touchmove${EVT_NAMESPACE}`).off(`mouseup${EVT_NAMESPACE} touchend${EVT_NAMESPACE}`);

				$body.css("userSelect", "");
				Panel.unsetMovingCss(this.panel.$content);
				this.panel.board.get$creen().removeClass("board-content-hovering");
				this.panel.$content.removeClass("panel-content-hovering");
				this.panel.$pnl.removeClass("pnl-content-tab-bar-hidden");
				// clean any lingering hidden scrollbar
				this.panel.$pnl.removeClass("panel-mode-move");

				if (!this.panel.board.hoveringPanel || this.panel.id === this.panel.board.hoveringPanel.id) {
					this.panel.$pnlWrpContent.append(this.panel.$content);
					this.panel.doShowJoystick();
				} else {
					const her = this.panel.board.hoveringPanel;
					// TODO this should ideally peel off the selected tab and transfer it to the target pane, instead of swapping
					const herMeta = her.getPanelMeta();
					const $herContent = her.get$Content();
					her.setFromPeer(this.panel.getPanelMeta(), this.panel.get$Content(), this.panel.isMovable());
					this.panel.setFromPeer(herMeta, $herContent, her.isMovable());

					this.panel.doHideJoystick();
					her.doShowJoystick();
				}
				MiscUtil.clearSelection();
				this.board.doSaveStateDebounced();
				this.board.$creen.trigger("panelResize");
			});
		});

		function xpandHandler (dir, evt) {
			evt.preventDefault();
			MiscUtil.clearSelection();
			$(`body`).css("userSelect", "none");
			$(`.panel-control-move`).hide();
			$(`.panel-control-bar`).addClass("move-expand-active");
			$ctrlBg.show();
			this.panel.$pnl.addClass("panel-mode-move");
			switch (dir) {
				case UP:
					$ctrlXpandUp.show();
					break;
				case RIGHT:
					$ctrlXpandRight.show();
					break;
				case DOWN:
					$ctrlXpandDown.show();
					break;
				case LEFT:
					$ctrlXpandLeft.show();
					break;
			}
			const axis = dir === RIGHT || dir === LEFT ? AX_X : AX_Y;

			const pos = this.panel.$pnl.offset();
			const dim = this.panel.board.getPanelDimensions();
			let numPanelsCovered = 0;
			const initGCS = this.panel.$pnl.css("gridColumnStart");
			const initGCE = this.panel.$pnl.css("gridColumnEnd");
			const initGRS = this.panel.$pnl.css("gridRowStart");
			const initGRE = this.panel.$pnl.css("gridRowEnd");

			this.panel.$pnl.css({
				zIndex: 52,
				boxShadow: "0 0 12px 0 #000000a0",
			});

			$(document).off(`mousemove${EVT_NAMESPACE} touchmove${EVT_NAMESPACE}`).off(`mouseup${EVT_NAMESPACE} touchend${EVT_NAMESPACE}`);

			$(document).on(`mousemove${EVT_NAMESPACE} touchmove${EVT_NAMESPACE}`, (e) => {
				let delta = 0;
				const px = axis === AX_X ? dim.pxWidth : dim.pxHeight;
				switch (dir) {
					case UP:
						delta = pos.top - EventUtil.getClientY(e);
						break;
					case RIGHT:
						delta = EventUtil.getClientX(e) - (pos.left + (px * this.panel.width));
						break;
					case DOWN:
						delta = EventUtil.getClientY(e) - (pos.top + (px * this.panel.height));
						break;
					case LEFT:
						delta = pos.left - EventUtil.getClientX(e);
						break;
				}

				numPanelsCovered = Math.ceil((delta / px));
				const canShrink = axis === AX_X ? this.panel.width - 1 : this.panel.height - 1;
				if (canShrink + numPanelsCovered <= 0) numPanelsCovered = -canShrink;

				switch (dir) {
					case UP:
						if (numPanelsCovered > this.panel.y) numPanelsCovered = this.panel.y;
						this.panel.$pnl.css({
							gridRowStart: String(this.panel.y + (1 - numPanelsCovered)),
							gridRowEnd: String(this.panel.y + 1 + this.panel.height),
						});
						break;
					case RIGHT:
						if (numPanelsCovered > (this.panel.board.width - this.panel.width) - this.panel.x) numPanelsCovered = (this.panel.board.width - this.panel.width) - this.panel.x;
						this.panel.$pnl.css({
							gridColumnEnd: String(this.panel.x + 1 + this.panel.width + numPanelsCovered),
						});
						break;
					case DOWN:
						if (numPanelsCovered > (this.panel.board.height - this.panel.height) - this.panel.y) numPanelsCovered = (this.panel.board.height - this.panel.height) - this.panel.y;
						this.panel.$pnl.css({
							gridRowEnd: String(this.panel.y + 1 + this.panel.height + numPanelsCovered),
						});
						break;
					case LEFT:
						if (numPanelsCovered > this.panel.x) numPanelsCovered = this.panel.x;
						this.panel.$pnl.css({
							gridColumnStart: String(this.panel.x + (1 - numPanelsCovered)),
							gridColumnEnd: String(this.panel.x + 1 + this.panel.width),
						});
						break;
				}
			});

			$(document).on(`mouseup${EVT_NAMESPACE} touchend${EVT_NAMESPACE}`, () => {
				$(document).off(`mousemove${EVT_NAMESPACE} touchmove${EVT_NAMESPACE}`).off(`mouseup${EVT_NAMESPACE} touchend${EVT_NAMESPACE}`);

				$(document.body).css("userSelect", "");
				this.panel.$pnl.find(`.panel-control-move`).show();
				$(`.panel-control-bar`).removeClass("move-expand-active");
				this.panel.$pnl.css({
					zIndex: "",
					boxShadow: "",
					gridColumnStart: initGCS,
					gridColumnEnd: initGCE,
					gridRowStart: initGRS,
					gridRowEnd: initGRE,
				});

				const canShrink = axis === AX_X ? this.panel.width - 1 : this.panel.height - 1;
				if (canShrink + numPanelsCovered <= 0) numPanelsCovered = -canShrink;
				if (numPanelsCovered === 0) return;
				const isGrowth = !!~Math.sign(numPanelsCovered);
				if (isGrowth) {
					switch (dir) {
						case UP:
							if (!this.panel.hasSpaceTop()) return;
							break;
						case RIGHT:
							if (!this.panel.hasSpaceRight()) return;
							break;
						case DOWN:
							if (!this.panel.hasSpaceBottom()) return;
							break;
						case LEFT:
							if (!this.panel.hasSpaceLeft()) return;
							break;
					}
				}

				for (let i = Math.abs(numPanelsCovered); i > 0; --i) {
					switch (dir) {
						case UP: {
							if (isGrowth) {
								const tNeighbours = this.panel.getTopNeighbours();
								if (tNeighbours.filter(it => it.getEmpty()).length === tNeighbours.length) {
									tNeighbours.forEach(p => p.destroy());
								} else {
									tNeighbours.forEach(p => {
										if (p.canBumpTop()) p.doBumpTop();
										else if (p.canShrinkBottom()) p.doShrinkBottom();
										else p.exile();
									});
								}
							}
							this.panel.height += Math.sign(numPanelsCovered);
							this.panel.y -= Math.sign(numPanelsCovered);
							break;
						}
						case RIGHT: {
							if (isGrowth) {
								const rNeighbours = this.panel.getRightNeighbours();
								if (rNeighbours.filter(it => it.getEmpty()).length === rNeighbours.length) {
									rNeighbours.forEach(p => p.destroy());
								} else {
									rNeighbours.forEach(p => {
										if (p.canBumpRight()) p.doBumpRight();
										else if (p.canShrinkLeft()) p.doShrinkLeft();
										else p.exile();
									});
								}
							}
							this.panel.width += Math.sign(numPanelsCovered);
							break;
						}
						case DOWN: {
							if (isGrowth) {
								const bNeighbours = this.panel.getBottomNeighbours();
								if (bNeighbours.filter(it => it.getEmpty()).length === bNeighbours.length) {
									bNeighbours.forEach(p => p.destroy());
								} else {
									bNeighbours.forEach(p => {
										if (p.canBumpBottom()) p.doBumpBottom();
										else if (p.canShrinkTop()) p.doShrinkTop();
										else p.exile();
									});
								}
							}
							this.panel.height += Math.sign(numPanelsCovered);
							break;
						}
						case LEFT: {
							if (isGrowth) {
								const lNeighbours = this.panel.getLeftNeighbours();
								if (lNeighbours.filter(it => it.getEmpty()).length === lNeighbours.length) {
									lNeighbours.forEach(p => p.destroy());
								} else {
									lNeighbours.forEach(p => {
										if (p.canBumpLeft()) p.doBumpLeft();
										else if (p.canShrinkRight()) p.doShrinkRight();
										else p.exile();
									});
								}
							}
							this.panel.width += Math.sign(numPanelsCovered);
							this.panel.x -= Math.sign(numPanelsCovered);
							break;
						}
					}
				}
				this.panel.setDirty(true);
				this.panel.render();
				this.panel.board.doCheckFillSpaces();
				MiscUtil.clearSelection();
				this.board.$creen.trigger("panelResize");
			});
		}

		$ctrlXpandUp.on("mousedown touchstart", xpandHandler.bind(this, UP));
		$ctrlXpandRight.on("mousedown touchstart", xpandHandler.bind(this, RIGHT));
		$ctrlXpandLeft.on("mousedown touchstart", xpandHandler.bind(this, LEFT));
		$ctrlXpandDown.on("mousedown touchstart", xpandHandler.bind(this, DOWN));

		$ctrlBtnDone.on("mousedown touchstart", evt => {
			evt.preventDefault();
			this.panel.toggleMovable(false);
		});

		this.panel.$pnl
			.append($ctrlBg)
			.append($ctrlMove)
			.append($ctrlXpandUp)
			.append($ctrlXpandRight)
			.append($ctrlXpandDown)
			.append($ctrlXpandLeft)
			.append($ctrlBtnDone);
	}

	doShow () {
		this.$ctrls.forEach($c => $c.show());
	}

	doHide () {
		this.$ctrls.forEach($c => $c.hide());
	}
}

class AddMenu {
	constructor () {
		this.tabs = [];

		this._$menuInner = null;
		this.$tabView = null;
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
		$(document.activeElement).blur();

		this._$menuInner.find(`.panel-addmenu-tab-head`).attr(`active`, false);
		if (this.activeTab) this.activeTab.get$Tab().detach();
		this.activeTab = tab;
		this.$tabView.append(tab.get$Tab());
		tab.$head.attr(`active`, true);

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
		if (this._$menuInner) return;

		this._$menuInner = $(`<div class="ve-flex-col w-100 h-100">`);
		const $tabBar = $(`<div class="panel-addmenu-bar"></div>`).appendTo(this._$menuInner);
		this.$tabView = $(`<div class="panel-addmenu-view"></div>`).appendTo(this._$menuInner);

		await this.tabs.pMap(t => t.pRender());

		this.tabs
			.forEach(t => {
				const $head = $(`<button class="ve-btn ve-btn-default panel-addmenu-tab-head">${t.label}</button>`).appendTo($tabBar);
				const $body = $(`<div class="panel-addmenu-tab-body"></div>`).appendTo($tabBar);
				$body.append(t.get$Tab);
				t.$head = $head;
				t.$body = $body;
				$head.on("click", () => this.pSetActiveTab(t));
			});
	}

	setPanel (pnl) {
		this.pnl = pnl;
	}

	doClose () {
		if (this._doClose) this._doClose();
	}

	doOpen () {
		const {$modalInner, doClose} = UiUtil.getShowModal({
			cbClose: () => {
				this._$menuInner.detach();

				// undo entering "tabbed mode" if we close without adding a tab
				if (this.pnl.isTabs && this.pnl.tabDatas.filter(it => !it.isDeleted).length === 1) {
					this.pnl.setIsTabs(false);
				}
			},
			zIndex: VeCt.Z_INDEX_BENEATH_HOVER,
		});
		this._doClose = doClose;
		$modalInner.append(this._$menuInner);
	}
}

class AddMenuTab {
	constructor ({board, label}) {
		this._board = board;
		this.label = label;

		this.$tab = null;
		this.menu = null;
	}

	get$Tab () {
		return this.$tab;
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
		if (!this.$tab) {
			const $tab = $(`<div class="ui-search__wrp-output underline-tabs" id="${this.tabId}"></div>`);

			const $wrpYT = $(`<div class="ui-modal__row"></div>`).appendTo($tab);
			const $iptUrlYT = $(`<input class="form-control" placeholder="Paste YouTube URL">`)
				.on("keydown", (e) => {
					if (e.which === 13) $btnAddYT.click();
				})
				.appendTo($wrpYT);
			const $btnAddYT = $(`<button class="ve-btn ve-btn-primary ve-btn-sm">Embed</button>`).appendTo($wrpYT);
			$btnAddYT.on("click", () => {
				let url = $iptUrlYT.val().trim();
				const m = /https?:\/\/(www\.)?youtube\.com\/watch\?v=(.*?)(&.*$|$)/.exec(url);
				if (url && m) {
					url = `https://www.youtube.com/embed/${m[2]}`;
					this.menu.pnl.doPopulate_YouTube(url);
					this.menu.doClose();
					$iptUrlYT.val("");
				} else {
					JqueryUtil.doToast({
						content: `Please enter a URL of the form: "https://www.youtube.com/watch?v=XXXXXXX"`,
						type: "danger",
					});
				}
			});

			const $wrpTwitch = $(`<div class="ui-modal__row"></div>`).appendTo($tab);
			const $iptUrlTwitch = $(`<input class="form-control" placeholder="Paste Twitch URL">`)
				.on("keydown", (e) => {
					if (e.which === 13) $btnAddTwitch.click();
				})
				.appendTo($wrpTwitch);
			const $btnAddTwitch = $(`<button class="ve-btn ve-btn-primary ve-btn-sm">Embed</button>`).appendTo($wrpTwitch);
			const $btnAddTwitchChat = $(`<button class="ve-btn ve-btn-primary ve-btn-sm">Embed Chat</button>`).appendTo($wrpTwitch);
			const getTwitchM = (url) => {
				return /https?:\/\/(www\.)?twitch\.tv\/(.*?)(\?.*$|$)/.exec(url);
			};
			$btnAddTwitch.on("click", () => {
				let url = $iptUrlTwitch.val().trim();
				const m = getTwitchM(url);
				if (url && m) {
					url = `http://player.twitch.tv/?channel=${m[2]}`;
					this.menu.pnl.doPopulate_Twitch(url);
					this.menu.doClose();
					$iptUrlTwitch.val("");
				} else {
					JqueryUtil.doToast({
						content: `Please enter a URL of the form: "https://www.twitch.tv/XXXXXX"`,
						type: "danger",
					});
				}
			});

			$btnAddTwitchChat.on("click", () => {
				let url = $iptUrlTwitch.val().trim();
				const m = getTwitchM(url);
				if (url && m) {
					url = `https://www.twitch.tv/embed/${m[2]}/chat`;
					this.menu.pnl.doPopulate_TwitchChat(url);
					this.menu.doClose();
					$iptUrlTwitch.val("");
				} else {
					JqueryUtil.doToast({
						content: `Please enter a URL of the form: "https://www.twitch.tv/XXXXXX"`,
						type: "danger",
					});
				}
			});

			const $wrpGeneric = $(`<div class="ui-modal__row"></div>`).appendTo($tab);
			const $iptUrlGeneric = $(`<input class="form-control" placeholder="Paste any URL">`)
				.on("keydown", (e) => {
					if (e.which === 13) $iptUrlGeneric.click();
				})
				.appendTo($wrpGeneric);
			const $btnAddGeneric = $(`<button class="ve-btn ve-btn-primary ve-btn-sm">Embed</button>`).appendTo($wrpGeneric);
			$btnAddGeneric.on("click", () => {
				let url = $iptUrlGeneric.val().trim();
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

			this.$tab = $tab;
		}
	}
}

class AddMenuImageTab extends AddMenuTab {
	constructor ({...opts}) {
		super({...opts, label: "Image"});
		this.tabId = this.genTabId("image");
	}

	async pRender () {
		if (!this.$tab) {
			const $tab = $(`<div class="ui-search__wrp-output underline-tabs" id="${this.tabId}"></div>`);

			// region Imgur
			const $wrpImgur = $(`<div class="ui-modal__row"></div>`).appendTo($tab);
			$(`<span>Imgur (Anonymous Upload) <i class="ve-muted">(accepts <a href="https://help.imgur.com/hc/articles/115000083326" target="_blank" rel="noopener noreferrer">imgur-friendly formats</a>)</i></span>`).appendTo($wrpImgur);
			const $iptFile = $(`<input type="file" class="hidden">`).on("change", (evt) => {
				const input = evt.target;
				const reader = new FileReader();
				reader.onload = () => {
					const base64 = reader.result.replace(/.*,/, "");
					$.ajax({
						url: "https://api.imgur.com/3/image",
						type: "POST",
						data: {
							image: base64,
							type: "base64",
						},
						headers: {
							Accept: "application/json",
							Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
						},
						success: (data) => {
							this.menu.pnl.doPopulate_Image(data.data.link, ix);
						},
						error: (error) => {
							try {
								JqueryUtil.doToast({
									content: `Failed to upload: ${JSON.parse(error.responseText).data.error}`,
									type: "danger",
								});
							} catch (e) {
								JqueryUtil.doToast({
									content: "Failed to upload: Unknown error",
									type: "danger",
								});
								setTimeout(() => { throw e; });
							}
							this.menu.pnl.doPopulate_Empty(ix);
						},
					});
				};
				reader.onerror = () => {
					this.menu.pnl.doPopulate_Empty(ix);
				};
				reader.fileName = input.files[0].name;
				reader.readAsDataURL(input.files[0]);
				const ix = this.menu.pnl.doPopulate_Loading("Uploading"); // will be null if not in tabbed mode
				this.menu.doClose();
			}).appendTo($tab);
			const $btnAdd = $(`<button class="ve-btn ve-btn-primary ve-btn-sm">Upload</button>`).appendTo($wrpImgur);
			$btnAdd.on("click", () => {
				$iptFile.click();
			});
			// endregion

			// region URL
			const $wrpUtl = $(`<div class="ui-modal__row"></div>`).appendTo($tab);
			const $iptUrl = $(`<input class="form-control" placeholder="Paste image URL">`)
				.on("keydown", (e) => {
					if (e.which === 13) $btnAddUrl.click();
				})
				.appendTo($wrpUtl);
			const $btnAddUrl = $(`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`).appendTo($wrpUtl);
			$btnAddUrl.on("click", () => {
				let url = $iptUrl.val().trim();
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

			$(`<hr class="hr-2">`).appendTo($tab);

			// region Adventure dynamic viewer
			const $btnSelectAdventure = $(`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`)
				.click(() => DmMapper.pHandleMenuButtonClick(this.menu));

			$$`<div class="ui-modal__row">
				<div>Adventure/Book Map Dynamic Viewer</div>
				${$btnSelectAdventure}
			</div>`.appendTo($tab);
			// endregion

			this.$tab = $tab;
		}
	}
}

class AddMenuSpecialTab extends AddMenuTab {
	constructor ({...opts}) {
		super({...opts, label: "Special"});
		this.tabId = this.genTabId("special");
	}

	async pRender () {
		if (!this.$tab) {
			const $tab = $(`<div class="ui-search__wrp-output underline-tabs ve-overflow-y-auto pr-1" id="${this.tabId}"></div>`);

			const $wrpRoller = $(`<div class="ui-modal__row"><span>Dice Roller <i class="ve-muted">(pins the existing dice roller to a panel)</i></span></div>`).appendTo($tab);
			const $btnRoller = $(`<button class="ve-btn ve-btn-primary ve-btn-sm">Pin</button>`).appendTo($wrpRoller);
			$btnRoller.on("click", () => {
				Renderer.dice.bindDmScreenPanel(this.menu.pnl);
				this.menu.doClose();
			});
			$(`<hr class="hr-2">`).appendTo($tab);

			const $btnTracker = $(`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`)
				.on("click", async () => {
					const pcm = new PanelContentManager_InitiativeTracker({board: this._board, panel: this.menu.pnl});
					this.menu.doClose();
					await pcm.pDoPopulate();
				});

			$$`<div class="ui-modal__row">
			<span>Initiative Tracker</span>
			${$btnTracker}
			</div>`.appendTo($tab);

			const $btnTrackerCreatureViewer = $(`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`)
				.on("click", async () => {
					const pcm = new PanelContentManager_InitiativeTrackerCreatureViewer({board: this._board, panel: this.menu.pnl});
					this.menu.doClose();
					await pcm.pDoPopulate();
				});

			$$`<div class="ui-modal__row">
			<span>Initiative Tracker Creature Viewer</span>
			${$btnTrackerCreatureViewer}
			</div>`.appendTo($tab);

			const $btnPlayerTrackerV1 = $(`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`)
				.on("click", async () => {
					const pcm = new PanelContentManager_InitiativeTrackerPlayerViewV1({board: this._board, panel: this.menu.pnl});
					this.menu.doClose();
					await pcm.pDoPopulate();
				});

			$$`<div class="ui-modal__row">
			<span>Initiative Tracker Player View (Standard)</span>
			${$btnPlayerTrackerV1}
			</div>`.appendTo($tab);

			const $btnPlayerTrackerV0 = $(`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`)
				.on("click", async () => {
					const pcm = new PanelContentManager_InitiativeTrackerPlayerViewV0({board: this._board, panel: this.menu.pnl});
					this.menu.doClose();
					await pcm.pDoPopulate();
				});

			$$`<div class="ui-modal__row">
			<span>Initiative Tracker Player View (Manual/Legacy)</span>
			${$btnPlayerTrackerV0}
			</div>`.appendTo($tab);

			$(`<hr class="hr-2">`).appendTo($tab);

			const $btnSublist = $(`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`)
				.click(async evt => {
					await this.menu.pnl.pDoMassPopulate_Entities(evt);
					this.menu.doClose();
				});

			$$`<div class="ui-modal__row">
			<span title="Including, but not limited to, a Bestiary Encounter.">Pinned List Entries</span>
			${$btnSublist}
			</div>`.appendTo($tab);

			$(`<hr class="hr-2">`).appendTo($tab);

			const $btnSwitchToEmbedTag = $(`<button class="ve-btn ve-btn-default ve-btn-xxs">embed</button>`)
				.on("click", async () => {
					await this.menu.pSetActiveTab(this.menu.getTab({label: "Embed"}));
				});

			const $wrpText = $$`<div class="ui-modal__row"><span>Basic Text Box <i class="ve-muted">(for a feature-rich editor, ${$btnSwitchToEmbedTag} a Google Doc or similar)</i></span></div>`.appendTo($tab);
			const $btnText = $(`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`).appendTo($wrpText);
			$btnText.on("click", () => {
				this.menu.pnl.doPopulate_TextBox();
				this.menu.doClose();
			});
			$(`<hr class="hr-2">`).appendTo($tab);

			const $wrpUnitConverter = $(`<div class="ui-modal__row"><span>Unit Converter</span></div>`).appendTo($tab);
			const $btnUnitConverter = $(`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`).appendTo($wrpUnitConverter);
			$btnUnitConverter.on("click", () => {
				this.menu.pnl.doPopulate_UnitConverter();
				this.menu.doClose();
			});

			const $wrpMoneyConverter = $(`<div class="ui-modal__row"><span>Coin Converter</span></div>`).appendTo($tab);
			const $btnMoneyConverter = $(`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`).appendTo($wrpMoneyConverter);
			$btnMoneyConverter.on("click", () => {
				this.menu.pnl.doPopulate_MoneyConverter();
				this.menu.doClose();
			});

			const $wrpCounter = $(`<div class="ui-modal__row"><span>Counter</span></div>`).appendTo($tab);
			const $btnCounter = $(`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`).appendTo($wrpCounter);
			$btnCounter.on("click", () => {
				this.menu.pnl.doPopulate_Counter();
				this.menu.doClose();
			});

			$(`<hr class="hr-2">`).appendTo($tab);

			const $wrpTimeTracker = $(`<div class="ui-modal__row"><span>In-Game Clock/Calendar</span></div>`).appendTo($tab);
			const $btnTimeTracker = $(`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`).appendTo($wrpTimeTracker);
			$btnTimeTracker.on("click", () => {
				this.menu.pnl.doPopulate_TimeTracker();
				this.menu.doClose();
			});

			$(`<hr class="hr-2">`).appendTo($tab);

			const $wrpBlank = $(`<div class="ui-modal__row"><span class="help" title="For those who don't like plus signs.">Blank Space</span></div>`).appendTo($tab);
			$(`<button class="ve-btn ve-btn-primary ve-btn-sm">Add</button>`)
				.on("click", () => {
					this.menu.pnl.doPopulate_Blank();
					this.menu.doClose();
				})
				.appendTo($wrpBlank);

			this.$tab = $tab;
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

		this.$selCat = null;
		this.$srch = null;
		this.$results = null;
		this.showMsgIpt = null;
		this._pDoSearch = null;
		this._$ptrRows = null;
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

	_$getRow (r) {
		switch (this.subType) {
			case "content": return $(`
				<div class="ui-search__row" tabindex="0">
					<span><span class="ve-muted">${r.doc.cf}</span> ${r.doc.n}</span>
					<span>${r.doc.s ? `<i title="${Parser.sourceJsonToFull(r.doc.s)}">${Parser.sourceJsonToAbv(r.doc.s)}${r.doc.p ? ` p${r.doc.p}` : ""}</i>` : ""}</span>
				</div>
			`);
			case "rule": return $(`
				<div class="ui-search__row" tabindex="0">
					<span>${r.doc.h}</span>
					<span><i>${r.doc.n}, ${r.doc.s}</i></span>
				</div>
			`);
			case "adventure":
			case "book": return $(`
				<div class="ui-search__row" tabindex="0">
					<span>${r.doc.c}</span>
					<span><i>${r.doc.n}${r.doc.o ? `, ${r.doc.o}` : ""}</i></span>
				</div>
			`);
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
			this.$results.empty().append(SearchWidget.getSearchEnter());
		};

		const showMsgDots = () => {
			this.$results.empty().append(SearchWidget.getSearchLoading());
		};

		const showNoResults = () => {
			flags.isWait = true;
			this.$results.empty().append(SearchWidget.getSearchEnter());
		};

		this._$ptrRows = {_: []};

		this._pDoSearch = async () => {
			const srch = this.$srch.val().trim();

			const searchOptions = this._getSearchOptions();
			const index = this.indexes[this.cat];
			let results = index.search(srch, searchOptions);

			if (this.subType === "content") {
				results = await Omnisearch.pGetFilteredResults(results);
			}

			const resultCount = results.length ? results.length : index.documentStore.length;
			const toProcess = results.length ? results : Object.values(index.documentStore.docs).slice(0, UiUtil.SEARCH_RESULTS_CAP).map(it => ({doc: it}));

			this.$results.empty();
			this._$ptrRows._ = [];

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
					const $row = this._$getRow(r).appendTo(this.$results);
					SearchWidget.bindRowHandlers({result: r, $row, $ptrRows: this._$ptrRows, fnHandleClick: handleClick, $iptSearch: this.$srch});
					this._$ptrRows._.push($row);
				});

				if (resultCount > UiUtil.SEARCH_RESULTS_CAP) {
					const diff = resultCount - UiUtil.SEARCH_RESULTS_CAP;
					this.$results.append(`<div class="ui-search__row ui-search__row--readonly">...${diff} more result${diff === 1 ? " was" : "s were"} hidden. Refine your search!</div>`);
				}
			} else {
				if (!srch.trim()) this.showMsgIpt();
				else showNoResults();
			}
		};

		if (!this.$tab) {
			const $tab = $(`<div class="ui-search__wrp-output" id="${this.tabId}"></div>`);
			const $wrpCtrls = $(`<div class="ui-search__wrp-controls ui-search__wrp-controls--in-tabs"></div>`).appendTo($tab);

			const $selCat = $(`
				<select class="form-control ui-search__sel-category">
					<option value="ALL">${this._getAllTitle()}</option>
				</select>
			`).appendTo($wrpCtrls).toggle(Object.keys(this.indexes).length !== 1);
			Object.keys(this.indexes).sort().filter(it => it !== "ALL").forEach(it => {
				$selCat.append(`<option value="${it}">${this._getCatOptionText(it)}</option>`);
			});
			$selCat.on("change", async () => {
				this.cat = $selCat.val();
				await this._pDoSearch();
			});

			const $srch = $(`<input class="ui-search__ipt-search search form-control" autocomplete="off" placeholder="Search...">`).blurOnEsc().appendTo($wrpCtrls);
			const $results = $(`<div class="ui-search__wrp-results"></div>`).appendTo($tab);

			SearchWidget.bindAutoSearch($srch, {
				flags,
				pFnSearch: this._pDoSearch,
				fnShowWait: showMsgDots,
				$ptrRows: this._$ptrRows,
			});

			this.$tab = $tab;
			this.$selCat = $selCat;
			this.$srch = $srch;
			this.$results = $results;

			await this._pDoSearch();
		}
	}

	async pDoTransitionActive () {
		this.$srch.val("").focus();
		if (this._pDoSearch) await this._pDoSearch();
	}
}

class RuleLoader {
	static async pFill (book) {
		const $$$ = RuleLoader.cache;
		if ($$$[book]) return $$$[book];

		const data = await DataUtil.loadJSON(`data/generated/${book}.json`);
		Object.keys(data.data).forEach(b => {
			const ref = data.data[b];
			if (!$$$[b]) $$$[b] = {};
			ref.forEach((c, i) => {
				if (!$$$[b][i]) $$$[b][i] = {};
				c.entries.forEach(s => {
					$$$[b][i][s.name] = s;
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

class NoteBox {
	static make$Notebox (board, content) {
		const $iptText = $(`<textarea class="panel-content-textarea" placeholder="Supports inline rolls and content tags (CTRL-q with the caret in the text to activate the embed):\n • Inline rolls,  [[1d20+2]]\n • Content tags (as per the Demo page), {@creature goblin}, {@spell fireball}\n • Link tags, {@link https://5e.tools}">${content || ""}</textarea>`)
			.on("keydown", async evt => {
				const key = EventUtil.getKeyIgnoreCapsLock(evt);

				const isCtrlQ = (EventUtil.isCtrlMetaKey(evt)) && key === "q";

				if (!isCtrlQ) {
					board.doSaveStateDebounced();
					return;
				}

				const txt = $iptText[0];
				if (txt.selectionStart === txt.selectionEnd) {
					const pos = txt.selectionStart - 1;
					const text = txt.value;
					const l = text.length;
					let beltStack = [];
					let braceStack = [];
					let belts = 0;
					let braces = 0;
					let beltsAtPos = null;
					let bracesAtPos = null;
					let lastBeltPos = null;
					let lastBracePos = null;
					outer: for (let i = 0; i < l; ++i) {
						const c = text[i];
						switch (c) {
							case "[":
								belts = Math.min(belts + 1, 2);
								if (belts === 2) beltStack = [];
								lastBeltPos = i;
								break;
							case "]":
								belts = Math.max(belts - 1, 0);
								if (belts === 0 && i > pos) break outer;
								break;
							case "{":
								if (text[i + 1] === "@") {
									braces = 1;
									braceStack = [];
									lastBracePos = i;
								}
								break;
							case "}":
								braces = 0;
								if (i >= pos) break outer;
								break;
							default:
								if (belts === 2) {
									beltStack.push(c);
								}
								if (braces) {
									braceStack.push(c);
								}
						}
						if (i === pos) {
							beltsAtPos = belts;
							bracesAtPos = braces;
						}
					}

					if (beltsAtPos === 2 && belts === 0) {
						const str = beltStack.join("");
						await Renderer.dice.pRoll2(str.replace(`[[`, "").replace(`]]`, ""), {
							isUser: false,
							name: "DM Screen",
						});
					} else if (bracesAtPos === 1 && braces === 0) {
						const str = braceStack.join("");
						const tag = str.split(" ")[0].replace(/^@/, "");
						const text = str.split(" ").slice(1).join(" ");
						if (Renderer.tag.getPage(tag)) {
							const r = Renderer.get().render(`{${str}}`);
							evt.type = "mouseover";
							evt.shiftKey = true;
							evt.ctrlKey = false;
							evt.metaKey = false;
							$(r).trigger(evt);
						} else if (tag === "link") {
							const [txt, link] = Renderer.splitTagByPipe(text);
							window.open(link && link.trim() ? link : txt);
						}
					}
				}
			});

		return $iptText;
	}
}

class UnitConverter {
	static make$Converter (board, state) {
		const units = [
			new UnitConverterUnit("Inches", "2.54", "Centimetres", "0.394"),
			new UnitConverterUnit("Feet", "0.305", "Metres", "3.28"),
			new UnitConverterUnit("Miles", "1.61", "Kilometres", "0.620"),
			new UnitConverterUnit("Pounds", "0.454", "Kilograms", "2.20"),
			new UnitConverterUnit("Gallons", "3.79", "Litres", "0.264"),
			new UnitConverterUnit("Gallons", "8", "Pints", "0.125"),
		];

		let ixConv = state.c || 0;
		let dirConv = state.d || 0;

		const $wrpConverter = $(`<div class="dm-unitconv dm__panel-bg split-column"></div>`);

		const $tblConvert = $(`<table class="w-100 table-striped"></table>`).appendTo($wrpConverter);
		const $tbodyConvert = $(`<tbody></tbody>`).appendTo($tblConvert);
		units.forEach((u, i) => {
			const $tr = $(`<tr class="row clickable"></tr>`).appendTo($tbodyConvert);
			const clickL = () => {
				ixConv = i;
				dirConv = 0;
				updateDisplay();
			};
			const clickR = () => {
				ixConv = i;
				dirConv = 1;
				updateDisplay();
			};
			$(`<td class="ve-col-3">${u.n1}</td>`).click(clickL).appendTo($tr);
			$(`<td class="ve-col-3 code">×${u.x1.padStart(5)}</td>`).click(clickL).appendTo($tr);
			$(`<td class="ve-col-3">${u.n2}</td>`).click(clickR).appendTo($tr);
			$(`<td class="ve-col-3 code">×${u.x2.padStart(5)}</td>`).click(clickR).appendTo($tr);
		});

		const $wrpIpt = $(`<div class="split dm-unitconv__wrp-ipt"></div>`).appendTo($wrpConverter);

		const $wrpLeft = $(`<div class="split-column dm-unitconv__wrp-ipt-inner"></div>`).appendTo($wrpIpt);
		const $lblLeft = $(`<span class="bold"></span>`).appendTo($wrpLeft);
		const $iptLeft = $(`<textarea class="dm-unitconv__ipt form-control">${state.i || ""}</textarea>`).appendTo($wrpLeft);

		const $btnSwitch = $(`<button class="ve-btn ve-btn-primary dm-unitconv__btn-switch">⇆</button>`).click(() => {
			dirConv = Number(!dirConv);
			updateDisplay();
		}).appendTo($wrpIpt);

		const $wrpRight = $(`<div class="split-column dm-unitconv__wrp-ipt-inner"></div>`).appendTo($wrpIpt);
		const $lblRight = $(`<span class="bold"></span>`).appendTo($wrpRight);
		const $iptRight = $(`<textarea class="dm-unitconv__ipt form-control" disabled style="background: #0000"></textarea>`).appendTo($wrpRight);

		const updateDisplay = () => {
			const it = units[ixConv];
			const [lblL, lblR] = dirConv === 0 ? [it.n1, it.n2] : [it.n2, it.n1];
			$lblLeft.text(lblL);
			$lblRight.text(lblR);
			handleInput();
		};

		const mMaths = /^([0-9.+\-*/ ()e])*$/;
		const handleInput = () => {
			const showInvalid = () => {
				$iptLeft.addClass(`ipt-invalid`);
				$iptRight.val("");
			};
			const showValid = () => {
				$iptLeft.removeClass(`ipt-invalid`);
			};

			const val = ($iptLeft.val() || "").trim();
			if (!val) {
				showValid();
				$iptRight.val("");
			} else if (mMaths.exec(val)) {
				showValid();
				const it = units[ixConv];
				const mL = [Number(it.x1), Number(it.x2)][dirConv];
				try {
					/* eslint-disable */
					const total = eval(val);
					/* eslint-enable */
					$iptRight.val(Number((total * mL).toFixed(5)));
				} catch (e) {
					$iptLeft.addClass(`ipt-invalid`);
					$iptRight.val("");
				}
			} else showInvalid();
			board.doSaveStateDebounced();
		};

		UiUtil.bindTypingEnd({$ipt: $iptLeft, fnKeyup: handleInput});

		updateDisplay();

		$wrpConverter.data("getState", () => {
			return {
				c: ixConv,
				d: dirConv,
				i: $iptLeft.val(),
			};
		});

		return $wrpConverter;
	}
}

class UnitConverterUnit {
	constructor (n1, x1, n2, x2) {
		this.n1 = n1;
		this.x1 = x1;
		this.n2 = n2;
		this.x2 = x2;
	}
}

class AdventureOrBookView {
	constructor (prop, panel, loader, tabIx, contentMeta) {
		this._prop = prop;
		this._panel = panel;
		this._loader = loader;
		this._tabIx = tabIx;
		this._contentMeta = contentMeta;

		this._$wrpContent = null;
		this._$wrpContentOuter = null;
		this._$titlePrev = null;
		this._$titleNext = null;
	}

	$getEle () {
		this._$titlePrev = $(`<div class="dm-book__controls-title ve-overflow-ellipsis ve-text-right"></div>`);
		this._$titleNext = $(`<div class="dm-book__controls-title ve-overflow-ellipsis"></div>`);

		const $btnPrev = $(`<button class="ve-btn ve-btn-xs ve-btn-default mr-2" title="Previous Chapter"><span class="glyphicon glyphicon-chevron-left"></span></button>`)
			.click(() => this._handleButtonClick(-1));
		const $btnNext = $(`<button class="ve-btn ve-btn-xs ve-btn-default" title="Next Chapter"><span class="glyphicon glyphicon-chevron-right"></span></button>`)
			.click(() => this._handleButtonClick(1));

		this._$wrpContent = $(`<div class="h-100"></div>`);
		this._$wrpContentOuter = $$`<div class="h-100 dm-book__wrp-content">
			<table class="w-100 stats stats--book stats--book-hover"><tr><td colspan="6" class="pb-3">${this._$wrpContent}</td></tr></table>
		</div>`;

		const $wrp = $$`<div class="ve-flex-col h-100">
		${this._$wrpContentOuter}
		<div class="ve-flex no-shrink dm-book__wrp-controls">${this._$titlePrev}${$btnPrev}${$btnNext}${this._$titleNext}</div>
		</div>`;

		// assumes the data has already been loaded/cached
		this._render();

		return $wrp;
	}

	_handleButtonClick (direction) {
		this._contentMeta.c += direction;
		const hasRenderedData = this._render({isSkipMissingData: true});
		if (!hasRenderedData) this._contentMeta.c -= direction;
		else {
			this._$wrpContentOuter.scrollTop(0);
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
		this._$wrpContent.empty().fastSetHtml(stack[0]);

		const dataPrev = this._getData(this._contentMeta.c - 1, {isAllowMissing: true});
		const dataNext = this._getData(this._contentMeta.c + 1, {isAllowMissing: true});
		this._$titlePrev.text(dataPrev ? dataPrev.name : "").title(dataPrev ? dataPrev.name : "");
		this._$titleNext.text(dataNext ? dataNext.name : "").title(dataNext ? dataNext.name : "");

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
			$(`.dm-screen-loading`).find(`.initial-message`).text("Failed!");
			setTimeout(() => { throw err; });
		});
});
