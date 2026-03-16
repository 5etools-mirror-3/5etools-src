import {DmScreenPanelAppBase} from "./dmscreen-panelapp-base.js";

class _MoneyConverterUnit {
	constructor (name, multiplier, abbreviation) {
		this.n = name;
		this.mult = multiplier;
		this.abbv = abbreviation;
	}
}

/**
 * A simple money converter, i.e.: input x electrum, y silver, z copper and get the total in gold, or in any other type of coin chosen.
 */
export class MoneyConverter extends DmScreenPanelAppBase {
	constructor (...args) {
		super(...args);

		this._selOut = null;
		this._iptSplit = null;
		this._wrpRows = null;
		this._disabledCurrency = null;
	}

	_getPanelElement (board, state) {
		this._disabledCurrency = state.d || {};

		const COIN_WEIGHT = 0.02;
		const CURRENCY = [
			new _MoneyConverterUnit("Copper", 1, "cp"),
			new _MoneyConverterUnit("Silver", 10, "sp"),
			new _MoneyConverterUnit("Electrum", 50, "ep"),
			new _MoneyConverterUnit("Gold", 100, "gp"),
			new _MoneyConverterUnit("Platinum", 1000, "pp"),
			new _MoneyConverterUnit(`Nib (${Parser.sourceJsonToAbv(Parser.SRC_WDH)})`, 1, "nib"),
			new _MoneyConverterUnit(`Shard (${Parser.sourceJsonToAbv(Parser.SRC_WDH)})`, 10, "shard"),
			new _MoneyConverterUnit(`Taol (${Parser.sourceJsonToAbv(Parser.SRC_WDH)})`, 200, "taol"),
			new _MoneyConverterUnit(`Dragon (${Parser.sourceJsonToAbv(Parser.SRC_WDH)})`, 100, "dgn"),
			new _MoneyConverterUnit(`Sun (${Parser.sourceJsonToAbv(Parser.SRC_WDH)})`, 1000, "sun"),
			new _MoneyConverterUnit(`Harbor Moon (${Parser.sourceJsonToAbv(Parser.SRC_WDH)})`, 5000, "moon"),
		];
		const CURRENCY_INDEXED = [...CURRENCY].map((it, i) => {
			it.ix = i;
			return it;
		}).reverse();
		const DEFAULT_CURRENCY = 3;

		const wrpConverter = ee`<div class="dm_money dm__panel-bg ve-split-column"></div>`;

		const doUpdate = () => {
			if (!this._wrpRows.findAll(`.dm-money__row`)) {
				addRow();
			}

			Object.entries(this._disabledCurrency).forEach(([currency, disabled]) => {
				this._selOut.find(`option[value="${currency}"]`).toggleVe(!disabled);
			});
			// if the current choice is disabled, deselect it, and restart
			if (this._disabledCurrency[this._selOut.val()]) {
				this._selOut.val("-1");
				doUpdate();
				return;
			}

			const elesRows = this._wrpRows.findAll(`.dm-money__row`);
			elesRows.forEach(ele => ele.removeClass("form-control--error"));
			this._iptSplit.removeClass("form-control--error");

			const outCurrency = Number(this._selOut.val()) || 0;

			const outParts = [];
			let totalWeight = 0;

			const splitBetweenStr = (this._iptSplit.val() || "").trim();
			let split = 1;
			if (splitBetweenStr) {
				const splitBetweenNum = Number(splitBetweenStr);
				if (isNaN(splitBetweenNum)) this._iptSplit.addClass("form-control--error");
				else split = splitBetweenNum;
			}

			if (outCurrency === -1) { // only split, don't convert
				const totals = [];
				const extras = [];
				const allowedCategories = new Set();

				elesRows.forEach((ele) => {
					const strVal = (ele.find(`input`).val() || "").trim();
					if (strVal) {
						const asNum = Number(strVal);
						if (isNaN(asNum)) ele.addClass("form-control--error");
						else {
							const ix = Number(ele.find(`select`).val());
							totals[ix] = (totals[ix] || 0) + asNum;
							allowedCategories.add(CURRENCY[ix]._cat);
						}
					}
				});

				if (split > 1) {
					CURRENCY_INDEXED.forEach((c, i) => {
						const it = totals[c.ix];
						if (it) {
							let remainder = (it % split) * c.mult;
							totals[c.ix] = Math.floor(it / split);

							for (let j = i + 1; j < CURRENCY_INDEXED.length; ++j) {
								const nxtCurrency = CURRENCY_INDEXED[j];

								// skip and convert to a smaller denomination as required
								if (this._disabledCurrency[nxtCurrency.ix]) continue;

								if (remainder >= nxtCurrency.mult) {
									totals[nxtCurrency.ix] = (totals[nxtCurrency.ix] || 0) + Math.floor(remainder / nxtCurrency.mult);
									remainder %= nxtCurrency.mult;
								}
							}
						}
					});
				}

				CURRENCY_INDEXED.forEach(c => {
					const it = totals[c.ix] || 0;
					const itExtra = extras[c.ix] || 0;
					if (it || itExtra) {
						const val = it + itExtra;
						totalWeight += val * COIN_WEIGHT;
						outParts.push(`${val.toLocaleStringVe()} ${c.abbv}`);
					}
				});
			} else {
				let total = 0;
				elesRows.forEach((ele) => {
					const strVal = (ele.find(`input`).val() || "").trim();
					if (strVal) {
						const asNum = Number(strVal);
						if (isNaN(asNum)) ele.addClass("form-control--error");
						else {
							total += asNum * (CURRENCY[ele.find(`select`).val()] || CURRENCY).mult;
						}
					}
				});

				const totalSplit = Math.floor(total / split);

				const toCurrencies = CURRENCY_INDEXED.filter(it => !this._disabledCurrency[it.ix] && it.ix <= outCurrency);
				let copper = totalSplit;
				toCurrencies.forEach(c => {
					if (copper >= c.mult) {
						const remainder = copper % c.mult;
						const theseCoins = Math.floor(copper / c.mult);
						totalWeight += COIN_WEIGHT * theseCoins;
						copper = remainder;
						outParts.push(`${theseCoins.toLocaleStringVe()} ${c.abbv}`);
					}
				});
			}

			iptOut.val(`${outParts.join("; ")}${totalWeight ? ` (${totalWeight.toLocaleStringVe()} lb.)` : ""}`);

			board.doSaveStateDebounced();
		};

		const buildCurrencySelect = (isOutput) => ee`<select class="ve-form-control ve-input-sm ve-p-2">${isOutput ? `<option value="-1">(No conversion)</option>` : ""}${CURRENCY.map((c, i) => `<option value="${i}">${c.n}</option>`).join("")}</select>`;

		const addRow = (currency, count) => {
			const eleRow = ee`<div class="dm-money__row"></div>`.appendTo(this._wrpRows);
			const iptCount = ee`<input type="number" step="1" placeholder="Coins" class="ve-form-control ve-input-sm">`.appendTo(eleRow).onn("change", doUpdate);
			if (count != null) iptCount.val(count);
			const selCurrency = buildCurrencySelect()
				.val(currency == null ? `${DEFAULT_CURRENCY}` : currency)
				.appendTo(eleRow)
				.onn("change", doUpdate);
			const btnRemove = ee`<button class="ve-btn ve-btn-sm ve-btn-danger" title="Remove Row"><span class="glyphicon glyphicon-trash"></span></button>`
				.appendTo(eleRow)
				.onn("click", () => {
					eleRow.remove();
					doUpdate();
				});
		};

		this._wrpRows = ee`<div class="dm-money__rows"></div>`.appendTo(wrpConverter);

		const wrpCtrl = ee`<div class="ve-split dm-money__ctrl"></div>`.appendTo(wrpConverter);
		const wrpCtrlLhs = ee`<div class="dm-money__ctrl__lhs ve-split-child" style="width: 66%;"></div>`.appendTo(wrpCtrl);
		const wrpBtnAddSettings = ee`<div class="ve-split"></div>`.appendTo(wrpCtrlLhs);
		const btnAddRow = ee`<button class="ve-btn ve-btn-primary ve-btn-sm" title="Add Row"><span class="glyphicon glyphicon-plus"></span></button>`
			.appendTo(wrpBtnAddSettings)
			.onn("click", () => {
				addRow();
				doUpdate();
			});
		const btnSettings = ee`<button class="ve-btn ve-btn-default ve-btn-sm" title="Settings"><span class="glyphicon glyphicon-cog"></span></button>`
			.appendTo(wrpBtnAddSettings)
			.onn("click", () => {
				const {eleModalInner} = UiUtil.getShowModal({
					title: "Settings",
					cbClose: () => doUpdate(),
				});
				[...CURRENCY_INDEXED].reverse().forEach(cx => {
					UiUtil.getAddModalRowCb(eleModalInner, `Disable ${cx.n} in Output`, this._disabledCurrency, cx.ix);
				});
			});
		const iptOut = ee`<input class="ve-form-control ve-input-sm dm-money__out" disabled/>`
			.appendTo(wrpCtrlLhs)
			.onn("mousedown", async () => {
				await MiscUtil.pCopyTextToClipboard(iptOut.val());
				JqueryUtil.showCopiedEffect(iptOut);
			});

		const wrpCtrlRhs = ee`<div class="dm-money__ctrl__rhs ve-split-child" style="width: 33%;"></div>`.appendTo(wrpCtrl);
		this._iptSplit = ee`<input type="number" min="1" step="1" placeholder="Split Between..." class="ve-form-control ve-input-sm">`.appendTo(wrpCtrlRhs).onn("change", doUpdate);
		this._selOut = buildCurrencySelect(true)
			.val(`${DEFAULT_CURRENCY}`)
			.appendTo(wrpCtrlRhs)
			.onn("change", doUpdate);

		if (state) {
			this._selOut.val(state.c == null ? `${DEFAULT_CURRENCY}` : state.c);
			this._iptSplit.val(state.s);
			(state.r || []).forEach(r => addRow(r.c, r.n));
		}

		doUpdate();

		return wrpConverter;
	}

	getState () {
		return {
			c: this._selOut.val(),
			s: this._iptSplit.val(),
			r: this._wrpRows.findAll(`.dm-money__row`)
				.map((ele) => {
					return {
						c: ele.find(`select`).val(),
						n: ele.find(`input`).val(),
					};
				}),
			d: this._disabledCurrency,
		};
	}
}
