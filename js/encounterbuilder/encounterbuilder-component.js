import {EncounterPartyMeta, EncounterPartyPlayerMeta} from "./encounterbuilder-models.js";

export class EncounterBuilderComponent extends BaseComponent {
	static _DEFAULT_PARTY_SIZE = 4;

	/* -------------------------------------------- */

	get creatureMetas () { return this._state.creatureMetas; }
	set creatureMetas (val) { this._state.creatureMetas = val; }

	get isAdvanced () { return this._state.isAdvanced; }
	set isAdvanced (val) { this._state.isAdvanced = !!val; }

	get playersSimple () { return this._state.playersSimple; }
	set playersSimple (val) { this._state.playersSimple = val; }

	get colsExtraAdvanced () { return this._state.colsExtraAdvanced; }
	set colsExtraAdvanced (val) { this._state.colsExtraAdvanced = val; }

	get playersAdvanced () { return this._state.playersAdvanced; }
	set playersAdvanced (val) { this._state.playersAdvanced = val; }

	/* -------------------------------------------- */

	addHookCreatureMetas (hk) { return this._addHookBase("creatureMetas", hk); }
	addHookIsAdvanced (hk) { return this._addHookBase("isAdvanced", hk); }
	addHookPlayersSimple (hk) { return this._addHookBase("playersSimple", hk); }
	addHookPlayersAdvanced (hk) { return this._addHookBase("playersAdvanced", hk); }
	addHookColsExtraAdvanced (hk) { return this._addHookBase("colsExtraAdvanced", hk); }

	/* -------------------------------------------- */

	_addPlayerRow_advanced () {
		const prevRowLevel = this._state.playersAdvanced.last()?.entity?.level;

		this._state.playersAdvanced = [
			...this._state.playersAdvanced,
			this.constructor.getDefaultPlayerRow_advanced({
				level: prevRowLevel,
				colsExtraAdvanced: this._state.colsExtraAdvanced,
			}),
		];
	}

	_addPlayerRow_simple () {
		const prevRowLevel = this._state.playersSimple.last()?.entity?.level;

		this._state.playersSimple = [
			...this._state.playersSimple,
			this.constructor.getDefaultPlayerRow_simple({
				level: prevRowLevel,
			}),
		];
	}

	doAddPlayer () {
		if (this._state.isAdvanced) return this._addPlayerRow_advanced();
		return this._addPlayerRow_simple();
	}

	/* -------------------------------------------- */

	getPartyMeta () {
		return new EncounterPartyMeta(
			this._state.isAdvanced
				? this._getPartyPlayerMetas_advanced()
				: this._getPartyPlayerMetas_simple(),
		);
	}

	_getPartyPlayerMetas_advanced () {
		const countByLevel = {};
		this._state.playersAdvanced
			.forEach(it => {
				countByLevel[it.entity.level] = (countByLevel[it.entity.level] || 0) + 1;
			});

		return Object.entries(countByLevel)
			.map(([level, count]) => new EncounterPartyPlayerMeta({level: Number(level), count}));
	}

	_getPartyPlayerMetas_simple () {
		return this._state.playersSimple
			.map(it => new EncounterPartyPlayerMeta({count: it.entity.count, level: it.entity.level}));
	}

	/* -------------------------------------------- */

	doAddColExtraAdvanced () {
		this._state.colsExtraAdvanced = [
			...this._state.colsExtraAdvanced,
			this.constructor.getDefaultColExtraAdvanced(),
		];

		// region When adding a new advanced column, add a new cell to each player row
		this._state.playersAdvanced.forEach(it => it.entity.extras.push(this.constructor.getDefaultPlayerAdvancedExtra()));
		this._triggerCollectionUpdate("playersAdvanced");
		// endregion
	}

	doRemoveColExtraAdvanced (id) {
		// region When removing an advanced column, remove matching values from player rows
		const ix = this._state.colsExtraAdvanced.findIndex(it => it.id === id);
		if (!~ix) return;
		this._state.playersAdvanced.forEach(player => {
			player.entity.extras = player.entity.extras.filter((_, i) => i !== ix);
		});
		this._triggerCollectionUpdate("playersAdvanced");
		// endregion

		this._state.colsExtraAdvanced = this._state.colsExtraAdvanced.filter(it => it.id !== id);
	}

	/* -------------------------------------------- */

	static getDefaultPlayerRow_advanced ({name = "", level = 1, extras = null, colsExtraAdvanced = null} = {}) {
		extras = extras || [...new Array(colsExtraAdvanced?.length || 0)]
			.map(() => this.getDefaultPlayerAdvancedExtra());
		return {
			id: CryptUtil.uid(),
			entity: {
				name,
				level,
				extras,
			},
		};
	}

	static getDefaultPlayerRow_simple (
		{
			count = this._DEFAULT_PARTY_SIZE,
			level = 1,
		} = {},
	) {
		return {
			id: CryptUtil.uid(),
			entity: {
				count,
				level,
			},
		};
	}

	static getDefaultColExtraAdvanced (
		{
			name = "",
		} = {},
	) {
		return {
			id: CryptUtil.uid(),
			entity: {
				name,
			},
		};
	}

	static getDefaultPlayerAdvancedExtra (
		{
			value = "",
		} = {},
	) {
		return {
			id: CryptUtil.uid(),
			entity: {
				value,
			},
		};
	}

	/* -------------------------------------------- */

	setStateFromLoaded (loadedState) {
		this._mutValidateLoadedState(loadedState);

		const nxt = MiscUtil.copyFast(this._getDefaultState());
		Object.assign(nxt, loadedState);

		this._proxyAssignSimple("state", nxt, true);
	}

	setPartialStateFromLoaded (partialLoadedState) {
		this._mutValidateLoadedState(partialLoadedState);
		this._proxyAssignSimple("state", partialLoadedState);
	}

	_mutValidateLoadedState (loadedState) {
		const defaultState = this._getDefaultState();

		if (loadedState.playersSimple && !loadedState.playersSimple.length) loadedState.playersSimple = MiscUtil.copyFast(defaultState.playersSimple);

		if (loadedState.playersAdvanced && !loadedState.playersAdvanced.length) {
			const colsExtraAdvanced = loadedState.colsExtraAdvanced || this._state.colsExtraAdvanced;

			loadedState.playersAdvanced = MiscUtil.copyFast(defaultState.playersAdvanced);
			loadedState.playersAdvanced
				.forEach(({entity}) => {
					// Trim extras
					(entity.extras = entity.extras || []).slice(0, colsExtraAdvanced.length);
					// Pad extras
					colsExtraAdvanced.forEach((_, i) => entity.extras[i] = entity.extras[i] ?? this.constructor.getDefaultPlayerAdvancedExtra());
				});
		}
	}

	/* -------------------------------------------- */

	getDefaultStateKeys () {
		return Object.keys(this.constructor._getDefaultState());
	}

	static _getDefaultState () {
		return {
			creatureMetas: [],

			playersSimple: [
				this.getDefaultPlayerRow_simple(),
			],

			isAdvanced: false,
			colsExtraAdvanced: [],
			playersAdvanced: [
				this.getDefaultPlayerRow_advanced(),
			],
		};
	}

	_getDefaultState () {
		return {
			...this.constructor._getDefaultState(),
		};
	}
}
