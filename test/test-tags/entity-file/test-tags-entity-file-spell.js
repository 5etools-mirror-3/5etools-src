import {EntityFileHandlerBase} from "./test-tags-entity-file-base.js";

export class EntityFileHandlerSpell extends EntityFileHandlerBase {
	_props = ["spell"];

	async _pDoTestEntity ({filePath, fileState, ent, prop, propPrefixed}) {
		this._testReprintedAs(filePath, ent, "spell");
		this._testSrd(filePath, ent);
	}
}
