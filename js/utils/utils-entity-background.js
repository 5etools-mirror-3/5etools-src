import {VetoolsConfig} from "../utils-config/utils-config-config.js";
import {SITE_STYLE__ONE} from "../consts.js";

export class UtilsEntityBackground {
	static isCustomBackground (ent) {
		// (Name/source are from entity in `backgrounds.json`)
		return ent?.name === "Custom Background" && ent?.source === Parser.SRC_PHB;
	}

	/* -------------------------------------------- */

	static _GENERIC_ABILITY_ONE = [
		{
			"choose": {
				"weighted": {
					"from": [...Parser.ABIL_ABVS],
					"weights": [
						2,
						1,
					],
				},
			},
		},
		{
			"choose": {
				"weighted": {
					"from": [...Parser.ABIL_ABVS],
					"weights": [
						1,
						1,
						1,
					],
				},
			},
		},
	];

	static _GENERIC_FEAT_ONE = [
		{
			"anyFromCategory": {
				"category": [
					"O",
				],
				"count": 1,
			},
		},
	];

	static mutMigrateForVersion (ent, {styleHint = null} = {}) {
		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		if (styleHint !== SITE_STYLE__ONE) return false;

		if (this.isCustomBackground(ent)) return false;
		if (ent.edition === SITE_STYLE__ONE) return false;

		if (ent.edition) ent._baseEdition = ent.edition;
		ent.edition = SITE_STYLE__ONE;

		// For legacy backgrounds:
		//   "Backgrounds in older D&D books don’t include ability score adjustments. If you’re using a background from an older book, adjust your ability scores by increasing one score by 2 and a different one by 1, or increase three scores by 1. None of these increases can raise a score above 20."
		//   -- XPHB, p38
		if (!ent.ability?.length) { // (Avoid modifying e.g. homebrew which has "ability" already)
			ent.ability = MiscUtil.copyFast(this._GENERIC_ABILITY_ONE);
		}

		// For legacy backgrounds:
		//   "Also, if the background you choose doesn't provide a feat, you gain an Origin feat of your choice."
		//   -- XPHB, p38
		if (!ent.feats?.length) {
			ent.feats = MiscUtil.copyFast(this._GENERIC_FEAT_ONE);
		}

		return true;
	}
}
