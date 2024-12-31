import "../js/parser.js";
import "../js/utils.js";
import "../js/render.js";
import "../js/render-dice.js";
import "../js/utils-dataloader.js";
import "../js/hist.js";
import "../js/utils-config.js";
import {Command} from "commander";
import {getAllJson} from "./util-json-files.js";
import {listJsonFiles, writeJsonSync} from "5etools-utils/lib/UtilFs.js";
import * as ut from "./util.js";
import {FoundryDataMigrator, UNHANDLED_KEYS} from "../js/foundry/foundry-migrate-data.js";

const isSiteFoundryFile = filename => /\/foundry(?:-[^/]+)?\.json$/.test(filename);

const program = new Command()
	.option("--file <file...>", `Input files`)
	.option("--dir <dir...>", `Input directories`)
;

program.parse(process.argv);
const params = program.opts();

const dirs = [...(params.dir || [])];
const files = [...(params.file || [])];

// If no options specified, use default selection
if (!dirs.length && !files.length) {
	files.push(
		...listJsonFiles("data")
			.filter(filename => isSiteFoundryFile(filename)),
	);
}

async function main () {
	ut.patchLoadJson();

	console.log(`Running Foundry data migration...`);

	await getAllJson({dirs, files})
		.pSerialAwaitMap(async ({path, json}) => {
			const isPrefixProps = isSiteFoundryFile(path);

			const foundryMigrator = new FoundryDataMigrator({json, isPrefixProps});

			await foundryMigrator.pMutMigrate();

			writeJsonSync(path, json, {isClean: true});

			console.log(`\tMigrated "${path}"...`);
		});

	if (UNHANDLED_KEYS.size) {
		console.warn(
			`Unhandled keys:\n${[...UNHANDLED_KEYS]
				.sort(SortUtil.ascSortLower)
				.map(k => `\t${k}`)
				.join("\n")}`,
		);
	}

	console.log(`Foundry data migration complete.`);

	ut.unpatchLoadJson();
}

main()
	.then(null);
