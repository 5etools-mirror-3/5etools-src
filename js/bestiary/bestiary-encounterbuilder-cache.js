import {EncounterBuilderCacheBase} from "../encounterbuilder/cache/encounterbuilder-cache-base.js";

export class EncounterBuilderCacheBestiaryPage extends EncounterBuilderCacheBase {
	_cacheXp = null;
	_cacheCr = null;

	constructor ({bestiaryPage}) {
		super();
		this._bestiaryPage = bestiaryPage;
	}

	_doBuildCaches () {
		if (this._cacheXp != null && this._cacheCr != null) return;

		const {cacheXp, cacheCr} = this._getCaches();
		this._cacheXp = cacheXp;
		this._cacheCr = cacheCr;
	}

	_getCaches () {
		const cacheXp = {};
		const cacheCr = {};

		this._bestiaryPage.list_.visibleItems
			.map(li => this._bestiaryPage.dataList_[li.ix])
			.filter(mon => !this._isUnwantedCreature(mon))
			.forEach(mon => {
				(cacheXp[Parser.crToXpNumber(mon.cr)] ||= []).push(mon);
				(cacheCr[Parser.crToNumber(mon.cr)] ||= []).push(mon);
			});

		return {cacheXp, cacheCr};
	}

	reset () {
		this._cacheXp = null;
		this._cacheCr = null;
	}

	_getCreaturesByXp (spendValue) {
		this._doBuildCaches();
		return this._cacheXp[spendValue] || [];
	}

	_getKeysByXp () {
		this._doBuildCaches();
		return Object.keys(this._cacheXp).map(Number);
	}

	_getCreaturesByCr (spendValue) {
		this._doBuildCaches();
		return this._cacheCr[spendValue] || [];
	}

	_getKeysByCr () {
		this._doBuildCaches();
		return Object.keys(this._cacheCr).map(Number).sort(SortUtil.ascSort);
	}
}
