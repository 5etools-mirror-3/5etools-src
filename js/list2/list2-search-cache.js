export class ListSearchCache {
	_fnIsMatch;
	_searchTerm = null;
	_searchedItems = null;

	constructor ({fnIsMatch}) {
		this._fnIsMatch = fnIsMatch;
	}

	_getMatchingItems_getCandidates ({items, searchTerm}) {
		if (!this._searchTerm || !searchTerm.startsWith(this._searchTerm)) return items;
		return this._searchedItems;
	}

	getMatchingItems ({items, searchTerm}) {
		const candidates = this._getMatchingItems_getCandidates({items, searchTerm});
		this._searchTerm = searchTerm;
		return (this._searchedItems = candidates.filter(item => this._fnIsMatch(item, searchTerm)));
	}

	setItems ({items}) {
		this._searchTerm = "";
		this._searchedItems = items;
		return items.slice(0);
	}

	doReset () {
		this._searchTerm = null;
		this._searchedItems = null;
	}
}
