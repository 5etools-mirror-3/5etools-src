import {BuilderUi, PageUiUtil} from "./makebrew-builderui.js";
import {VetoolsConfig} from "../utils-config/utils-config-config.js";
import {SITE_STYLE__CLASSIC, SITE_STYLE_DISPLAY} from "../consts.js";
import {PropOrder} from "../utils-proporder.js";

class SidemenuRenderCache {
	constructor ({lastStageSaved, lastWrpBtnLoadExisting}) {
		this.lastStageSaved = lastStageSaved;
		this.lastWrpBtnLoadExisting = lastWrpBtnLoadExisting;
	}
}

export class BuilderBase extends ProxyBase {
	static _BUILDERS = [];

	static async pInitAll () {
		return Promise.all(BuilderBase._BUILDERS.map(b => b.pInit()));
	}

	/**
	 * @param opts Options object.
	 * @param opts.titleSidebarLoadExisting Text for "Load Existing" sidebar button.
	 * @param opts.titleSidebarDownloadJson Text for "Download JSON" sidebar button.
	 * @param opts.metaSidebarDownloadMarkdown Meta for a "Download Markdown" sidebar button.
	 * @param opts.prop Homebrew prop.
	 */
	constructor (opts) {
		super();
		opts = opts || {};
		this._titleSidebarLoadExisting = opts.titleSidebarLoadExisting;
		this._titleSidebarDownloadJson = opts.titleSidebarDownloadJson;
		this._metaSidebarDownloadMarkdown = opts.metaSidebarDownloadMarkdown;
		this._prop = opts.prop;

		BuilderBase._BUILDERS.push(this);
		TabUiUtil.decorate(this);

		this._ui = null;
		this._isInitialLoad = true;

		this._sourcesCache = []; // the JSON sources from the main UI
		this._selSource = null;
		this._cbCache = null;

		this.__state = this._getInitialState();
		this._state = null; // proxy used to access state
		this.__meta = this._getInitialMetaState(); // meta state
		this._meta = null; // proxy used to access meta state

		this._wrpBtnLoadExisting = null;
		this._eleSideMenuStageSaved = null;
		this._eleSideMenuWrpList = null;
		this._eles = {}; // Generic internal element storage
		this._compsSource = {};
	}

	_doResetProxies () {
		this._resetHooks("state");
		this._resetHooks("meta");
		this._eles = {};
		this._compsSource = {};
	}

	doCreateProxies () {
		this._doResetProxies();
		this._state = this._getProxy("state", this.__state);
		this._meta = this._getProxy("meta", this.__meta);
	}

	set ui (ui) { this._ui = ui; }

	get prop () { return this._prop; }

	prepareExistingEditableBrew ({brew}) {
		let isAnyMod = false;
		if (!brew.body[this.prop]?.length) return;

		brew.body[this.prop].forEach(ent => {
			if (ent.uniqueId) return;
			ent.uniqueId = CryptUtil.uid();
			isAnyMod = true;
		});
		return isAnyMod;
	}

	getSaveableState () {
		return {
			s: this.__state,
			m: this.__meta,
		};
	}

	setStateFromLoaded (state) {
		// Validate meta
		if (state.m) {
			if (!SITE_STYLE_DISPLAY[state.m.styleHint]) state.m.styleHint = SITE_STYLE__CLASSIC;
		}

		this._setStateFromLoaded(state);
	}

	/** @abstract */
	_setStateFromLoaded (state) {
		throw new TypeError(`Unimplemented method!`);
	}

	async pDoHandleSourceUpdate () {
		const nuSource = this._ui.source;

		// if the source we were using is gone, update
		if (!this._sourcesCache.includes(nuSource)) {
			this._state.source = nuSource;
			this._sourcesCache = MiscUtil.copy(this._ui.allSources);

			const cache = this._selSource;
			this._selSource = this.getSourceInput(this._cbCache);
			cache.replaceWith(this._selSource);
		}

		this.renderInput();
		this.renderOutput();
		await this.pRenderSideMenu();
		this.doUiSave();
	}

	async _pHashChange_pHandleSubHashes (sub, toLoad) {
		return {
			isAllowEditExisting: true,
			toLoad,
		};
	}

	getSourceInput (cb) {
		return BuilderUi.getStateIptEnum(
			"Source",
			cb,
			this._state,
			{
				vals: this._sourcesCache, fnDisplay: Parser.sourceJsonToFull, type: "string", nullable: false,
			},
			"source",
		);
	}

	doUiSave () {
		// Trigger a save at a higher level
		this._ui.doSaveDebounced();
	}

	async pRenderSideMenu () {
		// region Detach any sidemenu renders from other builders
		if (this._ui.sidemenuRenderCache) {
			if (this._ui.sidemenuRenderCache.lastStageSaved !== this._eleSideMenuStageSaved) this._ui.sidemenuRenderCache.lastStageSaved.detach();

			if (this._ui.sidemenuRenderCache.lastWrpBtnLoadExisting !== this._wrpBtnLoadExisting) this._ui.sidemenuRenderCache.lastWrpBtnLoadExisting.detach();
		}
		// endregion

		// region If this is our first sidemenu render, create elements
		if (!this._eleSideMenuStageSaved) {
			const btnLoadExisting = ee`<button class="ve-btn ve-btn-xs ve-btn-default">${this._titleSidebarLoadExisting}</button>`
				.onn("click", () => this.pHandleSidebarLoadExistingClick());
			this._wrpBtnLoadExisting = ee`<div class="w-100 mb-2">${btnLoadExisting}</div>`;

			const btnDownloadJson = ee`<button class="ve-btn ve-btn-default ve-btn-xs mb-2">${this._titleSidebarDownloadJson}</button>`
				.onn("click", () => this.pHandleSidebarDownloadJsonClick());

			const wrpDownloadMarkdown = (() => {
				if (!this._metaSidebarDownloadMarkdown) return null;

				const btnDownload = ee`<button class="ve-btn ve-btn-default ve-btn-xs mb-2">${this._metaSidebarDownloadMarkdown.title}</button>`
					.onn("click", async () => {
						const entities = await this._pGetSideMenuBrewEntities();
						const mdOut = await this._metaSidebarDownloadMarkdown.pFnGetText(entities);
						DataUtil.userDownloadText(`${DataUtil.getCleanFilename(BrewUtil2.sourceJsonToFull(this._ui.source))}.md`, mdOut);
					});

				const btnSettings = ee`<button class="ve-btn ve-btn-default ve-btn-xs mb-2"><span class="glyphicon glyphicon-cog"></span></button>`
					.onn("click", () => RendererMarkdown.pShowSettingsModal());

				return ee`<div class="ve-flex-v-center ve-btn-group">${btnDownload}${btnSettings}</div>`;
			})();

			this._eleSideMenuWrpList = this._eleSideMenuWrpList || ee`<div class="w-100 ve-flex-col">`;
			this._eleSideMenuStageSaved = ee`<div>
				${PageUiUtil.getSideMenuDivider().hideVe()}
				<div class="ve-flex-v-center">${btnDownloadJson}</div>
				${wrpDownloadMarkdown}
				${this._eleSideMenuWrpList}
			</div>`;
		}
		// endregion

		// Make our sidemenu internal wrapper visible
		this._wrpBtnLoadExisting.appendTo(this._ui.wrpSideMenu);
		this._eleSideMenuStageSaved.appendTo(this._ui.wrpSideMenu);

		this._ui.sidemenuRenderCache = new SidemenuRenderCache({
			lastWrpBtnLoadExisting: this._wrpBtnLoadExisting,
			lastStageSaved: this._eleSideMenuStageSaved,
		});

		await this._pDoUpdateSidemenu();
	}

	getOnNavMessage () {
		if (this._meta.isModified) return "You have unsaved changes! Are you sure you want to leave?";
		else return null;
	}

	async _pGetSideMenuBrewEntities () {
		const brew = await BrewUtil2.pGetOrCreateEditableBrewDoc();
		return MiscUtil.copy((brew.body[this._prop] || []).filter(entry => entry.source === this._ui.source))
			.sort((a, b) => SortUtil.ascSort(a.name, b.name));
	}

	async _pDoUpdateSidemenu () {
		this._sidemenuListRenderCache = this._sidemenuListRenderCache || {};

		const toList = await this._pGetSideMenuBrewEntities();
		this._eleSideMenuStageSaved.toggleVe(!!toList.length);

		const metasVisible = new Set();
		toList.forEach((ent, ix) => {
			metasVisible.add(ent.uniqueId);

			if (this._sidemenuListRenderCache[ent.uniqueId]) {
				const meta = this._sidemenuListRenderCache[ent.uniqueId];

				meta.row.showVe();

				if (meta.name !== ent.name) {
					meta.dispName.txt(ent.name);
					meta.name = ent.name;
				}

				if (meta.position !== ix) {
					meta.row.css({"order": ix});
					meta.position = ix;
				}

				return;
			}

			const btnEdit = ee`<button class="ve-btn ve-btn-xs ve-btn-default mr-2" title="Edit"><span class="glyphicon glyphicon-pencil"></span></button>`
				.onn("click", async () => {
					if (
						this.getOnNavMessage()
						&& !await InputUiUtil.pGetUserBoolean({title: "Discard Unsaved Changes", htmlDescription: "You have unsaved changes. Are you sure?", textYes: "Yes", textNo: "Cancel"})
					) return;
					await this.pHandleSidebarEditUniqueId(ent.uniqueId);
				});

			const menu = ContextUtil.getMenu([
				new ContextUtil.Action(
					"Duplicate",
					async () => {
						const copy = MiscUtil.copy(await BrewUtil2.pGetEditableBrewEntity(this._prop, ent.uniqueId, {isDuplicate: true}));
						copy.name = StrUtil.getNextDuplicateName(copy.name);

						await BrewUtil2.pPersistEditableBrewEntity(this._prop, copy);

						await this._pDoUpdateSidemenu();
					},
				),
				new ContextUtil.Action(
					"View JSON",
					async (evt) => {
						const out = this._ui._getJsonOutputTemplate();

						out[this._prop] = [
							PropOrder.getOrdered(
								DataUtil.cleanJson(MiscUtil.copy(await BrewUtil2.pGetEditableBrewEntity(this._prop, ent.uniqueId))),
								this._prop,
							),
						];

						const $content = Renderer.hover.$getHoverContent_statsCode(this._state);

						Renderer.hover.getShowWindow(
							$content,
							Renderer.hover.getWindowPositionFromEvent(evt),
							{
								title: `${this._state.name} \u2014 Source Data`,
								isPermanent: true,
								isBookContent: true,
							},
						);
					},
				),
				new ContextUtil.Action(
					"Download JSON",
					async () => {
						const out = this._ui._getJsonOutputTemplate();
						const cpy = MiscUtil.copy(await BrewUtil2.pGetEditableBrewEntity(this._prop, ent.uniqueId));
						out[this._prop] = [DataUtil.cleanJson(cpy)];
						DataUtil.userDownload(DataUtil.getCleanFilename(cpy.name), out);
					},
				),
				new ContextUtil.Action(
					"View Markdown",
					async (evt) => {
						const entry = MiscUtil.copy(await BrewUtil2.pGetEditableBrewEntity(this._prop, ent.uniqueId));
						const name = `${entry._displayName || entry.name} \u2014 Markdown`;
						const mdText = RendererMarkdown.get().render({
							entries: [
								{
									type: "statblockInline",
									dataType: this._prop,
									data: entry,
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
					},
				),
				new ContextUtil.Action(
					"Download Markdown",
					async () => {
						const entry = MiscUtil.copy(await BrewUtil2.pGetEditableBrewEntity(this._prop, ent.uniqueId));
						const mdText = CreatureBuilder._getAsMarkdown(entry).trim();
						DataUtil.userDownloadText(`${DataUtil.getCleanFilename(entry.name)}.md`, mdText);
					},
				),
			]);

			const btnBurger = ee`<button class="ve-btn ve-btn-xs ve-btn-default mr-2" title="More Options"><span class="glyphicon glyphicon-option-vertical"></span></button>`
				.onn("click", evt => ContextUtil.pOpenMenu(evt, menu));

			const btnDelete = ee`<button class="ve-btn ve-btn-xs ve-btn-danger" title="Delete"><span class="glyphicon glyphicon-trash"></span></button>`
				.onn("click", async () => {
					if (!await InputUiUtil.pGetUserBoolean({title: "Delete Entity", htmlDescription: "Are you sure?", textYes: "Yes", textNo: "Cancel"})) return;

					if (this._state.uniqueId === ent.uniqueId) this.reset();
					await BrewUtil2.pRemoveEditableBrewEntity(this._prop, ent.uniqueId);
					await this._pDoUpdateSidemenu();
					await this.pDoPostDelete();
				});

			const dispName = ee`<span class="py-1">${ent.name}</span>`;

			const row = ee`<div class="mkbru__sidebar-entry ve-flex-v-center split px-2" style="order: ${ix}">
			${dispName}
			<div class="py-1 no-shrink">${btnEdit}${btnBurger}${btnDelete}</div>
			</div>`.appendTo(this._eleSideMenuWrpList);

			this._sidemenuListRenderCache[ent.uniqueId] = {
				dispName,
				row,
				name: ent.name,
				ix,
			};
		});

		Object.entries(this._sidemenuListRenderCache)
			.filter(([uniqueId]) => !metasVisible.has(uniqueId))
			.forEach(([, meta]) => meta.row.hideVe());
	}

	async pHandleSidebarEditUniqueId (uniqueId) {
		const entEditable = await BrewUtil2.pGetEditableBrewEntity(this._prop, uniqueId);
		if (entEditable._copy) {
			JqueryUtil.doToast({type: "warning", content: $(`<span>You are attempting to edit a <code>_copy</code>! Saving your changes will overwrite the <code>_copy</code> with a resolved version of the entity.</span>`)});
			await DataUtil[this._prop]?.pMergeCopy([], entEditable, {isSkipMetaMergeCache: true});
		}
		this.setStateFromLoaded({
			s: MiscUtil.copy(entEditable),
			m: this._getInitialMetaState({
				isModified: false,
				isPersisted: false,
				nameOriginal: entEditable.name,
			}),
		});
		this.renderInput();
		this.renderOutput();
		this.doUiSave();
	}

	async pHandleSidebarDownloadJsonClick () {
		const out = this._ui._getJsonOutputTemplate();
		out[this._prop] = (await this._pGetSideMenuBrewEntities()).map(entry => PropOrder.getOrdered(DataUtil.cleanJson(MiscUtil.copy(entry)), this._prop));
		DataUtil.userDownload(DataUtil.getCleanFilename(BrewUtil2.sourceJsonToFull(this._ui.source)), out);
	}

	renderInputControls () {
		const dispName = ee`<div class="ve-muted italic"></div>`;
		this._addHook("meta", "nameOriginal", () => dispName.txt(`Editing "${this._meta.nameOriginal || "?"}"`))();

		const btnSave = ee`<button class="ve-btn ve-btn-xs ve-btn-default mr-2 mkbru__cnt-save">Save</button>`
			.onn("click", () => this._pHandleClick_pSaveBrew());
		this._addHook("meta", "isModified", () => btnSave.txt(this._meta.isModified ? "Save *" : "Saved"))();

		const btnNew = ee`<button class="ve-btn ve-btn-xs ve-btn-default" title="SHIFT to reset additional state (such as whether or not certain attributes are auto-calculated)">New</button>`
			.onn("click", async (evt) => {
				if (!await InputUiUtil.pGetUserBoolean({title: "Reset Builder", htmlDescription: "Are you sure?", textYes: "Yes", textNo: "Cancel"})) return;
				this.reset({isResetAllMeta: !!evt.shiftKey});
			});

		ee(this._ui.wrpInputControls.empty())`
			${dispName}
			<div class="ve-flex-v-center">
				${btnSave}
				${btnNew}
			</div>
		`;
	}

	reset ({isResetAllMeta = false} = {}) {
		const stateNext = this._getInitialState();
		const metaNext = this._getInitialMetaState({nameOriginal: stateNext.name});
		if (!isResetAllMeta) this._reset_mutNextMetaState({metaNext});
		this.setStateFromLoaded({
			s: stateNext,
			m: metaNext,
		});
		this.renderInput();
		this.renderOutput();
		this.doUiSave();
	}

	_reset_mutNextMetaState ({metaNext}) { /* Implement as required */ }

	async _pHandleClick_pSaveBrew () {
		const source = this._state.source;
		if (!source) throw new Error(`Current state has no "source"!`);

		const clean = DataUtil.cleanJson(MiscUtil.copy(this.__state), {isDeleteUniqueId: false});
		if (this._meta.isPersisted) {
			await BrewUtil2.pPersistEditableBrewEntity(this._prop, clean);
			await this.pRenderSideMenu();
		} else {
			// If we are e.g. editing a copy of a non-editable brew's entity, we need to first convert the parent brew
			//   to "editable."
			if (
				BrewUtil2.sourceJsonToSource(source)
				&& !await BrewUtil2.pIsEditableSourceJson(source)
			) {
				const isMove = await InputUiUtil.pGetUserBoolean({
					title: "Move to Editable Homebrew Document",
					htmlDescription: `<div>Saving "${this._state.name}" with source "${this._state.source}" will move all homebrew from that source to the editable homebrew document.<br>Moving homebrew to the editable document will prevent it from being automatically updated in future.<br>Do you wish to proceed?<br><i class="ve-muted">Giving "${this._state.name}" an editable source will avoid this issue.</i></div>`,
					textYes: "Yes",
					textNo: "Cancel",
				});
				if (!isMove) return;

				const brew = await BrewUtil2.pMoveOrCopyToEditableBySourceJson(source);
				if (!brew) throw new Error(`Failed to make brew for source "${source}" editable!`);

				const nxtBrew = MiscUtil.copy(brew);
				// Ensure everything has a `uniqueId`
				let isAnyMod = this.prepareExistingEditableBrew({brew: nxtBrew});

				// We then need to attempt a find-replace on the hash of our current entity, as we may be trying to update
				//   one exact entity. This is not needed if e.g. a renamed copy of an existing entity is being made.
				const hash = UrlUtil.URL_TO_HASH_BUILDER[this._prop](clean);
				const ixExisting = (brew.body[this._prop] || []).findIndex(it => UrlUtil.URL_TO_HASH_BUILDER[this._prop](it) === hash);
				if (~ixExisting) {
					clean.uniqueId = clean.uniqueId || nxtBrew.body[this._prop][ixExisting].uniqueId;
					nxtBrew.body[this._prop][ixExisting] = clean;
					isAnyMod = true;
				}

				if (isAnyMod) await BrewUtil2.pSetEditableBrewDoc(nxtBrew);
			}

			await BrewUtil2.pPersistEditableBrewEntity(this._prop, clean);
			this._meta.isPersisted = true;
			this._meta.isModified = false;
			await SearchWidget.P_LOADING_CONTENT;
			await SearchWidget.pAddToIndexes(this._prop, clean);
		}

		this._meta.isModified = false;
		this._meta.nameOriginal = this._state.name;
		this.doUiSave();
		await this.pDoPostSave();
		await this._pDoUpdateSidemenu();
	}

	// TODO use this in creature builder
	/**
	 * @param doUpdateState
	 * @param rowArr
	 * @param row
	 * @param wrpRow
	 * @param title
	 * @param [opts] Options object.
	 * @param [opts.isProtectLast]
	 * @param [opts.isExtraSmall]
	 * @return {jQuery}
	 */
	static getBtnRemoveRow (doUpdateState, rowArr, row, wrpRow, title, opts) {
		opts = opts || {};

		return ee`<button class="ve-btn ${opts.isExtraSmall ? "ve-btn-xxs" : "ve-btn-xs"} ve-btn-danger ${opts.isProtectLast ? "mkbru__btn-rm-row" : ""}" title="Remove ${title}"><span class="glyphicon glyphicon-trash"></span></button>`
			.onn("click", () => {
				rowArr.splice(rowArr.indexOf(row), 1);
				wrpRow.empty().remove();
				doUpdateState();
			});
	}

	getFluffInput (cb) {
		const [row, rowInner] = BuilderUi.getLabelledRowTuple("Flavor Info");

		const imageRows = [];

		const doUpdateState = () => {
			const out = {};

			const entries = UiUtil.getTextAsEntries(iptEntries.val());
			if (entries && entries.length) out.entries = entries;

			const images = imageRows.map(it => it.getState()).filter(Boolean);

			if (images.length) out.images = images;

			if (out.entries || out.images) this._state.fluff = out;
			else delete this._state.fluff;

			cb();
		};

		const doUpdateOrder = () => {
			imageRows.forEach(it => it.ele.detach().appendTo(wrpRows));
			doUpdateState();
		};

		const wrpRows = ee`<div class="ve-flex-col mb-1 mt-n1"></div>`;
		const wrpRowsOuter = ee`<div class="relative">${wrpRows}</div>`;

		const rowOptions = {wrpRowsOuter};

		const iptEntries = ee`<textarea class="form-control form-control--minimal resize-vertical mb-2"></textarea>`
			.onn("change", () => doUpdateState());

		const btnAddImage = ee`<button class="ve-btn ve-btn-xs ve-btn-default">Add Image</button>`
			.onn("click", async () => {
				const url = await InputUiUtil.pGetUserString({title: "Enter a URL"});
				if (!url) return;
				this.constructor.__getFluffInput__getImageRow(doUpdateState, doUpdateOrder, rowOptions, imageRows, {href: {url: url}}).ele.appendTo(wrpRows);
				doUpdateState();
			});

		ee`<div class="ve-flex-col">
		${iptEntries}
		${wrpRowsOuter}
		<div>${btnAddImage}</div>
		</div>`.appendTo(rowInner);

		if (this._state.fluff) {
			if (this._state.fluff.entries) iptEntries.val(UiUtil.getEntriesAsText(this._state.fluff.entries));
			if (this._state.fluff.images) this._state.fluff.images.forEach(img => this.constructor.__getFluffInput__getImageRow(doUpdateState, doUpdateOrder, rowOptions, imageRows, img).ele.appendTo(wrpRows));
		}

		return row;
	}

	static __getFluffInput__getImageRow (doUpdateState, doUpdateOrder, options, imageRows, image) {
		const out = {};

		const getState = () => {
			const rawUrl = iptUrl.val().trim();
			return rawUrl ? {type: "image", href: {type: "external", url: rawUrl}} : null;
		};

		const iptUrl = ee`<input class="form-control form-control--minimal input-xs mr-2">`
			.onn("change", () => doUpdateState());
		if (image) {
			const href = ((image || {}).href || {});
			if (href.url) iptUrl.val(href.url);
			else if (href.path) {
				iptUrl.val(`${window.location.origin.replace(/\/+$/, "")}/img/${href.path}`);
			}
		}

		const btnPreview = ee`<button class="ve-btn ve-btn-xs ve-btn-default mr-2" title="Preview Image"><span class="glyphicon glyphicon-fullscreen"></span></button>`
			.onn("click", (evt) => {
				const toRender = getState();
				if (!toRender) return JqueryUtil.doToast({content: "Please enter an image URL", type: "warning"});

				const $content = Renderer.hover.$getHoverContent_generic(toRender, {isBookContent: true});
				Renderer.hover.getShowWindow(
					$content,
					Renderer.hover.getWindowPositionFromEvent(evt),
					{
						isPermanent: true,
						title: "Image Preview",
						isBookContent: true,
					},
				);
			});

		const btnRemove = ee`<button class="ve-btn ve-btn-xs ve-btn-danger" title="Remove Image"><span class="glyphicon glyphicon-trash"></span></button>`
			.onn("click", () => {
				imageRows.splice(imageRows.indexOf(out), 1);
				out.ele.empty().remove();
				doUpdateState();
			});

		const dragOrder = BuilderUi.getDragPad(doUpdateOrder, imageRows, out, {
			wrpRowsOuter: options.wrpRowsOuter,
		});

		out.ele = ee`<div class="ve-flex-v-center py-1 mkbru__wrp-rows--removable">${iptUrl}${btnPreview}${btnRemove}${dragOrder}</div>`;
		out.getState = getState;
		imageRows.push(out);

		return out;
	}

	_getRenderedMarkdownCode () {
		const mdText = this.constructor._getAsMarkdown(this._state);
		return Renderer.get().render({
			type: "entries",
			entries: [
				{
					type: "code",
					name: `Markdown`,
					preformatted: mdText,
				},
			],
		});
	}

	renderInput () {
		try {
			this._renderInputImpl();
			this._isLastRenderInputFail = false;
		} catch (e) {
			if (!this._isLastRenderInputFail) {
				JqueryUtil.doToast({type: "danger", content: `Could not load homebrew, it contained errors! ${VeCt.STR_SEE_CONSOLE}`});
				setTimeout(() => { throw e; });
			}
			const tmp = this._isLastRenderInputFail;
			this._isLastRenderInputFail = true;
			if (!tmp) this.reset();
		}
	}

	_getInitialState () {
		return {
			uniqueId: CryptUtil.uid(),
		};
	}

	_getInitialMetaState ({isModified = false, isPersisted = false, nameOriginal = null} = {}) {
		return {
			isModified,
			isPersisted,
			nameOriginal,
			styleHint: VetoolsConfig.get("styleSwitcher", "style"),
		};
	}

	async pInit () { await this._pInit(); }

	doHandleSourcesAdd () { throw new TypeError(`Unimplemented method!`); }
	_renderInputImpl () { throw new TypeError(`Unimplemented method!`); }
	renderOutput () { throw new TypeError(`Unimplemented method!`); }
	async pHandleSidebarLoadExistingClick () { throw new TypeError(`Unimplemented method!`); }
	async pHandleSidebarLoadExistingData (entity, opts) { throw new TypeError(`Unimplemented method!`); }
	async _pInit () {}
	async pDoPostSave () {}
	async pDoPostDelete () {}
}
