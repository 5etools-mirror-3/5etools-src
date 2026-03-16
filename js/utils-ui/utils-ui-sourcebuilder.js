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
		options.eleParent.empty();
		options.mode = options.mode || "select";

		const isEditMode = options.mode === "edit";

		let jsonDirty = false;
		const iptName = ee`<input class="ve-form-control ve-ui-source__ipt-named">`
			.onn("keydown", evt => { if (evt.key === "Escape") iptName.blure(); })
			.onn("change", () => {
				if (!jsonDirty && !isEditMode) iptJson.val(iptName.val().replace(/[^-0-9a-zA-Z]/g, ""));
				iptName.removeClass("form-control--error");
			});
		if (options.source) iptName.val(options.source.full);
		const iptAbv = ee`<input class="ve-form-control ve-ui-source__ipt-named">`
			.onn("keydown", evt => { if (evt.key === "Escape") iptAbv.blure(); })
			.onn("change", () => {
				iptAbv.removeClass("form-control--error");
			});
		if (options.source) iptAbv.val(options.source.abbreviation);
		const iptJson = ee`<input class="ve-form-control ve-ui-source__ipt-named" ${isEditMode ? "disabled" : ""}>`
			.onn("keydown", evt => { if (evt.key === "Escape") iptJson.blure(); })
			.onn("change", () => {
				jsonDirty = true;
				iptJson.removeClass("form-control--error");
			});
		if (options.source) iptJson.val(options.source.json);
		const iptVersion = ee`<input class="ve-form-control ve-ui-source__ipt-named">`
			.onn("keydown", evt => { if (evt.key === "Escape") iptUrl.blure(); });
		if (options.source) iptVersion.val(options.source.version);

		let hasColor = false;
		const iptColor = ee`<input type="color" class="ve-w-100 ve-b-0">`
			.onn("keydown", evt => { if (evt.key === "Escape") iptColor.blure(); })
			.onn("change", () => hasColor = true);
		if (options.source?.color != null) { hasColor = true; iptColor.val(`#${options.source.color}`); }

		let hasColorNight = false;
		const iptColorNight = ee`<input type="color" class="ve-w-100 ve-b-0">`
			.onn("keydown", evt => { if (evt.key === "Escape") iptColorNight.blure(); })
			.onn("change", () => hasColorNight = true);
		if (options.source?.colorNight != null) { hasColorNight = true; iptColorNight.val(`#${options.source.colorNight}`); }

		const iptUrl = ee`<input class="ve-form-control ve-ui-source__ipt-named">`
			.onn("keydown", evt => { if (evt.key === "Escape") iptUrl.blure(); });
		if (options.source) iptUrl.val(options.source.url);
		const iptAuthors = ee`<input class="ve-form-control ve-ui-source__ipt-named">`
			.onn("keydown", evt => { if (evt.key === "Escape") iptAuthors.blure(); });
		if (options.source) iptAuthors.val((options.source.authors || []).join(", "));
		const iptConverters = ee`<input class="ve-form-control ve-ui-source__ipt-named">`
			.onn("keydown", evt => { if (evt.key === "Escape") iptConverters.blure(); });
		if (options.source) iptConverters.val((options.source.convertedBy || []).join(", "));

		const btnOk = ee`<button class="ve-btn ve-btn-primary">OK</button>`
			.onn("click", async () => {
				let incomplete = false;
				[iptName, iptAbv, iptJson].forEach(ipt => {
					const val = ipt.val();
					if (!val || !val.trim()) { incomplete = true; ipt.addClass("form-control--error"); }
				});
				if (incomplete) return;

				const jsonVal = iptJson.val().trim();
				if (!isEditMode && BrewUtil2.hasSourceJson(jsonVal)) {
					iptJson.addClass("form-control--error");
					JqueryUtil.doToast({content: `The JSON identifier "${jsonVal}" already exists!`, type: "danger"});
					return;
				}

				const source = {
					json: jsonVal,
					abbreviation: iptAbv.val().trim(),
					full: iptName.val().trim(),
					version: iptVersion.val().trim() || "1.0.0",
				};

				const url = iptUrl.val().trim();
				if (url) source.url = url;

				const authors = iptAuthors.val().trim().split(",").map(it => it.trim()).filter(Boolean);
				if (authors.length) source.authors = authors;

				const convertedBy = iptConverters.val().trim().split(",").map(it => it.trim()).filter(Boolean);
				if (convertedBy.length) source.convertedBy = convertedBy;

				if (hasColor) source.color = iptColor.val().trim().replace(/^#/, "");
				if (hasColorNight) source.colorNight = iptColorNight.val().trim().replace(/^#/, "");

				await options.cbConfirm(source, options.mode !== "edit");
			});

		const btnCancel = options.isRequired && !isEditMode
			? null
			: ee`<button class="ve-btn ve-btn-default ve-ml-2">Cancel</button>`
				.onn("click", () => options.cbCancel());

		const btnUseExisting = ee`<button class="ve-btn ve-btn-default">Use an Existing Source</button>`
			.onn("click", () => {
				stgInitial.hideVe();
				stgExisting.showVe();

				// cleanup
				[iptName, iptAbv, iptJson].forEach(ipt => ipt.removeClass("form-control--error"));
			});

		const stgInitial = ee`<div class="ve-h-100 ve-w-100 ve-flex-vh-center"><div class="ve-flex-col">
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

			${!isEditMode && BrewUtil2.getMetaLookup("sources")?.length ? ee`<div class="ve-flex-vh-center ve-mb-3 ve-mt-3"><span class="ve-ui-source__divider"></span>or<span class="ve-ui-source__divider"></span></div>
			<div class="ve-flex-vh-center">${btnUseExisting}</div>` : ""}
		</div></div>`
			.appendTo(options.eleParent);

		const selExisting = ee`<select class="ve-form-control ve-input-sm">
			<option disabled>Select</option>
			${(BrewUtil2.getMetaLookup("sources") || []).sort((a, b) => SortUtil.ascSortLower(a.full, b.full)).map(s => `<option value="${s.json.escapeQuotes()}">${s.full.escapeQuotes()}</option>`)}
		</select>`
			.onn("change", () => selExisting.removeClass("form-control--error"));
		selExisting.selectedIndex = 0;

		const btnConfirmExisting = ee`<button class="ve-btn ve-btn-default ve-btn-sm">Confirm</button>`
			.onn("click", async () => {
				if (selExisting.selectedIndex === 0) {
					selExisting.addClass("form-control--error");
					return;
				}

				const sourceJson = selExisting.val();
				const source = BrewUtil2.sourceJsonToSource(sourceJson);
				await options.cbConfirmExisting(source);

				// cleanup
				selExisting.selectedIndex = 0;
				stgExisting.hideVe();
				stgInitial.showVe();
			});

		const btnBackExisting = ee`<button class="ve-btn ve-btn-default ve-btn-sm ve-mr-2">Back</button>`
			.onn("click", () => {
				selExisting.selectedIndex = 0;
				stgExisting.hideVe();
				stgInitial.showVe();
			});

		const stgExisting = ee`<div class="ve-h-100 ve-w-100 ve-flex-vh-center ve-hidden"><div>
			<h3 class="ve-text-center">Select a Homebrew Source</h3>
			<div class="ve-mb-2"><div class="ve-col-12 ve-flex-vh-center">${selExisting}</div></div>
			<div class="ve-col-12 ve-flex-vh-center">${btnBackExisting}${btnConfirmExisting}</div>
		</div></div>`
			.appendTo(options.eleParent);
	}
}
