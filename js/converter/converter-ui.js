import {ConverterUiUtil} from "./converter-ui-utils.js";

const _APPEND_PREPEND_MODE__APPEND = "append";
const _APPEND_PREPEND_MODE__PREPEND = "prepend";

class _ConverterUiSettings extends BaseComponent {
	constructor ({comp, converter, ...rest}) {
		super({...rest});

		this._comp = comp;
		this._converter = converter;
	}

	render ({eleParent}) {
		const iptInputSeparator = ComponentUiUtil.getIptStr(this._comp, "inputSeparator").addClass("ve-code");

		const selAppendPrependMode = ComponentUiUtil.getSelEnum(
			this._comp,
			"appendPrependMode",
			{
				values: [
					_APPEND_PREPEND_MODE__APPEND,
					_APPEND_PREPEND_MODE__PREPEND,
				],
				fnDisplay: val => val.toTitleCase(),
			},
		);

		ee`<div class="ve-flex-col ve-mt-3">
			<label class="ve-split-v-center ve-w-100 ve-mb-2" title="A separator used to mark the end of one to-be-converted entity (creature, spell, etc.) so that multiple entities can be converted in one run. If left blank, the entire input text will be parsed as one entity.">
				<span class="ve-w-66 ve-no-shrink ve-mr-2 ve-flex-v-center">Input Separator</span>
				${iptInputSeparator}
			</label>
			
			<label class="ve-split-v-center ve-w-100" title="Sets output order when using the &quot;Parse and Add&quot; button, or parsing multiple blocks of text using a separator.">
				<span class="ve-w-66 ve-no-shrink ve-mr-2 ve-flex-v-center">&quot;Parse and Add&quot; Behaviour</span>
				${selAppendPrependMode}
			</label>
			
			<hr class="ve-hr-3">
		</div>`
			.appendTo(eleParent);

		this._converter.renderSettingsModal({compParent: this._comp, eleParent});
	}
}

export class ConverterUi extends BaseComponent {
	static _STORAGE_INPUT = "converterInput";
	static _STORAGE_STATE = "converterState";

	constructor () {
		super();

		this._editorIn = null;
		this._editorOut = null;

		this._converters = {};

		this._saveInputDebounced = MiscUtil.debounce(() => StorageUtil.pSetForPage(this.constructor._STORAGE_INPUT, this._editorIn.getValue()), 50);
		this.saveSettingsDebounced = MiscUtil.debounce(() => StorageUtil.pSetForPage(this.constructor._STORAGE_STATE, this.getBaseSaveableState()), 50);

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

	_doRefreshAvailableSources () {
		this._state.availableSources = BrewUtil2.getSources().sort((a, b) => SortUtil.ascSortLower(a.full, b.full))
			.map(it => it.json);
	}

	doRefreshAvailableSources () {
		return this._doRefreshAvailableSources();
	}

	async pInit () {
		// region load state
		const savedState = await StorageUtil.pGetForPage(this.constructor._STORAGE_STATE);
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

		this._editorIn = await EditorUtil.pInitEditor("ipt-converter-input");
		try {
			const prevInput = await StorageUtil.pGetForPage(this.constructor._STORAGE_INPUT);
			if (prevInput) this._editorIn.setValue(prevInput, -1);
		} catch (ignored) { setTimeout(() => { throw ignored; }); }
		this._editorIn.on("change", () => this._saveInputDebounced());

		this._editorOut = await EditorUtil.pInitEditor("ipt-converter-output", {readOnly: true, mode: "ace/mode/json"});

		const btnEnableEditing = es(`#btn-enable-edit`)
			.onn("click", () => {
				this._state.outputEnableEditing = !this._state.outputEnableEditing;
			});
		this._addHookBase("outputEnableEditing", () => {
			btnEnableEditing.toggleClass("ve-active", !!this._state.outputEnableEditing);
			this._editorOut.setOptions({readOnly: !this._state.outputEnableEditing});
		})();

		let hovWindowPreview = null;
		es(`#btn-preview`)
			.onn("click", async evt => {
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

				let content;
				try {
					content = Renderer.hover.getHoverContent_generic({
						type: "entries",
						entries,
					});
				} catch (e) {
					JqueryUtil.doToast({type: "danger", content: `Could not render preview! ${VeCt.STR_SEE_CONSOLE}`});
					throw e;
				}

				if (hovWindowPreview) {
					hovWindowPreview.setContent(content);
					return;
				}

				hovWindowPreview = Renderer.hover.getShowWindow(
					content,
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

		const btnSaveLocal = es(`#btn-save-local`).onn("click", async () => {
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
					content: `One or more entries have sources which belong to non-btn-enable-edit homebrew: ${uneditableSources.join(", ")}`,
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
			btnSaveLocal.toggleClass("hidden", !this.activeConverter.canSaveLocal);
		})();

		es(`#btn-output-download`).onn("click", () => {
			const metaCurr = this._getCurrentEntities();

			if (!metaCurr?.entities?.length) return JqueryUtil.doToast({content: "Nothing to download!", type: "warning"});
			if (metaCurr.error) {
				JqueryUtil.doToast({
					content: `Current output was not valid JSON. Downloading as <span class="ve-code">.txt</span> instead.`,
					type: "warning",
				});
				DataUtil.userDownloadText(`converter-output.txt`, metaCurr.text);
				return;
			}

			const out = {[this.activeConverter.prop]: metaCurr.entities};
			DataUtil.userDownload(`converter-output`, out);
		});

		es(`#btn-output-copy`).onn("click", async evt => {
			const btn = evt.target;

			const output = this._outText;
			if (!output || !output.trim()) {
				return JqueryUtil.doToast({
					content: "Nothing to copy!",
					type: "danger",
				});
			}

			await MiscUtil.pCopyTextToClipboard(output);
			JqueryUtil.showCopiedEffect(btn);
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

		es("#btn-parse").onn("click", () => doConversion(false));
		es(`#btn-parse-and-add`).onn("click", () => doConversion(true));

		e_(document.body)
			.onn("keydown", evt => {
				if (EventUtil.isInInput(evt) || !EventUtil.noModifierKeys(evt)) return;

				const key = EventUtil.getKeyIgnoreCapsLock(evt);
				if (!["+", "-"].includes(key)) return;

				if (!this.activeConverter?.getHasPageNumbers()) return;

				evt.stopPropagation();
				evt.preventDefault();

				this.activeConverter.page += (key === "+" ? 1 : -1);
			});

		this._initSettings();

		this._pInit_dispErrorsWarnings();

		window.dispatchEvent(new Event("toolsLoaded"));
	}

	_pInit_dispErrorsWarnings () {
		const stgErrors = es(`#disp-errors`);
		const stgWarnings = es(`#disp-warnings`);

		const getRow = ({prefix, text, prop}) => {
			const btnClose = ee`<button class="ve-btn ve-btn-danger ve-btn-xs ve-w-24p" title="Dismiss ${prefix} (SHIFT to Dismiss All)">×</button>`
				.onn("click", evt => {
					if (evt.shiftKey) {
						this._meta[prop] = [];
						return;
					}

					const ix = this._meta[prop].indexOf(text);
					if (!~ix) return;
					this._meta[prop].splice(ix, 1);
					this._meta[prop] = [...this._meta[prop]];
				});

			return ee`<div class="ve-split-v-center ve-py-1">
				<div>[${prefix}] ${text}</div>
				${btnClose}
			</div>`;
		};

		this._addHook("meta", "errors", () => {
			stgErrors.toggleVe(!!this._meta.errors.length);
			stgErrors.empty();
			this._meta.errors
				.forEach(it => {
					getRow({prefix: "Error", text: it, prop: "errors"})
						.appendTo(stgErrors);
				});
		})();

		this._addHook("meta", "warnings", () => {
			stgWarnings.toggleVe(!!this._meta.warnings.length);
			stgWarnings.empty();
			this._meta.warnings
				.forEach(it => {
					getRow({prefix: "Warning", text: it, prop: "warnings"})
						.appendTo(stgWarnings);
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

	_initSettings () {
		ComponentUiUtil.getSelEnum(
			this,
			"converter",
			{
				ele: es(`#sel-mode`)
					.attr("disabled", false),
				values: Object.keys(this._converters),
				fnDisplay: converterId => this._converters[converterId].name,
			},
		);

		es(`#btn-settings`)
			.attr("disabled", false)
			.onn("click", () => {
				const {eleModalInner} = UiUtil.getShowModal({
					title: "Settings",
					isHeaderBorder: true,
					isUncappedHeight: true,
				});

				const compSettings = new _ConverterUiSettings({
					comp: this,
					converter: this.activeConverter,
				});
				compSettings.render({eleParent: eleModalInner});
			});

		const wrpSettings = es(`#wrp-settings`);

		this._addHookBase("converter", () => {
			wrpSettings.empty();
			this.activeConverter.renderSettings({compParent: this, wrpSettings});

			this._editorIn.setOptions({
				mode: ConverterUiUtil.getAceMode(this.activeConverter?.mode),
			});
		})();
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

	get _outText () { return this._editorOut.getValue(); }
	set _outText (text) { this._editorOut.setValue(text, -1); }

	get inText () { return CleanUtil.getCleanString((this._editorIn.getValue() || "").trim(), {isFast: false}); }
	set inText (text) { this._editorIn.setValue(text, -1); }

	static _DEFAULT_STATE = {
		hasAppended: false,
		appendPrependMode: _APPEND_PREPEND_MODE__APPEND,
		converter: "Creature",
		sourceJson: "",
		inputSeparator: "===",
		outputEnableEditing: false,
	};

	_getDefaultState () { return MiscUtil.copy(this.constructor._DEFAULT_STATE); }

	_getDefaultMetaState () {
		return {
			errors: [],
			warnings: [],
		};
	}
}
