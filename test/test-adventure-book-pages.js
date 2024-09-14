import "../js/parser.js";
import "../js/utils.js";
import * as ut from "../node/util.js";
import {BLOCKLIST_SOURCES_PAGES} from "./util-test.js";

function getErrorMonotonicallyIncreasing ({walker, filename, json, source}) {
	const stack = [];
	let pagePrev = -1;
	const errorsFile = [];

	walker.walk(
		json,
		{
			object: (obj) => {
				if (obj.page == null || typeof obj.page !== "number") return;
				if (obj.page < pagePrev) {
					const id = obj.id || [...stack].reverse().find(it => it.id)?.id;
					const name = obj.name || [...stack].reverse().find(it => it.name)?.name;
					errorsFile.push(`Previous page ${pagePrev} > ${obj.page}${id || name ? ` (at or near ${[id ? `id "${id}"` : "", name ? `name "${name}"` : ""].filter(Boolean).join("; ")})` : ""}`);
				}
				pagePrev = obj.page;
			},
		},
		null,
		stack,
	);

	if (!errorsFile.length) return null;

	return `Page numbers were not monotonically increasing in "${filename}":\n${errorsFile.map(err => `\t${err}\n`).join("")}\n`;
}

// TODO(Future) could e.g. objects; count pages; if ratio below threshold then error
function getErrorNoPages ({walker, filename, json, source}) {
	if (BLOCKLIST_SOURCES_PAGES.has(source)) return null;

	let hasPage = false;
	walker.walk(
		json,
		{
			object: (obj) => {
				if (obj.page != null && (typeof obj.page !== "number" || obj.page !== 0)) return hasPage = true;
			},
		},
	);
	if (hasPage) return null;

	return `No page numbers found in "${filename}"\n`;
}

async function main () {
	console.log(`##### Validating adventure/book page numbers #####`);

	const walker = MiscUtil.getWalker({isNoModification: true, isBreakOnReturn: true});

	const errors = [];

	[
		{filename: "adventures.json", prop: "adventure", dir: "adventure"},
		{filename: "books.json", prop: "book", dir: "book"},
	].flatMap(({filename, prop, dir}) => ut.readJson(`./data/${filename}`)[prop]
		.map(({id, source}) => ({
			filename: `./data/${dir}/${dir}-${id.toLowerCase()}.json`,
			source,
		})))
		.forEach(({filename, source}) => {
			const json = ut.readJson(filename);

			const errorMonotonicallyIncreasing = getErrorMonotonicallyIncreasing({walker, filename, json, source});
			if (errorMonotonicallyIncreasing) errors.push(errorMonotonicallyIncreasing);

			const errorNoPages = getErrorNoPages({walker, filename, json, source});
			if (errorNoPages) errors.push(errorNoPages);
		});

	if (errors.length) {
		errors.forEach(err => console.error(err));
		return false;
	}

	return true;
}

export default main();
