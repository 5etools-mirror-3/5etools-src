import {ConverterUiUtil} from "./converter-ui-utils.js";
import {VetoolsConfig} from "../utils-config/utils-config-config.js";
import {SITE_STYLE__CLASSIC, SITE_STYLE__ONE, SITE_STYLE_DISPLAY} from "../consts.js";

export class ConverterUiBase extends BaseComponent {
	static _getDisplayMode (mode) {
		switch (mode) {
			case "html": return "HTML";
			case "md": return "Markdown";
			case "txt": return "Text";
			default: throw new Error(`Unimplemented!`);
		}
	}

	/**
	 * @param ui Converter UI instance.
	 * @param opts Options object.
	 * @param opts.name Converter name.
	 * @param opts.converterId Converter unique ID.
	 * @param [opts.canSaveLocal] If the output of this converter is suitable for saving to local homebrew.
	 * @param opts.modes Available converter parsing modes (e.g. "txt", "html", "md")
	 * @param [opts.hasPageNumbers] If the entity has page numbers.
	 * @param [opts.titleCaseFields] Array of fields to be (optionally) title-cased.
	 * @param [opts.hasSource] If the output entities can have a source field.
	 * @param opts.prop The data prop for the output entity.
	 */
	constructor (ui, opts) {
		super();
		this._ui = ui;

		this._name = opts.name;
		this._converterId = opts.converterId;
		this._canSaveLocal = !!opts.canSaveLocal;
		this._modes = opts.modes;
		this._hasPageNumbers = opts.hasPageNumbers;
		this._titleCaseFields = opts.titleCaseFields;
		this._hasSource = opts.hasSource;
		this._prop = opts.prop;

		this._proxyAssignSimple("state", this._getDefaultStateLate(), true);

		this._addHookAll("state", this._ui.saveSettingsDebounced);
	}

	get name () { return this._name; }
	get converterId () { return this._converterId; }
	get canSaveLocal () { return this._canSaveLocal; }
	get prop () { return this._prop; }

	get source () { return this._hasSource ? this._state.source : null; }
	set source (val) {
		if (!this._hasSource) return;
		this._state.source = val;
	}

	get page () { return this._state.page; }
	set page (val) { this._state.page = val; }

	get mode () { return this._state.mode; }

	/* -------------------------------------------- */

	_renderSidebar () { throw new Error("Unimplemented!"); }
	handleParse () { throw new Error("Unimplemented!"); }
	_getSample () { throw new Error("Unimplemented!"); }

	/* -------------------------------------------- */

	setBaseSaveableStateFrom (savedState, ...rest) {
		// Validate state
		if (savedState?.state) {
			if (!SITE_STYLE_DISPLAY[savedState.state.styleHint]) savedState.state.styleHint = SITE_STYLE__CLASSIC;
		}

		return super.setBaseSaveableStateFrom(savedState, ...rest);
	}

	/* -------------------------------------------- */

	renderSidebar (parent, $parent) {
		const $wrpSidebar = $(`<div class="w-100 ve-flex-col"></div>`).appendTo($parent);
		const hkShowSidebar = () => $wrpSidebar.toggleClass("hidden", parent.get("converter") !== this._converterId);
		parent.addHook("converter", hkShowSidebar);
		hkShowSidebar();

		this._renderSidebar(parent, $wrpSidebar);
		this._renderSidebarSamplesPart(parent, $wrpSidebar);
		this._renderSidebarConverterOptionsPart(parent, $wrpSidebar);
		this._renderSidebarPagePart(parent, $wrpSidebar);
		this._renderSidebarSourcePart(parent, $wrpSidebar);
		this._renderSidebarStyleHintPart(parent, $wrpSidebar);
	}

	/* -------------------------------------------- */

	_handleParse_getOpts ({cbOutput, cbWarning, isAppend}) {
		const opts = {
			cbWarning,
			cbOutput,
			isAppend,

			titleCaseFields: this._titleCaseFields,

			styleHint: this._state.styleHint,

			isTitleCase: this._state.isTitleCase,
			source: this._state.source,
			page: this._state.page,
		};

		if (this._titleCaseFields) opts.isTitleCase = this._state.isTitleCase;
		if (this._hasSource) opts.page = this._state.source;
		if (this._hasPageNumbers) opts.page = this._state.page;

		return opts;
	}

	/* -------------------------------------------- */

	_renderSidebarSamplesPart (parent, $wrpSidebar) {
		const $btnsSamples = this._modes.map(mode => {
			return $(`<button class="ve-btn ve-btn-xs ve-btn-default">Sample ${ConverterUiBase._getDisplayMode(mode)}</button>`)
				.click(() => {
					this._ui.inText = this._getSample(mode);
					this._state.mode = mode;
				});
		});

		$$`<div class="w-100 ve-flex-vh-center-around">${$btnsSamples}</div>`.appendTo($wrpSidebar);

		ConverterUiUtil.renderSideMenuDivider($wrpSidebar);
	}

	_renderSidebarConverterOptionsPart (parent, $wrpSidebar) {
		const hasModes = this._modes.length > 1;

		if (!hasModes && !this._titleCaseFields) return;

		const hkMode = () => {
			this._ui._editorIn.setOptions({
				mode: ConverterUiUtil.getAceMode(this._state.mode),
			});
		};
		this._addHookBase("mode", hkMode);
		hkMode();

		if (hasModes) {
			const $selMode = ComponentUiUtil.$getSelEnum(this, "mode", {values: this._modes, html: `<select class="form-control input-xs select-inline"></select>`, fnDisplay: it => `Parse as ${ConverterUiBase._getDisplayMode(it)}`});
			$$`<div class="w-100 mt-2 ve-flex-vh-center-around">${$selMode}</div>`.appendTo($wrpSidebar);
		}

		if (this._titleCaseFields) {
			const $cbTitleCase = ComponentUiUtil.$getCbBool(this, "isTitleCase");
			$$`<div class="w-100 mt-2 split-v-center">
				<label class="sidemenu__row__label sidemenu__row__label--cb-label" title="Should the creature's name be converted to title-case? Useful when pasting a name which is all-caps."><span>Title-Case Name</span>
				${$cbTitleCase}
			</label></div>`.appendTo($wrpSidebar);
		}
		ConverterUiUtil.renderSideMenuDivider($wrpSidebar);
	}

	_renderSidebarPagePart (parent, $wrpSidebar) {
		if (!this._hasPageNumbers) return;

		const getBtnIncrementDecrement = (dir) => {
			const verb = ~dir ? "Increment" : "Decrement";
			return $(`<button class="ve-btn ve-btn-xs ve-btn-default h-100" title="${verb} Page Number (SHIFT to ${verb} by 5)"><span class="glyphicon glyphicon-${~dir ? "plus" : "minus"}"></span></button>`)
				.on("click", evt => this._state.page += dir * (evt.shiftKey ? 5 : 1));
		};

		const $iptPage = ComponentUiUtil.$getIptInt(this, "page", 0)
			.addClass("max-w-80p");
		$$`<div class="w-100 split-v-center">
			<div class="sidemenu__row__label mr-2 help" title="Note that a line of the form &quot;PAGE=&lt;page number&gt;&quot; in the Input will set the page in the Output, ignoring any value set here. This is especially useful when parsing multiple inputs delimited by a separator.">Page</div>
			<div class="ve-btn-group input-group ve-flex-v-center h-100">
				${getBtnIncrementDecrement(-1)}
				${$iptPage}
				${getBtnIncrementDecrement(1)}
			</div>
		</div>`.appendTo($wrpSidebar);

		ConverterUiUtil.renderSideMenuDivider($wrpSidebar);
	}

	_renderSidebarSourcePart (parent, $wrpSidebar) {
		if (!this._hasSource) return;

		const $wrpSourceOverlay = $(`<div class="h-100 w-100"></div>`);
		let modalMeta = null;

		const rebuildStageSource = (options) => {
			SourceUiUtil.render({
				...options,
				$parent: $wrpSourceOverlay,
				cbConfirm: async (source) => {
					const isNewSource = options.mode !== "edit";

					if (isNewSource) await BrewUtil2.pAddSource(source);
					else await BrewUtil2.pEditSource(source);

					if (isNewSource) parent.doRefreshAvailableSources();
					this._state.source = source.json;

					if (modalMeta) modalMeta.doClose();
				},
				cbConfirmExisting: (source) => {
					this._state.source = source.json;

					if (modalMeta) modalMeta.doClose();
				},
				cbCancel: () => {
					if (modalMeta) modalMeta.doClose();
				},
			});
		};

		const $selSource = $$`
			<select class="form-control input-xs"><option value="">(None)</option></select>`
			.change(() => this._state.source = $selSource.val());

		$(`<option></option>`, {val: "5e_divider", text: `\u2014`, disabled: true}).appendTo($selSource);

		Object.keys(Parser.SOURCE_JSON_TO_FULL)
			.forEach(src => $(`<option></option>`, {val: src, text: Parser.sourceJsonToFull(src)}).appendTo($selSource));

		const hkAvailSources = () => {
			const curSources = new Set($selSource.find(`option`).map((i, e) => $(e).val()));
			curSources.add("");
			const nxtSources = new Set(parent.get("availableSources"));
			nxtSources.add("");
			nxtSources.add("5e_divider");
			Object.keys(Parser.SOURCE_JSON_TO_FULL).forEach(it => nxtSources.add(it));

			const optionsToAdd = [];

			parent.get("availableSources").forEach(source => {
				nxtSources.add(source);
				if (!curSources.has(source)) {
					optionsToAdd.push(source);
				}
			});

			if (optionsToAdd.length) {
				const $optBrewLast = $selSource.find(`option[disabled]`).prev();
				optionsToAdd.forEach(source => {
					const fullSource = BrewUtil2.sourceJsonToSource(source);
					$(`<option></option>`, {val: fullSource.json, text: fullSource.full}).insertAfter($optBrewLast);
				});
			}

			const toDelete = curSources.difference(nxtSources);
			if (toDelete.size) $selSource.find(`option`).filter((i, e) => toDelete.has($(e).val())).remove();
		};
		parent.addHook("availableSources", hkAvailSources);
		hkAvailSources();

		const hkSource = () => $selSource.val(this._state.source);
		this._addHookBase("source", hkSource);
		hkSource();

		$$`<div class="w-100 mb-2 split-v-center"><div class="sidemenu__row__label mr-2">Source</div>${$selSource}</div>`.appendTo($wrpSidebar);

		const $btnSourceEdit = $(`<button class="ve-btn ve-btn-default ve-btn-xs">Edit Selected</button>`)
			.click(() => {
				const curSourceJson = this._state.source;
				if (!curSourceJson) {
					JqueryUtil.doToast({type: "warning", content: "No source selected!"});
					return;
				}

				const curSource = BrewUtil2.sourceJsonToSource(curSourceJson);
				if (!curSource) return;
				rebuildStageSource({mode: "edit", source: MiscUtil.copy(curSource)});
				modalMeta = UiUtil.getShowModal({
					isHeight100: true,
					isUncappedHeight: true,
					cbClose: () => $wrpSourceOverlay.detach(),
				});
				$wrpSourceOverlay.appendTo(modalMeta.$modalInner);
			});

		const $btnSourceAdd = $(`<button class="ve-btn ve-btn-default ve-btn-xs">Add New</button>`).click(() => {
			rebuildStageSource({mode: "add"});
			modalMeta = UiUtil.getShowModal({
				isHeight100: true,
				isUncappedHeight: true,
				cbClose: () => $wrpSourceOverlay.detach(),
			});
			$wrpSourceOverlay.appendTo(modalMeta.$modalInner);
		});
		$$`<div class="w-100 ve-btn-group ve-flex-v-center ve-flex-h-right">${$btnSourceEdit}${$btnSourceAdd}</div>`.appendTo($wrpSidebar);

		ConverterUiUtil.renderSideMenuDivider($wrpSidebar);
	}

	_renderSidebarStyleHintPart (parent, $wrpSidebar) {
		const selStyleHint = ComponentUiUtil.getSelEnum(
			this,
			"styleHint",
			{
				values: [
					SITE_STYLE__CLASSIC,
					SITE_STYLE__ONE,
				],
				fnDisplay: val => SITE_STYLE_DISPLAY[val],
			},
		);

		$$`<div class="w-100 mb-2 split-v-center"><div class="sidemenu__row__label mr-2">Style</div>${selStyleHint}</div>`.appendTo($wrpSidebar);

		ConverterUiUtil.renderSideMenuDivider($wrpSidebar);
	}

	/* -------------------------------------------- */

	renderFooterLhs (parent, {$wrpFooterLhs}) {
		if (!this._hasPageNumbers) return;

		const $dispPage = $(`<div class="ve-muted italic" title="Use &quot;+&quot; and &quot;-&quot; (when the cursor is not in a text input) to increase/decrease."></div>`)
			.appendTo($wrpFooterLhs);

		this._addHookBase("page", () => {
			$dispPage.html(this._state.page != null ? `<b class="mr-1">Page:</b> ${this._state.page}` : "");
		})();

		parent.addHook("converter", () => $dispPage.toggleClass("ve-hidden", parent.get("converter") !== this._converterId))();
	}

	/* -------------------------------------------- */

	_getDefaultStateLate () {
		const out = {
			mode: this._modes[0],
			styleHint: VetoolsConfig.get("styleSwitcher", "style"),
		};

		if (this._hasPageNumbers) out.page = 0;
		if (this._titleCaseFields) out.isTitleCase = false;
		if (this._hasSource) out.source = "";

		return out;
	}
}
