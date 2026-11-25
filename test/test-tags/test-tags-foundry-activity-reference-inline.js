import {DataTesterBase} from "5etools-utils";
import {isSiteFoundryFile} from "../../node/util.js";
import {WALKER} from "./test-tags-utils.js";

export class FoundryActivityReferenceInlineCheck extends DataTesterBase {
	registerParsedFileCheckers (parsedJsonChecker) {
		parsedJsonChecker.registerFileHandler(this);
	}

	/* -------------------------------------------- */

	// Note: copy of matching regex from `ActivityConverter.js` in _Plutonium Addon: Automation_
	static _RE_INLINE_ACTIVITY = /(?<prefix>\[\[(?:lookup\b|\/save\b)[^\]]*?\bactivity=)(?:(?<quote>["'])(?<idQuoted>[^"']+)\k<quote>|(?<idBare>[^\s\]]+))/gi;

	_testEntity ({filePath, ent}) {
		const activityIds = new Set(
			ent.activities
				.map(activity => activity.foundryId)
				.filter(Boolean),
		);

		WALKER.walk(ent.activities, {string: str => {
			[...str.matchAll(this.constructor._RE_INLINE_ACTIVITY)]
				.forEach(({groups}) => {
					const activityId = groups.idQuoted || groups.idBare;
					if (activityIds.has(activityId)) return;

					this._addMessage(`Missing Foundry activity ID: inline tag "activity=" reference "${activityId}" did not match an activity "foundryId" in "${ent.name}" (${ent.source}) in file ${filePath}\n`);
				});
		}});
	}

	async pHandleFile (filePath, contents) {
		if (!isSiteFoundryFile(filePath)) return;

		Object.values(contents)
			.filter(arr => arr instanceof Array)
			.flat()
			.filter(ent => ent.activities?.length)
			.forEach(ent => this._testEntity({filePath, ent}));
	}
}
