import {BuilderBase} from "./makebrew/makebrew-builder-base.js";
import {SpellBuilder} from "./makebrew/makebrew-spell.js";
import {CreatureBuilder} from "./makebrew/makebrew-creature.js";
import {LegendaryGroupBuilder} from "./makebrew/makebrew-legendarygroup.js";
import {PageUiUtil} from "./makebrew/makebrew-builderui.js";
import {TagCondition, TaggerUtils} from "./converter/converterutils-tags.js";
import {SITE_STYLE__CLASSIC} from "./consts.js";

class PageUi {
	constructor () {
		this._builders = {};

		this._$menuInner = null;
		this._$selBuilderMode = null;
		this._$wrpSource = null;
		this._$wrpMain = null;
		this._$wrpInput = null;
		this._$wrpInputControls = null;
		this._$wrpOutput = null;

		this._allSources = [];
		this._$selSource = null;

		this._isInitialLoad = true;
		this.doSaveDebounced = MiscUtil.debounce(() => this._doSave(), 50);

		this._settings = {};
		this._saveSettingsDebounced = MiscUtil.debounce(() => this._doSaveSettings(), 50);

		this._isLastRenderInputFail = false;

		this._sidemenuRenderCache = null;
		this._sidemenuListRenderCache = null;
	}

	set creatureBuilder (creatureBuilder) { this._builders.creatureBuilder = creatureBuilder; }
	set legendaryGroupBuilder (legendaryGroupBuilder) { this._builders.legendaryGroupBuilder = legendaryGroupBuilder; }
	set spellBuilder (spellBuilder) { this._builders.spellBuilder = spellBuilder; }

	get creatureBuilder () { return this._builders.creatureBuilder; }

	get builders () { return this._builders; }

	get activeBuilder () { return this._settings.activeBuilder || PageUi._DEFAULT_ACTIVE_BUILDER; }

	get $wrpInput () { return this._$wrpInput; }

	get $wrpInputControls () { return this._$wrpInputControls; }

	get $wrpOutput () { return this._$wrpOutput; }

	get $wrpSideMenu () { return this._$menuInner; }

	get source () { return this._settings.activeSource || ""; }

	get allSources () { return this._allSources; }

	get sidemenuRenderCache () { return this._sidemenuRenderCache; }
	set sidemenuRenderCache (val) { this._sidemenuRenderCache = val; }

	_doSave () {
		if (this._isInitialLoad) return;
		return StorageUtil.pSetForPage(
			PageUi._STORAGE_STATE,
			{
				builders: Object.entries(this._builders).mergeMap(([name, builder]) => ({[name]: builder.getSaveableState()})),
			},
		);
	}

	_doSaveSettings () { return StorageUtil.pSetForPage(PageUi._STORAGE_SETTINGS, this._settings); }

	async init () {
		this._settings = await StorageUtil.pGetForPage(PageUi._STORAGE_SETTINGS) || {};

		this._$wrpLoad = $(`#page_loading`);
		this._$wrpSource = $(`#page_source`);
		this._$wrpMain = $(`#page_main`);

		this._settings.activeBuilder = this._settings.activeBuilder || PageUi._DEFAULT_ACTIVE_BUILDER;

		this._initLhs();
		this._initRhs();
		await this._pInitSideMenu();

		const storedState = await StorageUtil.pGetForPage(PageUi._STORAGE_STATE) || {};
		if (storedState.builders) {
			Object.entries(storedState.builders).forEach(([name, state]) => {
				if (this._builders[name]) this._builders[name].setStateFromLoaded(state);
			});
		}

		this._doRenderActiveBuilder();
		this._doInitNavHandler();

		const brewSources = BrewUtil2.getSources();
		if (this._settings.activeSource && brewSources.some(it => it.json === this._settings.activeSource)) {
			this.__setStageMain();
			this._sideMenuEnabled = true;
		} else if (brewSources.length) {
			this._doRebuildStageSource({mode: "select", isRequired: true});
			this.__setStageSource();
		} else {
			this._doRebuildStageSource({mode: "add", isRequired: true});
			this.__setStageSource();
		}

		this._isInitialLoad = false;
	}

	__setStageSource () {
		this._$wrpLoad.hide();
		this._$wrpSource.show();
		this._$wrpMain.hide();
	}

	__setStageMain () {
		this._$wrpLoad.hide();
		this._$wrpSource.hide();
		this._$wrpMain.show();
	}

	_doRebuildStageSource (options) {
		SourceUiUtil.render({
			...options,
			$parent: this._$wrpSource,
			cbConfirm: async (source, isNewSource) => {
				if (isNewSource) await BrewUtil2.pAddSource(source);
				else await BrewUtil2.pEditSource(source);

				this._settings.activeSource = source.json;

				if (isNewSource) this._doAddSourceOption(source);
				await this._pDoHandleUpdateSource();
				this._sideMenuEnabled = true;
				this.__setStageMain();
			},
			cbConfirmExisting: async (source) => {
				this._settings.activeSource = source.json;
				await this._pDoHandleUpdateSource();
				this._sideMenuEnabled = true;
				this.__setStageMain();
			},
			cbCancel: () => {
				this._sideMenuEnabled = true;
				this.__setStageMain();
			},
		});
	}

	_initLhs () {
		this._$wrpInput = $(`#content_input`);
		this._$wrpInputControls = $(`#content_input_controls`);
	}

	_initRhs () {
		this._$wrpOutput = $(`#content_output`);
	}

	getBuilderById (id) {
		id = id.toLowerCase().trim();
		const key = Object.keys(this._builders).find(k => k.toLowerCase().trim() === id);
		if (key) return this._builders[key];
	}

	async pSetActiveBuilderById (id) {
		id = id.toLowerCase().trim();
		const key = Object.keys(this._builders).find(k => k.toLowerCase().trim() === id);
		await this._pSetActiveBuilder(key);
	}

	async _pSetActiveBuilder (nxtActiveBuilder) {
		if (!this._builders[nxtActiveBuilder]) throw new Error(`Builder "${nxtActiveBuilder}" does not exist!`);

		this._$selBuilderMode.val(nxtActiveBuilder);
		this._settings.activeBuilder = nxtActiveBuilder;
		if (!Hist.initialLoad) Hist.replaceHistoryHash(UrlUtil.encodeForHash(this._settings.activeBuilder));
		const builder = this._builders[this._settings.activeBuilder];
		builder.renderInput();
		builder.renderOutput();
		await builder.pRenderSideMenu();
		this._saveSettingsDebounced();
	}

	async _pInitSideMenu () {
		const $mnu = $(`.sidemenu`);

		const prevMode = this._settings.activeBuilder;

		const $wrpMode = $(`<div class="w-100 split-v-center"><div class="sidemenu__row__label mr-2">Mode</div></div>`).appendTo($mnu);
		this._$selBuilderMode = $(`
			<select class="form-control input-xs">
				<option value="creatureBuilder">Creature</option>
				<option value="legendaryGroupBuilder">Legendary Group</option>
				<option value="spellBuilder">Spell</option>
				<option value="none" class="italic">Everything Else?</option>
			</select>
		`)
			.appendTo($wrpMode)
			.change(async () => {
				const val = this._$selBuilderMode.val();
				if (val === "none") {
					InputUiUtil.pGetUserBoolean({
						title: "Homebrew Builder Support",
						htmlDescription: `<p>The Homebrew Builder only supports a limited set of entity types. For everything else, you will need to <a href="https://github.com/TheGiddyLimit/homebrew/blob/master/README.md" rel="noopener noreferrer">manually</a> create or convert content.</p>`,
						isAlert: true,
					}).then(null);
					this._$selBuilderMode.val(this._settings.activeBuilder);
					return;
				}
				await this._pSetActiveBuilder(val);
			});

		$mnu.append(PageUiUtil.$getSideMenuDivider(true));

		const $wrpSource = $(`<div class="w-100 mb-2 split-v-center"><div class="sidemenu__row__label mr-2">Source</div></div>`).appendTo($mnu);
		this._allSources = BrewUtil2.getSources().sort((a, b) => SortUtil.ascSortLower(a.full, b.full))
			.map(it => it.json);
		this._$selSource = $$`
			<select class="form-control input-xs">
				<option disabled>Select</option>
				${this._allSources.map(s => `<option value="${s.qq()}">${Parser.sourceJsonToFull(s).qq()}</option>`)}
			</select>`
			.appendTo($wrpSource)
			.change(async () => {
				this._settings.activeSource = this._$selSource.val();
				await this._pDoHandleUpdateSource();
			});
		if (this._settings.activeSource) this._$selSource.val(this._settings.activeSource);
		else this._$selSource[0].selectedIndex = 0;

		const $btnSourceEdit = $(`<button class="ve-btn ve-btn-default ve-btn-xs mr-2">Edit Selected Source</button>`)
			.click(() => {
				const curSourceJson = this._settings.activeSource;
				const curSource = BrewUtil2.sourceJsonToSource(curSourceJson);
				if (!curSource) return;
				this._doRebuildStageSource({mode: "edit", source: MiscUtil.copy(curSource)});
				this.__setStageSource();
			});
		$$`<div class="w-100 mb-2">${$btnSourceEdit}</div>`.appendTo($mnu);

		const $btnSourceAdd = $(`<button class="ve-btn ve-btn-default ve-btn-xs">Add New Source</button>`).click(() => {
			this._doRebuildStageSource({mode: "add"});
			this.__setStageSource();
		});
		$$`<div class="w-100">${$btnSourceAdd}</div>`.appendTo($mnu);

		$mnu.append(PageUiUtil.$getSideMenuDivider(true));
		this._$menuInner = $(`<div></div>`).appendTo($mnu);

		if (prevMode) await this._pSetActiveBuilder(prevMode);
	}

	set _sideMenuEnabled (val) { $(`.sidemenu__toggle`).toggle(!!val); }

	_doRenderActiveBuilder () {
		const activeBuilder = this._builders[this._settings.activeBuilder];
		activeBuilder.renderInput();
		activeBuilder.renderOutput();
	}

	_doInitNavHandler () {
		// More obnoxious than useful (the form is auto-saved automatically); disabled until further notice
		/*
		$(window).on("beforeunload", evt => {
			const message = this._builders[this._settings.activeBuilder].getOnNavMessage();
			if (message) {
				(evt || window.event).message = message;
				return message;
			}
		});
		*/
	}

	_doAddSourceOption (source) {
		this._allSources.push(source.json);
		// TODO this should detach + re-order. Ensure correct is re-selected; ensure disabled option is first
		this._$selSource.append(`<option value="${source.json.escapeQuotes()}">${source.full.escapeQuotes()}</option>`);
		this._builders[this._settings.activeBuilder].doHandleSourcesAdd();
	}

	async _pDoHandleUpdateSource () {
		if (this._$selSource) this._$selSource.val(this._settings.activeSource);
		this._saveSettingsDebounced();
		await this._builders[this._settings.activeBuilder].pDoHandleSourceUpdate();
	}

	_getJsonOutputTemplate () {
		const timestamp = Math.round(Date.now() / 1000);
		return {
			_meta: {
				sources: [MiscUtil.copy(BrewUtil2.sourceJsonToSource(this._settings.activeSource))],
				dateAdded: timestamp,
				dateLastModified: timestamp,
				edition: SITE_STYLE__CLASSIC,
			},
		};
	}
}
PageUi._STORAGE_STATE = "brewbuilderState";
PageUi._STORAGE_SETTINGS = "brewbuilderSettings";
PageUi._DEFAULT_ACTIVE_BUILDER = "creatureBuilder";

class Makebrew {
	static async doPageInit () {
		Makebrew._LOCK = new VeLock();

		// generic init
		await Promise.all([
			PrereleaseUtil.pInit(),
			BrewUtil2.pInit(),
		]);
		ExcludeUtil.pInitialise().then(null); // don't await, as this is only used for search
		await this.pPrepareExistingEditableBrew();
		const brew = await BrewUtil2.pGetBrewProcessed();
		await SearchUiUtil.pDoGlobalInit();
		// Do this asynchronously, to avoid blocking the load
		SearchWidget.pDoGlobalInit();

		TaggerUtils.init({legendaryGroups: await DataUtil.legendaryGroup.pLoadAll(), spells: await DataUtil.spell.pLoadAll()});
		await TagCondition.pInit({conditionsBrew: brew.condition});

		// page-specific init
		await BuilderBase.pInitAll();
		Renderer.utils.bindPronounceButtons();
		await ui.init();

		if (window.location.hash.length) await Makebrew.pHashChange();
		window.addEventListener("hashchange", Makebrew.pHashChange.bind(Makebrew));

		window.dispatchEvent(new Event("toolsLoaded"));
	}

	/**
	 * The editor requires that each entity has a `uniqueId`, as e.g. hashing the entity does not produce a
	 * stable ID (since there may be duplicates, or the name may change).
	 */
	static async pPrepareExistingEditableBrew () {
		const brew = MiscUtil.copy(await BrewUtil2.pGetOrCreateEditableBrewDoc());

		let isAnyMod = false;
		Object.values(ui.builders)
			.forEach(builder => {
				const isAnyModBuilder = builder.prepareExistingEditableBrew({brew});
				isAnyMod = isAnyMod || isAnyModBuilder;
			});

		if (!isAnyMod) return;

		await BrewUtil2.pSetEditableBrewDoc(brew);
	}

	static async pHashChange () {
		try {
			await Makebrew._LOCK.pLock();
			return (await this._pHashChange());
		} finally {
			Makebrew._LOCK.unlock();
		}
	}

	static async _pHashChange () {
		const [builderMode, ...sub] = Hist.getHashParts();
		Hist.initialLoad = false; // Once we've extracted the hash's parts, we no longer care about preserving it

		if (!builderMode) return Hist.replaceHistoryHash(UrlUtil.encodeForHash(ui.activeBuilder));

		const builder = ui.getBuilderById(builderMode);
		if (!builder) return Hist.replaceHistoryHash(UrlUtil.encodeForHash(ui.activeBuilder));

		await ui.pSetActiveBuilderById(builderMode); // (This will update the hash to the active builder)

		if (!sub.length) return;

		const initialLoadMeta = UrlUtil.unpackSubHash(sub[0]);
		if (!initialLoadMeta.statemeta) return;

		const [page, source, hash] = initialLoadMeta.statemeta;
		const toLoadOriginal = await DataLoader.pCacheAndGet(page, source, hash, {isCopy: true});

		const {toLoad, isAllowEditExisting} = await builder._pHashChange_pHandleSubHashes(sub, toLoadOriginal);

		if (
			!isAllowEditExisting
			|| !BrewUtil2.hasSourceJson(toLoad.source)
			|| !toLoad.uniqueId
		) return builder.pHandleSidebarLoadExistingData(toLoad, {isForce: true});

		return builder.pHandleSidebarEditUniqueId(toLoad.uniqueId);
	}
}
Makebrew._LOCK = null;

const ui = new PageUi();

const spellBuilder = new SpellBuilder();
ui.spellBuilder = spellBuilder;
spellBuilder.ui = ui;

const creatureBuilder = new CreatureBuilder();
ui.creatureBuilder = creatureBuilder;
creatureBuilder.ui = ui;

const legendaryGroupBuilder = new LegendaryGroupBuilder();
ui.legendaryGroupBuilder = legendaryGroupBuilder;
legendaryGroupBuilder.ui = ui;

window.addEventListener("load", async () => {
	await Makebrew.doPageInit();
});
