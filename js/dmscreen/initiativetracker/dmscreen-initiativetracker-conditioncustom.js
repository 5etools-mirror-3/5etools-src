import {InitiativeTrackerConditionUtil} from "./dmscreen-initiativetracker-condition.js";

class _RenderableCollectionConditionsCustomEdit extends RenderableCollectionGenericRows {
	constructor (
		{
			comp,
			wrpRows,
		},
	) {
		super(comp, "conditionsCustom", wrpRows);
	}

	/* -------------------------------------------- */

	_populateRow ({comp, wrpRow, entity}) {
		const iptName = ComponentUiUtil.getIptStr(comp, "name");

		const iptColor = ComponentUiUtil.getIptColor(comp, "color")
			.addClass("ve-w-100");

		const iptTurns = ComponentUiUtil.getIptInt(comp, "turns", null, {isAllowNull: true, fallbackOnNaN: null})
			.addClass("ve-mr-2")
			.placeholdere("Unlimited");

		const btnDelete = this._utils.getBtnDelete({entity});

		ee(wrpRow)`
			<div class="ve-flex-vh-center ve-w-100 ve-my-1">
				<div class="ve-col-5 ve-pr-1 ve-flex-v-center">${iptName}</div>
				<div class="ve-col-2 ve-px-1 ve-flex-v-center">${iptColor}</div>
				<div class="ve-col-5 ve-pr-1 ve-flex-v-center">
					${iptTurns}
					<div class="ve-flex-vh-center ve-btn-group">
						${btnDelete}
					</div>
				</div>
			</div>
		`;
	}
}

export class InitiativeTrackerConditionCustomEdit extends BaseComponent {
	static _RenderState = class {
		constructor () {
			this.cbDoClose = null;
		}
	};

	constructor ({conditionsCustom}) {
		super();
		this._state.conditionsCustom = conditionsCustom;
	}

	getConditionsCustom () {
		return MiscUtil.copyFast(this._state.conditionsCustom);
	}

	async pGetShowModalResults () {
		const rdState = new this.constructor._RenderState();

		const {eleModalInner, eleModalFooter, doClose, pGetResolved} = UiUtil.getShowModal({
			title: "Manage Custom Conditions",
			isHeaderBorder: true,
			hasFooter: true,
		});
		rdState.cbDoClose = doClose;

		const btnAdd = ee`<button class="ve-btn ve-btn-default ve-btn-xs ve-bb-0 ve-bbr-0 ve-bbl-0" title="Add"><span class="glyphicon glyphicon-plus"></span></button>`
			.onn("click", () => {
				this._state.conditionsCustom = [...this._state.conditionsCustom, InitiativeTrackerConditionUtil.getNewRowState()];
			});

		const wrpRows = ee`<div class="ve-flex-col ve-h-100 ve-min-h-0 ve-overflow-y-auto"></div>`;

		const compRows = new _RenderableCollectionConditionsCustomEdit({comp: this, wrpRows});
		this._addHookBase("conditionsCustom", () => compRows.render())();

		ee(eleModalInner)`
			<div class="ve-flex-col ve-mt-2 ve-h-100 ve-min-h-0">
				<div class="ve-flex-vh-center ve-w-100 ve-mb-2 ve-bb-1p-trans">
					<div class="ve-col-5">Name</div>
					<div class="ve-col-2">Color</div>
					<div class="ve-col-4">Turns</div>
					<div class="ve-col-1 ve-flex-v-center ve-flex-h-right">${btnAdd}</div>
				</div>

				${wrpRows}
			</div>
		`;

		ee(eleModalFooter)`
			${this._render_getEleFooter({rdState})}
		`;

		return pGetResolved();
	}

	_render_getEleFooter ({rdState}) {
		const btnSave = ee`<button class="ve-btn ve-btn-primary ve-btn-sm ve-w-100">Save</button>`
			.onn("click", () => rdState.cbDoClose(true));

		return ee`<div class="ve-w-100 ve-py-3 ve-no-shrink">
			${btnSave}
		</div>`;
	}

	_getDefaultState () {
		return {
			conditionsCustom: [],
		};
	}
}
