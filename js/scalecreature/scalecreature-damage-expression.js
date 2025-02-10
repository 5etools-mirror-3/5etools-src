import {ScaleCreatureConsts} from "./scalecreature-consts.js";
import {ScaleCreatureUtils} from "./scalecreature-utils.js";

export class ScaleCreatureDamageExpression {
	static _State = class {
		constructor (
			{
				dprTargetRange,
				prefix,
				suffix,

				numDice,
				dprAdjusted,
				diceFaces,
				offsetEnchant = 0,

				modOut,

				isAllowAdjustingMod = true,
			},
		) {
			// region Inputs
			this.dprTargetRange = dprTargetRange;
			this.prefix = prefix;
			this.suffix = suffix;
			this.numDice = numDice;
			this.dprAdjusted = dprAdjusted;
			this.diceFaces = diceFaces;
			this.offsetEnchant = offsetEnchant;
			this.isAllowAdjustingMod = isAllowAdjustingMod;
			// endregion

			// region Outputs
			this.numDiceOut = numDice;
			this.diceFacesOut = diceFaces;
			this.modOut = modOut;
			// endregion
		}

		get dprTargetMin () { return this.dprTargetRange[0]; }
		get dprTargetMax () { return this.dprTargetRange[1]; }

		isInRange (num) {
			return num >= this.dprTargetRange[0] && num <= this.dprTargetRange[1];
		}

		getDiceExpression ({numDice, diceFaces, mod} = {}) {
			numDice ??= this.numDiceOut;
			diceFaces ??= this.diceFacesOut;
			mod ??= this.modOut;

			const ptDice = diceFaces === 1
				? ((numDice || 1) * diceFaces)
				: `${numDice}d${diceFaces}`;
			const ptMod = mod !== 0
				? ` ${mod > 0 ? "+" : ""} ${mod}`
				: "";
			return `${ptDice}${ptMod}`;
		}

		toString () {
			return [
				`Original expression (approx): ${this.numDice}d${this.diceFaces} + ${this.modOut}`,
				`Current formula: ${this.getDiceExpression()}`,
				`Current average: ${ScaleCreatureUtils.getDiceExpressionAverage(this.getDiceExpression())}`,
				`Target range: ${this.dprTargetMin}-${this.dprTargetMax}`,
			]
				.join("\n");
		}
	};

	static _MAX_ATTEMPTS = 100;

	static getScaled (
		{
			dprTargetRange,

			prefix,
			suffix,

			numDice,
			dprAdjusted,
			diceFaces,

			modOut,

			isAllowAdjustingMod = true,
		},
	) {
		const state = new this._State({
			dprTargetRange,
			prefix,
			suffix,
			numDice,
			dprAdjusted,
			diceFaces,
			modOut,
			isAllowAdjustingMod,
		});

		for (let ixAttempt = 0; ixAttempt < this._MAX_ATTEMPTS; ++ixAttempt) {
			if (state.isInRange(ScaleCreatureUtils.getDiceExpressionAverage(state.getDiceExpression()))) return this._getScaled_getOutput(state);

			// order of preference for scaling:
			// - adjusting number of dice
			// - adjusting number of faces
			// - adjusting modifier
			if (this._getScaled_tryAdjustNumDice(state)) continue;
			if (this._getScaled_tryAdjustDiceFaces(state)) continue;
			this._getScaled_tryAdjustMod(state, {ixAttempt});
		}

		throw new Error(`Failed to find new DPR!\n${state}`);
	}

	static _DIR_INCREASE = 1;
	static _DIR_DECREASE = -1;

	static _getScaled_tryAdjustNumDice (state, {diceFacesTemp = null} = {}) {
		diceFacesTemp ??= state.diceFacesOut;
		let numDiceTemp = state.numDice;

		let tempAvgDpr = ScaleCreatureUtils.getDiceExpressionAverage(
			state.getDiceExpression({
				numDice: numDiceTemp,
				diceFaces: diceFacesTemp,
			}),
		);

		const dir = state.dprAdjusted < tempAvgDpr ? this._DIR_DECREASE : this._DIR_INCREASE;

		while (
			(dir === this._DIR_INCREASE || numDiceTemp > 1)
			&& (dir === this._DIR_INCREASE ? tempAvgDpr <= state.dprTargetMax : tempAvgDpr >= state.dprTargetMin)
		) {
			numDiceTemp += dir;
			tempAvgDpr += dir * ((diceFacesTemp + 1) / 2);

			if (
				state.isInRange(
					ScaleCreatureUtils.getDiceExpressionAverage(
						state.getDiceExpression({
							numDice: numDiceTemp,
							diceFaces: diceFacesTemp,
						}),
					),
				)
			) {
				state.numDiceOut = numDiceTemp;
				return true;
			}
		}

		return false;
	}

	static _getNextDice (diceFaces) {
		return Renderer.dice.getNextDice(diceFaces);
	}

	static _getPreviousDice (diceFaces) {
		return diceFaces === 4 ? 1 : Renderer.dice.getPreviousDice(diceFaces);
	}

	static _getScaled_tryAdjustDiceFaces (state) {
		// can't be scaled
		if (state.diceFaces === 1 || state.diceFaces === 20) return false;

		let diceFacesTemp = state.diceFaces;

		let tempAvgDpr = ScaleCreatureUtils.getDiceExpressionAverage(
			state.getDiceExpression({
				diceFaces: diceFacesTemp,
			}),
		);

		const dir = state.dprAdjusted < tempAvgDpr ? this._DIR_DECREASE : this._DIR_INCREASE;

		while (
			(dir === this._DIR_INCREASE ? diceFacesTemp < 20 : diceFacesTemp > 1)
			&& (dir === this._DIR_INCREASE ? tempAvgDpr <= state.dprTargetMax : tempAvgDpr >= state.dprTargetMin)
		) {
			diceFacesTemp = dir === this._DIR_INCREASE ? this._getNextDice(diceFacesTemp) : this._getPreviousDice(diceFacesTemp);
			tempAvgDpr = ScaleCreatureUtils.getDiceExpressionAverage(state.getDiceExpression({diceFaces: diceFacesTemp}));

			if (
				state.isInRange(
					ScaleCreatureUtils.getDiceExpressionAverage(
						state.getDiceExpression({diceFaces: diceFacesTemp}),
					),
				)
			) {
				state.diceFacesOut = diceFacesTemp;
				return true;
			}

			if (this._getScaled_tryAdjustNumDice(state, {diceFacesTemp})) {
				state.diceFacesOut = diceFacesTemp;
				return true;
			}
		}

		return false;
	}

	static _getScaled_tryAdjustMod (state, {ixAttempt}) {
		if (!state.isAllowAdjustingMod) return false;

		// alternating sequence, going further from origin each time.
		// E.g. original modOut == 0 => 1, -1, 2, -2, 3, -3, ... modOut+n, modOut-n
		state.modOut += (1 - ((ixAttempt % 2) * 2)) * (ixAttempt + 1);
	}

	/** Alternate implementation which prevents dec/increasing AS when inc/decreasing CR */
	static _getScaled_tryAdjustMod_alt (state, {crIn, crOut}) {
		if (!state.isAllowAdjustingMod) return false;

		state.modOut += Math.sign(crOut - crIn);
		state.modOut = Math.max(-5, Math.min(state.modOut, 10)); // Cap at -5 (0) and at +10 (30)
	}

	static _getScaled_getOutput (state) {
		const diceExpOut = state.getDiceExpression({
			numDice: state.numDiceOut,
			diceFaces: state.diceFacesOut,
			mod: state.modOut + state.offsetEnchant,
		});

		const avgDamOut = Math.floor(ScaleCreatureUtils.getDiceExpressionAverage(diceExpOut));
		if (avgDamOut <= 0 || diceExpOut === "1") {
			return {
				expression: `1 ${state.suffix.replace(/^\W+/, " ").replace(/ +/, " ")}`,
				modOut: state.modOut,
			};
		}

		const expression = [
			Math.floor(ScaleCreatureUtils.getDiceExpressionAverage(diceExpOut)),
			state.prefix,
			diceExpOut,
			state.suffix,
		]
			.filter(Boolean)
			.join("");

		return {
			expression,
			modOut: state.modOut,
		};
	}

	/* -------------------------------------------- */

	static getCreatureDamageScaleMeta ({crInNumber, crOutNumber}) {
		const dprRangeIn = ScaleCreatureConsts.CR_DPR_RANGES[crInNumber];
		if (!dprRangeIn) return null;
		const dprRangeOut = ScaleCreatureConsts.CR_DPR_RANGES[crOutNumber];
		if (!dprRangeOut) return null;

		const dprAverageIn = dprRangeIn.mean();
		const dprAverageOut = dprRangeOut.mean();

		const crOutDprVariance = (dprRangeOut[1] - dprRangeOut[0]) / 2;

		return {
			dprAverageIn,
			dprAverageOut,
			crOutDprVariance,
		};
	}

	static getExpressionDamageScaleMeta (
		{
			diceExp,

			crInNumber,
			crOutNumber,

			dprAverageIn,
			dprAverageOut,
			crOutDprVariance,

			offsetEnchant = 0,
		},
	) {
		diceExp = diceExp.replace(/\s+/g, "");
		const avgDpr = ScaleCreatureUtils.getDiceExpressionAverage(diceExp);
		const dprAdjusted = ScaleCreatureUtils.getScaledDpr({dprIn: avgDpr, crInNumber, dprTargetIn: dprAverageIn, dprTargetOut: dprAverageOut});

		const dprTargetRange = [
			Math.max(0, Math.floor(dprAdjusted - crOutDprVariance)),
			Math.ceil(Math.max(1, dprAdjusted + crOutDprVariance)),
		];

		// in official data, there are no dice expressions with more than one type of dice
		const [dice, modifier] = diceExp.split(/[-+]/);
		const [numDice, diceFaces] = dice.split("d").map(it => Number(it));
		const modFromAbil = modifier ? Number(modifier) - offsetEnchant : null;

		return {
			dprTargetRange,
			numDice,
			dprAdjusted,
			diceFaces,
			modFromAbil,
		};
	}

	static getAdjustedDamageMod (
		{
			crInNumber,
			crOutNumber,

			abilBeingScaled = null,
			strTmpMod = null,
			dexTmpMod = null,

			modFromAbil,

			offsetEnchant = 0,
		},
	) {
		if (abilBeingScaled === "str" && strTmpMod != null) return strTmpMod;
		if (abilBeingScaled === "dex" && dexTmpMod != null) return dexTmpMod;

		if (modFromAbil == null) return 0 - offsetEnchant; // ensure enchanted equipment is ignored even with +0 base damage mod

		// calculate this without enchanted equipment; ignore them and add them back at the end
		return ScaleCreatureUtils.interpAndTranslateToSpace(
			modFromAbil,
			ScaleCreatureConsts.CR_TO_ESTIMATED_DAMAGE_MOD[crInNumber],
			ScaleCreatureConsts.CR_TO_ESTIMATED_DAMAGE_MOD[crOutNumber],
		);
	}
}
