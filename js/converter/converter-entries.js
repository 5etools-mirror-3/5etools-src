import {ConverterBase} from "./converter-base.js";
import {TagJsons} from "./converterutils-entries.js";

export class ConverterEntries extends ConverterBase {
	/**
	 * Parses feats from raw text pastes
	 * @param inText Input text.
	 * @param options Options object.
	 * @param options.cbWarning Warning callback.
	 * @param options.cbOutput Output callback.
	 * @param options.isAppend Default output append mode.
	 * @param options.source Entity source.
	 * @param options.page Entity page.
	 * @param options.titleCaseFields Array of fields to be title-cased in this entity (if enabled).
	 * @param options.isTitleCase Whether title-case fields should be title-cased in this entity.
	 * @param options.styleHint
	 */
	static doParseMarkdown (inText, options) {
		options = this._getValidOptions(options);

		const entries = MarkdownConverter.getEntries(inText);

		TagJsons.mutTagObject(entries, {styleHint: options.styleHint});

		options.cbOutput(entries, options.isAppend);

		return entries;
	}
}
