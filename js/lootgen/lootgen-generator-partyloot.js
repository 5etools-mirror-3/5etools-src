import {LootGenGeneratorBase} from "./lootgen-generator-base.js";
import {LootGenMagicItem} from "./lootgen-magicitem.js";
import {LootGenOutputMagicItems} from "./lootgen-output.js";
import {LootGenRender} from "./lootgen-render.js";

export class LootGenGeneratorPartyLoot extends LootGenGeneratorBase {
	static _PARTY_LOOT_LEVEL_RANGES = {
		4: "1\u20134",
		10: "5\u201310",
		16: "11\u201316",
		20: "17+",
	};

	static _PARTY_LOOT_ITEMS_PER_LEVEL = {
		1: {
			"major": {
				"uncommon": 0,
				"rare": 0,
				"very rare": 0,
				"legendary": 0,
			},
			"minor": {
				"common": 0,
				"uncommon": 0,
				"rare": 0,
				"very rare": 0,
				"legendary": 0,
			},
		},
		4: {
			"major": {
				"uncommon": 2,
				"rare": 0,
				"very rare": 0,
				"legendary": 0,
			},
			"minor": {
				"common": 6,
				"uncommon": 2,
				"rare": 1,
				"very rare": 0,
				"legendary": 0,
			},
		},
		10: {
			"major": {
				"uncommon": 5,
				"rare": 1,
				"very rare": 0,
				"legendary": 0,
			},
			"minor": {
				"common": 10,
				"uncommon": 12,
				"rare": 5,
				"very rare": 1,
				"legendary": 0,
			},
		},
		16: {
			"major": {
				"uncommon": 1,
				"rare": 2,
				"very rare": 2,
				"legendary": 1,
			},
			"minor": {
				"common": 3,
				"uncommon": 6,
				"rare": 9,
				"very rare": 5,
				"legendary": 1,
			},
		},
		20: {
			"major": {
				"uncommon": 0,
				"rare": 1,
				"very rare": 2,
				"legendary": 3,
			},
			"minor": {
				"common": 0,
				"uncommon": 0,
				"rare": 4,
				"very rare": 9,
				"legendary": 6,
			},
		},
	};

	identifier = "partyLoot";

	_pl_xgeTableLookup = null;

	setXgeTableLookup (val) { return this._pl_xgeTableLookup = val; }

	render ({tabMeta}) {
		const cbIsExactLevel = ComponentUiUtil.getCbBool(this, "pl_isExactLevel");

		const cbIsCumulative = ComponentUiUtil.getCbBool(this, "pl_isCumulative");

		// region Default
		const selCharLevel = ComponentUiUtil.getSelEnum(
			this,
			"pl_charLevel",
			{
				values: Object.keys(this.constructor._PARTY_LOOT_LEVEL_RANGES).map(it => Number(it)),
				fnDisplay: it => this.constructor._PARTY_LOOT_LEVEL_RANGES[it],
			},
		);

		const stgDefault = ee`<div class="ve-flex-col w-100">
			<label class="split-v-center mb-2">
				<div class="mr-2 w-66 no-shrink">Character Level</div>
				${selCharLevel}
			</label>
		</div>`;
		// endregion

		// region Exact level
		const sliderLevel = ComponentUiUtil.getSliderRange(
			this,
			{
				propMin: "pl_exactLevelMin",
				propMax: "pl_exactLevelMax",
				propCurMin: "pl_exactLevel",
			},
		);

		const stgExactLevel = ee`<div class="ve-flex-col w-100">
			<div class="ve-flex-col mb-2">
				<div class="mb-2">Character Level</div>
				${sliderLevel}
			</div>
		</div>`;
		// endregion

		// region Buttons
		const btnRoll = ee`<button class="ve-btn ve-btn-default ve-btn-xs mr-2">Roll Loot</button>`
			.onn("click", () => this._pl_pDoHandleClickRollLoot());

		const btnClear = ee`<button class="ve-btn ve-btn-danger ve-btn-xs">Clear Output</button>`
			.onn("click", () => this._outputManager.doClearOutput());
		// endregion

		const hkIsExactLevel = () => {
			stgDefault.toggleVe(!this._state.pl_isExactLevel);
			stgExactLevel.toggleVe(this._state.pl_isExactLevel);
		};
		this._addHookBase("pl_isExactLevel", hkIsExactLevel);
		hkIsExactLevel();

		ee`<div class="ve-flex-col py-2 px-3">
			<p>
				Generates a set of magical items for a party, based on the tables and rules in ${LootGenRender.er(`{@book Xanathar's Guide to Everything|XGE|2|awarding magic items}`)}, pages 135-136.
			</p>
			<p><i>If &quot;Exact Level&quot; is selected, the output will include a proportional number of items for any partially-completed tier.</i></p>

			<hr class="hr-3">

			${stgDefault}
			${stgExactLevel}

			<label class="split-v-center mb-2">
				<div class="mr-2 w-66 no-shrink">Cumulative with Previous Tiers</div>
				${cbIsCumulative}
			</label>

			<label class="split-v-center mb-3">
				<div class="mr-2 w-66 no-shrink">Is Exact Level</div>
				${cbIsExactLevel}
			</label>

			<div class="ve-flex-v-center mb-2">
				${btnRoll}
				${btnClear}
			</div>
		</div>`.appendTo(tabMeta.wrpTab);
	}

	async _pl_pDoHandleClickRollLoot () {
		const template = this._pl_getLootTemplate();
		const magicItemsByTable = [];

		for (const [tier, byRarity] of Object.entries(template)) {
			const breakdown = [];
			for (const [rarity, cntItems] of Object.entries(byRarity)) {
				const tableMeta = this._pl_xgeTableLookup[tier]?.[rarity];

				for (let i = 0; i < cntItems; ++i) {
					const lootItem = await LootGenMagicItem.pGetMagicItemRoll({
						dataManager: this._dataManager,
						lootGenMagicItems: breakdown,
						spells: this._dataManager.getDataSpellsFiltered(),
						magicItemTable: tableMeta,
					});
					breakdown.push(lootItem);
				}
			}

			magicItemsByTable.push(
				new LootGenOutputMagicItems({
					count: breakdown.length,
					breakdown,
					tier,
				}),
			);
		}

		const ptLevel = this._state.pl_isExactLevel
			? this._state.pl_exactLevel
			: this.constructor._PARTY_LOOT_LEVEL_RANGES[this._state.pl_charLevel];
		const lootOutput = new this._ClsLootGenOutput({
			type: `Party Loot: Level ${ptLevel}`,
			name: `Magic items for a {@b Level ${ptLevel}} Party`,
			magicItemsByTable,
		});
		this._outputManager.doAddOutput({lootOutput});
	}

	_pl_getLootTemplate () {
		const {template, levelLow} = this._state.pl_isExactLevel
			? this._pl_getLootTemplate_exactLevel()
			: {template: MiscUtil.copy(this.constructor._PARTY_LOOT_ITEMS_PER_LEVEL[this._state.pl_charLevel]), levelLow: this._state.pl_charLevel};

		if (this._state.pl_isCumulative) this._pl_mutAccumulateLootTemplate({template, levelLow});

		return template;
	}

	_pl_getLootTemplate_exactLevel () {
		if (this.constructor._PARTY_LOOT_ITEMS_PER_LEVEL[this._state.pl_exactLevel]) {
			return {
				template: MiscUtil.copy(this.constructor._PARTY_LOOT_ITEMS_PER_LEVEL[this._state.pl_exactLevel]),
				levelLow: this._state.pl_exactLevel,
			};
		}

		let levelLow = 1;
		let levelHigh = 20;

		Object.keys(this.constructor._PARTY_LOOT_ITEMS_PER_LEVEL)
			.forEach(level => {
				level = Number(level);

				if (level < this._state.pl_exactLevel && (this._state.pl_exactLevel - level) < (this._state.pl_exactLevel - levelLow)) {
					levelLow = level;
				}

				if (level > this._state.pl_exactLevel && (level - this._state.pl_exactLevel) < (levelHigh - this._state.pl_exactLevel)) {
					levelHigh = level;
				}
			});

		const templateLow = MiscUtil.copy(this.constructor._PARTY_LOOT_ITEMS_PER_LEVEL[levelLow]);
		const templateHigh = MiscUtil.copy(this.constructor._PARTY_LOOT_ITEMS_PER_LEVEL[levelHigh]);

		const ratio = (this._state.pl_exactLevel - levelLow) / (levelHigh - levelLow);

		const out = {major: {}, minor: {}};
		Object.entries(out)
			.forEach(([tier, byTier]) => {
				Object.keys(templateLow[tier])
					.forEach(rarity => {
						byTier[rarity] = Math.floor(
							((templateLow[tier]?.[rarity] || 0) * (1 - ratio))
							+ ((templateHigh[tier]?.[rarity] || 0) * ratio),
						);
					});
			});
		return {template: out, levelLow};
	}

	_pl_mutAccumulateLootTemplate ({template, levelLow}) {
		const toAccumulate = Object.keys(this.constructor._PARTY_LOOT_ITEMS_PER_LEVEL)
			.filter(it => Number(it) < levelLow);
		if (!toAccumulate.length) return;

		toAccumulate.forEach(level => {
			Object.entries(this.constructor._PARTY_LOOT_ITEMS_PER_LEVEL[level])
				.forEach(([tier, byRarity]) => {
					Object.entries(byRarity)
						.forEach(([rarity, cntItems]) => {
							const existing = MiscUtil.get(template, tier, rarity) || 0;
							MiscUtil.set(template, tier, rarity, existing + (cntItems || 0));
						});
				});
		});
	}

	_getDefaultState () {
		return {
			pl_isExactLevel: false,
			pl_isCumulative: false,

			pl_charLevel: 4,

			pl_exactLevelMin: 1,
			pl_exactLevelMax: 20,
			pl_exactLevel: 1,
		};
	}
}
