export class LootGenUiDataManager {
	constructor ({spells, items}) {
		this._data = null;
		this._dataSpells = spells;
		this._dataItems = items;
		this._dataGemsArtObjects = null;

		this._dataSpellsFiltered = [...spells];
		this._dataItemsFiltered = [...items];
		this._dataItemsFilteredLegacy = [...items];
		this._dataGemsArtObjectsFiltered = null;
	}

	async pInit () {
		this._data = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/loot.json`);
		this._dataGemsArtObjects = [
			...this._data.gems,
			...this._data.artObjects,
		];
		this._dataGemsArtObjectsFiltered = [...this._dataGemsArtObjects];
	}

	getData () { return this._data; }
	getDataSpells () { return this._dataSpells; }
	getDataItems () { return this._dataItems; }
	getDataGemsArtObjects () { return this._dataGemsArtObjects; }
	getDataSpellsFiltered () { return this._dataSpellsFiltered; }
	getDataItemsFiltered () { return this._dataItemsFiltered; }
	getDataItemsFilteredLegacy () { return this._dataItemsFilteredLegacy; }
	getDataGemsArtObjectsFiltered () { return this._dataGemsArtObjectsFiltered; }

	getDataGemsFiltered () { return this._dataGemsArtObjectsFiltered.filter(it => it.__prop === "gems"); }
	getDataArtObjectsFiltered () { return this._dataGemsArtObjectsFiltered.filter(it => it.__prop === "artObjects"); }
	getDataGemsArtObjectsFilteredByProp (prop) {
		if (!["gems", "artObjects"].includes(prop)) throw new Error(`Unhandled prop "${prop}"!`);
		return this._dataGemsArtObjectsFiltered.filter(it => it.__prop === prop);
	}

	getDataItemsFilteredMatching (toMatch) {
		if (!toMatch) return null;
		// Use "legacy" item set, as "tier" info no longer used
		const dataItems = toMatch.tier
			? this.getDataItemsFilteredLegacy()
			: this.getDataItemsFiltered();
		return dataItems
			.filter(it => (!it.type || DataUtil.itemType.unpackUid(it.type).abbreviation !== Parser.ITM_TYP_ABV__GENERIC_VARIANT) && Object.entries(toMatch).every(([k, v]) => it[k] === v));
	}

	setDataSpellsFiltered (val) { return this._dataSpellsFiltered = val; }
	setDataItemsFiltered (val) { return this._dataItemsFiltered = val; }
	setDataItemsFilteredLegacy (val) { return this._dataItemsFilteredLegacy = val; }
	setDataGemsArtObjectsFiltered (val) { return this._dataGemsArtObjectsFiltered = val; }
}
