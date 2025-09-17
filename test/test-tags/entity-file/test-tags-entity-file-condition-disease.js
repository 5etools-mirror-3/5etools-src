import {EntityFileHandlerBase} from "./test-tags-entity-file-base.js";

export class EntityFileHandlerConditionDisease extends EntityFileHandlerBase {
	_props = [
		"condition",
		"disease",
		"status",
	];

	async _pDoTestEntity ({filePath, fileState, ent, prop, propPrefixed}) {
		this._testReprintedAs(filePath, ent, prop);
		this._testSrd(filePath, ent);
	}
}
