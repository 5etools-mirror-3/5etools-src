import {ConverterUiBase} from "./converter-ui-base.js";
import {ConverterEntries} from "./converter-entries.js";

export class EntryConverterUi extends ConverterUiBase {
	constructor ({ui, converterData}) {
		super(
			{
				ui,
				converterData,

				name: "Generic",
				converterId: "generic",
				canSaveLocal: false,
				modes: ["md"],
				hasPageNumbers: false,
				hasSource: false,
			},
		);
	}

	handleParse (input, cbOutput, cbWarning, isAppend) {
		const opts = this._handleParse_getOpts({cbOutput, cbWarning, isAppend});

		switch (this._state.mode) {
			case "md": return cbOutput(ConverterEntries.doParseMarkdown(input, opts));
			default: throw new Error(`Unimplemented!`);
		}
	}
}
