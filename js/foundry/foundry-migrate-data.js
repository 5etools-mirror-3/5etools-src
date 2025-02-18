import {PROPS_FOUNDRY_DATA_INLINE} from "./foundry-consts.js";
import {UtilsFoundry, UtilsFoundryItem} from "./foundry-utils.js";

export const UNHANDLED_KEYS = new Set();

class _FoundryMigratorUtils {
	static getPropSite ({propFoundry}) { return propFoundry.replace(/^foundry/, "").lowercaseFirst(); }
	static getPropFoundry ({propSite}) { return `foundry${propSite.uppercaseFirst()}`; }
}

/**
 * @abstract
 */
class _FoundryEntityMigratorBase {
	_migrationVersion;

	/* -------------------------------------------- */

	getMigrated (
		{
			propSite,
			propFoundry,
			isInline,
			ent,
			entLinked,
		},
	) {
		if (!this._isMigrate({isInline, ent})) return ent;

		ent = MiscUtil.copyFast(ent);
		const entDiscrete = this._toDiscrete({ent, isInline});

		this._mutMigrate({propSite, propFoundry, entDiscrete, entLinked});

		entDiscrete.migrationVersion = this._migrationVersion;

		return this._fromDiscrete({ent, isInline, entDiscrete});
	}

	/* -------------------------------------------- */

	_toDiscrete ({ent, isInline}) {
		if (!isInline) return ent;

		const entDiscrete = {};
		PROPS_FOUNDRY_DATA_INLINE
			.forEach(propInline => {
				const propDiscrete = this._getPropDiscrete({propInline});
				if (ent[propInline] === undefined) return;
				entDiscrete[propDiscrete] = MiscUtil.copyFast(ent[propInline]);
			});
		return entDiscrete;
	}

	_fromDiscrete ({ent, isInline, entDiscrete}) {
		if (!isInline) return ent;

		PROPS_FOUNDRY_DATA_INLINE
			.forEach(propInline => {
				const propDiscrete = this._getPropDiscrete({propInline});
				if (entDiscrete[propDiscrete] !== undefined) ent[propInline] = entDiscrete[propDiscrete];
				else delete ent[propInline];
			});

		return ent;
	}

	_getPropDiscrete ({propInline}) { return propInline.replace(/^foundry/, "").lowercaseFirst(); }

	/* -------------------------------------------- */

	_isMigrate ({isInline, ent}) {
		if (isInline) this._isMigrate_inline({ent});
		return this._isMigrate_discrete({ent});
	}

	_isMigrate_inline ({ent}) {
		if (!this._hasAnyInlineFoundryData({ent})) return false;
		ent.foundryMigrationVersion ||= 1;
		return ent.foundryMigrationVersion < this._migrationVersion;
	}

	_isMigrate_discrete ({ent}) {
		ent.migrationVersion ||= 1;
		return ent.migrationVersion < this._migrationVersion;
	}

	_hasAnyInlineFoundryData ({ent}) {
		return PROPS_FOUNDRY_DATA_INLINE
			.some(prop => ent[prop] !== undefined);
	}

	/* -------------------------------------------- */

	/**
	 * @abstract
	 * @return void
	 */
	_mutMigrate ({propSite, propFoundry, entDiscrete, entLinked}) { throw new Error("Unimplemented!"); }

	/* -------------------------------------------- */

	_getApproxFoundryTypeInfo ({propSite, propFoundry, entLinked, entDiscrete}) {
		switch (propSite) {
			case "item":
			case "magicvariant":
			case "baseitem":
			case "itemGroup": {
				return {document: "Item", type: entDiscrete.type || UtilsFoundryItem.getFoundryItemType(entLinked)};
			}

			case "race":
			case "subrace":
				return {document: "Item", type: entDiscrete.type || "race"};

			case "class": return {document: "Item", type: entDiscrete.type || "class"};
			case "subclass": return {document: "Item", type: entDiscrete.type || "subclass"};

			case "spell": return {document: "Item", type: entDiscrete.type || "spell"};
			case "facility": return {document: "Item", type: entDiscrete.type || "facility"};
			case "background": return {document: "Item", type: entDiscrete.type || "background"};

			case "monster":
			case "trap":
				return {document: "Actor", type: entDiscrete.type || "npc"};
			case "vehicle":
			case "object":
				return {document: "Actor", type: entDiscrete.type || "vehicle"};
		}

		return {document: "Item", type: entDiscrete.type || "feat"};
	}
}

class _FoundryEntityMigratorOneToTwo extends _FoundryEntityMigratorBase {
	_migrationVersion = 2;

	_mutMigrate ({propSite, propFoundry, entDiscrete, entLinked}) {
		if (entDiscrete.data) {
			entDiscrete.system = entDiscrete.data;
			delete entDiscrete.data;
		}

		if (entDiscrete.effects) {
			entDiscrete.effects
				.forEach(eff => {
					(eff.changes || [])
						.forEach(change => {
							if (!change.key) return;
							change.key = change.key.replace(/^data\./, "system.");
						});
				});
		}
	}
}

class _FoundryEntityMigratorTwoToThree extends _FoundryEntityMigratorBase {
	_migrationVersion = 3;

	_mutMigrate ({propSite, propFoundry, entDiscrete, entLinked}) {
		const approxTypeInfo = this._getApproxFoundryTypeInfo({propSite, propFoundry, entLinked, entDiscrete});
		switch (approxTypeInfo.document) {
			case "Actor": return this._mutMigrate_Actor({propSite, propFoundry, entDiscrete, entLinked, type: approxTypeInfo.document.type});
			case "Item": return this._mutMigrate_Item({propSite, propFoundry, entDiscrete, entLinked, type: approxTypeInfo.document.type});
			default: throw new Error(`Unhandled document type "${approxTypeInfo.document}"`);
		}
	}

	_mutMigrate_Actor ({propSite, propFoundry, entDiscrete, entLinked, type}) { /* No-op */ }

	static _ITEM_DAMAGE_KEY_PATHS = [
		"damage.parts",
		"damage.versatile",
		"scaling.formula",
		"scaling.mode",
	];

	_mutMigrate_Item_damage (
		{
			entDiscrete,
			systemFlat,
		},
	) {
		if (!this.constructor._ITEM_DAMAGE_KEY_PATHS.some(kPath => systemFlat[kPath])) return;

		// eslint-disable-next-line no-console
		console.warn(`Item damage parts required manual conversion in "${entDiscrete.name}" (${entDiscrete.source})!`);

		entDiscrete._todo_migrate_manual = Object.fromEntries(
			this.constructor._ITEM_DAMAGE_KEY_PATHS
				.map(kPath => {
					const val = systemFlat[kPath];
					delete systemFlat[kPath];
					if (val === undefined) return null;
					return [kPath, val];
				})
				.filter(Boolean),
		);
	}

	_mutMigrate_Item ({propSite, propFoundry, entDiscrete, entLinked, type}) {
		if (!entDiscrete.system) return;

		const systemFlat = UtilsFoundry.flattenObject(entDiscrete.system);
		entDiscrete.system = systemFlat;

		this._mutMigrate_Item_damage({entDiscrete, systemFlat});

		const activityUtility = {type: "utility"};
		const activityAttack = {type: "attack"};
		const activitySave = {type: "save"};

		const isTargetAffects = ["creature", "object", "creatureOrObject"]
			.includes(systemFlat["target.type"]);

		Object.entries(systemFlat)
			.forEach(([kPath, val]) => {
				switch (kPath) {
					case "activation.cost": {
						if (type === "spell") systemFlat["activation.value"] = val;
						else activityUtility["activation.value"] = val;
						delete systemFlat[kPath];
						break;
					}
					case "activation.condition":
					case "activation.type": {
						if (type === "spell") break;
						else if (val != null) activityUtility[kPath] = val;
						delete systemFlat[kPath];
						break;
					}

					case "uses.value": delete systemFlat[kPath]; break;

					case "uses.per": {
						if (val) {
							systemFlat["uses.recovery"] = [
								{
									period: val,
									type: "recoverAll",
								},
							];
						}
						delete systemFlat[kPath];
						break;
					}

					case "formula": {
						if (val) activityUtility["roll.formula"] = val;
						delete systemFlat[kPath];
						break;
					}

					case "attack.bonus": {
						if (val) activityAttack[kPath] = val;
						delete systemFlat[kPath];
						break;
					}

					case "save.ability": {
						if (val) activitySave[kPath] = [val].flat();
						delete systemFlat[kPath];
						break;
					}
					case "save.scaling": {
						if (val) activitySave["save.dc.calculation"] = val;
						delete systemFlat[kPath];
						break;
					}

					// TODO(Future) non-spell version is not accurate
					case "target.type": {
						delete systemFlat[kPath];
						const tgt = type === "spell" ? systemFlat : activityUtility;
						if (isTargetAffects) tgt["target.affects.type"] = val;
						else tgt["target.template.type"] = val;
						break;
					}
					case "target.units": {
						delete systemFlat[kPath];
						const tgt = type === "spell" ? systemFlat : activityUtility;
						tgt["target.template.units"] = val;
						break;
					}
					case "target.value": {
						delete systemFlat[kPath];
						const tgt = type === "spell" ? systemFlat : activityUtility;
						const kPathOut = isTargetAffects ? "target.affects.count" : "target.template.size";
						tgt[kPathOut] = `${val}`;
						break;
					}

					case "actionType": delete systemFlat[kPath]; break;

					// region No change required
					case "armor.dex":
					case "armor.type":
					case "armor.value":
						break;

					case "enchantment.restrictions.type":
						break;

					case "duration.units":
					case "duration.value":
						break;

					case "range.units":
					case "range.value":
						break;

					case "uses.max":
					case "uses.recovery":
						break;

					case "magicalBonus":
						break;

					case "type.value":
					case "type.subtype":
						break;

					case "summons.bonuses.ac":
					case "summons.bonuses.attackDamage":
					case "summons.bonuses.healing":
					case "summons.bonuses.hp":
					case "summons.bonuses.saveDamage":
					case "summons.match.attacks":
					case "summons.match.proficiency":
					case "summons.match.saves":
					case "summons.profiles":
						break;

					case "activities":
						break;
						// endregion

					default: UNHANDLED_KEYS.add(kPath);
				}
			});

		[
			activityUtility,
			activityAttack,
			activitySave,
		]
			.filter(act => Object.keys(act).length > 1)
			.forEach(act => {
				MiscUtil.getOrSet(entDiscrete, "system", "activities", []).push(act);
			});
	}
}

export class FoundryDataMigrator {
	constructor (
		{
			json,
			isPrefixProps = false,
		},
	) {
		this._json = json;
		this._isPrefixProps = isPrefixProps;
	}

	async pMutMigrate () {
		const migrators = [
			new _FoundryEntityMigratorOneToTwo(),
			new _FoundryEntityMigratorTwoToThree(),
		];

		await Object.entries(this._json)
			.filter(([, arr]) => arr && (arr instanceof Array) && arr?.length)
			.pSerialAwaitMap(async ([prop, arr]) => {
				const isSiteProp = this._isPrefixProps || !prop.startsWith("foundry");

				const propSite = isSiteProp
					? prop
					: _FoundryMigratorUtils.getPropSite({propFoundry: prop});
				const propFoundry = isSiteProp
					? _FoundryMigratorUtils.getPropFoundry({propSite: prop})
					: prop;

				this._json[prop] = await this._pGetMigratedArray({
					propSite,
					propFoundry,
					isInline: !this._isPrefixProps && prop === propSite,
					arr,
					migrators,
				});
			});
	}

	_getLinkedEntityProp ({propSite}) {
		switch (propSite) {
			case "magicvariant":
				return "item";
		}
		return propSite;
	}

	async _pGetEntLinked ({propSite, propFoundry, isInline, ent}) {
		if (isInline) return ent;

		if (
			[
				"raceFeature",
				"backgroundFeature",
			]
				.includes(propSite)
		) {
			return ent;
		}

		const propLinkedEntity = this._getLinkedEntityProp({propSite});
		const hash = UrlUtil.URL_TO_HASH_BUILDER[propLinkedEntity](ent);
		const entLinked = await DataLoader.pCacheAndGet(
			propLinkedEntity,
			SourceUtil.getEntitySource(ent),
			hash,
		);
		if (entLinked) return entLinked;

		// eslint-disable-next-line no-console
		console.warn(`Could not find linked entity for "${propFoundry}" ("${propLinkedEntity}") "${hash}"!`);

		return ent;
	}

	async _pGetMigratedArray (
		{
			propSite,
			propFoundry,
			isInline,
			arr,
			migrators,
		},
	) {
		return arr
			.pSerialAwaitMap(async ent => {
				const entLinked = await this._pGetEntLinked({propSite, propFoundry, isInline, ent});

				return migrators
					.reduce((entMigrated, migrator) => {
						return migrator.getMigrated({
							propSite,
							propFoundry,
							isInline,
							ent: entMigrated,
							entLinked,
						});
					}, ent);
			});
	}
}
