"use strict";

class VehiclesSublistManager extends SublistManager {
	static _getRowTemplate () {
		return [
			new SublistCellTemplate({
				name: "Type",
				css: "ve-col-8 pl-0 pr-1 ve-text-center",
				colStyle: "text-center",
			}),
			new SublistCellTemplate({
				name: "Name",
				css: "bold ve-col-4 pl-1 pr-0",
				colStyle: "",
			}),
		];
	}

	pGetSublistItem (it, hash) {
		const displayType = it.vehicleType ? Parser.vehicleTypeToFull(it.vehicleType) : it.upgradeType.map(t => Parser.vehicleTypeToFull(t));
		const cellsText = [displayType, it.name];

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
				page: it.page,
				vehicleType: it.vehicleType,
				upgradeType: it.upgradeType,
				type: displayType,
			},
			{
				entity: it,
				mdRow: [...cellsText],
			},
		);
		return listItem;
	}
}

class VehiclesPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterVehicles();
		const pFnGetFluff = Renderer.vehicle.pGetFluff.bind(Renderer.vehicle);

		super({
			dataSource: "data/vehicles.json",

			pFnGetFluff,

			pageFilter,

			dataProps: ["vehicle", "vehicleUpgrade"],

			listSyntax: new ListSyntaxVehicles({fnGetDataList: () => this._dataList, pFnGetFluff}),
		});

		this._tokenDisplay = new ListPageTokenDisplay({
			fnHasToken: Renderer.vehicle.hasToken.bind(Renderer.vehicle),
			fnGetTokenUrl: Renderer.vehicle.getTokenUrl.bind(Renderer.vehicle),
		});
	}

	getListItem (it, vhI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(it, isExcluded);

		const eleLi = document.createElement("div");
		eleLi.className = `lst__row ve-flex-col ${isExcluded ? "lst__row--blocklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(it.source);
		const hash = UrlUtil.autoEncodeHash(it);
		const displayType = it.vehicleType ? Parser.vehicleTypeToFull(it.vehicleType) : it.upgradeType.map(t => Parser.vehicleTypeToFull(t));

		eleLi.innerHTML = `<a href="#${UrlUtil.autoEncodeHash(it)}" class="lst__row-border lst__row-inner">
			<span class="ve-col-6 pl-0 pr-1 ve-text-center">${displayType}</span>
			<span class="bold ve-col-4 px-1">${it.name}</span>
			<span class="ve-col-2 ve-text-center ${Parser.sourceJsonToSourceClassname(it.source)} pl-1 pr-0" title="${Parser.sourceJsonToFull(it.source)}" ${Parser.sourceJsonToStyle(it.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			vhI,
			eleLi,
			it.name,
			{
				hash,
				source,
				page: it.page,
				vehicleType: it.vehicleType,
				upgradeType: it.upgradeType,
				type: displayType,
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
		this._$pgContent.empty().append(RenderVehicles.$getRenderedVehicle(ent));

		this._tokenDisplay.render(ent);
	}

	_renderStats_onTabChangeStats () {
		this._tokenDisplay.doShow();
	}

	_renderStats_onTabChangeFluff () {
		this._tokenDisplay.doHide();
	}
}

const vehiclesPage = new VehiclesPage();
vehiclesPage.sublistManager = new VehiclesSublistManager();
window.addEventListener("load", () => vehiclesPage.pOnLoad());
