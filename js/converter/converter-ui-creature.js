import {ConverterUiBase} from "./converter-ui-base.js";
import {ConverterUiUtil} from "./converter-ui-utils.js";
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

	_renderSidebar (parent, wrpSidebar) {
		wrpSidebar.empty();

		ee`<div class="w-100 split-v-center">
			<small>This parser is <span class="help" title="It is notably poor at handling text split across multiple lines, as Carriage Return is used to separate blocks of text.">very particular</span> about its input. Use at your own risk.</small>
		</div>`.appendTo(wrpSidebar);

		ConverterUiUtil.renderSideMenuDivider(wrpSidebar);
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
