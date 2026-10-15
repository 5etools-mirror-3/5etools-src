import "../js/parser.js";
import "../js/utils.js";
import * as ut from "../node/util.js";

async function main () {
	console.log(`##### Validating adventure/book contents #####`);

	const errors = [];

	[
		{filename: "adventures.json", prop: "adventure", dir: "adventure"},
		{filename: "books.json", prop: "book", dir: "book"},
	].flatMap(({filename, prop, dir}) => ut.readJson(`./data/${filename}`)[prop]
		.map(({id, contents}) => ({filename: `./data/${dir}/${dir}-${id.toLowerCase()}.json`, id, contents, propData: `${prop}Data`})))
		.forEach(({filename, id, contents, propData}) => {
			const json = ut.readJson(filename);

			const corpus = json[propData]?.find(corpusData => corpusData.id === id);
			if (corpus?.data?.length === contents.length) return;

			errors.push(`Contents length did not match data length in "${filename}"`);
		});

	if (errors.length) {
		errors.forEach(err => console.error(err));
		return false;
	}

	return true;
}

const pMain = main();

if (import.meta.main && !(await pMain)) process.exitCode = 1;

export default pMain;
