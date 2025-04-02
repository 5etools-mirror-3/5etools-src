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

export class IgnoredKey {
	constructor (key) {
		this.key = key;
	}
}
