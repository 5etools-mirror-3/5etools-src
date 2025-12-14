"use strict";

class RenderCultsBoons {
	static getRenderedCultBoon (it) {
		return it.__prop === "cult"
			? RenderCultsBoons._getRenderedCult(it)
			: RenderCultsBoons._getRenderedBoon(it);
	}

	static _getRenderedCult (it) {
		const renderer = Renderer.get().setFirstSection(true);

		const renderStack = [];
		Renderer.cultboon.doRenderCultParts(it, renderer, renderStack);
		renderer.recursiveRender({entries: it.entries}, renderStack, {depth: 1});

		return ee`
			${Renderer.utils.getBorderTr()}
			${Renderer.utils.getExcludedTr({entity: it, dataProp: "cult"})}
			${Renderer.utils.getNameTr(it, {page: UrlUtil.PG_CULTS_BOONS})}
			<tr><td colspan="6" class="py-0"><div class="ve-tbl-divider"></div></td></tr>
			<tr><td colspan="6">${renderStack.join("")}</td></tr>
			${Renderer.utils.getPageTr(it)}
			${Renderer.utils.getBorderTr()}
		`;
	}

	static _getRenderedBoon (it) {
		const renderer = Renderer.get().setFirstSection(true);

		const renderStack = [];
		it._displayName = it._displayName || it.name;
		Renderer.cultboon.doRenderBoonParts(it, renderer, renderStack);
		renderer.recursiveRender({entries: it.entries}, renderStack, {depth: 1});
		return ee`
			${Renderer.utils.getBorderTr()}
			${Renderer.utils.getExcludedTr({entity: it, dataProp: "boon"})}
			${Renderer.utils.getNameTr(it, {page: UrlUtil.PG_CULTS_BOONS})}
			<tr><td colspan="6">${renderStack.join("")}</td></tr>
			${Renderer.utils.getPageTr(it)}
			${Renderer.utils.getBorderTr()}
		`;
	}
}
