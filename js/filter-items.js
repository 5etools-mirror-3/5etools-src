"use strict";

class PageFilterEquipment extends PageFilterBase {
	static _MISC_FILTER_ITEMS = [
		"Item Group",
		"Bundle",
		"Legacy",
		"Has Images",
		"Has Info",
		"Reprinted",
		"Disadvantage on Stealth",
		"Strength Requirement",
		"Emits Light, Bright",
		"Emits Light, Dim",
	];

	static _RE_FOUNDRY_ATTR = /(?:[-+*/]\s*)?@[a-z0-9.]+/gi;
	static _RE_DAMAGE_DICE_JUNK = /[^-+*/0-9d]/gi;
	static _RE_DAMAGE_DICE_D = /d/gi;

	static _getSortableDamageTerm (t) {
		try {
			/* eslint-disable no-eval */
			return eval(
				`${t}`
					.replace(this._RE_FOUNDRY_ATTR, "")
					.replace(this._RE_DAMAGE_DICE_JUNK, "")
					.replace(this._RE_DAMAGE_DICE_D, "*"),
			);
			/* eslint-enable no-eval */
		} catch (ignored) {
			return Number.MAX_SAFE_INTEGER;
		}
	}

	static _sortDamageDice (a, b) {
		return this._getSortableDamageTerm(a.item) - this._getSortableDamageTerm(b.item);
	}

	static _getMasteryDisplay (mastery) {
		const {name, source} = DataUtil.proxy.unpackUid("itemMastery", mastery, "itemMastery");
		if (SourceUtil.isSiteSource(source)) return name.toTitleCase();
		return `${name.toTitleCase()} (${Parser.sourceJsonToAbv(source)})`;
	}

	constructor ({filterOpts = null} = {}) {
		super();

		this._typeFilter = new Filter({
			header: "Type",
			deselFn: (it) => PageFilterItems._DEFAULT_HIDDEN_TYPES.has(it),
			displayFn: StrUtil.toTitleCase.bind(StrUtil),
		});
		this._propertyFilter = new Filter({header: "Property", displayFn: StrUtil.toTitleCase.bind(StrUtil)});
		this._categoryFilter = new Filter({
			header: "Category",
			items: ["Basic", "Generic Variant", "Specific Variant", "Other"],
			deselFn: (it) => it === "Specific Variant",
			itemSortFn: null,
			...(filterOpts?.["Category"] || {}),
		});
		this._costFilter = new RangeFilter({
			header: "Cost",
			isLabelled: true,
			isAllowGreater: true,
			labelSortFn: null,
			labels: [
				0,
				...[...new Array(9)].map((_, i) => i + 1),
				...[...new Array(9)].map((_, i) => 10 * (i + 1)),
				...[...new Array(100)].map((_, i) => 100 * (i + 1)),
			],
			labelDisplayFn: it => !it ? "None" : Parser.getDisplayCurrency(CurrencyUtil.doSimplifyCoins({cp: it})),
		});
		this._weightFilter = new RangeFilter({header: "Weight", min: 0, max: 100, isAllowGreater: true, suffix: " lb."});
		this._focusFilter = new Filter({header: "Spellcasting Focus", items: [...Parser.ITEM_SPELLCASTING_FOCUS_CLASSES]});
		this._damageTypeFilter = new Filter({header: "Weapon Damage Type", displayFn: it => Parser.dmgTypeToFull(it).uppercaseFirst(), itemSortFn: (a, b) => SortUtil.ascSortLower(Parser.dmgTypeToFull(a.item), Parser.dmgTypeToFull(b.item))});
		this._damageDiceFilter = new Filter({header: "Weapon Damage Dice", items: ["1", "1d4", "1d6", "1d8", "1d10", "1d12", "2d6"], itemSortFn: (a, b) => PageFilterEquipment._sortDamageDice(a, b)});
		this._acFilter = new RangeFilter({header: "Armor Class", displayFn: it => it === 0 ? "None" : it});
		this._miscFilter = new Filter({
			header: "Miscellaneous",
			items: [...PageFilterEquipment._MISC_FILTER_ITEMS, ...Object.values(Parser.ITEM_MISC_TAG_TO_FULL)],
			isMiscFilter: true,
			deselFn: PageFilterBase.defaultMiscellaneousDeselFn.bind(PageFilterBase),
		});
		this._poisonTypeFilter = new Filter({header: "Poison Type", items: ["ingested", "injury", "inhaled", "contact"], displayFn: StrUtil.toTitleCase.bind(StrUtil)});
		this._masteryFilter = new Filter({header: "Mastery", displayFn: this.constructor._getMasteryDisplay.bind(this)});
	}

	static _mutateForFilters_getFilterAc (item) {
		if (!item.ac && !item.bonusAc) return null;
		if (item.ac && !item.bonusAc) return item.ac;
		if (isNaN(item.bonusAc)) return item.ac;
		return (item.ac || 0) + Number(item.bonusAc);
	}

	static _mutateForFilters_mutFilterValue (item) {
		if (item.value || item.valueMult) {
			item._l_value = Parser.itemValueToFullMultiCurrency(item, {isShortForm: true}).replace(/ +/g, "\u00A0");
			return;
		}

		item._l_value = "\u2014";
	}

	static mutateForFilters (item) {
		this._mutateForFilters_commonSources(item);

		item._fProperties = item.property ? item.property.map(p => Renderer.item.getProperty(p?.uid || p)?.name).filter(Boolean) : [];

		this._mutateForFilters_commonMisc(item);
		if (item._isItemGroup) item._fMisc.push("Item Group");
		if (item.packContents) item._fMisc.push("Bundle");
		if (item.miscTags) item._fMisc.push(...item.miscTags.map(Parser.itemMiscTagToFull));
		if (item.stealth) item._fMisc.push("Disadvantage on Stealth");
		if (item.strength != null) item._fMisc.push("Strength Requirement");
		if (item.light?.some(l => l.bright)) item._fMisc.push("Emits Light, Bright");
		if (item.light?.some(l => l.dim)) item._fMisc.push("Emits Light, Dim");

		const itemTypeAbv = item.type ? DataUtil.itemType.unpackUid(item.type).abbreviation : null;
		if (item.focus || item.name === "Thieves' Tools" || itemTypeAbv === Parser.ITM_TYP_ABV__INSTRUMENT || itemTypeAbv === Parser.ITM_TYP_ABV__SPELLCASTING_FOCUS || itemTypeAbv === Parser.ITM_TYP_ABV__ARTISAN_TOOL) {
			item._fFocus = item.focus ? item.focus === true ? [...Parser.ITEM_SPELLCASTING_FOCUS_CLASSES] : [...item.focus] : [];
			if ((item.name === "Thieves' Tools" || itemTypeAbv === Parser.ITM_TYP_ABV__ARTISAN_TOOL) && !item._fFocus.includes("Artificer")) item._fFocus.push("Artificer");
			if (itemTypeAbv === Parser.ITM_TYP_ABV__INSTRUMENT && !item._fFocus.includes("Bard")) item._fFocus.push("Bard");
			if (itemTypeAbv === Parser.ITM_TYP_ABV__SPELLCASTING_FOCUS) {
				switch (item.scfType) {
					case "arcane": {
						if (!item._fFocus.includes("Sorcerer")) item._fFocus.push("Sorcerer");
						if (!item._fFocus.includes("Warlock")) item._fFocus.push("Warlock");
						if (!item._fFocus.includes("Wizard")) item._fFocus.push("Wizard");
						break;
					}
					case "druid": {
						if (!item._fFocus.includes("Druid")) item._fFocus.push("Druid");
						break;
					}
					case "holy":
						if (!item._fFocus.includes("Cleric")) item._fFocus.push("Cleric");
						if (!item._fFocus.includes("Paladin")) item._fFocus.push("Paladin");
						break;
				}
			}
		}

		item._fValue = Math.round(item.value || 0);

		item._fDamageDice = [];
		if (item.dmg1) item._fDamageDice.push(item.dmg1);
		if (item.dmg2) item._fDamageDice.push(item.dmg2);

		item._fMastery = item.mastery
			? item.mastery.map(info => {
				const uid = info.uid || info;
				const {name, source} = DataUtil.proxy.unpackUid("itemMastery", uid, "itemMastery", {isLower: true});
				return [name, source].join("|");
			})
			: null;

		item._fAc = this._mutateForFilters_getFilterAc(item);

		item._l_weight = Parser.itemWeightToFull(item, true) || "\u2014";
		this._mutateForFilters_mutFilterValue(item);
	}

	addToFilters (item, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(item._fSources);
		this._typeFilter.addItem(item._typeListText);
		this._propertyFilter.addItem(item._fProperties);
		this._damageTypeFilter.addItem(item.dmgType);
		this._damageDiceFilter.addItem(item._fDamageDice);
		this._acFilter.addItem(item._fAc);
		this._poisonTypeFilter.addItem(item.poisonTypes);
		this._miscFilter.addItem(item._fMisc);
		this._masteryFilter.addItem(item._fMastery);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._typeFilter,
			this._propertyFilter,
			this._categoryFilter,
			this._costFilter,
			this._weightFilter,
			this._focusFilter,
			this._damageTypeFilter,
			this._damageDiceFilter,
			this._acFilter,
			this._miscFilter,
			this._poisonTypeFilter,
			this._masteryFilter,
		];
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(
			values,
			it._fSources,
			it._typeListText,
			it._fProperties,
			it._category,
			it._fValue,
			it.weight,
			it._fFocus,
			it.dmgType,
			it._fDamageDice,
			it._fAc,
			it._fMisc,
			it.poisonTypes,
			it._fMastery,
		);
	}
}

globalThis.PageFilterEquipment = PageFilterEquipment;

class PageFilterItems extends PageFilterEquipment {
	static _DEFAULT_HIDDEN_TYPES = new Set([
		"treasure",
		"treasure (art object)",
		"treasure (coinage)",
		"treasure (gemstone)",
		"futuristic",
		"modern",
		"renaissance",
		"trade bar",
	]);
	static _FILTER_BASE_ITEMS_ATTUNEMENT = ["Requires Attunement", "Requires Attunement By...", "Attunement Optional", VeCt.STR_NO_ATTUNEMENT];

	// region static
	static sortItems (a, b, o) {
		if (o.sortBy === "count") return SortUtil.ascSort(a.data.count, b.data.count) || SortUtil.compareListNames(a, b);
		if (o.sortBy === "rarity") return SortUtil.ascSortItemRarity(a.values.rarity, b.values.rarity) || SortUtil.compareListNames(a, b);
		return SortUtil.listSort(a, b, o);
	}

	static _getBaseItemDisplay (baseItem) {
		if (!baseItem) return null;
		let [name, source] = baseItem.split("__");
		name = name.toTitleCase();
		source = source || Parser.SRC_DMG;
		if (source.toLowerCase() === Parser.SRC_PHB.toLowerCase()) return name;
		return `${name} (${Parser.sourceJsonToAbv(source)})`;
	}

	static _sortAttunementFilter (a, b) {
		const ixA = PageFilterItems._FILTER_BASE_ITEMS_ATTUNEMENT.indexOf(a.item);
		const ixB = PageFilterItems._FILTER_BASE_ITEMS_ATTUNEMENT.indexOf(b.item);

		if (~ixA && ~ixB) return ixA - ixB;
		if (~ixA) return -1;
		if (~ixB) return 1;
		return SortUtil.ascSortLower(a, b);
	}

	static _getAttunementFilterItems (item) {
		const out = item._attunementCategory ? [item._attunementCategory] : [];

		if (!item.reqAttuneTags && !item.reqAttuneAltTags) return out;

		[...item.reqAttuneTags || [], ...item.reqAttuneAltTags || []].forEach(tagSet => {
			Object.entries(tagSet)
				.forEach(([prop, val]) => {
					switch (prop) {
						case "background": out.push(`Background: ${val.split("|")[0].toTitleCase()}`); break;
						case "languageProficiency": out.push(`Language Proficiency: ${val.toTitleCase()}`); break;
						case "skillProficiency": out.push(`Skill Proficiency: ${val.toTitleCase()}`); break;
						case "race": out.push(`Species: ${val.split("|")[0].toTitleCase()}`); break;
						case "creatureType": out.push(`Creature Type: ${val.toTitleCase()}`); break;
						case "size": out.push(`Size: ${Parser.sizeAbvToFull(val)}`.toTitleCase()); break;
						case "class": out.push(`Class: ${val.split("|")[0].toTitleCase()}`); break;
						case "alignment": out.push(`Alignment: ${Parser.alignmentListToFull(val).toTitleCase()}`); break;

						case "str":
						case "dex":
						case "con":
						case "int":
						case "wis":
						case "cha": out.push(`${Parser.attAbvToFull(prop)}: ${val} or Higher`); break;

						case "spellcasting": out.push("Spellcaster"); break;
						case "psionics": out.push("Psionics"); break;
					}
				});
		});

		return out;
	}

	// endregion
	constructor (opts) {
		super(opts);

		this._tierFilter = new Filter({header: "Tier", items: ["none", "minor", "major"], itemSortFn: null, displayFn: StrUtil.toTitleCase.bind(StrUtil)});
		this._attachedSpellsFilter = new SearchableFilter({header: "Attached Spells", displayFn: (it) => it.split("|")[0].toTitleCase(), itemSortFn: SortUtil.ascSortLower});
		this._lootTableFilter = new Filter({
			header: "Found On",
			items: ["Magic Item Table A", "Magic Item Table B", "Magic Item Table C", "Magic Item Table D", "Magic Item Table E", "Magic Item Table F", "Magic Item Table G", "Magic Item Table H", "Magic Item Table I"],
			displayFn: it => {
				const [name, sourceJson] = it.split("|");
				return `${name}${sourceJson ? ` (${Parser.sourceJsonToAbv(sourceJson)})` : ""}`;
			},
		});
		this._rarityFilter = new Filter({
			header: "Rarity",
			items: [...Parser.ITEM_RARITIES],
			itemSortFn: null,
			displayFn: StrUtil.toTitleCase.bind(StrUtil),
		});
		this._attunementFilter = new Filter({header: "Attunement", items: [...PageFilterItems._FILTER_BASE_ITEMS_ATTUNEMENT], itemSortFn: PageFilterItems._sortAttunementFilter});
		this._bonusFilter = new Filter({
			header: "Bonus",
			items: [
				"Armor Class", "Proficiency Bonus", "Spell Attacks", "Spell Save DC", "Saving Throws",
				...([...new Array(4)]).map((_, i) => `Weapon Attack and Damage Rolls${i ? ` (+${i})` : ""}`),
				...([...new Array(4)]).map((_, i) => `Weapon Attack Rolls${i ? ` (+${i})` : ""}`),
				...([...new Array(4)]).map((_, i) => `Weapon Damage Rolls${i ? ` (+${i})` : ""}`),
			],
			itemSortFn: null,
		});
		this._rechargeTypeFilter = new Filter({header: "Recharge Type", displayFn: Parser.itemRechargeToFull});
		this._miscFilter = new Filter({
			header: "Miscellaneous",
			items: ["Ability Score Adjustment", "Charges", "Cursed", "Grants Language", "Grants Proficiency", "Magic", "Mundane", "Sentient", "Speed Adjustment", ...PageFilterEquipment._MISC_FILTER_ITEMS],
			isMiscFilter: true,
			deselFn: PageFilterBase.defaultMiscellaneousDeselFn.bind(PageFilterBase),
		});
		this._baseSourceFilter = new SourceFilter({header: "Base Source", selFn: null});
		this._baseItemFilter = new SearchableFilter({header: "Base Item", displayFn: this.constructor._getBaseItemDisplay.bind(this.constructor), itemSortFn: SortUtil.ascSortLower});
		this._optionalfeaturesFilter = new Filter({
			header: "Feature",
			displayFn: (it) => {
				const [name, source] = it.split("|");
				if (!source) return name.toTitleCase();
				const sourceJson = Parser.sourceJsonToJson(source);
				if (!SourceUtil.isNonstandardSourceWotc(sourceJson)) return name.toTitleCase();
				return `${name.toTitleCase()} (${Parser.sourceJsonToAbv(sourceJson)})`;
			},
			itemSortFn: SortUtil.ascSortLower,
		});
		this._vulnerableFilter = FilterCommon.getDamageVulnerableFilter();
		this._resistFilter = FilterCommon.getDamageResistFilter();
		this._immuneFilter = FilterCommon.getDamageImmuneFilter();
		this._defenseFilter = new MultiFilter({header: "Damage", filters: [this._vulnerableFilter, this._resistFilter, this._immuneFilter]});
		this._conditionImmuneFilter = FilterCommon.getConditionImmuneFilter();
	}

	static mutateForFilters (item) {
		super.mutateForFilters(item);

		item._fTier = [item.tier ? item.tier : "none"];

		if (item.curse) item._fMisc.push("Cursed");
		const isMundane = Renderer.item.isMundane(item);
		item._fMisc.push(isMundane ? "Mundane" : "Magic");
		item._fIsMundane = isMundane;
		if (item.ability) item._fMisc.push("Ability Score Adjustment");
		if (item.modifySpeed) item._fMisc.push("Speed Adjustment");
		if (item.charges) item._fMisc.push("Charges");
		if (item.sentient) item._fMisc.push("Sentient");
		if (item.grantsProficiency) item._fMisc.push("Grants Proficiency");
		if (item.grantsLanguage) item._fMisc.push("Grants Language");
		if (item.critThreshold) item._fMisc.push("Expanded Critical Range");

		const fBaseItemSelf = item._isBaseItem ? `${item.name}__${item.source}`.toLowerCase() : null;
		item._fBaseItem = [
			item.baseItem ? (item.baseItem.includes("|") ? item.baseItem.replace("|", "__") : `${item.baseItem}__${Parser.SRC_DMG}`).toLowerCase() : null,
			item._baseName ? `${item._baseName}__${item._baseSource || item.source}`.toLowerCase() : null,
		].filter(Boolean);
		item._fBaseItemAll = fBaseItemSelf ? [fBaseItemSelf, ...item._fBaseItem] : item._fBaseItem;

		item._fBonus = [];
		if (item.bonusAc) item._fBonus.push("Armor Class");
		this._mutateForFilters_bonusWeapon({prop: "bonusWeapon", item, text: "Weapon Attack and Damage Rolls"});
		this._mutateForFilters_bonusWeapon({prop: "bonusWeaponAttack", item, text: "Weapon Attack Rolls"});
		this._mutateForFilters_bonusWeapon({prop: "bonusWeaponDamage", item, text: "Weapon Damage Rolls"});
		if (item.bonusWeaponCritDamage) item._fBonus.push("Weapon Critical Damage");
		if (item.bonusSpellAttack) item._fBonus.push("Spell Attacks");
		if (item.bonusSpellSaveDc) item._fBonus.push("Spell Save DC");
		if (item.bonusSavingThrow) item._fBonus.push("Saving Throws");
		if (item.bonusProficiencyBonus) item._fBonus.push("Proficiency Bonus");

		item._fAttunement = this._getAttunementFilterItems(item);

		FilterCommon.mutateForFilters_damageVulnResImmune(item);
		FilterCommon.mutateForFilters_conditionImmune(item);
	}

	static _mutateForFilters_bonusWeapon ({prop, item, text}) {
		if (!item[prop]) return;
		item._fBonus.push(text);
		switch (item[prop]) {
			case "+1":
			case "+2":
			case "+3": item._fBonus.push(`${text} (${item[prop]})`); break;
		}
	}

	addToFilters (item, isExcluded) {
		if (isExcluded) return;

		super.addToFilters(item, isExcluded);

		this._sourceFilter.addItem(item.source);
		this._tierFilter.addItem(item._fTier);
		this._attachedSpellsFilter.addItem(item.attachedSpells);
		this._lootTableFilter.addItem(item.lootTables);
		this._baseItemFilter.addItem(item._fBaseItem);
		this._baseSourceFilter.addItem(item._baseSource);
		this._attunementFilter.addItem(item._fAttunement);
		this._rechargeTypeFilter.addItem(item.recharge);
		this._optionalfeaturesFilter.addItem(item.optionalfeatures);
		this._vulnerableFilter.addItem(item._fVuln);
		this._resistFilter.addItem(item._fRes);
		this._immuneFilter.addItem(item._fImm);
		this._conditionImmuneFilter.addItem(item._fCondImm);
	}

	async _pPopulateBoxOptions (opts) {
		await super._pPopulateBoxOptions(opts);

		opts.filters = [
			this._sourceFilter,
			this._typeFilter,
			this._tierFilter,
			this._rarityFilter,
			this._propertyFilter,
			this._attunementFilter,
			this._categoryFilter,
			this._costFilter,
			this._weightFilter,
			this._focusFilter,
			this._damageTypeFilter,
			this._damageDiceFilter,
			this._acFilter,
			this._bonusFilter,
			this._defenseFilter,
			this._conditionImmuneFilter,
			this._miscFilter,
			this._rechargeTypeFilter,
			this._poisonTypeFilter,
			this._masteryFilter,
			this._lootTableFilter,
			this._baseItemFilter,
			this._baseSourceFilter,
			this._optionalfeaturesFilter,
			this._attachedSpellsFilter,
		];
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(
			values,
			it._fSources,
			it._typeListText,
			it._fTier,
			it.rarity,
			it._fProperties,
			it._fAttunement,
			it._category,
			it._fValue,
			it.weight,
			it._fFocus,
			it.dmgType,
			it._fDamageDice,
			it._fAc,
			it._fBonus,
			[
				it._fVuln,
				it._fRes,
				it._fImm,
			],
			it._fCondImm,
			it._fMisc,
			it.recharge,
			it.poisonTypes,
			it._fMastery,
			it.lootTables,
			it._fBaseItemAll,
			it._baseSource,
			it.optionalfeatures,
			it.attachedSpells,
		);
	}
}

globalThis.PageFilterItems = PageFilterItems;

class ModalFilterItems extends ModalFilterBase {
	/**
	 * @param opts
	 * @param opts.namespace
	 * @param [opts.isRadio]
	 * @param [opts.allData]
	 * @param [opts.pageFilterOpts] Options to be passed to the underlying items page filter.
	 */
	constructor (opts) {
		opts = opts || {};
		super({
			...opts,
			modalTitle: `Item${opts.isRadio ? "" : "s"}`,
			pageFilter: new PageFilterItems(opts?.pageFilterOpts),
		});
	}

	_$getColumnHeaders () {
		const btnMeta = [
			{sort: "name", text: "Name", width: "4"},
			{sort: "type", text: "Type", width: "6"},
			{sort: "source", text: "Source", width: "1"},
		];
		return ModalFilterBase._$getFilterColumnHeaders(btnMeta);
	}

	async _pInit () {
		await Renderer.item.pPopulatePropertyAndTypeReference();
	}

	async _pLoadAllData () {
		return [
			...(await Renderer.item.pBuildList()),
			...(await Renderer.item.pGetItemsFromPrerelease()),
			...(await Renderer.item.pGetItemsFromBrew()),
		];
	}

	_getListItem (pageFilter, item, itI) {
		if (item.noDisplay) return null;

		Renderer.item.enhanceItem(item);
		pageFilter.mutateAndAddToFilters(item);

		const eleRow = document.createElement("div");
		eleRow.className = "px-0 w-100 ve-flex-col no-shrink";

		const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ITEMS](item);
		const source = Parser.sourceJsonToAbv(item.source);
		const type = item._typeListText.join(", ");

		eleRow.innerHTML = `<div class="w-100 ve-flex-vh-center lst__row-border veapp__list-row no-select lst__wrp-cells">
			<div class="ve-col-0-5 pl-0 ve-flex-vh-center">${this._isRadio ? `<input type="radio" name="radio" class="no-events">` : `<input type="checkbox" class="no-events">`}</div>

			<div class="ve-col-0-5 px-1 ve-flex-vh-center">
				<div class="ui-list__btn-inline px-2 no-select" title="Toggle Preview (SHIFT to Toggle Info Preview)">[+]</div>
			</div>

			<div class="ve-col-5 px-1 ${item._versionBase_isVersion ? "italic" : ""} ${this._getNameStyle()}">${item._versionBase_isVersion ? `<span class="px-3"></span>` : ""}${item.name}</div>
			<div class="ve-col-5 px-1">${type.uppercaseFirst()}</div>
			<div class="ve-col-1 ve-flex-h-center ${Parser.sourceJsonToSourceClassname(item.source)} pl-1 pr-0" title="${Parser.sourceJsonToFull(item.source)}" ${Parser.sourceJsonToStyle(item.source)}>${source}${Parser.sourceJsonToMarkerHtml(item.source)}</div>
		</div>`;

		const btnShowHidePreview = eleRow.firstElementChild.children[1].firstElementChild;

		const listItem = new ListItem(
			itI,
			eleRow,
			item.name,
			{
				hash,
				source,
				sourceJson: item.source,
				page: item.page,
				type,
			},
			{
				cbSel: eleRow.firstElementChild.firstElementChild.firstElementChild,
				btnShowHidePreview,
			},
		);

		ListUiUtil.bindPreviewButton(UrlUtil.PG_ITEMS, this._allData, listItem, btnShowHidePreview);

		return listItem;
	}
}

globalThis.ModalFilterItems = ModalFilterItems;

class ListSyntaxItems extends ListUiUtil.ListSyntax {
	static _INDEXABLE_PROPS_ENTRIES = [
		"_fullEntries",
		"entries",
	];
}

globalThis.ListSyntaxItems = ListSyntaxItems;
