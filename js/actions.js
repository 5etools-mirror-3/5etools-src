"use strict";

class ActionsSublistManager extends SublistManager {
	static _getRowTemplate () {
		return [
			new SublistCellTemplate({
				name: "Name",
				css: "ve-bold ve-col-8 ve-pl-0 ve-pr-1",
				colStyle: "",
			}),
			new SublistCellTemplate({
				name: "Time",
				css: "ve-text-center ve-col-4 ve-pl-1 ve-pr-0",
				colStyle: "ve-text-center",
			}),
		];
	}

	pGetSublistItem (it, hash) {
		const time = it.time ? it.time.map(tm => PageFilterActions.getTimeText(tm)).join("/") : "\u2014";
		const cellsText = [it.name, time];

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
				time,
			},
			{
				entity: it,
				mdRow: [...cellsText],
			},
		);
		return listItem;
	}
}

class ActionsPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterActions();
		super({
			dataSource: DataUtil.action.loadJSON.bind(DataUtil.action),

			pageFilter,

			dataProps: ["action"],

			bookViewOptions: {
				nameSingular: "action",
				namePlural: "actions",
				pageTitle: "Actions Book View",
			},

			isPreviewable: true,
		});
	}

	getListItem (it, anI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(it, isExcluded);

		const eleLi = document.createElement("div");
		eleLi.className = `ve-lst__row ve-flex-col ${isExcluded ? "ve-lst__row--blocklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(it.source);
		const hash = UrlUtil.autoEncodeHash(it);
		const time = it.time ? it.time.map(tm => PageFilterActions.getTimeText(tm)).join("/") : "\u2014";

		eleLi.innerHTML = `<a href="#${hash}" class="ve-lst__row-border ve-lst__row-inner">
			<span class="ve-col-0-3 ve-px-0 ve-flex-vh-center ve-lst__btn-toggle-expand ve-self-flex-stretch ve-no-select">[+]</span>
			<span class="ve-col-5-7 ve-px-1 ve-bold">${it.name}</span>
			<span class="ve-col-4 ve-px-1 ve-text-center">${time}</span>
			<span class="ve-col-2 ve-text-center ${Parser.sourceJsonToSourceClassname(it.source)} ve-pl-1 ve-pr-0" title="${Parser.sourceJsonToFull(it.source)}">${source}</span>
		</a>
		<div class="ve-flex ve-hidden ve-relative ve-accordion__wrp-preview">
			<div class="ve-vr-0 ve-absolute ve-accordion__vr-preview"></div>
			<div class="ve-flex-col ve-py-3 ve-ml-4 ve-accordion__wrp-preview-inner"></div>
		</div>`;

		const listItem = new ListItem(
			anI,
			eleLi,
			it.name,
			{
				hash,
				source,
				page: it.page,
				time,
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
		this._pgContent.empty().appends(RenderActions.getRenderedAction(ent));
	}
}

const actionsPage = new ActionsPage();
actionsPage.sublistManager = new ActionsSublistManager();
window.addEventListener("load", () => actionsPage.pOnLoad());

globalThis.dbg_page = actionsPage;
