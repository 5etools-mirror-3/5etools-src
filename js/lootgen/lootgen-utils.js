import {VetoolsConfig} from "../utils-config/utils-config-config.js";
import {SITE_STYLE__CLASSIC} from "../consts.js";

export class LootGenUtils {
	static getCoinageLabel (abv, {styleHint = null} = {}) {
		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");
		return styleHint === SITE_STYLE__CLASSIC ? abv : abv.toUpperCase();
	}
}
