import fs from "fs";
import * as ut from "../node/util.js";

async function main () {
	console.log(`##### Validating language fonts #####`);

	const json = ut.readJson("./data/languages.json");
	const errors = [];

	json.languageScript.forEach(lang => {
		if (!lang.fonts?.length) return;

		lang.fonts
			.filter(path => !fs.existsSync(path))
			.forEach(path => errors.push(`languageScript "${lang.name}" font path "${path}" does not exist!`));
	});

	if (errors.length) {
		errors.forEach(err => console.error(`\t${err}`));
		return false;
	}

	return true;
}

export default main();
