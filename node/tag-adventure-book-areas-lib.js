export class AreaTagger {
	constructor (json) {
		this._json = json;

		this._maxTag = 0;
		this._existingTags = null;
	}

	_getNewTag () {
		let hexTag;
		do {
			if (this._maxTag >= 4095) throw new Error("Exhausted tags!");
			hexTag = this._maxTag.toString(16).padStart(3, "0");
			this._maxTag++;
		} while (this._existingTags.has(hexTag));
		this._existingTags.add(hexTag);
		return hexTag;
	}

	_doPopulateExistingTags () {
		const map = Renderer.adventureBook.getEntryIdLookup(this._json.data);
		this._existingTags = new Set(Object.keys(map));
	}

	_addNewTags () {
		const handlers = {
			object: (obj) => {
				Renderer.ENTRIES_WITH_CHILDREN
					.filter(meta => meta.key === "entries")
					.forEach(meta => {
						if (obj.type !== meta.type) return;
						if (!obj.id) obj.id = this._getNewTag();
					});

				if (obj.id) return obj;

				if (obj.type === "wrapper") {
					obj.id = this._getNewTag();
					return obj;
				}

				if (obj.type === "image" && (obj.mapRegions || obj.imageType === "map")) {
					obj.id = this._getNewTag();
					return obj;
				}

				if (obj.type === "list" && obj._isAddIds) {
					obj.items.forEach(itm => itm.id ||= this._getNewTag());
					delete obj._isAddIds;
					return obj;
				}

				return obj;
			},
		};

		this._json.data.forEach(chap => MiscUtil.getWalker().walk(chap, handlers));
	}

	run () {
		this._doPopulateExistingTags();
		this._addNewTags();
	}
}
