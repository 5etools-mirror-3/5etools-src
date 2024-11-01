"use strict";

class RenderRecipes {
	/**
	 * @param ent
	 * @param [opts]
	 * @param [opts.$selScaleFactor]
	 */
	static $getRenderedRecipe (ent, opts) {
		opts = opts || {};

		const ptFluff = this._getFluffHtml(ent);

		const entriesMeta = Renderer.recipe.getRecipeRenderableEntriesMeta(ent);

		const ptTime = Renderer.recipe.getTimeHtml(ent, {entriesMeta});
		const {ptMakes, ptServes} = Renderer.recipe.getMakesServesHtml(ent, {entriesMeta});

		const $wrpSelScaleFactor = $$`<div class="ve-flex-v-center ml-2 mb-2">(${opts.$selScaleFactor})</div>`;

		return $$`
		${Renderer.utils.getBorderTr()}
		${Renderer.utils.getExcludedTr({entity: ent, dataProp: "recipe"})}
		${Renderer.utils.getNameTr(ent, {page: UrlUtil.PG_RECIPES})}

		${ptFluff ? `<tr class="mobile__hidden recipes__wrp-fluff"><td colspan="6">${ptFluff}</td></tr>
		<tr class="mobile__hidden"><td colspan="6" class="py-0"><div class="ve-tbl-divider"></div></td></tr>` : ""}

		<tr><td colspan="6">
		<div class="ve-flex w-100 rd-recipes__wrp-recipe">
			<div class="w-33 pl-3 pr-2 ve-flex-col">
				${ptTime}

				${(ptMakes || ptServes) ? $$`<div class="ve-flex-v-center">${ptMakes || ptServes}${$wrpSelScaleFactor}</div>` : ""}
				${(ptMakes && ptServes) ? ptServes : ""}
				${!(ptMakes || ptServes) && opts.$selScaleFactor ? $$`<div class="mb-2">Scale: ${opts.$selScaleFactor}</div>` : ""}

				<div class="rd-recipes__wrp-ingredients ${ptMakes || ptServes || opts.$selScaleFactor ? "mt-1" : ""}">${Renderer.get().render(entriesMeta.entryIngredients, 0)}</div>

				${entriesMeta.entryEquipment ? `<div class="rd-recipes__wrp-ingredients mt-4"><div class="ve-flex-vh-center bold mb-1 small-caps">Equipment</div><div>${Renderer.get().render(entriesMeta.entryEquipment)}</div></div>` : ""}

				${entriesMeta.entryCooksNotes ? `<div class="w-100 ve-flex-col mt-4"><div class="ve-flex-vh-center bold mb-1 small-caps">Cook's Notes</div><div class="italic">${Renderer.get().render(entriesMeta.entryCooksNotes)}</div></div>` : ""}
			</div>

			<div class="w-66 pr-3 pl-5 rd-recipes__wrp-instructions">
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
