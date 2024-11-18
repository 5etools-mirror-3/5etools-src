"use strict";

class DeitiesSublistManager extends SublistManager {
	static _getRowTemplate () {
		return [
			new SublistCellTemplate({
				name: "Name",
				css: "bold ve-col-4 pl-0",
				colStyle: "",
			}),
			new SublistCellTemplate({
				name: "Pantheon",
				css: "ve-col-2 ve-text-center",
				colStyle: "text-center",
			}),
			new SublistCellTemplate({
				name: "Alignment",
				css: "ve-col-2 ve-text-center",
				colStyle: "text-center",
			}),
			new SublistCellTemplate({
				name: "Domains",
				css: "ve-col-4",
				colStyle: "",
			}),
		];
	}

	pGetSublistItem (it, hash) {
		const alignment = it.alignment ? it.alignment.join("") : "\u2014";
		const domains = it.domains.join(", ");
		const cellsText = [it.name, it.pantheon, alignment, domains];

		const $ele = $(`<div class="lst__row lst__row--sublist ve-flex-col">
			<a href="#${hash}" class="lst__row-border lst__row-inner">
				${this.constructor._getRowCellsHtml({values: cellsText})}
			</a>
		</div>`)
			.contextmenu(evt => this._handleSublistItemContextMenu(evt, listItem))
			.click(evt => this._listSub.doSelect(listItem, evt));

		const listItem = new ListItem(
			hash,
			$ele,
			it.name,
			{
				hash,
				page: it.page,
				pantheon: it.pantheon,
				alignment,
				domains,
			},
			{
				entity: it,
				mdRow: [...cellsText],
			},
		);
		return listItem;
	}
}

class DeitiesPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterDeities();
		super({
			dataSource: DataUtil.deity.loadJSON.bind(DataUtil.deity),

			pageFilter,

			dataProps: ["deity"],

			listSyntax: new ListSyntaxDeities({fnGetDataList: () => this._dataList}),
		});
	}

	getListItem (ent, dtI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(ent, isExcluded);

		const eleLi = document.createElement("div");
		eleLi.className = `lst__row ve-flex-col ${isExcluded ? "lst__row--blocklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(ent.source);
		const hash = UrlUtil.autoEncodeHash(ent);
		const alignment = ent.alignment ? ent.alignment.join("") : "\u2014";
		const domains = ent.domains.join(", ");

		eleLi.innerHTML = `<a href="#${hash}" class="lst__row-border lst__row-inner">
			<span class="bold ve-col-3 pl-0 pr-1">${ent.name}</span>
			<span class="ve-col-2 px-1 ve-text-center">${ent.pantheon}</span>
			<span class="ve-col-2 px-1 ve-text-center">${alignment}</span>
			<span class="ve-col-3 px-1 ${ent.domains[0] === VeCt.STR_NONE ? `italic` : ""}">${domains}</span>
			<span class="ve-col-2 ve-text-center ${Parser.sourceJsonToSourceClassname(ent.source)} pl-1 pr-0" title="${Parser.sourceJsonToFull(ent.source)}" ${Parser.sourceJsonToStyle(ent.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			dtI,
			eleLi,
			ent.name,
			{
				hash,
				source,
				page: ent.page,
				title: ent.title || "",
				pantheon: ent.pantheon,
				alignment,
				domains,
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
		this._$pgContent.empty().append(RenderDeities.$getRenderedDeity(ent));
	}
}

const deitiesPage = new DeitiesPage();
deitiesPage.sublistManager = new DeitiesSublistManager();
window.addEventListener("load", () => deitiesPage.pOnLoad());
