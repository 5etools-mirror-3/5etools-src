import {InitiativeTrackerUtil, UtilConditions} from "../../initiativetracker/initiativetracker-utils.js";
import {InitiativeTrackerConditionCustomEdit} from "./dmscreen-initiativetracker-conditioncustom.js";
import {InitiativeTrackerConditionUtil} from "./dmscreen-initiativetracker-condition.js";

class _UtilConditionsCustomView {
	static getBtnCondition ({comp, cbSubmit, cbClick}) {
		const btn = ee`<button class="ve-btn ve-btn-default ve-btn-xs dm-init-cond__btn-cond ve-text-clip-ellipsis ve-mx-1" title="Add the &quot;${comp._state.name.qq()}&quot; condition. SHIFT to add with &quot;Unlimited&quot; duration; CTRL to add with 1-turn duration; SHIFT+CTRL to add with 10-turn duration."></button>`
			.onn("click", evt => {
				cbClick({
					name: comp._state.name,
					color: comp._state.color,
					turns: comp._state.turns,
				});

				if (evt.shiftKey && EventUtil.isCtrlMetaKey(evt)) return cbSubmit({turns: 10});

				if (EventUtil.isCtrlMetaKey(evt)) return cbSubmit({turns: 1});

				if (evt.shiftKey) return cbSubmit({turns: null});
			});

		comp._addHookBase("color", () => btn.css({"background-color": `${comp._state.color}`}))();
		comp._addHookBase("name", () => btn.txt(comp._state.name || "\u00A0"))();

		return btn;
	}
}

class _RenderableCollectionConditionsCustomView extends RenderableCollectionGenericRows {
	constructor (
		{
			comp,
			wrpRows,
			rdState,
			cbDoSubmit,
		},
	) {
		super(comp, "conditionsCustom", wrpRows);
		this._rdState = rdState;
		this._cbDoSubmit = cbDoSubmit;
	}

	_getWrpRow () {
		return ee`<div class="ve-flex-vh-center ve-w-33 ve-my-1"></div>`;
	}

	/* -------------------------------------------- */

	_populateRow ({comp, wrpRow, entity}) {
		_UtilConditionsCustomView.getBtnCondition({
			comp,
			cbClick: ({name, color, turns}) => {
				this._comp._state.name = name;
				this._comp._state.color = color;
				this._comp._state.turns = turns;
			},
			cbSubmit: ({turns}) => {
				this._comp._state.turns = turns;
				this._cbDoSubmit({rdState: this._rdState});
			},
		}).appendTo(wrpRow);
	}
}

export class InitiativeTrackerConditionAdd extends BaseComponent {
	static _RenderState = class {
		constructor () {
			this.cbDoClose = null;
		}
	};

	constructor ({conditionsCustom}) {
		super();
		this.__state.conditionsCustom = conditionsCustom;
	}

	getConditionsCustom () {
		return MiscUtil.copyFast(this._state.conditionsCustom);
	}

	async pGetShowModalResults () {
		const rdState = new this.constructor._RenderState();

		const {eleModalInner, doClose, pGetResolved} = UiUtil.getShowModal({
			isMinHeight0: true,
			isHeaderBorder: true,
			title: "Add Condition",
			eleTitleSplit: this._render_getBtnEditCustom({rdState}),
		});
		rdState.cbDoClose = doClose;

		ee(eleModalInner)`
			${this._render_getStgConditionsStandard({rdState})}

			<hr class="ve-hr-3">

			${this._render_getStgConditionsCustom({rdState})}

			${this._render_getStgIpts({rdState})}
			${this._render_getStgSubmit({rdState})}
		`;

		return pGetResolved();
	}

	_render_getBtnEditCustom ({rdState}) {
		return ee`<button class="ve-btn ve-btn-default ve-btn-xs" title="Manage Custom Conditions"><span class="glyphicon glyphicon-cog"></span></button>`
			.onn("click", async () => {
				const compEdit = new InitiativeTrackerConditionCustomEdit({conditionsCustom: MiscUtil.copyFast(this._state.conditionsCustom)});
				await compEdit.pGetShowModalResults();
				this._state.conditionsCustom = compEdit.getConditionsCustom();
			});
	}

	_render_getStgConditionsStandard ({rdState}) {
		const wrps = InitiativeTrackerUtil.CONDITIONS
			.map(cond => {
				const btn = _UtilConditionsCustomView.getBtnCondition({
					comp: BaseComponent.fromObject({
						name: cond.name,
						color: cond.color,
						turns: cond.turns,
					}, "*"),
					cbClick: ({name, color, turns}) => {
						this._state.name = name;
						this._state.color = color;
					},
					cbSubmit: ({turns}) => {
						this._state.turns = turns;
						this._doSubmit({rdState});
					},
				});

				return ee`<div class="ve-flex-vh-center ve-w-33 ve-my-1">${btn}</div>`;
			});

		return ee`
			<div class="ve-flex-col ve-w-100 ve-h-100 ve-min-h-0 ve-flex-v-center">
				<div class="ve-flex-wrap ve-w-100 ve-h-100 ve-min-h-0 dm-init-cond__wrp-btns">
					${wrps}
				</div>
			</div>
		`;
	}

	_render_getStgConditionsCustom ({rdState}) {
		const wrpRows = ee`<div class="ve-flex-wrap ve-w-100 ve-min-h-0 dm-init-cond__wrp-btns"></div>`;

		const compRows = new _RenderableCollectionConditionsCustomView({
			comp: this,
			wrpRows,
			rdState,
			cbDoSubmit: this._doSubmit.bind(this),
		});
		this._addHookBase("conditionsCustom", () => compRows.render())();

		const stg = ee`<div class="ve-flex-col ve-w-100 ve-h-100 ve-min-h-0 ve-flex-v-center">
			${wrpRows}
			<hr class="ve-hr-3">
		</div>`;

		this._addHookBase("conditionsCustom", () => stg.toggleVe(!!this._state.conditionsCustom.length))();

		return stg;
	}

	_render_getStgIpts ({rdState}) {
		const ipt = ComponentUiUtil.getIptStr(this, "name", {html: `<input class="ve-form-control">`})
			.onn("keydown", evt => {
				if (evt.key !== "Enter") return;
				ipt.trigger("change");
				this._doSubmit({rdState});
			});

		const iptColor = ComponentUiUtil.getIptColor(this, "color", {html: `<input class="ve-form-control" type="color">`});

		const iptTurns = ComponentUiUtil.getIptInt(this, "turns", null, {isAllowNull: true, fallbackOnNaN: null, html: `<input class="ve-form-control" placeholder="Unlimited">`})
			.onn("keydown", evt => {
				if (evt.key !== "Enter") return;
				iptTurns.trigger("change");
				this._doSubmit({rdState});
			});

		const btnSave = ee`<button class="ve-btn ve-btn-default ve-w-100" title="Save as New Custom Condition"><span class="glyphicon glyphicon-floppy-disk"></span></button>`
			.onn("click", () => {
				this._state.conditionsCustom = [
					...this._state.conditionsCustom,
					InitiativeTrackerConditionUtil.getNewRowState({
						name: this._state.name,
						color: this._state.color,
						turns: this._state.turns,
					}),
				];
			});

		return ee`
			<div class="ve-flex-v-center ve-mb-2">
				<div class="ve-small-caps ve-col-5 ve-pr-1">Name</div>
				<div class="ve-small-caps ve-col-2 ve-px-1">Color</div>
				<div class="ve-small-caps ve-col-4 ve-px-1">Duration</div>
				<div class="ve-col-1 ve-pl-1">&nbsp;</div>
			</div>
			<div class="ve-flex-v-center ve-mb-3">
				<div class="ve-col-5 ve-pr-1">${ipt}</div>
				<div class="ve-col-2 ve-px-1">${iptColor}</div>
				<div class="ve-col-4 ve-px-1">${iptTurns}</div>
				<div class="ve-col-1 ve-pl-1">${btnSave}</div>
			</div>
		`;
	}

	_render_getStgSubmit ({rdState}) {
		const btnAdd = ee`<button class="ve-btn ve-btn-primary ve-w-100">Set Condition</button>`
			.onn("click", () => this._doSubmit({rdState}));
		return ee`
			<div class="ve-flex-v-center">
				${btnAdd}
			</div>
		`;
	}

	_doSubmit ({rdState}) {
		rdState.cbDoClose(
			true,
			UtilConditions.getDefaultState({
				name: this._state.name,
				color: this._state.color,
				turns: this._state.turns,
			}),
		);
	}

	_getDefaultState () {
		return {
			name: "",
			color: MiscUtil.randomColor(),
			turns: null,
			conditionsCustom: [],
		};
	}
}
