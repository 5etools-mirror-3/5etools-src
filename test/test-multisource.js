import * as ut from "../node/util.js";
import "../js/parser.js";
import "../js/utils.js";

const _MULTISOURCE_DIRS = [
	"bestiary",
	"spells",
];

function main () {
	console.log(`##### Testing multisource sources... #####`);

	const sourceIncorrect = [];

	_MULTISOURCE_DIRS.forEach(dir => {
		const indexPath = `./data/${dir}/index.json`;
		const indexPathFluff = `./data/${dir}/fluff-index.json`;

		const indexes = [
			ut.readJson(indexPath),
			ut.readJson(indexPathFluff),
		];

		indexes.forEach(index => {
			Object.entries(index)
				.forEach(([source, filename]) => {
					const json = ut.readJson(`./data/${dir}/${filename}`);
					Object.values(json)
						.forEach(arr => {
							if (!arr || !(arr instanceof Array)) return;

							arr.forEach(ent => {
								if (!ent.source || source === ent.source) return;
								sourceIncorrect.push(`${filename} :: ${ent.name} :: ${ent.source} -> ${source}`);
							});
						});
				});
		});
	});

	if (!sourceIncorrect.length) {
		console.log(`##### Multisource source test passed! #####`);
		return true;
	}

	console.error(`##### Multisource source test failed! #####\n${sourceIncorrect.map(it => `\t${it}`).join("\n")}`);
}

export default main();
