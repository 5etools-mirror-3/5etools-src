import {EncounterPartyPlayerMeta} from "../encounterbuilder-models.js";
import {EncounterBuilderPartyBase} from "./encounterbuilder-party-base.js";
import {EncounterBuilderRenderableCollectionPlayersAdvanced} from "../encounterbuilder-playersadvanced.js";
import {EncounterBuilderRenderableCollectionColsExtraAdvanced} from "../encounterbuilder-colsextraadvanced.js";

export class EncounterBuilderPartyCustomAdvanced extends EncounterBuilderPartyBase {
	static PARTY_ID = "customAdvanced";

	partyId = this.constructor.PARTY_ID;
	displayName = "Advanced";

	/* -------------------------------------------- */

	getPartyPlayerMetas () {
		const countByLevel = {};
		this._state.playersAdvanced
			.forEach(it => {
				countByLevel[it.entity.level] = (countByLevel[it.entity.level] || 0) + 1;
			});

		return Object.entries(countByLevel)
			.map(([level, count]) => new EncounterPartyPlayerMeta({level: Number(level), count}));
	}

	/* -------------------------------------------- */

	_mutValidateLoadedState (loadedState) {
		const defaultState = this._getDefaultState();

		if (!loadedState.playersAdvanced?.length) {
			loadedState.playersAdvanced = MiscUtil.copyFast(defaultState.playersAdvanced);
		}

		loadedState.colsExtraAdvanced ||= this._state.colsExtraAdvanced || MiscUtil.copyFast(defaultState.colsExtraAdvanced);

		loadedState.playersAdvanced
			.forEach(({entity}) => {
				entity.extras = (entity.extras || [])
					.slice(0, loadedState.colsExtraAdvanced.length);
				loadedState.colsExtraAdvanced
					.forEach((_, i) => entity.extras[i] = entity.extras[i] ?? this.constructor.getDefaultPlayerAdvancedExtra());
			});

		// (Future-proof)
		Object.entries(defaultState)
			.filter(([, v]) => v == null)
			.forEach(([k, v]) => loadedState[k] = v);
	}

	setStateFrom (toLoad, isOverwrite = false) {
		if (toLoad?.state) this._mutValidateLoadedState(toLoad.state);
		return super.setStateFrom(toLoad, isOverwrite);
	}

	/* -------------------------------------------- */

	_doAddPlayer () {
		const prevRowLevel = this._state.playersAdvanced.at(-1)?.entity?.level;

		this._state.playersAdvanced = [
			...this._state.playersAdvanced,
			this.constructor.getDefaultPlayerRow_advanced({
				level: prevRowLevel,
				colsExtraAdvanced: this._state.colsExtraAdvanced,
			}),
		];
	}

	_doAddColExtraAdvanced () {
		this._state.colsExtraAdvanced = [
			...this._state.colsExtraAdvanced,
			this.constructor.getDefaultColExtraAdvanced(),
		];

		this._state.playersAdvanced.forEach(it => it.entity.extras.push(this.constructor.getDefaultPlayerAdvancedExtra()));
		this._triggerCollectionUpdate("playersAdvanced");
	}

	doRemoveColExtraAdvanced (id) {
		const ix = this._state.colsExtraAdvanced.findIndex(it => it.id === id);
		if (!~ix) return;
		this._state.playersAdvanced.forEach(player => {
			player.entity.extras = player.entity.extras.filter((_, i) => i !== ix);
		});
		this._triggerCollectionUpdate("playersAdvanced");

		this._state.colsExtraAdvanced = this._state.colsExtraAdvanced.filter(it => it.id !== id);
	}

	render ({stgGroup}) {
		const btnAddPlayers = ee`<button class="ve-btn ve-btn-primary ve-btn-xs"><span class="glyphicon glyphicon-plus"></span> Add Player</button>`
			.onn("click", () => this._doAddPlayer());

		const btnAddAdvancedCol = ee`<button class="ve-btn ve-btn-primary ve-btn-xxs ecgen-player__btn-inline ve-h-ipt-xs ve-bl-0 ve-bb-0 ve-bbl-0 ve-bbr-0 ve-btl-0 ve-ml-n1" title="Add Column" tabindex="-1"><span class="glyphicon glyphicon-list-alt"></span></button>`
			.onn("click", () => this._doAddColExtraAdvanced());

		const wrpHeaders = ee`<div class="ve-flex"></div>`;
		const wrpFooters = ee`<div class="ve-flex"></div>`;

		const wrpRows = ee`<div class="ve-flex-col"></div>`;

		const stg = ee`<div class="ve-overflow-x-auto ve-flex-col">
			<div class="ve-flex-h-center ve-mb-2 ve-bb-1p ve-small-caps ve-self-flex-start">
				<div class="ve-w-100p ve-mr-1 ve-h-ipt-xs ve-no-shrink">Name</div>
				<div class="ve-w-40p ve-text-center ve-mr-1 ve-h-ipt-xs ve-no-shrink">Level</div>
				${wrpHeaders}
				${btnAddAdvancedCol}
			</div>

			${wrpRows}

			<div class="ve-mb-1 ve-flex">
				<div class="ecgen__wrp_add_players_btn_wrp ve-no-shrink ve-no-grow">
					${btnAddPlayers}
				</div>
				${wrpFooters}
			</div>

			<div class="row">
				<div class="ve-w-100">
					${this._rendererWrapped.er(`{@note Additional columns will be imported into the DM Screen.}`)}
				</div>
			</div>
		</div>`
			.appendTo(stgGroup);

		const rdState = {
			wrpRowsAdvanced: wrpRows,
			wrpHeadersAdvanced: wrpHeaders,
			wrpFootersAdvanced: wrpFooters,
		};

		const collectionPlayersAdvanced = new EncounterBuilderRenderableCollectionPlayersAdvanced({
			comp: this,
			rdState,
		});

		const collectionColsExtraAdvanced = new EncounterBuilderRenderableCollectionColsExtraAdvanced({
			comp: this,
			rdState,
		});

		this._addHookBase("playersAdvanced", () => collectionPlayersAdvanced.render())();
		this._addHookBase("colsExtraAdvanced", () => collectionColsExtraAdvanced.render())();

		return {
			eles: [stg],
		};
	}

	/* -------------------------------------------- */

	mutDeExternalize ({out}) {
		if (out.colsExtraAdvanced) {
			out.colsExtraAdvanced = out.colsExtraAdvanced
				.map(it => this.constructor.getDefaultColExtraAdvanced(it));
		}

		if (out.playersAdvanced) {
			out.playersAdvanced = out.playersAdvanced
				.map(it => this.constructor.getDefaultPlayerRow_advanced({
					...it,
					extras: (it.extras || []).map(x => this.constructor.getDefaultPlayerAdvancedExtra(x)),
					colsExtraAdvanced: out.colsExtraAdvanced,
				}));
		}
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

	_getDefaultState () {
		return {
			colsExtraAdvanced: [],
			playersAdvanced: [
				this.constructor.getDefaultPlayerRow_advanced(),
			],
		};
	}
}
