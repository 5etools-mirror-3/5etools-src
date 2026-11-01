import {
	InitiativeTrackerStatColumnFactory,
} from "./dmscreen-initiativetracker-statcolumns.js";
import {InitiativeTrackerUtil} from "../../../initiativetracker/initiativetracker-utils.js";

class _RenderableCollectionRowStatColData extends RenderableCollectionGenericRows {
	constructor (
		{
			rootComp,
			comp,
			wrpRows,
			networking,
			mon,
		},
	) {
		super(comp, "rowStatColData", wrpRows);
		this._rootComp = rootComp;
		this._networking = networking;
		this._mon = mon;
	}

	_getWrpRow () {
		return veT`<div class="ve-flex-vh-center"></div>`;
	}

	_populateRow ({comp, wrpRow, entity}) {
		const statsColData = this._rootComp._state.statsCols.find(statsCol => statsCol.id === entity.id);
		if (!statsColData) return {};

		const meta = InitiativeTrackerStatColumnFactory.fromStateData({data: statsColData});
		meta.getRendered({comp, mon: this._mon, networking: this._networking}).vee.appendTo(wrpRow);

		return {
			cbOnTurnStart: ({state, direction}) => {
				meta.onTurnStart({state, direction, mon: this._mon});
			},
			cbOnRoundStart: ({state, direction}) => {
				meta.onRoundStart({state, direction, mon: this._mon});
			},
		};
	}
}

/** @abstract */
export class RenderableCollectionRowDataBase extends RenderableCollectionAsyncGenericRows {
	constructor (
		{
			comp,
			prop,
			wrpRows,
			roller,
			networking = null,
			rowStateBuilder,
		},
	) {
		super(comp, prop, wrpRows);
		this._roller = roller;
		this._networking = networking;
		this._rowStateBuilder = rowStateBuilder;
	}

	/* -------------------------------------------- */

	_getWrpRow () {
		return veT`<div class="dm-init__row ve-overflow-hidden ve-pr-1"></div>`;
	}

	async _pPopulateRow ({comp, wrpRow, entity}) {
		const fnsCleanup = [];

		const {isMon, mon, fluff} = await this._pPopulateRow_pGetMonsterMeta({comp});

		comp._addHookBase("isActive", () => wrpRow.vee.toggleClass("dm-init__row-active", !!comp._state.isActive))();

		this._pPopulateRow_bindParentRowStatColsIsEditableHook({comp, entity, mon, fluff, fnsCleanup});

		const wrpLhs = veT`<div class="dm-init__row-lhs"></div>`.vee.appendTo(wrpRow);

		this._pPopulateRow_player({comp, wrpLhs, isMon});
		this._pPopulateRow_monster({comp, wrpLhs, isMon, mon, fluff});

		this._pPopulateRow_conditions({comp, wrpLhs});

		this._pPopulateRow_statsCols({comp, wrpRow, mon, fnsCleanup});

		const wrpRhs = veT`<div class="dm-init__row-rhs"></div>`.vee.appendTo(wrpRow);

		this._pPopulateRow_hp({comp, wrpRhs, fnsCleanup});
		this._pPopulateRow_initiative({comp, wrpRhs});
		this._pPopulateRow_btns({comp, entity, wrpRhs});

		return {
			cbOnTurnStart: ({state, direction}) => {
				Object.values(comp._getRenderedCollection({prop: "rowStatColData"}))
					.forEach(rendered => {
						if (!rendered.cbOnTurnStart) return;

						const stateSub = state.entity.rowStatColData
							.find(cell => cell.id === rendered.id);
						rendered.cbOnTurnStart({state: stateSub, direction});
					});
			},
			cbOnRoundStart: ({state, direction}) => {
				Object.values(comp._getRenderedCollection({prop: "rowStatColData"}))
					.forEach(rendered => {
						if (!rendered.cbOnRoundStart) return;

						const stateSub = state.entity.rowStatColData
							.find(cell => cell.id === rendered.id);
						rendered.cbOnRoundStart({state: stateSub, direction});
					});
			},
			fnsCleanup,
		};
	}

	_pOpenHpOverlay ({comp, iptHpCurrent}) {
		if (this._comp._state.isLocked) return;

		this._comp._dmInitHpOverlay?.close();

		const initialValue = comp._state.hpCurrent;
		const initialValueForMath = initialValue ?? 0;
		let draftDelta = 0;
		let draftTotal = initialValue;
		const wrpOverlay = veT`<div class="dm-init__hp-overlay" role="dialog" aria-label="Modify hit points">
			<div class="dm-init__hp-overlay__row dm-init__hp-overlay__row-multiplier">
				<label><input class="dm-init__hp-overlay__cb-half" type="checkbox"> ½</label>
				<label><input class="dm-init__hp-overlay__cb-double" type="checkbox"> ×2</label>
			</div>
			<div class="dm-init__hp-overlay__row">
				<button class="ve-btn ve-btn-default ve-btn-xs" title="Set minimum hit points" aria-label="Set minimum hit points">MIN</button>
				<button class="ve-btn ve-btn-default ve-btn-xs" title="Decrease by 10" aria-label="Decrease by 10">-10</button>
				<button class="ve-btn ve-btn-default ve-btn-xs" title="Decrease by 5" aria-label="Decrease by 5">-5</button>
				<button class="ve-btn ve-btn-default ve-btn-xs" title="Decrease by 1" aria-label="Decrease by 1">-1</button>
				<input class="ve-form-control ve-input-sm dm-init__hp-overlay__ipt-delta" aria-label="Hit point adjustment" type="number">
				<button class="ve-btn ve-btn-default ve-btn-xs" title="Increase by 1" aria-label="Increase by 1">+1</button>
				<button class="ve-btn ve-btn-default ve-btn-xs" title="Increase by 5" aria-label="Increase by 5">+5</button>
				<button class="ve-btn ve-btn-default ve-btn-xs" title="Increase by 10" aria-label="Increase by 10">+10</button>
				<button class="ve-btn ve-btn-default ve-btn-xs" title="Set maximum hit points" aria-label="Set maximum hit points">MAX</button>
			</div>
			<div class="dm-init__hp-overlay__row dm-init__hp-overlay__row-total">
				<button class="ve-btn ve-btn-danger ve-btn-xs" title="Cancel" aria-label="Cancel"><span class="glyphicon glyphicon-remove"></span></button>
				<input class="ve-form-control ve-input-sm dm-init__hp-overlay__ipt-total" aria-label="Total hit points" type="number">
				<button class="ve-btn ve-btn-success ve-btn-xs" title="Confirm" aria-label="Confirm"><span class="glyphicon glyphicon-ok"></span></button>
			</div>
		</div>`;
		const ipts = wrpOverlay.vee.findAll("input");
		const cbHalf = ipts[0];
		const cbDouble = ipts[1];
		const iptDelta = ipts[2];
		const iptTotal = ipts[3];
		const btns = wrpOverlay.vee.findAll("button");

		const getClampedValue = value => {
			if (!Number.isFinite(value)) return null;
			if (!this._comp._state.isInvertWoundDirection || comp._state.hpMax == null) return Math.max(0, value);
			return Math.max(0, Math.min(comp._state.hpMax, value));
		};
		const getMultiplier = () => cbHalf.checked ? 0.5 : cbDouble.checked ? 2 : 1;
		const getEffectiveDelta = value => Math.sign(value) * Math.floor(Math.abs(value) * getMultiplier());
		const setDraftDelta = value => {
			draftDelta = Number.isFinite(value) ? value : 0;
			draftTotal = initialValue == null && draftDelta === 0
				? null
				: getClampedValue(initialValueForMath + getEffectiveDelta(draftDelta));
			iptDelta.value = draftDelta;
			iptTotal.value = draftTotal ?? "";
		};
		const setDraftTotal = value => {
			const total = getClampedValue(value);
			if (total == null) return;
			draftTotal = total;
			draftDelta = total - initialValueForMath;
			iptDelta.value = draftDelta;
			iptTotal.value = total;
		};
		const close = () => {
			if (this._comp._dmInitHpOverlay?.overlay !== wrpOverlay) return;
			wrpOverlay.remove();
			this._comp._dmInitHpOverlay = null;
		};

		btns[0].addEventListener("click", () => setDraftTotal(0));
		btns[1].addEventListener("click", () => setDraftDelta(draftDelta - 10));
		btns[2].addEventListener("click", () => setDraftDelta(draftDelta - 5));
		btns[3].addEventListener("click", () => setDraftDelta(draftDelta - 1));
		btns[4].addEventListener("click", () => setDraftDelta(draftDelta + 1));
		btns[5].addEventListener("click", () => setDraftDelta(draftDelta + 5));
		btns[6].addEventListener("click", () => setDraftDelta(draftDelta + 10));
		btns[7].addEventListener("click", () => {
			if (comp._state.hpMax == null) return;
			setDraftTotal(comp._state.hpMax);
		});
		btns[8].addEventListener("click", close);
		btns[9].addEventListener("click", () => {
			const total = Number(iptTotal.value);
			if (!iptTotal.value.trim() || !Number.isFinite(total)) return;
			comp._state.hpCurrent = getClampedValue(total);
			close();
		});
		cbHalf.addEventListener("change", () => {
			if (cbHalf.checked) cbDouble.checked = false;
			setDraftDelta(draftDelta);
		});
		cbDouble.addEventListener("change", () => {
			if (cbDouble.checked) cbHalf.checked = false;
			setDraftDelta(draftDelta);
		});
		iptDelta.addEventListener("input", () => {
			const delta = Number(iptDelta.value);
			if (Number.isFinite(delta)) setDraftDelta(delta);
		});
		iptTotal.addEventListener("input", () => setDraftTotal(Number(iptTotal.value)));
		[iptDelta, iptTotal].forEach(ipt => ipt.addEventListener("keydown", evt => {
			if (evt.key === "Enter") btns[9].click();
			if (evt.key === "Escape") close();
		}));

		wrpOverlay.vee.appendTo(document.body);
		setDraftDelta(0);
		const rect = iptHpCurrent.getBoundingClientRect();
		const overlayRect = wrpOverlay.getBoundingClientRect();
		const left = Math.max(4, Math.min(
			window.innerWidth - overlayRect.width - 4,
			rect.left + (rect.width - overlayRect.width) / 2,
		));
		wrpOverlay.style.left = `${left}px`;
		wrpOverlay.style.top = `${Math.max(4, rect.top - overlayRect.height - 4)}px`;
		this._comp._dmInitHpOverlay = {overlay: wrpOverlay, close};
		iptDelta.focus();
		iptDelta.select();
	}

	/* ----- */

	/**
	 * @abstract
	 * @return {object}
	 */
	async _pPopulateRow_pGetMonsterMeta ({comp}) {
		throw new Error("Unimplemented!");
	}

	/* ----- */

	_pPopulateRow_bindParentRowStatColsIsEditableHook ({comp, entity, mon, fluff, fnsCleanup}) {
		const hkParentStatCols = () => {
			const isRowExists = this._comp._state[this._prop]
				.some(row => row.id === entity.id);
			if (!isRowExists) return; // Avoid race condition (row removed, but async render has not yet cleaned it up)

			const rowStatColDataNxt = [];

			this._comp._state.statsCols
				.forEach(data => {
					const existing = comp._state.rowStatColData.find(cell => cell.id === data.id);
					if (existing) {
						// Copy the parent isEditable flag to the child
						existing.entity.isEditable = data.isEditable;
						return rowStatColDataNxt.push(existing);
					}

					const meta = InitiativeTrackerStatColumnFactory.fromStateData({data});
					const initialState = meta.getInitialCellStateData({mon, fluff});
					rowStatColDataNxt.push(initialState);
				});

			comp._state.rowStatColData = rowStatColDataNxt;
		};
		this._comp._addHookBase("statsCols", hkParentStatCols)();
		fnsCleanup.push(() => this._comp._removeHookBase("statsCols", hkParentStatCols));
	}

	/* ----- */

	_pPopulateRow_player ({comp, wrpLhs, isMon}) {
		if (isMon) return;

		ComponentUiUtil.getIptStr(
			comp,
			"name",
			{
				html: `<input class="ve-form-control ve-input-sm name dm-init__ipt-name dm-init-lockable dm-init__row-input" placeholder="Name">`,
			},
		).vee.appendTo(wrpLhs);
	}

	/* ----- */

	/**
	 * @abstract
	 * @return void
	 */
	_pPopulateRow_monster ({comp, wrpLhs, isMon, mon, fluff}) {
		throw new Error("Unimplemented!");
	}

	/* ----- */

	/**
	 * @abstract
	 * @return void
	 */
	_pPopulateRow_conditions ({comp, wrpLhs}) {
		throw new Error("Unimplemented!");
	}

	/* ----- */

	_pPopulateRow_statsCols ({comp, wrpRow, mon, fnsCleanup}) {
		const wrp = veT`<div class="dm-init__row-mid"></div>`
			.vee.appendTo(wrpRow);

		const hkParentStatsAddCols = () => wrp.vee.toggle(!!this._comp._state.isStatsAddColumns);
		this._comp._addHookBase("isStatsAddColumns", hkParentStatsAddCols)();
		fnsCleanup.push(() => this._comp._removeHookBase("isStatsAddColumns", hkParentStatsAddCols));

		const renderableCollection = new _RenderableCollectionRowStatColData({
			rootComp: this._comp,
			comp,
			wrpRows: wrp,
			networking: this._networking,
			mon,
		});
		comp._addHookBase("rowStatColData", () => renderableCollection.render())();
	}

	/* ----- */

	_pPopulateRow_hp ({comp, wrpRhs, fnsCleanup}) {
		const iptHpCurrent = ComponentUiUtil.getIptNumber(
			comp,
			"hpCurrent",
			null,
			{
				isAllowNull: true,
				fallbackOnNaN: null,
				html: `<input class="ve-form-control ve-input-sm hp dm-init__row-input ve-text-right ve-w-40p ve-mr-0 ve-br-0">`,
			},
		)
			.vee.onn("click", () => this._pOpenHpOverlay({comp, iptHpCurrent}));

		const iptHpMax = ComponentUiUtil.getIptNumber(
			comp,
			"hpMax",
			null,
			{
				isAllowNull: true,
				fallbackOnNaN: null,
				html: `<input class="ve-form-control ve-input-sm hp-max dm-init__row-input ve-w-40p ve-mr-0 ve-bl-0">`,
			},
		)
			.vee.onn("click", () => iptHpMax.select());

		const hkHpColors = () => {
			const pctWounded = this._comp._state.isInvertWoundDirection
				? 100 * (comp._state.hpMax - comp._state.hpCurrent) / comp._state.hpMax
				: 100 * comp._state.hpCurrent / comp._state.hpMax;
			const woundLevel = InitiativeTrackerUtil.getWoundLevel(pctWounded);
			if (~woundLevel) {
				const woundMeta = InitiativeTrackerUtil.getWoundMeta(woundLevel);
				iptHpCurrent.vee.css({"color": woundMeta.color});
				iptHpMax.vee.css({"color": woundMeta.color});
			} else {
				iptHpCurrent.vee.css({"color": ""});
				iptHpMax.vee.css({"color": ""});
			}
		};
		comp._addHookBase("hpCurrent", hkHpColors);
		comp._addHookBase("hpMax", hkHpColors);
		hkHpColors();

		this._comp._addHookBase("isInvertWoundDirection", hkHpColors)();
		fnsCleanup.push(() => this._comp._removeHookBase("isInvertWoundDirection", hkHpColors));

		veT`<div class="ve-flex ve-relative ve-mr-3p">
			<div class="ve-text-right">${iptHpCurrent}</div>
			<div class="dm-init__sep-fields-slash ve-flex-vh-center">/</div>
			<div class="ve-text-left">${iptHpMax}</div>
		</div>`
			.vee.appendTo(wrpRhs);

		fnsCleanup.push(() => this._comp._dmInitHpOverlay?.close());
	}

	/* ----- */

	/**
	 * @abstract
	 * @return void
	 */
	_pPopulateRow_initiative ({comp, wrpRhs}) {
		throw new Error("Unimplemented!");
	}

	/* ----- */

	/**
	 * @abstract
	 * @return void
	 */
	_pPopulateRow_btns ({comp, entity, wrpRhs}) {
		throw new Error("Unimplemented!");
	}

	/* -------------------------------------------- */

	pDoDeleteExistingRender (rendered) {
		rendered.fnsCleanup.forEach(fn => fn());
	}
}

/** @abstract */
export class InitiativeTrackerRowDataViewBase {
	static _RenderState = class {
		constructor () {
			this.fnsCleanup = [];
		}
	};

	_TextHeaderLhs;
	_ClsRenderableCollectionRowData;

	constructor ({comp, prop, roller, networking, rowStateBuilder}) {
		this._comp = comp;
		this._prop = prop;
		this._roller = roller;
		this._networking = networking;
		this._rowStateBuilder = rowStateBuilder;

		this._compRowsLock = new VeLock({name: "Row render"});
		this._compRows = null;
	}

	/* -------------------------------------------- */

	getRenderedView () {
		const rdState = new this.constructor._RenderState();

		const ele = veT`<div class="dm-init__wrp-header-outer">
				<div class="dm-init__wrp-header ve-pr-1">
					<div class="dm-init__row-lhs dm-init__header">
						<div class="ve-w-100">${this._TextHeaderLhs}</div>
					</div>

					${this._render_getWrpHeaderStatsCols({rdState})}

					${this._render_getWrpHeaderRhs({rdState})}
				</div>

				${this._render_getWrpRows({rdState})}
		</div>`;

		return {
			ele,
			cbDoCleanup: () => rdState.fnsCleanup.forEach(fn => fn()),
		};
	}

	_render_getWrpHeaderStatsCols ({rdState}) {
		const wrpHeaderStatsCols = veT`<div class="dm-init__row-mid"></div>`;
		const hkHeaderStatsCols = () => {
			wrpHeaderStatsCols.vee.empty();

			if (!this._comp._state.isStatsAddColumns) return;

			this._comp._state.statsCols.forEach(data => {
				const meta = InitiativeTrackerStatColumnFactory.fromStateData({data});
				wrpHeaderStatsCols.vee.appends(meta.getEleRenderedHeader());
			});
		};
		this._comp._addHookBase("isStatsAddColumns", hkHeaderStatsCols);
		this._comp._addHookBase("statsCols", hkHeaderStatsCols);
		hkHeaderStatsCols();
		rdState.fnsCleanup.push(
			() => this._comp._removeHookBase("isStatsAddColumns", hkHeaderStatsCols),
			() => this._comp._removeHookBase("statsCols", hkHeaderStatsCols),
		);

		return wrpHeaderStatsCols;
	}

	/**
	 * @abstract
	 * @return {HTMLElementExtended}
	 */
	_render_getWrpHeaderRhs ({rdState}) {
		throw new Error("Unimplemented!");
	}

	_render_getWrpRows ({rdState}) {
		const wrpRows = veT`<div class="dm-init__wrp-entries"></div>`;

		this._compRows = new this._ClsRenderableCollectionRowData({
			comp: this._comp,
			wrpRows,
			roller: this._roller,
			networking: this._networking,
			rowStateBuilder: this._rowStateBuilder,
		});

		this._render_bindHooksRows({rdState});

		return wrpRows;
	}

	/**
	 * @abstract
	 * @return void
	 */
	_render_bindHooksRows ({rdState}) {
		throw new Error("Unimplemented!");
	}
}
