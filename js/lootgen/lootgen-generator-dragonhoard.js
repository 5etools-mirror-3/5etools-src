import {LootGenGeneratorBase} from "./lootgen-generator-base.js";
import {LootGenOutputDragonMundaneItems} from "./lootgen-output.js";
import {LootGenRender} from "./lootgen-render.js";

export class LootGenGeneratorDragonHoard extends LootGenGeneratorBase {
	static _DRAGON_AGES = [
		"Wyrmling",
		"Young",
		"Adult",
		"Ancient",
	];

	identifier = "dragonHoard";

	render ({tabMeta}) {
		const selDragonAge = ComponentUiUtil.getSelEnum(
			this,
			"dh_dragonAge",
			{
				values: this.constructor._DRAGON_AGES,
			},
		);

		const cbIsPreferRandomMagicItems = ComponentUiUtil.getCbBool(this, "dh_isPreferRandomMagicItems");

		const btnRoll = ee`<button class="ve-btn ve-btn-default ve-btn-xs mr-2">Roll Loot</button>`
			.onn("click", () => this._dh_pDoHandleClickRollLoot());

		const btnClear = ee`<button class="ve-btn ve-btn-danger ve-btn-xs">Clear Output</button>`
			.onn("click", () => this._outputManager.doClearOutput());

		ee`<div class="ve-flex-col py-2 px-3">
			<label class="split-v-center mb-2">
				<div class="mr-2 w-66 no-shrink">Dragon Age</div>
				${selDragonAge}
			</label>

			<label class="split-v-center mb-3">
				<div class="mr-2 w-66 no-shrink" title="If selected, random magic items (of a matching rarity and tier) will be preferred over rolling on the standard ${Parser.sourceJsonToAbv(Parser.SRC_DMG).qq()} &quot;Magic Items Table [A-I]&quot; when generating magic items.">Prefer Random Magic Items</div>
				${cbIsPreferRandomMagicItems}
			</label>

			<div class="ve-flex-v-center mb-2">
				${btnRoll}
				${btnClear}
			</div>

			<hr class="hr-3">

			<div class="ve-small italic">${LootGenRender.er(`Based on the tables and rules in {@book Fizban's Treasury of Dragons|FTD|4|Creating a Hoard}`)}, pages 72.</div>
		</div>`.appendTo(tabMeta.wrpTab);
	}

	async _dh_pDoHandleClickRollLoot () {
		const tableMeta = this._dataManager.getData().dragon.find(it => it.name === this._state.dh_dragonAge);

		const coins = this._stateManager.getConvertedCoins(
			Object.entries(tableMeta.coins || {})
				.mergeMap(([type, formula]) => ({[type]: Renderer.dice.parseRandomise2(formula)})),
		);

		const dragonMundaneItems = this._dh_doHandleClickRollLoot_mundaneItems({dragonMundaneItems: tableMeta.dragonMundaneItems});

		const gems = this._doHandleClickRollLoot_hoard_gemsArtObjectsMulti({row: tableMeta, prop: "gems"});
		const artObjects = this._doHandleClickRollLoot_hoard_gemsArtObjectsMulti({row: tableMeta, prop: "artObjects"});

		const magicItemsByTable = await this._doHandleClickRollLoot_hoard_pMagicItemsMulti({
			row: tableMeta,
			fnGetIsPreferAltChoose: () => !!this._state.dh_isPreferRandomMagicItems,
		});

		const lootOutput = new this._ClsLootGenOutput({
			type: `Dragon Hoard: ${this._state.dh_dragonAge}`,
			name: `${this._state.dh_dragonAge} Dragon's Hoard`,
			coins,
			gems,
			artObjects,
			dragonMundaneItems,
			magicItemsByTable,
		});
		this._outputManager.doAddOutput({lootOutput});
	}

	_dh_doHandleClickRollLoot_mundaneItems ({dragonMundaneItems}) {
		if (!dragonMundaneItems) return null;

		const count = Renderer.dice.parseRandomise2(dragonMundaneItems.amount);

		const breakdown = [];
		[...new Array(count)]
			.forEach(() => {
				const roll = RollerUtil.randomise(100);
				const result = this._dataManager.getData().dragonMundaneItems.find(it => roll >= it.min && roll <= it.max);
				breakdown.push(result.item);
			});

		return new LootGenOutputDragonMundaneItems({
			count: count,
			breakdown,
		});
	}

	_getDefaultState () {
		return {
			dh_dragonAge: "Wyrmling",
			dh_isPreferRandomMagicItems: false,
		};
	}
}
