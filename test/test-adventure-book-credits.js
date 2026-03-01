import "../js/parser.js";
import "../js/utils.js";
import * as ut from "../node/util.js";
import {BLOCKLIST_SOURCES_CREDITS} from "../node/consts-credits.js";

async function main () {
	console.log(`##### Validating adventure/book credits #####`);

	const cnt = [
		{filename: "adventures.json", prop: "adventure"},
		{filename: "books.json", prop: "book"},
	]
		.map(({filename, prop}) => {
			const json = ut.readJson(`./data/${filename}`);

			const noCredits = json[prop]
				.filter(meta => {
					if (BLOCKLIST_SOURCES_CREDITS.has(meta.source)) return false;
					return meta.contents && !meta.contents.some(it => it.name === "Credits");
				});
			if (!noCredits.length) return 0;

			console.error(`\nMissing "Credits" chapters in "${filename}":\n${noCredits.map(meta => `\t${meta.id}`).join("\n")}`);
			return noCredits.length;
		})
		.sum();

	if (!cnt) console.log("Credits are as expected.");

	return true;
}

export default main();
