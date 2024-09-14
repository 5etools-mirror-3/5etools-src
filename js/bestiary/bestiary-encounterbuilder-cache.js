import {EncounterBuilderCacheBase} from "../encounterbuilder/encounterbuilder-cache.js";

export class EncounterBuilderCacheBestiaryPage extends EncounterBuilderCacheBase {
	_cache = null;

	constructor ({bestiaryPage}) {
		super();
		this._bestiaryPage = bestiaryPage;
	}

	_build () {
		if (this._cache != null) return;
		// create a map of {XP: [monster list]}
		this._cache = this._getBuiltCache();
	}

	_getBuiltCache () {
		const out = {};
		this._bestiaryPage.list_.visibleItems
			.map(li => this._bestiaryPage.dataList_[li.ix])
			.filter(mon => !this._isUnwantedCreature(mon))
			.forEach(mon => {
				(out[Parser.crToXpNumber(mon.cr)] ||= []).push(mon);
			});
		return out;
	}

	reset () { this._cache = null; }

	getCreaturesByXp (xp) {
		this._build();
		return this._cache[xp] || [];
	}

	getXpKeys () {
		this._build();
		return Object.keys(this._cache).map(it => Number(it));
	}
}
