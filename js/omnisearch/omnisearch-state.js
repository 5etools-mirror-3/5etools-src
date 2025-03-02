export class OmnisearchState extends BaseComponent {
	static _STORAGE_NAME = "search";

	static _DEFAULT_STATE = {
		isShowPartnered: false,
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

		this._COMP._proxyAssignSimple("state", saved);

		this._COMP._addHookAll("state", () => {
			StorageUtil.syncSet(this._STORAGE_NAME, this._COMP.toObject());
		});

		return this._COMP;
	}

	static addHookPartnered (hk) { return this._getComp()._addHookBase("isShowPartnered", hk); }
	static addHookBrew (hk) { return this._getComp()._addHookBase("isShowBrew", hk); }
	static addHookUa (hk) { return this._getComp()._addHookBase("isShowUa", hk); }
	static addHookBlocklisted (hk) { return this._getComp()._addHookBase("isShowBlocklisted", hk); }
	static addHookLegacy (hk) { return this._getComp()._addHookBase("isShowLegacy", hk); }
	static addHookSrdOnly (hk) { return this._getComp()._addHookBase("isSrdOnly", hk); }

	static doTogglePartnered () { this._getComp()._state.isShowPartnered = !this._getComp()._state.isShowPartnered; }
	static doToggleBrew () { this._getComp()._state.isShowBrew = !this._getComp()._state.isShowBrew; }
	static doToggleUa () { this._getComp()._state.isShowUa = !this._getComp()._state.isShowUa; }
	static doToggleBlocklisted () { this._getComp()._state.isShowBlocklisted = !this._getComp()._state.isShowBlocklisted; }
	static doToggleLegacy () { this._getComp()._state.isShowLegacy = !this._getComp()._state.isShowLegacy; }
	static doToggleSrdOnly () { this._getComp()._state.isSrdOnly = !this._getComp()._state.isSrdOnly; }

	static get isShowPartnered () { return this._getComp()._state.isShowPartnered; }
	static get isShowBrew () { return this._getComp()._state.isShowBrew; }
	static get isShowUa () { return this._getComp()._state.isShowUa; }
	static get isShowBlocklisted () { return this._getComp()._state.isShowBlocklisted; }
	static get isShowLegacy () { return this._getComp()._state.isShowLegacy; }
	static get isSrdOnly () { return this._getComp()._state.isSrdOnly; }

	static set isShowPartnered (val) { this._getComp()._state.isShowPartnered = !!val; }
	static set isShowBrew (val) { this._getComp()._state.isShowBrew = !!val; }
	static set isShowUa (val) { this._getComp()._state.isShowUa = !!val; }
	static set isShowBlocklisted (val) { this._getComp()._state.isShowBlocklisted = !!val; }
	static set isShowLegacy (val) { this._getComp()._state.isShowLegacy = !!val; }
	static set isSrdOnly (val) { this._getComp()._state.isSrdOnly = !!val; }
}
