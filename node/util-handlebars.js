import Handlebars from "handlebars";

export class UtilHandlebars {
	static _COMPARE_OPERATORS = {
		// eslint-disable-next-line eqeqeq
		"==": (l, r) => l == r,
		"===": (l, r) => l === r,
		// eslint-disable-next-line eqeqeq
		"!=": (l, r) => l != r,
		"!==": (l, r) => l !== r,
		"<": (l, r) => l < r,
		">": (l, r) => l > r,
		"<=": (l, r) => l <= r,
		">=": (l, r) => l >= r,
		// eslint-disable-next-line valid-typeof
		"typeof": (l, r) => typeof l === `${r}`,
	};

	static init () {
		Handlebars.registerHelper("decodeUriComponent", (inputData) => decodeURIComponent(inputData));
		Handlebars.registerHelper("toLowerCase", str => str.toLowerCase());
		Handlebars.registerHelper("toUpperCase", str => str.toUpperCase());
		Handlebars.registerHelper("join", (data, joiner) => data.join(joiner));
		Handlebars.registerHelper("Parser_spellLevelToFull", level => Parser.spLevelToFull(level));
		Handlebars.registerHelper("Parser_getOrdinalForm", i => Parser.getOrdinalForm(i));

		/**
		 * Usage: ```
		 * {{#compare unicorns ponies operator="<"}}
		 * I knew it, unicorns are just low-quality ponies!
		 * {{/compare}}
		 * ```
		 * @link Source: http://doginthehat.com.au/2012/02/comparison-block-helper-for-handlebars-templates/
		 */
		Handlebars.registerHelper("compare", function (lvalue, rvalue, options) {
			if (arguments.length < 3) throw new Error(`Handlebars Helper "compare" needs 2 parameters`);

			const operator = options.hash.operator || "==";

			if (!UtilHandlebars._COMPARE_OPERATORS[operator]) throw new Error(`Handlebars Helper "compare" unknown operator: "${operator}"`);

			if (UtilHandlebars._COMPARE_OPERATORS[operator](lvalue, rvalue)) return options.fn(this);
			else return options.inverse(this);
		});

		Handlebars.registerHelper({
			eq: (v1, v2) => v1 === v2,
			ne: (v1, v2) => v1 !== v2,
			lt: (v1, v2) => v1 < v2,
			gt: (v1, v2) => v1 > v2,
			lte: (v1, v2) => v1 <= v2,
			gte: (v1, v2) => v1 >= v2,
			not: pred => !pred,
			and () { return Array.prototype.every.call(arguments, Boolean); },
			or () { return Array.prototype.slice.call(arguments, 0, -1).some(Boolean); },
		});
	}
}
