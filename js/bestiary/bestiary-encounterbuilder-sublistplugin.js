import {EncounterBuilderHelpers} from "../utils-list-bestiary.js";
import {EncounterBuilderComponentBestiary} from "./bestiary-encounterbuilder-component.js";

/**
 * Serialize/deserialize state from the encounter builder.
 */
export class EncounterBuilderSublistPlugin extends SublistPlugin {
	constructor ({sublistManager, encounterBuilder, encounterBuilderComp}) {
		super();
		this._sublistManager = sublistManager;
		this._encounterBuilder = encounterBuilder;
		this._encounterBuilderComp = encounterBuilderComp;
	}

	/* -------------------------------------------- */

	async pLoadData ({exportedSublist, isMemoryOnly}) {
		const nxt = {};

		// Allow URLified versions of keys
		const keyLookup = this._encounterBuilderComp.getDefaultStateKeys()
			.mergeMap(k => ({[k]: k, [k.toUrlified()]: k}));

		if (exportedSublist) {
			Object.entries(exportedSublist)
				.filter(([, v]) => v != null)
				.map(([k, v]) => {
					// Only add specific keys, as we do not want to track e.g. sublist state
					k = keyLookup[k];
					if (!k) return null;

					return [k, v];
				})
				.filter(Boolean)
				// Always process `colsExtraAdvanced` first (if available), as used in `playersAdvanced`
				.sort(([kA], [kB]) => kA === "colsExtraAdvanced" ? -1 : kB === "colsExtraAdvanced" ? 1 : 0)
				.forEach(([k, v]) => {
					if (isMemoryOnly) return nxt[k] = MiscUtil.copyFast(v);

					// When loading from non-memory sources, expand the data
					switch (k) {
						case "playersSimple": return nxt[k] = v.map(it => EncounterBuilderComponentBestiary.getDefaultPlayerRow_simple(it));
						case "colsExtraAdvanced": return nxt[k] = v.map(it => EncounterBuilderComponentBestiary.getDefaultColExtraAdvanced(it));
						case "playersAdvanced": return nxt[k] = v.map(it => EncounterBuilderComponentBestiary.getDefaultPlayerRow_advanced({
							...it,
							extras: it.extras.map(x => EncounterBuilderComponentBestiary.getDefaultPlayerAdvancedExtra(x)),
							colsExtraAdvanced: nxt.colsExtraAdvanced || this._encounterBuilderComp.colsExtraAdvanced,
						}));
						case "customShapeGroups": return nxt[k] = v.map(it => EncounterBuilderComponentBestiary.getDefaultCustomShapeGroup(it));

						default: return nxt[k] = v;
					}
				});

			if (nxt.playersSimple) {
				nxt.playersSimple
					.forEach(wrapped => {
						wrapped.entity.count = wrapped.entity.count || 1;
						wrapped.entity.level = wrapped.entity.level || 1;
					});
			}

			if (nxt.playersAdvanced) {
				nxt.playersAdvanced
					.forEach(wrapped => {
						wrapped.entity.name = wrapped.entity.name || "";
						wrapped.entity.level = wrapped.entity.level || 1;
						wrapped.entity.extraCols = wrapped.entity.extraCols
							|| (nxt.colsExtraAdvanced || this._encounterBuilderComp.colsExtraAdvanced.map(() => ""));
					});
			}
		}

		// Note that we do not set `creatureMetas` here, as `onSublistUpdate` handles this
		this._encounterBuilderComp.setStateFromLoaded(nxt);
	}

	static async pMutLegacyData ({exportedSublist, isMemoryOnly}) {
		if (!exportedSublist) return;

		// region Legacy Bestiary Encounter Builder format
		if (exportedSublist.p) {
			exportedSublist.playersSimple = exportedSublist.p.map(it => EncounterBuilderComponentBestiary.getDefaultPlayerRow_simple(it));
			if (!isMemoryOnly) this._mutExternalize({obj: exportedSublist, k: "playersSimple"});
			delete exportedSublist.p;
		}

		if (exportedSublist.l) {
			Object.assign(exportedSublist, exportedSublist.l);
			delete exportedSublist.l;
		}

		if (exportedSublist.a != null) {
			exportedSublist.isAdvanced = !!exportedSublist.a;
			delete exportedSublist.a;
		}

		if (exportedSublist.c) {
			exportedSublist.colsExtraAdvanced = exportedSublist.c.map(name => EncounterBuilderComponentBestiary.getDefaultColExtraAdvanced({name}));
			if (!isMemoryOnly) this._mutExternalize({obj: exportedSublist, k: "colsExtraAdvanced"});
			delete exportedSublist.c;
		}

		if (exportedSublist.d) {
			exportedSublist.playersAdvanced = exportedSublist.d.map(({n, l, x}) => EncounterBuilderComponentBestiary.getDefaultPlayerRow_advanced({
				name: n,
				level: l,
				extras: x.map(value => EncounterBuilderComponentBestiary.getDefaultPlayerAdvancedExtra({value})),
				colsExtraAdvanced: exportedSublist.colsExtraAdvanced,
			}));
			if (!isMemoryOnly) this._mutExternalize({obj: exportedSublist, k: "playersAdvanced"});
			delete exportedSublist.d;
		}
		// endregion

		// region Legacy "reference" format
		// These are general save manager properties, but we set them here, as encounter data was the only thing to make
		//   use of this system.
		if (exportedSublist.bestiaryId) {
			exportedSublist.saveId = exportedSublist.bestiaryId;
			delete exportedSublist.bestiaryId;
		}

		if (exportedSublist.isRef) {
			exportedSublist.managerClient_isReferencable = true;
			exportedSublist.managerClient_isLoadAsCopy = false;
		}
		delete exportedSublist.isRef;
		// endregion
	}

	async pMutLegacyData ({exportedSublist, isMemoryOnly}) {
		await this.constructor.pMutLegacyData({exportedSublist, isMemoryOnly});
	}

	/* -------------------------------------------- */

	async pMutSaveableData ({exportedSublist, isForce = false, isMemoryOnly = false}) {
		if (!isForce && !this._encounterBuilder.isActive()) return;

		[
			"playersSimple",
			"isAdvanced",
			"colsExtraAdvanced",
			"playersAdvanced",
			"customShapeGroups",
		].forEach(k => {
			exportedSublist[k] = MiscUtil.copyFast(this._encounterBuilderComp[k]);

			if (isMemoryOnly) return;

			this.constructor._mutExternalize({obj: exportedSublist, k});
		});
	}

	static _WALKER_EXTERNALIZE = null;
	static _HANDLERS_EXTERNALIZE = {
		array: (arr) => {
			if (arr.some(it => !it.id || !it.entity)) return arr;
			return arr.map(({entity}) => entity);
		},
	};
	static _mutExternalize ({obj, k}) {
		this._WALKER_EXTERNALIZE = this._WALKER_EXTERNALIZE || MiscUtil.getWalker();

		obj[k] = this._WALKER_EXTERNALIZE.walk(
			obj[k],
			this._HANDLERS_EXTERNALIZE,
		);
	}

	/* -------------------------------------------- */

	async pDoInitNewState ({prevExportableSublist, evt}) {
		// If SHIFT pressed, reset players and custom shape
		const nxt = {
			playersSimple: evt.shiftKey ? [] : MiscUtil.copyFast(prevExportableSublist.playersSimple),
			playersAdvanced: evt.shiftKey ? [] : MiscUtil.copyFast(prevExportableSublist.playersAdvanced),
			customShapeGroups: evt.shiftKey ? [] : MiscUtil.copyFast(prevExportableSublist.customShapeGroups),
		};

		this._encounterBuilderComp.setPartialStateFromLoaded(nxt);
	}

	/* -------------------------------------------- */

	getDownloadName () {
		if (!this._encounterBuilder.isActive()) return null;
		return "encounter";
	}

	getDownloadFileType () {
		if (!this._encounterBuilder.isActive()) return null;
		return "encounter";
	}

	getUploadFileTypes ({downloadFileTypeBase}) {
		if (!this._encounterBuilder.isActive()) return null;
		return [this.getDownloadFileType(), downloadFileTypeBase];
	}

	/* -------------------------------------------- */

	onSublistUpdate () {
		this._encounterBuilder.withSublistSyncSuppressed(() => {
			// Note that we only update `creatureMetas` here, as this only triggers on direct updates to the underlying sublist.
			//   For everything else, the `pLoadData` path is used.
			this._encounterBuilderComp.creatureMetas = this._sublistManager.sublistItems
				.map(sublistItem => EncounterBuilderHelpers.getSublistedCreatureMeta({sublistItem}));
		});
	}
}

class EncounterBuilderLegacyStorageMigration {
	static _VERSION = 2;

	static _STORAGE_KEY_LEGACY_SAVED_ENCOUNTERS = "ENCOUNTER_SAVED_STORAGE";
	static _STORAGE_KEY_LEGACY_ENCOUNTER = "ENCOUNTER_STORAGE";

	static _STORAGE_KEY_LEGACY_ENCOUNTER_MIGRATION_VERSION = "ENCOUNTER_STORAGE_MIGRATION_VERSION";
	static _STORAGE_KEY_LEGACY_SAVED_ENCOUNTER_MIGRATION_VERSION = "ENCOUNTER_SAVED_STORAGE_MIGRATION_VERSION";

	static register () {
		SublistPersistor._LEGACY_MIGRATOR.registerLegacyMigration(this._pMigrateSublist.bind(this));
		SaveManager._LEGACY_MIGRATOR.registerLegacyMigration(this._pMigrateSaves.bind(this));
	}

	static async _pMigrateSublist (stored) {
		let version = await StorageUtil.pGet(this._STORAGE_KEY_LEGACY_ENCOUNTER_MIGRATION_VERSION);
		if (version && version >= 2) return false;
		if (!version) version = 1;

		const encounter = await StorageUtil.pGet(this._STORAGE_KEY_LEGACY_ENCOUNTER);
		if (!encounter) return false;

		Object.entries(encounter)
			.forEach(([k, v]) => {
				if (stored[k] != null) return;
				stored[k] = v;
			});

		await EncounterBuilderSublistPlugin.pMutLegacyData({exportedSublist: stored});

		await StorageUtil.pSet(this._STORAGE_KEY_LEGACY_ENCOUNTER_MIGRATION_VERSION, this._VERSION);

		JqueryUtil.doToast(`Migrated active Bestiary encounter from version ${version} to version ${this._VERSION}!`);

		return true;
	}

	static async _pMigrateSaves (stored) {
		let version = await StorageUtil.pGet(this._STORAGE_KEY_LEGACY_SAVED_ENCOUNTER_MIGRATION_VERSION);
		if (version && version >= 2) return false;
		if (!version) version = 1;

		const encounters = await StorageUtil.pGet(this._STORAGE_KEY_LEGACY_SAVED_ENCOUNTERS);
		if (!encounters) return false;

		await Object.entries(encounters.savedEncounters || {})
			.pSerialAwaitMap(async ([id, enc]) => {
				const legacyData = MiscUtil.copyFast(enc.data || {});
				legacyData.name = enc.name || "(Unnamed encounter)";
				legacyData.saveId = id;
				legacyData.manager_isSaved = true;
				await EncounterBuilderSublistPlugin.pMutLegacyData({exportedSublist: legacyData});

				const tgt = MiscUtil.getOrSet(stored, "state", "saves", []);
				tgt.push({
					id: CryptUtil.uid(),
					entity: legacyData,
				});
			});

		await StorageUtil.pSet(this._STORAGE_KEY_LEGACY_SAVED_ENCOUNTER_MIGRATION_VERSION, this._VERSION);

		JqueryUtil.doToast(`Migrated saved Bestiary encounters from version ${version} to version ${this._VERSION}!`);

		return true;
	}
}

EncounterBuilderLegacyStorageMigration.register();
