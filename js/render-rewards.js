import {RenderPageImplBase} from "./render-page-base.js";

class _RenderRewardsImpl extends RenderPageImplBase {
	_page = UrlUtil.PG_REWARDS;
	_dataProp = "reward";

	_getRendered ({ent, opts, renderer}) {
		const {
			htmlPtIsExcluded,
			htmlPtName,
			htmlPtPage,
		} = this._getCommonHtmlParts({ent, opts, renderer});

		const htmlPtSeeAlso = this._getRenderedSeeAlso({renderer, ent, prop: "seeAlsoFacility", tag: "facility"});

		return `
		${Renderer.utils.getBorderTr()}
			${htmlPtIsExcluded}
			${htmlPtName}
			${Renderer.reward.getRenderedString(ent)}
			${htmlPtSeeAlso ? `<tr><td colspan="6">${htmlPtSeeAlso}</td></tr>` : ""}
			${htmlPtPage}
			${Renderer.utils.getBorderTr()}
		`;
	}
}

export class RenderRewards {
	static _RENDER = new _RenderRewardsImpl();

	static getRenderedReward (ent) {
		return this._RENDER.getRendered(ent);
	}
}
