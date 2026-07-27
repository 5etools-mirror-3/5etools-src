export class EncounterBuilderRenderableCollectionPlayersSimple extends RenderableCollectionGenericRows {
	constructor (
		{
			comp,
			rdState,
		},
	) {
		super(comp, "playersSimple", rdState.wrpRowsSimple);
	}

	_getWrpRow () {
		return veT`<div class="ve-flex-v-center ve-mb-2 ecgen-player__wrp-row"></div>`;
	}

	_populateRow ({comp, wrpRow, entity}) {
		const selCount = ComponentUiUtil.getSelEnum(
			comp,
			"count",
			{
				values: [...new Array(12)].map((_, i) => i + 1),
			},
		)
			.vee.addClass("form-control--minimal")
			.vee.addClass("ve-no-shrink");

		const selLevel = ComponentUiUtil.getSelEnum(
			comp,
			"level",
			{
				values: [...new Array(20)].map((_, i) => i + 1),
			},
		)
			.vee.addClass("form-control--minimal")
			.vee.addClass("ve-no-shrink")
			.vee.addClass("ve-bl-0");

		const btnRemove = this._utils.getBtnDelete({entity, title: "Remove Player Group"})
			.vee.addClass("ecgen-player__btn-inline")
			.vee.addClass("ve-h-ipt-xs")
			.vee.addClass("ve-no-shrink")
			.vee.addClass("ve-bl-0")
			.vee.addClass("ve-bbl-0")
			.vee.addClass("ve-btl-0")
			.vee.attr("tabindex", "-1");

		veT(wrpRow)`
			<div class="ve-w-80p">${selCount}</div>
			<div class="ve-w-80p">${selLevel}</div>
			<div class="ve-flex-v-center">${btnRemove}</div>
		`;
	}
}
