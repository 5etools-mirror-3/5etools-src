import {FilterSnapshotUi} from "./filter-snapshot-ui.js";

export class FilterSnapshotManager extends BaseComponent {
	static _STORAGE_KEY = "filterSnapshotManagerState";

	/* -------------------------------------------- */

	constructor (
		{
			namespaceSnapshots,
			filterBox,
			filters,
		},
	) {
		super();

		if (!namespaceSnapshots) throw new Error(`"namespaceSnapshots" is required!`);

		this._namespaceSnapshots = namespaceSnapshots;
		this._filterBox = filterBox;
		this._filters = filters;

		this._pDoSaveStateThrottled = MiscUtil.throttle(() => this._pDoSaveState(), 50);

		this._constructor_bindHooks();
	}

	get namespaceSnapshots () { return this._namespaceSnapshots; }

	_constructor_bindHooks () {
		this._addHookAllBase(this._pDoSaveStateThrottled);

		// If a snapshot is removed, remove it from any snapshot decks
		this._addHookBase("boxSnapshots", () => {
			if (!this._state.boxSnapshotDecks.length) return;

			const boxSnapshotIds = new Set(this._state.boxSnapshots.map(it => it.id));

			let anyChanges = false;
			this._state.boxSnapshotDecks
				.forEach(boxSnapshotDeck => {
					const lenBefore = boxSnapshotDeck.entity.boxSnapshotIds.length;

					boxSnapshotDeck.entity.boxSnapshotIds = boxSnapshotDeck.entity.boxSnapshotIds.filter(entityInfo => boxSnapshotIds.has(entityInfo.entity.boxSnapshotId));
					if (lenBefore === boxSnapshotDeck.entity.boxSnapshotIds.length) return;

					anyChanges = true;
				});

			if (anyChanges) this._triggerCollectionUpdate("boxSnapshotDecks");
		});

		// If a deck is removed, and it was the default, unset the default ID
		this._addHookBase("boxSnapshotDecks", () => {
			if (this._state.boxSnapshotDeckDefaultId == null) return;
			if (this._state.boxSnapshotDecks.some(it => it.id === this._state.boxSnapshotDeckDefaultId)) return;
			this._state.boxSnapshotDeckDefaultId = null;
		});

		this._addHookBase("pulse_flushResolverCache", () => this._doFlushCachedResolvedNxtState());

		// If the default deck was changed, flush the cache
		// Note that we bind the rest of these in the renderable collections, which is a little sketchy, but is less
		//   likely to generate bugs
		this._addHookBase("boxSnapshotDeckDefaultId", () => this._state.pulse_flushResolverCache = !this._state.pulse_flushResolverCache);
	}

	/* -------------------------------------------- */

	hasActiveSnapshotDeck () {
		return !!this.getActiveSnapshotDeck();
	}

	getActiveSnapshotDeck () {
		if (this._state.boxSnapshotDeckDefaultId == null) return null;
		return this._state.boxSnapshotDecks
			.find(snapshotDeck => snapshotDeck.id === this._state.boxSnapshotDeckDefaultId);
	}

	getSnapshots ({boxSnapshotDeck = null} = {}) {
		if (boxSnapshotDeck != null && boxSnapshotDeck.entity) throw new Error(`Expected unwrapped format!`);

		if (boxSnapshotDeck == null) {
			const boxSnapshotDeckInfo = this._state.boxSnapshotDecks
				.find(snapshotDeck => snapshotDeck.id === this._state.boxSnapshotDeckDefaultId);
			if (!boxSnapshotDeckInfo) return null;
			boxSnapshotDeck = boxSnapshotDeckInfo.entity;
		}

		const idToSnapshot = this._state.boxSnapshots
			.mergeMap(boxSnapshot => ({[boxSnapshot.id]: boxSnapshot}));

		return boxSnapshotDeck.boxSnapshotIds
			.map(entityInfo => idToSnapshot[entityInfo.entity.boxSnapshotId]?.entity?.filterSnapshots)
			.filter(Boolean)
			.flat();
	}

	/* ----- */

	getBoxSnapshotName ({boxSnapshotId}) {
		return this._state.boxSnapshots.find(boxSnapshotInfo => boxSnapshotInfo.id === boxSnapshotId)?.name;
	}

	/* ----- */

	async pGetUserBoxSnapshotDeckInfo () {
		if (this._state.boxSnapshotDecks.length === 1) {
			return {
				isSilentSelection: true,
				boxSnapshotDeck: this._state.boxSnapshotDecks[0],
			};
		}

		return {
			isSilentSelection: false,
			boxSnapshotDeck: await InputUiUtil.pGetUserEnum({
				values: [...this._state.boxSnapshotDecks],
				title: "Select Snapshot Deck",
				fnDisplay: boxSnapshotDeck => boxSnapshotDeck.entity.manager_name || "(Unnamed)",
				isResolveItem: true,
			}),
		};
	}

	/* ----- */

	async pGetUserBoxSnapshotInfo () {
		if (this._state.boxSnapshots.length === 1) {
			return {
				isSilentSelection: true,
				boxSnapshot: this._state.boxSnapshots[0],
			};
		}

		return {
			isSilentSelection: false,
			boxSnapshot: await InputUiUtil.pGetUserEnum({
				values: [...this._state.boxSnapshots],
				title: "Select Snapshot",
				fnDisplay: boxSnapshot => boxSnapshot.entity.manager_name || "(Unnamed)",
				isResolveItem: true,
			}),
		};
	}

	/* ----- */

	static _SYM_NO_ACTIVE_SNAPSHOT_DECK = Symbol("noActiveSnapshotDeck");

	_cachedResolvedNxtState = null;

	_getCachedResolvedNxtState () {
		if (!this.hasActiveSnapshotDeck()) {
			return this.constructor._SYM_NO_ACTIVE_SNAPSHOT_DECK;
		}

		return this._filters
			.mergeMap(filter => filter.getResetState({snapshots: this.getSnapshots()}));
	}

	getResolvedValue (header, prop, k) {
		this._cachedResolvedNxtState ||= this._getCachedResolvedNxtState();
		if (this._cachedResolvedNxtState === this.constructor._SYM_NO_ACTIVE_SNAPSHOT_DECK) return null;

		return MiscUtil.get(this._cachedResolvedNxtState, header, prop, k);
	}

	_doFlushCachedResolvedNxtState () {
		this._cachedResolvedNxtState = null;
	}

	/* -------------------------------------------- */

	getBtn () {
		const menu = ContextUtil.getMenu([
			new ContextUtil.Action(
				"Take Snapshot",
				() => this.pHandleClick_takeSnapshot(),
			),
			new ContextUtil.Action(
				"Take Snapshot and Make Default",
				async () => {
					const boxSnapshotInfo = await this.pHandleClick_takeSnapshot();
					if (!boxSnapshotInfo) return;

					const boxSnapshotDeckInfo = this.addBoxSnapshotDeck_({
						manager_name: boxSnapshotInfo.entity.manager_name,
						boxSnapshotIds: [
							this.getNewBoxSnapshotId({
								boxSnapshotId: boxSnapshotInfo.id,
								_manager_name: boxSnapshotInfo.entity.manager_name,
							}),
						],
					});

					this._state.boxSnapshotDeckDefaultId = boxSnapshotDeckInfo.id;

					JqueryUtil.doToast("Took Snapshot and Set as Default!");
				},
			),
			null,
			new ContextUtil.Action(
				"Manage Snapshots",
				() => this.pHandleClick_manageSnapshots(),
			),
		]);

		return ee`<button class="ve-btn ve-btn-default ve-btn-xs">Manage Defaults</button>`
			.onn("click", evt => ContextUtil.pOpenMenu(evt, menu));
	}

	/**
	 * @param {?FilterBase[]} filters
	 * @param {?string} nameDefault
	 */
	async pHandleClick_takeSnapshot ({filters = null, nameDefault = null} = {}) {
		filters ??= this._filters;

		const filterSnapshots = filters
			.flatMap(filter => filter.getSnapshots());
		if (!filterSnapshots.length) return JqueryUtil.doToast({type: "warning", content: `All filters are default!`});

		const existingBoxSnapshot = this._getExistingSnapshot(
			this._getNewBoxSnapshot({
				manager_name: "Temp",
				filterSnapshots,
			}),
		);
		if (
			existingBoxSnapshot
			&& !await InputUiUtil.pGetUserBoolean({
				title: "Duplicate Snapshot",
				htmlDescription: `<div><p>An existing snapshot &quot;${existingBoxSnapshot.entity.manager_name || "(Unnamed)"}&quot; contains the same filter values.</p><p>Are you sure you want to take this snapshot?</p></div>`,
				textYes: "Yes",
				textNo: "Cancel",
			})
		) return null;

		const name = await InputUiUtil.pGetUserString({
			title: "Snapshot Name",
			default: nameDefault ? `${nameDefault} Snapshot` : "Snapshot",
		});
		if (!name?.length) return null;

		return this.addBoxSnapshot_({
			manager_name: name,
			filterSnapshots,
		});
	}

	async pHandleClick_createSnapshotDeck () {
		const name = await InputUiUtil.pGetUserString({
			title: "Snapshot Deck Name",
			default: "Snapshot Deck",
		});
		if (!name?.length) return;

		this.addBoxSnapshotDeck_({manager_name: name});
	}

	async pHandleClick_manageSnapshots ({activeTab = "snapshotDecks"} = {}) {
		const ui = new FilterSnapshotUi({
			filterBox: this._filterBox,
			filters: this._filters,
			compManager: this,
		});
		await ui.pRender({activeTab});
	}

	async pHandleClick_takeSnapshotToDefaultDeck ({filters = null, nameDefault = null} = {}) {
		const boxSnapshotInfo = await this.pHandleClick_takeSnapshot({
			filters,
			nameDefault,
		});
		if (!boxSnapshotInfo) return;

		const boxSnapshotDeckInfo = this._pHandleClick_takeSnapshotToDefaultDeck_getCreateDefaultSnapshotDeck();

		boxSnapshotDeckInfo.entity.boxSnapshotIds = [
			...boxSnapshotDeckInfo.entity.boxSnapshotIds,
			this.getNewBoxSnapshotId({
				boxSnapshotId: boxSnapshotInfo.id,
				_manager_name: boxSnapshotInfo.entity.manager_name,
			}),
		];

		this._triggerCollectionUpdate("boxSnapshotDecks");
	}

	_pHandleClick_takeSnapshotToDefaultDeck_getCreateDefaultSnapshotDeck () {
		const snapshotDeck = this.getActiveSnapshotDeck();
		if (snapshotDeck) return snapshotDeck;

		const boxSnapshotDeckInfo = this.addBoxSnapshotDeck_({manager_name: "Default Deck"});
		this._state.boxSnapshotDeckDefaultId = boxSnapshotDeckInfo.id;

		return boxSnapshotDeckInfo;
	}

	/* -------------------------------------------- */

	async pDoLoadState () {
		const toLoad = await StorageUtil.pGet(this._getNamespacedStorageKey());
		if (toLoad == null) return;
		this.setStateFrom(toLoad);
	}

	getSaveableState () {
		const out = super.getSaveableState();
		this._getSaveableState_mutDehydrate(out);
		this._getSaveableState_mutRemoveTransient(out);
		return out;
	}

	_getSaveableState_mutDehydrate (out) {
		delete out.state.pulse_flushResolverCache;
	}

	_getSaveableState_mutRemoveTransient (out) {
		if (!out?.state?.boxSnapshotDecks?.length) return;

		out.state.boxSnapshotDecks
			.forEach(entityInfoBoxSnapshotDeck => {
				if (!entityInfoBoxSnapshotDeck?.entity?.boxSnapshotIds?.length) return;

				entityInfoBoxSnapshotDeck?.entity?.boxSnapshotIds
					?.forEach(entityInfoBoxSnapshotId => {
						delete entityInfoBoxSnapshotId?.entity?._manager_name;
					});
			});
	}

	setStateFrom (toLoad, isOverwrite = false) {
		const cpy = MiscUtil.copyFast(toLoad);
		this._getToLoad_mutHydrate(cpy);
		this._getToLoad_mutAddTransient(cpy);
		super.setStateFrom(cpy, isOverwrite);
	}

	_getToLoad_mutHydrate (toLoad) {
		(toLoad.state ||= {}).pulse_flushResolverCache = false;
	}

	_getToLoad_mutAddTransient (toLoad) {
		if (!toLoad?.state?.boxSnapshotDecks?.length) return toLoad;

		const idToSnapshot = toLoad.state.boxSnapshots
			.mergeMap(boxSnapshot => ({[boxSnapshot.id]: boxSnapshot}));

		toLoad.state.boxSnapshotDecks
			.forEach(entityInfoBoxSnapshotDeck => {
				if (!entityInfoBoxSnapshotDeck?.entity?.boxSnapshotIds?.length) return;

				entityInfoBoxSnapshotDeck.entity.boxSnapshotIds
					.forEach(entityInfoBoxSnapshotId => {
						entityInfoBoxSnapshotId.entity._manager_name = idToSnapshot[entityInfoBoxSnapshotId.entity.boxSnapshotId]?.entity?.manager_name;
					});
			});

		return toLoad;
	}

	_getNamespacedStorageKey () {
		return `${this.constructor._STORAGE_KEY}.${this._namespaceSnapshots}`;
	}

	async _pDoSaveState () {
		await StorageUtil.pSet(this._getNamespacedStorageKey(), this.getSaveableState());
	}

	/* -------------------------------------------- */

	_getExistingSnapshot (boxSnapshot) {
		if (!boxSnapshot.entity) throw new Error(`Expected wrapped format!`);
		return this._state.boxSnapshots
			.find(boxSnapshotExisting => {
				return CollectionUtil.deepEquals(boxSnapshot.entity.filterSnapshots, boxSnapshotExisting.entity.filterSnapshots);
			});
	}

	/* -------------------------------------------- */

	doSetFiltersFromBoxSnapshotDeck_ (boxSnapshotDeck) {
		const snapshots = this.getSnapshots({boxSnapshotDeck});
		this._filterBox.reset({snapshots});
	}

	/* -------------------------------------------- */

	addBoxSnapshot_ (boxSnapshot) {
		const boxSnapshotInfo = this._getNewBoxSnapshot(boxSnapshot);

		this._state.boxSnapshots = [
			...this._state.boxSnapshots,
			boxSnapshotInfo,
		];

		return boxSnapshotInfo;
	}

	addBoxSnapshotDeck_ (boxSnapshotDeck) {
		const boxSnapshotDeckInfo = this._getNewSnapshotDeck(boxSnapshotDeck);

		this._state.boxSnapshotDecks = [
			...this._state.boxSnapshotDecks,
			boxSnapshotDeckInfo,
		];

		return boxSnapshotDeckInfo;
	}

	/* -------------------------------------------- */

	_getNewBoxSnapshot (
		{
			manager_name,
			filterSnapshots,
		},
	) {
		return {
			id: CryptUtil.uid(),
			entity: {
				manager_name,

				filterSnapshots,

				manager_loader_isExpanded: false,
			},
		};
	}

	_getNewSnapshotDeck (
		{
			manager_name,
			boxSnapshotIds,
			manager_loader_isExpanded = false,
		},
	) {
		return {
			id: CryptUtil.uid(),
			entity: {
				manager_name,

				boxSnapshotIds: boxSnapshotIds || [],

				manager_loader_isExpanded,
			},
		};
	}

	getNewBoxSnapshotId (
		{
			boxSnapshotId,
			_manager_name,
		},
	) {
		if (_manager_name === undefined) throw new Error(`"_manager_name" is required!`);
		return {
			id: CryptUtil.uid(),
			entity: {
				boxSnapshotId,
				_manager_name,
			},
		};
	}

	_getDefaultState () {
		return {
			boxSnapshotDeckDefaultId: null,

			boxSnapshots: [],
			boxSnapshotDecks: [],

			pulse_flushResolverCache: false,
		};
	}
}
