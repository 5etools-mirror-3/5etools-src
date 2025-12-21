import {UtilsOmnisearch} from "./utils-omnisearch.js";
import {OmnisearchConsts} from "./omnisearch/omnisearch-consts.js";
import {OmnisearchState} from "./omnisearch/omnisearch-state.js";
import {OmnisearchBacking} from "./omnisearch/omnisearch-backing.js";
import {OmnisearchUtilsUi} from "./omnisearch/omnisearch-utils-ui.js";

class SearchPage {
	static _STORAGE_KEY_IS_EXPANDED = "isExpanded";

	static _wrp = null;
	static _wrpResults = null;
	static _rowMetas = null;
	static _observer = null;
	static _observed = new Map();
	static _isAllExpanded = false;

	static async pInit () {
		await Promise.all([
			PrereleaseUtil.pInit(),
			BrewUtil2.pInit(),
		]);
		ExcludeUtil.pInitialise().then(null); // don't await, as this is only used for search

		SearchPage._isAllExpanded = (await StorageUtil.pGetForPage(SearchPage._STORAGE_KEY_IS_EXPANDED)) || false;
		SearchPage._wrp = es(`#main_content`).empty();
		this._render();
		window.dispatchEvent(new Event("toolsLoaded"));
	}

	/* -------------------------------------------- */

	static _PARAM_QUERY = "q";
	static _PARAM_LUCKY = "lucky";

	static _getSearchParams () {
		const params = new URLSearchParams(location.search);
		return Object.fromEntries(params);
	}

	static _setSearchParams (obj) {
		const params = new URLSearchParams(obj);
		location.search = params.toString();
	}

	/* -------------------------------------------- */

	static _render_getBtnToggleFilter ({btnMeta}) {
		const btn = ee`<button class="ve-btn ve-btn-default" title="${btnMeta.title.qq()}">${btnMeta.text.qq()}</button>`
			.onn("click", () => OmnisearchState[btnMeta.fnDoToggleOmnisearch]());
		const hkBrew = (val) => {
			btn.toggleClass("active", OmnisearchState[btnMeta.propOmnisearch]);
			if (val == null) return;
			this._pDoSearch().then(null);
		};
		OmnisearchState[btnMeta.fnAddHookOmnisearch](hkBrew);
		hkBrew();

		return btn;
	}

	static _render () {
		const iptSearch = ee`<input class="form-control pg-search__ipt" placeholder="Search everywhere..." title="Disclaimer: unlikely to search everywhere. Use with caution.">`
			.onn("keydown", evt => {
				if (evt.key !== "Enter") return;
				btnSearch.trigger("click");
			})
			.val(this._getSearchParams()[this._PARAM_QUERY]);

		const btnSearch = ee`<button class="ve-btn ve-btn-default"><span class="glyphicon glyphicon-search"></span></button>`
			.onn("click", () => {
				this._setSearchParams({
					[this._PARAM_QUERY]: iptSearch.val().trim().toLowerCase(),
				});
			});

		const btnHelp = ee`<button class="ve-btn ve-btn-default mr-2 mobile-sm__hidden" title="Help"><span class="glyphicon glyphicon-info-sign"></span></button>`
			.onn("click", () => OmnisearchUtilsUi.doShowHelp());

		const btnCyclePartneredMode = ee`<button class="ve-btn ve-btn-default pg-search__btn-partnered-mode"></button>`;
		OmnisearchUtilsUi.bindBtnCyclePartneredMode({
			btn: btnCyclePartneredMode,
			omnisearchState: OmnisearchState,
			fnDoSearch: this._pDoSearch.bind(this),
		});

		const [
			btnToggleBrew,
			btnToggleUa,
			btnToggleBlocklisted,
			btnToggleLegacy,
			btnToggleSrd,
		] = OmnisearchConsts.BTN_METAS
			.map(btnMeta => this._render_getBtnToggleFilter({btnMeta}));

		const handleMassExpandCollapse = mode => {
			SearchPage._isAllExpanded = mode;
			StorageUtil.pSetForPage("isExpanded", SearchPage._isAllExpanded);

			if (!SearchPage._rowMetas) return;
			SearchPage._rowMetas
				.filter(meta => meta.setIsExpanded)
				.forEach(meta => meta.setIsExpanded(mode));
		};

		const btnCollapseAll = ee`<button class="ve-btn ve-btn-default" title="Collapse All Results"><span class="glyphicon glyphicon-minus"></span></button>`
			.onn("click", () => handleMassExpandCollapse(false));

		const btnExpandAll = ee`<button class="ve-btn ve-btn-default" title="Expand All Results"><span class="glyphicon glyphicon-plus"></span></button>`
			.onn("click", () => handleMassExpandCollapse(true));

		SearchPage._wrpResults = ee`<div class="ve-flex-col w-100">${this._getWrpResult_message("Loading...")}</div>`;

		ee(SearchPage._wrp)`<div class="ve-flex-col w-100 pg-search__wrp">
			<div class="ve-flex-v-center mb-2 mobile-lg__ve-flex-col">
				<div class="ve-flex-v-center input-group ve-btn-group mr-2 w-100 mobile-lg__mb-2">${iptSearch}${btnSearch}</div>

				<div class="ve-flex-v-center mobile-sm__ve-flex-col mobile-lg__ve-flex-ai-start mobile-lg__w-100">
					${btnHelp}
					<div class="mr-2 ml-1 mobile-sm__ml-0 mobile-sm__mb-2 italic">Include</div>
					<div class="ve-flex-v-center ve-btn-group mr-2 mobile-sm__mb-2 mobile-sm__mr-0">
						${btnCyclePartneredMode}
						${btnToggleBrew}
						${btnToggleUa}
					</div>
					<div class="ve-flex-v-center ve-btn-group mr-2 mobile-sm__mb-2 mobile-sm__mr-0">
						${btnToggleBlocklisted}
						${btnToggleLegacy}
					</div>
					<div class="ve-flex-v-center mr-2 mobile-sm__mb-2 mobile-sm__mr-0">
						${btnToggleSrd}
					</div>
					<div class="ve-btn-group ve-flex-v-center">
						${btnCollapseAll}
						${btnExpandAll}
					</div>
				</div>
			</div>
			${SearchPage._wrpResults}
		</div>`;

		this._pDoSearch().then(null);
	}

	static async _pDoSearch () {
		if (SearchPage._observer) {
			for (const ele of SearchPage._observed.keys()) SearchPage._observer.unobserve(ele);
		} else {
			SearchPage._observer = new IntersectionObserver(
				(obsEntries) => {
					obsEntries.forEach(entry => {
						if (entry.intersectionRatio > 0) { // filter observed entries for those that intersect
							SearchPage._observer.unobserve(entry.target);
							const meta = SearchPage._observed.get(entry.target);
							meta.onObserve();
						}
					});
				},
				{rootMargin: "150px 0px", threshold: 0.01},
			);
		}
		SearchPage._rowMetas = [];

		const params = this._getSearchParams();

		if (!params[this._PARAM_QUERY]) {
			SearchPage._wrpResults.empty().appends(this._getWrpResult_message("Enter a search to view results"));
			return;
		}

		const results = await OmnisearchBacking.pGetResults(params[this._PARAM_QUERY]);

		SearchPage._wrpResults.empty();

		if (!results.length) {
			SearchPage._wrpResults.appends(this._getWrpResult_message("No results found."));
			return;
		}

		if (this._PARAM_LUCKY in params) {
			const [href] = results
				.map(res => OmnisearchUtilsUi.getResultHref(res.doc))
				.filter(Boolean);

			if (href) {
				window.location = `${Renderer.get().baseUrl}${href}`;
				return;
			}
		}

		SearchPage._rowMetas = results.map(result => {
			const r = result.doc;

			const lnk = OmnisearchUtilsUi.getResultLink(r);

			const {
				source,
				page,
				isHoverable,
				category,
				hash,
				isSrd,
				isSrd52,

				sourceAbv,
				sourceFull,
			} = UtilsOmnisearch.getUnpackedSearchResult(r);

			const ptPageInner = page ? `page ${page}` : "";
			const adventureBookSourceHref = SourceUtil.getAdventureBookSourceHref(source, page);
			const ptPage = ptPageInner && adventureBookSourceHref
				? `<a href="${adventureBookSourceHref}">${ptPageInner}</a>`
				: ptPageInner;

			const ptSrd = isSrd ? `<span class="ve-muted relative help-subtle pg-search__disp-srd" title="Available in the Systems Reference Document (5.1)">[SRD]</span>` : "";
			const ptSrd52 = isSrd52 ? `<span class="ve-muted relative help-subtle pg-search__disp-srd" title="Available in the Systems Reference Document (5.2)">[SRD]</span>` : "";

			const ptSourceInner = source
				? `<i>${sourceFull}</i> (<span class="${Parser.sourceJsonToSourceClassname(source)}">${sourceAbv}</span>)${ptSrd}${ptSrd52}${Parser.sourceJsonToMarkerHtml(source, {isAddBrackets: true, additionalStyles: "pg-search__disp-source-marker"})}`
				: `<span></span>`;
			const ptSource = ptPage || !adventureBookSourceHref
				? ptSourceInner
				: `<a href="${adventureBookSourceHref}">${ptSourceInner}</a>`;

			const dispImage = ee`<div class="ve-flex-col pg-search__disp-token mr-3 no-shrink"></div>`;
			const dispPreview = ee`<div class="ve-flex-col mobile-sm__w-100"></div>`;
			const wrpPreviewControls = ee`<div class="ve-flex-col mobile-sm__mb-2 mobile-sm__w-100 h-100"></div>`;

			const out = {};

			const row = ee`<div class="my-2 py-2 pl-3 pr-2 pg-search__wrp-result ve-flex relative mobile-sm__ve-flex-col">
				<div class="ve-flex-v-center mobile-sm__mb-2 w-100">
					${dispImage}
					<div class="ve-flex-col ve-flex-h-center mr-auto">
						<div class="mb-2">${lnk}</div>
						<div>${ptSource}${ptPage ? `, ${ptPage}` : ""}</div>
					</div>
				</div>
				<div class="ve-flex-v-center mobile-sm__ve-flex-col-reverse mobile-sm__ve-flex-ai-start">
					${dispPreview}
					${wrpPreviewControls}
				</div>
			</div>`.appendTo(SearchPage._wrpResults);

			if (isHoverable) {
				out.isExpanded = !!SearchPage._isAllExpanded;

				const handleIsExpanded = () => {
					dispPreview.toggleVe(out.isExpanded);
					btnTogglePreview
						.html(out.isExpanded ? `<span class="glyphicon glyphicon-minus"></span>` : `<span class="glyphicon glyphicon-plus"></span>`)
						.toggleClass("pg-search__btn-toggle-preview--expanded", out.isExpanded);
				};

				out.setIsExpanded = val => {
					out.isExpanded = !!val;
					handleIsExpanded();
				};

				const btnTogglePreview = ee`<button class="ve-btn ve-btn-default ve-btn-xs h-100" title="Toggle Preview"></button>`
					.onn("click", () => {
						out.isExpanded = !out.isExpanded;
						handleIsExpanded();
					})
					.appendTo(wrpPreviewControls);

				handleIsExpanded();
			}

			SearchPage._observed.set(
				row,
				{
					onObserve: () => {
						const page = UrlUtil.categoryToHoverPage(category);
						if (!page) {
							dispImage.addClass(`mobile-sm__hidden`);
							return;
						}

						DataLoader.pCacheAndGet(
							page,
							source,
							hash,
						).then(ent => {
							// region Render tokens, where available
							let isImagePopulated = false;

							const displayTokenImage = (
								{
									fnHasToken,
									fnGetTokenUrl,
								},
								ent,
							) => {
								if (!fnHasToken(ent)) return;

								isImagePopulated = true;
								const tokenUrl = fnGetTokenUrl(ent);
								dispImage.html(`<img src="${tokenUrl}" class="w-100 h-100" ${Renderer.utils.getTokenMetadataAttributes(ent)} loading="lazy">`);
							};

							switch (category) {
								case Parser.CAT_ID_CREATURE: {
									displayTokenImage(
										{
											fnHasToken: Renderer.monster.hasToken,
											fnGetTokenUrl: Renderer.monster.getTokenUrl,
										},
										ent,
									);
									break;
								}
								case Parser.CAT_ID_VEHICLE: {
									displayTokenImage(
										{
											fnHasToken: Renderer.vehicle.hasToken,
											fnGetTokenUrl: Renderer.vehicle.getTokenUrl,
										},
										ent,
									);
									break;
								}
								case Parser.CAT_ID_OBJECT: {
									displayTokenImage(
										{
											fnHasToken: Renderer.object.hasToken,
											fnGetTokenUrl: Renderer.object.getTokenUrl,
										},
										ent,
									);
									break;
								}

								case Parser.CAT_ID_BOOK:
								case Parser.CAT_ID_ADVENTURE: {
									const prop = category === Parser.CAT_ID_BOOK ? "book" : "adventure";
									isImagePopulated = true;
									dispImage.html(`<img src="${Renderer.adventureBook.getCoverUrl(ent[prop])}" class="w-100 h-100" alt="Cover Image: ${(ent[prop].name || "").qq()}" loading="lazy">`);
								}
							}

							if (!isImagePopulated) dispImage.addClass(`mobile-sm__hidden`);
							// endregion

							if (isHoverable) {
								// region Render preview

								Renderer.hover.$getHoverContent_stats(page, ent)
									.removeClass("w-100")
									.addClass("pg-search__wrp-preview mobile-sm__w-100 br-0")
									.appendTo(dispPreview);
								// endregion
							}
						});
					},
				},
			);
			SearchPage._observer.observe(row);

			return out;
		});
	}

	static _getWrpResult_message (message) {
		return `<div class="my-2 py-2 px-3 pg-search__wrp-result ve-flex-vh-center"><i>${message.qq()}</i></div>`;
	}
}

window.addEventListener("load", () => SearchPage.pInit());
