import {ConverterUiBase} from "./converter-ui-base.js";
import {ConverterCreature} from "./converter-creature.js";

export class CreatureConverterUi extends ConverterUiBase {
	constructor ({ui, converterData}) {
		super(
			{
				ui,
				converterData,

				name: "Creature",
				converterId: "monster",
				canSaveLocal: true,
				modes: ["txt", "md"],
				hasPageNumbers: true,
				titleCaseFields: ["name"],
				hasSource: true,
				prop: "monster",
			},
		);
	}

	handleParse (input, cbOutput, cbWarning, isAppend) {
		const opts = this._handleParse_getOpts({cbOutput, cbWarning, isAppend});

		switch (this._state.mode) {
			case "txt": return ConverterCreature.doParseText(input, opts);
			case "md": return ConverterCreature.doParseMarkdown(input, opts);
			default: throw new Error(`Unimplemented!`);
		}
	}
}
