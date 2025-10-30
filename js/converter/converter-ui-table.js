import {ConverterUiBase} from "./converter-ui-base.js";
import {ConverterTable} from "./converter-table.js";

export class TableConverterUi extends ConverterUiBase {
	constructor ({ui, converterData}) {
		super(
			{
				ui,
				converterData,

				name: "Table",
				converterId: "table",
				modes: ["html", "md"],
				prop: "table",
			},
		);
	}

	_renderSidebar (parent, wrpSidebar) {
		wrpSidebar.empty();
	}

	handleParse (input, cbOutput, cbWarning, isAppend) {
		const opts = this._handleParse_getOpts({cbOutput, cbWarning, isAppend});

		switch (this._state.mode) {
			case "html": return ConverterTable.doParseHtml(input, opts);
			case "md": return ConverterTable.doParseMarkdown(input, opts);
			default: throw new Error(`Unimplemented!`);
		}
	}
}
