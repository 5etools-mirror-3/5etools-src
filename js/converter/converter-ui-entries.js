import {ConverterUiBase} from "./converter-ui-base.js";

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

	_renderSidebar (parent, wrpSidebar) {
		wrpSidebar.empty();
	}

	handleParse (input, cbOutput, cbWarning, isAppend) {
		const opts = this._handleParse_getOpts({cbOutput, cbWarning, isAppend});

		switch (this._state.mode) {
			case "md": return cbOutput(MarkdownConverter.getEntries(input));
			default: throw new Error(`Unimplemented!`);
		}
	}
}
