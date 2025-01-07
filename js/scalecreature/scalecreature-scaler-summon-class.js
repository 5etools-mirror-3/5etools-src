import {ScaleSummonedCreature} from "./scalecreature-scaler-summon-base.js";

export class ScaleClassSummonedCreature extends ScaleSummonedCreature {
	static async scale (mon, toClassLevel) {
		mon = MiscUtil.copyFast(mon);

		if (!mon.summonedByClass || toClassLevel < 1) return mon;

		ScaleClassSummonedCreature._WALKER = ScaleClassSummonedCreature._WALKER || MiscUtil.getWalker({keyBlocklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLOCKLIST});

		const className = mon.summonedByClass.split("|")[0].toTitleCase();
		const state = new ScaleClassSummonedCreature._State({
			className,
			proficiencyBonus: Parser.levelToPb(toClassLevel),
		});

		mon._displayName = `${mon.name} (Level ${toClassLevel} ${className})`;

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
			.replace(/\bplus\b/gi, "+")
			.replace(/\btimes\b/, "*")
			.replace(/(\b|[-+/*])PB\b/g, `$1${state.proficiencyBonus}`)
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

		let basePart = mon.hp.special; let hdPart = ""; let yourAbilModPart = "";
		if (mon.hp.special.includes("(")) {
			let [start, ...rest] = mon.hp.special.split("(");
			rest = rest.join("(");
			if (rest.toLowerCase().includes("hit dice")) {
				basePart = start.trim();
				hdPart = rest.trimAnyChar("() ");
			}
		}

		basePart = basePart
			.replace(/\+\s*your (?:Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) modifier/i, (...m) => {
				yourAbilModPart = m[0];
				return "";
			})
			.replace(/ +/g, " ")
			.trim();

		basePart = basePart
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
		;

		basePart = this._scale_getConvertedPbString(state, basePart);

		// "the beast has a number of Hit Dice [d8s] equal to your ranger level"
		if (hdPart) {
			hdPart = hdPart.replace(/(?<intro>.*) a number of hit dice \[d(?<hdSides>\d+)s?] equal to your (?:(?<className>[^(]*) )?level/i, (...m) => {
				const hdFormula = `${toClassLevel}d${m.last().hdSides}`;
				if (!yourAbilModPart) return hdFormula;

				return `${m.last().intro} {@dice ${hdFormula}} Hit Dice`;
			});
		}

		// If there is an ability modifier part, we cannot scale purely by level--display an expression instead.
		if (yourAbilModPart) {
			mon.hp.special = `${basePart} ${yourAbilModPart}${hdPart ? ` (${hdPart})` : ""}`.trim();
		} else {
			mon.hp.special = `${basePart}${hdPart ? ` (${hdPart})` : ""}`.trim();
		}

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
						// "{@damage 1d8 + 2 + PB}"
						.replace(/{@(?<tag>dice|damage|hit|d20|dc) (?<text>[^}]+)}/g, (...m) => {
							const {tag, text} = m.last();
							const [ptNumber, ...ptsRest] = text.split("|");

							const ptNumberOut = this._scale_getConvertedPbString(state, ptNumber);

							return `{@${tag} ${[ptNumberOut, ...ptsRest].join("|")}}`;
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

		mon.pbNote = mon.pbNote.replace(/equals your bonus\b/, (...m) => `${m[0]} (${UiUtil.intToBonus(state.proficiencyBonus, {isPretty: true})})`);
	}

	static _State = class {
		constructor ({className, proficiencyBonus}) {
			this.className = className;
			this.proficiencyBonus = proficiencyBonus;
		}
	};

	static _WALKER = null;
}
