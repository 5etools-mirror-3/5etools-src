export class GenUtil {
	/**
	 * @param table An array of objects with a `min` and optional `max` per item.
	 * @param roll The roll to look up.
	 * @param maxZero A value to convert `max` values of `0` to.
	 */
	static getFromTable (table, roll, maxZero = 100) {
		const out = {};
		Object.assign(out, table.find(it => {
			return it.min === roll || (it.max != null && roll >= it.min && roll <= (it.max === 0 ? maxZero : it.max));
		}));
		[
			"result",
			"age",
			"events",
		]
			.filter(prop => typeof out[prop] === "function")
			.forEach(prop => out[prop] = out[prop]());
		if (out.display && !out.result) out.result = out.display;
		if (out.display) out.display = Renderer.get().render(out.display);
		if (out.result) out.result = Renderer.get().render(out.result);
		return out;
	}
}
