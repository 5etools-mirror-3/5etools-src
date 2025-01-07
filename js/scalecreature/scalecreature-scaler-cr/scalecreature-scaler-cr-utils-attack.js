export class CrScalerUtilsAttack {
	static getEnchantmentBonus (str) {
		const m = /\+(\d+)/.exec(str);
		if (m) return Number(m[1]);
		else return 0;
	}

	/* -------------------------------------------- */

	static _WEP_THROWN_FINESSE = ["dagger", "dart"];
	static _WEP_FINESSE = ["dagger", "dart", "rapier", "scimitar", "shortsword", "whip"];
	static _WEP_THROWN = ["handaxe", "javelin", "light hammer", "spear", "trident", "net"];

	static getAbilBeingScaled ({strMod, dexMod, modFromAbil, name, content}) {
		if (name == null || modFromAbil == null) return null;

		const guessMod = () => {
			name = name.toLowerCase();

			let isMeleeOrRangedWeapon = false;
			let isMeleeWeapon = false;
			let isRangedWeapon = false;

			const mutTypeFlags = (tags) => {
				if (tags.includes("m") && tags.includes("r")) return isMeleeOrRangedWeapon = true;
				if (tags.includes("m")) return isMeleeWeapon = true;
				if (tags.includes("r")) return isRangedWeapon = true;
			};

			content
				.replace(/{@atk (?<tags>[^}]+)}/g, (...m) => {
					const {tags} = m.at(-1);
					if (!tags.includes("w")) return;

					mutTypeFlags(tags);
				})
				.replace(/{@atkr (?<tags>[^}]+)}/g, (...m) => {
					const {tags} = m.at(-1);
					// Note that for `@atkr` tags, "Weapon" is not generally included, so treat everything as a weapon
					//   during this initial pass.
					mutTypeFlags(tags);
				})
			;

			content = content.toLowerCase();

			if (isMeleeOrRangedWeapon) {
				const wtf = this._WEP_THROWN_FINESSE.find(it => content.includes(it));
				if (wtf) return "dex";

				const wf = this._WEP_FINESSE.find(it => content.includes(it));
				if (wf) return "dex";

				const wt = this._WEP_THROWN.find(it => content.includes(it));
				if (wt) return "str";

				return null;
			}

			if (isMeleeWeapon) {
				const wf = this._WEP_FINESSE.find(it => content.includes(it));
				if (wf) return "dex";
				return "str";
			}

			if (isRangedWeapon) {
				const wt = this._WEP_THROWN.find(it => content.includes(it));
				if (wt) return "str"; // this should realistically only catch Nets
				return "dex";
			}
		};

		if (strMod === dexMod && strMod === modFromAbil) return guessMod();
		return strMod === modFromAbil ? "str" : dexMod === modFromAbil ? "dex" : null;
	}
}
