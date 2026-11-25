import {EntityFileHandlerBase} from "./test-tags-entity-file-base.js";

export class EntityFileHandlerFoundrySpells extends EntityFileHandlerBase {
	_props = ["foundrySpell"];

	async _pDoTestEntity ({filePath, fileState, ent, prop, propPrefixed}) {
		this._testFoundryActivities(filePath, ent);
	}
}
