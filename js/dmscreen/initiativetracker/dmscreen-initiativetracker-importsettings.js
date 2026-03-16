export class InitiativeTrackerSettingsImport extends BaseComponent {
	static _PROPS_TRACKED = [
		"isRollInit",
		"isRollHp",
		"importIsRollGroups",
		"importIsAddPlayers",
		"importIsAppend",
	];

	constructor ({state}) {
		super();

		this._proxyAssignSimple(
			"state",
			InitiativeTrackerSettingsImport._PROPS_TRACKED
				.mergeMap(prop => ({[prop]: state[prop]})),
		);
	}

	/* -------------------------------------------- */

	getStateUpdate () {
		return MiscUtil.copyFast(this._state);
	}

	/* -------------------------------------------- */

	pGetShowModalResults () {
		const {eleModalInner, eleModalFooter, pGetResolved, doClose} = UiUtil.getShowModal({
			title: "Import Settings",
			isUncappedHeight: true,
			hasFooter: true,
		});

		UiUtil.addModalSep(eleModalInner);
		this._pGetShowModalResults_renderSection_isRolls({eleModalInner});
		UiUtil.addModalSep(eleModalInner);
		this._pGetShowModalResults_renderSection_import({eleModalInner});

		this._pGetShowModalResults_renderFooter({eleModalFooter, doClose});

		return pGetResolved();
	}

	/* -------------------------------------------- */

	_pGetShowModalResults_renderSection_isRolls ({eleModalInner}) {
		UiUtil.getAddModalRowCb2({wrp: eleModalInner, comp: this, prop: "isRollInit", text: "Roll creature initiative"});
		UiUtil.getAddModalRowCb2({wrp: eleModalInner, comp: this, prop: "isRollHp", text: "Roll creature hit points"});
	}

	_pGetShowModalResults_renderSection_import ({eleModalInner}) {
		UiUtil.getAddModalRowCb2({wrp: eleModalInner, comp: this, prop: "importIsRollGroups", text: "Roll groups of creatures together"});
		UiUtil.getAddModalRowCb2({wrp: eleModalInner, comp: this, prop: "importIsAddPlayers", text: "Add players"});
		UiUtil.getAddModalRowCb2({wrp: eleModalInner, comp: this, prop: "importIsAppend", text: "Add to existing tracker state"});
	}

	/* -------------------------------------------- */

	_pGetShowModalResults_renderFooter ({eleModalFooter, doClose}) {
		const btnSave = ee`<button class="ve-btn ve-btn-primary ve-btn-sm ve-w-100">Save</button>`
			.onn("click", () => doClose(true));

		ee(eleModalFooter)`<div class="ve-w-100 ve-py-3 ve-no-shrink">
			${btnSave}
		</div>`;
	}
}
