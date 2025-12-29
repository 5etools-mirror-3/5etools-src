import {BuilderBase} from "./makebrew-builder-base.js";
import {BuilderUi} from "./makebrew-builderui.js";
import {AttachedItemTag, CreatureSavingThrowTagger, DamageTypeTag, DragonAgeTag, LanguageTag, MiscTag, RechargeConvert, SenseFilterTag, SpellcastingTraitConvert, SpellcastingTypeTag, TagCreatureSubEntryInto, TagDc, TagHit, TagImmResVulnConditional, TraitActionTag} from "../converter/converterutils-creature.js";
import {DiceConvert, TagCondition} from "../converter/converterutils-tags.js";
import {RenderBestiary} from "../render-bestiary.js";

// TODO(Future) {@tags} added to state in post-processing steps are not visible in their input boxes without refresh. See the spell builder for how this should be implemented.
//  - Same applies for UiUtil.strToInt'd inputs
export class CreatureBuilder extends BuilderBase {
	constructor () {
		super({
			titleSidebarLoadExisting: "Copy Existing Creature",
			titleSidebarDownloadJson: "Download Creatures as JSON",
			metaSidebarDownloadMarkdown: {
				title: "Download Creatures as Markdown",
				pFnGetText: (mons) => {
					return RendererMarkdown.monster.pGetMarkdownDoc(mons);
				},
			},
			prop: "monster",
		});

		this._bestiaryFluffIndex = null;
		this._bestiaryTypeTags = null;

		this._legendaryGroups = null;
		this._selLegendaryGroup = null;
		this._legendaryGroupCache = null;

		// region Indexed template creature actions and traits
		this._jsonCreatureActions = null;
		this._indexedActions = null;

		this._jsonCreatureTraits = null;
		this._indexedTraits = null;
		// endregion

		this._renderOutputDebounced = MiscUtil.debounce(() => this._renderOutput(), 50);

		this._generateAttackCache = null;
	}

	static _getAsMarkdown (mon) {
		return RendererMarkdown.get().render({entries: [{type: "statblockInline", dataType: "monster", data: mon}]});
	}

	async pHandleSidebarLoadExistingClick () {
		const result = await SearchWidget.pGetUserCreatureSearch();
		if (result) {
			const creature = MiscUtil.copy(await DataLoader.pCacheAndGet(result.page, result.source, result.hash));
			return this.pHandleSidebarLoadExistingData(creature);
		}
	}

	/**
	 * @param creature
	 * @param [opts]
	 * @param [opts.isForce]
	 * @param [opts.meta]
	 */
	async pHandleSidebarLoadExistingData (creature, opts) {
		opts = opts || [];

		const cleanOrigin = window.location.origin.replace(/\/+$/, "");

		if (creature.hasToken) {
			creature.token = {
				name: creature.name,
				source: creature.source,
			};
		}

		// Get the fluff based on the original source
		if (this._bestiaryFluffIndex[creature.source] && !creature.fluff) {
			const fluff = await Renderer.monster.pGetFluff(creature);

			if (fluff) creature.fluff = MiscUtil.copy(fluff);
		}

		creature.source = this._ui.source;

		if (creature.soundClip && creature.soundClip.type === "internal") {
			creature.soundClip = {
				type: "external",
				url: `${cleanOrigin}/${Renderer.utils.getEntryMediaUrl(creature, "soundClip", "audio")}`,
			};
		}

		delete creature.otherSources;
		delete creature.srd;
		delete creature.srd52;
		delete creature.basicRules;
		delete creature.basicRules2024;
		delete creature.altArt;
		delete creature.hasToken;
		delete creature.uniqueId;
		delete creature._versions;
		delete creature.reprintedAs;
		if (creature.variant) creature.variant.forEach(ent => delete ent._version);

		// Semi-gracefully handle e.g. ERLW's Steel Defender
		if (creature.passive != null && typeof creature.passive === "string") delete creature.passive;

		const meta = {...(opts.meta || {}), ...this._getInitialMetaState({nameOriginal: creature.name})};

		if (ScaleCreature.isCrInScaleRange(creature) && !opts.isForce) {
			const crDefault = creature.cr.cr || creature.cr;

			const scaleTo = await InputUiUtil.pGetUserScaleCr({
				title: "At Challenge Rating...",
				default: crDefault,
			});

			if (scaleTo != null && scaleTo !== crDefault) {
				const scaled = await ScaleCreature.scale(creature, Parser.crToNumber(scaleTo));
				delete scaled._displayName;
				this.setStateFromLoaded({s: scaled, m: meta});
			} else this.setStateFromLoaded({s: creature, m: meta});
		} else if (creature.summonedBySpellLevel && !opts.isForce) {
			const fauxSel = Renderer.monster.getSelSummonSpellLevel(creature);
			const values = [...fauxSel.options].map(it => it.value === "-1" ? "\u2014" : Number(it.value));
			const scaleTo = await InputUiUtil.pGetUserEnum({values: values, title: "At Spell Level...", default: values[0], isResolveItem: true});

			if (scaleTo != null) {
				const scaled = await ScaleSpellSummonedCreature.scale(creature, scaleTo);
				delete scaled._displayName;
				this.setStateFromLoaded({s: scaled, m: meta});
			} else this.setStateFromLoaded({s: creature, m: meta});
		} else if ((creature.summonedByClass || creature.summonedScaleByPlayerLevel) && !opts.isForce) {
			const fauxSel = Renderer.monster.getSelSummonClassLevel(creature);
			const values = [...fauxSel.options].map(it => it.value === "-1" ? "\u2014" : Number(it.value));
			const scaleTo = await InputUiUtil.pGetUserEnum({values: values, title: creature.summonedByClass ? `At Class Level...` : `At Player Level...`, default: values[0], isResolveItem: true});

			if (scaleTo != null) {
				const scaled = await ScaleClassSummonedCreature.scale(creature, scaleTo);
				delete scaled._displayName;
				this.setStateFromLoaded({s: scaled, m: meta});
			} else this.setStateFromLoaded({s: creature, m: meta});
		} else this.setStateFromLoaded({s: creature, m: meta});

		this.renderInput();
		this.renderOutput();
	}

	async _pHashChange_pHandleSubHashes (sub, toLoad) {
		if (!sub.length) return super._pHashChange_pHandleSubHashes(sub, toLoad);

		const scaledHash = sub.find(it => it.startsWith(UrlUtil.HASH_START_CREATURE_SCALED));
		const scaledSpellSummonHash = sub.find(it => it.startsWith(UrlUtil.HASH_START_CREATURE_SCALED_SPELL_SUMMON));
		const scaledClassSummonHash = sub.find(it => it.startsWith(UrlUtil.HASH_START_CREATURE_SCALED_CLASS_SUMMON));

		if (
			!scaledHash
			&& !scaledSpellSummonHash
			&& !scaledClassSummonHash
		) return super._pHashChange_pHandleSubHashes(sub, toLoad);

		if (scaledHash) {
			const scaleTo = Number(UrlUtil.unpackSubHash(scaledHash)[VeCt.HASH_SCALED][0]);
			try {
				toLoad = await ScaleCreature.scale(toLoad, scaleTo);
				delete toLoad._displayName;
			} catch (e) {
				setTimeout(() => { throw e; });
			}
		} else if (scaledSpellSummonHash) {
			const scaleTo = Number(UrlUtil.unpackSubHash(scaledSpellSummonHash)[VeCt.HASH_SCALED_SPELL_SUMMON][0]);
			try {
				toLoad = await ScaleSpellSummonedCreature.scale(toLoad, scaleTo);
				delete toLoad._displayName;
			} catch (e) {
				setTimeout(() => { throw e; });
			}
		} else if (scaledClassSummonHash) {
			const scaleTo = Number(UrlUtil.unpackSubHash(scaledClassSummonHash)[VeCt.HASH_SCALED_CLASS_SUMMON][0]);
			try {
				toLoad = await ScaleClassSummonedCreature.scale(toLoad, scaleTo);
				delete toLoad._displayName;
			} catch (e) {
				setTimeout(() => { throw e; });
			}
		}

		return {
			isAllowEditExisting: false,
			toLoad,
		};
	}

	async _pInit () {
		const [bestiaryFluffIndex, jsonCreature, items] = await Promise.all([
			DataUtil.loadJSON("data/bestiary/fluff-index.json"),
			DataUtil.loadJSON("data/makebrew-creature.json"),
			Renderer.item.pBuildList(),
			DataUtil.monster.pPreloadLegendaryGroups(),
		]);

		this._bestiaryFluffIndex = bestiaryFluffIndex;

		MiscTag.init({items});
		AttachedItemTag.init({items});

		await this._pBuildLegendaryGroupCache();

		this._jsonCreatureTraits = [
			...jsonCreature.makebrewCreatureTrait,
			...((await PrereleaseUtil.pGetBrewProcessed()).makebrewCreatureTrait || []),
			...((await BrewUtil2.pGetBrewProcessed()).makebrewCreatureTrait || []),
		];
		this._indexedTraits = elasticlunr(function () {
			this.addField("n");
			this.setRef("id");
		});
		SearchUtil.removeStemmer(this._indexedTraits);
		this._jsonCreatureTraits.forEach((it, i) => this._indexedTraits.addDoc({
			n: it.name,
			id: i,
		}));

		this._jsonCreatureActions = [
			...items
				.filter(it => !it._isItemGroup && it._category === "Basic" && it.type && [Parser.ITM_TYP_ABV__MELEE_WEAPON, Parser.ITM_TYP_ABV__RANGED_WEAPON].includes(DataUtil.itemType.unpackUid(it.type).abbreviation) && it.dmg1 && it.dmgType)
				.map(item => {
					const mDice = /^(?<count>\d+)d(?<face>\d+)\b/i.exec(item.dmg1);
					if (!mDice) return null;

					const itemTypeAbv = DataUtil.itemType.unpackUid(item.type).abbreviation;
					const abil = itemTypeAbv === Parser.ITM_TYP_ABV__MELEE_WEAPON ? "str" : "dex";
					const ptAtk = `${itemTypeAbv === Parser.ITM_TYP_ABV__MELEE_WEAPON ? "m" : "r"}w${itemTypeAbv === Parser.ITM_TYP_ABV__MELEE_WEAPON && item.range ? `,rw` : ""}`;
					const ptRange = item.range
						? `${itemTypeAbv === Parser.ITM_TYP_ABV__MELEE_WEAPON ? `reach 5 ft. or ` : ""}range ${item.range} ft.`
						: "reach 5 ft.";
					const dmgAvg = Number(mDice.groups.count) * ((Number(mDice.groups.face) + 1) / 2);
					const isFinesse = (item?.property || []).some(property => DataUtil.itemProperty.unpackUid(property?.uid || property).abbreviation === Parser.ITM_PROP_ABV__FINESSE);

					return {
						name: item.name,
						entries: [
							`{@atk ${ptAtk}} {@hit <$to_hit__${abil}$>} to hit, ${ptRange}, one target. {@h}<$damage_avg__(size_mult*${dmgAvg})+${abil}$> ({@damage <$size_mult__${mDice.groups.count}$>d${mDice.groups.face}<$damage_mod__${abil}$>}) ${Parser.dmgTypeToFull(item.dmgType)} damage.`,
						],
						entriesFinesse: isFinesse ? [
							`{@atk ${ptAtk}} {@hit <$to_hit__dex$>} to hit, ${ptRange}, one target. {@h}<$damage_avg__(size_mult*${dmgAvg})+dex$> ({@damage <$size_mult__${mDice.groups.count}$>d${mDice.groups.face}<$damage_mod__dex$>}) ${Parser.dmgTypeToFull(item.dmgType)} damage.`,
						] : null,
					};
				})
				.filter(Boolean),
			...jsonCreature.makebrewCreatureAction,
			...((await PrereleaseUtil.pGetBrewProcessed()).makebrewCreatureAction || []),
			...((await BrewUtil2.pGetBrewProcessed()).makebrewCreatureAction || []),
		];
		this._indexedActions = elasticlunr(function () {
			this.addField("n");
			this.setRef("id");
		});
		SearchUtil.removeStemmer(this._indexedActions);
		this._jsonCreatureActions.forEach((it, i) => this._indexedActions.addDoc({
			n: it.name,
			id: i,
		}));

		// Load this asynchronously, to avoid blocking the page load
		this._bestiaryTypeTags = [];
		const allTypes = new Set();
		DataUtil.monster.pLoadAll().then(mons => {
			mons.forEach(mon => mon.type && mon.type.tags ? mon.type.tags.forEach(tp => allTypes.add(tp.tag || tp)) : "");
			this._bestiaryTypeTags.push(...allTypes);
		});
	}

	_getInitialState () {
		return {
			...super._getInitialState(),
			name: "New Creature",
			size: [
				"M",
			],
			type: "aberration",
			source: this._ui ? this._ui.source : "",
			alignment: ["N"],
			ac: [10],
			hp: {average: 4, formula: "1d8"},
			speed: {walk: 30},
			str: 10,
			dex: 10,
			con: 10,
			int: 10,
			wis: 10,
			cha: 10,
			passive: 10,
			cr: "0",
		};
	}

	setStateFromLoaded (state) {
		if (!state?.s || !state?.m) return;

		// TODO validate state

		this._doResetProxies();

		if (!state.s.uniqueId) state.s.uniqueId = CryptUtil.uid();

		// clean old language/sense formats
		if (state.s.languages && !(state.s.languages instanceof Array)) state.s.languages = [state.s.languages];
		if (state.s.senses && !(state.s.senses instanceof Array)) state.s.senses = [state.s.senses];

		this.__state = state.s;
		this.__meta = state.m;

		// auto-set proficiency toggles (1 = proficient; 2 = expert)
		if (!state.m.profSave) {
			state.m.profSave = {};
			if (state.s.save) {
				const pb = this._getProfBonus();
				Object.entries(state.s.save).forEach(([prop, val]) => {
					const expected = Parser.getAbilityModNumber(Renderer.monster.getSafeAbilityScore(this._state, prop, {defaultScore: 10})) + pb;
					if (Number(val) === Number(expected)) state.m.profSave[prop] = 1;
				});
			}
		}
		if (!state.m.profSkill) {
			state.m.profSkill = {};
			if (state.s.skill) {
				const pb = this._getProfBonus();
				Object.entries(state.s.skill).forEach(([prop, val]) => {
					const abilProp = Parser.skillToAbilityAbv(prop);
					const abilMod = Parser.getAbilityModNumber(Renderer.monster.getSafeAbilityScore(this._state, abilProp, {defaultScore: 10}));

					const expectedProf = abilMod + pb;
					if (Number(val) === Number(expectedProf)) return state.m.profSkill[prop] = 1;

					const expectedExpert = abilMod + 2 * pb;
					if (Number(val) === Number(expectedExpert)) state.m.profSkill[prop] = 2;
				});
			}
		}

		// other fields which don't fall under proficiency
		if (!state.m.autoCalc) {
			state.m.autoCalc = {
				proficiency: true,
			};

			// hit points
			if (state.s.hp.formula && state.s.hp.average != null) {
				const expected = Math.floor(Renderer.dice.parseAverage(state.s.hp.formula));
				state.m.autoCalc.hpAverageSimple = expected === state.s.hp.average;
				state.m.autoCalc.hpAverageComplex = state.m.autoCalc.hpAverageSimple;

				const parts = CreatureBuilder.__getHpInput__getFormulaParts(state.s.hp.formula);
				if (parts) {
					const mod = Parser.getAbilityModNumber(this.__state.con);
					const expected = mod * parts.hdNum;
					if (expected === (parts.mod || 0)) state.m.autoCalc.hpModifier = true;
				}
			} else {
				// enable auto-calc for "Special" HP types; hidden until mode switch
				state.m.autoCalc.hpAverage = true;
				state.m.autoCalc.hpModifier = true;
			}

			// passive perception
			const expectedPassive = (state.s.skill && state.s.skill.perception ? Number(state.s.skill.perception) : Parser.getAbilityModNumber(this.__state.wis)) + 10;
			if (state.s.passive && expectedPassive === state.s.passive) state.m.autoCalc.passivePerception = true;
		}

		this.doUiSave();
	}

	_reset_mutNextMetaState ({metaNext}) {
		if (!metaNext) return;
		metaNext.autoCalc = MiscUtil.copy(this._meta?.autoCalc || {});
	}

	doHandleSourcesAdd () {
		(this._eles.selVariantSources || []).map(sel => {
			const currSrcJson = sel.val();
			sel.empty().appends(`<option value="">(Same as Creature)</option>`);
			this._ui.allSources.forEach(srcJson => sel.appends(`<option value="${srcJson.escapeQuotes()}">${Parser.sourceJsonToFull(srcJson).escapeQuotes()}</option>`));

			if (this._ui.allSources.indexOf(currSrcJson)) sel.val(currSrcJson);
			else sel[0].selectedIndex = 0;

			return sel;
		}).forEach(sel => sel.trigger("change"));
	}

	_renderInputImpl () {
		this._validateMeta();
		this.doCreateProxies();
		this.renderInputControls();
		this._renderInputMain();
	}

	_validateMeta () {
		// ensure expected objects exist
		const setOn = this._meta || this.__meta;
		if (!setOn.profSave) setOn.profSave = {};
		if (!setOn.profSkill) setOn.profSkill = {};
		if (!setOn.autoCalc) setOn.autoCalc = {};
	}

	_renderInputMain () {
		this._sourcesCache = MiscUtil.copy(this._ui.allSources);
		const wrp = this._ui.wrpInput.empty();

		const _cb = () => {
			// Prefer numerical pages if possible
			if (!isNaN(this._state.page)) this._state.page = Number(this._state.page);

			Renderer.monster.updateParsed(this._state);

			// do post-processing
			DiceConvert.cleanHpDice(this._state);
			TagCreatureSubEntryInto.tryRun(this._state);
			TagHit.tryTagHits(this._state);
			TagDc.tryTagDcs(this._state);
			TagCondition.tryTagConditions(this._state, {isTagInflicted: true, styleHint: this._meta.styleHint});
			TraitActionTag.tryRun(this._state);
			LanguageTag.tryRun(this._state);
			SenseFilterTag.tryRun(this._state);
			SpellcastingTypeTag.tryRun(this._state);
			DamageTypeTag.tryRun(this._state);
			DamageTypeTag.tryRunSpells(this._state);
			DamageTypeTag.tryRunRegionalsLairs(this._state);
			CreatureSavingThrowTagger.tryRun(this._state);
			CreatureSavingThrowTagger.tryRunSpells(this._state);
			CreatureSavingThrowTagger.tryRunRegionalsLairs(this._state);
			MiscTag.tryRun(this._state);
			TagImmResVulnConditional.tryRun(this._state);
			DragonAgeTag.tryRun(this._state);
			AttachedItemTag.tryRun(this._state);

			this.renderOutput();
			this.doUiSave();
			this._meta.isModified = true;
		};
		const cb = MiscUtil.debounce(_cb, 33);
		this._cbCache = cb; // cache for use when updating sources

		// initialise tabs
		this._resetTabs({tabGroup: "input"});

		const tabs = this._renderTabs(
			[
				new TabUiUtil.TabMeta({name: "Info", hasBorder: true}),
				new TabUiUtil.TabMeta({name: "Species", hasBorder: true}),
				new TabUiUtil.TabMeta({name: "Core", hasBorder: true}),
				new TabUiUtil.TabMeta({name: "Defenses", hasBorder: true}),
				new TabUiUtil.TabMeta({name: "Abilities", hasBorder: true}),
				new TabUiUtil.TabMeta({name: "Flavor/Misc", hasBorder: true}),
			],
			{
				tabGroup: "input",
				cbTabChange: this.doUiSave.bind(this),
			},
		);
		const [infoTab, speciesTab, coreTab, defenseTab, abilTab, miscTab] = tabs;
		ee`<div class="ve-flex-v-center w-100 no-shrink ui-tab__wrp-tab-heads--border">${tabs.map(it => it.btnTab)}</div>`.appendTo(wrp);
		tabs.forEach(it => it.wrpTab.appendTo(wrp));

		// INFO
		BuilderUi.getStateIptString("Name", cb, this._state, {nullable: false, callback: () => this.pRenderSideMenu()}, "name").appendTo(infoTab.wrpTab);
		this.__getShortNameInput(cb).appendTo(infoTab.wrpTab);
		this._selSource = this.getSourceInput(cb).appendTo(infoTab.wrpTab);
		BuilderUi.getStateIptString("Page", cb, this._state, {}, "page").appendTo(infoTab.wrpTab);
		this.__getAlignmentPrefixInput(cb).appendTo(infoTab.wrpTab);
		this.__getAlignmentInput(cb).appendTo(infoTab.wrpTab);
		this.__getCrInput(cb).appendTo(infoTab.wrpTab);
		this.__getProfNoteInput(cb).appendTo(infoTab.wrpTab);
		this.__getProfBonusInput(cb).appendTo(infoTab.wrpTab);
		BuilderUi.getStateIptNumber("Level", cb, this._state, {title: "Used for Sidekicks only"}, "level").appendTo(infoTab.wrpTab);

		// SPECIES
		this.__getSizeInput(cb).appendTo(speciesTab.wrpTab);
		this.__getTypeInput(cb).appendTo(speciesTab.wrpTab);
		this.__getSpeedInput(cb).appendTo(speciesTab.wrpTab);
		this.__getSenseInput(cb).appendTo(speciesTab.wrpTab);
		this.__getLanguageInput(cb).appendTo(speciesTab.wrpTab);

		// CORE
		this.__getAbilityScoreInput(cb).appendTo(coreTab.wrpTab);
		this.__getSaveInput(cb).appendTo(coreTab.wrpTab);
		this.__getSkillInput(cb).appendTo(coreTab.wrpTab);
		this.__getPassivePerceptionInput(cb).appendTo(coreTab.wrpTab);

		// DEFENSE
		this.__getAcInput(cb).appendTo(defenseTab.wrpTab);
		this.__getHpInput(cb).appendTo(defenseTab.wrpTab);
		this.__getVulnerableInput(cb).appendTo(defenseTab.wrpTab);
		this.__getResistInput(cb).appendTo(defenseTab.wrpTab);
		this.__getImmuneInput(cb).appendTo(defenseTab.wrpTab);
		this.__getCondImmuneInput(cb).appendTo(defenseTab.wrpTab);

		// ABILITIES
		this.__getSpellcastingInput(cb).appendTo(abilTab.wrpTab);
		this.__getTraitInput(cb).appendTo(abilTab.wrpTab);
		BuilderUi.getStateIptEntries("Actions Intro", cb, this._state, {}, "actionHeader").appendTo(abilTab.wrpTab);
		this.__getActionInput(cb).appendTo(abilTab.wrpTab);
		BuilderUi.getStateIptEntries("Bonus Actions Intro", cb, this._state, {}, "bonusHeader").appendTo(abilTab.wrpTab);
		this.__getBonusActionInput(cb).appendTo(abilTab.wrpTab);
		BuilderUi.getStateIptEntries("Reactions Intro", cb, this._state, {}, "reactionHeader").appendTo(abilTab.wrpTab);
		this.__getReactionInput(cb).appendTo(abilTab.wrpTab);
		BuilderUi.getStateIptNumber(
			"Legendary Action Count",
			cb,
			this._state,
			{
				title: "If specified, this will override the default number (3) of legendary actions available for the creature.",
				placeholder: "If left blank, defaults to 3.",
			},
			"legendaryActions",
		).appendTo(abilTab.wrpTab);
		BuilderUi.getStateIptNumber(
			"Legendary Action (Lair) Count",
			cb,
			this._state,
			{
				title: "If specified, this will override the default number (3) of legendary actions available for the creature when in its lair.",
			},
			"legendaryActionsLair",
		).appendTo(abilTab.wrpTab);
		BuilderUi.getStateIptBoolean(
			"Name is Proper Noun",
			cb,
			this._state,
			{
				title: "If selected, the legendary action intro text for this creature will be formatted as though the creature's name is a proper noun (e.g. 'Tiamat can take...' vs 'The dragon can take...').",
			},
			"isNamedCreature",
		).appendTo(abilTab.wrpTab);
		BuilderUi.getStateIptEntries(
			"Legendary Action Intro",
			cb,
			this._state,
			{
				title: "If specified, this custom legendary action intro text will override the default.",
				placeholder: "If left blank, defaults to a generic intro.",
			},
			"legendaryHeader",
		).appendTo(abilTab.wrpTab);
		this.__getLegendaryActionInput(cb).appendTo(abilTab.wrpTab);
		this.__getLegendaryGroupInput(cb).appendTo(abilTab.wrpTab);
		BuilderUi.getStateIptEntries("Mythic Action Intro", cb, this._state, {}, "mythicHeader").appendTo(abilTab.wrpTab);
		this.__getMythicActionInput(cb).appendTo(abilTab.wrpTab);
		this.__getVariantInput(cb).appendTo(abilTab.wrpTab);

		// FLAVOR/MISC
		this.__getTokenInput(cb).appendTo(miscTab.wrpTab);
		this.getFluffInput(cb).appendTo(miscTab.wrpTab);
		this.__getEnvironmentInput(cb).appendTo(miscTab.wrpTab);
		BuilderUi.getStateIptStringArray(
			"Group",
			cb,
			this._state,
			{
				shortName: "Group",
				title: "The family this creature belongs to, e.g. 'Modrons' in the case of a Duodrone.",
			},
			"group",
		).appendTo(miscTab.wrpTab);
		this.__getSoundClipInput(cb).appendTo(miscTab.wrpTab);
		BuilderUi.getStateIptEnum(
			"Dragon Casting Color",
			cb,
			this._state,
			{
				vals: Renderer.monster.dragonCasterVariant.getAvailableColors()
					.sort(SortUtil.ascSortLower),
				fnDisplay: (abv) => abv.toTitleCase(),
				type: "string",
			},
			"dragonCastingColor",
		).appendTo(miscTab.wrpTab);
		BuilderUi.getStateIptBoolean("NPC", cb, this._state, {title: "If selected, this creature will be filtered out from the Bestiary list by default."}, "isNpc").appendTo(miscTab.wrpTab);
		BuilderUi.getStateIptBoolean("Familiar", cb, this._state, {title: "If selected, this creature will be included when filtering for 'Familiar' in the Bestiary."}, "familiar").appendTo(miscTab.wrpTab);
		BuilderUi.getStateIptStringArray(
			"Search Aliases",
			cb,
			this._state,
			{
				shortName: "Alias",
				title: "Alternate names for this creature, e.g. 'Illithid' as an alternative for 'Mind Flayer,' which can be searched in the Bestiary.",
			},
			"alias",
		).appendTo(miscTab.wrpTab);

		// excluded fields:
		// - otherSources: requires meta support
	}

	__getSizeInput (cb) {
		const [row, rowInner] = BuilderUi.getLabelledRowTuple("Size", {isMarked: true});

		const initial = this._state.size;

		const setState = () => {
			this._state.size = rows.map(it => it.selSize.val()).unique();
			cb();
		};

		const rows = [];

		const btnAddSize = ee`<button class="ve-btn ve-btn-xs ve-btn-default">Add Size</button>`
			.onn("click", () => {
				const tagRow = this.__getSizeInput__getSizeRow(null, rows, setState);
				wrpTagRows.appends(tagRow.wrp);
				cb();
			});

		const initialSizeRows = (initial ? [initial].flat() : [Parser.SZ_MEDIUM]).map(tag => this.__getSizeInput__getSizeRow(tag, rows, setState));

		const wrpTagRows = ee`<div>${initialSizeRows ? initialSizeRows.map(it => it.wrp) : ""}</div>`;
		ee`<div>
		${wrpTagRows}
		<div>${btnAddSize}</div>
		</div>`.appendTo(rowInner);

		return row;
	}

	__getSizeInput__getSizeRow (size, sizeRows, setState) {
		const selSize = ee`<select class="form-control input-xs">
			${Parser.SIZE_ABVS.map(sz => `<option value="${sz}">${Parser.sizeAbvToFull(sz)}</option>`)}
		</select>`
			.val(size || Parser.SZ_MEDIUM)
			.onn("change", () => {
				setState();
			});

		const out = {selSize};

		const wrpBtnRemove = ee`<div class="ve-flex"></div>`;
		const wrp = ee`<div class="ve-flex-v-center mkbru__wrp-rows--removable mb-2">${selSize}${wrpBtnRemove}</div>`;
		this.constructor.getBtnRemoveRow(setState, sizeRows, out, wrp, "Size", {isProtectLast: true}).appendTo(wrpBtnRemove).addClass("ml-2");

		out.wrp = wrp;
		sizeRows.push(out);
		return out;
	}

	__getTypeInput (cb) {
		const [row, rowInner] = BuilderUi.getLabelledRowTuple("Type", {isMarked: true});

		const initial = this._state.type;
		const initialSwarm = !!initial.swarmSize;

		const setState = () => {
			const types = chooseTypeRows
				.map(rowMeta => rowMeta.cbGetType());

			const isSwarm = selMode.val() === "1";

			const validTags = tagRows
				.map(tr => {
					const prefix = tr.iptPrefix.val().trim();
					const tag = tr.iptTag.val().trim();
					if (!tag) return null;
					if (prefix) return {tag, prefix};
					return tag;
				})
				.filter(Boolean);

			const note = iptNote.val().trim();

			if (types.length === 1 && !isSwarm && !validTags.length && !note) {
				this._state.type = types[0];
				cb();
				return;
			}

			const out = {
				type: types.length === 1
					? types[0]
					: {choose: types},
			};

			if (isSwarm) out.swarmSize = selSwarmSize.val();
			if (validTags.length) out.tags = validTags;
			if (note) out.note = note;

			this._state.type = out;

			cb();
		};

		const selMode = ee`<select class="form-control input-xs mb-2">
			<option value="0">Creature</option>
			<option value="1">Swarm</option>
		</select>`.val(initialSwarm ? "1" : "0").onn("change", () => {
				switch (selMode.val()) {
					case "0": {
						stageSwarm.hideVe();
						setState();
						break;
					}
					case "1": {
						stageSwarm.showVe();
						setState();
						break;
					}
				}
			}).appendTo(rowInner);

		// region CHOOSE-FROM TYPE CONTROLS
		const chooseTypeRows = [];

		const btnAddChooseType = ee`<button class="ve-btn ve-btn-xs ve-btn-default">Add Type</button>`
			.onn("click", () => {
				const metaTypeRow = this.__getTypeInput__getChooseTypeRow(null, chooseTypeRows, setState);
				wrpChooseTypeRows.appends(metaTypeRow.wrp);
			});

		const initialChooseTypeRowsMetas = initial.type?.choose
			? initial.type.choose.map(type => this.__getTypeInput__getChooseTypeRow(type, chooseTypeRows, setState))
			: [this.__getTypeInput__getChooseTypeRow(initial.type || initial, chooseTypeRows, setState)];

		const wrpChooseTypeRows = ee`<div>${initialChooseTypeRowsMetas.map(it => it.wrp)}</div>`;
		const stageType = ee`<div class="mt-2">
		${wrpChooseTypeRows}
		<div>${btnAddChooseType}</div>
		</div>`.appendTo(rowInner);
		// endregion

		// region TAG CONTROLS
		const tagRows = [];

		const btnAddTag = ee`<button class="ve-btn ve-btn-xs ve-btn-default">Add Tag</button>`
			.onn("click", () => {
				const tagRow = this.__getTypeInput__getTagRow(null, tagRows, setState);
				wrpTagRows.appends(tagRow.wrp);
			});

		const initialTagRows = initial.tags ? initial.tags.map(tag => this.__getTypeInput__getTagRow(tag, tagRows, setState)) : null;

		const wrpTagRows = ee`<div>${initialTagRows ? initialTagRows.map(it => it.wrp) : ""}</div>`;
		const stageTags = ee`<div class="mt-2">
		${wrpTagRows}
		<div>${btnAddTag}</div>
		</div>`.appendTo(rowInner);
		// endregion

		// region SWARM CONTROLS
		const selSwarmSize = ee`<select class="form-control input-xs mt-2">${Parser.SIZE_ABVS.map(sz => `<option value="${sz}">${Parser.sizeAbvToFull(sz)}</option>`).join("")}</select>`
			.onn("change", () => {
				this._state.type.swarmSize = selSwarmSize.val();
				cb();
			});
		const stageSwarm = ee`<div>
		${selSwarmSize}
		</div>`.appendTo(rowInner).toggleVe(initialSwarm);
		initialSwarm && selSwarmSize.val(initial.swarmSize);
		// endregion

		// region NOTE CONTROLS
		const iptNote = ee`<input class="form-control input-xs form-control--minimal mr-2" placeholder="Note">`
			.val(initial.note || "")
			.onn("change", () => {
				setState();
			});
		ee`<div class="ve-flex-v-center mb-2"><span class="mr-2 mkbru__sub-name--33">Type Note</span>${iptNote}</div>`
			.appendTo(rowInner);
		// endregion

		return row;
	}

	__getTypeInput__getChooseTypeRow (type, chooseTypeRows, setState) {
		const isInitialCustom = type && !Parser.MON_TYPES.includes(type);

		const selType = ee`<select class="form-control input-xs mr-2">${Parser.MON_TYPES.map(tp => `<option value="${tp}">${tp.uppercaseFirst()}</option>`).join("")}</select>`
			.onn("change", () => {
				setState();
			});
		if (!isInitialCustom) selType.val(type || Parser.TP_HUMANOID);

		const iptTypeCustom = ee`<input class="form-control input-xs form-control--minimal mr-2" placeholder="Custom Type">`
			.onn("change", () => {
				setState();
			});
		if (isInitialCustom) selType.val(type || "");

		const cbIsCustomType = ee`<input type="checkbox">`
			.onn("change", () => {
				renderIsCustom();
				setState();
			})
			.prop("checked", !!isInitialCustom);

		const renderIsCustom = () => {
			const isChecked = cbIsCustomType.prop("checked");
			iptTypeCustom.toggleVe(isChecked);
			selType.toggleVe(!isChecked);
		};

		renderIsCustom();

		const cbGetType = () => {
			if (cbIsCustomType.prop("checked")) return iptTypeCustom.val();
			return selType.val();
		};

		const btnRemove = ee`<button class="ve-btn ve-btn-xs ve-btn-danger" title="Remove Row"><span class="glyphicon glyphicon-trash"></span></button>`
			.onn("click", () => {
				chooseTypeRows.splice(chooseTypeRows.indexOf(out), 1);
				wrp.empty().remove();
				setState();
			});

		const wrp = ee`<div class="ve-flex mb-2">
			${selType}
			${iptTypeCustom}
			<label class="ve-flex-v-center mr-2">
				<span class="mr-2">Custom</span>
				${cbIsCustomType}
			</label>
			${btnRemove}
		</div>`;
		const out = {wrp, cbGetType};
		chooseTypeRows.push(out);
		return out;
	}

	__getTypeInput__getTagRow (tag, tagRows, setState) {
		const iptPrefix = ee`<input class="form-control input-xs form-control--minimal mr-2" placeholder="Prefix">`
			.onn("change", () => {
				iptTag.removeClass("form-control--error");
				if (iptTag.val().trim().length || !iptPrefix.val().trim().length) setState();
				else iptTag.addClass("form-control--error");
			});
		if (tag && tag.prefix) iptPrefix.val(tag.prefix);
		const iptTag = ee`<input class="form-control input-xs form-control--minimal mr-2" placeholder="Tag (lowercase)">`
			.onn("change", () => {
				iptTag.removeClass("form-control--error");
				setState();
			});
		if (tag) iptTag.val(tag.tag || tag);
		const btnAddGeneric = ee`<button class="ve-btn ve-btn-xs ve-btn-default mr-2">Add Tag...</button>`
			.onn("click", async () => {
				const tag = await InputUiUtil.pGetUserString({
					title: "Enter a Tag",
					autocomplete: this._bestiaryTypeTags,
				});

				if (tag != null) {
					iptTag.val(tag);
					setState();
				}
			});
		const btnRemove = ee`<button class="ve-btn ve-btn-xs ve-btn-danger" title="Remove Row"><span class="glyphicon glyphicon-trash"></span></button>`
			.onn("click", () => {
				tagRows.splice(tagRows.indexOf(out), 1);
				wrp.empty().remove();
				setState();
			});
		const wrp = ee`<div class="ve-flex mb-2">${iptPrefix}${iptTag}${btnAddGeneric}${btnRemove}</div>`;
		const out = {wrp, iptPrefix, iptTag};
		tagRows.push(out);
		return out;
	}

	__getShortNameInput (cb) {
		const [row, rowInner] = BuilderUi.getLabelledRowTuple("Short Name", {isMarked: true, title: "If not supplied, this will be generated from the creature's full name. Used in Legendary Action header text."});

		const initialMode = this._state.shortName === true ? "1" : "0";

		const setState = mode => {
			switch (mode) {
				case 0: {
					const val = iptCustom.val().trim();
					if (val) this._state.shortName = val;
					else delete this._state.shortName;
					break;
				}
				case 1: {
					if (cbFullName.prop("checked")) this._state.shortName = true;
					else delete this._state.shortName;
					break;
				}
			}
			cb();
		};

		const selMode = ee`<select class="form-control input-xs mb-2">
			<option value="0">Custom</option>
			<option value="1">Use Full Name</option>
		</select>`
			.onn("change", () => {
				switch (selMode.val()) {
					case "0": {
						stageCustom.showVe(); stageMatchesName.hideVe();
						setState(0);
						break;
					}
					case "1": {
						stageCustom.hideVe(); stageMatchesName.showVe();
						setState(1);
						break;
					}
				}
			})
			.appendTo(rowInner)
			.val(initialMode);

		const iptCustom = ee`<input class="form-control form-control--minimal input-xs">`
			.onn("change", () => setState(0))
			.val(this._state.shortName && this._state.shortName !== true ? this._state.shortName : null);
		const stageCustom = ee`<div>${iptCustom}</div>`
			.toggleVe(initialMode === "0")
			.appendTo(rowInner);

		const cbFullName = ee`<input type="checkbox">`
			.onn("change", () => setState(1))
			.prop("checked", this._state.shortName === true);
		const stageMatchesName = ee`<label class="ve-flex-v-center"><div class="mr-2">Enabled</div>${cbFullName}</label>`
			.toggleVe(initialMode === "1")
			.appendTo(rowInner);

		return row;
	}

	__getAlignmentPrefixInput (cb) {
		const [row, rowInner] = BuilderUi.getLabelledRowTuple("Alignment Prefix", {title: `An additional prefix to display before alignment, for example "Typically ".`});

		const ipt = ee`<input class="form-control form-control--minimal input-xs mr-2">`
			.val(this._state.alignmentPrefix || "")
			.onn("change", () => {
				const val = ipt.val();
				if (val) this._state.alignmentPrefix = val;
				else delete this._state.alignmentPrefix;
				cb();
			});

		ee`<div class="ve-flex-v-center">${ipt}</div>`.appendTo(rowInner);

		return row;
	}

	__getAlignmentInput (cb) {
		const [row, rowInner] = BuilderUi.getLabelledRowTuple("Alignment", {isMarked: true});

		const doUpdateState = () => {
			const raw = alignmentRows.map(row => row.getAlignment());
			if (raw.some(it => it && (it.special != null || it.alignment !== undefined)) || raw.length > 1) {
				this._state.alignment = raw.map(it => {
					if (it && (it.special != null || it.alignment)) return it;
					else return {alignment: it};
				});
			} else this._state.alignment = raw[0];
			cb();
		};

		const alignmentRows = [];

		const wrpRows = ee`<div></div>`.appendTo(rowInner);

		if ((this._state.alignment && this._state.alignment.some(it => it && (it.special != null || it.alignment !== undefined))) || !~CreatureBuilder.__getAlignmentInput__getAlignmentIx(this._state.alignment)) {
			this._state.alignment.forEach(alignment => CreatureBuilder.__getAlignmentInput__getAlignmentRow(doUpdateState, alignmentRows, alignment).wrp.appendTo(wrpRows));
		} else {
			CreatureBuilder.__getAlignmentInput__getAlignmentRow(doUpdateState, alignmentRows, this._state.alignment).wrp.appendTo(wrpRows);
		}

		const wrpBtnAdd = ee`<div></div>`.appendTo(rowInner);
		ee`<button class="ve-btn ve-btn-xs ve-btn-default">Add Alignment</button>`
			.appendTo(wrpBtnAdd)
			.onn("click", () => {
				CreatureBuilder.__getAlignmentInput__getAlignmentRow(doUpdateState, alignmentRows).wrp.appendTo(wrpRows);
				doUpdateState();
			});

		return row;
	}

	static __getAlignmentInput__getAlignmentRow (doUpdateState, alignmentRows, alignment) {
		const initialMode = alignment && alignment.chance ? "1" : alignment && alignment.special ? "2" : (alignment === null || (alignment && alignment.alignment === null)) ? "3" : "0";

		const getAlignment = () => {
			switch (selMode.val()) {
				case "0": {
					return [...CreatureBuilder._ALIGNMENTS[selAlign.val()]];
				}
				case "1": {
					const out = {alignment: [...CreatureBuilder._ALIGNMENTS[selAlign.val()]]};
					if (iptChance.val().trim()) out.chance = UiUtil.strToInt(iptChance.val(), 0, {min: 0, max: 100});
					if (iptNote.val().trim()) out.note = iptNote.val().trim();
					return out;
				}
				case "2": {
					const specials = iptSpecial.val().trim().split(",").map(it => it.trim()).filter(Boolean);
					return specials.length ? specials.map(it => ({special: it})) : {special: ""};
				}
				case "3": {
					return null;
				}
			}
		};

		const selMode = ee`<select class="form-control input-xs mb-2">
				<option value="0">Basic Alignment</option>
				<option value="1">Chance-Based Alignment/Alignment with Note</option>
				<option value="2">Special Alignment</option>
				<option value="3">No Alignment (Sidekick)</option>
			</select>`.val(initialMode).onn("change", () => {
				switch (selMode.val()) {
					case "0": {
						stageSingle.showVe(); stageMultiple.hideVe(); stageSpecial.hideVe();
						doUpdateState();
						break;
					}
					case "1": {
						stageSingle.showVe(); stageMultiple.showVe(); stageSpecial.hideVe();
						doUpdateState();
						break;
					}
					case "2": {
						stageSingle.hideVe(); stageMultiple.hideVe(); stageSpecial.showVe();
						doUpdateState();
						break;
					}
					case "3": {
						stageSingle.hideVe(); stageMultiple.hideVe(); stageSpecial.hideVe();
						doUpdateState();
						break;
					}
				}
			});

		// SINGLE CONTROLS ("multiple" also uses these)
		const selAlign = ee`<select class="form-control input-xs mb-2">${CreatureBuilder._ALIGNMENTS.map((it, i) => it ? `<option value="${i}">${Parser.alignmentListToFull(it).toTitleCase()}</option>` : `<option disabled>\u2014</option>`).join("")}</select>`
			.onn("change", () => doUpdateState());
		const stageSingle = ee`<div>${selAlign}</div>`.toggleVe(initialMode === "0" || initialMode === "1");
		initialMode === "0" && alignment && selAlign.val(`${CreatureBuilder.__getAlignmentInput__getAlignmentIx(alignment.alignment || alignment)}`);
		initialMode === "1" && alignment && selAlign.val(`${CreatureBuilder.__getAlignmentInput__getAlignmentIx(alignment.alignment)}`);

		// MULTIPLE CONTROLS
		const iptChance = ee`<input class="form-control form-control--minimal input-xs mr-2" min="1" max="100" placeholder="Chance of alignment">`
			.onn("change", () => doUpdateState());
		const iptNote = ee`<input class="form-control form-control--minimal input-xs mx-1" placeholder="Alignment note">`
			.onn("change", () => doUpdateState());
		const stageMultiple = ee`<div class="ve-flex-col">
			<div class="mb-2 ve-flex-v-center">${iptChance}<span>%</span></div>
			<div class="mb-2 ve-flex-v-center"><span>(</span>${iptNote}<span>)</span></div>
		</div>`.toggleVe(initialMode === "1");
		if (initialMode === "1" && alignment) {
			iptChance.val(alignment.chance);
			iptNote.val(alignment.note);
		}

		// SPECIAL CONTROLS
		const iptSpecial = ee`<input class="form-control input-xs form-control--minimal mb-2">`
			.onn("change", () => doUpdateState());
		const stageSpecial = ee`<div>${iptSpecial}</div>`.toggleVe(initialMode === "2");
		initialMode === "2" && alignment && iptSpecial.val(alignment.special);

		const btnRemove = ee`<button class="ve-btn ve-btn-xs ve-btn-danger mkbru__btn-rm-row mb-2" title="Remove Alignment"><span class="glyphicon glyphicon-trash"></span></button>`
			.onn("click", () => {
				alignmentRows.splice(alignmentRows.indexOf(out), 1);
				wrp.empty().remove();
				doUpdateState();
			});

		const wrp = ee`<div class="ve-flex-col mkbru__wrp-rows mkbru__wrp-rows--removable">${selMode}${stageSingle}${stageMultiple}${stageSpecial}${ee`<div class="ve-text-right">${btnRemove}</div>`}</div>`;
		const out = {wrp, getAlignment};
		alignmentRows.push(out);
		return out;
	}

	static __getAlignmentInput__getAlignmentIx (alignment) {
		return CreatureBuilder._ALIGNMENTS.findIndex(it => CollectionUtil.setEq(new Set(it), new Set(alignment)));
	}

	__getAcInput (cb) {
		const [row, rowInner] = BuilderUi.getLabelledRowTuple("Armor Class", {isMarked: true});

		const doUpdateState = () => {
			this._state.ac = acRows.map(row => row.getAc());
			cb();
		};

		const acRows = [];

		const wrpRows = ee`<div></div>`.appendTo(rowInner);
		this._state.ac.forEach(ac => CreatureBuilder.__getAcInput__getAcRow(ac, acRows, doUpdateState).wrp.appendTo(wrpRows));

		const wrpBtnAdd = ee`<div></div>`.appendTo(rowInner);
		ee`<button class="ve-btn ve-btn-xs ve-btn-default">Add Armor Class Source</button>`
			.appendTo(wrpBtnAdd)
			.onn("click", () => {
				CreatureBuilder.__getAcInput__getAcRow(null, acRows, doUpdateState).wrp.appendTo(wrpRows);
				doUpdateState();
			});

		return row;
	}

	static __getAcInput__getAcRow (ac, acRows, doUpdateState) {
		const initialMode = ac && ac.special ? "2" : ac && ac.from ? "1" : "0";

		const getAc = () => {
			const acValRaw = UiUtil.strToInt(iptAc.val(), 10, {fallbackOnNaN: 10});
			const acVal = isNaN(acValRaw) ? 10 : acValRaw;
			const condition = iptCond.val().trim();
			const braces = cbBraces.prop("checked");

			const getBaseAC = () => {
				if (condition) {
					const out = {
						ac: acVal,
						condition,
					};
					if (braces) out.braces = true;
					return out;
				} else return acVal;
			};

			switch (selMode.val()) {
				case "0": {
					return getBaseAC();
				}
				case "1": {
					const froms = fromRows.map(it => it.getAcFrom()).filter(Boolean);
					if (froms.length) {
						const out = {
							ac: acVal,
							from: froms,
						};
						if (condition) out.condition = condition;
						if (braces) out.braces = true;
						return out;
					} else return getBaseAC();
				}
				case "2": {
					return {special: iptSpecial.val()};
				}
			}
		};

		const selMode = ee`<select class="form-control input-xs mkbru_mon__ac-split">
				<option value="0">Unarmored</option>
				<option value="1">Armor Class From...</option>
				<option value="2">Special</option>
			</select>`.val(initialMode).onn("change", () => {
				switch (selMode.val()) {
					case "0": {
						stageFrom.hideVe();
						iptAc.showVe();
						iptSpecial.hideVe();
						doUpdateState();
						break;
					}
					case "1": {
						stageFrom.showVe();
						iptAc.showVe();
						iptSpecial.hideVe();
						if (!fromRows.length) CreatureBuilder.__getAcInput__getFromRow(null, fromRows, doUpdateState).wrpFrom.appendTo(wrpFromRows);
						doUpdateState();
						break;
					}
					case "2": {
						stageFrom.hideVe();
						iptAc.hideVe();
						iptSpecial.showVe();
						doUpdateState();
						break;
					}
				}
			});

		const iptAc = ee`<input class="form-control form-control--minimal input-xs mr-2 mkbru_mon__ac-split">`
			.val(ac && ac.special == null ? ac.ac || ac : 10)
			.onn("change", () => doUpdateState())
			.toggleVe(initialMode !== "2");

		const iptSpecial = ee`<input class="form-control form-control--minimal input-xs mr-2 mkbru_mon__ac-split">`
			.val(ac && ac.special ? ac.special : null)
			.onn("change", () => doUpdateState())
			.toggleVe(initialMode === "2");

		const iptCond = ee`<input class="form-control form-control--minimal input-xs" placeholder="when...">`
			.onn("change", () => doUpdateState());
		if (ac && ac.condition) iptCond.val(ac.condition);
		const cbBraces = ee`<input type="checkbox" class="mkbru__ipt-cb--plain">`
			.onn("change", () => doUpdateState());
		if (ac && ac.braces) cbBraces.prop("checked", !!ac.braces);

		// "FROM" CONTROLS
		const fromRows = [];

		const wrpFromRows = ee`<div></div>`;
		if (ac && ac.from) ac.from.forEach(f => CreatureBuilder.__getAcInput__getFromRow(f, fromRows, doUpdateState).wrpFrom.appendTo(wrpFromRows));

		const btnAddFrom = ee`<button class="ve-btn ve-btn-xs ve-btn-default mb-2">Add Another Feature/Item</button>`
			.onn("click", () => {
				CreatureBuilder.__getAcInput__getFromRow(null, fromRows, doUpdateState).wrpFrom.appendTo(wrpFromRows);
				doUpdateState();
			});
		const stageFrom = ee`<div class="mb-2 ve-flex-col">
		${wrpFromRows}
		${ee`<div>${btnAddFrom}</div>`}
		</div>`.toggleVe(initialMode === "1");

		// REMOVE CONTROLS
		const btnRemove = ee`<button class="ve-btn ve-btn-xs ve-btn-danger mkbru__btn-rm-row mb-2" title="Remove AC Source"><span class="glyphicon glyphicon-trash"></span></button>`
			.onn("click", () => {
				acRows.splice(acRows.indexOf(out), 1);
				wrp.empty().remove();
				doUpdateState();
			});

		const wrp = ee`<div class="ve-flex-col mkbru__wrp-rows mkbru__wrp-rows--removable">
			<div class="ve-flex-v-center mb-2">${iptAc}${iptSpecial}${selMode}</div>
			${ee`<div>${stageFrom}</div>`}
			<div class="ve-flex-v-center mb-2"><span class="mr-2 mkbru__sub-name--50">Condition</span>${iptCond}</div>
			<label class="ve-flex-v-center mb-2"><span class="mr-2 mkbru__sub-name--50">Surround with brackets</span>${cbBraces}</label>
			${ee`<div class="ve-text-right">${btnRemove}</div>`}
		</div>`;
		const out = {wrp, getAc};
		acRows.push(out);
		return out;
	}

	static __getAcInput__getFromRow (from, fromRows, doUpdateState) {
		const getAcFrom = () => iptFrom.val().trim();

		const iptFrom = ee`<input class="form-control form-control--minimal input-xs mr-2" placeholder="From...">`
			.onn("change", () => doUpdateState());
		if (from) iptFrom.val(from);

		const menu = ContextUtil.getMenu(Object.keys(CreatureBuilder._AC_COMMON).map(k => {
			return new ContextUtil.Action(
				k,
				() => {
					iptFrom.val(CreatureBuilder._AC_COMMON[k]);
					doUpdateState();
				},
			);
		}));

		const btnCommon = ee`<button class="ve-btn ve-btn-default ve-btn-xs mr-2">Feature <span class="caret"></span></button>`
			.onn("click", evt => ContextUtil.pOpenMenu(evt, menu));

		const btnSearchItem = ee`<button class="ve-btn ve-btn-default ve-btn-xs">Item</button>`
			.onn("click", () => {
				const searchWidget = new SearchWidget(
					{Item: SearchWidget.CONTENT_INDICES.Item},
					(doc) => {
						iptFrom.val(`{@item ${doc.n}${doc.s !== Parser.SRC_DMG ? `|${doc.s}` : ""}}`.toLowerCase());
						doUpdateState();
						doClose();
					},
					{defaultCategory: "Item"},
				);
				const {eleModalInner, doClose} = UiUtil.getShowModal({
					title: "Select Item",
					cbClose: () => searchWidget.$wrpSearch.detach(), // guarantee survival of rendered element
				});
				eleModalInner.appends(searchWidget.$wrpSearch[0]);
				searchWidget.doFocus();
			});

		const btnRemove = ee`<button class="ve-btn ve-btn-xs ve-btn-danger mkbru__btn-rm-row--nested-1 ml-2" title="Remove AC Feature/Item"><span class="glyphicon glyphicon-trash"></span></button>`
			.onn("click", () => {
				fromRows.splice(fromRows.indexOf(outFrom), 1);
				wrpFrom.empty().remove();
				ContextUtil.deleteMenu(menu);
				doUpdateState();
			});

		const wrpFrom = ee`<div class="ve-flex mb-2 mkbru__wrp-rows--removable-nested-1">${iptFrom}${btnCommon}${btnSearchItem}${btnRemove}</div>`;

		const outFrom = {wrpFrom, getAcFrom};
		fromRows.push(outFrom);
		return outFrom;
	}

	__getHpInput (cb) {
		const [row, rowInner] = BuilderUi.getLabelledRowTuple("Hit Points", {isMarked: true});

		const initialMode = (() => {
			if (this._state.hp.special != null) return "2";
			else {
				const parts = CreatureBuilder.__getHpInput__getFormulaParts(this._state.hp.formula);
				return parts != null ? "0" : "1";
			}
		})();

		const _getSimpleFormula = () => {
			const mod = UiUtil.strToInt(iptSimpleMod.val());
			return `${selSimpleNum.val()}d${selSimpleFace.val()}${mod === 0 ? "" : UiUtil.intToBonus(mod)}`;
		};

		const doUpdateState = () => {
			switch (selMode.val()) {
				case "0": {
					this._state.hp = {
						formula: _getSimpleFormula(),
						average: UiUtil.strToInt(iptSimpleAverage.val()),
					};
					break;
				}
				case "1": {
					this._state.hp = {
						formula: iptComplexFormula.val(),
						average: UiUtil.strToInt(iptComplexAverage.val()),
					};
					break;
				}
				case "2": {
					this._state.hp = {special: iptSpecial.val()};
					break;
				}
			}
			cb();
		};

		const doUpdateVisibleStage = () => {
			switch (selMode.val()) {
				case "0": wrpSimpleFormula.showVe(); wrpComplexFormula.hideVe(); wrpSpecial.hideVe(); break;
				case "1": wrpSimpleFormula.hideVe(); wrpComplexFormula.showVe(); wrpSpecial.hideVe(); break;
				case "2": wrpSimpleFormula.hideVe(); wrpComplexFormula.hideVe(); wrpSpecial.showVe(); break;
			}
		};

		const selMode = ee`<select class="form-control input-xs mb-2">
			<option value="0">Simple Formula</option>
			<option value="1">Complex Formula</option>
			<option value="2">Custom</option>
		</select>`
			.appendTo(rowInner)
			.val(initialMode)
			.onn("change", () => {
				doUpdateVisibleStage();
				doUpdateState();
			});

		// SIMPLE FORMULA STAGE
		const conHook = () => {
			if (!this._meta.autoCalc.hpModifier) return;

			const num = Number(selSimpleNum.val());
			const mod = Parser.getAbilityModNumber(Renderer.monster.getSafeAbilityScore(this._state, "con", {defaultScore: 10}));
			const total = num * mod;
			iptSimpleMod.val(total ?? null);
			hpSimpleAverageHook();
			doUpdateState();
		};

		this._addHook("state", "con", conHook);

		const hpSimpleAverageHook = () => { // no proxy required, due to being inside a child object
			if (this._meta.autoCalc.hpAverageSimple) {
				const avg = Renderer.dice.parseAverage(_getSimpleFormula());
				if (avg != null) iptSimpleAverage.val(Math.floor(avg));
			}
		};

		const selSimpleNum = ee`<select class="form-control input-xs mr-2">${[...new Array(50)].map((_, i) => `<option>${i + 1}</option>`)}</select>`
			.onn("change", () => {
				conHook();
				hpSimpleAverageHook();
				doUpdateState();
			});

		const selSimpleFace = ee`<select class="form-control input-xs mr-2">${Renderer.dice.DICE.map(it => `<option>${it}</option>`)}</select>`
			.onn("change", () => {
				hpSimpleAverageHook();
				doUpdateState();
			});

		const iptSimpleMod = ee`<input class="form-control form-control--minimal input-xs ve-text-right mr-2">`
			.onn("change", () => {
				if (this._meta.autoCalc.hpModifier) {
					this._meta.autoCalc.hpModifier = false;
					btnAutoSimpleFormula.removeClass("active");
				}
				hpSimpleAverageHook();
				doUpdateState();
			});

		const btnAutoSimpleFormula = ee`<button class="ve-btn ve-btn-xs ve-btn-default ${this._meta.autoCalc.hpModifier ? "active" : ""}" title="Auto-calculate modifier from Constitution"><span class="glyphicon glyphicon-refresh"></span></button>`
			.onn("click", () => {
				if (this._meta.autoCalc.hpModifier) {
					this._meta.autoCalc.hpModifier = false;
					this.doUiSave();
				} else {
					this._meta.autoCalc.hpModifier = true;
					conHook();
				}
				btnAutoSimpleFormula.toggleClass("active", this._meta.autoCalc.hpModifier);
				doUpdateState();
			});

		const iptSimpleAverage = ee`<input class="form-control form-control--minimal input-xs mr-2">`
			.onn("change", () => {
				this._meta.autoCalc.hpAverageSimple = false;
				doUpdateState();
			});

		const btnAutoSimpleAverage = ee`<button class="ve-btn ve-btn-xs ve-btn-default ${this._meta.autoCalc.hpAverageSimple ? "active" : ""}" title="Auto-calculate"><span class="glyphicon glyphicon-refresh"></span></button>`
			.onn("click", () => {
				if (this._meta.autoCalc.hpAverageSimple) {
					this._meta.autoCalc.hpAverageSimple = false;
					this.doUiSave();
				} else {
					this._meta.autoCalc.hpAverageSimple = true;
					hpSimpleAverageHook();
				}
				btnAutoSimpleAverage.toggleClass("active", this._meta.autoCalc.hpAverageSimple);
				doUpdateState();
			});

		const wrpSimpleFormula = ee`<div class="ve-flex-col">
		<div class="ve-flex-v-center mb-2">
			<span class="mr-2 mkbru__sub-name--50">Formula</span>
			${selSimpleNum}
			<span class="mr-2">d</span>
			${selSimpleFace}
			<span class="mr-2">+</span>
			${iptSimpleMod}
			${btnAutoSimpleFormula}
		</div>
		<div class="ve-flex-v-center mb-2"><span class="mr-2 mkbru__sub-name--50">Average</span>${iptSimpleAverage}${btnAutoSimpleAverage}</div>
		</div>`.toggleVe(initialMode === "1").appendTo(rowInner);
		if (initialMode === "0") {
			const formulaParts = CreatureBuilder.__getHpInput__getFormulaParts(this._state.hp.formula);
			selSimpleNum.val(`${formulaParts.hdNum}`);
			selSimpleFace.val(`${formulaParts.hdFaces}`);
			if (formulaParts.mod != null) iptSimpleMod.val(formulaParts.mod);
			iptSimpleAverage.val(this._state.hp.average);
		}

		// COMPLEX FORMULA STAGE
		const hpComplexAverageHook = () => { // no proxy required, due to being inside a child object
			if (this._meta.autoCalc.hpAverageComplex) {
				const avg = Renderer.dice.parseAverage(iptComplexFormula.val());
				if (avg != null) iptComplexAverage.val(Math.floor(avg));
			}
		};

		const iptComplexFormula = ee`<input class="form-control form-control--minimal input-xs">`
			.onn("change", () => {
				hpComplexAverageHook();
				doUpdateState();
			});

		const iptComplexAverage = ee`<input class="form-control form-control--minimal input-xs mr-2">`
			.onn("change", () => {
				this._meta.autoCalc.hpAverageComplex = false;
				doUpdateState();
			});

		const btnAutoComplexAverage = ee`<button class="ve-btn ve-btn-xs ve-btn-default ${this._meta.autoCalc.hpAverageComplex ? "active" : ""}" title="Auto-calculate from Formula"><span class="glyphicon glyphicon-refresh"></span></button>`
			.onn("click", () => {
				if (this._meta.autoCalc.hpAverageComplex) {
					this._meta.autoCalc.hpAverageComplex = false;
					this.doUiSave();
				} else {
					this._meta.autoCalc.hpAverageComplex = true;
					hpComplexAverageHook();
				}
				btnAutoComplexAverage.toggleClass("active", this._meta.autoCalc.hpAverageComplex);
				doUpdateState();
			});

		const wrpComplexFormula = ee`<div class="ve-flex-col">
		<div class="ve-flex-v-center mb-2"><span class="mr-2 mkbru__sub-name--50">Formula</span>${iptComplexFormula}</div>
		<div class="ve-flex-v-center mb-2"><span class="mr-2 mkbru__sub-name--50">Average</span>${iptComplexAverage}${btnAutoComplexAverage}</div>
		</div>`.toggleVe(initialMode === "0").appendTo(rowInner);
		if (initialMode === "1") {
			iptComplexFormula.val(this._state.hp.formula);
			iptComplexAverage.val(this._state.hp.average);
		}

		// SPECIAL STAGE
		const iptSpecial = ee`<input class="form-control form-control--minimal input-xs mb-2">`
			.onn("change", () => doUpdateState());
		const wrpSpecial = ee`<div>${iptSpecial}</div>`.toggleVe(initialMode === "2").appendTo(rowInner);
		if (initialMode === "2") iptSpecial.val(this._state.hp.special);

		doUpdateVisibleStage();

		return row;
	}

	static __getHpInput__getFormulaParts (formula) {
		formula = formula
			.replace(/\s+/g, "")
			.replace(/[\u2012-\u2014\u2212]/g, "-");
		const m = /^(\d*)d(\d+)([-+]\d+)?$/.exec(formula);
		if (!m) return null;
		const hdNum = m[1] ? Number(m[1]) : 1;
		if (hdNum <= 0 || hdNum > 50) return null; // if it's e.g. 0d10, consider invalid. Cap at 50 HD
		const hdFaces = Number(m[2]);
		if (!Renderer.dice.DICE.includes(hdFaces)) return null; // if it's a non-standard dice face (e.g. 1d7)
		const out = {hdNum, hdFaces};
		if (m[3]) out.mod = Number(m[3]);
		return out;
	}

	__getSpeedInput (cb) {
		const [row, rowInner] = BuilderUi.getLabelledRowTuple("Speed", {isMarked: true});

		const getRow = (name, prop) => {
			const doUpdateProp = () => {
				const speedRaw = iptSpeed.val().trim();
				if (!speedRaw) {
					delete this._state.speed[prop];
					if (prop === "fly") delete this._state.speed.canHover;
				} else {
					const speed = UiUtil.strToInt(speedRaw);
					const condition = iptCond.val().trim();
					this._state.speed[prop] = (condition ? {number: speed, condition: condition} : speed);
					if (prop === "fly") {
						this._state.speed.canHover = !!(condition && /(^|[^a-zA-Z])hover([^a-zA-Z]|$)/i.exec(condition));
						if (!this._state.speed.canHover) delete this._state.speed.canHover;
					}
				}
				cb();
			};

			const iptSpeed = ee`<input class="form-control form-control--minimal input-xs mr-2">`
				.onn("change", () => doUpdateProp());
			const iptCond = ee`<input class="form-control form-control--minimal input-xs" placeholder="${prop === "fly" ? "(hover)/when..." : "when..."}">`
				.onn("change", () => doUpdateProp());

			const initial = this._state.speed[prop];
			if (initial != null) {
				if (initial.condition != null) {
					iptSpeed.val(initial.number);
					iptCond.val(initial.condition);
				} else iptSpeed.val(initial);
			}

			return ee`<div class="ve-flex-v-center mb-2">
			<span class="mr-2 mkbru__sub-name--33">${name}</span>
			<div class="ve-flex-v-center">${iptSpeed}<span class="mr-2">ft.</span>${iptCond}</div>
			</div>`;
		};

		ee`<div class="ve-flex-col">
		${getRow("Walk", "walk")}
		${getRow("Burrow", "burrow")}
		${getRow("Climb", "climb")}
		${getRow("Fly", "fly")}
		${getRow("Swim", "swim")}
		</div>`.appendTo(rowInner);

		return row;
	}

	__getAbilityScoreInput (cb) {
		const [row, rowInner] = BuilderUi.getLabelledRowTuple("Ability Scores", {isMarked: true, isRow: true});

		const getRow = (name, prop) => {
			const valInitial = this._state[prop] != null && typeof this._state[prop] !== "number"
				? this._state[prop].special
				: this._state[prop];

			const iptAbil = ee`<input class="form-control form-control--minimal input-xs ve-text-center">`
				.val(valInitial)
				.onn("change", () => {
					const val = iptAbil.val().trim();
					if (!val) {
						delete this._state[prop];
						return cb();
					}

					if (isNaN(val)) {
						this._state[prop] = {special: val};
						return cb();
					}

					this._state[prop] = UiUtil.strToInt(val);
					cb();
				});

			return ee`<div class="ve-flex-v-center mb-2 ve-flex-col mr-1">
			<span class="mb-2 bold">${prop.toUpperCase()}</span>
			${iptAbil}
			</div>`;
		};

		Parser.ABIL_ABVS.forEach(abv => getRow(Parser.attAbvToFull(abv), abv).appendTo(rowInner));

		return row;
	}

	__getSaveInput (cb) {
		const [row, rowInner] = BuilderUi.getLabelledRowTuple("Saving Throws", {isMarked: true, isRow: true});

		const getRow = (name, prop) => {
			const iptVal = ee`<input class="form-control form-control--minimal input-xs mb-2 ve-text-center">`
				.onn("change", () => {
					btnProf.removeClass("active");
					delete this._meta.profSave[prop];
					this.__getSaveSkillInput__handleValChange(cb, "save", iptVal, prop);
				});

			const _setFromAbility = () => {
				const total = Parser.getAbilityModNumber(Renderer.monster.getSafeAbilityScore(this._state, prop, {defaultScore: 10})) + this._getProfBonus();
				(this._state.save = this._state.save || {})[prop] = total < 0 ? `${total}` : `+${total}`;
				iptVal.val(total);
				cb();
			};

			const btnProf = ee`<button class="ve-btn ve-btn-xs ve-btn-default" title="Is Proficient">Prof.</button>`
				.onn("click", () => {
					if (this._meta.profSave[prop]) {
						delete this._meta.profSave[prop];
						iptVal.val("");
						this.__getSaveSkillInput__handleValChange(cb, "save", iptVal, prop);
					} else {
						this._meta.profSave[prop] = 1;
						hook();
					}
					btnProf.toggleClass("active", this._meta.profSave[prop] === 1);
				});
			if (this._meta.profSave[prop]) btnProf.addClass("active");

			if ((this._state.save || {})[prop]) iptVal.val(`${this._state.save[prop]}`.replace(/^\+/, "")); // remove leading plus sign

			const hook = () => {
				if (this._meta.profSave[prop] === 1) _setFromAbility();
			};
			this._addHook("state", prop, hook);
			this._addHook("meta", "profBonus", hook);

			return ee`<div class="ve-flex-v-center ve-flex-col mr-1 mb-2">
			<span class="mr-2 bold">${prop.toUpperCase()}</span>
			${iptVal}${btnProf}
			</div>`;
		};

		Parser.ABIL_ABVS.forEach(abv => getRow(Parser.attAbvToFull(abv), abv).appendTo(rowInner));

		return row;
	}

	__getSkillInput (cb) {
		const [row, rowInner] = BuilderUi.getLabelledRowTuple("Skills", {isMarked: true});

		const getRow = (name, prop) => {
			const abilProp = Parser.skillToAbilityAbv(prop);

			const iptVal = ee`<input class="form-control form-control--minimal input-xs mr-2 ve-text-center">`
				.onn("change", () => {
					if (this._meta.profSkill[prop]) {
						btnProf.removeClass("active");
						btnExpert.removeClass("active");
					}
					delete this._meta.profSkill[prop];
					this.__getSaveSkillInput__handleValChange(cb, "skill", iptVal, prop);
				});

			const _setFromAbility = (isExpert) => {
				const total = Parser.getAbilityModNumber(Renderer.monster.getSafeAbilityScore(this._state, abilProp, {defaultScore: 10}))
					+ (this._getProfBonus() * (2 - !isExpert));

				const nextSkills = {...(this._state.skill || {})}; // regenerate the object to allow hooks to fire
				nextSkills[prop] = total < 0 ? `${total}` : `+${total}`;
				this._state.skill = nextSkills;
				iptVal.val(total);
				cb();
			};

			const _handleButtonPress = (isExpert) => {
				if (isExpert) {
					if (this._meta.profSkill[prop] === 2) {
						delete this._meta.profSkill[prop];
						iptVal.val("");
						this.__getSaveSkillInput__handleValChange(cb, "skill", iptVal, prop);
					} else {
						this._meta.profSkill[prop] = 2;
						hook();
					}
					btnProf.removeClass("active");
					btnExpert.toggleClass("active", this._meta.profSkill[prop] === 2);
				} else {
					if (this._meta.profSkill[prop] === 1) {
						delete this._meta.profSkill[prop];
						iptVal.val("");
						this.__getSaveSkillInput__handleValChange(cb, "skill", iptVal, prop);
					} else {
						this._meta.profSkill[prop] = 1;
						hook();
					}
					btnProf.toggleClass("active", this._meta.profSkill[prop] === 1);
					btnExpert.removeClass("active");
				}
			};

			const btnProf = ee`<button class="ve-btn ve-btn-xs ve-btn-default" title="Is Proficient">Prof.</button>`
				.onn("click", () => _handleButtonPress());
			if (this._meta.profSkill[prop] === 1) btnProf.addClass("active");

			const btnExpert = ee`<button class="ve-btn ve-btn-xs ve-btn-default ml-2" title="Has Expertise">Expert.</button>`
				.onn("click", () => _handleButtonPress(true));
			if (this._meta.profSkill[prop] === 2) btnExpert.addClass("active");

			if ((this._state.skill || {})[prop]) iptVal.val(`${this._state.skill[prop]}`.replace(/^\+/, "")); // remove leading plus sign

			const hook = () => {
				if (this._meta.profSkill[prop] === 1) _setFromAbility();
				else if (this._meta.profSkill[prop] === 2) _setFromAbility(true);
			};
			this._addHook("state", abilProp, hook);
			this._addHook("meta", "profBonus", hook);

			return ee`<div class="ve-flex-v-center mb-2">
			<span class="mr-2 mkbru__sub-name--33">${name}</span>
			<div class="ve-muted mkbru_mon__skill-attrib-label mr-2 help-subtle" title="This skill is affected by the creature's ${Parser.attAbvToFull((Parser.skillToAbilityAbv(prop)))} score">(${Parser.skillToAbilityAbv(prop).toUpperCase()})</div>
			${iptVal}${btnProf}${btnExpert}
			</div>`;
		};

		Object.keys(Parser.SKILL_TO_ATB_ABV).sort(SortUtil.ascSort).forEach(skill => getRow(skill.toTitleCase(), skill).appendTo(rowInner));

		return row;
	}

	__getSaveSkillInput__handleValChange (cb, mode, iptVal, prop) {
		// ensure to overwrite the entire object, so that any hooks trigger
		const raw = iptVal.val();
		if (raw && raw.trim()) {
			const num = UiUtil.strToInt(raw);
			const nextState = {...(this._state[mode] || {})};
			nextState[prop] = num < 0 ? `${num}` : `+${num}`;
			this._state[mode] = nextState;
		} else {
			if (this._state[mode]) {
				const nextState = {...this._state[mode]};
				delete nextState[prop];
				if (Object.keys(nextState).length === 0) delete this._state[mode];
				else this._state[mode] = nextState;
			}
		}
		cb();
	}

	__getPassivePerceptionInput (cb) {
		const [row, rowInner] = BuilderUi.getLabelledRowTuple("Passive Perception");

		const getAutoPassivePerception = () => {
			if (!this._meta.autoCalc.passivePerception) return null;

			if (this._state.skill?.perception?.trim()) {
				if (isNaN(this._state.skill.perception)) return null;

				return Math.round(Number(this._state.skill.perception) + 10);
			}

			const wisScore = Renderer.monster.getSafeAbilityScore(this._state, "wis", {defaultScore: null});
			if (wisScore == null) return null;

			return Parser.getAbilityModNumber(wisScore) + 10;
		};

		const hook = () => {
			const pp = getAutoPassivePerception();
			if (pp == null) return;

			iptPerception.val(pp);
			this._state.passive = pp;
			cb();
		};
		this._addHook("state", "wis", hook);
		this._addHook("state", "skill", hook);

		const iptPerception = ee`<input class="form-control form-control--minimal input-xs mr-2">`
			.onn("change", () => {
				if (this._meta.autoCalc.passivePerception) {
					btnAuto.removeClass("active");
					this._meta.autoCalc.passivePerception = false;
				}
				const val = iptPerception.val();
				this._state.passive = isNaN(val) ? val : UiUtil.strToInt(iptPerception.val());
				cb();
			})
			.val(this._state.passive || 0);

		const btnAuto = ee`<button class="ve-btn ve-btn-default ve-btn-xs ${this._meta.autoCalc.passivePerception ? "active" : ""}" title="Auto-Calculate Passive Perception"><span class="glyphicon glyphicon-refresh"></span></button>`
			.onn("click", () => {
				if (this._meta.autoCalc.passivePerception) {
					delete this._meta.autoCalc.passivePerception;
					this.doUiSave(); // save meta-state
				} else {
					this._meta.autoCalc.passivePerception = true;
					hook();
				}
				btnAuto.toggleClass("active", this._meta.autoCalc.passivePerception);
				cb();
			});

		ee`<div class="ve-flex-v-center">${iptPerception}${btnAuto}</div>`.appendTo(rowInner);

		return row;
	}

	__getVulnerableInput (cb) {
		return this.__getDefensesInput(cb, "Damage Vulnerabilities", "Vulnerability", "vulnerable");
	}

	__getResistInput (cb) {
		return this.__getDefensesInput(cb, "Damage Resistances", "Resistance", "resist");
	}

	__getImmuneInput (cb) {
		return this.__getDefensesInput(cb, "Damage Immunities", "Immunity", "immune");
	}

	__getCondImmuneInput (cb) {
		return this.__getDefensesInput(cb, "Condition Immunities", "Immunity", "conditionImmune");
	}

	__getDefensesInput (cb, rowName, shortName, prop) {
		const [row, rowInner] = BuilderUi.getLabelledRowTuple(rowName, {isMarked: true});

		const groups = [];
		const wrpGroups = ee`<div></div>`.appendTo(rowInner);
		const wrpControls = ee`<div></div>`.appendTo(rowInner);

		const doUpdateState = () => {
			const out = groups.map(it => it.getState());
			if (out.length) {
				// flatten a single group if there's no meta-information
				if (out.length === 1 && !out[0].note && !out[0].preNote) this._state[prop] = [...out[0][prop]];
				else this._state[prop] = out;
			} else delete this._state[prop];
			cb();
		};

		const doAddGroup = data => {
			const group = CreatureBuilder.__getDefensesInput__getNodeGroup(shortName, prop, groups, doUpdateState, 0, data);
			groups.push(group);
			group.ele.appendTo(wrpGroups);
		};

		const btnAddGroup = ee`<button class="ve-btn ve-btn-xs ve-btn-default mr-2">Add Group</button>`
			.appendTo(wrpControls)
			.onn("click", () => doAddGroup());

		if (this._state[prop]) {
			// convert flat arrays into wrapped objects
			if (this._state[prop].some(it => it[prop] == null)) doAddGroup({[prop]: this._state[prop]});
			else this._state[prop].forEach(dmgType => doAddGroup(dmgType));
		}

		return row;
	}

	static __getDefensesInput__getNodeGroup (shortName, prop, groups, doUpdateState, depth, initial) {
		const children = [];
		const getState = () => {
			const out = {
				[prop]: children.map(it => it.getState()).filter(Boolean),
			};
			if (iptNotePre.val().trim()) out.preNote = iptNotePre.val().trim();
			if (iptNotePost.val().trim()) out.note = iptNotePost.val().trim();
			return out;
		};

		const addChild = (child, doUpdate = true) => {
			if (child == null) return;
			children.push(child);

			children.sort((a, b) => {
				// sort specials and groups to the bottom, in that order
				// `.order` ensures no non-deterministic shuffling occurs
				if ((a.type === "group" || a.type === "special") && a.type === b.type) return b.order - a.order;
				else if (a.type === "group" && b.type === "special") return 1;
				else if (a.type === "special" && b.type === "group") return -1;
				else if (a.type === "group" || a.type === "special") return 1;
				else if (b.type === "group" || b.type === "special") return -1;
				else return SortUtil.ascSort(a.type, b.type) || b.order - a.order;
			}).forEach(child => {
				child.ele.detach();
				wrpChildren.appends(child.ele);
			});

			if (doUpdate) doUpdateState();
		};

		const optionsList = prop === "conditionImmune" ? Parser.CONDITIONS : Parser.DMG_TYPES;
		const menu = ContextUtil.getMenu([...optionsList, null, "Special"].map((it, i) => {
			if (it == null) return null;

			return new ContextUtil.Action(
				it.toTitleCase(),
				() => {
					const child = (() => {
						const alreadyExists = (type) => children.some(ch => ch.type === type);

						if (i < optionsList.length) {
							if (alreadyExists(optionsList[i])) return null;
							return CreatureBuilder.__getDefensesInput__getNodeItem(shortName, children, doUpdateState, optionsList[i]);
						} else { // "Special"
							if (alreadyExists("special")) return null;
							return CreatureBuilder.__getDefensesInput__getNodeItem(shortName, children, doUpdateState, "special");
						}
					})();

					addChild(child);
				},
			);
		}));

		const btnAddChild = ee`<button class="ve-btn ve-btn-xs ve-btn-default mr-2">Add ${shortName}</button>`
			.onn("click", (evt) => ContextUtil.pOpenMenu(evt, menu));
		const btnAddChildGroup = ee`<button class="ve-btn ve-btn-xs ve-btn-default mr-2">Add Child Group</button>`
			.onn("click", () => addChild(CreatureBuilder.__getDefensesInput__getNodeGroup(shortName, prop, children, doUpdateState, depth + 1)));
		const iptNotePre = ee`<input class="form-control input-xs form-control--minimal mr-2" placeholder="Pre- note">`
			.onn("change", () => doUpdateState());
		const iptNotePost = ee`<input class="form-control input-xs form-control--minimal mr-2" placeholder="Post- note">`
			.onn("change", () => doUpdateState());
		const btnRemove = ee`<button class="ve-btn ve-btn-xs ve-btn-danger mkbru__btn-rm-row" title="Remove ${shortName} Group"><span class="glyphicon glyphicon-trash"></span></button>`
			.onn("click", () => {
				groups.splice(groups.indexOf(out), 1);
				ele.remove();
				doUpdateState();
			});

		const wrpChildren = ee`<div class="ve-flex-col"></div>`;
		const wrpControls = ee`<div class="mb-2 ve-flex-v-center">${btnAddChild}${btnAddChildGroup}${iptNotePre}${iptNotePost}${btnRemove}</div>`;

		const ele = (() => {
			const base = ee`<div class="ve-flex-col ${depth ? "" : "mkbru__wrp-rows"}">${wrpControls}${wrpChildren}</div>`;
			if (!depth) return base;
			else return ee`<div class="ve-flex-v-center w-100"><div class="mkbru_mon__row-indent"></div>${base}</div>`;
		})();

		if (initial) {
			iptNotePre.val(initial.preNote || "");
			iptNotePost.val(initial.note || "");
			initial[prop].forEach(dmgType => {
				if (typeof dmgType === "string") addChild(CreatureBuilder.__getDefensesInput__getNodeItem(shortName, children, doUpdateState, dmgType), false);
				else if (dmgType.special != null) addChild(CreatureBuilder.__getDefensesInput__getNodeItem(shortName, children, doUpdateState, "special", dmgType.special), false);
				else addChild(CreatureBuilder.__getDefensesInput__getNodeGroup(shortName, prop, children, doUpdateState, depth + 1, dmgType), false);
			});
		}

		const out = {getState, ele, type: "group", order: CreatureBuilder._rowSortOrder++};
		return out;
	}

	static __getDefensesInput__getNodeItem (shortName, children, doUpdateState, type, value) {
		const btnRemove = ee`<button class="ve-btn ve-btn-xxs ve-btn-danger" title="Remove ${shortName} Entry"><span class="glyphicon glyphicon-trash"></span></button>`
			.onn("click", () => {
				children.splice(children.indexOf(out), 1);
				ele.remove();
				doUpdateState();
			});

		const {ele, getState} = (() => {
			switch (type) {
				case "special": {
					const iptSpecial = ee`<input class="form-control form-control--minimal input-xs mr-2">`
						.onn("change", () => doUpdateState());
					if (value != null) iptSpecial.val(value);

					return {
						ele: ee`<div class="mb-2 split ve-flex-v-center mkbru__wrp-btn-xxs">${iptSpecial}${btnRemove}</div>`,
						getState: () => {
							const raw = iptSpecial.val().trim();
							if (raw) return {special: raw};
							return null;
						},
					};
				}
				default: {
					return {
						ele: ee`<div class="mb-2 split ve-flex-v-center mkbru__wrp-btn-xxs"><span class="mr-2">&bull; ${type.uppercaseFirst()}</span>${btnRemove}</div>`,
						getState: () => type,
					};
				}
			}
		})();

		const out = {ele, getState, type, order: CreatureBuilder._rowSortOrder++};
		return out;
	}

	__getSenseInput (cb) {
		const [row, rowInner] = BuilderUi.getLabelledRowTuple("Senses");

		const doUpdateState = () => {
			const raw = iptSenses.val().trim();
			if (!raw) delete this._state.senses;
			else this._state.senses = raw.split(StrUtil.COMMA_SPACE_NOT_IN_PARENTHESES_REGEX);
			cb();
		};

		const iptSenses = ee`<input class="form-control input-xs form-control--minimal mr-2">`
			.onn("change", () => doUpdateState());
		if (this._state.senses && this._state.senses.length) iptSenses.val(this._state.senses.join(", "));

		const menu = ContextUtil.getMenu(
			Parser.getSenses()
				.map(({name: sense}) => {
					return new ContextUtil.Action(
						sense.uppercaseFirst(),
						async () => {
							const feet = await InputUiUtil.pGetUserNumber({min: 0, int: true, title: "Enter the Number of Feet"});
							if (feet == null) return;

							const curr = iptSenses.val().trim();
							const toAdd = `${sense} ${feet} ft.`;
							iptSenses.val(curr ? `${curr}, ${toAdd}` : toAdd);

							doUpdateState();
						},
					);
				}),
		);

		const btnAddGeneric = ee`<button class="ve-btn ve-btn-xs ve-btn-default mr-2 mkbru_mon__btn-add-sense-language">Add Sense</button>`
			.onn("click", (evt) => ContextUtil.pOpenMenu(evt, menu));

		const btnSort = BuilderUi.getSplitCommasSortButton(iptSenses, doUpdateState);

		ee`<div class="ve-flex-v-center">${iptSenses}${btnAddGeneric}${btnSort}</div>`.appendTo(rowInner);

		return row;
	}

	__getLanguageInput (cb) {
		const [row, rowInner] = BuilderUi.getLabelledRowTuple("Languages");

		const doUpdateState = () => {
			const raw = iptLanguages.val().trim();
			if (!raw) delete this._state.languages;
			else this._state.languages = raw.split(StrUtil.COMMA_SPACE_NOT_IN_PARENTHESES_REGEX);
			cb();
		};

		const iptLanguages = ee`<input class="form-control input-xs form-control--minimal mr-2">`
			.onn("change", () => doUpdateState());
		if (this._state.languages && this._state.languages.length) iptLanguages.val(this._state.languages.join(", "));

		const availLanguages = Object.entries(Parser.MON_LANGUAGE_TAG_TO_FULL).filter(([k]) => !CreatureBuilder._LANGUAGE_BLOCKLIST.has(k))
			.map(([k, v]) => v === "Telepathy" ? "telepathy" : v); // lowercase telepathy

		const btnAddGeneric = ee`<button class="ve-btn ve-btn-xs ve-btn-default mr-2 mkbru_mon__btn-add-sense-language">Add Language</button>`
			.onn("click", async () => {
				const language = await InputUiUtil.pGetUserString({
					title: "Enter a Language",
					default: "Common",
					autocomplete: availLanguages,
				});

				if (language != null) {
					const curr = iptLanguages.val().trim();
					iptLanguages.val(curr ? `${curr}, ${language}` : language);

					doUpdateState();
				}
			});

		const btnSort = BuilderUi.getSplitCommasSortButton(iptLanguages, doUpdateState, {bottom: [/telepathy/i]});

		ee`<div class="ve-flex-v-center">${iptLanguages}${btnAddGeneric}${btnSort}</div>`.appendTo(rowInner);

		return row;
	}

	__getCrInput (cb) {
		const [row, rowInner] = BuilderUi.getLabelledRowTuple("Challenge Rating", {isMarked: true});

		const initialMode = this._state.cr != null
			? this._state.cr.lair ? "1" : this._state.cr.coven ? "2" : ScaleCreature.isCrInScaleRange(this._state) ? "0" : "3"
			: "4";

		const selMode = ee`<select class="form-control input-xs mb-2">
			<option value="0">Basic Challenge Rating</option>
			<option value="1">Has Lair Challenge Rating</option>
			<option value="2">Has Coven Challenge Rating</option>
			<option value="3">Custom Challenge Rating</option>
			<option value="4">No Challenge Rating</option>
		</select>`.val(initialMode).onn("change", () => {
				switch (selMode.val()) {
					case "0": {
						stageBasic.showVe(); stageLair.hideVe(); stageCoven.hideVe(); stageCustom.hideVe();
						this._state.cr = selCr.val();
						break;
					}
					case "1": {
						stageBasic.showVe(); stageLair.showVe(); stageCoven.hideVe(); stageCustom.hideVe();
						this._state.cr = {
							cr: selCr.val(),
							lair: selCrLair.val(),
						};
						break;
					}
					case "2": {
						stageBasic.showVe(); stageLair.hideVe(); stageCoven.showVe(); stageCustom.hideVe();
						this._state.cr = {
							cr: selCr.val(),
							coven: selCrCoven.val(),
						};
						break;
					}
					case "3": {
						stageBasic.hideVe(); stageLair.hideVe(); stageCoven.hideVe(); stageCustom.showVe();
						compCrCustom.setParentState(this);
						break;
					}
					case "4": {
						stageBasic.hideVe(); stageLair.hideVe(); stageCoven.hideVe(); stageCustom.hideVe();
						delete this._state.cr;
						break;
					}
				}
				cb();
			}).appendTo(rowInner);

		// region BASIC CONTROLS
		const selCr = ee`<select class="form-control input-xs mb-2">${Parser.CRS.map(it => `<option>${it}</option>`).join("")}</select>`
			.val(this._state.cr ? (this._state.cr.cr || this._state.cr) : null).onn("change", () => {
				if (selMode.val() === "0") this._state.cr = selCr.val();
				else this._state.cr.cr = selCr.val();
				cb();
			});
		const stageBasic = ee`<div>${selCr}</div>`
			.appendTo(rowInner).toggleVe(!["3", "4"].includes(initialMode));
		// endregion

		// region LAIR CONTROLS
		const selCrLair = ee`<select class="form-control input-xs">${Parser.CRS.map(it => `<option>${it}</option>`).join("")}</select>`
			.onn("change", () => {
				this._state.cr.lair = selCrLair.val();
				cb();
			});
		const stageLair = ee`<div class="ve-flex-v-center mb-2"><span class="mr-2 mkbru__sub-name--33">While in lair</span>${selCrLair}</div>`
			.appendTo(rowInner).toggleVe(initialMode === "1");
		initialMode === "1" && selCrLair.val(this._state.cr.cr);
		// endregion

		// region COVEN CONTROLS
		const selCrCoven = ee`<select class="form-control input-xs">${Parser.CRS.map(it => `<option>${it}</option>`).join("")}</select>`
			.onn("change", () => {
				this._state.cr.coven = selCrCoven.val();
				cb();
			});
		const stageCoven = ee`<div class="ve-flex-v-center mb-2"><span class="mr-2 mkbru__sub-name--33">While in coven</span>${selCrCoven}</div>`
			.appendTo(rowInner).toggleVe(initialMode === "2");
		initialMode === "2" && selCrCoven.val(this._state.cr.cr);
		// endregion

		// region CUSTOM CONTROLS
		const compCrCustom = new class extends BaseComponent {
			renderInputCr () { return ComponentUiUtil.getIptStr(this, "cr", {autocomplete: Parser.CRS}); }
			renderInputXp () { return ComponentUiUtil.getIptInt(this, "xp", 0, {isAllowNull: true}); }

			setParentState (parent) {
				if (this._state.cr) {
					const nxtState = {cr: this._state.cr};
					if (this._state.xp != null) nxtState.xp = this._state.xp;
					parent._state.cr = nxtState;
				} else delete parent._state.cr;
			}
		}();
		const stageCustom = ee`<div class="ve-flex-col mb-2">
			<div class="ve-flex-v-center mb-2"><span class="mr-2 mkbru__sub-name--25">CR</span>${compCrCustom.renderInputCr()}</div>
			<div class="ve-flex-v-center"><span class="mr-2 mkbru__sub-name--25">XP</span>${compCrCustom.renderInputXp()}</div>
		</div>`
			.appendTo(rowInner).toggleVe(initialMode === "3");
		if (initialMode === "3") {
			compCrCustom._state.cr = this._state.cr.cr ?? this._state.cr;
			compCrCustom._state.xp = this._state.cr.xp;
		}
		compCrCustom._addHookAll("state", () => {
			compCrCustom.setParentState(this);
			cb();
		});
		// endregion

		return row;
	}

	// this doesn't directly affect state, but is used as a helper for other inputs
	__getProfBonusInput (cb) {
		const [row, rowInner] = BuilderUi.getLabelledRowTuple("Proficiency Bonus", {title: `The value used by the builder when calculating other proficiency-based values. If not specified, the value is based on the creature's CR.`});

		const hook = () => {
			// update proficiency bonus input as required
			if (this._meta.autoCalc.proficiency) {
				if (this._state.cr == null) {
					iptProfBonus.val(0);
					this._meta.profBonus = 0;
				} else {
					const pb = Parser.crToPb(this._state.cr.cr || this._state.cr);
					iptProfBonus.val(pb);
					this._meta.profBonus = pb;
				}
				cb();
			}
		};
		this._addHook("state", "cr", hook);

		const iptProfBonus = ee`<input class="form-control form-control--minimal input-xs mr-2">`
			.val(this._getProfBonus())
			.onn("change", () => {
				this._meta.profBonus = UiUtil.strToInt(iptProfBonus.val(), 0, {min: 0});
				this._meta.autoCalc.proficiency = false;
				iptProfBonus.val(UiUtil.intToBonus(this._meta.profBonus));
				cb();
			});

		const btnAuto = ee`<button class="ve-btn ve-btn-xs ve-btn-default ${this._meta.autoCalc.proficiency ? "active" : ""}" title="Auto-calculate from Challenge Rating (DMG'14 p. 274)"><span class="glyphicon glyphicon-refresh"></span></button>`
			.onn("click", () => {
				if (this._meta.autoCalc.proficiency) {
					this._meta.autoCalc.proficiency = false;
					this.doUiSave();
				} else {
					this._meta.autoCalc.proficiency = true;
					hook();
				}
				btnAuto.toggleClass("active", this._meta.autoCalc.proficiency);
				cb();
			});

		ee`<div class="ve-flex-v-center">${iptProfBonus}${btnAuto}</div>`.appendTo(rowInner);

		return row;
	}

	_getProfBonus () {
		if (this._meta.profBonus != null) return this._meta.profBonus || 0;
		else return this._state.cr == null ? 0 : Parser.crToPb(this._state.cr.cr || this._state.cr);
	}

	__getProfNoteInput (cb) {
		const [row, rowInner] = BuilderUi.getLabelledRowTuple("Proficiency Note", {title: `The value to display as the "Proficiency Bonus" on the statblock. If not specified, the display value is based on the creature's CR.`});

		const iptPbNote = ee`<input class="form-control form-control--minimal input-xs mr-2">`
			.val(this._state.pbNote || "")
			.onn("change", () => {
				const val = iptPbNote.val().trim();
				if (val) this._state.pbNote = val;
				else delete this._state.pbNote;
				cb();
			});

		ee`<div class="ve-flex-v-center">${iptPbNote}</div>`.appendTo(rowInner);

		return row;
	}

	__getSpellcastingInput (cb) {
		const [row, rowInner] = BuilderUi.getLabelledRowTuple("Spellcasting", {isMarked: true});

		const traitRows = [];
		const wrpRows = ee`<div></div>`.appendTo(rowInner);
		const wrpControls = ee`<div></div>`.appendTo(rowInner);

		const btnAddRow = ee`<button class="ve-btn ve-btn-xs ve-btn-default">Add Spellcasting Trait</button>`
			.appendTo(wrpControls)
			.onn("click", () => {
				doAddTrait();
				doUpdateState();
			});

		const doUpdateState = () => {
			if (!traitRows.length) delete this._state.spellcasting;
			else {
				const spellcastingTraits = traitRows.map(r => r.getState()).filter(Boolean);
				if (spellcastingTraits.length) this._state.spellcasting = spellcastingTraits;
				else delete this._state.spellcasting;
			}
			cb();
		};

		const doAddTrait = trait => {
			const row = this.__getSpellcastingInput__getTraitRow(traitRows, doUpdateState, trait);
			traitRows.push(row);
			row.ele.appendTo(wrpRows);
		};

		if (this._state.spellcasting) this._state.spellcasting.forEach(sc => doAddTrait(sc));

		return row;
	}

	__getSpellcastingInput__getTraitRow (traitRows, doUpdateState, trait) {
		const getState = () => {
			const out = {
				name: iptName.val().trim(),
			};

			if (btnToggleHeader.hasClass("active")) out.headerEntries = UiUtil.getTextAsEntries(iptHeader.val());
			if (out.headerEntries && !out.headerEntries.length) delete out.headerEntries;
			if (btnToggleFooter.hasClass("active")) out.footerEntries = UiUtil.getTextAsEntries(iptFooter.val());
			if (out.footerEntries && !out.footerEntries.length) delete out.footerEntries;

			const displayAs = selDisplayAs.val();
			if (displayAs !== "trait") out.displayAs = displayAs;

			if (btnToggleHide.hasClass("active")) {
				if (compHidden._state.hidden?.length) out.hidden = [...compHidden._state.hidden];
			}

			const deepMerge = (target, k, v) => {
				const curr = target[k];
				if (curr == null) target[k] = v;
				else {
					if (typeof v === "object") {
						if (v instanceof Array) target[k] = curr.concat(v);
						else Object.entries(v).forEach(([kSub, vSub]) => deepMerge(curr, kSub, vSub));
					}
				}
			};

			spellRows.forEach(sr => {
				const rowState = sr.getState(); // returns part of a "spellcasting" item; e.g. `{daily: {1e: [...]} }`
				if (rowState == null) return;

				Object.entries(rowState).forEach(([k, v]) => deepMerge(out, k, v));
			});

			SpellcastingTraitConvert.mutSpellcastingAbility(out);

			if (!Object.keys(out).some(it => it !== "name")) return null;

			return out;
		};

		const spellRows = [];
		const doAddSpellRow = (meta, data) => {
			const row = this.__getSpellcastingInput__getSpellGenericRow(spellRows, doUpdateState, meta, data);
			spellRows.push(row);
			row.ele.appendTo(wrpSubRows);
		};

		const iptName = ee`<input class="form-control form-control--minimal input-xs mr-2" placeholder="Trait name">`
			.onn("change", () => doUpdateState());
		iptName.val(trait ? trait.name : "Spellcasting");

		const btnToggleHeader = ee`<button class="ve-btn ve-btn-xs ve-btn-default mr-2">Header</button>`
			.onn("click", () => {
				btnToggleHeader.toggleClass("active");
				iptHeader.toggleVe(btnToggleHeader.hasClass("active"));
				doUpdateState();
			})
			.toggleClass("active", !!(trait && trait.headerEntries));

		const btnToggleFooter = ee`<button class="ve-btn ve-btn-xs ve-btn-default mr-2">Footer</button>`
			.onn("click", () => {
				btnToggleFooter.toggleClass("active");
				iptFooter.toggleVe(btnToggleFooter.hasClass("active"));
				doUpdateState();
			})
			.toggleClass("active", !!(trait && trait.footerEntries));

		const _CONTEXT_ENTRIES = [
			{
				display: "Cantrips",
				type: "spells",
				mode: "cantrip",
			},
			{
				display: "\uD835\uDC65th level spells",
				type: "spells",
				mode: "level",
			},
			null,
			{
				display: "Constant effects",
				type: "constant",
				mode: "basic",
			},
			{
				display: "At will spells",
				type: "will",
				mode: "basic",
			},
			{
				display: "\uD835\uDC65/day (/each) spells",
				type: "daily",
				mode: "frequency",
			},
			null,
			{
				display: "\uD835\uDC65/rest (/each) spells",
				type: "rest",
				mode: "frequency",
			},
			{
				display: "\uD835\uDC65/long rest (/each) spells",
				type: "restLong",
				mode: "frequency",
			},
			{
				display: "\uD835\uDC65/week (/each) spells",
				type: "weekly",
				mode: "frequency",
			},
			{
				display: "\uD835\uDC65/month (/each) spells",
				type: "monthly",
				mode: "frequency",
			},
			{
				display: "\uD835\uDC65/year (/each) spells",
				type: "yearly",
				mode: "frequency",
			},
			null,
			{
				display: "\uD835\uDC65/legendary action(s) (/each) spells",
				type: "legendary",
				mode: "frequency",
			},
		];
		const _SPELL_PROP_LOOKUP = Object.fromEntries(
			_CONTEXT_ENTRIES
				.filter(Boolean)
				.map(({type, display}) => [type, display]),
		);
		_SPELL_PROP_LOOKUP["spells"] = "Cantrips and \uD835\uDC65th level spells";

		const menu = ContextUtil.getMenu(_CONTEXT_ENTRIES.map(contextMeta => {
			if (contextMeta == null) return;

			return new ContextUtil.Action(
				contextMeta.display,
				async () => {
					// prevent double-adding
					switch (contextMeta.type) {
						case "constant":
						case "will":
							if (spellRows.some(it => it.type === contextMeta.type)) return;
							break;
					}

					const meta = {mode: contextMeta.mode, type: contextMeta.type};
					if (contextMeta.mode === "level") {
						const level = await InputUiUtil.pGetUserNumber({min: 1, int: true, title: "Enter Spell Level"});
						if (level == null) return;
						meta.level = level;
					}

					// prevent double-adding, round 2
					switch (contextMeta.mode) {
						case "cantrip":
						case "level":
							if (spellRows.some(it => it.type === meta.level)) return;
							break;
					}

					doAddSpellRow(meta);
					doUpdateState();
				},
			);
		}));

		const btnAddSpell = ee`<button class="ve-btn ve-btn-xs ve-btn-default">Add...</button>`
			.onn("click", (evt) => ContextUtil.pOpenMenu(evt, menu));

		const iptHeader = ee`<textarea class="form-control form-control--minimal resize-vertical mb-2" placeholder="Header text"></textarea>`
			.toggleVe(!!(trait && trait.headerEntries))
			.onn("change", () => doUpdateState());
		if (trait && trait.headerEntries) iptHeader.val(UiUtil.getEntriesAsText(trait.headerEntries));

		const iptFooter = ee`<textarea class="form-control form-control--minimal resize-vertical mb-2" placeholder="Footer text"></textarea>`
			.toggleVe(!!(trait && trait.footerEntries))
			.onn("change", () => doUpdateState());
		if (trait && trait.footerEntries) iptFooter.val(UiUtil.getEntriesAsText(trait.footerEntries));

		const selDisplayAs = ee`<select class="form-control input-xs mr-2">${Renderer.monster.CHILD_PROPS__SPELLCASTING_DISPLAY_AS.map(prop => `<option value="${prop}">${prop.uppercaseFirst()}</option>`).join("")}</select>`
			.onn("change", () => doUpdateState());
		if (trait) selDisplayAs.val(trait.displayAs || "trait");

		const compHidden = new class extends BaseComponent {
			renderInputHidden () {
				return ComponentUiUtil.getPickEnum(
					this,
					"hidden",
					{
						values: Object.keys(_SPELL_PROP_LOOKUP),
						fnGet$ElePill: v => _SPELL_PROP_LOOKUP[v],
						fnGetTextContextAction: v => _SPELL_PROP_LOOKUP[v],
					},
				);
			}

			_getDefaultState () { return { hidden: [] }; }
		}();
		const stgHidden = ee`<div class="ve-flex-col mb-2">
			<div class="ve-flex-v-center mb-2"><span class="mr-2 mkbru__sub-name--33">Hidden</span>${compHidden.renderInputHidden()}</div>
		</div>`
			.toggleVe(!!trait?.hidden?.length);
		if (trait?.hidden?.length) {
			compHidden._state.hidden = [...trait.hidden];
		}
		compHidden._addHookAll("state", () => doUpdateState());

		const btnToggleHide = ee`<button class="ve-btn ve-btn-xs ve-btn-default" title="Hide spells of a given type. This is often used when spells are presented as part of the header text.">Hide...</button>`
			.onn("click", () => {
				btnToggleHide.toggleClass("active");
				stgHidden.toggleVe(btnToggleHide.hasClass("active"));
				doUpdateState();
			})
			.toggleClass("active", !!(trait && trait.hidden?.length));

		const wrpControls = ee`<div class="ve-flex-v-center mb-2">${iptName}${btnToggleHeader}${btnToggleFooter}${btnAddSpell}</div>`;
		const wrpSubRows = ee`<div class="ve-flex-col"></div>`;
		const wrpSubRowsOuter = ee`<div class="ve-flex-col">${iptHeader}${wrpSubRows}${iptFooter}</div>`;

		const btnRemove = ee`<button class="ve-btn ve-btn-xs ve-btn-danger" title="Remove Trait"><span class="glyphicon glyphicon-trash"></span></button>`
			.onn("click", async () => {
				const currState = getState();
				if (currState) {
					delete currState.name; // ignore name key
					if ((currState.headerEntries || currState.footerEntries || Object.keys(currState).some(it => it !== "headerEntries" && it !== "footerEntries"))) {
						if (!await InputUiUtil.pGetUserBoolean({title: "Remove Trait", htmlDescription: "Are you sure?", textYes: "Yes", textNo: "Cancel"})) return;
					}
				}

				traitRows.splice(traitRows.indexOf(out), 1);
				ele.empty().remove();
				doUpdateState();
			});

		const ele = ee`<div class="ve-flex-col mkbru__wrp-rows">
		${wrpControls}
		<div class="ve-flex-v-center mb-2"><span class="mr-2 mkbru__sub-name--33">Display As</span>${selDisplayAs}${btnToggleHide}</div>
		${stgHidden}
		${wrpSubRowsOuter}
		<div class="ve-text-right mb-2">${btnRemove}</div>
		</div>`;

		if (trait) {
			const handleFrequency = prop => Object.entries(trait[prop])
				.forEach(([k, v]) => doAddSpellRow({mode: "frequency", type: prop, each: k.endsWith("e"), count: Number(k[0])}, v));

			if (trait.constant) doAddSpellRow({mode: "basic", type: "constant"}, trait.constant);
			if (trait.will) doAddSpellRow({mode: "basic", type: "will"}, trait.will);
			if (trait.daily) handleFrequency("daily");
			if (trait.rest) handleFrequency("rest");
			if (trait.restLong) handleFrequency("restLong");
			if (trait.weekly) handleFrequency("weekly");
			if (trait.monthly) handleFrequency("monthly");
			if (trait.yearly) handleFrequency("yearly");
			if (trait.legendary) handleFrequency("legendary");
			if (trait.spells) {
				Object.entries(trait.spells).forEach(([k, v]) => {
					const level = Number(k);
					if (k === "0") doAddSpellRow({mode: "cantrip", type: level}, v.spells);
					else doAddSpellRow({mode: "level", type: level, lower: v.lower, slots: v.slots, level}, v.spells);
				});
			}
		}

		const out = {ele, getState};
		return out;
	}

	__getSpellcastingInput__getSpellGenericRow (spellRows, doUpdateState, meta, data) {
		const setValueByPath = (root, keyPath, value) => {
			for (let i = 0; i < keyPath.length - 1; ++i) root = (root[keyPath[i]] = root[keyPath[i]] || {});
			root[keyPath.last()] = value;
		};

		const rowItems = [];
		const getState = () => {
			const childState = rowItems.map(ri => ri.getState());
			if (childState.length) {
				const keyPath = metaPart.getKeyPath();
				const out = {};
				setValueByPath(out, keyPath, childState);

				if (metaPart.getAdditionalData) {
					const additionalData = metaPart.getAdditionalData();
					additionalData.filter(it => it.value != null).forEach(it => setValueByPath(out, it.keyPath, it.value));
				}

				return out;
			} else return null;
		};

		const wrpItems = ee`<div class="ve-flex-col"></div>`;

		const btnAdd = ee`<button class="ve-btn ve-btn-xxs ve-btn-default mr-2" title="Add Spell"><span class="glyphicon glyphicon-plus"></span></button>`
			.onn("click", async () => {
				const options = {styleHint: this._meta.styleHint};

				if (meta.level) options.level = meta.level;
				if (meta.mode === "cantrip") options.level = 0;

				if (metaPart.filterIgnoreLevel && metaPart.filterIgnoreLevel()) delete options.level;

				const spell = await SearchWidget.pGetUserSpellSearch(options);
				if (spell) {
					addItem(spell.tag);
					doUpdateState();
				}
			});

		const btnRemove = ee`<button class="ve-btn ve-btn-xxs ve-btn-danger" title="Remove Spell Group"><span class="glyphicon glyphicon-trash"></span></button>`
			.onn("click", () => {
				spellRows.splice(spellRows.indexOf(out), 1);
				ele.empty().remove();
				doUpdateState();
			});

		const addItem = spell => {
			const item = CreatureBuilder.__getSpellcastingInput__getSpellGenericRow__getRowItem(rowItems, doUpdateState, spell);
			rowItems.push(item);

			// sort the rows and re-arrange them as required
			rowItems.forEach(it => it._sortString = Renderer.stripTags(it.getState())); // should always return an entry string
			rowItems.sort((a, b) => SortUtil.ascSortLower(a._sortString, b._sortString) || b.order - a.order)
				.forEach(rowItem => {
					rowItem.ele.detach();
					wrpItems.appends(rowItem.ele);
				});
		};

		const metaPart = (() => {
			const out = {};

			switch (meta.mode) {
				case "basic": {
					out.ele = ee`<i>${meta.type === "constant" ? "Constant Effects" : "At Will"}</i>`;
					out.getKeyPath = () => [meta.type];
					break;
				}

				case "frequency": {
					const iptFreq = ee`<input class="form-control form-control--minimal input-xs mkbru_mon__spell-header-ipt" min="1" max="9">`
						.onn("change", () => doUpdateState());
					if (data) iptFreq.val(meta.count || 1);
					else iptFreq.val(1);

					const cbEach = ee`<input class="mkbru__ipt-cb mkbru__ipt-cb--small-offset" type="checkbox">`
						.prop("checked", !!(data && meta.each))
						.onn("change", () => doUpdateState());

					const name = (() => {
						switch (meta.type) {
							case "daily": return "/Day";
							case "rest": return "/Rest";
							case "restLong": return "/Long Rest";
							case "weekly": return "/Week";
							case "monthly": return "/Month";
							case "yearly": return "/Year";
							case "legendary": return "/Legendary Action(s)";
						}
					})();

					out.ele = ee`<div class="ve-flex mkbru_mon__spell-header-wrp mr-4">
					${iptFreq}
					<span class="mr-2 italic">${name}</span>
					<label class="ve-flex-v-baseline ve-muted small ml-auto"><span class="mr-1">(Each? </span>${cbEach}<span>)</span></label>
					</div>`;

					out.getKeyPath = () => [meta.type, `${UiUtil.strToInt(iptFreq.val(), 1, {fallbackOnNaN: 1, min: 1, max: 9})}${cbEach.prop("checked") ? "e" : ""}`];

					break;
				}

				case "cantrip": {
					out.ele = ee`<i>Cantrips</i>`;
					out.getKeyPath = () => ["spells", "0", "spells"];
					break;
				}

				case "level": {
					const iptSlots = ee`<input class="form-control form-control--minimal input-xs mkbru_mon__spell-header-ipt mr-2">`
						.val(meta.slots || 0)
						.onn("change", () => doUpdateState());

					const cbWarlock = ee`<input type="checkbox" class="mkbru__ipt-cb">`
						.prop("checked", !!meta.lower)
						.onn("change", () => doUpdateState());

					out.ele = ee`<div class="ve-flex mkbru_mon__spell-header-wrp mr-4">
					<div class="italic">${Parser.spLevelToFull(meta.level)}-level Spells</div>
					<div class="ve-flex-v-center ve-muted small ml-auto"><span>(</span>${iptSlots}<span class="mr-2">Slots</span></div>
					<div class="mkbru_mon__spell-header-divider mr-2"></div>
					<label class="ve-flex-v-center ve-muted small"><span class="mr-1">Warlock?</span>${cbWarlock}<span>)</span></label>
					</div>`;
					out.getKeyPath = () => ["spells", `${meta.level}`, "spells"];
					out.getAdditionalData = () => {
						return [
							{
								keyPath: ["spells", `${meta.level}`, "slots"],
								value: UiUtil.strToInt(iptSlots.val()),
							},
							{
								keyPath: ["spells", `${meta.level}`, "lower"],
								value: cbWarlock.prop("checked") ? 1 : null,
							},
						];
					};
					out.filterIgnoreLevel = () => cbWarlock.prop("checked");
				}
			}

			return out;
		})();

		const ele = ee`<div class="ve-flex-col">
		<div class="split ve-flex-v-center mb-2">
			${metaPart.ele}
			<div class="ve-flex-v-center mkbru__wrp-btn-xxs">${btnAdd}${btnRemove}</div>
		</div>
		${wrpItems}
		<div class="mkbru_mon__spell-divider mb-2"></div>
		</div>`;

		if (data) data.forEach(spell => addItem(spell));

		const out = {ele, getState, type: meta.type};
		return out;
	}

	static __getSpellcastingInput__getSpellGenericRow__getRowItem (rowItems, doUpdateState, spellEntry) {
		const getHtml = () => `&bull; ${Renderer.get().render(spellEntry)}`;

		const iptSpell = ee`<input class="form-control form-control--minimal input-xs mr-2">`
			.val(spellEntry)
			.onn("change", () => {
				spellEntry = iptSpell.val();
				wrpRender.html(getHtml());
				doUpdateState();
			})
			.hideVe();

		const btnToggleEdit = ee`<button class="ve-btn ve-btn-xxs ve-btn-default mr-2" title="Toggle Edit Mode"><span class="glyphicon glyphicon-pencil"></span></button>`
			.onn("click", () => {
				btnToggleEdit.toggleClass("active");
				iptSpell.toggleVe(btnToggleEdit.hasClass("active"));
				wrpRender.toggleVe(!btnToggleEdit.hasClass("active"));
			});

		const wrpRender = ee`<div class="mr-2">${getHtml()}</div>`;

		const btnRemove = ee`<button class="ve-btn ve-btn-xxs ve-btn-danger" title="Remove Spell"><span class="glyphicon glyphicon-trash"></span></button>`
			.onn("click", () => {
				rowItems.splice(rowItems.indexOf(out), 1);
				ele.empty().remove();
				doUpdateState();
			});

		const ele = ee`<div class="split ve-flex-v-center mb-2 mkbru_mon__spell-wrp-edit">
		${wrpRender}${iptSpell}
		<div class="ve-flex-v-center mkbru__wrp-btn-xxs">${btnToggleEdit}${btnRemove}</div>
		</div>`;

		const getState = () => spellEntry;

		const out = {ele, getState, order: CreatureBuilder._rowSortOrder++};
		return out;
	}

	__getTraitInput (cb) {
		return this.__getGenericEntryInput(cb, {
			name: "Traits",
			shortName: "Trait",
			prop: "trait",
			canReorder: false,
			generators: [
				{
					name: "Add Predefined Trait",
					action: () => {
						let traitIndex;
						return new Promise(resolve => {
							const searchWidget = new SearchWidget(
								{Trait: this._indexedTraits},
								async (ix) => {
									traitIndex = ix;
									doClose(true);
								},
								{
									defaultCategory: "Trait",
									searchOptions: {
										fields: {
											n: {boost: 5, expand: true},
										},
										expand: true,
									},
									fnTransform: (doc) => doc.id,
								},
							);
							const {eleModalInner, doClose} = UiUtil.getShowModal({
								title: "Select a Trait",
								cbClose: (isDataEntered) => {
									searchWidget.$wrpSearch.detach();
									if (!isDataEntered) return resolve(null);
									const trait = MiscUtil.copyFast(this._jsonCreatureTraits[traitIndex]);
									trait.entries = DataUtil.generic.variableResolver.resolve({obj: trait.entries, ent: this._state});
									resolve(trait);
									resolve(trait);
								},
							});
							eleModalInner.appends(searchWidget.$wrpSearch[0]);
							searchWidget.doFocus();
						});
					},
				},
			],
		});
	}

	__getActionInput (cb) {
		return this.__getGenericEntryInput(cb,
			{
				name: "Actions",
				shortName: "Action",
				prop: "action",
				generators: [
					{
						name: "Generate Attack",
						action: () => {
							return new Promise(resolve => {
								const {eleModalInner, doClose} = UiUtil.getShowModal({
									title: "Generate Attack",
									cbClose: (isDataEntered) => {
										this._generateAttackCache = getState();
										if (!isDataEntered) return resolve(null);
										const data = getFormData();
										if (!data) return resolve(null);
										resolve(data);
									},
									isUncappedHeight: true,
								});

								const iptName = ee`<input class="form-control form-control--minimal input-xs mr-2" placeholder="Weapon">`;
								const cbMelee = ee`<input type="checkbox" class="mkbru__ipt-cb--plain">`
									.onn("change", () => stageMelee.toggleVe(cbMelee.prop("checked")))
									.prop("checked", true);
								const cbRanged = ee`<input type="checkbox" class="mkbru__ipt-cb--plain">`
									.onn("change", () => stageRanged.toggleVe(cbRanged.prop("checked")));
								const cbFinesse = ee`<input type="checkbox" class="mkbru__ipt-cb--plain">`;
								const cbVersatile = ee`<input type="checkbox" class="mkbru__ipt-cb--plain">`
									.onn("change", () => stageVersatile.toggleVe(cbVersatile.prop("checked")));
								const cbBonusDamage = ee`<input type="checkbox" class="mkbru__ipt-cb--plain">`
									.onn("change", () => stageBonusDamage.toggleVe(cbBonusDamage.prop("checked")));

								const iptMeleeRange = ee`<input class="form-control form-control--minimal input-xs" value="5">`;
								const iptMeleeDamDiceCount = ee`<input class="form-control form-control--minimal input-xs mr-2 mkbru_mon__ipt-attack-dice" placeholder="Number of Dice" min="1" value="1">`;
								const iptMeleeDamDiceNum = ee`<input class="form-control form-control--minimal input-xs mr-2 mkbru_mon__ipt-attack-dice" placeholder="Dice Type" value="6">`;
								const iptMeleeDamBonus = ee`<input class="form-control form-control--minimal input-xs mr-2" placeholder="+X (additional bonus damage)">`;
								const iptMeleeDamType = ee`<input class="form-control form-control--minimal input-xs" placeholder="Melee Damage Type" autocomplete="off">`;
								$(iptMeleeDamType).typeahead({source: Parser.DMG_TYPES});
								const stageMelee = ee`<div class="ve-flex-col"><hr class="hr-3">
								<div class="bold mb-2">Melee</div>
								<div class="ve-flex-v-center mb-2"><span class="mr-2 no-shrink">Melee Range (ft.)</span>${iptMeleeRange}</div>
								<div class="ve-flex-v-center mb-2">${iptMeleeDamDiceCount}<span class="mr-2">d</span>${iptMeleeDamDiceNum}${iptMeleeDamBonus}${iptMeleeDamType}</div>
								</div>`;

								const iptRangedShort = ee`<input class="form-control form-control--minimal input-xs mr-2">`;
								const iptRangedLong = ee`<input class="form-control form-control--minimal input-xs">`;
								const iptRangedDamDiceCount = ee`<input class="form-control form-control--minimal input-xs mr-2 mkbru_mon__ipt-attack-dice" placeholder="Number of Dice" min="1" value="1">`;
								const iptRangedDamDiceNum = ee`<input class="form-control form-control--minimal input-xs mr-2 mkbru_mon__ipt-attack-dice" placeholder="Dice Type" value="6">`;
								const iptRangedDamBonus = ee`<input class="form-control form-control--minimal input-xs mr-2" placeholder="+X (additional bonus damage)">`;
								const iptRangedDamType = ee`<input class="form-control form-control--minimal input-xs" placeholder="Ranged Damage Type">`;
								$(iptRangedDamType).typeahead({source: Parser.DMG_TYPES});
								const stageRanged = ee`<div class="ve-flex-col"><hr class="hr-3">
								<div class="bold mb-2">Ranged</div>
								<div class="ve-flex-v-center mb-2">
									<span class="mr-2 no-shrink">Short Range (ft.)</span>${iptRangedShort}
									<span class="mr-2 no-shrink">Long Range (ft.)</span>${iptRangedLong}
								</div>
								<div class="ve-flex-v-center mb-2">${iptRangedDamDiceCount}<span class="mr-2">d</span>${iptRangedDamDiceNum}${iptRangedDamBonus}${iptRangedDamType}</div>
								</div>`.hideVe();

								const iptVersatileDamDiceCount = ee`<input class="form-control form-control--minimal input-xs mr-2 mkbru_mon__ipt-attack-dice" placeholder="Number of Dice" min="1" value="1">`;
								const iptVersatileDamDiceNum = ee`<input class="form-control form-control--minimal input-xs mr-2 mkbru_mon__ipt-attack-dice" placeholder="Dice Type" value="8">`;
								const iptVersatileDamBonus = ee`<input class="form-control form-control--minimal input-xs mr-2" placeholder="+X (additional bonus damage)">`;
								const iptVersatileDamType = ee`<input class="form-control form-control--minimal input-xs" placeholder="Two-Handed Damage Type">`;
								$(iptVersatileDamType).typeahead({source: Parser.DMG_TYPES});
								const stageVersatile = ee`<div class="ve-flex-col"><hr class="hr-3">
								<div class="bold mb-2">Versatile Damage</div>
								<div class="ve-flex-v-center mb-2">${iptVersatileDamDiceCount}<span class="mr-2">d</span>${iptVersatileDamDiceNum}${iptVersatileDamBonus}${iptVersatileDamType}</div>
								</div>`.hideVe();

								const iptBonusDamDiceCount = ee`<input class="form-control form-control--minimal input-xs mr-2 mkbru_mon__ipt-attack-dice" placeholder="Number of Dice" min="1" value="1">`;
								const iptBonusDamDiceNum = ee`<input class="form-control form-control--minimal input-xs mr-2 mkbru_mon__ipt-attack-dice" placeholder="Dice Type" value="6">`;
								const iptBonusDamBonus = ee`<input class="form-control form-control--minimal input-xs mr-2" placeholder="+X (additional bonus damage)">`;
								const iptBonusDamType = ee`<input class="form-control form-control--minimal input-xs" placeholder="Bonus Damage Type">`;
								$(iptBonusDamType).typeahead({source: Parser.DMG_TYPES});
								const stageBonusDamage = ee`<div class="ve-flex-col"><hr class="hr-3">
								<div class="bold mb-2">Bonus Damage</div>
								<div class="ve-flex-v-center mb-2">${iptBonusDamDiceCount}<span class="mr-2">d</span>${iptBonusDamDiceNum}${iptBonusDamBonus}${iptBonusDamType}</div>
								</div>`.hideVe();

								const btnConfirm = ee`<button class="ve-btn ve-btn-sm ve-btn-default mr-2">Add</button>`
									.onn("click", () => {
										if (!cbMelee.prop("checked") && !cbRanged.prop("checked")) {
											return JqueryUtil.doToast({type: "warning", content: "At least one of 'Melee' or 'Ranged' must be selected!"});
										} else doClose(true);
									});

								const btnReset = ee`<button class="ve-btn ve-btn-sm ve-btn-danger">Reset</button>`
									.onn("click", async () => {
										if (!await InputUiUtil.pGetUserBoolean({title: "Reset", htmlDescription: "Are you sure?", textYes: "Yes", textNo: "Cancel"})) return;

										setState({
											iptName: "",
											cbMelee: true,
											cbRanged: false,
											cbFinesse: false,
											cbVersatile: false,
											cbBonusDamage: false,
											iptMeleeRange: "5",
											iptMeleeDamDiceCount: "1",
											iptMeleeDamDiceNum: "6",
											iptMeleeDamBonus: "",
											iptMeleeDamType: "",
											iptRangedShort: "",
											iptRangedLong: "",
											iptRangedDamDiceCount: "1",
											iptRangedDamDiceNum: "6",
											iptRangedDamBonus: "",
											iptRangedDamType: "",
											iptVersatileDamDiceCount: "1",
											iptVersatileDamDiceNum: "8",
											iptVersatileDamBonus: "",
											iptVersatileDamType: "",
											iptBonusDamDiceCount: "1",
											iptBonusDamDiceNum: "6",
											iptBonusDamBonus: "",
											iptBonusDamType: "",
										});
									});

								const getFormData = () => {
									const pb = this._getProfBonus();
									const isDex = cbFinesse.prop("checked") || (cbRanged.prop("checked") && !cbMelee.prop("checked"));
									const abilMod = Parser.getAbilityModNumber(Renderer.monster.getSafeAbilityScore(this._state, isDex ? "dex" : "str", {defaultScore: 10}));
									const [melee, ranged] = [cbMelee.prop("checked") ? "mw" : false, cbRanged.prop("checked") ? "rw" : false];

									const ptAtk = `{@atk ${[melee ? "mw" : null, ranged ? "rw" : null].filter(Boolean).join(",")}}`;
									const ptHit = `{@hit ${pb + abilMod}} to hit`;
									const ptRange = [
										melee ? `reach ${UiUtil.strToInt(iptMeleeRange.val(), 5, {fallbackOnNaN: 5})} ft.` : null,
										ranged ? (() => {
											const vShort = UiUtil.strToInt(iptRangedShort.val(), null, {fallbackOnNaN: null});
											const vLong = UiUtil.strToInt(iptRangedLong.val(), null, {fallbackOnNaN: null});
											if (!vShort && !vLong) return `unlimited range`;
											if (!vShort) return `range ${vLong}/${vLong} ft.`;
											if (!vLong) return `range ${vShort}/${vShort} ft.`;
											return `range ${vShort}/${vLong} ft.`;
										})() : null,
									].filter(Boolean).join(" or ");

									const getDamageDicePt = (iptNum, iptFaces, iptBonus, isSkipAbilMod) => {
										const num = UiUtil.strToInt(iptNum.val(), 1, {fallbackOnNaN: 1});
										const faces = UiUtil.strToInt(iptFaces.val(), 6, {fallbackOnNaN: 6});
										const bonusVal = UiUtil.strToInt(iptBonus.val());
										const totalBonus = (isSkipAbilMod ? 0 : abilMod) + bonusVal;
										return `${Math.floor(num * ((faces + 1) / 2)) + (totalBonus || 0)} ({@damage ${num}d${faces}${totalBonus ? ` ${UiUtil.intToBonus(totalBonus).replace(/([-+])/g, "$1 ")}` : ``}})`;
									};
									const getDamageTypePt = (ipDamType) => ipDamType.val().trim() ? ` ${ipDamType.val().trim()}` : "";
									const ptDamage = [
										cbMelee.prop("checked") ? `${getDamageDicePt(iptMeleeDamDiceCount, iptMeleeDamDiceNum, iptMeleeDamBonus)}${getDamageTypePt(iptMeleeDamType)} damage${cbRanged.prop("checked") ? ` in melee` : ""}` : null,
										cbRanged.prop("checked") ? `${getDamageDicePt(iptRangedDamDiceCount, iptRangedDamDiceNum, iptRangedDamBonus)}${getDamageTypePt(iptRangedDamType)} damage${cbMelee.prop("checked") ? ` at range` : ""}` : null,
										cbVersatile.prop("checked") ? `${getDamageDicePt(iptVersatileDamDiceCount, iptVersatileDamDiceNum, iptVersatileDamBonus)}${getDamageTypePt(iptVersatileDamType)} damage if used with both hands` : null,
									].filter(Boolean).join(", or ");
									const ptDamageFull = cbBonusDamage.prop("checked") ? `${ptDamage}, plus ${getDamageDicePt(iptBonusDamDiceCount, iptBonusDamDiceNum, iptBonusDamBonus, true)}${getDamageTypePt(iptBonusDamType)} damage` : ptDamage;

									return {
										name: iptName.val().trim() || "Unarmed Strike",
										entries: [
											`${ptAtk} ${ptHit}, ${ptRange}, one target. {@h}${ptDamageFull}.`,
										],
									};
								};

								const getState = () => ({
									iptName: iptName.val(),
									cbMelee: cbMelee.prop("checked"),
									cbRanged: cbRanged.prop("checked"),
									cbFinesse: cbFinesse.prop("checked"),
									cbVersatile: cbVersatile.prop("checked"),
									cbBonusDamage: cbBonusDamage.prop("checked"),
									iptMeleeRange: iptMeleeRange.val(),
									iptMeleeDamDiceCount: iptMeleeDamDiceCount.val(),
									iptMeleeDamDiceNum: iptMeleeDamDiceNum.val(),
									iptMeleeDamBonus: iptMeleeDamBonus.val(),
									iptMeleeDamType: iptMeleeDamType.val(),
									iptRangedShort: iptRangedShort.val(),
									iptRangedLong: iptRangedLong.val(),
									iptRangedDamDiceCount: iptRangedDamDiceCount.val(),
									iptRangedDamDiceNum: iptRangedDamDiceNum.val(),
									iptRangedDamBonus: iptRangedDamBonus.val(),
									iptRangedDamType: iptRangedDamType.val(),
									iptVersatileDamDiceCount: iptVersatileDamDiceCount.val(),
									iptVersatileDamDiceNum: iptVersatileDamDiceNum.val(),
									iptVersatileDamBonus: iptVersatileDamBonus.val(),
									iptVersatileDamType: iptVersatileDamType.val(),
									iptBonusDamDiceCount: iptBonusDamDiceCount.val(),
									iptBonusDamDiceNum: iptBonusDamDiceNum.val(),
									iptBonusDamBonus: iptBonusDamBonus.val(),
									iptBonusDamType: iptBonusDamType.val(),
								});

								const setState = (state) => {
									iptName.val(state.iptName);
									cbMelee.prop("checked", !!state.cbMelee).trigger("change");
									cbRanged.prop("checked", !!state.cbRanged).trigger("change");
									cbFinesse.prop("checked", !!state.cbFinesse).trigger("change");
									cbVersatile.prop("checked", !!state.cbVersatile).trigger("change");
									cbBonusDamage.prop("checked", !!state.cbBonusDamage).trigger("change");
									iptMeleeRange.val(state.iptMeleeRange);
									iptMeleeDamDiceCount.val(state.iptMeleeDamDiceCount);
									iptMeleeDamDiceNum.val(state.iptMeleeDamDiceNum);
									iptMeleeDamBonus.val(state.iptMeleeDamBonus);
									iptMeleeDamType.val(state.iptMeleeDamType);
									iptRangedShort.val(state.iptRangedShort);
									iptRangedLong.val(state.iptRangedLong);
									iptRangedDamDiceCount.val(state.iptRangedDamDiceCount);
									iptRangedDamDiceNum.val(state.iptRangedDamDiceNum);
									iptRangedDamBonus.val(state.iptRangedDamBonus);
									iptRangedDamType.val(state.iptRangedDamType);
									iptVersatileDamDiceCount.val(state.iptVersatileDamDiceCount);
									iptVersatileDamDiceNum.val(state.iptVersatileDamDiceNum);
									iptVersatileDamBonus.val(state.iptVersatileDamBonus);
									iptVersatileDamType.val(state.iptVersatileDamType);
									iptBonusDamDiceCount.val(state.iptBonusDamDiceCount);
									iptBonusDamDiceNum.val(state.iptBonusDamDiceNum);
									iptBonusDamBonus.val(state.iptBonusDamBonus);
									iptBonusDamType.val(state.iptBonusDamType);
								};

								if (this._generateAttackCache) setState(this._generateAttackCache);

								ee`<div class="ve-flex-col">
								<div class="ve-flex-v-center mb-2">
									${iptName}
									<label class="ve-flex-v-center mr-2"><span class="mr-2">Melee</span>${cbMelee}</label>
									<label class="ve-flex-v-center"><span class="mr-2">Ranged</span>${cbRanged}</label>
								</div>
								<div class="ve-flex-v-center">
									<label class="ve-flex-v-center mr-2"><span class="mr-2">Finesse</span>${cbFinesse}</label>
									<label class="ve-flex-v-center mr-2"><span class="mr-2">Versatile</span>${cbVersatile}</label>
									<label class="ve-flex-v-center"><span class="mr-2">Bonus Damage</span>${cbBonusDamage}</label>
								</div>
								${stageMelee}
								${stageRanged}
								${stageVersatile}
								${stageBonusDamage}
								<div class="ve-flex-v-center ve-flex-h-right mt-2 pb-1 px-1">${btnConfirm}${btnReset}</div>
								</div>`.appendTo(eleModalInner);
							});
						},
					},
					{
						name: "Add Predefined Action",
						action: () => {
							let actionIndex;
							return new Promise(resolve => {
								const searchWidget = new SearchWidget(
									{Action: this._indexedActions},
									async (ix) => {
										actionIndex = ix;
										doClose(true);
									},
									{
										defaultCategory: "Action",
										searchOptions: {
											fields: {
												n: {boost: 5, expand: true},
											},
											expand: true,
										},
										fnTransform: (doc) => doc.id,
									},
								);
								const {eleModalInner, doClose} = UiUtil.getShowModal({
									title: "Select an Action",
									cbClose: (isDataEntered) => {
										searchWidget.$wrpSearch.detach();
										if (!isDataEntered) return resolve(null);
										const action = MiscUtil.copyFast(this._jsonCreatureActions[actionIndex]);
										const isFinesse = action.entriesFinesse && this._state.dex > this._state.str;
										action.entries = DataUtil.generic.variableResolver.resolve({
											obj: isFinesse ? action.entriesFinesse : action.entries,
											ent: this._state,
										});
										delete action.entriesFinesse;
										resolve(action);
									},
								});
								eleModalInner.appends(searchWidget.$wrpSearch[0]);
								searchWidget.doFocus();
							});
						},
					},
				],
			});
	}

	__getReactionInput (cb) {
		return this.__getGenericEntryInput(cb, {name: "Reactions", shortName: "Reaction", prop: "reaction"});
	}

	__getBonusActionInput (cb) {
		return this.__getGenericEntryInput(cb, {name: "Bonus Actions", shortName: "Bonus Action", prop: "bonus"});
	}

	__getLegendaryActionInput (cb) {
		return this.__getGenericEntryInput(cb, {name: "Legendary Actions", shortName: "Legendary Action", prop: "legendary"});
	}

	__getMythicActionInput (cb) {
		return this.__getGenericEntryInput(cb, {name: "Mythic Actions", shortName: "Mythic Action", prop: "mythic"});
	}

	__getGenericEntryInput (cb, options) {
		if (options.canReorder == null) options.canReorder = true;

		const [row, rowInner] = BuilderUi.getLabelledRowTuple(options.name, {isMarked: true});

		const doUpdateState = () => {
			const raw = entryRows.map(row => row.getState()).filter(Boolean);
			if (raw && raw.length) this._state[options.prop] = raw;
			else delete this._state[options.prop];
			cb();
		};

		const doUpdateOrder = !options.canReorder ? null : () => {
			entryRows.forEach(it => it.ele.detach().appendTo(wrpRows));
			doUpdateState();
		};

		const entryRows = [];

		const wrpRowsOuter = ee`<div class="relative"></div>`.appendTo(rowInner);
		const wrpRows = ee`<div></div>`.appendTo(wrpRowsOuter);
		const rowOptions = {prop: options.prop, shortName: options.shortName, wrpRowsOuter};

		const wrpBtnAdd = ee`<div></div>`.appendTo(rowInner);
		ee`<button class="ve-btn ve-btn-xs ve-btn-default">Add ${options.shortName}</button>`
			.appendTo(wrpBtnAdd)
			.onn("click", () => {
				this.__getGenericEntryInput__getEntryRow(doUpdateState, doUpdateOrder, rowOptions, entryRows).ele.appendTo(wrpRows);
				doUpdateState();
			});

		if (options.generators) {
			options.generators.forEach(gen => {
				ee`<button class="ve-btn ve-btn-xs ve-btn-default ml-2">${gen.name}</button>`
					.appendTo(wrpBtnAdd)
					.onn("click", async () => {
						const entry = await gen.action();
						if (entry != null) {
							this.__getGenericEntryInput__getEntryRow(doUpdateState, doUpdateOrder, rowOptions, entryRows, entry)
								.ele.appendTo(wrpRows);
							doUpdateState();
						}
					});
			});
		}

		if (this._state[options.prop]) this._state[options.prop].forEach(entry => this.__getGenericEntryInput__getEntryRow(doUpdateState, doUpdateOrder, rowOptions, entryRows, entry).ele.appendTo(wrpRows));

		return row;
	}

	__getGenericEntryInput__getEntryRow (doUpdateState, doUpdateOrder, options, entryRows, entry) {
		const out = {};

		const getState = () => {
			const out = {
				name: iptName.val().trim(),
				entries: UiUtil.getTextAsEntries(iptEntries.val()),
			};

			// additional state for variant inputs
			if (options.prop === "variant") out.type = "variant";
			if (sourceControls) {
				const rawSourceState = sourceControls.getState();
				if (rawSourceState) {
					out.source = rawSourceState.source;
					out.page = rawSourceState.page;
				}
			}

			if (!out.name || !out.entries || !out.entries.length) return null;

			// do post-processing
			RechargeConvert.tryConvertRecharge(out);
			DiceConvert.convertTraitActionDice(out);

			return out;
		};

		const iptName = ee`<input class="form-control form-control--minimal input-xs" placeholder="${options.shortName} name">`
			.onn("change", () => doUpdateState());
		if (entry && entry.name) iptName.val(entry.name.trim());

		const btnUp = doUpdateOrder ? BuilderUi.getUpButton(doUpdateOrder, entryRows, out) : null;

		const btnDown = doUpdateOrder ? BuilderUi.getDownButton(doUpdateOrder, entryRows, out) : null;

		const dragOrder = doUpdateOrder ? BuilderUi.getDragPad(doUpdateOrder, entryRows, out, {
			cbSwap: (swapee) => {
				// swap textarea dimensions to prevent flickering
				const cacheDim = {h: swapee.iptEntries.css("height")};
				swapee.iptEntries.css({height: out.iptEntries.css("height")});
				out.iptEntries.css({height: cacheDim.h});
			},
			wrpRowsOuter: options.wrpRowsOuter,
		}) : null;

		const iptEntries = ee`<textarea class="form-control form-control--minimal resize-vertical mb-2"></textarea>`
			.onn("change", () => doUpdateState());

		if (entry && entry.entries) iptEntries.val(UiUtil.getEntriesAsText(entry.entries));

		const btnRemove = ee`<button class="ve-btn ve-btn-xs ve-btn-danger mb-2" title="Remove ${options.shortName}"><span class="glyphicon glyphicon-trash"></span></button>`
			.onn("click", async () => {
				const currState = getState();
				if (currState && currState.entries) {
					if (!await InputUiUtil.pGetUserBoolean({title: `Remove ${options.shortName}`, htmlDescription: "Are you sure?", textYes: "Yes", textNo: "Cancel"})) return;
				}
				entryRows.splice(entryRows.indexOf(out), 1);
				ele.empty().remove();
				doUpdateState();
			});

		const sourceControls = options.prop === "variant" ? (() => {
			const getState = () => {
				const pageRaw = iptPage.val();
				const out = {
					source: selVariantSource.val().unescapeQuotes(),
					page: !isNaN(pageRaw) ? UiUtil.strToInt(pageRaw) : pageRaw,
				};
				if (!out.source) return null;
				if (!out.page) delete out.page;
				return out;
			};

			const selVariantSource = ee`<select class="form-control input-xs"><option value="">(Same as creature)</option></select>`
				.onn("change", () => doUpdateState());
			this._ui.allSources.forEach(srcJson => selVariantSource.appends(`<option value="${srcJson.escapeQuotes()}">${Parser.sourceJsonToFull(srcJson).escapeQuotes()}</option>`));

			const iptPage = ee`<input class="form-control form-control--minimal input-xs" min="0">`
				.onn("change", () => doUpdateState());

			if (entry && entry.source && BrewUtil2.hasSourceJson(entry.source)) {
				selVariantSource.val(entry.source);
				if (entry.page) iptPage.val(entry.page);
			}

			(this._eles.selVariantSources = this._eles.selVariantSources || []).push(selVariantSource);

			const ele = ee`<div class="ve-flex-col">
			<div class="ve-flex-v-center mb-2"><span class="mr-2 mkbru__sub-name--50">Source</span>${selVariantSource}</div>
			<div class="ve-flex-v-center mb-2"><span class="mr-2 mkbru__sub-name--50">Page</span>${iptPage}</div>
			</div>`;

			return {ele, getState};
		})() : null;

		const ele = ee`<div class="ve-flex-col mkbru__wrp-rows mkbru__wrp-rows--removable">
		<div class="split ve-flex-v-center mb-2">
			${iptName}
			<div class="ve-flex-v-center">${btnUp}${btnDown}${dragOrder}</div>
		</div>
		${sourceControls ? sourceControls.ele : null}
		<div class="ve-flex-v-center">${iptEntries}</div>
		<div class="ve-text-right">${btnRemove}</div>
		</div>`;

		out.ele = ele;
		out.getState = getState;
		out.iptEntries = iptEntries;
		entryRows.push(out);
		return out;
	}

	__getLegendaryGroupInput (cb) {
		const [row, rowInner] = BuilderUi.getLabelledRowTuple("Legendary Group");

		this._selLegendaryGroup = ee`<select class="form-control form-control--minimal input-xs"><option value="-1">None</option></select>`
			.onn("change", () => {
				const ix = Number(this._selLegendaryGroup.val());
				if (~ix) this._state.legendaryGroup = this._legendaryGroupCache[ix];
				else delete this._state.legendaryGroup;
				cb();
			})
			.appendTo(rowInner);

		this._legendaryGroupCache.filter(it => it.source).forEach((g, i) => this._selLegendaryGroup.appends(`<option value="${i}">${g.name}${g.source === Parser.SRC_MM ? "" : ` [${Parser.sourceJsonToAbv(g.source)}]`}</option>`));

		this._handleLegendaryGroupChange();

		return row;
	}

	async _pBuildLegendaryGroupCache () {
		DataUtil.monster.populateMetaReference({legendaryGroup: (await BrewUtil2.pGetBrewProcessed()).legendaryGroup || []});
		DataUtil.monster.populateMetaReference({legendaryGroup: (await BrewUtil2.pGetBrewProcessed()).legendaryGroup || []});

		const baseLegendaryGroups = Object.values(DataUtil.monster.legendaryGroupLookup).map(obj => Object.values(obj)).flat();
		this._legendaryGroups = [...baseLegendaryGroups];

		this._legendaryGroupCache = this._legendaryGroups
			.map(({name, source}) => ({name, source}))
			.sort((a, b) => SortUtil.ascSortLower(a.name, b.name) || SortUtil.ascSortLower(a.source, b.source));
	}

	_handleLegendaryGroupChange () {
		if (!this._selLegendaryGroup) return;

		if (this._state.legendaryGroup) {
			const ix = this._legendaryGroupCache.findIndex(it => it.name === this._state.legendaryGroup.name && it.source === this._state.legendaryGroup.source);
			this._selLegendaryGroup.val(`${ix}`);
		} else {
			this._selLegendaryGroup.val(`-1`);
		}
	}

	async pUpdateLegendaryGroups () {
		await this._pBuildLegendaryGroupCache();
		this._handleLegendaryGroupChange(); // ensure the index is up-to-date
	}

	__getVariantInput (cb) {
		return this.__getGenericEntryInput(cb, {name: "Variants", shortName: "Variant", prop: "variant"});
	}

	__getTokenInput (cb) {
		const [row, rowInner] = BuilderUi.getLabelledRowTuple("Token Image");

		const doUpdateState = () => {
			delete this._state.token;
			delete this._state.tokenUrl;
			delete this._state.tokenHref;

			switch (selMode.val()) {
				case "0": {
					this._state.token = {name: iptExistingName.val().trim(), source: iptExistingSource.val().trim()};
					break;
				}

				case "1": {
					this._state.tokenHref = {
						type: "external",
						url: iptExternalUrl.val(),
					};
					break;
				}

				case "2": {
					this._state.tokenHref = {
						type: "internal",
						path: iptInternalPath.val(),
					};
					break;
				}

				default: throw new Error("Unimplemented!");
			}

			cb();
		};

		const btnPreview = ee`<button class="ve-btn ve-btn-xs ve-btn-default" title="Preview Token"><span class="glyphicon glyphicon-fullscreen"></span></button>`
			.onn("click", (evt) => {
				if (!Renderer.monster.hasToken(this._state)) return JqueryUtil.doToast({content: "Please set a token first!", type: "warning"});

				const $content = Renderer.hover.$getHoverContent_generic(
					{
						type: "image",
						href: {
							type: "external",
							url: Renderer.monster.getTokenUrl(this._state),
						},
					},
					{isBookContent: true},
				);
				Renderer.hover.getShowWindow(
					$content,
					Renderer.hover.getWindowPositionFromEvent(evt),
					{
						isPermanent: true,
						title: "Token Preview",
						isBookContent: true,
					},
				);
			});

		const initialMode = this._state.token ? "0" : this._state.tokenHref?.type === "internal" ? "2" : "1";

		const selMode = ee`<select class="form-control input-xs mr-2">
			<option value="0">Existing Creature</option>
			<option value="1">External URL</option>
			<option value="2">Internal URL</option>
		</select>`
			.val(initialMode)
			.onn("change", () => {
				switch (selMode.val()) {
					case "0": {
						stgExistingCreature.showVe(); stgExternalUrl.hideVe(); stgInternalUrl.hideVe();
						doUpdateState();
						break;
					}
					case "1": {
						stgExistingCreature.hideVe(); stgExternalUrl.showVe(); stgInternalUrl.hideVe();
						doUpdateState();
						break;
					}
					case "2": {
						stgExistingCreature.hideVe(); stgExternalUrl.hideVe(); stgInternalUrl.showVe();
						doUpdateState();
						break;
					}
				}
			});

		// region Existing creature
		const iptExistingName = ee`<input class="form-control input-xs form-control--minimal">`
			.val(this._state.token?.name || "")
			.onn("change", () => doUpdateState());
		const iptExistingSource = ee`<input class="form-control input-xs form-control--minimal">`
			.val(this._state.token?.source || "")
			.onn("change", () => doUpdateState());

		const stgExistingCreature = ee`<div class="ve-flex-col mb-2">
			<div class="ve-flex-v-center mb-2"><span class="mr-2 mkbru__sub-name--25">Name</span>${iptExistingName}</div>
			<div class="ve-flex-v-center"><span class="mr-2 mkbru__sub-name--25">Source</span>${iptExistingSource}</div>
		</div>`
			.toggleVe(initialMode === "0");
		// endregion

		// region External URL
		const iptExternalUrl = ee`<input class="form-control form-control--minimal input-xs code">`
			.onn("change", () => doUpdateState())
			.val(
				this._state.tokenHref?.url
				|| this._state.tokenUrl // TODO(Future) legacy; remove
				|| "",
			);

		const stgExternalUrl = ee`<div class="ve-flex-col mb-2">
			<div class="ve-flex-v-center"><span class="mr-2 mkbru__sub-name--25">URL</span>${iptExternalUrl}</div>
		</div>`
			.toggleVe(initialMode === "1");
		// endregion

		// region Internal URL
		const iptInternalPath = ee`<input class="form-control form-control--minimal input-xs code">`
			.onn("change", () => doUpdateState())
			.val(this._state.tokenHref?.path || "");

		const stgInternalUrl = ee`<div class="ve-flex-col mb-2">
			<div class="ve-flex-v-center"><span class="mr-2 mkbru__sub-name--25">Path</span>${iptInternalPath}</div>
		</div>`
			.toggleVe(initialMode === "2");
		// endregion

		ee`<div class="ve-flex-col">
			<div class="ve-flex mb-2">${selMode}${btnPreview}</div>
			${stgExistingCreature}
			${stgExternalUrl}
			${stgInternalUrl}
		</div>`.appendTo(rowInner);

		return row;
	}

	__getEnvironmentInput (cb) {
		const [row, rowInner] = BuilderUi.getLabelledRowTuple("Environment", {isMarked: true});

		const doUpdateState = () => {
			const raw = inputs.map(it => it.ipt.prop("checked") ? it.getVal() : false).filter(Boolean);

			if (raw.length) this._state.environment = raw;
			else delete this._state.environment;

			cb();
		};

		const wrpIpts = ee`<div class="ve-flex-col w-100 mr-2"></div>`;
		const inputs = [];
		Parser.ENVIRONMENTS.forEach(val => {
			const cb = ee`<input class="mkbru__ipt-cb mkbru_mon__cb-environment" type="checkbox">`
				.prop("checked", !!this._state.environment?.includes(val))
				.onn("change", () => doUpdateState());
			inputs.push({ipt: cb, getVal: () => val});
			ee`<label class="ve-flex-v-center split stripe-odd--faint"><span>${StrUtil.toTitleCase(val)}</span>${cb}</label>`.appendTo(wrpIpts);
		});

		const additionalEnvs = (this._state.environment || []).filter(it => !Parser.ENVIRONMENTS.includes(it)).filter(it => it && it.trim());
		if (additionalEnvs.length) {
			additionalEnvs.forEach(it => {
				CreatureBuilder.__getEnvironmentInput__getCustomRow(doUpdateState, inputs, it).ele.appendTo(wrpIpts);
			});
		}

		const btnAddCustom = ee`<button class="ve-btn ve-btn-default ve-btn-xs mt-2">Add Custom Environment</button>`
			.onn("click", () => {
				CreatureBuilder.__getEnvironmentInput__getCustomRow(doUpdateState, inputs).ele.appendTo(wrpIpts);
			});

		ee`<div class="ve-flex-col">
		${wrpIpts}
		<div class="ve-flex-v-center">${btnAddCustom}</div>
		</div>`.appendTo(rowInner);

		return row;
	}

	static __getEnvironmentInput__getCustomRow (doUpdateState, envRows, env) {
		const iptEnv = ee`<input class="form-control form-control--minimal input-xs">`
			.val(env ? StrUtil.toTitleCase(env) : "")
			.onn("change", () => doUpdateState());

		// hidden checkbox, locked to true
		const cb = ee`<input class="mkbru__ipt-cb hidden" type="checkbox">`
			.prop("checked", true);

		const btnRemove = ee`<button class="ve-btn ve-btn-danger ve-btn-xxs"><span class="glyphicon glyphicon-trash"></span></button>`
			.onn("click", () => {
				out.ele.remove();
				envRows.splice(envRows.indexOf(out), 1);
				doUpdateState();
			});

		const out = {
			ipt: cb,
			getVal: () => {
				const raw = iptEnv.val().toLowerCase().trim();
				return raw || false;
			},
			ele: ee`<label class="ve-flex-v-center split stripe-odd--faint mt-2"><span>${iptEnv}</span>${cb}${btnRemove}</label>`,
		};

		envRows.push(out);
		return out;
	}

	__getSoundClipInput (cb) {
		// BuilderUi.getStateIptString(cb, this._state, {type: "url"}, "soundClip").appendTo(miscTab.wrpTab);
		const [row, rowInner] = BuilderUi.getLabelledRowTuple("Sound Clip URL", {isMarked: true});

		const doUpdateState = () => {
			const url = iptUrl.val().trim();

			if (!url) {
				delete this._state.soundClip;
			} else {
				this._state.soundClip = {
					type: "external",
					url,
				};
			}

			cb();
		};

		const iptUrl = ee`<input class="form-control form-control--minimal input-xs mr-2">`
			.onn("change", () => doUpdateState());

		if (this._state.soundClip) iptUrl.val(this._state.soundClip.url);

		ee`<div class="ve-flex">${iptUrl}</div>`.appendTo(rowInner);

		return row;
	}

	renderOutput () {
		this._renderOutputDebounced();
	}

	_renderOutput () {
		const wrp = this._ui.wrpOutput.empty();

		// initialise tabs
		this._resetTabs({tabGroup: "output"});

		const tabs = this._renderTabs(
			[
				new TabUiUtil.TabMeta({name: "Stat Block"}),
				new TabUiUtil.TabMeta({name: "Info"}),
				new TabUiUtil.TabMeta({name: "Images"}),
				new TabUiUtil.TabMeta({name: "Data"}),
				new TabUiUtil.TabMeta({name: "Markdown"}),
			],
			{
				tabGroup: "output",
				cbTabChange: this.doUiSave.bind(this),
			},
		);
		const [statTab, infoTab, imageTab, dataTab, markdownTab] = tabs;
		ee`<div class="ve-flex-v-center w-100 no-shrink">${tabs.map(it => it.btnTab)}</div>`.appendTo(wrp);
		tabs.forEach(it => it.wrpTab.appendTo(wrp));

		// statblock
		const tblMon = ee`<table class="w-100 stats monster"></table>`.appendTo(statTab.wrpTab);
		tblMon.appends(RenderBestiary.getRenderedCreature(this._state, {isSkipExcludesRender: true, isSkipTokenRender: true}));

		// info
		const tblInfo = ee`<table class="w-100 stats"></table>`.appendTo(infoTab.wrpTab);
		Renderer.utils.pBuildFluffTab({
			isImageTab: false,
			wrpContent: tblInfo,
			entity: this._state,
			pFnGetFluff: Renderer.monster.pGetFluff,
		});

		// images
		const tblImages = ee`<table class="w-100 stats"></table>`.appendTo(imageTab.wrpTab);
		Renderer.utils.pBuildFluffTab({
			isImageTab: true,
			wrpContent: tblImages,
			entity: this._state,
			pFnGetFluff: Renderer.monster.pGetFluff,
		});

		// data
		const tblData = ee`<table class="w-100 stats stats--book mkbru__wrp-output-tab-data"></table>`.appendTo(dataTab.wrpTab);
		const asJson = Renderer.get().render({
			type: "entries",
			entries: [
				{
					type: "code",
					name: `Data`,
					preformatted: JSON.stringify(DataUtil.cleanJson(MiscUtil.copy(this._state)), null, "\t"),
				},
			],
		});
		tblData.appends(Renderer.utils.getBorderTr());
		tblData.appends(`<tr><td colspan="6">${asJson}</td></tr>`);
		tblData.appends(Renderer.utils.getBorderTr());

		// markdown
		const tblMarkdown = ee`<table class="w-100 stats stats--book mkbru__wrp-output-tab-data"></table>`.appendTo(markdownTab.wrpTab);
		tblMarkdown.appends(Renderer.utils.getBorderTr());
		tblMarkdown.appends(`<tr><td colspan="6">${this._getRenderedMarkdownCode()}</td></tr>`);
		tblMarkdown.appends(Renderer.utils.getBorderTr());
	}
}
CreatureBuilder._ALIGNMENTS = [
	["U"],
	["A"],
	null,
	["L", "G"],
	["N", "G"],
	["C", "G"],
	["L", "N"],
	["N"],
	["C", "N"],
	["L", "E"],
	["N", "E"],
	["C", "E"],
	null,
	["G"],
	["L"],
	["C"],
	["E"],
	null,
	["L", "G", "NY", "E"],
	["C", "G", "NY", "E"],
	["L", "NX", "C", "G"],
	["L", "NX", "C", "E"],
	["NX", "NY", "N"],
	null,
	["NX", "C", "G", "NY", "E"],
	["L", "NX", "C", "NY", "G"],
	["L", "NX", "C", "NY", "E"],
	["NX", "L", "G", "NY", "E"],
];
CreatureBuilder._AC_COMMON = {
	"Unarmored Defense": "unarmored defense",
	"Natural Armor": "natural armor",
};
CreatureBuilder._LANGUAGE_BLOCKLIST = new Set(["CS", "X", "XX"]);
CreatureBuilder._rowSortOrder = 0;
