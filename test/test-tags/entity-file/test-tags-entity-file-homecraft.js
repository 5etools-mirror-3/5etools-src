import {EntityFileHandlerBase} from "./test-tags-entity-file-base.js";

export class EntityFileHandlerHomeCrafts extends EntityFileHandlerBase {
	_props = ["crochetPattern"];

	async _pDoTestEntity ({filePath, fileState, ent, prop, propPrefixed}) {
		this._testReprintedAs(filePath, ent, "variantrule");
		this._testSrd(filePath, ent);

		this._doCheckSeeAlso({entity: ent, prop: "seeAlsoCreature", tag: "creature", file: filePath});
		this._doCheckSeeAlso({entity: ent, prop: "seeAlsoItem", tag: "item", file: filePath});
	}
}
