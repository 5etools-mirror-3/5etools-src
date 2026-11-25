import {
	ESLINT_CONFIG_BASE,
	ESLINT_CONFIG_BROWSER,
	ESLINT_CONFIG_JEST,
	ESLINT_CONFIG_NODE,
	ESLINT_CONFIG_NO_CONSOLE,
	ESLINT_CONFIG_VETOOLS,
} from "5etools-utils/eslint/eslint-config.js";
import {CONFIG_IGNORES} from "./test/eslint/eslint-config.js";

export default [
	...ESLINT_CONFIG_BASE,
	ESLINT_CONFIG_BROWSER,
	ESLINT_CONFIG_VETOOLS,
	{
		...ESLINT_CONFIG_NODE,
		files: [
			"build/**/*.js",
			"node/**/*.js",
			"test/**/*.js",
		],
	},
	{
		...ESLINT_CONFIG_JEST,
		files: ["test/**/*.js"],
	},
	ESLINT_CONFIG_NO_CONSOLE,
	CONFIG_IGNORES,
];
