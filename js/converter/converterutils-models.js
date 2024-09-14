import {ConverterUtilsMarkdown} from "./converterutils-markdown.js";

class _ConversionStateBase {
	constructor (
		{
			toConvert,
			options,
			entity,
		},
	) {
		this.curLine = null;
		this.ixToConvert = 0;
		this.stage = "name";
		this.toConvert = toConvert;
		this.options = options;
		this.entity = entity;
	}

	doPreLoop () {
		// No-op
	}

	doPostLoop () {
		this.ixToConvert = 0;
	}

	initCurLine () {
		this.curLine = this.toConvert[this.ixToConvert].trim();
	}

	_isSkippableLine () { throw new Error("Unimplemented!"); }

	isSkippableCurLine () { return this._isSkippableLine(this.curLine); }
}

export class ConversionStateTextBase extends _ConversionStateBase {
	_isSkippableLine (l) { return l.trim() === ""; }

	getNextLineMeta () {
		for (let i = this.ixToConvert + 1; i < this.toConvert.length; ++i) {
			const l = this.toConvert[i]?.trim();
			if (this._isSkippableLine(l)) continue;
			return {ixToConvertNext: i, nxtLine: l};
		}
		return null;
	}
}

export class ConversionStateMarkdownBase extends _ConversionStateBase {
	_isSkippableLine (l) { return ConverterUtilsMarkdown.isBlankLine(l); }
}
