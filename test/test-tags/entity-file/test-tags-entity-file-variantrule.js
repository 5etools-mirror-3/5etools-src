import {EntityFileHandlerBase} from "./test-tags-entity-file-base.js";

export class EntityFileHandlerVariantrule extends EntityFileHandlerBase {
	_props = ["variantrule"];

	async _pDoTestEntity ({filePath, fileState, ent, prop, propPrefixed}) {
		this._testReprintedAs(filePath, ent, "variantrule");
		this._testSrd(filePath, ent);
	}
}
