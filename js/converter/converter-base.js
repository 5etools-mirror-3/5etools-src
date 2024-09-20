import {ConverterConst} from "./converterutils-const.js";
import {VetoolsConfig} from "../utils-config/utils-config-config.js";

export class ConverterBase {
	static _getValidOptions (options) {
		options = options || {};
		if (!options.cbWarning || !options.cbOutput) throw new Error(`Missing required callback options!`);
		options.styleHint ||= VetoolsConfig.get("styleSwitcher", "style");
		return options;
	}

	/* -------------------------------------------- */

	static _getAsTitle (prop, line, titleCaseFields, isTitleCase) {
		return titleCaseFields && titleCaseFields.includes(prop) && isTitleCase
			? line.toLowerCase().toTitleCase()
			: line;
	}

	/* -------------------------------------------- */

	static _getCleanInput (ipt, options = null) {
		let iptClean = ipt
			.replace(/\n\r/g, "\n")
			.replace(/\r\n/g, "\n")
			.replace(/\r/g, "\n")
			.replace(/­\s*\n\s*/g, "") // Soft hyphen
			.replace(/\s*\u00A0\s*/g, " ") // Non-breaking space
			.replace(/[−–‒]/g, "-") // convert minus signs to hyphens
		;

		iptClean = CleanUtil.getCleanString(iptClean, {isFast: false})
			// Ensure CR always has a space before the dash
			.replace(/(Challenge)([-\u2012-\u2014\u2212])/, "$1 $2");

		// Connect together words which are divided over two lines
		iptClean = iptClean
			.replace(/((?: | "| \()[A-Za-z][a-z]+)- *\n([a-z]{2})/g, "$1$2");

		// Connect line-broken parentheses
		iptClean = this._getCleanInput_parens(iptClean, "(", ")");
		iptClean = this._getCleanInput_parens(iptClean, "[", "]");
		iptClean = this._getCleanInput_parens(iptClean, "{", "}");

		iptClean = this._getCleanInput_quotes(iptClean, `"`, `"`);

		// Connect lines ending in, or starting in, a comma
		iptClean = iptClean
			.replace(/, *\n+ */g, ", ")
			.replace(/ *\n+, */g, ", ");

		iptClean = iptClean
			// Connect together e.g. `5d10\nForce damage`
			.replace(new RegExp(`(?<start>\\d+) *\\n+(?<end>${ConverterConst.STR_RE_DAMAGE_TYPE} damage)\\b`, "gi"), (...m) => `${m.last().start} ${m.last().end}`)
			// Connect together likely determiners/conjunctions/etc.
			.replace(/(?<start>\b(the|a|a cumulative|an|this|that|these|those|its|his|her|their|they|have|extra|and|or|as|on|uses|to|at|using|reduced|effect|reaches|with|of) *)\n+\s*/g, (...m) => `${m.last().start} `)
			// Connect together e.g.:
			//  - `+5\nto hit`, `your Spell Attack Modifier\nto hit`
			//  - `your Wisdom\nmodifier`
			.replace(/(?<start>[a-z0-9]) *\n+ *(?<end>to hit|modifier)\b/g, (...m) => `${m.last().start} ${m.last().end}`)
			// Connect together `<ability> (<skill>)`
			.replace(new RegExp(`\\b(?<start>${Object.values(Parser.ATB_ABV_TO_FULL).join("|")}) *\\n+ *(?<end>\\((?:${Object.keys(Parser.SKILL_TO_ATB_ABV).join("|")})\\))`, "gi"), (...m) => `${m.last().start.trim()} ${m.last().end.trim()}`)
			// Connect together e.g. `increases by\n1d6 when`
			.replace(/(?<start>[a-z0-9]) *\n+ *(?<end>\d+d\d+( *[-+] *\d+)?,? [a-z]+)/g, (...m) => `${m.last().start} ${m.last().end}`)
			// Connect together e.g. `2d4\n+PB`
			.replace(/(?<start>(?:\d+)?d\d+) *\n *(?<end>[-+] *(?:\d+|PB) [a-z]+)/g, (...m) => `${m.last().start} ${m.last().end}`)
			// Connect together likely word pairs
			.replace(/\b(?<start>hit) *\n* *(?<end>points)\b/gi, (...m) => `${m.last().start} ${m.last().end}`)
			.replace(/\b(?<start>save) *\n* *(?<end>DC)\b/gi, (...m) => `${m.last().start} ${m.last().end}`)
		;

		if (options) {
			// Apply `PAGE=...`
			iptClean = iptClean
				.replace(/(?:\n|^)PAGE=(?<page>\d+)(?:\n|$)/gi, (...m) => {
					options.page = Number(m.last().page);
					return "";
				});
		}

		return iptClean;
	}

	static _getCleanInput_parens (iptClean, cOpen, cClose) {
		const lines = iptClean
			.split("\n");

		for (let i = 0; i < lines.length; ++i) {
			const line = lines[i];
			const lineNxt = lines[i + 1];
			if (!lineNxt) continue;

			const cntOpen = line.countSubstring(cOpen);
			const cntClose = line.countSubstring(cClose);

			if (cntOpen <= cntClose) continue;

			lines[i] = `${line} ${lineNxt}`.replace(/ {2}/g, " ");
			lines.splice(i + 1, 1);
			i--;
		}

		return lines.join("\n");
	}

	static _getCleanInput_quotes (iptClean, cOpen, cClose) {
		const lines = iptClean
			.split("\n");

		for (let i = 0; i < lines.length; ++i) {
			const line = lines[i];
			const lineNxt = lines[i + 1];
			if (!lineNxt) continue;

			const cntOpen = line.countSubstring(cOpen);
			const cntClose = line.countSubstring(cClose);

			if (!(cntOpen % 2) || !(cntClose % 2)) continue;

			lines[i] = `${line} ${lineNxt}`.replace(/ {2}/g, " ");
			lines.splice(i + 1, 1);
			i--;
		}

		return lines.join("\n");
	}

	/* -------------------------------------------- */

	static _hasEntryContent (trait) {
		return trait && (trait.name || (trait.entries.length === 1 && trait.entries[0]) || trait.entries.length > 1);
	}
}
