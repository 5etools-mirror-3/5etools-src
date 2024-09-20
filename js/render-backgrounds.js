import {SITE_STYLE__CLASSIC, SITE_STYLE__ONE} from "./consts.js";
import {VetoolsConfig} from "./utils-config/utils-config-config.js";
import {RenderPageImplBase} from "./render-page-base.js";

/** @abstract */
class _RenderBackgroundsImplBase extends RenderPageImplBase {
	_style;
	_page = UrlUtil.PG_BACKGROUNDS;
	_dataProp = "background";

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

	_getCommonHtmlParts_entries ({ent, renderer}) {
		const stack = [];

		renderer.recursiveRender({type: "entries", entries: ent.entries}, stack);

		return stack.join("");
	}
}

class _RenderBackgroundsImplClassic extends _RenderBackgroundsImplBase {
	_style = SITE_STYLE__CLASSIC;

	_getRendered ({ent, opts, renderer}) {
		const {
			htmlPtIsExcluded,
			htmlPtName,

			htmlPtPrerequisites,

			htmlPtEntries,

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
		
			<tr><td colspan="6" class="py-0"><div class="ve-tbl-divider"></div></td></tr>
			
			<tr><td colspan="6">
				${htmlPtEntries}
			</td></tr>
			
			${htmlPtPage}
			${Renderer.utils.getBorderTr()}
		`;
	}
}

class _RenderBackgroundsImplOne extends _RenderBackgroundsImplBase {
	_style = SITE_STYLE__ONE;

	_getRendered ({ent, opts, renderer}) {
		const {
			htmlPtIsExcluded,
			htmlPtName,

			htmlPtPrerequisites,

			htmlPtEntries,

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
		
			<tr><td colspan="6" class="pt-0">
				${htmlPtEntries}
			</td></tr>
			
			${htmlPtPage}
			${Renderer.utils.getBorderTr()}
		`;
	}
}

export class RenderBackgrounds {
	static _RENDER_CLASSIC = new _RenderBackgroundsImplClassic();
	static _RENDER_ONE = new _RenderBackgroundsImplOne();

	static $getRenderedBackground (ent) {
		const styleHint = VetoolsConfig.get("styleSwitcher", "style");
		switch (styleHint) {
			case SITE_STYLE__CLASSIC: return this._RENDER_CLASSIC.$getRendered(ent);
			case SITE_STYLE__ONE: return this._RENDER_ONE.$getRendered(ent);
			default: throw new Error(`Unhandled style "${styleHint}"!`);
		}
	}
}
