import {ScaleSummonedCreature} from "./scalecreature-scaler-summon-base.js";

export class ScaleSpellSummonedCreature extends ScaleSummonedCreature {
	static async scale (mon, toSpellLevel) {
		mon = MiscUtil.copyFast(mon);

		if (mon.summonedBySpellLevel == null) return mon;

		ScaleSpellSummonedCreature._WALKER = ScaleSpellSummonedCreature._WALKER || MiscUtil.getWalker({keyBlocklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLOCKLIST});

		const state = new ScaleSpellSummonedCreature._State({});

		mon._displayName = `${mon.name} (${Parser.getOrdinalForm(toSpellLevel)}-Level Spell)`;

		this._scale_ac(mon, toSpellLevel, state);
		this._scale_hp(mon, toSpellLevel, state);

		this._scale_traits(mon, toSpellLevel, state);
		this._scale_actions(mon, toSpellLevel, state);
		this._scale_bonusActions(mon, toSpellLevel, state);
		this._scale_reactions(mon, toSpellLevel, state);

		mon._summonedBySpell_level = toSpellLevel;
		mon._scaledSpellSummonLevel = toSpellLevel;
		mon._isScaledSpellSummon = true;

		return mon;
	}

	static _scale_ac (mon, toSpellLevel, state) {
		if (!mon.ac) return;

		mon.ac = mon.ac.map(it => {
			if (!it.special) return it;

			it.special = it.special
				// "11 + the level of the spell (natural armor)"
				// "11 + the spell's level"
				// "10 + 1 per spell level"
				.replace(/(\d+)\s*\+\s*(?:the level of the spell|the spell's level|1 per spell level)/g, (...m) => Number(m[1]) + toSpellLevel)
			;

			this._mutSimpleSpecialAcItem(it);

			return it;
		});
	}

	static _scale_hp (mon, toSpellLevel, state) {
		if (!mon.hp?.special) return;

		let {ptBase, ptHd, ptYourAbilMod} = this._getHpParts(mon.hp.special);

		ptBase = ptBase
			// "40 + 10 for each spell level above 4th"
			// "40 + 10 for each spell level above 4"
			.replace(/(\d+)\s*\+\s*(\d+) for each spell level above (\d+)(?:st|nd|rd|th)?/g, (...m) => {
				const [, hpBase, hpPlus, spLevelMin] = m;
				return Number(hpBase) + (Number(hpPlus) * (toSpellLevel - Number(spLevelMin)));
			})
			// "5 + 10 per spell level"
			.replace(/(\d+)\s*\+\s*(\d+) per spell level/g, (...m) => {
				const [, hpBase, hpPlus] = m;
				return Number(hpBase) + (Number(hpPlus) * Number(toSpellLevel));
			})
			// "equal the aberration's Constitution modifier + your spellcasting ability modifier + ten times the spell's level"
			.replace(/(ten) times the spell's level/g, (...m) => {
				const [, numMult] = m;
				return Parser.textToNumber(numMult) * toSpellLevel;
			})
		;

		// "20 (Air only) or 30 (Land and Water only) + 5 for each spell level above 2"
		ptBase = ptBase
			// Simplify bonus
			.replace(/\+\s*(\d+) for each spell level above (\d+)(?:st|nd|rd|th)?/g, (...m) => {
				const [, hpPlus, spLevelMin] = m;
				const bonus = Number(hpPlus) * (toSpellLevel - Number(spLevelMin));
				if (!bonus) return "";
				return `+ ${bonus}`;
			})
			.trim()
			// Apply bonus
			.replace(/^(?<ptsModes>(?:\d+ \([^)]+\)(?:,? or )?)+) \+\s*(?<bonus>\d+)$/g, (...m) => {
				const {ptsModes, bonus} = m.at(-1);
				const bonusNum = Number(bonus);
				return ptsModes
					.replace(/(\d+)(?= \([^)]+\))/g, (...m) => Number(m[0]) + bonusNum);
			})
		;

		if (ptHd) {
			ptHd = ptHd
				// "the swarm has a number of Hit Dice [d8s] equal to the spell's level"
				.replace(/(?<intro>.*) a number of hit dice \[d(?<hdSides>\d+)s?] equal to the spell's level/i, (...m) => {
					const {intro, hdSides} = m.at(-1);

					const hdFormula = `${toSpellLevel}d${hdSides}`;
					if (!ptYourAbilMod) return hdFormula;

					return `${intro} {@dice ${hdFormula}} Hit Dice`;
				})
			;
		}

		mon.hp.special = this._getAssembledHpParts({ptBase, ptHd, ptYourAbilMod});

		this._mutSimpleSpecialHp(mon);
	}

	static _scale_genericEntries (mon, toSpellLevel, state, prop) {
		if (!mon[prop]) return;
		mon[prop] = ScaleSpellSummonedCreature._WALKER.walk(
			mon[prop],
			{
				string: (str) => {
					str = str
						// "The aberration makes a number of attacks equal to half this spell's level (rounded down)."
						// "The spirit makes a number of attacks equal to half this spell's level (round down)."
						// ---
						// "The spirit makes a number of Rend attacks equal to half this spell's level (round down)."
						.replace(/a number of(?: (?<ptName>[^.!?]+))? attacks equal to half (?:this|the) spell's level \(round(?:ed)? down\)/g, (...m) => {
							const {ptName} = m.at(-1);

							const count = Math.floor(toSpellLevel / 2);

							return [
								Parser.numberToText(count),
								ptName,
								`attack${count === 1 ? "" : "s"}`,
							]
								.filter(Boolean)
								.join(" ");
						})
						// "{@damage 1d8 + 3 + summonSpellLevel}"
						.replace(/{@(?:dice|damage|hit|d20) [^}]+}/g, (...m) => {
							return m[0]
								.replace(/\bsummonSpellLevel\b/g, (...n) => toSpellLevel)
							;
						})
					;

					return str;
				},
			},
		);
	}

	static _scale_traits (mon, toSpellLevel, state) { this._scale_genericEntries(mon, toSpellLevel, state, "trait"); }
	static _scale_actions (mon, toSpellLevel, state) { this._scale_genericEntries(mon, toSpellLevel, state, "action"); }
	static _scale_bonusActions (mon, toSpellLevel, state) { this._scale_genericEntries(mon, toSpellLevel, state, "bonus"); }
	static _scale_reactions (mon, toSpellLevel, state) { this._scale_genericEntries(mon, toSpellLevel, state, "reaction"); }

	static _State = class {
		// (Implement as required)
		// this.whatever = null;
	};

	static _WALKER = null;
}
