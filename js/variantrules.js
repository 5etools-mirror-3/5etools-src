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
				colStyle: "text-center",
			}),
		];
	}

	pGetSublistItem (it, hash) {
		const cellsText = [it.name, it.ruleType ? Parser.ruleTypeToFull(it.ruleType) : "\u2014"];

		const ele = veT`<div class="ve-lst__row ve-lst__row--sublist ve-flex-col">
			<a href="#${hash}" class="ve-lst__row-border ve-lst__row-inner">
				${this.constructor._getRowCellsHtml({values: cellsText})}
			</a>
		</div>`
			.vee.onn("contextmenu", evt => this._handleSublistItemContextMenu(evt, listItem))
			.vee.onn("click", evt => this._listSub.doSelect(listItem, evt));

		const listItem = new ListItem(
			hash,
			ele,
			it.name,
			{
				...ListItem.getCommonValues(it),
				ruleType: it.ruleType || "",
			},
			{
				hash,
				page: it.page,
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
				source,
				...ListItem.getCommonValues(rule),
				search: searchStack.join(","),
				ruleType: rule.ruleType || "",
			},
			{
				hash,
				page: rule.page,
				isExcluded,
			},
		);

		eleLi.addEventListener("click", (evt) => this._list.doSelect(listItem, evt));
		eleLi.addEventListener("contextmenu", (evt) => this._openContextMenu(evt, this._list, listItem));

		return listItem;
	}

	_renderStats_doBuildStatsTab ({ent}) {
		this._pgContent.vee.empty().vee.appends(RenderVariantRules.getRenderedVariantRule(ent));
	}

	async _pDoLoadSubHash_pTitleIndex_ ({sub}) {
		if (!sub.length) return sub;

		const ixHeader = UrlUtil.unpackSubHash(sub[0], true)?.header;
		const eleTitle = veEs(`.ve-rd__h[data-title-index="${ixHeader}"]`);
		if (eleTitle) eleTitle.scrollIntoView();

		return sub;
	}

	async _pDoLoadSubHash_pTitleIndex ({sub}) {
		try {
			sub = await this._pDoLoadSubHash_pTitleIndex_({sub});
		} catch (e) {
			JqueryUtil.doToast({type: "danger", content: `Failed to set creature scaler state from URL! ${VeCt.STR_SEE_CONSOLE}`, isAutoHide: false});
			setTimeout(() => { throw e; });
		}
		return sub;
	}

	async _pDoLoadSubHash ({sub, lockToken}) {
		sub = await super._pDoLoadSubHash({sub, lockToken});
		sub = await this._pDoLoadSubHash_pTitleIndex({sub});
		return sub;
	}
}

const variantRulesPage = new VariantRulesPage();
variantRulesPage.sublistManager = new VariantRulesSublistManager();
window.addEventListener("load", () => variantRulesPage.pOnLoad());

globalThis.dbg_page = variantRulesPage;
