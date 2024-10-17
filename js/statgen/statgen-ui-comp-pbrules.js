export class StatGenUiRenderableCollectionPbRules extends RenderableCollectionGenericRows {
	constructor (statGenUi, $wrp) {
		super(statGenUi, "pb_rules", $wrp);
	}

	getNewRender (rule, i) {
		const parentComp = this._comp;

		const comp = this._utils.getNewRenderComp(rule, i);

		const $dispCost = $(`<div class="ve-flex-vh-center"></div>`);
		const hkCost = () => $dispCost.text(comp._state.cost);
		comp._addHookBase("cost", hkCost);
		hkCost();

		const $iptCost = ComponentUiUtil.$getIptInt(comp, "cost", 0, {html: `<input class="form-control input-xs form-control--minimal ve-text-center">`, fallbackOnNaN: 0});

		const hkIsCustom = () => {
			$dispCost.toggleVe(!parentComp.state.pb_isCustom);
			$iptCost.toggleVe(parentComp.state.pb_isCustom);
		};
		parentComp._addHookBase("pb_isCustom", hkIsCustom);
		hkIsCustom();

		const $btnDelete = $(`<button class="ve-btn ve-btn-xxs ve-btn-danger" title="Delete"><span class="glyphicon glyphicon-trash"></span></button>`)
			.click(() => {
				if (parentComp.state.pb_rules.length === 1) return; // Never delete the final item
				parentComp.state.pb_rules = parentComp.state.pb_rules.filter(it => it !== rule);
			});

		const $wrpRow = $$`<div class="ve-flex py-1 stripe-even statgen-pb__row-cost">
			<div class="statgen-pb__col-cost ve-flex-vh-center">${comp._state.score}</div>
			<div class="statgen-pb__col-cost ve-flex-vh-center">${Parser.getAbilityModifier(comp._state.score)}</div>
			<div class="statgen-pb__col-cost ve-flex-vh-center px-3">
				${$dispCost}
				${$iptCost}
			</div>
			<div class="statgen-pb__col-cost-delete">${$btnDelete}</div>
		</div>`.appendTo(this._$wrpRows);

		const hkRules = () => {
			$btnDelete.toggleVe((parentComp.state.pb_rules[0] === rule || parentComp.state.pb_rules.last() === rule) && parentComp.state.pb_isCustom);
		};
		parentComp._addHookBase("pb_rules", hkRules);
		parentComp._addHookBase("pb_isCustom", hkRules);
		hkRules();

		return {
			comp,
			$wrpRow,
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
