import {ConverterUiUtil} from "./converter-ui-utils.js";
import {VetoolsConfig} from "../utils-config/utils-config-config.js";
import {SITE_STYLE__CLASSIC, SITE_STYLE__ONE, SITE_STYLE_DISPLAY} from "../consts.js";
import {SourceUiUtil} from "../utils-ui/utils-ui-sourcebuilder.js";

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
	constructor ({ui, converterData, ...opts}) {
		super();
		this._ui = ui;
		this._converterData = converterData;

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

	getHasPageNumbers () { return !!this._hasPageNumbers; }

	/* -------------------------------------------- */

	handleParse () { throw new Error("Unimplemented!"); }

	/* -------------------------------------------- */

	_getSample (format) {
		const ents = this._converterData.converterSample
			.filter(ent => ent.converterId === this._converterId && ent.format === format);
		if (ents.length <= 1) return ents[0].text;
		return ents.find(ent => ent.edition === this._state.styleHint)?.text || ents[0]?.text;
	}

	/* -------------------------------------------- */

	setBaseSaveableStateFrom (savedState, ...rest) {
		// Validate state
		if (savedState?.state) {
			if (!SITE_STYLE_DISPLAY[savedState.state.styleHint]) savedState.state.styleHint = SITE_STYLE__CLASSIC;
		}

		return super.setBaseSaveableStateFrom(savedState, ...rest);
	}

	/* -------------------------------------------- */

	renderSettings ({compParent, wrpSettings}) {
		this._renderSettings_source({compParent, wrpSettings});
		this._renderSettings_page({wrpSettings});

		const wrpModesSamples = ee`<div class="ve-btn-group ve-flex-v-center ve-mobile-md__mb-2">
			<div class="ve-vr-3 ve-mobile-md__hidden"></div>
		</div>`
			.appendTo(wrpSettings);
		this._renderSettings_modes({wrpModesSamples});
		this._renderSettings_samples({wrpModesSamples});
	}

	_renderSettings_source ({compParent, wrpSettings}) {
		if (!this._hasSource) return;

		const wrpSourceOverlay = ee`<div class="ve-h-100 ve-w-100"></div>`;
		let modalMeta = null;

		const rebuildStageSource = (options) => {
			SourceUiUtil.render({
				...options,
				eleParent: wrpSourceOverlay,
				cbConfirm: async (source) => {
					const isNewSource = options.mode !== "edit";

					if (isNewSource) await BrewUtil2.pAddSource(source);
					else await BrewUtil2.pEditSource(source);

					if (isNewSource) compParent.doRefreshAvailableSources();
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

		const selSource = ee`<select class="ve-form-control ve-input-xs ve-br-0 ve-w-120p"><option value="">(None)</option></select>`
			.onn("change", () => this._state.source = selSource.val());

		const optDivider = e_({tag: "option", val: "5e_divider", txt: `\u2014`, attrs: {disabled: true}}).appendTo(selSource);

		const srcToOption = Object.fromEntries(
			Object.keys(Parser.SOURCE_JSON_TO_FULL)
				.map(src => [src, e_({tag: "option", val: src, txt: Parser.sourceJsonToFull(src)}).appendTo(selSource)]),
		);

		compParent._addHookBase("availableSources", () => {
			const curSources = new Set(Object.keys(srcToOption));
			curSources.add("");
			const nxtSources = new Set(compParent._state.availableSources);
			nxtSources.add("");
			nxtSources.add("5e_divider");
			Object.keys(Parser.SOURCE_JSON_TO_FULL).forEach(it => nxtSources.add(it));

			const optionsToAdd = [];

			compParent._state.availableSources.forEach(source => {
				nxtSources.add(source);
				if (!curSources.has(source)) {
					optionsToAdd.push(source);
				}
			});

			if (optionsToAdd.length) {
				const optBrewLast = optDivider.prev();
				optionsToAdd.forEach(source => {
					const fullSource = BrewUtil2.sourceJsonToSource(source);
					srcToOption[source] = e_({tag: "option", val: fullSource.json, txt: fullSource.full}).insertAfter(optBrewLast);
				});
			}

			const toDelete = curSources.difference(nxtSources);
			if (toDelete.size) {
				toDelete.forEach(src => {
					srcToOption[src].remove();
					delete srcToOption[src];
				});
			}
		})();

		const btnSourceEdit = ee`<button class="ve-btn ve-btn-default ve-btn-xs" title="Edit Selected Source"><span class="glyphicon glyphicon-pencil"></span></button>`
			.onn("click", () => {
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
					cbClose: () => wrpSourceOverlay.detach(),
				});
				wrpSourceOverlay.appendTo(modalMeta.eleModalInner);
			});

		const btnSourceAdd = ee`<button class="ve-btn ve-btn-default ve-btn-xs" title="Add New Source"><span class="glyphicon glyphicon-plus"></span></button>`
			.onn("click", () => {
				rebuildStageSource({mode: "add"});
				modalMeta = UiUtil.getShowModal({
					isHeight100: true,
					isUncappedHeight: true,
					cbClose: () => wrpSourceOverlay.detach(),
				});
				wrpSourceOverlay.appendTo(modalMeta.eleModalInner);
			});

		ee`<div class="ve-flex-v-stretch ve-mobile-md__mb-2">
			<div class="ve-vr-3 ve-mr-2 ve-mobile-md__hidden"></div>
			
			<div class="ve-flex-v-stretch">
				<div class="ve-mr-2 ve-flex-v-center">Source</div>
				<div class="ve-flex-v-stretch ve-input-group ve-btn-group ve-mr-2">
					${selSource}
					${btnSourceEdit}
				</div>
				${btnSourceAdd}
			</div>
		</div>`
			.appendTo(wrpSettings);

		this._addHookBase("source", () => {
			selSource.val(this._state.source);
			btnSourceEdit.attr("disabled", !this._state.source || !BrewUtil2.sourceJsonToSource(this._state.source));
		})();
	}

	_renderSettings_page ({wrpSettings}) {
		if (!this._hasPageNumbers) return;

		const getBtnIncrementDecrement = (dir) => {
			const verb = ~dir ? "Increment" : "Decrement";
			const iconClassName = ~dir ? "glyphicon-plus" : "glyphicon-minus";
			return ee`<button class="ve-btn ve-btn-xs ve-btn-default" title="${verb} Page Number (SHIFT to ${verb} by 5)"><span class="glyphicon ${iconClassName}"></span></button>`
				.onn("click", evt => this._state.page += dir * (evt.shiftKey ? 5 : 1));
		};

		const iptPage = ComponentUiUtil.getIptInt(this, "page", 0)
			.addClass("ve-w-40p");
		ee`<div class="ve-flex-v-center ve-mobile-md__mb-2">
			<div class="ve-vr-3 ve-mobile-md__hidden"></div>

			<div class="ve-mr-2 ve-help" title="Note that a line of the form &quot;PAGE=&lt;page number&gt;&quot; in the Input will set the page in the Output, ignoring any value set here. This is especially useful when parsing multiple inputs delimited by a separator.">Page</div>
			<div class="ve-btn-group ve-input-group ve-flex-v-stretch">
				${getBtnIncrementDecrement(-1)}
				${iptPage}
				${getBtnIncrementDecrement(1)}
			</div>
		</div>`.appendTo(wrpSettings);
	}

	_renderSettings_modes ({wrpModesSamples}) {
		if (this._modes.length < 2) return;

		this._addHookBase("mode", () => {
			this._ui._editorIn.setOptions({
				mode: ConverterUiUtil.getAceMode(this._state.mode),
			});
		})();

		const selMode = ComponentUiUtil.getSelEnum(this, "mode", {values: this._modes, html: `<select class="ve-form-control ve-input-xs ve-min-w-140p"></select>`, fnDisplay: it => `Parse as ${ConverterUiBase._getDisplayMode(it)}`})
			.appendTo(wrpModesSamples);
	}

	_renderSettings_samples ({wrpModesSamples}) {
		const btnsSamples = this._modes.map(mode => {
			return ee`<button class="ve-btn ve-btn-xs ve-btn-default">Sample ${ConverterUiBase._getDisplayMode(mode)}</button>`
				.onn("click", () => {
					const sample = this._getSample(mode);
					if (!sample) {
						JqueryUtil.doToast({type: "warning", content: `No ${ConverterUiBase._getDisplayMode(mode)} sample available!`});
						return;
					}
					this._ui.inText = sample;
					this._state.mode = mode;
				});
		});

		ee`<div class="ve-btn-group ve-flex-v-stretch ve-ml-2">${btnsSamples}</div>`.appendTo(wrpModesSamples);
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

	renderSettingsModal ({compParent, eleParent}) {
		this._renderSettingsModal_converterOptions({eleParent});
		this._renderSettingsModal_styleHint({eleParent});
	}

	_renderSettingsModal_converterOptions ({eleParent}) {
		if (!this._titleCaseFields) return;

		const cbTitleCase = ComponentUiUtil.getCbBool(this, "isTitleCase");

		ee`<div class="ve-flex-col">
			<label class="ve-split-v-center ve-w-100" title="Should the entity's name be converted to title-case? Useful when pasting a name which is all-caps.">
				<span class="ve-w-66 ve-no-shrink ve-mr-2 ve-flex-v-center">Title-Case Name</span>
				${cbTitleCase}
			</label>
			
			<hr class="ve-hr-3">
		</div>`
			.appendTo(eleParent);
	}

	_renderSettingsModal_styleHint ({eleParent}) {
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

		ee`<div class="ve-flex-col">
			<label class="ve-split-v-center ve-w-100" title="Which game version the input text is intended to be used with.">
				<span class="ve-w-66 ve-no-shrink ve-mr-2 ve-flex-v-center">Version</span>
				${selStyleHint}
			</label>
			
			<hr class="ve-hr-3">
		</div>`
			.appendTo(eleParent);
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
