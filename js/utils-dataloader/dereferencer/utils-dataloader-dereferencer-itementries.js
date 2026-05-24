import {DataLoaderDereferencerBase} from "./utils-dataloader-dereferencer-base.js";

export class DataLoaderDereferencerItemEntries extends DataLoaderDereferencerBase {
	async _pPreloadRefContentSite () { await globalThis.DataLoader.pCacheAndGetAllSite(UrlUtil.PG_ITEMS); }
	async _pPreloadRefContentPrerelease () { await globalThis.DataLoader.pCacheAndGetAllPrerelease(UrlUtil.PG_ITEMS); }
	async _pPreloadRefContentBrew () { await globalThis.DataLoader.pCacheAndGetAllBrew(UrlUtil.PG_ITEMS); }

	dereference ({ent, entriesWithoutRefs, toReplaceMeta, ixReplace}) {
		const refUnpacked = DataUtil.generic.unpackUid(toReplaceMeta.itemEntry, "itemEntry");
		const refHash = UrlUtil.URL_TO_HASH_BUILDER["itemEntry"](refUnpacked);

		const cpy = this._getCopyFromCache({page: "itemEntry", entriesWithoutRefs, refUnpacked, refHash});
		if (!cpy) return new this.constructor._DereferenceMeta({cntReplaces: 0});

		cpy.entriesTemplate = this.constructor._WALKER_MOD.walk(
			cpy.entriesTemplate,
			{
				string: (str) => {
					return Renderer.utils.applyTemplate(
						ent,
						str,
					);
				},
			},
		);

		toReplaceMeta.array.splice(toReplaceMeta.ix, 1, ...cpy.entriesTemplate);

		return new this.constructor._DereferenceMeta({
			cntReplaces: 1,
			// Offset by the length of the array we just merged in (minus one, since we replaced an
			//   element)
			offsetIx: cpy.entriesTemplate.length - 1,
		});
	}
}
