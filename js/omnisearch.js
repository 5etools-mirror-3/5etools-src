import {UtilsOmnisearch} from "./utils-omnisearch.js";

class Omnisearch {
	static _PLACEHOLDER_TEXT = "Search everywhere...";
	static _searchIndex = null;
	static _adventureBookLookup = null; // A map of `<sourceLower>: (adventureCatId|bookCatId)`
	static _pLoadSearch = null;
	static _CATEGORY_COUNTS = {};

	static _clickFirst = false;
	static _MAX_RESULTS = 15;

	static _STORAGE_NAME = "search";

	/* -------------------------------------------- */

	static _sortResults (a, b) {
		const byScore = SortUtil.ascSort(b.score, a.score);
		if (byScore) return byScore;

		const byName = SortUtil.ascSortLower(a.doc.n || "", b.doc.n || "");
		if (byName) return byName;

		const isNonStandardA = SourceUtil.isNonstandardSource(a.doc.s);
		const isNonStandardB = SourceUtil.isNonstandardSource(b.doc.s);

		return Number(isNonStandardA) - Number(isNonStandardB);
	}

	/* -------------------------------------------- */

	static _TYPE_TIMEOUT_MS = 100; // auto-search after 100ms

	static _iptSearch = null;
	static _wrpSearchInput = null;
	static _wrpSearchOutput = null;
	static _dispSearchOutput = null;

	static init () {
		if (IS_VTT) return;

		this._init_elements();

		this._dispSearchOutput.onClick(evt => {
			evt.stopPropagation();
			Renderer.hover.cleanTempWindows();
		});

		this._iptSearch.onKeydown((evt) => {
			evt.stopPropagation();
			Renderer.hover.cleanTempWindows();
			switch (evt.key) {
				case "Enter":
					if (EventUtil.isCtrlMetaKey(evt)) {
						window.location = `${Renderer.get().baseUrl}${UrlUtil.PG_SEARCH}?q=${this._iptSearch.val()}`;
						break;
					}

					this._clickFirst = true;
					this._pHandleClickSubmit(evt).then(null);
					break;
				case "ArrowUp":
					evt.preventDefault();
					break;
				case "ArrowDown":
					evt.preventDefault();
					$(this._dispSearchOutput).find(`.omni__lnk-name`).first().focus();
					break;
				case "Escape":
					this._iptSearch.val("");
					this._iptSearch.blur();
			}
		});

		let typeTimer;
		this._iptSearch.onKeyup((evt) => {
			this._clickFirst = false;
			if (evt.which >= 37 && evt.which <= 40) return;
			clearTimeout(typeTimer);
			typeTimer = setTimeout(() => this._pHandleClickSubmit(), this._TYPE_TIMEOUT_MS);
		});
		this._iptSearch.onKeydown(() => clearTimeout(typeTimer));
		this._iptSearch.onClick(evt => {
			evt.stopPropagation();
			Renderer.hover.cleanTempWindows();
			if (this._iptSearch.val() && this._iptSearch.val().trim().length) this._pHandleClickSubmit().then(null);
		});

		this._init_scrollHandler();
		this._init_bindBodyListeners();
	}

	static async _pHandleClickSubmit (evt) {
		if (evt) evt.stopPropagation();
		await this._pDoSearch();
		Renderer.hover.cleanTempWindows();
	}

	static _init_elements () {
		const eleNavbar = document.getElementById("navbar");

		this._iptSearch = e_({
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
				this._iptSearch.val("").focus();
			},
		});

		const btnSearchSubmit = e_({
			tag: "button",
			clazz: "ve-btn ve-btn-default omni__submit",
			tabindex: -1,
			html: `<span class="glyphicon glyphicon-search"></span>`,
			click: evt => this._pHandleClickSubmit(evt),
		});

		this._wrpSearchInput = e_({
			tag: "div",
			clazz: "input-group omni__wrp-input",
			children: [
				this._iptSearch,
				btnClearSearch,
				e_({
					tag: "div",
					clazz: "input-group-btn",
					children: [
						btnSearchSubmit,
					],
				}),
			],
		})
			.appendTo(eleNavbar);

		this._dispSearchOutput = e_({
			tag: "div",
			clazz: "omni__output",
		});

		this._wrpSearchOutput = e_({
			tag: "div",
			clazz: "omni__wrp-output ve-flex",
			children: [
				this._dispSearchOutput,
			],
		})
			.hideVe()
			.insertAfter(eleNavbar);
	}

	static _init_scrollHandler () {
		window.addEventListener("scroll", evt => {
			if (Renderer.hover.isSmallScreen(evt)) {
				this._iptSearch.attr("placeholder", this._PLACEHOLDER_TEXT);
				this._wrpSearchInput.removeClass("omni__wrp-input--scrolled");
				this._dispSearchOutput.removeClass("omni__output--scrolled");
			} else {
				if (window.scrollY > 50) {
					this._iptSearch.attr("placeholder", " ");
					this._wrpSearchInput.addClass("omni__wrp-input--scrolled");
					this._dispSearchOutput.addClass("omni__output--scrolled");
				} else {
					this._iptSearch.attr("placeholder", this._PLACEHOLDER_TEXT);
					this._wrpSearchInput.removeClass("omni__wrp-input--scrolled");
					this._dispSearchOutput.removeClass("omni__output--scrolled");
				}
			}
		});
	}

	static _init_bindBodyListeners () {
		document.body.addEventListener(
			"click",
			() => this._wrpSearchOutput.hideVe(),
		);

		document.body.addEventListener(
			"keypress",
			(evt) => {
				if (!EventUtil.noModifierKeys(evt) || EventUtil.isInInput(evt)) return;
				if (EventUtil.getKeyIgnoreCapsLock(evt) !== "F") return;
				evt.preventDefault();
				this._iptSearch.focus();
				this._iptSearch.select();
			},
		);
	}

	/* -------------------------------------------- */

	static async pGetFilteredResults (results, {isApplySrdFilter = false, isApplyPartneredFilter = false} = {}) {
		Omnisearch.initState();

		if (isApplySrdFilter && this._state.isSrdOnly) {
			results = results.filter(r => r.doc.r);
		}

		if (isApplyPartneredFilter && !this._state.isShowPartnered) {
			results = results.filter(r => !r.doc.s || !r.doc.dP);
		}

		if (!this._state.isShowBrew) {
			// Always filter in partnered, as these are handled by the more specific filter, above
			results = results.filter(r => !r.doc.s || r.doc.dP || !BrewUtil2.hasSourceJson(r.doc.s));
		}

		if (!this._state.isShowUa) {
			results = results.filter(r => !r.doc.s || !SourceUtil.isNonstandardSourceWotc(r.doc.s));
		}

		if (!this._state.isShowLegacy) {
			results = results.filter(r => !r.doc.s || !SourceUtil.isLegacySourceWotc(r.doc.s));
		}

		if (!this._state.isShowBlocklisted && ExcludeUtil.getList().length) {
			const resultsNxt = [];
			for (const r of results) {
				if (r.doc.c === Parser.CAT_ID_QUICKREF || r.doc.c === Parser.CAT_ID_PAGE) {
					resultsNxt.push(r);
					continue;
				}

				const bCat = Parser.pageCategoryToProp(r.doc.c);
				if (bCat !== "item") {
					if (!ExcludeUtil.isExcluded(r.doc.u, bCat, r.doc.s, {isNoCount: true})) resultsNxt.push(r);
					continue;
				}

				const item = await DataLoader.pCacheAndGetHash(UrlUtil.PG_ITEMS, r.doc.u);
				if (!Renderer.item.isExcluded(item, {hash: r.doc.u})) resultsNxt.push(r);
			}
			results = resultsNxt;
		}

		results.sort(this._sortResults);

		return results;
	}

	/* -------------------------------------------- */

	static _RE_SYNTAX__SOURCE = /\bsource:(?<source>.*)\b/i;
	static _RE_SYNTAX__PAGE = /\bpage:\s*(?<pageStart>\d+)\s*(?:-\s*(?<pageEnd>\d+)\s*)?\b/i;

	static async pGetResults (searchTerm) {
		searchTerm = (searchTerm || "").toAscii();

		await this.pInit();

		const syntaxMetasCategory = [];
		const syntaxMetasSource = [];
		const syntaxMetasPageRange = [];

		searchTerm = searchTerm
			.replace(this._RE_SYNTAX__SOURCE, (...m) => {
				const {source} = m.at(-1);
				syntaxMetasSource.push({
					source: source.trim().toLowerCase(),
				});
				return "";
			})
			.replace(this._RE_SYNTAX__PAGE, (...m) => {
				const {pageStart, pageEnd} = m.at(-1);
				syntaxMetasPageRange.push({
					pageRange: [
						Number(pageStart),
						pageEnd ? Number(pageEnd) : Number(pageStart),
					],
				});
				return "";
			})
			.replace(this._RE_SYNTAX__IN_CATEGORY, (...m) => {
				let {category} = m.at(-1);
				category = category.toLowerCase().trim();

				const categories = (
					this._IN_CATEGORY_ALIAS[category]
					|| this._IN_CATEGORY_ALIAS_SHORT[category]
					|| [category]
				)
					.map(it => it.toLowerCase());

				syntaxMetasCategory.push({categories});
				return "";
			})
			.replace(/\s+/g, " ")
			.trim();

		const results = await this._pGetResults_pGetBaseResults({
			searchTerm,
			syntaxMetasCategory,
			syntaxMetasSource,
			syntaxMetasPageRange,
		});

		return this.pGetFilteredResults(results, {isApplySrdFilter: true, isApplyPartneredFilter: true});
	}

	static _pGetResults_pGetBaseResults (
		{
			searchTerm,
			syntaxMetasCategory,
			syntaxMetasSource,
			syntaxMetasPageRange,
		},
	) {
		if (
			!syntaxMetasCategory.length
			&& !syntaxMetasSource.length
			&& !syntaxMetasPageRange.length
		) {
			return this._searchIndex.search(
				searchTerm,
				{
					fields: {
						n: {boost: 5, expand: true},
						s: {expand: true},
					},
					bool: "AND",
					expand: true,
				},
			);
		}

		const categoryTerms = syntaxMetasCategory.flatMap(it => it.categories);
		const sourceTerms = syntaxMetasSource.map(it => it.source);
		const pageRanges = syntaxMetasPageRange.map(it => it.pageRange);

		const resultsUnfiltered = searchTerm
			? this._searchIndex
				.search(
					searchTerm,
					{
						fields: {
							n: {boost: 5, expand: true},
							s: {expand: true},
						},
						bool: "AND",
						expand: true,
					},
				)
			: Object.values(this._searchIndex.documentStore.docs).map(it => ({doc: it}));

		return resultsUnfiltered
			.filter(r => !categoryTerms.length || (categoryTerms.includes(r.doc.cf.toLowerCase())))
			.filter(r => !sourceTerms.length || (r.doc.s && sourceTerms.includes(Parser.sourceJsonToAbv(r.doc.s).toLowerCase())))
			.filter(r => !pageRanges.length || (r.doc.p && pageRanges.some(range => r.doc.p >= range[0] && r.doc.p <= range[1])));
	}

	/* -------------------------------------------- */

	// region Search
	static async _pDoSearch () {
		const results = await this.pGetResults(CleanUtil.getCleanString(this._iptSearch.val()));
		this._pDoSearch_renderLinks(results);
	}

	static _renderLink_getHoverString (category, url, src, {isFauxPage = false} = {}) {
		return Renderer.hover.getHoverElementAttributes({
			page: UrlUtil.categoryToHoverPage(category),
			source: src,
			hash: url,
			isFauxPage,
		});
	}

	static _isFauxPage (r) {
		return !!r.hx;
	}

	static getResultHref (r) {
		const isFauxPage = this._isFauxPage(r);
		if (isFauxPage) return null;
		return r.c === Parser.CAT_ID_PAGE ? r.u : `${Renderer.get().baseUrl}${UrlUtil.categoryToPage(r.c)}#${r.uh || r.u}`;
	}

	static $getResultLink (r) {
		const isFauxPage = this._isFauxPage(r);

		if (isFauxPage) return $(`<span tabindex="0" ${r.h ? this._renderLink_getHoverString(r.c, r.u, r.s, {isFauxPage}) : ""} class="omni__lnk-name help">${r.cf}: ${r.n}</span>`);

		const href = this.getResultHref(r);
		return $(`<a href="${href}" ${r.h ? this._renderLink_getHoverString(r.c, r.u, r.s, {isFauxPage}) : ""} class="omni__lnk-name">${r.cf}: ${r.n}</a>`);
	}

	static _btnTogglePartnered = null;
	static _btnToggleBrew = null;
	static _btnToggleUa = null;
	static _btnToggleBlocklisted = null;
	static _btnToggleLegacy = null;
	static _btnToggleSrd = null;

	static _doInitBtnToggleFilter (
		{
			propState,
			propBtn,
			title,
			text,
		},
	) {
		if (this[propBtn]) this[propBtn].detach();
		else {
			this[propBtn] = e_({
				tag: "button",
				clazz: "ve-btn ve-btn-default ve-btn-xs",
				title,
				tabindex: -1,
				text,
				click: () => this._state[propState] = !this._state[propState],
			});

			const hk = (val) => {
				this[propBtn].toggleClass("active", this._state[propState]);
				if (val != null) this._pDoSearch().then(null);
			};
			this._state._addHookBase(propState, hk);
			hk();
		}
	}

	static _pDoSearch_renderLinks (results, page = 0) {
		this._doInitBtnToggleFilter({
			propState: "isShowPartnered",
			propBtn: "_btnTogglePartnered",
			title: "Include partnered content results",
			text: "Partnered",
		});

		this._doInitBtnToggleFilter({
			propState: "isShowBrew",
			propBtn: "_btnToggleBrew",
			title: "Include homebrew content results",
			text: "Homebrew",
		});

		this._doInitBtnToggleFilter({
			propState: "isShowUa",
			propBtn: "_btnToggleUa",
			title: "Include Unearthed Arcana and other unofficial source results",
			text: "UA/etc.",
		});

		this._doInitBtnToggleFilter({
			propState: "isShowBlocklisted",
			propBtn: "_btnToggleBlocklisted",
			title: "Include blocklisted content results",
			text: "Blocklisted",
		});

		this._doInitBtnToggleFilter({
			propState: "isShowLegacy",
			propBtn: "_btnToggleLegacy",
			title: "Include legacy content results",
			text: "Legacy",
		});

		this._doInitBtnToggleFilter({
			propState: "isSrdOnly",
			propBtn: "_btnToggleSrd",
			title: "Only show Systems Reference Document content results",
			text: "SRD",
		});

		this._dispSearchOutput.empty();

		const btnHelp = e_({
			tag: "button",
			clazz: "ve-btn ve-btn-default ve-btn-xs ml-2",
			title: "Help",
			html: `<span class="glyphicon glyphicon-info-sign"></span>`,
			click: () => this.doShowHelp(),
		});

		ee(this._dispSearchOutput)`<div class="ve-flex-h-right ve-flex-v-center mb-2">
			<span class="mr-2 italic relative top-1p">Include</span>
			<div class="ve-btn-group ve-flex-v-center mr-2">
				${this._btnTogglePartnered}
				${this._btnToggleBrew}
				${this._btnToggleUa}
			</div>
			<div class="ve-btn-group ve-flex-v-center mr-2">
				${this._btnToggleBlocklisted}
				${this._btnToggleLegacy}
			</div>
			${this._btnToggleSrd}
			${btnHelp}
		</div>`;

		const base = page * this._MAX_RESULTS;
		for (let i = base; i < Math.max(Math.min(results.length, this._MAX_RESULTS + base), base); ++i) {
			const r = results[i].doc;

			const $link = this.$getResultLink(r)
				.keydown(evt => this.handleLinkKeyDown(evt, $link));

			const {
				source,
				page,
				isSrd,
				isSrd52,

				ptStyle,
				sourceAbv,
				sourceFull,
			} = UtilsOmnisearch.getUnpackedSearchResult(r);

			const ptPageInner = page ? `p${page}` : "";
			const adventureBookSourceHref = SourceUtil.getAdventureBookSourceHref(source, page);
			const ptPage = ptPageInner && adventureBookSourceHref
				? `<a href="${adventureBookSourceHref}">${ptPageInner}</a>`
				: ptPageInner;

			const ptSourceInner = source
				? `<span class="${Parser.sourceJsonToSourceClassname(source)}" ${ptStyle} title="${sourceFull.qq()}">${sourceAbv.qq()}</span>`
				: `<span></span>`;
			const ptSource = ptPage || !adventureBookSourceHref
				? ptSourceInner
				: `<a href="${adventureBookSourceHref}">${ptSourceInner}</a>`;

			$$`<div class="omni__row-result split-v-center stripe-odd">
				${$link}
				<div class="ve-flex-v-center">
					${ptSource}
					${isSrd ? `<span class="ve-muted omni__disp-srd help-subtle relative" title="Available in the Systems Reference Document (5.1)">[SRD]</span>` : ""}
					${isSrd52 ? `<span class="ve-muted omni__disp-srd help-subtle relative" title="Available in the Systems Reference Document (5.2)">[SRD]</span>` : ""}
					${Parser.sourceJsonToMarkerHtml(source, {isList: false, additionalStyles: "omni__disp-source-marker"})}
					${ptPage ? `<span class="omni__wrp-page small-caps">${ptPage}</span>` : ""}
				</div>
			</div>`.appendTo(this._dispSearchOutput);
		}
		this._wrpSearchOutput.showVe();

		// add pagination if there are many results
		if (results.length > this._MAX_RESULTS) {
			const $pgControls = $(`<div class="omni__wrp-paginate">`);
			if (page > 0) {
				const $prv = $(`<span class="omni__paginate-left has-results-left omni__paginate-ctrl"><span class="glyphicon glyphicon-chevron-left"></span></span>`).on("click", () => {
					page--;
					this._pDoSearch_renderLinks(results, page);
				});
				$pgControls.append($prv);
			} else ($pgControls.append(`<span class="omni__paginate-left">`));
			$pgControls.append(`<span class="paginate-count">Page ${page + 1}/${Math.ceil(results.length / this._MAX_RESULTS)} (${results.length} results)</span>`);
			if (results.length - (page * this._MAX_RESULTS) > this._MAX_RESULTS) {
				const $nxt = $(`<span class="omni__paginate-right has-results-right omni__paginate-ctrl"><span class="glyphicon glyphicon-chevron-right"></span></span>`).on("click", () => {
					page++;
					this._pDoSearch_renderLinks(results, page);
				});
				$pgControls.append($nxt);
			} else ($pgControls.append(`<span class="omni__paginate-right omni__paginate-ctrl">`));
			$pgControls.appendTo(this._dispSearchOutput);
		}

		if (this._clickFirst && results.length) {
			$(this._dispSearchOutput).find(`.omni__lnk-name`).first()[0].click();
		}

		if (!results.length) {
			$(this._dispSearchOutput).append(`<div class="ve-muted"><i>No results found.</i></div>`);
		}
	}
	// endregion

	static async pInit () {
		this.initState();
		if (!this._searchIndex) {
			if (this._pLoadSearch) await this._pLoadSearch;
			else {
				this._pLoadSearch = this._pDoSearchLoad();
				await this._pLoadSearch;
				this._pLoadSearch = null;
			}
		}
	}

	static _DEFAULT_STATE = {
		isShowPartnered: false,
		isShowBrew: true,
		isShowUa: true,
		isShowBlocklisted: false,
		isShowLegacy: false,
		isSrdOnly: false,
	};

	static initState () {
		if (this._state) return;

		const saved = StorageUtil.syncGet(this._STORAGE_NAME) || {};
		Object.entries(this._DEFAULT_STATE)
			.forEach(([k, v]) => saved[k] ??= v);

		class SearchState extends BaseComponent {
			get isShowPartnered () { return this._state.isShowPartnered; }
			get isShowBrew () { return this._state.isShowBrew; }
			get isShowUa () { return this._state.isShowUa; }
			get isShowBlocklisted () { return this._state.isShowBlocklisted; }
			get isShowLegacy () { return this._state.isShowLegacy; }
			get isSrdOnly () { return this._state.isSrdOnly; }

			set isShowPartnered (val) { this._state.isShowPartnered = !!val; }
			set isShowBrew (val) { this._state.isShowBrew = !!val; }
			set isShowUa (val) { this._state.isShowUa = !!val; }
			set isShowBlocklisted (val) { this._state.isShowBlocklisted = !!val; }
			set isShowLegacy (val) { this._state.isShowLegacy = !!val; }
			set isSrdOnly (val) { this._state.isSrdOnly = !!val; }
		}
		this._state = SearchState.fromObject(saved);
		this._state._addHookAll("state", () => {
			StorageUtil.syncSet(this._STORAGE_NAME, this._state.toObject());
		});
	}

	static addHookPartnered (hk) { this._state._addHookBase("isShowPartnered", hk); }
	static addHookBrew (hk) { this._state._addHookBase("isShowBrew", hk); }
	static addHookUa (hk) { this._state._addHookBase("isShowUa", hk); }
	static addHookBlocklisted (hk) { this._state._addHookBase("isShowBlocklisted", hk); }
	static addHookLegacy (hk) { this._state._addHookBase("isShowLegacy", hk); }
	static addHookSrdOnly (hk) { this._state._addHookBase("isSrdOnly", hk); }

	static doTogglePartnered () { this._state.isShowPartnered = !this._state.isShowPartnered; }
	static doToggleBrew () { this._state.isShowBrew = !this._state.isShowBrew; }
	static doToggleUa () { this._state.isShowUa = !this._state.isShowUa; }
	static doToggleBlocklisted () { this._state.isShowBlocklisted = !this._state.isShowBlocklisted; }
	static doToggleLegacy () { this._state.isShowLegacy = !this._state.isShowLegacy; }
	static doToggleSrdOnly () { this._state.isSrdOnly = !this._state.isSrdOnly; }

	static get isShowPartnered () { return this._state.isShowPartnered; }
	static get isShowBrew () { return this._state.isShowBrew; }
	static get isShowUa () { return this._state.isShowUa; }
	static get isShowLegacy () { return this._state.isShowLegacy; }
	static get isShowBlocklisted () { return this._state.isShowBlocklisted; }

	/* -------------------------------------------- */

	static async _pDoSearchLoad () {
		elasticlunr.clearStopWords();
		this._searchIndex = elasticlunr(function () {
			this.addField("n");
			this.addField("cf");
			this.addField("s");
			this.setRef("id");
		});
		SearchUtil.removeStemmer(this._searchIndex);

		const siteIndex = Omnidexer.decompressIndex(await DataUtil.loadJSON(`${Renderer.get().baseUrl}search/index.json`));
		siteIndex.forEach(it => this._addToIndex(it));

		const prereleaseIndex = await PrereleaseUtil.pGetSearchIndex({id: this._maxId + 1});
		prereleaseIndex.forEach(it => this._addToIndex(it));

		const brewIndex = await BrewUtil2.pGetSearchIndex({id: this._maxId + 1});
		brewIndex.forEach(it => this._addToIndex(it));

		// region Partnered homebrew
		//   Note that we filter out anything which is already in the user's homebrew, to avoid double-indexing
		const sourcesBrew = new Set(
			BrewUtil2.getSources()
				.map(src => src.json),
		);

		const partneredIndexRaw = Omnidexer.decompressIndex(await DataUtil.loadJSON(`${Renderer.get().baseUrl}search/index-partnered.json`));
		const partneredIndex = partneredIndexRaw
			.filter(it => !sourcesBrew.has(it.s));
		// Re-ID, to:
		//   - override the base partnered index IDs (which has statically-generated IDs starting at 0)
		//   - avoid any holes
		partneredIndex
			.forEach((it, i) => it.id = this._maxId + 1 + i);
		partneredIndex.forEach(it => this._addToIndex(it));
		// endregion

		this._adventureBookLookup = {};
		[prereleaseIndex, brewIndex, siteIndex, partneredIndex].forEach(index => {
			index.forEach(it => {
				if (it.c === Parser.CAT_ID_ADVENTURE || it.c === Parser.CAT_ID_BOOK) this._adventureBookLookup[it.s.toLowerCase()] = it.c;
			});
		});

		this._initReInCategory();
	}

	static _maxId = null;
	static _addToIndex (d) {
		this._maxId = d.id;
		d.cf = Parser.pageCategoryToFull(d.c);
		if (!this._CATEGORY_COUNTS[d.cf]) this._CATEGORY_COUNTS[d.cf] = 1;
		else this._CATEGORY_COUNTS[d.cf]++;
		this._searchIndex.addDoc(d);
	}

	static _IN_CATEGORY_ALIAS = null;
	static _IN_CATEGORY_ALIAS_SHORT = null;
	static _RE_SYNTAX__IN_CATEGORY = null;

	static _initReInCategory () {
		if (this._RE_SYNTAX__IN_CATEGORY) return;

		const inCategoryAlias = {
			"creature": [Parser.pageCategoryToFull(Parser.CAT_ID_CREATURE)],
			"monster": [Parser.pageCategoryToFull(Parser.CAT_ID_CREATURE)],

			[new Renderer.tag.TagQuickref().tagName]: [Parser.pageCategoryToFull(Parser.CAT_ID_QUICKREF)],
			[new Renderer.tag.TagRace().tagName]: [Parser.pageCategoryToFull(Parser.CAT_ID_RACE)],
			[new Renderer.tag.TagReward().tagName]: [Parser.pageCategoryToFull(Parser.CAT_ID_OTHER_REWARD)],
			[new Renderer.tag.TagOptfeature().tagName]: Parser.CAT_ID_GROUPS["optionalfeature"].map(catId => Parser.pageCategoryToFull(catId)),
			[new Renderer.tag.TagClassFeature().tagName]: [Parser.pageCategoryToFull(Parser.CAT_ID_CLASS_FEATURE)],
			[new Renderer.tag.TagSubclassFeature().tagName]: [Parser.pageCategoryToFull(Parser.CAT_ID_SUBCLASS_FEATURE)],
			[new Renderer.tag.TagVehupgrade().tagName]: Parser.CAT_ID_GROUPS["vehicleUpgrade"].map(catId => Parser.pageCategoryToFull(catId)),
			[new Renderer.tag.TagLegroup().tagName]: [Parser.pageCategoryToFull(Parser.CAT_ID_LEGENDARY_GROUP)],
			[new Renderer.tag.TagCharoption().tagName]: [Parser.pageCategoryToFull(Parser.CAT_ID_CHAR_CREATION_OPTIONS)],
			[new Renderer.tag.TagItemMastery().tagName]: [Parser.pageCategoryToFull(Parser.CAT_ID_ITEM_MASTERY)],
		};

		inCategoryAlias["optionalfeature"] = inCategoryAlias["optfeature"];
		inCategoryAlias["mastery"] = inCategoryAlias["itemMastery"];

		const inCategoryAliasShort = {
			"sp": [Parser.pageCategoryToFull(Parser.CAT_ID_SPELL)],
			"bg": [Parser.pageCategoryToFull(Parser.CAT_ID_BACKGROUND)],
			"itm": [Parser.pageCategoryToFull(Parser.CAT_ID_ITEM)],
			"tbl": [Parser.pageCategoryToFull(Parser.CAT_ID_TABLE)],
			"bk": [Parser.pageCategoryToFull(Parser.CAT_ID_BOOK)],
			"adv": [Parser.pageCategoryToFull(Parser.CAT_ID_ADVENTURE)],
			"ft": [Parser.pageCategoryToFull(Parser.CAT_ID_FEAT)],
			"con": [Parser.pageCategoryToFull(Parser.CAT_ID_CONDITION)],
			"veh": [Parser.pageCategoryToFull(Parser.CAT_ID_VEHICLE)],
			"obj": [Parser.pageCategoryToFull(Parser.CAT_ID_OBJECT)],
			"god": [Parser.pageCategoryToFull(Parser.CAT_ID_DEITY)],
			"rcp": [Parser.pageCategoryToFull(Parser.CAT_ID_RECIPES)], // :^)

			"cf": inCategoryAlias["classFeature"],
			"scf": inCategoryAlias["subclassFeature"],
			"mon": inCategoryAlias["monster"],
			"opf": inCategoryAlias["optfeature"],
		};

		const getLowercaseKeyed = obj => {
			return Object.fromEntries(
				Object.entries(obj)
					.map(([k, v]) => [k.toLowerCase(), v]),
			);
		};

		this._IN_CATEGORY_ALIAS = getLowercaseKeyed(inCategoryAlias);
		this._IN_CATEGORY_ALIAS_SHORT = getLowercaseKeyed(inCategoryAliasShort);

		// Order is important; approx longest first
		const ptCategory = [
			...Object.keys(this._CATEGORY_COUNTS).map(it => it.toLowerCase().escapeRegexp()),
			...Object.keys(this._IN_CATEGORY_ALIAS),
			...Object.keys(this._IN_CATEGORY_ALIAS_SHORT),
		]
			.join("|");

		this._RE_SYNTAX__IN_CATEGORY = new RegExp(`\\bin:(?<category>${ptCategory})s?\\b`, "i");
	}

	/* -------------------------------------------- */

	static handleLinkKeyDown (evt, $ele) {
		Renderer.hover.cleanTempWindows();
		switch (evt.key) {
			case "ArrowLeft": {
				evt.preventDefault();
				if ($(`.has-results-left`).length) {
					const ix = $ele.parent().index() - 1; // offset as the control bar is at position 0
					$(`.omni__paginate-left`).click();
					const $psNext = $(this._dispSearchOutput).find(`.omni__row-result`);
					$($psNext[ix] || $psNext[$psNext.length - 1]).find(`.omni__lnk-name`).focus();
				}
				break;
			}
			case "ArrowUp": {
				evt.preventDefault();
				if ($ele.parent().prev().find(`.omni__lnk-name`).length) {
					$ele.parent().prev().find(`.omni__lnk-name`).focus();
				} else if ($(`.has-results-left`).length) {
					$(`.omni__paginate-left`).click();
					$(this._dispSearchOutput).find(`.omni__lnk-name`).last().focus();
				} else {
					this._iptSearch.focus();
				}
				break;
			}
			case "ArrowRight": {
				evt.preventDefault();
				if ($(`.has-results-right`).length) {
					const ix = $ele.parent().index() - 1; // offset as the control bar is at position 0
					$(`.omni__paginate-right`).click();
					const $psNext = $(this._dispSearchOutput).find(`.omni__row-result`);
					$($psNext[ix] || $psNext[$psNext.length - 1]).find(`.omni__lnk-name`).focus();
				}
				break;
			}
			case "ArrowDown": {
				evt.preventDefault();
				if ($ele.parent().next().find(`.omni__lnk-name`).length) {
					$ele.parent().next().find(`.omni__lnk-name`).focus();
				} else if ($(`.has-results-right`).length) {
					$(`.omni__paginate-right`).click();
					$(this._dispSearchOutput).find(`.omni__lnk-name`).first().focus();
				}
				break;
			}
		}
	}

	static addScrollTopFloat () {
		// "To top" button
		const $btnToTop = $(`<button class="ve-btn ve-btn-sm ve-btn-default" title="To Top"><span class="glyphicon glyphicon-arrow-up"></span></button>`)
			.click(() => MiscUtil.scrollPageTop());

		const $wrpTop = $$`<div class="bk__to-top no-print">
			${$btnToTop}
		</div>`.appendTo(document.body);

		$(window).on("scroll", () => {
			if ($(window).scrollTop() > 50) $wrpTop.addClass("bk__to-top--scrolled");
			else $wrpTop.removeClass("bk__to-top--scrolled");
		});

		return $wrpTop;
	}

	static doShowHelp () {
		this._initReInCategory();

		const {$modalInner} = UiUtil.getShowModal({
			title: "Help",
			isMinHeight0: true,
			isUncappedHeight: true,
			isMaxWidth640p: true,
		});

		const ptCategoriesShort = Object.entries(this._IN_CATEGORY_ALIAS_SHORT)
			.sort(([shortA], [shortB]) => SortUtil.ascSortLower(shortA, shortB))
			.map(([short, longs]) => {
				return `<li class="ve-flex">
					<span class="ve-inline-block min-w-60p ve-text-right"><code>in:${short}</code></span>
					<span class="mx-2">&rarr;</span>
					<span class="ve-flex-wrap">${longs.map(long => `<code>in:${long.toLowerCase()}</code>`).join("/")}</span>
				</li>`;
			})
			.join("");

		$modalInner.append(`
			<p>The following search syntax is available:</p>
			<ul>
				<li><code>source:&lt;abbreviation&gt;</code> where <code>&lt;abbreviation&gt;</code> is an abbreviated source/book name (&quot;PHB&quot;, &quot;MM&quot;, etc.)</li>
				<li><code>page:&lt;number&gt;</code> or <code>page:&lt;rangeStart&gt;-&lt;rangeEnd&gt;</code></li>
				<li>
					<code>in:&lt;category&gt;</code> where <code>&lt;category&gt;</code> can be &quot;spell&quot;, &quot;item&quot;, &quot;bestiary&quot;, etc.
					<br>
					The following short-hand <code>&lt;category&gt;</code> values are available:
				</li>
				<ul>
					${ptCategoriesShort}
				</ul>
			</ul>
		`);
	}
}

window.addEventListener("load", () => Omnisearch.init());

globalThis.Omnisearch = Omnisearch;
