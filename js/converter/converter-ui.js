import {ConverterUiUtil} from "./converter-ui-utils.js";

export class ConverterUi extends BaseComponent {
	constructor () {
		super();

		this._editorIn = null;
		this._editorOut = null;

		this._converters = {};

		this._saveInputDebounced = MiscUtil.debounce(() => StorageUtil.pSetForPage(ConverterUi.STORAGE_INPUT, this._editorIn.getValue()), 50);
		this.saveSettingsDebounced = MiscUtil.debounce(() => StorageUtil.pSetForPage(ConverterUi.STORAGE_STATE, this.getBaseSaveableState()), 50);

		this._addHookAll("state", () => this.saveSettingsDebounced());

		this.__meta = this._getDefaultMetaState();
		this._meta = this._getProxy("meta", this.__meta);
	}

	set converters (converters) { this._converters = converters; }
	get activeConverter () { return this._converters[this._state.converter]; }

	getBaseSaveableState () {
		return {
			...super.getBaseSaveableState(),
			...Object.values(this._converters).mergeMap(it => ({[it.converterId]: it.getBaseSaveableState()})),
		};
	}

	setBaseSaveableStateFrom (toLoad, ...rest) {
		// Avoid crash on missing converter
		if (toLoad?.state?.converter && !this._converters[toLoad.state.converter]) {
			toLoad.state.converter = Object.keys(this._converters)[0];
		}

		super.setBaseSaveableStateFrom(toLoad, ...rest);
	}

	getPod () {
		return {
			...super.getPod(),
			doRefreshAvailableSources: this._doRefreshAvailableSources.bind(this),
		};
	}

	_doRefreshAvailableSources () {
		this._state.availableSources = BrewUtil2.getSources().sort((a, b) => SortUtil.ascSortLower(a.full, b.full))
			.map(it => it.json);
	}

	async pInit () {
		// region load state
		const savedState = await StorageUtil.pGetForPage(ConverterUi.STORAGE_STATE);
		if (savedState) {
			this.setBaseSaveableStateFrom(savedState);
			Object.values(this._converters)
				.filter(it => savedState[it.converterId])
				.forEach(it => it.setBaseSaveableStateFrom(savedState[it.converterId]));
		}

		// forcibly overwrite available sources with fresh data
		this._doRefreshAvailableSources();
		Object.values(this._converters)
			.filter(it => it.source && !this._state.availableSources.includes(it.source))
			.forEach(it => it.source = "");

		// reset this temp flag
		this._state.hasAppended = false;
		// endregion

		this._editorIn = EditorUtil.initEditor("converter_input");
		try {
			const prevInput = await StorageUtil.pGetForPage(ConverterUi.STORAGE_INPUT);
			if (prevInput) this._editorIn.setValue(prevInput, -1);
		} catch (ignored) { setTimeout(() => { throw ignored; }); }
		this._editorIn.on("change", () => this._saveInputDebounced());

		this._editorOut = EditorUtil.initEditor("converter_output", {readOnly: true, mode: "ace/mode/json"});

		$(`#editable`).click(() => {
			this._outReadOnly = false;
			JqueryUtil.doToast({type: "warning", content: "Enabled editing. Note that edits will be overwritten as you parse new stat blocks."});
		});

		let hovWindowPreview = null;
		$(`#preview`)
			.on("click", async evt => {
				const metaCurr = this._getCurrentEntities();

				if (!metaCurr?.entities?.length) return JqueryUtil.doToast({content: "Nothing to preview!", type: "warning"});
				if (metaCurr.error) return JqueryUtil.doToast({content: `Current output was not valid JSON!`, type: "danger"});

				const entries = !this.activeConverter.prop
					? metaCurr.entities.flat()
					: metaCurr.entities
						.map(ent => {
							// Handle nameless/sourceless entities (e.g. tables)
							if (!ent.name) ent.name = "(Unnamed)";
							if (!ent.source) ent.source = VeCt.STR_GENERIC;

							return {
								type: "statblockInline",
								dataType: this.activeConverter.prop,
								data: ent,
							};
						});

				let $content;
				try {
					$content = Renderer.hover.$getHoverContent_generic({
						type: "entries",
						entries,
					});
				} catch (e) {
					JqueryUtil.doToast({type: "danger", content: `Could not render preview! ${VeCt.STR_SEE_CONSOLE}`});
					throw e;
				}

				if (hovWindowPreview) {
					hovWindowPreview.$setContent($content);
					return;
				}

				hovWindowPreview = Renderer.hover.getShowWindow(
					$content,
					Renderer.hover.getWindowPositionFromEvent(evt),
					{
						title: "Preview",
						isPermanent: true,
						cbClose: () => {
							hovWindowPreview = null;
						},
					},
				);
			});

		const $btnSaveLocal = $(`#save_local`).click(async () => {
			const metaCurr = this._getCurrentEntities();

			if (!metaCurr?.entities?.length) return JqueryUtil.doToast({content: "Nothing to save!", type: "warning"});
			if (metaCurr.error) return JqueryUtil.doToast({content: `Current output was not valid JSON!`, type: "danger"});

			const prop = this.activeConverter.prop;

			const invalidSources = metaCurr.entities.map(it => !it.source || !BrewUtil2.hasSourceJson(it.source) ? (it.name || it.caption || "(Unnamed)").trim() : false).filter(Boolean);
			if (invalidSources.length) {
				JqueryUtil.doToast({
					content: `One or more entries have missing or unknown sources: ${invalidSources.join(", ")}`,
					type: "danger",
				});
				return;
			}

			const brewDocEditable = await BrewUtil2.pGetEditableBrewDoc();
			const uneditableSources = metaCurr.entities
				.filter(ent => !(brewDocEditable?.body?._meta?.sources || []).some(src => src.json === ent.source))
				.map(ent => ent.source);
			if (uneditableSources.length) {
				JqueryUtil.doToast({
					content: `One or more entries have sources which belong to non-editable homebrew: ${uneditableSources.join(", ")}`,
					type: "danger",
				});
				return;
			}

			// ignore duplicates
			const _dupes = {};
			const dupes = [];
			const dedupedEntries = metaCurr.entities
				.map(it => {
					const lSource = it.source.toLowerCase();
					const lName = it.name.toLowerCase();
					_dupes[lSource] = _dupes[lSource] || {};
					if (_dupes[lSource][lName]) {
						dupes.push(it.name);
						return null;
					} else {
						_dupes[lSource][lName] = true;
						return it;
					}
				})
				.filter(Boolean);

			if (dupes.length) {
				JqueryUtil.doToast({
					type: "warning",
					content: `Ignored ${dupes.length} duplicate entr${dupes.length === 1 ? "y" : "ies"}`,
				});
			}

			if (!dedupedEntries.length) {
				return JqueryUtil.doToast({
					content: "Nothing to save!",
					type: "warning",
				});
			}

			// handle overwrites
			const brewDoc = await BrewUtil2.pGetOrCreateEditableBrewDoc();
			const overwriteMeta = dedupedEntries
				.map(it => {
					if (!brewDoc?.body?.[prop]) return {entry: it, isOverwrite: false};

					const ix = brewDoc.body[prop].findIndex(bru => bru.name.toLowerCase() === it.name.toLowerCase() && bru.source.toLowerCase() === it.source.toLowerCase());
					if (!~ix) return {entry: it, isOverwrite: false};

					return {
						isOverwrite: true,
						ix,
						entry: it,
					};
				})
				.filter(Boolean);

			const willOverwrite = overwriteMeta.map(it => it.isOverwrite).filter(Boolean);
			if (
				willOverwrite.length
				&& !await InputUiUtil.pGetUserBoolean({title: "Overwrite Entries", htmlDescription: `This will overwrite ${willOverwrite.length} entr${willOverwrite.length === 1 ? "y" : "ies"}. Are you sure?`, textYes: "Yes", textNo: "Cancel"})
			) {
				return;
			}

			const cpyBrewDoc = MiscUtil.copy(brewDoc);
			overwriteMeta.forEach(meta => {
				if (meta.isOverwrite) return cpyBrewDoc.body[prop][meta.ix] = MiscUtil.copy(meta.entry);
				(cpyBrewDoc.body[prop] = cpyBrewDoc.body[prop] || []).push(MiscUtil.copy(meta.entry));
			});

			await BrewUtil2.pSetEditableBrewDoc(cpyBrewDoc);

			JqueryUtil.doToast({
				type: "success",
				content: `Saved!`,
			});
		});

		this._addHookBase("converter", () => {
			$btnSaveLocal.toggleClass("hidden", !this.activeConverter.canSaveLocal);
		})();

		$(`#btn-output-download`).click(() => {
			const metaCurr = this._getCurrentEntities();

			if (!metaCurr?.entities?.length) return JqueryUtil.doToast({content: "Nothing to download!", type: "warning"});
			if (metaCurr.error) {
				JqueryUtil.doToast({
					content: `Current output was not valid JSON. Downloading as <span class="code">.txt</span> instead.`,
					type: "warning",
				});
				DataUtil.userDownloadText(`converter-output.txt`, metaCurr.text);
				return;
			}

			const out = {[this.activeConverter.prop]: metaCurr.entities};
			DataUtil.userDownload(`converter-output`, out);
		});

		$(`#btn-output-copy`).click(async evt => {
			const output = this._outText;
			if (!output || !output.trim()) {
				return JqueryUtil.doToast({
					content: "Nothing to copy!",
					type: "danger",
				});
			}

			await MiscUtil.pCopyTextToClipboard(output);
			JqueryUtil.showCopiedEffect(evt.currentTarget, "Copied!");
		});

		/**
		 * Wrap a function in an error handler which will wipe the error output, and append future errors to it.
		 * @param pToRun
		 */
		const catchErrors = async (pToRun) => {
			try {
				this._proxyAssignSimple("meta", this._getDefaultMetaState());
				await pToRun();
			} catch (x) {
				const splitStack = x.stack.split("\n");
				const atPos = splitStack.length > 1 ? splitStack[1].trim() : "(Unknown location)";
				this._meta.errors = [...this._meta.errors, `${x.message} ${atPos}`];
				setTimeout(() => { throw x; });
			}
		};

		const doConversion = (isAppend) => {
			catchErrors(async () => {
				if (
					isAppend
					&& !this._state.hasAppended
					&& !await InputUiUtil.pGetUserBoolean({title: "Are you Sure?", htmlDescription: "You're about to overwrite multiple entries. Are you sure?", textYes: "Yes", textNo: "Cancel"})
				) return;

				const chunks = (this._state.inputSeparator
					? this.inText.split(this._state.inputSeparator)
					: [this.inText]).map(it => it.trim()).filter(Boolean);
				if (!chunks.length) {
					this._meta.warnings = [...this._meta.warnings, "No input!"];
					return;
				}

				chunks
					.reverse() // reverse as the append is actually a prepend
					.forEach((chunk, i) => {
						this.activeConverter.handleParse(
							chunk,
							this.doCleanAndOutput.bind(this),
							(warning) => this._meta.warnings = [...this._meta.warnings, warning],
							isAppend || i !== 0, // always clear the output for the first non-append chunk, then append
						);
					});
			});
		};

		$("#parsestatblock").on("click", () => doConversion(false));
		$(`#parsestatblockadd`).on("click", () => doConversion(true));

		$(document.body)
			.on("keydown", evt => {
				if (EventUtil.isInInput(evt) || !EventUtil.noModifierKeys(evt)) return;

				const key = EventUtil.getKeyIgnoreCapsLock(evt);
				if (!["+", "-"].includes(key)) return;

				evt.stopPropagation();
				evt.preventDefault();

				this.activeConverter.page += (key === "+" ? 1 : -1);
			});

		this._initSideMenu();
		this._initFooterLhs();

		this._pInit_dispErrorsWarnings();

		window.dispatchEvent(new Event("toolsLoaded"));
	}

	_pInit_dispErrorsWarnings () {
		const $stgErrors = $(`#lastError`);
		const $stgWarnings = $(`#lastWarnings`);

		const getRow = ({prefix, text, prop}) => {
			const $btnClose = $(`<button class="ve-btn ve-btn-danger ve-btn-xs w-24p" title="Dismiss ${prefix} (SHIFT to Dismiss All)">×</button>`)
				.on("click", evt => {
					if (evt.shiftKey) {
						this._meta[prop] = [];
						return;
					}

					const ix = this._meta[prop].indexOf(text);
					if (!~ix) return;
					this._meta[prop].splice(ix, 1);
					this._meta[prop] = [...this._meta[prop]];
				});

			return $$`<div class="split-v-center py-1">
				<div>[${prefix}] ${text}</div>
				${$btnClose}
			</div>`;
		};

		this._addHook("meta", "errors", () => {
			$stgErrors.toggleVe(this._meta.errors.length);
			$stgErrors.empty();
			this._meta.errors
				.forEach(it => {
					getRow({prefix: "Error", text: it, prop: "errors"})
						.appendTo($stgErrors);
				});
		})();

		this._addHook("meta", "warnings", () => {
			$stgWarnings.toggleVe(this._meta.warnings.length);
			$stgWarnings.empty();
			this._meta.warnings
				.forEach(it => {
					getRow({prefix: "Warning", text: it, prop: "warnings"})
						.appendTo($stgWarnings);
				});
		})();

		const hkResize = () => this._editorOut.resize();
		this._addHook("meta", "errors", hkResize);
		this._addHook("meta", "warnings", hkResize);
	}

	_getCurrentEntities () {
		const output = this._outText;

		if (!(output || "").trim()) return null;

		try {
			return {entities: JSON.parse(`[${output}]`)};
		} catch (e) {
			return {error: e.message, text: output.trim()};
		}
	}

	_initSideMenu () {
		const $mnu = $(`.sidemenu`);

		const $selConverter = ComponentUiUtil.$getSelEnum(
			this,
			"converter",
			{
				values: Object.keys(this._converters),
				fnDisplay: converterId => this._converters[converterId].name,
			},
		);

		$$`<div class="w-100 split-v-center"><div class="sidemenu__row__label">Mode</div>${$selConverter}</div>`
			.appendTo($mnu);

		ConverterUiUtil.renderSideMenuDivider($mnu);

		// region mult-part parsing options
		const $iptInputSeparator = ComponentUiUtil.$getIptStr(this, "inputSeparator").addClass("code");
		$$`<div class="w-100 split-v-center mb-2"><div class="sidemenu__row__label help mr-2" title="A separator used to mark the end of one to-be-converted entity (creature, spell, etc.) so that multiple entities can be converted in one run. If left blank, the entire input text will be parsed as one entity.">Separator</div>${$iptInputSeparator}</div>`
			.appendTo($mnu);

		const $selAppendPrependMode = ComponentUiUtil.$getSelEnum(
			this,
			"appendPrependMode",
			{
				values: [
					ConverterUi._APPEND_PREPEND_MODE__APPEND,
					ConverterUi._APPEND_PREPEND_MODE__PREPEND,
				],
				fnDisplay: val => val.toTitleCase(),
			},
		);
		$$`<div class="w-100 split-v-center"><div class="sidemenu__row__label mr-2" title="Sets output order when using the &quot;Parse and Add&quot; button, or parsing multiple blocks of text using a separator.">On Add</div>${$selAppendPrependMode}</div>`
			.appendTo($mnu);

		ConverterUiUtil.renderSideMenuDivider($mnu);
		// endregion

		const $wrpConverters = $(`<div class="w-100 ve-flex-col"></div>`).appendTo($mnu);
		Object.entries(this._converters)
			.sort(([, vA], [, vB]) => SortUtil.ascSortLower(vA.name, vB.name))
			.forEach(([, converter]) => converter.renderSidebar(this.getPod(), $wrpConverters));

		const hkMode = () => {
			this._editorIn.setOptions({
				mode: ConverterUiUtil.getAceMode(this.activeConverter?.mode),
			});
		};
		this._addHookBase("converter", hkMode);
		hkMode();
	}

	_initFooterLhs () {
		const $wrpFooterLhs = $(`#wrp-footer-lhs`);

		Object.entries(this._converters)
			.sort(([, vA], [, vB]) => SortUtil.ascSortLower(vA.name, vB.name))
			.forEach(([, converter]) => converter.renderFooterLhs(this.getPod(), {$wrpFooterLhs}));
	}

	doCleanAndOutput (obj, append) {
		const asCleanString = CleanUtil.getCleanJson(obj, {isFast: false});
		if (append) {
			const strs = [asCleanString, this._outText];
			if (this._state.appendPrependMode === "prepend") strs.reverse();
			this._outText = strs.map(it => it.trimEnd()).join(",\n");
			this._state.hasAppended = true;
		} else {
			this._outText = asCleanString;
			this._state.hasAppended = false;
		}
	}

	set _outReadOnly (val) { this._editorOut.setOptions({readOnly: val}); }

	get _outText () { return this._editorOut.getValue(); }
	set _outText (text) { this._editorOut.setValue(text, -1); }

	get inText () { return CleanUtil.getCleanString((this._editorIn.getValue() || "").trim(), {isFast: false}); }
	set inText (text) { this._editorIn.setValue(text, -1); }

	_getDefaultState () { return MiscUtil.copy(ConverterUi._DEFAULT_STATE); }

	_getDefaultMetaState () {
		return {
			errors: [],
			warnings: [],
		};
	}
}
ConverterUi.STORAGE_INPUT = "converterInput";
ConverterUi.STORAGE_STATE = "converterState";
ConverterUi._APPEND_PREPEND_MODE__APPEND = "append";
ConverterUi._APPEND_PREPEND_MODE__PREPEND = "prepend";
ConverterUi._DEFAULT_STATE = {
	hasAppended: false,
	appendPrependMode: ConverterUi._APPEND_PREPEND_MODE__APPEND,
	converter: "Creature",
	sourceJson: "",
	inputSeparator: "===",
};
