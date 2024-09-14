"use strict";

class RenderConditionDiseases {
	static $getRenderedConditionDisease (it) {
		const entryList = {type: "entries", entries: it.entries};
		const textStack = [];
		Renderer.get().setFirstSection(true).recursiveRender(entryList, textStack);

		return $$`
			${Renderer.utils.getBorderTr()}
			${Renderer.utils.getExcludedTr({entity: it, dataProp: it.__prop})}
			${Renderer.utils.getNameTr(it, {page: UrlUtil.PG_CONDITIONS_DISEASES})}
			<tr><td colspan="6" class="py-0"><div class="ve-tbl-divider"></div></td></tr>
			<tr><td colspan="6">${textStack.join("")}</td></tr>
			${Renderer.utils.getPageTr(it)}
			${Renderer.utils.getBorderTr()}
		`;
	}
}
