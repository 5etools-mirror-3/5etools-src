import {EntityFileHandlerBase} from "./test-tags-entity-file-base.js";

export class EntityFileHandlerSkills extends EntityFileHandlerBase {
	_props = ["skill"];

	async _pDoTestEntity ({filePath, fileState, ent, prop, propPrefixed}) {
		this._testReprintedAs(filePath, ent, "skill");
		this._testSrd(filePath, ent);
	}
}
