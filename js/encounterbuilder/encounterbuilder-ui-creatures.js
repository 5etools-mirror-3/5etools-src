export class RenderableCollectionViewerCreatures extends RenderableCollectionGenericRows {
	constructor (
		{
			comp,
			wrpRows,
			rendererWrapped,
		},
	) {
		super(comp, "creatureGroups", wrpRows);
		if (!rendererWrapped) throw new Error(`Missing required "rendererWrapped" option!`);
		this._rendererWrapped = rendererWrapped;
	}

	/* -------------------------------------------- */

	_getWrpRow () {
		return super._getWrpRow()
			.vee.addClass("ve-py-1p")
			.vee.addClass("ve-px-1")
			.vee.addClass("ve-container-inline");
	}

	_populateRow ({comp, wrpRow, entity}) {
		const {wrp: wrpIptCount} = ComponentUiUtil.getIptNumber(comp, "count", 1, {min: 0, decorationRight: "ticker", asMeta: true});
		wrpIptCount
			.vee.addClass("ve-w-50p")
			.vee.addClass("ve-mr-2")
			.vee.addClass("ve-no-shrink");
		comp._addHookBase("count", () => {
			if (comp._state.count > 0) return;
			if (comp._state.isLocked) return comp._state.count = 1;
			this._utils.doDelete({entity});
		});

		const {
			wrpHovs,
			dispCreature,
			stgCr,
			btnShuffle,
			fnCleanup: fnCleanupRowElements,
		} = entity.getRenderedRowElements({
			comp,
			entity,
			encounterBuilderComp: this._comp,
			rendererWrapped: this._rendererWrapped,
		});

		const btnLock = ComponentUiUtil.getBtnBool(
			comp,
			"isLocked",
			{
				html: `<button title="Lock Monster against Randomizing/Adjusting" class="ve-btn ve-btn-default ve-btn-xs"><span class="glyphicon glyphicon-lock"></span></button>`,
			},
		);

		const btnDelete = veT`<button class="ve-btn ve-btn-danger ve-btn-xs" title="Delete"><span class="glyphicon glyphicon-trash"></span></button>`
			.vee.onn("click", () => {
				if (comp._state.isLocked) return;
				this._utils.doDelete({entity});
			});

		comp._addHookBase("isLocked", () => {
			btnShuffle.vee.toggleClass("ve-disabled", comp._state.isLocked);
			btnDelete.vee.toggleClass("ve-disabled", comp._state.isLocked);
		})();

		veT(wrpRow)`
			${wrpIptCount}
			<div class="ve-flex-v-center ve-grow ecgen-viewer__wrp-creature-info">
				<div class="ve-flex-v-center ve-mx-1 ecgen-viewer__wrp-row-hovers">
					${wrpHovs}
				</div>
				${dispCreature}
			</div>
			${stgCr}
			<div class="ve-btn-group ve-no-wrap ve-no-shrink ve-flex-v-center">
				${btnShuffle}
				${btnLock}
				${btnDelete}
			</div>
		`;

		return {
			fnCleanup: () => {
				if (fnCleanupRowElements) fnCleanupRowElements();
			},
		};
	}

	/* -------------------------------------------- */

	doDeleteExistingRender (renderedMeta) {
		renderedMeta.fnCleanup();
	}
}
