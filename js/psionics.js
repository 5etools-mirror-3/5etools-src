"use strict";

class PsionicsSublistManager extends SublistManager {
	static _getRowTemplate () {
		return [
			new SublistCellTemplate({
				name: "Name",
				css: "ve-bold ve-col-6 ve-pl-0 ve-pr-1",
				colStyle: "",
			}),
			new SublistCellTemplate({
				name: "Type",
				css: "ve-col-3 ve-px-1 ve-text-center",
				colStyle: "ve-text-center",
			}),
			new SublistCellTemplate({
				name: "Order",
				css: "ve-col-3 ve-text-center ve-pl-1 ve-pr-0",
				colStyle: "ve-text-center",
			}),
		];
	}

	pGetSublistItem (it, hash) {
		const typeMeta = Parser.psiTypeToMeta(it.type);
		const cellsText = [
			it.name,
			new SublistCell({
				text: typeMeta.short,
				title: typeMeta.full,
				css: Parser.psiTypeAbvToStyleClass(it.type),
				style: Parser.psiTypeAbvToStylePart(it.type),
			}),
			it._fOrder,
		];

		const ele = ee`<div class="ve-lst__row ve-lst__row--sublist ve-flex-col">
			<a href="#${hash}" class="ve-lst__row-border ve-lst__row-inner">
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
				type: typeMeta.full,
				order: it._fOrder,
			},
			{
				entity: it,
				mdRow: [...cellsText],
			},
		);
		return listItem;
	}
}

class PsionicsPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterPsionics();
		super({
			dataSource: "data/psionics.json",

			pageFilter,

			dataProps: ["psionic"],

			bookViewOptions: {
				nameSingular: "psionic",
				namePlural: "psionics",
				pageTitle: "Psionics Book View",
				fnPartition: ent => ent.type === "T" ? 0 : 1,
			},

			tableViewOptions: {
				title: "Psionics",
				colTransforms: {
					name: UtilsTableview.COL_TRANSFORM_NAME,
					source: UtilsTableview.COL_TRANSFORM_SOURCE,
					page: UtilsTableview.COL_TRANSFORM_PAGE,
					_text: {name: "Text", transform: (it) => Renderer.psionic.getBodyHtml(it), flex: 3},
				},
			},

			listSyntax: new ListSyntaxPsionics({fnGetDataList: () => this._dataList}),
		});
	}

	static _getHiddenModeList (psionic) {
		return (psionic.modes || [])
			.map(mode => {
				return [
					`"${mode.name}"`,
					...(mode.submodes || [])
						.map(subMode => `"${subMode.name}"`),
				];
			})
			.flat()
			.join(",");
	}

	getListItem (p, psI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(p, isExcluded);

		const eleLi = document.createElement("div");
		eleLi.className = `ve-lst__row ve-flex-col ${isExcluded ? "ve-lst__row--blocklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(p.source);
		const hash = UrlUtil.autoEncodeHash(p);
		const typeMeta = Parser.psiTypeToMeta(p.type);
		const typeClassName = Parser.psiTypeAbvToStyleClass(p.type);

		eleLi.innerHTML = `<a href="#${hash}" class="ve-lst__row-border ve-lst__row-inner">
			<span class="ve-bold ve-col-6 ve-pl-0 ve-pr-1">${p.name}</span>
			<span class="ve-col-2 ve-px-1 ${typeClassName} ve-text-center" ${Parser.psiTypeAbvToStyle(p.type)} title="${typeMeta.full}">${typeMeta.short}</span>
			<span class="ve-col-2 ve-px-1 ve-text-center ${p._fOrder === VeCt.STR_NONE ? "ve-italic" : ""}">${p._fOrder}</span>
			<span class="ve-col-2 ve-text-center ${Parser.sourceJsonToSourceClassname(p.source)} ve-pl-1 ve-pr-0" title="${Parser.sourceJsonToFull(p.source)}">${source}</span>
		</a>`;

		const listItem = new ListItem(
			psI,
			eleLi,
			p.name,
			{
				hash,
				source,
				page: p.page,
				type: typeMeta.full,
				order: p._fOrder,
				searchModeList: this.constructor._getHiddenModeList(p),
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
		this._pgContent.empty().appends(RenderPsionics.getRenderedPsionic(ent));
	}
}

const psionicsPage = new PsionicsPage();
psionicsPage.sublistManager = new PsionicsSublistManager();
window.addEventListener("load", () => psionicsPage.pOnLoad());

globalThis.dbg_page = psionicsPage;
