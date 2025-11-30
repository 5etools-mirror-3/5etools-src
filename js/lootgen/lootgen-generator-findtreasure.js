import {LootGenGeneratorBase} from "./lootgen-generator-base.js";
import {LootGenRender} from "./lootgen-render.js";

/** @abstract */
class LootGenGeneratorFindTreasureBase extends LootGenGeneratorBase {
	static _CHALLENGE_RATING_RANGES = {
		0: "0\u20134",
		5: "5\u201310",
		11: "11\u201316",
		17: "17+",
	};

	/**
	 * @abstract
	 * @return {string}
	 */
	_getHtmlBasedOn () { throw new Error("Unimplemented!"); }

	/**
	 * @abstract
	 * @return {?HTMLElementExtended}
	 */
	_render_getStgHoardAdditional () { throw new Error("Unimplemented!"); }

	render ({tabMeta}) {
		const selChallenge = ComponentUiUtil.getSelEnum(
			this,
			"ft_challenge",
			{
				values: Object.keys(this.constructor._CHALLENGE_RATING_RANGES).map(it => Number(it)),
				fnDisplay: it => this.constructor._CHALLENGE_RATING_RANGES[it],
			},
		);

		const cbIsHoard = ComponentUiUtil.getCbBool(this, "ft_isHoard");

		const btnRoll = ee`<button class="ve-btn ve-btn-default ve-btn-xs mr-2">Roll Loot</button>`
			.onn("click", () => this._ft_pDoHandleClickRollLoot());

		const btnClear = ee`<button class="ve-btn ve-btn-danger ve-btn-xs">Clear Output</button>`
			.onn("click", () => this._outputManager.doClearOutput());

		ee`<div class="ve-flex-col py-2 px-3">
			<label class="split-v-center mb-2">
				<div class="mr-2 w-66 no-shrink">Challenge Rating</div>
				${selChallenge}
			</label>

			<label class="split-v-center mb-2">
				<div class="mr-2 w-66 no-shrink">Is Treasure Hoard?</div>
				${cbIsHoard}
			</label>

			${this._render_getStgHoardAdditional()}

			<div class="ve-flex-v-center mb-2 mt-2">
				${btnRoll}
				${btnClear}
			</div>

			<hr class="hr-3">

			<div class="ve-small italic">${this._getHtmlBasedOn()}</div>
		</div>`.appendTo(tabMeta.wrpTab);
	}

	_ft_pDoHandleClickRollLoot () {
		if (this._state.ft_isHoard) return this._ft_doHandleClickRollLoot_pHoard();
		return this._ft_doHandleClickRollLoot_single();
	}

	_ft_doHandleClickRollLoot_single () {
		const tableMeta = this._dataManager.getData().individual
			.find(it => it.crMin === this._state.ft_challenge && it.source === this._source);

		const rowRoll = RollerUtil.randomise(100);
		const row = tableMeta.table.find(it => rowRoll >= it.min && rowRoll <= it.max);

		const coins = this._stateManager.getConvertedCoins(
			Object.entries(row.coins)
				.mergeMap(([type, formula]) => ({[type]: Renderer.dice.parseRandomise2(formula)})),
		);

		const lootOutput = new this._ClsLootGenOutput({
			type: `Individual Treasure: ${this.constructor._CHALLENGE_RATING_RANGES[this._state.ft_challenge]}`,
			name: `{@b Individual Treasure} for challenge rating {@b ${this.constructor._CHALLENGE_RATING_RANGES[this._state.ft_challenge]}}`,
			coins,
		});
		this._outputManager.doAddOutput({lootOutput});
	}

	/**
	 * @abstract
	 * @return {*}
	 */
	async _pGetMagicItemsFromTableRow ({row}) { throw new Error("Unimplemented!"); }

	/**
	 * @abstract
	 * @return {string}
	 */
	_getHoardLootOutputType () { throw new Error("Unimplemented!"); }

	/**
	 * @abstract
	 * @return {string}
	 */
	_getHoardLootOutputName () { throw new Error("Unimplemented!"); }

	async _ft_doHandleClickRollLoot_pHoard () {
		const tableMeta = this._dataManager.getData().hoard
			.find(it => it.crMin === this._state.ft_challenge && it.source === this._source);

		const rowRoll = RollerUtil.randomise(100);
		const row = tableMeta.table.find(it => rowRoll >= it.min && rowRoll <= it.max);

		const coins = this._stateManager.getConvertedCoins(
			Object.entries(tableMeta.coins || {})
				.mergeMap(([type, formula]) => ({[type]: Renderer.dice.parseRandomise2(formula)})),
		);

		const gems = this._doHandleClickRollLoot_hoard_gemsArtObjects({row, prop: "gems"});
		const artObjects = this._doHandleClickRollLoot_hoard_gemsArtObjects({row, prop: "artObjects"});
		const magicItemsByTable = await this._pGetMagicItemsFromTableRow({row});

		const lootOutput = new this._ClsLootGenOutput({
			type: this._getHoardLootOutputType(),
			name: this._getHoardLootOutputName(),
			coins,
			gems,
			artObjects,
			magicItemsByTable,
		});
		this._outputManager.doAddOutput({lootOutput});
	}

	_getDefaultState () {
		return {
			ft_challenge: 0,
			ft_isHoard: false,
		};
	}
}

export class LootGenGeneratorFindTreasure extends LootGenGeneratorFindTreasureBase {
	identifier = "findTreasure";
	_source = Parser.SRC_DMG;

	_getHtmlBasedOn () {
		return LootGenRender.er(`Based on the tables and rules in the {@book ${Parser.sourceJsonToFull(Parser.SRC_DMG)}|DMG|7|Treasure Tables}, pages 133-149.`);
	}

	_render_getStgHoardAdditional () { return null; }

	async _pGetMagicItemsFromTableRow ({row}) {
		return this._doHandleClickRollLoot_hoard_pMagicItems({row});
	}

	_getHoardLootOutputType () {
		return `Treasure Hoard: ${this.constructor._CHALLENGE_RATING_RANGES[this._state.ft_challenge]}`;
	}

	_getHoardLootOutputName () {
		return `{@b Hoard} for Challenge Rating {@b ${this.constructor._CHALLENGE_RATING_RANGES[this._state.ft_challenge]}}`;
	}
}

export class LootGenGeneratorFindTreasure24 extends LootGenGeneratorFindTreasureBase {
	static _CHARACTER_LEVEL_RANGES = {
		1: {label: "1\u20134", identifier: "1-4"},
		5: {label: "5\u201310", identifier: "5-10"},
		11: {label: "11\u201316", identifier: "11-16"},
		17: {label: "17\u201320", identifier: "17-20"},
	};

	identifier = "findTreasure24";
	_source = Parser.SRC_XDMG;

	_getHtmlBasedOn () {
		return LootGenRender.er(`Based on the tables and rules in the {@book ${Parser.sourceJsonToFull(Parser.SRC_XDMG)}|XDMG} page 120 (&quot;{@book Adventure Rewards|XDMG|3|Adventure Rewards}&quot;) and page 218 (&quot;{@book Random Magic Item Rarity|XDMG|6|Random Magic Item Rarity}&quot;).`);
	}

	_render_getStgHoardAdditional () {
		const selCharacterLevel = ComponentUiUtil.getSelEnum(
			this,
			"ft_characterLevel",
			{
				values: Object.keys(this.constructor._CHARACTER_LEVEL_RANGES).map(it => Number(it)),
				fnDisplay: it => this.constructor._CHARACTER_LEVEL_RANGES[it].label,
			},
		);

		const stg = ee`<div class="ve-flex-col w-100">
			<label class="split-v-center mb-2">
				<div class="mr-2 w-66 no-shrink">Character Level</div>
				${selCharacterLevel}
			</label>
		</div>`;

		this._addHookBase("ft_isHoard", () => stg.toggleVe(!!this._state.ft_isHoard))();

		return stg;
	}

	async _pGetMagicItemsFromTableRow ({row}) {
		return this._doHandleClickRollLoot_hoard_pMagicItems({row, characterLevelRange: this.constructor._CHARACTER_LEVEL_RANGES[this._state.ft_characterLevel].identifier});
	}

	_getHoardLootOutputType () {
		return `Treasure Hoard: ${this.constructor._CHALLENGE_RATING_RANGES[this._state.ft_challenge]}, Character Level ${this.constructor._CHARACTER_LEVEL_RANGES[this._state.ft_characterLevel].label}`;
	}

	_getHoardLootOutputName () {
		return `{@b Hoard} for Challenge Rating {@b ${this.constructor._CHALLENGE_RATING_RANGES[this._state.ft_challenge]}} and Character Level {@b ${this.constructor._CHARACTER_LEVEL_RANGES[this._state.ft_characterLevel].label}}`;
	}

	_getDefaultState () {
		return {
			...super._getDefaultState(),
			ft_characterLevel: 1,
		};
	}
}
