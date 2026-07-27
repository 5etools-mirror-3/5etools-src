import {
	PANEL_TYP_ADVENTURES,
	PANEL_TYP_BLANK,
	PANEL_TYP_BOOKS,
	PANEL_TYP_CREATURE_SCALED_CLASS_SUMMON,
	PANEL_TYP_CREATURE_SCALED_CR,
	PANEL_TYP_CREATURE_SCALED_SPELL_SUMMON,
	PANEL_TYP_EMPTY,
	PANEL_TYP_ERROR,
	PANEL_TYP_IMAGE,
	PANEL_TYP_ROLLBOX,
	PANEL_TYP_RULES,
	PANEL_TYP_STATS,
} from "./dmscreen-consts.js";
import {DmScreenJoystickMenu} from "./dmscreen-joystickmenu.js";
import {PanelContentManagerFactory} from "./panels/dmscreen-panels.js";
import {adventureLoader, bookLoader, RuleLoader} from "./dmscreen-corpusloader.js";
import {AdventureOrBookView} from "./panels/dmscreen-panels-legacy.js";
import {Panzoom} from "../utils-ui/utils-ui-panzoom.js";

const _TITLE_LOADING = "Loading...";

export class Panel {
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
		this._eleContent = null;
		this.joyMenu = null;
		this.pnl = null;
		this.pnlWrpContent = null;
		this.pnlTitle = null;
		this.pnlAddTab = null;
		this.pnlWrpTabs = null;
		this.pnlTabs = null;

		this._exileElementMetas = null;
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
		return veT`<div class="panel-content-wrapper-inner"><div class="ve-ui-search__message loading-spinner"><i>${message}...</i></div></div>`;
	}

	static isNonExilableType (type) {
		return type === PANEL_TYP_ROLLBOX;
	}

	// region Panel population

	doPopulate_Empty (ixOpt) {
		this.closeTabContent(ixOpt);
	}

	doPopulate_Loading (message) {
		return this.setEleContentTab({
			panelType: PANEL_TYP_EMPTY,
			eleContent: Panel._getEleLoading(message),
			title: _TITLE_LOADING,
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

			const eleContentInner = veT`<div class="panel-content-wrapper-inner"></div>`;
			const eleContentStats = veT`<table class="ve-w-100 ve-stats"></table>`.vee.appendTo(eleContentInner);
			eleContentStats.vee.appends(fn(it));

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

			const btnScale = veE(btnScale_);
			const lastCr = this.contentMeta.cr != null ? Parser.numberToCr(this.contentMeta.cr) : mon.cr ? (mon.cr.cr || mon.cr) : null;

			Renderer.monster.getCrScaleTarget({
				win,
				btnScale,
				initialCr: lastCr,
				isCompact: true,
				cbRender: (targetCr) => {
					const originalCr = Parser.crToNumber(mon.cr) === targetCr;

					const doRender = (toRender) => {
						eleContentStats.vee.empty().vee.appends(Renderer.monster.getCompactRenderedString(toRender, {isShowScalers: true, isScaledCr: !originalCr}));

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

		if (this._onClickBtnScaleCrPrev) eleContentStats.vee.off("click", this._onClickBtnScaleCrPrev);
		this._onClickBtnScaleCrPrev = onClickBtnScaleCr;
		eleContentStats.vee.onn("click", onClickBtnScaleCr);

		const onClickBtnResetCr = (evt) => {
			const btnReset = evt.target.closest(".mon__btn-reset-cr");
			if (!btnReset) return;

			evt.stopPropagation();
			eleContentStats.vee.empty().vee.appends(Renderer.monster.getCompactRenderedString(mon, {isShowScalers: true, isScaledCr: false}));
			this.setTab({
				ix: this.tabIndex,
				type: PANEL_TYP_STATS,
				contentMeta: meta,
				eleContent: eleContentInner,
				title: mon.name,
				tabCanRename: true,
			});
		};

		if (this._onClickBtnResetCrPrev) eleContentStats.vee.off("click", this._onClickBtnResetCrPrev);
		this._onClickBtnResetCrPrev = onClickBtnResetCr;
		eleContentStats.vee.onn("click", onClickBtnResetCr);
	}

	_onChangeSelScaleSummonSpellLevelPrev = null;
	_onChangeSelScaleSummonClassLevelPrev = null;

	_stats_bindSummonScaleClickHandler (mon, meta, eleContentInner, eleContentStats) {
		if (mon.__prop !== "monster") return;

		const onChangeSelScaleSummonSpellLevel = async (evt) => {
			const selScale_ = evt.target.closest(`[name="mon__sel-summon-spell-level"]`);
			if (!selScale_) return;

			const selSummonSpellLevel = veE(selScale_);

			const spellLevel = Number(selSummonSpellLevel.vee.val());
			if (~spellLevel) {
				const nxtMeta = {
					...meta,
					ssl: spellLevel,
				};

				ScaleSpellSummonedCreature.scale(mon, spellLevel)
					.then(toRender => {
						eleContentStats.vee.empty().vee.appends(Renderer.monster.getCompactRenderedString(toRender, {isShowScalers: true, isScaledSpellSummon: true}));

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
				eleContentStats.vee.empty().vee.appends(Renderer.monster.getCompactRenderedString(mon, {isShowScalers: true, isScaledCr: false, isScaledSpellSummon: false}));

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

		if (this._onChangeSelScaleSummonSpellLevelPrev) eleContentStats.vee.off("change", this._onChangeSelScaleSummonSpellLevelPrev);
		this._onChangeSelScaleSummonSpellLevelPrev = onChangeSelScaleSummonSpellLevel;
		eleContentStats.vee.onn("change", onChangeSelScaleSummonSpellLevel);

		const onChangeSelScaleSummonClassLevel = async (evt) => {
			const selScale_ = evt.target.closest(`[name="mon__sel-summon-class-level"]`);
			if (!selScale_) return;

			const selSummonClassLevel = veE(selScale_);

			const classLevel = Number(selSummonClassLevel.vee.val());
			if (~classLevel) {
				const nxtMeta = {
					...meta,
					csl: classLevel,
				};

				ScaleClassSummonedCreature.scale(mon, classLevel)
					.then(toRender => {
						eleContentStats.vee.empty().vee.appends(Renderer.monster.getCompactRenderedString(toRender, {isShowScalers: true, isScaledClassSummon: true}));

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
				eleContentStats.vee.empty().vee.appends(Renderer.monster.getCompactRenderedString(mon, {isShowScalers: true, isScaledCr: false, isScaledClassSummon: false}));

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

		if (this._onChangeSelScaleSummonClassLevelPrev) eleContentStats.vee.off("change", this._onChangeSelScaleSummonClassLevelPrev);
		this._onChangeSelScaleSummonClassLevelPrev = onChangeSelScaleSummonClassLevel;
		eleContentStats.vee.onn("change", onChangeSelScaleSummonClassLevel);
	}

	_stats_doUpdateSummonScaleDropdowns (scaledMon, eleContentStats) {
		eleContentStats
			.vee.find(`[name="mon__sel-summon-spell-level"]`)
			?.vee.val(scaledMon._summonedBySpell_level != null ? `${scaledMon._summonedBySpell_level}` : "-1");

		eleContentStats
			.vee.find(`[name="mon__sel-summon-class-level"]`)
			?.vee.val(scaledMon._summonedByClass_level != null ? `${scaledMon._summonedByClass_level}` : "-1");
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
				const eleContentInner = veT`<div class="panel-content-wrapper-inner"></div>`;
				const eleContentStats = veT`<table class="ve-w-100 ve-stats"></table>`.vee.appendTo(eleContentInner);
				eleContentStats.vee.appends(Renderer.monster.getCompactRenderedString(initialRender, {isShowScalers: true, isScaledCr: true}));

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
				const eleContentInner = veT`<div class="panel-content-wrapper-inner"></div>`;
				const eleContentStats = veT`<table class="ve-w-100 ve-stats"></table>`.vee.appendTo(eleContentInner);
				eleContentStats.vee.appends(Renderer.monster.getCompactRenderedString(scaledMon, {isShowScalers: true, isScaledSpellSummon: true}));

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
				const eleContentInner = veT`<div class="panel-content-wrapper-inner"></div>`;
				const eleContentStats = veT`<table class="ve-w-100 ve-stats"></table>`.vee.appendTo(eleContentInner);
				eleContentStats.vee.appends(Renderer.monster.getCompactRenderedString(scaledMon, {isShowScalers: true, isScaledClassSummon: true}));

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
				eleContent: veT`<div class="panel-content-wrapper-inner"><table class="ve-w-100 ve-stats">${it}</table></div>`,
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
				eleContent: veT`<div class="panel-content-wrapper-inner"></div>`.vee.appends(view.getEle()),
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
				eleContent: veT`<div class="panel-content-wrapper-inner"></div>`.vee.appends(view.getEle()),
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
			eleContent: veT`<div class="panel-content-wrapper-inner"></div>`.vee.appends(Renderer.dice.getRoller().vee.addClass("rollbox-panel")),
			title: title || "Dice Roller",
			tabCanRename: true,
			tabRenamed: !!title,
		});
	}

	doPopulate_Image (url, title = "Image") {
		const meta = {u: url};
		const wrpPanel = veT`<div class="panel-content-wrapper-inner"></div>`;
		const wrpImage = veT`<div class="panel-content-wrapper-img"></div>`.vee.appendTo(wrpPanel);
		const img = veT`<img src="${url}" alt="${title}" loading="lazy">`.vee.appendTo(wrpImage);
		const btnReset = veT`<button class="panel-zoom-reset ve-btn ve-btn-xs ve-btn-default"><span class="glyphicon glyphicon-refresh"></span></button>`.vee.appendTo(wrpPanel);
		const iptRange = veT`<input type="range" class="panel-zoom-slider">`.vee.appendTo(wrpPanel);
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
			eleContent: veT`<div class="panel-content-wrapper-inner"></div>`.vee.appends(`<div class="ve-w-100 ve-h-100 ve-flex-vh-center text-danger"><div>${state.message}</div></div>`),
			title: title,
			tabCanRename: true,
		});
	}

	doPopulate_Blank (title = "") {
		const meta = {};
		this.setEleContentTab({
			panelType: PANEL_TYP_BLANK,
			contentMeta: meta,
			eleContent: veT`<div class="dm-blank__panel"></div>`,
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
		return this._eleContent == null;
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
		const displayText = this.title !== _TITLE_LOADING
		&& (this.type === PANEL_TYP_STATS || this.type === PANEL_TYP_CREATURE_SCALED_CR || this.type === PANEL_TYP_CREATURE_SCALED_SPELL_SUMMON || this.type === PANEL_TYP_CREATURE_SCALED_CLASS_SUMMON || this.type === PANEL_TYP_RULES || this.type === PANEL_TYP_ADVENTURES || this.type === PANEL_TYP_BOOKS) ? this.title : "";

		this._doUpdatePanelTitleDisplay(displayText);
		if (!displayText) this.pnlTitle.vee.addClass("hidden");
		else this.pnlTitle.vee.removeClass("hidden");
	}

	doRenderTabs () {
		if (this.isTabs) {
			this.pnlWrpTabs.vee.show();
			this.pnlWrpContent.vee.addClass("panel-content-wrapper-tabs");
			this.pnlAddTab.vee.addClass("hidden");
		} else {
			this.pnlWrpTabs.vee.hide();
			this.pnlWrpContent.vee.removeClass("panel-content-wrapper-tabs");
			this.pnlAddTab.vee.removeClass("hidden");
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
		return !!this.pnl.vee.hasClass(`panel-mode-move`);
	}

	setMoveModeActive (val) {
		if (val) this.joyMenu.doShow();
		else this.joyMenu.doHide();

		this.pnl.vee.toggleClass(`panel-mode-move`, val);
		this.pnl.vee.findAll(`.panel-control-bar`).forEach(ele => ele.vee.toggleClass("move-expand-active", val));
	}

	render () {
		const doApplyPosCss = (ele) => {
			// indexed from 1 instead of zero...
			return ele.vee.css({
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
			const pnl = veT`<div data-panelId="${this.id}" class="dm-screen-panel ve-min-w-0 ve-min-h-0" empty="true"></div>`;
			this.pnl = pnl;
			const ctrlBar = veT`<div class="panel-control-bar"></div>`.vee.appendTo(pnl);
			this.pnlTitle = veT`<div class="panel-control-bar panel-control-title"></div>`.vee.appendTo(pnl).vee.onn("click", () => this.pnlTitle.vee.toggleClass("panel-control-title--bumped"));
			this.pnlAddTab = veT`<div class="panel-control-bar panel-control-addtab"><div class="panel-control-icon glyphicon glyphicon-plus" title="Add Tab"></div></div>`
				.vee.onn("click", async () => {
					this.setIsTabs(true);
					this.setDirty(true);
					this.render();
					await pOpenAddMenu();
				})
				.vee.appendTo(pnl);

			const ctrlMove = veT`<div class="panel-control-icon glyphicon glyphicon-move" title="Move"></div>`.vee.appendTo(ctrlBar);
			ctrlMove.vee.onn("click", () => {
				this.setMoveModeActive(!this.getIsMoveModeActive());
			});
			const ctrlEmpty = veT`<div class="panel-control-icon glyphicon glyphicon-remove" title="Close"></div>`.vee.appendTo(ctrlBar);
			ctrlEmpty.vee.onn("click", () => {
				this.getReplacementPanel();
			});

			const joyMenu = new DmScreenJoystickMenu(this.board, this);
			this.joyMenu = joyMenu;
			joyMenu.initialise();

			const wrpContent = veT`<div class="panel-content-wrapper"></div>`.vee.appendTo(pnl);
			const wrpBtnAdd = veT`<div class="panel-add"></div>`.vee.appendTo(wrpContent);
			const btnAdd = veT`<span class="ve-btn-panel-add glyphicon glyphicon-plus"></span>`
				.vee.onn("click", async () => {
					await pOpenAddMenu();
				})
				.vee.onn("drop", async evt => {
					const data = EventUtil.getDropJson(evt);
					if (!data) return;

					if (data.type !== VeCt.DRAG_TYPE_IMPORT) return;

					evt.stopPropagation();
					evt.preventDefault();

					const {page, source, hash} = data;
					// FIXME(Future) "Stats" may not be the correct panel type, but works in most useful cases
					this.doPopulate_Stats(page, source, hash);
				})
				.vee.appendTo(wrpBtnAdd);
			this.btnAdd = wrpBtnAdd;
			this.btnAddInner = btnAdd;
			this.pnlWrpContent = wrpContent;

			const wrpTabs = veT`<div class="content-tab-bar ve-flex"></div>`.vee.hide().vee.appendTo(pnl);
			const wrpTabsInner = veT`<div class="content-tab-bar-inner"></div>`.vee.onn("wheel", (evt) => {
				const delta = evt.deltaY;
				const curr = wrpTabsInner.scrollLeft();
				wrpTabsInner.scrollLeft(Math.max(0, curr + delta));
			}).vee.appendTo(wrpTabs);
			const btnTabAdd = veT`<button class="ve-btn ve-btn-default content-tab" title="Add Tab"><span class="glyphicon glyphicon-plus"></span></button>`
				.vee.onn("click", () => pOpenAddMenu())
				.vee.appendTo(wrpTabsInner);
			this.pnlWrpTabs = wrpTabs;
			this.pnlTabs = wrpTabsInner;

			if (this._eleContent) wrpContent.vee.appendsMove(this._eleContent);

			doApplyPosCss(pnl).vee.appendTo(this.board.getEleScreen());
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
					if (this._eleContent) this.pnlWrpContent.vee.appendsMove(this._eleContent);
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
			width: this.pnl.vee.outerWidth(),
			height: this.pnl.vee.outerHeight(),
		};
	}

	getAddButtonPos () {
		const offset = this.btnAddInner.getBoundingClientRect().toJSON();
		return {
			top: offset.top,
			left: offset.left,
			width: this.btnAddInner.vee.outerWidth(),
			height: this.btnAddInner.vee.outerHeight(),
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
		this._eleContent = eleContent;
		this.title = title;
		this.tabCanRename = tabCanRename;
		this.tabRenamed = tabRenamed;

		if (eleContent === null) {
			this.pnlWrpContent.vee.children().forEach(ele => ele.vee.detach());
			this.pnlWrpContent.vee.appends(this.btnAdd);
		} else {
			this.btnAdd.vee.detach(); // preserve the "add panel" controls so we can re-attach them later if the panel empties
			this.pnlWrpContent.vee.findAll(`.ve-ui-search__message.loading-spinner`).forEach(ele => ele.remove()); // clean up any temp "loading" panels
			this.pnlWrpContent.vee.children().forEach(ele => ele.vee.addClass("dms__tab_hidden"));
			eleContent.vee.removeClass("dms__tab_hidden");
			if (!this.pnlWrpContent.contains(eleContent)) this.pnlWrpContent.vee.appendsMove(eleContent);
		}

		this.pnl.vee.attr("empty", !eleContent);
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
					this.pnlTabs.vee.children().last().vee.before(it.tabButton);
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
			title: _TITLE_LOADING,
		});
	}

	_getBtnSelTab (ix, title) {
		title = title || "[Untitled]";

		const doCloseTabWithConfirmation = async () => {
			if (this.board.getCompSettings().getIsConfirmOnPanelTabClose()) {
				if (!await InputUiUtil.pGetUserBoolean({title: "Close Tab", htmlDescription: `Are you sure you want to close tab "${this.tabDatas[ix].title}"?`, textYes: "Yes", textNo: "Cancel"})) return;
			}
			this.doCloseTab(ix);
		};

		const btnCloseTab = veT`<span class="glyphicon glyphicon-remove content-tab-remove"></span>`
			.vee.onn("mousedown", async (evt) => {
				if (evt.button === 0) {
					evt.stopPropagation();
					await doCloseTabWithConfirmation();
				}
			});

		const btnSelTab = veT`<span class="ve-btn ve-btn-default content-tab ve-flex"><span class="content-tab-title ve-overflow-ellipsis" title="${title}">${title}</span>${btnCloseTab}</span>`
			.vee.onn("mousedown", async (evt) => {
				if (evt.button === 0) {
					this.setActiveTab(ix);
				} else if (evt.button === 1) {
					await doCloseTabWithConfirmation();
				}
			})
			.vee.onn("contextmenu", async (evt) => {
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

	getActiveTabTitle () {
		return this.getTabTitle(this.tabIndex) || "[Untitled]";
	}

	setTabTitle (ix, nuTitle) {
		const tabData = this.tabDatas[ix];

		tabData.tabButton.vee.find(`.content-tab-title`).vee.txt(nuTitle || "").vee.tooltip(nuTitle);
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
		this.pnlTitle.vee.txt(nuTitle);
		this.pnl.vee.attr("data-roll-name-ancestor-roller", nuTitle);
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
				if (td.tabButton) td.tabButton.vee.detach();
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
				this.pnlTabs.vee.children().last().vee.before(btnSelTab);
				return btnSelTab;
			};

			if (!this.tabDatas[ix].tabButton) this.tabDatas[ix].tabButton = doAddbtnSelTab(ix, title);
			else this.tabDatas[ix].tabButton.vee.find(`.content-tab-title`).vee.txt(title).vee.tooltip(title);
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
		return this._eleContent;
	}

	exile () {
		if (Panel.isNonExilableType(this.type)) {
			this.destroy();
			return;
		}

		if (this.pnl) this.pnl.vee.detach();
		this.board.exilePanel(this.id);
	}

	doDetachExileElements () {
		this._exileElementMetas = this.tabDatas
			.map(tabData => tabData.panelApp)
			.filter(Boolean)
			.flatMap(panelApp => panelApp.getDetachableExileElements())
			.map(ele => {
				const elePlaceholder = veT`<div class="ve-flex-v-center ve-w-100 ve-h-100 ve-small-caps ve-muted ve-italic ve-px-3"><h3 class="ve-m-0">(${this.getActiveTabTitle().qq()})</h3></div>`;
				ele.replaceWith(elePlaceholder);
				return {elePlaceholder, ele, eles: [elePlaceholder, ele]};
			});
	}

	doReattachExileElements () {
		this._exileElementMetas
			?.forEach(({elePlaceholder, ele}) => {
				elePlaceholder.replaceWith(ele);
			});

		this._exileElementMetas = null;
	}

	destroy () {
		// do cleanup
		if (this.type === PANEL_TYP_ROLLBOX) Renderer.dice.unbindDmScreenPanel();

		const fnsOnDestroy = this.tabDatas
			.filter(tabData => tabData?.panelApp?.onDestroy)
			.map(tabData => tabData.panelApp.onDestroy.bind(tabData.panelApp));

		if (this.pnl) this.pnl.remove();
		this._exileElementMetas?.forEach(({eles}) => eles.forEach(ele => ele.remove()));
		this.joyMenu?.destroy();
		this.board.untrackPanel(this.id);

		fnsOnDestroy
			.forEach(fnOnDestroy => fnOnDestroy());

		this.board.fireBoardEvent({type: "panelDestroy"});
	}

	/* -------------------------------------------- */

	addHoverClass () {
		this.pnl.vee.addClass("faux-hover");
	}

	removeHoverClass () {
		this.pnl.vee.removeClass("faux-hover");
	}

	/* -------------------------------------------- */

	getCacheableElementsInfo () {
		const cacheKeyPanel = `${this.x}-${this.y}`;

		return this.tabDatas
			.map((tabData, ix) => {
				if (!tabData?.panelApp) return null;
				if (tabData.isDeleted) return null;

				return ({
					cacheKey: `${cacheKeyPanel}=${ix}`,
					panelApp: tabData.panelApp,
				});
			})
			.filter(Boolean)
			.filter(tabInfo => tabInfo.panelApp);
	}

	/* -------------------------------------------- */

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

	/* -------------------------------------------- */

	fireBoardEvent (boardEvt) {
		this.tabDatas
			.filter(tabData => tabData?.panelApp?.onBoardEvent)
			.map(tabData => tabData.panelApp.onBoardEvent.bind(tabData.panelApp))
			.forEach(fnOnBoardEvent => fnOnBoardEvent(boardEvt));
	}
}
