import {ConverterBase} from "./converter-base.js";
import {ConverterUtils} from "./converterutils-utils.js";
import {TagCondition} from "./converterutils-tags.js";
import {AbilityCheckTagger, DamageImmuneTagger, DamageInflictTagger, DamageResTagger, DamageVulnTagger, MiscTagsTagger, SavingThrowTagger, ScalingLevelDiceTagger, SpellAttackTagger} from "./converterutils-spell.js";
import {ConverterConst} from "./converterutils-const.js";
import {TagJsons} from "./converterutils-entries.js";
import {SITE_STYLE__CLASSIC} from "../consts.js";
import {EntryCoalesceEntryLists, EntryCoalesceRawLines} from "./converterutils-entrycoalesce.js";
import {PropOrder} from "../utils-proporder.js";

export class ConverterSpell extends ConverterBase {
	static _RE_START_RANGE = "Range";
	static _RE_START_COMPONENTS = "Components?";
	static _RE_START_DURATION = "Duration";
	static _RE_START_CLASS = "Class(?:es)?";

	static _REQUIRED_PROPS = [
		"level",
		"school",
		"time",
		"range",
		"duration",
		"entries",
	];

	/**
	 * Parses spells from raw text pastes
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
	static doParseText (inText, options) {
		options = this._getValidOptions(options);

		if (!inText || !inText.trim()) return options.cbWarning("No input!");
		const toConvert = this._getCleanInput(inText, options)
			.split("\n")
			.filter(it => it && it.trim());
		const spell = {};
		spell.source = options.source;
		// for the user to fill out
		spell.page = options.page;

		let prevLine = null;
		let curLine = null;
		let i;
		for (i = 0; i < toConvert.length; i++) {
			prevLine = curLine;
			curLine = toConvert[i].trim();

			if (curLine === "") continue;

			// name of spell
			if (i === 0) {
				spell.name = this._getAsTitle("name", curLine, options.titleCaseFields, options.isTitleCase);
				continue;
			}

			// spell level, and school plus ritual
			if (i === 1) {
				this._setCleanLevelSchoolRitual(spell, curLine, options);
				continue;
			}

			// casting time
			if (i === 2) {
				this._setCleanCastingTime(spell, curLine, options);
				continue;
			}

			// range
			if (ConverterUtils.isStatblockLineHeaderStart({reStartStr: this._RE_START_RANGE, line: curLine})) {
				this._setCleanRange(spell, curLine, options);
				continue;
			}

			// components
			if (
				ConverterUtils.isStatblockLineHeaderStart({reStartStr: this._RE_START_COMPONENTS, line: curLine})
			) {
				this._setCleanComponents(spell, curLine, options);
				continue;
			}

			// duration
			if (ConverterUtils.isStatblockLineHeaderStart({reStartStr: this._RE_START_DURATION, line: curLine})) {
				// avoid absorbing main body text
				this._setCleanDuration(spell, curLine, options);
				continue;
			}

			// class spell lists (alt)
			if (ConverterUtils.isStatblockLineHeaderStart({reStartStr: this._RE_START_CLASS, line: curLine})) {
				// avoid absorbing main body text
				this._setCleanClasses(spell, curLine, options);
				continue;
			}

			const ptrI = {_: i};
			spell.entries = EntryCoalesceRawLines.mutGetCoalesced(
				ptrI,
				toConvert,
				{
					fnStop: (curLine) => /^(?:At Higher Levels|Class(?:es)?|Cantrip Upgrade|Using a Higher-Level Spell Slot)/gi.test(curLine),
				},
			);
			i = ptrI._;

			spell.entriesHigherLevel = EntryCoalesceRawLines.mutGetCoalesced(
				ptrI,
				toConvert,
				{
					fnStop: (curLine) => /^Classes/gi.test(curLine),
				},
			);
			i = ptrI._;

			// class spell lists
			if (i < toConvert.length) {
				curLine = toConvert[i].trim();
				if (ConverterUtils.isStatblockLineHeaderStart({reStartStr: this._RE_START_CLASS, line: curLine})) {
					this._setCleanClasses(spell, curLine, options);
				}
			}
		}

		if (!spell.entriesHigherLevel || !spell.entriesHigherLevel.length) delete spell.entriesHigherLevel;

		this._doSpellPostProcess(spell, options);
		const statsOut = PropOrder.getOrdered(spell, "spell");

		const missingProps = this._REQUIRED_PROPS.filter(prop => statsOut[prop] == null);
		if (missingProps.length) options.cbWarning(`${statsOut.name ? `(${statsOut.name}) ` : ""}Missing properties: ${missingProps.join(", ")}`);

		options.cbOutput(statsOut, options.isAppend);

		return statsOut;
	}

	static _getCleanInput (ipt, options = null) {
		let txt = super._getCleanInput(ipt, options);

		const titles = [
			"Casting Time",
			"Range",
			"Components?",
			"Duration",
		];

		for (let i = 0; i < titles.length - 1; ++i) {
			const start = titles[i];
			const end = titles[i + 1];
			const re = new RegExp(`(?<line>\\n${start}.*?)(?<suffix>\\n${end})`, "is");

			txt = txt.replace(re, (...m) => {
				return `\n${m.last().line.replace(/\n/g, " ").trim().replace(/ +/g, " ")}${m.last().suffix}`;
			});
		}

		return txt;
	}

	// SHARED UTILITY FUNCTIONS ////////////////////////////////////////////////////////////////////////////////////////
	static _tryConvertSchool (s, {cbMan = null} = {}) {
		const school = (s.school || "").toLowerCase().trim();
		if (!school) return cbMan ? cbMan(`Spell school "${s.school}" requires manual conversion`) : null;

		const out = ConverterSpell._RES_SCHOOL.find(it => it.regex.test(school));
		if (out) {
			s.school = out.output;
			return;
		}
		if (cbMan) cbMan(`Spell school "${s.school}" requires manual conversion`);
	}

	static _doSpellPostProcess (stats, options) {
		const doCleanup = () => {
			// remove any empty arrays
			Object.keys(stats).forEach(k => {
				if (stats[k] instanceof Array && stats[k].length === 0) {
					delete stats[k];
				}
			});
		};

		TagCondition.tryTagConditions(stats, {isTagInflicted: true, styleHint: options.styleHint});

		[
			"entries",
			"entriesHigherLevel",
		]
			.forEach(prop => {
				EntryCoalesceEntryLists.mutCoalesce(stats, prop, {styleHint: options.styleHint});
				TagJsons.mutTagObject(stats, {keySet: new Set([prop]), isOptimistic: false, styleHint: options.styleHint});
			});

		this._addTags(stats, options);
		doCleanup();
	}

	static _addTags (stats, options) {
		DamageInflictTagger.tryRun(stats, options);
		DamageResTagger.tryRun(stats, options);
		DamageVulnTagger.tryRun(stats, options);
		DamageImmuneTagger.tryRun(stats, options);
		SavingThrowTagger.tryRun(stats, options);
		AbilityCheckTagger.tryRun(stats, options);
		SpellAttackTagger.tryRun(stats, options);
		// TODO areaTags
		MiscTagsTagger.tryRun(stats, options);
		ScalingLevelDiceTagger.tryRun(stats, options);
	}

	// SHARED PARSING FUNCTIONS ////////////////////////////////////////////////////////////////////////////////////////
	static _setCleanLevelSchoolRitual (stats, line, options) {
		const rawLine = line;
		line = ConverterUtils.cleanDashes(line).trim();

		const mCantrip = /cantrip/i.exec(line);
		const mSpellLeve = /^(?<level>\d+)(?:st|nd|rd|th)?[- ]level/i.exec(line)
			|| /^Level (?<level>\d+)\b/i.exec(line);

		if (mCantrip) {
			let trailing = line.slice(mCantrip.index + "cantrip".length, line.length).trim();
			line = line.slice(0, mCantrip.index).trim();

			trailing = this._setCleanLevelSchoolRitual_trailingClassGroup({stats, options, trailing});

			// TODO implement as required (see at e.g. Deep Magic series)
			if (trailing) {
				options.cbWarning(`${stats.name ? `(${stats.name}) ` : ""}Level/school/ritual trailing part "${trailing}" requires manual conversion`);
			}

			stats.level = 0;
			stats.school = line;

			this._tryConvertSchool(stats, {cbMan: options.cbWarning});
			return;
		}

		if (mSpellLeve) {
			line = line.slice(mSpellLeve.index + mSpellLeve[0].length);

			let isRitual = false;
			line = line.replace(/\((.*?)(?:[,;]\s*)?ritual(?:[,;]\s*)?(.*?)\)/i, (...m) => {
				isRitual = true;
				// preserve any extra info inside the brackets
				return m[1] || m[2] ? `(${m[1]}${m[2]})` : "";
			}).trim();

			if (isRitual) {
				MiscUtil.set(stats, "meta", "ritual", true);
			}

			stats.level = Number(mSpellLeve.groups.level);

			const [tkSchool, ...tksSchoolRest] = line.trim().split(" ");
			stats.school = tkSchool;

			if (/^(?:school|spell)$/i.test(tksSchoolRest[0] || 0)) tksSchoolRest.shift();

			let trailing = tksSchoolRest.join(" ");
			trailing = this._setCleanLevelSchoolRitual_trailingClassGroup({stats, options, trailing});

			// TODO further handling of non-school text (see e.g. Deep Magic series)
			if (trailing) {
				options.cbWarning(`${stats.name ? `(${stats.name}) ` : ""}Level/school/ritual trailing part "${trailing}" requires manual conversion`);
			}

			this._tryConvertSchool(stats, {cbMan: options.cbWarning});
			return;
		}

		options.cbWarning(`${stats.name ? `(${stats.name}) ` : ""}Level/school/ritual part "${rawLine}" requires manual conversion`);
	}

	static _setCleanLevelSchoolRitual_trailingClassGroup ({stats, options, trailing}) {
		if (!trailing) return trailing;

		const classNames = [];

		const out = trailing
			.split(/([()])/g)
			.map(tk => {
				return tk
					.split(StrUtil.COMMAS_NOT_IN_PARENTHESES_REGEX)
					.map(tk => {
						return tk
							.replace(new RegExp(ConverterConst.STR_RE_CLASS, "i"), (...m) => {
								classNames.push(m.last().name);
								return "";
							})
							.replace(/\s+/g, " ")
						;
					})
					.filter(it => it.trim())
					.join(",");
			})
			.join("")
			.replace(/\(\s*\)/g, "")
			.trim();

		if (!classNames.length) return out;

		switch (options.styleHint) {
			case SITE_STYLE__CLASSIC: {
				(stats.groups ||= [])
					.push(
						...classNames.map(name => ({
							name,
							source: stats.source,
						})),
					);
				break;
			}

			case "one": {
				const tgt = MiscUtil.getOrSet(stats, "classes", "fromClassList", []);
				tgt.push(
					...classNames.map(name => ({
						name,
						source: Parser.SRC_XPHB,
					})),
				);
				break;
			}

			default: throw new Error(`Unhandled style "${options.styleHint}"!`);
		}

		return out;
	}

	static _setCleanRange (stats, line, options) {
		const getUnit = (str) => /\b(miles?|mi\.)\b/.test(str.toLowerCase()) ? "miles" : "feet";

		const range = ConverterUtils.cleanDashes(ConverterUtils.getStatblockLineHeaderText({reStartStr: this._RE_START_RANGE, line}));

		if (range.toLowerCase() === "self") return stats.range = {type: "point", distance: {type: "self"}};
		if (range.toLowerCase() === "special") return stats.range = {type: "special"};
		if (range.toLowerCase() === "unlimited") return stats.range = {type: "point", distance: {type: "unlimited"}};
		if (range.toLowerCase() === "unlimited on the same plane") return stats.range = {type: "point", distance: {type: "plane"}};
		if (range.toLowerCase() === "sight") return stats.range = {type: "point", distance: {type: "sight"}};
		if (range.toLowerCase() === "touch") return stats.range = {type: "point", distance: {type: "touch"}};

		const cleanRange = range.replace(/(\d),(\d)/g, "$1$2");

		const mFeetMiles = /^(?<amount>\d+) (?<unit>feet|foot|ft\.?|miles?|mi\.?)$/i.exec(cleanRange);
		if (mFeetMiles) return stats.range = {type: "point", distance: {type: getUnit(mFeetMiles.groups.unit), amount: Number(mFeetMiles.groups.amount)}};

		const mSelfEmanation = /^self \((\d+)[- ](foot|ft\.?|miles?|mi\.?) emanation\)$/i.exec(cleanRange);
		if (mSelfEmanation) return stats.range = {type: "emanation", distance: {type: getUnit(mSelfEmanation[2]), amount: Number(mSelfEmanation[1])}};

		const mSelfRadius = /^self \((\d+)[- ](foot|ft\.?|miles?|mi\.?) radius\)$/i.exec(cleanRange);
		if (mSelfRadius) return stats.range = {type: "radius", distance: {type: getUnit(mSelfRadius[2]), amount: Number(mSelfRadius[1])}};

		const mSelfSphere = /^self \((\d+)[- ](foot|ft\.?|miles?|mi\.?)(?:[- ]radius)? sphere\)$/i.exec(cleanRange);
		if (mSelfSphere) return stats.range = {type: "sphere", distance: {type: getUnit(mSelfSphere[2]), amount: Number(mSelfSphere[1])}};

		const mSelfCone = /^self \((\d+)[- ](foot|ft\.?|miles?|mi\.?) cone\)$/i.exec(cleanRange);
		if (mSelfCone) return stats.range = {type: "cone", distance: {type: getUnit(mSelfCone[2]), amount: Number(mSelfCone[1])}};

		const mSelfLine = /^self \((\d+)[- ](foot|ft\.?|miles?|mi\.?) line\)$/i.exec(cleanRange);
		if (mSelfLine) return stats.range = {type: "line", distance: {type: getUnit(mSelfLine[2]), amount: Number(mSelfLine[1])}};

		const mSelfCube = /^self \((\d+)[- ](foot|ft\.?|miles?|mi\.?) cube\)$/i.exec(cleanRange);
		if (mSelfCube) return stats.range = {type: "cube", distance: {type: getUnit(mSelfCube[2]), amount: Number(mSelfCube[1])}};

		const mSelfHemisphere = /^self \((\d+)[- ](foot|ft\.?|miles?|mi\.?)(?:[- ]radius)? hemisphere\)$/i.exec(cleanRange);
		if (mSelfHemisphere) return stats.range = {type: "hemisphere", distance: {type: getUnit(mSelfHemisphere[2]), amount: Number(mSelfHemisphere[1])}};

		// region Homebrew
		const mPointCube = /^(?<point>\d+) (?<unit>feet|foot|ft\.?|miles?|mi\.?) \((\d+)[- ](foot|ft\.?|miles?|mi\.?) cube\)$/i.exec(cleanRange);
		if (mPointCube) return stats.range = {type: "point", distance: {type: getUnit(mPointCube.groups.unit), amount: Number(mPointCube.groups.point)}};
		// endregion

		options.cbWarning(`${stats.name ? `(${stats.name}) ` : ""}Range part "${range}" requires manual conversion`);
	}

	static _getCleanTimeUnit (unit, isDuration, options) {
		unit = unit.toLowerCase().trim();
		switch (unit) {
			case "days":
			case "weeks":
			case "months":
			case "years":
			case "hours":
			case "minutes":
			case "actions":
			case "rounds": return unit.slice(0, -1);

			case "day":
			case "week":
			case "month":
			case "year":
			case "hour":
			case "minute":
			case "action":
			case "round":
			case "reaction": return unit;

			case "bonus action": return "bonus";

			default:
				options.cbWarning(`Unit part "${unit}" requires manual conversion`);
				return unit;
		}
	}

	static _setCleanCastingTime (stats, line, options) {
		const allParts = ConverterUtils.getStatblockLineHeaderText({reStartStr: "Casting Time", line});
		const parts = /\b(?:reaction|which you (?:take|use))\b/i.test(allParts)
			? [allParts]
			: allParts.split(/; | or /gi);

		stats.time = parts
			.map(it => it.trim())
			.filter(Boolean)
			.map(str => {
				if (str.toLowerCase() === "ritual") {
					MiscUtil.set(stats, "meta", "ritual", true);
					return null;
				}

				const mNumber = /^(?<count>\d+)?(?<rest>.*?)$/.exec(str);

				if (!mNumber) {
					options.cbWarning(`${stats.name ? `(${stats.name}) ` : ""}Casting time part "${str}" requires manual conversion`);
					return str;
				}

				const amount = mNumber.groups.count ? Number(mNumber.groups.count.trim()) : null;
				const [unit, ...conditionParts] = mNumber.groups.rest.split(", ");

				const mNote = /^(?<unit>.*) \((?<note>.*)\)$/.exec(unit);

				const out = {
					number: amount ?? 1,
					unit: this._getCleanTimeUnit(mNote ? mNote.groups.unit : unit, false, options),
					condition: conditionParts.join(", "),
					note: mNote ? mNote.groups.note : null,
				};
				if (!out.condition) delete out.condition;
				if (!out.note) delete out.note;
				return out;
			})
			.filter(Boolean);
	}

	static _getComponentCurrencyMult ({mCost}) {
		const {currency, currencyLong} = mCost.groups;

		if (currency) return Parser.COIN_CONVERSIONS[Parser.COIN_ABVS.indexOf(currency.toLowerCase())];

		switch (currencyLong.toLowerCase()) {
			case "gold": {
				return Parser.COIN_CONVERSIONS[Parser.COIN_ABVS.indexOf("gp")];
			}
			default: throw new Error("Unimplemented!");
		}
	}

	static _setCleanComponents (stats, line, options) {
		const components = ConverterUtils.getStatblockLineHeaderText({reStartStr: this._RE_START_COMPONENTS, line});
		const parts = components.split(StrUtil.COMMAS_NOT_IN_PARENTHESES_REGEX);

		stats.components = {};

		parts
			.map(it => it.trim())
			.filter(Boolean)
			.forEach(pt => {
				const lowerPt = pt.toLowerCase();
				switch (lowerPt) {
					case "v": stats.components.v = true; break;
					case "s": stats.components.s = true; break;
					default: {
						if (lowerPt.startsWith("m ")) {
							const materialText = pt.replace(/^m\s*\((.*)\)$/i, "$1").trim();
							const mCost = /(?<count>\d*,?\d+)\+?\s?(?:(?<currency>cp|sp|ep|gp|pp)|(?:(?<currencyLong>gold)(?: pieces)?))/gi.exec(materialText);
							const isConsumed = pt.toLowerCase().includes("consume");

							if (mCost) {
								const valueMult = this._getComponentCurrencyMult({mCost});
								const valueNum = Number(mCost.groups.count.replace(/,/g, ""));

								stats.components.m = {
									text: materialText,
									cost: valueNum * valueMult,
								};
								if (isConsumed) stats.components.m.consume = true;
							} else if (isConsumed) {
								stats.components.m = {
									text: materialText,
									consume: true,
								};
							} else {
								stats.components.m = materialText;
							}
						} else if (lowerPt.startsWith("r ")) stats.components.r = true;
						else options.cbWarning(`${stats.name ? `(${stats.name}) ` : ""}Components part "${pt}" requires manual conversion`);
					}
				}
			});
	}

	static _setCleanDuration (stats, line, options) {
		const {durStr, condition} = this._setCleanDuration_getInput({line, options});

		if (durStr.toLowerCase() === "instantaneous") return stats.duration = this._setCleanDurationn_getOutput({duration: [{type: "instant"}], condition});
		if (durStr.toLowerCase() === "special") return stats.duration = this._setCleanDurationn_getOutput({duration: [{type: "special"}], condition});
		if (durStr.toLowerCase() === "permanent") return stats.duration = this._setCleanDurationn_getOutput({duration: [{type: "permanent"}], condition});

		if (durStr.toLowerCase() === "concentration") return stats.duration = this._setCleanDurationn_getOutput({duration: [{type: "special", concentration: true}], condition});

		const mConcOrUpTo = /^(?<conc>concentration, )?up to (?<amount>\d+|an?) (?<unit>hour|minute|turn|round|week|month|day|year)(?:s)?$/i.exec(durStr);
		if (mConcOrUpTo) {
			const amount = mConcOrUpTo.groups.amount.toLowerCase().startsWith("a") ? 1 : Number(mConcOrUpTo.groups.amount);
			const out = {type: "timed", duration: {type: this._getCleanTimeUnit(mConcOrUpTo.groups.unit, true, options), amount}};
			if (mConcOrUpTo.groups.conc) out.concentration = true;
			else out.duration.upTo = true;
			return stats.duration = this._setCleanDurationn_getOutput({duration: [out], condition});
		}

		const mTimed = /^(\d+) (hour|minute|turn|round|week|month|day|year)(?:s)?$/i.exec(durStr);

		if (mTimed) return stats.duration = this._setCleanDurationn_getOutput({duration: [{type: "timed", duration: {type: this._getCleanTimeUnit(mTimed[2], true, options), amount: Number(mTimed[1])}}], condition});

		const mDispelledTriggered = /^until dispelled( or triggered)?$/i.exec(durStr);
		if (mDispelledTriggered) {
			const out = {type: "permanent", ends: ["dispel"]};
			if (mDispelledTriggered[1]) out.ends.push("trigger");
			return stats.duration = this._setCleanDurationn_getOutput({duration: [out], condition});
		}

		const mPermDischarged = /^permanent until discharged$/i.exec(durStr);
		if (mPermDischarged) {
			const out = {type: "permanent", ends: ["discharge"]};
			return stats.duration = this._setCleanDurationn_getOutput({duration: [out], condition});
		}

		// TODO handle splitting "or"'d durations up as required

		options.cbWarning(`${stats.name ? `(${stats.name}) ` : ""}Duration part "${durStr}" requires manual conversion`);
	}

	static _setCleanDuration_getInput ({line, options}) {
		const durRaw = ConverterUtils.getStatblockLineHeaderText({reStartStr: this._RE_START_DURATION, line});

		let condition;
		const durStr = durRaw
			.replace(/\s+\((?<condition>see [^)]+)\)\s*$/, (...m) => {
				condition = m.last().condition;
				return "";
			})
			.trim();

		return {durStr, condition};
	}

	static _setCleanDurationn_getOutput ({duration, condition}) {
		if (condition) duration.forEach(dur => dur.condition = condition);
		return duration;
	}

	static _setCleanClasses (stats, line, options) {
		const classLine = ConverterUtils.getStatblockLineHeaderText({reStartStr: this._RE_START_CLASS, line});
		const classes = classLine.split(StrUtil.COMMAS_NOT_IN_PARENTHESES_REGEX);

		const tgt = MiscUtil.getOrSet(stats, "classes", "fromClassList", []);

		classes
			.map(it => it.trim())
			.filter(Boolean)
			.forEach(pt => {
				const lowerPt = pt.toLowerCase();
				switch (lowerPt) {
					case "artificer":
					case "artificers": tgt.push({"name": "Artificer", "source": "TCE"}); break;
					case "bard":
					case "bards": tgt.push({"name": "Bard", "source": "PHB"}); break;
					case "cleric":
					case "clerics": tgt.push({"name": "Cleric", "source": "PHB"}); break;
					case "druid":
					case "druids": tgt.push({"name": "Druid", "source": "PHB"}); break;
					case "paladin":
					case "paladins": tgt.push({"name": "Paladin", "source": "PHB"}); break;
					case "ranger":
					case "rangers": tgt.push({"name": "Ranger", "source": "PHB"}); break;
					case "sorcerer":
					case "sorcerers": tgt.push({"name": "Sorcerer", "source": "PHB"}); break;
					case "warlock":
					case "warlocks": tgt.push({"name": "Warlock", "source": "PHB"}); break;
					case "wizard":
					case "wizards": tgt.push({"name": "Wizard", "source": "PHB"}); break;
					default: options.cbWarning(`${stats.name ? `(${stats.name}) ` : ""}Class "${lowerPt}" requires manual conversion`); break;
				}
			});

		if (!stats.classes.fromClassList.length) delete stats.classes;
	}
}
ConverterSpell._RES_SCHOOL = Object.entries({
	"transmutation": "T",
	"necromancy": "N",
	"conjuration": "C",
	"abjuration": "A",
	"enchantment": "E",
	"evocation": "V",
	"illusion": "I",
	"divination": "D",
}).map(([k, v]) => ({
	output: v,
	regex: RegExp(`^${k}(?: school)?$`, "i"),
}));
