import fs from "fs";
import {ESLint} from "eslint";
import {pGetModifiedFiles} from "./util-git.js";

/**
 * @see https://eslint.org/docs/latest/integrate/nodejs-api
 */
const pDoLint = async () => {
	const fileList = (await pGetModifiedFiles({additionalRoots: ["node_"]}))
		.filter(file => /\.(js|cjs|mjs)$/.test(file) && fs.existsSync(file));

	if (!fileList.length) return console.warn(`Nothing to lint!`);

	console.log(`Linting:\n${fileList.map(it => `\t${it}`).join("\n")}`);

	const eslint = new ESLint({
		fix: true,
		flags: ["unstable_config_lookup_from_file"],
	});

	const results = await eslint.lintFiles(fileList);

	await ESLint.outputFixes(results);

	const formatter = await eslint.loadFormatter("stylish");
	const resultText = formatter.format(results);

	if (resultText) console.log(resultText);

	if (results.some(res => res.errorCount)) {
		process.exit(1);
	}
};

await pDoLint();
