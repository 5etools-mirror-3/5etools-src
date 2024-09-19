import {RenderFeats} from "./render-feats.js";

class FeatsSublistManager extends SublistManager {
	static _getRowTemplate () {
		return [
			new SublistCellTemplate({
				name: "Name",
				css: "bold ve-col-4 pl-0 pr-1",
				colStyle: "",
			}),
			new SublistCellTemplate({
				name: "Ability",
				css: "ve-col-4 px-1",
				colStyle: "",
			}),
			new SublistCellTemplate({
				name: "Prerequisite",
				css: "ve-col-4 pl-1 pr-0",
				colStyle: "",
			}),
		];
	}

	pGetSublistItem (it, hash) {
		const cellsText = [it.name, it._slAbility, it._slPrereq];

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
				namePlural: "feats",
				pageTitle: "Feats Book View",
			},

			isPreviewable: true,
		});
	}

	getListItem (feat, ftI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(feat, isExcluded);

		const eleLi = document.createElement("div");
		eleLi.className = `lst__row ve-flex-col ${isExcluded ? "lst__row--blocklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(feat.source);
		const hash = UrlUtil.autoEncodeHash(feat);

		eleLi.innerHTML = `<a href="#${hash}" class="lst__row-border lst__row-inner">
			<span class="ve-col-0-3 px-0 ve-flex-vh-center lst__btn-toggle-expand ve-self-flex-stretch no-select">[+]</span>
			<span class="bold ve-col-3-5 px-1">${feat.name}</span>
			<span class="ve-col-3-5 px-1 ${feat._slAbility === VeCt.STR_NONE ? "italic " : ""}">${feat._slAbility}</span>
			<span class="ve-col-3 px-1 ${feat._slPrereq === VeCt.STR_NONE ? "italic " : ""}">${feat._slPrereq}</span>
			<span class="source ve-col-1-7 ve-text-center ${Parser.sourceJsonToSourceClassname(feat.source)} pl-1 pr-0" title="${Parser.sourceJsonToFull(feat.source)}" ${Parser.sourceJsonToStyle(feat.source)}>${source}</span>
		</a>
		<div class="ve-flex ve-hidden relative accordion__wrp-preview">
			<div class="vr-0 absolute accordion__vr-preview"></div>
			<div class="ve-flex-col py-3 ml-4 accordion__wrp-preview-inner"></div>
		</div>`;

		const listItem = new ListItem(
			ftI,
			eleLi,
			feat.name,
			{
				hash,
				source,
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
		this._$pgContent.empty().append(RenderFeats.$getRenderedFeat(ent));
	}
}

const featsPage = new FeatsPage();
featsPage.sublistManager = new FeatsSublistManager();
window.addEventListener("load", () => featsPage.pOnLoad());

globalThis.dbg_page = featsPage;
