import {EntityFileHandlerBase} from "./test-tags-entity-file-base.js";

export class EntityFileHandlerDeck extends EntityFileHandlerBase {
	_props = ["deck"];

	async _pDoTestEntity ({filePath, fileState, ent, prop, propPrefixed}) {
		this._testSrd(filePath, ent);

		(ent.cards || [])
			.forEach(cardMeta => {
				const uid = typeof cardMeta === "string" ? cardMeta : cardMeta.uid;
				const unpacked = DataUtil.deck.unpackUidCard(uid, {isLower: true});
				const hash = UrlUtil.URL_TO_HASH_BUILDER["card"](unpacked);
				const url = `card#${hash}`.toLowerCase().trim();
				if (!this._tagTestUrlLookup.hasUrl(url)) this._addMessage(`Missing link: ${uid} in file ${filePath} (evaluates to "${url}") in "cards"\n${this._tagTestUrlLookup.getLogPtSimilarUrls({url})}`);
			});
	}
}
