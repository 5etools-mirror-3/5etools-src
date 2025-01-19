import {ScaleCreatureUtils} from "../scalecreature-utils.js";
import {CrScalerUtils} from "./scalecreature-scaler-cr-utils.js";
import {CrScalerBase} from "./scalecreature-scaler-cr-base.js";
import {ScaleCreatureConsts} from "../scalecreature-consts.js";

// calculated as the mean modifier for each CR,
// -/+ the mean absolute deviation,
// rounded to the nearest integer
const _CR_TO_ESTIMATED_CON_MOD_RANGE = {
	"0": [-1, 2],
	"0.125": [-1, 1],
	"0.25": [0, 2],
	"0.5": [0, 2],
	"1": [0, 2],
	"2": [0, 3],
	"3": [1, 3],
	"4": [1, 4],
	"5": [2, 4],
	"6": [2, 5],
	"7": [1, 5],
	"8": [1, 5],
	"9": [2, 5],
	"10": [2, 5],
	"11": [2, 6],
	"12": [1, 5],
	"13": [3, 6],
	"14": [3, 6],
	"15": [3, 6],
	"16": [4, 7],
	"17": [3, 7],
	"18": [1, 7],
	"19": [4, 6],
	"20": [5, 9],
	"21": [3, 8],
	"22": [4, 9],
	"23": [5, 9],
	"24": [5, 9],
	"25": [7, 9],
	"26": [7, 9],
	// no creatures for these CRs; use 26
	"27": [7, 9],
	"28": [7, 9],
	"29": [7, 9],
	// end
	"30": [10, 10],
};

export class _CrScalerHpState {
	constructor (
		{
			mon,
			crInNumber,
			crOutNumber,
		},
	) {
		this._mon = mon;
		this._crInNumber = crInNumber;
		this._crOutNumber = crOutNumber;

		// Derived data
		this._hpInAvg = ScaleCreatureConsts.CR_HP_RANGES[crInNumber].mean();
		this._hpOutRange = ScaleCreatureConsts.CR_HP_RANGES[crOutNumber];
		this._targetHpOut = ScaleCreatureUtils.getScaledToRatio(mon.hp.average, this._hpInAvg, this._hpOutRange.mean());
		this._targetHpDeviation = (this._hpOutRange[1] - this._hpOutRange[0]) / 2;
		this._targetHpRange = [Math.floor(this._targetHpOut - this._targetHpDeviation), Math.ceil(this._targetHpOut + this._targetHpDeviation)];

		// Dice state
		this._hdFaces = null;
		this._hdAvg = null;
		this._modPerHd = null;
		this._hpModTarget = null;

		this._numHdOut = null;
		this._hpModOut = null;
	}

	/* -------------------------------------------- */

	isInRange (val) { return val >= this._targetHpRange[0] && val <= this._targetHpRange[1]; }
	isAboveRange (val) { return val > this._targetHpRange[1]; }
	isBelowRange (val) { return val < this._targetHpRange[0]; }

	/* -------------------------------------------- */

	getAsSpecialHp () {
		const cpyHp = MiscUtil.copyFast(this._mon.hp);
		delete cpyHp.average;
		delete cpyHp.formula;

		return {
			...cpyHp,
			special: Math.floor(Math.max(1, this._targetHpOut)),
		};
	}

	/* -------------------------------------------- */

	getAvg ({numHd = null, hpMod = null} = {}) {
		numHd ??= this._numHdOut;
		hpMod ??= this._hpModOut;
		return (numHd * this._hdAvg) + (numHd * hpMod);
	}

	/* -------------------------------------------- */

	initDiceState () {
		const origFormula = this._mon.hp.formula.replace(/\s*/g, "");

		// if it's not a well-known formula, convert our scaled "average" to a "special" and bail out
		if (!/^\d+d\d+(?:[-+]\d+)?$/.test(origFormula)) {
			return false;
		}

		const fSplit = origFormula.split(/([-+])/);
		const mDice = /(\d+)d(\d+)/i.exec(fSplit[0]);
		const hdFaces = Number(mDice[2]);
		const hdAvg = (hdFaces + 1) / 2;
		const numHd = Number(mDice[1]);
		const modTotal = fSplit.length === 3 ? Number(`${fSplit[1]}${fSplit[2]}`) : 0;
		const modPerHd = Math.floor(modTotal / numHd);

		const hpModTargetRange = _CR_TO_ESTIMATED_CON_MOD_RANGE[this._crOutNumber];
		const hpModTarget = hpModTargetRange[0] === hpModTargetRange[1] // handle CR 30, which is always 10
			? hpModTargetRange[0]
			: ScaleCreatureUtils.interpAndTranslateToSpace(modPerHd, _CR_TO_ESTIMATED_CON_MOD_RANGE[this._crInNumber], hpModTargetRange);

		this._hdFaces = hdFaces;
		this._hdAvg = hdAvg;
		this._modPerHd = modPerHd;
		this._hpModTarget = hpModTarget;

		this._numHdOut = numHd;
		this._hpModOut = hpModTarget;

		return true;
	}

	/* -------------------------------------------- */

	getHdAvg () { return this._hdAvg; }
	getHdModTarget () { return this._hpModTarget; }
	getNumHdOut () { return this._numHdOut; }

	setHpModOut (val) { this._hpModOut = val; }
	setNumHdOut (val) { this._numHdOut = val; }

	/* -------------------------------------------- */

	mutOutput () {
		this._mon.hp.average = Math.floor(this.getAvg());
		const outModTotal = this._numHdOut * this._hpModOut;
		this._mon.hp.formula = `${this._numHdOut}d${this._hdFaces}${outModTotal === 0 ? "" : `${outModTotal >= 0 ? "+" : ""}${outModTotal}`}`
			.replace(/([-+])\s*(\d+)$/g, " $1 $2"); // add spaces around the operator

		if (this._hpModOut === this._modPerHd) return false;

		const conOut = CrScalerUtils.calcNewAbility(this._mon, "con", this._hpModOut);
		const isConChange = conOut !== this._mon.con;

		if (isConChange && this._mon.save?.con) {
			const conDelta = Parser.getAbilityModifier(conOut) - Parser.getAbilityModifier(this._mon.con);
			const conSaveOut = Number(this._mon.save.con) + conDelta;
			this._mon.save.con = `${conSaveOut >= 0 ? "+" : ""}${conSaveOut}`;
		}

		this._mon.con = conOut;

		return isConChange;
	}

	/* -------------------------------------------- */

	getLoggableState () { return `${this._numHdOut}d${this._hpModOut}`; }
}

export class CrScalerHp extends CrScalerBase {
	_doAdjust_tryAdjustNumDice ({hpState}) {
		let numDiceTemp = hpState.getNumHdOut();
		let tempTotalHp = hpState.getAvg();
		let found = false;

		if (hpState.isAboveRange(tempTotalHp)) {
			while (numDiceTemp > 1) {
				numDiceTemp -= 1;
				tempTotalHp -= hpState.getHdAvg();

				if (hpState.isInRange(hpState.getAvg({numHd: numDiceTemp}))) {
					found = true;
					break;
				}
			}
		} else { // too low
			while (hpState.isBelowRange(tempTotalHp)) {
				numDiceTemp += 1;
				tempTotalHp += hpState.getHdAvg();

				if (hpState.isInRange(hpState.getAvg({numHd: numDiceTemp}))) {
					found = true;
					break;
				}
			}
		}

		if (found) {
			hpState.setNumHdOut(numDiceTemp);
			return true;
		}
		return false;
	}

	_doAdjust_tryAdjustMod ({hpState, iter}) {
		const ptAlternatePlusMinus = (1 - ((iter % 2) * 2));

		const hpModOutNxt = hpState.getHdModTarget()
			// alternating sequence, going further from origin each time.
			// E.g. original modOut == 0 => 1, -1, 2, -2, 3, -3, ... modOut+n, modOut-n
			+ Math.ceil((iter + 1) / 2) * ptAlternatePlusMinus;

		// Avoid negative ability scores
		if (hpModOutNxt < -5) return;

		hpState.setHpModOut(hpModOutNxt);
	}

	doAdjust () {
		if (this._mon.hp == null || this._mon.hp.special != null) return; // could be anything; best to just leave it

		const hpState = new _CrScalerHpState({
			mon: this._mon,
			crInNumber: this._crInNumber,
			crOutNumber: this._crOutNumber,
		});

		const hasDiceState = hpState.initDiceState();

		if (!hasDiceState) {
			this._mon.hp = hpState.getAsSpecialHp();
			return;
		}

		for (let iter = 0; iter < 100; ++iter) {
			if (hpState.isInRange(hpState.getAvg())) break;

			if (iter === 99) throw new Error(`Failed to find new HP! Current formula is: ${hpState.getLoggableState()}`);

			// order of preference for scaling:
			// - adjusting number of dice
			// - adjusting modifier
			if (this._doAdjust_tryAdjustNumDice({hpState})) break;
			this._doAdjust_tryAdjustMod({hpState, iter});
		}

		const isConChange = hpState.mutOutput();
		if (isConChange) this._state.setHasModifiedAbilityScore("con");
	}
}
