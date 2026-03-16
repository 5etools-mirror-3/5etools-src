"use strict";

class CharCreationOptionsSublistManager extends SublistManager {
	static _getRowTemplate () {
		return [
			new SublistCellTemplate({
				name: "Type",
				css: "ve-col-5 ve-text-center ve-pl-0 ve-pr-1",
				colStyle: "ve-text-center",
			}),
			new SublistCellTemplate({
				name: "Name",
				css: "ve-bold ve-col-7 ve-pl-1 ve-pr-0",
				colStyle: "",
			}),
		];
	}

	pGetSublistItem (it, hash) {
		const cellsText = [it.name, it._fOptionType];

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
				source: Parser.sourceJsonToAbv(it.source),
				page: it.page,
				type: it._fOptionType,
			},
			{
				entity: it,
				mdRow: [...cellsText],
			},
		);
		return listItem;
	}
}

class CharCreationOptionsPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterCharCreationOptions();
		super({
			dataSource: DataUtil.charoption.loadJSON.bind(DataUtil.charoption),

			pFnGetFluff: Renderer.charoption.pGetFluff.bind(Renderer.charoption),

			pageFilter,

			dataProps: ["charoption"],

			bookViewOptions: {
				nameSingular: "character creation option",
				namePlural: "character creation options",
				pageTitle: "Character Creation Options Book View",
			},
		});
	}

	getListItem (it, itI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(it, isExcluded);

		const eleLi = document.createElement("div");
		eleLi.className = `ve-lst__row ve-flex-col ${isExcluded ? "ve-lst__row--blocklisted" : ""}`;

		const hash = UrlUtil.autoEncodeHash(it);
		const source = Parser.sourceJsonToAbv(it.source);

		eleLi.innerHTML = `<a href="#${hash}" class="ve-lst__row-border ve-lst__row-inner">
			<span class="ve-col-5 ve-text-center ve-pl-0 ve-pr-1">${it._fOptionType}</span>
			<span class="ve-bold ve-col-5 ve-px-1">${it.name}</span>
			<span class="ve-col-2 ve-text-center ${Parser.sourceJsonToSourceClassname(it.source)}" title="${Parser.sourceJsonToFull(it.source)} ve-pl-1 ve-pr-0">${source}</span>
		</a>`;

		const listItem = new ListItem(
			itI,
			eleLi,
			it.name,
			{
				hash,
				source,
				page: it.page,
				type: it._fOptionType,
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
		this._pgContent.empty().appends(RenderCharCreationOptions.getRenderedCharCreationOption(ent));
	}
}

const charCreationOptionsPage = new CharCreationOptionsPage();
charCreationOptionsPage.sublistManager = new CharCreationOptionsSublistManager();
window.addEventListener("load", () => charCreationOptionsPage.pOnLoad());

globalThis.dbg_page = charCreationOptionsPage;
