import {DmScreenPanelAppIframeBase} from "./dmscreen-panelapp-base.js";

export class DmScreenPanelAppYouTube extends DmScreenPanelAppIframeBase {
	_getPanelElement (board, state) {
		const {u: url} = state;
		return this._registerIframe(
			veT`<iframe src="${url}?autoplay=1&enablejsapi=1&modestbranding=1&iv_load_policy=3" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen ${ElementUtil.getIframeSandboxAttribute()}></iframe>`,
		);
	}
}
