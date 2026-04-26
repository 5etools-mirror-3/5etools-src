import {DmScreenExiledPanelJoystickMenu} from "../dmscreen-joystickmenu.js";

export class DmScreenSidemenuHistory extends BaseComponent {
	constructor ({board}) {
		super();

		this._board = board;

		this._wrpSideMenu = null;
		this._wrpHistory = null;

		this._wrpHistoryPanels = null;
	}

	/* -------------------------------------------- */

	setIsFullscreen (val) {
		this._state.isFullscreen = !!val;
	}

	/* -------------------------------------------- */

	init () {
		this._wrpSideMenu = es(`#dm-screen-sidemenu`);
		this._wrpHistory = es(`#dm-screen-sidemenu-history`);

		this._addHookBase("isVisible", () => {
			if (this._state.isVisible) this.doUpdateRender();
			this._wrpHistory.toggleClass("dmsmh__wrp-history--open", !!this._state.isVisible);
		})();

		this._addHookBase("isFullscreen", () => {
			this._wrpHistory.toggleClass("ve-bt-1p", !this._state.isFullscreen);
		})();

		const bodyOnMousedown = evt => {
			if (this._wrpSideMenu.contains(evt.target)) return;

			this._state.isVisible = false;
		};

		e_(document.body)
			.onn("mousedown", bodyOnMousedown)
			.onn("touchstart", bodyOnMousedown)
		;
	}

	/* -------------------------------------------- */

	render () {
		const btnHistClear = ee`<button class="ve-btn ve-btn-danger ve-btn-xs">Clear</button>`
			.onn("click", () => {
				this._board.exiledPanels.forEach(p => p.destroy());
				this._board.exiledPanels = [];
				this.doUpdateRender();
			});

		this._wrpHistoryPanels = ee`<div class="ve-flex-col ve-w-100 ve-h-100 ve-min-h-0 ve-overflow-y-auto ve-overflow-x-hidden"></div>`;

		ee(this._wrpHistory)`
			<div class="ve-w-100 ve-mb-2 ve-split-v-center">
				<span class="ve-small-caps">Recently Removed</span>
				${btnHistClear}
			</div>
			<hr class="ve-hr-2">
			${this._wrpHistoryPanels}
		`;
	}

	/* -------------------------------------------- */

	getBtnToggle () {
		const btnToggle = ee`<button class="ve-btn ve-btn-default ve-bc-0 ve-br-0 ve-bl-0 ve-mb-4" title="Toggle History"><span class="fas fa-clock-rotate-left"></span></button>`
			.onn("click", () => this._state.isVisible = !this._state.isVisible);

		this._addHookBase("isVisible", () => btnToggle.toggleClass("ve-active", this._state.isVisible))();

		return btnToggle;
	}

	/* -------------------------------------------- */

	doUpdateRender () {
		this._board.exiledPanels
			.forEach(p => p.getContentWrapper().detach());

		this._wrpHistoryPanels.empty();

		this._board.exiledPanels
			.forEach((panel, i) => {
				const btnRemove = ee`<div class="panel-history-control-remove-wrapper"><span class="panel-history-control-remove glyphicon glyphicon-remove" title="Remove"></span></div>`
					.onn("click", () => {
						this._board.exiledPanels[i].destroy();
						this._board.exiledPanels.splice(i, 1);
						this.doUpdateRender();
					});

				const ctrlMove = ee`<div class="panel-history-control-middle" title="Move"></div>`;

				const wrpHistItem = ee`<div class="sidemenu__history-item ve-no-shrink">
					<div class="sidemenu__history-item-cover">
						${btnRemove}
						${ctrlMove}
					</div>
					
					${panel.getContentWrapper()}
				</div>`.appendTo(this._wrpHistoryPanels);

				DmScreenExiledPanelJoystickMenu.bindCtrlMoveHandlers({
					board: this._board,
					panel,
					ctrlMove,
					wrpHistItem,
					btnRemove,
					fnUpdateParentRender: this.doUpdateRender.bind(this),
					fnOnPanelDragStart: this._onPanelDragStart.bind(this),
				});
			});

		this._board.doSaveStateDebounced();
	}

	_onPanelDragStart () {
		this._state.isVisible = false;
	}

	/* -------------------------------------------- */

	_getDefaultState () {
		return {
			isVisible: false,
			isFullscreen: false,
		};
	}
}
