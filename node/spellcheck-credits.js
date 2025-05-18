import {loadConfig, spellCheckDocument} from "cspell-lib";
import {readJsonSync, writeJsonSync} from "5etools-utils/lib/UtilFs.js";
import "../js/parser.js";
import "../js/utils.js";
import {pathToFileURL} from "url";
import {resolve} from "path";
import fs from "fs";

const _CHAR_RED = "\x1b[31m";
const _CHAR_YELLOW = "\x1b[33m";
const _CHAR_DIM = "\x1b[2m";
const _CHAR_RESET = "\x1b[0m";

const getJson = () => {
	const walker = MiscUtil.getWalker({isNoModification: true});
	const jsonCredits = [];

	[
		{prop: "adventure"},
		{prop: "book"},
	]
		.forEach(({prop}) => {
			readJsonSync(`./data/${prop}s.json`)[prop]
				.forEach(header => {
					const fileJson = readJsonSync(`./data/${prop}/${prop}-${header.id.toLowerCase()}.json`);
					walker.walk(fileJson, {object: obj => {
						if (obj.name !== "Credits") return;
						jsonCredits.push(obj);
					}});
				});
		});

	console.log(`Found ${jsonCredits.length} "Credits" entries...`);
	return jsonCredits;
};

// TODO(Future) this is a hack; instead consider how to:
//   - parse JSON while maintaining line numbers/character offsets; match these with spellcheck results, or
//   - usefully validate spelling in-memory (see e.g. `validateText`)
//   - factor back into `spellcheck.js` as optional mode
const pMain = async () => {
	await MiscUtil.pDelay(200); // Allow IntelliJ logging to warm up

	// Preload config
	const config = await loadConfig("cspell.json");

	const tmpFile = "spellcheck/spellcheck-credits-temp.json";
	writeJsonSync(tmpFile, getJson(), {isClean: true});

	const uri = pathToFileURL(resolve(tmpFile)).toString();

	const result = await spellCheckDocument(
		{ uri },
		{ generateSuggestions: true, noConfigSearch: true },
		config,
	);

	const spellingErrors = [];
	result.issues
		.forEach(issue => {
			console.log(`${_CHAR_RED}${issue.text}${_CHAR_RESET}\t-- ${_CHAR_DIM}${issue.line.text.trim()}${_CHAR_RESET}`);
			spellingErrors.push(issue.text);
			if (issue.suggestions?.length) {
				console.log(`\tSuggestions: ${_CHAR_YELLOW}${issue.suggestions.join(", ")}${_CHAR_RESET}`);
			}
		});

	const filenameOut = "spellcheck/credits-words.txt";
	spellingErrors
		.sort(SortUtil.ascSortLower);
	fs.writeFileSync(filenameOut, spellingErrors.join("\n"), "utf-8");
	console.log(`Found ${result.issues.length}; wrote words to "${filenameOut}".`);
};

await pMain();
