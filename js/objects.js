"use strict";

class ObjectsSublistManager extends SublistManager {
	static _getRowTemplate () {
		return [
			new SublistCellTemplate({
				name: "Name",
				css: "bold ve-col-9 pl-0 pr-1",
				colStyle: "",
			}),
			new SublistCellTemplate({
				name: "Size",
				css: "ve-col-3 pl-1 pr-0 ve-text-center",
				colStyle: "text-center",
			}),
		];
	}

	pGetSublistItem (it, hash) {
		const size = Renderer.utils.getRenderedSize(it.size);
		const cellsText = [it.name, size];

		const ele = ee`<div class="lst__row lst__row--sublist ve-flex-col">
			<a href="#${hash}" class="lst__row-border lst__row-inner">
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
				size,
			},
			{
				entity: it,
				mdRow: [...cellsText],
			},
		);
		return listItem;
	}
}

class ObjectsPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterObjects();
		const pFnGetFluff = Renderer.object.pGetFluff.bind(Renderer.object);

		super({
			dataSource: DataUtil.object.loadJSON.bind(DataUtil.object),

			pFnGetFluff,

			pageFilter,

			dataProps: ["object"],

			listSyntax: new ListSyntaxObjects({fnGetDataList: () => this._dataList, pFnGetFluff}),
		});

		this._tokenDisplay = new ListPageTokenDisplay({
			fnHasToken: Renderer.object.hasToken.bind(Renderer.object),
			fnGetTokenUrl: Renderer.object.getTokenUrl.bind(Renderer.object),
		});
	}

	getListItem (obj, obI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(obj, isExcluded);

		const eleLi = document.createElement("div");
		eleLi.className = `lst__row ve-flex-col ${isExcluded ? "lst__row--blocklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(obj.source);
		const hash = UrlUtil.autoEncodeHash(obj);
		const size = Renderer.utils.getRenderedSize(obj.size);

		eleLi.innerHTML = `<a href="#${hash}" class="lst__row-border lst__row-inner">
			<span class="bold ve-col-8 pl-0 pr-1">${obj.name}</span>
			<span class="ve-col-2 px-1 ve-text-center">${size}</span>
			<span class="ve-col-2 ve-text-center ${Parser.sourceJsonToSourceClassname(obj.source)} pl-1 pr-0" title="${Parser.sourceJsonToFull(obj.source)}">${source}</span>
		</a>`;

		const listItem = new ListItem(
			obI,
			eleLi,
			obj.name,
			{
				hash,
				source,
				page: obj.page,
				size,
			},
			{
				isExcluded,
			},
		);

		eleLi.addEventListener("click", (evt) => this._list.doSelect(listItem, evt));
		eleLi.addEventListener("contextmenu", (evt) => this._openContextMenu(evt, this._list, listItem));

		return listItem;
	}

	_tabTitleStats = "Stats";

	_renderStats_doBuildStatsTab ({ent}) {
		const renderStack = [];

		if (ent.entries) this._renderer.recursiveRender({entries: ent.entries}, renderStack, {depth: 2});
		if (ent.actionEntries) this._renderer.recursiveRender({entries: ent.actionEntries}, renderStack, {depth: 2});

		this._pgContent.empty().appends(RenderObjects.getRenderedObject(ent));

		this._tokenDisplay.render(ent);
	}

	_renderStats_onTabChangeStats () {
		this._tokenDisplay.doShow();
	}

	_renderStats_onTabChangeFluff () {
		this._tokenDisplay.doHide();
	}
}

const objectsPage = new ObjectsPage();
objectsPage.sublistManager = new ObjectsSublistManager();
window.addEventListener("load", () => objectsPage.pOnLoad());

globalThis.dbg_page = objectsPage;
