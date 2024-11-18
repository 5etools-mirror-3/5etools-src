"use strict";

class ActionsSublistManager extends SublistManager {
	static _getRowTemplate () {
		return [
			new SublistCellTemplate({
				name: "Name",
				css: "bold ve-col-8 pl-0 pr-1",
				colStyle: "",
			}),
			new SublistCellTemplate({
				name: "Time",
				css: "ve-text-center ve-col-4 pl-1 pr-0",
				colStyle: "text-center",
			}),
		];
	}

	pGetSublistItem (it, hash) {
		const time = it.time ? it.time.map(tm => PageFilterActions.getTimeText(tm)).join("/") : "\u2014";
		const cellsText = [it.name, time];

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

			isPreviewable: true,
		});
	}

	getListItem (it, anI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(it, isExcluded);

		const eleLi = document.createElement("div");
		eleLi.className = `lst__row ve-flex-col ${isExcluded ? "lst__row--blocklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(it.source);
		const hash = UrlUtil.autoEncodeHash(it);
		const time = it.time ? it.time.map(tm => PageFilterActions.getTimeText(tm)).join("/") : "\u2014";

		eleLi.innerHTML = `<a href="#${hash}" class="lst__row-border lst__row-inner">
			<span class="ve-col-0-3 px-0 ve-flex-vh-center lst__btn-toggle-expand ve-self-flex-stretch no-select">[+]</span>
			<span class="ve-col-5-7 px-1 bold">${it.name}</span>
			<span class="ve-col-4 px-1 ve-text-center">${time}</span>
			<span class="ve-col-2 ve-text-center ${Parser.sourceJsonToSourceClassname(it.source)} pl-1 pr-0" title="${Parser.sourceJsonToFull(it.source)}" ${Parser.sourceJsonToStyle(it.source)}>${source}</span>
		</a>
		<div class="ve-flex ve-hidden relative accordion__wrp-preview">
			<div class="vr-0 absolute accordion__vr-preview"></div>
			<div class="ve-flex-col py-3 ml-4 accordion__wrp-preview-inner"></div>
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
		this._$pgContent.empty().append(RenderActions.$getRenderedAction(ent));
	}
}

const actionsPage = new ActionsPage();
actionsPage.sublistManager = new ActionsSublistManager();
window.addEventListener("load", () => actionsPage.pOnLoad());
