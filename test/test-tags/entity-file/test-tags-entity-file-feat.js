import {EntityFileHandlerBase} from "./test-tags-entity-file-base.js";

export class EntityFileHandlerFeat extends EntityFileHandlerBase {
	_props = ["feat"];

	async _pDoTestEntity ({filePath, fileState, ent, prop, propPrefixed}) {
		this._testAdditionalSpells(filePath, ent);
		this._testReprintedAs(filePath, ent, "feat");
		this._testSrd(filePath, ent);
	}
}
