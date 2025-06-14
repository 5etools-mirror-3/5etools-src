/** @abstract */
class _SyntaxMetaBase {
	constructor ({isNegate = false}) {
		this.isNegate = !!isNegate;
	}

	isMatch (res, resCache) { return this._isMatch({res, resCache}) === this.isNegate; }

	/**
	 * @abstract
	 * @return boolean
	 */
	_isMatch ({res, resCache}) { throw new Error("Unimplemented!"); }
}

export class SyntaxMetaSource extends _SyntaxMetaBase {
	constructor ({source, ...rest}) {
		super({...rest});
		this.source = source;
	}

	_isMatch ({res, resCache}) {
		return resCache.source != null && this.source === resCache.source;
	}
}

export class SyntaxMetaCategories extends _SyntaxMetaBase {
	constructor ({categories, ...rest}) {
		super({...rest});
		this.categories = categories;
	}

	_isMatch ({res, resCache}) {
		return this.categories.includes(resCache.category);
	}
}

export class SyntaxMetaPageRange extends _SyntaxMetaBase {
	constructor ({pageRange, ...rest}) {
		super({...rest});
		this.pageRange = pageRange;
	}

	_isMatch ({res, resCache}) {
		const [rangeLow, rangeHigh] = this.pageRange;
		return res.doc.p != null && (res.doc.p >= rangeLow && res.doc.p <= rangeHigh);
	}
}

export class SyntaxMetaGroup extends _SyntaxMetaBase {
	constructor ({syntaxMetas, ...rest}) {
		super({...rest});
		this.syntaxMetas = syntaxMetas;
	}

	_isMatch ({res, resCache}) {
		return this.syntaxMetas.some(syntaxMeta => syntaxMeta.isMatch(res, resCache));
	}
}
