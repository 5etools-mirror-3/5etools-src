/** @abstract */
export class RenderPageImplBase {
	_style;
	_page;
	_dataProp;

	$getRendered (ent, opts) {
		opts ||= {};
		const renderer = Renderer.get().setFirstSection(true);

		return $(this._getRendered({ent, renderer, opts}));
	}

	/**
	 * @abstract
	 *
	 * @return string
	 */
	_getRendered ({ent, renderer, opts}) {
		throw new Error("Unimplemented!");
	}

	/* -------------------------------------------- */

	_getCommonHtmlParts (
		{
			ent,
			opts,
			renderer,
		},
	) {
		return {
			htmlPtIsExcluded: this._getCommonHtmlParts_isExcluded({ent, opts}),
			htmlPtName: this._getCommonHtmlParts_name({ent}),

			htmlPtPrerequisites: this._getCommonHtmlParts_prerequisites({ent}),

			htmlPtPage: this._getCommonHtmlParts_page({ent}),
		};
	}

	/* ----- */

	_getCommonHtmlParts_isExcluded ({ent, opts}) {
		if (opts.isSkipExcludesRender) return "";
		return Renderer.utils.getExcludedTr({entity: ent, dataProp: this._dataProp});
	}

	_getCommonHtmlParts_name ({ent}) {
		return Renderer.utils.getNameTr(ent, {page: this._page});
	}

	/* ----- */

	_getCommonHtmlParts_prerequisites ({ent}) {
		const pt = Renderer.utils.prerequisite.getHtml(ent.prerequisite, {styleHint: this._style});
		return pt ? `<tr><td colspan="6">${pt}</td></tr>` : "";
	}

	/* ----- */

	_getCommonHtmlParts_page ({ent}) {
		return Renderer.utils.getPageTr(ent);
	}
}
