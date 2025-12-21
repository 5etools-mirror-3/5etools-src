import {SITE_STYLE__CLASSIC, SITE_STYLE__ONE} from "./consts.js";
import {VetoolsConfig} from "./utils-config/utils-config-config.js";
import {RenderPageImplBase} from "./render-page-base.js";

/** @abstract */
class _RenderItemsImplBase extends RenderPageImplBase {
	_style;
	_page = UrlUtil.PG_ITEMS;
	_dataProp = "item";

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

			htmlPtTypeRarityAttunement: this._getCommonHtmlParts_typeRarityAttunement({ent, renderer}),
			htmlPtTextLeftRight: this._getCommonHtmlParts_textLeftRight({ent, renderer}),

			htmlPtEntries: this._getCommonHtmlParts_entries({ent, renderer}),
		};
	}

	/* ----- */

	_getCommonHtmlParts_textLeftRight ({ent, renderer}) {
		const [ptDamage, ptProperties] = Renderer.item.getRenderedDamageAndProperties(ent);
		const ptMastery = Renderer.item.getRenderedMastery(ent);

		const textLeft = [Parser.itemValueToFullMultiCurrency(ent, {styleHint: this._style}), Parser.itemWeightToFull(ent)].filter(Boolean).join(", ").uppercaseFirst();
		const textRight = [
			ptDamage,
			ptProperties,
			ptMastery,
		]
			.filter(Boolean)
			.map(pt => `<div class="ve-text-wrap-balance ve-text-right">${pt.uppercaseFirst()}</div>`)
			.join("");

		return textLeft && textRight
			? `<tr>
				<td colspan="2">${textLeft}</td>
				<td class="ve-text-right" colspan="4">${textRight}</td>
			</tr>`
			: `<tr>
				<td colspan="6">${textLeft || textRight}</td>
			</tr>`;
	}

	/* ----- */

	_getCommonHtmlParts_typeRarityAttunement ({ent, renderer}) {
		const {typeRarityHtml, subTypeHtml, tierHtml} = Renderer.item.getTypeRarityAndAttunementHtmlParts(ent, {styleHint: this._style});

		return `<tr>
			<td class="rd-item__type-rarity-attunement" colSpan="6">${Renderer.item.getTypeRarityAndAttunementHtml({typeRarityHtml, subTypeHtml, tierHtml}, {styleHint: this._style})}</td>
		</tr>`;
	}

	/* ----- */

	_getRenderedSeeAlso (
		{
			ent,
			prop,
			tag,
		},
	) {
		if (!ent[prop]) return "";

		return `<div>${Renderer.get().render(`{@note See also: ${ent[prop].map(it => `{@${tag} ${it}}`).join(", ")}.}`)}</div>`;
	}

	_getCommonHtmlParts_entries ({ent, renderer}) {
		let renderedText = Renderer.item.getRenderedEntries(ent);
		renderedText += this._getRenderedSeeAlso({ent, prop: "seeAlsoDeck", tag: "deck"});
		renderedText += this._getRenderedSeeAlso({ent, prop: "seeAlsoVehicle", tag: "vehicle"});

		return renderedText ? `<tr><td colspan="6" class="py-0"><div class="ve-tbl-divider"></div></td></tr>
			<tr><td colspan="6">${renderedText}</td></tr>` : "";
	}
}

class _RenderItemsImplClassic extends _RenderItemsImplBase {
	_style = SITE_STYLE__CLASSIC;

	_getRendered ({ent, opts, renderer}) {
		const {
			htmlPtIsExcluded,
			htmlPtName,

			htmlPtTypeRarityAttunement,
			htmlPtTextLeftRight,

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

			${htmlPtTypeRarityAttunement}
			${htmlPtTextLeftRight}

			${htmlPtEntries}

			${htmlPtPage}
			${Renderer.utils.getBorderTr()}
		`;
	}
}

class _RenderItemsImplOne extends _RenderItemsImplBase {
	_style = SITE_STYLE__ONE;

	_getRendered ({ent, opts, renderer}) {
		const {
			htmlPtIsExcluded,
			htmlPtName,

			htmlPtTypeRarityAttunement,
			htmlPtTextLeftRight,

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

			${htmlPtTypeRarityAttunement}
			${htmlPtTextLeftRight}

			${htmlPtEntries}

			${htmlPtPage}
			${Renderer.utils.getBorderTr()}
		`;
	}
}

export class RenderItems {
	static _RENDER_CLASSIC = new _RenderItemsImplClassic();
	static _RENDER_ONE = new _RenderItemsImplOne();

	static getRenderedItem (ent) {
		const styleHint = VetoolsConfig.get("styleSwitcher", "style");
		switch (styleHint) {
			case SITE_STYLE__CLASSIC: return this._RENDER_CLASSIC.getRendered(ent);
			case SITE_STYLE__ONE: return this._RENDER_ONE.getRendered(ent);
			default: throw new Error(`Unhandled style "${styleHint}"!`);
		}
	}
}
