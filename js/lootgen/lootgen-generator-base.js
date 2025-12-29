import {LootGenOutputGemsArtObjects, LootGenOutputMagicItems} from "./lootgen-output.js";
import {LootGenMagicItem} from "./lootgen-magicitem.js";

/** @abstract */
export class LootGenGeneratorBase extends BaseComponent {
	identifier;

	constructor ({ClsLootGenOutput, stateManager, outputManager, dataManager, ...rest}) {
		super({...rest});
		this._ClsLootGenOutput = ClsLootGenOutput;
		this._stateManager = stateManager;
		this._outputManager = outputManager;
		this._dataManager = dataManager;
	}

	getSaveableStateProp () { return `comp${this.identifier.uppercaseFirst()}`; }

	addHookOnSave (hk) { this._addHookAllBase(hk); }

	/**
	 * @abstract
	 * @return {void}
	 */
	render ({tabMeta}) { throw new Error("Unimplemented!"); }

	_doHandleClickRollLoot_hoard_gemsArtObjects ({row, prop}) {
		if (!row[prop]) return null;

		const lootMeta = row[prop];

		const {type, typeRoll} = this._doHandleClickRollLoot_hoard_gemsArtObjects_getTypeInfo({lootMeta});

		const matchingTables = this._dataManager.getDataGemsArtObjectsFilteredByProp(prop)
			.filter(it => it.type === type);
		if (!matchingTables.length) return null;

		const rollOn = matchingTables
			.flatMap(matchingTable => matchingTable.table);

		const count = Renderer.dice.parseRandomise2(lootMeta.amount);

		const breakdown = {};
		[...new Array(count)]
			.forEach(() => {
				const type = RollerUtil.rollOnArray(rollOn);
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

		Array.from({length: count})
			.forEach(() => {
				const {type} = this._doHandleClickRollLoot_hoard_gemsArtObjects_getTypeInfo({lootMeta});

				if (!byType[type]) {
					byType[type] = {
						type,
						breakdown: {},
						count: 0,
					};
				}

				const meta = byType[type];

				meta.count++;

				const matchingTables = this._dataManager.getDataGemsArtObjectsFilteredByProp(prop)
					.filter(it => it.type === type);
				if (!matchingTables.length) return;

				const rollOn = matchingTables
					.flatMap(matchingTable => matchingTable.table);

				const type2 = RollerUtil.rollOnArray(rollOn);
				meta.breakdown[type2] = (meta.breakdown[type2] || 0) + 1;
			});

		return Object.values(byType)
			.map(meta => {
				return new LootGenOutputGemsArtObjects({
					type: meta.type,
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

	async _doHandleClickRollLoot_hoard_pMagicItems ({row, characterLevelRange = null, fnGetIsPreferAltChoose = null}) {
		if (!row.magicItems) return null;

		return row.magicItems.pMap(async magicItemsObj => {
			const {type, typeRoll, typeAltChoose} = this._doHandleClickRollLoot_hoard_pMagicItems_getTypeInfo({magicItemsObj, characterLevelRange});

			const magicItemTable = this._dataManager.getData().magicItems.find(it => it.type === type);
			const count = Renderer.dice.parseRandomise2(magicItemsObj.amount);
			const itemsAltChoose = this._doHandleClickRollLoot_hoard_getAltChooseList({typeAltChoose});
			const itemsAltChooseDisplayText = this._doHandleClickRollLoot_hoard_getAltChooseDisplayText({typeAltChoose});

			const breakdown = [];

			await ([...new Array(count)].pSerialAwaitMap(async () => {
				const lootItem = await LootGenMagicItem.pGetMagicItemRoll({
					dataManager: this._dataManager,
					lootGenMagicItems: breakdown,
					spells: this._dataManager.getDataSpellsFiltered(),
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

	async _doHandleClickRollLoot_hoard_pMagicItemsMulti ({row, characterLevelRange = null, fnGetIsPreferAltChoose = null}) {
		if (!row.magicItems) return null;

		const byType = {};

		await row.magicItems.pMap(async magicItemsObj => {
			const count = Renderer.dice.parseRandomise2(magicItemsObj.amount);

			await [...new Array(count)]
				.pSerialAwaitMap(async () => {
					const {type, typeAltChoose} = this._doHandleClickRollLoot_hoard_pMagicItems_getTypeInfo({magicItemsObj, characterLevelRange});

					if (!byType[type]) {
						byType[type] = {
							type,
							breakdown: [],
							count: 0,
							typeTable: magicItemsObj.typeTable,
						};
					}

					const meta = byType[type];

					const magicItemTable = this._dataManager.getData().magicItems.find(it => it.type === type);
					const itemsAltChoose = this._doHandleClickRollLoot_hoard_getAltChooseList({typeAltChoose});
					const itemsAltChooseDisplayText = this._doHandleClickRollLoot_hoard_getAltChooseDisplayText({typeAltChoose});

					const lootItem = await LootGenMagicItem.pGetMagicItemRoll({
						dataManager: this._dataManager,
						lootGenMagicItems: meta.breakdown,
						spells: this._dataManager.getDataSpellsFiltered(),
						magicItemTable,
						itemsAltChoose,
						itemsAltChooseDisplayText,
						isItemsAltChooseRoll: fnGetIsPreferAltChoose ? fnGetIsPreferAltChoose() : false,
						fnGetIsPreferAltChoose,
					});
					meta.breakdown.push(lootItem);
				});
		});

		return Object.values(byType)
			.map(meta => {
				return new LootGenOutputMagicItems({
					type: meta.type,
					count: meta.count,
					typeRoll: null,
					typeTable: meta.typeTable,
					breakdown: meta.breakdown,
				});
			});
	}

	_doHandleClickRollLoot_hoard_pMagicItems_getTypeInfo ({magicItemsObj, characterLevelRange = null}) {
		if (magicItemsObj.type) {
			if (magicItemsObj.type === "randomByLevel") {
				if (characterLevelRange == null) throw new Error(`Character level was not provided! This is a bug!`);

				return {
					type: `byLevel.${characterLevelRange}`,
					typeAltChoose: magicItemsObj.typeAltChoose,
				};
			}

			return {
				type: magicItemsObj.type,
				typeAltChoose: magicItemsObj.typeAltChoose,
			};
		}

		const typeRoll = RollerUtil.randomise(100);
		const typeMeta = magicItemsObj.typeTable.find(it => typeRoll >= it.min && typeRoll <= it.max);
		return {
			type: typeMeta.type,
			typeRoll,
			typeAltChoose: typeMeta.typeAltChoose,
		};
	}

	_doHandleClickRollLoot_hoard_getAltChooseList ({typeAltChoose}) {
		return this._dataManager.getDataItemsFilteredMatching(typeAltChoose);
	}

	_doHandleClickRollLoot_hoard_getAltChooseDisplayText ({typeAltChoose}) {
		if (!typeAltChoose) return null;
		return [
			typeAltChoose.rarity,
			typeAltChoose.tier,
		]
			.filter(Boolean)
			.join(" ");
	}
}
