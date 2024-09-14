"use strict";

class FilterCommon {
	static getDamageVulnerableFilter () {
		return this._getDamageResistVulnImmuneFilter({
			header: "Vulnerabilities",
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

	static mutateForFilters_damageVulnResImmune_player (ent) {
		this.mutateForFilters_damageVuln_player(ent);
		this.mutateForFilters_damageRes_player(ent);
		this.mutateForFilters_damageImm_player(ent);
	}

	static mutateForFilters_damageVuln_player (ent) {
		if (!ent.vulnerable) return;

		const out = new Set();
		ent.vulnerable.forEach(it => this._recurseResVulnImm(out, it));
		ent._fVuln = [...out];
	}

	static mutateForFilters_damageRes_player (ent) {
		if (!ent.resist) return;

		const out = new Set();
		ent.resist.forEach(it => this._recurseResVulnImm(out, it));
		ent._fRes = [...out];
	}

	static mutateForFilters_damageImm_player (ent) {
		if (!ent.immune) return;

		const out = new Set();
		ent.immune.forEach(iti => this._recurseResVulnImm(out, iti));
		ent._fImm = [...out];
	}

	static mutateForFilters_conditionImmune_player (ent) {
		if (!ent.conditionImmune) return;

		const out = new Set();
		ent.conditionImmune.forEach(it => this._recurseResVulnImm(out, it));
		ent._fCondImm = [...out];
	}

	static _recurseResVulnImm (allSet, it) {
		if (typeof it === "string") return allSet.add(it);
		if (it.choose?.from) it.choose?.from.forEach(itSub => this._recurseResVulnImm(allSet, itSub));
	}

	/* -------------------------------------------- */

	static PREREQ_FILTER_ITEMS = ["Ability", "Race", "Psionics", "Proficiency", "Special", "Spellcasting"];

	static _PREREQ_KEY_TO_FULL = {
		"other": "Special",
		"otherSummary": "Special",
		"spellcasting2020": "Spellcasting",
		"spellcastingFeature": "Spellcasting",
		"spellcastingPrepared": "Spellcasting",
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
