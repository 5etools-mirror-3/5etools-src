import {ConverterConst} from "./converterutils-const.js";
import {SITE_STYLE__CLASSIC} from "../consts.js";

class DamageTagger {
	static _addDamageTypeToSet (set, str, options) {
		str = str.toLowerCase().trim();
		if (str === "less" || str === "more") return;
		if (str === "all" || str === "one" || str === "a") Parser.DMG_TYPES.forEach(it => set.add(it));
		else if (Parser.DMG_TYPES.includes(str)) set.add(str);
		else options.cbWarning(`Unknown damage type "${str}"`);
	}
}

export class DamageInflictTagger extends DamageTagger {
	static tryRun (sp, options) {
		const tags = new Set();

		MiscUtil.getWalker({isNoModification: true, keyBlocklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLOCKLIST}).walk([sp.entries, sp.entriesHigherLevel], {
			string: str => {
				str.replace(/(?:{@damage [^}]+}|\d+) (\w+)((?:, \w+)*)(,? or \w+)? damage/ig, (...m) => {
					if (m[1]) this._addDamageTypeToSet(tags, m[1], options);
					if (m[2]) m[2].split(",").map(it => it.trim()).filter(Boolean).forEach(str => this._addDamageTypeToSet(tags, str, options));
					if (m[3]) this._addDamageTypeToSet(tags, m[3].split(" ").last(), options);
				});
			},
		});

		if (!tags.size) return;
		sp.damageInflict = [...tags].sort(SortUtil.ascSort);
	}
}

class DamageResVulnImmuneTagger extends DamageTagger {
	static get _RE () {
		return (this.__RE ||= new RegExp(`${this._TYPE} to (?<ptBase>\\w+)(?<ptList>(?:, \\w+)*)(?<ptConj>,? (?:or|and) \\w+)? damage`, "gi"));
	}

	static tryRun (sp, options) {
		const tags = new Set();

		MiscUtil.getWalker({isNoModification: true, keyBlocklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLOCKLIST}).walk([sp.entries, sp.entriesHigherLevel], {
			string: str => {
				Renderer.stripTags(str).replace(this._RE, (...m) => {
					const {ptBase, ptList, ptConj} = m.last();
					if (ptBase) this._addDamageTypeToSet(tags, ptBase, options);
					if (ptList) ptList.split(",").map(it => it.trim()).filter(Boolean).forEach(str => this._addDamageTypeToSet(tags, str, options));
					if (ptConj) this._addDamageTypeToSet(tags, ptConj.split(" ").last(), options);
				});
			},
		});

		if (!tags.size) return;
		sp[this._PROP] = [...tags].sort(SortUtil.ascSort);
	}
}

export class DamageResTagger extends DamageResVulnImmuneTagger {
	static _TYPE = "resistance";
	static _PROP = "damageResist";
}

export class DamageVulnTagger extends DamageResVulnImmuneTagger {
	static _TYPE = "vulnerability";
	static _PROP = "damageVulnerable";
}

export class DamageImmuneTagger extends DamageResVulnImmuneTagger {
	static _TYPE = "immunity";
	static _PROP = "damageImmune";
}

export class SavingThrowTagger {
	static tryRun (sp, options) {
		sp.savingThrow = [];
		JSON.stringify([sp.entries, sp.entriesHigherLevel]).replace(/(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) saving throw/ig, (...m) => sp.savingThrow.push(m[1].toLowerCase()));
		if (!sp.savingThrow.length) delete sp.savingThrow;
		else sp.savingThrow = [...new Set(sp.savingThrow)].sort(SortUtil.ascSort);
	}
}

export class AbilityCheckTagger {
	static tryRun (sp, options) {
		sp.abilityCheck = [];
		JSON.stringify([sp.entries, sp.entriesHigherLevel]).replace(/a (Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) check/ig, (...m) => sp.abilityCheck.push(m[1].toLowerCase()));
		if (!sp.abilityCheck.length) delete sp.abilityCheck;
		else sp.abilityCheck = [...new Set(sp.abilityCheck)].sort(SortUtil.ascSort);
	}
}

export class SpellAttackTagger {
	static tryRun (sp, options) {
		sp.spellAttack = [];
		JSON.stringify([sp.entries, sp.entriesHigherLevel]).replace(/make (?:a|up to [^ ]+) (ranged|melee) spell attack/ig, (...m) => sp.spellAttack.push(m[1][0].toUpperCase()));
		if (!sp.spellAttack.length) delete sp.spellAttack;
		else sp.spellAttack = [...new Set(sp.spellAttack)].sort(SortUtil.ascSort);
	}
}

// TODO areaTags

export class MiscTagsTagger {
	static _addTag ({tags, tag, options}) {
		if (options?.allowlistTags && !options?.allowlistTags.has(tag)) return;
		tags.add(tag);
	}

	static _mutTags_SGT ({tags, str, stripped, options}) {
		if (/you can see/ig.test(stripped)) this._addTag({tags, tag: "SGT", options});
	}

	static tryRun (sp, options) {
		const tags = new Set(sp.miscTags || []);

		MiscTagsTagger._WALKER = MiscTagsTagger._WALKER || MiscUtil.getWalker({isNoModification: true, keyBlocklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLOCKLIST});
		MiscTagsTagger._WALKER.walk(
			[sp.entries, sp.entriesHigherLevel],
			{
				string: (str) => {
					const stripped = Renderer.stripTags(str);

					if (/becomes permanent/ig.test(stripped)) this._addTag({tags, tag: "PRM", options});
					if (/when you reach/ig.test(stripped)) this._addTag({tags, tag: "SCL", options});
					if ((/regain|restore/ig.test(stripped) && /hit point/ig.test(stripped)) || /heal/ig.test(stripped)) this._addTag({tags, tag: "HL", options});
					if (/temporary hit points/ig.test(stripped)) this._addTag({tags, tag: "THP", options});
					if (/you summon/ig.test(stripped) || /creature shares your initiative count/ig.test(stripped)) this._addTag({tags, tag: "SMN", options});
					this._mutTags_SGT({tags, str, stripped, options});
					if (/you (?:can then )?teleport/i.test(stripped) || /instantly (?:transports you|teleport)/i.test(stripped) || /enters(?:[^.]+)portal instantly/i.test(stripped) || /entering the portal exits from the other portal/i.test(stripped)) this._addTag({tags, tag: "TP", options});

					if ((stripped.includes("bonus") || stripped.includes("penalty")) && stripped.includes("AC")) this._addTag({tags, tag: "MAC", options});
					if (/target's (?:base )?AC becomes/.exec(stripped)) this._addTag({tags, tag: "MAC", options});
					if (/target's AC can't be less than/.exec(stripped)) this._addTag({tags, tag: "MAC", options});

					if (/(?:^|\W)(?:pull(?:|ed|s)|push(?:|ed|s)) [^.!?:]*\d+\s+(?:ft|feet|foot|mile|square)/ig.test(stripped)) this._addTag({tags, tag: "FMV", options});

					if (/rolls? (?:a )?{@dice [^}]+} and consults? the table/.test(str)) this._addTag({tags, tag: "RO", options});

					if ((/\bbright light\b/i.test(stripped) || /\bdim light\b/i.test(stripped)) && /\b\d+[- ]foot(?:[- ]radius| emanation)\b/i.test(stripped)) {
						if (/\bsunlight\b/.test(stripped)) this._addTag({tags, tag: "LGTS", options});
						else this._addTag({tags, tag: "LGT", options});
					}

					if (/\bbonus action\b/i.test(stripped)) this._addTag({tags, tag: "UBA", options});

					if (
						/\b(?:lightly|heavily) obscured\b/i.test(stripped)
						|| /\bmagical darkness spreads\b/i.test(stripped)
						|| /\bdarkness fills the area\b/i.test(stripped)
						|| /\bno light(?:[^.]+)can illuminate the area\b/i.test(stripped)
					) this._addTag({tags, tag: "OBS", options});

					if (/\b(?:is|creates an area of|becomes?|into) difficult terrain\b/i.test(Renderer.stripTags(stripped)) || /spends? \d+ (?:feet|foot) of movement for every 1 foot/.test(stripped)) this._addTag({tags, tag: "DFT", options});

					if (
						/\battacks? deals? an extra\b[^.!?]+\bdamage\b/.test(stripped)
						|| /\bdeals? an extra\b[^.!?]+\bdamage\b[^.!?]+\b(?:weapon attack|when it hits)\b/.test(stripped)
						|| /weapon attacks?\b[^.!?]+\b(?:takes an extra|deal an extra)\b[^.!?]+\bdamage/.test(stripped)
					) this._addTag({tags, tag: "AAD", options});

					if (
						/\b(?:any|one|a) creatures? or objects?\b/i.test(stripped)
						|| /\b(?:flammable|nonmagical|metal|unsecured) objects?\b/.test(stripped)
						|| /\bobjects?\b[^.!?]+\b(?:created by magic|(?:that )?you touch|that is neither held nor carried)\b/.test(stripped)
						|| /\bobject\b[^.!?]+\bthat isn't being worn or carried\b/.test(stripped)
						|| /\bobjects? (?:of your choice|that is familiar to you|of (?:Tiny|Small|Medium|Large|Huge|Gargantuan) size)\b/.test(stripped)
						|| /\b(?:Tiny|Small|Medium|Large|Huge|Gargantuan) or smaller object\b/.test(stripped)
						|| /\baffected by this spell, the object is\b/.test(stripped)
						|| /\ball creatures and objects\b/i.test(stripped)
						|| /\ba(?:ny|n)? (?:(?:willing|visible|affected) )?(?:creature|place) or an object\b/i.test(stripped)
						|| /\bone creature, object, or magical effect\b/i.test(stripped)
						|| /\ba person, place, or object\b/i.test(stripped)
						|| /\b(choose|touch|manipulate|soil) (an|one) object\b/i.test(stripped)
					) this._addTag({tags, tag: "OBJ", options});

					if (
						/\b(?:and(?: it)?|each target|the( [a-z]+)+) (?:also )?(?:has|gains) advantage\b/i.test(stripped)
						|| /\bcreature in the area (?:[^.!?]+ )?has advantage\b/i.test(stripped)
						|| /\broll(?:made )? against (?:an affected creature|this target) (?:[^.!?]+ )?has advantage\b/i.test(stripped)
						|| /\bother creatures? have advantage on(?:[^.!?]+ )? rolls\b/i.test(stripped)
						|| /\byou (?:have|gain|(?:can )?give yourself) advantage\b/i.test(stripped)
						|| /\b(?:has|have) advantage on (?:Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma|all)\b/i.test(stripped)
						|| /\bmakes? (?:all )?(?:Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) saving throws with advantage\b/i.test(stripped)
					) this._addTag({tags, tag: "ADV", options});
				},
				object: (obj) => {
					if (obj.type !== "table") return;

					const rollMode = Renderer.table.getAutoConvertedRollMode(obj);
					if (rollMode !== RollerUtil.ROLL_COL_NONE) this._addTag({tags, tag: "RO", options});
				},
			},
		);

		MiscTagsTagger._WALKER.walk(
			sp.entriesHigherLevel,
			{
				string: (str) => {
					const stripped = Renderer.stripTags(str);

					if (
						new RegExp(`you can (?:target|affect) [^.]+ additional (?:creature|${Parser.MON_TYPES.join("|")}) for each spell slot level`, "ig").test(stripped)
						|| new RegExp(`you can (?:target|affect) [^.]+ additional [^.]*(?:creature|${Parser.MON_TYPES.join("|")}) for each slot level above`, "ig").test(stripped)
					) this._addTag({tags, tag: "SCT", options});
				},
			},
		);

		(sp.time || [])
			.forEach(time => {
				if (!time.condition) return;
				this._mutTags_SGT({tags, str: time.condition, stripped: Renderer.stripTags(time.condition), options});
			});

		sp.miscTags = [...tags].sort(SortUtil.ascSortLower);
		if (!sp.miscTags.length) delete sp.miscTags;
	}
}
MiscTagsTagger._WALKER = null;

export class ScalingLevelDiceTagger {
	static _WALKER_BOR = MiscUtil.getWalker({keyBlocklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLOCKLIST, isNoModification: true, isBreakOnReturn: true});

	static _isParseFirstSecondLineRolls ({sp}) {
		// Two "flat" paragraphs; first is spell text, second is cantrip scaling text
		if (!sp.entriesHigherLevel) return sp.entries.length === 2 && sp.entries.filter(it => typeof it === "string").length === 2;

		// One paragraph of spell text; one e.g. "Cantrip Upgrade" header with one paragraph of cantrip scaling text
		return sp.entries.length === 1
			&& typeof sp.entries[0] === "string"
			&& sp.entriesHigherLevel.length === 1
			&& sp.entriesHigherLevel[0].type === "entries"
			&& sp.entriesHigherLevel[0].entries?.length === 1
			&& typeof sp.entriesHigherLevel[0].entries[0] === "string";
	}

	static _getRollsFirstSecondLine ({firstLine, secondLine}) {
		const rollsFirstLine = [];
		const rollsSecondLine = [];

		firstLine.replace(/{@(?:damage|dice) ([^}]+)}/g, (...m) => {
			rollsFirstLine.push(m[1].split("|")[0]);
		});

		secondLine.replace(/\({@(?:damage|dice) ([^}]+)}\)/g, (...m) => {
			rollsSecondLine.push(m[1].split("|")[0]);
		});

		return {rollsFirstLine, rollsSecondLine};
	}

	static _getLabel ({sp, options}) {
		let label;

		const reDamageType = options.styleHint === SITE_STYLE__CLASSIC
			? new RegExp(`\\b${ConverterConst.STR_RE_DAMAGE_TYPE}\\b`, "i")
			: new RegExp(`\\b${ConverterConst.STR_RE_DAMAGE_TYPE}\\b`);

		const handlers = {
			string: str => {
				const mDamageType = reDamageType.exec(str);
				if (mDamageType) {
					label = `${mDamageType[1]} damage`;
					return true;
				}
			},
		};

		if (sp.entriesHigherLevel) {
			this._WALKER_BOR.walk(sp.entriesHigherLevel, handlers);
			if (label) return label;
		}

		this._WALKER_BOR.walk(sp.entries, handlers);
		if (label) return label;

		options.cbWarning(`${sp.name ? `(${sp.name}) ` : ""}Could not create scalingLevelDice label!`);
		return "NO_LABEL";
	}

	static tryRun (sp, options) {
		if (sp.level !== 0) return;

		// Prefer `entriesHigherLevel`, as we may have e.g. a `"Cantrip Upgrade"` header
		const strEntries = JSON.stringify(sp.entriesHigherLevel || sp.entries);

		const rolls = [];
		strEntries.replace(/{@(?:damage|dice) ([^}]+)}/g, (...m) => {
			rolls.push(m[1].split("|")[0]);
		});

		if ((rolls.length === 4 && strEntries.includes("one die")) || rolls.length === 5) {
			if (rolls.length === 5 && rolls[0] !== rolls[1]) options.cbWarning(`${sp.name ? `(${sp.name}) ` : ""}scalingLevelDice rolls may require manual checking\u2014mismatched roll number of rolls!`);

			sp.scalingLevelDice = {
				label: this._getLabel({sp, options}),
				scaling: rolls.length === 4
					? {
						1: rolls[0],
						5: rolls[1],
						11: rolls[2],
						17: rolls[3],
					} : {
						1: rolls[0],
						5: rolls[2],
						11: rolls[3],
						17: rolls[4],
					},
			};

			return;
		}

		if (this._isParseFirstSecondLineRolls({sp})) {
			const {rollsFirstLine, rollsSecondLine} = this._getRollsFirstSecondLine({
				firstLine: sp.entries[0],
				secondLine: sp.entriesHigherLevel
					? sp.entriesHigherLevel[0].entries[0]
					: sp.entries[1],
			});

			if (rollsFirstLine.length >= 1 && rollsSecondLine.length >= 3) {
				if (rollsFirstLine.length > 1 || rollsSecondLine.length > 3) {
					options.cbWarning(`${sp.name ? `(${sp.name}) ` : ""}scalingLevelDice rolls may require manual checking\u2014too many dice parts!`);
				}

				const label = this._getLabel({sp, options});
				sp.scalingLevelDice = {
					label: label,
					scaling: {
						1: rollsFirstLine[0],
						5: rollsSecondLine[0],
						11: rollsSecondLine[1],
						17: rollsSecondLine[2],
					},
				};
			}
		}
	}
}

export class AffectedCreatureTypeTagger {
	static tryRun (sp, options) {
		const setAffected = new Set();
		const setNotAffected = new Set();

		const walker = MiscUtil.getWalker({isNoModification: true});

		walker.walk(
			sp.entries,
			{
				string: (str) => {
					str = Renderer.stripTags(str);

					const sens = str.split(/[.!?]/g);
					sens.forEach(sen => {
						// region Not affected
						sen
							// Blight :: PHB
							.replace(/This spell has no effect on (.+)/g, (...m) => {
								m[1].replace(AffectedCreatureTypeTagger._RE_TYPES, (...n) => this._doAddType({set: setNotAffected, type: n[1]}));
							})
							// Command :: PHB
							.replace(/The spell has no effect if the target is (.*)/g, (...m) => {
								m[1].replace(AffectedCreatureTypeTagger._RE_TYPES, (...n) => this._doAddType({set: setNotAffected, type: n[1]}));
							})
							// Raise Dead :: PHB
							.replace(/The spell can't return an (.*?) creature/g, (...m) => {
								m[1].replace(AffectedCreatureTypeTagger._RE_TYPES, (...n) => this._doAddType({set: setNotAffected, type: n[1]}));
							})
							// Shapechange :: PHB
							.replace(/The creature can't be (.*)/g, (...m) => {
								m[1].replace(AffectedCreatureTypeTagger._RE_TYPES, (...n) => this._doAddType({set: setNotAffected, type: n[1]}));
							})
							// Sleep :: PHB
							.replace(/(.*?) aren't affected by this spell/g, (...m) => {
								m[1].replace(AffectedCreatureTypeTagger._RE_TYPES, (...n) => this._doAddType({set: setNotAffected, type: n[1]}));
							})
							// Speak with Dead :: PHB
							.replace(/The corpse\b.*?\bcan't be (.*)/g, (...m) => {
								m[1].replace(AffectedCreatureTypeTagger._RE_TYPES, (...n) => this._doAddType({set: setNotAffected, type: n[1]}));
							})

							// Cause Fear :: XGE
							.replace(/A (.*?) is immune to this effect/g, (...m) => {
								m[1].replace(AffectedCreatureTypeTagger._RE_TYPES, (...n) => this._doAddType({set: setNotAffected, type: n[1]}));
							})
							// Healing Spirit :: XGE
							.replace(/can't heal (.*)/g, (...m) => {
								m[1].replace(AffectedCreatureTypeTagger._RE_TYPES, (...n) => this._doAddType({set: setNotAffected, type: n[1]}));
							})
						;
						// endregion

						// region Affected
						sen
							// Awaken :: PHB
							.replace(/you touch a [^ ]+ or (?:smaller|larger) (.+)/g, (...m) => {
								m[1].replace(AffectedCreatureTypeTagger._RE_TYPES, (...n) => this._doAddType({set: setAffected, type: n[1]}));
							})
							// Calm Emotions :: PHB
							.replace(/Each (.+) in a \d+-foot/g, (...m) => {
								m[1].replace(AffectedCreatureTypeTagger._RE_TYPES, (...n) => this._doAddType({set: setAffected, type: n[1]}));
							})
							// Charm Person :: PHB
							.replace(/One (.*?) of your choice/g, (...m) => {
								m[1].replace(AffectedCreatureTypeTagger._RE_TYPES, (...n) => this._doAddType({set: setAffected, type: n[1]}));
							})
							// Crown of Madness :: PHB
							.replace(/You attempt to .* a (.+) you can see/g, (...m) => {
								m[1].replace(AffectedCreatureTypeTagger._RE_TYPES, (...n) => this._doAddType({set: setAffected, type: n[1]}));
							})
							// Detect Evil and Good :: PHB
							.replace(/you know if there is an? (.*)/g, (...m) => {
								m[1].replace(AffectedCreatureTypeTagger._RE_TYPES, (...n) => this._doAddType({set: setAffected, type: n[1]}));
							})
							// Dispel Evil and Good :: PHB
							.replace(/For the duration, (.*?) have disadvantage/g, (...m) => {
								m[1].replace(AffectedCreatureTypeTagger._RE_TYPES, (...n) => this._doAddType({set: setAffected, type: n[1]}));
							})
							// Hold Person :: PHB
							.replace(/Choose (.+)/g, (...m) => {
								m[1].replace(AffectedCreatureTypeTagger._RE_TYPES, (...n) => this._doAddType({set: setAffected, type: n[1]}));
							})
							// Locate Animals or Plants :: PHB
							.replace(/name a specific kind of (.*)/g, (...m) => {
								m[1].replace(AffectedCreatureTypeTagger._RE_TYPES, (...n) => this._doAddType({set: setAffected, type: n[1]}));
							})
							// Magic Jar :: PHB
							.replace(/You can attempt to possess any (.*?) that you can see/g, (...m) => {
								m[1].replace(AffectedCreatureTypeTagger._RE_TYPES, (...n) => this._doAddType({set: setAffected, type: n[1]}));
							})
							// Planar Binding :: PHB
							.replace(/you attempt to bind a (.*)/g, (...m) => {
								m[1].replace(AffectedCreatureTypeTagger._RE_TYPES, (...n) => this._doAddType({set: setAffected, type: n[1]}));
							})
							// Protection from Evil and Good :: PHB
							.replace(/types of creatures: (.*)/g, (...m) => {
								m[1].replace(AffectedCreatureTypeTagger._RE_TYPES, (...n) => this._doAddType({set: setAffected, type: n[1]}));
							})
							// Reincarnate :: PHB
							.replace(/You touch a dead (.*)/g, (...m) => {
								m[1].replace(AffectedCreatureTypeTagger._RE_TYPES, (...n) => this._doAddType({set: setAffected, type: n[1]}));
							})
							// Simulacrum :: PHB
							.replace(/You shape an illusory duplicate of one (.*)/g, (...m) => {
								m[1].replace(AffectedCreatureTypeTagger._RE_TYPES, (...n) => this._doAddType({set: setAffected, type: n[1]}));
							})
							// Speak with Animals :: PHB
							.replace(/communicate with (.*?) for the duration/g, (...m) => {
								m[1].replace(AffectedCreatureTypeTagger._RE_TYPES, (...n) => this._doAddType({set: setAffected, type: n[1]}));
							})

							// Fast Friends :: AI
							.replace(/choose one (.*?) within range/g, (...m) => {
								m[1].replace(AffectedCreatureTypeTagger._RE_TYPES, (...n) => this._doAddType({set: setAffected, type: n[1]}));
							})

							// Beast Bond :: XGE
							.replace(/telepathic link with one (.*?) you touch/g, (...m) => {
								m[1].replace(AffectedCreatureTypeTagger._RE_TYPES, (...n) => this._doAddType({set: setAffected, type: n[1]}));
							})
							// Ceremony :: XGE
							.replace(/You touch one (.*?) who/g, (...m) => {
								m[1].replace(AffectedCreatureTypeTagger._RE_TYPES, (...n) => this._doAddType({set: setAffected, type: n[1]}));
							})
							// Soul Cage :: XGE
							.replace(/\bsoul of (.*?) as it dies/g, (...m) => {
								m[1].replace(AffectedCreatureTypeTagger._RE_TYPES, (...n) => this._doAddType({set: setAffected, type: n[1]}));
							})
						;
						// endregion
					});
				},
			},
		);

		if (!setAffected.size && !setNotAffected.size) return;

		const setAffectedOut = new Set([
			...(sp.affectsCreatureType || []),
			...setAffected,
		]);
		if (!setAffectedOut.size) Parser.MON_TYPES.forEach(it => setAffectedOut.add(it));

		sp.affectsCreatureType = [...setAffectedOut.difference(setNotAffected)].sort(SortUtil.ascSortLower);
		if (!sp.affectsCreatureType.length) delete sp.affectsCreatureType;
	}

	static _doAddType ({set, type}) {
		type = Parser._parse_bToA(Parser.MON_TYPE_TO_PLURAL, type, type);
		set.add(type);
		return "";
	}
}
AffectedCreatureTypeTagger._RE_TYPES = new RegExp(`\\b(${[...Parser.MON_TYPES, ...Object.values(Parser.MON_TYPE_TO_PLURAL)].map(it => it.escapeRegexp()).join("|")})\\b`, "gi");
