"use strict";

class LanguagesSublistManager extends SublistManager {
	static _getRowTemplate () {
		return [
			new SublistCellTemplate({
				name: "Name",
				css: "ve-bold ve-col-8 ve-pl-1 ve-pr-0",
				colStyle: "",
			}),
			new SublistCellTemplate({
				name: "Type",
				css: "ve-col-2 ve-px-1 ve-text-center",
				colStyle: "ve-text-center",
			}),
			new SublistCellTemplate({
				name: "Script",
				css: "ve-col-2 ve-text-center ve-pl-1 ve-pr-0",
				colStyle: "ve-text-center",
			}),
		];
	}

	pGetSublistItem (it, hash) {
		const cellsText = [
			it.name,
			(it.type || "\u2014").uppercaseFirst(),
			(it.script || "\u2014").toTitleCase(),
		];

		const ele = ee`<div class="ve-lst__row ve-lst__row--sublist ve-flex-col">
			<a href="#${hash}" class="ve-lst__row-border ve-lst__row-inner">
				${this.constructor._getRowCellsHtml({values: cellsText})}
			</a>
		</div>`
			.onn("contextmenu", evt => this._handleSublistItemContextMenu(evt, listItem))
			.onn("click", evt => this._listSub.doSelect(listItem, evt));

		const listItem = new ListItem(
			hash,
			ele,
			it.name,
			{
				hash,
				page: it.page,
				type: it.type || "",
				script: it.script || "",
			},
			{
				entity: it,
				mdRow: [...cellsText],
			},
		);
		return listItem;
	}
}

class LanguagesPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterLanguages();
		super({
			dataSource: DataUtil.language.loadJSON.bind(DataUtil.language),

			pFnGetFluff: Renderer.language.pGetFluff.bind(Renderer.language),

			pageFilter,

			dataProps: ["language"],

			bookViewOptions: {
				nameSingular: "language",
				namePlural: "languages",
				pageTitle: "Languages Book View",
			},
		});
	}

	getListItem (it, anI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(it, isExcluded);

		const eleLi = document.createElement("div");
		eleLi.className = `ve-lst__row ve-flex-col ${isExcluded ? "ve-lst__row--blocklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(it.source);
		const hash = UrlUtil.autoEncodeHash(it);

		eleLi.innerHTML = `<a href="#${hash}" class="ve-lst__row-border ve-lst__row-inner">
			<span class="ve-col-6 ve-bold ve-pl-0 ve-pr-1">${it.name}</span>
			<span class="ve-col-2 ve-px-1 ve-text-center">${(it.type || "\u2014").uppercaseFirst()}</span>
			<span class="ve-col-2 ve-px-1 ve-text-center">${(it.script || "\u2014").toTitleCase()}</span>
			<span class="ve-col-2 ve-text-center ${Parser.sourceJsonToSourceClassname(it.source)} ve-pl-1 ve-pr-0" title="${Parser.sourceJsonToFull(it.source)}">${source}</span>
		</a>`;

		const listItem = new ListItem(
			anI,
			eleLi,
			it.name,
			{
				hash,
				source,
				page: it.page,
				dialects: it.dialects || [],
				type: it.type || "",
				script: it.script || "",
			},
			{
				isExcluded,
			},
		);

		eleLi.addEventListener("click", (evt) => this._list.doSelect(listItem, evt));
		eleLi.addEventListener("contextmenu", (evt) => this._openContextMenu(evt, this._list, listItem));

		return listItem;
	}

	_renderStats_doBuildStatsTab ({ent}) {
		this._pgContent.empty().appends(RenderLanguages.getRenderedLanguage(ent));
	}

	_renderStats_getTabMetasAdditional ({ent}) {
		return [
			new Renderer.utils.TabButton({
				label: "Fonts",
				fnPopulate: () => {
					this._pgContent.empty().appends(Renderer.utils.getBorderTr());
					this._pgContent.appends(Renderer.utils.getNameTr(ent));
					const td = ee`<td colspan="6" class="ve-pb-3"></td>`;
					ee`<tr>${td}</tr>`.appendTo(this._pgContent);
					this._pgContent.appends(Renderer.utils.getBorderTr());

					const allFonts = [...ent.fonts || [], ...ent._fonts || []];

					if (!allFonts || !allFonts.length) {
						td.appends("<i>No fonts available.</i>");
						return;
					}

					const styleFont = ee`<style></style>`;

					let lastStyleIndex = null;
					let lastStyleClass = null;
					const renderStyle = (ix) => {
						if (ix === lastStyleIndex) return;

						const font = allFonts[ix];
						const slugName = Parser.stringToSlug(font.split("/").last().split(".")[0]);

						const styleClass = `languages__sample--${slugName}`;

						styleFont.html(`
							@font-face { font-family: ${slugName}; src: url('${font}'); }
							.${styleClass} { font-family: ${slugName}, sans-serif; }
						`);

						if (lastStyleClass) ptOutput.removeClass(lastStyleClass);
						lastStyleClass = styleClass;
						ptOutput.addClass(styleClass);
						lastStyleIndex = ix;
					};

					const saveTextDebounced = MiscUtil.debounce((text) => StorageUtil.pSetForPage("sampleText", text), 500);
					const updateText = (val) => {
						if (val === undefined) val = iptSample.val();
						else iptSample.val(val);
						ptOutput.txt(val);
						saveTextDebounced(val);
					};

					const DEFAULT_TEXT = "The big quick brown flumph jumped over the lazy dire xorn";

					const iptSample = ee`<textarea class="ve-form-control ve-w-100 ve-mr-2 ve-resize-vertical font-ui ve-mb-2" style="height: 110px">${DEFAULT_TEXT}</textarea>`
						.onn("keyup", () => updateText())
						.onn("change", () => updateText());

					const selFont = allFonts.length === 1
						? null
						: ee`<select class="ve-form-control font-ui languages__sel-sample ve-input-xs">${allFonts.map((f, i) => `<option value="${i}">${f.split("/").last().split(".")[0]}</option>`).join("")}</select>`
							.onn("change", () => {
								const ix = Number(selFont.val());
								renderStyle(ix);
							});

					const ptOutput = ee`<pre class="languages__sample ve-p-2 ve-mb-0">${DEFAULT_TEXT}</pre>`;

					renderStyle(0);

					StorageUtil.pGetForPage("sampleText")
						.then(val => {
							if (val != null) updateText(val);
						});

					ee`<div class="ve-flex-col ve-w-100">
						${styleFont}
						${selFont ? ee`<label class="ve-flex-v-center ve-mb-2"><div class="ve-mr-2">Font:</div>${selFont}</div>` : ""}
						${iptSample}
						${ptOutput}
						<hr class="ve-hr-4">
						<h5 class="ve-mb-2 ve-mt-0">Downloads</h5>
						<ul class="ve-pl-5 ve-mb-0">
							${allFonts.map(f => `<li><a href="${f}" target="_blank">${f.split("/").last()}</a></li>`).join("")}
						</ul>
					</div>`.appendTo(td);
				},
				isVisible: [...ent.fonts || [], ...ent._fonts || []].length > 0,
			}),
		];
	}
}

const languagesPage = new LanguagesPage();
languagesPage.sublistManager = new LanguagesSublistManager();
window.addEventListener("load", () => languagesPage.pOnLoad());

globalThis.dbg_page = languagesPage;
