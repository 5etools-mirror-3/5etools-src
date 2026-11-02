"use strict";

class RenderNames {
	static getRenderedNameTable (ent) {
		return veT`
		${Renderer.utils.getBorderTr()}
		${Renderer.namez.getRenderedString(ent)}
		${Renderer.utils.getPageTr(ent)}
		${Renderer.utils.getBorderTr()}`;
	}
}
