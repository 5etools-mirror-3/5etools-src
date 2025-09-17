import {EntityFileHandlerBase} from "./test-tags-entity-file-base.js";

export class EntityFileHandlerFoundryClass extends EntityFileHandlerBase {
	_props = ["foundryClass"];

	async _pDoTestEntity ({filePath, fileState, ent, prop, propPrefixed}) {
		this._testFoundryActivities(filePath, ent);
	}
}
