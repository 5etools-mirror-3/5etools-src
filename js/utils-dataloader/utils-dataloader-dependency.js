import {DataLoaderConst} from "./utils-dataloader-const.js";

export class DataLoaderDependency {
	constructor ({page}) {
		this._page = page;

		this._psLoading = {};
	}

	async pLoad ({loadspace, lockToken2}) {
		if (loadspace == null || loadspace === DataLoaderConst.LOADSPACE_SITE) {
			this._psLoading[DataLoaderConst.LOADSPACE_SITE] ||= globalThis.DataLoader.pCacheAndGetAllSite(this._page, {lockToken2});
			await this._psLoading[DataLoaderConst.LOADSPACE_SITE];
		}

		if (loadspace == null || loadspace === DataLoaderConst.LOADSPACE_PRERELEASE) {
			this._psLoading[DataLoaderConst.LOADSPACE_PRERELEASE] ||= globalThis.DataLoader.pCacheAndGetAllPrerelease(this._page, {lockToken2});
			await this._psLoading[DataLoaderConst.LOADSPACE_PRERELEASE];
		}

		if (loadspace == null || loadspace === DataLoaderConst.LOADSPACE_BREW) {
			this._psLoading[DataLoaderConst.LOADSPACE_BREW] ||= globalThis.DataLoader.pCacheAndGetAllBrew(this._page, {lockToken2});
			await this._psLoading[DataLoaderConst.LOADSPACE_BREW];
		}
	}
}
