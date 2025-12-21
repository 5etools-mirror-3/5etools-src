import {UtilsOmnisearch} from "./utils-omnisearch.js";
import {OmnisearchConsts} from "./omnisearch/omnisearch-consts.js";
import {OmnisearchState} from "./omnisearch/omnisearch-state.js";
import {OmnisearchBacking} from "./omnisearch/omnisearch-backing.js";
import {OmnisearchUtilsUi} from "./omnisearch/omnisearch-utils-ui.js";

class OmnisearchUi {
	static _PLACEHOLDER_TEXT = "Search everywhere...";

	static _MAX_RESULTS = 20;

	static _TYPE_TIMEOUT_MS = 100; // auto-search after 100ms

	static _IPT_SEARCH_SPECIAL_KEYS = new Set([
		"Enter",
		"ArrowUp",
		"ArrowDown",
		"PageUp",
		"PageDown",
		"Escape",

		// region Unused, but ignored to prevent clearing current search
		"Home",
		"End",

		"Shift",
		"Meta",
		"Control",
		// endregion
	]);

	/* -------------------------------------------- */

	static _RenderState = class {
		constructor (
			{
				iptSearch,
				wrpSearchInput,
				wrpSearchFilters,
				wrpSearchResults,
				dispSearchOutput,
				wrpSearchOutput,
			},
		) {
			this.iptSearch = iptSearch;
			this.wrpSearchInput = wrpSearchInput;
			this.wrpSearchFilters = wrpSearchFilters;
			this.wrpSearchResults = wrpSearchResults;
			this.dispSearchOutput = dispSearchOutput;
			this.wrpSearchOutput = wrpSearchOutput;

			this.clickFirst = false;
			this.lastRender = null;
		}
	};

	/* -------------------------------------------- */

	static render () {
		if (globalThis.IS_VTT) return;

		const rdState = this._render_getElements();
		this._render_wrpSearchFilters({rdState});
		this._render_doBindElementListeners({rdState});
		this._render_doBindScrollHandler({rdState});
		this._render_doBindBodyListeners({rdState});
	}

	static _render_getElements () {
		const eleNavbar = document.getElementById("navbar");

		const iptSearch = e_({
			tag: "input",
			clazz: "form-control search omni__input",
			placeholder: this._PLACEHOLDER_TEXT,
			title: `Search Everywhere. Hotkey: F. Disclaimer: unlikely to search everywhere. Use with caution.`,
			type: "search",
		})
			.disableSpellcheck();

		const btnClearSearch = e_({
			tag: "span",
			clazz: "absolute glyphicon glyphicon-remove omni__btn-clear",
			mousedown: evt => {
				evt.stopPropagation();
				evt.preventDefault();
				iptSearch.val("").focus();
			},
		});

		const btnSearchSubmit = e_({
			tag: "button",
			clazz: "ve-btn ve-btn-default omni__submit",
			tabindex: -1,
			html: `<span class="glyphicon glyphicon-search"></span>`,
			click: evt => this._handleClick_pSubmit({evt, rdState}),
		});

		const wrpSearchInput = e_({
			tag: "div",
			clazz: "input-group omni__wrp-input ve-flex",
			children: [
				iptSearch,
				btnClearSearch,
				btnSearchSubmit,
			],
		})
			.appendTo(eleNavbar);

		const wrpSearchFilters = ee`<div class="ve-flex-h-right ve-flex-v-center mobile-sm__ve-flex-col mobile-sm__ve-flex-ai-start mb-2"></div>`;
		const wrpSearchResults = ee`<div class="ve-flex-col"></div>`;

		const dispSearchOutput = e_({
			tag: "div",
			clazz: "omni__output",
			children: [
				wrpSearchFilters,
				wrpSearchResults,
			],
		});

		const wrpSearchOutput = e_({
			tag: "div",
			clazz: "omni__wrp-output ve-flex",
			children: [
				dispSearchOutput,
			],
		})
			.hideVe()
			.insertAfter(eleNavbar);

		const rdState = new this._RenderState({
			iptSearch,
			wrpSearchInput,
			wrpSearchFilters,
			wrpSearchResults,
			dispSearchOutput,
			wrpSearchOutput,
		});

		return rdState;
	}

	static _render_wrpSearchFilters ({rdState}) {
		const btnCyclePartneredMode = ee`<button class="ve-btn ve-btn-default ve-btn-xs omni__btn-partnered-mode" tabindex="-1"></button>`;
		OmnisearchUtilsUi.bindBtnCyclePartneredMode({
			btn: btnCyclePartneredMode,
			omnisearchState: OmnisearchState,
			fnDoSearch: this._pDoSearch.bind(this, {rdState}),
		});

		const [
			btnToggleBrew,
			btnToggleUa,
			btnToggleBlocklisted,
			btnToggleLegacy,
			btnToggleSrd,
		] = OmnisearchConsts.BTN_METAS
			.map(btnMeta => this._getBtnToggleFilter({rdState, btnMeta}));

		const btnHelp = e_({
			tag: "button",
			clazz: "ve-btn ve-btn-default ve-btn-xs ml-2",
			title: "Help",
			html: `<span class="glyphicon glyphicon-info-sign"></span>`,
			click: () => OmnisearchUtilsUi.doShowHelp({isIncludeHotkeys: true}),
		});

		ee(rdState.wrpSearchFilters)`
			<div class="ve-flex-v-center mr-2 mobile-sm__mr-0 mobile-sm__mb-2 mobile-sm__w-100 mobile-sm__ve-flex-h-right">
				<span class="mr-2 italic relative top-1p">Include</span>
				<div class="ve-btn-group ve-flex-v-center">
					${btnCyclePartneredMode}
					${btnToggleBrew}
					${btnToggleUa}
				</div>
			</div>

			<div class="ve-flex-v-center mobile-sm__w-100 mobile-sm__ve-flex-h-right">
				<div class="ve-btn-group ve-flex-v-center mr-2">
					${btnToggleBlocklisted}
					${btnToggleLegacy}
				</div>
				${btnToggleSrd}
				${btnHelp}
			</div>
		</div>`;
	}

	static _render_doBindElementListeners ({rdState}) {
		rdState.dispSearchOutput
			.onClick(evt => {
				evt.stopPropagation();
				Renderer.hover.cleanTempWindows();
			});

		rdState.iptSearch
			.onKeydown((evt) => {
				evt.stopPropagation();
				Renderer.hover.cleanTempWindows();
				switch (evt.key) {
					case "Enter":
						if (EventUtil.isCtrlMetaKey(evt)) {
							window.location = `${Renderer.get().baseUrl}${UrlUtil.PG_SEARCH}?q=${rdState.iptSearch.val()}`;
							break;
						}

						rdState.clickFirst = true;
						this._handleClick_pSubmit({evt, rdState}).then(null);
						break;
					case "ArrowUp":
						evt.preventDefault();
						break;
					case "ArrowDown":
						evt.preventDefault();
						rdState.lastRender?.rowMetas[0]?.lnk.focus();
						break;
					case "PageUp": {
						evt.preventDefault();
						if (!rdState.lastRender || !this._hasPagePrev(rdState.lastRender)) break;
						this._pDoSearch_renderLinks({rdState, results: rdState.lastRender.results, ixPage: rdState.lastRender.ixPage - 1});
						break;
					}
					case "PageDown": {
						evt.preventDefault();
						if (!rdState.lastRender || !this._hasPageNext(rdState.lastRender)) break;
						this._pDoSearch_renderLinks({rdState, results: rdState.lastRender.results, ixPage: rdState.lastRender.ixPage + 1});
						break;
					}
					case "Escape":
						rdState.iptSearch.val("");
						rdState.iptSearch.blur();
				}
			});

		let typeTimer;
		rdState.iptSearch
			.onKeyup((evt) => {
				if (evt.key !== "Enter") rdState.clickFirst = false;
				if (this._IPT_SEARCH_SPECIAL_KEYS.has(evt.key)) return;
				clearTimeout(typeTimer);
				typeTimer = setTimeout(() => this._handleClick_pSubmit({rdState}), this._TYPE_TIMEOUT_MS);
			});
		rdState.iptSearch
			.onKeydown(() => clearTimeout(typeTimer));
		rdState.iptSearch
			.onClick(evt => {
				evt.stopPropagation();
				Renderer.hover.cleanTempWindows();
				if (rdState.iptSearch.val()?.trim().length) this._handleClick_pSubmit({rdState}).then(null);
			});
	}

	static _render_doBindScrollHandler ({rdState}) {
		window.addEventListener("scroll", evt => {
			if (Renderer.hover.isSmallScreen(evt)) {
				rdState.iptSearch.attr("placeholder", this._PLACEHOLDER_TEXT);
				rdState.wrpSearchInput.removeClass("omni__wrp-input--scrolled");
				rdState.dispSearchOutput.removeClass("omni__output--scrolled");
				return;
			}

			if (window.scrollY > 50) {
				rdState.iptSearch.attr("placeholder", " ");
				rdState.wrpSearchInput.addClass("omni__wrp-input--scrolled");
				rdState.dispSearchOutput.addClass("omni__output--scrolled");
				return;
			}

			rdState.iptSearch.attr("placeholder", this._PLACEHOLDER_TEXT);
			rdState.wrpSearchInput.removeClass("omni__wrp-input--scrolled");
			rdState.dispSearchOutput.removeClass("omni__output--scrolled");
		});
	}

	static _render_doBindBodyListeners ({rdState}) {
		document.body.addEventListener(
			"click",
			() => this._doCleanup({rdState}),
		);

		document.body.addEventListener(
			"keypress",
			(evt) => {
				if (!EventUtil.noModifierKeys(evt) || EventUtil.isInInput(evt)) return;
				if (EventUtil.getKeyIgnoreCapsLock(evt) !== "F") return;
				evt.preventDefault();
				rdState.iptSearch.focus();
				rdState.iptSearch.select();
			},
		);
	}

	/* -------------------------------------------- */

	static _hasPagePrev ({results, ixPage}) {
		return ixPage > 0;
	}

	static _hasPageNext ({results, ixPage}) {
		return (results.length - (ixPage * this._MAX_RESULTS) > this._MAX_RESULTS);
	}

	static _getNumPages ({results}) {
		return Math.ceil(results.length / this._MAX_RESULTS);
	}

	/* -------------------------------------------- */

	static async _handleClick_pSubmit ({evt, rdState}) {
		if (evt) evt.stopPropagation();
		await this._pDoSearch({rdState});
		Renderer.hover.cleanTempWindows();
	}

	/* -------------------------------------------- */

	static _handleKeydown_link ({rdState, evt, results, ixPage, rowMetas, ixInPage}) {
		Renderer.hover.cleanTempWindows();
		switch (evt.key) {
			case "ArrowLeft":
			case "PageUp": {
				evt.preventDefault();
				if (this._hasPagePrev({results, ixPage})) {
					const renderedMeta = this._pDoSearch_renderLinks({rdState, results: results, ixPage: ixPage - 1});
					renderedMeta.rowMetas[ixInPage].lnk.focus();
				}
				break;
			}
			case "ArrowUp": {
				evt.preventDefault();
				if (ixInPage) {
					rowMetas[ixInPage - 1].lnk.focus();
				} else if (this._hasPagePrev({results, ixPage})) {
					const renderedMeta = this._pDoSearch_renderLinks({rdState, results: results, ixPage: ixPage - 1});
					renderedMeta.rowMetas.at(-1).lnk.focus();
				} else {
					rdState.iptSearch.focus();
				}
				break;
			}
			case "ArrowRight":
			case "PageDown": {
				evt.preventDefault();
				if (this._hasPageNext({results, ixPage})) {
					const renderedMeta = this._pDoSearch_renderLinks({rdState, results: results, ixPage: ixPage + 1});
					(renderedMeta.rowMetas[ixInPage] || renderedMeta.rowMetas.at(-1)).lnk.focus();
				}
				break;
			}
			case "ArrowDown": {
				evt.preventDefault();
				if (rowMetas[ixInPage + 1]) {
					rowMetas[ixInPage + 1].lnk.focus();
				} else if (this._hasPageNext({results, ixPage})) {
					const renderedMeta = this._pDoSearch_renderLinks({rdState, results: results, ixPage: ixPage + 1});
					renderedMeta.rowMetas[0].lnk.focus();
				} else {
					rdState.iptSearch.focus();
				}
				break;
			}
			case "Home": {
				evt.preventDefault();
				const renderedMeta = this._pDoSearch_renderLinks({rdState, results: results, ixPage: 0});
				renderedMeta.rowMetas[0].lnk.focus();
				break;
			}
			case "End": {
				evt.preventDefault();
				const renderedMeta = this._pDoSearch_renderLinks({rdState, results: results, ixPage: this._getNumPages({results}) - 1});
				renderedMeta.rowMetas.at(-1).lnk.focus();
				break;
			}
		}
	}

	static _doCleanup ({rdState}) {
		rdState.lastRender = null;
		rdState.wrpSearchOutput.hideVe();
	}

	/* -------------------------------------------- */

	// region Search
	static _P_GETTING_RESULTS = null;

	static async _pDoSearch ({rdState}) {
		const pGettingResults = this._P_GETTING_RESULTS = OmnisearchBacking.pGetResults(CleanUtil.getCleanString(rdState.iptSearch.val()));
		const results = await this._P_GETTING_RESULTS;
		if (this._P_GETTING_RESULTS !== pGettingResults) return; // A later search has occurred
		this._pDoSearch_renderLinks({rdState, results});
	}

	static _getBtnToggleFilter ({rdState, btnMeta}) {
		const btn = ee`<button class="ve-btn ve-btn-default ve-btn-xs" tabindex="-1" title="${btnMeta.title.qq()}">${btnMeta.text.qq()}</button>`
			.onn("click", () => OmnisearchState[btnMeta.propOmnisearch] = !OmnisearchState[btnMeta.propOmnisearch]);

		OmnisearchState[btnMeta.fnAddHookOmnisearch]((val) => {
			btn.toggleClass("active", OmnisearchState[btnMeta.propOmnisearch]);
			if (val != null) this._pDoSearch({rdState}).then(null);
		})();

		return btn;
	}

	static _pDoSearch_renderLinks ({rdState, results, ixPage = 0}) {
		const out = this._pDoSearch_renderLinks_({rdState, results, ixPage});
		rdState.lastRender = out;
		return out;
	}

	static _pDoSearch_renderLinks_ ({rdState, results, ixPage}) {
		rdState.wrpSearchResults.empty();

		if (!results.length) {
			rdState.wrpSearchResults.appends(`<div class="ve-muted"><i>No results found.</i></div>`);
			rdState.wrpSearchOutput.showVe();
			return {rowMetas: [], results, ixPage};
		}

		// add pagination if there are many results
		const wrpPagination = this._pDoSearch_renderLinks_getWrpPagination({rdState, results, ixPage});

		const ixSliceStart = ixPage * this._MAX_RESULTS;
		const rowMetas = results
			.slice(ixSliceStart, ixSliceStart + this._MAX_RESULTS)
			.map((result, ixInPage) => {
				const resultDoc = result.doc;

				const lnk = OmnisearchUtilsUi.getResultLink(resultDoc)
					.onn("keydown", evt => this._handleKeydown_link({rdState, evt, results, ixPage, rowMetas, ixInPage}));

				const {
					source,
					page,
					isSrd,
					isSrd52,
					category,

					sourceAbv,
					sourceFull,
				} = UtilsOmnisearch.getUnpackedSearchResult(resultDoc);

				const ptPageInner = page ? `p${page}` : "";
				const adventureBookSourceHref = SourceUtil.getAdventureBookSourceHref(source, page);
				const ptPage = ptPageInner && adventureBookSourceHref
					? `<a href="${adventureBookSourceHref}">${ptPageInner}</a>`
					: ptPageInner;

				const ptSourceInner = source
					? `<span class="${Parser.sourceJsonToSourceClassname(source)}" title="${sourceFull.qq()}">${sourceAbv.qq()}</span>`
					: `<span></span>`;
				const ptSource = ptPage || !adventureBookSourceHref
					? ptSourceInner
					: `<a href="${adventureBookSourceHref}">${ptSourceInner}</a>`;

				ee`<div class="omni__row-result split-v-center stripe-odd">
					${lnk}
					<div class="ve-flex-v-center">
						${ptSource}
						${isSrd && category !== Parser.CAT_ID_PAGE ? `<span class="ve-muted omni__disp-srd help-subtle relative" title="Available in the Systems Reference Document (5.1)">[SRD]</span>` : ""}
						${isSrd52 && category !== Parser.CAT_ID_PAGE ? `<span class="ve-muted omni__disp-srd help-subtle relative" title="Available in the Systems Reference Document (5.2)">[SRD]</span>` : ""}
						${Parser.sourceJsonToMarkerHtml(source, {isAddBrackets: true, additionalStyles: "omni__disp-source-marker"})}
						${ptPage ? `<span class="omni__wrp-page small-caps">${ptPage}</span>` : ""}
					</div>
				</div>`.appendTo(rdState.wrpSearchResults);

				return {lnk};
			});

		if (wrpPagination) rdState.wrpSearchResults.appendChild(wrpPagination);

		rdState.wrpSearchOutput.showVe();

		if (rdState.clickFirst && rowMetas.length) {
			rowMetas[0].lnk.click();
		}

		return {rowMetas, results, ixPage};
	}

	static _pDoSearch_renderLinks_getWrpPagination (
		{
			rdState,
			results,
			ixPage,
		},
	) {
		if (results.length <= this._MAX_RESULTS) return null;

		const elePagePrev = this._hasPagePrev({results, ixPage})
			? ee`<span class="omni__paginate-left has-results-left omni__paginate-ctrl"><span class="glyphicon glyphicon-chevron-left"></span></span>`
				.onn("click", () => this._pDoSearch_renderLinks({rdState, results, ixPage: ixPage - 1}))
			: ee`<span class="omni__paginate-left">`;

		const elePageNext = this._hasPageNext({results, ixPage})
			? ee`<span class="omni__paginate-right has-results-right omni__paginate-ctrl"><span class="glyphicon glyphicon-chevron-right"></span></span>`
				.onn("click", () => this._pDoSearch_renderLinks({rdState, results, ixPage: ixPage + 1}))
			: ee`<span class="omni__paginate-right omni__paginate-ctrl">`;

		return ee`<div class="omni__wrp-paginate">
			${elePagePrev}
			<span class="paginate-count">Page ${ixPage + 1}/${this._getNumPages({results})} (${results.length} results)</span>
			${elePageNext}
		</div>`;
	}
	// endregion
}

window.addEventListener("load", () => OmnisearchUi.render());

globalThis.OmnisearchBacking = OmnisearchBacking;
