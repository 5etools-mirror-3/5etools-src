import {DmScreenPanelAppIframeBase} from "./dmscreen-panelapp-base.js";

export class DmScreenPanelAppTwitch extends DmScreenPanelAppIframeBase {
	_getPanelElement (board, state) {
		const {u: url} = state;
		return this._registerIframe(
			veT`<iframe src="${url}&parent=${location.hostname}" frameborder="0" allowfullscreen scrolling="no" ${ElementUtil.getIframeSandboxAttribute()}></iframe>`,
		);
	}
}
