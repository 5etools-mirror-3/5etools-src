import {
	ESLINT_CONFIG_BASE,
	ESLINT_CONFIG_JEST,
	ESLINT_CONFIG_NODE,
	ESLINT_CONFIG_VETOOLS,
} from "5etools-utils/eslint/eslint-config.js";
import {CONFIG_IGNORES} from "./eslint/eslint-config.js";

export default [
	...ESLINT_CONFIG_BASE,
	ESLINT_CONFIG_NODE,
	ESLINT_CONFIG_JEST,
	ESLINT_CONFIG_VETOOLS,
	CONFIG_IGNORES,
];
