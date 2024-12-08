import {SITE_STYLE__CLASSIC, SITE_STYLE__ONE} from "./consts.js";
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

			htmlPtRepeatable: this._getCommonHtmlParts_repeatable({ent}),

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

	_getCommonHtmlParts_repeatable ({ent}) {
		const ptRepeatable = Renderer.utils.getRepeatableHtml(ent);
		return ptRepeatable ? `<tr><td colspan="6">${ptRepeatable}</td></tr>` : "";
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

	_getRendered ({ent, opts, renderer}) {
		const {
			htmlPtIsExcluded,
			htmlPtName,

			htmlPtPrerequisites,
			htmlPtRepeatable,

			htmlPtEntries,

			htmlPtPage,
		} = this._getCommonHtmlParts({
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

class _RenderFeatsImplOne extends _RenderFeatsImplBase {
	_style = SITE_STYLE__ONE;

	/* -------------------------------------------- */

	_getRendered ({ent, opts, renderer}) {
		const {
			htmlPtIsExcluded,
			htmlPtName,

			htmlPtPrerequisites,
			htmlPtRepeatable,

			htmlPtEntries,

			htmlPtPage,
		} = this._getCommonHtmlParts({
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
	static _RENDER_ONE = new _RenderFeatsImplOne();

	static $getRenderedFeat (ent) {
		const styleHint = VetoolsConfig.get("styleSwitcher", "style");
		switch (styleHint) {
			case SITE_STYLE__CLASSIC: return this._RENDER_CLASSIC.$getRendered(ent);
			case SITE_STYLE__ONE: return this._RENDER_ONE.$getRendered(ent);
			default: throw new Error(`Unhandled style "${styleHint}"!`);
		}
	}
}
