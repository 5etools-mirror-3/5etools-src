import {getFnRootPropListSort} from "./utils-proporder-sort.js";

export class ObjectKey {
	/**
	 * @param key
	 * @param [opts] Options object.
	 * @param [opts.fnGetOrder] Function which gets the ordering to apply to objects with this key.
	 * Takes precedence over `.order`.
	 * @param [opts.order] Ordering to apply to objects with this key.
	 */
	constructor (key, opts) {
		opts = opts || {};

		this.key = key;
		this.fnGetOrder = opts.fnGetOrder;
		this.order = opts.order;
	}

	/**
	 * @param {?Array<string>} identKeys
	 * @param {function} fnGetModOrder
	 */
	static getCopyKey ({identKeys = null, fnGetModOrder}) {
		return new this("_copy", {
			order: [
				...(
					identKeys
					|| [
						"name",
						"source",
					]
				),
				"_templates",
				new this("_mod", {
					fnGetOrder: fnGetModOrder,
				}),
				"_preserve",
			],
		});
	}

	static getAttachedSpellFrequencyKey (key) {
		return new this(key, {
			fnGetOrder: (obj) => {
				return Object.keys(obj)
					.sort((a, b) => {
						const isEachA = a.at(-1) === "e";
						const isEachB = b.at(-1) === "e";
						if (isEachA !== isEachB) return Number(isEachA) - Number(isEachB);
						a = isEachA ? Number(a.slice(0, -1)) : Number(a);
						b = isEachB ? Number(b.slice(0, -1)) : Number(b);
						return a - b;
					})
					.map(k => new ArrayKey(k, {fnSort: SortUtil.ascSortLower}));
			},
		});
	}
}

export class ArrayKey {
	/**
	 * @param key
	 * @param [opts] Options object.
	 * @param [opts.fnGetOrder] Function which gets the ordering to apply to objects with this key.
	 * Takes precedence over `.order`.
	 * @param [opts.order] Ordering to apply to objects with this key.
	 * @param [opts.fnSort] Function to sort arrays with this key.
	 */
	constructor (key, opts) {
		opts = opts || {};

		this.key = key;
		this.fnGetOrder = opts.fnGetOrder;
		this.order = opts.order;
		this.fnSort = opts.fnSort;
	}

	static getRootKey (propToList, prop) {
		return new this(
			prop,
			{
				fnGetOrder: () => propToList[prop],
				fnSort: getFnRootPropListSort(prop),
			},
		);
	}
}

export class ObjectOrArrayKey {
	constructor ({objectKey, arrayKey}) {
		this.key = objectKey.key;
		if (arrayKey.key !== this.key) throw new Error(`Expected both "objectKey" and "arrayKey" to have the same key!`);
		this.objectKey = objectKey;
		this.arrayKey = arrayKey;
	}
}

export class IgnoredKey {
	constructor (key) {
		this.key = key;
	}
}
