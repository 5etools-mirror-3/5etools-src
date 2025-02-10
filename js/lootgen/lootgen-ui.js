import {LootGenOutput, LootGenOutputDragonMundaneItems, LootGenOutputGemsArtObjects, LootGenOutputMagicItems} from "./lootgen-output.js";
import {LootGenMagicItem} from "./lootgen-magicitem.js";
import {
	LOOT_TABLES_TYPE__DMG_MAGIC_ITEMS,
	LOOT_TABLES_TYPE__XGE_FAUX,
	LOOT_TABLES_TYPE__XDMG_THEMES,
} from "./lootgen-const.js";
import {PILL_STATE__IGNORE} from "../filter/filter-constants.js";

export class LootGenUi extends BaseComponent {
	static _CHALLENGE_RATING_RANGES = {
		0: "0\u20134",
		5: "5\u201310",
		11: "11\u201316",
		17: "17+",
	};
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
	static _DRAGON_AGES = [
		"Wyrmling",
		"Young",
		"Adult",
		"Ancient",
	];

	constructor ({spells, items, ClsLootGenOutput}) {
		super();

		TabUiUtil.decorate(this, {isInitMeta: true});

		this._ClsLootGenOutput = ClsLootGenOutput || LootGenOutput;

		this._modalFilterSpells = new ModalFilterSpells({namespace: "LootGenUi.spells", allData: spells});
		this._modalFilterItems = new ModalFilterItems({
			namespace: "LootGenUi.items",
			allData: items,
		});

		this._data = null;
		this._dataSpells = spells;
		this._dataItems = items;

		this._dataSpellsFiltered = [...spells];
		this._dataItemsFiltered = [...items];
		this._dataItemsFilteredLegacy = [...items];

		this._lt_tableMetas = null;

		this._pl_xgeTableLookup = null;

		this._$wrpOutputRows = null;
		this._lootOutputs = [];
	}

	static _er (...args) { return Renderer.get().setFirstSection(true).render(...args); }

	getSaveableState () {
		return {
			...super.getSaveableState(),
			meta: this.__meta,
		};
	}

	setStateFrom (toLoad, isOverwrite = false) {
		super.setStateFrom(toLoad, isOverwrite);
		toLoad.meta && this._proxyAssignSimple("meta", toLoad.meta, isOverwrite);
	}

	addHookAll (hookProp, hook) { return this._addHookAll(hookProp, hook); }

	async pInit () {
		await this._modalFilterSpells.pPopulateHiddenWrapper();
		await this._modalFilterItems.pPopulateHiddenWrapper();

		this._data = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/loot.json`);

		await this._pInit_pBindFilterHooks();
	}

	async _pInit_pBindFilterHooks () {
		const tablesMagicItemsDmg = await ["A", "B", "C", "D", "E", "F", "G", "H", "I"]
			.pMap(async type => {
				return {
					type,
					tableEntry: await DataLoader.pCacheAndGet(UrlUtil.PG_TABLES, Parser.SRC_DMG, UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_TABLES]({name: `Magic Item Table ${type}`, source: Parser.SRC_DMG})),
				};
			});

		const tablesMagicItemsXdmg = await ["Arcana", "Armaments", "Implements", "Relics"]
			.flatMap(theme => {
				return ["Common", "Uncommon", "Rare", "Very Rare", "Legendary"]
					.map(rarity => ({
						name: `${theme} - ${rarity}`,
						type: `${theme.toLowerCase()}.${rarity.toLowerCase()}`,
						theme,
						rarity,
					}));
			})
			.pMap(async info => ({
				type: info.type,
				theme: info.theme,
				rarity: info.rarity,
				tableEntry: await DataLoader.pCacheAndGet(UrlUtil.PG_TABLES, Parser.SRC_XDMG, UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_TABLES]({name: info.name, source: Parser.SRC_XDMG})),
			}));

		const hkFilterChangeSpells = () => this._handleFilterChangeSpells();
		this._modalFilterSpells.pageFilter.filterBox.on(FILTER_BOX_EVNT_VALCHANGE, hkFilterChangeSpells);
		hkFilterChangeSpells();

		const hkFilterChangeItems = () => this._handleFilterChangeItems({
			tablesMagicItemsDmg,
			tablesMagicItemsXdmg,
		});
		this._modalFilterItems.pageFilter.filterBox.on(FILTER_BOX_EVNT_VALCHANGE, hkFilterChangeItems);
		hkFilterChangeItems();
	}

	_handleFilterChangeSpells () {
		const f = this._modalFilterSpells.pageFilter.filterBox.getValues();
		this._dataSpellsFiltered = this._dataSpells.filter(it => this._modalFilterSpells.pageFilter.toDisplay(f, it));

		this._state.pulseSpellsFiltered = !this._state.pulseSpellsFiltered;
	}

	_handleFilterChangeItems (
		{
			tablesMagicItemsDmg,
			tablesMagicItemsXdmg,
		},
	) {
		const f = this._modalFilterItems.pageFilter.filterBox.getValues();
		this._dataItemsFiltered = this._dataItems.filter(it => this._modalFilterItems.pageFilter.toDisplay(f, it));

		const filterExpression = this._modalFilterItems.pageFilter.filterBox.getFilterTagExpression({isAddSearchTerm: false});
		this._dataItemsFilteredLegacy = this._modalFilterItems.getEntitiesMatchingFilterExpression({
			filterExpression,
			valuesOverride: {
				"Miscellaneous": {
					"Reprinted": PILL_STATE__IGNORE,
				},
			},
		});

		const xgeTables = this._getXgeFauxTables();

		this._lt_tableMetas = [
			null,
			...tablesMagicItemsXdmg.map(({type, theme, rarity, tableEntry}) => {
				tableEntry = MiscUtil.copy(tableEntry);
				tableEntry.type = "table";
				delete tableEntry.chapter;
				return {
					type,
					metaType: LOOT_TABLES_TYPE__XDMG_THEMES,
					theme,
					rarity,
					tableEntry,
					table: this._data.magicItems.find(it => it.type === type),
					tag: `{@table ${theme} - ${rarity}|XDMG|${theme} - ${rarity}}`,
				};
			}),
			...tablesMagicItemsDmg.map(({type, tableEntry}) => {
				tableEntry = MiscUtil.copy(tableEntry);
				tableEntry.type = "table";
				delete tableEntry.chapter;
				return {
					type,
					metaType: LOOT_TABLES_TYPE__DMG_MAGIC_ITEMS,
					tableEntry,
					table: this._data.magicItems.find(it => it.type === type),
					tag: `{@table Magic Item Table ${type}||Table ${type}}`,
				};
			}),
			...xgeTables,
		];

		this._pl_xgeTableLookup = {};
		xgeTables.forEach(({tier, rarity, table}) => MiscUtil.set(this._pl_xgeTableLookup, tier, rarity, table));

		this._state.pulseItemsFiltered = !this._state.pulseItemsFiltered;
	}

	/** Create fake tables for the XGE rules */
	_getXgeFauxTables () {
		const byTier = {};

		// Use "legacy" item set, as "tier" info no longer used
		this._dataItemsFilteredLegacy
			.forEach(item => {
				const tier = item.tier || "other";
				const rarity = item.rarity || (Renderer.item.isMundane(item) ? "unknown" : "unknown (magic)");
				const tgt = MiscUtil.getOrSet(byTier, tier, rarity, []);
				tgt.push(item);
			});

		return Object.entries(byTier)
			.map(([tier, byRarity]) => {
				return Object.entries(byRarity)
					.sort(([rarityA], [rarityB]) => SortUtil.ascSortItemRarity(rarityA, rarityB))
					.map(([rarity, items]) => {
						const isMundane = Renderer.item.isMundane({rarity});

						const caption = tier === "other"
							? `Other ${isMundane ? "mundane" : "magic"} items of ${rarity} rarity`
							: `${tier.toTitleCase()}-tier ${isMundane ? "mundane" : "magic"} items of ${rarity} rarity`;

						return {
							metaType: LOOT_TABLES_TYPE__XGE_FAUX,
							type: `${tier}.${rarity}`,
							tier,
							rarity,

							tableEntry: {
								type: "table",
								caption,
								colLabels: [
									`d${items.length}`,
									"Item",
								],
								colStyles: [
									"col-2 text-center",
									"col-10",
								],
								rows: items.map((it, i) => ([i + 1, `{@item ${it.name}|${it.source}}`])),
							},

							table: {
								name: caption,
								source: Parser.SRC_XGE,
								page: 135,
								diceType: items.length,
								table: items.map((it, i) => ({min: i + 1, max: i + 1, item: `{@item ${it.name}|${it.source}}`})),
							},
						};
					});
			})
			.flat();
	}

	render ({$stg, $stgLhs, $stgRhs}) {
		if ($stg && ($stgLhs || $stgRhs)) throw new Error(`Only one of "parent stage" and "LHS/RHS stages" may be specified!`);

		const {$stgLhs: $stgLhs_, $stgRhs: $stgRhs_} = this._render_$getStages({$stg, $stgLhs, $stgRhs});

		const iptTabMetas = [
			new TabUiUtil.TabMeta({name: "Random Treasure by CR", hasBorder: true, hasBackground: true}),
			new TabUiUtil.TabMeta({name: "Loot Tables", hasBorder: true, hasBackground: true}),
			new TabUiUtil.TabMeta({name: "Party Loot", hasBorder: true, hasBackground: true}),
			new TabUiUtil.TabMeta({name: "Dragon Hoard", hasBorder: true, hasBackground: true}),
			new TabUiUtil.TabMeta({name: "Gems/Art Objects Generator", isHeadHidden: true, hasBackground: true}),
			new TabUiUtil.TabMeta({
				type: "buttons",
				isSplitStart: true,
				buttons: [
					{
						html: `<span class="glyphicon glyphicon-option-vertical"></span>`,
						title: "Other Generators",
						type: "default",
						pFnClick: null, // This is assigned later
					},
				],
			}),
		];

		const tabMetas = this._renderTabs(iptTabMetas, {$parent: $stgLhs_});
		const [tabMetaFindTreasure, tabMetaLootTables, tabMetaPartyLoot, tabMetaDragonHoard, tabMetaGemsArtObjects, tabMetaOptions] = tabMetas;

		this._render_tabFindTreasure({tabMeta: tabMetaFindTreasure});
		this._render_tabLootTables({tabMeta: tabMetaLootTables});
		this._render_tabPartyLoot({tabMeta: tabMetaPartyLoot});
		this._render_tabDragonHoard({tabMeta: tabMetaDragonHoard});
		this._render_tabGemsArtObjects({tabMeta: tabMetaGemsArtObjects});
		this._render_tabOptions({tabMeta: tabMetaOptions, tabMetaGemsArtObjects});

		this._render_output({$wrp: $stgRhs_});
	}

	/**
	 * If we have been provided an existing pair of left-/right-hand stages, use them.
	 * Otherwise, render a two-column UI, and return each column as a stage.
	 * This allows us to cater for both the pre-baked layout of the Lootgen page, and other, more general,
	 *   components.
	 */
	_render_$getStages ({$stg, $stgLhs, $stgRhs}) {
		if (!$stg) return {$stgLhs, $stgRhs};

		$stgLhs = $(`<div class="ve-flex w-50 h-100"></div>`);
		$stgRhs = $(`<div class="ve-flex-col w-50 h-100"></div>`);

		$$`<div class="ve-flex w-100 h-100">
			${$stgLhs}
			<div class="vr-2 h-100"></div>
			${$stgRhs}
		</div>`.appendTo($stg.empty());

		return {$stgLhs, $stgRhs};
	}

	_render_tabFindTreasure ({tabMeta}) {
		const $selChallenge = ComponentUiUtil.$getSelEnum(
			this,
			"ft_challenge",
			{
				values: Object.keys(LootGenUi._CHALLENGE_RATING_RANGES).map(it => Number(it)),
				fnDisplay: it => LootGenUi._CHALLENGE_RATING_RANGES[it],
			},
		);

		const $cbIsHoard = ComponentUiUtil.$getCbBool(this, "ft_isHoard");

		const $btnRoll = $(`<button class="ve-btn ve-btn-default ve-btn-xs mr-2">Roll Loot</button>`)
			.click(() => this._ft_pDoHandleClickRollLoot());

		const $btnClear = $(`<button class="ve-btn ve-btn-danger ve-btn-xs">Clear Output</button>`)
			.click(() => this._doClearOutput());

		$$`<div class="ve-flex-col py-2 px-3">
			<label class="split-v-center mb-2">
				<div class="mr-2 w-66 no-shrink">Challenge Rating</div>
				${$selChallenge}
			</label>

			<label class="split-v-center mb-3">
				<div class="mr-2 w-66 no-shrink">Is Treasure Hoard?</div>
				${$cbIsHoard}
			</label>

			<div class="ve-flex-v-center mb-2">
				${$btnRoll}
				${$btnClear}
			</div>

			<hr class="hr-3">

			<div class="ve-small italic">${this.constructor._er(`Based on the tables and rules in the {@book ${Parser.sourceJsonToFull(Parser.SRC_DMG)}|DMG|7|Treasure Tables}`)}, pages 133-149.</div>
		</div>`.appendTo(tabMeta.$wrpTab);
	}

	_ft_pDoHandleClickRollLoot () {
		if (this._state.ft_isHoard) return this._ft_doHandleClickRollLoot_pHoard();
		return this._ft_doHandleClickRollLoot_single();
	}

	_ft_doHandleClickRollLoot_single () {
		const tableMeta = this._data.individual.find(it => it.crMin === this._state.ft_challenge);

		const rowRoll = RollerUtil.randomise(100);
		const row = tableMeta.table.find(it => rowRoll >= it.min && rowRoll <= it.max);

		const coins = this._getConvertedCoins(
			Object.entries(row.coins)
				.mergeMap(([type, formula]) => ({[type]: Renderer.dice.parseRandomise2(formula)})),
		);

		const lootOutput = new this._ClsLootGenOutput({
			type: `Individual Treasure: ${LootGenUi._CHALLENGE_RATING_RANGES[this._state.ft_challenge]}`,
			name: `{@b Individual Treasure} for challenge rating {@b ${LootGenUi._CHALLENGE_RATING_RANGES[this._state.ft_challenge]}}`,
			coins,
		});
		this._doAddOutput({lootOutput});
	}

	async _ft_doHandleClickRollLoot_pHoard () {
		const tableMeta = this._data.hoard.find(it => it.crMin === this._state.ft_challenge);

		const rowRoll = RollerUtil.randomise(100);
		const row = tableMeta.table.find(it => rowRoll >= it.min && rowRoll <= it.max);

		const coins = this._getConvertedCoins(
			Object.entries(tableMeta.coins || {})
				.mergeMap(([type, formula]) => ({[type]: Renderer.dice.parseRandomise2(formula)})),
		);

		const gems = this._doHandleClickRollLoot_hoard_gemsArtObjects({row, prop: "gems"});
		const artObjects = this._doHandleClickRollLoot_hoard_gemsArtObjects({row, prop: "artObjects"});
		const magicItemsByTable = await this._doHandleClickRollLoot_hoard_pMagicItems({row});

		const lootOutput = new this._ClsLootGenOutput({
			type: `Treasure Hoard: ${LootGenUi._CHALLENGE_RATING_RANGES[this._state.ft_challenge]}`,
			name: `{@b Hoard} for challenge rating {@b ${LootGenUi._CHALLENGE_RATING_RANGES[this._state.ft_challenge]}}`,
			coins,
			gems,
			artObjects,
			magicItemsByTable,
		});
		this._doAddOutput({lootOutput});
	}

	_doHandleClickRollLoot_hoard_gemsArtObjects ({row, prop}) {
		if (!row[prop]) return null;

		const lootMeta = row[prop];

		const {type, typeRoll} = this._doHandleClickRollLoot_hoard_gemsArtObjects_getTypeInfo({lootMeta});

		const specificTable = this._data[prop].find(it => it.type === type);
		const count = Renderer.dice.parseRandomise2(lootMeta.amount);

		const breakdown = {};
		[...new Array(count)]
			.forEach(() => {
				const type = RollerUtil.rollOnArray(specificTable.table);
				breakdown[type] = (breakdown[type] || 0) + 1;
			});

		return [
			new LootGenOutputGemsArtObjects({
				type,
				typeRoll,
				typeTable: lootMeta.typeTable,
				count,
				breakdown,
			}),
		];
	}

	/** Alternate version, which rolls for type for each item. */
	_doHandleClickRollLoot_hoard_gemsArtObjectsMulti ({row, prop}) {
		if (!row[prop]) return null;

		const lootMeta = row[prop];

		const count = Renderer.dice.parseRandomise2(lootMeta.amount);

		const byType = {};

		[...new Array(count)]
			.forEach(() => {
				const {type} = this._doHandleClickRollLoot_hoard_gemsArtObjects_getTypeInfo({lootMeta});

				if (!byType[type]) {
					byType[type] = {
						breakdown: {},
						count: 0,
					};
				}

				const meta = byType[type];

				meta.count++;

				const specificTable = this._data[prop].find(it => it.type === type);

				const type2 = RollerUtil.rollOnArray(specificTable.table);
				meta.breakdown[type2] = (meta.breakdown[type2] || 0) + 1;
			});

		return Object.entries(byType)
			.map(([type, meta]) => {
				return new LootGenOutputGemsArtObjects({
					type,
					typeRoll: null,
					typeTable: lootMeta.typeTable,
					count: meta.count,
					breakdown: meta.breakdown,
				});
			});
	}

	_doHandleClickRollLoot_hoard_gemsArtObjects_getTypeInfo ({lootMeta}) {
		if (lootMeta.type) return {type: lootMeta.type};

		const typeRoll = RollerUtil.randomise(100);
		const typeMeta = lootMeta.typeTable.find(it => typeRoll >= it.min && typeRoll <= it.max);
		return {type: typeMeta.type, typeRoll};
	}

	async _doHandleClickRollLoot_hoard_pMagicItems ({row, fnGetIsPreferAltChoose = null}) {
		if (!row.magicItems) return null;

		return row.magicItems.pMap(async magicItemsObj => {
			const {type, typeRoll, typeAltChoose} = this._doHandleClickRollLoot_hoard_pMagicItems_getTypeInfo({magicItemsObj});

			const magicItemTable = this._data.magicItems.find(it => it.type === type);
			const count = Renderer.dice.parseRandomise2(magicItemsObj.amount);
			const itemsAltChoose = this._doHandleClickRollLoot_hoard_getAltChooseList({typeAltChoose});
			const itemsAltChooseDisplayText = this._doHandleClickRollLoot_hoard_getAltChooseDisplayText({typeAltChoose});

			const breakdown = [];

			await ([...new Array(count)].pSerialAwaitMap(async () => {
				const lootItem = await LootGenMagicItem.pGetMagicItemRoll({
					lootGenMagicItems: breakdown,
					spells: this._dataSpellsFiltered,
					magicItemTable,
					itemsAltChoose,
					itemsAltChooseDisplayText,
					isItemsAltChooseRoll: fnGetIsPreferAltChoose ? fnGetIsPreferAltChoose() : false,
					fnGetIsPreferAltChoose,
				});
				breakdown.push(lootItem);
			}));

			return new LootGenOutputMagicItems({
				type,
				count,
				typeRoll,
				typeTable: magicItemsObj.typeTable,
				breakdown,
			});
		});
	}

	async _doHandleClickRollLoot_hoard_pMagicItemsMulti ({row, fnGetIsPreferAltChoose = null}) {
		if (!row.magicItems) return null;

		const byType = {};

		await row.magicItems.pMap(async magicItemsObj => {
			const count = Renderer.dice.parseRandomise2(magicItemsObj.amount);

			await [...new Array(count)]
				.pSerialAwaitMap(async () => {
					const {type, typeAltChoose} = this._doHandleClickRollLoot_hoard_pMagicItems_getTypeInfo({magicItemsObj});

					if (!byType[type]) {
						byType[type] = {
							breakdown: [],
							count: 0,
							typeTable: magicItemsObj.typeTable,
						};
					}

					const meta = byType[type];

					const magicItemTable = this._data.magicItems.find(it => it.type === type);
					const itemsAltChoose = this._doHandleClickRollLoot_hoard_getAltChooseList({typeAltChoose});
					const itemsAltChooseDisplayText = this._doHandleClickRollLoot_hoard_getAltChooseDisplayText({typeAltChoose});

					const lootItem = await LootGenMagicItem.pGetMagicItemRoll({
						lootGenMagicItems: meta.breakdown,
						spells: this._dataSpellsFiltered,
						magicItemTable,
						itemsAltChoose,
						itemsAltChooseDisplayText,
						isItemsAltChooseRoll: fnGetIsPreferAltChoose ? fnGetIsPreferAltChoose() : false,
						fnGetIsPreferAltChoose,
					});
					meta.breakdown.push(lootItem);
				});
		});

		return Object.entries(byType)
			.map(([type, meta]) => {
				return new LootGenOutputMagicItems({
					type,
					count: meta.count,
					typeRoll: null,
					typeTable: meta.typeTable,
					breakdown: meta.breakdown,
				});
			});
	}

	_doHandleClickRollLoot_hoard_pMagicItems_getTypeInfo ({magicItemsObj}) {
		if (magicItemsObj.type) return {type: magicItemsObj.type, typeAltChoose: magicItemsObj.typeAltChoose};

		const typeRoll = RollerUtil.randomise(100);
		const typeMeta = magicItemsObj.typeTable.find(it => typeRoll >= it.min && typeRoll <= it.max);
		return {type: typeMeta.type, typeRoll, typeAltChoose: typeMeta.typeAltChoose};
	}

	_doHandleClickRollLoot_hoard_getAltChooseList ({typeAltChoose}) {
		if (!typeAltChoose) return null;
		return this._dataItemsFiltered
			.filter(it => (!it.type || DataUtil.itemType.unpackUid(it.type).abbreviation !== Parser.ITM_TYP_ABV__GENERIC_VARIANT) && Object.entries(typeAltChoose).every(([k, v]) => it[k] === v));
	}

	_doHandleClickRollLoot_hoard_getAltChooseDisplayText ({typeAltChoose}) {
		if (!typeAltChoose) return null;
		return [
			typeAltChoose.rarity,
			typeAltChoose.tier,
		].filter(Boolean).join(" ");
	}

	_render_tabLootTables ({tabMeta}) {
		let cacheTableMetas = [...this._lt_tableMetas];

		const getSelTableValues = () => this._lt_tableMetas.map((_, i) => i);

		const {$sel: $selTable, setValues: setSelTableValues} = ComponentUiUtil.$getSelEnum(
			this,
			"lt_ixTable",
			{
				asMeta: true,
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
		this._addHookBase("pulseItemsFiltered", hkPulseItem);

		const $btnRoll = $(`<button class="ve-btn ve-btn-default ve-btn-xs mr-2">Roll Loot</button>`)
			.on("click", () => this._lt_pDoHandleClickRollLoot());

		const $btnClear = $(`<button class="ve-btn ve-btn-danger ve-btn-xs">Clear Output</button>`)
			.on("click", () => this._doClearOutput());

		const $hrHelp = $(`<hr class="hr-3">`);
		const $dispHelp = $(`<div class="ve-small italic"></div>`);
		const $hrTable = $(`<hr class="hr-3">`);
		const $dispTable = $(`<div class="ve-flex-col w-100"></div>`);

		const hkTable = () => {
			const tableMeta = this._lt_tableMetas[this._state.lt_ixTable];

			$dispHelp.toggleVe(tableMeta != null);
			$dispTable.toggleVe(tableMeta != null);
			$hrHelp.toggleVe(tableMeta != null);
			$hrTable.toggleVe(tableMeta != null);

			if (tableMeta == null) return;

			$dispHelp.html(this._lt_getRenderedHelp({tableMeta}));
			$dispTable.html(this.constructor._er(tableMeta.tableEntry));
		};
		this._addHookBase("lt_ixTable", hkTable);
		hkTable();

		$$`<div class="ve-flex-col py-2 px-3">
			<label class="split-v-center mb-3">
				<div class="mr-2 w-66 no-shrink">Table</div>
				${$selTable}
			</label>

			<div class="ve-flex-v-center mb-2">
				${$btnRoll}
				${$btnClear}
			</div>

			${$hrHelp}
			${$dispHelp}
			${$hrTable}
			${$dispTable}
		</div>`.appendTo(tabMeta.$wrpTab);
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
			case LOOT_TABLES_TYPE__DMG_MAGIC_ITEMS: return this.constructor._er(`Based on the tables and rules in the {@book ${Parser.sourceJsonToFull(Parser.SRC_DMG)}|DMG|7|Treasure Tables}, pages 133-149.`);
			case LOOT_TABLES_TYPE__XGE_FAUX: return this.constructor._er(`Tables auto-generated based on the rules in {@book ${Parser.sourceJsonToFull(Parser.SRC_XGE)} (Choosing Items Piecemeal)|XGE|2|choosing items piecemeal}, pages 135-136.`);
			case LOOT_TABLES_TYPE__XDMG_THEMES: return this.constructor._er(`Based on the tables and rules in the {@book ${Parser.sourceJsonToFull(Parser.SRC_XDMG)}|XDMG|6|Random Magic Items}, pages 326-331.`);
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
		this._doAddOutput({lootOutput});
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
						lootGenMagicItems: breakdown,
						spells: this._dataSpellsFiltered,
						magicItemTable: tableMeta.table,
						rowRoll,
					});
					breakdown.push(lootItem);
				});
		} else {
			const lootItem = await LootGenMagicItem.pGetMagicItemRoll({
				lootGenMagicItems: breakdown,
				spells: this._dataSpellsFiltered,
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

	_render_tabPartyLoot ({tabMeta}) {
		const $cbIsExactLevel = ComponentUiUtil.$getCbBool(this, "pl_isExactLevel");

		const $cbIsCumulative = ComponentUiUtil.$getCbBool(this, "pl_isCumulative");

		// region Default
		const $selCharLevel = ComponentUiUtil.$getSelEnum(
			this,
			"pl_charLevel",
			{
				values: Object.keys(LootGenUi._PARTY_LOOT_LEVEL_RANGES).map(it => Number(it)),
				fnDisplay: it => LootGenUi._PARTY_LOOT_LEVEL_RANGES[it],
			},
		);

		const $stgDefault = $$`<div class="ve-flex-col w-100">
			<label class="split-v-center mb-2">
				<div class="mr-2 w-66 no-shrink">Character Level</div>
				${$selCharLevel}
			</label>
		</div>`;
		// endregion

		// region Exact level
		const $sliderLevel = ComponentUiUtil.$getSliderRange(
			this,
			{
				propMin: "pl_exactLevelMin",
				propMax: "pl_exactLevelMax",
				propCurMin: "pl_exactLevel",
			},
		);

		const $stgExactLevel = $$`<div class="ve-flex-col w-100">
			<div class="ve-flex-col mb-2">
				<div class="mb-2">Character Level</div>
				${$sliderLevel}
			</div>
		</div>`;
		// endregion

		// region Buttons
		const $btnRoll = $(`<button class="ve-btn ve-btn-default ve-btn-xs mr-2">Roll Loot</button>`)
			.click(() => this._pl_pDoHandleClickRollLoot());

		const $btnClear = $(`<button class="ve-btn ve-btn-danger ve-btn-xs">Clear Output</button>`)
			.click(() => this._doClearOutput());
		// endregion

		const hkIsExactLevel = () => {
			$stgDefault.toggleVe(!this._state.pl_isExactLevel);
			$stgExactLevel.toggleVe(this._state.pl_isExactLevel);
		};
		this._addHookBase("pl_isExactLevel", hkIsExactLevel);
		hkIsExactLevel();

		$$`<div class="ve-flex-col py-2 px-3">
			<p>
				Generates a set of magical items for a party, based on the tables and rules in ${this.constructor._er(`{@book Xanathar's Guide to Everything|XGE|2|awarding magic items}`)}, pages 135-136.
			</p>
			<p><i>If &quot;Exact Level&quot; is selected, the output will include a proportional number of items for any partially-completed tier.</i></p>

			<hr class="hr-3">

			${$stgDefault}
			${$stgExactLevel}

			<label class="split-v-center mb-2">
				<div class="mr-2 w-66 no-shrink">Cumulative with Previous Tiers</div>
				${$cbIsCumulative}
			</label>

			<label class="split-v-center mb-3">
				<div class="mr-2 w-66 no-shrink">Is Exact Level</div>
				${$cbIsExactLevel}
			</label>

			<div class="ve-flex-v-center mb-2">
				${$btnRoll}
				${$btnClear}
			</div>
		</div>`.appendTo(tabMeta.$wrpTab);
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
						lootGenMagicItems: breakdown,
						spells: this._dataSpellsFiltered,
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
			: LootGenUi._PARTY_LOOT_LEVEL_RANGES[this._state.pl_charLevel];
		const lootOutput = new this._ClsLootGenOutput({
			type: `Party Loot: Level ${ptLevel}`,
			name: `Magic items for a {@b Level ${ptLevel}} Party`,
			magicItemsByTable,
		});
		this._doAddOutput({lootOutput});
	}

	_pl_getLootTemplate () {
		const {template, levelLow} = this._state.pl_isExactLevel
			? this._pl_getLootTemplate_exactLevel()
			: {template: MiscUtil.copy(LootGenUi._PARTY_LOOT_ITEMS_PER_LEVEL[this._state.pl_charLevel]), levelLow: this._state.pl_charLevel};

		if (this._state.pl_isCumulative) this._pl_mutAccumulateLootTemplate({template, levelLow});

		return template;
	}

	_pl_getLootTemplate_exactLevel () {
		if (LootGenUi._PARTY_LOOT_ITEMS_PER_LEVEL[this._state.pl_exactLevel]) {
			return {
				template: MiscUtil.copy(LootGenUi._PARTY_LOOT_ITEMS_PER_LEVEL[this._state.pl_exactLevel]),
				levelLow: this._state.pl_exactLevel,
			};
		}

		let levelLow = 1;
		let levelHigh = 20;

		Object.keys(LootGenUi._PARTY_LOOT_ITEMS_PER_LEVEL)
			.forEach(level => {
				level = Number(level);

				if (level < this._state.pl_exactLevel && (this._state.pl_exactLevel - level) < (this._state.pl_exactLevel - levelLow)) {
					levelLow = level;
				}

				if (level > this._state.pl_exactLevel && (level - this._state.pl_exactLevel) < (levelHigh - this._state.pl_exactLevel)) {
					levelHigh = level;
				}
			});

		const templateLow = MiscUtil.copy(LootGenUi._PARTY_LOOT_ITEMS_PER_LEVEL[levelLow]);
		const templateHigh = MiscUtil.copy(LootGenUi._PARTY_LOOT_ITEMS_PER_LEVEL[levelHigh]);

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
		const toAccumulate = Object.keys(LootGenUi._PARTY_LOOT_ITEMS_PER_LEVEL)
			.filter(it => Number(it) < levelLow);
		if (!toAccumulate.length) return;

		toAccumulate.forEach(level => {
			Object.entries(LootGenUi._PARTY_LOOT_ITEMS_PER_LEVEL[level])
				.forEach(([tier, byRarity]) => {
					Object.entries(byRarity)
						.forEach(([rarity, cntItems]) => {
							const existing = MiscUtil.get(template, tier, rarity) || 0;
							MiscUtil.set(template, tier, rarity, existing + (cntItems || 0));
						});
				});
		});
	}

	_render_tabDragonHoard ({tabMeta}) {
		const $selDragonAge = ComponentUiUtil.$getSelEnum(
			this,
			"dh_dragonAge",
			{
				values: LootGenUi._DRAGON_AGES,
			},
		);

		const $cbIsPreferRandomMagicItems = ComponentUiUtil.$getCbBool(this, "dh_isPreferRandomMagicItems");

		const $btnRoll = $(`<button class="ve-btn ve-btn-default ve-btn-xs mr-2">Roll Loot</button>`)
			.click(() => this._dh_pDoHandleClickRollLoot());

		const $btnClear = $(`<button class="ve-btn ve-btn-danger ve-btn-xs">Clear Output</button>`)
			.click(() => this._doClearOutput());

		$$`<div class="ve-flex-col py-2 px-3">
			<label class="split-v-center mb-2">
				<div class="mr-2 w-66 no-shrink">Dragon Age</div>
				${$selDragonAge}
			</label>

			<label class="split-v-center mb-3">
				<div class="mr-2 w-66 no-shrink" title="If selected, random magic items will be preferred over rolling on the standard ${Parser.sourceJsonToAbv(Parser.SRC_DMG).qq()} &quot;Magic Items Table [A-I]&quot; when generating magic items.">Prefer Random Magic Items</div>
				${$cbIsPreferRandomMagicItems}
			</label>

			<div class="ve-flex-v-center mb-2">
				${$btnRoll}
				${$btnClear}
			</div>

			<hr class="hr-3">

			<div class="ve-small italic">${this.constructor._er(`Based on the tables and rules in {@book Fizban's Treasury of Dragons|FTD|4|Creating a Hoard}`)}, pages 72.</div>
		</div>`.appendTo(tabMeta.$wrpTab);
	}

	async _dh_pDoHandleClickRollLoot () {
		const tableMeta = this._data.dragon.find(it => it.name === this._state.dh_dragonAge);

		const coins = this._getConvertedCoins(
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
			type: `Dragon Hoard: ${LootGenUi._CHALLENGE_RATING_RANGES[this._state.ft_challenge]}`,
			name: `${this._state.dh_dragonAge} Dragon's Hoard`,
			coins,
			gems,
			artObjects,
			dragonMundaneItems,
			magicItemsByTable,
		});
		this._doAddOutput({lootOutput});
	}

	_dh_doHandleClickRollLoot_mundaneItems ({dragonMundaneItems}) {
		if (!dragonMundaneItems) return null;

		const count = Renderer.dice.parseRandomise2(dragonMundaneItems.amount);

		const breakdown = [];
		[...new Array(count)]
			.forEach(() => {
				const roll = RollerUtil.randomise(100);
				const result = this._data.dragonMundaneItems.find(it => roll >= it.min && roll <= it.max);
				breakdown.push(result.item);
			});

		return new LootGenOutputDragonMundaneItems({
			count: count,
			breakdown,
		});
	}

	_render_tabGemsArtObjects ({tabMeta}) {
		const $cbIsUseGems = ComponentUiUtil.$getCbBool(this, "gao_isUseGems");
		const $cbIsUseArtObjects = ComponentUiUtil.$getCbBool(this, "gao_isUseArtObjects");

		const $iptTargetGoldAmount = ComponentUiUtil.$getIptInt(this, "gao_targetGoldAmount", 0, {min: 0})
			.keydown(evt => {
				if (evt.key !== "Enter") return;
				$iptTargetGoldAmount.change();
				$btnRoll.click();
			});

		const $btnRoll = $(`<button class="ve-btn ve-btn-default ve-btn-xs mr-2">Roll Loot</button>`)
			.click(() => this._goa_pDoHandleClickRollLoot());

		const $btnClear = $(`<button class="ve-btn ve-btn-danger ve-btn-xs">Clear Output</button>`)
			.click(() => this._doClearOutput());

		$$`<div class="ve-flex-col py-2 px-3">
			<h4 class="mt-1 mb-3">Gem/Art Object Generator</h4>

			<label class="split-v-center mb-3">
				<div class="mr-2 w-66 no-shrink">Include Gems</div>
				${$cbIsUseGems}
			</label>

			<label class="split-v-center mb-3">
				<div class="mr-2 w-66 no-shrink">Include Art Objects</div>
				${$cbIsUseArtObjects}
			</label>

			<label class="split-v-center mb-3">
				<div class="mr-2 w-66 no-shrink">Target Gold Amount</div>
				${$iptTargetGoldAmount}
			</label>

			<div class="ve-flex-v-center mb-2">
				${$btnRoll}
				${$btnClear}
			</div>

			<hr class="hr-3">

			<div class="ve-small italic">${this.constructor._er(`This custom generator randomly selects gems/art objects up to the target gold amount.`)}</div>
		</div>`.appendTo(tabMeta.$wrpTab);
	}

	async _goa_pDoHandleClickRollLoot () {
		if (this._state.gao_targetGoldAmount <= 0) return JqueryUtil.doToast({content: "Please enter a target gold amount!", type: "warning"});

		if (!this._state.gao_isUseGems && !this._state.gao_isUseArtObjects) return JqueryUtil.doToast({content: `Please select at least one of "Include Gems" and/or "Include Art Objects"`, type: "warning"});

		const typeMap = {};
		[{prop: "gems", stateProp: "gao_isUseGems"}, {prop: "artObjects", stateProp: "gao_isUseArtObjects"}]
			.forEach(({prop, stateProp}) => {
				if (!this._state[stateProp]) return;
				this._data[prop]
					.forEach(({type, table}) => {
						(typeMap[type] = typeMap[type] || []).push({prop, table});
					});
			});

		const types = Object.keys(typeMap).map(it => Number(it)).sort(SortUtil.ascSort).reverse();
		if (this._state.gao_targetGoldAmount < types.last()) return JqueryUtil.doToast({content: `Could not generate any gems/art objects for a gold amount of ${this._state.gao_targetGoldAmount}! Please increase the target gold amount.`, type: "warning"});

		// Map of <prop> -> <type> -> {<count>, <breakdown>}
		const generated = {};

		let budget = this._state.gao_targetGoldAmount;
		while (budget >= types.last()) {
			const validTypes = types.filter(it => it <= budget);
			const type = RollerUtil.rollOnArray(validTypes);
			const typeMetas = typeMap[type];
			const {prop, table} = RollerUtil.rollOnArray(typeMetas);
			const rolled = RollerUtil.rollOnArray(table);

			const genMeta = MiscUtil.getOrSet(generated, prop, type, {});
			genMeta.count = (genMeta.count || 0) + 1;
			genMeta.breakdown = genMeta.breakdown || {};
			genMeta.breakdown[rolled] = (genMeta.breakdown[rolled] || 0) + 1;

			budget -= type;
		}

		const [gems, artObjects] = ["gems", "artObjects"]
			.map(prop => {
				return generated[prop]
					? Object.entries(generated[prop])
						.sort(([typeA], [typeB]) => SortUtil.ascSort(Number(typeB), Number(typeA)))
						.map(([type, {count, breakdown}]) => {
							type = Number(type);

							return new LootGenOutputGemsArtObjects({
								type,
								count,
								breakdown,
							});
						})
					: null;
			});

		const lootOutput = new this._ClsLootGenOutput({
			type: `Gems/Art Objects`,
			name: `Gems/Art Objects: Roughly ${this._state.gao_targetGoldAmount.toLocaleString()} gp`,
			gems,
			artObjects,
		});
		this._doAddOutput({lootOutput});
	}

	_render_tabOptions ({tabMeta, tabMetaGemsArtObjects}) {
		const menuOthers = ContextUtil.getMenu([
			new ContextUtil.Action(
				"Gems/Art Objects Generator",
				() => {
					this._setActiveTab({tab: tabMetaGemsArtObjects});
				},
			),
			null,
			new ContextUtil.Action(
				"Set Random Item Filters",
				() => {
					this._modalFilterItems.handleHiddenOpenButtonClick();
				},
				{
					title: `Set the filtering parameters used to determine which items can be randomly rolled for some results. Note that this does not, for example, remove these items from standard loot tables.`,
					fnActionAlt: async (evt) => {
						this._modalFilterItems.handleHiddenResetButtonClick(evt);
						JqueryUtil.doToast(`Reset${evt.shiftKey ? " all" : ""}!`);
					},
					textAlt: `<span class="glyphicon glyphicon-refresh"></span>`,
					titleAlt: FILTER_BOX_TITLE_BTN_RESET,
				},
			),
			new ContextUtil.Action(
				"Set Random Spell Filters",
				() => {
					this._modalFilterSpells.handleHiddenOpenButtonClick();
				},
				{
					title: `Set the filtering parameters used to determine which spells can be randomly rolled for some results.`,
					fnActionAlt: async (evt) => {
						this._modalFilterSpells.handleHiddenResetButtonClick(evt);
						JqueryUtil.doToast(`Reset${evt.shiftKey ? " all" : ""}!`);
					},
					textAlt: `<span class="glyphicon glyphicon-refresh"></span>`,
					titleAlt: FILTER_BOX_TITLE_BTN_RESET,
				},
			),
			null,
			new ContextUtil.Action(
				"Settings",
				() => {
					this._opts_pDoOpenSettings();
				},
			),
		]);

		// Update the tab button on-click
		tabMeta.buttons[0].pFnClick = evt => ContextUtil.pOpenMenu(evt, menuOthers);

		const hkIsActive = () => {
			const tab = this._getActiveTab();
			tabMeta.$btns[0].toggleClass("active", !!tab.isHeadHidden);
		};
		this._addHookActiveTab(hkIsActive);
		hkIsActive();
	}

	async _opts_pDoOpenSettings () {
		const {$modalInner} = await UiUtil.pGetShowModal({title: "Settings"});

		const $rowsCurrency = Parser.COIN_ABVS
			.map(it => {
				const {propIsAllowed} = this._getPropsCoins(it);

				const $cb = ComponentUiUtil.$getCbBool(this, propIsAllowed);

				return $$`<label class="split-v-center stripe-odd--faint">
					<div class="no-wrap mr-2">${Parser.coinAbvToFull(it).toTitleCase()}</div>
					${$cb}
				</label>`;
			});

		$$($modalInner)`
			<div class="mb-1" title="Disabled currencies will be converted to equivalent amounts of another currency.">Allowed Currencies:</div>
			<div class="pl-4 ve-flex-col">
				${$rowsCurrency}
			</div>
		`;
	}

	_render_output ({$wrp}) {
		this._$wrpOutputRows = $(`<div class="w-100 h-100 ve-flex-col ve-overflow-y-auto smooth-scroll"></div>`);

		$$`<div class="ve-flex-col w-100 h-100">
			<h4 class="my-0"><i>Output</i></h4>
			${this._$wrpOutputRows}
		</div>`
			.appendTo($wrp);
	}

	_getPropsCoins (coin) {
		return {
			propIsAllowed: `isAllowCurrency${coin.uppercaseFirst()}`,
		};
	}

	_getConvertedCoins (coins) {
		if (!coins) return coins;

		if (Parser.COIN_ABVS.every(it => this._state[this._getPropsCoins(it).propIsAllowed])) return coins;

		if (Parser.COIN_ABVS.every(it => !this._state[this._getPropsCoins(it).propIsAllowed])) {
			JqueryUtil.doToast({content: "All currencies are disabled! Generated currency has been discarded.", type: "warning"});
			return {};
		}

		coins = MiscUtil.copy(coins);
		let coinsRemoved = {};

		Parser.COIN_ABVS
			.forEach(it => {
				const {propIsAllowed} = this._getPropsCoins(it);
				if (this._state[propIsAllowed]) return;
				if (!coins[it]) return;

				coinsRemoved[it] = coins[it];
				delete coins[it];
			});

		if (!Object.keys(coinsRemoved).length) return coins;

		coinsRemoved = {cp: CurrencyUtil.getAsCopper(coinsRemoved)};

		const conversionTableFiltered = MiscUtil.copy(Parser.FULL_CURRENCY_CONVERSION_TABLE)
			.filter(({coin}) => this._state[this._getPropsCoins(coin).propIsAllowed]);
		if (!conversionTableFiltered.some(it => it.isFallback)) conversionTableFiltered[0].isFallback = true;

		// If we have filtered out copper, upgrade our copper amount to the nearest currency
		if (!conversionTableFiltered.some(it => it.coin === "cp")) {
			const conv = conversionTableFiltered[0];
			coinsRemoved = {[conv.coin]: coinsRemoved.cp * conv.mult};
		}

		const coinsRemovedSimplified = CurrencyUtil.doSimplifyCoins(coinsRemoved, {currencyConversionTable: conversionTableFiltered});

		Object.entries(coinsRemovedSimplified).forEach(([coin, count]) => {
			if (!count) return;
			coins[coin] = (coins[coin] || 0) + count;
		});

		return coins;
	}

	_doAddOutput ({lootOutput}) {
		this._lootOutputs.push(lootOutput);
		lootOutput.render(this._$wrpOutputRows);
	}

	_doClearOutput () {
		this._lootOutputs.forEach(it => it.doRemove());
		this._lootOutputs = [];
	}

	_getDefaultState () {
		return {
			...super._getDefaultState(),

			// region Shared
			pulseSpellsFiltered: false,
			pulseItemsFiltered: false,

			isAllowCurrencyCp: true,
			isAllowCurrencySp: true,
			isAllowCurrencyEp: true,
			isAllowCurrencyGp: true,
			isAllowCurrencyPp: true,
			// endregion

			// region Find Treasure
			ft_challenge: 0,
			ft_isHoard: false,
			// endregion

			// region Loot Tables
			lt_ixTable: null,
			// endregion

			// region Party Loot
			pl_isExactLevel: false,
			pl_isCumulative: false,

			pl_charLevel: 4,

			pl_exactLevelMin: 1,
			pl_exactLevelMax: 20,
			pl_exactLevel: 1,
			// endregion

			// region Dragon hoard
			dh_dragonAge: "Wyrmling",
			dh_isPreferRandomMagicItems: false,
			// endregion

			// region Gems/Art Objects
			gao_isUseGems: true,
			gao_isUseArtObjects: true,
			gao_targetGoldAmount: 100,
			// endregion
		};
	}
}
