import {ArrayKey, ObjectKey} from "./utils-proporder-models.js";
import {EntryPropOrder} from "./utils-proporder-config-entries.js";

export const getAbilityArrayKey = () => (
	new ArrayKey(
		"ability",
		{
			order: [
				...Parser.ABIL_ABVS,

				new ObjectKey(
					"choose",
					{
						order: [
							"from",

							"count",
							"amount",

							"weighted",

							EntryPropOrder.getObjectKey("entry"),
						],
					},
				),

				"max",

				"hidden",
			],
		},
	)
);

export const getSkillSaveObjectKey = prop => (
	new ObjectKey(
		prop,
		{
			fnGetOrder: obj => Object.keys(obj)
				.map(prop => prop === "special" ? EntryPropOrder.getObjectKey(prop) : prop),
		},
	)
);

/* -------------------------------------------- */

export const getExternalSourcesArrayKey = () => (
	new ArrayKey(
		"externalSources",
		{
			order: [EntryPropOrder.getObjectKey("entry")],
		},
	)
);

/* -------------------------------------------- */

export const getClassRequirementsObjectKey = () => (
	new ObjectKey(
		"requirements",
		{
			order: [
				...Parser.ABIL_ABVS,
				"or",

				EntryPropOrder.getArrayKey("entries"),
			],
		},
	)
);

export const getClassTableGroupsArrayKey = prop => (
	new ArrayKey(
		prop,
		{
			order: [
				"title",
				"subclasses",

				"colLabels",

				EntryPropOrder.getArrayKey("rows"),
				"rowsSpellProgression",
			],
		},
	)
);

/* -------------------------------------------- */

export const getVehiclePartArrayKey = prop => (
	new ArrayKey(
		prop,
		{
			order: [
				"name",

				"size",

				"isControl",

				"ac",
				"hp",
				"hpNote",
				"dt",

				"count",
				"crew",

				"costs",

				new ArrayKey(
					"locomotion",
					{
						order: [
							"mode",
							EntryPropOrder.getArrayKey("entries"),
						],
					},
				),
				new ArrayKey(
					"speed",
					{
						order: [
							"mode",
							EntryPropOrder.getArrayKey("entries"),
						],
					},
				),

				EntryPropOrder.getArrayKey("entries"),

				EntryPropOrder.getArrayKey("action"),
			],
		},
	)
);
