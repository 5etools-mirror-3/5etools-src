import {ConverterUtils} from "./converterutils-utils.js";

export class ConverterUtilsMarkdown { // Or "CUM" for short.
	static _RE_LI_LEADING_SYMBOL = /^[-*]\s+/;

	static getCleanRaw (str) {
		return str.trim()
			.replace(/\s*<br\s*(\/)?>\s*/gi, " "); // remove <br>
	}

	static getNoDashStarStar (line) { return line.replace(/\**/g, "").replace(/^-/, "").trim(); }

	static getNoHashes (line) { return line.trim().replace(/^#*/, "").trim(); }

	static getNoTripleHash (line) { return line.replace(/^###/, "").trim(); }

	static getCleanTraitText (line) {
		const [name, text] = line.replace(/^\*\*\*?/, "").split(/\.?\s*\*\*\*?\.?/).map(it => it.trim());
		return [
			ConverterUtils.getCleanTraitActionName(name),
			text.replace(/\*Hit(\*:|:\*) /g, "Hit: "), // clean hit tags for later replacement
		];
	}

	static getNoLeadingSymbols (line) {
		const removeFirstInnerStar = line.trim().startsWith("*");
		const clean = line.replace(/^[^A-Za-z0-9]*/, "").trim();
		return removeFirstInnerStar ? clean.replace(/\*/, "") : clean;
	}

	/** It should really start with "***" but, homebrew. */
	static isInlineHeader (line) { return line.trim().startsWith("**"); }

	static isBlankLine (line) { return line === "" || line.toLowerCase() === "\\pagebreak" || line.toLowerCase() === "\\columnbreak"; }

	static isListItem (line) { return this._RE_LI_LEADING_SYMBOL.test(line); }

	static getNoLeadingListSymbol (line) { return line.replace(this._RE_LI_LEADING_SYMBOL, "").trim(); }
}
