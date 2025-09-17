import {EntityFileHandlerBase} from "./test-tags-entity-file-base.js";

export class EntityFileHandlerLoot extends EntityFileHandlerBase {
	_props = ["magicItems"];

	_handleItemReference ({filePath, itmRef}) {
		const toCheck = DataUtil.proxy.unpackUid("item", itmRef, "item");
		const url = `${Renderer.tag.getPage("item")}#${UrlUtil.encodeForHash([toCheck.name, toCheck.source])}`.toLowerCase().trim();
		if (!this._tagTestUrlLookup.hasUrl(url)) this._addMessage(`Missing link: ${JSON.stringify(itmRef)} in file "${filePath}" (evaluates to "${url}")\n${this._tagTestUrlLookup.getLogPtSimilarUrls({url})}`);
	}

	async _pDoTestEntity ({filePath, fileState, ent, prop, propPrefixed}) {
		if (prop !== "magicItems") throw new Error(`Unexpected prop "${prop}"!`);

		if (!ent.table) return;

		ent.table
			.forEach(row => {
				if (row.choose) {
					if (row.choose.fromGeneric) {
						row.choose.fromGeneric.forEach(itmRef => this._handleItemReference({filePath, itmRef}));
					}

					if (row.choose.fromGroup) {
						row.choose.fromGroup.forEach(itmRef => this._handleItemReference({filePath, itmRef}));
					}

					if (row.choose.fromItems) {
						row.choose.fromItems.forEach(itmRef => this._handleItemReference({filePath, itmRef}));
					}
				}
			});
	}
}
