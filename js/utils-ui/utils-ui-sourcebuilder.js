export class SourceUiUtil {
	static _getValidOptions (options) {
		if (!options) throw new Error(`No options were specified!`);
		if (!options.eleParent || !options.cbConfirm || !options.cbConfirmExisting || !options.cbCancel) throw new Error(`Missing options!`);
		options.mode = options.mode || "add";
		return options;
	}

	/**
	 * @param options Options object.
	 * @param options.eleParent Parent element.
	 * @param options.cbConfirm Confirmation callback for inputting new sources.
	 * @param options.cbConfirmExisting Confirmation callback for selecting existing sources.
	 * @param options.cbCancel Cancellation callback.
	 * @param options.mode (Optional) Mode to build in, "select", "edit" or "add". Defaults to "select".
	 * @param options.source (Optional) Homebrew source object.
	 * @param options.isRequired (Optional) True if a source must be selected.
	 */
	static render (options) {
		options = SourceUiUtil._getValidOptions(options);
		options.eleParent.vee.empty();
		options.mode = options.mode || "select";

		const isEditMode = options.mode === "edit";

		let jsonDirty = false;
		const doValidateIptJson = () => {
			iptJson
				.vee.removeClass("form-control--error")
				.vee.removeClass("form-control--warning")
				.vee.tooltip(null);
			const val = iptJson.vee.val().trim();
			if (val.length && val.length < 6) {
				iptJson
					.vee.addClass("form-control--warning")
					.vee.tooltip("JSON source identifiers are expected to be ≥ 6 characters.");
			}
		};
		const iptName = veT`<input class="ve-form-control ve-ui-source__ipt-named">`
			.vee.onn("keydown", evt => { if (evt.key === "Escape") iptName.vee.blur(); })
			.vee.onn("change", () => {
				if (!jsonDirty && !isEditMode) {
					iptJson.vee.val(iptName.vee.val().replace(/[^-0-9a-zA-Z]/g, ""));
					doValidateIptJson();
				}
				iptName.vee.removeClass("form-control--error");
			});
		if (options.source) iptName.vee.val(options.source.full);
		const iptAbv = veT`<input class="ve-form-control ve-ui-source__ipt-named">`
			.vee.onn("keydown", evt => { if (evt.key === "Escape") iptAbv.vee.blur(); })
			.vee.onn("change", () => {
				iptAbv.vee.removeClass("form-control--error");
			});
		if (options.source) iptAbv.vee.val(options.source.abbreviation);
		const iptJson = veT`<input class="ve-form-control ve-ui-source__ipt-named" ${isEditMode ? "disabled" : ""}>`
			.vee.onn("keydown", evt => { if (evt.key === "Escape") iptJson.vee.blur(); })
			.vee.onn("change", () => {
				jsonDirty = true;
				doValidateIptJson();
			});
		if (options.source) iptJson.vee.val(options.source.json);
		const iptVersion = veT`<input class="ve-form-control ve-ui-source__ipt-named">`
			.vee.onn("keydown", evt => { if (evt.key === "Escape") iptUrl.vee.blur(); });
		if (options.source) iptVersion.vee.val(options.source.version);

		let hasColor = false;
		const iptColor = veT`<input type="color" class="ve-w-100 ve-b-0">`
			.vee.onn("keydown", evt => { if (evt.key === "Escape") iptColor.vee.blur(); })
			.vee.onn("change", () => hasColor = true);
		if (options.source?.color != null) { hasColor = true; iptColor.vee.val(`#${options.source.color}`); }

		let hasColorNight = false;
		const iptColorNight = veT`<input type="color" class="ve-w-100 ve-b-0">`
			.vee.onn("keydown", evt => { if (evt.key === "Escape") iptColorNight.vee.blur(); })
			.vee.onn("change", () => hasColorNight = true);
		if (options.source?.colorNight != null) { hasColorNight = true; iptColorNight.vee.val(`#${options.source.colorNight}`); }

		const iptUrl = veT`<input class="ve-form-control ve-ui-source__ipt-named">`
			.vee.onn("keydown", evt => { if (evt.key === "Escape") iptUrl.vee.blur(); });
		if (options.source) iptUrl.vee.val(options.source.url);
		const iptAuthors = veT`<input class="ve-form-control ve-ui-source__ipt-named">`
			.vee.onn("keydown", evt => { if (evt.key === "Escape") iptAuthors.vee.blur(); });
		if (options.source) iptAuthors.vee.val((options.source.authors || []).join(", "));
		const iptConverters = veT`<input class="ve-form-control ve-ui-source__ipt-named">`
			.vee.onn("keydown", evt => { if (evt.key === "Escape") iptConverters.vee.blur(); });
		if (options.source) iptConverters.vee.val((options.source.convertedBy || []).join(", "));

		const btnOk = veT`<button class="ve-btn ve-btn-primary">OK</button>`
			.vee.onn("click", async () => {
				let incomplete = false;
				[iptName, iptAbv, iptJson].forEach(ipt => {
					const val = ipt.vee.val();
					if (!val || !val.trim()) { incomplete = true; ipt.vee.addClass("form-control--error"); }
				});
				if (incomplete) return;

				const jsonVal = iptJson.vee.val().trim();
				if (!isEditMode && BrewUtil2.hasSourceJson(jsonVal)) {
					iptJson.vee.addClass("form-control--error");
					JqueryUtil.doToast({content: `The JSON identifier "${jsonVal}" already exists!`, type: "danger"});
					return;
				}

				const source = {
					json: jsonVal,
					abbreviation: iptAbv.vee.val().trim(),
					full: iptName.vee.val().trim(),
					version: iptVersion.vee.val().trim() || "1.0.0",
				};

				const url = iptUrl.vee.val().trim();
				if (url) source.url = url;

				const authors = iptAuthors.vee.val().trim().split(",").map(it => it.trim()).filter(Boolean);
				if (authors.length) source.authors = authors;

				const convertedBy = iptConverters.vee.val().trim().split(",").map(it => it.trim()).filter(Boolean);
				if (convertedBy.length) source.convertedBy = convertedBy;

				if (hasColor) source.color = iptColor.vee.val().trim().replace(/^#/, "");
				if (hasColorNight) source.colorNight = iptColorNight.vee.val().trim().replace(/^#/, "");

				await options.cbConfirm(source, options.mode !== "edit");
			});

		const btnCancel = options.isRequired && !isEditMode
			? null
			: veT`<button class="ve-btn ve-btn-default ve-ml-2">Cancel</button>`
				.vee.onn("click", () => options.cbCancel());

		const btnUseExisting = veT`<button class="ve-btn ve-btn-default">Use an Existing Source</button>`
			.vee.onn("click", () => {
				stgInitial.vee.hide();
				stgExisting.vee.show();

				// cleanup
				[iptName, iptAbv, iptJson].forEach(ipt => ipt.vee.removeClass("form-control--error"));
			});

		const stgInitial = veT`<div class="ve-h-100 ve-w-100 ve-flex-vh-center"><div class="ve-flex-col">
			<h3 class="ve-text-center">${isEditMode ? "Edit Homebrew Source" : "Add a Homebrew Source"}</h3>
			<div class="ve-ui-source__row ve-mb-2"><div class="ve-col-12 ve-flex-v-center">
				<span class="ve-mr-2 ve-ui-source__name ve-help" title="The name or title for the homebrew you wish to create. This could be the name of a book or PDF; for example, 'Monster Manual'">Title</span>
				${iptName}
			</div></div>
			<div class="ve-ui-source__row ve-mb-2"><div class="ve-col-12 ve-flex-v-center">
				<span class="ve-mr-2 ve-ui-source__name ve-help" title="An abbreviated form of the title. This will be shown in lists on the site, and in the top-right corner of stat blocks or data entries; for example, 'MM'">Abbreviation</span>
				${iptAbv}
			</div></div>
			<div class="ve-ui-source__row ve-mb-2"><div class="ve-col-12 ve-flex-v-center">
				<span class="ve-mr-2 ve-ui-source__name ve-help" title="This will be used to identify your homebrew universally, so should be unique to you and you alone">JSON Identifier</span>
				${iptJson}
			</div></div>
			<div class="ve-ui-source__row ve-mb-2"><div class="ve-col-12 ve-flex-v-center">
				<span class="ve-mr-2 ve-ui-source__name ve-help" title="A version identifier, e.g. &quot;1.0.0&quot; or &quot;draft 1&quot;">Version</span>
				${iptVersion}
			</div></div>
			<div class="ve-ui-source__row ve-mb-2"><div class="ve-col-12 ve-flex-v-center">
				<span class="ve-mr-2 ve-ui-source__name ve-help" title="A color which should be used when displaying the source abbreviation">Color</span>
				${iptColor}
			</div></div>
			<div class="ve-ui-source__row ve-mb-2"><div class="ve-col-12 ve-flex-v-center">
				<span class="ve-mr-2 ve-ui-source__name ve-help" title="A color which should be used when displaying the source abbreviation, when using a &quot;Night&quot; theme. If unspecified, &quot;Color&quot; will be used for both &quot;Day&quot; and &quot;Night&quot; themes.">Color (Night)</span>
				${iptColorNight}
			</div></div>
			<div class="ve-ui-source__row ve-mb-2"><div class="ve-col-12 ve-flex-v-center">
				<span class="ve-mr-2 ve-ui-source__name ve-help" title="A link to the original homebrew, e.g. a GM Binder page">Source URL</span>
				${iptUrl}
			</div></div>
			<div class="ve-ui-source__row ve-mb-2"><div class="ve-col-12 ve-flex-v-center">
				<span class="ve-mr-2 ve-ui-source__name ve-help" title="A comma-separated list of authors, e.g. 'John Doe, Joe Bloggs'">Author(s)</span>
				${iptAuthors}
			</div></div>
			<div class="ve-ui-source__row ve-mb-2"><div class="ve-col-12 ve-flex-v-center">
				<span class="ve-mr-2 ve-ui-source__name ve-help" title="A comma-separated list of people who converted the homebrew to 5etools' format, e.g. 'John Doe, Joe Bloggs'">Converted By</span>
				${iptConverters}
			</div></div>
			<div class="ve-text-center ve-mb-2">${btnOk}${btnCancel}</div>

			${!isEditMode && BrewUtil2.getMetaLookup("sources")?.length ? veT`<div class="ve-flex-vh-center ve-mb-3 ve-mt-3"><span class="ve-ui-source__divider"></span>or<span class="ve-ui-source__divider"></span></div>
			<div class="ve-flex-vh-center">${btnUseExisting}</div>` : ""}
		</div></div>`
			.vee.appendTo(options.eleParent);

		const selExisting = veT`<select class="ve-form-control ve-input-sm">
			<option disabled>Select</option>
			${(BrewUtil2.getMetaLookup("sources") || []).sort((a, b) => SortUtil.ascSortLower(a.full, b.full)).map(s => `<option value="${s.json.escapeQuotes()}">${s.full.escapeQuotes()}</option>`)}
		</select>`
			.vee.onn("change", () => selExisting.vee.removeClass("form-control--error"));
		selExisting.selectedIndex = 0;

		const btnConfirmExisting = veT`<button class="ve-btn ve-btn-default ve-btn-sm">Confirm</button>`
			.vee.onn("click", async () => {
				if (selExisting.selectedIndex === 0) {
					selExisting.vee.addClass("form-control--error");
					return;
				}

				const sourceJson = selExisting.vee.val();
				const source = BrewUtil2.sourceJsonToSource(sourceJson);
				await options.cbConfirmExisting(source);

				// cleanup
				selExisting.selectedIndex = 0;
				stgExisting.vee.hide();
				stgInitial.vee.show();
			});

		const btnBackExisting = veT`<button class="ve-btn ve-btn-default ve-btn-sm ve-mr-2">Back</button>`
			.vee.onn("click", () => {
				selExisting.selectedIndex = 0;
				stgExisting.vee.hide();
				stgInitial.vee.show();
			});

		const stgExisting = veT`<div class="ve-h-100 ve-w-100 ve-flex-vh-center ve-hidden"><div>
			<h3 class="ve-text-center">Select a Homebrew Source</h3>
			<div class="ve-mb-2"><div class="ve-col-12 ve-flex-vh-center">${selExisting}</div></div>
			<div class="ve-col-12 ve-flex-vh-center">${btnBackExisting}${btnConfirmExisting}</div>
		</div></div>`
			.vee.appendTo(options.eleParent);
	}
}
