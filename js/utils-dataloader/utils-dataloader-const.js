export class DataLoaderConst {
	static SOURCE_SITE_ALL = Symbol("SOURCE_SITE_ALL");
	static SOURCE_PRERELEASE_ALL_CURRENT = Symbol("SOURCE_PRERELEASE_ALL_CURRENT");
	static SOURCE_BREW_ALL_CURRENT = Symbol("SOURCE_BREW_ALL_CURRENT");

	static ENTITY_NULL = Symbol("ENTITY_NULL");

	static LOADSPACE_SITE = Symbol("LOADSPACE_SITE");
	static LOADSPACE_PRERELEASE = Symbol("LOADSPACE_PRERELEASE");
	static LOADSPACE_BREW = Symbol("LOADSPACE_BREW");

	static _SOURCES_ALL_NON_SITE = new Set([
		this.SOURCE_PRERELEASE_ALL_CURRENT,
		this.SOURCE_BREW_ALL_CURRENT,
	]);

	static isSourceAllNonSite (source) {
		return this._SOURCES_ALL_NON_SITE.has(source);
	}
}
