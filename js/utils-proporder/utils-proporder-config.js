import {ArrayKey, IgnoredKey, ObjectKey, ObjectOrArrayKey} from "./utils-proporder-models.js";
import {PROPORDER_FOUNDRY_ACTIVITIES, PROPORDER_FOUNDRY_DATA_INLINE, PROPORDER_FOUNDRY_EFFECTS} from "./utils-proporder-config-foundry.js";
import {getFnRootPropListSort} from "./utils-proporder-sort.js";
import {getGenericMetadataPropOrder, PROPORDER_ENTRY_DATA_OBJECT} from "./utils-proporder-config-shared.js";
import {EntryPropOrder} from "./utils-proporder-config-entries.js";
import {getAbilityArrayKey, getClassRequirementsObjectKey, getClassTableGroupsArrayKey, getExternalSourcesArrayKey, getSkillSaveObjectKey, getVehiclePartArrayKey} from "./utils-proporder-config-util.js";

const getFluffObjectKey = () => (
	new ObjectKey(
		"fluff",
		{
			order: [
				EntryPropOrder.getArrayKey("entries"),
				EntryPropOrder.getArrayKey("images"),

				...[
					"monsterFluff",
					"raceFluff",
					"itemFluff",
					"subclassFluff",
				]
					.map(prop => [
						`_${prop}`,
						`_append${prop.uppercaseFirst()}`,
					])
					.flat(),
			],
		},
	)
);

const getFoundryGeneric = ({propsMatchAdditional = [], isFeature = false} = {}) => {
	const proporder = [
		...getGenericMetadataPropOrder({propsPostSourceAdditional: propsMatchAdditional}),

		ObjectKey.getCopyKey({
			identKeys: [
				"name",
				"source",
				...propsMatchAdditional,
			],
			fnGetModOrder: () => proporderCopy,
		}),

		"type",
		"identifier",
		"system",
		PROPORDER_FOUNDRY_ACTIVITIES,
		PROPORDER_FOUNDRY_EFFECTS,
		"flags",
		"img",

		EntryPropOrder.getObjectKey("advice"),
		...(
			isFeature
				? [
					EntryPropOrder.getArrayKey("entries"),

					new ObjectKey("entryData", {
						fnGetOrder: () => PROPORDER_ENTRY_DATA_OBJECT,
					}),

					"advancement",

					"isIgnored",
					"ignoreSrdActivities",
					"ignoreSrdEffects",
				]
				: []
		),

		new ObjectKey("subEntities", {
			fnGetOrder: () => PROPORDER_ROOT,
		}),

		...(isFeature ? ["isIgnored"] : []),
		"ignoreSrdActivities",
		"ignoreSrdEffects",

		"_merge",

		"migrationVersion",
	];

	const proporderCopy = [
		"*",
		"_",
		...proporder,
	];

	return proporder;
};

const PROPORDER_META = [
	new ArrayKey("sources", {
		fnGetOrder: () => [
			"json",
			"abbreviation",
			"full",

			"url",
			"version",
			"dateReleased",

			new ArrayKey("authors", {fnSort: SortUtil.ascSortLower}),
			new ArrayKey("convertedBy", {fnSort: SortUtil.ascSortLower}),

			"partnered",

			"color",
			"colorNight",

			"targetSchema",
		],
	}),

	"dependencies",
	"includes",
	"internalCopies",

	"otherSources",
	new ArrayKey("referenceSources", {fnSort: SortUtil.ascSortLower}),

	"spellSchools",
	"spellDistanceUnits",
	"featCategories",
	"optionalFeatureTypes",
	"vehicleUpgradeTypes",
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
	"references",

	"additionalImageSources",
];
const PROPORDER_FOUNDRY_GENERIC = getFoundryGeneric();
const PROPORDER_FOUNDRY_GENERIC_FEATURE = getFoundryGeneric({isFeature: true});
const PROPORDER_MONSTER = [
	...getGenericMetadataPropOrder({
		propsPostNameAdditional: [
			"shortName",
			"alias",
			"group",

			"isNpc",
			"isNamedCreature",
		],
		propsPostSourceAdditional: ["sourceSub"],
	}),

	"summonedBySpell",
	"summonedBySpellLevel",
	"summonedByClass",
	"summonedScaleByPlayerLevel",

	"_isCopy",
	ObjectKey.getCopyKey({fnGetModOrder: () => PROPORDER_MONSTER__COPY_MOD}),

	// region `vehicle` use
	"vehicleType",
	// endregion

	"level",
	"size",
	"sizeNote",
	"type",
	"alignment",
	"alignmentPrefix",

	// region `vehicle` use
	"terrain",
	// endregion

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

	getSkillSaveObjectKey("save"),
	getSkillSaveObjectKey("skill"),
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

			EntryPropOrder.getArrayKey("headerEntries"),

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

			EntryPropOrder.getArrayKey("footerEntries"),

			"chargesItem",

			"ability",
			"displayAs",
			"hidden",
		],
	}),
	EntryPropOrder.getArrayKey("trait"),
	"actionNote",
	EntryPropOrder.getArrayKey("actionHeader"),
	EntryPropOrder.getArrayKey("action"),
	"bonusNote",
	EntryPropOrder.getArrayKey("bonusHeader"),
	EntryPropOrder.getArrayKey("bonus"),
	"reactionNote",
	EntryPropOrder.getArrayKey("reactionHeader"),
	EntryPropOrder.getArrayKey("reaction"),
	EntryPropOrder.getArrayKey("legendaryHeader"),
	"legendaryActions",
	"legendaryActionsLair",
	EntryPropOrder.getArrayKey("legendary"),
	EntryPropOrder.getArrayKey("mythicHeader"),
	EntryPropOrder.getArrayKey("mythic"),
	"legendaryGroup",
	EntryPropOrder.getArrayKey("variant"),
	EntryPropOrder.getArrayKey("footer"),

	getExternalSourcesArrayKey(),

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
	"tokenHref3d",
	"soundClip",

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

	getFluffObjectKey(),

	...PROPORDER_FOUNDRY_DATA_INLINE,

	new ArrayKey("_versions", {
		fnGetOrder: () => [
			"name",
			"source",
			"_templates",
			ObjectKey.getCopyModKey({fnGetModOrder: () => PROPORDER_MONSTER__COPY_MOD}),
			"_preserve",
			"_abstract",
			"_implementations",
			...PROPORDER_MONSTER,
		],
		fnSort: getFnRootPropListSort("monster", {isRequired: true}),
	}),
];
const PROPORDER_MONSTER__COPY_MOD = [
	"*",
	"_",
	...PROPORDER_MONSTER,
];
const PROPORDER_MONSTER_TEMPLATE = [
	...getGenericMetadataPropOrder(),

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
			ObjectKey.getCopyModKey({fnGetModOrder: () => PROPORDER_MONSTER__COPY_MOD}),
		],
	}),
];
const PROPORDER_MONSTER_TEMPLATE__COPY_MOD = [
	"*",
	"_",
	...PROPORDER_MONSTER_TEMPLATE,
];
const PROPORDER_MAKE_BREW_CREATURE_TRAIT = [
	...getGenericMetadataPropOrder(),

	EntryPropOrder.getArrayKey("entries"),
];
const PROPORDER_MAKE_BREW_CREATURE_ACTION = [
	...getGenericMetadataPropOrder(),

	EntryPropOrder.getArrayKey("entries"),
];
const PROPORDER_FOUNDRY_MONSTER = [
	...getGenericMetadataPropOrder(),

	"system",
	"prototypeToken",
	PROPORDER_FOUNDRY_ACTIVITIES,
	PROPORDER_FOUNDRY_EFFECTS,
	"flags",
	"img",

	EntryPropOrder.getObjectKey("advice"),

	"migrationVersion",
];
const PROPORDER_FOUNDRY_MONSTER_SUB_ENTITY = getFoundryGeneric({propsMatchAdditional: ["monsterName", "monsterSource"]});
const PROPORDER_GENERIC_FLUFF = [
	...getGenericMetadataPropOrder({propsPostNameAdditional: ["alias", "preserveName"]}),

	"_copy",

	EntryPropOrder.getArrayKey("entries"),
	EntryPropOrder.getArrayKey("images"),
];
const PROPORDER_ROLL20_SPELL = [
	...getGenericMetadataPropOrder(),

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
	...getGenericMetadataPropOrder(),

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

	EntryPropOrder.getArrayKey("entries"),
	EntryPropOrder.getArrayKey("entriesHigherLevel"),

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

	getFluffObjectKey(),

	...PROPORDER_FOUNDRY_DATA_INLINE,

	new ArrayKey("roll20Spell", {
		fnGetOrder: () => PROPORDER_ROLL20_SPELL,
	}),
];
const PROPORDER_SPELL__COPY_MOD = [
	"*",
	"_",
	...PROPORDER_SPELL,
];
const PROPORDER_SPELL_LIST = [
	...getGenericMetadataPropOrder(),

	"spellListType",

	"className",
	"classSource",

	"spells",
];
const PROPORDER_ACTION = [
	...getGenericMetadataPropOrder(),

	"fromVariant",

	"time",

	EntryPropOrder.getArrayKey("entries"),

	"seeAlsoAction",

	getFluffObjectKey(),

	...PROPORDER_FOUNDRY_DATA_INLINE,
];
const _PROPORDER_CORPUS_CONTENTS = new ArrayKey(
	"contents",
	{
		fnGetOrder: () => [
			"name",
			"ordinal",
			new ArrayKey(
				"headers",
				{
					order: [
						"header",
						"source",
						"index",
						"depth",
						"statblock",
						"tag",
						"uid",
					],
				},
			),
		],
	},
);
const PROPORDER_ADVENTURE = [
	...getGenericMetadataPropOrder({
		propsPostNameAdditional: ["alias", "id"],
		propsPostSourceAdditional: ["parentSource"],
	}),

	"group",

	"cover",
	"coverCredit",
	"coverUrl",
	"published",
	"publishedOrder",
	"revised",
	"author",
	"storyline",
	"level",

	"alId",
	"alAveragePlayerLevel",
	"alLength",

	_PROPORDER_CORPUS_CONTENTS,
];
const PROPORDER_ADVENTURE_DATA = [
	...getGenericMetadataPropOrder({propsPostNameAdditional: ["alias", "id"]}),

	EntryPropOrder.getArrayKey("data"),
];
const PROPORDER_BOOK = [
	...getGenericMetadataPropOrder({
		propsPostNameAdditional: ["alias", "id"],
		propsPostSourceAdditional: ["parentSource"],
	}),

	"group",

	"cover",
	"coverCredit",
	"coverUrl",
	"published",
	"revised",
	"author",

	_PROPORDER_CORPUS_CONTENTS,
];
const PROPORDER_BOOK_DATA = [
	...getGenericMetadataPropOrder({propsPostNameAdditional: ["alias", "id"]}),

	EntryPropOrder.getArrayKey("data"),
];
const PROPORDER_BACKGROUND = [
	...getGenericMetadataPropOrder(),

	"edition",

	ObjectKey.getCopyKey({fnGetModOrder: () => PROPORDER_BACKGROUND__COPY_MOD}),

	"prerequisite",
	getAbilityArrayKey(),

	"feats",

	"skillProficiencies",
	"languageProficiencies",
	"toolProficiencies",
	"weaponProficiencies",
	"itemMasteries",
	"itemMasteriesProgression",
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

	EntryPropOrder.getArrayKey("entries"),

	"hasFluff",
	"hasFluffImages",

	getFluffObjectKey(),

	...PROPORDER_FOUNDRY_DATA_INLINE,
];
const PROPORDER_BACKGROUND__COPY_MOD = [
	"*",
	"_",
	...PROPORDER_BACKGROUND,
];
const PROPORDER_FOUNDRY_BACKGROUND_FEATURE = getFoundryGeneric({
	propsMatchAdditional: [
		"backgroundName",
		"backgroundSource",
	],
	isFeature: true,
});
const PROPORDER_LEGENDARY_GROUP = [
	...getGenericMetadataPropOrder(),

	ObjectKey.getCopyKey({fnGetModOrder: () => PROPORDER_LEGENDARY_GROUP__COPY_MOD}),

	EntryPropOrder.getArrayKey("lairActions"),
	EntryPropOrder.getArrayKey("regionalEffects"),
	EntryPropOrder.getArrayKey("mythicEncounter"),

	new ArrayKey("_versions", {
		fnGetOrder: () => [
			"name",
			"source",
			"_templates",
			ObjectKey.getCopyModKey({fnGetModOrder: () => PROPORDER_LEGENDARY_GROUP__COPY_MOD}),
			"_preserve",
			"_abstract",
			"_implementations",
			...PROPORDER_LEGENDARY_GROUP,
		],
		fnSort: getFnRootPropListSort("legendaryGroup", {isRequired: true}),
	}),
];
const PROPORDER_LEGENDARY_GROUP__COPY_MOD = [
	"*",
	"_",
	...PROPORDER_LEGENDARY_GROUP,
];
const PROPORDER_LEGENDARY_GROUP_TEMPLATE = [
	...getGenericMetadataPropOrder(),

	"ref",

	ObjectKey.getCopyKey({fnGetModOrder: () => PROPORDER_LEGENDARY_GROUP_TEMPLATE__COPY_MOD}),

	new ObjectKey("apply", {
		order: [
			new ObjectKey("_root", {
				order: PROPORDER_LEGENDARY_GROUP,
			}),
			ObjectKey.getCopyModKey({fnGetModOrder: () => PROPORDER_LEGENDARY_GROUP__COPY_MOD}),
		],
	}),
];
const PROPORDER_LEGENDARY_GROUP_TEMPLATE__COPY_MOD = [
	"*",
	"_",
	...PROPORDER_LEGENDARY_GROUP_TEMPLATE,
];
const _PROPORDER_CLASS_PROFICIENCIES = [
	"skills",
	"languageProficiencies",
	"weapons",
	"weaponProficiencies",
	"tools",
	"toolProficiencies",
	"armor",
	"armorProficiencies",
];
const PROPORDER_CLASS = [
	...getGenericMetadataPropOrder(),

	"edition",

	"isSidekick",
	"classGroup",

	ObjectKey.getCopyKey({fnGetModOrder: () => PROPORDER_CLASS__COPY_MOD}),

	getClassRequirementsObjectKey(),
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

	new ObjectKey("startingProficiencies", {order: _PROPORDER_CLASS_PROFICIENCIES}),

	"itemMasteries",
	"itemMasteriesProgression",

	new ObjectKey("startingEquipment", {
		order: [
			"additionalFromBackground",
			"default",
			"goldAlternative",
			"defaultData",
			EntryPropOrder.getArrayKey("entries"),
		],
	}),

	new ObjectKey("multiclassing", {
		order: [
			getClassRequirementsObjectKey(),
			"requirementsSpecial",
			new ObjectKey("proficienciesGained", {order: _PROPORDER_CLASS_PROFICIENCIES}),
			EntryPropOrder.getArrayKey("entries"),
		],
	}),

	getClassTableGroupsArrayKey("classTableGroups"),

	"classFeatures",

	"subclassTitle",

	"hasFluff",
	"hasFluffImages",

	getFluffObjectKey(),

	...PROPORDER_FOUNDRY_DATA_INLINE,
];
const PROPORDER_CLASS__COPY_MOD = [
	"*",
	"_",
	...PROPORDER_CLASS,
];
const PROPORDER_FOUNDRY_CLASS = [
	...getGenericMetadataPropOrder(),

	"system",
	PROPORDER_FOUNDRY_ACTIVITIES,
	PROPORDER_FOUNDRY_EFFECTS,
	"flags",
	"img",

	"advancement",
	"chooseSystem",
	"isChooseSystemRenderEntries",
	"isChooseFlagsRenderEntries",
	"isIgnored",
	"ignoreSrdActivities",
	"ignoreSrdEffects",
	"actorTokenMod",

	EntryPropOrder.getObjectKey("advice"),
	EntryPropOrder.getArrayKey("entries"),

	new ObjectKey("subEntities", {fnGetOrder: () => PROPORDER_ROOT}),

	"migrationVersion",
];
const PROPORDER_SUBCLASS = [
	...getGenericMetadataPropOrder({
		propsPostNameAdditional: ["shortName", "alias"],
		propsPostSourceAdditional: ["className", "classSource"],
	}),

	"edition",

	new ObjectKey("_copy", {
		order: [
			"name",
			"source",
			"shortName",
			"source",
			"className",
			"classSource",
			ObjectKey.getCopyModKey({fnGetModOrder: () => PROPORDER_SUBCLASS__COPY_MOD}),
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

	getClassTableGroupsArrayKey("subclassTableGroups"),
	"subclassFeatures",

	"hasFluff",
	"hasFluffImages",

	getFluffObjectKey(),

	...PROPORDER_FOUNDRY_DATA_INLINE,
];
const PROPORDER_SUBCLASS__COPY_MOD = [
	"*",
	"_",
	...PROPORDER_SUBCLASS,
];
const PROPORDER_SUBCLASS_FLUFF = [
	...getGenericMetadataPropOrder({
		propsPostNameAdditional: ["alias", "shortName"],
		propsPostSourceAdditional: ["className", "classSource"],
	}),

	"_copy",

	EntryPropOrder.getArrayKey("entries"),
	EntryPropOrder.getArrayKey("images"),
];
const PROPORDER_FOUNDRY_SUBCLASS = [
	...getGenericMetadataPropOrder({
		propsPostNameAdditional: ["alias", "shortName"],
		propsPostSourceAdditional: ["className", "classSource"],
	}),

	"identifier",
	"system",
	PROPORDER_FOUNDRY_ACTIVITIES,
	PROPORDER_FOUNDRY_EFFECTS,
	"flags",
	"img",

	"advancement",
	"chooseSystem",
	"isChooseSystemRenderEntries",
	"isChooseFlagsRenderEntries",
	"isIgnored",
	"ignoreSrdActivities",
	"ignoreSrdEffects",
	"actorTokenMod",

	EntryPropOrder.getObjectKey("advice"),
	EntryPropOrder.getArrayKey("entries"),

	new ObjectKey("subEntities", {fnGetOrder: () => PROPORDER_ROOT}),

	"migrationVersion",
];
const PROPORDER_CLASS_FEATURE = [
	...getGenericMetadataPropOrder(),

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
			ObjectKey.getCopyModKey({fnGetModOrder: () => PROPORDER_CLASS_FEATURE__COPY_MOD}),
			"_preserve",
		],
	}),

	"isClassFeatureVariant",

	...PROPORDER_ENTRY_DATA_OBJECT,

	"header",
	"type",

	"consumes",

	EntryPropOrder.getArrayKey("entries"),

	getFluffObjectKey(),

	...PROPORDER_FOUNDRY_DATA_INLINE,
];
const PROPORDER_CLASS_FEATURE__COPY_MOD = [
	"*",
	"_",
	...PROPORDER_CLASS_FEATURE,
];
const PROPORDER_SUBCLASS_FEATURE = [
	...getGenericMetadataPropOrder(),

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
			ObjectKey.getCopyModKey({fnGetModOrder: () => PROPORDER_SUBCLASS_FEATURE__COPY_MOD}),
			"_preserve",
		],
	}),

	"isClassFeatureVariant",

	"isGainAtNextFeatureLevel",

	...PROPORDER_ENTRY_DATA_OBJECT,

	"header",
	"type",

	"consumes",

	EntryPropOrder.getArrayKey("entries"),

	getFluffObjectKey(),

	...PROPORDER_FOUNDRY_DATA_INLINE,
];
const PROPORDER_SUBCLASS_FEATURE__COPY_MOD = [
	"*",
	"_",
	...PROPORDER_SUBCLASS_FEATURE,
];
const PROPORDER_FOUNDRY_CLASS_FEATURE = [
	...getGenericMetadataPropOrder({
		propsPostSourceAdditional: ["className", "classSource", "level"],
	}),

	"identifier",
	"system",
	PROPORDER_FOUNDRY_ACTIVITIES,
	PROPORDER_FOUNDRY_EFFECTS,
	"flags",
	"img",

	EntryPropOrder.getObjectKey("advice"),
	EntryPropOrder.getArrayKey("entries"),

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
	...getGenericMetadataPropOrder({
		propsPostSourceAdditional: [
			"className",
			"classSource",
			"subclassShortName",
			"subclassSource",
			"level",
		],
	}),

	"identifier",
	"system",
	PROPORDER_FOUNDRY_ACTIVITIES,
	PROPORDER_FOUNDRY_EFFECTS,
	"flags",
	"img",

	EntryPropOrder.getObjectKey("advice"),
	EntryPropOrder.getArrayKey("entries"),

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
	...getGenericMetadataPropOrder({propsPostNameAdditional: ["alias", "dialects"]}),

	"type",
	"typicalSpeakers",
	"origin",
	"script",

	"fonts",

	EntryPropOrder.getArrayKey("entries"),

	"hasFluff",
	"hasFluffImages",

	getFluffObjectKey(),

	...PROPORDER_FOUNDRY_DATA_INLINE,
];
const PROPORDER_LANGUAGE_SCRIPT = [
	...getGenericMetadataPropOrder(),

	"fonts",
];
const PROPORDER_NAME = [
	...getGenericMetadataPropOrder(),

	"legacy",

	new ArrayKey("tables", {
		order: [
			"option",

			"page",

			"diceExpression",
			"table",
		],
		fnSort: SortUtil.ascSortEncounter,
	}),
];
const PROPORDER_CONDITION = [
	...getGenericMetadataPropOrder(),

	"color",

	EntryPropOrder.getArrayKey("entries"),

	"hasFluff",
	"hasFluffImages",

	getFluffObjectKey(),

	...PROPORDER_FOUNDRY_DATA_INLINE,
];
const PROPORDER_DISEASE = [
	...getGenericMetadataPropOrder(),

	"type",

	"color",

	EntryPropOrder.getArrayKey("entries"),

	"hasFluff",
	"hasFluffImages",

	getFluffObjectKey(),

	...PROPORDER_FOUNDRY_DATA_INLINE,
];
const PROPORDER_STATUS = [
	...getGenericMetadataPropOrder(),

	"color",

	EntryPropOrder.getArrayKey("entries"),

	"hasFluff",
	"hasFluffImages",

	getFluffObjectKey(),

	...PROPORDER_FOUNDRY_DATA_INLINE,
];
const PROPORDER_CULT = [
	...getGenericMetadataPropOrder(),

	"type",

	"goal",
	"cultists",
	"signatureSpells",

	EntryPropOrder.getArrayKey("entries"),

	"hasFluff",
	"hasFluffImages",

	getFluffObjectKey(),

	...PROPORDER_FOUNDRY_DATA_INLINE,
];
const PROPORDER_BOON = [
	...getGenericMetadataPropOrder(),

	"type",

	EntryPropOrder.getObjectKey("abilityEntry"),

	"goal",
	"cultists",
	new ObjectKey("signatureSpells", {order: [EntryPropOrder.getObjectKey("entry")]}),

	EntryPropOrder.getArrayKey("entries"),

	"hasFluff",
	"hasFluffImages",

	getFluffObjectKey(),

	...PROPORDER_FOUNDRY_DATA_INLINE,
];
const PROPORDER_DEITY = [
	...getGenericMetadataPropOrder({
		propsPostNameAdditional: ["alias", "reprintAlias", "altNames"],
	}),

	new ObjectKey("_copy", {
		order: [
			"name",
			"source",
			"pantheon",
			ObjectKey.getCopyModKey({fnGetModOrder: () => PROPORDER_DEITY__COPY_MOD}),
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
	EntryPropOrder.getObjectKey("symbolImg"),
	"favoredWeapons",

	"piety",

	new ObjectKey("customProperties", {
		fnGetOrder: obj => Object.keys(obj).sort(SortUtil.ascSortLower),
	}),

	EntryPropOrder.getArrayKey("entries"),

	getFluffObjectKey(),

	...PROPORDER_FOUNDRY_DATA_INLINE,
];
const PROPORDER_DEITY__COPY_MOD = [
	"*",
	"_",
	...PROPORDER_DEITY,
];
const PROPORDER_FEAT = [
	...getGenericMetadataPropOrder(),

	ObjectKey.getCopyKey({fnGetModOrder: () => PROPORDER_FEAT__COPY_MOD}),

	"category",
	"prerequisite",

	"repeatable",
	"repeatableNote",
	"repeatableHidden",

	getAbilityArrayKey(),

	new ArrayKey("traitTags", {fnSort: SortUtil.ascSortLower}),
	"skillProficiencies",
	"languageProficiencies",
	"toolProficiencies",
	"weaponProficiencies",
	"itemMasteries",
	"itemMasteriesProgression",
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

	EntryPropOrder.getArrayKey("entries"),

	"hasFluff",
	"hasFluffImages",

	getFluffObjectKey(),

	...PROPORDER_FOUNDRY_DATA_INLINE,

	new ArrayKey("_versions", {
		fnGetOrder: () => [
			"name",
			"source",
			ObjectKey.getCopyModKey({fnGetModOrder: () => PROPORDER_FEAT__COPY_MOD}),
			"_preserve",
			"_abstract",
			"_implementations",
			...PROPORDER_FEAT,
		],
		fnSort: getFnRootPropListSort("feat", {isRequired: true}),
	}),
];
const PROPORDER_FEAT__COPY_MOD = [
	"*",
	"_",
	...PROPORDER_FEAT,
];
const PROPORDER_VEHICLE = [
	...getGenericMetadataPropOrder(),

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
	getVehiclePartArrayKey("control"),
	getVehiclePartArrayKey("movement"),
	getVehiclePartArrayKey("weapon"),
	getVehiclePartArrayKey("station"),
	getVehiclePartArrayKey("other"),

	EntryPropOrder.getArrayKey("entries"),
	EntryPropOrder.getArrayKey("trait"),
	"actionThresholds",
	EntryPropOrder.getArrayKey("actionHeader"),
	EntryPropOrder.getArrayKey("action"),
	EntryPropOrder.getArrayKey("actionEntries"),
	EntryPropOrder.getArrayKey("actionStation"),
	EntryPropOrder.getArrayKey("reaction"),

	getExternalSourcesArrayKey(),

	"tokenUrl",
	"token",
	"tokenHref",
	"tokenCredit",
	"tokenCustom",
	"tokenHref3d",

	"hasToken",
	"hasFluff",
	"hasFluffImages",

	getFluffObjectKey(),

	...PROPORDER_FOUNDRY_DATA_INLINE,
];
const PROPORDER_VEHICLE_UPGRADE = [
	...getGenericMetadataPropOrder(),

	"upgradeType",

	"cost",

	EntryPropOrder.getArrayKey("entries"),

	"hasFluff",
	"hasFluffImages",
];
const PROPORDER_ITEM = [
	...getGenericMetadataPropOrder({
		propsPostNameAdditional: [
			"alias",
			"group",
			"namePrefix",
			"nameSuffix",
			"nameRemove",
		],
	}),

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
	EntryPropOrder.getArrayKey("entries"),
	EntryPropOrder.getArrayKey("additionalEntries"),
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

	getFluffObjectKey(),

	...PROPORDER_FOUNDRY_DATA_INLINE,
];
const PROPORDER_ITEM__COPY_MOD = [
	"*",
	"_",
	...PROPORDER_ITEM,
];
const PROPORDER_MAGICVARIANT = [
	...getGenericMetadataPropOrder({propsPostNameAdditional: ["alias", "group"]}),

	ObjectKey.getCopyKey({fnGetModOrder: () => PROPORDER_MAGICVARIANT__COPY_MOD}),

	"edition",

	"type",

	"requires",
	"excludes",

	"rarity",

	"ammo",

	EntryPropOrder.getArrayKey("entries"),

	new ObjectKey("inherits", {
		order: PROPORDER_ITEM,
	}),

	"hasFluff",
	"hasFluffImages",

	getFluffObjectKey(),

	...PROPORDER_FOUNDRY_DATA_INLINE,
];
const PROPORDER_MAGICVARIANT__COPY_MOD = [
	"*",
	"_",
	...PROPORDER_MAGICVARIANT,
];
const PROPORDER_ITEM_MASTERY = [
	...getGenericMetadataPropOrder({
		propsPostNameAdditional: [],
	}),

	"prerequisite",

	EntryPropOrder.getArrayKey("entries"),
];
const PROPORDER_ITEM_PROPERTY = [
	...getGenericMetadataPropOrder({
		propsPostNameAdditional: ["abbreviation"],
	}),

	ObjectKey.getCopyKey({
		identKeys: [
			"abbreviation",
			"source",
		],
		fnGetModOrder: () => PROPORDER_ITEM_PROPERTY__COPY_MOD,
	}),

	"template",

	EntryPropOrder.getArrayKey("entries"),
	EntryPropOrder.getArrayKey("entriesTemplate"),
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
	...getGenericMetadataPropOrder({
		propsPostNameAdditional: ["abbreviation"],
	}),

	ObjectKey.getCopyKey({
		identKeys: [
			"abbreviation",
			"source",
		],
		fnGetModOrder: () => PROPORDER_ITEM_PROPERTY__COPY_MOD,
	}),

	"template",

	EntryPropOrder.getArrayKey("entries"),
	EntryPropOrder.getArrayKey("entriesTemplate"),
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
	...getGenericMetadataPropOrder(),

	"appliesTo",

	EntryPropOrder.getArrayKey("entries"),
];
const PROPORDER_ITEM_ENTRY = [
	...getGenericMetadataPropOrder(),

	EntryPropOrder.getArrayKey("entriesTemplate"),
];
const PROPORDER_OBJECT = [
	...getGenericMetadataPropOrder({
		propsPostNameAdditional: ["alias", "isNpc"],
	}),

	// region `vehicle` use
	"vehicleType",
	// endregion

	"size",
	"objectType",
	"creatureType",

	// region `vehicle` use
	"dimensions",

	"terrain",

	"capCrew",
	"capPassenger",
	"capCargo",
	// endregion

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

	EntryPropOrder.getArrayKey("entries"),
	EntryPropOrder.getArrayKey("actionEntries"),

	"tokenUrl",
	"token",
	"tokenHref",
	"tokenCredit",
	"tokenCustom",
	"tokenHref3d",

	"altArt",

	"hasToken",
	"hasFluff",
	"hasFluffImages",

	getFluffObjectKey(),

	...PROPORDER_FOUNDRY_DATA_INLINE,
];
const PROPORDER_OPTIONALFEATURE = [
	...getGenericMetadataPropOrder(),

	ObjectKey.getCopyKey({fnGetModOrder: () => PROPORDER_OPTIONALFEATURE__COPY_MOD}),

	"isClassFeatureVariant",
	"previousVersion",

	"featureType",

	"prerequisite",

	"skillProficiencies",
	"languageProficiencies",
	"toolProficiencies",
	"weaponProficiencies",
	"itemMasteries",
	"itemMasteriesProgression",
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

	EntryPropOrder.getArrayKey("entries"),

	"hasFluff",
	"hasFluffImages",

	getFluffObjectKey(),

	...PROPORDER_FOUNDRY_DATA_INLINE,
];
const PROPORDER_OPTIONALFEATURE__COPY_MOD = [
	"*",
	"_",
	...PROPORDER_OPTIONALFEATURE,
];
const PROPORDER_PSIONIC = [
	...getGenericMetadataPropOrder(),

	"type",
	"order",

	EntryPropOrder.getArrayKey("entries"),

	"focus",

	new ArrayKey(
		"modes",
		{
			order: [
				"name",

				"cost",
				"concentration",

				EntryPropOrder.getArrayKey("entries"),

				new ArrayKey(
					"submodes",
					{
						order: [
							"name",

							"cost",

							EntryPropOrder.getArrayKey("entries"),
						],
					},
				),
			],
		},
	),

	getFluffObjectKey(),

	...PROPORDER_FOUNDRY_DATA_INLINE,
];
const PROPORDER_FOUNDRY_PSIONIC_DISCIPLINE_ACTIVE = getFoundryGeneric({
	propsMatchAdditional: [
		"psionicName",
		"psionicSource",
	],
});
const PROPORDER_REWARD = [
	...getGenericMetadataPropOrder(),

	"type",

	"rarity",

	EntryPropOrder.getObjectKey("abilityEntry"),

	"additionalSpells",

	EntryPropOrder.getArrayKey("entries"),

	"seeAlsoFacility",

	"hasFluff",
	"hasFluffImages",

	getFluffObjectKey(),

	...PROPORDER_FOUNDRY_DATA_INLINE,
];
const PROPORDER_VARIANTRULE = [
	...getGenericMetadataPropOrder(),

	"ruleType",

	"type",
	EntryPropOrder.getArrayKey("entries"),

	getFluffObjectKey(),

	...PROPORDER_FOUNDRY_DATA_INLINE,
];
const PROPORDER_RACE_SUBRACE = [
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
	getAbilityArrayKey(),

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
	"itemMasteries",
	"itemMasteriesProgression",
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

	EntryPropOrder.getObjectKey("abilityEntry"),
	EntryPropOrder.getObjectKey("creatureTypesEntry"),
	EntryPropOrder.getObjectKey("sizeEntry"),
	EntryPropOrder.getObjectKey("speedEntry"),

	EntryPropOrder.getArrayKey("entries"),

	"overwrite",

	"hasFluff",
	"hasFluffImages",

	getFluffObjectKey(),

	...PROPORDER_FOUNDRY_DATA_INLINE,

	new ArrayKey("_versions", {
		fnGetOrder: () => [
			"name",
			"source",
			"raceName",
			"raceSource",
			ObjectKey.getCopyModKey({fnGetModOrder: () => PROPORDER_RACE__COPY_MOD}),
			"_preserve",
			"_abstract",
			"_implementations",
			...PROPORDER_RACE,
		],
		fnSort: getFnRootPropListSort("subrace", {isRequired: true}),
	}),
];
const PROPORDER_RACE = [
	...getGenericMetadataPropOrder(),

	...PROPORDER_RACE_SUBRACE,
];
const PROPORDER_RACE__COPY_MOD = [
	"*",
	"_",
	...PROPORDER_RACE,
];
const PROPORDER_SUBRACE = [
	...getGenericMetadataPropOrder({propsPostSourceAdditional: ["raceName", "raceSource"]}),

	...PROPORDER_RACE_SUBRACE,
];
const PROPORDER_FOUNDRY_RACE_FEATURE = getFoundryGeneric({
	propsMatchAdditional: [
		"raceName",
		"raceSource",
	],
	isFeature: true,
});
const PROPORDER_TABLE = [
	...getGenericMetadataPropOrder(),

	"type",

	"chapter",

	"caption",

	EntryPropOrder.getArrayKey("colLabels"),
	EntryPropOrder.getArrayKey("colLabelRows"),
	"colStyles",

	EntryPropOrder.getArrayKey("rowLabels"),

	EntryPropOrder.getArrayKey("intro"),
	EntryPropOrder.getArrayKey("rows"),
	new ArrayKey("tables", {
		fnGetOrder: () => PROPORDER_TABLE,
	}),
	EntryPropOrder.getArrayKey("outro"),
	EntryPropOrder.getArrayKey("footnotes"),

	"isNameGenerator",
	"isStriped",

	"parentEntity",

	"data",
];
const PROPORDER_TRAP = [
	...getGenericMetadataPropOrder(),

	"trapHazType",

	"rating",

	"hauntBonus",

	EntryPropOrder.getArrayKey("effect"),

	EntryPropOrder.getArrayKey("trigger"),
	"duration",

	"initiative",
	EntryPropOrder.getObjectKey("initiativeNote"),

	EntryPropOrder.getArrayKey("eActive"),
	EntryPropOrder.getArrayKey("eDynamic"),
	EntryPropOrder.getArrayKey("eConstant"),

	EntryPropOrder.getArrayKey("countermeasures"),

	EntryPropOrder.getArrayKey("entries"),

	"hasFluff",
	"hasFluffImages",

	getFluffObjectKey(),

	...PROPORDER_FOUNDRY_DATA_INLINE,
];
const PROPORDER_HAZARD = [
	...getGenericMetadataPropOrder(),

	"trapHazType",

	"rating",

	EntryPropOrder.getArrayKey("entries"),

	"hasFluff",
	"hasFluffImages",

	getFluffObjectKey(),

	...PROPORDER_FOUNDRY_DATA_INLINE,
];
const PROPORDER_RECIPE = [
	...getGenericMetadataPropOrder(),

	"type",
	"dishTypes",

	"diet",
	"allergenGroups",

	"time",
	EntryPropOrder.getObjectKey("makes"),
	new ObjectKey(
		"serves",
		{
			order: [
				"exact",

				"min",
				"max",

				EntryPropOrder.getObjectKey("note"),
			],
		},
	),
	EntryPropOrder.getArrayKey("ingredients"),
	EntryPropOrder.getArrayKey("equipment"),
	EntryPropOrder.getArrayKey("instructions"),
	EntryPropOrder.getArrayKey("noteCook"),

	new ArrayKey("miscTags", {fnSort: SortUtil.ascSortLower}),

	"hasFluff",
	"hasFluffImages",

	getFluffObjectKey(),

	...PROPORDER_FOUNDRY_DATA_INLINE,
];
const PROPORDER_CROCHET_PATTERN = [
	...getGenericMetadataPropOrder(),

	"designers",
	"level",
	"patternType",
	new ArrayKey("size", {
		order: [
			"name",

			new ObjectKey(
				"height",
				{
					order: [
						"mm",
						EntryPropOrder.getObjectKey("entry"),
					],
				},
			),
			new ObjectKey(
				"width",
				{
					order: [
						"mm",
						EntryPropOrder.getObjectKey("entry"),
					],
				},
			),
		],
	}),
	"sizeNote",
	EntryPropOrder.getArrayKey("yarn"),
	"hooks",
	EntryPropOrder.getArrayKey("notions"),
	EntryPropOrder.getArrayKey("gauge"),
	EntryPropOrder.getArrayKey("abbreviations"),
	EntryPropOrder.getArrayKey("stitches"),
	EntryPropOrder.getArrayKey("notes"),
	EntryPropOrder.getArrayKey("finishing"),

	EntryPropOrder.getArrayKey("instructions"),

	"seeAlsoCreature",
	"seeAlsoItem",

	"hasFluff",
	"hasFluffImages",

	getFluffObjectKey(),

	...PROPORDER_FOUNDRY_DATA_INLINE,
];
const PROPORDER_CHAROPTION = [
	...getGenericMetadataPropOrder(),

	"prerequisite",

	"optionType",

	EntryPropOrder.getArrayKey("entries"),

	"hasFluff",
	"hasFluffImages",

	getFluffObjectKey(),

	...PROPORDER_FOUNDRY_DATA_INLINE,
];
const PROPORDER_SKILL = [
	...getGenericMetadataPropOrder(),

	"ability",

	EntryPropOrder.getArrayKey("entries"),
];
const PROPORDER_SENSE = [
	...getGenericMetadataPropOrder(),

	EntryPropOrder.getArrayKey("entries"),
];
const PROPORDER_DECK_SPREAD_POSITION = [
	"name",

	"suits",

	EntryPropOrder.getArrayKey("entries"),

	"outcomes",
];
const PROPORDER_DECK_SPREAD = [
	...getGenericMetadataPropOrder(),

	EntryPropOrder.getArrayKey("entries"),

	"seeAlsoAdventureHeader",
	"seeAlsoBookHeader",

	new ArrayKey("positions", {fnGetOrder: () => PROPORDER_DECK_SPREAD_POSITION}),
	"outcomes",
];
const PROPORDER_DECK = [
	...getGenericMetadataPropOrder(),

	ObjectKey.getCopyKey({fnGetModOrder: () => PROPORDER_DECK__COPY_MOD}),

	"cards",
	EntryPropOrder.getObjectKey("back"),

	EntryPropOrder.getArrayKey("entries"),

	new ArrayKey("spreads", {fnGetOrder: () => PROPORDER_DECK_SPREAD}),

	"hasCardArt",
];

const PROPORDER_DECK__COPY_MOD = [
	"*",
	"_",
	...PROPORDER_DECK,
];
const PROPORDER_CARD = [
	...getGenericMetadataPropOrder({
		propsPostSourceAdditional: ["set"],
	}),

	"suit",
	"value",
	"valueName",

	EntryPropOrder.getObjectKey("face"),
	EntryPropOrder.getObjectKey("back"),

	EntryPropOrder.getArrayKey("entries"),
];

const PROPORDER_ENCOUNTER = [
	...getGenericMetadataPropOrder(),

	new ArrayKey("tables", {
		order: [
			"caption",

			"captionPrefix",
			"captionSuffix",

			"page",

			"minlvl",
			"maxlvl",

			"diceExpression",
			"rollAttitude",

			new ArrayKey(
				"table",
				{
					order: [
						"min",
						"max",

						EntryPropOrder.getObjectKey("result"),
						EntryPropOrder.getObjectKey("resultAttitude"),
					],
				},
			),

			EntryPropOrder.getArrayKey("footnotes"),
		],
		fnSort: SortUtil.ascSortEncounter,
	}),
];

const PROPORDER_CITATION = [
	...getGenericMetadataPropOrder(),

	EntryPropOrder.getArrayKey("entries"),
];

const PROPORDER_FOUNDRY_MAP = [
	...getGenericMetadataPropOrder(),

	"lights",
	"walls",

	"migrationVersion",
];

const PROPORDER_FACILITY = [
	...getGenericMetadataPropOrder(),

	"facilityType",

	"level",
	"prerequisite",
	"space",
	"hirelings",
	"orders",

	EntryPropOrder.getArrayKey("entries"),

	"hasFluff",
	"hasFluffImages",

	getFluffObjectKey(),
];

const PROPORDER_CONVERTER_SAMPLE = [
	"converterId",
	"format",
	"edition",
	"text",
];

const PROPORDER_ENCOUNTER_SHAPE = [
	...getGenericMetadataPropOrder(),

	"shapeTemplate",
];

const PROPORDER_RENDERDEMO = [
	...getGenericMetadataPropOrder(),

	EntryPropOrder.getObjectKey("entry"),
];

export const PROPORDER_PROP_TO_LIST = {
	"_meta": PROPORDER_META,
	"_test": PROPORDER_TEST,
	"monster": PROPORDER_MONSTER,
	"foundryMonster": PROPORDER_FOUNDRY_MONSTER,
	"foundryMonsterAction": PROPORDER_FOUNDRY_MONSTER_SUB_ENTITY,
	"foundryMonsterBonus": PROPORDER_FOUNDRY_MONSTER_SUB_ENTITY,
	"foundryMonsterReaction": PROPORDER_FOUNDRY_MONSTER_SUB_ENTITY,
	"foundryMonsterTrait": PROPORDER_FOUNDRY_MONSTER_SUB_ENTITY,
	"foundryMonsterLegendary": PROPORDER_FOUNDRY_MONSTER_SUB_ENTITY,
	"foundryMonsterMythic": PROPORDER_FOUNDRY_MONSTER_SUB_ENTITY,
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
	"raceFluff": PROPORDER_GENERIC_FLUFF,
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
	"foundryBackgroundFeature": PROPORDER_FOUNDRY_BACKGROUND_FEATURE,
	"legendaryGroup": PROPORDER_LEGENDARY_GROUP,
	"legendaryGroupTemplate": PROPORDER_LEGENDARY_GROUP_TEMPLATE,
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
	"foundryBaseitem": PROPORDER_FOUNDRY_GENERIC,
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
	"foundryPsionicDisciplineFocus": PROPORDER_FOUNDRY_GENERIC_FEATURE,
	"foundryPsionicDisciplineActive": PROPORDER_FOUNDRY_PSIONIC_DISCIPLINE_ACTIVE,
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
	"crochetPattern": PROPORDER_CROCHET_PATTERN,
	"crochetPatternFluff": PROPORDER_GENERIC_FLUFF,
	"renderdemo": PROPORDER_RENDERDEMO,
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
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "foundryBackgroundFeature"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "backgroundFluff"),

	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "race"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "subrace"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "foundryRace"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "foundryRaceFeature"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "raceFluff"),

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
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "foundryBaseitem"),
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
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "monsterTemplate"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "legendaryGroup"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "legendaryGroupTemplate"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "foundryMonsterAction"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "foundryMonsterBonus"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "foundryMonsterReaction"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "foundryMonsterTrait"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "foundryMonsterLegendary"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "foundryMonsterMythic"),

	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "object"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "objectFluff"),

	ArrayKey.getRootKeyCustom("vehicle", {
		fnGetOrder: obj => {
			switch (obj.vehicleType) {
				case "CREATURE": return PROPORDER_MONSTER;
				case "OBJECT": return PROPORDER_OBJECT;
				default: return PROPORDER_VEHICLE;
			}
		},
	}),
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
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "crochetPattern"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "crochetPatternFluff"),
	// endregion

	// region Legacy content
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "psionic"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "foundryPsionicDisciplineFocus"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "foundryPsionicDisciplineActive"),
	// endregion

	// region Tooling
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "makebrewCreatureTrait"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "makebrewCreatureAction"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "encounterShape"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "converterSample"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "monsterfeatures"),
	ArrayKey.getRootKey(PROPORDER_PROP_TO_LIST, "renderdemo"),
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
