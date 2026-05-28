/**
 * @abstract
 */
export class EncounterBuilderPartyBase extends BaseComponent {
	partyId;
	displayName;

	/**
	 * @param rendererWrapped
	 * @param {?string} displayName
	 */
	constructor (
		{
			rendererWrapped,
			displayName = null,
		},
	) {
		if (!rendererWrapped) throw new Error(`Missing required "rendererWrapped" option!`);

		super();

		this._rendererWrapped = rendererWrapped;
		if (displayName != null) this.displayName = displayName;
	}

	/* -------------------------------------------- */

	addHookOnSave (hk) { return this._addHookAll("state", hk); }

	_isSuppressPartyChangeHook = false;
	setIsSuppressPartyChangeHook (val) { this._isSuppressPartyChangeHook = !!val; }
	addHookOnPartyChange (hk) {
		return this._addHookAllBase((...args) => {
			if (this._isSuppressPartyChangeHook) return;
			hk(...args);
		});
	}

	/* -------------------------------------------- */

	setStateFromLoaded (loadedState) {
		this._mutValidateLoadedState(loadedState);
		this._proxyAssignSimple("state", MiscUtil.copyFast(loadedState), true);
	}

	setPartialStateFromLoaded (partialLoadedState) {
		this._mutValidateLoadedState(partialLoadedState);
		this._proxyAssignSimple("state", partialLoadedState);
	}

	/**
	 * @abstract
	 * @return void
	 */
	_mutValidateLoadedState (partialLoadedState) { throw new Error("Unimplemented!"); }

	/* -------------------------------------------- */

	/**
	 * @abstract
	 * @return {Array<EncounterPartyPlayerMeta>}
	 */
	getPartyPlayerMetas () { throw new Error("Unimplemented!"); }

	/* -------------------------------------------- */

	/**
	 * @abstract
	 * @return {{eles: Array<HTMLElementExtended>}}
	 */
	render ({stgGroup}) { throw new Error("Unimplemented!"); }

	/* -------------------------------------------- */

	doCleanup () { /* Implement as required */ }

	/* -------------------------------------------- */

	mutDeExternalize ({out}) { /* Specific to Bestiary integration; implement as required. */ }
}
