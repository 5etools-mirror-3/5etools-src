const UP = "UP";
const RIGHT = "RIGHT";
const LEFT = "LEFT";
const DOWN = "DOWN";
const AX_X = "AXIS_X";
const AX_Y = "AXIS_Y";

export class DmScreenJoystickMenuBase {
	static _ON_BODY_MOUSEDOWN = null;
	static _ON_BODY_MOUSEMOVE = null;
	static _ON_BODY_MOUSEUP = null;

	static _bindSharedMovingEvents (
		{
			board,
			eleContent,
			offsetX,
			offsetY,
		},
	) {
		const eleBody = e_(document.body);

		this._unbindBodyMousemove();
		this._unbindBodyMouseup();

		this._ON_BODY_MOUSEMOVE = (evt) => {
			board.setVisiblyHoveringPanel(true);
			eleContent.css({
				top: `${EventUtil.getClientY(evt) - offsetY}px`,
				left: `${EventUtil.getClientX(evt) - offsetX}px`,
			});
		};
		eleBody
			.onn("mousemove", this._ON_BODY_MOUSEMOVE)
			.onn("touchmove", this._ON_BODY_MOUSEMOVE)
		;
	}

	static _unbindBodyMousedown () {
		if (!this._ON_BODY_MOUSEDOWN) return;
		e_(document.body)
			.off("mousedown", this._ON_BODY_MOUSEDOWN)
			.off("touchstart", this._ON_BODY_MOUSEDOWN)
		;
		this._ON_BODY_MOUSEDOWN = null;
	}

	static _bindBodyMousedown (fn) {
		this._unbindBodyMousedown();
		this._ON_BODY_MOUSEDOWN = fn;
		e_(document.body)
			.onn("mousedown", fn)
			.onn("touchstart", fn)
		;
	}

	static _unbindBodyMousemove () {
		if (!this._ON_BODY_MOUSEMOVE) return;
		e_(document.body)
			.off("mousemove", this._ON_BODY_MOUSEMOVE)
			.off("touchmove", this._ON_BODY_MOUSEMOVE)
		;
		this._ON_BODY_MOUSEMOVE = null;
	}

	static _bindBodyMousemove (fn) {
		this._unbindBodyMousemove();
		this._ON_BODY_MOUSEMOVE = fn;
		e_(document.body)
			.onn("mousemove", fn)
			.onn("touchmove", fn)
		;
	}

	static _unbindBodyMouseup () {
		if (!this._ON_BODY_MOUSEUP) return;
		e_(document.body)
			.off("mouseup", this._ON_BODY_MOUSEUP)
			.off("touchend", this._ON_BODY_MOUSEUP)
		;
		this._ON_BODY_MOUSEUP = null;
	}

	static _bindBodyMouseup (fn) {
		this._unbindBodyMouseup();
		this._ON_BODY_MOUSEUP = fn;
		e_(document.body)
			.onn("mouseup", fn)
			.onn("touchend", fn)
		;
	}

	/* -------------------------------------------- */

	static _setMovingCss ({evt, ele, w, h, offsetX, offsetY, zIndex}) {
		ele.css({
			width: `${w}px`,
			height: `${h}px`,
			position: "fixed",
			top: `${EventUtil.getClientY(evt) - offsetY}px`,
			left: `${EventUtil.getClientX(evt) - offsetX}px`,
			zIndex: zIndex,
			transform: "rotate(-4.5deg)",
			background: "none",
			cursor: "grabbing",
		});
	}

	static _unsetMovingCss (ele) {
		ele.css({
			width: "",
			height: "",
			position: "",
			top: "",
			left: "",
			zIndex: "",
			transform: "",
			background: "",
			cursor: "",
		});
	}
}

export class DmScreenExiledPanelJoystickMenu extends DmScreenJoystickMenuBase {
	static bindCtrlMoveHandlers (
		{
			board,
			panel,
			ctrlMove,
			wrpHistItem,
			btnRemove,
			fnUpdateParentRender,
			fnOnPanelDragStart,
		},
	) {
		const eleContent = panel.getContentWrapper();
		const eleBody = e_(document.body);

		const bodyOnMouseup = () => {
			board.setVisiblyHoveringPanel(false);
			this._unbindBodyMousemove();
			this._unbindBodyMouseup();

			eleBody.css("userSelect", "");
			eleContent.css("overflow-y", "");
			this._unsetMovingCss(eleContent);
			wrpHistItem.css("box-shadow", "");
			btnRemove.showVe();
			ctrlMove.showVe();
			board.getEleScreen().removeClass("board-content-hovering");
			panel.getEleContent().removeClass("panel-content-hovering");

			if (!board.hoveringPanel || panel.id === board.hoveringPanel.id) wrpHistItem.appends(eleContent);
			else {
				board.recallPanel(panel);
				const her = board.hoveringPanel;
				if (her.getEmpty()) {
					her.setFromPeer({hisMeta: panel.getPanelMeta(), hisContent: panel.eleContent, isMoveModeActive: true});
					panel.destroy();
				} else {
					const herMeta = her.getPanelMeta();
					const eleHerContent = her.getEleContent();
					her.setFromPeer({hisMeta: panel.getPanelMeta(), hisContent: panel.getEleContent(), isMoveModeActive: true});
					panel.setFromPeer({hisMeta: herMeta, hisContent: eleHerContent, isMoveModeActive: true});
					panel.exile();
				}
				fnUpdateParentRender();
			}
			MiscUtil.clearSelection();
			board.doSaveStateDebounced();
		};

		const ctrlMoveOnMousedown = (evt) => {
			board.setVisiblyHoveringPanel(true);
			MiscUtil.clearSelection();
			eleBody.css("userSelect", "none");

			const w = eleContent.outerWidthe();
			const h = eleContent.outerHeighte();
			const offset = eleContent.getBoundingClientRect().toJSON();
			const offsetX = EventUtil.getClientX(evt) - offset.left;
			const offsetY = EventUtil.getClientY(evt) - offset.top;

			eleBody.appends(eleContent);
			panel.pnl.findAll(`.panel-control-move`).forEach(ele => ele.hideVe());
			eleContent.css("overflow-y", "hidden");
			this._setMovingCss({evt, ele: eleContent, w, h, offsetX, offsetY, zIndex: 61});
			wrpHistItem.css("box-shadow", "none");
			btnRemove.hideVe();
			ctrlMove.hideVe();
			board.getEleScreen().addClass("board-content-hovering");
			panel.getEleContent().addClass("panel-content-hovering");
			fnOnPanelDragStart();

			this._bindSharedMovingEvents({
				board,
				eleContent,
				offsetX,
				offsetY,
			});

			this._bindBodyMouseup(bodyOnMouseup);
		};

		ctrlMove
			.onn("mousedown", ctrlMoveOnMousedown)
			.onn("touchstart", ctrlMoveOnMousedown)
		;
	}
}

export class DmScreenJoystickMenu extends DmScreenJoystickMenuBase {
	constructor (board, panel) {
		super();

		this.board = board;
		this.panel = panel;

		this.ctrls = null;
	}

	_initialise_ctrlMove ({ctrlMove}) {
		const eleBody = e_(document.body);

		const bodyOnMouseup = () => {
			this.panel.board.setVisiblyHoveringPanel(false);

			this.constructor._unbindBodyMousemove();
			this.constructor._unbindBodyMouseup();

			eleBody.css("userSelect", "");
			this.constructor._unsetMovingCss(this.panel.eleContent);
			this.panel.board.getEleScreen().removeClass("board-content-hovering");
			this.panel.eleContent.removeClass("panel-content-hovering");
			this.panel.pnl.removeClass("pnl-content-tab-bar-hidden");
			// clean any lingering hidden scrollbar
			this.panel.pnl.removeClass("panel-mode-move");

			if (!this.panel.board.hoveringPanel || this.panel.id === this.panel.board.hoveringPanel.id) {
				this.panel.pnlWrpContent.appends(this.panel.eleContent);
				this.panel.setMoveModeActive(true);
			} else {
				const her = this.panel.board.hoveringPanel;
				// TODO this should ideally peel off the selected tab and transfer it to the target pane, instead of swapping
				const herMeta = her.getPanelMeta();
				const eleHerContent = her.getEleContent();
				const isMoveModeActiveHer = her.getIsMoveModeActive();

				her.setFromPeer({hisMeta: this.panel.getPanelMeta(), hisContent: this.panel.getEleContent(), isMoveModeActive: true});
				this.panel.setFromPeer({hisMeta: herMeta, hisContent: eleHerContent, isMoveModeActive: isMoveModeActiveHer});
			}
			MiscUtil.clearSelection();
			this.board.doSaveStateDebounced();
			this.board.eleScreen.trigger("panelResize");
		};

		const ctrlMoveOnMousedown = evt => {
			evt.preventDefault();
			this.panel.board.setVisiblyHoveringPanel(true);
			const eleBody = e_(document.body);
			MiscUtil.clearSelection();
			eleBody.css("userSelect", "none");
			if (!this.panel.eleContent) return;

			const w = this.panel.eleContent.outerWidthe();
			const h = this.panel.eleContent.outerHeighte();
			const childH = this.panel.eleContent.childrene()[0].outerHeighte();
			const offset = this.panel.eleContent.getBoundingClientRect().toJSON();
			const offsetX = EventUtil.getClientX(evt) - offset.left;
			const offsetY = h > childH ? childH / 2 : (EventUtil.getClientY(evt) - offset.top);

			eleBody.appends(this.panel.eleContent);
			this.panel.pnl.findAll(`.panel-control-move`).forEach(ele => ele.hideVe());
			this.constructor._setMovingCss({evt, ele: this.panel.eleContent, w, h, offsetX, offsetY, zIndex: 57});
			this.panel.board.getEleScreen().addClass("board-content-hovering");
			this.panel.eleContent.addClass("panel-content-hovering");
			// clean any lingering hidden scrollbar
			this.panel.pnl.removeClass("panel-mode-move");

			this.constructor._bindSharedMovingEvents({
				board: this.panel.board,
				eleContent: this.panel.eleContent,
				offsetX,
				offsetY,
			});

			this.constructor._bindBodyMouseup(bodyOnMouseup);
		};

		ctrlMove
			.onn("mousedown", ctrlMoveOnMousedown)
			.onn("touchstart", ctrlMoveOnMousedown);
	}

	_initialise_ctrlExpand (
		{
			ctrlBg,
			ctrlExpand,
			direction,
		},
	) {
		const state = {
			axis: null,
			dim: null,
			pos: null,
			numPanelsCovered: null,
			initGCS: null,
			initGCE: null,
			initGRS: null,
			initGRE: null,
		};

		const bodyOnMousemove = evt => {
			let delta = 0;
			const px = state.axis === AX_X ? state.dim.pxWidth : state.dim.pxHeight;
			switch (direction) {
				case UP:
					delta = state.pos.top - EventUtil.getClientY(evt);
					break;
				case RIGHT:
					delta = EventUtil.getClientX(evt) - (state.pos.left + (px * this.panel.width));
					break;
				case DOWN:
					delta = EventUtil.getClientY(evt) - (state.pos.top + (px * this.panel.height));
					break;
				case LEFT:
					delta = state.pos.left - EventUtil.getClientX(evt);
					break;
			}

			state.numPanelsCovered = Math.ceil((delta / px));
			const canShrink = state.axis === AX_X ? this.panel.width - 1 : this.panel.height - 1;
			if (canShrink + state.numPanelsCovered <= 0) state.numPanelsCovered = -canShrink;

			switch (direction) {
				case UP:
					if (state.numPanelsCovered > this.panel.y) state.numPanelsCovered = this.panel.y;
					this.panel.pnl.css({
						gridRowStart: this.panel.y + (1 - state.numPanelsCovered),
						gridRowEnd: this.panel.y + 1 + this.panel.height,
					});
					break;
				case RIGHT:
					if (state.numPanelsCovered > (this.panel.board.width - this.panel.width) - this.panel.x) state.numPanelsCovered = (this.panel.board.width - this.panel.width) - this.panel.x;
					this.panel.pnl.css({
						gridColumnEnd: this.panel.x + 1 + this.panel.width + state.numPanelsCovered,
					});
					break;
				case DOWN:
					if (state.numPanelsCovered > (this.panel.board.height - this.panel.height) - this.panel.y) state.numPanelsCovered = (this.panel.board.height - this.panel.height) - this.panel.y;
					this.panel.pnl.css({
						gridRowEnd: this.panel.y + 1 + this.panel.height + state.numPanelsCovered,
					});
					break;
				case LEFT:
					if (state.numPanelsCovered > this.panel.x) state.numPanelsCovered = this.panel.x;
					this.panel.pnl.css({
						gridColumnStart: this.panel.x + (1 - state.numPanelsCovered),
						gridColumnEnd: this.panel.x + 1 + this.panel.width,
					});
					break;
			}
		};

		const bodyOnMouseup = () => {
			this.constructor._unbindBodyMousemove();
			this.constructor._unbindBodyMouseup();

			e_(document.body).css("userSelect", "");
			this.panel.setMoveModeActive(true);
			this.panel.pnl.css({
				zIndex: "",
				boxShadow: "",
				gridColumnStart: state.initGCS,
				gridColumnEnd: state.initGCE,
				gridRowStart: state.initGRS,
				gridRowEnd: state.initGRE,
			});

			const canShrink = state.axis === AX_X ? this.panel.width - 1 : this.panel.height - 1;
			if (canShrink + state.numPanelsCovered <= 0) state.numPanelsCovered = -canShrink;
			if (state.numPanelsCovered === 0) return;
			const isGrowth = !!~Math.sign(state.numPanelsCovered);
			if (isGrowth) {
				switch (direction) {
					case UP:
						if (!this.panel.hasSpaceTop()) return;
						break;
					case RIGHT:
						if (!this.panel.hasSpaceRight()) return;
						break;
					case DOWN:
						if (!this.panel.hasSpaceBottom()) return;
						break;
					case LEFT:
						if (!this.panel.hasSpaceLeft()) return;
						break;
				}
			}

			for (let i = Math.abs(state.numPanelsCovered); i > 0; --i) {
				switch (direction) {
					case UP: {
						if (isGrowth) {
							const tNeighbours = this.panel.getTopNeighbours();
							if (tNeighbours.filter(it => it.getEmpty()).length === tNeighbours.length) {
								tNeighbours.forEach(p => p.destroy());
							} else {
								tNeighbours.forEach(p => {
									if (p.canBumpTop()) p.doBumpTop();
									else if (p.canShrinkBottom()) p.doShrinkBottom();
									else p.exile();
								});
							}
						}
						this.panel.height += Math.sign(state.numPanelsCovered);
						this.panel.y -= Math.sign(state.numPanelsCovered);
						break;
					}
					case RIGHT: {
						if (isGrowth) {
							const rNeighbours = this.panel.getRightNeighbours();
							if (rNeighbours.filter(it => it.getEmpty()).length === rNeighbours.length) {
								rNeighbours.forEach(p => p.destroy());
							} else {
								rNeighbours.forEach(p => {
									if (p.canBumpRight()) p.doBumpRight();
									else if (p.canShrinkLeft()) p.doShrinkLeft();
									else p.exile();
								});
							}
						}
						this.panel.width += Math.sign(state.numPanelsCovered);
						break;
					}
					case DOWN: {
						if (isGrowth) {
							const bNeighbours = this.panel.getBottomNeighbours();
							if (bNeighbours.filter(it => it.getEmpty()).length === bNeighbours.length) {
								bNeighbours.forEach(p => p.destroy());
							} else {
								bNeighbours.forEach(p => {
									if (p.canBumpBottom()) p.doBumpBottom();
									else if (p.canShrinkTop()) p.doShrinkTop();
									else p.exile();
								});
							}
						}
						this.panel.height += Math.sign(state.numPanelsCovered);
						break;
					}
					case LEFT: {
						if (isGrowth) {
							const lNeighbours = this.panel.getLeftNeighbours();
							if (lNeighbours.filter(it => it.getEmpty()).length === lNeighbours.length) {
								lNeighbours.forEach(p => p.destroy());
							} else {
								lNeighbours.forEach(p => {
									if (p.canBumpLeft()) p.doBumpLeft();
									else if (p.canShrinkRight()) p.doShrinkRight();
									else p.exile();
								});
							}
						}
						this.panel.width += Math.sign(state.numPanelsCovered);
						this.panel.x -= Math.sign(state.numPanelsCovered);
						break;
					}
				}
			}
			this.panel.setDirty(true);
			this.panel.render();
			this.panel.board.doCheckFillSpaces();
			MiscUtil.clearSelection();
			this.board.eleScreen.trigger("panelResize");
		};

		const ctrlExpandOnMousedown = evt => {
			evt.preventDefault();
			MiscUtil.clearSelection();
			e_(document.body).css("userSelect", "none");
			this.panel.pnl.findAll(`.panel-control-move`).forEach(ele => ele.hideVe());
			this.panel.pnl.findAll(`.panel-control-bar`).forEach(ele => ele.addClass("move-expand-active"));
			ctrlBg.showVe();
			this.panel.pnl.addClass("panel-mode-move");
			ctrlExpand.showVe();

			state.axis = direction === RIGHT || direction === LEFT ? AX_X : AX_Y;
			state.pos = this.panel.pnl.getBoundingClientRect().toJSON();
			state.dim = this.panel.board.getPanelDimensions();
			state.numPanelsCovered = 0;
			state.initGCS = this.panel.pnl.css("gridColumnStart");
			state.initGCE = this.panel.pnl.css("gridColumnEnd");
			state.initGRS = this.panel.pnl.css("gridRowStart");
			state.initGRE = this.panel.pnl.css("gridRowEnd");

			this.panel.pnl.css({
				zIndex: 57,
				boxShadow: "0 0 12px 0 #000000a0",
			});

			this.constructor._bindBodyMousemove(bodyOnMousemove);
			this.constructor._bindBodyMouseup(bodyOnMouseup);
		};

		ctrlExpand
			.onn("mousedown", evt => ctrlExpandOnMousedown(evt))
			.onn("touchstart", evt => ctrlExpandOnMousedown(evt));
	}

	initialise () {
		const ctrlMove = ee`<div class="panel-control-move ve-hidden panel-control-move--bg panel-control-move-middle"></div>`;
		const ctrlExpandUp = ee`<div class="panel-control-move ve-hidden panel-control-move--bg panel-control-move-top"></div>`;
		const ctrlExpandRight = ee`<div class="panel-control-move ve-hidden panel-control-move--bg panel-control-move-right"></div>`;
		const ctrlExpandDown = ee`<div class="panel-control-move ve-hidden panel-control-move--bg panel-control-move-bottom"></div>`;
		const ctrlExpandLeft = ee`<div class="panel-control-move ve-hidden panel-control-move--bg panel-control-move-left"></div>`;
		const ctrlBtnDone = ee`<div class="panel-control-move ve-hidden panel-control-move--bg panel-control-move-btn-done">
			<div class="panel-control-move-icn-done glyphicon glyphicon-move ve-text-center" title="Stop Moving"></div>
		</div>`;
		const ctrlBg = ee`<div class="panel-control-move ve-hidden panel-control-bg"></div>`;
		this.ctrls = [ctrlMove, ctrlExpandUp, ctrlExpandRight, ctrlExpandDown, ctrlExpandLeft, ctrlBtnDone, ctrlBg];

		this._initialise_ctrlMove({ctrlMove});
		[
			{ctrlExpand: ctrlExpandUp, direction: UP},
			{ctrlExpand: ctrlExpandRight, direction: RIGHT},
			{ctrlExpand: ctrlExpandLeft, direction: LEFT},
			{ctrlExpand: ctrlExpandDown, direction: DOWN},
		]
			.forEach(({ctrlExpand, direction}) => this._initialise_ctrlExpand({ctrlBg, ctrlExpand, direction}));

		const ctrlBtnDoneOnMousedown = evt => {
			evt.preventDefault();
			this.panel.setMoveModeActive(false);
		};
		ctrlBtnDone
			.onn("mousedown", ctrlBtnDoneOnMousedown)
			.onn("touchstart", ctrlBtnDoneOnMousedown)
		;

		this.panel.pnl
			.appends(ctrlBg)
			.appends(ctrlMove)
			.appends(ctrlExpandUp)
			.appends(ctrlExpandRight)
			.appends(ctrlExpandDown)
			.appends(ctrlExpandLeft)
			.appends(ctrlBtnDone);
	}

	destroy () {
		// Implement as required
	}

	doShow () {
		this.ctrls.forEach(ele => ele.showVe());
	}

	doHide () {
		this.ctrls.forEach(ele => ele.hideVe());
	}
}
