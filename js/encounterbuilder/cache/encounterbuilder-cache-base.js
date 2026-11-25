import {BUDGET_MODE_CR, BUDGET_MODE_XP} from "../consts/encounterbuilder-consts.js";

/**
 * A cache of XP value -> creature.
 * @abstract
 */
export class EncounterBuilderCacheBase {
	reset () { throw new Error("Unimplemented!"); }

	/* -------------------------------------------- */

	/**
	 * @return {Array<object>}
	 */
	getCreatures ({budgetMode, spendValue, isPreferNonSingleton = false}) {
		const creatures = this._getCreatures({budgetMode, spendValue});
		if (!isPreferNonSingleton) return creatures;

		const creaturesNonSingleton = creatures
			.filter(creature => {
				if (creature.isNpc) return false;
				if (creature.isNamedCreature) return false;
				return true;
			});
		if (creaturesNonSingleton.length) return creaturesNonSingleton;
		return creatures;
	}

	_getCreatures ({budgetMode, spendValue}) {
		switch (budgetMode) {
			case BUDGET_MODE_XP: return this._getCreaturesByXp(spendValue);
			case BUDGET_MODE_CR: return this._getCreaturesByCr(spendValue);
			default: throw new Error(`Unhandled budget mode "${budgetMode}"!`);
		}
	}

	/* ----- */

	_STANDARD_XP_VALUES;

	/**
	 * @return {Array<number>}
	 */
	getKeys ({budgetMode, isIgnoreNonStandardValues = false}) {
		const keys = this._getKeys({budgetMode});
		if (!isIgnoreNonStandardValues) return keys;

		switch (budgetMode) {
			case BUDGET_MODE_XP: {
				this._STANDARD_XP_VALUES ||= new Set(Object.values(Parser.XP_CHART_ALT));
				return keys
					.filter(xp => this._STANDARD_XP_VALUES.has(xp));
			}
			case BUDGET_MODE_CR: return keys;
			default: throw new Error(`Unhandled budget mode "${budgetMode}"!`);
		}
	}

	_getKeys ({budgetMode}) {
		switch (budgetMode) {
			case BUDGET_MODE_XP: return this._getKeysByXp();
			case BUDGET_MODE_CR: return this._getKeysByCr();
			default: throw new Error(`Unhandled budget mode "${budgetMode}"!`);
		}
	}

	/* ----- */

	/**
	 * @abstract
	 * @return {Array<object>}
	 */
	_getCreaturesByXp (spendValue) { throw new Error("Unimplemented!"); }

	/**
	 * @abstract
	 * @return {Array<number>}
	 */
	_getKeysByXp () { throw new Error("Unimplemented!"); }

	/* ----- */

	/**
	 * @abstract
	 * @return {Array<object>}
	 */
	_getCreaturesByCr (spendValue) { throw new Error("Unimplemented!"); }

	/**
	 * @abstract
	 * @return {Array<number>}
	 */
	_getKeysByCr () { throw new Error("Unimplemented!"); }
}

/**
 * @abstract
 */
export class EncounterBuilderCacheGeneric extends EncounterBuilderCacheBase {
	_cacheXp = null;
	_cacheCr = null;

	/* -------------------------------------------- */

	static _UNWANTED_CR_NUMS = new Set([VeCt.CR_UNKNOWN, VeCt.CR_CUSTOM]);

	_isUnwantedCreature (mon) {
		if (mon.isNpc) return true;

		const crNum = Parser.crToNumber(mon.cr);
		if (this.constructor._UNWANTED_CR_NUMS.has(crNum)) return true;

		return false;
	}

	/* -------------------------------------------- */

	/**
	 * @abstract
	 * @returns {Array}
	 */
	_getCacheableCreatures () { throw new Error("Unimplemented!"); }

	_getCaches () {
		const cacheXp = {};
		const cacheCr = {};

		this._getCacheableCreatures()
			.filter(mon => !this._isUnwantedCreature(mon))
			.forEach(mon => {
				(cacheXp[Parser.crToXpNumber(mon.cr)] ||= []).push(mon);
				(cacheCr[Parser.crToNumber(mon.cr)] ||= []).push(mon);
			});

		return {cacheXp, cacheCr};
	}

	_doBuildCaches () {
		if (this._cacheXp != null && this._cacheCr != null) return;

		const {cacheXp, cacheCr} = this._getCaches();
		this._cacheXp = cacheXp;
		this._cacheCr = cacheCr;
	}

	/* -------------------------------------------- */

	reset () {
		this._cacheXp = null;
		this._cacheCr = null;
	}

	/* -------------------------------------------- */

	_getCreaturesByXp (spendValue) {
		this._doBuildCaches();
		return this._cacheXp[spendValue] || [];
	}

	_getKeysByXp () {
		this._doBuildCaches();
		return Object.keys(this._cacheXp).map(Number);
	}

	/* ----- */

	_getCreaturesByCr (spendValue) {
		this._doBuildCaches();
		return this._cacheCr[spendValue] || [];
	}

	_getKeysByCr () {
		this._doBuildCaches();
		return Object.keys(this._cacheCr).map(Number).sort(SortUtil.ascSort);
	}
}
