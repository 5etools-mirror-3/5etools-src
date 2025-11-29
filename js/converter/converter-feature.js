import {ConverterBase} from "./converter-base.js";
import {ConverterConst} from "./converterutils-const.js";
import {AlignmentUtil} from "./converterutils-utils-alignment.js";
import {ConverterUtils} from "./converterutils-utils.js";

export class ConverterFeatureBase extends ConverterBase {
	static _RE_FEAT_TYPE = /\b(?<category>General|Origin|Fighting Style|Epic Boon|Dragonmark)\b/;

	/* -------------------------------------------- */

	static _doParse_getInitialState (inText, options) {
		if (!inText || !inText.trim()) {
			options.cbWarning("No input!");
			return {};
		}

		const toConvert = this._getCleanInput(inText, options)
			.split("\n")
			.filter(it => it && it.trim());

		const entity = {};
		entity.source = options.source;
		// for the user to fill out
		entity.page = options.page;

		return {toConvert, entity};
	}

	/* -------------------------------------------- */

	static _doPostProcess_setPrerequisites (state, options) {
		const [entsPrereq, entsRest] = state.entity.entries.segregate(ent => ent.name === "Prerequisite:");
		if (!entsPrereq.length) return;

		if (entsPrereq.length > 1) {
			options.cbWarning(`(${state.entity.name}) Prerequisites requires manual conversion`);
			return;
		}

		const [entPrereq] = entsPrereq;
		if (entPrereq.entries.length > 1 || (typeof entPrereq.entries[0] !== "string")) {
			options.cbWarning(`(${state.entity.name}) Prerequisites requires manual conversion`);
			return;
		}
		const [entPrereqString] = entPrereq.entries;

		state.entity.entries = entsRest;

		const pres = [];
		const tokens = this._getPrerequisiteTokens(entPrereqString);

		// Collect ability score requirements and cross-product them with other prerequisites later
		const preAbilsMeta = {abils: [], score: null};

		let tkStack = [];

		const handleStack = () => {
			const meta = this._doPostProcess_setPrerequisites_handleStack({state, options, tkStack, preAbilsMeta});

			if (meta != null) {
				pres.push(meta.pre);
			}

			tkStack = [];
		};

		const reAbils = /^(?:Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma),?/;

		for (let i = 0; i < tokens.length; ++i) {
			const tk = tokens[i];
			const tkNxt = tokens[i + 1];

			// If we're in a list of abilities, greedily take tokens
			if (reAbils.test(tk)) {
				tkStack.push(tk);

				let j = i + 1;
				for (; j < tokens.length; ++j) {
					const tkNxt = tokens[j];
					if (!reAbils.test(tk) && tkNxt !== "or") break;
					tkStack.push(tkNxt);
				}
				if (j > i + 1) i = j;
				continue;
			}

			if (tk !== "or") {
				tkStack.push(tk);
				continue;
			}

			handleStack();
		}
		handleStack();

		if (
			(preAbilsMeta.score && !preAbilsMeta.abils.length)
			|| (!preAbilsMeta.score && preAbilsMeta.abils.length)
		) {
			return options.cbWarning(`(${state.entity.name}) Prerequisite require manual conversion`);
		}

		const presDeduped = [];
		pres.forEach(pre => {
			if (presDeduped.some(it => CollectionUtil.deepEquals(pre, it))) return;
			presDeduped.push(pre);
		});

		const presOut = [];
		if (!preAbilsMeta.abils.length) presOut.push(...presDeduped);
		else if (!presDeduped.length) {
			presOut.push(
				...preAbilsMeta.abils
					.map(abv => ({
						"ability": [{[abv]: preAbilsMeta.score}],
					})),
			);
		} else {
			preAbilsMeta.abils
				.forEach(abv => {
					MiscUtil.copyFast(presDeduped)
						.forEach(cpy => {
							cpy.ability = [{[abv]: preAbilsMeta.score}];
							presOut.push(cpy);
						});
				});
		}

		if (!presOut.length) return;

		state.entity.prerequisite = presOut;
	}

	static _doPostProcess_setPrerequisites_handleStack ({state, options, tkStack, preAbilsMeta}) {
		if (!tkStack.length) return;

		while ([",", ";"].includes(tkStack.at(-1))) tkStack.pop();
		const joinedStack = tkStack.join(" ").trim();

		const parts = joinedStack.split(
			joinedStack.includes(";")
				? StrUtil.SEMICOLON_SPACE_NOT_IN_PARENTHESES_REGEX
				: StrUtil.COMMA_SPACE_NOT_IN_PARENTHESES_REGEX,
		);

		const pre = {};

		parts.forEach(pt => {
			pt = pt.trim().replace(/[,;]\s*$/, "");

			if (/^the ability to cast at least one spell$/i.test(pt)) return pre.spellcasting = true;

			if (/^spellcasting$/i.test(pt)) return pre.spellcasting2020 = true;
			if (/^pact magic feature$/i.test(pt)) return pre.spellcasting2020 = true;
			if (/^Spellcasting or Pact Magic Feature$/i.test(pt)) return pre.spellcasting2020 = true;

			if (/^spellcasting feature$/i.test(pt)) return pre.spellcastingFeature = true;
			if (/^spellcasting feature from a class that prepares spells$/i.test(pt)) return pre.spellcastingPrepared = true;

			if (/proficiency with a martial weapon/i.test(pt)) {
				pre.proficiency ||= [{}];
				pre.proficiency[0].weapon = "martial";
				return;
			}

			if (/Martial Weapon Proficiency/i.test(pt)) {
				pre.proficiency ||= [{}];
				pre.proficiency[0].weaponGroup = "martial";
				return;
			}

			const mArmor = /^(?<armorType>Light|Medium|Heavy) Armor (?:Training|Proficiency)$/i.exec(pt)
				|| /^(?<armorType>Shield) (?:Training|Proficiency)$/i.exec(pt);
			if (mArmor) {
				pre.proficiency ||= [{}];
				pre.proficiency[0].armor = mArmor.groups.armorType.toLowerCase();
				return;
			}

			const mLevel = /^(?<level>\d+).. level$/i.exec(pt);
			if (mLevel) return pre.level = Number(mLevel.groups.level);

			const mLevelAlt = /^Level (?<level>\d+)\+?$/i.exec(pt);
			if (mLevelAlt) return pre.level = Number(mLevelAlt.groups.level);

			const mAbilityPlain = new RegExp(`^(${Object.values(Parser.ATB_ABV_TO_FULL).join("|")})$`).exec(pt);
			if (mAbilityPlain) {
				preAbilsMeta.abils.push(mAbilityPlain[0].slice(0, 3).toLowerCase());
				return;
			}

			const mAbility = new RegExp(`^${Object.entries(Parser.ATB_ABV_TO_FULL).map(([abv, full]) => `(?:or )?(?<${abv}>${full})?(?:,? )?`).join("")} (?:score of )?(?<score>\\d+)(?:\\+| or higher)$`).exec(pt);
			if (mAbility) {
				// Expect only one ability score threshold (i.e. no "str 15 OR dex 13")
				if (preAbilsMeta.score) {
					options.cbWarning(`(${state.entity.name}) Ability score prerequisite "${pt}" requires manual conversion`);
					return;
				}

				preAbilsMeta.score = Number(mAbility.groups.score);
				Parser.ABIL_ABVS
					.filter(abv => mAbility.groups[abv])
					.forEach(abv => {
						if (preAbilsMeta.abils.includes(abv)) return options.cbWarning(`(${state.entity.name}) Ability score prerequisite (${abv}) requires manual conversion`);
						preAbilsMeta.abils.push(abv);
					});

				return;
			}

			if (/^Can't Have Another Dragonmark Feat$/i.test(pt)) return pre.exclusiveFeatCategory = ["D"];

			const mFeatCategory = new RegExp(`^Any ${this._RE_FEAT_TYPE.source}(?: Feat)?`, "i").exec(pt);
			if (mFeatCategory) {
				return pre.featCategory = [Parser.featCategoryFromFull(mFeatCategory.groups.category)];
			}

			const mFeat = /^(?<name>.*?) feat$/i.exec(pt);
			if (mFeat) {
				pre.feat ||= [];
				const rawFeat = mFeat.groups.name.toLowerCase().trim();

				const [ptName, ptSpecifier] = rawFeat.split(/ \(([^)]+)\)$/);
				if (!ptSpecifier) return pre.feat.push(`${rawFeat}|${state.entity.source.toLowerCase()}`);

				return pre.feat.push(`${ptName}|${state.entity.source.toLowerCase()}|${rawFeat}`);
			}

			const mBackground = /^(?<name>.*?) background$/i.exec(pt);
			if (mBackground) {
				const name = mBackground.groups.name.trim();
				return (pre.background = pre.background || []).push({
					name,
					displayEntry: `{@background ${name}}`,
				});
			}

			const mAlignment = /^(?<align>.*?) alignment/i.exec(pt);
			if (mAlignment) {
				const {alignment} = AlignmentUtil.tryGetConvertedAlignment(mAlignment.groups.align);
				if (alignment) {
					pre.alignment = alignment;
					return;
				}
			}

			const mCampaign = /^(?<name>.*)? Campaign$/i.exec(pt);
			if (mCampaign) {
				return (pre.campaign = pre.campaign || []).push(mCampaign.groups.name);
			}

			const mClass = new RegExp(`^${ConverterConst.STR_RE_CLASS}(?: class)?$`, "i").exec(pt);
			if (mClass) {
				return pre.level = {
					level: 1,
					class: {
						name: mClass.groups.name,
						visible: true,
					},
				};
			}

			const mFeature = /^(?<name>.*) Feature$/.exec(pt);
			if (mFeature) {
				pre.feature = [mFeature.groups.name];
				return;
			}

			const mCulture = /^(?<name>.*) Culture$/.exec(pt);
			if (mCulture) {
				pre.culture = [mCulture.groups.name];
				return;
			}

			pre.other = pt;
			options.cbWarning(`(${state.entity.name}) Prerequisite "${pt}" requires manual conversion`);
		});

		if (!Object.keys(pre).length) return null;
		return {pre};
	}

	static _PREREQUISITE_TRIE = null;

	static _getPrerequisiteTokens (entPrereqString) {
		if (this._PREREQUISITE_TRIE == null) {
			this._PREREQUISITE_TRIE = new Trie();
			[
				"Spellcasting or Pact Magic Feature",
			]
				.forEach(str => this._PREREQUISITE_TRIE.add(str));
		}

		const toSplitRanges = [];
		for (let i = 0; i < entPrereqString.length; ++i) {
			const char = entPrereqString[i];
			if (char === " ") {
				continue;
			}

			const slice = entPrereqString.slice(i);
			const fromTrie = this._PREREQUISITE_TRIE.findLongestComplete(slice);
			if (!fromTrie) {
				continue;
			}

			toSplitRanges.push({start: i, end: i + fromTrie.length});
			i += fromTrie.length;
		}

		if (!toSplitRanges.length) return ConverterUtils.getTokens(entPrereqString);

		const out = [];

		let startPrev = 0;
		toSplitRanges
			.forEach(({start, end}) => {
				const prev = ConverterUtils.getTokens(entPrereqString.slice(startPrev, start));
				if (prev.length) out.push(...prev);
				startPrev = end;
				out.push(entPrereqString.slice(start, end));
			});

		const remaining = ConverterUtils.getTokens(entPrereqString.slice(startPrev));
		if (remaining.length) out.push(...remaining);

		return out;
	}

	/* -------------------------------------------- */

	static _doPostProcess_setAbility (entity, options) {
		const asiEntries = entity.entries.filter(it => (it.name || "").toLowerCase() === "ability score increase");
		if (!asiEntries.length) return false;

		if (asiEntries.length > 1) {
			options.cbWarning(`Multiple Ability Score Increase entries found!`);
			return false;
		}

		const [entry] = asiEntries;

		if (entry.entries.length !== 1 || typeof entry.entries[0] !== "string") {
			options.cbWarning(`Ability Score Increase requires manual conversion!`);
			return false;
		}

		const ent = entry.entries[0].trim();

		// "Your Strength score increases by 2."
		const mSimple = new RegExp(`^Your (?<ability>${Object.values(Parser.ATB_ABV_TO_FULL).join("|")}) score increases by (?<amount>\\d+)\\.?$`, "i").exec(ent)
			// "Increase your Charisma score by 1, to a maximum of 20."
			|| new RegExp(`^Increase your (?<ability>${Object.values(Parser.ATB_ABV_TO_FULL).join("|")}) score by (?<amount>\\d+)(?:, to a maximum of (?<max>20|30))?\\.?$`, "i").exec(ent);
		if (mSimple) {
			const asi = {
				[this._doRacePostProcess_ability_getAbilityName(mSimple.groups.ability)]: Number(mSimple.groups.amount),
			};
			if (mSimple.groups.max && mSimple.groups.max !== "20") asi.max = Number(mSimple.groups.max);
			entity.ability = [asi];
			entity.entries = entity.entries.filter(ent => ent !== entry);
			return true;
		}

		// "Your Wisdom and Charisma scores each increase by 1."
		const mSimpleTwoSameAmount = new RegExp(`^Your (?<ability1>${Object.values(Parser.ATB_ABV_TO_FULL).join("|")}) and (?<ability2>${Object.values(Parser.ATB_ABV_TO_FULL).join("|")}) scores each increase by (?<amount>\\d+)\\.?$`, "i").exec(ent);
		if (mSimpleTwoSameAmount) {
			entity.ability = [
				{
					[this._doRacePostProcess_ability_getAbilityName(mSimpleTwoSameAmount.groups.ability1)]: Number(mSimpleTwoSameAmount.groups.amount),
					[this._doRacePostProcess_ability_getAbilityName(mSimpleTwoSameAmount.groups.ability2)]: Number(mSimpleTwoSameAmount.groups.amount),
				},
			];
			entity.entries = entity.entries.filter(ent => ent !== entry);
			return true;
		}

		// "Your Dexterity score increases by 2, and your Charisma score increases by 1."
		const mSimpleTwo = new RegExp(`^Your (?<ability1>${Object.values(Parser.ATB_ABV_TO_FULL).join("|")}) score increases by (?<amount1>\\d+),? and your (?<ability2>${Object.values(Parser.ATB_ABV_TO_FULL).join("|")}) score increases by (?<amount2>\\d+)\\.?$`, "i").exec(ent);
		if (mSimpleTwo) {
			entity.ability = [
				{
					[this._doRacePostProcess_ability_getAbilityName(mSimpleTwo.groups.ability1)]: Number(mSimpleTwo.groups.amount1),
					[this._doRacePostProcess_ability_getAbilityName(mSimpleTwo.groups.ability2)]: Number(mSimpleTwo.groups.amount2),
				},
			];
			entity.entries = entity.entries.filter(ent => ent !== entry);
			return true;
		}

		// "Your Dexterity score increases by 2, but your Strength score decreases by 2."
		const mSimpleIncDec = new RegExp(`^Your (?<ability1>${Object.values(Parser.ATB_ABV_TO_FULL).join("|")}) score increases by (?<amount1>\\d+),? (?:and|but) your (?<ability2>${Object.values(Parser.ATB_ABV_TO_FULL).join("|")}) score decreases by (?<amount2>\\d+)\\.?$`, "i").exec(ent);
		if (mSimpleIncDec) {
			entity.ability = [
				{
					[this._doRacePostProcess_ability_getAbilityName(mSimpleIncDec.groups.ability1)]: Number(mSimpleIncDec.groups.amount1),
					[this._doRacePostProcess_ability_getAbilityName(mSimpleIncDec.groups.ability2)]: -Number(mSimpleIncDec.groups.amount2),
				},
			];
			entity.entries = entity.entries.filter(ent => ent !== entry);
			return true;
		}

		const mEitherSingle = new RegExp(`^Either your (?<ability1>${Object.values(Parser.ATB_ABV_TO_FULL).join("|")}) or (?<ability2>${Object.values(Parser.ATB_ABV_TO_FULL).join("|")}) score increases by (?<amount>\\d+)\\.?$`, "i").exec(ent)
			// "Increase your Strength or Dexterity score by 1, to a maximum of 20."
			|| new RegExp(`^Increase your (?<ability1>${Object.values(Parser.ATB_ABV_TO_FULL).join("|")}) or (?<ability2>${Object.values(Parser.ATB_ABV_TO_FULL).join("|")}) (?:score )?by (?<amount>\\d+)(?:, to a maximum of (?<max>20|30))?\\.?$`, "i").exec(ent);
		if (mEitherSingle) {
			const amount = Number(mEitherSingle.groups.amount);
			const asi = {
				"choose": {
					"from": [
						this._doRacePostProcess_ability_getAbilityName(mEitherSingle.groups.ability1),
						this._doRacePostProcess_ability_getAbilityName(mEitherSingle.groups.ability2),
					],
					...(amount === 1 ? {} : {amount}),
				},
			};
			if (mEitherSingle.groups.max !== "20") asi.max = Number(mEitherSingle.groups.max);
			entity.ability = [asi];
			entity.entries = entity.entries.filter(ent => ent !== entry);
			return true;
		}

		const mSimplePlusEitherSingle = new RegExp(`^Your (?<abilityS>${Object.values(Parser.ATB_ABV_TO_FULL).join("|")}) score increases by (?<amount1S>\\d+), and you can choose to increase either your (?<abilityC1>${Object.values(Parser.ATB_ABV_TO_FULL).join("|")}) or (?<abilityC2>${Object.values(Parser.ATB_ABV_TO_FULL).join("|")}) score by (?<amountC>\\d+)\\.?$`, "i").exec(ent);
		if (mSimplePlusEitherSingle) {
			const amountC = Number(mSimplePlusEitherSingle.groups.amountC);
			entity.ability = [
				{
					[this._doRacePostProcess_ability_getAbilityName(mSimplePlusEitherSingle.groups.abilityS)]: Number(mSimplePlusEitherSingle.groups.amount1S),
					"choose": {
						"from": [
							this._doRacePostProcess_ability_getAbilityName(mSimplePlusEitherSingle.groups.abilityC1),
							this._doRacePostProcess_ability_getAbilityName(mSimplePlusEitherSingle.groups.abilityC2),
						],
						...(amountC === 1 ? {} : {amount: amountC}),
					},
				},
			];
			entity.entries = entity.entries.filter(ent => ent !== entry);
			return true;
		}

		// "Your Strength, Constitution, and Wisdom scores each increase by 1. Then, increase one ability score of your choice by 1."
		const mThreePlusOne = new RegExp(`^Your (?<ability1>${Object.values(Parser.ATB_ABV_TO_FULL).join("|")}), (?<ability2>${Object.values(Parser.ATB_ABV_TO_FULL).join("|")}), and (?<ability3>${Object.values(Parser.ATB_ABV_TO_FULL).join("|")}) scores each increase by (?<amount1>\\d+)\\. Then, increase one ability score of your choice by (?<amount2>\\d+)\\.$`, "i").exec(ent);
		if (mThreePlusOne) {
			const abils = [
				this._doRacePostProcess_ability_getAbilityName(mThreePlusOne.groups.ability1),
				this._doRacePostProcess_ability_getAbilityName(mThreePlusOne.groups.ability2),
				this._doRacePostProcess_ability_getAbilityName(mThreePlusOne.groups.ability3),
			];
			const amount1 = Number(mThreePlusOne.groups.amount1);
			const amount2 = Number(mThreePlusOne.groups.amount2);
			entity.ability = [
				{
					"choose": {
						"weighted": {
							"weights": [
								amount1 + amount2,
								amount2,
								amount2,
							],
							"from": [...abils],
						},
					},
				},
				{
					[this._doRacePostProcess_ability_getAbilityName(mThreePlusOne.groups.ability1)]: amount1,
					[this._doRacePostProcess_ability_getAbilityName(mThreePlusOne.groups.ability2)]: amount1,
					[this._doRacePostProcess_ability_getAbilityName(mThreePlusOne.groups.ability3)]: amount1,
					"choose": {
						"from": Parser.ABIL_ABVS.filter(abv => !abils.includes(abv)),
						...(amount2 === 1 ? {} : {amount: amount2}),
					},
				},
			];

			entity.entries = entity.entries.filter(ent => ent !== entry);
			return true;
		}

		// "Increase one ability score of your choice by 1, to a maximum of 30."
		const mChooseOne = new RegExp(`^Increase one ability score of your choice by 1, to a maximum of (?<max>20|30)\\.?$`, "i").exec(ent);
		if (mChooseOne) {
			const asi = {
				"choose": {
					"from": [...Parser.ABIL_ABVS],
				},
			};
			if (mChooseOne.groups.max !== "20") asi.max = Number(mChooseOne.groups.max);
			entity.ability = [asi];
			entity.entries = entity.entries.filter(ent => ent !== entry);
			return true;
		}

		// "Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 30."
		const mChooseOneFrom = new RegExp(`^Increase your ${Object.entries(Parser.ATB_ABV_TO_FULL).map(([abv, full]) => `(?:or )?(?<${abv}>${full})?(?:, )?`).join("")} score by 1, to a maximum of (?<max>20|30)\\.?$`, "i").exec(ent);
		if (mChooseOneFrom) {
			const asi = {
				"choose": {
					"from": Parser.ABIL_ABVS.filter(abv => mChooseOneFrom.groups[abv]),
				},
			};
			if (mChooseOneFrom.groups.max !== "20") asi.max = Number(mChooseOneFrom.groups.max);
			entity.ability = [asi];
			entity.entries = entity.entries.filter(ent => ent !== entry);
			return true;
		}

		const mChooseTwoOne = new RegExp(`^You may choose one score to increase by 2 and a different score to increase by 1\\.?$`, "i").exec(ent);
		if (mChooseTwoOne) {
			entity.ability = [
				{
					"choose": {
						"weighted": {
							"from": [...Parser.ABIL_ABVS],
							"weights": [
								2,
								1,
							],
						},
					},
				},
			];
			entity.entries = entity.entries.filter(ent => ent !== entry);
			return true;
		}

		options.cbWarning(`Ability Score Increase "${ent}" requires manual conversion!`);
		return false;
	}

	static _doRacePostProcess_ability_getAbilityName (str) {
		return str.toLowerCase().slice(0, 3);
	}
}
