import {BookUtil} from "./bookutils.js";

export class AdventuresBooksList {
	static _getDateStr (advBook) {
		if (!advBook.published) return "\u2014";
		const date = new Date(advBook.published);
		return DatetimeUtil.getDateStr({date, isShort: true, isPad: true});
	}

	static _getGroupHtml (advBook) {
		const group = advBook.group || "other";
		const entry = SourceUtil.ADV_BOOK_GROUPS.find(it => it.group === group);
		return [
			entry.displayName,
			Parser.sourceJsonToMarkerHtml(advBook.source, {isList: true, isAddBrackets: true}),
		]
			.filter(Boolean)
			.join("");
	}

	static _sortAdventuresBooks (dataList, a, b, o) {
		a = dataList[a.ix];
		b = dataList[b.ix];

		if (o.sortBy === "name") return this._sortAdventuresBooks_byName(a, b, o);
		if (o.sortBy === "storyline") return this._sortAdventuresBooks_orFallback(SortUtil.ascSort, "storyline", a, b, o);
		if (o.sortBy === "level") return this._sortAdventuresBooks_orFallback(SortUtil.ascSort, "_startLevel", a, b, o);
		if (o.sortBy === "group") return SortUtil.ascSortSourceGroup(a, b) || this._sortAdventuresBooks_byPublished(a, b, o);
		if (o.sortBy === "published") return this._sortAdventuresBooks_byPublished(a, b, o);
	}

	static _sortAdventuresBooks_byPublished (a, b, o) {
		return SortUtil.ascSortDate(b._pubDate, a._pubDate)
			|| SortUtil.ascSort(a.publishedOrder || 0, b.publishedOrder || 0)
			|| this._sortAdventuresBooks_byName(a, b, o);
	}

	static _sortAdventuresBooks_byName (a, b, o) { return SortUtil.ascSort(a.name, b.name); }

	static _sortAdventuresBooks_orFallback (func, prop, a, b, o) {
		const initial = func(a[prop] || "", b[prop] || "");
		return initial || this._sortAdventuresBooks_byName(a, b, o);
	}

	constructor (options) {
		this._contentsUrl = options.contentsUrl;
		this._fnSort = options.fnSort;
		this._sortByInitial = options.sortByInitial;
		this._sortDirInitial = options.sortDirInitial;
		this._dataProp = options.dataProp;
		this._enhanceRowDataFn = options.enhanceRowDataFn;
		this._rootPage = options.rootPage;
		this._rowBuilderFn = options.rowBuilderFn;

		this._list = null;
		this._listAlt = null;
		this._dataIx = 0;
		this._dataList = [];
	}

	async pOnPageLoad ({handleBrew}) {
		await Promise.all([
			PrereleaseUtil.pInit(),
			BrewUtil2.pInit(),
		]);

		const [data] = await Promise.all([
			await DataUtil.loadJSON(`${Renderer.get().baseUrl}${this._contentsUrl}`),
			await ExcludeUtil.pInitialise(),
		]);

		const iptSearch = es(`#search`);

		const fnSort = (a, b, o) => this._fnSort(this._dataList, a, b, o);
		this._list = new List({
			wrpList: es(".books"),
			iptSearch,
			fnSort,
			sortByInitial: this._sortByInitial,
			sortDirInitial: this._sortDirInitial,
		});
		SortUtil.initBtnSortHandlers(es(`#filtertools`), this._list);

		const wrpBookshelf = es(".books--alt");
		this._listAlt = new List({
			wrpList: wrpBookshelf,
			iptSearch,
			fnSort,
			sortByInitial: this._sortByInitial,
			sortDirInitial: this._sortDirInitial,
		});

		es("#reset").onn("click", () => {
			this._list.reset();
			this._listAlt.reset();
			iptSearch.val("");

			this._list.items.forEach(li => {
				if (li.data.btnToggleExpand.txt() === "[\u2212]") li.data.btnToggleExpand.trigger("click");
			});
		});

		this.addData(data);
		await handleBrew(await PrereleaseUtil.pGetBrewProcessed());
		await handleBrew(await BrewUtil2.pGetBrewProcessed());
		// TODO(MODULES) refactor
		import("./utils-brew/utils-brew-ui-manage.js")
			.then(({ManageBrewUi}) => {
				ManageBrewUi.bindBtngroupManager(e_({id: "btngroup-manager"}));
			});
		this._list.init();
		this._listAlt.init();

		if (ExcludeUtil.isAllContentExcluded(this._dataList)) wrpBookshelf.appends(ExcludeUtil.getAllContentBlocklistedHtml());

		window.dispatchEvent(new Event("toolsLoaded"));
	}

	addData (data) {
		if (!data[this._dataProp] || !data[this._dataProp].length) return;

		this._dataList.push(...data[this._dataProp]);

		for (; this._dataIx < this._dataList.length; this._dataIx++) {
			const it = this._dataList[this._dataIx];
			if (this._enhanceRowDataFn) this._enhanceRowDataFn(it);

			const isExcluded = ExcludeUtil.isExcluded(UrlUtil.URL_TO_HASH_BUILDER[this._rootPage](it), this._dataProp, it.source);

			const elesContents = [];
			it.contents.map((chapter, ixChapter) => {
				const lnkChapter = ee`<a href="${this._rootPage}#${UrlUtil.encodeForHash(it.id)},${ixChapter}" class="ve-flex w-100 bklist__row-chapter lst__row-border lst__row-inner lst__row lst__wrp-cells bold">
					${Parser.bookOrdinalToAbv(chapter.ordinal)}${chapter.name}
				</a>`;
				elesContents.push(lnkChapter);

				if (!chapter.headers) return;

				const headerCounts = {};

				chapter.headers.forEach(header => {
					const headerText = BookUtil.getHeaderText(header);

					const headerTextClean = headerText.toLowerCase().trim();
					const headerPos = headerCounts[headerTextClean] || 0;
					headerCounts[headerTextClean] = (headerCounts[headerTextClean] || 0) + 1;
					const lnk = ee`<a href="${this._rootPage}#${UrlUtil.encodeForHash(it.id)},${ixChapter},${UrlUtil.encodeForHash(headerText)}${header.index ? `,${header.index}` : ""}${headerPos > 0 ? `,${headerPos}` : ""}" class="lst__row lst__row-border lst__row-inner lst__wrp-cells bklist__row-section ve-flex w-100">
						${BookUtil._getContentsSectionHeader(header)}
					</a>`;
					elesContents.push(lnk);
				});
			});

			const wrpContents = ee`<div class="ve-flex w-100 relative">
				<div class="vr-0 absolute bklist__vr-contents"></div>
				<div class="ve-flex-col w-100 bklist__wrp-rows-inner">${elesContents}</div>
			</div>`.hideVe();

			const btnToggleExpand = ee`<span class="px-2 py-1p bold mobile-sm__hidden no-select">[+]</span>`
				.onn("click", evt => {
					evt.stopPropagation();
					evt.preventDefault();
					btnToggleExpand.txt(btnToggleExpand.txt() === "[+]" ? "[\u2212]" : "[+]");
					wrpContents.toggleVe();
				});

			const eleLi = ee`<div class="ve-flex-col w-100">
				<a href="${this._rootPage}#${UrlUtil.encodeForHash(it.id)}" class="split-v-center lst__row-border lst__row-inner lst__row ${isExcluded ? `lst__row--blocklisted` : ""}">
					<span class="w-100 ve-flex">${this._rowBuilderFn(it)}</span>
					${btnToggleExpand}
				</a>
				${wrpContents}
			</div>`;

			const listItemValues = {
				source: Parser.sourceJsonToAbv(it.source),
				alias: (it.alias || []).map(it => `"${it}"`).join(","),
				storyline: it.storyline || "",
			};

			const listItem = new ListItem(
				this._dataIx,
				eleLi,
				it.name,
				listItemValues,
				{
					btnToggleExpand,
				},
			);

			this._list.addItem(listItem);

			const isLegacySource = SourceUtil.isLegacySourceWotc(it.source);

			// region Alt list (covers/thumbnails)
			const eleLiAlt = ee`<a href="${this._rootPage}#${UrlUtil.encodeForHash(it.id)}" class="ve-flex-col ve-flex-v-center m-3 bks__wrp-bookshelf-item ${isExcluded ? `bks__wrp-bookshelf-item--blocklisted` : ""} ${isLegacySource ? `bks__wrp-bookshelf-item--legacy` : ""} py-3 px-2 ${Parser.sourceJsonToSourceClassname(it.source)}" ${isLegacySource ? `title="(Legacy Source)"` : ""}>
				<img src="${Renderer.adventureBook.getCoverUrl(it)}" class="mb-2 bks__bookshelf-image" loading="lazy" alt="Cover Image: ${(it.name || "").qq()}">
				<div class="bks__bookshelf-item-name ve-flex-vh-center ve-text-center">${it.name}</div>
			</a>`;
			const listItemAlt = new ListItem(
				this._dataIx,
				eleLiAlt,
				it.name,
				listItemValues,
			);
			this._listAlt.addItem(listItemAlt);
			// endregion
		}

		this._list.update();
		this._listAlt.update();
	}
}
