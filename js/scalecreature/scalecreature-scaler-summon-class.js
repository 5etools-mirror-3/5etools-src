import {ScaleSummonedCreature} from "./scalecreature-scaler-summon-base.js";

export class ScaleClassSummonedCreature extends ScaleSummonedCreature {
	static async scale (mon, toClassLevel) {
		mon = MiscUtil.copyFast(mon);

		if ((!mon.summonedByClass && !mon.summonedScaleByPlayerLevel) || toClassLevel < 1) return mon;

		ScaleClassSummonedCreature._WALKER = ScaleClassSummonedCreature._WALKER || MiscUtil.getWalker({keyBlocklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLOCKLIST});

		const className = mon.summonedByClass ? mon.summonedByClass.split("|")[0].toTitleCase() : null;
		const state = new ScaleClassSummonedCreature._State({
			className,
			proficiencyBonus: Parser.levelToPb(toClassLevel),
		});

		mon._displayName = `${mon.name} (Level ${toClassLevel}${className ? ` ${className}` : ""})`;

		this._scale_ac(mon, toClassLevel, state);
		this._scale_hp(mon, toClassLevel, state);

		this._scale_saves(mon, toClassLevel, state);
		this._scale_skills(mon, toClassLevel, state);

		this._scale_pbNote(mon, toClassLevel, state);

		this._scale_traits(mon, toClassLevel, state);
		this._scale_actions(mon, toClassLevel, state);
		this._scale_bonusActions(mon, toClassLevel, state);
		this._scale_reactions(mon, toClassLevel, state);

		mon._summonedByClass_level = toClassLevel;
		mon._scaledClassSummonLevel = toClassLevel;
		mon._isScaledClassSummon = true;

		return mon;
	}

	static _scale_ac (mon, toClassLevel, state) {
		if (!mon.ac) return;

		mon.ac = mon.ac.map(it => {
			if (!it.special) return it;

			it.special = it.special
				// "13 + PB (natural armor)"
				// "13 plus PB (natural armor)"
				.replace(/(\d+)\s*(\+|plus)\s*PB\b/g, (...m) => Number(m[1]) + state.proficiencyBonus)
			;

			this._mutSimpleSpecialAcItem(it);

			return it;
		});
	}

	static _scale_getConvertedPbString (state, str, {isBonus = false} = {}) {
		let out = str
			.replace(/\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/gi, (...m) => Parser.textToNumber(m[0]))
			.replace(/\bplus\b/gi, "+")
			.replace(/\btimes\b/, "*")
			.replace(/\b×\b/, "*")
			.replace(/(\b|[-+/*])PB\b/g, `$1${state.proficiencyBonus}`)
			.replace(/\bPB(d\d+)/g, `${state.proficiencyBonus}$1`)
			// eslint-disable-next-line no-eval
			.replace(/\b\d+\s*[/*]\s*\d+\b/g, (...n) => eval(n[0]))
			// eslint-disable-next-line no-eval
			.replace(/[-+]\s*\d+\s*[-+]\s*\d+\b/g, (...n) => eval(n[0]))
		;

		const reDice = /(\b(?:\d+)?d\d+\b)/g;
		let ix = 0;
		const outSimplified = out.split(reDice)
			.map(pt => {
				// Don't increase index for empty strings
				if (!pt.trim()) return pt;

				if (reDice.test(pt)) {
					ix++;
					return pt;
				}

				const simplified = Renderer.dice.parseRandomise2(pt);
				if (simplified != null) {
					if (ix) {
						ix++;
						return UiUtil.intToBonus(simplified);
					}
					ix++;
					return simplified;
				}

				ix++;
				return pt;
			})
			.join("")
			.replace(/\s*[-+]\s*/g, (...m) => ` ${m[0].trim()} `);

		if (!isNaN(outSimplified) && isBonus) return UiUtil.intToBonus(outSimplified);
		return outSimplified;
	}

	static _scale_savesSkills (mon, toClassLevel, state, prop) {
		mon[prop] = Object.entries(mon[prop])
			.mergeMap(([k, v]) => {
				if (typeof v !== "string") return {[k]: v};
				return {[k]: this._scale_getConvertedPbString(state, v, {isBonus: true})};
			});
	}

	static _scale_saves (mon, toClassLevel, state) {
		if (!mon.save) return;
		this._scale_savesSkills(mon, toClassLevel, state, "save");
	}

	static _scale_skills (mon, toClassLevel, state) {
		if (mon.passive != null) mon.passive = this._scale_getConvertedPbString(state, `${mon.passive}`);

		if (!mon.skill) return;
		this._scale_savesSkills(mon, toClassLevel, state, "skill");
	}

	static _scale_hp (mon, toClassLevel, state) {
		if (!mon.hp?.special) return;

		let {ptBase, ptHd, ptYourAbilMod} = this._getHpParts(mon.hp.special);

		ptBase = ptBase
			// "5 + five times your ranger level"
			// "5 plus five times your Ranger level"
			.replace(/(?<base>\d+)\s*(?:\+|plus)\s*(?<perLevel>\d+|[a-z]+) times your (?:(?<className>[^(]*) )?level/g, (...m) => {
				const numTimes = isNaN(m.last().perLevel) ? Parser.textToNumber(m.last().perLevel) : Number(m.last().perLevel);
				return `${Number(m.last().base) + (numTimes * toClassLevel)}`;
			})
			// "1 + <...> + your artificer level"
			.replace(/(?<base>\d+)\s*\+\s*your (?:(?<className>[^(]*) )?level/g, (...m) => {
				return `${Number(m.last().base) + toClassLevel}`;
			})
			// "equal the beast's Constitution modifier + five times your ranger level"
			.replace(/equal .*? Constitution modifier\s*\+\s*(?<perLevel>\d+|[a-z]+) times your (?:(?<className>[^(]*) )?level/g, (...m) => {
				const numTimes = isNaN(m.last().perLevel) ? Parser.textToNumber(m.last().perLevel) : Number(m.last().perLevel);
				return `${Parser.getAbilityModNumber(mon.con) + (numTimes * toClassLevel)}`;
			})
			// "Eight times their level"
			.replace(/\btheir level\b/gi, toClassLevel)
			// "7 + seven times caregiver's level"
			.replace(/\bcaregiver's level\b/gi, toClassLevel)
		;

		ptBase = this._scale_getConvertedPbString(state, ptBase);

		if (ptHd) {
			ptHd = ptHd
				// "the beast has a number of Hit Dice [d8s] equal to your ranger level"
				.replace(/(?<intro>.*) a number of hit dice \[d(?<hdSides>\d+)s?] equal to (?:your (?:(?<className>[^(]*) )?|their caregiver's |their )level/i, (...m) => {
					const {intro, hdSides, className} = m.at(-1);

					const hdFormula = `${toClassLevel}d${hdSides}`;
					if (!ptYourAbilMod) return hdFormula;

					return `${intro} {@dice ${hdFormula}} Hit Dice`;
				})
				// "(number of d8 Hit Dice equal to their caregiver's level)"
				.replace(/number of d(?<hdSides>\d+)s? hit dice equal to (?:your (?:(?<className>[^(]*) )?|their caregiver's |their )level/i, (...m) => {
					const {hdSides, className} = m.at(-1);

					const hdFormula = `${toClassLevel}d${hdSides}`;
					if (!ptYourAbilMod) return hdFormula;

					return `{@dice ${hdFormula}} Hit Dice`;
				})
			;
		}

		mon.hp.special = this._getAssembledHpParts({ptBase, ptHd, ptYourAbilMod});

		this._mutSimpleSpecialHp(mon);
	}

	static _scale_genericEntries (mon, toClassLevel, state, prop) {
		if (!mon[prop]) return;
		mon[prop] = ScaleClassSummonedCreature._WALKER.walk(
			mon[prop],
			{
				string: (str) => {
					str = str
						// "add your proficiency bonus"
						.replace(/add your proficiency bonus/gi, (...m) => {
							return `${m[0]} (${UiUtil.intToBonus(state.proficiencyBonus)})`;
						})
						// Merge " plus PB" into DC/dice tags, where simple
						.replace(/{@(?<tag>dice|damage|hit|d20|dc) (?<text>[^}]+)}(?<suffix> plus PB\b)/g, (...m) => {
							const {tag, text, suffix} = m.last();
							const [, ...ptsRest] = text.split("|");
							if (ptsRest.length) return m[0];

							return `{@${tag} ${text} ${suffix}}`;
						})
						// "{@damage 1d8 + 2 + PB}"
						.replace(/{@(?<tag>dice|damage|hit|d20|dc) (?<text>[^}]+)}/g, (...m) => {
							const {tag, text} = m.last();
							const [ptNumber, ...ptsRest] = text.split("|");

							const ptNumberOut = this._scale_getConvertedPbString(state, ptNumber);

							return `{@${tag} ${[ptNumberOut, ...ptsRest].join("|")}}`;
						})
						.replace(/(?<factor>\d+)\s*[×*]\s*PB\b/g, (...m) => {
							const {factor} = m.at(-1);
							return `${factor * state.proficiencyBonus}`;
						})
						.replace(/\bPB\s*[×*]\s*(?<factor>\d+)/g, (...m) => {
							const {factor} = m.at(-1);
							return `${factor * state.proficiencyBonus}`;
						})
						.replace(/\b(?<ptOp>\+\s*)?PB\b/g, (...m) => {
							const {ptOp} = m.at(-1);
							return `${(ptOp || "").trim()}${state.proficiencyBonus}`;
						})
					;

					return str;
				},
			},
		);
	}

	static _scale_traits (mon, toClassLevel, state) { this._scale_genericEntries(mon, toClassLevel, state, "trait"); }
	static _scale_actions (mon, toClassLevel, state) { this._scale_genericEntries(mon, toClassLevel, state, "action"); }
	static _scale_bonusActions (mon, toClassLevel, state) { this._scale_genericEntries(mon, toClassLevel, state, "bonus"); }
	static _scale_reactions (mon, toClassLevel, state) { this._scale_genericEntries(mon, toClassLevel, state, "reaction"); }

	static _scale_pbNote (mon, toClassLevel, state) {
		if (!mon.pbNote) return;

		mon.pbNote = mon.pbNote
			.replace(/equals (?:your|the mentor's|the caregiver's) (?:Proficiency )?bonus\b/i, (...m) => `${m[0]} [${UiUtil.intToBonus(state.proficiencyBonus, {isPretty: true})}]`);
	}

	static _State = class {
		constructor ({className, proficiencyBonus}) {
			this.className = className;
			this.proficiencyBonus = proficiencyBonus;
		}
	};

	static _WALKER = null;
}
