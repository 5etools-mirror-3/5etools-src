import {ArrayKey} from "./utils-proporder-models.js";

/**
 * @param {?Array<string|ArrayKey|ObjectKey>} propsPreNameAdditional
 * @param {?Array<string|ArrayKey|ObjectKey>} propsPostNameAdditional
 * @param {?Array<string|ArrayKey|ObjectKey>} propsPostSourceAdditional
 */
export const getGenericMetadataPropOrder = (
	{
		propsPreNameAdditional = null,
		propsPostNameAdditional = null,
		propsPostSourceAdditional = null,
	} = {},
) => {
	propsPreNameAdditional ??= [];
	propsPostNameAdditional ??= ["alias"];
	propsPostSourceAdditional ??= [];

	return [
		...propsPreNameAdditional,
		"name",
		...propsPostNameAdditional,

		"source",
		...propsPostSourceAdditional,

		"id",

		"page",

		"srd",
		"srd52",
		"basicRules",
		"basicRules2024",
		"additionalSources",
		"otherSources",
		new ArrayKey("referenceSources", {fnSort: SortUtil.ascSortLower}),
		"isReprinted",
		"reprintedAs",
		"legacy",
	];
};

export const PROPORDER_ENTRY_DATA_OBJECT = [
	"languageProficiencies",
	"skillProficiencies",
	"weaponProficiencies",
	"itemMasteries",
	"itemMasteriesProgression",
	"armorProficiencies",
	"toolProficiencies",
	"skillToolLanguageProficiencies",
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
