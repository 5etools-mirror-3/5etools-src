import {ConverterUiBase} from "./converter-ui-base.js";
import {ConverterFeat} from "./converter-feat.js";

export class FeatConverterUi extends ConverterUiBase {
	constructor ({ui, converterData}) {
		super(
			{
				ui,
				converterData,

				name: "Feat",
				converterId: "feat",
				canSaveLocal: true,
				modes: ["txt"],
				hasPageNumbers: true,
				titleCaseFields: ["name"],
				hasSource: true,
				prop: "feat",
			},
		);
	}

	_renderSidebar (parent, wrpSidebar) {
		wrpSidebar.empty();
	}

	handleParse (input, cbOutput, cbWarning, isAppend) {
		const opts = this._handleParse_getOpts({cbOutput, cbWarning, isAppend});

		switch (this._state.mode) {
			case "txt": return ConverterFeat.doParseText(input, opts);
			default: throw new Error(`Unimplemented!`);
		}
	}
}
