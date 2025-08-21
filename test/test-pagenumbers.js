import * as ut from "../node/util.js";
import * as rl from "readline-sync";
import fs from "fs";
import "../js/parser.js";
import "../js/utils.js";
import {BLOCKLIST_SOURCES_PAGES} from "./util-test.js";

const BLOCKLIST_FILE_PREFIXES = [
	...ut.FILE_PREFIX_BLOCKLIST,
	"fluff-",

	"foundry-",
	"foundry.json",

	// specific files
	"makebrew-creature.json",
	"makecards.json",
	"characters.json",
	"converter.json",
];

const BLOCKLIST_KEYS = new Set([
	"_meta",
	"_test",
	"data",
	"itemProperty",
	"itemEntry",
	"lifeClass",
	"lifeBackground",
	"lifeTrinket",
	"cr",
	"monsterfeatures",
	"adventure",
	"book",
	"itemTypeAdditionalEntries",
	"legendaryGroup",
	"languageScript",
	"dragonMundaneItems",
]);

const BLOCKLIST_ENTITIES = {
	"monster": {
		[Parser.SRC_DoSI]: new Set([
			"Merrow Extortionist",
		]),
	},
};

const isBlocklistedEntity = ({prop, ent}) => {
	const source = SourceUtil.getEntitySource(ent);

	if (BLOCKLIST_SOURCES_PAGES.has(source)) return true;

	const set = MiscUtil.get(BLOCKLIST_ENTITIES, prop, source);
	if (!set) return false;

	if (set.has("*")) return true;
	if (set.has(ent.name)) return true;

	return false;
};

const isMissingPage = ({ent}) => {
	if (ent.inherits ? ent.inherits.page : ent.page) return false;
	if (ent._copy?._preserve?.page) return false;
	return true;
};

const doSaveMods = ({mods, json, file}) => {
	if (!mods) return;

	let answer = "";
	while (!["y", "n", "quit"].includes(answer)) {
		answer = rl.question(`Save file with ${mods} modification${mods === 1 ? "" : "s"}? [y/n/quit]`);
		if (answer === "y") {
			console.log(`Saving ${file}...`);
			fs.writeFileSync(file, CleanUtil.getCleanJson(json), "utf-8");
		} else if (answer === "quit") {
			process.exit(1);
		}
	}
};

const main = ({isModificationMode = false} = {}) => {
	console.log(`##### Checking for Missing Page Numbers #####`);

	const FILE_MAP = {};
	ut.listFiles({dir: `./data`, blocklistFilePrefixes: BLOCKLIST_FILE_PREFIXES})
		.forEach(file => {
			let mods = 0;

			const json = ut.readJson(file);
			Object.keys(json)
				.filter(k => !BLOCKLIST_KEYS.has(k))
				.forEach(prop => {
					const data = json[prop];
					if (!(data instanceof Array)) return;

					const entsNoPage = data
						.filter(ent => !isBlocklistedEntity({prop, ent}) && isMissingPage({ent}));

					if (entsNoPage.length && isModificationMode) {
						console.log(`${file}:`);
						console.log(`\t${entsNoPage.length} missing page number${entsNoPage.length === 1 ? "" : "s"}`);
					}

					entsNoPage
						.forEach(it => {
							const ident = `${prop.padEnd(20, " ")} ${SourceUtil.getEntitySource(it).padEnd(32, " ")} ${it.name}`;

							if (!isModificationMode) {
								const list = (FILE_MAP[file] = FILE_MAP[file] || []);
								list.push(ident);
								return;
							}

							console.log(`  ${ident}`);
							const page = rl.questionInt("  - Page = ");
							if (page) {
								it.page = page;
								mods++;
							}
						});
				});

			doSaveMods({mods, json, file});
		});

	const filesWithMissingPages = Object.keys(FILE_MAP);
	if (!filesWithMissingPages.length) {
		console.log(`Page numbers are as expected.`);
		return;
	}

	console.warn(`##### Files with Missing Page Numbers #####`);
	filesWithMissingPages.forEach(f => {
		console.warn(`${f}:`);
		FILE_MAP[f].forEach(it => console.warn(`\t${it}`));
	});
};

main();
