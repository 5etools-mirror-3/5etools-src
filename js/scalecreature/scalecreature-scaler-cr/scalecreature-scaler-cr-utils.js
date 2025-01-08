export class CrScalerUtils {
	static crRangeToVal (cr, ranges) {
		return Object.keys(ranges).find(k => {
			const [a, b] = ranges[k];
			return cr >= a && cr <= b;
		});
	}

	/* -------------------------------------------- */

	static calcNewAbility (mon, prop, modifier) {
		// at least 1
		const out = Math.max(1,
			((modifier + 5) * 2)
			+ (mon[prop] % 2), // add trailing odd numbers from the original ability, just for fun
		);
		// Avoid breaking 30 unless we really mean to
		return out === 31 ? 30 : out;
	}

	/* -------------------------------------------- */

	static RNG = null;

	static init (mon, crOutNumber) {
		let h = CryptUtil.hashCode(crOutNumber);
		h = 31 * h + CryptUtil.hashCode(mon.source);
		h = 31 * h + CryptUtil.hashCode(mon.name);
		this.RNG = Math.seed(h);
	}
}
