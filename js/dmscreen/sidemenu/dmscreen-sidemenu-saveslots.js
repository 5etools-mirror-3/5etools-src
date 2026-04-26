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
		return ee`<button class="ve-btn ve-btn-default ve-bc-0 ve-bt-0 ve-br-0 ve-bl-0 ve-text-clip-ellipsis ve-no-shrink ve-p-0 ve-text-center ve-h-34p"></button>`;
	}

	static _HANDLER_CANCEL_EDIT;

	static _doBindHandlerCancelEdit ({fnDoDisableEditable}) {
		if (this._HANDLER_CANCEL_EDIT) {
			e_(document.body).off("click", this._HANDLER_CANCEL_EDIT);
			this._HANDLER_CANCEL_EDIT = null;
		}

		this._HANDLER_CANCEL_EDIT = fnDoDisableEditable;
		e_(document.body).onn("click", fnDoDisableEditable);
	}

	_populateRow ({comp, wrpRow, entity}) {
		wrpRow
			.onn("click", async () => {
				await this._board.pHandleClick_setActiveSaveSlot(entity.id);
			});

		let isEditable = false;
		const doToggleEditable = () => {
			isEditable = !isEditable;

			dispName.toggleVe(!isEditable);
			iptNameShort.toggleVe(isEditable);

			if (!isEditable) return;

			this.constructor._doBindHandlerCancelEdit({
				fnDoDisableEditable: () => {
					if (isEditable) doToggleEditable();
				},
			});

			iptNameShort
				.focuse()
				.selecte();
		};

		const dispName = ee`<span class="ve-h-100"></span>`;
		comp._addHookBase("ns", () => dispName.txt(comp._state.ns ? `${comp._state.ns}` : `${entity.id}`))();

		const iptNameShort = ComponentUiUtil.getIptStr(
			comp,
			"ns",
			{
				html: `<input class="ve-text-center ve-hidden ve-form-control ve-input-xs form-control--minimal ve-text-center ve-b-0 ve-p-0 ve-h-100 ve-w-100 dmsm__ipt-name-short" placeholder="${entity.id}">`,
			},
		)
			.onn("keydown", evt => {
				if (evt.key !== "Enter") return;
				if (isEditable) doToggleEditable();
			});

		wrpRow
			.onn("contextmenu", evt => {
				evt.preventDefault();
				evt.stopPropagation();

				if (!comp._state.isActive) return;

				doToggleEditable();
			});

		const hkName = () => wrpRow.tooltip(`Load Save Slot ${comp._state.n ? `"${comp._state.n}"` : comp._state.ns ? `"${comp._state.ns}"` : `${entity.id}`}`);
		comp._addHookBase("n", hkName);
		comp._addHookBase("ns", hkName);
		hkName();

		comp._addHookBase("isActive", () => {
			wrpRow.toggleClass("ve-active", !!comp._state.isActive);
			if (!comp._state.isActive && isEditable) doToggleEditable();
		})();

		ee(wrpRow)`
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
			.addClass("ve-py-1")
			.addClass("ve-lst__row")
			.addClass("ve-lst__row-border")
			.addClass("ve-lst__row-inner")
		;
	}

	_populateRow ({comp, wrpRow, entity}) {
		const cbSel = ee`<input type="checkbox" class="ve-no-events">`;

		const wrpCbSel = ee`<label class="ve-col-0-5 ve-h-100 ve-flex-vh-center">
			${cbSel}
		</label>`;

		const getCntPanelsNonEmpty = () => (comp._state.ps || []).filter(p => p.t !== PANEL_TYP_EMPTY).length;

		const dispCntPanels = ee`<div class="ve-flex-vh-center ve-col-1 ve-muted ve-pl-3 ve-pr-1"></div>`;
		comp._addHookBase("ps", () => {
			const cntPanels = getCntPanelsNonEmpty();
			dispCntPanels
				.html(`<i class="fas fa-fw fa-window ve-mr-1"></i><span class="ve-text-center ve-w-20p">${cntPanels}</span>`)
				.tooltip(`${cntPanels} Active Panel${cntPanels === 1 ? "" : "s"}`);
		})();

		const iptNameShort = ComponentUiUtil.getIptStr(comp, "ns")
			.addClass("ve-w-24p")
			.placeholdere(entity.id)
			.tooltip("A short name, shown in the sidebar.");

		const iptName = ComponentUiUtil.getIptStr(comp, "n")
			.tooltip("A longer name, show in tooltips and lists.");

		const btnSetActive = ee`<button class="ve-btn ve-btn-default ve-btn-xs">Activate</button>`
			.onn("click", async () => {
				this._fnDoCloseModal();
				await this._board.pHandleClick_setActiveSaveSlot(entity.id);
			});

		const btnMenu = ee`<button class="ve-btn ve-btn-default ve-btn-xs"><span class="glyphicon glyphicon-option-vertical"></span></button>`
			.onn("click", async evt => {
				await ContextUtil.pOpenMenu(evt, this._menu, {userData: {entityId: entity.id}});
			});

		const btnRemove = this._utils.getBtnDelete({
			entity,
			pFnGetIsConfirm: () => !!getCntPanelsNonEmpty(),
		});

		comp._addHookBase("isActive", () => {
			btnSetActive.toggleClass("ve-active", !!comp._state.isActive);
			btnRemove.attr("disabled", !!comp._state.isActive);
		})();

		ee(wrpRow)`
			${wrpCbSel}
			
			${dispCntPanels}
			
			<label class="ve-flex-vh-center ve-col-1 ve-px-1">
				${iptNameShort}
			</label>
			
			<label class="ve-flex-vh-center ve-col-7 ve-px-1">
				${iptName}
			</label>
			
			<div class="ve-flex-vh-center ve-ml-auto ve-btn-group ve-grow">
				${btnSetActive}
				${btnMenu}
				${btnRemove}
			</div>
		`;

		return {
			cbSel,
			wrpCbSel,
		};
	}
}
