import "../js/parser.js";
import "../js/utils.js";
import "../js/render.js";
import "../js/render-dice.js";
import "../js/utils-dataloader.js";
import "../js/hist.js";
import "../js/utils-config.js";
import {Command} from "commander";
import {listJsonFiles, writeJsonSync} from "5etools-utils/lib/UtilFs.js";
import * as ut from "./util.js";
import {FoundryDataMigrator, UNHANDLED_KEYS} from "../js/foundry/foundry-migrate-data.js";
import {isSiteFoundryFile} from "./util.js";
import {getCliJsonFiles, mutCommanderJsonFileOptions} from "./util-commander.js";

const program = mutCommanderJsonFileOptions({command: new Command()})
	.option("--prefix-props", `If properties should be prefixed with "foundry". For example, if all properties in all files are of the form "spell" instead of "foundrySpell", this must be used.`);

program.parse(process.argv);
const params = program.opts();

async function main () {
	ut.patchLoadJson();

	console.log(`Running Foundry data migration...`);

	await getCliJsonFiles(
		{
			dirs: params.dir,
			files: params.file,
			convertedBy: params.convertedBy,
			filter: params.filter,
			fnMutDefaultSelection: ({files}) => {
				files.push(
					...listJsonFiles("data")
						.filter(filename => isSiteFoundryFile(filename)),
				);
			},
		},
	)
		.pSerialAwaitMap(async jsonFile => {
			const path = jsonFile.getFilePath();
			const json = jsonFile.getContents();

			const isPrefixProps = params.prefixProps || isSiteFoundryFile(path);

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
