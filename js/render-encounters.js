"use strict";

class RenderEncounters {
	static getRenderedEncounterTable (ent) {
		return veT`
		${Renderer.utils.getBorderTr()}
		${Renderer.encounters.getRenderedString(ent)}
		${Renderer.utils.getPageTr(ent)}
		${Renderer.utils.getBorderTr()}`;
	}
}
