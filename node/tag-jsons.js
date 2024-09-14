import {Command} from "commander";
import "../js/parser.js";
import "../js/utils.js";
import "../js/utils-dataloader.js";
import "../js/utils-config.js";
import "../js/render.js";
import "../js/render-dice.js";
import {setUp, loadSpells, run, teardown} from "./util-tag-jsons.js";
import {TagJsons} from "../js/converter/converterutils-entries.js";

const program = new Command()
	.option("--file [file]", `Path to a file (e.g. "./data/my-file.json")`)
	.option("--file-prefix [filePrefix]", `Partial path to one or more files (e.g. "./data/dir/")`)
	.option("--dir [dir]", `Root directory (e.g. "./other/dir/")`)
	.option("--inplace", `If the tagging should be done in-place`)
	.option("--bestiary-file [bestiaryFile]", `A linked bestiary JSON to use when producing named creature tags (e.g. "./data/my-file.json")`)
	.option("--style-hint", `A hint for converters with multiple input style options`)
	.option("--strict", `If only strict/caps taggers should be used`)
;

program.parse(process.argv);
const params = program.opts();

async function main () {
	setUp();
	await TagJsons.pInit({
		spells: loadSpells(),
	});
	run({
		file: params.file,
		filePrefix: params.filePrefix,
		dir: params.dir,
		inplace: params.inplace,
		bestiaryFile: params.bestiaryFile,
		styleHint: params.styleHint,
		strict: params.strict,
	});
	teardown();
	console.log("Run complete.");
}

await main();
