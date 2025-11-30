import {EntityFileHandlerBase} from "./test-tags-entity-file-base.js";

export class EntityFileHandlerBestiary extends EntityFileHandlerBase {
	_props = ["monster"];

	async _pDoTestEntity ({filePath, fileState, ent, prop, propPrefixed}) {
		this._testReprintedAs(filePath, ent, "creature");
		this._testSrd(filePath, ent);

		if (ent.legendaryGroup) {
			const url = this._tagTestUrlLookup.getEncodedProxy(`${ent.legendaryGroup.name}|${ent.legendaryGroup.source}`, "legendaryGroup");
			if (!this._tagTestUrlLookup.hasUrl(url)) this._addMessage(`Missing link: ${ent.legendaryGroup.name}|${ent.legendaryGroup.source} in file ${filePath} "legendaryGroup" (evaluates to "${url}")\n${this._tagTestUrlLookup.getLogPtSimilarUrls({url})}`);
		}

		if (ent.summonedBySpell) {
			const url = this._tagTestUrlLookup.getEncodedProxy(ent.summonedBySpell, "spell");
			if (!this._tagTestUrlLookup.hasUrl(url)) this._addMessage(`Missing link: ${ent.summonedBySpell} in file ${filePath} "summonedBySpell" (evaluates to "${url}")\n${this._tagTestUrlLookup.getLogPtSimilarUrls({url})}`);
		}

		if (ent.attachedItems) {
			ent.attachedItems.forEach(s => {
				const url = this._tagTestUrlLookup.getEncodedProxy(s, "item");
				if (!this._tagTestUrlLookup.hasUrl(url)) this._addMessage(`Missing link: ${s} in file ${filePath} (evaluates to "${url}") in "attachedItems"\n${this._tagTestUrlLookup.getLogPtSimilarUrls({url})}`);
			});
		}

		if (ent.gear) {
			ent.gear.forEach(ref => {
				const uid = ref.item || ref;
				const url = this._tagTestUrlLookup.getEncodedProxy(uid, "item", "item");
				if (!this._tagTestUrlLookup.hasUrl(url)) this._addMessage(`Missing link: ${uid} in file ${filePath} (evaluates to "${url}") in "gear"\n${this._tagTestUrlLookup.getLogPtSimilarUrls({url})}`);
			});
		}
	}
}
