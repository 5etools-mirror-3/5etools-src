"use strict";

class TablesSublistManager extends SublistManager {
	constructor () {
		super({
			sublistListOptions: {
				sortByInitial: "sortName",
				fnSort: PageFilterTables.sortTables,
			},
		});
	}

	static _getRowTemplate () {
		return [
			new SublistCellTemplate({
				name: "Name",
				css: "ve-bold ve-col-12 ve-px-0",
				colStyle: "",
			}),
		];
	}

	pGetSublistItem (it, hash) {
		const cellsText = [it.name];

		const ele = ee`<div class="ve-lst__row ve-lst__row--sublist ve-flex-col">
			<a href="#${hash}" class="ve-lst__row-border ve-lst__row-inner" title="${it.name}">
				${this.constructor._getRowCellsHtml({values: cellsText})}
			</a>
		</div>`
			.onn("contextmenu", evt => this._handleSublistItemContextMenu(evt, listItem))
			.onn("click", evt => this._listSub.doSelect(listItem, evt));

		const listItem = new ListItem(
			hash,
			ele,
			it.name,
			{
				hash,
				page: it.page,
				sortName: PageFilterTables.getSortName(it.name),
			},
			{
				entity: it,
				mdRow: [...cellsText],
			},
		);
		return listItem;
	}
}

class TablesPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterTables();
		super({
			dataSource: DataUtil.table.loadJSON.bind(DataUtil.table),

			pageFilter,

			listOptions: {
				sortByInitial: "sortName",
				fnSort: PageFilterTables.sortTables,
			},

			dataProps: ["table", "tableGroup"],

			bookViewOptions: {
				nameSingular: "table",
				namePlural: "tables",
				pageTitle: "Tables Book View",
			},

			isPreviewable: true,

			listSyntax: new ListSyntaxTables({fnGetDataList: () => this._dataList}),
		});
	}

	get _bindOtherButtonsOptions () {
		return {
			other: [
				{
					name: "Copy as CSV",
					pFn: () => this._pCopyRenderedAsCsv(),
				},
			],
		};
	}

	async _pCopyRenderedAsCsv () {
		const ent = this._dataList[Hist.lastLoadedId];

		const tbls = ent.tables || [ent];
		const txt = tbls
			.map(tbl => {
				const parser = new DOMParser();
				const rows = tbl.rows.map(row => row.map(cell => parser.parseFromString(`<div>${Renderer.get().render(cell)}</div>`, "text/html").documentElement.textContent));

				const headerRowMetas = Renderer.table.getHeaderRowMetas(tbl) || [];
				const [headerRowMetasAsHeaders, ...headerRowMetasAsRows] = headerRowMetas
					.map(headerRowMeta => headerRowMeta.map(entCellHeader => {
						if (entCellHeader.type === "cellHeader") return Renderer.stripTags(entCellHeader.entry);
						return Renderer.stripTags(entCellHeader);
					}));

				return DataUtil.getCsv(
					headerRowMetasAsHeaders,
					[
						// If there are extra headers, treat them as rows
						...headerRowMetasAsRows,
						...rows,
					],
				);
			})
			.join("\n\n");

		await MiscUtil.pCopyTextToClipboard(txt);
		JqueryUtil.doToast("Copied!");
	}

	getListItem (it, tbI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(it, isExcluded);

		const eleLi = document.createElement("div");
		eleLi.className = `ve-lst__row ve-flex-col ${isExcluded ? "ve-lst__row--blocklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(it.source);
		const hash = UrlUtil.autoEncodeHash(it);

		eleLi.innerHTML = `<a href="#${hash}" class="ve-lst__row-border ve-lst__row-inner">
			<span class="ve-col-0-5 ve-px-0 ve-flex-vh-center ve-lst__btn-toggle-expand ve-self-flex-stretch ve-no-select">[+]</span>
			<span class="ve-bold ve-col-9-5 ve-px-1">${it.name}</span>
			<span class="ve-col-2 ve-text-center ${Parser.sourceJsonToSourceClassname(it.source)} ve-pl-1 ve-pr-0" title="${Parser.sourceJsonToFull(it.source)}">${source}</span>
		</a>
		<div class="ve-flex ve-hidden ve-relative ve-accordion__wrp-preview">
			<div class="ve-vr-0 ve-absolute ve-accordion__vr-preview"></div>
			<div class="ve-flex-col ve-py-3 ve-ml-4 ve-accordion__wrp-preview-inner"></div>
		</div>`;

		const listItem = new ListItem(
			tbI,
			eleLi,
			it.name,
			{
				hash,
				source,
				page: it.page,
				sortName: PageFilterTables.getSortName(it.name),
			},
			{
				isExcluded,
			},
		);

		eleLi.addEventListener("click", (evt) => this._list.doSelect(listItem, evt));
		eleLi.addEventListener("contextmenu", (evt) => this._openContextMenu(evt, this._list, listItem));

		return listItem;
	}

	_renderStats_doBuildStatsTab ({ent}) {
		this._pgContent.empty().appends(RenderTables.getRenderedTable(ent));
	}
}

const tablesPage = new TablesPage();
tablesPage.sublistManager = new TablesSublistManager();
window.addEventListener("load", () => tablesPage.pOnLoad());

globalThis.dbg_page = tablesPage;
