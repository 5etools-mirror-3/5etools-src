// TODO(Future) refactor to set only plain objects as `_f ...` props to better enable `copyFast`
// TODO see also: AbilityScoreFilter.FilterItem
export class FilterItem {
	/**
	 * An alternative to string `Filter.items` with a change-handling function
	 * @param options containing:
	 * @param options.item the item string
	 * @param [options.group] (optional) group this item belongs to.
	 * @param [options.nest] (optional) nest this item belongs to
	 * @param [options.isIgnoreRed] (optional) if this item should be ignored when negative filtering
	 */
	constructor (options) {
		this.item = options.item;
		this.group = options.group;
		this.nest = options.nest;
		this.isIgnoreRed = options.isIgnoreRed;

		this.rendered = null;
		this.searchText = null;
	}
}

export class FilterItemClassSubclass extends FilterItem {
	constructor (options) {
		super(options);

		this.equivalentClassName = options.equivalentClassName;
		this.definedInSource = options.definedInSource;
	}
}
