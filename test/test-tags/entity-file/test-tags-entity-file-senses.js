import {EntityFileHandlerBase} from "./test-tags-entity-file-base.js";

export class EntityFileHandlerSenses extends EntityFileHandlerBase {
	_props = ["sense"];

	async _pDoTestEntity ({filePath, fileState, ent, prop, propPrefixed}) {
		this._testReprintedAs(filePath, ent, "sense");
		this._testSrd(filePath, ent);
	}
}
