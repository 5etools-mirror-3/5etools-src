import {RenderBackgrounds} from "./render-backgrounds.js";

class BackgroundSublistManager extends SublistManager {
	static _getRowTemplate () {
		return [
			new SublistCellTemplate({
				name: "Name",
				css: "ve-bold ve-col-3 ve-pl-0 ve-pr-1",
				colStyle: "",
			}),
			new SublistCellTemplate({
				name: "Ability",
				css: "ve-col-5 ve-px-1",
				colStyle: "",
			}),
			new SublistCellTemplate({
				name: "Skills",
				css: "ve-col-4 ve-pl-1 ve-pr-0",
				colStyle: "",
			}),
		];
	}

	pGetSublistItem (it, hash) {
		const name = it.name.replace("Variant ", "");
		const {summary: skills} = Renderer.generic.getSkillSummary({skillProfs: it.skillProficiencies || [], isShort: true});
		const cellsText = [
			name,
			new SublistCell({text: it._slAbility, css: it._slAbility === VeCt.STR_NONE ? "ve-italic" : ""}),
			skills,
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
			name,
			{
				hash,
				source: Parser.sourceJsonToAbv(it.source),
				page: it.page,
				skills,
			},
			{
				entity: it,
				mdRow: [...cellsText],
			},
		);
		return listItem;
	}
}

class BackgroundPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterBackgrounds();
		super({
			dataSource: DataUtil.background.loadJSON.bind(DataUtil.background),

			pFnGetFluff: Renderer.background.pGetFluff.bind(Renderer.background),

			pageFilter,

			bookViewOptions: {
				nameSingular: "background",
				namePlural: "backgrounds",
				pageTitle: "Backgrounds Book View",
			},

			dataProps: ["background"],
		});
	}

	getListItem (bg, bgI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(bg, isExcluded);

		const eleLi = document.createElement("div");
		eleLi.className = `ve-lst__row ve-flex-col ${isExcluded ? "ve-lst__row--blocklisted" : ""}`;

		const name = bg.name.replace("Variant ", "");
		const hash = UrlUtil.autoEncodeHash(bg);
		const source = Parser.sourceJsonToAbv(bg.source);

		eleLi.innerHTML = `<a href="#${hash}" class="ve-lst__row-border ve-lst__row-inner">
			<span class="ve-bold ve-col-2-5 ve-pl-0 ve-pr-1">${name}</span>
			<span class="ve-col-3-5 ve-px-1 ${bg._slAbility === VeCt.STR_NONE ? "ve-italic" : ""}">${bg._slAbility}</span>
			<span class="ve-col-4 ve-px-1">${bg._skillDisplay}</span>
			<span class="ve-col-2 ve-text-center ${Parser.sourceJsonToSourceClassname(bg.source)}  ve-pl-1 ve-pr-0" title="${Parser.sourceJsonToFull(bg.source)}">${source}</span>
		</a>`;

		const listItem = new ListItem(
			bgI,
			eleLi,
			name,
			{
				hash,
				source,
				page: bg.page,
				ability: bg._slAbility,
				skills: bg._skillDisplay,
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
		this._pgContent.empty().appends(RenderBackgrounds.getRenderedBackground(ent));
	}
}

const backgroundsPage = new BackgroundPage();
backgroundsPage.sublistManager = new BackgroundSublistManager();
window.addEventListener("load", () => backgroundsPage.pOnLoad());

globalThis.dbg_page = backgroundsPage;
