import {ModalFilterRenderDemo} from "./filter-renderdemo.js";
import {RenderDemoValidator} from "./renderdemo/renderdemo-validator.js";

export class RenderDemoPage extends BaseComponent {
	static _STORAGE_LOCATION_STATE = "demoState";

	constructor () {
		super();

		this._dispErrors = null;
		this._eleOut = null;

		this._renderer = null;
		this._editor = null;

		this._data = [];
		this._modalFilterSamples = null;
	}

	_getSelectedSample () {
		return this._data.find(ent => UrlUtil.getHashBuilder("renderdemo")(ent) === this._state.hashSample) || this._data[0];
	}

	/* -------------------------------------------- */

	_doShowJsonParseError (e) {
		const msg = (e.message || "").replace(/^SyntaxError:\s*/, "");

		this._dispErrors
			.vee.show()
			.vee.html(`Invalid JSON:<br><span class="ve-code">${msg}</span>`);
		this._eleOut.vee.hide();
	}

	/* ----- */

	_doRender () {
		this._dispErrors.vee.hide().vee.html("");

		let json;
		try {
			json = JSON.parse(this._editor.getValue());
		} catch (e) {
			return this._doShowJsonParseError(e);
		}

		const renderStack = [];
		this._renderer.setFirstSection(true);
		this._renderer.resetHeaderIndex();
		this._renderer.recursiveRender(json, renderStack);
		this._eleOut
			.vee.show()
			.vee.html(`
				<tr><th class="ve-tbl-border" colspan="6"></th></tr>
				<tr><td colspan="6">${renderStack.join("")}</td></tr>
				<tr><th class="ve-tbl-border" colspan="6"></th></tr>
			`);
	}

	_doFormat () {
		let json;
		try {
			json = JSON.parse(this._editor.getValue());
		} catch (e) {
			return this._doShowJsonParseError(e);
		}

		this._editor.setValue(CleanUtil.getCleanJson(json));
		this._editor.clearSelection();
		this._doRender();
		this._editor.selection.moveCursorToPosition({row: 0, column: 0});
	}

	_doReset () {
		this._editor.setValue(CleanUtil.getCleanJson(this._getSelectedSample().entry));
		this._editor.clearSelection();
		this._doRender();
		this._editor.selection.moveCursorToPosition({row: 0, column: 0});
	}

	async _pDoLoadSample () {
		const [selected] = await this._modalFilterSamples.pGetUserSelection();
		if (!selected) return;

		this._state.hashSample = UrlUtil.getHashBuilder("renderdemo")(selected.data.entity);
	}

	/* -------------------------------------------- */

	async pOnLoad () {
		await Promise.all([
			PrereleaseUtil.pInit(),
			BrewUtil2.pInit(),
		]);
		ExcludeUtil.pInitialise().then(null); // don't await, as this is only used for search

		this._data = (
			await Promise.all([
				DataLoader.pCacheAndGetAllSite("renderdemo"),
				DataLoader.pCacheAndGetAllPrerelease("renderdemo"),
				DataLoader.pCacheAndGetAllBrew("renderdemo"),
			])
		)
			.flat()
			.sort(SortUtil.ascSortGenericEntity.bind(SortUtil));

		const savedState = await StorageUtil.pGetForPage(this.constructor._STORAGE_LOCATION_STATE);
		if (savedState) this.setStateFrom(savedState);

		this._state.hashSample = UrlUtil.getHashBuilder("renderdemo")(this._getSelectedSample());

		await this._pInitUi();
	}

	/* ----- */

	_getInitElements () {
		this._dispErrors = veEs(`#disp-errors`);
		this._eleOut = veEs(`#pagecontent`);

		const wrpSettings = veEs("#wrp-settings");
		const btnFormat = veEs(`#btn-format`);
		const wrpSelRenderer = veEs(`#wrp-sel-renderer`);

		return {
			wrpSettings,
			btnFormat,
			wrpSelRenderer,
		};
	}

	async _pInitUi () {
		const {
			wrpSettings,
			btnFormat,
			wrpSelRenderer,
		} = this._getInitElements();

		const RENDER_MODE_DISPLAY = {
			html: "HTML",
			md: "Markdown",
			cards: "RPG Cards",
		};

		const selRenderer = ComponentUiUtil.getSelEnum(this, "renderer", {
			html: `<select class="ve-form-control ve-input-xs ve-w-200p"></select>`,
			values: ["html", "md", "cards"],
			fnDisplay: mode => RENDER_MODE_DISPLAY[mode],
		})
			.vee.appendTo(wrpSelRenderer);
		this._addHookBase("renderer", () => {
			switch (this._state.renderer) {
				case "html": {
					this._renderer = Renderer.get();
					this._eleOut.vee.removeClass("ve-whitespace-pre").vee.removeClass("ve-code");
					break;
				}
				case "md": {
					this._renderer = RendererMarkdown.get();
					this._eleOut.vee.addClass("ve-whitespace-pre").vee.addClass("ve-code");
					break;
				}
				case "cards": {
					this._renderer = RendererCard.get();
					this._eleOut.vee.addClass("ve-whitespace-pre").vee.addClass("ve-code");
					break;
				}
				default: throw new Error(`Unhandled renderer!`);
			}
		})();

		btnFormat.vee.onn("click", () => this._doFormat());

		// init editor
		this._editor = await EditorUtil.pInitEditor("jsoninput", {mode: "ace/mode/json"});
		(
			new ResizeObserver(() => this._editor.resize())
		)
			.observe(this._editor.container);

		this._modalFilterSamples = new ModalFilterRenderDemo({allData: this._data});
		const btnLoadSample = veT`<button class="ve-btn ve-btn-default ve-btn-xs">Load Sample</button>`
			.vee.onn("click", () => this._pDoLoadSample());
		const btnReset = veT`<button class="ve-btn ve-btn-default ve-btn-xs" title="Reset" aria-label="Reset"><span class="glyphicon glyphicon-repeat"></span></button>`
			.vee.onn("click", () => this._doReset());

		const dispSampleName = veT`<span class="ve-muted ve-italic ve-ml-2 ve-flex-v-center"></span>`;
		this._addHookBase("hashSample", () => dispSampleName.vee.txt(`Last loaded: "${this._getSelectedSample().name}"`))();

		veT`<div class="ve-flex-v-center">
			<div class="ve-btn-group ve-flex-v-center">${btnLoadSample}${btnReset}</div>
			${dispSampleName}
		</div>`
			.vee.appendTo(wrpSettings);

		try {
			if (this._state.jsonInput != null) {
				this._editor.setValue(this._state.jsonInput, -1);
				this._doRender();
			} else this._doReset();
		} catch (ignored) {
			setTimeout(() => { throw ignored; });
			this._doReset();
		}

		// N.B. specific "change" format required by Ace.js
		this._editor.on("change", () => this._state.jsonInput = this._editor.getValue());

		this._addHookBase("hashSample", () => this._doReset());
		this._addHookBase("renderer", () => this._doRender())();

		const renderAndSaveDebounced = MiscUtil.debounce(() => {
			this._doRender();
			StorageUtil.pSetForPage(this.constructor._STORAGE_LOCATION_STATE, this.getSaveableState());
		}, VeCt.DUR_DEBOUNCE_SAVE);
		this._addHookAllBase(() => renderAndSaveDebounced());

		try {
			await RenderDemoValidator.pInit({editor: this._editor});
		} catch (e) {
			setTimeout(() => { throw e; });
			JqueryUtil.doToast({content: `JSON validation is unavailable! ${VeCt.STR_SEE_CONSOLE}`, type: "warning"});
		}

		window.dispatchEvent(new Event("toolsLoaded"));
	}

	_getDefaultState () {
		return {
			jsonInput: null,
			hashSample: null,
			renderer: "html",
		};
	}
}

const renderDemoPage = new RenderDemoPage();
window.addEventListener("load", () => renderDemoPage.pOnLoad());

globalThis.dbg_page = renderDemoPage;
