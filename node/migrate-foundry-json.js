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
import {getCliFiles} from "./util-commander.js";

const program = new Command()
	.option("--file <file...>", `Input files`)
	.option("--dir <dir...>", `Input directories`)
	.option("--prefix-props", `If properties should be prefixed with "foundry". For example, if all properties in all files are of the form "spell" instead of "foundrySpell", this must be used.`)
;

program.parse(process.argv);
const params = program.opts();

async function main () {
	ut.patchLoadJson();

	console.log(`Running Foundry data migration...`);

	await getCliFiles(
		{
			dirs: params.dir,
			files: params.file,
			fnMutDefaultSelection: ({files}) => {
				files.push(
					...listJsonFiles("data")
						.filter(filename => isSiteFoundryFile(filename)),
				);
			},
		},
	)
		.pSerialAwaitMap(async ({path, json}) => {
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
