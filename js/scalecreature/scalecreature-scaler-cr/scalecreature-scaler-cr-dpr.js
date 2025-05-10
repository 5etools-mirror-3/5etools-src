import {CrScalerBase} from "./scalecreature-scaler-cr-base.js";
import {ScaleCreatureDamageExpression} from "../scalecreature-damage-expression.js";
import {ScaleCreatureUtils} from "../scalecreature-utils.js";
import {CrScalerUtilsAttack} from "./scalecreature-scaler-cr-utils-attack.js";
import {CrScalerUtils} from "./scalecreature-scaler-cr-utils.js";

class _CrScalerDprState {
	constructor () {
		this.dprMax = 0;
	}
}

export class CrScalerDpr extends CrScalerBase {
	constructor (opts) {
		super(opts);

		const {dprAverageIn, dprAverageOut, crOutDprVariance} = ScaleCreatureDamageExpression.getCreatureDamageScaleMeta({crInNumber: this._crInNumber, crOutNumber: this._crOutNumber});
		this._dprAverageIn = dprAverageIn;
		this._dprAverageOut = dprAverageOut;
		this._crOutDprVariance = crOutDprVariance;

		this._originalStrMod = Parser.getAbilityModNumber(this._mon.str);
		this._originalDexMod = Parser.getAbilityModNumber(this._mon.dex);
	}

	/* -------------------------------------------- */

	_getCandidateScaledEntries_doPostCalc (
		{
			modOutScaled,
			abilBeingScaled,
			diceExp,
			strMod,
			dexMod,
			stateDpr,
			dprAdjusted,
			reqAbilAdjust,
		},
	) {
		// prevent ability scores going below zero
		// should be mathematically impossible, if the recalculation is working correctly as:
		// - minimum damage dice is a d4
		// - minimum number of dice is 1
		// - minimum DPR range is 0-1, which can be achieved with e.g. 1d4-1 (avg 1) or 1d4-2 (avg 0)
		// therefore, this provides a sanity check: this should only occur when something's broken
		if (modOutScaled < -5) throw new Error(`Ability modifier ${abilBeingScaled != null ? `(${abilBeingScaled})` : ""} was below -5 (${modOutScaled})! Original dice expression was ${diceExp}.`);

		if (abilBeingScaled == null) return true;

		const originalAbilMod = abilBeingScaled === "str" ? strMod : abilBeingScaled === "dex" ? dexMod : null;

		if (originalAbilMod != null) {
			if (this._state.getTempAbilityMod(abilBeingScaled) != null && this._state.getTempAbilityMod(abilBeingScaled) !== modOutScaled) {
				if (stateDpr.dprMax < dprAdjusted) {
					// TODO test this -- none of the official monsters require attribute re-calculation but homebrew might. The story so far:
					//   - A previous damage roll required an adjusted ability modifier to make the numbers line up
					//   - This damage roll requires a _different_ adjustment to the same modifier to make the numbers line up
					//   - This damage roll has a bigger average DPR, so should be prioritised. Update the modifier using this roll's requirements.
					//   - Since this will effectively invalidate the previous roll adjustments, break out of whatever we're doing here, and restart the entire adjustment process
					//   - As we've set our new attribute modifier on the creature, the next loop will respect it, and use it by default
					//   - Additionally, track the largest DPR, so we don't get stuck in a loop doing this on the next DPR adjustment iteration
					this._state.setTempAbilityMod(abilBeingScaled, modOutScaled);
					stateDpr.dprMax = dprAdjusted;
					return false;
				}
			}

			// Always update the ability score key if one was used, to avoid later rolls clobbering our
			//   values. We do this for e.g. Young White Dragon's "Bite" attack being scaled from CR6 to 7,
			//   which would otherwise cause the 1d8 (mod 0) to calculate a new Strength value.
			stateDpr.dprMax = Math.max((stateDpr.dprMax || 0), dprAdjusted);
			this._state.setTempAbilityMod(abilBeingScaled, modOutScaled);
		}

		// Track dbg data
		reqAbilAdjust.push({
			ability: abilBeingScaled,
			mod: modOutScaled,
			dprAdjusted,
		});

		return true;
	}

	_getCandidateScaledEntries_doProp (
		{
			stateDpr,
			scaledEntries,
			strMod,
			dexMod,
			prop,
		},
	) {
		if (!this._mon[prop]) return true; // if there was nothing to do, the operation was a success

		let allSucceeded = true;

		this._mon[prop].forEach((it, idxProp) => {
			const toUpdate = JSON.stringify(it.entries);

			// handle flat values first, as we may convert dice values to flats
			let out = toUpdate.replace(RollerUtil.REGEX_DAMAGE_FLAT, (m0, prefix, flatVal, suffix) => {
				const adjDpr = ScaleCreatureUtils.getScaledDpr({dprIn: flatVal, crInNumber: this._crInNumber, dprTargetIn: this._dprAverageIn, dprTargetOut: this._dprAverageOut});
				return `${prefix}${adjDpr}${suffix}`;
			});

			// track attribute adjustment requirements (unused except for dbgging)
			const reqAbilAdjust = [];

			// pre-calculate enchanted weapon offsets
			const offsetEnchant = CrScalerUtilsAttack.getEnchantmentBonus(it.name);

			out = out.replace(RollerUtil.REGEX_DAMAGE_DICE, (m0, average, prefix, diceExp, suffix) => {
				const {
					dprTargetRange,
					numDice,
					dprAdjusted,
					diceFaces,
					modFromAbil,
				} = ScaleCreatureDamageExpression.getExpressionDamageScaleMeta({
					diceExp,

					crInNumber: this._crInNumber,
					crOutNumber: this._crOutNumber,

					dprAverageIn: this._dprAverageIn,
					dprAverageOut: this._dprAverageOut,
					crOutDprVariance: this._crOutDprVariance,
				});

				// try to figure out which mod we're going to be scaling
				const abilBeingScaled = CrScalerUtilsAttack.getAbilBeingScaled({
					strMod: this._originalStrMod,
					dexMod: this._originalDexMod,
					modFromAbil,
					name: it.name,
					content: toUpdate,
				});

				const modOut = ScaleCreatureDamageExpression.getAdjustedDamageMod({
					crInNumber: this._crInNumber,
					crOutNumber: this._crOutNumber,

					abilBeingScaled,
					strTmpMod: this._state.getTempAbilityMod("str"),
					dexTmpMod: this._state.getTempAbilityMod("dex"),

					modFromAbil,

					offsetEnchant,
				});

				const {expression, modOut: modOutScaled} = ScaleCreatureDamageExpression.getScaled({
					dprTargetRange,
					prefix,
					suffix,

					numDice,
					dprAdjusted,
					diceFaces,
					offsetEnchant,

					modOut,

					isAllowAdjustingMod: modFromAbil != null,
				});

				allSucceeded = allSucceeded && this._getCandidateScaledEntries_doPostCalc({
					modOutScaled,
					abilBeingScaled,
					diceExp,
					strMod,
					dexMod,
					stateDpr,
					dprAdjusted,
					reqAbilAdjust,
				});

				return expression;
			});

			// skip remaining entries, to let the outer loop continue
			if (!allSucceeded) return false;

			if (toUpdate !== out) {
				scaledEntries.push({
					prop,
					idxProp,
					entriesStrOriginal: toUpdate, // unused/debug
					entriesStr: out,
					reqAbilAdjust, // unused/debug
				});
			}
		});

		return allSucceeded;
	}

	_getCandidateScaledEntries (
		{
			stateDpr,
		},
	) {
		const scaledEntries = [];

		const argsShared = {
			stateDpr,
			scaledEntries,
			strMod: this._state.getTempAbilityMod("str") || this._originalStrMod,
			dexMod: this._state.getTempAbilityMod("dex") || this._originalDexMod,
		};

		if (!this._getCandidateScaledEntries_doProp({...argsShared, prop: "trait"})) return null;
		if (!this._getCandidateScaledEntries_doProp({...argsShared, prop: "action"})) return null;
		if (!this._getCandidateScaledEntries_doProp({...argsShared, prop: "bonus"})) return null;
		if (!this._getCandidateScaledEntries_doProp({...argsShared, prop: "reaction"})) return null;
		if (!this._getCandidateScaledEntries_doProp({...argsShared, prop: "legendary"})) return null;
		if (!this._getCandidateScaledEntries_doProp({...argsShared, prop: "mythic"})) return null;
		if (!this._getCandidateScaledEntries_doProp({...argsShared, prop: "variant"})) return null;

		return scaledEntries;
	}

	_doAdjustDpr ({stateDpr}) {
		let scaledEntries;
		for (let i = 0; i < 99; ++i) {
			scaledEntries = this._getCandidateScaledEntries({stateDpr});
			if (scaledEntries) break;
		}

		// overwrite originals with scaled versions
		scaledEntries.forEach(it => {
			this._mon[it.prop][it.idxProp].entries = JSON.parse(it.entriesStr);
		});
	}

	/* -------------------------------------------- */

	_doFinalize_updateAbility ({prop}) {
		if (this._state.getTempAbilityMod(prop) == null) return;

		this._state.setHasModifiedAbilityScore(prop);
		this._mon[prop] = CrScalerUtils.calcNewAbility(this._mon, prop, this._state.getTempAbilityMod(prop));
	}

	_doFinalize () {
		this._doFinalize_updateAbility({prop: "str"});
		this._doFinalize_updateAbility({prop: "dex"});
	}

	/* -------------------------------------------- */

	doAdjust () {
		const stateDpr = new _CrScalerDprState();
		this._doAdjustDpr({stateDpr});
		this._doFinalize();
	}
}
