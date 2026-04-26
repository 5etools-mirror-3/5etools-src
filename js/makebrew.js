import {BuilderBase} from "./makebrew/makebrew-builder-base.js";
import {SpellBuilder} from "./makebrew/makebrew-spell.js";
import {CreatureBuilder} from "./makebrew/makebrew-creature.js";
import {LegendaryGroupBuilder} from "./makebrew/makebrew-legendarygroup.js";
import {TagCondition, TaggerUtils} from "./converter/converterutils-tags.js";
import {SITE_STYLE__CLASSIC} from "./consts.js";
import {SourceUiUtil} from "./utils-ui/utils-ui-sourcebuilder.js";

class PageUi extends ProxyBase {
	static _STORAGE_STATE = "brewbuilderState";
	static _STORAGE_SETTINGS = "brewbuilderSettings";
	static _DEFAULT_ACTIVE_BUILDER = "creatureBuilder";

	constructor () {
		super();

		this._builders = {};

		this._selBuilderMode = null;
		this._wrpSource = null;
		this._wrpMain = null;
		this._wrpInput = null;
		this._wrpOutput = null;

		this._allSources = [];
		this._selSource = null;

		this._isInitialLoad = true;
		this.doSaveDebounced = MiscUtil.debounce(() => this._doSave(), VeCt.DUR_DEBOUNCE_SAVE);

		this.__state = {};
		this._state = this._getProxy("state", this.__state);
		this._saveSettingsDebounced = MiscUtil.debounce(() => this._doSaveSettings(), VeCt.DUR_DEBOUNCE_SAVE);
	}

	set creatureBuilder (creatureBuilder) { this._builders.creatureBuilder = creatureBuilder; }
	set legendaryGroupBuilder (legendaryGroupBuilder) { this._builders.legendaryGroupBuilder = legendaryGroupBuilder; }
	set spellBuilder (spellBuilder) { this._builders.spellBuilder = spellBuilder; }

	get creatureBuilder () { return this._builders.creatureBuilder; }

	get builders () { return this._builders; }

	get activeBuilder () { return this._state.activeBuilder || this.constructor._DEFAULT_ACTIVE_BUILDER; }

	get wrpInput () { return this._wrpInput; }

	get wrpOutput () { return this._wrpOutput; }

	get source () { return this._state.activeSource || ""; }

	get allSources () { return this._allSources; }

	_getActiveBuilderInstance () {
		return this._builders[this._state.activeBuilder];
	}

	_doSave () {
		if (this._isInitialLoad) return;
		return StorageUtil.pSetForPage(
			this.constructor._STORAGE_STATE,
			{
				builders: Object.entries(this._builders).mergeMap(([name, builder]) => ({[name]: builder.getSaveableState()})),
			},
		);
	}

	_doSaveSettings () { return StorageUtil.pSetForPage(this.constructor._STORAGE_SETTINGS, this.__state); }

	async init () {
		this._proxyAssignSimple("state", await StorageUtil.pGetForPage(this.constructor._STORAGE_SETTINGS) || {});

		this._wrpLoad = es(`#page_loading`);
		this._wrpSource = es(`#page_source`);
		this._wrpMain = es(`#page_main`);

		this._addHookAll("state", () => {
			this._saveSettingsDebounced();
		});

		this._initHeader();
		this._initLhs();
		this._initRhs();

		const storedState = await StorageUtil.pGetForPage(this.constructor._STORAGE_STATE) || {};
		if (storedState.builders) {
			Object.entries(storedState.builders).forEach(([name, state]) => {
				if (this._builders[name]) this._builders[name].setStateFromLoaded(state);
			});
		}

		await this._pSetActiveBuilder({nxtActiveBuilder: this._state.activeBuilder || this.constructor._DEFAULT_ACTIVE_BUILDER});

		const brewSources = BrewUtil2.getSources();
		if (this._state.activeSource && brewSources.some(it => it.json === this._state.activeSource)) {
			this.__setStageMain();
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
		this._wrpLoad.hideVe();
		this._wrpSource.showVe();
		this._wrpMain.hideVe();
	}

	__setStageMain () {
		this._wrpLoad.hideVe();
		this._wrpSource.hideVe();
		this._wrpMain.showVe();
	}

	_doRebuildStageSource (options) {
		SourceUiUtil.render({
			...options,
			eleParent: this._wrpSource,
			cbConfirm: async (source, isNewSource) => {
				if (isNewSource) await BrewUtil2.pAddSource(source);
				else await BrewUtil2.pEditSource(source);

				if (isNewSource) this._doAddSourceOption(source);
				this._state.activeSource = source.json;
				this.__setStageMain();
			},
			cbConfirmExisting: async (source) => {
				this._state.activeSource = source.json;
				this.__setStageMain();
			},
			cbCancel: () => {
				this.__setStageMain();
			},
		});
	}

	_initHeader () {
		const wrpSettings = es(`#wrp-settings`);

		const wrpSettingsTop = ee`<div class="ve-w-100 ve-flex-v-center ve-mobile-md__flex-col ve-mobile-md__flex-ai-start ve-mb-2"></div>`.appendTo(wrpSettings);
		const wrpSettingsBtm = ee`<div class="ve-w-100 ve-flex-v-center ve-mobile-md__flex-col ve-mobile-md__flex-ai-start"></div>`.appendTo(wrpSettings);

		this._initHeader_mode({wrpSettingsTop});
		this._initHeader_source({wrpSettingsTop});

		this._initHeader_new({wrpSettingsBtm});
		this._initHeader_existing({wrpSettingsBtm});
		this._initHeader_save({wrpSettingsBtm});

		this._initHeader_download({wrpSettingsTop});
	}

	_initHeader_mode ({wrpSettingsTop}) {
		this._selBuilderMode = ee`<select class="ve-form-control ve-input-xs">
			<option value="creatureBuilder">Creature</option>
			<option value="legendaryGroupBuilder">Legendary Group</option>
			<option value="spellBuilder">Spell</option>
			<option value="none" class="ve-italic">Everything Else?</option>
		</select>`
			.onn("change", async () => {
				const val = this._selBuilderMode.val();
				if (val === "none") {
					InputUiUtil.pGetUserBoolean({
						title: "Homebrew Builder Support",
						htmlDescription: `<p>The Homebrew Builder only supports a limited set of entity types. For everything else, you will need to <a href="https://github.com/TheGiddyLimit/homebrew/blob/master/README.md" rel="noopener noreferrer">manually</a> create or convert content.</p>`,
						isAlert: true,
					}).then(null);
					this._selBuilderMode.val(this._state.activeBuilder);
					return;
				}
				await this._pSetActiveBuilder({nxtActiveBuilder: val});
			});

		ee`<div class="ve-flex-v-center ve-mr-2 ve-mobile-md__mr-0 ve-mobile-md__mb-2">
			<div class="ve-mr-2 ve-bold">Mode</div>
			${this._selBuilderMode}
		</div>`
			.appendTo(wrpSettingsTop);
	}

	_initHeader_source ({wrpSettingsTop}) {
		this._allSources = BrewUtil2.getSources().sort((a, b) => SortUtil.ascSortLower(a.full, b.full))
			.map(it => it.json);

		this._selSource = ee`<select class="ve-form-control ve-input-xs ve-br-0 ve-w-120p">
			<option disabled>Select</option>
			${this._allSources.map(srcJson => `<option value="${srcJson.qq()}">${Parser.sourceJsonToFull(srcJson).qq()}</option>`)}
		</select>`
			.onn("change", async () => {
				this._state.activeSource = this._selSource.val();
			});
		this._addHook("state", "activeSource", () => {
			if (this._state.activeSource) this._selSource.val(this._state.activeSource);
			else this._selSource.selectedIndex = 0;
		})();
		// Deferred; only required on later change
		this._addHook("state", "activeSource", () => {
			this._getActiveBuilderInstance().pDoHandleSourceUpdate().then(null);
		});

		const btnSourceEdit = ee`<button class="ve-btn ve-btn-default ve-btn-xs" title="Edit Selected Source"><span class="glyphicon glyphicon-pencil"></span></button>`
			.onn("click", () => {
				const curSourceJson = this._state.activeSource;
				const curSource = BrewUtil2.sourceJsonToSource(curSourceJson);
				if (!curSource) return;
				this._doRebuildStageSource({mode: "edit", source: MiscUtil.copy(curSource)});
				this.__setStageSource();
			});

		const btnSourceAdd = ee`<button class="ve-btn ve-btn-default ve-btn-xs" title="Add New Source"><span class="glyphicon glyphicon-plus"></span></button>`
			.onn("click", () => {
				this._doRebuildStageSource({mode: "add"});
				this.__setStageSource();
			});

		ee`<div class="ve-flex-v-center ve-mobile-md__mb-2">
			<div class="ve-vr-3 ve-h-21p ve-mr-2 ve-mobile-md__hidden"></div>
				
			<div class="ve-flex-v-center">
				<div class="ve-mr-2 ve-flex-v-center">Source</div>
				<div class="ve-flex-v-stretch ve-input-group ve-btn-group ve-mr-2">
					${this._selSource}
					${btnSourceEdit}
				</div>
				${btnSourceAdd}
			</div>
		</div>`
			.appendTo(wrpSettingsTop);
	}

	_initHeader_new ({wrpSettingsBtm}) {
		const btnNew = ee`<button class="ve-btn ve-btn-xs ve-btn-default" title="SHIFT to reset additional state (such as whether or not certain attributes are auto-calculated)">New</button>`
			.onn("click", async (evt) => {
				if (!await InputUiUtil.pGetUserBoolean({title: "Reset Builder", htmlDescription: "Are you sure?", textYes: "Yes", textNo: "Cancel"})) return;
				this._getActiveBuilderInstance().reset({isResetAllMeta: !!evt.shiftKey});
			});

		const bntNewFromCopy = ee`<button class="ve-btn ve-btn-xs ve-btn-default">New from Copy...</button>`
			.onn("click", () => this._getActiveBuilderInstance().pHandleClickLoadExisting())
			.appendTo(wrpSettingsBtm);

		ee`<div class="ve-flex-v-center ve-mobile-md__mb-2">
			<div class="ve-flex-v-center ve-btn-group">
				${btnNew}
				${bntNewFromCopy}
			</div>
		</div>`
			.appendTo(wrpSettingsBtm);
	}

	_initHeader_existing ({wrpSettingsBtm}) {
		const btnEditExisting = ee`<button class="ve-btn ve-btn-xs ve-btn-default">Edit Existing</button>`
			.onn("click", () => this._getActiveBuilderInstance().pHandleClickEditExisting())
			.appendTo(wrpSettingsBtm);

		ee`<div class="ve-flex-v-center ve-mobile-md__mb-2">
			<div class="ve-vr-2 ve-h-21p ve-mobile-md__hidden"></div>

			<div class="ve-flex-v-center ve-btn-group">
				${btnEditExisting}
			</div>
		</div>`
			.appendTo(wrpSettingsBtm);
	}

	_initHeader_save ({wrpSettingsBtm}) {
		const btnHeaderSave = ee`<button class="ve-btn ve-btn-xs ve-btn-default ve-mr-2 mkbru__cnt-save">Save</button>`
			.onn("click", () => this._getActiveBuilderInstance().pDoHandleClickSaveBrew());

		const dispHeaderName = ee`<div class="ve-muted ve-italic"></div>`;

		Object.values(this._builders)
			.forEach(builder => builder.setHeaderElements({btnHeaderSave, dispHeaderName}));

		ee`<div class="ve-flex-v-center ve-mobile-md__mb-2">
			<div class="ve-vr-2 ve-h-21p ve-mobile-md__hidden"></div>

			${btnHeaderSave}
			${dispHeaderName}
		</div>`
			.appendTo(wrpSettingsBtm);
	}

	_initHeader_download ({wrpSettingsTop}) {
		const btnDownloadJson = ee`<button class="ve-btn ve-btn-default ve-btn-xs ve-mr-2">JSON</button>`
			.onn("click", () => this._getActiveBuilderInstance().pDoHandleClickDownloadJson());

		const btnMarkdownDownload = ee`<button class="ve-btn ve-btn-default ve-btn-xs">Markdown</button>`
			.onn("click", async () => this._getActiveBuilderInstance().pDoHandleClickDownloadMarkdown());

		const btnMarkdownSettings = ee`<button class="ve-btn ve-btn-default ve-btn-xs"><span class="glyphicon glyphicon-cog"></span></button>`
			.onn("click", () => RendererMarkdown.pShowSettingsModal());

		ee`<div class="ve-flex-v-center ve-ml-auto ve-mobile-md__ml-0">
				<div class="ve-mr-2">Download</div>
				${btnDownloadJson}
				<div class="ve-flex-v-center ve-btn-group">${btnMarkdownDownload}${btnMarkdownSettings}</div>
			</div>`
			.appendTo(wrpSettingsTop);
	}

	_initLhs () {
		this._wrpInput = es(`#content_input`);
	}

	_initRhs () {
		this._wrpOutput = es(`#content_output`);
	}

	getBuilderById (id) {
		id = id.toLowerCase().trim();
		const key = Object.keys(this._builders).find(k => k.toLowerCase().trim() === id);
		if (key) return this._builders[key];
	}

	async pSetActiveBuilderById (id) {
		id = id.toLowerCase().trim();
		const key = Object.keys(this._builders).find(k => k.toLowerCase().trim() === id);
		await this._pSetActiveBuilder({nxtActiveBuilder: key});
	}

	async _pSetActiveBuilder ({nxtActiveBuilder}) {
		if (!this._builders[nxtActiveBuilder]) throw new Error(`Builder "${nxtActiveBuilder}" does not exist!`);

		this._selBuilderMode.val(nxtActiveBuilder);
		this._state.activeBuilder = nxtActiveBuilder;
		if (!Hist.initialLoad) Hist.replaceHistoryHash(UrlUtil.encodeForHash(this._state.activeBuilder));
		const builder = this._getActiveBuilderInstance();
		builder.renderInput();
		builder.renderOutput();
	}

	_doAddSourceOption (source) {
		this._allSources.push(source.json);
		// TODO this should detach + re-order. Ensure correct is re-selected; ensure disabled option is first
		this._selSource.appends(`<option value="${source.json.escapeQuotes()}">${source.full.escapeQuotes()}</option>`);
		this._getActiveBuilderInstance().doHandleSourcesAdd();
	}

	_getJsonOutputTemplate () {
		const timestamp = Math.round(Date.now() / 1000);
		return {
			_meta: {
				sources: [MiscUtil.copy(BrewUtil2.sourceJsonToSource(this._state.activeSource))],
				dateAdded: timestamp,
				dateLastModified: timestamp,
				edition: SITE_STYLE__CLASSIC,
			},
		};
	}
}

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
		) return builder.pHandleLoadExistingData(toLoad, {isForce: true});

		return builder.pHandleClick_editUniqueId(toLoad.uniqueId);
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
