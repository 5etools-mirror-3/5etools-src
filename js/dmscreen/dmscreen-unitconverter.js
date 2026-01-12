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
		this._$iptLeft = null;
	}

	_$getPanelElement (board, state) {
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

		const $wrpConverter = $(`<div class="dm-unitconv dm__panel-bg split-column"></div>`);

		const $tblConvert = $(`<table class="w-100 table-striped"></table>`).appendTo($wrpConverter);
		const $tbodyConvert = $(`<tbody></tbody>`).appendTo($tblConvert);
		units.forEach((u, i) => {
			const $tr = $(`<tr class="row clickable"></tr>`).appendTo($tbodyConvert);
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
			$(`<td class="ve-col-3">${u.n1}</td>`).click(clickL).appendTo($tr);
			$(`<td class="ve-col-3 code">×${u.x1.padStart(5)}</td>`).click(clickL).appendTo($tr);
			$(`<td class="ve-col-3">${u.n2}</td>`).click(clickR).appendTo($tr);
			$(`<td class="ve-col-3 code">×${u.x2.padStart(5)}</td>`).click(clickR).appendTo($tr);
		});

		const $wrpIpt = $(`<div class="ve-flex dm-unitconv__wrp-ipt"></div>`).appendTo($wrpConverter);

		const $wrpLeft = $(`<div class="split-column dm-unitconv__wrp-ipt-inner w-100"></div>`).appendTo($wrpIpt);
		const $lblLeft = $(`<span class="bold"></span>`).appendTo($wrpLeft);
		this._$iptLeft = $(`<textarea class="dm-unitconv__ipt form-control h-100">${state.i || ""}</textarea>`).appendTo($wrpLeft);

		const $btnSwitch = $(`<button class="ve-btn ve-btn-primary dm-unitconv__btn-switch">⇆</button>`).click(() => {
			this._dirConv = Number(!this._dirConv);
			updateDisplay();
		}).appendTo($wrpIpt);

		const $wrpRight = $(`<div class="split-column dm-unitconv__wrp-ipt-inner w-100"></div>`).appendTo($wrpIpt);
		const $lblRight = $(`<span class="bold"></span>`).appendTo($wrpRight);
		const $iptRight = $(`<textarea class="dm-unitconv__ipt form-control h-100" disabled style="background: #0000"></textarea>`).appendTo($wrpRight);

		const updateDisplay = () => {
			const it = units[this._ixConv];
			const [lblL, lblR] = this._dirConv === 0 ? [it.n1, it.n2] : [it.n2, it.n1];
			$lblLeft.text(lblL);
			$lblRight.text(lblR);
			handleInput();
		};

		const mMaths = /^([0-9.+\-*/ ()e])*$/;
		const handleInput = () => {
			const showInvalid = () => {
				this._$iptLeft.addClass(`ipt-invalid`);
				$iptRight.val("");
			};
			const showValid = () => {
				this._$iptLeft.removeClass(`ipt-invalid`);
			};

			const val = (this._$iptLeft.val() || "").trim();
			if (!val) {
				showValid();
				$iptRight.val("");
			} else if (mMaths.exec(val)) {
				showValid();
				const it = units[this._ixConv];
				const mL = [Number(it.x1), Number(it.x2)][this._dirConv];
				try {
					/* eslint-disable */
					const total = eval(val);
					/* eslint-enable */
					$iptRight.val(Number((total * mL).toFixed(5)));
				} catch (e) {
					this._$iptLeft.addClass(`ipt-invalid`);
					$iptRight.val("");
				}
			} else showInvalid();
			board.doSaveStateDebounced();
		};

		UiUtil.bindTypingEnd({$ipt: this._$iptLeft, fnKeyup: handleInput});

		updateDisplay();

		return $wrpConverter;
	}

	getState () {
		return {
			c: this._ixConv,
			d: this._dirConv,
			i: this._$iptLeft.val(),
		};
	}
}
