"use strict";

class GenUtil {
	/**
	 * @param table An array of objects with a `min` and optional `max` per item.
	 * @param roll The roll to look up.
	 * @param maxZero A value to convert `max` values of `0` to.
	 */
	static getFromTable (table, roll, maxZero = 100) {
		const it = {};
		Object.assign(it, table.find(it => {
			return it.min === roll || (it.max != null && roll >= it.min && roll <= (it.max === 0 ? maxZero : it.max));
		}));
		Object.keys(it).forEach(k => {
			if (typeof it[k] === "function") {
				it[k] = it[k]();
			}
		});
		if (it.display && !it.result) it.result = it.display;
		if (it.display) it.display = Renderer.get().render(it.display);
		if (it.result) it.result = Renderer.get().render(it.result);
		return it;
	}
}
