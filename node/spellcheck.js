import {Command, Option} from "commander";
import {loadConfig, spellCheckDocument} from "cspell-lib";
import {pathToFileURL} from "url";
import {basename, resolve} from "path";
import {listJsonFiles, readJsonSync} from "5etools-utils/lib/UtilFs.js";
import fs from "fs";
import "../js/parser.js";
import "../js/utils.js";
import {pGetModifiedFiles} from "./util-git.js";
import {BLOCKLIST_SOURCES_CREDITS} from "./consts-credits.js";

const _CHAR_RED = "\x1b[31m";
const _CHAR_YELLOW = "\x1b[33m";
const _CHAR_DIM = "\x1b[2m";
const _CHAR_RESET = "\x1b[0m";

const _TRUST_AS_TO_PATH = {
	"artists": "spellcheck/artist-names.txt",
	"dnd": "spellcheck/dnd-words.txt",
	"credits": "spellcheck/credits-names.txt",
};
const program = new Command()
	.option("--fast", `If only changed files should be spellchecked`)
	.option("--file [file]", `Path to a file (e.g. "./data/my-file.json")`)
	.option("--dir [dir]", `Root directory (e.g. "./other/dir/")`)
	.option("--only-artists", `Only spellcheck image and token credits`)
	.option("--only-credits", `Only spellcheck adventure/book credits`)
	.option("--trust", `Add unknown words to a local trust list`)
	.option("--succinct", `Limit logging`)
	.addOption(
		new Option(
			"--trust-as <target>",
			`Trust target: ${Object.keys(_TRUST_AS_TO_PATH).join("|")}`,
		)
			.choices(Object.keys(_TRUST_AS_TO_PATH))
			.default("dnd"),
	)
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

const getFileTextOnlyArtists = ({file}) => {
	const out = [];

	MiscUtil.getWalker({isNoModification: true, keyBlocklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLOCKLIST})
		.walk(readJsonSync(file), {object: (obj) => {
			if (obj.type === "image" && obj.credit) {
				out.push(obj.credit);
				return;
			}

			if (obj.tokenCredit) out.push(obj.tokenCredit);
		}});

	return JSON.stringify(out, null, "\t");
};

const getFileTextOnlyCredits = ({file}) => {
	const lookupCorpusMetas = {
		"adventures.json": {prop: "adventure", dir: "adventure"},
		"books.json": {prop: "book", dir: "book"},
	};

	const meta = lookupCorpusMetas[basename(file)];
	if (!meta) return JSON.stringify([], null, "\t");

	const out = [];
	(readJsonSync(file)[meta.prop] || [])
		.forEach(head => {
			if (BLOCKLIST_SOURCES_CREDITS.has(head.source)) return;

			const ixCredits = head.contents?.findIndex(it => it.name === "Credits");
			if (ixCredits == null || ixCredits < 0) return;

			const jsonAdventureBook = readJsonSync(`data/${meta.dir}/${meta.prop}-${head.id.toLowerCase()}.json`);
			const entCredits = jsonAdventureBook.data?.[ixCredits];
			if (!entCredits) return;

			out.push(entCredits);
		});

	return JSON.stringify(out, null, "\t");
};

const getFileText = ({file}) => {
	if (params.onlyArtists) return getFileTextOnlyArtists({file});
	if (params.onlyCredits) return getFileTextOnlyCredits({file});
	return undefined;
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

	const unknownWords = new Set();

	for (let ixFile = 0; ixFile < files.length; ++ixFile) {
		const file = files[ixFile];

		const uri = pathToFileURL(resolve(file)).toString();

		const result = await spellCheckDocument(
			{
				uri,
				text: getFileText({file}),
				languageId: "json",
			},
			{
				generateSuggestions: !params.succinct
					&& !params.trust
					// Disable suggestions for modes which mostly find proper nouns
					&& (!params.onlyArtists && !params.onlyCredits),
				noConfigSearch: true,
			},
			config,
		);

		result.issues
			.forEach((issue, i) => {
				if (!i) console.log("---\n");

				const ptLineNumber = issue.line.position.line + 1;
				const ptLineChar = issue.offset - issue.line.offset + 1;

				console.log(`${file}:${ptLineNumber}:${ptLineChar} --\t${_CHAR_RED}${issue.text}${_CHAR_RESET}\t-- ${_CHAR_DIM}${issue.line.text.trim()}${_CHAR_RESET}`);
				if (params.trust) unknownWords.add(issue.text);
				if (issue.suggestions?.length) {
					console.log(`\tSuggestions: ${_CHAR_YELLOW}${issue.suggestions.join(", ")}${_CHAR_RESET}`);
				}
			});

		if (result.issues.length) console.log(`\n---`);

		if (result.issues.length || (ixFile && !((ixFile + 1) % 15))) {
			const pctComplete = (((ixFile + 1) / files.length) * 100).toFixed(1);
			console.log(`${ixFile + 1}/${files.length} (${pctComplete}%) -- ${file}`);
		}
	}

	if (!params.trust) return;

	const pathWords = _TRUST_AS_TO_PATH[params.trustAs];

	const wordsExisting = fs.existsSync(pathWords)
		? fs.readFileSync(pathWords, "utf-8")
			.split("\n")
			.map(it => it.trim())
			.filter(Boolean)
		: [];
	const wordsExistingSet = new Set(wordsExisting.map(it => it.toLowerCase()));
	const toAdd = [...unknownWords]
		.filter(it => !wordsExistingSet.has(it.toLowerCase()));

	if (!toAdd.length) {
		console.log(`No new words to trust in "${pathWords}".`);
		return;
	}

	fs.writeFileSync(pathWords, [...wordsExisting, ...toAdd].sort(SortUtil.ascSortLower).join("\n"), "utf-8");
	console.log(`Added ${toAdd.length} words to "${pathWords}".`);
};

await pMain();
