import {EntityFileHandlerBase} from "./test-tags-entity-file-base.js";

export class EntityFileHandlerItems extends EntityFileHandlerBase {
	_props = [
		"baseitem",
		"item",
		"itemGroup",
		"magicvariant",
	];

	/**
	 * @param file
	 * @param name
	 * @param source
	 * @param arr
	 * @param prop
	 * @param tag
	 * @param {?string} propEntity
	 */
	_checkArrayDuplicates ({file, name, source, arr, prop, tag, propEntity = null}) {
		const asUrls = arr
			.map(it => {
				if (it.item) it = it.item;
				if (it.uid) it = it.uid;
				if (it.special) return null;

				return this._tagTestUrlLookup.getEncodedProxy(it, tag, propEntity);
			})
			.filter(Boolean);

		if (asUrls.length !== new Set(asUrls).size) {
			this._addMessage(`Duplicate ${prop} in ${file} for ${source}, ${name}: ${asUrls.filter(s => asUrls.filter(it => it === s).length > 1).join(", ")}\n`);
		}
	}

	/**
	 * @param file
	 * @param name
	 * @param source
	 * @param arr
	 * @param prop
	 * @param tag
	 * @param {?string} propEntity
	 */
	_checkArrayItemsExist ({file, name, source, arr, prop, tag, propEntity = null}) {
		arr.forEach(it => {
			if (it.item) it = it.item;
			if (it.uid) it = it.uid;
			if (it.special) return;

			if (tag === "spell") it = this._getCleanSpellUid(it);

			const url = this._tagTestUrlLookup.getEncodedProxy(it, tag, propEntity);
			if (!this._tagTestUrlLookup.hasUrl(url)) this._addMessage(`Missing link: ${it} in file ${file} (evaluates to "${url}") in "${prop}"\n${this._tagTestUrlLookup.getLogPtSimilarUrls({url})}`);
		});
	}

	_checkReqAttuneTags (file, root, name, source, prop) {
		const tagsArray = root[prop];

		tagsArray.forEach(tagBlock => {
			Object.entries(tagBlock)
				.forEach(([prop, val]) => {
					switch (prop) {
						case "background":
						case "race":
						case "class": {
							const url = this._tagTestUrlLookup.getEncodedProxy(val, prop);
							if (!this._tagTestUrlLookup.hasUrl(url)) this._addMessage(`Missing link: ${val} in file ${file} "${prop}" (evaluates to "${url}")\n${this._tagTestUrlLookup.getLogPtSimilarUrls({url})}`);
						}
					}
				});
		});
	}

	_checkRoot (file, root, name, source) {
		if (!root) return;

		this._testSrd(file, root);

		if (root.attachedSpells) {
			this._checkArrayItemsExist({file, name, source, arr: Renderer.item.getFlatAttachedSpells(root), prop: "attachedSpells", tag: "spell"});
		}

		if (root.classFeatures) {
			this._checkArrayDuplicates({file, name, source, arr: root.classFeatures, prop: "classFeatures", tag: "classFeature", propEntity: "classFeature"});
			this._checkArrayItemsExist({file, name, source, arr: root.classFeatures, prop: "classFeatures", tag: "classFeature", propEntity: "classFeature"});
		}

		if (root.optionalfeatures) {
			this._checkArrayDuplicates({file, name, source, arr: root.optionalfeatures, prop: "optionalfeatures", tag: "optfeature", propEntity: "optionalfeature"});
			this._checkArrayItemsExist({file, name, source, arr: root.optionalfeatures, prop: "optionalfeatures", tag: "optfeature", propEntity: "optionalfeature"});
		}

		if (root.items) {
			this._checkArrayDuplicates({file, name, source, arr: root.items, prop: "items", tag: "item"});
			this._checkArrayItemsExist({file, name, source, arr: root.items, prop: "items", tag: "item"});
		}

		if (root.packContents) {
			this._checkArrayDuplicates({file, name, source, arr: root.packContents, prop: "packContents", tag: "item"});
			this._checkArrayItemsExist({file, name, source, arr: root.packContents, prop: "packContents", tag: "item"});
		}

		if (root.containerCapacity && root.containerCapacity.item) {
			root.containerCapacity.item.forEach(itemToCount => {
				this._checkArrayItemsExist({file, name, source, arr: Object.keys(itemToCount), prop: "containerCapacity", tag: "item"});
			});
		}

		if (root.ammoType) {
			this._checkArrayItemsExist({file, name, source, arr: [root.ammoType], prop: "ammoType", tag: "item"});
		}

		if (root.baseItem) {
			const url = `${Renderer.tag.getPage("item")}#${UrlUtil.encodeForHash(root.baseItem.split("|"))}`
				.toLowerCase()
				.trim()
				.replace(/%5c/gi, "");

			if (!this._tagTestUrlLookup.hasUrl(url)) {
				this._addMessage(`Missing link: ${root.baseItem} in file ${file} (evaluates to "${url}")\n${this._tagTestUrlLookup.getLogPtSimilarUrls({url})}`);
			}
		}

		this._doCheckSeeAlso({entity: root, prop: "seeAlsoDeck", tag: "deck", file});
		this._doCheckSeeAlso({entity: root, prop: "seeAlsoVehicle", tag: "vehicle", file});

		if (root.reqAttuneTags) this._checkReqAttuneTags(file, root, name, source, "reqAttuneTags");
		if (root.reqAttuneAltTags) this._checkReqAttuneTags(file, root, name, source, "reqAttuneAltTags");

		if (root.mastery) {
			this._checkArrayDuplicates({file, name, source, arr: root.mastery, prop: "mastery", tag: "itemMastery"});
			this._checkArrayItemsExist({file, name, source, arr: root.mastery, prop: "mastery", tag: "itemMastery"});
		}

		if (root.lootTables) {
			this._checkArrayItemsExist({file, name, source, arr: root.lootTables, prop: "lootTables", tag: "table"});
		}
	}

	async _pDoTestEntity ({filePath, fileState, ent, prop, propPrefixed}) {
		const source = SourceUtil.getEntitySource(ent);

		this._checkRoot(filePath, ent, ent.name, source);
		if (ent.inherits) this._checkRoot(filePath, ent.inherits, `${ent.name} (inherits)`, source);
	}
}
