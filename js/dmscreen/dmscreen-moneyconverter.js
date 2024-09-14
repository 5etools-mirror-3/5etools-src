// a simple money converter, i.e.: input x electrum, y silver, z copper and get the total in gold, or in any other type of coin chosen.
export class MoneyConverter {
	static make$Converter (board, state) {
		const disabledCurrency = state.d || {};

		const COIN_WEIGHT = 0.02;
		const CURRENCY = [
			new MoneyConverterUnit("Copper", 1, "cp"),
			new MoneyConverterUnit("Silver", 10, "sp"),
			new MoneyConverterUnit("Electrum", 50, "ep"),
			new MoneyConverterUnit("Gold", 100, "gp"),
			new MoneyConverterUnit("Platinum", 1000, "pp"),
			new MoneyConverterUnit("Nib (WDH)", 1, "nib"),
			new MoneyConverterUnit("Shard (WDH)", 10, "shard"),
			new MoneyConverterUnit("Taol (WDH)", 200, "taol"),
			new MoneyConverterUnit("Dragon (WDH)", 100, "dgn"),
			new MoneyConverterUnit("Sun (WDH)", 1000, "sun"),
			new MoneyConverterUnit("Harbor Moon (WDH)", 5000, "moon"),
		];
		const CURRENCY_INDEXED = [...CURRENCY].map((it, i) => {
			it.ix = i;
			return it;
		}).reverse();
		const DEFAULT_CURRENCY = 3;

		const $wrpConverter = $(`<div class="dm_money dm__panel-bg split-column"></div>`);

		const doUpdate = () => {
			if (!$wrpRows.find(`.dm-money__row`).length) {
				addRow();
			}

			Object.entries(disabledCurrency).forEach(([currency, disabled]) => {
				$selOut.find(`option[value=${currency}]`).toggle(!disabled);
			});
			// if the current choice is disabled, deselect it, and restart
			if (disabledCurrency[$selOut.val()]) {
				$selOut.val("-1");
				doUpdate();
				return;
			}

			const $rows = $wrpRows.find(`.dm-money__row`)
				.removeClass("form-control--error");
			$iptSplit.removeClass("form-control--error");

			const outCurrency = Number($selOut.val()) || 0;

			const outParts = [];
			let totalWeight = 0;

			const splitBetweenStr = ($iptSplit.val() || "").trim();
			let split = 1;
			if (splitBetweenStr) {
				const splitBetweenNum = Number(splitBetweenStr);
				if (isNaN(splitBetweenNum)) $iptSplit.addClass("form-control--error");
				else split = splitBetweenNum;
			}

			if (outCurrency === -1) { // only split, don't convert
				const totals = [];
				const extras = [];
				const allowedCategories = new Set();

				$rows.each((i, e) => {
					const $e = $(e);
					const strVal = ($e.find(`input`).val() || "").trim();
					if (strVal) {
						const asNum = Number(strVal);
						if (isNaN(asNum)) $e.addClass("form-control--error");
						else {
							const ix = Number($e.find(`select`).val());
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
								if (disabledCurrency[nxtCurrency.ix]) continue;

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
						outParts.push(`${val.toLocaleString()} ${c.abbv}`);
					}
				});
			} else {
				let total = 0;
				$rows.each((i, e) => {
					const $e = $(e);
					const strVal = ($e.find(`input`).val() || "").trim();
					if (strVal) {
						const asNum = Number(strVal);
						if (isNaN(asNum)) $e.addClass("form-control--error");
						else {
							total += asNum * (CURRENCY[$e.find(`select`).val()] || CURRENCY[0]).mult;
						}
					}
				});

				const totalSplit = Math.floor(total / split);

				const toCurrencies = CURRENCY_INDEXED.filter(it => !disabledCurrency[it.ix] && it.ix <= outCurrency);
				let copper = totalSplit;
				toCurrencies.forEach(c => {
					if (copper >= c.mult) {
						const remainder = copper % c.mult;
						const theseCoins = Math.floor(copper / c.mult);
						totalWeight += COIN_WEIGHT * theseCoins;
						copper = remainder;
						outParts.push(`${theseCoins.toLocaleString()} ${c.abbv}`);
					}
				});
			}

			$iptOut.val(`${outParts.join("; ")}${totalWeight ? ` (${totalWeight.toLocaleString()} lb.)` : ""}`);

			board.doSaveStateDebounced();
		};

		const buildCurrency$Select = (isOutput) => $(`<select class="form-control input-sm" style="padding: 5px">${isOutput ? `<option value="-1">(No conversion)</option>` : ""}${CURRENCY.map((c, i) => `<option value="${i}">${c.n}</option>`).join("")}</select>`);

		const addRow = (currency, count) => {
			const $row = $(`<div class="dm-money__row"></div>`).appendTo($wrpRows);
			const $iptCount = $(`<input type="number" step="1" placeholder="Coins" class="form-control input-sm">`).appendTo($row).change(doUpdate);
			if (count != null) $iptCount.val(count);
			const $selCurrency = buildCurrency$Select().appendTo($row).change(doUpdate);
			$selCurrency.val(currency == null ? DEFAULT_CURRENCY : currency);
			const $btnRemove = $(`<button class="ve-btn ve-btn-sm ve-btn-danger" title="Remove Row"><span class="glyphicon glyphicon-trash"></span></button>`).appendTo($row).click(() => {
				$row.remove();
				doUpdate();
			});
		};

		const $wrpRows = $(`<div class="dm-money__rows"></div>`).appendTo($wrpConverter);

		const $wrpCtrl = $(`<div class="split dm-money__ctrl"></div>`).appendTo($wrpConverter);
		const $wrpCtrlLhs = $(`<div class="dm-money__ctrl__lhs split-child" style="width: 66%;"></div>`).appendTo($wrpCtrl);
		const $wrpBtnAddSettings = $(`<div class="split"></div>`).appendTo($wrpCtrlLhs);
		const $btnAddRow = $(`<button class="ve-btn ve-btn-primary ve-btn-sm" title="Add Row"><span class="glyphicon glyphicon-plus"></span></button>`)
			.appendTo($wrpBtnAddSettings)
			.click(() => {
				addRow();
				doUpdate();
			});
		const $btnSettings = $(`<button class="ve-btn ve-btn-default ve-btn-sm" title="Settings"><span class="glyphicon glyphicon-cog"></span></button>`)
			.appendTo($wrpBtnAddSettings)
			.click(() => {
				const {$modalInner} = UiUtil.getShowModal({
					title: "Settings",
					cbClose: () => doUpdate(),
				});
				[...CURRENCY_INDEXED].reverse().forEach(cx => {
					UiUtil.$getAddModalRowCb($modalInner, `Disable ${cx.n} in Output`, disabledCurrency, cx.ix);
				});
			});
		const $iptOut = $(`<input class="form-control input-sm dm-money__out" disabled/>`)
			.appendTo($wrpCtrlLhs)
			.mousedown(async () => {
				await MiscUtil.pCopyTextToClipboard($iptOut.val());
				JqueryUtil.showCopiedEffect($iptOut);
			});

		const $wrpCtrlRhs = $(`<div class="dm-money__ctrl__rhs split-child" style="width: 33%;"></div>`).appendTo($wrpCtrl);
		const $iptSplit = $(`<input type="number" min="1" step="1" placeholder="Split Between..." class="form-control input-sm">`).appendTo($wrpCtrlRhs).change(doUpdate);
		const $selOut = buildCurrency$Select(true).appendTo($wrpCtrlRhs).change(doUpdate);

		$wrpConverter.data("getState", () => {
			return {
				c: $selOut.val(),
				s: $iptSplit.val(),
				r: $wrpRows.find(`.dm-money__row`).map((i, e) => {
					const $e = $(e);
					return {
						c: $e.find(`select`).val(),
						n: $e.find(`input`).val(),
					};
				}).get(),
				d: disabledCurrency,
			};
		});

		if (state) {
			$selOut.val(state.c == null ? DEFAULT_CURRENCY : state.c);
			$iptSplit.val(state.s);
			(state.r || []).forEach(r => addRow(r.c, r.n));
		}

		doUpdate();

		return $wrpConverter;
	}
}

class MoneyConverterUnit {
	constructor (name, multiplier, abbreviation) {
		this.n = name;
		this.mult = multiplier;
		this.abbv = abbreviation;
	}
}
