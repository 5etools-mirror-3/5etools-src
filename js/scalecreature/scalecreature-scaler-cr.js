import {ScaleCreatureUtils} from "./scalecreature-utils.js";
import {ScaleCreatureState} from "./scalecreature-scaler-cr/scalecreature-scaler-cr-state.js";
import {CrScalerArmorClass} from "./scalecreature-scaler-cr/scalecreature-scaler-cr-armorclass.js";
import {CrScalerUtils} from "./scalecreature-scaler-cr/scalecreature-scaler-cr-utils.js";
import {CrScalerHitSave} from "./scalecreature-scaler-cr/scalecreature-scaler-cr-hitsave.js";
import {CrScalerDpr} from "./scalecreature-scaler-cr/scalecreature-scaler-cr-dpr.js";
import {CrScalerHp} from "./scalecreature-scaler-cr/scalecreature-scaler-cr-hp.js";

/**
 * Scale a creature based on the "Creating Quick Monster Stats" "Monster Statistics by Challenge Rating" table
 *   in the 2014 DMG.
 */
export class ScaleCreature {
	static isCrInScaleRange (mon) {
		if ([VeCt.CR_UNKNOWN, VeCt.CR_CUSTOM].includes(Parser.crToNumber(mon.cr))) return false;
		// Only allow scaling for creatures in the 0-30 CR range (homebrew may specify e.g. >30)
		const xpVal = Parser.XP_CHART_ALT[mon.cr?.cr ?? mon.cr];
		return xpVal != null;
	}

	static _CASTER_LEVEL_AND_CLASS_CANTRIPS = {
		artificer: [2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4],
		bard: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
		cleric: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
		druid: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
		sorcerer: [4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
		warlock: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
		wizard: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
	};

	static _casterLevelAndClassToCantrips (level, clazz) {
		clazz = (clazz || "cleric").toLowerCase(); // Cleric/Wizard have middle-ground scaling
		return this._CASTER_LEVEL_AND_CLASS_CANTRIPS[clazz][level];
	}

	// cantrips that should be preserved when lowering the number of cantrips known, to ensure caster effectiveness
	static _PROTECTED_CANTRIPS = ["acid splash", "chill touch", "eldritch blast", "fire bolt", "poison spray", "produce flame", "ray of frost", "sacred flame", "shocking grasp", "thorn whip", "vicious mockery"];

	// analysis of official data + some manual smoothing
	static _CR_TO_CASTER_LEVEL_AVG = {
		"0": 2,
		"0.125": 2,
		"0.25": 2,
		"0.5": 2,
		"1": 3.5,
		"2": 4.25,
		"3": 5.75,
		"4": 6.75,
		"5": 8,
		"6": 9.75,
		"7": 10.5,
		"8": 10.75,
		"9": 11.5,
		"10": 11.75,
		"11": 12,
		"12": 13,
		"13": 14,
		"14": 15,
		"15": 16,
		"16": 17,
		"17": 18,
		"18": 19,
		"19": 20, // (no samples; manually added)
	};

	static _crToCasterLevel (cr) {
		if (cr === 0) return 2;
		if (cr >= 19) return 20;
		return this._CR_TO_CASTER_LEVEL_AVG[cr];
	}

	/**
	 * @async
	 * @param mon Creature data.
	 * @param crOutNumber target CR, as a number.
	 * @return {Promise<creature>} the scaled creature.
	 */
	static async scale (mon, crOutNumber) {
		await this._pInitSpellCache();

		if (crOutNumber == null || crOutNumber === "Unknown") throw new Error("Attempting to scale unknown CR!");

		CrScalerUtils.init(mon, crOutNumber);

		const state = new ScaleCreatureState(mon);

		mon = MiscUtil.copyFast(mon);

		const crIn = mon.cr.cr || mon.cr;
		const crInNumber = Parser.crToNumber(crIn);
		if (crInNumber === crOutNumber) throw new Error("Attempting to scale creature to own CR!");
		if (crInNumber > 30) throw new Error("Attempting to scale a creature beyond 30 CR!");
		if (crInNumber < 0) throw new Error("Attempting to scale a creature below 0 CR!");

		const pbIn = Parser.crToPb(crIn);
		const pbOut = Parser.crToPb(String(crOutNumber));

		if (pbIn !== pbOut) this._applyPb(mon, pbIn, pbOut);

		new CrScalerHp({mon, crInNumber, crOutNumber, pbIn, pbOut, state}).doAdjust();
		new CrScalerHitSave({mon, crInNumber, crOutNumber, pbIn, pbOut, state}).doAdjust();
		new CrScalerDpr({mon, crInNumber, crOutNumber, pbIn, pbOut, state}).doAdjust();
		this._adjustSpellcasting(mon, crInNumber, crOutNumber);

		// adjust AC after DPR/etc, as DPR takes priority for adjusting DEX
		new CrScalerArmorClass({mon, crInNumber, crOutNumber, pbIn, pbOut, state}).doAdjust();

		// TODO update not-yet-scaled abilities

		this._handleUpdateAbilityScoresSkillsSaves({mon, state});

		const crOutStr = Parser.numberToCr(crOutNumber);
		if (mon.cr.cr) mon.cr.cr = crOutStr;
		else mon.cr = crOutStr;

		Renderer.monster.updateParsed(mon);

		mon._displayName = `${mon.name} (CR ${crOutStr})`;
		mon._scaledCr = crOutNumber;
		mon._isScaledCr = true;
		mon._originalCr = mon._originalCr || crIn;

		return mon;
	}

	static _applyPb (mon, pbIn, pbOut) {
		if (mon.save) {
			Object.keys(mon.save).forEach(k => {
				const bonus = mon.save[k];

				const fromAbility = Parser.getAbilityModNumber(mon[k]);
				if (fromAbility === Number(bonus)) return; // handle the case where no-PB saves are listed

				const actualPb = bonus - fromAbility;
				const expert = actualPb === pbIn * 2;

				mon.save[k] = this._applyPb_getNewSkillSaveMod(pbIn, pbOut, bonus, expert);
			});
		}

		this._applyPb_skills(mon, pbIn, pbOut, mon.skill);

		const pbDelta = pbOut - pbIn;

		if (mon.spellcasting) {
			mon.spellcasting.forEach(sc => {
				if (sc.headerEntries) {
					const toUpdate = JSON.stringify(sc.headerEntries);
					const out = ScaleCreatureUtils.applyPbDeltaDc(
						ScaleCreatureUtils.applyPbDeltaToHit(toUpdate, pbDelta),
						pbDelta,
					);
					sc.headerEntries = JSON.parse(out);
				}
			});
		}

		const handleGenericEntries = (prop) => {
			if (mon[prop]) {
				mon[prop].forEach(it => {
					const toUpdate = JSON.stringify(it.entries);
					const out = ScaleCreatureUtils.applyPbDeltaDc(
						ScaleCreatureUtils.applyPbDeltaToHit(toUpdate, pbDelta),
						pbDelta,
					);
					it.entries = JSON.parse(out);
				});
			}
		};

		handleGenericEntries("trait");
		handleGenericEntries("action");
		handleGenericEntries("bonus");
		handleGenericEntries("reaction");
		handleGenericEntries("legendary");
		handleGenericEntries("mythic");
		handleGenericEntries("variant");
	}

	static _applyPb_getNewSkillSaveMod (pbIn, pbOut, oldMod, expert) {
		const mod = Number(oldMod) - (expert ? 2 * pbIn : pbIn) + (expert ? 2 * pbOut : pbOut);
		return UiUtil.intToBonus(mod);
	}

	static _applyPb_skills (mon, pbIn, pbOut, monSkill) {
		if (!monSkill) return;

		Object.keys(monSkill).forEach(skill => {
			if (skill === "other") {
				monSkill[skill].forEach(block => {
					if (block.oneOf) {
						this._applyPb_skills(mon, pbIn, pbOut, block.oneOf);
					} else throw new Error(`Unhandled "other" skill keys: ${Object.keys(block)}`);
				});
				return;
			}

			const bonus = monSkill[skill];

			const fromAbility = Parser.getAbilityModNumber(mon[Parser.skillToAbilityAbv(skill)]);
			if (fromAbility === Number(bonus)) return; // handle the case where no-PB skills are listed

			const actualPb = bonus - fromAbility;
			const expert = actualPb === pbIn * 2;

			monSkill[skill] = this._applyPb_getNewSkillSaveMod(pbIn, pbOut, bonus, expert);

			if (skill === "perception" && mon.passive != null) mon.passive = 10 + Number(monSkill[skill]);
		});
	}

	static _handleUpdateAbilityScoresSkillsSaves ({mon, state}) {
		const TO_HANDLE = ["str", "dex", "int", "wis", "cha"];

		TO_HANDLE.forEach(abil => {
			if (!state.getHasModifiedAbilityScore(abil)) return;

			const diff = Parser.getAbilityModNumber(mon[abil]) - Parser.getAbilityModNumber(state.getOriginalScore(abil));

			if (mon.save && mon.save[abil] != null) {
				const out = Number(mon.save[abil]) + diff;
				mon.save[abil] = UiUtil.intToBonus(out);
			}

			this._handleUpdateAbilityScoresSkillsSaves_handleSkills(mon.skill, abil, diff);

			if (abil === "wis" && mon.passive != null) {
				if (typeof mon.passive === "number") {
					mon.passive = mon.passive + diff;
				} else {
					// Passive perception can be a string in e.g. the case of Artificer Steel Defender
					delete mon.passive;
				}
			}
		});
	}

	static _handleUpdateAbilityScoresSkillsSaves_handleSkills (monSkill, abil, diff) {
		if (!monSkill) return;

		Object.keys(monSkill).forEach(skill => {
			if (skill === "other") {
				monSkill[skill].forEach(block => {
					if (block.oneOf) {
						this._handleUpdateAbilityScoresSkillsSaves_handleSkills(block.oneOf.oneOf, abil, diff);
					} else throw new Error(`Unhandled "other" skill keys: ${Object.keys(block)}`);
				});
				return;
			}

			const skillAbil = Parser.skillToAbilityAbv(skill);
			if (skillAbil !== abil) return;
			const out = Number(monSkill[skill]) + diff;
			monSkill[skill] = UiUtil.intToBonus(out);
		});
	}

	static _spells = null;
	static async _pInitSpellCache () {
		if (this._spells) return Promise.resolve();

		this._spells = {};

		this.__initSpellCache({
			spell: (await DataUtil.spell.loadJSON()).spell.filter(sp => sp.source === Parser.SRC_PHB),
		});
	}

	static __initSpellCache (data) {
		data.spell.forEach(s => {
			Renderer.spell.getCombinedClasses(s, "fromClassList")
				.forEach(c => {
					let it = (this._spells[c.source] = this._spells[c.source] || {});
					const lowName = c.name.toLowerCase();
					it = (it[lowName] = it[lowName] || {});
					it = (it[s.level] = it[s.level] || {});
					it[s.name] = 1;
				});
		});
	}

	static _adjustSpellcasting (mon, crIn, crOut) {
		const getSlotsAtLevel = (casterLvl, slotLvl) => {
			// there's probably a nice equation for this somewhere
			if (casterLvl < (slotLvl * 2) - 1) return 0;
			switch (slotLvl) {
				case 1: return casterLvl === 1 ? 2 : casterLvl === 2 ? 3 : 4;
				case 2: return casterLvl === 3 ? 2 : 3;
				case 3: return casterLvl === 5 ? 2 : 3;
				case 4: return casterLvl === 7 ? 1 : casterLvl === 8 ? 2 : 3;
				case 5: return casterLvl === 9 ? 1 : casterLvl < 18 ? 2 : 3;
				case 6: return casterLvl >= 19 ? 2 : 1;
				case 7: return casterLvl === 20 ? 2 : 1;
				case 8: return 1;
				case 9: return 1;
			}
		};

		if (!mon.spellcasting) return;

		const idealClvlIn = this._crToCasterLevel(crIn);
		const idealClvlOut = this._crToCasterLevel(crOut);

		const isWarlock = this._adjustSpellcasting_isWarlock(mon);
		// favor the first result as primary
		let primaryInLevel = null;
		let primaryOutLevel = null;

		mon.spellcasting.forEach(sc => {
			// attempt to ascertain class spells
			let spellsFromClass = null;

			if (sc.headerEntries) {
				const inStr = JSON.stringify(sc.headerEntries);

				let anyChange = false;
				const outStr = inStr.replace(/(an?) (\d+)[A-Za-z]+-level/i, (...m) => {
					const level = Number(m[2]);
					const outLevel = Math.max(1, Math.min(20, ScaleCreatureUtils.getScaledToRatio(level, idealClvlIn, idealClvlOut)));
					anyChange = level !== outLevel;
					if (anyChange) {
						if (primaryInLevel == null) primaryInLevel = level;
						if (primaryOutLevel == null) primaryOutLevel = outLevel;
						return `${Parser.getArticle(outLevel)} ${Parser.spLevelToFull(outLevel)}-level`;
					} else return m[0];
				});

				const mClasses = /(artificer|bard|cleric|druid|paladin|ranger|sorcerer|warlock|wizard) spells?/i.exec(outStr);
				if (mClasses) spellsFromClass = mClasses[1];
				else {
					const mClasses2 = /(artificer|bard|cleric|druid|paladin|ranger|sorcerer|warlock|wizard)(?:'s)? spell list/i.exec(outStr);
					if (mClasses2) spellsFromClass = mClasses2[1];
				}

				if (anyChange) sc.headerEntries = JSON.parse(outStr);
			}

			// calculate spell level from caster levels
			let maxSpellLevel = null;
			if (primaryOutLevel) {
				maxSpellLevel = Math.min(9, Math.ceil(primaryOutLevel / 2));

				// cap half-caster slots at 5
				if (/paladin|ranger|warlock/i.exec(spellsFromClass)) {
					maxSpellLevel = Math.min(5, primaryOutLevel);
				}
			}

			if (sc.spells && primaryOutLevel != null) {
				const spells = sc.spells;

				// "lower" is the property defining a set of spell slots as having a lower bound, e.g. "1st-5th level"
				const isWarlockCasting = /warlock/i.exec(spellsFromClass) && Object.values(spells).filter(it => it.slots && it.lower).length === 1;

				// cantrips
				if (spells[0]) {
					const curCantrips = spells[0].spells.length;
					const idealCantripsIn = this._casterLevelAndClassToCantrips(primaryInLevel, spellsFromClass);
					const idealCantripsOut = this._casterLevelAndClassToCantrips(primaryOutLevel, spellsFromClass);
					const targetCantripCount = ScaleCreatureUtils.getScaledToRatio(curCantrips, idealCantripsIn, idealCantripsOut);

					if (curCantrips < targetCantripCount && spellsFromClass) {
						const cantrips = Object.keys((this._spells[Parser.SRC_PHB][spellsFromClass.toLowerCase()] || {})[0]).map(it => it.toLowerCase());
						if (cantrips.length) {
							const extraCantrips = [];
							const numNew = Math.min(targetCantripCount - curCantrips, cantrips.length);
							for (let n = 0; n < numNew; ++n) {
								const ix = RollerUtil.roll(cantrips.length, CrScalerUtils.RNG);
								extraCantrips.push(cantrips[ix]);
								cantrips.splice(ix, 1);
							}
							spells[0].spells = spells[0].spells.concat(extraCantrips.map(it => `{@spell ${it}}`));
						}
					} else {
						const keepThese = this._PROTECTED_CANTRIPS.map(it => `@spell ${it}`);
						while (spells[0].spells.length > targetCantripCount) {
							const ixs = spells[0].spells.filterIndex(it => !~keepThese.findIndex(x => it.includes(x)));
							if (ixs.length) {
								const ix = RollerUtil.roll(ixs.length, CrScalerUtils.RNG);
								spells[0].spells.splice(ix, 1);
							} else spells[0].spells.pop();
						}
					}
				}

				// spells
				if (isWarlockCasting) {
					const curCastingLevel = Object.keys(spells).find(k => spells[k].lower);
					if (maxSpellLevel === Number(curCastingLevel)) return;
					if (maxSpellLevel === 0) {
						Object.keys(spells).filter(lvl => lvl !== "0").forEach(lvl => delete spells[lvl]);
						return;
					}

					const numSpellsKnown = this._adjustSpellcasting_getWarlockNumSpellsKnown(primaryOutLevel);
					const warlockSpells = this._spells[Parser.SRC_PHB].warlock;
					let spellList = [];
					for (let i = 1; i < maxSpellLevel + 1; ++i) {
						spellList = spellList.concat(Object.keys(warlockSpells[i]).map(sp => sp.toSpellCase()));
					}
					const spellsKnown = []; // TODO maintain original spell list if possible -- add them to this list, and remove them from the list being rolled against
					for (let i = 0; i < numSpellsKnown; ++i) {
						const ix = RollerUtil.roll(spellList.length, CrScalerUtils.RNG);
						spellsKnown.push(spellList[ix]);
						spellList.splice(ix, 1);
					}
					Object.keys(spells).filter(lvl => lvl !== "0").forEach(lvl => delete spells[lvl]);
					const slots = this._adjustSpellcasting_getWarlockNumSpellSlots(maxSpellLevel);
					spells[maxSpellLevel] = {
						slots,
						lower: 1,
						spells: [
							`A selection of ${maxSpellLevel === 1 ? `{@filter 1st-level warlock spells|spells|level=${1}|class=warlock}.` : `{@filter 1st- to ${Parser.spLevelToFull(maxSpellLevel)}-level warlock spells|spells|level=${[...new Array(maxSpellLevel)].map((_, i) => i + 1).join(";")}|class=warlock}.`}  Examples include: ${spellsKnown.sort(SortUtil.ascSortLower).map(it => `{@spell ${it}}`).joinConjunct(", ", " and ")}`,
						],
					};
				} else {
					let lastRatio = 1; // adjust for higher/lower than regular spell slot counts
					for (let i = 1; i < 10; ++i) {
						const atLevel = spells[i];
						const idealSlotsIn = getSlotsAtLevel(primaryInLevel, i);
						const idealSlotsOut = getSlotsAtLevel(primaryOutLevel, i);

						if (atLevel) {
							// TODO grow/shrink the spell list at this level as required
							if (atLevel.slots) { // no "slots" signifies at-wills
								const adjustedSlotsOut = ScaleCreatureUtils.getScaledToRatio(atLevel.slots, idealSlotsIn, idealSlotsOut);
								lastRatio = adjustedSlotsOut / idealSlotsOut;

								atLevel.slots = adjustedSlotsOut;
								if (adjustedSlotsOut <= 0) {
									delete spells[i];
								}
							}
						} else if (i <= maxSpellLevel) {
							const slots = Math.max(1, Math.round(idealSlotsOut * lastRatio));
							if (spellsFromClass && (this._spells[Parser.SRC_PHB][spellsFromClass.toLowerCase()] || {})[i]) {
								const examples = [];
								const levelSpells = Object.keys(this._spells[Parser.SRC_PHB][spellsFromClass.toLowerCase()][i]).map(it => it.toSpellCase());
								const numExamples = Math.min(5, levelSpells.length);
								for (let n = 0; n < numExamples; ++n) {
									const ix = RollerUtil.roll(levelSpells.length, CrScalerUtils.RNG);
									examples.push(levelSpells[ix]);
									levelSpells.splice(ix, 1);
								}
								spells[i] = {
									slots,
									spells: [
										`A selection of {@filter ${Parser.spLevelToFull(i)}-level ${spellsFromClass} spells|spells|level=${i}|class=${spellsFromClass}}. Examples include: ${examples.sort(SortUtil.ascSortLower).map(it => `{@spell ${it}}`).joinConjunct(", ", " and ")}`,
									],
								};
							} else {
								spells[i] = {
									slots,
									spells: [
										`A selection of {@filter ${Parser.spLevelToFull(i)}-level spells|spells|level=${i}}`,
									],
								};
							}
						} else {
							delete spells[i];
						}
					}
				}
			}
		});

		mon.spellcasting.forEach(sc => {
			// adjust Mystic Arcanum spells
			if (isWarlock && sc.daily && sc.daily["1e"]) {
				const numArcanum = this._adjustSpellcasting_getWarlockNumArcanum(primaryOutLevel);

				const curNumSpells = sc.daily["1e"].length;

				if (sc.daily["1e"].length === numArcanum) return;
				if (numArcanum === 0) return delete sc.daily["1e"];

				if (curNumSpells > numArcanum) {
					// map each existing spell e.g. `{@spell gate}` to an object of the form `{original: "{@spell gate}", level: 9}`
					const curSpells = sc.daily["1e"].map(it => {
						const m = /{@spell ([^|}]+)(?:\|([^|}]+))?[|}]/.exec(it);
						if (m) {
							const nameTag = m[1].toLowerCase();
							const srcTag = (m[2] || Parser.SRC_PHB).toLowerCase();

							const src = Object.keys(this._spells).find(it => it.toLowerCase() === srcTag);
							if (src) {
								const levelStr = Object.keys(this._spells[src].warlock || {}).find(lvl => Object.keys((this._spells[src].warlock || {})[lvl]).some(nm => nm.toLowerCase() === nameTag));

								if (levelStr) return {original: it, level: Number(levelStr)};
							}
						}
						return {original: it, level: null};
					});

					for (let i = 9; i > 5; --i) {
						const ixToRemove = curSpells.map(it => it.level === i ? curSpells.indexOf(it) : -1).filter(it => ~it);
						while (ixToRemove.length && curSpells.length > numArcanum) {
							curSpells.splice(ixToRemove.pop(), 1);
						}
						if (curSpells.length === numArcanum) break;
					}

					sc.daily["1e"] = curSpells.map(it => it.original);
				} else {
					for (let i = 5 + curNumSpells; i < 5 + numArcanum; ++i) {
						const rollOn = Object.keys(this._spells[Parser.SRC_PHB].warlock[i]);
						const ix = RollerUtil.roll(rollOn.length, CrScalerUtils.RNG);
						sc.daily["1e"].push(`{@spell ${rollOn[ix].toSpellCase()}}`);
					}

					sc.daily["1e"].sort(SortUtil.ascSortLower);
				}
			}
		});
	}

	static _adjustSpellcasting_isWarlock (mon) {
		if (mon.spellcasting) {
			return mon.spellcasting.some(sc => sc.headerEntries && /warlock spells?|warlock('s)? spell list/i.test(JSON.stringify(sc.headerEntries)));
		}
	}

	static _adjustSpellcasting_getWarlockNumSpellsKnown (level) {
		return level <= 9 ? level + 1 : 10 + Math.ceil((level - 10) / 2);
	}

	static _adjustSpellcasting_getWarlockNumSpellSlots (level) {
		return level === 1 ? 1 : level < 11 ? 2 : level < 17 ? 3 : 4;
	}

	static _adjustSpellcasting_getWarlockNumArcanum (level) {
		return level < 11 ? 0 : level < 13 ? 1 : level < 15 ? 2 : level < 17 ? 3 : 4;
	}
}
