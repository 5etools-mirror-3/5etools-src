"use strict";

class RenderRecipes {
	/**
	 * @param ent
	 * @param [opts]
	 * @param [opts.selScaleFactor]
	 */
	static getRenderedRecipe (ent, opts) {
		opts = opts || {};

		const ptFluff = this._getFluffHtml(ent);

		const entriesMeta = Renderer.recipe.getRecipeRenderableEntriesMeta(ent);

		const ptTime = Renderer.recipe.getTimeHtml(ent, {entriesMeta});
		const {ptMakes, ptServes} = Renderer.recipe.getMakesServesHtml(ent, {entriesMeta});

		const wrpSelScaleFactor = ee`<div class="ve-flex-v-center ve-ml-2 ve-mb-2">(${opts.selScaleFactor})</div>`;

		return ee`
		${Renderer.utils.getBorderTr()}
		${Renderer.utils.getExcludedTr({entity: ent, dataProp: "recipe"})}
		${Renderer.utils.getNameTr(ent, {page: UrlUtil.PG_RECIPES})}

		${ptFluff ? `<tr class="ve-mobile-sm__hidden recipes__wrp-fluff"><td colspan="6">${ptFluff}</td></tr>
		<tr class="ve-mobile-sm__hidden"><td colspan="6" class="ve-py-0"><div class="ve-tbl-divider"></div></td></tr>` : ""}

		<tr><td colspan="6">
		<div class="ve-flex ve-w-100 ve-rd-recipes__wrp-recipe">
			<div class="ve-w-33 ve-pl-3 ve-pr-2 ve-flex-col">
				${ptTime}

				${(ptMakes || ptServes) ? ee`<div class="ve-flex-v-center">${ptMakes || ptServes}${wrpSelScaleFactor}</div>` : ""}
				${(ptMakes && ptServes) ? ptServes : ""}
				${!(ptMakes || ptServes) && opts.selScaleFactor ? ee`<div class="ve-mb-2">Scale: ${opts.selScaleFactor}</div>` : ""}

				<div class="ve-rd-recipes__wrp-ingredients ${ptMakes || ptServes || opts.selScaleFactor ? "ve-mt-1" : ""}">${Renderer.get().render(entriesMeta.entryIngredients, 0)}</div>

				${entriesMeta.entryEquipment ? `<div class="ve-rd-recipes__wrp-ingredients ve-mt-4"><div class="ve-flex-vh-center ve-bold ve-mb-1 ve-small-caps">Equipment</div><div>${Renderer.get().render(entriesMeta.entryEquipment)}</div></div>` : ""}

				${entriesMeta.entryCooksNotes ? `<div class="ve-w-100 ve-flex-col ve-mt-4"><div class="ve-flex-vh-center ve-bold ve-mb-1 ve-small-caps">Cook's Notes</div><div class="ve-italic">${Renderer.get().render(entriesMeta.entryCooksNotes)}</div></div>` : ""}
			</div>

			<div class="ve-w-66 ve-pr-3 ve-pl-5 ve-rd-recipes__wrp-instructions">
				${Renderer.get().setFirstSection(true).render(entriesMeta.entryInstructions, 2)}
			</div>
		</div>
		</td></tr>

		${Renderer.utils.getPageTr(ent)}
		${Renderer.utils.getBorderTr()}
		`;
	}

	static _getFluffHtml (it) {
		if (!it.fluff?.images?.length) return null;

		const fluffReduced = {
			...it.fluff,
			images: [it.fluff.images[0]],
		};

		return Renderer.get().withMinimizeLayoutShift(() => Renderer.utils.getFluffTabContent({entity: it, isImageTab: true, fluff: fluffReduced}));
	}
}
