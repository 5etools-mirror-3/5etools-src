/**
 * A cache of XP value -> creature.
 */
export class EncounterBuilderCacheBase {
	reset () { throw new Error("Unimplemented!"); }
	getCreaturesByXp (xp) { throw new Error("Unimplemented!"); }
	getXpKeys () { throw new Error("Unimplemented!"); }

	static _UNWANTED_CR_NUMS = new Set([VeCt.CR_UNKNOWN, VeCt.CR_CUSTOM]);

	_isUnwantedCreature (mon) {
		if (mon.isNpc) return true;

		const crNum = Parser.crToNumber(mon.cr);
		if (this.constructor._UNWANTED_CR_NUMS.has(crNum)) return true;

		return false;
	}
}
