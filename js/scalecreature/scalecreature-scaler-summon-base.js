
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

	static _getHpParts (str) {
		let ptBase = str; let ptHd = ""; let ptYourAbilMod = "";
		if (str.includes("(")) {
			let [start, ...rest] = str.split("(");
			rest = rest.join("(");
			if (rest.toLowerCase().includes("hit dice")) {
				ptBase = start.trim();
				ptHd = rest.trimAnyChar("() ");
			}
		}

		ptBase = ptBase
			.replace(/\+\s*your (?:Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) modifier/i, (...m) => {
				ptYourAbilMod = m[0];
				return "";
			})
			.replace(/ +/g, " ")
			.trim();

		return {
			ptBase,
			ptHd,
			ptYourAbilMod,
		};
	}

	static _getAssembledHpParts ({ptBase, ptHd, ptYourAbilMod}) {
		// If there is an ability modifier part, we cannot scale purely by level--display an expression instead.
		if (ptYourAbilMod) {
			return `${ptBase} ${ptYourAbilMod}${ptHd ? ` (${ptHd})` : ""}`.trim();
		} else {
			return `${ptBase}${ptHd ? ` (${ptHd})` : ""}`.trim();
		}
	}
}
