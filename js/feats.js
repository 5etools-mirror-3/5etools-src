import {RenderFeats} from "./render-feats.js";

class FeatsSublistManager extends SublistManager {
	static _getRowTemplate () {
		return [
			new SublistCellTemplate({
				name: "Name",
				css: "ve-bold ve-col-4 ve-pl-0 ve-pr-1",
				colStyle: "",
			}),
			new SublistCellTemplate({
				name: "Category",
				css: "ve-col-2 ve-px-1 ve-text-center",
				colStyle: "",
			}),
			new SublistCellTemplate({
				name: "Ability",
				css: "ve-col-2 ve-px-1",
				colStyle: "",
			}),
			new SublistCellTemplate({
				name: "Prerequisite",
				css: "ve-col-4 ve-pl-1 ve-pr-0",
				colStyle: "",
			}),
		];
	}

	pGetSublistItem (it, hash) {
		const cellsText = [
			it.name,
			new SublistCell({title: it.category ? Parser.featCategoryToFull(it.category) : null, text: it.category || "\u2014"}),
			it._slAbility,
			it._slPrereq,
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
				category: it.category || "Other",
				ability: it._slAbility,
				prerequisite: it._slPrereq,
			},
			{
				entity: it,
				mdRow: [...cellsText],
			},
		);
		return listItem;
	}
}

class FeatsPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterFeats();
		super({
			dataSource: DataUtil.feat.loadJSON.bind(DataUtil.feat),

			pFnGetFluff: Renderer.feat.pGetFluff.bind(Renderer.feat),

			pageFilter,

			dataProps: ["feat"],

			bookViewOptions: {
				nameSingular: "feat",
				namePlural: "feats",
				pageTitle: "Feats Book View",
			},

			isPreviewable: true,
		});
	}

	getListItem (feat, ftI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(feat, isExcluded);

		const eleLi = document.createElement("div");
		eleLi.className = `ve-lst__row ve-flex-col ${isExcluded ? "ve-lst__row--blocklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(feat.source);
		const hash = UrlUtil.autoEncodeHash(feat);

		eleLi.innerHTML = `<a href="#${hash}" class="ve-lst__row-border ve-lst__row-inner">
			<span class="ve-col-0-3 ve-px-0 ve-flex-vh-center ve-lst__btn-toggle-expand ve-self-flex-stretch ve-no-select">[+]</span>
			<span class="ve-bold ve-col-3-2 ve-px-1">${feat.name}</span>
			<span class="ve-col-1-3 ve-px-1 ve-text-center ${feat.category == null ? "ve-italic" : ""}" ${feat.category ? `title="${Parser.featCategoryToFull(feat.category).qq()}"` : ""}>${feat.category || "\u2014"}</span>
			<span class="ve-col-2-5 ve-px-1 ${feat._slAbility === VeCt.STR_NONE ? "ve-italic " : ""}">${feat._slAbility}</span>
			<span class="ve-col-3 ve-px-1 ${feat._slPrereq === VeCt.STR_NONE ? "ve-italic " : ""}">${feat._slPrereq}</span>
			<span class="ve-col-1-7 ve-text-center ${Parser.sourceJsonToSourceClassname(feat.source)} ve-pl-1 ve-pr-0" title="${Parser.sourceJsonToFull(feat.source)}">${source}</span>
		</a>
		<div class="ve-flex ve-hidden ve-relative ve-accordion__wrp-preview">
			<div class="ve-vr-0 ve-absolute ve-accordion__vr-preview"></div>
			<div class="ve-flex-col ve-py-3 ve-ml-4 ve-accordion__wrp-preview-inner"></div>
		</div>`;

		const listItem = new ListItem(
			ftI,
			eleLi,
			feat.name,
			{
				hash,
				source,
				page: feat.page,
				category: feat.category || "Other",
				ability: feat._slAbility,
				prerequisite: feat._slPrereq,
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
		this._pgContent.empty().appends(RenderFeats.getRenderedFeat(ent));
	}
}

const featsPage = new FeatsPage();
featsPage.sublistManager = new FeatsSublistManager();
window.addEventListener("load", () => featsPage.pOnLoad());

globalThis.dbg_page = featsPage;
