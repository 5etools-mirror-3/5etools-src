import {ArrayKey} from "./utils-proporder-models.js";
import {EntryPropOrder} from "./utils-proporder-config-entries.js";
import {PROPS_FOUNDRY_DATA_INLINE} from "../foundry/foundry-consts.js";

export const PROPORDER_FOUNDRY_ACTIVITIES = new ArrayKey(
	"activities",
	{
		fnGetOrder: () => [
			"foundryId",

			"name",
			"type",

			"img",
			EntryPropOrder.getObjectKey("advice"),
			"description",
			EntryPropOrder.getArrayKey("descriptionEntries"),
			"descriptionChat",
			EntryPropOrder.getArrayKey("descriptionEntriesChat"),

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
			"level",
			"visibility",
			"behaviors",

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

			// "teleport"-type
			"teleport",

			// "forward"-type
			"activity",

			"effects",

			// Other modules
			"midiProperties",
			"overTimeProperties",
		],
	},
);

export const PROPORDER_FOUNDRY_EFFECTS = new ArrayKey(
	"effects",
	{
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
			EntryPropOrder.getArrayKey("descriptionEntries"),
			"img",
			"showIcon",
			EntryPropOrder.getObjectKey("advice"),
		],
	},
);

export const PROPORDER_FOUNDRY_DATA_INLINE = PROPS_FOUNDRY_DATA_INLINE.map(prop => {
	switch (prop) {
		case "foundryActivities": return PROPORDER_FOUNDRY_ACTIVITIES.getForProp(prop);
		case "foundryEffects": return PROPORDER_FOUNDRY_EFFECTS.getForProp(prop);

		case "foundryAdvice": return EntryPropOrder.getObjectKey(prop);

		default: return prop;
	}
});
