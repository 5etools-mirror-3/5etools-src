import {Command} from "commander";
import {loadConfig, spellCheckDocument} from "cspell-lib";
import {pathToFileURL} from "url";
import {resolve} from "path";
import {listJsonFiles} from "5etools-utils/lib/UtilFs.js";
import "../js/parser.js";
import "../js/utils.js";
import {pGetModifiedFiles} from "./util-git.js";

const _CHAR_RED = "\x1b[31m";
const _CHAR_YELLOW = "\x1b[33m";
const _CHAR_DIM = "\x1b[2m";
const _CHAR_RESET = "\x1b[0m";

const program = new Command()
	.option("--fast", `If only changed files should be spellchecked`)
	.option("--file [file]", `Path to a file (e.g. "./data/my-file.json")`)
	.option("--dir [dir]", `Root directory (e.g. "./other/dir/")`)
;

program.parse(process.argv);
const params = program.opts();

const pGetFileList = async () => {
	if (params.fast) {
		return (await pGetModifiedFiles())
			.filter(file => /\.(json)$/.test(file));
	}

	if (params.file) return [params.file];

	return listJsonFiles(
		params.dir || "data",
		{
			dirBlocklist: new Set([
				"data/generated",
			]),
		},
	);
};

const pMain = async () => {
	await MiscUtil.pDelay(200); // Allow IntelliJ logging to warm up

	// Preload config
	const config = await loadConfig("cspell.json");

	const files = await pGetFileList();
	if (!files.length) {
		console.error(`No files found!`);
		return;
	}

	for (const file of files) {
		const uri = pathToFileURL(resolve(file)).toString();

		const result = await spellCheckDocument(
			{ uri },
			{ generateSuggestions: true, noConfigSearch: true },
			config,
		);

		result.issues
			.forEach(issue => {
				const ptLineNumber = issue.line.position.line + 1;
				const ptLineChar = issue.offset - issue.line.offset + 1;

				console.log(`${file}:${ptLineNumber}:${ptLineChar} --\t${_CHAR_RED}${issue.text}${_CHAR_RESET}\t-- ${_CHAR_DIM}${issue.line.text.trim()}${_CHAR_RESET}`);
				if (issue.suggestions?.length) {
					console.log(`\tSuggestions: ${_CHAR_YELLOW}${issue.suggestions.join(", ")}${_CHAR_RESET}`);
				}
			});

		if (result.issues.length) console.log(`\n---\n`);
	}
};

await pMain();
