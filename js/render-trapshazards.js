"use strict";

class RenderTrapsHazards {
	static $getRenderedTrapHazard (it) {
		const renderStack = [];

		Renderer.get().recursiveRender({entries: it.entries}, renderStack, {depth: 1});

		const trapPart = Renderer.trap.getRenderedTrapPart(Renderer.get(), it);
		const subtitle = Renderer.traphazard.getSubtitle(it);

		return $$`
		${Renderer.utils.getBorderTr()}
		${Renderer.utils.getExcludedTr({entity: it, dataProp: it.__prop})}
		${Renderer.utils.getNameTr(it, {page: UrlUtil.PG_TRAPS_HAZARDS})}
		${subtitle ? `<tr><td colspan="6" class="pb-2"><i>${Renderer.traphazard.getSubtitle(it)}</i></td>` : ""}
		<tr><td colspan="6">${renderStack.join("")}${trapPart}</td></tr>
		${Renderer.utils.getPageTr(it)}
		${Renderer.utils.getBorderTr()}`;
	}
}
