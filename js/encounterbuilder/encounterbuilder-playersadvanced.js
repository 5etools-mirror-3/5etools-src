export class EncounterBuilderRenderableCollectionPlayersAdvanced extends RenderableCollectionGenericRows {
	constructor (
		{
			comp,
			rdState,
		},
	) {
		super(comp, "playersAdvanced", rdState.wrpRowsAdvanced);
	}

	_getWrpRow () {
		return ee`<div class="ve-flex-v-center mb-2 ecgen-player__wrp-row"></div>`;
	}

	_populateRow ({comp, wrpRow, entity}) {
		const iptName = ComponentUiUtil.getIptStr(comp, "name")
			.addClass(`w-100p`)
			.addClass(`form-control--minimal`)
			.addClass(`no-shrink`)
			.addClass(`mr-1`);

		const iptLevel = ComponentUiUtil.getIptInt(
			comp,
			"level",
			1,
			{
				min: 1,
				max: 20,
				fallbackOnNaN: 1,
			},
		)
			.addClass("w-40p")
			.addClass("form-control--minimal")
			.addClass("no-shrink")
			.addClass("mr-1")
			.addClass("ve-text-center");

		const wrpIptsExtra = ee`<div class="ve-flex-v-center"></div>`;
		const collectionExtras = new EncounterBuilderRenderableCollectionPlayerAdvancedExtras({
			comp,
			wrpIptsExtra,
		});
		const hkExtras = () => collectionExtras.render();
		comp._addHookBase("extras", hkExtras);
		hkExtras();

		const btnRemove = this._utils.getBtnDelete({entity, title: "Remove Player"})
			.addClass("ecgen-player__btn-inline")
			.addClass("h-ipt-xs")
			.addClass("no-shrink")
			.addClass("ml-n1")
			.addClass("bl-0")
			.addClass("bbl-0")
			.addClass("btl-0")
			.attr("tabindex", "-1");

		ee(wrpRow)`
			${iptName}
			${iptLevel}
			${wrpIptsExtra}
			${btnRemove}
		`;

		return {
			wrpIptsExtra,
		};
	}
}

class EncounterBuilderRenderableCollectionPlayerAdvancedExtras extends RenderableCollectionBase {
	constructor (
		{
			comp,

			wrpIptsExtra,
		},
	) {
		super(comp, "extras");
		this._wrpIptsExtra = wrpIptsExtra;
	}

	getNewRender (extra, i) {
		const comp = BaseComponent.fromObject(extra.entity, "*");
		comp._addHookAll("state", () => {
			this._getCollectionItem(extra.id).entity = comp.toObject("*");
			this._comp._triggerCollectionUpdate("extras");
		});

		const iptVal = ComponentUiUtil.getIptStr(comp, "value")
			.addClass(`w-40p`)
			.addClass(`no-shrink`)
			.addClass(`form-control--minimal`)
			.addClass(`ve-text-center`)
			.addClass(`mr-1`)
		;

		const wrpRow = ee`<div class="ve-flex-v-h-center">
			${iptVal}
		</div>`
			.appendTo(this._wrpIptsExtra);

		return {
			comp,
			wrpRow,
		};
	}

	doUpdateExistingRender (renderedMeta, extra, i) {
		renderedMeta.comp._proxyAssignSimple("state", extra.entity, true);
		if (!renderedMeta.wrpRow.parente()?.is(this._wrpIptsExtra)) renderedMeta.wrpRow.appendTo(this._wrpIptsExtra);
	}
}
