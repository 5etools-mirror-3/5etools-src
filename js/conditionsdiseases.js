import {RenderConditionDiseases} from "./render-conditionsdiseases.js";

class ConditionsDiseasesSublistManager extends SublistManager {
	static _getRowTemplate () {
		return [
			new SublistCellTemplate({
				name: "Type",
				css: "ve-col-2 ve-pl-0 ve-pr-1 ve-text-center",
				colStyle: "ve-text-center",
			}),
			new SublistCellTemplate({
				name: "Name",
				css: "ve-bold ve-col-10 ve-pl-1 ve-pr-0",
				colStyle: "",
			}),
		];
	}

	pGetSublistItem (it, hash) {
		const cellsText = [it.type || PageFilterConditionsDiseases.getDisplayProp(it.__prop), it.name];

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

			bookViewOptions: {
				nameSingular: "condition/disease",
				namePlural: "conditions/diseases",
				pageTitle: "Conditions and Diseases Book View",
			},

			isPreviewable: true,
		});
	}

	getListItem (it, cdI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(it, isExcluded);

		const eleLi = document.createElement("div");
		eleLi.className = `ve-lst__row ve-flex-col ${isExcluded ? "ve-lst__row--blocklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(it.source);
		const hash = UrlUtil.autoEncodeHash(it);

		eleLi.innerHTML = `<a href="#${hash}" class="ve-lst__row-border ve-lst__row-inner">
			<span class="ve-col-0-3 ve-px-0 ve-flex-vh-center ve-lst__btn-toggle-expand ve-self-flex-stretch ve-no-select">[+]</span>
			<span class="ve-col-3 ve-px-1 ve-text-center">${it.type || PageFilterConditionsDiseases.getDisplayProp(it.__prop)}</span>
			<span class="ve-bold ve-col-6-7 ve-px-1">${it.name}</span>
			<span class="ve-col-2 ve-text-center ${Parser.sourceJsonToSourceClassname(it.source)} ve-pr-0" title="${Parser.sourceJsonToFull(it.source)}">${source}</span>
		</a>
		<div class="ve-flex ve-hidden ve-relative ve-accordion__wrp-preview">
			<div class="ve-vr-0 ve-absolute ve-accordion__vr-preview"></div>
			<div class="ve-flex-col ve-py-3 ve-ml-4 ve-accordion__wrp-preview-inner"></div>
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
		this._pgContent.empty().appends(RenderConditionDiseases.getRenderedConditionDisease(ent));
	}
}

const conditionsDiseasesPage = new ConditionsDiseasesPage();
conditionsDiseasesPage.sublistManager = new ConditionsDiseasesSublistManager();
window.addEventListener("load", () => conditionsDiseasesPage.pOnLoad());

globalThis.dbg_page = conditionsDiseasesPage;
