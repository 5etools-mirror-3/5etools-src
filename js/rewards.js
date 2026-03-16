"use strict";

class RewardsSublistManager extends SublistManager {
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

	pGetSublistItem (reward, hash) {
		const cellsText = [reward.type, reward.name];

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
			reward.name,
			{
				hash,
				page: reward.page,
				type: reward.type,
			},
			{
				entity: reward,
				mdRow: [...cellsText],
			},
		);
		return listItem;
	}
}

class RewardsPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterRewards();
		super({
			dataSource: DataUtil.reward.loadJSON.bind(DataUtil.reward),

			pFnGetFluff: Renderer.reward.pGetFluff.bind(Renderer.feat),

			pageFilter,

			dataProps: ["reward"],

			bookViewOptions: {
				nameSingular: "reward",
				namePlural: "rewards",
				pageTitle: "Rewards Book View",
			},

			isPreviewable: true,
		});
	}

	getListItem (reward, rwI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(reward, isExcluded);

		const eleLi = document.createElement("div");
		eleLi.className = `ve-lst__row ve-flex-col ${isExcluded ? "ve-lst__row--blocklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(reward.source);
		const hash = UrlUtil.autoEncodeHash(reward);

		eleLi.innerHTML = `<a href="#${hash}" class="ve-lst__row-border ve-lst__row-inner">
			<span class="ve-col-0-3 ve-px-0 ve-flex-vh-center ve-lst__btn-toggle-expand ve-self-flex-stretch ve-no-select">[+]</span>
			<span class="ve-col-2 ve-text-center ve-px-1">${reward.type}</span>
			<span class="ve-bold ve-col-7-7 ve-px-1">${reward.name}</span>
			<span class="ve-col-2 ve-text-center ${Parser.sourceJsonToSourceClassname(reward.source)} ve-pl-1 ve-pr-0" title="${Parser.sourceJsonToFull(reward.source)}">${source}</span>
		</a>
		<div class="ve-flex ve-hidden ve-relative ve-accordion__wrp-preview">
			<div class="ve-vr-0 ve-absolute ve-accordion__vr-preview"></div>
			<div class="ve-flex-col ve-py-3 ve-ml-4 ve-accordion__wrp-preview-inner"></div>
		</div>`;

		const listItem = new ListItem(
			rwI,
			eleLi,
			reward.name,
			{
				hash,
				source,
				page: reward.page,
				type: reward.type,
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
		this._pgContent.empty().appends(RenderRewards.getRenderedReward(ent));
	}
}

const rewardsPage = new RewardsPage();
rewardsPage.sublistManager = new RewardsSublistManager();
window.addEventListener("load", () => rewardsPage.pOnLoad());

globalThis.dbg_page = rewardsPage;
