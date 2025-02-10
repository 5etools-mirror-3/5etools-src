export class ScaleCreatureState {
	constructor (mon) {
		this._abilityScoresOriginal = Object.fromEntries(Parser.ABIL_ABVS.map(ab => [ab, mon[ab]]));
		this._hasModifiedAbilityScore = Object.fromEntries(Parser.ABIL_ABVS.map(ab => [ab, false]));

		this._abilityModsTemp = Object.fromEntries(Parser.ABIL_ABVS.map(ab => [ab, null]));

		this._abilityModsCandidates = {};
		this.clearCandidateAbilityMods();
	}

	/* ----- */

	getOriginalScore (abv) { return this._abilityScoresOriginal[abv]; }

	/* ----- */

	setHasModifiedAbilityScore (abv) { this._hasModifiedAbilityScore[abv] = true; }
	getHasModifiedAbilityScore (abv) { return !!this._hasModifiedAbilityScore[abv]; }

	/* ----- */

	getTempAbilityMod (abv) { return this._abilityModsTemp[abv]; }
	setTempAbilityMod (abv, mod) { return this._abilityModsTemp[abv] = mod; }

	addCandidateAbilityMod (abv, mod) { return this._abilityModsCandidates[abv].push(mod); }
	hasCandidateAbilityMods (abv) { return !!this._abilityModsCandidates[abv].length; }
	getCandidateAbilityMods (abv) { return MiscUtil.copyFast(this._abilityModsCandidates[abv]); }
	clearCandidateAbilityMods () { this._abilityModsCandidates = Object.fromEntries(Parser.ABIL_ABVS.map(ab => [ab, []])); }
}
