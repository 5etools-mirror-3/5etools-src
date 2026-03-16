"use strict";

class TrapsHazardsSublistManager extends SublistManager {
	static _getRowTemplate () {
		return [
			new SublistCellTemplate({
				name: "Type",
				css: "ve-col-4 ve-text-center ve-pl-0 ve-pr-1",
				colStyle: "ve-text-center",
			}),
			new SublistCellTemplate({
				name: "Name",
				css: "ve-bold ve-col-8 ve-pl-1 ve-pr-0",
				colStyle: "",
			}),
		];
	}

	pGetSublistItem (it, hash) {
		const trapType = Parser.trapHazTypeToFull(it.trapHazType);
		const cellsText = [trapType, it.name];

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
				trapType,
			},
			{
				entity: it,
				mdRow: [...cellsText],
			},
		);
		return listItem;
	}
}

class TrapsHazardsPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterTrapsHazards();

		super({
			dataSource: "data/trapshazards.json",

			pFnGetFluff: Renderer.traphazard.pGetFluff.bind(Renderer.traphazard),

			pageFilter,

			dataProps: ["trap", "hazard"],

			bookViewOptions: {
				nameSingular: "trap/hazard",
				namePlural: "traps/hazards",
				pageTitle: "Traps and Hazards Book View",
			},

			listSyntax: new ListSyntaxTrapsHazards({fnGetDataList: () => this._dataList}),
		});
	}

	getListItem (it, thI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(it, isExcluded);

		const eleLi = document.createElement("div");
		eleLi.className = `ve-lst__row ve-flex-col ${isExcluded ? "ve-lst__row--blocklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(it.source);
		const hash = UrlUtil.autoEncodeHash(it);
		const trapType = Parser.trapHazTypeToFull(it.trapHazType);

		eleLi.innerHTML = `<a href="#${hash}" class="ve-lst__row-border ve-lst__row-inner">
			<span class="ve-col-3 ve-pl-0 ve-pr-1 ve-text-center">${trapType}</span>
			<span class="ve-bold ve-col-7 ve-px-1">${it.name}</span>
			<span class="ve-col-2 ve-text-center ${Parser.sourceJsonToSourceClassname(it.source)} ve-pl-1 ve-pr-0" title="${Parser.sourceJsonToFull(it.source)}">${source}</span>
		</a>`;

		const listItem = new ListItem(
			thI,
			eleLi,
			it.name,
			{
				hash,
				source,
				page: it.page,
				trapType,
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
		this._pgContent.empty().appends(RenderTrapsHazards.getRenderedTrapHazard(ent));
	}
}

const trapsHazardsPage = new TrapsHazardsPage();
trapsHazardsPage.sublistManager = new TrapsHazardsSublistManager();
window.addEventListener("load", () => trapsHazardsPage.pOnLoad());

globalThis.dbg_page = trapsHazardsPage;
