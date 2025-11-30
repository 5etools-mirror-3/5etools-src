import {LootGenOutput} from "./lootgen-output.js";
import {
	LOOT_TABLES_TYPE__DMG_MAGIC_ITEMS,
	LOOT_TABLES_TYPE__XGE_FAUX,
	LOOT_TABLES_TYPE__XDMG_THEMES,
} from "./lootgen-const.js";
import {PILL_STATE__IGNORE} from "../filter/filter-constants.js";
import {LootgenStateManager} from "./lootgen-state.js";
import {LootGenGeneratorFindTreasure, LootGenGeneratorFindTreasure24} from "./lootgen-generator-findtreasure.js";
import {LootGenGeneratorLootTables} from "./lootgen-generator-loottables.js";
import {LootGenGeneratorPartyLoot} from "./lootgen-generator-partyloot.js";
import {LootGenGeneratorDragonHoard} from "./lootgen-generator-dragonhoard.js";
import {LootGenGeneratorGemsArtObjects} from "./lootgen-generator-gemsartobjects.js";
import {LootGenUiDataManager} from "./lootgen-datamanager.js";
import {ModalFilterGemsArtObjects} from "./lootgen-filter-gemsartobjects.js";
import {LootGenUiOutputManager} from "./lootgen-outputmanager.js";

export class LootGenUi extends BaseComponent {
	constructor ({spells, items, ClsLootGenOutput}) {
		super();

		TabUiUtil.decorate(this, {isInitMeta: true});

		this._ClsLootGenOutput = ClsLootGenOutput || LootGenOutput;
		this._stateManager = LootgenStateManager.getInstance();
		this._outputManager = new LootGenUiOutputManager();
		this._dataManager = new LootGenUiDataManager({spells, items});

		this._modalFilterSpells = new ModalFilterSpells({namespace: "LootGenUi.spells", allData: spells});
		this._modalFilterItems = new ModalFilterItems({
			namespace: "LootGenUi.items",
			allData: items,
		});
		this._modalFilterGemsArtObjects = null;

		this._generatorFindTreasure24 = new LootGenGeneratorFindTreasure24({
			ClsLootGenOutput: this._ClsLootGenOutput,
			stateManager: this._stateManager,
			outputManager: this._outputManager,
			dataManager: this._dataManager,
		});

		this._generatorFindTreasure = new LootGenGeneratorFindTreasure({
			ClsLootGenOutput: this._ClsLootGenOutput,
			stateManager: this._stateManager,
			outputManager: this._outputManager,
			dataManager: this._dataManager,
		});

		this._generatorLootTables = new LootGenGeneratorLootTables({
			ClsLootGenOutput: this._ClsLootGenOutput,
			stateManager: this._stateManager,
			outputManager: this._outputManager,
			dataManager: this._dataManager,
		});

		this._generatorPartyLoot = new LootGenGeneratorPartyLoot({
			ClsLootGenOutput: this._ClsLootGenOutput,
			stateManager: this._stateManager,
			outputManager: this._outputManager,
			dataManager: this._dataManager,
		});

		this._generatorDragonHoard = new LootGenGeneratorDragonHoard({
			ClsLootGenOutput: this._ClsLootGenOutput,
			stateManager: this._stateManager,
			outputManager: this._outputManager,
			dataManager: this._dataManager,
		});

		this._generatorGemsArtObjects = new LootGenGeneratorGemsArtObjects({
			ClsLootGenOutput: this._ClsLootGenOutput,
			stateManager: this._stateManager,
			outputManager: this._outputManager,
			dataManager: this._dataManager,
		});

		this._generators = [
			this._generatorFindTreasure24,
			this._generatorFindTreasure,
			this._generatorLootTables,
			this._generatorPartyLoot,
			this._generatorDragonHoard,
			this._generatorGemsArtObjects,
		];
	}

	getSaveableState () {
		return {
			...super.getSaveableState(),
			meta: this.__meta,
			compShared: this._stateManager.getSaveableState(),
			...Object.fromEntries(
				this._generators
					.map(generator => [generator.getSaveableStateProp(), generator.getSaveableState()]),
			),
		};
	}

	setStateFrom (toLoad, isOverwrite = false) {
		super.setStateFrom(toLoad, isOverwrite);
		toLoad.meta && this._proxyAssignSimple("meta", toLoad.meta, isOverwrite);

		toLoad.compShared && this._stateManager.setStateFrom(toLoad.compShared, isOverwrite);
		this._generators
			.forEach(generator => {
				const prop = generator.getSaveableStateProp();
				if (!toLoad[prop]) return;
				generator.setStateFrom(toLoad[prop], isOverwrite);
			});
	}

	addHookOnSave (hk) {
		this._addHookAll("meta", hk);
		this._stateManager._addHookAllBase(hk);

		this._generators
			.forEach(generator => generator.addHookOnSave(hk));
	}

	async pInit () {
		await this._dataManager.pInit();

		this._modalFilterGemsArtObjects = new ModalFilterGemsArtObjects({
			namespace: "LootGenUi.gemsArtObjects",
			allData: this._dataManager.getDataGemsArtObjects(),
		});

		await this._modalFilterSpells.pPopulateHiddenWrapper();
		await this._modalFilterItems.pPopulateHiddenWrapper();
		await this._modalFilterGemsArtObjects.pPopulateHiddenWrapper();

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

		const hkFilterChangeGemsArtObjects = () => this._handleFilterChangeGemsArtObjects();
		this._modalFilterGemsArtObjects.pageFilter.filterBox.on(FILTER_BOX_EVNT_VALCHANGE, hkFilterChangeGemsArtObjects);
		hkFilterChangeGemsArtObjects();
	}

	_handleFilterChangeSpells () {
		const f = this._modalFilterSpells.pageFilter.filterBox.getValues();
		this._dataManager.setDataSpellsFiltered(this._dataManager.getDataSpells().filter(it => this._modalFilterSpells.pageFilter.toDisplay(f, it)));

		this._stateManager.pulseSpellsFiltered = !this._stateManager.pulseSpellsFiltered;
	}

	_handleFilterChangeItems (
		{
			tablesMagicItemsDmg,
			tablesMagicItemsXdmg,
		},
	) {
		const f = this._modalFilterItems.pageFilter.filterBox.getValues();
		this._dataManager.setDataItemsFiltered(this._dataManager.getDataItems().filter(it => this._modalFilterItems.pageFilter.toDisplay(f, it)));

		const filterExpression = this._modalFilterItems.pageFilter.filterBox.getFilterTagExpression({isAddSearchTerm: false});
		this._dataManager.setDataItemsFilteredLegacy(
			this._modalFilterItems.getEntitiesMatchingFilterExpression({
				filterExpression,
				valuesOverride: {
					"Miscellaneous": {
						"Reprinted": PILL_STATE__IGNORE,
					},
				},
			}),
		);

		const xgeTables = this._getXgeFauxTables();

		this._generatorLootTables.setTableMetas(
			[
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
						table: this._dataManager.getData().magicItems.find(it => it.type === type),
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
						table: this._dataManager.getData().magicItems.find(it => it.type === type),
						tag: `{@table Magic Item Table ${type}||Table ${type}}`,
					};
				}),
				...xgeTables,
			],
		);

		const xgeTableLookup = {};
		xgeTables.forEach(({tier, rarity, table}) => MiscUtil.set(xgeTableLookup, tier, rarity, table));
		this._generatorPartyLoot.setXgeTableLookup(xgeTableLookup);

		this._stateManager.pulseItemsFiltered = !this._stateManager.pulseItemsFiltered;
	}

	_handleFilterChangeGemsArtObjects () {
		const f = this._modalFilterGemsArtObjects.pageFilter.filterBox.getValues();
		this._dataManager.setDataGemsArtObjectsFiltered(this._dataManager.getDataGemsArtObjects().filter(it => this._modalFilterGemsArtObjects.pageFilter.toDisplay(f, it)));

		this._stateManager.pulseGemsArtObjectsFiltered = !this._stateManager.pulseGemsArtObjectsFiltered;
	}

	/** Create fake tables for the XGE rules */
	_getXgeFauxTables () {
		const byTier = {};

		// Use "legacy" item set, as "tier" info no longer used
		this._dataManager.getDataItemsFilteredLegacy()
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
								rows: items.map((itm, i) => ([i + 1, `{@item ${DataUtil.proxy.getUidPacked("item", itm, "item", {isMaintainCase: true})}}`])),
							},

							table: {
								name: caption,
								source: Parser.SRC_XGE,
								page: 135,
								diceType: items.length,
								table: items.map((itm, i) => ({min: i + 1, max: i + 1, item: `{@item ${DataUtil.proxy.getUidPacked("item", itm, "item", {isMaintainCase: true})}}`})),
							},
						};
					});
			})
			.flat();
	}

	render ({stg, stgLhs, stgRhs}) {
		if (stg && (stgLhs || stgRhs)) throw new Error(`Only one of "parent stage" and "LHS/RHS stages" may be specified!`);

		const {stgLhs: stgLhs_, stgRhs: stgRhs_} = this._render_getStages({stg, stgLhs, stgRhs});

		const tabMetasLookup = this._renderTabsDict(
			{
				[this._generatorFindTreasure24.identifier]: new TabUiUtil.TabMeta({
					name: "Adventure Rewards by CR ('24)",
					title: `Random Treasure by CR (${Parser.sourceJsonToFull(Parser.SRC_XDMG)})`,
					hasBorder: true,
					hasBackground: true,
				}),
				[this._generatorFindTreasure.identifier]: new TabUiUtil.TabMeta({
					name: "Random Treasure by CR ('14)",
					title: `Random Treasure by CR (${Parser.sourceJsonToFull(Parser.SRC_DMG)})`,
					hasBorder: true,
					hasBackground: true,
				}),
				[this._generatorLootTables.identifier]: new TabUiUtil.TabMeta({
					name: "Loot Tables",
					hasBorder: true,
					hasBackground: true,
				}),
				[this._generatorPartyLoot.identifier]: new TabUiUtil.TabMeta({
					name: "Party Loot",
					hasBorder: true,
					hasBackground: true,
				}),
				[this._generatorDragonHoard.identifier]: new TabUiUtil.TabMeta({
					name: "Dragon Hoard",
					hasBorder: true,
					hasBackground: true,
				}),
				[this._generatorGemsArtObjects.identifier]: new TabUiUtil.TabMeta({
					name: "Gems/Art Objects",
					hasBorder: true,
					hasBackground: true,
				}),
				options: new TabUiUtil.TabMeta({
					type: "buttons",
					isSplitStart: true,
					buttons: [
						{
							html: `<span class="glyphicon glyphicon-option-vertical"></span>`,
							title: "Options",
							type: "default",
							pFnClick: null, // This is assigned later
						},
					],
				}),
			},
			{
				eleParent: stgLhs_,
				isStacked: true,
			},
		);

		this._generators
			.forEach(generator => generator.render({tabMeta: tabMetasLookup[generator.identifier]}));
		this._render_tabOptions({tabMeta: tabMetasLookup.options});

		this._render_output({wrp: stgRhs_});
	}

	/**
	 * If we have been provided an existing pair of left-/right-hand stages, use them.
	 * Otherwise, render a two-column UI, and return each column as a stage.
	 * This allows us to cater for both the pre-baked layout of the Lootgen page, and other, more general,
	 *   components.
	 */
	_render_getStages ({stg, stgLhs, stgRhs}) {
		if (!stg) return {stgLhs, stgRhs};

		stgLhs = ee`<div class="ve-flex w-50 h-100"></div>`;
		stgRhs = ee`<div class="ve-flex-col w-50 h-100"></div>`;

		ee`<div class="ve-flex w-100 h-100">
			${stgLhs}
			<div class="vr-2 h-100"></div>
			${stgRhs}
		</div>`.appendTo(stg.empty());

		return {stgLhs, stgRhs};
	}

	_render_tabOptions ({tabMeta}) {
		const menuOthers = ContextUtil.getMenu([
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
			new ContextUtil.Action(
				"Set Random Gems/Art Objects Filters",
				() => {
					this._modalFilterGemsArtObjects.handleHiddenOpenButtonClick();
				},
				{
					title: `Set the filtering parameters used to determine which gems and art objects can be randomly rolled for some results.`,
					fnActionAlt: async (evt) => {
						this._modalFilterGemsArtObjects.handleHiddenResetButtonClick(evt);
						JqueryUtil.doToast(`Reset${evt.shiftKey ? " all" : ""}!`);
					},
					textAlt: `<span class="glyphicon glyphicon-refresh"></span>`,
					titleAlt: FILTER_BOX_TITLE_BTN_RESET,
				},
			),
			null,
			new ContextUtil.Action(
				"Settings",
				async () => {
					await this._opts_pDoOpenSettings();
				},
			),
		]);

		// Update the tab button on-click
		tabMeta.buttons[0].pFnClick = ({evt}) => ContextUtil.pOpenMenu(evt, menuOthers);

		const hkIsActive = () => {
			const tab = this._getActiveTab();
			tabMeta.btns[0].toggleClass("active", !!tab.isHeadHidden);
		};
		this._addHookActiveTab(hkIsActive);
		hkIsActive();
	}

	async _opts_pDoOpenSettings () {
		const {eleModalInner} = await UiUtil.pGetShowModal({title: "Settings"});

		const rowsCurrency = Parser.COIN_ABVS
			.map(it => {
				const {propIsAllowed} = this._stateManager.getPropsCoins(it);

				const cb = ComponentUiUtil.getCbBool(this._stateManager, propIsAllowed);

				return ee`<label class="split-v-center stripe-odd--faint">
					<div class="no-wrap mr-2">${Parser.coinAbvToFull(it).toTitleCase()}</div>
					${cb}
				</label>`;
			});

		ee(eleModalInner)`
			<div class="mb-1" title="Disabled currencies will be converted to equivalent amounts of another currency.">Allowed Currencies:</div>
			<div class="pl-4 ve-flex-col">
				${rowsCurrency}
			</div>
		`;
	}

	_render_output ({wrp}) {
		const wrpOutputRows = this._outputManager.setWrpOutputRows(ee`<div class="w-100 h-100 ve-flex-col ve-overflow-y-auto smooth-scroll"></div>`);

		ee`<div class="ve-flex-col w-100 h-100">
			<h4 class="my-0"><i>Output</i></h4>
			${wrpOutputRows}
		</div>`
			.appendTo(wrp);
	}
}
