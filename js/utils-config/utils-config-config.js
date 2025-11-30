import {SETTINGS_GROUPS} from "./utils-config-registry.js";
import {UtilConfigHelpers} from "./util-config-helpers.js";

export class VetoolsConfig {
	static _STORAGE_KEY = "config";

	static _STORAGE = StorageUtil;

	static _CONFIG = null;

	static _init () {
		if (this._CONFIG) return;

		this._CONFIG = this._STORAGE.syncGet(this._STORAGE_KEY) || {};

		SETTINGS_GROUPS
			.forEach(settingsGroup => settingsGroup.mutDefaults(this._CONFIG));

		SETTINGS_GROUPS
			.forEach(settingsGroup => settingsGroup.mutVerify(this._CONFIG));
	}

	/* -------------------------------------------- */

	static get (groupId, configId) {
		this._init();
		return this._CONFIG[groupId]?.[configId];
	}

	static set (groupId, configId, val) {
		this._init();
		((this._CONFIG ||= {})[groupId] ||= {})[configId] = val;
		this._save();
	}

	/* -------------------------------------------- */

	static _save () {
		this._STORAGE.syncSet(this._STORAGE_KEY, this._CONFIG);
	}

	static _saveThrottled = MiscUtil.throttle(this._save.bind(this), 50);

	/* -------------------------------------------- */

	static getConfigComp () {
		this._init();

		const state = {};
		Object.entries(this._CONFIG)
			.forEach(([groupId, groupTo]) => {
				Object.entries(groupTo)
					.forEach(([configId, val]) => {
						state[UtilConfigHelpers.packSettingId(groupId, configId)]	= MiscUtil.copyFast(val);
					});
			});

		const comp = BaseComponent.fromObject(state, "*");
		comp._addHookAllBase(() => {
			Object.entries(comp._state)
				.forEach(([settingId, v]) => {
					const {groupId, configId} = UtilConfigHelpers.unpackSettingId(settingId);
					MiscUtil.set(this._CONFIG, groupId, configId, v);
				});

			this._saveThrottled();
		});

		return comp;
	}
}
