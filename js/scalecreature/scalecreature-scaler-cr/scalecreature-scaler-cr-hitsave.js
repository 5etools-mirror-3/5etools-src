import {ScaleCreatureUtils} from "../scalecreature-utils.js";
import {CrScalerUtils} from "./scalecreature-scaler-cr-utils.js";
import {CrScalerUtilsAttack} from "./scalecreature-scaler-cr-utils-attack.js";
import {CrScalerBase} from "./scalecreature-scaler-cr-base.js";

export class CrScalerHitSave extends CrScalerBase {
	static _ATK_CR_RANGES = {
		"3": [-1, 2],
		"4": [3, 3],
		"5": [4, 4],
		"6": [5, 7],
		"7": [8, 10],
		"8": [11, 15],
		"9": [16, 16],
		"10": [17, 20],
		"11": [21, 23],
		"12": [24, 26],
		"13": [27, 29],
		"14": [30, 30],
	};

	static _crToAtk (cr) {
		return CrScalerUtils.crRangeToVal(cr, this._ATK_CR_RANGES);
	}

	/* -------------------------------------------- */

	static _DC_RANGES = {
		"13": [-1, 3],
		"14": [4, 4],
		"15": [5, 7],
		"16": [8, 10],
		"17": [11, 12],
		"18": [13, 16],
		"19": [17, 20],
		"20": [21, 23],
		"21": [24, 26],
		"22": [27, 29],
		"23": [30, 30],
	};

	static _crToDc (cr) {
		return CrScalerUtils.crRangeToVal(cr, this._DC_RANGES);
	}

	/* -------------------------------------------- */

	constructor (opts) {
		super(opts);

		this._idealHitIn = Number(this.constructor._crToAtk(this._crInNumber));
		this._idealHitOut = Number(this.constructor._crToAtk(this._crOutNumber));

		this._strMod = Parser.getAbilityModNumber(this._mon.str);
		this._dexMod = Parser.getAbilityModNumber(this._mon.dex);

		this._idealDcIn = this.constructor._crToDc(this._crInNumber);
		this._idealDcOut = this.constructor._crToDc(this._crOutNumber);
	}

	/* -------------------------------------------- */

	_getAdjustedHitFlat ({toHitIn}) {
		// For low CR -> high CR,
		// prefer scaling to-hits by a flat difference, rather than using a ratio
		// this keeps ability scores more sane, and better maintains bounded accuracy.
		if (this._crInNumber < this._crOutNumber) return toHitIn + (this._idealHitOut - this._idealHitIn);

		// Otherwise, for high CR -> low CR
		return ScaleCreatureUtils.getScaledToRatio(toHitIn, this._idealHitIn, this._idealHitOut);
	}

	_handleHit (
		{
			str,
			name = null,
		},
	) {
		const offsetEnchant = name != null ? CrScalerUtilsAttack.getEnchantmentBonus(name) : 0;

		return str.replace(/{@hit ([-+]?\d+)}/g, (m0, m1) => {
			const curToHit = Number(m1);

			const modFromAbil = curToHit - (offsetEnchant + this._pbOut);
			// Handle e.g. "Hobgoblin Warlord" expertise on attacks
			const modFromAbilExpertise = curToHit - (offsetEnchant + (this._pbOut * 2));
			// Handle e.g. "Ghast" lack of proficiency on attacks
			const modFromAbilNoProf = curToHit - offsetEnchant;

			// ignore spell attacks here, as they'll be scaled using DCs later
			const abilBeingScaled = CrScalerUtilsAttack.getAbilBeingScaled({
				strMod: this._strMod,
				dexMod: this._dexMod,
				modFromAbil,
				name,
				content: str,
			});
			const abilBeingScaledExpertise = CrScalerUtilsAttack.getAbilBeingScaled({
				strMod: this._strMod,
				dexMod: this._dexMod,
				modFromAbil: modFromAbilExpertise,
				name,
				content: str,
			});
			const abilBeingScaledNoProf = CrScalerUtilsAttack.getAbilBeingScaled({
				strMod: this._strMod,
				dexMod: this._dexMod,
				modFromAbil: modFromAbilNoProf,
				name,
				content: str,
			});

			const {abil, profMult} = [
				abilBeingScaled ? {abil: abilBeingScaled, profMult: 1} : null,
				abilBeingScaledExpertise ? {abil: abilBeingScaledExpertise, profMult: 2} : null,
				abilBeingScaledNoProf ? {abil: abilBeingScaledNoProf, profMult: 0} : null,
			].filter(Boolean)[0] || {abil: null, profMult: 1};

			const pbInMult = profMult * this._pbIn;
			const pbOutMult = profMult * this._pbOut;

			const origToHitNoEnch = curToHit + (pbInMult - pbOutMult) - offsetEnchant;
			const targetToHitNoEnch = this._getAdjustedHitFlat({toHitIn: origToHitNoEnch});

			if (origToHitNoEnch === targetToHitNoEnch) return m0; // this includes updated PB, so just return it

			if (abil != null) {
				const modDiff = (targetToHitNoEnch - pbOutMult) - (origToHitNoEnch - pbInMult);
				const modFromAbilOut = modFromAbil + modDiff;

				this._state.addCandidateAbilityMod(abil, modFromAbilOut);
			}

			return `{@hit ${targetToHitNoEnch + offsetEnchant}}`;
		});
	}

	/* -------------------------------------------- */

	_handleDc_getAdjustedDcFlat ({dcIn}) {
		return dcIn + (this._idealDcOut - this._idealDcIn);
	}

	_handleDc (
		{
			str,
			castingAbility = null,
		},
	) {
		return str
			.replace(/DC (\d+)/g, (m0, m1) => `{@dc ${m1}}`)
			.replace(/{@dc (\d+)(?:\|[^}]+)?}/g, (m0, m1) => {
				const curDc = Number(m1);
				const origDc = curDc + this._pbIn - this._pbOut;
				const outDc = Math.max(10, this._handleDc_getAdjustedDcFlat({dcIn: origDc}));
				if (curDc === outDc) return m0;

				if (
					castingAbility
					&& ["int", "wis", "cha"].includes(castingAbility)
				) {
					if (!this._state.getHasModifiedAbilityScore(castingAbility)) {
						const dcDiff = outDc - origDc;
						const curMod = Parser.getAbilityModNumber(this._mon[castingAbility]);
						this._mon[castingAbility] = CrScalerUtils.calcNewAbility(this._mon, castingAbility, curMod + dcDiff + this._pbIn - this._pbOut);
						this._state.setHasModifiedAbilityScore(castingAbility);
					}
				}

				return `{@dc ${outDc}}`;
			});
	}

	/* -------------------------------------------- */

	_doHandleSpellcastingEntries ({walker}) {
		if (!this._mon.spellcasting?.length) return;

		this._mon.spellcasting.forEach(sc => {
			if (!sc.headerEntries?.length) return;

			sc.headerEntries = walker.walk(sc.headerEntries, {string: str => {
				const strMutDcs = this._handleDc({
					str: str,
					castingAbility: sc.ability,
				});

				return this._handleHit({
					str: strMutDcs,
				});
			}});
		});
	}

	_doHandleGenericEntries ({walker, prop}) {
		if (!this._mon[prop]?.length) return;

		this._mon[prop].forEach(entSub => {
			if (!entSub.entries?.length) return;

			entSub.entries = walker.walk(entSub.entries, {string: str => {
				const strMutHit = this._handleHit({
					str: str,
					name: entSub.name,
				});

				return this._handleDc({
					str: strMutHit,
				});
			}});
		});
	}

	/* -------------------------------------------- */

	_doFinalize_checkSetTempMod ({abil}) {
		if (!this._state.hasCandidateAbilityMods(abil)) return;

		const candidateAbilityMods = this._state.getCandidateAbilityMods(abil);
		this._state.clearCandidateAbilityMods();

		if (candidateAbilityMods.length === 1) {
			this._state.setTempAbilityMod(abil, candidateAbilityMods[0]);
			return;
		}

		const cntEachMod = {};
		candidateAbilityMods.forEach(mod => cntEachMod[mod] = (cntEachMod[mod] || 0) + 1);

		// If all changes are equal, apply the first
		if (Object.keys(cntEachMod).length === 1) {
			this._state.setTempAbilityMod(abil, candidateAbilityMods[0]);
			return;
		}

		// Otherwise, apply the one we found the most. Failing that, apply the first one.
		const maxCount = Math.max(...Object.values(cntEachMod));
		const mostPopularMods = Object.entries(cntEachMod)
			.filter(([, cnt]) => cnt === maxCount)
			.map(([mod]) => Number(mod));
		this._state.setTempAbilityMod(abil, mostPopularMods[0]);
	}

	// Apply any changes required by the to-hit adjustment to our ability scores
	_doFinalize () {
		this._doFinalize_checkSetTempMod({abil: "str"});
		this._doFinalize_checkSetTempMod({abil: "dex"});
	}

	/* -------------------------------------------- */

	doAdjust () {
		const walker = MiscUtil.getWalker({keyBlocklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLOCKLIST});

		this._doHandleSpellcastingEntries({walker});

		this._doHandleGenericEntries({walker, prop: "trait"});
		this._doHandleGenericEntries({walker, prop: "action"});
		this._doHandleGenericEntries({walker, prop: "bonus"});
		this._doHandleGenericEntries({walker, prop: "reaction"});
		this._doHandleGenericEntries({walker, prop: "legendary"});
		this._doHandleGenericEntries({walker, prop: "mythic"});
		this._doHandleGenericEntries({walker, prop: "variant"});

		this._doFinalize();
	}
}
