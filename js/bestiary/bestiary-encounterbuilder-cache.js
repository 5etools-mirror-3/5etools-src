import {EncounterBuilderCacheGeneric} from "../encounterbuilder/cache/encounterbuilder-cache-base.js";

export class EncounterBuilderCacheBestiaryPage extends EncounterBuilderCacheGeneric {
	_creatures;

	setCreatures (creatures) {
		this._creatures = creatures;
	}

	_getCacheableCreatures () {
		if (!this._creatures) throw new Error(`Creatures list was uninitialized!`);
		return this._creatures;
	}
}
