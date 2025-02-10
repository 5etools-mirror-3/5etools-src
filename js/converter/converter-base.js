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

	static _RE_WHITESPACE = /\s+/g;
	static _RE_PT_APPROX_GENERIC_JOINER = /(?:the|a|a cumulative|an|this|that|these|those|its|his|her|their|they|have|extra|and|or|as|on|uses|to|at|using|reduced|effect|reaches|with|of|includes?|does(?:n't)?|can('t)?|random|gains?|from|between|against)/.source;

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
			.replace(/, *\n */g, ", ")
			.replace(/ *\n, */g, ", ");

		iptClean = iptClean
			// Connect together e.g. `5d10\nForce damage`
			.replace(new RegExp(`(?<start>\\d+) *\\n(?<end>${ConverterConst.STR_RE_DAMAGE_TYPE} damage)\\b`, "gi"), (...m) => `${m.last().start} ${m.last().end}`)
			// Connect together likely determiners/conjunctions/etc.
			.replace(new RegExp(`\\s+${this._RE_PT_APPROX_GENERIC_JOINER}\\n`, "g"), (...m) => m[0].replace(this._RE_WHITESPACE, " "))
			.replace(new RegExp(`\\n${this._RE_PT_APPROX_GENERIC_JOINER}\\s+`, "g"), (...m) => m[0].replace(this._RE_WHITESPACE, " "))
			// Connect together likely infinitives
			.replace(/(?<start>\b(uses Spellcasting to cast) *)\n\s*(?=[a-zA-Z])/g, (...m) => `${m.last().start} `)
			// Connect together e.g.:
			//  - `+5\nto hit`, `your Spell Attack Modifier\nto hit`
			//  - `your Wisdom\nmodifier`
			.replace(/(?<start>[a-z0-9]) *\n *(?<end>to hit|modifier)\b/g, (...m) => `${m.last().start} ${m.last().end}`)
			// Connect together `<ability> (<skill>)`
			.replace(new RegExp(`\\b(?<start>${Object.values(Parser.ATB_ABV_TO_FULL).join("|")}) *\\n *(?<end>\\((?:${Object.keys(Parser.SKILL_TO_ATB_ABV).join("|")})\\))`, "gi"), (...m) => `${m.last().start.trim()} ${m.last().end.trim()}`)
			// Connect together `<ability> saving throw`
			.replace(new RegExp(`\\b(?<start>${Object.values(Parser.ATB_ABV_TO_FULL).join("|")})\\s+(?<saving>saving)\\s+(?<throw>throw)`, "gi"), (...m) => `${m.last().start.trim()} ${m.last().saving.trim()} ${m.last().throw.trim()}`)
			// Connect together e.g. `increases by\n1d6 when`
			.replace(/(?<start>[a-z0-9]) *\n *(?<end>\d+d\d+( *[-+] *\d+)?,? [a-z]+)/g, (...m) => `${m.last().start} ${m.last().end}`)
			// Connect together e.g. `2d4\nPB`
			.replace(/(?<start>(?:\d+)?d\d+) *\n *(?<end>[-+] *(?:\d+|PB) [a-z]+)/g, (...m) => `${m.at(-1).start} ${m.at(-1).end}`)
			// Connect together attack starts
			.replace(/(?:Melee|Ranged|Spell)(?:\s+Weapon)?\s+Attack(?:\s+Roll)?:\s+/g, (...m) => m[0].replace(this._RE_WHITESPACE, " "))
			.replace(/\sHit(?:\s+or\s+Miss)?:\s/g, (...m) => m[0].replace(this._RE_WHITESPACE, " "))
			// Connect together save effect starts
			.replace(/\s(?:(First|Second|Third|Fourth|Fifth)\s+)?(?:Failure\s+or\s+Success|Failure|Success):\s/g, (...m) => m[0].replace(this._RE_WHITESPACE, " "))
			// Connect trigger/response
			.replace(/\s(Trigger|Response)[-:\u2012-\u2014]\s/g, (...m) => m[0].replace(this._RE_WHITESPACE, " "))
			// Connect areas, e.g. "10-foot-radius Sphere"
			.replace(/\s\d+-foot-\w+\s[A-Z][a-z]+/g, (...m) => m[0].replace(this._RE_WHITESPACE, " "))
			// Connect together likely word pairs
			.replace(/\b(?<start>hit) *\n* *(?<end>points)\b/gi, (...m) => `${m.last().start} ${m.last().end}`)
			.replace(/\b(?<start>save) *\n* *(?<end>DC)\b/gi, (...m) => `${m.last().start} ${m.last().end}`)
			.replace(/\b(moved\s+\d+\+?\s+feet|attacks\.\s+[a-zA-Z]+\s+can\s+replace|(?<!Armor Class )\d+\s+Hit\s+Points?)\b/gi, (...m) => m[0].replace(this._RE_WHITESPACE, " "))
			.replace(/\b(Difficult *\n* *Terrain)\b/gi, (...m) => m[0].replace(this._RE_WHITESPACE, " "))
			.replace(/\b(\d+- *\n* *foot- *\n* *(?:wide|long|high))\b/gi, (...m) => m[0].replace(this._RE_WHITESPACE, ""))
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
