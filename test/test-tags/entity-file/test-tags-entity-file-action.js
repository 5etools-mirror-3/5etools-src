import {EntityFileHandlerBase} from "./test-tags-entity-file-base.js";

export class EntityFileHandlerAction extends EntityFileHandlerBase {
	_props = ["action"];

	async _pDoTestEntity ({filePath, fileState, ent, prop, propPrefixed}) {
		if (ent.fromVariant) {
			const url = this._tagTestUrlLookup.getEncodedProxy(ent.fromVariant, "variantrule", "variantrule");
			if (!this._tagTestUrlLookup.hasUrl(url)) this._addMessage(`Missing link: ${ent.fromVariant} in filePath ${filePath} (evaluates to "${url}")\n${this._tagTestUrlLookup.getLogPtSimilarUrls({url})}`);
		}

		this._doCheckSeeAlso({entity: ent, prop: "seeAlsoAction", tag: "action", filePath});

		this._testReprintedAs(filePath, ent, "action");
		this._testSrd(filePath, ent);
	}
}
