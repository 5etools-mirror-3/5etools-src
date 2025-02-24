import {BrewUtilShared} from "./utils-brew-helpers.js";
import {BrewDoc} from "./utils-brew-models.js";

export class BrewUtil2Base {
	_STORAGE_KEY_LEGACY;
	_STORAGE_KEY_LEGACY_META;

	// Keep these distinct from the OG brew key, so users can recover their old brew if required.
	_STORAGE_KEY;
	_STORAGE_KEY_META;

	_STORAGE_KEY_CUSTOM_URL;
	_STORAGE_KEY_MIGRATION_VERSION;

	_VERSION;

	_PATH_LOCAL_DIR;
	_PATH_LOCAL_INDEX;

	IS_EDITABLE;
	PAGE_MANAGE;
	URL_REPO_DEFAULT;
	URL_REPO_ROOT_DEFAULT;
	DISPLAY_NAME;
	DISPLAY_NAME_PLURAL;
	DEFAULT_AUTHOR;
	STYLE_BTN;
	IS_PREFER_DATE_ADDED;

	_LOCK = new VeLock({name: this.constructor.name});

	_cache_iteration = 0;
	_cache_brewsProc = null;
	_cache_metas = null;
	_cache_brews = null;
	_cache_brewsLocal = null;

	_isDirty = false;

	_brewsTemp = [];
	_addLazy_brewsTemp = [];

	_storage = StorageUtil;

	_parent = null;

	/**
	 * @param {?BrewUtil2Base} parent
	 */
	constructor ({parent = null} = {}) {
		this._parent = parent;
	}

	/* -------------------------------------------- */

	_pActiveInit = null;

	pInit () {
		this._pActiveInit ||= (async () => {
			// region Ensure the local homebrew cache is hot, to allow us to fetch from it later in a sync manner.
			//   This is necessary to replicate the "meta" caching done for non-local brew.
			await this._pGetBrew_pGetLocalBrew();
			// endregion

			this._pInit_doBindDragDrop();
			this._pInit_pDoLoadFonts().then(null);
		})();
		return this._pActiveInit;
	}

	/** @abstract */
	_pInit_doBindDragDrop () { throw new Error("Unimplemented!"); }

	async _pInit_pDoLoadFonts () {
		const fontFaces = Object.entries(
			(this._getBrewMetas() || [])
				.map(({_meta}) => _meta?.fonts || {})
				.mergeMap(it => it),
		)
			.map(([family, fontUrl]) => new FontFace(family, `url("${fontUrl}")`));

		const results = await Promise.allSettled(
			fontFaces.map(async fontFace => {
				await fontFace.load();
				return document.fonts.add(fontFace);
			}),
		);

		const errors = results
			.filter(({status}) => status === "rejected")
			.map(({reason}, i) => ({message: `Font "${fontFaces[i].family}" failed to load!`, reason}));
		if (errors.length) {
			errors.forEach(({message}) => JqueryUtil.doToast({type: "danger", content: message}));
			setTimeout(() => { throw new Error(errors.map(({message, reason}) => [message, reason].join("\n")).join("\n\n")); });
		}

		return document.fonts.ready;
	}

	/* -------------------------------------------- */

	async pGetCustomUrl () { return this._storage.pGet(this._STORAGE_KEY_CUSTOM_URL); }

	async pSetCustomUrl (val) {
		await (!val
			? this._storage.pRemove(this._STORAGE_KEY_CUSTOM_URL)
			: this._storage.pSet(this._STORAGE_KEY_CUSTOM_URL, val));

		location.reload();
	}

	/* -------------------------------------------- */

	isReloadRequired () { return this._isDirty; }

	doLocationReload ({isRetainHash = false} = {}) {
		if (!isRetainHash) {
			if (typeof Hist !== "undefined") Hist.doPreLocationReload();
			else window.location.hash = "";
		}

		location.reload();
	}

	_getBrewMetas () {
		return [
			...(this._storage.syncGet(this._STORAGE_KEY_META) || []),
			...(this._cache_brewsLocal || []).map(brew => this._getBrewDocReduced(brew)),
		];
	}

	_setBrewMetas (val) {
		this._cache_metas = null;
		return this._storage.syncSet(this._STORAGE_KEY_META, val);
	}

	/** Fetch the brew as though it has been loaded from site URL. */
	async pGetBrewProcessed () {
		if (this._cache_brewsProc) return this._cache_brewsProc; // Short-circuit if the cache is already available

		try {
			const lockToken = await this._LOCK.pLock();
			if (this._cache_brewsProc) return this._cache_brewsProc;
			await this._pGetBrewProcessed_({lockToken});
		} catch (e) {
			setTimeout(() => { throw e; });
		} finally {
			this._LOCK.unlock();
		}
		return this._cache_brewsProc;
	}

	async _pGetBrewProcessed_ ({lockToken}) {
		const cpyBrews = MiscUtil.copyFast([
			...await this.pGetBrew({lockToken}),
			...this._brewsTemp,
		]);
		if (!cpyBrews.length) return this._cache_brewsProc = {};

		await this._pGetBrewProcessed_pDoBlocklistExtension({cpyBrews});

		// Add per-file diagnostics
		cpyBrews.forEach(({head, body}) => this._pGetBrewProcessed_mutDiagnostics({head, body}));

		// Merge into single object; apply data migrations
		const cpyBrewsMerged = this._pGetBrewProcessed_getMergedOutput({cpyBrews});

		// Apply "_copy" etc.
		this._cache_brewsProc = await DataUtil.pDoMetaMerge(CryptUtil.uid(), cpyBrewsMerged, {isSkipMetaMergeCache: true});

		return this._cache_brewsProc;
	}

	/** Homebrew files can contain embedded blocklists. */
	async _pGetBrewProcessed_pDoBlocklistExtension ({cpyBrews}) {
		for (const {body} of cpyBrews) {
			if (!body?.blocklist?.length || !(body.blocklist instanceof Array)) continue;
			await ExcludeUtil.pExtendList(body.blocklist);
		}
	}

	_pGetBrewProcessed_mutDiagnostics ({head, body}) {
		if (!head.filename) return;

		for (const arr of Object.values(body)) {
			if (!(arr instanceof Array)) continue;
			for (const ent of arr) {
				if (!("__prop" in ent)) break;
				ent.__diagnostic = {filename: head.filename};
			}
		}
	}

	_pGetBrewProcessed_getMergedOutput ({cpyBrews}) {
		return BrewDoc.mergeObjects(undefined, ...cpyBrews.map(({body}) => body));
	}

	/**
	 * TODO refactor such that this is not necessary
	 * @deprecated
	 */
	getBrewProcessedFromCache (prop) {
		return this._cache_brewsProc?.[prop] || [];
	}

	/* -------------------------------------------- */

	/** Fetch the raw brew from storage. */
	async pGetBrew ({lockToken} = {}) {
		if (this._cache_brews) return this._cache_brews;

		try {
			lockToken = await this._LOCK.pLock({token: lockToken});
			if (this._cache_brews) return this._cache_brews;

			const out = [
				...(await this._pGetBrewRaw({lockToken})),
				...(await this._pGetBrew_pGetLocalBrew({lockToken})),
			];

			return this._cache_brews = out
				// Ensure no brews which lack sources are loaded
				.filter(brew => brew?.body?._meta?.sources?.length);
		} finally {
			this._LOCK.unlock();
		}
	}

	/* -------------------------------------------- */

	async pGetBrewBySource (source, {lockToken} = {}) {
		const brews = await this.pGetBrew({lockToken});
		return brews.find(brew => brew?.body?._meta?.sources?.some(src => src?.json === source));
	}

	/* -------------------------------------------- */

	async _pGetBrew_pGetLocalBrew ({lockToken} = {}) {
		if (this._cache_brewsLocal) return this._cache_brewsLocal;
		if (IS_VTT || IS_DEPLOYED || typeof window === "undefined") return this._cache_brewsLocal = [];

		try {
			await this._LOCK.pLock({token: lockToken});
			if (this._cache_brewsLocal) return this._cache_brewsLocal;
			return (await this._pGetBrew_pGetLocalBrew_());
		} finally {
			this._LOCK.unlock();
		}
	}

	async _pGetBrew_pGetLocalBrew_ () {
		// auto-load from `prerelease/` and `homebrew/`, for custom versions of the site
		const indexLocal = await DataUtil.loadJSON(`${Renderer.get().baseUrl}${this._PATH_LOCAL_INDEX}`);
		if (!indexLocal?.toImport?.length) return this._cache_brewsLocal = [];

		const brewDocs = (await indexLocal.toImport
			.pMap(async name => {
				name = `${name}`.trim();
				const url = /^https?:\/\//.test(name) ? name : `${Renderer.get().baseUrl}${this._PATH_LOCAL_DIR}/${name}`;
				const filename = UrlUtil.getFilename(url);
				try {
					const json = await DataUtil.loadRawJSON(url);
					return this._getBrewDoc({json, url, filename, isLocal: true});
				} catch (e) {
					JqueryUtil.doToast({type: "danger", content: `Failed to load local homebrew from URL "${url}"! ${VeCt.STR_SEE_CONSOLE}`});
					setTimeout(() => { throw e; });
					return null;
				}
			}))
			.filter(Boolean);

		return this._cache_brewsLocal = brewDocs;
	}

	/* -------------------------------------------- */

	async _pGetBrewRaw ({lockToken} = {}) {
		try {
			await this._LOCK.pLock({token: lockToken});
			return (await this._pGetBrewRaw_());
		} finally {
			this._LOCK.unlock();
		}
	}

	async _pGetBrewRaw_ () {
		const brewRaw = (await this._storage.pGet(this._STORAGE_KEY)) || [];

		// Assume that any potential migration has been completed if the user has new homebrew
		if (brewRaw.length) return brewRaw;

		const {version, existingMeta, existingBrew} = await this._pGetMigrationInfo();

		if (version === this._VERSION) return brewRaw;

		if (!existingMeta || !existingBrew) {
			await this._storage.pSet(this._STORAGE_KEY_MIGRATION_VERSION, this._VERSION);
			return brewRaw;
		}

		// If the user has no new homebrew, and some old homebrew, migrate the old homebrew.
		// Move the existing brew to the editable document--we do this as there is no guarantee that the user has not e.g.
		//   edited the brew they had saved.
		const brewEditable = this._getNewEditableBrewDoc();

		const cpyBrewEditableDoc = BrewDoc.fromObject(brewEditable, {isCopy: true})
			.mutMerge({
				json: {
					_meta: existingMeta || {},
					...existingBrew,
				},
			});

		await this._pSetBrew_({val: [cpyBrewEditableDoc], isInitialMigration: true});

		// Update the version, but do not delete the legacy brew--if the user really wants to get rid of it, they can
		//   clear their storage/etc.
		await this._storage.pSet(this._STORAGE_KEY_MIGRATION_VERSION, this._VERSION);

		JqueryUtil.doToast(`Migrated ${this.DISPLAY_NAME} from version ${version} to version ${this._VERSION}!`);

		return this._storage.pGet(this._STORAGE_KEY);
	}

	_getNewEditableBrewDoc () {
		const json = {_meta: {sources: []}};
		return this._getBrewDoc({json, isEditable: true});
	}

	/* -------------------------------------------- */

	async _pGetMigrationInfo () {
		// If there is no migration support, return default info
		if (!this._STORAGE_KEY_LEGACY && !this._STORAGE_KEY_LEGACY_META) return {version: this._VERSION, existingBrew: null, existingMeta: null};

		const version = await this._storage.pGet(this._STORAGE_KEY_MIGRATION_VERSION);

		// Short-circuit if we know we're already on the right version, to avoid loading old data
		if (version === this._VERSION) return {version};

		const existingBrew = await this._storage.pGet(this._STORAGE_KEY_LEGACY);
		const existingMeta = await this._storage.syncGet(this._STORAGE_KEY_LEGACY_META);

		return {
			version: version ?? 1,
			existingBrew,
			existingMeta,
		};
	}

	/* -------------------------------------------- */

	getCacheIteration () { return this._cache_iteration; }

	/* -------------------------------------------- */

	async pSetBrew (val, {lockToken} = {}) {
		try {
			await this._LOCK.pLock({token: lockToken});
			await this._pSetBrew_({val});
		} finally {
			this._LOCK.unlock();
		}
	}

	async _pSetBrew_ ({val, isInitialMigration}) {
		this._mutBrewsForSet(val);

		if (!isInitialMigration) {
			if (this._cache_brewsProc) this._cache_iteration++;
			this._cache_brews = null;
			this._cache_brewsProc = null;
		}
		await this._storage.pSet(this._STORAGE_KEY, val);

		if (!isInitialMigration) this._isDirty = true;
	}

	_mutBrewsForSet (val) {
		if (!(val instanceof Array)) throw new Error(`${this.DISPLAY_NAME.uppercaseFirst()} array must be an array!`);

		this._setBrewMetas(val.map(brew => this._getBrewDocReduced(brew)));
	}

	/* -------------------------------------------- */

	_getBrewId (brew) {
		if (brew.head.url) return brew.head.url;
		if (brew.body._meta?.sources?.length) return brew.body._meta.sources.map(src => (src.json || "").toLowerCase()).sort(SortUtil.ascSortLower).join(" :: ");
		return null;
	}

	_getNextBrews (brews, brewsToAdd) {
		const idsToAdd = new Set(brewsToAdd.map(brews => this._getBrewId(brews)).filter(Boolean));
		brews = brews.filter(brew => {
			const id = this._getBrewId(brew);
			if (id == null) return true;
			return !idsToAdd.has(id);
		});
		return [...brews, ...brewsToAdd];
	}

	/* -------------------------------------------- */

	async _pLoadParentDependencies ({unavailableSources}) {
		if (!unavailableSources?.length) return false;
		if (!this._parent) return false;

		await Promise.allSettled(unavailableSources.map(async source => {
			const url = await this._parent.pGetSourceUrl(source);
			if (!url) return;
			await this._parent.pAddBrewFromUrl(url, {isLazy: true});
		}));
		await this._parent.pAddBrewsLazyFinalize();

		return false;
	}

	/* -------------------------------------------- */

	async _pGetBrewDependencies ({brewDocs, brewsRaw = null, brewsRawLocal = null, isIgnoreNetworkErrors = false, lockToken}) {
		try {
			lockToken = await this._LOCK.pLock({token: lockToken});
			return (await this._pGetBrewDependencies_({brewDocs, brewsRaw, brewsRawLocal, isIgnoreNetworkErrors, lockToken}));
		} finally {
			this._LOCK.unlock();
		}
	}

	async _pGetBrewDependencies_ ({brewDocs, brewsRaw = null, brewsRawLocal = null, isIgnoreNetworkErrors = false, lockToken}) {
		const urlRoot = await this.pGetCustomUrl();
		const brewIndex = await this._pGetBrewDependencies_getBrewIndex({urlRoot, isIgnoreNetworkErrors});

		const toLoadSources = [];
		const loadedSources = new Set();

		const unavailableSources = new Set();
		const brewDocsDependencies = [];

		brewsRaw = brewsRaw || await this._pGetBrewRaw({lockToken});
		brewsRawLocal = brewsRawLocal || await this._pGetBrew_pGetLocalBrew({lockToken});

		brewDocs.forEach(brewDoc => this._pGetBrewDependencies_mutAddLoaded({loadedSources, brewDoc}));
		brewsRaw.forEach(brewDoc => this._pGetBrewDependencies_mutAddLoaded({loadedSources, brewDoc}));
		brewsRawLocal.forEach(brewDoc => this._pGetBrewDependencies_mutAddLoaded({loadedSources, brewDoc}));

		brewDocs
			.forEach(brewDoc => {
				const {available, unavailable} = this._getBrewDependencySources({brewDoc, brewIndex});
				available.forEach(src => this._pGetBrewDependencies_mutAddToLoad({loadedSources, toLoadSources, src}));
				unavailable.forEach(src => unavailableSources.add(src));
			});

		while (toLoadSources.length) {
			const src = toLoadSources.pop();
			if (loadedSources.has(src)) continue;
			loadedSources.add(src);

			const url = this.getFileUrl(brewIndex[src], urlRoot);
			const brewDocDep = await this._pGetBrewDocFromUrl({url});
			brewDocsDependencies.push(brewDocDep);
			this._pGetBrewDependencies_mutAddLoaded({loadedSources, brewDoc: brewDocDep});

			const {available, unavailable} = this._getBrewDependencySources({brewDoc: brewDocDep, brewIndex});
			available.forEach(src => this._pGetBrewDependencies_mutAddToLoad({loadedSources, toLoadSources, src}));
			unavailable.forEach(src => unavailableSources.add(src));
		}

		return {
			brewDocsDependencies,
			unavailableSources: [...unavailableSources].sort(SortUtil.ascSortLower),
		};
	}

	_pGetBrewDependencies_mutAddLoaded ({loadedSources, brewDoc}) {
		(brewDoc.body._meta?.sources || [])
			.filter(src => src.json)
			.forEach(src => loadedSources.add(src.json));
	}

	_pGetBrewDependencies_mutAddToLoad ({loadedSources, toLoadSources, src}) {
		if (loadedSources.has(src) || toLoadSources.includes(src)) return;
		toLoadSources.push(src);
	}

	async _pGetBrewDependencies_getBrewIndex ({urlRoot, isIgnoreNetworkErrors = false}) {
		try {
			return (await this.pGetSourceIndex(urlRoot));
		} catch (e) {
			// Support limited use for e.g. offline file uploads
			if (isIgnoreNetworkErrors) return {};
			throw e;
		}
	}

	async pGetSourceUrl (source) {
		const urlRoot = await this.pGetCustomUrl();
		const brewIndex = await this.pGetSourceIndex(urlRoot);

		if (brewIndex[source]) return this.getFileUrl(brewIndex[source], urlRoot);

		const sourceLower = source.toLowerCase();
		if (brewIndex[sourceLower]) return this.getFileUrl(brewIndex[sourceLower], urlRoot);

		const sourceOriginal = Object.keys(brewIndex).find(k => k.toLowerCase() === sourceLower);
		if (!brewIndex[sourceOriginal]) return null;
		return this.getFileUrl(brewIndex[sourceOriginal], urlRoot);
	}

	/* -------------------------------------------- */

	/** @abstract */
	async pGetSourceIndex (urlRoot) { throw new Error("Unimplemented!"); }
	/** @abstract */
	getFileUrl (path, urlRoot) { throw new Error("Unimplemented!"); }
	/** @abstract */
	pLoadTimestamps (urlRoot) { throw new Error("Unimplemented!"); }
	/** @abstract */
	pLoadPropIndex (urlRoot) { throw new Error("Unimplemented!"); }
	/** @abstract */
	pLoadMetaIndex (urlRoot) { throw new Error("Unimplemented!"); }
	/** @abstract */
	pLoadAdventureBookIdsIndex (urlRoot) { throw new Error("Unimplemented!"); }

	async pGetCombinedIndexes () {
		const urlRoot = await this.pGetCustomUrl();

		const indexes = await this._pGetCombinedIndexes_pGetIndexes({urlRoot});
		// Tolerate e.g. opening when offline
		if (!indexes) return null;

		const {timestamps, propIndex, metaIndex, sourceIndex} = indexes;

		const pathToMeta = {};
		Object.entries(propIndex)
			.forEach(([prop, pathToDir]) => {
				Object.entries(pathToDir)
					.forEach(([path, dir]) => {
						pathToMeta[path] = pathToMeta[path] || {dir, props: []};
						pathToMeta[path].props.push(prop);
					});
			});

		Object.entries(sourceIndex)
			.forEach(([src, path]) => {
				if (!pathToMeta[path]) return;
				(pathToMeta[path].sources ||= []).push(src);
			});

		return Object.entries(pathToMeta)
			.map(([path, meta]) => {
				const out = {
					urlDownload: this.getFileUrl(path, urlRoot),
					path,
					name: UrlUtil.getFilename(path),
					dirProp: this.getDirProp(meta.dir),
					props: meta.props,
					sources: meta.sources,
				};

				const spl = out.name.trim().replace(/\.json$/, "").split(";").map(it => it.trim());
				if (spl.length > 1) {
					out._brewName = spl[1];
					out._brewAuthor = spl[0];
				} else {
					out._brewName = spl[0];
					out._brewAuthor = this.DEFAULT_AUTHOR;
				}

				out._brewAdded = timestamps[out.path]?.a ?? 0;
				out._brewModified = timestamps[out.path]?.m ?? 0;
				out._brewPublished = timestamps[out.path]?.p ?? 0;
				out._brewInternalSources = metaIndex[out.name]?.n || [];
				out._brewStatus = metaIndex[out.name]?.s || "ready";
				out._brewIsPartnered = !!metaIndex[out.name]?.p;
				out._brewPropDisplayName = this.getPropDisplayName(out.dirProp);

				return out;
			})
			.sort((a, b) => SortUtil.ascSortLower(a._brewName, b._brewName));
	}

	async _pGetCombinedIndexes_pGetIndexes ({urlRoot}) {
		try {
			const [timestamps, propIndex, metaIndex, sourceIndex] = await Promise.all([
				this.pLoadTimestamps(urlRoot),
				this.pLoadPropIndex(urlRoot),
				this.pLoadMetaIndex(urlRoot),
				this.pGetSourceIndex(urlRoot),
			]);
			return {
				timestamps,
				propIndex,
				metaIndex,
				sourceIndex,
			};
		} catch (e) {
			JqueryUtil.doToast({content: `Failed to load ${this.DISPLAY_NAME} indexes! ${VeCt.STR_SEE_CONSOLE}`, type: "danger"});
			setTimeout(() => { throw e; });
			return null;
		}
	}

	/* -------------------------------------------- */

	_PROPS_DEPS = ["dependencies", "includes"];
	_PROPS_DEPS_DEEP = ["otherSources"];

	_getBrewDependencySources ({brewDoc, brewIndex}) {
		const sources = new Set();

		this._PROPS_DEPS.forEach(prop => {
			const obj = brewDoc.body._meta?.[prop];
			if (!obj || !Object.keys(obj).length) return;
			Object.values(obj)
				.flat()
				.forEach(src => sources.add(src));
		});

		this._PROPS_DEPS_DEEP.forEach(prop => {
			const obj = brewDoc.body._meta?.[prop];
			if (!obj || !Object.keys(obj).length) return;
			return Object.values(obj)
				.map(objSub => Object.keys(objSub))
				.flat()
				.forEach(src => sources.add(src));
		});

		const [available, unavailable] = [...sources]
			.segregate(src => brewIndex[src]);

		return {available, unavailable};
	}

	async pAddBrewFromUrl (url, {isLazy} = {}) {
		let brewDocs = []; let unavailableSources = [];

		try {
			({brewDocs, unavailableSources} = await this._pAddBrewFromUrl({url, isLazy}));
		} catch (e) {
			JqueryUtil.doToast({type: "danger", content: `Failed to load ${this.DISPLAY_NAME} from URL "${url}"! ${VeCt.STR_SEE_CONSOLE}`});
			setTimeout(() => { throw e; });
			return [];
		}

		await this._pLoadParentDependencies({unavailableSources});
		return brewDocs;
	}

	async _pGetBrewDocFromUrl ({url}) {
		const json = await DataUtil.loadRawJSON(url);
		return this._getBrewDoc({json, url, filename: UrlUtil.getFilename(url)});
	}

	async _pAddBrewFromUrl ({url, lockToken, isLazy}) {
		const brewDoc = await this._pGetBrewDocFromUrl({url});

		if (isLazy) {
			try {
				await this._LOCK.pLock({token: lockToken});
				this._addLazy_brewsTemp.push(brewDoc);
			} finally {
				this._LOCK.unlock();
			}

			return {brewDocs: [brewDoc], unavailableSources: []};
		}

		const brewDocs = [brewDoc]; const unavailableSources = [];
		try {
			lockToken = await this._LOCK.pLock({token: lockToken});
			const brews = MiscUtil.copyFast(await this._pGetBrewRaw({lockToken}));

			const {brewDocsDependencies, unavailableSources: unavailableSources_} = await this._pGetBrewDependencies({brewDocs, brewsRaw: brews, lockToken});
			brewDocs.push(...brewDocsDependencies);
			unavailableSources.push(...unavailableSources_);

			const brewsNxt = this._getNextBrews(brews, brewDocs);
			await this.pSetBrew(brewsNxt, {lockToken});
		} finally {
			this._LOCK.unlock();
		}

		return {brewDocs, unavailableSources};
	}

	async pAddBrewsFromFiles (files) {
		let brewDocs = []; let unavailableSources = [];

		try {
			const lockToken = await this._LOCK.pLock();
			({brewDocs, unavailableSources} = await this._pAddBrewsFromFiles({files, lockToken}));
		} catch (e) {
			JqueryUtil.doToast({type: "danger", content: `Failed to load ${this.DISPLAY_NAME} from file(s)! ${VeCt.STR_SEE_CONSOLE}`});
			setTimeout(() => { throw e; });
			return [];
		} finally {
			this._LOCK.unlock();
		}

		await this._pLoadParentDependencies({unavailableSources});
		return brewDocs;
	}

	async _pAddBrewsFromFiles ({files, lockToken}) {
		const brewDocs = files.map(file => this._getBrewDoc({json: file.json, filename: file.name}));

		const brews = MiscUtil.copyFast(await this._pGetBrewRaw({lockToken}));

		const {brewDocsDependencies, unavailableSources} = await this._pGetBrewDependencies({brewDocs, brewsRaw: brews, isIgnoreNetworkErrors: true, lockToken});
		brewDocs.push(...brewDocsDependencies);

		const brewsNxt = this._getNextBrews(brews, brewDocs);
		await this.pSetBrew(brewsNxt, {lockToken});

		return {brewDocs, unavailableSources};
	}

	async pAddBrewsLazyFinalize () {
		let brewDocs = []; let unavailableSources = [];

		try {
			const lockToken = await this._LOCK.pLock();
			({brewDocs, unavailableSources} = await this._pAddBrewsLazyFinalize_({lockToken}));
		} catch (e) {
			JqueryUtil.doToast({type: "danger", content: `Failed to finalize ${this.DISPLAY_NAME_PLURAL}! ${VeCt.STR_SEE_CONSOLE}`});
			setTimeout(() => { throw e; });
			return [];
		} finally {
			this._LOCK.unlock();
		}

		await this._pLoadParentDependencies({unavailableSources});
		return brewDocs;
	}

	async _pAddBrewsLazyFinalize_ ({lockToken}) {
		const brewsRaw = await this._pGetBrewRaw({lockToken});
		const {brewDocsDependencies, unavailableSources} = await this._pGetBrewDependencies({brewDocs: this._addLazy_brewsTemp, brewsRaw, lockToken});
		const brewDocs = MiscUtil.copyFast(brewDocsDependencies);
		const brewsNxt = this._getNextBrews(MiscUtil.copyFast(brewsRaw), [...this._addLazy_brewsTemp, ...brewDocsDependencies]);
		await this.pSetBrew(brewsNxt, {lockToken});
		this._addLazy_brewsTemp = [];
		return {brewDocs, unavailableSources};
	}

	async pPullAllBrews ({brews} = {}) {
		try {
			const lockToken = await this._LOCK.pLock();
			return (await this._pPullAllBrews_({lockToken, brews}));
		} finally {
			this._LOCK.unlock();
		}
	}

	async _pPullAllBrews_ ({lockToken, brews}) {
		let cntPulls = 0;

		brews = brews || MiscUtil.copyFast(await this._pGetBrewRaw({lockToken}));
		const brewsNxt = await brews.pMap(async brew => {
			if (!this.isPullable(brew)) return brew;

			const json = await DataUtil.loadRawJSON(brew.head.url, {isBustCache: true});

			const localLastModified = brew.body._meta?.dateLastModified ?? 0;
			const sourceLastModified = json._meta?.dateLastModified ?? 0;

			if (sourceLastModified <= localLastModified) return brew;

			cntPulls++;
			return BrewDoc.fromObject(brew).mutUpdate({json}).toObject();
		});

		if (!cntPulls) return cntPulls;

		await this.pSetBrew(brewsNxt, {lockToken});
		return cntPulls;
	}

	isPullable (brew) { return !brew.head.isEditable && !!brew.head.url; }

	async pPullBrew (brew) {
		try {
			const lockToken = await this._LOCK.pLock();
			return (await this._pPullBrew_({brew, lockToken}));
		} finally {
			this._LOCK.unlock();
		}
	}

	async _pPullBrew_ ({brew, lockToken}) {
		const brews = await this._pGetBrewRaw({lockToken});
		if (!brews?.length) return;

		let isPull = false;
		const brewsNxt = await brews.pMap(async it => {
			if (it.head.docIdLocal !== brew.head.docIdLocal || !this.isPullable(it)) return it;

			const json = await DataUtil.loadRawJSON(it.head.url, {isBustCache: true});

			const localLastModified = it.body._meta?.dateLastModified ?? 0;
			const sourceLastModified = json._meta?.dateLastModified ?? 0;

			if (sourceLastModified <= localLastModified) return it;

			isPull = true;
			return BrewDoc.fromObject(it).mutUpdate({json}).toObject();
		});

		if (!isPull) return isPull;

		await this.pSetBrew(brewsNxt, {lockToken});
		return isPull;
	}

	async pAddBrewFromLoaderTag (ele) {
		const $ele = $(ele);
		if (!$ele.hasClass("rd__wrp-loadbrew--ready")) return; // an existing click is being handled
		let jsonPath = ele.dataset.rdLoaderPath;
		const name = ele.dataset.rdLoaderName;
		const cached = $ele.html();
		const cachedTitle = $ele.title();
		$ele.title("");
		$ele.removeClass("rd__wrp-loadbrew--ready").html(`${name.qq()}<span class="glyphicon glyphicon-refresh rd__loadbrew-icon rd__loadbrew-icon--active"></span>`);

		jsonPath = jsonPath.unescapeQuotes();
		if (!UrlUtil.isFullUrl(jsonPath)) {
			const brewUrl = await this.pGetCustomUrl();
			jsonPath = this.getFileUrl(jsonPath, brewUrl);
		}

		await this.pAddBrewFromUrl(jsonPath);
		$ele.html(`${name.qq()}<span class="glyphicon glyphicon-saved rd__loadbrew-icon"></span>`);
		setTimeout(() => $ele.html(cached).addClass("rd__wrp-loadbrew--ready").title(cachedTitle), 500);
	}

	async pAddBrewsPartnered ({isSilent = false} = {}) {
		const combinedIndexes = await this.pGetCombinedIndexes();

		const brewInfos = combinedIndexes.filter(it => it._brewIsPartnered);
		if (!brewInfos.length) {
			if (!isSilent) JqueryUtil.doToast({type: "warning", content: `Did not find any partnered ${this.DISPLAY_NAME} to load!`});
			return [];
		}

		if (!isSilent) JqueryUtil.doToast(`Found ${brewInfos.length} partnered ${brewInfos.length === 1 ? this.DISPLAY_NAME : this.DISPLAY_NAME_PLURAL}; loading...`);

		(
			await brewInfos
				.pMap(brewInfo => this.pAddBrewFromUrl(brewInfo.urlDownload, {isLazy: true}))
		)
			.sort((a, b) => SortUtil.ascSortLower(a._brewName, b._brewName));

		const brewDocsAdded = await this.pAddBrewsLazyFinalize();

		if (!isSilent) {
			const numAdded = brewInfos.length + brewDocsAdded.length;

			if (numAdded) JqueryUtil.doToast(`Loaded ${numAdded} partnered ${numAdded === 1 ? this.DISPLAY_NAME : this.DISPLAY_NAME_PLURAL}!`);
			else JqueryUtil.doToast({type: "warning", content: `Did not load any partnered ${this.DISPLAY_NAME}!`});
		}

		return brewDocsAdded;
	}

	_getBrewDoc ({json, url = null, filename = null, isLocal = false, isEditable = false}) {
		return BrewDoc.fromValues({
			head: {
				json,
				url,
				filename,
				isLocal,
				isEditable,
			},
			body: json,
		}).toObject();
	}

	_getBrewDocReduced (brewDoc) { return {docIdLocal: brewDoc.head.docIdLocal, _meta: brewDoc.body._meta}; }

	async pDeleteBrews (brews) {
		try {
			const lockToken = await this._LOCK.pLock();
			await this._pDeleteBrews_({brews, lockToken});
		} finally {
			this._LOCK.unlock();
		}
	}

	async _pDeleteBrews_ ({brews, lockToken}) {
		const brewsStored = await this._pGetBrewRaw({lockToken});
		if (!brewsStored?.length) return;

		const idsToDelete = new Set(brews.map(brew => brew.head.docIdLocal));

		const nxtBrews = brewsStored.filter(brew => !idsToDelete.has(brew.head.docIdLocal));
		await this.pSetBrew(nxtBrews, {lockToken});
	}

	async pDeleteUneditableBrews () {
		try {
			const lockToken = await this._LOCK.pLock();
			await this._pDeleteUneditableBrews_({lockToken});
		} finally {
			this._LOCK.unlock();
		}
	}

	async _pDeleteUneditableBrews_ ({lockToken}) {
		const brewsStored = await this._pGetBrewRaw({lockToken});
		if (!brewsStored?.length) return;

		const nxtBrews = brewsStored.filter(brew => brew.head.isEditable);
		await this.pSetBrew(nxtBrews, {lockToken});
	}

	async pUpdateBrew (brew) {
		try {
			const lockToken = await this._LOCK.pLock();
			await this._pUpdateBrew_({brew, lockToken});
		} finally {
			this._LOCK.unlock();
		}
	}

	async _pUpdateBrew_ ({brew, lockToken}) {
		const brews = await this._pGetBrewRaw({lockToken});
		if (!brews?.length) return;

		const nxtBrews = brews.map(it => it.head.docIdLocal !== brew.head.docIdLocal ? it : brew);
		await this.pSetBrew(nxtBrews, {lockToken});
	}

	// region Editable
	/** @abstract */
	pGetEditableBrewDoc (brew) { throw new Error("Unimplemented"); }
	/** @abstract */
	pGetOrCreateEditableBrewDoc () { throw new Error("Unimplemented"); }
	/** @abstract */
	pSetEditableBrewDoc () { throw new Error("Unimplemented"); }
	/** @abstract */
	pGetEditableBrewEntity (prop, uniqueId, {isDuplicate = false} = {}) { throw new Error("Unimplemented"); }
	/** @abstract */
	pPersistEditableBrewEntity (prop, ent) { throw new Error("Unimplemented"); }
	/** @abstract */
	pRemoveEditableBrewEntity (prop, uniqueId) { throw new Error("Unimplemented"); }
	/** @abstract */
	pAddSource (sourceObj) { throw new Error("Unimplemented"); }
	/** @abstract */
	pEditSource (sourceObj) { throw new Error("Unimplemented"); }
	/** @abstract */
	pIsEditableSourceJson (sourceJson) { throw new Error("Unimplemented"); }
	/** @abstract */
	pMoveOrCopyToEditableBySourceJson (sourceJson) { throw new Error("Unimplemented"); }
	/** @abstract */
	pMoveToEditable ({brews}) { throw new Error("Unimplemented"); }
	/** @abstract */
	pCopyToEditable ({brews}) { throw new Error("Unimplemented"); }
	/** @abstract */
	pHasEditableSourceJson () { throw new Error("Unimplemented"); }
	// endregion

	// region Rendering/etc.
	_PAGE_TO_PROPS__SPELLS = [...UrlUtil.PAGE_TO_PROPS[UrlUtil.PG_SPELLS], "spellFluff"];
	_PAGE_TO_PROPS__BESTIARY = ["monster", "legendaryGroup", "monsterFluff"];

	_PAGE_TO_PROPS = {
		[UrlUtil.PG_SPELLS]: this._PAGE_TO_PROPS__SPELLS,
		[UrlUtil.PG_CLASSES]: ["class", "subclass", "classFeature", "subclassFeature"],
		[UrlUtil.PG_BESTIARY]: this._PAGE_TO_PROPS__BESTIARY,
		[UrlUtil.PG_BACKGROUNDS]: ["background"],
		[UrlUtil.PG_FEATS]: ["feat"],
		[UrlUtil.PG_OPT_FEATURES]: ["optionalfeature"],
		[UrlUtil.PG_RACES]: [...UrlUtil.PAGE_TO_PROPS[UrlUtil.PG_RACES], "raceFluff"],
		[UrlUtil.PG_OBJECTS]: ["object"],
		[UrlUtil.PG_TRAPS_HAZARDS]: ["trap", "hazard"],
		[UrlUtil.PG_DEITIES]: ["deity"],
		[UrlUtil.PG_ITEMS]: [...UrlUtil.PAGE_TO_PROPS[UrlUtil.PG_ITEMS], "itemFluff"],
		[UrlUtil.PG_REWARDS]: ["reward"],
		[UrlUtil.PG_PSIONICS]: ["psionic"],
		[UrlUtil.PG_VARIANTRULES]: ["variantrule"],
		[UrlUtil.PG_CONDITIONS_DISEASES]: ["condition", "disease", "status"],
		[UrlUtil.PG_ADVENTURES]: ["adventure", "adventureData"],
		[UrlUtil.PG_BOOKS]: ["book", "bookData"],
		[UrlUtil.PG_TABLES]: ["table", "tableGroup"],
		[UrlUtil.PG_MAKE_BREW]: [
			...this._PAGE_TO_PROPS__SPELLS,
			...this._PAGE_TO_PROPS__BESTIARY,
			"makebrewCreatureTrait",
		],
		[UrlUtil.PG_MANAGE_BREW]: ["*"],
		[UrlUtil.PG_MANAGE_PRERELEASE]: ["*"],
		[UrlUtil.PG_DEMO_RENDER]: ["*"],
		[UrlUtil.PG_VEHICLES]: ["vehicle", "vehicleUpgrade"],
		[UrlUtil.PG_ACTIONS]: ["action"],
		[UrlUtil.PG_CULTS_BOONS]: ["cult", "boon"],
		[UrlUtil.PG_LANGUAGES]: ["language", "languageScript"],
		[UrlUtil.PG_CHAR_CREATION_OPTIONS]: ["charoption"],
		[UrlUtil.PG_RECIPES]: ["recipe"],
		[UrlUtil.PG_CLASS_SUBCLASS_FEATURES]: ["classFeature", "subclassFeature"],
		[UrlUtil.PG_DECKS]: ["card", "deck"],
		[UrlUtil.PG_BASTIONS]: ["facility", "facilityFluff"],
	};

	getPageProps ({page, isStrict = false, fallback = null} = {}) {
		page = this._getBrewPage(page);

		const out = this._PAGE_TO_PROPS[page];
		if (out) return out;
		if (fallback) return fallback;

		if (isStrict) throw new Error(`No ${this.DISPLAY_NAME} properties defined for category ${page}`);

		return null;
	}

	getPropPages () {
		return Object.entries(this._PAGE_TO_PROPS)
			.map(([page, props]) => [page, props.filter(it => it !== "*")])
			.filter(([, props]) => props.length)
			.map(([page]) => page);
	}

	_getBrewPage (page) {
		return page || (IS_VTT ? this.PAGE_MANAGE : UrlUtil.getCurrentPage());
	}

	getDirProp (dir) {
		switch (dir) {
			case "creature": return "monster";
			case "makebrew": return "makebrewCreatureTrait";
		}
		return dir;
	}

	getPropDisplayName (prop) {
		switch (prop) {
			case "adventure": return "Adventure Contents/Info";
			case "book": return "Book Contents/Info";
		}
		return Parser.getPropDisplayName(prop);
	}
	// endregion

	// region Sources
	_doCacheMetas () {
		if (this._cache_metas) return;

		this._cache_metas = {};

		(this._getBrewMetas() || [])
			.forEach(({_meta}) => {
				Object.entries(_meta || {})
					.forEach(([prop, val]) => {
						if (!val) return;
						if (typeof val !== "object") return;

						if (val instanceof Array) {
							(this._cache_metas[prop] = this._cache_metas[prop] || []).push(...MiscUtil.copyFast(val));
							return;
						}

						this._cache_metas[prop] = this._cache_metas[prop] || {};
						Object.assign(this._cache_metas[prop], MiscUtil.copyFast(val));
					});
			});

		// Add a special "_sources" cache, which is a lookup-friendly object (rather than "sources", which is an array)
		this._cache_metas["_sources"] = (this._getBrewMetas() || [])
			.mergeMap(({_meta}) => {
				return (_meta?.sources || [])
					.mergeMap(src => ({[(src.json || "").toLowerCase()]: MiscUtil.copyFast(src)}));
			});
	}

	hasSourceJson (source) {
		if (!source) return false;
		source = source.toLowerCase();
		return !!this.getMetaLookup("_sources")[source];
	}

	sourceJsonToFull (source) {
		if (!source) return "";
		source = source.toLowerCase();
		return this.getMetaLookup("_sources")[source]?.full || source;
	}

	sourceJsonToAbv (source) {
		if (!source) return "";
		source = source.toLowerCase();
		return this.getMetaLookup("_sources")[source]?.abbreviation || source;
	}

	sourceJsonToDate (source) {
		if (!source) return "";
		source = source.toLowerCase();
		return this.getMetaLookup("_sources")[source]?.dateReleased || "1970-01-01";
	}

	sourceJsonToSource (source) {
		if (!source) return null;
		source = source.toLowerCase();
		return this.getMetaLookup("_sources")[source];
	}

	sourceJsonToStyle (source) {
		const stylePart = this.sourceJsonToStylePart(source);
		if (!stylePart) return stylePart;
		return `style="${stylePart}"`;
	}

	sourceToStyle (source) {
		const stylePart = this.sourceToStylePart(source);
		if (!stylePart) return stylePart;
		return `style="${stylePart}"`;
	}

	sourceJsonToStylePart (source) {
		if (!source) return "";
		const color = this.sourceJsonToColor(source);
		if (color) return MiscUtil.getColorStylePart(color);
		return "";
	}

	sourceToStylePart (source) {
		if (!source) return "";
		const color = this.sourceToColor(source);
		if (color) return MiscUtil.getColorStylePart(color);
		return "";
	}

	sourceJsonToColor (source) {
		if (!source) return "";
		source = source.toLowerCase();
		if (!this.getMetaLookup("_sources")[source]?.color) return "";
		return BrewUtilShared.getValidColor(this.getMetaLookup("_sources")[source].color);
	}

	sourceToColor (source) {
		if (!source?.color) return "";
		return BrewUtilShared.getValidColor(source.color);
	}

	getSources () {
		this._doCacheMetas();
		return Object.values(this._cache_metas["_sources"]);
	}
	// endregion

	// region Other meta
	getMetaLookup (type) {
		if (!type) return null;
		this._doCacheMetas();
		return this._cache_metas[type];
	}
	// endregion

	/**
	 * Merge together a loaded JSON (or loaded-JSON-like) object and a processed homebrew object.
	 * @param data
	 * @param homebrew
	 */
	getMergedData (data, homebrew) {
		const out = {};
		Object.entries(data)
			.forEach(([prop, val]) => {
				if (!homebrew[prop]) {
					out[prop] = [...val];
					return;
				}

				if (!(homebrew[prop] instanceof Array)) throw new Error(`${this.DISPLAY_NAME.uppercaseFirst()} was not array!`);
				if (!(val instanceof Array)) throw new Error(`Data was not array!`);
				out[prop] = [...val, ...homebrew[prop]];
			});

		return out;
	}

	// region Search
	/**
	 * Get data in a format similar to the main search index
	 */
	async pGetSearchIndex ({id = 0, isDecompress = true, isIncludeExtendedSourceInfo = false} = {}) {
		const indexer = new Omnidexer(id);

		const brew = await this.pGetBrewProcessed();

		// Run these in serial, to prevent any ID race condition antics
		await [...Omnidexer.TO_INDEX__FROM_INDEX_JSON, ...Omnidexer.TO_INDEX]
			.pSerialAwaitMap(async arbiter => {
				if (arbiter.isSkipBrew) return;
				if (!brew[arbiter.brewProp || arbiter.listProp]?.length) return;

				if (arbiter.pFnPreProcBrew) {
					const toProc = await arbiter.pFnPreProcBrew.bind(arbiter)(brew);
					await indexer.pAddToIndex(arbiter, toProc, {isIncludeExtendedSourceInfo});
					return;
				}

				await indexer.pAddToIndex(arbiter, brew, {isIncludeExtendedSourceInfo});
			});

		const index = indexer.getIndex();
		if (!isDecompress) return index;

		return Omnidexer.decompressIndex(index);
	}

	async pGetAdditionalSearchIndices (highestId, addiProp) {
		const indexer = new Omnidexer(highestId + 1);

		const brew = await this.pGetBrewProcessed();

		await [...Omnidexer.TO_INDEX__FROM_INDEX_JSON, ...Omnidexer.TO_INDEX]
			.filter(it => it.additionalIndexes && (brew[it.listProp] || []).length)
			.pMap(it => {
				Object.entries(it.additionalIndexes)
					.filter(([prop]) => prop === addiProp)
					.pMap(async ([, pGetIndex]) => {
						const toIndex = await pGetIndex(indexer, {[it.listProp]: brew[it.listProp]});
						toIndex.forEach(add => indexer.pushToIndex(add));
					});
			});

		return Omnidexer.decompressIndex(indexer.getIndex());
	}

	async pGetAlternateSearchIndices (highestId, altProp) {
		const indexer = new Omnidexer(highestId + 1);

		const brew = await this.pGetBrewProcessed();

		await [...Omnidexer.TO_INDEX__FROM_INDEX_JSON, ...Omnidexer.TO_INDEX]
			.filter(ti => ti.alternateIndexes && (brew[ti.listProp] || []).length)
			.pSerialAwaitMap(async arbiter => {
				await Object.keys(arbiter.alternateIndexes)
					.filter(prop => prop === altProp)
					.pSerialAwaitMap(async prop => {
						await indexer.pAddToIndex(arbiter, brew, {alt: arbiter.alternateIndexes[prop]});
					});
			});

		return Omnidexer.decompressIndex(indexer.getIndex());
	}
	// endregion

	// region Export to URL
	async pGetUrlExportableSources () {
		const brews = await this._pGetBrewRaw();
		const brewsExportable = brews
			.filter(brew => !brew.head.isEditable && !brew.head.isLocal);
		return brewsExportable.flatMap(brew => (brew.body._meta?.sources || []).map(src => src.json)).unique();
	}
	// endregion
}
