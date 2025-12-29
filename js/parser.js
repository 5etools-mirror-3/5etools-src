"use strict";

// PARSING =============================================================================================================
globalThis.Parser = {};

Parser._parse_aToB = function (abMap, a, fallback) {
	if (a === undefined || a === null) throw new TypeError("undefined or null object passed to parser");
	if (typeof a === "string") a = a.trim();
	if (abMap[a] !== undefined) return abMap[a];
	return fallback !== undefined ? fallback : a;
};

Parser._parse_bToA = function (abMap, b, fallback) {
	if (b === undefined || b === null) throw new TypeError("undefined or null object passed to parser");
	if (typeof b === "string") b = b.trim();
	for (const v in abMap) {
		if (!abMap.hasOwnProperty(v)) continue;
		if (abMap[v] === b) return v;
	}
	return fallback !== undefined ? fallback : b;
};

Parser.attrChooseToFull = function (attList) {
	if (attList.length === 1) return `${Parser.attAbvToFull(attList[0])}${attList[0] === "spellcasting" ? " ability" : ""} modifier`;
	else {
		const attsTemp = [];
		for (let i = 0; i < attList.length; ++i) {
			attsTemp.push(Parser.attAbvToFull(attList[i]));
		}
		return `${attsTemp.join(" or ")} modifier (your choice)`;
	}
};

Parser.numberToText = function (number, {isOrdinalForm = false} = {}) {
	if (number == null) throw new TypeError(`undefined or null object passed to parser`);
	if (Math.abs(number) >= 100) return isOrdinalForm ? Parser.getOrdinalForm(number) : `${number}`;

	return `${number < 0 ? "negative " : ""}${Parser.numberToText._getPositiveNumberAsText({number: Math.abs(number), isOrdinalForm})}`;
};

Parser.numberToText._getPositiveNumberAsText = ({number, isOrdinalForm}) => {
	const [preDotRaw, postDotRaw] = `${number}`.split(".");

	if (!postDotRaw) return Parser.numberToText._getPositiveIntegerAsText({number, isOrdinalForm});

	if (isOrdinalForm) return `${preDotRaw}.${Parser.getOrdinalForm(postDotRaw)}`;

	const {str: strPostDot, isPretty: isPrettyPostDot} = Parser.numberToText._getPostDot({postDotRaw});

	if (!isPrettyPostDot) return `${number}`;

	return preDotRaw === "0"
		? strPostDot
		: `${Parser.numberToText._getPositiveIntegerAsText({number: Math.trunc(number), isOrdinalForm})} and ${strPostDot}`;
};

Parser.numberToText._getPostDot = ({postDotRaw}) => {
	// See also: `Parser.numberToVulgar`
	switch (postDotRaw) {
		case "125": return {str: `one-eighth`, isPretty: true};
		case "2": return {str: `one-fifth`, isPretty: true};
		case "25": return {str: `one-quarter`, isPretty: true};
		case "375": return {str: `three-eighths`, isPretty: true};
		case "4": return {str: `two-fifths`, isPretty: true};
		case "5": return {str: `one-half`, isPretty: true};
		case "6": return {str: `three-fifths`, isPretty: true};
		case "625": return {str: `five-eighths`, isPretty: true};
		case "75": return {str: `three-quarters`, isPretty: true};
		case "8": return {str: `four-fifths`, isPretty: true};
		case "875": return {str: `seven-eighths`, isPretty: true};

		default: {
			// Handle recursive
			const asNum = Number(`0.${postDotRaw}`);

			if (asNum.toFixed(2) === (1 / 3).toFixed(2)) return {str: `one-third`, isPretty: true};
			if (asNum.toFixed(2) === (2 / 3).toFixed(2)) return {str: `two-thirds`, isPretty: true};

			if (asNum.toFixed(2) === (1 / 6).toFixed(2)) return {str: `one-sixth`, isPretty: true};
			if (asNum.toFixed(2) === (5 / 6).toFixed(2)) return {str: `five-sixths`, isPretty: true};

			return {str: `${postDotRaw}`, isPretty: false};
		}
	}
};

Parser.numberToText._getPositiveIntegerAsText = ({number, isOrdinalForm}) => {
	switch (number) {
		case 0: return Parser.numberToText._getOptionallyOrdinal({number, str: "zero", isOrdinalForm});
		case 1: return Parser.numberToText._getOptionallyOrdinal({number, str: "one", isOrdinalForm});
		case 2: return Parser.numberToText._getOptionallyOrdinal({number, str: "two", isOrdinalForm});
		case 3: return Parser.numberToText._getOptionallyOrdinal({number, str: "three", isOrdinalForm});
		case 4: return Parser.numberToText._getOptionallyOrdinal({number, str: "four", isOrdinalForm});
		case 5: return Parser.numberToText._getOptionallyOrdinal({number, str: "five", isOrdinalForm});
		case 6: return Parser.numberToText._getOptionallyOrdinal({number, str: "six", isOrdinalForm});
		case 7: return Parser.numberToText._getOptionallyOrdinal({number, str: "seven", isOrdinalForm});
		case 8: return Parser.numberToText._getOptionallyOrdinal({number, str: "eight", isOrdinalForm});
		case 9: return Parser.numberToText._getOptionallyOrdinal({number, str: "nine", isOrdinalForm});
		case 10: return Parser.numberToText._getOptionallyOrdinal({number, str: "ten", isOrdinalForm});
		case 11: return Parser.numberToText._getOptionallyOrdinal({number, str: "eleven", isOrdinalForm});
		case 12: return Parser.numberToText._getOptionallyOrdinal({number, str: "twelve", isOrdinalForm});
		case 13: return Parser.numberToText._getOptionallyOrdinal({number, str: "thirteen", isOrdinalForm});
		case 14: return Parser.numberToText._getOptionallyOrdinal({number, str: "fourteen", isOrdinalForm});
		case 15: return Parser.numberToText._getOptionallyOrdinal({number, str: "fifteen", isOrdinalForm});
		case 16: return Parser.numberToText._getOptionallyOrdinal({number, str: "sixteen", isOrdinalForm});
		case 17: return Parser.numberToText._getOptionallyOrdinal({number, str: "seventeen", isOrdinalForm});
		case 18: return Parser.numberToText._getOptionallyOrdinal({number, str: "eighteen", isOrdinalForm});
		case 19: return Parser.numberToText._getOptionallyOrdinal({number, str: "nineteen", isOrdinalForm});
		case 20: return Parser.numberToText._getOptionallyOrdinal({number, str: "twenty", isOrdinalForm});
		case 30: return Parser.numberToText._getOptionallyOrdinal({number, str: "thirty", isOrdinalForm});
		case 40: return Parser.numberToText._getOptionallyOrdinal({number, str: "forty", isOrdinalForm});
		case 50: return Parser.numberToText._getOptionallyOrdinal({number, str: "fifty", isOrdinalForm});
		case 60: return Parser.numberToText._getOptionallyOrdinal({number, str: "sixty", isOrdinalForm});
		case 70: return Parser.numberToText._getOptionallyOrdinal({number, str: "seventy", isOrdinalForm});
		case 80: return Parser.numberToText._getOptionallyOrdinal({number, str: "eighty", isOrdinalForm});
		case 90: return Parser.numberToText._getOptionallyOrdinal({number, str: "ninety", isOrdinalForm});
		default: {
			const str = String(number);
			return `${Parser.numberToText._getPositiveIntegerAsText({number: Number(`${str[0]}0`)})}-${Parser.numberToText._getPositiveIntegerAsText({number: Number(str[1]), isOrdinalForm})}`;
		}
	}
};

Parser.numberToText._getOptionallyOrdinal = ({number, str, isOrdinalForm}) => {
	if (!isOrdinalForm) return str;
	switch (number) {
		case 1: return "first";
		case 2: return "second";
		case 3: return "third";
	}
	if (str.endsWith("y")) return `${str.slice(0, -1)}ieth`;
	if (str.endsWith("ve")) return `${str.slice(0, -2)}fth`;
	return `${str}th`;
};

Parser.textToNumber = function (str) {
	str = str.trim().toLowerCase();
	if (!isNaN(str)) return Number(str);
	switch (str) {
		case "zero": return 0;
		case "one": case "a": case "an": case "first": return 1;
		case "two": case "double": case "second": return 2;
		case "three": case "triple": case "third": return 3;
		case "four": case "quadruple": case "fourth": return 4;
		case "five": case "fifth": return 5;
		case "six": case "sixth": return 6;
		case "seven": case "seventh": return 7;
		case "eight": case "eighth": return 8;
		case "nine": case "ninth": return 9;
		case "ten": case "tenth": return 10;
		case "eleven": return 11;
		case "twelve": return 12;
		case "thirteen": return 13;
		case "fourteen": return 14;
		case "fifteen": return 15;
		case "sixteen": return 16;
		case "seventeen": return 17;
		case "eighteen": return 18;
		case "nineteen": return 19;
		case "twenty": return 20;
		case "thirty": return 30;
		case "forty": return 40;
		case "fifty": return 50;
		case "sixty": return 60;
		case "seventy": return 70;
		case "eighty": return 80;
		case "ninety": return 90;
	}
	return NaN;
};

Parser.numberToVulgar = function (number, {isFallbackOnFractional = true} = {}) {
	const isNeg = number < 0;
	const spl = `${number}`.replace(/^-/, "").split(".");
	if (spl.length === 1) return number;

	let preDot = spl[0] === "0" ? "" : spl[0];
	if (isNeg) preDot = `-${preDot}`;

	// See also: `Parser.numberToText._getPositiveNumberAsText`
	switch (spl[1]) {
		case "125": return `${preDot}⅛`;
		case "2": return `${preDot}⅕`;
		case "25": return `${preDot}¼`;
		case "375": return `${preDot}⅜`;
		case "4": return `${preDot}⅖`;
		case "5": return `${preDot}½`;
		case "6": return `${preDot}⅗`;
		case "625": return `${preDot}⅝`;
		case "75": return `${preDot}¾`;
		case "8": return `${preDot}⅘`;
		case "875": return `${preDot}⅞`;

		default: {
			// Handle recursive
			const asNum = Number(`0.${spl[1]}`);

			if (asNum.toFixed(2) === (1 / 3).toFixed(2)) return `${preDot}⅓`;
			if (asNum.toFixed(2) === (2 / 3).toFixed(2)) return `${preDot}⅔`;

			if (asNum.toFixed(2) === (1 / 6).toFixed(2)) return `${preDot}⅙`;
			if (asNum.toFixed(2) === (5 / 6).toFixed(2)) return `${preDot}⅚`;
		}
	}

	return isFallbackOnFractional ? Parser.numberToFractional(number) : null;
};

Parser.vulgarToNumber = function (str) {
	const [, leading = "0", vulgar = ""] = /^(\d+)?([⅛¼⅜½⅝¾⅞⅓⅔⅙⅚])?$/.exec(str) || [];
	let out = Number(leading);
	switch (vulgar) {
		case "⅛": out += 0.125; break;
		case "¼": out += 0.25; break;
		case "⅜": out += 0.375; break;
		case "½": out += 0.5; break;
		case "⅝": out += 0.625; break;
		case "¾": out += 0.75; break;
		case "⅞": out += 0.875; break;
		case "⅓": out += 1 / 3; break;
		case "⅔": out += 2 / 3; break;
		case "⅙": out += 1 / 6; break;
		case "⅚": out += 5 / 6; break;
		case "": break;
		default: throw new Error(`Unhandled vulgar part "${vulgar}"`);
	}
	return out;
};

Parser.numberToSuperscript = function (number) {
	return `${number}`.split("").map(c => isNaN(c) ? c : Parser._NUMBERS_SUPERSCRIPT[Number(c)]).join("");
};
Parser._NUMBERS_SUPERSCRIPT = "⁰¹²³⁴⁵⁶⁷⁸⁹";

Parser.numberToSubscript = function (number) {
	return `${number}`.split("").map(c => isNaN(c) ? c : Parser._NUMBERS_SUBSCRIPT[Number(c)]).join("");
};
Parser._NUMBERS_SUBSCRIPT = "₀₁₂₃₄₅₆₇₈₉";

Parser._greatestCommonDivisor = function (a, b) {
	if (b < Number.EPSILON) return a;
	return Parser._greatestCommonDivisor(b, Math.floor(a % b));
};
Parser.numberToFractional = function (number) {
	const len = number.toString().length - 2;
	let denominator = 10 ** len;
	let numerator = number * denominator;
	const divisor = Parser._greatestCommonDivisor(numerator, denominator);
	numerator = Math.floor(numerator / divisor);
	denominator = Math.floor(denominator / divisor);

	return denominator === 1 ? String(numerator) : `${Math.floor(numerator)}/${Math.floor(denominator)}`;
};

Parser.isNumberNearEqual = function (a, b) {
	return Math.abs(a - b) < Number.EPSILON;
};

Parser.ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

Parser.attAbvToFull = function (abv) {
	return Parser._parse_aToB(Parser.ATB_ABV_TO_FULL, abv);
};

Parser.attFullToAbv = function (full) {
	return Parser._parse_bToA(Parser.ATB_ABV_TO_FULL, full);
};

Parser.sizeAbvToFull = function (abv) {
	return Parser._parse_aToB(Parser.SIZE_ABV_TO_FULL, abv);
};

Parser.getAbilityModNumber = function (abilityScore) {
	return Math.floor((abilityScore - 10) / 2);
};

Parser.getAbilityModifier = function (abilityScore) {
	let modifier = Parser.getAbilityModNumber(abilityScore);
	if (modifier >= 0) modifier = `+${modifier}`;
	return `${modifier}`;
};

Parser.getSpeedString = (ent, {isMetric = false, isSkipZeroWalk = false, isLongForm = false, styleHint = null} = {}) => {
	if (ent.speed == null) return "\u2014";

	styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

	const unit = isMetric
		? Parser.metric.getMetricUnit({originalUnit: "ft.", isShortForm: !isLongForm})
		: isLongForm ? "feet" : "ft.";
	if (typeof ent.speed === "object") {
		const stack = [];
		let joiner = ", ";

		Parser.SPEED_MODES
			.filter(mode => !ent.speed.hidden?.includes(mode))
			.forEach(mode => Parser._getSpeedString_addSpeedMode({ent, prop: mode, stack, isMetric, isSkipZeroWalk, unit, styleHint}));

		if (ent.speed.choose && !ent.speed.hidden?.includes("choose")) {
			joiner = "; ";
			stack.push(`${ent.speed.choose.from.sort().map(prop => Parser._getSpeedString_getSpeedName({prop, styleHint})).joinConjunct(", ", " or ")} ${ent.speed.choose.amount} ${unit}${ent.speed.choose.note ? ` ${ent.speed.choose.note}` : ""}`);
		}

		return stack.join(joiner) + (ent.speed.note ? ` ${ent.speed.note}` : "");
	}

	return (isMetric ? Parser.metric.getMetricNumber({originalValue: ent.speed, originalUnit: Parser.UNT_FEET}) : ent.speed)
		+ (ent.speed === "Varies" ? "" : ` ${unit} `);
};
Parser._getSpeedString_addSpeedMode = ({ent, prop, stack, isMetric, isSkipZeroWalk, unit, styleHint}) => {
	if (ent.speed[prop] || (!isSkipZeroWalk && prop === "walk")) Parser._getSpeedString_addSpeed({prop, speed: ent.speed[prop] || 0, isMetric, unit, stack, styleHint});
	if (ent.speed.alternate && ent.speed.alternate[prop]) ent.speed.alternate[prop].forEach(speed => Parser._getSpeedString_addSpeed({prop, speed, isMetric, unit, stack, styleHint}));
};
Parser._getSpeedString_addSpeed = ({prop, speed, isMetric, unit, stack, styleHint}) => {
	const ptName = Parser._getSpeedString_getSpeedName({prop, styleHint});
	const ptValue = Parser._getSpeedString_getVal({prop, speed, isMetric});
	const ptUnit = speed === true ? "" : ` ${unit}`;
	const ptCondition = Parser._getSpeedString_getCondition({speed});
	stack.push([ptName, ptValue, ptUnit, ptCondition].join(""));
};
Parser._getSpeedString_getVal = ({prop, speed, isMetric}) => {
	if (speed === true && prop !== "walk") return "equal to your walking speed";

	const num = speed === true
		? 0
		: speed.number != null ? speed.number : speed;

	return isMetric ? Parser.metric.getMetricNumber({originalValue: num, originalUnit: Parser.UNT_FEET}) : num;
};
Parser._getSpeedString_getCondition = ({speed}) => speed.condition ? ` ${Renderer.get().render(speed.condition)}` : "";
Parser._getSpeedString_getSpeedName = ({prop, styleHint}) => prop === "walk" ? "" : `${prop[styleHint === "classic" ? "toString" : "toTitleCase"]()} `;

Parser.SPEED_MODES = ["walk", "burrow", "climb", "fly", "swim"];

Parser.SPEED_TO_PROGRESSIVE = {
	"walk": "walking",
	"burrow": "burrowing",
	"climb": "climbing",
	"fly": "flying",
	"swim": "swimming",
};

Parser.speedToProgressive = function (prop) {
	return Parser._parse_aToB(Parser.SPEED_TO_PROGRESSIVE, prop);
};

Parser.raceCreatureTypesToFull = function (creatureTypes) {
	const hasSubOptions = creatureTypes.some(it => it.choose);
	return creatureTypes
		.map(it => {
			if (!it.choose) return Parser.monTypeToFullObj(it).asText;
			return [...it.choose]
				.sort(SortUtil.ascSortLower)
				.map(sub => Parser.monTypeToFullObj(sub).asText)
				.joinConjunct(", ", " or ");
		})
		.joinConjunct(hasSubOptions ? "; " : ", ", " and ");
};

Parser.crToXp = function (cr, {isDouble = false} = {}) {
	if (cr != null && cr.xp) return (isDouble ? cr.xp * 2 : cr.xp).toLocaleStringVe();

	const toConvert = cr ? (cr.cr || cr) : null;
	if (toConvert === "Unknown" || toConvert == null || !Parser.XP_CHART_ALT[toConvert]) return "Unknown";
	// CR 0 creatures can be 0 or 10 XP, but 10 XP is used in almost every case.
	//   Exceptions, such as MM's Frog and Sea Horse, have their XP set to 0 on the creature
	if (toConvert === "0") return "10";
	const xp = Parser.XP_CHART_ALT[toConvert];
	return (isDouble ? 2 * xp : xp).toLocaleStringVe();
};

Parser.crToXpNumber = function (cr) {
	if (cr != null && cr.xp) return cr.xp;
	const toConvert = cr ? (cr.cr || cr) : cr;
	if (toConvert === "Unknown" || toConvert == null) return null;
	return Parser.XP_CHART_ALT[toConvert] ?? null;
};

Parser.LEVEL_XP_REQUIRED = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];

Parser.CRS = ["0", "1/8", "1/4", "1/2", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30"];

Parser.isValidCr = function (cr) {
	return Parser.CRS.includes(cr);
};

Parser.crToNumber = function (cr, opts = {}) {
	const {isDefaultNull = false} = opts;

	if (cr === "Unknown" || cr === "\u2014" || cr == null) return isDefaultNull ? null : VeCt.CR_UNKNOWN;
	if (cr.cr) return Parser.crToNumber(cr.cr, opts);

	const parts = cr.trim().split("/").filter(Boolean);
	if (!parts.length || parts.length >= 3) return isDefaultNull ? null : VeCt.CR_CUSTOM;
	if (isNaN(parts[0])) return isDefaultNull ? null : VeCt.CR_CUSTOM;

	if (parts.length === 2) {
		if (isNaN(Number(parts[1]))) return isDefaultNull ? null : VeCt.CR_CUSTOM;
		return Number(parts[0]) / Number(parts[1]);
	}

	return Number(parts[0]);
};

Parser.numberToCr = function (number, safe) {
	// avoid dying if already-converted number is passed in
	if (safe && typeof number === "string" && Parser.CRS.includes(number)) return number;

	if (number == null) return "Unknown";

	return Parser.numberToFractional(number);
};

Parser.crToPb = function (cr) {
	const crNumber = Parser.crToNumber(cr);
	if (crNumber === VeCt.CR_UNKNOWN) return 0;
	if (crNumber === VeCt.CR_CUSTOM || crNumber < 0) return null;
	if (crNumber < 5) return 2;
	return Math.ceil(crNumber / 4) + 1;
};

Parser.levelToPb = function (level) {
	if (!level) return 2;
	return Math.ceil(level / 4) + 1;
};

Parser.SKILL_TO_ATB_ABV = {
	"athletics": "str",
	"acrobatics": "dex",
	"sleight of hand": "dex",
	"stealth": "dex",
	"arcana": "int",
	"history": "int",
	"investigation": "int",
	"nature": "int",
	"religion": "int",
	"animal handling": "wis",
	"insight": "wis",
	"medicine": "wis",
	"perception": "wis",
	"survival": "wis",
	"deception": "cha",
	"intimidation": "cha",
	"performance": "cha",
	"persuasion": "cha",
};

Parser.skillToAbilityAbv = function (skill) {
	return Parser._parse_aToB(Parser.SKILL_TO_ATB_ABV, skill);
};

Parser.SKILL_TO_SHORT = {
	"athletics": "ath",
	"acrobatics": "acro",
	"sleight of hand": "soh",
	"stealth": "slth",
	"arcana": "arc",
	"history": "hist",
	"investigation": "invn",
	"nature": "natr",
	"religion": "reli",
	"animal handling": "hndl",
	"insight": "ins",
	"medicine": "med",
	"perception": "perp",
	"survival": "surv",
	"deception": "decp",
	"intimidation": "intm",
	"performance": "perf",
	"persuasion": "pers",
};

Parser.skillToShort = function (skill) {
	return Parser._parse_aToB(Parser.SKILL_TO_SHORT, skill);
};

Parser.LANGUAGES_STANDARD = [
	"Common",
	"Dwarvish",
	"Elvish",
	"Giant",
	"Gnomish",
	"Goblin",
	"Halfling",
	"Orc",
];

Parser.LANGUAGES_EXOTIC = [
	"Abyssal",
	"Aquan",
	"Auran",
	"Celestial",
	"Draconic",
	"Deep Speech",
	"Ignan",
	"Infernal",
	"Primordial",
	"Sylvan",
	"Terran",
	"Undercommon",
];

Parser.LANGUAGES_SECRET = [
	"Druidic",
	"Thieves' cant",
];

Parser.LANGUAGES_ALL = [
	...Parser.LANGUAGES_STANDARD,
	...Parser.LANGUAGES_EXOTIC,
	...Parser.LANGUAGES_SECRET,
].sort();

Parser.acToFull = function (ac, {renderer = null, isHideFrom = false} = {}) {
	if (typeof ac === "string") return ac; // handle classic format

	renderer ||= Renderer.get();

	let stack = "";
	let inBraces = false;
	for (let i = 0; i < ac.length; ++i) {
		const cur = ac[i];
		const nxt = ac[i + 1];

		if (cur.special != null) {
			if (inBraces) inBraces = false;

			stack += cur.special;
		} else if (cur.ac) {
			const isNxtBraces = nxt && nxt.braces;

			if (!inBraces && cur.braces) {
				stack += "(";
				inBraces = true;
			}

			stack += cur.ac;

			if (!isHideFrom && cur.from) {
				// always brace nested braces
				if (cur.braces) {
					stack += " (";
				} else {
					stack += inBraces ? "; " : " (";
				}

				inBraces = true;

				stack += cur.from.map(it => renderer.render(it)).join(", ");

				if (cur.braces) {
					stack += ")";
				} else if (!isNxtBraces) {
					stack += ")";
					inBraces = false;
				}
			}

			if (cur.condition) stack += ` ${renderer.render(cur.condition)}`;

			if (inBraces && !isNxtBraces) {
				stack += ")";
				inBraces = false;
			}
		} else {
			stack += cur;
		}

		if (nxt) {
			if (nxt.braces) {
				stack += inBraces ? "; " : " (";
				inBraces = true;
			} else stack += ", ";
		}
	}
	if (inBraces) stack += ")";

	return stack.trim();
};

Parser.armorFullToAbv = function (armor) {
	return Parser._parse_bToA(Parser.ARMOR_ABV_TO_FULL, armor);
};

Parser.weaponFullToAbv = function (weapon) {
	return Parser._parse_bToA(Parser.WEAPON_ABV_TO_FULL, weapon);
};

Parser._getSourceStringFromSource = function (source) {
	if (source && source.source) return source.source;
	return source;
};
Parser._buildSourceCache = function (dict) {
	const out = {};
	Object.entries(dict).forEach(([k, v]) => out[k.toLowerCase()] = v);
	return out;
};
Parser._sourceJsonCache = null;
Parser.hasSourceJson = function (source) {
	Parser._sourceJsonCache = Parser._sourceJsonCache || Parser._buildSourceCache(Object.keys(Parser.SOURCE_JSON_TO_FULL).mergeMap(k => ({[k]: k})));
	return !!Parser._sourceJsonCache[source.toLowerCase()];
};
Parser._sourceFullCache = null;
Parser.hasSourceFull = function (source) {
	Parser._sourceFullCache = Parser._sourceFullCache || Parser._buildSourceCache(Parser.SOURCE_JSON_TO_FULL);
	return !!Parser._sourceFullCache[source.toLowerCase()];
};
Parser._sourceAbvCache = null;
Parser.hasSourceAbv = function (source) {
	Parser._sourceAbvCache = Parser._sourceAbvCache || Parser._buildSourceCache(Parser.SOURCE_JSON_TO_ABV);
	return !!Parser._sourceAbvCache[source.toLowerCase()];
};
Parser._sourceDateCache = null;
Parser.hasSourceDate = function (source) {
	Parser._sourceDateCache = Parser._sourceDateCache || Parser._buildSourceCache(Parser.SOURCE_JSON_TO_DATE);
	return !!Parser._sourceDateCache[source.toLowerCase()];
};
Parser.sourceJsonToJson = function (source) {
	source = Parser._getSourceStringFromSource(source);
	if (Parser.hasSourceJson(source)) return Parser._sourceJsonCache[source.toLowerCase()];
	if (typeof PrereleaseUtil !== "undefined" && PrereleaseUtil.hasSourceJson(source)) return PrereleaseUtil.sourceJsonToSource(source).json;
	if (typeof BrewUtil2 !== "undefined" && BrewUtil2.hasSourceJson(source)) return BrewUtil2.sourceJsonToSource(source).json;
	return source;
};
Parser.sourceJsonToFull = function (source) {
	source = Parser._getSourceStringFromSource(source);
	if (Parser.hasSourceFull(source)) return Parser._sourceFullCache[source.toLowerCase()].replace(/'/g, "\u2019");
	if (typeof PrereleaseUtil !== "undefined" && PrereleaseUtil.hasSourceJson(source)) return PrereleaseUtil.sourceJsonToFull(source).replace(/'/g, "\u2019");
	if (typeof BrewUtil2 !== "undefined" && BrewUtil2.hasSourceJson(source)) return BrewUtil2.sourceJsonToFull(source).replace(/'/g, "\u2019");
	return Parser._parse_aToB(Parser.SOURCE_JSON_TO_FULL, source).replace(/'/g, "\u2019");
};
Parser.sourceJsonToFullCompactPrefix = function (source) {
	return Parser.sourceJsonToFull(source)
		.replace(Parser.UA_PREFIX, Parser.UA_PREFIX_SHORT)
		.replace(/^Unearthed Arcana (\d+): /, "UA$1: ")
		.replace(Parser.AL_PREFIX, Parser.AL_PREFIX_SHORT)
		.replace(Parser.PS_PREFIX, Parser.PS_PREFIX_SHORT);
};
Parser.sourceJsonToAbv = function (source) {
	source = Parser._getSourceStringFromSource(source);
	if (Parser.hasSourceAbv(source)) return Parser._sourceAbvCache[source.toLowerCase()];
	if (typeof PrereleaseUtil !== "undefined" && PrereleaseUtil.hasSourceJson(source)) return PrereleaseUtil.sourceJsonToAbv(source);
	if (typeof BrewUtil2 !== "undefined" && BrewUtil2.hasSourceJson(source)) return BrewUtil2.sourceJsonToAbv(source);
	return Parser._parse_aToB(Parser.SOURCE_JSON_TO_ABV, source);
};
Parser.sourceJsonToDate = function (source) {
	source = Parser._getSourceStringFromSource(source);
	if (Parser.hasSourceDate(source)) return Parser._sourceDateCache[source.toLowerCase()];
	if (typeof PrereleaseUtil !== "undefined" && PrereleaseUtil.hasSourceJson(source)) return PrereleaseUtil.sourceJsonToDate(source);
	if (typeof BrewUtil2 !== "undefined" && BrewUtil2.hasSourceJson(source)) return BrewUtil2.sourceJsonToDate(source);
	return Parser._parse_aToB(Parser.SOURCE_JSON_TO_DATE, source, null);
};

Parser.sourceJsonToSourceClassname = function (source, {sourceJson = null} = {}) {
	sourceJson ||= Parser.sourceJsonToJson(source);
	return `source__${sourceJson.replace(/[^A-Za-z0-9-_]/g, "_")}`;
};

Parser.sourceJsonToMarkerHtml = function (source, {isList = false, isStatsName = false, isAddBrackets = false, additionalStyles = ""} = {}) {
	source = Parser._getSourceStringFromSource(source);
	// TODO(Future) consider enabling this
	// if (SourceUtil.isPartneredSourceWotc(source)) return `<span class="help-subtle ve-source-marker ${isList ? `ve-source-marker--list` : ""} ${isStatsName ? `ve-source-marker--stats-name` : ""} ve-source-marker--partnered ${additionalStyles}" title="D&amp;D Partnered Source">${isList ? "" : "["}✦${isList ? "" : "]"}</span>`;
	if (SourceUtil.isLegacySourceWotc(source)) return `<span class="help-subtle ve-source-marker ${isList ? `ve-source-marker--list` : ""} ${isStatsName ? `ve-source-marker--stats-name` : ""} ve-source-marker--legacy ${additionalStyles}" title="Legacy Source">${isAddBrackets ? "[" : ""}ʟ${isAddBrackets ? "]" : ""}</span>`;
	return "";
};

Parser.stringToSlug = function (str) {
	return str.trim().toLowerCase().toAscii().replace(/[^\w ]+/g, "").replace(/ +/g, "-");
};

Parser.stringToCasedSlug = function (str) {
	return str.toAscii().replace(/[^\w ]+/g, "").replace(/ +/g, "-");
};

Parser.ITEM_SPELLCASTING_FOCUS_CLASSES = ["Artificer", "Bard", "Cleric", "Druid", "Paladin", "Ranger", "Sorcerer", "Warlock", "Wizard"];

Parser.itemValueToFull = function (item, opts = {isShortForm: false, isSmallUnits: false}) {
	return Parser._moneyToFull(item, "value", "valueMult", opts);
};

/**
 * @param item
 * @param {object} [opts]
 * @param {?boolean} [opts.isShortForm]
 * @param {?boolean} [opts.isSmallUnits]
 * @param {?number} [opts.multiplier]
 * @param {?string} [opts.styleHint]
 */
Parser.itemValueToFullMultiCurrency = function (
	item,
	opts = {
		isShortForm: false,
		isSmallUnits: false,
		multiplier: null,
		styleHint: null,
	},
) {
	return Parser._moneyToFullMultiCurrency(item, "value", "valueMult", opts);
};

Parser.itemVehicleCostsToFull = function (item, isShortForm) {
	return {
		travelCostFull: Parser._moneyToFull(item, "travelCost", "travelCostMult", {isShortForm}),
		shippingCostFull: Parser._moneyToFull(item, "shippingCost", "shippingCostMult", {isShortForm}),
	};
};

Parser.spellComponentCostToFull = function (item, isShortForm) {
	return Parser._moneyToFull(item, "cost", "costMult", {isShortForm});
};

Parser.vehicleCostToFull = function (item, isShortForm) {
	return Parser._moneyToFull(item, "cost", "costMult", {isShortForm});
};

Parser._moneyToFull = function (it, prop, propMult, opts = {isShortForm: false, isSmallUnits: false}) {
	if (it[prop] == null && it[propMult] == null) return "";
	if (it[prop] != null) {
		const {coin, mult} = Parser.getCurrencyAndMultiplier(it[prop], it.currencyConversion);
		return `${(it[prop] * mult).toLocaleStringVe()}${opts.isSmallUnits ? `<span class="small ml-1">${coin}</span>` : ` ${coin}`}`;
	} else if (it[propMult] != null) return opts.isShortForm ? `×${it[propMult]}` : `base value ×${it[propMult]}`;
	return "";
};

Parser._moneyToFullMultiCurrency = function (it, prop, propMult, {isShortForm, multiplier, styleHint} = {}) {
	styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

	if (it[prop]) {
		const conversionTable = Parser.getCurrencyConversionTable(it.currencyConversion);

		const simplified = it.currencyConversion
			? CurrencyUtil.doSimplifyCoins(
				{
					// Assume the e.g. item's value is in the lowest available denomination
					[conversionTable[0]?.coin || "cp"]: it[prop] * (multiplier ?? conversionTable[0]?.mult ?? 1),
				},
				{
					currencyConversionId: it.currencyConversion,
				},
			)
			: CurrencyUtil.doSimplifyCoins({
				cp: it[prop] * (multiplier ?? 1),
			});

		return [...conversionTable]
			.reverse()
			.filter(meta => simplified[meta.coin])
			.map(meta => `${simplified[meta.coin].toLocaleStringVe()} ${styleHint === "classic" ? meta.coin : meta.coin.toUpperCase()}`)
			.join(", ");
	}

	if (it[prop] === 0) {
		return `0 ${styleHint === "classic" ? "gp" : "GP"}`;
	}

	if (it[propMult]) return isShortForm ? `×${it[propMult]}` : `base value ×${it[propMult]}`;

	return "";
};

Parser.DEFAULT_CURRENCY_CONVERSION_TABLE = [
	{
		coin: "cp",
		mult: 1,
	},
	{
		coin: "sp",
		mult: 0.1,
	},
	{
		coin: "gp",
		mult: 0.01,
		isFallback: true,
	},
];
Parser.FULL_CURRENCY_CONVERSION_TABLE = [
	{
		coin: "cp",
		mult: 1,
	},
	{
		coin: "sp",
		mult: 0.1,
	},
	{
		coin: "ep",
		mult: 0.02,
	},
	{
		coin: "gp",
		mult: 0.01,
		isFallback: true,
	},
	{
		coin: "pp",
		mult: 0.001,
	},
];
Parser.getCurrencyConversionTable = function (currencyConversionId) {
	const fromPrerelease = currencyConversionId ? PrereleaseUtil.getMetaLookup("currencyConversions")?.[currencyConversionId] : null;
	const fromBrew = currencyConversionId ? BrewUtil2.getMetaLookup("currencyConversions")?.[currencyConversionId] : null;
	const conversionTable = fromPrerelease?.length
		? fromPrerelease
		: fromBrew?.length
			? fromBrew
			: Parser.DEFAULT_CURRENCY_CONVERSION_TABLE;
	if (conversionTable !== Parser.DEFAULT_CURRENCY_CONVERSION_TABLE) conversionTable.sort((a, b) => SortUtil.ascSort(b.mult, a.mult));
	return conversionTable;
};
Parser.getCurrencyAndMultiplier = function (value, currencyConversionId) {
	const conversionTable = Parser.getCurrencyConversionTable(currencyConversionId);

	if (!value) return conversionTable.find(it => it.isFallback) || conversionTable[0];
	if (conversionTable.length === 1) return conversionTable[0];
	if (!Number.isInteger(value) && value < conversionTable[0].mult) return conversionTable[0];

	for (let i = conversionTable.length - 1; i >= 0; --i) {
		if (Number.isInteger(value * conversionTable[i].mult)) return conversionTable[i];
	}

	return conversionTable.last();
};

Parser.COIN_ABVS = ["cp", "sp", "ep", "gp", "pp"];
Parser.COIN_ABV_TO_FULL = {
	"cp": "copper pieces",
	"sp": "silver pieces",
	"ep": "electrum pieces",
	"gp": "gold pieces",
	"pp": "platinum pieces",
};
Parser.COIN_CONVERSIONS = [1, 10, 50, 100, 1000];

Parser.coinAbvToFull = function (coin) {
	return Parser._parse_aToB(Parser.COIN_ABV_TO_FULL, coin);
};

/**
 * @param currency Object of the form `{pp: <n>, gp: <m>, ... }`.
 * @param isDisplayEmpty If "empty" values (i.e., those which are 0) should be displayed.
 * @param styleHint
 */
Parser.getDisplayCurrency = function (currency, {isDisplayEmpty = false, styleHint = null} = {}) {
	styleHint ||= VetoolsConfig.get("styleSwitcher", "style");
	return [...Parser.COIN_ABVS]
		.reverse()
		.filter(abv => isDisplayEmpty ? currency[abv] != null : currency[abv])
		.map(abv => `${currency[abv].toLocaleStringVe()} ${styleHint === "classic" ? abv : abv.toUpperCase()}`)
		.join(", ");
};

Parser.itemWeightToFull = function (item, isShortForm) {
	if (item.weight) {
		// Handle pure integers
		if (Math.round(item.weight) === item.weight) return `${item.weight} lb.${(item.weightNote ? ` ${item.weightNote}` : "")}`;

		const integerPart = Math.floor(item.weight);

		// Attempt to render the amount as (a number +) a vulgar
		const vulgarGlyph = Parser.numberToVulgar(item.weight - integerPart, {isFallbackOnFractional: false});
		if (vulgarGlyph) return `${integerPart || ""}${vulgarGlyph} lb.${(item.weightNote ? ` ${item.weightNote}` : "")}`;

		// Fall back on decimal pounds or ounces
		return `${(item.weight < 1 ? item.weight * 16 : item.weight).toLocaleStringVe()} ${item.weight < 1 ? "oz" : "lb"}.${(item.weightNote ? ` ${item.weightNote}` : "")}`;
	}
	if (item.weightMult) return isShortForm ? `×${item.weightMult}` : `base weight ×${item.weightMult}`;
	return "";
};

Parser.ITEM_RECHARGE_TO_FULL = {
	round: "Every Round",
	restShort: "Short Rest",
	restLong: "Long Rest",
	dawn: "Dawn",
	dusk: "Dusk",
	midnight: "Midnight",
	week: "Week",
	month: "Month",
	year: "Year",
	decade: "Decade",
	century: "Century",
	special: "Special",
};
Parser.itemRechargeToFull = function (recharge) {
	return Parser._parse_aToB(Parser.ITEM_RECHARGE_TO_FULL, recharge);
};

Parser.ITEM_MISC_TAG_TO_FULL = {
	"CF/W": "Creates Food/Water",
	"CNS": "Consumable",
	"TT": "Trinket Table",
};
Parser.itemMiscTagToFull = function (type) {
	return Parser._parse_aToB(Parser.ITEM_MISC_TAG_TO_FULL, type);
};

Parser.ITM_PROP_ABV__TWO_HANDED = "2H";
Parser.ITM_PROP_ABV__AMMUNITION = "A";
Parser.ITM_PROP_ABV__AMMUNITION_FUTURISTIC = "AF";
Parser.ITM_PROP_ABV__BURST_FIRE = "BF";
Parser.ITM_PROP_ABV__EXTENDED_REACH = "ER";
Parser.ITM_PROP_ABV__FINESSE = "F";
Parser.ITM_PROP_ABV__HEAVY = "H";
Parser.ITM_PROP_ABV__LIGHT = "L";
Parser.ITM_PROP_ABV__LOADING = "LD";
Parser.ITM_PROP_ABV__OTHER = "OTH";
Parser.ITM_PROP_ABV__REACH = "R";
Parser.ITM_PROP_ABV__RELOAD = "RLD";
Parser.ITM_PROP_ABV__SPECIAL = "S";
Parser.ITM_PROP_ABV__THROWN = "T";
Parser.ITM_PROP_ABV__VERSATILE = "V";
Parser.ITM_PROP_ABV__VESTIGE_OF_DIVERGENCE = "Vst";

Parser.ITM_PROP__TWO_HANDED = "2H";
Parser.ITM_PROP__AMMUNITION = "A";
Parser.ITM_PROP__AMMUNITION_FUTURISTIC = "AF|DMG";
Parser.ITM_PROP__BURST_FIRE = "BF|DMG";
Parser.ITM_PROP__FINESSE = "F";
Parser.ITM_PROP__HEAVY = "H";
Parser.ITM_PROP__LIGHT = "L";
Parser.ITM_PROP__LOADING = "LD";
Parser.ITM_PROP__OTHER = "OTH";
Parser.ITM_PROP__REACH = "R";
Parser.ITM_PROP__RELOAD = "RLD|DMG";
Parser.ITM_PROP__SPECIAL = "S";
Parser.ITM_PROP__THROWN = "T";
Parser.ITM_PROP__VERSATILE = "V";

Parser.ITM_PROP__ODND_TWO_HANDED = "2H|XPHB";
Parser.ITM_PROP__ODND_AMMUNITION = "A|XPHB";
Parser.ITM_PROP__ODND_FINESSE = "F|XPHB";
Parser.ITM_PROP__ODND_HEAVY = "H|XPHB";
Parser.ITM_PROP__ODND_LIGHT = "L|XPHB";
Parser.ITM_PROP__ODND_LOADING = "LD|XPHB";
Parser.ITM_PROP__ODND_REACH = "R|XPHB";
Parser.ITM_PROP__ODND_THROWN = "T|XPHB";
Parser.ITM_PROP__ODND_VERSATILE = "V|XPHB";

Parser.ITM_TYP_ABV__TREASURE = "$";
Parser.ITM_TYP_ABV__TREASURE_ART_OBJECT = "$A";
Parser.ITM_TYP_ABV__TREASURE_COINAGE = "$C";
Parser.ITM_TYP_ABV__TREASURE_GEMSTONE = "$G";
Parser.ITM_TYP_ABV__AMMUNITION = "A";
Parser.ITM_TYP_ABV__AMMUNITION_FUTURISTIC = "AF";
Parser.ITM_TYP_ABV__VEHICLE_AIR = "AIR";
Parser.ITM_TYP_ABV__ARTISAN_TOOL = "AT";
Parser.ITM_TYP_ABV__EXPLOSIVE = "EXP";
Parser.ITM_TYP_ABV__FOOD_AND_DRINK = "FD";
Parser.ITM_TYP_ABV__ADVENTURING_GEAR = "G";
Parser.ITM_TYP_ABV__GAMING_SET = "GS";
Parser.ITM_TYP_ABV__GENERIC_VARIANT = "GV";
Parser.ITM_TYP_ABV__HEAVY_ARMOR = "HA";
Parser.ITM_TYP_ABV__ILLEGAL_DRUG = "IDG";
Parser.ITM_TYP_ABV__INSTRUMENT = "INS";
Parser.ITM_TYP_ABV__LIGHT_ARMOR = "LA";
Parser.ITM_TYP_ABV__MELEE_WEAPON = "M";
Parser.ITM_TYP_ABV__MEDIUM_ARMOR = "MA";
Parser.ITM_TYP_ABV__MOUNT = "MNT";
Parser.ITM_TYP_ABV__OTHER = "OTH";
Parser.ITM_TYP_ABV__POTION = "P";
Parser.ITM_TYP_ABV__RANGED_WEAPON = "R";
Parser.ITM_TYP_ABV__ROD = "RD";
Parser.ITM_TYP_ABV__RING = "RG";
Parser.ITM_TYP_ABV__SHIELD = "S";
Parser.ITM_TYP_ABV__SCROLL = "SC";
Parser.ITM_TYP_ABV__SPELLCASTING_FOCUS = "SCF";
Parser.ITM_TYP_ABV__VEHICLE_WATER = "SHP";
Parser.ITM_TYP_ABV__VEHICLE_SPACE = "SPC";
Parser.ITM_TYP_ABV__TOOL = "T";
Parser.ITM_TYP_ABV__TACK_AND_HARNESS = "TAH";
Parser.ITM_TYP_ABV__TRADE_BAR = "TB";
Parser.ITM_TYP_ABV__TRADE_GOOD = "TG";
Parser.ITM_TYP_ABV__VEHICLE_LAND = "VEH";
Parser.ITM_TYP_ABV__WAND = "WD";

Parser.ITM_TYP__TREASURE = "$|DMG";
Parser.ITM_TYP__TREASURE_ART_OBJECT = "$A|DMG";
Parser.ITM_TYP__TREASURE_COINAGE = "$C";
Parser.ITM_TYP__TREASURE_GEMSTONE = "$G|DMG";
Parser.ITM_TYP__AMMUNITION = "A";
Parser.ITM_TYP__AMMUNITION_FUTURISTIC = "AF|DMG";
Parser.ITM_TYP__VEHICLE_AIR = "AIR|DMG";
Parser.ITM_TYP__ARTISAN_TOOL = "AT";
Parser.ITM_TYP__EXPLOSIVE = "EXP|DMG";
Parser.ITM_TYP__FOOD_AND_DRINK = "FD";
Parser.ITM_TYP__ADVENTURING_GEAR = "G";
Parser.ITM_TYP__GAMING_SET = "GS";
Parser.ITM_TYP__GENERIC_VARIANT = "GV|DMG";
Parser.ITM_TYP__HEAVY_ARMOR = "HA";
Parser.ITM_TYP__INSTRUMENT = "INS";
Parser.ITM_TYP__LIGHT_ARMOR = "LA";
Parser.ITM_TYP__MELEE_WEAPON = "M";
Parser.ITM_TYP__MEDIUM_ARMOR = "MA";
Parser.ITM_TYP__MOUNT = "MNT";
Parser.ITM_TYP__OTHER = "OTH";
Parser.ITM_TYP__POTION = "P";
Parser.ITM_TYP__RANGED_WEAPON = "R";
Parser.ITM_TYP__ROD = "RD|DMG";
Parser.ITM_TYP__RING = "RG|DMG";
Parser.ITM_TYP__SHIELD = "S";
Parser.ITM_TYP__SCROLL = "SC|DMG";
Parser.ITM_TYP__SPELLCASTING_FOCUS = "SCF";
Parser.ITM_TYP__VEHICLE_WATER = "SHP";
Parser.ITM_TYP__VEHICLE_SPACE = "SPC|AAG";
Parser.ITM_TYP__TOOL = "T";
Parser.ITM_TYP__TACK_AND_HARNESS = "TAH";
Parser.ITM_TYP__TRADE_GOOD = "TG";
Parser.ITM_TYP__VEHICLE_LAND = "VEH";
Parser.ITM_TYP__WAND = "WD|DMG";

Parser.ITM_TYP__ODND_TREASURE_ART_OBJECT = "$A|XDMG";
Parser.ITM_TYP__ODND_TREASURE_COINAGE = "$C|XPHB";
Parser.ITM_TYP__ODND_TREASURE_GEMSTONE = "$G|XDMG";
Parser.ITM_TYP__ODND_AMMUNITION = "A|XPHB";
Parser.ITM_TYP__ODND_AMMUNITION_FUTURISTIC = "AF|XDMG";
Parser.ITM_TYP__ODND_VEHICLE_AIR = "AIR|XPHB";
Parser.ITM_TYP__ODND_ARTISAN_TOOL = "AT|XPHB";
Parser.ITM_TYP__ODND_EXPLOSIVE = "EXP|XDMG";
Parser.ITM_TYP__ODND_FOOD_AND_DRINK = "FD|XPHB";
Parser.ITM_TYP__ODND_ADVENTURING_GEAR = "G|XPHB";
Parser.ITM_TYP__ODND_GAMING_SET = "GS|XPHB";
Parser.ITM_TYP__ODND_GENERIC_VARIANT = "GV|XDMG";
Parser.ITM_TYP__ODND_HEAVY_ARMOR = "HA|XPHB";
Parser.ITM_TYP__ODND_INSTRUMENT = "INS|XPHB";
Parser.ITM_TYP__ODND_LIGHT_ARMOR = "LA|XPHB";
Parser.ITM_TYP__ODND_MELEE_WEAPON = "M|XPHB";
Parser.ITM_TYP__ODND_MEDIUM_ARMOR = "MA|XPHB";
Parser.ITM_TYP__ODND_MOUNT = "MNT|XPHB";
Parser.ITM_TYP__ODND_POTION = "P|XPHB";
Parser.ITM_TYP__ODND_RANGED_WEAPON = "R|XPHB";
Parser.ITM_TYP__ODND_ROD = "RD|XDMG";
Parser.ITM_TYP__ODND_RING = "RG|XDMG";
Parser.ITM_TYP__ODND_SHIELD = "S|XPHB";
Parser.ITM_TYP__ODND_SCROLL = "SC|XPHB";
Parser.ITM_TYP__ODND_SPELLCASTING_FOCUS = "SCF|XPHB";
Parser.ITM_TYP__ODND_VEHICLE_WATER = "SHP|XPHB";
Parser.ITM_TYP__ODND_TOOL = "T|XPHB";
Parser.ITM_TYP__ODND_TACK_AND_HARNESS = "TAH|XPHB";
Parser.ITM_TYP__ODND_TRADE_BAR = "TB|XDMG";
Parser.ITM_TYP__ODND_TRADE_GOOD = "TG|XDMG";
Parser.ITM_TYP__ODND_VEHICLE_LAND = "VEH|XPHB";
Parser.ITM_TYP__ODND_WAND = "WD|XDMG";

Parser.ITM_RARITY_TO_SHORT = {
	"common": "Com.",
	"uncommon": "Unc.",
	"rare": "Rare",
	"very rare": "V.Rare",
	"legendary": "Leg.",
	"artifact": "Art.",
	"varies": "Var.",
};
Parser.itemRarityToShort = function (rarity) {
	if (!rarity) return rarity;
	if (Parser.ITM_RARITY_TO_SHORT[rarity]) return Parser.ITM_RARITY_TO_SHORT[rarity];
	if (rarity.length <= 4) return rarity.toTitleCase();
	return `${rarity.toTitleCase().slice(0, 3)}.`;
};

Parser._decimalSeparator = (0.1).toLocaleString().substring(1, 2);
Parser._numberCleanRegexp = Parser._decimalSeparator === "." ? new RegExp(/[\s,]*/g, "g") : new RegExp(/[\s.]*/g, "g");
Parser._costSplitRegexp = Parser._decimalSeparator === "." ? new RegExp(/(\d+(\.\d+)?)([csegp]p)/) : new RegExp(/(\d+(,\d+)?)([csegp]p)/);

/** input e.g. "25 gp", "1,000pp" */
Parser.coinValueToNumber = function (value) {
	if (!value) return 0;
	// handle oddities
	if (value === "Varies") return 0;

	value = value
		.replace(/\s*/, "")
		.replace(Parser._numberCleanRegexp, "")
		.toLowerCase();
	const m = Parser._costSplitRegexp.exec(value);
	if (!m) throw new Error(`Badly formatted value "${value}"`);
	const ixCoin = Parser.COIN_ABVS.indexOf(m[3]);
	if (!~ixCoin) throw new Error(`Unknown coin type "${m[3]}"`);
	return Number(m[1]) * Parser.COIN_CONVERSIONS[ixCoin];
};

Parser.weightValueToNumber = function (value) {
	if (!value) return 0;

	if (Number(value)) return Number(value);
	else throw new Error(`Badly formatted value ${value}`);
};

Parser.dmgTypeToFull = function (dmgType, {styleHint = null} = {}) {
	if (!dmgType) return dmgType;

	styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

	const out = Parser._parse_aToB(Parser.DMGTYPE_JSON_TO_FULL, dmgType);
	if (styleHint !== "classic") return out.toTitleCase();
	return out;
};

Parser.skillProficienciesToFull = function (skillProficiencies, {styleHint = null} = {}) {
	styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

	const ptSourceDefault = styleHint === "classic" ? Parser.SRC_PHB : Parser.SRC_XPHB;

	const getRenderedSkill = uid => {
		const unpacked = DataUtil.proxy.unpackUid("skill", uid, "skill");
		const ptSource = uid.includes("|")
			? unpacked.source
			: unpacked.source.toLowerCase() === Parser.SRC_PHB.toLowerCase()
				? ptSourceDefault
				: unpacked.source;
		return Renderer.get().render(`{@skill ${unpacked.name.toTitleCase()}|${ptSource}}`);
	};

	return skillProficiencies
		.map(skProf => {
			if (skProf.any) {
				skProf = MiscUtil.copyFast(skProf);
				skProf.choose = {"from": Object.keys(Parser.SKILL_TO_ATB_ABV), "count": skProf.any};
				delete skProf.any;
			}

			const keys = Object.keys(skProf).sort(SortUtil.ascSortLower);

			const ixChoose = keys.indexOf("choose");
			if (~ixChoose) keys.splice(ixChoose, 1);

			const baseStack = [];
			keys.filter(k => skProf[k]).forEach(k => baseStack.push(getRenderedSkill(k)));

			let ptChoose = "";
			if (~ixChoose) {
				const chObj = skProf.choose;
				const count = chObj.count ?? 1;
				if (chObj.from.length === 18) {
					ptChoose = styleHint === "classic"
						? `choose any ${count === 1 ? "skill" : chObj.count}`
						: Renderer.get().render(`{@i Choose any ${chObj.count} ${count === 1 ? "skill" : "skills"}} (see {@book chapter 1|XPHB|1|Skill List})`);
				} else {
					ptChoose = styleHint === "classic"
						? `choose ${count} from ${chObj.from.map(it => getRenderedSkill(it)).joinConjunct(", ", " and ")}`
						: Renderer.get().render(`{@i Choose ${count}:} ${chObj.from.map(it => getRenderedSkill(it)).joinConjunct(", ", " or ")}`);
				}
			}

			const base = baseStack.joinConjunct(", ", " and ");

			if (baseStack.length && ptChoose.length) return `${base}; and ${ptChoose}`;
			else if (baseStack.length) return base;
			else if (ptChoose.length) return ptChoose;
		})
		.join(` <i>or</i> `);
};

// sp-prefix functions are for parsing spell data, and shared with the roll20 script
Parser.spSchoolAndSubschoolsAbvsToFull = function (school, subschools) {
	if (!subschools || !subschools.length) return Parser.spSchoolAbvToFull(school);
	else return `${Parser.spSchoolAbvToFull(school)} (${subschools.map(sub => Parser.spSchoolAbvToFull(sub)).join(", ")})`;
};

Parser.spSchoolAbvToFull = function (schoolOrSubschool) {
	const out = Parser._parse_aToB(Parser.SP_SCHOOL_ABV_TO_FULL, schoolOrSubschool);
	if (Parser.SP_SCHOOL_ABV_TO_FULL[schoolOrSubschool]) return out;
	if (PrereleaseUtil.getMetaLookup("spellSchools")?.[schoolOrSubschool]) return PrereleaseUtil.getMetaLookup("spellSchools")?.[schoolOrSubschool].full;
	if (BrewUtil2.getMetaLookup("spellSchools")?.[schoolOrSubschool]) return BrewUtil2.getMetaLookup("spellSchools")?.[schoolOrSubschool].full;
	return out;
};

Parser.spSchoolAndSubschoolsAbvsShort = function (school, subschools) {
	if (!subschools || !subschools.length) return Parser.spSchoolAbvToShort(school);
	else return `${Parser.spSchoolAbvToShort(school)} (${subschools.map(sub => Parser.spSchoolAbvToShort(sub)).join(", ")})`;
};

Parser.spSchoolAbvToShort = function (school) {
	const out = Parser._parse_aToB(Parser.SP_SCHOOL_ABV_TO_SHORT, school);
	if (Parser.SP_SCHOOL_ABV_TO_SHORT[school]) return out;
	if (PrereleaseUtil.getMetaLookup("spellSchools")?.[school]) return PrereleaseUtil.getMetaLookup("spellSchools")?.[school].short;
	if (BrewUtil2.getMetaLookup("spellSchools")?.[school]) return BrewUtil2.getMetaLookup("spellSchools")?.[school].short;
	if (out.length <= 4) return out;
	return `${out.slice(0, 3)}.`;
};

Parser.spSchoolAbvToStyle = function (school) { // For prerelease/homebrew
	return Parser._colorableMetaAbvToStyle({key: school, prop: "spellSchools"});
};

Parser.spSchoolAbvToStylePart = function (school) { // For prerelease/homebrew
	return Parser._colorableMetaAbvToStylePart({key: school, prop: "spellSchools"});
};

Parser._colorableMetaAbvToStyle = function ({key, prop}) {
	const stylePart = Parser._colorableMetaAbvToStylePart({key, prop});
	if (!stylePart) return stylePart;
	return `style="${stylePart}"`;
};

Parser._colorableMetaAbvToStylePart = function ({key, prop}) {
	return Parser._colorableMetaAbvToStylePart_prereleaseBrew({key, prop, brewUtil: PrereleaseUtil})
		|| Parser._colorableMetaAbvToStylePart_prereleaseBrew({key, prop, brewUtil: BrewUtil2})
		|| "";
};

Parser._colorableMetaAbvToStylePart_prereleaseBrew = function ({key, prop, brewUtil}) {
	const rawColor = brewUtil.getMetaLookup(prop)?.[key]?.color;
	if (!rawColor || !rawColor.trim()) return "";
	const validColor = BrewUtilShared.getValidColor(rawColor);
	if (validColor.length) return MiscUtil.getColorStylePart(validColor);
};

Parser.getOrdinalForm = function (i) {
	i = Number(i);
	if (isNaN(i)) return "";
	const j = i % 10; const k = i % 100;
	if (j === 1 && k !== 11) return `${i}st`;
	if (j === 2 && k !== 12) return `${i}nd`;
	if (j === 3 && k !== 13) return `${i}rd`;
	return `${i}th`;
};

Parser.spLevelToFull = function (level) {
	if (level === 0) return "Cantrip";
	else return Parser.getOrdinalForm(level);
};

Parser.getArticle = function (str) {
	str = `${str}`;
	str = str.replace(/\d+/g, (...m) => Parser.numberToText(m[0]));
	return /^[aeiou]/i.test(str) ? "an" : "a";
};

Parser.spLevelToFullLevelText = function (level, {isDash = false, isPluralCantrips = true} = {}) {
	return `${Parser.spLevelToFull(level)}${(level === 0 ? (isPluralCantrips ? "s" : "") : `${isDash ? "-" : " "}level`)}`;
};

Parser.spLevelToSpellPoints = function (lvl) {
	lvl = Number(lvl);
	if (isNaN(lvl) || lvl === 0) return 0;
	return Math.ceil(1.34 * lvl);
};

Parser.spMetaToArr = function (meta) {
	if (!meta) return [];
	return Object.entries(meta)
		.filter(([_, v]) => v)
		.sort(SortUtil.ascSort)
		.map(([k]) => k);
};

Parser.spMetaToFull = function (meta) {
	if (!meta) return "";
	const metaTags = Parser.spMetaToArr(meta);
	if (metaTags.length) return ` (${metaTags.join(", ")})`;
	return "";
};

Parser._spLevelSchoolMetaToFull_level = ({level, styleHint}) => {
	if (styleHint === "classic") return level === 0 ? Parser.spLevelToFull(level).toLowerCase() : `${Parser.spLevelToFull(level)}-level`;
	return level === 0 ? Parser.spLevelToFull(level) : `Level ${level}`;
};

Parser._spLevelSchoolMetaToFull_levelSchool = ({level, school, styleHint, ptLevel}) => {
	if (level === 0) return `${Parser.spSchoolAbvToFull(school)} ${ptLevel}`;

	if (styleHint === "classic") return `${ptLevel} ${Parser.spSchoolAbvToFull(school).toLowerCase()}`;
	return `${ptLevel} ${Parser.spSchoolAbvToFull(school)}`;
};

Parser.spLevelSchoolMetaToFull = function (level, school, meta, subschools, {styleHint = null} = {}) {
	styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

	const ptLevel = Parser._spLevelSchoolMetaToFull_level({level, styleHint});
	const ptLevelSchool = Parser._spLevelSchoolMetaToFull_levelSchool({level, school, styleHint, ptLevel});

	const metaArr = Parser.spMetaToArr(meta, {styleHint})
		.filter(k => styleHint === "classic" || k !== "ritual");

	if (metaArr.length || subschools?.length) {
		const ptMetaAndSubschools = [
			(subschools || [])
				.map(sub => Parser.spSchoolAbvToFull(sub))
				.join(", "),
			metaArr
				.join(", "),
		]
			.filter(Boolean)
			.join("; ");

		if (styleHint === "classic") return `${ptLevelSchool} (${ptMetaAndSubschools.toLowerCase()})`;
		return `${ptLevelSchool} (${ptMetaAndSubschools})`;
	}

	return ptLevelSchool;
};

Parser.SP_TM_ACTION = "action";
Parser.SP_TM_B_ACTION = "bonus";
Parser.SP_TM_REACTION = "reaction";
Parser.SP_TM_ROUND = "round";
Parser.SP_TM_MINS = "minute";
Parser.SP_TM_HRS = "hour";
Parser.SP_TM_SPECIAL = "special";
Parser.SP_TIME_SINGLETONS = [Parser.SP_TM_ACTION, Parser.SP_TM_B_ACTION, Parser.SP_TM_REACTION, Parser.SP_TM_ROUND];
Parser.SP_TIME_TO_FULL = {
	[Parser.SP_TM_ACTION]: "Action",
	[Parser.SP_TM_B_ACTION]: "Bonus Action",
	[Parser.SP_TM_REACTION]: "Reaction",
	[Parser.SP_TM_ROUND]: "Rounds",
	[Parser.SP_TM_MINS]: "Minutes",
	[Parser.SP_TM_HRS]: "Hours",
	[Parser.SP_TM_SPECIAL]: "Special",
};
Parser.spTimeUnitToFull = function (timeUnit) {
	return Parser._parse_aToB(Parser.SP_TIME_TO_FULL, timeUnit);
};

Parser.SP_TIME_TO_SHORT = {
	[Parser.SP_TM_ROUND]: "Rnd.",
	[Parser.SP_TM_MINS]: "Min.",
	[Parser.SP_TM_HRS]: "Hr.",
};
Parser.spTimeUnitToShort = function (timeUnit) {
	return Parser._parse_aToB(Parser.SP_TIME_TO_SHORT, timeUnit);
};

Parser.SP_TIME_TO_ABV = {
	[Parser.SP_TM_ACTION]: "A",
	[Parser.SP_TM_B_ACTION]: "BA",
	[Parser.SP_TM_REACTION]: "R",
	[Parser.SP_TM_ROUND]: "rnd",
	[Parser.SP_TM_MINS]: "min",
	[Parser.SP_TM_HRS]: "hr",
	[Parser.SP_TM_SPECIAL]: "SPC",
};
Parser.spTimeUnitToAbv = function (timeUnit) {
	return Parser._parse_aToB(Parser.SP_TIME_TO_ABV, timeUnit);
};

Parser.spTimeToShort = function (time, isHtml) {
	if (!time) return "";
	return (time.number === 1 && Parser.SP_TIME_SINGLETONS.includes(time.unit))
		? `${Parser.spTimeUnitToAbv(time.unit).uppercaseFirst()}${time.condition ? "*" : ""}`
		: `${time.number} ${isHtml ? `<span class="ve-small">` : ""}${Parser.spTimeUnitToAbv(time.unit)}${isHtml ? `</span>` : ""}${time.condition ? "*" : ""}`;
};

Parser.spTimeListToFull = function (times, meta, {isStripTags = false, styleHint = null} = {}) {
	styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

	return [
		...times,
		...styleHint === "classic" || !meta?.ritual
			? []
			: [{"number": 1, "unit": "ritual"}],
	]
		.map(time => {
			return [
				Parser.getTimeToFull(time, {styleHint}),
				time.condition ? `, ${isStripTags ? Renderer.stripTags(time.condition) : Renderer.get().render(time.condition)}` : "",
				time.note ? ` (${isStripTags ? Renderer.stripTags(time.note) : Renderer.get().render(time.note)})` : "",
			]
				.filter(Boolean)
				.join("");
		})
		.joinConjunct(", ", " or ");
};

Parser._TIME_UNITS_SHORTHAND = new Set([
	Parser.SP_TM_ACTION,
	Parser.SP_TM_B_ACTION,
	Parser.SP_TM_REACTION,
	"ritual", // faux unit added during rendering
]);

Parser._getTimeToFull_number = ({time, styleHint}) => {
	if (!time.number) return "";
	if (styleHint === "classic") return `${time.number} `;

	if (time.number === 1 && Parser._TIME_UNITS_SHORTHAND.has(time.unit)) return "";
	return `${time.number} `;
};

Parser.getTimeToFull = function (time, {styleHint = null} = {}) {
	styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

	const ptNumber = Parser._getTimeToFull_number({time, styleHint});
	const ptUnit = (time.unit === Parser.SP_TM_B_ACTION ? "bonus action" : time.unit)[(styleHint === "classic" || ptNumber) ? "toString" : "uppercaseFirst"]();
	return `${ptNumber}${ptUnit}${time.number > 1 ? "s" : ""}`;
};

Parser.getMinutesToFull = function (mins, {isShort = false} = {}) {
	const days = Math.floor(mins / (24 * 60));
	mins = mins % (24 * 60);

	const hours = Math.floor(mins / 60);
	mins = mins % 60;

	return [
		days ? `${days} ${isShort ? `d` : `day${days > 1 ? "s" : ""}`}` : null,
		hours ? `${hours} ${isShort ? `h` : `hour${hours > 1 ? "s" : ""}`}` : null,
		mins ? `${mins} ${isShort ? `m` : `minute${mins > 1 ? "s" : ""}`}` : null,
	].filter(Boolean)
		.join(" ");
};

Parser.RNG_SPECIAL = "special";
Parser.RNG_POINT = "point";
Parser.RNG_LINE = "line";
Parser.RNG_CUBE = "cube";
Parser.RNG_CONE = "cone";
Parser.RNG_EMANATION = "emanation";
Parser.RNG_RADIUS = "radius";
Parser.RNG_SPHERE = "sphere";
Parser.RNG_HEMISPHERE = "hemisphere";
Parser.RNG_CYLINDER = "cylinder"; // homebrew only
Parser.RNG_SELF = "self";
Parser.RNG_SIGHT = "sight";
Parser.RNG_UNLIMITED = "unlimited";
Parser.RNG_UNLIMITED_SAME_PLANE = "plane";
Parser.RNG_TOUCH = "touch";
Parser.SP_RANGE_TYPE_TO_FULL = {
	[Parser.RNG_SPECIAL]: "Special",
	[Parser.RNG_POINT]: "Point",
	[Parser.RNG_LINE]: "Line",
	[Parser.RNG_CUBE]: "Cube",
	[Parser.RNG_CONE]: "Cone",
	[Parser.RNG_EMANATION]: "Emanation",
	[Parser.RNG_RADIUS]: "Radius",
	[Parser.RNG_SPHERE]: "Sphere",
	[Parser.RNG_HEMISPHERE]: "Hemisphere",
	[Parser.RNG_CYLINDER]: "Cylinder",
	[Parser.RNG_SELF]: "Self",
	[Parser.RNG_SIGHT]: "Sight",
	[Parser.RNG_UNLIMITED]: "Unlimited",
	[Parser.RNG_UNLIMITED_SAME_PLANE]: "Unlimited on the same plane",
	[Parser.RNG_TOUCH]: "Touch",
};

Parser.spRangeTypeToFull = function (range) {
	return Parser._parse_aToB(Parser.SP_RANGE_TYPE_TO_FULL, range);
};

Parser.UNT_LBS = "lbs";
Parser.UNT_TONS_IMPERIAL = "tns";
Parser.UNT_TONS_METRIC = "Mg";

Parser.UNT_INCHES = "inches";
Parser.UNT_FEET = "feet";
Parser.UNT_YARDS = "yards";
Parser.UNT_MILES = "miles";

Parser.UNT_CUBIC_FEET = "cubic feet";

Parser.getNormalizedUnit = function (unit) {
	if (unit == null) return unit;

	unit = unit.toLowerCase().trim();

	switch (unit) {
		case "inch": case "in.": case "in": case Parser.UNT_INCHES: return Parser.UNT_INCHES;
		case "foot": case "ft.": case "ft": case Parser.UNT_FEET: return Parser.UNT_FEET;
		case "yard": case "yd.": case "yd": case Parser.UNT_YARDS: return Parser.UNT_YARDS;
		case "mile": case "mi.": case "mi": case Parser.UNT_MILES: return Parser.UNT_MILES;

		case "pound": case "pounds": case "lbs.": case "lb.": case "lb": case Parser.UNT_LBS: return Parser.UNT_LBS;
		default: return unit;
	}
};

Parser.SP_DIST_TYPE_TO_FULL = {
	[Parser.UNT_INCHES]: "Inches",
	[Parser.UNT_FEET]: "Feet",
	[Parser.UNT_YARDS]: "Yards",
	[Parser.UNT_MILES]: "Miles",
	[Parser.RNG_SELF]: Parser.SP_RANGE_TYPE_TO_FULL[Parser.RNG_SELF],
	[Parser.RNG_TOUCH]: Parser.SP_RANGE_TYPE_TO_FULL[Parser.RNG_TOUCH],
	[Parser.RNG_SIGHT]: Parser.SP_RANGE_TYPE_TO_FULL[Parser.RNG_SIGHT],
	[Parser.RNG_UNLIMITED]: Parser.SP_RANGE_TYPE_TO_FULL[Parser.RNG_UNLIMITED],
	[Parser.RNG_UNLIMITED_SAME_PLANE]: Parser.SP_RANGE_TYPE_TO_FULL[Parser.RNG_UNLIMITED_SAME_PLANE],
};

Parser.spDistanceTypeToFull = function (range) {
	return Parser._parse_aToB(Parser.SP_DIST_TYPE_TO_FULL, range);
};

Parser.SP_RANGE_TO_ICON = {
	[Parser.RNG_SPECIAL]: "fa-star",
	[Parser.RNG_POINT]: "",
	[Parser.RNG_LINE]: "fa-grip-lines-vertical",
	[Parser.RNG_CUBE]: "fa-cube",
	[Parser.RNG_CONE]: "fa-traffic-cone",
	[Parser.RNG_EMANATION]: "fa-hockey-puck",
	[Parser.RNG_RADIUS]: "fa-hockey-puck",
	[Parser.RNG_SPHERE]: "fa-globe",
	[Parser.RNG_HEMISPHERE]: "fa-globe",
	[Parser.RNG_CYLINDER]: "fa-database",
	[Parser.RNG_SELF]: "fa-street-view",
	[Parser.RNG_SIGHT]: "fa-eye",
	[Parser.RNG_UNLIMITED_SAME_PLANE]: "fa-earth-americas",
	[Parser.RNG_UNLIMITED]: "fa-infinity",
	[Parser.RNG_TOUCH]: "fa-hand",
};

Parser.spRangeTypeToIcon = function (range) {
	return Parser._parse_aToB(Parser.SP_RANGE_TO_ICON, range);
};

Parser.spRangeToShortHtml = function (range) {
	switch (range.type) {
		case Parser.RNG_SPECIAL: return `<span class="fas fa-fw ${Parser.spRangeTypeToIcon(range.type)} help-subtle" title="Special"></span>`;
		case Parser.RNG_POINT: return Parser.spRangeToShortHtml._renderPoint(range);
		case Parser.RNG_LINE:
		case Parser.RNG_CUBE:
		case Parser.RNG_CONE:
		case Parser.RNG_EMANATION:
		case Parser.RNG_RADIUS:
		case Parser.RNG_SPHERE:
		case Parser.RNG_HEMISPHERE:
		case Parser.RNG_CYLINDER:
			return Parser.spRangeToShortHtml._renderArea(range);
	}
};
Parser.spRangeToShortHtml._renderPoint = function (range) {
	const dist = range.distance;
	switch (dist.type) {
		case Parser.RNG_SELF:
		case Parser.RNG_SIGHT:
		case Parser.RNG_UNLIMITED:
		case Parser.RNG_UNLIMITED_SAME_PLANE:
		case Parser.RNG_SPECIAL:
		case Parser.RNG_TOUCH: return `<span class="fas fa-fw ${Parser.spRangeTypeToIcon(dist.type)} help-subtle" title="${Parser.spRangeTypeToFull(dist.type)}"></span>`;
		case Parser.UNT_INCHES:
		case Parser.UNT_FEET:
		case Parser.UNT_YARDS:
		case Parser.UNT_MILES:
		default:
			return `${dist.amount} <span class="ve-small">${Parser.getSingletonUnit(dist.type, true)}</span>`;
	}
};
Parser.spRangeToShortHtml._renderArea = function (range) {
	const size = range.distance;
	return `<span class="fas fa-fw ${Parser.spRangeTypeToIcon(Parser.RNG_SELF)} help-subtle" title="Self"></span> ${size.amount}<span class="ve-small">-${Parser.getSingletonUnit(size.type, true)}</span> ${Parser.spRangeToShortHtml._getAreaStyleString(range)}`;
};
Parser.spRangeToShortHtml._getAreaStyleString = function (range) {
	return `<span class="fas fa-fw ${Parser.spRangeTypeToIcon(range.type)} help-subtle" title="${Parser.spRangeTypeToFull(range.type)}"></span>`;
};

Parser.spRangeToFull = function (range, {styleHint, isDisplaySelfArea = false} = {}) {
	styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

	switch (range.type) {
		case Parser.RNG_SPECIAL: return Parser.spRangeTypeToFull(range.type);
		case Parser.RNG_POINT: return Parser.spRangeToFull._renderPoint(range);
		case Parser.RNG_LINE:
		case Parser.RNG_CUBE:
		case Parser.RNG_CONE:
		case Parser.RNG_EMANATION:
		case Parser.RNG_RADIUS:
		case Parser.RNG_SPHERE:
		case Parser.RNG_HEMISPHERE:
		case Parser.RNG_CYLINDER:
			return Parser.spRangeToFull._renderArea({range, styleHint, isDisplaySelfArea});
	}
};
Parser.spRangeToFull._renderPoint = function (range) {
	const dist = range.distance;
	switch (dist.type) {
		case Parser.RNG_SELF:
		case Parser.RNG_SIGHT:
		case Parser.RNG_UNLIMITED:
		case Parser.RNG_UNLIMITED_SAME_PLANE:
		case Parser.RNG_SPECIAL:
		case Parser.RNG_TOUCH: return Parser.spRangeTypeToFull(dist.type);
		case Parser.UNT_INCHES:
		case Parser.UNT_FEET:
		case Parser.UNT_YARDS:
		case Parser.UNT_MILES:
		default:
			return `${dist.amount} ${dist.amount === 1 ? Parser.getSingletonUnit(dist.type) : dist.type}`;
	}
};
Parser.spRangeToFull._renderArea = function ({range, styleHint, isDisplaySelfArea = false}) {
	if (styleHint !== "classic" && !isDisplaySelfArea) return "Self";
	const size = range.distance;
	return `Self (${size.amount}-${Parser.getSingletonUnit(size.type)}${Parser.spRangeToFull._getAreaStyleString(range)}${range.type === Parser.RNG_CYLINDER ? `${size.amountSecondary != null && size.typeSecondary != null ? `, ${size.amountSecondary}-${Parser.getSingletonUnit(size.typeSecondary)}-high` : ""} cylinder` : ""})`;
};
Parser.spRangeToFull._getAreaStyleString = function (range) {
	switch (range.type) {
		case Parser.RNG_SPHERE: return " radius";
		case Parser.RNG_HEMISPHERE: return `-radius ${range.type}`;
		case Parser.RNG_CYLINDER: return "-radius";
		default: return ` ${range.type}`;
	}
};

Parser.getSingletonUnit = function (unit, isShort) {
	if (!unit) return unit;
	switch (unit) {
		case Parser.UNT_INCHES:
			return isShort ? "in." : "inch";
		case Parser.UNT_FEET:
			return isShort ? "ft." : "foot";
		case Parser.UNT_YARDS:
			return isShort ? "yd." : "yard";
		case Parser.UNT_MILES:
			return isShort ? "mi." : "mile";
		default: {
			const fromPrerelease = Parser._getSingletonUnit_prereleaseBrew({unit, isShort, brewUtil: PrereleaseUtil});
			if (fromPrerelease) return fromPrerelease;

			const fromBrew = Parser._getSingletonUnit_prereleaseBrew({unit, isShort, brewUtil: BrewUtil2});
			if (fromBrew) return fromBrew;

			if (unit.charAt(unit.length - 1) === "s") return unit.slice(0, -1);
			return unit;
		}
	}
};

Parser._getSingletonUnit_prereleaseBrew = function ({unit, isShort, brewUtil}) {
	const fromBrew = brewUtil.getMetaLookup("spellDistanceUnits")?.[unit]?.["singular"];
	if (fromBrew) return fromBrew;
};

Parser.getInchesToFull = function (inches, {isShort = false} = {}) {
	const feet = Math.floor(inches / 12);
	inches = inches % 12;

	return [
		feet ? `${feet} ${isShort ? `ft.` : !feet ? Parser.getSingletonUnit(Parser.UNT_FEET) : Parser.UNT_FEET}` : null,
		inches ? `${Parser.numberToVulgar(inches)} ${isShort ? `in.` : !inches ? Parser.getSingletonUnit(Parser.UNT_INCHES) : Parser.UNT_INCHES}` : null,
	].filter(Boolean)
		.join(" ");
};

Parser.spComponentsToFull = function (comp, level, {isPlainText = false} = {}) {
	if (!comp) return "None";
	const out = [];
	if (comp.v) out.push("V");
	if (comp.s) out.push("S");
	if (comp.m != null) {
		const fnRender = isPlainText ? Renderer.stripTags.bind(Renderer) : Renderer.get().render.bind(Renderer.get());
		out.push(`M${comp.m !== true ? ` (${fnRender(comp.m.text != null ? comp.m.text : comp.m)})` : ""}`);
	}
	if (comp.r) out.push(`R (${level} gp)`);
	return out.join(", ") || "None";
};

Parser.SP_END_TYPE_TO_FULL = {
	"dispel": "dispelled",
	"trigger": "triggered",
	"discharge": "discharged",
};
Parser.spEndTypeToFull = function (type) {
	return Parser._parse_aToB(Parser.SP_END_TYPE_TO_FULL, type);
};

Parser.spDurationToFull = function (durations, {isPlainText = false, styleHint} = {}) {
	styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

	const entriesMeta = Renderer.generic.getRenderableDurationEntriesMeta(durations, {styleHint});

	if (isPlainText) return Renderer.stripTags(entriesMeta.entryDuration);
	return Renderer.get().render(entriesMeta.entryDuration);
};

Parser.DURATION_TYPES = [
	{type: "instant", full: "Instantaneous"},
	{type: "timed", hasAmount: true},
	{type: "permanent", hasEnds: true},
	{type: "special"},
];

Parser.DURATION_AMOUNT_TYPES = [
	"turn",
	"round",
	"minute",
	"hour",
	"day",
	"week",
	"month",
	"year",
];

Parser.spClassesToFull = function (sp, {isTextOnly = false, subclassLookup = {}} = {}) {
	const fromSubclassList = Renderer.spell.getCombinedClasses(sp, "fromSubclass");
	const fromSubclasses = Parser.spSubclassesToFull(fromSubclassList, {isTextOnly, subclassLookup});
	const fromClassList = Renderer.spell.getCombinedClasses(sp, "fromClassList");
	return `${Parser.spMainClassesToFull(fromClassList, {isTextOnly})}${fromSubclasses ? `, ${fromSubclasses}` : ""}`;
};

Parser.spMainClassesToFull = function (fromClassList, {isTextOnly = false, isIncludeSource = false} = {}) {
	return fromClassList
		.map(clsStub => ({hash: UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](clsStub), clsStub}))
		.filter(it => !ExcludeUtil.isInitialised || !ExcludeUtil.isExcluded(it.hash, "class", it.clsStub.source))
		.sort((a, b) => SortUtil.ascSort(a.clsStub.name, b.clsStub.name))
		.map(it => {
			if (isTextOnly) {
				if (isIncludeSource) return `${it.clsStub.name} (${Parser.sourceJsonToAbv(it.clsStub.source)})`;
				return it.clsStub.name;
			}

			const definedInSource = it.clsStub.definedInSource || it.clsStub.source;
			const ptLink = Renderer.get().render(`{@class ${it.clsStub.name}|${it.clsStub.source}}`);
			const ptSource = isIncludeSource ? ` (${Parser.sourceJsonToAbv(it.clsStub.source)})` : "";
			const ptTitle = definedInSource === it.clsStub.source ? `Class source/spell list defined in: ${Parser.sourceJsonToFull(definedInSource)}.` : `Class source: ${Parser.sourceJsonToFull(it.clsStub.source)}. Spell list defined in: ${Parser.sourceJsonToFull(definedInSource)}.`;
			return `<span title="${ptTitle.qq()}">${ptLink}${ptSource}</span>`;
		})
		.join(", ") || "";
};

Parser.spSubclassesToFull = function (fromSubclassList, {isTextOnly = false, isIncludeSource = false, subclassLookup = {}} = {}) {
	return fromSubclassList
		.filter(mt => {
			if (!ExcludeUtil.isInitialised) return true;
			const excludeClass = ExcludeUtil.isExcluded(UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](mt.class), "class", mt.class.source);
			if (excludeClass) return false;

			return !ExcludeUtil.isExcluded(
				UrlUtil.URL_TO_HASH_BUILDER["subclass"]({
					shortName: mt.subclass.name,
					source: mt.subclass.source,
					className: mt.class.name,
					classSource: mt.class.source,
				}),
				"subclass",
				mt.subclass.source,
				{isNoCount: true},
			);
		})
		.sort((a, b) => {
			const byName = SortUtil.ascSort(a.class.name, b.class.name);
			return byName || SortUtil.ascSort(a.subclass.name, b.subclass.name);
		})
		.map(c => Parser._spSubclassItem({fromSubclass: c, isTextOnly, isIncludeSource}))
		.join(", ") || "";
};

Parser._spSubclassItem = function ({fromSubclass, isTextOnly = false, isIncludeSource = false}) {
	const c = fromSubclass.class;
	const sc = fromSubclass.subclass;
	const text = `${sc.shortName}${sc.subSubclass ? ` (${sc.subSubclass})` : ""}`;
	if (isTextOnly) {
		if (isIncludeSource) return `${text} (${Parser.sourceJsonToAbv(sc.source)})`;
		return text;
	}

	const ptClass = `<span title="Source: ${Parser.sourceJsonToFull(c.source)}${c.definedInSource ? ` From a class spell list defined in: ${Parser.sourceJsonToFull(c.definedInSource)}` : ""}">${Renderer.get().render(`{@class ${c.name}|${c.source}}`)}</span>`;
	const ptSource = isIncludeSource ? ` (${Parser.sourceJsonToAbv(sc.source)})` : "";

	return `<span class="italic" title="Source: ${Parser.sourceJsonToFull(fromSubclass.subclass.source)}">${Renderer.get().render(`{@class ${c.name}|${c.source}|${text}|${sc.shortName}|${sc.source}}`)}</span>${isIncludeSource ? ptSource : ""} ${ptClass}`;
};

Parser.SPELL_ATTACK_TYPE_TO_FULL = {};
Parser.SPELL_ATTACK_TYPE_TO_FULL["M"] = "Melee";
Parser.SPELL_ATTACK_TYPE_TO_FULL["R"] = "Ranged";
Parser.SPELL_ATTACK_TYPE_TO_FULL["O"] = "Other/Unknown";

Parser.spAttackTypeToFull = function (type) {
	return Parser._parse_aToB(Parser.SPELL_ATTACK_TYPE_TO_FULL, type);
};

Parser.SPELL_AREA_TYPE_TO_FULL = {
	"ST": "Single Target",
	"MT": "Multiple Targets",
	"C": "Cube",
	"N": "Cone",
	"Y": "Cylinder",
	"S": "Sphere",
	"R": "Circle",
	"Q": "Square",
	"L": "Line",
	"H": "Hemisphere",
	"W": "Wall",
};
Parser.spAreaTypeToFull = function (type) {
	return Parser._parse_aToB(Parser.SPELL_AREA_TYPE_TO_FULL, type);
};

Parser.SP_MISC_TAG_TO_FULL = {
	"HL": "Healing",
	"THP": "Grants Temporary Hit Points",
	"SGT": "Requires Sight",
	"PRM": "Permanent Effects",
	"SCL": "Scaling Effects",
	"SCT": "Scaling Targets",
	"SMN": "Summons Creature",
	"MAC": "Modifies AC",
	"TP": "Teleportation",
	"FMV": "Forced Movement",
	"RO": "Rollable Effects",
	"LGTS": "Creates Sunlight",
	"LGT": "Creates Light",
	"UBA": "Uses Bonus Action",
	"PS": "Plane Shifting",
	"OBS": "Obscures Vision",
	"DFT": "Difficult Terrain",
	"AAD": "Additional Attack Damage",
	"OBJ": "Affects Objects",
	"ADV": "Grants Advantage",
	"PIR": "Permanent If Repeated",
};
Parser.spMiscTagToFull = function (type) {
	return Parser._parse_aToB(Parser.SP_MISC_TAG_TO_FULL, type);
};

Parser.SP_CASTER_PROGRESSION_TO_FULL = {
	full: "Full",
	"1/2": "Half",
	"1/3": "One-Third",
	"pact": "Pact Magic",
};
Parser.spCasterProgressionToFull = function (type) {
	return Parser._parse_aToB(Parser.SP_CASTER_PROGRESSION_TO_FULL, type);
};

// mon-prefix functions are for parsing monster data, and shared with the roll20 script
Parser.monTypeToFullObj = function (type) {
	const out = {
		types: [],
		tags: [],
		asText: "",
		asTextShort: "",

		typeSidekick: null,
		tagsSidekick: [],
		asTextSidekick: null,
	};
	if (type == null) return out;

	// handles e.g. "fey"
	if (typeof type === "string") {
		out.types = [type];
		out.asText = type.toTitleCase();
		out.asTextShort = out.asText;
		return out;
	}

	if (type.type?.choose) {
		out.types = type.type.choose;
	} else {
		out.types = [type.type];
	}

	if (type.swarmSize) {
		out.tags.push("swarm");
		out.asText = `swarm of ${Parser.sizeAbvToFull(type.swarmSize)} ${out.types.map(typ => Parser.monTypeToPlural(typ).toTitleCase()).joinConjunct(", ", " or ")}`;
		out.asTextShort = out.asText;
		out.swarmSize = type.swarmSize;
	} else {
		out.asText = out.types.map(typ => typ.toTitleCase()).joinConjunct(", ", " or ");
		out.asTextShort = out.asText;
	}

	const tagMetas = Parser.monTypeToFullObj._getTagMetas(type.tags);
	if (tagMetas.length) {
		out.tags.push(...tagMetas.map(({filterTag}) => filterTag));
		const ptTags = ` (${tagMetas.map(({displayTag}) => displayTag).join(", ")})`;
		out.asText += ptTags;
		out.asTextShort += ptTags;
	}

	if (type.note) out.asText += ` ${type.note}`;

	// region Sidekick
	if (type.sidekickType) {
		out.typeSidekick = type.sidekickType;
		if (!type.sidekickHidden) out.asTextSidekick = `${type.sidekickType}`;

		const tagMetas = Parser.monTypeToFullObj._getTagMetas(type.sidekickTags);
		if (tagMetas.length) {
			out.tagsSidekick.push(...tagMetas.map(({filterTag}) => filterTag));
			if (!type.sidekickHidden) out.asTextSidekick += ` (${tagMetas.map(({displayTag}) => displayTag).join(", ")})`;
		}
	}
	// endregion

	return out;
};

Parser.monTypeToFullObj._getTagMetas = (tags) => {
	return tags
		? tags.map(tag => {
			if (typeof tag === "string") { // handles e.g. "Fiend (Devil)"
				return {
					filterTag: tag.toLowerCase(),
					displayTag: tag.toTitleCase(),
				};
			} else { // handles e.g. "Humanoid (Chondathan Human)"
				return {
					filterTag: tag.tag.toLowerCase(),
					displayTag: `${tag.prefix} ${tag.tag}`.toTitleCase(),
				};
			}
		})
		: [];
};

Parser.monTypeToPlural = function (type) {
	return Parser._parse_aToB(Parser.MON_TYPE_TO_PLURAL, type);
};

Parser.monTypeFromPlural = function (type) {
	return Parser._parse_bToA(Parser.MON_TYPE_TO_PLURAL, type);
};

/* -------------------------------------------- */

Parser._getFullImmRes_isSimpleTerm = val => {
	if (typeof val === "string" || val.special) return true;
	const prop = Parser._getFullImmRes_getNextProp(val);
	return prop == null;
};

Parser._getFullImmRes_getNextProp = obj => obj.immune ? "immune" : obj.resist ? "resist" : obj.vulnerable ? "vulnerable" : null;

Parser._getFullImmRes_getRenderedString = (str, {isPlainText = false, isTitleCase = false} = {}) => {
	if (isTitleCase) str = str.toTitleCase();
	return isPlainText ? Renderer.stripTags(`${str}`) : Renderer.get().render(`${str}`);
};

Parser._getFullImmRes_getRenderedObject = (obj, {isPlainText = false, isTitleCase = false} = {}) => {
	const stack = [];

	if (obj.preNote) stack.push(Parser._getFullImmRes_getRenderedString(obj.preNote, {isPlainText}));

	const prop = Parser._getFullImmRes_getNextProp(obj);
	if (prop) stack.push(Parser._getFullImmRes_getRenderedArray(obj[prop], {isPlainText, isTitleCase, isGroup: true}));

	if (obj.note) stack.push(Parser._getFullImmRes_getRenderedString(obj.note, {isPlainText}));

	return stack.join(" ");
};

Parser._getFullImmRes_getRenderedArray = (values, {isPlainText = false, isTitleCase = false, isGroup = false} = {}) => {
	if (values.length === Parser.DMG_TYPES.length && CollectionUtil.deepEquals(Parser.DMG_TYPES, values)) {
		return "all damage"[isTitleCase ? "toTitleCase" : "toString"]();
	}

	return values
		.map((val, i, arr) => {
			const isSimpleCur = Parser._getFullImmRes_isSimpleTerm(val);

			const rendCur = isSimpleCur
				? val.special
					? Parser._getFullImmRes_getRenderedString(val.special, {isPlainText, isTitleCase: false})
					: Parser._getFullImmRes_getRenderedString(val, {isPlainText, isTitleCase})
				: Parser._getFullImmRes_getRenderedObject(val, {isPlainText, isTitleCase});

			if (i === arr.length - 1) return rendCur;

			const isSimpleNxt = Parser._getFullImmRes_isSimpleTerm(arr[i + 1]);

			if (!isSimpleCur || !isSimpleNxt) return `${rendCur}; `;
			if (!isGroup || i !== arr.length - 2 || arr.length < 2) return `${rendCur}, `;
			if (arr.length === 2) return `${rendCur} and `;
			return `${rendCur}, and `;
		})
		.join("");
};

Parser.getFullImmRes = function (values, {isPlainText = false, isTitleCase = false} = {}) {
	if (!values?.length) return "";
	return Parser._getFullImmRes_getRenderedArray(values, {isPlainText, isTitleCase});
};

/* -------------------------------------------- */

Parser.getFullCondImm = function (condImm, {isPlainText = false, isEntry = false, isTitleCase = false} = {}) {
	if (isPlainText && isEntry) throw new Error(`Options "isPlainText" and "isEntry" are mutually exclusive!`);

	if (!condImm?.length) return "";

	const render = condition => {
		if (isTitleCase) condition = condition.toTitleCase();
		if (isPlainText) return condition;
		const ent = `{@condition ${condition}}`;
		if (isEntry) return ent;
		return Renderer.get().render(ent);
	};

	return condImm
		.map(it => {
			if (it.special) return Renderer.get().render(it.special);
			if (it.conditionImmune) return `${it.preNote ? `${it.preNote} ` : ""}${it.conditionImmune.map(render).join(", ")}${it.note ? ` ${it.note}` : ""}`;
			return render(it);
		})
		.sort(SortUtil.ascSortLower).join(", ");
};

Parser.MON_SENSE_TAG_TO_FULL = {
	"B": "blindsight",
	"D": "darkvision",
	"SD": "superior darkvision",
	"T": "tremorsense",
	"U": "truesight",
};
Parser.monSenseTagToFull = function (tag) {
	return Parser._parse_aToB(Parser.MON_SENSE_TAG_TO_FULL, tag);
};

Parser.MON_SPELLCASTING_TAG_TO_FULL = {
	"P": "Psionics",
	"I": "Innate",
	"F": "Form Only",
	"S": "Shared",
	"O": "Other",
	"CA": "Class, Artificer",
	"CB": "Class, Bard",
	"CC": "Class, Cleric",
	"CD": "Class, Druid",
	"CP": "Class, Paladin",
	"CR": "Class, Ranger",
	"CS": "Class, Sorcerer",
	"CL": "Class, Warlock",
	"CW": "Class, Wizard",
};
Parser.monSpellcastingTagToFull = function (tag) {
	return Parser._parse_aToB(Parser.MON_SPELLCASTING_TAG_TO_FULL, tag);
};

Parser.MON_MISC_TAG_TO_FULL = {
	"AOE": "Has Areas of Effect",
	"CUR": "Inflicts Curse",
	"DIS": "Inflicts Disease",
	"HPR": "Has HP Reduction",
	"MW": "Has Weapon Attacks, Melee",
	"RW": "Has Weapon Attacks, Ranged",
	"MA": "Has Attacks, Melee",
	"RA": "Has Attacks, Ranged",
	"MLW": "Has Melee Weapons",
	"RNG": "Has Ranged Weapons",
	"RCH": "Has Reach Attacks",
	"THW": "Has Thrown Weapons",
};
Parser.monMiscTagToFull = function (tag) {
	return Parser._parse_aToB(Parser.MON_MISC_TAG_TO_FULL, tag);
};

Parser.MON_LANGUAGE_TAG_TO_FULL = {
	"AB": "Abyssal",
	"AQ": "Aquan",
	"AU": "Auran",
	"C": "Common",
	"CE": "Celestial",
	"CS": "Can't Speak Known Languages",
	"CSL": "Common Sign Language",
	"D": "Dwarvish",
	"DR": "Draconic",
	"DS": "Deep Speech",
	"DU": "Druidic",
	"E": "Elvish",
	"G": "Gnomish",
	"GI": "Giant",
	"GO": "Goblin",
	"GTH": "Gith",
	"H": "Halfling",
	"I": "Infernal",
	"IG": "Ignan",
	"LF": "Languages Known in Life",
	"O": "Orc",
	"OTH": "Other",
	"P": "Primordial",
	"S": "Sylvan",
	"T": "Terran",
	"TC": "Thieves' cant",
	"TP": "Telepathy",
	"U": "Undercommon",
	"X": "Any (Choose)",
	"XX": "All",
};
Parser.monLanguageTagToFull = function (tag) {
	return Parser._parse_aToB(Parser.MON_LANGUAGE_TAG_TO_FULL, tag);
};

Parser.ENVIRONMENTS = ["arctic", "coastal", "desert", "forest", "grassland", "hill", "mountain", "swamp", "underdark", "underwater", "urban"];

Parser.ENVIRONMENT__PLANAR_FEYWILD = "planar, feywild";
Parser.ENVIRONMENT__PLANAR_SHADOWFELL = "planar, shadowfell";

Parser.ENVIRONMENT__PLANAR_WATER = "planar, water";
Parser.ENVIRONMENT__PLANAR_EARTH = "planar, earth";
Parser.ENVIRONMENT__PLANAR_FIRE = "planar, fire";
Parser.ENVIRONMENT__PLANAR_AIR = "planar, air";

Parser.ENVIRONMENT__PLANAR_OOZE = "planar, ooze";
Parser.ENVIRONMENT__PLANAR_MAGMA = "planar, magma";
Parser.ENVIRONMENT__PLANAR_ASH = "planar, ash";
Parser.ENVIRONMENT__PLANAR_ICE = "planar, ice";

Parser.ENVIRONMENT__PLANAR_ELEMENTAL_CHAOS = "planar, elemental chaos";

Parser.ENVIRONMENT__PLANAR_ETHEREAL = "planar, ethereal";
Parser.ENVIRONMENT__PLANAR_ASTRAL = "planar, astral";

Parser.ENVIRONMENT__PLANAR_ARBOREA = "planar, arborea";
Parser.ENVIRONMENT__PLANAR_ARCADIA = "planar, arcadia";
Parser.ENVIRONMENT__PLANAR_BEASTLANDS = "planar, beastlands";
Parser.ENVIRONMENT__PLANAR_BYTOPIA = "planar, bytopia";
Parser.ENVIRONMENT__PLANAR_ELYSIUM = "planar, elysium";
Parser.ENVIRONMENT__PLANAR_MOUNT_CELESTIA = "planar, mount celestia";
Parser.ENVIRONMENT__PLANAR_YSGARD = "planar, ysgard";

Parser.ENVIRONMENT__PLANAR_ABYSS = "planar, abyss";
Parser.ENVIRONMENT__PLANAR_ACHERON = "planar, acheron";
Parser.ENVIRONMENT__PLANAR_CARCERI = "planar, carceri";
Parser.ENVIRONMENT__PLANAR_GEHENNA = "planar, gehenna";
Parser.ENVIRONMENT__PLANAR_HADES = "planar, hades";
Parser.ENVIRONMENT__PLANAR_NINE_HELLS = "planar, nine hells";
Parser.ENVIRONMENT__PLANAR_PANDEMONIUM = "planar, pandemonium";

Parser.ENVIRONMENT__PLANAR_LIMBO = "planar, limbo";
Parser.ENVIRONMENT__PLANAR_MECHANUS = "planar, mechanus";
Parser.ENVIRONMENT__PLANAR_OUTLANDS = "planar, outlands";

Parser.ENVIRONMENT__GROUP_PLANAR = "planar";
Parser.ENVIRONMENT__GROUP_PLANAR_TRANSITIVE = "planar, transitive";
Parser.ENVIRONMENT__GROUP_PLANAR_ELEMENTAL = "planar, elemental";
Parser.ENVIRONMENT__GROUP_PLANAR_INNER = "planar, inner";
Parser.ENVIRONMENT__GROUP_PLANAR_UPPER = "planar, upper";
Parser.ENVIRONMENT__GROUP_PLANAR_LOWER = "planar, lower";

Parser.ENVIRONMENT_GROUPS = {
	[Parser.ENVIRONMENT__GROUP_PLANAR_TRANSITIVE]: [
		Parser.ENVIRONMENT__PLANAR_ETHEREAL,
		Parser.ENVIRONMENT__PLANAR_ASTRAL,
	],
	[Parser.ENVIRONMENT__GROUP_PLANAR_ELEMENTAL]: [
		Parser.ENVIRONMENT__PLANAR_WATER,
		Parser.ENVIRONMENT__PLANAR_EARTH,
		Parser.ENVIRONMENT__PLANAR_FIRE,
		Parser.ENVIRONMENT__PLANAR_AIR,
	],
	[Parser.ENVIRONMENT__GROUP_PLANAR_INNER]: [
		Parser.ENVIRONMENT__PLANAR_WATER,
		Parser.ENVIRONMENT__PLANAR_EARTH,
		Parser.ENVIRONMENT__PLANAR_FIRE,
		Parser.ENVIRONMENT__PLANAR_AIR,

		Parser.ENVIRONMENT__PLANAR_OOZE,
		Parser.ENVIRONMENT__PLANAR_MAGMA,
		Parser.ENVIRONMENT__PLANAR_ASH,
		Parser.ENVIRONMENT__PLANAR_ICE,

		Parser.ENVIRONMENT__PLANAR_ELEMENTAL_CHAOS,
	],
	[Parser.ENVIRONMENT__GROUP_PLANAR_UPPER]: [
		Parser.ENVIRONMENT__PLANAR_ARBOREA,
		Parser.ENVIRONMENT__PLANAR_ARCADIA,
		Parser.ENVIRONMENT__PLANAR_BEASTLANDS,
		Parser.ENVIRONMENT__PLANAR_BYTOPIA,
		Parser.ENVIRONMENT__PLANAR_ELYSIUM,
		Parser.ENVIRONMENT__PLANAR_MOUNT_CELESTIA,
		Parser.ENVIRONMENT__PLANAR_YSGARD,
	],
	[Parser.ENVIRONMENT__GROUP_PLANAR_LOWER]: [
		Parser.ENVIRONMENT__PLANAR_ABYSS,
		Parser.ENVIRONMENT__PLANAR_ACHERON,
		Parser.ENVIRONMENT__PLANAR_CARCERI,
		Parser.ENVIRONMENT__PLANAR_GEHENNA,
		Parser.ENVIRONMENT__PLANAR_HADES,
		Parser.ENVIRONMENT__PLANAR_NINE_HELLS,
		Parser.ENVIRONMENT__PLANAR_PANDEMONIUM,
	],
};
Parser.ENVIRONMENT_GROUPS[Parser.ENVIRONMENT__GROUP_PLANAR] = [
	...Parser.ENVIRONMENT_GROUPS[Parser.ENVIRONMENT__GROUP_PLANAR_TRANSITIVE],
	...Parser.ENVIRONMENT_GROUPS[Parser.ENVIRONMENT__GROUP_PLANAR_INNER],
	...Parser.ENVIRONMENT_GROUPS[Parser.ENVIRONMENT__GROUP_PLANAR_UPPER],
	...Parser.ENVIRONMENT_GROUPS[Parser.ENVIRONMENT__GROUP_PLANAR_LOWER],
	Parser.ENVIRONMENT__PLANAR_LIMBO,
	Parser.ENVIRONMENT__PLANAR_MECHANUS,
	Parser.ENVIRONMENT__PLANAR_OUTLANDS,
];

Parser.getExpandedEnvironments = function (env) {
	if (!Parser.ENVIRONMENT_GROUPS[env]) return env;
	return [...Parser.ENVIRONMENT_GROUPS[env]];
};

Parser.ENVIRONMENT_DISPLAY_NAMES = {
	[Parser.ENVIRONMENT__PLANAR_FEYWILD]: "Planar (Feywild)",
	[Parser.ENVIRONMENT__PLANAR_SHADOWFELL]: "Planar (Shadowfell)",

	[Parser.ENVIRONMENT__PLANAR_WATER]: "Planar (Elemental Plane of Water)",
	[Parser.ENVIRONMENT__PLANAR_EARTH]: "Planar (Elemental Plane of Earth)",
	[Parser.ENVIRONMENT__PLANAR_FIRE]: "Planar (Elemental Plane of Fire)",
	[Parser.ENVIRONMENT__PLANAR_AIR]: "Planar (Elemental Plane of Air)",

	[Parser.ENVIRONMENT__PLANAR_OOZE]: "Planar (Para-elemental Plane of Ooze)",
	[Parser.ENVIRONMENT__PLANAR_MAGMA]: "Planar (Para-elemental Plane of Magma)",
	[Parser.ENVIRONMENT__PLANAR_ASH]: "Planar (Para-elemental Plane of Ash)",
	[Parser.ENVIRONMENT__PLANAR_ICE]: "Planar (Para-elemental Plane of Ice)",

	[Parser.ENVIRONMENT__PLANAR_ELEMENTAL_CHAOS]: "Planar (Elemental Chaos)",

	[Parser.ENVIRONMENT__PLANAR_ETHEREAL]: "Planar (Ethereal Plane)",
	[Parser.ENVIRONMENT__PLANAR_ASTRAL]: "Planar (Astral Plane)",

	[Parser.ENVIRONMENT__PLANAR_ARBOREA]: "Planar (Arborea)",
	[Parser.ENVIRONMENT__PLANAR_ARCADIA]: "Planar (Arcadia)",
	[Parser.ENVIRONMENT__PLANAR_BEASTLANDS]: "Planar (Beastlands)",
	[Parser.ENVIRONMENT__PLANAR_BYTOPIA]: "Planar (Bytopia)",
	[Parser.ENVIRONMENT__PLANAR_ELYSIUM]: "Planar (Elysium)",
	[Parser.ENVIRONMENT__PLANAR_MOUNT_CELESTIA]: "Planar (Mount Celestia)",
	[Parser.ENVIRONMENT__PLANAR_YSGARD]: "Planar (Ysgard)",

	[Parser.ENVIRONMENT__PLANAR_ABYSS]: "Planar (Abyss)",
	[Parser.ENVIRONMENT__PLANAR_ACHERON]: "Planar (Acheron)",
	[Parser.ENVIRONMENT__PLANAR_CARCERI]: "Planar (Carceri)",
	[Parser.ENVIRONMENT__PLANAR_GEHENNA]: "Planar (Gehenna)",
	[Parser.ENVIRONMENT__PLANAR_HADES]: "Planar (Hades)",
	[Parser.ENVIRONMENT__PLANAR_NINE_HELLS]: "Planar (Nine Hells)",
	[Parser.ENVIRONMENT__PLANAR_PANDEMONIUM]: "Planar (Pandemonium)",

	[Parser.ENVIRONMENT__PLANAR_LIMBO]: "Planar (Limbo)",
	[Parser.ENVIRONMENT__PLANAR_MECHANUS]: "Planar (Mechanus)",

	[Parser.ENVIRONMENT__PLANAR_OUTLANDS]: "Planar (Outlands)",

	[Parser.ENVIRONMENT__GROUP_PLANAR_TRANSITIVE]: "Planar (Transitive Planes)",
	[Parser.ENVIRONMENT__GROUP_PLANAR_ELEMENTAL]: "Planar (Elemental Planes)",
	[Parser.ENVIRONMENT__GROUP_PLANAR_INNER]: "Planar (Inner Planes)",
	[Parser.ENVIRONMENT__GROUP_PLANAR_UPPER]: "Planar (Upper Planes)",
	[Parser.ENVIRONMENT__GROUP_PLANAR_LOWER]: "Planar (Lower Planes)",
};

Parser.getEnvironmentDisplayName = function (env) {
	return Parser.ENVIRONMENT_DISPLAY_NAMES[env] || env.toTitleCase();
};

Parser.TREASURE_TYPES = ["arcana", "armaments", "implements", "relics"];

Parser.getTreasureTypeEntry = function (typ) {
	if (Parser.TREASURE_TYPES.includes(typ)) return `{@table Random Magic Items - ${typ.toTitleCase()}|${Parser.SRC_XDMG}|${typ.toTitleCase()}}`;
	return typ.toTitleCase();
};

// psi-prefix functions are for parsing psionic data, and shared with the roll20 script
Parser.PSI_ABV_TYPE_TALENT = "T";
Parser.PSI_ABV_TYPE_DISCIPLINE = "D";
Parser.PSI_ORDER_NONE = "None";
Parser.psiTypeToFull = type => Parser.psiTypeToMeta(type).full;

Parser.psiTypeToMeta = type => {
	let out = {};
	if (type === Parser.PSI_ABV_TYPE_TALENT) out = {hasOrder: false, full: "Talent"};
	else if (type === Parser.PSI_ABV_TYPE_DISCIPLINE) out = {hasOrder: true, full: "Discipline"};
	else if (PrereleaseUtil.getMetaLookup("psionicTypes")?.[type]) out = MiscUtil.copyFast(PrereleaseUtil.getMetaLookup("psionicTypes")[type]);
	else if (BrewUtil2.getMetaLookup("psionicTypes")?.[type]) out = MiscUtil.copyFast(BrewUtil2.getMetaLookup("psionicTypes")[type]);
	out.full = out.full || "Unknown";
	out.short = out.short || out.full;
	return out;
};

Parser.psiTypeAbvToStyle = function (type) { // For prerelease/homebrew
	return Parser._colorableMetaAbvToStyle({key: type, prop: "psionicTypes"});
};

Parser.psiTypeAbvToStylePart = function (type) { // For prerelease/homebrew
	return Parser._colorableMetaAbvToStylePart({key: type, prop: "psionicTypes"});
};

Parser.psiOrderToFull = (order) => {
	return order === undefined ? Parser.PSI_ORDER_NONE : order;
};

Parser.prereqSpellToFull = function (spell, {isTextOnly = false} = {}) {
	if (spell) {
		const [text, suffix] = spell.split("#");
		if (!suffix) return isTextOnly ? spell : Renderer.get().render(`{@spell ${spell}}`);
		else if (suffix === "c") return (isTextOnly ? Renderer.stripTags : Renderer.get().render.bind(Renderer.get()))(`{@spell ${text}} cantrip`);
		else if (suffix === "x") return (isTextOnly ? Renderer.stripTags : Renderer.get().render.bind(Renderer.get()))("{@spell hex} spell or a warlock feature that curses");
	} else return VeCt.STR_NONE;
};

Parser.prereqPactToFull = function (pact) {
	if (pact === "Chain") return "Pact of the Chain";
	if (pact === "Tome") return "Pact of the Tome";
	if (pact === "Blade") return "Pact of the Blade";
	if (pact === "Talisman") return "Pact of the Talisman";
	return pact;
};

Parser.prereqPatronToShort = function (patron) {
	if (patron === "Any") return patron;
	const mThe = /^The (.*?)$/.exec(patron);
	if (mThe) return mThe[1];
	return patron;
};

Parser.FEAT_CATEGORY_TO_FULL = {
	"D": "Dragonmark",
	"G": "General",
	"O": "Origin",
	"FS": "Fighting Style",
	"FS:P": "Fighting Style Replacement (Paladin)",
	"FS:R": "Fighting Style Replacement (Ranger)",
	"EB": "Epic Boon",
};

Parser.featCategoryToFull = (category) => {
	if (Parser.FEAT_CATEGORY_TO_FULL[category]) return Parser.FEAT_CATEGORY_TO_FULL[category];
	if (PrereleaseUtil.getMetaLookup("featCategories")?.[category]) return PrereleaseUtil.getMetaLookup("featCategories")[category];
	if (BrewUtil2.getMetaLookup("featCategories")?.[category]) return BrewUtil2.getMetaLookup("featCategories")[category];
	return category;
};

Parser.featCategoryFromFull = (full) => {
	return Parser._parse_bToA(Parser.FEAT_CATEGORY_TO_FULL, full.trim().toTitleCase()) || full;
};

// NOTE: These need to be reflected in omnidexer.js to be indexed
Parser.OPT_FEATURE_TYPE_TO_FULL = {
	"AI": "Artificer Infusion",
	"ED": "Elemental Discipline",
	"EI": "Eldritch Invocation",
	"MM": "Metamagic",
	"MV": "Maneuver",
	"MV:B": "Maneuver, Battle Master",
	"MV:C2-UA": "Maneuver, Cavalier V2 (UA)",
	"AS:V1-UA": "Arcane Shot, V1 (UA)",
	"AS:V2-UA": "Arcane Shot, V2 (UA)",
	"AS": "Arcane Shot",
	"OTH": "Other",
	"FS:F": "Fighting Style; Fighter",
	"FS:B": "Fighting Style; Bard",
	"FS:P": "Fighting Style; Paladin",
	"FS:R": "Fighting Style; Ranger",
	"PB": "Pact Boon",
	"OR": "Onomancy Resonant",
	"RN": "Rune Knight Rune",
	"AF": "Alchemical Formula",
	"TT": "Traveler's Trick",
	"RP": "Renown Perk",
};

Parser.optFeatureTypeToFull = function (type) {
	if (Parser.OPT_FEATURE_TYPE_TO_FULL[type]) return Parser.OPT_FEATURE_TYPE_TO_FULL[type];
	if (PrereleaseUtil.getMetaLookup("optionalFeatureTypes")?.[type]) return PrereleaseUtil.getMetaLookup("optionalFeatureTypes")[type];
	if (BrewUtil2.getMetaLookup("optionalFeatureTypes")?.[type]) return BrewUtil2.getMetaLookup("optionalFeatureTypes")[type];
	return type;
};

Parser.CHAR_OPTIONAL_FEATURE_TYPE_TO_FULL = {
	"SG": "Supernatural Gift",
	"OF": "Optional Feature",
	"DG": "Dark Gift",
	"RF:B": "Replacement Feature: Background",
	"CS": "Character Secret", // Specific to IDRotF (rules on page 14)
};

Parser.charCreationOptionTypeToFull = function (type) {
	if (Parser.CHAR_OPTIONAL_FEATURE_TYPE_TO_FULL[type]) return Parser.CHAR_OPTIONAL_FEATURE_TYPE_TO_FULL[type];
	if (PrereleaseUtil.getMetaLookup("charOption")?.[type]) return PrereleaseUtil.getMetaLookup("charOption")[type];
	if (BrewUtil2.getMetaLookup("charOption")?.[type]) return BrewUtil2.getMetaLookup("charOption")[type];
	return type;
};

Parser._ALIGNMENT_ABV_TO_FULL = {
	"L": "lawful",
	"N": "neutral",
	"NX": "neutral (law/chaos axis)",
	"NY": "neutral (good/evil axis)",
	"C": "chaotic",
	"G": "good",
	"E": "evil",
	// "special" values
	"U": "unaligned",
	"A": "any alignment",
};

Parser.alignmentAbvToFull = function (alignment) {
	if (!alignment) return null; // used in sidekicks

	if (typeof alignment === "object") {
		// use in MTF Sacred Statue
		if (alignment.special != null) return alignment.special;

		// e.g. `{alignment: ["N", "G"], chance: 50}` or `{alignment: ["N", "G"]}`
		return `${Parser.alignmentListToFull(alignment.alignment)}${alignment.chance ? ` (${alignment.chance}%)` : ""}${alignment.note ? ` (${alignment.note})` : ""}`;
	}

	alignment = alignment.toUpperCase();
	return Parser._ALIGNMENT_ABV_TO_FULL[alignment] ?? alignment;
};

Parser.alignmentListToFull = function (alignList) {
	if (!alignList) return "";

	if (alignList.some(it => typeof it !== "string")) {
		if (alignList.some(it => typeof it === "string")) throw new Error(`Mixed alignment types: ${JSON.stringify(alignList)}`);

		// filter out any nonexistent alignments, as we don't care about "alignment does not exist" if there are other alignments
		return alignList
			.filter(it => it.alignment === undefined || it.alignment != null)
			.map(it => it.special != null || it.chance != null || it.note != null ? Parser.alignmentAbvToFull(it) : Parser.alignmentListToFull(it.alignment)).join(" or ");
	}

	// assume all single-length arrays can be simply parsed
	if (alignList.length === 1) return Parser.alignmentAbvToFull(alignList[0]);
	// a pair of abv's, e.g. "L" "G"
	if (alignList.length === 2) {
		return alignList.map(a => Parser.alignmentAbvToFull(a)).join(" ");
	}
	if (alignList.length === 3) {
		if (alignList.includes("NX") && alignList.includes("NY") && alignList.includes("N")) return "any neutral alignment";
	}
	// longer arrays should have a custom mapping
	if (alignList.length === 5) {
		if (!alignList.includes("G")) return "any non-good alignment";
		if (!alignList.includes("E")) return "any non-evil alignment";
		if (!alignList.includes("L")) return "any non-lawful alignment";
		if (!alignList.includes("C")) return "any non-chaotic alignment";
	}
	if (alignList.length === 4) {
		if (!alignList.includes("L") && !alignList.includes("NX")) return "any chaotic alignment";
		if (!alignList.includes("G") && !alignList.includes("NY")) return "any evil alignment";
		if (!alignList.includes("C") && !alignList.includes("NX")) return "any lawful alignment";
		if (!alignList.includes("E") && !alignList.includes("NY")) return "any good alignment";
	}
	throw new Error(`Unmapped alignment: ${JSON.stringify(alignList)}`);
};

Parser.weightToFull = function (lbs, isSmallUnit) {
	const tons = Math.floor(lbs / 2000);
	lbs = lbs - (2000 * tons);
	return [
		tons ? `${tons}${isSmallUnit ? `<span class="ve-small ml-1">` : " "}ton${tons === 1 ? "" : "s"}${isSmallUnit ? `</span>` : ""}` : null,
		lbs ? `${lbs}${isSmallUnit ? `<span class="ve-small ml-1">` : " "}lb.${isSmallUnit ? `</span>` : ""}` : null,
	].filter(Boolean).join(", ");
};

Parser.RARITIES = ["common", "uncommon", "rare", "very rare", "legendary", "artifact"];
Parser.ITEM_RARITIES = ["none", ...Parser.RARITIES, "varies", "unknown", "unknown (magic)", "other"];

Parser.CAT_ID_CREATURE = 1;
Parser.CAT_ID_SPELL = 2;
Parser.CAT_ID_BACKGROUND = 3;
Parser.CAT_ID_ITEM = 4;
Parser.CAT_ID_CLASS = 5;
Parser.CAT_ID_CONDITION = 6;
Parser.CAT_ID_FEAT = 7;
Parser.CAT_ID_ELDRITCH_INVOCATION = 8;
Parser.CAT_ID_PSIONIC = 9;
Parser.CAT_ID_RACE = 10;
Parser.CAT_ID_OTHER_REWARD = 11;
Parser.CAT_ID_VARIANT_OPTIONAL_RULE = 12;
Parser.CAT_ID_ADVENTURE = 13;
Parser.CAT_ID_DEITY = 14;
Parser.CAT_ID_OBJECT = 15;
Parser.CAT_ID_TRAP = 16;
Parser.CAT_ID_HAZARD = 17;
Parser.CAT_ID_QUICKREF = 18;
Parser.CAT_ID_CULT = 19;
Parser.CAT_ID_BOON = 20;
Parser.CAT_ID_DISEASE = 21;
Parser.CAT_ID_METAMAGIC = 22;
Parser.CAT_ID_MANEUVER_BATTLE_MASTER = 23;
Parser.CAT_ID_TABLE = 24;
Parser.CAT_ID_TABLE_GROUP = 25;
Parser.CAT_ID_MANEUVER_CAVALIER = 26;
Parser.CAT_ID_ARCANE_SHOT = 27;
Parser.CAT_ID_OPTIONAL_FEATURE_OTHER = 28;
Parser.CAT_ID_FIGHTING_STYLE = 29;
Parser.CAT_ID_CLASS_FEATURE = 30;
Parser.CAT_ID_VEHICLE = 31;
Parser.CAT_ID_PACT_BOON = 32;
Parser.CAT_ID_ELEMENTAL_DISCIPLINE = 33;
Parser.CAT_ID_ARTIFICER_INFUSION = 34;
Parser.CAT_ID_SHIP_UPGRADE = 35;
Parser.CAT_ID_INFERNAL_WAR_MACHINE_UPGRADE = 36;
Parser.CAT_ID_ONOMANCY_RESONANT = 37;
Parser.CAT_ID_RUNE_KNIGHT_RUNE = 37;
Parser.CAT_ID_ALCHEMICAL_FORMULA = 38;
Parser.CAT_ID_MANEUVER = 39;
Parser.CAT_ID_SUBCLASS = 40;
Parser.CAT_ID_SUBCLASS_FEATURE = 41;
Parser.CAT_ID_ACTION = 42;
Parser.CAT_ID_LANGUAGE = 43;
Parser.CAT_ID_BOOK = 44;
Parser.CAT_ID_PAGE = 45;
Parser.CAT_ID_LEGENDARY_GROUP = 46;
Parser.CAT_ID_CHAR_CREATION_OPTIONS = 47;
Parser.CAT_ID_RECIPES = 48;
Parser.CAT_ID_STATUS = 49;
Parser.CAT_ID_SKILLS = 50;
Parser.CAT_ID_SENSES = 51;
Parser.CAT_ID_DECK = 52;
Parser.CAT_ID_CARD = 53;
Parser.CAT_ID_ITEM_MASTERY = 54;
Parser.CAT_ID_FACILITY = 55;

Parser.CAT_ID_GROUPS = {
	"optionalfeature": [
		Parser.CAT_ID_ELDRITCH_INVOCATION,
		Parser.CAT_ID_METAMAGIC,
		Parser.CAT_ID_MANEUVER_BATTLE_MASTER,
		Parser.CAT_ID_MANEUVER_CAVALIER,
		Parser.CAT_ID_ARCANE_SHOT,
		Parser.CAT_ID_OPTIONAL_FEATURE_OTHER,
		Parser.CAT_ID_FIGHTING_STYLE,
		Parser.CAT_ID_PACT_BOON,
		Parser.CAT_ID_ELEMENTAL_DISCIPLINE,
		Parser.CAT_ID_ARTIFICER_INFUSION,
		Parser.CAT_ID_ONOMANCY_RESONANT,
		Parser.CAT_ID_RUNE_KNIGHT_RUNE,
		Parser.CAT_ID_ALCHEMICAL_FORMULA,
		Parser.CAT_ID_MANEUVER,
	],
	"vehicleUpgrade": [
		Parser.CAT_ID_SHIP_UPGRADE,
		Parser.CAT_ID_INFERNAL_WAR_MACHINE_UPGRADE,
	],
};

Parser.CAT_ID_TO_FULL = {};
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_CREATURE] = "Bestiary";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_SPELL] = "Spell";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_BACKGROUND] = "Background";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ITEM] = "Item";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_CLASS] = "Class";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_CONDITION] = "Condition";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_FEAT] = "Feat";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ELDRITCH_INVOCATION] = "Eldritch Invocation";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_PSIONIC] = "Psionic";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_RACE] = "Species";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_OTHER_REWARD] = "Other Reward";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_VARIANT_OPTIONAL_RULE] = "Rule";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ADVENTURE] = "Adventure";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_DEITY] = "Deity";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_OBJECT] = "Object";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_TRAP] = "Trap";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_HAZARD] = "Hazard";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_QUICKREF] = "Quick Reference (2014)";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_CULT] = "Cult";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_BOON] = "Boon";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_DISEASE] = "Disease";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_METAMAGIC] = "Metamagic";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_MANEUVER_BATTLE_MASTER] = "Maneuver; Battle Master";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_TABLE] = "Table";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_TABLE_GROUP] = "Table";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_MANEUVER_CAVALIER] = "Maneuver; Cavalier";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ARCANE_SHOT] = "Arcane Shot";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_OPTIONAL_FEATURE_OTHER] = "Optional Feature";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_FIGHTING_STYLE] = "Fighting Style";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_CLASS_FEATURE] = "Class Feature";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_VEHICLE] = "Vehicle";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_PACT_BOON] = "Pact Boon";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ELEMENTAL_DISCIPLINE] = "Elemental Discipline";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ARTIFICER_INFUSION] = "Infusion";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_SHIP_UPGRADE] = "Ship Upgrade";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_INFERNAL_WAR_MACHINE_UPGRADE] = "Infernal War Machine Upgrade";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ONOMANCY_RESONANT] = "Onomancy Resonant";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_RUNE_KNIGHT_RUNE] = "Rune Knight Rune";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ALCHEMICAL_FORMULA] = "Alchemical Formula";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_MANEUVER] = "Maneuver";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_SUBCLASS] = "Subclass";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_SUBCLASS_FEATURE] = "Subclass Feature";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ACTION] = "Action";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_LANGUAGE] = "Language";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_BOOK] = "Book";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_PAGE] = "Page";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_LEGENDARY_GROUP] = "Legendary Group";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_CHAR_CREATION_OPTIONS] = "Character Creation Option";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_RECIPES] = "Recipe";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_STATUS] = "Status";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_DECK] = "Deck";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_CARD] = "Card";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_FACILITY] = "Facility";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_SKILLS] = "Skill";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_SENSES] = "Sense";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ITEM_MASTERY] = "Item Mastery";

Parser.pageCategoryToFull = function (catId) {
	return Parser._parse_aToB(Parser.CAT_ID_TO_FULL, catId);
};

Parser.CAT_ID_TO_PROP = {};
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_CREATURE] = "monster";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_SPELL] = "spell";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_BACKGROUND] = "background";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ITEM] = "item";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_CLASS] = "class";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_CONDITION] = "condition";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_FEAT] = "feat";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_PSIONIC] = "psionic";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_RACE] = "race";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_OTHER_REWARD] = "reward";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_VARIANT_OPTIONAL_RULE] = "variantrule";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ADVENTURE] = "adventure";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_DEITY] = "deity";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_OBJECT] = "object";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_TRAP] = "trap";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_HAZARD] = "hazard";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_CULT] = "cult";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_BOON] = "boon";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_DISEASE] = "condition";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_TABLE] = "table";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_TABLE_GROUP] = "tableGroup";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_VEHICLE] = "vehicle";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ELDRITCH_INVOCATION] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_MANEUVER_CAVALIER] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ARCANE_SHOT] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_OPTIONAL_FEATURE_OTHER] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_FIGHTING_STYLE] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_METAMAGIC] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_MANEUVER_BATTLE_MASTER] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_PACT_BOON] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ELEMENTAL_DISCIPLINE] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ARTIFICER_INFUSION] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_SHIP_UPGRADE] = "vehicleUpgrade";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_INFERNAL_WAR_MACHINE_UPGRADE] = "vehicleUpgrade";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ONOMANCY_RESONANT] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_RUNE_KNIGHT_RUNE] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ALCHEMICAL_FORMULA] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_MANEUVER] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_QUICKREF] = null;
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_CLASS_FEATURE] = "classFeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_SUBCLASS] = "subclass";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_SUBCLASS_FEATURE] = "subclassFeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ACTION] = "action";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_LANGUAGE] = "language";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_BOOK] = "book";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_PAGE] = null;
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_LEGENDARY_GROUP] = "legendaryGroup";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_CHAR_CREATION_OPTIONS] = "charoption";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_RECIPES] = "recipe";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_STATUS] = "status";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_DECK] = "deck";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_CARD] = "card";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_FACILITY] = "facility";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_SKILLS] = "skill";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_SENSES] = "sense";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ITEM_MASTERY] = "itemMastery";

Parser.pageCategoryToProp = function (catId) {
	return Parser._parse_aToB(Parser.CAT_ID_TO_PROP, catId);
};

Parser.ABIL_ABVS = ["str", "dex", "con", "int", "wis", "cha"];

Parser.spClassesToCurrentAndLegacy = function (fromClassList) {
	const current = [];
	const legacy = [];
	fromClassList.forEach(cls => {
		if ((cls.name === "Artificer" && cls.source === "UAArtificer") || (cls.name === "Artificer (Revisited)" && cls.source === "UAArtificerRevisited")) legacy.push(cls);
		else current.push(cls);
	});
	return [current, legacy];
};

/**
 * Build a pair of strings; one with all current subclasses, one with all legacy subclasses
 *
 * @param sp a spell
 * @param subclassLookup Data loaded from `generated/gendata-subclass-lookup.json`. Of the form: `{PHB: {Barbarian: {PHB: {Berserker: "Path of the Berserker"}}}}`
 * @param isIncludeSource
 * @returns {*[]} A two-element array. First item is a string of all the current subclasses, second item a string of
 * all the legacy/superseded subclasses
 */
Parser.spSubclassesToCurrentAndLegacyFull = function (sp, subclassLookup, {isIncludeSource = false} = {}) {
	return Parser._spSubclassesToCurrentAndLegacyFull({sp, subclassLookup, prop: "fromSubclass", isIncludeSource});
};

Parser.spVariantSubclassesToCurrentAndLegacyFull = function (sp, subclassLookup, {isIncludeSource = false} = {}) {
	return Parser._spSubclassesToCurrentAndLegacyFull({sp, subclassLookup, prop: "fromSubclassVariant", isIncludeSource});
};

Parser._spSubclassesToCurrentAndLegacyFull = ({sp, subclassLookup, prop, isIncludeSource = false}) => {
	const fromSubclass = Renderer.spell.getCombinedClasses(sp, prop);
	if (!fromSubclass.length) return ["", ""];

	const current = [];
	const legacy = [];
	const curNames = new Set();
	const toCheck = [];
	fromSubclass
		.filter(c => {
			const excludeClass = ExcludeUtil.isExcluded(
				UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES]({name: c.class.name, source: c.class.source}),
				"class",
				c.class.source,
				{isNoCount: true},
			);
			if (excludeClass) return false;

			const excludeSubclass = ExcludeUtil.isExcluded(
				UrlUtil.URL_TO_HASH_BUILDER["subclass"]({
					shortName: c.subclass.shortName,
					source: c.subclass.source,
					className: c.class.name,
					classSource: c.class.source,
				}),
				"subclass",
				c.subclass.source,
				{isNoCount: true},
			);
			if (excludeSubclass) return false;

			return !Renderer.spell.isExcludedSubclassVariantSource({classDefinedInSource: c.class.definedInSource});
		})
		.sort((a, b) => {
			const byName = SortUtil.ascSort(a.subclass.name, b.subclass.name);
			return byName || SortUtil.ascSort(a.class.name, b.class.name);
		})
		.forEach(c => {
			const nm = c.subclass.name;
			const src = c.subclass.source;

			const toAdd = Parser._spSubclassItem({fromSubclass: c, isTextOnly: false, isIncludeSource});

			const fromLookup = MiscUtil.get(
				subclassLookup,
				c.class.source,
				c.class.name,
				c.subclass.source,
				c.subclass.name,
			);

			if (fromLookup && fromLookup.isReprinted) {
				legacy.push(toAdd);
			} else if (SourceUtil.isNonstandardSource(src)) {
				const cleanName = Parser._spSubclassesToCurrentAndLegacyFull.mapClassShortNameToMostRecent(
					nm.split("(")[0].trim().split(/v\d+/)[0].trim(),
				);
				toCheck.push({"name": cleanName, "ele": toAdd});
			} else {
				current.push(toAdd);
				curNames.add(nm);
			}
		});

	toCheck.forEach(n => {
		if (curNames.has(n.name)) {
			legacy.push(n.ele);
		} else {
			current.push(n.ele);
		}
	});

	return [current.join(", "), legacy.join(", ")];
};

/**
 * Get the most recent iteration of a subclass name.
 */
Parser._spSubclassesToCurrentAndLegacyFull.mapClassShortNameToMostRecent = (shortName) => {
	switch (shortName) {
		case "Favored Soul": return "Divine Soul";
		case "Undying Light": return "Celestial";
		case "Deep Stalker": return "Gloom Stalker";
	}
	return shortName;
};

Parser.spVariantClassesToCurrentAndLegacy = function (fromVariantClassList) {
	const current = [];
	const legacy = [];
	fromVariantClassList.forEach(cls => {
		if (SourceUtil.isPrereleaseSource(cls.definedInSource)) legacy.push(cls);
		else current.push(cls);
	});
	return [current, legacy];
};

Parser.attackTypeToFull = function (attackType) {
	return Parser._parse_aToB(Parser.ATK_TYPE_TO_FULL, attackType);
};

Parser.trapHazTypeToFull = function (type) {
	return Parser._parse_aToB(Parser.TRAP_HAZARD_TYPE_TO_FULL, type);
};

Parser.TRAP_HAZARD_TYPE_TO_FULL = {
	"MECH": "Mechanical Trap",
	"MAG": "Magical Trap",
	"SMPL": "Simple Trap",
	"CMPX": "Complex Trap",
	"HAZ": "Hazard",
	"WTH": "Weather",
	"ENV": "Environmental Hazard",
	"WLD": "Wilderness Hazard",
	"GEN": "Generic",
	"EST": "Eldritch Storm",
	"TRP": "Trap",
	"HAUNT": "Haunted Trap",
};

Parser._TIER_TO_LEVEL_RANGE = {
	"1": [1, 4],
	"2": [5, 10],
	"3": [11, 16],
	"4": [17, 20],
};
Parser.tierToFullLevel = function (tier, {styleHint} = {}) {
	const range = Parser._parse_aToB(Parser._TIER_TO_LEVEL_RANGE, tier);
	if (!range) return `Tier ${tier}`;

	styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

	if (styleHint === "classic") return `${range.map(n => Parser.getOrdinalForm(n)).join("\u2013")} Level`;
	return `Levels ${range.join("\u2013")}`;
};

Parser.trapInitToFull = function (init) {
	return Parser._parse_aToB(Parser.TRAP_INIT_TO_FULL, init);
};

Parser.TRAP_INIT_TO_FULL = {};
Parser.TRAP_INIT_TO_FULL[1] = "initiative count 10";
Parser.TRAP_INIT_TO_FULL[2] = "initiative count 20";
Parser.TRAP_INIT_TO_FULL[3] = "initiative count 20 and initiative count 10";

Parser.ATK_TYPE_TO_FULL = {};
Parser.ATK_TYPE_TO_FULL["MW"] = "Melee Weapon Attack";
Parser.ATK_TYPE_TO_FULL["RW"] = "Ranged Weapon Attack";

Parser.bookOrdinalToAbv = (ordinal, {isPreNoSuff = false, isPlainText = false} = {}) => {
	if (ordinal === undefined) return "";
	switch (ordinal.type) {
		case "part": return `${isPreNoSuff ? " " : ""}${Parser._bookOrdinalToAbv_getPt({ordinal, isPlainText})} ${ordinal.identifier}${isPreNoSuff ? "" : " \u2014 "}`;
		case "chapter": return `${isPreNoSuff ? " " : ""}${Parser._bookOrdinalToAbv_getPt({ordinal, isPlainText})} ${ordinal.identifier}${isPreNoSuff ? "" : ": "}`;
		case "episode": return `${isPreNoSuff ? " " : ""}${Parser._bookOrdinalToAbv_getPt({ordinal, isPlainText})} ${ordinal.identifier}${isPreNoSuff ? "" : ": "}`;
		case "appendix": return `${isPreNoSuff ? " " : ""}${Parser._bookOrdinalToAbv_getPt({ordinal, isPlainText})}${ordinal.identifier != null ? ` ${ordinal.identifier}` : ""}${isPreNoSuff ? "" : ": "}`;
		case "level": return `${isPreNoSuff ? " " : ""}${Parser._bookOrdinalToAbv_getPt({ordinal, isPlainText})} ${ordinal.identifier}${isPreNoSuff ? "" : ": "}`;
		case "section": return `${isPreNoSuff ? " " : ""}${Parser._bookOrdinalToAbv_getPt({ordinal, isPlainText})} ${ordinal.identifier}${isPreNoSuff ? "" : ": "}`;
		default: throw new Error(`Unhandled ordinal type "${ordinal.type}"`);
	}
};

Parser._bookOrdinalToAbv_getPt = ({ordinal, isPlainText = false}) => {
	switch (ordinal.type) {
		case "part": return `Part`;
		case "chapter": return isPlainText ? `Ch.` : `<span title="Chapter">Ch.</span>`;
		case "episode": return isPlainText ? `Ep.` : `<span title="Episode">Ep.</span>`;
		case "appendix": return isPlainText ? `App.` : `<span title="Appendix">App.</span>`;
		case "section": return isPlainText ? `Sec.` : `<span title="Section">Sec.</span>`;
		case "level": return `Level`;
		default: throw new Error(`Unhandled ordinal type "${ordinal.type}"`);
	}
};

Parser.IMAGE_TYPE_TO_FULL = {
	"map": "Map",
	"mapPlayer": "Map (Player)",
};
Parser.imageTypeToFull = function (imageType) {
	return Parser._parse_aToB(Parser.IMAGE_TYPE_TO_FULL, imageType, "Other");
};

Parser.nameToTokenName = function (name, {isUrlEncode = false} = {}) {
	const out = name
		.toAscii()
		.replace(/"/g, "");
	if (!isUrlEncode) return out;
	return encodeURIComponent(out);
};

Parser.bytesToHumanReadable = function (bytes, {fixedDigits = 2} = {}) {
	if (bytes == null) return "";
	if (!bytes) return "0 B";
	const e = Math.floor(Math.log(bytes) / Math.log(1024));
	return `${(bytes / Math.pow(1024, e)).toFixed(fixedDigits)} ${`\u200bKMGTP`.charAt(e)}B`;
};

Parser.SKL_ABV_ABJ = "A";
Parser.SKL_ABV_EVO = "V";
Parser.SKL_ABV_ENC = "E";
Parser.SKL_ABV_ILL = "I";
Parser.SKL_ABV_DIV = "D";
Parser.SKL_ABV_NEC = "N";
Parser.SKL_ABV_TRA = "T";
Parser.SKL_ABV_CON = "C";
Parser.SKL_ABV_PSI = "P";
Parser.SKL_ABVS = [
	Parser.SKL_ABV_ABJ,
	Parser.SKL_ABV_CON,
	Parser.SKL_ABV_DIV,
	Parser.SKL_ABV_ENC,
	Parser.SKL_ABV_EVO,
	Parser.SKL_ABV_ILL,
	Parser.SKL_ABV_NEC,
	Parser.SKL_ABV_PSI,
	Parser.SKL_ABV_TRA,
];

Parser.SKL_ABJ = "Abjuration";
Parser.SKL_EVO = "Evocation";
Parser.SKL_ENC = "Enchantment";
Parser.SKL_ILL = "Illusion";
Parser.SKL_DIV = "Divination";
Parser.SKL_NEC = "Necromancy";
Parser.SKL_TRA = "Transmutation";
Parser.SKL_CON = "Conjuration";
Parser.SKL_PSI = "Psionic";

Parser.SP_SCHOOL_ABV_TO_FULL = {};
Parser.SP_SCHOOL_ABV_TO_FULL[Parser.SKL_ABV_ABJ] = Parser.SKL_ABJ;
Parser.SP_SCHOOL_ABV_TO_FULL[Parser.SKL_ABV_EVO] = Parser.SKL_EVO;
Parser.SP_SCHOOL_ABV_TO_FULL[Parser.SKL_ABV_ENC] = Parser.SKL_ENC;
Parser.SP_SCHOOL_ABV_TO_FULL[Parser.SKL_ABV_ILL] = Parser.SKL_ILL;
Parser.SP_SCHOOL_ABV_TO_FULL[Parser.SKL_ABV_DIV] = Parser.SKL_DIV;
Parser.SP_SCHOOL_ABV_TO_FULL[Parser.SKL_ABV_NEC] = Parser.SKL_NEC;
Parser.SP_SCHOOL_ABV_TO_FULL[Parser.SKL_ABV_TRA] = Parser.SKL_TRA;
Parser.SP_SCHOOL_ABV_TO_FULL[Parser.SKL_ABV_CON] = Parser.SKL_CON;
Parser.SP_SCHOOL_ABV_TO_FULL[Parser.SKL_ABV_PSI] = Parser.SKL_PSI;

Parser.SP_SCHOOL_ABV_TO_SHORT = {};
Parser.SP_SCHOOL_ABV_TO_SHORT[Parser.SKL_ABV_ABJ] = "Abj.";
Parser.SP_SCHOOL_ABV_TO_SHORT[Parser.SKL_ABV_EVO] = "Evoc.";
Parser.SP_SCHOOL_ABV_TO_SHORT[Parser.SKL_ABV_ENC] = "Ench.";
Parser.SP_SCHOOL_ABV_TO_SHORT[Parser.SKL_ABV_ILL] = "Illu.";
Parser.SP_SCHOOL_ABV_TO_SHORT[Parser.SKL_ABV_DIV] = "Divin.";
Parser.SP_SCHOOL_ABV_TO_SHORT[Parser.SKL_ABV_NEC] = "Necro.";
Parser.SP_SCHOOL_ABV_TO_SHORT[Parser.SKL_ABV_TRA] = "Trans.";
Parser.SP_SCHOOL_ABV_TO_SHORT[Parser.SKL_ABV_CON] = "Conj.";
Parser.SP_SCHOOL_ABV_TO_SHORT[Parser.SKL_ABV_PSI] = "Psi.";

Parser.ATB_ABV_TO_FULL = {
	"str": "Strength",
	"dex": "Dexterity",
	"con": "Constitution",
	"int": "Intelligence",
	"wis": "Wisdom",
	"cha": "Charisma",
};

Parser.TP_ABERRATION = "aberration";
Parser.TP_BEAST = "beast";
Parser.TP_CELESTIAL = "celestial";
Parser.TP_CONSTRUCT = "construct";
Parser.TP_DRAGON = "dragon";
Parser.TP_ELEMENTAL = "elemental";
Parser.TP_FEY = "fey";
Parser.TP_FIEND = "fiend";
Parser.TP_GIANT = "giant";
Parser.TP_HUMANOID = "humanoid";
Parser.TP_MONSTROSITY = "monstrosity";
Parser.TP_OOZE = "ooze";
Parser.TP_PLANT = "plant";
Parser.TP_UNDEAD = "undead";
Parser.MON_TYPES = [Parser.TP_ABERRATION, Parser.TP_BEAST, Parser.TP_CELESTIAL, Parser.TP_CONSTRUCT, Parser.TP_DRAGON, Parser.TP_ELEMENTAL, Parser.TP_FEY, Parser.TP_FIEND, Parser.TP_GIANT, Parser.TP_HUMANOID, Parser.TP_MONSTROSITY, Parser.TP_OOZE, Parser.TP_PLANT, Parser.TP_UNDEAD];
Parser.MON_TYPE_TO_PLURAL = {};
Parser.MON_TYPE_TO_PLURAL[Parser.TP_ABERRATION] = "aberrations";
Parser.MON_TYPE_TO_PLURAL[Parser.TP_BEAST] = "beasts";
Parser.MON_TYPE_TO_PLURAL[Parser.TP_CELESTIAL] = "celestials";
Parser.MON_TYPE_TO_PLURAL[Parser.TP_CONSTRUCT] = "constructs";
Parser.MON_TYPE_TO_PLURAL[Parser.TP_DRAGON] = "dragons";
Parser.MON_TYPE_TO_PLURAL[Parser.TP_ELEMENTAL] = "elementals";
Parser.MON_TYPE_TO_PLURAL[Parser.TP_FEY] = "fey";
Parser.MON_TYPE_TO_PLURAL[Parser.TP_FIEND] = "fiends";
Parser.MON_TYPE_TO_PLURAL[Parser.TP_GIANT] = "giants";
Parser.MON_TYPE_TO_PLURAL[Parser.TP_HUMANOID] = "humanoids";
Parser.MON_TYPE_TO_PLURAL[Parser.TP_MONSTROSITY] = "monstrosities";
Parser.MON_TYPE_TO_PLURAL[Parser.TP_OOZE] = "oozes";
Parser.MON_TYPE_TO_PLURAL[Parser.TP_PLANT] = "plants";
Parser.MON_TYPE_TO_PLURAL[Parser.TP_UNDEAD] = "undead";

Parser.SZ_FINE = "F";
Parser.SZ_DIMINUTIVE = "D";
Parser.SZ_TINY = "T";
Parser.SZ_SMALL = "S";
Parser.SZ_MEDIUM = "M";
Parser.SZ_LARGE = "L";
Parser.SZ_HUGE = "H";
Parser.SZ_GARGANTUAN = "G";
Parser.SZ_COLOSSAL = "C";
Parser.SZ_VARIES = "V";
Parser.SIZE_ABVS = [Parser.SZ_TINY, Parser.SZ_SMALL, Parser.SZ_MEDIUM, Parser.SZ_LARGE, Parser.SZ_HUGE, Parser.SZ_GARGANTUAN, Parser.SZ_VARIES];
Parser.SIZE_ABV_TO_FULL = {};
Parser.SIZE_ABV_TO_FULL[Parser.SZ_FINE] = "Fine";
Parser.SIZE_ABV_TO_FULL[Parser.SZ_DIMINUTIVE] = "Diminutive";
Parser.SIZE_ABV_TO_FULL[Parser.SZ_TINY] = "Tiny";
Parser.SIZE_ABV_TO_FULL[Parser.SZ_SMALL] = "Small";
Parser.SIZE_ABV_TO_FULL[Parser.SZ_MEDIUM] = "Medium";
Parser.SIZE_ABV_TO_FULL[Parser.SZ_LARGE] = "Large";
Parser.SIZE_ABV_TO_FULL[Parser.SZ_HUGE] = "Huge";
Parser.SIZE_ABV_TO_FULL[Parser.SZ_GARGANTUAN] = "Gargantuan";
Parser.SIZE_ABV_TO_FULL[Parser.SZ_COLOSSAL] = "Colossal";
Parser.SIZE_ABV_TO_FULL[Parser.SZ_VARIES] = "Varies";

Parser.XP_CHART_ALT = {
	"0": 10,
	"1/8": 25,
	"1/4": 50,
	"1/2": 100,
	"1": 200,
	"2": 450,
	"3": 700,
	"4": 1100,
	"5": 1800,
	"6": 2300,
	"7": 2900,
	"8": 3900,
	"9": 5000,
	"10": 5900,
	"11": 7200,
	"12": 8400,
	"13": 10000,
	"14": 11500,
	"15": 13000,
	"16": 15000,
	"17": 18000,
	"18": 20000,
	"19": 22000,
	"20": 25000,
	"21": 33000,
	"22": 41000,
	"23": 50000,
	"24": 62000,
	"25": 75000,
	"26": 90000,
	"27": 105000,
	"28": 120000,
	"29": 135000,
	"30": 155000,
};

Parser.ARMOR_ABV_TO_FULL = {
	"l.": "light",
	"m.": "medium",
	"h.": "heavy",
	"s.": "shield",
};

Parser.WEAPON_ABV_TO_FULL = {
	"s.": "simple",
	"m.": "martial",
};

Parser.CONDITION_TO_COLOR = {
	"Blinded": "#525252",
	"Charmed": "#f01789",
	"Deafened": "#ababab",
	"Exhausted": "#947a47",
	"Frightened": "#c9ca18",
	"Grappled": "#8784a0",
	"Incapacitated": "#3165a0",
	"Invisible": "#7ad2d6",
	"Paralyzed": "#c00900",
	"Petrified": "#a0a0a0",
	"Poisoned": "#4dc200",
	"Prone": "#5e60a0",
	"Restrained": "#d98000",
	"Stunned": "#a23bcb",
	"Unconscious": "#3a40ad",

	"Concentration": "#009f7a",
};

Parser.RULE_TYPE_TO_FULL = {
	"C": "Core",
	"O": "Optional",
	"P": "Prerelease",
	"V": "Variant",
	"VO": "Variant Optional",
	"VV": "Variant Variant",
	"U": "Unknown",
};

Parser.ruleTypeToFull = function (ruleType) {
	return Parser._parse_aToB(Parser.RULE_TYPE_TO_FULL, ruleType);
};

Parser.VEHICLE_TYPE_TO_FULL = {
	"SHIP": "Ship",
	"SPELLJAMMER": "Spelljammer Ship",
	"ELEMENTAL_AIRSHIP": "Elemental Airship",
	"INFWAR": "Infernal War Machine",
	"CREATURE": "Creature",
	"OBJECT": "Object",
	"SHP:H": "Ship Upgrade, Hull",
	"SHP:M": "Ship Upgrade, Movement",
	"SHP:W": "Ship Upgrade, Weapon",
	"SHP:F": "Ship Upgrade, Figurehead",
	"SHP:O": "Ship Upgrade, Miscellaneous",
	"IWM:W": "Infernal War Machine Variant, Weapon",
	"IWM:A": "Infernal War Machine Upgrade, Armor",
	"IWM:G": "Infernal War Machine Upgrade, Gadget",
};

Parser.vehicleTypeToFull = function (vehicleType) {
	return Parser._parse_aToB(Parser.VEHICLE_TYPE_TO_FULL, vehicleType);
};

// SOURCES =============================================================================================================

Parser.SRC_5ETOOLS_TMP = "SRC_5ETOOLS_TMP"; // Temp source, used as a placeholder value

Parser.SRC_CoS = "CoS";
Parser.SRC_DMG = "DMG";
Parser.SRC_EEPC = "EEPC";
Parser.SRC_EET = "EET";
Parser.SRC_HotDQ = "HotDQ";
Parser.SRC_LMoP = "LMoP";
Parser.SRC_MM = "MM";
Parser.SRC_OotA = "OotA";
Parser.SRC_PHB = "PHB";
Parser.SRC_PotA = "PotA";
Parser.SRC_RoT = "RoT";
Parser.SRC_RoTOS = "RoTOS";
Parser.SRC_SCAG = "SCAG";
Parser.SRC_SKT = "SKT";
Parser.SRC_ToA = "ToA";
Parser.SRC_TLK = "TLK";
Parser.SRC_ToD = "ToD";
Parser.SRC_TTP = "TTP";
Parser.SRC_TYP = "TftYP";
Parser.SRC_TYP_AtG = "TftYP-AtG";
Parser.SRC_TYP_DiT = "TftYP-DiT";
Parser.SRC_TYP_TFoF = "TftYP-TFoF";
Parser.SRC_TYP_THSoT = "TftYP-THSoT";
Parser.SRC_TYP_TSC = "TftYP-TSC";
Parser.SRC_TYP_ToH = "TftYP-ToH";
Parser.SRC_TYP_WPM = "TftYP-WPM";
Parser.SRC_VGM = "VGM";
Parser.SRC_XGE = "XGE";
Parser.SRC_OGA = "OGA";
Parser.SRC_MTF = "MTF";
Parser.SRC_WDH = "WDH";
Parser.SRC_WDMM = "WDMM";
Parser.SRC_GGR = "GGR";
Parser.SRC_KKW = "KKW";
Parser.SRC_LLK = "LLK";
Parser.SRC_AZfyT = "AZfyT";
Parser.SRC_GoS = "GoS";
Parser.SRC_AI = "AI";
Parser.SRC_OoW = "OoW";
Parser.SRC_ESK = "ESK";
Parser.SRC_DIP = "DIP";
Parser.SRC_HftT = "HftT";
Parser.SRC_DC = "DC";
Parser.SRC_SLW = "SLW";
Parser.SRC_SDW = "SDW";
Parser.SRC_BGDIA = "BGDIA";
Parser.SRC_LR = "LR";
Parser.SRC_AL = "AL";
Parser.SRC_SAC = "SAC";
Parser.SRC_ERLW = "ERLW";
Parser.SRC_EFR = "EFR";
Parser.SRC_RMBRE = "RMBRE";
Parser.SRC_RMR = "RMR";
Parser.SRC_MFF = "MFF";
Parser.SRC_AWM = "AWM";
Parser.SRC_IMR = "IMR";
Parser.SRC_SADS = "SADS";
Parser.SRC_EGW = "EGW";
Parser.SRC_EGW_ToR = "ToR";
Parser.SRC_EGW_DD = "DD";
Parser.SRC_EGW_FS = "FS";
Parser.SRC_EGW_US = "US";
Parser.SRC_MOT = "MOT";
Parser.SRC_IDRotF = "IDRotF";
Parser.SRC_TCE = "TCE";
Parser.SRC_VRGR = "VRGR";
Parser.SRC_HoL = "HoL";
Parser.SRC_XMtS = "XMtS";
Parser.SRC_RtG = "RtG";
Parser.SRC_AitFR = "AitFR";
Parser.SRC_AitFR_ISF = "AitFR-ISF";
Parser.SRC_AitFR_THP = "AitFR-THP";
Parser.SRC_AitFR_AVT = "AitFR-AVT";
Parser.SRC_AitFR_DN = "AitFR-DN";
Parser.SRC_AitFR_FCD = "AitFR-FCD";
Parser.SRC_WBtW = "WBtW";
Parser.SRC_DoD = "DoD";
Parser.SRC_MaBJoV = "MaBJoV";
Parser.SRC_FTD = "FTD";
Parser.SRC_SCC = "SCC";
Parser.SRC_SCC_CK = "SCC-CK";
Parser.SRC_SCC_HfMT = "SCC-HfMT";
Parser.SRC_SCC_TMM = "SCC-TMM";
Parser.SRC_SCC_ARiR = "SCC-ARiR";
Parser.SRC_MPMM = "MPMM";
Parser.SRC_CRCotN = "CRCotN";
Parser.SRC_JttRC = "JttRC";
Parser.SRC_SAiS = "SAiS";
Parser.SRC_AAG = "AAG";
Parser.SRC_BAM = "BAM";
Parser.SRC_LoX = "LoX";
Parser.SRC_DoSI = "DoSI";
Parser.SRC_DSotDQ = "DSotDQ";
Parser.SRC_KftGV = "KftGV";
Parser.SRC_BGG = "BGG";
Parser.SRC_PaBTSO = "PaBTSO";
Parser.SRC_PAitM = "PAitM";
Parser.SRC_SatO = "SatO";
Parser.SRC_ToFW = "ToFW";
Parser.SRC_MPP = "MPP";
Parser.SRC_BMT = "BMT";
Parser.SRC_DMTCRG = "DMTCRG";
Parser.SRC_QftIS = "QftIS";
Parser.SRC_VEoR = "VEoR";
Parser.SRC_XPHB = "XPHB";
Parser.SRC_XDMG = "XDMG";
Parser.SRC_XMM = "XMM";
Parser.SRC_DrDe = "DrDe";
Parser.SRC_DrDe_DaS = "DrDe-DaS";
Parser.SRC_DrDe_BD = "DrDe-BD";
Parser.SRC_DrDe_TWoO = "DrDe-TWoO";
Parser.SRC_DrDe_FWtVC = "DrDe-FWtVC";
Parser.SRC_DrDe_TDoN = "DrDe-TDoN";
Parser.SRC_DrDe_TFV = "DrDe-TFV";
Parser.SRC_DrDe_BtS = "DrDe-BtS";
Parser.SRC_DrDe_SD = "DrDe-SD";
Parser.SRC_DrDe_ACfaS = "DrDe-ACfaS";
Parser.SRC_DrDe_DotS = "DrDe-DotSC";
Parser.SRC_HotB = "HotB";
Parser.SRC_WttHC = "WttHC";
Parser.SRC_FRAiF = "FRAiF";
Parser.SRC_FRHoF = "FRHoF";
Parser.SRC_ABH = "ABH";
Parser.SRC_NF = "NF";
Parser.SRC_LFL = "LFL";
Parser.SRC_EFA = "EFA";
Parser.SRC_FFotR = "FFotR";
Parser.SRC_TD = "TD";
Parser.SRC_SCREEN = "Screen";
Parser.SRC_SCREEN_WILDERNESS_KIT = "ScreenWildernessKit";
Parser.SRC_SCREEN_DUNGEON_KIT = "ScreenDungeonKit";
Parser.SRC_SCREEN_SPELLJAMMER = "ScreenSpelljammer";
Parser.SRC_XSCREEN = "XScreen";
Parser.SRC_HF = "HF";
Parser.SRC_HFFotM = "HFFotM";
Parser.SRC_HFStCM = "HFStCM";
Parser.SRC_PaF = "PaF";
Parser.SRC_HFDoMM = "HFDoMM";
Parser.SRC_CM = "CM";
Parser.SRC_NRH = "NRH";
Parser.SRC_NRH_TCMC = "NRH-TCMC";
Parser.SRC_NRH_AVitW = "NRH-AVitW";
Parser.SRC_NRH_ASS = "NRH-ASS"; // lmao
Parser.SRC_NRH_CoI = "NRH-CoI";
Parser.SRC_NRH_TLT = "NRH-TLT";
Parser.SRC_NRH_AWoL = "NRH-AWoL";
Parser.SRC_NRH_AT = "NRH-AT";
Parser.SRC_MGELFT = "MGELFT";
Parser.SRC_VD = "VD";
Parser.SRC_SjA = "SjA";
Parser.SRC_HAT_TG = "HAT-TG";
Parser.SRC_HAT_LMI = "HAT-LMI";
Parser.SRC_GotSF = "GotSF";
Parser.SRC_LK = "LK";
Parser.SRC_CoA = "CoA";
Parser.SRC_PiP = "PiP";
Parser.SRC_DitLCoT = "DitLCoT";
Parser.SRC_VNotEE = "VNotEE";
Parser.SRC_LRDT = "LRDT";
Parser.SRC_UtHftLH = "UtHftLH";
Parser.SRC_ScoEE = "ScoEE";
Parser.SRC_HBTD = "HBTD";
Parser.SRC_BQGT = "BQGT";

Parser.SRC_AL_PREFIX = "AL";

Parser.SRC_ALCoS = `${Parser.SRC_AL_PREFIX}CurseOfStrahd`;
Parser.SRC_ALEE = `${Parser.SRC_AL_PREFIX}ElementalEvil`;
Parser.SRC_ALRoD = `${Parser.SRC_AL_PREFIX}RageOfDemons`;

Parser.SRC_PS_PREFIX = "PS";

Parser.SRC_PSA = `${Parser.SRC_PS_PREFIX}A`;
Parser.SRC_PSI = `${Parser.SRC_PS_PREFIX}I`;
Parser.SRC_PSK = `${Parser.SRC_PS_PREFIX}K`;
Parser.SRC_PSZ = `${Parser.SRC_PS_PREFIX}Z`;
Parser.SRC_PSX = `${Parser.SRC_PS_PREFIX}X`;
Parser.SRC_PSD = `${Parser.SRC_PS_PREFIX}D`;

Parser.SRC_UA_PREFIX = "UA";
Parser.SRC_UA_ONE_PREFIX = "XUA";
Parser.SRC_MCVX_PREFIX = "MCV";
Parser.SRC_MisMVX_PREFIX = "MisMV";
Parser.SRC_AA_PREFIX = "AA";

Parser.SRC_UATMC = `${Parser.SRC_UA_PREFIX}TheMysticClass`;
Parser.SRC_MCV1SC = `${Parser.SRC_MCVX_PREFIX}1SC`;
Parser.SRC_MCV2DC = `${Parser.SRC_MCVX_PREFIX}2DC`;
Parser.SRC_MCV3MC = `${Parser.SRC_MCVX_PREFIX}3MC`;
Parser.SRC_MCV4EC = `${Parser.SRC_MCVX_PREFIX}4EC`;
Parser.SRC_MisMV1 = `${Parser.SRC_MisMVX_PREFIX}1`;
Parser.SRC_AATM = `${Parser.SRC_AA_PREFIX}TM`;

Parser.AL_PREFIX = "Adventurers League: ";
Parser.AL_PREFIX_SHORT = "AL: ";
Parser.PS_PREFIX = "Plane Shift: ";
Parser.PS_PREFIX_SHORT = "PS: ";
Parser.UA_PREFIX = "Unearthed Arcana: ";
Parser.UA_PREFIX_SHORT = "UA: ";
Parser.TftYP_NAME = "Tales from the Yawning Portal";
Parser.AitFR_NAME = "Adventures in the Forgotten Realms";
Parser.NRH_NAME = "NERDS Restoring Harmony";
Parser.MCVX_PREFIX = "Monstrous Compendium Volume ";
Parser.MisMVX_PREFIX = "Misplaced Monsters: Volume ";
Parser.AA_PREFIX = "Adventure Atlas: ";

Parser.SOURCE_JSON_TO_FULL = {};
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_PHB] = "Player's Handbook (2014)";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_DMG] = "Dungeon Master's Guide (2014)";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_MM] = "Monster Manual (2014)";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_CoS] = "Curse of Strahd";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_EEPC] = "Elemental Evil Player's Companion";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_EET] = "Elemental Evil: Trinkets";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_HotDQ] = "Hoard of the Dragon Queen";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_LMoP] = "Lost Mine of Phandelver";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_OotA] = "Out of the Abyss";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_PotA] = "Princes of the Apocalypse";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_RoT] = "The Rise of Tiamat";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_RoTOS] = "The Rise of Tiamat Online Supplement";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_SCAG] = "Sword Coast Adventurer's Guide";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_SKT] = "Storm King's Thunder";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_ToA] = "Tomb of Annihilation";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_TLK] = "The Lost Kenku";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_ToD] = "Tyranny of Dragons";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_TTP] = "The Tortle Package";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_TYP] = Parser.TftYP_NAME;
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_TYP_AtG] = `${Parser.TftYP_NAME}: Against the Giants`;
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_TYP_DiT] = `${Parser.TftYP_NAME}: Dead in Thay`;
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_TYP_TFoF] = `${Parser.TftYP_NAME}: The Forge of Fury`;
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_TYP_THSoT] = `${Parser.TftYP_NAME}: The Hidden Shrine of Tamoachan`;
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_TYP_TSC] = `${Parser.TftYP_NAME}: The Sunless Citadel`;
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_TYP_ToH] = `${Parser.TftYP_NAME}: Tomb of Horrors`;
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_TYP_WPM] = `${Parser.TftYP_NAME}: White Plume Mountain`;
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_VGM] = "Volo's Guide to Monsters";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_XGE] = "Xanathar's Guide to Everything";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_OGA] = "One Grung Above";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_MTF] = "Mordenkainen's Tome of Foes";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_WDH] = "Waterdeep: Dragon Heist";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_WDMM] = "Waterdeep: Dungeon of the Mad Mage";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_GGR] = "Guildmasters' Guide to Ravnica";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_KKW] = "Krenko's Way";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_LLK] = "Lost Laboratory of Kwalish";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_AZfyT] = "A Zib for your Thoughts";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_GoS] = "Ghosts of Saltmarsh";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_AI] = "Acquisitions Incorporated";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_OoW] = "The Orrery of the Wanderer";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_ESK] = "Essentials Kit";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_DIP] = "Dragon of Icespire Peak";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_HftT] = "Hunt for the Thessalhydra";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_DC] = "Divine Contention";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_SLW] = "Storm Lord's Wrath";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_SDW] = "Sleeping Dragon's Wake";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_BGDIA] = "Baldur's Gate: Descent Into Avernus";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_LR] = "Locathah Rising";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_AL] = "Adventurers' League";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_SAC] = "Sage Advice Compendium";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_ERLW] = "Eberron: Rising from the Last War";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_EFR] = "Eberron: Forgotten Relics";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_RMBRE] = "The Lost Dungeon of Rickedness: Big Rick Energy";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_RMR] = "Dungeons & Dragons vs. Rick and Morty: Basic Rules";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_MFF] = "Mordenkainen's Fiendish Folio";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_AWM] = "Adventure with Muk";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_IMR] = "Infernal Machine Rebuild";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_SADS] = "Sapphire Anniversary Dice Set";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_EGW] = "Explorer's Guide to Wildemount";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_EGW_ToR] = "Tide of Retribution";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_EGW_DD] = "Dangerous Designs";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_EGW_FS] = "Frozen Sick";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_EGW_US] = "Unwelcome Spirits";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_MOT] = "Mythic Odysseys of Theros";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_IDRotF] = "Icewind Dale: Rime of the Frostmaiden";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_TCE] = "Tasha's Cauldron of Everything";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_VRGR] = "Van Richten's Guide to Ravenloft";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_HoL] = "The House of Lament";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_RtG] = "Return to Glory";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_AitFR] = Parser.AitFR_NAME;
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_AitFR_ISF] = `${Parser.AitFR_NAME}: In Scarlet Flames`;
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_AitFR_THP] = `${Parser.AitFR_NAME}: The Hidden Page`;
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_AitFR_AVT] = `${Parser.AitFR_NAME}: A Verdant Tomb`;
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_AitFR_DN] = `${Parser.AitFR_NAME}: Deepest Night`;
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_AitFR_FCD] = `${Parser.AitFR_NAME}: From Cyan Depths`;
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_WBtW] = "The Wild Beyond the Witchlight";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_DoD] = "Domains of Delight";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_MaBJoV] = "Minsc and Boo's Journal of Villainy";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_FTD] = "Fizban's Treasury of Dragons";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_SCC] = "Strixhaven: A Curriculum of Chaos";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_SCC_CK] = "Campus Kerfuffle";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_SCC_HfMT] = "Hunt for Mage Tower";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_SCC_TMM] = "The Magister's Masquerade";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_SCC_ARiR] = "A Reckoning in Ruins";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_MPMM] = "Mordenkainen Presents: Monsters of the Multiverse";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_CRCotN] = "Critical Role: Call of the Netherdeep";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_JttRC] = "Journeys through the Radiant Citadel";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_SAiS] = "Spelljammer: Adventures in Space";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_AAG] = "Astral Adventurer's Guide";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_BAM] = "Boo's Astral Menagerie";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_LoX] = "Light of Xaryxis";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_DoSI] = "Dragons of Stormwreck Isle";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_DSotDQ] = "Dragonlance: Shadow of the Dragon Queen";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_KftGV] = "Keys from the Golden Vault";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_BGG] = "Bigby Presents: Glory of the Giants";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_PaBTSO] = "Phandelver and Below: The Shattered Obelisk";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_PAitM] = "Planescape: Adventures in the Multiverse";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_SatO] = "Sigil and the Outlands";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_ToFW] = "Turn of Fortune's Wheel";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_MPP] = "Morte's Planar Parade";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_BMT] = "The Book of Many Things";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_DMTCRG] = "The Deck of Many Things: Card Reference Guide";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_QftIS] = "Quests from the Infinite Staircase";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_VEoR] = "Vecna: Eve of Ruin";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_XPHB] = "Player's Handbook (2024)";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_XDMG] = "Dungeon Master's Guide (2024)";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_XMM] = "Monster Manual (2025)";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_DrDe] = "Dragon Delves";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_DrDe_DaS] = "Death at Sunset";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_DrDe_BD] = "Baker's Doesn't";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_DrDe_TWoO] = "The Will of Orcus";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_DrDe_FWtVC] = "For Whom the Void Calls";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_DrDe_TDoN] = "The Dragon of Najkir";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_DrDe_TFV] = "The Forbidden Vale";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_DrDe_BtS] = "Before the Storm";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_DrDe_SD] = "Shivering Death";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_DrDe_ACfaS] = "A Copper for a Song";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_DrDe_DotS] = "Dragons of the Sandstone City";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_HotB] = "Heroes of the Borderlands";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_WttHC] = "Stranger Things: Welcome to the Hellfire Club";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_FRAiF] = "Forgotten Realms: Adventures in Faerûn";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_FRHoF] = "Forgotten Realms: Heroes of Faerûn";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_ABH] = "Astarion's Book of Hungers";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_NF] = "Netheril's Fall";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_LFL] = "Lorwyn: First Light";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_EFA] = "Eberron: Forge of the Artificer";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_FFotR] = "Fated Flight of the Recluse";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_TD] = "Tarot Deck";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_SCREEN] = "Dungeon Master's Screen";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_SCREEN_WILDERNESS_KIT] = "Dungeon Master's Screen: Wilderness Kit";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_SCREEN_DUNGEON_KIT] = "Dungeon Master's Screen: Dungeon Kit";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_SCREEN_SPELLJAMMER] = "Dungeon Master's Screen: Spelljammer";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_XSCREEN] = "Dungeon Master's Screen (2024)";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_HF] = "Heroes' Feast";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_HFFotM] = "Heroes' Feast: Flavors of the Multiverse";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_HFStCM] = "Heroes' Feast: Saving the Children's Menu";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_PaF] = "Puncheons and Flagons";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_HFDoMM] = "Heroes' Feast: The Deck of Many Morsels";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_CM] = "Candlekeep Mysteries";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_NRH] = Parser.NRH_NAME;
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_NRH_TCMC] = `${Parser.NRH_NAME}: The Candy Mountain Caper`;
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_NRH_AVitW] = `${Parser.NRH_NAME}: A Voice in the Wilderness`;
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_NRH_ASS] = `${Parser.NRH_NAME}: A Sticky Situation`;
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_NRH_CoI] = `${Parser.NRH_NAME}: Circus of Illusions`;
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_NRH_TLT] = `${Parser.NRH_NAME}: The Lost Tomb`;
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_NRH_AWoL] = `${Parser.NRH_NAME}: A Web of Lies`;
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_NRH_AT] = `${Parser.NRH_NAME}: Adventure Together`;
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_MGELFT] = "Muk's Guide To Everything He Learned From Tasha";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_VD] = "Vecna Dossier";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_SjA] = "Spelljammer Academy";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_HAT_TG] = "Honor Among Thieves: Thieves' Gallery";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_HAT_LMI] = "Honor Among Thieves: Legendary Magic Items";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_GotSF] = "Giants of the Star Forge";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_LK] = "Lightning Keep";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_CoA] = "Chains of Asmodeus";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_PiP] = "Peril in Pinebrook";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_DitLCoT] = "Descent into the Lost Caverns of Tsojcanth";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_VNotEE] = "Vecna: Nest of the Eldritch Eye";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_LRDT] = "Red Dragon's Tale: A LEGO Adventure";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_UtHftLH] = "Uni and the Hunt for the Lost Horn";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_ScoEE] = "Scions of Elemental Evil";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_HBTD] = "Hold Back The Dead";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_BQGT] = "Borderlands Quest: Goblin Trouble";
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_ALCoS] = `${Parser.AL_PREFIX}Curse of Strahd`;
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_ALEE] = `${Parser.AL_PREFIX}Elemental Evil`;
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_ALRoD] = `${Parser.AL_PREFIX}Rage of Demons`;
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_PSA] = `${Parser.PS_PREFIX}Amonkhet`;
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_PSI] = `${Parser.PS_PREFIX}Innistrad`;
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_PSK] = `${Parser.PS_PREFIX}Kaladesh`;
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_PSZ] = `${Parser.PS_PREFIX}Zendikar`;
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_PSX] = `${Parser.PS_PREFIX}Ixalan`;
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_PSD] = `${Parser.PS_PREFIX}Dominaria`;
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_XMtS] = `X Marks the Spot`;
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_UATMC] = `${Parser.UA_PREFIX}The Mystic Class`;
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_MCV1SC] = `${Parser.MCVX_PREFIX}1: Spelljammer Creatures`;
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_MCV2DC] = `${Parser.MCVX_PREFIX}2: Dragonlance Creatures`;
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_MCV3MC] = `${Parser.MCVX_PREFIX}3: Minecraft Creatures`;
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_MCV4EC] = `${Parser.MCVX_PREFIX}4: Eldraine Creatures`;
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_MisMV1] = `${Parser.MisMVX_PREFIX}1`;
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_AATM] = `${Parser.AA_PREFIX}The Mortuary`;

Parser.SOURCE_JSON_TO_ABV = {};
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_PHB] = "PHB'14";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_DMG] = "DMG'14";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_MM] = "MM'14";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_CoS] = "CoS";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_EEPC] = "EEPC";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_EET] = "EET";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_HotDQ] = "HotDQ";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_LMoP] = "LMoP";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_OotA] = "OotA";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_PotA] = "PotA";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_RoT] = "RoT";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_RoTOS] = "RoTOS";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_SCAG] = "SCAG";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_SKT] = "SKT";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_ToA] = "ToA";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_TLK] = "TLK";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_ToD] = "ToD";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_TTP] = "TTP";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_TYP] = "TftYP";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_TYP_AtG] = "TftYP";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_TYP_DiT] = "TftYP";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_TYP_TFoF] = "TftYP";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_TYP_THSoT] = "TftYP";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_TYP_TSC] = "TftYP";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_TYP_ToH] = "TftYP";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_TYP_WPM] = "TftYP";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_VGM] = "VGM";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_XGE] = "XGE";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_OGA] = "OGA";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_MTF] = "MTF";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_WDH] = "WDH";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_WDMM] = "WDMM";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_GGR] = "GGR";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_KKW] = "KKW";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_LLK] = "LLK";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_AZfyT] = "AZfyT";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_GoS] = "GoS";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_AI] = "AI";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_OoW] = "OoW";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_ESK] = "ESK";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_DIP] = "DIP";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_HftT] = "HftT";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_DC] = "DC";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_SLW] = "SLW";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_SDW] = "SDW";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_BGDIA] = "BGDIA";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_LR] = "LR";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_AL] = "AL";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_SAC] = "SAC";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_ERLW] = "ERLW";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_EFR] = "EFR";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_RMBRE] = "RMBRE";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_RMR] = "RMR";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_MFF] = "MFF";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_AWM] = "AWM";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_IMR] = "IMR";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_SADS] = "SADS";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_EGW] = "EGW";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_EGW_ToR] = "ToR";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_EGW_DD] = "DD";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_EGW_FS] = "FS";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_EGW_US] = "US";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_MOT] = "MOT";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_IDRotF] = "IDRotF";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_TCE] = "TCE";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_VRGR] = "VRGR";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_HoL] = "HoL";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_RtG] = "RtG";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_AitFR] = "AitFR";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_AitFR_ISF] = "AitFR-ISF";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_AitFR_THP] = "AitFR-THP";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_AitFR_AVT] = "AitFR-AVT";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_AitFR_DN] = "AitFR-DN";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_AitFR_FCD] = "AitFR-FCD";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_WBtW] = "WBtW";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_DoD] = "DoD";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_MaBJoV] = "MaBJoV";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_FTD] = "FTD";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_SCC] = "SCC";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_SCC_CK] = "SCC-CK";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_SCC_HfMT] = "SCC-HfMT";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_SCC_TMM] = "SCC-TMM";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_SCC_ARiR] = "SCC-ARiR";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_MPMM] = "MPMM";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_CRCotN] = "CRCotN";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_JttRC] = "JttRC";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_SAiS] = "SAiS";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_AAG] = "AAG";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_BAM] = "BAM";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_LoX] = "LoX";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_DoSI] = "DoSI";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_DSotDQ] = "DSotDQ";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_KftGV] = "KftGV";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_BGG] = "BGG";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_PaBTSO] = "PaBTSO";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_PAitM] = "PAitM";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_SatO] = "SatO";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_ToFW] = "ToFW";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_MPP] = "MPP";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_BMT] = "BMT";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_DMTCRG] = "DMTCRG";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_QftIS] = "QftIS";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_VEoR] = "VEoR";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_XPHB] = "PHB'24";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_XDMG] = "DMG'24";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_XMM] = "MM'25";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_DrDe] = "DrDe";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_DrDe_DaS] = "DrDe-DaS";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_DrDe_BD] = "DrDe-BD";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_DrDe_TWoO] = "DrDe-TWoO";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_DrDe_FWtVC] = "DrDe-FWtVC";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_DrDe_TDoN] = "DrDe-TDoN";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_DrDe_TFV] = "DrDe-TFV";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_DrDe_BtS] = "DrDe-BtS";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_DrDe_SD] = "DrDe-SD";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_DrDe_ACfaS] = "DrDe-ACfaS";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_DrDe_DotS] = "DrDe-DotSC";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_HotB] = "HotB";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_WttHC] = "WttHC";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_FRAiF] = "FRAiF";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_FRHoF] = "FRHoF";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_ABH] = "ABH";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_NF] = "NF";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_LFL] = "LFL";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_EFA] = "EFA";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_FFotR] = "FFotR";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_TD] = "TD";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_SCREEN] = "Scr'14";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_SCREEN_WILDERNESS_KIT] = "ScrWild";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_SCREEN_DUNGEON_KIT] = "ScrDun";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_SCREEN_SPELLJAMMER] = "ScrSJ";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_XSCREEN] = "Scr'24";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_HF] = "HF";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_HFFotM] = "HFFotM";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_HFStCM] = "HFStCM";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_PaF] = "PaF";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_HFDoMM] = "HFDoMM";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_CM] = "CM";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_NRH] = "NRH";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_NRH_TCMC] = "NRH-TCMC";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_NRH_AVitW] = "NRH-AVitW";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_NRH_ASS] = "NRH-ASS";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_NRH_CoI] = "NRH-CoI";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_NRH_TLT] = "NRH-TLT";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_NRH_AWoL] = "NRH-AWoL";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_NRH_AT] = "NRH-AT";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_MGELFT] = "MGELFT";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_VD] = "VD";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_SjA] = "SjA";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_HAT_TG] = "HAT-TG";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_HAT_LMI] = "HAT-LMI";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_GotSF] = "GotSF";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_LK] = "LK";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_CoA] = "CoA";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_PiP] = "PiP";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_DitLCoT] = "DitLCoT";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_VNotEE] = "VNotEE";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_LRDT] = "LRDT";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_UtHftLH] = "UHftLH";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_ScoEE] = "ScoEE";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_HBTD] = "HBTD";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_BQGT] = "BQGT";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_ALCoS] = "ALCoS";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_ALEE] = "ALEE";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_ALRoD] = "ALRoD";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_PSA] = "PSA";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_PSI] = "PSI";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_PSK] = "PSK";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_PSZ] = "PSZ";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_PSX] = "PSX";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_PSD] = "PSD";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_XMtS] = "XMtS";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_UATMC] = "UAMy";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_MCV1SC] = "MCV1SC";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_MCV2DC] = "MCV2DC";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_MCV3MC] = "MCV3MC";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_MCV4EC] = "MCV4EC";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_MisMV1] = "MisMV1";
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_AATM] = "AATM";

Parser.SOURCE_JSON_TO_DATE = {};
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_PHB] = "2014-08-19";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_DMG] = "2014-12-09";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_MM] = "2014-09-30";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_CoS] = "2016-03-15";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_EEPC] = "2015-03-10";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_EET] = "2015-03-10";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_HotDQ] = "2014-08-19";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_LMoP] = "2014-07-15";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_OotA] = "2015-09-15";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_PotA] = "2015-04-07";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_RoT] = "2014-11-04";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_RoTOS] = "2014-11-04";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_SCAG] = "2015-11-03";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_SKT] = "2016-09-06";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_ToA] = "2017-09-19";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_TLK] = "2017-11-28";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_ToD] = "2019-10-22";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_TTP] = "2017-09-19";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_TYP] = "2017-04-04";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_TYP_AtG] = "2017-04-04";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_TYP_DiT] = "2017-04-04";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_TYP_TFoF] = "2017-04-04";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_TYP_THSoT] = "2017-04-04";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_TYP_TSC] = "2017-04-04";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_TYP_ToH] = "2017-04-04";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_TYP_WPM] = "2017-04-04";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_VGM] = "2016-11-15";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_XGE] = "2017-11-21";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_OGA] = "2017-10-11";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_MTF] = "2018-05-29";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_WDH] = "2018-09-18";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_WDMM] = "2018-11-20";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_GGR] = "2018-11-20";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_KKW] = "2018-11-20";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_LLK] = "2018-11-10";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_AZfyT] = "2019-03-05";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_GoS] = "2019-05-21";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_AI] = "2019-06-18";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_OoW] = "2019-06-18";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_ESK] = "2019-06-24";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_DIP] = "2019-06-24";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_HftT] = "2019-05-01";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_DC] = "2019-06-24";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_SLW] = "2019-06-24";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_SDW] = "2019-06-24";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_BGDIA] = "2019-09-17";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_LR] = "2019-09-19";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_SAC] = "2019-01-31";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_ERLW] = "2019-11-19";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_EFR] = "2019-11-19";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_RMBRE] = "2019-11-19";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_RMR] = "2019-11-19";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_MFF] = "2019-11-12";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_AWM] = "2019-11-12";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_IMR] = "2019-11-12";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_SADS] = "2019-12-12";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_EGW] = "2020-03-17";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_EGW_ToR] = "2020-03-17";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_EGW_DD] = "2020-03-17";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_EGW_FS] = "2020-03-17";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_EGW_US] = "2020-03-17";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_MOT] = "2020-06-02";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_IDRotF] = "2020-09-15";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_TCE] = "2020-11-17";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_VRGR] = "2021-05-18";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_HoL] = "2021-05-18";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_RtG] = "2021-05-21";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_AitFR] = "2021-06-30";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_AitFR_ISF] = "2021-06-30";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_AitFR_THP] = "2021-07-07";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_AitFR_AVT] = "2021-07-14";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_AitFR_DN] = "2021-07-21";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_AitFR_FCD] = "2021-07-28";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_WBtW] = "2021-09-21";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_DoD] = "2021-09-21";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_MaBJoV] = "2021-10-05";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_FTD] = "2021-11-26";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_SCC] = "2021-12-07";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_SCC_CK] = "2021-12-07";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_SCC_HfMT] = "2021-12-07";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_SCC_TMM] = "2021-12-07";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_SCC_ARiR] = "2021-12-07";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_MPMM] = "2022-01-25";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_CRCotN] = "2022-03-15";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_JttRC] = "2022-07-19";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_SAiS] = "2022-08-16";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_AAG] = "2022-08-16";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_BAM] = "2022-08-16";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_LoX] = "2022-08-16";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_DoSI] = "2022-07-31";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_DSotDQ] = "2022-11-22";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_KftGV] = "2023-02-21";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_BGG] = "2023-08-15";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_PaBTSO] = "2023-09-19";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_PAitM] = "2023-10-17";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_SatO] = "2023-10-17";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_ToFW] = "2023-10-17";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_MPP] = "2023-10-17";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_BMT] = "2023-11-14";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_DMTCRG] = "2023-11-14";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_QftIS] = "2024-07-16";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_VEoR] = "2024-05-21";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_XPHB] = "2024-09-17";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_XDMG] = "2024-11-12";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_XMM] = "2025-02-18";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_DrDe] = "2025-07-08";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_DrDe_DaS] = Parser.SOURCE_JSON_TO_DATE[Parser.SRC_DrDe];
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_DrDe_BD] = Parser.SOURCE_JSON_TO_DATE[Parser.SRC_DrDe];
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_DrDe_TWoO] = Parser.SOURCE_JSON_TO_DATE[Parser.SRC_DrDe];
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_DrDe_FWtVC] = Parser.SOURCE_JSON_TO_DATE[Parser.SRC_DrDe];
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_DrDe_TDoN] = Parser.SOURCE_JSON_TO_DATE[Parser.SRC_DrDe];
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_DrDe_TFV] = Parser.SOURCE_JSON_TO_DATE[Parser.SRC_DrDe];
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_DrDe_BtS] = Parser.SOURCE_JSON_TO_DATE[Parser.SRC_DrDe];
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_DrDe_SD] = Parser.SOURCE_JSON_TO_DATE[Parser.SRC_DrDe];
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_DrDe_ACfaS] = Parser.SOURCE_JSON_TO_DATE[Parser.SRC_DrDe];
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_DrDe_DotS] = Parser.SOURCE_JSON_TO_DATE[Parser.SRC_DrDe];
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_HotB] = "2025-09-16";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_WttHC] = "2025-10-07";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_FRAiF] = "2025-11-11";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_FRHoF] = "2025-11-11";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_ABH] = "2025-11-11";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_NF] = "2025-11-11";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_LFL] = "2025-11-18";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_EFA] = "2025-12-09";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_FFotR] = "2025-12-09";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_TD] = "2022-05-24";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_SCREEN] = "2015-01-20";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_SCREEN_WILDERNESS_KIT] = "2020-11-17";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_SCREEN_DUNGEON_KIT] = "2020-09-21";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_SCREEN_SPELLJAMMER] = "2022-08-16";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_XSCREEN] = "2024-11-12";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_HF] = "2020-10-27";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_HFFotM] = "2023-11-07";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_HFStCM] = "2023-11-21";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_PaF] = "2024-08-27";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_HFDoMM] = "2024-10-01";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_CM] = "2021-03-16";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_NRH] = "2021-09-01";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_NRH_TCMC] = "2021-09-01";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_NRH_AVitW] = "2021-09-01";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_NRH_ASS] = "2021-09-01";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_NRH_CoI] = "2021-09-01";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_NRH_TLT] = "2021-09-01";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_NRH_AWoL] = "2021-09-01";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_NRH_AT] = "2021-09-01";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_MGELFT] = "2020-12-01";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_VD] = "2022-06-09";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_SjA] = "2022-07-11"; // pt1; pt2 2022-07-18; pt3 2022-07-25; pt4 2022-08-01
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_HAT_TG] = "2023-03-06";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_HAT_LMI] = "2023-03-31";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_GotSF] = "2023-08-01";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_LK] = "2023-09-26";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_CoA] = "2023-10-30";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_PiP] = "2023-11-20";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_DitLCoT] = "2024-03-26";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_VNotEE] = "2024-04-16";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_LRDT] = "2024-04-01";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_UtHftLH] = "2024-09-24";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_ScoEE] = "2024-10-24";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_HBTD] = "2025-02-07";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_BQGT] = "2025-06-04";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_ALCoS] = "2016-03-15";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_ALEE] = "2015-04-07";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_ALRoD] = "2015-09-15";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_PSA] = "2017-07-06";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_PSI] = "2016-07-12";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_PSK] = "2017-02-16";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_PSZ] = "2016-04-27";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_PSX] = "2018-01-09";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_PSD] = "2018-07-31";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_XMtS] = "2017-12-11";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_UATMC] = "2017-03-13";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_MCV1SC] = "2022-04-21";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_MCV2DC] = "2022-12-05";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_MCV3MC] = "2023-03-28";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_MCV4EC] = "2023-09-21";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_MisMV1] = "2023-05-03";
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_AATM] = "2023-10-17";

// region Source categories
Parser.SOURCES_ADVENTURES = new Set([
	Parser.SRC_LMoP,
	Parser.SRC_HotDQ,
	Parser.SRC_RoT,
	Parser.SRC_RoTOS,
	Parser.SRC_PotA,
	Parser.SRC_OotA,
	Parser.SRC_CoS,
	Parser.SRC_SKT,
	Parser.SRC_TYP,
	Parser.SRC_TYP_AtG,
	Parser.SRC_TYP_DiT,
	Parser.SRC_TYP_TFoF,
	Parser.SRC_TYP_THSoT,
	Parser.SRC_TYP_TSC,
	Parser.SRC_TYP_ToH,
	Parser.SRC_TYP_WPM,
	Parser.SRC_ToA,
	Parser.SRC_TLK,
	Parser.SRC_TTP,
	Parser.SRC_WDH,
	Parser.SRC_LLK,
	Parser.SRC_WDMM,
	Parser.SRC_KKW,
	Parser.SRC_AZfyT,
	Parser.SRC_GoS,
	Parser.SRC_HftT,
	Parser.SRC_OoW,
	Parser.SRC_DIP,
	Parser.SRC_SLW,
	Parser.SRC_SDW,
	Parser.SRC_DC,
	Parser.SRC_BGDIA,
	Parser.SRC_LR,
	Parser.SRC_EFR,
	Parser.SRC_RMBRE,
	Parser.SRC_IMR,
	Parser.SRC_EGW_ToR,
	Parser.SRC_EGW_DD,
	Parser.SRC_EGW_FS,
	Parser.SRC_EGW_US,
	Parser.SRC_IDRotF,
	Parser.SRC_CM,
	Parser.SRC_HoL,
	Parser.SRC_XMtS,
	Parser.SRC_RtG,
	Parser.SRC_AitFR,
	Parser.SRC_AitFR_ISF,
	Parser.SRC_AitFR_THP,
	Parser.SRC_AitFR_AVT,
	Parser.SRC_AitFR_DN,
	Parser.SRC_AitFR_FCD,
	Parser.SRC_WBtW,
	Parser.SRC_NRH,
	Parser.SRC_NRH_TCMC,
	Parser.SRC_NRH_AVitW,
	Parser.SRC_NRH_ASS,
	Parser.SRC_NRH_CoI,
	Parser.SRC_NRH_TLT,
	Parser.SRC_NRH_AWoL,
	Parser.SRC_NRH_AT,
	Parser.SRC_SCC,
	Parser.SRC_SCC_CK,
	Parser.SRC_SCC_HfMT,
	Parser.SRC_SCC_TMM,
	Parser.SRC_SCC_ARiR,
	Parser.SRC_CRCotN,
	Parser.SRC_JttRC,
	Parser.SRC_SjA,
	Parser.SRC_LoX,
	Parser.SRC_DoSI,
	Parser.SRC_DSotDQ,
	Parser.SRC_KftGV,
	Parser.SRC_GotSF,
	Parser.SRC_PaBTSO,
	Parser.SRC_LK,
	Parser.SRC_CoA,
	Parser.SRC_PiP,
	Parser.SRC_DitLCoT,
	Parser.SRC_VNotEE,
	Parser.SRC_LRDT,
	Parser.SRC_UtHftLH,
	Parser.SRC_ScoEE,
	Parser.SRC_HFStCM,
	Parser.SRC_HBTD,
	Parser.SRC_BQGT,
	Parser.SRC_DrDe,
	Parser.SRC_DrDe_DaS,
	Parser.SRC_DrDe_BD,
	Parser.SRC_DrDe_TWoO,
	Parser.SRC_DrDe_FWtVC,
	Parser.SRC_DrDe_TDoN,
	Parser.SRC_DrDe_TFV,
	Parser.SRC_DrDe_BtS,
	Parser.SRC_DrDe_SD,
	Parser.SRC_DrDe_ACfaS,
	Parser.SRC_DrDe_DotS,
	Parser.SRC_HotB,
	Parser.SRC_WttHC,
	Parser.SRC_FFotR,
	Parser.SRC_AWM,
]);
Parser.SOURCES_CORE_SUPPLEMENTS = new Set(Object.keys(Parser.SOURCE_JSON_TO_FULL).filter(it => !Parser.SOURCES_ADVENTURES.has(it)));
Parser.SOURCES_NON_STANDARD_WOTC = new Set([
	Parser.SRC_OGA,
	Parser.SRC_LLK,
	Parser.SRC_AZfyT,
	Parser.SRC_LR,
	Parser.SRC_TLK,
	Parser.SRC_TTP,
	Parser.SRC_AWM,
	Parser.SRC_IMR,
	Parser.SRC_SADS,
	Parser.SRC_MFF,
	Parser.SRC_XMtS,
	Parser.SRC_RtG,
	Parser.SRC_AitFR,
	Parser.SRC_AitFR_ISF,
	Parser.SRC_AitFR_THP,
	Parser.SRC_AitFR_AVT,
	Parser.SRC_AitFR_DN,
	Parser.SRC_AitFR_FCD,
	Parser.SRC_DoD,
	Parser.SRC_MaBJoV,
	Parser.SRC_NRH,
	Parser.SRC_NRH_TCMC,
	Parser.SRC_NRH_AVitW,
	Parser.SRC_NRH_ASS,
	Parser.SRC_NRH_CoI,
	Parser.SRC_NRH_TLT,
	Parser.SRC_NRH_AWoL,
	Parser.SRC_NRH_AT,
	Parser.SRC_MGELFT,
	Parser.SRC_VD,
	Parser.SRC_SjA,
	Parser.SRC_HAT_TG,
	Parser.SRC_HAT_LMI,
	Parser.SRC_GotSF,
	Parser.SRC_MCV3MC,
	Parser.SRC_MCV4EC,
	Parser.SRC_MisMV1,
	Parser.SRC_LK,
	Parser.SRC_AATM,
	Parser.SRC_CoA,
	Parser.SRC_PiP,
	Parser.SRC_HFStCM,
	Parser.SRC_UtHftLH,
	Parser.SRC_ScoEE,
	Parser.SRC_HBTD,
	Parser.SRC_BQGT,
]);
Parser.SOURCES_PARTNERED_WOTC = new Set([
	/*
	Previously marked as "Partnered" on D&D Beyond, but as of
	  ~Dec 2025 marked as "Official" on https://www.dndbeyond.com/en/library?publisher=official
	// Parser.SRC_RMBRE,
	// Parser.SRC_RMR,
	// Parser.SRC_EGW,
	// Parser.SRC_EGW_ToR,
	// Parser.SRC_EGW_DD,
	// Parser.SRC_EGW_FS,
	// Parser.SRC_EGW_US,
	// Parser.SRC_CRCotN,
	// Parser.SRC_HftT,
	 */

	/*
	If we have Minecraft, we might as well have LEGO too.
	// Parser.SRC_LRDT,
	 */

	/*
	Previously marked as "Partnered", but is "officially licensed"; going by above
	  official-izing of dubious sources, and as it doesn't contain any gameplay elements,
	  this can be considered "official enough."
	// Parser.SRC_TD,
	 */
]);
Parser.SOURCES_LEGACY_WOTC = new Set([
	Parser.SRC_PHB,
	Parser.SRC_DMG,
	Parser.SRC_MM,
	Parser.SRC_SCREEN,
	Parser.SRC_EEPC,
	Parser.SRC_VGM,
	Parser.SRC_MTF,
]);

// An opinionated set of source that could be considered "core-core"
Parser.SOURCES_VANILLA = new Set([
	// Parser.SRC_DMG, // "Legacy" source, removed in favor of XDMG
	// Parser.SRC_MM, // "Legacy" source, removed in favor of XMM
	// Parser.SRC_PHB, // "Legacy" source, removed in favor of XPHB
	Parser.SRC_XDMG,
	Parser.SRC_XMM,
	Parser.SRC_XPHB,
	Parser.SRC_SCAG,
	// Parser.SRC_TTP, // "Legacy" source, removed in favor of MPMM
	// Parser.SRC_VGM, // "Legacy" source, removed in favor of MPMM
	Parser.SRC_XGE,
	// Parser.SRC_MTF, // "Legacy" source, removed in favor of MPMM
	Parser.SRC_SAC,
	Parser.SRC_MFF,
	Parser.SRC_SADS,
	Parser.SRC_TCE,
	Parser.SRC_FTD,
	Parser.SRC_MPMM,
	// Parser.SRC_SCREEN, // "Legacy" source, removed in favor of XSCREEN
	Parser.SRC_XSCREEN,
	Parser.SRC_SCREEN_WILDERNESS_KIT,
	Parser.SRC_SCREEN_DUNGEON_KIT,
	Parser.SRC_VD,
	Parser.SRC_GotSF,
	Parser.SRC_BGG,
	Parser.SRC_MaBJoV,
	Parser.SRC_CoA,
	Parser.SRC_BMT,
	Parser.SRC_DMTCRG,
	Parser.SRC_FRAiF,
	Parser.SRC_FRHoF,
	Parser.SRC_ABH,
	Parser.SRC_NF,
]);

// Any opinionated set of sources that are """hilarious, dude"""
Parser.SOURCES_COMEDY = new Set([
	Parser.SRC_AI,
	Parser.SRC_OoW,
	Parser.SRC_RMR,
	Parser.SRC_RMBRE,
	Parser.SRC_HftT,
	Parser.SRC_AWM,
	Parser.SRC_MGELFT,
	Parser.SRC_HAT_TG,
	Parser.SRC_HAT_LMI,
	Parser.SRC_MCV3MC,
	Parser.SRC_MisMV1,
	Parser.SRC_LK,
	Parser.SRC_PiP,
	Parser.SRC_LRDT,
	Parser.SRC_UtHftLH,
	Parser.SRC_ScoEE,
	Parser.SRC_HBTD,
	Parser.SRC_BQGT,
	Parser.SRC_WttHC,
]);

// Any opinionated set of sources that are "other settings"
Parser.SOURCES_NON_FR = new Set([
	Parser.SRC_GGR,
	Parser.SRC_KKW,
	Parser.SRC_ERLW,
	Parser.SRC_EFR,
	Parser.SRC_EGW,
	Parser.SRC_EGW_ToR,
	Parser.SRC_EGW_DD,
	Parser.SRC_EGW_FS,
	Parser.SRC_EGW_US,
	Parser.SRC_MOT,
	Parser.SRC_XMtS,
	Parser.SRC_AZfyT,
	Parser.SRC_SCC,
	Parser.SRC_SCC_CK,
	Parser.SRC_SCC_HfMT,
	Parser.SRC_SCC_TMM,
	Parser.SRC_SCC_ARiR,
	Parser.SRC_CRCotN,
	Parser.SRC_SjA,
	Parser.SRC_SAiS,
	Parser.SRC_AAG,
	Parser.SRC_BAM,
	Parser.SRC_LoX,
	Parser.SRC_DSotDQ,
	Parser.SRC_PAitM,
	Parser.SRC_SatO,
	Parser.SRC_ToFW,
	Parser.SRC_MPP,
	Parser.SRC_MCV4EC,
	Parser.SRC_LK,
	Parser.SRC_LRDT,
	Parser.SRC_UtHftLH,
	Parser.SRC_ScoEE,
	Parser.SRC_HBTD,
	Parser.SRC_BQGT,
	Parser.SRC_WttHC,
	Parser.SRC_LFL,
	Parser.SRC_EFA,
	Parser.SRC_FFotR,
]);

// endregion
Parser.SOURCES_AVAILABLE_DOCS_BOOK = {};
[
	Parser.SRC_PHB,
	Parser.SRC_MM,
	Parser.SRC_DMG,
	Parser.SRC_SCAG,
	Parser.SRC_VGM,
	Parser.SRC_OGA,
	Parser.SRC_XGE,
	Parser.SRC_MTF,
	Parser.SRC_GGR,
	Parser.SRC_AI,
	Parser.SRC_ERLW,
	Parser.SRC_RMR,
	Parser.SRC_AWM,
	Parser.SRC_MGELFT,
	Parser.SRC_EGW,
	Parser.SRC_MOT,
	Parser.SRC_TCE,
	Parser.SRC_VRGR,
	Parser.SRC_DoD,
	Parser.SRC_MaBJoV,
	Parser.SRC_FTD,
	Parser.SRC_SCC,
	Parser.SRC_MPMM,
	Parser.SRC_AAG,
	Parser.SRC_BAM,
	Parser.SRC_HAT_TG,
	Parser.SRC_SCREEN,
	Parser.SRC_SCREEN_WILDERNESS_KIT,
	Parser.SRC_SCREEN_DUNGEON_KIT,
	Parser.SRC_SCREEN_SPELLJAMMER,
	Parser.SRC_BGG,
	Parser.SRC_SatO,
	Parser.SRC_MPP,
	Parser.SRC_HF,
	Parser.SRC_HFFotM,
	Parser.SRC_PaF,
	Parser.SRC_BMT,
	Parser.SRC_DMTCRG,
	Parser.SRC_XPHB,
	Parser.SRC_XMM,
	Parser.SRC_XDMG,
	Parser.SRC_XSCREEN,
	Parser.SRC_TD,
	Parser.SRC_FRHoF,
	Parser.SRC_FRAiF,
	Parser.SRC_ABH,
	Parser.SRC_NF,
	Parser.SRC_LFL,
	Parser.SRC_EFA,
].forEach(src => {
	Parser.SOURCES_AVAILABLE_DOCS_BOOK[src] = src;
	Parser.SOURCES_AVAILABLE_DOCS_BOOK[src.toLowerCase()] = src;
});
[
	{src: Parser.SRC_PSA, id: "PS-A"},
	{src: Parser.SRC_PSI, id: "PS-I"},
	{src: Parser.SRC_PSK, id: "PS-K"},
	{src: Parser.SRC_PSZ, id: "PS-Z"},
	{src: Parser.SRC_PSX, id: "PS-X"},
	{src: Parser.SRC_PSD, id: "PS-D"},
].forEach(({src, id}) => {
	Parser.SOURCES_AVAILABLE_DOCS_BOOK[src] = id;
	Parser.SOURCES_AVAILABLE_DOCS_BOOK[src.toLowerCase()] = id;
});
Parser.SOURCES_AVAILABLE_DOCS_ADVENTURE = {};
[
	Parser.SRC_LMoP,
	Parser.SRC_HotDQ,
	Parser.SRC_RoT,
	Parser.SRC_PotA,
	Parser.SRC_OotA,
	Parser.SRC_CoS,
	Parser.SRC_SKT,
	Parser.SRC_TYP_AtG,
	Parser.SRC_TYP_DiT,
	Parser.SRC_TYP_TFoF,
	Parser.SRC_TYP_THSoT,
	Parser.SRC_TYP_TSC,
	Parser.SRC_TYP_ToH,
	Parser.SRC_TYP_WPM,
	Parser.SRC_ToA,
	Parser.SRC_TLK,
	Parser.SRC_TTP,
	Parser.SRC_WDH,
	Parser.SRC_LLK,
	Parser.SRC_WDMM,
	Parser.SRC_KKW,
	Parser.SRC_AZfyT,
	Parser.SRC_GoS,
	Parser.SRC_HftT,
	Parser.SRC_OoW,
	Parser.SRC_DIP,
	Parser.SRC_SLW,
	Parser.SRC_SDW,
	Parser.SRC_DC,
	Parser.SRC_BGDIA,
	Parser.SRC_LR,
	Parser.SRC_EFR,
	Parser.SRC_RMBRE,
	Parser.SRC_IMR,
	Parser.SRC_EGW_ToR,
	Parser.SRC_EGW_DD,
	Parser.SRC_EGW_FS,
	Parser.SRC_EGW_US,
	Parser.SRC_IDRotF,
	Parser.SRC_CM,
	Parser.SRC_HoL,
	Parser.SRC_XMtS,
	Parser.SRC_RtG,
	Parser.SRC_AitFR_ISF,
	Parser.SRC_AitFR_THP,
	Parser.SRC_AitFR_AVT,
	Parser.SRC_AitFR_DN,
	Parser.SRC_AitFR_FCD,
	Parser.SRC_WBtW,
	Parser.SRC_NRH,
	Parser.SRC_NRH_TCMC,
	Parser.SRC_NRH_AVitW,
	Parser.SRC_NRH_ASS,
	Parser.SRC_NRH_CoI,
	Parser.SRC_NRH_TLT,
	Parser.SRC_NRH_AWoL,
	Parser.SRC_NRH_AT,
	Parser.SRC_SCC_CK,
	Parser.SRC_SCC_HfMT,
	Parser.SRC_SCC_TMM,
	Parser.SRC_SCC_ARiR,
	Parser.SRC_CRCotN,
	Parser.SRC_JttRC,
	Parser.SRC_LoX,
	Parser.SRC_DoSI,
	Parser.SRC_DSotDQ,
	Parser.SRC_KftGV,
	Parser.SRC_GotSF,
	Parser.SRC_PaBTSO,
	Parser.SRC_ToFW,
	Parser.SRC_LK,
	Parser.SRC_CoA,
	Parser.SRC_PiP,
	Parser.SRC_DitLCoT,
	Parser.SRC_HFStCM,
	Parser.SRC_QftIS,
	Parser.SRC_LRDT,
	Parser.SRC_VEoR,
	Parser.SRC_VNotEE,
	Parser.SRC_UtHftLH,
	Parser.SRC_ScoEE,
	Parser.SRC_HBTD,
	Parser.SRC_BQGT,
	Parser.SRC_DrDe_DaS,
	Parser.SRC_DrDe_BD,
	Parser.SRC_DrDe_TWoO,
	Parser.SRC_DrDe_FWtVC,
	Parser.SRC_DrDe_TDoN,
	Parser.SRC_DrDe_TFV,
	Parser.SRC_DrDe_BtS,
	Parser.SRC_DrDe_SD,
	Parser.SRC_DrDe_ACfaS,
	Parser.SRC_DrDe_DotS,
	Parser.SRC_HotB,
	Parser.SRC_WttHC,
	Parser.SRC_FFotR,
].forEach(src => {
	Parser.SOURCES_AVAILABLE_DOCS_ADVENTURE[src] = src;
	Parser.SOURCES_AVAILABLE_DOCS_ADVENTURE[src.toLowerCase()] = src;
});

Parser.getTagSource = function (tag, source) {
	if (source && source.trim()) return source;

	tag = tag.trim();

	const tagMeta = Renderer.tag.TAG_LOOKUP[tag];

	if (!tagMeta) throw new Error(`Unhandled tag "${tag}"`);
	return tagMeta.defaultSource;
};

Parser.PROP_TO_TAG = {
	"monster": "creature",
	"optionalfeature": "optfeature",
	"tableGroup": "table",
	"vehicleUpgrade": "vehupgrade",
	"baseitem": "item",
	"itemGroup": "item",
	"magicvariant": "item",
};
Parser._RE_PROP_RAW_PREFIX = /^raw_/;
Parser.getPropTag = function (prop) {
	prop = prop.replace(Parser._RE_PROP_RAW_PREFIX, "");
	if (Parser.PROP_TO_TAG[prop]) return Parser.PROP_TO_TAG[prop];
	if (prop?.endsWith("Fluff")) return null;
	return prop;
};

// Note that ordering is important; we expect the "primary" prop to be first
Parser.TAG_TO_PROPS = {
	"creature": ["monster"],
	"optfeature": ["optionalfeature"],
	"table": ["table", "tableGroup"],
	"vehupgrade": ["vehicleUpgrade"],
	"item": ["item", "baseitem", "itemGroup", "magicvariant"],
};
Parser.getTagProps = function (tag) {
	if (Parser.TAG_TO_PROPS[tag]) return Parser.TAG_TO_PROPS[tag];
	return [tag];
};

Parser.PROP_TO_DISPLAY_NAME = {
	"variantrule": "Rule",
	"optionalfeature": "Option/Feature",
	"magicvariant": "Magic Item Variant",
	"baseitem": "Item (Base)",
	"item": "Item",
	"adventure": "Adventure",
	"adventureData": "Adventure Text",
	"book": "Book",
	"bookData": "Book Text",
	"makebrewCreatureTrait": "Homebrew Builder Creature Trait",
	"charoption": "Other Character Creation Option",

	"bonus": "Bonus Action",
	"legendary": "Legendary Action",
	"mythic": "Mythic Action",
	"lairActions": "Lair Action",
	"regionalEffects": "Regional Effect",
};
Parser.getPropDisplayName = function (prop, {suffix = ""} = {}) {
	if (Parser.PROP_TO_DISPLAY_NAME[prop]) return `${Parser.PROP_TO_DISPLAY_NAME[prop]}${suffix}`;

	const mFluff = /Fluff$/.exec(prop);
	if (mFluff) return Parser.getPropDisplayName(prop.slice(0, -mFluff[0].length), {suffix: " Fluff"});

	const mFoundry = /^foundry(?<prop>[A-Z].*)$/.exec(prop);
	if (mFoundry) return Parser.getPropDisplayName(mFoundry.groups.prop.lowercaseFirst(), {suffix: " Foundry Data"});

	return `${prop.split(/([A-Z][a-z]+)/g).filter(Boolean).join(" ").uppercaseFirst()}${suffix}`;
};

Parser.DMGTYPE_JSON_TO_FULL = {
	"A": "acid",
	"B": "bludgeoning",
	"C": "cold",
	"F": "fire",
	"O": "force",
	"L": "lightning",
	"N": "necrotic",
	"P": "piercing",
	"I": "poison",
	"Y": "psychic",
	"R": "radiant",
	"S": "slashing",
	"T": "thunder",
};

Parser.DMG_TYPES = ["acid", "bludgeoning", "cold", "fire", "force", "lightning", "necrotic", "piercing", "poison", "psychic", "radiant", "slashing", "thunder"];
Parser.CONDITIONS = ["blinded", "charmed", "deafened", "exhaustion", "frightened", "grappled", "incapacitated", "invisible", "paralyzed", "petrified", "poisoned", "prone", "restrained", "stunned", "unconscious"];

Parser._SENSES_LEGACY = [
	{"name": "blindsight", "source": Parser.SRC_PHB},
	{"name": "darkvision", "source": Parser.SRC_PHB},
	{"name": "tremorsense", "source": Parser.SRC_MM},
	{"name": "truesight", "source": Parser.SRC_PHB},
];
Parser._SENSES_MODERN = [
	{"name": "blindsight", "source": Parser.SRC_XPHB},
	{"name": "darkvision", "source": Parser.SRC_XPHB},
	{"name": "tremorsense", "source": Parser.SRC_XPHB},
	{"name": "truesight", "source": Parser.SRC_XPHB},
];
Parser.getSenses = function ({styleHint = null} = {}) {
	styleHint ||= VetoolsConfig.get("styleSwitcher", "style");
	return styleHint === "classic" ? Parser._SENSES_LEGACY : Parser._SENSES_MODERN;
};

Parser.NUMBERS_ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
Parser.NUMBERS_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
Parser.NUMBERS_TEENS = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];

// region Metric conversion
Parser.metric = {
	// See MPMB's breakdown: https://old.reddit.com/r/dndnext/comments/6gkuec
	MILES_TO_KILOMETRES: 1.6,
	FEET_TO_METRES: 0.3, // 5 ft = 1.5 m
	YARDS_TO_METRES: 0.9, // (as above)
	POUNDS_TO_KILOGRAMS: 0.5, // 2 lb = 1 kg
	// Other additions
	INCHES_TO_CENTIMETERS: 2.5, // 1 in = 2.5 cm
	CUBIC_FEET_TO_LITRES: 28, // 1 ft³ = 28 L

	/**
	 * @param {number} originalValue
	 * @param {string} originalUnit
	 * @param {?boolean} toFixed
	 */
	getMetricNumber ({originalValue, originalUnit, toFixed = null}) {
		if (originalValue == null || isNaN(originalValue)) return originalValue;

		originalValue = Number(originalValue);
		if (!originalValue) return originalValue;

		let out = null;
		switch (Parser.getNormalizedUnit(originalUnit)) {
			case Parser.UNT_INCHES: out = originalValue * Parser.metric.INCHES_TO_CENTIMETERS; break;
			case Parser.UNT_FEET: out = originalValue * Parser.metric.FEET_TO_METRES; break;
			case Parser.UNT_YARDS: out = originalValue * Parser.metric.YARDS_TO_METRES; break;
			case Parser.UNT_MILES: out = originalValue * Parser.metric.MILES_TO_KILOMETRES; break;
			case Parser.UNT_LBS: out = originalValue * Parser.metric.POUNDS_TO_KILOGRAMS; break;
			case Parser.UNT_CUBIC_FEET: out = originalValue * Parser.metric.CUBIC_FEET_TO_LITRES; break;
			default: return originalValue;
		}
		if (toFixed != null) return NumberUtil.toFixedNumber(out, toFixed);
		return out;
	},

	/**
	 * @param {number} originalValue
	 * @param {boolean} isShortForm
	 * @param {isPlural} isShortForm
	 */
	getMetricUnit ({originalUnit, isShortForm = false, isPlural = true}) {
		switch (Parser.getNormalizedUnit(originalUnit)) {
			case Parser.UNT_INCHES: return isShortForm ? "cm" : `centimeter`[isPlural ? "toPlural" : "toString"]();
			case Parser.UNT_FEET: return isShortForm ? "m" : `meter`[isPlural ? "toPlural" : "toString"]();
			case Parser.UNT_YARDS: return isShortForm ? "m" : `meter`[isPlural ? "toPlural" : "toString"]();
			case Parser.UNT_MILES: return isShortForm ? "km" : `kilometer`[isPlural ? "toPlural" : "toString"]();
			case Parser.UNT_LBS: return isShortForm ? "kg" : `kilogram`[isPlural ? "toPlural" : "toString"]();
			case Parser.UNT_CUBIC_FEET: return isShortForm ? "L" : `liter`[isPlural ? "toPlural" : "toString"]();
			default: return originalUnit;
		}
	},
};
// endregion
// region Map grids

Parser.MAP_GRID_TYPE_TO_FULL = {};
Parser.MAP_GRID_TYPE_TO_FULL["none"] = "None";
Parser.MAP_GRID_TYPE_TO_FULL["square"] = "Square";
Parser.MAP_GRID_TYPE_TO_FULL["hexRowsOdd"] = "Hex Rows (Odd)";
Parser.MAP_GRID_TYPE_TO_FULL["hexRowsEven"] = "Hex Rows (Even)";
Parser.MAP_GRID_TYPE_TO_FULL["hexColsOdd"] = "Hex Columns (Odd)";
Parser.MAP_GRID_TYPE_TO_FULL["hexColsEven"] = "Hex Columns (Even)";

Parser.mapGridTypeToFull = function (gridType) {
	return Parser._parse_aToB(Parser.MAP_GRID_TYPE_TO_FULL, gridType);
};
// endregion
