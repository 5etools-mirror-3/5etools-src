import "../js/parser.js";
import "../js/utils.js";
import * as ut from "../node/util.js";
import {Command} from "commander";

const program = new Command()
	.option("--verbose", `If credit-less image paths should be logged.`)
;

program.parse(process.argv);
const params = program.opts();

const getJoinedPaths = ({imagePathsNoCredits}) => {
	if (!params.verbose) return "";
	return `; paths were:\n${imagePathsNoCredits.map(it => `\t"${it}"`).join("\n")}\n\n`;
};

async function main () {
	console.log(`##### Validating adventure/book image credits #####`);

	const warnings = [];

	const walker = MiscUtil.getWalker({isNoModification: true, keyBlocklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLOCKLIST});

	[
		{filename: "adventures.json", prop: "adventure", dir: "adventure"},
		{filename: "books.json", prop: "book", dir: "book"},
	]
		.flatMap(({filename, prop, dir}) => ut.readJson(`./data/${filename}`)[prop]
			.map(({id}) => ({filename: `./data/${dir}/${dir}-${id.toLowerCase()}.json`})))
		.forEach(({filename}) => {
			const json = ut.readJson(filename);

			const cnts = {
				image: 0,
				imageWithCredits: 0,
			};
			const imagePathsNoCredits = [];

			const stack = [];
			walker.walk(
				json,
				{
					object: (obj) => {
						if (obj.type !== "image") return;

						cnts.image++;
						if (obj.credit) {
							cnts.imageWithCredits++;
							return;
						}

						imagePathsNoCredits.push(obj.href.path);
					},
				},
				null,
				stack,
			);

			if (cnts.image === cnts.imageWithCredits) return;

			const ptCntPct = `${cnts.imageWithCredits}/${cnts.image} (${((cnts.imageWithCredits / cnts.image) * 100).toFixed(2)}%)`;
			warnings.push(`Incomplete image credits ${ptCntPct.padStart(20, " ")} in "${filename}"${getJoinedPaths({imagePathsNoCredits})}`);
		});

	if (!warnings.length) return false;

	warnings.forEach(wrn => console.warn(wrn));

	return true;
}

export default main();
