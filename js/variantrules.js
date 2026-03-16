"use strict";

class VariantRulesSublistManager extends SublistManager {
	static _getRowTemplate () {
		return [
			new SublistCellTemplate({
				name: "Name",
				css: "ve-bold ve-col-10 ve-pl-0 ve-pr-1",
				colStyle: "",
			}),
			new SublistCellTemplate({
				name: "Type",
				css: "ve-col-3 ve-text-center ve-pl-1 ve-pr-0",
				colStyle: "ve-text-center",
			}),
		];
	}

	pGetSublistItem (it, hash) {
		const cellsText = [it.name, it.ruleType ? Parser.ruleTypeToFull(it.ruleType) : "\u2014"];

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
				ruleType: it.ruleType || "",
			},
			{
				entity: it,
				mdRow: [...cellsText],
			},
		);
		return listItem;
	}
}

class VariantRulesPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterVariantRules();
		super({
			dataSource: DataUtil.variantrule.loadJSON.bind(DataUtil.variantrule),

			pageFilter,

			dataProps: ["variantrule"],

			bookViewOptions: {
				nameSingular: "variant rule",
				namePlural: "variant rules",
				pageTitle: "Variant Rules Book View",
			},
		});
	}

	getListItem (rule, rlI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(rule, isExcluded);

		const searchStack = [];
		for (const e1 of rule.entries) {
			Renderer.getNames(searchStack, e1);
		}

		const eleLi = document.createElement("div");
		eleLi.className = `ve-lst__row ve-flex-col ${isExcluded ? "ve-lst__row--blocklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(rule.source);
		const hash = UrlUtil.autoEncodeHash(rule);

		eleLi.innerHTML = `<a href="#${hash}" class="ve-lst__row-border ve-lst__row-inner">
			<span class="ve-bold ve-col-7 ve-pl-0 ve-pr-1">${rule.name}</span>
			<span class="ve-col-3 ve-px-1 ve-text-center">${rule.ruleType ? Parser.ruleTypeToFull(rule.ruleType) : "\u2014"}</span>
			<span class="ve-col-2 ve-text-center ${Parser.sourceJsonToSourceClassname(rule.source)} ve-pl-1 ve-pr-0" title="${Parser.sourceJsonToFull(rule.source)}">${source}</span>
		</a>`;

		const listItem = new ListItem(
			rlI,
			eleLi,
			rule.name,
			{
				hash,
				source,
				page: rule.page,
				search: searchStack.join(","),
				ruleType: rule.ruleType || "",
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
		this._pgContent.empty().appends(RenderVariantRules.getRenderedVariantRule(ent));
	}

	async _pDoLoadSubHash ({sub, lockToken}) {
		sub = await super._pDoLoadSubHash({sub, lockToken});

		if (!sub.length) return;

		const ixHeader = UrlUtil.unpackSubHash(sub[0], true)?.header;
		const eleTitle = es(`.ve-rd__h[data-title-index="${ixHeader}"]`);
		if (eleTitle) eleTitle.scrollIntoView();
	}
}

const variantRulesPage = new VariantRulesPage();
variantRulesPage.sublistManager = new VariantRulesSublistManager();
window.addEventListener("load", () => variantRulesPage.pOnLoad());

globalThis.dbg_page = variantRulesPage;
