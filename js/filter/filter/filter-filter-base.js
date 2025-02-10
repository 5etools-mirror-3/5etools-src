import {FilterRegistry} from "../filter-registry.js";

/** @abstract */
export class FilterBase extends BaseComponent {
	/** @type {FilterBox} */
	_filterBox = null;

	/** @type {FilterSnapshotManager} */
	_snapshotManager = null;

	/**
	 * @param opts
	 * @param opts.header Filter header (name)
	 * @param [opts.headerDisplayName] Filter display name
	 * @param [opts.headerHelp] Filter header help text (tooltip)
	 */
	constructor (opts) {
		super();

		this.header = opts.header;
		this._headerDisplayName = opts.headerDisplayName;
		this._headerHelp = opts.headerHelp;

		this.__meta = {...this.getDefaultMeta()};
		this._meta = this._getProxy("meta", this.__meta);

		this.__uiMeta = {...this.getDefaultUiMeta()};
		this._uiMeta = this._getProxy("uiMeta", this.__uiMeta);

		this._hasUserSavedState = false;
		this._fnsTeardown = [];
	}

	_getHeaderDisplayName () {
		return this._headerDisplayName || this.header;
	}

	_getRenderedHeader () {
		return `<span ${this._headerHelp ? `title="${this._headerHelp.escapeQuotes()}" class="help-subtle"` : ""}>${this._getHeaderDisplayName()}</span>`;
	}

	set filterBox (it) { this._filterBox = it; }
	set snapshotManager (it) { this._snapshotManager = it; }

	show () { this._uiMeta.isHidden = false; }
	hide () { this._uiMeta.isHidden = true; }

	addHookAllState (hk) {
		this._addHookAll("state", hk);
	}

	getBaseSaveableState () {
		return {
			meta: {...this.__meta},
			uiMeta: {...this.__uiMeta},
		};
	}

	_getNextState_base () {
		return {
			[this.header]: {
				state: MiscUtil.copyFast(this.__state),
				meta: MiscUtil.copyFast(this.__meta),
				uiMeta: MiscUtil.copyFast(this.__uiMeta), // read-only
			},
		};
	}

	setStateFromNextState (nxtState) {
		this._proxyAssignSimple("state", nxtState[this.header].state, true);
		this._proxyAssignSimple("meta", nxtState[this.header].meta, true);
	}

	reset ({isResetAll = false, snapshots = null} = {}) {
		const nxtState = this.getResetState({isResetAll, snapshots});
		this.setStateFromNextState(nxtState);
	}

	getResetState ({isResetAll = false, snapshots = null} = {}) {
		const nxtState = this._getNextState_base();
		this._mutNextState_reset({nxtState, isResetAll});
		this._mutNextState_fromSnapshots({nxtState, isResetAll, snapshots});
		return nxtState;
	}

	_mutNextState_resetBase ({nxtState, isResetAll = false}) {
		Object.assign(nxtState[this.header].meta, MiscUtil.copy(this.getDefaultMeta()));
	}

	getMetaSubHashes () {
		const compressedMeta = this._getCompressedMeta();
		if (!compressedMeta) return null;
		return [UrlUtil.packSubHash(this.getSubHashPrefix("meta", this.header), compressedMeta)];
	}

	_mutNextState_meta_fromSubHashState (nxtState, subHashState) {
		const hasMeta = this._mutNextState_meta_fromSubHashState_mutGetHasMeta(nxtState, subHashState, this.getDefaultMeta());
		if (!hasMeta) this._mutNextState_resetBase({nxtState});
	}

	_mutNextState_meta_fromSubHashState_mutGetHasMeta (nxtState, state, defaultMeta) {
		let hasMeta = false;

		Object.entries(state)
			.forEach(([k, vals]) => {
				const prop = FilterBase.getProp(k);
				if (prop !== "meta") return;

				hasMeta = true;
				const data = vals.map(v => UrlUtil.mini.decompress(v));
				Object.keys(defaultMeta).forEach((k, i) => {
					if (data[i] !== undefined) nxtState[this.header].meta[k] = data[i];
					else nxtState[this.header].meta[k] = defaultMeta[k];
				});
			});

		return hasMeta;
	}

	setBaseStateFromLoaded (toLoad) {
		Object.assign(this._meta, toLoad.meta);
		if (toLoad.uiMeta) Object.assign(this._uiMeta, toLoad.uiMeta);
	}

	getSubHashPrefix (prop, header) {
		if (FilterBase._SUB_HASH_PREFIXES[prop]) {
			const prefix = this._filterBox.getNamespacedHashKey(FilterBase._SUB_HASH_PREFIXES[prop]);
			return `${prefix}${header.toUrlified()}`;
		}
		throw new Error(`Unknown property "${prop}"`);
	}

	static getProp (prefix) {
		return Parser._parse_bToA(FilterBase._SUB_HASH_PREFIXES, prefix);
	}

	_getBtnMobToggleControls (wrpControls) {
		const btnMobToggleControls = e_({
			tag: "button",
			clazz: `ve-btn ve-btn-xs ve-btn-default mobile__visible ml-auto px-3 mr-2`,
			html: `<span class="glyphicon glyphicon-option-vertical"></span>`,
			click: () => this._uiMeta.isMobileHeaderHidden = !this._uiMeta.isMobileHeaderHidden,
		});
		const hkMobHeaderHidden = () => {
			btnMobToggleControls.toggleClass("active", !this._uiMeta.isMobileHeaderHidden);
			wrpControls.toggleClass("mobile__hidden", !!this._uiMeta.isMobileHeaderHidden);
		};
		this._addHook("uiMeta", "isMobileHeaderHidden", hkMobHeaderHidden);
		hkMobHeaderHidden();

		return btnMobToggleControls;
	}

	getChildFilters () { return []; }

	/**
	 * @abstract
	 * @return {object}
	 */
	getDefaultMeta () { throw new Error("Unimplemented!"); }
	getDefaultUiMeta () { return {...FilterBase._DEFAULT_UI_META}; }

	/**
	 * @param vals Previously-read filter value may be passed in for performance.
	 */
	isActive (vals) {
		vals = vals || this.getValues();
		return vals[this.header]._isActive;
	}

	_getCompressedMeta () {
		const defaultMeta = this.getDefaultMeta();
		const isAnyNotDefault = Object.keys(defaultMeta).some(k => this._meta[k] !== defaultMeta[k]);
		if (!isAnyNotDefault) return null;

		let keys = Object.keys(defaultMeta);

		// Pop keys from the end if they match the default value
		while (keys.length && defaultMeta[keys.last()] === this._meta[keys.last()]) keys.pop();

		return keys.map(k => UrlUtil.mini.compress(this._meta[k] === undefined ? defaultMeta[k] : this._meta[k]));
	}

	_getBtnShowHide ({isMulti = false} = {}) {
		return e_({
			tag: "button",
			clazz: `ve-btn ve-btn-default ${isMulti ? "ve-btn-xxs" : "ve-btn-xs"}`,
			click: () => this._uiMeta.isHidden = !this._uiMeta.isHidden,
			html: "Hide",
		});
	}

	_getBtnMenu ({isMulti = false} = {}) {
		if (isMulti) return null;

		let menu = null;

		return e_({
			tag: "button",
			clazz: `ve-btn ve-btn-default ve-btn-xs`,
			click: evt => {
				if (!menu) {
					this._fnsTeardown.push(() => {
						ContextUtil.deleteMenu(menu);
						menu = null;
					});
				}

				menu ||= ContextUtil.getMenu([
					new ContextUtil.Action(
						"Take Snapshot",
						async () => {
							await this._snapshotManager.pHandleClick_takeSnapshot({
								filters: [this],
								nameDefault: this._getHeaderDisplayName(),
							});
						},
					),
					new ContextUtil.Action(
						"Take Snapshot and Add to Default Deck",
						async () => {
							await this._snapshotManager.pHandleClick_takeSnapshotToDefaultDeck({
								filters: [this],
								nameDefault: this._getHeaderDisplayName(),
							});
						},
					),
					null,
					new ContextUtil.Action(
						"Manage Snapshots",
						async () => {
							await this._snapshotManager.pHandleClick_manageSnapshots({activeTab: "snapshots"});
						},
					),
				]);

				ContextUtil.pOpenMenu(evt, menu).then(null);
			},
			html: `<span title="Other Options" class="glyphicon glyphicon-option-vertical"></span>`,
		});
	}

	/* -------------------------------------------- */

	_getStateNotDefault_generic ({nxtState = null, isIgnoreSnapshot = false} = {}) {
		const state = nxtState?.[this.header]?.state || this.__state;

		return Object.entries(state)
			.filter(([k, v]) => {
				if (k.startsWith("_")) return false;
				const defState = this._getDefaultItemState(k, {isIgnoreSnapshot});
				return defState !== v;
			});
	}

	/* -------------------------------------------- */

	_getSnapshots_generic () {
		return [
			{
				header: this.header,
				state: this._getSnapshots_state(),
				meta: this._getSnapshots_meta(),
			},
		];
	}

	_getSnapshots_state () {
		return Object.fromEntries(
			// Ignore snapshot, as we want to diff against the built-in state
			this._getStateNotDefault({isIgnoreSnapshot: true}),
		);
	}

	_getSnapshots_meta () {
		const metaDefault = this.getDefaultMeta();

		return Object.fromEntries(
			Object.entries(this.__meta)
				.filter(([k, v]) => metaDefault[k] !== v),
		);
	}

	/* -------------------------------------------- */

	isAnySnapshotRelevant ({snapshots}) {
		const snapshotsFilter = (snapshots || []).filter(snapshot => snapshot.header === this.header);
		return !!snapshotsFilter.length;
	}

	/* -------------------------------------------- */

	_mutNextState_fromSnapshots_generic ({nxtState, snapshots = null}) {
		const snapshotsFilter = (snapshots || []).filter(snapshot => snapshot.header === this.header);

		MiscUtil.getOrSet(nxtState, this.header, "state", {});
		MiscUtil.getOrSet(nxtState, this.header, "meta", {});

		// Apply snapshots in order listed
		snapshotsFilter
			.forEach(snapshot => {
				this._mutNextState_fromSnapshots_state({nxtState, snapshot});
				this._mutNextState_fromSnapshots_meta({nxtState, snapshot});
			});
	}

	_mutNextState_fromSnapshots_state_generic ({nxtState, snapshot}) {
		const appliedKeys = new Set(Object.keys(snapshot.state || {}));

		Object.entries(snapshot.state || {})
			.forEach(([k, v]) => nxtState[this.header].state[k] = v);

		Object.keys(nxtState[this.header].state)
			.filter(k => !appliedKeys.has(k))
			// Ignore snapshot, as we want to diff against the built-in defaults
			.forEach(k => nxtState[this.header].state[k] = this._getDefaultItemState(k, {isIgnoreSnapshot: true}));
	}

	_mutNextState_fromSnapshots_meta_generic ({nxtState, snapshot}) {
		const appliedKeys = new Set(Object.keys(snapshot.meta || {}));

		Object.entries(snapshot.meta || {})
			.forEach(([k, v]) => nxtState[this.header].meta[k] = v);

		const defaultMeta = this.getDefaultMeta();
		Object.entries(defaultMeta)
			.filter(([k]) => !appliedKeys.has(k))
			.forEach(([k, v]) => nxtState[this.header].meta[k] = v);
	}

	/* -------------------------------------------- */

	doTeardown () {
		this._fnsTeardown.forEach(fn => fn());
		this._fnsTeardown = [];
		this._doTeardown();
	}

	/* -------------------------------------------- */

	_getDisplayStatePart_getHeader ({isPlainText = false} = {}) {
		if (isPlainText) return `${this._getHeaderDisplayName()}: `;
		return `<span class="ve-text-right w-140p no-shrink mr-2 bold">${this._getHeaderDisplayName()}:</span>`;
	}

	/* -------------------------------------------- */

	/**
	 * @param {?object} nxtState
	 * @param {boolean} isIgnoreSnapshot
	 * @return {boolean}
	 */
	isAnyStateNotDefault ({nxtState = null, isIgnoreSnapshot = false} = {}) {
		const anyNotDefault = this._getStateNotDefault({nxtState, isIgnoreSnapshot});
		return !!anyNotDefault.length;
	}

	/* -------------------------------------------- */

	/** @abstract */
	$render () { throw new Error(`Unimplemented!`); }
	/** @abstract */
	$renderMinis () { throw new Error(`Unimplemented!`); }

	/** @abstract */
	getValues ({nxtState = null} = {}) { throw new Error(`Unimplemented!`); }

	/** @abstract */
	getSnapshots () { throw new Error(`Unimplemented!`); }

	/**
	 * @abstract
	 * @param {object} nxtState
	 * @param {boolean} isResetAll
	 * @return {void}
	 */
	_mutNextState_reset ({nxtState, isResetAll = false}) { throw new Error(`Unimplemented!`); }
	/**
	 * @abstract
	 * @param {object} nxtState
	 * @param {?Array<object>} snapshots
	 * @return {void}
	 */
	_mutNextState_fromSnapshots ({nxtState, snapshots = null}) { throw new Error("Unimplemented!"); }
	/**
	 * @abstract
	 * @param {object} nxtState
	 * @param {object} snapshot
	 * @return {void}
	 */
	_mutNextState_fromSnapshots_state ({nxtState, snapshot}) { throw new Error("Unimplemented!"); }
	/**
	 * @abstract
	 * @param {object} nxtState
	 * @param {object} snapshot
	 * @return {void}
	 */
	_mutNextState_fromSnapshots_meta ({nxtState, snapshot}) { throw new Error("Unimplemented!"); }

	/**
	 * @abstract
	 * @param {object} nxtState
	 * @param {boolean} isIgnoreSnapshot
	 * @return {object}
	 */
	_getStateNotDefault ({nxtState = null, isIgnoreSnapshot = false} = {}) { throw new Error("Unimplemented!"); }
	/**
	 * @abstract
	 * @param {string} k
	 * @param {boolean} isIgnoreSnapshot
	 * @return {*}
	 */
	_getDefaultItemState (k, {isIgnoreSnapshot = false} = {}) { throw new Error("Unimplemented!"); }

	/** @abstract */
	update () { throw new Error(`Unimplemented!`); }
	/** @abstract */
	toDisplay () { throw new Error(`Unimplemented!`); }
	/** @abstract */
	addItem () { throw new Error(`Unimplemented!`); }
	/**
	 * @abstract
	 * N.B.: due to a bug in Chrome, these return a copy of the underlying state rather than a copy of the proxied state
	 */
	getSaveableState () { throw new Error(`Unimplemented!`); }
	/** @abstract */
	setStateFromLoaded () { throw new Error(`Unimplemented!`); }
	/** @abstract */
	getSubHashes () { throw new Error(`Unimplemented!`); }
	/** @abstract */
	getNextStateFromSubhashState () { throw new Error(`Unimplemented!`); }
	/** @abstract */
	setFromValues () { throw new Error(`Unimplemented!`); }
	/** @abstract */
	handleSearch () { throw new Error(`Unimplemented!`); }
	/** @abstract */
	getFilterTagPart () { throw new Error(`Unimplemented`); }
	/**
	 * @abstract
	 * @param {?object} nxtState
	 * @param {boolean} isIgnoreSnapshot
	 * @return {?string}
	 */
	getDisplayStatePart ({nxtState = null, isIgnoreSnapshot = false} = {}) { throw new Error(`Unimplemented`); }
	/**
	 * @abstract
	 * @param {?object} nxtState
	 * @param {boolean} isIgnoreSnapshot
	 * @param {boolean} isPlainText
	 * @return {Array<string>}
	 */
	getDisplayStatePartsHtml ({nxtState = null, isIgnoreSnapshot = false} = {}) { throw new Error(`Unimplemented`); }
	/** @abstract */
	getSnapshotPreviews (snapshots) { throw new Error(`Unimplemented`); }
	_doTeardown () { /* No-op */ }
	trimState_ () { /* No-op */ }
}

FilterBase._DEFAULT_UI_META = {
	isHidden: false,
	isMobileHeaderHidden: true,
};

// These are assumed to be the same length (4 characters)
FilterBase._SUB_HASH_STATE_PREFIX = "flst";
FilterBase._SUB_HASH_META_PREFIX = "flmt";
FilterBase._SUB_HASH_NESTS_HIDDEN_PREFIX = "flnh";
FilterBase._SUB_HASH_OPTIONS_PREFIX = "flop";
FilterBase._SUB_HASH_PREFIXES = {
	state: FilterBase._SUB_HASH_STATE_PREFIX,
	meta: FilterBase._SUB_HASH_META_PREFIX,
	nestsHidden: FilterBase._SUB_HASH_NESTS_HIDDEN_PREFIX,
	options: FilterBase._SUB_HASH_OPTIONS_PREFIX,
};

FilterRegistry.registerSubhashes(Object.values(FilterBase._SUB_HASH_PREFIXES));
