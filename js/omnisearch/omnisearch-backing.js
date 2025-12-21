import {OmnisearchState} from "./omnisearch-state.js";
import {VetoolsConfig} from "../utils-config/utils-config-config.js";
import {SITE_STYLE__CLASSIC} from "../consts.js";
import {SyntaxMetaCategories, SyntaxMetaGroup, SyntaxMetaPageRange, SyntaxMetaSource} from "./omnisearch-models.js";
import {PARTNERED_CONTENT_MODE_ALL, PARTNERED_CONTENT_MODE_LOCAL, PARTNERED_CONTENT_MODE_NONE} from "./omnisearch-consts.js";

export class OmnisearchBacking {
	static _CATEGORY_COUNTS = {};

	static _searchIndex = null;
	static _adventureBookLookup = null; // A map of `<sourceLower>: (adventureCatId|bookCatId)`
	static _pLoadSearch = null;

	static async _pInit () {
		this._pLoadSearch ||= this._pDoSearchLoad();
		await this._pLoadSearch;
	}

	static async _pDoSearchLoad () {
		elasticlunr.clearStopWords();
		this._searchIndex = elasticlunr(function () {
			this.addField("n");
			this.addField("cf");
			this.addField("s");
			this.setRef("id");
		});
		SearchUtil.removeStemmer(this._searchIndex);

		const siteIndex = Omnidexer.decompressIndex(await DataUtil.loadJSON(`${Renderer.get().baseUrl}search/index.json`));
		siteIndex.forEach(it => this._addToIndex(it));

		const prereleaseIndex = await PrereleaseUtil.pGetSearchIndex({id: this._maxId + 1});
		prereleaseIndex.forEach(it => this._addToIndex(it));

		const brewIndex = await BrewUtil2.pGetSearchIndex({id: this._maxId + 1});
		brewIndex.forEach(it => this._addToIndex(it));

		// region Partnered homebrew
		//   Note that we filter out anything which is already in the user's homebrew, to avoid double-indexing
		const sourcesBrew = new Set(
			BrewUtil2.getSources()
				.map(src => src.json),
		);

		const partneredIndexRaw = Omnidexer.decompressIndex(await DataUtil.loadJSON(`${Renderer.get().baseUrl}search/index-partnered.json`));
		const partneredIndex = partneredIndexRaw
			.filter(it => !sourcesBrew.has(it.s));
		// Re-ID, to:
		//   - override the base partnered index IDs (which has statically-generated IDs starting at 0)
		//   - avoid any holes
		partneredIndex
			.forEach((it, i) => it.id = this._maxId + 1 + i);
		partneredIndex.forEach(it => {
			it.isRemote = true;
			this._addToIndex(it);
		});
		// endregion

		this._adventureBookLookup = {};
		[prereleaseIndex, brewIndex, siteIndex, partneredIndex].forEach(index => {
			index.forEach(it => {
				if (it.c === Parser.CAT_ID_ADVENTURE || it.c === Parser.CAT_ID_BOOK) this._adventureBookLookup[it.s.toLowerCase()] = it.c;
			});
		});

		this._initReInCategory();
	}

	static _maxId = null;

	static _addToIndex (d) {
		this._maxId = d.id;
		d.cf = Parser.pageCategoryToFull(d.c);
		if (!this._CATEGORY_COUNTS[d.cf]) this._CATEGORY_COUNTS[d.cf] = 1;
		else this._CATEGORY_COUNTS[d.cf]++;
		this._searchIndex.addDoc(d);
	}

	static _IN_CATEGORY_ALIAS = null;
	static _IN_CATEGORY_ALIAS_SHORT = null;
	static _RE_SYNTAX__IN_CATEGORY = null;

	static _initReInCategory () {
		if (this._RE_SYNTAX__IN_CATEGORY) return;

		const inCategoryAlias = {
			"creature": [Parser.pageCategoryToFull(Parser.CAT_ID_CREATURE)],
			"monster": [Parser.pageCategoryToFull(Parser.CAT_ID_CREATURE)],

			[new Renderer.tag.TagQuickref().tagName]: [Parser.pageCategoryToFull(Parser.CAT_ID_QUICKREF)],
			[new Renderer.tag.TagRace().tagName]: [Parser.pageCategoryToFull(Parser.CAT_ID_RACE)],
			[new Renderer.tag.TagReward().tagName]: [Parser.pageCategoryToFull(Parser.CAT_ID_OTHER_REWARD)],
			[new Renderer.tag.TagOptfeature().tagName]: Parser.CAT_ID_GROUPS["optionalfeature"].map(catId => Parser.pageCategoryToFull(catId)),
			[new Renderer.tag.TagClassFeature().tagName]: [Parser.pageCategoryToFull(Parser.CAT_ID_CLASS_FEATURE)],
			[new Renderer.tag.TagSubclassFeature().tagName]: [Parser.pageCategoryToFull(Parser.CAT_ID_SUBCLASS_FEATURE)],
			[new Renderer.tag.TagVehupgrade().tagName]: Parser.CAT_ID_GROUPS["vehicleUpgrade"].map(catId => Parser.pageCategoryToFull(catId)),
			[new Renderer.tag.TagLegroup().tagName]: [Parser.pageCategoryToFull(Parser.CAT_ID_LEGENDARY_GROUP)],
			[new Renderer.tag.TagCharoption().tagName]: [Parser.pageCategoryToFull(Parser.CAT_ID_CHAR_CREATION_OPTIONS)],
			[new Renderer.tag.TagItemMastery().tagName]: [Parser.pageCategoryToFull(Parser.CAT_ID_ITEM_MASTERY)],
		};

		inCategoryAlias["optionalfeature"] = inCategoryAlias["optfeature"];
		inCategoryAlias["mastery"] = inCategoryAlias["itemMastery"];

		const inCategoryAliasShort = {
			"sp": [Parser.pageCategoryToFull(Parser.CAT_ID_SPELL)],
			"bg": [Parser.pageCategoryToFull(Parser.CAT_ID_BACKGROUND)],
			"itm": [Parser.pageCategoryToFull(Parser.CAT_ID_ITEM)],
			"tbl": [Parser.pageCategoryToFull(Parser.CAT_ID_TABLE)],
			"bk": [Parser.pageCategoryToFull(Parser.CAT_ID_BOOK)],
			"adv": [Parser.pageCategoryToFull(Parser.CAT_ID_ADVENTURE)],
			"ft": [Parser.pageCategoryToFull(Parser.CAT_ID_FEAT)],
			"con": [Parser.pageCategoryToFull(Parser.CAT_ID_CONDITION)],
			"veh": [Parser.pageCategoryToFull(Parser.CAT_ID_VEHICLE)],
			"obj": [Parser.pageCategoryToFull(Parser.CAT_ID_OBJECT)],
			"god": [Parser.pageCategoryToFull(Parser.CAT_ID_DEITY)],
			"rcp": [Parser.pageCategoryToFull(Parser.CAT_ID_RECIPES)], // :^)

			"cf": inCategoryAlias["classFeature"],
			"scf": inCategoryAlias["subclassFeature"],
			"mon": inCategoryAlias["monster"],
			"opf": inCategoryAlias["optfeature"],
		};

		const getLowercaseKeyed = obj => {
			return Object.fromEntries(
				Object.entries(obj)
					.map(([k, v]) => [k.toLowerCase(), v]),
			);
		};

		this._IN_CATEGORY_ALIAS = getLowercaseKeyed(inCategoryAlias);
		this._IN_CATEGORY_ALIAS_SHORT = getLowercaseKeyed(inCategoryAliasShort);

		// Order is important; approx longest first
		const ptCategory = [
			...Object.keys(this._CATEGORY_COUNTS).map(it => it.toLowerCase().escapeRegexp()),
			...Object.keys(this._IN_CATEGORY_ALIAS),
			...Object.keys(this._IN_CATEGORY_ALIAS_SHORT),
		]
			.join("|");

		this._RE_SYNTAX__IN_CATEGORY = new RegExp(`\\bin:\\s*(?<isNegate>!)?(?<category>${ptCategory})s?\\b`, "ig");
	}

	/* -------------------------------------------- */

	static async pGetFilteredResults (results, {isApplySrdFilter = false, isApplyPartneredFilter = false} = {}) {
		if (isApplySrdFilter && OmnisearchState.isSrdOnly) {
			results = results.filter(res => res.doc.r || res.doc.r2);
		}

		if (isApplyPartneredFilter) {
			switch (OmnisearchState.getPartneredMode()) {
				case PARTNERED_CONTENT_MODE_ALL: break;
				case PARTNERED_CONTENT_MODE_LOCAL: results = results.filter(res => (!res.doc.s || !res.doc.dP) || (res.doc.dP && !res.doc.isRemote)); break;
				case PARTNERED_CONTENT_MODE_NONE: results = results.filter(res => !res.doc.s || !res.doc.dP); break;
				default: throw new Error(`Unhandled partnered content search mode "${OmnisearchState.getPartneredMode()}"!`);
			}
		}

		if (!OmnisearchState.isShowBrew) {
			// Always filter in partnered, as these are handled by the more specific filter, above
			results = results.filter(res => !res.doc.s || res.doc.dP || !BrewUtil2.hasSourceJson(res.doc.s));
		}

		if (!OmnisearchState.isShowUa) {
			results = results.filter(res => !res.doc.s || !SourceUtil.isNonstandardSourceWotc(res.doc.s));
		}

		if (!OmnisearchState.isShowLegacy) {
			results = results.filter(res => !res.doc.s || !SourceUtil.isLegacySourceWotc(res.doc.s));
		}

		if (!OmnisearchState.isShowBlocklisted && ExcludeUtil.getList().length) {
			const resultsNxt = [];
			for (const res of results) {
				if (res.doc.c === Parser.CAT_ID_QUICKREF || res.doc.c === Parser.CAT_ID_PAGE) {
					resultsNxt.push(res);
					continue;
				}

				const bCat = Parser.pageCategoryToProp(res.doc.c);
				if (bCat !== "item") {
					if (!ExcludeUtil.isExcluded(res.doc.u, bCat, res.doc.s, {isNoCount: true})) resultsNxt.push(res);
					continue;
				}

				const item = await DataLoader.pCacheAndGetHash(UrlUtil.PG_ITEMS, res.doc.u);
				if (!Renderer.item.isExcluded(item, {hash: res.doc.u})) resultsNxt.push(res);
			}
			results = resultsNxt;
		}

		const styleHint = VetoolsConfig.get("styleSwitcher", "style");
		results
			.forEach(result => this._mutResultScores({result, styleHint}));
		results.sort((a, b) => SortUtil.ascSort(b.score, a.score));

		return results;
	}

	/* -------------------------------------------- */

	static _RE_SYNTAX__SOURCE = /\bsource:\s*(?<isNegate>!)?(?<source>.*)\b/ig;
	static _RE_SYNTAX__PAGE = /\bpage:\s*(?<isNegate>!)?(?<pageStart>\d+)\s*(?:-\s*(?<pageEnd>\d+)\s*)?\b/ig;

	static async pGetResults (searchTerm) {
		await this._pInit();

		searchTerm = (searchTerm || "").toAscii();

		const syntaxMetasCategory = [];
		const syntaxMetasSource = [];
		const syntaxMetasPageRange = [];

		searchTerm = searchTerm
			.replace(this._RE_SYNTAX__SOURCE, (...m) => {
				const {isNegate, source} = m.at(-1);
				syntaxMetasSource.push(new SyntaxMetaSource({
					isNegate: !!isNegate,
					source: source.trim().toLowerCase(),
				}));
				return "";
			})
			.replace(this._RE_SYNTAX__PAGE, (...m) => {
				const {isNegate, pageStart, pageEnd} = m.at(-1);
				syntaxMetasPageRange.push(new SyntaxMetaPageRange({
					isNegate: !!isNegate,
					pageRange: [
						Number(pageStart),
						pageEnd ? Number(pageEnd) : Number(pageStart),
					],
				}));
				return "";
			})
			.replace(this._RE_SYNTAX__IN_CATEGORY, (...m) => {
				let {isNegate, category} = m.at(-1);
				category = category.toLowerCase().trim();

				const categories = (
					this._IN_CATEGORY_ALIAS[category]
					|| this._IN_CATEGORY_ALIAS_SHORT[category]
					|| [category]
				)
					.map(it => it.toLowerCase());

				syntaxMetasCategory.push(new SyntaxMetaCategories({
					isNegate: !!isNegate,
					categories,
				}));
				return "";
			})
			.replace(/\s+/g, " ")
			.trim();

		const results = await this._pGetResults_pGetBaseResults({
			searchTerm,
			syntaxMetas: [
				syntaxMetasCategory.length
					? new SyntaxMetaGroup({syntaxMetas: syntaxMetasCategory})
					: null,
				syntaxMetasSource.length
					? new SyntaxMetaGroup({syntaxMetas: syntaxMetasSource})
					: null,
				syntaxMetasPageRange.length
					? new SyntaxMetaGroup({syntaxMetas: syntaxMetasPageRange})
					: null,
			]
				.filter(Boolean),
		});

		return this.pGetFilteredResults(results, {isApplySrdFilter: true, isApplyPartneredFilter: true});
	}

	static _pGetResults_pGetBaseResults (
		{
			searchTerm,
			syntaxMetas,
		},
	) {
		if (!syntaxMetas.length) {
			return this._searchIndex.search(
				searchTerm,
				{
					fields: {
						n: {boost: 5, expand: true},
						s: {expand: true},
					},
					bool: "AND",
					expand: true,
				},
			);
		}

		const resultsUnfiltered = searchTerm
			? this._searchIndex
				.search(
					searchTerm,
					{
						fields: {
							n: {boost: 5, expand: true},
							s: {expand: true},
						},
						bool: "AND",
						expand: true,
					},
				)
			: Object.values(this._searchIndex.documentStore.docs).map(it => ({doc: it}));

		return resultsUnfiltered
			.filter(res => {
				const resCache = {
					source: res.doc.s ? Parser.sourceJsonToAbv(res.doc.s).toLowerCase() : null,
					category: res.doc.cf.toLowerCase(),
				};
				return syntaxMetas.every(syntaxMeta => syntaxMeta.isMatch(res, resCache));
			});
	}

	/* -------------------------------------------- */

	static _SOURCES_CORE_MODERN = new Set([
		Parser.SRC_XPHB,
		Parser.SRC_XDMG,
		Parser.SRC_XMM,
	]);

	static _SOURCES_CORE_LEGACY = new Set([
		Parser.SRC_PHB,
		Parser.SRC_DMG,
		Parser.SRC_MM,
	]);

	static _CATEGORIES_DEPRIORITIZED = new Set([
		Parser.CAT_ID_RECIPES,
		Parser.CAT_ID_LANGUAGE,
		Parser.CAT_ID_CARD,
	]);

	static _CATEGORIES_DEPRIORITIZED_MODERN = new Set([
		Parser.CAT_ID_QUICKREF,
	]);

	static _mutResultScores ({result, styleHint}) {
		if ((styleHint !== SITE_STYLE__CLASSIC ? this._SOURCES_CORE_MODERN : this._SOURCES_CORE_LEGACY).has(result.doc.s)) result.score *= 1.1;
		if (SourceUtil.isNonstandardSource(result.doc.s)) result.score *= 0.66;
		if (styleHint !== SITE_STYLE__CLASSIC && SourceUtil.isLegacySourceWotc(result.doc.s)) result.score *= 0.75;

		if (this._CATEGORIES_DEPRIORITIZED.has(result.doc.c)) result.score *= 0.5;
		if (styleHint !== SITE_STYLE__CLASSIC && this._CATEGORIES_DEPRIORITIZED_MODERN.has(result.doc.c)) result.score *= 0.5;

		if (result.doc.dR) result.score *= 0.9;
	}

	/* -------------------------------------------- */

	static getCategoryAliasesShort () {
		this._initReInCategory();

		return this._IN_CATEGORY_ALIAS_SHORT;
	}
}
