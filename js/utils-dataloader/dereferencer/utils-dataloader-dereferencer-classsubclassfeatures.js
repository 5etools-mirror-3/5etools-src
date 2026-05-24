import {DataLoaderDereferencerBase} from "./utils-dataloader-dereferencer-base.js";

export class DataLoaderDereferencerClassSubclassFeatures extends DataLoaderDereferencerBase {
	dereference ({ent, entriesWithoutRefs, toReplaceMeta, ixReplace}) {
		const prop = toReplaceMeta.type === "refClassFeature" ? "classFeature" : "subclassFeature";
		const refUnpacked = toReplaceMeta.type === "refClassFeature"
			? DataUtil.class.unpackUidClassFeature(toReplaceMeta.classFeature)
			: DataUtil.class.unpackUidSubclassFeature(toReplaceMeta.subclassFeature);
		const refHash = UrlUtil.URL_TO_HASH_BUILDER[prop](refUnpacked);

		// Skip blocklisted
		if (ExcludeUtil.isInitialised && ExcludeUtil.isExcluded(refHash, prop, refUnpacked.source, {isNoCount: true})) {
			toReplaceMeta.array[toReplaceMeta.ix] = {};
			return new this.constructor._DereferenceMeta({cntReplaces: 1});
		}

		const cpy = this._getCopyFromCache({page: prop, entriesWithoutRefs, refUnpacked, refHash});
		if (!cpy) return new this.constructor._DereferenceMeta({cntReplaces: 0});

		delete cpy.header;
		if (toReplaceMeta.name) cpy.name = toReplaceMeta.name;
		toReplaceMeta.array[toReplaceMeta.ix] = cpy;
		return new this.constructor._DereferenceMeta({cntReplaces: 1});
	}
}
