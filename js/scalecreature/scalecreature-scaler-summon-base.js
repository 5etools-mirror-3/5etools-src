
export class ScaleSummonedCreature {
	static _mutSimpleSpecialAcItem (acItem) {
		// Try to convert to "from" AC
		const mSimpleNatural = /^(\d+) \(natural armor\)$/i.exec(acItem.special);
		if (mSimpleNatural) {
			delete acItem.special;
			acItem.ac = Number(mSimpleNatural[1]);
			acItem.from = ["natural armor"];
		}
	}

	/** */
	static _mutSimpleSpecialHp (mon) {
		if (!mon.hp?.special) return;

		const cleanHp = mon.hp.special.toLowerCase().replace(/ /g, "");
		const mHp = /^(?<averagePart>\d+)(?<hdPart>\((?<dicePart>\d+d\d+)(?<bonusPart>[-+]\d+)?\))?$/.exec(cleanHp);

		if (!mHp) return;

		if (!mHp.groups.hdPart) return {average: Number(mHp.groups.averagePart)};

		mon.hp = {
			average: Number(mHp.groups.averagePart),
			formula: `${mHp.groups.dicePart}${mHp.groups.bonusPart ? mHp.groups.bonusPart.replace(/[-+]/g, " $0 ") : ""}`,
		};
	}
}
