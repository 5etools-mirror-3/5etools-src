import {DataLoaderDereferencerGenericFeatures} from "./utils-dataloader-dereferencer-genericfeatures.js";

export class DataLoaderDereferencerOptionalfeatures extends DataLoaderDereferencerGenericFeatures {
	_page = UrlUtil.PG_OPT_FEATURES;
	_tag = "optfeature";
	_prop = "optionalfeature";

	_dereference_mutEntity (toReplaceMeta, cpy) {
		delete cpy.featureType;

		if (toReplaceMeta?.preserve?.consumes && cpy.entries) {
			const entCost = Renderer.optionalfeature.getCostEntry(cpy);
			cpy.entries.unshift(entCost);
		}
	}
}
