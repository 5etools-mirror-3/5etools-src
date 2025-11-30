import {EntityFileHandlerBase} from "./test-tags-entity-file-base.js";

export class EntityFileHandlerDeity extends EntityFileHandlerBase {
	_props = ["deity"];

	async _pDoTestEntity ({filePath, fileState, ent, prop, propPrefixed}) {
		this._testSrd(filePath, ent);

		if (!ent.customExtensionOf) return;

		const url = this._tagTestUrlLookup.getEncodedProxy(ent.customExtensionOf, "deity", "deity");
		if (!this._tagTestUrlLookup.hasUrl(url)) this._addMessage(`Missing link: ${ent.customExtensionOf} in file ${filePath} (evaluates to "${url}")\n${this._tagTestUrlLookup.getLogPtSimilarUrls({url})}`);
	}
}
