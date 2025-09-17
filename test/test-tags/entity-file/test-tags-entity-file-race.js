import {EntityFileHandlerBase} from "./test-tags-entity-file-base.js";

export class EntityFileHandlerRace extends EntityFileHandlerBase {
	_props = [
		"race",
		"subrace",
	];

	async _pDoTestEntity ({filePath, fileState, ent, prop, propPrefixed}) {
		this._testAdditionalSpells(filePath, ent);
		this._testAdditionalFeats(filePath, ent);
		this._testReprintedAs(filePath, ent, "race");
		this._testSrd(filePath, ent);
		this._testStartingEquipment(filePath, ent);
	}
}
