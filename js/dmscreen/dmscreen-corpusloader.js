export class RuleLoader {
	static _cache = {};

	static async pFill (book) {
		if (this._cache[book]) return;

		const data = await DataUtil.loadJSON(`data/generated/${book}.json`);
		Object.keys(data.data).forEach(b => {
			const ref = data.data[b];
			if (!this._cache[b]) this._cache[b] = {};
			ref.forEach((c, i) => {
				if (!this._cache[b][i]) this._cache[b][i] = {};
				c.entries.forEach(s => {
					this._cache[b][i][s.name] = s;
				});
			});
		});
	}

	static getFromCache (book, chapter, header) {
		return this._cache[book][chapter][header];
	}
}

class _CorpusLoaderBase {
	static _NOT_FOUND = {
		type: "section",
		name: "(Missing Content)",
		entries: [
			"The content you attempted to load could not be found. Is it homebrew, and not currently loaded?",
		],
	};

	_type;
	_cache = {};

	async pFill (corpusId) {
		const id = corpusId.toLowerCase();
		this._cache[id] ||= await DataLoader.pCacheAndGetHash(DataLoader.getPropPage(this._type), UrlUtil.encodeForHash(id));
	}

	getFromCache (corpusId, chapter, {isAllowMissing = false} = {}) {
		const pack = this._cache[corpusId.toLowerCase()];
		const outHead = pack?.[this._type];
		const outBody = pack?.[`${this._type}Data`]?.data?.[chapter];
		if (outHead && outBody) return {chapter: outBody, head: outHead};
		if (isAllowMissing) return null;
		return {chapter: MiscUtil.copy(_CorpusLoaderBase._NOT_FOUND), head: {source: VeCt.STR_GENERIC, id: VeCt.STR_GENERIC}};
	}
}

class _AdventureLoader extends _CorpusLoaderBase {
	_type = "adventure";
}

class _BookLoader extends _CorpusLoaderBase {
	_type = "book";
}

export const adventureLoader = new _AdventureLoader();
export const bookLoader = new _BookLoader();
