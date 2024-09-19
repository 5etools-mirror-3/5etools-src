export class RenderItems {
	static _getRenderedSeeAlso (
		{
			item,
			prop,
			tag,
		},
	) {
		if (!item[prop]) return "";

		return `<div>${Renderer.get().render(`{@note See also: ${item[prop].map(it => `{@${tag} ${it}}`).join(", ")}.}`)}</div>`;
	}

	static $getRenderedItem (item) {
		const [damage, damageType, propertiesTxt] = Renderer.item.getDamageAndPropertiesText(item);
		const [typeRarityText, subTypeText, tierText] = Renderer.item.getTypeRarityAndAttunementText(item);

		let renderedText = Renderer.item.getRenderedEntries(item);
		renderedText += this._getRenderedSeeAlso({item, prop: "seeAlsoDeck", tag: "deck"});
		renderedText += this._getRenderedSeeAlso({item, prop: "seeAlsoVehicle", tag: "vehicle"});

		const textLeft = [Parser.itemValueToFullMultiCurrency(item), Parser.itemWeightToFull(item)].filter(Boolean).join(", ").uppercaseFirst();
		const textRight = [damage, damageType, propertiesTxt].filter(Boolean).join(" ");

		return $$`
			${Renderer.utils.getBorderTr()}
			${Renderer.utils.getExcludedTr({isExcluded: Renderer.item.isExcluded(item)})}
			${Renderer.utils.getNameTr(item, {page: UrlUtil.PG_ITEMS})}

			<tr><td class="rd-item__type-rarity-attunement" colspan="6">${Renderer.item.getTypeRarityAndAttunementHtml(typeRarityText, subTypeText, tierText)}</td></tr>

			${textLeft && textRight ? `<tr>
				<td colspan="2">${textLeft}</td>
				<td class="ve-text-right" colspan="4">${textRight}</td>
			</tr>` : `<tr><td colspan="6" class="${textRight ? "ve-text-right" : ""}">${textLeft || textRight}</td></tr>`}

			${renderedText ? `<tr><td colspan="6" class="py-0"><div class="ve-tbl-divider"></div></td></tr>
			<tr><td colspan="6">${renderedText}</td></tr>` : ""}
			${Renderer.utils.getPageTr(item)}
			${Renderer.utils.getBorderTr()}
		`;
	}
}
