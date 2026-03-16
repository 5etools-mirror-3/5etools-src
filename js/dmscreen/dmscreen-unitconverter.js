import {DmScreenPanelAppBase} from "./dmscreen-panelapp-base.js";

class _UnitConverterUnit {
	constructor (n1, x1, n2, x2) {
		this.n1 = n1;
		this.x1 = x1;
		this.n2 = n2;
		this.x2 = x2;
	}
}

export class UnitConverter extends DmScreenPanelAppBase {
	constructor (...args) {
		super(...args);

		this._ixConv = null;
		this._dirConv = null;
		this._iptLeft = null;
	}

	_getPanelElement (board, state) {
		const units = [
			new _UnitConverterUnit("Inches", "2.54", "Centimetres", "0.394"),
			new _UnitConverterUnit("Feet", "0.305", "Metres", "3.28"),
			new _UnitConverterUnit("Miles", "1.61", "Kilometres", "0.620"),
			new _UnitConverterUnit("Pounds", "0.454", "Kilograms", "2.20"),
			new _UnitConverterUnit("Gallons", "3.79", "Litres", "0.264"),
			new _UnitConverterUnit("Gallons", "8", "Pints", "0.125"),
		];

		this._ixConv = state.c || 0;
		this._dirConv = state.d || 0;

		const wrpConverter = ee`<div class="dm-unitconv dm__panel-bg ve-split-column"></div>`;

		const tblConvert = ee`<table class="ve-w-100 table-striped"></table>`.appendTo(wrpConverter);
		const tbodyConvert = ee`<tbody></tbody>`.appendTo(tblConvert);
		units.forEach((u, i) => {
			const eleTr = ee`<tr class="row ve-clickable"></tr>`.appendTo(tbodyConvert);
			const clickL = () => {
				this._ixConv = i;
				this._dirConv = 0;
				updateDisplay();
			};
			const clickR = () => {
				this._ixConv = i;
				this._dirConv = 1;
				updateDisplay();
			};
			ee`<td class="ve-col-3">${u.n1}</td>`.onn("click", evt => clickL(evt)).appendTo(eleTr);
			ee`<td class="ve-col-3 ve-code">×${u.x1.padStart(5)}</td>`.onn("click", evt => clickL(evt)).appendTo(eleTr);
			ee`<td class="ve-col-3">${u.n2}</td>`.onn("click", evt => clickR(evt)).appendTo(eleTr);
			ee`<td class="ve-col-3 ve-code">×${u.x2.padStart(5)}</td>`.onn("click", evt => clickR(evt)).appendTo(eleTr);
		});

		const wrpIpt = ee`<div class="ve-flex dm-unitconv__wrp-ipt"></div>`.appendTo(wrpConverter);

		const wrpLeft = ee`<div class="ve-split-column dm-unitconv__wrp-ipt-inner ve-w-100"></div>`.appendTo(wrpIpt);
		const eleLblLeft = ee`<span class="ve-bold"></span>`.appendTo(wrpLeft);
		this._iptLeft = ee`<textarea class="dm-unitconv__ipt ve-form-control ve-h-100">${state.i || ""}</textarea>`.appendTo(wrpLeft);

		const btnSwitch = ee`<button class="ve-btn ve-btn-primary dm-unitconv__btn-switch">⇆</button>`.onn("click", () => {
			this._dirConv = Number(!this._dirConv);
			updateDisplay();
		}).appendTo(wrpIpt);

		const wrpRight = ee`<div class="ve-split-column dm-unitconv__wrp-ipt-inner ve-w-100"></div>`.appendTo(wrpIpt);
		const eleLblRight = ee`<span class="ve-bold"></span>`.appendTo(wrpRight);
		const iptRight = ee`<textarea class="dm-unitconv__ipt ve-form-control ve-h-100" disabled style="background: #0000"></textarea>`.appendTo(wrpRight);

		const updateDisplay = () => {
			const it = units[this._ixConv];
			const [lblL, lblR] = this._dirConv === 0 ? [it.n1, it.n2] : [it.n2, it.n1];
			eleLblLeft.txt(lblL);
			eleLblRight.txt(lblR);
			handleInput();
		};

		const mMaths = /^([0-9.+\-*/ ()e])*$/;
		const handleInput = () => {
			const showInvalid = () => {
				this._iptLeft.addClass(`ipt-invalid`);
				iptRight.val("");
			};
			const showValid = () => {
				this._iptLeft.removeClass(`ipt-invalid`);
			};

			const val = (this._iptLeft.val() || "").trim();
			if (!val) {
				showValid();
				iptRight.val("");
			} else if (mMaths.exec(val)) {
				showValid();
				const it = units[this._ixConv];
				const mL = [Number(it.x1), Number(it.x2)][this._dirConv];
				try {
					/* eslint-disable */
					const total = eval(val);
					/* eslint-enable */
					iptRight.val(Number((total * mL).toFixed(5)));
				} catch (e) {
					this._iptLeft.addClass(`ipt-invalid`);
					iptRight.val("");
				}
			} else showInvalid();
			board.doSaveStateDebounced();
		};

		UiUtil.bindTypingEnd({ipt: this._iptLeft, fnKeyup: handleInput});

		updateDisplay();

		return wrpConverter;
	}

	getState () {
		return {
			c: this._ixConv,
			d: this._dirConv,
			i: this._iptLeft.val(),
		};
	}
}
