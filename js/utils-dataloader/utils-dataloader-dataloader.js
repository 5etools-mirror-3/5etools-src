import {DataLoaderConst} from "./utils-dataloader-const.js";
import {DataLoaderInternalUtil} from "./utils-dataloader-internal-util.js";
import {DataLoaderDependency} from "./utils-dataloader-dependency.js";
import {DataLoaderDereferencerFacade} from "./utils-dataloader-dereferencing.js";
import {DataLoaderCache} from "./utils-dataloader-cache.js";

// region Data type loading

class DataTypeLoader {
	static PROPS = [];
	static PAGE = null;
	static IS_FLUFF = false;

	static register ({fnRegister, dependencies}) {
		const loader = new this({dependencies});
		fnRegister({
			loader,
			props: this.PROPS,
			page: this.PAGE,
			isFluff: this.IS_FLUFF,
		});
		return loader;
	}

	static _getAsRawPrefixed (json, {propsRaw}) {
		return {
			...propsRaw.mergeMap(prop => ({[`raw_${prop}`]: json[prop]})),
		};
	}

	/* -------------------------------------------- */

	_dependencies;

	/** Used to reduce phase 1 caching for a loader where phase 2 is the primary caching step. */
	phase1CachePropAllowlist;

	/** (Unused) */
	phase2CachePropAllowlist;

	hasPhase2Cache = false;

	_cache_pSiteData = {};
	_cache_pPostCaches = {};

	constructor ({dependencies}) {
		this._dependencies = dependencies;
	}

	/**
	 * @param pageClean
	 * @param sourceClean
	 * @return {string}
	 */
	_getSiteIdent ({pageClean, sourceClean}) { throw new Error("Unimplemented!"); }

	_isPrereleaseAvailable () { return typeof PrereleaseUtil !== "undefined"; }

	_isBrewAvailable () { return typeof BrewUtil2 !== "undefined"; }

	async _pPrePopulate ({data, isPrerelease, isBrew}) {
		await this._pPrePopulate_common({data, isPrerelease, isBrew});
		await this._pPrePopulate_custom({data, isPrerelease, isBrew});
	}

	async _pPrePopulate_common ({data, isPrerelease, isBrew}) {
		// region Spells
		if (isPrerelease) Renderer.spell.prePopulateHoverPrerelease(data);
		if (isBrew) Renderer.spell.prePopulateHoverBrew(data);
		Renderer.spell.prePopulateHover(data);
		// endregion
	}

	async _pPrePopulate_custom ({data, isPrerelease, isBrew}) { /* Implement as required */ }

	async pGetSiteData ({pageClean, sourceClean}) {
		if (DataLoaderConst.isSourceAllNonSite(sourceClean)) return {};
		const propCache = this._getSiteIdent({pageClean, sourceClean});
		this._cache_pSiteData[propCache] = this._cache_pSiteData[propCache] || this._pGetSiteData({pageClean, sourceClean});
		return this._cache_pSiteData[propCache];
	}

	async _pGetSiteData ({pageClean, sourceClean}) { throw new Error("Unimplemented!"); }

	async pGetStoredPrereleaseData () {
		if (!this._isPrereleaseAvailable()) return {};
		return this._pGetStoredPrereleaseData();
	}

	async pGetStoredBrewData () {
		if (!this._isBrewAvailable()) return {};
		return this._pGetStoredBrewData();
	}

	async _pGetStoredPrereleaseData () {
		return this._pGetStoredPrereleaseBrewData({brewUtil: PrereleaseUtil, isPrerelease: true});
	}

	async _pGetStoredBrewData () {
		return this._pGetStoredPrereleaseBrewData({brewUtil: BrewUtil2, isBrew: true});
	}

	async _pGetStoredPrereleaseBrewData ({brewUtil, isPrerelease, isBrew}) {
		const prereleaseBrewData = await brewUtil.pGetBrewProcessed();
		await this._pPrePopulate({data: prereleaseBrewData, isPrerelease, isBrew});
		return prereleaseBrewData;
	}

	async pGetPostCacheData ({siteData = null, prereleaseData = null, brewData = null, lockToken2}) { /* Implement as required */ }

	async _pGetPostCacheData_obj_withCache ({obj, propCache, lockToken2, loadspace}) {
		if (obj == null) return null;

		this._cache_pPostCaches[propCache] = this._cache_pPostCaches[propCache] || this._pGetPostCacheData_obj({obj, lockToken2, loadspace});
		return this._cache_pPostCaches[propCache];
	}

	/**
	 * @param obj
	 * @param lockToken2
	 * @param {DataLoaderConst.LOADSPACE_SITE | DataLoaderConst.LOADSPACE_BREW | DataLoaderConst.LOADSPACE_PRERELEASE | null} loadspace
	 *   Limit loading to a specific loadspace. Note that this is only used for site data,
	 *   as we expect site data to never depend on prerelease content/homebrew, but prerelease content/homebrew
	 *   may inter-depend and/or depend on site data.
	 */
	async _pGetPostCacheData_obj ({obj, lockToken2, loadspace}) { throw new Error("Unimplemented!"); }

	async pLoadDependencies ({lockToken2, loadspace}) {
		if (!this._dependencies?.length) return;

		for (const dependency of this._dependencies) await dependency.pLoad({loadspace, lockToken2});
	}

	hasCustomCacheStrategy ({obj}) { return false; }

	addToCacheCustom ({cache, obj, propAllowlist}) { /* Implement as required */ }
}

class DataTypeLoaderSingleSource extends DataTypeLoader {
	_filename;

	_getSiteIdent ({pageClean, sourceClean}) { return this._filename; }

	async _pGetSiteData ({pageClean, sourceClean}) {
		return DataUtil.loadJSON(`${Renderer.get().baseUrl}data/${this._filename}`);
	}
}

class DataTypeLoaderBackground extends DataTypeLoaderSingleSource {
	static PROPS = ["background"];
	static PAGE = UrlUtil.PG_BACKGROUNDS;

	_filename = "backgrounds.json";
}

class DataTypeLoaderPsionic extends DataTypeLoaderSingleSource {
	static PROPS = ["psionic"];
	static PAGE = UrlUtil.PG_PSIONICS;

	_filename = "psionics.json";
}

class DataTypeLoaderObject extends DataTypeLoaderSingleSource {
	static PROPS = ["object"];
	static PAGE = UrlUtil.PG_OBJECTS;

	_filename = "objects.json";
}

class DataTypeLoaderAction extends DataTypeLoaderSingleSource {
	static PROPS = ["action"];
	static PAGE = UrlUtil.PG_ACTIONS;

	_filename = "actions.json";
}

class DataTypeLoaderFeat extends DataTypeLoaderSingleSource {
	static PROPS = ["feat"];
	static PAGE = UrlUtil.PG_FEATS;

	_filename = "feats.json";
}

class DataTypeLoaderOptionalfeature extends DataTypeLoaderSingleSource {
	static PROPS = ["optionalfeature"];
	static PAGE = UrlUtil.PG_OPT_FEATURES;

	_filename = "optionalfeatures.json";
}

class DataTypeLoaderReward extends DataTypeLoaderSingleSource {
	static PROPS = ["reward"];
	static PAGE = UrlUtil.PG_REWARDS;

	_filename = "rewards.json";
}

class DataTypeLoaderCharoption extends DataTypeLoaderSingleSource {
	static PROPS = ["charoption"];
	static PAGE = UrlUtil.PG_CHAR_CREATION_OPTIONS;

	_filename = "charcreationoptions.json";
}

class DataTypeLoaderBastion extends DataTypeLoaderSingleSource {
	static PROPS = ["facility"];
	static PAGE = UrlUtil.PG_BASTIONS;

	_filename = "bastions.json";
}

class DataTypeLoaderTrapHazard extends DataTypeLoaderSingleSource {
	static PROPS = ["trap", "hazard"];
	static PAGE = UrlUtil.PG_TRAPS_HAZARDS;

	_filename = "trapshazards.json";
}

class DataTypeLoaderCultBoon extends DataTypeLoaderSingleSource {
	static PROPS = ["cult", "boon"];
	static PAGE = UrlUtil.PG_CULTS_BOONS;

	_filename = "cultsboons.json";
}

class DataTypeLoaderVehicle extends DataTypeLoaderSingleSource {
	static PROPS = ["vehicle", "vehicleUpgrade"];
	static PAGE = UrlUtil.PG_VEHICLES;

	_filename = "vehicles.json";
}

class DataTypeLoaderConditionDisease extends DataTypeLoaderSingleSource {
	static PROPS = ["condition", "disease", "status"];
	static PAGE = UrlUtil.PG_CONDITIONS_DISEASES;

	_filename = "conditionsdiseases.json";
}

class DataTypeLoaderSkill extends DataTypeLoaderSingleSource {
	static PROPS = ["skill"];

	_filename = "skills.json";
}

class DataTypeLoaderSense extends DataTypeLoaderSingleSource {
	static PROPS = ["sense"];

	_filename = "senses.json";
}

class DataTypeLoaderLegendaryGroup extends DataTypeLoaderSingleSource {
	static PROPS = ["legendaryGroup"];

	_filename = "bestiary/legendarygroups.json";
}

class DataTypeLoaderItemProperty extends DataTypeLoaderSingleSource {
	static PROPS = ["itemProperty"];

	_filename = "items-base.json";
}

class DataTypeLoaderItemEntry extends DataTypeLoaderSingleSource {
	static PROPS = ["itemEntry"];

	_filename = "items-base.json";
}

class DataTypeLoaderItemMastery extends DataTypeLoaderSingleSource {
	static PROPS = ["itemMastery"];

	_filename = "items-base.json";

	async _pPrePopulate_custom ({data, isPrerelease, isBrew}) {
		// Ensure properties are loaded
		await Renderer.item.pGetSiteUnresolvedRefItems();
		Renderer.item.addPrereleaseBrewPropertiesAndTypesFrom({data});
	}
}

class DataTypeLoaderEncounterShape extends DataTypeLoaderSingleSource {
	static PROPS = ["encounterShape"];

	_filename = "encounterbuilder.json";
}

class DataTypeLoaderBestiaryTemplate extends DataTypeLoaderSingleSource {
	static PROPS = ["monsterTemplate", "legendaryGroupTemplate"];

	_filename = "bestiary/template.json";
}

class DataTypeLoaderBackgroundFluff extends DataTypeLoaderSingleSource {
	static PROPS = ["backgroundFluff"];
	static PAGE = UrlUtil.PG_BACKGROUNDS;
	static IS_FLUFF = true;

	_filename = "fluff-backgrounds.json";
}

class DataTypeLoaderFeatFluff extends DataTypeLoaderSingleSource {
	static PROPS = ["featFluff"];
	static PAGE = UrlUtil.PG_FEATS;
	static IS_FLUFF = true;

	_filename = "fluff-feats.json";
}

class DataTypeLoaderOptionalfeatureFluff extends DataTypeLoaderSingleSource {
	static PROPS = ["optionalfeatureFluff"];
	static PAGE = UrlUtil.PG_OPT_FEATURES;
	static IS_FLUFF = true;

	_filename = "fluff-optionalfeatures.json";
}

class DataTypeLoaderRewardFluff extends DataTypeLoaderSingleSource {
	static PROPS = ["rewardFluff"];
	static PAGE = UrlUtil.PG_REWARDS;
	static IS_FLUFF = true;

	_filename = "fluff-rewards.json";
}

class DataTypeLoaderItemFluff extends DataTypeLoaderSingleSource {
	static PROPS = ["itemFluff"];
	static PAGE = UrlUtil.PG_ITEMS;
	static IS_FLUFF = true;

	_filename = "fluff-items.json";
}

class DataTypeLoaderLanguageFluff extends DataTypeLoaderSingleSource {
	static PROPS = ["languageFluff"];
	static PAGE = UrlUtil.PG_LANGUAGES;
	static IS_FLUFF = true;

	_filename = "fluff-languages.json";
}

class DataTypeLoaderVehicleFluff extends DataTypeLoaderSingleSource {
	static PROPS = ["vehicleFluff"];
	static PAGE = UrlUtil.PG_VEHICLES;
	static IS_FLUFF = true;

	_filename = "fluff-vehicles.json";
}

class DataTypeLoaderObjectFluff extends DataTypeLoaderSingleSource {
	static PROPS = ["objectFluff"];
	static PAGE = UrlUtil.PG_OBJECTS;
	static IS_FLUFF = true;

	_filename = "fluff-objects.json";
}

class DataTypeLoaderCharoptionFluff extends DataTypeLoaderSingleSource {
	static PROPS = ["charoptionFluff"];
	static PAGE = UrlUtil.PG_CHAR_CREATION_OPTIONS;
	static IS_FLUFF = true;

	_filename = "fluff-charcreationoptions.json";
}

class DataTypeLoaderBastionFluff extends DataTypeLoaderSingleSource {
	static PROPS = ["facilityFluff"];
	static PAGE = UrlUtil.PG_BASTIONS;
	static IS_FLUFF = true;

	_filename = "fluff-bastions.json";
}

class DataTypeLoaderRecipeFluff extends DataTypeLoaderSingleSource {
	static PROPS = ["recipeFluff"];
	static PAGE = UrlUtil.PG_RECIPES;
	static IS_FLUFF = true;

	_filename = "fluff-recipes.json";
}

class DataTypeLoaderCrochetPatternFluff extends DataTypeLoaderSingleSource {
	static PROPS = ["crochetPatternFluff"];
	static PAGE = UrlUtil.PG_HOMECRAFTS;
	static IS_FLUFF = true;

	_filename = "fluff-homecrafts.json";
}

class DataTypeLoaderConditionDiseaseFluff extends DataTypeLoaderSingleSource {
	static PROPS = ["conditionFluff", "diseaseFluff", "statusFluff"];
	static PAGE = UrlUtil.PG_CONDITIONS_DISEASES;
	static IS_FLUFF = true;

	_filename = "fluff-conditionsdiseases.json";
}

class DataTypeLoaderTrapHazardFluff extends DataTypeLoaderSingleSource {
	static PROPS = ["trapFluff", "hazardFluff"];
	static PAGE = UrlUtil.PG_TRAPS_HAZARDS;
	static IS_FLUFF = true;

	_filename = "fluff-trapshazards.json";
}

class DataTypeLoaderPredefined extends DataTypeLoader {
	_loader;
	_loadJsonArgs = null;
	_loadPrereleaseArgs = null;
	_loadBrewArgs = null;

	_getSiteIdent ({pageClean, sourceClean}) { return this._loader; }

	async _pGetSiteData ({pageClean, sourceClean}) {
		return DataUtil[this._loader].loadJSON(this._loadJsonArgs);
	}

	async _pGetStoredPrereleaseData () {
		if (!DataUtil[this._loader].loadPrerelease) return super._pGetStoredPrereleaseData();
		return DataUtil[this._loader].loadPrerelease(this._loadPrereleaseArgs);
	}

	async _pGetStoredBrewData () {
		if (!DataUtil[this._loader].loadBrew) return super._pGetStoredBrewData();
		return DataUtil[this._loader].loadBrew(this._loadBrewArgs);
	}
}

class DataTypeLoaderRace extends DataTypeLoaderPredefined {
	static PROPS = [...UrlUtil.PAGE_TO_PROPS[UrlUtil.PG_RACES]];
	static PAGE = UrlUtil.PG_RACES;

	_loader = "race";
	_loadJsonArgs = {isAddBaseRaces: true};
	_loadPrereleaseArgs = {isAddBaseRaces: true};
	_loadBrewArgs = {isAddBaseRaces: true};
}

class DataTypeLoaderRaceFluff extends DataTypeLoaderPredefined {
	static PROPS = ["raceFluff"];
	static PAGE = UrlUtil.PG_RACES;
	static IS_FLUFF = true;

	_loader = "raceFluff";
}

class DataTypeLoaderRaceFeature extends DataTypeLoaderPredefined {
	static PROPS = ["raceFeature"];

	_loader = "raceFeature";
	_loadJsonArgs = {isAddBaseRaces: true};
	_loadPrereleaseArgs = {isAddBaseRaces: true};
	_loadBrewArgs = {isAddBaseRaces: true};
}

class DataTypeLoaderDeity extends DataTypeLoaderPredefined {
	static PROPS = ["deity"];
	static PAGE = UrlUtil.PG_DEITIES;

	_loader = "deity";
}

class DataTypeLoaderVariantrule extends DataTypeLoaderPredefined {
	static PROPS = ["variantrule"];
	static PAGE = UrlUtil.PG_VARIANTRULES;

	_loader = "variantrule";
}

class DataTypeLoaderTable extends DataTypeLoaderPredefined {
	static PROPS = ["table", "tableGroup"];
	static PAGE = UrlUtil.PG_TABLES;

	_loader = "table";
}

class DataTypeLoaderLanguage extends DataTypeLoaderPredefined {
	static PROPS = ["language"];
	static PAGE = UrlUtil.PG_LANGUAGES;

	_loader = "language";
}

class DataTypeLoaderMultiSource extends DataTypeLoader {
	_prop;

	_getSiteIdent ({pageClean, sourceClean}) {
		// use `.toString()` in case `sourceClean` is a `Symbol`
		return `${this._prop}__${sourceClean.toString()}`;
	}

	async _pGetSiteData ({pageClean, sourceClean}) {
		const data = await this._pGetSiteData_data({sourceClean});

		if (data == null) return {};

		await this._pPrePopulate({data});

		return data;
	}

	async _pGetSiteData_data ({sourceClean}) {
		if (sourceClean === DataLoaderConst.SOURCE_SITE_ALL) return this._pGetSiteDataAll();

		const source = Parser.sourceJsonToJson(sourceClean);
		return DataUtil[this._prop].pLoadSingleSource(source);
	}

	async _pGetSiteDataAll () {
		return DataUtil[this._prop].loadJSON();
	}
}

class DataTypeLoaderCustomMonster extends DataTypeLoaderMultiSource {
	static PROPS = ["monster"];
	static PAGE = UrlUtil.PG_BESTIARY;

	_prop = "monster";
}

class DataTypeLoaderCustomMonsterFluff extends DataTypeLoaderMultiSource {
	static PROPS = ["monsterFluff"];
	static PAGE = UrlUtil.PG_BESTIARY;
	static IS_FLUFF = true;

	_prop = "monsterFluff";
}

class DataTypeLoaderCustomSpell extends DataTypeLoaderMultiSource {
	static PROPS = [...UrlUtil.PAGE_TO_PROPS[UrlUtil.PG_SPELLS]];
	static PAGE = UrlUtil.PG_SPELLS;

	_prop = "spell";
}

class DataTypeLoaderCustomSpellFluff extends DataTypeLoaderMultiSource {
	static PROPS = ["spellFluff"];
	static PAGE = UrlUtil.PG_SPELLS;
	static IS_FLUFF = true;

	_prop = "spellFluff";
}

class DataTypeLoaderClassSubclassFluff extends DataTypeLoaderMultiSource {
	static PROPS = ["classFluff", "subclassFluff"];
	static PAGE = UrlUtil.PG_CLASSES;
	static IS_FLUFF = true;

	_getSiteIdent ({pageClean, sourceClean}) {
		// use `.toString()` in case `sourceClean` is a `Symbol`
		return `${this.constructor.PROPS.join("__")}__${sourceClean.toString()}`;
	}

	async _pGetSiteData ({pageClean, sourceClean}) {
		return this._pGetSiteDataAll();
	}

	async _pGetSiteDataAll () {
		const jsons = await this.constructor.PROPS.pMap(prop => DataUtil[prop].loadJSON());
		const out = {};
		jsons.forEach(json => Object.assign(out, {...json}));
		return out;
	}
}

/** @abstract */
class DataTypeLoaderCustomRawable extends DataTypeLoader {
	static _PROPS_RAWABLE;

	hasPhase2Cache = true;

	_getSiteIdent ({pageClean, sourceClean}) { return `${pageClean}__${this.constructor.name}`; }

	async _pGetSiteData ({pageClean, sourceClean}) {
		const json = await this._pGetRawSiteData();
		return this.constructor._getAsRawPrefixed(json, {propsRaw: this.constructor._PROPS_RAWABLE});
	}

	/** @abstract */
	async _pGetRawSiteData () { throw new Error("Unimplemented!"); }

	async _pGetStoredPrereleaseBrewData ({brewUtil, isPrerelease, isBrew}) {
		const prereleaseBrew = await brewUtil.pGetBrewProcessed();
		return this.constructor._getAsRawPrefixed(prereleaseBrew, {propsRaw: this.constructor._PROPS_RAWABLE});
	}

	static _pGetDereferencedData_doNotifyFailed ({ent, uids, prop}) {
		const missingRefSets = {
			[prop]: new Set(uids),
		};

		DataLoaderInternalUtil.doNotifyFailedDereferences({
			missingRefSets,
			diagnostics: [ent.__diagnostic].filter(Boolean),
		});
	}
}

class DataTypeLoaderCustomClassesSubclass extends DataTypeLoaderCustomRawable {
	static PROPS = ["raw_class", "raw_subclass", "class", "subclass"];
	static PAGE = UrlUtil.PG_CLASSES;

	// Note that this only loads these specific props, to avoid deadlock incurred by dereferencing class/subclass features
	static _PROPS_RAWABLE = ["class", "subclass"];

	async _pGetRawSiteData () { return DataUtil.class.loadRawJSON(); }

	async _pGetPostCacheData_obj ({obj, lockToken2, loadspace}) {
		if (!obj) return null;

		const out = {};

		if (obj.raw_class?.length) out.class = await obj.raw_class.pSerialAwaitMap(cls => this.constructor._pGetDereferencedClassData(cls, {lockToken2}));
		if (obj.raw_subclass?.length) out.subclass = await obj.raw_subclass.pSerialAwaitMap(sc => this.constructor._pGetDereferencedSubclassData(sc, {lockToken2}));

		return out;
	}

	static _mutEntryNestLevel (feature) {
		const depth = (feature.header == null ? 1 : feature.header) - 1;
		for (let i = 0; i < depth; ++i) {
			const nxt = MiscUtil.copyFast(feature);
			feature.entries = [nxt];
			delete feature.name;
			delete feature.page;
			delete feature.source;
		}
	}

	static async _pGetDereferencedClassData (cls, {lockToken2}) {
		// Gracefully handle legacy class data
		if (cls.classFeatures && cls.classFeatures.every(it => typeof it !== "string" && !it.classFeature)) return cls;

		cls = MiscUtil.copyFast(cls);

		const byLevel = await this._pGetDereferencedClassSubclassData(
			cls,
			{
				lockToken2,
				propFeatures: "classFeatures",
				propFeature: "classFeature",
				fnUnpackUid: DataUtil.class.unpackUidClassFeature.bind(DataUtil.class),
				fnIsInvalidUnpackedUid: ({name, className, level}) => !name || !className || !level || isNaN(level),
			},
		);

		cls.classFeatures = [...new Array(Math.max(0, ...Object.keys(byLevel).map(Number)))]
			.map((_, i) => byLevel[i + 1] || []);

		return cls;
	}

	static async _pGetDereferencedSubclassData (sc, {lockToken2}) {
		// Gracefully handle legacy class data
		if (sc.subclassFeatures && sc.subclassFeatures.every(it => typeof it !== "string" && !it.subclassFeature)) return sc;

		sc = MiscUtil.copyFast(sc);

		const byLevel = await this._pGetDereferencedClassSubclassData(
			sc,
			{
				lockToken2,
				propFeatures: "subclassFeatures",
				propFeature: "subclassFeature",
				fnUnpackUid: DataUtil.class.unpackUidSubclassFeature.bind(DataUtil.class),
				fnIsInvalidUnpackedUid: ({name, className, subclassShortName, level}) => !name || !className || !subclassShortName || !level || isNaN(level),
			},
		);

		sc.subclassFeatures = Object.keys(byLevel)
			.map(Number)
			.sort(SortUtil.ascSort)
			.map(k => byLevel[k]);

		return sc;
	}

	static async _pGetDereferencedClassSubclassData (
		clsOrSc,
		{
			lockToken2,
			propFeatures,
			propFeature,
			fnUnpackUid,
			fnIsInvalidUnpackedUid,
		},
	) {
		// Gracefully handle legacy data
		if (clsOrSc[propFeatures] && clsOrSc[propFeatures].every(it => typeof it !== "string" && !it[propFeature])) return clsOrSc;

		clsOrSc = MiscUtil.copyFast(clsOrSc);

		const byLevel = {}; // Build a map of `level: [ ...feature... ]`
		const notFoundUids = [];

		await (clsOrSc[propFeatures] || [])
			.pSerialAwaitMap(async featureRef => {
				const uid = featureRef[propFeature] ? featureRef[propFeature] : featureRef;
				const unpackedUid = fnUnpackUid(uid);
				const {source, displayText} = unpackedUid;

				// Skip over broken links
				if (fnIsInvalidUnpackedUid(unpackedUid)) return;

				// Skip over temp/nonexistent links
				if (source === Parser.SRC_5ETOOLS_TMP) return;

				const hash = UrlUtil.URL_TO_HASH_BUILDER[propFeature](unpackedUid);

				// Skip blocklisted
				if (ExcludeUtil.isInitialised && ExcludeUtil.isExcluded(hash, propFeature, source, {isNoCount: true})) return;

				const feature = await DataLoader.pCacheAndGet(propFeature, source, hash, {isCopy: true, lockToken2});
				// Skip over missing links
				if (!feature) return notFoundUids.push(uid);

				feature.type ||= "entries";

				if (displayText) feature._displayName = displayText;
				if (featureRef.tableDisplayName) feature._displayNameTable = featureRef.tableDisplayName;

				if (featureRef.gainSubclassFeature) feature.gainSubclassFeature = true;
				if (featureRef.gainSubclassFeatureHasContent) feature.gainSubclassFeatureHasContent = true;

				if (clsOrSc.otherSources && clsOrSc.source === feature.source) feature.otherSources = MiscUtil.copyFast(clsOrSc.otherSources);

				this._mutEntryNestLevel(feature);

				(byLevel[feature.level || 1] = byLevel[feature.level || 1] || []).push(feature);
			});

		this._pGetDereferencedData_doNotifyFailed({ent: clsOrSc, uids: notFoundUids, prop: propFeature});

		return byLevel;
	}

	async pGetPostCacheData ({siteData = null, prereleaseData = null, brewData = null, lockToken2}) {
		return {
			siteDataPostCache: await this._pGetPostCacheData_obj_withCache({obj: siteData, lockToken2, propCache: "site"}),
			prereleaseDataPostCache: await this._pGetPostCacheData_obj({obj: prereleaseData, lockToken2}),
			brewDataPostCache: await this._pGetPostCacheData_obj({obj: brewData, lockToken2}),
		};
	}
}

class DataTypeLoaderCustomClassSubclassFeature extends DataTypeLoader {
	static PROPS = ["raw_classFeature", "raw_subclassFeature", "classFeature", "subclassFeature"];
	static PAGE = UrlUtil.PG_CLASS_SUBCLASS_FEATURES;

	static _PROPS_RAWABLE = ["classFeature", "subclassFeature"];

	hasPhase2Cache = true;

	_getSiteIdent ({pageClean, sourceClean}) { return `${pageClean}__${this.constructor.name}`; }

	async _pGetSiteData ({pageClean, sourceClean}) {
		const json = await DataUtil.class.loadRawJSON();
		return this.constructor._getAsRawPrefixed(json, {propsRaw: this.constructor._PROPS_RAWABLE});
	}

	async _pGetStoredPrereleaseBrewData ({brewUtil, isPrerelease, isBrew}) {
		const prereleaseBrew = await brewUtil.pGetBrewProcessed();
		return this.constructor._getAsRawPrefixed(prereleaseBrew, {propsRaw: this.constructor._PROPS_RAWABLE});
	}

	async _pGetPostCacheData_obj ({obj, lockToken2, loadspace}) {
		if (!obj) return null;

		const out = {};

		if (obj.raw_classFeature?.length) out.classFeature = (await DataLoaderDereferencerFacade.pGetDereferenced(obj.raw_classFeature, "classFeature", {loadspace}))?.classFeature || [];
		if (obj.raw_subclassFeature?.length) out.subclassFeature = (await DataLoaderDereferencerFacade.pGetDereferenced(obj.raw_subclassFeature, "subclassFeature", {loadspace}))?.subclassFeature || [];

		return out;
	}

	async pGetPostCacheData ({siteData = null, prereleaseData = null, brewData = null, lockToken2}) {
		return {
			siteDataPostCache: await this._pGetPostCacheData_obj_withCache({
				obj: siteData,
				lockToken2,
				propCache: "site",
				loadspace: DataLoaderConst.LOADSPACE_SITE,
			}),
			prereleaseDataPostCache: await this._pGetPostCacheData_obj({obj: prereleaseData, lockToken2}),
			brewDataPostCache: await this._pGetPostCacheData_obj({obj: brewData, lockToken2}),
		};
	}
}

class DataTypeLoaderCustomItem extends DataTypeLoader {
	static PROPS = [...UrlUtil.PAGE_TO_PROPS[UrlUtil.PG_ITEMS]];
	static PAGE = UrlUtil.PG_ITEMS;

	/**
	 * Avoid adding phase 1 items to the cache. Adding them as `raw_item` is inaccurate, as we have already e.g. merged
	 *   generic variants, and enhanced the items.
	 * Adding them as `item` is also inaccurate, as we have yet to run our phase 2 post-processing to remove any
	 *   `itemEntry` references.
	 * We could cache them under, say, `phase1_item`, but this would mean supporting `phase1_item` everywhere (has
	 *   builders, etc.), polluting other areas with our implementation details.
	 * Therefore, cache only the essentials in phase 1.
	 */
	phase1CachePropAllowlist = new Set(["itemEntry"]);

	hasPhase2Cache = true;

	_getSiteIdent ({pageClean, sourceClean}) { return this.constructor.name; }

	async _pGetSiteData ({pageClean, sourceClean}) {
		return Renderer.item.pGetSiteUnresolvedRefItems();
	}

	async _pGetStoredPrereleaseBrewData ({brewUtil, isPrerelease, isBrew}) {
		const prereleaseBrewData = await brewUtil.pGetBrewProcessed();
		await this._pPrePopulate({data: prereleaseBrewData, isPrerelease, isBrew});
		return {
			item: await Renderer.item.pGetSiteUnresolvedRefItemsFromPrereleaseBrew({brewUtil, brew: prereleaseBrewData}),
			itemEntry: prereleaseBrewData.itemEntry || [],
		};
	}

	async _pPrePopulate_custom ({data, isPrerelease, isBrew}) {
		Renderer.item.addPrereleaseBrewPropertiesAndTypesFrom({data});
	}

	async _pGetPostCacheData_obj ({obj, lockToken2, loadspace}) {
		if (!obj) return null;

		const out = {};

		if (obj.item?.length) {
			out.item = (await DataLoaderDereferencerFacade.pGetDereferenced(obj.item, "item", {propEntries: "entries", propIsRef: "hasRefs", loadspace}))?.item || [];
			out.item = (await DataLoaderDereferencerFacade.pGetDereferenced(out.item, "item", {propEntries: "_fullEntries", propIsRef: "hasRefs", loadspace}))?.item || [];
		}

		return out;
	}

	async pGetPostCacheData ({siteData = null, prereleaseData = null, brewData = null, lockToken2}) {
		return {
			siteDataPostCache: await this._pGetPostCacheData_obj_withCache({
				obj: siteData,
				lockToken2,
				propCache: "site",
				loadspace: DataLoaderConst.LOADSPACE_SITE,
			}),
			prereleaseDataPostCache: await this._pGetPostCacheData_obj({obj: prereleaseData, lockToken2}),
			brewDataPostCache: await this._pGetPostCacheData_obj({obj: brewData, lockToken2}),
		};
	}
}

class DataTypeLoaderCustomCard extends DataTypeLoader {
	static PROPS = ["card"];
	static PAGE = UrlUtil.PG_DECKS;

	_getSiteIdent ({pageClean, sourceClean}) { return `${pageClean}__${this.constructor.name}`; }

	async _pGetSiteData ({pageClean, sourceClean}) {
		const json = await DataUtil.deck.loadRawJSON();
		return {card: json.card};
	}
}

class DataTypeLoaderCustomDeck extends DataTypeLoaderCustomRawable {
	static PROPS = ["raw_deck", "deck"];
	static PAGE = UrlUtil.PG_DECKS;

	static _PROPS_RAWABLE = ["deck"];

	async _pGetRawSiteData () { return DataUtil.deck.loadRawJSON(); }

	async _pGetPostCacheData_obj ({obj, lockToken2}) {
		if (!obj) return null;

		const out = {};

		if (obj.raw_deck?.length) out.deck = await obj.raw_deck.pSerialAwaitMap(ent => this.constructor._pGetDereferencedDeckData(ent, {lockToken2}));

		return out;
	}

	static async _pGetDereferencedDeckData (deck, {lockToken2}) {
		deck = MiscUtil.copyFast(deck);

		deck.cards = await this._pGetDereferencedCardData(deck, {lockToken2});

		return deck;
	}

	static async _pGetDereferencedCardData (deck, {lockToken2}) {
		const notFoundUids = [];

		const out = (await (deck.cards || [])
			.pSerialAwaitMap(async cardMeta => {
				const uid = typeof cardMeta === "string" ? cardMeta : cardMeta.uid;
				const count = typeof cardMeta === "string" ? 1 : cardMeta.count ?? 1;
				const isReplacement = typeof cardMeta === "string" ? false : cardMeta.replacement ?? false;

				const unpackedUid = DataUtil.deck.unpackUidCard(uid);
				const {source} = unpackedUid;

				// Skip over broken links
				if (unpackedUid.name == null || unpackedUid.set == null || unpackedUid.source == null) return;

				const hash = UrlUtil.URL_TO_HASH_BUILDER["card"](unpackedUid);

				// Skip blocklisted
				if (ExcludeUtil.isInitialised && ExcludeUtil.isExcluded(hash, "card", source, {isNoCount: true})) return;

				const card = await DataLoader.pCacheAndGet("card", source, hash, {isCopy: true, lockToken2});
				// Skip over missing links
				if (!card) return notFoundUids.push(uid);

				if (deck.otherSources && deck.source === card.source) card.otherSources = MiscUtil.copyFast(deck.otherSources);
				if (isReplacement) card._isReplacement = true;

				return [...new Array(count)].map(() => MiscUtil.copyFast(card));
			}))
			.flat()
			.filter(Boolean);

		this._pGetDereferencedData_doNotifyFailed({ent: deck, uids: notFoundUids, prop: "card"});

		return out;
	}

	async pGetPostCacheData ({siteData = null, prereleaseData = null, brewData = null, lockToken2}) {
		return {
			siteDataPostCache: await this._pGetPostCacheData_obj_withCache({obj: siteData, lockToken2, propCache: "site"}),
			prereleaseDataPostCache: await this._pGetPostCacheData_obj({obj: prereleaseData, lockToken2}),
			brewDataPostCache: await this._pGetPostCacheData_obj({obj: brewData, lockToken2}),
		};
	}
}

/** @abstract */
class DataTypeLoaderMergedFluffBase extends DataTypeLoaderCustomRawable {
	_PROP_FLUFF;

	_mutEntPreInlineFluff (ent) { /* Implement as required */ }

	async _pGetDereferencedFluffData (ent, {lockToken2}) {
		const fluff = await Renderer.utils.pGetFluff({
			entity: ent,
			fluffProp: this._PROP_FLUFF,
			lockToken2,
		});
		if (!fluff) return null;

		const cpyFluff = MiscUtil.copyFast(fluff);
		delete cpyFluff.name;
		delete cpyFluff.source;

		return cpyFluff;
	}

	async _pGetDereferencedRawData (ent, {lockToken2}) {
		ent = MiscUtil.copyFast(ent);

		this._mutEntPreInlineFluff(ent);

		const fluff = await this._pGetDereferencedFluffData(ent, {lockToken2});
		if (fluff) ent.fluff = fluff;

		return ent;
	}

	async _pGetPostCacheData_obj ({obj, lockToken2}) {
		if (!obj) return null;

		const out = {};

		for (const propRawable of this.constructor._PROPS_RAWABLE) {
			const propRaw = `raw_${propRawable}`;

			if (obj[propRaw]?.length) out[propRawable] = await obj[propRaw].pSerialAwaitMap(ent => this._pGetDereferencedRawData(ent, {lockToken2}));
		}

		return out;
	}

	async pGetPostCacheData ({siteData = null, prereleaseData = null, brewData = null, lockToken2}) {
		return {
			siteDataPostCache: await this._pGetPostCacheData_obj_withCache({obj: siteData, lockToken2, propCache: "site"}),
			prereleaseDataPostCache: await this._pGetPostCacheData_obj({obj: prereleaseData, lockToken2}),
			brewDataPostCache: await this._pGetPostCacheData_obj({obj: brewData, lockToken2}),
		};
	}
}

class DataTypeLoaderRecipe extends DataTypeLoaderMergedFluffBase {
	static PROPS = ["raw_recipe", "recipe"];
	static PAGE = UrlUtil.PG_RECIPES;

	static _PROPS_RAWABLE = ["recipe"];

	_PROP_FLUFF = "recipeFluff";

	async _pGetRawSiteData () { return DataUtil.recipe.loadRawJSON(); }

	_mutEntPreInlineFluff (ent) {
		Renderer.recipe.populateFullIngredients(ent);
	}
}

class DataTypeLoaderCrochetPattern extends DataTypeLoaderMergedFluffBase {
	static PROPS = ["raw_crochetPattern", "crochetPattern"];
	static PAGE = UrlUtil.PG_HOMECRAFTS;

	static _PROPS_RAWABLE = ["crochetPattern"];

	_PROP_FLUFF = "crochetPatternFluff";

	async _pGetRawSiteData () { return DataUtil.crochetPattern.loadRawJSON(); }
}

class DataTypeLoaderCustomQuickref extends DataTypeLoader {
	static PROPS = ["reference", "referenceData"];
	static PAGE = UrlUtil.PG_QUICKREF;

	_getSiteIdent ({pageClean, sourceClean}) { return this.constructor.name; }

	_isPrereleaseAvailable () { return false; }

	_isBrewAvailable () { return false; }

	async _pGetSiteData ({pageClean, sourceClean}) {
		const json = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/generated/bookref-quick.json`);
		return {
			reference: json.reference["bookref-quick"],
			referenceData: json.data["bookref-quick"],
		};
	}

	hasCustomCacheStrategy ({obj}) { return this.constructor.PROPS.some(prop => obj[prop]?.length); }

	addToCacheCustom ({cache, obj, propAllowlist}) {
		if (!this.constructor.PROPS.every(prop => propAllowlist.has(prop))) return [];

		obj.referenceData.forEach((chapter, ixChapter) => this._addToCacheCustom_chapter({cache, chapter, ixChapter}));
		return [...this.constructor.PROPS];
	}

	_addToCacheCustom_chapter ({cache, chapter, ixChapter}) {
		const metas = IndexableFileQuickReference.getChapterNameMetas(chapter, {isRequireQuickrefFlag: false});

		metas.forEach(nameMeta => {
			const hashParts = [
				"bookref-quick",
				ixChapter,
				UrlUtil.encodeForHash(nameMeta.name.toLowerCase()),
			];
			if (nameMeta.ixBook) hashParts.push(nameMeta.ixBook);

			const hash = hashParts.join(HASH_PART_SEP);

			const {page: pageClean, source: sourceClean, hash: hashClean} = DataLoaderInternalUtil.getCleanPageSourceHash({
				page: UrlUtil.PG_QUICKREF,
				source: nameMeta.source,
				hash,
			});
			cache.set(pageClean, sourceClean, hashClean, nameMeta.entry);

			if (nameMeta.ixBook) return;

			// region Add the hash with the redundant `0` header included
			hashParts.push(nameMeta.ixBook);
			const hashAlt = hashParts.join(HASH_PART_SEP);
			const hashAltClean = DataLoaderInternalUtil.getCleanHash({hash: hashAlt});
			cache.set(pageClean, sourceClean, hashAltClean, nameMeta.entry);
			// endregion
		});
	}
}

class DataTypeLoaderCustomAdventureBook extends DataTypeLoader {
	_filename;

	_getSiteIdent ({pageClean, sourceClean}) { return `${pageClean}__${sourceClean}`; }

	hasCustomCacheStrategy ({obj}) { return this.constructor.PROPS.some(prop => obj[prop]?.length); }

	addToCacheCustom ({cache, obj, propAllowlist}) {
		if (!this.constructor.PROPS.every(prop => propAllowlist.has(prop))) return [];

		const [prop, propData] = this.constructor.PROPS;

		// Get only the ids that exist in both data + contents
		const dataIds = (obj[propData] || []).filter(it => it.id).map(it => it.id);
		const contentsIds = new Set((obj[prop] || []).filter(it => it.id).map(it => it.id));
		const matchingIds = dataIds.filter(id => contentsIds.has(id));

		matchingIds.forEach(id => {
			const data = (obj[propData] || []).find(it => it.id === id);
			const contents = (obj[prop] || []).find(it => it.id === id);

			const hash = UrlUtil.URL_TO_HASH_BUILDER[this.constructor.PAGE](contents);
			this._addImageBackReferences(data, this.constructor.PAGE, contents.source, hash);

			const {page: pageClean, source: sourceClean, hash: hashClean} = DataLoaderInternalUtil.getCleanPageSourceHash({
				page: this.constructor.PAGE,
				source: contents.source,
				hash,
			});

			const pack = {
				[prop]: contents,
				[propData]: data,
			};

			cache.set(pageClean, sourceClean, hashClean, pack);
		});

		return [prop, propData];
	}

	async _pGetSiteData ({pageClean, sourceClean}) {
		const [prop, propData] = this.constructor.PROPS;

		const index = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/${this._filename}`);
		const contents = index[prop].find(contents => DataLoaderInternalUtil.getCleanSource({source: contents.source}) === sourceClean);

		if (!contents) return {};

		const json = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/${prop}/${prop}-${UrlUtil.encodeForHash(contents.id.toLowerCase())}.json`);

		return {
			[prop]: [contents],
			[propData]: [
				{
					source: contents.source,
					id: contents.id,
					...json,
				},
			],
		};
	}

	_addImageBackReferences (json, page, source, hash) {
		if (!json) return;

		const walker = MiscUtil.getWalker({keyBlocklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLOCKLIST, isNoModification: true});
		walker.walk(
			json,
			{
				object: (obj) => {
					if (obj.type === "image" && obj.mapRegions) {
						obj.page = obj.page || page;
						obj.source = obj.source || source;
						obj.hash = obj.hash || hash;
					}
				},
			},
		);
	}
}

class DataTypeLoaderCustomAdventure extends DataTypeLoaderCustomAdventureBook {
	static PROPS = ["adventure", "adventureData"];
	static PAGE = UrlUtil.PG_ADVENTURE;

	_filename = "adventures.json";
}

class DataTypeLoaderCustomBook extends DataTypeLoaderCustomAdventureBook {
	static PROPS = ["book", "bookData"];
	static PAGE = UrlUtil.PG_BOOK;

	_filename = "books.json";
}

class DataTypeLoaderCitation extends DataTypeLoader {
	static PROPS = ["citation"];

	_getSiteIdent ({pageClean, sourceClean}) { return this.constructor.name; }

	async _pGetSiteData ({pageClean, sourceClean}) {
		return {citation: []};
	}
}

// endregion

/* -------------------------------------------- */

// region Data loader

export class DataLoader {
	static _PROP_TO_HASH_PAGE = {
		"monster": UrlUtil.PG_BESTIARY,
		"spell": UrlUtil.PG_SPELLS,
		"class": UrlUtil.PG_CLASSES,
		"subclass": UrlUtil.PG_CLASSES,
		"item": UrlUtil.PG_ITEMS,
		"background": UrlUtil.PG_BACKGROUNDS,
		"psionic": UrlUtil.PG_PSIONICS,
		"object": UrlUtil.PG_OBJECTS,
		"action": UrlUtil.PG_ACTIONS,
		"trap": UrlUtil.PG_TRAPS_HAZARDS,
		"hazard": UrlUtil.PG_TRAPS_HAZARDS,
		"cult": UrlUtil.PG_CULTS_BOONS,
		"boon": UrlUtil.PG_CULTS_BOONS,
		"condition": UrlUtil.PG_CONDITIONS_DISEASES,
		"deck": UrlUtil.PG_DECKS,
		"disease": UrlUtil.PG_CONDITIONS_DISEASES,
		"status": UrlUtil.PG_CONDITIONS_DISEASES,
		"vehicle": UrlUtil.PG_VEHICLES,
		"vehicleUpgrade": UrlUtil.PG_VEHICLES,
		"feat": UrlUtil.PG_FEATS,
		"optionalfeature": UrlUtil.PG_OPT_FEATURES,
		"reward": UrlUtil.PG_REWARDS,
		"charoption": UrlUtil.PG_CHAR_CREATION_OPTIONS,
		"race": UrlUtil.PG_RACES,
		"subrace": UrlUtil.PG_RACES,
		"deity": UrlUtil.PG_DEITIES,
		"variantrule": UrlUtil.PG_VARIANTRULES,
		"table": UrlUtil.PG_TABLES,
		"tableGroup": UrlUtil.PG_TABLES,
		"language": UrlUtil.PG_LANGUAGES,
		"recipe": UrlUtil.PG_RECIPES,
		"crochetPattern": UrlUtil.PG_HOMECRAFTS,
		"facility": UrlUtil.PG_BASTIONS,
		"classFeature": UrlUtil.PG_CLASS_SUBCLASS_FEATURES,
		"subclassFeature": UrlUtil.PG_CLASS_SUBCLASS_FEATURES,
		"reference": UrlUtil.PG_QUICKREF,
		"referenceData": UrlUtil.PG_QUICKREF,
		"adventure": UrlUtil.PG_ADVENTURE,
		"adventureData": UrlUtil.PG_ADVENTURE,
		"book": UrlUtil.PG_BOOK,
		"bookData": UrlUtil.PG_BOOK,
	};

	static getPropPage (prop) { return this._PROP_TO_HASH_PAGE[prop]; }

	static _DATA_TYPE_LOADERS = {};
	static _DATA_TYPE_LOADER_LIST = [];

	static _init () {
		this._registerPropToHashPages();
		this._registerDataTypeLoaders();
		return null;
	}

	static _registerPropToHashPages () {
		// (Implement as required)
	}

	static _registerDataTypeLoader ({loader, props, page, isFluff}) {
		this._DATA_TYPE_LOADER_LIST.push(loader);

		if (!props?.length) throw new Error(`No "props" specified for loader "${loader.constructor.name}"!`);

		props.forEach(prop => this._DATA_TYPE_LOADERS[DataLoaderInternalUtil.getCleanPage({page: prop})] = loader);

		if (!page) return;

		this._DATA_TYPE_LOADERS[
			isFluff
				? DataLoaderInternalUtil.getCleanPageFluff({page})
				: DataLoaderInternalUtil.getCleanPage({page})
		] = loader;
	}

	static _registerDataTypeLoaders () {
		const fnRegister = this._registerDataTypeLoader.bind(this);

		// region Multi-file
		DataTypeLoaderCustomMonster.register({fnRegister, dependencies: [new DataLoaderDependency({page: "monsterTemplate"}), new DataLoaderDependency({page: "legendaryGroup"})]});
		DataTypeLoaderCustomMonsterFluff.register({fnRegister});
		DataTypeLoaderCustomSpell.register({fnRegister});
		DataTypeLoaderCustomSpellFluff.register({fnRegister});
		DataTypeLoaderClassSubclassFluff.register({fnRegister});
		// endregion

		// region Predefined
		DataTypeLoaderRace.register({fnRegister});
		DataTypeLoaderRaceFeature.register({fnRegister});
		DataTypeLoaderDeity.register({fnRegister});
		DataTypeLoaderVariantrule.register({fnRegister});
		DataTypeLoaderTable.register({fnRegister});
		DataTypeLoaderLanguage.register({fnRegister});
		DataTypeLoaderRecipe.register({fnRegister});
		DataTypeLoaderCrochetPattern.register({fnRegister});
		// endregion

		// region Special
		DataTypeLoaderCustomClassesSubclass.register({fnRegister});
		DataTypeLoaderCustomClassSubclassFeature.register({fnRegister});
		DataTypeLoaderCustomItem.register({fnRegister});
		DataTypeLoaderCustomCard.register({fnRegister});
		DataTypeLoaderCustomDeck.register({fnRegister});
		DataTypeLoaderCustomQuickref.register({fnRegister});
		DataTypeLoaderCustomAdventure.register({fnRegister});
		DataTypeLoaderCustomBook.register({fnRegister});
		DataTypeLoaderCitation.register({fnRegister});
		// endregion

		// region Single file
		DataTypeLoaderBackground.register({fnRegister});
		DataTypeLoaderPsionic.register({fnRegister});
		DataTypeLoaderObject.register({fnRegister});
		DataTypeLoaderAction.register({fnRegister});
		DataTypeLoaderFeat.register({fnRegister});
		DataTypeLoaderOptionalfeature.register({fnRegister});
		DataTypeLoaderReward.register({fnRegister});
		DataTypeLoaderCharoption.register({fnRegister});
		DataTypeLoaderBastion.register({fnRegister});

		DataTypeLoaderTrapHazard.register({fnRegister});
		DataTypeLoaderCultBoon.register({fnRegister});
		DataTypeLoaderVehicle.register({fnRegister});

		DataTypeLoaderConditionDisease.register({fnRegister});

		DataTypeLoaderSkill.register({fnRegister});
		DataTypeLoaderSense.register({fnRegister});
		DataTypeLoaderLegendaryGroup.register({fnRegister, dependencies: [new DataLoaderDependency({page: "legendaryGroupTemplate"})]});
		DataTypeLoaderItemProperty.register({fnRegister});
		DataTypeLoaderItemEntry.register({fnRegister});
		DataTypeLoaderItemMastery.register({fnRegister});
		DataTypeLoaderEncounterShape.register({fnRegister});
		DataTypeLoaderBestiaryTemplate.register({fnRegister});
		// endregion

		// region Fluff
		DataTypeLoaderBackgroundFluff.register({fnRegister});
		DataTypeLoaderFeatFluff.register({fnRegister});
		DataTypeLoaderOptionalfeatureFluff.register({fnRegister});
		DataTypeLoaderRewardFluff.register({fnRegister});
		DataTypeLoaderItemFluff.register({fnRegister});
		DataTypeLoaderRaceFluff.register({fnRegister});
		DataTypeLoaderLanguageFluff.register({fnRegister});
		DataTypeLoaderVehicleFluff.register({fnRegister});
		DataTypeLoaderObjectFluff.register({fnRegister});
		DataTypeLoaderCharoptionFluff.register({fnRegister});
		DataTypeLoaderBastionFluff.register({fnRegister});
		DataTypeLoaderRecipeFluff.register({fnRegister});
		DataTypeLoaderCrochetPatternFluff.register({fnRegister});

		DataTypeLoaderConditionDiseaseFluff.register({fnRegister});
		DataTypeLoaderTrapHazardFluff.register({fnRegister});
		// endregion
	}

	static _ = this._init();

	static _CACHE = new DataLoaderCache();
	static _LOCK_1 = new VeLock({isDbg: false, name: "loader-lock-1"});
	static _LOCK_2 = new VeLock({isDbg: false, name: "loader-lock-2"});

	/* -------------------------------------------- */

	/**
	 * @param page
	 * @param source
	 * @param hash
	 * @param [isCopy] If a copy, rather than the original entity, should be returned.
	 * @param [isRequired] If an error should be thrown on a missing entity.
	 * @param [_isReturnSentinel] If a null sentinel should be returned, if it exists.
	 * @param [_isInsertSentinelOnMiss] If a null sentinel should be inserted on cache miss.
	 */
	static getFromCache (
		page,
		source,
		hash,
		{
			isCopy = false,
			isRequired = false,
			_isReturnSentinel = false,
			_isInsertSentinelOnMiss = false,
		} = {},
	) {
		const {page: pageClean, source: sourceClean, hash: hashClean} = DataLoaderInternalUtil.getCleanPageSourceHash({page, source, hash});
		const ent = this._getFromCache({pageClean, sourceClean, hashClean, isCopy, _isReturnSentinel, _isInsertSentinelOnMiss});
		return this._getVerifiedRequiredEntity({pageClean, sourceClean, hashClean, ent, isRequired});
	}

	static _getFromCache (
		{
			pageClean,
			sourceClean,
			hashClean,
			isCopy = false,
			_isInsertSentinelOnMiss = false,
			_isReturnSentinel = false,
		},
	) {
		const out = this._CACHE.get(pageClean, sourceClean, hashClean);

		if (out === DataLoaderConst.ENTITY_NULL) {
			if (_isReturnSentinel) return out;
			if (!_isReturnSentinel) return null;
		}

		if (out == null && _isInsertSentinelOnMiss) {
			this._CACHE.set(pageClean, sourceClean, hashClean, DataLoaderConst.ENTITY_NULL);
		}

		if (!isCopy || out == null) return out;
		return MiscUtil.copyFast(out);
	}

	/* -------------------------------------------- */

	static getAllFromCacheAll (page, {isSilent = false} = {}) {
		const pageClean = DataLoaderInternalUtil.getCleanPage({page});

		if (this._PAGES_NO_CONTENT.has(pageClean)) return null;

		const dataLoader = this._pCache_getDataTypeLoader({pageClean, isSilent});
		if (!dataLoader) return null;

		return this._CACHE.getAllAll(pageClean);
	}

	/* -------------------------------------------- */

	static _getVerifiedRequiredEntity ({pageClean, sourceClean, hashClean, ent, isRequired}) {
		if (ent || !isRequired) return ent;
		throw new Error(`Could not find entity for page/prop "${pageClean}" with source "${sourceClean}" and hash "${hashClean}"`);
	}

	/* -------------------------------------------- */

	static async pCacheAndGetAllSite (page, {isSilent = false, lockToken2} = {}) {
		const pageClean = DataLoaderInternalUtil.getCleanPage({page});

		if (this._PAGES_NO_CONTENT.has(pageClean)) return null;

		const dataLoader = this._pCache_getDataTypeLoader({pageClean, isSilent});
		if (!dataLoader) return null;

		// (Avoid preloading missing brew here, as we only return site data.)

		await dataLoader.pLoadDependencies({lockToken2, loadspace: DataLoaderConst.LOADSPACE_SITE});

		const {siteData} = await this._pCacheAndGet_getCacheMeta({pageClean, sourceClean: DataLoaderConst.SOURCE_SITE_ALL, dataLoader});
		await this._pCacheAndGet_processCacheMeta({dataLoader, siteData, lockToken2});

		return this._CACHE.getAllSite(pageClean);
	}

	static async pCacheAndGetAllPrerelease (page, {isSilent = false, lockToken2} = {}) {
		return this._CacheAndGetAllPrerelease.pCacheAndGetAll({parent: this, page, isSilent, lockToken2, loadspace: DataLoaderConst.LOADSPACE_PRERELEASE});
	}

	static async pCacheAndGetAllBrew (page, {isSilent = false, lockToken2} = {}) {
		return this._CacheAndGetAllBrew.pCacheAndGetAll({parent: this, page, isSilent, lockToken2, loadspace: DataLoaderConst.LOADSPACE_BREW});
	}

	static _CacheAndGetAllPrereleaseBrew = class {
		static _SOURCE_ALL;
		static _PROP_DATA;

		static async pCacheAndGetAll (
			{
				parent,
				page,
				isSilent,
				lockToken2,
				loadspace,
			},
		) {
			const pageClean = DataLoaderInternalUtil.getCleanPage({page});

			if (parent._PAGES_NO_CONTENT.has(pageClean)) return null;

			const dataLoader = parent._pCache_getDataTypeLoader({pageClean, isSilent});
			if (!dataLoader) return null;

			// (Avoid preloading missing prerelease/homebrew here, as we only return currently-loaded prerelease/homebrew.)

			await dataLoader.pLoadDependencies({lockToken2, loadspace});

			const cacheMeta = await parent._pCacheAndGet_getCacheMeta({pageClean, sourceClean: this._SOURCE_ALL, dataLoader});
			await parent._pCacheAndGet_processCacheMeta({dataLoader, [this._PROP_DATA]: cacheMeta[this._PROP_DATA], lockToken2});

			return this._getAllCached({parent, pageClean});
		}

		/** @abstract */
		static _getAllCached ({parent, pageClean}) { throw new Error("Unimplemented!"); }
	};

	static _CacheAndGetAllPrerelease = class extends this._CacheAndGetAllPrereleaseBrew {
		static _SOURCE_ALL = DataLoaderConst.SOURCE_PRERELEASE_ALL_CURRENT;
		static _PROP_DATA = "prereleaseData";

		static _getAllCached ({parent, pageClean}) { return parent._CACHE.getAllPrerelease(pageClean); }
	};

	static _CacheAndGetAllBrew = class extends this._CacheAndGetAllPrereleaseBrew {
		static _SOURCE_ALL = DataLoaderConst.SOURCE_BREW_ALL_CURRENT;
		static _PROP_DATA = "brewData";

		static _getAllCached ({parent, pageClean}) { return parent._CACHE.getAllBrew(pageClean); }
	};

	/* -------------------------------------------- */

	static _PAGES_NO_CONTENT = new Set([
		DataLoaderInternalUtil.getCleanPage({page: "generic"}),
		DataLoaderInternalUtil.getCleanPage({page: "hover"}),
	]);

	/**
	 * @param page
	 * @param source
	 * @param hash
	 * @param [isCopy] If a copy, rather than the original entity, should be returned.
	 * @param [isRequired] If an error should be thrown on a missing entity.
	 * @param [isSilent] If errors should not be thrown on a missing implementation.
	 * @param [lockToken2] Post-process lock token for recursive calls.
	 */
	static async pCacheAndGet (page, source, hash, {isCopy = false, isRequired = false, isSilent = false, lockToken2} = {}) {
		const fromCache = this.getFromCache(page, source, hash, {isCopy, _isReturnSentinel: true});
		if (fromCache === DataLoaderConst.ENTITY_NULL) return this._getVerifiedRequiredEntity({pageClean: page, sourceClean: source, hashClean: hash, ent: null, isRequired});
		if (fromCache) return fromCache;

		const {page: pageClean, source: sourceClean, hash: hashClean} = DataLoaderInternalUtil.getCleanPageSourceHash({page, source, hash});

		if (this._PAGES_NO_CONTENT.has(pageClean)) return this._getVerifiedRequiredEntity({pageClean, sourceClean, hashClean, ent: null, isRequired});

		const dataLoader = this._pCache_getDataTypeLoader({pageClean, isSilent});
		if (!dataLoader) return this._getVerifiedRequiredEntity({pageClean, sourceClean, hashClean, ent: null, isRequired});

		const isUnavailablePrerelease = await this._PrereleasePreloader._pPreloadMissing({parent: this, sourceClean});
		if (isUnavailablePrerelease) return this._getVerifiedRequiredEntity({pageClean, sourceClean, hashClean, ent: null, isRequired});

		const isUnavailableBrew = await this._BrewPreloader._pPreloadMissing({parent: this, sourceClean});
		if (isUnavailableBrew) return this._getVerifiedRequiredEntity({pageClean, sourceClean, hashClean, ent: null, isRequired});

		await dataLoader.pLoadDependencies({lockToken2});

		const {siteData = null, prereleaseData = null, brewData = null} = await this._pCacheAndGet_getCacheMeta({pageClean, sourceClean, dataLoader});
		await this._pCacheAndGet_processCacheMeta({dataLoader, siteData, prereleaseData, brewData, lockToken2});

		return this.getFromCache(page, source, hash, {isCopy, isRequired, _isInsertSentinelOnMiss: true});
	}

	static async pCacheAndGetHash (page, hash, opts) {
		const {source} = await UrlUtil.pAutoDecodeHash(hash, {page});
		if (!source) {
			if (opts?.isRequired) throw new Error(`Could not find entity for page "${page}" with hash "${hash}"`);
			return null;
		}
		return DataLoader.pCacheAndGet(page, source, hash, opts);
	}

	static _PrereleaseBrewPreloader = class {
		static _LOCK_0;
		static _SOURCES_ATTEMPTED;
		/** Cache of clean (lowercase) source -> URL. */
		static _CACHE_SOURCE_CLEAN_TO_URL;
		static _SOURCE_ALL;

		/**
		 * Phase 0: check if prerelease/homebrew, and if so, check/load the source (if available).
		 *   Track failures (i.e., there is no available JSON for the source requested), and skip repeated failures.
		 *   This allows us to avoid an expensive mass re-cache, if a source which does not exist is requested for
		 *   loading multiple times.
		 */
		static async pPreloadMissing ({parent, sourceClean}) {
			try {
				await this._LOCK_0.pLock();
				return (await this._pPreloadMissing({parent, sourceClean}));
			} finally {
				this._LOCK_0.unlock();
			}
		}

		/**
		 * @param parent
		 * @param sourceClean
		 * @return {Promise<boolean>} `true` if the source does not exist and could not be loaded, false otherwise.
		 */
		static async _pPreloadMissing ({parent, sourceClean}) {
			if (this._isExistingMiss({parent, sourceClean})) return true;

			if (!this._isPossibleSource({parent, sourceClean})) return false;
			if (sourceClean === this._SOURCE_ALL) return false;

			const brewUtil = this._getBrewUtil();
			if (!brewUtil) {
				this._setExistingMiss({parent, sourceClean});
				return true;
			}

			if (brewUtil.hasSourceJson(sourceClean)) return false;

			const urlBrew = await this._pGetSourceUrl({parent, sourceClean});
			if (!urlBrew) {
				this._setExistingMiss({parent, sourceClean});
				return true;
			}

			await brewUtil.pAddBrewFromUrl(urlBrew);
			return false;
		}

		static _isExistingMiss ({sourceClean}) {
			return this._SOURCES_ATTEMPTED.has(sourceClean);
		}

		static _setExistingMiss ({sourceClean}) {
			this._SOURCES_ATTEMPTED.add(sourceClean);
		}

		/* -------------------------------------------- */

		static async _pInitCacheSourceToUrl () {
			if (this._CACHE_SOURCE_CLEAN_TO_URL) return;

			const index = await this._pGetUrlIndex();
			if (!index) return this._CACHE_SOURCE_CLEAN_TO_URL = {};

			const brewUtil = this._getBrewUtil();
			const urlRoot = await brewUtil.pGetCustomUrl();

			this._CACHE_SOURCE_CLEAN_TO_URL = Object.entries(index)
				.mergeMap(([src, url]) => ({[DataLoaderInternalUtil.getCleanSource({source: src})]: brewUtil.getFileUrl(url, urlRoot)}));
		}

		static async _pGetUrlIndex () {
			try {
				return (await this._pGetSourceIndex());
			} catch (e) {
				setTimeout(() => { throw e; });
				return null;
			}
		}

		static async _pGetSourceUrl ({sourceClean}) {
			await this._pInitCacheSourceToUrl();
			return this._CACHE_SOURCE_CLEAN_TO_URL[sourceClean];
		}

		/** @abstract */
		static _isPossibleSource ({parent, sourceClean}) { throw new Error("Unimplemented!"); }
		/** @abstract */
		static _getBrewUtil () { throw new Error("Unimplemented!"); }
		/** @abstract */
		static _pGetSourceIndex () { throw new Error("Unimplemented!"); }
	};

	static _PrereleasePreloader = class extends this._PrereleaseBrewPreloader {
		static _LOCK_0 = new VeLock({isDbg: false, name: "loader-lock-0--prerelease"});
		static _SOURCE_ALL = DataLoaderConst.SOURCE_BREW_ALL_CURRENT;
		static _SOURCES_ATTEMPTED = new Set();
		static _CACHE_SOURCE_CLEAN_TO_URL = null;

		static _isPossibleSource ({parent, sourceClean}) { return parent._isPrereleaseSource({sourceClean}) && !Parser.SOURCE_JSON_TO_FULL[Parser.sourceJsonToJson(sourceClean)]; }
		static _getBrewUtil () { return typeof PrereleaseUtil !== "undefined" ? PrereleaseUtil : null; }
		static async _pGetSourceIndex () { return DataUtil.prerelease.pLoadSourceIndex(await PrereleaseUtil.pGetCustomUrl()); }
	};

	static _BrewPreloader = class extends this._PrereleaseBrewPreloader {
		static _LOCK_0 = new VeLock({isDbg: false, name: "loader-lock-0--brew"});
		static _SOURCE_ALL = DataLoaderConst.SOURCE_PRERELEASE_ALL_CURRENT;
		static _SOURCES_ATTEMPTED = new Set();
		static _CACHE_SOURCE_CLEAN_TO_URL = null;

		static _isPossibleSource ({parent, sourceClean}) { return !parent._isSiteSource({sourceClean}) && !parent._isPrereleaseSource({sourceClean}); }
		static _getBrewUtil () { return typeof BrewUtil2 !== "undefined" ? BrewUtil2 : null; }
		static async _pGetSourceIndex () { return DataUtil.brew.pLoadSourceIndex(await BrewUtil2.pGetCustomUrl()); }
	};

	static async _pCacheAndGet_getCacheMeta ({pageClean, sourceClean, dataLoader}) {
		try {
			await this._LOCK_1.pLock();
			return (await this._pCache({pageClean, sourceClean, dataLoader}));
		} finally {
			this._LOCK_1.unlock();
		}
	}

	static async _pCache ({pageClean, sourceClean, dataLoader}) {
		// region Fetch from site data
		const siteData = await dataLoader.pGetSiteData({pageClean, sourceClean});
		this._pCache_addToCache({allDataMerged: siteData, propAllowlist: dataLoader.phase1CachePropAllowlist || new Set(dataLoader.constructor.PROPS)});
		// Always early-exit, regardless of whether the entity was found in the cache, if we know this is a site source
		if (this._isSiteSource({sourceClean})) return {siteData};
		// endregion

		const out = {siteData};

		// region Fetch from already-stored prerelease/brew data
		//   As we have preloaded missing prerelease/brew earlier in the flow, we know that a prerelease/brew is either
		//   present, or unavailable
		if (typeof PrereleaseUtil !== "undefined") {
			const prereleaseData = await dataLoader.pGetStoredPrereleaseData();
			this._pCache_addToCache({allDataMerged: prereleaseData, propAllowlist: dataLoader.phase1CachePropAllowlist || new Set(dataLoader.constructor.PROPS)});
			out.prereleaseData = prereleaseData;
		}

		if (typeof BrewUtil2 !== "undefined") {
			const brewData = await dataLoader.pGetStoredBrewData();
			this._pCache_addToCache({allDataMerged: brewData, propAllowlist: dataLoader.phase1CachePropAllowlist || new Set(dataLoader.constructor.PROPS)});
			out.brewData = brewData;
		}
		// endregion

		return out;
	}

	static async _pCacheAndGet_processCacheMeta ({dataLoader, siteData = null, prereleaseData = null, brewData = null, lockToken2 = null}) {
		if (!dataLoader.hasPhase2Cache) return;

		try {
			lockToken2 = await this._LOCK_2.pLock({token: lockToken2});
			await this._pCacheAndGet_processCacheMeta_({dataLoader, siteData, prereleaseData, brewData, lockToken2});
		} finally {
			this._LOCK_2.unlock();
		}
	}

	static async _pCacheAndGet_processCacheMeta_ ({dataLoader, siteData = null, prereleaseData = null, brewData = null, lockToken2 = null}) {
		const {siteDataPostCache, prereleaseDataPostCache, brewDataPostCache} = await dataLoader.pGetPostCacheData({siteData, prereleaseData, brewData, lockToken2});

		this._pCache_addToCache({allDataMerged: siteDataPostCache, propAllowlist: dataLoader.phase2CachePropAllowlist || new Set(dataLoader.constructor.PROPS)});
		this._pCache_addToCache({allDataMerged: prereleaseDataPostCache, propAllowlist: dataLoader.phase2CachePropAllowlist || new Set(dataLoader.constructor.PROPS)});
		this._pCache_addToCache({allDataMerged: brewDataPostCache, propAllowlist: dataLoader.phase2CachePropAllowlist || new Set(dataLoader.constructor.PROPS)});
	}

	static _pCache_getDataTypeLoader ({pageClean, isSilent}) {
		const dataLoader = this._DATA_TYPE_LOADERS[pageClean];
		if (!dataLoader && !isSilent) throw new Error(`No loading strategy found for page "${pageClean}"!`);
		return dataLoader;
	}

	static _pCache_addToCache ({allDataMerged, propAllowlist}) {
		if (!allDataMerged) return;

		allDataMerged = {...allDataMerged};

		this._DATA_TYPE_LOADER_LIST
			.filter(loader => loader.hasCustomCacheStrategy({obj: allDataMerged}))
			.forEach(loader => {
				const propsToRemove = loader.addToCacheCustom({cache: this._CACHE, obj: allDataMerged, propAllowlist});
				propsToRemove.forEach(prop => delete allDataMerged[prop]);
			});

		Object.keys(allDataMerged)
			.forEach(prop => {
				if (!propAllowlist.has(prop)) return;

				const arr = allDataMerged[prop];
				if (!arr?.length || !(arr instanceof Array)) return;

				const hashBuilder = UrlUtil.URL_TO_HASH_BUILDER[prop];
				if (!hashBuilder) return;

				arr.forEach(ent => {
					this._pCache_addEntityToCache({prop, hashBuilder, ent});
					DataUtil.proxy.getVersions(prop, ent)
						.forEach(entVer => this._pCache_addEntityToCache({prop, hashBuilder, ent: entVer}));
				});
			});
	}

	static _pCache_addEntityToCache ({prop, hashBuilder, ent}) {
		ent.__prop = ent.__prop || prop;

		const page = this._PROP_TO_HASH_PAGE[prop];
		const source = SourceUtil.getEntitySource(ent); //
		const hash = hashBuilder(ent);

		const {page: propClean, source: sourceClean, hash: hashClean} = DataLoaderInternalUtil.getCleanPageSourceHash({page: prop, source, hash});
		const pageClean = page ? DataLoaderInternalUtil.getCleanPage({page}) : null;

		this._CACHE.set(propClean, sourceClean, hashClean, ent);
		if (pageClean) this._CACHE.set(pageClean, sourceClean, hashClean, ent);
	}

	/* -------------------------------------------- */

	static _CACHE_SITE_SOURCE_CLEAN = null;

	static _doBuildSourceCaches () {
		this._CACHE_SITE_SOURCE_CLEAN = this._CACHE_SITE_SOURCE_CLEAN || new Set(Object.keys(Parser.SOURCE_JSON_TO_FULL)
			.map(src => DataLoaderInternalUtil.getCleanSource({source: src})));
	}

	static _isSiteSource ({sourceClean}) {
		if (sourceClean === DataLoaderConst.SOURCE_SITE_ALL) return true;
		if (sourceClean === DataLoaderConst.SOURCE_BREW_ALL_CURRENT) return false;
		if (sourceClean === DataLoaderConst.SOURCE_PRERELEASE_ALL_CURRENT) return false;

		this._doBuildSourceCaches();

		return this._CACHE_SITE_SOURCE_CLEAN.has(sourceClean);
	}

	static _isPrereleaseSource ({sourceClean}) {
		if (sourceClean === DataLoaderConst.SOURCE_SITE_ALL) return false;
		if (sourceClean === DataLoaderConst.SOURCE_BREW_ALL_CURRENT) return false;
		if (sourceClean === DataLoaderConst.SOURCE_PRERELEASE_ALL_CURRENT) return true;

		this._doBuildSourceCaches();

		return sourceClean.startsWith(DataLoaderInternalUtil.getCleanSource({source: Parser.SRC_UA_PREFIX}))
			|| sourceClean.startsWith(DataLoaderInternalUtil.getCleanSource({source: Parser.SRC_UA_ONE_PREFIX}));
	}

	/* -------------------------------------------- */

	static getDiagnosticsSummary (diagnostics) {
		diagnostics = diagnostics.filter(Boolean);
		if (!diagnostics.length) return "";

		const filenames = diagnostics
			.map(it => it.filename)
			.filter(Boolean)
			.unique()
			.sort(SortUtil.ascSortLower);

		if (!filenames.length) return "";

		return `Filename${filenames.length === 1 ? " was" : "s were"}: ${filenames.map(it => `"${it}"`).join("; ")}.`;
	}
}

// endregion
