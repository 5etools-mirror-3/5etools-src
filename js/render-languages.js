"use strict";

class RenderLanguages {
	static getRenderedLanguage (it) {
		return veT`${Renderer.utils.getBorderTr()}
		${Renderer.language.getRenderedString(it)}
		${Renderer.utils.getPageTr(it)}
		${Renderer.utils.getBorderTr()}`;
	}
}
