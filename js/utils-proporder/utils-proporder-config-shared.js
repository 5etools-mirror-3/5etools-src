import {ArrayKey} from "./utils-proporder-models.js";

export const PROPORDER_ENTRY_DATA_OBJECT = [
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

export const PROPORDER_FOUNDRY_ACTIVITIES = new ArrayKey("activities", {
	fnGetOrder: () => [
		"foundryId",

		"name",
		"type",

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

		"profiles",
		"summon",
		"creatureTypes",

		"restrictions",

		"img",

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

		"description",
		"img",
	],
});
