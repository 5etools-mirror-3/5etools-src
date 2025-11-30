import {InitiativeTrackerUtil, RenderableCollectionConditions} from "./initiativetracker-utils.js";

export class InitiativeTrackerPlayerUiV1 {
	constructor (view, playerName, serverToken) {
		this._view = view;
		this._playerName = playerName;
		this._serverToken = serverToken;
		this._clientPeer = new PeerVeClient();
	}

	async pInit () {
		try {
			await this._clientPeer.pConnectToServer(
				this._serverToken,
				data => this._view.handleMessage(data),
				{
					label: this._playerName,
					serialization: "json",
				},
			);
		} catch (e) {
			JqueryUtil.doToast({
				content: `Failed to create client! Are you sure the token was valid? (See the log for more details.)`,
				type: "danger",
			});
			throw e;
		}
	}
}

export class InitiativeTrackerPlayerUiV0 {
	constructor (view, iptServerToken, btnGenClientToken, iptClientToken) {
		this._view = view;
		this._iptServerToken = iptServerToken;
		this._btnGenClientToken = btnGenClientToken;
		this._iptClientToken = iptClientToken;
	}

	init () {
		this._iptServerToken.onn("keydown", evt => {
			this._iptServerToken.removeClass("error-background");
			if (evt.key === "Enter") this._btnGenClientToken.trigger("click");
		});

		this._btnGenClientToken.onn("click", async () => {
			this._iptServerToken.removeClass("error-background");
			const serverToken = this._iptServerToken.val();

			if (PeerUtilV0.isValidToken(serverToken)) {
				try {
					this._iptServerToken.attr("disabled", true);
					this._btnGenClientToken.attr("disabled", true);
					const clientData = await PeerUtilV0.pInitialiseClient(
						serverToken,
						msg => this._view.handleMessage(msg),
						function (err) {
							if (!this.isClosed) {
								JqueryUtil.doToast({
									content: `Server error:\n${err ? err.message || err : "(Unknown error)"}`,
									type: "danger",
								});
							}
						},
					);

					if (!clientData) {
						this._iptServerToken.attr("disabled", false);
						this._btnGenClientToken.attr("disabled", false);
						JqueryUtil.doToast({
							content: `Failed to create client. Are you sure the token was valid?`,
							type: "warning",
						});
					} else {
						this._view.clientData = clientData;

						// -- This has no effect; the client doesn't error on sending when there's no connection --
						// const livenessCheck = setInterval(async () => {
						// 	try {
						// 		await clientData.client.sendMessage({})
						// 	} catch (e) {
						// 		JqueryUtil.doToast({
						// 			content: `Could not reach server! You might need to reconnect.`,
						// 			type: "danger"
						// 		});
						// 		clearInterval(livenessCheck);
						// 	}
						// }, 5000);

						this._iptClientToken.val(clientData.textifiedSdp).attr("disabled", false);
					}
				} catch (e) {
					JqueryUtil.doToast({
						content: `Failed to create client! Are you sure the token was valid? (See the log for more details.)`,
						type: "danger",
					});
					setTimeout(() => { throw e; });
				}
			} else this._iptServerToken.addClass("error-background");
		});

		this._iptClientToken.onn("click", async () => {
			await MiscUtil.pCopyTextToClipboard(this._iptClientToken.val());
			JqueryUtil.showCopiedEffect(this._iptClientToken);
		});
	}
}

export class InitiativeTrackerPlayerMessageHandlerV1 {
	constructor (isCompact) {
		this._isCompact = isCompact;
		this._isUiInit = false;

		this._eleMeta = null;
		this._eleHead = null;
		this._eleRows = null;
	}

	get isActive () { return this._isUiInit; }

	setElements (eleMeta, eleHead, eleRows) {
		this._eleMeta = eleMeta;
		this._eleHead = eleHead;
		this._eleRows = eleRows;
	}

	initUi () {} // to be overridden as required

	handleMessage (msg) {
		const {data: {type, payload}} = msg;

		switch (type) {
			case "state": return this._handleMessage_state({payload: payload});
			case "showImage": return this._handleMessage_showImage({payload: payload});

			default: throw new Error(`Unhandled message type "${type}"!`);
		}
	}

	/* -------------------------------------------- */

	_handleMessage_state ({payload}) {
		this.initUi();

		const data = payload || {};

		this._eleMeta.empty();
		this._eleHead.empty();
		this._eleRows.empty();

		if (data.round) {
			this._eleMeta.appends(`
				<div class="${this._isCompact ? "ve-flex-vh-center" : "ve-flex-v-center"}${this._isCompact ? " mb-3" : ""}">
					<div class="mr-2">Round: </div>
					<div class="bold">${data.round}</div>
				</div>
			`);
		}

		this._eleHead.appends(`
			<div class="w-100 split-v-center min-w-100p ${this._isCompact ? "ve-text-center" : ""}">Creature/Status</div>
			<div class="min-w-100p ${this._isCompact ? "ve-text-center" : ""}">Health</div>
			${(data.statsCols || []).map(statCol => `<div class="initp__h_stat">${statCol.abbreviation || ""}</div>`).join("")}
			<div class="initp__h_score${this._isCompact ? " initp__h_score--compact" : ""}">${this._isCompact ? "#" : "Init."}</div>
		`);

		(data.rows || []).forEach(rowData => {
			this._eleRows.appends(this._getRow(rowData));
		});
	}

	_getRow (rowData) {
		const comp = BaseComponent.fromObject(
			{
				conditions: rowData.conditions || [],
			},
			"*",
		);

		const wrpConds = ee`<div class="init__wrp_conds h-100"></div>`;

		const collectionConditions = new RenderableCollectionConditions({
			comp: comp,
			isReadOnly: true,
			barWidth: !this._isCompact ? 24 : null,
			barHeight: !this._isCompact ? 24 : null,
			wrpRows: wrpConds,
		});
		collectionConditions.render();

		const getHpContent = () => {
			const {text: hpTextWoundLevel, color: hpColor} = InitiativeTrackerUtil.getWoundMeta(rowData.hpWoundLevel);
			return {
				hpText: rowData.hpCurrent == null && rowData.hpCurrent == null
					? hpTextWoundLevel
					: `${rowData.hpCurrent == null ? "?" : rowData.hpCurrent}/${rowData.hpMax == null ? "?" : rowData.hpMax}`,
				hpColor,
			};
		};
		const {hpText, hpColor} = getHpContent();

		const dispName = e_({
			tag: "div",
			txt: `${(rowData.customName || rowData.name || "")}${rowData.ordinal != null ? ` (${rowData.ordinal})` : ""}`,
		});

		return ee`
			<div class="initp__r${rowData.isActive ? ` initp__r--active` : ""}">
				<div class="w-100 split-v-center min-w-100p">
					${dispName}
					${wrpConds}
				</div>
				<div class="min-w-100p">
					<div class="initp__r_hp_pill" style="background: ${hpColor};">${hpText}</div>
				</div>
				${this._getRenderedStatsCells({rowData})}
				<div class="initp__r_score${this._isCompact ? " initp__r_score--compact" : ""}">${rowData.initiative}</div>
			</div>
		`;
	}

	_getRenderedStatsCells ({rowData}) {
		return (rowData.rowStatColData || [])
			.map(cell => {
				return ee`<div class="initp__r_stat ve-flex-vh-center">
				 	${this._getRenderedStatsCellInner({cell})}
			 	</div>`;
			});
	}

	_getRenderedStatsCellInner ({cell}) {
		const {isUnknown, value, type} = cell.entity;

		if (isUnknown) return `<span class="ve-muted italic" title="This value is hidden!">?</span>`;

		if (type) {
			switch (type) {
				case "image": return this._getRenderedStatsCellInner_image({cell});

				default: {
					setTimeout(() => { throw new Error(`Unknown type "${type}"!`); });
					return `<span title="Bug!">🐛</span>`;
				}
			}
		}

		if (value == null) return `<span>\u2012</span>`;

		switch (typeof value) {
			case "boolean": return value === true ? `<span class="text-success glyphicon glyphicon-ok"></span>` : `<span class="text-danger glyphicon glyphicon-remove"></span>`;
			case "number":
			case "string": return value;

			default: {
				setTimeout(() => { throw new Error(`Unhandled value "${value}"!`); });
				return `<span title="Bug!">🐛</span>`;
			}
		}
	}

	_getRenderedStatsCellInner_image ({cell}) {
		const {tokenUrl, imageHref} = cell.entity;

		const hoverMeta = Renderer.monster.hover.getMakePredefinedFluffImageHoverHasImage({
			imageHref: InitiativeTrackerUtil.getImageOrTokenHref({imageHref, tokenUrl}),
		});

		const ele = ee`<img src="${tokenUrl}" class="w-24p w-24p" alt="Token Image">`
			.onn("mouseover", evt => hoverMeta.mouseOver(evt, ele[0]))
			.onn("mousemove", evt => hoverMeta.mouseMove(evt, ele[0]))
			.onn("mouseleave", evt => hoverMeta.mouseLeave(evt, ele[0]));

		return ele;
	}

	/* -------------------------------------------- */

	_handleMessage_showImage ({payload}) {
		const {imageHref} = payload;

		const hoverMeta = Renderer.monster.hover.getMakePredefinedFluffImageHoverHasImage({imageHref});
		hoverMeta.show();
	}
}

export class InitiativeTrackerPlayerMessageHandlerV0 extends InitiativeTrackerPlayerMessageHandlerV1 {
	constructor (...args) {
		super(...args);

		this._clientData = null;
	}

	set clientData (clientData) { this._clientData = clientData; }
}
