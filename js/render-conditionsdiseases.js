import {SITE_STYLE__CLASSIC, SITE_STYLE__ONE} from "./consts.js";
import {VetoolsConfig} from "./utils-config/utils-config-config.js";
import {RenderPageImplBase} from "./render-page-base.js";

/** @abstract */
class _RenderConditionDiseaseStatusImplBase extends RenderPageImplBase {
	_getCommonHtmlParts (
		{
			ent,
			renderer,
			opts,
		},
	) {
		return {
			...super._getCommonHtmlParts({ent, renderer, opts}),

			htmlPtType: this._getCommonHtmlParts_type({ent, renderer}),

			htmlPtEntries: this._getCommonHtmlParts_entries({ent, renderer}),
		};
	}

	/* ----- */

	_getCommonHtmlParts_type ({ent, renderer}) {
		return ent.type ? `<tr><td colspan="6" class="pb-2 pt-0">${renderer.render(`{@i ${ent.type}}`)}</td></tr>` : "";
	}

	/* ----- */

	_getCommonHtmlParts_entries ({ent, renderer}) {
		return renderer.render({entries: ent.entries});
	}

	/* -------------------------------------------- */

	_getRendered ({ent, renderer, opts}) {
		const {
			htmlPtIsExcluded,
			htmlPtName,

			htmlPtType,

			htmlPtEntries,

			htmlPtPage,
		} = this._getCommonHtmlParts({
			ent,
			renderer,
			opts,
		});

		const ptDivider = this._style === SITE_STYLE__CLASSIC ? `<tr><td colspan="6" class="py-0"><div class="ve-tbl-divider"></div></td></tr>` : "";

		return `
			${Renderer.utils.getBorderTr()}
			${htmlPtIsExcluded}
			${htmlPtName}
			${htmlPtType}
			${ptDivider}
			<tr><td colspan="6">${htmlPtEntries}</td></tr>
			${htmlPtPage}
			${Renderer.utils.getBorderTr()}
		`;
	}
}

/** @abstract */
class _RenderConditionImplBase extends _RenderConditionDiseaseStatusImplBase {
	_page = UrlUtil.PG_CONDITIONS_DISEASES;
	_dataProp = "condition";
}

/** @abstract */
class _RenderDiseaseImplBase extends _RenderConditionDiseaseStatusImplBase {
	_page = UrlUtil.PG_CONDITIONS_DISEASES;
	_dataProp = "disease";
}

/** @abstract */
class _RenderStatusImplBase extends _RenderConditionDiseaseStatusImplBase {
	_page = UrlUtil.PG_CONDITIONS_DISEASES;
	_dataProp = "status";
}

class _RenderConditionImplClassic extends _RenderConditionImplBase {
	_style = SITE_STYLE__CLASSIC;
}

class _RenderConditionImplOne extends _RenderConditionImplBase {
	_style = SITE_STYLE__ONE;
}

class _RenderDiseasesImplClassic extends _RenderDiseaseImplBase {
	_style = SITE_STYLE__CLASSIC;
}

class _RenderDiseasesImplOne extends _RenderDiseaseImplBase {
	_style = SITE_STYLE__ONE;
}

class _RenderStatusImplClassic extends _RenderStatusImplBase {
	_style = SITE_STYLE__CLASSIC;
}

class _RenderStatusImplOne extends _RenderStatusImplBase {
	_style = SITE_STYLE__ONE;
}

export class RenderConditionDiseases {
	static _RENDER_CLASSIC__CONDITION = new _RenderConditionImplClassic();
	static _RENDER_ONE__CONDITION = new _RenderConditionImplOne();
	static _RENDER_CLASSIC__DISEASE = new _RenderDiseasesImplClassic();
	static _RENDER_ONE__DISEASE = new _RenderDiseasesImplOne();
	static _RENDER_CLASSIC__STATUS = new _RenderStatusImplClassic();
	static _RENDER_ONE__STATUS = new _RenderStatusImplOne();

	static $getRenderedConditionDisease (ent) {
		const styleHint = VetoolsConfig.get("styleSwitcher", "style");

		switch (ent.__prop) {
			case "condition": {
				switch (styleHint) {
					case SITE_STYLE__CLASSIC: return this._RENDER_CLASSIC__CONDITION.$getRendered(ent);
					case SITE_STYLE__ONE: return this._RENDER_ONE__CONDITION.$getRendered(ent);
					default: throw new Error(`Unhandled style "${styleHint}"!`);
				}
			}
			case "disease": {
				switch (styleHint) {
					case SITE_STYLE__CLASSIC: return this._RENDER_CLASSIC__DISEASE.$getRendered(ent);
					case SITE_STYLE__ONE: return this._RENDER_ONE__DISEASE.$getRendered(ent);
					default: throw new Error(`Unhandled style "${styleHint}"!`);
				}
			}
			case "status": {
				switch (styleHint) {
					case SITE_STYLE__CLASSIC: return this._RENDER_CLASSIC__STATUS.$getRendered(ent);
					case SITE_STYLE__ONE: return this._RENDER_ONE__STATUS.$getRendered(ent);
					default: throw new Error(`Unhandled style "${styleHint}"!`);
				}
			}
			default: throw new Error(`Unhandled prop "${ent.__prop}"!`);
		}
	}
}
