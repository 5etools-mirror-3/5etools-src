export class EncounterBuilderRenderableCollectionColsExtraAdvanced extends RenderableCollectionBase {
	constructor (
		{
			comp,
			rdState,
		},
	) {
		super(comp, "colsExtraAdvanced");
		this._rdState = rdState;
	}

	getNewRender (colExtra, i) {
		const comp = BaseComponent.fromObject(colExtra.entity, "*");
		comp._addHookAll("state", () => {
			this._getCollectionItem(colExtra.id).entity = comp.toObject("*");
			this._comp._triggerCollectionUpdate("colsExtraAdvanced");
		});

		const iptName = ComponentUiUtil.getIptStr(comp, "name")
			.addClass("ve-w-40p")
			.addClass("form-control--minimal")
			.addClass("ve-no-shrink")
			.addClass("ve-text-center")
			.addClass("ve-mr-1")
			.addClass("ve-bb-0");

		const wrpHeader = ee`<div class="ve-flex">
			${iptName}
		</div>`
			.appendTo(this._rdState.wrpHeadersAdvanced);

		const btnDelete = ee`<button class="ve-btn ve-btn-xxs ecgen-player__btn-inline ve-w-40p ve-btn-danger ve-no-shrink ve-mt-n2 ve-bt-0 ve-btl-0 ve-btr-0" title="Remove Column" tabindex="-1"><span class="glyphicon-trash glyphicon"></span></button>`
			.onn("click", () => this._comp.doRemoveColExtraAdvanced(colExtra.id));

		const wrpFooter = ee`<div class="ve-w-40p ve-flex-v-baseline ve-flex-h-center ve-no-shrink ve-no-grow ve-mr-1">
			${btnDelete}
		</div>`
			.appendTo(this._rdState.wrpFootersAdvanced);

		return {
			comp,
			wrpHeader,
			wrpFooter,
			fnRemoveEles: () => {
				wrpHeader.remove();
				wrpFooter.remove();
			},
		};
	}

	doUpdateExistingRender (renderedMeta, colExtra, i) {
		renderedMeta.comp._proxyAssignSimple("state", colExtra.entity, true);
		if (!renderedMeta.wrpHeader.parente()?.is(this._rdState.wrpHeadersAdvanced)) renderedMeta.wrpHeader.appendTo(this._rdState.wrpHeadersAdvanced);
		if (!renderedMeta.wrpFooter.parente()?.is(this._rdState.wrpFootersAdvanced)) renderedMeta.wrpFooter.appendTo(this._rdState.wrpFootersAdvanced);
	}
}
