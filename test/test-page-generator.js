import fs from "fs";
import "../js/parser.js";
import "../js/utils.js";
import {PAGE_GENERATORS} from "../node/generate-pages/generate-pages-page-generator-config.js";

function main () {
	const htmlFiles = new Set(
		fs.readdirSync(".")
			.filter(fname => fname.endsWith(".html")),
	);

	PAGE_GENERATORS
		.forEach(generator => htmlFiles.delete(generator.getPage()));

	if (!htmlFiles.size) return console.log(`All pages have generators!`);

	console.warn(`Pages did not have generators:\n${Array.from(htmlFiles).sort(SortUtil.ascSortLower).map(it => `\t${it}`).join("\n")}`);
}

main();
