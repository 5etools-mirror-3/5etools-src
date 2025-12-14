"use strict";

class RenderObjects {
	static getRenderedObject (obj) {
		return ee`${Renderer.utils.getBorderTr()}
		${Renderer.object.getRenderedString(obj, {isCompact: false})}
		${Renderer.utils.getPageTr(obj)}
		${Renderer.utils.getBorderTr()}`;
	}
}
