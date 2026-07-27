import {DmScreenPanelAppIframeBase} from "./dmscreen-panelapp-base.js";

export class DmScreenPanelAppGenericEmbed extends DmScreenPanelAppIframeBase {
	_getPanelElement (board, state) {
		const {u: url} = state;
		return this._registerIframe(
			veT`<iframe src="${url}" ${ElementUtil.getIframeSandboxAttribute({url, isAllowPdf: true})}></iframe>`,
		);
	}
}
