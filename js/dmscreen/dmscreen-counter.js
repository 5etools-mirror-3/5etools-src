import {DmScreenPanelAppBase} from "./dmscreen-panelapp-base.js";

export class Counter extends DmScreenPanelAppBase {
	constructor (...args) {
		super(...args);

		this._comp = null;
	}

	_getPanelElement (board, state) {
		const wrpPanel = ee`<div class="ve-w-100 ve-h-100 dm-cnt__root dm__panel-bg dm__data-anchor"></div>`;
		this._comp = new CounterRoot(board, wrpPanel);
		this._comp.setStateFrom(state);
		this._comp.render(wrpPanel);
		return wrpPanel;
	}

	getState () {
		return this._comp?.getSaveableState();
	}
}

class CounterComponent extends BaseComponent {
	constructor (board, wrpPanel) {
		super();
		this._board = board;
		this._wrpPanel = wrpPanel;
		this._addHookAll("state", () => this._board.doSaveStateDebounced());
	}
}

class CounterRoot extends CounterComponent {
	constructor (board, wrpPanel) {
		super(board, wrpPanel);

		this._childComps = [];
		this._wrpRows = null;
	}

	render (eleParent) {
		eleParent.empty();

		const pod = this.getPod();

		this._wrpRows = ee`<div class="ve-flex-col ve-w-100 ve-h-100 ve-overflow-y-auto ve-relative"></div>`;
		this._childComps.forEach(comp => comp.render(this._wrpRows, pod));

		const btnAdd = ee`<button class="ve-btn ve-btn-primary ve-btn-xs"><span class="glyphicon glyphicon-plus"></span> Add Counter</button>`
			.onn("click", () => {
				const comp = new CounterRow(this._board, this._wrpPanel);
				this._childComps.push(comp);
				comp.render(this._wrpRows, pod);
				this._board.doSaveStateDebounced();
			});

		ee`<div class="ve-w-100 ve-h-100 ve-flex-col ve-px-2 ve-pb-3">
			<div class="ve-no-shrink ve-pt-4"></div>
			${this._wrpRows}
			<div class="ve-no-shrink ve-flex-h-right">${btnAdd}</div>
		</div>`.appendTo(eleParent);
	}

	_swapRowPositions (ixA, ixB) {
		const a = this._childComps[ixA];
		this._childComps[ixA] = this._childComps[ixB];
		this._childComps[ixB] = a;

		this._childComps.forEach(comp => comp.eleRow.detach().appendTo(this._wrpRows));

		this._board.doSaveStateDebounced();
	}

	_removeRow (comp) {
		const ix = this._childComps.indexOf(comp);
		if (~ix) {
			this._childComps.splice(ix, 1);
			comp.eleRow.remove();
			this._board.doSaveStateDebounced();
		}
	}

	getPod () {
		const pod = super.getPod();
		pod.swapRowPositions = this._swapRowPositions.bind(this);
		pod.removeRow = this._removeRow.bind(this);
		pod.getElesChildren = () => this._childComps.map(comp => comp.eleRow);
		return pod;
	}

	setStateFrom (toLoad) {
		this.setBaseSaveableStateFrom(toLoad);
		this._childComps = [];

		if (toLoad.rowState) {
			toLoad.rowState.forEach(r => {
				const comp = new CounterRow(this._board, this._wrpPanel);
				comp.setStateFrom(r);
				this._childComps.push(comp);
			});
		}
	}

	getSaveableState () {
		return {
			...this.getBaseSaveableState(),
			rowState: this._childComps.map(r => r.getSaveableState()),
		};
	}
}

class CounterRow extends CounterComponent {
	constructor (board, wrpPanel) {
		super(board, wrpPanel);

		this._eleRow = null;
	}

	get eleRow () { return this._eleRow; }

	render (eleParent, parent) {
		this._parent = parent;

		const iptName = ComponentUiUtil.getIptStr(this, "name").addClass("ve-mr-2").addClass("ve-small-caps");

		const iptCur = ComponentUiUtil.getIptInt(this, "current", 0, {ele: ee`<input class="ve-form-control ve-input-xs form-control--minimal ve-text-center dm-cnt__ipt dm-cnt__ipt--cur ve-bold">`});
		const iptMax = ComponentUiUtil.getIptInt(this, "max", 0, {ele: ee`<input class="ve-form-control ve-input-xs form-control--minimal ve-text-center dm-cnt__ipt dm-cnt__ipt--max ve-mr-2 ve-muted ve-bold">`});

		const hookDisplayMinMax = () => {
			iptCur.removeClass("text-success").removeClass("text-danger");
			if (this._state.current >= this._state.max) iptCur.addClass("text-success");
			else if (this._state.current <= 0) iptCur.addClass("text-danger");
		};
		this._addHookBase("current", hookDisplayMinMax);
		this._addHookBase("max", hookDisplayMinMax);
		hookDisplayMinMax();

		const btnDown = ee`<button class="ve-btn ve-btn-danger ve-btn-xs"><span class="glyphicon glyphicon-minus"></span></button>`
			.onn("click", () => this._state.current--);

		const btnUp = ee`<button class="ve-btn ve-btn-success ve-btn-xs"><span class="glyphicon glyphicon-plus"></span></button>`
			.onn("click", () => this._state.current++);

		const btnRemove = ee`<button class="ve-btn ve-btn-danger ve-btn-xxs"><span class="glyphicon glyphicon-trash"></span></button>`
			.onn("click", () => {
				const {removeRow} = this._parent;
				removeRow(this);
			});

		this._eleRow = ee`<div class="ve-flex-v-center ve-w-100 ve-py-1">
			${iptName}
			<div class="ve-relative ve-flex-vh-center">
				${iptCur}
				<div class="dm-cnt__slash ve-muted ve-text-center">/</div>
				${iptMax}
			</div>
			<div class="ve-flex ve-btn-group ve-mr-2">
				${btnDown}
				${btnUp}
			</div>

			${DragReorderUiUtil.getDragPad2(() => this._eleRow, eleParent, this._parent)}
			${btnRemove}
		</div>`.appendTo(eleParent);
	}

	_getDefaultState () { return MiscUtil.copy(CounterRow._DEFAULT_STATE); }
}
CounterRow._DEFAULT_STATE = {
	name: "",
	current: 0,
	max: 1,
};
