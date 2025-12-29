export const getFnRootPropListSort = (prop) => {
	switch (prop) {
		case "spell":
		case "roll20Spell":
		case "foundrySpell":
		case "spellList":
		case "monster":
		case "foundryMonster":
		case "monsterFluff":
		case "monsterTemplate":
		case "makebrewCreatureTrait":
		case "makebrewCreatureAction":
		case "action":
		case "foundryAction":
		case "background":
		case "legendaryGroup":
		case "language":
		case "languageScript":
		case "name":
		case "condition":
		case "disease":
		case "status":
		case "cult":
		case "boon":
		case "feat":
		case "foundryFeat":
		case "vehicle":
		case "vehicleUpgrade":
		case "foundryVehicleUpgrade":
		case "backgroundFluff":
		case "featFluff":
		case "optionalfeatureFluff":
		case "conditionFluff":
		case "diseaseFluff":
		case "statusFluff":
		case "spellFluff":
		case "itemFluff":
		case "languageFluff":
		case "vehicleFluff":
		case "objectFluff":
		case "raceFluff":
		case "item":
		case "foundryItem":
		case "baseitem":
		case "magicvariant":
		case "foundryMagicvariant":
		case "itemGroup":
		case "itemMastery":
		case "itemTypeAdditionalEntries":
		case "itemEntry":
		case "object":
		case "optionalfeature":
		case "foundryOptionalfeature":
		case "psionic":
		case "reward":
		case "foundryReward":
		case "rewardFluff":
		case "variantrule":
		case "race":
		case "foundryRace":
		case "foundryRaceFeature":
		case "table":
		case "trap":
		case "trapFluff":
		case "hazard":
		case "hazardFluff":
		case "charoption":
		case "charoptionFluff":
		case "recipe":
		case "recipeFluff":
		case "sense":
		case "skill":
		case "deck":
		case "citation":
		case "foundryMap":
		case "facility":
		case "facilityFluff":
		case "encounterShape":
			return SortUtil.ascSortGenericEntity.bind(SortUtil);
		case "deity":
			return SortUtil.ascSortDeity.bind(SortUtil);
		case "card":
			return SortUtil.ascSortCard.bind(SortUtil);
		case "class":
		case "classFluff":
		case "foundryClass":
			return (a, b) => SortUtil.ascSortDateString(Parser.sourceJsonToDate(b.source), Parser.sourceJsonToDate(a.source)) || SortUtil.ascSortLower(a.name, b.name) || SortUtil.ascSortLower(a.source, b.source);
		case "subclass":
		case "subclassFluff":
		case "foundrySubclass":
			return (a, b) => SortUtil.ascSortDateString(Parser.sourceJsonToDate(b.source), Parser.sourceJsonToDate(a.source)) || SortUtil.ascSortLower(a.name, b.name);
		case "classFeature":
		case "foundryClassFeature":
			return (a, b) => SortUtil.ascSortLower(a.classSource, b.classSource)
				|| SortUtil.ascSortLower(a.className, b.className)
				|| SortUtil.ascSort(a.level, b.level)
				|| SortUtil.ascSortGenericEntity(a, b);
		case "subclassFeature":
		case "foundrySubclassFeature":
			return (a, b) => SortUtil.ascSortLower(a.classSource, b.classSource)
				|| SortUtil.ascSortLower(a.className, b.className)
				|| SortUtil.ascSortLower(a.subclassSource, b.subclassSource)
				|| SortUtil.ascSortLower(a.subclassShortName, b.subclassShortName)
				|| SortUtil.ascSort(a.level, b.level)
				|| SortUtil.ascSort(a.header || 0, b.header || 0)
				|| SortUtil.ascSortGenericEntity(a, b);
		case "subrace": return (a, b) => SortUtil.ascSortLower(a.raceName || "", b.raceName || "")
			|| SortUtil.ascSortLower(a.raceSource || "", b.raceSource || "")
			|| SortUtil.ascSortLower(a.name || "", b.name || "")
			|| SortUtil.ascSortLower(a.source || "", b.source || "");
		case "backgroundFeature": return (a, b) => SortUtil.ascSortLower(a.backgroundName, b.backgroundName)
			|| SortUtil.ascSortLower(a.backgroundSource, b.backgroundSource)
			|| SortUtil.ascSortGenericEntity(a, b);
		case "encounter":
			return SortUtil.ascSortEncounter.bind(SortUtil);
		case "adventure": return SortUtil.ascSortAdventure.bind(SortUtil);
		case "book": return SortUtil.ascSortBook.bind(SortUtil);
		case "adventureData":
		case "bookData":
			return SortUtil.ascSortBookData.bind(SortUtil);
		case "monsterfeatures":
			return (a, b) => SortUtil.ascSortLower(a.name, b.name);
		case "itemProperty":
		case "reducedItemProperty":
		case "itemType":
		case "reducedItemType":
			return (a, b) => SortUtil.ascSortLower(a.abbreviation, b.abbreviation) || SortUtil.ascSortLower(a.source, b.source);
		case "converterSample":
			return (a, b) => SortUtil.ascSortLower(a.converterId, b.converterId) || SortUtil.ascSortLower(a.format, b.format) || SortUtil.ascSortLower(a.edition, b.edition);
		default: throw new Error(`Unhandled prop "${prop}"`);
	}
};
