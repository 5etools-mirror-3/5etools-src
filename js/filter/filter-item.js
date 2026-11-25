// TODO(Future) revisit uses of `copy` vs `copyFast` now that we use plain objects
export class FilterItemRegistry {
	static _REGISTRY = {};

	static register (ClazzFilterItem) {
		if (!ClazzFilterItem.TYPE) throw new Error(`Filter item class "${ClazzFilterItem.name}" has no type!`);
		if (this._REGISTRY[ClazzFilterItem.TYPE]) throw new Error(`Duplicate filter item type "${ClazzFilterItem.TYPE}"!`);

		this._REGISTRY[ClazzFilterItem.TYPE] = ClazzFilterItem;
		return ClazzFilterItem;
	}

	static isSerialized (serialized) {
		return serialized != null
			&& typeof serialized === "object"
			&& serialized.type != null
			&& serialized.item != null;
	}

	static getDeserialized (serialized) {
		if (!this.isSerialized(serialized)) throw new Error(`Invalid serialized filter item!`);
		if (!this._REGISTRY[serialized.type]) throw new Error(`Unknown filter item type "${serialized.type}"!`);

		return new this._REGISTRY[serialized.type](serialized);
	}
}

/**
 * @abstract
 */
export class FilterItemBase {
	static TYPE;

	getSerialized () { throw new Error("Unimplemented!"); }
}

export class FilterItem extends FilterItemBase {
	static TYPE = "generic";

	/**
	 * An alternative to string `Filter.items` with a change-handling function
	 * @param options containing:
	 * @param options.item the item string
	 * @param [options.group] (optional) group this item belongs to.
	 * @param [options.nest] (optional) nest this item belongs to
	 * @param [options.isIgnoreRed] (optional) if this item should be ignored when negative filtering
	 */
	constructor (options) {
		super();

		this.item = options.item;
		this.group = options.group;
		this.nest = options.nest;
		this.isIgnoreRed = options.isIgnoreRed;

		this.rendered = null;
		this.searchText = null;
	}

	getSerialized () {
		return {
			type: this.constructor.TYPE,

			item: this.item,
			group: this.group,
			nest: this.nest,
			isIgnoreRed: this.isIgnoreRed,
		};
	}

	static {
		FilterItemRegistry.register(this);
	}
}

export class FilterItemClassSubclass extends FilterItem {
	static TYPE = "classSubclass";

	constructor (options) {
		super(options);

		this.equivalentClassName = options.equivalentClassName;
		this.definedInSource = options.definedInSource;
	}

	getSerialized () {
		return Object.assign(
			super.getSerialized(),
			{
				equivalentClassName: this.equivalentClassName,
				definedInSource: this.definedInSource,
			},
		);
	}

	static {
		FilterItemRegistry.register(this);
	}
}
