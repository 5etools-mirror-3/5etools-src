import {Command} from "commander";
import {getCliJsonFiles, mutCommanderJsonFileOptions} from "../util-commander.js";
import {prettifyFile} from "./util-prettify-data.js";

const FILE_BLOCKLIST = new Set([
	"data/loot.json",
	"data/msbcr.json",
	"data/monsterfeatures.json",
	"data/index.json",
	"data/life.json",
	"data/makecards.json",
	"data/renderdemo.json",
	"data/sources.json",
	"data/changelog.json",

	"data/adventure/index.json",
	"data/adventure/fluff-index.json",
	"data/book/index.json",
	"data/book/fluff-index.json",
	"data/bestiary/index.json",
	"data/bestiary/fluff-index.json",
	"data/class/index.json",
	"data/class/fluff-index.json",
	"data/spells/index.json",
	"data/spells/fluff-index.json",

	"data/generated/index-meta.json",
	"data/generated/index-props.json",
	"data/generated/index-sources.json",
	"data/generated/index-timestamps.json",

	"package.json",
	"package-lock.json",
]);

const program = mutCommanderJsonFileOptions({command: new Command()})
	.option("--no-sort", `If arrays in the root should not be sorted`)
;

program.parse(process.argv);
const params = program.opts();

const unhandledKeys = {};
getCliJsonFiles(
	{
		dirs: params.dir,
		files: params.file,
		convertedBy: params.convertedBy,
		author: params.author,
		filter: params.filter,
		fnIsBlocklisted: file => FILE_BLOCKLIST.has(file),
		fnMutDefaultSelection: ({dirs}) => dirs.push("./data"),
	},
)
	.map(jsonFile => jsonFile.getFilePath())
	.filter(file => file.endsWith(".json"))
	.forEach(file => prettifyFile(file, {unhandledKeys, isNoSortRootArrays: !params.sort}));

if (Object.keys(unhandledKeys).length) {
	console.warn(`Unhandled keys:`);
	Object.keys(unhandledKeys)
		.forEach(prop => console.warn(`\t${prop}`));
}

console.log("Prettifying complete.");
