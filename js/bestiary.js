import {EncounterBuilderCacheBestiaryPage} from "./bestiary/bestiary-encounterbuilder-cache.js";
import {EncounterBuilderComponentBestiary} from "./bestiary/bestiary-encounterbuilder-component.js";
import {EncounterBuilderUiBestiary} from "./bestiary/bestiary-encounterbuilder-ui.js";
import {EncounterBuilderSublistPlugin} from "./bestiary/bestiary-encounterbuilder-sublistplugin.js";
import {RenderBestiary} from "./render-bestiary.js";
import {EncounterBuilderRulesClassic} from "./encounterbuilder/rules/encounterbuilder-rules-classic.js";
import {EncounterBuilderRulesOne} from "./encounterbuilder/rules/encounterbuilder-rules-one.js";
import {EncounterBuilderRulesMcdmFleeMortals} from "./encounterbuilder/rules/encounterbuilder-rules-mcdmfleemortals.js";
import {EncounterBuilderShapesLookup} from "./encounterbuilder/encounterbuilder-shapeslookup.js";

class _BestiaryConsts {
	static PROF_MODE_BONUS = "bonus";
	static PROF_MODE_DICE = "dice";

	static STORAGE_KEY_ENCOUNTER_BUILDER_UI_STATE = "encounterBuilderUiStateState";
}

class _BestiaryUtil {
	static getUrlSubhashes (mon, {isAddLeadingSep = true} = {}) {
		const subhashesRaw = [
			mon._isScaledCr ? `${UrlUtil.HASH_START_CREATURE_SCALED}${mon._scaledCr}` : null,
			mon._summonedBySpell_level ? `${UrlUtil.HASH_START_CREATURE_SCALED_SPELL_SUMMON}${mon._summonedBySpell_level}` : null,
			mon._summonedByClass_level ? `${UrlUtil.HASH_START_CREATURE_SCALED_CLASS_SUMMON}${mon._summonedByClass_level}` : null,
		].filter(Boolean);

		if (!subhashesRaw.length) return "";
		return `${isAddLeadingSep ? HASH_PART_SEP : ""}${subhashesRaw.join(HASH_PART_SEP)}`;
	}

	static getListDisplayType (mon) {
		let type = mon._pTypes.asTextShort.uppercaseFirst();
		if (mon._pTypes.asTextSidekick) type += `, ${mon._pTypes.asTextSidekick}`;
		return type;
	}
}

class BestiarySublistManager extends SublistManager {
	constructor () {
		super({
			sublistListOptions: {
				fnSort: PageFilterBestiary.sortMonsters,
			},
			shiftCountAddSubtract: 5,
			isSublistItemsCountable: true,
		});

		this._encounterBuilder = null;
	}

	set encounterBuilder (val) { this._encounterBuilder = val; }

	_getCustomHashId ({entity}) {
		return Renderer.monster.getCustomHashId(entity);
	}

	_getSerializedPinnedItemData (listItem) {
		return {cId: listItem.data.collectionId, l: listItem.data.isLocked ? listItem.data.isLocked : undefined};
	}

	_getDeserializedPinnedItemData (serialData) {
		return {collectionId: serialData.cId, isLocked: !!serialData.l};
	}

	_isDisplaySublist () {
		if (super._isDisplaySublist()) return true;
		return this._encounterBuilder.isActive();
	}

	_onSublistChange () {
		this._encounterBuilder.onSublistChange();
	}

	_getSublistFullHash ({entity}) {
		return `${super._getSublistFullHash({entity})}${_BestiaryUtil.getUrlSubhashes(entity)}`;
	}

	static _getRowTemplate () {
		return [
			new SublistCellTemplate({
				name: "Name",
				css: "bold ve-col-5 pl-0 pr-1",
				colStyle: "",
			}),
			new SublistCellTemplate({
				name: "Type",
				css: "ve-col-3-8 px-1",
				colStyle: "",
			}),
			new SublistCellTemplate({
				name: "CR",
				css: "ve-col-1-2 px-1 ve-text-center",
				colStyle: "text-center",
			}),
			new SublistCellTemplate({
				name: "Number",
				css: "ve-col-2 pl-1 pr-0 ve-text-center",
				colStyle: "text-center",
			}),
		];
	}

	async pGetSublistItem (mon, hash, {count = 1, customHashId = null, initialData} = {}) {
		const name = mon._displayName || mon.name;
		const type = _BestiaryUtil.getListDisplayType(mon);
		const cr = mon._pCr;
		const hashBase = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY](mon);
		// If e.g. reloading from a save
		const collectionId = initialData?.collectionId;
		const isLocked = !!initialData?.isLocked;

		const cellsText = [name, type, cr];

		const hovStatblock = ee`<span class="ve-col-1-4 help help--hover best-ecgen__visible">Stat Block</span>`
			.onn("mouseover", evt => this._encounterBuilder.doStatblockMouseOver({
				evt,
				ele: hovStatblock,
				source: mon.source,
				hash: hashBase,
				customHashId: this._getCustomHashId({entity: mon}),
			}))
			.onn("mousemove", evt => Renderer.hover.handleLinkMouseMove(evt, hovStatblock))
			.onn("mouseleave", evt => Renderer.hover.handleLinkMouseLeave(evt, hovStatblock));

		const hovTokenMeta = EncounterBuilderUiBestiary.getTokenHoverMeta(mon);
		const hovToken = !hovTokenMeta ? ee`<span class="ve-col-1-2 best-ecgen__visible"></span>` : ee`<span class="ve-col-1-2 best-ecgen__visible help help--hover">Token</span>`
			.onn("mouseover", evt => hovTokenMeta.mouseOver(evt, hovToken))
			.onn("mousemove", evt => hovTokenMeta.mouseMove(evt, hovToken))
			.onn("mouseleave", evt => hovTokenMeta.mouseLeave(evt, hovToken));

		const hovImage = ee`<span class="ve-col-1-2 best-ecgen__visible help help--hover">Image</span>`;
		Renderer.monster.hover.bindFluffImageMouseover({mon, ele: hovImage});

		const ptCr = (() => {
			if (!ScaleCreature.isCrInScaleRange(mon)) return ee`<span class="ve-col-1-2 ve-text-center">${cr}</span>`;

			const iptCr = ee`<input value="${cr}" class="w-100 ve-text-center form-control form-control--minimal input-xs">`
				.onn("click", () => iptCr.selecte())
				.onn("change", () => this._encounterBuilder.pDoCrChange(iptCr, mon, mon._scaledCr));

			return ee`<span class="ve-col-1-2 ve-text-center pr-1p">${iptCr}</span>`;
		})();

		const eleCount1 = ee`<span class="ve-col-2 ve-text-center">${count}</span>`;

		const {stg: stgCount2, comp: compCount2} = (() => {
			const comp = BaseComponent.fromObject({count});

			const ipt = ComponentUiUtil.getIptNumber(
				comp,
				"count",
				1,
				{
					fallbackOnNaN: count,
					html: `<input class="w-100 ve-text-center form-control form-control--minimal input-xs">`,
				},
			);

			comp._addHookBase("count", () => {
				if (comp._state.count <= 0) {
					this.pDoSublistRemove({entity: mon, doFinalize: true}).then(null);
					return;
				}

				this.pDoSublistSetCount({entity: mon, doFinalize: true, count: comp._state.count}).then(null);
			});

			const stg = ee`<span class="ve-col-2 pr-0 ve-text-center pl-1p">${ipt}</span>`;

			return {stg, ipt, comp};
		})();

		const listItem = new ListItem(
			hash,
			null,
			name,
			{
				hash,
				source: Parser.sourceJsonToAbv(mon.source),
				type,
				cr,
				page: mon.page,
			},
			{
				count,
				customHashId,
				collectionId,
				isLocked,
				elesCount: [eleCount1],
				fnsUpdate: [({sublistItem}) => compCount2._state.count = sublistItem.data.count],
				entity: mon,
				entityBase: await DataLoader.pCacheAndGetHash(
					UrlUtil.PG_BESTIARY,
					hashBase,
				),
				mdRow: [...cellsText, ({listItem}) => listItem.data.count],
			},
		);

		const sublistButtonsMeta = this._encounterBuilder.getSublistButtonsMeta(listItem);
		listItem.data.fnsUpdate.push(sublistButtonsMeta.fnUpdate);

		listItem.ele = ee`<div class="lst__row lst__row--sublist ve-flex-col lst__row--bestiary-sublist">
			<a href="#${hash}" draggable="false" class="best-ecgen__hidden lst__row-border lst__row-inner">
				${this.constructor._getRowCellsHtml({values: cellsText, templates: this.constructor._ROW_TEMPLATE.slice(0, 3)})}
				${eleCount1}
			</a>

			<div class="lst__wrp-cells best-ecgen__visible--flex lst__row-border lst__row-inner">
				${sublistButtonsMeta.wrp}
				<span class="best-ecgen__name--sub ve-col-3-5">${name}</span>
				${hovStatblock}
				${hovToken}
				${hovImage}
				${ptCr}
				${stgCount2}
			</div>
		</div>`
			.onn("contextmenu", evt => this._handleSublistItemContextMenu(evt, listItem))
			.onn("click", evt => this._handleBestiaryLinkClickSub(evt, listItem));

		return listItem;
	}

	_handleBestiaryLinkClickSub (evt, listItem) {
		if (this._encounterBuilder.isActive()) evt.preventDefault();
		else this._listSub.doSelect(listItem, evt);
	}
}

class BestiaryPageBookView extends ListPageBookView {
	constructor (opts) {
		super({
			nameSingular: "creature",
			namePlural: "creatures",
			pageTitle: "Bestiary Printer View",
			...opts,
		});
	}

	async _pGetWrpControls ({wrpContent}) {
		const out = await super._pGetWrpControls({wrpContent});
		const {wrpPrint} = out;

		// region Markdown
		// TODO refactor this and spell markdown section
		const pGetAsMarkdown = async () => {
			const toRender = this._bookViewToShow.length ? this._bookViewToShow.map(({entity}) => entity) : [this._fnGetEntLastLoaded()];
			return RendererMarkdown.monster.pGetMarkdownDoc(toRender);
		};

		const btnDownloadMarkdown = ee`<button class="ve-btn ve-btn-default ve-btn-sm">Download as Markdown</button>`
			.onn("click", async () => DataUtil.userDownloadText("bestiary.md", await pGetAsMarkdown()));

		const btnCopyMarkdown = ee`<button class="ve-btn ve-btn-default ve-btn-sm px-2" title="Copy Markdown to Clipboard"><span class="glyphicon glyphicon-copy"></span></button>`
			.onn("click", async () => {
				await MiscUtil.pCopyTextToClipboard(await pGetAsMarkdown());
				JqueryUtil.showCopiedEffect(btnCopyMarkdown);
			});

		const btnDownloadMarkdownSettings = ee`<button class="ve-btn ve-btn-default ve-btn-sm px-2" title="Markdown Settings"><span class="glyphicon glyphicon-cog"></span></button>`
			.onn("click", async () => RendererMarkdown.pShowSettingsModal());

		ee`<div class="ve-flex-v-center ve-btn-group ml-2">
			${btnDownloadMarkdown}
			${btnCopyMarkdown}
			${btnDownloadMarkdownSettings}
		</div>`.appendTo(wrpPrint);
		// endregion

		return out;
	}

	async _pGetRenderContentMeta ({wrpContent}) {
		this._bookViewToShow = this._sublistManager.getSublistedEntityMetas()
			.sort(this._getSorted.bind(this));

		let cntSelectedEnts = 0;
		let isAnyEntityRendered = false;

		const stack = [];

		const renderCreature = (mon) => {
			isAnyEntityRendered = true;
			stack.push(`<div class="bkmv__wrp-item ve-inline-block print__ve-block print__my-2"><table class="w-100 stats stats--book stats--bkmv"><tbody>`);
			stack.push(Renderer.monster.getCompactRenderedString(mon));
			stack.push(`</tbody></table></div>`);
		};

		this._bookViewToShow
			.filter(Boolean)
			.forEach(({entity, count}) => Array.from({length: this._comp._state.isRenderCopies ? count : 1}, () => renderCreature(entity)));

		if (!this._bookViewToShow.length && Hist.lastLoadedId != null) {
			renderCreature(this._fnGetEntLastLoaded());
		}

		cntSelectedEnts += this._bookViewToShow.length;
		wrpContent.appends(stack.join(""));

		return {cntSelectedEnts, isAnyEntityRendered};
	}

	_getSorted (a, b) {
		a = a.entity;
		b = b.entity;
		return SortUtil.ascSort(a._displayName || a.name, b._displayName || b.name);
	}
}

class BestiaryPage extends ListPageMultiSource {
	static async _prereleaseBrewDataSource ({brewUtil}) {
		const brew = await brewUtil.pGetBrewProcessed();
		DataUtil.monster.populateMetaReference(brew);
		return brew;
	}

	static _tableView_getEntryPropTransform ({mon, fnGet}) {
		const fnGetSpellTraits = Renderer.monster.getSpellcastingRenderedTraits.bind(Renderer.monster, Renderer.get());
		const allEntries = fnGet(mon, {fnGetSpellTraits});
		return (allEntries || []).map(it => it.rendered || Renderer.get().render(it, 2)).join("\n");
	}

	constructor () {
		const pFnGetFluff = Renderer.monster.pGetFluff.bind(Renderer.monster);

		super({
			pageFilter: new PageFilterBestiary({
				sourceFilterOpts: {
					pFnOnChange: (...args) => this._pLoadSource(...args),
				},
			}),

			listOptions: {
				fnSort: PageFilterBestiary.sortMonsters,
			},

			dataProps: ["monster"],
			prereleaseDataSource: () => BestiaryPage._prereleaseBrewDataSource({brewUtil: PrereleaseUtil}),
			brewDataSource: () => BestiaryPage._prereleaseBrewDataSource({brewUtil: BrewUtil2}),

			pFnGetFluff,

			hasAudio: true,

			bookViewOptions: {
				ClsBookView: BestiaryPageBookView,
				isSublistItemsCountable: true,
			},

			tableViewOptions: {
				title: "Bestiary",
				colTransforms: {
					name: UtilsTableview.COL_TRANSFORM_NAME,
					source: UtilsTableview.COL_TRANSFORM_SOURCE,
					page: UtilsTableview.COL_TRANSFORM_PAGE,
					size: {name: "Size", transform: size => Renderer.utils.getRenderedSize(size)},
					type: {name: "Type", transform: type => Parser.monTypeToFullObj(type).asText},
					alignment: {name: "Alignment", transform: align => Parser.alignmentListToFull(align)},
					ac: {name: "AC", transform: ac => ac != null ? Parser.acToFull(ac) : ""},
					hp: {name: "HP", transform: hp => hp != null ? Renderer.monster.getRenderedHp(hp) : ""},
					_speed: {name: "Speed", transform: mon => Parser.getSpeedString(mon)},
					...Parser.ABIL_ABVS.mergeMap(ab => ({[ab]: {name: Parser.attAbvToFull(ab)}})),
					_save: {name: "Saving Throws", transform: mon => Renderer.monster.getSavesPart(mon)},
					_skill: {name: "Skills", transform: mon => Renderer.monster.getSkillsString(Renderer.get(), mon)},
					vulnerable: {name: "Damage Vulnerabilities", transform: it => Parser.getFullImmRes(it)},
					resist: {name: "Damage Resistances", transform: it => Parser.getFullImmRes(it)},
					immune: {name: "Damage Immunities", transform: it => Parser.getFullImmRes(it)},
					conditionImmune: {name: "Condition Immunities", transform: it => Parser.getFullCondImm(it)},
					_senses: {name: "Senses", transform: mon => Renderer.monster.getSensesPart(mon, {isForcePassive: true})},
					languages: {name: "Languages", transform: it => Renderer.monster.getRenderedLanguages(it)},
					_cr: {name: "CR", transform: mon => Renderer.monster.getChallengeRatingPart(mon)},
					_trait: {
						name: "Traits",
						transform: mon => BestiaryPage._tableView_getEntryPropTransform({mon, fnGet: Renderer.monster.getOrderedTraits}),
						flex: 3,
					},
					_action: {
						name: "Actions",
						transform: mon => BestiaryPage._tableView_getEntryPropTransform({mon, fnGet: Renderer.monster.getOrderedActions}),
						flex: 3,
					},
					_bonus: {
						name: "Bonus Actions",
						transform: mon => BestiaryPage._tableView_getEntryPropTransform({mon, fnGet: Renderer.monster.getOrderedBonusActions}),
						flex: 3,
					},
					_reaction: {
						name: "Reactions",
						transform: mon => BestiaryPage._tableView_getEntryPropTransform({mon, fnGet: Renderer.monster.getOrderedReactions}),
						flex: 3,
					},
					_legendary: {
						name: "Legendary Actions",
						transform: mon => BestiaryPage._tableView_getEntryPropTransform({mon, fnGet: Renderer.monster.getOrderedLegendaryActions}),
						flex: 3,
					},
					_mythic: {
						name: "Mythic Actions",
						transform: mon => BestiaryPage._tableView_getEntryPropTransform({mon, fnGet: Renderer.monster.getOrderedMythicActions}),
						flex: 3,
					},
					_lairActions: {
						name: "Lair Actions",
						transform: mon => {
							const legGroup = DataUtil.monster.getLegendaryGroup(mon);
							if (!legGroup?.lairActions?.length) return "";
							return Renderer.get().render({entries: legGroup.lairActions});
						},
						flex: 3,
					},
					_regionalEffects: {
						name: "Regional Effects",
						transform: mon => {
							const legGroup = DataUtil.monster.getLegendaryGroup(mon);
							if (!legGroup?.regionalEffects?.length) return "";
							return Renderer.get().render({entries: legGroup.regionalEffects});
						},
						flex: 3,
					},
					environment: {name: "Environment", transform: it => Renderer.monster.getRenderedEnvironment(it)},
					treasure: {name: "Treasure", transform: it => Renderer.monster.getRenderedTreasure(it)},
				},
			},
			propEntryData: "monster",

			propLoader: "monster",

			listSyntax: new ListSyntaxBestiary({fnGetDataList: () => this._dataList, pFnGetFluff}),
		});

		this._wrpBtnProf = null;
		this._btnProf = null;

		this._profDiceMode = null;

		this._encounterBuilder = null;

		this._tokenDisplay = new ListPageTokenDisplay({
			fnHasToken: Renderer.monster.hasToken.bind(Renderer.monster),
			fnGetTokenUrl: Renderer.monster.getTokenUrl.bind(Renderer.monster),
		});
	}

	get _bindOtherButtonsOptions () {
		return {
			upload: {
				pFnPreLoad: (...args) => this._pPreloadSublistSources(...args),
			},
			sendToBrew: {
				mode: "creatureBuilder",
				fnGetMeta: () => ({
					page: UrlUtil.getCurrentPage(),
					source: Hist.getHashSource(),
					hash: `${UrlUtil.autoEncodeHash(this._lastRender.entity)}${_BestiaryUtil.getUrlSubhashes(this._lastRender.entity)}`,
				}),
			},
			other: [
				this._bindOtherButtonsOptions_openAsSinglePage({slugPage: "bestiary"}),
			].filter(Boolean),
		};
	}

	set encounterBuilder (val) { this._encounterBuilder = val; }

	get list_ () { return this._list; }

	getListItem (mon, mI) {
		const hash = UrlUtil.autoEncodeHash(mon);
		if (this._seenHashes.has(hash)) return null;
		this._seenHashes.add(hash);

		Renderer.monster.updateParsed(mon);
		const isExcluded = ExcludeUtil.isExcluded(hash, "monster", mon.source);

		this._pageFilter.mutateAndAddToFilters(mon, isExcluded);

		const source = Parser.sourceJsonToAbv(mon.source);
		const type = _BestiaryUtil.getListDisplayType(mon);
		const cr = mon._pCr;

		const eleLi = e_({
			tag: "div",
			clazz: `lst__row ve-flex-col ${isExcluded ? "lst__row--blocklisted" : ""}`,
			click: (evt) => this._handleBestiaryLiClick(evt, listItem),
			contextmenu: (evt) => this._handleBestiaryLiContext(evt, listItem),
			children: [
				e_({
					tag: "a",
					href: `#${hash}`,
					clazz: "lst__row-border lst__row-inner",
					click: evt => this._handleBestiaryLinkClick(evt),
					children: [
						this._encounterBuilder.getButtons(mI),
						e_({tag: "span", clazz: `best-ecgen__name bold ve-col-4-2 pl-0 pr-1`, text: mon.name}),
						e_({tag: "span", clazz: `ve-col-4-1 px-1`, text: type}),
						e_({tag: "span", clazz: `ve-col-1-7 px-1 ve-text-center`, text: cr}),
						e_({
							tag: "span",
							clazz: `ve-col-2 ve-text-center ${Parser.sourceJsonToSourceClassname(mon.source)} pl-1 pr-0`,
							title: `${Parser.sourceJsonToFull(mon.source)}${Renderer.utils.getSourceSubText(mon)}`,
							text: source,
						}),
					],
				}),
			],
		});

		const listItem = new ListItem(
			mI,
			eleLi,
			mon.name,
			{
				hash,
				source,
				type,
				cr,
				...ListItem.getCommonValues(mon),
			},
			{
				isExcluded,
			},
		);

		return listItem;
	}

	handleFilterChange () {
		super.handleFilterChange();
		this._encounterBuilder.resetCache();
	}

	async _pDoLoadHash ({id, lockToken}) {
		const mon = this._dataList[id];

		this._renderStatblock(mon);

		await this._pDoLoadSubHash({sub: [], lockToken});
		this._updateSelected();
	}

	async _pDoLoadSubHash ({sub, lockToken}) {
		sub = await super._pDoLoadSubHash({sub, lockToken});

		const scaledHash = sub.find(it => it.startsWith(UrlUtil.HASH_START_CREATURE_SCALED));
		const scaledSpellSummonHash = sub.find(it => it.startsWith(UrlUtil.HASH_START_CREATURE_SCALED_SPELL_SUMMON));
		const scaledClassSummonHash = sub.find(it => it.startsWith(UrlUtil.HASH_START_CREATURE_SCALED_CLASS_SUMMON));
		const mon = this._dataList[Hist.lastLoadedId];

		if (scaledHash) {
			const scaleTo = Number(UrlUtil.unpackSubHash(scaledHash)[VeCt.HASH_SCALED][0]);
			const scaleToStr = Parser.numberToCr(scaleTo);
			if (Parser.isValidCr(scaleToStr) && scaleTo !== Parser.crToNumber(this._lastRender.entity.cr)) {
				ScaleCreature.scale(mon, scaleTo)
					.then(monScaled => this._renderStatblock(monScaled, {isScaledCr: true}));
			}
		} else if (scaledSpellSummonHash) {
			const scaleTo = Number(UrlUtil.unpackSubHash(scaledSpellSummonHash)[VeCt.HASH_SCALED_SPELL_SUMMON][0]);
			if (mon.summonedBySpellLevel != null && scaleTo >= mon.summonedBySpellLevel && scaleTo !== this._lastRender.entity._summonedBySpell_level) {
				ScaleSpellSummonedCreature.scale(mon, scaleTo)
					.then(monScaled => this._renderStatblock(monScaled, {isScaledSpellSummon: true}));
			}
		} else if (scaledClassSummonHash) {
			const scaleTo = Number(UrlUtil.unpackSubHash(scaledClassSummonHash)[VeCt.HASH_SCALED_CLASS_SUMMON][0]);
			if ((mon.summonedByClass != null || mon.summonedScaleByPlayerLevel) && scaleTo > 0 && scaleTo !== this._lastRender.entity._summonedByClass_level) {
				ScaleClassSummonedCreature.scale(mon, scaleTo)
					.then(monScaled => this._renderStatblock(monScaled, {isScaledClassSummon: true}));
			}
		}

		this._encounterBuilder.handleSubhash(sub);
	}

	async _pOnLoad_pPreDataLoad () {
		this._encounterBuilder.initUi();
		await DataUtil.monster.pPreloadLegendaryGroups();
		this._bindProfDiceHandlers();
	}

	async _pOnLoad_pPreDataAdd () {
		await this._pPageInit_pProfBonusDiceToggle();
	}

	async _pOnLoad_pPostLoad () {
		await encounterShapesLookup.pInit();

		this._encounterBuilder.setStateFrom(await StorageUtil.pGetForPage(_BestiaryConsts.STORAGE_KEY_ENCOUNTER_BUILDER_UI_STATE));

		this._encounterBuilder
			.addHookOnSave(MiscUtil.throttle(
				async () => {
					await StorageUtil.pSetForPage(_BestiaryConsts.STORAGE_KEY_ENCOUNTER_BUILDER_UI_STATE, this._encounterBuilder.getSaveableState());
				},
				100,
			));

		this._encounterBuilder.render();

		const btnSaveToUrl = ee`<button class="ve-btn ve-btn-default ve-btn-xs mr-2">Save to URL</button>`
			.onn("click", () => this._sublistManager.pHandleClick_download({isUrl: true, eleCopyEffect: btnSaveToUrl}));
		const btnSaveToFile = ee`<button class="ve-btn ve-btn-default ve-btn-xs">Save to File</button>`
			.onn("click", () => this._sublistManager.pHandleClick_download());
		const btnLoadFromFile = ee`<button class="ve-btn ve-btn-default ve-btn-xs">Load from File</button>`
			.onn("click", evt => this._sublistManager.pHandleClick_upload({isAdditive: evt.shiftKey}));
		const btnCopyAsText = ee`<button class="ve-btn ve-btn-default ve-btn-xs mr-2" title="SHIFT for Multi-Line Format">Copy as Text</button>`
			.onn("click", (evt) => this._encounterBuilder.handleClickCopyAsText(evt));
		const btnReset = ee`<button class="ve-btn ve-btn-danger ve-btn-xs" title="SHIFT to Reset Players">Reset</button>`
			.onn("click", (evt) => this._sublistManager.pHandleClick_new(evt));

		const btnBackToStatblocks = ee`<button class="ve-btn ve-btn-success ve-btn-xs">Back to Stat Blocks</button>`
			.onn("click", (evt) => this._encounterBuilder.handleClickBackToStatblocks(evt));

		ee`<div class="ve-flex-col w-100">
			<hr class="hr-1">

			<div class="ve-flex-v-center mb-2">
				${btnSaveToUrl}
				<div class="ve-btn-group ve-flex-v-center mr-2">
					${btnSaveToFile}
					${btnLoadFromFile}
				</div>
				${btnCopyAsText}
				${btnReset}
			</div>

			<div class="ve-flex">
				${btnBackToStatblocks}
			</div>
		</div>`
			.appendTo(es(`#wrp-encounterbuild-footer`));
	}

	async _pPageInit_pProfBonusDiceToggle () {
		this._btnProf = e_(document.getElementById("profbonusdice"));

		this._profDiceMode = await StorageUtil.pGetForPage("proficiencyDiceMode") || _BestiaryConsts.PROF_MODE_BONUS;

		const hk = () => {
			this._btnProf.txt(this._profDiceMode === _BestiaryConsts.PROF_MODE_DICE ? "Use Proficiency Bonus" : "Use Proficiency Dice");
			this._pgContent.attr("data-proficiency-dice-mode", this._profDiceMode);
			StorageUtil.pSetForPage("proficiencyDiceMode", this._profDiceMode).then(null);
		};

		this._btnProf.onn("click", () => {
			if (this._profDiceMode === _BestiaryConsts.PROF_MODE_DICE) {
				this._profDiceMode = _BestiaryConsts.PROF_MODE_BONUS;
				hk();
				return;
			}

			this._profDiceMode = _BestiaryConsts.PROF_MODE_DICE;
			hk();
		});

		hk();
	}

	_handleBestiaryLiClick (evt, listItem) {
		if (this._encounterBuilder.isActive()) Renderer.hover.doPopoutCurPage(evt, this._dataList[listItem.ix]);
		else this._list.doSelect(listItem, evt);
	}

	_handleBestiaryLiContext (evt, listItem) {
		this._openContextMenu(evt, this._list, listItem);
	}

	_handleBestiaryLinkClick (evt) {
		if (this._encounterBuilder.isActive()) evt.preventDefault();
	}

	_bindProfDiceHandlers () {
		this._pgContent
			.onn(`mousedown`, evt => {
				if (!evt.target.parentElement?.getAttribute("data-roll-prof-type")) return;

				if (this._profDiceMode !== _BestiaryConsts.PROF_MODE_BONUS) evt.preventDefault();
			})
			.onn(`click`, evt => {
				if (!evt.target.parentElement?.getAttribute("data-roll-prof-type")) return;

				const parent = evt.target.closest(`[data-roll-prof-type]`);

				const type = parent?.dataset?.rollProfType;
				if (!type) return;

				switch (type) {
					case "d20": {
						if (this._profDiceMode === _BestiaryConsts.PROF_MODE_BONUS) return;

						evt.stopPropagation();
						evt.preventDefault();

						const cpyOriginalEntry = JSON.parse(parent.dataset.packedDice);
						cpyOriginalEntry.toRoll = `d20${parent.dataset.rollProfDice}`;
						cpyOriginalEntry.d20mod = parent.dataset.rollProfDice;

						Renderer.dice.pRollerClick(evt, parent, JSON.stringify(cpyOriginalEntry));
						break;
					}

					case "dc": {
						if (this._profDiceMode === _BestiaryConsts.PROF_MODE_BONUS) {
							evt.stopPropagation();
							evt.preventDefault();
							return;
						}

						const fauxEntry = Renderer.utils.getTagEntry(`@d20`, parent.dataset.rollProfDice);
						Renderer.dice.pRollerClick(evt, parent, JSON.stringify(fauxEntry));
						break;
					}

					default: throw new Error(`Unhandled roller type "${type}"`);
				}
			});
	}

	_renderStatblock (mon, {isScaledCr = false, isScaledSpellSummon = false, isScaledClassSummon = false} = {}) {
		this._lastRender.entity = mon;
		this._lastRender.isScaledCr = isScaledCr;
		this._lastRender.isScaledSpellSummon = isScaledSpellSummon;
		this._lastRender.isScaledClassSummon = isScaledClassSummon;

		this._wrpBtnProf = this._wrpBtnProf || e_(document.getElementById("wrp-profbonusdice"));

		this._pgContent.empty();

		if (this._btnProf != null) {
			this._wrpBtnProf.appends(this._btnProf);
		}

		const tabMetaStats = new Renderer.utils.TabButton({
			label: "Stat Block",
			fnChange: () => {
				if (this._btnProf) this._wrpBtnProf.appends(this._btnProf);
				this._tokenDisplay.doShow();
			},
			fnPopulate: () => this._renderStatblock_doBuildStatsTab({mon, isScaledCr, isScaledSpellSummon, isScaledClassSummon}),
			isVisible: true,
		});

		Renderer.utils.bindTabButtons({
			tabButtons: [tabMetaStats],
			tabLabelReference: [tabMetaStats].map(it => it.label),
			wrpTabs: this._wrpTabs,
			pgContent: this._pgContent,
		});

		Promise.all([
			Renderer.utils.pHasFluffText(mon, "monsterFluff"),
			Renderer.utils.pHasFluffImages(mon, "monsterFluff"),
		])
			.then(([hasFluffText, hasFluffImages]) => {
				if (!hasFluffText && !hasFluffImages) return;

				if (this._lastRender.entity !== mon) return;

				const tabMetas = [
					tabMetaStats,
					new Renderer.utils.TabButton({
						label: "Info",
						fnChange: () => {
							this._tokenDisplay.doHide();
						},
						fnPopulate: () => this._renderStats_doBuildFluffTab({ent: mon}),
						isVisible: hasFluffText,
					}),
					new Renderer.utils.TabButton({
						label: "Images",
						fnChange: () => {
							this._tokenDisplay.doHide();
						},
						fnPopulate: () => this._renderStats_doBuildFluffTab({ent: mon, isImageTab: true}),
						isVisible: hasFluffImages,
					}),
				];

				Renderer.utils.bindTabButtons({
					tabButtons: tabMetas.filter(it => it.isVisible),
					tabLabelReference: tabMetas.map(it => it.label),
					wrpTabs: this._wrpTabs,
					pgContent: this._pgContent,
				});
			});
	}

	_renderStatblock_doBuildStatsTab (
		{
			mon,
			isScaledCr,
			isScaledSpellSummon,
			isScaledClassSummon,
		},
	) {
		Renderer.get().setFirstSection(true);

		const btnScaleCr = !ScaleCreature.isCrInScaleRange(mon) ? null : ee`<button id="btn-scale-cr" title="Scale Creature By CR (Highly Experimental)" class="mon__btn-scale-cr ve-btn ve-btn-xs ve-btn-default ve-popwindow__hidden no-print lst-is-exporting-image__hidden"><span class="glyphicon glyphicon-signal"></span></button>`
			.onn("click", (evt) => {
				evt.stopPropagation();
				const win = (evt.view || {}).window;
				const mon = this._dataList[Hist.lastLoadedId];
				const lastCr = this._lastRender.entity ? this._lastRender.entity.cr.cr || this._lastRender.entity.cr : mon.cr.cr || mon.cr;
				Renderer.monster.getCrScaleTarget({
					win,
					btnScale: btnScaleCr,
					initialCr: lastCr,
					cbRender: (targetCr) => {
						if (targetCr === Parser.crToNumber(mon.cr)) this._renderStatblock(mon);
						else Hist.setSubhash(VeCt.HASH_SCALED, targetCr);
					},
				});
			});

		const btnResetScaleCr = !ScaleCreature.isCrInScaleRange(mon) ? null : ee`<button id="btn-reset-cr" title="Reset CR Scaling" class="mon__btn-reset-cr ve-btn ve-btn-xs ve-btn-default ve-popwindow__hidden no-print lst-is-exporting-image__hidden ml-2"><span class="glyphicon glyphicon-refresh"></span></button>`
			.onn("click", () => Hist.setSubhash(VeCt.HASH_SCALED, null))
			.toggleVe(isScaledCr);

		const selSummonSpellLevel = Renderer.monster.getSelSummonSpellLevel(mon);
		if (selSummonSpellLevel) {
			selSummonSpellLevel
				.onChange(evt => {
					evt.stopPropagation();
					const scaleTo = Number(selSummonSpellLevel.val());
					if (!~scaleTo) Hist.setSubhash(VeCt.HASH_SCALED_SPELL_SUMMON, null);
					else Hist.setSubhash(VeCt.HASH_SCALED_SPELL_SUMMON, scaleTo);
				});
		}
		if (isScaledSpellSummon) selSummonSpellLevel.val(`${mon._summonedBySpell_level}`, {isSetAttribute: true});

		const selSummonClassLevel = Renderer.monster.getSelSummonClassLevel(mon);
		if (selSummonClassLevel) {
			selSummonClassLevel
				.onChange(evt => {
					evt.stopPropagation();
					const scaleTo = Number(selSummonClassLevel.val());
					if (!~scaleTo) Hist.setSubhash(VeCt.HASH_SCALED_CLASS_SUMMON, null);
					else Hist.setSubhash(VeCt.HASH_SCALED_CLASS_SUMMON, scaleTo);
				});
		}
		if (isScaledClassSummon) selSummonClassLevel.val(`${mon._summonedByClass_level}`, {isSetAttribute: true});

		// region dice rollers
		const expectedPB = Parser.crToPb(mon.cr);

		const pluginDc = (commonArgs, {input: {tag, text}}) => {
			if (isNaN(text) || expectedPB <= 0) return null;

			const withoutPB = Number(text) - expectedPB;
			const profDiceString = BestiaryPage._addSpacesToDiceExp(`1d${(expectedPB * 2)}${withoutPB >= 0 ? "+" : ""}${withoutPB}`);

			return `DC <span class="rd__dc rd__dc--rollable" data-roll-prof-type="dc" data-roll-prof-dice="${profDiceString.qq()}"><span class="rd__dc--rollable-text">${text}</span><span class="rd__dc--rollable-dice">${profDiceString}</span></span>`;
		};

		const pluginDice = (commonArgs, {input: entry}) => {
			if (expectedPB <= 0 || entry.subType !== "d20" || entry.context?.type == null) return null;

			const text = Renderer.getEntryDiceDisplayText(entry);
			let profDiceString;

			let expert = 1;
			let pB = expectedPB;

			const bonus = Number(entry.d20mod);

			switch (entry.context?.type) {
				case "savingThrow": {
					const ability = entry.context.ability;
					const fromAbility = Parser.getAbilityModNumber(mon[ability]);
					pB = bonus - fromAbility;
					expert = (pB === expectedPB * 2) ? 2 : 1;
					break;
				}
				case "skillCheck": {
					const ability = Parser.skillToAbilityAbv(entry.context.skill.toLowerCase().trim());
					const fromAbility = Parser.getAbilityModNumber(mon[ability]);
					pB = bonus - fromAbility;
					expert = (pB === expectedPB * 2) ? 2 : 1;
					break;
				}

				// add proficiency dice stuff for attack rolls, since those _generally_ have proficiency
				// this is not 100% accurate; for example, ghouls don't get their prof bonus on bite attacks
				// fixing this would require additional context, which is not (yet) available in the renderer
				case "hit": break;

				case "initiative":
				case "abilityCheck": return null;

				default: throw new Error(`Unhandled roll context "${entry.context.type}"`);
			}

			const withoutPB = bonus - pB;
			profDiceString = BestiaryPage._addSpacesToDiceExp(`+${expert}d${pB * (3 - expert)}${withoutPB >= 0 ? "+" : ""}${withoutPB}`);

			return {
				toDisplay: `<span class="rd__roller--roll-prof-bonus">${text}</span><span class="rd__roller--roll-prof-dice">${profDiceString}</span>`,
				additionalData: {
					"data-roll-prof-type": "d20",
					"data-roll-prof-dice": profDiceString,
				},
			};
		};

		try {
			Renderer.get().addPlugin("string_@dc", pluginDc);
			Renderer.get().addPlugin("dice", pluginDice);

			this._pgContent.empty().appends(RenderBestiary.getRenderedCreature(mon, {btnScaleCr, btnResetScaleCr, selSummonSpellLevel, selSummonClassLevel, classLevelScalerClass: mon.summonedByClass}));
		} finally {
			Renderer.get().removePlugin("dice", pluginDice);
			Renderer.get().removePlugin("string_@dc", pluginDc);
		}
		// endregion

		this._tokenDisplay.render(mon);
	}

	static _addSpacesToDiceExp (exp) {
		return exp.replace(/([^0-9d])/gi, " $1 ").replace(/\s+/g, " ").trim().replace(/^([-+])\s*/, "$1");
	}

	async _pPreloadSublistSources (json) {
		if (json.l && json.l.items && json.l.sources) { // if it's an encounter file
			json.items = json.l.items;
			json.sources = json.l.sources;
		}
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

	_pOnLoad_initVisibleItemsDisplay (...args) {
		super._pOnLoad_initVisibleItemsDisplay(...arguments);

		this._list.on("updated", () => {
			this._encounterBuilder.resetCache();
		});
	}
}

const bestiaryPage = new BestiaryPage();
window.bestiaryPage = bestiaryPage;
const sublistManager = new BestiarySublistManager();

const encounterBuilderCache = new EncounterBuilderCacheBestiaryPage({bestiaryPage});
const encounterShapesLookup = new EncounterBuilderShapesLookup();
const encounterBuilderComp = new EncounterBuilderComponentBestiary({cache: encounterBuilderCache});
const rulesBaseArgs = {comp: encounterBuilderComp, cache: encounterBuilderCache, encounterShapesLookup};
const rulesClassic = new EncounterBuilderRulesClassic({...rulesBaseArgs});
const rulesOne = new EncounterBuilderRulesOne({...rulesBaseArgs});
const rulesMcdmFleeMortals = new EncounterBuilderRulesMcdmFleeMortals({...rulesBaseArgs});
const encounterBuilder = new EncounterBuilderUiBestiary({
	cache: encounterBuilderCache,
	comp: encounterBuilderComp,
	rulesComps: [
		rulesOne,
		rulesClassic,
		rulesMcdmFleeMortals,
	],
	encounterShapesLookup,
	bestiaryPage,
	sublistManager,
});
const sublistPlugin = new EncounterBuilderSublistPlugin({
	sublistManager,
	encounterBuilder,
	encounterBuilderComp,
});
sublistManager.addPlugin(sublistPlugin);

bestiaryPage.encounterBuilder = encounterBuilder;
bestiaryPage.sublistManager = sublistManager;
encounterBuilder.bestiaryPage = bestiaryPage;
encounterBuilder.sublistManager = sublistManager;
sublistManager.encounterBuilder = encounterBuilder;

window.addEventListener("load", () => bestiaryPage.pOnLoad());

globalThis.dbg_page = bestiaryPage;
