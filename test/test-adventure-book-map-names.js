import "../js/parser.js";
import "../js/utils.js";
import "../js/render.js";
import * as ut from "../node/util.js";
import {CorpusMapImageExtractor} from "../js/foundry/foundry-maps.js";

const getJoinedWarnings = ({filename, warnings}) => {
	return `in "${filename}"\n${warnings.map(it => `\t${it}`).join("\n")}`;
};

let ixLogGroup = 0;
const logGroup = ({name, lines}) => {
	if (!lines.length) return;
	if (ixLogGroup++) console.log(`\n${"-".repeat(20)}`);

	console.log(`\n=== ${name} ===\n`);
	lines.forEach(wrn => console.warn(wrn));
};

async function main () {
	console.log(`##### Validating adventure/book map names #####`);

	const warnings = [];

	[
		{filename: "adventures.json", prop: "adventure", dir: "adventure"},
		{filename: "books.json", prop: "book", dir: "book"},
	]
		.flatMap(({filename, prop, dir}) => ut.readJson(`./data/${filename}`)[prop]
			.map(head => ({head, prop, filename: `./data/${dir}/${dir}-${head.id.toLowerCase()}.json`})))
		.forEach(({head, prop, filename}) => {
			const json = ut.readJson(filename);

			const {availableMaps} = new CorpusMapImageExtractor().getMutMapMeta({head, body: json, corpusType: prop});

			const entriesByName = {};
			Object.values(availableMaps)
				.forEach(urlToEntry => {
					Object.values(urlToEntry)
						.forEach(entry => {
							(entriesByName[entry.name] ||= []).push(entry);
						});
				});

			const withDuplicates = Object.entries(entriesByName)
				.filter(([, entries]) => entries.length > 1)
				.map(([name, entries]) => `${name} (${entries.map(entry => JSON.stringify(entry.href)).join(" / ")})`);
			if (!withDuplicates.length) return;

			warnings.push(`Found collision${withDuplicates.length === 1 ? "" : "s"} ${getJoinedWarnings({filename, warnings: withDuplicates})}`);
		});

	logGroup({name: "Map Name Collisions", lines: warnings});

	if (warnings.length) return false;

	return true;
}

export default main();
