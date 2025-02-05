import {ESLint} from "eslint";
import simpleGit from "simple-git";
import fs from "fs";

/**
 * @see https://eslint.org/docs/latest/integrate/nodejs-api
 */
const pDoLint = async () => {
	const fileList = [
		...(await simpleGit().diffSummary()).files
			.map(file => file.file),

		...(
			await Promise.all(
				[
					"node_",
				]
					.map(async altDir => {
						return fs.existsSync(altDir)
							? (await simpleGit(altDir).diffSummary()).files
								.map(file => `${altDir}/${file.file}`)
							: [];
					}),
			)
		)
			.flat(),
	]
		.filter(file => /\.(js|cjs|mjs)$/.test(file));

	if (!fileList.length) return console.warn(`Nothing to lint!`);

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
