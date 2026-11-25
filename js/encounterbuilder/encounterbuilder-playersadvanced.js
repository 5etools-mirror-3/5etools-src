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
		return veT`<div class="ve-flex-v-center ve-mb-2 ecgen-player__wrp-row"></div>`;
	}

	_populateRow ({comp, wrpRow, entity}) {
		const iptName = ComponentUiUtil.getIptStr(comp, "name")
			.vee.addClass(`ve-w-100p`)
			.vee.addClass(`form-control--minimal`)
			.vee.addClass(`ve-no-shrink`)
			.vee.addClass(`ve-mr-1`);

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
			.vee.addClass("ve-w-40p")
			.vee.addClass("form-control--minimal")
			.vee.addClass("ve-no-shrink")
			.vee.addClass("ve-mr-1")
			.vee.addClass("ve-text-center");

		const wrpIptsExtra = veT`<div class="ve-flex-v-center"></div>`;
		const collectionExtras = new EncounterBuilderRenderableCollectionPlayerAdvancedExtras({
			comp,
			wrpIptsExtra,
		});
		const hkExtras = () => collectionExtras.render();
		comp._addHookBase("extras", hkExtras);
		hkExtras();

		const btnRemove = this._utils.getBtnDelete({entity, title: "Remove Player"})
			.vee.addClass("ecgen-player__btn-inline")
			.vee.addClass("ve-h-ipt-xs")
			.vee.addClass("ve-no-shrink")
			.vee.addClass("ve-ml-n1")
			.vee.addClass("ve-bl-0")
			.vee.addClass("ve-bbl-0")
			.vee.addClass("ve-btl-0")
			.vee.attr("tabindex", "-1");

		veT(wrpRow)`
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
			.vee.addClass(`ve-w-40p`)
			.vee.addClass(`ve-no-shrink`)
			.vee.addClass(`form-control--minimal`)
			.vee.addClass(`ve-text-center`)
			.vee.addClass(`ve-mr-1`)
		;

		const wrpRow = veT`<div class="ve-flex-v-h-center">
			${iptVal}
		</div>`
			.vee.appendTo(this._wrpIptsExtra);

		return {
			comp,
			wrpRow,
		};
	}

	doUpdateExistingRender (renderedMeta, extra, i) {
		renderedMeta.comp._proxyAssignSimple("state", extra.entity, true);
		if (!renderedMeta.wrpRow.vee.parent()?.vee.is(this._wrpIptsExtra)) renderedMeta.wrpRow.vee.appendTo(this._wrpIptsExtra);
	}
}
