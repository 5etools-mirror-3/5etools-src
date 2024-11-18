import {SITE_STYLE__ONE} from "./consts.js";
import {RenderPageImplBase} from "./render-page-base.js";

/** @abstract */
class _RenderFacilitiesImplBase extends RenderPageImplBase {
	_style;
	_page = UrlUtil.PG_BASTIONS;
	_dataProp = "facility";

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
		if (ent.level == null) return "";
		return `<tr><td colspan="6" class="pb-2 pt-0"><i>Level ${ent.level} Bastion Facility</i></td></tr>`;
	}

	/* ----- */

	_getCommonHtmlParts_entries ({ent, renderer}) {
		const entriesMeta = Renderer.facility.getFacilityRenderableEntriesMeta(ent);
		return entriesMeta.entriesDescription.map(entry => `<div class="my-1p">${renderer.render(entry, 2)}</div>`).join("");
	}
}

class _RenderFacilitiesImplOne extends _RenderFacilitiesImplBase {
	_style = SITE_STYLE__ONE;

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

		return `
			${Renderer.utils.getBorderTr()}

			${htmlPtIsExcluded}
			${htmlPtName}
			
			${htmlPtPrerequisites}
			
			<tr><td colspan="6">
				${htmlPtEntries}
			</td></tr>
			
			${htmlPtPage}
			${Renderer.utils.getBorderTr()}
		`;
	}
}

export class RenderBastions {
	static _RENDER_ONE__FACILITIES = new _RenderFacilitiesImplOne();

	static $getRenderedFacility (ent) {
		return this._RENDER_ONE__FACILITIES.$getRendered(ent);
	}
}
