import {RenderConditionDiseases} from "./render-conditionsdiseases.js";

class ConditionsDiseasesSublistManager extends SublistManager {
	static _getRowTemplate () {
		return [
			new SublistCellTemplate({
				name: "Type",
				css: "ve-col-2 pl-0 pr-1 ve-text-center",
				colStyle: "text-center",
			}),
			new SublistCellTemplate({
				name: "Name",
				css: "bold ve-col-10 pl-1 pr-0",
				colStyle: "",
			}),
		];
	}

	pGetSublistItem (it, hash) {
		const cellsText = [it.type || PageFilterConditionsDiseases.getDisplayProp(it.__prop), it.name];

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
				type: it.type || it.__prop,
			},
			{
				entity: it,
				mdRow: [...cellsText],
			},
		);
		return listItem;
	}
}

class ConditionsDiseasesPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterConditionsDiseases();

		super({
			dataSource: "data/conditionsdiseases.json",

			pFnGetFluff: Renderer.conditionDisease.pGetFluff.bind(Renderer.conditionDisease),

			pageFilter,

			dataProps: ["condition", "disease", "status"],

			isPreviewable: true,
		});
	}

	getListItem (it, cdI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(it, isExcluded);

		const eleLi = document.createElement("div");
		eleLi.className = `lst__row ve-flex-col ${isExcluded ? "lst__row--blocklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(it.source);
		const hash = UrlUtil.autoEncodeHash(it);

		eleLi.innerHTML = `<a href="#${hash}" class="lst__row-border lst__row-inner">
			<span class="ve-col-0-3 px-0 ve-flex-vh-center lst__btn-toggle-expand ve-self-flex-stretch no-select">[+]</span>
			<span class="ve-col-3 px-1 ve-text-center">${it.type || PageFilterConditionsDiseases.getDisplayProp(it.__prop)}</span>
			<span class="bold ve-col-6-7 px-1">${it.name}</span>
			<span class="ve-col-2 ve-text-center ${Parser.sourceJsonToSourceClassname(it.source)} pr-0" title="${Parser.sourceJsonToFull(it.source)}" ${Parser.sourceJsonToStyle(it.source)}>${source}</span>
		</a>
		<div class="ve-flex ve-hidden relative accordion__wrp-preview">
			<div class="vr-0 absolute accordion__vr-preview"></div>
			<div class="ve-flex-col py-3 ml-4 accordion__wrp-preview-inner"></div>
		</div>`;

		const listItem = new ListItem(
			cdI,
			eleLi,
			it.name,
			{
				hash,
				source,
				page: it.page,
				type: it.type || it.__prop,
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
		this._$pgContent.empty().append(RenderConditionDiseases.$getRenderedConditionDisease(ent));
	}
}

const conditionsDiseasesPage = new ConditionsDiseasesPage();
conditionsDiseasesPage.sublistManager = new ConditionsDiseasesSublistManager();
window.addEventListener("load", () => conditionsDiseasesPage.pOnLoad());
