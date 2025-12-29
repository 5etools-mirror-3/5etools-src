import {EncounterBuilderCreatureMeta} from "./encounterbuilder/encounterbuilder-models.js";
import {EncounterBuilderComponentBestiary} from "./bestiary/bestiary-encounterbuilder-component.js";

export class ListUtilBestiary extends ListUtilEntity {
	static _getString_action_currentPinned_name ({page}) { return "From Current Bestiary Encounter"; }
	static _getString_action_savedPinned_name ({page}) { return "From Saved Bestiary Encounter"; }
	static _getString_action_file_name ({page}) { return "From Bestiary Encounter File"; }

	static _getString_action_currentPinned_msg_noSaved ({page}) { return "No saved encounter! Please first go to the Bestiary and create one."; }
	static _getString_action_savedPinned_msg_noSaved ({page}) { return "No saved encounters were found! Go to the Bestiary and create some first."; }

	static async _pGetLoadableSublist_getAdditionalState ({exportedSublist}) {
		const encounterInfo = EncounterBuilderComponentBestiary.getStateFromExportedSublist({exportedSublist});
		return {encounterInfo};
	}

	static async pGetLoadableSublist (opts) {
		return super.pGetLoadableSublist({...opts, page: UrlUtil.PG_BESTIARY});
	}

	static _getFileTypes ({page}) {
		return [
			...super._getFileTypes({page}),
			"encounter",
		];
	}

	static getContextOptionsLoadSublist (opts) {
		return super.getContextOptionsLoadSublist({...opts, page: UrlUtil.PG_BESTIARY});
	}
}

export class EncounterBuilderHelpers {
	static getSublistedCreatureMeta ({sublistItem}) {
		const mon = sublistItem.data.entityBase;

		return new EncounterBuilderCreatureMeta({
			id: sublistItem.data.collectionId,

			creature: sublistItem.data.entity,
			count: Number(sublistItem.data.count),

			isLocked: sublistItem.data.isLocked,

			customHashId: sublistItem.data.customHashId,
			baseCreature: mon,
		});
	}

	static async pGetEncounterName (exportedSublist) {
		if (exportedSublist.name) return exportedSublist.name;

		const expandedList = await ListUtil.pGetSublistEntities_fromHover({
			exportedSublist,
			page: UrlUtil.PG_BESTIARY,
		});

		if (!expandedList?.length) return "(Unnamed Encounter)";

		const {count, entity: {name}} = expandedList
			.sort((a, b) => SortUtil.ascSort(b.count, a.count) || SortUtil.ascSort(b.entity.name, a.entity.name))[0];

		return `Encounter with ${name}${count > 1 ? ` ×${count}` : ""}`;
	}
}
