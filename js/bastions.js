import {RenderBastions} from "./render-bastions.js";

class BastionsSublistManager extends SublistManager {
	static _getRowTemplate () {
		return [
			new SublistCellTemplate({
				name: "Type",
				css: "ve-col-2 pl-0 pr-1 ve-text-center",
				colStyle: "text-center",
			}),
			new SublistCellTemplate({
				name: "Name",
				css: "bold ve-col-3 px-1",
			}),
			new SublistCellTemplate({
				name: "Level",
				css: "ve-col-2 px-1 ve-text-center",
				colStyle: "text-center",
			}),
			new SublistCellTemplate({
				name: "Prerequisite",
				css: "ve-col-5 pl-1 pr-0",
			}),
		];
	}

	pGetSublistItem (ent, hash) {
		const facilityType = (ent.facilityType || "Unknown").toTitleCase();

		const cellsText = [
			facilityType,
			ent.name,
			ent.level || "\u2014",
			ent._slPrereq,
		];

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
			ent.name,
			{
				hash,
				page: ent.page,
				facilityType,
				level: ent.level || 0,
				prerequisite: ent._slPrereq,
			},
			{
				entity: ent,
				mdRow: [...cellsText],
			},
		);
		return listItem;
	}
}

class BastionsPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterBastions();
		super({
			dataSource: DataUtil.facility.loadJSON.bind(DataUtil.facility),

			pFnGetFluff: Renderer.facility.pGetFluff.bind(Renderer.facility),

			pageFilter,

			dataProps: ["facility"],

			bookViewOptions: {
				namePlural: "facilities",
				pageTitle: "Facilities Book View",
			},
		});
	}

	getListItem (ent, ixEnt, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(ent, isExcluded);

		const eleLi = document.createElement("div");
		eleLi.className = `lst__row ve-flex-col ${isExcluded ? "lst__row--blocklisted" : ""}`;

		const hash = UrlUtil.autoEncodeHash(ent);
		const source = Parser.sourceJsonToAbv(ent.source);
		const facilityType = (ent.facilityType || "Unknown").toTitleCase();

		eleLi.innerHTML = `<a href="#${hash}" class="lst__row-border lst__row-inner">
			<span class="ve-col-2 ve-text-center pl-0 pr-1">${facilityType}</span>
			<span class="bold ve-col-3 px-1">${ent.name}</span>
			<span class="ve-col-1 ve-text-center px-1 ${ent.level == null ? "italic" : ""}">${ent.level || "\u2014"}</span>
			<span class="ve-col-4 px-1 ${ent._slPrereq === VeCt.STR_NONE ? "italic " : ""}">${ent._slPrereq}</span>
			<span class="ve-col-2 ve-text-center ${Parser.sourceJsonToSourceClassname(ent.source)}  pl-1 pr-0" title="${Parser.sourceJsonToFull(ent.source)}" ${Parser.sourceJsonToStyle(ent.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			ixEnt,
			eleLi,
			ent.name,
			{
				hash,
				source,
				page: ent.page,
				facilityType,
				level: ent.level || 0,
				prerequisite: ent._slPrereq,
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
		this._$pgContent.empty().append(RenderBastions.$getRenderedFacility(ent));
	}
}

const bastionsPage = new BastionsPage();
bastionsPage.sublistManager = new BastionsSublistManager();
window.addEventListener("load", () => bastionsPage.pOnLoad());

globalThis.dbg_page = bastionsPage;
