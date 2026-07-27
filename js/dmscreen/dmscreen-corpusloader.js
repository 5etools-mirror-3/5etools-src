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

	constructor () {
		this._cache = {};
		this._pLoadings = {};
		this._availableOfficial = new Set();

		this._indexOfficial = null;
	}

	async pInit () {
		const indexPath = this._getIndexPath();
		this._indexOfficial = await DataUtil.loadJSON(indexPath);
		this._indexOfficial[this._type].forEach(meta => this._availableOfficial.add(meta.id.toLowerCase()));
	}

	_getIndexPath () {
		switch (this._type) {
			case "adventure": return `${Renderer.get().baseUrl}data/adventures.json`;
			case "book": return `${Renderer.get().baseUrl}data/books.json`;
			default: throw new Error(`Unknown loader type "${this._type}"`);
		}
	}

	_getJsonPath (bookOrAdventure) {
		switch (this._type) {
			case "adventure": return `${Renderer.get().baseUrl}data/adventure/adventure-${bookOrAdventure.toLowerCase()}.json`;
			case "book": return `${Renderer.get().baseUrl}data/book/book-${bookOrAdventure.toLowerCase()}.json`;
			default: throw new Error(`Unknown loader type "${this._type}"`);
		}
	}

	async _pGetPrereleaseData ({advBookId, prop}) {
		return this._pGetPrereleaseBrewData({advBookId, prop, brewUtil: PrereleaseUtil});
	}

	async _pGetBrewData ({advBookId, prop}) {
		return this._pGetPrereleaseBrewData({advBookId, prop, brewUtil: BrewUtil2});
	}

	async _pGetPrereleaseBrewData ({advBookId, prop, brewUtil}) {
		const searchFor = advBookId.toLowerCase();
		const brew = await brewUtil.pGetBrewProcessed();
		switch (this._type) {
			case "adventure":
			case "book": {
				return (brew[prop] || []).find(it => it.id.toLowerCase() === searchFor);
			}
			default: throw new Error(`Unknown loader type "${this._type}"`);
		}
	}

	async pFill (advBookId) {
		if (!this._pLoadings[advBookId]) {
			this._pLoadings[advBookId] = (async () => {
				this._cache[advBookId] = {};

				let head, body;
				if (this._availableOfficial.has(advBookId.toLowerCase())) {
					head = this._indexOfficial[this._type].find(it => it.id.toLowerCase() === advBookId.toLowerCase());
					body = await DataUtil.loadJSON(this._getJsonPath(advBookId));
				} else {
					head = await this._pGetBrewData({advBookId, prop: this._type});
					body = await this._pGetBrewData({advBookId, prop: `${this._type}Data`});
				}
				if (!head || !body) return;

				this._cache[advBookId] = {head, chapters: {}};
				body.data.forEach((chap, i) => this._cache[advBookId].chapters[i] = chap);
			})();
		}
		await this._pLoadings[advBookId];
	}

	getFromCache (adventure, chapter, {isAllowMissing = false} = {}) {
		const outHead = this._cache?.[adventure]?.head;
		const outBody = this._cache?.[adventure]?.chapters?.[chapter];
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
