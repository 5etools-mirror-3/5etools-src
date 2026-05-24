import {EncounterPartyPlayerMeta} from "../encounterbuilder-models.js";
import {EncounterBuilderPartyBase} from "./encounterbuilder-party-base.js";
import {EncounterBuilderRenderableCollectionPlayersSimple} from "../encounterbuilder-playerssimple.js";

export class EncounterBuilderPartyCustom extends EncounterBuilderPartyBase {
	static PARTY_ID = "custom";

	partyId = this.constructor.PARTY_ID;
	displayName = "Basic";

	/* -------------------------------------------- */

	getPartyPlayerMetas () {
		return this._state.playersSimple
			.map(it => new EncounterPartyPlayerMeta({count: it.entity.count, level: it.entity.level}));
	}

	/* -------------------------------------------- */

	_mutValidateLoadedState (loadedState) {
		const defaultState = this._getDefaultState();

		if (!loadedState.playersSimple?.length) loadedState.playersSimple = MiscUtil.copyFast(defaultState.playersSimple);

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
		const prevRowLevel = this._state.playersSimple.at(-1)?.entity?.level;

		this._state.playersSimple = [
			...this._state.playersSimple,
			this.constructor.getDefaultPlayerRow_simple({
				level: prevRowLevel,
			}),
		];
	}

	render ({stgGroup}) {
		const btnAddPlayers = ee`<button class="ve-btn ve-btn-primary ve-btn-xs"><span class="glyphicon glyphicon-plus"></span> Add Players</button>`
			.onn("click", () => this._doAddPlayer());

		const wrpRows = ee`<div class="ve-flex-col ve-w-100"></div>`;

		const stg = ee`<div class="ve-flex-col">
			<div class="ve-flex">
				<div class="ve-w-80p">Players:</div>
				<div class="ve-w-80p">Level:</div>
			</div>

			${wrpRows}

			<div class="ve-mb-1 ve-flex">
				<div class="ecgen__wrp_add_players_btn_wrp">
					${btnAddPlayers}
				</div>
			</div>
		</div>`
			.appendTo(stgGroup);

		const collectionPlayersSimple = new EncounterBuilderRenderableCollectionPlayersSimple({
			comp: this,
			rdState: {
				wrpRowsSimple: wrpRows,
			},
		});

		this._addHookBase("playersSimple", () => collectionPlayersSimple.render())();

		return {
			eles: [stg],
		};
	}

	/* -------------------------------------------- */

	mutDeExternalize ({out}) {
		if (out.playersSimple) {
			out.playersSimple = out.playersSimple
				.map(it => this.constructor.getDefaultPlayerRow_simple(it));
		}
	}

	/* -------------------------------------------- */

	static getDefaultPlayerRow_simple (
		{
			count = 4,
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

	_getDefaultState () {
		return {
			playersSimple: [
				this.constructor.getDefaultPlayerRow_simple(),
			],
		};
	}
}
