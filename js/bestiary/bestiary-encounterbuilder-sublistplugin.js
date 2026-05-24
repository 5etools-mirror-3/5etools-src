import {EncounterBuilderHelpers} from "../utils-list-bestiary.js";
import {EncounterBuilderComponentBestiary} from "./bestiary-encounterbuilder-component.js";
import {EncounterBuilderPartyCustom} from "../encounterbuilder/party/encounterbuilder-party-custom.js";
import {EncounterBuilderPartyCustomAdvanced} from "../encounterbuilder/party/encounterbuilder-party-custom-advanced.js";

/**
 * Serialize/deserialize state from the encounter builder.
 */
export class EncounterBuilderSublistPlugin extends SublistPlugin {
	constructor ({sublistManager, encounterBuilder, encounterBuilderComp, partyComps}) {
		super();
		this._sublistManager = sublistManager;
		this._encounterBuilder = encounterBuilder;
		this._encounterBuilderComp = encounterBuilderComp;
		this._partyComps = partyComps;
		this._partyCompsLookup = Object.fromEntries(this._partyComps.map(comp => [comp.partyId, comp]));
	}

	/* -------------------------------------------- */

	_pLoadData_getStateFromOptionallyExternalized ({partyComp, toLoad, isMemoryOnly}) {
		const out = MiscUtil.copyFast(toLoad?.state || {});

		if (isMemoryOnly) return out;

		partyComp.mutDeExternalize({out});

		return out;
	}

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
				.forEach(([k, v]) => {
					if (isMemoryOnly) return nxt[k] = MiscUtil.copyFast(v);

					// When loading from non-memory sources, expand the data
					switch (k) {
						case "customShapeGroups": return nxt[k] = v.map(it => EncounterBuilderComponentBestiary.getDefaultCustomShapeGroup(it));

						default: return nxt[k] = v;
					}
				});
		}

		this._partyComps
			.forEach(partyComp => {
				const toLoad = exportedSublist?.statePartyComps?.[partyComp.partyId];

				partyComp.setIsSuppressPartyChangeHook(true);
				try {
					partyComp.setStateFromLoaded(this._pLoadData_getStateFromOptionallyExternalized({partyComp, toLoad, isMemoryOnly}));
				} finally {
					partyComp.setIsSuppressPartyChangeHook(false);
				}
			});

		this._encounterBuilder.setActivePartyId(exportedSublist?.activePartyId || this._partyComps[0].partyId);

		// Note that we do not set `creatureMetas` here, as `onSublistUpdate` handles this
		this._encounterBuilderComp.setStateFromLoaded(nxt);
	}

	/* -------------------------------------------- */

	static _pMutLegacyData_bestiaryEncounterFormat ({exportedSublist, isMemoryOnly}) {
		if (exportedSublist.p) {
			exportedSublist.playersSimple = exportedSublist.p.map(it => EncounterBuilderPartyCustom.getDefaultPlayerRow_simple(it));
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
			exportedSublist.colsExtraAdvanced = exportedSublist.c.map(name => EncounterBuilderPartyCustomAdvanced.getDefaultColExtraAdvanced({name}));
			if (!isMemoryOnly) this._mutExternalize({obj: exportedSublist, k: "colsExtraAdvanced"});
			delete exportedSublist.c;
		}

		if (exportedSublist.d) {
			exportedSublist.playersAdvanced = exportedSublist.d.map(({n, l, x}) => EncounterBuilderPartyCustomAdvanced.getDefaultPlayerRow_advanced({
				name: n,
				level: l,
				extras: (x || []).map(value => EncounterBuilderPartyCustomAdvanced.getDefaultPlayerAdvancedExtra({value})),
				colsExtraAdvanced: exportedSublist.colsExtraAdvanced,
			}));
			if (!isMemoryOnly) this._mutExternalize({obj: exportedSublist, k: "playersAdvanced"});
			delete exportedSublist.d;
		}
	}

	static _pMutLegacyData_referenceFormat ({exportedSublist, isMemoryOnly}) {
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
	}

	static _pMutLegacyData_partyState ({exportedSublist, isMemoryOnly}) {
		const hasPartyState = exportedSublist.playersSimple != null
			|| exportedSublist.colsExtraAdvanced != null
			|| exportedSublist.playersAdvanced != null;

		if (hasPartyState) exportedSublist.statePartyComps = exportedSublist.statePartyComps || {};

		if (exportedSublist.playersSimple != null) {
			MiscUtil.getOrSet(exportedSublist.statePartyComps, EncounterBuilderPartyCustom.PARTY_ID, "state", {})
				.playersSimple = exportedSublist.playersSimple;
			delete exportedSublist.playersSimple;
		}

		if (exportedSublist.colsExtraAdvanced != null || exportedSublist.playersAdvanced != null) {
			const state = MiscUtil.getOrSet(exportedSublist.statePartyComps, EncounterBuilderPartyCustomAdvanced.PARTY_ID, "state", {});
			if (exportedSublist.colsExtraAdvanced != null) {
				state.colsExtraAdvanced = exportedSublist.colsExtraAdvanced;
				delete exportedSublist.colsExtraAdvanced;
			}
			if (exportedSublist.playersAdvanced != null) {
				state.playersAdvanced = exportedSublist.playersAdvanced;
				delete exportedSublist.playersAdvanced;
			}
		}

		if (exportedSublist.activePartyId == null && exportedSublist.isAdvanced != null) {
			exportedSublist.activePartyId = exportedSublist.isAdvanced
				? EncounterBuilderPartyCustomAdvanced.PARTY_ID
				: EncounterBuilderPartyCustom.PARTY_ID;
		}
		delete exportedSublist.isAdvanced;

		if (!isMemoryOnly) this._mutExternalize({obj: exportedSublist, k: "statePartyComps"});
	}

	static async pMutLegacyData ({exportedSublist, isMemoryOnly}) {
		if (!exportedSublist) return;

		this._pMutLegacyData_bestiaryEncounterFormat({exportedSublist, isMemoryOnly});
		this._pMutLegacyData_referenceFormat({exportedSublist, isMemoryOnly});
		this._pMutLegacyData_partyState({exportedSublist, isMemoryOnly});
	}

	async pMutLegacyData ({exportedSublist, isMemoryOnly}) {
		await this.constructor.pMutLegacyData({exportedSublist, isMemoryOnly});
	}

	/* -------------------------------------------- */

	static _WALKER_EXTERNALIZE = null;
	static _HANDLERS_EXTERNALIZE = {
		array: (arr) => {
			if (arr.some(it => !it.id || !it.entity)) return arr;
			return arr.map(({entity}) => entity);
		},
	};

	/**
	 * Convert arrays from `[{id, entity}]` form to `[<entity>]` form.
	 */
	static _mutExternalize ({obj, k}) {
		if (obj[k] == null) return;

		this._WALKER_EXTERNALIZE ||= MiscUtil.getWalker();

		obj[k] = this._WALKER_EXTERNALIZE.walk(
			obj[k],
			this._HANDLERS_EXTERNALIZE,
		);
	}

	async pMutSaveableData ({exportedSublist, isForce = false, isMemoryOnly = false}) {
		if (!isForce && !this._encounterBuilder.isActive()) return;

		const stateByKey = {
			activePartyId: this._encounterBuilder.getActivePartyId(),
			statePartyComps: Object.fromEntries(
				this._partyComps
					.map(partyComp => [partyComp.partyId, partyComp.getSaveableState()]),
			),
			customShapeGroups: this._encounterBuilderComp.customShapeGroups,
		};

		Object.entries(stateByKey).forEach(([k, v]) => {
			exportedSublist[k] = MiscUtil.copyFast(v);

			if (isMemoryOnly) return;

			this.constructor._mutExternalize({obj: exportedSublist, k});
		});
	}

	/* -------------------------------------------- */

	async pDoInitNewState ({prevExportableSublist, evt}) {
		// If SHIFT pressed, reset players and custom shape
		const isResetDeep = !!evt.shiftKey;

		this._partyComps
			.forEach(partyComp => {
				if (isResetDeep) return partyComp.setStateFromLoaded({});

				partyComp.setStateFromLoaded(MiscUtil.copyFast(prevExportableSublist.statePartyComps?.[partyComp.partyId]?.state || {}));
			});

		this._encounterBuilderComp.setPartialStateFromLoaded({
			customShapeGroups: isResetDeep ? [] : MiscUtil.copyFast(prevExportableSublist.customShapeGroups),
		});
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
