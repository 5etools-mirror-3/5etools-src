import {PANEL_TYP_EMPTY} from "../dmscreen-consts.js";

export class RenderableCollectionSaveSlotStatesSidebar extends RenderableCollectionGenericRows {
	constructor (
		{
			board,
			comp,
			wrpRows,
		},
	) {
		super(comp, "saveSlotStates", wrpRows, {namespace: "sidebar", isDiffMode: true});
		this._board = board;
	}

	_getWrpRow () {
		return veT`<button class="ve-btn ve-btn-default ve-bc-0 ve-bt-0 ve-br-0 ve-bl-0 ve-text-clip-ellipsis ve-no-shrink ve-p-0 ve-text-center ve-h-34p"></button>`;
	}

	static _HANDLER_CANCEL_EDIT;

	static _doBindHandlerCancelEdit ({fnDoDisableEditable}) {
		if (this._HANDLER_CANCEL_EDIT) {
			veE(document.body).vee.off("click", this._HANDLER_CANCEL_EDIT);
			this._HANDLER_CANCEL_EDIT = null;
		}

		this._HANDLER_CANCEL_EDIT = fnDoDisableEditable;
		veE(document.body).vee.onn("click", fnDoDisableEditable);
	}

	_populateRow ({comp, wrpRow, entity}) {
		wrpRow
			.vee.onn("click", async () => {
				await this._board.pHandleClick_setActiveSaveSlot(entity.id);
			});

		let isEditable = false;
		const doToggleEditable = () => {
			isEditable = !isEditable;

			dispName.vee.toggle(!isEditable);
			iptNameShort.vee.toggle(isEditable);

			if (!isEditable) return;

			this.constructor._doBindHandlerCancelEdit({
				fnDoDisableEditable: () => {
					if (isEditable) doToggleEditable();
				},
			});

			iptNameShort
				.vee.focus()
				.vee.select();
		};

		const dispName = veT`<span class="ve-h-100"></span>`;
		comp._addHookBase("ns", () => dispName.vee.txt(comp._state.ns ? `${comp._state.ns}` : `${entity.id}`))();

		const iptNameShort = ComponentUiUtil.getIptStr(
			comp,
			"ns",
			{
				html: `<input class="ve-text-center ve-hidden ve-form-control ve-input-xs form-control--minimal ve-text-center ve-b-0 ve-p-0 ve-h-100 ve-w-100 dmsm__ipt-name-short" placeholder="${entity.id}">`,
			},
		)
			.vee.onn("keydown", evt => {
				if (evt.key !== "Enter") return;
				if (isEditable) doToggleEditable();
			});

		wrpRow
			.vee.onn("contextmenu", evt => {
				evt.preventDefault();
				evt.stopPropagation();

				if (!comp._state.isActive) return;

				doToggleEditable();
			});

		const hkName = () => wrpRow.vee.tooltip(`Load Save Slot ${comp._state.n ? `"${comp._state.n}"` : comp._state.ns ? `"${comp._state.ns}"` : `${entity.id}`}`);
		comp._addHookBase("n", hkName);
		comp._addHookBase("ns", hkName);
		hkName();

		comp._addHookBase("isActive", () => {
			wrpRow.vee.toggleClass("ve-active", !!comp._state.isActive);
			if (!comp._state.isActive && isEditable) doToggleEditable();
		})();

		veT(wrpRow)`
			${dispName}
			${iptNameShort}
		`;
	}
}

export class RenderableCollectionSaveSlotStatesManager extends RenderableCollectionGenericRows {
	constructor (
		{
			board,
			menu,
			comp,
			selectClickHandler,
			wrpRows,
		},
	) {
		super(comp, "saveSlotStates", wrpRows, {namespace: "manager", isDiffMode: true});
		this._board = board;
		this._menu = menu;
		this._selectClickHandler = selectClickHandler;

		this._fnDoCloseModal = null;
	}

	setFnCloseModal (fn) { this._fnDoCloseModal = fn; }

	_getWrpRow () {
		return super._getWrpRow()
			.vee.addClass("ve-py-1")
			.vee.addClass("ve-lst__row")
			.vee.addClass("ve-lst__row-border")
			.vee.addClass("ve-lst__row-inner")
		;
	}

	_populateRow ({comp, wrpRow, entity}) {
		const cbSel = veT`<input type="checkbox" class="ve-no-events">`;

		const wrpCbSel = veT`<label class="ve-col-0-5 ve-h-100 ve-flex-vh-center">
			${cbSel}
		</label>`;

		const getCntPanelsNonEmpty = () => (comp._state.ps || []).filter(p => p.t !== PANEL_TYP_EMPTY).length;

		const dispCntPanels = veT`<div class="ve-flex-vh-center ve-col-1 ve-muted ve-pl-3 ve-pr-1"></div>`;
		comp._addHookBase("ps", () => {
			const cntPanels = getCntPanelsNonEmpty();
			dispCntPanels
				.vee.html(`<i class="fas fa-fw fa-window ve-mr-1"></i><span class="ve-text-center ve-w-20p">${cntPanels}</span>`)
				.vee.tooltip(`${cntPanels} Active Panel${cntPanels === 1 ? "" : "s"}`);
		})();

		const iptNameShort = ComponentUiUtil.getIptStr(comp, "ns")
			.vee.addClass("ve-w-24p")
			.vee.placeholder(entity.id)
			.vee.tooltip("A short name, shown in the sidebar.");

		const iptName = ComponentUiUtil.getIptStr(comp, "n")
			.vee.tooltip("A longer name, show in tooltips and lists.");

		const btnSetActive = veT`<button class="ve-btn ve-btn-default ve-btn-xs">Activate</button>`
			.vee.onn("click", async () => {
				this._fnDoCloseModal();
				await this._board.pHandleClick_setActiveSaveSlot(entity.id);
			});

		const btnMenu = veT`<button class="ve-btn ve-btn-default ve-btn-xs"><span class="glyphicon glyphicon-option-vertical"></span></button>`
			.vee.onn("click", async evt => {
				await ContextUtil.pOpenMenu(evt, this._menu, {userData: {entityId: entity.id}});
			});

		const btnRemove = this._utils.getBtnDelete({
			entity,
			pFnGetIsConfirm: () => !!getCntPanelsNonEmpty(),
		})
			.vee.removeClass("ve-btn-xxs")
			.vee.addClass("ve-btn-xs");

		const padDrag = this._utils.getPadDrag({wrpRow});

		comp._addHookBase("isActive", () => {
			btnSetActive.vee.toggleClass("ve-active", !!comp._state.isActive);
			btnRemove.vee.attr("disabled", !!comp._state.isActive);
		})();

		veT(wrpRow)`
			${wrpCbSel}
			
			${dispCntPanels}
			
			<label class="ve-flex-vh-center ve-col-1 ve-px-1">
				${iptNameShort}
			</label>
			
			<label class="ve-flex-vh-center ve-col-7 ve-px-1">
				${iptName}
			</label>
			
			<div class="ve-flex-vh-center ve-ml-auto ve-grow">
				${padDrag}
			
				<div class="ve-btn-group ve-flex-vh-center ve-grow">
					${btnSetActive}
					${btnMenu}
					${btnRemove}
				</div>
			</div>
		`;

		return {
			cbSel,
			wrpCbSel,
		};
	}
}
