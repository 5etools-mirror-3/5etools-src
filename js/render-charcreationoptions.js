"use strict";

class RenderCharCreationOptions {
	static getRenderedCharCreationOption (ent) {
		const renderStack = [];

		const prerequisite = Renderer.utils.prerequisite.getHtml(ent.prerequisite);

		const preText = Renderer.charoption.getOptionTypePreText(ent);
		if (preText) renderStack.push(preText);

		const entryList = {type: "entries", entries: ent.entries};
		Renderer.get().setFirstSection(true).recursiveRender(entryList, renderStack);

		return ee`
		${Renderer.utils.getBorderTr()}
		${Renderer.utils.getExcludedTr({entity: ent, dataProp: "charoption"})}
		${Renderer.utils.getNameTr(ent, {page: UrlUtil.PG_CHAR_CREATION_OPTIONS})}
		${prerequisite ? `<tr><td colspan="6"><span class="prerequisite">${prerequisite}</span></td></tr>` : ""}
		<tr><td colspan="6" class="py-0"><div class="ve-tbl-divider"></div></td></tr>
		<tr><td colspan="6">${renderStack.join("")}</td></tr>
		${Renderer.utils.getPageTr(ent)}
		${Renderer.utils.getBorderTr()}
		`;
	}
}
