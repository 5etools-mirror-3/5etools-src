import {EntityFileHandlerBase} from "./test-tags-entity-file-base.js";

export class EntityFileHandlerOptionalfeature extends EntityFileHandlerBase {
	_props = ["optionalfeature"];

	_doPrerequisite (filePath, ent) {
		if (!ent.prerequisite?.length) return;

		ent.prerequisite
			.forEach(prereq => {
				(prereq.feat || []).forEach(uid => this._doUid({filePath, uid, tag: "feat", propPath: "prerequisite.feat"}));
				(prereq.optionalfeature || []).forEach(uid => this._doUid({filePath, uid, tag: "optfeature", prop: "optionalfeature", propPath: "prerequisite.optionalfeature"}));
			});
	}

	/**
	 * @param filePath
	 * @param uid
	 * @param tag
	 * @param {?string} prop
	 * @param propPath
	 */
	_doUid ({filePath, uid, tag, prop = null, propPath}) {
		const url = this._tagTestUrlLookup.getEncodedProxy(uid, tag, prop);
		if (!this._tagTestUrlLookup.hasUrl(url)) this._addMessage(`Missing link: ${uid} in file ${filePath}} (evaluates to "${url}") in "${propPath}"\n${this._tagTestUrlLookup.getLogPtSimilarUrls({url})}`);
	}

	async _pDoTestEntity ({filePath, fileState, ent, prop, propPrefixed}) {
		this._doPrerequisite(filePath, ent);
		this._testReprintedAs(filePath, ent, "optfeature");
		this._testSrd(filePath, ent);
	}
}
