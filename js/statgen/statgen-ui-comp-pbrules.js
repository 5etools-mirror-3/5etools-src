export class StatGenUiRenderableCollectionPbRules extends RenderableCollectionGenericRows {
	constructor (statGenUi, wrp) {
		super(statGenUi, "pb_rules", wrp);
	}

	_getWrpRow () {
		return ee`<div class="ve-flex py-1 stripe-even statgen-pb__row-cost"></div>`;
	}

	_populateRow ({comp, wrpRow, entity}) {
		const parentComp = this._comp;

		const dispCost = ee`<div class="ve-flex-vh-center"></div>`;
		const hkCost = () => dispCost.txt(comp._state.cost);
		comp._addHookBase("cost", hkCost);
		hkCost();

		const iptCost = ComponentUiUtil.getIptInt(comp, "cost", 0, {html: `<input class="form-control input-xs form-control--minimal ve-text-center">`, fallbackOnNaN: 0});

		const hkIsCustom = () => {
			dispCost.toggleVe(!parentComp.state.pb_isCustom);
			iptCost.toggleVe(parentComp.state.pb_isCustom);
		};
		parentComp._addHookBase("pb_isCustom", hkIsCustom);
		hkIsCustom();

		const btnDelete = ee`<button class="ve-btn ve-btn-xxs ve-btn-danger" title="Delete"><span class="glyphicon glyphicon-trash"></span></button>`
			.onn("click", () => {
				if (parentComp.state.pb_rules.length === 1) return; // Never delete the final item
				parentComp.state.pb_rules = parentComp.state.pb_rules.filter(it => it !== entity);
			});

		ee(wrpRow)`
			<div class="statgen-pb__col-cost ve-flex-vh-center">${comp._state.score}</div>
			<div class="statgen-pb__col-cost ve-flex-vh-center">${Parser.getAbilityModifier(comp._state.score)}</div>
			<div class="statgen-pb__col-cost ve-flex-vh-center px-3">
				${dispCost}
				${iptCost}
			</div>
			<div class="statgen-pb__col-cost-delete">${btnDelete}</div>
		`;

		const hkRules = () => {
			btnDelete.toggleVe((parentComp.state.pb_rules[0] === entity || parentComp.state.pb_rules.last() === entity) && parentComp.state.pb_isCustom);
		};
		parentComp._addHookBase("pb_rules", hkRules);
		parentComp._addHookBase("pb_isCustom", hkRules);
		hkRules();

		return {
			fnCleanup: () => {
				parentComp._removeHookBase("pb_isCustom", hkIsCustom);
				parentComp._removeHookBase("pb_isCustom", hkRules);
				parentComp._removeHookBase("pb_rules", hkRules);
			},
		};
	}

	doDeleteExistingRender (renderedMeta) {
		renderedMeta.fnCleanup();
	}
}
