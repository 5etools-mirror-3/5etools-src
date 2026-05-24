import {DataLoaderDereferencerBase} from "./utils-dataloader-dereferencer-base.js";

/**
 * @abstract
 */
export class DataLoaderDereferencerGenericFeatures extends DataLoaderDereferencerBase {
	_page;
	_tag;
	_prop;

	async _pPreloadRefContentSite () { await globalThis.DataLoader.pCacheAndGetAllSite(this._page); }
	async _pPreloadRefContentPrerelease () { await globalThis.DataLoader.pCacheAndGetAllPrerelease(this._page); }
	async _pPreloadRefContentBrew () { await globalThis.DataLoader.pCacheAndGetAllBrew(this._page); }

	_dereference_mutEntity (toReplaceMeta, cpy) { /* Implement as required */ }

	dereference ({ent, entriesWithoutRefs, toReplaceMeta, ixReplace}) {
		const refUnpacked = DataUtil.generic.unpackUid(toReplaceMeta[this._prop], this._tag);
		const refHash = UrlUtil.URL_TO_HASH_BUILDER[this._page](refUnpacked);

		// Skip blocklisted
		if (ExcludeUtil.isInitialised && ExcludeUtil.isExcluded(refHash, this._prop, refUnpacked.source, {isNoCount: true})) {
			toReplaceMeta.array[toReplaceMeta.ix] = {};
			return new this.constructor._DereferenceMeta({cntReplaces: 1});
		}

		const cpy = this._getCopyFromCache({page: this._prop, entriesWithoutRefs, refUnpacked, refHash});
		if (!cpy) return new this.constructor._DereferenceMeta({cntReplaces: 0});

		if (!toReplaceMeta?.preserve?.prerequisite) delete cpy.prerequisite;
		this._dereference_mutEntity(toReplaceMeta, cpy);

		if (toReplaceMeta.name) cpy.name = toReplaceMeta.name;
		toReplaceMeta.array[toReplaceMeta.ix] = cpy;

		return new this.constructor._DereferenceMeta({cntReplaces: 1});
	}
}
