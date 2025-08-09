class PageFilterGemsArtObjects extends PageFilterBase {
	constructor () {
		super();
		this._miscFilter = new Filter({
			header: "Miscellaneous",
			items: ["Reprinted"],
			isMiscFilter: true,
			deselFn: PageFilterBase.defaultMiscellaneousDeselFn.bind(PageFilterBase),
		});
	}

	static mutateForFilters (ent) {
		this._mutateForFilters_commonSources(ent);
		this._mutateForFilters_commonMisc(ent);
	}

	addToFilters (ent, isExcluded) {
		if (isExcluded) return;
		this._sourceFilter.addItem(ent._fSources);
		this._miscFilter.addItem(ent._fMisc);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, ent) {
		return this._filterBox.toDisplay(
			values,
			ent._fSources,
			ent._fMisc,
		);
	}
}

export class ModalFilterGemsArtObjects extends ModalFilterBase {
	/**
	 * @param opts
	 * @param opts.namespace
	 * @param [opts.isRadio]
	 * @param [opts.allData]
	 */
	constructor (opts) {
		opts = opts || {};
		super({
			...opts,
			modalTitle: `Gem${opts.isRadio ? "" : "s"}/Art Object${opts.isRadio ? "" : "s"}`,
			pageFilter: new PageFilterGemsArtObjects(),
		});
	}

	_$getColumnHeaders () {
		const btnMeta = [
			{sort: "name", text: "Name", width: "9"},
			{sort: "source", text: "Source", width: "2"},
		];
		return ModalFilterBase._$getFilterColumnHeaders(btnMeta);
	}

	async _pLoadAllData () {
		const lootData = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/loot.json`);
		return [
			...lootData.gems,
			...lootData.artObjects,
		];
	}

	_getListItem (pageFilter, ent, ix) {
		const eleRow = document.createElement("div");
		eleRow.className = "px-0 w-100 ve-flex-col no-shrink";

		const source = Parser.sourceJsonToAbv(ent.source);

		eleRow.innerHTML = `<div class="w-100 ve-flex-vh-center lst__row-border veapp__list-row no-select lst__wrp-cells">
			<div class="ve-col-0-5 pl-0 ve-flex-vh-center">${this._isRadio ? `<input type="radio" name="radio" class="no-events">` : `<input type="checkbox" class="no-events">`}</div>

			<div class="ve-col-9 px-1 ${this._getNameStyle()}">${ent.name}</div>
			<div class="ve-col-2 pl-1 pr-0 ve-flex-h-center ${Parser.sourceJsonToSourceClassname(ent.source)}" title="${Parser.sourceJsonToFull(ent.source)}">${source}${Parser.sourceJsonToMarkerHtml(ent.source, {isList: true})}</div>
		</div>`;

		return new ListItem(
			ix,
			eleRow,
			ent.name,
			{
				source,
				sourceJson: ent.source,
				...ListItem.getCommonValues(ent),
			},
			{
				cbSel: eleRow.firstElementChild.firstElementChild.firstElementChild,
			},
		);
	}
}
