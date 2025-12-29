import {ArrayKey, IgnoredKey, ObjectKey, ObjectOrArrayKey} from "./utils-proporder-models.js";
import {PROPS_FOUNDRY_DATA_INLINE} from "../foundry/foundry-consts.js";
import {getFnRootPropListSort} from "./utils-proporder-sort.js";
import {PROPORDER_ENTRY_DATA_OBJECT, PROPORDER_FOUNDRY_ACTIVITIES, PROPORDER_FOUNDRY_EFFECTS} from "./utils-proporder-config-shared.js";

const PROPORDER_META = [
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
const PROPORDER_TEST = [
	"additionalImageSources",
];
const PROPORDER_FOUNDRY_GENERIC = [
	"name",
	"source",

	"type",
	"system",
	PROPORDER_FOUNDRY_ACTIVITIES,
	PROPORDER_FOUNDRY_EFFECTS,
	"flags",
	"img",
	"advice",

	new ObjectKey("subEntities", {
		fnGetOrder: () => PROPORDER_ROOT,
	}),

	"_merge",

	"migrationVersion",
];
const PROPORDER_FOUNDRY_GENERIC_FEATURE = [
	"name",
	"source",

	"type",
	"system",
	PROPORDER_FOUNDRY_ACTIVITIES,
	PROPORDER_FOUNDRY_EFFECTS,
	"flags",
	"img",
	"advice",

	"isIgnored",
	"ignoreSrdActivities",
	"ignoreSrdEffects",

	"entries",

	new ObjectKey("entryData", {
		fnGetOrder: () => PROPORDER_ENTRY_DATA_OBJECT,
	}),

	"advancement",

	new ObjectKey("subEntities", {
		fnGetOrder: () => PROPORDER_ROOT,
	}),

	"_merge",

	"migrationVersion",
];
const PROPORDER_MONSTER = [
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
	"basicRules2024",
	"additionalSources",
	"otherSources",
	"isReprinted",
	"reprintedAs",

	"summonedBySpell",
	"summonedBySpellLevel",
	"summonedByClass",
	"summonedScaleByPlayerLevel",

	"_isCopy",
	ObjectKey.getCopyKey({fnGetModOrder: () => PROPORDER_MONSTER__COPY_MOD}),

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

	new ArrayKey("spellcasting", {
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
	"tokenCustom",
	"soundClip",

	...PROPS_FOUNDRY_DATA_INLINE,

	"altArt",

	new ArrayKey("attachedItems", {fnSort: SortUtil.ascSortLower}),
	new ArrayKey("traitTags", {fnSort: SortUtil.ascSortLower}),
	new ArrayKey("senseTags", {fnSort: SortUtil.ascSortLower}),
	new ArrayKey("actionTags", {fnSort: SortUtil.ascSortLower}),
	new ArrayKey("languageTags", {fnSort: SortUtil.ascSortLower}),
	new ArrayKey("damageTags", {fnSort: SortUtil.ascSortLower}),
	new ArrayKey("damageTagsLegendary", {fnSort: SortUtil.ascSortLower}),
	new ArrayKey("damageTagsSpell", {fnSort: SortUtil.ascSortLower}),
	new ArrayKey("spellcastingTags", {fnSort: SortUtil.ascSortLower}),
	new ArrayKey("miscTags", {fnSort: SortUtil.ascSortLower}),
	new ArrayKey("conditionInflict", {fnSort: SortUtil.ascSortLower}),
	new ArrayKey("conditionInflictLegendary", {fnSort: SortUtil.ascSortLower}),
	new ArrayKey("conditionInflictSpell", {fnSort: SortUtil.ascSortLower}),
	new ArrayKey("savingThrowForced", {fnSort: SortUtil.ascSortLower}),
	new ArrayKey("savingThrowForcedLegendary", {fnSort: SortUtil.ascSortLower}),
	new ArrayKey("savingThrowForcedSpell", {fnSort: SortUtil.ascSortLower}),

	"hasToken",
	"hasFluff",
	"hasFluffImages",

	"fluff",

	new ArrayKey("_versions", {
		fnGetOrder: () => [
			"name",
			"source",
			new ObjectKey("_mod", {
				fnGetOrder: () => PROPORDER_MONSTER__COPY_MOD,
			}),
			"_preserve",
			"_abstract",
			"_implementations",
			...PROPORDER_MONSTER,
		],
		fnSort: getFnRootPropListSort("monster"),
	}),
];
const PROPORDER_MONSTER__COPY_MOD = [
	"*",
	"_",
	...PROPORDER_MONSTER
		.map(it => {
			if (typeof it === "string") return it;

			if (it instanceof ArrayKey) {
				if (it.key === "spellcasting") return it.key;
				return it;
			}

			return it;
		}),
];
const PROPORDER_MONSTER_TEMPLATE = [
	"name",

	"source",
	"page",

	"ref",

	ObjectKey.getCopyKey({fnGetModOrder: () => PROPORDER_MONSTER_TEMPLATE__COPY_MOD}),

	"crMin",
	"crMax",

	new ObjectKey("prerequisite", {
		order: PROPORDER_MONSTER,
	}),
	new ObjectKey("apply", {
		order: [
			new ObjectKey("_root", {
				order: PROPORDER_MONSTER,
			}),
			new ObjectKey("_mod", {
				fnGetOrder: () => PROPORDER_MONSTER__COPY_MOD,
			}),
		],
	}),
];
const PROPORDER_MAKE_BREW_CREATURE_TRAIT = [
	"name",
	"source",
	"reprintedAs",

	"entries",
];
const PROPORDER_MAKE_BREW_CREATURE_ACTION = [
	"name",
	"source",
	"reprintedAs",

	"entries",
];
const PROPORDER_MONSTER_TEMPLATE__COPY_MOD = [
	"*",
	"_",
	...PROPORDER_MONSTER_TEMPLATE,
];
const PROPORDER_FOUNDRY_MONSTER = [
	"name",
	"source",

	"system",
	"prototypeToken",
	PROPORDER_FOUNDRY_EFFECTS,
	"flags",
	"img",
	"advice",

	"migrationVersion",
];
const PROPORDER_GENERIC_FLUFF = [
	"name",

	"preserveName",

	"source",

	"_copy",

	"entries",
	"images",
];
const PROPORDER_ROLL20_SPELL = [
	"name",
	"source",

	new ObjectKey("data", {
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
const PROPORDER_SPELL = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"basicRules2024",
	"additionalSources",
	"otherSources",
	"reprintedAs",

	ObjectKey.getCopyKey({fnGetModOrder: () => PROPORDER_SPELL__COPY_MOD}),

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

	new ObjectKey("classes", {
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

	new ArrayKey("miscTags", {fnSort: SortUtil.ascSortLower}),
	new ArrayKey("areaTags", {fnSort: SortUtil.ascSortLower}),

	"hasFluff",
	"hasFluffImages",

	"fluff",

	...PROPS_FOUNDRY_DATA_INLINE,

	new ObjectKey("roll20Spell", {
		order: PROPORDER_ROLL20_SPELL,
	}),
];
const PROPORDER_SPELL__COPY_MOD = [
	"*",
	"_",
	...PROPORDER_SPELL,
];
const PROPORDER_SPELL_LIST = [
	"name",

	"source",

	"spellListType",

	"className",
	"classSource",

	"spells",
];
const PROPORDER_ACTION = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"basicRules2024",
	"otherSources",
	"reprintedAs",

	"fromVariant",

	"time",

	"entries",

	"seeAlsoAction",
];
const PROPORDER_ADVENTURE = [
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
const PROPORDER_ADVENTURE_DATA = [
	"name",

	"id",
	"source",

	"data",
];
const PROPORDER_BOOK = [
	"name",
	"alias",

	"id",
	"source",
	"parentSource",

	"group",

	"cover",
	"coverUrl",
	"published",
	"author",

	"contents",
];
const PROPORDER_BOOK_DATA = [
	"name",

	"id",
	"source",

	"data",
];
const PROPORDER_BACKGROUND = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"basicRules2024",
	"additionalSources",
	"otherSources",
	"reprintedAs",

	"edition",

	ObjectKey.getCopyKey({fnGetModOrder: () => PROPORDER_BACKGROUND__COPY_MOD}),

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
const PROPORDER_BACKGROUND__COPY_MOD = [
	"*",
	"_",
	...PROPORDER_BACKGROUND,
];
const PROPORDER_LEGENDARY_GROUP = [
	"name",
	"alias",

	"source",
	"page",

	"additionalSources",

	ObjectKey.getCopyKey({fnGetModOrder: () => PROPORDER_LEGENDARY_GROUP__COPY_MOD}),

	"lairActions",
	"regionalEffects",
	"mythicEncounter",
];
const PROPORDER_LEGENDARY_GROUP__COPY_MOD = [
	"*",
	"_",
	...PROPORDER_LEGENDARY_GROUP,
];
const PROPORDER_CLASS = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"basicRules2024",
	"otherSources",
	"isReprinted",
	"reprintedAs",

	"edition",

	"isSidekick",
	"classGroup",

	ObjectKey.getCopyKey({fnGetModOrder: () => PROPORDER_CLASS__COPY_MOD}),

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
	new ObjectKey("startingEquipment", {
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
const PROPORDER_CLASS__COPY_MOD = [
	"*",
	"_",
	...PROPORDER_CLASS,
];
const PROPORDER_FOUNDRY_CLASS = [
	"name",

	"source",

	"system",
	PROPORDER_FOUNDRY_ACTIVITIES,
	PROPORDER_FOUNDRY_EFFECTS,
	"flags",
	"img",
	"advice",

	"advancement",
	"chooseSystem",
	"isChooseSystemRenderEntries",
	"isChooseFlagsRenderEntries",
	"isIgnored",
	"ignoreSrdActivities",
	"ignoreSrdEffects",
	"actorTokenMod",

	"migrationVersion",
];
const PROPORDER_SUBCLASS = [
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
	"basicRules2024",
	"otherSources",
	"isReprinted",
	"reprintedAs",

	"edition",

	new ObjectKey("_copy", {
		order: [
			"name",
			"source",
			"shortName",
			"source",
			"className",
			"classSource",
			new ObjectKey("_mod", {
				fnGetOrder: () => PROPORDER_SUBCLASS__COPY_MOD,
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
const PROPORDER_SUBCLASS__COPY_MOD = [
	"*",
	"_",
	...PROPORDER_SUBCLASS,
];
const PROPORDER_SUBCLASS_FLUFF = [
	"name",
	"shortName",
	"source",
	"className",
	"classSource",

	"_copy",

	"entries",
	"images",
];
const PROPORDER_FOUNDRY_SUBCLASS = [
	"name",
	"shortName",
	"source",
	"className",
	"classSource",

	"identifier",
	"system",
	PROPORDER_FOUNDRY_ACTIVITIES,
	PROPORDER_FOUNDRY_EFFECTS,
	"flags",
	"img",
	"advice",

	"advancement",
	"chooseSystem",
	"isChooseSystemRenderEntries",
	"isChooseFlagsRenderEntries",
	"isIgnored",
	"ignoreSrdActivities",
	"ignoreSrdEffects",
	"actorTokenMod",

	"migrationVersion",
];
const PROPORDER_CLASS_FEATURE = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"basicRules2024",
	"otherSources",

	"className",
	"classSource",
	"level",

	new ObjectKey("_copy", {
		order: [
			"name",
			"source",
			"className",
			"classSource",
			"level",
			new ObjectKey("_mod", {
				fnGetOrder: () => PROPORDER_CLASS_FEATURE__COPY_MOD,
			}),
			"_preserve",
		],
	}),

	"isClassFeatureVariant",

	...PROPORDER_ENTRY_DATA_OBJECT,

	"header",
	"type",

	"consumes",

	"entries",

	...PROPS_FOUNDRY_DATA_INLINE,
];
const PROPORDER_CLASS_FEATURE__COPY_MOD = [
	"*",
	"_",
	...PROPORDER_CLASS_FEATURE,
];
const PROPORDER_SUBCLASS_FEATURE = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"basicRules2024",
	"otherSources",

	"className",
	"classSource",
	"subclassShortName",
	"subclassSource",
	"level",

	new ObjectKey("_copy", {
		order: [
			"name",
			"source",
			"className",
			"classSource",
			"subclassShortName",
			"subclassSource",
			"level",
			new ObjectKey("_mod", {
				fnGetOrder: () => PROPORDER_SUBCLASS_FEATURE__COPY_MOD,
			}),
			"_preserve",
		],
	}),

	"isClassFeatureVariant",

	"isGainAtNextFeatureLevel",

	...PROPORDER_ENTRY_DATA_OBJECT,

	"header",
	"type",

	"consumes",

	"entries",

	...PROPS_FOUNDRY_DATA_INLINE,
];
const PROPORDER_SUBCLASS_FEATURE__COPY_MOD = [
	"*",
	"_",
	...PROPORDER_SUBCLASS_FEATURE,
];
const PROPORDER_FOUNDRY_CLASS_FEATURE = [
	"name",
	"source",

	"className",
	"classSource",
	"level",

	"system",
	PROPORDER_FOUNDRY_ACTIVITIES,
	PROPORDER_FOUNDRY_EFFECTS,
	"flags",
	"img",
	"advice",

	"entries",

	new ObjectKey("entryData", {
		fnGetOrder: () => PROPORDER_ENTRY_DATA_OBJECT,
	}),

	"advancement",
	"chooseSystem",
	"isChooseSystemRenderEntries",
	"isChooseFlagsRenderEntries",
	"isIgnored",
	"ignoreSrdActivities",
	"ignoreSrdEffects",
	"actorTokenMod",

	new ObjectKey("subEntities", {
		fnGetOrder: () => PROPORDER_ROOT,
	}),

	"migrationVersion",
];
const PROPORDER_FOUNDRY_SUBCLASS_FEATURE = [
	"name",
	"source",

	"className",
	"classSource",
	"subclassShortName",
	"subclassSource",
	"level",

	"system",
	PROPORDER_FOUNDRY_ACTIVITIES,
	PROPORDER_FOUNDRY_EFFECTS,
	"flags",
	"img",
	"advice",

	"entries",

	new ObjectKey("entryData", {
		fnGetOrder: () => PROPORDER_ENTRY_DATA_OBJECT,
	}),

	"advancement",
	"chooseSystem",
	"isChooseSystemRenderEntries",
	"isChooseFlagsRenderEntries",
	"isIgnored",
	"ignoreSrdActivities",
	"ignoreSrdEffects",
	"actorTokenMod",

	new ObjectKey("subEntities", {
		fnGetOrder: () => PROPORDER_ROOT,
	}),

	"migrationVersion",
];
const PROPORDER_LANGUAGE = [
	"name",
	"alias",

	"dialects",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"basicRules2024",
	"additionalSources",
	"otherSources",
	"reprintedAs",

	"type",
	"typicalSpeakers",
	"origin",
	"script",

	"fonts",

	"entries",

	"hasFluff",
	"hasFluffImages",

	"fluff",
];
const PROPORDER_LANGUAGE_SCRIPT = [
	"name",

	"source",

	"fonts",
];
const PROPORDER_NAME = [
	"name",

	"source",
	"page",
	"legacy",

	"tables",
];
const PROPORDER_CONDITION = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"basicRules2024",
	"otherSources",
	"reprintedAs",

	"color",

	"entries",

	"hasFluff",
	"hasFluffImages",

	"fluff",

	...PROPS_FOUNDRY_DATA_INLINE,
];
const PROPORDER_DISEASE = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"basicRules2024",
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
const PROPORDER_STATUS = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"basicRules2024",
	"otherSources",
	"reprintedAs",

	"color",

	"entries",

	"hasFluff",
	"hasFluffImages",

	"fluff",
];
const PROPORDER_CULT = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"basicRules2024",
	"additionalSources",
	"otherSources",
	"reprintedAs",

	"type",

	"goal",
	"cultists",
	"signatureSpells",

	"entries",
];
const PROPORDER_BOON = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"basicRules2024",
	"additionalSources",
	"otherSources",
	"reprintedAs",

	"type",

	"ability",

	"goal",
	"cultists",
	"signatureSpells",

	"entries",
];
const PROPORDER_DEITY = [
	"name",
	"alias",
	"reprintAlias",
	"altNames",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"basicRules2024",
	"additionalSources",
	"otherSources",

	new ObjectKey("_copy", {
		order: [
			"name",
			"source",
			"pantheon",
			new ObjectKey("_mod", {
				fnGetOrder: () => PROPORDER_DEITY__COPY_MOD,
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

	new ObjectKey("customProperties", {
		fnGetOrder: obj => Object.keys(obj).sort(SortUtil.ascSortLower),
	}),

	"entries",

	...PROPS_FOUNDRY_DATA_INLINE,
];
const PROPORDER_DEITY__COPY_MOD = [
	"*",
	"_",
	...PROPORDER_DEITY,
];
const PROPORDER_FEAT = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"basicRules2024",
	"additionalSources",
	"otherSources",
	"reprintedAs",

	ObjectKey.getCopyKey({fnGetModOrder: () => PROPORDER_FEAT__COPY_MOD}),

	"category",
	"prerequisite",

	"repeatable",
	"repeatableNote",
	"repeatableHidden",

	"ability",

	new ArrayKey("traitTags", {fnSort: SortUtil.ascSortLower}),
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

	new ArrayKey("_versions", {
		fnGetOrder: () => [
			"name",
			"source",
			new ObjectKey("_mod", {
				fnGetOrder: () => PROPORDER_FEAT__COPY_MOD,
			}),
			"_preserve",
			"_abstract",
			"_implementations",
			...PROPORDER_FEAT,
		],
		fnSort: getFnRootPropListSort("feat"),
	}),
];
const PROPORDER_FEAT__COPY_MOD = [
	"*",
	"_",
	...PROPORDER_FEAT,
];
const PROPORDER_VEHICLE = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"basicRules2024",
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
	"station",
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
	"tokenCustom",

	"hasToken",
	"hasFluff",
	"hasFluffImages",

	"fluff",

	...PROPS_FOUNDRY_DATA_INLINE,
];
const PROPORDER_VEHICLE_UPGRADE = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"basicRules2024",
	"otherSources",

	"upgradeType",

	"entries",
];
const PROPORDER_RACE_FLUFF = [
	"name",
	"source",

	"uncommon",
	"monstrous",

	"_copy",

	"entries",
	"images",
];
const PROPORDER_ITEM = [
	"name",
	"alias",
	"group",
	"namePrefix",
	"nameSuffix",
	"nameRemove",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"basicRules2024",
	"additionalSources",
	"otherSources",
	"reprintedAs",

	ObjectKey.getCopyKey({fnGetModOrder: () => PROPORDER_ITEM__COPY_MOD}),

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

	"classFeatures",
	"optionalfeatures",
	new ObjectOrArrayKey({
		objectKey: new ObjectKey("attachedSpells", {
			fnGetOrder: () => [
				...[
					"will",
				].map(k => new ArrayKey(k, {fnSort: SortUtil.ascSortLower})),

				ObjectKey.getAttachedSpellFrequencyKey("charges"),

				ObjectKey.getAttachedSpellFrequencyKey("resource"),
				"resourceName",

				ObjectKey.getAttachedSpellFrequencyKey("rest"),
				ObjectKey.getAttachedSpellFrequencyKey("daily"),
				ObjectKey.getAttachedSpellFrequencyKey("limited"),

				...[
					"ritual",
					"other",
				].map(k => new ArrayKey(k, {fnSort: SortUtil.ascSortLower})),

				"ability",
			],
		}),
		arrayKey: new ArrayKey("attachedSpells", {fnSort: SortUtil.ascSortLower}),
	}),
	"spellScrollLevel",
	"lootTables",

	"seeAlsoDeck",
	"seeAlsoVehicle",

	new ObjectKey("customProperties", {
		fnGetOrder: obj => Object.keys(obj).sort(SortUtil.ascSortLower),
	}),

	new ArrayKey("miscTags", {fnSort: SortUtil.ascSortLower}),

	"hasFluff",
	"hasFluffImages",

	"fluff",

	...PROPS_FOUNDRY_DATA_INLINE,
];
const PROPORDER_ITEM__COPY_MOD = [
	"*",
	"_",
	...PROPORDER_ITEM,
];
const PROPORDER_MAGICVARIANT = [
	"name",
	"alias",
	"group",
	"source",

	ObjectKey.getCopyKey({fnGetModOrder: () => PROPORDER_MAGICVARIANT__COPY_MOD}),

	"edition",

	"type",

	"requires",
	"excludes",

	"rarity",

	"ammo",

	"entries",

	new ObjectKey("inherits", {
		order: PROPORDER_ITEM,
	}),

	"hasFluff",
	"hasFluffImages",

	"fluff",
];
const PROPORDER_MAGICVARIANT__COPY_MOD = [
	"*",
	"_",
	...PROPORDER_MAGICVARIANT,
];
const PROPORDER_ITEM_MASTERY = [
	"name",
	"source",

	"page",
	"srd",
	"srd52",
	"basicRules",
	"basicRules2024",

	"prerequisite",

	"entries",
];
const PROPORDER_ITEM_PROPERTY = [
	"name",
	"abbreviation",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"basicRules2024",
	"reprintedAs",

	ObjectKey.getCopyKey({
		identKeys: [
			"abbreviation",
			"source",
		],
		fnGetModOrder: () => PROPORDER_ITEM_PROPERTY__COPY_MOD,
	}),

	"template",

	"entries",
	"entriesTemplate",
];
const PROPORDER_ITEM_PROPERTY__COPY_MOD = [
	"*",
	"_",
	...PROPORDER_ITEM_PROPERTY,
];
const PROPORDER_REDUCED_ITEM_PROPERTY = [
	...PROPORDER_ITEM_PROPERTY,
];
const PROPORDER_ITEM_TYPE = [
	"name",
	"abbreviation",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"basicRules2024",
	"reprintedAs",

	ObjectKey.getCopyKey({
		identKeys: [
			"abbreviation",
			"source",
		],
		fnGetModOrder: () => PROPORDER_ITEM_PROPERTY__COPY_MOD,
	}),

	"template",

	"entries",
	"entriesTemplate",
];
const PROPORDER_ITEM_TYPE__COPY_MOD = [
	"*",
	"_",
	...PROPORDER_ITEM_TYPE,
];
const PROPORDER_REDUCED_ITEM_TYPE = [
	...PROPORDER_ITEM_TYPE,
];
const PROPORDER_ITEM_TYPE_ADDITIONAL_ENTRIES = [
	"name",

	"source",
	"page",

	"appliesTo",

	"entries",
];
const PROPORDER_ITEM_ENTRY = [
	"name",

	"source",

	"entriesTemplate",
];
const PROPORDER_OBJECT = [
	"name",
	"alias",

	"isNpc",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"basicRules2024",
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
	"tokenCustom",

	"altArt",

	"hasToken",
	"hasFluff",
	"hasFluffImages",

	"fluff",

	...PROPS_FOUNDRY_DATA_INLINE,
];
const PROPORDER_OPTIONALFEATURE = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"basicRules2024",
	"otherSources",
	"reprintedAs",

	ObjectKey.getCopyKey({fnGetModOrder: () => PROPORDER_OPTIONALFEATURE__COPY_MOD}),

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
const PROPORDER_OPTIONALFEATURE__COPY_MOD = [
	"*",
	"_",
	...PROPORDER_OPTIONALFEATURE,
];
const PROPORDER_PSIONIC = [
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
const PROPORDER_REWARD = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"basicRules2024",
	"otherSources",
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
const PROPORDER_VARIANTRULE = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"basicRules2024",
	"additionalSources",
	"otherSources",
	"reprintedAs",

	"ruleType",

	"type",
	"entries",

	...PROPS_FOUNDRY_DATA_INLINE,
];
const PROPORDER_RACE_SUBRACE = [
	"page",
	"srd",
	"srd52",
	"basicRules",
	"basicRules2024",
	"additionalSources",
	"otherSources",
	"reprintedAs",

	"edition",

	ObjectKey.getCopyKey({
		identKeys: [
			"name",
			"source",
			"raceName",
			"raceSource",
		],
		fnGetModOrder: () => PROPORDER_RACE__COPY_MOD,
	}),

	"lineage",
	"creatureTypes",
	"creatureTypeTags",

	new ArrayKey("size", {fnSort: SortUtil.ascSortSize}),
	"speed",
	"ability",

	"heightAndWeight",
	"age",

	"darkvision",
	"blindsight",
	"feats",

	new ArrayKey("traitTags", {fnSort: SortUtil.ascSortLower}),
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

	new ArrayKey("_versions", {
		fnGetOrder: () => [
			"name",
			"source",
			"raceName",
			"raceSource",
			new ObjectKey("_mod", {
				fnGetOrder: () => PROPORDER_RACE__COPY_MOD,
			}),
			"_preserve",
			"_abstract",
			"_implementations",
			...PROPORDER_RACE,
		],
		fnSort: getFnRootPropListSort("subrace"),
	}),
];
const PROPORDER_RACE = [
	"name",
	"alias",

	"source",

	...PROPORDER_RACE_SUBRACE,
];
const PROPORDER_RACE__COPY_MOD = [
	"*",
	"_",
	...PROPORDER_RACE,
];
const PROPORDER_SUBRACE = [
	"name",
	"alias",

	"source",

	"raceName",
	"raceSource",

	...PROPORDER_RACE_SUBRACE,
];
const PROPORDER_FOUNDRY_RACE_FEATURE = [
	"name",

	"source",

	"raceName",
	"raceSource",

	ObjectKey.getCopyKey({
		identKeys: [
			"name",
			"source",
			"raceName",
			"raceSource",
		],
		fnGetModOrder: () => PROPORDER_FOUNDRY_RACE_FEATURE__COPY_MOD,
	}),

	"system",
	PROPORDER_FOUNDRY_ACTIVITIES,
	PROPORDER_FOUNDRY_EFFECTS,
	"flags",
	"img",
	"advice",

	"migrationVersion",
];
const PROPORDER_FOUNDRY_RACE_FEATURE__COPY_MOD = [
	"*",
	"_",
	...PROPORDER_FOUNDRY_RACE_FEATURE,
];
const PROPORDER_TABLE = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"basicRules2024",
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
	new ArrayKey("tables", {
		fnGetOrder: () => PROPORDER_TABLE,
	}),
	"outro",
	"footnotes",

	"isNameGenerator",
	"isStriped",

	"parentEntity",
];
const PROPORDER_TRAP = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"basicRules2024",
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
const PROPORDER_HAZARD = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"basicRules2024",
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
const PROPORDER_RECIPE = [
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

	new ArrayKey("miscTags", {fnSort: SortUtil.ascSortLower}),

	"fluff",

	"hasFluff",
	"hasFluffImages",

	"fluff",
];
const PROPORDER_CHAROPTION = [
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
const PROPORDER_SKILL = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"basicRules2024",
	"otherSources",
	"reprintedAs",

	"ability",

	"entries",
];
const PROPORDER_SENSE = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"basicRules2024",
	"otherSources",
	"reprintedAs",

	"entries",
];
const PROPORDER_DECK = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"basicRules2024",
	"otherSources",

	ObjectKey.getCopyKey({fnGetModOrder: () => PROPORDER_DECK__COPY_MOD}),

	"cards",
	"back",

	"entries",

	"hasCardArt",
];

const PROPORDER_DECK__COPY_MOD = [
	"*",
	"_",
	...PROPORDER_DECK,
];
const PROPORDER_CARD = [
	"name",
	"alias",

	"source",
	"set",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"basicRules2024",
	"otherSources",

	"suit",
	"value",
	"valueName",

	"face",
	"back",

	"entries",
];

const PROPORDER_ENCOUNTER = [
	"name",

	"source",
	"page",

	new ArrayKey("tables", {
		order: [
			"caption",

			"captionPrefix",
			"captionSuffix",

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

const PROPORDER_CITATION = [
	"name",

	"source",
	"page",

	"entries",
];

const PROPORDER_FOUNDRY_MAP = [
	"name",

	"source",

	"lights",
	"walls",

	"migrationVersion",
];

const PROPORDER_FACILITY = [
	"name",
	"alias",

	"source",
	"page",
	"srd",
	"srd52",
	"basicRules",
	"basicRules2024",
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

const PROPORDER_CONVERTER_SAMPLE = [
	"converterId",
	"format",
	"edition",
	"text",
];

const PROPORDER_ENCOUNTER_SHAPE = [
	"name",
	"alias",

	"source",
	"page",
	"otherSources",
	"reprintedAs",

	"shapeTemplate",
];

export const PROPORDER_PROP_TO_LIST = {
	"_meta": PROPORDER_META,
	"_test": PROPORDER_TEST,
	"monster": PROPORDER_MONSTER,
	"foundryMonster": PROPORDER_FOUNDRY_MONSTER,
	"monsterFluff": PROPORDER_GENERIC_FLUFF,
	"monsterTemplate": PROPORDER_MONSTER_TEMPLATE,
	"makebrewCreatureTrait": PROPORDER_MAKE_BREW_CREATURE_TRAIT,
	"makebrewCreatureAction": PROPORDER_MAKE_BREW_CREATURE_ACTION,
	"backgroundFluff": PROPORDER_GENERIC_FLUFF,
	"featFluff": PROPORDER_GENERIC_FLUFF,
	"optionalfeatureFluff": PROPORDER_GENERIC_FLUFF,
	"conditionFluff": PROPORDER_GENERIC_FLUFF,
	"diseaseFluff": PROPORDER_GENERIC_FLUFF,
	"statusFluff": PROPORDER_GENERIC_FLUFF,
	"itemFluff": PROPORDER_GENERIC_FLUFF,
	"languageFluff": PROPORDER_GENERIC_FLUFF,
	"vehicleFluff": PROPORDER_GENERIC_FLUFF,
	"objectFluff": PROPORDER_GENERIC_FLUFF,
	"raceFluff": PROPORDER_RACE_FLUFF,
	"rewardFluff": PROPORDER_GENERIC_FLUFF,
	"trapFluff": PROPORDER_GENERIC_FLUFF,
	"hazardFluff": PROPORDER_GENERIC_FLUFF,
	"spell": PROPORDER_SPELL,
	"roll20Spell": PROPORDER_ROLL20_SPELL,
	"foundrySpell": PROPORDER_FOUNDRY_GENERIC,
	"spellList": PROPORDER_SPELL_LIST,
	"action": PROPORDER_ACTION,
	"foundryAction": PROPORDER_FOUNDRY_GENERIC,
	"adventure": PROPORDER_ADVENTURE,
	"adventureData": PROPORDER_ADVENTURE_DATA,
	"book": PROPORDER_BOOK,
	"bookData": PROPORDER_BOOK_DATA,
	"background": PROPORDER_BACKGROUND,
	"legendaryGroup": PROPORDER_LEGENDARY_GROUP,
	"class": PROPORDER_CLASS,
	"classFluff": PROPORDER_GENERIC_FLUFF,
	"foundryClass": PROPORDER_FOUNDRY_CLASS,
	"subclass": PROPORDER_SUBCLASS,
	"subclassFluff": PROPORDER_SUBCLASS_FLUFF,
	"foundrySubclass": PROPORDER_FOUNDRY_SUBCLASS,
	"classFeature": PROPORDER_CLASS_FEATURE,
	"subclassFeature": PROPORDER_SUBCLASS_FEATURE,
	"foundryClassFeature": PROPORDER_FOUNDRY_CLASS_FEATURE,
	"foundrySubclassFeature": PROPORDER_FOUNDRY_SUBCLASS_FEATURE,
	"language": PROPORDER_LANGUAGE,
	"languageScript": PROPORDER_LANGUAGE_SCRIPT,
	"name": PROPORDER_NAME,
	"condition": PROPORDER_CONDITION,
	"disease": PROPORDER_DISEASE,
	"status": PROPORDER_STATUS,
	"cult": PROPORDER_CULT,
	"boon": PROPORDER_BOON,
	"deity": PROPORDER_DEITY,
	"feat": PROPORDER_FEAT,
	"foundryFeat": PROPORDER_FOUNDRY_GENERIC_FEATURE,
	"vehicle": PROPORDER_VEHICLE,
	"vehicleUpgrade": PROPORDER_VEHICLE_UPGRADE,
	"foundryVehicleUpgrade": PROPORDER_FOUNDRY_GENERIC_FEATURE,
	"item": PROPORDER_ITEM,
	"foundryItem": PROPORDER_FOUNDRY_GENERIC,
	"baseitem": PROPORDER_ITEM,
	"magicvariant": PROPORDER_MAGICVARIANT,
	"foundryMagicvariant": PROPORDER_FOUNDRY_GENERIC,
	"itemGroup": PROPORDER_ITEM,
	"itemMastery": PROPORDER_ITEM_MASTERY,
	"itemProperty": PROPORDER_ITEM_PROPERTY,
	"reducedItemProperty": PROPORDER_REDUCED_ITEM_PROPERTY,
	"itemType": PROPORDER_ITEM_TYPE,
	"itemTypeAdditionalEntries": PROPORDER_ITEM_TYPE_ADDITIONAL_ENTRIES,
	"reducedItemType": PROPORDER_REDUCED_ITEM_TYPE,
	"itemEntry": PROPORDER_ITEM_ENTRY,
	"object": PROPORDER_OBJECT,
	"optionalfeature": PROPORDER_OPTIONALFEATURE,
	"foundryOptionalfeature": PROPORDER_FOUNDRY_GENERIC_FEATURE,
	"psionic": PROPORDER_PSIONIC,
	"foundryPsionic": PROPORDER_FOUNDRY_GENERIC_FEATURE,
	"reward": PROPORDER_REWARD,
	"foundryReward": PROPORDER_FOUNDRY_GENERIC_FEATURE,
	"variantrule": PROPORDER_VARIANTRULE,
	"spellFluff": PROPORDER_GENERIC_FLUFF,
	"race": PROPORDER_RACE,
	"foundryRace": PROPORDER_FOUNDRY_GENERIC_FEATURE,
	"subrace": PROPORDER_SUBRACE,
	"foundryRaceFeature": PROPORDER_FOUNDRY_RACE_FEATURE,
	"table": PROPORDER_TABLE,
	"trap": PROPORDER_TRAP,
	"hazard": PROPORDER_HAZARD,
	"recipe": PROPORDER_RECIPE,
	"recipeFluff": PROPORDER_GENERIC_FLUFF,
	"charoption": PROPORDER_CHAROPTION,
	"charoptionFluff": PROPORDER_GENERIC_FLUFF,
	"skill": PROPORDER_SKILL,
	"sense": PROPORDER_SENSE,
	"deck": PROPORDER_DECK,
	"card": PROPORDER_CARD,
	"encounter": PROPORDER_ENCOUNTER,
	"citation": PROPORDER_CITATION,
	"foundryMap": PROPORDER_FOUNDRY_MAP,
	"facility": PROPORDER_FACILITY,
	"facilityFluff": PROPORDER_GENERIC_FLUFF,
	"converterSample": PROPORDER_CONVERTER_SAMPLE,
	"encounterShape": PROPORDER_ENCOUNTER_SHAPE,
};

export const PROPORDER_ROOT = [
	"$schema",

	new ObjectKey("_meta", {
		fnGetOrder: () => PROPORDER_META,
	}),
	new ObjectKey("_test", {
		fnGetOrder: () => PROPORDER_TEST,
	}),

	// region Player options
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "class"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "foundryClass"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "classFluff"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "subclass"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "foundrySubclass"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "subclassFluff"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "classFeature"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "foundryClassFeature"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "subclassFeature"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "foundrySubclassFeature"),

	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "optionalfeature"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "optionalfeatureFluff"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "foundryOptionalfeature"),

	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "background"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "backgroundFeature"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "backgroundFluff"),

	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "race"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "subrace"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "foundryRace"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "foundryRaceFeature"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "raceFluff"),
	new IgnoredKey("raceFluffMeta"),

	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "feat"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "foundryFeat"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "featFluff"),

	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "reward"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "foundryReward"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "rewardFluff"),

	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "charoption"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "charoptionFluff"),
	// endregion

	// region General entities
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "spell"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "spellFluff"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "foundrySpell"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "spellList"),

	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "baseitem"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "item"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "itemGroup"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "magicvariant"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "itemFluff"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "foundryItem"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "foundryMagicvariant"),

	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "itemProperty"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "reducedItemProperty"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "itemType"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "reducedItemType"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "itemTypeAdditionalEntries"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "itemEntry"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "itemMastery"),
	new IgnoredKey("linkedLootTables"),

	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "deck"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "card"),

	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "deity"),

	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "facility"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "facilityFluff"),

	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "language"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "languageScript"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "languageFluff"),
	// endregion

	// region GM-specific
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "monster"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "monsterFluff"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "foundryMonster"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "legendaryGroup"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "monsterTemplate"),

	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "object"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "objectFluff"),

	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "vehicle"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "vehicleUpgrade"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "foundryVehicleUpgrade"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "vehicleFluff"),

	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "cult"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "boon"),

	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "trap"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "trapFluff"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "hazard"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "hazardFluff"),

	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "encounter"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "name"),
	// endregion

	// region Rules
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "variantrule"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "table"),

	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "condition"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "conditionFluff"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "disease"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "diseaseFluff"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "status"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "statusFluff"),

	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "action"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "foundryAction"),

	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "skill"),

	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "sense"),

	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "citation"),

	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "adventure"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "adventureData"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "book"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "bookData"),
	// endregion

	// region Other
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "recipe"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "recipeFluff"),
	// endregion

	// region Legacy content
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "psionic"),
	new IgnoredKey("psionicDisciplineFocus"),
	new IgnoredKey("psionicDisciplineActive"),
	// endregion

	// region Tooling
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "makebrewCreatureTrait"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "makebrewCreatureAction"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "encounterShape"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "converterSample"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "monsterfeatures"),
	// endregion

	// region Roll20-specific
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "roll20Spell"),
	// endregion

	// region Non-brew data
	new IgnoredKey("blocklist"),
	// endregion

	// region Misc ignored keys
	new IgnoredKey("data"),
	// endregion
];
