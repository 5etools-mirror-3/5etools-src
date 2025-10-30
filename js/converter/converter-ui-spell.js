import {ConverterUiBase} from "./converter-ui-base.js";
import {ConverterSpell} from "./converter-spell.js";

export class SpellConverterUi extends ConverterUiBase {
	constructor ({ui, converterData}) {
		super(
			{
				ui,
				converterData,

				name: "Spell",
				converterId: "spell",
				canSaveLocal: true,
				modes: ["txt"],
				hasPageNumbers: true,
				titleCaseFields: ["name"],
				hasSource: true,
				prop: "spell",
			},
		);
	}

	_renderSidebar (parent, wrpSidebar) {
		wrpSidebar.empty();
	}

	handleParse (input, cbOutput, cbWarning, isAppend) {
		const opts = this._handleParse_getOpts({cbOutput, cbWarning, isAppend});

		switch (this._state.mode) {
			case "txt": return ConverterSpell.doParseText(input, opts);
			default: throw new Error(`Unimplemented!`);
		}
	}
}
