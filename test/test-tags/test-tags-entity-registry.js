import * as utS from "../../node/util-search-index.js";

export class TagTestUrlLookup {
	constructor (
		{
			fileAdditional,
			isLogSimilar,
		},
	) {
		this._fileAdditional = fileAdditional;
		this._isLogSimilar = isLogSimilar;
	}

	_ALL_URLS_SET = new Set();
	_ALL_URLS_LIST = [];

	// Versions are distinct, as they are valid UIDs, but not valid URLs
	_ALL_URLS_SET__VERSIONS = new Set();
	_ALL_URLS_LIST__VERSIONS = [];

	_CAT_ID_BLOCKLIST = new Set([
		Parser.CAT_ID_PAGE,
	]);

	_CLASS_SUBCLASS_LOOKUP = {};

	_addIndexItem (indexItem) {
		if (this._CAT_ID_BLOCKLIST.has(indexItem.c)) return;

		const url = `${UrlUtil.categoryToPage(indexItem.c).toLowerCase()}#${(indexItem.u).toLowerCase().trim()}`;

		this._ALL_URLS_SET.add(url);
		this._ALL_URLS_LIST.push(url);
	}

	_addEntityItem (ent, page) {
		const url = `${page.toLowerCase()}#${(UrlUtil.URL_TO_HASH_BUILDER[page](ent)).toLowerCase().trim()}`;

		if (ent._versionBase_isVersion) {
			this._ALL_URLS_SET__VERSIONS.add(url);
			this._ALL_URLS_LIST__VERSIONS.push(url);
			return;
		}

		this._ALL_URLS_SET.add(url);
		this._ALL_URLS_LIST.push(url);
	}

	/* -------------------------------------------- */

	async pInit () {
		await this._pInit_pPopulateUrls();
		await this._pInit_pPopulateUrlsAdditionalFluff();
		await this._pInit_pPopulateClassSubclassIndex();
	}

	async _pInit_pPopulateUrls () {
		const primaryIndex = Omnidexer.decompressIndex(await utS.UtilSearchIndex.pGetIndex({doLogging: false, noFilter: true}));
		primaryIndex
			.forEach(indexItem => this._addIndexItem(indexItem));
		const secondaryIndexItem = Omnidexer.decompressIndex(await utS.UtilSearchIndex.pGetIndexAdditionalItem({baseIndex: primaryIndex.last().id + 1, doLogging: false}));
		secondaryIndexItem
			.forEach(indexItem => this._addIndexItem(indexItem));

		if (this._fileAdditional) {
			const brewIndexItems = Omnidexer.decompressIndex(await utS.UtilSearchIndex.pGetIndexLocalHomebrew({baseIndex: secondaryIndexItem.last().id + 1, filepath: this._fileAdditional}));
			brewIndexItems
				.forEach(indexItem => this._addIndexItem(indexItem));
		}

		(await DataLoader.pCacheAndGetAllSite("itemProperty"))
			.forEach(ent => this._addEntityItem(ent, "itemProperty"));

		(await DataLoader.pCacheAndGetAllSite("feat"))
			.filter(ent => ent._versionBase_isVersion)
			.forEach(ent => this._addEntityItem(ent, UrlUtil.PG_FEATS));
	}

	async _pInit_pPopulateUrlsAdditionalFluff () {
		// TODO(Future) revise/expand
		(await DataUtil.monsterFluff.pLoadAll())
			.forEach(ent => this._addEntityItem(ent, "monsterFluff"));
		(await DataUtil.raceFluff.loadJSON()).raceFluff
			.forEach(ent => this._addEntityItem(ent, "raceFluff"));
	}

	async _pInit_pPopulateClassSubclassIndex () {
		const classData = await DataUtil.class.loadJSON();

		const tmpClassIxFeatures = {};
		classData.class.forEach(cls => {
			cls.name = cls.name.toLowerCase();
			cls.source = (cls.source || Parser.SRC_PHB).toLowerCase();

			this._CLASS_SUBCLASS_LOOKUP[cls.source] = this._CLASS_SUBCLASS_LOOKUP[cls.source] || {};
			this._CLASS_SUBCLASS_LOOKUP[cls.source][cls.name] = {};

			const ixFeatures = [];
			cls.classFeatures.forEach((levelFeatures, ixLevel) => {
				levelFeatures.forEach((_, ixFeature) => {
					ixFeatures.push(`${ixLevel}-${ixFeature}`);
				});
			});
			MiscUtil.set(tmpClassIxFeatures, cls.source, cls.name, ixFeatures);
		});

		classData.subclass.forEach(sc => {
			sc.shortName = (sc.shortName || sc.name).toLowerCase();
			sc.source = (sc.source || sc.classSource).toLowerCase();
			sc.className = sc.className.toLowerCase();
			sc.classSource = sc.classSource.toLowerCase();

			if (sc.className === VeCt.STR_GENERIC.toLowerCase() && sc.classSource === VeCt.STR_GENERIC.toLowerCase()) return;

			this._CLASS_SUBCLASS_LOOKUP[sc.classSource][sc.className][sc.source] = this._CLASS_SUBCLASS_LOOKUP[sc.classSource][sc.className][sc.source] || {};
			this._CLASS_SUBCLASS_LOOKUP[sc.classSource][sc.className][sc.source][sc.shortName] = MiscUtil.copyFast(MiscUtil.get(tmpClassIxFeatures, sc.classSource, sc.className));
		});
	}

	getSubclassFeatureIndex (className, classSource, subclassName, subclassSource) {
		classSource = classSource || Parser.getTagSource("class");
		subclassSource = subclassSource || Parser.SRC_PHB;

		className = className.toLowerCase();
		classSource = classSource.toLowerCase();
		subclassName = subclassName.toLowerCase();
		subclassSource = subclassSource.toLowerCase();

		return MiscUtil.get(this._CLASS_SUBCLASS_LOOKUP, classSource, className, subclassSource, subclassName);
	}

	/* -------------------------------------------- */

	hasUrl (url) { return this._ALL_URLS_SET.has(url); }

	hasVersionUrl (url) { return this._ALL_URLS_SET__VERSIONS.has(url); }

	getSimilarUrls (url) {
		const mSimilar = /^\w+\.html#\w+/.exec(url);
		if (!mSimilar) return [];

		return this._ALL_URLS_LIST
			.filter(url => url.startsWith(mSimilar[0]))
			.map(url => `\t${url}`)
			.join("\n");
	}

	/* -------------------------------------------- */

	getEncodedProxy (uid, tag, prop = null) {
		prop ||= tag;
		const unpacked = DataUtil.proxy.unpackUid(prop, uid, tag);
		const hashBuilder = UrlUtil.URL_TO_HASH_BUILDER[prop];
		if (!hashBuilder) throw new Error(`No hash builder found for prop "${prop}"!`);
		const hash = hashBuilder(unpacked);
		return `${Renderer.tag.getPage(tag) || prop}#${hash}`.toLowerCase().trim();
	}

	/* -------------------------------------------- */

	getLogPtSimilarUrls ({url}) {
		if (!this._isLogSimilar) return "";

		const ptSimilarUrls = this.getSimilarUrls(url);
		if (!ptSimilarUrls) return "";
		return `Similar URLs were:\n${ptSimilarUrls}\n`;
	}
}
