import {PARTNERED_CONTENT_MODE_ALL, PARTNERED_CONTENT_MODES} from "./omnisearch-consts.js";

export class OmnisearchState extends BaseComponent {
	static _STORAGE_NAME = "search";

	static _DEFAULT_STATE = {
		partneredMode: PARTNERED_CONTENT_MODE_ALL,
		isShowBrew: true,
		isShowUa: true,
		isShowBlocklisted: false,
		isShowLegacy: false,
		isSrdOnly: false,
	};

	static _COMP = null;

	static _getComp () {
		if (this._COMP) return this._COMP;

		this._COMP = new this();

		const saved = StorageUtil.syncGet(this._STORAGE_NAME) || {};
		Object.entries(this._DEFAULT_STATE)
			.forEach(([k, v]) => saved[k] ??= v);
		if (!PARTNERED_CONTENT_MODES.includes(saved.partneredMode)) saved.partneredMode = this._DEFAULT_STATE.partneredMode;

		this._COMP._proxyAssignSimple("state", saved);

		this._COMP._addHookAll("state", () => {
			StorageUtil.syncSet(this._STORAGE_NAME, this._COMP.toObject());
		});

		return this._COMP;
	}

	static addHookPartnered (hk) { return this._getComp()._addHookBase("partneredMode", hk); }
	static addHookBrew (hk) { return this._getComp()._addHookBase("isShowBrew", hk); }
	static addHookUa (hk) { return this._getComp()._addHookBase("isShowUa", hk); }
	static addHookBlocklisted (hk) { return this._getComp()._addHookBase("isShowBlocklisted", hk); }
	static addHookLegacy (hk) { return this._getComp()._addHookBase("isShowLegacy", hk); }
	static addHookSrdOnly (hk) { return this._getComp()._addHookBase("isSrdOnly", hk); }

	static doToggleBrew () { this._getComp()._state.isShowBrew = !this._getComp()._state.isShowBrew; }
	static doToggleUa () { this._getComp()._state.isShowUa = !this._getComp()._state.isShowUa; }
	static doToggleBlocklisted () { this._getComp()._state.isShowBlocklisted = !this._getComp()._state.isShowBlocklisted; }
	static doToggleLegacy () { this._getComp()._state.isShowLegacy = !this._getComp()._state.isShowLegacy; }
	static doToggleSrdOnly () { this._getComp()._state.isSrdOnly = !this._getComp()._state.isSrdOnly; }

	static getPartneredMode () { return this._getComp()._state.partneredMode; }
	static get isShowBrew () { return this._getComp()._state.isShowBrew; }
	static get isShowUa () { return this._getComp()._state.isShowUa; }
	static get isShowBlocklisted () { return this._getComp()._state.isShowBlocklisted; }
	static get isShowLegacy () { return this._getComp()._state.isShowLegacy; }
	static get isSrdOnly () { return this._getComp()._state.isSrdOnly; }

	static setPartneredMode (val) { this._getComp()._state.partneredMode = val; }
	static set isShowBrew (val) { this._getComp()._state.isShowBrew = !!val; }
	static set isShowUa (val) { this._getComp()._state.isShowUa = !!val; }
	static set isShowBlocklisted (val) { this._getComp()._state.isShowBlocklisted = !!val; }
	static set isShowLegacy (val) { this._getComp()._state.isShowLegacy = !!val; }
	static set isSrdOnly (val) { this._getComp()._state.isSrdOnly = !!val; }
}
