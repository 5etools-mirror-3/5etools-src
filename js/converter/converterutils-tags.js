import {SITE_STYLE__CLASSIC, SITE_STYLE__ONE} from "../consts.js";
import {VetoolsConfig} from "../utils-config/utils-config-config.js";
import {ConverterTaggerInitializable} from "./converterutils-taggerbase.js";
import {WALKER_CONVERTER, WALKER_CONVERTER_KEY_BLOCKLIST} from "./converterutils-walker.js";

export class TagUtil {
	static _NONE_EMPTY_REGEX = /^(([-\u2014\u2013\u2221])+|none)$/i;

	static isNoneOrEmpty (str) {
		if (!str || !str.trim()) return false;
		return this._NONE_EMPTY_REGEX.test(str);
	}
}

export class TaggerUtils {
	static _ALL_LEGENDARY_GROUPS = null;
	static _ALL_SPELLS = null;
	static init ({legendaryGroups, spells}) {
		this._ALL_LEGENDARY_GROUPS = legendaryGroups;
		this._ALL_SPELLS = spells;
	}

	static findLegendaryGroup ({name, source}) {
		name = name.toLowerCase();
		source = source.toLowerCase();

		const doFind = arr => arr.find(it => it.name.toLowerCase() === name && it.source.toLowerCase() === source);

		const fromPrerelease = typeof PrereleaseUtil !== "undefined" ? doFind(PrereleaseUtil.getBrewProcessedFromCache("legendaryGroup")) : null;
		if (fromPrerelease) return fromPrerelease;

		const fromBrew = typeof BrewUtil2 !== "undefined" ? doFind(BrewUtil2.getBrewProcessedFromCache("legendaryGroup")) : null;
		if (fromBrew) return fromBrew;

		return doFind(this._ALL_LEGENDARY_GROUPS);
	}

	static findSpell ({name, source}) {
		name = name.toLowerCase();
		source = source.toLowerCase();

		const doFind = arr => arr.find(s => (s.name.toLowerCase() === name || (typeof s.srd === "string" && s.srd.toLowerCase() === name) || (typeof s.srd52 === "string" && s.srd52.toLowerCase() === name)) && s.source.toLowerCase() === source);

		const fromPrerelease = typeof PrereleaseUtil !== "undefined" ? doFind(PrereleaseUtil.getBrewProcessedFromCache("spell")) : null;
		if (fromPrerelease) return fromPrerelease;

		const fromBrew = typeof BrewUtil2 !== "undefined" ? doFind(BrewUtil2.getBrewProcessedFromCache("spell")) : null;
		if (fromBrew) return fromBrew;

		return doFind(this._ALL_SPELLS);
	}

	/* -------------------------------------------- */

	/**
	 *
	 * @param targetTags e.g. `["@condition"]`
	 * @param ptrStack
	 * @param depth
	 * @param str
	 * @param tagCount
	 * @param meta
	 * @param meta.fnTag
	 * @param [meta.isAllowTagsWithinTags]
	 */
	static walkerStringHandler (targetTags, ptrStack, depth, tagCount, str, meta) {
		const tagSplit = Renderer.splitByTags(str);
		const len = tagSplit.length;
		for (let i = 0; i < len; ++i) {
			const s = tagSplit[i];
			if (!s) continue;
			if (s.startsWith("{@")) {
				const [tag, text] = Renderer.splitFirstSpace(s.slice(1, -1));

				ptrStack._ += `{${tag}${text.length ? " " : ""}`;
				if (!meta.isAllowTagsWithinTags) {
					// Never tag anything within an existing tag
					this.walkerStringHandler(targetTags, ptrStack, depth + 1, tagCount + 1, text, meta);
				} else {
					// Tag something within an existing tag only if it doesn't match our tag(s)
					if (targetTags.includes(tag)) {
						this.walkerStringHandler(targetTags, ptrStack, depth + 1, tagCount + 1, text, meta);
					} else {
						this.walkerStringHandler(targetTags, ptrStack, depth + 1, tagCount, text, meta);
					}
				}
				ptrStack._ += `}`;
			} else {
				// avoid tagging things wrapped in existing tags
				if (tagCount) {
					ptrStack._ += s;
				} else {
					let sMod = s;
					sMod = meta.fnTag(sMod);
					ptrStack._ += sMod;
				}
			}
		}
	}

	static walkerStringHandlerStrictCapsWords (targetTags, ptrStack, str, meta) {
		const tagSplit = Renderer.splitByTags(str);

		const reTokenStr = /([ .!?:;,()])/.source;
		const reTokenSplit = new RegExp(reTokenStr, "g");
		const reTokenCheck = new RegExp(reTokenStr);

		const reCapsFirst = /^[A-Z]+[a-z']*$/;

		const setLower = new Set(StrUtil.TITLE_LOWER_WORDS);
		const setUpper = new Set([...StrUtil.TITLE_UPPER_WORDS, ...StrUtil.TITLE_UPPER_WORDS_PLURAL].map(it => it.toUpperCase()));

		const isPoppableTrailing = (tk) => {
			return reTokenCheck.test(tk) || setLower.has(tk);
		};

		tagSplit
			.forEach(s => {
				if (!s || s.startsWith("{@")) {
					ptrStack._ += s;
					return;
				}

				const flush = () => {
					if (!stack.length) return;

					const trailing = [];

					while (stack.length && isPoppableTrailing(stack.at(-1))) {
						trailing.push(stack.pop());
					}
					trailing.reverse();

					const str = stack.join("");
					this.walkerStringHandler(targetTags, ptrStack, 0, 0, str, meta);

					ptrStack._ += trailing.join("");

					stack = [];
				};

				let stack = [];
				const tokens = s.split(reTokenSplit);
				tokens
					.forEach(tk => {
						if (tk === " ") {
							if (stack.length) stack.push(tk);
							else ptrStack._ += tk;
							return;
						}

						// punctuation, etc.
						if (reTokenCheck.test(tk)) {
							flush();
							ptrStack._ += tk;
							return;
						}

						if (setLower.has(tk)) {
							if (stack.length) stack.push(tk);
							else ptrStack._ += tk;
							return;
						}

						if (setUpper.has(tk)) {
							stack.push(tk);
							return;
						}

						if (reCapsFirst.test(tk)) {
							stack.push(tk);
							return;
						}

						flush();
						ptrStack._ += tk;
					});

				flush();
			});
	}

	/* -------------------------------------------- */

	static getSpellsFromString (str, {cbMan} = {}) {
		const strSpellcasting = str;
		const knownSpells = {};
		strSpellcasting.replace(/{@spell ([^}]+)}/g, (...m) => {
			let [spellName, spellSource] = m[1].split("|").map(it => it.toLowerCase());
			spellSource = spellSource || Parser.SRC_PHB.toLowerCase();

			(knownSpells[spellSource] = knownSpells[spellSource] || new Set()).add(spellName);
		});

		const out = [];

		Object.entries(knownSpells)
			.forEach(([source, spellSet]) => {
				spellSet.forEach(it => {
					const spell = TaggerUtils.findSpell({name: it, source});
					if (!spell) return cbMan ? cbMan(`${it} :: ${source}`) : null;

					out.push(spell);
				});
			});

		return out;
	}
}

export class TagCondition extends ConverterTaggerInitializable {
	static _STATUS_MATCHER = new RegExp(`\\b(concentration|surprised)\\b`, "gi");
	static _STATUS_MATCHER_ALT = new RegExp(`\\b(concentrating)\\b`, "gi");

	static _STATUS_MATCHER_ALT_REPLACEMENTS = {
		"concentrating": "concentration",
	};

	static _conditionMatcherCore = null;
	static _statusMatcherCore = null;
	static _conditionMatcher = null;
	static _conditionSourceMapBrew = null;

	static async _pInit ({conditionsBrew = []} = {}) {
		await this._pInit_conditions({conditionsBrew});
	}

	static async _pInit_conditions ({conditionsBrew}) {
		const conditionData = await DataUtil.condition.loadJSON();

		const conditionsXphb = conditionData.condition
			.filter(cond => cond.source === Parser.SRC_XPHB);
		const statusesXphb = conditionData.status
			.filter(cond => cond.source === Parser.SRC_XPHB);

		this._conditionMatcherCore = new RegExp(`\\b(?<name>${conditionsXphb.map(it => it.name).join("|")})\\b`, "g");
		this._statusMatcherCore = new RegExp(`\\b(?<name>${statusesXphb.map(it => it.name).join("|")})\\b`, "g");

		const conditionsPhb = conditionData.condition
			.filter(cond => cond.source === Parser.SRC_PHB);

		const conditions = [
			...conditionsPhb.map(it => it.name.toLowerCase().escapeRegexp()),
			...(conditionsBrew || []).map(it => it.name.toLowerCase().escapeRegexp()),
		];
		this._conditionMatcher = new RegExp(`\\b(${conditions.join("|")})\\b`, "g");
		this._conditionSourceMapBrew = conditionsBrew.mergeMap(({name, source}) => ({[name.toLowerCase()]: source}));
	}

	/* -------------------------------------------- */

	static getConditionUid (conditionName) {
		const lower = conditionName.toLowerCase();
		const source = this._conditionSourceMapBrew[lower];
		if (!source) return lower;
		return `${lower}|${source.toLowerCase()}`;
	}

	/* -------------------------------------------- */

	static _fnTag ({strMod, styleHint, blocklistNames}) {
		return strMod
			.replace(this._conditionMatcher, (...m) => {
				const name = m[1];

				if (blocklistNames?.isBlocked(name)) return m[0];

				const source = this._conditionSourceMapBrew[name.toLowerCase()];
				if (!source) return `{@condition ${name}}`;
				return `{@condition ${name}|${source}}`;
			})
			.replace(this._STATUS_MATCHER, (...m) => {
				const name = m[1];

				if (blocklistNames?.isBlocked(name)) return m[0];

				if (styleHint === SITE_STYLE__CLASSIC) return `{@status ${name}}`;

				if (name === "surprised") return `{@status ${name}|${Parser.SRC_XPHB}}`; // Surprised is never capitalized
				return `{@status ${name.toTitleCase()}|${Parser.SRC_XPHB}}`;
			})
			.replace(this._STATUS_MATCHER_ALT, (...m) => {
				const displayText = m[1];
				const name = this._STATUS_MATCHER_ALT_REPLACEMENTS[m[1].toLowerCase()];

				if (blocklistNames?.isBlocked(name)) return m[0];

				if (styleHint === SITE_STYLE__CLASSIC) return `{@status ${name}||${displayText}}`;
				return `{@status ${name.toTitleCase()}|${Parser.SRC_XPHB}|${displayText.toTitleCase()}}`;
			})
		;
	}

	static _fnTagStrict ({strMod, blocklistNames}) {
		if (blocklistNames?.isBlocked(strMod)) return strMod;

		return strMod
			.replace(this._conditionMatcherCore, (...m) => {
				const {name} = m.at(-1);
				if (blocklistNames?.isBlocked(name)) return name;
				return `{@condition ${name}|${Parser.SRC_XPHB}}`;
			})
			.replace(this._statusMatcherCore, (...m) => {
				const {name} = m.at(-1);
				if (blocklistNames?.isBlocked(name)) return name;
				return `{@status ${name}|${Parser.SRC_XPHB}}`;
			})
		;
	}

	/* -------------------------------------------- */

	static _walkerStringHandler ({styleHint, str, inflictedSet = null, inflictedAllowlist = null, blocklistNames = null}) {
		const ptrStack = {_: ""};

		TaggerUtils.walkerStringHandler(
			["@condition", "@status"],
			ptrStack,
			0,
			0,
			str,
			{
				fnTag: strMod => this._fnTag({strMod, blocklistNames, styleHint}),
			},
		);

		const out = ptrStack._
			.replace(/{@condition (prone)} (to)\b/gi, "$1 $2")
			.replace(/{@condition (petrified)} (wood)\b/gi, "$1 $2")
			.replace(/{@condition (invisible)} (stalker)/gi, "$1 $2")
			.replace(/{@condition (poisoned)} (food|drink|weapon|ammunition|object)/gi, "$1 $2")
		;

		// Collect inflicted conditions for tagging
		if (inflictedSet) this._collectInflictedConditions(out, {inflictedSet, inflictedAllowlist});

		return out;
	}

	static _walkerStringHandlerStrict ({styleHint, str, inflictedSet = null, inflictedAllowlist = null, blocklistNames = null}) {
		const ptrStack = {_: ""};

		TaggerUtils.walkerStringHandlerStrictCapsWords(
			["@condition", "@status"],
			ptrStack,
			str,
			{
				fnTag: strMod => this._fnTagStrict({strMod, blocklistNames, styleHint}),
			},
		);

		const out = ptrStack._;

		// Collect inflicted conditions for tagging
		if (inflictedSet) this._collectInflictedConditions(out, {inflictedSet, inflictedAllowlist});

		return out;
	}

	/* -------------------------------------------- */

	static _handleProp ({ent, prop, inflictedSet, inflictedAllowlist, styleHint, blocklistNames} = {}) {
		if (!ent[prop]) return;

		ent[prop] = ent[prop]
			.map(entry => {
				const nameStack = [];
				const walkerHandlers = {
					preObject: (obj) => nameStack.push(obj.name),
					postObject: () => nameStack.pop(),
					string: [
						(str) => {
							if (nameStack.includes("Antimagic Susceptibility")) return str;
							if (nameStack.includes("Sneak Attack (1/Turn)")) return str;
							str = this._walkerStringHandlerStrict({styleHint, str, inflictedSet, inflictedAllowlist, blocklistNames});
							return this._walkerStringHandler({styleHint, str, inflictedSet, inflictedAllowlist, blocklistNames});
						},
					],
				};
				entry = MiscUtil.copy(entry);
				return WALKER_CONVERTER.walk(entry, walkerHandlers);
			});
	}

	/**
	 * @param ent
	 * @param {boolean} isTagInflicted
	 * @param {boolean} isInflictedAddOnly
	 * @param {?Set} inflictedAllowlist
	 * @param {?string} styleHint
	 * @param {?ConverterStringBlocklist} blocklistNames
	 */
	static tryTagConditions (ent, {isTagInflicted = false, isInflictedAddOnly = false, inflictedAllowlist = null, styleHint = null, blocklistNames = null} = {}) {
		const inflictedSet = isTagInflicted ? new Set() : null;
		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		if (blocklistNames) blocklistNames = blocklistNames.getWithBlocklistIgnore([ent.name]);

		[
			"action",
			"reaction",
			"bonus",
			"trait",
			"legendary",
			"mythic",
			"variant",
			"entries",
			"entriesHigherLevel",
		]
			.forEach(prop => this._handleProp({ent, prop, inflictedSet, inflictedAllowlist, styleHint, blocklistNames}));

		this._mutAddInflictedSet({ent, inflictedSet, isInflictedAddOnly, prop: "conditionInflict"});
	}

	static _collectInflictedConditions (str, {inflictedSet, inflictedAllowlist} = {}) {
		if (!inflictedSet) return;

		TagCondition._CONDITION_INFLICTED_MATCHERS.forEach(re => str.replace(re, (...m) => {
			this._collectInflictedConditions_withAllowlist({inflictedSet, inflictedAllowlist, cond: m[1]});

			// ", {@condition ...}, ..."
			if (m[2]) m[2].replace(/{@condition ([^}]+)}/g, (...n) => this._collectInflictedConditions_withAllowlist({inflictedSet, inflictedAllowlist, cond: n[1]}));

			// " and {@condition ...}
			if (m[3]) m[3].replace(/{@condition ([^}]+)}/g, (...n) => this._collectInflictedConditions_withAllowlist({inflictedSet, inflictedAllowlist, cond: n[1]}));
		}));
	}

	static _collectInflictedConditions_withAllowlist ({inflictedAllowlist, inflictedSet, cond}) {
		// Treat XPHB conditions as base
		const [name, source] = cond.toLowerCase().split("|");
		const condClean = !source || [Parser.SRC_PHB.toLowerCase(), Parser.SRC_XPHB.toLowerCase()].includes(source) ? name : `${name}|${source}`;

		if (!inflictedAllowlist || inflictedAllowlist.has(cond)) inflictedSet.add(condClean);
		return "";
	}

	static tryTagConditionsSpells (ent, {cbMan, isTagInflicted, isInflictedAddOnly, inflictedAllowlist} = {}) {
		if (!ent.spellcasting) return false;

		const inflictedSet = isTagInflicted ? new Set() : null;

		const spells = TaggerUtils.getSpellsFromString(JSON.stringify(ent.spellcasting), {cbMan});
		spells.forEach(spell => {
			if (spell.conditionInflict) spell.conditionInflict.filter(c => !inflictedAllowlist || inflictedAllowlist.has(c)).forEach(c => inflictedSet.add(c));
		});

		this._mutAddInflictedSet({ent, inflictedSet, isInflictedAddOnly, prop: "conditionInflictSpell"});
	}

	static tryTagConditionsRegionalsLairs (ent, {cbMan, isTagInflicted, isInflictedAddOnly, inflictedAllowlist} = {}) {
		if (!ent.legendaryGroup) return;

		const inflictedSet = isTagInflicted ? new Set() : null;

		const meta = TaggerUtils.findLegendaryGroup({name: ent.legendaryGroup.name, source: ent.legendaryGroup.source});
		if (!meta) return cbMan ? cbMan(ent.legendaryGroup) : null;
		this._collectInflictedConditions(JSON.stringify(meta), {inflictedSet, inflictedAllowlist});

		this._mutAddInflictedSet({ent, inflictedSet, isInflictedAddOnly, prop: "conditionInflictLegendary"});
	}

	static _mutAddInflictedSet ({ent, inflictedSet, isInflictedAddOnly, prop}) {
		if (!inflictedSet) return;

		if (isInflictedAddOnly) {
			(ent[prop] || []).forEach(it => inflictedSet.add(it));
			if (inflictedSet.size) ent[prop] = [...inflictedSet].map(it => it.toLowerCase()).sort(SortUtil.ascSortLower);
			return;
		}

		if (inflictedSet.size) ent[prop] = [...inflictedSet].map(it => it.toLowerCase()).sort(SortUtil.ascSortLower);
		else delete ent[prop];
	}

	/* -------------------------------------------- */

	// region Run basic tagging
	static _tryRun (ent, {styleHint = null, blocklistNames = null} = {}) {
		if (blocklistNames) blocklistNames = blocklistNames.getWithBlocklistIgnore([ent.name]);

		return WALKER_CONVERTER.walk(
			ent,
			{
				string: (str) => {
					return this._walkerStringHandler({styleHint, str, blocklistNames});
				},
			},
		);
	}

	static _tryRunStrictCapsWords (ent, {styleHint = null, blocklistNames = null} = {}) {
		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		if (blocklistNames) blocklistNames = blocklistNames.getWithBlocklistIgnore([ent.name]);

		return WALKER_CONVERTER.walk(
			ent,
			{
				string: (str) => {
					return this._walkerStringHandlerStrict({styleHint, str, blocklistNames});
				},
			},
		);
	}
	// endregion
}
// Each should have one group which matches the condition name.
//   A comma/and part is appended to the end to handle chains of conditions.
TagCondition.__TGT = `(?:target|wielder)`;
TagCondition._CONDITION_INFLICTED_MATCHERS = [
	`(?:creature|enemy|target) is \\w+ {@condition ([^}]+)}`, // "is knocked prone"
	`(?:creature|enemy|target) becomes (?:\\w+ )?{@condition ([^}]+)}`,
	`saving throw (?:by \\d+ or more, it )?is (?:\\w+ )?{@condition ([^}]+)}`, // MM :: Sphinx :: First Roar
	`(?:the save|fails) by \\d+ or more, [^.!?]+?{@condition ([^}]+)}`, // VGM :: Fire Giant Dreadnought :: Shield Charge
	`(?:${TagCondition.__TGT}|creatures?|humanoid|undead|other creatures|enemy) [^.!?]+?(?:succeed|make|pass)[^.!?]+?saving throw[^.!?]+?or (?:fall|be(?:come)?|is) (?:\\w+ )?{@condition ([^}]+)}`,
	`and then be (?:\\w+ )?{@condition ([^}]+)}`,
	`(?:be|is) knocked (?:\\w+ )?{@condition (prone|unconscious)}`,
	`a (?:\\w+ )?{@condition [^}]+} (?:creature|enemy) is (?:\\w+ )?{@condition ([^}]+)}`, // e.g. `a frightened creature is paralyzed`
	`(?<!if )the[^.!?]+?${TagCondition.__TGT} is [^.!?]*?(?<!that isn't ){@condition ([^}]+)}`,
	`the[^.!?]+?${TagCondition.__TGT} is [^.!?]+?, it is {@condition ([^}]+)}(?: \\(escape [^\\)]+\\))?`,
	`begins to [^.!?]+? and is {@condition ([^}]+)}`, // e.g. `begins to turn to stone and is restrained`
	`saving throw[^.!?]+?or [^.!?]+? and remain {@condition ([^}]+)}`, // e.g. `or fall asleep and remain unconscious`
	`saving throw[^.!?]+?or be [^.!?]+? and land {@condition (prone)}`, // MM :: Cloud Giant :: Fling
	`saving throw[^.!?]+?or be (?:pushed|pulled) [^.!?]+? and (?:\\w+ )?{@condition ([^}]+)}`, // MM :: Dragon Turtle :: Tail
	`the engulfed (?:creature|enemy) [^.!?]+? {@condition ([^}]+)}`, // MM :: Gelatinous Cube :: Engulf
	`the ${TagCondition.__TGT} is [^.!?]+? and (?:is )?{@condition ([^}]+)} while`, // MM :: Giant Centipede :: Bite
	`on a failed save[^.!?]+?the (?:${TagCondition.__TGT}|creature) [^.!?]+? {@condition ([^}]+)}`, // MM :: Jackalwere :: Sleep Gaze
	`on a failure[^.!?]+?${TagCondition.__TGT}[^.!?]+?(?:pushed|pulled)[^.!?]+?and (?:\\w+ )?{@condition ([^}]+)}`, // MM :: Marid :: Water Jet
	`a[^.!?]+?(?:creature|enemy)[^.!?]+?to the[^.!?]+?is (?:also )?{@condition ([^}]+)}`, // MM :: Mimic :: Adhesive
	`(?:creature|enemy) gains? \\w+ levels? of {@condition (exhaustion)}`, // MM :: Myconid Adult :: Euphoria Spores
	`(?:saving throw|failed save)[^.!?]+? gains? \\w+ levels? of {@condition (exhaustion)}`, // ERLW :: Belashyrra :: Rend Reality
	`(?:on a successful save|if the saving throw is successful), (?:the ${TagCondition.__TGT} |(?:a|the )creature |(?:an |the )enemy )[^.!?]*?isn't {@condition ([^}]+)}`,
	`or take[^.!?]+?damage and (?:becomes?|is|be) {@condition ([^}]+)}`, // MM :: Quasit || Claw
	`the (?:${TagCondition.__TGT}|creature|enemy) [^.!?]+? and is {@condition ([^}]+)}`, // MM :: Satyr :: Gentle Lullaby
	`${TagCondition.__TGT}\\. [^.!?]+?damage[^.!?]+?and[^.!?]+?${TagCondition.__TGT} is {@condition ([^}]+)}`, // MM :: Vine Blight :: Constrict
	`on a failure[^.!?]+?${TagCondition.__TGT} [^.!?]+?\\. [^.!?]+?is also {@condition ([^}]+)}`, // MM :: Water Elemental :: Whelm
	`(?:(?:a|the|each) ${TagCondition.__TGT}|(?:a|the|each) creature|(?:an|each) enemy)[^.!?]+?takes?[^.!?]+?damage[^.!?]+?and [^.!?]+? {@condition ([^}]+)}`, // AI :: Keg Robot :: Hot Oil Spray
	`(?:creatures|enemies) within \\d+ feet[^.!?]+must succeed[^.!?]+saving throw or be {@condition ([^}]+)}`, // VGM :: Deep Scion :: Psychic Screech
	`creature that fails the save[^.!?]+?{@condition ([^}]+)}`, // VGM :: Gauth :: Stunning Gaze
	`if the ${TagCondition.__TGT} is a creature[^.!?]+?saving throw[^.!?]*?\\. On a failed save[^.!?]+?{@condition ([^}]+)}`, // VGM :: Mindwitness :: Eye Rays
	`while {@condition (?:[^}]+)} in this way, an? (?:${TagCondition.__TGT}|creature|enemy) [^.!?]+{@condition ([^}]+)}`, // VGM :: Vargouille :: Stunning Shriek
	`${TagCondition.__TGT} must succeed[^.!?]+?saving throw[^.!?]+?{@condition ([^}]+)}`, // VGM :: Yuan-ti Pit Master :: Merrshaulk's Slumber
	`fails the saving throw[^.!?]+?is instead{@condition ([^}]+)}`, // ERLW :: Sul Khatesh :: Maddening Secrets
	`on a failure, the [^.!?]+? can [^.!?]+?{@condition ([^}]+)}`, // ERLW :: Zakya Rakshasa :: Martial Prowess
	`the {@condition ([^}]+)} creature can repeat the saving throw`, // GGR :: Archon of the Triumvirate :: Pacifying Presence
	`if the (?:${TagCondition.__TGT}|creature) is already {@condition [^}]+}, it becomes {@condition ([^}]+)}`,
	`(?<!if the )(?:creature|${TagCondition.__TGT}) (?:also becomes|is) {@condition ([^}]+)}`, // MTF :: Eidolon :: Divine Dread
	`magically (?:become|turn)s? {@condition (invisible)}`, // MM :: Will-o'-Wisp :: Invisibility
	{re: `The (?!(?:[^.]+) can sense)(?:[^.]+) is {@condition (invisible)}`, flags: "g"}, // MM :: Invisible Stalker :: Invisibility
	`succeed\\b[^.!?]+\\bsaving throw\\b[^.!?]+\\. (?:It|The (?:creature|target)) is {@condition ([^}]+)}`, // MM :: Beholder :: 6. Telekinetic Ray
	{re: `\\bhave the {@condition ([^}]+)}\\b`, flags: "g"}, // XPHB :: Animal Friendship
	{re: `(?<!while [^.!?]+? |can't use this trait if [^.!?]+? |unless [^.!?]+? |suppressed while [^.!?]+? )has the {@condition ([^}]+)} condition\\b`, flags: "g"}, // XPHB :: Constrictor Snake
]
	.map(it => typeof it === "object" ? it : ({re: it, flags: "gi"}))
	.map(({re, flags}) => new RegExp(`${re}((?:, {@condition [^}]+})*)(,? (?:and|or) {@condition [^}]+})?`, flags));

export class DiceConvert {
	static _walker = null;

	static convertTraitActionDice (traitOrAction) {
		if (traitOrAction.entries) {
			traitOrAction.entries = traitOrAction.entries
				.filter(it => it.trim ? it.trim() : true)
				.map(entry => this._getConvertedEntry({entry, isTagHits: true}));
		}
	}

	static getTaggedEntry (entry) {
		return this._getConvertedEntry({entry});
	}

	static _getConvertedEntry ({entry, isTagHits = false}) {
		DiceConvert._walker ||= MiscUtil.getWalker({
			keyBlocklist: new Set([
				...WALKER_CONVERTER_KEY_BLOCKLIST,
				"dmg1",
				"dmg2",
				"area",
				"path",
			]),
		});

		const walkerHandlers = {
			string: (str) => {
				const ptrStack = {_: ""};
				TaggerUtils.walkerStringHandler(
					["@dice", "@hit", "@damage", "@scaledice", "@scaledamage", "@d20"],
					ptrStack,
					0,
					0,
					str,
					{
						fnTag: str => this._walkerStringHandler({str, isTagHits}),
					},
				);
				return ptrStack._;
			},
		};

		entry = MiscUtil.copyFast(entry);
		return DiceConvert._walker.walk(entry, walkerHandlers);
	}

	static _RE_NO_FORMAT_STRINGS = /(\b(?:plus|minus|PB)\b)/;

	static _walkerStringHandler ({str, isTagHits}) {
		if (isTagHits) {
			str = str
				// Handle e.g. `+3 to hit`
				// Handle e.g. `+3 plus PB to hit`
				.replace(/(?<op>[-+])?(?<bonus>\d+(?: (?:plus|minus|[-+]) PB)?)(?= to hit\b)/g, (...m) => `{@hit ${m.last().op === "-" ? "-" : ""}${m.last().bonus}}`)
				// Handle E.g. "... Attack Roll: +5, ..."
				.replace(/(?<=Attack Roll: )(?<op>[-+])?(?<bonus>\d+(?: (?:plus|minus|[-+]) PB)?)(?=,| \()/g, (...m) => `{@hit ${m.last().op === "-" ? "-" : ""}${m.last().bonus}}`)
				// Handle E.g. "... Attack Roll: Bonus equals your spell attack modifier, ..."
				.replace(/(?<=Attack Roll: )Bonus equals your spell attack modifier(?=,)/g, (...m) => `{@hitYourSpellAttack Bonus equals your spell attack modifier}`)
			;
		}

		// re-tag + format dice
		str = str
			.replace(/\b(\s*[-+]\s*)?(([1-9]\d*|PB)?d([1-9]\d*)(\s*?(?:plus|minus|[-+×x*÷/])\s*?(\d,\d|\d|PB)+(\.\d+)?)?)+(?:\s*\+\s*\bPB\b)?\b/gi, (...m) => {
				const expanded = m[0]
					.split(this._RE_NO_FORMAT_STRINGS)
					.map(pt => {
						pt = pt.trim();
						if (!pt) return pt;

						if (this._RE_NO_FORMAT_STRINGS.test(pt)) return pt;

						return pt
							.replace(/([^0-9d.,PB])/gi, " $1 ")
							.replace(/\s+/g, " ");
					})
					.filter(Boolean)
					.join(" ");
				return `{@dice ${expanded}}`;
			});

		// unwrap double-tagged
		let last;
		do {
			last = str;
			str = str.replace(/{@(dice|damage|scaledice|scaledamage|d20) ([^}]*){@(dice|damage|scaledice|scaledamage|d20) ([^}]*)}([^}]*)}/gi, (...m) => {
				// Choose the strongest dice type we have
				const nxtType = [
					m[1] === "scaledamage" || m[3] === "scaledamage" ? "scaledamage" : null,
					m[1] === "damage" || m[3] === "damage" ? "damage" : null,
					m[1] === "d20" || m[3] === "d20" ? "d20" : null,
					m[1] === "scaledice" || m[3] === "scaledice" ? "scaledice" : null,
					m[1] === "dice" || m[3] === "dice" ? "dice" : null,
				].filter(Boolean)[0];
				return `{@${nxtType} ${m[2]}${m[4]}${m[5]}}`;
			});
		} while (last !== str);

		do {
			last = str;
			str = str.replace(/{@b ({@(?:dice|damage|scaledice|scaledamage|d20) ([^}]*)})}/gi, "$1");
		} while (last !== str);

		// tag @damage (creature style)
		str = str.replace(/\d+ \({@dice (?:[^|}]*)}\)(?:\s+[-+]\s+[-+a-zA-Z0-9 ]*?)?(?: magic(?:al)?)?(?: [a-z]+(?:(?:, |, or | or )[a-z]+)*)? damage/ig, (...m) => m[0].replace(/{@dice /gi, "{@damage "));

		// tag @damage (spell/etc style)
		str = str.replace(/{@dice (?:[^|}]*)}(?:\s+[-+]\s+[-+a-zA-Z0-9 ]*?)?(?:\s+[-+]\s+the spell's level)?(?: [a-z]+(?:(?:, |, or | or )[a-z]+)*)? damage/ig, (...m) => m[0].replace(/{@dice /gi, "{@damage "));

		return str;
	}

	static cleanHpDice (m) {
		if (m.hp && m.hp.formula) {
			m.hp.formula = m.hp.formula
				.replace(/\s+/g, "") // crush spaces
				.replace(/([^0-9d])/gi, " $1 "); // add spaces
		}
	}
}

export class ArtifactPropertiesTag {
	static tryRun (it, opts) {
		WALKER_CONVERTER.walk(it, {
			string: (str) => str.replace(/major beneficial|minor beneficial|major detrimental|minor detrimental/gi, (...m) => {
				const mode = m[0].trim().toLowerCase();

				switch (mode) {
					case "major beneficial": return `{@table Artifact Properties; Major Beneficial Properties|${opts.styleHint === SITE_STYLE__CLASSIC ? Parser.SRC_DMG : Parser.SRC_XDMG}|${m[0]}}`;
					case "minor beneficial": return `{@table Artifact Properties; Minor Beneficial Properties|${opts.styleHint === SITE_STYLE__CLASSIC ? Parser.SRC_DMG : Parser.SRC_XDMG}|${m[0]}}`;
					case "major detrimental": return `{@table Artifact Properties; Major Detrimental Properties|${opts.styleHint === SITE_STYLE__CLASSIC ? Parser.SRC_DMG : Parser.SRC_XDMG}|${m[0]}}`;
					case "minor detrimental": return `{@table Artifact Properties; Minor Detrimental Properties|${opts.styleHint === SITE_STYLE__CLASSIC ? Parser.SRC_DMG : Parser.SRC_XDMG}|${m[0]}}`;
				}
			}),
		});
	}
}

export class SkillTag extends ConverterTaggerInitializable {
	static _RE_BASIC_XPHB = null;
	static _RE_BASIC = /^(?<name>Acrobatics|Animal Handling|Arcana|Athletics|Deception|History|Insight|Intimidation|Investigation|Medicine|Nature|Perception|Performance|Persuasion|Religion|Sleight of Hand|Stealth|Survival)$/g;

	static async _pInit () {
		const skillData = await DataLoader.pCacheAndGetAllSite("skill");

		const coreSKills = [...skillData]
			.filter(skill => skill.source === Parser.SRC_XPHB);

		this._RE_BASIC_XPHB = new RegExp(`^(?<name>${(coreSKills.map(skill => skill.name).join("|"))})$`, "g");
	}

	/**
	 * @param ent
	 * @param {"classic" | "one" | null} styleHint
	 */
	static _tryRunStrictCapsWords (ent, {styleHint = null} = {}) {
		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		return WALKER_CONVERTER.walk(
			ent,
			{
				string: (str) => {
					const ptrStack = {_: ""};

					if (styleHint === SITE_STYLE__ONE) {
						TaggerUtils.walkerStringHandlerStrictCapsWords(
							["@skill"],
							ptrStack,
							str,
							{
								fnTag: strMod => this._fnTagStrict_one(strMod),
							},
						);

						str = ptrStack._;
						ptrStack._ = "";
					}

					TaggerUtils.walkerStringHandlerStrictCapsWords(
						["@skill"],
						ptrStack,
						str,
						{
							fnTag: strMod => this._fnTagStrict_classic(strMod),
						},
					);

					return ptrStack._;
				},
			},
		);
	}

	static _getStrStrictReplaced_one (str) {
		return str
			.replace(this._RE_BASIC_XPHB, (...m) => `{@skill ${m.at(-1).name}|${Parser.SRC_XPHB}}`);
	}

	static _fnTagStrict_one (strMod) {
		const strModOut = this._getStrStrictReplaced_one(strMod);

		if (strMod !== strModOut) return strModOut;

		const pts = this._getCapsWordConjunctionTokens(strMod);
		if (pts.length === 1) return strMod;

		return pts
			.map(pt => this._getStrStrictReplaced_one(pt))
			.join(" ");
	}

	static _getStrStrictReplaced_classic (str) {
		return str
			.replace(this._RE_BASIC, (...m) => {
				const {name} = m.at(-1);
				return `{@skill ${name}}`;
			});
	}

	static _fnTagStrict_classic (strMod) {
		const strModOut = this._getStrStrictReplaced_classic(strMod);

		if (strMod !== strModOut) return strModOut;

		const pts = this._getCapsWordConjunctionTokens(strMod);
		if (pts.length === 1) return strMod;

		return pts
			.map(pt => this._getStrStrictReplaced_classic(pt))
			.join(" ");
	}
}

export class ActionTag extends ConverterTaggerInitializable {
	static _RE_BASIC_XPHB = null;
	static _RE_BASIC_CLASSIC = /^(Attack|Dash|Disengage|Dodge|Help|Hide|Ready|Search|Use an Object|shove a creature)$/g;

	static async _pInit () {
		const actionData = await DataUtil.action.loadJSON();

		const coreActions = [...actionData.action]
			.filter(action => action.source === Parser.SRC_XPHB);

		this._RE_BASIC_XPHB = new RegExp(`^(?<name>${(coreActions.map(action => action.name).join("|"))})$`, "g");
	}

	static _tryRunStrictCapsWords (it) {
		return WALKER_CONVERTER.walk(
			it,
			{
				string: (str) => {
					const ptrStack = {_: ""};

					TaggerUtils.walkerStringHandlerStrictCapsWords(
						["@action"],
						ptrStack,
						str,
						{
							fnTag: strMod => this._fnTagStrict_one(strMod),
						},
					);

					str = ptrStack._;
					ptrStack._ = "";

					TaggerUtils.walkerStringHandlerStrictCapsWords(
						["@action"],
						ptrStack,
						str,
						{
							fnTag: strMod => this._fnTagStrict_classic(strMod),
						},
					);

					return ptrStack._;
				},
			},
		);
	}

	static _fnTagStrict_one (strMod) {
		return strMod
			.replace(this._RE_BASIC_XPHB, (...m) => `{@action ${m.at(-1).name}|${Parser.SRC_XPHB}}`)
			.replace(/\bOpportunity Attacks\b/g, (...m) => `{@action Opportunity Attack|XPHB|Opportunity Attacks}`)
		;
	}

	static _fnTagStrict_classic (strMod) {
		// Avoid tagging text within titles
		if (strMod.toTitleCase() === strMod) return strMod;

		let mAction;
		while ((mAction = this._RE_BASIC_CLASSIC.exec(strMod))) {
			const ixMatchEnd = mAction.index + mAction[0].length;

			const ptTag = mAction[1] === "shove a creature" ? "shove" : mAction[1];
			const ptTrailing = mAction[1] === "shove a creature" ? ` a creature` : "";
			const replaceAs = `{@action ${ptTag}}${ptTrailing}`;

			strMod = `${strMod.slice(0, mAction.index)}${replaceAs}${strMod.slice(ixMatchEnd, strMod.length)}`
				.replace(/{@action Attack} (and|or) damage roll/g, "Attack $1 damage roll")
			;

			this._RE_BASIC_CLASSIC.lastIndex += replaceAs.length - 1;
		}

		this._RE_BASIC_CLASSIC.lastIndex = 0;

		return strMod;
	}
}

export class SenseTag extends ConverterTaggerInitializable {
	static _RE_BASIC_XPHB = null;
	static _RE_BASIC = /\b(?<name>tremorsense|blindsight|truesight|darkvision)\b/ig;

	static async _pInit () {
		const senseData = await DataLoader.pCacheAndGetAllSite("sense");

		const coreSenses = [...senseData]
			.filter(skill => skill.source === Parser.SRC_XPHB);

		this._RE_BASIC_XPHB = new RegExp(`\\b(?<name>${(coreSenses.map(sense => sense.name).join("|"))})\\b`, "g");
	}

	/**
	 * @param ent
	 * @param {"classic" | "one" | null} styleHint
	 */
	static _tryRun (ent, {styleHint = null} = {}) {
		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		return WALKER_CONVERTER.walk(
			ent,
			{
				string: (str) => {
					const ptrStack = {_: ""};

					if (styleHint === SITE_STYLE__ONE) {
						TaggerUtils.walkerStringHandler(
							["@sense"],
							ptrStack,
							0,
							0,
							str,
							{
								fnTag: this._fnTag_one.bind(this),
							},
						);

						str = ptrStack._;
						ptrStack._ = "";
					}

					TaggerUtils.walkerStringHandler(
						["@sense"],
						ptrStack,
						0,
						0,
						str,
						{
							fnTag: this._fnTag_classic.bind(this),
						},
					);

					return ptrStack._;
				},
			},
		);
	}

	static _fnTag_one (strMod) {
		return strMod
			.replace(this._RE_BASIC_XPHB, (...m) => `{@sense ${m.at(-1).name}|${Parser.SRC_XPHB}}`)
		;
	}

	static _fnTag_classic (strMod) {
		return strMod.replace(this._RE_BASIC, (...m) => {
			const {name} = m.at(-1);
			return `{@sense ${name}${name.toLowerCase() === "tremorsense" ? "|MM" : ""}}`;
		});
	}
}
