import {PANEL_TYP_INITIATIVE_TRACKER} from "../dmscreen-consts.js";
import {
	InitiativeTrackerPlayerMessageHandlerV0,
	InitiativeTrackerPlayerMessageHandlerV1,
	InitiativeTrackerPlayerUiV0,
	InitiativeTrackerPlayerUiV1,
} from "../../initiativetracker/initiativetracker-player.js";
import {DmScreenUtil} from "../dmscreen-util.js";
import {DmScreenPanelAppBase} from "./dmscreen-panelapp-base.js";

// region v1
export class InitiativeTrackerPlayerV1 extends DmScreenPanelAppBase {
	_getPanelElement (board, state) {
		const eleMeta = veT`<div class="initp__meta"></div>`.vee.hide();
		const eleHead = veT`<div class="initp__header"></div>`.vee.hide();
		const eleRows = veT`<div class="ve-flex-col"></div>`.vee.hide();

		const wrpTracker = veT`<div class="initp__wrp_active">
			${eleMeta}
			${eleHead}
			${eleRows}
		</div>`;

		const view = new InitiativeTrackerPlayerMessageHandlerScreenV1();
		view.setElements(eleMeta, eleHead, eleRows);

		let ui;
		const btnConnectRemote = veT`<button class="ve-btn ve-btn-primary ve-mb-2 ve-min-w-200p" title="Connect to a tracker outside of this browser tab.">Connect to Remote Tracker</button>`
			.vee.onn("click", async () => {
				btnConnectRemote.vee.detach();
				btnConnectLocal.vee.detach();

				const iptPlayerName = veT`<input class="ve-form-control ve-input-sm ve-code">`
					.vee.onn("change", () => iptPlayerName.vee.removeClass("form-control--error"))
					.vee.disableSpellcheck();
				const iptServerToken = veT`<input class="ve-form-control ve-input-sm ve-code">`
					.vee.onn("change", () => iptServerToken.vee.removeClass("form-control--error"))
					.vee.disableSpellcheck();
				const btnGenConnect = veT`<button class="ve-btn ve-btn-primary ve-btn-xs ve-mr-2">Connect</button>`;

				const btnCancel = veT`<button class="ve-btn ve-btn-default ve-btn-xs">Back</button>`
					.vee.onn("click", () => {
						// restore original state
						wrpClient.remove();
						view.wrpInitial.vee.appends(btnConnectRemote).vee.appends(btnConnectLocal);
					});

				const wrpClient = veT`<div class="ve-flex-col ve-w-100">
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
				</div>`.vee.appendTo(view.wrpInitial);

				btnGenConnect.vee.onn("click", async () => {
					if (!iptPlayerName.vee.val().trim()) return iptPlayerName.vee.addClass("form-control--error");
					if (!iptServerToken.vee.val().trim()) return iptServerToken.vee.addClass("form-control--error");

					try {
						btnGenConnect.vee.attr("disabled", true);

						ui = new InitiativeTrackerPlayerUiV1(view, iptPlayerName.vee.val(), iptServerToken.vee.val());
						await ui.pInit();
						InitiativeTrackerPlayerMessageHandlerScreenV1.initUnloadMessage();
					} catch (e) {
						btnGenConnect.vee.attr("disabled", false);
						JqueryUtil.doToast({content: `Failed to connect. ${VeCt.STR_SEE_CONSOLE}`, type: "danger"});
						setTimeout(() => { throw e; });
					}
				});
			});

		const btnConnectLocal = veT`<button class="ve-btn ve-btn-primary ve-min-w-200p">Connect to Local Tracker</button>`
			.vee.onn("click", async () => {
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

				btnConnectRemote.vee.detach();
				btnConnectLocal.vee.detach();

				const selTracker = veT`<select class="ve-form-control ve-input-xs ve-mr-1">
					<option value="-1" disabled>Select a local tracker</option>
				</select>`.vee.onn("change", () => selTracker.vee.removeClass("form-control--error"));
				panelApps.forEach((panelApp, i) => selTracker.vee.appends(`<option value="${i}">${panelApp.getSummary()}</option>`));
				selTracker.vee.val("-1");

				const btnOk = veT`<button class="ve-btn ve-btn-primary ve-btn-xs">OK</button>`
					.vee.onn("click", async () => {
						if (selTracker.vee.val() == null) return selTracker.vee.addClass("form-control--error");

						btnOk.vee.prop("disabled", true);

						try {
							const token = await panelApps[Number(selTracker.vee.val())].pDoConnectLocalV1();
							ui = new InitiativeTrackerPlayerUiV1(view, "Local", token);
							await ui.pInit();
							InitiativeTrackerPlayerMessageHandlerScreenV1.initUnloadMessage();
						} catch (e) {
							JqueryUtil.doToast({content: `Failed to connect. ${VeCt.STR_SEE_CONSOLE}`, type: "danger"});
							// restore original state
							btnCancel.remove();
							wrpSel.remove();
							view.wrpInitial.vee.appends(btnConnectRemote).vee.appends(btnConnectLocal);
							setTimeout(() => { throw e; });
						}
					});

				const wrpSel = veT`<div class="ve-flex-vh-center ve-mb-2">
						${selTracker}
						${btnOk}
					</div>`.vee.appendTo(view.wrpInitial);

				const btnCancel = veT`<button class="ve-btn ve-btn-default ve-btn-xs">Back</button>`
					.vee.onn("click", () => {
						// restore original state
						btnCancel.remove();
						wrpSel.remove();
						view.wrpInitial.vee.appends(btnConnectRemote).vee.appends(btnConnectLocal);
					})
					.vee.appendTo(view.wrpInitial);
			});

		view.wrpInitial = veT`<div class="ve-flex-vh-center ve-h-100 ve-flex-col dm__panel-bg">
			${btnConnectRemote}
			${btnConnectLocal}
		</div>`.vee.appendTo(wrpTracker);

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

		this._eleMeta.vee.show();
		this._eleHead.vee.show();
		this._eleRows.vee.show();
		this._wrpInitial.vee.hide();
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
		const eleMeta = veT`<div class="initp__meta"></div>`.vee.hide();
		const eleHead = veT`<div class="initp__header"></div>`.vee.hide();
		const eleRows = veT`<div class="ve-flex-col"></div>`.vee.hide();

		const wrpTracker = veT`<div class="initp__wrp_active">
			${eleMeta}
			${eleHead}
			${eleRows}
		</div>`;

		const view = new InitiativeTrackerPlayerMessageHandlerScreenV0();
		view.setElements(eleMeta, eleHead, eleRows);

		const btnConnectRemote = veT`<button class="ve-btn ve-btn-primary ve-mb-2 ve-min-w-200p" title="Connect to a tracker outside of this browser tab.">Connect to Remote Tracker</button>`
			.vee.onn("click", () => {
				btnConnectRemote.vee.detach();
				btnConnectLocal.vee.detach();

				const iptServerToken = veT`<input class="ve-form-control ve-input-sm ve-code">`.vee.disableSpellcheck();
				const btnGenClientToken = veT`<button class="ve-btn ve-btn-primary ve-btn-xs">Generate Client Token</button>`;
				const iptClientToken = veT`<input class="ve-form-control ve-input-sm ve-code ve-copyable">`.vee.disableSpellcheck();

				const btnCancel = veT`<button class="ve-btn ve-btn-default ve-btn-xs">Back</button>`
					.vee.onn("click", () => {
						// restore original state
						wrpClient.remove();
						view.wrpInitial.vee.appends(btnConnectRemote).vee.appends(btnConnectLocal);
					});

				const wrpClient = veT`<div class="ve-flex-col ve-w-100">
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
				</div>`.vee.appendTo(view.wrpInitial);

				const ui = new InitiativeTrackerPlayerUiV0(view, iptServerToken, btnGenClientToken, iptClientToken);
				ui.init();
			});

		const btnConnectLocal = veT`<button class="ve-btn ve-btn-primary ve-min-w-200p" title="Connect to a tracker in this browser tab.">Connect to Local Tracker</button>`
			.vee.onn("click", async () => {
				const panelApps = DmScreenUtil.getPanelApps({board, type: PANEL_TYP_INITIATIVE_TRACKER});

				if (!panelApps.length) {
					JqueryUtil.doToast({content: "No local trackers detected!", type: "warning"});
					return;
				}

				if (panelApps.length === 1) {
					await panelApps[0].pDoConnectLocalV0(view);
					return;
				}

				btnConnectRemote.vee.detach();
				btnConnectLocal.vee.detach();

				const selTracker = veT`<select class="ve-form-control ve-input-xs ve-mr-1">
					<option value="-1" disabled>Select a local tracker</option>
				</select>`
					.vee.onn("change", () => selTracker.vee.removeClass("error-background"));
				panelApps.forEach((panelApp, i) => selTracker.vee.appends(`<option value="${i}">${panelApp.getSummary()}</option>`));
				selTracker.vee.val("-1");

				const btnOk = veT`<button class="ve-btn ve-btn-primary ve-btn-xs">OK</button>`
					.vee.onn("click", async () => {
						if (selTracker.vee.val() === "-1") return selTracker.vee.addClass("error-background");

						await panelApps[Number(selTracker.vee.val())].pDoConnectLocalV0(view);

						// restore original state
						btnCancel.remove();
						wrpSel.remove();
						view.wrpInitial.vee.appends(btnConnectRemote).vee.appends(btnConnectLocal);
					});

				const wrpSel = veT`<div class="ve-flex-vh-center ve-mb-2">
					${selTracker}
					${btnOk}
				</div>`.vee.appendTo(view.wrpInitial);

				const btnCancel = veT`<button class="ve-btn ve-btn-default ve-btn-xs">Back</button>`
					.vee.onn("click", () => {
						// restore original state
						btnCancel.remove();
						wrpSel.remove();
						view.wrpInitial.vee.appends(btnConnectRemote).vee.appends(btnConnectLocal);
					})
					.vee.appendTo(view.wrpInitial);
			});

		view.wrpInitial = veT`<div class="ve-flex-vh-center ve-h-100 ve-flex-col dm__panel-bg">
			${btnConnectRemote}
			${btnConnectLocal}
		</div>`.vee.appendTo(wrpTracker);

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

		this._eleMeta.vee.show();
		this._eleHead.vee.show();
		this._eleRows.vee.show();
		this._wrpInitial.vee.hide();

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
