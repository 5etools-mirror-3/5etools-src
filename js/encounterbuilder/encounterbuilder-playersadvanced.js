export class EncounterBuilderRenderableCollectionPlayersAdvanced extends RenderableCollectionGenericRows {
	constructor (
		{
			comp,
			rdState,
		},
	) {
		super(comp, "playersAdvanced", rdState.$wrpRowsAdvanced);
	}

	_$getWrpRow () {
		return $(`<div class="ve-flex-v-center mb-2 ecgen-player__wrp-row"></div>`);
	}

	_populateRow ({comp, $wrpRow, entity}) {
		const $iptName = ComponentUiUtil.$getIptStr(comp, "name")
			.addClass(`w-100p form-control--minimal no-shrink mr-1`);

		const $iptLevel = ComponentUiUtil.$getIptInt(
			comp,
			"level",
			1,
			{
				min: 1,
				max: 20,
				fallbackOnNaN: 1,
			},
		).addClass("w-40p form-control--minimal no-shrink mr-1 ve-text-center");

		const $wrpIptsExtra = $(`<div class="ve-flex-v-center"></div>`);
		const collectionExtras = new EncounterBuilderRenderableCollectionPlayerAdvancedExtras({
			comp,
			$wrpIptsExtra,
		});
		const hkExtras = () => collectionExtras.render();
		comp._addHookBase("extras", hkExtras);
		hkExtras();

		const $btnRemove = this._utils.$getBtnDelete({entity, title: "Remove Player"})
			.addClass("ecgen-player__btn-inline h-ipt-xs no-shrink ml-n1 bl-0 bbl-0 btl-0")
			.attr("tabindex", "-1");

		$$($wrpRow)`
			${$iptName}
			${$iptLevel}
			${$wrpIptsExtra}
			${$btnRemove}
		`;

		return {
			$wrpIptsExtra,
		};
	}
}

class EncounterBuilderRenderableCollectionPlayerAdvancedExtras extends RenderableCollectionBase {
	constructor (
		{
			comp,

			$wrpIptsExtra,
		},
	) {
		super(comp, "extras");
		this._$wrpIptsExtra = $wrpIptsExtra;
	}

	getNewRender (extra, i) {
		const comp = BaseComponent.fromObject(extra.entity, "*");
		comp._addHookAll("state", () => {
			this._getCollectionItem(extra.id).entity = comp.toObject("*");
			this._comp._triggerCollectionUpdate("extras");
		});

		const $iptVal = ComponentUiUtil.$getIptStr(comp, "value")
			.addClass(`w-40p no-shrink form-control--minimal ve-text-center mr-1`);

		const $wrpRow = $$`<div class="ve-flex-v-h-center">
			${$iptVal}
		</div>`
			.appendTo(this._$wrpIptsExtra);

		return {
			comp,
			$wrpRow,
		};
	}

	doUpdateExistingRender (renderedMeta, extra, i) {
		renderedMeta.comp._proxyAssignSimple("state", extra.entity, true);
		if (!renderedMeta.$wrpRow.parent().is(this._$wrpIptsExtra)) renderedMeta.$wrpRow.appendTo(this._$wrpIptsExtra);
	}
}
