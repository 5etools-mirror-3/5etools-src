import {EntityFileHandlerBase} from "./test-tags-entity-file-base.js";

export class EntityFileHandlerCultsBoons extends EntityFileHandlerBase {
	_props = [
		"cult",
		"boon",
	];

	async _pDoTestEntity ({filePath, fileState, ent, prop, propPrefixed}) {
		this._testReprintedAs(filePath, ent, prop);
		this._testSrd(filePath, ent);
	}
}
