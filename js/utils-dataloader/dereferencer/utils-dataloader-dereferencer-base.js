import {DataLoaderConst} from "../utils-dataloader-const.js";

export class DataLoaderDereferencerBase {
	static _DereferenceMeta = class {
		constructor ({cntReplaces = 0, offsetIx = 0}) {
			this.cntReplaces = cntReplaces;
			this.offsetIx = offsetIx;
		}
	};

	static _WALKER_MOD = MiscUtil.getWalker({
		keyBlocklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLOCKLIST,
	});

	/* -------------------------------------------- */

	_pPreloadingRefContentSite = null;
	_pPreloadingRefContentPrerelease = null;
	_pPreloadingRefContentBrew = null;

	_preloadingPrereleaseLastIdent = null;
	_preloadingBrewLastIdent = null;

	async pPreloadRefContent ({loadspace = null} = {}) {
		if (
			(loadspace || DataLoaderConst.LOADSPACE_SITE) === DataLoaderConst.LOADSPACE_SITE
		) await (this._pPreloadingRefContentSite = this._pPreloadingRefContentSite || this._pPreloadRefContentSite());

		if (
			(loadspace || DataLoaderConst.LOADSPACE_PRERELEASE) === DataLoaderConst.LOADSPACE_PRERELEASE
			&& typeof PrereleaseUtil !== "undefined"
		) {
			const identPrerelease = PrereleaseUtil.getCacheIteration();
			if (identPrerelease !== this._preloadingPrereleaseLastIdent) this._pPreloadingRefContentPrerelease = null;
			this._preloadingPrereleaseLastIdent = identPrerelease;
			await (this._pPreloadingRefContentPrerelease = this._pPreloadingRefContentPrerelease || this._pPreloadRefContentPrerelease());
		}

		if (
			(loadspace || DataLoaderConst.LOADSPACE_BREW) === DataLoaderConst.LOADSPACE_BREW
			&& typeof BrewUtil2 !== "undefined"
		) {
			const identBrew = BrewUtil2.getCacheIteration();
			if (identBrew !== this._preloadingBrewLastIdent) this._pPreloadingRefContentBrew = null;
			this._preloadingBrewLastIdent = identBrew;
			await (this._pPreloadingRefContentBrew = this._pPreloadingRefContentBrew || this._pPreloadRefContentBrew());
		}
	}

	async _pPreloadRefContentSite () { /* Implement as required */ }
	async _pPreloadRefContentPrerelease () { /* Implement as required */ }
	async _pPreloadRefContentBrew () { /* Implement as required */ }

	/* -------------------------------------------- */

	dereference ({ent, entriesWithoutRefs, toReplaceMeta, ixReplace}) { throw new Error("Unimplemented!"); }

	_getCopyFromCache ({page, entriesWithoutRefs, refUnpacked, refHash}) {
		if (page.toLowerCase().endsWith(".html")) throw new Error(`Could not dereference "${page}" content. Dereferencing is only supported for props!`);

		// Prefer content from our active load, where available
		const out = entriesWithoutRefs[page]?.[refHash]
			? MiscUtil.copyFast(entriesWithoutRefs[page]?.[refHash])
			: globalThis.DataLoader.getFromCache(page, refUnpacked.source, refHash, {isCopy: true});
		if (!out) return out;
		out.type ||= "entries";
		return out;
	}
}
