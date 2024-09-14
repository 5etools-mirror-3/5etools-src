import {Command} from "commander";
import {prettifyFile, prettifyFolder} from "./util-prettify-data.js";

const program = new Command()
	.option("--file <file>", `Input file`)
	.option("--dir <dir>", `Input directory`, "./data")
	.option("--no-sort", `If arrays in the root should not be sorted`)
;

program.parse(process.argv);
const params = program.opts();

if (params.file) prettifyFile(params.file, {isNoSortRootArrays: !params.sort});
else prettifyFolder(params.dir, {isNoSortRootArrays: !params.sort});
console.log("Prettifying complete.");
