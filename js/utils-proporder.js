import {PROPS_FOUNDRY_DATA_INLINE} from "./foundry/foundry-consts.js";

function getFnListSort (prop) {
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
		default: throw new Error(`Unhandled prop "${prop}"`);
	}
}

export class PropOrder {
	static _getKeyProp (keyInfo) {
		return typeof keyInfo === "string" ? keyInfo : keyInfo.key;
	}

	/* -------------------------------------------- */

	/**
	 * @param obj
	 * @param [opts] Options object.
	 * @param [opts.fnUnhandledKey] Function to call on each unhandled key.
	 * @param [opts.isFoundryPrefixProps] If root keys should be treated as having a "foundry" prefix.
	 * @param [opts.isNoSortRootArrays] If root arrays should not be sorted.
	 */
	static getOrderedRoot (obj, opts) {
		opts ||= {};

		return this._getOrdered(obj, PropOrder._ROOT, opts, "root");
	}

	static hasOrderRoot (obj) {
		return PropOrder._ROOT
			.filter(keyInfo => !(keyInfo instanceof PropOrder._IgnoredKey))
			.some(keyInfo => obj[this._getKeyProp(keyInfo)] != null);
	}

	/* -------------------------------------------- */

	/**
	 * @param obj
	 * @param dataProp
	 * @param [opts] Options object.
	 * @param [opts.fnUnhandledKey] Function to call on each unhandled key.
	 */
	static getOrdered (obj, dataProp, opts) {
		opts ||= {};

		const order = PropOrder._PROP_TO_LIST[dataProp];
		if (!order) throw new Error(`Unhandled prop "${dataProp}"`);

		return this._getOrdered(obj, order, opts, dataProp);
	}

	static _getModifiedProp ({keyInfo, isFoundryPrefixProps}) {
		const prop = this._getKeyProp(keyInfo);

		if (!isFoundryPrefixProps || prop.startsWith("_")) return prop;

		return prop.replace(/^foundry/, "").lowercaseFirst();
	}

	static _getOrdered (obj, order, opts, logPath) {
		const out = {};
		const keySet = new Set(Object.keys(obj));
		const seenKeys = new Set();

		order
			.forEach(keyInfo => {
				const prop = this._getKeyProp(keyInfo);
				const propMod = this._getModifiedProp({keyInfo, isFoundryPrefixProps: opts.isFoundryPrefixProps});

				if (opts.isFoundryPrefixProps && !prop.startsWith("_") && !prop.startsWith("foundry")) return;

				if (!keySet.has(propMod)) return;
				seenKeys.add(propMod);

				if (typeof keyInfo === "string") {
					out[propMod] = obj[propMod];
					return;
				}

				if (!obj[propMod]) return out[propMod] = obj[propMod]; // Handle nulls

				const optsNxt = {
					...opts,
					// Only used at the root
					isFoundryPrefixProps: false,
					isNoSortRootArrays: false,
				};

				if (keyInfo instanceof PropOrder._ObjectKey) {
					const logPathNxt = `${logPath}.${prop}${propMod !== prop ? ` (${propMod})` : ""}`;
					if (keyInfo.fnGetOrder) out[propMod] = this._getOrdered(obj[propMod], keyInfo.fnGetOrder(obj[propMod]), optsNxt, logPathNxt);
					else if (keyInfo.order) out[propMod] = this._getOrdered(obj[propMod], keyInfo.order, optsNxt, logPathNxt);
					else out[propMod] = obj[propMod];
					return;
				}

				if (keyInfo instanceof PropOrder._ArrayKey) {
					const logPathNxt = `${logPath}[n].${prop}${propMod !== prop ? ` (${propMod})` : ""}`;
					if (keyInfo.fnGetOrder) out[propMod] = obj[propMod].map(it => this._getOrdered(it, keyInfo.fnGetOrder(obj[propMod]), optsNxt, logPathNxt));
					else if (keyInfo.order) out[propMod] = obj[propMod].map(it => this._getOrdered(it, keyInfo.order, optsNxt, logPathNxt));
					else out[propMod] = obj[propMod];

					if (!opts.isNoSortRootArrays && keyInfo.fnSort && out[propMod] instanceof Array) out[propMod].sort(keyInfo.fnSort);

					return;
				}

				if (keyInfo instanceof PropOrder._IgnoredKey) {
					out[propMod] = obj[propMod];

					return;
				}

				throw new Error(`Unimplemented!`);
			});

		// ensure any non-orderable keys are maintained
		const otherKeys = keySet.difference(seenKeys);
		[...otherKeys].forEach(prop => {
			out[prop] = obj[prop];
			if (!opts.fnUnhandledKey) return;

			const propMod = opts.isFoundryPrefixProps ? `foundry${prop.uppercaseFirst()}` : prop;
			const logPathNxt = `${logPath}.${prop}${propMod !== prop ? ` (${propMod})` : ""}`;
			opts.fnUnhandledKey(logPathNxt);
		});

		return out;
	}

	static hasOrder (dataProp) { return !!PropOrder._PROP_TO_LIST[dataProp]; }
}

PropOrder._ObjectKey = class {
	/**
	 * @param key
	 * @param [opts] Options object.
	 * @param [opts.fnGetOrder] Function which gets the ordering to apply to objects with this key.
	 * Takes precedence over `.order`.
	 * @param [opts.order] Ordering to apply to objects with this key.
	 */
	constructor (key, opts) {
		opts = opts || {};

		this.key = key;
		this.fnGetOrder = opts.fnGetOrder;
		this.order = opts.order;
	}

	/**
	 * @param {?Array<string>} identKeys
	 * @param {function} fnGetModOrder
	 */
	static getCopyKey ({identKeys = null, fnGetModOrder}) {
		return new this("_copy", {
			order: [
				...(
					identKeys
					|| [
						"name",
						"source",
					]
				),
				"_templates",
				new PropOrder._ObjectKey("_mod", {
					fnGetOrder: fnGetModOrder,
				}),
				"_preserve",
			],
		});
	}
};

PropOrder._ArrayKey = class {
	/**
	 * @param key
	 * @param [opts] Options object.
	 * @param [opts.fnGetOrder] Function which gets the ordering to apply to objects with this key.
	 * Takes precedence over `.order`.
	 * @param [opts.order] Ordering to apply to objects with this key.
	 * @param [opts.fnSort] Function to sort arrays with this key.
	 */
	constructor (key, opts) {
		opts = opts || {};

		this.key = key;
		this.fnGetOrder = opts.fnGetOrder;
		this.order = opts.order;
		this.fnSort = opts.fnSort;
	}

	static getRootKey (prop) {
		return new this(
			prop,
			{
				fnGetOrder: () => PropOrder._PROP_TO_LIST[prop],
				fnSort: getFnListSort(prop),
			},
		);
	}
};

PropOrder._IgnoredKey = class {
	constructor (key) {
		this.key = key;
	}
};

PropOrder._META = [
	"sources",

	"dependencies",
	"includes",
	"internalCopies",

	"otherSources",

	"spellSchools",
	"spellDistanceUnits",
	"featCategories",
	"optionalFeatureTypes",
	"psionicTypes",
	"currencyConversions",
	"fonts",

	"edition",

	"status",
	"unlisted",

	"dateAdded",
	"dateLastModified",
	"_dateLastModifiedHash",
];
PropOrder._TEST = [
	"additionalImageSources",
];
PropOrder._FOUNDRY_GENERIC = [
	"name",
	"source",

	"type",
	"system",
	"activities",
	"effects",
	"flags",
	"img",

	new PropOrder._ObjectKey("subEntities", {
		fnGetOrder: () => PropOrder._ROOT,
	}),

	"_merge",

	"migrationVersion",
];
PropOrder._FOUNDRY_GENERIC_FEATURE = [
	"name",
	"source",

	"type",
	"system",
	"activities",
	"actorDataMod",
	"effects",
	"flags",
	"img",

	"isIgnored",
	"ignoreSrdActivities",
	"ignoreSrdEffects",

	"entries",

	new PropOrder._ObjectKey("entryData", {
		fnGetOrder: () => PropOrder._ENTRY_DATA_OBJECT,
	}),

	new PropOrder._ObjectKey("subEntities", {
		fnGetOrder: () => PropOrder._ROOT,
	}),

	"_merge",

	"migrationVersion",
];
PropOrder._MONSTER = [
	"name",
	"shortName",
	"alias",
	"group",

	"isNpc",
	"isNamedCreature",

	"source",
	"sourceSub",
	"page",

	"srd",
	"srd52",
	"basicRules",
	"freeRules2024",
	"additionalSources",
	"otherSources",
	"reprintedAs",

	"summonedBySpell",
	"summonedBySpellLevel",
	"summonedByClass",
	"summonedScaleByPlayerLevel",

	"_isCopy",
	PropOrder._ObjectKey.getCopyKey({fnGetModOrder: () => PropOrder._MONSTER__COPY_MOD}),

	"level",
	"size",
	"sizeNote",
	"type",
	"alignment",
	"alignmentPrefix",

	"ac",
	"hp",
	"speed",
	"initiative",

	"resource",

	"str",
	"dex",
	"con",
	"int",
	"wis",
	"cha",

	"save",
	"skill",
	"tool",
	"senses",
	"passive",
	"resist",
	"immune",
	"vulnerable",
	"conditionImmune",
	"languages",
	"cr",
	"pbNote",
	"gear",

	new PropOrder._ArrayKey("spellcasting", {
		fnGetOrder: () => [
			"name",
			"type",
			"headerEntries",

			"constant",
			"will",
			"rest",
			"restLong",
			"daily",
			"weekly",
			"monthly",
			"yearly",
			"recharge",
			"legendary",
			"charges",

			"ritual",

			"spells",

			"footerEntries",

			"chargesItem",

			"ability",
			"displayAs",
			"hidden",
		],
	}),
	"trait",
	"actionNote",
	"actionHeader",
	"action",
	"bonusNote",
	"bonusHeader",
	"bonus",
	"reactionNote",
	"reactionHeader",
	"reaction",
	"legendaryHeader",
	"legendaryActions",
	"legendaryActionsLair",
	"legendary",
	"mythicHeader",
	"mythic",
	"legendaryGroup",
	"variant",
	"footer",

	"environment",
	"treasure",
	"familiar",
	"dragonCastingColor",
	"dragonAge",

	"tokenUrl",
	"token",
	"tokenHref",
	"tokenCredit",
	"soundClip",

	...PROPS_FOUNDRY_DATA_INLINE,

	"altArt",

	new PropOrder._ArrayKey("attachedItems", {fnSort: SortUtil.ascSortLower}),
	new PropOrder._ArrayKey("traitTags", {fnSort: SortUtil.ascSortLower}),
	new PropOrder._ArrayKey("senseTags", {fnSort: SortUtil.ascSortLower}),
	new PropOrder._ArrayKey("actionTags", {fnSort: SortUtil.ascSortLower}),
	new PropOrder._ArrayKey("languageTags", {fnSort: SortUtil.ascSortLower}),
	new PropOrder._ArrayKey("damageTags", {fnSort: SortUtil.ascSortLower}),
	new PropOrder._ArrayKey("damageTagsLegendary", {fnSort: SortUtil.ascSortLower}),
	new PropOrder._ArrayKey("damageTagsSpell", {fnSort: SortUtil.ascSortLower}),
	new PropOrder._ArrayKey("spellcastingTags", {fnSort: SortUtil.ascSortLower}),
	new PropOrder._ArrayKey("miscTags", {fnSort: SortUtil.ascSortLower}),
	new PropOrder._ArrayKey("conditionInflict", {fnSort: SortUtil.ascSortLower}),
	new PropOrder._ArrayKey("conditionInflictLegendary", {fnSort: SortUtil.ascSortLower}),
	new PropOrder._ArrayKey("conditionInflictSpell", {fnSort: SortUtil.ascSortLower}),
	new PropOrder._ArrayKey("savingThrowForced", {fnSort: SortUtil.ascSortLower}),
	new PropOrder._ArrayKey("savingThrowForcedLegendary", {fnSort: SortUtil.ascSortLower}),
	new PropOrder._ArrayKey("savingThrowForcedSpell", {fnSort: SortUtil.ascSortLower}),

	"hasToken",
	"hasFluff",
	"hasFluffImages",

	"fluff",

	new PropOrder._ArrayKey("_versions", {
		fnGetOrder: () => [
			"name",
			"source",
			new PropOrder._ObjectKey("_mod", {
				fnGetOrder: () => PropOrder._MONSTER__COPY_MOD,
			}),
			"_preserve",
			"_abstract",
			"_implementations",
			...PropOrder._MONSTER,
		],
		fnSort: getFnListSort("monster"),
	}),
];
PropOrder._MONSTER__COPY_MOD = [
	"*",
	"_",
	...PropOrder._MONSTER
		.map(it => {
			if (typeof it === "string") return it;

			if (it instanceof PropOrder._ArrayKey) {
				if (it.key === "spellcasting") return it.key;
				return it;
			}

			return it;
		}),
];
PropOrder._MONSTER_TEMPLATE = [
	"name",

	"source",
	"page",

	"ref",

	PropOrder._ObjectKey.getCopyKey({fnGetModOrder: () => PropOrder._MONSTER_TEMPLATE__COPY_MOD}),

	"crMin",
	"crMax",

	new PropOrder._ObjectKey("prerequisite", {
		order: PropOrder._MONSTER,
	}),
	new PropOrder._ObjectKey("apply", {
		order: [
			new PropOrder._ObjectKey("_root", {
				order: PropOrder._MONSTER,
			}),
			new PropOrder._ObjectKey("_mod", {
				fnGetOrder: () => PropOrder._MONSTER__COPY_MOD,
			}),
		],
	}),
];
PropOrder._MAKE_BREW_CREATURE_TRAIT = [
	"name",
	"source",
	"reprintedAs",

	"entries",
];
PropOrder._MAKE_BREW_CREATURE_ACTION = [
	"name",
	"source",
	"reprintedAs",

	"entries",
];
PropOrder._MONSTER_TEMPLATE__COPY_MOD = [
	"*",
	"_",
	...PropOrder._MONSTER_TEMPLATE,
];
PropOrder._FOUNDRY_MONSTER = [
	"name",
	"source",

	"system",
	"prototypeToken",
	"effects",
	"flags",
	"img",

	"migrationVersion",
];
PropOrder._GENERIC_FLUFF = [
	"name",

	"preserveName",

	"source",

	"_copy",

	"entries",
	"images",
];
PropOrder._SPELL = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"freeRules2024",
	"additionalSources",
	"otherSources",
	"reprintedAs",

	PropOrder._ObjectKey.getCopyKey({fnGetModOrder: () => PropOrder._SPELL__COPY_MOD}),

	"level",
	"school",
	"subschools",
	"groups",
	"time",
	"range",
	"components",
	"duration",
	"meta",

	"entries",
	"entriesHigherLevel",

	"scalingLevelDice",

	new PropOrder._ObjectKey("classes", {
		order: [
			"fromClassList",
			"fromClassListVariant",
			"fromSubclass",
		],
	}),
	"races",
	"backgrounds",
	"optionalfeatures",
	"feats",

	"damageResist",
	"damageImmune",
	"damageVulnerable",
	"conditionImmune",

	"damageInflict",
	"conditionInflict",

	"spellAttack",
	"savingThrow",
	"abilityCheck",

	"affectsCreatureType",

	new PropOrder._ArrayKey("miscTags", {fnSort: SortUtil.ascSortLower}),
	new PropOrder._ArrayKey("areaTags", {fnSort: SortUtil.ascSortLower}),

	"hasFluff",
	"hasFluffImages",

	"fluff",

	...PROPS_FOUNDRY_DATA_INLINE,

	new PropOrder._ObjectKey("roll20Spell", {
		order: PropOrder._ROLL20_SPELL,
	}),
];
PropOrder._ROLL20_SPELL = [
	"name",
	"source",

	new PropOrder._ObjectKey("data", {
		order: [
			"Save",
			"Damage",
			"Damage Type",
			"Damage Progression",
			"Target",
			"Healing",
			"Spell Attack",
			"Save Success",
			"Higher Spell Slot Die",
			"Higher Spell Slot Dice",
			"Add Casting Modifier",
			"Secondary Damage",
			"Secondary Damage Type",
			"Higher Level Healing",
			"Higher Spell Slot Bonus",
			"Secondary Higher Spell Slot Die",
			"Secondary Higher Spell Slot Dice",
			"Secondary Damage Progression",
			"Secondary Add Casting Modifier",
			"data-Cantrip Scaling",
			"Crit",
			"Crit Range",
		],
	}),
	"shapedData",
];
PropOrder._SPELL__COPY_MOD = [
	"*",
	"_",
	...PropOrder._SPELL,
];
PropOrder._SPELL_LIST = [
	"name",

	"source",

	"spellListType",

	"className",
	"classSource",

	"spells",
];
PropOrder._ACTION = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"freeRules2024",
	"otherSources",
	"reprintedAs",

	"fromVariant",

	"time",

	"entries",

	"seeAlsoAction",
];
PropOrder._ADVENTURE = [
	"name",
	"alias",

	"id",
	"source",
	"parentSource",

	"group",

	"cover",
	"coverUrl",
	"published",
	"publishedOrder",
	"author",
	"storyline",
	"level",

	"alId",
	"alAveragePlayerLevel",
	"alLength",

	"contents",
];
PropOrder._ADVENTURE_DATA = [
	"name",

	"id",
	"source",

	"data",
];
PropOrder._BOOK = [
	"name",
	"alias",

	"id",
	"source",

	"group",

	"cover",
	"coverUrl",
	"published",
	"author",

	"contents",
];
PropOrder._BOOK_DATA = [
	"name",

	"id",
	"source",

	"data",
];
PropOrder._BACKGROUND = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"freeRules2024",
	"additionalSources",
	"otherSources",
	"reprintedAs",

	"edition",

	PropOrder._ObjectKey.getCopyKey({fnGetModOrder: () => PropOrder._BACKGROUND__COPY_MOD}),

	"prerequisite",
	"ability",

	"feats",

	"skillProficiencies",
	"languageProficiencies",
	"toolProficiencies",
	"weaponProficiencies",
	"armorProficiencies",
	"skillToolLanguageProficiencies",
	"expertise",

	"resist",
	"immune",
	"vulnerable",
	"conditionImmune",

	"startingEquipment",

	"additionalSpells",

	"fromFeature",

	"entries",

	"hasFluff",
	"hasFluffImages",

	"fluff",

	...PROPS_FOUNDRY_DATA_INLINE,
];
PropOrder._BACKGROUND__COPY_MOD = [
	"*",
	"_",
	...PropOrder._BACKGROUND,
];
PropOrder._LEGENDARY_GROUP = [
	"name",
	"alias",

	"source",
	"page",

	"additionalSources",

	PropOrder._ObjectKey.getCopyKey({fnGetModOrder: () => PropOrder._LEGENDARY_GROUP__COPY_MOD}),

	"lairActions",
	"regionalEffects",
	"mythicEncounter",
];
PropOrder._LEGENDARY_GROUP__COPY_MOD = [
	"*",
	"_",
	...PropOrder._LEGENDARY_GROUP,
];
PropOrder._CLASS = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"freeRules2024",
	"otherSources",
	"isReprinted",
	"reprintedAs",

	"edition",

	"isSidekick",
	"classGroup",

	"requirements",
	"primaryAbility",
	"hd",
	"proficiency",

	"spellcastingAbility",
	"casterProgression",
	"preparedSpells",
	"preparedSpellsProgression",
	"preparedSpellsChange",
	"cantripProgression",
	"spellsKnownProgression",
	"spellsKnownProgressionFixed",
	"spellsKnownProgressionFixedAllowLowerLevel",
	"spellsKnownProgressionFixedByLevel",

	"additionalSpells",
	"classSpells",

	"featProgression",
	"optionalfeatureProgression",

	"startingProficiencies",
	"languageProficiencies",
	new PropOrder._ObjectKey("startingEquipment", {
		order: [
			"additionalFromBackground",
			"default",
			"goldAlternative",
			"defaultData",
			"entries",
		],
	}),

	"multiclassing",

	"classTableGroups",

	"classFeatures",

	"subclassTitle",

	"hasFluff",
	"hasFluffImages",

	"fluff",

	...PROPS_FOUNDRY_DATA_INLINE,
];
PropOrder._FOUNDRY_CLASS = [
	"name",

	"source",

	"system",
	"activities",
	"effects",
	"flags",
	"img",

	"advancement",
	"chooseSystem",
	"isChooseSystemRenderEntries",
	"isChooseFlagsRenderEntries",
	"isIgnored",
	"ignoreSrdActivities",
	"ignoreSrdEffects",
	"actorDataMod",
	"actorTokenMod",

	"migrationVersion",
];
PropOrder._SUBCLASS = [
	"name",
	"shortName",
	"alias",
	"source",
	"className",
	"classSource",

	"page",
	"srd",
	"srd52",
	"basicRules",
	"freeRules2024",
	"otherSources",
	"isReprinted",
	"reprintedAs",

	"edition",

	new PropOrder._ObjectKey("_copy", {
		order: [
			"name",
			"source",
			"shortName",
			"source",
			"className",
			"classSource",
			new PropOrder._ObjectKey("_mod", {
				fnGetOrder: () => PropOrder._SUBCLASS__COPY_MOD,
			}),
			"_preserve",
		],
	}),

	"spellcastingAbility",
	"casterProgression",
	"preparedSpells",
	"preparedSpellsProgression",
	"preparedSpellsChange",
	"cantripProgression",
	"spellsKnownProgression",
	"spellsKnownProgressionFixed",
	"spellsKnownProgressionFixedAllowLowerLevel",
	"spellsKnownProgressionFixedByLevel",

	"additionalSpells",

	"subclassSpells",
	"subSubclassSpells",

	"featProgression",
	"optionalfeatureProgression",

	"subclassTableGroups",
	"subclassFeatures",

	"hasFluff",
	"hasFluffImages",

	"fluff",

	...PROPS_FOUNDRY_DATA_INLINE,
];
PropOrder._SUBCLASS__COPY_MOD = [
	"*",
	"_",
	...PropOrder._SUBCLASS,
];
PropOrder._SUBCLASS_FLUFF = [
	"name",
	"shortName",
	"source",
	"className",
	"classSource",

	"_copy",

	"entries",
	"images",
];
PropOrder._FOUNDRY_SUBCLASS = [
	"name",
	"shortName",
	"source",
	"className",
	"classSource",

	"system",
	"activities",
	"effects",
	"flags",
	"img",

	"advancement",
	"chooseSystem",
	"isChooseSystemRenderEntries",
	"isChooseFlagsRenderEntries",
	"isIgnored",
	"ignoreSrdActivities",
	"ignoreSrdEffects",
	"actorDataMod",
	"actorTokenMod",

	"migrationVersion",
];
PropOrder._ENTRY_DATA_OBJECT = [
	"languageProficiencies",
	"skillProficiencies",
	"weaponProficiencies",
	"armorProficiencies",
	"toolProficiencies",
	"savingThrowProficiencies",

	"expertise",

	"resist",
	"immune",
	"vulnerable",
	"conditionImmune",

	"senses",

	"resources",

	"additionalSpells",
];
PropOrder._CLASS_FEATURE = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"freeRules2024",
	"otherSources",

	"className",
	"classSource",
	"level",

	new PropOrder._ObjectKey("_copy", {
		order: [
			"name",
			"source",
			"className",
			"classSource",
			"level",
			new PropOrder._ObjectKey("_mod", {
				fnGetOrder: () => PropOrder._CLASS_FEATURE__COPY_MOD,
			}),
			"_preserve",
		],
	}),

	"isClassFeatureVariant",

	...PropOrder._ENTRY_DATA_OBJECT,

	"header",
	"type",

	"consumes",

	"entries",

	...PROPS_FOUNDRY_DATA_INLINE,
];
PropOrder._CLASS_FEATURE__COPY_MOD = [
	"*",
	"_",
	...PropOrder._CLASS_FEATURE,
];
PropOrder._SUBCLASS_FEATURE = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"freeRules2024",
	"otherSources",

	"className",
	"classSource",
	"subclassShortName",
	"subclassSource",
	"level",

	new PropOrder._ObjectKey("_copy", {
		order: [
			"name",
			"source",
			"className",
			"classSource",
			"subclassShortName",
			"subclassSource",
			"level",
			new PropOrder._ObjectKey("_mod", {
				fnGetOrder: () => PropOrder._SUBCLASS_FEATURE__COPY_MOD,
			}),
			"_preserve",
		],
	}),

	"isClassFeatureVariant",

	"isGainAtNextFeatureLevel",

	...PropOrder._ENTRY_DATA_OBJECT,

	"header",
	"type",

	"consumes",

	"entries",

	...PROPS_FOUNDRY_DATA_INLINE,
];
PropOrder._SUBCLASS_FEATURE__COPY_MOD = [
	"*",
	"_",
	...PropOrder._SUBCLASS_FEATURE,
];
PropOrder._FOUNDRY_CLASS_FEATURE = [
	"name",
	"source",

	"className",
	"classSource",
	"level",

	"system",
	"activities",
	"effects",
	"flags",
	"img",

	"entries",

	new PropOrder._ObjectKey("entryData", {
		fnGetOrder: () => PropOrder._ENTRY_DATA_OBJECT,
	}),

	"chooseSystem",
	"isChooseSystemRenderEntries",
	"isChooseFlagsRenderEntries",
	"isIgnored",
	"ignoreSrdActivities",
	"ignoreSrdEffects",
	"actorDataMod",
	"actorTokenMod",

	new PropOrder._ObjectKey("subEntities", {
		fnGetOrder: () => PropOrder._ROOT,
	}),

	"migrationVersion",
];
PropOrder._FOUNDRY_SUBCLASS_FEATURE = [
	"name",
	"source",

	"className",
	"classSource",
	"subclassShortName",
	"subclassSource",
	"level",

	"system",
	"activities",
	"effects",
	"flags",
	"img",

	"entries",

	new PropOrder._ObjectKey("entryData", {
		fnGetOrder: () => PropOrder._ENTRY_DATA_OBJECT,
	}),

	"chooseSystem",
	"isChooseSystemRenderEntries",
	"isChooseFlagsRenderEntries",
	"isIgnored",
	"ignoreSrdActivities",
	"ignoreSrdEffects",
	"actorDataMod",
	"actorTokenMod",

	new PropOrder._ObjectKey("subEntities", {
		fnGetOrder: () => PropOrder._ROOT,
	}),

	"migrationVersion",
];
PropOrder._LANGUAGE = [
	"name",
	"alias",

	"dialects",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"freeRules2024",
	"additionalSources",
	"otherSources",
	"reprintedAs",

	"type",
	"typicalSpeakers",
	"script",

	"fonts",

	"entries",

	"hasFluff",
	"hasFluffImages",

	"fluff",
];
PropOrder._LANGUAGE_SCRIPT = [
	"name",

	"source",

	"fonts",
];
PropOrder._NAME = [
	"name",

	"source",
	"page",
	"legacy",

	"tables",
];
PropOrder._CONDITION = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"freeRules2024",
	"otherSources",
	"reprintedAs",

	"color",

	"entries",

	"hasFluff",
	"hasFluffImages",

	"fluff",
];
PropOrder._DISEASE = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"freeRules2024",
	"otherSources",
	"reprintedAs",

	"type",

	"color",

	"entries",

	"hasFluff",
	"hasFluffImages",

	"fluff",

	...PROPS_FOUNDRY_DATA_INLINE,
];
PropOrder._STATUS = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"freeRules2024",
	"otherSources",
	"reprintedAs",

	"color",

	"entries",

	"hasFluff",
	"hasFluffImages",

	"fluff",
];
PropOrder._CULT = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"freeRules2024",
	"additionalSources",
	"otherSources",
	"reprintedAs",

	"type",

	"goal",
	"cultists",
	"signaturespells",

	"entries",
];
PropOrder._BOON = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"freeRules2024",
	"additionalSources",
	"otherSources",
	"reprintedAs",

	"type",

	"ability",

	"goal",
	"cultists",
	"signaturespells",

	"entries",
];
PropOrder._DEITY = [
	"name",
	"alias",
	"reprintAlias",
	"altNames",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"freeRules2024",
	"additionalSources",
	"otherSources",

	new PropOrder._ObjectKey("_copy", {
		order: [
			"name",
			"source",
			"pantheon",
			new PropOrder._ObjectKey("_mod", {
				fnGetOrder: () => PropOrder._DEITY__COPY_MOD,
			}),
			"_preserve",
		],
	}),

	// This is used as part of the ID key
	"pantheon",

	"customExtensionOf",

	"alignment",
	"title",
	"category",
	"domains",
	"province",
	"dogma",
	"worshipers",
	"plane",
	"symbol",
	"symbolImg",
	"favoredWeapons",

	"piety",

	new PropOrder._ObjectKey("customProperties", {
		fnGetOrder: obj => Object.keys(obj).sort(SortUtil.ascSortLower),
	}),

	"entries",

	...PROPS_FOUNDRY_DATA_INLINE,
];
PropOrder._DEITY__COPY_MOD = [
	"*",
	"_",
	...PropOrder._DEITY,
];
PropOrder._FEAT = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"freeRules2024",
	"additionalSources",
	"otherSources",
	"reprintedAs",

	PropOrder._ObjectKey.getCopyKey({fnGetModOrder: () => PropOrder._FEAT__COPY_MOD}),

	"category",
	"prerequisite",

	"repeatable",
	"repeatableNote",
	"repeatableHidden",

	"ability",

	new PropOrder._ArrayKey("traitTags", {fnSort: SortUtil.ascSortLower}),
	"skillProficiencies",
	"languageProficiencies",
	"toolProficiencies",
	"weaponProficiencies",
	"armorProficiencies",
	"skillToolLanguageProficiencies",
	"savingThrowProficiencies",
	"expertise",

	"immune",
	"resist",
	"vulnerable",
	"conditionImmune",

	"senses",
	"bonusSenses",

	"additionalSpells",

	"featProgression",
	"optionalfeatureProgression",

	"entries",

	"hasFluff",
	"hasFluffImages",

	"fluff",

	...PROPS_FOUNDRY_DATA_INLINE,

	new PropOrder._ArrayKey("_versions", {
		fnGetOrder: () => [
			"name",
			"source",
			new PropOrder._ObjectKey("_mod", {
				fnGetOrder: () => PropOrder._FEAT__COPY_MOD,
			}),
			"_preserve",
			"_abstract",
			"_implementations",
			...PropOrder._FEAT,
		],
		fnSort: getFnListSort("feat"),
	}),
];
PropOrder._FEAT__COPY_MOD = [
	"*",
	"_",
	...PropOrder._FEAT,
];
PropOrder._VEHICLE = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"freeRules2024",
	"otherSources",
	"reprintedAs",

	"vehicleType",

	"size",
	"dimensions",
	"weight",

	"type",
	"terrain",

	"capCreature",
	"capCrew",
	"capCrewNote",
	"capPassenger",
	"capCargo",

	"cost",

	"ac",
	"pace",
	"speed",

	"str",
	"dex",
	"con",
	"int",
	"wis",
	"cha",

	"hp",

	"resist",
	"immune",
	"vulnerable",
	"conditionImmune",

	"hull",
	"control",
	"movement",
	"weapon",
	"other",

	"entries",
	"trait",
	"actionThresholds",
	"action",
	"actionStation",
	"reaction",

	"tokenUrl",
	"token",
	"tokenHref",
	"tokenCredit",

	"hasToken",
	"hasFluff",
	"hasFluffImages",

	"fluff",

	...PROPS_FOUNDRY_DATA_INLINE,
];
PropOrder._VEHICLE_UPGRADE = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"freeRules2024",
	"otherSources",

	"upgradeType",

	"entries",
];
PropOrder._RACE_FLUFF = [
	"name",
	"source",

	"uncommon",
	"monstrous",

	"_copy",

	"entries",
	"images",
];
PropOrder._ITEM = [
	"name",
	"alias",
	"namePrefix",
	"nameSuffix",
	"nameRemove",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"freeRules2024",
	"additionalSources",
	"otherSources",
	"reprintedAs",

	PropOrder._ObjectKey.getCopyKey({fnGetModOrder: () => PropOrder._ITEM__COPY_MOD}),

	"baseItem",

	"edition",

	"type",
	"typeAlt",
	"scfType",

	"immune",
	"resist",
	"vulnerable",
	"conditionImmune",

	"detail1",
	"detail2",

	"tier",
	"rarity",
	"reqAttune",
	"reqAttuneAlt",

	"reqAttuneTags",
	"reqAttuneAltTags",

	"wondrous",
	"tattoo",
	"curse",
	"sentient",

	"weight",
	"weightMult",
	"weightNote",
	"weightExpression",
	"value",
	"valueMult",
	"valueExpression",
	"valueRarity",
	"quantity",
	"currencyConversion",

	"weaponCategory",
	"age",

	"property",
	"propertyAdd",
	"propertyRemove",
	"mastery",

	"range",
	"reload",

	"dmg1",
	"dmgType",
	"dmg2",

	"ac",
	"acSpecial",
	"strength",
	"dexterityMax",

	"crew",
	"crewMin",
	"crewMax",
	"vehAc",
	"vehHp",
	"vehDmgThresh",
	"vehSpeed",
	"capPassenger",
	"capCargo",
	"travelCost",
	"shippingCost",

	"carryingCapacity",
	"speed",

	"barDimensions",

	"ability",
	"grantsProficiency",
	"grantsLanguage",

	"bonusWeapon",
	"bonusWeaponAttack",
	"bonusWeaponDamage",
	"bonusWeaponCritDamage",
	"bonusSpellAttack",
	"bonusSpellDamage",
	"bonusSpellSaveDc",
	"bonusAc",
	"bonusSavingThrow",
	"bonusAbilityCheck",
	"bonusProficiencyBonus",
	"bonusSavingThrowConcentration",
	"modifySpeed",
	"reach",
	"critThreshold",

	"recharge",
	"rechargeAmount",
	"charges",

	"armor",
	"arrow",
	"axe",
	"barding",
	"bolt",
	"bow",
	"bulletFirearm",
	"bulletSling",
	"cellEnergy",
	"club",
	"crossbow",
	"dagger",
	"firearm",
	"focus",
	"hammer",
	"mace",
	"needleBlowgun",
	"net",
	"lance",
	"poison",
	"polearm",
	"rapier",
	"spear",
	"staff",
	"stealth",
	"sword",
	"weapon",

	"hasRefs",
	"entries",
	"additionalEntries",
	"items",
	"itemsHidden",

	"ammoType",
	"poisonTypes",

	"packContents",
	"atomicPackContents",
	"containerCapacity",

	"light",

	"optionalfeatures",
	"attachedSpells",
	"spellScrollLevel",
	"lootTables",

	"seeAlsoDeck",
	"seeAlsoVehicle",

	new PropOrder._ObjectKey("customProperties", {
		fnGetOrder: obj => Object.keys(obj).sort(SortUtil.ascSortLower),
	}),

	new PropOrder._ArrayKey("miscTags", {fnSort: SortUtil.ascSortLower}),

	"hasFluff",
	"hasFluffImages",

	"fluff",

	...PROPS_FOUNDRY_DATA_INLINE,
];
PropOrder._ITEM__COPY_MOD = [
	"*",
	"_",
	...PropOrder._ITEM,
];
PropOrder._MAGICVARIANT = [
	"name",
	"alias",
	"source",

	"edition",

	"type",

	"requires",
	"excludes",

	"rarity",

	"ammo",

	"entries",

	new PropOrder._ObjectKey("inherits", {
		order: PropOrder._ITEM,
	}),

	"hasFluff",
	"hasFluffImages",

	"fluff",
];
PropOrder._ITEM_MASTERY = [
	"name",
	"source",

	"page",
	"srd",
	"srd52",
	"basicRules",
	"freeRules2024",

	"prerequisite",

	"entries",
];
PropOrder._ITEM_PROPERTY = [
	"name",
	"abbreviation",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"freeRules2024",
	"reprintedAs",

	PropOrder._ObjectKey.getCopyKey({
		identKeys: [
			"abbreviation",
			"source",
		],
		fnGetModOrder: () => PropOrder._ITEM_PROPERTY__COPY_MOD,
	}),

	"template",

	"entries",
	"entriesTemplate",
];
PropOrder._ITEM_PROPERTY__COPY_MOD = [
	"*",
	"_",
	...PropOrder._ITEM_PROPERTY,
];
PropOrder._REDUCED_ITEM_PROPERTY = [
	...PropOrder._ITEM_PROPERTY,
];
PropOrder._ITEM_TYPE = [
	"name",
	"abbreviation",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"freeRules2024",
	"reprintedAs",

	PropOrder._ObjectKey.getCopyKey({
		identKeys: [
			"abbreviation",
			"source",
		],
		fnGetModOrder: () => PropOrder._ITEM_PROPERTY__COPY_MOD,
	}),

	"template",

	"entries",
	"entriesTemplate",
];
PropOrder._ITEM_TYPE__COPY_MOD = [
	"*",
	"_",
	...PropOrder._ITEM_TYPE,
];
PropOrder._REDUCED_ITEM_TYPE = [
	...PropOrder._ITEM_TYPE,
];
PropOrder._ITEM_TYPE_ADDITIONAL_ENTRIES = [
	"name",

	"source",
	"page",

	"appliesTo",

	"entries",
];
PropOrder._ITEM_ENTRY = [
	"name",

	"source",

	"entriesTemplate",
];
PropOrder._OBJECT = [
	"name",
	"alias",

	"isNpc",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"freeRules2024",
	"otherSources",
	"reprintedAs",

	"size",
	"objectType",
	"creatureType",

	"ac",
	"hp",
	"speed",

	"str",
	"dex",
	"con",
	"int",
	"wis",
	"cha",

	"senses",

	"immune",
	"resist",
	"vulnerable",
	"conditionImmune",

	"entries",
	"actionEntries",

	"tokenUrl",
	"token",
	"tokenHref",
	"tokenCredit",
	"hasToken",
	"hasFluff",
	"hasFluffImages",

	"fluff",

	...PROPS_FOUNDRY_DATA_INLINE,
];
PropOrder._OPTIONALFEATURE = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"freeRules2024",
	"otherSources",
	"reprintedAs",

	PropOrder._ObjectKey.getCopyKey({fnGetModOrder: () => PropOrder._OPTIONALFEATURE__COPY_MOD}),

	"isClassFeatureVariant",
	"previousVersion",

	"featureType",

	"prerequisite",

	"skillProficiencies",
	"languageProficiencies",
	"toolProficiencies",
	"weaponProficiencies",
	"armorProficiencies",
	"skillToolLanguageProficiencies",
	"expertise",

	"resist",
	"immune",
	"vulnerable",
	"conditionImmune",

	"senses",
	"bonusSenses",

	"additionalSpells",

	"featProgression",
	"optionalfeatureProgression",

	"consumes",

	"entries",

	"hasFluff",
	"hasFluffImages",

	"fluff",

	...PROPS_FOUNDRY_DATA_INLINE,
];
PropOrder._OPTIONALFEATURE__COPY_MOD = [
	"*",
	"_",
	...PropOrder._OPTIONALFEATURE,
];
PropOrder._PSIONIC = [
	"name",
	"alias",

	"source",
	"page",

	"type",
	"order",

	"entries",

	"focus",
	"modes",
];
PropOrder._REWARD = [
	"name",
	"alias",

	"source",
	"page",
	"reprintedAs",

	"type",

	"rarity",

	"additionalSpells",

	"entries",

	"hasFluff",
	"hasFluffImages",

	"fluff",

	...PROPS_FOUNDRY_DATA_INLINE,
];
PropOrder._VARIANTRULE = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"freeRules2024",
	"additionalSources",
	"otherSources",
	"reprintedAs",

	"ruleType",

	"type",
	"entries",

	...PROPS_FOUNDRY_DATA_INLINE,
];
PropOrder._RACE_SUBRACE = [
	"page",
	"srd",
	"srd52",
	"basicRules",
	"freeRules2024",
	"additionalSources",
	"otherSources",
	"reprintedAs",

	"edition",

	PropOrder._ObjectKey.getCopyKey({
		identKeys: [
			"name",
			"source",
			"raceName",
			"raceSource",
		],
		fnGetModOrder: () => PropOrder._RACE__COPY_MOD,
	}),

	"lineage",
	"creatureTypes",
	"creatureTypeTags",

	new PropOrder._ArrayKey("size", {fnSort: SortUtil.ascSortSize}),
	"speed",
	"ability",

	"heightAndWeight",
	"age",

	"darkvision",
	"blindsight",
	"feats",

	new PropOrder._ArrayKey("traitTags", {fnSort: SortUtil.ascSortLower}),
	"skillProficiencies",
	"languageProficiencies",
	"toolProficiencies",
	"weaponProficiencies",
	"armorProficiencies",
	"skillToolLanguageProficiencies",
	"expertise",

	"resist",
	"immune",
	"vulnerable",
	"conditionImmune",

	"soundClip",

	"startingEquipment",

	"additionalSpells",

	"abilityEntry",
	"creatureTypesEntry",
	"sizeEntry",
	"speedEntry",

	"entries",

	"overwrite",

	"hasFluff",
	"hasFluffImages",

	"fluff",

	...PROPS_FOUNDRY_DATA_INLINE,

	new PropOrder._ArrayKey("_versions", {
		fnGetOrder: () => [
			"name",
			"source",
			"raceName",
			"raceSource",
			new PropOrder._ObjectKey("_mod", {
				fnGetOrder: () => PropOrder._RACE__COPY_MOD,
			}),
			"_preserve",
			"_abstract",
			"_implementations",
			...PropOrder._RACE,
		],
		fnSort: getFnListSort("subrace"),
	}),
];
PropOrder._RACE = [
	"name",
	"alias",

	"source",

	...PropOrder._RACE_SUBRACE,
];
PropOrder._RACE__COPY_MOD = [
	"*",
	"_",
	...PropOrder._RACE,
];
PropOrder._SUBRACE = [
	"name",
	"alias",

	"source",

	"raceName",
	"raceSource",

	...PropOrder._RACE_SUBRACE,
];
PropOrder._FOUNDRY_RACE_FEATURE = [
	"name",

	"source",

	"raceName",
	"raceSource",

	PropOrder._ObjectKey.getCopyKey({
		identKeys: [
			"name",
			"source",
			"raceName",
			"raceSource",
		],
		fnGetModOrder: () => PropOrder._FOUNDRY_RACE_FEATURE__COPY_MOD,
	}),

	"system",
	"activities",
	"effects",
	"flags",
	"img",

	"migrationVersion",
];
PropOrder._FOUNDRY_RACE_FEATURE__COPY_MOD = [
	"*",
	"_",
	...PropOrder._FOUNDRY_RACE_FEATURE,
];
PropOrder._TABLE = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"freeRules2024",
	"otherSources",

	"type",

	"chapter",

	"caption",

	"colLabels",
	"colLabelRows",
	"colStyles",

	"rowLabels",

	"intro",
	"rows",
	new PropOrder._ArrayKey("tables", {
		fnGetOrder: () => PropOrder._TABLE,
	}),
	"outro",
	"footnotes",

	"isNameGenerator",
	"isStriped",
];
PropOrder._TRAP = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"freeRules2024",
	"otherSources",
	"reprintedAs",

	"trapHazType",

	"rating",

	"hauntBonus",

	"effect",

	"trigger",
	"duration",

	"initiative",
	"initiativeNote",

	"eActive",
	"eDynamic",
	"eConstant",

	"countermeasures",

	"entries",

	"hasFluff",
	"hasFluffImages",

	"fluff",
];
PropOrder._HAZARD = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"freeRules2024",
	"additionalSources",
	"otherSources",
	"reprintedAs",

	"trapHazType",

	"rating",

	"entries",

	"hasFluff",
	"hasFluffImages",

	"fluff",
];
PropOrder._RECIPE = [
	"name",
	"alias",

	"source",
	"page",

	"otherSources",

	"type",
	"dishTypes",

	"diet",
	"allergenGroups",

	"time",
	"makes",
	"serves",
	"ingredients",
	"equipment",
	"instructions",
	"noteCook",

	new PropOrder._ArrayKey("miscTags", {fnSort: SortUtil.ascSortLower}),

	"fluff",

	"hasFluff",
	"hasFluffImages",

	"fluff",
];
PropOrder._CHAROPTION = [
	"name",
	"alias",

	"source",
	"page",

	"otherSources",

	"prerequisite",

	"optionType",

	"entries",

	"hasFluff",
	"hasFluffImages",

	"fluff",
];
PropOrder._SKILL = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"freeRules2024",
	"otherSources",
	"reprintedAs",

	"ability",

	"entries",
];
PropOrder._SENSE = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"freeRules2024",
	"otherSources",
	"reprintedAs",

	"entries",
];
PropOrder._DECK = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"freeRules2024",
	"otherSources",

	PropOrder._ObjectKey.getCopyKey({fnGetModOrder: () => PropOrder._DECK__COPY_MOD}),

	"cards",
	"back",

	"entries",

	"hasCardArt",
];

PropOrder._DECK__COPY_MOD = [
	"*",
	"_",
	...PropOrder._DECK,
];
PropOrder._CARD = [
	"name",
	"alias",

	"source",
	"set",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"freeRules2024",
	"otherSources",

	"suit",
	"value",
	"valueName",

	"face",
	"back",

	"entries",
];

PropOrder._ENCOUNTER = [
	"name",

	"source",
	"page",

	new PropOrder._ArrayKey("tables", {
		order: [
			"caption",
			"minlvl",
			"maxlvl",

			"diceExpression",
			"rollAttitude",
			"table",

			"footnotes",
		],
		fnSort: SortUtil.ascSortEncounter,
	}),
];

PropOrder._CITATION = [
	"name",

	"source",
	"page",

	"entries",
];

PropOrder._FOUNDRY_MAP = [
	"name",

	"source",

	"lights",
	"walls",

	"migrationVersion",
];

PropOrder._FACILITY = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"freeRules2024",
	"otherSources",
	"reprintedAs",

	"facilityType",

	"level",
	"prerequisite",
	"space",
	"hirelings",
	"orders",

	"entries",

	"hasFluff",
	"hasFluffImages",

	"fluff",
];

PropOrder._PROP_TO_LIST = {
	"_meta": PropOrder._META,
	"_test": PropOrder._TEST,
	"monster": PropOrder._MONSTER,
	"foundryMonster": PropOrder._FOUNDRY_MONSTER,
	"monsterFluff": PropOrder._GENERIC_FLUFF,
	"monsterTemplate": PropOrder._MONSTER_TEMPLATE,
	"makebrewCreatureTrait": PropOrder._MAKE_BREW_CREATURE_TRAIT,
	"makebrewCreatureAction": PropOrder._MAKE_BREW_CREATURE_ACTION,
	"backgroundFluff": PropOrder._GENERIC_FLUFF,
	"featFluff": PropOrder._GENERIC_FLUFF,
	"optionalfeatureFluff": PropOrder._GENERIC_FLUFF,
	"conditionFluff": PropOrder._GENERIC_FLUFF,
	"diseaseFluff": PropOrder._GENERIC_FLUFF,
	"statusFluff": PropOrder._GENERIC_FLUFF,
	"itemFluff": PropOrder._GENERIC_FLUFF,
	"languageFluff": PropOrder._GENERIC_FLUFF,
	"vehicleFluff": PropOrder._GENERIC_FLUFF,
	"objectFluff": PropOrder._GENERIC_FLUFF,
	"raceFluff": PropOrder._RACE_FLUFF,
	"rewardFluff": PropOrder._GENERIC_FLUFF,
	"trapFluff": PropOrder._GENERIC_FLUFF,
	"hazardFluff": PropOrder._GENERIC_FLUFF,
	"spell": PropOrder._SPELL,
	"roll20Spell": PropOrder._ROLL20_SPELL,
	"foundrySpell": PropOrder._FOUNDRY_GENERIC,
	"spellList": PropOrder._SPELL_LIST,
	"action": PropOrder._ACTION,
	"foundryAction": PropOrder._FOUNDRY_GENERIC,
	"adventure": PropOrder._ADVENTURE,
	"adventureData": PropOrder._ADVENTURE_DATA,
	"book": PropOrder._BOOK,
	"bookData": PropOrder._BOOK_DATA,
	"background": PropOrder._BACKGROUND,
	"legendaryGroup": PropOrder._LEGENDARY_GROUP,
	"class": PropOrder._CLASS,
	"classFluff": PropOrder._GENERIC_FLUFF,
	"foundryClass": PropOrder._FOUNDRY_CLASS,
	"subclass": PropOrder._SUBCLASS,
	"subclassFluff": PropOrder._SUBCLASS_FLUFF,
	"foundrySubclass": PropOrder._FOUNDRY_SUBCLASS,
	"classFeature": PropOrder._CLASS_FEATURE,
	"subclassFeature": PropOrder._SUBCLASS_FEATURE,
	"foundryClassFeature": PropOrder._FOUNDRY_CLASS_FEATURE,
	"foundrySubclassFeature": PropOrder._FOUNDRY_SUBCLASS_FEATURE,
	"language": PropOrder._LANGUAGE,
	"languageScript": PropOrder._LANGUAGE_SCRIPT,
	"name": PropOrder._NAME,
	"condition": PropOrder._CONDITION,
	"disease": PropOrder._DISEASE,
	"status": PropOrder._STATUS,
	"cult": PropOrder._CULT,
	"boon": PropOrder._BOON,
	"deity": PropOrder._DEITY,
	"feat": PropOrder._FEAT,
	"foundryFeat": PropOrder._FOUNDRY_GENERIC_FEATURE,
	"vehicle": PropOrder._VEHICLE,
	"vehicleUpgrade": PropOrder._VEHICLE_UPGRADE,
	"foundryVehicleUpgrade": PropOrder._FOUNDRY_GENERIC_FEATURE,
	"item": PropOrder._ITEM,
	"foundryItem": PropOrder._FOUNDRY_GENERIC,
	"baseitem": PropOrder._ITEM,
	"magicvariant": PropOrder._MAGICVARIANT,
	"foundryMagicvariant": PropOrder._FOUNDRY_GENERIC,
	"itemGroup": PropOrder._ITEM,
	"itemMastery": PropOrder._ITEM_MASTERY,
	"itemProperty": PropOrder._ITEM_PROPERTY,
	"reducedItemProperty": PropOrder._REDUCED_ITEM_PROPERTY,
	"itemType": PropOrder._ITEM_TYPE,
	"itemTypeAdditionalEntries": PropOrder._ITEM_TYPE_ADDITIONAL_ENTRIES,
	"reducedItemType": PropOrder._REDUCED_ITEM_TYPE,
	"itemEntry": PropOrder._ITEM_ENTRY,
	"object": PropOrder._OBJECT,
	"optionalfeature": PropOrder._OPTIONALFEATURE,
	"foundryOptionalfeature": PropOrder._FOUNDRY_GENERIC_FEATURE,
	"psionic": PropOrder._PSIONIC,
	"foundryPsionic": PropOrder._FOUNDRY_GENERIC_FEATURE,
	"reward": PropOrder._REWARD,
	"foundryReward": PropOrder._FOUNDRY_GENERIC_FEATURE,
	"variantrule": PropOrder._VARIANTRULE,
	"spellFluff": PropOrder._GENERIC_FLUFF,
	"race": PropOrder._RACE,
	"foundryRace": PropOrder._FOUNDRY_GENERIC_FEATURE,
	"subrace": PropOrder._SUBRACE,
	"foundryRaceFeature": PropOrder._FOUNDRY_RACE_FEATURE,
	"table": PropOrder._TABLE,
	"trap": PropOrder._TRAP,
	"hazard": PropOrder._HAZARD,
	"recipe": PropOrder._RECIPE,
	"recipeFluff": PropOrder._GENERIC_FLUFF,
	"charoption": PropOrder._CHAROPTION,
	"charoptionFluff": PropOrder._GENERIC_FLUFF,
	"skill": PropOrder._SKILL,
	"sense": PropOrder._SENSE,
	"deck": PropOrder._DECK,
	"card": PropOrder._CARD,
	"encounter": PropOrder._ENCOUNTER,
	"citation": PropOrder._CITATION,
	"foundryMap": PropOrder._FOUNDRY_MAP,
	"facility": PropOrder._FACILITY,
	"facilityFluff": PropOrder._GENERIC_FLUFF,
};

PropOrder._ROOT = [
	"$schema",

	new PropOrder._ObjectKey("_meta", {
		fnGetOrder: () => PropOrder._META,
	}),
	new PropOrder._ObjectKey("_test", {
		fnGetOrder: () => PropOrder._TEST,
	}),

	// region Player options
	PropOrder._ArrayKey.getRootKey("class"),
	PropOrder._ArrayKey.getRootKey("foundryClass"),
	PropOrder._ArrayKey.getRootKey("classFluff"),
	PropOrder._ArrayKey.getRootKey("subclass"),
	PropOrder._ArrayKey.getRootKey("foundrySubclass"),
	PropOrder._ArrayKey.getRootKey("subclassFluff"),
	PropOrder._ArrayKey.getRootKey("classFeature"),
	PropOrder._ArrayKey.getRootKey("foundryClassFeature"),
	PropOrder._ArrayKey.getRootKey("subclassFeature"),
	PropOrder._ArrayKey.getRootKey("foundrySubclassFeature"),

	PropOrder._ArrayKey.getRootKey("optionalfeature"),
	PropOrder._ArrayKey.getRootKey("optionalfeatureFluff"),
	PropOrder._ArrayKey.getRootKey("foundryOptionalfeature"),

	PropOrder._ArrayKey.getRootKey("background"),
	PropOrder._ArrayKey.getRootKey("backgroundFeature"),
	PropOrder._ArrayKey.getRootKey("backgroundFluff"),

	PropOrder._ArrayKey.getRootKey("race"),
	PropOrder._ArrayKey.getRootKey("subrace"),
	PropOrder._ArrayKey.getRootKey("foundryRace"),
	PropOrder._ArrayKey.getRootKey("foundryRaceFeature"),
	PropOrder._ArrayKey.getRootKey("raceFluff"),
	new PropOrder._IgnoredKey("raceFluffMeta"),

	PropOrder._ArrayKey.getRootKey("feat"),
	PropOrder._ArrayKey.getRootKey("foundryFeat"),
	PropOrder._ArrayKey.getRootKey("featFluff"),

	PropOrder._ArrayKey.getRootKey("reward"),
	PropOrder._ArrayKey.getRootKey("foundryReward"),
	PropOrder._ArrayKey.getRootKey("rewardFluff"),

	PropOrder._ArrayKey.getRootKey("charoption"),
	PropOrder._ArrayKey.getRootKey("charoptionFluff"),
	// endregion

	// region General entities
	PropOrder._ArrayKey.getRootKey("spell"),
	PropOrder._ArrayKey.getRootKey("spellFluff"),
	PropOrder._ArrayKey.getRootKey("foundrySpell"),
	PropOrder._ArrayKey.getRootKey("spellList"),

	PropOrder._ArrayKey.getRootKey("baseitem"),
	PropOrder._ArrayKey.getRootKey("item"),
	PropOrder._ArrayKey.getRootKey("itemGroup"),
	PropOrder._ArrayKey.getRootKey("magicvariant"),
	PropOrder._ArrayKey.getRootKey("itemFluff"),
	PropOrder._ArrayKey.getRootKey("foundryItem"),
	PropOrder._ArrayKey.getRootKey("foundryMagicvariant"),

	PropOrder._ArrayKey.getRootKey("itemProperty"),
	PropOrder._ArrayKey.getRootKey("reducedItemProperty"),
	PropOrder._ArrayKey.getRootKey("itemType"),
	PropOrder._ArrayKey.getRootKey("reducedItemType"),
	PropOrder._ArrayKey.getRootKey("itemTypeAdditionalEntries"),
	PropOrder._ArrayKey.getRootKey("itemEntry"),
	PropOrder._ArrayKey.getRootKey("itemMastery"),
	new PropOrder._IgnoredKey("linkedLootTables"),

	PropOrder._ArrayKey.getRootKey("deck"),
	PropOrder._ArrayKey.getRootKey("card"),

	PropOrder._ArrayKey.getRootKey("deity"),

	PropOrder._ArrayKey.getRootKey("facility"),
	PropOrder._ArrayKey.getRootKey("facilityFluff"),

	PropOrder._ArrayKey.getRootKey("language"),
	PropOrder._ArrayKey.getRootKey("languageScript"),
	PropOrder._ArrayKey.getRootKey("languageFluff"),
	// endregion

	// region GM-specific
	PropOrder._ArrayKey.getRootKey("monster"),
	PropOrder._ArrayKey.getRootKey("monsterFluff"),
	PropOrder._ArrayKey.getRootKey("foundryMonster"),
	PropOrder._ArrayKey.getRootKey("legendaryGroup"),
	PropOrder._ArrayKey.getRootKey("monsterTemplate"),

	PropOrder._ArrayKey.getRootKey("object"),
	PropOrder._ArrayKey.getRootKey("objectFluff"),

	PropOrder._ArrayKey.getRootKey("vehicle"),
	PropOrder._ArrayKey.getRootKey("vehicleUpgrade"),
	PropOrder._ArrayKey.getRootKey("foundryVehicleUpgrade"),
	PropOrder._ArrayKey.getRootKey("vehicleFluff"),

	PropOrder._ArrayKey.getRootKey("cult"),
	PropOrder._ArrayKey.getRootKey("boon"),

	PropOrder._ArrayKey.getRootKey("trap"),
	PropOrder._ArrayKey.getRootKey("trapFluff"),
	PropOrder._ArrayKey.getRootKey("hazard"),
	PropOrder._ArrayKey.getRootKey("hazardFluff"),

	PropOrder._ArrayKey.getRootKey("encounter"),
	PropOrder._ArrayKey.getRootKey("name"),
	// endregion

	// region Rules
	PropOrder._ArrayKey.getRootKey("variantrule"),
	PropOrder._ArrayKey.getRootKey("table"),

	PropOrder._ArrayKey.getRootKey("condition"),
	PropOrder._ArrayKey.getRootKey("conditionFluff"),
	PropOrder._ArrayKey.getRootKey("disease"),
	PropOrder._ArrayKey.getRootKey("diseaseFluff"),
	PropOrder._ArrayKey.getRootKey("status"),
	PropOrder._ArrayKey.getRootKey("statusFluff"),

	PropOrder._ArrayKey.getRootKey("action"),
	PropOrder._ArrayKey.getRootKey("foundryAction"),

	PropOrder._ArrayKey.getRootKey("skill"),

	PropOrder._ArrayKey.getRootKey("sense"),

	PropOrder._ArrayKey.getRootKey("citation"),

	PropOrder._ArrayKey.getRootKey("adventure"),
	PropOrder._ArrayKey.getRootKey("adventureData"),
	PropOrder._ArrayKey.getRootKey("book"),
	PropOrder._ArrayKey.getRootKey("bookData"),
	// endregion

	// region Other
	PropOrder._ArrayKey.getRootKey("recipe"),
	PropOrder._ArrayKey.getRootKey("recipeFluff"),
	// endregion

	// region Legacy content
	PropOrder._ArrayKey.getRootKey("psionic"),
	new PropOrder._IgnoredKey("psionicDisciplineFocus"),
	new PropOrder._IgnoredKey("psionicDisciplineActive"),
	// endregion

	// region Tooling
	PropOrder._ArrayKey.getRootKey("makebrewCreatureTrait"),
	PropOrder._ArrayKey.getRootKey("makebrewCreatureAction"),
	PropOrder._ArrayKey.getRootKey("monsterfeatures"),
	// endregion

	// region Roll20-specific
	PropOrder._ArrayKey.getRootKey("roll20Spell"),
	// endregion

	// region Non-brew data
	new PropOrder._IgnoredKey("blocklist"),
	// endregion

	// region Misc ignored keys
	new PropOrder._IgnoredKey("data"),
	// endregion
];
