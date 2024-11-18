"use strict";

class RewardsSublistManager extends SublistManager {
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

	pGetSublistItem (reward, hash) {
		const cellsText = [reward.type, reward.name];

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

			isPreviewable: true,
		});
	}

	getListItem (reward, rwI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(reward, isExcluded);

		const eleLi = document.createElement("div");
		eleLi.className = `lst__row ve-flex-col ${isExcluded ? "lst__row--blocklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(reward.source);
		const hash = UrlUtil.autoEncodeHash(reward);

		eleLi.innerHTML = `<a href="#${hash}" class="lst__row-border lst__row-inner">
			<span class="ve-col-0-3 px-0 ve-flex-vh-center lst__btn-toggle-expand ve-self-flex-stretch no-select">[+]</span>
			<span class="ve-col-2 ve-text-center px-1">${reward.type}</span>
			<span class="bold ve-col-7-7 px-1">${reward.name}</span>
			<span class="ve-col-2 ve-text-center ${Parser.sourceJsonToSourceClassname(reward.source)} pl-1 pr-0" title="${Parser.sourceJsonToFull(reward.source)}" ${Parser.sourceJsonToStyle(reward.source)}>${source}</span>
		</a>
		<div class="ve-flex ve-hidden relative accordion__wrp-preview">
			<div class="vr-0 absolute accordion__vr-preview"></div>
			<div class="ve-flex-col py-3 ml-4 accordion__wrp-preview-inner"></div>
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
		this._$pgContent.empty().append(RenderRewards.$getRenderedReward(ent));
	}
}

const rewardsPage = new RewardsPage();
rewardsPage.sublistManager = new RewardsSublistManager();
window.addEventListener("load", () => rewardsPage.pOnLoad());
