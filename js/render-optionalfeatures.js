import {SITE_STYLE__CLASSIC, SITE_STYLE__ONE} from "./consts.js";
import {VetoolsConfig} from "./utils-config/utils-config-config.js";
import {RenderPageImplBase} from "./render-page-base.js";

/** @abstract */
class _RenderOptionalfeaturesImplBase extends RenderPageImplBase {
	_style;
	_page = UrlUtil.PG_OPT_FEATURES;
	_dataProp = "optionalfeature";

	/* -------------------------------------------- */

	_getCommonHtmlParts (
		{
			ent,
			renderer,
			opts,
		},
	) {
		return {
			...super._getCommonHtmlParts({ent, renderer, opts}),

			htmlPtCost: this._getCommonHtmlParts_cost({ent}),

			htmlPtEntries: this._getCommonHtmlParts_entries({ent, renderer}),

			htmlPtPreviouslyPrinted: this._getCommonHtmlParts_previouslyPrinted({ent}),
		};
	}

	/* ----- */

	_getCommonHtmlParts_prerequisites ({ent}) {
		const ptPrerequisites = Renderer.utils.prerequisite.getHtml(ent.prerequisite, {styleHint: this._style});
		return ptPrerequisites ? `<tr><td colspan="6" class="pt-0 ${this._style === SITE_STYLE__CLASSIC ? "" : "italic"}">${ptPrerequisites}</td></tr>` : "";
	}

	/* ----- */

	_getCommonHtmlParts_cost ({ent}) {
		const ptCost = Renderer.optionalfeature.getCostHtml(ent);
		return ptCost ? `<tr><td colspan="6" ${ent.prerequisite ? "" : `class="pt-0"`}>${ptCost}</td></tr>` : "";
	}

	/* ----- */

	_getCommonHtmlParts_entries ({ent, renderer}) {
		return renderer.render({entries: ent.entries}, 1);
	}

	/* ----- */

	_getCommonHtmlParts_previouslyPrinted ({ent}) {
		return Renderer.optionalfeature.getPreviouslyPrintedText(ent);
	}
}

class _RenderOptionalfeaturesImplClassic extends _RenderOptionalfeaturesImplBase {
	_style = SITE_STYLE__CLASSIC;

	_getRendered ({ent, renderer, opts}) {
		const {
			htmlPtIsExcluded,
			htmlPtName,

			htmlPtPrerequisites,

			htmlPtCost,

			htmlPtEntries,

			htmlPtPreviouslyPrinted,

			htmlPtPage,
		} = this._getCommonHtmlParts({
			ent,
			renderer,
			opts,
		});

		return `
			${Renderer.utils.getBorderTr()}

			${htmlPtIsExcluded}
			${htmlPtName}

			${htmlPtPrerequisites}

			${htmlPtCost}

			<tr><td colspan="6" class="py-0"><div class="ve-tbl-divider"></div></td></tr>

			<tr><td colspan="6">
				${htmlPtEntries}
			</td></tr>

			${htmlPtPreviouslyPrinted}
			${htmlPtPage}
			${Renderer.utils.getBorderTr()}
		`;
	}
}

class _RenderOptionalfeaturesImplOne extends _RenderOptionalfeaturesImplBase {
	_style = SITE_STYLE__ONE;

	_getRendered ({ent, renderer, opts}) {
		const {
			htmlPtIsExcluded,
			htmlPtName,

			htmlPtPrerequisites,

			htmlPtCost,

			htmlPtEntries,

			htmlPtPreviouslyPrinted,

			htmlPtPage,
		} = this._getCommonHtmlParts({
			ent,
			renderer,
			opts,
		});

		return `
			${Renderer.utils.getBorderTr()}

			${htmlPtIsExcluded}
			${htmlPtName}

			${htmlPtPrerequisites}

			${htmlPtCost}

			<tr><td colspan="6" ${htmlPtPrerequisites || htmlPtCost ? `class="pt-2"` : `class="pt-0"`}>
				${htmlPtEntries}
			</td></tr>

			${htmlPtPreviouslyPrinted}
			${htmlPtPage}
			${Renderer.utils.getBorderTr()}
		`;
	}
}

export class RenderOptionalFeatures {
	static _RENDER_CLASSIC = new _RenderOptionalfeaturesImplClassic();
	static _RENDER_ONE = new _RenderOptionalfeaturesImplOne();

	static getRenderedOptionalFeature (ent) {
		const styleHint = VetoolsConfig.get("styleSwitcher", "style");
		switch (styleHint) {
			case SITE_STYLE__CLASSIC: return this._RENDER_CLASSIC.getRendered(ent);
			case SITE_STYLE__ONE: return this._RENDER_ONE.getRendered(ent);
			default: throw new Error(`Unhandled style "${styleHint}"!`);
		}
	}
}
