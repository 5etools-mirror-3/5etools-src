import {VetoolsConfig} from "../utils-config/utils-config-config.js";
import {SITE_STYLE__ONE} from "../consts.js";

export class UtilsEntityRace {
	static mutMigrateForVersion (ent, {styleHint = null} = {}) {
		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		if (styleHint !== SITE_STYLE__ONE) return false;

		if (ent.edition === SITE_STYLE__ONE) return false;

		if (ent.edition) ent._baseEdition = ent.edition;
		ent.edition = SITE_STYLE__ONE;

		// For legacy races:
		//   "Similarly, species in older books include ability score increases. If you’re using a species from an older book, ignore those increases and use only the ones given by your background."
		//   -- XPHB, p38
		delete ent.ability;

		return true;
	}
}
