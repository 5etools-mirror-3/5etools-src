/** @abstract */
export class RenderPageImplBase {
	_style;
	_page;
	_dataProp;

	getRendered (ent, opts) {
		opts ||= {};
		const renderer = Renderer.get().setFirstSection(true);

		return ee`${this._getRendered({ent, renderer, opts})}`;
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
			htmlPtName: this._getCommonHtmlParts_name({ent, opts}),

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

	/* -------------------------------------------- */

	_getRenderedSeeAlso (
		{
			renderer,
			ent,
			prop,
			tag,
		},
	) {
		if (!ent[prop]) return "";

		return `<div>${renderer.render(`{@note See also: ${ent[prop].map(uid => `{@${tag} ${uid.split("|").map((pt, i) => !i ? pt.toTitleCase() : pt).join("|")}}`).join(", ")}.}`)}</div>`;
	}
}
