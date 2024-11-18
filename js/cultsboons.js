"use strict";

class CultsBoonsSublistManager extends SublistManager {
	static _getRowTemplate () {
		return [
			new SublistCellTemplate({
				name: "Type",
				css: "ve-col-2 ve-text-center pl-0 pr-1",
				colStyle: "text-center",
			}),
			new SublistCellTemplate({
				name: "Subtype",
				css: "ve-col-2 px-1 ve-text-center",
				colStyle: "text-center",
			}),
			new SublistCellTemplate({
				name: "Name",
				css: "bold ve-col-8 pl-1 pr-0",
				colStyle: "",
			}),
		];
	}

	pGetSublistItem (it, hash) {
		const cellsText = [it._lType, it._lSubType, it.name];

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
				type: it._lType,
				subType: it._lSubType,
			},
			{
				entity: it,
				mdRow: [...cellsText],
			},
		);
		return listItem;
	}
}

class CultsBoonsPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterCultsBoons();
		super({
			dataSource: "data/cultsboons.json",

			pageFilter,

			dataProps: ["cult", "boon"],
		});
	}

	getListItem (it, bcI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(it, isExcluded);

		it._lType = it.__prop === "cult" ? "Cult" : "Boon";
		it._lSubType = it.type || "\u2014";

		const eleLi = document.createElement("div");
		eleLi.className = `lst__row ve-flex-col ${isExcluded ? "lst__row--blocklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(it.source);
		const hash = UrlUtil.autoEncodeHash(it);

		eleLi.innerHTML = `<a href="#${hash}" class="lst__row-border lst__row-inner">
			<span class="ve-col-2 ve-text-center pl-0">${it._lType}</span>
			<span class="ve-col-2 px-1 ve-text-center">${it._lSubType}</span>
			<span class="bold ve-col-6 px-1">${it.name}</span>
			<span class="ve-col-2 ve-text-center ${Parser.sourceJsonToSourceClassname(it.source)} pl-1 pr-0" title="${Parser.sourceJsonToFull(it.source)}" ${Parser.sourceJsonToStyle(it.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			bcI,
			eleLi,
			it.name,
			{
				hash,
				source,
				page: it.page,
				type: it._lType,
				subType: it._lSubType,
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
		this._$pgContent.empty().append(RenderCultsBoons.$getRenderedCultBoon(ent));
	}
}

const cultsBoonsPage = new CultsBoonsPage();
cultsBoonsPage.sublistManager = new CultsBoonsSublistManager();
window.addEventListener("load", () => cultsBoonsPage.pOnLoad());
