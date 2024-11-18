import {LootGenUi} from "./lootgen/lootgen-ui.js";

class LootGenPage {
	static _STORAGE_KEY_STATE = "state";

	constructor () {
		this._lootGenUi = null;
	}

	async pInit () {
		await Promise.all([
			PrereleaseUtil.pInit(),
			BrewUtil2.pInit(),
		]);
		await ExcludeUtil.pInitialise();

		const $stgLhs = $(`#lootgen-lhs`);
		const $stgRhs = $(`#lootgen-rhs`);

		this._lootGenUi = new LootGenUi({
			spells: await this._pLoadSpells(),
			items: await this._pLoadItems(),
		});
		await this._lootGenUi.pInit();
		this._lootGenUi.render({$stgLhs, $stgRhs});

		const savedState = await StorageUtil.pGetForPage(LootGenPage._STORAGE_KEY_STATE);
		if (savedState != null) this._lootGenUi.setStateFrom(savedState);

		const savedStateDebounced = MiscUtil.throttle(this._pDoSaveState.bind(this), 100);
		this._lootGenUi.addHookAll("state", () => savedStateDebounced());
		this._lootGenUi.addHookAll("meta", () => savedStateDebounced());

		$(`#wrp-loading`).remove();
		$(`#wrp-content`).showVe();

		window.dispatchEvent(new Event("toolsLoaded"));
	}

	async _pLoadSpells () {
		const [stockSpells, prerelease, brew] = await Promise.all([
			DataUtil.spell.pLoadAll(),
			PrereleaseUtil.pGetBrewProcessed(),
			BrewUtil2.pGetBrewProcessed(),
		]);
		return stockSpells
			.concat(prerelease?.spell || [])
			.concat(brew?.spell || [])
			.filter(sp => {
				return !ExcludeUtil.isExcluded(
					UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_SPELLS](sp),
					"spell",
					sp.source,
					{isNoCount: true},
				);
			});
	}

	async _pLoadItems () {
		const stockItems = (await Renderer.item.pBuildList()).filter(it => !it._isItemGroup);
		return stockItems
			.concat(await Renderer.item.pGetItemsFromPrerelease())
			.concat(await Renderer.item.pGetItemsFromBrew())
			.filter(it => {
				return !ExcludeUtil.isExcluded(
					UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ITEMS](it),
					"item",
					it.source,
					{isNoCount: true},
				);
			});
	}

	async _pDoSaveState () {
		const statGenState = this._lootGenUi.getSaveableState();
		await StorageUtil.pSetForPage(LootGenPage._STORAGE_KEY_STATE, statGenState);
	}
}

const lootGenPage = new LootGenPage();
window.addEventListener("load", () => void lootGenPage.pInit());
globalThis.dbg_lootGenPage = lootGenPage;
