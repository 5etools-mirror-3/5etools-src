class RenderDemoPage {
	static _JSON_URL = "data/renderdemo.json";

	static _STORAGE_LOCATION_INPUT = "demoInput";
	static _STORAGE_LOCATION_RENDERER = "renderer";

	constructor () {
		this._eleMsg = null;
		this._eleOut = null;

		this._renderer = null;
		this._editor = null;

		this._jsonDefault = null;
	}

	/* -------------------------------------------- */

	_setRenderer (rendererType) {
		switch (rendererType) {
			case "html": {
				this._renderer = Renderer.get();
				this._eleOut.removeClass("ve-whitespace-pre").removeClass("ve-code");
				break;
			}
			case "md": {
				this._renderer = RendererMarkdown.get();
				this._eleOut.addClass("ve-whitespace-pre").addClass("ve-code");
				break;
			}
			case "cards": {
				this._renderer = RendererCard.get();
				this._eleOut.addClass("ve-whitespace-pre").addClass("ve-code");
				break;
			}
			default: throw new Error(`Unhandled renderer!`);
		}
	}

	_doRender () {
		this._eleMsg.hideVe().html("");
		const renderStack = [];
		let json;
		try {
			json = JSON.parse(this._editor.getValue());
		} catch (e) {
			this._eleMsg.showVe().html(`Invalid JSON! We recommend using <a href="https://jsonlint.com/" target="_blank" rel="noopener noreferrer">JSONLint</a>.`);
			setTimeout(() => { throw e; });
		}

		this._renderer.setFirstSection(true);
		this._renderer.resetHeaderIndex();
		this._renderer.recursiveRender(json, renderStack);
		this._eleOut.html(`
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
			this._eleMsg.showVe().html(`Invalid JSON! We recommend using <a href="https://jsonlint.com/" target="_blank" rel="noopener noreferrer">JSONLint</a>.`);
			setTimeout(() => { throw e; });
			return;
		}

		this._editor.setValue(CleanUtil.getCleanJson(json));
		this._editor.clearSelection();
		this._doRender();
		this._editor.selection.moveCursorToPosition({row: 0, column: 0});
	}

	_doReset () {
		this._editor.setValue(CleanUtil.getCleanJson(this._jsonDefault));
		this._editor.clearSelection();
		this._doRender();
		this._editor.selection.moveCursorToPosition({row: 0, column: 0});
	}

	/* -------------------------------------------- */

	async pOnLoad () {
		await Promise.all([
			PrereleaseUtil.pInit(),
			BrewUtil2.pInit(),
		]);
		ExcludeUtil.pInitialise().then(null); // don't await, as this is only used for search
		PrereleaseUtil.pGetBrewProcessed().then(null); // don't await, as this is only used for tags
		BrewUtil2.pGetBrewProcessed().then(null); // don't await, as this is only used for tags

		const data = await DataUtil.loadJSON(this.constructor._JSON_URL);
		this._jsonDefault = data.data[0];
		delete this._jsonDefault.__prop;

		await this._pInitUi();
	}

	_getInitElements () {
		this._eleMsg = es(`#message`);
		this._eleOut = es(`#pagecontent`);

		const btnFormat = es(`#btn-format`);
		const selRenderer = es(`#sel-renderer`);
		const btnRender = es(`#btn-render`);
		const btnReset = es(`#btn-reset`);

		return {
			btnFormat,
			selRenderer,
			btnRender,
			btnReset,
		};
	}

	async _pInitUi () {
		const {
			btnFormat,
			selRenderer,
			btnRender,
			btnReset,
		} = this._getInitElements();

		const rendererType = await StorageUtil.pGetForPage(this.constructor._STORAGE_LOCATION_RENDERER) || "html";

		this._setRenderer(rendererType);
		selRenderer.val(rendererType);

		// init editor
		this._editor = await EditorUtil.pInitEditor("jsoninput", {mode: "ace/mode/json"});

		try {
			const prevInput = await StorageUtil.pGetForPage(this.constructor._STORAGE_LOCATION_INPUT);
			if (prevInput) {
				this._editor.setValue(prevInput, -1);
				this._doRender();
			} else this._doReset();
		} catch (ignored) {
			setTimeout(() => { throw ignored; });
			this._doReset();
		}

		const renderAndSaveDebounced = MiscUtil.debounce(() => {
			this._doRender();
			StorageUtil.pSetForPage(this.constructor._STORAGE_LOCATION_INPUT, this._editor.getValue());
		}, VeCt.DUR_DEBOUNCE_SAVE);

		btnFormat.onn("click", () => this._doFormat());
		selRenderer.onn("change", () => {
			const val = selRenderer.val();
			this._setRenderer(val);
			this._doRender();
			StorageUtil.pSetForPage(this.constructor._STORAGE_LOCATION_RENDERER, val);
		});
		btnReset.onn("click", () => this._doReset());
		btnRender.onn("click", () => this._doRender());
		this._editor.on("change", () => renderAndSaveDebounced()); // N.B. specific "change" format required by Ace.js

		window.dispatchEvent(new Event("toolsLoaded"));
	}
}

const renderDemoPage = new RenderDemoPage();
window.addEventListener("load", () => renderDemoPage.pOnLoad());

globalThis.dbg_page = renderDemoPage;
