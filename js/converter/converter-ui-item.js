import {ConverterUiBase} from "./converter-ui-base.js";
import {ConverterItem} from "./converter-item.js";

export class ItemConverterUi extends ConverterUiBase {
	constructor (ui) {
		super(
			ui,
			{
				name: "Item",
				converterId: "item",
				canSaveLocal: true,
				modes: ["txt"],
				hasPageNumbers: true,
				titleCaseFields: ["name"],
				hasSource: true,
				prop: "item",
			},
		);
	}

	_renderSidebar (parent, $wrpSidebar) {
		$wrpSidebar.empty();
	}

	handleParse (input, cbOutput, cbWarning, isAppend) {
		const opts = this._handleParse_getOpts({cbOutput, cbWarning, isAppend});

		switch (this._state.mode) {
			case "txt": return ConverterItem.doParseText(input, opts);
			default: throw new Error(`Unimplemented!`);
		}
	}

	_getSample (format) {
		switch (format) {
			case "txt": return ItemConverterUi._SAMPLE_TEXT;
			default: throw new Error(`Unknown format "${format}"`);
		}
	}
}
// region sample
ItemConverterUi._SAMPLE_TEXT = `Wreath of the Prism
Wondrous Item, legendary (requires attunement)
This loop of golden thorns is inset with dozens of gems representing the five colors of Tiamat.
Dormant
While wearing the wreath in its dormant state, you have darkvision out to a range of 60 feet. If you already have darkvision, wearing the wreath increases the range of your darkvision by 60 feet.
When you hit a beast, dragon, or monstrosity of challenge rating 5 or lower with an attack, or when you grapple it, you can use the wreath to cast dominate monster on the creature (save DC 13). On a successful save, the target is immune to the power of the wreath for 24 hours. On a failure, a shimmering, golden image of the wreath appears as a collar around the target’s neck or as a crown on its head (your choice) until it is no longer charmed by the spell. If you use the wreath to charm a second creature, the first spell immediately ends. When the spell ends, the target knows it was charmed by you.
Awakened
Once the Wreath of the Prism reaches an awakened state, it gains the following benefits:
• You can affect creatures of challenge rating 10 or lower with the wreath.
• The save DC of the wreath’s spell increases to 15.
Exalted
Once the Wreath of the Prism reaches an exalted state, it gains the following benefits:
• You can affect creatures of challenge rating 15 or lower with the wreath.
• The save DC of the wreath’s spell increases to 17.`;
// endregion
