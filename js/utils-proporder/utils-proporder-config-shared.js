import {ArrayKey} from "./utils-proporder-models.js";

export const PROPORDER_ENTRY_DATA_OBJECT = [
	"languageProficiencies",
	"skillProficiencies",
	"weaponProficiencies",
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

export const PROPORDER_FOUNDRY_ACTIVITIES = new ArrayKey("activities", {
	fnGetOrder: () => [
		"foundryId",

		"name",
		"type",

		"img",
		"advice",
		"description",
		"descriptionEntries",

		"activation",
		"duration",
		"consumption",
		"uses",
		"target",
		"range",
		"attack",
		"damage",
		"save",
		"healing",
		"roll",

		// "check"-type
		"check",

		// "cast"-type"
		"spell",

		// "summon"-type
		"profiles",
		"summon",
		"creatureTypes",
		"bonuses",
		"match",

		// "enchant"-type
		"restrictions",
		"enchant",

		// "transform"-type
		"transform",
		"settings",

		"effects",
	],
});

export const PROPORDER_FOUNDRY_EFFECTS = new ArrayKey("effects", {
	fnGetOrder: () => [
		"foundryId",

		"name",
		"type",

		"enchantmentRiderParent",

		"disabled",
		"transfer",

		"duration",

		"statuses",

		"changes",

		"flags",

		"description",
		"descriptionEntries",
		"img",
		"advice",
	],
});
