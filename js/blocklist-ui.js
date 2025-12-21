"use strict";

class BlocklistUtil {
	static _IGNORED_CATEGORIES = new Set([
		"_meta",
		"_test",
		"linkedLootTables",
		"$schema",

		// `items-base.json`
		"itemProperty",
		"itemType",
		"itemEntry",
		"itemTypeAdditionalEntries",

		// `languages.json`
		"languageScript",

		// homebrew corpus
		"adventureData",
		"bookData",
	]);

	static _BASIC_FILES = [
		"actions.json",
		"adventures.json",
		"backgrounds.json",
		"books.json",
		"cultsboons.json",
		"charcreationoptions.json",
		"conditionsdiseases.json",
		"deities.json",
		"feats.json",
		"items-base.json",
		"magicvariants.json",
		"items.json",
		"objects.json",
		"optionalfeatures.json",
		"psionics.json",
		"recipes.json",
		"rewards.json",
		"trapshazards.json",
		"variantrules.json",
		"vehicles.json",
		"decks.json",
		"languages.json",
		"bastions.json",
	];

	static async pLoadData (
		{
			isIncludePrerelease = false,
			isIncludeBrew = false,
		} = {},
	) {
		const out = await this._pLoadData_site();
		if (isIncludePrerelease) await this._pLoadData_mutAddPrerelease({out});
		if (isIncludeBrew) await this._pLoadData_mutAddBrew({out});
		return out;
	}

	/* ----- */

	static async _pLoadData_site () {
		const out = {};

		this._addData(out, {monster: MiscUtil.copy(await DataUtil.monster.pLoadAll())});
		this._addData(out, {spell: MiscUtil.copy(await DataUtil.spell.pLoadAll())});
		this._addData(out, MiscUtil.copy(await DataUtil.class.loadRawJSON()));
		this._addData(out, MiscUtil.copy(await DataUtil.race.loadJSON({isAddBaseRaces: true})));

		(
			await Promise.all(this._BASIC_FILES.map(url => DataUtil.loadJSON(`${Renderer.get().baseUrl}data/${url}`)))
		)
			.forEach(json => this._addData(out, MiscUtil.copyFast(json)));

		return out;
	}

	/* ----- */

	static async _pLoadData_mutAddPrereleaseBrew ({out, brewUtil}) {
		const brew = await brewUtil.pGetBrewProcessed();
		this._addData(out, MiscUtil.copyFast(brew));
	}

	static async _pLoadData_mutAddPrerelease ({out}) {
		await this._pLoadData_mutAddPrereleaseBrew({out, brewUtil: PrereleaseUtil});
	}

	static async _pLoadData_mutAddBrew ({out}) {
		await this._pLoadData_mutAddPrereleaseBrew({out, brewUtil: BrewUtil2});
	}

	/* ----- */

	static _addData (out, json) {
		Object.keys(json)
			.filter(it => !this._IGNORED_CATEGORIES.has(it))
			.forEach(k => out[k] ? out[k] = out[k].concat(json[k]) : out[k] = json[k]);
	}
}

globalThis.BlocklistUtil = BlocklistUtil;

class BlocklistUi {
	constructor (
		{
			wrpContent,
			data,
			isCompactUi = false,
			isAutoSave = true,
		},
	) {
		this._wrpContent = wrpContent;
		this._data = data;
		this._isCompactUi = !!isCompactUi;
		this._isAutoSave = !!isAutoSave;
		this._isRequireSave = false; // (For Foundry use)

		this._excludes = ExcludeUtil.getList();

		this._subBlocklistEntries = {};

		this._allSources = null;
		this._allCategories = null;

		this._wrpControls = null;

		this._comp = null;

		this._wrpSelName = null;
		this._metaSelName = null;
	}

	async _pDoPersist (nxtList) {
		nxtList ||= MiscUtil.copy(this._excludes);

		if (this._isAutoSave) return ExcludeUtil.pSetList(nxtList);

		this._isRequireSave = true;
	}

	_addExclude (displayName, hash, category, source) {
		if (!this._excludes.find(row => row.source === source && row.category === category && row.hash === hash)) {
			this._excludes.push({displayName, hash, category, source});
			this._pDoPersist().then(null);
			return true;
		}
		return false;
	}

	_removeExclude (hash, category, source) {
		const ix = this._excludes.findIndex(row => row.source === source && row.category === category && row.hash === hash);
		if (!~ix) return;

		if (this._excludes[ix].isAuto) return;

		this._excludes.splice(ix, 1);
		this._pDoPersist().then(null);
	}

	_resetExcludes () {
		this._excludes = this._excludes.filter(excludeMeta => excludeMeta.isAuto);
		this._pDoPersist().then(null);
	}

	async _pInitSubBlocklistEntries () {
		for (const c of (this._data.class || [])) {
			const classHash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](c);

			const subBlocklist = this._data.classFeature
				.filter(it => it.className === c.name && it.classSource === c.source)
				.map(it => {
					const hash = UrlUtil.URL_TO_HASH_BUILDER["classFeature"](it);
					const displayName = `${this._getDisplayNamePrefix_classFeature(it)}${it.name}`;
					return {displayName, hash, category: "classFeature", source: it.source};
				});
			MiscUtil.set(this._subBlocklistEntries, "class", classHash, subBlocklist);
		}

		for (const sc of (this._data.subclass || [])) {
			const subclassHash = UrlUtil.URL_TO_HASH_BUILDER["subclass"](sc);

			const subBlocklist = this._data.subclassFeature
				.filter(it => it.className === sc.className && it.classSource === sc.classSource && it.subclassShortName === sc.shortName && it.subclassSource === sc.source)
				.map(it => {
					const hash = UrlUtil.URL_TO_HASH_BUILDER["subclassFeature"](it);
					const displayName = `${this._getDisplayNamePrefix_subclassFeature(it)}${it.name}`;
					return {displayName, hash, category: "subclassFeature", source: it.source};
				});
			MiscUtil.set(this._subBlocklistEntries, "subclass", subclassHash, subBlocklist);
		}

		for (const it of (this._data.itemGroup || [])) {
			const itemGroupHash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ITEMS](it);

			const subBlocklist = (await it.items.pSerialAwaitMap(async uid => {
				let [name, source] = uid.split("|");
				source = Parser.getTagSource("item", source);
				const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ITEMS]({name, source});
				const item = await DataLoader.pCacheAndGet(UrlUtil.PG_ITEMS, source, hash);
				if (!item) return null;
				return {displayName: item.name, hash, category: "item", source: item.source};
			})).filter(Boolean);

			MiscUtil.set(this._subBlocklistEntries, "itemGroup", itemGroupHash, subBlocklist);
		}

		for (const it of (this._data.race || []).filter(it => it._isBaseRace || it._versions?.length)) {
			const baseRaceHash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_RACES](it);
			const subBlocklist = [];

			if (it._isBaseRace) {
				subBlocklist.push(
					...it._subraces.map(sr => {
						const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_RACES](sr);
						return {displayName: sr.name, hash, category: "race", source: sr.source};
					}),
				);
			}

			if (it._versions?.length) {
				subBlocklist.push(
					...DataUtil.proxy.getVersions(it.__prop, it).map(ver => {
						const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_RACES](ver);
						return {displayName: ver.name, hash, category: "race", source: ver.source};
					}),
				);
			}

			MiscUtil.set(this._subBlocklistEntries, "race", baseRaceHash, subBlocklist);
		}
	}

	_getDisplayValues (category, source) {
		const displaySource = source === "*" ? source : Parser.sourceJsonToFullCompactPrefix(source);
		const displayCategory = category === "*" ? category : Parser.getPropDisplayName(category);
		return {displaySource, displayCategory};
	}

	_renderList () {
		this._excludes
			.sort((a, b) => SortUtil.ascSort(a.source, b.source) || SortUtil.ascSort(a.category, b.category) || SortUtil.ascSort(a.displayName, b.displayName))
			.forEach(excludeMeta => this._addListItem(excludeMeta));
		this._list.init();
		this._list.update();
	}

	_getDisplayNamePrefix_classFeature (it) { return `${it.className} ${it.level}: `; }
	_getDisplayNamePrefix_subclassFeature (it) { return `${it.className} (${it.subclassShortName}) ${it.level}: `; }

	async pInit () {
		await this._pInitSubBlocklistEntries();
		this._pInit_initUi();
		this._pInit_render();
		this._renderList();
	}

	_pInit_initUi () {
		this._wrpControls = ee`<div ${this._isCompactUi ? "" : `class="bg-solid py-5 px-3 shadow-big b-1p"`}></div>`;

		const iptSearch = ee`<input type="search" class="search form-control lst__search lst__search--no-border-h h-100">`.disableSpellcheck();

		const btnReset = ee`<button class="ve-btn ve-btn-default">Reset Search</button>`
			.onn("click", () => {
				iptSearch.val("");
				this._list.reset();
			});

		const wrpFilterTools = ee`<div class="input-group input-group--bottom ve-flex no-shrink">
			<button class="ve-col-4 sort ve-btn ve-btn-default ve-btn-xs ve-grow" data-sort="source">Source</button>
			<button class="ve-col-2 sort ve-btn ve-btn-default ve-btn-xs" data-sort="category">Category</button>
			<button class="ve-col-5 sort ve-btn ve-btn-default ve-btn-xs" data-sort="name">Name</button>
			<button class="ve-col-1 sort ve-btn ve-btn-default ve-btn-xs" disabled>&nbsp;</button>
		</div>`;

		const wrpList = ee`<div class="list-display-only smooth-scroll ve-overflow-y-auto h-100 min-h-0"></div>`;

		ee(this._wrpContent.empty())`
			${this._wrpControls}

			<hr class="${this._isCompactUi ? "hr-2" : "hr-5"}">

			<h4 class="my-0">Blocklist</h4>
			<div class="ve-muted ${this._isCompactUi ? "mb-2" : "mb-3"}"><i>Rows marked with an asterisk (*) in a field match everything in that field.</i></div>

			<div class="ve-flex-col min-h-0">
				<div class="ve-flex-v-stretch input-group input-group--top no-shrink">
					<div class="w-100 relative">
						${iptSearch}
						<div class="lst__wrp-search-glass no-events ve-flex-vh-center"><span class="glyphicon glyphicon-search"></span></div>
						<div class="lst__wrp-search-visible no-events ve-flex-vh-center"></div>
					</div>
					${btnReset}
				</div>

				${wrpFilterTools}

				${wrpList}
			</div>`;

		this._list = new List({
			iptSearch,
			wrpList,
		});
		this._listId = 1;

		SortUtil.initBtnSortHandlers(wrpFilterTools, this._list);
	}

	_pInit_render () {
		// region Helper controls
		const btnExcludeAllUa = this._getBtn_addToBlocklist()
			.onn("click", () => this._addAllUa());
		const btnIncludeAllUa = this._getBtn_removeFromBlocklist()
			.onn("click", () => this._removeAllUa());

		const btnExcludeAllSources = this._getBtn_addToBlocklist()
			.onn("click", () => this._addAllSources());
		const btnIncludeAllSources = this._getBtn_removeFromBlocklist()
			.onn("click", () => this._removeAllSources());

		const btnExcludeAllComedySources = this._getBtn_addToBlocklist()
			.onn("click", () => this._addAllComedySources());
		const btnIncludeAllComedySources = this._getBtn_removeFromBlocklist()
			.onn("click", () => this._removeAllComedySources());

		const btnExcludeAllNonForgottenRealmsSources = this._getBtn_addToBlocklist()
			.onn("click", () => this._addAllNonForgottenRealms());
		const btnIncludeAllNonForgottenRealmsSources = this._getBtn_removeFromBlocklist()
			.onn("click", () => this._removeAllNonForgottenRealms());

		const btnExcludeModernSources = this._getBtn_addToBlocklist()
			.onn("click", () => this._addAllNonModernSources());
		const btnIncludeModernSources = this._getBtn_removeFromBlocklist()
			.onn("click", () => this._removeAllModernSources());
		// endregion

		// region Primary controls
		const sourceSet = new Set();
		const propSet = new Set();
		Object.keys(this._data).forEach(prop => {
			propSet.add(prop);
			const arr = this._data[prop];
			if (!(arr instanceof Array)) return;
			arr.forEach(it => sourceSet.add(SourceUtil.getEntitySource(it)));
		});

		this._allSources = [...sourceSet]
			.sort((a, b) => SortUtil.ascSort(Parser.sourceJsonToFull(a), Parser.sourceJsonToFull(b)));

		this._allCategories = [...propSet]
			.sort((a, b) => SortUtil.ascSort(Parser.getPropDisplayName(a), Parser.getPropDisplayName(b)));

		this._comp = new BlocklistUi.Component();

		const selSource = ComponentUiUtil.getSelSearchable(
			this._comp,
			"source",
			{
				values: ["*", ...this._allSources],
				fnDisplay: val => val === "*" ? val : Parser.sourceJsonToFull(val),
			},
		);
		this._comp.addHook("source", () => this._doHandleSourceCategorySelChange());

		const selCategory = ComponentUiUtil.getSelSearchable(
			this._comp,
			"category",
			{
				values: ["*", ...this._allCategories],
				fnDisplay: val => val === "*" ? val : Parser.getPropDisplayName(val),
			},
		);
		this._comp.addHook("category", () => this._doHandleSourceCategorySelChange());

		this._wrpSelName = ee`<div class="w-100 ve-flex"></div>`;
		this._doHandleSourceCategorySelChange();

		const btnAddExclusion = ee`<button class="ve-btn ve-btn-default ve-btn-xs">Add to Blocklist</button>`
			.onn("click", () => this._pAdd());
		// endregion

		// Utility controls
		const btnSendToFoundry = !globalThis.IS_VTT && ExtensionUtil.ACTIVE
			? ee`<button title="Send to Foundry" class="ve-btn ve-btn-xs ve-btn-default mr-2"><span class="glyphicon glyphicon-send"></span></button>`
				.onn("click", evt => this._pDoSendToFoundry({isTemp: !!evt.shiftKey}))
			: null;
		const btnExport = ee`<button class="ve-btn ve-btn-default ve-btn-xs">Export List</button>`
			.onn("click", () => this._export());
		const btnImport = ee`<button class="ve-btn ve-btn-default ve-btn-xs" title="SHIFT for Add Only">Import List</button>`
			.onn("click", evt => this._pImport(evt));
		const btnReset = ee`<button class="ve-btn ve-btn-danger ve-btn-xs">Reset List</button>`
			.onn("click", async () => {
				if (!await InputUiUtil.pGetUserBoolean({title: "Reset Blocklist", htmlDescription: "Are you sure?", textYes: "Yes", textNo: "Cancel"})) return;
				this._reset();
			});
		// endregion

		ee(this._wrpControls.empty())`<div class="${this._isCompactUi ? "mb-2" : "mb-5"} ve-flex-v-center mobile-sm__ve-flex-col mobile-sm__ve-flex-ai-start">
			<div class="ve-flex-vh-center mr-4 mobile-sm__mr-0 mobile-sm__mb-2">
				<div class="mr-2">UA/Etc. Sources</div>
				<div class="ve-flex-v-center ve-btn-group">
					${btnExcludeAllUa}
					${btnIncludeAllUa}
				</div>
			</div>

			<div class="ve-flex-vh-center mr-3 mobile-sm__mr-0 mobile-sm__mb-2">
				<div class="mr-2">Comedy Sources</div>
				<div class="ve-flex-v-center ve-btn-group">
					${btnExcludeAllComedySources}
					${btnIncludeAllComedySources}
				</div>
			</div>

			<div class="ve-flex-vh-center mr-3 mobile-sm__mr-0 mobile-sm__mb-2">
				<div class="mr-2">Non-<i>Forgotten Realms</i></div>
				<div class="ve-flex-v-center ve-btn-group">
					${btnExcludeAllNonForgottenRealmsSources}
					${btnIncludeAllNonForgottenRealmsSources}
				</div>
			</div>

			<div class="ve-flex-vh-center mr-3 mobile-sm__mr-0 mobile-sm__mb-2">
				<div class="mr-2">&apos;24 Sources</div>
				<div class="ve-flex-v-center ve-btn-group">
					${btnExcludeModernSources}
					${btnIncludeModernSources}
				</div>
			</div>

			<div class="ve-flex-vh-center mr-3 mobile-sm__mr-0 mobile-sm__mb-2">
				<div class="mr-2">All Sources</div>
				<div class="ve-flex-v-center ve-btn-group">
					${btnExcludeAllSources}
					${btnIncludeAllSources}
				</div>
			</div>
		</div>

		<div class="ve-flex-v-end ${this._isCompactUi ? "mb-2" : "mb-5"} mobile-sm__ve-flex-col mobile-sm__ve-flex-ai-start">
			<div class="ve-flex-col w-25 pr-2 mobile-sm__w-100 mobile-sm__mb-2 mobile-sm__p-0">
				<label class="mb-1">Source</label>
				${selSource}
			</div>

			<div class="ve-flex-col w-25 px-2 mobile-sm__w-100 mobile-sm__mb-2 mobile-sm__p-0">
				<label class="mb-1">Category</label>
				${selCategory}
			</div>

			<div class="ve-flex-col w-25 px-2 mobile-sm__w-100 mobile-sm__mb-2 mobile-sm__p-0">
				<label class="mb-1">Name</label>
				${this._wrpSelName}
			</div>

			<div class="ve-flex-col w-25 pl-2 mobile-sm__w-100 mobile-sm__mb-2 mobile-sm__p-0">
				<div class="mt-auto">
					${btnAddExclusion}
				</div>
			</div>
		</div>

		<div class="w-100 ve-flex-v-center">
			${btnSendToFoundry}
			<div class="ve-flex-v-center ve-btn-group mr-2">
				${btnExport}
				${btnImport}
			</div>
			${btnReset}
		</div>`;
	}

	_getBtn_addToBlocklist () {
		return ee`<button class="ve-btn ve-btn-danger ve-btn-xs w-20p h-21p ve-flex-vh-center" title="Add to Blocklist"><span class="glyphicon glyphicon-trash"></span></button>`;
	}

	_getBtn_removeFromBlocklist () {
		return ee`<button class="ve-btn ve-btn-success ve-btn-xs w-20p h-21p ve-flex-vh-center" title="Remove from Blocklist"><span class="glyphicon glyphicon-thumbs-up"></span></button>`;
	}

	_doHandleSourceCategorySelChange () {
		if (this._metaSelName) this._metaSelName.unhook();
		this._wrpSelName.empty();

		const filteredData = this._doHandleSourceCategorySelChange_getFilteredData();

		const selName = ComponentUiUtil.getSelSearchable(
			this._comp,
			"name",
			{
				values: [
					{hash: "*", name: "*", category: this._comp.category},
					...this._getDataUids(filteredData),
				],
				fnDisplay: val => val.name,
			},
		);

		this._wrpSelName.append(selName);
	}

	_doHandleSourceCategorySelChange_getFilteredData () {
		// If the user has not selected either of source or category, avoid displaying the entire data set
		if (this._comp.source === "*" && this._comp.category === "*") return [];

		if (this._comp.source === "*" && this._comp.category !== "*") {
			return this._data[this._comp.category].map(it => ({...it, category: this._comp.category}));
		}

		if (this._comp.source !== "*" && this._comp.category === "*") {
			return Object.entries(this._data).map(([cat, arr]) => arr.filter(it => it.source === this._comp.source).map(it => ({...it, category: cat}))).flat();
		}

		return this._data[this._comp.category]
			.filter(it => SourceUtil.getEntitySource(it) === this._comp.source)
			.map(it => ({...it, category: this._comp.category}));
	}

	_getDataUids (arr) {
		const copy = arr
			.map(it => {
				switch (it.category) {
					case "subclass": {
						return {...it, name: it.name, source: SourceUtil.getEntitySource(it), className: it.className, classSource: it.classSource, shortName: it.shortName};
					}
					case "classFeature": {
						return {...it, name: it.name, source: SourceUtil.getEntitySource(it), className: it.className, classSource: it.classSource, level: it.level};
					}
					case "subclassFeature": {
						return {...it, name: it.name, source: SourceUtil.getEntitySource(it), className: it.className, classSource: it.classSource, level: it.level, subclassShortName: it.subclassShortName, subclassSource: it.subclassSource};
					}
					case "adventure":
					case "book": {
						return {...it, name: it.name, source: SourceUtil.getEntitySource(it), id: it.id};
					}
					default: {
						return {...it, name: it.name, source: SourceUtil.getEntitySource(it)};
					}
				}
			})
			.sort(this.constructor._fnSortDataUids.bind(this.constructor));

		const dupes = new Set();
		return copy
			.map((it, i) => {
				let prefix = "";
				let hash;

				if (UrlUtil.URL_TO_HASH_BUILDER[it.category]) {
					hash = UrlUtil.URL_TO_HASH_BUILDER[it.category](it);
				} else {
					hash = UrlUtil.encodeForHash([it.name, SourceUtil.getEntitySource(it)]);
				}

				switch (it.category) {
					case "subclass": prefix = `${it.className}: `; break;
					case "classFeature": prefix = this._getDisplayNamePrefix_classFeature(it); break;
					case "subclassFeature": prefix = this._getDisplayNamePrefix_subclassFeature(it); break;
				}

				const displayName = `${prefix}${it.name}${(dupes.has(it.name) || (copy[i + 1] && copy[i + 1].name === it.name)) ? ` [${Parser.sourceJsonToAbv(SourceUtil.getEntitySource(it))}]` : ""}`;

				dupes.add(it.name);
				return {
					hash,
					name: displayName,
					category: it.category,
				};
			});
	}

	static _fnSortDataUids (a, b) {
		if (a.category !== b.category) return SortUtil.ascSortLower(a.category, b.category);
		switch (a.category) {
			case "subclass": {
				return SortUtil.ascSortLower(a.className, b.className) || SortUtil.ascSortLower(a.name, b.name) || SortUtil.ascSortLower(a.source, b.source);
			}
			case "classFeature": {
				return SortUtil.ascSortLower(a.className, b.className) || SortUtil.ascSort(a.level, b.level) || SortUtil.ascSortLower(a.name, b.name) || SortUtil.ascSortLower(a.source, b.source);
			}
			case "subclassFeature": {
				return SortUtil.ascSortLower(a.className, b.className) || SortUtil.ascSortLower(a.subclassShortName, b.subclassShortName) || SortUtil.ascSort(a.level, b.level) || SortUtil.ascSortLower(a.name, b.name) || SortUtil.ascSortLower(a.source, b.source);
			}
			default: {
				return SortUtil.ascSortLower(a.name, b.name) || SortUtil.ascSortLower(SourceUtil.getEntitySource(a), SourceUtil.getEntitySource(b));
			}
		}
	}

	_addListItem ({displayName, hash, category, source, isAuto = false}) {
		const display = this._getDisplayValues(category, source);

		const id = this._listId++;
		const sourceFull = Parser.sourceJsonToFull(source);

		const btnRemove = isAuto
			? ee`<button class="ve-btn ve-btn-xxs ve-btn-danger" disabled title="This blocklist entry is automatically managed, and cannot be manually removed.">Remove</button>`
			: ee`<button class="ve-btn ve-btn-xxs ve-btn-danger">Remove</button>`
				.onn("click", () => {
					this._remove(id, hash, category, source);
				});

		const ele = ee`<div class="${this._addListItem_getItemStyles()}">
			<span class="ve-col-4 ve-text-center">${sourceFull}</span>
			<span class="ve-col-2 ve-text-center">${display.displayCategory}</span>
			<span class="ve-col-5 ve-text-center">${displayName}</span>
			<span class="ve-col-1 ve-text-center">${btnRemove}</span>
		</div>`;

		const listItem = new ListItem(
			id,
			ele,
			displayName,
			{
				category: display.displayCategory,
				source: sourceFull,
			},
			{
				displayName: displayName,
				hash: hash,
				category: category,
				source: source,
			},
		);

		this._list.addItem(listItem);
	}

	_addListItem_getItemStyles () { return `no-click ve-flex-v-center lst__row lst__row-border veapp__list-row lst__row-inner no-shrink`; }

	async _pAdd () {
		const {hash, name: displayName, category: categoryName} = this._comp.name;
		const category = categoryName === "*" ? this._comp.category : categoryName;

		if (
			this._comp.source === "*"
			&& category === "*"
			&& hash === "*"
			&& !await InputUiUtil.pGetUserBoolean({title: "Exclude All", htmlDescription: `This will exclude all content from all list pages. Are you sure?`, textYes: "Yes", textNo: "Cancel"})
		) return;

		if (this._addExclude(displayName, hash, category, this._comp.source)) {
			this._addListItem({displayName, hash, category, source: this._comp.source, isAuto: false});

			const subBlocklist = MiscUtil.get(this._subBlocklistEntries, category, hash);
			if (subBlocklist) {
				subBlocklist.forEach(it => {
					const {displayName, hash, category, source} = it;
					this._addExclude(displayName, hash, category, source);
					this._addListItem({displayName, hash, category, source, isAuto: false});
				});
			}

			this._list.update();
		}
	}

	/**
	 * @param {?Function} fnFilter
	 */
	_addMassSources ({fnFilter = null} = {}) {
		const sources = fnFilter
			? this._allSources.filter(source => fnFilter(source))
			: this._allSources;
		sources
			.forEach(source => {
				if (!this._addExclude("*", "*", "*", source)) return;
				this._addListItem({displayName: "*", hash: "*", category: "*", source, isAuto: false});
			});
		this._list.update();
	}

	/**
	 * @param {?Function} fnFilter
	 */
	_removeMassSources ({fnFilter = null} = {}) {
		const sources = fnFilter
			? this._allSources.filter(source => fnFilter(source))
			: this._allSources;
		sources
			.forEach(source => {
				const item = this._list.items.find(it => it.data.hash === "*" && it.data.category === "*" && it.data.source === source);
				if (!item) return;
				this._remove(item.ix, "*", "*", source, {isSkipListUpdate: true});
			});
		this._list.update();
	}

	_addAllUa () { this._addMassSources({fnFilter: SourceUtil.isNonstandardSource}); }
	_removeAllUa () { this._removeMassSources({fnFilter: SourceUtil.isNonstandardSource}); }

	_addAllSources () { this._addMassSources(); }
	_removeAllSources () { this._removeMassSources(); }

	_addAllComedySources () { this._addMassSources({fnFilter: source => Parser.SOURCES_COMEDY.has(source)}); }
	_removeAllComedySources () { this._removeMassSources({fnFilter: source => Parser.SOURCES_COMEDY.has(source)}); }

	_addAllNonForgottenRealms () { this._addMassSources({fnFilter: source => Parser.SOURCES_NON_FR.has(source)}); }
	_removeAllNonForgottenRealms () { this._removeMassSources({fnFilter: source => Parser.SOURCES_NON_FR.has(source)}); }

	_addAllNonModernSources () { this._addMassSources({fnFilter: source => !SourceUtil.isClassicSource(source)}); }
	_removeAllModernSources () { this._removeMassSources({fnFilter: source => !SourceUtil.isClassicSource(source)}); }

	_remove (ix, hash, category, source, {isSkipListUpdate = false} = {}) {
		this._removeExclude(hash, category, source);
		this._list.removeItemByIndex(ix);
		if (!isSkipListUpdate) this._list.update();
	}

	async _pDoSendToFoundry () {
		await ExtensionUtil.pDoSend({type: "5etools.blocklist.excludes", data: this._excludes.filter(excludeMeta => !excludeMeta.isAuto)});
	}

	_export () {
		DataUtil.userDownload(`content-blocklist`, {fileType: "content-blocklist", blocklist: this._excludes.filter(excludeMeta => !excludeMeta.isAuto)});
	}

	async _pImport_getUserUpload () {
		return InputUiUtil.pGetUserUploadJson({expectedFileTypes: ["content-blocklist", "content-blacklist"]}); // Supports old fileType "content-blacklist"
	}

	async _pImport (evt) {
		const {jsons, errors} = await this._pImport_getUserUpload();

		DataUtil.doHandleFileLoadErrorsGeneric(errors);

		if (!jsons?.length) return;

		// clear list display
		this._list.removeAllItems();
		this._list.update();

		const json = jsons[0];

		// update storage
		// Supports old key "blacklist"
		const importList = json.blocklist || json.blacklist || [];
		const nxtList = [
			...(
				evt.shiftKey
				// Supports old key "blacklist"
					? MiscUtil.copy(this._excludes).concat(importList)
					: importList
			),
			...this._excludes.filter(excludeMeta => excludeMeta.isAuto),
		];
		this._excludes = nxtList;
		this._pDoPersist(nxtList).then(null);

		// render list display
		this._renderList();
	}

	_reset () {
		this._resetExcludes();
		this._list.removeAllItems();
		this._renderList();
	}
}

globalThis.BlocklistUi = BlocklistUi;

BlocklistUi.Component = class extends BaseComponent {
	constructor () {
		super();

		const hkNonNameChange = () => {
			this._state.name = {hash: "*", name: "*", category: this._state.category};
		};
		this._addHookBase("source", hkNonNameChange);
		this._addHookBase("category", hkNonNameChange);
	}

	get source () { return this._state.source; }
	get category () { return this._state.category; }
	get name () { return this._state.name; }

	addHook (prop, hk) { return this._addHookBase(prop, hk); }

	_getDefaultState () {
		return {
			source: "*",
			category: "*",
			name: {
				hash: "*",
				name: "*",
				category: "*",
			},
		};
	}
};
