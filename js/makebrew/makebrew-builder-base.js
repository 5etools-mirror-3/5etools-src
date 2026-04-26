import {BuilderUi} from "./makebrew-builderui.js";
import {VetoolsConfig} from "../utils-config/utils-config-config.js";
import {SITE_STYLE__CLASSIC, SITE_STYLE_DISPLAY} from "../consts.js";
import {PropOrder} from "../utils-proporder.js";

class _ManageExistingEntitiesUi extends BaseComponent {
	constructor ({parent, entities, doClose}) {
		super();
		this._parent = parent;
		this._entities = entities;
		this._doClose = doClose;

		this._list = null;
		this._listSelectClickHandler = null;
	}

	_getSelectedUniqueIds () {
		return this._list.items
			.filter(li => li.data.cbSel.checked)
			.map(li => li.ix);
	}

	_getMassContextMenu () {
		return ContextUtil.getMenu([
			new ContextUtil.Action(
				"Download JSON",
				async () => {
					await this._parent.pDoHandleClickDownloadJson({uniqueIds: this._getSelectedUniqueIds()});
				},
			),
			new ContextUtil.Action(
				"Download Markdown",
				async () => {
					await this._parent.pDoHandleClickDownloadMarkdown({uniqueIds: this._getSelectedUniqueIds()});
				},
			),
			new ContextUtil.Action(
				"Delete",
				async () => {
					const uniqueIds = this._getSelectedUniqueIds();
					await this._parent.pHandleClick_deleteUniqueIds(uniqueIds, {isConfirm: true});
					this._list.removeItemsByFilter(li => uniqueIds.includes(li.ix));
					this._list.update();
				},
			),
		]);
	}

	render ({wrp}) {
		let menuMass;
		const btnMass = ee`<button class="ve-btn ve-btn-default ve-bbl-0 ve-self-flex-stretch">Mass...</button>`
			.onn("click", async evt => {
				menuMass ||= this._getMassContextMenu();
				await ContextUtil.pOpenMenu(evt, menuMass);
			});

		const btnReset = ee`<button class="ve-btn ve-btn-default">Reset</button>`;

		const cbAll = ee`<input type="checkbox">`;
		const wrpRows = ee`<div class="list ve-flex-col ve-w-100 ve-max-h-unset"></div>`;
		const iptSearch = ee`<input type="search" class="search ve-form-control ve-w-100 ve-lst__search ve-lst__search--no-border-h" placeholder="Search entities...">`;
		const disp = ee`<div class="ve-lst__wrp-search-visible ve-no-events ve-flex-vh-center"></div>`;
		const wrpBtnsSort = ee`<div class="filtertools ve-input-group ve-input-group--bottom ve-flex ve-no-shrink">
			<label class="ve-btn ve-btn-default ve-btn-xs ve-col-1 ve-pl-1 ve-pr-0 ve-flex-vh-center">${cbAll}</label>
			<button class="ve-col-9-5 sort ve-btn ve-btn-default ve-btn-xs" data-sort="name">Name</button>
			<button class="ve-col-1-5 ve-btn ve-btn-default ve-btn-xs ve-grow" disabled>&nbsp;</button>
		</div>`;

		ee(wrp)`
		<div class="ve-flex-v-stretch ve-input-group ve-input-group--top ve-no-shrink ve-mt-1">
			${btnMass}
			<div class="ve-w-100 ve-relative">
				${iptSearch}
				<div id="lst__search-glass" class="ve-lst__wrp-search-glass ve-no-events ve-flex-vh-center"><span class="glyphicon glyphicon-search"></span></div>
				${disp}
			</div>
			${btnReset}
		</div>

		${wrpBtnsSort}
		${wrpRows}`;

		this._list = new List({
			iptSearch,
			wrpList: wrpRows,
			fnSort: SortUtil.listSort,
		});

		this._list.on("updated", () => disp.html(`${this._list.visibleItems.length}/${this._list.items.length}`));

		this._listSelectClickHandler = new ListSelectClickHandler({list: this._list});
		this._listSelectClickHandler.bindSelectAllCheckbox(cbAll);

		SortUtil.initBtnSortHandlers(wrpBtnsSort, this._list);

		this._entities.forEach(ent => {
			this._addListItem({ent});
		});

		this._list.init();

		iptSearch.focuse();
	}

	_addListItem ({ent}) {
		const btnEdit = ee`<button class="ve-btn ve-btn-xs ve-btn-default" title="Edit"><span class="glyphicon glyphicon-pencil"></span></button>`
			.onn("click", async evt => {
				evt.stopPropagation();
				await this._parent.pHandleClick_editUniqueId(ent.uniqueId, {isConfirmOnUnsaved: true});
				this._doClose();
			});

		let menu;
		const btnContextMenu = ee`<button class="ve-btn ve-btn-xs ve-btn-default" title="More Options"><span class="glyphicon glyphicon-option-vertical"></span></button>`
			.onn("click", async evt => {
				evt.stopPropagation();
				menu ||= this._getListItemContextMenu({ent});
				await ContextUtil.pOpenMenu(evt, menu);
			});

		const btnDelete = ee`<button class="ve-btn ve-btn-xs ve-btn-danger" title="Delete"><span class="glyphicon glyphicon-trash"></span></button>`
			.onn("click", async evt => {
				evt.stopPropagation();
				await this._parent.pHandleClick_deleteUniqueId(ent.uniqueId, {isConfirm: true});
				this._list.removeItem(listItem);
				this._list.update();
			});

		const cbSel = ee`<input type="checkbox" class="ve-no-events">`;

		const eleLi = ee`<div class="ve-lst__row ve-flex-col ve-px-0">
			<label class="ve-lst__row-border ve-lst__row-inner ve-no-select ve-mb-0 ve-flex-v-center">
				<div class="ve-pl-0 ve-pr-1 ve-col-1 ve-flex-vh-center">${cbSel}</div>
				<div class="ve-col-9-5 ve-px-1 ve-bold">${ent.name}</div>
				<div class="ve-col-1-5 ve-flex-vh-center ve-pl-1 ve-pr-0 ve-btn-group">
					${btnEdit}
					${btnContextMenu}
					${btnDelete}
				</div>
			</label>
		</div>`;

		const listItem = new ListItem(
			ent.uniqueId,
			eleLi,
			ent.name,
			{
			},
			{
				cbSel,
			},
		);

		eleLi.addEventListener("click", evt => this._listSelectClickHandler.handleSelectClick(listItem, evt));

		this._list.addItem(listItem);
	}

	_getListItemContextMenu ({ent}) {
		return ContextUtil.getMenu([
			new ContextUtil.Action(
				"Duplicate",
				async () => {
					const entNxt = await this._parent.pHandleClick_duplicateUniqueId(ent.uniqueId);
					this._addListItem({ent: entNxt});
					this._list.update();
				},
			),
			null,
			new ContextUtil.Action(
				"View JSON",
				async (evt) => {
					await this._parent.pHandleClick_viewJsonUniqueId(evt, ent.uniqueId);
				},
			),
			new ContextUtil.Action(
				"Download JSON",
				async () => {
					await this._parent.pHandleClick_downloadJsonUniqueId(ent.uniqueId);
				},
			),
			null,
			new ContextUtil.Action(
				"View Markdown",
				async (evt) => {
					await this._parent.pHandleClick_viewMarkdownUniqueId(evt, ent.uniqueId);
				},
			),
			new ContextUtil.Action(
				"Download Markdown",
				async () => {
					await this._parent.pHandleClick_downloadMarkdownUniqueId(ent.uniqueId);
				},
			),
		]);
	}
}

export class BuilderBase extends ProxyBase {
	static _BUILDERS = [];

	static async pInitAll () {
		return Promise.all(BuilderBase._BUILDERS.map(b => b.pInit()));
	}

	constructor ({prop, pFnGetFluff = null}) {
		super();
		this._prop = prop;
		this._pFnGetFluff = pFnGetFluff;

		BuilderBase._BUILDERS.push(this);
		TabUiUtil.decorate(this);

		this._ui = null;
		this._isInitialLoad = true;

		this._sourcesCache = []; // the JSON sources from the main UI
		this._selSource = null;
		this._cbCache = null;

		this._btnHeaderSave = null;
		this._dispHeaderName = null;

		this.__state = this._getInitialState();
		this._state = null; // proxy used to access state
		this.__meta = this._getInitialMetaState(); // meta state
		this._meta = null; // proxy used to access meta state

		this._eles = {}; // Generic internal element storage
		this._compsSource = {};

		this._isLastRenderInputFail = false;
	}

	setHeaderElements ({btnHeaderSave, dispHeaderName}) {
		this._btnHeaderSave = btnHeaderSave;
		this._dispHeaderName = dispHeaderName;
	}

	_doResetProxies () {
		this._resetHooks("state");
		this._resetHooks("meta");
		this._eles = {};
		this._compsSource = {};
	}

	_doCreateProxies () {
		this._doResetProxies();
		this._state = this._getProxy("state", this.__state);
		this._meta = this._getProxy("meta", this.__meta);
	}

	_doBindHeaderElements () {
		this._addHook("meta", "isModified", () => this._btnHeaderSave.txt(this._meta.isModified ? "Save *" : "Saved"))();
		this._addHook("meta", "nameOriginal", () => this._dispHeaderName.txt(`Editing "${this._meta.nameOriginal || "?"}"`))();
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

	/* -------------------------------------------- */

	/**
	 * @param {?Array<string>} uniqueIds
	 */
	async pDoHandleClickDownloadMarkdown ({uniqueIds = null} = {}) {
		const entities = (await this._pGetBrewEntitiesCurrentSource())
			.filter(ent => uniqueIds == null || uniqueIds.includes(ent.uniqueId));

		const mdOut = await RendererMarkdown.exporting.pGetMarkdownDoc({
			ents: entities,
			prop: this._prop,
			pFnGetFluff: this._pFnGetFluff,
		});
		DataUtil.userDownloadText(`${DataUtil.getCleanFilename(BrewUtil2.sourceJsonToFull(this._ui.source))}.md`, mdOut);
	}

	/* -------------------------------------------- */

	async _pGetBrewEntitiesCurrentSource () {
		const brew = await BrewUtil2.pGetOrCreateEditableBrewDoc();
		return MiscUtil.copy((brew.body[this._prop] || []).filter(entry => entry.source === this._ui.source))
			.sort((a, b) => SortUtil.ascSort(a.name, b.name));
	}

	/* -------------------------------------------- */

	async pHandleClick_duplicateUniqueId (uniqueId) {
		const copy = MiscUtil.copy(await BrewUtil2.pGetEditableBrewEntity(this._prop, uniqueId, {isDuplicate: true}));
		copy.name = StrUtil.getNextDuplicateName(copy.name);

		await BrewUtil2.pPersistEditableBrewEntity(this._prop, copy);

		return copy;
	}

	async pHandleClick_viewJsonUniqueId (evt, uniqueId) {
		const out = this._ui._getJsonOutputTemplate();

		out[this._prop] = [
			PropOrder.getOrdered(
				DataUtil.cleanJson(MiscUtil.copy(await BrewUtil2.pGetEditableBrewEntity(this._prop, uniqueId))),
				this._prop,
			),
		];

		Renderer.hover.getShowWindow(
			Renderer.hover.getHoverContent_statsCode(this._state),
			Renderer.hover.getWindowPositionFromEvent(evt),
			{
				title: `${this._state.name} \u2014 Source Data`,
				isPermanent: true,
				isBookContent: true,
			},
		);
	}

	async pHandleClick_downloadJsonUniqueId (uniqueId) {
		const out = this._ui._getJsonOutputTemplate();
		const cpy = MiscUtil.copy(await BrewUtil2.pGetEditableBrewEntity(this._prop, uniqueId));
		out[this._prop] = [DataUtil.cleanJson(cpy)];
		DataUtil.userDownload(DataUtil.getCleanFilename(cpy.name), out);
	}

	async pHandleClick_viewMarkdownUniqueId (evt, uniqueId) {
		const entry = MiscUtil.copy(await BrewUtil2.pGetEditableBrewEntity(this._prop, uniqueId));
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

		Renderer.hover.getShowWindow(
			Renderer.hover.getHoverContent_miscCode(name, mdText),
			Renderer.hover.getWindowPositionFromEvent(evt),
			{
				title: name,
				isPermanent: true,
				isBookContent: true,
			},
		);
	}

	async pHandleClick_downloadMarkdownUniqueId (uniqueId) {
		const entry = MiscUtil.copy(await BrewUtil2.pGetEditableBrewEntity(this._prop, uniqueId));
		const mdText = this._getAsMarkdown(entry).trim();
		DataUtil.userDownloadText(`${DataUtil.getCleanFilename(entry.name)}.md`, mdText);
	}

	async pHandleClick_deleteUniqueId (uniqueId, {isConfirm = false} = {}) {
		return this.pHandleClick_deleteUniqueIds([uniqueId], {isConfirm});
	}

	async pHandleClick_deleteUniqueIds (uniqueIds, {isConfirm = false} = {}) {
		if (!uniqueIds.length) return;

		if (
			isConfirm
			&& !await InputUiUtil.pGetUserBoolean({title: `Delete ${uniqueIds.length === 1 ? "" : `${uniqueIds.length} `}Entit${uniqueIds.length === 1 ? "y" : "ies"}`, htmlDescription: `Are you sure?`, textYes: "Yes", textNo: "Cancel"})
		) return;

		if (uniqueIds.includes(this._state.uniqueId)) this.reset();
		await BrewUtil2.pRemoveEditableBrewEntities(this._prop, uniqueIds);
		await this.pDoPostDelete();
	}

	async pHandleClickEditExisting () {
		const entities = await this._pGetBrewEntitiesCurrentSource();

		const {eleModalInner, doClose} = UiUtil.getShowModal({
			title: `${BrewUtil2.sourceJsonToFull(this._state.source)} \u2014 Edit ${Parser.getPropDisplayName(this._prop)}`,
			isHeight100: true,
			isUncappedHeight: true,
			isWidth100: true,
			zIndex: VeCt.Z_INDEX_BENEATH_HOVER,
		});

		const manageEntitiesUi = new _ManageExistingEntitiesUi({parent: this, entities, doClose});
		manageEntitiesUi.render({wrp: eleModalInner});
	}

	async pHandleClick_editUniqueId (uniqueId, {isConfirmOnUnsaved = false} = {}) {
		if (
			isConfirmOnUnsaved
			&& this._meta.isModified
			&& !await InputUiUtil.pGetUserBoolean({title: "Discard Unsaved Changes", htmlDescription: "You have unsaved changes. Are you sure?", textYes: "Yes", textNo: "Cancel"})
		) return;

		const entEditable = await BrewUtil2.pGetEditableBrewEntity(this._prop, uniqueId);
		if (entEditable._copy) {
			JqueryUtil.doToast({type: "warning", content: ee`<span>You are attempting to edit a <code>_copy</code>! Saving your changes will overwrite the <code>_copy</code> with a resolved version of the entity.</span>`});
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

	/**
	 * @param {?Array<string>} uniqueIds
	 */
	async pDoHandleClickDownloadJson ({uniqueIds = null} = {}) {
		const entities = (await this._pGetBrewEntitiesCurrentSource())
			.filter(ent => uniqueIds == null || uniqueIds.includes(ent.uniqueId));

		const out = this._ui._getJsonOutputTemplate();
		out[this._prop] = entities
			.map(entry => PropOrder.getOrdered(DataUtil.cleanJson(MiscUtil.copy(entry)), this._prop));
		DataUtil.userDownload(DataUtil.getCleanFilename(BrewUtil2.sourceJsonToFull(this._ui.source)), out);
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

	async pDoHandleClickSaveBrew () {
		const source = this._state.source;
		if (!source) throw new Error(`Current state has no "source"!`);

		const clean = DataUtil.cleanJson(MiscUtil.copy(this.__state), {isDeleteUniqueId: false});
		if (this._meta.isPersisted) {
			await BrewUtil2.pPersistEditableBrewEntity(this._prop, clean);
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
	}

	_getAsMarkdown (ent) {
		return RendererMarkdown.get().render({entries: [{type: "statblockInline", dataType: this._prop, data: ent}]});
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

		const wrpRows = ee`<div class="ve-flex-col ve-mb-1 ve-mt-n1"></div>`;
		const wrpRowsOuter = ee`<div class="ve-relative">${wrpRows}</div>`;

		const rowOptions = {wrpRowsOuter};

		const iptEntries = ee`<textarea class="ve-form-control form-control--minimal ve-resize-vertical ve-mb-2"></textarea>`
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
			if (!rawUrl) return null;

			const rawTitle = iptTitle.val().trim();
			const rawCredit = iptCredit.val().trim();
			const rawAltText = iptAltText.val().trim();

			return {
				type: "image",
				href: {
					type: "external",
					url: rawUrl,
				},
				...rawTitle ? {title: rawTitle} : {},
				...rawCredit ? {credit: rawCredit} : {},
				...rawAltText ? {altText: rawAltText} : {},
			};
		};

		const iptUrl = ee`<input class="ve-form-control form-control--minimal ve-input-xs ve-mr-2">`
			.onn("change", () => doUpdateState());
		const iptTitle = ee`<input class="ve-form-control form-control--minimal ve-input-xs ve-mr-2">`
			.onn("change", () => doUpdateState());
		const iptCredit = ee`<input class="ve-form-control form-control--minimal ve-input-xs ve-mr-2">`
			.onn("change", () => doUpdateState());
		const iptAltText = ee`<input class="ve-form-control form-control--minimal ve-input-xs ve-mr-2">`
			.onn("change", () => doUpdateState());

		if (image) {
			const href = ((image || {}).href || {});
			if (href.url) iptUrl.val(href.url);
			else if (href.path) {
				iptUrl.val(`${window.location.origin.replace(/\/+$/, "")}/img/${href.path}`);
			}

			if (image.title) iptTitle.val(image.title);
			if (image.credit) iptCredit.val(image.credit);
			if (image.altText) iptAltText.val(image.altText);
		}

		const btnPreview = ee`<button class="ve-btn ve-btn-xs ve-btn-default ve-mr-2" title="Preview Image"><span class="glyphicon glyphicon-fullscreen"></span></button>`
			.onn("click", (evt) => {
				const toRender = getState();
				if (!toRender) return JqueryUtil.doToast({content: "Please enter an image URL", type: "warning"});

				Renderer.hover.getShowWindow(
					Renderer.hover.getHoverContent_generic(toRender, {isBookContent: true}),
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

		out.ele = ee`<div class="ve-flex-v-center ve-py-1 mkbru__wrp-rows--removable">
			<div class="ve-flex-col ve-mr-2 ve-w-100">
				<label class="ve-flex-v-center ve-mb-2">
					<span class="ve-w-60p ve-no-shrink ve-mr-2 ve-text-right ve-bold">URL</span>
					${iptUrl}${btnPreview}
				</label>
				<label class="ve-flex-v-center ve-mb-2">
					<span class="ve-w-60p ve-no-shrink ve-mr-2 ve-text-right">Title</span>
					${iptTitle}
				</label>
				<label class="ve-flex-v-center ve-mb-2">
					<span class="ve-w-60p ve-no-shrink ve-mr-2 ve-text-right">Credit</span>
					${iptCredit}
				</label>
				<label class="ve-flex-v-center">
					<span class="ve-w-60p ve-no-shrink ve-mr-2 ve-text-right">Alt Text</span>
					${iptAltText}
				</label>
			</div>
			
			<div class="ve-flex-v-center">
				${btnRemove}${dragOrder}
			</div>
		</div>`;
		out.getState = getState;
		imageRows.push(out);

		return out;
	}

	_getRenderedMarkdownCode () {
		const mdText = this._getAsMarkdown(this._state);
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
	async pHandleClickLoadExisting () { throw new TypeError(`Unimplemented method!`); }
	async pHandleLoadExistingData (entity, opts) { throw new TypeError(`Unimplemented method!`); }
	async _pInit () {}
	async pDoPostSave () {}
	async pDoPostDelete () {}
}
