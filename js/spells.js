import {RenderSpells, RenderSpellsSettings} from "./render-spells.js";

class SpellsSublistManager extends SublistManager {
	static _getRowTemplate () {
		return [
			new SublistCellTemplate({
				name: "Name",
				css: "ve-bold ve-col-3-2 ve-pl-0 ve-pr-1",
				colStyle: "",
			}),
			new SublistCellTemplate({
				name: "Level",
				css: "ve-capitalize ve-col-1-5 ve-px-1 ve-text-center",
				colStyle: "text-center",
			}),
			new SublistCellTemplate({
				name: "Time",
				css: "ve-col-1-8 ve-px-1 ve-text-center",
				colStyle: "text-center",
			}),
			new SublistCellTemplate({
				name: "School",
				css: "ve-capitalize ve-col-1-6 ve-px-1 ve-text-center",
				colStyle: "text-center",
			}),
			new SublistCellTemplate({
				name: "C.",
				css: "concentration--sublist ve-col-0-7 ve-px-1 ve-text-center",
				colStyle: "text-center",
			}),
			new SublistCellTemplate({
				name: "Range",
				css: "range ve-col-3-2 ve-pl-1 ve-pr-0 ve-text-right",
				colStyle: "text-right",
			}),
		];
	}

	pGetSublistItem (spell, hash) {
		const school = Parser.spSchoolAndSubschoolsAbvsShort(spell.school, spell.subschools);
		const time = PageFilterSpells.getTblTimeStr(spell.time[0]);
		const concentration = spell._isConc ? "×" : "";
		const range = Parser.spRangeToFull(spell.range, {isDisplaySelfArea: true});

		const cellsText = [
			spell.name,
			PageFilterSpells.getTblLevelStr(spell),
			time,
			new SublistCell({
				text: school,
				title: Parser.spSchoolAndSubschoolsAbvsToFull(spell.school, spell.subschools),
				css: Parser.spSchoolAbvToStyleClass(spell.school),
				style: Parser.spSchoolAbvToStyle(spell.school),
			}),
			new SublistCell({
				text: concentration,
				title: concentration ? "Concentration" : "",
			}),
			range,
		];

		const ele = veT`<div class="ve-lst__row ve-lst__row--sublist ve-flex-col">
			<a href="#${UrlUtil.autoEncodeHash(spell)}" title="${spell.name}" class="ve-lst__row-border ve-lst__row-inner">
				${this.constructor._getRowCellsHtml({values: cellsText})}
			</a>
		</div>`
			.vee.onn("contextmenu", evt => this._handleSublistItemContextMenu(evt, listItem))
			.vee.onn("click", evt => this._listSub.doSelect(listItem, evt));

		const listItem = new ListItem({
			id: hash,
			ele,
			name: spell.name,
			values: {
				...ListItem.getCommonValues(spell),
				school,
				level: spell.level,
				time,
				concentration,
				range,
				normalisedTime: spell._normalisedTime,
				normalisedRange: spell._normalisedRange,
			},
			data: {
				hash,
				page: spell.page,
				entity: spell,
				mdRow: [...cellsText],
			},
		});
		return listItem;
	}
}

class SpellsPageSettingsManager extends ListPageSettingsManager {
	_getSettings () {
		return {
			...RenderSpellsSettings.SETTINGS,
		};
	}
}

class SpellPageBookView extends ListPageBookView {
	static _BOOK_VIEW_MODE_K = "bookViewMode";

	constructor (opts) {
		super({
			pageTitle: "Spells Book View",
			nameSingular: "spell",
			namePlural: "spells",
			...opts,
		});

		const lastOrder = StorageUtil.syncGetForPage(SpellPageBookView._BOOK_VIEW_MODE_K);
		this._bookViewLastOrder = `${lastOrder ?? 0}`;
	}

	_getSorted (a, b) {
		return (this._bookViewLastOrder === "0" ? SortUtil.ascSort(a.level, b.level) : 0)
			|| SortUtil.ascSortLower(a.name, b.name);
	}

	async _pGetWrpControls ({wrpContent}) {
		const out = await super._pGetWrpControls({wrpContent});

		const {wrpPrint} = out;

		const onChangeSortMode = async () => {
			const val = selSortMode.vee.val();
			this._bookViewLastOrder = val;
			await this._pGetRenderContentMeta({wrpContent});

			StorageUtil.syncSetForPage(SpellPageBookView._BOOK_VIEW_MODE_K, val);
		};

		const selSortMode = veT`<select class="ve-form-control ve-input-xs">
			<option value="0">Spell Level</option>
			<option value="1">Alphabetical</option>
		</select>`
			.vee.onn("change", () => onChangeSortMode());

		selSortMode.vee.val(`${this._bookViewLastOrder ?? 0}`);
		veT`<label class="ve-flex-vh-center ve-ml-3"><span class="ve-mr-2 ve-no-wrap">Sort Order:</span>${selSortMode}</label>`.vee.appendTo(wrpPrint);

		return out;
	}

	_pGetRenderContentMeta_getRenderedEntries ({entityMetas, cntEntsPinned}) {
		if (!cntEntsPinned && entityMetas.length) {
			return [
				`<div class="ve-w-100 ve-h-100 ve-no-breaks">`,
				this._getRenderedEnt(entityMetas[0].entity),
				`</div>`,
			]
				.join("");
		}

		if (this._bookViewLastOrder === "1") {
			return entityMetas
				.map(({entity}) => this._getRenderedEnt(entity))
				.join("");
		}

		if (this._bookViewLastOrder === "0") {
			return Array.from({length: 10})
				.map((_, i) => {
					const atLvl = entityMetas.filter(({entity}) => entity.level === i);
					if (!atLvl.length) return null;

					return [
						`<div class="bkmv__no-breaks"><div class="bkmv__spacer-name ve-flex-v-center ve-no-shrink ve-print__hidden ve-pl-2">${Parser.spLevelToFullLevelText(i)}</div>`,
						...atLvl.map(({entity}) => this._getRenderedEnt(entity)),
						`</div>`,
					];
				})
				.filter(Boolean)
				.flat()
				.join("");
		}

		throw new Error(`Unhandled spell sort mode "${this._bookViewLastOrder}"`);
	}

	async _pGetRenderContentMeta ({wrpContent, wrpContentOuter}) {
		wrpContent.vee.addClass("ve-p-2");

		const {entityMetas, cntEntsPinned} = this._getRenderableContentMeta();
		const ptEntries = this._pGetRenderContentMeta_getRenderedEntries({entityMetas, cntEntsPinned});

		wrpContent.vee.empty();
		if (ptEntries.length) wrpContent.vee.appends(ptEntries);

		return {
			cntSelectedEnts: cntEntsPinned,
			isAnyEntityRendered: !!ptEntries.length,
		};
	}
}

class SpellsPage extends ListPageMultiSource {
	constructor () {
		const pFnGetFluff = Renderer.spell.pGetFluff.bind(Renderer.spell);

		super({
			pageFilter: new PageFilterSpells({
				sourceFilterOpts: {
					pFnOnChange: (...args) => this._pLoadSource(...args),
				},
			}),

			listOptions: {
				fnSort: PageFilterSpells.sortSpells,
			},

			dataProps: ["spell"],

			pFnGetFluff,

			bookViewOptions: {
				ClsBookView: SpellPageBookView,
			},

			tableViewOptions: {
				title: "Spells",
				colTransforms: {
					name: UtilsTableview.COL_TRANSFORM_NAME,
					source: UtilsTableview.COL_TRANSFORM_SOURCE,
					page: UtilsTableview.COL_TRANSFORM_PAGE,
					level: {name: "Level", transform: (it) => Parser.spLevelToFull(it)},
					time: {name: "Casting Time", transform: (it) => PageFilterSpells.getTblTimeStr(it[0])},
					duration: {name: "Duration", transform: (it) => Parser.spDurationToFull(it)},
					_school: {
						name: "School",
						transform: (sp) => {
							const ptMeta = Parser.spMetaToArr(sp.meta);
							return `<span class="${Parser.spSchoolAbvToStyleClass(sp.school)}" ${Parser.spSchoolAbvToStyle(sp.school)}>${Parser.spSchoolAndSubschoolsAbvsToFull(sp.school, sp.subschools)}</span>${ptMeta.length ? ` (${ptMeta.join(", ")})` : ""}`;
						},
					},
					range: {name: "Range", transform: (it) => Parser.spRangeToFull(it)},
					_components: {name: "Components", transform: (sp) => Parser.spComponentsToFull(sp.components, sp.level, {isPlainText: true})},
					_classes: {
						name: "Classes",
						transform: (sp) => {
							const [current] = Parser.spClassesToCurrentAndLegacy(Renderer.spell.getCombinedClasses(sp, "fromClassList"));
							return Parser.spMainClassesToFull(current, {isIncludeSource: true});
						},
					},
					_classesVariant: {
						name: "Optional/Variant Classes",
						transform: (sp) => {
							const [current] = Parser.spVariantClassesToCurrentAndLegacy(Renderer.spell.getCombinedClasses(sp, "fromClassListVariant"));
							return Parser.spMainClassesToFull(current, {isIncludeSource: true});
						},
					},
					_subclasses: {
						name: "Subclasses",
						transform: (sp, additionalData) => {
							const fromSubclass = Renderer.spell.getCombinedClasses(sp, "fromSubclass");
							if (!fromSubclass.length) return "";
							const [current] = Parser.spSubclassesToCurrentAndLegacyFull(sp, additionalData.subclassLookup, {isIncludeSource: true});
							return current;
						},
					},
					entries: {name: "Text", transform: (it) => Renderer.get().render({type: "entries", entries: it}, 1), flex: 3},
					entriesHigherLevel: {name: "At Higher Levels", transform: (it) => Renderer.get().render({type: "entries", entries: (it || [])}, 1), flex: 2},
				},
			},

			propLoader: "spell",

			listSyntax: new ListSyntaxSpells({fnGetDataList: () => this._dataList, pFnGetFluff}),

			compSettings: new SpellsPageSettingsManager(),
		});

		this._lastFilterValues = null;
		this._subclassLookup = {};
		this._bookViewLastOrder = null;
	}

	async _pGetTableViewAdditionalData () {
		return {
			subclassLookup: await DataUtil.class.pGetSubclassLookup(),
		};
	}

	get _bindOtherButtonsOptions () {
		return {
			upload: {
				pFnPreLoad: (...args) => this._pPreloadSublistSources(...args),
			},
			sendToBrew: {
				mode: "spellBuilder",
				fnGetMeta: () => ({
					page: UrlUtil.getCurrentPage(),
					source: Hist.getHashSource(),
					hash: Hist.getHashParts()[0],
				}),
			},
			other: [
				this._bindOtherButtonsOptions_openAsSinglePage({slugPage: "spells"}),
			].filter(Boolean),
		};
	}

	getListItem (spell, spI) {
		const hash = UrlUtil.autoEncodeHash(spell);
		if (this._seenHashes.has(hash)) return null;
		this._seenHashes.add(hash);

		const isExcluded = ExcludeUtil.isExcluded(hash, "spell", spell.source);

		this._pageFilter.mutateAndAddToFilters(spell, isExcluded);

		const source = Parser.sourceJsonToAbv(spell.source);
		const time = PageFilterSpells.getTblTimeStr(spell.time[0]);
		const school = Parser.spSchoolAndSubschoolsAbvsShort(spell.school, spell.subschools);
		const schoolClassName = Parser.spSchoolAbvToStyleClass(spell.school);
		const concentration = spell._isConc ? "×" : "";
		const range = Parser.spRangeToFull(spell.range, {isDisplaySelfArea: true});

		const eleLi = veE({
			tag: "div",
			clazz: `ve-lst__row ve-flex-col ${isExcluded ? "ve-lst__row--blocklisted" : ""}`,
			click: (evt) => this._list.doSelect(listItem, evt),
			contextmenu: (evt) => this._openContextMenu(evt, this._list, listItem),
			html: `<a href="#${hash.qq()}" class="ve-lst__row-border ve-lst__row-inner">
				<span class="ve-bold ve-col-2-9 ve-pl-0 ve-pr-1">${spell.name.qq()}</span>
				<span class="ve-col-1-5 ve-px-1 ve-text-center">${PageFilterSpells.getTblLevelStr(spell).qq()}</span>
				<span class="ve-col-1-7 ve-px-1 ve-text-center">${time.qq()}</span>
				<span class="ve-col-1-2 ve-px-1 ${schoolClassName.qq()} ve-text-center" title="${Parser.spSchoolAndSubschoolsAbvsToFull(spell.school, spell.subschools).qq()}" ${Parser.spSchoolAbvToStyle(spell.school) || ""}>${school.qq()}</span>
				<span class="ve-col-0-6 ve-px-1 ve-text-center" title="Concentration">${concentration}</span>
				<span class="ve-col-2-4 ve-px-1 ve-text-right">${range.qq()}</span>
				<span class="ve-col-1-7 ve-text-center ${Parser.sourceJsonToSourceClassname(spell.source).qq()} ve-pl-1 ve-pr-0" title="${`${Parser.sourceJsonToFull(spell.source)}${Renderer.utils.getSourceSubText(spell)}`.qq()}">${source.qq()}</span>
			</a>`,
		});

		const listItem = new ListItem({
			id: spI,
			ele: eleLi,
			name: spell.name,
			values: {
				source,
				...ListItem.getCommonValues(spell),
				level: spell.level,
				time,
				school: Parser.spSchoolAbvToFull(spell.school),
				concentration,
				normalisedTime: spell._normalisedTime,
				normalisedRange: spell._normalisedRange,
			},
			data: {
				hash,
				page: spell.page,
				isExcluded,
			},
		});

		return listItem;
	}

	_tabTitleStats = "Spell";

	_renderStats_doBuildStatsTab ({ent}) {
		this._pgContent.vee.empty().vee.appends(RenderSpells.getRenderedSpell(ent, {subclassLookup: this._subclassLookup, settings: this._compSettings.getValues()}));
	}

	async _pOnLoad_pPreDataLoad () {
		const subclassLookup = await DataUtil.class.pGetSubclassLookup();
		Object.assign(this._subclassLookup, subclassLookup);
	}

	async _pOnLoad_pPreDataAdd () {
		Renderer.spell.populatePrereleaseLookup(await PrereleaseUtil.pGetBrewProcessed());
		Renderer.spell.populateBrewLookup(await BrewUtil2.pGetBrewProcessed());
	}

	async _pPreloadSublistSources (json) {
		const loaded = Object.keys(this._loadedSources)
			.filter(it => this._loadedSources[it].loaded);
		const lowerSources = json.sources.map(it => it.toLowerCase());
		const toLoad = Object.keys(this._loadedSources)
			.filter(it => !loaded.includes(it))
			.filter(it => lowerSources.includes(it.toLowerCase()));
		const loadTotal = toLoad.length;
		if (loadTotal) {
			await Promise.all(toLoad.map(src => this._pLoadSource(src, "yes")));
		}
	}
}

const spellsPage = new SpellsPage();
spellsPage.sublistManager = new SpellsSublistManager();
window.addEventListener("load", () => spellsPage.pOnLoad());

globalThis.dbg_page = spellsPage;
