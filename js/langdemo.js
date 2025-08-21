"use strict";

import {Ro_Lexer, Ro_Parser, Ro_Lang} from "./rolang.js";

class LangDemoUi {
	static init () {
		es(`#btn__run`).onn("click", () => LangDemoUi.pRun());
		es(`#btn__validate`).onn("click", async () => {
			const msg = await Ro_Lang.pValidate(LangDemoUi._ipt.val(), LangDemoUi.RESOLVER);
			LangDemoUi._handleInvalidMessage(msg);
		});
		es(`#btn__resolve_dynamics`).onn("click", async () => {
			const val = await Ro_Lang.pResolveDynamics(LangDemoUi._ipt.val(), LangDemoUi.RESOLVER);
			LangDemoUi._ipt.val(val);
		});
		es(`#btn__validate_dynamics`).onn("click", async () => {
			const msg = await Ro_Lang.pValidateDynamics(LangDemoUi._ipt.val(), LangDemoUi.RESOLVER);
			LangDemoUi._handleInvalidMessage(msg);
		});

		// region select sample
		const selSample = es(`#sel__sample`);
		LangDemoUi._SAMPLES.forEach((it, i) => {
			selSample.appends(`<option value="${i}">${it.name}</option>`);
		});
		selSample.onn("change", () => {
			const sample = LangDemoUi._SAMPLES[selSample.val()];
			LangDemoUi._ipt.val(sample.code).trigger("change");
		});
		selSample.val("-1");
		// endregion

		// region input
		LangDemoUi._ipt = es(`#ipt`);
		LangDemoUi._ipt.onn("change", () => {
			StorageUtil.syncSetForPage("input", LangDemoUi._ipt.val());
		});
		const prevInput = StorageUtil.syncGetForPage("input");
		if (prevInput && prevInput.trim()) LangDemoUi._ipt.val(prevInput.trim());
		// endregion

		// region context
		const saveContext = () => {
			const toSave = LangDemoUi._metasContext.map(it => ({name: it.iptName.val(), val: it.iptVal.val()}));
			StorageUtil.syncSetForPage("context", toSave);
		};

		const loadContext = () => {
			const loaded = StorageUtil.syncGetForPage("context");
			if (loaded != null) {
				loaded.forEach(it => addContextRow(it.name, it.val));
			}
		};

		const addContextRow = (name, value) => {
			const iptName = ee`<input class="form-control form-control--minimal input-xs mr-2 code" placeholder="Identifier">`
				.onn("change", () => saveContext())
				.val(name);

			const iptVal = ee`<input class="form-control form-control--minimal input-xs mr-2 code" type="number" placeholder="Value">`
				.onn("change", () => saveContext())
				.val(value);

			const btnDel = ee`<button class="ve-btn ve-btn-xs ve-btn-danger" tabindex="-1"><span class="glyphicon glyphicon-trash"></span></button>`
				.onn("click", () => {
					const ix = LangDemoUi._metasContext.indexOf(out);
					if (~ix) {
						LangDemoUi._metasContext.splice(ix, 1);
						row.remove();
						saveContext();
					}
				});

			const out = {iptName, iptVal};
			LangDemoUi._metasContext.push(out);
			const row = ee`<div class="mb-2 ve-flex-v-center">${iptName}<span class="mr-2">=</span>${iptVal}${btnDel}</div>`.appendTo(LangDemoUi._wrpContext);
		};

		LangDemoUi._wrpContext = es(`#wrp_context`);
		const btnAdd = ee`<button class="ve-btn ve-btn-xs ve-btn-default">Add Context</button>`
			.onn("click", () => addContextRow());
		ee`<div class="mb-2 ve-flex-v-center">${btnAdd}</div>`.appendTo(LangDemoUi._wrpContext);

		loadContext();
		// endregion

		window.dispatchEvent(new Event("toolsLoaded"));
	}

	static _handleInvalidMessage (msg) {
		if (msg) JqueryUtil.doToast({content: `Invalid \u2014 ${msg}`, type: "danger"});
		else JqueryUtil.doToast({content: `Valid!`, type: "success"});
	}

	static async pRun () {
		const ipt = LangDemoUi._ipt.val().trim();

		// Check if valid, but continue execution regardless to ease debugging
		const invalidMsg = await Ro_Lang.pValidate(ipt, LangDemoUi.RESOLVER);
		if (invalidMsg) LangDemoUi._handleInvalidMessage(invalidMsg);

		const dispOutLexed = es(`#out_lexed`).html("");
		const dispOutParsed = es(`#out_parsed`).html("");
		const dispOutResult = es(`#out_result`).html("");

		const lexer = new Ro_Lexer();
		const lexed = lexer.lex(ipt);

		dispOutLexed.html(lexed.map(it => it ? it.toDebugString() : "").join("\n"));

		const parser = new Ro_Parser(lexed);
		const parsed = parser.parse();

		dispOutParsed.html(`${parsed}`);

		const ctx = LangDemoUi._metasContext
			.mergeMap(it => ({[it.iptName.val().trim()]: Number(it.iptVal.val()) || 0}));
		const result = await parsed.pEvl(ctx, LangDemoUi.RESOLVER);
		if (result.isCancelled) dispOutResult.txt("Cancelled!");
		else dispOutResult.txt(result.val == null ? `(null)` : result.val);
	}
}
LangDemoUi._ipt = null;
LangDemoUi._wrpContext = null;
LangDemoUi._metasContext = [];
LangDemoUi._SAMPLES = [
	{
		name: "Empty",
		code: `



`,
	},
	{
		name: "Number",
		code: `1`,
	},
	{
		name: "Sum",
		code: `1 + 1`,
	},
	{
		name: "Multiplication",
		code: `2 * 3`,
	},
	{
		name: "Exponent",
		code: `3^3^2  # Should equal 19683`,
	},
	{
		name: "If-elif-else",
		code: `if r == 20: 1
elif r > 1:
  2
else:
  3
4`,
	},
	{
		name: "If-elif",
		code: `if r == 20: 1
elif r > 1:
  2`,
	},
	{
		name: "If-else",
		code: `if r == 20: 1
else:
  2`,
	},
	{
		name: "If",
		code: `if r == 20: 1`,
	},
	{
		name: "If (trailing return)",
		code: `if r == 20: 1
2`,
	},
	{
		name: "Condition Negation",
		code: `if not r: 2`,
	},
	{
		name: "Parentheses",
		code: `(2 + 3) * 4  # Should equal 20`,
	},
	{
		name: "Dynamic Int",
		code: `if @user_int > 10: 2`,
	},
	{
		name: "Labelled Dynamic Int",
		code: `if (@user_int|Enter: a /*+-^,!= (Number)) > 10: 2`,
	},
	{
		name: "Selectable Dynamic Int",
		code: `if (@user_int|| 1 = One Apple| 2 = Two Bananas |3|4|11=11 Oranges) > 10: 2`,
	},
	{
		name: "Dynamic Bool",
		code: `if not @user_bool: 3`,
	},
	{
		name: "Labelled Dynamic Bool",
		code: `if not (@user_bool|Choose: /*+-^,!= (Yes\\No)): 4`,
	},
	{
		name: "Custom Buttons Dynamic Bool",
		code: `if (@user_bool||Good | Evil): 2`,
	},
	{
		name: "Selectable Dynamic Bool",
		code: `if not (@user_bool|Pick| true = Good| false = Evil |true|false|true=Lawful): 2`,
	},
];
LangDemoUi.RESOLVER = {
	has: () => true,
	get: (path) => {
		const out = Math.round(Math.random() * 50);
		JqueryUtil.doToast(`Randomized ${path} as ${out}`);
		return out;
	},
};

window.addEventListener("load", () => LangDemoUi.init());
