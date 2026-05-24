import {DataLoaderConst} from "./utils-dataloader-const.js";

export class DataLoaderCache {
	static _PARTITION_UNKNOWN = 0;
	static _PARTITION_SITE = 1;
	static _PARTITION_PRERELEASE = 2;
	static _PARTITION_BREW = 3;

	_cache = {};
	_cacheSiteLists = {};
	_cachePrereleaseLists = {};
	_cacheBrewLists = {};

	_isDirtyCachesAllSite = {};
	_cachesAllSite = {};
	_isDirtyCachesAllPrerelease = {};
	_cachesAllPrerelease = {};
	_isDirtyCachesAllBrew = {};
	_cachesAllBrew = {};

	_isDirtyCachesAllAll = {};
	_cachesAllAll = {};

	/* -------------------------------------------- */

	get (pageClean, sourceClean, hashClean) {
		return this._cache[pageClean]?.[sourceClean]?.[hashClean];
	}

	/* -------------------------------------------- */

	_set_getPartition (ent) {
		if (ent.adventure) return this._set_getPartition_fromSource(SourceUtil.getEntitySource(ent.adventure));
		if (ent.book) return this._set_getPartition_fromSource(SourceUtil.getEntitySource(ent.book));

		if (ent.__prop !== "item" || ent._category !== "Specific Variant") return this._set_getPartition_fromSource(SourceUtil.getEntitySource(ent));

		// "Specific Variant" items have a dual source. For the purposes of partitioning:
		//   - only items with both `baseitem` source and `magicvariant` source both "site" sources
		//   - items which include any brew are treated as brew
		//   - items which include any prerelease (and no brew) are treated as prerelease
		const entitySource = SourceUtil.getEntitySource(ent);
		const partitionBaseitem = this._set_getPartition_fromSource(entitySource);
		const partitionMagicvariant = this._set_getPartition_fromSource(ent._baseSource ?? entitySource);

		if (partitionBaseitem === partitionMagicvariant && partitionBaseitem === this.constructor._PARTITION_SITE) return this.constructor._PARTITION_SITE;
		if (partitionBaseitem === this.constructor._PARTITION_BREW || partitionMagicvariant === this.constructor._PARTITION_BREW) return this.constructor._PARTITION_BREW;
		return this.constructor._PARTITION_PRERELEASE;
	}

	_set_getPartition_fromSource (partitionSource) {
		if (SourceUtil.isSiteSource(partitionSource) || partitionSource === VeCt.STR_GENERIC) return this.constructor._PARTITION_SITE;
		if (PrereleaseUtil.hasSourceJson(partitionSource)) return this.constructor._PARTITION_PRERELEASE;
		if (BrewUtil2.hasSourceJson(partitionSource)) return this.constructor._PARTITION_BREW;
		return this.constructor._PARTITION_UNKNOWN;
	}

	_set_addToPartition ({cache, isDirtyCachesAll, pageClean, hashClean, ent}) {
		let siteListCache = cache[pageClean];
		if (!siteListCache) {
			siteListCache = {};
			cache[pageClean] = siteListCache;
		}
		siteListCache[hashClean] = ent;
		isDirtyCachesAll[pageClean] = true;
		this._isDirtyCachesAllAll[pageClean] = true;
	}

	set (pageClean, sourceClean, hashClean, ent) {
		// region Set primary cache
		let pageCache = this._cache[pageClean];
		if (!pageCache) {
			pageCache = {};
			this._cache[pageClean] = pageCache;
		}

		let sourceCache = pageCache[sourceClean];
		if (!sourceCache) {
			sourceCache = {};
			pageCache[sourceClean] = sourceCache;
		}

		sourceCache[hashClean] = ent;
		// endregion

		if (ent === DataLoaderConst.ENTITY_NULL) return;

		// region Set site/prerelease/brew list cache
		switch (this._set_getPartition(ent)) {
			case this.constructor._PARTITION_SITE: {
				return this._set_addToPartition({
					cache: this._cacheSiteLists,
					isDirtyCachesAll: this._isDirtyCachesAllSite,
					pageClean,
					hashClean,
					ent,
				});
			}

			case this.constructor._PARTITION_PRERELEASE: {
				return this._set_addToPartition({
					cache: this._cachePrereleaseLists,
					isDirtyCachesAll: this._isDirtyCachesAllPrerelease,
					pageClean,
					hashClean,
					ent,
				});
			}

			case this.constructor._PARTITION_BREW: {
				return this._set_addToPartition({
					cache: this._cacheBrewLists,
					isDirtyCachesAll: this._isDirtyCachesAllBrew,
					pageClean,
					hashClean,
					ent,
				});
			}

			// Skip by default
		}
		// endregion
	}

	/* -------------------------------------------- */

	_getAll_doCheckBuildCache ({cache, cachesAll, isDirtyCachesAll, pageClean}) {
		if (!cachesAll[pageClean] || isDirtyCachesAll[pageClean]) cachesAll[pageClean] = Object.values(cache[pageClean] || {});
		delete isDirtyCachesAll[pageClean];
		return cachesAll[pageClean];
	}

	getAllSite (pageClean) {
		return this._getAll_doCheckBuildCache({
			cache: this._cacheSiteLists,
			cachesAll: this._cachesAllSite,
			isDirtyCachesAll: this._isDirtyCachesAllSite,
			pageClean,
		});
	}

	getAllPrerelease (pageClean) {
		return this._getAll_doCheckBuildCache({
			cache: this._cachePrereleaseLists,
			cachesAll: this._cachesAllPrerelease,
			isDirtyCachesAll: this._isDirtyCachesAllPrerelease,
			pageClean,
		});
	}

	getAllBrew (pageClean) {
		return this._getAll_doCheckBuildCache({
			cache: this._cacheBrewLists,
			cachesAll: this._cachesAllBrew,
			isDirtyCachesAll: this._isDirtyCachesAllBrew,
			pageClean,
		});
	}

	getAllAll (pageClean) {
		if (!this._cachesAllAll[pageClean] || this._isDirtyCachesAllAll[pageClean]) {
			this._cachesAllAll[pageClean] = [
				...this.getAllSite(pageClean),
				...this.getAllPrerelease(pageClean),
				...this.getAllBrew(pageClean),
			];
		}
		delete this._isDirtyCachesAllAll[pageClean];
		return this._cachesAllAll[pageClean];
	}
}
