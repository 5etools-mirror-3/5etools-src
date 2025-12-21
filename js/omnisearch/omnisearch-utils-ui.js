import {OmnisearchBacking} from "./omnisearch-backing.js";
import {PARTNERED_CONTENT_MODE_NONE, PARTNERED_CONTENT_MODE_TEXT, PARTNERED_CONTENT_MODE_TOOLTIP, PARTNERED_CONTENT_MODES} from "./omnisearch-consts.js";

export class OmnisearchUtilsUi {
	static _isFauxPage (resultDoc) {
		return !!resultDoc.hx;
	}

	static getResultHref (resultDoc) {
		const isFauxPage = this._isFauxPage(resultDoc);
		if (isFauxPage) return null;
		return resultDoc.c === Parser.CAT_ID_PAGE ? resultDoc.u : `${Renderer.get().baseUrl}${UrlUtil.categoryToPage(resultDoc.c)}#${resultDoc.uh || resultDoc.u}`;
	}

	static getResultLink (resultDoc) {
		const isFauxPage = this._isFauxPage(resultDoc);

		if (isFauxPage) return ee`<span tabindex="0" ${resultDoc.h ? this._getResultLink_getHoverString(resultDoc.c, resultDoc.u, resultDoc.s, {isFauxPage}) : ""} class="omni__lnk-name help">${resultDoc.cf}: ${resultDoc.n}</span>`;

		const href = this.getResultHref(resultDoc);
		return ee`<a href="${href}" ${resultDoc.h ? this._getResultLink_getHoverString(resultDoc.c, resultDoc.u, resultDoc.s, {isFauxPage}) : ""} class="omni__lnk-name">${resultDoc.cf}: ${resultDoc.n}</a>`;
	}

	static _getResultLink_getHoverString (category, url, src, {isFauxPage = false} = {}) {
		return Renderer.hover.getHoverElementAttributes({
			page: UrlUtil.categoryToHoverPage(category),
			source: src,
			hash: url,
			isFauxPage,
		});
	}

	/* -------------------------------------------- */

	static bindBtnCyclePartneredMode ({btn, omnisearchState, fnDoSearch}) {
		btn
			.onn("click", () => {
				omnisearchState.setPartneredMode(PARTNERED_CONTENT_MODES.getNext(omnisearchState.getPartneredMode()));
			})
			.onn("contextmenu", evt => {
				evt.preventDefault();
				omnisearchState.setPartneredMode(PARTNERED_CONTENT_MODES.getPrevious(omnisearchState.getPartneredMode()));
			});

		omnisearchState.addHookPartnered((val) => {
			btn
				.tooltip(PARTNERED_CONTENT_MODE_TOOLTIP[omnisearchState.getPartneredMode()] || "")
				.txt(PARTNERED_CONTENT_MODE_TEXT[omnisearchState.getPartneredMode()])
				.toggleClass("active", omnisearchState.getPartneredMode() !== PARTNERED_CONTENT_MODE_NONE);
			if (val != null) fnDoSearch().then(null);
		})();
	}

	/* -------------------------------------------- */

	static addScrollTopFloat () {
		// "To top" button
		const btnToTop = ee`<button class="ve-btn ve-btn-sm ve-btn-default" title="To Top"><span class="glyphicon glyphicon-arrow-up"></span></button>`
			.onn("click", () => MiscUtil.scrollPageTop());

		const wrpTop = ee`<div class="bk__to-top no-print">
			${btnToTop}
		</div>`.appendTo(document.body);

		e_({ele: window})
			.onn("scroll", () => {
				wrpTop.toggleClass("bk__to-top--scrolled", window.scrollY > 50);
			});

		return wrpTop;
	}

	/* -------------------------------------------- */

	static doShowHelp ({isIncludeHotkeys = false} = {}) {
		const {$modalInner} = UiUtil.getShowModal({
			title: "Help",
			isMinHeight0: true,
			isUncappedHeight: true,
			isMaxWidth640p: true,
		});

		const ptCategoriesShort = Object.entries(OmnisearchBacking.getCategoryAliasesShort())
			.sort(([shortA], [shortB]) => SortUtil.ascSortLower(shortA, shortB))
			.map(([short, longs]) => {
				return `<li class="ve-flex">
					<span class="ve-inline-block min-w-60p ve-text-right"><code>in:${short}</code></span>
					<span class="mx-2">&rarr;</span>
					<span class="ve-flex-wrap">${longs.map(long => `<code>in:${long.toLowerCase()}</code>`).join("/")}</span>
				</li>`;
			})
			.join("");

		$modalInner.append(`
			<p>The following search syntax is available:</p>
			<ul>
				<li><code>source:&lt;abbreviation&gt;</code> where <code>&lt;abbreviation&gt;</code> is an abbreviated source/book name (&quot;PHB&quot;, &quot;MM&quot;, etc.)</li>
				<li><code>page:&lt;number&gt;</code> or <code>page:&lt;rangeStart&gt;-&lt;rangeEnd&gt;</code></li>
				<li>
					<code>in:&lt;category&gt;</code> where <code>&lt;category&gt;</code> can be &quot;spell&quot;, &quot;item&quot;, &quot;bestiary&quot;, etc.
					<br>
					The following short-hand <code>&lt;category&gt;</code> values are available:
				</li>
				<ul>
					${ptCategoriesShort}
				</ul>
			</ul>
			${this._doShowHelp_getPtHotkeys({isIncludeHotkeys})}
			<p>Syntax values may be inverted with a <code>!</code> prefix, for example <code>in:!bestiary</code>, or <code>page:!1-100</code>.</p>
		`);
	}

	static _doShowHelp_getPtHotkeys ({isIncludeHotkeys}) {
		if (!isIncludeHotkeys) return ``;

		const keysInput = [
			{keys: ["↵"], description: `Visit first result`},
			{keys: ["CTRL", "↵"], description: `<span>${Renderer.get().render(`View results in {@5etools search|search.html} page`)}</span>`},
			{keys: ["↓"], description: `Select first result`},
			{keys: ["PgUp"], description: `View previous results page`},
			{keys: ["PgDn"], description: `View next results page`},
		];

		const keysResults = [
			{keys: ["↑"], description: `Select previous result`},
			{keys: ["↓"], description: `Select next result`},
			{keys: ["←"], description: `Go to previous results page`},
			{keys: ["→"], description: `Go to next results page`},
			{keys: ["PgUp"], description: `Go to previous results page`},
			{keys: ["PgDn"], description: `Go to next results page`},
			{keys: ["Home"], description: `Go to first results page`},
			{keys: ["End"], description: `Go to last results page`},
		];

		const getPtKeys = keys => {
			return keys
				.map(({keys, description}) => {
					return `<div class="ve-flex">
					<span class="ve-inline-block min-w-60p ve-text-right">${keys.map(it => `<kbd>${it}</kbd>`).join("+")}</span>
					<span class="mx-2">&rarr;</span>
					<span class="ve-flex-wrap">${description}</span>
				</div>`;
				})
				.join("");
		};

		return `<hr class="hr-2">
		<div class="mb-1">The following hotkeys are available:</div>
		<div class="ml-2 mb-1"><i>When search input is focused:</i></div>
		<div class="pl-80p mb-2">${getPtKeys(keysInput)}</div>
		<div class="ml-2 mb-1"><i>When result link is focused:</i></div>
		<div class="pl-80p mb-2">${getPtKeys(keysResults)}</div>`;
	}
}
