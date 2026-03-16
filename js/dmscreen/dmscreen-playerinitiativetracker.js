import {PANEL_TYP_INITIATIVE_TRACKER} from "./dmscreen-consts.js";
import {
	InitiativeTrackerPlayerMessageHandlerV0,
	InitiativeTrackerPlayerMessageHandlerV1,
	InitiativeTrackerPlayerUiV0,
	InitiativeTrackerPlayerUiV1,
} from "../initiativetracker/initiativetracker-player.js";
import {DmScreenUtil} from "./dmscreen-util.js";
import {DmScreenPanelAppBase} from "./dmscreen-panelapp-base.js";

// region v1
export class InitiativeTrackerPlayerV1 extends DmScreenPanelAppBase {
	_getPanelElement (board, state) {
		const eleMeta = ee`<div class="initp__meta"></div>`.hideVe();
		const eleHead = ee`<div class="initp__header"></div>`.hideVe();
		const eleRows = ee`<div class="ve-flex-col"></div>`.hideVe();

		const wrpTracker = ee`<div class="initp__wrp_active">
			${eleMeta}
			${eleHead}
			${eleRows}
		</div>`;

		const view = new InitiativeTrackerPlayerMessageHandlerScreenV1();
		view.setElements(eleMeta, eleHead, eleRows);

		let ui;
		const btnConnectRemote = ee`<button class="ve-btn ve-btn-primary ve-mb-2 ve-min-w-200p" title="Connect to a tracker outside of this browser tab.">Connect to Remote Tracker</button>`
			.onn("click", async () => {
				btnConnectRemote.detach();
				btnConnectLocal.detach();

				const iptPlayerName = ee`<input class="ve-form-control ve-input-sm ve-code">`
					.onn("change", () => iptPlayerName.removeClass("form-control--error"))
					.disableSpellcheck();
				const iptServerToken = ee`<input class="ve-form-control ve-input-sm ve-code">`
					.onn("change", () => iptServerToken.removeClass("form-control--error"))
					.disableSpellcheck();
				const btnGenConnect = ee`<button class="ve-btn ve-btn-primary ve-btn-xs ve-mr-2">Connect</button>`;

				const btnCancel = ee`<button class="ve-btn ve-btn-default ve-btn-xs">Back</button>`
					.onn("click", () => {
						// restore original state
						wrpClient.remove();
						view.wrpInitial.appends(btnConnectRemote).appends(btnConnectLocal);
					});

				const wrpClient = ee`<div class="ve-flex-col ve-w-100">
					<div class="ve-flex-vh-center ve-px-4 ve-mb-2">
						<span style="min-width: fit-content;" class="ve-mr-2">Player Name</span>
						${iptPlayerName}
					</div>

					<div class="ve-flex-vh-center ve-px-4 ve-mb-2">
						<span style="min-width: fit-content;" class="ve-mr-2">Server Token</span>
						${iptServerToken}
					</div>

					<div class="ve-split ve-px-4 ve-flex-vh-center">
						${btnGenConnect}${btnCancel}
					</div>
				</div>`.appendTo(view.wrpInitial);

				btnGenConnect.onn("click", async () => {
					if (!iptPlayerName.val().trim()) return iptPlayerName.addClass("form-control--error");
					if (!iptServerToken.val().trim()) return iptServerToken.addClass("form-control--error");

					try {
						btnGenConnect.attr("disabled", true);

						ui = new InitiativeTrackerPlayerUiV1(view, iptPlayerName.val(), iptServerToken.val());
						await ui.pInit();
						InitiativeTrackerPlayerMessageHandlerScreenV1.initUnloadMessage();
					} catch (e) {
						btnGenConnect.attr("disabled", false);
						JqueryUtil.doToast({content: `Failed to connect. ${VeCt.STR_SEE_CONSOLE}`, type: "danger"});
						setTimeout(() => { throw e; });
					}
				});
			});

		const btnConnectLocal = ee`<button class="ve-btn ve-btn-primary ve-min-w-200p">Connect to Local Tracker</button>`
			.onn("click", async () => {
				const panelApps = DmScreenUtil.getPanelApps({board, type: PANEL_TYP_INITIATIVE_TRACKER});

				if (!panelApps.length) return JqueryUtil.doToast({content: "No local trackers detected!", type: "warning"});

				if (panelApps.length === 1) {
					try {
						const token = await panelApps[0].pDoConnectLocalV1();
						ui = new InitiativeTrackerPlayerUiV1(view, "Local", token);
						await ui.pInit();
						InitiativeTrackerPlayerMessageHandlerScreenV1.initUnloadMessage();
					} catch (e) {
						JqueryUtil.doToast({content: `Failed to connect. ${VeCt.STR_SEE_CONSOLE}`, type: "danger"});
						setTimeout(() => { throw e; });
					}
					return;
				}

				btnConnectRemote.detach();
				btnConnectLocal.detach();

				const selTracker = ee`<select class="ve-form-control ve-input-xs ve-mr-1">
					<option value="-1" disabled>Select a local tracker</option>
				</select>`.onn("change", () => selTracker.removeClass("form-control--error"));
				panelApps.forEach((panelApp, i) => selTracker.appends(`<option value="${i}">${panelApp.getSummary()}</option>`));
				selTracker.val("-1");

				const btnOk = ee`<button class="ve-btn ve-btn-primary ve-btn-xs">OK</button>`
					.onn("click", async () => {
						// jQuery reads the disabled value as null
						if (selTracker.val() == null) return selTracker.addClass("form-control--error");

						btnOk.prop("disabled", true);

						try {
							const token = await panelApps[Number(selTracker.val())].pDoConnectLocalV1();
							ui = new InitiativeTrackerPlayerUiV1(view, "Local", token);
							await ui.pInit();
							InitiativeTrackerPlayerMessageHandlerScreenV1.initUnloadMessage();
						} catch (e) {
							JqueryUtil.doToast({content: `Failed to connect. ${VeCt.STR_SEE_CONSOLE}`, type: "danger"});
							// restore original state
							btnCancel.remove();
							wrpSel.remove();
							view.wrpInitial.appends(btnConnectRemote).appends(btnConnectLocal);
							setTimeout(() => { throw e; });
						}
					});

				const wrpSel = ee`<div class="ve-flex-vh-center ve-mb-2">
						${selTracker}
						${btnOk}
					</div>`.appendTo(view.wrpInitial);

				const btnCancel = ee`<button class="ve-btn ve-btn-default ve-btn-xs">Back</button>`
					.onn("click", () => {
						// restore original state
						btnCancel.remove();
						wrpSel.remove();
						view.wrpInitial.appends(btnConnectRemote).appends(btnConnectLocal);
					})
					.appendTo(view.wrpInitial);
			});

		view.wrpInitial = ee`<div class="ve-flex-vh-center ve-h-100 ve-flex-col dm__panel-bg">
			${btnConnectRemote}
			${btnConnectLocal}
		</div>`.appendTo(wrpTracker);

		return wrpTracker;
	}
}

class InitiativeTrackerPlayerMessageHandlerScreenV1 extends InitiativeTrackerPlayerMessageHandlerV1 {
	constructor () {
		super(true);

		this._wrpInitial = null;
	}

	initUi () {
		if (this._isUiInit) return;
		this._isUiInit = true;

		this._eleMeta.showVe();
		this._eleHead.showVe();
		this._eleRows.showVe();
		this._wrpInitial.hideVe();
	}

	set wrpInitial (wrpInitial) { this._wrpInitial = wrpInitial; }
	get wrpInitial () { return this._wrpInitial; }

	static initUnloadMessage () {
		window.addEventListener("beforeunload", evt => {
			const message = `The connection will be closed`;
			(evt || window.event).message = message;
			return message;
		});
	}
}
// endregion

// /// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// region v0
export class InitiativeTrackerPlayerV0 extends DmScreenPanelAppBase {
	_getPanelElement (board, state) {
		const eleMeta = ee`<div class="initp__meta"></div>`.hideVe();
		const eleHead = ee`<div class="initp__header"></div>`.hideVe();
		const eleRows = ee`<div class="ve-flex-col"></div>`.hideVe();

		const wrpTracker = ee`<div class="initp__wrp_active">
			${eleMeta}
			${eleHead}
			${eleRows}
		</div>`;

		const view = new InitiativeTrackerPlayerMessageHandlerScreenV0();
		view.setElements(eleMeta, eleHead, eleRows);

		const btnConnectRemote = ee`<button class="ve-btn ve-btn-primary ve-mb-2 ve-min-w-200p" title="Connect to a tracker outside of this browser tab.">Connect to Remote Tracker</button>`
			.onn("click", () => {
				btnConnectRemote.detach();
				btnConnectLocal.detach();

				const iptServerToken = ee`<input class="ve-form-control ve-input-sm ve-code">`.disableSpellcheck();
				const btnGenClientToken = ee`<button class="ve-btn ve-btn-primary ve-btn-xs">Generate Client Token</button>`;
				const iptClientToken = ee`<input class="ve-form-control ve-input-sm ve-code ve-copyable">`.disableSpellcheck();

				const btnCancel = ee`<button class="ve-btn ve-btn-default ve-btn-xs">Back</button>`
					.onn("click", () => {
						// restore original state
						wrpClient.remove();
						view.wrpInitial.appends(btnConnectRemote).appends(btnConnectLocal);
					});

				const wrpClient = ee`<div class="ve-flex-col ve-w-100">
					<div class="ve-flex-vh-center ve-px-4 ve-mb-2">
						<span style="min-width: fit-content;" class="ve-mr-2">Server Token</span>
						${iptServerToken}
					</div>

					<div class="ve-flex-v-center ve-flex-h-right ve-px-4 ve-mb-2">
						${btnGenClientToken}
					</div>

					<div class="ve-flex-vh-center ve-px-4 ve-mb-2">
						<span style="min-width: fit-content;" class="ve-mr-2">Client Token</span>
						${iptClientToken}
					</div>

					<div class="ve-flex-vh-center ve-px-4">
						${btnCancel}
					</div>
				</div>`.appendTo(view.wrpInitial);

				const ui = new InitiativeTrackerPlayerUiV0(view, iptServerToken, btnGenClientToken, iptClientToken);
				ui.init();
			});

		const btnConnectLocal = ee`<button class="ve-btn ve-btn-primary ve-min-w-200p" title="Connect to a tracker in this browser tab.">Connect to Local Tracker</button>`
			.onn("click", async () => {
				const panelApps = DmScreenUtil.getPanelApps({board, type: PANEL_TYP_INITIATIVE_TRACKER});

				if (!panelApps.length) {
					JqueryUtil.doToast({content: "No local trackers detected!", type: "warning"});
					return;
				}

				if (panelApps.length === 1) {
					await panelApps[0].pDoConnectLocalV0(view);
					return;
				}

				btnConnectRemote.detach();
				btnConnectLocal.detach();

				const selTracker = ee`<select class="ve-form-control ve-input-xs ve-mr-1">
					<option value="-1" disabled>Select a local tracker</option>
				</select>`
					.onn("change", () => selTracker.removeClass("error-background"));
				panelApps.forEach((panelApp, i) => selTracker.appends(`<option value="${i}">${panelApp.getSummary()}</option>`));
				selTracker.val("-1");

				const btnOk = ee`<button class="ve-btn ve-btn-primary ve-btn-xs">OK</button>`
					.onn("click", async () => {
						if (selTracker.val() === "-1") return selTracker.addClass("error-background");

						await panelApps[Number(selTracker.val())].pDoConnectLocalV0(view);

						// restore original state
						btnCancel.remove();
						wrpSel.remove();
						view.wrpInitial.appends(btnConnectRemote).appends(btnConnectLocal);
					});

				const wrpSel = ee`<div class="ve-flex-vh-center ve-mb-2">
					${selTracker}
					${btnOk}
				</div>`.appendTo(view.wrpInitial);

				const btnCancel = ee`<button class="ve-btn ve-btn-default ve-btn-xs">Back</button>`
					.onn("click", () => {
						// restore original state
						btnCancel.remove();
						wrpSel.remove();
						view.wrpInitial.appends(btnConnectRemote).appends(btnConnectLocal);
					})
					.appendTo(view.wrpInitial);
			});

		view.wrpInitial = ee`<div class="ve-flex-vh-center ve-h-100 ve-flex-col dm__panel-bg">
			${btnConnectRemote}
			${btnConnectLocal}
		</div>`.appendTo(wrpTracker);

		return wrpTracker;
	}
}

class InitiativeTrackerPlayerMessageHandlerScreenV0 extends InitiativeTrackerPlayerMessageHandlerV0 {
	constructor () {
		super(true);

		this._wrpInitial = null;
	}

	initUi () {
		if (this._isUiInit) return;
		this._isUiInit = true;

		this._eleMeta.showVe();
		this._eleHead.showVe();
		this._eleRows.showVe();
		this._wrpInitial.hideVe();

		window.addEventListener("beforeunload", evt => {
			if (!this._clientData.client.isActive) return;

			const message = `The connection will be closed`;
			(evt || window.event).message = message;
			return message;
		});
	}

	set wrpInitial (wrpInitial) { this._wrpInitial = wrpInitial; }
	get wrpInitial () { return this._wrpInitial; }
}
// endregion
