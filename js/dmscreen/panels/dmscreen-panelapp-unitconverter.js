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

		const wrpConverter = veT`<div class="dm-unitconv dm__panel-bg ve-split-column"></div>`;

		const tblConvert = veT`<table class="ve-w-100 table-striped"></table>`.vee.appendTo(wrpConverter);
		const tbodyConvert = veT`<tbody></tbody>`.vee.appendTo(tblConvert);
		units.forEach((u, i) => {
			const eleTr = veT`<tr class="row ve-clickable"></tr>`.vee.appendTo(tbodyConvert);
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
			veT`<td class="ve-col-3">${u.n1}</td>`.vee.onn("click", evt => clickL(evt)).vee.appendTo(eleTr);
			veT`<td class="ve-col-3 ve-code">×${u.x1.padStart(5)}</td>`.vee.onn("click", evt => clickL(evt)).vee.appendTo(eleTr);
			veT`<td class="ve-col-3">${u.n2}</td>`.vee.onn("click", evt => clickR(evt)).vee.appendTo(eleTr);
			veT`<td class="ve-col-3 ve-code">×${u.x2.padStart(5)}</td>`.vee.onn("click", evt => clickR(evt)).vee.appendTo(eleTr);
		});

		const wrpIpt = veT`<div class="ve-flex dm-unitconv__wrp-ipt"></div>`.vee.appendTo(wrpConverter);

		const wrpLeft = veT`<div class="ve-split-column dm-unitconv__wrp-ipt-inner ve-w-100"></div>`.vee.appendTo(wrpIpt);
		const eleLblLeft = veT`<span class="ve-bold"></span>`.vee.appendTo(wrpLeft);
		this._iptLeft = veT`<textarea class="dm-unitconv__ipt ve-form-control ve-h-100">${state.i || ""}</textarea>`.vee.appendTo(wrpLeft);

		const btnSwitch = veT`<button class="ve-btn ve-btn-primary dm-unitconv__btn-switch">⇆</button>`.vee.onn("click", () => {
			this._dirConv = Number(!this._dirConv);
			updateDisplay();
		}).vee.appendTo(wrpIpt);

		const wrpRight = veT`<div class="ve-split-column dm-unitconv__wrp-ipt-inner ve-w-100"></div>`.vee.appendTo(wrpIpt);
		const eleLblRight = veT`<span class="ve-bold"></span>`.vee.appendTo(wrpRight);
		const iptRight = veT`<textarea class="dm-unitconv__ipt ve-form-control ve-h-100" disabled style="background: #0000"></textarea>`.vee.appendTo(wrpRight);

		const updateDisplay = () => {
			const it = units[this._ixConv];
			const [lblL, lblR] = this._dirConv === 0 ? [it.n1, it.n2] : [it.n2, it.n1];
			eleLblLeft.vee.txt(lblL);
			eleLblRight.vee.txt(lblR);
			handleInput();
		};

		const mMaths = /^([0-9.+\-*/ ()e])*$/;
		const handleInput = () => {
			const showInvalid = () => {
				this._iptLeft.vee.addClass(`ipt-invalid`);
				iptRight.vee.val("");
			};
			const showValid = () => {
				this._iptLeft.vee.removeClass(`ipt-invalid`);
			};

			const val = (this._iptLeft.vee.val() || "").trim();
			if (!val) {
				showValid();
				iptRight.vee.val("");
			} else if (mMaths.exec(val)) {
				showValid();
				const it = units[this._ixConv];
				const mL = [Number(it.x1), Number(it.x2)][this._dirConv];
				try {
					/* eslint-disable */
					const total = eval(val);
					/* eslint-enable */
					iptRight.vee.val(Number((total * mL).toFixed(5)));
				} catch (e) {
					this._iptLeft.vee.addClass(`ipt-invalid`);
					iptRight.vee.val("");
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
			i: this._iptLeft.vee.val(),
		};
	}
}
