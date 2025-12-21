import {LootGenGeneratorBase} from "./lootgen-generator-base.js";
import {LootGenOutputGemsArtObjects} from "./lootgen-output.js";
import {LootGenUtils} from "./lootgen-utils.js";
import {LootGenRender} from "./lootgen-render.js";

export class LootGenGeneratorGemsArtObjects extends LootGenGeneratorBase {
	identifier = "gemsArtObjects";

	render ({tabMeta}) {
		const cbIsUseGems = ComponentUiUtil.getCbBool(this, "gao_isUseGems");
		const cbIsUseArtObjects = ComponentUiUtil.getCbBool(this, "gao_isUseArtObjects");

		const iptTargetGoldAmount = ComponentUiUtil.getIptInt(this, "gao_targetGoldAmount", 0, {min: 0})
			.onn("keydown", evt => {
				if (evt.key !== "Enter") return;
				iptTargetGoldAmount.change();
				btnRoll.click();
			});

		const btnRoll = ee`<button class="ve-btn ve-btn-default ve-btn-xs mr-2">Roll Loot</button>`
			.onn("click", () => this._goa_pDoHandleClickRollLoot());

		const btnClear = ee`<button class="ve-btn ve-btn-danger ve-btn-xs">Clear Output</button>`
			.onn("click", () => this._outputManager.doClearOutput());

		ee`<div class="ve-flex-col py-2 px-3">
			<h4 class="mt-1 mb-3">Gem/Art Object Generator</h4>

			<label class="split-v-center mb-3">
				<div class="mr-2 w-66 no-shrink">Include Gems</div>
				${cbIsUseGems}
			</label>

			<label class="split-v-center mb-3">
				<div class="mr-2 w-66 no-shrink">Include Art Objects</div>
				${cbIsUseArtObjects}
			</label>

			<label class="split-v-center mb-3">
				<div class="mr-2 w-66 no-shrink">Target Gold Amount</div>
				${iptTargetGoldAmount}
			</label>

			<div class="ve-flex-v-center mb-2">
				${btnRoll}
				${btnClear}
			</div>

			<hr class="hr-3">

			<div class="ve-small italic">${LootGenRender.er(`This custom generator randomly selects gems/art objects up to the target gold amount.`)}</div>
		</div>`.appendTo(tabMeta.wrpTab);
	}

	async _goa_pDoHandleClickRollLoot () {
		if (this._state.gao_targetGoldAmount <= 0) return JqueryUtil.doToast({content: "Please enter a target gold amount!", type: "warning"});

		if (!this._state.gao_isUseGems && !this._state.gao_isUseArtObjects) return JqueryUtil.doToast({content: `Please select at least one of "Include Gems" and/or "Include Art Objects"`, type: "warning"});

		const typeMap = {};
		[{prop: "gems", stateProp: "gao_isUseGems"}, {prop: "artObjects", stateProp: "gao_isUseArtObjects"}]
			.forEach(({prop, stateProp}) => {
				if (!this._state[stateProp]) return;
				this._dataManager.getDataGemsArtObjectsFilteredByProp(prop)
					.forEach(({type, table}) => {
						(typeMap[type] ||= []).push({prop, table});
					});
			});

		const types = Object.keys(typeMap).map(it => Number(it)).sort(SortUtil.ascSort).reverse();
		if (this._state.gao_targetGoldAmount < types.last()) return JqueryUtil.doToast({content: `Could not generate any gems/art objects for a gold amount of ${this._state.gao_targetGoldAmount}! Please increase the target gold amount.`, type: "warning"});

		// Map of <prop> -> <type> -> {<count>, <breakdown>}
		const generated = {};

		let budget = this._state.gao_targetGoldAmount;
		while (budget >= types.last()) {
			const validTypes = types.filter(it => it <= budget);
			const type = RollerUtil.rollOnArray(validTypes);
			const typeMetas = typeMap[type];
			const {prop, table} = RollerUtil.rollOnArray(typeMetas);
			const rolled = RollerUtil.rollOnArray(table);

			const genMeta = MiscUtil.getOrSet(generated, prop, type, {});
			genMeta.count = (genMeta.count || 0) + 1;
			genMeta.breakdown = genMeta.breakdown || {};
			genMeta.breakdown[rolled] = (genMeta.breakdown[rolled] || 0) + 1;

			budget -= type;
		}

		const [gems, artObjects] = ["gems", "artObjects"]
			.map(prop => {
				return generated[prop]
					? Object.entries(generated[prop])
						.sort(([typeA], [typeB]) => SortUtil.ascSort(Number(typeB), Number(typeA)))
						.map(([type, {count, breakdown}]) => {
							type = Number(type);

							return new LootGenOutputGemsArtObjects({
								type,
								count,
								breakdown,
							});
						})
					: null;
			});

		const lootOutput = new this._ClsLootGenOutput({
			type: `Gems/Art Objects`,
			name: `Gems/Art Objects: Roughly ${this._state.gao_targetGoldAmount.toLocaleStringVe()} ${LootGenUtils.getCoinageLabel("gp")}`,
			gems,
			artObjects,
		});
		this._outputManager.doAddOutput({lootOutput});
	}

	_getDefaultState () {
		return {
			gao_isUseGems: true,
			gao_isUseArtObjects: true,
			gao_targetGoldAmount: 100,
		};
	}
}
