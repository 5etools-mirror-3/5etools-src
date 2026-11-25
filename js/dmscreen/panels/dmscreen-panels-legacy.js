// TODO(Future) migrate to panelapp
export class AdventureOrBookView {
	constructor (prop, panel, loader, tabIx, contentMeta) {
		this._prop = prop;
		this._panel = panel;
		this._loader = loader;
		this._tabIx = tabIx;
		this._contentMeta = contentMeta;

		this._wrpContent = null;
		this._wrpContentOuter = null;
		this._titlePrev = null;
		this._titleNext = null;
	}

	getEle () {
		this._titlePrev = veT`<div class="dm-book__controls-title ve-overflow-ellipsis ve-text-right"></div>`;
		this._titleNext = veT`<div class="dm-book__controls-title ve-overflow-ellipsis"></div>`;

		const btnPrev = veT`<button class="ve-btn ve-btn-xs ve-btn-default ve-mr-2" title="Previous Chapter"><span class="glyphicon glyphicon-chevron-left"></span></button>`
			.vee.onn("click", () => this._handleButtonClick(-1));
		const btnNext = veT`<button class="ve-btn ve-btn-xs ve-btn-default" title="Next Chapter"><span class="glyphicon glyphicon-chevron-right"></span></button>`
			.vee.onn("click", () => this._handleButtonClick(1));

		this._wrpContent = veT`<div class="ve-h-100"></div>`;
		this._wrpContentOuter = veT`<div class="ve-h-100 dm-book__wrp-content">
			<table class="ve-w-100 ve-stats ve-stats--book ve-stats--book-hover"><tr><td colspan="6" class="ve-pb-3">${this._wrpContent}</td></tr></table>
		</div>`;

		const wrp = veT`<div class="ve-flex-col ve-h-100">
		${this._wrpContentOuter}
		<div class="ve-flex ve-no-shrink dm-book__wrp-controls">${this._titlePrev}${btnPrev}${btnNext}${this._titleNext}</div>
		</div>`;

		// assumes the data has already been loaded/cached
		this._render();

		return wrp;
	}

	_handleButtonClick (direction) {
		this._contentMeta.c += direction;
		const hasRenderedData = this._render({isSkipMissingData: true});
		if (!hasRenderedData) this._contentMeta.c -= direction;
		else {
			this._wrpContentOuter.vee.scrollTop(0);
			this._panel.board.doSaveStateDebounced();
		}
	}

	_getData (chapter, {isAllowMissing = false} = {}) {
		return this._loader.getFromCache(this._contentMeta[this._prop], chapter, {isAllowMissing});
	}

	static _PROP_TO_URL = {
		"a": UrlUtil.PG_ADVENTURE,
		"b": UrlUtil.PG_BOOK,
	};

	_render ({isSkipMissingData = false} = {}) {
		const hasData = !!this._getData(this._contentMeta.c, {isAllowMissing: true});
		if (!hasData && isSkipMissingData) return false;

		const {head, chapter} = this._getData(this._contentMeta.c);

		this._panel.setTabTitle(this._tabIx, chapter.name);
		const stack = [];
		const page = this.constructor._PROP_TO_URL[this._prop];
		Renderer
			.get()
			.setFirstSection(true)
			.recursiveRender(
				chapter,
				stack,
				{
					adventureBookPage: page,
					adventureBookSource: head.source,
					adventureBookHash: UrlUtil.URL_TO_HASH_BUILDER[page]({id: this._contentMeta[this._prop]}),
				},
			);
		this._wrpContent.vee.empty().vee.html(stack);

		const dataPrev = this._getData(this._contentMeta.c - 1, {isAllowMissing: true});
		const dataNext = this._getData(this._contentMeta.c + 1, {isAllowMissing: true});
		this._titlePrev.vee.txt(dataPrev?.name || "").vee.tooltip(dataPrev?.name || "");
		this._titleNext.vee.txt(dataNext?.name || "").vee.tooltip(dataNext?.name || "");

		return hasData;
	}
}
