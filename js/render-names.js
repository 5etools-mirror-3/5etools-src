"use strict";

class RenderNames {
	static getRenderedNameTable (ent) {
		return veT`
		${Renderer.utils.getBorderTr()}
		${Renderer.names.getRenderedString(ent)}
		${Renderer.utils.getPageTr(ent)}
		${Renderer.utils.getBorderTr()}`;
	}
}
