import {EntityFileHandlerBase} from "./test-tags-entity-file-base.js";

export class EntityFileHandlerBackground extends EntityFileHandlerBase {
	_props = ["background"];

	async _pDoTestEntity ({filePath, fileState, ent, prop, propPrefixed}) {
		this._testAdditionalSpells(filePath, ent);
		this._testAdditionalFeats(filePath, ent);
		this._testReprintedAs(filePath, ent, "background");
		this._testSrd(filePath, ent);
		this._testStartingEquipment(filePath, ent);
	}
}
