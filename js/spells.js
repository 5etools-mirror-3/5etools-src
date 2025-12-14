import {RenderSpells, RenderSpellsSettings} from "./render-spells.js";

class SpellsSublistManager extends SublistManager {
	static _getRowTemplate () {
		return [
			new SublistCellTemplate({
				name: "Name",
				css: "bold ve-col-3-2 pl-0 pr-1",
				colStyle: "",
			}),
			new SublistCellTemplate({
				name: "Level",
				css: "capitalize ve-col-1-5 px-1 ve-text-center",
				colStyle: "text-center",
			}),
			new SublistCellTemplate({
				name: "Time",
				css: "ve-col-1-8 px-1 ve-text-center",
				colStyle: "text-center",
			}),
			new SublistCellTemplate({
				name: "School",
				css: "capitalize ve-col-1-6 px-1 ve-text-center",
				colStyle: "text-center",
			}),
			new SublistCellTemplate({
				name: "C.",
				css: "concentration--sublist ve-col-0-7 px-1 ve-text-center",
				colStyle: "text-center",
			}),
			new SublistCellTemplate({
				name: "Range",
				css: "range ve-col-3-2 pl-1 pr-0 ve-text-right",
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
				css: `sp__school-${spell.school}`,
				style: Parser.spSchoolAbvToStyle(spell.school),
			}),
			new SublistCell({
				text: concentration,
				title: concentration ? "Concentration" : "",
			}),
			range,
		];

		const ele = ee`<div class="lst__row lst__row--sublist ve-flex-col">
			<a href="#${UrlUtil.autoEncodeHash(spell)}" title="${spell.name}" class="lst__row-border lst__row-inner">
				${this.constructor._getRowCellsHtml({values: cellsText})}
			</a>
		</div>`
			.onn("contextmenu", evt => this._handleSublistItemContextMenu(evt, listItem))
			.onn("click", evt => this._listSub.doSelect(listItem, evt));

		const listItem = new ListItem(
			hash,
			ele,
			spell.name,
			{
				hash,
				page: spell.page,
				school,
				level: spell.level,
				time,
				concentration,
				range,
				normalisedTime: spell._normalisedTime,
				normalisedRange: spell._normalisedRange,
			},
			{
				entity: spell,
				mdRow: [...cellsText],
			},
		);
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
			propMarkdown: "spell",
			...opts,
		});

		this._bookViewLastOrder = null;
		this._wrpContent = null;
	}

	_getSorted (a, b) {
		a = a.entity;
		b = b.entity;
		return this._bookViewLastOrder === "0" ? SortUtil.ascSort(a.level, b.level) : SortUtil.ascSortLower(a.name, b.name);
	}

	async _pGetWrpControls ({wrpContent}) {
		const out = await super._pGetWrpControls({wrpContent});

		const {wrpPrint} = out;

		this._bookViewLastOrder = StorageUtil.syncGetForPage(SpellPageBookView._BOOK_VIEW_MODE_K);
		if (this._bookViewLastOrder != null) this._bookViewLastOrder = `${this._bookViewLastOrder}`;

		const onChangeSortMode = () => {
			if (!this._bookViewToShow.length && Hist.lastLoadedId != null) return;

			const val = selSortMode.val();
			if (val === "0") this._renderByLevel();
			else this._renderByAlpha();

			StorageUtil.syncSetForPage(SpellPageBookView._BOOK_VIEW_MODE_K, val);
		};

		const selSortMode = ee`<select class="form-control input-sm">
			<option value="0">Spell Level</option>
			<option value="1">Alphabetical</option>
		</select>`
			.onn("change", () => onChangeSortMode());

		selSortMode.val(`${this._bookViewLastOrder ?? 0}`);
		ee`<div class="ve-flex-vh-center ml-3"><div class="mr-2 no-wrap">Sort order:</div>${selSortMode}</div>`.appendTo(wrpPrint);

		return out;
	}

	_renderSpell ({stack, sp}) {
		stack.push(`<div class="bkmv__wrp-item ve-inline-block print__ve-block print__my-2"><table class="w-100 stats stats--book stats--bkmv"><tbody>`);
		stack.push(Renderer.spell.getCompactRenderedString(sp));
		stack.push(`</tbody></table></div>`);
	}

	_renderByLevel () {
		let isAnyEntityRendered = false;
		const stack = [];
		for (let i = 0; i < 10; ++i) {
			const atLvl = this._bookViewToShow.filter(({entity}) => entity.level === i);
			if (atLvl.length) {
				stack.push(`<div class="bkmv__no-breaks">`);
				stack.push(`<div class="bkmv__spacer-name ve-flex-v-center no-shrink no-print pl-2">${Parser.spLevelToFullLevelText(i)}</div>`);
				atLvl.forEach(({entity}) => this._renderSpell({stack, sp: entity}));
				isAnyEntityRendered = true;
				stack.push(`</div>`);
			}
		}
		this._wrpContent.empty().appends(stack.join(""));
		this._bookViewLastOrder = "0";
		return {isAnyEntityRendered};
	}

	_renderByAlpha () {
		const stack = [];
		this._bookViewToShow.forEach(({entity}) => this._renderSpell({stack, sp: entity}));
		this._wrpContent.empty().appends(stack.join(""));
		this._bookViewLastOrder = "1";
		return {isAnyEntityRendered: !!this._bookViewToShow.length};
	}

	_renderNoneSelected () {
		const stack = [];
		stack.push(`<div class="w-100 h-100 no-breaks">`);
		this._renderSpell({stack, sp: this._fnGetEntLastLoaded()});
		stack.push(`</div>`);
		this._wrpContent.empty().appends(stack.join(""));
		return {isAnyEntityRendered: false};
	}

	_renderSpells () {
		if (!this._bookViewToShow.length && Hist.lastLoadedId != null) return this._renderNoneSelected();
		else if (this._bookViewLastOrder === "1") return this._renderByAlpha();
		else return this._renderByLevel();
	}

	async _pGetRenderContentMeta ({wrpContent, wrpControls}) {
		this._wrpContent = wrpContent;
		wrpContent.addClass("p-2");

		this._bookViewToShow = this._sublistManager.getSublistedEntityMetas()
			.sort(this._getSorted.bind(this));

		const {isAnyEntityRendered} = this._renderSpells();

		return {
			cntSelectedEnts: this._bookViewToShow.length,
			isAnyEntityRendered,
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
							return `<span class="sp__school-${sp.school}" ${Parser.spSchoolAbvToStyle(sp.school)}>${Parser.spSchoolAndSubschoolsAbvsToFull(sp.school, sp.subschools)}</span>${ptMeta.length ? ` (${ptMeta.join(", ")})` : ""}`;
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
		const concentration = spell._isConc ? "×" : "";
		const range = Parser.spRangeToFull(spell.range, {isDisplaySelfArea: true});

		const eleLi = e_({
			tag: "div",
			clazz: `lst__row ve-flex-col ${isExcluded ? "lst__row--blocklisted" : ""}`,
			click: (evt) => this._list.doSelect(listItem, evt),
			contextmenu: (evt) => this._openContextMenu(evt, this._list, listItem),
			children: [
				e_({
					tag: "a",
					href: `#${hash}`,
					clazz: "lst__row-border lst__row-inner",
					children: [
						e_({tag: "span", clazz: `bold ve-col-2-9 pl-0 pr-1`, text: spell.name}),
						e_({tag: "span", clazz: `ve-col-1-5 px-1 ve-text-center`, text: PageFilterSpells.getTblLevelStr(spell)}),
						e_({tag: "span", clazz: `ve-col-1-7 px-1 ve-text-center`, text: time}),
						e_({
							tag: "span",
							clazz: `ve-col-1-2 px-1 sp__school-${spell.school} ve-text-center`,
							title: Parser.spSchoolAndSubschoolsAbvsToFull(spell.school, spell.subschools),
							style: Parser.spSchoolAbvToStylePart(spell.school),
							text: school,
						}),
						e_({tag: "span", clazz: `ve-col-0-6 px-1 ve-text-center`, title: "Concentration", text: concentration}),
						e_({tag: "span", clazz: `ve-col-2-4 px-1 ve-text-right`, text: range}),
						e_({
							tag: "span",
							clazz: `ve-col-1-7 ve-text-center ${Parser.sourceJsonToSourceClassname(spell.source)} pl-1 pr-0`,
							title: `${Parser.sourceJsonToFull(spell.source)}${Renderer.utils.getSourceSubText(spell)}`,
							text: source,
						}),
					],
				}),
			],
		});

		const listItem = new ListItem(
			spI,
			eleLi,
			spell.name,
			{
				hash,
				source,
				page: spell.page,
				level: spell.level,
				time,
				school: Parser.spSchoolAbvToFull(spell.school),
				concentration,
				normalisedTime: spell._normalisedTime,
				normalisedRange: spell._normalisedRange,
			},
			{
				isExcluded,
			},
		);

		return listItem;
	}

	_tabTitleStats = "Spell";

	_renderStats_doBuildStatsTab ({ent}) {
		this._pgContent.empty().appends(RenderSpells.getRenderedSpell(ent, {subclassLookup: this._subclassLookup, settings: this._compSettings.getValues()}));
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
