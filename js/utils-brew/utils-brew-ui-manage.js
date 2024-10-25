import {SOURCE_UNKNOWN_ABBREVIATION, SOURCE_UNKNOWN_FULL} from "./utils-brew-constants.js";
import {BrewDoc} from "./utils-brew-models.js";
import {GetBrewUi} from "./utils-brew-ui-get.js";
import {ManageEditableBrewContentsUi} from "./utils-brew-ui-manage-editable-contents.js";
import {ManageExternalUtils} from "../manageexternal/manageexternal-utils.js";

export class ManageBrewUi {
	static _RenderState = class {
		constructor () {
			this.$stgBrewList = null;
			this.list = null;
			this.listSelectClickHandler = null;
			this.brews = [];
			this.menuListMass = null;
			this.rowMetas = [];
		}
	};

	constructor ({brewUtil, isModal = false} = {}) {
		this._brewUtil = brewUtil;
		this._isModal = isModal;
	}

	/* -------------------------------------------- */

	static _CONTEXT_MENU_BTNGROUP_MANAGER = null;

	static bindBtngroupManager (btngroup) {
		btngroup
			.first(`[name="manage-content"]`)
			.onn("click", evt => this._pOnClickBtnManageContent({evt}));

		btngroup
			.first(`[name="manage-prerelease"]`)
			.onn("click", evt => this._onClickBtnManagePrereleaseBrew({brewUtil: PrereleaseUtil, isGoToPage: evt.shiftKey}));

		btngroup
			.first(`[name="manage-brew"]`)
			.onn("click", evt => this._onClickBtnManagePrereleaseBrew({brewUtil: BrewUtil2, isGoToPage: evt.shiftKey}));
	}

	static bindBtnOpen ($btn, {brewUtil = null} = {}) {
		brewUtil = brewUtil || BrewUtil2;

		$btn.click(evt => this._onClickBtnManagePrereleaseBrew({brewUtil, isGoToPage: evt.shiftKey}));
	}

	static _pOnClickBtnManageContent ({evt}) {
		this._CONTEXT_MENU_BTNGROUP_MANAGER ||= ContextUtil.getMenu([
			new ContextUtil.Action(
				"Manage Prerelease Content",
				async evt => {
					this._onClickBtnManagePrereleaseBrew({brewUtil: PrereleaseUtil, isGoToPage: evt.shiftKey});
				},
			),
			new ContextUtil.Action(
				"Manage Homebrew",
				async evt => {
					this._onClickBtnManagePrereleaseBrew({brewUtil: BrewUtil2, isGoToPage: evt.shiftKey});
				},
			),
			null,
			new ContextUtil.Action(
				"Load All Partnered Content",
				async evt => {
					await this.pOnClickBtnLoadAllPartnered();
				},
			),
			null,
			new ContextUtil.Action(
				"Delete All Loaded Content",
				async evt => {
					await this._pOnClickBtnDeleteAllLoadedContent();
				},
			),
		]);

		return ContextUtil.pOpenMenu(evt, this._CONTEXT_MENU_BTNGROUP_MANAGER);
	}

	static _onClickBtnManagePrereleaseBrew ({brewUtil, isGoToPage}) {
		if (isGoToPage) return window.location = brewUtil.PAGE_MANAGE;
		return this.pDoManageBrew({brewUtil});
	}

	static async pOnClickBtnLoadAllPartnered () {
		const brewDocs = [];
		try {
			const [brewDocsPrerelease, brewDocsHomebrew] = await Promise.all([
				PrereleaseUtil.pAddBrewsPartnered({isSilent: true}),
				BrewUtil2.pAddBrewsPartnered({isSilent: true}),
			]);
			brewDocs.push(
				...brewDocsPrerelease,
				...brewDocsHomebrew,
			);
		} catch (e) {
			JqueryUtil.doToast({type: "danger", content: `Failed to load partnered content! ${VeCt.STR_SEE_CONSOLE}`});
			throw e;
		}

		if (brewDocs.length) JqueryUtil.doToast(`Loaded partnered content!`);

		if (PrereleaseUtil.isReloadRequired()) PrereleaseUtil.doLocationReload();
		if (BrewUtil2.isReloadRequired()) BrewUtil2.doLocationReload();
	}

	static async _pOnClickBtnDeleteAllLoadedContent () {
		if (
			!await InputUiUtil.pGetUserBoolean({
				title: `Delete All Loaded ${PrereleaseUtil.DISPLAY_NAME.toTitleCase()} and ${BrewUtil2.DISPLAY_NAME.toTitleCase()}`,
				htmlDescription: `<div>
					<div>Are you sure?</div>
					<div class="ve-muted"><i>Note that this will <b>not</b> delete your Editable ${PrereleaseUtil.DISPLAY_NAME.toTitleCase()} and Editable ${BrewUtil2.DISPLAY_NAME.toTitleCase()}.</i></div>
				</div>`,
				textYes: "Yes",
				textNo: "Cancel",
			})
		) return;

		try {
			await Promise.all([
				PrereleaseUtil.pDeleteUneditableBrews(),
				BrewUtil2.pDeleteUneditableBrews(),
			]);
		} catch (e) {
			JqueryUtil.doToast({type: "danger", content: `Failed to load partnered content! ${VeCt.STR_SEE_CONSOLE}`});
			throw e;
		}

		if (PrereleaseUtil.isReloadRequired()) PrereleaseUtil.doLocationReload();
		if (BrewUtil2.isReloadRequired()) BrewUtil2.doLocationReload();
	}

	/* -------------------------------------------- */

	static async pOnClickBtnExportListAsUrl ({ele}) {
		const url = await ManageExternalUtils.pGetUrl();
		await MiscUtil.pCopyTextToClipboard(url);
		JqueryUtil.showCopiedEffect(ele);

		if (
			!await PrereleaseUtil.pHasEditableSourceJson()
			&& !await BrewUtil2.pHasEditableSourceJson()
		) return;

		JqueryUtil.doToast({type: "warning", content: `Note: you have Editable ${PrereleaseUtil.DISPLAY_NAME} or ${BrewUtil2.DISPLAY_NAME}. This cannot be exported as part of a URL, and so was not included.`});
	}

	/* -------------------------------------------- */

	static async pDoManageBrew ({brewUtil = null} = {}) {
		brewUtil = brewUtil || BrewUtil2;

		const ui = new this({isModal: true, brewUtil});
		const rdState = new this._RenderState();
		const {$modalInner} = UiUtil.getShowModal({
			isHeight100: true,
			isWidth100: true,
			title: `Manage ${brewUtil.DISPLAY_NAME.toTitleCase()}`,
			isUncappedHeight: true,
			$titleSplit: $$`<div class="ve-flex-v-center ve-btn-group">
				${ui._$getBtnPullAll(rdState)}
				${ui._$getBtnDeleteAll(rdState)}
			</div>`,
			isHeaderBorder: true,
			cbClose: () => {
				if (!brewUtil.isReloadRequired()) return;
				brewUtil.doLocationReload();
			},
		});
		await ui.pRender($modalInner, {rdState});
	}

	_$getBtnDeleteAll (rdState) {
		const brewUtilOther = this._brewUtil === PrereleaseUtil ? BrewUtil2 : PrereleaseUtil;

		return $(`<button class="ve-btn ve-btn-danger" title="SHIFT to also delete all ${brewUtilOther.DISPLAY_NAME.toTitleCase()}">Delete All</button>`)
			.addClass(this._isModal ? "ve-btn-xs" : "ve-btn-sm")
			.click(async evt => {
				if (!evt.shiftKey) {
					if (!await InputUiUtil.pGetUserBoolean({title: `Delete All ${this._brewUtil.DISPLAY_NAME.toTitleCase()}`, htmlDescription: "Are you sure?", textYes: "Yes", textNo: "Cancel"})) return;

					await this._pDoDeleteAll(rdState);

					return;
				}

				if (
					!await InputUiUtil.pGetUserBoolean({
						title: `Delete All ${this._brewUtil.DISPLAY_NAME.toTitleCase()} and ${brewUtilOther.DISPLAY_NAME.toTitleCase()}`,
						htmlDescription: "Are you sure?",
						textYes: "Yes",
						textNo: "Cancel",
					})
				) return;

				await brewUtilOther.pSetBrew([]);
				await this._pDoDeleteAll(rdState);
			});
	}

	_$getBtnPullAll (rdState) {
		const $btn = $(`<button class="ve-btn ve-btn-default">Update All</button>`)
			.addClass(this._isModal ? "ve-btn-xs w-70p" : "ve-btn-sm w-80p")
			.click(async () => {
				const cachedHtml = $btn.html();

				try {
					$btn.text(`Updating...`).prop("disabled", true);
					await this._pDoPullAll({rdState});
				} catch (e) {
					$btn.text(`Failed!`);
					setTimeout(() => $btn.html(cachedHtml).prop("disabled", false), VeCt.DUR_INLINE_NOTIFY);
					throw e;
				}

				$btn.text(`Done!`);
				setTimeout(() => $btn.html(cachedHtml).prop("disabled", false), VeCt.DUR_INLINE_NOTIFY);
			});
		return $btn;
	}

	async _pDoDeleteAll (rdState) {
		await this._brewUtil.pSetBrew([]);

		rdState.list.removeAllItems();
		rdState.list.update();
	}

	async _pDoPullAll ({rdState, brews = null}) {
		if (brews && !brews.length) return;

		let cntPulls;
		try {
			cntPulls = await this._brewUtil.pPullAllBrews({brews});
		} catch (e) {
			JqueryUtil.doToast({content: `Update failed! ${VeCt.STR_SEE_CONSOLE}`, type: "danger"});
			throw e;
		}
		if (!cntPulls) return JqueryUtil.doToast(`Update complete! No ${this._brewUtil.DISPLAY_NAME} was updated.`);

		await this._pRender_pBrewList(rdState);
		JqueryUtil.doToast(`Update complete! ${cntPulls} ${cntPulls === 1 ? `${this._brewUtil.DISPLAY_NAME} was` : `${this._brewUtil.DISPLAY_NAME_PLURAL} were`} updated.`);
	}

	async pRender ($wrp, {rdState = null} = {}) {
		rdState = rdState || new this.constructor._RenderState();

		rdState.$stgBrewList = $(`<div class="manbrew__current_brew ve-flex-col h-100 mt-1 min-h-0"></div>`);

		await this._pRender_pBrewList(rdState);

		const btnLoadPartnered = ee`<button class="ve-btn ve-btn-default ve-btn-sm">Load All Partnered</button>`
			.onn("click", () => this._pHandleClick_btnLoadPartnered(rdState));

		const $btnLoadFromFile = $(`<button class="ve-btn ve-btn-default ve-btn-sm">Load from File</button>`)
			.click(() => this._pHandleClick_btnLoadFromFile(rdState));

		const $btnLoadFromUrl = $(`<button class="ve-btn ve-btn-default ve-btn-sm">Load from URL</button>`)
			.click(() => this._pHandleClick_btnLoadFromUrl(rdState));

		const $btnGet = $(`<button class="ve-btn ${this._brewUtil.STYLE_BTN} ve-btn-sm">Get ${this._brewUtil.DISPLAY_NAME.toTitleCase()}</button>`)
			.click(() => this._pHandleClick_btnGetBrew(rdState));

		const $btnCustomUrl = $(`<button class="ve-btn ${this._brewUtil.STYLE_BTN} ve-btn-sm px-2" title="Set Custom Repository URL"><span class="glyphicon glyphicon-cog"></span></button>`)
			.click(() => this._pHandleClick_btnSetCustomRepo());

		const $btnPullAll = this._isModal ? null : this._$getBtnPullAll(rdState);
		const $btnDeleteAll = this._isModal ? null : this._$getBtnDeleteAll(rdState);

		const $btnSaveToUrl = $(`<button class="ve-btn ve-btn-default ve-btn-sm" title="Note that this does not include &quot;Editable&quot; or &quot;Local&quot; content.">Export List as URL</button>`)
			.click(async evt => {
				await this.constructor.pOnClickBtnExportListAsUrl({ele: evt.originalEvent.currentTarget});
			});

		const $wrpBtns = $$`<div class="ve-flex-v-center no-shrink mobile__ve-flex-col">
			<div class="ve-flex-v-center mobile__mb-2">
				<div class="ve-flex-v-center ve-btn-group mr-2">
					${$btnGet}
					${$btnCustomUrl}
				</div>
				<div class="ve-flex-v-center ve-btn-group mr-2">
					${btnLoadPartnered}
				</div>
				<div class="ve-flex-v-center ve-btn-group mr-2">
					${$btnLoadFromFile}
					${$btnLoadFromUrl}
				</div>
			</div>
			<div class="ve-flex-v-center">
				<a href="${this._brewUtil.URL_REPO_DEFAULT}" class="ve-flex-v-center" target="_blank" rel="noopener noreferrer"><button class="ve-btn ve-btn-default ve-btn-sm mr-2">Browse Source Repository</button></a>

				<div class="ve-flex-v-center ve-btn-group mr-2">
					${$btnSaveToUrl}
				</div>

				<div class="ve-flex-v-center ve-btn-group">
					${$btnPullAll}
					${$btnDeleteAll}
				</div>
			</div>
		</div>`;

		if (this._isModal) {
			$$($wrp)`
			${rdState.$stgBrewList}
			${$wrpBtns.addClass("mb-2")}`;
		} else {
			$$($wrp)`
			${$wrpBtns.addClass("mb-3")}
			${rdState.$stgBrewList}`;
		}
	}

	async _pHandleClick_btnLoadPartnered (rdState) {
		await this._brewUtil.pAddBrewsPartnered();
		await this._pRender_pBrewList(rdState);
	}

	async _pHandleClick_btnLoadFromFile (rdState) {
		const {files, errors} = await InputUiUtil.pGetUserUploadJson({isMultiple: true, expectedFileTypes: []});

		DataUtil.doHandleFileLoadErrorsGeneric(errors);

		await this._brewUtil.pAddBrewsFromFiles(files);
		await this._pRender_pBrewList(rdState);
	}

	async _pHandleClick_btnLoadFromUrl (rdState) {
		const enteredUrl = await InputUiUtil.pGetUserString({
			title: `${this._brewUtil.DISPLAY_NAME.toTitleCase()} URL`,
			htmlDescription: `<p>
				Provide a link to a ${this._brewUtil.DISPLAY_NAME} JSON.
				<br><span class="ve-muted">Note that for GitHub links, this should be the &quot;Raw&quot; link.</span>
			</p>`,
		});
		if (!enteredUrl || !enteredUrl.trim()) return;

		const parsedUrl = this.constructor._getParsedCustomUrl(enteredUrl);
		if (!parsedUrl) {
			return JqueryUtil.doToast({
				content: `The URL was not valid!`,
				type: "danger",
			});
		}

		// If mistakenly passed an "export as URL" link, navigate
		if (ManageExternalUtils.isLoadExternalUrl(parsedUrl.href)) {
			parsedUrl.hostname = window.location.hostname;
			parsedUrl.protocol = window.location.protocol;
			parsedUrl.port = window.location.port;
			window.location = parsedUrl;
		}

		await this._brewUtil.pAddBrewFromUrl(parsedUrl.href);
		await this._pRender_pBrewList(rdState);
	}

	static _getParsedCustomUrl (enteredUrl) {
		try {
			return new URL(enteredUrl);
		} catch (e) {
			return null;
		}
	}

	async _pHandleClick_btnGetBrew (rdState) {
		await GetBrewUi.pDoGetBrew({brewUtil: this._brewUtil, isModal: this._isModal});
		await this._pRender_pBrewList(rdState);
	}

	async _pHandleClick_btnSetCustomRepo () {
		const customBrewUtl = await this._brewUtil.pGetCustomUrl();

		const nxtUrl = await InputUiUtil.pGetUserString({
			title: `${this._brewUtil.DISPLAY_NAME.toTitleCase()} Repository URL`,
			$elePre: $(`<div>
				<p>Leave blank to use the <a href="${this._brewUtil.URL_REPO_DEFAULT}" rel="noopener noreferrer" target="_blank">default ${this._brewUtil.DISPLAY_NAME} repo</a>.</p>
				<div>Note that for GitHub URLs, the <code>raw.</code> URL must be used. For example, <code>${this._brewUtil.URL_REPO_ROOT_DEFAULT.replace(/TheGiddyLimit/g, "YourUsernameHere")}</code></div>
				<hr class="hr-3">
			</div>`),
			default: customBrewUtl,
		});
		if (nxtUrl == null) return;

		await this._brewUtil.pSetCustomUrl(nxtUrl);
	}

	async _pRender_pBrewList (rdState) {
		rdState.$stgBrewList.empty();
		rdState.rowMetas.splice(0, rdState.rowMetas.length)
			.forEach(({menu}) => ContextUtil.deleteMenu(menu));

		const $btnMass = $(`<button class="ve-btn ve-btn-default bbl-0 ve-self-flex-stretch">Mass...</button>`)
			.click(evt => this._pHandleClick_btnListMass({evt, rdState}));
		const $iptSearch = $(`<input type="search" class="search manbrew__search form-control bbr-0" placeholder="Search ${this._brewUtil.DISPLAY_NAME}...">`);
		const $cbAll = $(`<input type="checkbox">`);
		const $wrpList = $(`<div class="list-display-only max-h-unset smooth-scroll ve-overflow-y-auto h-100 min-h-0 brew-list brew-list--target manbrew__list relative ve-flex-col w-100 mb-3"></div>`);

		rdState.list = new List({
			$iptSearch,
			$wrpList,
			isUseJquery: true,
			isFuzzy: true,
			sortByInitial: rdState.list ? rdState.list.sortBy : undefined,
			sortDirInitial: rdState.list ? rdState.list.sortDir : undefined,
		});

		const $wrpBtnsSort = $$`<div class="filtertools manbrew__filtertools ve-btn-group input-group input-group--bottom ve-flex no-shrink">
			<label class="ve-col-0-5 pr-0 ve-btn ve-btn-default ve-btn-xs ve-flex-vh-center">${$cbAll}</label>
			<button class="ve-col-1 ve-btn ve-btn-default ve-btn-xs" disabled>Type</button>
			<button class="ve-col-3 ve-btn ve-btn-default ve-btn-xs" data-sort="source">Source</button>
			<button class="ve-col-3 ve-btn ve-btn-default ve-btn-xs" data-sort="authors">Authors</button>
			<button class="ve-col-3 ve-btn ve-btn-default ve-btn-xs" disabled>Origin</button>
			<button class="ve-col-1-5 ve-btn ve-btn-default ve-btn-xs ve-grow" disabled>&nbsp;</button>
		</div>`;

		$$(rdState.$stgBrewList)`
		<div class="ve-flex-col h-100">
			<div class="input-group ve-flex-vh-center">
				${$btnMass}
				${$iptSearch}
			</div>
			${$wrpBtnsSort}
			<div class="ve-flex w-100 h-100 min-h-0 relative">${$wrpList}</div>
		</div>`;

		rdState.listSelectClickHandler = new ListSelectClickHandler({list: rdState.list});
		rdState.listSelectClickHandler.bindSelectAllCheckbox($cbAll);
		SortUtil.initBtnSortHandlers($wrpBtnsSort, rdState.list);

		rdState.brews = (await this._brewUtil.pGetBrew()).map(brew => this._pRender_getProcBrew(brew));

		rdState.brews.forEach((brew, ix) => {
			const meta = this._pRender_getLoadedRowMeta(rdState, brew, ix);
			rdState.rowMetas.push(meta);
			rdState.list.addItem(meta.listItem);
		});

		rdState.list.init();
		$iptSearch.focus();
	}

	get _LBL_LIST_UPDATE () { return "Update"; }
	get _LBL_LIST_MANAGE_CONTENTS () { return "Manage Contents"; }
	get _LBL_LIST_EXPORT () { return "Export"; }
	get _LBL_LIST_VIEW_JSON () { return "View JSON"; }
	get _LBL_LIST_DELETE () { return "Delete"; }
	get _LBL_LIST_MOVE_TO_EDITABLE () { return `Move to Editable ${this._brewUtil.DISPLAY_NAME.toTitleCase()} Document`; }

	_initListMassMenu ({rdState}) {
		if (rdState.menuListMass) return;

		const getSelBrews = ({fnFilter = null} = {}) => {
			const brews = rdState.list.items
				.filter(li => li.data.cbSel.checked)
				.map(li => rdState.brews[li.ix])
				.filter(brew => fnFilter ? fnFilter(brew) : true);

			if (!brews.length) JqueryUtil.doToast({content: `Please select some suitable ${this._brewUtil.DISPLAY_NAME_PLURAL} first!`, type: "warning"});

			return brews;
		};

		rdState.menuListMass = ContextUtil.getMenu([
			new ContextUtil.Action(
				this._LBL_LIST_UPDATE,
				async () => this._pDoPullAll({
					rdState,
					brews: getSelBrews(),
				}),
			),
			new ContextUtil.Action(
				this._LBL_LIST_EXPORT,
				async () => {
					for (const brew of getSelBrews()) await this._pRender_pDoDownloadBrew({brew});
				},
			),
			this._brewUtil.IS_EDITABLE
				? new ContextUtil.Action(
					this._LBL_LIST_MOVE_TO_EDITABLE,
					async () => this._pRender_pDoMoveToEditable({
						rdState,
						brews: getSelBrews({
							fnFilter: brew => this._isBrewOperationPermitted_moveToEditable(brew),
						}),
					}),
				)
				: null,
			new ContextUtil.Action(
				this._LBL_LIST_DELETE,
				async () => this._pRender_pDoDelete({
					rdState,
					brews: getSelBrews({
						fnFilter: brew => this._isBrewOperationPermitted_delete(brew),
					}),
				}),
			),
		].filter(Boolean));
	}

	_isBrewOperationPermitted_update (brew) { return this._brewUtil.isPullable(brew); }
	_isBrewOperationPermitted_moveToEditable (brew) { return BrewDoc.isOperationPermitted_moveToEditable({brew}); }
	_isBrewOperationPermitted_delete (brew) { return !brew.head.isLocal; }

	async _pHandleClick_btnListMass ({evt, rdState}) {
		this._initListMassMenu({rdState});
		await ContextUtil.pOpenMenu(evt, rdState.menuListMass);
	}

	static _getBrewName (brew) {
		const sources = brew.body._meta?.sources || [];

		return sources
			.map(brewSource => brewSource.full || SOURCE_UNKNOWN_FULL)
			.sort(SortUtil.ascSortLower)
			.join(", ");
	}

	_pRender_getLoadedRowMeta (rdState, brew, ix) {
		const sources = brew.body._meta?.sources || [];

		const rowsSubMetas = sources
			.map(brewSource => {
				const hasConverters = !!brewSource.convertedBy?.length;
				const btnConvertedBy = e_({
					tag: "button",
					clazz: `ve-btn ve-btn-xxs ve-btn-default ${!hasConverters ? "disabled" : ""}`,
					title: hasConverters ? `Converted by: ${brewSource.convertedBy.join(", ").qq()}` : "(No conversion credit given)",
					children: [
						e_({tag: "span", clazz: "mobile__hidden", text: "View Converters"}),
						e_({tag: "span", clazz: "mobile__visible", text: "Convs.", title: "View Converters"}),
					],
					click: () => {
						if (!hasConverters) return;
						const {$modalInner} = UiUtil.getShowModal({
							title: `Converted By:${brewSource.convertedBy.length === 1 ? ` ${brewSource.convertedBy.join("")}` : ""}`,
							isMinHeight0: true,
						});

						if (brewSource.convertedBy.length === 1) return;
						$modalInner.append(`<ul>${brewSource.convertedBy.map(it => `<li>${it.qq()}</li>`).join("")}</ul>`);
					},
				});

				const authorsFull = [(brewSource.authors || [])].flat(2).join(", ");

				const lnkUrl = brewSource.url
					? e_({
						tag: "a",
						clazz: "ve-col-2 ve-text-center",
						href: brewSource.url,
						attrs: {
							target: "_blank",
							rel: "noopener noreferrer",
						},
						text: "View Source",
					})
					: e_({
						tag: "span",
						clazz: "ve-col-2 ve-text-center",
					});

				const eleRow = e_({
					tag: "div",
					clazz: `w-100 ve-flex-v-center`,
					children: [
						e_({
							tag: "span",
							clazz: `ve-col-4 manbrew__source px-1`,
							text: brewSource.full,
						}),
						e_({
							tag: "span",
							clazz: `ve-col-4 px-1`,
							text: authorsFull,
						}),
						lnkUrl,
						e_({
							tag: "div",
							clazz: `ve-flex-vh-center ve-grow`,
							children: [
								btnConvertedBy,
							],
						}),
					],
				});

				return {
					eleRow,
					authorsFull,
					name: brewSource.full || SOURCE_UNKNOWN_FULL,
					abbreviation: brewSource.abbreviation || SOURCE_UNKNOWN_ABBREVIATION,
				};
			})
			.sort((a, b) => SortUtil.ascSortLower(a.name, b.name));

		const brewName = this.constructor._getBrewName(brew);

		// region These are mutually exclusive
		const btnPull = this._pRender_getBtnPull({rdState, brew});
		const btnEdit = this._pRender_getBtnEdit({rdState, brew});
		const btnPullEditPlaceholder = (btnPull || btnEdit) ? null : this.constructor._pRender_getBtnPlaceholder();
		// endregion

		const btnDownload = e_({
			tag: "button",
			clazz: `ve-btn ve-btn-default ve-btn-xs mobile__hidden w-24p`,
			title: this._LBL_LIST_EXPORT,
			children: [
				e_({
					tag: "span",
					clazz: "glyphicon glyphicon-download manbrew-row__icn-btn",
				}),
			],
			click: () => this._pRender_pDoDownloadBrew({brew, brewName}),
		});

		const btnViewJson = e_({
			tag: "button",
			clazz: `ve-btn ve-btn-default ve-btn-xs mobile-lg__hidden w-24p`,
			title: `${this._LBL_LIST_VIEW_JSON}: ${this.constructor._getBrewJsonTitle({brew, brewName})}`,
			children: [
				e_({
					tag: "span",
					clazz: "ve-bolder code relative manbrew-row__icn-btn--text",
					text: "{}",
				}),
			],
			click: evt => this._pRender_doViewBrew({evt, brew, brewName}),
		});

		const btnOpenMenu = e_({
			tag: "button",
			clazz: `ve-btn ve-btn-default ve-btn-xs w-24p`,
			title: "Menu",
			children: [
				e_({
					tag: "span",
					clazz: "glyphicon glyphicon-option-vertical manbrew-row__icn-btn",
				}),
			],
			click: evt => this._pRender_pDoOpenBrewMenu({evt, rdState, brew, brewName, rowMeta}),
		});

		const btnDelete = this._isBrewOperationPermitted_delete(brew) ? e_({
			tag: "button",
			clazz: `ve-btn ve-btn-danger ve-btn-xs mobile__hidden w-24p`,
			title: this._LBL_LIST_DELETE,
			children: [
				e_({
					tag: "span",
					clazz: "glyphicon glyphicon-trash manbrew-row__icn-btn",
				}),
			],
			click: () => this._pRender_pDoDelete({rdState, brews: [brew]}),
		}) : this.constructor._pRender_getBtnPlaceholder();

		// Weave in HRs
		const elesSub = rowsSubMetas.map(it => it.eleRow);
		for (let i = rowsSubMetas.length - 1; i > 0; --i) elesSub.splice(i, 0, e_({tag: "hr", clazz: `hr-1 hr--dotted`}));

		const cbSel = e_({
			tag: "input",
			clazz: "no-events",
			type: "checkbox",
		});

		const ptCategory = brew.head.isLocal
			? {short: `Local`, title: `Local Document`}
			: brew.head.isEditable
				? {short: `Editable`, title: `Editable Document`}
				: {short: `Standard`, title: `Standard Document`};

		const eleLi = e_({
			tag: "div",
			clazz: `manbrew__row ve-flex-v-center lst__row lst__row-border lst__row-inner no-shrink py-1 no-select`,
			children: [
				e_({
					tag: "label",
					clazz: `ve-col-0-5 ve-flex-vh-center ve-self-flex-stretch`,
					children: [cbSel],
				}),
				e_({
					tag: "div",
					clazz: `ve-col-1 ve-text-center italic mobile__text-clip-ellipsis`,
					title: ptCategory.title,
					text: ptCategory.short,
				}),
				e_({
					tag: "div",
					clazz: `ve-col-9 ve-flex-col`,
					children: elesSub,
				}),
				e_({
					tag: "div",
					clazz: `ve-col-1-5 ve-btn-group ve-flex-vh-center`,
					children: [
						btnPull,
						btnEdit,
						btnPullEditPlaceholder,
						btnDownload,
						btnViewJson,
						btnOpenMenu,
						btnDelete,
					],
				}),
			],
		});

		const listItem = new ListItem(
			ix,
			eleLi,
			brewName,
			{
				authors: rowsSubMetas.map(it => it.authorsFull).join(", "),
				abbreviation: rowsSubMetas.map(it => it.abbreviation).join(", "),
			},
			{
				cbSel,
			},
		);

		eleLi.addEventListener("click", evt => rdState.listSelectClickHandler.handleSelectClick(listItem, evt, {isPassThroughEvents: true}));

		const rowMeta = {
			listItem,
			menu: null,
		};
		return rowMeta;
	}

	static _pRender_getBtnPlaceholder () {
		return e_({
			tag: "button",
			clazz: `ve-btn ve-btn-default ve-btn-xs mobile__hidden w-24p`,
			html: "&nbsp;",
		})
			.attr("disabled", true);
	}

	_pRender_getBtnPull ({rdState, brew}) {
		if (!this._isBrewOperationPermitted_update(brew)) return null;

		const btnPull = e_({
			tag: "button",
			clazz: `ve-btn ve-btn-default ve-btn-xs mobile__hidden w-24p`,
			title: this._LBL_LIST_UPDATE,
			children: [
				e_({
					tag: "span",
					clazz: "glyphicon glyphicon-refresh manbrew-row__icn-btn",
				}),
			],
			click: () => this._pRender_pDoPullBrew({rdState, brew}),
		});
		if (!this._brewUtil.isPullable(brew)) btnPull.attr("disabled", true).attr("title", `(Update disabled\u2014no URL available)`);
		return btnPull;
	}

	_pRender_getBtnEdit ({rdState, brew}) {
		if (!brew.head.isEditable) return null;

		return e_({
			tag: "button",
			clazz: `ve-btn ve-btn-default ve-btn-xs mobile__hidden w-24p`,
			title: this._LBL_LIST_MANAGE_CONTENTS,
			children: [
				e_({
					tag: "span",
					clazz: "glyphicon glyphicon-pencil manbrew-row__icn-btn",
				}),
			],
			click: () => this._pRender_pDoEditBrew({rdState, brew}),
		});
	}

	async _pRender_pDoPullBrew ({rdState, brew}) {
		const isPull = await this._brewUtil.pPullBrew(brew);

		JqueryUtil.doToast(
			isPull
				? `${this._brewUtil.DISPLAY_NAME.uppercaseFirst()} updated!`
				: `${this._brewUtil.DISPLAY_NAME.uppercaseFirst()} is already up-to-date.`,
		);

		if (!isPull) return;

		await this._pRender_pBrewList(rdState);
	}

	async _pRender_pDoEditBrew ({rdState, brew}) {
		const {isDirty, brew: nxtBrew} = await ManageEditableBrewContentsUi.pDoOpen({brewUtil: this._brewUtil, brew, isModal: this._isModal});
		if (!isDirty) return;

		await this._brewUtil.pUpdateBrew(nxtBrew);
		await this._pRender_pBrewList(rdState);
	}

	async _pRender_pDoDownloadBrew ({brew, brewName = null}) {
		const filename = (brew.head.filename || "").split(".").slice(0, -1).join(".");

		// For the editable brew, if there are multiple sources, present the user with a selection screen. We then filter
		//   the editable brew down to whichever sources they selected.
		const isChooseSources = brew.head.isEditable && (brew.body._meta?.sources || []).length > 1;

		if (!isChooseSources) {
			const outFilename = filename || brewName || this.constructor._getBrewName(brew);
			const json = brew.head.isEditable ? MiscUtil.copyFast(brew.body) : brew.body;
			this.constructor._mutExportableEditableData({json: json});
			return DataUtil.userDownload(outFilename, json, {isSkipAdditionalMetadata: true});
		}

		// region Get chosen sources
		const getSourceAsText = source => `[${(source.abbreviation || "").qq()}] ${(source.full || "").qq()}`;

		const choices = await InputUiUtil.pGetUserMultipleChoice({
			title: `Choose Sources`,
			values: brew.body._meta.sources,
			fnDisplay: getSourceAsText,
			isResolveItems: true,
			max: Number.MAX_SAFE_INTEGER,
			isSearchable: true,
			fnGetSearchText: getSourceAsText,
		});
		if (choices == null || choices.length === 0) return;
		// endregion

		// region Filter output by selected sources
		const cpyBrew = MiscUtil.copyFast(brew.body);
		const sourceAllowlist = new Set(choices.map(it => it.json));

		cpyBrew._meta.sources = cpyBrew._meta.sources.filter(it => sourceAllowlist.has(it.json));

		Object.entries(cpyBrew)
			.forEach(([k, v]) => {
				if (!v || !(v instanceof Array)) return;
				if (k.startsWith("_")) return;
				cpyBrew[k] = v.filter(it => {
					const source = SourceUtil.getEntitySource(it);
					if (!source) return true;
					return sourceAllowlist.has(source);
				});
			});
		// endregion

		const reducedFilename = filename || this.constructor._getBrewName({body: cpyBrew});

		this.constructor._mutExportableEditableData({json: cpyBrew});

		return DataUtil.userDownload(reducedFilename, cpyBrew, {isSkipAdditionalMetadata: true});
	}

	/**
	 * The editable brew may contain `uniqueId` references from the builder, which should be stripped before export.
	 */
	static _mutExportableEditableData ({json}) {
		Object.values(json)
			.forEach(arr => {
				if (arr == null || !(arr instanceof Array)) return;
				arr.forEach(ent => delete ent.uniqueId);
			});
		return json;
	}

	static _getBrewJsonTitle ({brew, brewName}) {
		brewName = brewName || this._getBrewName(brew);
		return brew.head.filename || brewName;
	}

	_pRender_doViewBrew ({evt, brew, brewName}) {
		const title = this.constructor._getBrewJsonTitle({brew, brewName});
		const $content = Renderer.hover.$getHoverContent_statsCode(brew.body, {isSkipClean: true, title});
		Renderer.hover.getShowWindow(
			$content,
			Renderer.hover.getWindowPositionFromEvent(evt),
			{
				title,
				isPermanent: true,
				isBookContent: true,
			},
		);
	}

	async _pRender_pDoOpenBrewMenu ({evt, rdState, brew, brewName, rowMeta}) {
		rowMeta.menu = rowMeta.menu || this._pRender_getBrewMenu({rdState, brew, brewName});

		await ContextUtil.pOpenMenu(evt, rowMeta.menu);
	}

	_pRender_getBrewMenu ({rdState, brew, brewName}) {
		const menuItems = [];

		if (this._isBrewOperationPermitted_update(brew)) {
			menuItems.push(
				new ContextUtil.Action(
					this._LBL_LIST_UPDATE,
					async () => this._pRender_pDoPullBrew({rdState, brew}),
				),
			);
		} else if (brew.head.isEditable) {
			menuItems.push(
				new ContextUtil.Action(
					this._LBL_LIST_MANAGE_CONTENTS,
					async () => this._pRender_pDoEditBrew({rdState, brew}),
				),
			);
		}

		menuItems.push(
			new ContextUtil.Action(
				this._LBL_LIST_EXPORT,
				async () => this._pRender_pDoDownloadBrew({brew, brewName}),
			),
			new ContextUtil.Action(
				this._LBL_LIST_VIEW_JSON,
				async evt => this._pRender_doViewBrew({evt, brew, brewName}),
			),
		);

		if (this._brewUtil.IS_EDITABLE && this._isBrewOperationPermitted_moveToEditable(brew)) {
			menuItems.push(
				new ContextUtil.Action(
					this._LBL_LIST_MOVE_TO_EDITABLE,
					async () => this._pRender_pDoMoveToEditable({rdState, brews: [brew]}),
				),
			);
		}

		if (this._isBrewOperationPermitted_delete(brew)) {
			menuItems.push(
				new ContextUtil.Action(
					this._LBL_LIST_DELETE,
					async () => this._pRender_pDoDelete({rdState, brews: [brew]}),
				),
			);
		}

		return ContextUtil.getMenu(menuItems);
	}

	_pGetUserBoolean_isMoveBrewsToEditable ({brews}) {
		return InputUiUtil.pGetUserBoolean({
			title: `Move to Editable ${this._brewUtil.DISPLAY_NAME.toTitleCase()} Document`,
			htmlDescription: `Moving ${brews.length === 1 ? `this ${this._brewUtil.DISPLAY_NAME}` : `these
			${this._brewUtil.DISPLAY_NAME_PLURAL}`} to the editable document will prevent ${brews.length === 1 ? "it" : "them"} from being automatically updated in future.<br>Are you sure you want to move ${brews.length === 1 ? "it" : "them"}?`,
			textYes: "Yes",
			textNo: "Cancel",
		});
	}

	async _pRender_pDoMoveToEditable ({rdState, brews}) {
		if (!brews?.length) return;

		if (!await this._pGetUserBoolean_isMoveBrewsToEditable({brews})) return;

		await this._brewUtil.pMoveToEditable({brews});

		await this._pRender_pBrewList(rdState);

		JqueryUtil.doToast(`${`${brews.length === 1 ? this._brewUtil.DISPLAY_NAME : this._brewUtil.DISPLAY_NAME_PLURAL}`.uppercaseFirst()} moved to editable document!`);
	}

	_pGetUserBoolean_isDeleteBrews ({brews}) {
		if (!brews.some(brew => brew.head.isEditable)) return true;

		const htmlDescription = brews.length === 1
			? `This document contains all your locally-created or edited ${this._brewUtil.DISPLAY_NAME_PLURAL}.<br>Are you sure you want to delete it?`
			: `One of the documents you are about to delete contains all your locally-created or edited ${this._brewUtil.DISPLAY_NAME_PLURAL}.<br>Are you sure you want to delete these documents?`;

		return InputUiUtil.pGetUserBoolean({
			title: `Delete ${this._brewUtil.DISPLAY_NAME}`,
			htmlDescription,
			textYes: "Yes",
			textNo: "Cancel",
		});
	}

	async _pRender_pDoDelete ({rdState, brews}) {
		if (!brews?.length) return;

		if (!await this._pGetUserBoolean_isDeleteBrews({brews})) return;

		await this._brewUtil.pDeleteBrews(brews);

		await this._pRender_pBrewList(rdState);
	}

	_pRender_getProcBrew (brew) {
		brew = MiscUtil.copyFast(brew);
		brew.body._meta.sources.sort((a, b) => SortUtil.ascSortLower(a.full || "", b.full || ""));
		return brew;
	}
}
