export class ConverterStringBlocklist {
	static _getCleanString (str) { return str.toLowerCase().trim(); }

	constructor ({blocklist, blocklistIgnore}) {
		this._blocklist = blocklist instanceof Set ? blocklist : new Set(blocklist.map(ConverterStringBlocklist._getCleanString.bind(ConverterStringBlocklist)));
		this._blocklistIgnore = blocklistIgnore instanceof Set
			? blocklistIgnore
			: blocklistIgnore
				? new Set(blocklistIgnore.map(ConverterStringBlocklist._getCleanString.bind(ConverterStringBlocklist)))
				: null;
	}

	isBlocked (str) {
		const clean = this.constructor._getCleanString(str);
		if (this._blocklistIgnore?.has(clean)) return false;
		return this._blocklist.has(clean);
	}

	getWithBlocklistIgnore (ignores) {
		if (this._blocklistIgnore) throw new Error(`Already had blocklist ignores!`);
		return new this.constructor({
			blocklist: this._blocklist,
			blocklistIgnore: ignores,
		});
	}
}
