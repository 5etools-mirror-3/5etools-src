export class ScaleCreatureUtils {
	/**
	 * Calculate outVal based on a ratio equality.
	 *
	 *   inVal       outVal
	 * --------- = ----------
	 *  inTotal     outTotal
	 *
	 * @param inVal
	 * @param inTotal
	 * @param outTotal
	 * @returns {number} outVal
	 */
	static getScaledToRatio (inVal, inTotal, outTotal) {
		return Math.round(inVal * (outTotal / inTotal));
	}

	/* -------------------------------------------- */

	/**
	 * X in L-H
	 * --L---X------H--
	 *   \   \     |
	 *    \   \    |
	 *   --M---Y---I--
	 * to Y; relative position in M-I
	 * so (where D is "delta;" fractional position in L-H range)
	 * X = D(H - L) + L
	 *   => D = X - L / H - L
	 *
	 * @param x position within L-H space
	 * @param lh L-H is the original space (1 dimension; a range)
	 * @param mi M-I is the target space (1 dimension; a range)
	 * @returns {number} the relative position in M-I space
	 */
	static interpAndTranslateToSpace (x, lh, mi) {
		let [l, h] = lh;
		let [m, i] = mi;
		// adjust to avoid infinite delta
		const OFFSET = 0.1;
		l -= OFFSET; h += OFFSET;
		m -= OFFSET; i += OFFSET;
		const delta = (x - l) / (h - l);
		return Math.round((delta * (i - m)) + m); // round to nearest whole number
	}

	/* -------------------------------------------- */

	static _RE_HIT = /{@hit ([-+]?\d+)}/g;

	static applyPbDeltaToHit (str, pbDelta) {
		if (!pbDelta) return str;

		return str.replace(this._RE_HIT, (_, m1) => {
			const curToHit = Number(m1);
			const outToHit = curToHit + pbDelta;
			return `{@hit ${outToHit}}`;
		});
	}

	static _RE_DC_PLAINTEXT = /DC (\d+)/g;
	// Strip display text, as it may no longer be accurate
	static _RE_DC_TAG = /{@dc (\d+)(?:\|[^}]+)?}/g;

	static applyPbDeltaDc (str, pbDelta) {
		if (!pbDelta) return str;

		return str
			.replace(this._RE_DC_PLAINTEXT, (_, m1) => `{@dc ${m1}}`)
			.replace(this._RE_DC_TAG, (_, m1) => {
				const curDc = Number(m1);
				const outDc = curDc + pbDelta;
				return `{@dc ${outDc}}`;
			});
	}

	/* -------------------------------------------- */

	static getDiceExpressionAverage (diceExp) {
		diceExp = diceExp.replace(/\s*/g, "");
		const asAverages = diceExp.replace(/d(\d+)/gi, (...m) => {
			return ` * ${(Number(m[1]) + 1) / 2}`;
		});
		return MiscUtil.expEval(asAverages);
	}

	static getScaledDpr ({dprIn, crInNumber, dprTargetIn, dprTargetOut}) {
		if (crInNumber === 0) dprIn = Math.min(dprIn, 0.63); // cap CR 0 DPR to prevent average damage in the thousands
		return this.getScaledToRatio(dprIn, dprTargetIn, dprTargetOut);
	}
}
