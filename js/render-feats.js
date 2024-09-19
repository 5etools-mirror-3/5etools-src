import {SITE_STYLE__CLASSIC} from "./consts.js";
import {VetoolsConfig} from "./utils-config/utils-config-config.js";
import {RenderPageImplBase} from "./render-page-base.js";

/** @abstract */
class _RenderFeatsImplBase extends RenderPageImplBase {
	_style;
	_page = UrlUtil.PG_FEATS;
	_dataProp = "feat";

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

			htmlPtEntries: this._getCommonHtmlParts_entries({ent, renderer}),
		};
	}

	/* ----- */

	_getCommonHtmlParts_prerequisites ({ent}) {
		const ptCategoryPrerequisite = Renderer.feat.getJoinedCategoryPrerequisites(
			ent.category,
			Renderer.utils.prerequisite.getHtml(ent.prerequisite, {styleHint: this._style}),
		);
		return ptCategoryPrerequisite ? `<tr><td colspan="6" class="pb-2 pt-0"><i>${ptCategoryPrerequisite}</i></td></tr>` : "";
	}

	/* ----- */

	_getCommonHtmlParts_entries ({ent, renderer}) {
		const stack = [];

		Renderer.feat.initFullEntries(ent);
		renderer.recursiveRender({entries: ent._fullEntries || ent.entries}, stack, {depth: 1});

		return stack.join("");
	}
}

class _RenderFeatsImplClassic extends _RenderFeatsImplBase {
	_style = SITE_STYLE__CLASSIC;

	/* -------------------------------------------- */

	_getHtmlParts (
		{
			ent,
			opts,
			renderer,
		},
	) {
		return {
			htmlPtRepeatable: this._getCommonHtmlParts_repeatable({ent}),
		};
	}

	/* ----- */

	_getCommonHtmlParts_repeatable ({ent}) {
		const ptRepeatable = Renderer.utils.getRepeatableHtml(ent);
		return ptRepeatable ? `<tr><td colspan="6">${ptRepeatable}</td></tr>` : "";
	}

	/* -------------------------------------------- */

	_getRendered ({ent, opts, renderer}) {
		const {
			htmlPtIsExcluded,
			htmlPtName,

			htmlPtPrerequisites,

			htmlPtEntries,

			htmlPtPage,
		} = this._getCommonHtmlParts({
			ent,
			opts,
			renderer,
		});
		const {
			htmlPtRepeatable,
		} = this._getHtmlParts({
			ent,
			opts,
			renderer,
		});

		return `
			${Renderer.utils.getBorderTr()}

			${htmlPtIsExcluded}
			${htmlPtName}
			
			${htmlPtPrerequisites}
			${htmlPtRepeatable}
		
			<tr><td colspan="6" class="py-0"><div class="ve-tbl-divider"></div></td></tr>
			
			<tr><td colspan="6">
				${htmlPtEntries}
			</td></tr>
			
			${htmlPtPage}
			${Renderer.utils.getBorderTr()}
		`;
	}
}

export class RenderFeats {
	static _RENDER_CLASSIC = new _RenderFeatsImplClassic();

	static $getRenderedFeat (ent) {
		const styleHint = VetoolsConfig.get("styleSwitcher", "style");
		switch (styleHint) {
			case SITE_STYLE__CLASSIC: return this._RENDER_CLASSIC.$getRendered(ent);
			default: throw new Error(`Unhandled style "${styleHint}"!`);
		}
	}
}
