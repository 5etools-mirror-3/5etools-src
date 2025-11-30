import {ConverterUiBase} from "./converter-ui-base.js";
import {ConverterRace} from "./converter-race.js";

export class RaceConverterUi extends ConverterUiBase {
	constructor ({ui, converterData}) {
		super(
			{
				ui,
				converterData,

				name: "Species",
				converterId: "race",
				canSaveLocal: true,
				modes: ["txt", "md"],
				hasPageNumbers: true,
				titleCaseFields: ["name"],
				hasSource: true,
				prop: "race",
			},
		);
	}

	_renderSidebar (parent, wrpSidebar) {
		wrpSidebar.empty();
	}

	handleParse (input, cbOutput, cbWarning, isAppend) {
		const opts = this._handleParse_getOpts({cbOutput, cbWarning, isAppend});

		switch (this._state.mode) {
			case "txt": return ConverterRace.doParseText(input, opts);
			case "md": return ConverterRace.doParseMarkdown(input, opts);
			default: throw new Error(`Unimplemented!`);
		}
	}
}
