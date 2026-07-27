import {DmScreenPanelAppIframeBase} from "./dmscreen-panelapp-base.js";

export class DmScreenPanelAppTwitchChat extends DmScreenPanelAppIframeBase {
	_getPanelElement (board, state) {
		const {u: url} = state;
		const channelId = url.split("/").map(it => it.trim()).filter(Boolean).slice(-2)[0];
		return this._registerIframe(
			veT`<iframe src="${url}?parent=${location.hostname}" frameborder="0" scrolling="no" id="${channelId}" ${ElementUtil.getIframeSandboxAttribute()}></iframe>`,
		);
	}
}
