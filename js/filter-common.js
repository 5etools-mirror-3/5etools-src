"use strict";

class FilterCommon {
	static getDamageVulnerableFilter () {
		return this._getDamageResistVulnImmuneFilter({
			header: "Vulnerability",
			headerShort: "Vuln.",
		});
	}

	static getDamageResistFilter () {
		return this._getDamageResistVulnImmuneFilter({
			header: "Resistance",
			headerShort: "Res.",
		});
	}

	static getDamageImmuneFilter () {
		return this._getDamageResistVulnImmuneFilter({
			header: "Immunity",
			headerShort: "Imm.",
		});
	}

	static _getDamageResistVulnImmuneFilter (
		{
			header,
			headerShort,
		},
	) {
		return new Filter({
			header: header,
			items: [...Parser.DMG_TYPES],
			displayFnMini: str => `${headerShort} ${str.toTitleCase()}`,
			displayFnTitle: str => `Damage ${header}: ${str.toTitleCase()}`,
			displayFn: StrUtil.uppercaseFirst,
		});
	}

	/* -------------------------------------------- */

	static _CONDS = [
		"blinded",
		"charmed",
		"deafened",
		"exhaustion",
		"frightened",
		"grappled",
		"incapacitated",
		"invisible",
		"paralyzed",
		"petrified",
		"poisoned",
		"prone",
		"restrained",
		"stunned",
		"unconscious",
		// not really a condition, but whatever
		"disease",
	];

	static getConditionImmuneFilter () {
		return new Filter({
			header: "Condition Immunity",
			items: this._CONDS,
			displayFnMini: str => `Imm. ${str.toTitleCase()}`,
			displayFnTitle: str => `Condition Immunity: ${str.toTitleCase()}`,
			displayFn: StrUtil.uppercaseFirst,
		});
	}

	/* -------------------------------------------- */

	static mutateForFilters_damageVulnResImmune (ent) {
		ent._fVuln = this._getAllImmRes(ent.vulnerable, "vulnerable");
		ent._fRes = this._getAllImmRes(ent.resist, "resist");
		ent._fImm = this._getAllImmRes(ent.immune, "immune");
	}

	static _getAllImmRes (val, key) {
		if (!val) return [];
		const out = [];
		for (const valSub of val) this._getAllImmRes_recurse(valSub, key, out);
		return out;
	}

	static _getAllImmRes_recurse (val, key, out, isConditional) {
		if (val[key]) {
			val[key].forEach(nxt => this._getAllImmRes_recurse(nxt, key, out, !!val.cond));
			return;
		}

		if (val.special) return out.push("Other");

		if (typeof val !== "string") return;
		out.push(isConditional ? `${val} (Conditional)` : val);
	}

	static mutateForFilters_conditionImmune (ent) {
		ent._fCondImm = this._getAllImmRes(ent.conditionImmune, "immune");
	}

	/* -------------------------------------------- */

	static PREREQ_FILTER_ITEMS = ["Ability", "Species", "Psionics", "Proficiency", "Special", "Spellcasting"];

	static _PREREQ_KEY_TO_FULL = {
		"other": "Special",
		"otherSummary": "Special",
		"spellcasting2020": "Spellcasting",
		"spellcastingFeature": "Spellcasting",
		"spellcastingPrepared": "Spellcasting",
		"spellcastingFocus": "Spellcasting Focus",
		"level": "Class", // We assume that any filter with meaningful level requirements will have these in a separate filter
		"itemType": "Item Type",
		"itemProperty": "Item Property",
	};

	/**
	 * @param {Array<object>} prerequisite
	 * @param {Set} ignoredKeys
	 */
	static getFilterValuesPrerequisite (prerequisite, {ignoredKeys = null} = {}) {
		return Array.from(
			new Set((prerequisite || [])
				.flatMap(it => Object.keys(it))),
		)
			.filter(k => ignoredKeys == null || !ignoredKeys.has(k))
			.map(it => (this._PREREQ_KEY_TO_FULL[it] || it).uppercaseFirst());
	}

	/* -------------------------------------------- */

	static _LANG_TO_DISPLAY = {
		"anyStandard": "Any Standard",
		"anyExotic": "Any Exotic",
		"anyRare": "Any Rare",
		"anyLanguage": "Any",
	};

	static getLanguageProficienciesFilter () {
		return new Filter({
			header: "Language Proficiencies",
			displayFn: it => this._LANG_TO_DISPLAY[it] || StrUtil.toTitleCase(it),
		});
	}
}

globalThis.FilterCommon = FilterCommon;
