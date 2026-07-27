export class DmScreenElementCache {
	_cache = {};
	_eleScratch;

	init () {
		this._eleScratch = veT`<div class="ve-fixed dmsec__wrp-scratch"></div>`
			.vee.appendTo(document.body);
	}

	doCacheElementsForSaveSlot ({idSaveSlot, cacheableElementsInfos}) {
		delete this._cache[idSaveSlot];

		cacheableElementsInfos
			.forEach(cacheableElementsInfo => {
				const meta = cacheableElementsInfo.panelApp.getSaveSlotCacheableElementMeta();
				if (!meta) return;

				(this._cache[idSaveSlot] ||= {})[cacheableElementsInfo.cacheKey] = meta;
				Object.values(meta)
					.forEach(ele => this._eleScratch.vee.appendsMove(ele));
			});
	}

	doRestoreElementsForSaveSlot ({idSaveSlot, cacheableElementsInfos}) {
		if (!this._cache[idSaveSlot]) return;

		cacheableElementsInfos
			.forEach(cacheableElementsInfo => {
				const meta = this._cache[idSaveSlot][cacheableElementsInfo.cacheKey];
				if (!meta) return;

				cacheableElementsInfo.panelApp.doRestoreSaveSlotCacheableElementMeta(meta);
			});

		delete this._cache[idSaveSlot];
	}
}
