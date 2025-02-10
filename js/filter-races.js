"use strict";

class PageFilterRaces extends PageFilterBase {
	// region static
	static getLanguageProficiencyTags (lProfs) {
		if (!lProfs) return [];

		const outSet = new Set();
		lProfs.forEach(lProfGroup => {
			Object.keys(lProfGroup)
				.forEach(k => {
					if (!["choose", "any", "anyStandard", "anyExotic", "anyRare"].includes(k)) outSet.add(k.toTitleCase());
					else outSet.add("Choose");
				});
		});

		return [...outSet];
	}

	static getSpeedRating (speed) { return speed > 30 ? "Walk (Fast)" : speed < 30 ? "Walk (Slow)" : "Walk"; }

	static filterAscSortSize (a, b) {
		a = a.item;
		b = b.item;

		return SortUtil.ascSort(toNum(a), toNum(b));

		function toNum (size) {
			switch (size) {
				case "M": return 0;
				case "S": return -1;
				case "V": return 1;
			}
		}
	}
	// endregion

	static _TRAIT_DISPLAY_VALUES = {
		"Monstrous Race": "Monstrous Species",
		"NPC Race": "NPC Species",
		"Uncommon Race": "Uncommon Species",

		"Armor Proficiency": "Armor Training",
	};

	constructor () {
		super();

		this._sizeFilter = new Filter({header: "Size", displayFn: Parser.sizeAbvToFull, itemSortFn: PageFilterRaces.filterAscSortSize});
		this._asiFilter = new AbilityScoreFilter({header: "Ability Scores (Including Subspecies)"});
		this._baseRaceFilter = new Filter({header: "Base Species"});
		this._speedFilter = new Filter({header: "Speed", items: ["Climb", "Fly", "Swim", "Walk (Fast)", "Walk", "Walk (Slow)"]});
		this._traitFilter = new Filter({
			header: "Traits",
			items: [
				"Amphibious",
				"Armor Proficiency",
				"Blindsight",
				"Darkvision",
				"Superior Darkvision",
				"Dragonmark",
				"Feat",
				"Improved Resting",
				"Monstrous Race",
				"Natural Armor",
				"Natural Weapon",
				"NPC Race",
				"Powerful Build",
				"Skill Proficiency",
				"Spellcasting",
				"Sunlight Sensitivity",
				"Tool Proficiency",
				"Uncommon Race",
				"Weapon Proficiency",
			],
			displayFn: val => this.constructor._TRAIT_DISPLAY_VALUES[val] || val,
			deselFn: (it) => {
				return it === "NPC Race";
			},
		});
		this._vulnerableFilter = FilterCommon.getDamageVulnerableFilter();
		this._resistFilter = FilterCommon.getDamageResistFilter();
		this._immuneFilter = FilterCommon.getDamageImmuneFilter();
		this._defenseFilter = new MultiFilter({header: "Damage", filters: [this._vulnerableFilter, this._resistFilter, this._immuneFilter]});
		this._conditionImmuneFilter = FilterCommon.getConditionImmuneFilter();
		this._languageFilter = new Filter({
			header: "Languages",
			items: [
				"Abyssal",
				"Celestial",
				"Choose",
				"Common",
				"Draconic",
				"Dwarvish",
				"Elvish",
				"Giant",
				"Gnomish",
				"Goblin",
				"Halfling",
				"Infernal",
				"Orc",
				"Other",
				"Primordial",
				"Sylvan",
				"Undercommon",
			],
			displayFn: it => it.split("|")[0].toTitleCase(),
			umbrellaItems: ["Choose"],
		});
		this._creatureTypeFilter = new Filter({
			header: "Creature Type",
			items: Parser.MON_TYPES,
			displayFn: StrUtil.toTitleCase.bind(StrUtil),
			itemSortFn: SortUtil.ascSortLower,
		});
		this._ageFilter = new RangeFilter({
			header: "Adult Age",
			isRequireFullRangeMatch: true,
			isSparse: true,
			displayFn: it => `${it} y.o.`,
			displayFnTooltip: it => `${it} year${it === 1 ? "" : "s"} old`,
		});
		this._miscFilter = new Filter({
			header: "Miscellaneous",
			items: ["Base Species", "Key Species", "Lineage", "Modified Copy", "Reprinted", "Legacy", "Has Images", "Has Info"],
			isMiscFilter: true,
			deselFn: PageFilterBase.defaultMiscellaneousDeselFn.bind(PageFilterBase),
		});
	}

	static mutateForFilters (r) {
		this._mutateForFilters_commonSources(r);

		r._fSize = r.size ? [...r.size] : [];
		if (r._fSize.length > 1) r._fSize.push("V");
		r._fSpeed = r.speed ? r.speed.walk ? [r.speed.climb ? "Climb" : null, r.speed.fly ? "Fly" : null, r.speed.swim ? "Swim" : null, PageFilterRaces.getSpeedRating(r.speed.walk)].filter(it => it) : [PageFilterRaces.getSpeedRating(r.speed)] : [];
		r._fTraits = [
			r.darkvision === 120 ? "Superior Darkvision" : r.darkvision ? "Darkvision" : null,
			r.blindsight ? "Blindsight" : null,
			r.skillProficiencies ? "Skill Proficiency" : null,
			r.toolProficiencies ? "Tool Proficiency" : null,
			r.feats ? "Feat" : null,
			r.additionalSpells ? "Spellcasting" : null,
			r.armorProficiencies ? "Armor Proficiency" : null,
			r.weaponProficiencies ? "Weapon Proficiency" : null,
		].filter(it => it);
		r._fTraits.push(...(r.traitTags || []));
		r._fLangs = PageFilterRaces.getLanguageProficiencyTags(r.languageProficiencies);
		r._fCreatureTypes = r.creatureTypes ? r.creatureTypes.map(it => it.choose || it).flat() : ["humanoid"];
		this._mutateForFilters_commonMisc(r);
		if (r._isBaseRace) r._fMisc.push("Base Species");
		if (r._isBaseRace || !r._isSubRace) r._fMisc.push("Key Species");
		if (r._isCopy) r._fMisc.push("Modified Copy");
		if (r.lineage) r._fMisc.push("Lineage");

		const ability = r.ability ? Renderer.getAbilityData(r.ability, {isOnlyShort: true, isCurrentLineage: r.lineage === "VRGR"}) : {asTextShort: "None"};
		r._slAbility = ability.asTextShort || VeCt.STR_NONE;

		if (r.age?.mature != null && r.age?.max != null) r._fAge = [r.age.mature, r.age.max];
		else if (r.age?.mature != null) r._fAge = r.age.mature;
		else if (r.age?.max != null) r._fAge = r.age.max;

		FilterCommon.mutateForFilters_damageVulnResImmune(r);
		FilterCommon.mutateForFilters_conditionImmune(r);
	}

	addToFilters (r, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(r._fSources);
		this._sizeFilter.addItem(r._fSize);
		this._asiFilter.addItem(r.ability);
		this._baseRaceFilter.addItem(r._baseName);
		this._creatureTypeFilter.addItem(r._fCreatureTypes);
		this._traitFilter.addItem(r._fTraits);
		this._vulnerableFilter.addItem(r._fVuln);
		this._resistFilter.addItem(r._fRes);
		this._immuneFilter.addItem(r._fImm);
		this._conditionImmuneFilter.addItem(r._fCondImm);
		this._ageFilter.addItem(r._fAge);
		this._languageFilter.addItem(r._fLangs);
		this._miscFilter.addItem(r._fMisc);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._asiFilter,
			this._sizeFilter,
			this._speedFilter,
			this._traitFilter,
			this._defenseFilter,
			this._conditionImmuneFilter,
			this._languageFilter,
			this._baseRaceFilter,
			this._creatureTypeFilter,
			this._miscFilter,
			this._ageFilter,
		];
	}

	toDisplay (values, r) {
		return this._filterBox.toDisplay(
			values,
			r._fSources,
			r.ability,
			r._fSize,
			r._fSpeed,
			r._fTraits,
			[
				r._fVuln,
				r._fRes,
				r._fImm,
			],
			r._fCondImm,
			r._fLangs,
			r._baseName,
			r._fCreatureTypes,
			r._fMisc,
			r._fAge,
		);
	}

	static getListAliases (race) {
		return (race.alias || [])
			.map(it => {
				const invertedName = PageFilterRaces.getInvertedName(it);
				return [`"${it}"`, invertedName ? `"${invertedName}"` : false].filter(Boolean);
			})
			.flat()
			.join(",");
	}

	static getInvertedName (name) {
		// convert e.g. "Elf (High)" to "High Elf" for use as a searchable field
		const bracketMatch = /^(.*?) \((.*?)\)$/.exec(name);
		return bracketMatch ? `${bracketMatch[2]} ${bracketMatch[1]}` : null;
	}
}

globalThis.PageFilterRaces = PageFilterRaces;

class ModalFilterRaces extends ModalFilterBase {
	/**
	 * @param opts
	 * @param opts.namespace
	 * @param [opts.isRadio]
	 * @param [opts.allData]
	 */
	constructor (opts) {
		opts = opts || {};
		super({
			...opts,
			modalTitle: `Species`,
			pageFilter: new PageFilterRaces(),
		});
	}

	_$getColumnHeaders () {
		const btnMeta = [
			{sort: "name", text: "Name", width: "4"},
			{sort: "ability", text: "Ability", width: "4"},
			{sort: "size", text: "Size", width: "2"},
			{sort: "source", text: "Source", width: "1"},
		];
		return ModalFilterBase._$getFilterColumnHeaders(btnMeta);
	}

	async _pLoadAllData () {
		return [
			...((await DataUtil.race.loadJSON()).race || []),
			...((await DataUtil.race.loadPrerelease({isAddBaseRaces: false})).race || []),
			...((await DataUtil.race.loadBrew({isAddBaseRaces: false})).race || []),
		];
	}

	_getListItem (pageFilter, race, rI) {
		const eleRow = document.createElement("div");
		eleRow.className = "px-0 w-100 ve-flex-col no-shrink";

		const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_RACES](race);
		const ability = race.ability ? Renderer.getAbilityData(race.ability) : {asTextShort: "None"};
		const size = (race.size || [Parser.SZ_VARIES]).map(sz => Parser.sizeAbvToFull(sz)).join("/");
		const source = Parser.sourceJsonToAbv(race.source);

		eleRow.innerHTML = `<div class="w-100 ve-flex-vh-center lst__row-border veapp__list-row no-select lst__wrp-cells">
			<div class="ve-col-0-5 pl-0 ve-flex-vh-center">${this._isRadio ? `<input type="radio" name="radio" class="no-events">` : `<input type="checkbox" class="no-events">`}</div>

			<div class="ve-col-0-5 px-1 ve-flex-vh-center">
				<div class="ui-list__btn-inline px-2 no-select" title="Toggle Preview (SHIFT to Toggle Info Preview)">[+]</div>
			</div>

			<div class="ve-col-4 px-1 ${race._versionBase_isVersion ? "italic" : ""} ${this._getNameStyle()}">${race._versionBase_isVersion ? `<span class="px-3"></span>` : ""}${race.name}</div>
			<div class="ve-col-4 px-1">${ability.asTextShort}</div>
			<div class="ve-col-2 px-1 ve-text-center">${size}</div>
			<div class="ve-col-1 pl-1 pr-0 ve-flex-h-center ${Parser.sourceJsonToSourceClassname(race.source)}" title="${Parser.sourceJsonToFull(race.source)}" ${Parser.sourceJsonToStyle(race.source)}>${source}${Parser.sourceJsonToMarkerHtml(race.source)}</div>
		</div>`;

		const btnShowHidePreview = eleRow.firstElementChild.children[1].firstElementChild;

		const listItem = new ListItem(
			rI,
			eleRow,
			race.name,
			{
				hash,
				source,
				sourceJson: race.source,
				page: race.page,
				ability: ability.asTextShort,
				size,
				cleanName: PageFilterRaces.getInvertedName(race.name) || "",
				alias: PageFilterRaces.getListAliases(race),
			},
			{
				cbSel: eleRow.firstElementChild.firstElementChild.firstElementChild,
				btnShowHidePreview,
			},
		);

		ListUiUtil.bindPreviewButton(UrlUtil.PG_RACES, this._allData, listItem, btnShowHidePreview);

		return listItem;
	}
}

globalThis.ModalFilterRaces = ModalFilterRaces;
