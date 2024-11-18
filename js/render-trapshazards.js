"use strict";

class RenderTrapsHazards {
	static $getRenderedTrapHazard (it) {
		const styleHint = VetoolsConfig.get("styleSwitcher", "style");

		const renderStack = [];

		Renderer.get().recursiveRender({entries: it.entries}, renderStack, {depth: 1});
		const ptEntries = renderStack.join("");

		const trapPart = Renderer.trap.getRenderedTrapPart(Renderer.get(), it, {styleHint});
		const subtitle = Renderer.traphazard.getSubtitle(it);

		const isPrefixTrapPart = Renderer.trap.TRAP_TYPES_CLASSIC.includes(it.trapHazType);

		const ptsBody = (
			isPrefixTrapPart
				? [trapPart, ptEntries]
				: [ptEntries, trapPart]
		)
			.filter(Boolean)
			.join("");

		return $$`
		${Renderer.utils.getBorderTr()}
		${Renderer.utils.getExcludedTr({entity: it, dataProp: it.__prop})}
		${Renderer.utils.getNameTr(it, {page: UrlUtil.PG_TRAPS_HAZARDS})}
		${subtitle ? `<tr><td colspan="6" class="pb-2"><i>${Renderer.traphazard.getSubtitle(it, {styleHint})}</i></td>` : ""}
		<tr><td colspan="6">${ptsBody}</td></tr>
		${Renderer.utils.getPageTr(it)}
		${Renderer.utils.getBorderTr()}`;
	}
}
