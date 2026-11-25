import {getFnRootPropListSort} from "./utils-proporder-sort.js";

export class ObjectKey {
	/**
	 * @param key
	 * @param [opts] Options object.
	 * @param [opts.fnGetOrder] Function which gets the ordering to apply to objects with this key.
	 * @param [opts.fnGetObjectOrderProp] Function which takes an object and returns a property it should be order'd by.
	 * @param [opts.order] Ordering to apply to objects with this key.
	 * @param [opts.isRecursive] If this object has a recursive structure (e.g. entries).
	 */
	constructor (key, opts) {
		opts = opts || {};

		if (
			[
				opts.fnGetOrder,
				opts.fnGetObjectOrderProp,
				opts.order,
			]
				.filter(Boolean).length > 1
		) throw new Error(`At most one of "fnGetOrder", "fnGetObjectOrderProp", and "order" may be provided!`);

		this.key = key;
		this.fnGetOrder = opts.fnGetOrder;
		this.fnGetObjectOrderProp = opts.fnGetObjectOrderProp;
		this.order = opts.order;
		this.isRecursive = opts.isRecursive;
	}

	getForProp (prop) {
		return new this.constructor(prop, this);
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
				this.getCopyModKey({fnGetModOrder}),
				"_preserve",
			],
		});
	}

	/**
	 * Avoid applying ordering to `_mod` objects beyond top-level prop sort, as objects here have different meanings.
	 */
	static getCopyModKey ({fnGetModOrder}) {
		return new this("_mod", {
			fnGetOrder: obj => fnGetModOrder(obj)
				.map(keyInfo => typeof keyInfo === "string" ? keyInfo : keyInfo.key),
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
	 * @param [opts.isRecursive] If this array has a recursive structure  (e.g. entries).
	 */
	constructor (key, opts) {
		opts = opts || {};

		this.key = key;
		this.fnGetOrder = opts.fnGetOrder;
		this.order = opts.order;
		this.fnSort = opts.fnSort;
		this.isRecursive = opts.isRecursive;
	}

	getForProp (prop) {
		return new this.constructor(prop, this);
	}

	static getRootKey (propToList, prop) {
		return this.getRootKeyCustom(
			prop,
			{
				fnGetOrder: () => propToList[prop],
			},
		);
	}

	static getRootKeyCustom (prop, opts) {
		return new this(
			prop,
			{
				...opts,
				fnSort: getFnRootPropListSort(prop, {isRequired: true}),
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
