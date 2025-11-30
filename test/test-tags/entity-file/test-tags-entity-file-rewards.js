import {EntityFileHandlerBase} from "./test-tags-entity-file-base.js";

export class EntityFileHandlerRewards extends EntityFileHandlerBase {
	_props = ["reward"];

	async _pDoTestEntity ({filePath, fileState, ent, prop, propPrefixed}) {
		this._testReprintedAs(filePath, ent, "reward");
		this._testSrd(filePath, ent);
		this._testAdditionalSpells(filePath, ent);
	}
}
