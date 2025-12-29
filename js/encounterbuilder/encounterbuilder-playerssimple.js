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
		return ee`<div class="ve-flex-v-center mb-2 ecgen-player__wrp-row"></div>`;
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
			.addClass("no-shrink");

		const selLevel = ComponentUiUtil.getSelEnum(
			comp,
			"level",
			{
				values: [...new Array(20)].map((_, i) => i + 1),
			},
		)
			.addClass("form-control--minimal")
			.addClass("no-shrink")
			.addClass("bl-0");

		const btnRemove = this._utils.getBtnDelete({entity, title: "Remove Player Group"})
			.addClass("ecgen-player__btn-inline")
			.addClass("h-ipt-xs")
			.addClass("no-shrink")
			.addClass("bl-0")
			.addClass("bbl-0")
			.addClass("btl-0")
			.attr("tabindex", "-1");

		ee(wrpRow)`
			<div class="w-80p">${selCount}</div>
			<div class="w-80p">${selLevel}</div>
			<div class="ve-flex-v-center">${btnRemove}</div>
		`;
	}
}
