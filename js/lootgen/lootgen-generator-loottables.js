import {LootGenGeneratorBase} from "./lootgen-generator-base.js";
import {
	LOOT_TABLES_TYPE__DMG_MAGIC_ITEMS,
	LOOT_TABLES_TYPE__XDMG_THEMES,
	LOOT_TABLES_TYPE__XGE_FAUX,
} from "./lootgen-const.js";
import {LootGenMagicItem} from "./lootgen-magicitem.js";
import {LootGenOutputMagicItems} from "./lootgen-output.js";
import {LootGenRender} from "./lootgen-render.js";

export class LootGenGeneratorLootTables extends LootGenGeneratorBase {
	identifier = "lootTables";

	_lt_tableMetas = null;

	setTableMetas (val) { return this._lt_tableMetas = val; }

	render ({tabMeta}) {
		let cacheTableMetas = [...this._lt_tableMetas];

		const getSelTableValues = () => this._lt_tableMetas.map((_, i) => i);

		const {sel: selTable, setValues: setSelTableValues} = ComponentUiUtil.getSelEnum(
			this,
			"lt_ixTable",
			{
				asMeta: true,
				isAllowNull: true,
				displayNullAs: "\u2014",
				values: getSelTableValues(),
				fnDisplay: ix => this._lt_getSelTableDisplay({ix}),
			},
		);

		const hkPulseItem = () => {
			const curVal = cacheTableMetas[this._state.lt_ixTable];
			cacheTableMetas = [...this._lt_tableMetas];

			const values = getSelTableValues();
			setSelTableValues(values);

			if (
				!values.includes(this._state.lt_ixTable)
				|| !curVal
				|| !curVal.tier || !curVal.rarity
			) return this._state.lt_ixTable = 0;

			// Try to restore the previous selection (as it may have moved due to the array resizing)
			const ix = this._lt_tableMetas.findIndex(it => it && it.tier === curVal.tier && it.rarity === curVal.rarity);
			if (~ix) this._state.lt_ixTable = ix;
			else this._state.lt_ixTable = 0;
		};
		this._stateManager.addHookBase("pulseItemsFiltered", hkPulseItem);

		const btnRoll = ee`<button class="ve-btn ve-btn-default ve-btn-xs mr-2">Roll Loot</button>`
			.onn("click", () => this._lt_pDoHandleClickRollLoot());

		const btnClear = ee`<button class="ve-btn ve-btn-danger ve-btn-xs">Clear Output</button>`
			.onn("click", () => this._outputManager.doClearOutput());

		const hrHelp = ee`<hr class="hr-3">`;
		const dispHelp = ee`<div class="ve-small italic"></div>`;
		const hrTable = ee`<hr class="hr-3">`;
		const dispTable = ee`<div class="ve-flex-col w-100"></div>`;

		const hkTable = () => {
			const tableMeta = this._lt_tableMetas[this._state.lt_ixTable];

			dispHelp.toggleVe(tableMeta != null);
			dispTable.toggleVe(tableMeta != null);
			hrHelp.toggleVe(tableMeta != null);
			hrTable.toggleVe(tableMeta != null);

			if (tableMeta == null) return;

			dispHelp.html(this._lt_getRenderedHelp({tableMeta}));
			dispTable.html(LootGenRender.er(tableMeta.tableEntry));
		};
		this._addHookBase("lt_ixTable", hkTable);
		hkTable();

		ee`<div class="ve-flex-col py-2 px-3">
			<label class="split-v-center mb-3">
				<div class="mr-2 w-66 no-shrink">Table</div>
				${selTable}
			</label>

			<div class="ve-flex-v-center mb-2">
				${btnRoll}
				${btnClear}
			</div>

			${hrHelp}
			${dispHelp}
			${hrTable}
			${dispTable}
		</div>`.appendTo(tabMeta.wrpTab);
	}

	_lt_getSelTableDisplay ({ix}) {
		const tblMeta = this._lt_tableMetas[ix];
		if (!tblMeta) return "\u2014";

		if (tblMeta.tier && tblMeta.rarity) return `Tier: ${this._lt_tableMetas[ix].tier}; Rarity: ${this._lt_tableMetas[ix].rarity}`;
		if (tblMeta.theme && tblMeta.rarity) return `Theme: ${this._lt_tableMetas[ix].theme}; Rarity: ${this._lt_tableMetas[ix].rarity}`;

		return tblMeta.tableEntry.caption;
	}

	_lt_getRenderedHelp ({tableMeta}) {
		switch (tableMeta.metaType) {
			case LOOT_TABLES_TYPE__DMG_MAGIC_ITEMS: return LootGenRender.er(`Based on the tables and rules in the {@book ${Parser.sourceJsonToFull(Parser.SRC_DMG)}|DMG|7|Treasure Tables}, pages 133-149.`);
			case LOOT_TABLES_TYPE__XGE_FAUX: return LootGenRender.er(`Tables auto-generated based on the rules in {@book ${Parser.sourceJsonToFull(Parser.SRC_XGE)} (Choosing Items Piecemeal)|XGE|2|choosing items piecemeal}, pages 135-136.`);
			case LOOT_TABLES_TYPE__XDMG_THEMES: return LootGenRender.er(`Based on the tables and rules in the {@book ${Parser.sourceJsonToFull(Parser.SRC_XDMG)}|XDMG|6|Random Magic Items}, pages 326-331.`);
			default: throw new Error(`Unhandled table meta-type "${tableMeta.metaType}"`);
		}
	}

	async _lt_pDoHandleClickRollLoot ({isTest = false} = {}) {
		const tableMeta = this._lt_tableMetas[this._state.lt_ixTable];
		if (!tableMeta) return JqueryUtil.doToast({type: "warning", content: `Please select a table first!`});

		const lootOutput = new this._ClsLootGenOutput({
			type: `Treasure Table Roll: ${this._lt_pDoHandleClickRollLoot_getTypePart({tableMeta})}`,
			name: this._lt_pDoHandleClickRollLoot_getNamePart({tableMeta}),
			magicItemsByTable: await this._lt_pDoHandleClickRollLoot_pGetMagicItemMetas({tableMeta, isTest}),
		});
		this._outputManager.doAddOutput({lootOutput});
	}

	_lt_pDoHandleClickRollLoot_getTypePart ({tableMeta}) {
		switch (tableMeta.metaType) {
			case LOOT_TABLES_TYPE__DMG_MAGIC_ITEMS: return tableMeta.tableEntry.caption;
			case LOOT_TABLES_TYPE__XGE_FAUX: return `${tableMeta.tier} ${tableMeta.rarity}`;
			case LOOT_TABLES_TYPE__XDMG_THEMES: return `${tableMeta.theme} ${tableMeta.rarity}`;
			default: throw new Error(`Unhandled table meta-type "${tableMeta.metaType}"`);
		}
	}

	_lt_pDoHandleClickRollLoot_getNamePart ({tableMeta}) {
		switch (tableMeta.metaType) {
			case LOOT_TABLES_TYPE__DMG_MAGIC_ITEMS: return `Rolled against {@b {@table ${tableMeta.tableEntry.caption}|${Parser.SRC_DMG}}}`;
			case LOOT_TABLES_TYPE__XGE_FAUX: return `Rolled on the table for {@b ${tableMeta.tier} ${tableMeta.rarity}} items`;
			case LOOT_TABLES_TYPE__XDMG_THEMES: return `Rolled on the table for {@b ${tableMeta.rarity} ${tableMeta.theme}}`;
			default: throw new Error(`Unhandled table meta-type "${tableMeta.metaType}"`);
		}
	}

	async _lt_pDoHandleClickRollLoot_pGetMagicItemMetas ({tableMeta, isTest = false}) {
		const breakdown = [];
		if (isTest) {
			await tableMeta.table.table
				.map(it => it.min)
				.pSerialAwaitMap(async rowRoll => {
					const lootItem = await LootGenMagicItem.pGetMagicItemRoll({
						dataManager: this._dataManager,
						lootGenMagicItems: breakdown,
						spells: this._dataManager.getDataSpellsFiltered(),
						magicItemTable: tableMeta.table,
						rowRoll,
					});
					breakdown.push(lootItem);
				});
		} else {
			const lootItem = await LootGenMagicItem.pGetMagicItemRoll({
				dataManager: this._dataManager,
				lootGenMagicItems: breakdown,
				spells: this._dataManager.getDataSpellsFiltered(),
				magicItemTable: tableMeta.table,
			});
			breakdown.push(lootItem);
		}

		return [
			new LootGenOutputMagicItems({
				type: tableMeta.type,
				tag: tableMeta.tag,
				count: breakdown.length,
				breakdown,
			}),
		];
	}

	_getDefaultState () {
		return {
			lt_ixTable: null,
		};
	}
}
