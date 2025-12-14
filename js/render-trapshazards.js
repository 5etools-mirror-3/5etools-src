"use strict";

class RenderTrapsHazards {
	static getRenderedTrapHazard (ent) {
		const styleHint = VetoolsConfig.get("styleSwitcher", "style");

		const subtitle = Renderer.traphazard.getSubtitle(ent);
		const ptBody = ent.__prop === "trap"
			? Renderer.trap.getRenderedTrapBody(Renderer.get(), ent, {styleHint})
			: Renderer.hazard.getRenderedHazardBody(Renderer.get(), ent, {styleHint});
		return ee`
		${Renderer.utils.getBorderTr()}
		${Renderer.utils.getExcludedTr({entity: ent, dataProp: ent.__prop})}
		${Renderer.utils.getNameTr(ent, {page: UrlUtil.PG_TRAPS_HAZARDS})}
		${subtitle ? `<tr><td colspan="6" class="pb-2"><i>${Renderer.traphazard.getSubtitle(ent, {styleHint})}</i></td>` : ""}
		<tr><td colspan="6">${ptBody}</td></tr>
		${Renderer.utils.getPageTr(ent)}
		${Renderer.utils.getBorderTr()}`;
	}
}
