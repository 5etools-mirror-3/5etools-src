import {EntityFileHandlerBase} from "./test-tags-entity-file-base.js";

export class EntityFileHandlerSpellList extends EntityFileHandlerBase {
	_props = ["spellList"];

	async _pDoTestEntity ({filePath, fileState, ent, prop, propPrefixed}) {
		this._testReprintedAs(filePath, ent, "spellList");
		this._testSrd(filePath, ent);

		(ent.spells || [])
			.forEach((spellListItem) => {
				if (typeof spellListItem === "string") {
					const url = this._tagTestUrlLookup.getEncodedProxy(spellListItem, "spell");
					if (!this._tagTestUrlLookup.hasUrl(url)) this._addMessage(`Missing link: "${spellListItem}" in file ${filePath} "spellList.spells" (evaluates to "${url}")\n${this._tagTestUrlLookup.getLogPtSimilarUrls({url})}`);
					return;
				}

				if (spellListItem.subclassName) {
					const uidSubclass = DataUtil.proxy.getUid("subclass", spellListItem, {isMaintainCase: true});
					const url = this._tagTestUrlLookup.getEncodedProxy(uidSubclass, "subclass", "subclass");
					if (!this._tagTestUrlLookup.hasUrl(url)) this._addMessage(`Missing link: subclass spell list reference ${JSON.stringify(spellListItem)} in file ${filePath} "spellList.spells" (evaluates to "${url}")\n${this._tagTestUrlLookup.getLogPtSimilarUrls({url})}`);
					return;
				}

				if (spellListItem.className) {
					const uidClass = DataUtil.proxy.getUid("class", spellListItem, {isMaintainCase: true});
					const url = this._tagTestUrlLookup.getEncodedProxy(uidClass, "class");
					if (!this._tagTestUrlLookup.hasUrl(url)) this._addMessage(`Missing link: class spell list reference ${JSON.stringify(spellListItem)} in file ${filePath} "spellList.spells" (evaluates to "${url}")\n${this._tagTestUrlLookup.getLogPtSimilarUrls({url})}`);
				}
			});
	}
}
