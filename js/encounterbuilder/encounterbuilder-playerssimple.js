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
		return ee`<div class="ve-flex-v-center ve-mb-2 ecgen-player__wrp-row"></div>`;
	}

	_populateRow ({comp, wrpRow, entity}) {
		const selCount = ComponentUiUtil.getSelEnum(
			comp,
			"count",
			{
				values: [...new Array(12)].map((_, i) => i + 1),
			},
		)
			.addClass("form-control--minimal")
			.addClass("ve-no-shrink");

		const selLevel = ComponentUiUtil.getSelEnum(
			comp,
			"level",
			{
				values: [...new Array(20)].map((_, i) => i + 1),
			},
		)
			.addClass("form-control--minimal")
			.addClass("ve-no-shrink")
			.addClass("ve-bl-0");

		const btnRemove = this._utils.getBtnDelete({entity, title: "Remove Player Group"})
			.addClass("ecgen-player__btn-inline")
			.addClass("ve-h-ipt-xs")
			.addClass("ve-no-shrink")
			.addClass("ve-bl-0")
			.addClass("ve-bbl-0")
			.addClass("ve-btl-0")
			.attr("tabindex", "-1");

		ee(wrpRow)`
			<div class="ve-w-80p">${selCount}</div>
			<div class="ve-w-80p">${selLevel}</div>
			<div class="ve-flex-v-center">${btnRemove}</div>
		`;
	}
}
