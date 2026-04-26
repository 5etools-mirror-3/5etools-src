import {RenderCrochetPatterns} from "./render-homecrafts.js";

class HomeCraftsSublistManager extends SublistManager {
	static _getRowTemplate () {
		return [
			new SublistCellTemplate({
				name: "Type",
				css: "ve-col-2 ve-pl-0 ve-pr-1 ve-text-center",
				colStyle: "text-center",
			}),
			new SublistCellTemplate({
				name: "Name",
				css: "ve-bold ve-col-7 ve-px-1",
			}),
			new SublistCellTemplate({
				name: "Category",
				css: "ve-col-3 ve-pl-1 ve-pr-0 ve-text-center",
				colStyle: "text-center",
			}),
		];
	}

	pGetSublistItem (ent, hash) {
		const type = Parser.getPropDisplayName(ent.__prop);
		const typeShort = PageFilterHomeCrafts.getTypeAbbreviation(ent.__prop);
		const category = (ent.patternType || "Unknown").toTitleCase();

		const cellsText = [
			new SublistCell({text: typeShort, title: type}),
			ent.name,
			category,
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
			ent.name,
			{
				hash,
				page: ent.page,
				category,
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

class HomeCraftsPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterHomeCrafts();
		super({
			dataSource: DataUtil.crochetPattern.loadJSON.bind(DataUtil.crochetPattern),

			pFnGetFluff: Renderer.crochetPattern.pGetFluff.bind(Renderer.crochetPattern),

			pageFilter,

			dataProps: ["crochetPattern"],

			bookViewOptions: {
				nameSingular: "crochet pattern",
				namePlural: "crochet patterns",
				pageTitle: "Crochet Patterns Book View",
			},
		});
	}

	getListItem (ent, ixEnt, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(ent, isExcluded);

		const eleLi = document.createElement("div");
		eleLi.className = `ve-lst__row ve-flex-col ${isExcluded ? "ve-lst__row--blocklisted" : ""}`;

		const hash = UrlUtil.autoEncodeHash(ent);
		const source = Parser.sourceJsonToAbv(ent.source);
		const type = Parser.getPropDisplayName(ent.__prop);
		const typeShort = PageFilterHomeCrafts.getTypeAbbreviation(ent.__prop);
		const category = (ent.patternType || "Unknown").toTitleCase();

		eleLi.innerHTML = `<a href="#${hash}" class="ve-lst__row-border ve-lst__row-inner">
			<span class="ve-col-1-5 ve-pl-0 ve-pr-1 ve-text-center" title="${type.qq()}">${typeShort}</span>
			<span class="ve-col-5 ve-bold ve-px-1">${ent.name}</span>
			<span class="ve-col-3-5 ve-px-1 ve-text-center">${category}</span>
			<span class="ve-col-2 ve-text-center ${Parser.sourceJsonToSourceClassname(ent.source)} ve-pl-1 ve-pr-0" title="${Parser.sourceJsonToFull(ent.source)}">${source}</span>
		</a>`;

		const listItem = new ListItem(
			ixEnt,
			eleLi,
			ent.name,
			{
				hash,
				source,
				page: ent.page,
				type,
				category,
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
		this._wrpTabs.parente().find(`[data-name="homecraft-type"]`)?.remove();

		Promise.any([
			Renderer.utils.pHasFluffText(ent, `${ent.__prop}Fluff`),
			Renderer.utils.pHasFluffImages(ent, `${ent.__prop}Fluff`),
		])
			.then(hasAnyFluff => {
				const wrpType = ee`<div data-name="homecraft-type" class="ve-italic ve-inline-block"></div>`;

				if (hasAnyFluff) wrpType.addClass("ve-mb-1").insertBeforee(this._wrpTabs);
				else wrpType.addClass("ve-pl-7p").prependTo(this._wrpTabs);

				ee`<span class="ve-roller">${Parser.getPropDisplayName(ent.__prop)}</span>`
					.onn("click", () => {
						this._filterBox.setFromValues({"Type": {[ent.__prop]: 1}});
						this.handleFilterChange();
					})
					.appendTo(wrpType);
			});

		this._pgContent.empty().appends(RenderCrochetPatterns.getRenderedCrochetPattern(ent));
	}
}

const homeCraftsPage = new HomeCraftsPage();
homeCraftsPage.sublistManager = new HomeCraftsSublistManager();
window.addEventListener("load", () => homeCraftsPage.pOnLoad());

globalThis.dbg_page = homeCraftsPage;
