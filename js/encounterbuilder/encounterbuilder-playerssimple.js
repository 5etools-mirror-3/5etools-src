export class EncounterBuilderRenderableCollectionPlayersSimple extends RenderableCollectionGenericRows {
	constructor (
		{
			comp,
			rdState,
		},
	) {
		super(comp, "playersSimple", rdState.$wrpRowsSimple);
	}

	_$getWrpRow () {
		return $(`<div class="ve-flex-v-center mb-2 ecgen-player__wrp-row"></div>`);
	}

	_populateRow ({comp, $wrpRow, entity}) {
		const $selCount = ComponentUiUtil.$getSelEnum(
			comp,
			"count",
			{
				values: [...new Array(12)].map((_, i) => i + 1),
			},
		).addClass("form-control--minimal no-shrink");

		const $selLevel = ComponentUiUtil.$getSelEnum(
			comp,
			"level",
			{
				values: [...new Array(20)].map((_, i) => i + 1),
			},
		).addClass("form-control--minimal no-shrink bl-0");

		const $btnRemove = this._utils.$getBtnDelete({entity, title: "Remove Player Group"})
			.addClass("ecgen-player__btn-inline h-ipt-xs no-shrink bl-0 bbl-0 btl-0")
			.attr("tabindex", "-1");

		$$($wrpRow)`
			<div class="w-20">${$selCount}</div>
			<div class="w-20">${$selLevel}</div>
			<div class="ve-flex-v-center">${$btnRemove}</div>
		`;
	}
}
