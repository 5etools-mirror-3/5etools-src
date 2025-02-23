"use strict";

// in deployment, `IS_DEPLOYED = "<version number>";` should be set below.
globalThis.IS_DEPLOYED = undefined;
globalThis.VERSION_NUMBER = /* 5ETOOLS_VERSION__OPEN */"2.7.2"/* 5ETOOLS_VERSION__CLOSE */;
globalThis.DEPLOYED_IMG_ROOT = undefined;
// for the roll20 script to set
globalThis.IS_VTT = false;

globalThis.IMGUR_CLIENT_ID = `abdea4de492d3b0`;

// TODO refactor into VeCt
globalThis.HASH_PART_SEP = ",";
globalThis.HASH_LIST_SEP = "_";
globalThis.HASH_SUB_LIST_SEP = "~";
globalThis.HASH_SUB_KV_SEP = ":";
globalThis.HASH_BLANK = "blankhash";
globalThis.HASH_SUB_NONE = "null";

globalThis.VeCt = {
	STR_NONE: "None",
	STR_SEE_CONSOLE: "See the console (CTRL+SHIFT+J) for details.",

	HASH_SCALED: "scaled",
	HASH_SCALED_SPELL_SUMMON: "scaledspellsummon",
	HASH_SCALED_CLASS_SUMMON: "scaledclasssummon",

	FILTER_BOX_SUB_HASH_SEARCH_PREFIX: "fbsr",
	FILTER_BOX_SUB_HASH_FLAG_IS_PRESERVE_EXISTING: "fbpe",

	JSON_PRERELEASE_INDEX: `prerelease/index.json`,
	JSON_BREW_INDEX: `homebrew/index.json`,

	STORAGE_HOMEBREW: "HOMEBREW_STORAGE",
	STORAGE_HOMEBREW_META: "HOMEBREW_META_STORAGE",
	STORAGE_EXCLUDES: "EXCLUDES_STORAGE",
	STORAGE_DMSCREEN: "DMSCREEN_STORAGE",
	STORAGE_DMSCREEN_TEMP_SUBLIST: "DMSCREEN_TEMP_SUBLIST",
	STORAGE_ROLLER_MACRO: "ROLLER_MACRO_STORAGE",
	STORAGE_ENCOUNTER: "ENCOUNTER_STORAGE",
	STORAGE_POINTBUY: "POINTBUY_STORAGE",
	STORAGE_GLOBAL_COMPONENT_STATE: "GLOBAL_COMPONENT_STATE",

	DUR_INLINE_NOTIFY: 500,

	PG_NONE: "NO_PAGE",
	STR_GENERIC: "Generic",

	SYM_UI_SKIP: Symbol("uiSkip"),

	SYM_WALKER_BREAK: Symbol("walkerBreak"),

	SYM_UTIL_TIMEOUT: Symbol("timeout"),

	LOC_HOSTNAME_CANCER: "5e.tools",

	URL_BREW: `https://github.com/TheGiddyLimit/homebrew`,
	URL_ROOT_BREW: `https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/`, // N.b. must end with a slash
	URL_ROOT_BREW_IMG: `https://raw.githubusercontent.com/TheGiddyLimit/homebrew-img/main/`, // N.b. must end with a slash
	URL_PRERELEASE: `https://github.com/TheGiddyLimit/unearthed-arcana`,
	URL_ROOT_PRERELEASE: `https://raw.githubusercontent.com/TheGiddyLimit/unearthed-arcana/master/`, // As above

	STR_NO_ATTUNEMENT: "No Attunement Required",

	CR_UNKNOWN: 100001,
	CR_CUSTOM: 100000,

	SPELL_LEVEL_MAX: 9,
	LEVEL_MAX: 20,

	ENTDATA_ITEM_MERGED_ENTRY_TAG: "item__mergedEntryTag",

	DRAG_TYPE_IMPORT: "ve-Import",
	DRAG_TYPE_LOOT: "ve-Loot",

	Z_INDEX_BENEATH_HOVER: 199,
};

// STRING ==============================================================================================================
String.prototype.uppercaseFirst = String.prototype.uppercaseFirst || function () {
	const str = this.toString();
	if (str.length === 0) return str;
	if (str.length === 1) return str.charAt(0).toUpperCase();
	return str.charAt(0).toUpperCase() + str.slice(1);
};

String.prototype.lowercaseFirst = String.prototype.lowercaseFirst || function () {
	const str = this.toString();
	if (str.length === 0) return str;
	if (str.length === 1) return str.charAt(0).toLowerCase();
	return str.charAt(0).toLowerCase() + str.slice(1);
};

String.prototype.toTitleCase = String.prototype.toTitleCase || function () {
	return StrUtil.toTitleCase(this);
};

String.prototype.toSentenceCase = String.prototype.toSentenceCase || function () {
	const out = [];
	const re = /([^.!?]+)([.!?]\s*|$)/gi;
	let m;
	do {
		m = re.exec(this);
		if (m) {
			out.push(m[0].toLowerCase().uppercaseFirst());
		}
	} while (m);
	return out.join("");
};

String.prototype.toSpellCase = String.prototype.toSpellCase || function () {
	return this.toLowerCase().replace(/(^|of )(bigby|otiluke|mordenkainen|evard|hadar|agathys|abi-dalzim|aganazzar|drawmij|leomund|maximilian|melf|nystul|otto|rary|snilloc|tasha|tenser|jim)('s|$| )/g, (...m) => `${m[1]}${m[2].toTitleCase()}${m[3]}`);
};

String.prototype.toCamelCase = String.prototype.toCamelCase || function () {
	return this.split(" ").map((word, index) => {
		if (index === 0) return word.toLowerCase();
		return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`;
	}).join("");
};

String.prototype.toSingle = String.prototype.toSingle || function () {
	return StrUtil.toSingle(this);
};

String.prototype.toPlural = String.prototype.toPlural || function () {
	return StrUtil.toPlural(this);
};

String.prototype.escapeQuotes = String.prototype.escapeQuotes || function () {
	return this.replace(/&/g, `&amp;`).replace(/'/g, `&apos;`).replace(/"/g, `&quot;`).replace(/</g, `&lt;`).replace(/>/g, `&gt;`);
};

String.prototype.qq = String.prototype.qq || function () {
	return this.escapeQuotes();
};

String.prototype.unescapeQuotes = String.prototype.unescapeQuotes || function () {
	return this.replace(/&apos;/g, `'`).replace(/&quot;/g, `"`).replace(/&lt;/g, `<`).replace(/&gt;/g, `>`).replace(/&amp;/g, `&`);
};

String.prototype.uq = String.prototype.uq || function () {
	return this.unescapeQuotes();
};

String.prototype.encodeApos = String.prototype.encodeApos || function () {
	return this.replace(/'/g, `%27`);
};

/**
 * Calculates the Damerau-Levenshtein distance between two strings.
 * https://gist.github.com/IceCreamYou/8396172
 */
String.prototype.distance = String.prototype.distance || function (target) {
	let source = this; let i; let j;
	if (!source) return target ? target.length : 0;
	else if (!target) return source.length;

	const m = source.length; const n = target.length; const INF = m + n; const score = new Array(m + 2); const sd = {};
	for (i = 0; i < m + 2; i++) score[i] = new Array(n + 2);
	score[0][0] = INF;
	for (i = 0; i <= m; i++) {
		score[i + 1][1] = i;
		score[i + 1][0] = INF;
		sd[source[i]] = 0;
	}
	for (j = 0; j <= n; j++) {
		score[1][j + 1] = j;
		score[0][j + 1] = INF;
		sd[target[j]] = 0;
	}

	for (i = 1; i <= m; i++) {
		let DB = 0;
		for (j = 1; j <= n; j++) {
			const i1 = sd[target[j - 1]]; const j1 = DB;
			if (source[i - 1] === target[j - 1]) {
				score[i + 1][j + 1] = score[i][j];
				DB = j;
			} else {
				score[i + 1][j + 1] = Math.min(score[i][j], Math.min(score[i + 1][j], score[i][j + 1])) + 1;
			}
			score[i + 1][j + 1] = Math.min(score[i + 1][j + 1], score[i1] ? score[i1][j1] + (i - i1 - 1) + 1 + (j - j1 - 1) : Infinity);
		}
		sd[source[i - 1]] = i;
	}
	return score[m + 1][n + 1];
};

String.prototype.isNumeric = String.prototype.isNumeric || function () {
	return !isNaN(parseFloat(this)) && isFinite(this);
};

String.prototype.last = String.prototype.last || function () {
	return this[this.length - 1];
};

String.prototype.escapeRegexp = String.prototype.escapeRegexp || function () {
	return this.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
};

String.prototype.toUrlified = String.prototype.toUrlified || function () {
	return encodeURIComponent(this.toLowerCase()).toLowerCase();
};

String.prototype.toChunks = String.prototype.toChunks || function (size) {
	// https://stackoverflow.com/a/29202760/5987433
	const numChunks = Math.ceil(this.length / size);
	const chunks = new Array(numChunks);
	for (let i = 0, o = 0; i < numChunks; ++i, o += size) chunks[i] = this.substr(o, size);
	return chunks;
};

String.prototype.toAscii = String.prototype.toAscii || function () {
	return this
		.normalize("NFD") // replace diacritics with their individual graphemes
		.replace(/[\u0300-\u036f]/g, "") // remove accent graphemes
		.replace(/Æ/g, "AE").replace(/æ/g, "ae");
};

String.prototype.trimChar = String.prototype.trimChar || function (ch) {
	let start = 0; let end = this.length;
	while (start < end && this[start] === ch) ++start;
	while (end > start && this[end - 1] === ch) --end;
	return (start > 0 || end < this.length) ? this.substring(start, end) : this;
};

String.prototype.trimAnyChar = String.prototype.trimAnyChar || function (chars) {
	let start = 0; let end = this.length;
	while (start < end && chars.indexOf(this[start]) >= 0) ++start;
	while (end > start && chars.indexOf(this[end - 1]) >= 0) --end;
	return (start > 0 || end < this.length) ? this.substring(start, end) : this;
};

String.prototype.countSubstring = String.prototype.countSubstring || function (term) {
	return (this.match(new RegExp(term.escapeRegexp(), "g")) || []).length;
};

Array.prototype.joinConjunct || Object.defineProperty(Array.prototype, "joinConjunct", {
	enumerable: false,
	writable: true,
	value: function (joiner, lastJoiner, nonOxford) {
		if (this.length === 0) return "";
		if (this.length === 1) return this[0];
		if (this.length === 2) return this.join(lastJoiner);
		else {
			let outStr = "";
			for (let i = 0; i < this.length; ++i) {
				outStr += this[i];
				if (i < this.length - 2) outStr += joiner;
				else if (i === this.length - 2) outStr += `${(!nonOxford && this.length > 2 ? joiner.trim() : "")}${lastJoiner}`;
			}
			return outStr;
		}
	},
});

globalThis.StrUtil = class {
	static COMMAS_NOT_IN_PARENTHESES_REGEX = /,\s?(?![^(]*\))/g;
	static COMMA_SPACE_NOT_IN_PARENTHESES_REGEX = /, (?![^(]*\))/g;
	static SEMICOLON_SPACE_NOT_IN_PARENTHESES_REGEX = /; (?![^(]*\))/g;

	static uppercaseFirst (string) {
		return string.uppercaseFirst();
	}

	/* -------------------------------------------- */

	// Certain minor words should be left lowercase unless they are the first or last words in the string
	static TITLE_LOWER_WORDS = ["a", "an", "the", "and", "but", "or", "for", "nor", "as", "at", "by", "for", "from", "in", "into", "near", "of", "on", "onto", "to", "with", "over", "von", "between", "per", "beyond", "among"];
	// Certain words such as initialisms or acronyms should be left uppercase
	static TITLE_UPPER_WORDS = ["Id", "Tv", "Dm", "Ok", "Npc", "Pc", "Tpk", "Wip", "Dc", "D&d"];
	static TITLE_UPPER_WORDS_PLURAL = ["Ids", "Tvs", "Dms", "Oks", "Npcs", "Pcs", "Tpks", "Wips", "Dcs"]; // (Manually pluralize, to avoid infinite loop)

	static _TITLE_RE_INITIAL = /(\w+[^-\u2014\s/]*) */g;
	static _TITLE_RE_SPLIT_PUNCT = /([;:?!.])/g;
	static _TITLE_RE_COMPOUND_LOWER = /([a-z]-(?:Like|Kreen|Toa))/g;
	static _TITLE_RE_POST_PUNCT = /^(\s*)(\S)/;

	static _TITLE_LOWER_WORDS_RE = null;
	static _TITLE_UPPER_WORDS_RE = null;
	static _TITLE_UPPER_WORDS_PLURAL_RE = null;

	static _toTitleCase_init () {
		// Require space surrounded, as title-case requires a full word on either side
		this._TITLE_LOWER_WORDS_RE ??= RegExp(`\\s(${this.TITLE_LOWER_WORDS.join("|")})(?=\\s)`, "gi");
		this._TITLE_UPPER_WORDS_RE ??= RegExp(`\\b(${this.TITLE_UPPER_WORDS.join("|")})\\b`, "g");
		this._TITLE_UPPER_WORDS_PLURAL_RE ??= RegExp(`\\b(${this.TITLE_UPPER_WORDS_PLURAL.join("|")})\\b`, "g");
	}

	static toTitleCase (str) {
		this._toTitleCase_init();

		return str
			.replace(this._TITLE_RE_INITIAL, m0 => m0.charAt(0).toUpperCase() + m0.substring(1).toLowerCase())
			.replace(this._TITLE_LOWER_WORDS_RE, (...m) => m[0].toLowerCase())
			.replace(this._TITLE_UPPER_WORDS_RE, (...m) => m[0].toUpperCase())
			.replace(this._TITLE_UPPER_WORDS_PLURAL_RE, (...m) => `${m[0].slice(0, -1).toUpperCase()}${m[0].slice(-1).toLowerCase()}`)
			.replace(this._TITLE_RE_COMPOUND_LOWER, (...m) => m[0].toLowerCase())
			.split(this._TITLE_RE_SPLIT_PUNCT)
			.map(pt => pt.replace(this._TITLE_RE_POST_PUNCT, (...m) => `${m[1]}${m[2].toUpperCase()}`))
			.join("");
	}

	/* -------------------------------------------- */

	static padNumber (n, len, padder) {
		return String(n).padStart(len, padder);
	}

	static elipsisTruncate (str, atLeastPre = 5, atLeastSuff = 0, maxLen = 20) {
		if (maxLen >= str.length) return str;

		maxLen = Math.max(atLeastPre + atLeastSuff + 3, maxLen);
		let out = "";
		let remain = maxLen - (3 + atLeastPre + atLeastSuff);
		for (let i = 0; i < str.length - atLeastSuff; ++i) {
			const c = str[i];
			if (i < atLeastPre) out += c;
			else if ((remain--) > 0) out += c;
		}
		if (remain < 0) out += "...";
		out += str.substring(str.length - atLeastSuff, str.length);
		return out;
	}

	/* -------------------------------------------- */

	static qq (str) { return (str = str || "").qq(); }

	static getNextDuplicateName (str) {
		if (str == null) return null;

		// Get the root name without trailing numbers, e.g. "Goblin (2)" -> "Goblin"
		const m = /^(?<name>.*?) \((?<ordinal>\d+)\)$/.exec(str.trim());
		if (!m) return `${str} (1)`;
		return `${m.groups.name} (${Number(m.groups.ordinal) + 1})`;
	}

	/* -------------------------------------------- */

	static _IRREGULAR_PLURAL_WORDS = {
		"aarakocra": "aarakocra",
		"cactus": "cacti",
		"child": "children",
		"die": "dice",
		"djinni": "djinn",
		"dwarf": "dwarves",
		"efreeti": "efreet",
		"elf": "elves",
		"erinyes": "erinyes",
		"fey": "fey",
		"foot": "feet",
		"goose": "geese",
		"incubus": "incubi",
		"ki": "ki",
		"man": "men",
		"mouse": "mice",
		"oni": "oni",
		"ox": "oxen",
		"person": "people",
		"sheep": "sheep",
		"slaad": "slaadi",
		"succubus": "succubi",
		"tooth": "teeth",
		"undead": "undead",
		"wolf": "wolves",
		"woman": "women",
		"yuan-ti": "yuan-ti",
	};

	static _IRREGULAR_SINGLE_WORDS = {
		...Object.fromEntries(Object.entries(this._IRREGULAR_PLURAL_WORDS).map(([k, v]) => [v, k])),
	};

	static _IRREGULAR_SINGLE_PATTERNS = [
		[/(axe)s$/i, "$1"],
	];

	static toSingle (str) {
		if (this._IRREGULAR_SINGLE_WORDS[str.toLowerCase()]) return this._getMatchedCase(str, this._IRREGULAR_SINGLE_WORDS[str.toLowerCase()]);
		const single = this._IRREGULAR_SINGLE_PATTERNS
			.first(([re, repl]) => {
				if (re.test(str)) return str.replace(re, repl);
			});
		if (single) return single;

		if (/(s|x|z|ch|sh)es$/i.test(str)) return str.slice(0, -2);
		if (/[bcdfghjklmnpqrstvwxyz]ies$/i.test(str)) return `${str.slice(0, -3)}y`;
		return str.replace(/s$/i, "");
	}

	static toPlural (str) {
		let plural;
		if (this._IRREGULAR_PLURAL_WORDS[str.toLowerCase()]) plural = this._IRREGULAR_PLURAL_WORDS[str.toLowerCase()];
		else if (/(s|x|z|ch|sh)$/i.test(str)) plural = `${str}es`;
		else if (/[bcdfghjklmnpqrstvwxyz]y$/i.test(str)) plural = str.replace(/y$/i, "ies");
		else plural = `${str}s`;

		return this._getMatchedCase(str, plural);
	}

	static _getMatchedCase (strOriginal, strOther) {
		if (strOriginal.toLowerCase() === strOriginal) return strOther;
		if (strOriginal.toUpperCase() === strOriginal) return strOther.toUpperCase();
		if (strOriginal.toTitleCase() === strOriginal) return strOther.toTitleCase();
		return strOther;
	}
};

globalThis.NumberUtil = class {
	static toFixedNumber (num, toFixed) {
		if (num == null || isNaN(num)) return num;

		num = Number(num);
		if (!num) return num;

		return Number(num.toFixed(toFixed));
	}
};

globalThis.CleanUtil = {
	getCleanJson (data, {isMinify = false, isFast = true} = {}) {
		data = MiscUtil.copy(data);
		data = MiscUtil.getWalker().walk(data, {string: (str) => CleanUtil.getCleanString(str, {isFast})});
		let str = isMinify ? JSON.stringify(data) : `${JSON.stringify(data, null, "\t")}\n`;
		return str.replace(CleanUtil.STR_REPLACEMENTS_REGEX, (match) => CleanUtil.STR_REPLACEMENTS[match]);
	},

	getCleanString (str, {isFast = true} = {}) {
		str = str
			.replace(CleanUtil.SHARED_REPLACEMENTS_REGEX, (match) => CleanUtil.SHARED_REPLACEMENTS[match])
			.replace(CleanUtil._SOFT_HYPHEN_REMOVE_REGEX, "")
		;

		if (isFast) return str;

		const ptrStack = {_: ""};
		CleanUtil._getCleanString_walkerStringHandler(ptrStack, 0, str);
		return ptrStack._;
	},

	_getCleanString_walkerStringHandler (ptrStack, tagCount, str) {
		const tagSplit = Renderer.splitByTags(str);
		const len = tagSplit.length;
		for (let i = 0; i < len; ++i) {
			const s = tagSplit[i];
			if (!s) continue;
			if (s.startsWith("{@")) {
				const [tag, text] = Renderer.splitFirstSpace(s.slice(1, -1));

				ptrStack._ += `{${tag}${text.length ? " " : ""}`;
				this._getCleanString_walkerStringHandler(ptrStack, tagCount + 1, text);
				ptrStack._ += `}`;
			} else {
				// avoid tagging things wrapped in existing tags
				if (tagCount) {
					ptrStack._ += s;
				} else {
					ptrStack._ += s
						.replace(CleanUtil._DASH_COLLAPSE_REGEX, "$1")
						.replace(CleanUtil._ELLIPSIS_COLLAPSE_REGEX, "$1");
				}
			}
		}
	},
};
CleanUtil.SHARED_REPLACEMENTS = {
	"’": "'",
	"‘": "'",
	"": "'",
	"…": "...",
	"\u200B": "", // zero-width space
	"\u2002": " ", // em space
	"ﬀ": "ff",
	"ﬃ": "ffi",
	"ﬄ": "ffl",
	"ﬁ": "fi",
	"ﬂ": "fl",
	"Ĳ": "IJ",
	"ĳ": "ij",
	"Ǉ": "LJ",
	"ǈ": "Lj",
	"ǉ": "lj",
	"Ǌ": "NJ",
	"ǋ": "Nj",
	"ǌ": "nj",
	"ﬅ": "ft",
	"“": `"`,
	"”": `"`,
	"\u201a": ",",
};
CleanUtil.STR_REPLACEMENTS = {
	"—": "\\u2014",
	"–": "\\u2013",
	"‑": "\\u2011",
	"−": "\\u2212",
	" ": "\\u00A0",
	" ": "\\u2007",
};
CleanUtil.SHARED_REPLACEMENTS_REGEX = new RegExp(Object.keys(CleanUtil.SHARED_REPLACEMENTS).join("|"), "g");
CleanUtil.STR_REPLACEMENTS_REGEX = new RegExp(Object.keys(CleanUtil.STR_REPLACEMENTS).join("|"), "g");
CleanUtil._SOFT_HYPHEN_REMOVE_REGEX = /\u00AD *\r?\n?\r?/g;
CleanUtil._ELLIPSIS_COLLAPSE_REGEX = /\s*(\.\s*\.\s*\.)/g;
CleanUtil._DASH_COLLAPSE_REGEX = /[ ]*([\u2014\u2013])[ ]*/g;

// SOURCES =============================================================================================================
globalThis.SourceUtil = class {
	static ADV_BOOK_GROUPS = [
		{group: "core", displayName: "Core"},
		{group: "supplement", displayName: "Supplements"},
		{group: "setting", displayName: "Settings"},
		{group: "setting-alt", displayName: "Additional Settings"},
		{group: "supplement-alt", displayName: "Extras"},
		{group: "prerelease", displayName: "Prerelease"},
		{group: "homebrew", displayName: "Homebrew"},
		{group: "screen", displayName: "Screens"},
		{group: "recipe", displayName: "Recipes"},
		{group: "other", displayName: "Miscellaneous"},
	];

	static _subclassReprintLookup = {};
	static async pInitSubclassReprintLookup () {
		SourceUtil._subclassReprintLookup = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/generated/gendata-subclass-lookup.json`);
	}

	static isSubclassReprinted (className, classSource, subclassShortName, subclassSource) {
		const fromLookup = MiscUtil.get(SourceUtil._subclassReprintLookup, classSource, className, subclassSource, subclassShortName);
		return fromLookup ? fromLookup.isReprinted : false;
	}

	static isKnownSource (source) {
		return SourceUtil.isSiteSource(source)
			|| (typeof PrereleaseUtil !== "undefined" && PrereleaseUtil.hasSourceJson(source))
			|| (typeof BrewUtil2 !== "undefined" && BrewUtil2.hasSourceJson(source));
	}

	/** I.e., not homebrew. */
	static isSiteSource (source) { return !!Parser.SOURCE_JSON_TO_FULL[source]; }

	static isAdventure (source) {
		if (source instanceof FilterItem) source = source.item;
		return Parser.SOURCES_ADVENTURES.has(source);
	}

	static isCoreOrSupplement (source) {
		if (source instanceof FilterItem) source = source.item;
		return Parser.SOURCES_CORE_SUPPLEMENTS.has(source);
	}

	static isNonstandardSource (source) {
		if (source == null) return false;
		return (
			(typeof BrewUtil2 === "undefined" || !BrewUtil2.hasSourceJson(source))
				&& SourceUtil.isNonstandardSourceWotc(source)
		)
			|| SourceUtil.isPrereleaseSource(source);
	}

	static isPartneredSourceWotc (source) {
		if (source == null) return false;
		if (Parser.SOURCES_PARTNERED_WOTC.has(source)) return true;
		if (typeof PrereleaseUtil !== "undefined" && PrereleaseUtil.hasSourceJson(source)) return !!PrereleaseUtil.sourceJsonToSource(source).partnered;
		if (typeof BrewUtil2 !== "undefined" && BrewUtil2.hasSourceJson(source)) return !!BrewUtil2.sourceJsonToSource(source).partnered;
		return false;
	}

	static isLegacySourceWotc (source) {
		if (source == null) return false;
		return Parser.SOURCES_LEGACY_WOTC.has(source);
	}

	// TODO(Future) remove this in favor of simply checking existence in `PrereleaseUtil`
	// TODO(Future) cleanup uses of `PrereleaseUtil.hasSourceJson` to match
	static isPrereleaseSource (source) {
		if (source == null) return false;
		if (typeof PrereleaseUtil !== "undefined" && PrereleaseUtil.hasSourceJson(source)) return true;
		return source.startsWith(Parser.SRC_UA_PREFIX)
			|| source.startsWith(Parser.SRC_UA_ONE_PREFIX);
	}

	static isNonstandardSourceWotc (source) {
		return SourceUtil.isPrereleaseSource(source)
			|| source.startsWith(Parser.SRC_PS_PREFIX)
			|| source.startsWith(Parser.SRC_AL_PREFIX)
			|| source.startsWith(Parser.SRC_MCVX_PREFIX)
			|| Parser.SOURCES_NON_STANDARD_WOTC.has(source);
	}

	static _CLASSIC_THRESHOLD_TIMESTAMP = null;

	static isClassicSource (source) {
		this._CLASSIC_THRESHOLD_TIMESTAMP ||= new Date(Parser.sourceJsonToDate(Parser.SRC_XPHB));
		return new Date(Parser.sourceJsonToDate(source)) < this._CLASSIC_THRESHOLD_TIMESTAMP;
	}

	static FILTER_GROUP_STANDARD = 0;
	static FILTER_GROUP_PARTNERED = 1;
	static FILTER_GROUP_NON_STANDARD = 2;
	static FILTER_GROUP_PRERELEASE = 3;
	static FILTER_GROUP_HOMEBREW = 4;

	static getFilterGroup (source) {
		if (source instanceof FilterItem) source = source.item;
		if (SourceUtil.isPartneredSourceWotc(source)) return SourceUtil.FILTER_GROUP_PARTNERED;
		if (typeof PrereleaseUtil !== "undefined" && PrereleaseUtil.hasSourceJson(source)) return SourceUtil.FILTER_GROUP_PRERELEASE;
		if (typeof BrewUtil2 !== "undefined" && BrewUtil2.hasSourceJson(source)) return SourceUtil.FILTER_GROUP_HOMEBREW;
		if (SourceUtil.isNonstandardSourceWotc(source)) return SourceUtil.FILTER_GROUP_NON_STANDARD;
		return SourceUtil.FILTER_GROUP_STANDARD;
	}

	static getFilterGroupName (group) {
		switch (group) {
			case SourceUtil.FILTER_GROUP_NON_STANDARD: return "Other";
			case SourceUtil.FILTER_GROUP_PRERELEASE: return "Prerelease";
			case SourceUtil.FILTER_GROUP_HOMEBREW: return "Homebrew";
			case SourceUtil.FILTER_GROUP_PARTNERED: return "Partnered";
			case SourceUtil.FILTER_GROUP_STANDARD: return null;
			default: throw new Error(`Unhandled source filter group "${group}"`);
		}
	}

	static getAdventureBookSourceHref (source, page) {
		if (!source) return null;
		source = source.toLowerCase();

		const meta = this._getAdventureBookSourceHref_fromSite({source})
			|| this._getAdventureBookSourceHref_fromPrerelease({source})
			|| this._getAdventureBookSourceHref_fromBrew({source});
		if (!meta) return;

		const {docPage, mappedSource} = meta;

		return `${docPage}#${[mappedSource, page ? `page:${page}` : null].filter(Boolean).join(HASH_PART_SEP)}`;
	}

	static _getAdventureBookSourceHref_fromSite ({source}) {
		if (Parser.SOURCES_AVAILABLE_DOCS_BOOK[source]) return {docPage: UrlUtil.PG_BOOK, mappedSource: Parser.SOURCES_AVAILABLE_DOCS_BOOK[source]};
		if (Parser.SOURCES_AVAILABLE_DOCS_ADVENTURE[source]) return {docPage: UrlUtil.PG_ADVENTURE, mappedSource: Parser.SOURCES_AVAILABLE_DOCS_ADVENTURE[source]};
		return null;
	}

	static _getAdventureBookSourceHref_fromPrerelease ({source}) { return this._getAdventureBookSourceHref_fromPrereleaseBrew({source, brewUtil: PrereleaseUtil}); }
	static _getAdventureBookSourceHref_fromBrew ({source}) { return this._getAdventureBookSourceHref_fromPrereleaseBrew({source, brewUtil: BrewUtil2}); }

	static _getAdventureBookSourceHref_fromPrereleaseBrew ({source, brewUtil}) {
		const contentsAdventure = (brewUtil.getBrewProcessedFromCache("adventure") || []).filter(ent => ent.source.toLowerCase() === source);
		const contentsBook = (brewUtil.getBrewProcessedFromCache("book") || []).filter(ent => ent.source.toLowerCase() === source);

		// If there exists more than one adventure/book for this source, do not assume a mapping from source -> ID
		if ((contentsAdventure.length + contentsBook.length) !== 1) return null;

		return {docPage: contentsAdventure.length ? UrlUtil.PG_ADVENTURE : UrlUtil.PG_BOOK, mappedSource: Parser.sourceJsonToJson(source)};
	}

	static getEntitySource (it) { return it.source || it.inherits?.source; }
};

// CURRENCY ============================================================================================================
globalThis.CurrencyUtil = class {
	/**
	 * Convert 10 gold -> 1 platinum, etc.
	 * @param obj Object of the form {cp: 123, sp: 456, ...} (values optional)
	 * @param [opts]
	 * @param [opts.currencyConversionId] Currency conversion table ID.
	 * @param [opts.currencyConversionTable] Currency conversion table.
	 * @param [opts.originalCurrency] Original currency object, if the current currency object is after spending coin.
	 * @param [opts.isPopulateAllValues] If all currency properties should be be populated, even if no currency of that
	 * type is being returned (i.e. zero out unused coins).
	 */
	static doSimplifyCoins (obj, opts) {
		opts = opts || {};

		const conversionTable = opts.currencyConversionTable || Parser.getCurrencyConversionTable(opts.currencyConversionId);
		if (!conversionTable.length) return obj;

		const normalized = conversionTable
			.map(it => {
				return {
					...it,
					normalizedMult: 1 / it.mult,
				};
			})
			.sort((a, b) => SortUtil.ascSort(a.normalizedMult, b.normalizedMult));

		// Simplify currencies
		for (let i = 0; i < normalized.length - 1; ++i) {
			const coinCur = normalized[i].coin;
			const coinNxt = normalized[i + 1].coin;
			const coinRatio = normalized[i + 1].normalizedMult / normalized[i].normalizedMult;

			if (obj[coinCur] && Math.abs(obj[coinCur]) >= coinRatio) {
				const nxtVal = obj[coinCur] >= 0 ? Math.floor(obj[coinCur] / coinRatio) : Math.ceil(obj[coinCur] / coinRatio);
				obj[coinCur] = obj[coinCur] % coinRatio;
				obj[coinNxt] = (obj[coinNxt] || 0) + nxtVal;
			}
		}

		// Note: this assumes that we, overall, lost money.
		if (opts.originalCurrency) {
			const normalizedHighToLow = MiscUtil.copyFast(normalized).reverse();

			// For each currency, look at the previous coin's diff. Say, for gp, that it is -1pp. That means we could have
			//   gained up to 10gp as change. So we can have <original gold or 0> + <10gp> max gold; the rest is converted
			//   to sp. Repeat to the end.
			// Never allow more highest-value currency (i.e. pp) than we originally had.
			normalizedHighToLow
				.forEach((coinMeta, i) => {
					const valOld = opts.originalCurrency[coinMeta.coin] || 0;
					const valNew = obj[coinMeta.coin] || 0;

					const prevCoinMeta = normalizedHighToLow[i - 1];
					const nxtCoinMeta = normalizedHighToLow[i + 1];

					if (!prevCoinMeta) { // Handle the biggest currency, e.g. platinum--never allow it to increase
						if (nxtCoinMeta) {
							const diff = valNew - valOld;
							if (diff > 0) {
								obj[coinMeta.coin] = valOld;
								const coinRatio = coinMeta.normalizedMult / nxtCoinMeta.normalizedMult;
								obj[nxtCoinMeta.coin] = (obj[nxtCoinMeta.coin] || 0) + (diff * coinRatio);
							}
						}
					} else {
						if (nxtCoinMeta) {
							const diffPrevCoin = (opts.originalCurrency[prevCoinMeta.coin] || 0) - (obj[prevCoinMeta.coin] || 0);
							const coinRatio = prevCoinMeta.normalizedMult / coinMeta.normalizedMult;
							const capFromOld = valOld + (diffPrevCoin > 0 ? diffPrevCoin * coinRatio : 0);
							const diff = valNew - capFromOld;
							if (diff > 0) {
								obj[coinMeta.coin] = capFromOld;
								const coinRatio = coinMeta.normalizedMult / nxtCoinMeta.normalizedMult;
								obj[nxtCoinMeta.coin] = (obj[nxtCoinMeta.coin] || 0) + (diff * coinRatio);
							}
						}
					}
				});
		}

		normalized
			.filter(coinMeta => obj[coinMeta.coin] === 0 || obj[coinMeta.coin] == null)
			.forEach(coinMeta => {
				// First set the value to null, in case we're dealing with a class instance that has setters
				obj[coinMeta.coin] = null;
				delete obj[coinMeta.coin];
			});

		if (opts.isPopulateAllValues) normalized.forEach(coinMeta => obj[coinMeta.coin] = obj[coinMeta.coin] || 0);

		return obj;
	}

	/**
	 * Convert a collection of coins into an equivalent value in copper.
	 * @param obj Object of the form {cp: 123, sp: 456, ...} (values optional)
	 */
	static getAsCopper (obj) {
		return Parser.FULL_CURRENCY_CONVERSION_TABLE
			.map(currencyMeta => (obj[currencyMeta.coin] || 0) * (1 / currencyMeta.mult))
			.reduce((a, b) => a + b, 0);
	}

	/**
	 * Convert a collection of coins into an equivalent number of coins of the highest denomination.
	 * @param obj Object of the form {cp: 123, sp: 456, ...} (values optional)
	 */
	static getAsSingleCurrency (obj) {
		const simplified = CurrencyUtil.doSimplifyCoins({...obj});

		if (Object.keys(simplified).length === 1) return simplified;

		const out = {};

		const targetDemonination = Parser.FULL_CURRENCY_CONVERSION_TABLE.find(it => simplified[it.coin]);

		out[targetDemonination.coin] = simplified[targetDemonination.coin];
		delete simplified[targetDemonination.coin];

		Object.entries(simplified)
			.forEach(([coin, amt]) => {
				const denom = Parser.FULL_CURRENCY_CONVERSION_TABLE.find(it => it.coin === coin);
				out[targetDemonination.coin] = (out[targetDemonination.coin] || 0) + (amt / denom.mult) * targetDemonination.mult;
			});

		return out;
	}

	static getCombinedCurrency (currencyA, currencyB) {
		const out = {};

		[currencyA, currencyB]
			.forEach(currency => {
				Object.entries(currency)
					.forEach(([coin, cnt]) => {
						if (cnt == null) return;
						if (isNaN(cnt)) throw new Error(`Unexpected non-numerical value "${JSON.stringify(cnt)}" for currency key "${coin}"`);

						out[coin] = (out[coin] || 0) + cnt;
					});
			});

		return out;
	}
};

// CONVENIENCE/ELEMENTS ================================================================================================
Math.seed = Math.seed || function (s) {
	return function () {
		s = Math.sin(s) * 10000;
		return s - Math.floor(s);
	};
};

class TemplateUtil {
	static initJquery () {
		/**
		 * Template strings which can contain jQuery objects.
		 * Usage: $$`<div>Press this button: ${$btn}</div>`
		 * or:    $$($ele)`<div>Press this button: ${$btn}</div>`
		 * @return {jQuery}
		 */
		globalThis.$$ = (parts, ...args) => {
			if (parts instanceof jQuery || parts instanceof Node) {
				return (...passed) => {
					const parts2 = [...passed[0]];
					const args2 = passed.slice(1);
					parts2[0] = `<div>${parts2[0]}`;
					parts2.last(`${parts2.last()}</div>`);

					const eleParts = parts instanceof jQuery ? parts[0] : parts;
					const $temp = $$(parts2, ...args2);
					$temp.children().each((i, e) => eleParts.appendChild(e));
					return $(eleParts);
				};
			}

			// Note that passing in a jQuery collection of multiple elements is not supported
			const partsNxt = parts instanceof jQuery ? parts[0] : parts;
			const argsNxt = args
				.map(arg => {
					if (arg instanceof Array) return arg.flatMap(argSub => argSub instanceof jQuery ? argSub.get() : argSub);
					return arg instanceof jQuery ? arg.get() : arg;
				});
			return $(ee(partsNxt, ...argsNxt));
		};
	}

	/* -------------------------------------------- */

	static initVanilla () {
		/**
		 * Template strings which can contain DOM elements.
		 * Usage: ee`<div>Press this button: ${ve-btn}</div>`
		 * or:    ee(ele)`<div>Press this button: ${ve-btn}</div>`
		 * @return {HTMLElementExtended}
		 */
		globalThis.ee = (parts, ...args) => {
			if (parts instanceof Node) {
				return (...passed) => {
					const parts2 = [...passed[0]];
					const args2 = passed.slice(1);
					parts2[0] = `<div>${parts2[0]}`;
					parts2.last(`${parts2.last()}</div>`);

					const eleTmp = ee(parts2, ...args2);
					Array.from(eleTmp.childNodes).forEach(node => parts.appendChild(node));

					return e_({ele: parts});
				};
			}

			const eles = [];
			let ixArg = 0;

			const raw = parts
				.reduce((html, p, ix) => {
					// Initial `.reduce` `ix` is 1
					if (ix === 1) html = html.trimStart();
					// ...and final `ix` is actually-final-index + 1
					if (ix === parts.length) html = html.trimEnd();

					const myIxArg = ixArg++;
					if (args[myIxArg] == null) return `${html}${p}`;
					if (args[myIxArg] instanceof Array) return `${html}${args[myIxArg].map(arg => TemplateUtil._ee_handleArg(eles, arg)).join("")}${p}`;
					else return `${html}${TemplateUtil._ee_handleArg(eles, args[myIxArg])}${p}`;
				});

			const eleTmpTemplate = document.createElement("template");
			eleTmpTemplate.innerHTML = raw.trim();
			const {content: eleTmp} = eleTmpTemplate;

			Array.from(eleTmp.querySelectorAll(`[data-r="true"]`))
				.forEach((node, i) => node.replaceWith(eles[i]));

			const childNodes = Array.from(eleTmp.childNodes);
			childNodes.forEach(node => document.adoptNode(node));

			// If the caller has passed in a single element, return it
			if (childNodes.length === 1) return e_({ele: childNodes[0]});

			// If the caller has passed in multiple elements with no wrapper, return an array
			return childNodes
				.map(childNode => e_({ele: childNode}));
		};
	}

	static _ee_handleArg (eles, arg) {
		if (arg instanceof Node) {
			eles.push(arg);
			return `<${arg.tagName} data-r="true"></${arg.tagName}>`;
		}

		return arg;
	}
}

globalThis.TemplateUtil = TemplateUtil;

globalThis.JqueryUtil = {
	_isEnhancementsInit: false,
	initEnhancements () {
		if (JqueryUtil._isEnhancementsInit) return;
		JqueryUtil._isEnhancementsInit = true;

		JqueryUtil.addSelectors();

		TemplateUtil.initVanilla();
		TemplateUtil.initJquery();

		$.fn.extend({
			// avoid setting input type to "search" as it visually offsets the contents of the input
			disableSpellcheck: function () { return this.attr("autocomplete", "new-password").attr("autocapitalize", "off").attr("spellcheck", "false"); },
			tag: function () { return this.prop("tagName").toLowerCase(); },
			title: function (...args) { return this.attr("title", ...args); },
			placeholder: function (...args) { return this.attr("placeholder", ...args); },
			disable: function () { return this.attr("disabled", true); },

			/**
			 * Quickly set the innerHTML of the innermost element, without parsing the whole thing with jQuery.
			 * Useful for populating e.g. a table row.
			 */
			fastSetHtml: function (html) {
				if (!this.length) return this;
				let tgt = this[0];
				while (tgt.children.length) {
					tgt = tgt.children[0];
				}
				tgt.innerHTML = html;
				return this;
			},

			hideVe: function () { return this.addClass("ve-hidden"); },
			showVe: function () { return this.removeClass("ve-hidden"); },
			toggleVe: function (val) {
				if (val === undefined) return this.toggleClass("ve-hidden", !this.hasClass("ve-hidden"));
				else return this.toggleClass("ve-hidden", !val);
			},
		});

		$.event.special.destroyed = {
			remove: function (o) {
				if (o.handler) o.handler();
			},
		};
	},

	addSelectors () {
		// Add a selector to match exact text (case insensitive) to jQuery's arsenal
		//   Note that the search text should be `trim().toLowerCase()`'d before being passed in
		$.expr[":"].textEquals = (el, i, m) => $(el).text().toLowerCase().trim() === m[3].unescapeQuotes();

		// Add a selector to match contained text (case insensitive)
		$.expr[":"].containsInsensitive = (el, i, m) => {
			const searchText = m[3];
			const textNode = $(el).contents().filter((i, e) => e.nodeType === 3)[0];
			if (!textNode) return false;
			const match = textNode.nodeValue.toLowerCase().trim().match(`${searchText.toLowerCase().trim().escapeRegexp()}`);
			return match && match.length > 0;
		};
	},

	showCopiedEffect ($_ele, text = "Copied!", bubble) {
		const $ele = $_ele instanceof $ ? $_ele : $($_ele);

		const top = $(window).scrollTop();
		const pos = $ele.offset();

		const animationOptions = {
			top: "-=8",
			opacity: 0,
		};
		if (bubble) {
			animationOptions.left = `${Math.random() > 0.5 ? "-" : "+"}=${~~(Math.random() * 17)}`;
		}
		const seed = Math.random();
		const duration = bubble ? 250 + seed * 200 : 250;
		const offsetY = bubble ? 16 : 0;

		const $dispCopied = $(`<div class="clp__disp-copied ve-flex-vh-center py-2 px-4"></div>`);
		$dispCopied
			.html(text)
			.css({
				top: (pos.top - 24) + offsetY - top,
				left: pos.left + ($ele.width() / 2),
			})
			.appendTo(document.body)
			.animate(
				animationOptions,
				{
					duration,
					complete: () => $dispCopied.remove(),
					progress: (_, progress) => { // progress is 0..1
						if (bubble) {
							const diffProgress = 0.5 - progress;
							animationOptions.top = `${diffProgress > 0 ? "-" : "+"}=40`;
							$dispCopied.css("transform", `rotate(${seed > 0.5 ? "-" : ""}${seed * 500 * progress}deg)`);
						}
					},
				},
			);
	},

	_dropdownInit: false,
	bindDropdownButton ($ele) {
		if (!JqueryUtil._dropdownInit) {
			JqueryUtil._dropdownInit = true;
			document.addEventListener("click", () => [...document.querySelectorAll(`.open`)].filter(ele => !(ele.className || "").split(" ").includes(`dropdown--navbar`)).forEach(ele => ele.classList.remove("open")));
		}
		$ele.click(() => setTimeout(() => $ele.parent().addClass("open"), 1)); // defer to allow the above to complete
	},

	_WRP_TOAST: null,
	_ACTIVE_TOAST: [],
	/**
	 * @param {{content: jQuery|string, type?: string, autoHideTime?: boolean} | string} options The options for the toast.
	 * @param {(jQuery|string)} options.content Toast contents. Supports jQuery objects.
	 * @param {string} options.type Toast type. Can be any Bootstrap alert type ("success", "info", "warning", or "danger").
	 * @param {number} options.autoHideTime The time in ms before the toast will be automatically hidden.
	 * Defaults to 5000 ms.
	 * @param {boolean} options.isAutoHide
	 */
	doToast (options) {
		if (typeof window === "undefined") return;

		if (JqueryUtil._WRP_TOAST == null) {
			JqueryUtil._WRP_TOAST = e_({
				tag: "div",
				clazz: "toast__container no-events w-100 ve-overflow-y-hidden ve-flex-col",
			});
			document.body.appendChild(JqueryUtil._WRP_TOAST);
		}

		if (typeof options === "string") {
			options = {
				content: options,
				type: "info",
			};
		}
		options.type = options.type || "info";

		options.isAutoHide = options.isAutoHide ?? true;
		options.autoHideTime = options.autoHideTime ?? 5000;

		const eleToast = e_({
			tag: "div",
			clazz: `toast toast--type-${options.type} events-initial relative my-2 mx-auto`,
			children: [
				e_({
					tag: "div",
					clazz: "toast__wrp-content",
					children: [
						options.content instanceof $ ? options.content[0] : options.content,
					],
				}),
				e_({
					tag: "div",
					clazz: "toast__wrp-control",
					children: [
						e_({
							tag: "button",
							clazz: "ve-btn toast__btn-close",
							children: [
								e_({
									tag: "span",
									clazz: "glyphicon glyphicon-remove",
								}),
							],
						}),
					],
				}),
			],
			mousedown: evt => {
				evt.preventDefault();
			},
			click: evt => {
				evt.preventDefault();
				JqueryUtil._doToastCleanup(toastMeta);

				// Close all on SHIFT-click
				if (!evt.shiftKey) return;
				[...JqueryUtil._ACTIVE_TOAST].forEach(toastMeta => JqueryUtil._doToastCleanup(toastMeta));
			},
		});

		// FIXME(future) this could be smoother; when stacking multiple tooltips, the incoming tooltip bumps old tooltips
		//   down instantly (should be animated).
		//   See e.g.:
		//   `[...new Array(10)].forEach((_, i) => MiscUtil.pDelay(i * 50).then(() => JqueryUtil.doToast(`test ${i}`)))`
		eleToast.prependTo(JqueryUtil._WRP_TOAST);

		const toastMeta = {isAutoHide: !!options.isAutoHide, eleToast};
		JqueryUtil._ACTIVE_TOAST.push(toastMeta);

		AnimationUtil.pRecomputeStyles()
			.then(() => {
				eleToast.addClass(`toast--animate`);

				if (options.isAutoHide) {
					setTimeout(() => {
						JqueryUtil._doToastCleanup(toastMeta);
					}, options.autoHideTime);
				}

				if (JqueryUtil._ACTIVE_TOAST.length >= 3) {
					JqueryUtil._ACTIVE_TOAST
						.filter(({isAutoHide}) => !isAutoHide)
						.forEach(toastMeta => {
							JqueryUtil._doToastCleanup(toastMeta);
						});
				}
			});
	},

	_doToastCleanup (toastMeta) {
		toastMeta.eleToast.removeClass("toast--animate");
		JqueryUtil._ACTIVE_TOAST.splice(JqueryUtil._ACTIVE_TOAST.indexOf(toastMeta), 1);
		setTimeout(() => toastMeta.eleToast.parentElement && toastMeta.eleToast.remove(), 85);
	},

	isMobile () {
		if (navigator?.userAgentData?.mobile) return true;
		// Equivalent to `$width-screen-sm`
		return window.matchMedia("(max-width: 768px)").matches;
	},
};

if (typeof window !== "undefined") window.addEventListener("load", JqueryUtil.initEnhancements);

class ElementUtil {
	static _ATTRS_NO_FALSY = new Set([
		"checked",
		"disabled",
	]);

	/**
	 * @typedef {HTMLElement} HTMLElementExtended
	 * @extends {HTMLElement}
	 *
	 * @property {function(HTMLElement|string): HTMLElementExtended} appends
	 * @property {function(HTMLElement): HTMLElementExtended} appendTo
	 * @property {function(HTMLElement): HTMLElementExtended} prependTo
	 * @property {function(HTMLElement|string): HTMLElementExtended} aftere
	 * @property {function(HTMLElement): HTMLElementExtended} insertAfter
	 *
	 * @property {function(string): HTMLElementExtended} addClass
	 * @property {function(string): HTMLElementExtended} removeClass
	 * @property {function(string, ?boolean): HTMLElementExtended} toggleClass
	 *
	 * @property {function(): HTMLElementExtended} showVe
	 * @property {function(): HTMLElementExtended} hideVe
	 * @property {function(?boolean): HTMLElementExtended} toggleVe
	 *
	 * @property {function(): HTMLElementExtended} empty
	 * @property {function(): HTMLElementExtended} detach
	 *
	 * @property {function(string, string=): HTMLElementExtended} attr
	 * @property {function(string, *=): HTMLElementExtended} prop
	 * @property {function(*=): *} val
	 *
	 * @property {function(string=): (HTMLElementExtended|string)} html
	 * @property {function(string=): (HTMLElementExtended|string)} txt
	 *
	 * @property {function(string): HTMLElementExtended} tooltip
	 * @property {function(): HTMLElementExtended} disableSpellcheck
	 *
	 * @property {function(object): HTMLElementExtended} css
	 *
	 * @property {function(string, function): HTMLElementExtended} onn
	 * @property {function(function): HTMLElementExtended} onClick
	 * @property {function(function): HTMLElementExtended} onContextmenu
	 * @property {function(function): HTMLElementExtended} onChange
	 * @property {function(function): HTMLElementExtended} onKeydown
	 * @property {function(function): HTMLElementExtended} onKeyup
	 *
	 * @property {function(string): HTMLElementExtended} trigger
	 *
	 * @property {function(string): HTMLElementExtended} first
	 * @property {function(string): HTMLElementExtended} closeste
	 * @property {function(string): Array<HTMLElementExtended>} childrene
	 * @property {function(string): Array<HTMLElementExtended>} siblings
	 *
	 * @return {HTMLElementExtended}
	 */
	static getOrModify ({
		tag,
		clazz,
		style,
		click,
		contextmenu,
		change,
		mousedown,
		mouseup,
		mousemove,
		pointerdown,
		pointerup,
		keydown,
		html,
		text,
		txt,
		ele,
		children,
		outer,

		id,
		name,
		title,
		val,
		href,
		type,
		tabindex,
		value,
		placeholder,
		attrs,
		data,
	}) {
		const metaEle = ElementUtil._getOrModify_getEle({
			ele,
			outer,
			tag,
			id,
		});
		ele = metaEle.ele;

		if (clazz) ele.className = clazz;
		if (style) ele.setAttribute("style", style);
		if (click) ele.addEventListener("click", click);
		if (contextmenu) ele.addEventListener("contextmenu", contextmenu);
		if (change) ele.addEventListener("change", change);
		if (mousedown) ele.addEventListener("mousedown", mousedown);
		if (mouseup) ele.addEventListener("mouseup", mouseup);
		if (mousemove) ele.addEventListener("mousemove", mousemove);
		if (pointerdown) ele.addEventListener("pointerdown", pointerdown);
		if (pointerup) ele.addEventListener("pointerup", pointerup);
		if (keydown) ele.addEventListener("keydown", keydown);
		if (html != null) ele.innerHTML = html;
		if (text != null || txt != null) ele.textContent = text;
		if (id != null && metaEle.isSetId) ele.setAttribute("id", id);
		if (name != null) ele.setAttribute("name", name);
		if (title != null) ele.setAttribute("title", title);
		if (href != null) ele.setAttribute("href", href);
		if (val != null) ele.setAttribute("value", val);
		if (type != null) ele.setAttribute("type", type);
		if (tabindex != null) ele.setAttribute("tabindex", tabindex);
		if (value != null) ele.setAttribute("value", value);
		if (placeholder != null) ele.setAttribute("placeholder", placeholder);

		if (attrs != null) {
			for (const k in attrs) {
				if (attrs[k] === undefined) continue;
				if (!attrs[k] && ElementUtil._ATTRS_NO_FALSY.has(k)) continue;
				ele.setAttribute(k, attrs[k]);
			}
		}

		if (data != null) { for (const k in data) { if (data[k] === undefined) continue; ele.dataset[k] = data[k]; } }

		if (children) for (let i = 0, len = children.length; i < len; ++i) if (children[i] != null) ele.append(children[i]);

		ele.appends = ele.appends || ElementUtil._appends.bind(ele);
		ele.appendTo = ele.appendTo || ElementUtil._appendTo.bind(ele);
		ele.prependTo = ele.prependTo || ElementUtil._prependTo.bind(ele);
		ele.aftere = ele.aftere || ElementUtil._aftere.bind(ele);
		ele.insertAfter = ele.insertAfter || ElementUtil._insertAfter.bind(ele);
		ele.addClass = ele.addClass || ElementUtil._addClass.bind(ele);
		ele.removeClass = ele.removeClass || ElementUtil._removeClass.bind(ele);
		ele.toggleClass = ele.toggleClass || ElementUtil._toggleClass.bind(ele);
		ele.showVe = ele.showVe || ElementUtil._showVe.bind(ele);
		ele.hideVe = ele.hideVe || ElementUtil._hideVe.bind(ele);
		ele.toggleVe = ele.toggleVe || ElementUtil._toggleVe.bind(ele);
		ele.empty = ele.empty || ElementUtil._empty.bind(ele);
		ele.detach = ele.detach || ElementUtil._detach.bind(ele);
		ele.attr = ele.attr || ElementUtil._attr.bind(ele);
		ele.prop = ele.prop || ElementUtil._prop.bind(ele);
		ele.val = ele.val || ElementUtil._val.bind(ele);
		ele.html = ele.html || ElementUtil._html.bind(ele);
		ele.txt = ele.txt || ElementUtil._txt.bind(ele);
		ele.tooltip = ele.tooltip || ElementUtil._tooltip.bind(ele);
		ele.disableSpellcheck = ele.disableSpellcheck || ElementUtil._disableSpellcheck.bind(ele);
		ele.css = ele.css || ElementUtil._css.bind(ele);
		ele.onn = ele.onn || ElementUtil._onX.bind(ele);
		ele.off = ele.off || ElementUtil._offX.bind(ele);
		ele.onClick = ele.onClick || ElementUtil._onX.bind(ele, "click");
		ele.onContextmenu = ele.onContextmenu || ElementUtil._onX.bind(ele, "contextmenu");
		ele.onChange = ele.onChange || ElementUtil._onX.bind(ele, "change");
		ele.onKeydown = ele.onKeydown || ElementUtil._onX.bind(ele, "keydown");
		ele.onKeyup = ele.onKeyup || ElementUtil._onX.bind(ele, "keyup");
		ele.trigger = ele.trigger || ElementUtil._trigger.bind(ele);
		ele.first = ele.first || ElementUtil._first.bind(ele);
		ele.closeste = ele.closeste || ElementUtil._closeste.bind(ele);
		ele.childrene = ele.childrene || ElementUtil._childrene.bind(ele);
		ele.siblings = ele.siblings || ElementUtil._siblings.bind(ele);
		ele.outerWidthe = ele.outerWidthe || ElementUtil._outerWidthe.bind(ele);
		ele.outerHeighte = ele.outerHeighte || ElementUtil._outerHeighte.bind(ele);

		return ele;
	}

	static _getOrModify_getEle (
		{
			ele,
			outer,
			tag,
			id,
		},
	) {
		if (ele) return {ele, isSetId: true};
		if (outer) return {ele: (new DOMParser()).parseFromString(outer, "text/html").body.childNodes[0], isSetId: true};
		if (tag) return {ele: document.createElement(tag), isSetId: true};
		if (id) {
			const eleId = document.getElementById(id);
			if (!eleId) throw new Error(`Could not find element with ID "${id}"`);
			return {ele: eleId, isSetId: false};
		}
		throw new Error(`Could not find or create element!`);
	}

	/** @this {HTMLElementExtended} */
	static _appends (child) {
		if (typeof child === "string") child = ee`${child}`;
		this.appendChild(child);
		return this;
	}

	/** @this {HTMLElementExtended} */
	static _appendTo (parent) {
		parent.appendChild(this);
		return this;
	}

	/** @this {HTMLElementExtended} */
	static _prependTo (parent) {
		parent.prepend(this);
		return this;
	}

	/** @this {HTMLElementExtended} */
	static _aftere (other) {
		if (typeof other === "string") other = ee`${other}`;
		this.after(other);
		return this;
	}

	/** @this {HTMLElementExtended} */
	static _insertAfter (parent) {
		parent.after(this);
		return this;
	}

	/** @this {HTMLElementExtended} */
	static _addClass (clazz) {
		this.classList.add(clazz);
		return this;
	}

	/** @this {HTMLElementExtended} */
	static _removeClass (clazz) {
		this.classList.remove(clazz);
		return this;
	}

	/** @this {HTMLElementExtended} */
	static _toggleClass (clazz, isActive) {
		if (isActive == null) this.classList.toggle(clazz);
		else if (isActive) this.classList.add(clazz);
		else this.classList.remove(clazz);
		return this;
	}

	/** @this {HTMLElementExtended} */
	static _showVe () {
		this.classList.remove("ve-hidden");
		return this;
	}

	/** @this {HTMLElementExtended} */
	static _hideVe () {
		this.classList.add("ve-hidden");
		return this;
	}

	/** @this {HTMLElementExtended} */
	static _toggleVe (isActive) {
		this.toggleClass("ve-hidden", isActive == null ? isActive : !isActive);
		return this;
	}

	/** @this {HTMLElementExtended} */
	static _empty () {
		this.innerHTML = "";
		return this;
	}

	/** @this {HTMLElementExtended} */
	static _detach () {
		if (this.parentElement) this.parentElement.removeChild(this);
		return this;
	}

	/** @this {HTMLElementExtended} */
	static _attr (name, value) {
		if (value === undefined) return this.getAttribute(name);
		this.setAttribute(name, value);
		return this;
	}

	/** @this {HTMLElementExtended} */
	static _prop (name, value) {
		if (value === undefined) return this[name];
		this[name] = value;
		return this;
	}

	/** @this {HTMLElementExtended} */
	static _html (html) {
		if (html === undefined) return this.innerHTML;
		this.innerHTML = html;
		return this;
	}

	/** @this {HTMLElementExtended} */
	static _txt (txt) {
		if (txt === undefined) return this.innerText;
		this.innerText = txt;
		return this;
	}

	/** @this {HTMLElementExtended} */
	static _tooltip (title) {
		return this.attr("title", title);
	}

	/** @this {HTMLElementExtended} */
	static _disableSpellcheck () {
		// avoid setting input type to "search" as it visually offsets the contents of the input
		return this
			.attr("autocomplete", "new-password")
			.attr("autocapitalize", "off")
			.attr("spellcheck", "false");
	}

	/** @this {HTMLElementExtended} */
	static _css (obj) {
		Object.entries(obj)
			.forEach(([k, v]) => this.style[k] = v);
		return this;
	}

	/** @this {HTMLElementExtended} */
	static _onX (evtName, fn) {
		this.addEventListener(evtName, fn);
		return this;
	}

	/** @this {HTMLElementExtended} */
	static _offX (evtName, fn) {
		this.removeEventListener(evtName, fn);
		return this;
	}

	/** @this {HTMLElementExtended} */
	static _trigger (evtOrEvtName) {
		const evt = evtOrEvtName instanceof Event ? evtOrEvtName : new Event(evtOrEvtName);
		this.dispatchEvent(evt);
		return this;
	}

	/** @this {HTMLElementExtended} */
	static _val (val, {isSetAttribute = false} = {}) {
		if (val !== undefined) {
			switch (this.tagName) {
				case "SELECT": {
					let selectedIndexNxt = -1;
					for (let i = 0, len = this.options.length; i < len; ++i) {
						if (this.options[i]?.value === val) {
							selectedIndexNxt = i;
							if (isSetAttribute) this.options[i].setAttribute("selected", "selected");
							break;
						}
					}
					this.selectedIndex = selectedIndexNxt;
					return this;
				}

				default: {
					this.value = val;
					return this;
				}
			}
		}

		switch (this.tagName) {
			case "SELECT": return this.options[this.selectedIndex]?.value;

			default: return this.value;
		}
	}

	/** @this {HTMLElementExtended} */
	static _first (selector) {
		const child = this.querySelector(selector);
		if (!child) return child;
		return e_({ele: child});
	}

	/** @this {HTMLElementExtended} */
	static _closeste (selector) {
		const sibling = this.closest(selector);
		if (!sibling) return sibling;
		return e_({ele: sibling});
	}

	/** @this {HTMLElementExtended} */
	static _childrene (selector) {
		if (!selector) return [...this.children].map(child => e_({ele: child}));
		return em(selector, this);
	}

	/** @this {HTMLElementExtended} */
	static _siblings (selector) {
		if (!selector) {
			return [...this.parentNode.children]
				.filter(ele => ele !== this)
				.map(ele => e_({ele: ele}));
		}

		return [...this.parentNode.querySelectorAll(`:scope > ${selector}`)]
			.filter(ele => ele !== this)
			.map(ele => e_({ele: ele}));
	}

	/** @this {HTMLElementExtended} */
	static _outerWidthe () { return this.getBoundingClientRect().width; }

	/** @this {HTMLElementExtended} */
	static _outerHeighte () { return this.getBoundingClientRect().height; }

	/* -------------------------------------------- */

	/**
	 * @return {?HTMLElementExtended}
	 */
	static getBySelector (selector, parent) {
		const ele = (parent || document).querySelector(selector);
		if (!ele) return null;
		return e_({ele});
	}

	/**
	 * @return {Array<HTMLElementExtended>}
	 */
	static getBySelectorMulti (selector, parent) {
		return [...(parent || document).querySelectorAll(selector)]
			.map(ele => e_({ele}));
	}

	/* -------------------------------------------- */

	// region "Static"
	static getIndexPathToParent (parent, child) {
		if (!parent.contains(child)) return null; // Should never occur

		const path = [];

		while (child !== parent) {
			if (!child.parentElement) return null; // Should never occur

			const ix = [...child.parentElement.children].indexOf(child);
			if (!~ix) return null; // Should never occur

			path.push(ix);

			child = child.parentElement;
		}

		return path.reverse();
	}

	static getChildByIndexPath (parent, indexPath) {
		for (let i = 0; i < indexPath.length; ++i) {
			const ix = indexPath[i];
			parent = parent.children[ix];
			if (!parent) return null;
		}
		return parent;
	}
	// endregion
}

globalThis.ElementUtil = ElementUtil;

if (typeof window !== "undefined") {
	/**
	 * @return {HTMLElementExtended}
	 */
	window.e_ = ElementUtil.getOrModify.bind(ElementUtil);

	/**
	 * @return {HTMLElementExtended}
	 */
	window.es = ElementUtil.getBySelector.bind(ElementUtil);

	/**
	 * @return {Array<HTMLElementExtended>}
	 */
	window.em = ElementUtil.getBySelectorMulti.bind(ElementUtil);
}

globalThis.ObjUtil = {
	async pForEachDeep (source, pCallback, options = {depth: Infinity, callEachLevel: false}) {
		const path = [];
		const pDiveDeep = async function (val, path, depth = 0) {
			if (options.callEachLevel || typeof val !== "object" || options.depth === depth) {
				await pCallback(val, path, depth);
			}
			if (options.depth !== depth && typeof val === "object") {
				for (const key of Object.keys(val)) {
					path.push(key);
					await pDiveDeep(val[key], path, depth + 1);
				}
			}
			path.pop();
		};
		await pDiveDeep(source, path);
	},
};

// TODO refactor specific utils out of this
globalThis.MiscUtil = class {
	static COLOR_HEALTHY = "#00bb20";
	static COLOR_HURT = "#c5ca00";
	static COLOR_BLOODIED = "#f7a100";
	static COLOR_DEFEATED = "#cc0000";

	/**
	 * @param obj
	 * @param isSafe
	 * @param isPreserveUndefinedValueKeys Otherwise, drops the keys of `undefined` values
	 * (e.g. `{a: undefined}` -> `{}`).
	 */
	static copy (obj, {isSafe = false, isPreserveUndefinedValueKeys = false} = {}) {
		if (isSafe && obj === undefined) return undefined; // Generally use "unsafe," as this helps identify bugs.
		return JSON.parse(JSON.stringify(obj));
	}

	static copyFast (obj) {
		if ((typeof obj !== "object") || obj == null) return obj;

		if (obj instanceof Array) return obj.map(MiscUtil.copyFast);

		const cpy = {};
		for (const k of Object.keys(obj)) cpy[k] = MiscUtil.copyFast(obj[k]);
		return cpy;
	}

	static async pCopyTextToClipboard (text) {
		function doCompatibilityCopy () {
			const $iptTemp = $(`<textarea class="clp__wrp-temp"></textarea>`)
				.appendTo(document.body)
				.val(text)
				.select();
			document.execCommand("Copy");
			$iptTemp.remove();
		}

		try {
			await navigator.clipboard.writeText(text);
		} catch (e) {
			doCompatibilityCopy();
		}
	}

	static async pCopyBlobToClipboard (blob) {
		// https://developer.mozilla.org/en-US/docs/Web/API/ClipboardItem#browser_compatibility
		// TODO(Future) remove when Firefox moves feature from Nightly -> Main
		if (typeof ClipboardItem === "undefined") {
			JqueryUtil.doToast({
				type: "danger",
				content: `Could not access clipboard! If you are on Firefox, visit <code>about:config</code> and enable </code><code>dom.events.asyncClipboard.clipboardItem</code>.`,
				isAutoHide: false,
			});
			return;
		}

		try {
			await navigator.clipboard.write([
				new ClipboardItem({[blob.type]: blob}),
			]);
			return true;
		} catch (e) {
			if (e.message.includes("Document is not focused")) {
				JqueryUtil.doToast({type: "danger", content: `Please focus the window first!`});
				return false;
			}

			JqueryUtil.doToast({type: "danger", content: `Failed to copy! ${VeCt.STR_SEE_CONSOLE}`});
			throw e;
		}
	}

	static checkProperty (object, ...path) {
		for (let i = 0; i < path.length; ++i) {
			object = object[path[i]];
			if (object == null) return false;
		}
		return true;
	}

	static get (object, ...path) {
		if (object == null) return object;
		for (let i = 0; i < path.length; ++i) {
			object = object[path[i]];
			if (object == null) return object;
		}
		return object;
	}

	static set (object, ...pathAndVal) {
		if (object == null) return object;

		const val = pathAndVal.pop();
		if (!pathAndVal.length) return null;

		const len = pathAndVal.length;
		for (let i = 0; i < len; ++i) {
			const pathPart = pathAndVal[i];
			if (i === len - 1) object[pathPart] = val;
			else object = (object[pathPart] = object[pathPart] || {});
		}

		return val;
	}

	static getOrSet (object, ...pathAndVal) {
		if (pathAndVal.length < 2) return null;
		const existing = MiscUtil.get(object, ...pathAndVal.slice(0, -1));
		if (existing != null) return existing;
		return MiscUtil.set(object, ...pathAndVal);
	}

	static getThenSetCopy (object1, object2, ...path) {
		const val = MiscUtil.get(object1, ...path);
		return MiscUtil.set(object2, ...path, MiscUtil.copyFast(val, {isSafe: true}));
	}

	static delete (object, ...path) {
		if (object == null) return object;
		for (let i = 0; i < path.length - 1; ++i) {
			object = object[path[i]];
			if (object == null) return object;
		}
		return delete object[path.last()];
	}

	/** Delete a prop from a nested object, then all now-empty objects backwards from that point. */
	static deleteObjectPath (object, ...path) {
		const stack = [object];

		if (object == null) return object;
		for (let i = 0; i < path.length - 1; ++i) {
			object = object[path[i]];
			stack.push(object);
			if (object === undefined) return object;
		}
		const out = delete object[path.last()];

		for (let i = path.length - 1; i > 0; --i) {
			if (!Object.keys(stack[i]).length) delete stack[i - 1][path[i - 1]];
		}

		return out;
	}

	static merge (obj1, obj2) {
		obj2 = MiscUtil.copyFast(obj2);

		Object.entries(obj2)
			.forEach(([k, v]) => {
				if (obj1[k] == null) {
					obj1[k] = v;
					return;
				}

				if (
					typeof obj1[k] === "object"
					&& typeof v === "object"
					&& !(obj1[k] instanceof Array)
					&& !(v instanceof Array)
				) {
					MiscUtil.merge(obj1[k], v);
					return;
				}

				obj1[k] = v;
			});

		return obj1;
	}

	/**
	 * @deprecated
	 */
	static mix = (superclass) => new MiscUtil._MixinBuilder(superclass);
	static _MixinBuilder = function (superclass) {
		this.superclass = superclass;

		this.with = function (...mixins) {
			return mixins.reduce((c, mixin) => mixin(c), this.superclass);
		};
	};

	static clearSelection () {
		if (document.getSelection) {
			document.getSelection().removeAllRanges();
			document.getSelection().addRange(document.createRange());
		} else if (window.getSelection) {
			if (window.getSelection().removeAllRanges) {
				window.getSelection().removeAllRanges();
				window.getSelection().addRange(document.createRange());
			} else if (window.getSelection().empty) {
				window.getSelection().empty();
			}
		} else if (document.selection) {
			document.selection.empty();
		}
	}

	static randomColor () {
		let r; let g; let b;
		const h = RollerUtil.randomise(30, 0) / 30;
		const i = ~~(h * 6);
		const f = h * 6 - i;
		const q = 1 - f;
		switch (i % 6) {
			case 0: r = 1; g = f; b = 0; break;
			case 1: r = q; g = 1; b = 0; break;
			case 2: r = 0; g = 1; b = f; break;
			case 3: r = 0; g = q; b = 1; break;
			case 4: r = f; g = 0; b = 1; break;
			case 5: r = 1; g = 0; b = q; break;
		}
		return `#${`00${(~~(r * 255)).toString(16)}`.slice(-2)}${`00${(~~(g * 255)).toString(16)}`.slice(-2)}${`00${(~~(b * 255)).toString(16)}`.slice(-2)}`;
	}

	/**
	 * @param hex Original hex color.
	 * @param [opts] Options object.
	 * @param [opts.bw] True if the color should be returnes as black/white depending on contrast ratio.
	 * @param [opts.dark] Color to return if a "dark" color would contrast best.
	 * @param [opts.light] Color to return if a "light" color would contrast best.
	 */
	static invertColor (hex, opts) {
		opts = opts || {};

		hex = hex.slice(1); // remove #

		let r = parseInt(hex.slice(0, 2), 16);
		let g = parseInt(hex.slice(2, 4), 16);
		let b = parseInt(hex.slice(4, 6), 16);

		// http://stackoverflow.com/a/3943023/112731
		const isDark = (r * 0.299 + g * 0.587 + b * 0.114) > 186;
		if (opts.dark && opts.light) return isDark ? opts.dark : opts.light;
		else if (opts.bw) return isDark ? "#000000" : "#FFFFFF";

		r = (255 - r).toString(16); g = (255 - g).toString(16); b = (255 - b).toString(16);
		return `#${[r, g, b].map(it => it.padStart(2, "0")).join("")}`;
	}

	static scrollPageTop () {
		document.body.scrollTop = document.documentElement.scrollTop = 0;
	}

	static expEval (str) {
		// eslint-disable-next-line no-new-func
		return new Function(`return ${str.replace(/[^-()\d/*+.]/g, "")}`)();
	}

	static parseNumberRange (input, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) {
		if (!input || !input.trim()) return null;

		const errInvalid = input => { throw new Error(`Could not parse range input "${input}"`); };

		const errOutOfRange = () => { throw new Error(`Number was out of range! Range was ${min}-${max} (inclusive).`); };

		const isOutOfRange = (num) => num < min || num > max;

		const addToRangeVal = (range, num) => range.add(num);

		const addToRangeLoHi = (range, lo, hi) => {
			for (let i = lo; i <= hi; ++i) range.add(i);
		};

		const clean = input.replace(/\s*/g, "");
		if (!/^((\d+-\d+|\d+),)*(\d+-\d+|\d+)$/.exec(clean)) errInvalid();

		const parts = clean.split(",");
		const out = new Set();

		for (const part of parts) {
			if (part.includes("-")) {
				const spl = part.split("-");
				const numLo = Number(spl[0]);
				const numHi = Number(spl[1]);

				if (isNaN(numLo) || isNaN(numHi) || numLo === 0 || numHi === 0 || numLo > numHi) errInvalid();

				if (isOutOfRange(numLo) || isOutOfRange(numHi)) errOutOfRange();

				if (numLo === numHi) addToRangeVal(out, numLo);
				else addToRangeLoHi(out, numLo, numHi);
				continue;
			}

			const num = Number(part);
			if (isNaN(num) || num === 0) errInvalid();

			if (isOutOfRange(num)) errOutOfRange();
			addToRangeVal(out, num);
		}

		return out;
	}

	static findCommonPrefix (strArr, {isRespectWordBoundaries} = {}) {
		if (!strArr?.length) return "";

		if (isRespectWordBoundaries) {
			return MiscUtil._findCommonPrefixSuffixWords({strArr});
		}

		let prefix = null;
		strArr.forEach(s => {
			if (prefix == null) {
				prefix = s;
				return;
			}

			const minLen = Math.min(s.length, prefix.length);
			for (let i = 0; i < minLen; ++i) {
				const cp = prefix[i];
				const cs = s[i];
				if (cp !== cs) {
					prefix = prefix.substring(0, i);
					break;
				}
			}
		});
		return prefix;
	}

	static findCommonSuffix (strArr, {isRespectWordBoundaries} = {}) {
		if (!isRespectWordBoundaries) throw new Error(`Unimplemented!`);

		if (!strArr?.length) return "";

		return MiscUtil._findCommonPrefixSuffixWords({strArr, isSuffix: true});
	}

	static _findCommonPrefixSuffixWords ({strArr, isSuffix}) {
		let prefixTks = null;
		let lenMax = -1;

		strArr
			.map(str => {
				lenMax = Math.max(lenMax, str.length);
				return str.split(" ");
			})
			.forEach(tks => {
				if (isSuffix) tks.reverse();

				if (prefixTks == null) return prefixTks = [...tks];

				const minLen = Math.min(tks.length, prefixTks.length);
				while (prefixTks.length > minLen) prefixTks.pop();

				for (let i = 0; i < minLen; ++i) {
					const cp = prefixTks[i];
					const cs = tks[i];
					if (cp !== cs) {
						prefixTks = prefixTks.slice(0, i);
						break;
					}
				}
			});

		if (isSuffix) prefixTks.reverse();

		if (!prefixTks.length) return "";

		const out = prefixTks.join(" ");
		if (out.length === lenMax) return out;

		return isSuffix
			? ` ${prefixTks.join(" ")}`
			: `${prefixTks.join(" ")} `;
	}

	/**
	 * @param fgHexTarget Target/resultant color for the foreground item
	 * @param fgOpacity Desired foreground transparency (0-1 inclusive)
	 * @param bgHex Background color
	 */
	static calculateBlendedColor (fgHexTarget, fgOpacity, bgHex) {
		const fgDcTarget = CryptUtil.hex2Dec(fgHexTarget);
		const bgDc = CryptUtil.hex2Dec(bgHex);
		return ((fgDcTarget - ((1 - fgOpacity) * bgDc)) / fgOpacity).toString(16);
	}

	/**
	 * Borrowed from lodash.
	 *
	 * @param func The function to debounce.
	 * @param wait Minimum duration between calls.
	 * @param options Options object.
	 * @return {Function} The debounced function.
	 */
	static debounce (func, wait, options) {
		let lastArgs; let lastThis; let maxWait; let result; let timerId; let lastCallTime; let lastInvokeTime = 0; let leading = false; let maxing = false; let trailing = true;

		wait = Number(wait) || 0;
		if (typeof options === "object") {
			leading = !!options.leading;
			maxing = "maxWait" in options;
			maxWait = maxing ? Math.max(Number(options.maxWait) || 0, wait) : maxWait;
			trailing = "trailing" in options ? !!options.trailing : trailing;
		}

		function invokeFunc (time) {
			let args = lastArgs; let thisArg = lastThis;

			lastArgs = lastThis = undefined;
			lastInvokeTime = time;
			result = func.apply(thisArg, args);
			return result;
		}

		function leadingEdge (time) {
			lastInvokeTime = time;
			timerId = setTimeout(timerExpired, wait);
			return leading ? invokeFunc(time) : result;
		}

		function remainingWait (time) {
			let timeSinceLastCall = time - lastCallTime; let timeSinceLastInvoke = time - lastInvokeTime; let result = wait - timeSinceLastCall;
			return maxing ? Math.min(result, maxWait - timeSinceLastInvoke) : result;
		}

		function shouldInvoke (time) {
			let timeSinceLastCall = time - lastCallTime; let timeSinceLastInvoke = time - lastInvokeTime;

			return (lastCallTime === undefined || (timeSinceLastCall >= wait) || (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
		}

		function timerExpired () {
			const time = Date.now();
			if (shouldInvoke(time)) {
				return trailingEdge(time);
			}
			// Restart the timer.
			timerId = setTimeout(timerExpired, remainingWait(time));
		}

		function trailingEdge (time) {
			timerId = undefined;

			if (trailing && lastArgs) return invokeFunc(time);
			lastArgs = lastThis = undefined;
			return result;
		}

		function cancel () {
			if (timerId !== undefined) clearTimeout(timerId);
			lastInvokeTime = 0;
			lastArgs = lastCallTime = lastThis = timerId = undefined;
		}

		function flush () {
			return timerId === undefined ? result : trailingEdge(Date.now());
		}

		function debounced () {
			let time = Date.now(); let isInvoking = shouldInvoke(time);
			lastArgs = arguments;
			lastThis = this;
			lastCallTime = time;

			if (isInvoking) {
				if (timerId === undefined) return leadingEdge(lastCallTime);
				if (maxing) {
					// Handle invocations in a tight loop.
					timerId = setTimeout(timerExpired, wait);
					return invokeFunc(lastCallTime);
				}
			}
			if (timerId === undefined) timerId = setTimeout(timerExpired, wait);
			return result;
		}

		debounced.cancel = cancel;
		debounced.flush = flush;
		return debounced;
	}

	// from lodash
	static throttle (func, wait, options) {
		let leading = true; let trailing = true;

		if (typeof options === "object") {
			leading = "leading" in options ? !!options.leading : leading;
			trailing = "trailing" in options ? !!options.trailing : trailing;
		}

		return this.debounce(func, wait, {leading, maxWait: wait, trailing});
	}

	static pDelay (msecs, resolveAs) {
		return new Promise(resolve => setTimeout(() => resolve(resolveAs), msecs));
	}

	static GENERIC_WALKER_ENTRIES_KEY_BLOCKLIST = new Set(["caption", "type", "colLabels", "colLabelRows", "name", "colStyles", "style", "shortName", "subclassShortName", "id", "path", "source"]);

	/**
	 * @abstract
	 */
	static _WalkerBase = class {
		/**
		 * @param [opts]
		 * @param [opts.keyBlocklist]
		 * @param [opts.isAllowDeleteObjects] If returning `undefined` from an object handler should be treated as a delete.
		 * @param [opts.isAllowDeleteArrays] If returning `undefined` from an array handler should be treated as a delete.
		 * @param [opts.isAllowDeleteBooleans] (Unimplemented) // TODO
		 * @param [opts.isAllowDeleteNumbers] (Unimplemented) // TODO
		 * @param [opts.isAllowDeleteStrings] (Unimplemented) // TODO
		 * @param [opts.isDepthFirst] If array/object recursion should occur before array/object primitive handling.
		 * @param [opts.isNoModification] If the walker should not attempt to modify the data.
		 * @param [opts.isBreakOnReturn] If the walker should fast-exist on any handler returning a value.
		 */
		constructor (
			{
				keyBlocklist,
				isAllowDeleteObjects,
				isAllowDeleteArrays,
				isAllowDeleteBooleans,
				isAllowDeleteNumbers,
				isAllowDeleteStrings,
				isDepthFirst,
				isNoModification,
				isBreakOnReturn,
			} = {},
		) {
			this._keyBlocklist = keyBlocklist || new Set();
			this._isAllowDeleteObjects = isAllowDeleteObjects;
			this._isAllowDeleteArrays = isAllowDeleteArrays;
			this._isAllowDeleteBooleans = isAllowDeleteBooleans;
			this._isAllowDeleteNumbers = isAllowDeleteNumbers;
			this._isAllowDeleteStrings = isAllowDeleteStrings;
			this._isDepthFirst = isDepthFirst;
			this._isNoModification = isNoModification;
			this._isBreakOnReturn = isBreakOnReturn;

			if (isBreakOnReturn && !isNoModification) throw new Error(`"isBreakOnReturn" may only be used in "isNoModification" mode!`);
		}
	};

	static _WalkerSync = class extends this._WalkerBase {
		_applyHandlers ({handlers, obj, lastKey, stack}) {
			handlers = handlers instanceof Array ? handlers : [handlers];
			const didBreak = handlers.some(h => {
				const out = h(obj, lastKey, stack);
				if (this._isBreakOnReturn && out) return true;
				if (!this._isNoModification) obj = out;
			});
			if (didBreak) return VeCt.SYM_WALKER_BREAK;
			return obj;
		}

		_runHandlers ({handlers, obj, lastKey, stack}) {
			handlers = handlers instanceof Array ? handlers : [handlers];
			handlers.forEach(h => h(obj, lastKey, stack));
		}

		_doObjectRecurse (obj, primitiveHandlers, stack) {
			for (const k of Object.keys(obj)) {
				if (this._keyBlocklist.has(k)) continue;

				const out = this.walk(obj[k], primitiveHandlers, k, stack);
				if (out === VeCt.SYM_WALKER_BREAK) return VeCt.SYM_WALKER_BREAK;
				if (!this._isNoModification) obj[k] = out;
			}
		}

		_getMappedPrimitive (obj, primitiveHandlers, lastKey, stack, prop, propPre, propPost) {
			if (primitiveHandlers[propPre]) this._runHandlers({handlers: primitiveHandlers[propPre], obj, lastKey, stack});
			if (primitiveHandlers[prop]) {
				const out = this._applyHandlers({handlers: primitiveHandlers[prop], obj, lastKey, stack});
				if (out === VeCt.SYM_WALKER_BREAK) return out;
				if (!this._isNoModification) obj = out;
			}
			if (primitiveHandlers[propPost]) this._runHandlers({handlers: primitiveHandlers[propPost], obj, lastKey, stack});
			return obj;
		}

		_getMappedArray (obj, primitiveHandlers, lastKey, stack) {
			if (primitiveHandlers.preArray) this._runHandlers({handlers: primitiveHandlers.preArray, obj, lastKey, stack});
			if (this._isDepthFirst) {
				if (stack) stack.push(obj);
				const out = new Array(obj.length);
				for (let i = 0, len = out.length; i < len; ++i) {
					out[i] = this.walk(obj[i], primitiveHandlers, lastKey, stack);
					if (out[i] === VeCt.SYM_WALKER_BREAK) return out[i];
				}
				if (!this._isNoModification) obj = out;
				if (stack) stack.pop();

				if (primitiveHandlers.array) {
					const out = this._applyHandlers({handlers: primitiveHandlers.array, obj, lastKey, stack});
					if (out === VeCt.SYM_WALKER_BREAK) return out;
					if (!this._isNoModification) obj = out;
				}
				if (obj == null) {
					if (!this._isAllowDeleteArrays) throw new Error(`Array handler(s) returned null!`);
				}
			} else {
				if (primitiveHandlers.array) {
					const out = this._applyHandlers({handlers: primitiveHandlers.array, obj, lastKey, stack});
					if (out === VeCt.SYM_WALKER_BREAK) return out;
					if (!this._isNoModification) obj = out;
				}
				if (obj != null) {
					const out = new Array(obj.length);
					for (let i = 0, len = out.length; i < len; ++i) {
						if (stack) stack.push(obj);
						out[i] = this.walk(obj[i], primitiveHandlers, lastKey, stack);
						if (stack) stack.pop();
						if (out[i] === VeCt.SYM_WALKER_BREAK) return out[i];
					}
					if (!this._isNoModification) obj = out;
				} else {
					if (!this._isAllowDeleteArrays) throw new Error(`Array handler(s) returned null!`);
				}
			}
			if (primitiveHandlers.postArray) this._runHandlers({handlers: primitiveHandlers.postArray, obj, lastKey, stack});
			return obj;
		}

		_getMappedObject (obj, primitiveHandlers, lastKey, stack) {
			if (primitiveHandlers.preObject) this._runHandlers({handlers: primitiveHandlers.preObject, obj, lastKey, stack});
			if (this._isDepthFirst) {
				if (stack) stack.push(obj);
				const flag = this._doObjectRecurse(obj, primitiveHandlers, stack);
				if (stack) stack.pop();
				if (flag === VeCt.SYM_WALKER_BREAK) return flag;

				if (primitiveHandlers.object) {
					const out = this._applyHandlers({handlers: primitiveHandlers.object, obj, lastKey, stack});
					if (out === VeCt.SYM_WALKER_BREAK) return out;
					if (!this._isNoModification) obj = out;
				}
				if (obj == null) {
					if (!this._isAllowDeleteObjects) throw new Error(`Object handler(s) returned null!`);
				}
			} else {
				if (primitiveHandlers.object) {
					const out = this._applyHandlers({handlers: primitiveHandlers.object, obj, lastKey, stack});
					if (out === VeCt.SYM_WALKER_BREAK) return out;
					if (!this._isNoModification) obj = out;
				}
				if (obj == null) {
					if (!this._isAllowDeleteObjects) throw new Error(`Object handler(s) returned null!`);
				} else {
					if (stack) stack.push(obj);
					const flag = this._doObjectRecurse(obj, primitiveHandlers, stack);
					if (stack) stack.pop();
					if (flag === VeCt.SYM_WALKER_BREAK) return flag;
				}
			}
			if (primitiveHandlers.postObject) this._runHandlers({handlers: primitiveHandlers.postObject, obj, lastKey, stack});
			return obj;
		}

		walk (obj, primitiveHandlers, lastKey, stack) {
			if (obj === null) return this._getMappedPrimitive(obj, primitiveHandlers, lastKey, stack, "null", "preNull", "postNull");

			switch (typeof obj) {
				case "undefined": return this._getMappedPrimitive(obj, primitiveHandlers, lastKey, stack, "undefined", "preUndefined", "postUndefined");
				case "boolean": return this._getMappedPrimitive(obj, primitiveHandlers, lastKey, stack, "boolean", "preBoolean", "postBoolean");
				case "number": return this._getMappedPrimitive(obj, primitiveHandlers, lastKey, stack, "number", "preNumber", "postNumber");
				case "string": return this._getMappedPrimitive(obj, primitiveHandlers, lastKey, stack, "string", "preString", "postString");
				case "object": {
					if (obj instanceof Array) return this._getMappedArray(obj, primitiveHandlers, lastKey, stack);
					return this._getMappedObject(obj, primitiveHandlers, lastKey, stack);
				}
				default: throw new Error(`Unhandled type "${typeof obj}"`);
			}
		}
	};

	// TODO refresh to match sync version
	static _WalkerAsync = class extends this._WalkerBase {
		async _pApplyHandlers ({handlers, obj, lastKey, stack}) {
			handlers = handlers instanceof Array ? handlers : [handlers];
			await handlers.pSerialAwaitMap(async pH => {
				const out = await pH(obj, lastKey, stack);
				if (!this._isNoModification) obj = out;
			});
			return obj;
		}

		async _pRunHandlers ({handlers, obj, lastKey, stack}) {
			handlers = handlers instanceof Array ? handlers : [handlers];
			await handlers.pSerialAwaitMap(pH => pH(obj, lastKey, stack));
		}

		async pWalk (obj, primitiveHandlers, lastKey, stack) {
			if (obj == null) {
				if (primitiveHandlers.null) return this._pApplyHandlers({handlers: primitiveHandlers.null, obj, lastKey, stack});
				return obj;
			}

			const pDoObjectRecurse = async () => {
				await Object.keys(obj).pSerialAwaitMap(async k => {
					const v = obj[k];
					if (this._keyBlocklist.has(k)) return;
					const out = await this.pWalk(v, primitiveHandlers, k, stack);
					if (!this._isNoModification) obj[k] = out;
				});
			};

			const to = typeof obj;
			switch (to) {
				case undefined:
					if (primitiveHandlers.preUndefined) await this._pRunHandlers({handlers: primitiveHandlers.preUndefined, obj, lastKey, stack});
					if (primitiveHandlers.undefined) {
						const out = await this._pApplyHandlers({handlers: primitiveHandlers.undefined, obj, lastKey, stack});
						if (!this._isNoModification) obj = out;
					}
					if (primitiveHandlers.postUndefined) await this._pRunHandlers({handlers: primitiveHandlers.postUndefined, obj, lastKey, stack});
					return obj;
				case "boolean":
					if (primitiveHandlers.preBoolean) await this._pRunHandlers({handlers: primitiveHandlers.preBoolean, obj, lastKey, stack});
					if (primitiveHandlers.boolean) {
						const out = await this._pApplyHandlers({handlers: primitiveHandlers.boolean, obj, lastKey, stack});
						if (!this._isNoModification) obj = out;
					}
					if (primitiveHandlers.postBoolean) await this._pRunHandlers({handlers: primitiveHandlers.postBoolean, obj, lastKey, stack});
					return obj;
				case "number":
					if (primitiveHandlers.preNumber) await this._pRunHandlers({handlers: primitiveHandlers.preNumber, obj, lastKey, stack});
					if (primitiveHandlers.number) {
						const out = await this._pApplyHandlers({handlers: primitiveHandlers.number, obj, lastKey, stack});
						if (!this._isNoModification) obj = out;
					}
					if (primitiveHandlers.postNumber) await this._pRunHandlers({handlers: primitiveHandlers.postNumber, obj, lastKey, stack});
					return obj;
				case "string":
					if (primitiveHandlers.preString) await this._pRunHandlers({handlers: primitiveHandlers.preString, obj, lastKey, stack});
					if (primitiveHandlers.string) {
						const out = await this._pApplyHandlers({handlers: primitiveHandlers.string, obj, lastKey, stack});
						if (!this._isNoModification) obj = out;
					}
					if (primitiveHandlers.postString) await this._pRunHandlers({handlers: primitiveHandlers.postString, obj, lastKey, stack});
					return obj;
				case "object": {
					if (obj instanceof Array) {
						if (primitiveHandlers.preArray) await this._pRunHandlers({handlers: primitiveHandlers.preArray, obj, lastKey, stack});
						if (this._isDepthFirst) {
							if (stack) stack.push(obj);
							const out = await obj.pSerialAwaitMap(it => this.pWalk(it, primitiveHandlers, lastKey, stack));
							if (!this._isNoModification) obj = out;
							if (stack) stack.pop();

							if (primitiveHandlers.array) {
								const out = await this._pApplyHandlers({handlers: primitiveHandlers.array, obj, lastKey, stack});
								if (!this._isNoModification) obj = out;
							}
							if (obj == null) {
								if (!this._isAllowDeleteArrays) throw new Error(`Array handler(s) returned null!`);
							}
						} else {
							if (primitiveHandlers.array) {
								const out = await this._pApplyHandlers({handlers: primitiveHandlers.array, obj, lastKey, stack});
								if (!this._isNoModification) obj = out;
							}
							if (obj != null) {
								const out = await obj.pSerialAwaitMap(it => this.pWalk(it, primitiveHandlers, lastKey, stack));
								if (!this._isNoModification) obj = out;
							} else {
								if (!this._isAllowDeleteArrays) throw new Error(`Array handler(s) returned null!`);
							}
						}
						if (primitiveHandlers.postArray) await this._pRunHandlers({handlers: primitiveHandlers.postArray, obj, lastKey, stack});
						return obj;
					} else {
						if (primitiveHandlers.preObject) await this._pRunHandlers({handlers: primitiveHandlers.preObject, obj, lastKey, stack});
						if (this._isDepthFirst) {
							if (stack) stack.push(obj);
							await pDoObjectRecurse();
							if (stack) stack.pop();

							if (primitiveHandlers.object) {
								const out = await this._pApplyHandlers({handlers: primitiveHandlers.object, obj, lastKey, stack});
								if (!this._isNoModification) obj = out;
							}
							if (obj == null) {
								if (!this._isAllowDeleteObjects) throw new Error(`Object handler(s) returned null!`);
							}
						} else {
							if (primitiveHandlers.object) {
								const out = await this._pApplyHandlers({handlers: primitiveHandlers.object, obj, lastKey, stack});
								if (!this._isNoModification) obj = out;
							}
							if (obj == null) {
								if (!this._isAllowDeleteObjects) throw new Error(`Object handler(s) returned null!`);
							} else {
								await pDoObjectRecurse();
							}
						}
						if (primitiveHandlers.postObject) await this._pRunHandlers({handlers: primitiveHandlers.postObject, obj, lastKey, stack});
						return obj;
					}
				}
				default: throw new Error(`Unhandled type "${to}"`);
			}
		}
	};

	/**
	 * @param [opts]
	 * @param [opts.keyBlocklist]
	 * @param [opts.isAllowDeleteObjects] If returning `undefined` from an object handler should be treated as a delete.
	 * @param [opts.isAllowDeleteArrays] If returning `undefined` from an array handler should be treated as a delete.
	 * @param [opts.isAllowDeleteBooleans] (Unimplemented) // TODO
	 * @param [opts.isAllowDeleteNumbers] (Unimplemented) // TODO
	 * @param [opts.isAllowDeleteStrings] (Unimplemented) // TODO
	 * @param [opts.isDepthFirst] If array/object recursion should occur before array/object primitive handling.
	 * @param [opts.isNoModification] If the walker should not attempt to modify the data.
	 * @param [opts.isBreakOnReturn] If the walker should fast-exist on any handler returning a value.
	 */
	static getWalker (opts) {
		opts ||= {};
		return new MiscUtil._WalkerSync(opts);
	}

	/**
	 * TODO refresh to match sync version
	 * @param [opts]
	 * @param [opts.keyBlocklist]
	 * @param [opts.isAllowDeleteObjects] If returning `undefined` from an object handler should be treated as a delete.
	 * @param [opts.isAllowDeleteArrays] If returning `undefined` from an array handler should be treated as a delete.
	 * @param [opts.isAllowDeleteBooleans] (Unimplemented) // TODO
	 * @param [opts.isAllowDeleteNumbers] (Unimplemented) // TODO
	 * @param [opts.isAllowDeleteStrings] (Unimplemented) // TODO
	 * @param [opts.isDepthFirst] If array/object recursion should occur before array/object primitive handling.
	 * @param [opts.isNoModification] If the walker should not attempt to modify the data.
	 */
	static getAsyncWalker (opts) {
		opts ||= {};
		return new MiscUtil._WalkerAsync(opts);
	}

	static pDefer (fn) {
		return (async () => fn())();
	}

	static isNearStrictlyEqual (a, b) {
		if (a == null && b == null) return true;
		if (a == null && b != null) return false;
		if (a != null && b == null) return false;
		return a === b;
	}

	static getDatUrl (blob) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result);
			reader.onerror = () => reject(reader.error);
			reader.onabort = () => reject(new Error("Read aborted"));
			reader.readAsDataURL(blob);
		});
	}

	static getColorStylePart (color) {
		return `color: #${color} !important; border-color: #${color} !important; text-decoration-color: #${color} !important;`;
	}
};

// EVENT HANDLERS ======================================================================================================
globalThis.EventUtil = class {
	static _mouseX = 0;
	static _mouseY = 0;
	static _isKeydownShift = false;
	static _isKeydownCtrlMeta = false;
	static _isUsingTouch = false;
	static _isSetCssVars = false;

	static init () {
		document.addEventListener("mousemove", evt => {
			EventUtil._mouseX = evt.clientX;
			EventUtil._mouseY = evt.clientY;
			EventUtil._onMouseMove_setCssVars();
		});
		document.addEventListener("touchstart", () => {
			EventUtil._isUsingTouch = true;
		});
		document.addEventListener("keydown", evt => {
			switch (evt.key) {
				case "Shift": return EventUtil._isKeydownShift = true;
				case "Control": return EventUtil._isKeydownCtrlMeta = true;
				case "Meta": return EventUtil._isKeydownCtrlMeta = true;
			}
		});
		document.addEventListener("keyup", evt => {
			switch (evt.key) {
				case "Shift": return EventUtil._isKeydownShift = false;
				case "Control": return EventUtil._isKeydownCtrlMeta = false;
				case "Meta": return EventUtil._isKeydownCtrlMeta = false;
			}
		});
	}

	static _eleDocRoot = null;
	static _onMouseMove_setCssVars () {
		if (!EventUtil._isSetCssVars) return;

		EventUtil._eleDocRoot = EventUtil._eleDocRoot || document.querySelector(":root");

		EventUtil._eleDocRoot.style.setProperty("--mouse-position-x", EventUtil._mouseX);
		EventUtil._eleDocRoot.style.setProperty("--mouse-position-y", EventUtil._mouseY);
	}

	/* -------------------------------------------- */

	static getClientX (evt) { return evt.touches && evt.touches.length ? evt.touches[0].clientX : evt.clientX; }
	static getClientY (evt) { return evt.touches && evt.touches.length ? evt.touches[0].clientY : evt.clientY; }

	static getOffsetY (evt) {
		if (!evt.touches?.length) return evt.offsetY;

		const bounds = evt.target.getBoundingClientRect();
		return evt.targetTouches[0].clientY - bounds.y;
	}

	static getMousePos () {
		return {x: EventUtil._mouseX, y: EventUtil._mouseY};
	}

	/* -------------------------------------------- */

	static isShiftDown () { return EventUtil._isKeydownShift; }

	static isCtrlMetaDown () { return EventUtil._isKeydownCtrlMeta; }

	/* -------------------------------------------- */

	static isUsingTouch () { return !!EventUtil._isUsingTouch; }

	static isInInput (evt) {
		return evt.target.nodeName === "INPUT" || evt.target.nodeName === "TEXTAREA"
			|| evt.target.getAttribute("contenteditable") === "true";
	}

	static isCtrlMetaKey (evt) {
		return evt.ctrlKey || evt.metaKey;
	}

	static noModifierKeys (evt) { return !evt.ctrlKey && !evt.altKey && !evt.metaKey; }

	static getKeyIgnoreCapsLock (evt) {
		if (!evt.key) return null;
		if (evt.key.length !== 1) return evt.key;
		const isCaps = (evt.originalEvent || evt).getModifierState("CapsLock");
		if (!isCaps) return evt.key;
		const asciiCode = evt.key.charCodeAt(0);
		const isUpperCase = asciiCode >= 65 && asciiCode <= 90;
		const isLowerCase = asciiCode >= 97 && asciiCode <= 122;
		if (!isUpperCase && !isLowerCase) return evt.key;
		return isUpperCase ? evt.key.toLowerCase() : evt.key.toUpperCase();
	}

	static isMiddleMouse (evt) { return evt.button === 1; }

	/* -------------------------------------------- */

	// In order of preference/priority.
	// Note: `"application/json"`, as e.g. Founrdy's TinyMCE blocks drops which are not plain text.
	static _MIME_TYPES_DROP_JSON = ["application/json", "text/plain"];

	static getDropJson (evt) {
		let data;
		for (const mimeType of EventUtil._MIME_TYPES_DROP_JSON) {
			if (!evt.dataTransfer.types.includes(mimeType)) continue;

			try {
				const rawJson = evt.dataTransfer.getData(mimeType);
				if (!rawJson) return;
				data = JSON.parse(rawJson);
			} catch (e) {
				// Do nothing
			}
		}
		return data;
	}
};

if (typeof window !== "undefined") window.addEventListener("load", EventUtil.init);

// ANIMATIONS ==========================================================================================================
globalThis.AnimationUtil = class {
	/**
	 * See: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations/Tips
	 *
	 * requestAnimationFrame() [...] gets executed just before the next repaint of the document. [...] because it's
	 * before the repaint, the style recomputation hasn't actually happened yet!
	 * [...] calls requestAnimationFrame() a second time! This time, the callback is run before the next repaint,
	 * which is after the style recomputation has occurred.
	 */
	static async pRecomputeStyles () {
		return new Promise(resolve => {
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					resolve();
				});
			});
		});
	}

	static pLoadImage (uri) {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onerror = err => reject(err);
			img.onload = () => resolve(img);
			img.src = uri;
		});
	}
};

// CONTEXT MENUS =======================================================================================================
globalThis.ContextUtil = {
	_isInit: false,
	_menus: [],

	_init () {
		if (ContextUtil._isInit) return;
		ContextUtil._isInit = true;

		document.body.addEventListener("click", () => ContextUtil.closeAllMenus());
	},

	getMenu (actions) {
		ContextUtil._init();

		const menu = new ContextUtil.Menu(actions);
		ContextUtil._menus.push(menu);
		return menu;
	},

	deleteMenu (menu) {
		if (!menu) return;

		menu.remove();
		const ix = ContextUtil._menus.findIndex(it => it === menu);
		if (~ix) ContextUtil._menus.splice(ix, 1);
	},

	/**
	 * @param evt
	 * @param menu
	 * @param {?object} userData
	 * @return {Promise<*>}
	 */
	pOpenMenu (evt, menu, {userData = null} = {}) {
		evt.preventDefault();
		evt.stopPropagation();

		ContextUtil._init();

		// Close any other open menus
		ContextUtil._menus.filter(it => it !== menu).forEach(it => it.close());

		return menu.pOpen(evt, {userData});
	},

	closeAllMenus () {
		ContextUtil._menus.forEach(menu => menu.close());
	},

	Menu: class {
		constructor (actions) {
			this._actions = actions;
			this._pResult = null;
			this.resolveResult_ = null;

			this.userData = null;

			this._$ele = null;
			this._metasActions = [];

			this._menusSub = [];
		}

		remove () {
			if (!this._$ele) return;
			this._$ele.remove();
			this._$ele = null;
		}

		width () { return this._$ele ? this._$ele.width() : undefined; }
		height () { return this._$ele ? this._$ele.height() : undefined; }

		pOpen (evt, {userData = null, offsetY = null, boundsX = null} = {}) {
			evt.stopPropagation();
			evt.preventDefault();

			this._initLazy();

			if (this.resolveResult_) this.resolveResult_(null);
			this._pResult = new Promise(resolve => {
				this.resolveResult_ = resolve;
			});
			this.userData = userData;

			this._$ele
				// Show as transparent/non-clickable first, so we can get an accurate width/height
				.css({
					left: 0,
					top: 0,
					opacity: 0,
					pointerEvents: "none",
				})
				.showVe()
				// Use the accurate width/height to set the final position, and remove our temp styling
				.css({
					left: this._getMenuPosition(evt, "x", {bounds: boundsX}),
					top: this._getMenuPosition(evt, "y", {offset: offsetY}),
					opacity: "",
					pointerEvents: "",
				});

			this._metasActions[0].$eleRow.focus();

			return this._pResult;
		}

		close () {
			if (!this._$ele) return;
			this._$ele.hideVe();

			this.closeSubMenus();
		}

		isOpen () {
			if (!this._$ele) return false;
			return !this._$ele.hasClass("ve-hidden");
		}

		_initLazy () {
			if (this._$ele) {
				this._metasActions.forEach(meta => meta.action.update());
				return;
			}

			const $elesAction = this._actions.map(it => {
				if (it == null) return $(`<div class="my-1 w-100 ui-ctx__divider"></div>`);

				const rdMeta = it.render({menu: this});
				this._metasActions.push(rdMeta);
				return rdMeta.$eleRow;
			});

			this._$ele = $$`<div class="ve-flex-col ui-ctx__wrp py-2 absolute">${$elesAction}</div>`
				.hideVe()
				.appendTo(document.body);
		}

		_getMenuPosition (evt, axis, {bounds = null, offset = null} = {}) {
			const {fnMenuSize, fnGetEventPos, fnWindowSize, fnScrollDir} = axis === "x"
				? {fnMenuSize: "width", fnGetEventPos: "getClientX", fnWindowSize: "width", fnScrollDir: "scrollLeft"}
				: {fnMenuSize: "height", fnGetEventPos: "getClientY", fnWindowSize: "height", fnScrollDir: "scrollTop"};

			const posMouse = EventUtil[fnGetEventPos](evt);
			const szWin = $(window)[fnWindowSize]();
			const posScroll = $(window)[fnScrollDir]();
			let position = posMouse + posScroll;

			if (offset) position += offset;

			const szMenu = this[fnMenuSize]();

			// region opening menu would violate bounds
			if (bounds != null) {
				const {trailingLower, leadingUpper} = bounds;

				const posTrailing = position;
				const posLeading = position + szMenu;

				if (posTrailing < trailingLower) {
					position += trailingLower - posTrailing;
				} else if (posLeading > leadingUpper) {
					position -= posLeading - leadingUpper;
				}
			}
			// endregion

			// opening menu would pass the side of the page
			if (position + szMenu > szWin && szMenu < position) position -= szMenu;

			return position;
		}

		addSubMenu (menu) {
			this._menusSub.push(menu);
		}

		closeSubMenus (menuSubExclude = null) {
			this._menusSub
				.filter(menuSub => menuSubExclude == null || menuSub !== menuSubExclude)
				.forEach(menuSub => menuSub.close());
		}
	},

	/**
	 * @param text
	 * @param fnAction Action, which is passed its triggering click event as an argument.
	 * @param [opts] Options object.
	 * @param [opts.isDisabled] If this action is disabled.
	 * @param [opts.title] Help (title) text.
	 * @param [opts.style] Additional CSS classes to add (e.g. `ctx-danger`).
	 * @param [opts.fnActionAlt] Alternate action, which can be accessed by clicking a secondary "settings"-esque button.
	 * @param [opts.textAlt] Text for the alt-action button
	 * @param [opts.titleAlt] Title for the alt-action button
	 */
	Action: function (text, fnAction, opts) {
		opts = opts || {};

		this.text = text;
		this.fnAction = fnAction;

		this.isDisabled = opts.isDisabled;
		this.title = opts.title;
		this.style = opts.style;

		this.fnActionAlt = opts.fnActionAlt;
		this.textAlt = opts.textAlt;
		this.titleAlt = opts.titleAlt;

		this.render = function ({menu}) {
			const $btnAction = this._render_$btnAction({menu});
			const $btnActionAlt = this._render_$btnActionAlt({menu});

			return {
				action: this,
				$eleRow: $$`<div class="ui-ctx__row ve-flex-v-center ${this.style || ""}">${$btnAction}${$btnActionAlt}</div>`,
				$eleBtn: $btnAction,
			};
		};

		this._render_$btnAction = function ({menu}) {
			const $btnAction = $(`<div class="w-100 min-w-0 ui-ctx__btn py-1 pl-5 ${this.fnActionAlt ? "" : "pr-5"}" ${this.isDisabled ? "disabled" : ""} tabindex="0">${this.text}</div>`)
				.on("click", async evt => {
					if (this.isDisabled) return;

					evt.preventDefault();
					evt.stopPropagation();

					menu.close();

					const result = await this.fnAction(evt, {userData: menu.userData});
					if (menu.resolveResult_) menu.resolveResult_(result);
				})
				.on("mousedown", evt => {
					evt.preventDefault();
				})
				.keydown(evt => {
					if (evt.key !== "Enter") return;
					$btnAction.click();
				});
			if (this.title) $btnAction.title(this.title);

			return $btnAction;
		};

		this._render_$btnActionAlt = function ({menu}) {
			if (!this.fnActionAlt) return null;

			const $btnActionAlt = $(`<div class="ui-ctx__btn ml-1 bl-1 py-1 px-4" ${this.isDisabled ? "disabled" : ""}>${this.textAlt ?? `<span class="glyphicon glyphicon-cog"></span>`}</div>`)
				.on("click", async evt => {
					if (this.isDisabled) return;

					evt.preventDefault();
					evt.stopPropagation();

					menu.close();

					const result = await this.fnActionAlt(evt, {userData: menu.userData});
					if (menu.resolveResult_) menu.resolveResult_(result);
				})
				.on("mousedown", evt => {
					evt.preventDefault();
				});
			if (this.titleAlt) $btnActionAlt.title(this.titleAlt);

			return $btnActionAlt;
		};

		this.update = function () { /* Implement as required */ };
	},

	ActionLink: function (text, fnHref, opts) {
		ContextUtil.Action.call(this, text, null, opts);

		this.fnHref = fnHref;
		this._$btnAction = null;

		this._render_$btnAction = function () {
			this._$btnAction = $(`<a href="${this.fnHref()}" class="w-100 min-w-0 ui-ctx__btn py-1 pl-5 ${this.fnActionAlt ? "" : "pr-5"}" ${this.isDisabled ? "disabled" : ""} tabindex="0">${this.text}</a>`);
			if (this.title) this._$btnAction.title(this.title);

			return this._$btnAction;
		};

		this.update = function () {
			this._$btnAction.attr("href", this.fnHref());
		};
	},

	ActionSelect: function (
		{
			values,
			fnOnChange = null,
			fnGetDisplayValue = null,
		},
	) {
		this._values = values;
		this._fnOnChange = fnOnChange;
		this._fnGetDisplayValue = fnGetDisplayValue;

		this._sel = null;

		this._ixInitial = null;

		this.render = function ({menu}) {
			this._sel = this._render_sel({menu});

			if (this._ixInitial != null) {
				this._sel.val(`${this._ixInitial}`);
				this._ixInitial = null;
			}

			return {
				action: this,
				$eleRow: $$`<div class="ui-ctx__row ve-flex-v-center">${this._sel}</div>`,
			};
		};

		this._render_sel = function ({menu}) {
			const sel = e_({
				tag: "select",
				clazz: "w-100 min-w-0 mx-5 py-1",
				tabindex: 0,
				children: this._values
					.map((val, i) => {
						return e_({
							tag: "option",
							value: i,
							text: this._fnGetDisplayValue ? this._fnGetDisplayValue(val) : val,
						});
					}),
				click: async evt => {
					evt.preventDefault();
					evt.stopPropagation();
				},
				keydown: evt => {
					if (evt.key !== "Enter") return;
					sel.click();
				},
				change: () => {
					menu.close();

					const ix = Number(sel.val() || 0);
					const val = this._values[ix];

					if (this._fnOnChange) this._fnOnChange(val);
					if (menu.resolveResult_) menu.resolveResult_(val);
				},
			});

			return sel;
		};

		this.setValue = function (val) {
			const ix = this._values.indexOf(val);
			if (!this._sel) return this._ixInitial = ix;
			this._sel.val(`${ix}`);
		};

		this.update = function () { /* Implement as required */ };
	},

	ActionSubMenu: class {
		constructor (name, actions) {
			this._name = name;
			this._actions = actions;
		}

		render ({menu}) {
			const menuSub = ContextUtil.getMenu(this._actions);
			menu.addSubMenu(menuSub);

			const $eleRow = $$`<div class="ui-ctx__btn py-1 px-5 split-v-center">
				<div>${this._name}</div>
				<div class="pl-4"><span class="caret caret--right"></span></div>
			</div>`
				.on("click", async evt => {
					evt.stopPropagation();
					if (menuSub.isOpen()) return menuSub.close();

					menu.closeSubMenus(menuSub);

					const bcr = $eleRow[0].getBoundingClientRect();

					await menuSub.pOpen(
						evt,
						{
							offsetY: bcr.top - EventUtil.getClientY(evt),
							boundsX: {
								trailingLower: bcr.right,
								leadingUpper: bcr.left,
							},
						},
					);

					menu.close();
				})
				.on("mousedown", evt => {
					evt.preventDefault();
				});

			return {
				action: this,
				$eleRow,
			};
		}

		update () { /* Implement as required */ }
	},
};

// LIST AND SEARCH =====================================================================================================
globalThis.SearchUtil = {
	removeStemmer (elasticSearch) {
		const stemmer = elasticlunr.Pipeline.getRegisteredFunction("stemmer");
		elasticSearch.pipeline.remove(stemmer);
	},
};

// ENCODING/DECODING ===================================================================================================
globalThis.UrlUtil = {
	encodeForHash (toEncode) {
		if (toEncode instanceof Array) return toEncode.map(it => `${it}`.toUrlified()).join(HASH_LIST_SEP);
		else return `${toEncode}`.toUrlified();
	},

	encodeArrayForHash (...toEncodes) {
		return toEncodes.map(UrlUtil.encodeForHash).join(HASH_LIST_SEP);
	},

	autoEncodeHash (obj) {
		const curPage = UrlUtil.getCurrentPage();
		const encoder = UrlUtil.URL_TO_HASH_BUILDER[curPage];
		if (!encoder) throw new Error(`No encoder found for page ${curPage}`);
		return encoder(obj);
	},

	decodeHash (hash) {
		return hash.split(HASH_LIST_SEP).map(it => decodeURIComponent(it));
	},

	/* -------------------------------------------- */

	/**
	 * @param hash
	 * @param {?string} page
	 */
	async pAutoDecodeHash (hash, {page = null} = {}) {
		page ||= UrlUtil.getCurrentPage();

		if ([UrlUtil.PG_ADVENTURE, UrlUtil.PG_BOOK].includes(page)) return UrlUtil._pAutoDecodeHashAdventureBookHash(hash, {page});
		return UrlUtil.autoDecodeHash(hash, {page});
	},

	// TODO(Future) expand
	/**
	 * @param hash
	 * @param {?string} page
	 */
	autoDecodeHash (hash, {page = null} = {}) {
		page ||= UrlUtil.getCurrentPage();
		const parts = UrlUtil.decodeHash(hash.toLowerCase().trim());

		if (page === UrlUtil.PG_DEITIES) {
			const [name, pantheon, source] = parts;
			return {name, pantheon, source};
		}

		if (page?.toLowerCase() === "classfeature") {
			const [name, className, classSource, levelRaw, source] = parts;
			return {name, className, classSource, level: Number(levelRaw) || 0, source};
		}

		if (page?.toLowerCase() === "subclassfeature") {
			const [name, className, classSource, subclassShortName, subclassSource, levelRaw, source] = parts;
			return {name, className, classSource, subclassShortName, subclassSource, level: Number(levelRaw) || 0, source};
		}

		// TODO(Future) this is broken for docs where the id != the source
		//   consider indexing
		//   + homebrew
		if (page === UrlUtil.PG_ADVENTURE || page === UrlUtil.PG_BOOK) {
			const [source] = parts;
			return {source};
		}

		const [name, source] = parts;
		return {name, source};
	},

	/**
	 * @param hash
	 * @param {?string} page
	 */
	async _pAutoDecodeHashAdventureBookHash (hash, {page = null} = {}) {
		page ||= UrlUtil.getCurrentPage();
		const parts = UrlUtil.decodeHash(hash.toLowerCase().trim());

		if (![UrlUtil.PG_ADVENTURE, UrlUtil.PG_BOOK].includes(page)) throw new Error(`Unhandled page "${page}"!`);

		const [id] = parts;

		for (const {prop, contentsUrl} of [
			{
				prop: "adventure",
				contentsUrl: `${Renderer.get().baseUrl}data/adventures.json`,
			},
			{
				prop: "book",
				contentsUrl: `${Renderer.get().baseUrl}data/books.json`,
			},
		]) {
			const contents = await DataUtil.loadJSON(contentsUrl);

			const ent = contents[prop].find(it => it.id.toLowerCase() === id);
			if (ent) return {name: ent.name, source: ent.source, id: ent.id};
		}

		for (const brewUtil of [PrereleaseUtil, BrewUtil2]) {
			const urlRoot = await brewUtil.pGetCustomUrl();
			const idsIndex = await brewUtil.pLoadAdventureBookIdsIndex(urlRoot);
			if (idsIndex[id]) return idsIndex[id];
		}

		return {};
	},

	/* -------------------------------------------- */

	getSluggedHash (hash) {
		return Parser.stringToSlug(decodeURIComponent(hash)).replace(/_/g, "-");
	},

	getCurrentPage () {
		if (typeof window === "undefined") return VeCt.PG_NONE;
		const pSplit = window.location.pathname.split("/");
		let out = pSplit[pSplit.length - 1];
		if (!out.toLowerCase().endsWith(".html")) out += ".html";
		return out;
	},

	/**
	 * All internal URL construction should pass through here, to ensure `static.5etools.com` is used when required.
	 *
	 * @param href the link
	 * @param isBustCache If a cache-busting parameter should always be added.
	 */
	link (href, {isBustCache = false} = {}) {
		if (isBustCache) return UrlUtil._link_getWithParam(href, {param: `t=${Date.now()}`});
		return href;
	},

	_link_getWithParam (href, {param = `v=${VERSION_NUMBER}`} = {}) {
		if (href.includes("?")) return `${href}&${param}`;
		return `${href}?${param}`;
	},

	unpackSubHash (subHash, unencode) {
		// format is "key:value~list~sep~with~tilde"
		if (subHash.includes(HASH_SUB_KV_SEP)) {
			const keyValArr = subHash.split(HASH_SUB_KV_SEP).map(s => s.trim());
			const out = {};
			let k = keyValArr[0].toLowerCase();
			if (unencode) k = decodeURIComponent(k);
			let v = keyValArr[1].toLowerCase();
			if (unencode) v = decodeURIComponent(v);
			out[k] = v.split(HASH_SUB_LIST_SEP).map(s => s.trim());
			if (out[k].length === 1 && out[k] === HASH_SUB_NONE) out[k] = [];
			return out;
		} else {
			throw new Error(`Badly formatted subhash ${subHash}`);
		}
	},

	/**
	 * @param key The subhash key.
	 * @param values The subhash values.
	 * @param [opts] Options object.
	 * @param [opts.isEncodeBoth] If both the key and values should be URl encoded.
	 * @param [opts.isEncodeKey] If the key should be URL encoded.
	 * @param [opts.isEncodeValues] If the values should be URL encoded.
	 * @returns {string}
	 */
	packSubHash (key, values, opts) {
		opts = opts || {};
		if (opts.isEncodeBoth || opts.isEncodeKey) key = key.toUrlified();
		if (opts.isEncodeBoth || opts.isEncodeValues) values = values.map(it => it.toUrlified());
		return `${key}${HASH_SUB_KV_SEP}${values.join(HASH_SUB_LIST_SEP)}`;
	},

	categoryToPage (category) { return UrlUtil.CAT_TO_PAGE[category]; },
	categoryToHoverPage (category) { return UrlUtil.CAT_TO_HOVER_PAGE[category] || UrlUtil.categoryToPage(category); },

	pageToDisplayPage (page) { return UrlUtil.PG_TO_NAME[page] || (page || "").replace(/\.html$/, ""); },

	getFilename (url) { return url.slice(url.lastIndexOf("/") + 1); },

	isFullUrl (url) { return url && /^.*?:\/\//.test(url); },

	mini: {
		compress (primitive) {
			const type = typeof primitive;
			if (primitive === undefined) return "u";
			if (primitive === null) return "x";
			switch (type) {
				case "boolean": return `b${Number(primitive)}`;
				case "number": return `n${primitive}`;
				case "string": return `s${primitive.toUrlified()}`;
				default: throw new Error(`Unhandled type "${type}"`);
			}
		},

		decompress (raw) {
			const [type, data] = [raw.slice(0, 1), raw.slice(1)];
			switch (type) {
				case "u": return undefined;
				case "x": return null;
				case "b": return !!Number(data);
				case "n": return Number(data);
				case "s": return decodeURIComponent(String(data));
				default: throw new Error(`Unhandled type "${type}"`);
			}
		},
	},

	class: {
		getIndexedClassEntries (cls) {
			const out = [];

			(cls.classFeatures || []).forEach((lvlFeatureList, ixLvl) => {
				lvlFeatureList
					// don't add "you gain a subclass feature" or ASI's
					.filter(feature => (!feature.gainSubclassFeature || feature.gainSubclassFeatureHasContent)
						&& feature.name !== "Ability Score Improvement"
						&& feature.name !== "Proficiency Versatility")
					.forEach((feature, ixFeature) => {
						const name = Renderer.findName(feature);
						if (!name) { // tolerate missing names in homebrew
							if (BrewUtil2.hasSourceJson(cls.source)) return;
							else throw new Error("Class feature had no name!");
						}
						out.push({
							_type: "classFeature",
							source: cls.source.source || cls.source,
							name,
							hash: `${UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](cls)}${HASH_PART_SEP}${UrlUtil.getClassesPageStatePart({feature: {ixLevel: ixLvl, ixFeature: ixFeature}})}`,
							entry: feature,
							level: ixLvl + 1,
						});
					});
			});

			return out;
		},

		getIndexedSubclassEntries (sc) {
			const out = [];

			const lvlFeatures = sc.subclassFeatures || [];
			sc.source = sc.source || sc.classSource; // default to class source if required

			lvlFeatures.forEach(lvlFeature => {
				lvlFeature.forEach((feature, ixFeature) => {
					const subclassFeatureHash = `${UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES]({name: sc.className, source: sc.classSource})}${HASH_PART_SEP}${UrlUtil.getClassesPageStatePart({subclass: sc, feature: {ixLevel: feature.level - 1, ixFeature: ixFeature}})}`;

					const name = Renderer.findName(feature);
					if (!name) { // tolerate missing names in homebrew
						if (BrewUtil2.hasSourceJson(sc.source)) return;
						else throw new Error("Subclass feature had no name!");
					}
					out.push({
						_type: "subclassFeature",
						name,
						subclassName: sc.name,
						subclassShortName: sc.shortName,
						source: sc.source.source || sc.source,
						hash: subclassFeatureHash,
						entry: feature,
						level: feature.level,
					});

					if (feature.entries) {
						const namedFeatureParts = feature.entries.filter(it => it.name);
						namedFeatureParts.forEach(it => {
							if (out.find(existing => it.name === existing.name && feature.level === existing.level)) return;
							out.push({
								_type: "subclassFeaturePart",
								name: it.name,
								subclassName: sc.name,
								subclassShortName: sc.shortName,
								source: sc.source.source || sc.source,
								hash: subclassFeatureHash,
								entry: feature,
								level: feature.level,
							});
						});
					}
				});
			});

			return out;
		},
	},

	getStateKeySubclass (sc) { return Parser.stringToSlug(`sub ${sc.shortName || sc.name} ${sc.source}`); },

	/**
	 * @param opts Options object.
	 * @param [opts.subclass] Subclass (or object of the form `{shortName: "str", source: "str"}`)
	 * @param [opts.feature] Object of the form `{ixLevel: 0, ixFeature: 0}`
	 */
	getClassesPageStatePart (opts) {
		if (!opts.subclass && !opts.feature) return "";

		if (!opts.feature) return UrlUtil.packSubHash("state", [UrlUtil._getClassesPageStatePart_subclass(opts.subclass)]);
		if (!opts.subclass) return UrlUtil.packSubHash("state", [UrlUtil._getClassesPageStatePart_feature(opts.feature)]);

		return UrlUtil.packSubHash(
			"state",
			[
				UrlUtil._getClassesPageStatePart_subclass(opts.subclass),
				UrlUtil._getClassesPageStatePart_feature(opts.feature),
			],
		);
	},

	_getClassesPageStatePart_subclass (sc) { return `${UrlUtil.getStateKeySubclass(sc)}=${UrlUtil.mini.compress(true)}`; },
	_getClassesPageStatePart_feature (feature) { return `feature=${UrlUtil.mini.compress(`${feature.ixLevel}-${feature.ixFeature}`)}`; },

	unpackClassesPageStatePart (href) {
		const [, ...subs] = Hist.util.getHashParts(href);
		const unpackeds = subs.map(sub => UrlUtil.unpackSubHash(sub));
		const unpackedState = unpackeds.find(it => it.state)?.state;
		if (!unpackedState) return null;

		const out = {};
		unpackedState
			.forEach(pt => {
				const [k, v] = pt.split("=");

				if (k === "feature") return out.feature = UrlUtil.mini.decompress(v);

				(out.stateKeysSubclass ||= []).push(k);
			});

		return out;
	},
};

UrlUtil.PG_BESTIARY = "bestiary.html";
UrlUtil.PG_SPELLS = "spells.html";
UrlUtil.PG_BACKGROUNDS = "backgrounds.html";
UrlUtil.PG_ITEMS = "items.html";
UrlUtil.PG_CLASSES = "classes.html";
UrlUtil.PG_CONDITIONS_DISEASES = "conditionsdiseases.html";
UrlUtil.PG_FEATS = "feats.html";
UrlUtil.PG_OPT_FEATURES = "optionalfeatures.html";
UrlUtil.PG_PSIONICS = "psionics.html";
UrlUtil.PG_RACES = "races.html";
UrlUtil.PG_REWARDS = "rewards.html";
UrlUtil.PG_VARIANTRULES = "variantrules.html";
UrlUtil.PG_ADVENTURE = "adventure.html";
UrlUtil.PG_ADVENTURES = "adventures.html";
UrlUtil.PG_BOOK = "book.html";
UrlUtil.PG_BOOKS = "books.html";
UrlUtil.PG_DEITIES = "deities.html";
UrlUtil.PG_CULTS_BOONS = "cultsboons.html";
UrlUtil.PG_OBJECTS = "objects.html";
UrlUtil.PG_TRAPS_HAZARDS = "trapshazards.html";
UrlUtil.PG_QUICKREF = "quickreference.html";
UrlUtil.PG_MANAGE_BREW = "managebrew.html";
UrlUtil.PG_MANAGE_PRERELEASE = "manageprerelease.html";
UrlUtil.PG_MAKE_BREW = "makebrew.html";
UrlUtil.PG_DEMO_RENDER = "renderdemo.html";
UrlUtil.PG_TABLES = "tables.html";
UrlUtil.PG_VEHICLES = "vehicles.html";
UrlUtil.PG_CHARACTERS = "characters.html";
UrlUtil.PG_ACTIONS = "actions.html";
UrlUtil.PG_LANGUAGES = "languages.html";
UrlUtil.PG_STATGEN = "statgen.html";
UrlUtil.PG_LIFEGEN = "lifegen.html";
UrlUtil.PG_NAMES = "names.html";
UrlUtil.PG_DM_SCREEN = "dmscreen.html";
UrlUtil.PG_CR_CALCULATOR = "crcalculator.html";
UrlUtil.PG_ENCOUNTERGEN = "encountergen.html";
UrlUtil.PG_LOOTGEN = "lootgen.html";
UrlUtil.PG_TEXT_CONVERTER = "converter.html";
UrlUtil.PG_CHANGELOG = "changelog.html";
UrlUtil.PG_CHAR_CREATION_OPTIONS = "charcreationoptions.html";
UrlUtil.PG_RECIPES = "recipes.html";
UrlUtil.PG_CLASS_SUBCLASS_FEATURES = "classfeatures.html";
UrlUtil.PG_CREATURE_FEATURES = "creaturefeatures.html";
UrlUtil.PG_VEHICLE_FEATURES = "vehiclefeatures.html";
UrlUtil.PG_OBJECT_FEATURES = "objectfeatures.html";
UrlUtil.PG_TRAP_FEATURES = "trapfeatures.html";
UrlUtil.PG_MAPS = "maps.html";
UrlUtil.PG_SEARCH = "search.html";
UrlUtil.PG_DECKS = "decks.html";
UrlUtil.PG_BASTIONS = "bastions.html";

UrlUtil.URL_TO_HASH_GENERIC = (it) => UrlUtil.encodeArrayForHash(it.name, it.source);

UrlUtil.URL_TO_HASH_BUILDER = {};
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY] = UrlUtil.URL_TO_HASH_GENERIC;
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_SPELLS] = UrlUtil.URL_TO_HASH_GENERIC;
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BACKGROUNDS] = UrlUtil.URL_TO_HASH_GENERIC;
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ITEMS] = UrlUtil.URL_TO_HASH_GENERIC;
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES] = UrlUtil.URL_TO_HASH_GENERIC;
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CONDITIONS_DISEASES] = UrlUtil.URL_TO_HASH_GENERIC;
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_FEATS] = UrlUtil.URL_TO_HASH_GENERIC;
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_OPT_FEATURES] = UrlUtil.URL_TO_HASH_GENERIC;
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_PSIONICS] = UrlUtil.URL_TO_HASH_GENERIC;
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_RACES] = UrlUtil.URL_TO_HASH_GENERIC;
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_REWARDS] = UrlUtil.URL_TO_HASH_GENERIC;
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_VARIANTRULES] = UrlUtil.URL_TO_HASH_GENERIC;
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ADVENTURE] = (it) => UrlUtil.encodeForHash(it.id);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ADVENTURES] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ADVENTURE];
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BOOK] = (it) => UrlUtil.encodeForHash(it.id);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BOOKS] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BOOK];
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_DEITIES] = (it) => UrlUtil.encodeArrayForHash(it.name, it.pantheon, it.source);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CULTS_BOONS] = UrlUtil.URL_TO_HASH_GENERIC;
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_OBJECTS] = UrlUtil.URL_TO_HASH_GENERIC;
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_TRAPS_HAZARDS] = UrlUtil.URL_TO_HASH_GENERIC;
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_TABLES] = UrlUtil.URL_TO_HASH_GENERIC;
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_VEHICLES] = UrlUtil.URL_TO_HASH_GENERIC;
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ACTIONS] = UrlUtil.URL_TO_HASH_GENERIC;
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_LANGUAGES] = UrlUtil.URL_TO_HASH_GENERIC;
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CHAR_CREATION_OPTIONS] = UrlUtil.URL_TO_HASH_GENERIC;
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_RECIPES] = (it) => `${UrlUtil.encodeArrayForHash(it.name, it.source)}${it._scaleFactor ? `${HASH_PART_SEP}${VeCt.HASH_SCALED}${HASH_SUB_KV_SEP}${it._scaleFactor}` : ""}`;
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_DECKS] = UrlUtil.URL_TO_HASH_GENERIC;
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BASTIONS] = UrlUtil.URL_TO_HASH_GENERIC;
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASS_SUBCLASS_FEATURES] = (it) => (it.__prop === "subclassFeature" || it.subclassSource) ? UrlUtil.URL_TO_HASH_BUILDER["subclassFeature"](it) : UrlUtil.URL_TO_HASH_BUILDER["classFeature"](it);
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CREATURE_FEATURES] = UrlUtil.URL_TO_HASH_GENERIC;
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_VEHICLE_FEATURES] = UrlUtil.URL_TO_HASH_GENERIC;
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_OBJECT_FEATURES] = UrlUtil.URL_TO_HASH_GENERIC;
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_TRAP_FEATURES] = UrlUtil.URL_TO_HASH_GENERIC;
UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_QUICKREF] = ({name, ixChapter, ixHeader}) => {
	const hashParts = ["bookref-quick", ixChapter, UrlUtil.encodeForHash(name.toLowerCase())];
	if (ixHeader) hashParts.push(ixHeader);
	return hashParts.join(HASH_PART_SEP);
};

// region Fake pages (props)
UrlUtil.URL_TO_HASH_BUILDER["monster"] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY];
UrlUtil.URL_TO_HASH_BUILDER["spell"] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_SPELLS];
UrlUtil.URL_TO_HASH_BUILDER["background"] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BACKGROUNDS];
UrlUtil.URL_TO_HASH_BUILDER["item"] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ITEMS];
UrlUtil.URL_TO_HASH_BUILDER["itemGroup"] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ITEMS];
UrlUtil.URL_TO_HASH_BUILDER["baseitem"] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ITEMS];
UrlUtil.URL_TO_HASH_BUILDER["magicvariant"] = (it) => UrlUtil.encodeArrayForHash(it.name, SourceUtil.getEntitySource(it));
UrlUtil.URL_TO_HASH_BUILDER["class"] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES];
UrlUtil.URL_TO_HASH_BUILDER["condition"] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CONDITIONS_DISEASES];
UrlUtil.URL_TO_HASH_BUILDER["disease"] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CONDITIONS_DISEASES];
UrlUtil.URL_TO_HASH_BUILDER["status"] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CONDITIONS_DISEASES];
UrlUtil.URL_TO_HASH_BUILDER["feat"] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_FEATS];
UrlUtil.URL_TO_HASH_BUILDER["optionalfeature"] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_OPT_FEATURES];
UrlUtil.URL_TO_HASH_BUILDER["psionic"] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_PSIONICS];
UrlUtil.URL_TO_HASH_BUILDER["race"] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_RACES];
UrlUtil.URL_TO_HASH_BUILDER["subrace"] = (it) => UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_RACES]({name: `${it.name} (${it.raceName})`, source: it.source});
UrlUtil.URL_TO_HASH_BUILDER["reward"] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_REWARDS];
UrlUtil.URL_TO_HASH_BUILDER["variantrule"] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_VARIANTRULES];
UrlUtil.URL_TO_HASH_BUILDER["adventure"] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ADVENTURES];
UrlUtil.URL_TO_HASH_BUILDER["adventureData"] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ADVENTURES];
UrlUtil.URL_TO_HASH_BUILDER["book"] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BOOKS];
UrlUtil.URL_TO_HASH_BUILDER["bookData"] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BOOKS];
UrlUtil.URL_TO_HASH_BUILDER["deity"] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_DEITIES];
UrlUtil.URL_TO_HASH_BUILDER["cult"] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CULTS_BOONS];
UrlUtil.URL_TO_HASH_BUILDER["boon"] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CULTS_BOONS];
UrlUtil.URL_TO_HASH_BUILDER["object"] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_OBJECTS];
UrlUtil.URL_TO_HASH_BUILDER["trap"] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_TRAPS_HAZARDS];
UrlUtil.URL_TO_HASH_BUILDER["hazard"] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_TRAPS_HAZARDS];
UrlUtil.URL_TO_HASH_BUILDER["table"] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_TABLES];
UrlUtil.URL_TO_HASH_BUILDER["tableGroup"] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_TABLES];
UrlUtil.URL_TO_HASH_BUILDER["vehicle"] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_VEHICLES];
UrlUtil.URL_TO_HASH_BUILDER["vehicleUpgrade"] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_VEHICLES];
UrlUtil.URL_TO_HASH_BUILDER["action"] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ACTIONS];
UrlUtil.URL_TO_HASH_BUILDER["language"] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_LANGUAGES];
UrlUtil.URL_TO_HASH_BUILDER["charoption"] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CHAR_CREATION_OPTIONS];
UrlUtil.URL_TO_HASH_BUILDER["recipe"] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_RECIPES];
UrlUtil.URL_TO_HASH_BUILDER["deck"] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_DECKS];
UrlUtil.URL_TO_HASH_BUILDER["facility"] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BASTIONS];

UrlUtil.URL_TO_HASH_BUILDER["subclass"] = it => {
	return Hist.util.getCleanHash(
		`${UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES]({name: it.className, source: it.classSource})}${HASH_PART_SEP}${UrlUtil.getClassesPageStatePart({subclass: it})}`,
	);
};
UrlUtil.URL_TO_HASH_BUILDER["classFeature"] = (it) => UrlUtil.encodeArrayForHash(it.name, it.className, it.classSource, it.level, it.source);
UrlUtil.URL_TO_HASH_BUILDER["subclassFeature"] = (it) => UrlUtil.encodeArrayForHash(it.name, it.className, it.classSource, it.subclassShortName, it.subclassSource, it.level, it.source);
UrlUtil.URL_TO_HASH_BUILDER["card"] = (it) => UrlUtil.encodeArrayForHash(it.name, it.set, it.source);
UrlUtil.URL_TO_HASH_BUILDER["legendaryGroup"] = UrlUtil.URL_TO_HASH_GENERIC;
UrlUtil.URL_TO_HASH_BUILDER["itemEntry"] = UrlUtil.URL_TO_HASH_GENERIC;
UrlUtil.URL_TO_HASH_BUILDER["itemProperty"] = (it) => UrlUtil.encodeArrayForHash(it.abbreviation, it.source);
UrlUtil.URL_TO_HASH_BUILDER["itemType"] = (it) => UrlUtil.encodeArrayForHash(it.abbreviation, it.source);
UrlUtil.URL_TO_HASH_BUILDER["itemTypeAdditionalEntries"] = UrlUtil.URL_TO_HASH_GENERIC;
UrlUtil.URL_TO_HASH_BUILDER["itemMastery"] = UrlUtil.URL_TO_HASH_GENERIC;
UrlUtil.URL_TO_HASH_BUILDER["skill"] = UrlUtil.URL_TO_HASH_GENERIC;
UrlUtil.URL_TO_HASH_BUILDER["sense"] = UrlUtil.URL_TO_HASH_GENERIC;
UrlUtil.URL_TO_HASH_BUILDER["raceFeature"] = (it) => UrlUtil.encodeArrayForHash(it.name, it.raceName, it.raceSource, it.source);
UrlUtil.URL_TO_HASH_BUILDER["citation"] = UrlUtil.URL_TO_HASH_GENERIC;
UrlUtil.URL_TO_HASH_BUILDER["languageScript"] = UrlUtil.URL_TO_HASH_GENERIC;

// Add lowercase aliases
Object.keys(UrlUtil.URL_TO_HASH_BUILDER)
	.filter(k => !k.endsWith(".html") && k.toLowerCase() !== k)
	.forEach(k => UrlUtil.URL_TO_HASH_BUILDER[k.toLowerCase()] = UrlUtil.URL_TO_HASH_BUILDER[k]);

// Add raw aliases
Object.keys(UrlUtil.URL_TO_HASH_BUILDER)
	.filter(k => !k.endsWith(".html"))
	.forEach(k => UrlUtil.URL_TO_HASH_BUILDER[`raw_${k}`] = UrlUtil.URL_TO_HASH_BUILDER[k]);

// Add fluff aliases; template aliases
Object.keys(UrlUtil.URL_TO_HASH_BUILDER)
	.filter(k => !k.endsWith(".html"))
	.forEach(k => {
		UrlUtil.URL_TO_HASH_BUILDER[`${k}Fluff`] = UrlUtil.URL_TO_HASH_BUILDER[k];
		UrlUtil.URL_TO_HASH_BUILDER[`${k}Template`] = UrlUtil.URL_TO_HASH_BUILDER[k];
	});
// endregion

UrlUtil.PG_TO_NAME = {};
UrlUtil.PG_TO_NAME[UrlUtil.PG_BESTIARY] = "Bestiary";
UrlUtil.PG_TO_NAME[UrlUtil.PG_SPELLS] = "Spells";
UrlUtil.PG_TO_NAME[UrlUtil.PG_BACKGROUNDS] = "Backgrounds";
UrlUtil.PG_TO_NAME[UrlUtil.PG_ITEMS] = "Items";
UrlUtil.PG_TO_NAME[UrlUtil.PG_CLASSES] = "Classes";
UrlUtil.PG_TO_NAME[UrlUtil.PG_CONDITIONS_DISEASES] = "Conditions & Diseases";
UrlUtil.PG_TO_NAME[UrlUtil.PG_FEATS] = "Feats";
UrlUtil.PG_TO_NAME[UrlUtil.PG_OPT_FEATURES] = "Other Options and Features";
UrlUtil.PG_TO_NAME[UrlUtil.PG_PSIONICS] = "Psionics";
UrlUtil.PG_TO_NAME[UrlUtil.PG_RACES] = "Species";
UrlUtil.PG_TO_NAME[UrlUtil.PG_REWARDS] = "Supernatural Gifts & Rewards";
UrlUtil.PG_TO_NAME[UrlUtil.PG_VARIANTRULES] = "Rules Glossary";
UrlUtil.PG_TO_NAME[UrlUtil.PG_ADVENTURES] = "Adventures";
UrlUtil.PG_TO_NAME[UrlUtil.PG_BOOKS] = "Books";
UrlUtil.PG_TO_NAME[UrlUtil.PG_DEITIES] = "Deities";
UrlUtil.PG_TO_NAME[UrlUtil.PG_CULTS_BOONS] = "Cults & Supernatural Boons";
UrlUtil.PG_TO_NAME[UrlUtil.PG_OBJECTS] = "Objects";
UrlUtil.PG_TO_NAME[UrlUtil.PG_TRAPS_HAZARDS] = "Traps & Hazards";
UrlUtil.PG_TO_NAME[UrlUtil.PG_QUICKREF] = "Quick Reference (2014)";
UrlUtil.PG_TO_NAME[UrlUtil.PG_MANAGE_BREW] = "Homebrew Manager";
UrlUtil.PG_TO_NAME[UrlUtil.PG_MANAGE_PRERELEASE] = "Prerelease Content Manager";
UrlUtil.PG_TO_NAME[UrlUtil.PG_MAKE_BREW] = "Homebrew Builder";
UrlUtil.PG_TO_NAME[UrlUtil.PG_DEMO_RENDER] = "Renderer Demo";
UrlUtil.PG_TO_NAME[UrlUtil.PG_TABLES] = "Tables";
UrlUtil.PG_TO_NAME[UrlUtil.PG_VEHICLES] = "Vehicles";
// UrlUtil.PG_TO_NAME[UrlUtil.PG_CHARACTERS] = "";
UrlUtil.PG_TO_NAME[UrlUtil.PG_ACTIONS] = "Actions";
UrlUtil.PG_TO_NAME[UrlUtil.PG_LANGUAGES] = "Languages";
UrlUtil.PG_TO_NAME[UrlUtil.PG_STATGEN] = "Stat Generator";
UrlUtil.PG_TO_NAME[UrlUtil.PG_LIFEGEN] = "This Is Your Life";
UrlUtil.PG_TO_NAME[UrlUtil.PG_NAMES] = "Names";
UrlUtil.PG_TO_NAME[UrlUtil.PG_DM_SCREEN] = "DM Screen";
UrlUtil.PG_TO_NAME[UrlUtil.PG_CR_CALCULATOR] = "CR Calculator";
UrlUtil.PG_TO_NAME[UrlUtil.PG_ENCOUNTERGEN] = "Encounter Generator";
UrlUtil.PG_TO_NAME[UrlUtil.PG_LOOTGEN] = "Loot Generator";
UrlUtil.PG_TO_NAME[UrlUtil.PG_TEXT_CONVERTER] = "Text Converter";
UrlUtil.PG_TO_NAME[UrlUtil.PG_CHANGELOG] = "Changelog";
UrlUtil.PG_TO_NAME[UrlUtil.PG_CHAR_CREATION_OPTIONS] = "Other Character Creation Options";
UrlUtil.PG_TO_NAME[UrlUtil.PG_RECIPES] = "Recipes";
UrlUtil.PG_TO_NAME[UrlUtil.PG_CREATURE_FEATURES] = "Creature Features";
UrlUtil.PG_TO_NAME[UrlUtil.PG_VEHICLE_FEATURES] = "Vehicle Features";
UrlUtil.PG_TO_NAME[UrlUtil.PG_OBJECT_FEATURES] = "Object Features";
UrlUtil.PG_TO_NAME[UrlUtil.PG_TRAP_FEATURES] = "Trap Features";
UrlUtil.PG_TO_NAME[UrlUtil.PG_MAPS] = "Maps";
UrlUtil.PG_TO_NAME[UrlUtil.PG_DECKS] = "Decks";
UrlUtil.PG_TO_NAME[UrlUtil.PG_BASTIONS] = "Bastions";

UrlUtil.CAT_TO_PAGE = {};
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_CREATURE] = UrlUtil.PG_BESTIARY;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_SPELL] = UrlUtil.PG_SPELLS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_BACKGROUND] = UrlUtil.PG_BACKGROUNDS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_ITEM] = UrlUtil.PG_ITEMS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_CLASS] = UrlUtil.PG_CLASSES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_CLASS_FEATURE] = UrlUtil.PG_CLASSES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_SUBCLASS] = UrlUtil.PG_CLASSES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_SUBCLASS_FEATURE] = UrlUtil.PG_CLASSES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_CONDITION] = UrlUtil.PG_CONDITIONS_DISEASES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_FEAT] = UrlUtil.PG_FEATS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_ELDRITCH_INVOCATION] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_METAMAGIC] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_MANEUVER_BATTLEMASTER] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_MANEUVER_CAVALIER] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_ARCANE_SHOT] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_OPTIONAL_FEATURE_OTHER] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_FIGHTING_STYLE] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_PSIONIC] = UrlUtil.PG_PSIONICS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_RACE] = UrlUtil.PG_RACES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_OTHER_REWARD] = UrlUtil.PG_REWARDS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_VARIANT_OPTIONAL_RULE] = UrlUtil.PG_VARIANTRULES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_ADVENTURE] = UrlUtil.PG_ADVENTURE;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_DEITY] = UrlUtil.PG_DEITIES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_OBJECT] = UrlUtil.PG_OBJECTS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_TRAP] = UrlUtil.PG_TRAPS_HAZARDS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_HAZARD] = UrlUtil.PG_TRAPS_HAZARDS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_QUICKREF] = UrlUtil.PG_QUICKREF;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_CULT] = UrlUtil.PG_CULTS_BOONS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_BOON] = UrlUtil.PG_CULTS_BOONS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_DISEASE] = UrlUtil.PG_CONDITIONS_DISEASES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_TABLE] = UrlUtil.PG_TABLES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_TABLE_GROUP] = UrlUtil.PG_TABLES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_VEHICLE] = UrlUtil.PG_VEHICLES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_PACT_BOON] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_ELEMENTAL_DISCIPLINE] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_ARTIFICER_INFUSION] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_SHIP_UPGRADE] = UrlUtil.PG_VEHICLES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_INFERNAL_WAR_MACHINE_UPGRADE] = UrlUtil.PG_VEHICLES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_ONOMANCY_RESONANT] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_RUNE_KNIGHT_RUNE] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_ALCHEMICAL_FORMULA] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_MANEUVER] = UrlUtil.PG_OPT_FEATURES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_ACTION] = UrlUtil.PG_ACTIONS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_LANGUAGE] = UrlUtil.PG_LANGUAGES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_BOOK] = UrlUtil.PG_BOOK;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_PAGE] = null;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_LEGENDARY_GROUP] = null;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_CHAR_CREATION_OPTIONS] = UrlUtil.PG_CHAR_CREATION_OPTIONS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_RECIPES] = UrlUtil.PG_RECIPES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_STATUS] = UrlUtil.PG_CONDITIONS_DISEASES;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_DECK] = UrlUtil.PG_DECKS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_FACILITY] = UrlUtil.PG_BASTIONS;
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_CARD] = "card";
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_SKILLS] = "skill";
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_SENSES] = "sense";
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_LEGENDARY_GROUP] = "legendaryGroup";
UrlUtil.CAT_TO_PAGE[Parser.CAT_ID_ITEM_MASTERY] = "itemMastery";

UrlUtil.CAT_TO_HOVER_PAGE = {};
UrlUtil.CAT_TO_HOVER_PAGE[Parser.CAT_ID_CLASS_FEATURE] = "classfeature";
UrlUtil.CAT_TO_HOVER_PAGE[Parser.CAT_ID_SUBCLASS_FEATURE] = "subclassfeature";
UrlUtil.CAT_TO_HOVER_PAGE[Parser.CAT_ID_CARD] = "card";
UrlUtil.CAT_TO_HOVER_PAGE[Parser.CAT_ID_SKILLS] = "skill";
UrlUtil.CAT_TO_HOVER_PAGE[Parser.CAT_ID_SENSES] = "sense";
UrlUtil.CAT_TO_HOVER_PAGE[Parser.CAT_ID_LEGENDARY_GROUP] = "legendaryGroup";
UrlUtil.CAT_TO_HOVER_PAGE[Parser.CAT_ID_ITEM_MASTERY] = "itemMastery";

UrlUtil.HASH_START_CREATURE_SCALED = `${VeCt.HASH_SCALED}${HASH_SUB_KV_SEP}`;
UrlUtil.HASH_START_CREATURE_SCALED_SPELL_SUMMON = `${VeCt.HASH_SCALED_SPELL_SUMMON}${HASH_SUB_KV_SEP}`;
UrlUtil.HASH_START_CREATURE_SCALED_CLASS_SUMMON = `${VeCt.HASH_SCALED_CLASS_SUMMON}${HASH_SUB_KV_SEP}`;

UrlUtil.SUBLIST_PAGES = {
	[UrlUtil.PG_BESTIARY]: true,
	[UrlUtil.PG_SPELLS]: true,
	[UrlUtil.PG_BACKGROUNDS]: true,
	[UrlUtil.PG_ITEMS]: true,
	[UrlUtil.PG_CONDITIONS_DISEASES]: true,
	[UrlUtil.PG_FEATS]: true,
	[UrlUtil.PG_OPT_FEATURES]: true,
	[UrlUtil.PG_PSIONICS]: true,
	[UrlUtil.PG_RACES]: true,
	[UrlUtil.PG_REWARDS]: true,
	[UrlUtil.PG_VARIANTRULES]: true,
	[UrlUtil.PG_DEITIES]: true,
	[UrlUtil.PG_CULTS_BOONS]: true,
	[UrlUtil.PG_OBJECTS]: true,
	[UrlUtil.PG_TRAPS_HAZARDS]: true,
	[UrlUtil.PG_TABLES]: true,
	[UrlUtil.PG_VEHICLES]: true,
	[UrlUtil.PG_ACTIONS]: true,
	[UrlUtil.PG_LANGUAGES]: true,
	[UrlUtil.PG_CHAR_CREATION_OPTIONS]: true,
	[UrlUtil.PG_RECIPES]: true,
	[UrlUtil.PG_DECKS]: true,
	[UrlUtil.PG_BASTIONS]: true,
};

UrlUtil.FAUX_PAGES = {
	[UrlUtil.PG_CLASS_SUBCLASS_FEATURES]: true,
	[UrlUtil.PG_CREATURE_FEATURES]: true,
	[UrlUtil.PG_VEHICLE_FEATURES]: true,
	[UrlUtil.PG_OBJECT_FEATURES]: true,
	[UrlUtil.PG_TRAP_FEATURES]: true,
};

UrlUtil.PAGE_TO_PROPS = {};
UrlUtil.PAGE_TO_PROPS[UrlUtil.PG_SPELLS] = ["spell"];
UrlUtil.PAGE_TO_PROPS[UrlUtil.PG_ITEMS] = ["item", "itemGroup", "itemType", "itemEntry", "itemProperty", "itemTypeAdditionalEntries", "itemMastery", "baseitem", "magicvariant"];
UrlUtil.PAGE_TO_PROPS[UrlUtil.PG_RACES] = ["race", "subrace"];

UrlUtil.PROP_TO_PAGE = {};
UrlUtil.PROP_TO_PAGE["spell"] = UrlUtil.PG_SPELLS;
UrlUtil.PROP_TO_PAGE["item"] = UrlUtil.PG_ITEMS;
UrlUtil.PROP_TO_PAGE["baseitem"] = UrlUtil.PG_ITEMS;

if (!IS_DEPLOYED && !IS_VTT && typeof window !== "undefined") {
	// for local testing, hotkey to get a link to the current page on the main site
	window.addEventListener("keypress", (e) => {
		if (EventUtil.noModifierKeys(e) && typeof d20 === "undefined") {
			if (e.key === "#") {
				const spl = window.location.href.split("/");
				window.prompt("Copy to clipboard: Ctrl+C, Enter", `https://5e.tools/${spl[spl.length - 1]}`);
			}
		}
	});
}

// SORTING =============================================================================================================
globalThis.SortUtil = {
	ascSort: (a, b) => {
		if (typeof FilterItem !== "undefined") {
			if (a instanceof FilterItem) a = a.item;
			if (b instanceof FilterItem) b = b.item;
		}

		return SortUtil._ascSort(a, b);
	},

	ascSortProp: (prop, a, b) => { return SortUtil.ascSort(a[prop], b[prop]); },

	ascSortLower: (a, b) => {
		if (typeof FilterItem !== "undefined") {
			if (a instanceof FilterItem) a = a.item;
			if (b instanceof FilterItem) b = b.item;
		}

		a = a ? a.toLowerCase() : a;
		b = b ? b.toLowerCase() : b;

		return SortUtil._ascSort(a, b);
	},

	ascSortLowerProp: (prop, a, b) => { return SortUtil.ascSortLower(a[prop], b[prop]); },

	// warning: slow
	ascSortNumericalSuffix (a, b) {
		if (typeof FilterItem !== "undefined") {
			if (a instanceof FilterItem) a = a.item;
			if (b instanceof FilterItem) b = b.item;
		}

		function popEndNumber (str) {
			const spl = str.split(" ");
			return spl.last().isNumeric() ? [spl.slice(0, -1).join(" "), Number(spl.last().replace(Parser._numberCleanRegexp, ""))] : [spl.join(" "), 0];
		}

		const [aStr, aNum] = popEndNumber(a.item || a);
		const [bStr, bNum] = popEndNumber(b.item || b);
		const initialSort = SortUtil.ascSort(aStr, bStr);
		if (initialSort) return initialSort;
		return SortUtil.ascSort(aNum, bNum);
	},

	_RE_SORT_NUM: /\d+/g,
	ascSortLowerPropNumeric (prop, a, b) {
		a._sortName ||= (a[prop] || "").replace(SortUtil._RE_SORT_NUM, (...m) => `${m[0].padStart(10, "0")}`);
		b._sortName ||= (b[prop] || "").replace(SortUtil._RE_SORT_NUM, (...m) => `${m[0].padStart(10, "0")}`);
		return SortUtil.ascSortLower(a._sortName, b._sortName);
	},

	_ascSort: (a, b) => {
		if (b === a) return 0;
		return b < a ? 1 : -1;
	},

	ascSortDate (a, b) {
		return b.getTime() - a.getTime();
	},

	ascSortDateString (a, b) {
		return SortUtil.ascSortDate(new Date(a || "1970-01-01"), new Date(b || "1970-01-01"));
	},

	compareListNames (a, b) { return SortUtil._ascSort(a.name.toLowerCase(), b.name.toLowerCase()); },

	listSort (a, b, opts) {
		opts = opts || {sortBy: "name"};
		if (opts.sortBy === "name") return SortUtil.compareListNames(a, b);
		if (opts.sortBy === "source") return SortUtil._listSort_compareBy(a, b, opts.sortBy) || SortUtil._listSort_compareBy(a, b, "page") || SortUtil.compareListNames(a, b);
		return SortUtil._compareByOrDefault_compareByOrDefault(a, b, opts.sortBy);
	},

	_listSort_compareBy (a, b, sortBy) {
		const aValue = typeof a.values[sortBy] === "string" ? a.values[sortBy].toLowerCase() : a.values[sortBy];
		const bValue = typeof b.values[sortBy] === "string" ? b.values[sortBy].toLowerCase() : b.values[sortBy];

		return SortUtil._ascSort(aValue, bValue);
	},

	_compareByOrDefault_compareByOrDefault (a, b, sortBy) {
		return SortUtil._listSort_compareBy(a, b, sortBy) || SortUtil.compareListNames(a, b);
	},

	/**
	 * "Special Equipment" first, then alphabetical
	 */
	_MON_TRAIT_ORDER: [
		"temporary statblock",

		"special equipment",
		"shapechanger",
	],
	monTraitSort: (a, b) => {
		if (a.sort != null && b.sort != null) return a.sort - b.sort;
		if (a.sort != null && b.sort == null) return -1;
		if (a.sort == null && b.sort != null) return 1;

		if (!a.name && !b.name) return 0;
		const aClean = Renderer.stripTags(a.name).toLowerCase().trim();
		const bClean = Renderer.stripTags(b.name).toLowerCase().trim();

		const isOnlyA = a.name.endsWith(" Only)");
		const isOnlyB = b.name.endsWith(" Only)");
		if (!isOnlyA && isOnlyB) return -1;
		if (isOnlyA && !isOnlyB) return 1;

		const ixA = SortUtil._MON_TRAIT_ORDER.indexOf(aClean);
		const ixB = SortUtil._MON_TRAIT_ORDER.indexOf(bClean);
		if (~ixA && ~ixB) return ixA - ixB;
		else if (~ixA) return -1;
		else if (~ixB) return 1;
		else return SortUtil.ascSort(aClean, bClean);
	},

	_alignFirst: ["L", "C"],
	_alignSecond: ["G", "E"],
	alignmentSort: (a, b) => {
		if (a === b) return 0;
		if (SortUtil._alignFirst.includes(a)) return -1;
		if (SortUtil._alignSecond.includes(a)) return 1;
		if (SortUtil._alignFirst.includes(b)) return 1;
		if (SortUtil._alignSecond.includes(b)) return -1;
		return 0;
	},

	ascSortCr (a, b) {
		if (typeof FilterItem !== "undefined") {
			if (a instanceof FilterItem) a = a.item;
			if (b instanceof FilterItem) b = b.item;
		}
		// always put unknown values last
		if (a === "Unknown") a = "998";
		if (b === "Unknown") b = "998";
		if (a === "\u2014" || a == null) a = "999";
		if (b === "\u2014" || b == null) b = "999";
		return SortUtil.ascSort(Parser.crToNumber(a), Parser.crToNumber(b));
	},

	ascSortAtts (a, b) {
		const aSpecial = a === "special";
		const bSpecial = b === "special";
		return aSpecial && bSpecial ? 0 : aSpecial ? 1 : bSpecial ? -1 : Parser.ABIL_ABVS.indexOf(a) - Parser.ABIL_ABVS.indexOf(b);
	},

	ascSortSize (a, b) { return Parser.SIZE_ABVS.indexOf(a) - Parser.SIZE_ABVS.indexOf(b); },

	initBtnSortHandlers ($wrpBtnsSort, list) {
		let dispCaretInitial = null;

		const dispCarets = [...$wrpBtnsSort[0].querySelectorAll(`[data-sort]`)]
			.map(btnSort => {
				const dispCaret = e_({
					tag: "span",
					clazz: "lst__caret",
				})
					.appendTo(btnSort);

				const btnSortField = btnSort.dataset.sort;

				if (btnSortField === list.sortBy) dispCaretInitial = dispCaret;

				e_({
					ele: btnSort,
					click: evt => {
						evt.stopPropagation();
						const direction = list.sortDir === "asc" ? "desc" : "asc";
						SortUtil._initBtnSortHandlers_showCaret({dispCarets, dispCaret, direction});
						list.sort(btnSortField, direction);
					},
				});

				return dispCaret;
			});

		dispCaretInitial = dispCaretInitial || dispCarets[0]; // Fall back on displaying the first caret

		SortUtil._initBtnSortHandlers_showCaret({dispCaret: dispCaretInitial, dispCarets, direction: list.sortDir});
	},

	_initBtnSortHandlers_showCaret (
		{
			dispCaret,
			dispCarets,
			direction,
		},
	) {
		dispCarets.forEach($it => $it.removeClass("lst__caret--active"));
		dispCaret.addClass("lst__caret--active").toggleClass("lst__caret--reverse", direction === "asc");
	},

	/** Add more list sort on-clicks to existing sort buttons. */
	initBtnSortHandlersAdditional ($wrpBtnsSort, list) {
		[...$wrpBtnsSort[0].querySelectorAll(".sort")]
			.map(btnSort => {
				const btnSortField = btnSort.dataset.sort;

				e_({
					ele: btnSort,
					click: evt => {
						evt.stopPropagation();
						const direction = list.sortDir === "asc" ? "desc" : "asc";
						list.sort(btnSortField, direction);
					},
				});
			});
	},

	ascSortSourceGroup (a, b) {
		const grpA = a.group || "other";
		const grpB = b.group || "other";
		const ixA = SourceUtil.ADV_BOOK_GROUPS.findIndex(it => it.group === grpA);
		const ixB = SourceUtil.ADV_BOOK_GROUPS.findIndex(it => it.group === grpB);
		return SortUtil.ascSort(ixA, ixB);
	},

	ascSortAdventure (a, b) {
		return SortUtil.ascSortDateString(b.published, a.published)
			|| SortUtil.ascSortLower(a.parentSource || "", b.parentSource || "")
			|| SortUtil.ascSort(a.publishedOrder ?? 0, b.publishedOrder ?? 0)
			|| SortUtil.ascSortLower(a.storyline, b.storyline)
			|| SortUtil.ascSort(a.level?.start ?? 20, b.level?.start ?? 20)
			|| SortUtil.ascSortLower(a.name, b.name);
	},

	ascSortBook (a, b) {
		return SortUtil.ascSortDateString(b.published, a.published)
			|| SortUtil.ascSortLower(a.parentSource || "", b.parentSource || "")
			|| SortUtil.ascSortLower(a.name, b.name);
	},

	ascSortBookData (a, b) {
		return SortUtil.ascSortLower(a.id || "", b.id || "");
	},

	ascSortGenericEntity (a, b) {
		return SortUtil.ascSortLower(a.name || "", b.name || "") || SortUtil.ascSortLower(a.source || "", b.source || "");
	},

	ascSortDeity (a, b) {
		return SortUtil.ascSortLower(a.name, b.name) || SortUtil.ascSortLower(a.source, b.source) || SortUtil.ascSortLower(a.pantheon, b.pantheon);
	},

	ascSortCard (a, b) {
		return SortUtil.ascSortLower(a.set, b.set) || SortUtil.ascSortLower(a.source, b.source) || SortUtil.ascSortLower(a.name, b.name);
	},

	ascSortEncounter (a, b) {
		return SortUtil.ascSortLower(a.name, b.name) || SortUtil.ascSortLower(a.caption || "", b.caption || "") || SortUtil.ascSort(a.minlvl || 0, b.minlvl || 0) || SortUtil.ascSort(a.maxlvl || Number.MAX_SAFE_INTEGER, b.maxlvl || Number.MAX_SAFE_INTEGER);
	},

	_ITEM_RARITY_ORDER: ["none", "common", "uncommon", "rare", "very rare", "legendary", "artifact", "varies", "unknown (magic)", "unknown"],
	ascSortItemRarity (a, b) {
		const ixA = SortUtil._ITEM_RARITY_ORDER.indexOf(a);
		const ixB = SortUtil._ITEM_RARITY_ORDER.indexOf(b);
		return (~ixA ? ixA : Number.MAX_SAFE_INTEGER) - (~ixB ? ixB : Number.MAX_SAFE_INTEGER);
	},
};

globalThis.MultiSourceUtil = class {
	static getIndexKey (prop, ent) {
		switch (prop) {
			case "class":
			case "classFluff":
				return (ent.name || "").toLowerCase().split(" ").at(-1);
			case "subclass":
			case "subclassFluff":
				return (ent.className || "").toLowerCase().split(" ").at(-1);
			default:
				return ent.source;
		}
	}

	static isEntityIndexKeyMatch (indexKey, prop, ent) {
		if (indexKey == null) return true;
		return indexKey === MultiSourceUtil.getIndexKey(prop, ent);
	}
};

// JSON LOADING ========================================================================================================
class _DataUtilPropConfig {
	static _MERGE_REQUIRES_PRESERVE = {};
	static _PAGE = null;

	static get PAGE () { return this._PAGE; }

	static async pMergeCopy (lst, ent, options) {
		return DataUtil.generic._pMergeCopy(this, this._PAGE, lst, ent, options);
	}
}

class _DataUtilPropConfigSingleSource extends _DataUtilPropConfig {
	static _FILENAME = null;

	static getDataUrl () { return `${Renderer.get().baseUrl}data/${this._FILENAME}`; }

	static async loadJSON () { return this.loadRawJSON(); }
	static async loadRawJSON () { return DataUtil.loadJSON(this.getDataUrl()); }
	static async loadUnmergedJSON () { return DataUtil.loadRawJSON(this.getDataUrl()); }
}

class _DataUtilPropConfigMultiSource extends _DataUtilPropConfig {
	static _DIR = null;
	static _PROP = null;
	static _IS_MUT_ENTITIES = false;

	static get _isFluff () { return this._PROP.endsWith("Fluff"); }

	static _P_INDEX = null;

	static pLoadIndex () {
		this._P_INDEX = this._P_INDEX || DataUtil.loadJSON(`${Renderer.get().baseUrl}data/${this._DIR}/${this._isFluff ? `fluff-` : ""}index.json`);
		return this._P_INDEX;
	}

	static async pLoadAll () {
		const json = await this.loadJSON();
		return json[this._PROP] || [];
	}

	static async loadJSON () { return this._loadJSON({isUnmerged: false}); }
	static async loadUnmergedJSON () { return this._loadJSON({isUnmerged: true}); }

	static async _loadJSON ({isUnmerged = false} = {}) {
		const index = await this.pLoadIndex();

		const allData = await Object.entries(index)
			.pMap(async ([indexKey, file]) => this._pLoadSourceEntities({indexKey, isUnmerged, file}));

		return {[this._PROP]: allData.flat()};
	}

	static async pLoadSingleSource (source) {
		const index = await this.pLoadIndex();

		const file = index[source];
		if (!file) return null;

		return {[this._PROP]: await this._pLoadSourceEntities({indexKey: source, file})};
	}

	static async _pLoadSourceEntities ({indexKey = null, isUnmerged = false, file}) {
		await this._pInitPreData();

		const fnLoad = isUnmerged ? DataUtil.loadRawJSON.bind(DataUtil) : DataUtil.loadJSON.bind(DataUtil);

		let data = await fnLoad(`${Renderer.get().baseUrl}data/${this._DIR}/${file}`);
		data = (data[this._PROP] || []).filter(MultiSourceUtil.isEntityIndexKeyMatch.bind(this, indexKey, this._PROP));

		if (!this._IS_MUT_ENTITIES) return data;

		return data.map(ent => this._mutEntity(ent));
	}

	static _P_INIT_PRE_DATA = null;

	static async _pInitPreData () {
		return (this._P_INIT_PRE_DATA = this._P_INIT_PRE_DATA || this._pInitPreData_());
	}

	static async _pInitPreData_ () { /* Implement as required */ }

	static _mutEntity (ent) { return ent; }
}

class _DataUtilPropConfigCustom extends _DataUtilPropConfig {
	static async loadJSON () { throw new Error("Unimplemented!"); }
	static async loadUnmergedJSON () { throw new Error("Unimplemented!"); }
}

class _DataUtilBrewHelper {
	constructor ({defaultUrlRoot}) {
		this._defaultUrlRoot = defaultUrlRoot;
	}

	_getCleanUrlRoot (urlRoot) {
		if (urlRoot && urlRoot.trim()) {
			urlRoot = urlRoot.trim();
			if (!urlRoot.endsWith("/")) urlRoot = `${urlRoot}/`;
			return urlRoot;
		}
		return this._defaultUrlRoot;
	}

	async pLoadTimestamps (urlRoot) {
		urlRoot = this._getCleanUrlRoot(urlRoot);
		return DataUtil.loadJSON(`${urlRoot}_generated/index-timestamps.json`);
	}

	async pLoadPropIndex (urlRoot) {
		urlRoot = this._getCleanUrlRoot(urlRoot);
		return DataUtil.loadJSON(`${urlRoot}_generated/index-props.json`);
	}

	async pLoadMetaIndex (urlRoot) {
		urlRoot = this._getCleanUrlRoot(urlRoot);
		return DataUtil.loadJSON(`${urlRoot}_generated/index-meta.json`);
	}

	async pLoadSourceIndex (urlRoot) {
		urlRoot = this._getCleanUrlRoot(urlRoot);
		return DataUtil.loadJSON(`${urlRoot}_generated/index-sources.json`);
	}

	async pLoadAdventureBookIdsIndex (urlRoot) {
		urlRoot = this._getCleanUrlRoot(urlRoot);
		return DataUtil.loadJSON(`${urlRoot}_generated/index-adventure-book-ids.json`);
	}

	getFileUrl (path, urlRoot) {
		urlRoot = this._getCleanUrlRoot(urlRoot);
		return `${urlRoot}${path}`;
	}

	/* -------------------------------------------- */

	isUrlUnderDefaultRoot (url) {
		return url.startsWith(this._defaultUrlRoot);
	}

	getUrlRelativeToDefaultRoot (url) {
		return url.slice(this._defaultUrlRoot.length).replace(/^\/+/, "");
	}
}

globalThis.DataUtil = {
	_loading: {},
	_loaded: {},
	_merging: {},
	_merged: {},

	async _pLoad ({url, id, isBustCache = false}) {
		if (DataUtil._loading[id] && !isBustCache) {
			await DataUtil._loading[id];
			return DataUtil._loaded[id];
		}

		DataUtil._loading[id] = new Promise((resolve, reject) => {
			const request = new XMLHttpRequest();

			request.open("GET", url, true);
			/*
			// These would be nice to have, but kill CORS when e.g. hitting GitHub `raw.`s.
			// This may be why `fetch` dies horribly here, too. Prefer `XMLHttpRequest` for now, as it seems to have a
			//   higher innate tolerance to CORS nonsense.
			if (isBustCache) request.setRequestHeader("Cache-Control", "no-cache, no-store");
			request.setRequestHeader("Content-Type", "application/json");
			request.setRequestHeader("Referrer-Policy", "no-referrer");
			 */
			request.overrideMimeType("application/json");

			request.onload = function () {
				try {
					DataUtil._loaded[id] = JSON.parse(this.response);
					resolve();
				} catch (e) {
					reject(new Error(`Could not parse JSON from ${url}: ${e.message}`));
				}
			};
			request.onerror = (e) => {
				const ptDetail = [
					"status",
					"statusText",
					"readyState",
					"response",
					"responseType",
				]
					.map(prop => `${prop}=${JSON.stringify(e.target[prop])}`)
					.join(" ");
				reject(new Error(`Error during JSON request: ${ptDetail}`));
			};

			request.send();
		});

		await DataUtil._loading[id];
		return DataUtil._loaded[id];
	},

	_mutAddProps (data) {
		if (!data || typeof data !== "object") return;

		for (const k in data) {
			if (!(data[k] instanceof Array)) continue;

			for (const it of data[k]) {
				if (typeof it !== "object") continue;
				it.__prop = k;
			}
		}
	},

	_verifyMerged (data) {
		if (!data || typeof data !== "object") return;

		for (const k in data) {
			if (!(data[k] instanceof Array)) continue;

			for (const it of data[k]) {
				if (typeof it !== "object") continue;
				if (it._copy) {
					setTimeout(() => { throw new Error(`Unresolved "_copy" in entity: ${JSON.stringify(it)}`); });
				}
			}
		}
	},

	async loadJSON (url) {
		return DataUtil._loadJson(url, {isDoDataMerge: true});
	},

	async loadRawJSON (url, {isBustCache} = {}) {
		return DataUtil._loadJson(url, {isBustCache});
	},

	async _loadJson (url, {isDoDataMerge = false, isBustCache = false} = {}) {
		const procUrl = UrlUtil.link(url, {isBustCache});

		let data;
		try {
			data = await DataUtil._pLoad({url: procUrl, id: url, isBustCache});
		} catch (e) {
			setTimeout(() => { throw e; });
		}

		// Fallback to the un-processed URL
		if (!data) data = await DataUtil._pLoad({url: url, id: url, isBustCache});

		if (isDoDataMerge) await DataUtil.pDoMetaMerge(url, data);

		return data;
	},

	/* -------------------------------------------- */

	async pDoMetaMerge (ident, data, options) {
		DataUtil._mutAddProps(data);

		const isFresh = !DataUtil._merging[ident];

		DataUtil._merging[ident] ||= DataUtil._pDoMetaMerge(ident, data, options);
		await DataUtil._merging[ident];
		const out = DataUtil._merged[ident];

		// Cache the result, but immediately flush it.
		//   We do this because the cache is both a cache and a locking mechanism.
		if (options?.isSkipMetaMergeCache) {
			delete DataUtil._merging[ident];
			delete DataUtil._merged[ident];
		}

		if (isFresh) DataUtil._verifyMerged(out);

		return out;
	},

	_pDoMetaMerge_handleCopyProp (prop, arr, entry, options) {
		if (!entry._copy) return;
		let fnMergeCopy = DataUtil[prop]?.pMergeCopy;
		if (!fnMergeCopy) throw new Error(`No dependency _copy merge strategy specified for property "${prop}"`);
		fnMergeCopy = fnMergeCopy.bind(DataUtil[prop]);
		return fnMergeCopy(arr, entry, options);
	},

	async _pDoMetaMerge (ident, data, options) {
		if (data._meta) {
			const loadedSourceIds = new Set();

			if (data._meta.dependencies) {
				await Promise.all(Object.entries(data._meta.dependencies).map(async ([dataProp, sourceIds]) => {
					sourceIds.forEach(sourceId => loadedSourceIds.add(sourceId));

					if (!data[dataProp]) return; // if e.g. monster dependencies are declared, but there are no monsters to merge with, bail out

					const isHasInternalCopies = (data._meta.internalCopies || []).includes(dataProp);

					const dependencyData = await Promise.all(
						DataUtil._getLoadGroupedSourceIds({prop: dataProp, sourceIds})
							.map(sourceId => DataUtil.pLoadByMeta(dataProp, sourceId)),
					);

					const flatDependencyData = dependencyData.map(dd => dd[dataProp]).flat().filter(Boolean);
					await Promise.all(data[dataProp].map(entry => DataUtil._pDoMetaMerge_handleCopyProp(dataProp, flatDependencyData, entry, {...options, isErrorOnMissing: !isHasInternalCopies})));
				}));
				delete data._meta.dependencies;
			}

			if (data._meta.internalCopies) {
				for (const prop of data._meta.internalCopies) {
					if (!data[prop]) continue;
					for (const entry of data[prop]) {
						await DataUtil._pDoMetaMerge_handleCopyProp(prop, data[prop], entry, {...options, isErrorOnMissing: true});
					}
				}
				delete data._meta.internalCopies;
			}

			// Load any other included data
			if (data._meta.includes) {
				const includesData = await Promise.all(Object.entries(data._meta.includes).map(async ([dataProp, sourceIds]) => {
					// Avoid re-loading any sources we already loaded as dependencies
					sourceIds = sourceIds.filter(it => !loadedSourceIds.has(it));

					sourceIds.forEach(sourceId => loadedSourceIds.add(sourceId));

					const includesData = await Promise.all(sourceIds.map(sourceId => DataUtil.pLoadByMeta(dataProp, sourceId)));

					const flatIncludesData = includesData.map(dd => dd[dataProp]).flat().filter(Boolean);
					return {dataProp, flatIncludesData};
				}));
				delete data._meta.includes;

				// Add the includes data to our current data
				includesData.forEach(({dataProp, flatIncludesData}) => {
					data[dataProp] = [...data[dataProp] || [], ...flatIncludesData];
				});
			}
		}

		if (data._meta && data._meta.otherSources) {
			await Promise.all(Object.entries(data._meta.otherSources).map(async ([dataProp, sourceIds]) => {
				const additionalData = await Promise.all(Object.entries(sourceIds).map(async ([sourceId, findWith]) => ({
					findWith,
					dataOther: await DataUtil.pLoadByMeta(dataProp, sourceId),
				})));

				additionalData.forEach(({findWith, dataOther}) => {
					const toAppend = dataOther[dataProp].filter(it => it.otherSources && it.otherSources.find(os => os.source === findWith));
					if (toAppend.length) data[dataProp] = (data[dataProp] || []).concat(toAppend);
				});
			}));
			delete data._meta.otherSources;
		}

		if (data._meta && !Object.keys(data._meta).length) delete data._meta;

		DataUtil._merged[ident] = data;
	},

	/* -------------------------------------------- */

	async pDoMetaMergeSingle (prop, meta, ent) {
		return (await DataUtil.pDoMetaMerge(
			CryptUtil.uid(),
			{
				_meta: meta,
				[prop]: [ent],
			},
			{
				isSkipMetaMergeCache: true,
			},
		))[prop][0];
	},

	/* -------------------------------------------- */

	getCleanFilename (filename) {
		return filename.replace(/[^-_a-zA-Z0-9]/g, "_");
	},

	getCsv (headers, rows) {
		function escapeCsv (str) {
			return `"${str.replace(/"/g, `""`).replace(/ +/g, " ").replace(/\n\n+/gi, "\n\n")}"`;
		}

		function toCsv (row) {
			return row.map(str => escapeCsv(str)).join(",");
		}

		return `${toCsv(headers)}\n${rows.map(r => toCsv(r)).join("\n")}`;
	},

	/**
	 * @param {string} filename
	 * @param {*} data
	 * @param {?string} fileType
	 * @param {?boolean} isSkipAdditionalMetadata
	 * @param {?string} propVersion
	 * @param {?string} valVersion
	 */
	userDownload (
		filename,
		data,
		{
			fileType = null,
			isSkipAdditionalMetadata = false,
			propVersion = "siteVersion",
			valVersion = VERSION_NUMBER,
		} = {},
	) {
		filename = `${filename}.json`;
		if (isSkipAdditionalMetadata || data instanceof Array) return DataUtil._userDownload(filename, JSON.stringify(data, null, "\t"), "text/json");

		data = {[propVersion]: valVersion, ...data};
		if (fileType != null) data = {fileType, ...data};
		return DataUtil._userDownload(filename, JSON.stringify(data, null, "\t"), "text/json");
	},

	userDownloadText (filename, string) {
		return DataUtil._userDownload(filename, string, "text/plain");
	},

	_userDownload (filename, data, mimeType) {
		const t = new Blob([data], {type: mimeType});
		const dataUrl = window.URL.createObjectURL(t);
		DataUtil.userDownloadDataUrl(filename, dataUrl);
		setTimeout(() => window.URL.revokeObjectURL(dataUrl), 100);
	},

	userDownloadDataUrl (filename, dataUrl) {
		const a = document.createElement("a");
		a.href = dataUrl;
		a.download = filename;
		a.dispatchEvent(new MouseEvent("click", {bubbles: true, cancelable: true, view: window}));
	},

	doHandleFileLoadErrorsGeneric (errors) {
		if (!errors) return;
		errors.forEach(err => {
			JqueryUtil.doToast({
				content: `Could not load file "${err.filename}": <code>${err.message}</code>. ${VeCt.STR_SEE_CONSOLE}`,
				type: "danger",
			});
		});
	},

	cleanJson (cpy, {isDeleteUniqueId = true} = {}) {
		if (!cpy) return cpy;
		cpy.name = cpy._displayName || cpy.name;
		if (isDeleteUniqueId) delete cpy.uniqueId;
		DataUtil.__cleanJsonObject(cpy);
		return cpy;
	},

	_CLEAN_JSON_ALLOWED_UNDER_KEYS: [
		"_copy",
		"_versions",
		"_version",
	],
	__cleanJsonObject (obj) {
		if (obj == null) return obj;
		if (typeof obj !== "object") return obj;

		if (obj instanceof Array) {
			return obj.forEach(it => DataUtil.__cleanJsonObject(it));
		}

		Object.entries(obj).forEach(([k, v]) => {
			if (DataUtil._CLEAN_JSON_ALLOWED_UNDER_KEYS.includes(k)) return;
			// TODO(Future) use "__" prefix for temp data, instead of "_"
			if ((k.startsWith("_") && k !== "_") || k === "customHashId") delete obj[k];
			else DataUtil.__cleanJsonObject(v);
		});
	},

	_MULTI_SOURCE_PROP_TO_DIR: {
		"monster": "bestiary",
		"monsterFluff": "bestiary",
		"spell": "spells",
		"spellFluff": "spells",
		"class": "class",
		"classFluff": "class",
		"subclass": "class",
		"subclassFluff": "class",
		"classFeature": "class",
		"subclassFeature": "class",
	},
	_MULTI_SOURCE_PROP_TO_INDEX_NAME: {
		"class": "index.json",
		"subclass": "index.json",
		"classFeature": "index.json",
		"subclassFeature": "index.json",
	},
	async pLoadByMeta (prop, source) {
		// TODO(future) expand support

		switch (prop) {
			// region Predefined multi-source
			case "monster":
			case "spell":
			case "monsterFluff":
			case "spellFluff": {
				const data = await DataUtil[prop].pLoadSingleSource(source);
				if (data) return data;

				return DataUtil._pLoadByMeta_pGetPrereleaseBrew(source);
			}
			// endregion

			// region Multi-source
			case "class":
			case "classFluff":
			case "subclass":
			case "subclassFluff":
			case "classFeature":
			case "subclassFeature": {
				const baseUrlPart = `${Renderer.get().baseUrl}data/${DataUtil._MULTI_SOURCE_PROP_TO_DIR[prop]}`;
				const index = await DataUtil.loadJSON(`${baseUrlPart}/${DataUtil._MULTI_SOURCE_PROP_TO_INDEX_NAME[prop]}`);
				if (index[source]) return DataUtil.loadJSON(`${baseUrlPart}/${index[source]}`);

				return DataUtil._pLoadByMeta_pGetPrereleaseBrew(source);
			}
			// endregion

			// region Special
			case "item":
			case "itemGroup":
			case "baseitem":
			case "magicvariant": {
				const data = await DataUtil.item.loadRawJSON();
				if (SourceUtil.isSiteSource(source)) return data;
				return DataUtil._pLoadByMeta_pGetPrereleaseBrew(source);
			}
			case "race": {
				// FIXME(Future) this should really `loadRawJSON`, but this breaks existing brew.
				//   Consider a large-scale migration in future.
				const data = await DataUtil.race.loadJSON({isAddBaseRaces: true});
				if (SourceUtil.isSiteSource(source)) return data;
				return DataUtil._pLoadByMeta_pGetPrereleaseBrew(source);
			}
			// endregion

			// region Standard
			default: {
				const impl = DataUtil[prop];
				if (impl && (impl.getDataUrl || impl.loadJSON)) {
					const data = await (impl.loadJSON ? impl.loadJSON() : DataUtil.loadJSON(impl.getDataUrl()));
					if (SourceUtil.isSiteSource(source)) return data;

					return DataUtil._pLoadByMeta_pGetPrereleaseBrew(source);
				}

				throw new Error(`Could not get loadable URL for \`${JSON.stringify({key: prop, value: source})}\``);
			}
			// endregion
		}
	},

	async _pLoadByMeta_pGetPrereleaseBrew (source) {
		const fromPrerelease = await DataUtil.pLoadPrereleaseBySource(source);
		if (fromPrerelease) return fromPrerelease;

		const fromBrew = await DataUtil.pLoadBrewBySource(source);
		if (fromBrew) return fromBrew;

		throw new Error(`Could not find prerelease/brew URL for source "${source}"`);
	},

	/* -------------------------------------------- */

	_getLoadGroupedSourceIds ({prop, sourceIds}) {
		if (DataUtil._MULTI_SOURCE_PROP_TO_DIR[prop]) return sourceIds;

		let siteSourceFirst = null;

		const nonSiteSources = sourceIds
			.filter(sourceId => {
				const isSiteSource = SourceUtil.isSiteSource(sourceId);
				if (isSiteSource && siteSourceFirst == null) siteSourceFirst = sourceId;
				return !isSiteSource;
			});

		if (!siteSourceFirst) return sourceIds;
		return [siteSourceFirst, ...nonSiteSources];
	},

	/* -------------------------------------------- */

	async pLoadPrereleaseBySource (source) {
		if (typeof PrereleaseUtil === "undefined") return null;
		return this._pLoadPrereleaseBrewBySource({source, brewUtil: PrereleaseUtil});
	},

	async pLoadBrewBySource (source) {
		if (typeof BrewUtil2 === "undefined") return null;
		return this._pLoadPrereleaseBrewBySource({source, brewUtil: BrewUtil2});
	},

	async _pLoadPrereleaseBrewBySource ({source, brewUtil}) {
		// Load from existing first
		const fromExisting = await brewUtil.pGetBrewBySource(source);
		if (fromExisting) return MiscUtil.copyFast(fromExisting.body);

		// Load from remote
		const url = await brewUtil.pGetSourceUrl(source);
		if (!url) return null;

		return DataUtil.loadJSON(url);
	},

	/* -------------------------------------------- */

	// region Dbg
	dbg: {
		isTrackCopied: false,
	},
	// endregion

	generic: {
		_MERGE_REQUIRES_PRESERVE_BASE: {
			page: true,
			otherSources: true,
			srd: true,
			srd52: true,
			basicRules: true,
			freeRules2024: true,
			reprintedAs: true,
			hasFluff: true,
			hasFluffImages: true,
			hasToken: true,
			_versions: true,
		},

		_walker_replaceTxt: null,

		/**
		 * @param uid
		 * @param tag
		 * @param [opts]
		 * @param [opts.isLower] If the returned values should be lowercase.
		 */
		unpackUid (uid, tag, opts) {
			opts = opts || {};
			if (opts.isLower) uid = uid.toLowerCase();
			let [name, source, displayText, ...others] = uid.split("|").map(Function.prototype.call.bind(String.prototype.trim));

			// If "ambiguous" source, allow linking to version-dependent entity
			const isAllowRedirect = !source;

			source = source || Parser.getTagSource(tag, source);
			if (opts.isLower) source = source.toLowerCase();

			return {
				name,
				source,
				displayText,
				others,
				isAllowRedirect,
			};
		},

		packUid (ent, tag) {
			// <name>|<source>
			const sourceDefault = Parser.getTagSource(tag);
			return [
				ent.name,
				(ent.source || "").toLowerCase() === sourceDefault.toLowerCase() ? "" : ent.source,
			].join("|").replace(/\|+$/, ""); // Trim trailing pipes
		},

		getUid (ent, {isMaintainCase = false, displayName = null} = {}) {
			const {name} = ent;
			const source = SourceUtil.getEntitySource(ent);
			if (!name || !source) throw new Error(`Entity did not have a name and source!`);
			const pts = [name, source];
			if (displayName) pts.push(displayName);
			const out = pts.join("|");
			if (isMaintainCase) return out;
			return out.toLowerCase();
		},

		async _pMergeCopy (impl, page, entryList, entry, options) {
			if (!entry._copy) return;

			const hashCurrent = UrlUtil.URL_TO_HASH_BUILDER[page](entry);
			const hash = UrlUtil.URL_TO_HASH_BUILDER[page](entry._copy);

			if (hashCurrent === hash) throw new Error(`${hashCurrent} _copy self-references! This is a bug!`);

			const entParent = (impl._mergeCache = impl._mergeCache || {})[hash] || DataUtil.generic._pMergeCopy_search(impl, page, entryList, entry, options);

			if (!entParent) {
				if (options.isErrorOnMissing) {
					throw new Error(`Could not find "${page}" entity "${entry._copy.name}" ("${entry._copy.source}") to copy in copier "${entry.name}" ("${entry.source}")`);
				}
				return;
			}

			if (DataUtil.dbg.isTrackCopied) entParent.dbg_isCopied = true;
			// Handle recursive copy
			if (entParent._copy) await DataUtil.generic._pMergeCopy(impl, page, entryList, entParent, options);

			// Preload templates, if required
			// TODO(Template) allow templates for other entity types
			const templateData = entry._copy?._templates
				? (await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/bestiary/template.json`))
				: null;
			return DataUtil.generic.copyApplier.getCopy(impl, MiscUtil.copyFast(entParent), entry, templateData, options);
		},

		_pMergeCopy_search (impl, page, entryList, entry, options) {
			const entryHash = UrlUtil.URL_TO_HASH_BUILDER[page](entry._copy);
			return entryList.find(ent => {
				const hash = UrlUtil.URL_TO_HASH_BUILDER[page](ent);
				// Avoid clobbering existing caches, as we assume "earlier = better"
				impl._mergeCache[hash] ||= ent;
				return hash === entryHash;
			});
		},

		COPY_ENTRY_PROPS: [
			"action", "bonus", "reaction", "trait", "legendary", "mythic", "variant", "spellcasting",
			"actionHeader", "bonusHeader", "reactionHeader", "legendaryHeader", "mythicHeader",
		],

		copyApplier: class {
			static _WALKER = null;

			// convert everything to arrays
			static _normaliseMods (obj) {
				Object.entries(obj._mod).forEach(([k, v]) => {
					if (!(v instanceof Array)) obj._mod[k] = [v];
				});
			}

			// mod helpers /////////////////
			static _doEnsureArray ({obj, prop}) {
				if (!(obj[prop] instanceof Array)) obj[prop] = [obj[prop]];
			}

			static _getRegexFromReplaceModInfo ({replace, flags}) {
				return new RegExp(replace, `g${flags || ""}`);
			}

			static _doReplaceStringHandler ({re, withStr}, str) {
				// TODO(Future) may need to have this handle replaces inside _some_ tags
				const split = Renderer.splitByTags(str);
				const len = split.length;
				for (let i = 0; i < len; ++i) {
					if (split[i].startsWith("{@")) continue;
					split[i] = split[i].replace(re, withStr);
				}
				return split.join("");
			}

			static _doMod_appendStr ({copyTo, copyFrom, modInfo, msgPtFailed, propPath}) {
				const valExisting = MiscUtil.get(copyTo, ...propPath);
				if (valExisting) MiscUtil.set(copyTo, ...propPath, `${valExisting}${modInfo.joiner || ""}${modInfo.str}`);
				else MiscUtil.set(copyTo, ...propPath, modInfo.str);
			}

			static _doMod_replaceName ({copyTo, copyFrom, modInfo, msgPtFailed, propPath}) {
				const ents = MiscUtil.get(copyTo, ...propPath);
				if (!ents) return;

				DataUtil.generic._walker_replaceTxt = DataUtil.generic._walker_replaceTxt || MiscUtil.getWalker();
				const re = this._getRegexFromReplaceModInfo({replace: modInfo.replace, flags: modInfo.flags});
				const handlers = {string: this._doReplaceStringHandler.bind(null, {re: re, withStr: modInfo.with})};

				ents.forEach(ent => {
					if (ent.name) ent.name = DataUtil.generic._walker_replaceTxt.walk(ent.name, handlers);
				});
			}

			static _doMod_replaceTxt ({copyTo, copyFrom, modInfo, msgPtFailed, propPath}) {
				const ents = MiscUtil.get(copyTo, ...propPath);
				if (!ents) return;

				DataUtil.generic._walker_replaceTxt = DataUtil.generic._walker_replaceTxt || MiscUtil.getWalker();
				const re = this._getRegexFromReplaceModInfo({replace: modInfo.replace, flags: modInfo.flags});
				const handlers = {string: this._doReplaceStringHandler.bind(null, {re: re, withStr: modInfo.with})};

				const props = modInfo.props || [null, "entries", "headerEntries", "footerEntries"];
				if (!props.length) return;

				if (props.includes(null)) {
					// Handle any pure strings, e.g. `"legendaryHeader"`
					MiscUtil.set(copyTo, ...propPath, ents.map(it => {
						if (typeof it !== "string") return it;
						return DataUtil.generic._walker_replaceTxt.walk(it, handlers);
					}));
				}

				ents.forEach(ent => {
					props.forEach(prop => {
						if (prop == null) return;
						if (ent[prop]) ent[prop] = DataUtil.generic._walker_replaceTxt.walk(ent[prop], handlers);
					});
				});
			}

			static _doMod_prependArr ({copyTo, copyFrom, modInfo, msgPtFailed, propPath}) {
				this._doEnsureArray({obj: modInfo, prop: "items"});
				const valExisting = MiscUtil.get(copyTo, ...propPath);
				MiscUtil.set(copyTo, ...propPath, valExisting ? modInfo.items.concat(valExisting) : modInfo.items);
			}

			static _doMod_appendArr ({copyTo, copyFrom, modInfo, msgPtFailed, propPath}) {
				this._doEnsureArray({obj: modInfo, prop: "items"});
				const valExisting = MiscUtil.get(copyTo, ...propPath);
				MiscUtil.set(copyTo, ...propPath, valExisting ? valExisting.concat(modInfo.items) : modInfo.items);
			}

			static _doMod_appendIfNotExistsArr ({copyTo, copyFrom, modInfo, msgPtFailed, propPath}) {
				this._doEnsureArray({obj: modInfo, prop: "items"});
				const valExisting = MiscUtil.get(copyTo, ...propPath);
				if (!valExisting) return MiscUtil.set(copyTo, ...propPath, modInfo.items);
				MiscUtil.set(copyTo, ...propPath, valExisting.concat(modInfo.items.filter(it => !valExisting.some(x => CollectionUtil.deepEquals(it, x)))));
			}

			static _doMod_replaceArr ({copyTo, copyFrom, modInfo, msgPtFailed, propPath, isThrow = true}) {
				this._doEnsureArray({obj: modInfo, prop: "items"});

				const valExisting = MiscUtil.get(copyTo, ...propPath);
				if (!valExisting) {
					if (isThrow) throw new Error(`${msgPtFailed} Could not find "${propPath.join(".")}" array`);
					return false;
				}

				let ixOld;
				if (modInfo.replace.regex) {
					const re = new RegExp(modInfo.replace.regex, modInfo.replace.flags || "");
					ixOld = valExisting.findIndex(it => it.name ? re.test(it.name) : typeof it === "string" ? re.test(it) : false);
				} else if (modInfo.replace.index != null) {
					ixOld = modInfo.replace.index;
				} else {
					ixOld = valExisting.findIndex(it => it.name ? it.name === modInfo.replace : it === modInfo.replace);
				}

				if (~ixOld) {
					valExisting.splice(ixOld, 1, ...modInfo.items);
					return true;
				} else if (isThrow) throw new Error(`${msgPtFailed} Could not find "${propPath.join(".")}" item with name "${modInfo.replace}" to replace`);
				return false;
			}

			static _doMod_replaceOrAppendArr ({copyTo, copyFrom, modInfo, msgPtFailed, propPath}) {
				const didReplace = this._doMod_replaceArr({copyTo, copyFrom, modInfo, msgPtFailed, propPath, isThrow: false});
				if (!didReplace) this._doMod_appendArr({copyTo, copyFrom, modInfo, msgPtFailed, propPath});
			}

			static _doMod_insertArr ({copyTo, copyFrom, modInfo, msgPtFailed, propPath}) {
				this._doEnsureArray({obj: modInfo, prop: "items"});
				const valExisting = MiscUtil.get(copyTo, ...propPath);
				if (!valExisting) throw new Error(`${msgPtFailed} Could not find "${valExisting.join(".")}" array`);
				valExisting.splice(~modInfo.index ? modInfo.index : valExisting.length, 0, ...modInfo.items);
			}

			static _doMod_removeArr ({copyTo, copyFrom, modInfo, msgPtFailed, propPath}) {
				const valExisting = MiscUtil.get(copyTo, ...propPath);
				if (modInfo.names) {
					this._doEnsureArray({obj: modInfo, prop: "names"});
					modInfo.names.forEach(nameToRemove => {
						const ixOld = valExisting.findIndex(it => it.name === nameToRemove);
						if (~ixOld) valExisting.splice(ixOld, 1);
						else {
							if (!modInfo.force) throw new Error(`${msgPtFailed} Could not find "${propPath.join(".")}" item with name "${nameToRemove}" to remove`);
						}
					});
				} else if (modInfo.items) {
					this._doEnsureArray({obj: modInfo, prop: "items"});
					modInfo.items.forEach(itemToRemove => {
						const ixOld = valExisting.findIndex(it => it === itemToRemove);
						if (~ixOld) valExisting.splice(ixOld, 1);
						else throw new Error(`${msgPtFailed} Could not find "${propPath.join(".")}" item "${itemToRemove}" to remove`);
					});
				} else throw new Error(`${msgPtFailed} One of "names" or "items" must be provided!`);
			}

			static _doMod_renameArr ({copyTo, copyFrom, modInfo, msgPtFailed, propPath, isThrow = true}) {
				this._doEnsureArray({obj: modInfo, prop: "renames"});

				const valExisting = MiscUtil.get(copyTo, ...propPath);
				if (!valExisting) {
					if (isThrow) throw new Error(`${msgPtFailed} Could not find "${propPath.join(".")}" array`);
					return;
				}

				modInfo.renames
					.forEach(rename => {
						const ent = valExisting.find(ent => ent?.name === rename.rename);
						if (!ent) {
							if (isThrow) throw new Error(`${msgPtFailed} Could not find "${propPath.join(".")}" item with name "${rename.rename}" to rename`);
							return;
						}

						ent.name = rename.with;
					});
			}

			static _doMod_calculateProp ({copyTo, copyFrom, modInfo, msgPtFailed, propPath}) {
				const tgt = MiscUtil.getOrSet(copyTo, ...propPath, {});
				const toExec = modInfo.formula.replace(/<\$([^$]+)\$>/g, (...m) => {
					switch (m[1]) {
						case "prof_bonus": return Parser.crToPb(copyTo.cr);
						case "dex_mod": return Parser.getAbilityModNumber(copyTo.dex);
						default: throw new Error(`${msgPtFailed} Unknown variable "${m[1]}"`);
					}
				});
				// TODO(Future) add option to format as bonus
				// eslint-disable-next-line no-eval
				tgt[modInfo.prop] = eval(DataUtil.generic.variableResolver.getCleanMathExpression(toExec));
			}

			static _doMod_scalarAddProp ({copyTo, copyFrom, modInfo, msgPtFailed, propPath}) {
				const tgt = MiscUtil.get(copyTo, ...propPath);
				if (!tgt) return;

				const applyTo = (k) => {
					const out = Number(tgt[k]) + modInfo.scalar;
					const isString = typeof tgt[k] === "string";
					tgt[k] = isString ? `${out >= 0 ? "+" : ""}${out}` : out;
				};

				if (modInfo.prop === "*") Object.keys(tgt).forEach(k => applyTo(k));
				else applyTo(modInfo.prop);
			}

			static _doMod_scalarMultProp ({copyTo, copyFrom, modInfo, msgPtFailed, propPath}) {
				const tgt = MiscUtil.get(copyTo, ...propPath);
				if (!tgt) return;

				const applyTo = (k) => {
					let out = Number(tgt[k]) * modInfo.scalar;
					if (modInfo.floor) out = Math.floor(out);
					const isString = typeof tgt[k] === "string";
					tgt[k] = isString ? `${out >= 0 ? "+" : ""}${out}` : out;
				};

				if (modInfo.prop === "*") Object.keys(tgt).forEach(k => applyTo(k));
				else applyTo(modInfo.prop);
			}

			static _doMod_addSenses ({copyTo, copyFrom, modInfo, msgPtFailed}) {
				this._doEnsureArray({obj: modInfo, prop: "senses"});
				copyTo.senses = copyTo.senses || [];
				modInfo.senses.forEach(sense => {
					let found = false;
					for (let i = 0; i < copyTo.senses.length; ++i) {
						const m = new RegExp(`${sense.type} (\\d+)`, "i").exec(copyTo.senses[i]);
						if (m) {
							found = true;
							// if the creature already has a greater sense of this type, do nothing
							if (Number(m[1]) < sense.range) {
								copyTo.senses[i] = `${sense.type} ${sense.range} ft.`;
							}
							break;
						}
					}

					if (!found) copyTo.senses.push(`${sense.type} ${sense.range} ft.`);
				});
			}

			static _doMod_addSaves ({copyTo, copyFrom, modInfo, msgPtFailed}) {
				copyTo.save = copyTo.save || {};
				Object.entries(modInfo.saves).forEach(([save, mode]) => {
					// mode: 1 = proficient; 2 = expert
					const total = mode * Parser.crToPb(copyTo.cr) + Parser.getAbilityModNumber(copyTo[save]);
					const asText = total >= 0 ? `+${total}` : total;
					if (copyTo.save && copyTo.save[save]) {
						// update only if ours is larger (prevent reduction in save)
						if (Number(copyTo.save[save]) < total) copyTo.save[save] = asText;
					} else copyTo.save[save] = asText;
				});
			}

			static _doMod_addSkills ({copyTo, copyFrom, modInfo, msgPtFailed}) {
				copyTo.skill = copyTo.skill || {};
				Object.entries(modInfo.skills).forEach(([skill, mode]) => {
					// mode: 1 = proficient; 2 = expert
					const total = mode * Parser.crToPb(copyTo.cr) + Parser.getAbilityModNumber(copyTo[Parser.skillToAbilityAbv(skill)]);
					const asText = total >= 0 ? `+${total}` : total;
					if (copyTo.skill && copyTo.skill[skill]) {
						// update only if ours is larger (prevent reduction in skill score)
						if (Number(copyTo.skill[skill]) < total) copyTo.skill[skill] = asText;
					} else copyTo.skill[skill] = asText;
				});
			}

			static _doMod_addAllSaves ({copyTo, copyFrom, modInfo, msgPtFailed}) {
				return this._doMod_addSaves({
					copyTo,
					copyFrom,
					modInfo: {
						mode: "addSaves",
						saves: Object.keys(Parser.ATB_ABV_TO_FULL).mergeMap(it => ({[it]: modInfo.saves})),
					},
					msgPtFailed,
				});
			}

			static _doMod_addAllSkills ({copyTo, copyFrom, modInfo, msgPtFailed}) {
				return this._doMod_addSkills({
					copyTo,
					copyFrom,
					modInfo: {
						mode: "addSkills",
						skills: Object.keys(Parser.SKILL_TO_ATB_ABV).mergeMap(it => ({[it]: modInfo.skills})),
					},
					msgPtFailed,
				});
			}

			static _doMod_addSpells ({copyTo, copyFrom, modInfo, msgPtFailed}) {
				if (!copyTo.spellcasting) throw new Error(`${msgPtFailed} Creature did not have a spellcasting property!`);

				// TODO could accept a "position" or "name" parameter should spells need to be added to other spellcasting traits
				const spellcasting = copyTo.spellcasting[0];

				if (modInfo.spells) {
					const spells = spellcasting.spells;

					Object.keys(modInfo.spells).forEach(k => {
						if (!spells[k]) spells[k] = modInfo.spells[k];
						else {
							// merge the objects
							const spellCategoryNu = modInfo.spells[k];
							const spellCategoryOld = spells[k];
							Object.keys(spellCategoryNu).forEach(kk => {
								if (!spellCategoryOld[kk]) spellCategoryOld[kk] = spellCategoryNu[kk];
								else {
									if (typeof spellCategoryOld[kk] === "object") {
										if (spellCategoryOld[kk] instanceof Array) spellCategoryOld[kk] = spellCategoryOld[kk].concat(spellCategoryNu[kk]).sort(SortUtil.ascSortLower);
										else throw new Error(`${msgPtFailed} Object at key ${kk} not an array!`);
									} else spellCategoryOld[kk] = spellCategoryNu[kk];
								}
							});
						}
					});
				}

				["constant", "will", "ritual"].forEach(prop => {
					if (!modInfo[prop]) return;
					modInfo[prop].forEach(sp => (spellcasting[prop] = spellcasting[prop] || []).push(sp));
				});

				["recharge", "legendary", "charges", "rest", "restLong", "daily", "weekly", "monthly", "yearly"].forEach(prop => {
					if (!modInfo[prop]) return;

					for (let i = 1; i <= 9; ++i) {
						const e = `${i}e`;

						spellcasting[prop] = spellcasting[prop] || {};

						if (modInfo[prop][i]) {
							modInfo[prop][i].forEach(sp => (spellcasting[prop][i] = spellcasting[prop][i] || []).push(sp));
						}

						if (modInfo[prop][e]) {
							modInfo[prop][e].forEach(sp => (spellcasting[prop][e] = spellcasting[prop][e] || []).push(sp));
						}
					}
				});
			}

			static _doMod_replaceSpells ({copyTo, copyFrom, modInfo, msgPtFailed}) {
				if (!copyTo.spellcasting) throw new Error(`${msgPtFailed} Creature did not have a spellcasting property!`);

				// TODO could accept a "position" or "name" parameter should spells need to be added to other spellcasting traits
				const spellcasting = copyTo.spellcasting[0];

				const handleReplace = (curSpells, replaceMeta, k) => {
					this._doEnsureArray({obj: replaceMeta, prop: "with"});

					const ix = curSpells[k].indexOf(replaceMeta.replace);
					if (~ix) {
						curSpells[k].splice(ix, 1, ...replaceMeta.with);
						curSpells[k].sort(SortUtil.ascSortLower);
					} else throw new Error(`${msgPtFailed} Could not find spell "${replaceMeta.replace}" to replace`);
				};

				if (modInfo.spells) {
					const trait0 = spellcasting.spells;
					Object.keys(modInfo.spells).forEach(k => { // k is e.g. "4"
						if (trait0[k]) {
							const replaceMetas = modInfo.spells[k];
							const curSpells = trait0[k];
							replaceMetas.forEach(replaceMeta => handleReplace(curSpells, replaceMeta, "spells"));
						}
					});
				}

				// TODO should be extended  to handle all non-slot-based spellcasters
				if (modInfo.daily) {
					for (let i = 1; i <= 9; ++i) {
						const e = `${i}e`;

						if (modInfo.daily[i]) {
							modInfo.daily[i].forEach(replaceMeta => handleReplace(spellcasting.daily, replaceMeta, i));
						}

						if (modInfo.daily[e]) {
							modInfo.daily[e].forEach(replaceMeta => handleReplace(spellcasting.daily, replaceMeta, e));
						}
					}
				}
			}

			static _doMod_removeSpells ({copyTo, copyFrom, modInfo, msgPtFailed}) {
				if (!copyTo.spellcasting) throw new Error(`${msgPtFailed} Creature did not have a spellcasting property!`);

				// TODO could accept a "position" or "name" parameter should spells need to be added to other spellcasting traits
				const spellcasting = copyTo.spellcasting[0];

				if (modInfo.spells) {
					const spells = spellcasting.spells;

					Object.keys(modInfo.spells).forEach(k => {
						if (!spells[k]?.spells) return;

						spells[k].spells = spells[k].spells.filter(it => !modInfo.spells[k].includes(it));
					});
				}

				["constant", "will", "ritual"].forEach(prop => {
					if (!modInfo[prop]) return;
					spellcasting[prop].filter(it => !modInfo[prop].includes(it));
				});

				["recharge", "legendary", "charges", "rest", "restLong", "daily", "weekly", "monthly", "yearly"].forEach(prop => {
					if (!modInfo[prop]) return;

					for (let i = 1; i <= 9; ++i) {
						const e = `${i}e`;

						spellcasting[prop] = spellcasting[prop] || {};

						if (modInfo[prop][i]) {
							spellcasting[prop][i] = spellcasting[prop][i].filter(it => !modInfo[prop][i].includes(it));
						}

						if (modInfo[prop][e]) {
							spellcasting[prop][e] = spellcasting[prop][e].filter(it => !modInfo[prop][e].includes(it));
						}
					}
				});
			}

			static _doMod_scalarAddHit ({copyTo, copyFrom, modInfo, msgPtFailed, propPath}) {
				const valExisting = MiscUtil.get(copyTo, ...propPath);
				if (!valExisting) return;

				const re = /{@hit ([-+]?\d+)}/g;
				MiscUtil.set(
					copyTo,
					...propPath,
					this._WALKER.walk(
						valExisting,
						{
							string: (str) => {
								return str
									.replace(re, (m0, m1) => `{@hit ${Number(m1) + modInfo.scalar}}`);
							},
						},
					),
				);
			}

			static _doMod_scalarAddDc ({copyTo, copyFrom, modInfo, msgPtFailed, propPath}) {
				const valExisting = MiscUtil.get(copyTo, ...propPath);
				if (!valExisting) return;

				const re = /{@dc (\d+)(?:\|[^}]+)?}/g;
				MiscUtil.set(
					copyTo,
					...propPath,
					this._WALKER.walk(
						valExisting,
						{
							string: (str) => {
								return str
									.replace(re, (m0, m1) => `{@dc ${Number(m1) + modInfo.scalar}}`);
							},
						},
					),
				);
			}

			static _doMod_maxSize ({copyTo, copyFrom, modInfo, msgPtFailed}) {
				const sizes = [...copyTo.size].sort(SortUtil.ascSortSize);

				const ixsCur = sizes.map(it => Parser.SIZE_ABVS.indexOf(it));
				const ixMax = Parser.SIZE_ABVS.indexOf(modInfo.max);

				if (!~ixMax || ixsCur.some(ix => !~ix)) throw new Error(`${msgPtFailed} Unhandled size!`);

				const ixsNxt = ixsCur.filter(ix => ix <= ixMax);
				if (!ixsNxt.length) ixsNxt.push(ixMax);

				copyTo.size = ixsNxt.map(ix => Parser.SIZE_ABVS[ix]);
			}

			static _doMod_scalarMultXp ({copyTo, copyFrom, modInfo, msgPtFailed}) {
				const getOutput = (input) => {
					let out = input * modInfo.scalar;
					if (modInfo.floor) out = Math.floor(out);
					return out;
				};

				if (copyTo.cr.xp) copyTo.cr.xp = getOutput(copyTo.cr.xp);
				else {
					const curXp = Parser.crToXpNumber(copyTo.cr);
					if (!copyTo.cr.cr) copyTo.cr = {cr: copyTo.cr};
					copyTo.cr.xp = getOutput(curXp);
				}
			}

			static _doMod_setProp ({copyTo, copyFrom, modInfo, msgPtFailed, propPath}) {
				const propPathCombined = modInfo.prop ? modInfo.prop.split(".") : [];
				if (propPath != null && !CollectionUtil.deepEquals(propPath, ["*"])) propPathCombined.unshift(...propPath);
				MiscUtil.set(copyTo, ...propPathCombined, MiscUtil.copyFast(modInfo.value));
			}

			static _doMod_prefixSuffixStringProp ({copyTo, copyFrom, modInfo, msgPtFailed, propPath}) {
				const propPathCombined = modInfo.prop ? modInfo.prop.split(".") : [];
				if (propPath != null && !CollectionUtil.deepEquals(propPath, ["*"])) propPathCombined.unshift(...propPath);
				const str = MiscUtil.get(copyTo, ...propPathCombined);
				if (str == null || !(typeof str === "string")) return;
				MiscUtil.set(copyTo, ...propPathCombined, `${modInfo.prefix || ""}${str}${modInfo.suffix || ""}`);
			}

			static _doMod_handleProp ({copyTo, copyFrom, modInfos, msgPtFailed, prop = null}) {
				const propPath = prop ? prop.split(".") : null;

				modInfos.forEach(modInfo => {
					if (typeof modInfo === "string") {
						switch (modInfo) {
							case "remove": return delete copyTo[prop];
							default: throw new Error(`${msgPtFailed} Unhandled mode: ${modInfo}`);
						}
					}

					switch (modInfo.mode) {
						case "appendStr": return this._doMod_appendStr({copyTo, copyFrom, modInfo, msgPtFailed, propPath});
						case "replaceName": return this._doMod_replaceName({copyTo, copyFrom, modInfo, msgPtFailed, propPath});
						case "replaceTxt": return this._doMod_replaceTxt({copyTo, copyFrom, modInfo, msgPtFailed, propPath});
						case "prependArr": return this._doMod_prependArr({copyTo, copyFrom, modInfo, msgPtFailed, propPath});
						case "appendArr": return this._doMod_appendArr({copyTo, copyFrom, modInfo, msgPtFailed, propPath});
						case "replaceArr": return this._doMod_replaceArr({copyTo, copyFrom, modInfo, msgPtFailed, propPath});
						case "replaceOrAppendArr": return this._doMod_replaceOrAppendArr({copyTo, copyFrom, modInfo, msgPtFailed, propPath});
						case "appendIfNotExistsArr": return this._doMod_appendIfNotExistsArr({copyTo, copyFrom, modInfo, msgPtFailed, propPath});
						case "insertArr": return this._doMod_insertArr({copyTo, copyFrom, modInfo, msgPtFailed, propPath});
						case "removeArr": return this._doMod_removeArr({copyTo, copyFrom, modInfo, msgPtFailed, propPath});
						case "renameArr": return this._doMod_renameArr({copyTo, copyFrom, modInfo, msgPtFailed, propPath});
						case "calculateProp": return this._doMod_calculateProp({copyTo, copyFrom, modInfo, msgPtFailed, propPath});
						case "scalarAddProp": return this._doMod_scalarAddProp({copyTo, copyFrom, modInfo, msgPtFailed, propPath});
						case "scalarMultProp": return this._doMod_scalarMultProp({copyTo, copyFrom, modInfo, msgPtFailed, propPath});
						case "setProp": return this._doMod_setProp({copyTo, copyFrom, modInfo, msgPtFailed, propPath});
						case "prefixSuffixStringProp": return this._doMod_prefixSuffixStringProp({copyTo, copyFrom, modInfo, msgPtFailed, propPath});
						// region Bestiary specific
						case "addSenses": return this._doMod_addSenses({copyTo, copyFrom, modInfo, msgPtFailed});
						case "addSaves": return this._doMod_addSaves({copyTo, copyFrom, modInfo, msgPtFailed});
						case "addSkills": return this._doMod_addSkills({copyTo, copyFrom, modInfo, msgPtFailed});
						case "addAllSaves": return this._doMod_addAllSaves({copyTo, copyFrom, modInfo, msgPtFailed});
						case "addAllSkills": return this._doMod_addAllSkills({copyTo, copyFrom, modInfo, msgPtFailed});
						case "addSpells": return this._doMod_addSpells({copyTo, copyFrom, modInfo, msgPtFailed});
						case "replaceSpells": return this._doMod_replaceSpells({copyTo, copyFrom, modInfo, msgPtFailed});
						case "removeSpells": return this._doMod_removeSpells({copyTo, copyFrom, modInfo, msgPtFailed});
						case "maxSize": return this._doMod_maxSize({copyTo, copyFrom, modInfo, msgPtFailed});
						case "scalarMultXp": return this._doMod_scalarMultXp({copyTo, copyFrom, modInfo, msgPtFailed});
						case "scalarAddHit": return this._doMod_scalarAddHit({copyTo, copyFrom, modInfo, msgPtFailed, propPath});
						case "scalarAddDc": return this._doMod_scalarAddDc({copyTo, copyFrom, modInfo, msgPtFailed, propPath});
						// endregion
						default: throw new Error(`${msgPtFailed} Unhandled mode: ${modInfo.mode}`);
					}
				});
			}

			/**
			 * @param copyTo
			 * @param copyFrom
			 * @param modInfos
			 * @param msgPtFailed
			 * @param {?array} props
			 * @param isExternalApplicationIdentityOnly
			 * @private
			 */
			static _doMod ({copyTo, copyFrom, modInfos, msgPtFailed, props = null, isExternalApplicationIdentityOnly}) {
				if (isExternalApplicationIdentityOnly) return;

				if (props?.length) props.forEach(prop => this._doMod_handleProp({copyTo, copyFrom, modInfos, msgPtFailed, prop}));
				// special case for "no property" modifications, i.e. underscore-key'd
				else this._doMod_handleProp({copyTo, copyFrom, modInfos, msgPtFailed});
			}

			static getCopy (impl, copyFrom, copyTo, templateData, {isExternalApplicationKeepCopy = false, isExternalApplicationIdentityOnly = false} = {}) {
				this._WALKER ||= MiscUtil.getWalker();

				if (isExternalApplicationKeepCopy) copyTo.__copy = MiscUtil.copyFast(copyFrom);

				const msgPtFailed = `Failed to apply _copy to "${copyTo.name}" ("${copyTo.source}").`;

				const copyMeta = copyTo._copy || {};

				if (copyMeta._mod) this._normaliseMods(copyMeta);

				// fetch and apply any external template -- append them to existing copy mods where available
				let templates = null;
				let templateErrors = [];
				if (copyMeta._templates?.length) {
					templates = copyMeta._templates
						.map(({name: templateName, source: templateSource}) => {
							templateName = templateName.toLowerCase().trim();
							templateSource = templateSource.toLowerCase().trim();

							// TODO(Template) allow templates for other entity types
							const template = templateData.monsterTemplate
								.find(({name, source}) => name.toLowerCase().trim() === templateName && source.toLowerCase().trim() === templateSource);

							if (!template) {
								templateErrors.push(`Could not find traits to apply with name "${templateName}" and source "${templateSource}"`);
								return null;
							}

							return MiscUtil.copyFast(template);
						})
						.filter(Boolean);

					templates
						.forEach(template => {
							if (!template.apply._mod) return;

							this._normaliseMods(template.apply);

							if (!copyMeta._mod) {
								copyMeta._mod = template.apply._mod;
								return;
							}

							Object.entries(template.apply._mod)
								.forEach(([k, v]) => {
									if (copyMeta._mod[k]) copyMeta._mod[k] = copyMeta._mod[k].concat(v);
									else copyMeta._mod[k] = v;
								});
						});

					copyTo._copy_templates = copyMeta._templates.map(({name, source}) => ({name, source}));

					delete copyMeta._templates;
				}

				if (templateErrors.length) throw new Error(`${msgPtFailed} ${templateErrors.join("; ")}`);

				const copyToRootProps = new Set(Object.keys(copyTo));

				// copy over required values
				Object.keys(copyFrom).forEach(k => {
					if (copyTo[k] === null) return delete copyTo[k];
					if (copyTo[k] == null) {
						if (DataUtil.generic._MERGE_REQUIRES_PRESERVE_BASE[k] || impl?._MERGE_REQUIRES_PRESERVE[k]) {
							if (copyTo._copy._preserve?.["*"] || copyTo._copy._preserve?.[k]) copyTo[k] = copyFrom[k];
						} else copyTo[k] = copyFrom[k];
					}
				});

				// apply any root template properties after doing base copy
				if (templates?.length) {
					templates
						.forEach(template => {
							if (!template.apply?._root) return;

							Object.entries(template.apply._root)
								.filter(([k, v]) => !copyToRootProps.has(k)) // avoid overwriting any real root properties
								.forEach(([k, v]) => copyTo[k] = v);
						});
				}

				// apply mods
				if (copyMeta._mod) {
					// pre-convert any dynamic text
					Object.entries(copyMeta._mod).forEach(([k, v]) => {
						copyMeta._mod[k] = DataUtil.generic.variableResolver.resolve({obj: v, ent: copyTo});
					});

					Object.entries(copyMeta._mod).forEach(([prop, modInfos]) => {
						if (prop === "*") this._doMod({copyTo, copyFrom, modInfos, props: DataUtil.generic.COPY_ENTRY_PROPS, msgPtFailed, isExternalApplicationIdentityOnly});
						else if (prop === "_") this._doMod({copyTo, copyFrom, modInfos, msgPtFailed, isExternalApplicationIdentityOnly});
						else this._doMod({copyTo, copyFrom, modInfos, props: [prop], msgPtFailed, isExternalApplicationIdentityOnly});
					});
				}

				// add filter tag
				copyTo._isCopy = true;

				// cleanup
				delete copyTo._copy;
			}
		},

		variableResolver: class {
			/** @abstract */
			static _ResolverBase = class {
				mode;

				getResolved ({ent, msgPtFailed, detail}) {
					this._doVerifyInput({ent, msgPtFailed, detail});
					return this._getResolved({ent, detail});
				}

				_doVerifyInput ({msgPtFailed, detail}) { /* Implement as required */ }

				/**
				 * @abstract
				 * @return {string}
				 */
				_getResolved ({ent, mode, detail}) { throw new Error("Unimplemented!"); }

				getDisplayText ({msgPtFailed, detail}) {
					this._doVerifyInput({msgPtFailed, detail});
					return this._getDisplayText({detail});
				}

				/**
				 * @abstract
				 * @return {string}
				 */
				_getDisplayText ({detail}) { throw new Error("Unimplemented!"); }

				/* -------------------------------------------- */

				_getSize ({ent}) { return ent.size?.[0] || Parser.SZ_MEDIUM; }

				_SIZE_TO_MULT = {
					[Parser.SZ_LARGE]: 2,
					[Parser.SZ_HUGE]: 3,
					[Parser.SZ_GARGANTUAN]: 4,
				};

				_getSizeMult (size) { return this._SIZE_TO_MULT[size] ?? 1; }
			};

			static _ResolverName = class extends this._ResolverBase {
				mode = "name";
				_getResolved ({ent, detail}) { return ent.name; }
				_getDisplayText ({detail}) { return "(name)"; }
			};

			static _ResolverShortName = class extends this._ResolverBase {
				mode = "short_name";
				_getResolved ({ent, detail}) { return Renderer.monster.getShortName(ent); }
				_getDisplayText ({detail}) { return "(short name)"; }
			};

			static _ResolverTitleShortName = class extends this._ResolverBase {
				mode = "title_short_name";
				_getResolved ({ent, detail}) { return Renderer.monster.getShortName(ent, {isTitleCase: true}); }
				_getDisplayText ({detail}) { return "(short title name)"; }
			};

			/** @abstract */
			static _ResolverAbilityScore = class extends this._ResolverBase {
				_doVerifyInput ({msgPtFailed, detail}) {
					if (!Parser.ABIL_ABVS.includes(detail)) throw new Error(`${msgPtFailed ? `${msgPtFailed} ` : ""} Unknown ability score "${detail}"`);
				}
			};

			static _ResolverDc = class extends this._ResolverAbilityScore {
				mode = "dc";
				_getResolved ({ent, detail}) { return 8 + Parser.getAbilityModNumber(Number(ent[detail])) + Parser.crToPb(ent.cr); }
				_getDisplayText ({detail}) { return `(${detail.toUpperCase()} DC)`; }
			};

			static _ResolverSpellDc = class extends this._ResolverDc {
				mode = "spell_dc";
				_getDisplayText ({detail}) { return `(${detail.toUpperCase()} spellcasting DC)`; }
			};

			static _ResolverToHit = class extends this._ResolverAbilityScore {
				mode = "to_hit";

				_getResolved ({ent, detail}) {
					const total = Parser.crToPb(ent.cr) + Parser.getAbilityModNumber(Number(ent[detail]));
					return total >= 0 ? `+${total}` : total;
				}

				_getDisplayText ({detail}) { return `(${detail.toUpperCase()} to-hit)`; }
			};

			static _ResolverDamageMod = class extends this._ResolverAbilityScore {
				mode = "damage_mod";

				_getResolved ({ent, detail}) {
					const total = Parser.getAbilityModNumber(Number(ent[detail]));
					return total === 0 ? "" : total > 0 ? ` + ${total}` : ` - ${Math.abs(total)}`;
				}

				_getDisplayText ({detail}) { return `(${detail.toUpperCase()} damage modifier)`; }
			};

			static _ResolverDamageAvg = class extends this._ResolverBase {
				mode = "damage_avg";

				_getResolved ({ent, detail}) {
					const replaced = detail
						.replace(/\b(?<abil>str|dex|con|int|wis|cha)\b/gi, (...m) => Parser.getAbilityModNumber(Number(ent[m.last().abil])))
						.replace(/\bsize_mult\b/g, () => this._getSizeMult(this._getSize({ent})));

					// eslint-disable-next-line no-eval
					return Math.floor(eval(DataUtil.generic.variableResolver.getCleanMathExpression(replaced)));
				}

				_getDisplayText ({detail}) { return "(damage average)"; } // TODO(Future) more specific
			};

			static _ResolverSizeMult = class extends this._ResolverBase {
				mode = "size_mult";

				_getResolved ({ent, detail}) {
					const mult = this._getSizeMult(this._getSize({ent}));

					if (!detail) return mult;

					// eslint-disable-next-line no-eval
					return Math.floor(eval(`${mult} * ${DataUtil.generic.variableResolver.getCleanMathExpression(detail)}`));
				}

				_getDisplayText ({detail}) { return "(size multiplier)"; } // TODO(Future) more specific
			};

			static _RESOLVERS = [
				new this._ResolverName(),
				new this._ResolverShortName(),
				new this._ResolverTitleShortName(),
				new this._ResolverDc(),
				new this._ResolverSpellDc(),
				new this._ResolverToHit(),
				new this._ResolverDamageMod(),
				new this._ResolverDamageAvg(),
				new this._ResolverSizeMult(),
			];

			static _MODE_LOOKUP = (() => {
				return Object.fromEntries(
					this._RESOLVERS.map(resolver => [resolver.mode, resolver]),
				);
			})();

			static _WALKER = null;
			static resolve ({obj, ent, msgPtFailed = null}) {
				DataUtil.generic.variableResolver._WALKER ||= MiscUtil.getWalker();

				return DataUtil.generic.variableResolver._WALKER
					.walk(
						obj,
						{
							string: str => str.replace(/<\$(?<variable>[^$]+)\$>/g, (...m) => {
								const [mode, detail] = m.last().variable.split("__");

								const resolver = this._MODE_LOOKUP[mode];
								if (!resolver) return m[0];

								return resolver.getResolved({ent, msgPtFailed, detail});
							}),
						},
					);
			}

			static getHumanReadable ({obj, msgPtFailed}) {
				DataUtil.generic.variableResolver._WALKER ||= MiscUtil.getWalker();

				return DataUtil.generic.variableResolver._WALKER
					.walk(
						obj,
						{
							string: str => this.getHumanReadableString(str, {msgPtFailed}),
						},
					);
			}

			static getHumanReadableString (str, {msgPtFailed = null} = {}) {
				return str.replace(/<\$(?<variable>[^$]+)\$>/g, (...m) => {
					const [mode, detail] = m.last().variable.split("__");

					const resolver = this._MODE_LOOKUP[mode];
					if (!resolver) return m[0];

					return resolver.getDisplayText({msgPtFailed, detail});
				});
			}

			static getCleanMathExpression (str) { return str.replace(/[^-+/*0-9.,]+/g, ""); }
		},

		getVersions (parent, {impl = null, isExternalApplicationIdentityOnly = false} = {}) {
			if (!parent?._versions?.length) return [];

			return parent._versions
				.map(ver => {
					if (ver._abstract && ver._implementations?.length) return DataUtil.generic._getVersions_template({ver});
					return DataUtil.generic._getVersions_basic({ver});
				})
				.flat()
				.map(ver => DataUtil.generic._getVersion({parentEntity: parent, version: ver, impl, isExternalApplicationIdentityOnly}))
				.filter(ver => {
					if (!UrlUtil.URL_TO_HASH_BUILDER[ver.__prop]) throw new Error(`Unhandled version prop "${ver.__prop}"!`);
					return !ExcludeUtil.isExcluded(
						UrlUtil.URL_TO_HASH_BUILDER[ver.__prop](ver),
						ver.__prop,
						SourceUtil.getEntitySource(ver),
						{isNoCount: true},
					);
				});
		},

		_getVersions_template ({ver}) {
			return ver._implementations
				.map(impl => {
					let cpyTemplate = MiscUtil.copyFast(ver._abstract);
					const cpyImpl = MiscUtil.copyFast(impl);

					DataUtil.generic._getVersions_mutExpandCopy({ent: cpyTemplate});

					if (cpyImpl._variables) {
						cpyTemplate = MiscUtil.getWalker()
							.walk(
								cpyTemplate,
								{
									string: str => str.replace(/{{([^}]+)}}/g, (...m) => cpyImpl._variables[m[1]]),
								},
							);
						delete cpyImpl._variables;
					}

					Object.assign(cpyTemplate, cpyImpl);

					return cpyTemplate;
				});
		},

		_getVersions_basic ({ver}) {
			const cpyVer = MiscUtil.copyFast(ver);
			DataUtil.generic._getVersions_mutExpandCopy({ent: cpyVer});
			return cpyVer;
		},

		_getVersions_mutExpandCopy ({ent}) {
			// Tweak the data structure to match what `_applyCopy` expects
			ent._copy = {
				_mod: ent._mod,
				_preserve: ent._preserve || {"*": true},
			};
			delete ent._mod;
			delete ent._preserve;
		},

		_getVersion ({parentEntity, version, impl = null, isExternalApplicationIdentityOnly}) {
			const additionalData = {
				_versionBase_isVersion: true,
				_versionBase_name: parentEntity.name,
				_versionBase_source: parentEntity.source,
				_versionBase_hasToken: parentEntity.hasToken,
				_versionBase_hasFluff: parentEntity.hasFluff,
				_versionBase_hasFluffImages: parentEntity.hasFluffImages,
				__prop: parentEntity.__prop,
			};
			const cpyParentEntity = MiscUtil.copyFast(parentEntity);

			delete cpyParentEntity._versions;
			delete cpyParentEntity.hasToken;
			delete cpyParentEntity.hasFluff;
			delete cpyParentEntity.hasFluffImages;

			["additionalSources", "otherSources"]
				.forEach(prop => {
					if (cpyParentEntity[prop]?.length) cpyParentEntity[prop] = cpyParentEntity[prop].filter(srcMeta => srcMeta.source !== version.source);
					if (!cpyParentEntity[prop]?.length) delete cpyParentEntity[prop];
				});

			DataUtil.generic.copyApplier.getCopy(
				impl,
				cpyParentEntity,
				version,
				null,
				{isExternalApplicationIdentityOnly},
			);
			Object.assign(version, additionalData);
			return version;
		},
	},

	proxy: class {
		static getVersions (prop, ent, {isExternalApplicationIdentityOnly = false} = {}) {
			if (DataUtil[prop]?.getVersions) return DataUtil[prop]?.getVersions(ent, {isExternalApplicationIdentityOnly});
			return DataUtil.generic.getVersions(ent, {isExternalApplicationIdentityOnly});
		}

		/**
		 * @param prop
		 * @param uid
		 * @param tag
		 * @param [opts]
		 * @param [opts.isLower]
		 */
		static unpackUid (prop, uid, tag, opts) {
			if (DataUtil[prop]?.unpackUid) return DataUtil[prop]?.unpackUid(uid, tag, opts);
			return DataUtil.generic.unpackUid(uid, tag, opts);
		}

		static getNormalizedUid (prop, uid, tag, opts) {
			const unpacked = DataUtil.proxy.unpackUid(prop, uid, tag, opts);
			return DataUtil.proxy.getUid(prop, unpacked, opts);
		}

		/**
		 * @param prop
		 * @param ent
		 * @param [opts]
		 * @param [opts.isMaintainCase]
		 * @param [opts.displayName]
		 */
		static getUid (prop, ent, opts) {
			if (DataUtil[prop]?.getUid) return DataUtil[prop].getUid(ent, opts);
			return DataUtil.generic.getUid(ent, opts);
		}
	},

	monster: class extends _DataUtilPropConfigMultiSource {
		static _MERGE_REQUIRES_PRESERVE = {
			legendaryGroup: true,
			environment: true,
			soundClip: true,
			altArt: true,
			variant: true,
			dragonCastingColor: true,
			familiar: true,
		};

		static _PAGE = UrlUtil.PG_BESTIARY;

		static _DIR = "bestiary";
		static _PROP = "monster";

		static async loadJSON () {
			await DataUtil.monster.pPreloadLegendaryGroups();
			return super.loadJSON();
		}

		static getVersions (mon, {isExternalApplicationIdentityOnly = false} = {}) {
			const additionalVersionData = DataUtil.monster._getAdditionalVersionsData(mon);
			if (additionalVersionData.length) {
				mon = MiscUtil.copyFast(mon);
				(mon._versions = mon._versions || []).push(...additionalVersionData);
			}
			return DataUtil.generic.getVersions(mon, {impl: DataUtil.monster, isExternalApplicationIdentityOnly});
		}

		static _getAdditionalVersionsData (mon) {
			if (!mon.variant?.length) return [];

			return mon.variant
				.filter(it => it._version)
				.map(it => {
					const toAdd = {
						name: it._version.name || it.name,
						source: it._version.source || it.source || mon.source,
						variant: null,
					};

					if (it._version.addAs) {
						const cpy = MiscUtil.copyFast(it);
						delete cpy._version;
						delete cpy.type;
						delete cpy.source;
						delete cpy.page;

						toAdd._mod = {
							[it._version.addAs]: {
								mode: "appendArr",
								items: cpy,
							},
						};

						return toAdd;
					}

					if (it._version.addHeadersAs) {
						const cpy = MiscUtil.copyFast(it);
						cpy.entries = cpy.entries.filter(it => it.name && it.entries);
						cpy.entries.forEach(cpyEnt => {
							delete cpyEnt.type;
							delete cpyEnt.source;
						});

						toAdd._mod = {
							[it._version.addHeadersAs]: {
								mode: "appendArr",
								items: cpy.entries,
							},
						};

						return toAdd;
					}
				})
				.filter(Boolean);
		}

		static _pLoadLegendaryGroups = null;
		static async pPreloadLegendaryGroups () {
			return (
				DataUtil.monster._pLoadLegendaryGroups ||= ((async () => {
					const legendaryGroups = await DataUtil.legendaryGroup.pLoadAll();
					DataUtil.monster.populateMetaReference({legendaryGroup: legendaryGroups});
				})())
			);
		}

		static legendaryGroupLookup = {};
		static getLegendaryGroup (mon) {
			if (!mon.legendaryGroup || !mon.legendaryGroup.source || !mon.legendaryGroup.name) return null;
			return DataUtil.monster.legendaryGroupLookup[mon.legendaryGroup.source]?.[mon.legendaryGroup.name];
		}
		static populateMetaReference (data) {
			(data.legendaryGroup || []).forEach(it => {
				(DataUtil.monster.legendaryGroupLookup[it.source] ||= {})[it.name] = it;
			});
		}
	},

	monsterFluff: class extends _DataUtilPropConfigMultiSource {
		static _PAGE = UrlUtil.PG_BESTIARY;
		static _DIR = "bestiary";
		static _PROP = "monsterFluff";
	},

	monsterTemplate: class extends _DataUtilPropConfigSingleSource {
		static _PAGE = "monsterTemplate";
		static _FILENAME = "bestiary/template.json";
	},

	spell: class extends _DataUtilPropConfigMultiSource {
		static _PAGE = UrlUtil.PG_SPELLS;
		static _DIR = "spells";
		static _PROP = "spell";
		static _IS_MUT_ENTITIES = true;

		static _SPELL_SOURCE_LOOKUP = null;

		static PROPS_SPELL_SOURCE = [
			"classes",
			"races",
			"optionalfeatures",
			"backgrounds",
			"feats",
			"charoptions",
			"rewards",
		];

		// region Utilities for external applications (i.e., the spell source generation script) to use
		static setSpellSourceLookup (lookup, {isExternalApplication = false} = {}) {
			if (!isExternalApplication) throw new Error("Should not be calling this!");
			this._SPELL_SOURCE_LOOKUP = MiscUtil.copyFast(lookup);
		}

		static mutEntity (sp, {isExternalApplication = false} = {}) {
			if (!isExternalApplication) throw new Error("Should not be calling this!");
			return this._mutEntity(sp);
		}

		static unmutEntity (sp, {isExternalApplication = false} = {}) {
			if (!isExternalApplication) throw new Error("Should not be calling this!");
			this.PROPS_SPELL_SOURCE.forEach(prop => delete sp[prop]);
			delete sp._isMutEntity;
		}
		// endregion

		// region Special mutator for the homebrew builder
		static mutEntityBrewBuilder (sp, sourcesLookup) {
			const out = this._mutEntity(sp, {sourcesLookup});
			delete sp._isMutEntity;
			return out;
		}
		// endregion

		static async _pInitPreData_ () {
			this._SPELL_SOURCE_LOOKUP = await DataUtil.loadRawJSON(`${Renderer.get().baseUrl}data/generated/gendata-spell-source-lookup.json`);
		}

		static _mutEntity (sp, {sourcesLookup = null} = {}) {
			if (sp._isMutEntity) return sp;

			const spSources = (sourcesLookup ?? this._SPELL_SOURCE_LOOKUP)[sp.source.toLowerCase()]?.[sp.name.toLowerCase()];
			if (!spSources) return sp;

			this._mutSpell_class({sp, spSources, propSources: "class", propClasses: "fromClassList"});
			this._mutSpell_class({sp, spSources, propSources: "classVariant", propClasses: "fromClassListVariant"});
			this._mutSpell_subclass({sp, spSources});
			this._mutSpell_race({sp, spSources});
			this._mutSpell_optionalfeature({sp, spSources});
			this._mutSpell_background({sp, spSources});
			this._mutSpell_feat({sp, spSources});
			this._mutSpell_charoption({sp, spSources});
			this._mutSpell_reward({sp, spSources});

			sp._isMutEntity = true;

			return sp;
		}

		static _mutSpell_class ({sp, spSources, propSources, propClasses}) {
			if (!spSources[propSources]) return;

			Object.entries(spSources[propSources])
				.forEach(([source, nameTo]) => {
					const tgt = MiscUtil.getOrSet(sp, "classes", propClasses, []);

					Object.entries(nameTo)
						.forEach(([name, val]) => {
							if (tgt.some(it => it.name === nameTo && it.source === source)) return;

							const toAdd = {name, source};
							if (val === true) return tgt.push(toAdd);

							if (val.definedInSource) {
								toAdd.definedInSource = val.definedInSource;
								tgt.push(toAdd);
								return;
							}

							if (val.definedInSources) {
								val.definedInSources
									.forEach(definedInSource => {
										const cpyToAdd = MiscUtil.copyFast(toAdd);

										if (definedInSource == null) {
											return tgt.push(cpyToAdd);
										}

										cpyToAdd.definedInSource = definedInSource;
										tgt.push(cpyToAdd);
									});

								return;
							}

							throw new Error("Unimplemented!");
						});
				});
		}

		static _mutSpell_subclass ({sp, spSources}) {
			if (!spSources.subclass) return;

			Object.entries(spSources.subclass)
				.forEach(([classSource, classNameTo]) => {
					Object.entries(classNameTo)
						.forEach(([className, sourceTo]) => {
							Object.entries(sourceTo)
								.forEach(([source, nameTo]) => {
									const tgt = MiscUtil.getOrSet(sp, "classes", "fromSubclass", []);

									Object.entries(nameTo)
										.forEach(([name, val]) => {
											if (val === true) throw new Error("Unimplemented!");

											if (tgt.some(it => it.class.name === className && it.class.source === classSource && it.subclass.name === name && it.subclass.source === source && ((it.subclass.subSubclass == null && val.subSubclasses == null) || val.subSubclasses.includes(it.subclass.subSubclass)))) return;

											const toAdd = {
												class: {
													name: className,
													source: classSource,
												},
												subclass: {
													name: val.name,
													shortName: name,
													source,
												},
											};

											if (!val.subSubclasses?.length) return tgt.push(toAdd);

											val.subSubclasses
												.forEach(subSubclass => {
													const cpyToAdd = MiscUtil.copyFast(toAdd);
													cpyToAdd.subclass.subSubclass = subSubclass;
													tgt.push(cpyToAdd);
												});
										});
								});
						});
				});
		}

		static _mutSpell_race ({sp, spSources}) {
			this._mutSpell_generic({sp, spSources, propSources: "race", propSpell: "races"});
		}

		static _mutSpell_optionalfeature ({sp, spSources}) {
			this._mutSpell_generic({sp, spSources, propSources: "optionalfeature", propSpell: "optionalfeatures"});
		}

		static _mutSpell_background ({sp, spSources}) {
			this._mutSpell_generic({sp, spSources, propSources: "background", propSpell: "backgrounds"});
		}

		static _mutSpell_feat ({sp, spSources}) {
			this._mutSpell_generic({sp, spSources, propSources: "feat", propSpell: "feats"});
		}

		static _mutSpell_charoption ({sp, spSources}) {
			this._mutSpell_generic({sp, spSources, propSources: "charoption", propSpell: "charoptions"});
		}

		static _mutSpell_reward ({sp, spSources}) {
			this._mutSpell_generic({sp, spSources, propSources: "reward", propSpell: "rewards"});
		}

		static _mutSpell_generic ({sp, spSources, propSources, propSpell}) {
			if (!spSources[propSources]) return;

			Object.entries(spSources[propSources])
				.forEach(([source, nameTo]) => {
					const tgt = MiscUtil.getOrSet(sp, propSpell, []);

					Object.entries(nameTo)
						.forEach(([name, val]) => {
							if (tgt.some(it => it.name === nameTo && it.source === source)) return;

							const toAdd = {name, source};
							if (val === true) return tgt.push(toAdd);

							Object.assign(toAdd, {...val});
							tgt.push(toAdd);
						});
				});
		}
	},

	spellFluff: class extends _DataUtilPropConfigMultiSource {
		static _PAGE = UrlUtil.PG_SPELLS;
		static _DIR = "spells";
		static _PROP = "spellFluff";
	},

	background: class extends _DataUtilPropConfigSingleSource {
		static _PAGE = UrlUtil.PG_BACKGROUNDS;
		static _FILENAME = "backgrounds.json";
	},

	backgroundFluff: class extends _DataUtilPropConfigSingleSource {
		static _PAGE = UrlUtil.PG_BACKGROUNDS;
		static _FILENAME = "fluff-backgrounds.json";
	},

	charoption: class extends _DataUtilPropConfigSingleSource {
		static _PAGE = UrlUtil.PG_CHAR_CREATION_OPTIONS;
		static _FILENAME = "charcreationoptions.json";
	},

	charoptionFluff: class extends _DataUtilPropConfigSingleSource {
		static _PAGE = UrlUtil.PG_CHAR_CREATION_OPTIONS;
		static _FILENAME = "fluff-charcreationoptions.json";
	},

	condition: class extends _DataUtilPropConfigSingleSource {
		static _PAGE = UrlUtil.PG_CONDITIONS_DISEASES;
		static _FILENAME = "conditionsdiseases.json";
	},

	conditionFluff: class extends _DataUtilPropConfigSingleSource {
		static _PAGE = UrlUtil.PG_CONDITIONS_DISEASES;
		static _FILENAME = "fluff-conditionsdiseases.json";
	},

	disease: class extends _DataUtilPropConfigSingleSource {
		static _PAGE = UrlUtil.PG_CONDITIONS_DISEASES;
		static _FILENAME = "conditionsdiseases.json";
	},

	feat: class extends _DataUtilPropConfigSingleSource {
		static _PAGE = UrlUtil.PG_FEATS;
		static _FILENAME = "feats.json";
	},

	featFluff: class extends _DataUtilPropConfigSingleSource {
		static _PAGE = UrlUtil.PG_FEATS;
		static _FILENAME = "fluff-feats.json";
	},

	item: class extends _DataUtilPropConfigCustom {
		static _MERGE_REQUIRES_PRESERVE = {
			lootTables: true,
			tier: true,
		};
		static _PAGE = UrlUtil.PG_ITEMS;

		static async loadRawJSON () {
			if (DataUtil.item._loadedRawJson) return DataUtil.item._loadedRawJson;

			DataUtil.item._pLoadingRawJson = (async () => {
				const urlItems = `${Renderer.get().baseUrl}data/items.json`;
				const urlItemsBase = `${Renderer.get().baseUrl}data/items-base.json`;
				const urlVariants = `${Renderer.get().baseUrl}data/magicvariants.json`;

				const [dataItems, dataItemsBase, dataVariants] = await Promise.all([
					DataUtil.loadJSON(urlItems),
					DataUtil.loadJSON(urlItemsBase),
					DataUtil.loadJSON(urlVariants),
				]);

				DataUtil.item._loadedRawJson = {
					item: MiscUtil.copyFast(dataItems.item),
					itemGroup: MiscUtil.copyFast(dataItems.itemGroup),
					magicvariant: MiscUtil.copyFast(dataVariants.magicvariant),
					baseitem: MiscUtil.copyFast(dataItemsBase.baseitem),
				};
			})();
			await DataUtil.item._pLoadingRawJson;

			return DataUtil.item._loadedRawJson;
		}

		static async loadJSON () {
			return {item: await Renderer.item.pBuildList()};
		}

		static async loadPrerelease () {
			return {item: await Renderer.item.pGetItemsFromPrerelease()};
		}

		static async loadBrew () {
			return {item: await Renderer.item.pGetItemsFromBrew()};
		}
	},

	itemGroup: class extends _DataUtilPropConfig {
		static _MERGE_REQUIRES_PRESERVE = {
			lootTables: true,
			tier: true,
		};
		static _PAGE = UrlUtil.PG_ITEMS;

		static async pMergeCopy (...args) { return DataUtil.item.pMergeCopy(...args); }
		static async loadRawJSON (...args) { return DataUtil.item.loadRawJSON(...args); }
	},

	baseitem: class extends _DataUtilPropConfig {
		static _PAGE = UrlUtil.PG_ITEMS;

		static async pMergeCopy (...args) { return DataUtil.item.pMergeCopy(...args); }
		static async loadRawJSON (...args) { return DataUtil.item.loadRawJSON(...args); }
	},

	magicvariant: class extends _DataUtilPropConfig {
		static _MERGE_REQUIRES_PRESERVE = {
			lootTables: true,
			tier: true,
		};
		static _PAGE = "magicvariant";

		static async loadRawJSON (...args) { return DataUtil.item.loadRawJSON(...args); }
	},

	itemFluff: class extends _DataUtilPropConfigSingleSource {
		static _PAGE = UrlUtil.PG_ITEMS;
		static _FILENAME = "fluff-items.json";
	},

	itemType: class extends _DataUtilPropConfig {
		static _PAGE = "itemType";

		/**
		 * @param uid
		 * @param [opts]
		 * @param [opts.isLower] If the returned values should be lowercase.
		 */
		static unpackUid (uid, opts) {
			opts = opts || {};
			if (opts.isLower) uid = uid.toLowerCase();
			let [abbreviation, source] = uid.split("|").map(it => it.trim());
			source ||= opts.isLower ? Parser.SRC_PHB.toLowerCase() : Parser.SRC_PHB;
			return {
				abbreviation,
				source,
			};
		}

		static getUid (ent, {isMaintainCase = false, displayName = null, isRetainDefault = false} = {}) {
			// <abbreviation>|<source>
			const sourceDefault = Parser.SRC_PHB;
			const out = [
				ent.abbreviation,
				!isRetainDefault && (ent.source || "").toLowerCase() === sourceDefault.toLowerCase() ? "" : ent.source,
				displayName || "",
			].join("|").replace(/\|+$/, ""); // Trim trailing pipes
			if (isMaintainCase) return out;
			return out.toLowerCase();
		}
	},

	itemProperty: class extends _DataUtilPropConfig {
		static _PAGE = "itemProperty";

		/**
		 * @param uid
		 * @param [opts]
		 * @param [opts.isLower] If the returned values should be lowercase.
		 */
		static unpackUid (uid, opts) {
			opts = opts || {};
			if (opts.isLower) uid = uid.toLowerCase();
			let [abbreviation, source] = uid.split("|").map(it => it.trim());
			source ||= opts.isLower ? Parser.SRC_PHB.toLowerCase() : Parser.SRC_PHB;
			return {
				abbreviation,
				source,
			};
		}

		static getUid (ent, {isMaintainCase = false, displayName = null, isRetainDefault = false} = {}) {
			// <abbreviation>|<source>
			const sourceDefault = Parser.SRC_PHB;
			const out = [
				ent.abbreviation,
				!isRetainDefault && (ent.source || "").toLowerCase() === sourceDefault.toLowerCase() ? "" : ent.source,
				displayName || "",
			].join("|").replace(/\|+$/, ""); // Trim trailing pipes
			if (isMaintainCase) return out;
			return out.toLowerCase();
		}
	},

	language: class extends _DataUtilPropConfigSingleSource {
		static _PAGE = UrlUtil.PG_LANGUAGES;
		static _FILENAME = "languages.json";

		static async loadJSON () {
			const rawData = await super.loadJSON();

			// region Populate fonts, based on script
			const scriptLookup = {};
			(rawData.languageScript || []).forEach(script => MiscUtil.set(scriptLookup, script.source, script.name, script));

			const out = {language: MiscUtil.copyFast(rawData.language)};
			out.language.forEach(lang => {
				if (!lang.script || lang.fonts === false) return;

				const script = MiscUtil.get(scriptLookup, lang.source, lang.script);
				if (!script) return;

				lang._fonts = [...script.fonts];
			});
			// endregion

			return out;
		}
	},

	languageFluff: class extends _DataUtilPropConfigSingleSource {
		static _PAGE = UrlUtil.PG_LANGUAGES;
		static _FILENAME = "fluff-languages.json";
	},

	object: class extends _DataUtilPropConfigSingleSource {
		static _PAGE = UrlUtil.PG_OBJECTS;
		static _FILENAME = "objects.json";
	},

	objectFluff: class extends _DataUtilPropConfigSingleSource {
		static _PAGE = UrlUtil.PG_OBJECTS;
		static _FILENAME = "fluff-objects.json";
	},

	race: class extends _DataUtilPropConfigSingleSource {
		static _PAGE = UrlUtil.PG_RACES;
		static _FILENAME = "races.json";

		static _psLoadJson = {};

		static async loadJSON ({isAddBaseRaces = false} = {}) {
			const cacheKey = `site-${isAddBaseRaces}`;
			DataUtil.race._psLoadJson[cacheKey] ||= (async () => {
				return DataUtil.race.getPostProcessedSiteJson(
					await this.loadRawJSON(),
					{isAddBaseRaces},
				);
			})();
			return DataUtil.race._psLoadJson[cacheKey];
		}

		static getPostProcessedSiteJson (rawRaceData, {isAddBaseRaces = false} = {}) {
			rawRaceData = MiscUtil.copyFast(rawRaceData);
			(rawRaceData.subrace || []).forEach(sr => {
				const r = rawRaceData.race.find(it => it.name === sr.raceName && it.source === sr.raceSource);
				if (!r) return JqueryUtil.doToast({content: `Failed to find race "${sr.raceName}" (${sr.raceSource})`, type: "danger"});
				const cpySr = MiscUtil.copyFast(sr);
				delete cpySr.raceName;
				delete cpySr.raceSource;
				(r.subraces = r.subraces || []).push(sr);
			});
			delete rawRaceData.subrace;
			const raceData = Renderer.race.mergeSubraces(rawRaceData.race, {isAddBaseRaces});
			raceData.forEach(it => it.__prop = "race");
			return {race: raceData};
		}

		static async loadPrerelease ({isAddBaseRaces = true} = {}) {
			const cacheKey = `prerelease-${isAddBaseRaces}`;
			this._psLoadJson[cacheKey] ||= DataUtil.race._loadPrereleaseBrew({isAddBaseRaces, brewUtil: typeof PrereleaseUtil !== "undefined" ? PrereleaseUtil : null});
			return this._psLoadJson[cacheKey];
		}

		static async loadBrew ({isAddBaseRaces = true} = {}) {
			const cacheKey = `brew-${isAddBaseRaces}`;
			this._psLoadJson[cacheKey] ||= DataUtil.race._loadPrereleaseBrew({isAddBaseRaces, brewUtil: typeof BrewUtil2 !== "undefined" ? BrewUtil2 : null});
			return this._psLoadJson[cacheKey];
		}

		static async _loadPrereleaseBrew ({isAddBaseRaces = true, brewUtil} = {}) {
			if (!brewUtil) return {};

			const rawSite = await DataUtil.race.loadRawJSON();
			const brew = await brewUtil.pGetBrewProcessed();
			return DataUtil.race.getPostProcessedPrereleaseBrewJson(rawSite, brew, {isAddBaseRaces});
		}

		static getPostProcessedPrereleaseBrewJson (rawSite, brew, {isAddBaseRaces = false} = {}) {
			rawSite = MiscUtil.copyFast(rawSite);
			brew = MiscUtil.copyFast(brew);

			const rawSiteUsed = [];
			(brew.subrace || []).forEach(sr => {
				const rSite = rawSite.race.find(it => it.name === sr.raceName && it.source === sr.raceSource);
				const rBrew = (brew.race || []).find(it => it.name === sr.raceName && it.source === sr.raceSource);
				if (!rSite && !rBrew) return JqueryUtil.doToast({content: `Failed to find race "${sr.raceName}" (${sr.raceSource})`, type: "danger"});
				const rTgt = rSite || rBrew;
				const cpySr = MiscUtil.copyFast(sr);
				delete cpySr.raceName;
				delete cpySr.raceSource;
				(rTgt.subraces = rTgt.subraces || []).push(sr);
				if (rSite && !rawSiteUsed.includes(rSite)) rawSiteUsed.push(rSite);
			});
			delete brew.subrace;

			const raceDataBrew = Renderer.race.mergeSubraces(brew.race || [], {isAddBaseRaces});
			// Never add base races from site races when building brew race list
			const raceDataSite = Renderer.race.mergeSubraces(rawSiteUsed, {isAddBaseRaces: false});

			const out = [...raceDataBrew, ...raceDataSite];
			out.forEach(it => it.__prop = "race");
			return {race: out};
		}
	},

	subrace: class extends _DataUtilPropConfig {
		static _PAGE = "subrace";
	},

	raceFluff: class extends _DataUtilPropConfigSingleSource {
		static _PAGE = UrlUtil.PG_RACES;
		static _FILENAME = "fluff-races.json";

		static _getApplyUncommonMonstrous (data) {
			data = MiscUtil.copyFast(data);
			data.raceFluff
				.forEach(raceFluff => {
					if (raceFluff.uncommon) {
						raceFluff.entries = raceFluff.entries || [];
						raceFluff.entries.push(MiscUtil.copyFast(data.raceFluffMeta.uncommon));
						delete raceFluff.uncommon;
					}

					if (raceFluff.monstrous) {
						raceFluff.entries = raceFluff.entries || [];
						raceFluff.entries.push(MiscUtil.copyFast(data.raceFluffMeta.monstrous));
						delete raceFluff.monstrous;
					}
				});
			return data;
		}

		static async loadJSON () {
			const data = await super.loadJSON();
			return this._getApplyUncommonMonstrous(data);
		}

		static async loadUnmergedJSON () {
			const data = await super.loadUnmergedJSON();
			return this._getApplyUncommonMonstrous(data);
		}
	},

	raceFeature: class extends _DataUtilPropConfig {
		static _PAGE = "raceFeature";
	},

	recipe: class extends _DataUtilPropConfigSingleSource {
		static _PAGE = UrlUtil.PG_RECIPES;
		static _FILENAME = "recipes.json";

		static async loadJSON () {
			return DataUtil.recipe._pLoadJson = DataUtil.recipe._pLoadJson || (async () => {
				return {
					recipe: await DataLoader.pCacheAndGetAllSite("recipe"),
				};
			})();
		}

		static async loadPrerelease () {
			return {
				recipe: await DataLoader.pCacheAndGetAllPrerelease("recipe"),
			};
		}

		static async loadBrew () {
			return {
				recipe: await DataLoader.pCacheAndGetAllBrew("recipe"),
			};
		}
	},

	recipeFluff: class extends _DataUtilPropConfigSingleSource {
		static _PAGE = UrlUtil.PG_RECIPES;
		static _FILENAME = "fluff-recipes.json";
	},

	vehicle: class extends _DataUtilPropConfigSingleSource {
		static _PAGE = UrlUtil.PG_VEHICLES;
		static _FILENAME = "vehicles.json";
	},

	vehicleFluff: class extends _DataUtilPropConfigSingleSource {
		static _PAGE = UrlUtil.PG_VEHICLES;
		static _FILENAME = "fluff-vehicles.json";
	},

	optionalfeature: class extends _DataUtilPropConfigSingleSource {
		static _PAGE = UrlUtil.PG_OPT_FEATURES;
		static _FILENAME = "optionalfeatures.json";
	},

	optionalfeatureFluff: class extends _DataUtilPropConfigSingleSource {
		static _PAGE = UrlUtil.PG_OPT_FEATURES;
		static _FILENAME = "fluff-optionalfeatures.json";
	},

	class: class clazz extends _DataUtilPropConfigCustom {
		static _PAGE = UrlUtil.PG_CLASSES;

		static _pLoadJson = null;
		static _pLoadRawJson = null;

		static loadJSON () {
			return DataUtil.class._pLoadJson = DataUtil.class._pLoadJson || (async () => {
				return {
					class: await DataLoader.pCacheAndGetAllSite("class"),
					subclass: await DataLoader.pCacheAndGetAllSite("subclass"),
				};
			})();
		}

		static loadRawJSON () {
			return DataUtil.class._pLoadRawJson = DataUtil.class._pLoadRawJson || (async () => {
				const index = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/class/index.json`);
				const allData = await Promise.all(Object.values(index).map(it => DataUtil.loadJSON(`${Renderer.get().baseUrl}data/class/${it}`)));

				return {
					class: MiscUtil.copyFast(allData.map(it => it.class || []).flat()),
					subclass: MiscUtil.copyFast(allData.map(it => it.subclass || []).flat()),
					classFeature: allData.map(it => it.classFeature || []).flat(),
					subclassFeature: allData.map(it => it.subclassFeature || []).flat(),
				};
			})();
		}

		static async loadPrerelease () {
			return {
				class: await DataLoader.pCacheAndGetAllPrerelease("class"),
				subclass: await DataLoader.pCacheAndGetAllPrerelease("subclass"),
			};
		}

		static async loadBrew () {
			return {
				class: await DataLoader.pCacheAndGetAllBrew("class"),
				subclass: await DataLoader.pCacheAndGetAllBrew("subclass"),
			};
		}

		static packUidSubclass (ent, {isMaintainCase = false, displayName = null} = {}) {
			// <shortName>|<className>|<classSource>|<source>
			const sourceDefault = Parser.getTagSource("class");
			const out = [
				ent.shortName || ent.name,
				ent.className,
				(ent.classSource || "").toLowerCase() === sourceDefault.toLowerCase() ? "" : ent.classSource,
				(ent.source || "").toLowerCase() === sourceDefault.toLowerCase() ? "" : ent.source,
				displayName || "",
			].join("|").replace(/\|+$/, ""); // Trim trailing pipes
			if (isMaintainCase) return out;
			return out.toLowerCase();
		}

		/**
		 * @param uid
		 * @param [opts]
		 * @param [opts.isLower] If the returned values should be lowercase.
		 */
		static unpackUidSubclass (uid, opts) {
			opts = opts || {};
			if (opts.isLower) uid = uid.toLowerCase();
			let [shortName, className, classSource, source, displayText] = uid.split("|").map(it => it.trim());
			classSource = classSource || (opts.isLower ? Parser.SRC_PHB.toLowerCase() : Parser.SRC_PHB);
			source = source || (opts.isLower ? Parser.SRC_PHB.toLowerCase() : Parser.SRC_PHB);
			return {
				name: shortName, // (For display purposes only)
				shortName,
				className,
				classSource,
				source,
				displayText,
			};
		}

		/**
		 * @param uid
		 * @param [opts]
		 * @param [opts.isLower] If the returned values should be lowercase.
		 */
		static unpackUidClassFeature (uid, opts) {
			opts = opts || {};
			if (opts.isLower) uid = uid.toLowerCase();
			let [name, className, classSource, level, source, displayText] = uid.split("|").map(it => it.trim());
			classSource = classSource || (opts.isLower ? Parser.SRC_PHB.toLowerCase() : Parser.SRC_PHB);
			source = source || classSource;
			level = Number(level);
			return {
				name,
				className,
				classSource,
				level,
				source,
				displayText,
			};
		}

		static isValidClassFeatureUid (uid) {
			const {name, className, level} = DataUtil.class.unpackUidClassFeature(uid);
			return !(!name || !className || isNaN(level));
		}

		static packUidClassFeature (f) {
			// <name>|<className>|<classSource>|<level>|<source>
			return [
				f.name,
				f.className,
				f.classSource === Parser.SRC_PHB ? "" : f.classSource, // assume the class has PHB source
				f.level,
				f.source === f.classSource ? "" : f.source, // assume the class feature has the class source
			].join("|").replace(/\|+$/, ""); // Trim trailing pipes
		}

		/**
		 * @param uid
		 * @param [opts]
		 * @param [opts.isLower] If the returned values should be lowercase.
		 */
		static unpackUidSubclassFeature (uid, opts) {
			opts = opts || {};
			if (opts.isLower) uid = uid.toLowerCase();
			let [name, className, classSource, subclassShortName, subclassSource, level, source, displayText] = uid.split("|").map(it => it.trim());
			classSource = classSource || (opts.isLower ? Parser.SRC_PHB.toLowerCase() : Parser.SRC_PHB);
			subclassSource = subclassSource || (opts.isLower ? Parser.SRC_PHB.toLowerCase() : Parser.SRC_PHB);
			source = source || subclassSource;
			level = Number(level);
			return {
				name,
				className,
				classSource,
				subclassShortName,
				subclassSource,
				level,
				source,
				displayText,
			};
		}

		static isValidSubclassFeatureUid (uid) {
			const {name, className, subclassShortName, level} = DataUtil.class.unpackUidSubclassFeature(uid);
			return !(!name || !className || !subclassShortName || isNaN(level));
		}

		static packUidSubclassFeature (f) {
			// <name>|<className>|<classSource>|<subclassShortName>|<subclassSource>|<level>|<source>
			return [
				f.name,
				f.className,
				f.classSource === Parser.SRC_PHB ? "" : f.classSource, // assume the class has the PHB source
				f.subclassShortName,
				f.subclassSource === Parser.SRC_PHB ? "" : f.subclassSource, // assume the subclass has the PHB source
				f.level,
				f.source === f.subclassSource ? "" : f.source, // assume the feature has the same source as the subclass
			].join("|").replace(/\|+$/, ""); // Trim trailing pipes
		}

		// region Subclass lookup
		static _CACHE_SUBCLASS_LOOKUP_PROMISE = null;
		static _CACHE_SUBCLASS_LOOKUP = null;
		static async pGetSubclassLookup () {
			DataUtil.class._CACHE_SUBCLASS_LOOKUP_PROMISE = DataUtil.class._CACHE_SUBCLASS_LOOKUP_PROMISE || (async () => {
				const subclassLookup = {};
				Object.assign(subclassLookup, await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/generated/gendata-subclass-lookup.json`));
				DataUtil.class._CACHE_SUBCLASS_LOOKUP = subclassLookup;
			})();
			await DataUtil.class._CACHE_SUBCLASS_LOOKUP_PROMISE;
			return DataUtil.class._CACHE_SUBCLASS_LOOKUP;
		}
		// endregion
	},

	classFeature: class extends _DataUtilPropConfigMultiSource {
		static _PAGE = "classFeature";
		static _DIR = "class";
		static _PROP = "classFeature";
	},

	classFluff: class extends _DataUtilPropConfigMultiSource {
		static _PAGE = UrlUtil.PG_CLASSES;
		static _DIR = "class";
		static _PROP = "classFluff";
	},

	subclass: class extends _DataUtilPropConfigCustom {
		static _PAGE = "subclass";
		static _PROP = "subclassFluff";

		static async loadJSON () {
			return DataUtil.class.loadJSON();
		}

		static unpackUid (uid, opts) {
			// <shortName>|<className>|<classSource>|<source>
			return DataUtil.class.unpackUidSubclass(uid, opts);
		}

		static getUid (ent, {isMaintainCase = false, displayName = null} = {}) {
			// <shortName>|<className>|<classSource>|<source>
			return DataUtil.class.packUidSubclass(ent, {isMaintainCase, displayName});
		}
	},

	subclassFeature: class extends _DataUtilPropConfigMultiSource {
		static _PAGE = "subclassFeature";
		static _DIR = "class";
		static _PROP = "subclassFeature";
	},

	subclassFluff: class extends _DataUtilPropConfigMultiSource {
		static _PAGE = "subclassFluff";
		static _DIR = "class";
		static _PROP = "subclassFluff";
	},

	deity: class extends _DataUtilPropConfigSingleSource {
		static _PAGE = UrlUtil.PG_DEITIES;
		static _FILENAME = "deities.json";

		static doPostLoad (data) {
			const PRINT_ORDER = data.deity
				.map(it => SourceUtil.getEntitySource(it))
				.unique()
				.sort((a, b) => SortUtil.ascSortDateString(Parser.sourceJsonToDate(a), Parser.sourceJsonToDate(b)))
				.reverse();

			const inSource = {};
			PRINT_ORDER.forEach(src => {
				inSource[src] = {};
				data.deity.filter(it => it.source === src).forEach(it => inSource[src][it.reprintAlias || it.name] = it); // TODO need to handle similar names
			});

			const laterPrinting = [PRINT_ORDER.last()];
			[...PRINT_ORDER].reverse().slice(1).forEach(src => {
				laterPrinting.forEach(laterSrc => {
					Object.keys(inSource[src]).forEach(name => {
						const newer = inSource[laterSrc][name];
						if (newer) {
							const old = inSource[src][name];
							old.isReprinted = true;
							if (!newer._isEnhanced) {
								newer.previousVersions = newer.previousVersions || [];
								newer.previousVersions.push(old);
							}
						}
					});
				});

				laterPrinting.push(src);
			});
			data.deity.forEach(g => g._isEnhanced = true);

			return data;
		}

		static async loadJSON () {
			const data = await super.loadJSON();
			DataUtil.deity.doPostLoad(data);
			return data;
		}

		static getUid (ent, opts) {
			return this.packUidDeity(ent, opts);
		}

		static unpackUid (uid, opts) {
			return this.unpackUidDeity(uid, opts);
		}

		static unpackUidDeity (uid, opts) {
			opts = opts || {};
			if (opts.isLower) uid = uid.toLowerCase();
			let [name, pantheon, source, displayText, ...others] = uid.split("|").map(it => it.trim());

			pantheon = pantheon || "forgotten realms";
			if (opts.isLower) pantheon = pantheon.toLowerCase();

			source = source || Parser.getTagSource("deity", source);
			if (opts.isLower) source = source.toLowerCase();

			return {
				name,
				pantheon,
				source,
				displayText,
				others,
			};
		}

		static packUidDeity (it, {isMaintainCase = false, displayName = null} = {}) {
			// <name>|<pantheon>|<source>
			const sourceDefault = Parser.getTagSource("deity");
			const out = [
				it.name,
				(it.pantheon || "").toLowerCase() === "forgotten realms" ? "" : it.pantheon,
				(it.source || "").toLowerCase() === sourceDefault.toLowerCase() ? "" : it.source,
				displayName || "",
			].join("|").replace(/\|+$/, ""); // Trim trailing pipes
			if (isMaintainCase) return out;
			return out.toLowerCase();
		}
	},

	table: class extends _DataUtilPropConfigCustom {
		static async loadJSON () {
			const datas = await Promise.all([
				`${Renderer.get().baseUrl}data/generated/gendata-tables.json`,
				`${Renderer.get().baseUrl}data/tables.json`,
			].map(url => DataUtil.loadJSON(url)));
			const combined = {};
			datas.forEach(data => {
				Object.entries(data).forEach(([k, v]) => {
					if (combined[k] && combined[k] instanceof Array && v instanceof Array) combined[k] = combined[k].concat(v);
					else if (combined[k] == null) combined[k] = v;
					else throw new Error(`Could not merge keys for key "${k}"`);
				});
			});

			return combined;
		}
	},

	legendaryGroup: class extends _DataUtilPropConfigSingleSource {
		static _PAGE = UrlUtil.PG_BESTIARY;
		static _FILENAME = "bestiary/legendarygroups.json";

		static async pLoadAll () {
			return (await this.loadJSON()).legendaryGroup;
		}
	},

	variantrule: class extends _DataUtilPropConfigSingleSource {
		static _PAGE = UrlUtil.PG_VARIANTRULES;
		static _FILENAME = "variantrules.json";

		static async loadJSON () {
			const rawData = await super.loadJSON();
			const rawDataGenerated = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/generated/gendata-variantrules.json`);

			return {variantrule: [...rawData.variantrule, ...rawDataGenerated.variantrule]};
		}
	},

	deck: class extends _DataUtilPropConfigCustom {
		static _PAGE = UrlUtil.PG_DECKS;

		static _pLoadJson = null;
		static _pLoadRawJson = null;

		static loadJSON () {
			return DataUtil.deck._pLoadJson = DataUtil.deck._pLoadJson || (async () => {
				return {
					deck: await DataLoader.pCacheAndGetAllSite("deck"),
					card: await DataLoader.pCacheAndGetAllSite("card"),
				};
			})();
		}

		static loadRawJSON () {
			return DataUtil.deck._pLoadRawJson = DataUtil.deck._pLoadRawJson || DataUtil.loadJSON(`${Renderer.get().baseUrl}data/decks.json`);
		}

		static async loadPrerelease () {
			return {
				deck: await DataLoader.pCacheAndGetAllPrerelease("deck"),
				card: await DataLoader.pCacheAndGetAllPrerelease("card"),
			};
		}

		static async loadBrew () {
			return {
				deck: await DataLoader.pCacheAndGetAllBrew("deck"),
				card: await DataLoader.pCacheAndGetAllBrew("card"),
			};
		}

		/**
		 * @param uid
		 * @param [opts]
		 * @param [opts.isLower] If the returned values should be lowercase.
		 */
		static unpackUidCard (uid, opts) {
			opts = opts || {};
			if (opts.isLower) uid = uid.toLowerCase();
			let [name, set, source, displayText] = uid.split("|").map(it => it.trim());
			set = set || "none";
			source = source || Parser.getTagSource("card", source)[opts.isLower ? "toLowerCase" : "toString"]();
			return {
				name,
				set,
				source,
				displayText,
			};
		}
	},

	reward: class extends _DataUtilPropConfigSingleSource {
		static _PAGE = UrlUtil.PG_REWARDS;
		static _FILENAME = "rewards.json";
	},

	rewardFluff: class extends _DataUtilPropConfigSingleSource {
		static _PAGE = UrlUtil.PG_REWARDS;
		static _FILENAME = "fluff-rewards.json";
	},

	trap: class extends _DataUtilPropConfigSingleSource {
		static _PAGE = UrlUtil.PG_TRAPS_HAZARDS;
		static _FILENAME = "trapshazards.json";
	},

	trapFluff: class extends _DataUtilPropConfigSingleSource {
		static _PAGE = UrlUtil.PG_TRAPS_HAZARDS;
		static _FILENAME = "fluff-trapshazards.json";
	},

	hazard: class extends _DataUtilPropConfigSingleSource {
		static _PAGE = UrlUtil.PG_TRAPS_HAZARDS;
		static _FILENAME = "trapshazards.json";
	},

	hazardFluff: class extends _DataUtilPropConfigSingleSource {
		static _PAGE = UrlUtil.PG_TRAPS_HAZARDS;
		static _FILENAME = "fluff-trapshazards.json";
	},

	action: class extends _DataUtilPropConfigSingleSource {
		static _PAGE = UrlUtil.PG_ACTIONS;
		static _FILENAME = "actions.json";
	},

	facility: class extends _DataUtilPropConfigSingleSource {
		static _PAGE = UrlUtil.PG_BASTIONS;
		static _FILENAME = "bastions.json";
	},

	facilityFluff: class extends _DataUtilPropConfigSingleSource {
		static _PAGE = UrlUtil.PG_BASTIONS;
		static _FILENAME = "fluff-bastions.json";
	},

	quickreference: {
		/**
		 * @param uid
		 * @param [opts]
		 * @param [opts.isLower] If the returned values should be lowercase.
		 */
		unpackUid (uid, opts) {
			opts = opts || {};
			if (opts.isLower) uid = uid.toLowerCase();
			let [name, source, ixChapter, ixHeader, displayText] = uid.split("|").map(it => it.trim());
			source = source || (opts.isLower ? Parser.SRC_PHB.toLowerCase() : Parser.SRC_PHB);
			ixChapter = Number(ixChapter || 0);
			return {
				name,
				ixChapter,
				ixHeader,
				source,
				displayText,
			};
		},
	},

	brew: new _DataUtilBrewHelper({defaultUrlRoot: VeCt.URL_ROOT_BREW}),
	prerelease: new _DataUtilBrewHelper({defaultUrlRoot: VeCt.URL_ROOT_PRERELEASE}),
};

// ROLLING =============================================================================================================
globalThis.RollerUtil = {
	isCrypto () {
		return typeof window !== "undefined" && typeof window.crypto !== "undefined";
	},

	randomise (max, min = 1) {
		if (min > max) return 0;
		if (max === min) return max;
		if (RollerUtil.isCrypto()) {
			return RollerUtil._randomise(min, max + 1);
		} else {
			return RollerUtil.roll(max) + min;
		}
	},

	rollOnArray (array) {
		return array[RollerUtil.randomise(array.length) - 1];
	},

	/**
	 * Cryptographically secure RNG
	 */
	_randomise: (min, max) => {
		if (isNaN(min) || isNaN(max)) throw new Error(`Invalid min/max!`);

		const range = max - min;
		const bytesNeeded = Math.ceil(Math.log2(range) / 8);
		const randomBytes = new Uint8Array(bytesNeeded);
		const maximumRange = (2 ** 8) ** bytesNeeded;
		const extendedRange = Math.floor(maximumRange / range) * range;
		let i;
		let randomInteger;
		while (true) {
			window.crypto.getRandomValues(randomBytes);
			randomInteger = 0;
			for (i = 0; i < bytesNeeded; i++) {
				randomInteger <<= 8;
				randomInteger += randomBytes[i];
			}
			if (randomInteger < extendedRange) {
				randomInteger %= range;
				return min + randomInteger;
			}
		}
	},

	/**
	 * Result in range: 0 to (max-1); inclusive
	 * e.g. roll(20) gives results ranging from 0 to 19
	 * @param max range max (exclusive)
	 * @param fn funciton to call to generate random numbers
	 * @returns {number} rolled
	 */
	roll (max, fn = Math.random) {
		return Math.floor(fn() * max);
	},

	getColRollType (colLabel) {
		if (typeof colLabel !== "string") return false;

		colLabel = colLabel.trim();
		const mDice = /^{@dice (?<exp>[^}|]+)([^}]+)?}$/.exec(colLabel);

		colLabel = mDice ? mDice.groups.exp : Renderer.stripTags(colLabel);

		const pts = mDice
			? colLabel
				.split(";")
				.map(it => it.trim())
				.filter(Boolean)
			: [colLabel];

		if (pts.every(pt => !!Renderer.dice.lang.getTree3(pt))) return RollerUtil.ROLL_COL_STANDARD;

		// Remove trailing variables, if they exist
		if (
			pts
				.every(pt => {
					return !!Renderer.dice.lang.getTree3(
						pt
							.replace(RollerUtil._REGEX_ROLLABLE_COL_LABEL, "$1")
							.replace(RollerUtil._REGEX_ROLLABLE_COL_TRAILING_VARIABLE, "$1"),
					);
				})
		) return RollerUtil.ROLL_COL_VARIABLE;

		return RollerUtil.ROLL_COL_NONE;
	},

	getFullRollCol (lbl) {
		if (typeof lbl !== "string") return lbl;

		if (lbl.includes("@dice")) return lbl;

		if (Renderer.dice.lang.getTree3(lbl)) return `{@dice ${lbl}}`;

		// Try to split off any trailing variables, e.g. `d100 + Level` -> `d100`, `Level`
		const m = RollerUtil._REGEX_ROLLABLE_COL_LABEL.exec(lbl);
		if (!m) return lbl;

		return `{@dice ${m[1]}${m[2]}#$prompt_number:title=Enter a ${m[3].trim()}$#|${lbl}}`;
	},

	_DICE_REGEX_STR: /((?:\s*?(?<opLeading>[-+×x*÷/])\s*?)?((?<diceCount>[1-9]\d*)?d(?<diceFace>[1-9]\d*)(?<bonus>(\s*?[-+×x*÷/]\s*?(\d,\d|\d)+(\.\d+)?(?!d))*)))+?/.source,
};
RollerUtil.DICE_REGEX = new RegExp(RollerUtil._DICE_REGEX_STR, "g");
RollerUtil.DICE_REGEX_FULLMATCH = new RegExp(`^\\s*${RollerUtil._DICE_REGEX_STR}\\s*$`);
RollerUtil.REGEX_DAMAGE_DICE = /(?<average>\d+)(?<prefix> \((?:{@dice |{@damage ))(?<diceExp>[-+0-9d ]*)(?<suffix>}\)(?:\s*\+\s*the spell's level)? [a-z]+( \([-a-zA-Z0-9 ]+\))?( or [a-z]+( \([-a-zA-Z0-9 ]+\))?)? damage)/gi;
RollerUtil.REGEX_DAMAGE_FLAT = /(?<prefix>Hit(?: or Miss)?: |Miss: |{@hom}|{@h}|{@m})(?<flatVal>[0-9]+)(?<suffix> [a-z]+( \([-a-zA-Z0-9 ]+\))?( or [a-z]+( \([-a-zA-Z0-9 ]+\))?)? damage)/gi;
RollerUtil._REGEX_ROLLABLE_COL_LABEL = /^(.*?\d)(\s*[-+/*^×÷]\s*)([a-zA-Z0-9 ]+)$/;
RollerUtil._REGEX_ROLLABLE_COL_TRAILING_VARIABLE = /^(.*?\d)(\s*[-+/*^×÷]\s*)(#\$.*?\$#)$/;
RollerUtil.ROLL_COL_NONE = 0;
RollerUtil.ROLL_COL_STANDARD = 1;
RollerUtil.ROLL_COL_VARIABLE = 2;

// STORAGE =============================================================================================================
// Dependency: localforage
function StorageUtilBase () {
	this._META_KEY = "_STORAGE_META_STORAGE";

	this._fakeStorageBacking = {};
	this._fakeStorageBackingAsync = {};

	this._getFakeStorageSync = function () {
		return {
			isSyncFake: true,
			getItem: k => this._fakeStorageBacking[k],
			removeItem: k => delete this._fakeStorageBacking[k],
			setItem: (k, v) => this._fakeStorageBacking[k] = v,
		};
	};

	this._getFakeStorageAsync = function () {
		return {
			pIsAsyncFake: true,
			setItem: async (k, v) => this._fakeStorageBackingAsync[k] = v,
			getItem: async (k) => this._fakeStorageBackingAsync[k],
			removeItem: async (k) => delete this._fakeStorageBackingAsync[k],
		};
	};

	this._getSyncStorage = function () { throw new Error(`Unimplemented!`); };
	this._getAsyncStorage = async function () { throw new Error(`Unimplemented!`); };

	this.getPageKey = function (key, page) { return `${key}_${page || UrlUtil.getCurrentPage()}`; };

	// region Synchronous
	this.syncGet = function (key) {
		const rawOut = this._getSyncStorage().getItem(key);
		if (rawOut && rawOut !== "undefined" && rawOut !== "null") return JSON.parse(rawOut);
		return null;
	};

	this.syncSet = function (key, value) {
		this._getSyncStorage().setItem(key, JSON.stringify(value));
		this._syncTrackKey(key);
	};

	this.syncRemove = function (key) {
		this._getSyncStorage().removeItem(key);
		this._syncTrackKey(key, true);
	};

	this.syncGetForPage = function (key) { return this.syncGet(`${key}_${UrlUtil.getCurrentPage()}`); };
	this.syncSetForPage = function (key, value) { this.syncSet(`${key}_${UrlUtil.getCurrentPage()}`, value); };

	this.isSyncFake = function () {
		return !!this._getSyncStorage().isSyncFake;
	};

	this._syncTrackKey = function (key, isRemove) {
		const meta = this.syncGet(this._META_KEY) || {};
		if (isRemove) delete meta[key];
		else meta[key] = 1;
		this._getSyncStorage().setItem(this._META_KEY, JSON.stringify(meta));
	};

	this.syncGetDump = function () {
		const out = {};
		this._syncGetPresentKeys().forEach(key => out[key] = this.syncGet(key));
		return out;
	};

	this._syncGetPresentKeys = function () {
		const meta = this.syncGet(this._META_KEY) || {};
		return Object.entries(meta).filter(([, isPresent]) => isPresent).map(([key]) => key);
	};

	this.syncSetFromDump = function (dump) {
		const keysToRemove = new Set(this._syncGetPresentKeys());
		Object.entries(dump).map(([k, v]) => {
			keysToRemove.delete(k);
			return this.syncSet(k, v);
		});
		[...keysToRemove].map(k => this.syncRemove(k));
	};
	// endregion

	// region Asynchronous
	this.pIsAsyncFake = async function () {
		const storage = await this._getAsyncStorage();
		return !!storage.pIsAsyncFake;
	};

	this.pSet = async function (key, value) {
		this._pTrackKey(key).then(null);
		const storage = await this._getAsyncStorage();
		return storage.setItem(key, value);
	};

	this.pGet = async function (key) {
		const storage = await this._getAsyncStorage();
		return storage.getItem(key);
	};

	this.pRemove = async function (key) {
		this._pTrackKey(key, true).then(null);
		const storage = await this._getAsyncStorage();
		return storage.removeItem(key);
	};

	this.pGetForPage = async function (key, {page = null} = {}) { return this.pGet(this.getPageKey(key, page)); };
	this.pSetForPage = async function (key, value, {page = null} = {}) { return this.pSet(this.getPageKey(key, page), value); };
	this.pRemoveForPage = async function (key, {page = null} = {}) { return this.pRemove(this.getPageKey(key, page)); };

	this._pTrackKey = async function (key, isRemove) {
		const storage = await this._getAsyncStorage();
		const meta = (await this.pGet(this._META_KEY)) || {};
		if (isRemove) delete meta[key];
		else meta[key] = 1;
		return storage.setItem(this._META_KEY, meta);
	};

	this.pGetDump = async function () {
		const out = {};
		await Promise.all(
			(await this._pGetPresentKeys()).map(async (key) => out[key] = await this.pGet(key)),
		);
		return out;
	};

	this._pGetPresentKeys = async function () {
		const meta = (await this.pGet(this._META_KEY)) || {};
		return Object.entries(meta).filter(([, isPresent]) => isPresent).map(([key]) => key);
	};

	this.pSetFromDump = async function (dump) {
		const keysToRemove = new Set(await this._pGetPresentKeys());
		await Promise.all(
			Object.entries(dump).map(([k, v]) => {
				keysToRemove.delete(k);
				return this.pSet(k, v);
			}),
		);
		await Promise.all(
			[...keysToRemove].map(k => this.pRemove(k)),
		);
	};
	// endregion
}

function StorageUtilMemory () {
	StorageUtilBase.call(this);

	this._fakeStorage = null;
	this._fakeStorageAsync = null;

	this._getSyncStorage = function () {
		this._fakeStorage = this._fakeStorage || this._getFakeStorageSync();
		return this._fakeStorage;
	};

	this._getAsyncStorage = async function () {
		this._fakeStorageAsync = this._fakeStorageAsync || this._getFakeStorageAsync();
		return this._fakeStorageAsync;
	};
}

globalThis.StorageUtilMemory = StorageUtilMemory;

function StorageUtilBacked () {
	StorageUtilBase.call(this);

	this._isInit = false;
	this._isInitAsync = false;
	this._fakeStorage = null;
	this._fakeStorageAsync = null;

	this._initSyncStorage = function () {
		if (this._isInit) return;

		if (typeof window === "undefined") {
			this._fakeStorage = this._getFakeStorageSync();
			this._isInit = true;
			return;
		}

		try {
			window.localStorage.setItem("_test_storage", true);
		} catch (e) {
			// if the user has disabled cookies, build a fake version
			this._fakeStorage = this._getFakeStorageSync();
		}

		this._isInit = true;
	};

	this._getSyncStorage = function () {
		this._initSyncStorage();
		if (this._fakeStorage) return this._fakeStorage;
		return window.localStorage;
	};

	this._initAsyncStorage = async function () {
		if (this._isInitAsync) return;

		if (typeof window === "undefined") {
			this._fakeStorageAsync = this._getFakeStorageAsync();
			this._isInitAsync = true;
			return;
		}

		try {
			// check if IndexedDB is available (i.e. not in Firefox private browsing)
			await new Promise((resolve, reject) => {
				const request = window.indexedDB.open("_test_db", 1);
				request.onerror = reject;
				request.onsuccess = resolve;
			});
			await localforage.setItem("_storage_check", true);
		} catch (e) {
			this._fakeStorageAsync = this._getFakeStorageAsync();
		}

		this._isInitAsync = true;
	};

	this._getAsyncStorage = async function () {
		await this._initAsyncStorage();
		if (this._fakeStorageAsync) return this._fakeStorageAsync;
		else return localforage;
	};
}

globalThis.StorageUtil = new StorageUtilBacked();

// TODO transition cookie-like storage items over to this
globalThis.SessionStorageUtil = {
	_fakeStorage: {},
	__storage: null,
	getStorage: () => {
		try {
			return window.sessionStorage;
		} catch (e) {
			// if the user has disabled cookies, build a fake version
			if (SessionStorageUtil.__storage) return SessionStorageUtil.__storage;
			else {
				return SessionStorageUtil.__storage = {
					isFake: true,
					getItem: (k) => {
						return SessionStorageUtil._fakeStorage[k];
					},
					removeItem: (k) => {
						delete SessionStorageUtil._fakeStorage[k];
					},
					setItem: (k, v) => {
						SessionStorageUtil._fakeStorage[k] = v;
					},
				};
			}
		}
	},

	isFake () {
		return SessionStorageUtil.getStorage().isSyncFake;
	},

	setForPage: (key, value) => {
		SessionStorageUtil.set(`${key}_${UrlUtil.getCurrentPage()}`, value);
	},

	set (key, value) {
		SessionStorageUtil.getStorage().setItem(key, JSON.stringify(value));
	},

	getForPage: (key) => {
		return SessionStorageUtil.get(`${key}_${UrlUtil.getCurrentPage()}`);
	},

	get (key) {
		const rawOut = SessionStorageUtil.getStorage().getItem(key);
		if (rawOut && rawOut !== "undefined" && rawOut !== "null") return JSON.parse(rawOut);
		return null;
	},

	removeForPage: (key) => {
		SessionStorageUtil.remove(`${key}_${UrlUtil.getCurrentPage()}`);
	},

	remove (key) {
		SessionStorageUtil.getStorage().removeItem(key);
	},
};

// ID GENERATION =======================================================================================================
globalThis.CryptUtil = {
	// region md5 internals
	// stolen from http://www.myersdaily.org/joseph/javascript/md5.js
	_md5cycle: (x, k) => {
		let a = x[0];
		let b = x[1];
		let c = x[2];
		let d = x[3];

		a = CryptUtil._ff(a, b, c, d, k[0], 7, -680876936);
		d = CryptUtil._ff(d, a, b, c, k[1], 12, -389564586);
		c = CryptUtil._ff(c, d, a, b, k[2], 17, 606105819);
		b = CryptUtil._ff(b, c, d, a, k[3], 22, -1044525330);
		a = CryptUtil._ff(a, b, c, d, k[4], 7, -176418897);
		d = CryptUtil._ff(d, a, b, c, k[5], 12, 1200080426);
		c = CryptUtil._ff(c, d, a, b, k[6], 17, -1473231341);
		b = CryptUtil._ff(b, c, d, a, k[7], 22, -45705983);
		a = CryptUtil._ff(a, b, c, d, k[8], 7, 1770035416);
		d = CryptUtil._ff(d, a, b, c, k[9], 12, -1958414417);
		c = CryptUtil._ff(c, d, a, b, k[10], 17, -42063);
		b = CryptUtil._ff(b, c, d, a, k[11], 22, -1990404162);
		a = CryptUtil._ff(a, b, c, d, k[12], 7, 1804603682);
		d = CryptUtil._ff(d, a, b, c, k[13], 12, -40341101);
		c = CryptUtil._ff(c, d, a, b, k[14], 17, -1502002290);
		b = CryptUtil._ff(b, c, d, a, k[15], 22, 1236535329);

		a = CryptUtil._gg(a, b, c, d, k[1], 5, -165796510);
		d = CryptUtil._gg(d, a, b, c, k[6], 9, -1069501632);
		c = CryptUtil._gg(c, d, a, b, k[11], 14, 643717713);
		b = CryptUtil._gg(b, c, d, a, k[0], 20, -373897302);
		a = CryptUtil._gg(a, b, c, d, k[5], 5, -701558691);
		d = CryptUtil._gg(d, a, b, c, k[10], 9, 38016083);
		c = CryptUtil._gg(c, d, a, b, k[15], 14, -660478335);
		b = CryptUtil._gg(b, c, d, a, k[4], 20, -405537848);
		a = CryptUtil._gg(a, b, c, d, k[9], 5, 568446438);
		d = CryptUtil._gg(d, a, b, c, k[14], 9, -1019803690);
		c = CryptUtil._gg(c, d, a, b, k[3], 14, -187363961);
		b = CryptUtil._gg(b, c, d, a, k[8], 20, 1163531501);
		a = CryptUtil._gg(a, b, c, d, k[13], 5, -1444681467);
		d = CryptUtil._gg(d, a, b, c, k[2], 9, -51403784);
		c = CryptUtil._gg(c, d, a, b, k[7], 14, 1735328473);
		b = CryptUtil._gg(b, c, d, a, k[12], 20, -1926607734);

		a = CryptUtil._hh(a, b, c, d, k[5], 4, -378558);
		d = CryptUtil._hh(d, a, b, c, k[8], 11, -2022574463);
		c = CryptUtil._hh(c, d, a, b, k[11], 16, 1839030562);
		b = CryptUtil._hh(b, c, d, a, k[14], 23, -35309556);
		a = CryptUtil._hh(a, b, c, d, k[1], 4, -1530992060);
		d = CryptUtil._hh(d, a, b, c, k[4], 11, 1272893353);
		c = CryptUtil._hh(c, d, a, b, k[7], 16, -155497632);
		b = CryptUtil._hh(b, c, d, a, k[10], 23, -1094730640);
		a = CryptUtil._hh(a, b, c, d, k[13], 4, 681279174);
		d = CryptUtil._hh(d, a, b, c, k[0], 11, -358537222);
		c = CryptUtil._hh(c, d, a, b, k[3], 16, -722521979);
		b = CryptUtil._hh(b, c, d, a, k[6], 23, 76029189);
		a = CryptUtil._hh(a, b, c, d, k[9], 4, -640364487);
		d = CryptUtil._hh(d, a, b, c, k[12], 11, -421815835);
		c = CryptUtil._hh(c, d, a, b, k[15], 16, 530742520);
		b = CryptUtil._hh(b, c, d, a, k[2], 23, -995338651);

		a = CryptUtil._ii(a, b, c, d, k[0], 6, -198630844);
		d = CryptUtil._ii(d, a, b, c, k[7], 10, 1126891415);
		c = CryptUtil._ii(c, d, a, b, k[14], 15, -1416354905);
		b = CryptUtil._ii(b, c, d, a, k[5], 21, -57434055);
		a = CryptUtil._ii(a, b, c, d, k[12], 6, 1700485571);
		d = CryptUtil._ii(d, a, b, c, k[3], 10, -1894986606);
		c = CryptUtil._ii(c, d, a, b, k[10], 15, -1051523);
		b = CryptUtil._ii(b, c, d, a, k[1], 21, -2054922799);
		a = CryptUtil._ii(a, b, c, d, k[8], 6, 1873313359);
		d = CryptUtil._ii(d, a, b, c, k[15], 10, -30611744);
		c = CryptUtil._ii(c, d, a, b, k[6], 15, -1560198380);
		b = CryptUtil._ii(b, c, d, a, k[13], 21, 1309151649);
		a = CryptUtil._ii(a, b, c, d, k[4], 6, -145523070);
		d = CryptUtil._ii(d, a, b, c, k[11], 10, -1120210379);
		c = CryptUtil._ii(c, d, a, b, k[2], 15, 718787259);
		b = CryptUtil._ii(b, c, d, a, k[9], 21, -343485551);

		x[0] = CryptUtil._add32(a, x[0]);
		x[1] = CryptUtil._add32(b, x[1]);
		x[2] = CryptUtil._add32(c, x[2]);
		x[3] = CryptUtil._add32(d, x[3]);
	},

	_cmn: (q, a, b, x, s, t) => {
		a = CryptUtil._add32(CryptUtil._add32(a, q), CryptUtil._add32(x, t));
		return CryptUtil._add32((a << s) | (a >>> (32 - s)), b);
	},

	_ff: (a, b, c, d, x, s, t) => {
		return CryptUtil._cmn((b & c) | ((~b) & d), a, b, x, s, t);
	},

	_gg: (a, b, c, d, x, s, t) => {
		return CryptUtil._cmn((b & d) | (c & (~d)), a, b, x, s, t);
	},

	_hh: (a, b, c, d, x, s, t) => {
		return CryptUtil._cmn(b ^ c ^ d, a, b, x, s, t);
	},

	_ii: (a, b, c, d, x, s, t) => {
		return CryptUtil._cmn(c ^ (b | (~d)), a, b, x, s, t);
	},

	_md51: (s) => {
		let n = s.length;
		let state = [1732584193, -271733879, -1732584194, 271733878];
		let i;
		for (i = 64; i <= s.length; i += 64) {
			CryptUtil._md5cycle(state, CryptUtil._md5blk(s.substring(i - 64, i)));
		}
		s = s.substring(i - 64);
		let tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		for (i = 0; i < s.length; i++) tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
		tail[i >> 2] |= 0x80 << ((i % 4) << 3);
		if (i > 55) {
			CryptUtil._md5cycle(state, tail);
			for (i = 0; i < 16; i++) tail[i] = 0;
		}
		tail[14] = n * 8;
		CryptUtil._md5cycle(state, tail);
		return state;
	},

	_md5blk: (s) => {
		let md5blks = [];
		for (let i = 0; i < 64; i += 4) {
			md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
		}
		return md5blks;
	},

	_hex_chr: "0123456789abcdef".split(""),

	_rhex: (n) => {
		let s = "";
		for (let j = 0; j < 4; j++) {
			s += CryptUtil._hex_chr[(n >> (j * 8 + 4)) & 0x0F] + CryptUtil._hex_chr[(n >> (j * 8)) & 0x0F];
		}
		return s;
	},

	_add32: (a, b) => {
		return (a + b) & 0xFFFFFFFF;
	},
	// endregion

	hex: (x) => {
		for (let i = 0; i < x.length; i++) {
			x[i] = CryptUtil._rhex(x[i]);
		}
		return x.join("");
	},

	hex2Dec (hex) {
		return parseInt(`0x${hex}`);
	},

	md5: (s) => {
		return CryptUtil.hex(CryptUtil._md51(s));
	},

	/**
	 * Based on Java's implementation.
	 * @param obj An object to hash.
	 * @return {*} An integer hashcode for the object.
	 */
	hashCode (obj) {
		if (typeof obj === "string") {
			if (!obj) return 0;
			let h = 0;
			for (let i = 0; i < obj.length; ++i) h = 31 * h + obj.charCodeAt(i);
			return h;
		} else if (typeof obj === "number") return obj;
		else throw new Error(`No hashCode implementation for ${obj}`);
	},

	uid () { // https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
		if (RollerUtil.isCrypto()) {
			return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
		} else {
			let d = Date.now();
			if (typeof performance !== "undefined" && typeof performance.now === "function") {
				d += performance.now();
			}
			return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
				const r = (d + Math.random() * 16) % 16 | 0;
				d = Math.floor(d / 16);
				return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
			});
		}
	},
};

// COLLECTIONS =========================================================================================================
globalThis.CollectionUtil = {
	ObjectSet: class ObjectSet {
		constructor () {
			this.map = new Map();
			this[Symbol.iterator] = this.values;
		}
		// Each inserted element has to implement _toIdString() method that returns a string ID.
		// Two objects are considered equal if their string IDs are equal.
		add (item) {
			this.map.set(item._toIdString(), item);
		}

		values () {
			return this.map.values();
		}
	},

	setEq (a, b) {
		if (a.size !== b.size) return false;
		for (const it of a) if (!b.has(it)) return false;
		return true;
	},

	objectDiff (obj1, obj2) {
		const out = {};

		[...new Set([...Object.keys(obj1), ...Object.keys(obj2)])]
			.forEach(k => {
				const diff = CollectionUtil._objectDiff_recurse(obj1[k], obj2[k]);
				if (diff !== undefined) out[k] = diff;
			});

		return out;
	},

	_objectDiff_recurse (a, b) {
		if (CollectionUtil.deepEquals(a, b)) return undefined;

		if (a && b && typeof a === "object" && typeof b === "object") {
			return CollectionUtil.objectDiff(a, b);
		}

		return b;
	},

	objectIntersect (obj1, obj2) {
		const out = {};

		[...new Set([...Object.keys(obj1), ...Object.keys(obj2)])]
			.forEach(k => {
				const diff = CollectionUtil._objectIntersect_recurse(obj1[k], obj2[k]);
				if (diff !== undefined) out[k] = diff;
			});

		return out;
	},

	_objectIntersect_recurse (a, b) {
		if (CollectionUtil.deepEquals(a, b)) return a;

		if (a && b && typeof a === "object" && typeof b === "object") {
			return CollectionUtil.objectIntersect(a, b);
		}

		return undefined;
	},

	deepEquals (a, b) {
		if (Object.is(a, b)) return true;
		if (a && b && typeof a === "object" && typeof b === "object") {
			if (CollectionUtil._eq_isPlainObject(a) && CollectionUtil._eq_isPlainObject(b)) return CollectionUtil._eq_areObjectsEqual(a, b);
			const isArrayA = Array.isArray(a);
			const isArrayB = Array.isArray(b);
			if (isArrayA || isArrayB) return isArrayA === isArrayB && CollectionUtil._eq_areArraysEqual(a, b);
			const isSetA = a instanceof Set;
			const isSetB = b instanceof Set;
			if (isSetA || isSetB) return isSetA === isSetB && CollectionUtil.setEq(a, b);
			return CollectionUtil._eq_areObjectsEqual(a, b);
		}
		return false;
	},

	_eq_isPlainObject: (value) => value.constructor === Object || value.constructor == null,
	_eq_areObjectsEqual (a, b) {
		const keysA = Object.keys(a);
		const {length} = keysA;
		if (Object.keys(b).length !== length) return false;
		for (let i = 0; i < length; i++) {
			if (!b.hasOwnProperty(keysA[i])) return false;
			if (!CollectionUtil.deepEquals(a[keysA[i]], b[keysA[i]])) return false;
		}
		return true;
	},
	_eq_areArraysEqual (a, b) {
		const {length} = a;
		if (b.length !== length) return false;
		for (let i = 0; i < length; i++) if (!CollectionUtil.deepEquals(a[i], b[i])) return false;
		return true;
	},

	// region Find first <X>
	dfs (obj, opts) {
		const {prop = null, fnMatch = null} = opts;
		if (!prop && !fnMatch) throw new Error(`One of "prop" or "fnMatch" must be specified!`);

		if (obj instanceof Array) {
			for (const child of obj) {
				const n = CollectionUtil.dfs(child, opts);
				if (n) return n;
			}
			return;
		}

		if (obj instanceof Object) {
			if (prop && obj[prop]) return obj[prop];
			if (fnMatch && fnMatch(obj)) return obj;

			for (const child of Object.values(obj)) {
				const n = CollectionUtil.dfs(child, opts);
				if (n) return n;
			}
		}
	},

	bfs (obj, opts) {
		const {prop = null, fnMatch = null} = opts;
		if (!prop && !fnMatch) throw new Error(`One of "prop" or "fnMatch" must be specified!`);

		if (obj instanceof Array) {
			for (const child of obj) {
				if (!(child instanceof Array) && child instanceof Object) {
					if (prop && child[prop]) return child[prop];
					if (fnMatch && fnMatch(child)) return child;
				}
			}

			for (const child of obj) {
				const n = CollectionUtil.bfs(child, opts);
				if (n) return n;
			}

			return;
		}

		if (obj instanceof Object) {
			if (prop && obj[prop]) return obj[prop];
			if (fnMatch && fnMatch(obj)) return obj;

			return CollectionUtil.bfs(Object.values(obj));
		}
	},
	// endregion
};

class _TrieNode {
	constructor () {
		this.children = {};
		this.isEndOfRun = false;
	}
}

globalThis.Trie = class {
	constructor () {
		this.root = new _TrieNode();
	}

	add (tokens, node) {
		node ||= this.root;
		const [head, ...tail] = tokens;
		const nodeNxt = node.children[head] ||= new _TrieNode();
		if (!tail.length) return nodeNxt.isEndOfRun = true;
		this.add(tail, nodeNxt);
	}

	findLongestComplete (tokens, node, accum, found) {
		node ||= this.root;
		accum ||= [];
		found ||= [];

		const [head, ...tail] = tokens;
		const nodeNxt = node.children[head];
		if (!nodeNxt) {
			if (found.length) {
				const [out] = found.sort(SortUtil.ascSortProp.bind(SortUtil, "length")).reverse();
				return out;
			}
			return null;
		}

		accum.push(head);

		if (nodeNxt.isEndOfRun) found.push([...accum]);
		return this.findLongestComplete(tail, nodeNxt, accum, found);
	}
};

Array.prototype.last || Object.defineProperty(Array.prototype, "last", {
	enumerable: false,
	writable: true,
	value: function (arg) {
		if (arg !== undefined) this[this.length - 1] = arg;
		else return this[this.length - 1];
	},
});

Array.prototype.filterIndex || Object.defineProperty(Array.prototype, "filterIndex", {
	enumerable: false,
	writable: true,
	value: function (fnCheck) {
		const out = [];
		this.forEach((it, i) => {
			if (fnCheck(it)) out.push(i);
		});
		return out;
	},
});

Array.prototype.equals || Object.defineProperty(Array.prototype, "equals", {
	enumerable: false,
	writable: true,
	value: function (array2) {
		const array1 = this;
		if (!array1 && !array2) return true;
		else if ((!array1 && array2) || (array1 && !array2)) return false;

		let temp = [];
		if ((!array1[0]) || (!array2[0])) return false;
		if (array1.length !== array2.length) return false;
		let key;
		// Put all the elements from array1 into a "tagged" array
		for (let i = 0; i < array1.length; i++) {
			key = `${(typeof array1[i])}~${array1[i]}`; // Use "typeof" so a number 1 isn't equal to a string "1".
			if (temp[key]) temp[key]++;
			else temp[key] = 1;
		}
		// Go through array2 - if same tag missing in "tagged" array, not equal
		for (let i = 0; i < array2.length; i++) {
			key = `${(typeof array2[i])}~${array2[i]}`;
			if (temp[key]) {
				if (temp[key] === 0) return false;
				else temp[key]--;
			} else return false;
		}
		return true;
	},
});

// Alternate name due to clash with Foundry VTT
Array.prototype.segregate || Object.defineProperty(Array.prototype, "segregate", {
	enumerable: false,
	writable: true,
	value: function (fnIsValid) {
		return this.reduce(([pass, fail], elem) => fnIsValid(elem) ? [[...pass, elem], fail] : [pass, [...fail, elem]], [[], []]);
	},
});

Array.prototype.partition || Object.defineProperty(Array.prototype, "partition", {
	enumerable: false,
	writable: true,
	value: Array.prototype.segregate,
});

Array.prototype.getNext || Object.defineProperty(Array.prototype, "getNext", {
	enumerable: false,
	writable: true,
	value: function (curVal) {
		let ix = this.indexOf(curVal);
		if (!~ix) throw new Error("Value was not in array!");
		if (++ix >= this.length) ix = 0;
		return this[ix];
	},
});

// See: https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
Array.prototype.shuffle || Object.defineProperty(Array.prototype, "shuffle", {
	enumerable: false,
	writable: true,
	value: function () {
		const len = this.length;
		const ixLast = len - 1;
		for (let i = 0; i < len; ++i) {
			const j = i + Math.floor(Math.random() * (ixLast - i + 1));
			[this[i], this[j]] = [this[j], this[i]];
		}
		return this;
	},
});

/** Map each array item to a k:v pair, then flatten them into one object. */
Array.prototype.mergeMap || Object.defineProperty(Array.prototype, "mergeMap", {
	enumerable: false,
	writable: true,
	value: function (fnMap) {
		return this.map((...args) => fnMap(...args)).filter(it => it != null).reduce((a, b) => Object.assign(a, b), {});
	},
});

Array.prototype.first || Object.defineProperty(Array.prototype, "first", {
	enumerable: false,
	writable: true,
	value: function (fnMapFind) {
		for (let i = 0, len = this.length; i < len; ++i) {
			const result = fnMapFind(this[i], i, this);
			if (result) return result;
		}
	},
});

Array.prototype.pMap || Object.defineProperty(Array.prototype, "pMap", {
	enumerable: false,
	writable: true,
	value: async function (fnMap) {
		return Promise.all(this.map((it, i) => fnMap(it, i, this)));
	},
});

/** Map each item via an async function, awaiting for each to complete before starting the next. */
Array.prototype.pSerialAwaitMap || Object.defineProperty(Array.prototype, "pSerialAwaitMap", {
	enumerable: false,
	writable: true,
	value: async function (fnMap) {
		const out = [];
		for (let i = 0, len = this.length; i < len; ++i) out.push(await fnMap(this[i], i, this));
		return out;
	},
});

Array.prototype.pSerialAwaitFilter || Object.defineProperty(Array.prototype, "pSerialAwaitFilter", {
	enumerable: false,
	writable: true,
	value: async function (fnFilter) {
		const out = [];
		for (let i = 0, len = this.length; i < len; ++i) {
			if (await fnFilter(this[i], i, this)) out.push(this[i]);
		}
		return out;
	},
});

Array.prototype.pSerialAwaitFind || Object.defineProperty(Array.prototype, "pSerialAwaitFind", {
	enumerable: false,
	writable: true,
	value: async function (fnFind) {
		for (let i = 0, len = this.length; i < len; ++i) if (await fnFind(this[i], i, this)) return this[i];
	},
});

Array.prototype.pSerialAwaitSome || Object.defineProperty(Array.prototype, "pSerialAwaitSome", {
	enumerable: false,
	writable: true,
	value: async function (fnSome) {
		for (let i = 0, len = this.length; i < len; ++i) if (await fnSome(this[i], i, this)) return true;
		return false;
	},
});

Array.prototype.pSerialAwaitFirst || Object.defineProperty(Array.prototype, "pSerialAwaitFirst", {
	enumerable: false,
	writable: true,
	value: async function (fnMapFind) {
		for (let i = 0, len = this.length; i < len; ++i) {
			const result = await fnMapFind(this[i], i, this);
			if (result) return result;
		}
	},
});

Array.prototype.pSerialAwaitReduce || Object.defineProperty(Array.prototype, "pSerialAwaitReduce", {
	enumerable: false,
	writable: true,
	value: async function (fnReduce, initialValue) {
		let accumulator = initialValue === undefined ? this[0] : initialValue;
		for (let i = (initialValue === undefined ? 1 : 0), len = this.length; i < len; ++i) {
			accumulator = await fnReduce(accumulator, this[i], i, this);
		}
		return accumulator;
	},
});

Array.prototype.unique || Object.defineProperty(Array.prototype, "unique", {
	enumerable: false,
	writable: true,
	value: function (fnGetProp) {
		const seen = new Set();
		return this.filter((...args) => {
			const val = fnGetProp ? fnGetProp(...args) : args[0];
			if (seen.has(val)) return false;
			seen.add(val);
			return true;
		});
	},
});

Array.prototype.zip || Object.defineProperty(Array.prototype, "zip", {
	enumerable: false,
	writable: true,
	value: function (otherArray) {
		const out = [];
		const len = Math.max(this.length, otherArray.length);
		for (let i = 0; i < len; ++i) {
			out.push([this[i], otherArray[i]]);
		}
		return out;
	},
});

Array.prototype.nextWrap || Object.defineProperty(Array.prototype, "nextWrap", {
	enumerable: false,
	writable: true,
	value: function (item) {
		const ix = this.indexOf(item);
		if (~ix) {
			if (ix + 1 < this.length) return this[ix + 1];
			else return this[0];
		} else return this.last();
	},
});

Array.prototype.prevWrap || Object.defineProperty(Array.prototype, "prevWrap", {
	enumerable: false,
	writable: true,
	value: function (item) {
		const ix = this.indexOf(item);
		if (~ix) {
			if (ix - 1 >= 0) return this[ix - 1];
			else return this.last();
		} else return this[0];
	},
});

Array.prototype.findLast || Object.defineProperty(Array.prototype, "findLast", {
	enumerable: false,
	writable: true,
	value: function (fn) {
		for (let i = this.length - 1; i >= 0; --i) if (fn(this[i])) return this[i];
	},
});

Array.prototype.findLastIndex || Object.defineProperty(Array.prototype, "findLastIndex", {
	enumerable: false,
	writable: true,
	value: function (fn) {
		for (let i = this.length - 1; i >= 0; --i) if (fn(this[i])) return i;
		return -1;
	},
});

Array.prototype.sum || Object.defineProperty(Array.prototype, "sum", {
	enumerable: false,
	writable: true,
	value: function () {
		let tmp = 0;
		const len = this.length;
		for (let i = 0; i < len; ++i) tmp += this[i];
		return tmp;
	},
});

Array.prototype.mean || Object.defineProperty(Array.prototype, "mean", {
	enumerable: false,
	writable: true,
	value: function () {
		return this.sum() / this.length;
	},
});

Array.prototype.meanAbsoluteDeviation || Object.defineProperty(Array.prototype, "meanAbsoluteDeviation", {
	enumerable: false,
	writable: true,
	value: function () {
		const mean = this.mean();
		return (this.map(num => Math.abs(num - mean)) || []).mean();
	},
});

Map.prototype.getOrSet || Object.defineProperty(Map.prototype, "getOrSet", {
	enumerable: false,
	writable: true,
	value: function (k, orV) {
		if (this.has(k)) return this.get(k);
		this.set(k, orV);
		return orV;
	},
});

// OVERLAY VIEW ========================================================================================================
/**
 * Relies on:
 * - page implementing HashUtil's `loadSubHash` with handling to show/hide the book view based on hashKey changes
 * - page running no-argument `loadSubHash` when `hashchange` occurs
 *
 * @param opts Options object.
 * @param opts.hashKey to use in the URL so that forward/back can open/close the view
 * @param opts.$btnOpen jQuery-selected button to bind click open/close
 * @param [opts.$eleNoneVisible] "error" message to display if user has not selected any viewable content
 * @param opts.pageTitle Title.
 * @param opts.state State to modify when opening/closing.
 * @param opts.stateKey Key in state to set true/false when opening/closing.
 * @param [opts.hasPrintColumns] True if the overlay should contain a dropdown for adjusting print columns.
 * @param [opts.isHideContentOnNoneShown]
 * @param [opts.isHideButtonCloseNone]
 * @constructor
 *
 * @abstract
 */
class BookModeViewBase {
	static _BOOK_VIEW_COLUMNS_K = "bookViewColumns";

	_hashKey;
	_stateKey;
	_pageTitle;
	_isColumns = true;
	_hasPrintColumns = false;

	constructor (opts) {
		opts = opts || {};
		const {$btnOpen, state} = opts;

		if (this._hashKey && this._stateKey) throw new Error(`Only one of "hashKey" and "stateKey" may be specified!`);

		this._state = state;
		this._$btnOpen = $btnOpen;

		this._isActive = false;
		this._$wrpBook = null;

		this._$btnOpen.off("click").on("click", () => this.setStateOpen());
	}

	/* -------------------------------------------- */

	setStateOpen () {
		if (this._stateKey) return this._state[this._stateKey] = true;
		Hist.cleanSetHash(`${window.location.hash}${HASH_PART_SEP}${this._hashKey}${HASH_SUB_KV_SEP}true`);
	}

	setStateClosed () {
		if (this._stateKey) return this._state[this._stateKey] = false;
		Hist.cleanSetHash(window.location.hash.replace(`${this._hashKey}${HASH_SUB_KV_SEP}true`, ""));
	}

	/* -------------------------------------------- */

	_$getWindowHeaderLhs () {
		return $(`<div class="ve-flex-v-center"></div>`);
	}

	_$getBtnWindowClose () {
		return $(`<button class="ve-btn ve-btn-xs ve-btn-danger br-0 bt-0 btl-0 btr-0 bbr-0 bbl-0 h-20p" title="Close"><span class="glyphicon glyphicon-remove"></span></button>`)
			.click(() => this.setStateClosed());
	}

	/* -------------------------------------------- */

	async _$pGetWrpControls ({$wrpContent}) {
		const $wrp = $(`<div class="w-100 ve-flex-col no-shrink no-print"></div>`);

		if (!this._hasPrintColumns) return $wrp;

		$wrp.addClass("px-2 mt-2 bb-1p pb-1");

		const onChangeColumnCount = (cols) => {
			$wrpContent.toggleClass(`bkmv__wrp--columns-1`, cols === 1);
			$wrpContent.toggleClass(`bkmv__wrp--columns-2`, cols === 2);
		};

		const lastColumns = StorageUtil.syncGetForPage(BookModeViewBase._BOOK_VIEW_COLUMNS_K);

		const $selColumns = $(`<select class="form-control input-sm">
			<option value="0">Two (book style)</option>
			<option value="1">One</option>
		</select>`)
			.change(() => {
				const val = Number($selColumns.val());
				if (val === 0) onChangeColumnCount(2);
				else onChangeColumnCount(1);

				StorageUtil.syncSetForPage(BookModeViewBase._BOOK_VIEW_COLUMNS_K, val);
			});
		if (lastColumns != null) $selColumns.val(lastColumns);
		$selColumns.change();

		const $wrpPrint = $$`<div class="w-100 ve-flex">
			<div class="ve-flex-vh-center"><div class="mr-2 no-wrap help-subtle" title="Applied when printing the page.">Print columns:</div>${$selColumns}</div>
		</div>`.appendTo($wrp);

		return {$wrp, $wrpPrint};
	}

	/* -------------------------------------------- */

	_$getEleNoneVisible () { return null; }

	_$getBtnNoneVisibleClose () {
		return $(`<button class="ve-btn ve-btn-default">Close</button>`)
			.click(() => this.setStateClosed());
	}

	/** @abstract */
	async _pGetRenderContentMeta ({$wrpContent, $wrpContentOuter}) {
		return {cntSelectedEnts: 0, isAnyEntityRendered: false};
	}

	/* -------------------------------------------- */

	async pOpen () {
		if (this._isActive) return;
		this._isActive = true;

		document.title = `${this._pageTitle} - 5etools`;
		document.body.style.overflow = "hidden";
		document.body.classList.add("bkmv-active");

		const {$wrpContentOuter, $wrpContent} = await this._pGetContentElementMetas();

		this._$wrpBook = $$`<div class="bkmv print__h-initial ve-flex-col print__ve-block">
			<div class="bkmv__spacer-name no-print split-v-center no-shrink no-print">${this._$getWindowHeaderLhs()}${this._$getBtnWindowClose()}</div>
			${(await this._$pGetWrpControls({$wrpContent})).$wrp}
			${$wrpContentOuter}
		</div>`
			.appendTo(document.body);
	}

	async _pGetContentElementMetas () {
		const $wrpContent = $(`<div class="bkmv__scroller smooth-scroll ve-overflow-y-auto print__overflow-visible ${this._isColumns ? "bkmv__wrp" : "ve-flex-col"} w-100 min-h-0"></div>`);

		const $wrpContentOuter = $$`<div class="h-100 print__h-initial w-100 min-h-0 ve-flex-col print__ve-block">${$wrpContent}</div>`;

		const out = {
			$wrpContentOuter,
			$wrpContent,
		};

		const {cntSelectedEnts, isAnyEntityRendered} = await this._pGetRenderContentMeta({$wrpContent, $wrpContentOuter});

		if (isAnyEntityRendered) $wrpContentOuter.append($wrpContent);

		if (cntSelectedEnts) return out;

		$wrpContentOuter.append(this._$getEleNoneVisible());

		return out;
	}

	teardown () {
		if (!this._isActive) return;

		document.body.style.overflow = "";
		document.body.classList.remove("bkmv-active");

		this._$wrpBook.remove();
		this._isActive = false;
	}

	async pHandleSub (sub) {
		if (this._stateKey) return sub; // Assume anything with state will handle this itself.

		const bookViewHash = sub.find(it => it.startsWith(this._hashKey));
		if (!bookViewHash) {
			this.teardown();
			return sub;
		}

		if (UrlUtil.unpackSubHash(bookViewHash)[this._hashKey][0] === "true") await this.pOpen();
		return sub.filter(it => !it.startsWith(this._hashKey));
	}
}

// CONTENT EXCLUSION ===================================================================================================
globalThis.ExcludeUtil = {
	isInitialised: false,
	_excludes: null,
	_cache_excludesLookup: null,
	_lock: null,

	async pInitialise ({lockToken = null} = {}) {
		try {
			await ExcludeUtil._lock.pLock({token: lockToken});
			await ExcludeUtil._pInitialise();
		} finally {
			ExcludeUtil._lock.unlock();
		}
	},

	async _pInitialise () {
		if (ExcludeUtil.isInitialised) return;

		ExcludeUtil.pSave = MiscUtil.throttle(ExcludeUtil._pSave, 50);
		try {
			ExcludeUtil._excludes = ExcludeUtil._getValidExcludes(
				await StorageUtil.pGet(VeCt.STORAGE_EXCLUDES) || [],
			);
		} catch (e) {
			JqueryUtil.doToast({
				content: "Error when loading content blocklist! Purged blocklist data. (See the log for more information.)",
				type: "danger",
			});
			try {
				await StorageUtil.pRemove(VeCt.STORAGE_EXCLUDES);
			} catch (e) {
				setTimeout(() => { throw e; });
			}
			ExcludeUtil._excludes = null;
			window.location.hash = "";
			setTimeout(() => { throw e; });
		}
		ExcludeUtil.isInitialised = true;
	},

	_getValidExcludes (excludes) {
		return excludes
			.filter(it => it.hash) // remove legacy rows
			.filter(it => it.hash != null && it.category != null && it.source != null); // remove invalid rows
	},

	getList () {
		return MiscUtil.copyFast(ExcludeUtil._excludes || []);
	},

	async pSetList (toSet) {
		ExcludeUtil._excludes = toSet;
		ExcludeUtil._cache_excludesLookup = null;
		await ExcludeUtil.pSave();
	},

	async pExtendList (toAdd) {
		try {
			const lockToken = await ExcludeUtil._lock.pLock();
			await ExcludeUtil._pExtendList({toAdd, lockToken});
		} finally {
			ExcludeUtil._lock.unlock();
		}
	},

	async _pExtendList ({toAdd, lockToken}) {
		await ExcludeUtil.pInitialise({lockToken});
		this._doBuildCache();

		const out = MiscUtil.copyFast(ExcludeUtil._excludes || []);
		MiscUtil.copyFast(toAdd || [])
			.filter(({hash, category, source}) => {
				if (!hash || !category || !source) return false;
				const cacheUid = ExcludeUtil._getCacheUids(hash, category, source, true);
				return !ExcludeUtil._cache_excludesLookup[cacheUid];
			})
			.forEach(it => out.push(it));

		await ExcludeUtil.pSetList(out);
	},

	_doBuildCache () {
		if (ExcludeUtil._cache_excludesLookup) return;
		if (!ExcludeUtil._excludes) return;

		ExcludeUtil._cache_excludesLookup = {};
		ExcludeUtil._excludes.forEach(({source, category, hash}) => {
			const cacheUid = ExcludeUtil._getCacheUids(hash, category, source, true);
			ExcludeUtil._cache_excludesLookup[cacheUid] = true;
		});
	},

	_getCacheUids (hash, category, source, isExact) {
		hash = (hash || "").toLowerCase();
		category = (category || "").toLowerCase();
		source = (source?.source || source || "").toLowerCase();

		const exact = `${hash}__${category}__${source}`;
		if (isExact) return [exact];

		return [
			`${hash}__${category}__${source}`,
			`*__${category}__${source}`,
			`${hash}__*__${source}`,
			`${hash}__${category}__*`,
			`*__*__${source}`,
			`*__${category}__*`,
			`${hash}__*__*`,
			`*__*__*`,
		];
	},

	_excludeCount: 0,
	/**
	 * @param hash
	 * @param category
	 * @param source
	 * @param [opts]
	 * @param [opts.isNoCount]
	 */
	isExcluded (hash, category, source, opts) {
		if (!ExcludeUtil._excludes || !ExcludeUtil._excludes.length) return false;
		if (!source) throw new Error(`Entity had no source!`);
		opts = opts || {};

		this._doBuildCache();

		hash = (hash || "").toLowerCase();
		category = (category || "").toLowerCase();
		source = (source.source || source || "").toLowerCase();

		const isExcluded = ExcludeUtil._isExcluded(hash, category, source);
		if (!isExcluded) return isExcluded;

		if (!opts.isNoCount) ++ExcludeUtil._excludeCount;

		return isExcluded;
	},

	_isExcluded (hash, category, source) {
		for (const cacheUid of ExcludeUtil._getCacheUids(hash, category, source)) {
			if (ExcludeUtil._cache_excludesLookup[cacheUid]) return true;
		}
		return false;
	},

	isAllContentExcluded (list) { return (!list.length && ExcludeUtil._excludeCount) || (list.length > 0 && list.length === ExcludeUtil._excludeCount); },
	getAllContentBlocklistedHtml () { return `<div class="initial-message initial-message--med">(All content <a href="blocklist.html">blocklisted</a>)</div>`; },

	async _pSave () {
		return StorageUtil.pSet(VeCt.STORAGE_EXCLUDES, ExcludeUtil._excludes);
	},

	// The throttled version, available post-initialisation
	async pSave () { /* no-op */ },
};

// EXTENSIONS ==========================================================================================================
globalThis.ExtensionUtil = class {
	static ACTIVE = false;

	static _doSend (type, data) {
		const detail = MiscUtil.copy({type, data}); // Note that this needs to include `JSON.parse` to function
		window.dispatchEvent(new CustomEvent("rivet.send", {detail}));
	}

	static async pDoSendStats (evt, ele) {
		const {page, source, hash, extensionData} = ExtensionUtil._getElementData({ele});

		if (page && source && hash) {
			let toSend = ExtensionUtil._getEmbeddedFromCache(page, source, hash)
				|| await DataLoader.pCacheAndGet(page, source, hash);

			if (extensionData) {
				switch (page) {
					case UrlUtil.PG_BESTIARY: {
						if (extensionData._scaledCr) toSend = await ScaleCreature.scale(toSend, extensionData._scaledCr);
						else if (extensionData._scaledSpellSummonLevel) toSend = await ScaleSpellSummonedCreature.scale(toSend, extensionData._scaledSpellSummonLevel);
						else if (extensionData._scaledClassSummonLevel) toSend = await ScaleClassSummonedCreature.scale(toSend, extensionData._scaledClassSummonLevel);
					}
				}
			}

			ExtensionUtil._doSend("entity", {page, entity: toSend, isTemp: !!evt.shiftKey});
		}
	}

	static async doDragStart (evt, ele) {
		const {page, source, hash} = ExtensionUtil._getElementData({ele});
		const meta = {
			type: VeCt.DRAG_TYPE_IMPORT,
			page,
			source,
			hash,
		};
		evt.dataTransfer.setData("application/json", JSON.stringify(meta));
	}

	static _getElementData ({ele}) {
		const $parent = $(ele).closest(`[data-page]`);
		const page = $parent.attr("data-page");
		const source = $parent.attr("data-source");
		const hash = $parent.attr("data-hash");
		const rawExtensionData = $parent.attr("data-extension");
		const extensionData = rawExtensionData ? JSON.parse(rawExtensionData) : null;

		return {page, source, hash, extensionData};
	}

	static pDoSendStatsPreloaded ({page, entity, isTemp, options}) {
		ExtensionUtil._doSend("entity", {page, entity, isTemp, options});
	}

	static pDoSendCurrency ({currency}) {
		ExtensionUtil._doSend("currency", {currency});
	}

	static doSendRoll (data) { ExtensionUtil._doSend("roll", data); }

	static pDoSend ({type, data}) { ExtensionUtil._doSend(type, data); }

	/* -------------------------------------------- */

	static _CACHE_EMBEDDED_STATS = {};

	static addEmbeddedToCache (page, source, hash, ent) {
		MiscUtil.set(ExtensionUtil._CACHE_EMBEDDED_STATS, page.toLowerCase(), source.toLowerCase(), hash.toLowerCase(), MiscUtil.copyFast(ent));
	}

	static _getEmbeddedFromCache (page, source, hash) {
		return MiscUtil.get(ExtensionUtil._CACHE_EMBEDDED_STATS, page.toLowerCase(), source.toLowerCase(), hash.toLowerCase());
	}

	/* -------------------------------------------- */
};
if (typeof window !== "undefined") window.addEventListener("rivet.active", () => ExtensionUtil.ACTIVE = true);

// LOCKS ===============================================================================================================
/**
 * @param {string} name
 * @param {boolean} isDbg
 * @constructor
 */
globalThis.VeLock = function ({name = null, isDbg = false} = {}) {
	this._MSG_PAD_LEN = 8;

	this._name = name;
	this._isDbg = isDbg;
	this._lockMeta = null;

	this._getCaller = () => {
		return (new Error()).stack.split("\n")[3].trim();
	};

	this.pLock = async ({token = null} = {}) => {
		if (token != null && this._lockMeta?.token === token) {
			++this._lockMeta.depth;
			// eslint-disable-next-line no-console
			if (this._isDbg) console.warn(`Lock ${"add".padEnd(this._MSG_PAD_LEN, " ")} "${this._name || "(unnamed)"}" (now ${this._lockMeta.depth}) at ${this._getCaller()}`);
			return token;
		}

		while (this._lockMeta) await this._lockMeta.lock;

		// eslint-disable-next-line no-console
		if (this._isDbg) console.warn(`Lock ${"acquired".padEnd(this._MSG_PAD_LEN, " ")} "${this._name || "(unnamed)"}" at ${this._getCaller()}`);

		let unlock = null;
		const lock = new Promise(resolve => unlock = resolve);
		this._lockMeta = {
			lock,
			unlock,
			token: CryptUtil.uid(),
			depth: 0,
		};

		return this._lockMeta.token;
	};

	this.unlock = () => {
		if (!this._lockMeta) return;

		if (this._lockMeta.depth > 0) {
			// eslint-disable-next-line no-console
			if (this._isDbg) console.warn(`Lock ${"sub".padEnd(this._MSG_PAD_LEN, " ")} "${this._name || "(unnamed)"}" (now ${this._lockMeta.depth - 1}) at ${this._getCaller()}`);
			return --this._lockMeta.depth;
		}

		// eslint-disable-next-line no-console
		if (this._isDbg) console.warn(`Lock ${"released".padEnd(this._MSG_PAD_LEN, " ")} "${this._name || "(unnamed)"}" at ${this._getCaller()}`);

		const lockMeta = this._lockMeta;
		this._lockMeta = null;
		lockMeta.unlock();
	};
};
ExcludeUtil._lock = new VeLock();

// DATETIME ============================================================================================================
globalThis.DatetimeUtil = {
	getDateStr ({date, isShort = false, isPad = false} = {}) {
		const month = DatetimeUtil._MONTHS[date.getMonth()];
		return `${isShort ? month.substring(0, 3) : month} ${isPad && date.getDate() < 10 ? "\u00A0" : ""}${Parser.getOrdinalForm(date.getDate())}, ${date.getFullYear()}`;
	},

	getDatetimeStr ({date, isPlainText = false} = {}) {
		date = date ?? new Date();
		const monthName = DatetimeUtil._MONTHS[date.getMonth()];
		return `${date.getDate()} ${!isPlainText ? `<span title="${monthName}">` : ""}${monthName.substring(0, 3)}.${!isPlainText ? `</span>` : ""} ${date.getFullYear()}, ${DatetimeUtil._getPad2(date.getHours())}:${DatetimeUtil._getPad2(date.getMinutes())}:${DatetimeUtil._getPad2(date.getSeconds())}`;
	},

	_getPad2 (num) { return `${num}`.padStart(2, "0"); },

	getIntervalStr (millis) {
		if (millis < 0 || isNaN(millis)) return "(Unknown interval)";

		const s = number => (number !== 1) ? "s" : "";

		const stack = [];

		let numSecs = Math.floor(millis / 1000);

		const numYears = Math.floor(numSecs / DatetimeUtil._SECS_PER_YEAR);
		if (numYears) {
			stack.push(`${numYears} year${s(numYears)}`);
			numSecs = numSecs - (numYears * DatetimeUtil._SECS_PER_YEAR);
		}

		const numDays = Math.floor(numSecs / DatetimeUtil._SECS_PER_DAY);
		if (numDays) {
			stack.push(`${numDays} day${s(numDays)}`);
			numSecs = numSecs - (numDays * DatetimeUtil._SECS_PER_DAY);
		}

		const numHours = Math.floor(numSecs / DatetimeUtil._SECS_PER_HOUR);
		if (numHours) {
			stack.push(`${numHours} hour${s(numHours)}`);
			numSecs = numSecs - (numHours * DatetimeUtil._SECS_PER_HOUR);
		}

		const numMinutes = Math.floor(numSecs / DatetimeUtil._SECS_PER_MINUTE);
		if (numMinutes) {
			stack.push(`${numMinutes} minute${s(numMinutes)}`);
			numSecs = numSecs - (numMinutes * DatetimeUtil._SECS_PER_MINUTE);
		}

		if (numSecs) stack.push(`${numSecs} second${s(numSecs)}`);
		else if (!stack.length) stack.push("less than a second"); // avoid adding this if there's already info

		return stack.join(", ");
	},
};
DatetimeUtil._MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
DatetimeUtil._SECS_PER_YEAR = 31536000;
DatetimeUtil._SECS_PER_DAY = 86400;
DatetimeUtil._SECS_PER_HOUR = 3600;
DatetimeUtil._SECS_PER_MINUTE = 60;

globalThis.EditorUtil = {
	getTheme () {
		const {isNight} = styleSwitcher.getSummary();
		return isNight ? "ace/theme/tomorrow_night" : "ace/theme/textmate";
	},

	initEditor (id, additionalOpts = null) {
		additionalOpts = additionalOpts || {};

		const editor = ace.edit(id);
		editor.setOptions({
			theme: EditorUtil.getTheme(),
			wrap: true,
			showPrintMargin: false,
			tabSize: 2,
			useWorker: false,
			...additionalOpts,
		});

		if (additionalOpts.mode === "ace/mode/json") {
			// Escape backslashes when pasting JSON, unless CTRL+SHIFT are pressed
			editor.on("paste", (evt) => {
				if (EventUtil.isShiftDown() && EventUtil.isCtrlMetaDown()) return;
				try {
					// If valid JSON (ignoring trailing comma), we assume slashes are already escaped
					JSON.parse(evt.text.replace(/,?\s*/, ""));
				} catch (e) {
					evt.text = evt.text.replace(/\\/g, "\\\\");
				}
			});
		}

		styleSwitcher.addFnOnChange(() => editor.setOptions({theme: EditorUtil.getTheme()}));

		return editor;
	},
};

globalThis.BrowserUtil = class {
	static isFirefox () {
		return navigator.userAgent.includes("Firefox");
	}
};

// MISC WEBPAGE ONLOADS ================================================================================================
if (!IS_VTT && typeof window !== "undefined") {
	window.addEventListener("load", () => {
		const docRoot = document.querySelector(":root");

		// TODO(iOS)
		if (CSS?.supports("top: constant(safe-area-inset-top)")) {
			docRoot.style.setProperty("--safe-area-inset-top", "constant(safe-area-inset-top, 0)");
			docRoot.style.setProperty("--safe-area-inset-right", "constant(safe-area-inset-right, 0)");
			docRoot.style.setProperty("--safe-area-inset-bottom", "constant(safe-area-inset-bottom, 0)");
			docRoot.style.setProperty("--safe-area-inset-left", "constant(safe-area-inset-left, 0)");
		} else if (CSS?.supports("top: env(safe-area-inset-top)")) {
			docRoot.style.setProperty("--safe-area-inset-top", "env(safe-area-inset-top, 0)");
			docRoot.style.setProperty("--safe-area-inset-right", "env(safe-area-inset-right, 0)");
			docRoot.style.setProperty("--safe-area-inset-bottom", "env(safe-area-inset-bottom, 0)");
			docRoot.style.setProperty("--safe-area-inset-left", "env(safe-area-inset-left, 0)");
		}
	});

	window.addEventListener("load", () => {
		Renderer.dice.bindOnclickListener(document.body);
		Renderer.events.bindGeneric();
	});

	// region Cancer
	const isDbgCancer = false;

	if (location.hostname.endsWith(VeCt.LOC_HOSTNAME_CANCER)) {
		const ivsCancer = [];
		let anyFound = false;

		window.addEventListener("load", () => {
			let isPadded = false;
			[
				"div-gpt-ad-5etools35927", // main banner
				"div-gpt-ad-5etools35930", // side banner
				"div-gpt-ad-5etools35928", // sidebar top
				"div-gpt-ad-5etools35929", // sidebar bottom
				"div-gpt-ad-5etools36159", // bottom floater
				"div-gpt-ad-5etools36834", // mobile middle
			].forEach(id => {
				const iv = setInterval(() => {
					const $wrp = $(`#${id}`);
					if (!$wrp.length) return;
					if (!$wrp.children().length) return;
					if ($wrp.children()[0].tagName === "SCRIPT") return;
					const $tgt = $wrp.closest(".cancer__anchor").find(".cancer__disp-cancer");
					if ($tgt.length) {
						anyFound = true;
						$tgt.css({display: "flex"}).text("Advertisements");
						clearInterval(iv);
					}
				}, 250);

				ivsCancer.push(iv);
			});

			const ivPad = setInterval(() => {
				if (!anyFound) return;
				if (isPadded) return;
				isPadded = true;
				// Pad the bottom of the page so the adhesive unit doesn't overlap the content
				$(`.view-col-group--cancer`).append(`<div class="w-100 no-shrink" style="height: 110px;"></div>`);
			}, 300);
			ivsCancer.push(ivPad);
		});

		// Hack to lock the ad space at a fixed size--prevents the screen from shifting around once loaded
		setTimeout(() => {
			const $wrp = $(`.cancer__wrp-leaderboard-inner`);
			if (anyFound) $wrp.css({height: 90});
			ivsCancer.forEach(iv => clearInterval(iv));
		}, 6500);
	} else {
		if (!isDbgCancer) window.addEventListener("load", () => $(`.cancer__anchor`).remove());
	}

	if (isDbgCancer) {
		window.addEventListener("load", () => {
			$(`.cancer__sidebar-inner--top`).append(`<div style="width: 300px; height: 600px; background: #f0f;"></div>`);
			$(`.cancer__sidebar-inner--bottom`).append(`<div style="width: 300px; height: 600px; background: #f0f;"></div>`);
		});
	}
	// endregion
}
