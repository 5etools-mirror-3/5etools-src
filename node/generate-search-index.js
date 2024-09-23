import fs from "fs";
import {Command} from "commander";
import "../js/parser.js";
import "../js/utils.js";
import "../js/utils-ui.js";
import "../js/utils-config.js";
import "../js/render.js";
import "../js/render-dice.js";
import "../js/hist.js";
import "../js/filter.js";
import "../js/utils-brew.js";
import * as utS from "./util-search-index.js";
import {Timer} from "./util.js";

const program = new Command()
	.option("--partnered", `If the partnered content index is to be generated.`)
;

program.parse(process.argv);
const params = program.opts();

async function main () {
	const t = Timer.start();

	console.log("##### Creating primary index... #####");
	const index = await utS.UtilSearchIndex.pGetIndex();
	fs.writeFileSync("search/index.json", JSON.stringify(index), "utf8");
	console.log("##### Creating secondary index: Items... #####");
	const indexItems = await utS.UtilSearchIndex.pGetIndexAdditionalItem();
	fs.writeFileSync("search/index-item.json", JSON.stringify(indexItems), "utf8");
	console.log("##### Creating alternate index: Spells... #####");
	const indexAltSpells = await utS.UtilSearchIndex.pGetIndexAlternate("spell");
	fs.writeFileSync("search/index-alt-spell.json", JSON.stringify(indexAltSpells), "utf8");
	console.log("##### Creating Foundry index... #####");
	const indexFoundry = await utS.UtilSearchIndex.pGetIndexFoundry();
	fs.writeFileSync("search/index-foundry.json", JSON.stringify(indexFoundry), "utf8");

	if (params.partnered) {
		console.log("##### Creating partnered content index... #####");
		const indexPartnered = await utS.UtilSearchIndex.pGetIndexPartnered();
		fs.writeFileSync("search/index-partnered.json", JSON.stringify(indexPartnered), "utf8");
	}

	console.log(`Created indexes in ${Timer.stop(t)}`);
}

export default main();
