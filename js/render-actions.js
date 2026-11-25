import {RenderPageImplBase} from "./render-page-base.js";

class _RenderActionsImpl extends RenderPageImplBase {
	_page = UrlUtil.PG_ACTIONS;
	_dataProp = "action";

	_getRendered ({ent, opts, renderer}) {
		const {
			htmlPtIsExcluded,
			htmlPtName,
			htmlPtPage,
		} = this._getCommonHtmlParts({ent, opts, renderer});

		const htmlPtEntries = renderer.render({entries: ent.entries});
		const htmlPtFromVariant = ent.fromVariant
			? `<div>${renderer.render(`{@note This action is an optional addition to the game, from the optional/variant rule {@variantrule ${ent.fromVariant}}.}`)}</div>`
			: "";
		const htmlPtSeeAlso = this._getRenderedSeeAlso({renderer, ent, prop: "seeAlsoAction", tag: "action"});

		return `
			${Renderer.utils.getBorderTr()}
			${htmlPtIsExcluded}
			${htmlPtName}
			<tr><td colspan="6" class="ve-py-0"><div class="ve-tbl-divider"></div></td></tr>
			<tr><td colspan="6">
				${htmlPtEntries}
				${htmlPtFromVariant}
				${htmlPtSeeAlso}
			</td></tr>
			${htmlPtPage}
			${Renderer.utils.getBorderTr()}
		`;
	}
}

export class RenderActions {
	static _RENDER = new _RenderActionsImpl();

	static getRenderedAction (ent) {
		return this._RENDER.getRendered(ent);
	}
}
