import {
	InitiativeTrackerRowDataViewDefaultParty,
} from "./dmscreen-initiativetracker-rowsdefaultparty.js";

export class InitiativeTrackerDefaultParty extends BaseComponent {
	static _RenderState = class {
		constructor () {
			this.cbDoClose = null;
			this.fnsCleanup = [];
		}
	};

	constructor ({comp, roller, rowStateBuilder}) {
		super();
		this._comp = comp;
		this._roller = roller;
		this._rowStateBuilder = rowStateBuilder;
		this._prop = "rowsDefaultParty";

		this._viewRowsDefaultParty = null;
	}

	/* -------------------------------------------- */

	pGetShowModalResults () {
		const rdState = new this.constructor._RenderState();

		const {eleModalInner, eleModalFooter, pGetResolved, doClose} = UiUtil.getShowModal({
			title: "Edit Default Party",
			isHeaderBorder: true,
			isUncappedHeight: true,
			hasFooter: true,
			cbClose: () => rdState.fnsCleanup.forEach(fn => fn()),
			eleTitleSplit: this._render_getBtnAdd({rdState}),
		});
		rdState.cbDoClose = doClose;

		this._render_renderBody({rdState, eleModalInner});
		this._render_renderFooter({rdState, eleModalFooter});

		return pGetResolved();
	}

	_render_getBtnAdd ({rdState}) {
		return ee`<button class="ve-btn ve-btn-default ve-btn-xs" title="Add Player"><span class="glyphicon glyphicon-plus"></span></button>`
			.onn("click", async () => {
				this._comp._state[this._prop] = [
					...this._comp._state[this._prop],
					await this._rowStateBuilder.pGetNewRowState(),
				];
			});
	}

	/* -------------------------------------------- */

	_render_renderBody ({rdState, eleModalInner}) {
		this._viewRowsDefaultParty = new InitiativeTrackerRowDataViewDefaultParty({
			comp: this._comp,
			prop: this._prop,
			roller: this._roller,
			rowStateBuilder: this._rowStateBuilder,
		});
		this._viewRowsDefaultPartyMeta = this._viewRowsDefaultParty.getRenderedView();
		this._viewRowsDefaultPartyMeta.ele.appendTo(eleModalInner);
		rdState.fnsCleanup.push(this._viewRowsDefaultPartyMeta.cbDoCleanup);
	}

	/* -------------------------------------------- */

	_render_renderFooter ({rdState, eleModalFooter}) {
		const btnSave = ee`<button class="ve-btn ve-btn-primary ve-btn-sm ve-w-100">Save</button>`
			.onn("click", () => rdState.cbDoClose(true));

		ee(eleModalFooter)`<div class="ve-w-100 ve-py-3 ve-no-shrink">
			${btnSave}
		</div>`;
	}

	/* -------------------------------------------- */

	/**
	 * @param {?Array<object>} rowsPrev
	 */
	async pGetConvertedDefaultPartyActiveRows ({rowsPrev = null} = {}) {
		const rowsPrevLookup = Object.fromEntries((rowsPrev || []).map(row => [row.id, row]));

		const rows = this._comp._state.rowsDefaultParty
			.map(row => {
				const rowOut = rowsPrevLookup[row.id]
					? MiscUtil.copyFast(rowsPrevLookup[row.id])
					: MiscUtil.copyFast(row);
				delete rowOut.entity?.initiative;
				return rowOut;
			});

		if (!this._comp._state.isRollInit) return rows;

		await rows.pSerialAwaitMap(async row => {
			const {entity} = row;
			const {initiativeModifier} = await this._rowStateBuilder.pGetRowInitiativeMeta({row});

			// Skip rolling no-modifier-exists initiative for player rows, as we assume the user wants to input them
			//   manually.
			if (initiativeModifier == null) return;

			entity.initiative = await this._roller.pGetRollInitiative({initiativeModifier, name: entity.name});
		});

		return rows;
	}
}
